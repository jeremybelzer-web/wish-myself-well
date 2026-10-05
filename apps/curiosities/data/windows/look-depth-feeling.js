/* look for the feeling-over-time curiosities in data/db-depth-feeling.js (depth thread, feeling): the live picture
   at the top of each window. Same house style as look-heart-comedy.js: a stage on top (y 0 to 120) that acts out
   the feeling, a strip of small labelled gauges below it, and a caption. Colors: gold = the feeling itself, blue =
   calm or held in, red = anger or a blow, grey = numb or empty, green = comfort or relief, pink = warmth or love,
   purple = what is left unsaid. Every own setting moves something of its own. */
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

  /* ======================= shockNumb ======================= */
  /* One person in a grey fog. The line on top is the sound of the world: full, muffled, ringing or flat. */
  const DOING = ["frozen", "a chore", "\"Where did I park?\"", "an odd laugh", "walks off"];
  look("shockNumb", (v, k, g) => {
    const nb = v.n("numb");
    const sh = idx(v, "shock", 5);
    const ls = idx(v, "lasts", 4);
    const sd = idx(v, "sound", 4);
    const dg = idx(v, "doing", 5);
    const br = idx(v, "breaks", 5);
    let out = stage(k);
    out += k.wave({ x: 20, y: 6, w: 280, h: 18, amp: [0.9, 0.3, 0.15, 0][sd], cycles: [6, 3, 30, 1][sd], color: sd === 2 ? S.red : S.grey });
    const px = dg === 4 ? 210 : 150;
    out += guy(k, px, { s: 1.05, color: S.blue, mood: dg === 3 ? 0.5 : 0, arms: dg === 1 ? 0.4 : dg === 0 ? -0.6 : 0, walk: dg === 4 ? 0.8 : 0, eyes: 1 - nb * 0.15 });
    out += `<rect x="0" y="0" width="320" height="${FY}" fill="${S.grey}" opacity="${r1(nb * 0.07 * 100) / 100}"/>`;
    out += chip(k, 14, 44, ["bad news", "an accident", "a death", "a betrayal", "violence"][sh], S.red);
    out += chip(k, px, 40, DOING[dg], "#33323d", "middle");
    out += marks(k, 14, 100, 90, 4, ls + 1, S.grey);
    if (br > 0) out += k.arrow({ x1: 300, y1: 70, x2: px + 22, y2: 70, color: S.gold, w: 2 }) + chip(k, 306, 60, ["", "a touch", "an object", "a sound", "their tears"][br], S.green, "end");
    out += strip(k, [g.num("numb", "Numb", "", S.grey), g.word("shock", "The shock"), g.steps("lasts", "Lasts", S.grey), g.steps("sound", "Sound"), g.word("doing", "Doing"), g.word("breaks", "Broken by")]);
    return out + k.caption(`numb after ${v("shock")}, ${v("doing")}`);
  });

  /* ======================= delayedReaction ======================= */
  /* A timeline: the big moment on the left stays dry, the feeling lands later on the right, further the later it is. */
  const WHERE = ["🚗 car", "🚿 shower", "🛒 shops", "💼 work", "🛏️ bed"];
  look("delayedReaction", (v, k, g) => {
    const dl = v.n("delay");
    const gp = idx(v, "gap", 4);
    const wh = idx(v, "where", 5);
    const tr = idx(v, "trigger", 5);
    const sz = idx(v, "size", 4);
    const sn = idx(v, "seen", 3);
    let out = stage(k);
    out += `<line x1="20" y1="30" x2="300" y2="30" stroke="#555" stroke-width="2"/>`;
    out += k.dot({ x: 30, y: 30, r: 5, color: S.blue }) + k.label({ x: 20, y: 20, text: "the big moment", size: 8, color: "#aaa", anchor: "start" });
    const lx = 70 + dl * 30 + gp * 12;
    out += k.dot({ x: lx, y: 30, r: 4 + sz * 2.5, color: S.gold }) + k.label({ x: lx, y: 18 - sz, text: ["minutes", "hours", "days", "weeks"][gp] + " later", size: 8, color: S.gold });
    out += guy(k, 60, { s: 0.85, color: S.blue, mood: 0 });
    out += guy(k, lx, { s: 0.85, color: S.blue, mood: -0.4 - sz * 0.15, arms: sz === 3 ? 0.9 : 0.1 });
    for (let i = 0; i < sz + 1; i++) out += k.dot({ x: lx + 5 + i * 3, y: FY - 60 + i * 5, r: 1.6, color: "#9fd3ff" });
    out += chip(k, lx, 50, WHERE[wh], "#33323d", "middle");
    out += chip(k, 300, 100, ["nothing", "a song", "an object", "a kindness", "a chore"][tr], S.purple, "end");
    if (sn > 0) out += guy(k, Math.min(300, lx + 40), { s: 0.7, color: sn === 2 ? S.pink : S.grey, look: -1, alpha: 0.8 });
    out += strip(k, [g.num("delay", "How late"), g.steps("gap", "Story time"), g.word("where", "Where"), g.word("trigger", "Set off by", S.purple), g.steps("size", "How hard"), g.steps("seen", "Seen by", S.pink)]);
    return out + k.caption(`it hits ${["minutes", "hours", "days", "weeks"][gp]} later, ${v("where")}`);
  });

  /* ======================= displacedFeeling ======================= */
  /* The person who caused it stands on the left; the arrow of feeling bends away to land on something else. */
  const FEEL_COL = [S.red, S.blue, S.purple, S.orange];
  const TARGET = ["🚪", "🧑", "🐕", "🫂", "🪞"];
  look("displacedFeeling", (v, k, g) => {
    const mp = v.n("misplaced");
    const fe = idx(v, "feeling", 4);
    const tg = idx(v, "target", 5);
    const wy = idx(v, "why", 4);
    const sz = idx(v, "size", 4);
    const rz = idx(v, "realize", 3);
    let out = stage(k);
    out += guy(k, 40, { s: wy === 0 ? 1.2 : 0.9, color: S.grey, alpha: wy === 1 ? 0.35 : 1 });
    out += k.label({ x: 40, y: 12, text: "the cause", size: 8, color: "#aaa" });
    out += guy(k, 150, { s: 1, color: S.blue, mood: -0.6, arms: 0.2 + sz * 0.2, look: 1 });
    const tx = 150 + 30 + mp * 26;
    out += `<path d="M162 60 Q${r1((162 + tx) / 2)} ${r1(30 - mp * 4)} ${r1(tx)} 70" fill="none" stroke="${FEEL_COL[fe]}" stroke-width="${2 + sz}"/>`;
    out += k.text({ x: tx, y: 92, text: TARGET[tg], size: 20 });
    out += `<line x1="140" y1="62" x2="${r1(140 - (5 - mp) * 18)}" y2="62" stroke="${FEEL_COL[fe]}" stroke-dasharray="3 3" opacity="0.5"/>`;
    out += chip(k, 74, 18, ["too powerful", "gone", "loved", "won't admit it"][wy], "#33323d");
    if (sz === 3) out += k.text({ x: tx + 14, y: 70, text: "💥", size: 14 });
    out += chip(k, 306, 18, ["never sees it", "sees it later", "sees it now"][rz], rz ? S.green : S.grey, "end");
    out += strip(k, [g.num("misplaced", "Off target", "", FEEL_COL[fe]), g.word("feeling", "Feeling"), g.word("target", "Lands on"), g.word("why", "Why"), g.steps("size", "Outburst", S.red), g.steps("realize", "Sees it", S.green)]);
    return out + k.caption(`${v("feeling")} at ${v("target")}, not at the one who caused it`);
  });

  /* ======================= keepsake ======================= */
  const THING = ["🧥", "⌚", "✉️", "🖼️", "🧸", "📼"];
  look("keepsake", (v, k, g) => {
    const ch = v.n("charge");
    const th = idx(v, "thing", 6);
    const sf = idx(v, "standsFor", 5);
    const hd = idx(v, "handling", 5);
    const ft = idx(v, "fate", 5);
    const sn = v.n("seen");
    let out = stage(k);
    /* the further they push it away, the further the object sits from them */
    const ox = 230 - hd * 22;
    out += guy(k, 110, { s: 1, color: S.blue, mood: -0.2, arms: hd >= 2 ? 0.3 : -0.2, look: 1 });
    out += glow(ox, 76, 6 + ch * 5, S.gold, 0.15 + ch * 0.06);
    out += k.text({ x: ox, y: 84, text: THING[th], size: 22, alpha: ft === 2 ? 0.4 : 1 });
    out += chip(k, 220, 20, "stands for " + ["someone gone", "someone far", "happier days", "a promise", "a mistake"][sf], S.purple, "middle");
    out += k.label({ x: 300, y: 44, text: ["kept", "given away", "lost", "destroyed", "buried"][ft], size: 9, color: ft === 0 ? S.green : S.red, anchor: "end" });
    out += marks(k, 14, 14, 100, 8, sn, S.gold);
    out += strip(k, [g.num("charge", "Feeling held"), g.word("thing", "The thing"), g.word("standsFor", "Stands for", S.purple), g.steps("handling", "Treated"), g.word("fate", "In the end"), g.num("seen", "Seen", "x")]);
    return out + k.caption(`${v("thing")} that stands for ${v("standsFor")}`);
  });

  /* ======================= bigFeelingSmall ======================= */
  /* The big glow is the feeling underneath; the small dot is how much shows on the surface. */
  look("bigFeelingSmall", (v, k, g) => {
    const rs = v.n("restraint");
    const bg = idx(v, "bigness", 4);
    const fm = idx(v, "form", 5);
    const qb = v.n("quietBefore");
    const mu = idx(v, "music", 4);
    const sv = idx(v, "savedFor", 3);
    let out = stage(k);
    out += glow(160, 60, 20 + bg * 10, S.gold, 0.12);
    out += glow(160, 60, Math.max(3, 40 - rs * 7), S.gold, 0.6);
    out += guy(k, 130, { s: 1, color: S.blue, mood: 0.2, look: 1, arms: fm === 2 ? 0.5 : -0.2, lean: fm === 4 ? -10 : 0 });
    out += guy(k, 190, { s: 1, color: S.pink, mood: 0.1, look: -1 });
    out += chip(k, 160, 18, ["a whisper", "a long look", "a single touch", "a tiny nod", "a turn away"][fm], "#33323d", "middle");
    out += `<rect x="14" y="98" width="${r1(qb * 10)}" height="6" fill="${S.blue}"/>` + k.label({ x: 14, y: 94, text: "quiet", size: 7, color: "#888", anchor: "start" });
    out += k.wave({ x: 220, y: 8, w: 90, h: 16, amp: [0.9, 0.4, 0.05, 0][mu], cycles: 5, color: S.purple });
    out += marks(k, 220, 100, 90, 3, sv + 1, S.gold);
    out += strip(k, [g.num("restraint", "Played small"), g.steps("bigness", "Real size"), g.word("form", "Shows as"), g.num("quietBefore", "Quiet", " s", S.blue), g.steps("music", "Music", S.purple), g.steps("savedFor", "Saved")]);
    return out + k.caption(`a ${["mild", "strong", "huge", "life changing"][bg]} feeling, shown as ${v("form")}`);
  });

  /* ======================= slowBurn ======================= */
  /* The feeling climbs in steps across the film, with dips for setbacks and a star where it is finally said. */
  const BURN_COL = [S.pink, S.green, S.purple, S.red, S.gold];
  look("slowBurn", (v, k, g) => {
    const gr = v.n("growth");
    const fe = idx(v, "feeling", 5);
    const st = v.n("steps");
    const sb = idx(v, "setback", 4);
    const ad = idx(v, "admitted", 4);
    const fs = idx(v, "firstSign", 4);
    let out = stage(k, { floor: S.bg });
    const n = Math.max(2, Math.round(st));
    const x0 = 20;
    const w = 280;
    let d = "";
    for (let i = 0; i <= n; i++) {
      let h = (i / n) * gr * 16;
      if (sb > 0 && i % Math.max(2, 6 - sb * 2) === 0 && i > 0 && i < n) h -= 8;
      d += `${i ? "L" : "M"}${r1(x0 + (w * i) / n)} ${r1(100 - Math.max(0, h))}`;
    }
    out += `<path d="${d}" fill="none" stroke="${BURN_COL[fe]}" stroke-width="2.5"/>`;
    if (ad < 3) out += k.text({ x: x0 + w * [0.2, 0.5, 0.85][ad], y: 24, text: "★", size: 14, color: S.gold });
    else out += k.label({ x: 300, y: 24, text: "never said", size: 8, color: "#888", anchor: "end" });
    out += chip(k, 20, 18, ["a long look", "a small favor", "a shared joke", "a worried glance"][fs], "#33323d");
    out += strip(k, [g.num("growth", "Grows", "", BURN_COL[fe]), g.word("feeling", "Feeling"), g.num("steps", "Scenes"), g.steps("setback", "Setbacks", S.red), g.steps("admitted", "Said"), g.word("firstSign", "First sign")]);
    return out + k.caption(`${v("feeling")} grows over ${n} scenes, said ${v("admitted")}`);
  });

  /* ======================= comeDown ======================= */
  /* A high peak, then the feeling drains off to the right; what is left sits at the bottom. */
  look("comeDown", (v, k, g) => {
    const dp = v.n("drop");
    const af = idx(v, "after", 5);
    const sp = idx(v, "speed", 4);
    const lf = idx(v, "leftover", 5);
    const sg = idx(v, "sign", 4);
    const al = idx(v, "alone", 4);
    let out = stage(k);
    const peakX = 60;
    const endY = 30 + dp * 12;
    const fallX = peakX + 200 - sp * 55;
    out += `<path d="M20 90 L${peakX} 26 L${r1(fallX)} ${r1(endY)} L300 ${r1(endY)}" fill="none" stroke="${S.gold}" stroke-width="2.5"/>`;
    out += k.label({ x: peakX, y: 20, text: ["a win", "a party", "a first kiss", "a reunion", "a big laugh"][af], size: 8, color: S.gold });
    out += k.label({ x: 300, y: endY - 5, text: ["a warm glow", "quiet calm", "emptiness", "regret", "dread"][lf], size: 8, color: [S.gold, S.blue, S.grey, S.purple, S.red][lf], anchor: "end" });
    const people = [4, 3, 2, 1][al];
    for (let i = 0; i < people; i++) out += guy(k, 200 + i * 24, { s: 0.7, color: i ? S.grey : S.blue, mood: 0.3 - dp * 0.15 });
    out += k.text({ x: 140, y: 108, text: ["🪑", "🎉", "🔇", "🧍"][sg], size: 16 });
    out += strip(k, [g.num("drop", "Falls"), g.word("after", "After"), g.steps("speed", "Drains"), g.word("leftover", "Left"), g.word("sign", "Shown by"), g.steps("alone", "Who's there", S.blue)]);
    return out + k.caption(`after ${v("after")}, ${v("leftover")} is left`);
  });

  /* ======================= moodOutOfStep ======================= */
  const MOOD = { joy: 0.9, calm: 0.3, panic: -0.6, grief: -0.9, excitement: 0.7, sadness: -0.7, fear: -0.5, anger: -0.8 };
  look("moodOutOfStep", (v, k, g) => {
    const os = v.n("offStep");
    const rm = v("roomMood");
    const tm = v("theirMood");
    const hd = idx(v, "hides", 3);
    const nb = idx(v, "noticedBy", 3);
    const en = idx(v, "ends", 4);
    let out = stage(k);
    const room = MOOD[rm] == null ? 0 : MOOD[rm];
    const theirs = MOOD[tm] == null ? 0 : MOOD[tm];
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 30 + (i > 2 ? 90 : 0);
      const looks = (nb === 2 || (nb === 1 && i === 0)) ? (x < 160 ? 1 : -1) : 0;
      out += guy(k, x, { s: 0.75, color: S.grey, mood: en === 1 ? theirs : room, look: looks, arms: room > 0.5 ? 0.7 : 0 });
    }
    const mx = en === 0 ? 290 : 160;
    out += glow(mx, 66, 10 + os * 5, S.gold, 0.25);
    out += guy(k, mx, { s: 0.95, color: S.gold, mood: hd === 2 ? room * 0.5 : en === 2 ? room : theirs, lean: os * 2 });
    out += chip(k, 14, 18, "room: " + rm, "#33323d");
    out += chip(k, 306, 18, "them: " + tm, S.orange, "end");
    out += strip(k, [g.num("offStep", "Out of step"), g.word("roomMood", "Room"), g.word("theirMood", "Them", S.orange), g.steps("hides", "Hides it"), g.steps("noticedBy", "Noticed by"), g.word("ends", "Ends")]);
    return out + k.caption(`${tm} in a room of ${rm}`);
  });

  /* ======================= emotionSeesaw ======================= */
  /* A seesaw between two people; the plank tilts more the more fully they swap. */
  look("emotionSeesaw", (v, k, g) => {
    const sw = v.n("swap");
    const wt = idx(v, "what", 4);
    const wh = idx(v, "when", 3);
    const tr = idx(v, "trigger", 5);
    const tm = v.n("times");
    const aw = idx(v, "aware", 3);
    let out = stage(k);
    const tilt = (sw - 2.5) * 5;
    out += `<path d="M150 ${FY} L160 ${FY - 14} L170 ${FY} Z" fill="${S.wood}"/>`;
    out += `<g transform="rotate(${r1(tilt)} 160 ${FY - 14})"><rect x="60" y="${FY - 18}" width="200" height="5" fill="${S.wood}"/>` + guy(k, 80, { y: FY - 18, s: 0.7, color: S.blue, mood: sw / 5 - 0.4, look: aw === 2 ? 1 : 0 }) + guy(k, 240, { y: FY - 18, s: 0.7, color: S.pink, mood: 0.4 - sw / 5, look: aw >= 1 ? -1 : 0 }) + `</g>`;
    const pair = [["calm", "panic"], ["hope", "doubt"], ["anger", "guilt"], ["strength", "fear"]][wt];
    out += k.label({ x: 80, y: 22, text: pair[sw >= 2.5 ? 1 : 0], size: 10, color: S.blue, weight: 700 }) + k.label({ x: 240, y: 22, text: pair[sw >= 2.5 ? 0 : 1], size: 10, color: S.pink, weight: 700 });
    out += `<line x1="110" y1="34" x2="210" y2="34" stroke="#555"/>` + k.dot({ x: 110 + [15, 50, 85][wh], y: 34, r: 4, color: S.gold });
    out += chip(k, 160, 52, ["a confession", "bad news", "a joke", "a touch", "a mistake"][tr], "#33323d", "middle");
    out += marks(k, 130, 8, 60, 4, tm, S.gold, 4);
    out += strip(k, [g.num("swap", "Swap"), g.word("what", "What swaps"), g.steps("when", "Tips"), g.word("trigger", "Tipped by"), g.num("times", "Times", "x"), g.steps("aware", "Notice it", S.pink)]);
    return out + k.caption(`${pair[0]} and ${pair[1]} change hands`);
  });

  /* ======================= comfortOffered ======================= */
  look("comfortOffered", (v, k, g) => {
    const tk = v.n("taken");
    const wy = idx(v, "way", 5);
    const gv = idx(v, "giver", 4);
    const tm = idx(v, "timing", 3);
    const fr = idx(v, "first", 3);
    const af = idx(v, "after", 5);
    let out = stage(k);
    const gap = 90 - tk * 14;
    const gx = 160 - gap / 2;
    const rx = 160 + gap / 2;
    out += guy(k, gx, { s: 1, color: [S.green, S.pink, S.grey, S.red][gv], mood: 0.3, look: 1, arms: wy === 1 || wy === 2 ? 0.5 : 0 });
    out += guy(k, rx, { s: 1, color: S.blue, mood: -0.5 + tk * 0.15, look: fr === 0 ? 1 : -1, lean: [12, 0, -10][fr] });
    out += glow(160, 70, 8 + tk * 6, S.green, 0.2);
    out += chip(k, 160, 18, ["words", "a hand", "a hug", "sitting close", "food"][wy], S.green, "middle");
    out += `<line x1="20" y1="40" x2="100" y2="40" stroke="#555"/>` + k.dot({ x: 20 + tm * 40, y: 40, r: 4, color: tm === 1 ? S.green : S.orange });
    out += k.label({ x: 300, y: 40, text: "then: " + ["a fight", "silence", "tears", "a laugh", "talking"][af], size: 9, color: "#ddd", anchor: "end" });
    out += strip(k, [g.num("taken", "Taken", "", S.green), g.word("way", "Offered as"), g.word("giver", "From"), g.steps("timing", "Timing"), g.steps("first", "First move", S.green), g.word("after", "Leads to")]);
    return out + k.caption(`${v("way")} from ${v("giver")}: ${v("first")}`);
  });

  /* ======================= unspokenFeeling ======================= */
  /* A family around a table with a purple cloud over it that nobody names. */
  const SIGNS = ["🔀", "🚪", "🪑", "👀", "💬"];
  look("unspokenFeeling", (v, k, g) => {
    const un = v.n("unsaid");
    const ab = idx(v, "about", 5);
    const hm = idx(v, "howMany", 3);
    const sg = idx(v, "signs", 5);
    const sc = v.n("scenes");
    const sd = idx(v, "said", 5);
    let out = stage(k);
    const n = [2, 4, 6][hm];
    out += `<rect x="70" y="${FY - 26}" width="180" height="6" fill="${S.wood}"/>`;
    for (let i = 0; i < n; i++) out += guy(k, 80 + (i * 160) / Math.max(1, n - 1), { s: 0.7, color: S.grey, look: i % 2 ? -1 : 1, mood: -0.2 });
    out += `<ellipse cx="160" cy="30" rx="${r1(30 + un * 12)}" ry="${r1(10 + un * 2)}" fill="${S.purple}" opacity="0.5"/>`;
    out += k.label({ x: 160, y: 34, text: ["a death", "a betrayal", "an illness", "money", "a love"][ab], size: 10, color: "#fff", weight: 700 });
    out += k.text({ x: 20, y: 64, text: SIGNS[sg], size: 16 });
    out += marks(k, 14, 6, 100, 10, Math.round(sc / 3), S.purple, 4);
    if (sd > 0) out += chip(k, 306, 64, "said " + ["", "in a whisper", "in a shout", "by a child", "by an outsider"][sd], S.gold, "end");
    out += strip(k, [g.num("unsaid", "Avoided", "", S.purple), g.word("about", "About"), g.steps("howMany", "Who knows"), g.word("signs", "Shows as"), g.num("scenes", "Scenes"), g.word("said", "Said")]);
    return out + k.caption(`nobody names ${v("about")}${sd ? ", until it is said " + v("said") : ""}`);
  });

  /* ======================= bracing ======================= */
  /* A person before a door, gathering themselves. The rings are the strength they gather. */
  look("bracing", (v, k, g) => {
    const bc = v.n("brace");
    const hw = idx(v, "how", 5);
    const ln = v.n("length");
    const fc = idx(v, "facing", 5);
    const rd = idx(v, "ready", 4);
    const sn = idx(v, "seen", 3);
    let out = stage(k);
    out += `<rect x="230" y="${FY - 70}" width="36" height="70" fill="${S.wood}" stroke="${S.ink}"/>` + k.dot({ x: 236, y: FY - 34, r: 2, color: S.gold });
    out += k.label({ x: 248, y: FY - 76, text: ["bad news", "a fight", "a confession", "a crowd", "an old love"][fc], size: 8, color: S.red });
    for (let i = 0; i < Math.round(bc); i++) out += k.ring({ x: 160, y: 62, r: 14 + i * 7, color: S.blue, w: 1 });
    out += guy(k, 160, { s: 1, color: S.blue, mood: [0.2, 0, -0.3, -0.8][rd], arms: hw === 1 ? 0.6 : hw === 4 ? 0.3 : -0.2, lean: rd === 3 ? 12 : 0, look: 1 });
    out += chip(k, 160, 18, ["a deep breath", "fix clothes", "practice words", "the mirror", "a drink"][hw], "#33323d", "middle");
    out += `<rect x="14" y="100" width="${r1(ln * 3)}" height="5" fill="${S.blue}"/>`;
    if (sn > 0) out += guy(k, sn === 2 ? 290 : 50, { s: 0.7, color: sn === 2 ? S.red : S.green, look: sn === 2 ? -1 : 1, alpha: 0.8 });
    out += strip(k, [g.num("brace", "Bracing", "", S.blue), g.word("how", "How"), g.num("length", "We watch", " s"), g.word("facing", "Facing", S.red), g.steps("ready", "Holds?"), g.steps("seen", "Seen by")]);
    return out + k.caption(`bracing with ${v("how")} before ${v("facing")}`);
  });

  /* ======================= reactionHolder ======================= */
  /* The event on the left, the watching face on the right; the frame shows how close the camera is. */
  look("reactionHolder", (v, k, g) => {
    const aw = v.n("away");
    const wh = idx(v, "who", 6);
    const hd = v.n("hold");
    const sz = idx(v, "size", 4);
    const ev = idx(v, "event", 3);
    const sh = idx(v, "shows", 5);
    let out = stage(k);
    const evAlpha = [1, 0.4, 0.12][ev];
    out += `<g opacity="${evAlpha}">` + guy(k, 50, { s: 0.9, color: S.gold, arms: 0.9, mood: 0.6 }) + k.text({ x: 50, y: 26, text: "★", size: 14, color: S.gold }) + `</g>`;
    if (ev === 1) out += k.text({ x: 80, y: 40, text: "🔊", size: 12 });
    const fx = 120 + aw * 30;
    const MOODS = [0.7, -0.8, -0.6, 0.9, 0];
    const r = [10, 16, 26, 34][sz];
    out += k.face({ x: fx, y: 62, r, mood: MOODS[sh], eyes: sh === 1 ? 1 : 0.8, mouth: sh === 1 ? 0.6 : 0, color: wh === 4 ? "#f6d2b0" : undefined });
    out += k.frame({ x: fx - r - 8, y: 62 - r - 8, w: r * 2 + 16, h: r * 2 + 16, color: S.gold });
    out += k.label({ x: fx, y: FY - 2, text: ["them", "partner", "parent", "friend", "child", "stranger"][wh], size: 9, color: "#ddd" });
    out += `<rect x="200" y="8" width="${r1(hd * 10)}" height="5" fill="${S.gold}"/>`;
    out += strip(k, [g.num("away", "From center"), g.word("who", "Whose face"), g.num("hold", "Held", " s"), g.steps("size", "How close"), g.steps("event", "Event seen"), g.word("shows", "Shows", S.pink)]);
    return out + k.caption(`${v("who")}'s face shows ${v("shows")}`);
  });

  /* ======================= keepingBusy ======================= */
  const TASK = ["🧽", "🍳", "💼", "🔧", "🏃", "📋"];
  look("keepingBusy", (v, k, g) => {
    const bs = v.n("busy");
    const tk = idx(v, "task", 6);
    const pc = idx(v, "pace", 3);
    const st = idx(v, "stops", 4);
    const sc = v.n("scenes");
    const cr = idx(v, "cracks", 3);
    let out = stage(k);
    const copies = 1 + Math.round(bs);
    for (let i = 0; i < copies; i++) out += guy(k, 60 + i * 34, { s: 0.85, color: S.blue, alpha: i === copies - 1 ? 1 : 0.15 + i * 0.08, walk: pc * 0.4, arms: 0.4, mood: cr === 2 && i === copies - 1 ? -0.8 : -0.1 });
    out += k.text({ x: 60 + (copies - 1) * 34 + 18, y: 72, text: TASK[tk], size: 14 });
    for (let i = 0; i < pc + 1; i++) out += `<line x1="${40 - i * 8}" y1="${60 + i * 6}" x2="${50 - i * 8}" y2="${60 + i * 6}" stroke="#666" stroke-width="2"/>`;
    if (st === 1) out += guy(k, 60 + (copies - 1) * 34 + 30, { s: 0.85, color: S.green, look: -1, arms: 0.4 });
    if (st === 3) out += k.text({ x: 300, y: 50, text: "💥", size: 14 });
    if (st === 2) out += k.text({ x: 300, y: 50, text: "✔", size: 14, color: S.green });
    out += marks(k, 200, 8, 110, 10, sc, S.blue, 5);
    if (cr > 0) out += `<path d="M150 14 L156 24 L150 30 L158 40" fill="none" stroke="${S.gold}" stroke-width="${cr * 1.5}"/>`;
    out += strip(k, [g.num("busy", "Busy", "", S.blue), g.word("task", "Task"), g.steps("pace", "Pace"), g.word("stops", "Stopped by"), g.num("scenes", "Scenes"), g.steps("cracks", "Cracks", S.gold)]);
    return out + k.caption(`${v("task")}, ${v("pace")}, so as not to feel`);
  });

  /* ======================= unseenCare ======================= */
  /* The giver behind a wall, out of sight; the gift crosses over to the one who never sees. */
  const ACT = ["🍲", "💵", "🙋", "🔧", "🤐"];
  look("unseenCare", (v, k, g) => {
    const ca = v.n("care");
    const ac = idx(v, "act", 5);
    const fw = idx(v, "forWhom", 5);
    const fd = idx(v, "found", 4);
    const tm = v.n("times");
    const cs = idx(v, "cost", 5);
    let out = stage(k);
    out += `<rect x="150" y="${FY - 80}" width="10" height="80" fill="#3a3842"/>`;
    out += guy(k, 90, { s: 0.95, color: S.pink, look: 1, mood: 0.1, alpha: 1 - cs * 0.12 });
    out += guy(k, 230, { s: [0.95, 0.7, 0.95, 0.95, 0.9][fw], color: [S.grey, S.green, S.blue, S.red, S.orange][fw], look: fd === 0 ? 1 : -1, mood: fd === 2 ? -0.8 : 0.2 });
    out += glow(196, 92, 6 + ca * 4, S.pink, 0.3) + k.text({ x: 196, y: 98, text: ACT[ac], size: 14 });
    for (let i = 0; i < tm; i++) out += k.dot({ x: 20 + i * 12, y: 14, r: 3, color: S.pink });
    out += chip(k, 306, 20, ["never found", "by accident", "too late", "at the end"][fd], fd === 2 ? S.red : "#33323d", "end");
    out += strip(k, [g.num("care", "Hidden act", "", S.pink), g.word("act", "Act"), g.word("forWhom", "For"), g.word("found", "Found"), g.num("times", "Times", "x"), g.steps("cost", "Costs", S.red)]);
    return out + k.caption(`they ${v("act")} for ${v("forWhom")}, found ${v("found")}`);
  });

  /* ======================= emptyPlace ======================= */
  const PLACE = ["🪑", "🛏️", "🧥", "🚗", "👞"];
  look("emptyPlace", (v, k, g) => {
    const ab = v.n("absence");
    const pl = idx(v, "place", 5);
    const gn = idx(v, "gone", 4);
    const hb = idx(v, "habit", 4);
    const sh = v.n("shown");
    const fl = idx(v, "filled", 4);
    let out = stage(k);
    out += `<rect x="40" y="${FY - 26}" width="240" height="6" fill="${S.wood}"/>`;
    out += guy(k, 70, { s: 0.75, color: S.blue, mood: -0.3, look: 1 }) + guy(k, 120, { s: 0.75, color: S.pink, mood: -0.3, look: 1 });
    out += `<rect x="170" y="0" width="80" height="${FY}" fill="${S.grey}" opacity="${r1(ab * 0.05 * 100) / 100}"/>`;
    if (fl === 1) out += guy(k, 210, { s: 0.65, color: S.green });
    else if (fl === 2) out += guy(k, 210, { s: 0.75, color: S.gold, mood: 0.6 });
    else if (fl === 3) out += k.text({ x: 210, y: 84, text: "🌷", size: 18 });
    else out += k.text({ x: 210, y: 92, text: PLACE[pl], size: 22, alpha: 0.9 });
    if (hb > 0) out += k.text({ x: 210, y: FY - 30, text: ["", "🍽️", "☕", "📞"][hb], size: 12 });
    out += k.label({ x: 300, y: 18, text: ["died", "left", "away", "lost"][gn], size: 9, color: "#bbb", anchor: "end" });
    out += marks(k, 14, 10, 120, 8, sh, S.grey);
    out += strip(k, [g.num("absence", "Felt", "", S.grey), g.word("place", "Empty"), g.word("gone", "Gone"), g.word("habit", "Habit"), g.num("shown", "Shown", "x"), g.word("filled", "Filled")]);
    return out + k.caption(`${v("place")} left empty, ${v("filled") === "never" ? "never filled" : "filled " + v("filled")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
