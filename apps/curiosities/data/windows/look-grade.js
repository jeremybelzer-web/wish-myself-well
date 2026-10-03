/* Grade: the live picture at the top of each grade curiosity's window (CuriosityWindows.look).
   Each picture is the light category's test room (a wall, a window, a lamp, a plant and a person) run through
   an SVG color filter built from the settings. It uses the shared helpers in look-light.js
   (CuriosityWindows.lightLook), read when a picture is drawn, so the two files can load in either order. */
(function (W) {
  const r1 = (n) => Math.round(n * 10) / 10;
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const LLx = () => W.lightLook;

  /* Ready-made looks, as offsets from a plain picture. warm -1..1, sat (1 normal), contrast, lift, cap, bright,
     sepia, blur, split [shadow hue, highlight hue, amount]. */
  const LOOKS = {
    none: {},
    natural: { sat: 1.08, contrast: 0.08 },
    "warm film": { warm: 0.5, lift: 0.06, sat: 0.9 },
    "cool film": { warm: -0.5, lift: 0.05, sat: 0.9 },
    "black and white": { sat: 0, contrast: 0.25 },
    vintage: { sepia: 0.5, lift: 0.12, sat: 0.7, cap: 0.08 },
    faded: { lift: 0.3, cap: 0.1, sat: 0.6 },
    "high contrast": { contrast: 0.7, sat: 1.2 },
    "teal and orange": { split: [180, 28, 0.9], sat: 1.2, contrast: 0.1 },
    pastel: { lift: 0.22, sat: 0.75, bright: 0.08 },
    night: { warm: -0.8, bright: -0.35, sat: 0.5 },
    dreamy: { blur: 1.2, bright: 0.1, lift: 0.1 },
    "film stock": { contrast: 0.2, lift: 0.05, warm: 0.15, sat: 0.95 },
    "bleach bypass": { sat: 0.4, contrast: 0.5 },
    "day for night": { warm: -0.9, bright: -0.4, sat: 0.4 },
    "warm print": { warm: 0.6, contrast: 0.1 },
    "cool print": { warm: -0.6, contrast: 0.1 },
    "log to normal": { contrast: 0.45, sat: 1.4 },
    featured: { contrast: 0.15, sat: 1.15, warm: 0.1 },
    life: { warm: 0.25, bright: 0.05 },
    landscape: { sat: 1.35, contrast: 0.2 },
    portrait: { warm: 0.2, lift: 0.06, sat: 0.9 },
    mono: { sat: 0, contrast: 0.1 },
    movies: { split: [180, 28, 0.7], contrast: 0.2 },
    retro: { sepia: 0.4, lift: 0.12 },
    cool: { warm: -0.5 },
    warm: { warm: 0.5 },
  };
  /* A look at strength s (0..1), plus extra offsets x, as LL.fx options. */
  function fxOf(o, s, x) {
    const LL = LLx();
    o = o || {};
    x = x || {};
    const sat = (1 + ((o.sat == null ? 1 : o.sat) - 1) * s) * (x.sat == null ? 1 : x.sat);
    const curve = x.curve || LL.curve({ contrast: (o.contrast || 0) * s + (x.contrast || 0), lift: cl((o.lift || 0) * s + (x.lift || 0), 0, 1), cap: cl((o.cap || 0) * s + (x.cap || 0), 0, 1), bright: (o.bright || 0) * s + (x.bright || 0), crush: x.crush || 0, clip: x.clip || 0, mid: x.mid || 0 });
    const tone = (y) => {
      const w = LL.warmRGB((o.warm || 0) * s + (x.warm || 0));
      let sp = [0, 0, 0];
      if (o.split) {
        const a = LL.hueRGB(o.split[0], o.split[2] * s * (1 - y) * 1.3);
        const b = LL.hueRGB(o.split[1], o.split[2] * s * y * 1.1);
        sp = [0, 1, 2].map((i) => a[i] + b[i]);
      }
      const t = x.tone ? x.tone(y) : [0, 0, 0];
      return [0, 1, 2].map((i) => w[i] + sp[i] + t[i]);
    };
    return { sat, curve, tone, sepia: cl((o.sepia || 0) * s + (x.sepia || 0), 0, 1), blur: (o.blur || 0) * s + (x.blur || 0) };
  }
  const ROOM = { room: { lamp: { on: 0.85 } }, bust: { key: { dark: 0.45 } } };
  const scene = (k, id, grade, extra) => LLx().scene(Object.assign({}, ROOM, extra || {}, { grade }), k, id);
  /* The face as the camera saw it, laid over a graded picture: "keep skin natural". */
  const keepFace = (k, id, amt, extra) => (amt > 0.01 ? `<clipPath id="${id}-kf"><circle cx="160" cy="80" r="27"/></clipPath><g clip-path="url(#${id}-kf)" opacity="${r1(cl(amt, 0, 1) * 100) / 100}">${scene(k, id + "-kfs", null, extra)}</g>` : "");
  /* A small picture of a look at full strength, with its name. */
  const thumb = (k, id, x, y, sc, grade, name) => `<rect x="${x - 3}" y="${y - 3}" width="${r1(320 * sc + 6)}" height="${r1(180 * sc + 16)}" rx="4" fill="#141418" opacity="0.9"/><g transform="translate(${x} ${y}) scale(${sc})">${scene(k, id, grade)}</g>${k.label({ x: x + (320 * sc) / 2, y: y + 180 * sc + 10, text: name, size: 8, color: "#eee" })}`;
  /* A fade envelope: off, fades in, holds, fades out, around a cut mark. */
  const envelope = (k, o) => {
    const LL = LLx();
    const { x, y, w, h } = o;
    const cut = x + w * 0.25 + (o.lead || 0) * w * 0.12;
    const a = cut;
    const b = a + Math.max(1, (o.fin || 0) * w * 0.3);
    const d = x + w * 0.95;
    const c = d - Math.max(1, (o.fout || 0) * w * 0.3);
    const top = y + 2;
    const bot = y + h;
    const wob = o.wobble || 0;
    const mid = wob ? Array.from({ length: 8 }, (_, i) => `${r1(b + ((c - b) * (i + 1)) / 9)},${r1(top + 3 + Math.sin(i * 1.7) * wob * 5)}`).join(" ") : "";
    return `${LL.box(x - 6, y - 14, w + 12, h + 24)}${k.label({ x: x - 1, y: y - 4, text: o.title || "", size: 8, anchor: "start", color: "#ccc" })}<line x1="${r1(x + w * 0.25)}" y1="${top - 2}" x2="${r1(x + w * 0.25)}" y2="${bot}" stroke="#e85d75" stroke-dasharray="2 2"/>${k.label({ x: x + w * 0.25, y: bot + 8, text: "cut", size: 7, color: "#e85d75" })}<polyline points="${x},${bot} ${r1(a)},${bot} ${r1(b)},${top} ${mid} ${r1(c)},${top} ${r1(d)},${bot} ${x + w},${bot}" fill="none" stroke="#ffd166" stroke-width="2"/>`;
  };
  /* A row of boxes, the first n filled: "this clip, the scene, the whole film". */
  const reach = (k, x, y, labels, n) => labels.map((t, i) => `<rect x="${x + i * 36}" y="${y}" width="34" height="12" rx="2" fill="${i <= n ? "#ffd166" : "#333"}" stroke="#555"/>${k.label({ x: x + i * 36 + 17, y: y + 9, text: t, size: 7, color: i <= n ? "#111" : "#aaa" })}`).join("");
  const idx = (v, sid) => LLx().idx(v, sid);

  /* ================= the pictures ================= */

  /* A ready-made filter: the look, how strong, extra punch, skin kept, and how it fades in and out at the cut. */
  W.look("filterLook", (v, k) => {
    const LL = LLx();
    const id = "cw-filterLook";
    const name = v("setting");
    const o = LOOKS[name] || {};
    const s = v.p("strength");
    const punch = v.n("punch") / 50;
    const keep = idx(v, "keepSkin") / 2;
    const g = fxOf(o, s, { contrast: punch * 0.35, sat: 1 + punch * 0.35 });
    return `${scene(k, id, g)}${keepFace(k, id, keep)}${keep ? k.ring({ x: 160, y: 80, r: 30, color: "#9fe0a0", dash: "3 2", w: 1.5 }) : ""}${thumb(k, id + "-t", 246, 10, 0.2, fxOf(o, 1), name)}${reach(k, 6, 8, ["clip", "scene", "film"], idx(v, "scope"))}${envelope(k, { x: 18, y: 112, w: 110, h: 24, fin: v.n("fadeIn") / 10, fout: v.n("fadeOut") / 10, lead: v.n("cutLead") / 2, wobble: idx(v, "followsMood"), title: "strength over time" })}${LL.chip(k, 236, 150 - 4, "mood: " + v("followsMood"))}${LLx().caption(k, `${name} at ${v.n("strength")}%${punch ? `, punch ${punch > 0 ? "+" : ""}${v.n("punch")}` : ""}`)}`;
  });

  /* An old-media look: era, wear, shake, flicker, faded color, choppy frames, and flashes. */
  W.look("retroEffect", (v, k) => {
    const LL = LLx();
    const id = "cw-retroEffect";
    const kind = v("setting");
    const none = kind === "none";
    const era = idx(v, "era"); // 1920s .. 2000s
    const eraLook = [{ sat: 0, sepia: 0.6, contrast: 0.2 }, { sat: 0.6, lift: 0.08 }, { warm: 0.4, sat: 0.8, lift: 0.1 }, { split: [300, 28, 0.25], sat: 1.15 }, { warm: -0.15, sat: 1.1, lift: 0.05 }, { sat: 1.05 }][era];
    const fade = idx(v, "colorFade") / 3;
    const wear = v.p("wear");
    const jit = idx(v, "jitter");
    const flick = v.p("flicker");
    const chop = idx(v, "choppy");
    const shake = v.n("shakePx") * (0.25 + jit * 0.35);
    const kinds = { "VHS tape": { blur: 0.6, sat: 1.2 }, "retro film": { sepia: 0.3 }, projector: { contrast: 0.2 }, "retro flicker": {}, "nostalgic light": { warm: 0.5, bright: 0.08 }, "chalk graffiti": { contrast: 0.2 }, "white noise": {}, "black noise": {}, "pink burn": { warm: 0.3 }, "old film": { sepia: 0.6, contrast: 0.2 }, "home video": { warm: 0.2, sat: 0.85 }, none: {} }[kind];
    const merged = Object.assign({}, eraLook, kinds, { sat: (eraLook.sat == null ? 1 : eraLook.sat) * (kinds.sat == null ? 1 : kinds.sat) * (1 - fade * 0.85) });
    const g = fxOf(merged, none ? 0.45 : 1, { bright: -flick * 0.12, lift: fade * 0.18 });
    const base = scene(k, id, g);
    const ghost = shake > 0.2 ? `<g opacity="0.35" transform="translate(${r1(-shake)} ${r1(shake * 0.5)})">${scene(k, id + "-gh", g)}</g>` : "";
    const scratches = Array.from({ length: Math.round(wear * 14) }, (_, i) => `<line x1="${r1(k.rnd(i + 3) * 320)}" y1="0" x2="${r1(k.rnd(i + 3) * 320 + 2)}" y2="162" stroke="#f4f0e6" stroke-width="0.8" opacity="0.6"/>`).join("") + Array.from({ length: Math.round(wear * 40) }, (_, i) => `<circle cx="${r1(k.rnd(i + 50) * 320)}" cy="${r1(k.rnd(i + 90) * 160)}" r="${r1(0.6 + k.rnd(i) * 1.4)}" fill="${i % 3 ? "#111" : "#eee"}" opacity="0.6"/>`).join("");
    const flickS = flick ? `<rect x="0" y="0" width="320" height="180" fill="#fff" opacity="${r1(flick * 0.22 * 100) / 100}"/>` : "";
    const extra = {
      "VHS tape": `${Array.from({ length: 40 }, (_, i) => `<rect x="0" y="${i * 4.5}" width="320" height="1.2" fill="#000" opacity="0.22"/>`).join("")}<rect x="0" y="120" width="320" height="5" fill="#fff" opacity="0.25"/>${k.text({ x: 14, y: 30, text: "PLAY ▶", size: 11, anchor: "start", color: "#fff", font: "monospace" })}`,
      projector: `<defs><radialGradient id="${id}-pj"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></radialGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-pj)"/>`,
      "retro flicker": `<rect x="0" y="0" width="320" height="180" fill="#fff" opacity="0.18"/>`,
      "nostalgic light": `<circle cx="60" cy="40" r="80" fill="#ffd27a" opacity="0.25"/>`,
      "chalk graffiti": `<g fill="none" stroke="#fff" stroke-width="2.5" opacity="0.85" stroke-linecap="round"><path d="M190 40 q10 -14 20 0 t20 0"/><path d="M60 130 l20 -16 l10 18 l16 -20"/><circle cx="250" cy="120" r="12"/></g>`,
      "white noise": Array.from({ length: 160 }, (_, i) => `<rect x="${r1(k.rnd(i + 7) * 320)}" y="${r1(k.rnd(i + 70) * 180)}" width="2" height="2" fill="#fff" opacity="0.7"/>`).join(""),
      "black noise": Array.from({ length: 160 }, (_, i) => `<rect x="${r1(k.rnd(i + 7) * 320)}" y="${r1(k.rnd(i + 70) * 180)}" width="2" height="2" fill="#000" opacity="0.7"/>`).join(""),
      "pink burn": `<defs><radialGradient id="${id}-pb" cx="1" cy="0" r="0.9"><stop offset="0" stop-color="#ff5fa2" stop-opacity="0.9"/><stop offset="0.5" stop-color="#ff9a3c" stop-opacity="0.4"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-pb)"/>`,
      "old film": `<rect x="0" y="0" width="320" height="180" fill="none" stroke="#000" stroke-width="10" opacity="0.6" rx="18"/>`,
      "home video": `${k.text({ x: 300, y: 150, text: "PM 3:12", size: 10, anchor: "end", color: "#ffd166", font: "monospace" })}${k.text({ x: 14, y: 30, text: "● REC", size: 10, anchor: "start", color: "#ff5050", font: "monospace" })}`,
      "retro film": "",
      none: "",
    }[kind];
    const strip = chop ? `<rect x="0" y="0" width="12" height="162" fill="#111"/>${Array.from({ length: 9 }, (_, i) => `<rect x="3" y="${4 + i * 18}" width="6" height="${chop === 2 ? 6 : 10}" fill="#ddd"/>`).join("")}` : "";
    const fr = v.n("flashRate");
    const fl = v.n("flashLength");
    const flashes = Array.from({ length: Math.min(30, Math.round(fr)) }, (_, i) => `<rect x="${r1(240 + (i / Math.max(1, fr)) * 68)}" y="140" width="${r1(Math.max(1, (fl / 10) * 16))}" height="8" fill="#fff" opacity="0.8"/>`).join("");
    return `${k.bg("#000")}${ghost}<g transform="translate(${r1(shake * 0.6)} 0)">${base}</g>${extra}${scratches}${flickS}${strip}${LL.box(232, 106, 82, 46)}${LL.ticks(k, 240, 124, 68, v.n("flickerRate"), "#fff", `flicker ${v.n("flickerRate")}/s`)}${k.label({ x: 240, y: 137, text: "flashes", size: 7, anchor: "start", color: "#ccc" })}<rect x="${r1(306 - Math.max(1, (fl / 10) * 16))}" y="130" width="${r1(Math.max(1, (fl / 10) * 16))}" height="4" fill="#fff" opacity="0.5"/><line x1="240" y1="144" x2="308" y2="144" stroke="#555"/>${flashes}${LL.chip(k, 6 + (chop ? 12 : 0), 160 - 14, v("showsUp"))}${LLx().caption(k, `${none ? "No retro look" : kind}, ${v("era")}, ${v("jitter")}`)}`;
  });

  /* Exposure: brighter or darker, highlights, shadows, blown-out whites and crushed blacks, and how the eye
     adjusts. */
  W.look("exposure", (v, k) => {
    const LL = LLx();
    const id = "cw-exposure";
    const word = idx(v, "setting") - 2;
    const bright = word * 0.14 + (v.n("stops") / 3) * 0.32 + (v.n("brightness") / 50) * 0.18;
    const hi = v.n("highlights") / 50;
    const sh = v.n("shadows") / 50;
    const curve = (x) => {
      let y = x + bright * 0.6;
      y += sh * (1 - x) * (1 - x) * 0.3 + hi * x * x * 0.3;
      return y;
    };
    const ws = v.p("whiteShare");
    const bs = v.p("blackShare");
    const read = idx(v, "faceReadable") / 2;
    const white = ws ? `<defs><radialGradient id="${id}-w"><stop offset="0.6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="50" cy="48" rx="${r1(30 + ws * 110)}" ry="${r1(26 + ws * 70)}" fill="url(#${id}-w)"/>` : "";
    const black = bs ? `<defs><radialGradient id="${id}-b" cx="1" cy="1" r="1"><stop offset="0.6" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect x="${r1(320 - bs * 150)}" y="${r1(180 - bs * 90)}" width="${r1(bs * 150)}" height="${r1(bs * 90)}" fill="url(#${id}-b)"/>` : "";
    const adj = idx(v, "adjust");
    const at = v.n("adjustTime") / 10;
    const pts = Array.from({ length: 21 }, (_, i) => {
      const t = i / 20;
      const span = Math.max(0.02, (adj === 0 ? 0.03 : [0, 0.2, 0.5, 0.9][adj]) * (0.3 + at * 0.7));
      return `${r1(240 + t * 68)},${r1(150 - 22 * (1 - Math.exp(-t / span * 2.5)) - 2)}`;
    }).join(" ");
    return `${scene(k, id, { curve, tone: () => [0, 0, 0] })}${keepFace(k, id, read * 0.85)}${white}${black}${LL.box(232, 112, 82, 46)}${k.label({ x: 238, y: 124, text: "eyes adjust", size: 8, anchor: "start", color: "#ccc" })}<polyline points="${pts}" fill="none" stroke="#ffd166" stroke-width="2"/>${read ? k.ring({ x: 160, y: 80, r: 30, color: "#9fe0a0", dash: "3 2", w: 1.5 }) : ""}${LLx().caption(k, `${v("setting")}, ${v.n("stops") > 0 ? "+" : ""}${v.n("stops")} stops, highlights ${v.n("highlights")}, shadows ${v.n("shadows")}`)}`;
  });

  /* White balance: warmer or cooler, green or magenta, warm light with cool shadows, faces kept natural. */
  W.look("whiteBalance", (v, k) => {
    const LL = LLx();
    const id = "cw-whiteBalance";
    const word = idx(v, "setting") - 2;
    const warm = word * 0.25 + ((v.n("temperature") - 5600) / 3600) * 0.6;
    const tintW = (idx(v, "tint") - 1) * 0.5 + (v.n("tintAmount") / 50) * 0.7;
    const split = idx(v, "splitTone") / 2 * 0.5 + v.p("splitAmount") * 0.5;
    const tone = (y) => {
      const w = LL.warmRGB(warm);
      const t = [tintW * 0.06, -tintW * 0.1, tintW * 0.06];
      const s1 = LL.warmRGB(-split * 0.9 * (1 - y) * 1.5);
      const s2 = LL.warmRGB(split * 0.6 * y * 1.5);
      return [0, 1, 2].map((i) => w[i] + t[i] + s1[i] + s2[i]);
    };
    const keep = idx(v, "skinNeutral") / 2;
    const match = v("matchTo");
    const ref = { "the camera's guess": "#bdbdbd", "the window": "#8cc0ea", "the lamps": "#ffb35c", "a mood choice": "#c26bff" }[match];
    const t = v.n("shiftTime");
    return `${scene(k, id, { tone })}${keepFace(k, id, keep * 0.85)}${keep ? k.ring({ x: 160, y: 80, r: 30, color: "#9fe0a0", dash: "3 2", w: 1.5 }) : ""}${LL.box(200, 6, 114, 24)}<rect x="206" y="12" width="12" height="12" fill="${ref}" stroke="#ddd"/>${k.label({ x: 222, y: 21, text: "set to " + match.replace(/^the /, ""), size: 8, anchor: "start", color: "#ddd" })}${k.meter({ x: 236, y: 150, w: 72, p: t / 30, label: `change in ${t} s` })}${LLx().caption(k, `${v("setting")}, ${v.n("temperature")} K, ${v("tint")} tint, ${v("splitTone")} split`)}`;
  });

  /* Texture: soft or gritty, sharpening, clarity, grain and its size, glow around lights, and a vignette whose
     center and reach you can move. */
  W.look("texture", (v, k) => {
    const LL = LLx();
    const id = "cw-texture";
    const word = idx(v, "setting");
    const sharp = v.p("sharpen") + [0, 0, 0.4, 0.7][word];
    const clar = v.n("clarity") / 50;
    const grain = v.p("grain") + (word === 3 ? 0.4 : 0);
    const gs = idx(v, "grainSize");
    const hal = v.p("halation");
    const vig = v.p("vignette");
    const vx = 60 + v.p("vignetteX") * 200;
    const vy = 40 + (1 - v.p("vignetteY")) * 90;
    const vr = v.p("vignetteReach");
    const move = idx(v, "vignetteMove");
    const a = r1(sharp * 0.9 * 100) / 100;
    const sharpF = `<filter id="${id}-sh" x="0" y="0" width="100%" height="100%"><feConvolveMatrix order="3" kernelMatrix="0 ${-a} 0 ${-a} ${r1((1 + 4 * a) * 100) / 100} ${-a} 0 ${-a} 0" preserveAlpha="true"/></filter>`;
    const g = { blur: word === 0 ? 1.1 : 0, curve: LL.curve({ contrast: clar * 0.35 }), sat: 1 + clar * 0.15 };
    const inner = scene(k, id, g);
    const halS = hal ? `<g fill="#ff7a4a" opacity="${r1(hal * 0.5 * 100) / 100}"><circle cx="262" cy="70" r="${r1(14 + hal * 18)}"/><rect x="${r1(18 - hal * 8)}" y="${r1(18 - hal * 8)}" width="${r1(64 + hal * 16)}" height="${r1(60 + hal * 16)}" rx="8"/></g>` : "";
    const grainS = grain > 0.01 ? Array.from({ length: Math.round(grain * 260) }, (_, i) => `<rect x="${r1(k.rnd(i + 11) * 320)}" y="${r1(k.rnd(i + 311) * 180)}" width="${[0.8, 1.5, 2.6][gs]}" height="${[0.8, 1.5, 2.6][gs]}" fill="${i % 2 ? "#fff" : "#000"}" opacity="0.35"/>`).join("") : "";
    const vigS = `<defs><radialGradient id="${id}-v" gradientUnits="userSpaceOnUse" cx="${r1(vx)}" cy="${r1(vy)}" r="${r1(120 + (1 - vr) * 140)}"><stop offset="${r1((0.75 - vr * 0.6) * 100) / 100}" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${r1(cl(0.1 + vig * 0.75, 0, 1) * 100) / 100}"/></radialGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-v)"/>${k.dot({ x: vx, y: vy, r: 2.5, color: "#ffd166" })}`;
    const moveS = move ? k.arrow({ x1: vx, y1: vy, x2: move === 1 ? 160 : 240, y2: move === 1 ? 80 : 130, color: "#ffd166", w: 1.5 }) : "";
    return `<defs>${sharpF}</defs><g filter="url(#${id}-sh)">${inner}</g>${halS}${grainS}${vigS}${moveS}${LLx().caption(k, `${v("setting")}, sharpen ${v.n("sharpen")}, ${v("grainSize")} grain ${v.n("grain")}, vignette ${v.n("vignette")}`)}`;
  });

  /* Matching shots: four shots in a row that drift apart or line up in brightness, color and contrast; the
     skin; where the match breaks; and how jumps are smoothed. */
  W.look("colorMatch", (v, k) => {
    const LL = LLx();
    const id = "cw-colorMatch";
    const word = idx(v, "setting"); // mismatched close matched deliberately different
    const close = v.p("closeness");
    const base = [0.15, 0.6, 1, 0][word];
    const match = cl(base * 0.7 + close * 0.3, 0, 1);
    const what = idx(v, "matchWhat"); // brightness color contrast everything
    const dims = [what === 0 || what === 3, what === 1 || what === 3, what === 2 || what === 3];
    const diff = (on) => (on ? 1 - match : 0.55) * (word === 3 ? 1.6 : 1);
    const skinI = idx(v, "skin");
    const skinCol = ["#9fb89a", "#e8b894", "#f0b890", "#f08a5a"][skinI];
    const brk = v("breakOn");
    const brkAt = { never: -1, "a time jump": 3, "a dream": 4, "a big turn": 2 }[brk];
    /* How far each shot of the scene drifts from the reference look (the first shot is the reference). */
    const D = [0, 0.9, -0.7, 0.5, -0.4, 0.8];
    const gradeOf = (off) => ({ curve: LL.curve({ bright: off * diff(dims[0]) * 0.25, contrast: off * diff(dims[2]) * 0.6 }), tone: () => LL.warmRGB(off * diff(dims[1]) * 0.8) });
    const shotAt = (x, y, sc, off, sid, extra) => `<g transform="translate(${x} ${y}) scale(${sc})">${LL.scene(Object.assign({ room: { lamp: { on: 0.85 } }, bust: { key: { dark: 0.45 }, skin: skinCol }, grade: gradeOf(off) }, extra || {}), k, sid)}</g>`;
    /* Big: the reference shot and the next shot side by side, the way a colorist checks a cut. */
    const refName = { "the shot before": "the shot before", "the scene's key shot": "the key shot", "an inspiration film": "the inspiration" }[v("reference")] || v("reference");
    const refExtra = /inspiration/.test(v("reference")) ? { room: { lamp: { on: 0.85 }, wall: "#7d8fa8" } } : null;
    let out = k.bg("#141418");
    out += shotAt(8, 20, 0.4563, 0, `${id}-ref`, refExtra) + `<rect x="8" y="20" width="146" height="82" fill="none" stroke="#ffd166" stroke-width="2"/>` + k.label({ x: 81, y: 14, text: `reference: ${refName}`, size: 8, color: "#ffd166" });
    out += shotAt(166, 20, 0.4563, D[1], `${id}-next`) + `<rect x="166" y="20" width="146" height="82" fill="none" stroke="#ccc" stroke-width="1.5"/>` + k.label({ x: 239, y: 14, text: "next shot", size: 8, color: "#ddd" });
    out += k.text({ x: 160, y: 66, text: match > 0.75 && word !== 3 ? "=" : "≠", size: 14, color: match > 0.75 && word !== 3 ? "#9fe0a0" : "#e85d75", weight: 700, outline: "#000" });
    /* Small: the scene's shots in order. Matching shots get a green tick; a break is ringed in red; smoothing
       blends each jump into the next shot over a short ramp. */
    const span = Math.round(v.n("matchSpan"));
    const ticks = Math.max(1, Math.round((span / 50) * 6));
    const smooth = idx(v, "smoothJumps");
    const st = v.n("smoothTime") / 5;
    D.forEach((di, i) => {
      const off = i === brkAt ? 1.5 : di;
      const x = 8 + i * 51;
      out += shotAt(x, 116, 0.1563, off, `${id}-s${i}`) + `<rect x="${x}" y="116" width="50" height="28" fill="none" stroke="${i === brkAt ? "#e85d75" : i === 0 ? "#ffd166" : "#000"}" stroke-width="1.5"/>`;
      if (i > 0 && smooth > 0) {
        const bw = (smooth === 1 ? 8 : 16) * (0.4 + st * 0.6);
        out += `<defs><linearGradient id="${id}-g${i}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect x="${x}" y="116" width="${r1(bw)}" height="28" fill="url(#${id}-g${i})"/>`;
      }
      if (i < ticks && i !== brkAt) out += k.label({ x: x + 44, y: 126, text: "✓", size: 9, color: "#9fe0a0", weight: 700 });
    });
    out += k.label({ x: 8, y: 112, text: `the scene, shot by shot · ${span} shot${span === 1 ? "" : "s"} match${span === 1 ? "es" : ""}`, size: 8, anchor: "start", color: "#aaa" });
    out += k.label({ x: 312, y: 112, text: brkAt >= 0 ? `break for ${brk}` : `smoothing ${v("smoothJumps")}, ${v.n("smoothTime")} s`, size: 8, anchor: "end", color: brkAt >= 0 ? "#e85d75" : "#aaa" });
    if (brkAt >= 0) out += k.label({ x: 160, y: 156, text: `smoothing ${v("smoothJumps")}, ${v.n("smoothTime")} s`, size: 8, color: "#aaa" });
    return out + LLx().caption(k, `${v("setting")} on ${v("matchWhat")}, ${v.n("closeness")}% close, skin ${v("skin")}`);
  });

  /* A texture laid over the picture: paper, grain, dots, two tones, a photo frame or old film, with edges,
     movement, how it sits and the paper's color. */
  W.look("textureEffect", (v, k) => {
    const LL = LLx();
    const id = "cw-textureEffect";
    const kind = v("setting");
    const s = v.p("strength");
    const a = 0.2 + s * 0.8;
    const blend = idx(v, "blend");
    const paper = { white: "#f6f4ef", cream: "#f1e6c8", yellowed: "#e6d08a", brown: "#a8845a" }[v("paperTint")];
    const g = kind === "dual tone" ? { sat: 0, tone: (y) => [0, 1, 2].map((i) => LL.hueRGB(320, 0.5 * a * (1 - y))[i] + LL.hueRGB(50, 0.5 * a * y)[i]) } : kind === "old film" ? { sepia: 0.6 * a } : kind === "polaroid" ? { lift: 0.1, curve: LL.curve({ lift: 0.12 * a }), sat: 0.85 } : {};
    let tex = "";
    if (kind === "grain") tex = Array.from({ length: Math.round(80 + a * 220) }, (_, i) => `<rect x="${r1(k.rnd(i + 5) * 320)}" y="${r1(k.rnd(i + 505) * 180)}" width="1.4" height="1.4" fill="${i % 2 ? "#fff" : "#000"}" opacity="0.4"/>`).join("");
    else if (kind === "silkscreen dots") tex = `<defs><pattern id="${id}-d" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="${r1(0.8 + a * 1.6)}" fill="#e0306a"/></pattern></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-d)" opacity="${r1(a * 0.6)}"/>`;
    else if (kind === "wrinkled paper") tex = `<g stroke="#000" stroke-width="1.2" opacity="${r1(a * 0.35)}" fill="none"><path d="M0 40 L90 70 L180 30 L320 80"/><path d="M60 0 L120 90 L100 180"/><path d="M220 0 L250 100 L200 180"/></g><rect x="0" y="0" width="320" height="180" fill="${paper}" opacity="${r1(a * 0.25)}"/>`;
    else if (kind === "torn paper") tex = `<path d="M0 0 L320 0 L320 22 ${Array.from({ length: 17 }, (_, i) => `L${320 - i * 20} ${r1(18 + k.rnd(i + 3) * 10)}`).join(" ")} L0 22 Z" fill="${paper}" opacity="${r1(0.4 + a * 0.6)}"/><rect x="0" y="0" width="320" height="180" fill="${paper}" opacity="${r1(a * 0.15)}"/>`;
    else if (kind === "polaroid") tex = `<path d="M0 0 H320 V180 H0 Z M14 10 H306 V138 H14 Z" fill="${paper}" fill-rule="evenodd" opacity="${r1(0.5 + a * 0.5)}"/>`;
    else if (kind === "old film") tex = Array.from({ length: Math.round(4 + a * 10) }, (_, i) => `<line x1="${r1(k.rnd(i + 3) * 320)}" y1="0" x2="${r1(k.rnd(i + 3) * 320 + 3)}" y2="180" stroke="#f4f0e6" stroke-width="0.8" opacity="0.6"/>`).join("");
    else if (kind === "dual tone") tex = "";
    const motion = idx(v, "motion");
    const texMoved = motion && tex ? tex + `<g opacity="0.35" transform="translate(${motion * 2} ${motion})">${tex.replace(/id="[^"]*"/g, "")}</g>` : tex;
    const ew = v.n("edgeWidth");
    const edge = idx(v, "edges");
    const edgeS = edge === 0 ? `<rect x="${r1(ew / 2)}" y="${r1(ew / 2)}" width="${r1(320 - ew)}" height="${r1(180 - ew)}" fill="none" stroke="${paper}" stroke-width="${ew}" opacity="0.9"/>` : edge === 1 ? `<path d="M0 0 H320 V180 H0 Z M${ew} ${ew} ${Array.from({ length: 16 }, (_, i) => `L${r1(ew + (i + 1) * ((320 - 2 * ew) / 16))} ${r1(ew + k.rnd(i + 9) * ew)}`).join(" ")} L${320 - ew} ${180 - ew} L${ew} ${180 - ew} Z" fill="${paper}" fill-rule="evenodd"/>` : `<defs><radialGradient id="${id}-bu"><stop offset="${r1((0.85 - ew / 40) * 100) / 100}" stop-color="#3a1a08" stop-opacity="0"/><stop offset="1" stop-color="#2a1004" stop-opacity="0.95"/></radialGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-bu)"/>`;
    /* How it sits: behind the person, mixed in, or over everything. */
    const sceneG = scene(k, id, g);
    const sceneNoPerson = LL.scene(Object.assign({}, ROOM, { bust: false, grade: g }), k, id + "-np");
    const person = LL.bust({ key: { dark: 0.45 } }, k, id + "-pp");
    const body = blend === 0 ? `${sceneNoPerson}${texMoved}${LL.graded(id + "-pg", g, person)}` : blend === 1 ? `${sceneG}<g opacity="0.55">${texMoved}</g>` : `${sceneG}${texMoved}`;
    const stack = `${LL.box(6, 6, 56, 46)}${["texture", "person", "room"].map((t, i) => `<rect x="12" y="${12 + i * 12}" width="44" height="10" rx="2" fill="${(blend === 2 && i === 0) || (blend === 0 && i === 1) || (blend === 1 && i === 0) ? "#ffd166" : "#444"}"/>${k.label({ x: 34, y: 20 + i * 12, text: blend === 0 ? ["person", "texture", "room"][i] : t, size: 7, color: "#111" })}`).join("")}`;
    const rate = v.n("changeRate");
    return `${body}${edgeS}${stack}${LL.box(232, 112, 82, 40)}${k.meter({ x: 238, y: 128, w: 68, p: s, label: `strength ${v.n("strength")}%` })}${LL.ticks(k, 238, 145, 68, Math.round(rate), "#ffd166", "")}${k.label({ x: 306, y: 150, text: `${rate}/s`, size: 7, anchor: "end", color: "#ccc" })}${motion ? LL.chip(k, 70, 18, v("motion")) : ""}${LL.chip(k, 6, 160 - 14 - 8, v("showsUp"))}${LLx().caption(k, `${kind === "none" ? "No texture" : kind}, ${v("edges")} edges, ${v("paperTint")} paper`)}`;
  });

  /* A filter from a shelf: the family, which one on the shelf, how strong, skin, and how alike the shots are. */
  W.look("filterFamily", (v, k) => {
    const LL = LLx();
    const id = "cw-filterFamily";
    const fam = v("setting");
    const o = LOOKS[fam] || {};
    const pick = Math.round(v.n("pick"));
    const vary = (pick - 6.5) / 5.5;
    const s = v.p("strength");
    const pickX = { warm: vary * 0.25, contrast: vary * 0.12 };
    const g = fxOf(o, s, { warm: pickX.warm * s, contrast: pickX.contrast * s });
    const keep = idx(v, "keepSkin") / 2;
    const famCol = { featured: "#ffd166", life: "#f2b36a", landscape: "#3fa55b", portrait: "#e8a080", mono: "#9a9a9a", movies: "#2a9d9a", retro: "#c8a070", night: "#3a4a8a", cool: "#6aa0ff", warm: "#ff8a3c" }[fam];
    const shelf = Array.from({ length: 12 }, (_, i) => {
      const x = 8 + i * 25;
      const c = LL.hueCss(0, 0, 0) && famCol;
      return `<rect x="${x}" y="10" width="22" height="16" rx="3" fill="${c}" opacity="${r1(0.35 + (i / 11) * 0.65)}" stroke="${i + 1 === pick ? "#fff" : "#222"}" stroke-width="${i + 1 === pick ? 2 : 1}"/>`;
    }).join("");
    const same = idx(v, "sameAcross");
    const shots = [0, 1, 2].map((i) => `<rect x="${236 + i * 24}" y="138" width="22" height="13" fill="${k.mix(famCol, ["#3a6fd9", "#e04a2a", "#3fa55b"][i], [0.6, 0.25, 0][same])}" stroke="#222"/>`).join("");
    return `${scene(k, id, g)}${keepFace(k, id, keep * 0.85)}${keep ? k.ring({ x: 160, y: 80, r: 30, color: "#9fe0a0", dash: "3 2", w: 1.5 }) : ""}${LL.box(4, 4, 312, 26)}${shelf}${LL.box(230, 124, 84, 32)}${k.label({ x: 236, y: 134, text: "shot to shot", size: 7, anchor: "start", color: "#ccc" })}${shots}${k.meter({ x: 12, y: 146, w: 80, p: v.n("fadeIn") / 10, label: `fades in ${v.n("fadeIn")} s` })}${LLx().caption(k, `${fam} #${pick} at ${v.n("strength")}%`)}`;
  });

  /* A LUT, a color recipe: the camera's picture on the left, after the recipe on the right, with trims. */
  W.look("lut", (v, k) => {
    const LL = LLx();
    const id = "cw-lut";
    const name = v("setting");
    const o = LOOKS[name] || {};
    const s = v.p("strength");
    const log = name === "log to normal";
    const camera = log ? { sat: 0.55, curve: LL.curve({ lift: 0.3, cap: 0.25 }) } : null;
    const ct = v.n("contrastTrim") / 50;
    const cc = v.n("colorTrim") / 50;
    const after = log ? fxOf({}, 1, { sat: (0.55 + 0.45 * s + (o.sat - 1) * s) * (1 + cc * 0.5), lift: 0.3 * (1 - s), cap: 0.25 * (1 - s), contrast: o.contrast * s + ct * 0.4 }) : fxOf(o, s, { contrast: ct * 0.4, sat: 1 + cc * 0.5 });
    const keep = idx(v, "keepSkin") / 2;
    const left = scene(k, id + "-a", camera);
    const right = scene(k, id + "-b", after);
    const bt = v.n("blendTime");
    return `${left}<clipPath id="${id}-r"><rect x="160" y="0" width="160" height="180"/></clipPath><g clip-path="url(#${id}-r)">${right}${keepFace(k, id, keep * 0.85)}</g><line x1="160" y1="0" x2="160" y2="162" stroke="#fff" stroke-width="2"/>${k.label({ x: 80, y: 14, text: "from the camera", size: 9, weight: 700 })}${k.label({ x: 240, y: 14, text: "after the recipe", size: 9, weight: 700 })}${thumb(k, id + "-t", 252, 24, 0.18, log ? fxOf({}, 1, { sat: 1.4, contrast: 0.45 }) : fxOf(o, 1), name)}${k.meter({ x: 236, y: 150, w: 72, p: bt / 10, label: `blends in ${bt} s` })}${LLx().caption(k, `${name} at ${v.n("strength")}%, contrast ${ct >= 0 ? "+" : ""}${v.n("contrastTrim")}, color ${cc >= 0 ? "+" : ""}${v.n("colorTrim")}`)}`;
  });

  /* Color wheels: push the shadows, middle and highlights toward a color, and lift or lower them. */
  W.look("colorWheels", (v, k) => {
    const LL = LLx();
    const id = "cw-colorWheels";
    const which = v("setting");
    const on = { none: [0, 0, 0], shadows: [1, 0, 0], midtones: [0, 1, 0], highlights: [0, 0, 1], "all three": [1, 1, 1] }[which];
    const s = v.p("strength");
    const hs = [LL.hueOf(v("shadowHue")), LL.hueOf(v("midHue")), LL.hueOf(v("highlightHue"))];
    const reachS = v.p("shadowReach");
    const sl = v.n("shadowLevel") / 50;
    const hl = v.n("highlightLevel") / 50;
    const wS = (y) => Math.pow(cl(1 - y / (0.25 + reachS * 0.6), 0, 1), 1.5);
    const wM = (y) => cl(1 - Math.abs(y - 0.5) * 2.2, 0, 1);
    const wH = (y) => y * y;
    const amt = 0.15 + s * 0.6;
    const tone = (y) => {
      const a = LL.hueRGB(hs[0], on[0] * amt * wS(y) * 1.2);
      const b = LL.hueRGB(hs[1], on[1] * amt * wM(y));
      const c = LL.hueRGB(hs[2], on[2] * amt * wH(y));
      return [0, 1, 2].map((i) => a[i] + b[i] + c[i]);
    };
    const curve = (x) => x + sl * wS(x) * 0.3 + hl * wH(x) * 0.3;
    const wheel = (cx, label, h, active, lvl) => {
      const ring = Array.from({ length: 12 }, (_, i) => `<path d="M${cx} 140 L${r1(cx + Math.cos(k.rad(i * 30 - 90)) * 14)} ${r1(140 + Math.sin(k.rad(i * 30 - 90)) * 14)} A14 14 0 0 1 ${r1(cx + Math.cos(k.rad(i * 30 - 60)) * 14)} ${r1(140 + Math.sin(k.rad(i * 30 - 60)) * 14)} Z" fill="${LL.hueCss(i * 30, 60, 50)}"/>`).join("");
      const d = h == null ? 0 : 4 + s * 8;
      const px = h == null ? cx : cx + Math.cos(k.rad(h - 90)) * d;
      const py = h == null ? 140 : 140 + Math.sin(k.rad(h - 90)) * d;
      return `<g opacity="${active ? 1 : 0.4}">${ring}<circle cx="${cx}" cy="140" r="14" fill="none" stroke="#ddd"/>${k.dot({ x: px, y: py, r: 3, color: "#fff" })}${lvl != null ? `<rect x="${cx + 17}" y="128" width="3" height="24" fill="#333"/><rect x="${cx + 17}" y="${r1(140 - lvl * 12 - 1)}" width="3" height="3" fill="#fff"/>` : ""}${k.label({ x: cx, y: 125, text: label, size: 7, color: "#ddd" })}</g>`;
    };
    const pt = v.n("pushTime");
    return `${scene(k, id, { tone, curve: (x) => curve(x) })}${LL.box(118, 110, 196, 46)}${wheel(140, "shadows", hs[0], on[0], sl)}${wheel(200, "middle", hs[1], on[1], null)}${wheel(260, "highlights", hs[2], on[2], hl)}<rect x="300" y="${r1(152 - reachS * 24)}" width="8" height="${r1(reachS * 24 + 1)}" fill="#556"/>${LL.box(2, 114, 104, 44)}${k.meter({ x: 8, y: 150, w: 90, p: pt / 30, label: `pushes in over ${pt} s` })}${k.meter({ x: 8, y: 128, w: 90, p: s, label: `strength ${v.n("strength")}%`, color: "#9fd3ff" })}${LLx().caption(k, which === "none" ? "No wheel pushed" : `${which}: ${[v("shadowHue"), v("midHue"), v("highlightHue")].filter((x, i) => on[i]).join(", ")} at ${v.n("strength")}%`)}`;
  });

  /* Curves: the shape of the tone curve on one channel, with lifted blacks, lowered whites and the middle,
     drawn as a graph beside the picture. */
  W.look("colorCurves", (v, k) => {
    const LL = LLx();
    const id = "cw-colorCurves";
    const shape = v("setting");
    const ch = v("channel");
    const s = 0.2 + v.p("curveStrength") * 0.8;
    const lift = v.n("blackLift") / 50;
    const cap = v.n("whiteCap") / 50;
    const mid = v.n("midPoint") / 50;
    const shapeF = { flat: (x) => x, "gentle S": LL.curve({ contrast: 0.35 }), "strong S": LL.curve({ contrast: 0.9 }), "faded blacks": LL.curve({ lift: 0.35 }), "crushed blacks": LL.curve({ crush: 0.7 }), inverted: (x) => 1 - x }[shape];
    const f = (x) => {
      const a = x + (shapeF(x) - x) * s;
      const m = Math.pow(cl(a, 0, 1), Math.pow(2, -mid));
      return lift * 0.4 + m * (1 - lift * 0.4 - cap * 0.4);
    };
    const chI = { red: 0, green: 1, blue: 2 }[ch];
    const hueSat = ch === "hue vs saturation";
    const g = ch === "all" ? { curve: f } : hueSat ? { sat: cl(0.3 + (f(0.5) - 0.5) * 3 + 0.7, 0, 3), tone: (y) => LL.hueRGB(28, (f(y) - y) * 0.6) } : { tone: (y) => [0, 1, 2].map((i) => (i === chI ? f(y) - y : 0)) };
    const col = { all: "#ffffff", red: "#ff5a5a", green: "#5aff7a", blue: "#6aa0ff", "hue vs saturation": "#ffd166" }[ch];
    const gx = 234;
    const gy = 10;
    const gw = 76;
    const pts = Array.from({ length: 21 }, (_, i) => `${r1(gx + (i / 20) * gw)},${r1(gy + gw - cl(f(i / 20), 0, 1) * gw)}`).join(" ");
    const graph = `${LL.box(gx - 6, gy - 4, gw + 12, gw + 18)}<line x1="${gx}" y1="${gy + gw}" x2="${gx + gw}" y2="${gy}" stroke="#555" stroke-dasharray="2 2"/><rect x="${gx}" y="${gy}" width="${gw}" height="${gw}" fill="none" stroke="#555"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2"/>${k.label({ x: gx + gw + 4, y: gy + gw + 10, text: `${ch} · ${v.n("curveStrength")}%`, size: 8, color: col, anchor: "end" })}`;
    const bt = v.n("bendTime");
    return `${scene(k, id, g)}${graph}${k.meter({ x: 8, y: 150, w: 90, p: bt / 30, label: `bends over ${bt} s` })}${LLx().caption(k, `${shape} curve on ${ch}, blacks ${v.n("blackLift") ? "+" : ""}${v.n("blackLift")}, whites ${v.n("whiteCap") ? "-" : ""}${v.n("whiteCap")}`)}`;
  });

  /* Dot grids where two settings pair naturally (only where the window has no pad yet). */
  const pad = (id, x, y, xLabel, yLabel) => {
    const spec = W.get(id);
    if (spec && (spec.faces || []).some((f) => f.face === "pad")) return;
    W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("exposure", "shadows", "highlights", "shadows", "highlights");
  pad("colorWheels", "shadowLevel", "highlightLevel", "shadow brightness", "highlight brightness");
  pad("colorCurves", "blackLift", "whiteCap", "lift the blacks", "lower the whites");
  pad("filterLook", "strength", "punch", "strength", "punch");
  pad("filterFamily", "pick", "strength", "which one", "strength");
  pad("textureEffect", "strength", "edgeWidth", "strength", "edge width");
  pad("colorMatch", "closeness", "matchSpan", "how close", "shots that match");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
