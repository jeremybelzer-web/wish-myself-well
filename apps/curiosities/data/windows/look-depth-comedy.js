/* look for the comedy and comedy-from-the-mix curiosities in data/db-depth-comedy.js (depth thread, comedy): the
   live picture at the top of each window. Same house style as look-heart-comedy.js: a stage on top (y 0 to 120)
   with little people acting out the joke, a strip of small labelled gauges below it, and a caption. Colors: gold =
   laughs, red = trouble, blue = the straight one, orange = the funny one. Every own setting moves something of its
   own. */
(function (W) {
  const S = { bg: "#17161d", floor: "#2b2533", gold: "#ffd166", red: "#e4572e", blue: "#4a6fa5", orange: "#e8913a", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", ice: "#9fd3ff", wood: "#6b5a45" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);
  const FY = 112; /* the stage floor: people's feet */

  /* ---------- the stage (copied from look-heart-comedy.js) ---------- */
  const stage = (k, o) => {
    o = o || {};
    return k.bg(o.bg || S.bg) + `<rect x="0" y="${FY}" width="320" height="8" fill="${o.floor || S.floor}"/>` + (o.spot ? `<ellipse cx="${o.spot}" cy="${FY + 2}" rx="70" ry="9" fill="#fff4c8" opacity="0.12"/>` : "");
  };
  const guy = (k, x, o) => k.person(Object.assign({ x, y: FY }, o || {}));
  /* A laugh: "HA!" in gold. p 0..1 is how big. */
  const ha = (k, x, y, p, rot, word) => k.text({ x, y, text: word || "HA!", size: 9 + k.clamp(p, 0, 1) * 18, color: S.gold, weight: 900, outline: S.ink, outlineW: 3 }).replace("<text", `<text transform="rotate(${rot || -8} ${r1(x)} ${r1(y)})"`);
  /* A comic burst (a jagged star). */
  function burst(k, x, y, r, color, txt, tsize) {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rr = i % 2 ? r * 0.62 : r;
      pts.push(`${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="${color || S.gold}" stroke="${S.ink}" stroke-width="2"/>` + (txt ? k.text({ x, y: y + (tsize || 10) * 0.35, text: txt, size: tsize || 10, color: S.ink, weight: 900 }) : "");
  }
  /* n small heads in rows, inside a box. */
  function heads(k, n, x, y, w, o) {
    o = o || {};
    const rr = o.r || 4;
    const per = Math.max(1, Math.floor(w / (rr * 2.4)));
    const shown = Math.min(n, o.max || 40);
    let out = "";
    for (let i = 0; i < shown; i++) out += k.dot({ x: x + (i % per) * rr * 2.4 + rr, y: y + Math.floor(i / per) * rr * 2.4, r: rr, color: typeof o.color === "function" ? o.color(i) : o.color || "#c9b49a" });
    if (n > shown) out += k.label({ x: x + w, y: y + 3, text: `+${n - shown}`, size: 8, color: "#ccc", anchor: "end" });
    return out;
  }
  const sweat = (k, x, y, n) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => `<path d="M${r1(x + i * 6)} ${r1(y + (i % 2) * 5)} q-3 5 0 7 q3 -2 0 -7 Z" fill="#9fd3ff"/>`).join("");
  const motion = (k, x, y, n, len, dir) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => `<line x1="${r1(x)}" y1="${r1(y + i * 6)}" x2="${r1(x - (dir || 1) * len)}" y2="${r1(y + i * 6)}" stroke="#eee" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>`).join("");
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${r1(x0)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="${color || "#33323d"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 9, color: "#fff" });
  };
  /* A film bar from start to end, with pins at places 0..1 (or a filled stretch). */
  function film(k, x, y, w, o) {
    o = o || {};
    let out = `<rect x="${x}" y="${y}" width="${w}" height="10" rx="2" fill="#2e2d36" stroke="#555"/>`;
    for (let i = 1; i < 12; i++) out += `<line x1="${r1(x + (i * w) / 12)}" y1="${y + 1}" x2="${r1(x + (i * w) / 12)}" y2="${y + 9}" stroke="#444"/>`;
    (o.spans || []).forEach((s) => (out += `<rect x="${r1(x + w * s.a)}" y="${y + 1}" width="${r1(Math.max(1.5, w * (s.b - s.a)))}" height="8" fill="${s.color || S.gold}" opacity="${s.alpha || 0.85}"/>`));
    (o.pins || []).forEach((p) => {
      const px = x + w * k.clamp(p.p, 0, 1);
      out += `<path d="M${r1(px)} ${y + 10} l-4 -14 h8 Z" fill="${p.color || S.red}" stroke="${S.ink}"/>` + (p.label ? k.label({ x: px, y: y - 7, text: p.label, size: 8, color: p.color || "#eee" }) : "");
    });
    if (o.ends !== false) out += k.label({ x, y: y + 20, text: "start", size: 7, color: "#888", anchor: "start" }) + k.label({ x: x + w, y: y + 20, text: "end", size: 7, color: "#888", anchor: "end" });
    return out;
  }
  /* A stopwatch row: a bar of seconds with the number. */
  const stopwatch = (k, x, y, w, sec, max, color, lab) => `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="#33323d"/><rect x="${x}" y="${y}" width="${r1(Math.max(2, (w * k.clamp(sec, 0, max)) / max))}" height="7" rx="3.5" fill="${color || S.gold}"/>` + k.label({ x: x + w + 4, y: y + 7, text: lab || `${fmt(sec)} s`, size: 8, color: "#ddd", anchor: "start" });
  /* Beat dots: n little dots in a row. */
  const beats = (k, x, y, n, color, gap) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => k.dot({ x: x + i * (gap || 9), y, r: 3, color: color || "#bbb" })).join("");
  /* A door: a frame, open or shut. */
  const door = (k, x, w, h, open, color) => `<rect x="${r1(x)}" y="${r1(FY - h)}" width="${r1(w)}" height="${r1(h)}" fill="#0c0b10" stroke="#555"/>` + `<rect x="${r1(x)}" y="${r1(FY - h)}" width="${r1(w * (1 - 0.7 * k.clamp(open, 0, 1)))}" height="${r1(h)}" fill="${color || S.wood}" stroke="${S.ink}"/>`;

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
        if (it.kind === "when") out += `<line x1="${r1(x + bw * it.p)}" y1="${by - 2}" x2="${r1(x + bw * it.p)}" y2="${by + 9}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
        else out += `<rect x="${x}" y="${by}" width="${r1(Math.max(2, bw * k.clamp(it.p, 0, 1)))}" height="7" rx="3.5" fill="${c}"/>`;
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

  /* ======================= wrongEar ======================= */
  /* Two people talk on the left; the wrong listener hears through a wall, door, phone or mic on the right. */
  const HEARD = ["about you...", "the secret is...", "I love...", "the plan is...", "...and his nose!"];
  look("wrongEar", (v, k, g) => {
    const bad = v.n("overheard");
    const what = idx(v, "what", 5);
    const how = idx(v, "how", 5);
    const half = idx(v, "half", 3);
    const sk = idx(v, "speakerKnows", 3);
    const resp = idx(v, "response", 4);
    let out = stage(k, { spot: 70 });
    /* the speaker (turned round when they find out) and their friend */
    out += guy(k, 50, { s: 0.85, color: S.orange, mood: sk === 2 ? -0.8 : 0.5, look: sk === 2 ? 1 : -1, eyes: sk === 2 ? 1 : 0.8 });
    out += guy(k, 20, { s: 0.75, color: S.blue, mood: 0.3, look: 1 });
    /* the words: cut short when only part is heard */
    const full = HEARD[what];
    const shown = [full.slice(0, 6) + "…", full.slice(0, Math.ceil(full.length * 0.6)) + "…", full][half];
    out += k.bubble({ x: 70, y: 22, w: 104, h: 22, text: shown, tail: -16, size: 9 });
    /* the way it reaches the listener */
    const lx = 210;
    if (how === 0) out += `<rect x="150" y="30" width="12" height="${FY - 30}" fill="#5c5160" stroke="${S.ink}"/>` + `<path d="M150 50 h12 M150 70 h12 M150 90 h12" stroke="#3d3540"/>`;
    if (how === 1) out += door(k, 148, 22, 80, 0.4);
    if (how === 2) out += `<rect x="114" y="98" width="10" height="14" rx="2" fill="#333" stroke="#aaa"/>` + k.speaker({ x: 190, y: 40, s: 0.7, level: 0.8 });
    if (how === 3) out += k.mic({ x: 104, y: 74, s: 0.8 }) + k.speaker({ x: 190, y: 40, s: 0.7, level: 1 });
    /* the sound waves travelling */
    out += k.wave({ x: how === 4 ? 82 : 120, y: 46, w: how === 4 ? 40 : 70, h: 16, amp: 0.3 + half * 0.3, cycles: 3, color: S.ice });
    const ox = how === 4 ? 100 : lx;
    out += guy(k, ox, { s: 0.9, color: S.red, mood: -0.2 - bad * 0.15, look: -1, eyes: 0.6 + bad * 0.08, arms: resp === 1 ? 0.6 : 0 });
    out += k.label({ x: ox, y: 20, text: "!".repeat(Math.max(1, Math.round(bad))), size: 12, color: S.red, weight: 900 });
    /* what they do with it */
    out += chip(k, 270, 70, ["stews", "confronts", "plays along", "tells all"][resp], ["#333", "#4a2a2a", "#2c3346", "#4a3a20"][resp], "middle");
    if (resp === 3) out += heads(k, 9, 248, 84, 50, { r: 4, color: S.gold });
    if (resp === 2) out += k.label({ x: 270, y: 92, text: "🪤", size: 14 });
    out += strip(k, [g.num("overheard", "How bad", " of 5", S.red), g.word("what", "Heard"), g.word("how", "How"), g.steps("half", "How much"), g.steps("speakerKnows", "Speaker finds out"), g.word("response", "Listener")]);
    return out + k.caption(`${v("what")}, heard ${v("how")}`);
  });

  /* ======================= tryingTooHard ======================= */
  const COOL = ["🧍", "🕶️", "🤙", "💬", "🎙️", "🛹"];
  look("tryingTooHard", (v, k, g) => {
    const eff = v.n("effort");
    const mv = idx(v, "move", 6);
    const aud = idx(v, "audience", 5);
    const cr = idx(v, "cracks", 4);
    const cov = idx(v, "covers", 4);
    const seen = idx(v, "seen", 4);
    let out = stage(k, { spot: 110 });
    /* the try-hard: leans more with effort, tips over as the act cracks */
    const tilt = 4 + eff * 3 + [0, 6, 20, 70][cr];
    out += guy(k, 110, { s: 0.95, color: S.orange, lean: tilt, arms: 0.2 + eff * 0.1, mood: [0.6, 0.2, -0.3, -0.7][cr], look: 1 });
    out += k.label({ x: 96, y: 30, text: COOL[mv], size: 18 });
    out += sweat(k, 124, 38, eff);
    if (cr >= 2) out += burst(k, 140, 98, 8 + cr * 3, S.red);
    /* the lean against nothing */
    if (mv === 0) out += `<rect x="130" y="40" width="8" height="${FY - 40}" fill="none" stroke="#666" stroke-dasharray="3 3"/>`;
    /* the cover-up */
    out += k.bubble({ x: 60, y: 24, w: 92, h: 20, text: ["(no idea)", "meant that.", "AND again!", "ok, not cool"][cov], tail: 30, size: 9 });
    /* who it is for */
    out += guy(k, 240, { s: 0.8, color: [S.pink, S.blue, S.green, S.red, S.grey][aud], mood: seen >= 2 ? -0.4 : 0, look: -1, alpha: aud === 4 ? 0.35 : 1 });
    out += k.label({ x: 240, y: 20, text: ["crush", "boss", "kids", "rival", "nobody"][aud], size: 8, color: "#bbb" });
    /* who saw the fail */
    out += heads(k, [0, 0, 1, 12][seen], 270, 70, 44, { r: 4, color: "#c9b49a" });
    if (seen === 1) out += k.label({ x: 290, y: 100, text: "only us 👁", size: 8, color: "#ccc" });
    out += strip(k, [g.num("effort", "Effort", " of 5", S.orange), g.word("move", "Move"), g.word("audience", "For"), g.steps("cracks", "Breaks", S.red), g.word("covers", "Cover"), g.steps("seen", "Seen by")]);
    return out + k.caption(`${v("move")} for ${v("audience")} · ${v("cracks")}`);
  });

  /* ======================= literalMinded ======================= */
  const SAID = ["“Break a leg!”", "“Hit the lights.”", "“Love the hat.”", "“Knock knock.”", "“Wet paint”"];
  const LIT = ["🦵", "👊💡", "❤️🎩", "🚪✊", "🖌️"];
  look("literalMinded", (v, k, g) => {
    const lit = v.n("literal");
    const w = idx(v, "words", 5);
    const who = idx(v, "who", 5);
    const act = idx(v, "acted", 4);
    const rep = Math.round(v.n("repeats"));
    const les = idx(v, "lesson", 3);
    let out = stage(k);
    out += guy(k, 46, { s: 0.85, color: S.blue, look: 1, mood: 0.3 });
    out += k.bubble({ x: 70, y: 22, w: 96, h: 22, text: SAID[w], tail: -20, size: 9 });
    /* the literal one */
    const lx = 170;
    if (who === 4) out += `<ellipse cx="${lx}" cy="${FY - 12}" rx="18" ry="10" fill="#b08850" stroke="${S.ink}"/><circle cx="${lx + 16}" cy="${FY - 24}" r="8" fill="#b08850" stroke="${S.ink}"/>`;
    else out += guy(k, lx, { s: [0.65, 0.9, 0.9, 0.9][who], color: [S.green, S.grey, S.purple, S.ink][who], look: -1, mood: act === 1 ? -0.3 : 0, arms: act >= 2 ? 0.8 : 0 });
    if (who === 1) out += `<rect x="${lx - 10}" y="44" width="20" height="5" fill="${S.ice}"/>`;
    /* how far they act on it: a thought, a puzzle, a picture of the literal thing */
    out += [k.bubble({ x: 230, y: 30, w: 70, h: 20, text: SAID[w].slice(0, 9) + "…", tail: -40, size: 8 }), k.label({ x: 196, y: 36, text: "?", size: 22, color: S.gold, weight: 900 }), k.label({ x: 215, y: 60, text: LIT[w], size: 20 }), k.label({ x: 225, y: 60, text: LIT[w] + LIT[w], size: 22 }) + motion(k, 200, 74, 3, 20, 1)][act];
    /* the literal meter: how exact */
    out += k.meter({ x: 120, y: 98, w: 70, p: lit / 5, color: S.gold });
    /* how many times */
    out += beats(k, 250, 98, rep, S.orange, 9);
    out += k.label({ x: 290, y: 86, text: ["💥 mess", "✓ by luck", "★ right"][les], size: 9, color: [S.red, S.green, S.gold][les], anchor: "end" });
    out += strip(k, [g.num("literal", "Literal", " of 5"), g.word("words", "Words"), g.word("who", "Who"), g.steps("acted", "Acted"), g.num("repeats", "Times", "×", S.orange), g.word("lesson", "Ends")]);
    return out + k.caption(`${v("who")} takes ${v("words")} literally`);
  });

  /* ======================= planFailsFirst ======================= */
  const CAUSE = ["🔒", "🎒", "🤦", "🐭", "🎲"];
  look("planFailsFirst", (v, k, g) => {
    const prep = v.n("prep");
    const sh = idx(v, "shown", 5);
    const steps = Math.round(v.n("steps"));
    const fa = idx(v, "failsAt", 4);
    const ca = idx(v, "cause", 5);
    const af = idx(v, "after", 4);
    let out = stage(k);
    /* the plan board with numbered steps; the failing one in red */
    out += k.panel({ x: 10, y: 8, w: 170, h: 62, w2: 1.5, fill: sh === 0 ? "#2a2933" : S.paper });
    const failAt = [0, 1, 2, steps][fa];
    for (let i = 0; i < steps; i++) {
      const x = 18 + (i % 6) * 27;
      const y = 22 + Math.floor(i / 6) * 22;
      const bad = i + 1 === failAt;
      out += `<rect x="${x}" y="${y - 8}" width="20" height="14" rx="2" fill="${bad ? S.red : i + 1 > failAt && failAt > 0 ? "#bbb" : "#9fc5e8"}" stroke="${S.ink}"/>` + k.label({ x: x + 10, y: y + 2, text: String(i + 1), size: 8, color: S.ink });
      if (i + 1 > failAt && failAt) out += `<line x1="${x}" y1="${y - 8}" x2="${x + 20}" y2="${y + 6}" stroke="#777"/>`;
    }
    if (fa === 0) out += k.label({ x: 95, y: 64, text: "never started", size: 8, color: S.red });
    out += k.label({ x: 176, y: 66, text: ["talk", "board", "model", "rehearsal", "voice-over"][sh], size: 7, color: "#888", anchor: "end" });
    /* preparation: a stack of papers */
    for (let i = 0; i < Math.round(prep); i++) out += `<rect x="${200 + i * 3}" y="${FY - 6 - i * 5}" width="26" height="5" fill="${S.paper}" stroke="#999"/>`;
    /* the cause and the team */
    out += k.label({ x: 120, y: 98, text: CAUSE[ca], size: 18 });
    out += guy(k, 60, { s: 0.75, color: S.orange, mood: af === 1 ? 0.6 : -0.4, look: 1 });
    out += guy(k, 266, { s: 0.75, color: S.blue, mood: af === 1 ? 0.6 : -0.4, look: -1, arms: af === 3 ? 0.7 : 0 });
    out += chip(k, 266, 22, ["give up", "make it up, win", "make it worse", "plan B (longer)"][af], ["#333", "#2f4a36", "#4a2a2a", "#2c3346"][af], "middle");
    if (af === 3) out += k.panel({ x: 240, y: 30, w: 52, h: 18, w2: 1, fill: S.paper });
    out += strip(k, [g.num("prep", "Prep", " of 5"), g.word("shown", "Shown as"), g.num("steps", "Steps", ""), g.steps("failsAt", "Fails", S.red), g.word("cause", "Because"), g.word("after", "Then")]);
    return out + k.caption(`${steps} steps, fails ${v("failsAt")}`);
  });

  /* ======================= walkOfShame ======================= */
  look("walkOfShame", (v, k, g) => {
    const len = v.n("length");
    const wh = idx(v, "where", 5);
    const n = Math.round(v.n("watchers"));
    const si = idx(v, "silence", 5);
    const dig = idx(v, "dignity", 4);
    const sh = idx(v, "shot", 4);
    let out = stage(k, { floor: ["#2b2533", "#3a3340", "#463a2c", "#2a2a40", "#33372f"][wh] });
    /* the path out, longer with length */
    const pathW = 60 + len * 44;
    out += `<rect x="20" y="${FY - 2}" width="${r1(pathW)}" height="4" fill="${S.gold}" opacity="0.4"/>` + door(k, 24 + pathW, 20, 60, 0.6);
    /* the walker: about a third of the way along */
    const wx = 20 + pathW * 0.35;
    out += guy(k, wx, { s: [0.95, 0.9, 0.75, 0.9][dig], color: S.orange, walk: dig === 3 ? 1 : 0.5, lean: dig === 3 ? 12 : dig === 2 ? 6 : 0, mood: [0.2, 0.3, -0.6, -0.8][dig], look: 1 });
    if (dig === 1) out += k.label({ x: wx + 14, y: 36, text: "😬", size: 11 });
    /* the watchers: heads along the top, eyes on the walker */
    out += heads(k, n, 10, 10, 220, { r: 3.5, max: 60, color: "#c9b49a" });
    /* the sound */
    out += k.label({ x: 280, y: 20, text: ["🔉 chatter", "🔈 quiet", "🔇", "👏", "🎻"][si], size: si >= 2 ? 16 : 9, color: "#ccc" });
    if (si === 3) out += guy(k, 270, { s: 0.6, color: S.grey, arms: 0.8, mood: 0.2, look: -1 });
    /* the shot: a frame around what the camera holds */
    const fr = [{ x: wx - 22, y: 30, w: 44, h: 84 }, { x: wx - 40, y: 26, w: 120, h: 88 }, { x: 4, y: 4, w: 312, h: 112 }, { x: wx, y: 20, w: 150, h: 94 }][sh];
    out += k.frame({ x: fr.x, y: fr.y, w: fr.w, h: fr.h, color: S.ice, w2: 1.5, dash: "5 3" });
    out += strip(k, [g.num("length", "Walk", " of 5", S.orange), g.word("where", "Where"), g.num("watchers", "Watching", ""), g.word("silence", "Sound"), g.word("dignity", "Carries it"), g.word("shot", "Camera")]);
    return out + k.caption(`${v("where")} · ${n} watching · ${v("silence")}`);
  });

  /* ======================= cheapEffect ======================= */
  const FAKE = ["🛸", "👾", "🏚️", "🪆", "🎥", "🖼️"];
  look("cheapEffect", (v, k, g) => {
    const ch = v.n("cheap");
    const kind = idx(v, "kind", 6);
    const fl = idx(v, "flaw", 5);
    const pl = idx(v, "played", 3);
    const hom = idx(v, "homage", 3);
    const rep = Math.round(v.n("repeats"));
    /* old style: sepia wash and scratches */
    let out = stage(k, { bg: hom === 2 ? "#3a3226" : hom === 1 ? "#24211f" : S.bg });
    /* the fake thing, wobbling more as it gets cheaper */
    const fx = 170;
    const fy = 46;
    const rot = fl === 1 ? ch * 4 : ch;
    const size = fl === 3 ? 44 : 26;
    out += `<g transform="rotate(${r1(rot)} ${fx} ${fy})">` + k.text({ x: fx, y: fy + size * 0.35, text: FAKE[kind], size }) + `</g>`;
    /* the giveaway */
    if (fl === 0) out += `<line x1="${fx}" y1="0" x2="${fx}" y2="${fy - 10}" stroke="#ddd" stroke-width="${r1(0.5 + ch * 0.3)}"/>`;
    if (fl === 1) out += motion(k, fx - 18, fy - 6, 3, 10 + ch * 3, 1);
    if (fl === 2) out += `<line x1="${fx + 24}" y1="10" x2="${fx + 24}" y2="${FY}" stroke="${S.red}" stroke-dasharray="4 3"/>`;
    if (fl === 4) out += k.text({ x: fx + 16, y: fy + 4, text: "🤐", size: 12 });
    /* cardboard look: a tan box behind it, stronger as it gets cheaper */
    out += `<rect x="${fx - 30}" y="${fy - 26}" width="60" height="52" fill="#c2a67a" opacity="${r1(ch * 0.07)}"/>`;
    /* the actor */
    out += guy(k, 70, { s: 0.9, color: S.blue, look: 1, mood: [-0.1, 0.1, 0.5][pl], arms: pl === 0 ? 0.9 : pl === 2 ? 0.5 : 0 });
    out += k.label({ x: 70, y: 18, text: ["(salutes)", "(barely looks)", "“is that a string?”"][pl], size: 8, color: "#ccc" });
    if (hom === 2) for (let i = 0; i < 5; i++) out += `<line x1="${30 + i * 60}" y1="0" x2="${34 + i * 60}" y2="${FY}" stroke="#d8c8a0" opacity="0.25"/>`;
    /* how many times it shows */
    out += beats(k, 236, 100, rep, S.gold, 11);
    out += strip(k, [g.num("cheap", "Cheap", " of 5"), g.word("kind", "Faked"), g.word("flaw", "Gives away"), g.word("played", "Actors"), g.steps("homage", "Old style"), g.num("repeats", "Times", "×")]);
    return out + k.caption(`${v("kind")}, ${v("flaw")} · ${v("played")}`);
  });

  /* ======================= rewatchGag ======================= */
  const HID = ["🔍", "💬", "🪧", "🕵️", "🔊"];
  look("rewatchGag", (v, k, g) => {
    const hid = v.n("hidden");
    const kind = idx(v, "kind", 5);
    const nd = idx(v, "needs", 4);
    const gap = v.n("gap");
    const cnt = Math.round(v.n("count"));
    const fair = idx(v, "fair", 3);
    let out = stage(k);
    /* first watch: the frame with the joke faded by how hidden it is */
    out += k.frame({ x: 12, y: 10, w: 130, h: 70, color: "#666", w2: 1.5 }) + k.label({ x: 77, y: 92, text: "first watch", size: 8, color: "#999" });
    out += k.person({ x: 60, y: 76, s: 0.5, color: S.blue, mood: 0.2 });
    out += k.text({ x: 118, y: 36, text: HID[kind], size: 16, alpha: 1 - hid * 0.17 });
    /* second watch: the same joke circled */
    out += k.frame({ x: 178, y: 10, w: 130, h: 70, color: S.gold, w2: 1.5 }) + k.label({ x: 243, y: 92, text: "second watch", size: 8, color: S.gold });
    out += k.text({ x: 284, y: 36, text: HID[kind], size: 16 }) + k.ring({ x: 284, y: 31, r: 13, color: S.gold }) + ha(k, 230, 60, 0.4, -6);
    /* what unlocks it, and how far away */
    out += k.arrow({ x1: 146, y1: 46, x2: 174, y2: 46, color: ["#888", S.ice, S.purple, S.red][nd], w: 2 });
    out += k.label({ x: 160, y: 34, text: ["eyes", "a scene", "the end", "secret"][nd], size: 7, color: "#ccc" });
    out += film(k, 20, 100, 140, { pins: [{ p: 0.05, color: S.gold }, { p: 0.05 + gap / 130, color: S.ice }], ends: false });
    /* how many are planted */
    out += heads(k, cnt, 180, 98, 80, { r: 3, color: S.gold });
    out += k.label({ x: 300, y: 112, text: ["✗", "hard", "✓"][fair], size: 9, color: [S.red, S.orange, S.green][fair], anchor: "end" });
    out += strip(k, [g.num("hidden", "Hidden", " of 5"), g.word("kind", "Kind"), g.steps("needs", "Needs"), g.num("gap", "Gap", " min", S.ice), g.num("count", "Planted", ""), g.steps("fair", "First-timer", S.green)]);
    return out + k.caption(`${cnt} hidden · needs ${v("needs")}`);
  });

  /* ======================= politeSurface ======================= */
  const EVENT = ["🍽️", "💒", "👪", "⚱️", "💼", "👑"];
  look("politeSurface", (v, k, g) => {
    const pol = v.n("polite");
    const ev = idx(v, "event", 6);
    const wr = idx(v, "wrong", 5);
    const mask = idx(v, "mask", 4);
    const rules = idx(v, "rules", 4);
    const br = idx(v, "breaks", 3);
    let out = stage(k);
    /* the table */
    out += `<rect x="60" y="80" width="200" height="8" fill="${S.wood}" stroke="${S.ink}"/><line x1="70" y1="88" x2="70" y2="${FY}" stroke="${S.ink}" stroke-width="3"/><line x1="250" y1="88" x2="250" y2="${FY}" stroke="${S.ink}" stroke-width="3"/>`;
    out += k.label({ x: 160, y: 76, text: EVENT[ev], size: 14 });
    /* the trouble behind: grows with what is wrong */
    out += [k.label({ x: 290, y: 60, text: "💧", size: 10 }), k.label({ x: 290, y: 50, text: "🗯️", size: 16 }), k.label({ x: 290, y: 50, text: "🤫", size: 18 }), burst(k, 290, 44, 20, S.red, "🔥", 14), k.label({ x: 290, y: 52, text: "⚰️", size: 24 })][wr];
    /* the guests: smiles held by manners, strain by mask */
    for (let i = 0; i < 3; i++) {
      const cracked = br === 2 || (br === 1 && i === 0);
      out += guy(k, 100 + i * 60, { s: 0.8, color: [S.blue, S.purple, S.green][i], mood: cracked ? -0.9 : 0.2 + pol * 0.12, eyes: cracked ? 1 : 0.7 });
      if (mask >= 2 && !cracked) out += sweat(k, 108 + i * 60, 40, mask - 1);
      if (mask === 3 && !cracked) out += `<path d="M${94 + i * 60} 38 l4 -3 l3 4" stroke="${S.red}" stroke-width="1.5" fill="none"/>`;
      if (cracked) out += k.label({ x: 100 + i * 60, y: 20, text: "!!", size: 12, color: S.red, weight: 900 });
    }
    /* the rule book: thicker with stricter rules */
    out += `<rect x="12" y="${FY - 8 - rules * 8}" width="30" height="${8 + rules * 8}" fill="#7a2e2e" stroke="${S.ink}"/>` + k.label({ x: 27, y: FY - 12 - rules * 8, text: "rules", size: 7, color: "#ccc" });
    out += strip(k, [g.num("polite", "Polite", " of 5", S.blue), g.word("event", "Occasion"), g.steps("wrong", "Going wrong", S.red), g.steps("mask", "Strain"), g.steps("rules", "Rules"), g.steps("breaks", "Cracks", S.red)]);
    return out + k.caption(`${v("event")} · ${v("wrong")} · ${v("mask")}`);
  });

  /* ======================= neverGetsIt ======================= */
  look("neverGetsIt", (v, k, g) => {
    const lost = v.n("lost");
    const sh = idx(v, "shows", 5);
    const mind = idx(v, "minds", 3);
    const oth = idx(v, "others", 4);
    const times = Math.round(v.n("times"));
    const fin = idx(v, "finally", 3);
    let out = stage(k);
    /* the room laughing */
    for (let i = 0; i < 3; i++) out += guy(k, 40 + i * 50, { s: 0.8, color: [S.blue, S.purple, S.green][i], mood: 0.9, look: oth === 2 ? 1 : 0, arms: oth === 1 && i === 2 ? 0.6 : 0 });
    out += ha(k, 90, 22, 0.6, -6);
    if (oth === 1) out += k.bubble({ x: 160, y: 32, w: 58, h: 18, text: "see, the...", tail: -20, size: 8 });
    if (oth === 3) out += k.label({ x: 140, y: 50, text: "❤", size: 12, color: S.pink });
    /* the one who doesn't get it: further off the more lost */
    const ox = 200 + lost * 14;
    out += guy(k, ox, { s: 0.85, color: S.orange, mood: [0, 0, 0.6, -0.1, -0.2][sh] - mind * 0.25, look: -1, eyes: sh === 0 ? 0.9 : 0.7 });
    out += k.label({ x: ox, y: 22, text: ["😐", "❓", "…HA?", "🧐", "☝️"][sh], size: sh === 2 ? 10 : 14, color: S.gold });
    if (mind === 2) out += k.label({ x: ox + 16, y: 40, text: "💧", size: 9 });
    /* jokes gone by, and the last one */
    out += beats(k, 16, 100, times, "#888", 10);
    out += k.label({ x: 300, y: 100, text: ["✗ never", "🐢 late", "🏆 best joke"][fin], size: 9, color: [S.grey, S.ice, S.gold][fin], anchor: "end" });
    out += strip(k, [g.num("lost", "Lost", " of 5", S.orange), g.word("shows", "Shows it"), g.steps("minds", "Minds"), g.word("others", "Others"), g.num("times", "Jokes missed", ""), g.word("finally", "In the end")]);
    return out + k.caption(`${v("shows")} · ${times} jokes missed`);
  });

  /* ======================= offscreenGag ======================= */
  const NOISE = ["CRASH!", "THUD THUD", "SPLASH!", "AAAH!", "MEHHH!", "CLANG BONK"];
  look("offscreenGag", (v, k, g) => {
    const un = v.n("unseen");
    const snd = idx(v, "sound", 6);
    const len = v.n("length");
    const fc = idx(v, "faces", 3);
    const af = idx(v, "after", 4);
    const fl = idx(v, "flinch", 4);
    let out = stage(k);
    /* the next room: a door, and how much of the gag we see through it */
    out += door(k, 220, 50, 90, 1);
    out += `<rect x="220" y="${FY - 90}" width="50" height="90" fill="#000" opacity="${r1(0.2 + un * 0.16)}"/>`;
    if (un < 3) out += guy(k, 245, { s: 0.6, color: S.grey, lean: 40, alpha: 1 - un * 0.3 });
    /* the noise, bigger the longer it runs */
    out += burst(k, 248, 22, 10 + len * 1.4, S.gold) + k.text({ x: 248, y: 25, text: NOISE[snd], size: 6 + len * 0.2, color: "#fff", weight: 900, outline: S.ink, outlineW: 2 });
    /* the faces we watch */
    const n = [0, 1, 3][fc];
    for (let i = 0; i < n; i++) out += guy(k, 50 + i * 50, { s: 0.85, color: [S.blue, S.purple, S.green][i], look: 1, mood: fl ? -0.4 : 0, eyes: fl >= 2 ? 0.25 : 0.8, arms: fl === 3 ? 0.95 : 0 });
    if (!n) out += k.label({ x: 100, y: 70, text: "(empty room)", size: 9, color: "#777" });
    if (fl === 2) out += k.label({ x: 100, y: 28, text: "😖 😖 😖", size: 10 });
    /* afterwards */
    out += chip(k, 150, 104, ["nothing shown", "show the mess", "walks back, calm", "never know"][af], ["#333", "#4a2a2a", "#2c3346", "#3a2a4a"][af], "middle");
    if (af === 2) out += guy(k, 200, { s: 0.7, color: S.orange, mood: 0.3, look: -1 });
    out += strip(k, [g.num("unseen", "Unseen", " of 5"), g.word("sound", "We hear"), g.num("length", "Lasts", " s", S.ice), g.steps("faces", "Faces"), g.word("after", "After"), g.steps("flinch", "Flinch", S.red)]);
    return out + k.caption(`${v("sound")} off screen for ${fmt(len)} s`);
  });

  /* ======================= worstMoment ======================= */
  const MOM = ["💋", "💍", "💌", "🎤", "🗯️", "🤫"];
  const BY = ["📱", "🚶", "🍷", "🤧", "🚨", "🐕"];
  look("worstMoment", (v, k, g) => {
    const tm = v.n("timing");
    const mo = idx(v, "moment", 6);
    const by = idx(v, "by", 6);
    const tr = Math.round(v.n("tries"));
    const md = idx(v, "mood", 4);
    const bl = idx(v, "blame", 3);
    let out = stage(k, { spot: 110 });
    out += guy(k, 80, { s: 0.85, color: S.orange, look: 1, mood: [0.6, 0.1, -0.6, 0.8][md], lean: mo === 1 ? 8 : 0 });
    out += guy(k, 140, { s: 0.85, color: S.pink, look: -1, mood: [0.6, 0.1, -0.5, 0.8][md] });
    out += k.label({ x: 110, y: 30, text: MOM[mo], size: 16 });
    /* the sentence, cut off nearer its end as the timing gets worse */
    const sent = "I have to tell you...";
    const cut = Math.max(2, Math.round(sent.length * (0.25 + tm * 0.15)));
    out += k.bubble({ x: 110, y: 10, w: 120, h: 16, text: sent.slice(0, cut) + "|", tail: -20, size: 8 });
    /* the interrupter */
    out += burst(k, 230, 50, 18, S.red) + k.text({ x: 230, y: 56, text: BY[by], size: 16 });
    out += guy(k, 270, { s: 0.7, color: S.grey, look: -1, mood: [0.4, -0.5, 0.8][bl], alpha: by === 3 || by === 4 ? 0.4 : 1 });
    out += k.label({ x: 270, y: 20, text: ["la la", "oh no!", "heh"][bl], size: 8, color: "#ccc" });
    /* the tries so far */
    for (let i = 0; i < tr; i++) out += k.text({ x: 20 + i * 14, y: 104, text: MOM[mo], size: 10, alpha: 0.6 }) + `<line x1="${14 + i * 14}" y1="96" x2="${26 + i * 14}" y2="106" stroke="${S.red}" stroke-width="1.5"/>`;
    out += k.label({ x: 160, y: 104, text: ["goes on", "a bit spoiled", "lost", "even better ✨"][md], size: 8, color: [S.green, S.orange, S.red, S.gold][md] });
    out += strip(k, [g.num("timing", "Timing", " of 5", S.red), g.word("moment", "Moment"), g.word("by", "Cut by"), g.num("tries", "Tries again", "×"), g.steps("mood", "After"), g.word("blame", "Interrupter")]);
    return out + k.caption(`${v("moment")} cut off by ${v("by")}`);
  });

  /* ======================= mistakenIdentity ======================= */
  const FOR = ["🧑", "🌟", "💼", "🕵️", "👯"];
  look("mistakenIdentity", (v, k, g) => {
    const mx = v.n("mixup");
    const tf = idx(v, "takenFor", 5);
    const why = idx(v, "why", 5);
    const pl = idx(v, "plays", 4);
    const hm = idx(v, "howMany", 3);
    const tr = idx(v, "truth", 4);
    let out = stage(k, { spot: 120 });
    /* the ordinary person, wearing the label they were given */
    out += guy(k, 120, { s: 0.95, color: why === 2 ? S.purple : S.blue, mood: [-0.5, -0.2, 0.7, 0.5][pl], arms: pl >= 2 ? 0.6 : pl === 0 ? 0.3 : -0.3, look: -1 });
    out += chip(k, 120, 18, `“${["Mr Smith", "the star", "the boss", "the spy", "the twin"][tf]}”`, "#4a3a20", "middle") + k.label({ x: 146, y: 46, text: FOR[tf], size: 14 });
    out += k.label({ x: 120, y: 106, text: ["look-alike", "same name", "wrong clothes", "wrong place", "one lie"][why], size: 7, color: "#999" });
    /* the fooled crowd: grows with how many, and leans in with the size of the mix-up */
    const fooled = [1, 4, 14][hm];
    out += heads(k, fooled, 10, 30, 70, { r: 5, color: S.gold });
    out += k.meter({ x: 12, y: 96, w: 70, p: mx / 5, color: S.red });
    if (pl === 0) out += k.bubble({ x: 60, y: 76, w: 70, h: 16, text: "but I'm not...", tail: 30, size: 8 });
    /* the truth: the real one at the door, or a confession */
    if (tr === 1) out += door(k, 250, 30, 80, 1) + guy(k, 265, { s: 0.9, color: S.red, look: -1, mood: -0.4 });
    else if (tr === 2) out += k.label({ x: 250, y: 60, text: "“It was me.”", size: 9, color: "#ddd" });
    else if (tr === 3) out += k.label({ x: 260, y: 60, text: "🚨 caught", size: 11, color: S.red });
    else out += k.label({ x: 260, y: 60, text: "(never found out)", size: 8, color: "#777" });
    out += strip(k, [g.num("mixup", "Mix-up", " of 5", S.red), g.word("takenFor", "Taken for"), g.word("why", "Why"), g.steps("plays", "Plays along"), g.steps("howMany", "Fooled"), g.word("truth", "Truth")]);
    return out + k.caption(`Taken for ${v("takenFor")} · ${v("plays")}`);
  });

  /* ======================= sceneStealer ======================= */
  const ANIMAL = ["🐕", "🐈", "🦜", "🐐", "🦆", "🐎"];
  const DOES = ["👀", "🔊", "🍰", "🪑", "🏃", "🪞"];
  look("sceneStealer", (v, k, g) => {
    const st = v.n("steal");
    const an = idx(v, "animal", 6);
    const dz = idx(v, "does", 6);
    const wh = idx(v, "when", 4);
    const hu = idx(v, "humans", 4);
    const ow = idx(v, "owner", 4);
    let out = stage(k, { spot: 230 });
    /* the humans and their moment */
    out += guy(k, 60, { s: 0.9, color: S.blue, look: hu === 3 ? 1 : -1, mood: [0.3, 0.1, -0.5, 0.4][hu], arms: wh === 1 ? 0.7 : hu === 2 ? 0.8 : 0 });
    out += guy(k, 110, { s: 0.9, color: S.pink, look: hu >= 1 ? 1 : -1, mood: [0.3, 0.1, -0.4, 0.5][hu] });
    out += k.label({ x: 85, y: 18, text: ["(quiet)", "the speech", "💋", "THE END"][wh], size: 9, color: "#ccc" });
    if (hu === 1) out += k.label({ x: 85, y: 34, text: "(eyes front)", size: 8, color: "#999" });
    /* the animal: bigger, brighter, with more eyes on it as it steals more */
    out += k.text({ x: 230, y: FY - 4, text: ANIMAL[an], size: 22 + st * 6 });
    out += k.text({ x: 268, y: 50, text: DOES[dz], size: 16 });
    out += k.ring({ x: 230, y: FY - 16, r: 10 + st * 6, color: S.gold, w: 1.5, dash: "4 3" });
    /* whose it is */
    out += chip(k, 230, 18, ["hero's", "villain's", "a stranger's", "nobody's"][ow], ["#2f4a36", "#4a2a2a", "#2c3346", "#333"][ow], "middle");
    out += strip(k, [g.num("steal", "Steals", " of 5"), g.word("animal", "Animal"), g.word("does", "Does"), g.word("when", "When"), g.steps("humans", "Humans"), g.word("owner", "Owner")]);
    return out + k.caption(`${v("animal")} ${v("does")} ${v("when")}`);
  });

  /* ======================= fumbledHello ======================= */
  const GREET = ["🤝", "🤗", "😘", "✋", "🙇", "👊"];
  look("fumbledHello", (v, k, g) => {
    const fu = v.n("fumble");
    const a = idx(v, "first", 6);
    const b = idx(v, "second", 6);
    const rd = Math.round(v.n("rounds"));
    const en = idx(v, "ending", 4);
    const st = idx(v, "status", 4);
    let out = stage(k, { spot: 160 });
    const gap = en === 2 ? 14 : 40 - fu * 3;
    out += guy(k, 160 - gap, { s: [0.9, 0.9, 1, 0.9][st], color: S.orange, look: 1, lean: en === 2 ? 14 : fu * 2, arms: 0.3 + fu * 0.1, mood: 0.2 - fu * 0.1 });
    out += guy(k, 160 + gap, { s: [0.9, 0.9, 0.8, 0.9][st], color: S.blue, look: -1, lean: en === 2 ? -14 : -fu * 2, arms: b === 5 ? -0.3 : 0.3 + fu * 0.1, mood: 0.2 - fu * 0.1 });
    out += k.label({ x: 160 - gap - 6, y: 22, text: GREET[a], size: 16 }) + k.label({ x: 160 + gap + 6, y: 22, text: b === 5 ? "🧍" : GREET[b], size: 16 });
    if (en === 2) out += burst(k, 160, 34, 9, S.red, "", 0);
    if (en === 1) out += `<ellipse cx="160" cy="68" rx="${r1(gap + 6)}" ry="8" fill="none" stroke="${S.gold}" stroke-width="2"/>`;
    if (en === 3) out += guy(k, 240, { s: 0.75, color: S.green, mood: 0.6, arms: 0.6, look: -1 });
    if (en === 0) out += k.label({ x: 160, y: 50, text: "…", size: 18, color: "#bbb" });
    /* the switching rounds: a tangle of arrows */
    for (let i = 0; i < rd; i++) out += k.arrow({ x1: 20, y1: 20 + i * 14, x2: 50, y2: 20 + i * 14 + (i % 2 ? -6 : 6), color: i % 2 ? S.orange : S.blue, w: 1.5 });
    out += k.label({ x: 290, y: 100, text: ["strangers", "old friends", "boss + worker", "exes"][st], size: 8, color: "#bbb", anchor: "end" });
    out += strip(k, [g.num("fumble", "Fumble", " of 5", S.red), g.word("first", "One tries"), g.word("second", "Other tries"), g.num("rounds", "Rounds", ""), g.word("ending", "Ends"), g.word("status", "They are")]);
    return out + k.caption(`${v("first")} meets ${v("second")}`);
  });

  /* ======================= politeWar ======================= */
  const WEAPON = ["💐", "🎁", "🤲", "💸", "📅"];
  look("politeWar", (v, k, g) => {
    const ven = v.n("venom");
    const we = idx(v, "weapon", 5);
    const rd = Math.round(v.n("rounds"));
    const cr = idx(v, "crowd", 4);
    const wi = idx(v, "winner", 4);
    const sn = idx(v, "snap", 3);
    let out = stage(k, { spot: 160 });
    const fight = sn === 2;
    out += guy(k, 110, { s: 0.9, color: S.purple, look: 1, mood: fight ? -0.9 : 0.8, arms: fight ? 0.9 : 0.2, lean: fight ? 10 : 0 });
    out += guy(k, 210, { s: 0.9, color: S.green, look: -1, mood: fight ? -0.9 : 0.8, arms: fight ? 0.9 : 0.2, lean: fight ? -10 : 0 });
    /* the sweet thing they hand over, with poison dripping by venom */
    out += k.text({ x: 160, y: 50, text: WEAPON[we], size: 18 });
    for (let i = 0; i < Math.round(ven); i++) out += `<path d="M${152 + i * 4} 56 q-2 5 0 ${6 + i} q2 -3 0 -${6 + i} Z" fill="${S.green}" opacity="0.8"/>`;
    out += k.bubble({ x: 160, y: 18, w: 100, h: 18, text: fight ? "#@!%!" : "how lovely.", size: 9, tail: 0 });
    /* the score: rounds as tallies */
    for (let i = 0; i < rd; i++) out += `<line x1="${14 + i * 7}" y1="92" x2="${14 + i * 7}" y2="104" stroke="${S.gold}" stroke-width="2"/>`;
    /* who notices */
    out += heads(k, [0, 0, 1, 8][cr], 248, 80, 60, { r: 4, color: "#c9b49a" });
    if (cr === 1) out += k.label({ x: 280, y: 90, text: "only us 👁", size: 8, color: "#ccc" });
    /* the winner */
    out += k.label({ x: [110, 210, 160, 290][wi], y: 30, text: wi === 2 ? "=" : "🏆", size: 12, color: S.gold });
    if (sn === 1) out += k.label({ x: 160, y: 90, text: "one snap", size: 8, color: S.red });
    out += strip(k, [g.num("venom", "Venom", " of 5", S.green), g.word("weapon", "Weapon"), g.num("rounds", "Rounds", ""), g.steps("crowd", "Noticed by"), g.word("winner", "Winner"), g.steps("snap", "Snaps", S.red)]);
    return out + k.caption(`${rd} rounds of ${v("weapon")}`);
  });

  /* ======================= crossedTalk ======================= */
  const LINES_A = ["...needs to lose weight", "...it's terminal", "...we must cut back"];
  const LINES_B = ["...and the cake?", "...the wedding's on!", "...yes, darling"];
  look("crossedTalk", (v, k, g) => {
    const cx = v.n("cross");
    const how = idx(v, "how", 4);
    const top = idx(v, "topics", 4);
    const pace = idx(v, "pace", 4);
    const aw = idx(v, "aware", 3);
    const la = idx(v, "land", 4);
    let out = stage(k);
    /* two pairs; how they are joined */
    out += guy(k, 40, { s: 0.75, color: S.blue, look: 1, mood: top === 3 ? -0.6 : 0.1 }) + guy(k, 90, { s: 0.75, color: S.grey, look: -1 });
    out += guy(k, 230, { s: 0.75, color: S.orange, look: 1, mood: 0.4 }) + guy(k, 280, { s: 0.75, color: S.pink, look: -1, mood: aw === 2 ? -0.5 : 0.3 });
    if (how === 3) out += `<rect x="156" y="20" width="8" height="${FY - 20}" fill="#5c5160" stroke="${S.ink}"/>`;
    if (how === 2) out += `<line x1="160" y1="10" x2="160" y2="${FY}" stroke="${S.ice}" stroke-dasharray="4 3"/>` + k.label({ x: 160, y: 8, text: "✂", size: 10, color: S.ice });
    if (how === 1) out += k.label({ x: 60, y: 20, text: "📞", size: 12 });
    /* the interleaved lines: how many pairs, how far they reach across */
    const n = [1, 2, 3, 4][pace];
    for (let i = 0; i < n; i++) {
      const y = 22 + i * 15;
      out += k.label({ x: 70, y, text: LINES_A[i % 3], size: 7, color: ["#dde", "#cfe0ff", "#ffd0a0", "#ff9a8a"][top], anchor: "middle" });
      out += k.label({ x: 250, y: y + 7, text: LINES_B[i % 3], size: 7, color: "#fde", anchor: "middle" });
      if (cx > 0) out += k.arrow({ x1: 120, y1: y - 2, x2: 120 + cx * 12, y2: y + 4, color: S.gold, w: 1.2 });
    }
    if (aw === 1) out += k.label({ x: 280, y: 30, text: "!?", size: 10, color: S.gold });
    if (aw === 2) out += k.arrow({ x1: 250, y1: 96, x2: 110, y2: 96, color: S.red, w: 1.5 });
    out += chip(k, 160, 108, ["just funny", "sounds rude", "secret out", "fight worse"][la], ["#333", "#4a3a20", "#3a2a4a", "#4a2a2a"][la], "middle");
    out += strip(k, [g.num("cross", "Cross", " of 5"), g.word("how", "How"), g.steps("topics", "Topics"), g.steps("pace", "Switch"), g.word("aware", "Noticed"), g.word("land", "Does")]);
    return out + k.caption(`Two talks, ${v("pace")} · ${v("land")}`);
  });

  /* ======================= tooManyCooks ======================= */
  const PROB = ["💧", "🚪", "🔥", "⚙️", "🤒", "🔑"];
  look("tooManyCooks", (v, k, g) => {
    const wo = v.n("worse");
    const hp = Math.round(v.n("helpers"));
    const pr = idx(v, "problem", 6);
    const cl = idx(v, "clash", 4);
    const ld = idx(v, "leader", 4);
    const fx = idx(v, "fixed", 4);
    let out = stage(k);
    /* the problem, bigger as they make it worse */
    out += k.text({ x: 160, y: 70, text: PROB[pr], size: 14 + wo * 6 });
    if (wo >= 3) out += burst(k, 160, 50, 10 + wo * 4, S.red).replace("<polygon", `<polygon opacity="0.35"`);
    /* the helpers around it */
    for (let i = 0; i < hp; i++) {
      const x = 20 + (i % 5) * 26 + (i >= 5 ? 180 : 0);
      const boss = (ld === 1) || (ld === 3 && i === 0);
      out += guy(k, x + (i < 5 ? 0 : -60), { s: 0.55, color: i === hp - 1 && fx === 2 ? S.green : S.orange, arms: 0.7, mood: -0.3, lean: (i % 2 ? -8 : 8) });
      if (boss) out += k.label({ x: x + (i < 5 ? 0 : -60), y: 46, text: "👑", size: 8 });
    }
    if (ld === 2) out += k.label({ x: 300, y: 40, text: "🤫", size: 10 });
    /* how they clash */
    out += k.label({ x: 160, y: 18, text: ["⇄ in the way", "↺ undo", "🗯️ arguing", "💥 new breaks"][cl], size: 10, color: "#ddd" });
    if (cl === 3) out += k.label({ x: 120, y: 98, text: "💥", size: 10 }) + k.label({ x: 200, y: 98, text: "💥", size: 10 });
    out += chip(k, 300, 108, ["not fixed", "by accident", "quiet one", "fixed itself"][fx], ["#4a2a2a", "#4a3a20", "#2f4a36", "#2c3346"][fx], "end");
    out += strip(k, [g.num("worse", "Worse", " of 5", S.red), g.num("helpers", "Helpers", ""), g.word("problem", "Problem"), g.word("clash", "Clash"), g.word("leader", "In charge"), g.word("fixed", "Fixed")]);
    return out + k.caption(`${hp} helpers, ${v("problem")}`);
  });

  /* ======================= genreSwap ======================= */
  const GENRE = [
    { bg: "#0b0b12", t: "👻", c: "#8a1f1f" },
    { bg: "#4a3218", t: "🤠", c: "#e8b060" },
    { bg: "#2a2e22", t: "🪖", c: "#7a8a5a" },
    { bg: "#1f3a24", t: "🦁", c: "#9fd38a" },
    { bg: "#141a2a", t: "💰", c: "#c9b26b" },
    { bg: "#2a2420", t: "⚖️", c: "#c9b49a" },
    { bg: "#13283a", t: "🏆", c: "#ffd166" },
  ];
  const MOMENT = ["🧺", "🍝", "📺", "🎲", "🛒"];
  look("genreSwap", (v, k, g) => {
    const sw = v.n("swap");
    const ge = GENRE[idx(v, "genre", 7)];
    const mo = idx(v, "moment", 5);
    const to = idx(v, "tools", 4);
    const len = v.n("length");
    const sn = idx(v, "snap", 4);
    let out = stage(k, { bg: k.mix(S.bg, ge.bg, k.clamp(sw / 5, 0, 1)) });
    /* the everyday thing, framed like the other film */
    out += k.text({ x: 160, y: 80, text: MOMENT[mo], size: 26 });
    out += guy(k, 90, { s: 0.85, color: S.orange, look: 1, lean: sw * 1.5, mood: -0.2 }) + guy(k, 230, { s: 0.85, color: S.blue, look: -1, lean: -sw * 1.5, mood: -0.2 });
    /* tools borrowed: music, then camera (letterbox), then lines, then a title */
    if (to >= 0) out += k.label({ x: 20, y: 20, text: "♪", size: 14, color: ge.c, anchor: "start" });
    if (to >= 1) out += k.letterbox(0.25);
    if (to >= 2) out += k.bubble({ x: 160, y: 34, w: 86, h: 16, text: "this town...", size: 8, tail: 60 });
    if (to >= 3) out += k.text({ x: 160, y: 22, text: ge.t + " THE REMOTE", size: 11, color: ge.c, weight: 900 });
    out += k.text({ x: 296, y: 30, text: ge.t, size: 16 });
    /* how long, and how we snap back */
    out += stopwatch(k, 16, 100, 70, len, 120, ge.c, `${fmt(len)} s`);
    out += chip(k, 300, 108, ["ends", "✂ hard cut", "“are we in a film?”", "stays"][sn], "#33323d", "end");
    out += strip(k, [g.num("swap", "Swap", " of 5"), g.word("genre", "Like a"), g.word("moment", "Moment"), g.steps("tools", "Borrowed"), g.num("length", "Lasts", " s", S.ice), g.word("snap", "Back by")]);
    return out + k.caption(`${v("moment")} shot like a ${v("genre")}`);
  });

  /* ======================= farceCollision ======================= */
  const PLACE = ["🍽️", "🏨", "💒", "🏥", "🏠"];
  look("farceCollision", (v, k, g) => {
    const co = v.n("collide");
    const th = Math.round(v.n("threads"));
    const pl = idx(v, "place", 5);
    const dr = Math.round(v.n("doors"));
    const ju = idx(v, "juggler", 4);
    const bu = idx(v, "blowUp", 4);
    let out = stage(k);
    /* the doors along the back wall */
    const dw = Math.min(30, 300 / dr - 6);
    for (let i = 0; i < dr; i++) out += door(k, 10 + i * (300 / dr), dw, 56, i % 2 ? 0.8 : 0.1);
    out += k.label({ x: 300, y: 18, text: PLACE[pl], size: 14 });
    /* the problems: people converging on the middle, closer as they collide */
    const cols = [S.red, S.pink, S.purple, S.green, S.ice, S.gold, S.grey, S.orange];
    for (let i = 0; i < th; i++) {
      const side = i % 2 ? 1 : -1;
      const far = 40 + (5 - co) * 18 + Math.floor(i / 2) * 22;
      out += guy(k, 160 + side * far, { s: 0.6, color: cols[i], look: -side, walk: 0.6, mood: -0.2 });
    }
    /* the juggler in the middle */
    if (ju !== 0) out += guy(k, 160, { s: 0.75, color: ju === 2 ? S.ink : S.orange, arms: 0.9, mood: -0.4 }) + sweat(k, 168, 44, 3);
    if (ju === 3) out += k.label({ x: 160, y: 28, text: "⇄", size: 12, color: S.gold });
    if (ju === 0) out += k.label({ x: 160, y: 50, text: "?", size: 16, color: "#888" });
    /* how it ends */
    out += [k.label({ x: 160, y: 104, text: "...it holds", size: 8, color: S.green }), chip(k, 160, 104, "one comes out", "#4a3a20", "middle"), burst(k, 160, 22, 16, S.red, "ALL", 8), motion(k, 300, 90, 3, 30, 1) + k.label({ x: 260, y: 104, text: "chase →", size: 8, color: S.gold })][bu];
    out += strip(k, [g.num("collide", "Collide", " of 5", S.red), g.num("threads", "Problems", ""), g.word("place", "Where"), g.num("doors", "Doors", ""), g.word("juggler", "Juggler"), g.steps("blowUp", "Ends", S.red)]);
    return out + k.caption(`${th} problems, ${dr} doors · ${v("blowUp")}`);
  });

  /* ======================= copycat ======================= */
  const COPY = ["🚶", "🗣️", "👕", "☕", "😂", "🪞"];
  look("copycat", (v, k, g) => {
    const cp = v.n("copy");
    const wh = idx(v, "what", 6);
    const why = idx(v, "why", 5);
    const late = idx(v, "late", 4);
    const ac = idx(v, "accuracy", 4);
    const no = idx(v, "noticed", 3);
    let out = stage(k);
    /* the original: arms up */
    out += guy(k, 110, { s: 0.95, color: S.blue, arms: 0.7, lean: 6, mood: no === 1 ? -0.6 : 0.4, look: no ? 1 : -1 });
    /* the copier: arms closer to the original's as accuracy grows, delayed by lateness */
    const arms = [-0.4, 0.1, 0.5, 0.7][ac];
    out += guy(k, 190 + late * 16, { s: 0.85, color: S.orange, arms, lean: [-6, 0, 4, 6][ac], mood: 0.5, look: -1 });
    out += k.label({ x: 190 + late * 16, y: 20, text: COPY[wh], size: 14 });
    out += k.label({ x: 110, y: 20, text: COPY[wh], size: 14 });
    /* the lag, as a dashed line */
    out += `<line x1="122" y1="60" x2="${r1(178 + late * 16)}" y2="60" stroke="${S.gold}" stroke-dasharray="3 3"/>` + k.label({ x: 150, y: 54, text: ["same time", "½ beat", "1 beat", "next day"][late], size: 7, color: S.gold });
    /* how much they copy: a stack of copied habits */
    for (let i = 0; i < Math.round(cp); i++) out += `<rect x="${270}" y="${FY - 8 - i * 9}" width="30" height="7" rx="2" fill="${S.orange}" opacity="0.8"/>`;
    /* why */
    out += chip(k, 40, 30, ["fit in", "impress", "mock", "love", "by accident"][why], "#33323d", "middle");
    if (no === 2) out += k.arrow({ x1: 160, y1: 90, x2: 128, y2: 90, color: S.blue, w: 1.5 }) + k.arrow({ x1: 160, y1: 98, x2: 192, y2: 98, color: S.orange, w: 1.5 });
    out += strip(k, [g.num("copy", "Copies", " of 5", S.orange), g.word("what", "What"), g.word("why", "Why"), g.steps("late", "Behind"), g.steps("accuracy", "How well"), g.word("noticed", "Other one")]);
    return out + k.caption(`Copies ${v("what")}, ${v("late")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
