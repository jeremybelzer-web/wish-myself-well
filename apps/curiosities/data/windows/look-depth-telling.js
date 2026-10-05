/* look for the telling curiosities in data/db-depth-telling.js (borrowed from writing, 2026-10-05): the live picture
   at the top of each window, in the same house style as look-depth-frame.js (a stage on top, a strip of small
   labelled gauges below it, a caption). Every own setting moves something of its own. */
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

  /* ======================= listenerPlace ======================= */
  /* The story's people on the stage, and a gold listener figure placed by how close we sit, what we know and our side. */
  look("listenerPlace", (v, k, g) => {
    const cl = idx(v, "closeness", 4);
    const ad = idx(v, "addressed", 4);
    const kn = idx(v, "knows", 4);
    const rl = idx(v, "role", 6);
    const sd = v.n("side") / 100;
    const st = idx(v, "steady", 3);
    let out = stage(k);
    out += guy(k, 150, { color: S.blue, look: sd > 0.5 ? 1 : -1, label: "hero" }) + guy(k, 200, { color: S.grey, look: -1 });
    const lx = [40, 110, 150, 135][cl];
    const ly = [40, FY, 60, FY][cl];
    const ls = [0.5, 0.9, 0.6, 1.1][cl];
    out += cl === 2 ? glow(150, 70, 22, S.gold, 0.35) : guy(k, lx, { y: ly, s: ls, color: S.gold, look: 1 });
    for (let i = 0; i < ad; i++) out += k.arrow({ x1: 185, y1: 40 + i * 8, x2: lx + 12, y2: 40 + i * 8, color: S.pink, w: 1 });
    out += marks(230, 10, 80, 4, kn + 1, S.purple);
    out += k.label({ x: 270, y: 28, text: "we know", size: 8, color: "#ccc" });
    out += k.text({ x: 20, y: 22, text: ["🤫", "👂", "⚖️", "👁️", "🎥", "🎮"][rl], size: 16 });
    out += marks(60, 4, 60, 3, st + 1, S.green, 4);
    out += strip(k, [g.steps("closeness", "Close", S.gold), g.steps("addressed", "Spoken to", S.pink), g.steps("knows", "We know", S.purple), g.steps("role", "Role"), g.num("side", "Against", "%", S.red), g.steps("steady", "Changes", S.green)]);
    return out + k.caption(`we are ${v("role")}, ${v("closeness")}`);
  });

  /* ======================= unreliableTelling ======================= */
  /* What the teller says (a bubble) against what we see (the stage), with a crack growing between them. */
  look("unreliableTelling", (v, k, g) => {
    const d = v.n("doubt") / 5;
    const wh = idx(v, "who", 5);
    const why = idx(v, "why", 5);
    const cn = v.n("clues");
    const fd = idx(v, "found", 4);
    const af = idx(v, "after", 4);
    let out = stage(k);
    out += k.text({ x: 24, y: 40, text: ["🎙️", "🧠", "🧍", "🎥", "📔"][wh], size: 18 });
    out += k.bubble({ x: 90, y: 30, text: ["I lied", "I forgot", "I misread it", "I was unwell", "I covered for them"][why], w: 110, tail: -1 });
    out += guy(k, 230, { color: S.blue, mood: -0.4 * d });
    out += `<path d="M160 10 L${r1(166 + d * 8)} ${r1(40 + d * 20)} L${r1(156 - d * 6)} ${r1(70 + d * 20)} L162 112" stroke="${S.red}" stroke-width="${r1(0.5 + d * 3)}" fill="none" opacity="${r1(0.2 + d * 0.8)}"/>`;
    for (let i = 0; i < cn; i++) out += k.dot({ x: 180 + (i % 4) * 12, y: 60 + Math.floor(i / 4) * 12, r: 2.5, color: S.gold });
    out += marks(200, 6, 110, 4, fd + 1, S.purple);
    out += k.text({ x: 300, y: 100, text: ["🤷", "❓", "🔄", "🔁"][af], size: 14 });
    out += strip(k, [g.num("doubt", "Doubt", "", S.red), g.steps("who", "Teller"), g.steps("why", "Why"), g.num("clues", "Clues"), g.steps("found", "Found out", S.purple), g.steps("after", "After")]);
    return out + k.caption(`${v("who")} we can't trust: ${v("why")}`);
  });

  /* ======================= storyOrder ======================= */
  /* Scenes as numbered cards in the order the film shows them, with jump arrows and a time marker. */
  look("storyOrder", (v, k, g) => {
    const od = idx(v, "order", 5);
    const jp = v.n("jumps");
    const mk = idx(v, "marked", 4);
    const mr = idx(v, "marker", 5);
    const mt = idx(v, "meet", 4);
    const wy = idx(v, "why", 4);
    const ORD = [[1, 2, 3, 4, 5, 6], [3, 1, 2, 4, 5, 6], [6, 1, 2, 3, 4, 5], [4, 1, 6, 2, 5, 3], [6, 5, 4, 3, 2, 1]][od];
    let out = stage(k);
    ORD.forEach((n, i) => {
      const x = 14 + i * 50;
      out += box(x, 30, 40, 40, k.mix("#3a3a46", S.blue, n / 6), { rx: 3, stroke: mk > 1 ? S.gold : "#555" });
      out += k.label({ x: x + 20, y: 54, text: String(n), size: 14, color: "#fff" });
      if (mk === 3) out += k.text({ x: x + 20, y: 26, text: ["📅", "🎨", "💇", "📍", "🗣️"][mr], size: 9 });
    });
    out += marks(14, 80, 290, 20, Math.min(20, jp), S.red, 4);
    out += box(14 + [0, 125, 270, 280][mt], 90, 6, 14, S.green);
    out += k.label({ x: 300, y: 100, text: ["grab", "hide", "dread", "memory"][wy], size: 8, color: "#ccc", anchor: "end" });
    out += strip(k, [g.steps("order", "Order"), g.num("jumps", "Jumps", "", S.red), g.steps("marked", "Marked", S.gold), g.steps("marker", "Marker"), g.steps("meet", "Meet", S.green), g.steps("why", "Why")]);
    return out + k.caption(`${v("order")}, ${v.n("jumps")} jumps`);
  });

  /* ======================= frameStory ======================= */
  /* A teller on the left and the story as nested frames on the right. */
  look("frameStory", (v, k, g) => {
    const fr = v.n("frame") / 5;
    const tl = idx(v, "teller", 5);
    const rt = v.n("returns");
    const ly = v.n("layers");
    const tr = idx(v, "trust", 3);
    const en = idx(v, "ending", 4);
    let out = stage(k);
    const tw = 40 + fr * 70;
    out += box(0, 0, tw, FY, "#2c2630");
    out += k.text({ x: tw / 2, y: 60, text: ["👴", "🧳", "🚔", "📔", "🛏️"][tl], size: 22 });
    for (let i = 0; i < ly; i++) out += k.frame({ x: tw + 12 + i * 14, y: 12 + i * 12, w: 300 - tw - 12 - i * 28, h: 90 - i * 24, color: [S.gold, S.pink, S.teal][i] });
    out += guy(k, tw + (320 - tw) / 2, { s: 0.6, color: S.blue });
    out += marks(tw + 12, 104, 300 - tw - 12, 12, rt, S.gold, 4);
    out += k.label({ x: tw / 2, y: 100, text: ["trust", "mostly", "doubt"][tr], size: 8, color: [S.green, S.gold, S.red][tr] });
    out += k.text({ x: 300, y: 20, text: ["🚪", "🌀", "🔄", "♾️"][en], size: 14 });
    out += strip(k, [g.num("frame", "Frame"), g.steps("teller", "Teller"), g.num("returns", "Returns"), g.num("layers", "Layers"), g.steps("trust", "Trust"), g.steps("ending", "Ending")]);
    return out + k.caption(`told by ${v("teller")}`);
  });

  /* ======================= foreshadowHint / plantedThing ======================= */
  /* A row of scenes; the hint or plant glows early and links by an arc to where it comes true. */
  const seedLook = (id, o) => look(id, (v, k, g) => {
    const p = v.n(o.main) / 5;
    const n = v.n(o.dist);
    const ic = o.icons[idx(v, o.kind, o.icons.length)];
    let out = stage(k);
    for (let i = 0; i < 12; i++) out += box(8 + i * 25.5, 60, 22, 30, "#33323d", { stroke: "#555" });
    const end = Math.min(11, 1 + Math.round((n / 40) * 10));
    const x1 = 19 + 25.5;
    const x2 = 19 + end * 25.5;
    out += glow(x1, 75, 6 + p * 10, S.gold, 0.2 + p * 0.6) + k.text({ x: x1, y: 80, text: ic, size: 12 });
    out += `<path d="M${r1(x1)} 58 Q${r1((x1 + x2) / 2)} ${r1(10 - p * 5)} ${r1(x2)} 58" stroke="${S.gold}" stroke-width="1.5" fill="none" stroke-dasharray="4 3"/>`;
    out += box(x2 - 11, 60, 22, 30, o.endColor(v), { alpha: 0.8 });
    out += o.extra(v, k);
    out += strip(k, o.strip(g));
    return out + k.caption(o.cap(v));
  });
  seedLook("foreshadowHint", {
    main: "strength", dist: "scenes", kind: "form", icons: ["💬", "🔑", "🖼️", "🔔", "💭", "⛈️"],
    endColor: (v) => [S.green, S.grey, S.red][idx(v, "mood", 3)],
    extra: (v, k) => marks(8, 100, 120, 5, v.n("times"), S.gold, 4) + k.label({ x: 300, y: 104, text: v("noticed"), size: 8, color: "#ccc", anchor: "end" }),
    strip: (g) => [g.num("strength", "Clear"), g.steps("form", "Form"), g.num("scenes", "Scenes"), g.steps("mood", "Sign"), g.steps("noticed", "Noticed"), g.num("times", "Hints")],
    cap: (v) => `${v("form")} hints ${v.n("scenes")} scenes ahead`,
  });
  seedLook("plantedThing", {
    main: "plant", dist: "between", kind: "what", icons: ["🔫", "🔧", "📌", "🧍", "🏚️", "📜"],
    endColor: (v) => k0mix(v),
    extra: (v, k) => marks(8, 100, 120, 4, v.n("reminders"), S.blue, 4) + k.text({ x: 300, y: 30, text: ["👀", "😮", "🤯"][idx(v, "surprise", 3)], size: 14 }),
    strip: (g) => [g.num("plant", "Shown"), g.steps("what", "What"), g.num("between", "Scenes"), g.num("reminders", "Reminders", "", S.blue), g.num("payoff", "Payoff", "", S.gold), g.steps("surprise", "Surprise")],
    cap: (v) => `${v("what")} pays off after ${v.n("between")} scenes`,
  });
  function k0mix(v) {
    const p = v.n("payoff") / 5;
    return p > 0.66 ? S.gold : p > 0.33 ? S.orange : S.grey;
  }

  /* ======================= backstoryDelivery ======================= */
  /* A speech bubble of words on the left fading into a room full of things on the right as showing rises. */
  look("backstoryDelivery", (v, k, g) => {
    const sh = v.n("showing") / 5;
    const hw = idx(v, "how", 6);
    const am = idx(v, "amount", 4);
    const wn = idx(v, "when", 3);
    const ck = idx(v, "clunk", 4);
    const hd = v.n("held") / 5;
    let out = stage(k);
    out += guy(k, 160, { color: S.blue, arms: 0.2 });
    out += k.bubble({ x: 30, y: 20, text: "As you know...", w: 90 * (1 - sh) + 30, tail: 1 });
    for (let i = 0; i <= am; i++) out += k.text({ x: 220 + i * 22, y: 60 + (i % 2) * 18, text: ["🖼️", "🗝️", "💍", "📦"][i], size: 12 });
    out += box(205, 40, 110, 60, S.grey, { alpha: 0.6 * (1 - sh) });
    out += k.text({ x: 140, y: 30, text: ["🗣️", "💢", "🎙️", "🔤", "⏪", "🖼️"][hw], size: 14 });
    out += marks(30, 104, 90, 3, wn + 1, S.green, 4);
    out += box(205, 102, 110 * hd, 6, S.purple, { rx: 3 });
    if (ck === 0) out += k.label({ x: 160, y: 14, text: "clunk!", size: 10, color: S.red });
    out += strip(k, [g.num("showing", "Shown"), g.steps("how", "How"), g.steps("amount", "Amount"), g.steps("when", "When", S.green), g.steps("clunk", "Natural"), g.num("held", "Held back", "", S.purple)]);
    return out + k.caption(`${v("how")}, ${v("when")}`);
  });

  /* ======================= incitingMoment ======================= */
  /* A calm line of normal life that the event knocks off course, at its minute on a timeline. */
  look("incitingMoment", (v, k, g) => {
    const f = v.n("force") / 5;
    const mn = v.n("minutes") / 40;
    const kd = idx(v, "kind", 6);
    const ch = idx(v, "choice", 3);
    const sn = idx(v, "seen", 3);
    const rf = idx(v, "refusal", 3);
    let out = stage(k);
    const x = 20 + mn * 260;
    out += `<path d="M10 70 L${r1(x)} 70 L${r1(x + 20 + rf * 20)} ${r1(70 - f * 10)} L310 ${r1(70 - f * 50)}" stroke="${S.gold}" stroke-width="2" fill="none"/>`;
    out += k.text({ x, y: 60, text: ["🚪", "🕯️", "✉️", "💥", "🔍", "🤝"][kd], size: 12 + f * 10 });
    out += guy(k, x + 40, { s: 0.6, color: S.blue, lean: [-10, 0, 10][ch], walk: ch / 2 });
    out += box(10, 96, 300, 4, "#33323d") + box(10, 96, 300 * mn, 4, S.red);
    out += k.label({ x: 300, y: 22, text: ["before the film", "told about", "on screen"][sn], size: 8, color: "#ccc", anchor: "end" });
    out += strip(k, [g.num("force", "Force", "", S.red), g.num("minutes", "Minute", "m"), g.steps("kind", "Kind"), g.steps("choice", "Choice"), g.steps("seen", "Seen"), g.steps("refusal", "Says no")]);
    return out + k.caption(`${v("kind")} at ${v.n("minutes")} minutes`);
  });

  /* ======================= symbolThing ======================= */
  /* The thing in the middle, glowing with its meaning's color, repeated across the film and changed at the end. */
  const MEAN = ["#e86aa6", "#79b8ff", "#b33", "#e8a23a", "#777", "#5fae78"];
  look("symbolThing", (v, k, g) => {
    const w = v.n("weight") / 5;
    const wt = idx(v, "what", 6);
    const sf = idx(v, "standsFor", 6);
    const rt = v.n("returns");
    const cg = idx(v, "changes", 5);
    const nt = idx(v, "noticed", 4);
    const ic = ["🫖", "🏠", "🐦", "🌧️", "🎨", "🔔"][wt];
    let out = stage(k);
    out += glow(160, 50, 12 + w * 30, MEAN[sf], 0.15 + w * 0.5) + k.text({ x: 160, y: 58, text: ic, size: 22 });
    for (let i = 0; i < rt; i++) out += k.text({ x: 20 + i * 30, y: 100, text: i === rt - 1 ? ["", "🩹", "💔", "🤲", "🕊️"][cg] || ic : ic, size: 9, color: "#fff" });
    out += marks(240, 8, 70, 4, nt + 1, S.gold, 4);
    out += strip(k, [g.num("weight", "Weight"), g.steps("what", "What"), g.steps("standsFor", "Stands for"), g.num("returns", "Returns"), g.steps("changes", "Changes"), g.steps("noticed", "Obvious")]);
    return out + k.caption(`${v("what")} standing for ${v("standsFor")}`);
  });

  /* ======================= glimpseOfALife ======================= */
  /* A passer-by crossing near the hero, with a window opening onto their own story above them. */
  look("glimpseOfALife", (v, k, g) => {
    const d = v.n("depth") / 5;
    const sec = v.n("seconds");
    const hw = idx(v, "how", 6);
    const sh = idx(v, "ownShow", 5);
    const ap = idx(v, "arcPoint", 5);
    const ec = v.n("echo") / 5;
    let out = stage(k);
    out += guy(k, 60, { color: S.blue, look: 1, label: "hero" });
    out += guy(k, 180, { color: k.mix(S.grey, S.orange, d), walk: 0.6 });
    const ww = 20 + d * 110;
    out += k.frame({ x: 180 - ww / 2, y: 8, w: ww, h: 20 + d * 40, color: S.gold });
    out += k.text({ x: 180, y: 24 + d * 16, text: ["😂", "🎭", "💕", "🔪", "🍵"][sh], size: 10 + d * 10 });
    out += k.text({ x: 210, y: 96, text: ["💬", "🎒", "📞", "🖼️", "🏠", "🤝"][hw], size: 12 });
    out += marks(240, 104, 70, 5, ap + 1, S.purple, 4);
    out += box(20, 104, Math.min(200, sec * 1.6), 4, S.gold, { rx: 2 });
    if (ec > 0) out += `<path d="M75 50 Q120 ${r1(30 - ec * 6)} 165 50" stroke="${S.pink}" stroke-width="${r1(0.5 + ec * 2)}" fill="none" stroke-dasharray="3 3"/>`;
    out += strip(k, [g.num("depth", "Depth"), g.num("seconds", "On screen", "s"), g.steps("how", "Shown by"), g.steps("ownShow", "Their show"), g.steps("arcPoint", "Their arc", S.purple), g.num("echo", "Echo", "", S.pink)]);
    return out + k.caption(`${v.n("seconds")} seconds of ${v("ownShow")}`);
  });

  /* ======================= typeTalk ======================= */
  /* A character with their type's number, a speech bubble sized by words, and a health bar bending toward stress. */
  look("typeTalk", (v, k, g) => {
    const s = v.n("strength") / 5;
    const tp = idx(v, "type", 9);
    const hl = idx(v, "health", 5);
    const av = idx(v, "avoids", 9);
    const df = idx(v, "deflect", 9);
    const wd = idx(v, "words", 4);
    let out = stage(k);
    out += guy(k, 90, { color: k.mix(S.grey, S.blue, s), mood: (hl - 2) / 2, label: String(tp + 1) });
    out += k.bubble({ x: 120, y: 18, text: ["Fine.", "Well, I just...", "Let me tell you...", "And another thing, and..."][wd], w: 70 + wd * 30, tail: -1 });
    out += k.label({ x: 210, y: 80, text: "won't say: " + v("avoids").replace(/^that /, ""), size: 8, color: S.red });
    out += k.label({ x: 210, y: 94, text: "dodges: " + v("deflect"), size: 8, color: S.gold });
    out += box(20, 6, 60, 6, "#33323d", { rx: 3 }) + box(20, 6, 15 * hl, 6, [S.red, S.orange, S.grey, S.green, S.teal][hl], { rx: 3 });
    out += k.text({ x: 296, y: 30, text: ["📏", "🤲", "🏆", "🎨", "🔬", "🛡️", "🎉", "🦁", "🕊️"][tp], size: 16 });
    out += box(20, 16, 4 + av * 6, 3, S.red) + box(20, 22, 4 + df * 6, 3, S.gold);
    out += strip(k, [g.num("strength", "Shows"), g.steps("type", "Type"), g.steps("health", "Health", S.green), g.steps("avoids", "Avoids", S.red), g.steps("deflect", "Dodges"), g.steps("words", "Words")]);
    return out + k.caption(`${v("type")}, ${v("health")}`);
  });

  /* ======================= themeAloud ======================= */
  /* Someone says the theme in a bubble; the hero's reaction and the echoes across the film below. */
  look("themeAloud", (v, k, g) => {
    const b = v.n("blunt") / 5;
    const wh = idx(v, "who", 5);
    const wn = idx(v, "when", 3);
    const hd = idx(v, "heard", 4);
    const ag = v.n("again");
    const cg = idx(v, "changed", 3);
    let out = stage(k);
    const sx = 40 + wn * 110;
    out += k.text({ x: sx, y: 96, text: ["🧑", "🦸", "😈", "🧳", "🪧"][wh], size: 18 });
    out += k.bubble({ x: sx - 20, y: 14, text: b > 0.6 ? "Nobody gets anywhere alone." : "...alone, huh?", w: 80 + b * 70, tail: 1 });
    out += guy(k, 280, { color: S.blue, look: -1, mood: [-0.4, 0.4, 0, 0.6][hd], lean: hd === 2 ? 6 : 0 });
    out += marks(20, 70, 120, 4, ag, S.gold, 4);
    out += k.text({ x: 300, y: 60, text: ["", "🔁", "✨"][cg] || "·", size: 12, color: "#fff" });
    out += strip(k, [g.num("blunt", "Plain"), g.steps("who", "Who"), g.steps("when", "When"), g.steps("heard", "Hero"), g.num("again", "Again"), g.steps("changed", "Said back")]);
    return out + k.caption(`${v("who")} says it, ${v("when")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
