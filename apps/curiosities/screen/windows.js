/* screen/windows.js: the faces of every curiosity's own window (window.CurioWindowFaces).
   Jeremy, 2026-10-03 14:59Z: "individual automation windows for each curiosity ... by defining the parameters
   that are automatable for each one".

   Each curiosity's window is described as data in data/windows/win-<category>.js (CuriosityWindows): extra
   settings of its own, faces (visual controls), groups (headings for its settings) and presets. This file
   draws them inside the window ui.js already opens (⧉ on a lane or in Details), and adds two automation tools
   every window shares:
     Presets          one click sets several of its settings at the playhead (one undo step)
     Shape over film  draws a whole movement for one setting across my film (rise, fall, swell, pulse,
                      back and forth, surprise), as nodes, one undo step, like an LFO drawn onto the lane
     Surprise me      every setting of its own picks a random value at the playhead
   ui.js hands in its helpers (h) and actions (api); this file never writes to the engine itself.
     h:   { esc, keyFor, sliderId, controlHtml, keyBtn, spark, row, ctx }
     api: { setValues(list, label), setAt(items, label), showLane(id), toast(msg) } */
(function () {
  /* Its own styles, inlined so the one-page app link carries them too. */
  if (typeof document !== "undefined" && !document.getElementById("cw-css")) {
    const st = document.createElement("style");
    st.id = "cw-css";
    st.textContent = CSS();
    document.head.appendChild(st);
  }
  const S = () => window.CurioScale;
  const spec = (c) => (c && c.window) || (window.CuriosityWindows && window.CuriosityWindows.get(c.id)) || null;
  const SHARED = ["push", "pointsAhead", "themeLink", "amount"];

  function sl(c, sid) {
    return (c.sliders || []).find((s) => s.id === sid || (sid === "setting" && s.id === c.main)) || null;
  }
  const keyOf = (c, h, sid) => {
    const s = sl(c, sid);
    return s ? h.sliderId(c, s) : null;
  };
  const posOf = (id, v) => (v == null || !S() || !S().known(id) ? null : S().pos(id, v));
  const optionsOf = (s) => (s && s.scale ? s.scale : []);
  const on = (a, b) => a != null && String(a) === String(b);

  /* ---------- faces ---------- */
  const FACE = {
    tiles(c, f, h) {
      const s = sl(c, f.slider);
      const id = keyOf(c, h, f.slider);
      if (!s || !id) return "";
      const cur = h.ctx.value(id);
      return `<div class="cw-tiles" role="group" aria-label="${h.esc(s.label)}">${optionsOf(s)
        .map((o) => `<button type="button" data-set="${h.esc(id)}" data-v="${h.esc(o)}" class="${on(cur, o) ? "on" : ""}"${f.colors && f.colors[o] ? ` style="--sw:${h.esc(f.colors[o])}"` : ""}>${f.icons && f.icons[o] ? `<i aria-hidden="true">${h.esc(f.icons[o])}</i>` : ""}<span>${h.esc(o)}</span></button>`)
        .join("")}</div>`;
    },
    swatches(c, f, h) {
      const s = sl(c, f.slider);
      const id = keyOf(c, h, f.slider);
      if (!s || !id) return "";
      const cur = h.ctx.value(id);
      return `<div class="cw-swatches" role="group" aria-label="${h.esc(s.label)}">${optionsOf(s)
        .map((o) => `<button type="button" data-set="${h.esc(id)}" data-v="${h.esc(o)}" class="${on(cur, o) ? "on" : ""}" style="--sw:${h.esc((f.colors && f.colors[o]) || "#666")}" title="${h.esc(o)}"><i aria-hidden="true"></i><span>${h.esc(o)}</span></button>`)
        .join("")}</div>`;
    },
    dial(c, f, h) {
      const s = sl(c, f.slider);
      const id = keyOf(c, h, f.slider);
      if (!s || !id || !s.range) return "";
      const r = s.range;
      const val = h.ctx.value(id);
      const p = r.max > r.min ? (Number(val) - r.min) / (r.max - r.min) : 0;
      const a = -135 + 270 * (isFinite(p) ? Math.max(0, Math.min(1, p)) : 0);
      const dis = !h.ctx.edit;
      return `<div class="cw-dial"><span class="sc-knob${dis ? " dis" : ""}" role="slider" tabindex="${dis ? -1 : 0}" aria-label="${h.esc(s.label)}" aria-valuemin="${r.min}" aria-valuemax="${r.max}" aria-valuenow="${h.esc(val)}" data-knob="${h.esc(id)}" data-min="${r.min}" data-max="${r.max}" data-step="${r.step || 1}" data-val="${h.esc(val)}"><svg viewBox="0 0 32 32"><path class="cw-arc" d="M6.8 25.2A13 13 0 1 1 25.2 25.2"/><circle cx="16" cy="16" r="10"/><line x1="16" y1="16" x2="16" y2="7" transform="rotate(${a} 16 16)"/></svg><b>${h.esc(val == null ? "–" : val)}${val == null ? "" : h.esc(r.unit || "")}</b></span><small>${h.esc(s.label)}<br>${r.min}${h.esc(r.unit || "")} to ${r.max}${h.esc(r.unit || "")}. Drag up or down.</small></div>`;
    },
    ladder(c, f, h) {
      const s = sl(c, f.slider);
      const id = keyOf(c, h, f.slider);
      if (!s || !id) return "";
      const cur = h.ctx.value(id);
      const opts = optionsOf(s);
      const at = opts.findIndex((o) => on(cur, o));
      return `<div class="cw-ladder" role="group" aria-label="${h.esc(s.label)}">${opts
        .map((o, i) => ({ o, i }))
        .reverse()
        .map(({ o, i }) => `<button type="button" data-set="${h.esc(id)}" data-v="${h.esc(o)}" class="${i === at ? "on" : i < at ? "below" : ""}" style="--w:${30 + (70 * (i + 1)) / opts.length}%"><span>${h.esc(o)}</span></button>`)
        .join("")}</div>`;
    },
    balance(c, f, h) {
      const s = sl(c, f.slider);
      const id = keyOf(c, h, f.slider);
      if (!s || !id) return "";
      const cur = h.ctx.value(id);
      const p = posOf(id, cur);
      const tilt = p == null ? 0 : (p - 0.5) * 24;
      const left = f.left || (s.scale ? s.scale[0] : s.range.min + (s.range.unit || ""));
      const right = f.right || (s.scale ? s.scale[s.scale.length - 1] : s.range.max + (s.range.unit || ""));
      const steps = s.scale ? s.scale : [0, 0.25, 0.5, 0.75, 1].map((k) => S().at(id, k));
      return `<div class="cw-balance"><svg viewBox="0 0 100 34" aria-hidden="true"><path class="cw-fulcrum" d="M50 30l-6 4h12z"/><g transform="rotate(${tilt} 50 22)"><line x1="8" y1="22" x2="92" y2="22"/><circle cx="8" cy="17" r="5"/><circle cx="92" cy="17" r="5"/></g></svg><div class="cw-ends"><span>${h.esc(left)}</span><span>${h.esc(right)}</span></div><div class="cw-row" role="group" aria-label="${h.esc(s.label)}">${steps
        .map((o) => `<button type="button" data-set="${h.esc(id)}" data-v="${h.esc(o)}" class="${on(cur, o) ? "on" : ""}">${h.esc(o)}${s.range ? h.esc(s.range.unit || "") : ""}</button>`)
        .join("")}</div></div>`;
    },
    compass(c, f, h) {
      const s = sl(c, f.slider);
      const id = keyOf(c, h, f.slider);
      if (!s || !id) return "";
      const cur = h.ctx.value(id);
      const opts = optionsOf(s);
      const ang = (o, i) => (f.angles && f.angles[o] != null ? f.angles[o] : (360 * i) / Math.max(1, opts.length));
      const curI = opts.findIndex((o) => on(cur, o));
      return `<div class="cw-compass" role="group" aria-label="${h.esc(s.label)}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34"/>${curI >= 0 ? `<line x1="50" y1="50" x2="50" y2="22" transform="rotate(${ang(opts[curI], curI)} 50 50)"/>` : ""}<circle class="cw-hub" cx="50" cy="50" r="4"/></svg>${opts
        .map((o, i) => {
          const a = (ang(o, i) * Math.PI) / 180;
          return `<button type="button" data-set="${h.esc(id)}" data-v="${h.esc(o)}" class="${on(cur, o) ? "on" : ""}" style="left:${50 + 42 * Math.sin(a)}%;top:${50 - 42 * Math.cos(a)}%">${h.esc(o)}</button>`;
        })
        .join("")}</div>`;
    },
    mixer(c, f, h) {
      const list = (f.sliders || []).map((sid) => [sl(c, sid), keyOf(c, h, sid)]).filter(([s, id]) => s && id);
      if (!list.length) return "";
      const dis = h.ctx.edit ? "" : " disabled";
      return `<div class="cw-mixer">${list
        .map(([s, id]) => {
          const v = h.ctx.value(id);
          const input = s.scale
            ? (() => {
                const i = s.scale.findIndex((o) => on(v, o));
                return `<input type="range" min="0" max="${s.scale.length - 1}" step="1" value="${i < 0 ? 0 : i}" data-step-set="${h.esc(id)}" data-scale="${h.esc(JSON.stringify(s.scale))}"${dis} aria-label="${h.esc(s.label)}">`;
              })()
            : `<input type="range" min="${s.range.min}" max="${s.range.max}" step="${s.range.step || 1}" value="${h.esc(v == null ? s.range.min : v)}" data-set="${h.esc(id)}"${dis} aria-label="${h.esc(s.label)}">`;
          return `<label class="cw-fader">${h.keyBtn(id, h.ctx)}<span class="cw-fader-track">${input}</span><output>${h.esc(v == null ? "–" : v + (s.range ? s.range.unit || "" : ""))}</output><small>${h.esc(s.label)}</small></label>`;
        })
        .join("")}</div>`;
    },
    pad(c, f, h) {
      const sx = sl(c, f.x);
      const sy = sl(c, f.y);
      const ix = keyOf(c, h, f.x);
      const iy = keyOf(c, h, f.y);
      if (!sx || !sy || !ix || !iy) return "";
      const px = posOf(ix, h.ctx.value(ix));
      const py = posOf(iy, h.ctx.value(iy));
      const xl = f.xLabel || `${sx.label}: ${sx.scale ? sx.scale[0] : sx.range.min} · ${sx.scale ? sx.scale[sx.scale.length - 1] : sx.range.max}`;
      const yl = f.yLabel || `${sy.label}: ${sy.scale ? sy.scale[0] : sy.range.min} · ${sy.scale ? sy.scale[sy.scale.length - 1] : sy.range.max}`;
      return `<div class="cw-pad${h.ctx.edit ? "" : " dis"}" data-xy="${h.esc(ix)}|${h.esc(iy)}" role="application" aria-label="${h.esc(sx.label)} across, ${h.esc(sy.label)} up"><span class="cw-pad-x">${h.esc(xl)}</span><span class="cw-pad-y">${h.esc(yl)}</span><i class="cw-grid" aria-hidden="true"></i>${px != null && py != null ? `<i class="cw-dot" style="left:${px * 100}%;top:${(1 - py) * 100}%"></i>` : ""}</div><p class="sc-k">Click or drag on the pad to set both at once.</p>`;
    },
    frame(c, f, h) {
      const ix = f.x ? keyOf(c, h, f.x) : null;
      const iy = f.y ? keyOf(c, h, f.y) : null;
      const isz = f.size ? keyOf(c, h, f.size) : null;
      const px = ix ? posOf(ix, h.ctx.value(ix)) : null;
      const py = iy ? posOf(iy, h.ctx.value(iy)) : null;
      const ps = isz ? posOf(isz, h.ctx.value(isz)) : null;
      const x = px == null ? 0.5 : px;
      const y = py == null ? 0.5 : py;
      const k = ps == null ? 0.5 : ps;
      /* A person drawn at their place in the picture; size grows them from far away to filling the frame. */
      const scale = 0.35 + k * 1.3;
      const person = `<g transform="translate(${8 + x * 144} ${90 - y * 40}) scale(${scale})"><circle cx="0" cy="-34" r="7"/><path d="M0 -27v26M0 -20l-11 11M0 -20l11 11M0 -1l-8 22M0 -1l8 22"/></g>`;
      const sz = isz && sl(c, f.size);
      return `<div class="cw-frame${h.ctx.edit ? "" : " dis"}"${ix || iy ? ` data-xy="${h.esc(ix || "")}|${h.esc(iy || "")}"` : ""} aria-label="Where it sits in the picture"><svg viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true"><rect class="cw-thirds" x="0" y="0" width="160" height="100"/><path class="cw-thirds" d="M53 0v100M107 0v100M0 33h160M0 67h160"/>${person}</svg></div>${ix || iy ? `<p class="sc-k">Click or drag in the picture to place it${ix && iy ? " across and up" : ix ? " left or right" : " higher or lower"}.</p>` : ""}${sz ? `<div class="sc-ctl"><span class="sc-ctl-l">${h.keyBtn(isz, h.ctx)}${h.esc(sz.label)}</span>${h.controlHtml(isz, sz, h.ctx.value(isz), !h.ctx.edit)}</div>` : ""}`;
    },
    orbit(c, f, h) {
      const k = (sid) => (f[sid] ? keyOf(c, h, f[sid]) : null);
      const ka = k("around");
      if (!ka) return "";
      const kh = k("height");
      const kd = k("distance");
      const ko = k("offAxis");
      const kr = k("roll");
      const num = (id, d) => {
        const v = id ? Number(h.ctx.value(id)) : NaN;
        return isFinite(v) ? v : d;
      };
      const around = num(ka, 0);
      const height = num(kh, 0);
      const off = num(ko, 0);
      const roll = num(kr, 0);
      /* Distance is drawn on a square-root scale so near places get room: p = sqrt(position on its range). */
      const dp = kd ? Math.sqrt(Math.max(0, posOf(kd, num(kd, S().at(kd, 0.1))) || 0)) : 0.7;
      const rad = (d) => (d * Math.PI) / 180;
      const R = 40 * (0.18 + 0.82 * dp);
      /* From above: the subject in the middle facing down the page, toward a camera at 0°. */
      const tx = 50 + R * Math.sin(rad(around));
      const ty = 50 + R * Math.cos(rad(around));
      const look = Math.atan2(50 - ty, 50 - tx) + rad(off);
      const cam = (x, y, a, r) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(1)})"><g transform="rotate(${r})"><rect x="-6" y="-4" width="9" height="8" rx="1.5"/><path d="M3 -2.5l5 -2.5v10l-5 -2.5z"/></g><line class="cw-look" x1="8" y1="0" x2="30" y2="0"/></g>`;
      const top = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="cw-ring" cx="50" cy="50" r="40"/><circle class="cw-ring" cx="50" cy="50" r="20"/><path class="cw-ring" d="M50 6v88M6 50h88"/><text x="50" y="99" class="cw-t" text-anchor="middle">front</text><text x="50" y="5" class="cw-t" text-anchor="middle">behind</text><text x="3" y="52" class="cw-t" text-anchor="start">left</text><text x="97" y="52" class="cw-t" text-anchor="end">right</text><g class="cw-subj"><circle cx="50" cy="50" r="5"/><path d="M50 55l-3 4h6z"/></g>${cam(tx, ty, look, 0)}</svg>`;
      /* From the side: the subject on the left, the camera on an arc above or below their eyes. */
      const sx = 22 + 62 * Math.cos(rad(height));
      const sy = 50 - 40 * Math.sin(rad(height));
      const side = kh ? `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="cw-ring" d="M22 10A40 40 0 0 1 84 50A40 40 0 0 1 22 90"/><line class="cw-ring" x1="22" y1="50" x2="96" y2="50"/><g class="cw-subj"><circle cx="22" cy="42" r="5"/><path d="M22 47v24M22 71l-5 18M22 71l5 18"/></g>${cam(sx, sy, Math.atan2(46 - sy, 22 - sx), roll)}<text x="96" y="47" class="cw-t" text-anchor="end">eye level</text></svg>` : "";
      const read = [
        ["around", ka, around, "°"],
        ["height", kh, height, "°"],
        ["distance", kd, kd ? num(kd, 0) : null, "m"],
        ["offAxis", ko, off, "°"],
        ["roll", kr, roll, "°"],
      ].filter((x) => x[1]);
      return `<div class="cw-orbit${h.ctx.edit ? "" : " dis"}"><div class="cw-orbit-top" data-orbit-top="${h.esc(ka)}|${h.esc(kd || "")}" title="From above: drag the camera around them, nearer or farther">${top}<small>From above</small></div>${kh ? `<div class="cw-orbit-side" data-orbit-side="${h.esc(kh)}" title="From the side: drag above or below">${side}<small>From the side</small></div>` : ""}</div>
        <div class="cw-orbit-read">${read.map(([sid, id, v, u]) => { const s = sl(c, f[sid]); return `<span>${h.keyBtn(id, h.ctx)}${h.esc(s ? s.label : sid)} <b>${v == null ? "–" : Math.round(v * 10) / 10}${u}</b></span>`; }).join("")}</div>
        <p class="sc-k">Drag the camera in either view. Each number is its own curiosity with its own lane.</p>`;
    },
  };

  /* ---------- shapes over my film (a drawn LFO) ---------- */
  const SHAPES = [
    ["rise", "Rise", (t) => t],
    ["fall", "Fall", (t) => 1 - t],
    ["swell", "Swell", (t) => Math.sin(Math.PI * t)],
    ["pulse", "Pulse", (t, i) => (i % 2 ? 0.15 : 0.9)],
    ["wave", "Back and forth", (t) => 0.5 + 0.45 * Math.sin(t * Math.PI * 4)],
    ["surprise", "Surprise", () => Math.random()],
  ];
  /* times: how many times the shape plays across the span; depth: how far it swings from the middle (1 = all the way). */
  function shapeItems(id, shape, n, from, to, times, depth) {
    const f = (SHAPES.find((s) => s[0] === shape) || [])[2];
    if (!f || !S() || !S().known(id)) return [];
    const a = Math.max(0, from || 0);
    const b = Math.min(n - 1, to == null ? n - 1 : to);
    const k = Math.max(1, Math.round(times || 1));
    const d = depth == null ? 1 : Math.max(0, Math.min(1, depth));
    const out = [];
    for (let j = a; j <= b; j++) {
      const t = b > a ? (j - a) / (b - a) : 0;
      /* Each repeat runs the whole shape; the last moment ends it rather than starting it again. */
      const u = k === 1 || t >= 1 ? t : (t * k) % 1;
      const v = 0.5 + (f(u, j - a) - 0.5) * d;
      out.push([id, j, S().at(id, Math.max(0, Math.min(1, v)))]);
    }
    return out;
  }
  /* The setting, repeats and depth picked under Shape over my film, kept per window across redraws. */
  const shapeMem = {};
  const TIMES = [1, 2, 3, 4, 6, 8];
  const DEPTHS = [[1, "All the way"], [0.75, "A lot"], [0.5, "Halfway"], [0.25, "A little"]];

  /* ---------- the window body ---------- */
  function html(c, h) {
    const sp = spec(c);
    const esc = h.esc;
    const own = (c.sliders || []).filter((s) => !SHARED.includes(s.id));
    const parts = [];
    if (sp && (sp.faces || []).length) {
      parts.push(`<div class="sc-wpart cw-faces">${sp.faces
        .map((f) => {
          const draw = FACE[f.face];
          const body = draw ? draw(c, f, h) : "";
          if (!body) return "";
          const s = sl(c, f.slider || f.x || f.size || (f.sliders || [])[0]);
          const title = f.title || (f.face === "mixer" ? "Mixer" : f.face === "pad" ? `${(sl(c, f.x) || {}).label} and ${(sl(c, f.y) || {}).label}` : f.face === "frame" ? "In the picture" : s ? s.label : "");
          return `<div class="cw-face cw-${esc(f.face)}-face"><h4>${esc(title)}</h4>${body}</div>`;
        })
        .join("")}</div>`);
    }
    if (sp && (sp.presets || []).length) {
      parts.push(`<div class="sc-wpart cw-presets"><h4>Presets</h4><p class="sc-k">One click sets these at the playhead, as one undo step.</p><div class="cw-preset-row">${sp.presets
        .map((p, i) => `<button type="button" data-cw-preset="${esc(c.id)}|${i}"${h.ctx.edit ? "" : " disabled"} title="${esc(p.plain || "")}"><b>${esc(p.label)}</b>${p.plain ? `<small>${esc(p.plain)}</small>` : ""}</button>`)
        .join("")}</div></div>`);
    }
    /* Automation tools: draw a shape over the whole film, or surprise me. */
    const shapeable = own.filter((s) => (s.scale && !s.unordered) || s.range);
    if (shapeable.length && h.ctx.beats.length > 1) {
      const mem = shapeMem[c.id] || {};
      const pick = shapeable.find((s) => s.id === mem.pick) || (h.focus && shapeable.find((s) => h.sliderId(c, s) === h.focus)) || shapeable.find((s) => s.id === c.main) || shapeable[0];
      parts.push(`<div class="sc-wpart cw-shape"><h4>Shape over my film</h4><p class="sc-k">Draw a whole movement for one setting across every moment of my film. One undo step.</p>
        <div class="cw-shape-row"><select data-cw-shape-pick="${esc(c.id)}" aria-label="Which setting to shape">${shapeable.map((s) => `<option value="${esc(s.id)}"${s === pick ? " selected" : ""}>${esc(s.id === c.main ? c.label : s.label)}</option>`).join("")}</select>
        ${SHAPES.map(([k, label]) => `<button type="button" data-cw-shape="${esc(c.id)}|${k}" title="${esc(label)} across the film">${shapeIcon(k)}<span>${esc(label)}</span></button>`).join("")}</div>
        <div class="cw-shape-row"><label>How many times <select data-cw-shape-times="${esc(c.id)}" aria-label="How many times the shape plays">${TIMES.map((n) => `<option value="${n}"${String(n) === String(mem.times) ? " selected" : ""}>${n === 1 ? "Once" : `${n} times`}</option>`).join("")}</select></label>
        <label>How much <select data-cw-shape-depth="${esc(c.id)}" aria-label="How far the shape swings">${DEPTHS.map(([v, l]) => `<option value="${v}"${String(v) === String(mem.depth) ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>
        <div class="cw-shape-row"><button type="button" data-cw-surprise="${esc(c.id)}"${h.ctx.edit ? "" : " disabled"} title="Every setting of its own picks something at random, here">🎲 Surprise me here</button></div></div>`);
    }
    return parts.join("");
  }
  function shapeIcon(k) {
    const P = { rise: "M2 14L22 2", fall: "M2 2L22 14", swell: "M2 14Q12 -6 22 14", pulse: "M2 12h5V3h5v9h5V3h5", wave: "M2 8q3-8 6 0t6 0t6 0", surprise: "M2 10l4-6 4 9 4-11 4 8 4-4" };
    return `<svg viewBox="0 0 24 16" aria-hidden="true"><path d="${P[k] || ""}"/></svg>`;
  }
  /* Groups: the window's "Every knob and slider" under headings; any setting no group names goes in "More". */
  function grouped(c, block) {
    const sp = spec(c);
    if (!sp || !(sp.groups || []).length) return null;
    const used = new Set();
    const pick = (sid) => {
      const s = sl(c, sid);
      if (!s || used.has(s.id)) return null;
      used.add(s.id);
      return s;
    };
    const out = sp.groups.map((g) => {
      const list = (g.sliders || []).map(pick).filter(Boolean);
      return list.length ? `<div class="sc-wpart"><h4>${escText(g.label)}</h4>${list.map(block).join("")}</div>` : "";
    });
    const rest = (c.sliders || []).filter((s) => !used.has(s.id));
    if (rest.length) out.push(`<div class="sc-wpart"><h4>More</h4>${rest.map(block).join("")}</div>`);
    return out.join("");
  }
  const escText = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  /* ---------- say it (Jeremy, 2026-10-03 15:02Z: "we can also allow the user to simply speak their request if
     they don't want to get into tweaking these parameters") ----------
     Plain words in, settings out, worked out on the device. The request is cleaned up first (typos fixed against
     the words the app knows, "abit" split, "its to dark" read as "too dark"), then split into parts (commas, "and",
     "then", "but"; never inside a word on a scale like "black and white"). Each part is matched, in this order:
       1. nothing of it      "no music", "turn off the captions", "without blur": the setting it names goes to
                             its none, off or zero
       2. a word on a scale  "close", "a double take", or a beginner's word for one ("sunset" is dusk, "tux" is
                             formal, "like a horror movie" is fearful or dark). "more X" also raises its strength;
                             "not so X", "too X" step away from X
       3. a number           with a unit (30 degrees, 2 meters, 40%, 3 seconds, 120 bpm, 2x, half a second); with
                             "more", "further", "darker" it moves by that much from where it is ("2 meters further")
       4. more or less       comparatives and verbs (closer, dirtier, colder, brighten, tone down, zoom out, too
                             loud, not so many): the setting whose scale words, label ends ("Cheap to expensive")
                             or label match the word moves that way from where it is. Left, right, behind, above
                             and below turn an angle around the subject.
       5. a feeling or genre word ("creepier", "like a thriller") raises a setting named after it.
     The plain-words phrases (data/windows/say-<category>.js) and the presets' names are matched first, on the
     whole request. Returns { set: [[key, value, label]], said: [what it understood] }.
     data/windows/say-eval.js scores this against data/windows/say-eval.json. */
  const UNITS = [
    ["°/s", /^(°|deg|degrees?) ?(per|a|\/) ?(s|sec|second)$/],
    ["°/min", /^(°|deg|degrees?) ?(per|a|\/) ?(min|minute)$/],
    ["m/s", /^(m|meters?|metres?) ?(per|a|\/) ?(s|sec|second)$/],
    ["cm/s", /^(cm|centimeters?) ?(per|a|\/) ?(s|sec|second)$/],
    ["cm/min", /^(cm|centimeters?) ?(per|a|\/) ?(min|minute)$/],
    ["wpm", /^(wpm|words? (per|a) minute)$/],
    ["bpm", /^(bpm|beats? (per|a) minute)$/],
    ["/min", /^((per|a|an|each|every|\/) ?(min|mins|minute)|per min)$/],
    ["/s", /^((per|a|each|every|\/) ?(s|sec|second))$/],
    ["/h", /^((per|an|a|each|every|\/) ?(h|hour))$/],
    ["°C", /^(°c|celsius|degrees? c|degrees? celsius)$/],
    ["°", /^(°|deg|degs|degree|degrees)$/],
    ["mm", /^(mm|millimeters?|millimetres?)$/],
    ["cm", /^(cm|centimeters?|centimetres?)$/],
    ["m", /^(m|meters?|metres?)$/],
    ["%", /^(%|percent|per cent|% of \w+)$/],
    ["ms", /^(ms|milliseconds?)$/],
    ["s", /^(s|sec|secs|seconds?)$/],
    ["min", /^(min|mins|minutes?)$/],
    ["h", /^(h|hrs?|hours?)$/],
    ["x", /^(x|times)$/],
    ["K", /^(k|kelvin)$/],
    ["dB", /^(db|decibels?)$/],
    ["fps", /^(fps|frames per second)$/],
    ["frames", /^(frames?)$/],
    ["stops", /^(stops?)$/],
    ["semitones", /^(semitones?)$/],
    ["$", /^(\$|dollars?|bucks)$/],
    ["o'clock", /^(o'?clock|am|pm)$/],
  ];
  const canonUnit = (u) => {
    const x = String(u || "").toLowerCase().trim();
    const hit = UNITS.find(([, re]) => re.test(x));
    return hit ? hit[0] : x.replace(/s$/, "");
  };
  /* A slider's unit, in the same words (minutes per main and per minute are both "/min"). */
  const unitOf = (s) => (s && s.range ? canonUnit(String(s.range.unit || "").replace(/ per main$/, "")) : "");
  const STOP = new Set("the a an and but with from into onto this that these those them their there they he she him her his hers its it's it is are was be been being to of for on in at by as so too very much make made makes let lets please pls plz can could would you i i'd want like just also some any one bit little lot more less set put get go have has had do does done than then up down out over off".split(" "));
  const stemOf = (w) => {
    w = String(w);
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + "y";
    if (w.length > 5 && /(ing)$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /(ed)$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && /(es)$/.test(w) && !/(ses|ces|ges|ves|tes|les|kes|mes|nes|pes|res|zes)$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  };
  /* Two words are the same word: equal, the same stem, or one starts the other (five letters or more). */
  const same = (a, b) => {
    if (a === b) return true;
    const sa = stemOf(a);
    const sb = stemOf(b);
    if (sa === sb || sa === b || a === sb) return true;
    const n = Math.min(a.length, b.length);
    return n >= 5 && Math.abs(a.length - b.length) <= 4 && (a.startsWith(b) || b.startsWith(a) || sa.startsWith(sb) || sb.startsWith(sa));
  };
  const wordsOf = (t) => String(t || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9%°$'\s-]/g, " ").replace(/-/g, " ").split(/\s+/).filter(Boolean);
  const content = (t) => wordsOf(t).filter((w) => w.length > 1 && !STOP.has(w) && !/^\d/.test(w));
  const words = (t) => content(t).filter((w) => w.length > 2);
  function overlap(a, b) {
    const B = words(b);
    return words(a).filter((w) => B.some((x) => same(w, x))).length;
  }
  const hasWord = (list, w) => list.some((x) => same(x, w));
  const phraseIn = (clause, ph) => new RegExp("(^|[^a-z0-9])" + String(ph).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)").test(clause);

  /* Beginner words and what they point at. Each concept lists words that may appear on a scale or in a label
     (the first that fits the curiosity wins); "vs" is its opposite. */
  const CONCEPTS = {};
  [
    "close: close, near, tight, closeup, insert, touching | far",
    "near: close, near | far",
    "tight: close, tight, skin tight, fitted, cramped, snug | loose",
    "far: far, distant, away, wide, apart | close",
    "wide: wide, open, roomy, loose, far, wide open | tight",
    "big: big, large, huge, bigger, full screen, splash, page-sized, a big, size | small",
    "large: large, big, huge, size | small",
    "huge: huge, large, big, vast, city, size | small",
    "small: small, little, tiny, few, closet | big",
    "tiny: tiny, small, little, closet | big",
    "loud: loud, volume, level, presence, shout, noisy, loudness | quiet",
    "quiet: quiet, soft talk, whisper, silent, hush | loud",
    "fast: fast, quick, rapid, speed, hurrying, urgent, flies in, rushing | slow",
    "quick: quick, fast, rapid, snap | slow",
    "slow: slow, lazy, gentle, creeping, creeps | fast",
    "long: long, lingering, lingers, length, duration, hold, longest | short",
    "short: short, brief, quick, flash | long",
    "high: high, above, overhead, tall, towering, up | low",
    "tall: tall, towering, high | short",
    "low: low, below, floor, under, down | high",
    "bright: bright, light, high key, sunny, blown out, brightness, exposure | dark",
    "light: light, bright | dark",
    "dark: dark, dim, low key, shadow, black, gloomy, darkness | bright",
    "dim: dim, dark | bright",
    "warm: warm, golden, amber, very warm, warmth, tender | cool",
    "cool: cool, cold, blue, icy, cooler | warm",
    "cold: cold, icy, cool, freezing, chill, cold day | warm",
    "hot: hot, heat, warm, sweltering | cold",
    "hard: hard, harsh, crisp, razor sharp, strong | soft",
    "harsh: harsh, hard | soft",
    "soft: soft, gentle, diffused, feathered, creamy, smooth | hard",
    "gentle: gentle, soft, light, slow | strong",
    "sharp: sharp, crisp, clear, focus, detail, sharpen | soft",
    "crisp: crisp, sharp | soft",
    "blurry: blur, blurry, shallow, soft, melted | sharp",
    "thick: thick, dense, wall, thickness, plume | thin",
    "thin: thin, sparse, wisp, hairline | thick",
    "heavy: heavy, weight, very heavy, strong | light",
    "strong: strong, strength, intense, intensity, force, power, how strongly, how much | weak",
    "weak: weak, faint, subtle, gentle | strong",
    "intense: intense, intensity, strong, extreme, arousal, energy, strength | calm",
    "calm: calm, still, relaxed, gentle, steady, quiet, lazy | intense",
    "relaxed: relaxed, calm, lazy, easy, comfortable | tense",
    "tense: tense, tension, anxious, uneasy, nervous, unbearable | relaxed",
    "nervous: nervous, anxious, shaky, fidgety | calm",
    "happy: happy, joyful, joy, cheerful, sunny, playful | sad",
    "joyful: joyful, happy | sad",
    "sad: sad, unhappy, melancholy, gloomy, grim, tragic, sadder | happy",
    "scary: fearful, dread, fear, scary, creepy, menacing, threatening, dark, uneasy, minor, tense, oppressive, scared",
    "scared: fearful, scared, fear, afraid, dread",
    "afraid: fearful, scared, fear",
    "creepy: dread, creepy, menacing, uneasy, threatening, dark, fearful, spooky",
    "spooky: dread, spooky, dark, uneasy, menacing, fearful, under",
    "horror: fearful, dread, dark, uneasy, menacing, threatening, minor, oppressive, under, scary",
    "frightening: fearful, dread, menacing",
    "angry: angry, anger, furious, rage, hot | calm",
    "mad: angry, anger",
    "funny: funny, comic, comedy, laugh, joke, playful, silly, comedic",
    "silly: silly, absurd, playful, cartoon",
    "romantic: loving, romantic, warm, tender, soft, golden",
    "love: loving, love, tender, warm",
    "dreamy: dreamlike, dreamy, dream, soft, slow and dreamy",
    "weird: absurd, absurdity, strange, uncanny, weird, odd, surreal | grounded",
    "strange: strange, uncanny, unusual, weird, absurd | familiar",
    "odd: odd, strange, unusual, uncanny",
    "grounded: grounded, real, realistic, true to life | weird",
    "real: real, realistic, true to life, photoreal | stylized",
    "realistic: realistic, real, true to life, photoreal | cartoony",
    "cartoony: cartoon, cartoony, toon, rubber hose wild, stylized, rubbery | realistic",
    "cartoon: cartoon, toon, cartoony",
    "busy: busy, crowded, packed, dense, density, chaos, cluttered, overwhelming, many | empty",
    "crowded: crowded, packed, crowd, busy, full | empty",
    "empty: empty, sparse, silent, bare, none, nothing | busy",
    "simple: simple, clean, minimal, plain, one clear, simple shapes | busy",
    "messy: messy, mess, chaos, chaotic, clutter, dirty, wild, disaster | clean",
    "clean: clean, neat, tidy, spotless, orderly, brand new, crisp | dirty",
    "neat: neat, tidy, clean, orderly, spotless | messy",
    "tidy: tidy, neat, spotless, orderly | messy",
    "organized: orderly, organized, neat, tidy | chaotic",
    "orderly: orderly, organized | chaotic",
    "chaotic: chaos, chaotic, wild, frantic | orderly",
    "wild: wild, chaotic, frantic, explosive | calm",
    "dirty: dirty, grime, stains, dust, torn and dirty, worn, grimy | clean",
    "expensive: expensive, luxury, rich, pricey, fancy, posh, smart, wealth | cheap",
    "fancy: expensive, luxury, fancy, posh, smart, rich, formal | cheap",
    "posh: expensive, luxury, posh, rich | cheap",
    "classy: expensive, smart, formal, luxury | cheap",
    "cheap: cheap, poor, rags, budget | expensive",
    "rich: rich, wealth, wealthy, palatial, luxury, expensive | poor",
    "wealthy: rich, wealth, wealthy, palatial | poor",
    "poor: poor, cheap, rags, modest, hard times | rich",
    "formal: formal, ceremony, business, dressy, smart | casual",
    "dressy: formal, dressy, smart | casual",
    "casual: casual, relaxed, everyday, neat casual | formal",
    "baggy: baggy, loose | tight",
    "loose: loose, baggy, relaxed, loosely | tight",
    "old: old, worn, vintage, retro, ancient, aged, decades, years | new",
    "new: new, brand new, fresh, modern | old",
    "smooth: smooth, steady, silky, stable, locked, gimbal, glides | shaky",
    "steady: steady, locked, stable, still, smooth | shaky",
    "stable: stable, steady, locked, smooth | shaky",
    "shaky: shaky, shake, wobble, wobbly, handheld, jitter, jumpy | steady",
    "wobbly: wobble, wobbly, shaky | steady",
    "choppy: choppy, stuttering, jumpy | smooth",
    "rough: rough, grainy, gritty, choppy, raw | smooth",
    "gritty: gritty, grain, grainy, raw | smooth",
    "colorful: color, colorful, saturated, saturation, vivid, rich, colour | gray",
    "saturated: saturated, saturation, vivid, colorful | gray",
    "vivid: vivid, saturated, colorful | gray",
    "gray: gray, grey, muted, faded, washed out, drained, desaturated, pale, nearly gray | colorful",
    "faded: faded, washed out, muted, pale | vivid",
    "deep: deep, low, depth, very deep | shallow",
    "shallow: shallow | deep",
    "open: open, roomy, wide open, shown, plain to see, openly | closed",
    "closed: closed, cramped, hidden, shut | open",
    "cramped: cramped, snug, boxed in, tight | open",
    "roomy: roomy, open, wide open | cramped",
    "spacious: roomy, open, wide open, spacious | cramped",
    "cozy: cozy, warm, snug, comfortable | gloomy",
    "gloomy: gloomy, dark, grey, oppressive, bleak, grim | cozy",
    "cheerful: joyful, cheerful, happy, sunny | gloomy",
    "hopeful: hope, hopeful, optimistic | hopeless",
    "powerful: powerful, power, strong, dominant, towering | weak",
    "sweaty: sweaty, sweat, oily, dewy | dry",
    "wet: wet, soaked, damp, rain, wetter | dry",
    "dry: dry | wet",
    "frizzy: frizz, frizzy",
    "awkward: awkward, cringe, uncomfortable, unbearable | comfortable",
    "embarrassing: humiliation, embarrassing, cringe, awkward",
    "secretive: secret, secretive, hidden, hiding | open",
    "honest: honest, true, truth | deceptive",
    "deceptive: deceptive, lie, lies, liar, lying, dishonest | honest",
    "proactive: proactive, active | reactive",
    "active: proactive, active | reactive",
    "passive: reactive, passive | proactive",
    "confrontational: confrontational, aggressive, fight, fights | avoidant",
    "aggressive: confrontational, aggressive | avoidant",
    "reckless: reckless, risky, daring | cautious",
    "careful: cautious, careful | reckless",
    "cautious: cautious, careful | reckless",
    "controlling: controlling, control, bossy | surrender",
    "emotional: emotional, feeling | rational",
    "logical: rational, logical | emotional",
    "rational: rational, logical | emotional",
    "cynical: cynic, cynical, sarcastic | idealist",
    "optimistic: idealist, optimistic, hopeful | cynic",
    "idealistic: idealist, idealistic | cynic",
    "capable: capable, competent, skilled, effective, good, highly capable | ineffective",
    "competent: capable, competent | ineffective",
    "good: capable, good, better | bad",
    "clumsy: ineffective, clumsy, useless | capable",
    "useless: ineffective, useless | capable",
    "selfish: self-serving, selfish, greedy | altruistic",
    "greedy: self-serving, greedy, selfish | altruistic",
    "generous: altruistic, generous, kind, selfless | self-serving",
    "kind: kind, affectionate, warm, gentle, altruistic | cruel",
    "mean: cruel, mean, biting | kind",
    "cruel: cruel, biting | kind",
    "rebel: individualist, rebel, rebellious | conformist",
    "rebellious: individualist, rebel, rebellious | conformist",
    "chaos: chaotic, chaos, catalyst",
    "flexible: flexible | rigid",
    "rigid: rigid, strict, stiff | flexible",
    "stiff: stiff, rigid, robotic | loose",
    "obvious: obvious, showy, clear, unmissable | subtle",
    "subtle: subtle, invisible, hint, faint | obvious",
    "noticeable: noticeable, showy, clear, obvious | subtle",
    "dramatic: dramatic, big, showy, theatrical | subtle",
    "exaggerated: exaggerated, exaggeration, pushed, huge | subtle",
    "deadpan: deadpan, dry, stone still, flat | broad",
    "broad: broad, big, cartoon | deadpan",
    "clear: clear, readable, crystal clear, spelled out | vague",
    "late: late, after, later | early",
    "early: early, before, ahead | late",
    "smart: smart, clever, brilliant, sharp | groaner",
    "clever: clever, brilliant, sharp | groaner",
    "deeper: deep",
    "many: many, lots, busy, a lot, constantly | few",
    "few: few, a few, rarely, sparse | many",
    "often: often, constantly, frequently, every | rarely",
    "rare: rare, rarely, once, never | often",
    "colder: cold",
    "steep: steep, steeper | gentle",
    "safe: safe, sheltered, sealed off | dangerous",
    "dangerous: dangerous, deadly, danger, risky | safe",
    "lonely: lonely, alone, isolated, empty",
    "trippy: hallucination, trippy, intensity, psychedelic",
    "glossy: glossy, shiny, gloss, mirror, slicked | matte",
    "shiny: shine, shiny, glossy, gloss, mirror | dull",
    "dull: dull, matte | shiny",
    "visible: visible, shown, plain to see, noticeable | hidden",
    "hidden: hidden, hiding, bottled up, fully hidden | shown",
    "proud: proud, pride | ashamed",
    "frantic: frantic, panicked, urgent | calm",
    "urgent: urgent, frantic, panicked, rushing | lazy",
    "lazy: lazy, relaxed, slow | urgent",
    "thriller: tension, tense, suspense, fast, urgent, anxious, dread",
    "suspense: suspense, tension, tense, dread",
    "action: fast, urgent, frantic, explosive, punchy",
    "documentary: handheld, natural, true to life, raw, honest",
    "noir: dark and harsh, low key, hard, black and white, dark",
    "western: old west",
    "futuristic: futuristic, future",
    "sci: futuristic, future",
    "vintage: vintage, retro, old film, film grain",
    "earthquake: shake, the ground, strong, all over",
  ].forEach((line) => {
    const [head, rest] = line.split(":");
    const [syn, vs] = rest.split("|");
    CONCEPTS[head.trim()] = { syn: syn.split(",").map((x) => x.trim()).filter(Boolean), vs: vs ? vs.split(",").map((x) => x.trim()).filter(Boolean) : [] };
  });
  /* Several words for a word on a scale ("sunset" is dusk). Tried after the scale's own words. */
  const SAYS = [
    [/\b(sunset|sundown|golden hour|magic hour|evening|twilight)\b/, ["dusk"]],
    [/\b(sunrise|dawn|early morning|first light|daybreak)\b/, ["dawn"]],
    [/\b(midnight|night ?time|after dark|nighttime)\b/, ["night"]],
    [/\b(noon|midday|daytime|afternoon|broad daylight)\b/, ["day"]],
    [/\b(outside|outdoors|out of doors)\b/, ["exterior"]],
    [/\b(inside|indoors)\b/, ["interior"]],
    [/\b(tux|tuxedo|black tie|gown|suit and tie|evening dress)\b/, ["formal"]],
    [/\b(pajamas|pyjamas|pjs|nightgown|bathrobe)\b/, ["sleepwear"]],
    [/\b(monochrome|b ?& ?w|b and w|black ?& ?white|grayscale|greyscale|no colou?r)\b/, ["black and white"]],
    [/\b(slow ?mo|slo ?mo|slowmo|slow motion)\b/, ["slow motion", "slow"]],
    [/\b(super slow|really slow|very slow)\b/, ["very slow motion", "very slow"]],
    [/\b(freeze|frozen|pause it|stop it)\b/, ["frozen", "freeze frame", "freeze"]],
    [/\b(documentary|doc style|found footage|shaky cam|shakey cam)\b/, ["handheld"]],
    [/\b(steadicam|gimbal)\b/, ["smooth"]],
    [/\b(tripod|rock steady|dead still|locked off|lock it off|lock it)\b/, ["locked"]],
    [/\b(birds? ?eye|bird's eye|top down|from above|straight down|overhead)\b/, ["overhead"]],
    [/\b(worm'?s ?eye|from the floor|ground level)\b/, ["floor"]],
    [/\b(close ?up|closeup|close-up|tight shot)\b/, ["close"]],
    [/\b(wide shot|long shot|establishing shot|full shot)\b/, ["wide"]],
    [/\b(telephoto|zoom lens)\b/, ["long"]],
    [/\b(move in|go in|dolly in|creep in|push closer|zoom in|get closer)\b/, ["push in"]],
    [/\b(pull back|move back|dolly out|pull away|zoom out|back up|back out)\b/, ["pull out"]],
    [/\b(back away|walk away|step back|backs? off|retreats?)\b/, ["retreat", "away", "pull out", "moving apart"]],
    [/\b(walk(s|ing)? (toward|towards|up to|over to)|approach(es)?|come closer|comes closer|walks? up)\b/, ["approach", "toward", "closing in"]],
    [/\b((at|toward|towards|into) the (camera|lens)|to camera|down the lens)\b/, ["toward", "at the camera", "stares into it", "talks to us", "the camera"]],
    [/\b(circle|circles|circling|orbit|spin around|go around them|around them)\b/, ["orbit", "circle"]],
    [/\b(follow(s|ing)? (them|him|her)|tracking shot)\b/, ["track"]],
    [/\b(sweep up|rise up|go up high|crane up|jib)\b/, ["crane"]],
    [/\b(widescreen|cinemascope|scope|cinema screen|at the cinema|letterbox)\b/, ["2.39", "cinema 2.39"]],
    [/\b(old tv|square|4 ?: ?3|boxy|academy)\b/, ["1.33", "square 1:1"]],
    [/\b(vertical|portrait mode|for phones?|tiktok|reels|stories)\b/, ["vertical 9:16"]],
    [/\b(each others? eyes|eye to eye|lock eyes|gaze at each other)\b/, ["both hold"]],
    [/\b(smash|shatter|shatters|smashes|explodes into pieces)\b/, ["shatters"]],
    [/\b(crack|cracks|cracking)\b/, ["cracks", "cracking"]],
    [/\b(whisper|whispers|whispering|whispered)\b/, ["whispered", "whisper"]],
    [/\b(shout|shouts|shouting|yell|yells|yelling|scream|screams)\b/, ["shouted", "shouting", "shout"]],
    [/\b(lens flare|flare)\b/, ["sun flare", "a glint", "streaks"]],
    [/\b(god ?rays|light beams|sunbeams)\b/, ["god rays", "beams"]],
    [/\b(robot|robotic|computer voice)\b/, ["robot"]],
    [/\b(phone call|on the phone|walkie|radio)\b/, ["radio"]],
    [/\b(deeper voice|voice deeper|lower voice)\b/, ["deep"]],
    [/\b(rewind|rewinds|backwards|in reverse|reversed)\b/, ["reversed", "rewind and replay", "rewinds"]],
    [/\b(moonlight|moonlit|by the moon)\b/, ["moon"]],
    [/\b(cartoon|cartoony|animated|toon)\b/, ["toon", "cartoon", "cartoony"]],
    [/\b(painted|painterly|painting|watercolou?r|oil paint)\b/, ["painterly"]],
    [/\b(soaking|soaked|drenched|wet through|sopping)\b/, ["soaked"]],
    [/\b(pun|puns|wordplay)\b/, ["pun"]],
    [/\b(rapid fire|rapid-fire|machine gun)\b/, ["rapid fire"]],
    [/\b(talks? to (us|the camera|the audience)|addresses the camera|breaks? the fourth wall)\b/, ["talks to us"]],
    [/\b(glance|glances|a look)\b/, ["a glance", "glances", "a look"]],
    [/\b(tears|crying|cries|weeps|weeping|sobbing)\b/, ["tears", "falling", "welling"]],
    [/\b(laughs?|laughing|giggles?)\b/, ["a laugh", "laughs", "laughter"]],
    [/\b(fists?|clench(es|ed)?)\b/, ["clench", "clenched"]],
    [/\b(tunnel vision|laser focus(ed)?)\b/, ["one thing"]],
    [/\b(mentor|teacher|wise old)\b/, ["mentor"]],
    [/\b(villain|bad guy|antagonist|enemy)\b/, ["antagonist", "the villain", "villain"]],
    [/\b(killer|murderer|monster|stalker)\b/, ["the villain", "a person"]],
    [/\b(dog|dogs|cat|cats|bird|animal|pet)\b/, ["an animal", "animal", "pet"]],
    [/\b(kid|kids|child|children|little boy|little girl|toddler)\b/, ["a child", "child"]],
    [/\b(giant|from way below)\b/, ["a giant"]],
    [/\b(handwritten|hand written|handwriting|script font)\b/, ["handwritten"]],
    [/\b(name tag|nametag|name card|lower third)\b/, ["lower third"]],
    [/\b(title card|title screen|intertitle)\b/, ["title card"]],
    [/\b(subtitles?)\b/, ["every line", "caption"]],
    [/\b(emojis?)\b/, ["emoji"]],
    [/\b(audience (knows?|sees?|learns?) (it )?first|we know before)\b/, ["audience first"]],
    [/\b(happy and sad|bittersweet|mixed feelings|two feelings)\b/, ["even", "torn between two", "bittersweet"]],
    [/\b(dream|imagined|daydream|fantasy|not real)\b/, ["psych-out", "dreamlike", "for a dream"]],
    [/\b(seamless(ly)?)\b/, ["seamless", "seamless loop"]],
    [/\b(neutral|normal|regular|default|natural)\b/, ["neutral", "normal", "natural"]],
    [/\b(sarcastic|sarcasm|ironic)\b/, ["the opposite", "a hint of something else", "irony"]],
    [/\b(poker face|stone face|blank face|expressionless|deadpan face)\b/, ["blank", "stone still"]],
    [/\b(squint|squints|squinting)\b/, ["narrowed"]],
    [/\b(holds? (his |her |their )?hands?|hand in hand|holding hands)\b/, ["held"]],
    [/\b(quick touch|brief touch|brush(es)? (of )?hands?|tap)\b/, ["brief"]],
    [/\b(slouch|slouches|slouching|hunched)\b/, ["slumped"]],
    [/\b(stand(s|ing)? up straight|stand(s|ing)? tall)\b/, ["upright", "towering"]],
    [/\b(burst(s|ing)? in(to)?|barge(s|d)? in|storm(s|ed)? in)\b/, ["bursts in", "burst in"]],
    [/\b(nobody|no one|none of them)\b/, ["neither", "no one", "nobody"]],
    [/\b(gasp|gasps|gasping)\b/, ["gasp"]],
    [/\b(sigh|sighs)\b/, ["sigh", "a sigh"]],
    [/\b(fog|foggy|mist|misty)\b/, ["fog", "haze"]],
    [/\b(candle|candles|candlelit|candlelight)\b/, ["candle"]],
    [/\b(raining|rainy|rain)\b/, ["rain"]],
    [/\b(sandstorm|dust storm|dusty)\b/, ["dust"]],
    [/\b(sunny|clear sky|clear skies|blue sky)\b/, ["clear"]],
    [/\b(tiny room|small room|closet|cupboard|phone booth)\b/, ["closet"]],
    [/\b(skyscraper|stadium|cathedral|huge place|enormous)\b/, ["city"]],
    [/\b(ripped|rips?|torn|tears? (his|her|their) )\b/, ["torn and dirty", "tears"]],
    [/\b(armou?r|knight|plate mail)\b/, ["armor"]],
    [/\b(uniforms?|all the same|matching outfits)\b/, ["uniforms"]],
    [/\b(poor|broke|poverty)\b/, ["cheap", "rags", "poor"]],
    [/\b(heart ?beat|pulsing)\b/, ["heartbeat"]],
    [/\b(split screen|splitscreen)\b/, ["split screen"]],
    [/\b(pip|picture in picture)\b/, ["picture in picture"]],
    [/\b(see through|see-through|transparent|translucent)\b/, ["see-through"]],
    [/\b(on the beat|on beat|to the beat|with the beat|on the music)\b/, ["right on the beat", "on beats", "on the beat"]],
    [/\b(seconds? left|last seconds|about to run out)\b/, ["seconds left"]],
    [/\b(ticking clock|deadline|countdown|time running out)\b/, ["firm deadline", "tight"]],
    [/\b(goes? wrong|gets? worse|worse|setback|fail(s|ed)?)\b/, ["setback", "fail"]],
    [/\b(chooses?|the choice|decides?|makes? a choice)\b/, ["choice"]],
    [/\b(grows|growing|gets bigger|spreads)\b/, ["building", "grows"]],
    [/\b(still|motionless|frozen in place|doesn't move|does not move)\b/, ["frozen", "still"]],
    [/\b(caption boxes|narration boxes|narration|captions instead)\b/, ["caption"]],
    [/\b(jagged|spiky)\b/, ["jagged"]],
    [/\b(splash page|full page)\b/, ["splash"]],
    [/\b(page turn|turn the page)\b/, ["cliffhanger", "reveal"]],
    [/\b(silent|no words|wordless)\b/, ["none", "silent"]],
    [/\b(blurred edges|blur the edges|blurred background fill)\b/, ["blurred copy"]],
    [/\b(fill it|fill the frame|edge to edge)\b/, ["fills the frame", "full screen"]],
  ];

  /* Words a request may use for "more" or "less" of something, with the quality they point at. */
  const MORE_WORDS = /\b(more|increase|raise|boost|up|higher|extra|another|add|crank|bump|pump|amp|intensify|heighten|amplify|exaggerate|escalate|strengthen|grow|build|stronger|bigger|harder|heavier)\b/;
  const LESS_WORDS = /\b(less|fewer|decrease|reduce|lower|down|drop|minimi[sz]e|lessen|weaken|tone|dial|ease|weaker|smaller|softer|lighter)\b/;
  const VERBS = {
    brighten: ["bright", 1], darken: ["dark", 1], lighten: ["bright", 1], soften: ["soft", 1], sharpen: ["sharp", 1], thicken: ["thick", 1], thin: ["thin", 1],
    widen: ["wide", 1], narrow: ["wide", -1], lengthen: ["long", 1], extend: ["long", 1], shorten: ["short", 1], trim: ["short", 1], quicken: ["fast", 1], hurry: ["fast", 1], rush: ["fast", 1],
    deepen: ["deep", 1], tighten: ["tight", 1], loosen: ["loose", 1], simplify: ["simple", 1], calm: ["calm", 1], hush: ["quiet", 1], quiet: ["quiet", 1], mute: ["quiet", 1],
    warm: ["warm", 1], cool: ["cool", 1], heat: ["hot", 1], slow: ["slow", 1], speed: ["fast", 1], shrink: ["small", 1], enlarge: ["big", 1], dim: ["dark", 1], clean: ["clean", 1], tidy: ["clean", 1],
    dirty: ["dirty", 1], muddy: ["dirty", 1], blur: ["blurry", 1], focus: ["sharp", 1], open: ["open", 1], cover: ["covered", 1], hide: ["hidden", 1], reveal: ["shown", 1],
    zoom: null, punch: null, push: null, pull: null,
  };
  const PHRASAL = [
    [/\bzoom(ed|ing)? in\b|\bpunch(es|ed)? in\b|\bpush in\b|\bget closer\b|\bmove closer\b|\bgo closer\b/, "close", 1],
    [/\bzoom(ed|ing)? out\b|\bpull(ed)? back\b|\bpull out\b|\bback up\b|\bmove back\b|\bshow more\b|\bsee more\b/, "wide", 1],
    [/\bspeed(s|ed)? (it |things )?up\b|\bpick(s)? up the pace\b|\bhurry\b/, "fast", 1],
    [/\bslow(s|ed)? (it |things |everything )?down\b|\btake (it|your|their) time\b/, "slow", 1],
    [/\bcalm(s|ed)? (it |things |everything )?down\b|\bsettle down\b|\bchill\b/, "calm", 1],
    [/\bwarm(s|ed)? (it )?up\b/, "warm", 1],
    [/\bcool(s|ed)? (it )?(down|off)\b/, "cool", 1],
    [/\bopen(s|ed)? (it |them |him |her )?up\b/, "open", 1],
    [/\bcover(s|ed)? (it |them |him |her )?up\b/, "covered", 1],
    [/\bbuild(s)? (it |the tension )?up\b/, null, 1],
    [/\b(tone|dial|turn|bring|knock|take)(s|ed)? (it |this |that |them |things |everything |the \w+ )?(down|back)\b/, null, -1],
    [/\b(turn|crank|bump|pump|dial|amp|kick|ramp)(s|ed)? (it |this |that |them |things |everything |the \w+ )?up\b/, null, 1],
    [/\bstep it up\b|\bgo bigger\b|\bpush it\b|\bgo further\b|\ball out\b/, null, 1],
  ];
  const IRREGULAR = { better: "good", worse: "bad", further: "far", farther: "far", fewer: "few", less: "few", more: "many", elder: "old", nearer: "near" };
  const NOT_COMPARATIVE = new Set("never over under after other water layer player power corner character paper speaker listener border order ever either neither whether together rather number member remember answer letter matter finger shoulder monster danger anger hunger killer partner sister brother mother father teacher poster filter cover center flicker shimmer timer river silver winter summer super sticker banner slider viewer chapter gutter hammer trigger shower tower upper outer inner cheer steer sheer peer here there where were offer enter wonder bother gather consider deliver discover render laser computer trailer thriller lover lovers stranger strangers villager soldier soldiers driver drivers dinner diner butter weather leather feather feathers blur stir her per sooner later lasers ladder jitter litter flower flowers hour hours sister cover wrapper wrapper stopper chopper helicopter keeper banner manner tiger cancer major minor razor mirror horror terror error sugar dollar vinegar silhouette after before ever whatever however together cluster".split(" "));

  /* Every word the app knows (labels, scales, plain words, phrases, presets): typos are fixed toward these. */
  let VOCAB = null;
  function vocab() {
    if (VOCAB) return VOCAB;
    const n = new Map();
    const add = (t) => wordsOf(t).forEach((w) => /^[a-z]{2,}$/.test(w) && n.set(w, (n.get(w) || 0) + 1));
    const DB = window.CuriosityDB;
    const rows = DB && DB.data && DB.data.curiosities ? Object.values(DB.data.curiosities) : [];
    rows.forEach((c) => {
      add(c.label);
      add(c.plain);
      (c.sliders || []).forEach((s) => {
        add(s.label);
        add(s.plain);
        add(s.id.replace(/([A-Z])/g, " $1"));
        (s.scale || []).forEach(add);
      });
    });
    const W = window.CuriosityWindows;
    if (W) {
      Object.values(W.phrases || {}).forEach((m) => Object.keys(m).forEach(add));
      Object.values(W.specs || {}).forEach((sp) => (sp.presets || []).forEach((p) => add(p.label)));
    }
    Object.entries(CONCEPTS).forEach(([k, v]) => (add(k), v.syn.forEach(add), v.vs.forEach(add)));
    SAYS.forEach(([, to]) => to.forEach(add));
    add(Object.keys(VERBS).join(" ") + " " + Object.keys(IRREGULAR).join(" "));
    add("make it more less a bit lot little please closer further farther higher lower bigger smaller louder quieter faster slower longer shorter brighter darker warmer cooler wider tighter softer harder stronger weaker thicker thinner heavier lighter deeper sharper smoother rougher dirtier cleaner messier cheaper fancier happier sadder scarier creepier funnier weirder busier emptier simpler colder hotter wetter drier calmer angrier gentler too not dont don't no without remove turn off on add left right behind front above below up down around away toward towards camera seconds second minutes minute meters meter degrees degree percent times twice half double frames per hour hours stops shot scene film movie like look feel feels want need way much very really super totally completely slightly kind sort of so many few its it's to");
    VOCAB = n;
    return n;
  }
  /* One edit away (a letter added, dropped, changed or two swapped). */
  function edits1(w) {
    const out = new Set();
    const L = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i <= w.length; i++) {
      if (i < w.length) out.add(w.slice(0, i) + w.slice(i + 1));
      if (i < w.length - 1) out.add(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
      for (const ch of L) {
        if (i < w.length) out.add(w.slice(0, i) + ch + w.slice(i + 1));
        out.add(w.slice(0, i) + ch + w.slice(i));
      }
    }
    return out;
  }
  function fixTypos(t) {
    const V = vocab();
    return t.replace(/[a-z]{4,}/g, (w) => {
      if (V.has(w) || V.has(stemOf(w))) return w;
      /* Two words run together ("abit", "makeit"). */
      for (let i = 1; i < w.length - 1; i++) {
        const a = w.slice(0, i);
        const b = w.slice(i);
        if ((a.length > 2 || /^(a|an|it|in|on|to|of|so|up)$/.test(a)) && V.has(a) && V.has(b) && b.length > 1) return a + " " + b;
      }
      let best = null;
      let n = 0;
      edits1(w).forEach((x) => {
        const f = V.get(x) || 0;
        if (x.length > 3 && f > n) (best = x), (n = f);
      });
      return best || w;
    });
  }
  /* Light clean-up before matching: shorthands, "its to dark", contractions. */
  function tidy(text) {
    let t = String(text || "").toLowerCase().replace(/[’`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
    t = t.replace(/\bdo not\b|\bdon't\b|\bdont\b|\bdoesn'?t\b/g, "dont").replace(/\bisn'?t\b|\baren'?t\b|\bwasn'?t\b|\bshouldn'?t\b|\bcan'?t\b|\bwon'?t\b/g, "not");
    t = t.replace(/\b(pls|plz|please|thanks|thank you|kinda|sorta|maybe|can you|could you|i want|i'd like|i would like|we need|let's|lets)\b/g, " ");
    t = fixTypos(t);
    /* "its to dark", "way to loud": "to" before a describing word is "too". */
    t = t.replace(/\b(its|it's|it is|is|was|are|way|far|much|that's|thats|bit|little|just)\s+to\s+(?=[a-z]+(?:er)?\b(?!\s+(?:the|a|an|it|them|him|her|be|make|look|feel)\b))/g, (m, a) => a + " too ");
    return t.replace(/\s+/g, " ").trim();
  }
  /* Numbers said in words, for the number step only ("half a second", "a meter and a half", "two"). */
  const NUMWORD = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, dozen: 12 };
  function numbersIn(t) {
    t = t
      .replace(/\b(a|an|one) (\w+?)s? and a half\b/g, "1.5 $2")
      .replace(/\b(\d+(?:\.\d+)?) (\w+?)s? and a half\b/g, (m, n, u) => Number(n) + 0.5 + " " + u)
      .replace(/\bhalf an? (second|minute|meter|metre|hour|stop|degree|beat|frame)\b/g, "0.5 $1")
      .replace(/\ba quarter of an? (second|minute|hour)\b/g, "0.25 $1")
      .replace(/\bhalf (of )?the (frame|screen|picture|shot|panel|page|width|height)\b/g, "50%")
      .replace(/\ba third of the (frame|screen|picture|shot)\b/g, "33%")
      .replace(/\ba quarter of the (frame|screen|picture|shot)\b/g, "25%")
      .replace(/\bhalf speed\b/g, "0.5x")
      .replace(/\bdouble speed\b/g, "2x")
      .replace(/\b(normal|real) speed\b|\breal time\b/g, "1x")
      .replace(/\btwice\b/g, "2 times")
      .replace(/\bthree times\b/g, "3 times")
      .replace(/\ba couple( of)?\b/g, "2")
      .replace(/\ban? (second|minute|meter|metre|hour|stop|degree|beat|frame|foot)\b/g, "1 $1");
    t = t.replace(/\b(a )?(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|dozen)\b/g, (m, a, w) => (a && w !== "hundred" && w !== "dozen" ? a : "") + NUMWORD[w]);
    return t.replace(/\b(\d+) (\d+)\b/g, (m, a, b) => (Number(a) % 10 === 0 && Number(b) < 10 ? String(Number(a) + Number(b)) : m));
  }

  /* How far a request asks to go: "completely" is all the way, "a lot" is two steps, anything else is one. */
  const lotOf = (clause) =>
    /\b(completely|totally|fully|entirely|all the way|as \w+ as (possible|it gets|you can)|max(imum)?|the most|extremely|the least|super duper)\b/.test(clause)
      ? "end"
      : /\b(a lot|lots|much|way|far|very|really|super|heaps|tons|seriously|massively|hugely)\b/.test(clause)
        ? 2
        : 1;
  /* A beginner word's concept ("slowly" is slow, "gently" is gentle, "scarier" is scary). */
  function concept(w) {
    if (!w) return null;
    const tries = [w, stemOf(w)];
    if (/ily$/.test(w)) tries.push(w.slice(0, -3) + "y");
    if (/ly$/.test(w)) tries.push(w.slice(0, -2), w.slice(0, -1) + "e", w.slice(0, -2) + "e");
    for (const x of tries) if (CONCEPTS[x]) return CONCEPTS[x];
    return null;
  }
  /* Comparatives and their plain word: dirtier is dirty, bigger is big, closer is close; "slowly" is slow. */
  function baseOf(w) {
    if (!w) return null;
    if (IRREGULAR[w] !== undefined) return IRREGULAR[w];
    const V = vocab();
    const ok = (x) => x.length > 2 && (CONCEPTS[x] || (V.get(x) || 0) > 0);
    if (/ly$/.test(w) && w.length > 4) {
      const t = [];
      if (/ily$/.test(w)) t.push(w.slice(0, -3) + "y");
      if (/ly$/.test(w)) t.push(w.slice(0, -2), w.slice(0, -1) + "e");
      const f = t.find((x) => CONCEPTS[x]);
      if (f) return f;
    }
    if (!/er$/.test(w) || w.length < 5 || NOT_COMPARATIVE.has(w)) return null;
    const tries = [];
    if (/ier$/.test(w)) tries.push(w.slice(0, -3) + "y");
    if (/([bdgmnprt])\1er$/.test(w)) tries.push(w.slice(0, -3));
    tries.push(w.slice(0, -2), w.slice(0, -1));
    return tries.find(ok) || null;
  }
  /* Words with no side of their own: which way they push a strength ("stronger" is up, "gentler" is down). */
  const GENERIC = { strong: 1, weak: -1, big: 1, small: -1, large: 1, little: -1, heavy: 1, light: -1, hard: 1, intense: 1, gentle: -1, high: 1, low: -1, many: 1, few: -1 };
  function interpret(c, text, h) {
    const sp = spec(c) || {};
    const own = (c.sliders || []).filter((s) => !["themeLink", "pointsAhead"].includes(s.id));
    const out = new Map();
    const said = [];
    const nameOf = (s) => (s.id === c.main ? c.label : s.label);
    const put = (s, v, why) => {
      const k = h.sliderId(c, s);
      if (!S().known(k)) return false;
      const f = S().fix(k, v);
      if (f == null) return false;
      out.set(k, [k, f, nameOf(s)]);
      said.push(why);
      return true;
    };
    const cur = (s) => {
      const v = h.ctx.value(h.sliderId(c, s));
      return v == null ? null : v;
    };
    const posNow = (s) => {
      const k = h.sliderId(c, s);
      const p = posOf(k, cur(s));
      return p == null ? 0.5 : p;
    };
    const ordered = (s) => !!(s.range || (s.scale && !s.unordered && s.scale.length > 1));
    const isMain = (s) => s.id === c.main || s.id === "setting";
    /* Its own settings, without the ones every row shares (how noticeable, how it changes) unless named. */
    const mine = own.filter((s) => !SHARED.includes(s.id) && !["noticeable", "change"].includes(s.id));
    let t = tidy(text);
    const raw = String(text || "").toLowerCase();
    /* A preset's full name first, so a phrase inside it ("from below" in "Hero from below") does not split it. */
    const named = new Set();
    (sp.presets || [])
      .slice()
      .sort((a, b) => b.label.length - a.label.length)
      .forEach((p) => {
        const nm = p.label.toLowerCase();
        if (!t.includes(nm) && !raw.includes(nm)) return;
        Object.entries(p.set || {}).forEach(([sid, v]) => {
          const s = sl(c, sid);
          if (s) put(s, v, "");
        });
        said.push(`the preset "${p.label}"`);
        named.add(p);
        t = t.replace(nm, " ");
      });
    /* Plain-words phrases written for this curiosity (data/windows/say-<category>.js), longest first; a matched
       phrase is taken out of the request so its words are not read twice. */
    const PH = (window.CuriosityWindows && window.CuriosityWindows.phrases[c.id]) || {};
    Object.keys(PH)
      .sort((a, b) => b.length - a.length)
      .forEach((ph) => {
        const re = new RegExp("(^|[^a-z])" + ph.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)");
        if (!re.test(t)) return;
        Object.entries(PH[ph]).forEach(([sid, v]) => {
          const s = sl(c, sid);
          if (s) put(s, v, "");
        });
        said.push(`"${ph}"`);
        t = t.replace(re, "$1 $2");
      });
    /* A preset named in the request sets all of it first; the rest of the request can adjust it. */
    (sp.presets || []).forEach((p) => {
      if (named.has(p)) return;
      if (t.includes(p.label.toLowerCase()) || (words(p.label).length >= 2 && overlap(p.label, t) >= Math.min(3, words(p.label).length))) {
        Object.entries(p.set || {}).forEach(([sid, v]) => {
          const s = sl(c, sid);
          if (s) put(s, v, "");
        });
        said.push(`the preset "${p.label}"`);
      }
    });

    /* How well a part of the request names a slider: its label, its id's words, the curiosity's name for the
       main setting, a little for its plain words. Labels about timing or measuring count only when the request
       talks about time. */
    const TIMEY = /^(time|seconds?|minutes?|how long|when|measured|where|lands|arrives|starts?|fastest|longest|early|late|before|delay|lead|ahead|comes in|hint)\b/i;
    const TIMEWORDS = /\b(time|seconds?|minutes?|long|when|early|late|before|after|delay|wait|sooner|until|takes?)\b/;
    const labelWords = (s) => words(s.label + (isMain(s) ? " " + c.label : ""));
    const nameScore = (s, clause) => {
      const cw = words(clause);
      if (!cw.length) return 0;
      const lw = words(s.label);
      const iw = s.id === "setting" ? [] : words(s.id.replace(/([A-Z])/g, " $1").replace(/-/g, " "));
      let n = 0;
      cw.forEach((w) => {
        if (hasWord(lw, w)) n += 2;
        else if (hasWord(iw, w)) n += 1.5;
      });
      if (lw.length && lw.every((w) => hasWord(cw, w))) n += 1;
      if (isMain(s)) {
        const cl = words(c.label);
        cw.forEach((w) => hasWord(cl, w) && !hasWord(lw, w) && (n += 2));
        n += 0.3;
      }
      n += overlap(s.plain || "", clause) * 0.25;
      if (TIMEY.test(s.label) && !TIMEWORDS.test(clause)) n -= 1.5;
      if (s.range && unitOf(s) && !/\d/.test(clause)) n -= 0.4;
      return n;
    };
    const best = (clause, list, min) => {
      let top = null;
      let score = min == null ? 0 : min;
      list.forEach((s) => {
        const n = nameScore(s, clause);
        if (n > score) (score = n), (top = s);
      });
      return top;
    };
    /* The slider that holds "how much" of the curiosity, for a bare "more" or "less": the main setting when it is
       a plain number, else its strength. */
    const strengthOf = (except) => {
      const ok = (x) => x !== except && ordered(x) && !TIMEY.test(x.label);
      const main = mine.find((x) => isMain(x) && ok(x) && x.range && !unitOf(x));
      return (
        main ||
        mine.find((x) => ok(x) && /intens|strength|arous|wound up|energy|how much|how many|how strong|^level|force|thick|density|^size\b|^how big|pressure|^amount said/.test((x.id + " " + x.label).toLowerCase())) ||
        mine.find((x) => isMain(x) && ok(x) && x.range)
      );
    };
    /* Move a slider one or more steps from where it is (a quarter of its value for numbers, 15° for angles). */
    const nudge = (s, dir, lot, why) => {
      if (!s) return false;
      const k = h.sliderId(c, s);
      if (!S().known(k)) return false;
      let v;
      if (lot === "end") v = s.scale ? s.scale[dir > 0 ? s.scale.length - 1 : 0] : dir > 0 ? s.range.max : s.range.min;
      else if (s.scale) {
        const n = s.scale.length;
        const at = s.scale.indexOf(String(cur(s)));
        const now = at < 0 ? Math.round(posNow(s) * (n - 1)) : at;
        v = s.scale[Math.max(0, Math.min(n - 1, now + dir * lot))];
      } else {
        const r = s.range;
        const now = cur(s);
        const n = Number(now);
        const has = now != null && isFinite(n);
        const span = r.max - r.min;
        const step = r.step || 1;
        let d = unitOf(s) === "°" ? 15 * lot : has && n !== 0 ? Math.abs(n) * 0.25 * lot : span * 0.1 * lot;
        if (span <= 12) d = Math.max(d, step * lot);
        const base = has ? n : S().at(k, 0.5);
        v = S().fix(k, Math.max(r.min, Math.min(r.max, base + dir * d)));
      }
      if (String(v) === String(cur(s))) return false;
      return put(s, v, why || `${nameOf(s)}: ${dir > 0 ? "up" : "down"} to ${v}${s.range ? s.range.unit || "" : ""}`);
    };
    /* Where a word sits on a slider's scale. */
    function polarity(s, word) {
      const hits = [];
      if (s.scale && !s.unordered)
        s.scale.forEach((o, i) => {
          const ow = content(o);
          if (ow.length && ow.some((x) => same(x, word))) hits.push({ o, p: i / Math.max(1, s.scale.length - 1), exact: ow.length === 1 });
        });
      return hits;
    }
    /* The ends of a label that runs from one thing to another: "Cheap to expensive", "Reactive to Proactive". */
    const ends = (s) => {
      const m = String(s.label || "").toLowerCase().match(/^(.+?)\s+to\s+(.+)$/);
      return m && !/^(how|what|who|where|when|which|time|share|seconds|minutes|distance|space|gap|closer)\b/.test(m[1]) ? [words(m[1]), words(m[2])] : null;
    };
    /* Find what "more <word>" means here: a word on one side of a scale, an end of a label, or a slider named
       after it (or after a word that means the same; an opposite word counts the other way). */
    function resolve(word, sign, clause) {
      const C = concept(word);
      const alts = [[word, 1, 1]];
      if (C) {
        C.syn.filter((x) => x !== word).forEach((x) => alts.push([x, 1, 0.75]));
        C.vs.forEach((x) => {
          alts.push([x, -1, 0.55]);
          const V2 = CONCEPTS[x];
          if (V2) V2.syn.filter((y) => y !== x).forEach((y) => alts.push([y, -1, 0.45]));
        });
      }
      const cands = [];
      alts.forEach(([w0, flip, trust]) => {
        const ws = content(w0);
        if (!ws.length) return;
        const w = ws[ws.length - 1];
        mine.filter(ordered).forEach((s) => {
          const bonus = nameScore(s, clause) * 0.3 + (isMain(s) ? 0.8 : 0);
          const hits = polarity(s, w).filter((x) => x.p !== 0.5);
          if (hits.length) {
            const dir = hits.reduce((a, x) => a + (x.p - 0.5), 0) > 0 ? 1 : -1;
            return cands.push({ s, dir: dir * flip, score: 3 * trust + bonus + (hits.some((x) => x.exact) ? 0.2 : 0), via: "scale", hits, flip });
          }
          const e = ends(s);
          if (e && (e[1].some((x) => same(x, w)) || e[0].some((x) => same(x, w)))) {
            const d = e[1].some((x) => same(x, w)) ? flip : -flip;
            return cands.push({ s, dir: d, score: (sign < 0 ? 3.4 : 2.8) * trust + bonus, via: "ends" });
          }
          if (labelWords(s).concat(s.id !== "setting" ? words(s.id.replace(/([A-Z])/g, " $1")) : []).some((x) => same(x, w)))
            cands.push({ s, dir: flip, score: 2.4 * trust + bonus + (s.range && unitOf(s) ? -0.3 : 0) + (TIMEY.test(s.label) ? -1.5 : 0), via: "label" });
        });
      });
      if (!cands.length) return null;
      cands.sort((a, b) => b.score - a.score);
      if (window.SAYDEBUG) console.log("resolve", word, sign, cands.slice(0, 4).map((x) => [x.s.id, x.dir, x.via, Math.round(x.score * 100) / 100, (x.hits || []).map((y) => y.o).join("/")]));
      return cands[0];
    }
    /* Apply "more" or "less" of a resolved quality: step from where it is, and at least to the nearest word on the
       scale that says it ("more scared" is fearful, "warmer" from neutral is warm). */
    function lean(r, sign, lot, why) {
      const s = r.s;
      const dir = r.dir * sign;
      if (r.via === "scale" && s.scale && lot !== "end" && sign > 0 && r.flip > 0) {
        const n = s.scale.length;
        const at = s.scale.indexOf(String(cur(s)));
        const now = at < 0 ? Math.floor((n - 1) / 2) : at;
        const want = r.hits
          .map((x) => s.scale.indexOf(x.o))
          .filter((i) => (dir > 0 ? i > now : i < now))
          .sort((a, b) => Math.abs(a - now) - Math.abs(b - now))[0];
        const stepTo = Math.max(0, Math.min(n - 1, now + dir * lot));
        const i = want == null ? stepTo : dir > 0 ? Math.max(want, stepTo) : Math.min(want, stepTo);
        if (i !== now) return put(s, s.scale[i], why || `${nameOf(s)}: ${s.scale[i]}`);
      }
      return nudge(s, dir, lot, why);
    }
    /* Left, right, behind, above, below: turn an angle around the subject. */
    const ANGLEY = /\b(left|right|behind|from the back|from the front|head on|above|below|beneath|under|higher|lower|up high|down low|from up|from down|overhead|look(s|ing)? (down|up))\b/;
    function aroundMove(clause, lot) {
      const lr = mine.find((s) => s.range && unitOf(s) === "°" && /left or right/.test(s.label.toLowerCase()));
      const ud = mine.find((s) => s.range && unitOf(s) === "°" && /above or below|up or down/.test(s.label.toLowerCase()));
      const L2 = lot === "end" ? 6 : lot;
      let did = false;
      if (lr) {
        if (/\b(from )?behind\b|\bfrom the back\b/.test(clause)) did = put(lr, 180, `${nameOf(lr)}: behind (180°)`);
        else if (/\bfrom the front\b|\bhead on\b|\bstraight on\b/.test(clause)) did = put(lr, 0, `${nameOf(lr)}: in front (0°)`);
        else if (/\bleft\b/.test(clause)) did = nudge(lr, -1, L2);
        else if (/\bright\b/.test(clause)) did = nudge(lr, 1, L2);
      }
      if (ud) {
        if (/\b(above|over|higher|up high|from up|overhead|look(s|ing)? down)\b/.test(clause)) did = nudge(ud, 1, L2) || did;
        else if (/\b(below|under|beneath|lower|down low|from down|look(s|ing)? up)\b/.test(clause)) did = nudge(ud, -1, L2) || did;
      }
      return did;
    }
    /* Words of a request that ask for a direction rather than a thing. */
    const isDirWord = (w) => !!(baseOf(w) || VERBS[w] || /^(more|less|fewer|too|not|dont)$/.test(w));
    /* Option words that are themselves a trend or comparison ("warmer", "speeding up", "brighter by the end"). */
    const trendy = (o) => content(o).some((x) => (baseOf(x) && !CONCEPTS[x]) || /ing$/.test(x) || /^(slows|speeds|over|end)$/.test(x));
    const NUMBER_WORDS = /^(none|one|two|three|four|five|a few|many|several|1|2|3|4|5)$/;

    /* Split into parts, keeping words on this curiosity's scales whole ("black and white", "teal and orange"). */
    const keep = [];
    own.forEach((s) => (s.scale || []).forEach((o) => /\band\b|,/.test(String(o)) && keep.push(String(o).toLowerCase())));
    (sp.presets || []).forEach((p) => /\band\b/.test(p.label) && keep.push(p.label.toLowerCase()));
    keep.push("black and white", "and a half", "back and forth", "now and then", "on and off", "stop and go");
    keep.sort((a, b) => b.length - a.length).forEach((o) => {
      if (t.includes(o)) t = t.split(o).join(o.replace(/ and /g, " \u0001 ").replace(/,/g, "\u0002"));
    });
    const parts = t.split(/,|;|\band\b|\bthen\b|\bbut\b|\bplus\b|\balso\b|\.\s/).map((x) => x.replace(/\u0001/g, "and").replace(/\u0002/g, ",").trim()).filter(Boolean);

    parts.forEach((whole) => {
      let clause = whole;
      const lot = lotOf(clause);
      const neg = /\b(not|dont|never|no longer|stop being)\b/.test(clause);
      const nt0 = numbersIn(clause.replace(/\b(1[0-9]|20)?[0-9]0s\b/g, " "));
      const hasNum = /\d/.test(nt0);
      const toks = content(clause);
      const dirAsked = toks.some(isDirWord) || PHRASAL.some(([re]) => re.test(clause));
      /* 1. Nothing of it: "no music", "without blur", "turn off the captions", "stop blinking". */
      const zero = !hasNum && clause.match(/\b(?:no|without|turn(?:ed)? off|switch(?:ed)? off|stop|kill|get rid of|lose the|no more|zero|dont)\s+(?:the\s+|any\s+|all\s+|a\s+|more\s+)?(.+)$/);
      if (zero && !/\b(so|too|as)\s+(much|many)\b|\bso\b/.test(clause)) {
        const ZERO = /^(none|no|off|never|nothing|silent|still|stays|holds|0)$/i;
        const cand = best(zero[1], mine.filter((s) => (s.scale ? s.scale.some((o) => ZERO.test(String(o))) : s.range && s.range.min === 0)), 0.5);
        if (cand) {
          const z = cand.scale ? cand.scale.find((o) => ZERO.test(String(o))) : 0;
          if (put(cand, z, `${nameOf(cand)}: ${z}${cand.range ? cand.range.unit || "" : ""}`)) return;
        }
      }
      /* 2. Words on its scales (the longest wins, up to three settings in one part: "pan left", "fade out to
         white", "picture in picture in the corner"), or a beginner's word for one. */
      const otherNamed = (s0, txt) => {
        const rest = txt.replace(/\b(more|less|fewer|extra|lots of)\b/g, " ");
        const b = best(rest, mine.filter((x) => x !== s0 && ordered(x)), 1.9);
        return b && b !== s0 ? b : null;
      };
      const findHit = (txt, taken, first) => {
        let hit = null;
        const consider = (s, o, sc, span) => {
          if (taken.has(s) || SHARED.includes(s.id)) return;
          const lab = overlap(s.label, txt);
          /* A comparison word on a side setting ("warmer than the room", "speeding up") is a direction, unless
             the request names that setting; a number word ("one") only counts where the setting is named. */
          if (!isMain(s) && !lab && trendy(o) && first) return;
          if (!isMain(s) && !lab && NUMBER_WORDS.test(String(o).toLowerCase())) return;
          if (!hit || sc > hit.sc) hit = { s, o, sc, span };
        };
        own.forEach((s) =>
          (s.scale || []).forEach((o) => {
            const w = String(o).toLowerCase();
            if (w.length > 1 && phraseIn(txt, w) && (first || w.length > 2)) consider(s, o, w.length + overlap(s.label, txt) * 3 + (isMain(s) ? 1 : 0), w);
          })
        );
        if (!(hasNum && first)) {
          SAYS.forEach(([re, to]) => {
            const m = txt.match(re);
            if (!m) return;
            to.forEach((w, i) =>
              own.forEach((s) =>
                (s.scale || []).forEach((o) => {
                  if (String(o).toLowerCase() === w) consider(s, o, m[0].length + 0.5 - i * 0.3 + overlap(s.label, txt) * 2 + (isMain(s) ? 1 : 0), m[0]);
                })
              )
            );
          });
        }
        if (!hit && first && !hasNum && !dirAsked) {
          /* Other forms of a word on a scale ("burst into the room" is "bursts in", "rewind" is "rewind and replay"). */
          const cw = content(txt);
          const cl = words(c.label);
          own.forEach((s) =>
            (s.scale || []).forEach((o) => {
              const ow = content(o).filter((x) => x.length > 2);
              if (!ow.length) return;
              const got = ow.filter((x) => cw.some((y) => same(x, y)));
              if (!got.length || got.every((x) => hasWord(cl, x))) return;
              if (got.length === ow.length || (got[0] === ow[0] && ow.length <= 3 && got.length * 2 >= ow.length))
                consider(s, o, got.join(" ").length * 0.8 + overlap(s.label, txt) * 3 + (isMain(s) ? 1 : 0) - (got.length < ow.length ? 2 : 0), null);
            })
          );
        }
        return hit;
      };
      const taken = new Set();
      let hit = findHit(clause, taken, true);
      /* "more flicker" when a setting is called Flicker: that setting, not the word "flicker" on another scale. */
      if (hit && /\b(more|less|fewer|extra|lots of)\b/.test(clause) && otherNamed(hit.s, clause) && overlap(hit.s.label, clause) === 0) hit = null;
      if (hit && /\b(more|less|too|not|so|fewer|heavier|harder|stronger|weaker|lighter)\b/.test(clause) && String(hit.o) === String(cur(hit.s)) && strengthOf(hit.s)) {
        /* The word is already set: "more rain" when it rains means harder. */
        if (nudge(strengthOf(hit.s), /\b(less|fewer|lighter|weaker|not so|too)\b/.test(clause) ? -1 : 1, lot)) return;
      }
      let did = false;
      while (hit && taken.size < 3) {
        const w = String(hit.o).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const s = hit.s;
        taken.add(s);
        /* "not so close", "less wide", "too dark", "dont make it so fast": step away from that word (from where
           it is now when that is further). */
        if (s.scale.length > 2 && !s.unordered && new RegExp("\\b(not|less|too|dont|never)\\b[^,.]{0,24}?\\b(so|too|that|very|as)?\\s*" + w + "([^a-z]|$)").test(clause)) {
          const i = s.scale.indexOf(hit.o);
          const away = i < (s.scale.length - 1) / 2 ? 1 : -1;
          const now = cur(s) == null ? -1 : s.scale.indexOf(String(cur(s)));
          const j = now < 0 ? i + away : away > 0 ? Math.max(i + away, now + away) : Math.min(i + away, now + away);
          const v = s.scale[Math.max(0, Math.min(s.scale.length - 1, j))];
          did = put(s, v, `${nameOf(s)}: ${v} (not so ${hit.o})`) || did;
        } else {
          did = put(s, hit.o, `${nameOf(s)}: ${hit.o}`) || did;
          /* "more smoke", "more confetti": the word and more of it. */
          const st = strengthOf(s);
          if (st && new RegExp("\\b(more|lots of|extra|heavier|bigger|thicker|stronger)\\s+(\\w+\\s+)?" + w).test(clause)) nudge(st, 1, lot);
        }
        if (hit.span) clause = clause.replace(hit.span, " ");
        hit = findHit(clause, taken, false);
      }
      if (did && !/\d/.test(numbersIn(clause.replace(/\b(1[0-9]|20)?[0-9]0s\b/g, " ")))) return;
      /* 3. A number, with a unit if one is said. */
      const nt = numbersIn(clause.replace(/\b(1[0-9]|20)?[0-9]0s\b/g, " "));
      const m = nt.match(/(-?\d+(?:\.\d+)?)\s*(°c|°|%|\$|x\b|[a-z']+(?:\s+(?:per|a|an|\/)\s+[a-z]+|\s+of\s+(?:width|frame|hair|height))?)?/);
      if (m) {
        let n = Number(m[1]);
        const said2 = (m[2] || "").trim();
        const known = UNITS.some(([, re]) => re.test(said2));
        let unit = said2 ? canonUnit(said2) : "";
        /* "5 laughs a minute", "20 cuts per minute": the rate is the unit, the noun names the slider. */
        const rate = nt.match(/\b(per|a|an|each|every)\s+(minute|min|second|sec|hour)\b/);
        if (rate && !known) unit = canonUnit("per " + rate[2]);
        /* "3 in the afternoon", "9 pm". */
        if (/\b(pm|p\.m\.|in the (afternoon|evening)|at night|tonight)\b/.test(nt) && n < 12) (n += 12), (unit = "o'clock");
        else if (/\b(am|a\.m\.|in the morning|o'?clock)\b/.test(nt)) unit = "o'clock";
        /* "2x" or "4 times faster" on a speed measured in %: 2x is 200%. */
        const speedPct = own.find((s) => s.range && s.range.unit === "%" && !SHARED.includes(s.id) && /speed|rate|pace/.test((s.label + " " + s.id).toLowerCase()));
        if (unit === "x" && !own.some((s) => s.range && unitOf(s) === "x") && speedPct && !labelHasTimes()) (n *= 100), (unit = "%");
        function labelHasTimes() {
          return own.some((s) => s.range && /\btimes\b/.test(s.label.toLowerCase()) && !unitOf(s));
        }
        const upish = /\b(more|further|farther|higher|longer|bigger|brighter|louder|faster|warmer|wider|extra|another|add|up|later|forward|stronger|thicker|deeper)\b/.test(nt);
        const downish = /\b(less|fewer|closer|nearer|lower|shorter|smaller|darker|quieter|slower|cooler|tighter|down|earlier|back|weaker|thinner)\b/.test(nt);
        const relative = (upish || downish) && !(upish && downish) && !/\b(to|at|exactly)\s+-?\d/.test(nt) && unit !== "%" && unit !== "x";
        const mult = /\btimes\b/.test(nt) && unit === "x" && (upish || downish || /\bas\b/.test(nt)) ? n : null;
        if (/\b(left|below|under|down)\b/.test(clause) && n > 0 && unit === "°" && !relative) n = -n;
        const nums0 = own.filter((s) => s.range && !taken.has(s) && (!SHARED.includes(s.id) || overlap(s.label, clause) > 0));
        const unitWord = said2 && !known && !rate ? stemOf(said2.split(" ")[0]) : "";
        const labelHas = (s, u) =>
          !!u && (labelWords(s).some((x) => same(x, u)) || (u === "/min" && /per minute|a minute|per min/.test(s.label.toLowerCase())) || (u === "x" && /\btimes\b/.test(s.label.toLowerCase())));
        const fits = (s) => unitOf(s) === unit || labelHas(s, unit) || (unit === "°" && unitOf(s) === "°C") || (unit === "/min" && /\/min/.test(unitOf(s)));
        let nums = !unit || mult ? nums0 : nums0.filter(fits);
        /* A setting with no unit whose label the request names ("1 second pause" on Pause before the punchline). */
        if (unit && !mult) nums = nums.concat(nums0.filter((s) => !unitOf(s) && !nums.includes(s) && nameScore(s, clause) >= 2));
        if (!nums.length && unit && !known) nums = nums0;
        if (!unit && !mult) {
          /* No unit: a setting with no unit, or the one it names. */
          const plain = nums.filter((s) => !unitOf(s) || unitOf(s) === "x");
          if (plain.length && !best(clause, nums.filter((s) => unitOf(s)), 1.5)) nums = plain;
        }
        const score = (s) => nameScore(s, clause) + (unitWord && labelHas(s, unitWord) ? 1 : 0) + (unit && unitOf(s) === unit ? 0.5 : 0);
        let s = null;
        let top = -5;
        nums.forEach((x) => {
          const v = score(x);
          if (v > top) (top = v), (s = x);
        });
        if (s) {
          const k = h.sliderId(c, s);
          const now = Number(cur(s) == null ? S().at(k, 0.5) : cur(s));
          let v = n;
          let note = "";
          if (mult != null) (v = downish ? now / mult : now * mult), (note = ` (${downish ? "÷" : "×"}${mult})`);
          else if (relative) (v = now + (downish && !upish ? -n : n)), (note = ` (${downish && !upish ? "-" : "+"}${n})`);
          v = Math.max(s.range.min, Math.min(s.range.max, v));
          if (put(s, v, `${nameOf(s)}: ${S().fix(k, v)}${s.range.unit || ""}${note}`)) return;
        }
      }
      if (did) return;
      /* 4. More or less of something. */
      const half = /\b(by half|in half|half as \w+|halve)\b/.test(clause) ? 0.5 : /\b(twice as|double)\b/.test(clause) ? 2 : null;
      let sign = 0;
      let base = null;
      let lotX = lot;
      PHRASAL.some(([re, b, sg, l2]) => re.test(clause) && ((base = b), (sign = sg), l2 && (lotX = l2), true));
      if (!sign)
        toks.some((w) => {
          if (VERBS[w]) return (base = VERBS[w][0]), (sign = VERBS[w][1]), true;
          const b = baseOf(w);
          if (b && b !== "many" && b !== "few") return (base = b), (sign = 1), true;
          return false;
        });
      const tooM = clause.match(/\b(too|so|that)\s+(\w+)/);
      if (tooM && !sign && !/^(much|many|the|a|it|far|long)$/.test(tooM[2])) (base = baseOf(tooM[2]) || tooM[2]), (sign = 1);
      const moreM = clause.match(/\b(more|less)\s+(\w+)/);
      if (!sign && moreM && concept(moreM[2])) (base = moreM[2]), (sign = moreM[1] === "more" ? 1 : -1);
      const genericUp = MORE_WORDS.test(clause);
      const genericDown = LESS_WORDS.test(clause) || /\bfewer\b/.test(clause);
      if (!sign && (genericUp || genericDown) && genericUp !== genericDown) sign = genericUp ? 1 : -1;
      if (!sign && neg && /\b(so|as|that) (much|many|often)\b/.test(clause)) sign = -1;
      /* Bare describing words ("controlling", "optimistic", "a rebel", "the light changes slowly"): the last one
         that means something here. */
      if (!sign) {
        const polar = toks
          .slice()
          .reverse()
          .find((w) => w.length > 3 && concept(w) && resolve(w, 1, clause));
        if (polar) (base = polar), (sign = 1);
      }
      /* "less X", "not so X", "too X", "dont make it X". */
      if (base && sign > 0 && (/\b(less|not so|not as|not that|too|no longer|isn't)\b/.test(clause) || (neg && !/\b(dont|not) (stop|lose)\b/.test(clause)))) sign = -sign;
      if (ANGLEY.test(clause) && aroundMove(clause, lotX)) return;
      if (sign) {
        if (base && base !== "many" && base !== "few") {
          const r = resolve(base, sign, clause);
          if (r) {
            if (half && r.s.range) {
              const now = Number(cur(r.s) == null ? S().at(h.sliderId(c, r.s), 0.5) : cur(r.s));
              const f = r.dir * sign > 0 ? (half === 0.5 ? 1.5 : 2) : 0.5;
              return put(r.s, now * f, `${nameOf(r.s)}: ${S().fix(h.sliderId(c, r.s), now * f)}${r.s.range.unit || ""}`);
            }
            if (lean(r, sign, lotX)) return;
          }
          /* A plain "stronger", "weaker", "bigger": more or less of whatever the rest of the request names. */
          if (GENERIC[base] != null) sign = sign * GENERIC[base];
        }
        /* "more X", "less X", "add X", "turn the music down": the slider X names, or its strength. */
        const ord = mine.filter(ordered);
        const rest = toks.filter((w) => !isDirWord(w) && !MORE_WORDS.test(w) && !LESS_WORDS.test(w) && !/^(bit|lot|little|way|very|far|add|make|turn|keep|some|really|super|slightly)$/.test(w)).join(" ");
        const bare = !words(rest).length;
        const named2 = bare ? null : best(rest, ord, 0.9);
        const onlyOptions = !bare && own.some((x) => (x.scale || []).some((o) => phraseIn(rest, String(o).toLowerCase())));
        const s = named2 || (bare || onlyOptions ? strengthOf() : null);
        if (s && half && s.range) {
          const now = Number(cur(s) == null ? S().at(h.sliderId(c, s), 0.5) : cur(s));
          return put(s, now * (sign > 0 ? (half === 2 ? 2 : 1.5) : 0.5), `${nameOf(s)}: ${sign > 0 ? "up" : "down"}`);
        }
        if (s && nudge(s, sign, lotX)) return;
      }
      /* 5. A feeling or genre word that names a setting ("creepier", "like a thriller", "obsessed"). */
      const feel = toks.map((w) => concept(w) || concept(baseOf(w) || "")).find(Boolean);
      if (feel) {
        const s = mine.filter(ordered).find((x) => feel.syn.some((w) => labelWords(x).some((y) => same(y, w))));
        if (s) nudge(s, 1, lot);
      }
    });
    return { set: [...out.values()], said: said.filter(Boolean) };
  }

  /* ---------- the live picture (Jeremy, 17:44Z: "see the results on the screen") ----------
     Every window opens with a picture of what its settings do (data/windows/look-<category>.js). It shows the
     values at the playhead and redraws while a slider is being dragged, before the node is set. */
  function lookGet(c, h, over) {
    return (s) => {
      const k = h.sliderId(c, s);
      if (over && over[k] != null) return over[k];
      return h.ctx.value(k);
    };
  }
  function lookHtml(c, h) {
    const W = window.CuriosityWindows;
    if (!W || !W.looks || !W.looks[c.id]) return "";
    let pic = "";
    try {
      pic = W.drawLook(c, lookGet(c, h));
    } catch (e) {
      pic = "";
    }
    if (!pic) return "";
    return `<div class="sc-wpart cw-look"><div class="cw-look-pic" data-cw-look="${h.esc(c.id)}">${pic}</div><p class="sc-k">At this moment. Move anything below and watch it change; the picture stays in view.</p></div>`;
  }
  /* Redraw the picture in the window around el with some values not set yet (a pad or orbit mid-drag). */
  function lookLive(el, list, api) {
    const win = el && el.closest && el.closest(".sc-win");
    const box = win && win.querySelector("[data-cw-look]");
    const c = box && window.CurioLevels && window.CurioLevels.get("curiosity", box.dataset.cwLook);
    if (!c || !api || !api.helpers) return;
    const over = {};
    list.forEach(([k, v]) => (over[k] = v));
    try {
      box.innerHTML = window.CuriosityWindows.drawLook(c, lookGet(c, api.helpers(), over));
    } catch (err) {}
  }
  /* While a slider moves, redraw that window's picture with the value under the finger. */
  function input(e, h) {
    const t = e.target;
    const d = t && t.dataset;
    const win = t && t.closest && t.closest(".sc-win");
    if (!d || !win) return false;
    if (d.cwShapePick || d.cwShapeTimes || d.cwShapeDepth) {
      const id = d.cwShapePick || d.cwShapeTimes || d.cwShapeDepth;
      const m = (shapeMem[id] = shapeMem[id] || {});
      m[d.cwShapePick ? "pick" : d.cwShapeTimes ? "times" : "depth"] = t.value;
      return false;
    }
    const box = win.querySelector("[data-cw-look]");
    const c = box && window.CurioLevels && window.CurioLevels.get("curiosity", box.dataset.cwLook);
    if (!c) return false;
    let k = null;
    let v = null;
    if (d.stepSet) {
      k = d.stepSet;
      v = JSON.parse(d.scale)[Number(t.value)];
    } else if (d.set && t.type === "range") {
      k = d.set;
      v = Number(t.value);
    }
    if (!k) return false;
    try {
      box.innerHTML = window.CuriosityWindows.drawLook(c, lookGet(c, h, { [k]: v }));
    } catch (err) {}
    return false;
  }
  function sayHtml(c, h) {
    const mic = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const sp = spec(c) || {};
    const eg = (sp.presets || [])[0];
    return `<div class="sc-wpart cw-say"><h4>Say what you want</h4><div class="cw-say-row"><input type="text" data-cw-say-text="${h.esc(c.id)}" placeholder="${h.esc(eg ? `e.g. "${eg.label}", or "a bit more", or a number`  : 'e.g. "a bit more", or a number')}" aria-label="Say what you want ${h.esc(c.label)} to do"${h.ctx.edit ? "" : " disabled"}>${mic ? `<button type="button" data-cw-mic="${h.esc(c.id)}" title="Speak it" aria-label="Speak it"${h.ctx.edit ? "" : " disabled"}>🎤</button>` : ""}<button type="button" data-cw-say="${h.esc(c.id)}"${h.ctx.edit ? "" : " disabled"}>Do it</button></div><p class="sc-k" data-cw-heard="${h.esc(c.id)}">Plain words set the settings below at the playhead, as one undo step. Or open them up and fine-tune.</p></div>`;
  }

  /* ---------- actions ---------- */
  function click(d, t, h, api) {
    const L = window.CurioLevels;
    if (d.cwMidi) return midiClick(d.cwMidi, api);
    const get = (id) => L && L.get("curiosity", id);
    if (d.cwPreset) {
      const [cid, i] = d.cwPreset.split("|");
      const c = get(cid);
      const sp = c && spec(c);
      const p = sp && (sp.presets || [])[Number(i)];
      if (!p) return true;
      const list = Object.keys(p.set || {}).map((sid) => [keyOf(c, h, sid), p.set[sid]]).filter(([k]) => k && S().known(k));
      list.forEach(([k]) => api.showLane(k));
      if (list.length) api.setValues(list, `${c.label}: ${p.label}`);
      return true;
    }
    if (d.cwShape) {
      const [cid, shape] = d.cwShape.split("|");
      const c = get(cid);
      if (!c) return true;
      const win = t.closest(".sc-win");
      const sel = win && win.querySelector(`[data-cw-shape-pick="${cid}"]`);
      const s = sl(c, sel ? sel.value : c.main);
      const id = s && h.sliderId(c, s);
      const times0 = win && win.querySelector(`[data-cw-shape-times="${cid}"]`);
      const depth0 = win && win.querySelector(`[data-cw-shape-depth="${cid}"]`);
      shapeMem[cid] = { pick: s && s.id, times: times0 && times0.value, depth: depth0 && depth0.value };
      const n = h.ctx.beats.length;
      const range = api.range ? api.range() : null;
      const times = win && win.querySelector(`[data-cw-shape-times="${cid}"]`);
      const depth = win && win.querySelector(`[data-cw-shape-depth="${cid}"]`);
      const items = id ? shapeItems(id, shape, n, range ? range[0] : 0, range ? range[1] : n - 1, times ? Number(times.value) : 1, depth ? Number(depth.value) : 1) : [];
      if (!items.length) return api.toast("My film needs moments before a shape can be drawn."), true;
      const label = (SHAPES.find((x) => x[0] === shape) || [])[1];
      api.setAt(items, `${label}: ${s.id === c.main ? c.label : s.label}`);
      return true;
    }
    if (d.cwSay) {
      const c = get(d.cwSay);
      const win = t.closest(".sc-win");
      const box = win && win.querySelector(`[data-cw-say-text="${d.cwSay}"]`);
      return say(c, box ? box.value : "", h, api, win), true;
    }
    if (d.cwMic) {
      const c = get(d.cwMic);
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      const win = t.closest(".sc-win");
      if (!R || !c) return true;
      const rec = new R();
      rec.lang = navigator.language || "en-US";
      rec.interimResults = false;
      t.classList.add("on");
      rec.onresult = (ev) => {
        const heard = ev.results[0][0].transcript;
        const box = win && win.querySelector(`[data-cw-say-text="${d.cwMic}"]`);
        if (box) box.value = heard;
        say(c, heard, h, api, win);
      };
      rec.onend = () => t.classList.remove("on");
      rec.onerror = () => api.toast("The microphone didn't catch that. Type it instead.");
      rec.start();
      return true;
    }
    if (d.cwSurprise) {
      const c = get(d.cwSurprise);
      if (!c) return true;
      const list = (c.sliders || [])
        .filter((s) => !SHARED.includes(s.id))
        .map((s) => [h.sliderId(c, s), s.scale ? s.scale[Math.floor(Math.random() * s.scale.length)] : Math.round((s.range.min + Math.random() * (s.range.max - s.range.min)) / (s.range.step || 1)) * (s.range.step || 1)])
        .filter(([k]) => S().known(k));
      if (list.length) api.setValues(list, `Surprise: ${c.label}`);
      return true;
    }
    return false;
  }
  function say(c, text, h, api, win) {
    if (!c || !String(text).trim()) return;
    const r = interpret(c, text, h);
    const note = win && win.querySelector(`[data-cw-heard="${c.id}"]`);
    if (!r.set.length) {
      const msg = `I couldn't match that to ${c.label}'s settings. Try a word from one of its lists, a number, or "more" or "less" of a setting.`;
      if (note) note.textContent = msg;
      return api.toast(msg);
    }
    r.set.forEach(([k]) => api.showLane(k));
    api.setValues(r.set.map(([k, v]) => [k, v]), `${c.label}: "${String(text).slice(0, 40)}"`);
    api.toast(`${c.label}: ${r.said.join("; ")}`);
  }
  /* Pad and frame: click or drag to set two settings at once (one undo step when let go). */
  function pointer(e, api) {
    if (orbitPointer(e, api)) return true;
    const el = e.target.closest && e.target.closest("[data-xy]");
    if (!el || el.classList.contains("dis")) return false;
    e.preventDefault();
    const [ix, iy] = el.dataset.xy.split("|");
    const at = (ev) => {
      const r = el.getBoundingClientRect();
      return [Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), Math.max(0, Math.min(1, 1 - (ev.clientY - r.top) / r.height))];
    };
    let last = at(e);
    const dot = () => {
      let d = el.querySelector(".cw-dot");
      if (!d) {
        d = document.createElement("i");
        d.className = "cw-dot";
        el.appendChild(d);
      }
      d.style.left = last[0] * 100 + "%";
      d.style.top = (1 - last[1]) * 100 + "%";
    };
    dot();
    const pending = () => [[ix, last[0]], [iy, last[1]]].filter(([k]) => k && S().known(k)).map(([k, p]) => [k, S().at(k, p)]);
    const move = (ev) => ((last = at(ev)), dot(), lookLive(el, pending(), api));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const list = [];
      if (ix && S().known(ix)) list.push([ix, S().at(ix, last[0])]);
      if (iy && S().known(iy)) list.push([iy, S().at(iy, last[1])]);
      list.forEach(([k]) => api.showLane(k));
      if (list.length) api.setValues(list, "Set from the pad");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return true;
  }

  /* Enter in the "say what you want" box does it. */
  function keydown(e, h, api) {
    const box = e.target && e.target.closest && e.target.closest("[data-cw-say-text]");
    if (!box) return false;
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      const c = window.CurioLevels && window.CurioLevels.get("curiosity", box.dataset.cwSayText);
      say(c, box.value, h, api, box.closest(".sc-win"));
    }
    return true;
  }
  /* Orbit: from above, the pointer's angle around the subject and its distance; from the side, its height. */
  function orbitPointer(e, api) {
    const el = e.target.closest && e.target.closest("[data-orbit-top], [data-orbit-side]");
    if (!el || el.closest(".cw-orbit.dis")) return false;
    e.preventDefault();
    const svg = el.querySelector("svg");
    const topView = el.hasAttribute("data-orbit-top");
    const [ka, kd] = topView ? el.dataset.orbitTop.split("|") : [];
    const kh = topView ? null : el.dataset.orbitSide;
    let list = [];
    const at = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 100;
      const y = ((ev.clientY - r.top) / r.height) * 100;
      list = [];
      if (topView) {
        const dx = x - 50;
        const dy = y - 50;
        const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
        if (S().known(ka)) list.push([ka, S().fix(ka, Math.round(deg))]);
        if (kd && S().known(kd)) {
          const p = Math.max(0, Math.min(1, (Math.hypot(dx, dy) / 40 - 0.18) / 0.82));
          list.push([kd, S().at(kd, p * p)]);
        }
      } else if (S().known(kh)) {
        const deg = (Math.atan2(50 - y, x - 22) * 180) / Math.PI;
        list.push([kh, S().fix(kh, Math.round(Math.max(-90, Math.min(90, deg))))]);
      }
      const tip = el.querySelector("small");
      if (tip) tip.textContent = list.map(([k, v]) => v).join(" · ");
      lookLive(el, list, api);
    };
    at(e);
    const up = () => {
      window.removeEventListener("pointermove", at);
      window.removeEventListener("pointerup", up);
      list.forEach(([k]) => api.showLane(k));
      if (list.length) api.setValues(list, topView ? "Move around the subject" : "Move above or below");
    };
    window.addEventListener("pointermove", at);
    window.addEventListener("pointerup", up);
    return true;
  }

  /* ---------- MIDI learn: one knob, fader or pad on any MIDI controller moves one setting ----------
     Bindings are this window's own (curiosities-window-midi-v1), not CurioAuto's patches: a knob writes nodes
     at the playhead once it settles, as one undo step; a pad steps the setting to its next value. */
  const MIDI_KEY = "curiosities-window-midi-v1";
  const midi = { map: {}, learning: null, hooked: false, api: null, pending: {}, timer: null };
  try {
    midi.map = JSON.parse(localStorage.getItem(MIDI_KEY) || "{}") || {};
  } catch (e) {}
  const midiSave = () => {
    try {
      localStorage.setItem(MIDI_KEY, JSON.stringify(midi.map));
    } catch (e) {}
  };
  const ctlName = (b) => (b ? (b.startsWith("cc:") ? `knob ${b.slice(3)}` : `pad ${b.slice(5)}`) : "");
  const boundTo = (id) => Object.keys(midi.map).find((b) => midi.map[b] === id) || "";
  function midiBtn(id) {
    const b = boundTo(id);
    const learning = midi.learning === id;
    const tip = learning ? "Listening: move a knob or hit a pad. Click again to forget it." : b ? `Your ${ctlName(b)} moves this. Click to pick another, twice to forget it.` : "Learn: click, then move a knob or hit a pad on your MIDI controller";
    return `<button type="button" class="cw-midi${b ? " on" : ""}${learning ? " learning" : ""}" data-cw-midi="${String(id).replace(/"/g, "&quot;")}" title="${tip}" aria-label="${tip}">🎹${b ? `<small>${ctlName(b)}</small>` : ""}</button>`;
  }
  function midiRefresh(id) {
    document.querySelectorAll(`[data-cw-midi="${id}"]`).forEach((el) => (el.outerHTML = midiBtn(id)));
  }
  function midiFlush() {
    midi.timer = null;
    const list = Object.entries(midi.pending);
    midi.pending = {};
    if (!list.length || !midi.api) return;
    list.forEach(([k]) => midi.api.showLane(k));
    midi.api.setValues(list, "From your MIDI controller");
  }
  function onMidi(type, ev) {
    if (type !== "midi" || !ev || (ev.kind === "note" && !ev.on)) return;
    const b = `${ev.kind === "cc" ? "cc" : "note"}:${ev.num}`;
    if (midi.learning) {
      const id = midi.learning;
      midi.learning = null;
      Object.keys(midi.map).forEach((x) => (x === b || midi.map[x] === id) && delete midi.map[x]);
      midi.map[b] = id;
      midiSave();
      midiRefresh(id);
      if (midi.api) midi.api.toast(`Your ${ctlName(b)} now moves this setting.`);
      return;
    }
    const id = midi.map[b];
    if (!id || !S() || !S().known(id)) return;
    if (ev.kind === "cc") midi.pending[id] = S().at(id, ev.val / 127);
    else {
      /* A pad steps to the next value on the setting's scale and wraps round at the end. */
      const now = midi.pending[id] != null ? midi.pending[id] : midi.api && midi.api.value ? midi.api.value(id) : null;
      const p = now == null ? 0 : S().pos(id, now);
      const dom = S().domain(id);
      const step = dom && dom.kind === "choice" ? 1 / Math.max(1, dom.options.length - 1) : 0.25;
      midi.pending[id] = S().at(id, p == null || p >= 1 - step / 2 ? 0 : p + step);
    }
    clearTimeout(midi.timer);
    midi.timer = setTimeout(midiFlush, ev.kind === "cc" ? 250 : 0);
  }
  function midiHook() {
    const A = window.CurioAuto;
    if (midi.hooked || !A || !A.on) return !!midi.hooked;
    A.on(onMidi);
    midi.hooked = true;
    return true;
  }
  /* The Screen hands over its node writer once; stored bindings start listening without a click. */
  function attach(api) {
    midi.api = api;
    if (Object.keys(midi.map).length && midiHook() && window.CurioAuto.connectMidi) window.CurioAuto.connectMidi();
  }
  function midiClick(id, api) {
    midi.api = api || midi.api;
    if (midi.learning === id) {
      midi.learning = null;
      Object.keys(midi.map).forEach((x) => midi.map[x] === id && delete midi.map[x]);
      midiSave();
      midiRefresh(id);
      return true;
    }
    const was = midi.learning;
    if (!midiHook()) return api.toast("MIDI isn't loaded on this page."), true;
    midi.learning = id;
    if (was) midiRefresh(was);
    midiRefresh(id);
    window.CurioAuto.connectMidi().then((ok) => {
      if (!ok) {
        midi.learning = null;
        midiRefresh(id);
        api.toast("This browser can't reach MIDI. Chrome and Edge can, with your controller plugged in.");
      } else api.toast("Move a knob or hit a pad on your controller.");
    });
    return true;
  }

  window.CurioWindowFaces = { FACES: Object.keys(FACE), SHAPES: SHAPES.map((s) => s[0]), html, sayHtml, lookHtml, input, live: lookLive, interpret, grouped, click, pointer, shapeItems, spec, keydown, midiBtn, attach, midi: { bindings: () => Object.assign({}, midi.map), feed: onMidi } };
  function CSS() {
    return `
.cw-faces { gap: 10px; }
.cw-face { display: grid; gap: 6px; }
.cw-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 4px; }
.sc-page .cw-tiles button { display: grid; justify-items: center; gap: 2px; padding: 6px 4px; font-size: 10px; line-height: 1.2; border-top: 3px solid var(--sw, transparent); }
.cw-tiles i { font-style: normal; font-size: 20px; line-height: 1; }
.cw-swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); gap: 5px; }
.sc-page .cw-swatches button { display: grid; justify-items: center; gap: 3px; padding: 4px 2px; font-size: 9px; background: none; }
.cw-swatches i { width: 30px; height: 30px; border-radius: 50%; background: var(--sw); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15); }
.sc-page .cw-swatches button.on i { box-shadow: 0 0 0 2px #111, 0 0 0 4px var(--cc-accent); }
.cw-dial { display: flex; align-items: center; gap: 12px; }
.cw-dial .sc-knob svg { width: 72px; height: 72px; }
.cw-dial .sc-knob b { font-size: 16px; min-width: 3ch; }
.cw-dial .sc-knob .cw-arc { fill: none; stroke: #3a3a40; stroke-width: 2; stroke-linecap: round; }
.cw-dial small { color: var(--cc-dim); font-size: 10px; line-height: 1.4; }
.cw-ladder { display: grid; gap: 3px; }
.sc-page .cw-ladder button { justify-self: center; width: var(--w); padding: 4px 6px; font-size: 10px; }
.sc-page .cw-ladder button.below { background: color-mix(in srgb, var(--cc-accent) 22%, var(--cc-raised)); }
.sc-page .cw-ladder button.on { background: var(--cc-accent); color: var(--cc-accent-ink); font-weight: 700; }
.cw-balance svg { width: 100%; height: 46px; display: block; }
.cw-balance line { stroke: #b8b8c0; stroke-width: 2.5; stroke-linecap: round; transition: transform 0.2s; }
.cw-balance circle { fill: var(--cc-accent); }
.cw-balance .cw-fulcrum { fill: #55555c; }
.cw-ends { display: flex; justify-content: space-between; font-size: 10px; color: var(--cc-dim); }
.cw-row { display: flex; flex-wrap: wrap; gap: 3px; }
.sc-page .cw-row button { flex: 1 1 auto; padding: 3px 4px; font-size: 10px; }
.cw-compass { position: relative; width: 210px; height: 210px; justify-self: center; }
.cw-compass svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.cw-compass svg circle { fill: #17171a; stroke: var(--cc-line); stroke-width: 1.5; }
.cw-compass svg .cw-hub { fill: var(--cc-accent); stroke: none; }
.cw-compass svg line { stroke: var(--cc-accent); stroke-width: 3; stroke-linecap: round; }
.sc-page .cw-compass button { position: absolute; transform: translate(-50%, -50%); padding: 2px 6px; font-size: 9px; max-width: 86px; line-height: 1.15; border-radius: 10px; }
.cw-mixer { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
.cw-fader { flex: 1 0 54px; display: grid; justify-items: center; gap: 3px; padding: 4px 2px; border: 1px solid var(--cc-line); border-radius: 6px; }
.cw-fader-track { height: 110px; width: 28px; display: grid; place-items: center; }
.cw-fader-track input[type="range"] { width: 106px; transform: rotate(-90deg); }
.cw-fader output { font-size: 10px; color: var(--cc-accent); text-align: center; }
.cw-fader small { font-size: 9px; color: var(--cc-dim); text-align: center; line-height: 1.2; }
.cw-pad, .cw-frame { position: relative; border-radius: 8px; border: 1px solid var(--cc-line); cursor: crosshair; touch-action: none; overflow: hidden; }
.cw-pad { height: 170px; background: radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.2), transparent 60%), radial-gradient(circle at 0% 100%, rgba(255, 159, 67, 0.15), transparent 60%), #17171a; }
.cw-pad.dis, .cw-frame.dis { cursor: default; opacity: 0.7; }
.cw-grid { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(var(--cc-line) 1px, transparent 1px), linear-gradient(90deg, var(--cc-line) 1px, transparent 1px); background-size: 25% 25%; opacity: 0.5; }
.cw-pad-x, .cw-pad-y { position: absolute; font-size: 9px; color: var(--cc-dim); pointer-events: none; z-index: 1; }
.cw-pad-x { bottom: 3px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
.cw-pad-y { left: 3px; top: 50%; transform: rotate(-90deg) translateX(-50%); transform-origin: left top; white-space: nowrap; }
.cw-dot { position: absolute; width: 14px; height: 14px; border-radius: 50%; transform: translate(-50%, -50%); background: #fff; box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.4); pointer-events: none; z-index: 2; }
.cw-frame { height: 150px; background: #121214; }
.cw-frame svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.cw-frame .cw-thirds { fill: none; stroke: #2e2e33; stroke-width: 0.6; }
.cw-frame g { fill: none; stroke: #d6d6dc; stroke-width: 2.2; stroke-linecap: round; }
.cw-frame g circle { fill: #d6d6dc; }
.cw-frame .cw-dot { width: 10px; height: 10px; }
.cw-orbit { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.cw-orbit > div { position: relative; border: 1px solid var(--cc-line); border-radius: 8px; background: #121214; cursor: grab; touch-action: none; }
.cw-orbit.dis > div { cursor: default; opacity: 0.7; }
.cw-orbit svg { width: 100%; height: auto; display: block; }
.cw-orbit small { position: absolute; left: 6px; top: 4px; font-size: 9px; color: var(--cc-dim); pointer-events: none; }
.cw-orbit .cw-ring { fill: none; stroke: #2e2e33; stroke-width: 0.8; }
.cw-orbit .cw-subj { fill: #d6d6dc; stroke: none; }
.cw-orbit .cw-subj path { fill: none; stroke: #d6d6dc; stroke-width: 2; stroke-linecap: round; }
.cw-orbit g rect, .cw-orbit g path { fill: var(--cc-accent); }
.cw-orbit .cw-look { stroke: var(--cc-accent); stroke-width: 0.8; stroke-dasharray: 2 2; }
.cw-orbit .cw-t { fill: #6b6b73; font-size: 5px; }
.cw-orbit-read { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 10px; color: var(--cc-dim); }
.cw-orbit-read b { color: var(--cc-text); }
.sc-page .sc-cur-win.sc-finetune { font-size: 10px; padding: 1px 7px; border: 1px solid var(--cc-line); border-radius: 10px; color: var(--cc-accent); }
.cw-say-row { display: flex; gap: 4px; }
.cw-say-row input { flex: 1 1 auto; min-width: 0; border: 1px solid var(--cc-line); background: #121214; color: var(--cc-text); border-radius: 6px; padding: 5px 8px; font: inherit; }
.cw-say-row input:focus { border-color: var(--cc-accent); outline: none; }
.sc-page .cw-say-row button[data-cw-say] { background: var(--cc-accent); color: var(--cc-accent-ink); font-weight: 700; }
.sc-page .cw-say-row button.on { box-shadow: 0 0 0 2px #ff5656; }
.cw-say p { margin: 0; }
.cw-preset-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px; }
.sc-page .cw-preset-row button { display: grid; gap: 2px; text-align: left; padding: 6px 8px; border-left: 3px solid var(--cc-warm); }
.cw-preset-row b { font-size: 11px; }
.cw-preset-row small { font-size: 9.5px; color: var(--cc-dim); line-height: 1.3; }
.cw-shape-row { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.sc-page .cw-shape-row button { display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; font-size: 10px; }
.sc-page button.cw-midi { padding: 1px 4px; font-size: 11px; line-height: 1.2; opacity: 0.55; background: none; }
.sc-page button.cw-midi.on { opacity: 1; color: var(--cc-accent); }
.sc-page button.cw-midi small { margin-left: 2px; font-size: 9px; }
.sc-page button.cw-midi.learning { opacity: 1; outline: 1px solid var(--cc-accent); animation: cw-blink 0.8s steps(2) infinite; }
@keyframes cw-blink { 50% { outline-color: transparent; } }
.sc-page .sc-win .cw-look { position: sticky; top: -8px; z-index: 3; background: var(--cc-panel, #1b1b1f); padding-top: 4px; padding-bottom: 4px; }
.sc-page .sc-win .sc-frames button span { cursor: pointer; padding: 1px 5px; background: rgba(255, 255, 255, 0.85); border-radius: 3px; }
.cw-look-pic { border-radius: 6px; overflow: hidden; background: #111; line-height: 0; }
.cw-look-pic svg { width: 100%; height: auto; display: block; }
.sc-page .sc-win .sc-chips { display: flex; flex-wrap: wrap; gap: 3px; }
.sc-page .sc-win .sc-chips button { padding: 3px 7px; font-size: 10px; border-radius: 10px; }
.sc-page .sc-win .sc-chips button.on { background: var(--cc-accent); color: var(--cc-accent-ink); }
.cw-shape-row label { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--cc-dim); }
.cw-shape-row svg { width: 22px; height: 14px; fill: none; stroke: var(--cc-accent); stroke-width: 1.6; stroke-linejoin: round; }
`;
  }
})();
