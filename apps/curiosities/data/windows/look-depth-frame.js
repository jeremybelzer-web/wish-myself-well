/* look for the color, focus, titles and canvas curiosities in data/db-depth-frame.js (depth thread, frame): the live
   picture at the top of each window. Same house style as look-heart-comedy.js: a stage on top (y 0 to 120) that
   shows the frame itself (its colors, where the eye goes, the words on it, its shape), a strip of small labelled
   gauges below it, and a caption. Colors: gold = what the eye should find, blue = a person, pink = warmth, red = a
   clash or danger, grey = what fades back, green = an opening, purple = a mind at work. Every own setting moves
   something of its own. */
(function (W) {
  const S = { bg: "#15151c", floor: "#2a2833", gold: "#ffd166", red: "#e4572e", blue: "#4a6fa5", orange: "#e8913a", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", wood: "#6b5a45", frame: "#23222b", teal: "#3fb6a8", white: "#f2f2f2", beige: "#cdb999" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);
  const FY = 112; /* the stage floor: people's feet */

  /* ---------- the stage ---------- */
  const stage = (k, o) => {
    o = o || {};
    return k.bg(o.bg || S.bg) + `<rect x="0" y="${FY}" width="320" height="8" fill="${o.floor || S.floor}"/>`;
  };
  const guy = (k, x, o) => k.person(Object.assign({ x, y: FY }, o || {}));
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${r1(x0)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="${color || "#33323d"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 9, color: "#fff" });
  };
  const box = (x, y, w, h, fill, o) => {
    o = o || {};
    return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0.5, w))}" height="${r1(Math.max(0.5, h))}"${o.rx ? ` rx="${o.rx}"` : ""} fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ""}${o.alpha != null ? ` opacity="${r1(o.alpha * 100) / 100}"` : ""}${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
  };
  /* A soft glow: a circle of feeling around a point. */
  const glow = (x, y, r, color, a) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(Math.max(0.5, r))}" fill="${color}" opacity="${r1(a * 100) / 100}"/>`;
  /* A row of small marks across the stage: n of them, the first `on` lit. */
  const marks = (x, y, w, n, on, color, h) => {
    let out = "";
    for (let i = 0; i < n; i++) out += `<rect x="${r1(x + (i * w) / n)}" y="${r1(y)}" width="${r1(Math.max(0.5, w / n - 3))}" height="${h || 6}" rx="2" fill="${i < on ? color || S.gold : "#33323d"}"/>`;
    return out;
  };

  /* ---------- the strip of small gauges (copied from look-heart-comedy.js) ---------- */
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
        out += k.label({ x: x + it.n * sw + 3, y: by + 7, text: short, size: 8, color: "#fff", anchor: "start", weight: 700 });
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
  /* Index of a word setting on its scale, clamped to a list length when one is given. */
  const idx = (v, id, len) => {
    const s = v.slider(id);
    const i = s && s.scale ? Math.max(0, s.scale.indexOf(v(id))) : 0;
    return len ? Math.min(len - 1, i) : i;
  };
  const look = (id, fn) => W.look(id, (v, k) => fn(v, k, G(v)));

  /* ======================= colorClash ======================= */
  /* Two clashing colors fill part of the frame: a wall, the clothes or the light, more of it as the share grows. */
  const PAIRS = [["#d6322b", "#33b24a"], ["#ef7d1a", "#2b6fd6"], ["#7b3bb8", "#f2d22e"], ["#e86aa6", "#3fbf5a"], ["#ff2bd6", "#77777f"]];
  look("colorClash", (v, k, g) => {
    const cl = v.n("clash") / 5;
    const pr = PAIRS[idx(v, "pair", 5)];
    const wh = idx(v, "where", 4);
    const wn = idx(v, "when", 4);
    const sh = v.n("share") / 100;
    const fl = idx(v, "feel", 4);
    const a = k.mix("#55555e", pr[0], 0.25 + cl * 0.75);
    const b = k.mix("#55555e", pr[1], 0.25 + cl * 0.75);
    let out = stage(k, { bg: "#24232b" });
    const wallW = 320 * sh;
    if (wh === 1 || wh === 3) out += box(0, 0, wallW, FY, a, { alpha: 0.9 });
    if (wh === 2 || wh === 3) out += k.beam({ x: 0, y: 0, dir: 35, len: 120 + sh * 200, spread: 30 + sh * 40, color: a, alpha: 0.25 + cl * 0.3 }) + k.beam({ x: 320, y: 0, dir: 145, len: 120 + sh * 200, spread: 30 + sh * 40, color: b, alpha: 0.25 + cl * 0.3 });
    const clothes = wh === 0 || wh === 3;
    out += guy(k, 110, { color: clothes ? a : S.grey, look: 1, mood: [0.5, -0.2, -0.7, -0.4][fl], arms: fl === 2 ? 0.6 : -0.2 });
    out += guy(k, 210, { color: clothes ? b : S.grey, look: -1, mood: [0.5, -0.2, -0.7, -0.4][fl], lean: fl === 3 ? 8 : 0 });
    out += marks(20, 8, 120, 4, [4, 1, 2, 3][wn], S.red);
    out += k.label({ x: 22, y: 26, text: ["the whole scene", "grows with the fight", "one moment", "one place only"][wn], size: 8, color: "#ccc", anchor: "start" });
    out += box(240, 6, 30, 16, a, { rx: 3 }) + box(272, 6, 30, 16, b, { rx: 3 });
    if (fl === 3) out += k.tint({ color: "#8fae3a", alpha: 0.12 });
    out += strip(k, [g.num("clash", "Clash", "", S.red), g.steps("pair", "Colors"), g.steps("where", "Where"), g.steps("when", "When"), g.num("share", "Share", "%"), g.steps("feel", "Feel", S.red)]);
    return out + k.caption(`${v("pair")}, ${v("where")}, feels ${v("feel")}`);
  });

  /* ======================= savedColor ======================= */
  /* A film strip of grey frames; the saved color lights only the big moments, bigger with size. */
  const HUES = ["#f2c14e", "#e4572e", "#3d7be0", "#4fbf6a", "#f4f4f4", "#ef8fb8"];
  look("savedColor", (v, k, g) => {
    const rr = v.n("rarity");
    const hue = HUES[idx(v, "hue", 6)];
    const tm = v.n("times");
    const mo = idx(v, "moments", 5);
    const sz = idx(v, "size", 4);
    const nt = idx(v, "noticed", 4);
    let out = stage(k);
    const n = 12;
    const spacing = Math.max(1, Math.round(n / tm));
    for (let i = 0; i < n; i++) {
      const x = 8 + i * 25.5;
      const lit = i % spacing === spacing - 1 && Math.floor(i / spacing) < tm;
      const greyness = rr / 5;
      out += box(x, 30, 22, 40, lit ? "#2c2c33" : k.mix(k.mix("#3a3a42", hue, 0.35), "#3a3a42", greyness), { stroke: "#555" });
      if (lit) {
        if (sz === 0) out += k.dot({ x: x + 11, y: 50, r: 2, color: hue });
        if (sz === 1) out += box(x + 6, 44, 10, 12, hue, { rx: 2 });
        if (sz === 2) out += glow(x + 11, 50, 12, hue, 0.8);
        if (sz === 3) out += box(x, 30, 22, 40, hue, { alpha: 0.9 });
      }
    }
    out += k.label({ x: 160, y: 20, text: "saved for: " + v("moments"), size: 10, color: hue });
    out += k.text({ x: 300, y: 100, text: ["🤝", "🔀", "🕯️", "🏆", "🎬"][mo], size: 16 });
    out += k.text({ x: 20, y: 100, text: ["💓", "🔁", "3️⃣", "👀"][nt], size: 14 });
    out += marks(60, 92, 200, 4, nt + 1, hue);
    out += strip(k, [g.num("rarity", "Kept back"), g.steps("hue", "Color"), g.num("times", "Times", "x"), g.steps("moments", "Moments"), g.steps("size", "Size"), g.steps("noticed", "Noticed")]);
    return out + k.caption(`${v("hue")} only at ${v("times")} big moment${v.n("times") === 1 ? "" : "s"}`);
  });

  /* ======================= splitColorLight ======================= */
  /* A big face split down the middle by two colored lights, with the source drawn at the side. */
  const LPAIRS = [["#ffb066", "#79b8ff"], ["#ff3b3b", "#3b6bff"], ["#ff6fb1", "#2fd1c1"], ["#4ee06a", "#a05cf0"]];
  look("splitColorLight", (v, k, g) => {
    const sp = v.n("split") / 5;
    const pr = LPAIRS[idx(v, "pair", 4)];
    const fr = idx(v, "from", 5);
    const ed = idx(v, "edge", 3);
    const mv = idx(v, "moves", 3);
    const mn = idx(v, "means", 4);
    let out = stage(k, { bg: "#101016" });
    const L = k.mix("#c9a385", pr[0], 0.2 + sp * 0.7);
    const R = k.mix("#c9a385", pr[1], 0.2 + sp * 0.7);
    const off = [0, 4, 10][mv];
    const id = "scl" + idx(v, "pair", 4) + ed + mv + Math.round(sp * 5);
    const w = [24, 8, 0.5][ed];
    out += `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="${r1(50 - w - off)}%" stop-color="${L}"/><stop offset="${r1(50 + w - off)}%" stop-color="${R}"/></linearGradient></defs>`;
    out += `<circle cx="160" cy="62" r="40" fill="url(#${id})" stroke="${S.ink}" stroke-width="2"/>`;
    out += k.face({ x: 160, y: 62, r: 40, mood: [0, -0.5, -0.2, -0.3][mn], color: "none", look: mn === 2 ? -1 : 0 });
    out += k.beam({ x: 10, y: 30, dir: 15, len: 140, spread: 30, color: pr[0], alpha: 0.1 + sp * 0.3 }) + k.beam({ x: 310, y: 30, dir: 165, len: 140, spread: 30, color: pr[1], alpha: 0.1 + sp * 0.3 });
    out += k.text({ x: 22, y: 24, text: ["🪧", "📺", "🚨", "🔥", "🪩"][fr], size: 16 });
    if (mv === 2) out += k.label({ x: 290, y: 24, text: "flash!", size: 9, color: pr[1] });
    out += chip(k, 160, 114, ["just the place", "a torn mind", "two pulls", "danger | safety"][mn], "#33323d", "middle");
    out += strip(k, [g.num("split", "Strength", "", pr[0]), g.steps("pair", "Colors"), g.steps("from", "From"), g.steps("edge", "Edge"), g.steps("moves", "Moves"), g.steps("means", "Means", S.purple)]);
    return out + k.caption(`${v("pair")} light from ${v("from")}`);
  });

  /* ======================= matchesTheRoom ======================= */
  /* A wall in the shared color; the person's clothes move from standing out to the same color as the wall. */
  const ROOMC = ["#cdb999", "#8d8f96", "#c98fae", "#e0a43a"];
  look("matchesTheRoom", (v, k, g) => {
    const m = v.n("match") / 5;
    const wy = idx(v, "why", 4);
    const col = ROOMC[idx(v, "color", 4)];
    const ot = idx(v, "others", 3);
    const br = idx(v, "breaks", 4);
    const sh = idx(v, "shown", 3);
    let out = stage(k, { bg: col, floor: k.mix(col, "#000", 0.35) });
    if (idx(v, "color", 4) === 2) for (let i = 0; i < 14; i++) out += glow(14 + i * 22, 20 + (i % 3) * 30, 5, "#a0507a", 0.6);
    const s = [0.7, 1, 1.4][sh];
    const mine = k.mix("#d6322b", col, m);
    out += box(110, 70, 100, 30, k.mix(col, "#000", 0.15), { rx: 6 });
    out += guy(k, 160, { s, color: mine, mood: [0.3, -0.2, -0.5, 0.6][wy], look: wy === 1 ? -1 : 0, alpha: wy === 1 ? 0.8 : 1 });
    if (ot > 0) {
      const oc = ot === 1 ? "#2b6fd6" : col;
      out += guy(k, 60, { s: s * 0.85, color: oc }) + guy(k, 260, { s: s * 0.85, color: oc });
    }
    if (br > 0) out += k.text({ x: 296, y: 24, text: ["", "🗣️", "🚪", "🔄"][br], size: 14 });
    out += chip(k, 50, 18, ["belongs", "hiding", "owned by it", "a joke"][wy], "#33323d", "middle");
    out += strip(k, [g.num("match", "Match"), g.steps("why", "Why"), g.steps("color", "Color"), g.steps("others", "Others"), g.steps("breaks", "Breaks", S.red), g.steps("shown", "Shot")]);
    return out + k.caption(`${m > 0.6 ? "melting into" : m > 0.2 ? "close to" : "standing out from"} the ${v("color")} room`);
  });

  /* ======================= stillInTheRush ======================= */
  /* Streaks rush past across the frame; one figure in the middle stays sharp and still. */
  const STILLS = ["🧍", "🙂", "✋", "🎁", "🐈"];
  const RUSH = ["🚶", "🚗", "💃", "🌧️", "🥊"];
  look("stillInTheRush", (v, k, g) => {
    const st = v.n("still") / 5;
    const wt = idx(v, "what", 5);
    const ru = v.n("rush");
    const rk = idx(v, "rushKind", 5);
    const bl = idx(v, "blur", 3);
    const ls = v.n("lasts");
    let out = stage(k);
    const n = Math.round(ru * 4);
    for (let i = 0; i < n; i++) {
      const y = 20 + ((i * 37) % 85);
      const x = (i * 53) % 300;
      if (bl > 0) out += box(x - [0, 18, 40][bl], y - 2, [0, 18, 40][bl], 4, S.grey, { alpha: 0.5 });
      out += k.text({ x, y: y + 5, text: RUSH[rk], size: 12, alpha: bl === 2 ? 0.5 : 0.85 });
    }
    out += glow(160, 70, 16 + st * 22, S.gold, 0.12 + st * 0.2);
    out += k.text({ x: 160 + (1 - st) * 12, y: 82, text: STILLS[wt], size: 30 });
    if (st < 0.5) out += k.label({ x: 186, y: 62, text: "~", size: 14, color: S.gold });
    out += k.clock({ x: 296, y: 22, r: 12, p: ls / 20 });
    out += strip(k, [g.num("still", "Stillness"), g.steps("what", "What"), g.num("rush", "Rush", "", S.grey), g.steps("rushKind", "Rush of", S.grey), g.steps("blur", "Blur", S.grey), g.num("lasts", "Holds", "s")]);
    return out + k.caption(`${v("what")} stays still in ${v("rushKind")}`);
  });

  /* ======================= oneFaceInCrowd ======================= */
  /* A grid of faded faces; one is picked out by focus, light, color, a look or stillness. */
  look("oneFaceInCrowd", (v, k, g) => {
    const pk = v.n("pick") / 5;
    const by = idx(v, "by", 5);
    const sz = idx(v, "size", 4);
    const wh = idx(v, "who", 4);
    const fd = idx(v, "found", 4);
    const lk = idx(v, "look", 3);
    let out = stage(k);
    const cols = [4, 7, 10, 14][sz];
    const rows = [1, 2, 3, 4][sz];
    const r = [12, 9, 7, 5][sz];
    const tx = Math.floor(cols * 0.65);
    const ty = rows - 1;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const x = 20 + (i + 0.5) * (280 / cols);
        const y = 24 + j * (80 / rows) + r;
        const me = i === tx && j === ty;
        const fade = me ? 0.35 + pk * 0.65 : 0.55 - pk * 0.25;
        if (me && by === 1) out += glow(x, y, r * 2.2, S.gold, 0.2 + pk * 0.4);
        out += k.face({ x, y, r, alpha: fade, color: me && by === 2 ? "#e4572e" : "#c9b7a6", look: me ? [0, -1, 0][lk] : 0.6, eyes: me && by === 3 ? 1 : 0.6 });
        if (!me && by === 4) out += box(x - r, y - r - 2, r * 2, 2, S.grey, { alpha: 0.6 });
        if (me && by === 0) out += k.ring({ x, y, r: r + 2, color: S.white, w: 1 + pk * 2 });
      }
    out += k.text({ x: 300, y: 20, text: ["❤️", "🎯", "❔", "🪞"][wh], size: 14 });
    if (fd !== 3) out += k.ring({ x: 20 + (tx + 0.5) * (280 / cols), y: 24 + ty * (80 / rows) + r, r: r + 6 + fd * 2, color: S.gold, w: 1.5, dash: fd === 1 ? "3 3" : fd === 2 ? "1 3" : "" });
    out += strip(k, [g.num("pick", "Picked out"), g.steps("by", "By"), g.steps("size", "Crowd", S.grey), g.steps("who", "Who", S.pink), g.steps("found", "Found"), g.steps("look", "Looks")]);
    return out + k.caption(`${v("who")} in ${v("size")}, picked out by ${v("by")}`);
  });

  /* ======================= misdirectedEye ======================= */
  /* A big bright bait in the middle pulls a gold arrow; the real thing waits small in a corner. */
  const BAIT = ["🔊", "💡", "🗣️", "🏃", "😂"];
  look("misdirectedEye", (v, k, g) => {
    const lu = v.n("lure") / 5;
    const bt = idx(v, "bait", 5);
    const rl = idx(v, "real", 4);
    const po = idx(v, "payoff", 4);
    const gl = idx(v, "goal", 4);
    const fr = idx(v, "fair", 3);
    let out = stage(k);
    out += glow(150, 60, 20 + lu * 30, S.gold, 0.1 + lu * 0.3);
    out += k.text({ x: 150, y: 72, text: BAIT[bt], size: 20 + lu * 16 });
    const RX = [290, 250, 40, 200][rl];
    const RY = [100, 40, 90, 70][rl];
    if (rl === 2) out += box(0, 60, 90, 52, "#000", { alpha: 0.6 });
    out += k.text({ x: RX, y: RY, text: ["😱", "🃏", "🔎", "🔀"][gl], size: 12, alpha: [0.25, 0.6, 1][fr] });
    out += k.arrow({ x1: 60, y1: 20, x2: 130, y2: 50, color: S.gold, w: 1 + lu * 3 });
    out += marks(200, 10, 100, 4, po + 1, S.green);
    out += k.label({ x: 250, y: 28, text: "we find out: " + ["never", "2nd watch", "soon", "now"][po], size: 8, color: "#ccc" });
    out += strip(k, [g.num("lure", "Pull away"), g.steps("bait", "Bait"), g.steps("real", "Real thing", S.red), g.steps("payoff", "Found out", S.green), g.steps("goal", "For"), g.steps("fair", "Fair")]);
    return out + k.caption(`eye on ${v("bait")}, the real thing ${v("real")}`);
  });

  /* ======================= edgeOfFrame ======================= */
  /* A frame with an empty middle; the important thing slides to an edge and gets cut off. */
  const EDGE_WHAT = ["🧍", "🙂", "✋", "🎁", "🚪"];
  look("edgeOfFrame", (v, k, g) => {
    const ed = v.n("edge") / 5;
    const wt = idx(v, "what", 5);
    const sd = idx(v, "side", 4);
    const ct = idx(v, "center", 4);
    const cu = idx(v, "cut", 4);
    const wy = idx(v, "why", 4);
    let out = stage(k);
    out += k.frame({ x: 20, y: 6, w: 280, h: 104, color: "#666", w2: 1.5 });
    if (ct === 1) out += box(120, 20, 80, 80, "#3a3640");
    if (ct === 2) out += guy(k, 160, { s: 0.8, color: S.grey });
    if (ct === 3) out += box(21, 7, 278, 50, "#3c5a7a", { alpha: 0.6 });
    const push = [0, 0.15, 0.35, 0.55][cu];
    const dx = [-1, 1, 0, 0][sd];
    const dy = [0, 0, -1, 1][sd];
    const x = 160 + dx * (ed * (130 + push * 40));
    const y = 62 + dy * (ed * (45 + push * 25));
    out += k.text({ x, y: y + 12, text: EDGE_WHAT[wt], size: 34 });
    out += box(0, 0, 20, 120, S.bg) + box(300, 0, 20, 120, S.bg) + box(0, 0, 320, 6, S.bg) + box(0, 110, 320, 2, S.bg);
    out += k.label({ x: 160, y: 117, text: ["make us search", "feel cut off", "unsettle", "hide it"][wy], size: 7, color: "#aaa" });
    out += strip(k, [g.num("edge", "To the edge"), g.steps("what", "What"), g.steps("side", "Side"), g.steps("center", "Middle", S.grey), g.steps("cut", "Cut off", S.red), g.steps("why", "Why", S.purple)]);
    return out + k.caption(`${v("what")} at the ${v("side")} edge, ${v("cut")}`);
  });

  /* ======================= wordsInTheWorld ======================= */
  /* A street scene with a wall, a road and a sky; the words sit on one of them in a style. */
  const WSTYLE = [{ c: "#ffffff", f: "system-ui, sans-serif" }, { c: "#f2c14e", f: "Georgia, serif" }, { c: "#eaeaea", f: "Comic Sans MS, cursive" }, { c: "#ff4fd8", f: "system-ui, sans-serif" }, { c: "#000000", f: "Georgia, serif" }];
  look("wordsInTheWorld", (v, k, g) => {
    const ft = v.n("fit") / 5;
    const on = idx(v, "on", 5);
    const wt = idx(v, "what", 5);
    const mv = idx(v, "moves", 4);
    const st = WSTYLE[idx(v, "style", 5)];
    const ss = v.n("stays");
    let out = stage(k, { bg: "#2c3a52" });
    out += box(0, 70, 320, 42, "#3b3b40") + box(30, 10, 120, 60, "#7a5a45") + box(200, 20, 50, 40, "#9cc4e4", { stroke: S.ink });
    const word = ["THE TOWN", "J. SMITH", "MILLBROOK", "why me?", "RUN"][wt];
    const P = [[90, 44, 0], [160, 100, 0], [160, 22, 0], [225, 45, 0], [280, 90, 0]][on];
    const skew = on === 1 ? -0.5 * ft : 0;
    out += `<g transform="translate(${P[0]} ${P[1]}) skewX(${r1(skew * 40)}) scale(1 ${r1(on === 1 ? 1 - ft * 0.5 : 1)})">` + k.text({ x: 0, y: 0, text: word, size: on === 4 ? 9 : 16, color: st.c, font: st.f, weight: 700, alpha: 0.5 + ft * 0.5, outline: idx(v, "style", 5) === 3 ? "#ff9ff0" : null }) + "</g>";
    if (on === 4) out += guy(k, 280, { s: 0.9, color: S.blue });
    if (mv === 1) out += k.arrow({ x1: 20, y1: 100, x2: 60, y2: 100, color: "#ccc", w: 1.5 });
    if (mv === 2) out += guy(k, P[0] + 8, { s: 0.6, color: S.grey, walk: 1, alpha: 0.8 });
    if (mv === 3) out += k.text({ x: P[0] + 30, y: P[1] - 6, text: "✨", size: 12 });
    out += marks(250, 108, 60, 10, Math.round(ss), S.gold, 3);
    out += strip(k, [g.num("fit", "Belongs"), g.steps("on", "On"), g.steps("what", "Says"), g.steps("moves", "Moves"), g.steps("style", "Style"), g.num("stays", "Stays", "s")]);
    return out + k.caption(`${v("what")} on ${v("on")}, ${v("style")}`);
  });

  /* ======================= playfulSubtitles ======================= */
  /* A speaker, and a subtitle that moves, grows, says more or lies, in the chosen size and color. */
  const SUBC = ["#ffffff", "#79b8ff", "#ff8fb1"];
  look("playfulSubtitles", (v, k, g) => {
    const pl = v.n("play") / 5;
    const tr = idx(v, "trick", 5);
    const lg = idx(v, "language", 4);
    const sz = [8, 10, 13, 17][idx(v, "size", 4)];
    const cl = SUBC[idx(v, "color", 3)];
    const ct = v.n("count");
    let out = stage(k);
    const who = ["👽", "🧑", "👶", "🐕"][lg];
    out += k.text({ x: 80, y: 80, text: who, size: 36 });
    out += k.bubble({ x: 80, y: 26, text: ["zorp blik!", "Ça va.", "goo ga!", "woof."][lg], w: 70, h: 20, size: 9, tail: 0 });
    const sub = tr === 2 ? "Fine. (I hate you.)" : tr === 3 ? "I love the soup." : "I'm fine, thanks.";
    const sx = k.lerp(160, tr === 0 ? 120 : 160, pl);
    const sy = k.lerp(104, tr === 0 ? 92 : 104, pl);
    const sc = tr === 1 ? 1 + pl * 0.6 : 1;
    out += k.text({ x: sx, y: sy, text: sub, size: sz * sc, color: cl, weight: 700, outline: "#000" });
    if (tr === 3) out += k.label({ x: 250, y: 60, text: "(really: 'help')", size: 8, color: S.red });
    if (tr === 4) out += guy(k, 260, { s: 0.9, color: S.blue, look: -1, mood: -0.3 }) + k.text({ x: 240, y: 40, text: "👓", size: 12 });
    out += marks(200, 8, 110, 10, Math.round(ct), cl, 4);
    out += strip(k, [g.num("play", "Play"), g.steps("trick", "Trick"), g.steps("language", "Whose words"), g.steps("size", "Size"), g.steps("color", "Color"), g.num("count", "Lines")]);
    return out + k.caption(`subtitles: ${v("trick")}`);
  });

  /* ======================= openingCredits ======================= */
  /* A screen with names over black, a scene or made images; the timeline below grows with the length. */
  look("openingCredits", (v, k, g) => {
    const wg = v.n("weight") / 5;
    const ov = idx(v, "over", 4);
    const ln = v.n("length");
    const nm = idx(v, "names", 3);
    const ht = idx(v, "hint", 4);
    const mu = idx(v, "music", 4);
    let out = stage(k, { bg: "#000" });
    if (ov === 1) out += box(0, 40, 320, 72, "#3a4a5e") + guy(k, 230, { s: 0.8, color: S.blue });
    if (ov === 2) for (let i = 0; i < 6; i++) out += box(20 + i * 48, 30 + (i % 2) * 20, 40, 40, k.hsl(i * 55, 55, 45), { rx: 4, alpha: 0.3 + wg * 0.6 });
    if (ov === 3) out += box(0, 70, 320, 42, "#5a4632") + k.arrow({ x1: 40, y1: 95, x2: 280, y2: 95, color: "#ccc", w: 1.5 });
    const names = [["A. LEE"], ["A. LEE", "B. ORTIZ", "C. KAY"], ["A. LEE", "B. ORTIZ", "C. KAY", "D. FINN", "E. MOSS", "F. WU"]][nm];
    names.forEach((n, i) => (out += k.text({ x: 70 + (i % 3) * 90, y: 20 + Math.floor(i / 3) * 16, text: n, size: 9 + wg * 4, color: "#fff", spacing: 2 })));
    if (ht === 3) out += k.text({ x: 300, y: 100, text: "🏠", size: 10, alpha: 0.6 });
    if (ht === 2) out += k.text({ x: 300, y: 100, text: "🔑", size: 12 });
    if (ht === 1) out += k.tint({ color: S.purple, alpha: 0.15 });
    out += box(10, 113, 300 * (ln / 240), 5, S.gold, { rx: 2 });
    out += k.wave({ x: 10, y: 52, w: 50, h: 20, amp: [0, 0.2, 0.6, 1][mu], cycles: 4, color: S.green });
    out += strip(k, [g.num("weight", "Weight"), g.steps("over", "Over"), g.num("length", "Length", "s"), g.steps("names", "Names"), g.steps("hint", "Hints", S.purple), g.steps("music", "Sound", S.green)]);
    return out + k.caption(`opening credits over ${v("over")}, ${v("length")} seconds`);
  });

  /* ======================= thoughtsAsText ======================= */
  /* A person with their thoughts written out as a list, labels or scores, near them or across the screen. */
  const TSTYLE = [{ c: "#ffffff", f: "system-ui, sans-serif" }, { c: "#f4e3a1", f: "Comic Sans MS, cursive" }, { c: "#5fff7a", f: "monospace" }, { c: "#ffb0d0", f: "Comic Sans MS, cursive" }];
  look("thoughtsAsText", (v, k, g) => {
    const sh = v.n("show") / 5;
    const fm = idx(v, "form", 5);
    const nr = idx(v, "near", 4);
    const ty = TSTYLE[idx(v, "style", 4)];
    const hn = idx(v, "honest", 3);
    const ch = idx(v, "changes", 3);
    let out = stage(k);
    out += guy(k, 70, { color: S.blue, look: 1, mood: hn === 0 ? -0.3 : 0.2 });
    out += k.text({ x: 230, y: 100, text: "☕", size: 14 }) + guy(k, 270, { s: 0.8, color: S.grey });
    const lines = [["1. say hi", "2. be calm", "3. leave"], ["boss", "coffee", "exit"], ["☐ stay", "☑ go"], ["HP 80", "+10 charm"], ["...why?"]][fm];
    const n = Math.max(1, Math.round(lines.length * (0.3 + sh * 0.7)));
    const pos = [[110, 26], [230, 60], [170, 40], [160, 50]][nr];
    const size = nr === 3 ? 16 : 10;
    for (let i = 0; i < n; i++) {
      const y = pos[1] + i * (size + 4);
      out += k.text({ x: pos[0], y, text: lines[i], size, color: ty.c, font: ty.f, anchor: "start", alpha: hn === 0 ? 0.6 : 1 });
      if (ch === 2) out += `<line x1="${pos[0]}" y1="${r1(y - size / 3)}" x2="${pos[0] + 50}" y2="${r1(y - size / 3)}" stroke="${S.red}" stroke-width="1.5"/>`;
    }
    if (ch === 1) out += k.label({ x: pos[0] + 60, y: pos[1], text: "✎", size: 12, color: S.gold });
    out += chip(k, 280, 18, ["lies", "half true", "true"][hn], hn === 0 ? S.red : hn === 1 ? S.orange : S.green, "middle");
    out += strip(k, [g.num("show", "Shown", "", S.purple), g.steps("form", "Form"), g.steps("near", "Where"), g.steps("style", "Style"), g.steps("honest", "True", S.green), g.steps("changes", "Changes")]);
    return out + k.caption(`thoughts as ${v("form")}, ${v("near")}`);
  });

  /* ======================= splitScreen ======================= */
  /* The frame cut into panes, side by side, stacked or a grid, with the chosen dividing line. */
  look("splitScreen", (v, k, g) => {
    const sp = v.n("split") / 5;
    const pn = Math.max(2, Math.round(v.n("panes")));
    const shw = idx(v, "shows", 5);
    const ln = idx(v, "line", 4);
    const ly = idx(v, "layout", 4);
    const jn = idx(v, "joins", 4);
    let out = stage(k, { bg: "#000" });
    const cols = ly === 1 ? 1 : ly === 2 ? Math.ceil(pn / 2) : pn;
    const rows = ly === 1 ? pn : ly === 2 ? 2 : 1;
    const gap = [1, 4, 0, 2][ln];
    const W0 = 20 + (1 - sp) * 60;
    const fw = 320 - 2 * W0 + (1 - sp) * 0;
    const cw = fw / cols;
    const rh = 108 / rows;
    let i = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (i >= pn) break;
        const x = W0 + c * cw;
        const y = 4 + r * rh;
        const dark = jn === 2 && i === pn - 1;
        const fill = dark ? "#000" : k.hsl([210, 30, 140, 280, 60][(i + shw) % 5], 35, 30 + (i % 2) * 6);
        out += box(x + gap / 2, y + gap / 2, cw - gap, rh - gap, fill, { alpha: ly === 3 && i % 2 ? 0.5 : 1 });
        if (!dark) out += k.person({ x: x + cw / 2 + (jn === 1 ? (c === 0 ? cw * 0.3 : -cw * 0.3) : 0), y: y + rh - 4, s: Math.min(0.8, rh / 80), color: [S.blue, S.pink, S.green, S.orange, S.purple, S.gold][i % 6] });
        if (ln === 2 && c > 0) out += box(x - 6, y, 12, rh, "#000", { alpha: 0.3 });
        if (ln === 3 && c > 0) out += `<line x1="${r1(x - 4)}" y1="${r1(y)}" x2="${r1(x + 4)}" y2="${r1(y + rh)}" stroke="${S.gold}" stroke-width="2"/>`;
        i++;
      }
    if (jn === 3) out += k.tint({ color: S.gold, alpha: 0.1 });
    out += k.label({ x: 160, y: 117, text: ["two places", "a call", "before | after", "same moment x2", "many lives"][shw], size: 7, color: "#aaa" });
    out += strip(k, [g.num("split", "Split"), g.num("panes", "Pictures"), g.steps("shows", "Shows"), g.steps("line", "Line"), g.steps("layout", "Layout"), g.steps("joins", "Ends", S.green)]);
    return out + k.caption(`${pn} pictures ${v("layout")}, ${v("shows")}`);
  });

  /* ======================= pictureSize ======================= */
  /* The picture as a box inside the screen: its size, shape and what fills the space around it. */
  const AROUND = ["#000000", "#3a3a48", "#7a3b5a", "#000000"];
  look("pictureSize", (v, k, g) => {
    const sz = v.n("size") / 100;
    const wy = idx(v, "way", 3);
    const sh = idx(v, "shape", 4);
    const sp = idx(v, "speed", 4);
    const ar = idx(v, "around", 4);
    const fl = idx(v, "follows", 4);
    let out = stage(k, { bg: AROUND[ar] });
    if (ar === 1) for (let i = 0; i < 8; i++) out += glow(20 + i * 40, 60, 26, "#6a7a9a", 0.25);
    const asp = [16 / 9, 0.9, 1, 2.4][sh];
    let w = 300 * sz;
    let h = w / asp;
    if (h > 112 * sz) { h = 112 * sz; w = h * asp; }
    const x = 160 - w / 2;
    const y = 58 - h / 2;
    out += box(x, y, w, h, ["#4a6f8f", "#6aa86a", "#c9a36a", "#c98f6a"][fl]);
    out += k.person({ x: 160, y: y + h - 2, s: Math.max(0.2, h / 110), color: S.blue });
    if (ar === 3) out += k.frame({ x: x - 4, y: y - 4, w: w + 8, h: h + 8, color: S.gold, w2: 3 });
    const ax = [[[300, 10], [200, 40]], [[200, 40], [300, 10]], [[300, 10], [250, 30]]][wy];
    out += k.arrow({ x1: ax[0][0], y1: ax[0][1], x2: ax[1][0], y2: ax[1][1], color: S.gold, w: 1.5 });
    if (wy === 2) out += k.arrow({ x1: 250, y1: 30, x2: 300, y2: 10, color: S.green, w: 1.5 });
    out += marks(10, 108, 60, 4, sp + 1, S.gold, 4);
    out += strip(k, [g.num("size", "Size", "%"), g.steps("way", "Way"), g.steps("shape", "Shape"), g.steps("speed", "Speed"), g.steps("around", "Around", S.grey), g.steps("follows", "Follows", S.purple)]);
    return out + k.caption(`the picture ${v("way")}, now ${v("size")}% of the screen`);
  });

  /* ======================= povMask ======================= */
  /* A scene seen through a black mask cut to the shape: binoculars, a keyhole, a sight, a peephole. */
  look("povMask", (v, k, g) => {
    const cv = v.n("cover") / 5;
    const sh = idx(v, "shape", 6);
    const wh = idx(v, "who", 5);
    const ed = idx(v, "edge", 3);
    const wb = v.n("wobble");
    const cg = idx(v, "caught", 3);
    let out = stage(k, { bg: "#3a4a5e" });
    out += box(0, 70, 320, 42, "#4b3b2b");
    out += guy(k, 170, { color: S.pink, look: cg === 2 ? 0 : 1, mood: cg === 0 ? 0.3 : -0.4, eyes: cg === 2 ? 1 : 0.7 });
    const dx = wb * 2;
    const r = 60 - cv * 32;
    const id = "pm" + sh + ed + Math.round(cv * 5) + Math.round(wb);
    let hole;
    if (sh === 0) hole = `<circle cx="${r1(160 - r * 0.6 + dx)}" cy="60" r="${r1(r * 0.7)}" fill="#000"/><circle cx="${r1(160 + r * 0.6 + dx)}" cy="60" r="${r1(r * 0.7)}" fill="#000"/>`;
    else if (sh === 1) hole = `<circle cx="${r1(160 + dx)}" cy="${r1(60 - r * 0.3)}" r="${r1(r * 0.45)}" fill="#000"/><path d="M${r1(160 + dx - r * 0.25)} ${r1(60 - r * 0.2)} L${r1(160 + dx - r * 0.45)} ${r1(60 + r * 0.8)} L${r1(160 + dx + r * 0.45)} ${r1(60 + r * 0.8)} L${r1(160 + dx + r * 0.25)} ${r1(60 - r * 0.2)} Z" fill="#000"/>`;
    else hole = `<circle cx="${r1(160 + dx)}" cy="60" r="${r1(r * [1, 1, 0.9, 1, 0.8, 0.6][sh])}" fill="#000"/>`;
    const blur = [0, 3, 7][ed];
    out += `<defs><filter id="${id}f"><feGaussianBlur stdDeviation="${blur}"/></filter><mask id="${id}"><rect x="0" y="0" width="320" height="120" fill="#fff"/><g filter="url(#${id}f)">${hole}</g></mask></defs>`;
    out += `<rect x="0" y="0" width="320" height="120" fill="#000" mask="url(#${id})"/>`;
    if (sh === 3) out += `<line x1="${r1(160 + dx - r)}" y1="60" x2="${r1(160 + dx + r)}" y2="60" stroke="${S.red}" stroke-width="1"/><line x1="${r1(160 + dx)}" y1="${r1(60 - r)}" x2="${r1(160 + dx)}" y2="${r1(60 + r)}" stroke="${S.red}" stroke-width="1"/>`;
    if (sh === 4) out += k.frame({ x: 160 + dx - r * 0.7, y: 60 - r * 0.5, w: r * 1.4, h: r, color: "#fff", w2: 1 }) + k.dot({ x: 160 + dx + r * 0.5, y: 60 - r * 0.35, r: 2, color: S.red });
    out += k.label({ x: 10, y: 14, text: "watching: " + ["the hero", "the villain", "a spy", "a child", "?"][wh], size: 9, color: "#ddd", anchor: "start" });
    out += strip(k, [g.num("cover", "Hidden"), g.steps("shape", "Shape"), g.steps("who", "Watcher", S.red), g.steps("edge", "Edge"), g.num("wobble", "Shake"), g.steps("caught", "Caught", S.pink)]);
    return out + k.caption(`through ${v("shape")}, ${cg === 2 ? "they look right back" : cg === 1 ? "they sense it" : "never seen"}`);
  });

  /* ======================= stillsInMotion ======================= */
  /* A row of still photos laid out like a slideshow; how many, how long each stays, the sound under them. */
  look("stillsInMotion", (v, k, g) => {
    const ct = Math.round(v.n("count"));
    const ea = v.n("each");
    const sd = idx(v, "sound", 4);
    const mv = idx(v, "move", 3);
    const kd = idx(v, "kind", 4);
    const bk = idx(v, "back", 3);
    let out = stage(k);
    const shown = Math.min(ct, 10);
    const pw = 300 / shown;
    for (let i = 0; i < shown; i++) {
      const x = 10 + i * pw;
      const fill = [k.mix("#c9a36a", "#7a5a3a", (i % 3) / 3), "#9a9a9a", "#ffffff", k.mix("#5a7a9a", "#2a3a4a", (i % 2) / 2)][kd];
      out += box(x + 1, 22, pw - 4, 50, kd === 1 ? "#ddd" : "#f4f1ea", { stroke: S.ink });
      out += box(x + 3, 24, pw - 8, 40, fill, { alpha: kd === 2 ? 0.9 : 1 });
      if (mv > 0 && i === 0) out += k.frame({ x: x + 5, y: 26, w: pw - 12, h: 36, color: S.gold, w2: 1 });
    }
    if (ct > 10) out += k.label({ x: 300, y: 16, text: "+" + (ct - 10), size: 9, color: "#ccc" });
    if (mv === 2) out += k.arrow({ x1: 14, y1: 16, x2: 40, y2: 16, color: S.gold, w: 1.2 });
    out += box(10, 80, Math.min(300, ct * ea * 4), 5, S.gold, { rx: 2 });
    out += k.label({ x: 10, y: 98, text: ["silence", "a voice", "music", "the sound goes on"][sd], size: 9, color: "#ccc", anchor: "start" });
    if (sd > 0) out += k.wave({ x: 90, y: 92, w: 120, h: 14, amp: [0, 0.4, 0.8, 0.6][sd], cycles: 6, noise: sd === 3 ? 0.6 : 0, color: S.green });
    if (bk > 0) out += guy(k, 290, { s: 0.55, color: S.blue, walk: 1 - (bk - 1) * 0.5 });
    out += strip(k, [g.num("count", "Stills"), g.num("each", "Each", "s"), g.steps("sound", "Sound", S.green), g.steps("move", "Move"), g.steps("kind", "Kind"), g.steps("back", "Back to moving")]);
    return out + k.caption(`${ct} ${v("kind")}, ${fmt(ea)} seconds each`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
