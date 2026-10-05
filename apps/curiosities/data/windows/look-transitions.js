/* Transitions: the live picture at the top of each transition curiosity's window (CuriosityWindows.look). */
(function (W) {
  /* ---------- small shared drawing pieces ---------- */
  const R = (n, d) => {
    const m = Math.pow(10, d == null ? 1 : d);
    return Math.round(n * m) / m;
  };
  const sm = (k, x, y, t, o) => k.label(Object.assign({ x, y, text: t, size: 8, color: "#bbb", anchor: "start" }, o || {}));
  const ln = (x1, y1, x2, y2, c, w, dash) => `<line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" stroke="${c || "#888"}" stroke-width="${w || 1}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  const box = (x, y, w, h, fill, stroke, rx, op) => `<rect x="${R(x)}" y="${R(y)}" width="${R(Math.max(0.5, w))}" height="${R(Math.max(0.5, h))}" rx="${rx || 0}" fill="${fill || "none"}"${stroke ? ` stroke="${stroke}"` : ""}${op != null ? ` opacity="${R(op, 2)}"` : ""}/>`;
  const poly = (pts, c, w, fill, dash) => `<polyline points="${pts.map((p) => R(p[0]) + "," + R(p[1])).join(" ")}" fill="${fill || "none"}" stroke="${c || "#ffd166"}" stroke-width="${w || 2}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  function chip(k, x, y, t, fill) {
    const w = Math.max(18, String(t).length * 4.3 + 10);
    return `<rect x="${R(x)}" y="${R(y - 9)}" width="${R(w)}" height="12" rx="6" fill="${fill || "#2c2c34"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x + w / 2, y, text: t, size: 7.5, color: "#eee" });
  }
  /* A full 320x180 drawing shrunk into a box at (x, y), w wide, clipped and framed. */
  function shot(k, id, x, y, w, inner, stroke) {
    const s = w / 320;
    return `<g transform="translate(${R(x)} ${R(y)}) scale(${R(s, 4)})"><clipPath id="${id}"><rect x="0" y="0" width="320" height="180"/></clipPath><g clip-path="url(#${id})">${inner}</g><rect x="0" y="0" width="320" height="180" fill="none" stroke="${stroke || "#888"}" stroke-width="${R(1.5 / s)}"/></g>`;
  }
  /* A film frame w by h at (x, y) holding a 320x180 drawing; a frame wider than 16:9 shows the middle band. */
  const cell = (id, x, y, w, h, inner, stroke) => {
    const s = Math.max(h / 180, w / 320);
    const ty = Math.min(y, Math.max(y + h - 180 * s, y + h / 2 - 110 * s));
    return `<clipPath id="${id}"><rect x="${R(x)}" y="${R(y)}" width="${R(Math.max(0.5, w))}" height="${R(h)}"/></clipPath><g clip-path="url(#${id})"><g transform="translate(${R(x + w / 2 - 160 * s)} ${R(ty)}) scale(${R(s, 3)})">${inner}</g></g>` + box(x, y, w, h, "none", stroke || "#0b0b0d");
  };
  /* The dark band and sprocket holes behind a strip of film frames. */
  const sprockets = (x, y, w, h) => {
    let o = box(x - 2, y - 6, w + 4, h + 12, "#0b0b0d");
    for (let hx = x + 2; hx < x + w - 2; hx += 7) o += box(hx, y - 4, 3, 2.5, "#4a4a52") + box(hx, y + h + 1.5, 3, 2.5, "#4a4a52");
    return o;
  };
  /* A plain backdrop with a floor, for people inside a frame. */
  const set = (k, c) => box(0, 0, 320, 180, c) + box(0, 128, 320, 52, k.mix(c, "#000000", 0.45));
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  const SKY = "#141418";
  /* The two scenes a transition joins: A, a blue night with a moon; B, an orange day with a hill. */
  const sceneA = (k) => box(0, 0, 320, 180, "#25344f") + `<circle cx="230" cy="55" r="26" fill="#f4f1ea"/>` + box(0, 130, 320, 50, "#1b2335") + k.person({ x: 110, y: 160, s: 1.2, color: "#4a6fa5" });
  const sceneB = (k) => box(0, 0, 320, 180, "#f2b880") + `<path d="M0 140 Q120 60 240 130 T320 120 V180 H0 Z" fill="#c8673a"/>` + k.person({ x: 200, y: 165, s: 1.1, color: "#a5574a", mood: 0.5 });
  /* An easing curve 0..1 by name index: steady, eases in, eases out, both. */
  const ease = (i, t) => (i === 1 ? t * t : i === 2 ? 1 - (1 - t) * (1 - t) : i === 3 ? t * t * (3 - 2 * t) : t);

  /* Match cut: the last frame of A and the first of B, with the thing that matches across the cut. */
  W.look("matchCut", (v, k) => {
    const kind = v("setting");
    /* Kept far enough inside each frame that the matching thing is always whole. */
    const mx = 64 + (v.n("matchX") / 100) * 192;
    const my = 145 - (v.n("matchY") / 100) * 110;
    const line = v.n("lineUp") / 100;
    const close = idx(v, "closeness");
    const miss = (1 - line) * 70 * (1 - close * 0.3) + (kind === "none" ? 60 : 0);
    const bx = mx + miss <= 256 ? mx + miss : mx - miss;
    const by = k.clamp(my + miss * 0.4, 30, 150);
    const mark = (x, y, col, sz) => {
      if (kind === "movement") return k.arrow({ x1: x - 40, y1: y + 20, x2: x + 30, y2: y - 20, w: 8, color: col });
      if (kind === "sound") return k.speaker({ x, y, s: 2.2, level: 1, color: col });
      if (kind === "color") return box(x - 40, y - 30, 80, 60, "#d63a7a", null, 8);
      if (kind === "word") return k.bubble({ x, y, w: 120, h: 40, text: "HOME", size: 18 });
      if (kind === "none") return box(x - 25, y - 25, 50, 50, col, "#1c1712", 4);
      return `<circle cx="${R(x)}" cy="${R(y)}" r="${sz || 34}" fill="${col}" stroke="#1c1712" stroke-width="3"/>`;
    };
    const ob = idx(v, "obvious");
    const glowB = ob === 0 ? "" : ob === 1 ? `<circle cx="${R(bx)}" cy="${R(by)}" r="56" fill="#fff" opacity="0.18"/>` : [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ln(bx + Math.cos(i * 0.785) * 44, by + Math.sin(i * 0.785) * 44, bx + Math.cos(i * 0.785) * 80, by + Math.sin(i * 0.785) * 80, "#fff", 5)).join("");
    const A = box(0, 0, 320, 180, "#25344f") + box(0, 130, 320, 50, "#1b2335") + mark(mx, my, "#f4f1ea");
    const B = box(0, 0, 320, 180, "#f2b880") + box(0, 140, 320, 40, "#c8673a") + glowB + (close === 2 ? (kind === "word" ? box(mx - 60, my - 20, 120, 40, "none", "#ffffff", 12, 0.5) : `<g opacity="0.35">${mark(mx, my, "#ffffff")}</g>`) : "") + mark(bx, by, "#e8e0d0", close === 0 ? 24 : 34);
    const leap = idx(v, "leap");
    const fq = v.n("frequency");
    return (
      k.bg(SKY) +
      sm(k, 8, 14, "Last frame of A") +
      sm(k, 166, 14, "First frame of B") +
      shot(k, "cw-mc-a", 8, 20, 146, A) +
      shot(k, "cw-mc-b", 166, 20, 146, B, ob === 2 ? "#ffd166" : "#888") +
      ln(160, 20, 160, 102, "#ff6b6b", 2, "4 3") +
      sm(k, 8, 118, `Leap: ${v("leap")}`, { color: "#ddd" }) +
      [0, 1, 2, 3].map((i) => k.label({ x: 120 + i * 12, y: 118, text: "›", size: 12, color: i <= leap ? "#ffd166" : "#444" })).join("") +
      sm(k, 180, 118, `Shapes line up ${v("lineUp")}%`, { color: "#ddd" }) +
      sm(k, 8, 134, `${v("closeness")} · ${v("obvious")} · says: ${v("meaning")}`, { size: 7.5 }) +
      sm(k, 8, 152, `${fq} per film`, { size: 7.5 }) +
      Array.from({ length: 12 }, (_, i) => k.dot({ x: 70 + i * 12, y: 149, r: 3.5, color: i < fq ? "#ffd166" : "#3a3a44" })).join("") +
      k.caption(kind === "none" ? "No match: just a cut" : `A ${kind} match across the cut`)
    );
  });

  /* The middle of a transition from A to B, drawn for each style at its halfway point. */
  function midFrame(k, style, dirDeg, seam) {
    const A = sceneA(k);
    const B = sceneB(k);
    const dx = Math.cos(k.rad(dirDeg));
    const dy = Math.sin(k.rad(dirDeg));
    const half = `<clipPath id="cw-tk-half"><path d="M160 90 m${R(-dy * 400)} ${R(dx * 400)} l${R(dy * 800)} ${R(-dx * 800)} l${R(dx * 400)} ${R(dy * 400)} l${R(-dy * 800)} ${R(dx * 800)} Z"/></clipPath>`;
    const seamLine = seam > 0 ? `<line x1="${R(160 - dy * 200)}" y1="${R(90 + dx * 200)}" x2="${R(160 + dy * 200)}" y2="${R(90 - dx * 200)}" stroke="#ffd166" stroke-width="${R(seam * 6, 1)}"/>` : "";
    switch (style) {
      case "fade to black":
        return A + box(0, 0, 320, 180, "#000", null, 0, 0.85);
      case "fade to white":
        return A + box(0, 0, 320, 180, "#fff", null, 0, 0.85);
      case "cross dissolve":
      case "morph":
        return A + `<g opacity="0.5">${B}</g>` + (style === "morph" ? `<circle cx="200" cy="90" r="40" fill="#e8b0a0" opacity="0.6"/>` : "");
      case "wipe":
      case "slice reveal":
        return A + half + `<g clip-path="url(#cw-tk-half)">${B}</g>` + (style === "slice reveal" ? [0, 1, 2].map((i) => ln(0, 40 + i * 50, 320, 20 + i * 50, "#fff", 4)).join("") : "") + seamLine;
      case "push":
      case "phone swipe":
        return `<g transform="translate(${R(-dx * 160)} ${R(-dy * 90)})">${A}</g><g transform="translate(${R(dx * 160)} ${R(dy * 90)})">${style === "phone swipe" ? `<rect x="0" y="0" width="320" height="180" rx="30" fill="#000"/>` : ""}${B}</g>` + seamLine;
      case "zoom":
      case "flash zoom":
        return `<g transform="translate(160 90) scale(2) translate(-160 -90)">${A}</g><g transform="translate(160 90) scale(0.5) translate(-160 -90)">${B}</g>` + (style === "flash zoom" ? box(0, 0, 320, 180, "#fff", null, 0, 0.5) : "");
      case "spin":
        return `<g transform="rotate(${R(dirDeg > 90 && dirDeg < 270 ? -45 : 45)} 160 90)">${A}</g>`;
      case "whip pan":
      case "smear":
        return `<g opacity="0.6">${A}</g>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${R(160 - dx * 200)}" y1="${R(i * 24 + 6 - dy * 100)}" x2="${R(160 + dx * 200)}" y2="${R(i * 24 + 6 + dy * 100)}" stroke="${i % 2 ? "#f2b880" : "#25344f"}" stroke-width="${style === "smear" ? 18 : 10}" opacity="0.8"/>`).join("");
      case "flash":
        return A + box(0, 0, 320, 180, "#fff", null, 0, 0.92);
      case "glitch":
        return A + [0, 1, 2, 3, 4].map((i) => `<g transform="translate(${(i % 2 ? 1 : -1) * (10 + i * 6)} 0)"><clipPath id="cw-tk-g${i}"><rect x="0" y="${i * 36}" width="320" height="${14 + (i % 3) * 6}"/></clipPath><g clip-path="url(#cw-tk-g${i})">${i % 2 ? B : A}</g></g>`).join("") + box(0, 70, 320, 6, "#0ff", null, 0, 0.5);
      case "slam merge":
        return `<clipPath id="cw-tk-l"><rect x="0" y="0" width="160" height="180"/></clipPath><clipPath id="cw-tk-r"><rect x="160" y="0" width="160" height="180"/></clipPath><g clip-path="url(#cw-tk-l)">${A}</g><g clip-path="url(#cw-tk-r)">${B}</g>` + [0, 1, 2, 3].map((i) => ln(160, 90, 160 + Math.cos(i * 1.57 + 0.78) * 60, 90 + Math.sin(i * 1.57 + 0.78) * 60, "#fff", 4)).join("") + seamLine;
      case "brush cuts":
        return A + `<clipPath id="cw-tk-brush"><path d="M-20 60 Q80 20 160 70 T340 50 L340 130 Q240 160 160 120 T-20 140 Z"/></clipPath><g clip-path="url(#cw-tk-brush)">${B}</g>`;
      default:
        return A + half + `<g clip-path="url(#cw-tk-half)">${B}</g>` + seamLine;
    }
  }

  /* Transition style: A, the middle of the transition, then B; with its timing against the music and the sound. */
  W.look("transitionKind", (v, k) => {
    const style = v("setting");
    const dirBase = { left: 180, right: 0, up: 270, down: 90, in: 0, out: 180 }[v("direction")] || 0;
    const dirDeg = (dirBase + v.n("exactDirection") - 90 + 360) % 360;
    const seam = [1, 0.4, 0][idx(v, "hideSeam")];
    const dur = v.n("duration");
    const grab = v.n("grab") / 100;
    const cut = style === "cut";
    const mid = cut ? (() => {
      const half = `<clipPath id="cw-tk-cut"><rect x="160" y="0" width="160" height="180"/></clipPath>`;
      return sceneA(k) + half + `<g clip-path="url(#cw-tk-cut)">${sceneB(k)}</g>` + (seam > 0 ? ln(160, 0, 160, 180, "#ffd166", seam * 6) : "");
    })() : midFrame(k, style, dirDeg, seam);
    /* Timeline: clip A, clip B overlapping by the length; beats above; sound below. */
    const tl = 80;
    const cutX = 160;
    const pxs = 34;
    const half = (dur * pxs) / 2;
    const beatOff = [0.45, 0.15, 0][idx(v, "onBeat")] * 40 + (v.n("beatOffset") / 12) * 12;
    const beats = [];
    for (let i = -4; i <= 4; i++) beats.push(ln(cutX + beatOff + i * 40, tl - 6, cutX + beatOff + i * 40, tl, "#9fd3ff", 2));
    const so = idx(v, "soundOverlap");
    const sOff = v.n("soundOffset") * 30 + (so === 1 ? -20 : so === 2 ? 20 : 0);
    const e = idx(v, "ease");
    const ec = [];
    for (let i = 0; i <= 20; i++) ec.push([220 + (i / 20) * 86, 150 - ease(e, i / 20) * 26]);
    const fade = so === 3;
    return (
      k.bg(SKY) +
      shot(k, "cw-tk-a", 6, 8, 96, sceneA(k)) +
      shot(k, "cw-tk-m", 112, 8, 96, mid, "#ffd166") +
      shot(k, "cw-tk-b", 218, 8, 96, sceneB(k)) +
      sm(k, 6, 70, "A", { size: 8 }) +
      sm(k, 112, 70, cut ? "the cut" : "halfway", { size: 8, color: "#ffd166" }) +
      sm(k, 218, 70, "B", { size: 8 }) +
      (grab > 0 ? [0, 1, 2, 3, 4, 5].slice(0, 1 + Math.round(grab * 5)).map((i) => k.text({ x: 122 + i * 15, y: 24, text: "!", size: 10 + grab * 12, color: "#ffd166", weight: 700, outline: "#000" })).join("") : "") +
      k.arrow({ x1: 160 - Math.cos(k.rad(dirDeg)) * 14, y1: 62 - Math.sin(k.rad(dirDeg)) * 6, x2: 160 + Math.cos(k.rad(dirDeg)) * 14, y2: 62 + Math.sin(k.rad(dirDeg)) * 6, w: 2, color: "#fff" }) +
      beats.join("") +
      box(10, tl + 2, cutX + half - 10, 12, "#4a6fa5", "#1c1712", 2) +
      box(cutX - half, tl + 16, 310 - (cutX - half), 12, "#c8673a", "#1c1712", 2) +
      (dur > 0 ? box(cutX - half, tl + 2, half * 2, 26, "#ffd166", null, 2, 0.25) : "") +
      ln(cutX, tl - 8, cutX, tl + 30, "#ff6b6b", 1.5, "2 2") +
      sm(k, 10, tl + 42, "sound", { size: 7 }) +
      poly(fade ? [[40, tl + 46], [cutX - 20, tl + 46], [cutX + 20, tl + 56]] : [[40, tl + 46], [cutX + sOff, tl + 46]], "#4a6fa5", 4) +
      poly(fade ? [[cutX - 20, tl + 56], [cutX + 20, tl + 46], [210, tl + 46]] : [[cutX + sOff, tl + 52], [210, tl + 52]], "#c8673a", 4) +
      sm(k, 10, tl + 70, `${dur} s · beat ${v("beatOffset")} fr · sound ${v("soundOffset")} s`, { size: 7.5, color: "#ddd" }) +
      box(216, 118, 94, 36, "#1d1d22", "#3a3a44", 3) +
      poly(ec, "#ffd166", 1.5) +
      sm(k, 220, 114, v("ease"), { size: 7 }) +
      k.caption(`${style}, going ${v("direction")} (${v("exactDirection")}°), ${v("hideSeam")}`)
    );
  });

  /* Fade in and out: the picture's brightness over a clip and the plain color it fades to, with the sound line. */
  W.look("fadeEdge", (v, k) => {
    const mode = idx(v, "setting");
    const col = { black: "#000000", white: "#ffffff", "a color": "#6a2d7a" }[v("color")];
    const len = v.n("length");
    const hold = v.n("holdColor");
    const depth = v.n("fadeDepth") / 100;
    const cv = { even: 0, "slow start": 1, "slow end": 2, "slow both ends": 3 }[v("curve")] || 0;
    const px = 18;
    const x0 = 10;
    const x1 = 310;
    const inOn = mode === 1 || mode === 3 || mode === 0;
    const outOn = mode === 2 || mode === 3 || mode === 0;
    const pts = [];
    const lo = 1 - depth;
    const top = 72;
    const hgt = 32;
    const y = (b) => top + hgt - b * hgt;
    const hx = hold * px * 0.5;
    pts.push([x0, y(inOn ? lo : 1)]);
    if (inOn) {
      pts.push([x0 + hx, y(lo)]);
      for (let i = 0; i <= 10; i++) pts.push([x0 + hx + (i / 10) * len * px, y(lo + (1 - lo) * ease(cv, i / 10))]);
    }
    if (outOn) {
      for (let i = 0; i <= 10; i++) pts.push([x1 - hx - len * px + (i / 10) * len * px, y(1 - (1 - lo) * ease(cv, i / 10))]);
      pts.push([x1 - hx, y(lo)]);
    }
    pts.push([x1, y(outOn ? lo : 1)]);
    const ghost = mode === 0;
    const sf = v("soundFade");
    const lead = v.n("soundLead") * 14;
    const sx = sf === "sound fades first" ? -20 : sf === "sound fades last" ? 20 : 0;
    const spts = sf === "sound stays" ? [[x0, 122], [x1, 122]] : [[x0, 136], [x0 + hx + len * px + sx + lead, 122], [x1 - hx - len * px - sx + lead, 122], [x1, 136]];
    const fin = idx(v, "finality");
    /* The film: ten frames through the clip, each as dark (or light, or colored) as the fade makes it there.
       With no fade the frames show it faintly: what a fade would do. */
    const NF = 10;
    const fw = (x1 - x0) / NF;
    let strip = sprockets(x0, 22, x1 - x0, 40);
    for (let f = 0; f < NF; f++) {
      const cx = x0 + (f + 0.5) * fw;
      let near = pts[0];
      pts.forEach((p) => {
        if (Math.abs(p[0] - cx) < Math.abs(near[0] - cx)) near = p;
      });
      const b = k.clamp((top + hgt - near[1]) / hgt, 0, 1);
      strip += cell(`cw-fe-f${f}`, x0 + f * fw + 1, 22, fw - 2, 40, box(0, 0, 320, 180, "#25344f") + `<circle cx="196" cy="48" r="20" fill="#f4f1ea"/>` + box(0, 130, 320, 50, "#1b2335") + k.person({ x: 145, y: 168, s: 1.4, color: "#4a6fa5" }) + box(0, 0, 320, 180, col, null, 0, (1 - b) * (ghost ? 0.3 : 1)));
    }
    return (
      k.bg(SKY) +
      sm(k, 10, 13, "The clip, start to end (line: its brightness)", { size: 8 }) +
      box(x0, top, x1 - x0, hgt, "#25344f", null, 2, 0.5) +
      (inOn ? box(x0, top, hx + 0.5, hgt, col, "#555") : "") +
      (outOn ? box(x1 - hx, top, hx + 0.5, hgt, col, "#555") : "") +
      poly(pts, ghost ? "#666" : "#ffd166", 1.5, null, ghost ? "4 4" : null) +
      strip +
      sm(k, 10, 116, `Sound: ${sf} (${v("soundLead")} s)`, { size: 7.5 }) +
      poly(spts, "#9fd3ff", 2) +
      sm(k, 10, 160 - 2, `${len} s fade · ${hold} s on ${v("color")} · ${v("fadeDepth")}% deep · ${v("curve")}`, { size: 7.5, color: "#ddd" }) +
      sm(k, 10, 147, `Feels like ${v("finality")}`, { size: 7.5 }) +
      [0, 1, 2].map((i) => box(110 + i * 9, 140, 6, 8, i <= fin ? "#ddd" : "#3a3a44", null, 1)).join("") +
      k.caption(ghost ? "No fade (dashed: what a fade would do)" : `${v("setting")} through ${v("color")}`)
    );
  });

  /* Transition family: the twelve families, the chosen one lit, with a preview of its flash and blur and its rhythm over a minute. */
  W.look("transitionFamily", (v, k) => {
    const fams = ["basic", "slide", "movement", "blur", "light", "overlay", "mask", "3D", "glitch", "whimsical", "classic", "pixel bead"];
    const sel = Math.max(0, fams.indexOf(v("setting")));
    const en = idx(v, "energy");
    const icons = (i, x, y, c) => {
      switch (i) {
        case 0: return ln(x, y - 8, x, y + 8, c, 3);
        case 1: return k.arrow({ x1: x - 9, y1: y, x2: x + 9, y2: y, w: 2.5, color: c });
        case 2: return `<path d="M${x - 8} ${y} A8 8 0 1 1 ${x} ${y + 8}" fill="none" stroke="${c}" stroke-width="2.5"/>`;
        case 3: return [0, 1, 2].map((j) => ln(x - 9, y - 5 + j * 5, x + 9, y - 5 + j * 5, c, 2)).join("");
        case 4: return k.dot({ x, y, r: 5, color: c }) + [0, 1, 2, 3, 4, 5].map((j) => ln(x + Math.cos(j) * 7, y + Math.sin(j) * 7, x + Math.cos(j) * 10, y + Math.sin(j) * 10, c, 1.5)).join("");
        case 5: return box(x - 9, y - 7, 11, 11, "none", c) + box(x - 2, y - 3, 11, 11, "none", c);
        case 6: return `<path d="M${x} ${y - 8} A8 8 0 0 1 ${x} ${y + 8} Z" fill="${c}"/>` + k.ring({ x, y, r: 8, color: c, w: 1.5 });
        case 7: return `<path d="M${x - 8} ${y - 4} L${x} ${y - 9} L${x + 8} ${y - 4} L${x + 8} ${y + 6} L${x} ${y + 10} L${x - 8} ${y + 6} Z" fill="none" stroke="${c}" stroke-width="2"/>`;
        case 8: return box(x - 9, y - 7, 9, 5, c) + box(x - 3, y - 1, 12, 5, c) + box(x - 8, y + 5, 7, 3, c);
        case 9: return [0, 1, 2, 3, 4].map((j) => k.dot({ x: x + Math.cos(j * 1.26) * 6, y: y + Math.sin(j * 1.26) * 6, r: 3, color: c })).join("");
        case 10: return `<path d="M${x} ${y - 9} L${x + 9} ${y} L${x} ${y + 9} L${x - 9} ${y} Z" fill="none" stroke="${c}" stroke-width="2"/>`;
        default: return [0, 1, 2].map((a) => [0, 1, 2].map((b) => box(x - 8 + a * 6, y - 8 + b * 6, 4, 4, (a + b) % 2 ? c : "none", c))).join("");
      }
    };
    const grid = fams
      .map((f, i) => {
        const x = 24 + (i % 4) * 34;
        const y = 24 + Math.floor(i / 4) * 32;
        const on = i === sel;
        return (on ? `<circle cx="${x}" cy="${y}" r="${12 + en * 3}" fill="#ffd166" opacity="${0.25 + en * 0.15}"/>` : "") + icons(i, x, y, on ? "#ffd166" : "#777");
      })
      .join("");
    const fl = idx(v, "flash");
    const fb = v.n("flashBright") / 100;
    const mb = v.n("motionBlur") / 100;
    const flashArt = fl === 0 ? "" : fl === 1 ? `<defs><radialGradient id="cw-tf-leak" cx="0.9" cy="0.1" r="0.8"><stop offset="0" stop-color="#ff9a3c" stop-opacity="${R(0.3 + fb * 0.7, 2)}"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient></defs><rect width="320" height="180" fill="url(#cw-tf-leak)"/>` : fl === 2 ? box(0, 0, 320, 180, "#fff", null, 0, 0.2 + fb * 0.7) : [0, 1, 2, 3].map((i) => box(30 + i * 80, 0, 26, 180, "#fff", null, 0, 0.15 + fb * 0.6)).join("");
    const blur = mb > 0 ? [0, 1, 2, 3, 4, 5].map((i) => ln(0, 15 + i * 30, 320 * mb, 15 + i * 30, "#fff", 6, null).replace("/>", ` opacity="0.35"/>`)).join("") : "";
    const preview = sceneA(k) + blur + flashArt;
    const freq = v.n("frequency");
    const cons = idx(v, "consistency");
    const bld = v.p("build") * 2 - 1;
    const tl = v.n("typicalLength");
    const marks = [];
    const n = Math.max(1, Math.min(30, freq));
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const other = cons === 2 ? false : cons === 1 ? k.rnd(i + 3) < 0.2 : k.rnd(i + 3) < 0.6;
      const h = 8 + 8 * (1 + bld * (t - 0.5) * 1.6);
      const w = 2 + tl * 6;
      marks.push(box(10 + t * 290, 150 - h, w, h, other ? ["#7fb7ff", "#81b29a", "#e07a5f"][i % 3] : "#ffd166", null, 1));
    }
    return (
      k.bg(SKY) +
      box(6, 6, 140, 104, "#1d1d22", "#3a3a44", 6) +
      grid +
      shot(k, "cw-tf-p", 156, 8, 156, preview) +
      sm(k, 156, 108, `Flash: ${v("flash")} ${v("flashBright")}% · blur ${v("motionBlur")}%`, { size: 7.5 }) +
      sm(k, 10, 124, `${freq} a minute · ${tl} s each · ${v("consistency")} · ${v("build")}`, { size: 7.5, color: "#ddd" }) +
      ln(10, 150, 310, 150, "#444", 1) +
      (freq > 0 ? marks.join("") : sm(k, 120, 146, "(no transitions)", { size: 7.5 })) +
      k.caption(`${v("setting")} family, ${v("energy")}`)
    );
  });

  /* Intro and outro: where in the film it sits, a frame of the effect with its title, and when the hook lands. */
  W.look("introOutro", (v, k) => {
    const style = idx(v, "setting");
    const where = idx(v, "where");
    const mood = idx(v, "mood");
    const pal = [["#25344f", "#9fd3ff"], ["#3a2d5a", "#ffd166"], ["#1a1a1a", "#e05050"], ["#3a1010", "#ff9a3c"]][mood];
    const tOn = idx(v, "titleOn");
    const ts = 8 + (v.n("titleSize") / 100) * 30 + tOn * 6;
    const title = k.text({ x: 160, y: 100, text: "OPENING", size: ts, color: "#fff", weight: 700, spacing: 3, alpha: tOn === 0 ? 0.25 : 1 });
    const fx = [
      "",
      `<path d="M40 150 A130 110 0 0 1 280 150" fill="none" stroke="${pal[1]}" stroke-width="6"/>`,
      `<path d="M160 90 m0 -10 a10 10 0 1 1 -10 10 a20 20 0 1 1 30 -5 a35 35 0 1 1 -55 15 a55 55 0 1 1 90 -20" fill="none" stroke="${pal[1]}" stroke-width="4"/>`,
      [0, 1, 2, 3, 4].map((i) => `<rect x="${40 + i * 60}" y="0" width="18" height="180" fill="${pal[1]}" opacity="${0.15 + i * 0.05}"/>`).join(""),
      [0, 1, 2, 3, 4, 5].map((i) => ln(160 + Math.cos(i * 1.05) * 70, 90 + Math.sin(i * 1.05) * 40, 160 + Math.cos(i * 1.05) * 120, 90 + Math.sin(i * 1.05) * 80, pal[1], 5)).join(""),
      [0, 1, 2].map((i) => k.arrow({ x1: 40 + i * 120, y1: 160, x2: 40 + i * 120, y2: 120, w: 3, color: pal[1] })).join(""),
      box(60, 40, 200, 100, "none", pal[1], 10) + box(80, 120, 70, 12, pal[1], null, 4) + box(170, 120, 70, 12, pal[1], null, 4),
    ][style];
    const frame = box(0, 0, 320, 180, pal[0]) + fx + title;
    const len = v.n("length");
    const ht = v.n("hookTime");
    const hold = v.n("titleHold");
    const hk = idx(v, "hook");
    const wx = [14, 120, 196, 300][where];
    return (
      k.bg(SKY) +
      shot(k, "cw-io-f", 6, 6, 196, frame) +
      box(208, 6, 106, 110, "#1d1d22", "#3a3a44", 6) +
      sm(k, 214, 20, `${["None", "Opening arc", "Swirl in", "Light fall", "Slam in", "Smooth scroll", "End card"][style]}`, { size: 8.5, color: "#fff", weight: 700 }) +
      sm(k, 214, 36, `Mood: ${v("mood")}`, { size: 7.5 }) +
      sm(k, 214, 50, `Title: ${v("titleOn")}, ${v("titleSize")}%`, { size: 7 }) +
      sm(k, 214, 68, `Title stays ${hold} s`, { size: 7.5 }) +
      box(214, 72, Math.max(2, hold * 9), 4, "#fff") +
      sm(k, 214, 92, `Hooks ${v("hook")}`, { size: 7.5 }) +
      k.text({ x: 300, y: 96, text: ["…", "›", "»"][hk], size: 14, color: "#ffd166" }) +
      sm(k, 214, 108, `first hook at ${ht} s`, { size: 7.5 }) +
      sm(k, 6, 128, "The film", { size: 7.5 }) +
      box(10, 134, 300, 8, "#34343c", null, 4) +
      box(wx - 3, 130, 3 + len * 6, 16, pal[1], null, 3, 0.85) +
      k.label({ x: wx + 2, y: 156, text: v("where"), size: 7.5, color: "#ddd", anchor: where === 3 ? "end" : "start" }) +
      k.dot({ x: Math.min(306, wx + (ht / 30) * 80), y: 138, r: 3, color: "#ffd166" }) +
      k.caption(style === 0 ? "No intro or outro effect" : `${v("setting")} at the ${v("where")}, ${len} s`)
    );
  });

  /* Clip animation: the clip card moving in with its style, ghosts showing its path, and its timing. */
  W.look("clipAnimation", (v, k) => {
    const mode = idx(v, "setting");
    const style = v("style");
    const str = v.n("strength") / 100;
    const travel = v.n("travel") / 100;
    const spin = v.n("spinDeg");
    const start = v.n("startSize") / 100;
    const os = idx(v, "overshoot");
    const n = 5;
    const ghosts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const p = mode === 2 ? 1 - t : t;
      let x = 0;
      let y = 0;
      let sc = 1;
      let rot = 0;
      let op = 1;
      const amt = 0.3 + str * 0.7;
      if (style === "fade") op = 0.15 + p * 0.85;
      if (style === "slide") x = -(1 - p) * (40 + travel * 140) * amt;
      if (style === "zoom") sc = start + (1 - start) * p;
      if (style === "bounce") y = -Math.abs(Math.sin(p * Math.PI * 2)) * (1 - p) * (30 + travel * 60) * amt;
      if (style === "spin") rot = (1 - p) * spin * amt;
      if (style === "shake") x = (i % 2 ? 1 : -1) * (6 + travel * 30) * amt * (1 - p * 0.5);
      if (style === "swing") rot = Math.sin(p * Math.PI * 2) * (1 - p) * (20 + spin / 20) * amt;
      if (style !== "zoom") sc = sc * (0.85 + 0.15 * start);
      if (i === n - 1 && os) x += os * 6 * (style === "slide" ? 1 : 0), sc *= 1 + os * 0.04;
      ghosts.push(`<g opacity="${R(i === n - 1 ? op : op * 0.3, 2)}" transform="translate(${R(150 + x)} ${R(60 + y)}) rotate(${R(rot)}) scale(${R(Math.max(0.05, sc), 2)})">${box(-50, -30, 100, 60, "#5b6f8f", "#fff", 4)}${k.person({ x: 0, y: 24, s: 0.6, color: "#a5574a" })}</g>`);
    }
    const dur = v.n("duration");
    const rep = v.n("repeat");
    const cue = v.n("cueOffset");
    const ov = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      ov.push([222 + t * 84, 150 - (1 - Math.pow(1 - t, 2) + os * 0.18 * Math.sin(t * Math.PI) * (t > 0.5 ? 1 : 0.4)) * 24]);
    }
    return (
      k.bg(SKY) +
      box(6, 6, 206, 112, "#22222a", "#3a3a44", 4) +
      `<clipPath id="cw-ca-clip"><rect x="6" y="6" width="206" height="112"/></clipPath><g clip-path="url(#cw-ca-clip)">${ghosts.join("")}</g>` +
      (mode === 0 ? sm(k, 12, 112, "none (faded: what it would do)", { size: 7.5, color: "#999" }) : "") +
      box(218, 6, 96, 112, "#1d1d22", "#3a3a44", 6) +
      sm(k, 224, 20, `${style}, ${["none", "in", "out", "in and out", "loop"][mode]}`, { size: 8, color: "#fff", weight: 700 }) +
      sm(k, 224, 36, `Strength ${v("strength")}%`, { size: 7.5 }) +
      sm(k, 224, 50, `Moves ${v("travel")}% · turns ${spin}°`, { size: 7 }) +
      sm(k, 224, 64, `Starts at ${v("startSize")}%`, { size: 7.5 }) +
      sm(k, 224, 80, `Repeats ${rep}`, { size: 7.5 }) +
      Array.from({ length: 8 }, (_, i) => k.dot({ x: 228 + i * 10, y: 88, r: 3, color: i < rep ? "#ffd166" : "#3a3a44" })).join("") +
      sm(k, 224, 108, `Starts on ${v("timing")}`, { size: 7 }) +
      sm(k, 10, 134, `${dur} s long · ${cue} frames from its cue`, { size: 7.5, color: "#ddd" }) +
      box(10, 140, 200, 4, "#34343c") +
      ln(60, 136, 60, 154, "#e07a5f", 1.5, "2 2") +
      box(60 + cue * 3, 138, Math.max(2, dur * 40), 8, "#ffd166", null, 2) +
      poly(ov, "#81b29a", 1.5) +
      sm(k, 222, 158 - 2, v("overshoot"), { size: 7 }) +
      k.caption(mode === 0 ? "No clip animation" : `The clip ${style}s ${["", "in", "out", "in and out", "on a loop"][mode]}`)
    );
  });

  /* ---------- extra dot grids ---------- */
  const pad = (id, x, y, xLabel, yLabel) => {
    const spec = W.get(id);
    if (spec && !(spec.faces || []).some((f) => f.face === "pad")) W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("transitionKind", "exactDirection", "duration", "Direction", "Length");
  pad("transitionFamily", "typicalLength", "flashBright", "Typical length", "Flash brightness");
  pad("introOutro", "titleHold", "titleSize", "Title stays", "Title size");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
