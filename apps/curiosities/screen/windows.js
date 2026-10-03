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
      return `<div class="cw-pad${h.ctx.edit ? "" : " dis"}" data-xy="${h.esc(ix)}|${h.esc(iy)}" role="application" aria-label="${h.esc(sx.label)} across, ${h.esc(sy.label)} up"><span class="cw-pad-x">${h.esc(xl)}</span><span class="cw-pad-y">${h.esc(yl)}</span><i class="cw-grid" aria-hidden="true"></i>${px != null && py != null ? `<i class="cw-dot" style="--x:${px};--y:${1 - py}"></i>` : ""}</div><p class="sc-k">Click or drag on the pad to set both at once.</p>`;
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

  /* ---------- hand-made faces: wheel, curve, stage ----------
     Three controls drawn for what their curiosities are about, rather than a generic knob or pad:
       wheel  a color wheel with one dot: its angle is the color (a word on the setting's list, or degrees), its
              distance from the middle how strong. The middle is no color (a "neutral" or "none" word if the list
              has one).
       curve  3 to 5 points over my film (or the play range): drag them up or down to draw how a setting rises
              and falls. Letting go writes a node on every moment, one undo step, like Shape over my film.
       stage  the scene from above: drag the camera and one or two people around, nearer or farther. Each one
              moves the settings it is tied to (degrees around, distance).
     Each one works with the mouse, touch (pointer events) and the keyboard (arrow keys on the focused control),
     redraws the live picture while it moves, shows the 🎹 MIDI learn and key buttons for its settings, and draws
     its fallback face (or a plain one) when a setting it needs is missing. */
  const HUE_WORDS = [["red", 0], ["orange", 30], ["amber", 40], ["gold", 45], ["yellow", 55], ["lime", 90], ["green", 120], ["teal", 175], ["cyan", 185], ["blue", 220], ["violet", 270], ["purple", 280], ["magenta", 310], ["pink", 330]];
  const clamp01 = (p) => Math.max(0, Math.min(1, Number(p) || 0));
  const valOf = (h, k, over) => (over && over[k] != null ? over[k] : h.ctx.value(k));
  const fmtV = (s, v) => (v == null || v === "" ? "–" : s && s.range ? `${Math.round(Number(v) * 100) / 100}${s.range.unit && !/^[a-z]/i.test(s.range.unit) ? s.range.unit : s.range.unit ? " " + s.range.unit : ""}` : String(v));
  const ordered = (s) => !!(s && (s.range || (s.scale && !s.unordered && s.scale.length > 1)));
  const known = (k) => !!(k && S() && S().known(k));
  const faceIndex = (c, f) => ((spec(c) || {}).faces || []).indexOf(f);
  /* The hue and how colorful a hex color is: [degrees, 0 to 1]. */
  function hexHue(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const d = mx - mn;
    if (d < 0.08) return [0, 0];
    let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh = (hh * 60 + 360) % 360;
    return [hh, d / (1 - Math.abs(mx + mn - 1) || 1)];
  }
  /* A row under a hand-made face: the key and 🎹 buttons of each setting it moves, with its value now. */
  function readRow(h, list, over) {
    const F = window.CurioWindowFaces;
    return `<div class="cw-hand-read">${list
      .map(([s, k, name]) => `<span>${h.keyBtn(k, h.ctx)}${F && F.midiBtn ? F.midiBtn(k) : ""}${h.esc(name || s.label)} <b>${h.esc(fmtV(s, valOf(h, k, over)))}</b></span>`)
      .join("")}</div>`;
  }

  /* Wheel: { face: "wheel", hue, strength, colors?: { word: "#hex" } } */
  function wheelModel(c, f, h, over) {
    const hs = sl(c, f.hue);
    const ss = sl(c, f.strength);
    const hk = keyOf(c, h, f.hue);
    const sk = keyOf(c, h, f.strength);
    if (!hs || !ss || !known(hk) || !known(sk) || !(hs.scale || hs.range) || !ordered(ss)) return null;
    let opts = null;
    if (hs.scale) {
      opts = hs.scale.map((o) => {
        const hx = f.colors && f.colors[o] ? hexHue(f.colors[o]) : null;
        const w = HUE_WORDS.find(([word]) => new RegExp("\\b" + word + "\\b").test(String(o).toLowerCase()));
        const neutral = /^(none|neutral|no color|white|gray|grey|black|matches the key)$/i.test(String(o)) || (hx ? hx[1] < 0.18 : !w);
        return { o, deg: hx && !neutral ? hx[0] : w ? w[1] : 0, neutral, hex: (f.colors && f.colors[o]) || null };
      });
      if (!opts.some((x) => !x.neutral)) return null;
    }
    const full = hs.range && /°/.test(hs.range.unit || "") && hs.range.max - hs.range.min >= 300;
    const hv = valOf(h, hk, over);
    const sv = valOf(h, sk, over);
    let deg = 0;
    let neutralNow = false;
    if (opts) {
      const o = opts.find((x) => on(hv, x.o));
      deg = o ? o.deg : 0;
      neutralNow = !!(o && o.neutral);
    } else {
      const n = Number(hv);
      deg = full ? (((isFinite(n) ? n : 0) % 360) + 360) % 360 : 360 * (posOf(hk, hv) || 0);
    }
    const sp = posOf(sk, sv);
    return { kind: "wheel", c, f, hs, ss, hk, sk, opts, full, deg, r: neutralNow ? 0 : sp == null ? 0.5 : sp, hv, sv };
  }
  /* The hue setting's value at an angle (and the strength's at a distance from the middle, 0 to 1). */
  function wheelAt(m, deg, r) {
    deg = ((deg % 360) + 360) % 360;
    const list = [];
    if (m.opts) {
      const neutral = m.opts.find((x) => x.neutral);
      if (r < 0.12 && neutral) {
        list.push([m.hk, neutral.o], [m.sk, S().at(m.sk, 0)]);
        return list;
      }
      const dist = (a) => Math.min(Math.abs(a - deg), 360 - Math.abs(a - deg));
      const best = m.opts.filter((x) => !x.neutral).sort((a, b) => dist(a.deg) - dist(b.deg))[0];
      list.push([m.hk, best.o]);
    } else if (m.full) {
      const R = m.hs.range;
      let v = deg;
      if (v > R.max) v -= 360;
      if (v < R.min) v += 360;
      list.push([m.hk, S().fix(m.hk, Math.max(R.min, Math.min(R.max, Math.round(v))))]);
    } else list.push([m.hk, S().at(m.hk, deg / 360)]);
    list.push([m.sk, S().at(m.sk, clamp01(r))]);
    return list;
  }
  function wheelInner(m, h, over) {
    const dis = !h.ctx.edit;
    const rad = (m.deg * Math.PI) / 180;
    const R = 50 * m.r;
    const labels = m.opts
      ? m.opts.filter((x) => !x.neutral).map((x) => [x.o, x.deg, x.hex])
      : [0, 90, 180, 270].map((d) => [m.full ? `${d}°` : String(S().at(m.hk, d / 360)) + (m.hs.range.unit === "°" ? "°" : ""), d, null]);
    const neutral = m.opts && m.opts.find((x) => x.neutral);
    const hueTxt = fmtV(m.hs, m.hv);
    return `<div class="cw-wheel-ring">${labels
      .map(([t, d, hex]) => `<span class="cw-wheel-l" style="left:${(50 + 47 * Math.sin((d * Math.PI) / 180)).toFixed(1)}%;top:${(50 - 47 * Math.cos((d * Math.PI) / 180)).toFixed(1)}%"${hex ? ` data-hex="${h.esc(hex)}"` : ""}>${h.esc(t)}</span>`)
      .join("")}<div class="cw-wheel-disc${dis ? " dis" : ""}" data-hand-focus="wheel" role="slider" tabindex="${dis ? -1 : 0}" aria-label="Color wheel: ${h.esc(m.hs.label)} around, ${h.esc(m.ss.label)} out from the middle. Left and right arrows turn the color; up and down make it stronger or weaker." aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(m.r * 100)}" aria-valuetext="${h.esc(hueTxt)}, ${h.esc(fmtV(m.ss, m.sv))}"><i class="cw-wheel-mid" aria-hidden="true">${neutral ? h.esc(neutral.o) : ""}</i><i class="cw-dot" style="left:${(50 + R * Math.sin(rad)).toFixed(2)}%;top:${(50 - R * Math.cos(rad)).toFixed(2)}%"></i></div></div>${readRow(h, [[m.hs, m.hk], [m.ss, m.sk]], over)}<p class="sc-k">Place the dot: around the wheel picks the color, farther out makes it stronger${neutral ? `, the middle is ${h.esc(neutral.o)}` : ""}.</p>`;
  }
  function wheelKey(m, key) {
    const list = [];
    if (/Left|Right/.test(key)) {
      const dir = key === "ArrowRight" ? 1 : -1;
      if (m.opts) {
        const ring = m.opts.filter((x) => !x.neutral).sort((a, b) => a.deg - b.deg);
        const i = ring.findIndex((x) => on(m.hv, x.o));
        const next = i < 0 ? ring[0] : ring[(i + dir + ring.length) % ring.length];
        list.push([m.hk, next.o]);
        if (m.r < 0.12) list.push([m.sk, S().at(m.sk, 0.5)]);
      } else list.push(wheelAt(m, m.deg + dir * (m.full ? 15 : 360 / Math.max(4, Math.min(24, S().steps(m.hk)))), m.r)[0]);
    } else {
      const dir = key === "ArrowUp" ? 1 : -1;
      const p = posOf(m.sk, m.sv);
      const st = 1 / Math.max(1, Math.min(20, S().steps(m.sk)));
      list.push([m.sk, S().at(m.sk, clamp01((p == null ? 0.5 : p) + dir * st))]);
      if (m.opts && dir > 0 && m.r < 0.12 && m.opts.find((x) => on(m.hv, x.o) && x.neutral)) list.push([m.hk, m.opts.find((x) => !x.neutral).o]);
    }
    return list;
  }

  /* Curve: { face: "curve", slider, points?: 3 to 5 } over my film (or the play range). */
  function spanNow(n, api) {
    let r = null;
    try {
      r = api && api.range ? api.range() : window.CurioScreen && window.CurioScreen.state ? window.CurioScreen.state().range : null;
    } catch (e) {
      r = null;
    }
    if (!Array.isArray(r)) return [0, n - 1];
    const a = Math.max(0, Math.min(n - 1, r[0] | 0));
    const b = Math.max(0, Math.min(n - 1, r[1] | 0));
    return a < b ? [a, b] : [0, n - 1];
  }
  function curveModel(c, f, h, over, api) {
    const s = sl(c, f.slider);
    const k = keyOf(c, h, f.slider);
    const beats = h.ctx.beats || [];
    if (!s || !known(k) || !ordered(s) || beats.length < 2) return null;
    const [a, b] = spanNow(beats.length, api);
    const n = Math.max(2, Math.min(Math.max(3, Math.min(5, f.points || 4)), b - a + 1));
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(Math.round(a + ((b - a) * i) / (n - 1)));
    const lane = (j) => {
      const vals = beats[j] && beats[j].values;
      const v = vals && vals[k] != null ? vals[k] : S().start(k);
      const p = posOf(k, v);
      return p == null ? 0.5 : p;
    };
    const ps = over && over.points ? over.points.slice() : xs.map(lane);
    const row = window.CurioScreen && window.CurioScreen.row ? window.CurioScreen.row() : 0;
    const m = { kind: "curve", c, f, s, k, a, b, n, xs, ps, lane, row, beats: beats.length, sel: Math.max(0, Math.min(n - 1, curveSel[k] == null ? 0 : curveSel[k])) };
    return m;
  }
  const curveSel = {};
  /* Its place (0 to 1) at moment j: an eased line from point to point, so it never overshoots. */
  function curveP(m, j) {
    if (j <= m.xs[0]) return m.ps[0];
    for (let i = 0; i < m.n - 1; i++) {
      const x0 = m.xs[i];
      const x1 = m.xs[i + 1];
      if (j <= x1) {
        const t = x1 > x0 ? (j - x0) / (x1 - x0) : 1;
        return m.ps[i] + (m.ps[i + 1] - m.ps[i]) * ((1 - Math.cos(Math.PI * t)) / 2);
      }
    }
    return m.ps[m.n - 1];
  }
  function curveItems(m) {
    const out = [];
    for (let j = m.a; j <= m.b; j++) out.push([m.k, j, S().at(m.k, clamp01(curveP(m, j)))]);
    return out;
  }
  const CW = 200;
  const CH = 90;
  const cx = (m, j) => 8 + ((CW - 16) * (j - m.a)) / Math.max(1, m.b - m.a);
  const cy = (p) => 6 + (CH - 12) * (1 - p);
  function curveInner(m, h, over) {
    const dis = !h.ctx.edit;
    const pts = [];
    const span = m.b - m.a;
    const steps = Math.max(24, span * 4);
    for (let i = 0; i <= steps; i++) {
      const j = m.a + (span * i) / steps;
      pts.push(`${cx(m, j).toFixed(1)} ${cy(curveP(m, j)).toFixed(1)}`);
    }
    const lo = m.s.scale ? m.s.scale[0] : fmtV(m.s, m.s.range.min);
    const hi = m.s.scale ? m.s.scale[m.s.scale.length - 1] : fmtV(m.s, m.s.range.max);
    const grid = m.s.scale ? m.s.scale.map((_, i) => cy(i / (m.s.scale.length - 1))) : [0, 0.25, 0.5, 0.75, 1].map(cy);
    const lane = [];
    for (let j = m.a; j <= m.b; j++) lane.push(`<circle class="cw-curve-lane" cx="${cx(m, j).toFixed(1)}" cy="${cy(m.lane(j)).toFixed(1)}" r="1.4"/>`);
    const here = m.row >= m.a && m.row <= m.b ? `<line class="cw-curve-now" x1="${cx(m, m.row).toFixed(1)}" x2="${cx(m, m.row).toFixed(1)}" y1="2" y2="${CH - 2}"/>` : "";
    const selV = S().at(m.k, clamp01(m.ps[m.sel]));
    return `<div class="cw-curve-box${dis ? " dis" : ""}" data-hand-focus="curve" role="slider" tabindex="${dis ? -1 : 0}" aria-label="${h.esc(m.s.label)} across my film: ${m.n} points. Left and right arrows pick a point, up and down move it." aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(m.ps[m.sel] * 100)}" aria-valuetext="Point ${m.sel + 1} of ${m.n}, moment ${m.xs[m.sel] + 1}: ${h.esc(fmtV(m.s, selV))}"><span class="cw-curve-hi">${h.esc(hi)}</span><span class="cw-curve-lo">${h.esc(lo)}</span><svg viewBox="0 0 ${CW} ${CH}" preserveAspectRatio="none" aria-hidden="true">${grid.map((y) => `<line class="cw-curve-grid" x1="0" x2="${CW}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`).join("")}${here}${lane.join("")}<path class="cw-curve-line" d="M${pts.join("L")}"/>${m.xs
      .map((x, i) => `<circle class="cw-curve-pt${i === m.sel ? " sel" : ""}" cx="${cx(m, x).toFixed(1)}" cy="${cy(m.ps[i]).toFixed(1)}" r="${i === m.sel ? 5 : 4}"/>`)
      .join("")}</svg></div>${readRow(h, [[m.s, m.k, `${m.s.id === m.c.main ? m.c.label : m.s.label}, here`]], over)}<p class="sc-k">Drag the points to draw it across ${m.a === 0 && m.b === m.beats - 1 ? "my film" : "the play range"} (moments ${m.a + 1} to ${m.b + 1}); letting go writes every moment as one undo step. Faint dots are the lane now.</p>`;
  }

  /* Stage: { face: "stage", walk?, tokens: [{ who: "person" | "camera", label?, about?: index, around?, distance?, angle? }] }
     A token with "about" sits around an earlier one: around 0° is in front of it (toward the bottom of the plan),
     90° to its right; its distance grows from the middle out. A token without "about" stands still. */
  function stageModel(c, f, h, over) {
    let people = 0;
    const toks = (f.tokens || []).slice(0, 3).map((t, i) => {
      const who = t.who === "camera" ? "camera" : "person";
      const sa = t.around ? sl(c, t.around) : null;
      const sd = t.distance ? sl(c, t.distance) : null;
      const ka = sa ? keyOf(c, h, t.around) : null;
      const kd = sd ? keyOf(c, h, t.distance) : null;
      const label = t.label || (who === "camera" ? "Camera" : String.fromCharCode(65 + people));
      if (who === "person") people++;
      return { t, i, who, label, sa: known(ka) && ordered(sa) ? sa : null, ka: known(ka) && ordered(sa) ? ka : null, sd: known(kd) && ordered(sd) ? sd : null, kd: known(kd) && ordered(sd) ? kd : null };
    });
    const free = toks.filter((x) => x.t.about != null && x.t.about < x.i && (x.ka || x.kd));
    if (!free.length) return null;
    toks.forEach((x) => {
      const anc = x.t.about != null && x.t.about < x.i ? toks[x.t.about] : null;
      x.anchor = anc;
      x.drag = !!(anc && (x.ka || x.kd));
      if (!anc) {
        x.pos = Array.isArray(x.t.at) ? x.t.at : x.who === "camera" ? [50, 92] : [50, 50];
        return;
      }
      let deg = x.t.angle != null ? x.t.angle : x.who === "camera" ? 0 : 90;
      if (x.ka) {
        const v = valOf(h, x.ka, over);
        deg = x.sa.scale ? 180 * (posOf(x.ka, v) || 0) : Number(v) || 0;
      }
      let R = 22;
      if (x.kd) {
        const p = posOf(x.kd, valOf(h, x.kd, over));
        R = 6 + 38 * Math.sqrt(p == null ? 0.3 : clamp01(p));
      }
      const rad = (deg * Math.PI) / 180;
      x.deg = deg;
      x.R = R;
      x.pos = [Math.max(3, Math.min(97, anc.pos[0] + R * Math.sin(rad))), Math.max(3, Math.min(97, anc.pos[1] + R * Math.cos(rad)))];
    });
    return { kind: "stage", c, f, toks };
  }
  /* The settings a stage token takes from a place on the plan (x, y from 0 to 100). */
  function stageAt(m, tok, x, y) {
    const a = tok.anchor.pos;
    const dx = x - a[0];
    const dy = y - a[1];
    const list = [];
    if (tok.ka) {
      const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
      if (tok.sa.scale) list.push([tok.ka, S().at(tok.ka, Math.abs(deg) / 180)]);
      else {
        const R = tok.sa.range;
        let v = R.min >= 0 && R.max <= 180 ? Math.abs(deg) : R.max > 180 ? (deg + 360) % 360 : deg;
        list.push([tok.ka, S().fix(tok.ka, Math.max(R.min, Math.min(R.max, v)))]);
      }
    }
    if (tok.kd) {
      const p = clamp01((Math.hypot(dx, dy) - 6) / 38);
      list.push([tok.kd, S().at(tok.kd, p * p)]);
    }
    return list;
  }
  function stageKey(m, tok, key) {
    const list = [];
    const around = /Left|Right/.test(key) && tok.ka;
    if (around) {
      const dir = key === "ArrowRight" ? 1 : -1;
      const v = valOf(m.h, tok.ka);
      if (tok.sa.scale) list.push([tok.ka, S().at(tok.ka, clamp01((posOf(tok.ka, v) || 0) + dir / (tok.sa.scale.length - 1)))]);
      else {
        const R = tok.sa.range;
        const st = Math.max(R.step || 1, Math.round(15 / (R.step || 1)) * (R.step || 1));
        let n = (Number(v) || 0) + dir * st;
        if (R.min < 0 && R.max >= 180) n = n > 180 ? n - 360 : n < -180 ? n + 360 : n;
        list.push([tok.ka, S().fix(tok.ka, Math.max(R.min, Math.min(R.max, n)))]);
      }
    } else if (tok.kd) {
      const dir = key === "ArrowUp" || key === "ArrowRight" ? 1 : -1;
      const p = posOf(tok.kd, valOf(m.h, tok.kd));
      list.push([tok.kd, S().at(tok.kd, clamp01((p == null ? 0.3 : p) + dir / Math.max(1, Math.min(20, S().steps(tok.kd)))))]);
    }
    return list;
  }
  function stageInner(m, h, over) {
    const dis = !h.ctx.edit;
    const look = (x) => {
      if (m.f.walk && x.who === "person") return [0, 1];
      const to = x.anchor || m.toks.find((y) => y.anchor === x && y.who === "person") || m.toks.find((y) => y !== x && y.who === "camera");
      if (!to) return [0, 1];
      const dx = to.pos[0] - x.pos[0];
      const dy = to.pos[1] - x.pos[1];
      const d = Math.hypot(dx, dy) || 1;
      return [dx / d, dy / d];
    };
    const draw = (x) => {
      const [ux, uy] = look(x);
      const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
      const [px, py] = x.pos.map((v) => v.toFixed(1));
      if (x.who === "camera")
        return `<g class="cw-stage-cam" transform="translate(${px} ${py}) rotate(${ang.toFixed(1)})"><path class="cw-stage-cone" d="M4 0L40 -15M4 0L40 15"/><rect x="-5" y="-3.5" width="8" height="7" rx="1.2"/><path d="M3 -2l4 -2v8l-4 -2z"/></g>`;
      return `<g class="cw-stage-person" transform="translate(${px} ${py})"><ellipse rx="5.5" ry="3.2" transform="rotate(${(ang + 90).toFixed(1)})"/><circle r="3"/><path d="M${(ux * 3).toFixed(2)} ${(uy * 3).toFixed(2)}L${(ux * 6.5).toFixed(2)} ${(uy * 6.5).toFixed(2)}"/><text y="1.4" text-anchor="middle">${h.esc(x.label.slice(0, 1))}</text></g>`;
    };
    const links = m.toks
      .filter((x) => x.anchor)
      .map((x) => {
        const [ax, ay] = x.anchor.pos;
        const [bx, by] = x.pos;
        const tip = x.kd ? fmtV(x.sd, valOf(h, x.kd, over)) : "";
        return `<line class="cw-stage-link" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/>${tip ? `<text class="cw-stage-t" x="${((ax + bx) / 2 + 1.5).toFixed(1)}" y="${((ay + by) / 2 - 1.5).toFixed(1)}">${h.esc(tip)}</text>` : ""}`;
      })
      .join("");
    const walk = m.f.walk ? m.toks.filter((x) => x.who === "person").map((x) => `<path class="cw-stage-walk" d="M${x.pos[0].toFixed(1)} ${(x.pos[1] + 8).toFixed(1)}v10m-3 -3l3 3l3 -3"/>`).join("") : "";
    const handles = m.toks
      .filter((x) => x.drag)
      .map((x) => {
        const parts = [x.ka ? `${x.sa.label} ${fmtV(x.sa, valOf(h, x.ka, over))}` : "", x.kd ? `${x.sd.label} ${fmtV(x.sd, valOf(h, x.kd, over))}` : ""].filter(Boolean).join(", ");
        const keys = x.ka && x.kd ? "Left and right arrows move it around, up and down farther or nearer." : "Arrow keys move it farther or nearer.";
        return `<span class="cw-tok${x.who === "camera" ? " cam" : ""}" data-tok="${x.i}" data-hand-focus="tok${x.i}" role="slider" tabindex="${dis ? -1 : 0}" style="left:${x.pos[0].toFixed(2)}%;top:${x.pos[1].toFixed(2)}%" aria-label="${h.esc(x.label)} on the floor plan. ${keys}" aria-valuetext="${h.esc(parts)}"></span>`;
      })
      .join("");
    const read = [];
    m.toks.forEach((x) => {
      if (x.ka) read.push([x.sa, x.ka]);
      if (x.kd) read.push([x.sd, x.kd]);
    });
    const names = m.toks.filter((x) => x.drag).map((x) => (x.who === "camera" ? "the camera" : x.label)).join(" or ");
    return `<div class="cw-stage-floor${dis ? " dis" : ""}"><svg viewBox="0 0 100 100" aria-hidden="true"><rect class="cw-stage-bg" x="0" y="0" width="100" height="100"/><path class="cw-stage-grid" d="M25 0v100M50 0v100M75 0v100M0 25h100M0 50h100M0 75h100"/><text class="cw-stage-t" x="50" y="98.5" text-anchor="middle">front</text><text class="cw-stage-t" x="50" y="4" text-anchor="middle">behind</text>${links}${walk}${m.toks.map(draw).join("")}</svg>${handles}</div>${readRow(h, read, over)}<p class="sc-k">From above. Drag ${h.esc(names)} around the floor; each place is its own lane.</p>`;
  }

  const HAND = {
    wheel: { model: wheelModel, inner: wheelInner },
    curve: { model: curveModel, inner: curveInner },
    stage: { model: stageModel, inner: stageInner },
  };
  /* The face a hand-made face falls back to when it cannot be drawn: its own "fallback", or a plain control for
     the first of its settings that exists. */
  function fallbackOf(c, f) {
    if (f.fallback && f.fallback.face && !HAND[f.fallback.face]) return f.fallback;
    const ids = f.face === "wheel" ? [f.hue, f.strength] : f.face === "curve" ? [f.slider] : (f.tokens || []).flatMap((t) => [t.around, t.distance]);
    const s = ids.filter(Boolean).map((sid) => sl(c, sid)).find(Boolean);
    if (!s) return null;
    const sid = s.id === c.main ? "setting" : s.id;
    if (f.face === "wheel" && s.scale && f.colors && sid === f.hue) return { face: "swatches", slider: sid, colors: f.colors };
    return s.range ? { face: "dial", slider: sid } : s.scale && !s.unordered ? { face: "ladder", slider: sid } : { face: "tiles", slider: sid };
  }
  function handFace(kind) {
    return (c, f, h) => {
      const m = HAND[kind].model(c, f, h, null);
      if (!m) return "";
      return `<div class="cw-hand cw-${kind}" data-cw-hand="${h.esc(c.id)}|${faceIndex(c, f)}">${HAND[kind].inner(m, h, null)}</div>`;
    };
  }
  FACE.wheel = handFace("wheel");
  FACE.curve = handFace("curve");
  FACE.stage = handFace("stage");
  /* The hand-made face under el: its curiosity, its spec and the model built from values now (or over). */
  function handOf(el, api, over) {
    const [cid, i] = String(el.dataset.cwHand || "").split("|");
    const c = window.CurioLevels && window.CurioLevels.get("curiosity", cid);
    const f = c && ((spec(c) || {}).faces || [])[Number(i)];
    if (!f || !HAND[f.face] || !api || !api.helpers) return null;
    const h = api.helpers();
    const m = HAND[f.face].model(c, f, h, over, api);
    if (m) m.h = h;
    return m ? { c, f, h, m, id: el.dataset.cwHand } : null;
  }
  function handRedraw(el, hd, over) {
    const m = HAND[hd.f.face].model(hd.c, hd.f, hd.h, over);
    if (m) el.innerHTML = HAND[hd.f.face].inner(m, hd.h, over);
    return m;
  }
  /* After a write the window is drawn again: put the keyboard back on the same control. */
  function handRefocus(id, which) {
    const go = () => {
      const el = document.querySelector(`[data-cw-hand="${id}"] [data-hand-focus="${which}"]`);
      if (el && document.activeElement !== el) el.focus({ preventScroll: true });
    };
    go();
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(go);
  }
  function handWrite(list, label, api) {
    list = list.filter(([k, v]) => known(k) && v != null);
    if (!list.length) return;
    list.forEach(([k]) => api.showLane(k));
    api.setValues(list, label);
  }
  function handPointer(e, el, api) {
    if (e.target.closest("button") || !e.target.closest(".cw-wheel-ring, .cw-curve-box, .cw-stage-floor") || el.querySelector(".dis")) return false;
    const hd = handOf(el, api);
    if (!hd) return false;
    e.preventDefault();
    const { m, f } = hd;
    const kind = f.face;
    const box = el.querySelector(kind === "wheel" ? ".cw-wheel-disc" : kind === "curve" ? ".cw-curve-box svg" : ".cw-stage-floor");
    if (!box) return false;
    let tok = null;
    let list = [];
    let over = null;
    const rect = () => (el.querySelector(kind === "wheel" ? ".cw-wheel-disc" : kind === "curve" ? ".cw-curve-box svg" : ".cw-stage-floor") || box).getBoundingClientRect();
    const r0 = rect();
    if (kind === "stage") {
      const hit = e.target.closest && e.target.closest("[data-tok]");
      const x = ((e.clientX - r0.left) / r0.width) * 100;
      const y = ((e.clientY - r0.top) / r0.height) * 100;
      tok = hit ? m.toks[Number(hit.dataset.tok)] : m.toks.filter((t) => t.drag).sort((a, b) => Math.hypot(a.pos[0] - x, a.pos[1] - y) - Math.hypot(b.pos[0] - x, b.pos[1] - y))[0];
      if (!tok) return false;
    }
    if (kind === "curve") {
      const x = ((e.clientX - r0.left) / r0.width) * CW;
      let best = 0;
      m.xs.forEach((j, i) => Math.abs(cx(m, j) - x) < Math.abs(cx(m, m.xs[best]) - x) && (best = i));
      curveSel[m.k] = best;
      m.sel = best;
    }
    const at = (ev) => {
      const r = rect();
      if (kind === "wheel") {
        const dx = ev.clientX - (r.left + r.width / 2);
        const dy = ev.clientY - (r.top + r.height / 2);
        const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
        list = wheelAt(m, deg, clamp01(Math.hypot(dx, dy) / (r.width / 2)));
        over = Object.fromEntries(list);
      } else if (kind === "curve") {
        const p = clamp01((CH - 6 - ((ev.clientY - r.top) / r.height) * CH) / (CH - 12));
        m.ps[m.sel] = p;
        over = { points: m.ps.slice() };
        list = [[m.k, S().at(m.k, clamp01(curveP(m, m.row)))]];
      } else {
        list = stageAt(m, tok, ((ev.clientX - r.left) / r.width) * 100, ((ev.clientY - r.top) / r.height) * 100);
        over = Object.fromEntries(list);
      }
      handRedraw(el, hd, over);
      lookLive(el, list, api);
    };
    at(e);
    const up = () => {
      window.removeEventListener("pointermove", at);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const label = hd.c.label;
      if (kind === "curve") {
        const items = curveItems(m);
        if (items.length) {
          api.showLane(m.k);
          api.setAt(items, `Curve over my film: ${m.s.id === hd.c.main ? label : m.s.label}`);
        }
        return handRefocus(hd.id, "curve");
      }
      handWrite(list, kind === "wheel" ? `${label}: color wheel` : `${label}: placed on the floor plan`, api);
      handRefocus(hd.id, kind === "wheel" ? "wheel" : `tok${tok.i}`);
    };
    window.addEventListener("pointermove", at);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return true;
  }
  /* Arrow keys on a focused wheel, curve or stage token. */
  function handKeydown(e, api) {
    const el = e.target && e.target.closest && e.target.closest("[data-cw-hand]");
    if (!el || !/^Arrow(Up|Down|Left|Right)$/.test(e.key) || !e.target.closest("[data-hand-focus]") || e.target.closest(".dis")) return false;
    const hd = handOf(el, api);
    if (!hd) return false;
    e.preventDefault();
    e.stopPropagation();
    const { m } = hd;
    const which = e.target.closest("[data-hand-focus]").dataset.handFocus;
    if (hd.f.face === "wheel") handWrite(wheelKey(m, e.key), `${hd.c.label}: color wheel`, api);
    else if (hd.f.face === "curve") {
      if (/Left|Right/.test(e.key)) {
        curveSel[m.k] = Math.max(0, Math.min(m.n - 1, m.sel + (e.key === "ArrowRight" ? 1 : -1)));
        handRedraw(el, hd, null);
      } else {
        const st = m.s.scale ? 1 / (m.s.scale.length - 1) : 1 / Math.max(1, Math.min(20, S().steps(m.k)));
        m.ps[m.sel] = clamp01(posOf(m.k, S().at(m.k, clamp01(m.ps[m.sel]))) + (e.key === "ArrowUp" ? st : -st));
        api.showLane(m.k);
        api.setAt(curveItems(m), `Curve over my film: ${m.s.id === hd.c.main ? hd.c.label : m.s.label}`);
      }
    } else {
      const tok = m.toks[Number(which.slice(3))];
      if (tok) handWrite(stageKey(m, tok, e.key), `${hd.c.label}: placed on the floor plan`, api);
    }
    handRefocus(hd.id, which);
    return true;
  }

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
          let body = draw ? draw(c, f, h) : "";
          /* A hand-made face that cannot be drawn (a setting is missing, or my film has one moment) shows its
             fallback face instead. */
          if (!body && HAND[f.face]) {
            const fb = fallbackOf(c, f);
            body = fb && FACE[fb.face] ? FACE[fb.face](c, fb, h) : "";
            if (body) f = Object.assign({}, fb, { title: f.title && fb.face === f.face ? f.title : fb.title });
          }
          if (!body) return "";
          const s = sl(c, f.slider || f.x || f.size || f.hue || (f.sliders || [])[0]);
          const title = f.title || (f.face === "mixer" ? "Mixer" : f.face === "pad" ? `${(sl(c, f.x) || {}).label} and ${(sl(c, f.y) || {}).label}` : f.face === "frame" ? "In the picture" : f.face === "wheel" ? `${(sl(c, f.hue) || {}).label} and ${String((sl(c, f.strength) || {}).label || "").toLowerCase()}` : f.face === "curve" ? `${s ? (s.id === c.main ? c.label : s.label) : ""} across my film` : f.face === "stage" ? "On the floor, from above" : s ? s.label : "");
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
     Plain words in, settings out, worked out on the device: each part of the request (split at commas, "and",
     "then") is matched against the curiosity's presets, the words on its scales, numbers with a unit (30
     degrees, 2 meters, 40%, 3 seconds), and more or less of a setting it names (closer, higher, faster, more
     X, less X). Returns [[key, value, label]] and what it understood. */
  const UNIT = [
    [/^(°|deg|degs|degree|degrees)$/, "°"],
    [/^(m|meter|meters|metre|metres)$/, "m"],
    [/^(%|percent|per cent)$/, "%"],
    [/^(s|sec|secs|second|seconds)$/, "s"],
    [/^(mm|millimeter|millimeters)$/, "mm"],
  ];
  const UP = /\b(more|higher|up|raise|bigger|larger|louder|faster|stronger|longer|further|farther|brighter|warmer|wider|above|increase)\b/;
  const DOWN = /\b(less|lower|down|smaller|quieter|softer|slower|weaker|shorter|closer|nearer|darker|cooler|tighter|below|decrease|reduce)\b/;
  /* Words that point at a kind of setting even when its label is not said. */
  const HINT = { closer: "distance", nearer: "distance", farther: "distance", further: "distance", above: "height", below: "height", higher: "height", lower: "height", faster: "speed", slower: "speed", louder: "loud", quieter: "loud", brighter: "bright", darker: "bright", longer: "long", shorter: "long" };
  const words = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9%°.\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !/^(the|and|but|with|from|into|this|that|them|their|how|its|it's|very|much|make|more|less|set|for|of|to|is|are|was|be|a|an)$/.test(w));
  function overlap(a, b) {
    const B = new Set(words(b));
    return words(a).filter((w) => B.has(w) || [...B].some((x) => x.length > 4 && w.length > 4 && (x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5))))).length;
  }
  function interpret(c, text, h) {
    const sp = spec(c) || {};
    const own = (c.sliders || []).filter((s) => !["themeLink", "pointsAhead"].includes(s.id));
    const out = new Map();
    const said = [];
    const put = (s, v, why) => {
      const k = h.sliderId(c, s);
      if (!S().known(k)) return;
      const f = S().fix(k, v);
      if (f == null) return;
      out.set(k, [k, f, s.id === c.main ? c.label : s.label]);
      said.push(why);
    };
    let t = String(text || "").toLowerCase();
    /* A preset's full name first, so a phrase inside it ("from below" in "Hero from below") does not split it. */
    const named = new Set();
    (sp.presets || [])
      .slice()
      .sort((a, b) => b.label.length - a.label.length)
      .forEach((p) => {
        const nm = p.label.toLowerCase();
        if (!t.includes(nm)) return;
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
        const re = new RegExp("(^|[^a-z])" + ph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)");
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
    const best = (clause, list) => {
      let top = null;
      let score = 0;
      list.forEach((s) => {
        const idWords = s.id.replace(/([A-Z])/g, " $1").toLowerCase();
        let n = overlap(s.id === c.main ? s.label + " " + c.label : s.label, clause) * 2 + overlap(s.plain, clause) * 0.5 + (s.id !== "setting" && s.id !== c.main ? overlap(idWords, clause) * 2 : 0);
        Object.entries(HINT).forEach(([w, part]) => new RegExp("\\b" + w + "\\b").test(clause) && (s.id.toLowerCase().includes(part) || s.label.toLowerCase().includes(part)) && (n += 3));
        if (s.id === c.main) n += 0.25;
        if (n > score) (score = n), (top = s);
      });
      return top;
    };
    t.split(/,|;|\band\b|\bthen\b|\.\s/).map((x) => x.trim()).filter(Boolean).forEach((clause) => {
      /* 1. A word or phrase on a scale (the longest match wins). */
      let hit = null;
      own.forEach((s) => (s.scale || []).forEach((o) => {
        const w = String(o).toLowerCase();
        if (w.length > 1 && new RegExp("(^|[^a-z])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)").test(clause)) {
          const sc = w.length + overlap(s.label, clause) * 3 + (s.id === c.main ? 1 : 0);
          if (!hit || sc > hit.sc) hit = { s, o, sc };
        }
      }));
      if (hit) {
        /* "not so close", "less wide", "too dark": one step from that word toward the middle of its scale. */
        const w = String(hit.o).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (hit.s.scale.length > 2 && new RegExp("\\b(not|less|too|isn't|not that)\\s+(so\\s+|too\\s+|that\\s+|very\\s+)?" + w + "([^a-z]|$)").test(clause)) {
          const i = hit.s.scale.indexOf(hit.o);
          const j = i < (hit.s.scale.length - 1) / 2 ? i + 1 : i - 1;
          return put(hit.s, hit.s.scale[j], `${hit.s.id === c.main ? c.label : hit.s.label}: ${hit.s.scale[j]} (not so ${hit.o})`);
        }
        return put(hit.s, hit.o, `${hit.s.id === c.main ? c.label : hit.s.label}: ${hit.o}`);
      }
      /* 2. A number, with a unit if one is said. */
      const m = clause.match(/(-?\d+(?:\.\d+)?)\s*(°|%|[a-z]+)?/);
      if (m) {
        let n = Number(m[1]);
        let unit = (UNIT.find(([re]) => re.test(m[2] || "")) || [])[1];
        /* "2x" or "half speed" on a setting measured in %: 2x is 200%. */
        if (/^(x|times)$/.test(m[2] || "") && own.some((s) => s.range && s.range.unit === "%" && !SHARED.includes(s.id))) (n *= 100), (unit = "%");
        if (/\b(left|below|under|down)\b/.test(clause) && n > 0 && unit === "°") n = -n;
        const all = own.filter((s) => s.range && (!unit || (s.range.unit || "") === unit));
        /* The shared settings (amount, push) only when they are named. */
        const nums = all.filter((s) => !SHARED.includes(s.id) || overlap(s.label, clause) > 0);
        const s = best(clause, nums) || (nums.length ? nums.find((x) => x.id === c.main) || nums[0] : null);
        if (s) return put(s, n, `${s.id === c.main ? c.label : s.label}: ${n}${s.range.unit || ""}`);
      }
      /* 3. More or less of something. */
      const up = UP.test(clause);
      const down = DOWN.test(clause);
      if (up !== down) {
        const ord = own.filter((s) => (s.range || (s.scale && !s.unordered)) && !SHARED.includes(s.id));
        /* A bare "more" or "less" means more of it: its strength, if it has one, rather than the next word on a list. */
        const bare = !words(clause.replace(UP, " ").replace(DOWN, " ").replace(/\b(a|bit|lot|little|much|way|very|far|please|it)\b/g, " ")).length;
        const strong = bare ? ord.find((x) => /intens|strength|arous|wound up|energy|level|how much|how strong/.test((x.id + " " + x.label).toLowerCase())) : null;
        const s = strong || best(clause, ord);
        if (!s) return;
        const k = h.sliderId(c, s);
        const cur = h.ctx.value(k);
        const p = posOf(k, cur);
        const lot = /\b(lot|much|way|very|far)\b/.test(clause) ? 2 : 1;
        let v;
        if (s.scale) v = S().at(k, Math.max(0, Math.min(1, (p == null ? 0.5 : p) + ((up ? 1 : -1) * lot) / Math.max(1, s.scale.length - 1))));
        else {
          /* Numbers move by a sensible amount from where they are: 15° a step, otherwise a quarter of the value. */
          const r = s.range;
          const n = Number(cur);
          const d = r.unit === "°" ? 15 * lot : isFinite(n) && n !== 0 && cur != null ? Math.abs(n) * 0.25 * lot : (r.max - r.min) * 0.1 * lot;
          const base = isFinite(n) && cur != null ? n : S().at(k, 0.5);
          v = S().fix(k, Math.max(r.min, Math.min(r.max, base + (up ? d : -d))));
        }
        put(s, v, `${s.id === c.main ? c.label : s.label}: ${up ? "up" : "down"} to ${v}${s.range ? s.range.unit || "" : ""}`);
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
  const bigLook = new Set();
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
    /* Bigger (sweep 2026-10-03: at phone width the picture's small words were 7 to 8 px): twice as wide, panned
       sideways, and no longer pinned, so it does not cover the controls. Remembered per window. */
    const big = bigLook.has(c.id);
    return `<div class="sc-wpart cw-look${big ? " cw-look-big" : ""}"><div class="cw-look-pic" data-cw-look="${h.esc(c.id)}">${pic}</div><p class="sc-k">At this moment. Move anything below and watch it change${big ? "" : "; the picture stays in view"}. <button type="button" class="cw-look-zoom" data-cw-look-big="${h.esc(c.id)}" aria-pressed="${big}" title="${big ? "Back to the picture that stays in view" : "See the picture twice as big, to read its small words"}">${big ? "Smaller" : "⤢ Bigger"}</button></p></div>`;
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
    const hand = e.target.closest && e.target.closest("[data-cw-hand]");
    if (hand) return handPointer(e, hand, api);
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
      /* Kept inside the pad by its own radius, so a setting at its end is a whole dot, not half of one. */
      d.style.setProperty("--x", last[0]);
      d.style.setProperty("--y", 1 - last[1]);
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
    if (handKeydown(e, api)) return true;
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
  /* A setting a switched-on link drives ignores a node set by hand where the link fires, so a control
     moved there seemed to do nothing (sweep 2026-10-03: cutRate, shotSize, angleCount, gesture). Say so on the
     setting, with the link's own words and an Unlink button; redone after every redraw of the windows. */
  function linkOf(key) {
    const E = window.CurioEngine;
    const Sc = window.CurioScreen;
    if (!E || !Sc || !Sc.row) return null;
    const st = E.state();
    const r = st.rows[Sc.row()];
    const t = r && st.tracks.find((x) => x.curiosities.includes(key));
    const why = t ? E.why(r.id, t.id, key) : null;
    /* The link that set this moment, else any switched-on link that drives this setting (it overrules a node set
       here as soon as one is: the engine says "source" until then). */
    const l = (why && /^link:/.test(why) && (st.links || []).find((x) => "link:" + x.id === why)) || (st.links || []).find((x) => x.on && x.to && x.to.curiosity === key && (!t || !x.to.track || x.to.track === t.id));
    return l ? { id: l.id, label: l.label || "another setting" } : null;
  }
  function markLinks(layer) {
    if (!layer) return;
    const memo = {};
    layer.querySelectorAll(".sc-win").forEach((win) => {
      if (win.classList.contains("dis")) return;
      win.querySelectorAll("[data-set], [data-step-set], [data-knob]").forEach((el) => {
        if (el.closest(".cw-look")) return;
        const key = el.dataset.set || el.dataset.stepSet || el.dataset.knob;
        if (!(key in memo)) memo[key] = linkOf(key);
        const l = memo[key];
        if (!l) return;
        const tip = `Set by a link: ${l.label}. Where the link fires it overrules a value set here; Unlink switches it off.`;
        if (!el.classList.contains("cw-linked")) {
          el.classList.add("cw-linked");
          el.title = tip;
        }
        const box = el.closest(".sc-wctl, .cw-face") || el.parentElement;
        if (!box || [...box.children].some((x) => x.classList.contains("cw-link-note") && x.dataset.cwLinkKey === key)) return;
        const p = document.createElement("p");
        p.className = "cw-link-note";
        p.dataset.cwLinkKey = key;
        p.setAttribute("role", "note");
        const b = document.createElement("b");
        b.textContent = "Set by a link: ";
        const s = document.createElement("span");
        s.textContent = l.label;
        const u = document.createElement("button");
        u.type = "button";
        u.dataset.cwUnlink = l.id;
        u.title = "Switch this link off, so your own setting here counts (one undo step)";
        u.textContent = "Unlink";
        p.append(b, s, " · ", u);
        box.appendChild(p);
      });
    });
  }
  function watchLinks() {
    if (watchLinks.on) return;
    const layer = document.querySelector(".sc-wins-layer");
    if (!layer) return;
    watchLinks.on = true;
    let queued = false;
    const run = () => {
      queued = false;
      obs.disconnect();
      try {
        markLinks(layer);
      } catch (e) {
        console.warn("link notes:", e);
      }
      obs.observe(layer, { childList: true });
    };
    const obs = new MutationObserver(() => queued || ((queued = true), Promise.resolve().then(run)));
    run();
    layer.addEventListener("click", (e) => {
      const z = e.target.closest && e.target.closest("[data-cw-look-big]");
      if (z) {
        const id = z.dataset.cwLookBig;
        const part = z.closest(".cw-look");
        const big = !bigLook.has(id);
        big ? bigLook.add(id) : bigLook.delete(id);
        if (part) {
          part.classList.toggle("cw-look-big", big);
          z.setAttribute("aria-pressed", String(big));
          z.textContent = big ? "Smaller" : "⤢ Bigger";
          z.title = big ? "Back to the picture that stays in view" : "See the picture twice as big, to read its small words";
          const say = z.parentNode && z.parentNode.firstChild;
          if (say && say.nodeType === 3) say.textContent = `At this moment. Move anything below and watch it change${big ? "" : "; the picture stays in view"}. `;
        }
        return e.stopPropagation();
      }
      const b = e.target.closest && e.target.closest("[data-cw-unlink]");
      if (!b || !window.CurioEngine) return;
      e.stopPropagation();
      const r = window.CurioEngine.send({ type: "toggleLink", link: b.dataset.cwUnlink, on: false });
      if (r && !r.ok && midi.api) midi.api.toast(r.error);
      else if (midi.api) midi.api.toast("Link switched off: your own setting counts here now. Undo turns it back on.");
    });
  }
  function attach(api) {
    midi.api = api;
    /* The windows layer is made on the first window; watch for it. */
    const tryWatch = () => watchLinks() || watchLinks.on || setTimeout(tryWatch, 300);
    tryWatch();
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

  window.CurioWindowFaces = { FACES: Object.keys(FACE), SHAPES: SHAPES.map((s) => s[0]), html, sayHtml, lookHtml, input, live: lookLive, interpret, grouped, click, pointer, shapeItems, spec, keydown, hand: { wheelAt: (m, deg, r) => wheelAt(m, deg, r), curveItems: (m) => curveItems(m), stageAt: (m, tok, x, y) => stageAt(m, tok, x, y), fallbackOf }, midiBtn, attach, midi: { bindings: () => Object.assign({}, midi.map), feed: onMidi } };
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
.cw-dot { --x: 0.5; --y: 0.5; --r: 9px; left: calc(var(--r) + (100% - 2 * var(--r)) * var(--x)); top: calc(var(--r) + (100% - 2 * var(--r)) * var(--y)); position: absolute; width: 14px; height: 14px; border-radius: 50%; transform: translate(-50%, -50%); background: #fff; box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.4); pointer-events: none; z-index: 2; }
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
.cw-link-note { margin: 2px 0 0; font-size: 11px; line-height: 1.35; color: var(--cc-warm, #f5b041); }
.cw-link-note b { font-weight: 700; }
.sc-page .cw-link-note button[data-cw-unlink] { padding: 0 6px; font-size: 11px; margin-left: 2px; }
.sc-win .cw-linked { opacity: 0.6; }
.sc-page .cw-look-zoom { padding: 0 6px; font-size: 11px; margin-left: 2px; }
.sc-page .sc-win .cw-look.cw-look-big { position: static; }
.cw-look-big .cw-look-pic { overflow-x: auto; overscroll-behavior-x: contain; }
.cw-look-big .cw-look-pic svg { width: 200%; max-width: none; }
/* On a phone the window takes the whole width, so the picture is as big as it can be. */
@media (max-width: 480px) { .sc-page .sc-win { left: 6px !important; width: calc(100vw - 12px); } }
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
.sc-page .sc-win .sc-wctl .sc-ctl { grid-template-columns: 1fr; }
.sc-page .sc-win .sc-chips { display: flex; flex-wrap: wrap; gap: 3px; }
.sc-page .sc-win .sc-chips button { padding: 3px 7px; font-size: 10px; border-radius: 10px; }
.sc-page .sc-win .sc-chips button.on { background: var(--cc-accent); color: var(--cc-accent-ink); }
.cw-shape-row label { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--cc-dim); }
.cw-hand-read { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 10px; color: var(--cc-dim); align-items: center; }
.cw-hand-read b { color: var(--cc-text); }
.cw-wheel-ring { position: relative; width: 200px; height: 200px; justify-self: center; touch-action: none; }
.cw-wheel-l { position: absolute; transform: translate(-50%, -50%); font-size: 9px; color: var(--cc-dim); white-space: nowrap; pointer-events: none; }
.cw-wheel-disc { position: absolute; inset: 22px; border-radius: 50%; cursor: crosshair; touch-action: none; background: radial-gradient(circle closest-side, #8a8a90 0%, rgba(138, 138, 144, 0.6) 22%, rgba(138, 138, 144, 0) 100%), conic-gradient(from 0deg, hsl(0 85% 55%), hsl(60 85% 55%), hsl(120 85% 45%), hsl(180 85% 45%), hsl(240 85% 60%), hsl(300 85% 55%), hsl(360 85% 55%)); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18); }
.cw-wheel-disc:focus-visible, .cw-curve-box:focus-visible, .cw-tok:focus-visible { outline: 2px solid var(--cc-accent); outline-offset: 2px; }
.cw-wheel-disc.dis, .cw-curve-box.dis, .cw-stage-floor.dis { cursor: default; opacity: 0.7; }
.cw-wheel-mid { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 8px; font-style: normal; color: #1b1b1f; pointer-events: none; }
.cw-wheel-disc .cw-dot { box-shadow: 0 0 0 2px #111, 0 0 0 5px rgba(255, 255, 255, 0.55); }
.cw-curve-box { position: relative; height: 120px; border: 1px solid var(--cc-line); border-radius: 8px; background: #121214; cursor: ns-resize; touch-action: none; }
.cw-curve-box svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.cw-curve-grid { stroke: #2a2a2f; stroke-width: 0.5; vector-effect: non-scaling-stroke; }
.cw-curve-now { stroke: var(--cc-warm, #ffb000); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.cw-curve-line { fill: none; stroke: var(--cc-accent); stroke-width: 2; vector-effect: non-scaling-stroke; }
.cw-curve-lane { fill: #6b6b73; }
.cw-curve-pt { fill: #fff; stroke: var(--cc-accent); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.cw-curve-pt.sel { fill: var(--cc-accent); stroke: #fff; }
.cw-curve-hi, .cw-curve-lo { position: absolute; right: 5px; font-size: 9px; color: var(--cc-dim); pointer-events: none; z-index: 1; }
.cw-curve-hi { top: 3px; }
.cw-curve-lo { bottom: 3px; }
.cw-stage-floor { position: relative; width: 100%; max-width: 260px; aspect-ratio: 1 / 1; justify-self: center; border: 1px solid var(--cc-line); border-radius: 8px; overflow: hidden; cursor: grab; touch-action: none; }
.cw-stage-floor svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.cw-stage-bg { fill: #141417; }
.cw-stage-grid { stroke: #26262b; stroke-width: 0.4; fill: none; }
.cw-stage-t { fill: #7a7a82; font-size: 3.6px; }
.cw-stage-link { stroke: #55555c; stroke-width: 0.5; stroke-dasharray: 1.5 1.5; }
.cw-stage-walk { fill: none; stroke: #7a7a82; stroke-width: 0.8; stroke-linecap: round; stroke-linejoin: round; }
.cw-stage-person ellipse { fill: #3a3a42; }
.cw-stage-person circle { fill: #d6d6dc; }
.cw-stage-person path { stroke: #d6d6dc; stroke-width: 1.2; stroke-linecap: round; }
.cw-stage-person text { font-size: 3.6px; fill: #1b1b1f; font-weight: 700; }
.cw-stage-cam rect, .cw-stage-cam > path:not(.cw-stage-cone) { fill: var(--cc-accent); }
.cw-stage-cone { fill: none; stroke: var(--cc-accent); stroke-width: 0.4; stroke-dasharray: 1.5 1.5; opacity: 0.8; }
.cw-tok { position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; border: 1px dashed rgba(255, 255, 255, 0.35); cursor: grab; touch-action: none; }
.cw-tok.cam { border-color: var(--cc-accent); }
.cw-shape-row svg { width: 22px; height: 14px; fill: none; stroke: var(--cc-accent); stroke-width: 1.6; stroke-linejoin: round; }
`;
  }
})();
