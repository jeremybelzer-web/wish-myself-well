/* look for the filters and adjustments, camera angle, archetype and wardrobe curiosities in data/db-depth-look.js
   (depth thread, look): the live picture at the top of each window. Same house style as look-heart-comedy.js and
   look-depth-world.js: a picture on top (y 0 to 120) that draws the shot, the people or the clothes as simple
   shapes, a strip of small labelled gauges below it, and a caption. Colors: gold = the main character, blue =
   other people, red = danger or the villain, green = safe or kind, purple = mood or memory. Every own setting
   moves something of its own. */
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
  /* A small clock face showing a share of a whole. */
  const timer = (k, x, y, p, color) => `<circle cx="${x}" cy="${y}" r="9" fill="#2a2a33" stroke="#666"/>` + (p > 0.001 ? k.pie({ x, y, r: 8, p: k.clamp(p, 0, 0.999), color: color || S.gold }) : "");
  /* A tiny shot: a dark frame with a thin border. */
  const shot = (x, y, w, h, color) => rect(x, y, w, h, "#101016", ` stroke="${color || "#555"}" stroke-width="1"`);
  /* A simple bust (head and shoulders) for close shots. */
  const bust = (k, x, y, s, color, mood, look) => `<rect x="${r1(x - 22 * s)}" y="${r1(y + 10 * s)}" width="${r1(44 * s)}" height="${r1(30 * s)}" rx="${r1(10 * s)}" fill="${color}" stroke="#1c1712" stroke-width="1.2"/>` + k.face({ x, y, r: 14 * s, mood: mood || 0, look: look || 0 });

  /* ---------- the strip of small gauges (copied from look-depth-world.js) ---------- */
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

  /* ======================= highlightGlow ======================= */
  /* A room with a lamp, a window and a person; the bright parts spill a soft glow in the chosen color. */
  look("highlightGlow", (v, k, g) => {
    const glow = v.n("glow");
    const from = idx(v, "from", 4);
    const spread = v.n("spread");
    const tint = idx(v, "tint", 5);
    const onWhat = idx(v, "onWhat", 5);
    const when = idx(v, "when", 4);
    const col = [S.white, S.gold, S.red, S.ice, S.pink][tint];
    let out = room(k, 92);
    out += rect(228, 16, 56, 44, "#dfe9f2") + line(256, 16, 256, 60, S.wall, 2) + line(228, 38, 284, 38, S.wall, 2);
    out += line(52, 0, 52, 30, "#555", 1.5) + circ(52, 36, 7, "#fff6d8");
    out += k.person({ x: 160, y: 112, s: 0.8, color: S.blue, mood: 0.3 });
    out += rect(0, 0, 320, 14, "#9ab8d6", ' opacity="0.5"') + rect(0, 100, 320, 4, "#b8c4cc", ' opacity="0.6"');
    /* the sources that glow: lamp, window, face, then sky strip and floor shine */
    const srcs = [[52, 36], [256, 38], [160, 34], [160, 6], [160, 102]];
    const n = [1, 2, 3, 5][from];
    for (let i = 0; i < n; i++) {
      const big = i === [0, 2, 3, 4, 0][onWhat] || onWhat === 4 ? 1.6 : 1;
      for (let j = 3; j >= 1; j--) out += circ(srcs[i][0], srcs[i][1], (6 + spread * 4) * (j / 3) * big, col, glow * 0.05 * (4 - j) * 0.6);
    }
    const most = onWhat === 4 ? [160, 60] : srcs[[0, 2, 3, 4, 0][onWhat]];
    out += k.ring({ x: most[0], y: most[1], r: onWhat === 4 ? 70 : 14, color: col, w: 1, dash: "3 3" });
    out += emo(k, 300, 82, ["🎞️", "💭", "💗", "💞"][when], 14);
    if (when === 3) out += k.arrow({ x1: 280, y1: 100, x2: 310, y2: 70, color: S.pink, w: 1.5 });
    out += strip(k, [g.num("glow", "Glow", ""), g.steps("from", "Starts at"), g.num("spread", "Spread", ""), g.word("tint", "Color"), g.word("onWhat", "Most on"), g.word("when", "When")]);
    return out + k.caption(`Glow ${fmt(glow)} of 5, ${v("tint")}`);
  });

  /* ======================= darkSwallows ======================= */
  /* A lit person on the right; the black eats in from the left, hiding something, with small glints left in it. */
  look("darkSwallows", (v, k, g) => {
    const crush = v.n("crush");
    const share = v.n("share") / 100;
    const hides = idx(v, "hides", 5);
    const edge = idx(v, "edge", 3);
    const lifted = idx(v, "lifted", 4);
    const glint = Math.round(v.n("glint"));
    let out = room(k, 90);
    out += emo(k, 60, 80, ["", "🪑", "🌗", "👤", "👁️"][hides] || "", 28);
    out += k.person({ x: 250, y: 114, s: 0.8, color: S.gold, mood: -0.2 });
    const wBlack = 320 * share;
    const dark = 0.45 + crush * 0.11;
    const bands = [1, 3, 7][edge];
    for (let i = 0; i < bands; i++) out += rect(0, 0, wBlack + i * 8, 120, "#000", ` opacity="${r1((dark / bands) * 100) / 100}"`);
    for (let i = 0; i < glint; i++) out += circ(20 + k.rnd(i + 3) * Math.max(10, wBlack - 30), 20 + k.rnd(i + 9) * 70, 1.8, "#fff6c0", 0.9);
    out += emo(k, 300, 18, ["🌑", "🌘", "💡", "⬛"][lifted], 14);
    out += strip(k, [g.num("crush", "Crush", ""), g.num("share", "Black", "%"), g.word("hides", "Hides"), g.steps("edge", "Edge"), g.word("lifted", "Lifts"), g.num("glint", "Glints", "")]);
    return out + k.caption(`${Math.round(share * 100)}% of the frame in black`);
  });

  /* ======================= hardeningLook ======================= */
  /* Five little frames from the start to the worst point; each gets harsher, greyer, grittier and warmer or colder. */
  look("hardeningLook", (v, k, g) => {
    const follows = v.n("follows") / 5;
    const con = v.n("contrast") / 100;
    const drain = v.n("drain") / 100;
    const grit = idx(v, "grit", 4);
    const temp = idx(v, "temp", 3);
    const steps = idx(v, "steps", 3);
    let out = k.bg(S.bg);
    const curve = (t) => (steps === 0 ? t : steps === 1 ? Math.floor(t * 4) / 4 + (t >= 1 ? 0 : 0) : t >= 0.99 ? 1 : 0);
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const t = curve(i / 4) * (0.25 + follows * 0.75);
      pts.push(t);
      const x = 10 + i * 61;
      out += rect(x, 40, 56, 60, k.mix("#6fa86a", "#8a8a8a", t * drain), ' stroke="#555"');
      out += rect(x, 40, 56, 22, k.mix("#9fd0e6", "#9a9a9a", t * drain));
      out += rect(x, 76, 56, 24, "#000", ` opacity="${r1(t * con * 70) / 100}"`);
      if (temp !== 1) out += rect(x, 40, 56, 60, temp === 0 ? S.orange : "#3c8cff", ` opacity="${r1(t * 30) / 100}"`);
      const dots = Math.round(t * [0, 4, 10, 20][grit]);
      for (let d = 0; d < dots; d++) out += circ(x + k.rnd(i * 31 + d) * 56, 40 + k.rnd(i * 17 + d + 5) * 60, 0.9, "#ddd", 0.7);
      out += k.person({ x: x + 28, y: 96, s: 0.38, color: S.gold, mood: 0.5 - t });
    }
    out += k.graph({ x: 10, y: 6, w: 300, h: 26, points: pts, color: S.red });
    out += strip(k, [g.num("follows", "Follows", ""), g.num("contrast", "Contrast", "%"), g.num("drain", "Drain", "%"), g.steps("grit", "Grit"), g.word("temp", "Warmth"), g.word("steps", "Pace")]);
    return out + k.caption(`At the worst: +${fmt(v.n("contrast"))}% contrast, -${fmt(v.n("drain"))}% color`);
  });

  /* ======================= tooPerfectLook ======================= */
  /* A sunny house and lawn pushed toward candy colors and shine, with a person whose face gets doll smooth and a crack somewhere. */
  look("tooPerfectLook", (v, k, g) => {
    const polish = v.n("polish");
    const bright = idx(v, "bright", 4);
    const candy = v.n("candy") / 100;
    const skin = idx(v, "skin", 4);
    const crack = idx(v, "crack", 4);
    const why = idx(v, "why", 5);
    let out = rect(0, 0, 320, 120, k.mix("#7fa7c4", "#a8e4ff", candy));
    out += rect(0, 84, 320, 36, k.mix("#5c8a4a", "#8ef0a8", candy));
    out += rect(90, 44, 80, 42, k.mix("#b89a7a", "#ffc2dc", candy)) + `<path d="M84 46 L130 18 L176 46 Z" fill="${k.mix("#7a4a3a", "#ff7fb0", candy)}"/>` + rect(122, 62, 16, 24, "#fff");
    out += circ(280, 22, 12, "#fff3a0");
    out += k.person({ x: 220, y: 112, s: 0.75, color: k.mix(S.blue, "#9fe0ff", candy), mood: 0.8 });
    const spots = [5, 3, 1, 0][skin];
    for (let i = 0; i < spots; i++) out += circ(216 + i * 2.4, 50 + (i % 2) * 2, 0.9, "#7a4a3a");
    if (skin >= 2) out += circ(220, 50, 8, "#ffe0d0", skin === 3 ? 0.6 : 0.3);
    for (let i = 0; i < Math.round(polish * 2); i++) out += emo(k, 20 + k.rnd(i + 2) * 280, 12 + k.rnd(i + 7) * 60, "✨", 9);
    if (crack === 1) out += rect(10, 92, 46, 14, S.brown);
    if (crack === 2) out += `<path d="M0 0 L60 0 L0 60 Z" fill="#000" opacity="0.75"/>`;
    if (crack === 3) out += `<path d="M150 0 L140 40 L162 60 L146 120" fill="none" stroke="#000" stroke-width="2.5"/>`;
    out += [0, 0.15, 0.3, 0.45].map((a, i) => (i === bright && a ? rect(0, 0, 320, 120, "#fff", ` opacity="${a}"`) : "")).join("");
    out += emo(k, 24, 20, ["🤥", "💭", "🏡", "📺", "🪤"][why], 16);
    out += strip(k, [g.num("polish", "Polish", ""), g.steps("bright", "Bright"), g.num("candy", "Candy", "%"), g.steps("skin", "Skin"), g.steps("crack", "Crack", S.red), g.word("why", "Hides")]);
    return out + k.caption(`Too perfect: ${fmt(polish)} of 5, hiding ${v("why")}`);
  });

  /* ======================= wrongColors ======================= */
  /* A room of colored things whose colors slide around the wheel, with red and blue ghosts pulling away at the edges. */
  look("wrongColors", (v, k, g) => {
    const wrong = v.n("wrongness") / 5;
    const slide = v.n("slide") * (0.3 + wrong * 0.7);
    const split = v.n("split");
    const pulse = idx(v, "pulse", 4);
    const cause = idx(v, "cause", 6);
    const backTo = idx(v, "backTo", 4);
    let out = rect(0, 0, 320, 120, k.hsl(30 + slide, 25, 22));
    const things = [[60, 70, 0], [120, 60, 120], [200, 75, 220], [260, 55, 50]];
    things.forEach(([x, y, h]) => {
      if (split > 0) out += circ(x - split, y, 16, k.hsl(0, 90, 55), 0.5) + circ(x + split, y, 16, k.hsl(220, 90, 60), 0.5);
      out += circ(x, y, 16, k.hsl(h + slide, 60 + wrong * 30, 55));
    });
    out += k.person({ x: 160, y: 116, s: 0.7, color: k.hsl(45 + slide, 80, 60), mood: -wrong });
    for (let i = 0; i < pulse; i++) out += k.ring({ x: 160, y: 60, r: 30 + i * 18, color: "#fff", w: 1, dash: pulse === 3 ? "2 3" : "" });
    out += emo(k, 22, 20, ["🤒", "🍸", "😱", "😢", "💭", "🌀"][cause], 16);
    const back = [[1, 0, 0, 0], [1, 0.6, 0.3, 0.1], [1, 0.6, 0.4, 0.3], [1, 1, 1, 1]][backTo];
    out += k.graph({ x: 250, y: 6, w: 60, h: 20, points: back, color: S.purple });
    out += strip(k, [g.num("wrongness", "Wrong", ""), g.num("slide", "Slide", "°"), g.num("split", "Split", ""), g.steps("pulse", "Pulse"), g.word("cause", "Cause"), g.steps("backTo", "Back", S.purple)]);
    return out + k.caption(`Colors slid ${Math.round(slide)} degrees: ${v("cause")}`);
  });

  /* ======================= overShoulder ======================= */
  /* The main shot past one shoulder at a far face, and two small shots below it: the other side, and who ends up alone. */
  look("overShoulder", (v, k, g) => {
    const sh = v.n("shoulder");
    const side = idx(v, "side", 3);
    const tight = idx(v, "tight", 4);
    const sharp = idx(v, "sharp", 3);
    const match = idx(v, "match", 3);
    const alone = idx(v, "alone", 4);
    let out = shot(6, 6, 200, 110, S.gold) + `<clipPath id="osA"><rect x="6" y="6" width="200" height="110"/></clipPath><clipPath id="osB"><rect x="214" y="6" width="100" height="54"/></clipPath><g clip-path="url(#osA)">`;
    const fs = [0.45, 0.7, 1.1, 1.6][tight];
    out += op(sharp === 0 ? 0.45 : 1, bust(k, side === 1 ? 80 : 136, 52, fs, S.blue, 0, side === 1 ? 0.6 : -0.6));
    if (sh > 0) {
      const sx = side === 1 ? 206 - sh * 14 : 6 + sh * 14;
      out += op(sharp === 2 ? 0.55 : 1, `<ellipse cx="${r1(side === 1 ? 206 : 6)}" cy="116" rx="${r1(sh * 18)}" ry="${r1(sh * 14)}" fill="${S.gold}" stroke="#1c1712"/>` + circ(side === 1 ? 206 - sh * 6 : 6 + sh * 6, 116 - sh * 15, sh * 6, "#3b2a20"));
      out += line(sx, 110, sx, 112, "#000", 0.5);
    }
    out += `</g>`;
    if (side === 2) out += k.arrow({ x1: 90, y1: 14, x2: 130, y2: 14, color: S.grey, w: 1.5 }) + k.arrow({ x1: 130, y1: 20, x2: 90, y2: 20, color: S.grey, w: 1.5 });
    /* the reverse shot, mirrored as closely as the match says */
    out += shot(214, 6, 100, 54, S.blue) + `<g clip-path="url(#osB)">`;
    out += bust(k, 270 + [20, 8, 0][match], 30, fs * [0.4, 0.5, 0.5][match] + [0.15, 0.05, 0][match], S.gold, 0, -0.6);
    if (sh > 0) out += `<ellipse cx="214" cy="60" rx="${r1(sh * 9 * [0.4, 0.8, 1][match])}" ry="${r1(sh * 7)}" fill="${S.blue}"/>`;
    out += `</g>`;
    out += shot(214, 64, 100, 52, alone ? S.red : "#555");
    if (alone === 0) out += bust(k, 246, 88, 0.45, S.blue) + bust(k, 282, 88, 0.45, S.gold);
    else if (alone === 3) out += bust(k, 246, 88, 0.45, S.blue, -0.4) + line(264, 66, 264, 114, "#fff", 1.5) + bust(k, 288, 88, 0.45, S.gold, -0.4);
    else out += bust(k, 264, 88, 0.6, alone === 1 ? S.blue : S.gold, alone === 1 ? -0.6 : 0.6);
    out += strip(k, [g.num("shoulder", "Shoulder", ""), g.word("side", "Side"), g.steps("tight", "Far face"), g.steps("sharp", "Sharp"), g.steps("match", "Match"), g.word("alone", "Alone")]);
    return out + k.caption(sh > 0 ? `Over the ${v("side")}, ${v("tight")} on the far face` : "No shoulder: a clean shot of the face");
  });

  /* ======================= sharedFrame ======================= */
  /* The main frame with both people (their gap, size and shape), and a row of small shots: how many hold both. */
  look("sharedFrame", (v, k, g) => {
    const together = v.n("together");
    const shots = v.n("shots") / 100;
    const gap = idx(v, "gap", 4);
    const bigger = idx(v, "bigger", 3);
    const when = idx(v, "when", 4);
    const shape = idx(v, "shape", 4);
    let out = k.bg(S.bg) + shot(10, 6, 196, 84, S.gold);
    const d = [14, 30, 56, 80][gap];
    const sA = 0.6 + (bigger === 0 ? 0.2 : bigger === 2 ? -0.1 : 0);
    const sB = 0.6 + (bigger === 2 ? 0.2 : bigger === 0 ? -0.1 : 0);
    const lookA = [0, 0, 1, -1][shape];
    const yB = shape === 1 ? 74 : 86;
    out += op(0.35 + together * 0.13, k.person({ x: 108 + d / 2, y: yB, s: shape === 1 ? sB * 0.75 : sB, color: S.blue, look: -lookA }) + k.person({ x: 108 - d / 2, y: 86, s: sA, color: S.gold, look: lookA }));
    out += emo(k, 190, 20, ["🚫", "🏁", "🤝", "✋"][when], 13);
    for (let i = 0; i < 10; i++) {
      const both = i < Math.round(shots * 10);
      const x = 8 + i * 30;
      out += shot(x, 96, 26, 20, both ? S.gold : "#555");
      out += both ? circ(x + 9, 106, 4, S.gold) + circ(x + 17, 106, 4, S.blue) : circ(x + 13, 106, 4, i % 2 ? S.blue : S.gold);
    }
    out += k.dial({ x: 262, y: 48, r: 26, p: together / 5, label: "together", color: S.green });
    out += strip(k, [g.num("together", "Together", ""), g.num("shots", "Shots", "%"), g.steps("gap", "Gap"), g.steps("bigger", "Bigger"), g.word("when", "When"), g.word("shape", "Shape")]);
    return out + k.caption(`${Math.round(shots * 100)}% of shots hold both of them`);
  });

  /* ======================= childHeight ======================= */
  /* Side view on the left: the camera at its height beside a grown-up and a child; on the right, what that camera sees. */
  look("childHeight", (v, k, g) => {
    const h = v.n("height");
    const whose = idx(v, "whose", 5);
    const faces = idx(v, "faces", 4);
    const share = v.n("share") / 100;
    const kneels = idx(v, "kneels", 4);
    const size = idx(v, "size", 4);
    let out = room(k, 112);
    const camY = 112 - h * 0.5;
    out += k.cam({ x: 20, y: camY, dir: 0, s: 0.6, color: S.gold });
    out += line(30, camY, 150, camY - 20, "#777", 1, "3 3") + line(30, camY, 150, camY + 20, "#777", 1, "3 3");
    out += k.person({ x: 120, y: 112, s: 1.05, color: S.blue });
    out += emo(k, 80, 108, ["🧒", "🐕", "🦽", "🛌", "🧍"][whose], 18);
    out += shot(170, 6, 144, 106, S.gold);
    const sc = [1, 1.2, 1.45, 1.7][size];
    const sA = faces === 3 ? 1.1 : 1.5 * sc;
    const adultY = [30 + 24 * sA, 8 + 58 * sA, 12 + 76 * sA, 112][faces];
    out += `<clipPath id="chv"><rect x="170" y="6" width="144" height="106"/></clipPath><g clip-path="url(#chv)">`;
    out += rect(180, 112 - 30 * sc + (h - 100) * 0.1, 50 * sc, 6, S.brown) + k.person({ x: 270, y: adultY, s: sA, color: S.blue, lean: faces === 2 ? -18 : 0 });
    if (kneels) out += k.person({ x: 210, y: 112, s: 0.75, color: [S.blue, S.green, S.gold, S.purple][kneels], mood: 0.6 });
    out += `</g>`;
    out += rect(170, 114, 144 * share, 4, S.green);
    out += strip(k, [g.num("height", "Camera", " cm"), g.word("whose", "Whose"), g.steps("faces", "Faces"), g.num("share", "Share", "%"), g.word("kneels", "Kneels"), g.steps("size", "Size")]);
    return out + k.caption(`Camera at ${fmt(h)} cm, ${v("whose")}'s height`);
  });

  /* ======================= closeOnThing ======================= */
  /* A big close shot of one small thing, a timer for how long we look, eyes for who sees it, and small repeats. */
  look("closeOnThing", (v, k, g) => {
    const weight = v.n("weight");
    const thing = idx(v, "thing", 6);
    const hold = v.n("hold");
    const seenBy = idx(v, "seenBy", 3);
    const fill = idx(v, "fill", 3);
    const times = Math.round(v.n("times"));
    let out = k.bg(S.bg) + shot(10, 6, 180, 108, S.gold);
    out += emo(k, 100, 74 + fill * 6, ["✋", "📱", "💍", "⏰", "🔫", "🍷"][thing], [34, 56, 80][fill]);
    if (weight > 0) out += k.ring({ x: 100, y: 58, r: 20 + fill * 12, color: S.red, w: weight * 0.8 });
    out += timer(k, 214, 22, hold / 6, S.orange) + k.label({ x: 228, y: 25, text: `${fmt(hold)}s`, size: 9, color: "#ddd", anchor: "start" });
    out += emo(k, 214, 58, "🎬", 12) + [0, 1, 2].map((i) => (i <= seenBy && seenBy > 0 ? emo(k, 236 + i * 20, 58, "👀", 12) : "")).join("");
    if (seenBy === 0) out += k.label({ x: 260, y: 58, text: "only us", size: 9, color: "#ddd" });
    for (let i = 0; i < times; i++) out += shot(204 + i * 22, 80, 18, 18, S.gold) + emo(k, 213 + i * 22, 94, ["✋", "📱", "💍", "⏰", "🔫", "🍷"][thing], 9);
    out += strip(k, [g.num("weight", "Matters", ""), g.word("thing", "Thing"), g.num("hold", "Look", "s"), g.steps("seenBy", "Seen by"), g.steps("fill", "Fills"), g.num("times", "Times", "")]);
    return out + k.caption(`Close on ${v("thing")} for ${fmt(hold)}s`);
  });

  /* ======================= glanceThenSee ======================= */
  /* Three shots in a row: their face looking, what they see, their face after. */
  look("glanceThenSee", (v, k, g) => {
    const pull = v.n("pull");
    const seen = idx(v, "seen", 5);
    const through = idx(v, "through", 3);
    const hold = v.n("faceHold");
    const reaction = idx(v, "reaction", 4);
    const looks = Math.round(v.n("looks"));
    let out = k.bg(S.bg);
    out += shot(8, 14, 90, 80, "#555") + bust(k, 53, 46, 1.1, S.gold, 0, 1);
    out += shot(106, 14, 100, 80, S.gold) + `<rect x="106" y="14" width="100" height="80" fill="none" stroke="${S.gold}" stroke-width="${r1(1 + pull * 0.8)}"/>`;
    const skew = [18, 8, 0][through];
    out += emo(k, 156 + skew, 66, ["👤", "📦", "⚠️", "🏞️", "❓"][seen], 34);
    if (through === 2) out += `<path d="M106 14 Q156 30 206 14 L206 94 Q156 78 106 94 Z" fill="none" stroke="#000" stroke-width="6" opacity="0.6"/>`;
    const w3 = 50 + hold * 10;
    out += shot(214, 14, Math.min(100, w3), 80, "#555") + bust(k, 214 + Math.min(100, w3) / 2, 46, 1.1, S.gold, [0, -0.2, -0.6, -1][reaction], 1);
    if (reaction === 3) out += emo(k, 300, 26, "❗", 12);
    out += k.arrow({ x1: 98, y1: 102, x2: 106, y2: 102, color: S.grey, w: 1.5 }) + k.arrow({ x1: 206, y1: 102, x2: 214, y2: 102, color: S.grey, w: 1.5 });
    for (let i = 0; i < looks; i++) out += circ(20 + i * 10, 106, 3, S.gold);
    out += strip(k, [g.num("pull", "Pull", ""), g.word("seen", "Sees"), g.steps("through", "Eyes"), g.num("faceHold", "Face hold", "s"), g.steps("reaction", "Reaction"), g.num("looks", "Looks", "")]);
    return out + k.caption(`They look, we see ${v("seen")}, back to the face`);
  });

  /* ======================= tricksterRole ======================= */
  /* The trickster in the middle, their trick, swirls of mischief, an arrow to the side they help, and who pays. */
  look("tricksterRole", (v, k, g) => {
    const mischief = v.n("mischief");
    const tool = idx(v, "tool", 6);
    const side = idx(v, "side", 4);
    const caught = idx(v, "caught", 4);
    const truth = v.n("truth");
    const cost = idx(v, "cost", 4);
    let out = room(k, 100);
    out += k.person({ x: 160, y: 112, s: 0.85, color: S.purple, mood: 0.7, arms: 0.6, lean: 6 });
    out += emo(k, 160, 22, ["😜", "🤥", "🥸", "🔀", "🌪️", "📜"][tool], 18);
    for (let i = 0; i < Math.round(mischief * 2); i++) {
      const a = (i / 10) * Math.PI * 2;
      out += emo(k, 160 + Math.cos(a) * 60, 64 + Math.sin(a) * 34, "🌀", 9);
    }
    out += k.person({ x: 40, y: 112, s: 0.6, color: S.gold }) + k.person({ x: 280, y: 112, s: 0.6, color: S.red });
    const tx = [280, 160, 160, 40][side];
    if (side === 1) out += k.ring({ x: 160, y: 60, r: 12, color: S.grey, w: 1.5 });
    else out += k.arrow({ x1: 160, y1: 90, x2: side === 2 ? 190 : tx, y2: side === 2 ? 70 : 90, color: S.green, w: 2 });
    out += [0, 1, 2, 3].map((i) => (i < caught ? emo(k, 210 + i * 14, 20, "⛓️", 10) : "")).join("");
    if (truth > 0) out += emo(k, 120, 30, "💡", 6 + truth * 3);
    out += emo(k, 300, 20, ["🙂", "🤡", "😢", "🙃"][cost], 14);
    out += strip(k, [g.num("mischief", "Mischief", ""), g.word("tool", "Trick"), g.steps("side", "Side"), g.steps("caught", "Caught", S.red), g.num("truth", "Truth", ""), g.word("cost", "Who pays")]);
    return out + k.caption(`A trickster of ${v("tool")}, on ${v("side")} side`);
  });

  /* ======================= caretaker ======================= */
  /* The caretaker in the middle sending care out to others; care coming back; a heart for themselves that shrinks. */
  look("caretaker", (v, k, g) => {
    const care = v.n("care");
    const whom = idx(v, "whom", 5);
    const self = v.n("self");
    const thanks = idx(v, "thanks", 4);
    const breaks = idx(v, "breaks", 4);
    const shows = idx(v, "shows", 5);
    let out = room(k, 100);
    out += k.person({ x: 160, y: 112, s: 0.85, color: S.green, mood: 0.4 - (breaks ? 0.8 : 0), lean: breaks === 3 ? 12 : 0 });
    out += emo(k, 50, 106, ["🧒", "👵", "👨‍👩‍👧", "🧍", "😠"][whom], 26);
    for (let i = 0; i < Math.round(care); i++) out += emo(k, 120 - i * 12, 70 - (i % 2) * 8, "💚", 10);
    for (let i = 0; i < thanks; i++) out += emo(k, 80 + i * 14, 40, "🙏", 10);
    if (self > 0) out += emo(k, 160, 22, "❤️", 6 + self * 3);
    out += emo(k, 260, 60, ["🧱", "💥", "🚪", "🤒"][breaks], 18);
    out += emo(k, 220, 100, ["🍲", "🧹", "💬", "🩹", "🤲"][shows], 16);
    out += strip(k, [g.num("care", "Care", ""), g.word("whom", "For"), g.num("self", "Self", ""), g.steps("thanks", "Thanks"), g.word("breaks", "Breaks"), g.word("shows", "Shows")]);
    return out + k.caption(`Caring ${fmt(care)} of 5 for ${v("whom")}`);
  });

  /* ======================= rivalToFriend ======================= */
  /* Two people who stand closer as they move from rivals to friends, the prize between them, and the road of scenes below. */
  look("rivalToFriend", (v, k, g) => {
    const close = idx(v, "closeness", 4);
    const over = idx(v, "over", 5);
    const scenes = Math.round(v.n("scenes"));
    const turn = idx(v, "turn", 4);
    const spark = Math.round(v.n("spark"));
    const back = idx(v, "backslide", 3);
    let out = room(k, 86);
    const d = [150, 100, 60, 30][close];
    out += k.person({ x: 160 - d / 2, y: 84, s: 0.7, color: S.gold, look: 1, mood: close / 3 - 0.5, arms: close === 3 ? 0.4 : -0.3 });
    out += k.person({ x: 160 + d / 2, y: 84, s: 0.7, color: S.blue, look: -1, mood: close / 3 - 0.5, arms: close === 3 ? 0.4 : -0.3 });
    out += emo(k, 160, 20, ["🏆", "💘", "🎽", "🎖️", "🥇"][over], 16);
    out += emo(k, 300, 20, ["👹", "🛟", "💔", "🥈"][turn], 14);
    for (let i = 0; i < spark; i++) out += emo(k, 140 + i * 10, 44, "⚡", 9);
    out += line(10, 106, 310, 106, "#555", 2);
    for (let i = 0; i < scenes; i++) out += line(10 + (i * 300) / Math.max(1, scenes), 102, 10 + (i * 300) / Math.max(1, scenes), 110, S.gold, 1.5);
    const dips = [0, 1, 3][back];
    for (let i = 0; i < dips; i++) out += emo(k, 60 + i * 90, 100, "↘️", 9);
    out += strip(k, [g.steps("closeness", "Now"), g.word("over", "Over"), g.num("scenes", "Scenes", ""), g.word("turn", "Turn"), g.num("spark", "Spark", ""), g.steps("backslide", "Fall out")]);
    return out + k.caption(`${v("closeness")}, after ${scenes} scenes`);
  });

  /* ======================= comicSidekick ======================= */
  /* The hero and the sidekick; laughs float up, a speech bubble says what we think, a star for the brave moment. */
  look("comicSidekick", (v, k, g) => {
    const funny = v.n("funny");
    const kind = idx(v, "kind", 5);
    const says = idx(v, "says", 3);
    const brave = idx(v, "brave", 3);
    const screen = v.n("screen") / 50;
    const heart = v.n("heart");
    let out = room(k, 100);
    out += k.person({ x: 110, y: 112, s: 0.9, color: S.gold });
    out += k.person({ x: 190, y: 112, s: 0.45 + screen * 0.35, color: S.orange, mood: 0.8, arms: 0.5, lean: -8 });
    out += emo(k, 230, 40, ["🤸", "📣", "🐔", "🤓", "🦄"][kind], 16);
    for (let i = 0; i < Math.round(funny); i++) out += emo(k, 180 + i * 14, 18 + (i % 2) * 8, "😂", 10);
    if (says) out += k.bubble({ x: 250, y: 74, w: 60, h: 18, text: says === 2 ? "Really?!" : "Hm.", size: 9, tail: -20 });
    if (brave) out += emo(k, 190, 40, "⭐", brave === 2 ? 22 : 12);
    if (heart > 0) out += emo(k, 172, 74, "❤️", 4 + heart * 2);
    out += rect(10, 108, 300 * screen, 4, S.orange);
    out += strip(k, [g.num("funny", "Funny", ""), g.word("kind", "Kind"), g.steps("says", "Says it"), g.steps("brave", "Brave"), g.num("screen", "Screen", "%"), g.num("heart", "Heart", "", S.red)]);
    return out + k.caption(`A ${v("kind")} sidekick, ${fmt(v.n("screen"))}% of the film`);
  });

  /* ======================= rightfulVillain ======================= */
  /* The villain facing the hero over a balance that tips toward how right they are; their color creeps toward the hero's. */
  look("rightfulVillain", (v, k, g) => {
    const belief = v.n("belief");
    const goal = idx(v, "goal", 5);
    const point = idx(v, "point", 4);
    const lineIdx = idx(v, "line", 4);
    const like = v.n("likeHero") / 5;
    const end = idx(v, "end", 4);
    let out = room(k, 100);
    out += k.person({ x: 60, y: 112, s: 0.85, color: S.gold, look: 1 });
    out += k.person({ x: 260, y: 112, s: 0.85, color: k.mix(S.red, S.gold, like * 0.8), look: -1, mood: end === 2 ? -0.8 : 0.2 });
    if (belief > 0) out += k.ring({ x: 260, y: 34, r: 10 + belief * 3, color: "#fff", w: 1.5 });
    out += emo(k, 260, 14, ["🌍", "👪", "⚖️", "🏛️", "🗡️"][goal], 12);
    const tilt = (point / 3) * 14;
    out += line(160, 40, 160, 90, "#999", 2) + line(130, 40 + tilt, 190, 40 - tilt, "#ccc", 2.5) + circ(130, 46 + tilt, 6, S.gold) + circ(190, 46 - tilt, 6, S.red);
    for (let i = 0; i <= lineIdx; i++) out += k.arrow({ x1: 230, y1: 70 + i * 8, x2: 200, y2: 70 + i * 8, color: S.red, w: 1.5 });
    out += emo(k, 300, 100, ["💀", "🏳️", "😔", "👑"][end], 14);
    out += strip(k, [g.num("belief", "Sure", ""), g.word("goal", "Wants"), g.steps("point", "Right"), g.steps("line", "Goes to", S.red), g.num("likeHero", "Like hero", ""), g.word("end", "Ends")]);
    return out + k.caption(`Wants ${v("goal")}, and is ${v("point")} right`);
  });

  /* ======================= costumeTurn ======================= */
  /* Before and after figures with steps between; the after outfit moves further from the before as the change grows. */
  look("costumeTurn", (v, k, g) => {
    const shift = v.n("shift") / 5;
    const dir = idx(v, "direction", 3);
    const moment = idx(v, "moment", 5);
    const kept = idx(v, "kept", 4);
    const seen = idx(v, "seen", 3);
    const steps = Math.round(v.n("steps"));
    let out = room(k, 100);
    const before = "#7a7a86";
    const target = [S.brown, S.purple, S.gold][dir];
    const after = k.mix(before, target, 0.2 + shift * 0.8);
    out += k.person({ x: 40, y: 112, s: 0.8, color: before });
    for (let i = 1; i < steps; i++) out += k.person({ x: 40 + (i * 180) / steps, y: 112, s: 0.5, color: k.mix(before, after, i / steps), alpha: 0.6 });
    out += k.person({ x: 230, y: 112, s: 0.8 + shift * 0.15, color: after, mood: 0.6 });
    if (kept) out += rect(223, 70 - [0, 0, 6, 12][kept], 14, [0, 6, 12, 24][kept], before);
    out += emo(k, 140, 20, ["🪞", "🛍️", "🕯️", "⚔️", "🏁"][moment], 16);
    const watchers = [0, 1, 4][seen];
    for (let i = 0; i < watchers; i++) out += emo(k, 270 + (i % 2) * 18, 30 + Math.floor(i / 2) * 22, "👀", 11);
    out += strip(k, [g.num("shift", "Change", ""), g.steps("direction", "Way"), g.word("moment", "When"), g.steps("kept", "Kept"), g.steps("seen", "Noticed"), g.num("steps", "Steps", "")]);
    return out + k.caption(`${v("direction")}, ${v("moment")}`);
  });

  /* ======================= groupDressed ======================= */
  /* A row of people whose outfits get more alike; one may be out of step, and the group may split in two. */
  look("groupDressed", (v, k, g) => {
    const alike = v.n("alike") / 5;
    const by = idx(v, "by", 5);
    const n = Math.round(v.n("size"));
    const out1 = idx(v, "outOfStep", 4);
    const chosen = idx(v, "chosen", 3);
    const drift = idx(v, "drift", 4);
    let out = room(k, 100);
    const gapMid = [0, 6, 40, 20][drift];
    const w = 280 / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const odd = out1 > 0 && i === n - 1;
      const base = drift === 2 && i >= n / 2 ? S.purple : S.blue;
      let col = k.mix(k.hsl(i * 53, 50, 50), base, alike * (drift === 3 ? 0.4 : drift === 1 ? 0.8 : 1));
      if (odd) col = [col, k.mix(col, S.orange, 0.4), S.orange, S.gold][out1];
      const x = 20 + i * w + w / 2 + (i >= n / 2 ? gapMid : 0) - gapMid / 2 + (odd && out1 === 3 ? 10 : 0);
      out += k.person({ x, y: 112, s: Math.min(0.8, 0.3 + w / 60), color: col });
    }
    out += emo(k, 20, 20, ["🎨", "🧥", "📛", "💇", "🕶️"][by], 16);
    out += emo(k, 300, 20, ["⛓️", "📋", "🦁"][chosen], 14);
    out += strip(k, [g.num("alike", "Alike", ""), g.word("by", "By"), g.num("size", "People", ""), g.steps("outOfStep", "Out of step", S.orange), g.steps("chosen", "Chosen"), g.steps("drift", "Over time")]);
    return out + k.caption(`${n} people tied by ${v("by")}`);
  });

  /* ======================= clashingPiece ======================= */
  /* A person in grey with one piece that clashes; the piece's size and color, its meaning, and where it ends up. */
  look("clashingPiece", (v, k, g) => {
    const clash = v.n("clash");
    const piece = idx(v, "piece", 6);
    const color = idx(v, "color", 4);
    const meaning = idx(v, "meaning", 5);
    const asked = idx(v, "asked", 3);
    const fate = idx(v, "fate", 4);
    let out = room(k, 100);
    out += k.person({ x: 140, y: 112, s: 1, color: "#6d6d78" });
    const pcol = k.mix("#7d7d88", S.red, [0.15, 0.4, 0.75, 1][color]);
    const spots = [[140, 112], [140, 33], [140, 58], [146, 64], [158, 80], [140, 106]];
    const [px, py] = fate === 0 ? spots[piece] : [[0, 0], [70, 108], [230, 70], [270, 108]][fate];
    const r = 4 + clash * 2;
    out += circ(px, py, r, pcol) + `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(r)}" fill="none" stroke="#fff" stroke-width="0.8"/>`;
    if (fate === 2) out += k.person({ x: 250, y: 112, s: 0.7, color: S.blue });
    if (fate === 3) out += emo(k, 270, 112, "🗑️", 16);
    if (fate === 1) out += emo(k, 70, 96, "❔", 10);
    out += emo(k, 300, 20, ["·", "🕯️", "🎭", "😄", "✊"][meaning], 14);
    if (asked) out += k.bubble({ x: 230, y: 24, w: asked === 2 ? 80 : 50, h: 18, text: asked === 2 ? "It was Mum's" : "Why?", size: 9, tail: -20 });
    out += strip(k, [g.num("clash", "Clash", ""), g.word("piece", "Piece"), g.steps("color", "Color", S.red), g.word("meaning", "Means"), g.steps("asked", "Asked"), g.word("fate", "Ends")]);
    return out + k.caption(`${v("piece")} that clashes ${fmt(clash)} of 5`);
  });

  /* ======================= notTheirClothes ======================= */
  /* A person in clothes too small or too big; their face, where the clothes came from, others' reaction, and the fit later. */
  look("notTheirClothes", (v, k, g) => {
    const wrong = v.n("wrong") / 5;
    const way = idx(v, "way", 4);
    const whose = idx(v, "whose", 5);
    const aware = idx(v, "aware", 3);
    const grows = idx(v, "grows", 3);
    const others = idx(v, "others", 4);
    let out = room(k, 100);
    const scaleW = 1 + [-0.45, -0.2, 0.25, 0.6][way] * (0.3 + wrong * 0.7);
    out += k.person({ x: 110, y: 112, s: 0.9, color: S.gold, mood: [-0.6, -0.3, 0.6][aware] });
    out += `<rect x="${r1(110 - 11 * scaleW)}" y="${r1(60 - (scaleW - 1) * 2)}" width="${r1(22 * scaleW)}" height="${r1(32 * scaleW)}" rx="5" fill="${S.brown}" stroke="#1c1712" opacity="0.92"/>`;
    out += emo(k, 40, 30, ["👕", "🤝", "🦹", "🕯️", "📏"][whose], 16);
    out += emo(k, 190, 60, ["·", "🙂", "😆", "🪡"][others], 16);
    out += k.arrow({ x1: 210, y1: 90, x2: 250, y2: 90, color: S.grey, w: 1.5 });
    const later = 1 + (scaleW - 1) * [1, 0.5, 0][grows];
    out += k.person({ x: 280, y: 112, s: 0.7, color: S.gold, mood: 0.5 }) + `<rect x="${r1(280 - 8.5 * later)}" y="72" width="${r1(17 * later)}" height="${r1(24 * later)}" rx="4" fill="${S.brown}" stroke="#1c1712" opacity="0.92"/>`;
    out += strip(k, [g.num("wrong", "Bad fit", ""), g.steps("way", "Way"), g.word("whose", "Whose"), g.steps("aware", "Feels"), g.steps("grows", "Grows", S.green), g.word("others", "Others")]);
    return out + k.caption(`${v("way")}, ${v("whose")}`);
  });

  /* ======================= uniformOff ======================= */
  /* A person with a uniform piece lifting off; the pile it leaves, who watches, and whether it comes back on. */
  look("uniformOff", (v, k, g) => {
    const weight = v.n("weight");
    const uni = idx(v, "uniform", 6);
    const how = idx(v, "how", 4);
    const first = idx(v, "first", 5);
    const back = idx(v, "back", 3);
    const who = idx(v, "who", 3);
    let out = room(k, 100);
    const ucol = ["#5a6a3a", "#2a3a6a", "#e8eef2", "#222", "#a03030", "#3a4a8a"][uni];
    out += k.person({ x: 140, y: 112, s: 1, color: ucol, mood: [0, -0.6, -0.9, 0.2][how], arms: how === 1 ? 0.8 : 0.2 });
    out += emo(k, 40, 30, ["🪖", "👮", "🩺", "⛪", "🍽️", "🎒"][uni], 18);
    const fx = 190, fy = [30, 56, 66, 108, 70][first];
    out += emo(k, fx, fy, ["🧢", "📛", "🧥", "👞", "📦"][first], 16) + k.arrow({ x1: 150, y1: fy, x2: fx - 10, y2: fy, color: S.grey, w: 1.5 });
    out += emo(k, 240, 112, ["🫳", "😠", "✂️", "📦"][how], 14);
    out += rect(214, 112 - weight * 4, 30, weight * 4, ucol, ' stroke="#555"');
    if (back) out += k.arrow({ x1: 230, y1: 40, x2: 160, y2: 30, color: S.green, w: back === 2 ? 2.5 : 1.2 });
    const watchers = [0, 1, 4][who];
    for (let i = 0; i < watchers; i++) out += k.person({ x: 270 + (i % 2) * 22, y: 112 - Math.floor(i / 2) * 6, s: 0.45, color: S.blue, look: -1 });
    out += strip(k, [g.num("weight", "Matters", ""), g.word("uniform", "Uniform"), g.word("how", "How"), g.word("first", "First"), g.steps("back", "Back on"), g.steps("who", "Seen by")]);
    return out + k.caption(`The ${v("uniform")} uniform, ${v("how")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
