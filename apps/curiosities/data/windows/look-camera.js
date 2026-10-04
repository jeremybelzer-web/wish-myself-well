/* Camera: the live picture at the top of each camera curiosity's window (CuriosityWindows.look). */
(function (W) {
  /* Camera angle in 3D: what the camera sees (left), and a map from above with the camera around them (right). */
  W.look("cameraPlace", (v, k) => {
    const around = v.n("around");
    const height = v.n("height");
    const dist = Math.max(0.3, v.n("distance"));
    const off = v.n("offAxis");
    const roll = v.n("roll");
    /* The view: closer is bigger; above puts the horizon high and looks down on them; off axis slides them aside. */
    const s = k.clamp(2.4 / Math.sqrt(dist), 0.25, 4);
    const horizon = k.clamp(95 + height * 0.9, 8, 172);
    const x = 110 - off * 1.4 - Math.sin(k.rad(around)) * 18;
    const back = Math.abs(around) > 110;
    const view = `<g transform="rotate(${roll} 110 90)">${k.wall({ y: horizon, color: "#cdbfa8", floor: "#7d6650" })}${k.person({ x, y: Math.min(220, horizon + 30 * s), s, mood: back ? 0 : 0.3, look: k.clamp(-around / 90, -1, 1), lean: -height * 0.15, alpha: 1, color: "#4a6fa5", eyes: back ? 0 : 0.8 })}</g>`;
    /* The map: them in the middle, the camera around them at its distance, pointing in (plus off axis). */
    const mx = 265;
    const my = 70;
    const R = 10 + k.clamp(Math.sqrt(dist) / Math.sqrt(60), 0, 1) * 34;
    const a = k.rad(around - 90);
    const cx = mx + Math.cos(a) * R;
    const cy = my - Math.sin(a) * R;
    const map = `<rect x="215" y="10" width="100" height="120" rx="6" fill="#1d1d22" stroke="#444"/>${k.ring({ x: mx, y: my, r: R, color: "#555", dash: "3 3", w: 1 })}${k.dot({ x: mx, y: my, r: 6, color: "#4a6fa5" })}${k.label({ x: mx, y: my - 9, text: "them", size: 8, color: "#aaa" })}${k.cam({ x: cx, y: cy, dir: (Math.atan2(my - cy, mx - cx) * 180) / Math.PI + off, s: 0.6 })}${k.label({ x: mx, y: 124, text: `${Math.round(around)}° · ${dist} m · ${height > 0 ? "above" : height < 0 ? "below" : "eye level"}`, size: 8, color: "#ccc" })}`;
    return `<clipPath id="cw-cp-view"><rect x="0" y="0" width="210" height="180"/></clipPath>${k.bg("#141418")}<g clip-path="url(#cw-cp-view)">${view}</g>${map}${k.caption(`Measured from ${v("subject")}`)}`;
  });

  /* ---------- small shared drawing pieces for the camera pictures ---------- */
  const R = (n, d) => {
    const m = Math.pow(10, d == null ? 1 : d);
    return Math.round(n * m) / m;
  };
  /* A small left-aligned note. */
  const sm = (k, x, y, t, o) => k.label(Object.assign({ x, y, text: t, size: 8, color: "#bbb", anchor: "start" }, o || {}));
  /* A rounded word chip. */
  function chip(k, x, y, t, fill, ink) {
    const w = Math.max(18, String(t).length * 4.3 + 10);
    return `<rect x="${R(x)}" y="${R(y - 9)}" width="${R(w)}" height="12" rx="6" fill="${fill || "#2c2c34"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x + w / 2, y, text: t, size: 7.5, color: ink || "#eee" });
  }
  const ln = (x1, y1, x2, y2, c, w, dash) => `<line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" stroke="${c || "#888"}" stroke-width="${w || 1}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  const box = (x, y, w, h, fill, stroke, rx, op) => `<rect x="${R(x)}" y="${R(y)}" width="${R(Math.max(0.5, w))}" height="${R(Math.max(0.5, h))}" rx="${rx || 0}" fill="${fill || "none"}"${stroke ? ` stroke="${stroke}"` : ""}${op != null ? ` opacity="${R(op, 2)}"` : ""}/>`;
  const poly = (pts, c, w, fill, dash) => `<polyline points="${pts.map((p) => R(p[0]) + "," + R(p[1])).join(" ")}" fill="${fill || "none"}" stroke="${c || "#ffd166"}" stroke-width="${w || 2}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  /* A full 320x180 drawing shrunk into a box at (x, y), w wide, clipped and framed. */
  function shot(k, id, x, y, w, inner, stroke) {
    const s = w / 320;
    return `<g transform="translate(${R(x)} ${R(y)}) scale(${R(s, 4)})"><clipPath id="${id}"><rect x="0" y="0" width="320" height="180"/></clipPath><g clip-path="url(#${id})">${inner}</g><rect x="0" y="0" width="320" height="180" fill="none" stroke="${stroke || "#888"}" stroke-width="${R(1.5 / s)}"/></g>`;
  }
  /* A person h pixels tall with their feet at (x, feet). */
  const fig = (k, x, feet, h, o) => k.person(Object.assign({ x, y: feet, s: h / 76 }, o || {}));
  const room = (k, y, c1, c2) => k.wall({ y, color: c1 || "#cdbfa8", floor: c2 || "#7d6650" });
  /* The dark side panel on the right. */
  const side = (y, h) => box(214, y == null ? 4 : y, 102, h || 154, "#1d1d22", "#3a3a44", 6);
  /* A timeline track with a label. */
  const track = (k, x, y, w, label) => (label ? sm(k, x, y - 3, label, { size: 7.5, color: "#999" }) : "") + box(x, y, w, 5, "#34343c", null, 2.5);
  /* A darkening of the edges, own id. */
  const vig = (id, p) => `<defs><radialGradient id="${id}"><stop offset="50%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="${R(Math.max(0, Math.min(1, p)), 2)}"/></radialGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id})"/>`;
  const blurDef = (id, sd) => `<defs><filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${R(Math.max(0, sd), 2)}"/></filter></defs>`;
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  /* Shot lengths along a strip, drawn as boxes between x and x + w. */
  function shots(lengths, x, y, w, h, colorOf) {
    const tot = lengths.reduce((a, b) => a + b, 0) || 1;
    let at = x;
    return lengths
      .map((l, i) => {
        const ww = (l / tot) * w;
        const r = box(at, y, Math.max(0.6, ww - 1), h, colorOf ? colorOf(i) : i % 2 ? "#6c8fb8" : "#8fb2d8", "#1c1712");
        at += ww;
        return r;
      })
      .join("");
  }
  const SKY = "#141418";
  /* The 3D view's staging words (rig/staging.js), drawn small: how everyone stands together, seen from above, as
     dots with a tick for where each one faces. Returns "" when the row has no such setting. */
  const TOGETHER = {
    "face to face": [[-10, 0, 0], [10, 0, 180]],
    "side by side": [[-7, 0, 270], [7, 0, 270]],
    "one behind the other": [[0, -8, 270], [0, 8, 270]],
    "over the shoulder": [[-6, 6, 30], [10, -6, 210]],
    circle: [[0, -10, 270], [10, 0, 180], [0, 10, 90], [-10, 0, 0]],
    standoff: [[-20, 0, 0], [20, 0, 180]],
    huddle: [[-4, -4, 315], [4, -4, 225], [4, 4, 135], [-4, 4, 45]],
  };
  function marksFromAbove(k, x, y, word) {
    const pts = TOGETHER[word] || TOGETHER["face to face"];
    const col = word === "standoff" ? "#ff6b6b" : "#ffd166";
    return box(x - 26, y - 16, 52, 32, "#1d1d22", "#555", 4) + pts.map(([dx, dy, a]) => k.dot({ x: x + dx, y: y + dy, r: 3, color: col }) + ln(x + dx, y + dy, x + dx + Math.cos(k.rad(a)) * 6, y + dy + Math.sin(k.rad(a)) * 6, "#eee", 1.2)).join("");
  }

  /* Point of view: the shot as seen through someone (or something), with whose eyes, trust and timing beside it. */
  W.look("pov", (v, k) => {
    const kind = v("setting");
    const ghost = kind === "nobody" ? 0.3 : 0.95;
    const eyeH = v.n("eyeHeight");
    const cl = v.p("closeness");
    const hon = v.p("honesty");
    const eyeY = 70 + (eyeH - 1.6) * 28;
    const ph = 110;
    const feet = eyeY + ph * 0.88;
    let scene = room(k, Math.min(178, feet - 14)) + fig(k, 205, feet, ph * (1 + hon * 0.25), { mood: hon > 0.9 ? -0.5 : 0.3, color: "#a5574a", look: -0.6 });
    if (hon > 0.2 && hon < 0.8) scene += k.tint({ color: "#ffb347", alpha: 0.3 });
    if (hon >= 0.8) scene += `<g opacity="0.35">${fig(k, 150, feet, ph, { mood: -0.8, color: "#c33" })}</g>` + k.text({ x: 280, y: 40, text: "?", size: 40, color: "#ff5c5c", weight: 700 });
    /* What stands between us and them: a shoulder, a bit of them, their eyelids, or a keyhole for an object. */
    let fg;
    if (kind === "an object") fg = `<path d="M0 0 H320 V180 H0 Z M160 90 m-75 0 a75 75 0 1 0 150 0 a75 75 0 1 0 -150 0" fill="#0b0b0d" fill-rule="evenodd"/>`;
    else if (cl < 0.4) fg = `<ellipse cx="40" cy="190" rx="90" ry="85" fill="#2b2f3a"/><circle cx="55" cy="95" r="42" fill="#3a2d22"/>`;
    else if (cl < 0.9) fg = `<ellipse cx="-10" cy="200" rx="60" ry="80" fill="#2b2f3a"/>`;
    else fg = `<path d="M0 0 H320 V38 Q160 -10 0 38 Z" fill="#0b0b0d"/><path d="M0 180 H320 V150 Q160 196 0 150 Z" fill="#0b0b0d"/>` + k.hand({ x: 70, y: 168, s: 1.1, open: 0.6 });
    scene += `<g opacity="${ghost}">${fg}</g>` + vig("cw-pov-vig", v.p("pull") * 0.95);
    const pv = v.p("reveal");
    const sw = [1, 3, 7][idx(v, "switchRate")];
    const segs = [];
    for (let i = 0; i < sw; i++) segs.push(1 + k.rnd(i + 2));
    const rv = pv >= 0.99 ? "" : k.dot({ x: 222 + pv * 84, y: 104, r: 4, color: "#ffd166" });
    return (
      k.bg(SKY) +
      shot(k, "cw-pov-clip", 4, 4, 206, scene) +
      side() +
      sm(k, 222, 18, "Whose eyes") +
      chip(k, 222, 32, v("whoseEyes"), "#4a3a6a") +
      sm(k, 222, 52, "Share of shots") +
      k.pie({ x: 290, y: 52, r: 9, p: v.p("share") }) +
      track(k, 222, 76, 84, "Switching viewers") +
      shots(segs, 222, 76, 84, 5, (i) => ["#e07a5f", "#81b29a", "#f2cc8f"][i % 3]) +
      track(k, 222, 102, 84, "Who it is revealed") +
      rv +
      (pv >= 0.99 ? k.label({ x: 264, y: 112, text: "never told", size: 7, color: "#ff8a8a" }) : "") +
      track(k, 222, 132, 84, `Inside for ${v("stayLength")} s`) +
      box(222, 132, Math.max(2, (v.n("stayLength") / 120) * 84), 5, "#7fb7ff", null, 2.5) +
      sm(k, 8, 132, `Eyes ${v("eyeHeight")} m up`, { color: "#ddd" }) +
      sm(k, 8, 146, `Trust: ${v("honesty")}`, { color: hon >= 0.8 ? "#ff8a8a" : "#ddd" }) +
      k.caption(kind === "nobody" ? "Nobody's eyes: a neutral camera (ghosted: if it were someone)" : `Through ${kind === "an object" ? "an object" : "their eyes"}: ${v("closeness")}`)
    );
  });

  /* Angle matched to the line: two frames, before and after a spoken line, and how much the angle swings. */
  W.look("angleToLine", (v, k) => {
    const how = v.p("setting");
    const str = v.n("strength") / 5;
    const jump = 1 + v.n("sizeJump") / 100;
    const turn = v.n("turnAround");
    const swing = [0.6, 1, 1.5][idx(v, "distanceSwing")];
    const loud = how < 0.4 ? 0.3 + str * 0.7 : how > 0.6 ? -0.4 - str * 0.6 : 0;
    const before = room(k, 140) + fig(k, 160, 165, 100, { mood: 0.1, color: "#4a6fa5" }) + k.bubble({ x: 230, y: 30, w: 90, text: "I quit!", tail: -30 });
    const h2 = k.clamp(100 * jump, 10, 400);
    const after = room(k, 140) + fig(k, 160 + Math.sin(k.rad(turn)) * 60, 70 + h2, h2, { mood: loud > 0 ? -0.7 : 0.4, look: Math.sin(k.rad(turn)) * -1, eyes: Math.cos(k.rad(turn)) < -0.3 ? 0 : 0.8, color: "#4a6fa5" });
    const t = v.n("timing");
    const which = idx(v, "whichLines");
    const lines = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const big = which === 0 || (which === 1 && i % 3 === 0) || (which === 2 && i === 5);
      return box(10 + i * 24, 140, 18, 6, big ? "#ffd166" : "#555", null, 2);
    });
    const share = Math.round(v.p("share") * 10);
    const dots = [];
    for (let i = 0; i < 10; i++) dots.push(k.dot({ x: 226 + i * 9, y: 140, r: 3, color: i < share ? "#7fe07f" : "#444" }));
    return (
      k.bg(SKY) +
      shot(k, "cw-atl-a", 6, 18, 120, before) +
      shot(k, "cw-atl-b", 6 + 120 + 30 * swing, 18, 120, after, how < 0.4 ? "#ffd166" : how > 0.6 ? "#7fb7ff" : "#888") +
      k.arrow({ x1: 130, y1: 52, x2: 124 + 30 * swing, y2: 52, w: 1.5 + str * 3 }) +
      sm(k, 6, 12, "before the line") +
      sm(k, 128 + 30 * swing, 12, `after (${v("distanceSwing")})`) +
      sm(k, 6, 100, `Size ${v("sizeJump") > 0 ? "+" : ""}${v("sizeJump")}% · turns ${turn}° · strength ${v("strength")}`, { color: "#ddd" }) +
      sm(k, 6, 116, `Cut ${t < 0 ? -t + " beats before" : t > 0 ? t + " beats after" : "on"} the line`, { color: "#ddd" }) +
      ln(10 + 4 * 24 + 9 + t * 10, 128, 10 + 4 * 24 + 9 + t * 10, 152, "#ff6b6b", 2) +
      lines.join("") +
      sm(k, 10, 160 - 2, v("whichLines"), { size: 7 }) +
      sm(k, 226, 128, "Lines matched", { size: 7.5 }) +
      dots.join("") +
      k.caption(`The angle ${v("setting")}`)
    );
  });

  /* Frequency of angle changes: a minute of shots, with the tension curve they follow. */
  W.look("cutRate", (v, k) => {
    const pm = v.n("perMinute") * [0.6, 1, 1.6][idx(v, "setting")];
    const n = Math.max(1, Math.min(90, Math.round(pm)));
    const trend = v.p("trend") * 2 - 1;
    const peak = v.p("peakAt");
    const un = v.p("unevenness");
    const ft = v.p("followsTension");
    const tension = (x) => 0.2 + 0.7 * Math.exp(-Math.pow((x - 0.7) / 0.18, 2));
    const L = [];
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      let l = 1 - trend * (x - 0.5) * 1.2;
      l *= 1 - 0.6 * Math.exp(-Math.pow((x - peak) / 0.15, 2));
      l *= 1 - ft * 0.7 * tension(x);
      l *= 1 + un * (k.rnd(i + 1) * 2 - 1) * 0.9 * (un > 0.9 && i % 4 < 2 ? 1.5 : 1);
      L.push(Math.max(0.08, l));
    }
    const tpts = [];
    for (let i = 0; i <= 20; i++) tpts.push(tension(i / 20));
    const ramp = v.n("rampTime") / 60;
    const lpa = v.n("linesPerAngle");
    const bub = [];
    for (let i = 0; i < Math.min(10, Math.ceil(lpa)); i++) bub.push(box(14 + i * 18, 132, 14, 9, "#f4f1ea", "#1c1712", 4));
    return (
      k.bg(SKY) +
      sm(k, 10, 14, `One minute of film: ${n} shots`, { color: "#ddd", size: 9 }) +
      shots(L, 10, 22, 300, 34) +
      ln(10 + peak * 300, 18, 10 + peak * 300, 60, "#ff6b6b", 1.5, "3 2") +
      sm(k, 10, 74, "tension", { color: "#e07a5f", size: 7.5 }) +
      k.graph({ x: 10, y: 66, w: 300, h: 30, points: tpts, color: ft > 0.1 ? "#e07a5f" : "#5a3a33", w2: 1.5 }) +
      sm(k, 10, 112, `New pace reached in ${v("rampTime")} s`, { size: 7.5 }) +
      poly([[180, 112], [180 + ramp * 120, 102], [310, 102]], "#7fe07f", 2) +
      sm(k, 10, 124, `${lpa} lines per angle`, { size: 7.5 }) +
      bub.join("") +
      sm(k, 200, 124, v("unevenness"), { size: 7.5, color: "#ddd" }) +
      k.caption(`${v("setting")} cutting, ${v("trend")}, ${v("followsTension")} follows the tension`)
    );
  });

  /* Camera owner: a map from above with the camera on its leash, how far the player may turn and tilt, and who holds the camera over time. */
  W.look("cameraOwner", (v, k) => {
    const player = v("setting") === "player";
    const leash = v.n("leash");
    const R0 = 12 + Math.sqrt(leash / 20) * 50;
    const turn = v.n("turnLimit");
    const mx = 90;
    const my = 80;
    const a0 = k.rad(90 - turn / 2);
    const a1 = k.rad(90 + turn / 2);
    const wr = 34;
    const cy0 = my - R0;
    const wedge = turn >= 359 ? `<circle cx="${mx}" cy="${R(cy0)}" r="${wr}" fill="#7fb7ff" opacity="0.25"/>` : `<path d="M${mx} ${R(cy0)} L${R(mx + Math.cos(a0) * wr)} ${R(cy0 + Math.sin(a0) * wr)} A${wr} ${wr} 0 ${turn > 180 ? 1 : 0} 1 ${R(mx + Math.cos(a1) * wr)} ${R(cy0 + Math.sin(a1) * wr)} Z" fill="#7fb7ff" opacity="0.3"/>`;
    const tilt = v.n("tiltLimit");
    const g = v.p("guidance");
    const share = v.p("cinematicShare");
    const nSw = [1, 3, 7][idx(v, "handoff")];
    const blend = Math.min(1, v.n("blendTime") / 5 + v.p("handoffSpeed") * 0.4);
    const segs = [];
    for (let i = 0; i <= nSw; i++) segs.push(i % 2 === 0 ? share + 0.02 : 1 - share + 0.02);
    let at = 10;
    const tot = segs.reduce((a, b) => a + b, 0);
    const lane = segs
      .map((s, i) => {
        const w = (s / tot) * 196;
        const r = box(at, 140, w, 8, i % 2 === 0 ? "#ffd166" : "#7fb7ff") + (i > 0 ? box(at - blend * 10, 140, blend * 20 + 0.5, 8, "#c0c0a0", null, 0, 0.8) : "");
        at += w;
        return r;
      })
      .join("");
    const fr = v.n("freedom") / 5;
    return (
      k.bg(SKY) +
      box(6, 6, 200, 120, "#1d1d22", "#3a3a44", 6) +
      wedge +
      k.ring({ x: mx, y: my, r: R0, color: "#666", dash: "3 3", w: 1 }) +
      k.dot({ x: mx, y: my, r: 6, color: "#4a6fa5" }) +
      k.cam({ x: mx, y: my - R0, dir: 90, s: 0.6 }) +
      sm(k, mx + 8, my - R0 / 2, `${leash} m`, { size: 7.5 }) +
      (g > 0 ? `${k.text({ x: 175, y: 40, text: "★", size: 16, color: "#ffd166" })}${k.arrow({ x1: mx + 10, y1: my - 10, x2: mx + 10 + g * 70, y2: my - 10 - g * 35, w: 1 + g * 3, color: "#ffd166" })}` : "") +
      sm(k, 12, 120, `Player turns ${turn}°`, { size: 7.5 }) +
      side(6, 120) +
      sm(k, 222, 20, player ? "Player holds it" : "Authored camera", { color: "#fff", size: 8.5, weight: 700 }) +
      `<g transform="translate(262 46)">${box(-22, -10, 44, 22, player ? "#7fb7ff" : "#555", "#1c1712", 10)}${k.dot({ x: -12, y: 0, r: 3, color: "#222" })}${k.dot({ x: 12, y: 0, r: 3, color: "#222" })}</g>` +
      k.meter({ x: 222, y: 76, w: 84, label: `Freedom ${v("freedom")}`, p: fr, color: "#7fb7ff" }) +
      sm(k, 222, 100, `Up / down ${tilt}°`, { size: 7.5 }) +
      `<path d="M240 110 L${R(240 + Math.cos(k.rad(-tilt)) * 14)} ${R(110 + Math.sin(k.rad(-tilt)) * 14)} A14 14 0 0 1 ${R(240 + Math.cos(k.rad(tilt)) * 14)} ${R(110 + Math.sin(k.rad(tilt)) * 14)} Z" fill="#81b29a" opacity="0.6"/>` +
      sm(k, 10, 136, `Gold = authored, blue = player; handover ${v("handoffSpeed")}, ${v("blendTime")} s`, { size: 7 }) +
      lane +
      k.caption(`Guidance: ${v("guidance")} · handing over ${v("handoff")}`)
    );
  });

  /* Object path: the object's trip across the frame, its curve, how it lands and who moves it. */
  W.look("objectPath", (v, k) => {
    const kind = v("setting");
    const len = (70 + v.n("distance") * 20) * (0.6 + Math.log10(1 + v.n("travel")) * 0.4);
    const head = k.rad(v.n("heading") - 90);
    let dx = Math.cos(head) * len;
    let dy = Math.sin(head) * len;
    const base = { lift: [0, -1], drop: [0, 1], slide: [1, 0], open: [0.7, -0.7], pass: [1.6, 0.2] }[kind];
    if (base) {
      dx = dx * 0.5 + base[0] * len;
      dy = dy * 0.5 + base[1] * len;
    }
    dy -= v.n("rise") * 10;
    const x0 = 160 - dx / 2;
    const y0 = 85 - dy / 2;
    const arc = idx(v, "arc");
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const bend = [0, 0.15, 0.4, 0.1][arc] * len * Math.sin(Math.PI * t);
      const wob = arc === 3 ? Math.sin(t * Math.PI * 8) * 6 : 0;
      pts.push([x0 + dx * t - Math.sin(head) * wob, y0 + dy * t - bend + wob]);
    }
    const end = pts[pts.length - 1];
    const land = idx(v, "landing");
    const endMark = [k.ring({ x: end[0], y: end[1], r: 8, color: "#81b29a", w: 1.5 }), [0, 1, 2, 3, 4, 5].map((i) => ln(end[0], end[1], end[0] + Math.cos(i) * 14, end[1] + Math.sin(i) * 14, "#ff6b6b", 2)).join(""), poly([[end[0], end[1]], [end[0] + 10, end[1] - 14], [end[0] + 20, end[1]], [end[0] + 26, end[1] - 6], [end[0] + 32, end[1]]], "#ffd166", 1.5), k.arrow({ x1: end[0], y1: end[1], x2: end[0] + dx * 0.2 + 6, y2: end[1] + dy * 0.2, color: "#aaa", w: 1.5 })][land];
    const eye = v.p("eyeCatch");
    const still = kind === "still";
    const ghosts = [];
    const nG = 2 + Math.round(v.n("moveTime") / 2);
    for (let i = 1; i < nG; i++) {
      const p = pts[Math.round((i / nG) * 24)];
      ghosts.push(box(p[0] - 6, p[1] - 6, 12, 12, "#e07a5f", null, 2, 0.25));
    }
    const ctl = ["↓ gravity", "✋ a person", "⚙ a machine", "? nobody knows"][idx(v, "control")];
    return (
      k.bg(SKY) +
      room(k, 130, "#3a3640", "#2a2520") +
      (still ? "" : ghosts.join("")) +
      poly(pts, still ? "#666" : "#ffd166", 2, null, still ? "4 4" : null) +
      endMark +
      (eye > 0 ? k.ring({ x: x0, y: y0, r: 12 + eye * 14, color: "#ffd166", w: 1 + eye * 4 }) : "") +
      box(x0 - 8, y0 - 8, 16, 16, "#e07a5f", "#1c1712", 3) +
      chip(k, 8, 16, ctl) +
      sm(k, 8, 156, `${v("travel")} m · rises ${v("rise")} m · heading ${v("heading")}° · ${v("moveTime")} s`, { color: "#ddd" }) +
      k.caption(still ? "Still (dashed: the path it would take)" : `It ${kind}s: ${v("arc")}, ${v("landing")}`)
    );
  });

  /* Where they stand: the shot (left) and the room from above (right). */
  W.look("blocking", (v, k) => {
    const kind = idx(v, "setting");
    const gap = (30 + Math.sqrt(v.n("gapMeters")) * 20) * (0.7 + v.n("distance") * 0.12);
    const face = v.n("facing");
    const hg = v.n("heightGap") * 18 + idx(v, "levels") * 10;
    const dg = v.n("depthGap");
    const pw = idx(v, "power");
    const gc = idx(v, "gapClosing");
    const still = v.p("stillness");
    /* map */
    const mx = 265;
    const my = 70;
    const people = [
      [-gap / 2, 0, face / 2],
      [gap / 2, -Math.sqrt(dg) * 8 - (kind === 2 ? 22 : 0), 180 - face / 2],
    ];
    if (kind === 1) people.push([0, 20, 90 + 180]);
    const center = pw === 0 ? -1 : pw === 1 ? 0 : pw === 2 ? 1 : 0;
    const mapP = people.map(([x, y, a], i) => {
      const px = mx + x * 0.45;
      const py = my - y * 0.8;
      return k.dot({ x: px, y: py, r: 5, color: i === center ? "#ffd166" : i ? "#a5574a" : "#4a6fa5" }) + k.arrow({ x1: px, y1: py, x2: px + Math.cos(k.rad(a)) * 12, y2: py - Math.sin(k.rad(a)) * 12, w: 1.2, color: "#ddd" });
    });
    const ref = ["each other", "the camera", "the door", "the table", "the room's center"].indexOf(v("placedFrom"));
    const refPos = [[mx, my], [mx, my + 50], [mx + 40, my - 50], [mx, my + 25], [mx, my]][Math.max(0, ref)];
    /* view */
    const scale = (d) => 90 / (1 + d * 0.12);
    const fview = people
      .map(([x, y], i) => {
        const hh = scale(Math.max(0, -y / 8)) * (kind === 3 && i === 1 ? 0.7 : 1);
        const lift = i === 1 ? hg : 0;
        return fig(k, 105 + x, 150 - Math.max(0, -y / 8) * 3 - lift, hh, { color: i === center ? "#d8a531" : i ? "#a5574a" : "#4a6fa5", look: i ? -0.8 : 0.8, mood: i === center ? 0.5 : 0, walk: 1 - still });
      })
      .reverse()
      .join("");
    const arrows = gc === 1 ? "" : [-1, 1].map((sd) => k.arrow({ x1: 105 + (sd * gap) / 2, y1: 60, x2: 105 + (sd * gap) / 2 + sd * (gc === 0 ? 14 : -14), y2: 60, w: 1.5, color: "#ffd166" })).join("");
    const jitter = still < 1 ? [0, 1, 2].map((i) => ln(105 - gap / 2 - 18, 100 + i * 8, 105 - gap / 2 - 18 - (1 - still) * 10, 100 + i * 8, "#ddd", 1)).join("") : k.label({ x: 105 - gap / 2 - 20, y: 105, text: "❄", size: 12, color: "#9fd3ff" });
    return (
      k.bg(SKY) +
      `<clipPath id="cw-blk-clip"><rect x="4" y="4" width="206" height="154"/></clipPath><g clip-path="url(#cw-blk-clip)">${box(4, 4, 206, 154, "#2a2a30")}${box(4, 120, 206, 40, "#3b332b")}${box(80 + gap / 2 - 10, 150 - hg, 40, hg + 2, "#5d4a3a")}${fview}${arrows}${jitter}</g>` +
      side() +
      sm(k, 222, 16, "From above") +
      k.dot({ x: refPos[0], y: refPos[1], r: 3, color: "#ff6b6b" }) +
      mapP.join("") +
      sm(k, 222, 130, `Gap ${v("gapMeters")} m · face ${face}°`, { size: 7.5 }) +
      sm(k, 222, 142, `Back ${dg} m · up ${v("heightGap")} m`, { size: 7.5 }) +
      sm(k, 222, 154, `from ${v("placedFrom")}`, { size: 7.5, color: "#ff8a8a" }) +
      (v.slider("together") ? marksFromAbove(k, 38, 26, String(v("together"))) + sm(k, 68, 22, String(v("together")), { size: 7.5, color: "#ffd166" }) : "") +
      (v.slider("seated") ? (v("seated") === "sitting" ? box(105 - gap / 2 - 14, 128, 28, 6, "#8a6a4a", "#1c1712", 2) + box(105 - gap / 2 + 10, 108, 5, 26, "#8a6a4a", "#1c1712", 2) + sm(k, 68, 34, "sitting down", { size: 7.5 }) : sm(k, 68, 34, "standing up", { size: 7.5 })) : "") +
      k.caption(`${v("setting")} · center: ${v("power")} · ${v("gapClosing")}`)
    );
  });

  /* Shot size: how big they are in the frame, the space above the head and the room to look into. */
  W.look("shotSize", (v, k) => {
    const sz = [3.2, 1.6, 0.85, 0.3][idx(v, "setting")];
    const hFrac = sz * Math.sqrt(v.n("subjectHeight") / 40);
    const h = 170 * hFrac;
    const top = 180 * (v.n("topGap") / 100) + v.n("headroom") * 6;
    const n = [1, 2, 4, 9][idx(v, "subjectCount")];
    const br = v.n("breathing");
    const x0 = 160 - br * 14;
    const ppl = [];
    for (let i = n - 1; i >= 0; i--) {
      const off = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.max(24, h * 0.35);
      const hh = i === 0 ? h : h * (0.9 - Math.min(0.4, i * 0.05));
      ppl.push(fig(k, x0 + off, top + hh, hh, { mood: 0.3, look: 1, color: i ? "#7a8794" : "#4a6fa5" }));
    }
    const inner = room(k, Math.min(175, top + h * 0.92)) + ppl.join("") + ln(0, top, 320, top, "#ffd166", 2, "6 4") + k.arrow({ x1: x0 + 30, y1: 60, x2: x0 + 30 + br * 20 + 6, y2: 60, color: "#9fd3ff", w: 2 });
    const cs = idx(v, "changeSpeed");
    const ten = idx(v, "tightenOnTension");
    const st = v.n("sizeTime");
    return (
      k.bg(SKY) +
      shot(k, "cw-ss-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, "Change of size") +
      chip(k, 222, 32, v("changeSpeed")) +
      `<g transform="translate(262 62)">${box(-28, -16, 56, 32, "none", "#888")}${box(-28 + 14 * (cs ? 1 : 0.5), -16 + 8 * (cs ? 1 : 0.5), 56 - 28 * (cs ? 1 : 0.5), 32 - 16 * (cs ? 1 : 0.5), "none", "#ffd166", 0)}</g>` +
      sm(k, 222, 92, `over ${st} s`, { size: 7.5 }) +
      box(222, 96, 84, 4, "#34343c") +
      box(222, 96, Math.max(2, (st / 30) * 84), 4, "#ffd166") +
      sm(k, 222, 114, "Closer with tension", { size: 7.5 }) +
      poly([[222, 140], [264, 140 - ten * 6], [306, 140 - ten * 14]], "#e07a5f", 2) +
      sm(k, 222, 154, `vs ${v("measuredFrom")}`, { size: 7, color: "#ff8a8a" }) +
      sm(k, 8, 154, `${v("subjectHeight")}% tall · gap above ${v("topGap")}%`, { size: 7.5, color: "#ddd" }) +
      (v.slider("who") ? chip(k, 8, 18, String(v("who")) === "whoever is shown" ? "on whoever is shown" : "on " + String(v("who")), String(v("who")) === "whoever is shown" ? "#2c2c34" : "#5a4a1a", "#ffd166") + (String(v("who")) === "whoever is shown" ? "" : k.label({ x: x0, y: Math.max(14, top - 4), text: "★ " + (["the first character", "the second character", "the third character", "the fourth character"].indexOf(String(v("who"))) + 1), size: 9, color: "#ffd166" })) : "") +
      k.caption(`${v("setting")} shot, ${v("subjectCount")} in frame`)
    );
  });

  /* Angle height: what the camera sees (left) and the camera beside them from the side (right). */
  W.look("angleHeight", (v, k) => {
    const lv = idx(v, "setting");
    const steep = v.n("degrees");
    const camH = v.n("lensHeight");
    const eye = [0.9, 1.2, 1.55, 2.6][idx(v, "subjectHeight")];
    const above = (lv - 2) * 0.6 + v.n("eyeGap") * 0.3 + (camH - eye) * 0.2 + (lv > 2 ? 1 : lv < 2 ? -1 : 0) * steep / 90;
    const horizon = k.clamp(90 - above * 40, 6, 176);
    const pr = idx(v, "powerRead");
    const ph = k.clamp(120 - above * 30, 50, 165) * (pr === 2 ? 1.1 : pr === 0 ? 0.85 : 1);
    const view = room(k, horizon) + fig(k, 105, 176 - Math.max(0, above) * 15, ph, { lean: -above * 4, mood: pr === 2 ? 0.6 : pr === 0 ? -0.4 : 0, look: 0 });
    /* side view */
    const gy = 140;
    const px = 290;
    const scaleM = 14;
    const ch = k.clamp(camH * scaleM * 0.6 + lv * 6 + steep / 10, 0, 120);
    const cy = gy - ch;
    const sph = eye * 30;
    const ey = gy - sph * 0.88;
    const climb = idx(v, "climb");
    return (
      k.bg(SKY) +
      shot(k, "cw-ah-clip", 4, 4, 206, view) +
      side() +
      ln(218, gy, 312, gy, "#666", 1.5) +
      fig(k, px, gy, sph, { color: "#4a6fa5" }) +
      k.cam({ x: 236, y: cy, dir: (Math.atan2(ey - cy, px - 236) * 180) / Math.PI, s: 0.55 }) +
      ln(236, cy, px, ey, "#ffd166", 1, "3 2") +
      (climb !== 1 ? k.arrow({ x1: 226, y1: cy, x2: 226, y2: cy + (climb ? -1 : 1) * (8 + v.n("climbTime") / 3), w: 1.5, color: "#81b29a" }) : "") +
      sm(k, 220, 18, `Camera ${camH} m up`, { size: 7.5 }) +
      sm(k, 220, 30, `${steep}° steep · eyes ${v("eyeGap")} m`, { size: 7.5 }) +
      sm(k, 220, 154, `Matched to ${v("subjectHeight")}`, { size: 7 }) +
      sm(k, 8, 132, `Power: ${v("powerRead")} · ${v("climb")} over ${v("climbTime")} s`, { color: "#ddd" }) +
      k.caption(`${v("setting")} angle`)
    );
  });

  /* Angles grouped: a strip of thumbnails in the family's style, how pure it is and where it switches. */
  W.look("angleFamily", (v, k) => {
    const fam = idx(v, "setting");
    const pur = v.p("purity");
    const mix = v.p("mixRatio");
    const rest = v.p("restlessness");
    const n = [6, 1, 12, 6][fam];
    const main = Math.max(0.05, mix * 0.5 + pur * 0.5);
    const sw = idx(v, "switchPoint");
    const out = [];
    const W0 = 300;
    for (let i = 0; i < n; i++) {
      const w = W0 / n;
      const x = 10 + i * w;
      const other = k.rnd(i + 5) > main;
      const rot = fam === 3 || other ? (k.rnd(i) - 0.5) * 14 * (0.3 + rest) : (k.rnd(i) - 0.5) * 6 * rest;
      const hh = fam === 2 ? 20 + k.rnd(i) * 30 : 40;
      const ph = (fam === 1 ? 0.8 : [0.9, 0.55, 0.3][i % 3]) * hh;
      out.push(`<g transform="rotate(${R(rot)} ${R(x + w / 2)} 50)">${box(x + 1, 50 - hh / 2, w - 2, hh, other ? "#3d3d48" : "#5b6f8f", "#1c1712")}${fig(k, x + w / 2, 50 + hh / 2 - 2, ph)}</g>`);
    }
    const take = Math.log(v.n("longestTake")) / Math.log(600);
    return (
      k.bg(SKY) +
      `<clipPath id="cw-af-clip"><rect x="8" y="16" width="304" height="70"/></clipPath><g clip-path="url(#cw-af-clip)">${out.join("")}</g>` +
      (sw ? ln(10 + (sw === 1 ? 0.5 : 0.85) * 300, 12, 10 + (sw === 1 ? 0.5 : 0.85) * 300, 92, "#ff6b6b", 2, "4 3") + sm(k, 14 + (sw === 1 ? 0.5 : 0.85) * 300, 100, "style changes", { color: "#ff8a8a", size: 7.5, anchor: "end" }) : "") +
      k.meter({ x: 10, y: 112, w: 140, label: `Main style ${v("mixRatio")}% · ${v("purity")}`, p: main, color: "#5b6f8f" }) +
      sm(k, 170, 109, `Longest take ${v("longestTake")} s`, { size: 8 }) +
      box(170, 112, 140, 8, "#34343c", null, 4) +
      box(170, 112, Math.max(3, take * 140), 8, "#ffd166", null, 4) +
      sm(k, 10, 146, `Camera feels ${v("restlessness")}`, { color: "#ddd" }) +
      k.caption(`${v("setting")} (${["many angles of one scene", "one long take", "quick short pieces", "a camera in hand"][fam]})`)
    );
  });

  /* When the angle changes: two people talking, their lines as blocks, and where the cuts land. */
  W.look("angleChange", (v, k) => {
    const mode = idx(v, "setting");
    const lead = v.n("lead");
    const react = idx(v, "onReaction");
    const mid = idx(v, "midWord");
    const tight = idx(v, "tighten");
    const cpl = v.n("cutsPerLine");
    const hold = v.n("reactionHold");
    const lines = [];
    let x = 10;
    for (let i = 0; i < 4; i++) {
      const w = 60 * (1 - (tight - 1) * i * 0.08);
      lines.push([x, w, i % 2]);
      x += w + 4 + (react && i % 2 === 0 ? hold * 3 : 0);
    }
    const cuts = [];
    lines.forEach(([lx, w], i) => {
      if (mode !== 1) cuts.push(lx + lead * 4);
      for (let c = 1; c < cpl; c++) cuts.push(lx + (c / Math.ceil(cpl)) * w);
      if (mid && i % (mid === 1 ? 3 : 1) === 0) cuts.push(lx + w * 0.45);
      if (mode === 1 || mode === 2) cuts.push(lx + w * 0.7);
    });
    const listen = lines.filter(([, , who], i) => react && who === 0 && (react === 2 || i === 0)).map(([lx, w]) => box(lx + w + 2, 98, hold * 3 + 1, 14, "#81b29a", "#1c1712", 2, 0.8));
    return (
      k.bg(SKY) +
      k.face({ x: 80, y: 44, r: 26, mood: 0.2, look: 1, mouth: 0.4, color: "#f0c8a0" }) +
      k.face({ x: 240, y: 44, r: 26, mood: 0, look: -1, color: "#e0b090" }) +
      sm(k, 70, 84, "A", { size: 9 }) +
      sm(k, 236, 84, "B", { size: 9 }) +
      lines.map(([lx, w, who]) => box(lx, 98, w, 14, who ? "#a5574a" : "#4a6fa5", "#1c1712", 3)).join("") +
      listen.join("") +
      (mode === 3 ? sm(k, 10, 130, "Locked: the angle never changes", { color: "#ff8a8a" }) : "") +
      cuts.map((c) => ln(c, 92, c, 118, mode === 3 ? "#555" : "#ffd166", 2, mode === 3 ? "2 2" : null)).join("") +
      (mode === 1 || mode === 2 ? lines.map(([lx, w]) => k.label({ x: lx + w * 0.7, y: 128, text: "✦", size: 9, color: "#e07a5f" })).join("") : "") +
      sm(k, 10, 146, `Cuts ${lead < 0 ? -lead + " beats early" : lead > 0 ? lead + " beats late" : "on time"} · ${cpl} per line · listener ${hold} s`, { color: "#ddd" }) +
      k.caption(`Changes ${v("setting")}, cuts inside a sentence ${v("midWord")}, ${v("tighten")}`)
    );
  });

  /* Angle matched to the action: a glass falls; how big it is in frame and when the camera gets there. */
  W.look("angleToAction", (v, k) => {
    const how = v.p("setting");
    const str = v.n("strength") / 5;
    const as = v.n("actionSize");
    const gs = 8 + Math.sqrt(as / 300) * 60 * (how < 0.4 ? 1 + str * 0.5 : how > 0.6 ? 0.6 : 1);
    const inner = room(k, 130, "#3a3640", "#2a2520") + (how > 0.6 ? fig(k, 70, 160, 120, { look: -1, mood: 0 }) : "") + `<g transform="translate(160 90) rotate(${how > 0.6 ? 0 : 35})"><path d="M${-gs / 2} ${-gs} L${gs / 2} ${-gs} L${gs * 0.35} ${gs} L${-gs * 0.35} ${gs} Z" fill="#9fd3ff" stroke="#1c1712" stroke-width="2" opacity="0.85"/></g>` + (how < 0.4 ? [0, 1, 2].map((i) => ln(160 + gs + 10, 70 + i * 16, 160 + gs + 30 + str * 30, 70 + i * 16, "#fff", 2)).join("") : "");
    const lead = v.n("actionLead");
    const ant = v.p("anticipate") * 2 - 1;
    const cx = 110 + (lead + ant * 1.5) * 20;
    const ins = Math.round(v.p("insertShare") * 8);
    const big = idx(v, "bigActions");
    const acts = [0.3, 0.6, 1, 0.4, 0.8, 0.35];
    const maxA = Math.max(...acts);
    return (
      k.bg(SKY) +
      shot(k, "cw-ata-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, "Actions that earn it", { size: 7.5 }) +
      acts.map((a, i) => k.dot({ x: 228 + i * 15, y: 34, r: 2 + a * 4, color: big === 0 || (big === 1 && a >= 0.6) || (big === 2 && a === maxA) ? "#ffd166" : "#555" })).join("") +
      sm(k, 222, 56, `Matched ${v("share")}%`, { size: 7.5 }) +
      k.pie({ x: 296, y: 53, r: 8, p: v.p("share") }) +
      sm(k, 222, 76, "Close-ups of hands", { size: 7.5 }) +
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => box(222 + i * 10.5, 82, 9, 12, i < ins ? "#e07a5f" : "#3d3d48", null, 2)).join("") +
      sm(k, 222, 112, `Strength ${v("strength")}`, { size: 7.5 }) +
      k.meter({ x: 222, y: 116, w: 84, p: str }) +
      sm(k, 222, 146, `${as}% of frame`, { size: 7.5 }) +
      track(k, 10, 140, 200, "") +
      k.label({ x: 110, y: 156, text: "✦ action", size: 8, color: "#e07a5f" }) +
      ln(k.clamp(cx, 10, 210), 132, k.clamp(cx, 10, 210), 152, "#ffd166", 2) +
      sm(k, 10, 132, `Cut ${v("anticipate")}, ${lead} s`, { size: 7.5 }) +
      k.caption(`The angle ${v("setting")}`)
    );
  });

  /* Hold: shots in a minute of film, which one is longest, and the hold after the last word. */
  W.look("shotDuration", (v, k) => {
    const sec = v.n("seconds") * [0.6, 1, 1.6][idx(v, "setting")];
    const n = Math.max(1, Math.min(40, Math.round(60 / Math.max(0.5, sec))));
    const vr = v.p("variety");
    const gr = (v.p("growth") - 0.5) * 2 + v.n("holdChange") / 50;
    const at = idx(v, "longestAt");
    const L = [];
    for (let i = 0; i < n; i++) {
      const x = n > 1 ? i / (n - 1) : 0.5;
      let l = 1 + gr * (x - 0.5) * 1.2;
      l *= 1 + vr * (k.rnd(i + 7) * 2 - 1) * 0.8;
      l *= 1 + 1.2 * Math.exp(-Math.pow((x - [0, 0.5, 1][at]) / 0.12, 2));
      L.push(Math.max(0.1, l));
    }
    const hp = v.p("holdPast");
    const pl = v.n("pastLine");
    return (
      k.bg(SKY) +
      sm(k, 10, 14, `A minute of film: ${n} shots of about ${R(sec)} s`, { color: "#ddd", size: 9 }) +
      shots(L, 10, 22, 300, 36) +
      sm(k, 10, 78, "One shot: the line, then the hold", { size: 8 }) +
      box(10, 86, 120, 22, "#4a6fa5", "#1c1712", 3) +
      k.label({ x: 70, y: 101, text: "“…and that's all.”", size: 8, color: "#fff" }) +
      box(130, 86, Math.max(2, pl * 16), 22, "#81b29a", "#1c1712", 3) +
      sm(k, 134 + pl * 16, 101, `+${pl} s`, { size: 8 }) +
      sm(k, 10, 126, "Comfort", { size: 7.5 }) +
      box(60, 120, 250, 6, "#34343c", null, 3) +
      box(60, 120, 100, 6, "#81b29a", null, 3) +
      ln(60 + 60 + hp * 170, 114, 60 + 60 + hp * 170, 132, hp > 0.6 ? "#ff6b6b" : "#ffd166", 2.5) +
      sm(k, 10, 146, `Holds: ${v("variety")}, ${v("growth")} (${v("holdChange")}%/min)`, { color: "#ddd" }) +
      k.caption(`${v("setting")} holds, ${v("holdPast")}, longest on ${v("longestAt")}`)
    );
  });

  /* Camera move: how the camera travels (arrows on the shot) and its path from above, with its speed over time. */
  W.look("cameraMove", (v, k) => {
    const kind = v("setting");
    const none = kind === "none";
    const len = (14 + v.n("distance") * 6) * (0.6 + Math.log10(1 + v.n("travelM")) * 0.6);
    const dir = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1], "toward them": [0, 0], away: [0, 0] }[v("direction")] || [1, 0];
    const turn = v.n("turnDeg");
    const rise = v.n("riseM");
    const sym = {
      pan: "↔",
      tilt: "↕",
      "push in": "→●",
      "pull out": "●→",
      track: "⇢",
      crane: "⤒",
      zoom: "⊕",
      orbit: "↻",
    }[kind];
    const rv = idx(v, "reveal");
    const revealPic = [k.label({ x: 160, y: 60, text: "(nothing new)", size: 14, color: "#888" }), k.text({ x: 260, y: 70, text: "✦", size: 30, color: "#ffd166" }), fig(k, 270, 160, 100, { color: "#a5574a", mood: 0.4 }), k.text({ x: 250, y: 70, text: "⌂⌂⌂", size: 34, color: "#cdbfa8" })][rv];
    const toward = /toward/.test(v("direction"));
    const away = /away/.test(v("direction"));
    const inner =
      room(k, 125) +
      fig(k, 120, 165, 110, { color: "#4a6fa5" }) +
      revealPic +
      `<g opacity="${none ? 0.35 : 1}">` +
      (toward || away ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => k.arrow({ x1: 160 + a * (away ? 20 : 80), y1: 90 + b * (away ? 12 : 50), x2: 160 + a * (away ? 20 + len : 80 - len), y2: 90 + b * (away ? 12 + len * 0.6 : 50 - len * 0.6), w: 4 })).join("") : k.arrow({ x1: 160, y1: 90, x2: 160 + dir[0] * len * 3, y2: 90 + dir[1] * len * 2, w: 6 })) +
      (turn ? `<path d="M40 40 A30 30 0 ${turn > 180 ? 1 : 0} 1 ${R(40 + Math.sin(k.rad(turn)) * 30)} ${R(70 - Math.cos(k.rad(turn)) * 30)}" fill="none" stroke="#9fd3ff" stroke-width="4"/>` : "") +
      (rise ? k.arrow({ x1: 290, y1: 90, x2: 290, y2: 90 - rise * 7, w: 4, color: "#81b29a" }) : "") +
      `</g>`;
    const s0 = v("start") === "already moving" ? 0.8 : 0;
    const e = idx(v, "end");
    const sp = [[0, s0], [0.25, 0.8], [0.75, 0.8], e === 0 ? [1, 0] : e === 1 ? [0.76, 0] : [1, 0.8]];
    if (e === 1) sp.push([1, 0]);
    const mt = v.n("moveTime");
    return (
      k.bg(SKY) +
      shot(k, "cw-cm-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, none ? "No move" : `${kind} ${sym || ""}`, { color: "#fff", size: 9, weight: 700 }) +
      sm(k, 222, 32, `${v("travelM")} m · ${turn}° · ${rise > 0 ? "+" : ""}${rise} m`, { size: 7.5 }) +
      sm(k, 222, 52, "Speed over the move", { size: 7.5 }) +
      box(222, 56, 84, 36, "#26262c", "#3a3a44") +
      poly(sp.map(([t, s]) => [224 + t * 80, 90 - s * 30]), "#ffd166", 2) +
      sm(k, 222, 104, `${v("start")} → ${v("end")}`, { size: 7 }) +
      sm(k, 222, 120, `Lasts ${mt} s`, { size: 7.5 }) +
      k.clock({ x: 296, y: 116, r: 7, p: mt / 60 }) +
      sm(k, 222, 140, `Why: ${v("motivated")}`, { size: 7 }) +
      sm(k, 8, 134, `Goes ${v("direction")}`, { color: "#ddd" }) +
      sm(k, 8, 148, `Reveals ${v("reveal")}`, { color: "#ddd" }) +
      k.caption(none ? "Camera holds still" : `Camera ${kind}s ${v("direction")}`)
    );
  });

  /* Move follows: the camera trailing them from above, how tightly and how big they stay. */
  W.look("moveFollows", (v, k) => {
    const who = idx(v, "setting");
    const tight = v.n("tightness") / 5;
    const lead = v.n("lead");
    const gap = v.n("gap");
    const sideOff = { behind: 0, beside: -70, "in front": -160 }[v("side")] || 0;
    const ang = k.rad(v.n("sideAngle") + sideOff);
    const r0 = 14 + Math.sqrt(gap / 30) * 50;
    const path = [];
    for (let i = 0; i <= 12; i++) path.push([20 + i * 14, 100 - Math.sin(i / 2) * 18]);
    const sp0 = path[k.clamp(8 + lead, 0, 12)];
    const sx = sp0[0];
    const sy = sp0[1];
    const cx = sx + Math.cos(ang) * r0;
    const cy = sy - Math.sin(ang) * r0;
    const cpath = path.map(([x, y], i) => [x - 10 + (1 - tight) * Math.sin(i * 1.7) * 10, y + 18 + (1 - tight) * Math.cos(i) * 8]);
    const lose = idx(v, "loseThem");
    const fs = v.n("frameSize");
    const keep = idx(v, "keepSize");
    const thumbs = [0, 1, 2]
      .map((i) => {
        const shrink = keep === 2 ? 1 : keep === 1 ? 1 - i * 0.1 : 1 - i * 0.3;
        const hh = Math.min(48, 6 + (fs / 200) * 40) * shrink;
        return box(222 + i * 30, 104, 26, 30, "#2a2a30", "#888") + fig(k, 235 + i * 30, 104 + 15 + hh / 2, hh, { color: "#4a6fa5" });
      })
      .join("");
    const subj = who === 0 ? k.dot({ x: sx, y: sy, r: 6, color: "#4a6fa5" }) : who === 1 ? box(sx - 6, sy - 6, 12, 12, "#e07a5f", "#1c1712", 2) : k.label({ x: sx, y: sy + 4, text: "∅", size: 12, color: "#888" });
    return (
      k.bg(SKY) +
      box(6, 6, 200, 150, "#1d1d22", "#3a3a44", 6) +
      poly(path, "#4a6fa5", 2, null, "4 3") +
      poly(cpath, "#ffd166", 1 + tight * 2) +
      (lose ? `<rect x="${R(sx + 14)}" y="${R(sy - 20)}" width="${10 + lose * 8}" height="40" fill="#555"/>` : "") +
      subj +
      ln(sx, sy, cx, cy, "#888", 1, "2 2") +
      k.cam({ x: cx, y: cy, dir: (Math.atan2(sy - cy, sx - cx) * 180) / Math.PI, s: 0.55 }) +
      sm(k, 12, 20, `${gap} m away, ${v("side")} (${v("sideAngle")}°)`, { size: 7.5 }) +
      sm(k, 12, 150, `Camera ${lead < 0 ? "lags " + -lead : lead > 0 ? "leads " + lead : "even"} beats · slips away ${v("loseThem")}`, { size: 7.5 }) +
      side() +
      sm(k, 222, 18, "Tightness", { size: 7.5 }) +
      k.meter({ x: 222, y: 24, w: 84, p: tight }) +
      sm(k, 222, 96, `Their size ${fs}%`, { size: 7.5 }) + sm(k, 222, 148, v("keepSize"), { size: 7.5 }) +
      thumbs +
      k.caption(`Following ${v("setting") === "neither" ? "no one" : "the " + v("setting")}`)
    );
  });

  /* Object: the thing itself, how big, how strange, what it means and how often it shows up. */
  function objIcon(k, kind, x, y, s, col) {
    const c = col || "#e07a5f";
    if (kind === "door") return box(x - 14 * s, y - 30 * s, 28 * s, 60 * s, c, "#1c1712") + k.dot({ x: x + 8 * s, y, r: 2.5 * s, color: "#ffd166" });
    if (kind === "screen") return box(x - 28 * s, y - 18 * s, 56 * s, 36 * s, "#9fd3ff", "#1c1712", 3) + box(x - 4 * s, y + 18 * s, 8 * s, 8 * s, "#555");
    if (kind === "vehicle") return box(x - 34 * s, y - 6 * s, 68 * s, 18 * s, c, "#1c1712", 5) + box(x - 18 * s, y - 18 * s, 34 * s, 14 * s, c, "#1c1712", 4) + k.dot({ x: x - 20 * s, y: y + 12 * s, r: 7 * s, color: "#222" }) + k.dot({ x: x + 20 * s, y: y + 12 * s, r: 7 * s, color: "#222" });
    if (kind === "food") return `<circle cx="${R(x)}" cy="${R(y)}" r="${R(18 * s)}" fill="#c0392b" stroke="#1c1712" stroke-width="2"/>` + ln(x, y - 18 * s, x + 4 * s, y - 26 * s, "#5d4a3a", 3);
    return box(x - 12 * s, y - 16 * s, 24 * s, 32 * s, c, "#1c1712", 3) + `<path d="M${R(x + 12 * s)} ${R(y - 8 * s)} q${R(10 * s)} ${R(8 * s)} 0 ${R(16 * s)}" fill="none" stroke="#1c1712" stroke-width="2"/>`;
  }
  W.look("objectKind", (v, k) => {
    const s = (0.8 + v.n("size") * 0.25) * (0.6 + (Math.log10(v.n("realSize")) / Math.log10(2000)) * 0.8);
    const imp = v.n("importance") / 5;
    const fam = idx(v, "familiar");
    const mean = idx(v, "meaning");
    const ret = idx(v, "returns");
    const app = v.n("appearances");
    const marks = [];
    for (let i = 0; i < Math.min(30, app); i++) marks.push(ln(12 + (i / Math.max(1, Math.min(30, app) - 1 || 1)) * (ret === 0 ? 40 : ret === 1 ? 120 : 196), 140, 12 + (i / Math.max(1, Math.min(30, app) - 1 || 1)) * (ret === 0 ? 40 : ret === 1 ? 120 : 196), 152, "#ffd166", 2));
    return (
      k.bg(SKY) +
      room(k, 110, "#3a3640", "#2a2520") +
      (imp > 0 ? k.beam({ x: 105, y: 0, dir: 90, len: 120, spread: 20 + imp * 30, color: "#fff3c4", alpha: imp * 0.4 }) : "") +
      `<g transform="rotate(${fam === 1 ? 12 : fam === 2 ? -18 : 0} 105 80)">${objIcon(k, v("setting"), 105, 80, s, fam === 2 ? "#6a4a8a" : null)}${fam === 2 ? k.dot({ x: 98, y: 76, r: 2, color: "#fff" }) + k.dot({ x: 112, y: 76, r: 2, color: "#fff" }) : ""}</g>` +
      (mean ? k.bubble({ x: 170, y: 30, w: 50, h: 26, text: ["", "🔍 ?", "♡ …", "⚠ !"][mean], tail: -20 }) : "") +
      side(4, 126) +
      sm(k, 222, 18, `Real size ${v("realSize")} cm`, { size: 7.5 }) +
      sm(k, 222, 34, `Importance ${v("importance")}`, { size: 7.5 }) +
      k.meter({ x: 222, y: 38, w: 84, p: imp }) +
      sm(k, 222, 64, `On screen ${v("screenShare")}%`, { size: 7.5 }) +
      k.pie({ x: 264, y: 86, r: 12, p: v.p("screenShare") }) +
      sm(k, 222, 118, `${v("familiar")} · ${v("meaning")}`, { size: 7 }) +
      sm(k, 10, 134, `Appears ${app} times, ${v("returns")}`, { size: 7.5, color: "#ddd" }) +
      box(10, 144, 200, 3, "#34343c") +
      marks.join("") +
      k.caption(`The object: a ${v("setting")}`)
    );
  });

  /* Object in frame: where it comes from, how fast, where it stops, and its warning. */
  W.look("objectEnter", (v, k) => {
    const mode = v("setting");
    const sd = v("side");
    const lx = 10 + (v.n("landX") / 100) * 300;
    const ly = 170 - (v.n("landY") / 100) * 160;
    const tg = idx(v, "landsWhere");
    const tx = [lx, 110, 160][tg] * (tg ? 0.5 : 1) + (tg ? lx * 0.5 : 0);
    const ty = [ly, 110, 90][tg] * (tg ? 0.5 : 1) + (tg ? ly * 0.5 : 0);
    const from = { left: [-30, ty], right: [350, ty], top: [tx, -30], bottom: [tx, 210], "toward the lens": [tx, ty] }[sd];
    const toLens = sd === "toward the lens";
    const sp = idx(v, "speed");
    const out = mode === "leaves";
    const a = out ? [tx, ty] : from;
    const b = out ? from : [tx, ty];
    const lines = [0, 1, 2].slice(0, sp + 1).map((i) => ln(tx - (b[0] - a[0]) * 0.15 * (i + 1) * 0.6, ty - (b[1] - a[1]) * 0.15 * (i + 1) * 0.6 + (i - 1) * 6, tx - (b[0] - a[0]) * 0.05, ty - (b[1] - a[1]) * 0.05 + (i - 1) * 6, "#fff", 1.5));
    const warn = idx(v, "warning");
    const inner =
      room(k, 130) +
      fig(k, 110, 165, 100, { color: "#4a6fa5", look: 1, mood: warn ? -0.3 : 0 }) +
      (warn === 2 ? `<ellipse cx="${R(tx)}" cy="150" rx="40" ry="8" fill="#000" opacity="0.5"/>` : "") +
      (warn === 1 ? k.speaker({ x: 290, y: 30, s: 0.8, level: 0.7 }) : "") +
      (mode === "stays" ? "" : k.arrow({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], w: 3, color: "#ffd166" })) +
      (mode === "stays" ? "" : lines.join("")) +
      (toLens ? k.ring({ x: tx, y: ty, r: 30, color: "#ffd166", dash: "4 4" }) : "") +
      `<circle cx="${R(tx)}" cy="${R(ty)}" r="${toLens ? 18 : 12}" fill="#e07a5f" stroke="#1c1712" stroke-width="2"/>`;
    const ct = v.n("crossTime");
    const wt = v.n("warnTime");
    return (
      k.bg(SKY) +
      shot(k, "cw-oe-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `${mode === "leaves" ? "Leaves to" : mode === "stays" ? "Stays (from)" : "From"} ${sd}`, { size: 7.5 }) +
      sm(k, 222, 36, `Speed: ${v("speed")}`, { size: 7.5 }) +
      track(k, 222, 60, 84, "Warning, then arrival") +
      box(222, 60, Math.min(84, wt * 4.2), 5, "#9fd3ff", null, 2.5) +
      box(222 + Math.min(84, wt * 4.2), 60, Math.max(2, Math.min(84 - wt * 4.2, ct * 4.2)), 5, "#ffd166", null, 2.5) +
      sm(k, 222, 78, `${wt} s + ${ct} s`, { size: 7.5 }) +
      sm(k, 222, 98, `Ends at ${v("landX")}%, ${v("landY")}%`, { size: 7.5 }) +
      sm(k, 222, 112, v("landsWhere"), { size: 7.5 }) +
      sm(k, 222, 132, v("warning"), { size: 7.5, color: "#9fd3ff" }) +
      k.caption(`Object ${mode}`)
    );
  });

  /* Number of people: the main cast, the extras behind them, and people coming or going. */
  W.look("peopleCount", (v, k) => {
    const n = Math.round(v.n("setting"));
    const bgN = Math.round(v.n("background"));
    const dens = [1.6, 1, 0.5][idx(v, "density")];
    const sp = 6 + Math.sqrt(v.n("spacing")) * 14;
    const ds = v.n("depthSpread");
    const mo = idx(v, "extrasMotion");
    const foc = idx(v, "focusOnOne");
    const ex = [];
    for (let i = 0; i < bgN; i++) {
      const d = k.rnd(i + 11) * Math.min(1, ds / 20 + 0.1);
      const x = 160 + (k.rnd(i + 3) - 0.5) * 300 * dens;
      const h = 40 * (1 - d * 0.6);
      ex.push(`<g opacity="0.7">${fig(k, x, 120 + h * 0.3 - d * 20, h, { color: "#6b6b75", walk: mo / 3, lean: mo === 3 ? (k.rnd(i) - 0.5) * 30 : 0 })}</g>`);
      if (mo >= 2) ex.push(ln(x - 10, 100, x - 18 - mo * 3, 100, "#999", 1));
    }
    const main = [];
    for (let i = 0; i < n; i++) {
      const x = 160 + (i - (n - 1) / 2) * sp;
      main.push(`<g opacity="${foc && i !== 0 ? (foc === 2 ? 0.45 : 0.75) : 1}">${fig(k, x, 152, 80, { color: ["#4a6fa5", "#a5574a", "#81b29a", "#d8a531"][i % 4], mood: 0.2 })}</g>`);
    }
    const arr = idx(v, "arrivals");
    const to = v.n("turnover");
    const arrows = arr === 1 ? "" : [0, 1].map((i) => k.arrow({ x1: arr === 2 ? (i ? 330 : -10) : i ? 280 : 40, y1: 140, x2: arr === 2 ? (i ? 280 : 40) : i ? 330 : -10, y2: 140, w: 3, color: arr === 2 ? "#7fe07f" : "#ff6b6b" })).join("");
    const spot = foc ? k.beam({ x: 160 - ((n - 1) / 2) * sp, y: 0, dir: 90, len: 170, spread: 22, color: "#fff3c4", alpha: foc * 0.2 }) : "";
    return (
      k.bg(SKY) +
      room(k, 120, "#3a3640", "#2a2520") +
      ex.join("") +
      spot +
      main.join("") +
      arrows +
      sm(k, 6, 14, `${n} in the scene, ${bgN} extras (${v("density")}, ${v("extrasMotion")})`, { color: "#eee" }) +
      sm(k, 6, 26, `${v("spacing")} m apart · ${ds} m deep · ${to} in/out a minute`, { color: "#ccc", size: 7.5 }) +
      k.caption(`${v("arrivals")} · one face stands out: ${v("focusOnOne")}`)
    );
  });

  /* Eyelines: two faces and where their looks go. */
  W.look("eyeline", (v, k) => {
    const m = idx(v, "setting");
    const av = idx(v, "avoid");
    const toLens = idx(v, "toLens");
    const tgt = v("lookTarget");
    const off = v.n("offLens");
    const tilt = v.n("lookTilt");
    const hold = v.n("hold");
    const ay = 70;
    const tg = { "the other person": [240, ay], "the lens": [160, 150], "an object": [160, 30], "the floor": [140, 150], nothing: [40, 20] }[tgt];
    const aLook = tgt === "the other person" ? (av ? -1 : 1) : tg[0] > 80 ? 0.6 : -1;
    const bLook = av === 2 ? 1 : m >= 1 ? -1 : 0.6;
    const strong = [0.25, 0.5, 0.8, 1][m];
    const ex = 80 + 30;
    const ty = tg[1] + tilt * 1.2;
    const lens = k.cam({ x: 160 + Math.sin(k.rad(off)) * 40, y: 112, dir: -90, s: 0.6, color: toLens ? "#e2e2e2" : "#777" });
    const bf = v("breakFirst");
    const wr = v.p("warming") * 2 - 1;
    const lpm = v.n("looksPerMin");
    const ticks = [];
    for (let i = 0; i < Math.min(30, lpm); i++) ticks.push(ln(14 + (i / Math.max(1, Math.min(30, lpm))) * 190, 156, 14 + (i / Math.max(1, Math.min(30, lpm))) * 190, 150 - (0.5 + wr * (i / Math.max(1, lpm) - 0.5)) * 8, "#ffd166", 1.5));
    return (
      k.bg(SKY) +
      k.face({ x: 80, y: ay + tilt * 0.3, r: 30, look: aLook, mood: 0.1, brows: av ? -0.5 : 0, mouth: v("speaking") === "speaking" ? 0.6 : 0 }) +
      (v.slider("speaking") ? (v("speaking") === "speaking" ? k.bubble({ x: 160, y: 50, w: 70, h: 18, text: "talking now", size: 9, tail: -40 }) : sm(k, 52, 112, "listening", { size: 7.5, color: "#9fd3ff" })) : "") +
      k.face({ x: 240, y: ay, r: 30, look: bLook, mood: 0, color: "#e0b090" }) +
      ln(ex, ay, tg[0] - 10, ty, "#ffd166", 1 + strong * 3 + hold * 0.4, av ? "3 4" : m === 0 ? "2 5" : null) +
      (m >= 3 && av < 2 ? ln(240 - 30, ay + 4, ex, ay + 4, "#9fd3ff", 1 + hold * 0.4) : "") +
      (tgt === "an object" ? box(150, 20, 20, 16, "#e07a5f", "#1c1712", 3) : "") +
      lens +
      sm(k, 210, 116, `lens: ${off}° off`, { size: 7.5 }) +
      (toLens ? ln(80, ay + 10, 160 + Math.sin(k.rad(off)) * 40, 100, "#ff6b6b", 1.2 + toLens, "2 2") : "") +
      sm(k, 6, 14, `A looks at ${tgt} (${tilt > 0 ? "up" : tilt < 0 ? "down" : "level"} ${Math.abs(tilt)}°)`, { color: "#ddd" }) +
      sm(k, 6, 26, `Looks last ${hold} s · ${bf} looks away first`, { size: 7.5 }) +
      sm(k, 6, 128, `Into the lens: ${v("toLens")} · avoiding: ${v("avoid")}`, { size: 7.5 }) +
      sm(k, 6, 141, `${lpm} looks a minute, ${v("warming")}`, { size: 7.5 }) +
      ticks.join("") +
      k.caption(v("setting"))
    );
  });

  /* Who is sharp: four things at different depths; one sharp, the rest soft. */
  W.look("focus", (v, k) => {
    const who = idx(v, "setting");
    const dist = idx(v, "distance");
    const soft = [1.2, 2.6, 4.5][idx(v, "blurAround")];
    const guide = idx(v, "guideEye");
    const fm = v.n("focusM");
    const sx = 10 + (v.n("sharpX") / 100) * 300;
    const sy = 170 - (v.n("sharpY") / 100) * 160;
    const things = [
      (s) => fig(k, 0, 0, 100 * s, { color: "#4a6fa5" }),
      (s) => k.hand({ x: 0, y: -20 * s, s: 1.4 * s }),
      (s) => box(-14 * s, -40 * s, 28 * s, 40 * s, "#e07a5f", "#1c1712", 3),
      (s) => box(-20 * s, -110 * s, 40 * s, 110 * s, "#8a6a4a", "#1c1712"),
    ];
    const depthOf = [dist, (dist + 1) % 4, (dist + 2) % 4, (dist + 3) % 4];
    const xs = [70, 130, 200, 265];
    const layers = things
      .map((f, i) => {
        const d = depthOf[(i - who + 4) % 4];
        const sc = 1.3 - d * 0.25;
        const blurred = i !== who;
        return { d, s: `<g transform="translate(${xs[i]} ${150 - d * 10})"${blurred ? ` filter="url(#cw-focus-blur)"` : ""}${blurred && guide === 2 ? ' opacity="0.6"' : ""}>${f(sc)}</g>` };
      })
      .sort((a, b) => b.d - a.d)
      .map((o) => o.s)
      .join("");
    const sp = v.n("speed") / 5;
    const st = v.n("shiftTime");
    return (
      k.bg(SKY) +
      blurDef("cw-focus-blur", soft) +
      room(k, 120, "#3a3640", "#2a2520") +
      layers +
      (guide ? vig("cw-focus-vig", guide * 0.4) : "") +
      `<g transform="translate(${R(sx)} ${R(sy)})"><rect x="-10" y="-10" width="20" height="20" fill="none" stroke="#ffd166" stroke-width="1.5"/>${ln(-14, 0, -6, 0, "#ffd166", 1.5)}${ln(6, 0, 14, 0, "#ffd166", 1.5)}</g>` +
      box(4, 4, 140, 30, "rgba(0,0,0,0.55)", null, 4) +
      sm(k, 10, 16, `Focus at ${fm} m · ${v("distance")}`, { color: "#fff" }) +
      sm(k, 10, 28, `Shifts in ${st} s · speed ${v("speed")}`, { size: 7.5 }) +
      poly([[150, 30], [150 + Math.max(4, 40 - sp * 30 + st * 2), 12], [200, 12]], "#9fd3ff", 2) +
      k.caption(`Sharp: the ${v("setting")} · the rest ${v("blurAround")} · steering ${v("guideEye")}`)
    );
  });

  /* Look of the actor: one face, styled up or worn down. */
  W.look("look", (v, k) => {
    const st = idx(v, "setting");
    const care = v.n("care") / 5;
    const wear = idx(v, "wear");
    const still = idx(v, "stillness");
    const beauty = idx(v, "beauty");
    const skin = k.mix("#c99a78", "#f6d2b4", beauty / 3);
    const hair = ["#5b4636", "#3b2a20", "#b8323a"][st];
    const glow = beauty >= 2 ? `<circle cx="160" cy="85" r="${70 + beauty * 6}" fill="#fff3c4" opacity="${0.08 * beauty}"/>` : "";
    const harsh = beauty === 0 ? `<rect x="160" y="20" width="80" height="140" fill="#000" opacity="0.35"/>` : "";
    const dirt = [];
    for (let i = 0; i < wear * 4; i++) dirt.push(k.dot({ x: 130 + k.rnd(i + 2) * 60, y: 70 + k.rnd(i + 9) * 50, r: 2 + k.rnd(i) * 3, color: "#5a4030" }));
    const sparkle = [];
    for (let i = 0; i < Math.round(care * 5); i++) sparkle.push(k.label({ x: 100 + k.rnd(i + 20) * 120, y: 30 + k.rnd(i + 30) * 30, text: "✦", size: 9, color: "#ffd166" }));
    const shake = still === 0 ? [0, 1, 2].map((i) => ln(95, 70 + i * 12, 82, 70 + i * 12, "#ddd", 1.5)).join("") + [0, 1, 2].map((i) => ln(225, 70 + i * 12, 238, 70 + i * 12, "#ddd", 1.5)).join("") : still === 2 ? k.label({ x: 245, y: 60, text: "■ still", size: 9, color: "#9fd3ff" }) : "";
    return (
      k.bg(SKY) +
      glow +
      `<path d="M${120 - st * 6} 70 Q160 ${18 - st * 10} ${200 + st * 6} 70 L${200 + st * 6} ${90 + st * 10} L${120 - st * 6} ${90 + st * 10} Z" fill="${hair}"/>` +
      k.face({ x: 160, y: 88, r: 46, mood: beauty - 1.5 > 0 ? 0.3 : -0.1, color: skin, eyes: wear >= 2 ? 0.45 : 0.85 }) +
      (st >= 1 ? `<ellipse cx="143" cy="80" rx="7" ry="3" fill="${st === 2 ? "#5b2a7a" : "#8a6a9a"}" opacity="0.5"/><ellipse cx="177" cy="80" rx="7" ry="3" fill="${st === 2 ? "#5b2a7a" : "#8a6a9a"}" opacity="0.5"/>` : "") +
      (wear >= 3 ? ln(140, 60, 150, 100, "#a33", 2) : "") +
      dirt.join("") +
      harsh +
      sparkle.join("") +
      shake +
      sm(k, 8, 150, `Care ${v("care")} · ${v("wear")} · ${v("stillness")}`, { color: "#ddd" }) +
      k.caption(`${v("setting")} look, ${v("beauty")}`)
    );
  });

  /* Focus pull: a near and a far subject, the pull between them and its timing. */
  W.look("rackFocus", (v, k) => {
    const mode = idx(v, "setting");
    const nearM = v.n("nearM");
    const farM = v.n("farM");
    const dir = v.p("direction");
    const sharpNear = dir > 0.6 ? false : true;
    const nx = 70;
    const fx = 170;
    const nh = 140 / Math.sqrt(nearM + 0.3);
    const fh = 140 / Math.sqrt(farM + 0.3);
    const rev = v("revealsWhat");
    const farThing = rev === "a detail" ? k.text({ x: fx, y: 90, text: "✦", size: 20 + 10 / Math.sqrt(farM), color: "#ffd166" }) : fig(k, fx, 110 + fh * 0.3, Math.min(90, fh), { color: rev === "a threat" ? "#8a2a2a" : "#a5574a", mood: rev === "a threat" ? -0.8 : 0.3, walk: rev === "a person arriving" ? 1 : 0 });
    const inner = room(k, 110, "#3a3640", "#2a2520") + `<g${sharpNear ? ' filter="url(#cw-rf-blur)"' : ""}>${farThing}</g>` + `<g${sharpNear ? "" : ' filter="url(#cw-rf-blur)"'}>${fig(k, nx, 180 + nh * 0.15, Math.min(200, nh), { color: "#4a6fa5", look: 1 })}</g>`;
    const pt = v.n("pullTime");
    const sp = v.n("speed") / 5;
    const hes = idx(v, "hesitate");
    const lead = v.n("cueLead");
    const curve = [];
    const t0 = 230 + lead * 6;
    const w = 6 + pt * 4 + (1 - sp) * 24;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const s = t * t * (3 - 2 * t) + (hes ? Math.sin(t * Math.PI * (2 + hes * 2)) * 0.15 * hes * (1 - t) : 0);
      curve.push([t0 + t * w, 72 - s * 30]);
    }
    const cnt = v.n("count");
    const pulls = [];
    for (let i = 0; i < cnt; i++) pulls.push(ln(222 + (i + 0.5) * (84 / Math.max(1, cnt)), 120, 222 + (i + 0.5) * (84 / Math.max(1, cnt)), 132, "#9fd3ff", 2));
    return (
      k.bg(SKY) +
      blurDef("cw-rf-blur", 3) +
      shot(k, "cw-rf-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `Near ${nearM} m · far ${farM} m`, { size: 7.5 }) +
      sm(k, 222, 30, v("direction"), { size: 7.5, color: "#9fd3ff" }) +
      sm(k, 222, 46, "The pull", { size: 7.5 }) +
      ln(t0, 40, t0, 78, "#ff6b6b", 1, "2 2") +
      k.label({ x: 230, y: 88, text: mode === 0 ? "no cue" : mode === 1 ? "“line”" : "✦ action", size: 7, color: "#e07a5f" }) +
      poly([[222, 72], ...curve, [306, curve[curve.length - 1][1]]], mode === 0 ? "#666" : "#ffd166", 2, null, mode === 0 ? "3 3" : null) +
      sm(k, 222, 102, `${pt} s, ${v("hesitate")}`, { size: 7 }) +
      sm(k, 222, 116, `${cnt} pulls a scene`, { size: 7.5 }) +
      box(222, 124, 84, 3, "#34343c") +
      pulls.join("") +
      sm(k, 222, 148, `cue ${lead > 0 ? "+" : ""}${lead} s`, { size: 7.5 }) +
      k.caption(mode === 0 ? "No focus pull (dashed: what one would do)" : `Pulls focus ${v("setting")} to reveal ${rev}`)
    );
  });

  /* Shake: ghost copies of the frame where the shake throws it, and the shake over time. */
  W.look("cameraShake", (v, k) => {
    const amt = v.n("setting") / 5;
    const cm = v.n("shakeCm");
    const deg = v.n("shakeDeg");
    const dir = v("direction");
    const dx = dir === "up and down" ? 0 : 1;
    const dy = dir === "side to side" ? 0 : 1;
    const off = (amt * 8 + cm * 0.8) * 1;
    const scene = room(k, 120) + fig(k, 160, 165, 110, { color: "#4a6fa5" });
    const ghosts = [-1, 1].map((sd, i) => `<g opacity="0.35" transform="translate(${R(sd * off * dx)} ${R(-sd * off * dy * 0.7)}) rotate(${R(sd * deg)} 160 90)">${fig(k, 160, 165, 110, { color: "#9fd3ff" })}</g>`).join("");
    const hz = v.n("shakeHz") + v.n("frequency") * 2;
    const dec = idx(v, "decay");
    const stt = v.n("settleTime");
    const hits = idx(v, "onHits");
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const env = dec === 3 ? 1 : Math.exp(-t * (dec === 0 ? 30 : dec === 1 ? 8 : 2) / (0.4 + stt / 4));
      const spike = hits && (Math.abs(t - 0.55) < 0.02 || (hits === 2 && Math.abs(t - 0.8) < 0.02)) ? 1 : 0;
      const a = Math.min(1, (amt * 0.7 + cm / 30 + 0.1) * Math.max(env, spike));
      pts.push([10 + t * 200, 140 - Math.sin(t * (hz + 1) * 6) * a * 14]);
    }
    return (
      k.bg(SKY) +
      shot(k, "cw-sh-clip", 4, 4, 206, scene + ghosts) +
      side(4, 116) +
      sm(k, 222, 18, `Cause: ${v("cause")}`, { size: 7.5 }) +
      `<g transform="translate(264 48)">${[k.hand({ x: 0, y: 4, s: 0.6 }), k.text({ x: 0, y: 8, text: "BANG", size: 12, color: "#ff6b6b", weight: 700 }), `<circle r="12" fill="none" stroke="#bbb" stroke-width="4" stroke-dasharray="4 3"/>`, `<path d="M-20 10 L-8 -8 L0 2 L8 -10 L20 10 Z" fill="#7d6650"/>`][idx(v, "cause")]}</g>` +
      sm(k, 222, 76, `${cm} cm, ${deg}°`, { size: 7.5 }) +
      sm(k, 222, 90, `${v("shakeHz")} shakes/s`, { size: 7.5 }) +
      sm(k, 222, 104, dir, { size: 7.5, color: "#9fd3ff" }) +
      box(8, 124, 206, 32, "#1d1d22", "#3a3a44", 4) +
      poly(pts, "#ffd166", 1.5) +
      sm(k, 222, 140, `Settles ${v("decay")}`, { size: 7.5 }) +
      sm(k, 222, 152, `in ${stt} s · hits: ${v("onHits")}`, { size: 7 }) +
      k.caption(`Shake ${v("setting")} of 5, speed ${v("frequency")}`)
    );
  });

  /* Time speed: a runner with ghosts showing slow or fast, and the speed over time with the ramp. */
  W.look("speedRamp", (v, k) => {
    const kind = idx(v, "setting");
    const f = v.n("factor");
    const ghosts = [];
    const n = Math.max(2, Math.round(6 / Math.sqrt(f)));
    const gap = 14 * Math.sqrt(f);
    for (let i = n; i >= 0; i--) ghosts.push(`<g opacity="${R(i === 0 ? 1 : 0.5 - i * 0.06, 2)}">${fig(k, 120 - i * gap, 108, 60, { walk: 1, lean: 10, color: "#4a6fa5" })}</g>`);
    const rs = idx(v, "ramp");
    const rt = v.n("rampTime");
    const hold = v.n("holdSlow");
    const ret = idx(v, "returns");
    const lead = v.n("rampLead");
    const peak = 160;
    const lvl = (x) => 130 - k.clamp(Math.log2(x) * 10, -20, 20);
    const base = lvl(1);
    const target = kind === 1 ? base : lvl(kind === 2 ? Math.max(f, 1.5) : kind === 0 ? Math.min(f, 0.7) : f);
    const r0 = peak + lead * 12;
    const rw = 2 + rt * 8 + rs * 6;
    const hw = 10 + hold * 12;
    const pts = [[10, base], [r0 - rw / 2, base], [r0 + rw / 2, target], [r0 + rw / 2 + hw, target]];
    if (ret === 0) pts.push([r0 + rw / 2 + hw + 1, base], [310, base]);
    else if (ret === 1) pts.push([r0 + rw / 2 + hw + 40, base], [310, base]);
    else pts.push([310, target]);
    return (
      k.bg(SKY) +
      room(k, 110, "#3a3640", "#2a2520") +
      ghosts.join("") +
      sm(k, 200, 30, `${f}x`, { size: 22, color: "#ffd166", weight: 700 }) +
      sm(k, 200, 50, ["slow motion", "normal", "fast", "a ramp"][kind], { size: 9, color: "#ddd" }) +
      box(6, 112, 308, 46, "#1d1d22", "#3a3a44", 4) +
      ln(10, base, 310, base, "#555", 1, "3 3") +
      k.label({ x: peak, y: 122, text: `✦ ${v("rampOn")}`, size: 7.5, color: "#e07a5f" }) +
      ln(peak, 124, peak, 156, "#e07a5f", 1, "2 2") +
      poly(pts, "#ffd166", 2) +
      sm(k, 12, 154, `${v("ramp")}, ${rt} s · held ${hold} s · ${v("returns")}`, { size: 7 }) +
      k.caption(`Time ${["slows", "runs normal", "speeds up", "ramps"][kind]} (starts ${lead} s from the peak)`)
    );
  });

  /* The camera lens: field of view, depth of field, and the look of the glass all in one view. */
  W.look("cameraLensLens", (v, k) => {
    const mm = v.n("mm") * [0.7, 1, 1.5][idx(v, "length")];
    const fstop = v.n("fstop");
    const fm = v.n("focusM");
    const zoom = k.clamp(Math.sqrt(mm / 35), 0.5, 3);
    const bgBlur = k.clamp((mm / 50) * (4 / fstop) * [1.6, 1, 0.4][idx(v, "focusDepth")] * (fm < 3 ? 1.3 : 0.7), 0, 6);
    const ch = idx(v, "character");
    const bend = idx(v, "bend");
    const fl = idx(v, "flare");
    const vg = idx(v, "vignette");
    const mb = idx(v, "blur");
    const shake = v.n("shake");
    const grid = [];
    for (let i = 1; i < 6; i++) {
      const x = i * 53;
      grid.push(bend ? `<path d="M${x} 0 Q${x + (x - 160) * 0.15 * bend} 90 ${x} 180" fill="none" stroke="#6a6070" stroke-width="2"/>` : ln(x, 0, x, 180, "#6a6070", 2));
    }
    const bgP = `<g filter="url(#cw-lens-blur)" transform="translate(160 90) scale(${R(zoom, 2)}) translate(-160 -90)">${grid.join("")}${[40, 120, 220, 290].map((x, i) => box(x - 12, 30 + i * 5, 24, 70, "#5b6f8f", "#1c1712")).join("")}</g>`;
    const subj = `<g transform="translate(${R(shake * 2)} ${R(-shake)}) rotate(${R(shake * 0.6)} 160 90)">${fig(k, 160, 176, k.clamp(80 * zoom, 30, 200), { color: "#4a6fa5", mood: 0.3 })}${mb ? [1, 2, 3].slice(0, mb + 1).map((i) => `<g opacity="${0.2}" transform="translate(${-i * 6} 0)">${fig(k, 160, 176, k.clamp(80 * zoom, 30, 200), { color: "#4a6fa5" })}</g>`).join("") : ""}</g>`;
    const flare = fl === 0 ? "" : fl === 1 ? k.dot({ x: 260, y: 30, r: 8, color: "#fff7c0" }) : [0, 1, 2].map((i) => ln(0, 30 + i * 4, 320, 30 + i * 4, "#7fc8ff", 2)).join("");
    const look = ch === 0 ? "" : ch === 1 ? k.tint({ color: "#fff", alpha: 0.12 }) : ch === 2 ? k.tint({ color: "#d8a050", alpha: 0.25 }) : k.tint({ color: "#ff60a0", alpha: 0.2 });
    const br = idx(v, "breathing");
    const fp = idx(v, "focusPull");
    const inner = blurDef("cw-lens-blur", bgBlur) + `<rect width="320" height="180" fill="#2a2a30"/>` + bgP + subj + flare + look + (vg ? vig("cw-lens-vig", vg * 0.45) : "");
    return (
      k.bg(SKY) +
      shot(k, "cw-lens-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `${v("mm")} mm, ${v("length")}`, { size: 8, color: "#fff" }) +
      `<path d="M228 60 L306 ${R(60 - Math.min(28, 22 / zoom))} L306 ${R(60 + Math.min(28, 22 / zoom))} Z" fill="#9fd3ff" opacity="0.3"/>` +
      sm(k, 222, 92, `f/${fstop} · focus ${fm} m`, { size: 7.5 }) +
      sm(k, 222, 104, `Sharp: ${v("focusDepth")}`, { size: 7.5 }) +
      sm(k, 222, 116, `Pull: ${v("focusPull")}`, { size: 7, color: fp ? "#ffd166" : "#999" }) +
      sm(k, 222, 128, `Lens ${v("breathing")}`, { size: 7 }) +
      poly([[222, 146], [264, 146 - (br === 1 ? 6 : 0)], br === 2 ? [264, 140] : [264, 146 - (br === 1 ? 6 : 0)], [306, br === 0 ? 146 : 136]], "#81b29a", 1.5) +
      sm(k, 8, 132, `${v("character")} · edges ${v("bend")}`, { color: "#ddd", size: 7.5 }) +
      sm(k, 8, 146, `blur ${v("blur")} · flare ${v("flare")} · corners ${v("vignette")}`, { color: "#ddd", size: 7.5 }) +
      k.caption(`The lens: ${v("length")}`)
    );
  });

  /* Lens length: wide lenses stretch the room and faces; long lenses flatten and pull the background close. */
  W.look("lensLength", (v, k) => {
    const mm = v.n("mm") * [0.75, 1, 1.4][idx(v, "setting")];
    const z = k.clamp(mm / 50, 0.25, 4);
    const room_ = idx(v, "roomFeel");
    const dist = idx(v, "distortion");
    const fsh = idx(v, "faceShape");
    const conv = [1, 0.6, 0.3, 0.12][room_];
    const lines = [-3, -2, -1, 1, 2, 3].map((i) => ln(160 + i * 25 * conv, 90, 160 + i * 130, 180, "#7d6650", 2)).join("");
    const bldg = [40, 110, 210, 280].map((x, i) => {
      const s = k.clamp(z * 0.5, 0.2, 2.2);
      return box(160 + (x - 160) * s - 14 * s, 90 - 60 * s, 28 * s, 60 * s, "#5b6f8f", "#1c1712");
    }).join("");
    const fx = 1 + [0.25, 0, -0.12][fsh] * 1 + (dist ? 0.08 * dist : 0);
    const face = `<g transform="translate(160 120) scale(${R(fx, 2)} ${R(1 / fx, 2)})">${k.face({ x: 0, y: 0, r: 34, mood: 0.2 })}</g>`;
    const curv = dist ? `<path d="M0 10 Q160 ${10 - dist * 12} 320 10 M0 170 Q160 ${170 + dist * 12} 320 170" stroke="#9fd3ff" stroke-width="2" fill="none"/>` : "";
    const inner = `<rect width="320" height="90" fill="#3a3640"/><rect y="90" width="320" height="90" fill="#2a2520"/>` + lines + bldg + face + curv;
    const sd = v.n("subjectDist");
    const dr = idx(v, "drift");
    const zt = v.n("zoomTime");
    const fov = 30 / z;
    return (
      k.bg(SKY) +
      shot(k, "cw-ll-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `${v("mm")} mm (${v("setting")})`, { size: 8, color: "#fff" }) +
      k.cam({ x: 232, y: 50, dir: 0, s: 0.5 }) +
      `<path d="M240 50 L306 ${R(50 - Math.min(30, fov))} L306 ${R(50 + Math.min(30, fov))} Z" fill="#9fd3ff" opacity="0.3"/>` +
      k.dot({ x: 240 + Math.min(64, Math.sqrt(sd) * 6.4), y: 50, r: 3, color: "#4a6fa5" }) +
      sm(k, 222, 92, `Subject ${sd} m away`, { size: 7.5 }) +
      sm(k, 222, 108, `Room: ${v("roomFeel")}`, { size: 7.5 }) +
      sm(k, 222, 120, `Faces: ${v("faceShape")}`, { size: 7.5 }) +
      sm(k, 222, 136, v("drift"), { size: 7.5 }) +
      (dr !== 1 ? k.arrow({ x1: 264, y1: 146, x2: 264 + (dr ? 1 : -1) * (8 + zt / 2), y2: 146, w: 1.5 }) : "") +
      sm(k, 222, 156, `over ${zt} s`, { size: 7 }) +
      k.caption(`${v("setting")} lens, distortion ${v("distortion")}`)
    );
  });

  /* Dutch / level: the frame tipped over, and its rocking over time. */
  W.look("dutch", (v, k) => {
    const tilted = v("setting") === "tilted";
    const deg = v.n("degrees");
    const sd = { left: -1, either: 0.6, right: 1 }[v("side")];
    const a = deg * (sd || 1);
    const scene = room(k, 120) + fig(k, 160, 165, 110, { color: "#4a6fa5", mood: -0.2 }) + box(240, 30, 40, 40, "#bcd8ef", "#1c1712");
    const inner = `<g transform="rotate(${tilted ? R(a) : 0} 160 90) scale(${tilted ? R(1 + deg / 60, 2) : 1})" transform-origin="160 90">${scene}</g>` + (tilted ? "" : `<rect x="40" y="20" width="240" height="140" fill="none" stroke="#ffd166" stroke-width="3" stroke-dasharray="8 6" transform="rotate(${R(a)} 160 90)"/>`);
    const rb = idx(v, "rockBack");
    const rs = v.n("rockSize");
    const rr = v.n("rockRate");
    const gr = v.p("growth") * 2 - 1;
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const base = (deg / 45) * (1 + gr * (t - 0.5)) + gr * t * 0.3;
      const rock = rb ? Math.sin(t * Math.PI * 2 * (1 + rr / 6) * rb) * (rs / 20 + 0.1) : 0;
      pts.push([222 + t * 84, 110 - base * 20 - rock * 12]);
    }
    const tt = v.n("tipTime");
    return (
      k.bg(SKY) +
      shot(k, "cw-du-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `${deg}° ${v("side")}`, { size: 9, color: "#fff", weight: 700 }) +
      sm(k, 222, 32, v("motivation"), { size: 7.5, color: "#ff8a8a" }) +
      sm(k, 222, 72, `Tilt: ${v("growth")}`, { size: 7.5 }) +
      box(220, 78, 88, 44, "#26262c", "#3a3a44") +
      poly(pts, "#ffd166", 1.5) +
      sm(k, 222, 136, `Rocks ${rs}°, ${rr}/min`, { size: 7.5 }) +
      sm(k, 222, 150, `Tips over in ${tt} s`, { size: 7.5 }) +
      ln(222, 154, 222 + Math.min(84, tt * 4.2), 154, "#81b29a", 2) +
      k.caption(tilted ? `Tilted: ${v("growth")}, rocking ${v("rockBack")}` : "Level (dashed: where a tilt would put it)")
    );
  });

  /* Angles per scene: the camera setups around them from above, and the order the film cuts between them. */
  W.look("angleCount", (v, k) => {
    const n = Math.round(v.n("setting"));
    const spread = v.n("spreadDeg") * [0.5, 1, 1.4][idx(v, "sides")];
    const near = v.n("nearestM");
    const far = v.n("farthestM");
    const vr = v.n("variety") / 5;
    const mx = 100;
    const my = 76;
    const rr = (m) => 10 + Math.sqrt(m / 100) * 58;
    const best = idx(v, "saveBest");
    const cams = [];
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const a = k.rad(-90 + (t - 0.5) * Math.min(360, spread) * (n > 1 ? 1 : 0));
      const d = rr(near + (far - near) * (n > 1 ? (k.rnd(i + 4) * vr + t * (1 - vr)) : 0));
      const x = mx + Math.cos(a) * d;
      const y = my - Math.sin(a) * d * -1;
      cams.push(k.cam({ x, y, dir: (Math.atan2(my - y, mx - x) * 180) / Math.PI, s: 0.4 + vr * 0.25 * k.rnd(i), color: i === n - 1 && best === 2 ? "#ffd166" : i === 0 && best === 0 ? "#ffd166" : i === Math.floor(n / 2) && best === 1 ? "#ffd166" : "#e2e2e2" }) + k.label({ x, y: y + 14, text: String.fromCharCode(65 + i), size: 8, color: "#ccc" }));
    }
    const rs = v.p("returnShare") * 0.6 + idx(v, "reuse") * 0.2;
    const seq = [];
    let next = 0;
    for (let i = 0; i < 14; i++) {
      const back = k.rnd(i + 40) < rs && i > 0;
      const id = back ? Math.floor(k.rnd(i + 3) * Math.min(n, next || 1)) : next % n;
      if (!back) next++;
      seq.push(box(10 + i * 14.5, 140, 13, 12, back ? "#81b29a" : "#5b6f8f", "#1c1712", 2) + k.label({ x: 16.5 + i * 14.5, y: 149, text: String.fromCharCode(65 + id), size: 7, color: "#fff" }));
    }
    const ad = idx(v, "adding");
    return (
      k.bg(SKY) +
      box(6, 6, 200, 120, "#1d1d22", "#3a3a44", 6) +
      k.ring({ x: mx, y: my, r: rr(near), color: "#555", dash: "2 3", w: 1 }) +
      k.ring({ x: mx, y: my, r: rr(far), color: "#555", dash: "2 3", w: 1 }) +
      k.dot({ x: mx, y: my, r: 5, color: "#4a6fa5" }) +
      cams.join("") +
      side(6, 120) +
      sm(k, 222, 20, `${n} setups`, { size: 9, color: "#fff", weight: 700 }) +
      sm(k, 222, 34, `Spread ${v("spreadDeg")}° · ${v("sides")}`, { size: 7.5 }) +
      sm(k, 222, 48, `${near} m to ${far} m`, { size: 7.5 }) +
      sm(k, 222, 62, `Variety ${v("variety")}`, { size: 7.5 }) +
      sm(k, 222, 80, `Best (gold): ${v("saveBest")}`, { size: 7 }) +
      sm(k, 222, 100, v("adding"), { size: 7.5 }) +
      (ad !== 1 ? k.text({ x: 296, y: 104, text: ad ? "+" : "−", size: 14, color: ad ? "#7fe07f" : "#ff6b6b" }) : "") +
      sm(k, 10, 136, `Cut order (green = back to an old setup: ${v("returnShare")}%, ${v("reuse")})`, { size: 7 }) +
      seq.join("") +
      k.caption(`${n} camera angles in the scene`)
    );
  });

  /* Camera carry: tripod, gimbal or hands; how the frame wobbles, drifts and breathes. */
  W.look("cameraCarry", (v, k) => {
    const kind = idx(v, "setting");
    const wob = v.n("wobble") / 5 + v.n("wobbleCm") / 20 + kind * 0.15;
    const wd = v.n("wobbleDeg") + kind;
    const drift = v.n("drift") / 5 + v.n("driftSpeed") / 50;
    const scene = room(k, 120) + fig(k, 160, 165, 110, { color: "#4a6fa5" });
    const ghosts = [1, 2].map((i) => `<g opacity="0.3" transform="translate(${R((i % 2 ? 1 : -1) * wob * 10 + drift * 20 * i)} ${R((i % 2 ? -1 : 1) * wob * 6)}) rotate(${R((i % 2 ? 1 : -1) * wd)} 160 90)">${fig(k, 160, 165, 110, { color: "#9fd3ff" })}</g>`).join("");
    const close = v.p("closeness");
    const inner = scene + ghosts + (close > 0 ? `<ellipse cx="20" cy="200" rx="${R(40 + close * 50)}" ry="${R(50 + close * 60)}" fill="#2b2f3a" opacity="${R(0.3 + close * 0.6, 2)}"/>` : "") + (drift > 0 ? k.arrow({ x1: 220, y1: 30, x2: 220 + drift * 60 + 4, y2: 30, w: 3, color: "#81b29a" }) : "");
    const br = idx(v, "breath");
    const rate = v.n("breathRate");
    const ls = v.p("looseningAt") * 2 - 1;
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const env = Math.max(0.05, 1 + ls * (t - 0.5) * 1.6);
      const breath = br ? Math.sin(t * Math.PI * 2 * (1 + rate / 5)) * br * 0.4 : 0;
      const jit = (k.rnd(i + 2) - 0.5) * wob * 0.8;
      pts.push([10 + t * 200, 140 - (breath + jit) * env * 10]);
    }
    return (
      k.bg(SKY) +
      shot(k, "cw-cc-clip", 4, 4, 206, inner) +
      side(4, 116) +
      sm(k, 222, 18, ["Locked on a tripod", "Smooth on a rig", "Handheld"][kind], { size: 8, color: "#fff", weight: 700 }) +
      k.text({ x: 264, y: 52, text: ["▲", "◎", "✋"][kind], size: 22, color: "#ddd" }) +
      sm(k, 222, 76, `Wobble ${v("wobble")}: ${v("wobbleCm")} cm, ${v("wobbleDeg")}°`, { size: 7 }) +
      sm(k, 222, 90, `Drift ${v("drift")}: ${v("driftSpeed")} cm/s`, { size: 7 }) +
      sm(k, 222, 104, `There-ness ${v("closeness")}%`, { size: 7 }) +
      box(8, 124, 206, 32, "#1d1d22", "#3a3a44", 4) +
      poly(pts, "#ffd166", 1.5) +
      sm(k, 222, 140, `Breathing ${v("breath")}`, { size: 7.5 }) +
      sm(k, 222, 152, `${rate}/min · ${v("looseningAt")}`, { size: 7 }) +
      k.caption(`Camera ${v("setting")}`)
    );
  });

  /* Move speed: the camera beside its subject, travel and turn speed, and the speed curve. */
  W.look("moveSpeed", (v, k) => {
    const lvl = v.n("setting");
    const ms = v.n("metersPerSec");
    const dps = v.n("degPerSec");
    const vs = (v.n("vsSubject") / 100) * [0.7, 1, 1.4][idx(v, "matchesSubject")];
    const subjLen = 40;
    const camLen = Math.min(150, subjLen * vs * (0.6 + lvl * 0.1) + Math.sqrt(ms) * 10);
    const urg = idx(v, "feelsUrgent");
    const ease = idx(v, "easing");
    const peak = v.p("peak");
    const et = v.n("easeTime");
    const curve = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      let s = 1;
      const ein = Math.min(1, t / (0.05 + et / 20));
      const eout = Math.min(1, (1 - t) / (0.05 + et / 20));
      if (ease === 1 || ease === 3) s *= ein;
      if (ease === 2 || ease === 3) s *= eout;
      s *= 0.6 + 0.4 * Math.exp(-Math.pow((t - peak) / 0.2, 2));
      curve.push([10 + t * 200, 150 - s * 28]);
    }
    return (
      k.bg(SKY) +
      box(6, 6, 308, 100, "#1d1d22", "#3a3a44", 6) +
      fig(k, 60, 60, 40, { walk: 1, color: "#4a6fa5", lean: 6 }) +
      k.arrow({ x1: 75, y1: 40, x2: 75 + subjLen, y2: 40, w: 2, color: "#4a6fa5" }) +
      k.cam({ x: 60, y: 86, dir: 0, s: 0.6 }) +
      k.arrow({ x1: 75, y1: 86, x2: 75 + camLen, y2: 86, w: 2 + lvl * 0.6, color: ["#81b29a", "#9fd3ff", "#ffd166", "#ff6b6b"][urg] }) +
      Array.from({ length: Math.round(lvl) }, (_, i) => ln(30 - i * 4, 80 + i * 3, 44 - i * 4, 80 + i * 3, "#888", 1)).join("") +
      `<path d="M270 50 L270 22 A28 28 0 ${dps > 180 ? 1 : 0} 1 ${R(270 + Math.sin(k.rad(Math.min(359, dps))) * 28)} ${R(50 - Math.cos(k.rad(Math.min(359, dps))) * 28)} Z" fill="#9fd3ff" opacity="0.35"/>` +
      sm(k, 236, 96, `turns ${dps}°/s`, { size: 7.5 }) +
      sm(k, 12, 20, `Camera ${ms} m/s · ${v("vsSubject")}% of the subject (${v("matchesSubject")})`, { size: 7.5, color: "#ddd" }) +
      box(6, 112, 210, 46, "#1d1d22", "#3a3a44", 4) +
      poly(curve, "#ffd166", 2) +
      ln(10 + peak * 200, 116, 10 + peak * 200, 156, "#ff6b6b", 1, "2 2") +
      sm(k, 222, 124, v("easing"), { size: 7.5 }) +
      sm(k, 222, 138, `up to speed ${et} s`, { size: 7.5 }) +
      sm(k, 222, 152, `peak at ${v("peak")}%`, { size: 7.5 }) +
      k.caption(`Speed ${lvl} of 5, feels ${v("feelsUrgent")}`)
    );
  });

  /* Move starts on: cues along a scene and the camera moves they set off. */
  W.look("moveOn", (v, k) => {
    const cue = idx(v, "setting");
    const delay = v.n("delay");
    const own = v("cueOwner");
    const ant = v.p("anticipation") * 2 - 1;
    const used = v.p("cuesUsed");
    const rest = v.n("restTime");
    const need = v.n("cueStrength") / 100;
    const cues = [0.4, 0.9, 0.3, 0.7, 1, 0.5, 0.8, 0.6];
    let lastMove = -1e9;
    const out = [];
    cues.forEach((s, i) => {
      const x = 20 + i * 36;
      const who = i % 2 ? "the listener" : "the speaker";
      const counts = cue !== 3 && s >= need && (own === "anyone" || own === who) && k.rnd(i + 8) < used + 0.001 && x - lastMove >= rest * 2;
      out.push(k.label({ x, y: 64, text: ["“…”", "✦", "~", "·"][cue], size: 11, color: i % 2 ? "#a5574a" : "#4a6fa5" }) + box(x - 3, 92 - s * 18, 6, s * 18, i % 2 ? "#a5574a" : "#4a6fa5"));
      if (counts) {
        lastMove = x;
        const mx = x + delay * 6 + ant * 10;
        out.push(k.arrow({ x1: mx, y1: 108, x2: mx + 20, y2: 108, w: 3 }));
      }
    });
    return (
      k.bg(SKY) +
      sm(k, 8, 16, `Cues: ${["lines", "actions", "breaths", "none"][cue]} from ${own}`, { color: "#ddd" }) +
      sm(k, 8, 30, "Strength of each cue", { size: 7.5 }) +
      ln(10, 92 - need * 18, 310, 92 - need * 18, "#ff6b6b", 1, "3 3") +
      sm(k, 8, 98 - need * 18 - 8, `needs ${v("cueStrength")}%`, { size: 7, color: "#ff8a8a" }) +
      ln(10, 92, 310, 92, "#555", 1) +
      out.join("") +
      sm(k, 8, 128, "Camera moves (arrows)", { size: 7.5 }) +
      sm(k, 8, 144, `Delay ${delay} beats, ${v("anticipation")} · ${v("cuesUsed")}% of cues · rest ${rest} s`, { size: 7.5, color: "#ddd" }) +
      k.caption(cue === 3 ? "Moves on no cue" : `Moves start on the ${v("setting")}`)
    );
  });

  /* Object speed: a ball crossing the frame with its blur trail, and how it stops. */
  W.look("objectSpeed", (v, k) => {
    const lvl = v.n("setting");
    const ms = v.n("metersPerSec");
    const ease = idx(v, "easing");
    const trail = idx(v, "blurTrail");
    const vc = idx(v, "versusCamera");
    const imp = idx(v, "impact");
    const ct = v.n("crossTime");
    const st = v.n("stopTime");
    const n = 6;
    const gap = 8 + lvl * 4 + Math.sqrt(ms) * 3;
    const xs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const tt = ease === 1 ? t * t : ease === 2 ? Math.sqrt(t) : t;
      xs.push(30 + tt * gap * (n - 1));
    }
    const endX = Math.min(290, xs[n - 1]);
    const balls = xs.map((x, i) => k.dot({ x: Math.min(290, x), y: 70, r: 9, color: i === n - 1 ? "#e07a5f" : "#e07a5f55" })).join("");
    const smear = trail ? `<rect x="${R(endX - 20 - trail * 30)}" y="${70 - 7}" width="${R(20 + trail * 30)}" height="14" rx="7" fill="#e07a5f" opacity="0.35"/>` : "";
    const camBox = box(endX - 50 - vc * 30, 30, 100, 80, "none", "#ffd166", 0);
    const impact = imp === 0 ? "" : [0, 1, 2, 3, 4].slice(0, imp * 2 + 1).map((i) => ln(endX + 10, 70, endX + 18 + imp * 6, 70 + (i - imp) * 6, "#fff", 1.5)).join("");
    return (
      k.bg(SKY) +
      room(k, 100, "#3a3640", "#2a2520") +
      camBox +
      smear +
      balls +
      impact +
      sm(k, endX - 50 - vc * 30, 26, "frame", { size: 7, color: "#ffd166" }) +
      box(6, 116, 308, 40, "#1d1d22", "#3a3a44", 4) +
      sm(k, 12, 130, `${ms} m/s · crosses in ${ct} s · stops in ${st} s`, { color: "#ddd" }) +
      box(12, 138, Math.max(2, (ct / 20) * 140), 5, "#9fd3ff", null, 2) +
      box(160, 138, Math.max(2, (st / 5) * 140), 5, "#ff6b6b", null, 2) +
      sm(k, 12, 152, `${v("easing")} · ${v("blurTrail")} · ${v("versusCamera")}`, { size: 7.5 }) +
      k.caption(`Speed ${lvl} of 5, ${v("impact")}`)
    );
  });

  /* Depth of field: a band of sharpness on a depth ruler, and what is soft outside it. */
  W.look("depthOfField", (v, k) => {
    const set = idx(v, "setting");
    const f = v.n("fstop");
    const fm = v.n("focusM");
    const sdp = v.n("sharpDepth");
    const blur = k.clamp((1 - set * 0.4) * (6 / Math.sqrt(f)) * (1 - Math.min(0.8, Math.log10(1 + sdp) * 0.4)), 0, 8);
    const subj = idx(v, "subject");
    const soft = idx(v, "softness");
    const iso = v.p("isolation");
    const bokeh = [0, 1, 2, 3, 4, 5].map((i) => (soft === 0 ? `<polygon points="${[0, 1, 2, 3, 4, 5].map((j) => R(40 + i * 45 + Math.cos(j) * 9) + "," + R(30 + (i % 2) * 20 + Math.sin(j) * 9)).join(" ")}" fill="none" stroke="#ffd166" stroke-width="2" opacity="0.6"/>` : `<circle cx="${40 + i * 45}" cy="${30 + (i % 2) * 20}" r="${8 + soft * 4}" fill="#ffd166" opacity="${0.25 - soft * 0.05}"/>`)).join("");
    const sharpBg = subj === 3;
    const inner =
      blurDef("cw-dof-blur", sharpBg ? blur * 0.2 : blur) +
      `<rect width="320" height="180" fill="#2a2a30"/>` +
      `<g filter="url(#cw-dof-blur)">${bokeh}${[30, 120, 230].map((x) => box(x, 60, 40, 70, "#5b6f8f", "#1c1712")).join("")}${subj >= 2 ? "" : fig(k, 240, 175, 120, { color: "#a5574a" })}</g>` +
      (iso > 0 ? `<rect width="320" height="180" fill="#000" opacity="${R(iso * 0.5, 2)}"/>` : "") +
      (subj >= 2 ? fig(k, 240, 175, 120, { color: "#a5574a", look: -1 }) : "") +
      fig(k, 110, 200, 160, { color: "#4a6fa5", mood: 0.3, look: 1 }) +
      (subj === 0 ? k.ring({ x: 117, y: 61, r: 6, color: "#ffd166", w: 1.5 }) : "");
    const ruler = (m) => 222 + Math.min(1, Math.log10(1 + m) / Math.log10(51)) * 84;
    const dp = idx(v, "deepening");
    return (
      k.bg(SKY) +
      shot(k, "cw-dof-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `f/${f}`, { size: 12, color: "#fff", weight: 700 }) +
      sm(k, 222, 36, `Sharp: ${v("subject")}`, { size: 7.5 }) +
      sm(k, 222, 58, "Distance from lens", { size: 7.5 }) +
      box(222, 64, 84, 6, "#34343c", null, 3) +
      box(ruler(Math.max(0, fm - sdp / 2)), 61, Math.max(2, ruler(fm + sdp / 2) - ruler(Math.max(0, fm - sdp / 2))), 12, "#ffd166", null, 2, 0.7) +
      ln(ruler(fm), 58, ruler(fm), 76, "#ff6b6b", 1.5) +
      sm(k, 222, 88, `${fm} m, ${sdp} m deep`, { size: 7.5 }) +
      sm(k, 222, 106, `Blur: ${v("softness")}`, { size: 7.5 }) +
      sm(k, 222, 120, `Cut off ${v("isolation")}%`, { size: 7.5 }) +
      sm(k, 222, 140, v("deepening"), { size: 7.5 }) +
      (dp !== 1 ? k.arrow({ x1: 264, y1: 148, x2: 264 + (dp ? 20 : -20), y2: 148, w: 1.5 }) : "") +
      k.caption(`${v("setting")} depth of field`)
    );
  });

  /* Motion blur: a moving figure smeared by the shutter, and the frames per second as a strip. */
  W.look("motionBlur", (v, k) => {
    const set = idx(v, "setting");
    const sh = v.n("shutter");
    const smear = v.n("smearLength") / 100 + set * 0.15 + sh / 720;
    const dir = idx(v, "direction");
    const ch = idx(v, "choppy");
    const fps = v.n("frameRate");
    const ghosts = [];
    const nG = Math.round(1 + smear * 8);
    for (let i = nG; i >= 1; i--) ghosts.push(`<g opacity="${R(0.5 / i + 0.05, 2)}" transform="translate(${R(-i * (6 + ch * 6))} 0)">${fig(k, 150, 165, 100, { walk: 1, color: "#4a6fa5" })}</g>`);
    const streaks = dir >= 1 ? [0, 1, 2, 3, 4].map((i) => ln(10 + i * 60, 30 + i * 9, 10 + i * 60 + smear * 80, 30 + i * 9, "#5b6f8f", 4)).join("") : [0, 1, 2, 3, 4].map((i) => box(10 + i * 60, 26 + i * 9, 8, 8, "#5b6f8f")).join("");
    const inner = room(k, 120, "#3a3640", "#2a2520") + streaks + (dir !== 1 ? ghosts.join("") : "") + fig(k, 150, 165, 100, { walk: 1, color: "#4a6fa5", lean: 8 });
    const frames = [];
    const nf = Math.round(fps / 6);
    for (let i = 0; i < nf; i++) frames.push(box(10 + i * (200 / nf), 140, Math.max(1, 200 / nf - 1.5), 12, ch >= 3 && i % 3 === 2 ? "#3d3d48" : "#8fb2d8", null, 1));
    return (
      k.bg(SKY) +
      shot(k, "cw-mb-clip", 4, 4, 206, inner) +
      side(4, 120) +
      sm(k, 222, 18, "Shutter", { size: 7.5 }) +
      k.pie({ x: 264, y: 46, r: 18, p: sh / 360, color: "#ffd166" }) +
      sm(k, 222, 80, `${sh}° · smear ${v("smearLength")}%`, { size: 7.5 }) +
      sm(k, 222, 94, `Follows ${v("direction")}`, { size: 7.5 }) +
      sm(k, 222, 108, `In action: ${v("onAction")}`, { size: 7 }) +
      sm(k, 10, 134, `${fps} frames a second (a quarter second shown) · ${v("choppy")}`, { size: 7.5 }) +
      frames.join("") +
      k.caption(`${v("setting")} motion blur`)
    );
  });

  /* Frame shape: the picture's width against its height, and the bars. */
  W.look("aspect", (v, k) => {
    const guide = { "1.33": 1.33, "1.85": 1.85, "2.39": 2.39, custom: 2.0 }[v("setting")] || 1.78;
    const w = v.n("width");
    const H0 = 110;
    const fw = Math.min(300, H0 * w);
    const fh = fw / w;
    const gw = Math.min(300, H0 * guide);
    const bar = (v.n("barSize") / 100) * fh + [0, 4, 12][idx(v, "letterbox")];
    const bc = { black: "#000", white: "#f4f4f4", "a color": "#7a3b8a" }[v("barColor")];
    const x = 160 - fw / 2;
    const y = 74 - fh / 2;
    const op = idx(v, "opensUp");
    const ot = v.n("openTime");
    return (
      k.bg(SKY) +
      `<clipPath id="cw-asp-clip"><rect x="${R(x)}" y="${R(y)}" width="${R(fw)}" height="${R(fh)}"/></clipPath>` +
      `<g clip-path="url(#cw-asp-clip)">${box(0, 0, 320, 180, "#cdbfa8")}${box(0, 100, 320, 80, "#7d6650")}${fig(k, 160, 140, 90, { color: "#4a6fa5" })}${box(0, y, 320, bar, bc)}${box(0, y + fh - bar, 320, bar, bc)}</g>` +
      box(x, y, fw, fh, "none", "#ddd") +
      box(160 - gw / 2, 74 - H0 / 2 / (guide / Math.max(1, guide)) * (H0 * guide > 300 ? 300 / (H0 * guide) : 1), gw, (gw / guide), "none", "#ffd166", 0).replace("/>", ' stroke-dasharray="5 4"/>') +
      (op ? k.arrow({ x1: 160, y1: y + bar + 6, x2: 160, y2: y + 2, w: 2, color: "#7fe07f" }) : "") +
      sm(k, 8, 146, `Picture ${w}:1 (dashed: ${v("setting")}) · bars ${v("barSize")}% ${v("barColor")}`, { color: "#ddd" }) +
      sm(k, 8, 158 - 2, `Opens up at ${v("opensUp")} over ${ot} s`, { size: 7.5 }) +
      box(200, 152, Math.max(2, (ot / 20) * 110), 3, "#7fe07f") +
      k.caption(`Frame ${v("setting")}, bars ${v("letterbox")}`)
    );
  });

  /* Where the subject sits: thirds grid, the subject's place, and the lines and frames around them. */
  W.look("composition", (v, k) => {
    const col = idx(v, "setting");
    const xs = (v.n("xPct") / 100) * 320 * 0.5 + [107, 160, 213][col] * 0.5;
    const hgt = idx(v, "height");
    const ys = 180 - ((v.n("yPct") / 100) * 180 * 0.5 + [60, 90, 120][hgt] * 0.5);
    const part = v("placedPart");
    const ph = part === "their whole body" ? 70 : 150;
    const headY = part === "their face" ? ys : part === "their eyes" ? ys + ph * 0.035 : ys - ph * 0.3;
    const faceDir = xs > 160 ? -1 : 1;
    const lr = v.n("lookRoom");
    const sx = k.clamp(xs - faceDir * lr * 0.6, 20, 300);
    const lead = idx(v, "leading");
    const fif = idx(v, "frameInFrame");
    const sym = idx(v, "symmetry");
    const bal = v.n("balance");
    const leadL = lead ? [0, 320].map((x0) => [0, 180].map((y0) => ln(x0, y0, sx, headY, "#9fd3ff", lead, "6 4")).join("")).join("") : "";
    const subj = part === "an object" ? box(sx - 15, ys - 15, 30, 30, "#e07a5f", "#1c1712", 3) : fig(k, sx, headY + ph * 0.88 + ph * 0.1, ph, { look: faceDir, color: "#4a6fa5" });
    const counter = bal !== 0 ? box(bal < 0 ? 250 : 30, 120 - Math.abs(bal) * 8, 40, Math.abs(bal) * 8 + 10, "#5d4a3a", "#1c1712") : "";
    const mirror = sym ? [40, 280].map((x) => box(x - 10, 40 - sym * 5, 20, 100 + sym * 10, "#5b6f8f", "#1c1712")).join("") : "";
    const frameP = fif ? `<rect x="${R(sx - 50)}" y="${R(headY - 30)}" width="100" height="160" fill="none" stroke="#8a6a4a" stroke-width="${fif * 8}"${fif === 1 ? ' stroke-dasharray="60 40"' : ""}/>` : "";
    const thirds = [107, 213].map((x, i) => box(x - (i + 1 === col || (col === 1 && false) ? 0 : 0), 0, 0.1, 0.1)).join("") + ln(107, 0, 107, 180, "#ffffff55", 1) + ln(213, 0, 213, 180, "#ffffff55", 1) + ln(0, 60, 320, 60, "#ffffff55", 1) + ln(0, 120, 320, 120, "#ffffff55", 1) + box([0, 107, 213][col], 0, 107, 180, "#ffd166", null, 0, 0.08);
    const sh = idx(v, "shift");
    const mt = v.n("moveTime");
    const inner = room(k, 130) + mirror + counter + frameP + subj + leadL + thirds + `<circle cx="${R(xs)}" cy="${R(ys)}" r="5" fill="none" stroke="#ffd166" stroke-width="2"/>` + (lr ? k.arrow({ x1: sx + faceDir * 12, y1: headY, x2: sx + faceDir * (12 + lr * 1.4), y2: headY, w: 2, color: "#9fd3ff" }) : "") + (sh ? k.arrow({ x1: sx, y1: 20, x2: sx + (sh === 2 ? 60 : 30) * faceDir, y2: 20, w: sh === 2 ? 4 : 2, color: "#81b29a" }) : "");
    return (
      k.bg(SKY) +
      shot(k, "cw-comp-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `${v("xPct")}% across, ${v("yPct")}% up`, { size: 7.5 }) +
      sm(k, 222, 32, `Placing ${part}`, { size: 7.5 }) +
      sm(k, 222, 46, `Look room ${lr}%`, { size: 7.5 }) +
      sm(k, 222, 64, `Balance ${bal}`, { size: 7.5 }) +
      sm(k, 222, 78, `Lines: ${v("leading")}`, { size: 7.5 }) +
      sm(k, 222, 92, `Frame in frame: ${v("frameInFrame")}`, { size: 7 }) +
      sm(k, 222, 106, `Symmetry: ${v("symmetry")}`, { size: 7 }) +
      sm(k, 222, 124, `${v("shift")} over ${mt} s`, { size: 7.5 }) +
      box(222, 130, Math.max(2, (mt / 30) * 84), 4, "#81b29a") +
      k.caption(`Subject on the ${v("setting")}, ${v("height")} in frame`)
    );
  });

  /* Empty frame: a small figure and the empty space around them, and what that space feels like. */
  W.look("emptySpace", (v, k) => {
    const pct = v.n("percent") / 100 * 0.5 + idx(v, "setting") * 0.2;
    const ex = (v.n("emptyX") / 100) * 320;
    const ey = 180 - (v.n("emptyY") / 100) * 180;
    const where = idx(v, "where");
    const ph = k.clamp(150 * (1 - pct), 18, 150);
    const sx = [160, 320 - ex * 0.5 - 30, 160, 160][where];
    const sy = [175, 175, 175 - 30, 120][where];
    const feel = idx(v, "emptyFeel");
    const tintC = ["#4a7fb8", "#808080", "#a03030"][feel];
    const filled = idx(v, "filled");
    const ft = v.n("fillTime");
    const gr = idx(v, "growth");
    const inner =
      box(0, 0, 320, 180, k.mix("#2a2a30", tintC, 0.35)) +
      box(0, 140, 320, 40, "#1f1b18") +
      `<ellipse cx="${R(ex)}" cy="${R(ey)}" rx="${R(40 + pct * 80)}" ry="${R(25 + pct * 40)}" fill="none" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 5"/>` +
      k.label({ x: ex, y: ey + 4, text: "empty", size: 12, color: "#ffd166" }) +
      (where === 2 ? box(sx - 120, sy - 140, 240, 2, "#555") : "") +
      fig(k, sx, sy, ph, { color: "#4a6fa5", mood: feel ? -0.5 : 0.2, look: ex > sx ? 1 : -1 }) +
      (feel === 2 ? `<ellipse cx="${R(ex)}" cy="${R(ey + 20)}" rx="30" ry="50" fill="#000" opacity="0.35"/>` : "") +
      (filled ? `<g opacity="${filled === 2 ? 0.7 : 0.4}">${fig(k, ex, Math.min(178, ey + 60), 70, { color: "#a5574a" })}</g>` : "") +
      (gr !== 1 ? k.arrow({ x1: ex, y1: ey - 30, x2: ex + (gr ? 1 : -1) * 30, y2: ey - 30 - (gr ? 1 : -1) * 15, w: 2.5, color: "#81b29a" }) : "");
    return (
      k.bg(SKY) +
      shot(k, "cw-es-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `${v("percent")}% empty`, { size: 10, color: "#fff", weight: 700 }) +
      sm(k, 222, 34, `${v("where")} them`, { size: 7.5 }) +
      sm(k, 222, 48, `at ${v("emptyX")}%, ${v("emptyY")}%`, { size: 7.5 }) +
      sm(k, 222, 66, `Feels ${v("emptyFeel")}`, { size: 7.5, color: tintC === "#808080" ? "#bbb" : tintC }) +
      sm(k, 222, 86, `Fills: ${v("filled")}`, { size: 7.5 }) +
      sm(k, 222, 100, `after ${ft} s`, { size: 7.5 }) +
      box(222, 104, Math.max(2, (ft / 60) * 84), 4, "#a5574a") +
      sm(k, 222, 124, v("growth"), { size: 7.5 }) +
      k.caption(`${v("setting")} of the frame is empty`)
    );
  });

  /* Move against loudness: a loudness line, the threshold, and the camera pushing in or pulling out. */
  W.look("moveToVolume", (v, k) => {
    const mode = idx(v, "setting");
    const str = v.n("strength") / 5;
    const dly = v.n("delay");
    const dirP = v.p("direction") * 2 - 1;
    const thr = (v.n("thresholdDb") + 40) / 40;
    const cat = idx(v, "threshold");
    const set = idx(v, "settleAfter");
    const stime = v.n("settleTime");
    const msz = v.n("moveSize") / 100;
    const loud = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      loud.push(0.25 + 0.65 * Math.exp(-Math.pow((t - 0.35) / 0.05, 2)) + 0.45 * Math.exp(-Math.pow((t - 0.75) / 0.04, 2)) + (k.rnd(i) - 0.5) * 0.1);
    }
    const trig = Math.min(0.95, thr * 0.6 + cat * 0.12);
    let z = 0;
    const zoom = loud.map((l, i) => {
      const src = loud[Math.max(0, i - dly * 3)];
      const hit = mode === 0 ? src > trig : mode === 1 ? src < 0.3 : false;
      if (hit) z = Math.min(1, z + 0.2 * (0.3 + str));
      else z = set === 2 ? z : z * (set === 0 ? 0.5 : 1 - 0.3 / (1 + stime));
      return z;
    });
    const zEnd = Math.max(...zoom) * (0.2 + msz) * (dirP >= 0 ? 1 : -1) * (dirP === 0 ? 0.5 : 1);
    return (
      k.bg(SKY) +
      box(6, 6, 206, 60, "#1d1d22", "#3a3a44", 4) +
      sm(k, 10, 18, "Loudness", { size: 7.5 }) +
      k.graph({ x: 10, y: 10, w: 198, h: 52, points: loud, color: "#9fd3ff", w2: 1.5 }) +
      ln(10, 62 - trig * 52, 208, 62 - trig * 52, "#ff6b6b", 1, "3 3") +
      sm(k, 150, 60 - trig * 52, `${v("thresholdDb")} dB`, { size: 7, color: "#ff8a8a" }) +
      box(6, 72, 206, 60, "#1d1d22", "#3a3a44", 4) +
      sm(k, 10, 84, "Camera push", { size: 7.5 }) +
      k.graph({ x: 10, y: 76, w: 198, h: 52, points: zoom.map((p) => p * (0.3 + msz * 0.7)), color: "#ffd166", w2: 2 }) +
      side() +
      `<g transform="translate(264 60)">${box(-36, -24, 72, 48, "none", "#888")}${box(-36 * (1 - zEnd * 0.5), -24 * (1 - zEnd * 0.5), 72 * (1 - zEnd * 0.5), 48 * (1 - zEnd * 0.5), "none", "#ffd166")}</g>` +
      sm(k, 222, 100, v("direction"), { size: 7.5 }) +
      sm(k, 222, 114, `Strength ${v("strength")}, ${v("moveSize")}%`, { size: 7.5 }) +
      sm(k, 222, 128, `Delay ${dly} beats`, { size: 7.5 }) +
      sm(k, 222, 142, `Settles ${v("settleAfter")}, ${stime} s`, { size: 7 }) +
      sm(k, 10, 148, `Starts at ${v("threshold")}`, { size: 7.5, color: "#ddd" }) +
      k.caption(`Camera ${v("setting")}`)
    );
  });

  /* Foreshortening: a hand (or foot, weapon, object) reaching toward the lens, huge against a small face. */
  W.look("foreshortening", (v, k) => {
    const lv = idx(v, "setting");
    const d = v.n("distance") / 5;
    const nm = v.n("nearM");
    const ns = v.n("nearSize");
    const ratio = v.n("sizeRatio");
    const size = k.clamp((0.6 + lv * 0.5 + d * 0.5) * Math.sqrt(ns / 30) * Math.sqrt(ratio / 1.5) / Math.sqrt(nm / 0.5), 0.4, 6);
    const th = idx(v, "threat");
    const thing = v("nearThing");
    const near =
      thing === "a hand"
        ? k.hand({ x: 160, y: 120, s: size, open: 0.8 })
        : thing === "a foot"
          ? `<ellipse cx="160" cy="120" rx="${R(30 * size)}" ry="${R(18 * size)}" fill="#5d4a3a" stroke="#1c1712" stroke-width="2"/>`
          : thing === "a weapon"
            ? `<path d="M160 ${R(120 - 50 * size)} L${R(160 + 8 * size)} 120 L${R(160 - 8 * size)} 120 Z" fill="#c8c8d0" stroke="#1c1712" stroke-width="2"/>`
            : box(160 - 20 * size, 120 - 20 * size, 40 * size, 40 * size, "#e07a5f", "#1c1712", 4);
    const reach = idx(v, "reach");
    const inner = room(k, 120) + fig(k, 180, 140, 70, { mood: th === 2 ? -0.8 : th === 0 ? 0.8 : 0, arms: 0.4, color: "#4a6fa5" }) + near + (th === 2 ? k.tint({ color: "#a00", alpha: 0.18 }) : "") + (reach !== 1 ? k.arrow({ x1: 60, y1: 40, x2: reach ? 30 : 90, y2: reach ? 20 : 60, w: 3, color: "#81b29a" }) : "");
    return (
      k.bg(SKY) +
      shot(k, "cw-fs-clip", 4, 4, 206, inner) +
      side() +
      sm(k, 222, 18, `${thing} ${nm} m from lens`, { size: 7.5 }) +
      sm(k, 222, 34, `${ns}% of frame`, { size: 7.5 }) +
      sm(k, 222, 48, `${ratio}x the face`, { size: 7.5 }) +
      k.dot({ x: 250, y: 90, r: 4, color: "#f0c8a0" }) +
      k.dot({ x: 280, y: 90, r: Math.min(22, 4 * Math.sqrt(ratio)), color: "#f0c8a0" }) +
      sm(k, 222, 124, `Nearness ${v("distance")}`, { size: 7.5 }) +
      sm(k, 222, 138, v("threat"), { size: 7.5, color: th === 2 ? "#ff8a8a" : "#bbb" }) +
      sm(k, 222, 152, v("reach"), { size: 7.5 }) +
      k.caption(`${v("setting")} foreshortening`)
    );
  });

  /* ---------- extra dot grids, where two settings pair naturally and the window has no pad yet ---------- */
  const pad = (id, x, y, xLabel, yLabel) => {
    const spec = W.get(id);
    if (spec && !(spec.faces || []).some((f) => f.face === "pad")) W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("pov", "stayLength", "eyeHeight", "How long inside", "Height of their eyes");
  pad("cutRate", "peakAt", "perMinute", "Fastest at", "Cuts per minute");
  pad("shotDuration", "seconds", "pastLine", "Seconds", "Hold after the last word");
  pad("angleToAction", "actionLead", "actionSize", "Early or late", "Action's size");
  pad("objectEnter", "landX", "landY", "Across", "Up");
  pad("lensLength", "subjectDist", "mm", "Distance", "Focal length");
  pad("dutch", "rockSize", "degrees", "Rocking", "Tilt");
  pad("angleCount", "spreadDeg", "farthestM", "Spread", "Farthest setup");
  pad("cameraCarry", "wobbleCm", "wobbleDeg", "Wobble size", "Wobble angle");
  pad("objectSpeed", "metersPerSec", "stopTime", "Travel speed", "Time to stop");
  pad("depthOfField", "focusM", "fstop", "Focus distance", "F-stop");
  pad("motionBlur", "frameRate", "shutter", "Frames per second", "Shutter angle");
  pad("aspect", "width", "barSize", "Picture width", "Bar thickness");
  pad("composition", "xPct", "yPct", "Across", "Up");
  pad("foreshortening", "nearM", "nearSize", "From the lens", "Size in frame");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
