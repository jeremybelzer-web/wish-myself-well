/* look for the inner life and group curiosities in data/db-depth-minds.js (depth thread, minds): the live picture
   at the top of each window. Same house style as look-heart-comedy.js: a stage on top (y 0 to 120) that acts out
   the curiosity, a strip of small labelled gauges below it, and a caption. Colors: gold = the self or the change,
   blue = the main character, red = blame, fear or a cost, grey = silence or the crowd, green = help or letting go,
   purple = the group or what pushes on them, pink = warmth. Every own setting moves something of its own. */
(function (W) {
  const S = { bg: "#15151c", floor: "#2a2833", gold: "#ffd166", red: "#e4572e", blue: "#4a6fa5", orange: "#e8913a", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", wood: "#6b5a45", frame: "#23222b" };
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
  /* A row of small marks across the stage: n of them, the first `on` lit. */
  const marks = (k, x, y, w, n, on, color, h) => {
    let out = "";
    for (let i = 0; i < n; i++) out += `<rect x="${r1(x + (i * w) / n)}" y="${r1(y)}" width="${r1(w / n - 3)}" height="${h || 6}" rx="2" fill="${i < on ? color || S.gold : "#33323d"}"/>`;
    return out;
  };
  /* A soft glow: a circle of feeling around a point. */
  const glow = (x, y, r, color, a) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(Math.max(0.5, r))}" fill="${color}" opacity="${r1(a * 100) / 100}"/>`;
  /* A chair seen from the side. */
  const chair = (x, color, empty) => `<rect x="${r1(x - 9)}" y="${FY - 22}" width="18" height="4" fill="${color || S.wood}"/><rect x="${r1(x + 6)}" y="${FY - 44}" width="4" height="26" fill="${color || S.wood}"/><rect x="${r1(x - 9)}" y="${FY - 18}" width="3" height="18" fill="${color || S.wood}"/><rect x="${r1(x + 6)}" y="${FY - 18}" width="3" height="18" fill="${color || S.wood}"/>` + (empty ? `<rect x="${r1(x - 12)}" y="${FY - 48}" width="24" height="50" fill="none" stroke="${S.grey}" stroke-dasharray="3 3" opacity="0.6"/>` : "");

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


  /* ======================= the mind ======================= */

  /* ======================= selfStory ======================= */
  /* The person stands in a spotlight wearing their role as a sign over the head; a faint ghost beside them is what the
     facts show, further away the worse the fit. Bubbles are the retellings, the others react on the right. */
  const ROLE = ["🥀 victim", "🦸 hero", "🙈 screw-up", "🧱 holds it together", "🚪 outsider"];
  look("selfStory", (v, k, g) => {
    const gr = v.n("grip");
    const rl = idx(v, "role", 5);
    const ft = idx(v, "fit", 4);
    const rt = idx(v, "retells", 4);
    const ot = idx(v, "others", 4);
    const dr = idx(v, "drops", 4);
    let out = stage(k);
    const px = 110;
    out += glow(px, 70, 30 + gr * 5, S.gold, 0.08 + gr * 0.03);
    out += k.ring({ x: px, y: 70, r: 34, color: S.gold, w: 0.5 + gr * 0.8 });
    out += guy(k, px, { s: 1, color: S.blue, mood: rl === 1 ? 0.6 : rl === 0 ? -0.5 : 0, arms: rl === 1 ? 0.8 : 0 });
    out += guy(k, px + 18 + ft * 14, { s: 0.95, color: S.grey, alpha: 0.25 + ft * 0.08, mood: 0 });
    out += k.label({ x: px + 18 + ft * 14, y: FY + 6, text: "the facts", size: 7, color: "#999" });
    out += chip(k, px, 20, ROLE[rl], [S.gold, S.gold, S.orange, S.gold][dr], "middle");
    if (dr === 1) out += `<path d="M${px - 10} 12 L${px - 2} 20 L${px - 8} 26" stroke="#000" stroke-width="2" fill="none"/>`;
    if (dr === 2) out += k.arrow({ x1: px + 40, y1: 16, x2: px + 60, y2: 16, color: S.green, w: 2 });
    if (dr === 3) out += `<line x1="${px - 40}" y1="20" x2="${px + 40}" y2="12" stroke="${S.red}" stroke-width="3"/>`;
    for (let i = 0; i < rt; i++) out += k.dot({ x: 20 + i * 12, y: 44, r: 4, color: "#fff" });
    for (let i = 0; i < 3; i++) out += guy(k, 230 + i * 26, { s: 0.7, color: S.purple, mood: [0.3, -0.2, -0.6, 1][ot], arms: ot === 2 ? 0.9 : 0, look: ot === 1 ? 1 : -1 });
    out += strip(k, [g.num("grip", "Grip"), g.word("role", "Role"), g.steps("fit", "Fit", S.grey), g.steps("retells", "Retold"), g.word("others", "Others", S.purple), g.steps("drops", "In the end", S.green)]);
    return out + k.caption(`plays ${v("role")}, others ${v("others")}`);
  });

  /* ======================= allOrNothing ======================= */
  /* A bar split into black and white with a grey middle that grows as the thinking softens. A flip arrow shows how
     fast good turns bad; the cost sits on the right. */
  const ABOUT = ["🪞", "👥", "📋", "❤️", "⚖️"];
  look("allOrNothing", (v, k, g) => {
    const ex = v.n("extreme");
    const ab = idx(v, "about", 5);
    const wd = idx(v, "words", 4);
    const fl = idx(v, "flip", 3);
    const co = idx(v, "cost", 4);
    const gy = idx(v, "grey", 3);
    let out = stage(k);
    const greyW = Math.max(4, (5 - ex) * 30 + gy * 12);
    out += `<rect x="20" y="20" width="${r1((280 - greyW) / 2)}" height="22" fill="#111" stroke="#666"/>`;
    out += `<rect x="${r1(20 + (280 - greyW) / 2)}" y="20" width="${r1(greyW)}" height="22" fill="${S.grey}"/>`;
    out += `<rect x="${r1(20 + (280 + greyW) / 2)}" y="20" width="${r1((280 - greyW) / 2)}" height="22" fill="#f4f4f4" stroke="#666"/>`;
    out += k.text({ x: 160, y: 72, text: ABOUT[ab], size: 26 });
    out += chip(k, 160, 92, ["sometimes", "usually", "ALWAYS / NEVER", "ALL or NOTHING"][wd], wd > 1 ? S.red : "#33323d", "middle");
    if (fl > 0) out += k.arrow({ x1: 60, y1: 60, x2: 60 + fl * 30, y2: 60 + (fl === 2 ? 30 : 10), color: S.red, w: 1 + fl });
    out += guy(k, 40, { s: 0.8, color: S.blue, mood: -0.2 * wd });
    out += chip(k, 306, 70, ["no cost", "a missed chance", "a friend", "everything"][co], co > 1 ? S.red : "#33323d", "end");
    out += strip(k, [g.num("extreme", "Black and white"), g.word("about", "About"), g.steps("words", "Words", S.red), g.steps("flip", "Flips", S.red), g.steps("cost", "Cost", S.red), g.steps("grey", "Sees grey", S.grey)]);
    return out + k.caption(`all or nothing about ${v("about")}, costs ${v("cost")}`);
  });

  /* ======================= innerVoice ======================= */
  /* The person on the left, and the voice from the past as a ghost figure behind them, louder means bigger. */
  const SAYS = ["\"Well done.\"", "\"Be careful.\"", "\"You're useless.\"", "\"Do it now.\""];
  const WHOSE = ["parent", "teacher", "coach", "old friend", "ex"];
  look("innerVoice", (v, k, g) => {
    const ld = v.n("loudness");
    const wh = idx(v, "whose", 5);
    const sy = idx(v, "says", 4);
    const sh = idx(v, "shown", 4);
    const wn = idx(v, "when", 4);
    const an = idx(v, "answers", 4);
    let out = stage(k);
    const col = [S.green, S.orange, S.red, S.purple][sy];
    out += guy(k, 110, { s: 1, color: S.blue, mood: sy === 2 ? -0.6 : sy === 0 ? 0.5 : -0.1, look: an === 3 ? 1 : -1, arms: an === 1 ? 0.7 : an === 3 ? 0.9 : 0 });
    if (sh === 2) out += guy(k, 200, { s: 0.9 + ld * 0.06, color: col, alpha: 0.35 + ld * 0.08, look: -1 });
    if (sh === 1) out += k.wave({ x: 170, y: 40, w: 130, h: 20, amp: 0.2 + ld * 0.15, cycles: 5, color: col });
    if (sh === 3) out += k.frame({ x: 180, y: 30, w: 110, h: 60, color: col, w2: 2 }) + k.text({ x: 235, y: 70, text: "🎞️", size: 22, alpha: 0.8 });
    if (sh === 0) out += glow(110, 45, 8 + ld * 3, col, 0.3);
    out += k.bubble({ x: 230, y: 18, text: SAYS[sy], w: 100, h: 22, tail: -20, size: 9 });
    out += k.label({ x: 300, y: 104, text: WHOSE[wh], size: 9, color: col, anchor: "end" });
    out += marks(k, 14, 10, 80, 4, wn + 1, col);
    if (an > 0) out += chip(k, 60, 30, ["", "argues", "ignores", "talks back!"][an], an === 3 ? S.green : "#33323d", "middle");
    out += strip(k, [g.num("loudness", "Loudness", "", col), g.word("whose", "Whose"), g.word("says", "Says"), g.word("shown", "Shown"), g.steps("when", "When", col), g.steps("answers", "Answers", S.green)]);
    return out + k.caption(`a ${WHOSE[wh]}'s voice: ${v("says")}. Answer: ${v("answers")}`);
  });

  /* ======================= thinkOrLeap ======================= */
  /* A person at a cliff edge: thought clouds pile up the more they think; a jump arc when they act. */
  const SHOWN_T = ["😐", "🚶", "💬", "📝", "💭"];
  look("thinkOrLeap", (v, k, g) => {
    const ln = idx(v, "lean", 5);
    const op = v.n("options");
    const tm = idx(v, "time", 4);
    const sh = idx(v, "shown", 5);
    const rs = idx(v, "result", 4);
    const pt = idx(v, "partner", 3);
    let out = stage(k);
    out += `<rect x="190" y="${FY}" width="130" height="8" fill="#0b0b0f"/>`;
    const px = 90 + (4 - ln) * 22;
    out += guy(k, px, { s: 0.95, color: S.blue, lean: (4 - ln) * 4, walk: ln < 2 ? 0.6 : 0, mood: rs === 3 ? 0.6 : rs === 1 ? -0.5 : 0 });
    for (let i = 0; i < Math.round(op); i++) out += glow(px - 30 + (i % 4) * 20, 22 + Math.floor(i / 4) * 16, 7, "#fff", 0.15 + ln * 0.08);
    out += k.text({ x: px + 26, y: 52, text: SHOWN_T[sh], size: 16 });
    if (ln < 2) out += `<path d="M${px} 40 Q ${px + 60} ${10 + ln * 10} ${px + 110} 70" stroke="${S.gold}" stroke-width="2" fill="none" stroke-dasharray="4 3"/>`;
    out += k.clock({ x: 30, y: 30, r: 12, p: [0.05, 0.25, 0.6, 0.95][tm] });
    out += chip(k, 306, 100, ["missed", "wrong move", "lucky", "right move"][rs], [S.grey, S.red, S.orange, S.green][rs], "end");
    if (pt > 0) out += guy(k, 40, { s: 0.75, color: S.purple, walk: pt === 1 ? 0.8 : 0, arms: pt === 2 ? -0.5 : 0.5 });
    out += strip(k, [g.steps("lean", "Think or jump"), g.num("options", "Choices"), g.steps("time", "Time"), g.word("shown", "Shown"), g.word("result", "Result"), g.word("partner", "Partner", S.purple)]);
    return out + k.caption(`${v("lean")}, ${v("result")}`);
  });

  /* ======================= expectWorst ======================= */
  /* A thought cloud of the imagined disaster grows over the person; steps of the spiral climb up; the real outcome
     is a door on the right. */
  const FEAR = ["🩺", "💞", "💼", "🔦", "🧳"];
  look("expectWorst", (v, k, g) => {
    const dr = v.n("dread");
    const sh = idx(v, "shown", 4);
    const ab = idx(v, "about", 5);
    const sp = v.n("spiral");
    const re = idx(v, "reality", 4);
    const st = idx(v, "stops", 4);
    let out = stage(k);
    out += guy(k, 70, { s: 1, color: S.blue, mood: -0.15 * dr, arms: sh === 1 ? 0.6 : 0 });
    const cloudR = 10 + dr * 7;
    out += `<ellipse cx="150" cy="44" rx="${r1(cloudR * 1.4)}" ry="${r1(cloudR * 0.8)}" fill="${S.red}" opacity="${r1((0.15 + sh * 0.18) * 100) / 100}" stroke="${S.red}"${sh === 3 ? "" : ' stroke-dasharray="3 3"'}/>`;
    out += k.text({ x: 150, y: 52, text: FEAR[ab], size: 14 + dr * 2 });
    for (let i = 0; i < Math.round(sp); i++) out += `<rect x="${r1(100 + i * 14)}" y="${r1(FY - 8 - i * 8)}" width="12" height="${r1(8 + i * 8)}" fill="${S.red}" opacity="0.5"/>`;
    out += `<rect x="262" y="40" width="36" height="72" fill="${[S.green, "#6c9a6c", S.orange, S.red][re]}"/>`;
    out += k.label({ x: 280, y: 34, text: ["much better", "better", "as bad", "worse"][re], size: 8, color: "#ddd" });
    if (st > 0) out += chip(k, 14, 22, ["", "a friend", "it happens", "self"][st], S.green);
    out += strip(k, [g.num("dread", "Dread", "", S.red), g.steps("shown", "Shown", S.red), g.word("about", "About"), g.num("spiral", "Spiral", " steps", S.red), g.steps("reality", "Really"), g.word("stops", "Stopped by", S.green)]);
    return out + k.caption(`worst case about ${v("about")}, really ${v("reality")}`);
  });

  /* ======================= replaying ======================= */
  /* The same little film frame repeated in a row: each copy a bit different as the replays change. */
  const MOMENT = ["❌", "🗯️", "🕳️", "🚌", "👋"];
  look("replaying", (v, k, g) => {
    const st = v.n("stuck");
    const mo = idx(v, "moment", 5);
    const sh = idx(v, "shown", 4);
    const tm = Math.round(v.n("times"));
    const ch = idx(v, "changes", 4);
    const lg = idx(v, "letsGo", 3);
    let out = stage(k);
    const n = Math.max(1, tm);
    const w = Math.min(36, 260 / n);
    for (let i = 0; i < n; i++) {
      const x = 20 + i * (w + 3);
      const shift = ch * i * 0.08;
      out += `<rect x="${r1(x)}" y="14" width="${r1(w)}" height="30" fill="${k.mix("#33323d", S.gold, Math.min(1, shift))}" stroke="#666" opacity="${r1((0.3 + sh * 0.2) * 100) / 100}"/>`;
      if (sh >= 2) out += k.text({ x: x + w / 2, y: 35, text: MOMENT[mo], size: Math.min(14, w * 0.5) });
    }
    if (ch === 3) out += k.text({ x: 300, y: 36, text: "❗", size: 14 });
    out += k.text({ x: 180, y: 66, text: MOMENT[mo], size: 14, alpha: 0.9 });
    out += guy(k, 150, { s: 1, color: S.blue, mood: -0.15 * st + lg * 0.3, look: lg === 2 ? 1 : -1 });
    out += k.ring({ x: 150, y: 50, r: 10 + st * 4, color: S.purple, w: 1 + st * 0.5, dash: "4 3" });
    out += chip(k, 300, 100, ["holds on", "a little", "lets go"][lg], lg === 2 ? S.green : "#33323d", "end");
    out += strip(k, [g.num("stuck", "Stuck", "", S.purple), g.word("moment", "Moment"), g.steps("shown", "Shown"), g.num("times", "Replays", "x"), g.steps("changes", "Changes", S.gold), g.steps("letsGo", "Lets go", S.green)]);
    return out + k.caption(`replaying ${v("moment")} ${tm} times`);
  });

  /* ======================= the group ======================= */

  /* ======================= quietMajority ======================= */
  /* A row of faces at a table: the silent ones are dimmed with a closed mouth; signs leak as small marks above them. */
  const SIGN = ["", "👀", "🙄", "🤫"];
  look("quietMajority", (v, k, g) => {
    const sl = v.n("silent");
    const gs = Math.round(v.n("groupSize"));
    const wy = idx(v, "why", 4);
    const sg = idx(v, "signs", 4);
    const br = idx(v, "breaks", 3);
    const sh = idx(v, "shot", 3);
    let out = stage(k);
    const n = Math.min(12, Math.max(3, Math.round(gs / 2.5)));
    const quiet = Math.round((n * sl) / 5);
    out += `<rect x="20" y="${FY - 28}" width="280" height="6" fill="${S.wood}"/>`;
    for (let i = 0; i < n; i++) {
      const x = 30 + (i * 260) / Math.max(1, n - 1);
      const silent = i < quiet && !(br === 2) && !(br === 1 && i === 0);
      out += k.face({ x, y: FY - 44, r: 9, mood: silent ? -0.3 : 0.2, mouth: silent ? 0 : 0.8, color: silent ? S.grey : S.gold, eyes: 1, look: sg === 1 ? 1 : 0 });
      if (silent && sg > 0 && i % 2 === 0) out += k.text({ x, y: FY - 60, text: SIGN[sg], size: 9 });
    }
    if (sg > 0) out += chip(k, 306, 52, SIGN[sg] + " leaks", "#33323d", "end");
    out += k.frame({ x: [140, 80, 14][sh], y: 26, w: [40, 160, 292][sh], h: 70, color: S.gold, w2: 1.5 });
    out += k.label({ x: 14, y: 18, text: ["fear", "habit", "each thinks alone", "not my business"][wy], size: 9, color: S.purple, anchor: "start" });
    if (br > 0) out += k.bubble({ x: 230, y: 18, text: br === 1 ? "I disagree." : "We all do!", w: 90, h: 20, tail: -20, size: 9 });
    out += strip(k, [g.num("silent", "Silent", "", S.grey), g.num("groupSize", "Group", ""), g.word("why", "Why", S.purple), g.steps("signs", "Signs"), g.steps("breaks", "Breaks", S.green), g.steps("shot", "Shot")]);
    return out + k.caption(`${quiet} of ${n} keep quiet, ${v("breaks")}`);
  });

  /* ======================= insideJoke ======================= */
  /* A tight circle of friends sharing the joke, linked by gold lines; the outsider stands to the side. */
  const JOKE = ["🏷️", "💬", "🤙", "🎵", "📖"];
  look("insideJoke", (v, k, g) => {
    const bd = v.n("bond");
    const kd = idx(v, "kind", 5);
    const us = Math.round(v.n("uses"));
    const ou = idx(v, "outsider", 4);
    const wt = idx(v, "weight", 3);
    const ls = idx(v, "last", 4);
    let out = stage(k);
    const xs = [100, 130, 160, 190];
    xs.forEach((x, i) => (out += guy(k, x, { s: 0.8, color: [S.blue, S.purple, S.pink, S.green][i], mood: wt === 2 ? -0.2 : 0.7, look: i < 2 ? 1 : -1 })));
    for (let i = 0; i < xs.length - 1; i++) out += `<line x1="${xs[i]}" y1="40" x2="${xs[i + 1]}" y2="40" stroke="${S.gold}" stroke-width="${r1(0.5 + bd)}"/>`;
    out += k.text({ x: 145, y: 24, text: JOKE[kd], size: 16, alpha: ls === 3 ? 0.3 : 1 });
    out += marks(k, 14, 10, 70, 8, us, S.gold);
    if (ou > 0) out += guy(k, ou === 3 ? 222 : 270, { s: 0.8, color: S.grey, mood: ou === 3 ? 0.6 : -0.4, look: -1 }) + k.label({ x: 270, y: 22, text: ["", "lost", "shut out", "let in"][ou], size: 9, color: "#bbb" });
    if (wt > 0) out += k.text({ x: 40, y: 70, text: wt === 2 ? "🕯️" : "📷", size: 16 });
    out += chip(k, 14, 100, ["keeps going", "changes", "one last time", "never again"][ls], ls >= 2 ? S.purple : "#33323d");
    out += strip(k, [g.num("bond", "Bond"), g.word("kind", "Joke"), g.num("uses", "Uses", "x"), g.word("outsider", "Outsider", S.grey), g.steps("weight", "Weight", S.purple), g.word("last", "Last time")]);
    return out + k.caption(`${v("kind")}, ${v("outsider")}`);
  });

  /* ======================= initiation ======================= */
  /* A gate between the newcomer and the group; the height of the bar is how hard the test is. */
  const TEST = ["🔥", "🎯", "🤐", "🫵", "💢"];
  look("initiation", (v, k, g) => {
    const ts = v.n("test");
    const kd = idx(v, "kind", 5);
    const wa = Math.round(v.n("watched"));
    const gt = idx(v, "gate", 4);
    const rs = idx(v, "result", 4);
    const pr = idx(v, "price", 4);
    let out = stage(k);
    const barH = 10 + ts * 14;
    out += `<rect x="150" y="${FY - barH}" width="10" height="${barH}" fill="${S.wood}"/>`;
    out += k.text({ x: 155, y: FY - barH - 6, text: TEST[kd], size: 14 });
    const nx = [100, 160, 230, 40][rs];
    out += guy(k, nx, { s: 0.9, color: S.blue, mood: [-0.5, 0, 0.6, 0.2][rs], walk: rs === 3 ? 0.8 : 0, look: rs === 3 ? -1 : 1 });
    for (let i = 0; i < 3; i++) out += guy(k, 220 + i * 30, { s: 0.75, color: S.purple, mood: 0, look: -1, alpha: 0.9 });
    if (gt > 0) out += k.text({ x: 250, y: 22, text: ["", "🚪", "🗳️", "👑"][gt], size: 14 });
    for (let i = 0; i < Math.min(20, wa); i++) out += k.dot({ x: 14 + (i % 10) * 7, y: 14 + Math.floor(i / 10) * 7, r: 2.4, color: "#bbb" });
    if (pr > 0) out += chip(k, 306, 40, ["", "costs pride", "costs a friend", "costs beliefs"][pr], S.red, "end");
    out += strip(k, [g.num("test", "Test"), g.word("kind", "Kind"), g.num("watched", "Watched", ""), g.word("gate", "Decides"), g.word("result", "Result"), g.steps("price", "Price", S.red)]);
    return out + k.caption(`${v("kind")} to get in: ${v("result")}`);
  });

  /* ======================= rightHand ======================= */
  /* The leader in the middle with a crown; the right hand stands behind, beside or in front, and a gold tie between
     them thins as loyalty drops. */
  const JOB = ["📢", "🔨", "🗝️", "🎙️"];
  look("rightHand", (v, k, g) => {
    const ly = v.n("loyalty");
    const jb = idx(v, "job", 4);
    const sd = idx(v, "shadow", 3);
    const db = idx(v, "doubts", 4);
    const tn = idx(v, "turn", 5);
    const kn = idx(v, "known", 3);
    let out = stage(k);
    const lx = 150;
    out += guy(k, lx, { s: 1, color: S.red, mood: 0.2, alpha: tn === 4 ? 0.4 : 1, lean: tn === 4 ? 20 : 0 });
    out += k.text({ x: lx, y: 22, text: tn === 3 ? "" : "👑", size: 14 });
    const rx = [lx + 26, lx + 40, lx + 30][sd];
    const rs = [0.8, 0.95, 1.1][sd];
    out += guy(k, rx, { s: rs, color: S.purple, mood: -0.2 * db, look: db >= 2 ? 1 : -1, walk: tn === 2 ? 0.8 : 0, alpha: sd === 0 ? 0.7 : 1 });
    if (tn === 3) out += k.text({ x: rx, y: 22, text: "👑", size: 14 });
    out += `<line x1="${lx + 6}" y1="60" x2="${rx - 6}" y2="60" stroke="${S.gold}" stroke-width="${r1(0.4 + ly * 0.7)}"/>`;
    out += k.text({ x: rx + 20, y: 70, text: JOB[jb], size: 12 });
    if (db > 0) out += chip(k, 306, 40, ["", "hidden", "a look", "says it"][db], db === 3 ? S.red : "#33323d", "end");
    if (tn > 0) out += chip(k, 14, 40, ["", "works against", "walks away", "takes over", "topples leader"][tn], S.red);
    out += guy(k, 40, { s: 0.7, color: kn === 1 ? S.blue : kn === 2 ? S.red : S.grey, look: 1, alpha: kn === 0 ? 0.3 : 0.9 });
    out += strip(k, [g.num("loyalty", "Loyalty"), g.word("job", "Job"), g.steps("shadow", "Stands"), g.steps("doubts", "Doubts", S.red), g.word("turn", "Turn", S.red), g.word("known", "Seen by")]);
    return out + k.caption(`right hand ${v("job")}, ${v("turn")}`);
  });

  /* ======================= bystanders ======================= */
  /* Someone in trouble in the middle and a ring of watchers; a clock counts the seconds; the helper steps in. */
  const WHAT = ["🩹", "😢", "👛", "⚖️", "🤕"];
  look("bystanders", (v, k, g) => {
    const fr = v.n("frozen");
    const wt = Math.round(v.n("watchers"));
    const wh = idx(v, "what", 5);
    const lk = idx(v, "looks", 4);
    const hp = idx(v, "helper", 4);
    const tm = v.n("time");
    let out = stage(k);
    out += k.text({ x: 160, y: FY - 6, text: WHAT[wh], size: 22 });
    const n = Math.min(10, Math.max(2, Math.round(wt / 3)));
    for (let i = 0; i < n; i++) {
      const x = i < n / 2 ? 20 + i * 22 : 200 + (i - n / 2) * 22;
      out += guy(k, x, { s: 0.7, color: S.grey, alpha: 1 - fr * 0.1, look: lk === 0 ? (x < 160 ? 1 : -1) : lk === 3 ? (x < 160 ? -1 : 1) : 0, arms: lk === 2 ? 0.3 : 0 });
      if (lk === 2) out += `<rect x="${r1(x + 2)}" y="${FY - 52}" width="4" height="6" fill="#9fd3ff"/>`;
    }
    if (lk === 1) out += `<path d="M30 30 Q160 10 290 30" stroke="#aaa" fill="none" stroke-dasharray="3 3"/>`;
    if (hp > 0) out += guy(k, 140, { s: [0, 0.6, 0.75, 1][hp], color: S.green, arms: 0.8, walk: 0.5 });
    out += k.clock({ x: 300, y: 18, r: 11, p: 0.05 + (tm / 30) * 0.85 });
    out += strip(k, [g.num("frozen", "Frozen", "", S.grey), g.num("watchers", "Watchers", ""), g.word("what", "What"), g.word("looks", "Looks"), g.word("helper", "Helper", S.green), g.num("time", "Wait", "s")]);
    return out + k.caption(`${wt} watch, helped by ${v("helper")}`);
  });

  /* ======================= scapegoat ======================= */
  /* Arrows of blame from the group to one person pushed to the edge. */
  const WHO_S = ["🆕", "🥺", "🦓", "🗣️"];
  look("scapegoat", (v, k, g) => {
    const bl = v.n("blame");
    const wh = idx(v, "who", 4);
    const ft = idx(v, "fault", 3);
    const hf = idx(v, "howFast", 3);
    const fa = idx(v, "fate", 4);
    const gr = idx(v, "group", 3);
    let out = stage(k);
    const gx = [250, 290, 300, 230][fa];
    out += guy(k, gx, { s: 0.9, color: fa === 3 ? S.green : S.grey, mood: fa === 3 ? 0.6 : -0.5, walk: fa === 2 ? 0.8 : 0, look: -1, alpha: fa === 2 ? 0.5 : 1 });
    out += k.text({ x: gx, y: 22, text: WHO_S[wh], size: 12 });
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 30;
      out += guy(k, x, { s: 0.8, color: S.purple, look: 1, mood: [0, 0.4, -0.5][gr], arms: 0.5 });
      if (i < Math.ceil(bl * 0.8)) out += k.arrow({ x1: x + 10, y1: 50, x2: gx - 18, y2: 55, color: S.red, w: 1 + hf });
    }
    out += chip(k, 160, 18, ["their fault", "partly theirs", "not their fault"][ft], [S.red, S.orange, S.green][ft], "middle");
    if (gr === 2) out += k.text({ x: 80, y: 30, text: "😔", size: 12 });
    out += marks(k, 14, 10, 60, 3, hf + 1, S.red);
    out += strip(k, [g.num("blame", "Blame", "", S.red), g.word("who", "Who"), g.steps("fault", "Fault", S.green), g.steps("howFast", "Speed", S.red), g.word("fate", "Fate"), g.steps("group", "Group after", S.purple)]);
    return out + k.caption(`${v("who")} blamed, ${v("fault")}`);
  });

  /* ======================= the change ======================= */

  /* ======================= firstStep ======================= */
  /* A long path of steps; the first one is lit, the step size is how much courage it took. */
  const ACT = ["👋", "🙋", "✋", "🗝️", "🔁"];
  look("firstStep", (v, k, g) => {
    const cg = v.n("courage");
    const ac = idx(v, "act", 5);
    const wn = idx(v, "when", 4);
    const sn = idx(v, "seen", 3);
    const af = idx(v, "after", 3);
    const sh = idx(v, "shown", 4);
    let out = stage(k);
    for (let i = 0; i < 6; i++) out += `<rect x="${60 + i * 40}" y="${FY - 6 - i * 8}" width="38" height="${6 + i * 8}" fill="${i === 0 ? S.gold : i === 1 && af === 2 ? S.gold : "#33323d"}" opacity="${i === 0 ? r1((0.4 + cg * 0.12) * 100) / 100 : 0.8}"/>`;
    const px = af === 0 ? 40 : af === 1 ? 78 : 118;
    out += guy(k, px, { s: 0.9, color: S.blue, walk: 0.5, mood: cg * 0.1, lean: af === 0 ? -10 : 5, y: af === 2 ? FY - 14 : af === 1 ? FY - 6 : FY });
    out += k.text({ x: px + 18, y: 30, text: ACT[ac], size: 16 });
    out += marks(k, 14, 10, 120, 4, wn + 1, S.gold);
    for (let i = 0; i < [0, 1, 5][sn]; i++) out += k.face({ x: 200 + i * 20, y: 24, r: 6, mood: 0.4, color: S.purple });
    if (sh > 0) out += chip(k, 306, 100, ["", "a breath", "a door", "unmarked"][sh], "#33323d", "end");
    out += strip(k, [g.num("courage", "Courage"), g.word("act", "Step"), g.steps("when", "When"), g.steps("seen", "Seen", S.purple), g.steps("after", "After", S.green), g.word("shown", "Marked by")]);
    return out + k.caption(`${v("act")}, then ${v("after")}`);
  });

  /* ======================= falseChange ======================= */
  /* A mask held in front of the face; cracks are the slips; the mask fades as the act becomes real. */
  const WHY_F = ["💔", "🚔", "👥", "🪞"];
  look("falseChange", (v, k, g) => {
    const fk = v.n("fake");
    const wy = idx(v, "why", 4);
    const sg = Math.round(v.n("signs"));
    const fo = idx(v, "fooled", 4);
    const cg = idx(v, "caught", 4);
    const br = idx(v, "becomesReal", 3);
    let out = stage(k);
    out += guy(k, 140, { s: 1.05, color: S.blue, mood: -0.3 + br * 0.4 });
    const mA = (0.2 + fk * 0.16) * (1 - br * 0.3);
    out += `<ellipse cx="148" cy="${FY - 74}" rx="14" ry="16" fill="${S.paper}" opacity="${r1(mA * 100) / 100}" stroke="#888"/>`;
    for (let i = 0; i < sg; i++) out += `<line x1="${140 + i * 3}" y1="${FY - 86}" x2="${144 + i * 3}" y2="${FY - 66}" stroke="${S.red}" stroke-width="1.2"/>`;
    out += k.text({ x: 60, y: 40, text: WHY_F[wy], size: 18 });
    out += guy(k, 250, { s: 0.75, color: S.purple, mood: fo === 2 ? 0.6 : -0.3, look: -1, alpha: fo === 2 ? 1 : 0.4 });
    out += k.label({ x: 250, y: 24, text: ["no one fooled", "we are fooled", "they are fooled", "they fool themselves"][fo], size: 8, color: "#bbb" });
    if (cg > 0) out += chip(k, 14, 100, ["", "a slip", "a test", "confesses"][cg], S.red);
    out += marks(k, 200, 100, 100, 3, br + 1, S.green);
    out += strip(k, [g.num("fake", "An act"), g.word("why", "Why"), g.num("signs", "Slips", "", S.red), g.word("fooled", "Fooled"), g.word("caught", "Caught by", S.red), g.steps("becomesReal", "Real", S.green)]);
    return out + k.caption(`an act ${v("why")}, real: ${v("becomesReal")}`);
  });

  /* ======================= othersNotice ======================= */
  /* The changed person glowing in the middle; the watcher turns to look, with a speech bubble when they say it. */
  const REACT = ["🤨", "😮", "🥲", "😠"];
  const FIRST = ["stranger", "friend", "rival", "family", "child"];
  look("othersNotice", (v, k, g) => {
    const nt = v.n("noticed");
    const fi = idx(v, "first", 5);
    const rc = idx(v, "reaction", 4);
    const sd = idx(v, "said", 4);
    const tm = idx(v, "timing", 3);
    const pb = idx(v, "pushback", 4);
    let out = stage(k);
    out += glow(120, 70, 26, S.gold, 0.25);
    out += guy(k, 120, { s: 1, color: S.gold, mood: 0.4, lean: pb === 2 ? 12 : 0 });
    out += guy(k, 220, { s: fi === 4 ? 0.65 : 0.9, color: [S.grey, S.green, S.red, S.blue, S.pink][fi], look: -1, mood: [-0.2, 0.3, -0.5, 0.6][rc], arms: pb === 3 ? 0.9 : 0 });
    out += k.text({ x: 220, y: 30, text: REACT[rc], size: 14 });
    for (let i = 0; i < Math.round(nt); i++) out += k.face({ x: 260 + (i % 3) * 16, y: 60 + Math.floor(i / 3) * 16, r: 5, mood: 0, look: -1, color: S.grey });
    if (sd === 3) out += k.bubble({ x: 230, y: 14, text: "You've changed.", w: 96, h: 18, tail: -8, size: 8 });
    if (sd === 2) out += k.label({ x: 220, y: 18, text: "hm.", size: 9, color: "#fff" });
    if (sd === 1) out += k.arrow({ x1: 205, y1: 52, x2: 140, y2: 52, color: "#aaa", w: 1 });
    if (pb === 2) out += k.arrow({ x1: 140, y1: 80, x2: 200, y2: 80, color: S.red, w: 2 });
    out += marks(k, 14, 10, 90, 3, tm + 1, S.purple);
    out += strip(k, [g.num("noticed", "Noticed"), g.word("first", "First"), g.word("reaction", "Reaction"), g.steps("said", "Said"), g.steps("timing", "When", S.purple), g.steps("pushback", "Pushback", S.red)]);
    return out + k.caption(`a ${FIRST[fi]} notices, ${v("reaction")}`);
  });

  /* ======================= goalSwap ======================= */
  /* Two goals on a road: the old prize on the left fades as the new one on the right lights up. */
  const OLD = ["💰", "🏆", "🗡️", "💘", "🚪"];
  const NEW = ["🛡️", "🔎", "🤝", "🕊️", "🏠"];
  look("goalSwap", (v, k, g) => {
    const sw = v.n("swap");
    const od = idx(v, "old", 5);
    const nw = idx(v, "newGoal", 5);
    const wn = idx(v, "when", 4);
    const tr = idx(v, "trigger", 4);
    const sh = idx(v, "shown", 3);
    let out = stage(k);
    out += `<line x1="20" y1="${FY - 2}" x2="300" y2="${FY - 2}" stroke="#555" stroke-width="2"/>`;
    out += k.text({ x: 50, y: 60, text: OLD[od], size: 26, alpha: 1 - sw * 0.16 });
    out += k.text({ x: 270, y: 60, text: NEW[nw], size: 26, alpha: 0.2 + sw * 0.16 });
    const px = 80 + wn * 50;
    out += guy(k, px, { s: 0.9, color: S.blue, look: sw > 2 ? 1 : -1, mood: 0.1 * sw });
    if (sh === 2) out += k.text({ x: px - 30, y: FY - 4, text: OLD[od], size: 12 }) + k.arrow({ x1: px - 6, y1: 70, x2: px - 26, y2: FY - 14, color: S.red, w: 1.5 });
    if (sh === 1) out += k.arrow({ x1: px, y1: 30, x2: px + 40, y2: 30, color: S.green, w: 2 });
    if (sh === 0) out += k.text({ x: px + 16, y: 30, text: "💭", size: 12 });
    out += chip(k, 160, 18, ["a loss", "a lesson", "a person", "empty win"][tr], S.purple, "middle");
    out += strip(k, [g.num("swap", "Swap", "", S.green), g.word("old", "Old goal"), g.word("newGoal", "New goal", S.green), g.steps("when", "When"), g.word("trigger", "Because", S.purple), g.steps("shown", "Shown")]);
    return out + k.caption(`from ${v("old")} to ${v("newGoal")}`);
  });

  /* ======================= selfVow ======================= */
  /* The promise as a chain across the path; each test is a tug; the end shows it kept, bent or broken. */
  const VOW = ["🚫", "🛡️", "🔒", "🛣️", "😶"];
  look("selfVow", (v, k, g) => {
    const st = v.n("strength");
    const vw = idx(v, "vow", 5);
    const md = idx(v, "made", 3);
    const sd = idx(v, "said", 4);
    const ts = Math.round(v.n("tested"));
    const en = idx(v, "ends", 4);
    let out = stage(k);
    const y = 60;
    const broken = en >= 2;
    for (let i = 0; i < 10; i++) {
      if (broken && (i === 5 || i === 4)) continue;
      const yy = y + (en === 1 ? Math.sin(i / 3) * 8 : 0);
      out += `<ellipse cx="${60 + i * 22}" cy="${r1(yy)}" rx="10" ry="5" fill="none" stroke="${S.gold}" stroke-width="${r1(0.6 + st * 0.6)}"/>`;
    }
    out += k.text({ x: 30, y: y + 6, text: VOW[vw], size: 16 });
    for (let i = 0; i < ts; i++) out += k.arrow({ x1: 80 + i * 36, y1: 92, x2: 80 + i * 36, y2: 70, color: S.red, w: 1.5 });
    out += k.label({ x: 14, y: 20, text: ["before the film", "first scene", "midway"][md], size: 9, color: "#bbb", anchor: "start" });
    if (sd > 0) out += k.text({ x: 290, y: 24, text: ["", "💬", "👥", "📝"][sd], size: 14 });
    if (en === 3) out += k.text({ x: 170, y: 40, text: "😣", size: 14 });
    if (en === 2) out += k.text({ x: 170, y: 40, text: "💪", size: 14 });
    out += strip(k, [g.num("strength", "Strength"), g.word("vow", "Promise"), g.steps("made", "Made"), g.steps("said", "Said"), g.num("tested", "Tested", "x", S.red), g.word("ends", "Ends")]);
    return out + k.caption(`"${v("vow")}", ${v("ends")}`);
  });

  /* ======================= tooLateChange ======================= */
  /* A clock past midnight; the changed person arrives at an empty place; what is left glows small. */
  const LOST = ["🕯️", "💔", "💼", "⌛", "🥀"];
  look("tooLateChange", (v, k, g) => {
    const lt = v.n("lateness");
    const ls = idx(v, "lost", 5);
    const kn = idx(v, "knows", 4);
    const sh = idx(v, "shown", 4);
    const lf = idx(v, "left", 3);
    const md = idx(v, "mood", 3);
    let out = stage(k);
    out += k.tint({ color: ["#3a1a1a", "#1a2233", "#2a3320"][md], alpha: 0.5 });
    out += k.clock({ x: 40, y: 34, r: 16, p: 0.6 + lt * 0.08 });
    out += guy(k, 140, { s: 1, color: S.gold, mood: [-0.6, -0.2, 0.3][md], look: 1 });
    out += k.text({ x: 230, y: 70, text: LOST[ls], size: 24, alpha: 0.5 });
    out += k.text({ x: 190, y: 30, text: ["👁️", "✋", "🚪", "✉️"][sh], size: 14 });
    for (let i = 0; i < [0, 1, 2, 5][kn]; i++) out += k.face({ x: 260 + (i % 3) * 14, y: 20 + Math.floor(i / 3) * 14, r: 5, color: S.grey, mood: 0 });
    if (lf > 0) out += guy(k, 190, { s: 0.55, color: S.green, mood: 0.6, alpha: lf === 2 ? 1 : 0.5 }) + glow(190, 90, 10 + lf * 6, S.green, 0.25);
    out += strip(k, [g.num("lateness", "Too late by"), g.word("lost", "Lost"), g.steps("knows", "Known"), g.word("shown", "Shown"), g.steps("left", "Good left", S.green), g.steps("mood", "Mood")]);
    return out + k.caption(`changed too late for ${v("lost")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
