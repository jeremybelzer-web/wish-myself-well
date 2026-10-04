/* look for the attention and momentum curiosities in data/db-depth-attention.js (depth thread, attention): the
   live picture at the top of each window. Same house style as look-heart-comedy.js: a stage on top (y 0 to 120)
   that acts out where the audience's attention goes, a strip of small labelled gauges below it, and a caption.
   Colors: gold = the audience's attention, red = trouble or a surprise, blue = calm, purple = a question, green =
   an answer. Every own setting moves something of its own. */
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
  /* A question mark in a purple circle; s is its size. */
  const qmark = (k, x, y, s, color, txt) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(s)}" fill="${color || S.purple}" stroke="${S.ink}" stroke-width="1.5"/>` + k.text({ x, y: y + s * 0.42, text: txt || "?", size: s * 1.25, color: "#fff", weight: 900 });
  /* A film bar from start to end, with pins at places 0..1 (or a filled stretch). */
  function film(k, x, y, w, o) {
    o = o || {};
    let out = `<rect x="${x}" y="${y}" width="${w}" height="10" rx="2" fill="#2e2d36" stroke="#555"/>`;
    for (let i = 1; i < 12; i++) out += `<line x1="${r1(x + (i * w) / 12)}" y1="${y + 1}" x2="${r1(x + (i * w) / 12)}" y2="${y + 9}" stroke="#444"/>`;
    (o.spans || []).forEach((s) => (out += `<rect x="${r1(x + w * s.a)}" y="${y + 1}" width="${r1(Math.max(1.5, w * (s.b - s.a)))}" height="8" fill="${s.color || S.gold}" opacity="${s.alpha || 0.85}"/>`));
    (o.pins || []).forEach((p) => {
      const px = x + w * k.clamp(p.p, 0, 1);
      const ph = p.h || 14;
      out += `<path d="M${r1(px)} ${y + 10} l${r1(-ph * 0.3)} ${r1(-ph)} h${r1(ph * 0.6)} Z" fill="${p.color || S.red}" stroke="${S.ink}"/>` + (p.label ? k.label({ x: px, y: y + 10 - ph - 3, text: p.label, size: 8, color: p.color || "#eee" }) : "");
    });
    if (o.ends !== false) out += k.label({ x, y: y + 20, text: "start", size: 7, color: "#888", anchor: "start" }) + k.label({ x: x + w, y: y + 20, text: "end", size: 7, color: "#888", anchor: "end" });
    return out;
  }
  /* A shot: a dark frame with a thin border. */
  const shot = (x, y, w, h, color) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="3" fill="${color || S.frame}" stroke="#666" stroke-width="1.2"/>`;
  /* A door: a frame, open or shut. */
  const door = (k, x, w, h, open, color) => `<rect x="${r1(x)}" y="${r1(FY - h)}" width="${r1(w)}" height="${r1(h)}" fill="#0c0b10" stroke="#555"/>` + `<rect x="${r1(x)}" y="${r1(FY - h)}" width="${r1(w * (1 - 0.7 * k.clamp(open, 0, 1)))}" height="${r1(h)}" fill="${color || S.wood}" stroke="${S.ink}"/>`;
  /* A wavy line of attention across the film: points 0..1 high, drawn in gold. */
  function attentionLine(k, x, y, w, h, pts, color) {
    const d = pts.map((p, i) => `${i ? "L" : "M"}${r1(x + (w * i) / (pts.length - 1))} ${r1(y + h - h * k.clamp(p, 0, 1))}`).join(" ");
    return `<path d="${d}" fill="none" stroke="${color || S.gold}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  }

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

  /* ======================= eyeTrace ======================= */
  /* Two shots side by side. The gold dot is where the eye rests at the cut; the arrow is how far it must jump. */
  const SPOT = [[0.5, 0.5], [0.33, 0.5], [0.67, 0.5], [0.5, 0.25], [0.5, 0.75]];
  const LEAD = ["", "→", "👀", "✦", "👉"];
  look("eyeTrace", (v, k, g) => {
    const m = v.n("match");
    const wh = idx(v, "where", 5);
    const lb = idx(v, "leadBy", 5);
    const jp = idx(v, "jump", 4);
    const ft = v.n("findTime");
    const br = idx(v, "breaks", 4);
    let out = stage(k, { floor: S.bg });
    const A = { x: 12, y: 16, w: 140, h: 88 };
    const B = { x: 168, y: 16, w: 140, h: 88 };
    out += shot(A.x, A.y, A.w, A.h) + shot(B.x, B.y, B.w, B.h);
    out += k.label({ x: A.x + 4, y: A.y + 10, text: "end of shot", size: 7, color: "#999", anchor: "start" }) + k.label({ x: B.x + 4, y: B.y + 10, text: "next shot", size: 7, color: "#999", anchor: "start" });
    const [sx, sy] = SPOT[wh];
    const ax = A.x + A.w * sx;
    const ay = A.y + A.h * sy;
    /* the subject's spot in the next shot moves further away as the match drops and the jump grows */
    const off = ((5 - m) / 5) * 0.3 + jp * 0.1;
    const nx = sx + off > 0.9 ? sx - off : sx + off;
    const ny = sy + jp * 0.06 > 0.85 ? sy - jp * 0.06 : sy + jp * 0.06;
    const bx = B.x + B.w * k.clamp(nx, 0.08, 0.92);
    const by = B.y + B.h * k.clamp(ny, 0.12, 0.88);
    /* the eye's ghost spot carried into the next shot */
    out += k.ring({ x: B.x + B.w * sx, y: B.y + B.h * sy, r: 9, color: S.gold, w: 1.5, dash: "2 2" });
    out += k.dot({ x: ax, y: ay, r: 8, color: S.gold }) + k.dot({ x: bx, y: by, r: 8, color: br ? S.red : S.green });
    /* the time to find it: a growing search ring */
    out += k.ring({ x: bx, y: by, r: 10 + ft * 10, color: "#ddd", w: 1, dash: "3 3" });
    if (Math.abs(bx - (B.x + B.w * sx)) + Math.abs(by - (B.y + B.h * sy)) > 4) out += k.arrow({ x1: B.x + B.w * sx, y1: B.y + B.h * sy, x2: bx, y2: by, color: jp === 3 ? S.red : S.gold, w: 1.8 });
    /* what leads the eye in */
    if (lb) out += k.label({ x: ax - 16, y: ay + 4, text: LEAD[lb], size: 12, color: "#fff" });
    out += `<path d="M152 60 l16 0" stroke="#aaa" stroke-width="2"/>` + k.label({ x: 160, y: 54, text: "cut", size: 7, color: "#aaa" });
    out += strip(k, [g.num("match", "Match"), g.steps("where", "Eye at the cut"), g.steps("leadBy", "Led by"), g.steps("jump", "Jump", S.red), g.num("findTime", "Time to find", " s"), g.steps("breaks", "Broken on purpose", S.red)]);
    return out + k.caption(`eye on ${v("where")}, ${v("jump")} into the next shot`);
  });

  /* ======================= allEyesTurn ======================= */
  const AT = ["door", "sound", "person", "sky", "camera"];
  look("allEyesTurn", (v, k, g) => {
    const t = v.n("turn");
    const cnt = v.n("count");
    const tm = idx(v, "timing", 3);
    const at = idx(v, "at", 5);
    const sh = idx(v, "shown", 4);
    const ho = idx(v, "holdout", 3);
    let out = stage(k);
    const shownN = Math.max(1, Math.min(9, Math.round(cnt / 3) + 1));
    const turned = Math.round((t / 5) * shownN);
    for (let i = 0; i < shownN; i++) {
      const x = 22 + i * (180 / Math.max(1, shownN - 1 || 1));
      const holdout = ho && i === 0;
      const on = !holdout && (tm === 0 ? i >= shownN - turned : i < turned);
      out += guy(k, x, { s: 0.62, color: holdout ? S.orange : S.blue, look: on ? 1 : -1, eyes: on ? 1 : 0.6, mood: on ? 0.1 : 0.3, arms: holdout && ho === 2 ? 0.4 : -0.2 });
    }
    if (cnt > 27) out += k.label({ x: 120, y: 18, text: `${cnt} people`, size: 8, color: "#bbb" });
    /* how they turn: a sweep for one by one, a flash for a snap */
    if (tm === 2) out += `<path d="M30 30 l12 -8 M40 34 l14 -6" stroke="${S.gold}" stroke-width="2"/>`;
    if (tm === 0) out += `<path d="M20 26 Q110 6 200 26" fill="none" stroke="${S.gold}" stroke-dasharray="3 3"/>`;
    /* what they look at, on the right, hidden until it is shown */
    const tx = 270;
    let target = "";
    if (at === 0) target = door(k, 252, 30, 70, 0.6);
    if (at === 1) target = k.speaker({ x: tx, y: 60, s: 0.8, level: 1 });
    if (at === 2) target = guy(k, tx, { s: 0.85, color: S.red, arms: 0.6, mood: 0.6, look: -1 });
    if (at === 3) target = `<circle cx="${tx}" cy="26" r="14" fill="#fff4c8"/>`;
    if (at === 4) target = k.cam({ x: tx, y: 60, dir: 180, s: 0.9 });
    out += `<g opacity="${[1, 0.6, 0.25, 0.08][sh]}">${target}</g>`;
    if (sh > 0) out += qmark(k, tx, 40, 7 + sh * 3);
    out += k.label({ x: tx, y: 118, text: AT[at], size: 8, color: "#ccc" });
    /* the sightlines */
    for (let i = 0; i < turned; i++) out += `<line x1="${r1(30 + i * 18)}" y1="58" x2="${tx - 18}" y2="56" stroke="${S.gold}" stroke-width="0.8" opacity="0.5"/>`;
    out += strip(k, [g.num("turn", "Heads turned"), g.num("count", "People", ""), g.steps("timing", "How they turn"), g.steps("at", "Looking at"), g.steps("shown", "We see it", S.purple), g.steps("holdout", "Holdout", S.orange)]);
    return out + k.caption(`${turned} of ${shownN} look at the ${AT[at]}, ${v("timing")}`);
  });

  /* ======================= oddDetail ======================= */
  const ODD = ["stain", "missing", "clock", "stranger", "boot print", "wound"];
  look("oddDetail", (v, k, g) => {
    const o = v.n("odd");
    const kd = idx(v, "kind", 6);
    const sz = idx(v, "size", 4);
    const no = idx(v, "noticed", 4);
    const ex = idx(v, "explained", 4);
    const st = v.n("shownTimes");
    let out = stage(k, { bg: "#1d1b24" });
    /* a tidy room: a picture frame, a table, a lamp */
    out += `<rect x="40" y="24" width="40" height="30" fill="#2f2c3a" stroke="#777"/><rect x="100" y="80" width="80" height="6" fill="${S.wood}"/><rect x="108" y="86" width="5" height="26" fill="${S.wood}"/><rect x="167" y="86" width="5" height="26" fill="${S.wood}"/>`;
    out += k.lamp({ x: 220, y: 26, dir: 90, s: 0.6, power: 0.4 });
    /* the odd thing, its size and strangeness */
    const r = [3, 5, 8, 13][sz];
    const ox = 140;
    const oy = 98;
    const col = k.mix("#8a7f70", S.red, o / 5);
    if (kd === 0) out += `<ellipse cx="${ox}" cy="${oy + 10}" rx="${r1(r * 1.4)}" ry="${r1(r * 0.5)}" fill="${col}"/>`;
    if (kd === 1) out += `<rect x="${r1(60 - r)}" y="${r1(39 - r)}" width="${r1(r * 2)}" height="${r1(r * 2)}" fill="#1d1b24" stroke="${col}" stroke-dasharray="2 2"/>`;
    if (kd === 2) out += k.clock({ x: 60, y: 39, r: r + 4, p: 0.2 + o * 0.12 });
    if (kd === 3) out += guy(k, 290, { s: 0.3 + sz * 0.15, color: col, alpha: 0.7 });
    if (kd === 4) out += `<ellipse cx="${ox}" cy="${oy + 10}" rx="${r1(r * 0.5)}" ry="${r1(r * 0.9)}" fill="${col}"/>`;
    if (kd === 5) out += guy(k, 250, { s: 0.7, color: S.blue }) + `<rect x="${r1(244 - r / 2)}" y="58" width="${r1(10 + r)}" height="5" fill="${S.paper}" stroke="${col}"/>`;
    const fx = [ox, 60, 60, 290, ox, 250][kd];
    const fy = [oy + 10, 39, 39, 80, oy + 10, 60][kd];
    /* who notices: our gold ring, a character's red look, everyone */
    if (no >= 1) out += k.ring({ x: fx, y: fy, r: r + 8, color: S.gold, w: 1.5, dash: "3 2" });
    if (no >= 2) out += guy(k, 30, { s: 0.6, color: S.green, look: 1, mood: -0.4 }) + `<line x1="34" y1="62" x2="${fx}" y2="${fy}" stroke="${S.red}" stroke-dasharray="2 3"/>`;
    if (no === 3) out += guy(k, 205, { s: 0.6, color: S.green, look: -1, mood: -0.4 });
    /* how long it waits for an explanation */
    out += qmark(k, 300, 20, 6 + ex * 2.5, ex === 3 ? S.red : S.purple);
    for (let i = 0; i < st; i++) out += k.dot({ x: 10 + i * 8, y: 10, r: 2.5, color: S.gold });
    out += strip(k, [g.num("odd", "How strange", "", S.red), g.steps("kind", "What"), g.steps("size", "Size"), g.steps("noticed", "Who notices"), g.steps("explained", "Explained", S.purple), g.num("shownTimes", "Shown", "x")]);
    return out + k.caption(`a ${ODD[kd]} that doesn't belong, noticed by ${v("noticed")}`);
  });

  /* ======================= surpriseSpacing ======================= */
  look("surpriseSpacing", (v, k, g) => {
    const s = v.n("surprise");
    const gap = v.n("gap");
    const pat = idx(v, "pattern", 5);
    const gr = idx(v, "growth", 3);
    const last = idx(v, "lastOne", 3);
    const fair = idx(v, "fair", 3);
    let out = stage(k, { floor: S.bg });
    /* the number of surprises from how surprising and how far apart (a two-hour film) */
    const n = Math.max(1, Math.min(14, Math.round((120 / Math.max(1, gap)) * (0.3 + s * 0.14))));
    const pos = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1);
      let p = t;
      if (pat === 1) p = Math.sqrt(t);
      if (pat === 2) p = t * t;
      if (pat === 3) p = Math.floor(t * 3) / 3 + (t * 3 - Math.floor(t * 3)) * 0.12 + 0.08;
      if (pat === 4) p = k.clamp(t + (k.rnd(i + 3) - 0.5) * 0.12, 0.02, 0.98);
      pos.push(k.clamp(p, 0.02, 0.98));
    }
    const pins = pos.map((p, i) => {
      const grow = [1 - (i / n) * 0.6, 1, 0.5 + (i / n) * 0.8][gr];
      const isLast = i === n - 1;
      const h = isLast ? [10, 18, 30][last] : 8 + grow * 12;
      return { p, h, color: isLast ? S.gold : S.red };
    });
    out += film(k, 14, 92, 292, { pins });
    /* hints before each surprise when they were set up */
    if (fair) pos.forEach((p) => (out += k.dot({ x: 14 + 292 * Math.max(0, p - 0.04), y: 86, r: fair, color: S.green })));
    out += k.label({ x: 160, y: 22, text: `${n} surprises, about every ${fmt(gap)} min`, size: 11, color: "#eee", weight: 700 });
    out += k.label({ x: 160, y: 38, text: v("pattern"), size: 9, color: S.gold });
    out += strip(k, [g.num("surprise", "How surprising", "", S.red), g.num("gap", "Gap", " min"), g.steps("pattern", "Rhythm"), g.steps("growth", "Growth", S.red), g.steps("lastOne", "Last one"), g.steps("fair", "Set up", S.green)]);
    return out + k.caption(`surprises ${v("pattern")}, ${v("growth")}`);
  });

  /* ======================= openingPromise ======================= */
  const PROMISE = ["LAUGHS", "FEAR", "MYSTERY", "ROMANCE", "ACTION", "TEARS"];
  const PCOL = [S.gold, S.red, S.purple, S.pink, S.orange, S.blue];
  look("openingPromise", (v, k, g) => {
    const pr = v.n("promise");
    const kd = idx(v, "kind", 6);
    const how = idx(v, "how", 5);
    const mins = v.n("minutes");
    const rem = v.n("reminders");
    const kept = idx(v, "kept", 4);
    let out = stage(k, { floor: S.bg });
    /* the promise, written large: sharper as it gets clearer */
    out += `<g opacity="${r1(0.25 + pr * 0.15)}">` + k.text({ x: 160, y: 50, text: PROMISE[kd], size: 16 + pr * 4, color: PCOL[kd], weight: 900, spacing: 2 }) + `</g>`;
    out += chip(k, 160, 70, ["a scene before the titles", "the first image", "the music", "a voice telling us", "the title"][how], "#33323d", "middle");
    /* the film: the opening stretch, reminders, and the ending kept or broken */
    const pins = [];
    for (let i = 0; i < rem; i++) pins.push({ p: 0.2 + ((i + 1) / (rem + 1)) * 0.65, h: 9, color: PCOL[kd] });
    pins.push({ p: 0.98, h: 10 + kept * 5, color: [S.red, S.orange, S.green, S.gold][kept], label: ["broken", "bent", "kept", "topped"][kept] });
    out += film(k, 14, 96, 292, { spans: [{ a: 0, b: (mins / 120) * 3, color: PCOL[kd] }], pins });
    out += strip(k, [g.num("promise", "How clear"), g.steps("kind", "Promises"), g.steps("how", "Made by"), g.num("minutes", "Takes", " min"), g.num("reminders", "Reminders", "x"), g.steps("kept", "Kept", S.green)]);
    return out + k.caption(`promises ${v("kind")}, ${v("kept")}`);
  });

  /* ======================= lullStretch ======================= */
  const WHERE = [0.12, 0.35, 0.55, 0.82];
  look("lullStretch", (v, k, g) => {
    const l = v.n("lull");
    const mins = v.n("minutes");
    const wh = idx(v, "where", 4);
    const why = idx(v, "why", 5);
    const fix = idx(v, "fix", 5);
    const pl = idx(v, "planned", 3);
    let out = stage(k, { floor: S.bg });
    /* attention across the film, dipping in the flat stretch */
    const c0 = WHERE[wh];
    const half = 0.02 + (mins / 10) * 0.12;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const base = 0.7 + Math.sin(t * 9) * 0.08;
      const inDip = Math.abs(t - c0) < half ? 1 - Math.abs(t - c0) / half : 0;
      const dip = inDip * (l / 5) * 0.65;
      const lift = fix && t > c0 ? Math.min(0.15, (t - c0) * 2) * [0, 1, 1, 0.4, 1.2][fix] : 0;
      pts.push(base - dip + lift * 0.4);
    }
    out += `<rect x="${r1(14 + 292 * (c0 - half))}" y="14" width="${r1(292 * half * 2)}" height="80" fill="${pl === 2 ? S.blue : S.red}" opacity="0.15"/>`;
    out += attentionLine(k, 14, 14, 292, 78, pts);
    out += k.label({ x: 14 + 292 * c0, y: 108, text: ["no question", "no goal", "too much talk", "same beat", "waiting"][why], size: 8, color: "#ccc" });
    if (fix) out += chip(k, Math.min(296, 14 + 292 * (c0 + half) + 8), 30, ["", "+ clock", "+ question", "cut shorter", "+ surprise"][fix], S.green, "start");
    out += k.label({ x: 6, y: 18, text: "attention", size: 7, color: S.gold, anchor: "start" });
    out += strip(k, [g.num("lull", "How flat", "", S.red), g.num("minutes", "Lasts", " min"), g.steps("where", "Where"), g.steps("why", "Why"), g.steps("fix", "Fix", S.green), g.steps("planned", "Planned", S.blue)]);
    return out + k.caption(`${fmt(mins)} flat minutes in ${v("where")}, ${v("planned")}`);
  });

  /* ======================= cutAwayAtPeak ======================= */
  look("cutAwayAtPeak", (v, k, g) => {
    const pk = v.n("peak");
    const th = v.n("threads");
    const lv = idx(v, "leaves", 4);
    const aw = v.n("away");
    const bk = idx(v, "back", 3);
    const ot = idx(v, "other", 3);
    let out = stage(k, { floor: S.bg });
    const lanes = Math.max(2, Math.round(th));
    const lh = 92 / lanes;
    for (let i = 0; i < lanes; i++) out += `<rect x="14" y="${r1(10 + i * lh)}" width="292" height="${r1(lh - 3)}" rx="3" fill="${i ? "#1f2230" : "#2a1f2a"}"/>` + k.label({ x: 10, y: 10 + i * lh + lh / 2, text: `${i + 1}`, size: 7, color: "#888", anchor: "end" });
    /* story 1 climbs toward its peak; we leave it at the chosen point */
    const leaveAt = 0.2 + [0.1, 0.2, 0.3, 0.34][lv] + pk * 0.01;
    const top = 10 + 4;
    const bottom = 10 + lh - 6;
    const p1 = [];
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * leaveAt;
      p1.push(`${i ? "L" : "M"}${r1(14 + 292 * t)} ${r1(bottom - (bottom - top) * Math.min(1, t / 0.55))}`);
    }
    out += `<path d="${p1.join(" ")}" fill="none" stroke="${S.red}" stroke-width="2.5"/>`;
    out += `<circle cx="${r1(14 + 292 * 0.55)}" cy="${top}" r="3" fill="none" stroke="${S.red}" stroke-dasharray="1 2"/>`;
    /* away in story 2 for a while, at its own tension */
    const ax = 14 + 292 * leaveAt;
    const awayW = 292 * (0.06 + (aw / 20) * 0.36);
    const y2 = 10 + lh + lh * [0.65, 0.4, 0.15][ot];
    out += `<line x1="${r1(ax)}" y1="${r1(top + 6)}" x2="${r1(ax)}" y2="${r1(y2)}" stroke="#fff" stroke-dasharray="2 2"/>`;
    out += `<line x1="${r1(ax)}" y1="${r1(y2)}" x2="${r1(ax + awayW)}" y2="${r1(y2)}" stroke="${[S.blue, S.orange, S.red][ot]}" stroke-width="2.5"/>`;
    /* coming back, at the same point or later */
    const backX = ax + awayW;
    const rejoin = [0, 0.08, 0.2][bk] * 292;
    out += k.arrow({ x1: backX, y1: y2, x2: Math.min(306, backX + rejoin + 6), y2: bk === 2 ? bottom : top + 8, color: S.gold, w: 1.5 });
    out += qmark(k, ax, top + 2, 4 + pk * 1.2);
    out += strip(k, [g.num("peak", "Near the peak", "", S.red), g.num("threads", "Stories", ""), g.steps("leaves", "Leave at"), g.num("away", "Away", " min"), g.steps("back", "Come back"), g.steps("other", "Cut to", S.orange)]);
    return out + k.caption(`leave ${v("leaves")}, away ${fmt(aw)} min`);
  });

  /* ======================= almostAnswer ======================= */
  const ANS = ["It was... ", "It's hidden in... ", "That night we... ", "I feel... ", "I'm really... "];
  const STOP = ["🚪", "📞", "🤐", "💀", "✂️"];
  look("almostAnswer", (v, k, g) => {
    const al = v.n("almost");
    const wh = idx(v, "what", 5);
    const sb = idx(v, "stoppedBy", 5);
    const tm = v.n("times");
    const gv = idx(v, "given", 4);
    const wo = idx(v, "worth", 3);
    let out = stage(k);
    out += guy(k, 60, { s: 0.95, color: S.blue, mood: -0.2, arms: 0.2, look: 1, mouth: 0.6 });
    out += guy(k, 150, { s: 0.9, color: S.green, look: -1, lean: -8 + -al * 2 });
    /* the words, getting closer to the answer, then cut off */
    const words = ANS[wh] + "_".repeat(Math.max(0, 5 - Math.round(al)));
    out += k.bubble({ x: 82, y: 22, w: 128, h: 22, text: words, tail: -20, size: 9 });
    out += `<line x1="${r1(132 - (5 - al) * 6)}" y1="14" x2="${r1(146 - (5 - al) * 6)}" y2="30" stroke="${S.red}" stroke-width="3"/>`;
    out += k.label({ x: 230, y: 60, text: STOP[sb], size: 24 });
    /* how often it slips */
    for (let i = 0; i < tm; i++) out += qmark(k, 200 + i * 16, 100, 6);
    /* when the answer comes, and how good it is */
    const gp = [0.2, 0.55, 0.95, 1.2][gv];
    out += `<line x1="200" y1="${FY + 4}" x2="${r1(200 + Math.min(1, gp) * 108)}" y2="${FY + 4}" stroke="${S.gold}" stroke-width="2"/>`;
    if (gv < 3) out += k.dot({ x: 200 + gp * 108, y: FY + 4, r: 3 + wo * 2.5, color: S.green });
    else out += k.label({ x: 300, y: 108, text: "never", size: 8, color: S.red, anchor: "end" });
    out += strip(k, [g.num("almost", "How close"), g.steps("what", "About"), g.steps("stoppedBy", "Stopped by", S.red), g.num("times", "Slips", "x"), g.steps("given", "Answer", S.purple), g.steps("worth", "Worth it", S.green)]);
    return out + k.caption(`almost: ${v("what")}, stopped when ${v("stoppedBy")}`);
  });

  /* ======================= lockedBox ======================= */
  const THING = ["box", "letter", "door", "briefcase", "phone", "bag"];
  look("lockedBox", (v, k, g) => {
    const pl = v.n("pull");
    const th = idx(v, "thing", 6);
    const gl = v.n("glimpses");
    const gu = idx(v, "guarded", 4);
    const op = idx(v, "opened", 4);
    const ins = idx(v, "inside", 4);
    let out = stage(k);
    /* a glow of wanting around it */
    out += `<ellipse cx="160" cy="80" rx="${r1(30 + pl * 10)}" ry="${r1(20 + pl * 6)}" fill="${S.gold}" opacity="${r1(0.05 + pl * 0.05)}"/>`;
    const open = op === 0 ? 1 : op === 1 ? 0.6 : op === 2 ? 0.3 : 0;
    if (th === 2) out += door(k, 145, 32, 70, open * 0.8);
    else {
      const w = [44, 40, 0, 50, 22, 38][th];
      const h = [30, 24, 0, 32, 38, 30][th];
      out += `<rect x="${r1(160 - w / 2)}" y="${r1(FY - h)}" width="${w}" height="${h}" rx="${th === 4 ? 4 : 2}" fill="${[S.wood, S.paper, S.wood, "#4b3a2a", "#222", "#6b3a4a"][th]}" stroke="${S.ink}"/>`;
      /* the lid, lifted as it opens */
      out += `<rect x="${r1(160 - w / 2 - 2)}" y="${r1(FY - h - 5 - open * 12)}" width="${w + 4}" height="5" fill="#555" stroke="${S.ink}" transform="rotate(${r1(-open * 25)} ${r1(160 - w / 2)} ${r1(FY - h)})"/>`;
    }
    if (gu >= 2) out += `<rect x="154" y="88" width="12" height="10" rx="2" fill="${S.gold}" stroke="${S.ink}"/><path d="M156 88 v-4 a4 4 0 0 1 8 0 v4" fill="none" stroke="${S.gold}" stroke-width="2"/>`;
    if (gu === 3) out += guy(k, 220, { s: 0.85, color: S.red, arms: -0.3, look: -1, mood: -0.3 });
    if (gu === 1) out += `<rect x="120" y="60" width="80" height="52" fill="#000" opacity="0.35"/>`;
    /* peeks: little eye lines toward it */
    for (let i = 0; i < gl; i++) out += `<line x1="${r1(40 + i * 12)}" y1="40" x2="150" y2="85" stroke="${S.gold}" stroke-dasharray="2 3" opacity="0.6"/>`;
    /* what comes out */
    if (op < 3) out += k.label({ x: 160, y: 30, text: ["less than hoped", "as guessed", "never guessed!", "?"][ins], size: 10, color: [S.grey, S.green, S.gold, S.purple][ins], weight: 700 });
    else out += qmark(k, 160, 30, 12);
    out += strip(k, [g.num("pull", "Want it open"), g.steps("thing", "What"), g.num("glimpses", "Near peeks", "x"), g.steps("guarded", "Guarded", S.red), g.steps("opened", "Opened"), g.steps("inside", "Inside", S.purple)]);
    return out + k.caption(`a ${THING[th]}, ${v("guarded")}, opened ${v("opened")}`);
  });

  /* ======================= questionRelay ======================= */
  look("questionRelay", (v, k, g) => {
    const rl = v.n("relay");
    const bg = idx(v, "bigger", 4);
    const sn = idx(v, "soon", 3);
    const ln = v.n("links");
    const kd = idx(v, "kind", 5);
    const en = idx(v, "ends", 3);
    let out = stage(k, { floor: S.bg });
    const n = Math.max(1, Math.round(ln));
    const grow = [0.85, 1, 1.15, 1.3][bg];
    const step = (292 - 30) / Math.max(1, n);
    let size = 5;
    for (let i = 0; i < n; i++) {
      const x = 22 + i * step + sn * step * 0.2;
      const y = 70 - Math.min(40, i * rl * 1.5);
      const last = i === n - 1;
      const open = !last || en > 0;
      const s = last && en === 2 ? size * 1.3 : size;
      if (i > 0) out += `<line x1="${r1(x - step + sn * 0)}" y1="${r1(70 - Math.min(40, (i - 1) * rl * 1.5))}" x2="${r1(x)}" y2="${r1(y)}" stroke="${S.gold}" stroke-width="1.5" stroke-dasharray="${["", "4 2", "1 4"][sn] || "0"}"/>`;
      out += open ? qmark(k, x, y, Math.min(16, s)) : `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(Math.min(16, s))}" fill="${S.green}" stroke="${S.ink}"/>` + k.label({ x, y: y + 3, text: "✓", size: 9, color: "#fff" });
      size *= grow;
    }
    out += k.label({ x: 160, y: 104, text: ["who?", "why?", "what next?", "what is real?", "whose side?"][kd], size: 11, color: S.purple, weight: 700 });
    out += strip(k, [g.num("relay", "New questions"), g.steps("bigger", "Bigger", S.purple), g.steps("soon", "How soon"), g.num("links", "Chain", ""), g.steps("kind", "Asks"), g.steps("ends", "Ends", S.green)]);
    return out + k.caption(`${n} questions, each ${v("bigger")}, ${v("ends")}`);
  });

  /* ======================= redHerring ======================= */
  look("redHerring", (v, k, g) => {
    const ml = v.n("mislead");
    const at = idx(v, "at", 5);
    const pl = idx(v, "planted", 3);
    const cn = v.n("count");
    const cl = idx(v, "cleared", 3);
    const fa = idx(v, "fair", 3);
    let out = stage(k);
    /* the hero and the audience follow the false trail to the right; the truth waits on the left */
    out += guy(k, 110, { s: 0.85, color: S.blue, look: 1, lean: 4 + ml * 2, arms: 0.3 });
    const wrongX = 250;
    const wrong = [guy(k, wrongX, { s: 0.85, color: S.orange, mood: -0.3, look: -1 }), `<path d="M${wrongX - 14} 100 l28 -8 l-4 6 Z" fill="#ccc" stroke="${S.ink}"/>`, `<polygon points="${wrongX - 20},${FY} ${wrongX},${FY - 40} ${wrongX + 20},${FY}" fill="#3a3346" stroke="#777"/>`, k.clock({ x: wrongX, y: 70, r: 16, p: 0.6 }), k.text({ x: wrongX, y: 80, text: "$", size: 30, color: S.green, weight: 900 })][at];
    out += wrong;
    out += k.arrow({ x1: 128, y1: 60, x2: 228, y2: 60, color: S.red, w: 1 + ml });
    out += guy(k, 30, { s: 0.75, color: S.grey, alpha: 0.6, look: 1 });
    out += k.label({ x: 30, y: 22, text: "the truth", size: 8, color: "#999" });
    /* the false clues, as red fish */
    for (let i = 0; i < cn; i++) out += `<path d="M${170 + i * 12} ${20} q5 -5 10 0 q-5 5 -10 0 Z M${180 + i * 12} 20 l4 -3 v6 Z" fill="${S.red}"/>`;
    out += chip(k, 250, 108 - 90, ["chance", "the culprit", "the storyteller"][pl], "#33323d", "middle");
    /* when it is cleared, along the floor */
    out += `<line x1="14" y1="${FY + 4}" x2="${r1(14 + [60, 160, 290][cl])}" y2="${FY + 4}" stroke="${S.red}" stroke-width="2"/>`;
    out += k.dot({ x: 14 + [60, 160, 290][cl], y: FY + 4, r: 3 + fa * 1.5, color: [S.red, S.orange, S.green][fa] });
    out += strip(k, [g.num("mislead", "Misleads", "", S.red), g.steps("at", "Points at"), g.steps("planted", "Planted by"), g.num("count", "False clues", ""), g.steps("cleared", "Cleared"), g.steps("fair", "Fair", S.green)]);
    return out + k.caption(`points at ${v("at")}, cleared ${v("cleared")}`);
  });

  /* ======================= sceneGoalClear ======================= */
  const WANT = ["🔑", "🚪", "🔍", "💐", "🙈"];
  look("sceneGoalClear", (v, k, g) => {
    const cl = v.n("clear");
    const wt = idx(v, "want", 5);
    const tb = idx(v, "toldBy", 4);
    const wh = idx(v, "when", 4);
    const bl = idx(v, "blocked", 4);
    const gt = idx(v, "got", 4);
    let out = stage(k);
    const hx = 50 + [80, 50, 20, 60][gt];
    out += guy(k, hx, { s: 0.9, color: S.blue, walk: 0.7, lean: 6, look: 1, mood: [0.7, 0.2, -0.6, 0.1][gt] });
    /* the goal, sharp when clear, faint when we must guess */
    out += `<g opacity="${r1(0.15 + cl * 0.17)}">` + k.label({ x: 280, y: 70, text: WANT[wt], size: 28 }) + `</g>`;
    if (cl < 3) out += qmark(k, 280, 30, 8 + (3 - cl) * 2);
    /* the path to it, dotted when unclear */
    out += `<line x1="${hx + 14}" y1="60" x2="262" y2="60" stroke="${S.gold}" stroke-width="2" stroke-dasharray="${cl >= 4 ? "0" : cl >= 2 ? "6 3" : "2 4"}"/>`;
    /* what blocks it */
    if (bl === 1) out += guy(k, 220, { s: 0.85, color: S.red, arms: 0.8, look: -1, mood: -0.5 });
    if (bl === 2) out += `<rect x="208" y="70" width="22" height="42" fill="#555" stroke="${S.ink}"/>`;
    if (bl === 3) out += k.clock({ x: 220, y: 34, r: 16, p: 0.85 });
    /* how we learn it, and when in the scene */
    out += chip(k, 14, 18, ["they say it", "we see it", "someone says it", "we guess"][tb], "#33323d", "start");
    out += `<rect x="14" y="${FY + 2}" width="120" height="4" fill="#33323d"/><rect x="${r1(14 + [0, 0.25, 0.5, 0.9][wh] * 120)}" y="${FY + 1}" width="4" height="6" fill="${S.gold}"/>`;
    if (gt === 3) out += k.label({ x: hx, y: 18, text: "at a cost", size: 8, color: S.red });
    out += strip(k, [g.num("clear", "How clear"), g.steps("want", "Wants"), g.steps("toldBy", "We learn by"), g.steps("when", "Learned"), g.steps("blocked", "In the way", S.red), g.steps("got", "Gets it", S.green)]);
    return out + k.caption(`wants ${v("want")}, blocked: ${v("blocked")}`);
  });

  /* ======================= ruleSetEarly ======================= */
  const RULE = ["NEVER DO THIS", "ONLY WORKS IF...", "DANGER", "THE LAW HERE", "A DEAL"];
  look("ruleSetEarly", (v, k, g) => {
    const ru = v.n("rule");
    const kd = idx(v, "kind", 5);
    const tl = idx(v, "told", 4);
    const gp = v.n("gap");
    const br = idx(v, "broken", 4);
    const pr = idx(v, "price", 4);
    let out = stage(k);
    /* the sign with the rule, bolder as it is drilled in */
    out += `<rect x="20" y="16" width="130" height="34" rx="3" fill="${S.paper}" stroke="${S.ink}" stroke-width="${r1(1 + ru * 0.6)}"/>` + k.text({ x: 85, y: 38, text: RULE[kd], size: 9 + ru * 0.6, color: S.ink, weight: 900 });
    out += `<rect x="83" y="50" width="4" height="${FY - 50}" fill="${S.wood}"/>`;
    /* how many times it was shown, as marks on the sign */
    for (let i = 0; i <= tl; i++) out += k.dot({ x: 26 + i * 8, y: 22, r: 2.5, color: tl === 3 && i === tl ? S.red : S.blue });
    /* the crack when it is broken */
    if (br >= 1) out += `<path d="M${85 - br * 6} 16 l6 10 l-5 6 l7 10 l-4 8" fill="none" stroke="${br >= 2 ? S.red : S.orange}" stroke-width="${br}"/>`;
    /* the price, as a red stack */
    for (let i = 0; i < pr * 2; i++) out += `<rect x="270" y="${FY - 8 - i * 9}" width="30" height="7" rx="2" fill="${S.red}" opacity="0.8"/>`;
    out += k.label({ x: 285, y: 22, text: "price", size: 8, color: "#ccc" });
    out += guy(k, 200, { s: 0.85, color: S.green, look: -1, mood: br >= 2 ? -0.7 : 0.2, arms: br === 3 ? 0.7 : -0.2 });
    /* the film: the rule early, the moment it matters later */
    out += `<rect x="110" y="${FY - 22}" width="140" height="4" fill="#33323d"/><rect x="110" y="${FY - 23}" width="3" height="6" fill="${S.blue}"/><rect x="${r1(110 + (gp / 90) * 137)}" y="${FY - 24}" width="4" height="8" fill="${S.red}"/>`;
    out += strip(k, [g.num("rule", "How firm"), g.steps("kind", "Kind"), g.steps("told", "Set up by", S.blue), g.num("gap", "Matters after", " min"), g.steps("broken", "Broken", S.red), g.steps("price", "Price", S.red)]);
    return out + k.caption(`${v("kind")}, ${v("broken")}, it costs ${v("price")}`);
  });

  /* ======================= voicedQuestion ======================= */
  const ASK = ["Wait, why?", "Why though? Ha!", "WHY?!", "why...?"];
  const WHO = [S.blue, S.green, S.orange, S.red, S.grey];
  look("voicedQuestion", (v, k, g) => {
    const vo = v.n("voiced");
    const wh = idx(v, "who", 5);
    const hw = idx(v, "how", 4);
    const an = idx(v, "answered", 3);
    const tm = v.n("times");
    const ld = idx(v, "lands", 3);
    let out = stage(k);
    out += guy(k, 90, { s: wh === 2 ? 0.6 : 0.9, color: WHO[wh], look: 1, mouth: 0.4 + vo * 0.1, mood: [-0.2, -0.6, 0.6][ld], arms: hw === 2 ? 0.8 : 0 });
    out += guy(k, 200, { s: 0.9, color: S.purple, look: -1, mood: an === 0 ? 0.3 : -0.2 });
    out += `<g opacity="${r1(0.35 + vo * 0.13)}">` + k.bubble({ x: 100, y: 22, w: 70 + vo * 8, h: 22, text: vo < 2 ? "hmm..." : ASK[hw], tail: -10, size: 9 + (hw === 2 ? 2 : 0) }) + `</g>`;
    /* the answer: right away, later, or never */
    if (an === 0) out += k.bubble({ x: 230, y: 40, w: 60, h: 18, text: "Because...", tail: -10, size: 8 });
    if (an === 1) out += k.label({ x: 240, y: 40, text: "later...", size: 9, color: S.grey });
    if (an === 2) out += qmark(k, 240, 36, 10, S.red);
    /* the audience in the dark, nodding along */
    for (let i = 0; i < 6; i++) out += `<circle cx="${r1(20 + i * 12)}" cy="${r1(106 - (i % 2) * 2)}" r="4" fill="#3a3646"/>`;
    for (let i = 0; i < tm; i++) out += k.dot({ x: 300 - i * 8, y: 104, r: 2.5, color: S.gold });
    out += strip(k, [g.num("voiced", "How directly"), g.steps("who", "Asked by"), g.steps("how", "How"), g.steps("answered", "Answered", S.green), g.num("times", "Asked", "x"), g.steps("lands", "Lands")]);
    return out + k.caption(`${v("who")} asks it, ${v("how")}, answered ${v("answered")}`);
  });

  /* ======================= readTime ======================= */
  look("readTime", (v, k, g) => {
    const rd = v.n("read");
    const bz = idx(v, "busy", 4);
    const sec = v.n("seconds");
    const wh = idx(v, "when", 4);
    const sn = idx(v, "seen", 4);
    const am = idx(v, "aim", 4);
    let out = stage(k, { floor: S.bg });
    out += shot(14, 10, 150, 90);
    /* what is in the frame: one thing, a few, a crowd, or words */
    const n = [1, 3, 14, 0][bz];
    for (let i = 0; i < n; i++) out += `<rect x="${r1(24 + k.rnd(i + 1) * 120)}" y="${r1(22 + k.rnd(i + 7) * 60)}" width="${r1(bz === 0 ? 30 : 12)}" height="${r1(bz === 0 ? 30 : 12)}" rx="3" fill="${[S.orange, S.blue, S.green, S.pink][i % 4]}"/>`;
    if (bz === 3) out += k.label({ x: 89, y: 50, text: "IMPORTANT NOTICE", size: 10, color: "#fff", weight: 700 }) + k.label({ x: 89, y: 64, text: "read every word of this", size: 8, color: "#ccc" });
    /* the time line: when we have read it (sooner if we know the view), and when the cut comes */
    const need = k.clamp([0.8, 1.6, 3, 3.5][bz] * [1, 0.75, 0.6, 0.45][sn], 0.3, 8);
    const scale = 128 / 8;
    out += `<rect x="178" y="40" width="128" height="10" rx="3" fill="#33323d"/><rect x="178" y="40" width="${r1(Math.max(2, Math.min(128, sec * scale)))}" height="10" rx="3" fill="${S.blue}"/>`;
    out += `<line x1="${r1(178 + need * scale)}" y1="34" x2="${r1(178 + need * scale)}" y2="56" stroke="${S.gold}" stroke-width="2"/>` + k.label({ x: 178 + need * scale, y: 30, text: "got it", size: 8, color: S.gold });
    const cutAt = 178 + Math.min(128, need * scale * [0.5, 1, 1.4, 2.2][wh]);
    out += `<path d="M${r1(cutAt)} 62 l-5 10 h10 Z" fill="${S.red}"/>` + k.label({ x: cutAt, y: 84, text: "cut", size: 8, color: S.red });
    out += `<rect x="178" y="94" width="128" height="6" rx="3" fill="#33323d"/><rect x="178" y="94" width="${r1(Math.max(2, rd * 25.6))}" height="6" rx="3" fill="${S.green}"/>`;
    out += k.label({ x: 242, y: 20, text: ["confuse", "keep pace", "sink in", "uneasy"][am], size: 10, color: "#eee", weight: 700 });
    out += strip(k, [g.num("read", "Taken in", "", S.green), g.steps("busy", "To take in"), g.num("seconds", "Shot", " s", S.blue), g.steps("when", "Cut comes", S.red), g.steps("seen", "Seen before"), g.steps("aim", "Aim")]);
    return out + k.caption(`${v("busy")}, ${fmt(sec)} s, cut ${v("when")}`);
  });

  /* ======================= longAwaited ======================= */
  const AWAIT = ["meet", "kiss", "fight", "truth", "return", "game"];
  look("longAwaited", (v, k, g) => {
    const wt = v.n("wait");
    const wh = idx(v, "what", 6);
    const dl = v.n("delays");
    const su = idx(v, "sure", 3);
    const ld = idx(v, "lands", 4);
    const sh = idx(v, "shown", 3);
    let out = stage(k);
    /* two people, further apart the longer it is held back */
    const gap = 20 + wt * 22;
    out += guy(k, 160 - gap, { s: 0.85, color: S.blue, look: 1, walk: 0.6, mood: 0.4 });
    out += guy(k, 160 + gap, { s: 0.85, color: S.pink, look: -1, walk: 0.6, mood: 0.4 });
    out += k.label({ x: 160, y: 80, text: AWAIT[wh], size: 12, color: S.gold, weight: 700 });
    /* how sure we are it is coming: brighter arrows */
    out += `<g opacity="${r1(0.35 + su * 0.3)}">` + k.arrow({ x1: 160 - gap + 14, y1: 66, x2: 150, y2: 66, color: S.gold, w: 1.5 }) + k.arrow({ x1: 160 + gap - 14, y1: 66, x2: 170, y2: 66, color: S.gold, w: 1.5 }) + `</g>`;
    /* the film: near misses, then the moment */
    const pins = [];
    for (let i = 0; i < dl; i++) pins.push({ p: 0.15 + (i / Math.max(1, dl)) * (0.2 + wt * 0.12), h: 8, color: S.grey });
    const at = 0.15 + wt * 0.16;
    pins.push({ p: at, h: 10 + [4, 10, 16, 12][ld], color: [S.grey, S.gold, S.green, S.purple][ld], label: ["meh", "yes", "YES!", "twist"][ld] });
    out += film(k, 14, 32, 292, { pins, spans: [{ a: at, b: at + [0.01, 0.04, 0.09][sh], color: S.gold }], ends: false });
    out += strip(k, [g.num("wait", "Held back"), g.steps("what", "Waiting for"), g.num("delays", "Near misses", "x", S.grey), g.steps("sure", "How sure"), g.steps("lands", "Lands", S.green), g.steps("shown", "Lasts")]);
    return out + k.caption(`the ${AWAIT[wh]}, after ${dl} near misses, ${v("lands")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
