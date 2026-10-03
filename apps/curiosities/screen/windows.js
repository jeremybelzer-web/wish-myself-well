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
  function shapeItems(id, shape, n, from, to) {
    const f = (SHAPES.find((s) => s[0] === shape) || [])[2];
    if (!f || !S() || !S().known(id)) return [];
    const a = Math.max(0, from || 0);
    const b = Math.min(n - 1, to == null ? n - 1 : to);
    const out = [];
    for (let j = a; j <= b; j++) {
      const t = b > a ? (j - a) / (b - a) : 0;
      out.push([id, j, S().at(id, Math.max(0, Math.min(1, f(t, j - a))))]);
    }
    return out;
  }

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
      const pick = (h.focus && shapeable.find((s) => h.sliderId(c, s) === h.focus)) || shapeable.find((s) => s.id === c.main) || shapeable[0];
      parts.push(`<div class="sc-wpart cw-shape"><h4>Shape over my film</h4><p class="sc-k">Draw a whole movement for one setting across every moment of my film. One undo step.</p>
        <div class="cw-shape-row"><select data-cw-shape-pick="${esc(c.id)}" aria-label="Which setting to shape">${shapeable.map((s) => `<option value="${esc(s.id)}"${s === pick ? " selected" : ""}>${esc(s.id === c.main ? c.label : s.label)}</option>`).join("")}</select>
        ${SHAPES.map(([k, label]) => `<button type="button" data-cw-shape="${esc(c.id)}|${k}" title="${esc(label)} across the film">${shapeIcon(k)}<span>${esc(label)}</span></button>`).join("")}</div>
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

  /* ---------- actions ---------- */
  function click(d, t, h, api) {
    const L = window.CurioLevels;
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
      const n = h.ctx.beats.length;
      const range = api.range ? api.range() : null;
      const items = id ? shapeItems(id, shape, n, range ? range[0] : 0, range ? range[1] : n - 1) : [];
      if (!items.length) return api.toast("My film needs moments before a shape can be drawn."), true;
      const label = (SHAPES.find((x) => x[0] === shape) || [])[1];
      api.setAt(items, `${label}: ${s.id === c.main ? c.label : s.label}`);
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
    const move = (ev) => ((last = at(ev)), dot());
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

  window.CurioWindowFaces = { FACES: Object.keys(FACE), SHAPES: SHAPES.map((s) => s[0]), html, grouped, click, pointer, shapeItems, spec };
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
.cw-preset-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px; }
.sc-page .cw-preset-row button { display: grid; gap: 2px; text-align: left; padding: 6px 8px; border-left: 3px solid var(--cc-warm); }
.cw-preset-row b { font-size: 11px; }
.cw-preset-row small { font-size: 9.5px; color: var(--cc-dim); line-height: 1.3; }
.cw-shape-row { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.sc-page .cw-shape-row button { display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; font-size: 10px; }
.cw-shape-row svg { width: 22px; height: 14px; fill: none; stroke: var(--cc-accent); stroke-width: 1.6; stroke-linejoin: round; }
`;
  }
})();
