/* look for the lines-and-delivery curiosities in data/db-depth-lines.js (depth thread, lines): the live picture at
   the top of each window. Same house style as look-heart-comedy.js: a stage on top (y 0 to 120) that acts out the
   line, a strip of small labelled gauges below it, and a caption. Colors: gold = the line itself, blue = the
   speaker, pink = the listener or warmth, red = a sting or a fight, grey = held back or left out, green = an
   answer or an opening, purple = what is meant under the words. Every own setting moves something of its own. */
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
  /* A small rounded speech box with text, drawn without a tail. */
  const say = (k, x, y, text, o) => {
    o = o || {};
    const size = o.size || 9;
    const w = o.w || String(text).length * size * 0.55 + 12;
    return `<rect x="${r1(x - w / 2)}" y="${r1(y - size - 2)}" width="${r1(w)}" height="${r1(size + 8)}" rx="6" fill="${o.fill || S.paper}" stroke="${o.stroke || S.ink}" stroke-width="1.2"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.alpha != null ? ` opacity="${o.alpha}"` : ""}/>` + k.label({ x, y: y + 1, text, size, color: o.color || S.ink, weight: o.weight });
  };
  /* A dashed curve from one point to another, bowed up by `bow`. */
  const arc = (x1, y1, x2, y2, bow, color, w, dash) => `<path d="M${r1(x1)} ${r1(y1)} Q${r1((x1 + x2) / 2)} ${r1(Math.min(y1, y2) - bow)} ${r1(x2)} ${r1(y2)}" fill="none" stroke="${color}" stroke-width="${r1(w || 2)}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

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

  /* ======================= meantForAnother ======================= */
  /* The speaker talks to the one in the middle; a dashed arc of meaning flies over to the real target. */
  const THROUGH = ["🧒", "🧑", "🕴️", "🐕", "🍽️", "💬"];
  const TARGET = ["partner", "parent", "boss", "rival", "ex", "whole room"];
  look("meantForAnother", (v, k, g) => {
    const am = v.n("aim");
    const rt = idx(v, "realTarget", 6);
    const th = idx(v, "through", 6);
    const rc = idx(v, "reacts", 4);
    const gl = v.n("glances");
    const md = idx(v, "middle", 4);
    let out = stage(k);
    out += guy(k, 50, { s: 1, color: S.blue, look: 1, mood: 0.2 });
    const small = th === 0 || th === 3;
    if (th !== 5) out += guy(k, 145, { s: small ? 0.65 : 0.9, color: S.grey, look: md === 0 ? -1 : 1, mood: [0.3, 0, -0.6, -0.3][md], arms: md === 3 ? 0.8 : -0.2 });
    out += k.text({ x: 145, y: 30, text: THROUGH[th], size: 16 });
    out += say(k, 95, 46, "said to them", { size: 8 });
    out += guy(k, 255, { s: rt === 5 ? 0.8 : 1, color: S.pink, look: rc === 0 ? 1 : -1, arms: rc === 1 ? -0.8 : rc === 3 ? 0.6 : 0, lean: rc === 1 ? 0 : rc === 3 ? -8 : 3 });
    if (rt === 5) out += guy(k, 285, { s: 0.7, color: S.pink, alpha: 0.6 }) + guy(k, 228, { s: 0.7, color: S.pink, alpha: 0.6 });
    out += arc(64, 50, 250, 52, 20 + am * 8, S.purple, 1 + am * 0.8, "5 4");
    out += chip(k, 255, 16, "really for: " + TARGET[rt], S.purple, "middle");
    for (let i = 0; i < gl; i++) out += k.text({ x: 70 + i * 12, y: 102, text: "👀", size: 9 });
    if (rc === 2) out += arc(240, 70, 160, 68, 10, S.pink, 2, "3 3");
    if (rc === 3) out += say(k, 255, 104, "Say it to me!", { size: 8, fill: S.pink });
    if (md === 3) out += chip(k, 145, 104, "not my fight", S.grey, "middle");
    out += strip(k, [g.num("aim", "Aimed", "", S.purple), g.word("realTarget", "Really for"), g.num("glances", "Glances", ""), g.word("through", "Said to"), g.steps("middle", "Middle"), g.steps("reacts", "Target", S.pink)]);
    return out + k.caption(`said to ${v("through")}, meant for ${v("realTarget")}`);
  });

  /* ======================= questionBack ======================= */
  /* Question marks bounce between the two; the more it dodges, the higher they fly away from an answer. */
  const TONE = [S.green, S.gold, S.orange, S.red];
  const WHY = ["⏳", "🙈", "🔄", "😏", "🙄"];
  look("questionBack", (v, k, g) => {
    const dg = v.n("dodge");
    const wy = idx(v, "why", 5);
    const rd = v.n("rounds");
    const tn = idx(v, "tone", 4);
    const ak = idx(v, "asker", 4);
    const fn = idx(v, "finally", 4);
    let out = stage(k);
    out += guy(k, 60, { s: 1, color: S.pink, look: 1, mood: [-0.2, 0, 0.3, -0.7][ak], arms: ak === 3 ? 0.9 : ak === 0 ? -0.8 : 0 });
    out += guy(k, 260, { s: 1, color: S.blue, look: -1, mood: tn === 1 ? 0.5 : tn === 3 ? -0.5 : 0 });
    const n = Math.round(rd);
    for (let i = 0; i < n; i++) {
      const x = 85 + (i * 150) / Math.max(1, n - 1 || 1);
      const y = 70 - (i % 2 ? dg * 6 : dg * 2);
      out += k.text({ x, y, text: "?", size: 16 + tn * 2, color: TONE[tn], weight: 700 });
    }
    out += arc(80, 60, 240, 60, 10 + dg * 8, TONE[tn], 1.5, "4 3");
    out += k.text({ x: 290, y: 30, text: WHY[wy], size: 16 });
    out += chip(k, 14, 20, v("why"), "#33323d");
    if (fn === 1) out += k.text({ x: 230, y: 50, text: "👀", size: 14 });
    if (fn >= 2) out += say(k, 200, 100, fn === 3 ? "Yes." : "...later", { size: 9, fill: S.green, color: "#fff" });
    if (ak === 3) out += k.text({ x: 40, y: 30, text: "💢", size: 14 });
    out += strip(k, [g.num("dodge", "Dodges"), g.word("why", "Why"), g.num("rounds", "Rounds", "x"), g.steps("tone", "Tone", TONE[tn]), g.word("asker", "Asker"), g.steps("finally", "Answer", S.green)]);
    return out + k.caption(`${n} question${n === 1 ? "" : "s"} back, ${v("tone")}, ${v("why")}`);
  });

  /* ======================= wordCountClash ======================= */
  /* Each person's words as a bar: the talker's long, the quiet one's short. A crown sits on whoever holds power. */
  look("wordCountClash", (v, k, g) => {
    const gp = v.n("gap");
    const tk = idx(v, "talker", 4);
    const qt = idx(v, "quiet", 4);
    const lg = v.n("longest");
    const fl = idx(v, "flips", 3);
    const pw = idx(v, "power", 3);
    let out = stage(k);
    out += guy(k, 60, { s: 1, color: S.blue, look: 1, mood: tk === 1 ? -0.3 : 0.3, arms: 0.3 + gp * 0.1, lean: tk === 2 ? -4 : 6 });
    out += guy(k, 260, { s: 1, color: S.pink, look: -1, mood: 0, arms: qt === 3 ? -0.9 : -0.3 });
    const bw = 40 + gp * 30;
    out += `<rect x="20" y="16" width="${r1(bw)}" height="10" rx="5" fill="${S.blue}"/>`;
    out += `<rect x="20" y="30" width="${r1(lg * 1.8)}" height="4" rx="2" fill="${S.gold}"/>` + k.label({ x: 24 + lg * 1.8, y: 34, text: fmt(lg) + " s", size: 7, color: S.gold, anchor: "start" });
    const qw = [30, 16, 8, 0][qt];
    out += `<rect x="${r1(300 - qw)}" y="16" width="${qw}" height="10" rx="5" fill="${S.pink}"/>`;
    out += k.label({ x: 244, y: 44, anchor: "end", text: ["\"I don't know.\"", "\"No.\"", "\"Mm.\"", "..."][qt], size: 10, color: "#fff" });
    out += chip(k, 60, 104, ["wants something", "nervous", "in charge", "lying"][tk], "#33323d", "middle");
    out += k.text({ x: pw === 0 ? 60 : pw === 1 ? 260 : 160, y: 58, text: pw === 2 ? "👑↔" : "👑", size: 14 });
    if (fl > 0) out += k.arrow({ x1: 120, y1: 90, x2: 200, y2: 90, color: S.green, w: 2 }) + (fl === 2 ? k.arrow({ x1: 200, y1: 98, x2: 120, y2: 98, color: S.green, w: 2 }) : "");
    out += strip(k, [g.num("gap", "Gap"), g.word("talker", "Talker"), g.num("longest", "Longest", " s"), g.steps("quiet", "Quiet one", S.pink), g.steps("flips", "Swap", S.green), g.word("power", "Power")]);
    return out + k.caption(`a long talker against ${v("quiet")}`);
  });

  /* ======================= takenBackWord ======================= */
  /* The word starts to come out in the bubble, gets struck through, and the swap follows. */
  const WORD = ["love", "Anna", "the money", "idiot", "I promise"];
  const SWAP = ["", "like", "*cough*", "anyway, the weather"];
  look("takenBackWord", (v, k, g) => {
    const ca = idx(v, "caught", 4);
    const wd = idx(v, "word", 5);
    const sw = idx(v, "swap", 4);
    const hd = idx(v, "heard", 4);
    const st = v.n("stall");
    const tm = v.n("times");
    let out = stage(k);
    out += guy(k, 80, { s: 1, color: S.blue, look: 1, mood: -0.2 - st * 0.1, arms: sw === 2 ? 0.6 : -0.2 });
    out += guy(k, 240, { s: 1, color: S.pink, look: -1, mood: [0, 0, 0.4, -0.3][hd], lean: hd === 3 ? -8 : 0 });
    const full = WORD[wd];
    const shown = ca === 0 ? "h-" : full.slice(0, Math.max(1, Math.ceil((full.length * [0, 0.2, 0.5, 1][ca]) || 1))) + (ca < 3 ? "-" : "");
    out += say(k, 120, 30, shown, { size: 12, w: 80 });
    out += `<line x1="${r1(120 - 30)}" y1="26" x2="${r1(120 + 30)}" y2="26" stroke="${S.red}" stroke-width="2.5"/>`;
    if (sw > 0) out += say(k, 150, 56, SWAP[sw], { size: 10, fill: S.green, color: "#fff" });
    out += `<rect x="20" y="96" width="${r1(st * 30)}" height="6" fill="${S.grey}"/>` + k.label({ x: 20, y: 92, text: "awkward pause", size: 7, color: "#888", anchor: "start" });
    if (hd >= 2) out += k.text({ x: 262, y: 52, text: hd === 3 ? "\"What were you going to say?\"" : "🤨", size: hd === 3 ? 8 : 14, color: "#fff", anchor: hd === 3 ? "end" : "middle" });
    if (hd === 1) out += k.text({ x: 240, y: 52, text: "?", size: 12, color: S.grey });
    out += marks(k, 200, 100, 100, 5, tm, S.gold);
    out += strip(k, [g.steps("caught", "Got out", S.red), g.word("word", "The word"), g.word("swap", "Swapped for"), g.steps("heard", "Caught", S.pink), g.num("stall", "Stall", " s", S.grey), g.num("times", "Times", "x")]);
    return out + k.caption(`almost said ${v("word")}, then ${v("swap")}`);
  });

  /* ======================= wayOfTalking ======================= */
  /* A row of people with the same grey sound line; one stands out with their own wave. */
  const MARK = ["🗺️", "🔁", "🎩", "🧢", "📚", "🔨"];
  look("wayOfTalking", (v, k, g) => {
    const sg = v.n("strength");
    const mk = idx(v, "marker", 6);
    const ag = idx(v, "against", 4);
    const sh = idx(v, "shifts", 4);
    const sl = idx(v, "slips", 4);
    const ot = idx(v, "others", 4);
    let out = stage(k);
    [40, 90, 230, 280].forEach((x, i) => {
      out += guy(k, x, { s: 0.8, color: S.grey, look: x < 160 ? 1 : -1, mood: [0, 0.5, 0.3, -0.4][ot], arms: ot === 2 && i % 2 ? 0.6 : -0.2 });
      out += k.wave({ x: x - 16, y: 30, w: 32, h: 8, amp: 0.3 + ag * 0.05 * (i % 2), cycles: 2, color: S.grey });
    });
    out += guy(k, 160, { s: 1, color: S.blue, mood: 0.2 });
    out += k.wave({ x: 130, y: 24, w: 60, h: 14 + sg * 2, amp: 0.2 + sg * 0.16, cycles: 3 + ag * 1.5, color: S.gold });
    out += k.text({ x: 160, y: 16, text: MARK[mk], size: 12 });
    if (sh > 0) out += k.wave({ x: 130, y: 46, w: 60, h: 8, amp: 0.2 + sh * 0.2, cycles: 8 - sh, color: S.orange }) + k.label({ x: 196, y: 52, text: "to the boss", size: 7, color: S.orange, anchor: "start" });
    if (sl > 0) out += chip(k, 160, 100, "slips out " + ["", "when angry", "when tired", "at home"][sl], S.red, "middle");
    if (ot === 1) out += k.text({ x: 65, y: 60, text: "😂", size: 12 });
    if (ot === 3) out += k.text({ x: 255, y: 60, text: "😒", size: 12 });
    out += strip(k, [g.num("strength", "Marks them"), g.word("marker", "What marks it"), g.steps("against", "Stands out"), g.steps("shifts", "Shifts", S.orange), g.word("slips", "Slips", S.red), g.word("others", "Others")]);
    return out + k.caption(`${v("marker")}, ${v("against")}`);
  });

  /* ======================= lastWordFight ======================= */
  /* Bubbles bounce left and right, shrinking or growing; the last one is gold. */
  const FORM = ["\"Fine.\"", "\"And another thing!\"", "\"Hmph.\"", "👀", "🚪💥"];
  look("lastWordFight", (v, k, g) => {
    const fg = v.n("fight");
    const rd = Math.round(v.n("rounds"));
    const wh = idx(v, "who", 4);
    const fm = idx(v, "form", 5);
    const sz = idx(v, "sizes", 3);
    const af = v.n("after");
    let out = stage(k);
    out += guy(k, 50, { s: 1, color: S.blue, look: 1, mood: -0.6, lean: fg * 2, walk: wh === 0 ? 0.6 : 0 });
    out += guy(k, 270, { s: 1, color: S.pink, look: -1, mood: -0.6, lean: -fg * 2 });
    if (wh === 2) out += guy(k, 160, { s: 0.6, color: S.green, mood: 0.2 });
    for (let i = 0; i < rd; i++) {
      const p = rd > 1 ? i / (rd - 1) : 0;
      const r = [8 - p * 5, 6, 3 + p * 6][sz];
      const x = i % 2 ? 230 - i * 4 : 90 + i * 4;
      out += `<circle cx="${r1(x)}" cy="${r1(20 + i * 6)}" r="${r1(r)}" fill="${i % 2 ? S.pink : S.blue}" opacity="0.8"/>`;
    }
    const lx = [50, 270, 160, 160][wh];
    out += say(k, lx, 96, FORM[fm], { size: 9, fill: S.gold });
    out += `<rect x="110" y="104" width="${r1(af * 10)}" height="5" fill="${S.grey}"/>`;
    out += strip(k, [g.num("fight", "Fight", "", S.red), g.num("rounds", "Rounds", "x"), g.word("who", "Last word"), g.word("form", "As"), g.steps("sizes", "Lines"), g.num("after", "Silence", " s", S.grey)]);
    return out + k.caption(`${rd} extra lines, last word: ${v("form")}`);
  });

  /* ======================= whisperInNoise ======================= */
  /* A loud crowd of noise lines; in the middle two heads lean together inside a small quiet circle. */
  const ROOM = ["🎉", "🪩", "🚆", "🏟️", "🍳"];
  const WHAT = ["\"ha!\"", "\"I know.\"", "\"Run.\"", "\"I love you.\""];
  look("whisperInNoise", (v, k, g) => {
    const ld = v.n("loud");
    const cl = idx(v, "closeness", 3);
    const rm = idx(v, "room", 5);
    const hr = idx(v, "heard", 3);
    const dr = idx(v, "drop", 3);
    const wt = idx(v, "what", 4);
    let out = stage(k);
    const crowdA = [1, 0.55, 0.15][dr];
    for (let i = 0; i < 8; i++) {
      const x = 16 + i * 40;
      if (x > 120 && x < 200) continue;
      out += guy(k, x, { s: 0.6, color: S.grey, alpha: crowdA, arms: 0.4 });
      out += k.wave({ x: x - 14, y: 22 + (i % 3) * 8, w: 28, h: 10, amp: ld * 0.2 * crowdA, cycles: 4, noise: 0.6, color: S.red });
    }
    const gap = [34, 20, 10][cl];
    out += glow(160, 62, 34, "#2b2b44", 0.9);
    out += guy(k, 160 - gap, { s: 0.9, color: S.blue, look: 1, lean: cl * 6 });
    out += guy(k, 160 + gap, { s: 0.9, color: S.pink, look: -1, lean: -cl * 2 });
    out += k.text({ x: 300, y: 18, text: ROOM[rm], size: 14 });
    const txt = WHAT[wt];
    out += k.label({ x: 160, y: 22, text: hr === 0 ? "· · ·" : hr === 1 ? txt.slice(0, Math.ceil(txt.length / 2)) + "…" : txt, size: 9, color: S.gold, weight: 700 });
    out += strip(k, [g.num("loud", "Room noise", "", S.red), g.steps("closeness", "Lean in", S.pink), g.word("room", "Where"), g.steps("heard", "We hear"), g.steps("drop", "Room drops", S.grey), g.word("what", "What")]);
    return out + k.caption(`${v("what")} whispered, ${v("closeness")}, in ${v("room")}`);
  });

  /* ======================= dodgedQuestion ======================= */
  /* The question flies at them and is bent away toward the dodge; behind them, the thing they hide. */
  const TOOL = ["😄", "🌹", "🔀", "☕", "⚔️"];
  look("dodgedQuestion", (v, k, g) => {
    const sm = idx(v, "smooth", 4);
    const tl = idx(v, "tool", 5);
    const tr = Math.round(v.n("tries"));
    const ak = idx(v, "asker", 4);
    const hd = idx(v, "hiding", 4);
    const kn = idx(v, "knows", 3);
    let out = stage(k);
    out += guy(k, 60, { s: 1, color: S.pink, look: 1, lean: ak * 3, arms: ak === 3 ? 0.8 : 0, mood: ak >= 2 ? -0.4 : 0 });
    out += guy(k, 220, { s: 1, color: S.blue, look: -1, mood: 0.4 });
    for (let i = 0; i < tr; i++) out += k.text({ x: 80 + i * 10, y: 34, text: "?", size: 12, color: S.pink, weight: 700 });
    /* the bend: clumsy is a sharp kink, smooth is a gentle curve */
    const by = 60 - (3 - sm) * 12;
    out += `<path d="M90 60 Q${r1(180 + sm * 10)} ${r1(by)} 250 ${r1(20 + sm * 4)}" fill="none" stroke="${S.gold}" stroke-width="2" stroke-dasharray="${sm === 3 ? "2 6" : "0"}"/>`;
    out += k.text({ x: 262, y: r1(24 + sm * 4), text: TOOL[tl], size: 16 });
    const bs = 8 + hd * 6;
    out += `<rect x="${r1(270 - bs / 2)}" y="${r1(FY - bs)}" width="${bs}" height="${bs}" fill="${S.wood}" stroke="${S.ink}"/>`;
    if (kn > 0) out += k.text({ x: 300, y: FY - bs - 4, text: kn === 2 ? "👁️" : "❔", size: 10 });
    out += strip(k, [g.steps("smooth", "Smooth"), g.word("tool", "Dodge with"), g.num("tries", "Asked", "x", S.pink), g.steps("asker", "Asker", S.pink), g.steps("hiding", "Hiding", S.wood), g.steps("knows", "We know", S.purple)]);
    return out + k.caption(`asked ${tr}x, dodged with ${v("tool")}`);
  });

  /* ======================= sayingTheName ======================= */
  /* The line as a row of grey blocks; the name is the gold block, as big as its weight. */
  const NAME = ["Bean", "Sam", "Samuel J. Miller", "Sir", "Miller"];
  const VOICE = [S.pink, "#ddd", S.orange, S.red];
  look("sayingTheName", (v, k, g) => {
    const wt = v.n("weight");
    const fm = idx(v, "form", 5);
    const wh = idx(v, "where", 4);
    const fs = idx(v, "first", 3);
    const vo = idx(v, "voice", 4);
    const an = idx(v, "answer", 4);
    let out = stage(k);
    out += guy(k, 50, { s: 1, color: S.blue, look: 1, mood: vo === 0 ? 0.5 : vo === 3 ? -0.7 : 0, arms: vo === 3 ? 0.7 : 0 });
    out += guy(k, 270, { s: 1, color: S.pink, look: an === 2 || an === 3 ? -1 : 1, lean: an === 1 ? -6 : 0, mood: an === 3 ? 0.5 : 0 });
    const slots = wh === 3 ? [1] : [0, 1, 2, 3];
    const at = [0, 1, 3, 0][wh];
    slots.forEach((_, i) => {
      if (wh !== 3 && i === at) return;
      out += `<rect x="${r1(90 + i * 36)}" y="40" width="30" height="8" rx="3" fill="#44434f"/>`;
    });
    const nx = wh === 3 ? 160 : 105 + at * 36;
    out += k.text({ x: nx, y: 48, text: NAME[fm], size: 8 + wt * 1.4 + (vo === 3 ? 3 : 0), color: VOICE[vo], weight: 700, anchor: "middle" });
    if (fs === 2) out += k.text({ x: nx, y: 24, text: "✨ first time", size: 9, color: S.gold });
    out += marks(k, 100, 100, 120, 6, [6, 2, 0][fs], S.grey);
    if (an === 3) out += say(k, 270, 30, "...Jo.", { size: 9, fill: S.pink });
    out += strip(k, [g.num("weight", "Weight"), g.word("form", "Name"), g.word("where", "Where"), g.steps("first", "Rare", S.gold), g.steps("voice", "Voice", VOICE[vo]), g.word("answer", "They")]);
    return out + k.caption(`${v("form")} said ${v("voice")}, ${v("where")}`);
  });

  /* ======================= languageSwitch ======================= */
  /* The bubble is two colors: the first language and the switched part. Listeners who can't follow go grey. */
  const WHYL = ["🤫", "🤬", "💗", "🏠", "😣"];
  look("languageSwitch", (v, k, g) => {
    const sw = v.n("switch");
    const wy = idx(v, "why", 5);
    const lo = idx(v, "leftOut", 3);
    const sb = idx(v, "subtitles", 3);
    const bk = idx(v, "back", 3);
    const un = idx(v, "understood", 3);
    let out = stage(k);
    out += guy(k, 60, { s: 1, color: S.blue, look: 1, mood: wy === 2 ? 0.5 : wy === 4 ? -0.5 : 0 });
    const bw = 200;
    const sx = 30 + bw * (1 - sw / 5) * 0.6;
    out += `<rect x="30" y="14" width="${bw}" height="16" rx="8" fill="${S.paper}"/>`;
    out += `<rect x="${r1(sx)}" y="14" width="${r1(bw * (sw / 5) * 0.6 + 2)}" height="16" rx="8" fill="${S.orange}"/>`;
    if (bk < 2) out += `<rect x="${r1(sx + bw * (sw / 5) * 0.6 + (bk === 0 ? 2 : 24))}" y="14" width="${r1(Math.max(4, 230 - (sx + bw * (sw / 5) * 0.6 + (bk === 0 ? 2 : 24))))}" height="16" rx="8" fill="${S.paper}"/>`;
    out += k.text({ x: 250, y: 27, text: WHYL[wy], size: 14 });
    [150, 200, 250, 290].forEach((x, i) => {
      const left = (lo === 1 && i === 0) || (lo === 2 && i < 3);
      const secret = un > 0 && i === 3;
      out += guy(k, x, { s: 0.8, color: left ? S.grey : S.pink, look: -1, alpha: left ? 0.6 : 1, mood: secret && un === 2 ? 0.5 : 0 });
      if (left) out += k.text({ x, y: 50, text: "?", size: 10, color: S.grey });
      if (secret) out += k.text({ x, y: 48, text: un === 2 ? "💡" : "💭", size: 11 });
    });
    out += `<rect x="40" y="96" width="${[0, 50, 100][sb]}" height="8" rx="2" fill="#fff" opacity="0.8"/>`;
    out += strip(k, [g.num("switch", "Switched", "", S.orange), g.word("why", "Why"), g.steps("leftOut", "Left out", S.grey), g.steps("subtitles", "Subtitles"), g.steps("back", "Comes back"), g.steps("understood", "Secretly gets it", S.green)]);
    return out + k.caption(`switches ${v("why")}, ${v("subtitles")} subtitled`);
  });

  /* ======================= finishSentence ======================= */
  /* One line split in two halves, one from each; the gap between the halves is how out of step they are. */
  look("finishSentence", (v, k, g) => {
    const sy = v.n("sync");
    const wh = idx(v, "who", 3);
    const rt = idx(v, "right", 3);
    const tm = v.n("times");
    const st = idx(v, "starter", 4);
    const wa = idx(v, "watchers", 3);
    let out = stage(k);
    out += guy(k, 100, { s: 1, color: S.blue, look: 1, mood: [-0.5, 0, 0.6, 0.3][st] });
    out += guy(k, 200, { s: 1, color: S.pink, look: -1, mood: rt === 0 ? -0.2 : 0.4 });
    const gap = (5 - sy) * 8;
    if (wh === 2) out += say(k, 150, 36, "\"...we'll be late!\"", { size: 10, fill: S.gold });
    else {
      out += say(k, 150 - 40 - gap / 2, 36, "\"We were just...\"", { size: 9, fill: wh === 1 ? S.pink : "#c9d6ea" });
      out += say(k, 150 + 40 + gap / 2, 36, rt === 0 ? "\"...leaving?\"" : rt === 1 ? "\"...going?\"" : "\"...going out.\"", { size: 9, fill: wh === 1 ? "#c9d6ea" : S.pink });
    }
    out += k.text({ x: 150, y: 70, text: ["✗", "≈", "✓"][rt], size: 16, color: [S.red, S.orange, S.green][rt], weight: 700 });
    out += marks(k, 14, 100, 80, 8, tm, S.gold);
    if (wa > 0) out += guy(k, 280, { s: 0.75, color: S.grey, look: -1, mood: wa === 1 ? -0.3 : -0.6, alpha: wa === 2 ? 0.6 : 1 }) + k.text({ x: 280, y: 50, text: wa === 1 ? "🙄" : "😶", size: 11 });
    if (st === 3) out += say(k, 100, 62, "\"...together!\"", { size: 8 });
    out += strip(k, [g.num("sync", "In step"), g.word("who", "Who finishes"), g.num("times", "Times", "x"), g.steps("right", "Right", [S.red, S.orange, S.green][rt]), g.word("starter", "Starter"), g.word("watchers", "Others")]);
    return out + k.caption(`finished ${v("right") === "wrong" ? "wrong" : v("right")}, ${v("who")}`);
  });

  /* ======================= rehearsedLine ======================= */
  /* Left: the neat practice. Right: the real moment, the bubble more scrambled the further it drifts. */
  const WHEREP = ["🪞", "🚗", "🐈", "💭", "🧑"];
  look("rehearsedLine", (v, k, g) => {
    const gp = v.n("gap");
    const wh = idx(v, "where", 5);
    const rn = Math.round(v.n("runs"));
    const rl = idx(v, "real", 4);
    const ot = idx(v, "other", 4);
    const sh = idx(v, "shown", 3);
    let out = stage(k);
    out += `<line x1="160" y1="6" x2="160" y2="${FY}" stroke="#555" stroke-dasharray="${["2 6", "6 3", "1 0"][sh]}" stroke-width="${sh === 2 ? 3 : 1.5}"/>`;
    out += k.label({ x: 80, y: 12, text: "practice", size: 8, color: "#aaa" }) + k.label({ x: 240, y: 12, text: "for real", size: 8, color: "#aaa" });
    out += guy(k, 60, { s: 0.9, color: S.blue, look: 1, mood: 0.3, alpha: sh === 0 ? 0.4 : 1 });
    out += k.text({ x: 110, y: 90, text: WHEREP[wh], size: 18 });
    out += say(k, 80, 32, "\"We need to talk.\"", { size: 8 });
    for (let i = 0; i < rn; i++) out += k.dot({ x: 20 + i * 8, y: 104, r: 2.5, color: S.gold });
    out += guy(k, 210, { s: 0.9, color: S.blue, look: 1, mood: -0.2 - gp * 0.1, lean: gp * 2 });
    out += guy(k, 280, { s: 0.9, color: S.pink, look: -1, arms: ot === 1 ? 0.6 : ot === 3 ? -0.8 : 0, mood: ot === 3 ? 0 : 0.1 });
    const REAL = ["\"We need to talk.\"", "\"We need... um.\"", "\"Nice shoes!\"", "..."];
    out += say(k, 220, 24 + gp * 2, REAL[rl], { size: 8, fill: rl === 0 ? S.paper : rl === 3 ? "#44434f" : "#f2d2b0" });
    if (gp > 0) out += `<path d="M190 ${r1(40 + gp * 2)} l${r1(gp * 3)} -4 l${r1(gp * 3)} 6 l${r1(gp * 3)} -6" fill="none" stroke="${S.red}" stroke-width="1.5"/>`;
    if (ot === 1 || ot === 2) out += say(k, 288, 14, ot === 1 ? "\"Wait...\"" : "\"It's over.\"", { size: 7, fill: S.pink });
    out += strip(k, [g.num("gap", "Drifts"), g.word("where", "Practice in"), g.num("runs", "Runs", "x"), g.steps("real", "Real moment", S.red), g.word("other", "Other"), g.word("shown", "Shown")]);
    return out + k.caption(`practiced ${v("where")}, then ${v("real")}`);
  });

  /* ======================= readAloud ======================= */
  /* The reader holds the page; the writer's ghost fades in as their voice takes over; the voice line breaks. */
  const PAPER = ["✉️", "📔", "📜", "📱", "📄"];
  look("readAloud", (v, k, g) => {
    const hl = v.n("hold");
    const wt = idx(v, "what", 5);
    const vc = idx(v, "voice", 4);
    const rd = idx(v, "reader", 4);
    const bk = idx(v, "breaks", 4);
    const sh = idx(v, "shown", 4);
    let out = stage(k);
    out += glow(90, 70, 14 + hl * 8, S.gold, 0.08 + hl * 0.03);
    out += guy(k, 90, { s: 1, color: [S.pink, S.grey, S.blue, S.orange][rd], arms: 0.4, mood: -bk * 0.25, lean: bk === 3 ? 10 : 0 });
    out += k.text({ x: 108, y: 70, text: PAPER[wt], size: 16 });
    const ghost = [0, 0.5, 0.9, 0.7][vc];
    if (ghost) out += guy(k, 160, { s: 1, color: S.purple, alpha: ghost, mood: 0.2 });
    out += k.wave({ x: 30, y: 14, w: 140 - bk * 25, h: 14, amp: 0.4 + bk * 0.15, cycles: 6, noise: bk * 0.3, color: S.gold });
    if (bk >= 2) out += k.label({ x: 180 - bk * 25, y: 22, text: "...", size: 12, color: S.gold, anchor: "start" });
    /* the picture inside the picture: what we see while it is read */
    out += k.frame({ x: 222, y: 30, w: 88, h: 60, color: "#666", w2: 1.5 });
    out += k.text({ x: 266, y: 70, text: ["🧑", "🕰️", "📝", "🪦"][sh], size: 24 });
    out += k.label({ x: 266, y: 100, text: ["the reader", "back then", "the page", "who it's about"][sh], size: 7, color: "#aaa" });
    out += strip(k, [g.num("hold", "Carries it"), g.word("what", "Reading"), g.word("voice", "Voice", S.purple), g.word("reader", "Reader"), g.steps("breaks", "Breaks", S.red), g.word("shown", "We see")]);
    return out + k.caption(`${v("what")} read aloud, ${v("breaks")}`);
  });

  /* ======================= sideBySideTalk ======================= */
  /* Two people facing the same way; the more they avoid facing, the straighter ahead they look. */
  const WHERE2 = ["🚗", "🪑", "🚰", "🏠", "🍺"];
  const DOING = ["", "🛞", "🍽️", "🌆", "🍜"];
  look("sideBySideTalk", (v, k, g) => {
    const sb = v.n("sideBy");
    const wh = idx(v, "where", 5);
    const dg = idx(v, "doing", 5);
    const gl = Math.round(v.n("glances"));
    const tn = idx(v, "turn", 3);
    const sh = idx(v, "shot", 3);
    let out = stage(k);
    const lookA = tn >= 1 ? 1 : (5 - sb) / 5;
    const lookB = tn === 2 ? -1 : -(5 - sb) / 5;
    out += k.text({ x: 160, y: 104, text: WHERE2[wh], size: 26, alpha: 0.6 });
    out += guy(k, 135, { s: 1, color: S.blue, look: lookA, lean: tn >= 1 ? 6 : 0 });
    out += guy(k, 185, { s: 1, color: S.pink, look: lookB, lean: tn === 2 ? -6 : 0 });
    if (dg) out += k.text({ x: 160, y: 22, text: DOING[dg], size: 16 });
    out += k.arrow({ x1: 135, y1: 34, x2: 135, y2: 10, color: "#666", w: 1.5 }) + k.arrow({ x1: 185, y1: 34, x2: 185, y2: 10, color: "#666", w: 1.5 });
    for (let i = 0; i < gl; i++) out += arc(140, 44, 180, 44, 4 + i * 2, S.gold, 1, "2 2");
    const cx = [160, 40, 160][sh];
    const cy = [70, 70, 112][sh];
    out += k.cam({ x: sh === 0 ? 40 : cx, y: sh === 2 ? 30 : cy, dir: sh === 2 ? 90 : 0, s: 0.6, color: S.grey });
    if (sh === 2) out += k.label({ x: 40, y: 50, text: "from behind", size: 7, color: "#aaa" });
    if (sh === 0) out += k.cam({ x: 280, y: 70, dir: 180, s: 0.6, color: S.grey });
    out += strip(k, [g.num("sideBy", "Facing away"), g.word("where", "Where"), g.word("doing", "Eyes on"), g.num("glances", "Glances", ""), g.steps("turn", "Turn", S.gold), g.word("shot", "Shot")]);
    return out + k.caption(`side by side ${v("where")}, ${v("turn") === "never" ? "never turning" : "turning " + v("turn")}`);
  });

  /* ======================= bodySaysOpposite ======================= */
  /* The words in a calm bubble; a red ring on the part of the body that says the opposite. */
  const PART_Y = [FY - 72, FY - 46, FY - 4, FY - 60, FY - 40];
  look("bodySaysOpposite", (v, k, g) => {
    const cl = v.n("clash");
    const pt = idx(v, "part", 5);
    const wd = idx(v, "words", 5);
    const aw = idx(v, "aware", 3);
    const cg = idx(v, "caught", 4);
    const cm = idx(v, "camera", 3);
    let out = stage(k);
    const x = 130;
    out += guy(k, x, { s: 1.15, color: S.blue, mood: 0.5, arms: pt === 1 ? -0.4 - cl * 0.1 : -0.2, lean: pt === 4 ? cl * 3 : 0 });
    out += say(k, x + 10, 14, "\"" + v("words") + "\"", { size: 10, fill: S.green, color: "#fff" });
    out += k.ring({ x, y: PART_Y[pt], r: 8 + cl * 2, color: S.red, w: 1 + cl * 0.5, dash: pt === 4 ? "4 3" : "" });
    if (pt === 0) out += k.label({ x: x + 22, y: PART_Y[0], text: "↔", size: 10, color: S.red });
    if (pt === 2) out += k.label({ x: x + 18, y: FY, text: "tap tap", size: 7, color: S.red, anchor: "start" });
    if (aw > 0) out += k.text({ x: x - 30, y: 40, text: aw === 2 ? "😈" : "💭", size: 12 });
    const eyes = [0, 1, 1, 3][cg];
    for (let i = 0; i < eyes; i++) out += guy(k, 240 + i * 26, { s: 0.7, color: cg === 1 ? S.gold : S.pink, look: -1, alpha: cg === 1 ? 0.35 : 1 });
    if (cg === 1) out += k.text({ x: 260, y: 40, text: "only us 👁️", size: 9, color: S.gold });
    out += k.frame({ x: cm === 0 ? 80 : cm === 1 ? x - 22 : x - 18, y: cm === 0 ? 4 : cm === 1 ? PART_Y[pt] - 20 : FY - 90, w: cm === 0 ? 100 : 44, h: cm === 0 ? 110 : cm === 1 ? 40 : 30, color: S.gold, w2: 1.2 });
    out += strip(k, [g.num("clash", "Clash", "", S.red), g.word("part", "Gives it away"), g.word("words", "Words"), g.steps("aware", "Aware"), g.steps("caught", "Caught by", S.pink), g.word("camera", "Camera")]);
    return out + k.caption(`"${v("words")}", but ${v("part")} says no`);
  });

  /* ======================= throughTheDoor ======================= */
  /* A barrier down the middle, solid or thin, one person each side, sinking down against it, hands on it. */
  look("throughTheDoor", (v, k, g) => {
    const br = idx(v, "barrier", 5);
    const ins = idx(v, "inside", 4);
    const tc = idx(v, "touch", 4);
    const sk = idx(v, "sink", 4);
    const op = idx(v, "opens", 4);
    const sh = idx(v, "shot", 3);
    let out = stage(k);
    const bw = [2, 4, 8, 10, 18][br];
    const gapO = [0, 4, 14, 30][op];
    const fill = [S.grey, "#7fa7c9", S.wood, S.wood, "#555"][br];
    out += `<rect x="${r1(160 - bw / 2)}" y="10" width="${bw}" height="${FY - 10}" fill="${fill}" opacity="${br === 0 ? 0.5 : br === 1 ? 0.6 : 1}"/>`;
    if (gapO) out += `<rect x="${r1(160 + bw / 2)}" y="10" width="${gapO}" height="${FY - 10}" fill="${S.gold}" opacity="0.3"/>`;
    if (br === 3) out += k.dot({ x: 160 + bw / 2 + 2, y: 64, r: 2, color: S.gold });
    const drop = [0, 4, 22, 30][sk];
    const sA = sk === 3 ? 0.75 : 1;
    const xA = 160 - bw / 2 - 16 - (sk === 1 ? -4 : 0);
    const xB = 160 + bw / 2 + 16 + gapO;
    out += k.person({ x: xA, y: FY + drop * 0.2, s: sA * (1 - drop / 90), color: S.blue, look: 1, lean: sk >= 1 ? 8 : 0, arms: tc >= 1 ? 0.6 : -0.3, mood: -0.3 });
    out += k.person({ x: xB, y: FY + drop * 0.2, s: (ins === 3 ? 0.7 : 1) * sA * (1 - drop / 90), color: [S.pink, S.red, S.purple, S.orange][ins], look: -1, lean: sk === 3 ? -8 : 0, arms: tc === 3 ? 0.6 : -0.4, mood: -0.5 });
    if (tc >= 1) out += k.hand({ x: 160 - bw / 2 - 4, y: 60, s: 0.3, open: 1 });
    if (tc === 2) out += k.dot({ x: 160 - bw / 2 - 3, y: 38, r: 3, color: S.pink });
    if (tc === 3) out += k.hand({ x: 160 + bw / 2 + 4 + gapO, y: 60, s: 0.3, open: 1 });
    out += chip(k, 250, 18, "inside: " + v("inside"), "#33323d", "middle");
    if (sh !== 1) out += k.cam({ x: sh === 0 ? 30 : 160, y: sh === 0 ? 40 : 100, dir: sh === 0 ? 0 : -90, s: 0.5, color: S.grey });
    else out += k.cam({ x: 24, y: 40, dir: 0, s: 0.5, color: S.grey }) + k.cam({ x: 296, y: 40, dir: 180, s: 0.5, color: S.grey });
    out += strip(k, [g.steps("barrier", "Barrier", S.wood), g.word("inside", "Inside"), g.steps("touch", "Touch", S.pink), g.steps("sink", "Sinking", S.blue), g.steps("opens", "Opens", S.green), g.word("shot", "Camera")]);
    return out + k.caption(`talking through ${v("barrier")}, ${v("opens") === "never" ? "it never opens" : "it opens " + v("opens")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
