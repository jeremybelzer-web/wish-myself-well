/* look for the light, effects, layers, editing and structure, and emotional road curiosities in data/db-depth-fx.js
   (depth thread, fx): the live picture at the top of each window. Same house style as look-heart-comedy.js and
   look-depth-look.js: a picture on top (y 0 to 120) that draws the room, the weather, the layers or the shape of
   the story as simple shapes, a strip of small labelled gauges below it, and a caption. Colors: gold = the main
   character or the light, blue = other people, red = danger, green = safe or kind, purple = mood or memory.
   Every own setting moves something of its own. */
(function (W) {
  const S = { bg: "#15151c", lane: "#22222b", gold: "#ffd166", red: "#e4572e", blue: "#6fa8dc", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", ice: "#9fd3ff", orange: "#e8913a", wall: "#3a3440", floor: "#2b2620", white: "#f4f4f4", brown: "#7a5a3a" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);

  /* ---------- small drawing helpers ---------- */
  const emo = (k, x, y, e, size) => k.label({ x, y, text: e, size: size || 16 });
  const rect = (x, y, w, h, fill, extra) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0.5, w))}" height="${r1(Math.max(0.5, h))}" fill="${fill}"${extra || ""}/>`;
  const line = (x1, y1, x2, y2, color, w, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`;
  const circ = (x, y, r, fill, op) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(Math.max(0.5, r))}" fill="${fill}"${op != null ? ` opacity="${r1(Math.max(0, Math.min(1, op)) * 100) / 100}"` : ""}/>`;
  const op = (p, body) => `<g opacity="${r1(Math.max(0, Math.min(1, p)) * 100) / 100}">${body}</g>`;
  /* A tiny shot: a dark frame with a thin border. */
  const shot = (x, y, w, h, color) => rect(x, y, w, h, "#101016", ` stroke="${color || "#555"}" stroke-width="1"`);

  /* ---------- the strip of small gauges (copied from look-depth-look.js) ---------- */
  function strip(k, items) {
    const n = items.length;
    const cols = n > 4 ? 3 : 2;
    const cw = 304 / cols;
    let out = `<rect x="0" y="120" width="320" height="42" fill="#0e0e13"/><line x1="0" y1="120" x2="320" y2="120" stroke="#34323c"/>`;
    items.forEach((it, j) => {
      const x = 8 + (j % cols) * cw;
      const y = 130 + Math.floor(j / cols) * 19;
      const w = cw - 12;
      const c = it.color || S.gold;
      out += k.label({ x, y, text: it.label, size: 8, color: "#a3a3b3", anchor: "start" });
      const by = y + 3;
      const txt = String(it.text);
      const short = txt.length > (cols === 3 ? 15 : 24) ? txt.slice(0, cols === 3 ? 14 : 23) + "…" : txt;
      if (it.kind === "word") {
        out += k.label({ x, y: by + 7, text: short, size: 8, color: "#fff", anchor: "start", weight: 700 });
      } else if (it.kind === "steps") {
        const sw = Math.min(9, (w * 0.42) / it.n);
        for (let i = 0; i < it.n; i++) out += `<rect x="${r1(x + i * sw)}" y="${by}" width="${r1(sw - 1.5)}" height="7" rx="1.5" fill="${i <= it.i ? c : "#33323d"}"/>`;
        const room = Math.max(6, Math.floor((w - it.n * sw - 3) / 5.2));
        const shorter = txt.length > room ? txt.slice(0, room - 1) + "…" : txt;
        out += k.label({ x: x + it.n * sw + 3, y: by + 7, text: shorter, size: 8, color: "#fff", anchor: "start", weight: 700 });
      } else {
        const bw = w - (cols === 3 ? 30 : 40);
        out += `<rect x="${x}" y="${by}" width="${r1(bw)}" height="7" rx="3.5" fill="#33323d"/>`;
        out += `<rect x="${x}" y="${by}" width="${r1(Math.max(2, bw * k.clamp(it.p, 0, 1)))}" height="7" rx="3.5" fill="${c}"/>`;
        out += k.label({ x: x + bw + 4, y: by + 7, text: short, size: 8, color: "#fff", anchor: "start", weight: 700 });
      }
    });
    return out;
  }
  const G = (v) => ({
    num: (id, label, unit, color) => ({ label, kind: "bar", p: v.p(id), text: fmt(v.n(id)) + (unit || ""), color }),
    steps: (id, label, color) => {
      const s = v.slider(id);
      const sc = (s && s.scale) || [];
      return { label, kind: "steps", n: sc.length, i: sc.indexOf(v(id)), text: v(id), color };
    },
    word: (id, label) => ({ label, kind: "word", text: v(id) }),
  });
  const idx = (v, id, len) => {
    const s = v.slider(id);
    const i = s && s.scale ? Math.max(0, s.scale.indexOf(v(id))) : 0;
    return len ? Math.min(len - 1, i) : i;
  };
  const look = (id, fn) => W.look(id, (v, k) => fn(v, k, G(v)));
  const room = (k, floorY) => rect(0, 0, 320, floorY, S.wall) + rect(0, floorY, 320, 120 - floorY, S.floor);
  /* A story timeline across the picture: a line from start to end with tick marks. */
  const timeline = (k, y, color) => line(20, y, 300, y, color || "#55535f", 2) + line(20, y - 4, 20, y + 4, "#77757f", 1.5) + line(300, y - 4, 300, y + 4, "#77757f", 1.5);

  /* ======================= flickerWarning ======================= */
  /* A hallway with a light at the top: a strip of moments, lit or dark, shows the flicker; the far door changes. */
  look("flickerWarning", (v, k, g) => {
    const flick = v.n("flicker") / 5;
    const source = idx(v, "source", 6);
    const rhythm = idx(v, "rhythm", 4);
    const warns = idx(v, "warns", 5);
    const dark = v.n("dark") / 3;
    const changed = idx(v, "changed", 4);
    let out = rect(0, 0, 320, 120, "#1c1a22");
    /* the hallway walls closing toward a far door */
    out += `<path d="M0 0 L120 30 L120 92 L0 120 Z" fill="#2a2630"/><path d="M320 0 L200 30 L200 92 L320 120 Z" fill="#2a2630"/>`;
    out += rect(140, 44, 40, 48, changed === 3 ? "#000" : "#3b3340", ` stroke="#555" stroke-width="1"`);
    if (changed === 1) out += rect(140, 44, 18, 48, "#000");
    if (changed === 2) out += k.person({ x: 160, y: 92, s: 0.4, color: S.red, mood: -0.5 });
    /* the light, and how lit the hall is right now */
    const lit = 1 - flick * (0.4 + dark * 0.5);
    out += emo(k, 160, 18, ["💡", "➖", "🕯️", "🏮", "📺", "🏠"][source], 14);
    out += k.tint({ color: "#fff3c4", alpha: 0.05 + lit * 0.18 });
    out += k.tint({ color: "#000", alpha: (1 - lit) * 0.6 });
    /* a strip of 14 moments along the top right: lit or dark by the rhythm */
    for (let i = 0; i < 14; i++) {
      const r = k.rnd(i + 5);
      const off = [i % 4 === 0, r < 0.5, i % 2 === 0, i >= 6 && i <= 6 + Math.round(dark * 6)][rhythm] && r < 0.3 + flick;
      out += rect(200 + i * 8, 6, 6, 8, off && flick > 0 ? "#000" : S.gold, ` stroke="#444" stroke-width="0.5"`);
    }
    out += emo(k, 290, 60, ["🔌", "🚶", "⚡", "👁️", "🌀"][warns], 16);
    out += strip(k, [g.num("flicker", "Flicker", ""), g.word("source", "Light"), g.word("rhythm", "Pattern"), g.word("warns", "Warns of"), g.num("dark", "Dark", "s"), g.word("changed", "Back to")]);
    return out + k.caption(`Flicker ${fmt(v.n("flicker"))} of 5: ${v("warns")}`);
  });

  /* ======================= shadowTells ======================= */
  /* A small figure lit from the side throws a shadow on the chosen surface; its size, edge and story change. */
  look("shadowTells", (v, k, g) => {
    const tells = v.n("tells") / 5;
    const size = idx(v, "size", 4);
    const where = idx(v, "where", 5);
    const shows = idx(v, "shows", 5);
    const sharp = idx(v, "sharp", 4);
    const meets = idx(v, "meets", 4);
    let out = room(k, 96);
    if (where === 2) for (let i = 0; i < 6; i++) out += rect(170 + i * 22, 0, 20, 96, i % 2 ? "#4a4250" : "#443c4a");
    if (where === 4) for (let i = 0; i < 6; i++) out += rect(170 + i * 22, 80 - i * 14, 22, 16 + i * 14, "#46404c");
    out += k.lamp({ x: 20, y: 60, dir: 0, power: 0.4 + tells * 0.6, spread: 50 });
    out += k.person({ x: 90, y: 112, s: 0.5, color: shows === 3 ? S.red : S.blue, mood: shows === 2 ? 0.6 : -0.2, alpha: meets === 0 ? 0.25 : 1 });
    const sc = [0.6, 1, 1.6, 2.4][size] * (0.6 + tells * 0.6);
    const blur = [3, 2, 1, 0][sharp];
    const sx = 230;
    const sy = where === 1 ? 108 : where === 3 ? 60 : 96;
    const sh = `<g transform="translate(${sx} ${sy}) scale(${r1(sc)})" opacity="${r1((0.3 + tells * 0.6) * 100) / 100}">` + `<circle cx="0" cy="-48" r="9" fill="#000"/><rect x="-10" y="-38" width="20" height="38" rx="5" fill="#000"/>` + (shows === 3 ? `<path d="M-12 -55 L-6 -66 L-2 -55 Z M12 -55 L6 -66 L2 -55 Z" fill="#000"/>` : "") + `</g>`;
    for (let b = blur; b >= 0; b--) out += op(b === 0 ? 1 : 0.25, sh.replace(`translate(${sx} `, `translate(${sx + b * 2} `));
    out += emo(k, 300, 20, ["🚶", "🥊", "💋", "👹", "🎭"][shows], 14);
    if (meets === 3) out += k.ring({ x: 90, y: 100, r: 14, color: S.green, w: 1.5, dash: "3 2" });
    out += strip(k, [g.num("tells", "Tells", ""), g.steps("size", "Size"), g.word("where", "On"), g.word("shows", "Shows"), g.steps("sharp", "Edge"), g.word("meets", "Real thing")]);
    return out + k.caption(`A ${v("size")} shadow ${v("where")}`);
  });

  /* ======================= silhouetteShot ======================= */
  /* A bright opening behind a person; the person goes from a lit face to a black shape. */
  look("silhouetteShot", (v, k, g) => {
    const dark = v.n("dark") / 5;
    const behind = idx(v, "behind", 5);
    const face = idx(v, "faceShown", 4);
    const pose = idx(v, "pose", 4);
    const who = idx(v, "who", 4);
    const steps = idx(v, "stepsIn", 4);
    const bright = ["#e6f0f7", "#fff6d8", "#ffb36b", "#fffbe0", "#ff9a4a"][behind];
    let out = rect(0, 0, 320, 120, "#211d26");
    out += behind === 2 ? rect(0, 0, 320, 90, bright) + circ(160, 90, 30, "#ffd166") : behind === 3 ? circ(130, 60, 26, bright, 0.9) + circ(190, 60, 26, bright, 0.9) : rect(110, 10, 100, 100, bright);
    if (behind === 4) for (let i = 0; i < 5; i++) out += circ(120 + i * 20, 100, 10 + k.rnd(i) * 8, S.orange, 0.8);
    const s = pose === 2 ? 1 : pose === 3 ? 0.65 : 0.85;
    out += k.person({ x: 160, y: 116, s, color: k.mix("#6fa8dc", "#000000", dark), mood: 0, arms: pose === 1 ? 1 : 0, alpha: 1 });
    out += op(dark * 0.9, circ(160, 116 - 78 * s, 13 * s, "#000"));
    if (face >= 1) out += op(0.9, `<path d="M${r1(167 * 1)} ${r1(116 - 90 * s)} a ${r1(13 * s)} ${r1(13 * s)} 0 0 1 0 ${r1(26 * s)}" fill="none" stroke="${S.gold}" stroke-width="2"/>`);
    if (face >= 2) out += circ(155, 116 - 80 * s, 1.5, "#fff") + circ(165, 116 - 80 * s, 1.5, "#fff");
    if (face >= 3) out += rect(160, 116 - 91 * s, 13 * s, 26 * s, "#f0c8a0", ' opacity="0.8"');
    if (pose === 2) out += k.arrow({ x1: 160, y1: 30, x2: 160, y2: 4, color: S.white, w: 1 });
    if (pose === 3) out += k.arrow({ x1: 150, y1: 6, x2: 170, y2: 6, color: S.white, w: 1 });
    out += emo(k, 290, 24, ["🙂", "🤔", "❓", "❌"][who], 16);
    out += timeline(k, 112, "#444") + circ(20 + [280, 10, 140, 250][steps], 112, 4, S.gold);
    out += strip(k, [g.num("dark", "Dark", ""), g.word("behind", "Behind"), g.steps("faceShown", "Face"), g.word("pose", "Shape"), g.word("who", "Who"), g.word("stepsIn", "Steps in")]);
    return out + k.caption(`An outline against ${v("behind")}`);
  });

  /* ======================= lightPool ======================= */
  /* One source over a table; the pool of light shrinks, the edge hardens, and the dark around holds someone. */
  look("lightPool", (v, k, g) => {
    const pool = v.n("pool") / 5;
    const lampI = idx(v, "lamp", 6);
    const rim = idx(v, "rim", 3);
    const inside = idx(v, "inside", 4);
    const outside = idx(v, "outside", 4);
    const moves = idx(v, "moves", 4);
    let out = rect(0, 0, 320, 120, k.mix("#3a3440", "#050507", pool));
    const cx = 160 + (moves === 1 ? 24 : moves === 2 ? -40 : 0);
    const rr = 150 - pool * 105;
    const power = moves === 3 ? 0.4 : 1;
    const bands = [6, 3, 1][rim];
    for (let i = bands; i >= 1; i--) out += `<ellipse cx="${r1(cx)}" cy="98" rx="${r1(rr * (1 + (i - 1) * 0.15))}" ry="${r1(rr * 0.28 * (1 + (i - 1) * 0.15))}" fill="#fff3c4" opacity="${r1((power * 0.5) / bands * 100) / 100}"/>`;
    out += line(cx, 0, cx, 20, "#555", 1.5) + emo(k, cx, 30, ["🛋️", "🕯️", "🏮", "🔦", "📱", "💡"][lampI], 14);
    if (moves === 1) out += `<path d="M${cx - 16} 26 Q ${cx} 34 ${cx + 16} 26" fill="none" stroke="#888" stroke-width="1"/>`;
    if (moves === 2) out += k.arrow({ x1: cx + 10, y1: 40, x2: cx + 40, y2: 40, color: S.gold, w: 1.5 });
    if (moves === 3) out += emo(k, cx + 18, 22, "⏳", 10);
    if (inside === 1) out += rect(cx - 8, 92, 16, 8, S.brown);
    if (inside >= 2) out += k.person({ x: cx - (inside === 3 ? 18 : 0), y: 110, s: 0.5, color: S.gold, mood: -0.1 });
    if (inside === 3) out += k.person({ x: cx + 18, y: 110, s: 0.5, color: S.blue, mood: -0.1 });
    if (outside === 1) out += op(0.4, rect(20, 60, 30, 40, "#2a2630") + rect(270, 50, 30, 50, "#2a2630"));
    if (outside === 2) out += circ(40, 60, 2, "#fff") + circ(48, 60, 2, "#fff");
    if (outside === 3) out += emo(k, 290, 60, "👁️", 16);
    out += strip(k, [g.num("pool", "Small", ""), g.word("lamp", "Light"), g.steps("rim", "Edge"), g.word("inside", "In it"), g.steps("outside", "In the dark"), g.word("moves", "Moves")]);
    return out + k.caption(`A pool of light ${pool > 0.6 ? "in deep dark" : "in a dim room"}`);
  });

  /* ======================= rainOnWindow ======================= */
  /* A window pane with drops and streaks over a blurred world, a face on the near or far side. */
  look("rainOnWindow", (v, k, g) => {
    const rain = v.n("rain") / 5;
    const drops = idx(v, "drops", 4);
    const side = idx(v, "side", 2);
    const blur = v.n("blur") / 100;
    const glow = idx(v, "glow", 4);
    const tears = idx(v, "tears", 3);
    let out = rect(0, 0, 320, 120, side === 0 ? "#2e3a4a" : "#3a2f28");
    /* the world behind: lights that blur into soft dots */
    const lights = [[], [[200, 50, S.gold]], [[60, 40, S.gold], [120, 60, S.ice], [250, 30, S.pink], [280, 70, S.gold]], [[40, 80, S.white], [90, 80, S.red]]][glow];
    lights.forEach(([x, y, c]) => (out += circ(x, y, 3 + blur * 12, c, 0.5 + (1 - blur) * 0.4)));
    /* the face, inside or behind the glass */
    out += k.face({ x: 160, y: 66, r: side === 1 ? 18 : 22, mood: -0.5, look: side === 0 ? -0.5 : 0.3 });
    if (side === 1) out += k.tint({ color: "#9fd3ff", alpha: 0.12 });
    /* the frame of the window */
    out += rect(0, 0, 320, 120, "none", ` stroke="#1a1a20" stroke-width="6"`) + line(160, 0, 160, 20, "#1a1a20", 4);
    /* drops and streaks */
    const n = Math.round(rain * 30);
    for (let i = 0; i < n; i++) {
      const x = 8 + k.rnd(i + 1) * 304;
      const y = 6 + k.rnd(i + 40) * 90;
      const len = [0, 10, 26, 60][drops];
      out += len ? line(x, y, x + 1, y + len, "#cfe6ff", drops === 3 ? 3 : 1.2) : circ(x, y, 1.6, "#cfe6ff", 0.8);
    }
    if (drops === 3 && rain > 0) out += k.tint({ color: "#cfe6ff", alpha: rain * 0.12 });
    if (tears >= 1) out += line(tears === 2 ? 150 : 132, 64, tears === 2 ? 150 : 132, 100, "#e8f4ff", 2);
    out += strip(k, [g.num("rain", "Rain", ""), g.steps("drops", "Water"), g.word("side", "We are"), g.num("blur", "Blur", "%"), g.word("glow", "Lights"), g.steps("tears", "Like tears")]);
    return out + k.caption(`Rain ${fmt(v.n("rain"))} of 5, ${v("side")}`);
  });

  /* ======================= visibleBreath ======================= */
  /* One or two faces in the cold with little clouds of breath; the clouds come fast, mix, or stop. */
  look("visibleBreath", (v, k, g) => {
    const breath = v.n("breath") / 5;
    const cold = idx(v, "cold", 4);
    const pace = idx(v, "pace", 4);
    const whose = idx(v, "whose", 4);
    const mix = idx(v, "mix", 3);
    const held = idx(v, "held", 4);
    let out = rect(0, 0, 320, 120, k.mix("#2a3442", "#0e1826", cold / 3));
    for (let i = 0; i < cold * 6; i++) out += circ(k.rnd(i + 2) * 320, k.rnd(i + 20) * 110, 1, "#fff", 0.6);
    const gap = [90, 90, 60, 40][mix];
    const faces = whose === 0 ? [[110, 1]] : whose === 1 ? [[160 - gap, 1], [160 + gap, -1]] : whose === 2 ? [[70, 1], [130, 1], [190, 1], [250, -1]] : [[110, 1]];
    faces.forEach(([x, d], i) => {
      out += whose === 3 ? emo(k, x, 74, "🐎", 34) : k.face({ x, y: 66, r: 16, mood: pace >= 2 ? -0.5 : 0.1, look: d * 0.6 });
      if (held >= 1 && i === 0) return;
      const puffs = 1 + pace;
      const reach = mix === 2 && whose === 1 ? gap : 30 + breath * 30;
      for (let j = 0; j < puffs; j++) out += circ(x + d * (20 + (j * reach) / puffs), 70 - j * 3, 3 + breath * 6 * (1 - j / (puffs + 1)) + cold, "#e8f0ff", (0.2 + breath * 0.6) * (1 - j / (puffs + 1)));
    });
    if (held >= 1) out += emo(k, faces[0][0], 40, ["", "🤐", "🫣", "💀"][held], 14);
    if (mix === 2 && whose === 1) out += circ(160, 66, 8 + breath * 6, "#ffffff", 0.3);
    out += strip(k, [g.num("breath", "Breath", ""), g.steps("cold", "Cold"), g.steps("pace", "Pace"), g.word("whose", "Whose"), g.steps("mix", "Meet"), g.steps("held", "Held")]);
    return out + k.caption(`${v("cold")}, breathing ${v("pace")}`);
  });

  /* ======================= skyMatchesMood ======================= */
  /* The sky above two people, and a feeling line under it; the weather follows the feeling or goes against it. */
  look("skyMatchesMood", (v, k, g) => {
    const match = v.n("match") / 5;
    const sky = idx(v, "sky", 6);
    const way = idx(v, "way", 3);
    const timing = idx(v, "timing", 3);
    const size = idx(v, "size", 3);
    const noticed = idx(v, "noticed", 4);
    const dark = way === 1 ? 0.1 : 0.2 + match * 0.6 * ((size + 1) / 3);
    let out = rect(0, 0, 320, 80, k.mix("#bcd8ef", "#1e2430", sky === 0 ? dark * 0.3 : dark)) + rect(0, 80, 320, 40, "#3d4a34");
    if (sky === 0 || way === 1) out += circ(270, 22, 12, S.gold);
    const n = Math.round(match * 10 * (size + 1));
    for (let i = 0; i < n; i++) {
      const x = k.rnd(i + 7) * 320;
      const y = k.rnd(i + 70) * 76;
      out += sky === 2 ? line(x, y, x - 3, y + 8, "#cfe6ff", 1) : sky === 4 ? circ(x, y, 1.6, "#fff") : sky === 1 ? line(x, y, x + 14, y, "#ddd", 1) : sky === 5 ? circ(x, y, 10, "#ddd", 0.15) : "";
    }
    if (sky === 3) out += `<path d="M200 4 L188 34 L198 34 L184 66" fill="none" stroke="${S.gold}" stroke-width="${1 + match * 2}"/>`;
    out += k.person({ x: 130, y: 112, s: 0.5, color: S.gold, mood: -0.6, look: noticed >= 1 ? 0 : 0.5 });
    out += k.person({ x: 190, y: 112, s: 0.5, color: S.blue, mood: -0.6 });
    if (noticed === 3) out += k.tint({ color: "#6fa8dc", alpha: 0.15 });
    if (noticed === 2) out += k.bubble({ x: 230, y: 70, text: "Look at that sky", w: 70 });
    /* a feeling line and a sky line: the sky leads, joins or follows */
    const shift = [-20, 0, 20][timing];
    out += `<path d="M20 100 L120 100 L140 92 L300 92" fill="none" stroke="${S.purple}" stroke-width="1.5"/>`;
    out += `<path d="M20 106 L${120 + shift} 106 L${140 + shift} ${way === 1 ? 112 : 98} L300 ${way === 2 ? 112 : way === 1 ? 112 : 98}" fill="none" stroke="${S.ice}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    out += strip(k, [g.num("match", "Follows", ""), g.word("sky", "Sky"), g.word("way", "With it?"), g.word("timing", "When"), g.steps("size", "Size"), g.steps("noticed", "Noticed")]);
    return out + k.caption(`${v("sky")}, ${v("way")}`);
  });

  /* ======================= fogReveal ======================= */
  /* A path into fog; something waits at some distance, and comes out as a shape, a light or a sound. */
  look("fogReveal", (v, k, g) => {
    const fog = v.n("fog") / 5;
    const air = idx(v, "air", 5);
    const hides = idx(v, "hides", 5);
    const first = idx(v, "first", 4);
    const clears = idx(v, "clears", 4);
    const near = idx(v, "near", 4);
    let out = rect(0, 0, 320, 120, "#3b4048") + `<path d="M140 120 L155 50 L165 50 L180 120 Z" fill="#55504a"/>`;
    const sc = 0.3 + near * 0.25;
    const y = 60 + near * 18;
    const thing = hides === 0 ? "" : hides === 1 ? `<path d="M150 50 L170 50" stroke="#55504a"/>` : hides === 2 ? k.person({ x: 160, y, s: sc, color: S.blue }) : hides === 3 ? [-60, -30, 0, 30, 60].map((d) => k.person({ x: 160 + d * sc * 2, y, s: sc, color: S.blue })).join("") : emo(k, 160, y - 10, "👹", 20 + near * 10);
    out += first === 0 ? op(1, thing.replace(/fill="#6fa8dc"/g, 'fill="#111"')) : thing;
    if (first === 1) out += circ(160, y - 40 * sc, 6, S.gold, 0.9);
    if (first === 2) out += emo(k, 200, y - 30, "🔊", 12);
    if (first === 3) out += k.ring({ x: 160, y: y - 30 * sc, r: 30, color: S.red, w: 1.5 });
    const col = ["#dfe4ea", "#cfd4da", "#7a7470", "#c8a878", "#f4f4f4"][air];
    const thin = clears === 2 ? 0.5 : clears === 1 ? 0.8 : clears === 3 ? 0.7 : 1;
    out += k.tint({ color: col, alpha: fog * 0.85 * thin });
    if (clears === 2) out += k.arrow({ x1: 20, y1: 20, x2: 70, y2: 16, color: S.white, w: 1.5 });
    if (clears === 3) out += k.arrow({ x1: 160, y1: 110, x2: 160, y2: 96, color: S.gold, w: 1.5 });
    out += strip(k, [g.num("fog", "Thick", ""), g.word("air", "Air"), g.steps("hides", "Hides"), g.word("first", "First"), g.word("clears", "Clears"), g.steps("near", "How near")]);
    return out + k.caption(`${v("hides")} in the ${v("air")}`);
  });

  /* ======================= memoryOverlay ======================= */
  /* The present room with a person, and the past laid over it in the chosen place and look. */
  look("memoryOverlay", (v, k, g) => {
    const mem = v.n("memory") / 5;
    const how = idx(v, "how", 4);
    const solid = v.n("solid") / 100;
    const past = idx(v, "pastLook", 4);
    const lines = idx(v, "lines", 4);
    const leaves = idx(v, "leaves", 4);
    let out = room(k, 92) + rect(40, 70, 60, 6, S.brown) + rect(240, 60, 22, 32, S.brown);
    out += k.person({ x: 180, y: 112, s: 0.7, color: S.gold, mood: -0.4, look: -0.6 });
    const tone = ["#6fa8dc", "#e8a050", "#bbbbbb", "#9b8b7a"][past];
    const kids = (dx, dy, s) => k.person({ x: 60 + dx, y: 100 + dy, s: 0.45 * s, color: tone, mood: 0.8, arms: 0.6 }) + k.person({ x: 96 + dx, y: 100 + dy, s: 0.35 * s, color: tone, mood: 0.8 }) + (lines === 2 ? k.person({ x: 180 + dx * 0, y: 112, s: 0.7 * s, color: tone, mood: 0.6, look: -0.6 }) : "") + (lines === 3 ? k.bubble({ x: 120 + dx, y: 40 + dy, text: "Happy birthday!", w: 70 }) : "") + (lines === 1 ? rect(40 + dx, 70 + dy, 60 * s, 6, tone) : "");
    const a = mem * (0.2 + solid * 0.8);
    if (how === 0) out += op(a, kids(0, 0, 1));
    if (how === 1) out += op(mem > 0 ? 1 : 0, shot(214, 6, 100, 56, S.purple)) + op(a, `<g transform="translate(200 -40) scale(0.55)">${kids(0, 0, 1)}</g>`);
    if (how === 2) out += op(a, k.person({ x: 251, y: 92, s: 0.5, color: tone, mood: 0.7 }));
    if (how === 3) out += rect(10, 10, 50, 60, "#23303c", ` stroke="#888"`) + op(a, k.face({ x: 35, y: 40, r: 12, mood: 0.7, color: tone }));
    if (past === 3) for (let i = 0; i < 20; i++) out += op(a * 0.6, rect(k.rnd(i) * 320, k.rnd(i + 30) * 110, 2, 1, "#fff"));
    out += emo(k, 300, 108, ["🌫️", "⚡", "👣", "🚶"][leaves], 14);
    if (leaves === 2) out += k.arrow({ x1: 120, y1: 30, x2: 170, y2: 30, color: S.purple, w: 1.5 });
    out += strip(k, [g.num("memory", "Memory", ""), g.word("how", "Laid in"), g.num("solid", "Solid", "%"), g.word("pastLook", "Look"), g.word("lines", "Lines up"), g.word("leaves", "Leaves")]);
    return out + k.caption(`The past ${v("how")}`);
  });

  /* ======================= oneColorLeft ======================= */
  /* A grey street with people; one thing keeps its color, sized and placed as set. */
  look("oneColorLeft", (v, k, g) => {
    const kept = v.n("kept") / 5;
    const what = idx(v, "what", 6);
    const hue = idx(v, "hue", 5);
    const rest = idx(v, "rest", 3);
    const size = v.n("size") / 50;
    const lasts = idx(v, "lasts", 4);
    const col = [S.red, S.gold, S.blue, S.green, "#d4a017"][hue];
    const sat = (1 - kept) * [1, 0.5, 0][rest] + kept * [0.6, 0.3, 0][rest];
    let out = rect(0, 0, 320, 120, k.mix("#777777", "#7a95b0", sat)) + rect(0, 92, 320, 28, k.mix("#555555", "#6a5a40", sat));
    for (let i = 0; i < 5; i++) out += k.person({ x: 40 + i * 60, y: 112, s: 0.55, color: k.mix("#888888", [S.blue, S.green, S.orange, S.pink, S.purple][i], sat), mood: 0 });
    const r = 4 + size * 40;
    const thingCol = k.mix("#888888", col, Math.max(kept, sat));
    const shapes = [`<rect x="${r1(160 - r / 2)}" y="${r1(70 - r / 2)}" width="${r1(r)}" height="${r1(r * 1.2)}" rx="3" fill="${thingCol}"/>`, circ(160, 60, r / 2, thingCol), circ(160, 40, r / 2, thingCol), circ(154, 50, r / 5, thingCol) + circ(166, 50, r / 5, thingCol), `<ellipse cx="160" cy="104" rx="${r1(r / 2)}" ry="${r1(r / 5)}" fill="${thingCol}"/>`, circ(160, 30, r / 2, thingCol) + line(160, 30 + r / 2, 160, 90, "#999", 1)];
    out += shapes[what];
    out += k.ring({ x: 160, y: 60, r: 10 + r, color: thingCol, w: 1, dash: "2 3" });
    out += timeline(k, 8, "#444") + rect(20, 5, [10, 60, 280, 200][lasts], 6, thingCol);
    if (lasts === 3) out += emo(k, 226, 12, "✖", 8);
    out += strip(k, [g.num("kept", "Only it", ""), g.word("what", "What"), g.word("hue", "Color"), g.steps("rest", "The rest"), g.num("size", "Size", "%"), g.word("lasts", "Lasts")]);
    return out + k.caption(`Only ${v("what")} in ${v("hue")}`);
  });

  /* ======================= scribblesOnTop ======================= */
  /* A filmed street with a person; drawings are laid over it in the chosen style, subject and color. */
  look("scribblesOnTop", (v, k, g) => {
    const drawn = v.n("drawn") / 5;
    const style = idx(v, "style", 5);
    const shows = idx(v, "shows", 5);
    const moves = idx(v, "moves", 4);
    const whose = idx(v, "whose", 4);
    const ink = idx(v, "ink", 4);
    let out = rect(0, 0, 320, 92, "#4a5868") + rect(0, 92, 320, 28, "#55504a") + rect(220, 30, 60, 62, "#3a3440");
    out += k.person({ x: 120, y: 112, s: 0.6, color: S.gold, mood: 0.3 });
    const cols = ["#ffffff", "#111111", S.gold, null][ink];
    const c = (i) => cols || [S.red, S.green, S.ice, S.pink, S.gold][i % 5];
    const w = [3, 4, 1.2, 2.5, 2][style];
    const glow = style === 4 ? ` filter="drop-shadow(0 0 2px ${c(0)})"` : "";
    const dash = style === 0 ? "1 2" : style === 1 ? "4 1" : "";
    const dx = moves === 3 ? -20 : 0;
    const wob = moves === 1 ? 3 : 0;
    const marks = [
      k.arrow({ x1: 40, y1: 30, x2: 100 + dx, y2: 60, color: c(0), w }) + k.label({ x: 40, y: 24, text: "HIM", size: 9, color: c(1) }),
      `<path d="M140 100 L200 100 L200 60 L250 60" fill="none" stroke="${c(0)}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>` + k.label({ x: 250, y: 54, text: "X", size: 12, color: c(1) }),
      emo(k, 120 + dx, 30 + wob, "❤", 16) + `<path d="M150 20 q 10 -10 20 0 q 10 -10 20 0" fill="none" stroke="${c(2)}" stroke-width="${w}"/>`,
      `<path d="M220 30 L250 6 L280 30 Z" fill="none" stroke="${c(3)}" stroke-width="${w}"/>` + emo(k, 40, 60 + wob, "🐉", 16),
      k.label({ x: 60, y: 50 + wob, text: "2 + 2 = 5", size: 10, color: c(4) }),
    ];
    const show = Math.ceil(drawn * 3);
    out += `<g${glow}>` + op(show ? 1 : 0, marks[shows]) + (show >= 2 ? marks[(shows + 2) % 5] : "") + (show >= 3 ? marks[(shows + 3) % 5] : "") + `</g>`;
    if (moves === 2) out += emo(k, 104, 66, "✏️", 10);
    out += emo(k, 300, 108, ["🎥", "💭", "🧒", "🗣️"][whose], 14);
    out += strip(k, [g.num("drawn", "Drawn", ""), g.word("style", "Style"), g.word("shows", "Shows"), g.steps("moves", "Moves"), g.word("whose", "Whose"), g.word("ink", "Ink")]);
    return out + k.caption(`${v("style")}: ${v("shows")}`);
  });

  /* ======================= journeyMap ======================= */
  /* A map with a line from home toward the far end, with stops; the map fills, fades or sits in a corner. */
  look("journeyMap", (v, k, g) => {
    const trip = v.n("trip") / 5;
    const mapLook = idx(v, "mapLook", 5);
    const lineK = idx(v, "line", 4);
    const secs = v.n("seconds");
    const over = idx(v, "over", 3);
    const stops = Math.round(v.n("stops"));
    let out = rect(0, 0, 320, 120, "#3d4a34") + k.person({ x: 60, y: 112, s: 0.5, color: S.gold });
    const mx = over === 2 ? 200 : 0;
    const my = over === 2 ? 0 : 0;
    const sc = over === 2 ? 0.37 : 1;
    const paper = ["#e8d8b0", "#e6ecef", "#f4f0e6", "#dfe8d8", "#1e3a5a"][mapLook];
    let m = rect(0, 0, 320, 120, paper);
    if (mapLook === 4) m += circ(160, 60, 55, "#2f6a9a") + `<path d="M120 40 q 30 -10 50 10 q 20 20 0 40" fill="#5fae78"/>`;
    else m += `<path d="M30 80 q 40 -40 90 -20 q 50 20 90 -10 q 40 -20 90 0 L300 120 L30 120 Z" fill="${["#c8b888", "#cfd8dc", "#e0d8c8", "#c8d8bc"][mapLook]}"/>`;
    if (mapLook === 3) m += circ(40, 90, 6, S.ice) + k.label({ x: 40, y: 80, text: "you", size: 7, color: "#333" });
    const x2 = 40 + trip * 250;
    const y2 = 90 - trip * 60;
    const dash = ["2 4", "", "8 4", "2 4"][lineK];
    m += `<path d="M40 90 Q ${r1((40 + x2) / 2)} ${r1(30 + y2 / 3)} ${r1(x2)} ${r1(y2)}" fill="none" stroke="${S.red}" stroke-width="2.5"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
    if (lineK === 3) m += emo(k, x2, y2 - 4, "✈️", 14);
    for (let i = 1; i <= stops; i++) {
      const t = i / (stops + 1);
      m += circ(40 + (x2 - 40) * t, 90 + (y2 - 90) * t - 18 * Math.sin(t * Math.PI), 3.5, S.red);
    }
    m += circ(40, 90, 4, S.gold) + timer(k, 296, 20, secs / 10);
    out += `<g transform="translate(${mx} ${my}) scale(${sc})" opacity="${over === 1 ? 0.55 : 1}">${m}</g>`;
    if (over === 2) out += rect(mx, my, 320 * sc, 120 * sc, "none", ` stroke="#fff" stroke-width="1"`);
    out += strip(k, [g.num("trip", "How far", ""), g.word("mapLook", "Map"), g.word("line", "Line"), g.num("seconds", "On screen", "s"), g.word("over", "Placed"), g.num("stops", "Stops", "")]);
    return out + k.caption(`${v("mapLook")}, ${stops} stop${stops === 1 ? "" : "s"}`);
  });
  /* A small clock face showing a share of a whole. */
  function timer(k, x, y, p, color) {
    return `<circle cx="${x}" cy="${y}" r="9" fill="#2a2a33" stroke="#666"/>` + (p > 0.001 ? k.pie({ x, y, r: 8, p: k.clamp(p, 0, 0.999), color: color || S.gold }) : "");
  }

  /* ======================= toldBackwards ======================= */
  /* Scenes laid on a timeline in the order we see them: arrows run from the end back toward the start. */
  look("toldBackwards", (v, k, g) => {
    const back = v.n("backwards") / 5;
    const steps = idx(v, "steps", 4);
    const startsAt = idx(v, "startsAt", 4);
    const forward = idx(v, "forward", 3);
    const signs = idx(v, "signs", 4);
    const endsOn = idx(v, "endsOn", 4);
    let out = k.bg(S.bg) + timeline(k, 60);
    out += k.label({ x: 20, y: 76, text: "start", size: 8, color: "#999", anchor: "start" }) + k.label({ x: 300, y: 76, text: "end", size: 8, color: "#999", anchor: "end" });
    const startX = [296, 250, 220, 180][startsAt];
    const n = 6;
    const span = (startX - 30) * (0.3 + back * 0.7);
    const gapMul = [0.5, 0.75, 1, 1.25][steps];
    let prev = null;
    for (let i = 0; i < n; i++) {
      const isFwd = (forward === 1 && i === 3) || (forward === 2 && i % 2 === 1);
      const x = isFwd && prev != null ? Math.min(296, prev + 26) : startX - (span / (n - 1)) * i * gapMul;
      const xx = k.clamp(x, 24, 296);
      out += shot(xx - 10, 34, 20, 16, i === 0 ? S.red : i === n - 1 ? S.green : isFwd ? S.blue : S.gold);
      out += k.label({ x: xx, y: 46, text: String(i + 1), size: 8, color: "#fff" });
      if (signs >= 1) out += k.label({ x: xx, y: 28, text: ["", "·", "day " + (n - i), "◀"][signs], size: 7, color: "#aaa" });
      if (prev != null) out += k.arrow({ x1: prev, y1: 92 - (i % 2) * 6, x2: xx, y2: 92 - (i % 2) * 6, color: isFwd ? S.blue : S.purple, w: 1.2 });
      prev = xx;
    }
    out += emo(k, Math.max(24, prev), 108, ["🤝", "🌱", "😊", "🤥"][endsOn], 14);
    out += strip(k, [g.num("backwards", "Backwards", ""), g.steps("steps", "Steps"), g.word("startsAt", "Starts"), g.steps("forward", "Forward"), g.steps("signs", "Signs"), g.word("endsOn", "Ends on")]);
    return out + k.caption(`From ${v("startsAt")}, back by ${v("steps")}`);
  });

  /* ======================= flashForward ======================= */
  /* A timeline with the glimpse pulled from the future and placed at the start; where we catch up, and if it lied. */
  look("flashForward", (v, k, g) => {
    const glimpse = v.n("glimpse") / 5;
    const shows = idx(v, "shows", 5);
    const jump = idx(v, "jump", 4);
    const clear = idx(v, "clear", 4);
    const catchUp = idx(v, "catchUp", 4);
    const twist = idx(v, "twist", 3);
    let out = k.bg(S.bg) + timeline(k, 70);
    const w = 8 + glimpse * 50;
    out += shot(24, 40, w, 22, S.purple) + op(0.3 + clear * 0.23, emo(k, 24 + w / 2, 56, ["🎉", "💥", "⚰️", "🏝️", "🆘"][shows], 12));
    if (clear === 0) out += k.tint({ color: S.bg, alpha: 0 }) + op(0.5, rect(24, 40, w, 22, "#9b6bb5"));
    if (clear === 1) for (let i = 0; i < 3; i++) out += line(24 + (w * (i + 1)) / 4, 40, 24 + (w * (i + 1)) / 4, 62, S.bg, 2);
    const fx = [90, 160, 230, 296][jump];
    out += `<path d="M${r1(fx)} 64 Q ${r1((fx + 24 + w / 2) / 2)} 4 ${r1(24 + w / 2)} 38" fill="none" stroke="${S.purple}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    out += circ(fx, 70, 4, S.purple);
    const cx = [80, 160, 260, 300][catchUp];
    out += catchUp === 3 ? emo(k, 300, 98, "∞", 12) : circ(cx, 70, 5, S.gold) + k.label({ x: cx, y: 92, text: "caught up", size: 7, color: S.gold });
    out += emo(k, 290, 24, ["✔️", "〰️", "🔄"][twist], 14);
    out += strip(k, [g.num("glimpse", "Glimpse", ""), g.word("shows", "Shows"), g.steps("jump", "Ahead"), g.steps("clear", "Clear"), g.word("catchUp", "Catch up"), g.word("twist", "True?")]);
    return out + k.caption(`A glimpse of ${v("shows")}, ${v("jump")} ahead`);
  });

  /* ======================= sameMomentAgain ======================= */
  /* One moment drawn as a frame, then again from another side, with what the second look shows. */
  look("sameMomentAgain", (v, k, g) => {
    const again = v.n("again") / 5;
    const times = Math.round(v.n("times"));
    const from = idx(v, "fromWhere", 4);
    const gap = idx(v, "gap", 4);
    const newSide = idx(v, "newSide", 4);
    const marked = idx(v, "marked", 4);
    let out = k.bg(S.bg) + timeline(k, 108);
    const w = 270 / times - 6;
    for (let i = 0; i < times; i++) {
      const x = 24 + i * (w + 6) * (i === 0 ? 1 : 1 + 0 * gap);
      out += shot(x, 18, w, 62, i === 0 ? S.gold : S.purple);
      const flip = i === 0 ? 1 : -1;
      out += k.person({ x: x + w / 2 - 12 * flip, y: 74, s: 0.35, color: S.gold, mood: i === 0 ? 0.3 : 0.3 - again, look: flip * 0.5 });
      out += k.person({ x: x + w / 2 + 12 * flip, y: 74, s: 0.35, color: S.blue, mood: 0, look: -flip * 0.5 });
      if (i > 0) {
        out += emo(k, x + 8, 30, ["👀", "📐", "📹", "💭"][from], 10);
        out += op(again, emo(k, x + w - 10, 32, ["🔍", "🙈", "❓", "🔄"][newSide], 10));
        if (from === 2) out += circ(x + w - 6, 22, 2, S.red);
        if (from === 3) out += op(0.4, rect(x, 18, w, 62, S.purple));
      }
    }
    const gx = [60, 120, 200, 290][gap];
    out += line(24, 108, 24, 100, S.gold, 2) + line(gx, 108, gx, 100, S.purple, 2);
    out += k.label({ x: 160, y: 96, text: ["", "⏪", "AGAIN", "“same line”"][marked], size: 8, color: "#ccc" });
    out += strip(k, [g.num("again", "Changes", ""), g.num("times", "Times", ""), g.word("fromWhere", "From"), g.steps("gap", "Comes back"), g.steps("newSide", "Shows"), g.word("marked", "Marked")]);
    return out + k.caption(`Seen ${times} times, from ${v("fromWhere")}`);
  });

  /* ======================= falseEnding ======================= */
  /* A tension line that drops to rest as if it is over, waits, then jumps back up. */
  look("falseEnding", (v, k, g) => {
    const fake = v.n("fake") / 5;
    const signs = idx(v, "signs", 4);
    const wait = v.n("wait") / 120;
    const comes = idx(v, "comesBack", 5);
    const tone = idx(v, "tone", 4);
    const after = idx(v, "after", 3);
    let out = k.bg(S.bg) + line(20, 100, 300, 100, "#444", 1);
    const low = 96 - (1 - fake) * 40;
    const x1 = 110;
    const x2 = x1 + 20 + wait * 90;
    const up = [20, 40, 50, 60][tone];
    const rise = tone === 1 ? `L${r1(x2 + 40)} ${up}` : `L${r1(x2 + 4)} ${up}`;
    const tail = after === 0 ? `L${r1(x2 + 70)} 96 L300 96` : after === 1 ? `L${r1(x2 + 60)} ${low} L${r1(x2 + 80)} ${low} L300 ${up}` : `L300 ${up}`;
    out += `<path d="M20 90 L60 40 L90 20 L${x1} ${r1(low)} L${r1(x2)} ${r1(low)} ${rise} ${tail}" fill="none" stroke="${S.gold}" stroke-width="2"/>`;
    out += rect(x1, low - 2, x2 - x1, 4, S.green, ' opacity="0.4"');
    out += k.label({ x: (x1 + x2) / 2, y: low - 8, text: ["(quiet)", "♪♪♪", "fade", "THE END"][signs], size: 8, color: "#ccc" });
    if (signs === 2) out += rect(x1, 10, x2 - x1, 90, "#000", ' opacity="0.5"');
    out += emo(k, x2 + 18, Math.max(16, up - 6), ["😈", "⚠️", "❗", "🤫", "😂"][comes], 14);
    out += emo(k, 300, 20, ["😱", "😨", "😄", "😢"][tone], 12);
    out += strip(k, [g.num("fake", "Convincing", ""), g.steps("signs", "Signs"), g.num("wait", "Wait", "s"), g.word("comesBack", "Comes back"), g.word("tone", "Restart"), g.word("after", "After")]);
    return out + k.caption(`It seems over... then ${v("comesBack")}`);
  });

  /* ======================= toldBySomeone ======================= */
  /* The teller and listener on the left, the story in a frame on the right; trust shows as the frame cracking. */
  look("toldBySomeone", (v, k, g) => {
    const teller = v.n("teller") / 5;
    const who = idx(v, "who", 5);
    const listener = idx(v, "listener", 5);
    const trust = idx(v, "trust", 4);
    const breaks = idx(v, "breaks", 4);
    const ends = idx(v, "endsWith", 4);
    let out = room(k, 96);
    const tw = 70 + teller * 40;
    out += rect(0, 0, tw, 120, "#2a2630");
    out += k.person({ x: 30, y: 112, s: 0.55, color: who === 0 ? S.purple : S.gold, mood: trust === 3 ? -0.3 : 0.3, alpha: ends === 3 ? 0.35 : 1 });
    out += emo(k, 30, 20, ["👵", "👀", "👨‍👧", "🚓", "🧳"][who], 12);
    if (listener > 0) out += k.person({ x: tw - 22, y: 112, s: [0.5, 0.35, 0.5, 0.55, 0.4][listener], color: [S.blue, S.green, S.blue, S.red, S.grey][listener], mood: ends === 2 ? 0.7 : 0, look: -0.6 });
    if (listener === 4) out += k.person({ x: tw - 40, y: 112, s: 0.35, color: S.grey }) + k.person({ x: tw - 6, y: 112, s: 0.35, color: S.grey });
    const fx = tw + 10;
    const fw = 310 - fx;
    out += shot(fx, 14, fw, 76, S.gold) + k.person({ x: fx + fw / 2, y: 84, s: 0.45, color: S.gold, mood: 0.4 });
    for (let i = 0; i < trust; i++) out += line(fx + fw * (0.2 + i * 0.25), 14, fx + fw * (0.3 + i * 0.25), 50, S.red, 1.2);
    out += k.arrow({ x1: 46, y1: 50, x2: fx - 2, y2: 50, color: S.purple, w: 1.2 });
    if (breaks >= 1) out += k.bubble({ x: fx + fw / 2, y: 30, text: ["", "...and then", "No, wait!", "It was blue"][breaks], w: 56 });
    if (ends === 1) out += emo(k, 30, 40, "💡", 12);
    out += strip(k, [g.num("teller", "Teller seen", ""), g.word("who", "Teller"), g.word("listener", "Listener"), g.steps("trust", "Trust"), g.steps("breaks", "Breaks in"), g.word("endsWith", "Ends")]);
    return out + k.caption(`${v("who")} tells it to ${v("listener")}`);
  });

  /* ======================= allIsLost ======================= */
  /* The hero's road across the film with the lowest point placed and held; who is with them and what lifts them. */
  look("allIsLost", (v, k, g) => {
    const lost = v.n("lost") / 5;
    const when = v.n("when") / 100;
    const what = idx(v, "what", 6);
    const alone = idx(v, "alone", 3);
    const length = v.n("length") / 10;
    const spark = idx(v, "spark", 4);
    let out = k.bg(S.bg) + timeline(k, 112);
    const lx = 20 + when * 280;
    const ly = 50 + lost * 50;
    const hold = length * 30;
    out += `<path d="M20 60 L${r1(lx * 0.5)} 30 L${r1(lx - 10)} 50 L${r1(lx)} ${r1(ly)} L${r1(lx + hold)} ${r1(ly)} L${r1(Math.min(300, lx + hold + 30))} 20" fill="none" stroke="${S.gold}" stroke-width="2"/>`;
    out += circ(lx, ly, 4, S.red) + emo(k, lx, ly - 12, ["📋", "👤", "🧓", "🙏", "💔", "🕳️"][what], 12);
    if (alone < 2) out += circ(lx + 10, ly + 2, 3, S.blue);
    if (alone < 1) out += circ(lx + 18, ly + 2, 3, S.blue) + circ(lx - 10, ly + 2, 3, S.blue);
    out += emo(k, Math.min(296, lx + hold + 12), 30, ["💭", "🤝", "🌱", "🚶"][spark], 12);
    out += line(lx, 116, lx, 108, S.red, 2) + k.label({ x: lx, y: 104, text: Math.round(when * 100) + "%", size: 7, color: "#ccc" });
    out += strip(k, [g.num("lost", "Lost", ""), g.num("when", "When", "%"), g.word("what", "What"), g.steps("alone", "Alone"), g.num("length", "Stays", " min"), g.word("spark", "Lifted by")]);
    return out + k.caption(`The bottom at ${Math.round(when * 100)}%: ${v("what")}`);
  });

  /* ======================= calmBeforeStorm ======================= */
  /* A flat, quiet stretch on the road before a big spike; what fills it, who knows, and how it breaks. */
  look("calmBeforeStorm", (v, k, g) => {
    const calm = v.n("calm") / 5;
    const fills = idx(v, "fills", 6);
    const length = v.n("length") / 10;
    const knows = idx(v, "knows", 4);
    const sign = idx(v, "sign", 4);
    const breaks = idx(v, "breaks", 3);
    let out = k.bg(S.bg) + timeline(k, 112);
    const x1 = 80;
    const x2 = x1 + 30 + length * 140;
    const flat = 80 + calm * 10;
    const brk = [50, 18, 2][breaks];
    out += `<path d="M20 60 L${x1} ${r1(flat)} L${r1(x2)} ${r1(flat)} L${r1(x2 + brk)} 14 L300 20" fill="none" stroke="${S.gold}" stroke-width="2"/>`;
    out += rect(x1, flat - 30, x2 - x1, 30, S.green, ` opacity="${r1((0.1 + calm * 0.2) * 100) / 100}"`);
    out += emo(k, (x1 + x2) / 2, flat - 10, ["🍲", "💬", "😄", "😴", "🎒", "🏡"][fills], 14);
    if (knows === 1 || knows === 3) out += k.person({ x: x1 + 12, y: flat - 2, s: 0.25, color: S.blue, mood: -0.4 });
    if (knows >= 2) out += emo(k, x2 - 10, flat - 30, "👁️", 10);
    if (sign >= 1) out += op(0.6, emo(k, x2 - 30, 30, ["", "🥁", "☁️", "⏰"][sign], 12));
    out += strip(k, [g.num("calm", "Calm", ""), g.word("fills", "Filled with"), g.num("length", "Lasts", " min"), g.word("knows", "Who knows"), g.steps("sign", "Signs"), g.steps("breaks", "Breaks")]);
    return out + k.caption(`${v("fills")} before the storm`);
  });

  /* ======================= smallWin ======================= */
  /* A falling road with one small step up in the middle; its size, price, who shares it and how long it lasts. */
  look("smallWin", (v, k, g) => {
    const win = v.n("win") / 5;
    const kind = idx(v, "kind", 5);
    const size = idx(v, "size", 3);
    const cost = idx(v, "cost", 3);
    const shared = idx(v, "shared", 3);
    const lasting = idx(v, "lasting", 3);
    let out = k.bg(S.bg) + timeline(k, 112);
    const bump = (size + 1) * 8 + win * 8;
    const hold = [10, 40, 140][lasting];
    const after = Math.min(300, 150 + hold);
    out += `<path d="M20 30 L140 80 L150 ${r1(80 - bump)} L${r1(after)} ${r1(80 - bump + (lasting === 2 ? -10 : 0))} L${r1(Math.min(300, after + 20))} ${lasting === 2 ? 40 : 96} L300 ${lasting === 2 ? 30 : 100}" fill="none" stroke="${S.gold}" stroke-width="2"/>`;
    out += circ(150, 80 - bump, 4 + win * 3, S.green) + emo(k, 150, 70 - bump - 6, ["💬", "🎯", "🚪", "🔍", "🤝"][kind], 12);
    for (let i = 0; i < shared; i++) out += circ(164 + i * 8, 84 - bump, 3, S.blue);
    if (cost >= 1) out += emo(k, 136, 98, cost === 2 ? "💸" : "🪙", 10);
    out += strip(k, [g.num("win", "Matters", ""), g.word("kind", "Win"), g.steps("size", "Size"), g.steps("cost", "Cost"), g.steps("shared", "Shared"), g.steps("lasting", "Lasts")]);
    return out + k.caption(`A small win: ${v("kind")}`);
  });

  /* ======================= doomedFromStart ======================= */
  /* The known bad end marked early on the timeline; happy bumps along the way, and how the real end lands. */
  look("doomedFromStart", (v, k, g) => {
    const doom = v.n("doom") / 5;
    const told = idx(v, "told", 5);
    const whenTold = idx(v, "whenTold", 3);
    const joy = Math.round(v.n("joy"));
    const hopeLeft = idx(v, "hopeLeft", 3);
    const ending = idx(v, "ending", 4);
    let out = k.bg(S.bg) + timeline(k, 100);
    const tx = [26, 80, 160][whenTold];
    out += line(tx, 100, tx, 20, S.red, 1.5, "3 2") + emo(k, tx, 16, ["🔤", "🎬", "🗣️", "📰", "🔮"][told], 12);
    out += k.arrow({ x1: tx + 6, y1: 24, x2: 292, y2: 24, color: k.mix("#555555", "#e4572e", doom), w: 1 + doom * 2 });
    let d = "M20 70";
    for (let i = 0; i < joy; i++) {
      const x = 30 + (i * 220) / Math.max(1, joy);
      d += ` L${r1(x)} 70 L${r1(x + 6)} 52 L${r1(x + 12)} 70`;
    }
    const hopeY = [70, 60, 40][hopeLeft];
    d += ` L250 ${hopeY} L290 ${[90, 98, 78, 70][ending]}`;
    out += `<path d="${d}" fill="none" stroke="${S.gold}" stroke-width="1.5"/>`;
    out += emo(k, 300, 90, ["⚰️", "💀", "❓", "🌤️"][ending], 12);
    out += strip(k, [g.num("doom", "Sure", ""), g.word("told", "How we know"), g.steps("whenTold", "When"), g.num("joy", "Happy bits", ""), g.steps("hopeLeft", "Hope"), g.word("ending", "Ends")]);
    return out + k.caption(`We know from ${v("whenTold")}: ${v("told")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
