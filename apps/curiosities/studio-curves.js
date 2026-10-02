/* Studio: Curves. A Graph Editor for curiosities through time, beats on X.
   Each picked curiosity gets a curve of keys over the beats. Tangents follow Maya: auto, spline,
   linear, flat, stepped, clamped, plateau. A Dope Sheet row sits under the graph, a buffer curve
   keeps the last version ghosted, and infinity repeats a curve before and after its keys.
   Time Warp remaps output beats to input beats, Set Driven Key lets one curiosity drive another,
   and an additive layer rides on the base with a weight. Record samples the mouse, number keys
   or a MIDI controller into keys while the playhead runs. Send to board samples one value per panel.
   State is localStorage key curiosities-studio-curves-v1. */

(function () {
  if (!window.CuriosityStudio) return;

  const KEY = "curiosities-studio-curves-v1";
  const TANS = ["auto", "spline", "linear", "flat", "stepped", "clamped", "plateau"];
  const INFS = ["constant", "cycle", "oscillate"];
  const FAVOURITES = ["moveSpeed", "volume", "moveTemper", "stillness", "squash", "cutRate", "characterSpeed", "objectSpeed", "gesture", "contrast", "shotSize", "cameraCarry"];
  const COLORS = ["#c45c26", "#2f6b8a", "#2f6b3a", "#8a2f6b", "#b8892d", "#5a4a8a", "#6b6b2f", "#1c1712"];
  const W = 640;
  const H = 240;
  const PL = 36;
  const PR = 10;
  const PT = 10;
  const PB = 22;

  /* Only one Curves view is alive at a time; these survive redraws of the Studio. */
  let S = null;
  let api = null;
  let root = null;
  let sel = { target: "base", i: -1 };
  let drag = null;
  let play = null;
  let rec = null;
  const src = { mouse: 0.5, val: 0.5, midiStatus: "", learn: false, cc: null, midiOn: false };
  let globalsBound = false;

  function esc(s) {
    return api ? api.esc(s) : String(s == null ? "" : s);
  }

  /* ---------- curiosities ---------- */

  function def(id) {
    const c = (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []).find((x) => x.id === id);
    if (!c) return null;
    if (c.kind === "select" && c.options && c.options.length) {
      return { id, label: c.label, group: c.group, live: !!c.live, choice: true, options: c.options, min: 0, max: c.options.length - 1 };
    }
    if (c.kind === "range") {
      return { id, label: c.label, group: c.group, live: !!c.live, choice: false, min: Number(c.min) || 0, max: Number(c.max) || 5 };
    }
    return null;
  }

  function animatable() {
    return (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []).map((c) => def(c.id)).filter(Boolean);
  }

  function fmt(id, v) {
    const d = def(id);
    if (!d || v == null || isNaN(v)) return "—";
    if (d.choice) return d.options[Math.max(0, Math.min(d.max, Math.round(v)))];
    return (Math.round(v * 10) / 10).toString();
  }

  function snapValue(id, v) {
    const d = def(id);
    const r = Math.max(d.min, Math.min(d.max, Math.round(v)));
    return d.choice ? d.options[r] : r;
  }

  /* ---------- state ---------- */

  function k(t, v, tan) {
    return { t, v, tan: tan || "auto" };
  }

  function newCurve(id) {
    const d = def(id);
    const mid = (d.min + d.max) / 2;
    return { keys: [k(1, d.min), k(8, d.max), k(16, mid)], pre: "constant", post: "constant", layer: [], layerW: 1, layerMute: false, buffer: null };
  }

  function fresh() {
    const s = {
      beats: 16,
      bpm: 96,
      sel: ["moveSpeed", "volume"],
      active: "moveSpeed",
      curves: {},
      warp: { on: false, keys: [k(1, 1, "linear"), k(16, 16, "linear")], buffer: null },
      sdk: { on: false, driver: "volume", driven: "moveSpeed", pairs: [[1, 1], [5, 5]] },
      recSource: "mouse",
      recRate: 0.5,
    };
    s.curves.moveSpeed = { keys: [k(1, 1), k(6, 4), k(10, 2, "flat"), k(16, 5)], pre: "constant", post: "constant", layer: [], layerW: 1, layerMute: false, buffer: null };
    s.curves.volume = { keys: [k(1, 3), k(5, 1, "stepped"), k(9, 5, "linear"), k(16, 3)], pre: "constant", post: "constant", layer: [], layerW: 1, layerMute: false, buffer: null };
    return s;
  }

  function load() {
    const s = api.store(KEY).get(null);
    const f = fresh();
    if (!s || typeof s !== "object") return f;
    const out = Object.assign(f, s);
    out.curves = s.curves || {};
    out.sel = (out.sel || []).filter((id) => def(id));
    out.sel.forEach((id) => {
      if (!out.curves[id]) out.curves[id] = newCurve(id);
    });
    if (!out.sel.includes(out.active)) out.active = out.sel[0] || null;
    out.warp = Object.assign(f.warp, s.warp || {});
    out.sdk = Object.assign(f.sdk, s.sdk || {});
    return out;
  }

  function save() {
    api.store(KEY).set(S);
  }

  /* ---------- curve math ---------- */

  function slopes(keys) {
    return keys.map((key, i) => {
      const p = keys[i - 1];
      const n = keys[i + 1];
      const dl = p ? (key.v - p.v) / (key.t - p.t || 1) : null;
      const dr = n ? (n.v - key.v) / (n.t - key.t || 1) : null;
      const one = dl != null ? dl : dr != null ? dr : 0;
      const cr = p && n ? (n.v - p.v) / (n.t - p.t || 1) : one;
      const extreme = p && n && (key.v - p.v) * (n.v - key.v) <= 0;
      /* Keep a spline from overshooting its neighbours (Fritsch–Carlson limit). */
      const limited = (m) => {
        if (!p || !n) return m;
        const lim = 3 * Math.min(Math.abs(dl), Math.abs(dr));
        return Math.max(-lim, Math.min(lim, m));
      };
      let m;
      switch (key.tan) {
        case "linear":
          return { inM: dl != null ? dl : one, outM: dr != null ? dr : one };
        case "flat":
        case "stepped":
          m = 0;
          break;
        case "spline":
          m = cr;
          break;
        case "clamped":
          m = (p && Math.abs(p.v - key.v) < 1e-6) || (n && Math.abs(n.v - key.v) < 1e-6) ? 0 : cr;
          break;
        case "plateau":
          m = !p || !n || extreme ? 0 : limited(cr);
          break;
        default:
          /* auto: smooth, flat on a peak or a valley, never overshoots */
          m = extreme ? 0 : limited(cr);
      }
      return { inM: m, outM: m };
    });
  }

  function evalKeys(keys, pre, post, t, sl) {
    if (!keys || !keys.length) return null;
    if (keys.length === 1) return keys[0].v;
    const t0 = keys[0].t;
    const tn = keys[keys.length - 1].t;
    const span = tn - t0;
    if (t < t0) {
      if (pre === "constant" || span <= 0) return keys[0].v;
      const d = t0 - t;
      const r = d % span;
      const n = Math.floor(d / span);
      t = pre === "cycle" ? tn - r : n % 2 === 0 ? t0 + r : tn - r;
    } else if (t > tn) {
      if (post === "constant" || span <= 0) return keys[keys.length - 1].v;
      const d = t - tn;
      const r = d % span;
      const n = Math.floor(d / span);
      t = post === "cycle" ? t0 + r : n % 2 === 0 ? tn - r : t0 + r;
    }
    sl = sl || slopes(keys);
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[i];
    const b = keys[i + 1];
    if (a.tan === "stepped") return t >= b.t ? b.v : a.v;
    const dt = b.t - a.t || 1;
    const s = Math.max(0, Math.min(1, (t - a.t) / dt));
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * a.v + (s3 - 2 * s2 + s) * dt * sl[i].outM + (-2 * s3 + 3 * s2) * b.v + (s3 - s2) * dt * sl[i + 1].inM;
  }

  function warpBeat(b) {
    if (!S.warp.on || S.warp.keys.length < 1) return b;
    return evalKeys(S.warp.keys, "constant", "constant", b);
  }

  /* Base plus the weighted additive layer, at an input beat. */
  function raw(id, t, depth) {
    const c = S.curves[id];
    if (!c) return null;
    let v = evalKeys(c.keys, c.pre, c.post, t);
    if (v == null) return null;
    if (c.layer.length && !c.layerMute) v += c.layerW * (evalKeys(c.layer, c.pre, c.post, t) || 0);
    const sd = S.sdk;
    if (sd.on && sd.driven === id && sd.driver !== id && S.curves[sd.driver] && sd.pairs.length && !(depth > 2)) {
      const dv = raw(sd.driver, t, (depth || 0) + 1);
      if (dv != null) v = driven(dv);
    }
    return v;
  }

  function driven(dv) {
    const pairs = S.sdk.pairs.slice().sort((a, b) => a[0] - b[0]);
    if (dv <= pairs[0][0]) return pairs[0][1];
    for (let i = 0; i < pairs.length - 1; i++) {
      const [x0, y0] = pairs[i];
      const [x1, y1] = pairs[i + 1];
      if (dv <= x1) return x1 === x0 ? y1 : y0 + ((dv - x0) / (x1 - x0)) * (y1 - y0);
    }
    return pairs[pairs.length - 1][1];
  }

  /* The value a curiosity has at an output beat: time warp, then curve, layer and driven key. */
  function finalValue(id, b) {
    const d = def(id);
    const v = raw(id, warpBeat(b));
    if (v == null || !d) return null;
    return Math.max(d.min, Math.min(d.max, v));
  }

  /* ---------- the edited target ---------- */

  function targetKeys(target) {
    target = target || sel.target;
    if (target === "warp") return S.warp.keys;
    const c = S.curves[S.active];
    if (!c) return null;
    return target === "layer" ? c.layer : c.keys;
  }

  function setTargetKeys(keys) {
    if (sel.target === "warp") S.warp.keys = keys;
    else if (S.curves[S.active]) {
      if (sel.target === "layer") S.curves[S.active].layer = keys;
      else S.curves[S.active].keys = keys;
    }
  }

  function bufferHolder() {
    if (sel.target === "warp") return S.warp;
    const c = S.curves[S.active];
    if (!c) return null;
    if (!c.buffers) c.buffers = {};
    return { get buffer() { return sel.target === "layer" ? c.buffers.layer : c.buffer; }, set buffer(v) { if (sel.target === "layer") c.buffers.layer = v; else c.buffer = v; } };
  }

  function snapshot() {
    const h = bufferHolder();
    const keys = targetKeys();
    if (h && keys) h.buffer = keys.map((x) => Object.assign({}, x));
  }

  function domain() {
    if (sel.target === "warp") return { lo: 1, hi: S.beats, step: 0 };
    const d = def(S.active);
    if (!d) return { lo: 0, hi: 1, step: 0 };
    if (sel.target === "layer") {
      const span = d.max - d.min || 1;
      return { lo: -span, hi: span, step: d.choice ? 1 : 0 };
    }
    return { lo: d.min, hi: d.max, step: d.choice ? 1 : 0 };
  }

  function X(t) {
    return PL + ((t - 1) / (S.beats - 1)) * (W - PL - PR);
  }
  function T(x) {
    return 1 + ((x - PL) / (W - PL - PR)) * (S.beats - 1);
  }
  function Y(v, dom) {
    const pad = (dom.hi - dom.lo) * 0.06 || 0.5;
    return PT + (1 - (v - (dom.lo - pad)) / (dom.hi - dom.lo + 2 * pad)) * (H - PT - PB);
  }
  function V(y, dom) {
    const pad = (dom.hi - dom.lo) * 0.06 || 0.5;
    return dom.lo - pad + (1 - (y - PT) / (H - PT - PB)) * (dom.hi - dom.lo + 2 * pad);
  }

  function pathFor(fn, dom) {
    const n = 320;
    let d = "";
    let pen = false;
    for (let i = 0; i <= n; i++) {
      const t = 1 + (i / n) * (S.beats - 1);
      const v = fn(t);
      if (v == null || isNaN(v)) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${X(t).toFixed(1)},${Y(v, dom).toFixed(1)}`;
      pen = true;
    }
    return d;
  }

  /* ---------- drawing ---------- */

  function colorOf(id) {
    const i = S.sel.indexOf(id);
    return COLORS[(i < 0 ? 0 : i) % COLORS.length];
  }

  function graphSvg() {
    const dom = domain();
    const keys = targetKeys() || [];
    const c = S.curves[S.active];
    const parts = [];
    /* grid */
    for (let b = 1; b <= S.beats; b++) {
      parts.push(`<line x1="${X(b)}" y1="${PT}" x2="${X(b)}" y2="${H - PB}" stroke="var(--line)"/>`);
      parts.push(`<text x="${X(b)}" y="${H - 6}" text-anchor="middle" class="cv-ax">${b}</text>`);
    }
    const d = def(S.active);
    const ticks = [];
    if (sel.target === "warp") for (let b = 1; b <= S.beats; b += 3) ticks.push([b, String(b)]);
    else if (d && d.choice && sel.target === "base") d.options.forEach((o, i) => ticks.push([i, o]));
    else {
      const n = 4;
      for (let i = 0; i <= n; i++) {
        const v = dom.lo + (i / n) * (dom.hi - dom.lo);
        ticks.push([v, String(Math.round(v * 10) / 10)]);
      }
    }
    ticks.forEach(([v, l]) => {
      parts.push(`<line x1="${PL}" y1="${Y(v, dom)}" x2="${W - PR}" y2="${Y(v, dom)}" stroke="var(--line)" stroke-dasharray="2 3"/>`);
      parts.push(`<text x="${PL - 4}" y="${Y(v, dom) + 3}" text-anchor="end" class="cv-ax">${esc(String(l).slice(0, 6))}</text>`);
    });
    if (sel.target === "base") {
      /* other curves, faint and normalised into this graph's range */
      S.sel.forEach((id) => {
        if (id === S.active) return;
        const o = def(id);
        const p = pathFor((t) => {
          const v = finalValue(id, t);
          return v == null ? null : dom.lo + ((v - o.min) / (o.max - o.min || 1)) * (dom.hi - dom.lo);
        }, dom);
        parts.push(`<path d="${p}" fill="none" stroke="${colorOf(id)}" stroke-opacity="0.25" stroke-width="1.5"/>`);
      });
    }
    /* buffer curve */
    const h = bufferHolder();
    if (h && h.buffer && h.buffer.length) {
      const bk = h.buffer;
      const sl = slopes(bk);
      const pre = sel.target === "warp" ? "constant" : c ? c.pre : "constant";
      const post = sel.target === "warp" ? "constant" : c ? c.post : "constant";
      parts.push(`<path d="${pathFor((t) => evalKeys(bk, pre, post, t, sl), dom)}" fill="none" stroke="#1c1712" stroke-opacity="0.3" stroke-dasharray="4 4" stroke-width="1.5"/>`);
    }
    if (sel.target === "warp") {
      parts.push(`<path d="M${X(1)},${Y(1, dom)}L${X(S.beats)},${Y(S.beats, dom)}" stroke="#1c1712" stroke-opacity="0.2" stroke-dasharray="1 4" fill="none"/>`);
    }
    /* result line: what the board will get */
    if (sel.target === "base" && S.active) {
      parts.push(`<path d="${pathFor((t) => finalValue(S.active, t), dom)}" fill="none" stroke="${colorOf(S.active)}" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/>`);
    }
    /* the edited curve itself, with infinity drawn dashed beyond its keys */
    if (keys.length) {
      const pre = sel.target === "warp" ? "constant" : c.pre;
      const post = sel.target === "warp" ? "constant" : c.post;
      const sl = slopes(keys);
      const t0 = keys[0].t;
      const tn = keys[keys.length - 1].t;
      const inside = pathFor((t) => (t >= t0 && t <= tn ? evalKeys(keys, pre, post, t, sl) : null), dom);
      const outside = pathFor((t) => (t < t0 || t > tn ? evalKeys(keys, pre, post, t, sl) : null), dom);
      const col = sel.target === "warp" ? "#2f6b8a" : sel.target === "layer" ? "#8a2f6b" : "#1c1712";
      parts.push(`<path d="${outside}" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="5 4"/>`);
      parts.push(`<path d="${inside}" fill="none" stroke="${col}" stroke-width="2"/>`);
      /* tangent handles on the selected key */
      const si = sel.i;
      if (keys[si]) {
        const key = keys[si];
        const len = 0.7;
        const hx = (m, dir) => `${X(key.t + dir * len)},${Y(key.v + dir * len * m, dom)}`;
        if (key.tan !== "stepped") {
          parts.push(`<path d="M${hx(sl[si].inM, -1)}L${X(key.t)},${Y(key.v, dom)}L${hx(sl[si].outM, 1)}" fill="none" stroke="var(--gold)" stroke-width="1.5"/>`);
        }
      }
      keys.forEach((key, i) => {
        const on = i === sel.i;
        const shape = key.tan === "stepped" ? `<rect x="${X(key.t) - 5}" y="${Y(key.v, dom) - 5}" width="10" height="10"` : `<circle cx="${X(key.t)}" cy="${Y(key.v, dom)}" r="${on ? 6 : 5}"`;
        parts.push(`<circle cx="${X(key.t)}" cy="${Y(key.v, dom)}" r="14" fill="transparent" data-key="${i}"/>`);
        parts.push(`${shape} data-key="${i}" class="cv-key${on ? " on" : ""}" fill="${on ? "var(--saffron)" : "white"}" stroke="${col}" stroke-width="2"/>`);
      });
    }
    parts.push(`<line id="cv-head" x1="-10" y1="${PT}" x2="-10" y2="${H - PB}" stroke="var(--saffron)" stroke-width="2"/>`);
    return `<svg id="cv-graph" class="cv-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph editor">${parts.join("")}</svg>`;
  }

  function dopeSvg() {
    const rowH = 18;
    const rows = S.sel.length + (S.warp.on ? 1 : 0);
    const h = Math.max(1, rows) * rowH + 4;
    const parts = [];
    for (let b = 1; b <= S.beats; b++) parts.push(`<line x1="${X(b)}" y1="0" x2="${X(b)}" y2="${h}" stroke="var(--line)"/>`);
    S.sel.forEach((id, r) => {
      const y = r * rowH + 2;
      const on = id === S.active;
      if (on) parts.push(`<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="rgba(184,137,45,0.14)"/>`);
      parts.push(`<text x="4" y="${y + 13}" class="cv-ax" style="text-anchor:start">${esc(id.slice(0, 5))}</text>`);
      const c = S.curves[id];
      c.keys.forEach((key, i) => {
        parts.push(`<rect data-dope="${esc(id)}" data-i="${i}" x="${X(key.t) - 4}" y="${y + 4}" width="8" height="${rowH - 8}" fill="${on && sel.target === "base" && sel.i === i ? "var(--saffron)" : colorOf(id)}"/>`);
      });
      c.layer.forEach((key) => {
        parts.push(`<rect x="${X(key.t) - 2}" y="${y + rowH - 5}" width="4" height="4" fill="#8a2f6b"/>`);
      });
    });
    if (S.warp.on) {
      const y = S.sel.length * rowH + 2;
      parts.push(`<text x="4" y="${y + 13}" class="cv-ax" style="text-anchor:start">warp</text>`);
      S.warp.keys.forEach((key) => parts.push(`<rect x="${X(key.t) - 4}" y="${y + 4}" width="8" height="${rowH - 8}" fill="#2f6b8a"/>`));
    }
    parts.push(`<line id="cv-head2" x1="-10" y1="0" x2="-10" y2="${h}" stroke="var(--saffron)" stroke-width="2"/>`);
    return `<svg id="cv-dope" class="cv-dope" viewBox="0 0 ${W} ${h}" role="img" aria-label="Dope sheet">${parts.join("")}</svg>`;
  }

  function sdkSvg() {
    const sd = S.sdk;
    const dd = def(sd.driver);
    const nd = def(sd.driven);
    if (!dd || !nd || !S.curves[sd.driver]) return "";
    const w = 300;
    const h = 70;
    const xs = (b) => 4 + ((b - 1) / (S.beats - 1)) * (w - 8);
    const line = (fn, lo, hi) => {
      let d = "";
      for (let i = 0; i <= 100; i++) {
        const b = 1 + (i / 100) * (S.beats - 1);
        const v = fn(b);
        if (v == null) continue;
        d += `${d ? "L" : "M"}${xs(b).toFixed(1)},${(h - 4 - ((v - lo) / (hi - lo || 1)) * (h - 8)).toFixed(1)}`;
      }
      return d;
    };
    const drv = line((b) => finalValue(sd.driver, b), dd.min, dd.max);
    const res = line((b) => {
      const dv = raw(sd.driver, warpBeat(b));
      return dv == null ? null : Math.max(nd.min, Math.min(nd.max, driven(dv)));
    }, nd.min, nd.max);
    return `<svg class="cv-sdk" viewBox="0 0 ${w} ${h}" role="img" aria-label="Driven curve"><path d="${drv}" fill="none" stroke="${colorOf(sd.driver)}" stroke-opacity="0.35" stroke-width="1.5"/><path d="${res}" fill="none" stroke="var(--saffron)" stroke-width="2"/></svg>`;
  }

  function chipsHtml(b) {
    return S.sel
      .map((id) => {
        const v = finalValue(id, b);
        return `<span class="chip${id === S.active ? " lit" : ""}" style="${id === S.active ? "" : `border-color:${colorOf(id)}`}">${esc(def(id).label)}: ${esc(fmt(id, v))}</span>`;
      })
      .join("");
  }

  function options(list, cur) {
    return list.map((x) => `<option value="${esc(x[0])}"${String(x[0]) === String(cur) ? " selected" : ""}>${esc(x[1])}</option>`).join("");
  }

  function pickerOptions() {
    const all = animatable().filter((d) => !S.sel.includes(d.id));
    const fav = FAVOURITES.map((id) => all.find((d) => d.id === id)).filter(Boolean);
    const groups = {};
    all.forEach((d) => (groups[d.group] = groups[d.group] || []).push(d));
    const o = (d) => `<option value="${esc(d.id)}">${esc(d.label)}${d.choice ? " (steps)" : ` (${d.min}–${d.max})`}${d.live ? " · board" : ""}</option>`;
    return `<option value="">Add a curiosity…</option><optgroup label="Good to start">${fav.map(o).join("")}</optgroup>${Object.keys(groups)
      .map((g) => `<optgroup label="${esc(g)}">${groups[g].map(o).join("")}</optgroup>`)
      .join("")}`;
  }

  function keyPanel() {
    const keys = targetKeys() || [];
    const key = keys[sel.i];
    const dom = domain();
    const what = sel.target === "warp" ? "Time warp" : sel.target === "layer" ? "Layer" : "Base";
    if (!key) return `<p class="cap">${esc(what)}: click empty graph space to add a key. Click a key to select it, drag to move it.</p>`;
    const valueField =
      sel.target === "base" && def(S.active) && def(S.active).choice
        ? `<select data-kv="v">${options(def(S.active).options.map((o, i) => [i, o]), Math.round(key.v))}</select>`
        : `<input type="number" data-kv="v" step="0.1" min="${dom.lo}" max="${dom.hi}" value="${Math.round(key.v * 100) / 100}">`;
    return `<div class="cv-row">
        <label class="field">Beat<input type="number" data-kv="t" step="0.25" min="1" max="${S.beats}" value="${key.t}"></label>
        <label class="field">Value${valueField}</label>
      </div>
      <label class="field">Tangent<select data-kv="tan">${options(TANS.map((t) => [t, t]), key.tan)}</select></label>
      <div class="bar-actions"><button type="button" data-act="del-key">Delete key</button>
      <button type="button" data-act="tan-all">Tangent to all keys</button></div>`;
  }

  function render() {
    if (!root) return;
    const c = S.curves[S.active];
    const d = def(S.active);
    const sd = S.sdk;
    const curveOpts = S.sel.map((id) => [id, def(id).label]);
    const live = S.sel.filter((id) => def(id).live);
    const notLive = S.sel.filter((id) => !def(id).live);
    root.innerHTML = `<div class="studio-grid cv">
      <div class="cv-side">
        <div class="g">Curves</div>
        <label class="field">Animate<select id="cv-add">${pickerOptions()}</select></label>
        <div class="cv-chips">${S.sel
          .map((id) => `<span class="chip cv-pick${id === S.active ? " lit" : ""}" style="${id === S.active ? "" : `border-color:${colorOf(id)};color:${colorOf(id)}`}"><button type="button" data-pick="${esc(id)}">${esc(def(id).label)}</button><button type="button" data-drop="${esc(id)}" aria-label="Remove ${esc(def(id).label)}">×</button></span>`)
          .join("")}</div>
        ${d ? `<p class="cap">${esc(d.label)}: ${d.choice ? esc(d.options.join(" · ")) + " as steps 0–" + d.max : esc(d.min + " to " + d.max)}${d.live ? ". On the board." : ". Not a board control; it can still drive or be studied."}</p>` : ""}

        <div class="g">Selected key</div>
        ${keyPanel()}

        ${c ? `<div class="g">Infinity</div>
        <div class="cv-row">
          <label class="field">Before<select data-inf="pre">${options(INFS.map((x) => [x, x]), c.pre)}</select></label>
          <label class="field">After<select data-inf="post">${options(INFS.map((x) => [x, x]), c.post)}</select></label>
        </div>` : ""}

        <div class="g">Buffer curve</div>
        <p class="cap">The dashed ghost is the curve before your last edit.</p>
        <div class="bar-actions"><button type="button" data-act="buf-snap">Snapshot</button><button type="button" data-act="buf-swap">Swap</button><button type="button" data-act="buf-clear">Clear ghost</button></div>

        ${c ? `<div class="g">Animation layer</div>
        <p class="cap">Base plus one additive layer. Edit "Layer" above the graph to key offsets.</p>
        <label class="field">Layer weight ${Math.round(c.layerW * 100)}%<input type="range" id="cv-lw" min="0" max="1" step="0.05" value="${c.layerW}"></label>
        <div class="bar-actions"><label class="cap"><input type="checkbox" id="cv-lmute"${c.layerMute ? " checked" : ""}> Mute layer</label><button type="button" data-act="layer-clear">Clear layer</button><button type="button" data-act="layer-merge">Merge down</button></div>` : ""}

        <div class="g">Set Driven Key</div>
        <p class="cap">A proximity: when the driver reaches X, the driven curiosity follows to Y in the same beat.</p>
        <label class="cap"><input type="checkbox" id="cv-sdk-on"${sd.on ? " checked" : ""}> Driven key on</label>
        <div class="cv-row">
          <label class="field">Driver<select id="cv-sdk-driver">${options(curveOpts, sd.driver)}</select></label>
          <label class="field">Driven<select id="cv-sdk-driven">${options(curveOpts, sd.driven)}</select></label>
        </div>
        <table class="trace"><thead><tr><th>When driver</th><th>Driven follows</th><th></th></tr></thead><tbody>${sd.pairs
          .map((p, i) => `<tr><td>${esc(fmt(sd.driver, p[0]))}</td><td>${esc(fmt(sd.driven, p[1]))}</td><td><button type="button" class="link" data-pair-del="${i}">remove</button></td></tr>`)
          .join("")}</tbody></table>
        <div class="cv-row">
          <label class="field">Driver value<input type="number" id="cv-sdk-x" step="0.5" value="${def(sd.driver) ? def(sd.driver).min : 0}"></label>
          <label class="field">Driven value<input type="number" id="cv-sdk-y" step="0.5" value="${def(sd.driven) ? def(sd.driven).max : 0}"></label>
        </div>
        <div class="bar-actions"><button type="button" data-act="sdk-add">Set key</button><button type="button" data-act="sdk-here">Set from playhead</button></div>
        ${sdkSvg()}
        ${sd.on && sd.driver === sd.driven ? `<p class="cap">Pick two different curiosities.</p>` : ""}

        <div class="g">Time Warp</div>
        <p class="cap">Maps each output beat to the beat it reads. Below the diagonal slows the performance, above speeds it.</p>
        <label class="cap"><input type="checkbox" id="cv-warp-on"${S.warp.on ? " checked" : ""}> Time warp on</label>
        <div class="bar-actions">${[
          ["identity", "Even"],
          ["slowin", "Slow in"],
          ["rush", "Rush"],
          ["half", "Half speed"],
          ["double", "Twice through"],
        ]
          .map((p) => `<button type="button" data-warp="${p[0]}">${p[1]}</button>`)
          .join("")}</div>
      </div>

      <div class="cv-main">
        <div class="bar-actions cv-tool">
          <nav class="subtabs cv-target">${[
            ["base", "Base"],
            ["layer", "Layer"],
            ["warp", "Time warp"],
          ]
            .map((x) => `<button type="button" data-target="${x[0]}" class="${sel.target === x[0] ? "on" : ""}">${x[1]}</button>`)
            .join("")}</nav>
        </div>
        ${S.active || sel.target === "warp" ? graphSvg() : `<p class="cap">Add a curiosity to animate.</p>`}
        <p class="cap cv-legend">Thick pale line: what plays (warp, layer and driven key included). Dark line: the keys you edit. Dashed beyond the keys: infinity. Dashed ghost: buffer.</p>
        <div class="g">Dope Sheet</div>
        ${dopeSvg()}
        <div class="bar-actions cv-play">
          <button type="button" data-act="play">${play ? "Stop" : "Play"}</button>
          <label class="field cv-small">BPM<input type="number" id="cv-bpm" min="20" max="300" value="${S.bpm}"></label>
          <label class="field cv-small">Beats<select id="cv-beats">${options([8, 12, 16].map((n) => [n, n]), S.beats)}</select></label>
          <span class="mono" id="cv-beat">beat —</span>
        </div>
        <div id="cv-chips">${chipsHtml(play ? play.b : 1)}</div>

        <div class="g">Record</div>
        <div class="bar-actions cv-play">
          <label class="field cv-small">Source<select id="cv-src">${options(
            [
              ["mouse", "Mouse height over graph"],
              ["keys", "Number keys 1–5"],
              ["midi", "MIDI controller"],
            ],
            S.recSource
          )}</select></label>
          <label class="field cv-small">Key every<select id="cv-rate">${options(
            [
              [1, "beat"],
              [0.5, "half beat"],
              [0.25, "quarter beat"],
            ],
            S.recRate
          )}</select></label>
          <button type="button" data-act="rec" class="${rec ? "cv-rec on" : "cv-rec"}">${rec ? "Stop recording" : "● Record"}</button>
        </div>
        ${S.recSource === "midi" ? `<div class="bar-actions"><button type="button" data-act="midi">${src.midiOn ? "MIDI connected" : "Connect MIDI"}</button><button type="button" data-act="learn" class="${src.learn ? "chip-btn on" : ""}">${src.learn ? "Move a control…" : "Learn CC"}</button><span class="cap" id="cv-midi">${esc(src.midiStatus || (src.cc != null ? "Listening to CC " + src.cc : "Any CC or note velocity"))}</span></div>` : ""}
        <p class="cap">Recording plays from beat 1 and writes a key into ${esc(d ? d.label : "the active curve")} at each step, over what was there.</p>

        <div class="g">Send to board</div>
        <p class="cap">${live.length ? `Samples ${esc(live.map((id) => def(id).label).join(", "))} at each board panel.` : "None of these curves is a board control."}${notLive.length ? ` Not on the board: ${esc(notLive.map((id) => def(id).label).join(", "))}.` : ""}</p>
        <div class="bar-actions"><button type="button" data-act="send"${live.length ? "" : " disabled"}>Send to board</button><span class="mono" id="cv-preview">${esc(preview())}</span></div>
      </div>
    </div>`;
    bind();
    paintHead(play ? play.b : null);
  }

  /* ---------- board ---------- */

  function panelCount() {
    try {
      const v = api.board && api.board.values ? Number(api.board.values().angleCount) : 0;
      return v >= 1 ? v : 4;
    } catch (e) {
      return 4;
    }
  }

  function boardValues() {
    const n = panelCount();
    const out = {};
    S.sel.forEach((id) => {
      if (!def(id).live) return;
      const vals = [];
      for (let p = 0; p < n; p++) {
        const b = n === 1 ? 1 : 1 + (p * (S.beats - 1)) / (n - 1);
        const v = finalValue(id, b);
        vals.push(snapValue(id, v == null ? def(id).min : v));
      }
      out[id] = vals;
    });
    return out;
  }

  function preview() {
    const v = boardValues();
    const ids = Object.keys(v);
    if (!ids.length) return "";
    return `${panelCount()} panels · ` + ids.map((id) => `${id}: ${v[id].join(" / ")}`).join(" · ");
  }

  /* ---------- editing ---------- */

  function svgPoint(svg, e) {
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return { x: ((e.clientX - r.left) / r.width) * vb.width, y: ((e.clientY - r.top) / r.height) * vb.height };
  }

  function snapT(t) {
    return Math.max(1, Math.min(S.beats, Math.round(t * 4) / 4));
  }

  function snapV(v) {
    const dom = domain();
    v = Math.max(dom.lo, Math.min(dom.hi, v));
    if (sel.target === "warp") return Math.round(v * 4) / 4;
    return dom.step ? Math.round(v) : Math.round(v * 100) / 100;
  }

  /* Insert or replace a key at a beat; returns its index after sorting. */
  function putKey(keys, key) {
    const same = keys.findIndex((x) => Math.abs(x.t - key.t) < 1e-6);
    if (same >= 0) keys.splice(same, 1);
    keys.push(key);
    keys.sort((a, b) => a.t - b.t);
    return keys.indexOf(key);
  }

  function redrawGraph() {
    const g = root && root.querySelector("#cv-graph");
    if (!g) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = graphSvg();
    g.innerHTML = tmp.firstChild.innerHTML;
    const ds = root.querySelector("#cv-dope");
    if (ds) {
      tmp.innerHTML = dopeSvg();
      ds.replaceWith(tmp.firstChild);
      bindDope();
    }
    paintHead(play ? play.b : null);
  }

  function bindGraph() {
    const g = root.querySelector("#cv-graph");
    if (!g) return;
    g.addEventListener("pointermove", (e) => {
      const p = svgPoint(g, e);
      src.mouse = Math.max(0, Math.min(1, 1 - (p.y - PT) / (H - PT - PB)));
      if (!drag) return;
      const keys = targetKeys();
      const key = keys[drag.i];
      if (!key) return;
      if (!drag.moved) {
        drag.moved = true;
        snapshot();
      }
      key.t = snapT(T(p.x));
      key.v = snapV(V(p.y, domain()));
      keys.sort((a, b) => a.t - b.t);
      /* two keys on one beat: nudge the dragged one off */
      const i = keys.indexOf(key);
      if ((keys[i - 1] && keys[i - 1].t === key.t) || (keys[i + 1] && keys[i + 1].t === key.t)) key.t = snapT(key.t + (keys[i - 1] && keys[i - 1].t === key.t ? 0.25 : -0.25));
      keys.sort((a, b) => a.t - b.t);
      drag.i = keys.indexOf(key);
      sel.i = drag.i;
      redrawGraph();
    });
    g.addEventListener("pointerdown", (e) => {
      const keys = targetKeys();
      if (!keys) return;
      const hit = e.target.closest ? e.target.closest("[data-key]") : null;
      if (hit) {
        sel.i = Number(hit.dataset.key);
        drag = { i: sel.i, moved: false };
      } else {
        const p = svgPoint(g, e);
        if (p.x < PL - 4 || p.y > H - PB + 4) return;
        snapshot();
        const t = snapT(T(p.x));
        const v = snapV(V(p.y, domain()));
        sel.i = putKey(keys, k(t, v, sel.target === "warp" ? "linear" : "auto"));
        drag = { i: sel.i, moved: true };
      }
      try {
        g.setPointerCapture(e.pointerId);
      } catch (err) {}
      e.preventDefault();
      redrawGraph();
    });
    const end = () => {
      if (!drag) return;
      drag = null;
      save();
      render();
    };
    g.addEventListener("pointerup", end);
    g.addEventListener("pointercancel", end);
  }

  function bindDope() {
    root.querySelectorAll("[data-dope]").forEach((r) =>
      r.addEventListener("click", () => {
        S.active = r.dataset.dope;
        sel = { target: "base", i: Number(r.dataset.i) };
        save();
        render();
      })
    );
  }

  function deleteKey() {
    const keys = targetKeys();
    if (!keys || !keys[sel.i]) return;
    if (sel.target === "warp" && keys.length <= 1) return;
    snapshot();
    keys.splice(sel.i, 1);
    sel.i = Math.min(sel.i, keys.length - 1);
    save();
    render();
  }

  const WARPS = {
    identity: () => [k(1, 1, "linear"), k(S.beats, S.beats, "linear")],
    slowin: () => [k(1, 1, "flat"), k(S.beats, S.beats, "spline")],
    rush: () => [k(1, 1, "spline"), k(Math.round(S.beats / 2), Math.round(S.beats * 0.8), "auto"), k(S.beats, S.beats, "flat")],
    half: () => [k(1, 1, "linear"), k(S.beats, (S.beats + 1) / 2, "linear")],
    double: () => [k(1, 1, "linear"), k((S.beats + 1) / 2, S.beats, "stepped"), k((S.beats + 1) / 2 + 0.25, 1, "linear"), k(S.beats, S.beats, "linear")],
  };

  function act(a) {
    const c = S.curves[S.active];
    if (a === "del-key") return deleteKey();
    if (a === "tan-all") {
      const keys = targetKeys();
      const key = keys && keys[sel.i];
      if (!key) return;
      snapshot();
      keys.forEach((x) => (x.tan = key.tan));
    } else if (a === "buf-snap") snapshot();
    else if (a === "buf-swap") {
      const h = bufferHolder();
      if (!h || !h.buffer) return;
      const cur = targetKeys().map((x) => Object.assign({}, x));
      setTargetKeys(h.buffer.map((x) => Object.assign({}, x)));
      h.buffer = cur;
      sel.i = -1;
    } else if (a === "buf-clear") {
      const h = bufferHolder();
      if (h) h.buffer = null;
    } else if (a === "layer-clear" && c) {
      c.layer = [];
    } else if (a === "layer-merge" && c && c.layer.length) {
      /* bake layer into base at each beat and each existing key */
      const ts = new Set(c.keys.map((x) => x.t));
      c.layer.forEach((x) => ts.add(x.t));
      const d = def(S.active);
      c.buffer = c.keys.map((x) => Object.assign({}, x));
      c.keys = [...ts]
        .sort((a, b) => a - b)
        .map((t) => {
          const base = evalKeys(c.keys, c.pre, c.post, t);
          const add = c.layerMute ? 0 : c.layerW * (evalKeys(c.layer, c.pre, c.post, t) || 0);
          return k(t, Math.max(d.min, Math.min(d.max, Math.round((base + add) * 100) / 100)), "auto");
        });
      c.layer = [];
      c.layerW = 1;
    } else if (a === "sdk-add" || a === "sdk-here") {
      let x;
      let y;
      if (a === "sdk-here") {
        const b = play ? play.b : 1;
        x = raw(S.sdk.driver, warpBeat(b));
        const cur = S.curves[S.sdk.driven];
        y = cur ? evalKeys(cur.keys, cur.pre, cur.post, warpBeat(b)) : null;
      } else {
        x = Number(root.querySelector("#cv-sdk-x").value);
        y = Number(root.querySelector("#cv-sdk-y").value);
      }
      if (x == null || y == null || isNaN(x) || isNaN(y)) return;
      x = Math.round(x * 100) / 100;
      S.sdk.pairs = S.sdk.pairs.filter((p) => p[0] !== x);
      S.sdk.pairs.push([x, y]);
      S.sdk.pairs.sort((p, q) => p[0] - q[0]);
    } else if (a === "play") {
      if (play) stop();
      else start(false);
      return;
    } else if (a === "rec") {
      if (rec) stop();
      else start(true);
      return;
    } else if (a === "midi") return midi();
    else if (a === "learn") {
      src.learn = !src.learn;
      if (!src.midiOn) midi();
    } else if (a === "send") {
      stop();
      const v = boardValues();
      if (Object.keys(v).length) api.toBoard("Curves", v);
      return;
    }
    save();
    render();
  }

  function bind() {
    bindGraph();
    bindDope();
    const q = (s) => root.querySelector(s);
    q("#cv-add").addEventListener("change", (e) => {
      const id = e.target.value;
      if (!id || !def(id)) return;
      if (!S.curves[id]) S.curves[id] = newCurve(id);
      S.sel.push(id);
      S.active = id;
      sel = { target: "base", i: -1 };
      save();
      render();
    });
    root.querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => {
        S.active = b.dataset.pick;
        sel = { target: sel.target === "warp" ? "base" : sel.target, i: -1 };
        save();
        render();
      })
    );
    root.querySelectorAll("[data-drop]").forEach((b) =>
      b.addEventListener("click", () => {
        S.sel = S.sel.filter((id) => id !== b.dataset.drop);
        if (S.active === b.dataset.drop) S.active = S.sel[0] || null;
        sel.i = -1;
        save();
        render();
      })
    );
    root.querySelectorAll("[data-target]").forEach((b) =>
      b.addEventListener("click", () => {
        sel = { target: b.dataset.target, i: -1 };
        if (sel.target === "warp") S.warp.on = true;
        save();
        render();
      })
    );
    root.querySelectorAll("[data-kv]").forEach((inp) =>
      inp.addEventListener("change", () => {
        const keys = targetKeys();
        const key = keys && keys[sel.i];
        if (!key) return;
        snapshot();
        const f = inp.dataset.kv;
        if (f === "tan") key.tan = inp.value;
        else if (f === "t") {
          const t = snapT(Number(inp.value));
          if (!keys.some((x) => x !== key && x.t === t)) key.t = t;
          keys.sort((a, b) => a.t - b.t);
          sel.i = keys.indexOf(key);
        } else key.v = snapV(Number(inp.value));
        save();
        render();
      })
    );
    root.querySelectorAll("[data-inf]").forEach((s) =>
      s.addEventListener("change", () => {
        S.curves[S.active][s.dataset.inf] = s.value;
        save();
        render();
      })
    );
    root.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
    root.querySelectorAll("[data-warp]").forEach((b) =>
      b.addEventListener("click", () => {
        sel = { target: "warp", i: -1 };
        snapshot();
        S.warp.keys = WARPS[b.dataset.warp]();
        S.warp.on = true;
        save();
        render();
      })
    );
    root.querySelectorAll("[data-pair-del]").forEach((b) =>
      b.addEventListener("click", () => {
        S.sdk.pairs.splice(Number(b.dataset.pairDel), 1);
        save();
        render();
      })
    );
    const lw = q("#cv-lw");
    if (lw) {
      lw.addEventListener("input", () => {
        S.curves[S.active].layerW = Number(lw.value);
        lw.parentNode.firstChild.textContent = `Layer weight ${Math.round(lw.value * 100)}% `;
        redrawGraph();
      });
      lw.addEventListener("change", () => {
        save();
        render();
      });
    }
    const chk = (id, fn) => {
      const el = q(id);
      if (el)
        el.addEventListener("change", () => {
          fn(el.checked);
          save();
          render();
        });
    };
    chk("#cv-lmute", (v) => (S.curves[S.active].layerMute = v));
    chk("#cv-sdk-on", (v) => (S.sdk.on = v));
    chk("#cv-warp-on", (v) => (S.warp.on = v));
    const val = (id, fn) => {
      const el = q(id);
      if (el)
        el.addEventListener("change", () => {
          fn(el.value);
          save();
          render();
        });
    };
    val("#cv-sdk-driver", (v) => {
      S.sdk.driver = v;
      S.sdk.pairs = [];
    });
    val("#cv-sdk-driven", (v) => {
      S.sdk.driven = v;
      S.sdk.pairs = [];
    });
    val("#cv-bpm", (v) => (S.bpm = Math.max(20, Math.min(300, Number(v) || 96))));
    val("#cv-beats", (v) => {
      const n = Number(v) || 16;
      Object.values(S.curves).forEach((c) => {
        c.keys = c.keys.filter((x) => x.t <= n);
        c.layer = c.layer.filter((x) => x.t <= n);
      });
      S.warp.keys = S.warp.keys.filter((x) => x.t <= n).map((x) => Object.assign(x, { v: Math.min(x.v, n) }));
      if (!S.warp.keys.length) S.warp.keys = [k(1, 1, "linear")];
      S.beats = n;
      if (S.warp.keys.length === 1) S.warp.keys.push(k(n, n, "linear"));
    });
    val("#cv-src", (v) => (S.recSource = v));
    val("#cv-rate", (v) => (S.recRate = Number(v) || 0.5));
  }

  /* ---------- playhead and recording ---------- */

  function paintHead(b) {
    if (!root) return;
    const x = b == null ? -10 : X(b);
    ["#cv-head", "#cv-head2"].forEach((s) => {
      const l = root.querySelector(s);
      if (l) {
        l.setAttribute("x1", x);
        l.setAttribute("x2", x);
      }
    });
    if (b == null) return;
    const lab = root.querySelector("#cv-beat");
    if (lab) lab.textContent = `beat ${b.toFixed(2)}${S.warp.on ? ` → reads ${warpBeat(b).toFixed(2)}` : ""}`;
    const ch = root.querySelector("#cv-chips");
    if (ch) ch.innerHTML = chipsHtml(b);
  }

  function start(recording) {
    stop(true);
    sel.target = "base";
    play = { t0: performance.now(), b: 1, raf: 0 };
    if (recording && S.active) {
      snapshot();
      rec = { next: 1, last: 0 };
    }
    render();
    const tick = (now) => {
      if (!play) return;
      if (!root || !document.body.contains(root)) return stop(true);
      const beats = ((now - play.t0) / 60000) * S.bpm;
      if (rec) {
        play.b = 1 + beats;
        while (rec && play.b >= rec.next) {
          writeSample(rec.next);
          rec.next += S.recRate;
          if (rec.next > S.beats + 1e-6) {
            rec = null;
            play = null;
            save();
            render();
            return;
          }
        }
      } else play.b = 1 + (beats % (S.beats - 1));
      paintHead(play.b);
      play.raf = requestAnimationFrame(tick);
    };
    play.raf = requestAnimationFrame(tick);
  }

  function stop(quiet) {
    if (play && play.raf) cancelAnimationFrame(play.raf);
    const was = !!play;
    play = null;
    if (rec) save();
    rec = null;
    if (was && !quiet) render();
  }

  function sourceValue() {
    return S.recSource === "mouse" ? src.mouse : src.val;
  }

  function writeSample(t) {
    const c = S.curves[S.active];
    if (!c) return;
    const d = def(S.active);
    const raw01 = Math.max(0, Math.min(1, sourceValue()));
    let v = d.min + raw01 * (d.max - d.min);
    v = d.choice ? Math.round(v) : Math.round(v * 100) / 100;
    c.keys = c.keys.filter((x) => !(x.t > rec.last && x.t <= t + 1e-6));
    putKey(c.keys, k(t, v, d.choice ? "stepped" : "auto"));
    rec.last = t;
    redrawGraph();
  }

  function midi() {
    const status = (s) => {
      src.midiStatus = s;
      const el = root && root.querySelector("#cv-midi");
      if (el) el.textContent = s;
    };
    if (!navigator.requestMIDIAccess) {
      status("This browser has no Web MIDI. Use the mouse or number keys.");
      return;
    }
    status("Asking for MIDI…");
    setTimeout(() => {
      if (!src.midiOn && src.midiStatus === "Asking for MIDI…") status("No answer from MIDI yet. Allow it in the browser, or use the mouse or number keys.");
    }, 4000);
    navigator.requestMIDIAccess().then(
      (access) => {
        const hook = () => {
          let n = 0;
          access.inputs.forEach((input) => {
            n++;
            input.onmidimessage = onMidi;
          });
          src.midiOn = n > 0;
          status(n ? `${n} MIDI input${n === 1 ? "" : "s"}. ${src.cc != null ? "CC " + src.cc : "Any CC or note velocity"}.` : "No MIDI inputs found. Plug one in.");
        };
        hook();
        access.onstatechange = hook;
        render();
      },
      () => status("MIDI was refused or is unavailable. Use the mouse or number keys.")
    );
  }

  function onMidi(e) {
    const [st, d1, d2] = e.data;
    const type = st & 0xf0;
    if (type === 0xb0) {
      if (src.learn) {
        src.cc = d1;
        src.learn = false;
        src.midiStatus = `Learned CC ${d1}.`;
        render();
      }
      if (src.cc == null || src.cc === d1) src.val = d2 / 127;
    } else if (type === 0x90 && d2 > 0 && src.cc == null) {
      src.val = d2 / 127;
    }
  }

  function bindGlobals() {
    if (globalsBound) return;
    globalsBound = true;
    document.addEventListener("keydown", (e) => {
      if (!root || !document.body.contains(root) || root.offsetParent === null) return;
      const tag = (e.target && e.target.tagName) || "";
      if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
      if (/^[1-5]$/.test(e.key)) {
        src.val = (Number(e.key) - 1) / 4;
        if (rec || S.recSource === "keys") e.preventDefault();
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel.i >= 0) {
        e.preventDefault();
        deleteKey();
      }
    });
  }

  function injectStyle() {
    if (document.getElementById("studio-curves")) return;
    const st = document.createElement("style");
    st.id = "studio-curves";
    st.textContent = `
.cv .g { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--saffron); margin: 14px 0 6px; }
.cv-side, .cv-main { min-width: 0; }
.cv input[type="range"] { accent-color: var(--saffron); }
.cv-graph { width: 100%; height: auto; display: block; background: white; border: 2px solid var(--ink); touch-action: none; cursor: crosshair; user-select: none; }
.cv-dope { width: 100%; height: auto; display: block; background: rgba(255,255,255,0.6); border: 1px solid var(--line); }
.cv-dope [data-dope] { cursor: pointer; }
.cv-sdk { width: 100%; height: auto; display: block; background: white; border: 1px solid var(--line); margin-top: 6px; }
.cv-ax { font-family: var(--mono); font-size: 9px; fill: #6a5f52; }
.cv-key { cursor: grab; }
.cv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
.cv-row label.field { min-width: 0; }
.cv-row input, .cv-row select, .cv-small input, .cv-small select { width: 100%; box-sizing: border-box; }
.cv-chips { display: flex; flex-wrap: wrap; }
.cv-pick button { border: 0; background: none; font: inherit; color: inherit; padding: 0 2px; cursor: pointer; }
.cv-tool .subtabs { margin: 0 0 8px; border: 0; padding: 0; }
.cv-play { align-items: end; margin: 8px 0; }
.cv-small { margin: 0; min-width: 90px; }
.cv-rec.on { background: var(--saffron); color: white; border-color: var(--saffron); }
.cv-legend { font-size: 12px; margin: 4px 0 0; }
#cv-preview { font-size: 11px; overflow-wrap: anywhere; }
`;
    document.head.appendChild(st);
  }

  window.CuriosityStudio.register({
    id: "curves",
    label: "Curves",
    order: 30,
    maya: "Graph Editor, Dope Sheet, Set Driven Key, Time Warp, animation layers",
    draw(el, studioApi) {
      api = studioApi;
      stop(true);
      injectStyle();
      bindGlobals();
      if (!S) S = load();
      root = el;
      render();
    },
  });
})();
