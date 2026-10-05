/* look for the comedy curiosities in data/db-heart.js (database thread): the live picture at the top of each
   window. Same house style as look-comedy.js: a stage on top (y 0 to 120) with little people acting out the joke,
   a strip of small labelled gauges below it, and a caption. Colors: gold = laughs, red = trouble, blue = the
   straight one, orange = the funny one. Every own setting moves something of its own. */
(function (W) {
  const S = { bg: "#17161d", floor: "#2b2533", gold: "#ffd166", red: "#e4572e", blue: "#4a6fa5", orange: "#e8913a", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", ice: "#9fd3ff" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);
  const FY = 112; /* the stage floor: people's feet */

  /* ---------- the stage (copied from look-comedy.js) ---------- */
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

  /* ---------- the strip of small gauges (copied from look-comedy.js) ---------- */
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

  /* ======================= straightAnswer ======================= */
  /* A silly question on the left; a straight face on the right answers with a page that grows with detail. */
  look("straightAnswer", (v, k, g) => {
    const ser = idx(v, "seriousness", 4);
    const sil = Math.round(v.n("silliness"));
    const det = idx(v, "detail", 4);
    const ask = idx(v, "asker", 4);
    const bt = Math.round(v.n("beatBefore"));
    let out = stage(k, { spot: 240 });
    const SILLY = ["🦆", "🍌", "🎩", "🐙", "🚀"];
    out += k.bubble({ x: 62, y: 20, w: 100, h: 26, text: sil ? SILLY.slice(0, sil).join("") + "?" : "why?", tail: -8, size: 11 });
    out += guy(k, 54, { s: 0.85, color: S.orange, mood: [0.6, -0.1, -0.7, 0.3][ask], arms: ask === 3 ? 0.8 : 0.1, lean: ask === 3 ? 8 : 0, look: 1 });
    out += chip(k, 54, 60, ["happy", "huh?", "ugh", "but why?"][ask], ["#2f4a36", "#2c3346", "#4a2a2a", "#4a3a20"][ask], "middle");
    /* the answerer: more serious, more buttoned up */
    out += guy(k, 250, { s: 0.95, color: S.blue, mood: [0.45, 0.15, 0, -0.1][ser], look: -1, eyes: [0.9, 0.7, 0.5, 0.4][ser] });
    if (ser >= 1) out += `<path d="M250 58 l-3 4 l3 14 l3 -14 Z" fill="#c0392b" stroke="${S.ink}" stroke-width="0.6"/>`;
    if (ser >= 3) out += k.ring({ x: 246.5, y: 46, r: 2.6, color: S.ink, w: 1 }) + k.ring({ x: 253.5, y: 46, r: 2.6, color: S.ink, w: 1 });
    if (ser === 0) out += k.label({ x: 268, y: 36, text: "😏", size: 10 });
    /* the answer: a page of lines */
    const lines = [1, 2, 4, 7][det];
    const ph = 10 + lines * 6;
    out += k.panel({ x: 130, y: 8, w: 84, h: ph, w2: 1.5 });
    for (let i = 0; i < lines; i++) out += `<line x1="136" y1="${r1(15 + i * 6)}" x2="${r1(206 - k.rnd(i + 3) * 26)}" y2="${r1(15 + i * 6)}" stroke="#555" stroke-width="2"/>`;
    if (det === 3) out += `<line x1="236" y1="66" x2="212" y2="${r1(8 + ph)}" stroke="#8a6a3a" stroke-width="2"/>`;
    /* the pause before answering */
    out += beats(k, 130, 98, bt, "#bbb", 10) + (bt ? k.label({ x: 130, y: 90, text: "pause", size: 8, color: "#999", anchor: "start" }) : "");
    out += strip(k, [g.steps("seriousness", "Serious"), g.num("silliness", "Silly question", " of 5", S.orange), g.steps("detail", "Detail"), g.word("asker", "Asker"), g.num("beatBefore", "Pause before", " beats")]);
    return out + k.caption(`A ${v("seriousness")} answer to a question ${sil} of 5 silly`);
  });

  /* ======================= catchphrase ======================= */
  const LINE = ["Not again!", "Not... again!", "Not again?!", "Not again!"];
  look("catchphrase", (v, k, g) => {
    const uses = Math.round(v.n("uses"));
    const set = idx(v, "setUp", 4);
    const tw = idx(v, "twist", 4);
    const sp = v.n("spacing");
    const wh = Math.round(v.n("withheld"));
    const del = idx(v, "delivery", 4);
    let out = stage(k, { spot: 70 });
    const sx = tw === 3 ? 100 : 45;
    out += guy(k, 45, { s: 0.85, color: S.orange, mood: tw === 3 ? -0.3 : 0.7, arms: tw !== 3 && del === 2 ? 0.9 : 0.2, look: 1 });
    out += guy(k, 100, { s: 0.75, color: S.blue, mood: tw === 3 ? 0.8 : 0.1, arms: tw === 3 && del === 2 ? 0.9 : 0, look: -1 });
    /* the line itself, said in its way */
    const bw = [70, 92, 126, 104][del];
    const bh = [18, 24, 32, 26][del];
    const bx = sx + 66;
    out += k.bubble({ x: bx, y: 22, w: bw, h: bh, text: "", tail: -50 });
    const t = (del === 3 ? "♪ " : "") + LINE[tw] + (del === 3 ? " ♪" : "");
    out += k.text({ x: bx, y: 26 + (del === 2 ? 2 : 0), text: t, size: [8, 11, 15, 10][del], weight: del === 2 ? 900 : 400, italic: del === 0 || tw === 1, color: del === 0 ? "#666" : S.ink });
    /* the crowd waiting for it */
    const wait = [0, 2, 5, 10][set];
    out += heads(k, wait, 236, 56, 76, { r: 4, color: S.gold });
    if (set) out += k.label({ x: 274, y: 48, text: ["", "a hint", "lead-in", "waiting!"][set], size: 8, color: S.gold });
    /* the film: one pin per time it is said, spaced by the scenes between */
    const span = Math.min(0.94, ((uses - 1) * sp) / 60);
    const pins = [];
    for (let i = 0; i < uses; i++) pins.push({ p: 0.03 + (uses > 1 ? (i * span) / (uses - 1) : 0), color: S.gold });
    out += film(k, 140, 92, 172, { pins, ends: false });
    out += k.label({ x: 140, y: 86, text: `said ${uses}× · every ${sp} scenes`, size: 8, color: "#ccc", anchor: "start" });
    /* held back: crossed-out bubbles */
    for (let i = 0; i < wh; i++) out += `<rect x="${r1(140 + i * 18)}" y="66" width="14" height="10" rx="4" fill="none" stroke="#888"/><line x1="${r1(140 + i * 18)}" y1="76" x2="${r1(154 + i * 18)}" y2="66" stroke="${S.red}" stroke-width="1.5"/>`;
    out += strip(k, [g.num("uses", "Times said", "×"), g.steps("setUp", "Set up"), g.word("twist", "How it changes"), g.num("spacing", "Scenes between", ""), g.num("withheld", "Held back", "×", S.red), g.steps("delivery", "Said")]);
    return out + k.caption(`Said ${uses} times · ${v("delivery")} · ${v("twist")}`);
  });

  /* ======================= sceneButton ======================= */
  look("sceneButton", (v, k, g) => {
    const sz = idx(v, "size", 4);
    const form = idx(v, "form", 5);
    const len = v.n("length");
    const who = idx(v, "who", 4);
    const cut = Math.round(v.n("cutAfter"));
    let out = stage(k, { spot: 120 });
    /* the scene as a bar: the button at its end, then beats of hold, then the cut */
    const btn = (len / 4) * 70;
    const cw = cut * 14;
    const sw = 280 - btn - cw - 4;
    out += `<rect x="20" y="8" width="${r1(sw)}" height="10" rx="2" fill="#3a3946"/>` + k.label({ x: 24, y: 16, text: "the scene", size: 7, color: "#bbb", anchor: "start" });
    out += `<rect x="${r1(22 + sw)}" y="8" width="${r1(btn)}" height="10" rx="2" fill="${S.gold}"/>`;
    for (let i = 0; i < cut; i++) out += `<rect x="${r1(24 + sw + btn + i * 14)}" y="9" width="11" height="8" rx="2" fill="#555"/>`;
    out += `<line x1="${r1(26 + sw + btn + cw)}" y1="4" x2="${r1(26 + sw + btn + cw)}" y2="22" stroke="${S.red}" stroke-width="2"/>` + k.label({ x: 26 + sw + btn + cw, y: 31, text: "CUT", size: 8, color: S.red, weight: 700 });
    /* who gets it */
    const wx = [90, 120, 170, 120][who];
    if (who === 3) out += `<rect x="108" y="88" width="24" height="24" rx="3" fill="#8a6a3a" stroke="${S.ink}"/><circle cx="120" cy="84" r="6" fill="${S.gold}" stroke="${S.ink}"/>`;
    else out += guy(k, wx, { s: [1, 0.8, 0.5][who], color: [S.orange, S.blue, S.grey][who], alpha: who === 2 ? 0.75 : 1, mood: 0.6, look: 1 });
    if (who !== 0) out += guy(k, 46, { s: 0.85, color: S.orange, mood: 0.1, look: 1 });
    /* what the button is, next to them */
    const fy = who === 3 ? 66 : 40;
    out += [
      k.bubble({ x: wx + 36, y: fy, w: 58, h: 20, text: "...right.", tail: -26, size: 9 }),
      k.label({ x: wx + 22, y: fy + 4, text: "👀", size: 16, anchor: "start" }),
      motion(k, wx - 12, fy + 30, 3, 18, 1) + burst(k, wx + 28, fy + 26, 9, S.red),
      burst(k, wx + 36, fy, 14, S.ice, "BOING", 7),
      k.label({ x: wx + 36, y: fy + 4, text: "✂ CUT", size: 11, color: "#fff", weight: 700 }),
    ][form];
    /* the laugh */
    out += ha(k, 262, 74, sz / 3, -10);
    out += strip(k, [g.steps("size", "Last laugh"), g.word("form", "The button"), g.num("length", "Length", " s"), g.word("who", "Who gets it"), g.num("cutAfter", "Beats to cut", "", S.red)]);
    return out + k.caption(`Button: ${v("form")} · ${v("size")}`);
  });

  /* ======================= comicWant ======================= */
  const WANT = ["🍪", "🪑", "💬", "🎖️", "🚪"];
  look("comicWant", (v, k, g) => {
    const gap = v.n("effortGap");
    const want = idx(v, "want", 5);
    const plan = idx(v, "plan", 4);
    const obs = Math.round(v.n("obstacles"));
    const gets = idx(v, "getsIt", 4);
    let out = stage(k);
    /* effort (tall red bar) against want (tiny gold bar) */
    const eh = 10 + gap * 15;
    out += `<rect x="10" y="${r1(FY - eh)}" width="12" height="${r1(eh)}" rx="2" fill="${S.red}"/>` + k.label({ x: 16, y: FY - eh - 4, text: "effort", size: 7, color: S.red });
    out += guy(k, 56, { s: 0.85, color: S.orange, mood: 0.3 - gap * 0.15, lean: 4 + gap * 3, arms: 0.3 + gap * 0.1, look: 1 });
    out += sweat(k, 66, 42, gap);
    /* the plan: a board with arrows */
    const pl = [0, 1, 3, 6][plan];
    if (plan) {
      out += k.panel({ x: 86, y: 10, w: 60, h: 40, w2: 1.5 });
      for (let i = 0; i < pl; i++) out += k.arrow({ x1: 92 + (i % 3) * 18, y1: 18 + Math.floor(i / 3) * 16, x2: 104 + (i % 3) * 18, y2: 26 + Math.floor(i / 3) * 16, color: S.blue, w: 1.2 });
      if (plan === 3) out += k.text({ x: 116, y: 47, text: "OPERATION", size: 6, color: S.red, weight: 900 });
    } else out += k.label({ x: 116, y: 30, text: "no plan", size: 9, color: "#888" });
    /* things in the way */
    for (let i = 0; i < obs; i++) out += `<rect x="${r1(112 + i * 18)}" y="${FY - 12 - (i % 2) * 6}" width="12" height="${12 + (i % 2) * 6}" fill="#6b5a45" stroke="${S.ink}"/>`;
    /* the tiny want */
    out += `<rect x="290" y="${FY - 4}" width="10" height="4" fill="${S.gold}"/>` + k.text({ x: 295, y: FY - 8, text: WANT[want], size: 12 });
    out += k.label({ x: 295, y: 70, text: ["✓ got it", "✓ at a cost", "💥 ruined", "✗ never"][gets], size: 9, color: [S.green, S.gold, S.red, "#bbb"][gets] });
    out += strip(k, [g.num("effortGap", "Want vs effort", " of 5", S.red), g.word("want", "Wants"), g.steps("plan", "Plan"), g.num("obstacles", "In the way", ""), g.steps("getsIt", "Gets it")]);
    return out + k.caption(`Wants ${v("want")} · gap ${Math.round(gap)} of 5 · ${v("getsIt")}`);
  });

  /* ======================= roast ======================= */
  look("roast", (v, k, g) => {
    const sting = v.n("sting");
    const aff = idx(v, "affection", 4);
    const tg = idx(v, "target", 5);
    const cb = idx(v, "comeback", 4);
    const crowd = Math.round(v.n("crowd"));
    let out = stage(k, { spot: 160 });
    const self = tg === 0;
    const rx = self ? 160 : 70;
    const tx = 240;
    out += guy(k, rx, { s: 0.9, color: S.orange, mood: aff >= 2 ? 0.7 : 0.3, arms: 0.4, look: self ? 0 : 1 });
    if (!self) out += guy(k, tx, { s: [1, 0.9, 0.9, 1.15, 0.6][tg], color: [S.orange, S.blue, S.red, S.purple, S.grey][tg], mood: 0.2 - sting * 0.15, look: -1 });
    if (tg === 3) out += `<path d="M${tx - 8} 26 l3 -8 l5 6 l5 -6 l3 8 Z" fill="${S.gold}" stroke="${S.ink}"/>`;
    /* the sting: a bolt, bigger and redder */
    const bx1 = self ? rx + 30 : rx + 16;
    const bx2 = self ? rx + 4 : tx - 14;
    const bc = k.mix("#ffd166", "#e4572e", sting / 5);
    out += `<path d="M${r1(bx1)} 48 L${r1((bx1 + bx2) / 2)} ${r1(40 - sting * 2)} L${r1((bx1 + bx2) / 2 + 4)} ${r1(54 + sting * 2)} L${r1(bx2)} 48" fill="none" stroke="${bc}" stroke-width="${r1(1 + sting * 1.1)}" stroke-linejoin="round"/>`;
    if (sting >= 4) out += burst(k, bx2, 46, 6 + sting, S.red);
    /* the love under it */
    out += [k.label({ x: rx, y: 14, text: "😠", size: 12 }), k.label({ x: rx, y: 14, text: "❄", size: 13, color: S.ice }), k.label({ x: rx, y: 14, text: "♥", size: 11, color: S.pink }), k.label({ x: rx, y: 14, text: "♥ ♥ ♥", size: 12, color: S.pink })][aff];
    /* the comeback */
    if (cb) out += k.bubble({ x: (self ? 230 : tx) + 6, y: 18, w: [0, 44, 58, 74][cb], h: [0, 16, 20, 24][cb], text: ["", "um...", "oh yeah?", "BURN!"][cb], tail: -8, size: [9, 8, 9, 11][cb] });
    /* people watching */
    out += heads(k, crowd, 104, 96, 96, { r: 3.4, color: (i) => (i % 3 ? "#c9b49a" : "#e0c39a") });
    if (crowd >= 10) out += ha(k, 150, 86, crowd / 20, -6, "OOH");
    out += strip(k, [g.num("sting", "Sting", " of 5", S.red), g.steps("affection", "Love", S.pink), g.word("target", "Mocked"), g.steps("comeback", "Comeback"), g.num("crowd", "Watching", " people")]);
    return out + k.caption(`Roasting ${v("target")} · sting ${Math.round(sting)} of 5 · ${v("affection")}`);
  });

  /* ======================= parody ======================= */
  const ORIG = ["🤠", "🎬", "👤", "📺", "▶"];
  look("parody", (v, k, g) => {
    const cl = idx(v, "closeness", 4) / 3;
    const tg = idx(v, "target", 5);
    const aff = idx(v, "affection", 3);
    const know = Math.round(v.n("knowNeeded"));
    const bend = idx(v, "bend", 3);
    let out = stage(k);
    /* the original */
    out += k.panel({ x: 18, y: 10, w: 116, h: 78, fill: "#2e3a4e" }) + k.label({ x: 76, y: 8 - 1, text: "the original", size: 8, color: "#bbb" });
    out += k.text({ x: 40, y: 34, text: ORIG[tg], size: 16 }) + k.person({ x: 90, y: 82, s: 0.6, color: S.blue, arms: 0.6 });
    /* the copy: closer means same place and stronger, bent means tipped and silly */
    const dx = (1 - cl) * 26;
    const rot = [0, 9, 24][bend];
    out += k.panel({ x: 186, y: 10, w: 116, h: 78, fill: "#3e2f2a" }) + k.label({ x: 244, y: 7, text: "the copy", size: 8, color: "#bbb" });
    out += `<g opacity="${r1(0.35 + cl * 0.65)}" transform="rotate(${rot} 244 50)">` + (cl > 0 ? k.text({ x: 208 + dx, y: 34, text: ORIG[tg], size: 16 }) : "") + k.person({ x: 258 - dx, y: 82, s: 0.6, color: S.orange, arms: 0.6 * cl, mood: [-0.2, 0.4, 0.9][aff] }) + `</g>`;
    if (bend === 2) out += k.text({ x: 280, y: 30, text: "🦆", size: 14 });
    out += k.label({ x: 160, y: 52, text: ["≈", "≅", "=", "="][Math.round(cl * 3)], size: 18, color: S.gold, weight: 900 });
    out += k.label({ x: 160, y: 72, text: ["😏", "😜", "♥"][aff], size: 12, color: S.pink });
    /* the audience: a question mark over everyone who would not get it */
    for (let i = 0; i < 6; i++) out += k.face({ x: 108 + i * 21, y: 104, r: 6, mood: i < know ? -0.2 : 0.6, color: "#c9b49a" }) + (i < know ? k.label({ x: 108 + i * 21, y: 94, text: "?", size: 8, color: "#ddd", weight: 700 }) : "");
    out += strip(k, [g.steps("closeness", "Copy"), g.word("target", "Copies"), g.steps("affection", "Love", S.pink), g.num("knowNeeded", "Need to know it", " of 5"), g.steps("bend", "Bent")]);
    return out + k.caption(`Parody of ${v("target")} · ${v("closeness")} · ${v("affection")}`);
  });

  /* ======================= satire ======================= */
  const SAT = ["🛒", "🏭", "👥", "🏛️", "🍿"];
  look("satire", (v, k, g) => {
    const bite = v.n("bite");
    const tg = idx(v, "target", 5);
    const hid = idx(v, "hidden", 4);
    const real = idx(v, "realism", 3);
    const les = idx(v, "lesson", 3);
    let out = stage(k, { bg: ["#1a1d22", "#1f2533", "#2a1f3a"][real] });
    /* the thing it mocks */
    out += k.text({ x: 50, y: 70, text: SAT[tg], size: 30 }) + k.label({ x: 50, y: 92, text: v("target"), size: 8, color: "#bbb" });
    /* the mirror held up to it: teeth along its rim */
    out += `<rect x="128" y="12" width="96" height="92" rx="8" fill="#2c3346" stroke="${k.mix("#bbbbbb", "#e4572e", bite / 5)}" stroke-width="${r1(2 + bite * 0.6)}"/>`;
    const teeth = Math.round(bite * 2);
    for (let i = 0; i < teeth; i++) out += `<path d="M${r1(132 + i * 9)} 12 l4 ${r1(5 + bite)} l4 ${r1(-5 - bite)} Z" fill="#fff" stroke="${S.ink}" stroke-width="0.6"/>`;
    /* the reflection, more cartoon the less real */
    out += `<g transform="scale(-1 1) translate(-352 0)">` + k.text({ x: 176, y: 62, text: SAT[tg], size: [26, 32, 40][real] }) + `</g>`;
    out += k.person({ x: 196, y: 100, s: [0.45, 0.5, 0.6][real], color: [S.grey, S.orange, "#ff5ab4"][real], mood: [0, 0.4, 0.9][real], arms: real * 0.5 });
    /* the point: a sign that sinks out of sight */
    const op = [1, 0.8, 0.45, 0.18][hid];
    out += `<g opacity="${op}">${chip(k, 272, 30 + hid * 18, "the point", S.red, "middle")}</g>`;
    if (hid >= 2) out += `<path d="M236 ${r1(28 + hid * 12)} q9 -5 18 0 q9 5 18 0 q9 -5 18 0 q9 5 18 0" fill="none" stroke="${S.ice}" stroke-width="1.5"/>`;
    /* a fix offered: a bulb */
    out += k.text({ x: 272, y: 104, text: "💡", size: [12, 14, 18][les], alpha: [0.15, 0.55, 1][les] }) + k.label({ x: 296, y: 102, text: ["", "a hint", "a fix"][les], size: 8, color: S.gold });
    out += strip(k, [g.num("bite", "Sharp", " of 5", S.red), g.word("target", "Mocks"), g.steps("hidden", "Point is"), g.steps("realism", "Looks"), g.steps("lesson", "Offers a fix", S.green)]);
    return out + k.caption(`Satire of ${v("target")} · bite ${Math.round(bite)} of 5 · ${v("hidden")}`);
  });

  /* ======================= metaJoke ======================= */
  const META = ["RULES", "$ BUDGET", "ACTORS", "PLOT", "YOU"];
  look("metaJoke", (v, k, g) => {
    const aw = v.n("awareness");
    const ab = idx(v, "about", 5);
    const who = idx(v, "who", 4);
    const fr = idx(v, "frequency", 4);
    const br = idx(v, "breaksWorld", 3);
    let out = stage(k);
    /* the film frame, bent or shattered */
    const fp = ["M60 10 H260 V106 H60 Z", "M60 10 Q160 2 260 10 Q268 58 260 106 Q160 114 60 106 Q52 58 60 10 Z", "M60 10 H180 L170 30 L196 10 H260 V106 H60 Z"][br];
    out += `<path d="${fp}" fill="#22303f" stroke="#ddd" stroke-width="2"/>`;
    if (br === 2) out += `<path d="M190 10 L180 46 L214 64 M180 46 L150 70 L166 106 M214 64 L260 70" fill="none" stroke="#ddd" stroke-width="1.5"/>`;
    /* the character: steps out of the frame and looks at us as awareness grows */
    const cx = 120 + aw * 24;
    out += guy(k, cx, { s: 0.8, y: 104, color: S.orange, mood: 0.5, look: aw >= 3 ? 0 : -1, arms: aw / 5 });
    if (aw >= 3) out += k.label({ x: cx, y: 18, text: "👁 at us", size: 8, color: S.gold });
    /* what it jokes about */
    out += chip(k, 100, 26, META[ab], "#4a3a20", "middle");
    /* who makes it */
    out += [
      k.bubble({ x: cx - 40, y: 40, w: 56, h: 18, text: "classic.", tail: 18, size: 9 }),
      k.mic({ x: 34, y: 50, s: 0.8 }) + k.label({ x: 34, y: 30, text: "narrator", size: 7, color: "#bbb" }),
      `<rect x="80" y="84" width="96" height="16" fill="#000" opacity="0.7"/>` + k.label({ x: 128, y: 96, text: "yes, really", size: 9, color: "#fff" }),
      k.label({ x: 30, y: 60, text: "✂", size: 18, color: "#fff" }) + `<line x1="40" y1="56" x2="290" y2="56" stroke="#fff" stroke-dasharray="5 3"/>`,
    ][who];
    /* how often: ticks across the top */
    const n = [1, 3, 6, 12][fr];
    for (let i = 0; i < n; i++) out += `<rect x="${r1(264 + (i % 6) * 8)}" y="${4 + Math.floor(i / 6) * 8}" width="5" height="6" fill="${S.gold}"/>`;
    out += strip(k, [g.num("awareness", "Self-aware", " of 5"), g.word("about", "About"), g.word("who", "Made by"), g.steps("frequency", "How often"), g.steps("breaksWorld", "Story world", S.red)]);
    return out + k.caption(`A joke about ${v("about")} · ${v("breaksWorld")}`);
  });

  /* ======================= jokeBombs ======================= */
  look("jokeBombs", (v, k, g) => {
    const fl = idx(v, "flatness", 4);
    const conf = v.n("confidence");
    const rec = idx(v, "recovery", 4);
    const sil = v.n("silence");
    const later = idx(v, "laterLands", 3);
    let out = stage(k, { spot: 70 });
    out += guy(k, 70, { s: 0.95, color: S.orange, mood: -0.4 + conf * 0.2, arms: -0.2 + conf * 0.2, lean: -6 + conf * 3, look: 1 });
    out += k.mic({ x: 88, y: 52, s: 0.7 });
    out += sweat(k, 80, 36, (5 - conf) * 0.8);
    out += k.bubble({ x: 82, y: 14, w: [64, 86, 64, 92][rec], h: 20, text: ["anyway...", "see, because...", "OK, again:", "AND ANOTHER!"][rec], tail: -8, size: 9 });
    /* the audience */
    for (let i = 0; i < 6; i++) out += k.face({ x: 170 + (i % 3) * 30, y: 70 + Math.floor(i / 3) * 26, r: 10, mood: [0.25, 0.35, 0, -0.8][fl], brows: fl === 3 ? -0.8 : 0, mouth: fl === 0 && i % 2 ? 0.2 : 0, look: -1 });
    out += k.label({ x: 200, y: 52, text: ["heh.", "polite smiles", "...", "ew"][fl], size: 9, color: "#ccc" });
    /* crickets in the silence */
    const cr = Math.ceil(sil / 2);
    for (let i = 0; i < cr; i++) out += k.label({ x: 270 + (i % 2) * 18, y: 70 + i * 14, text: "🦗", size: 10 });
    out += stopwatch(k, 160, 10, 90, sil, 6, S.ice, `${fmt(sil)} s quiet`);
    /* later: a late laugh or a payoff */
    if (later === 1) out += ha(k, 290, 34, 0.1, -10, "ha");
    if (later === 2) out += burst(k, 290, 34, 14, S.gold, "LATER", 6);
    out += strip(k, [g.steps("flatness", "Falls", S.red), g.num("confidence", "Confidence", " of 5"), g.word("recovery", "Next"), g.num("silence", "Silence", " s", S.ice), g.steps("laterLands", "Lands later", S.green)]);
    return out + k.caption(`The joke gets ${v("flatness")} · they ${v("recovery")}`);
  });

  /* ======================= roomStops ======================= */
  look("roomStops", (v, k, g) => {
    const st = idx(v, "stop", 4);
    const snd = idx(v, "sound", 4);
    const hd = Math.round(v.n("heads"));
    const hold = v.n("hold");
    const rs = idx(v, "restart", 3);
    let out = stage(k, { spot: 60 });
    out += guy(k, 60, { s: 0.95, color: S.orange, mood: -0.3, arms: 0.5, look: 1 });
    out += k.label({ x: 60, y: 14, text: ["oops", "!", "!!", "!!!"][st], size: 11, color: S.red, weight: 900 });
    /* the heads that turn to stare */
    for (let i = 0; i < Math.min(hd, 30); i++) out += k.face({ x: 136 + (i % 12) * 14, y: 46 + Math.floor(i / 12) * 15, r: 6, mood: st === 3 ? -0.3 : 0, eyes: 0.5 + st * 0.16, look: -1, color: "#d8c3a5" });
    if (!hd) out += k.label({ x: 210, y: 52, text: "nobody turns", size: 9, color: "#888" });
    /* how frozen the room is */
    out += k.tint({ color: "#7fb7ff", alpha: st * 0.06 });
    if (st >= 2) out += k.label({ x: 210, y: 100, text: st === 3 ? "dead silence" : "frozen", size: 9, color: S.ice });
    /* the sound */
    out += k.speaker({ x: 126, y: 18, s: 0.7, level: [0.3, 0.6, 0, 0.9][snd] }) + k.label({ x: 146, y: 22, text: ["quiet", "♪ fades", "✗ cut dead", "SCRRITCH"][snd], size: 8, color: snd === 3 ? S.red : "#ccc", anchor: "start" });
    out += stopwatch(k, 210, 12, 70, hold, 6, S.ice, `${fmt(hold)} s`);
    out += k.label({ x: 210, y: 32, text: ["then slowly back", "then all at once", "until a line"][rs], size: 8, color: S.green, anchor: "start" });
    out += strip(k, [g.steps("stop", "Stops"), g.word("sound", "Sound"), g.num("heads", "Heads turn", ""), g.num("hold", "Holds", " s", S.ice), g.word("restart", "Restarts")]);
    return out + k.caption(`Everything stops: ${v("stop")} · ${hd} heads turn`);
  });

  /* ======================= comicSuspense ======================= */
  const peel = (x, y, s) => `<path d="M${r1(x - 7 * s)} ${r1(y)} q${r1(7 * s)} ${r1(-16 * s)} ${r1(14 * s)} 0 q${r1(-7 * s)} ${r1(-6 * s)} ${r1(-14 * s)} 0 Z" fill="${S.gold}" stroke="${S.ink}"/>`;
  look("comicSuspense", (v, k, g) => {
    const lead = v.n("lead");
    const clr = idx(v, "clarity", 4);
    const nm = Math.round(v.n("nearMisses"));
    const pay = idx(v, "payoff", 4);
    const frm = idx(v, "framing", 3);
    const px = 290;
    let out = stage(k);
    out += peel(px, FY, 1.1);
    /* how clearly we are shown it */
    if (clr >= 1) out += k.ring({ x: px, y: FY - 6, r: 10 + clr * 3, color: S.red, w: 1 + clr * 0.5 });
    if (clr >= 2) out += k.arrow({ x1: px - 10, y1: 40, x2: px, y2: FY - 22, color: S.red, w: 2 });
    for (let i = 0; i < (clr === 3 ? 3 : 0); i++) out += k.label({ x: px - 30 + i * 14, y: 30, text: "!", size: 12, color: S.red, weight: 900 });
    /* the walker, as many beats away as the lead */
    const wx = px - 26 - lead * 22;
    out += guy(k, wx, { s: 0.8, color: S.orange, mood: 0.6, walk: 0.7, look: 1 });
    out += beats(k, wx + 14, FY - 4, lead, "#777", 22);
    /* near escapes behind them */
    for (let i = 0; i < nm; i++) out += `<g opacity="0.5">${peel(wx - 24 - i * 16, FY, 0.6)}</g>` + k.label({ x: wx - 24 - i * 16, y: FY - 12, text: "✓", size: 8, color: S.green });
    /* the payoff */
    out += [
      burst(k, px, 70, 12, S.gold, "SLIP", 7),
      burst(k, px, 66, 18, S.red, "CRASH", 8),
      guy(k, px - 4, { s: 0.6, color: S.blue, mood: -0.6, arms: 1 }) + k.label({ x: px - 4, y: 50, text: "not me!", size: 8, color: S.blue }),
      k.label({ x: px, y: 60, text: "steps over", size: 8, color: "#ccc" }),
    ][pay];
    /* the frame */
    const F = [[wx - 30, 20, 70, 98], [Math.min(wx - 30, 200), 14, Math.max(110, px + 24 - Math.min(wx - 30, 200)), 104], [6, 6, 308, 112]][frm];
    out += k.frame({ x: F[0], y: F[1], w: F[2], h: F[3], color: "#fff", w2: 1.5, dash: "5 3" });
    out += strip(k, [g.num("lead", "We see it", " beats"), g.steps("clarity", "Shown"), g.num("nearMisses", "Near escapes", "", S.green), g.word("payoff", "Pays off"), g.steps("framing", "Framed")]);
    return out + k.caption(`Seen coming ${Math.round(lead)} beats ahead · ${v("payoff")}`);
  });

  /* ======================= improvFeel ======================= */
  look("improvFeel", (v, k, g) => {
    const loose = v.n("looseness");
    const ov = idx(v, "overlap", 4);
    const tan = Math.round(v.n("tangents"));
    const stb = Math.round(v.n("stumbles"));
    const tk = idx(v, "takes", 3);
    let out = stage(k, { spot: 150 });
    const xs = [80, 150, 220];
    xs.forEach((x, i) => (out += guy(k, x, { s: 0.8, color: [S.orange, S.blue, S.green][i], mood: 0.3 + loose * 0.1, lean: (i - 1) * loose * 2.4, arms: loose * 0.12 * (i % 2 ? 1 : -1) })));
    /* talking over each other: bubbles that pile up */
    const nb = [1, 2, 3, 4][ov];
    const spread = [0, 46, 30, 16][ov];
    for (let i = 0; i < nb; i++) out += k.bubble({ x: 100 + i * spread + (ov === 0 ? 50 : 0), y: 18 + (i % 2) * 8, w: 56, h: 18, text: ["so,", "wait,", "no but", "and!"][i], tail: -10, size: 9 });
    /* side jokes */
    for (let i = 0; i < tan; i++) out += `<circle cx="${r1(22 + (i % 2) * 18)}" cy="${r1(20 + Math.floor(i / 2) * 18)}" r="7" fill="#fff" stroke="${S.ink}"/>` + k.label({ x: 22 + (i % 2) * 18, y: 23 + Math.floor(i / 2) * 18, text: "ha", size: 6, color: S.ink });
    /* stumbles */
    for (let i = 0; i < stb; i++) out += k.label({ x: 260 + (i % 2) * 24, y: 56 + Math.floor(i / 2) * 13, text: "uh-", size: 9, color: S.red, weight: 700 });
    /* the script, torn up as it loosens */
    out += `<g transform="rotate(${r1(-loose * 8)} 30 104)">${k.panel({ x: 16, y: 92, w: 26, h: 18, w2: 1 })}</g>` + (loose >= 3 ? `<line x1="16" y1="92" x2="42" y2="110" stroke="${S.red}" stroke-width="2"/>` : "");
    /* the takes: clapperboards */
    const nt = [1, 3, 7][tk];
    for (let i = 0; i < nt; i++) out += `<rect x="${r1(276 + i * 3)}" y="${r1(10 + i * 3)}" width="22" height="14" fill="#333" stroke="#ddd"/>`;
    out += strip(k, [g.num("looseness", "Loose", " of 5"), g.steps("overlap", "Talk over"), g.num("tangents", "Side jokes", ""), g.num("stumbles", "Stumbles", "", S.red), g.steps("takes", "Versions")]);
    return out + k.caption(`Loose ${Math.round(loose)} of 5 · ${v("overlap")} overlap · ${v("takes")}`);
  });

  /* ======================= cartoonLogic ======================= */
  look("cartoonLogic", (v, k, g) => {
    const bend = v.n("bend");
    const rec = idx(v, "recovery", 4);
    const con = idx(v, "consistency", 4);
    const aw = idx(v, "awareness", 3);
    const dl = v.n("delay");
    let out = stage(k);
    /* the cliff */
    out += `<path d="M0 60 H120 L126 ${FY} H0 Z" fill="#6b5a45" stroke="${S.ink}"/>`;
    /* the runner, out over the edge as far as physics bends */
    const cx = 110 + bend * 26;
    out += guy(k, cx, { y: 60, s: 0.7, color: S.orange, mood: aw === 0 ? 0.7 : -0.4, walk: aw === 0 ? 0.8 : 0, arms: aw === 2 ? 0.9 : 0.2, look: aw === 1 ? 0 : 1 });
    if (aw === 1) out += k.label({ x: cx, y: 12, text: "uh oh", size: 9, color: "#ddd" });
    if (aw === 2) out += k.panel({ x: cx + 6, y: 4, w: 32, h: 14, w2: 1 }) + k.label({ x: cx + 22, y: 14, text: "BYE", size: 8, color: S.ink, weight: 700 });
    /* gravity's delay: a dashed fall line */
    out += `<line x1="${r1(cx)}" y1="64" x2="${r1(cx)}" y2="${r1(64 + 8 + dl * 10)}" stroke="#ddd" stroke-dasharray="3 3"/>` + k.label({ x: cx + 6, y: 80, text: `${fmt(dl)} s hang`, size: 8, color: "#ccc", anchor: "start" });
    /* how fast hurts heal */
    out += k.text({ x: 280, y: 104, text: ["🩼", "🩹", "⭐", "✨"][rec], size: 16 }) + k.label({ x: 280, y: 82, text: ["weeks", "a scene", "a shot", "instant"][rec], size: 8, color: "#bbb" });
    /* the rule book: scribbled or ruled */
    out += k.panel({ x: 10, y: 10, w: 40, h: 34, w2: 1.2 });
    for (let i = 0; i < 4; i++) out += con >= 2 ? `<line x1="15" y1="${17 + i * 7}" x2="${con === 3 ? 45 : 40}" y2="${17 + i * 7}" stroke="#555" stroke-width="1.5"/>` : `<path d="M15 ${17 + i * 7} q6 ${con ? -2 : -5} 12 0 q6 ${con ? 2 : 5} 12 0" fill="none" stroke="${S.red}" stroke-width="1.2"/>`;
    out += strip(k, [g.num("bend", "Physics bends", " of 5"), g.steps("recovery", "Heals"), g.steps("consistency", "Rules"), g.steps("awareness", "They know"), g.num("delay", "Gravity delay", " s", S.ice)]);
    return out + k.caption(`Physics bent ${Math.round(bend)} of 5 · ${v("consistency")}`);
  });

  /* ======================= comicMontage ======================= */
  const MKIND = ["💥", "🏋️", "💄", "🕰️", "🛍️"];
  look("comicMontage", (v, k, g) => {
    const n = Math.round(v.n("shots"));
    const kind = idx(v, "kind", 5);
    const esc = v.n("escalates");
    const mus = idx(v, "music", 4);
    const sl = v.n("shotLength");
    const end = idx(v, "ending", 4);
    let out = k.bg(S.bg);
    /* the shots: wider when longer, taller and redder as it builds */
    let w = sl * 9;
    const per = (ww) => Math.max(1, Math.floor(232 / (ww + 2)));
    while (Math.ceil(n / per(w)) > 4 && w > 3) w -= 1;
    const pr = per(w);
    for (let i = 0; i < n; i++) {
      const f = n > 1 ? i / (n - 1) : 0;
      const h = 8 + esc * 2 * f;
      const x = 12 + (i % pr) * (w + 2);
      const y = 112 - Math.floor(i / pr) * 24;
      out += `<rect x="${r1(x)}" y="${r1(y - h)}" width="${r1(w)}" height="${r1(h)}" fill="${k.mix("#ffd166", "#e4572e", (esc / 5) * f)}" stroke="${S.ink}" stroke-width="0.8"/>`;
    }
    out += k.text({ x: 22, y: 20, text: MKIND[kind], size: 14 }) + k.label({ x: 36, y: 18, text: `${n} shots of ${sl} s`, size: 8, color: "#ccc", anchor: "start" });
    /* music over it */
    out += k.label({ x: 120, y: 18, text: ["no music", "♪", "♪ ♫ ♪", "♪♫ EPIC ♫♪"][mus], size: [8, 11, 12, 13][mus], color: mus === 3 ? S.red : S.ice, anchor: "start", weight: mus === 3 ? 900 : 400 });
    /* the end */
    out += k.panel({ x: 252, y: 40, w: 60, h: 60, fill: "#22212a" }) + k.text({ x: 282, y: 76, text: ["✓", "✗", "💥", "❓"][end], size: 22, color: [S.green, S.red, S.red, S.gold][end] }) + k.label({ x: 282, y: 36, text: "the end", size: 8, color: "#bbb" });
    out += strip(k, [g.num("shots", "Shots", ""), g.word("kind", "Shows"), g.num("escalates", "Builds", " of 5", S.red), g.steps("music", "Music"), g.num("shotLength", "Shot length", " s"), g.word("ending", "Ends")]);
    return out + k.caption(`Montage of ${v("kind")} · ${n} shots · ${v("ending")}`);
  });

  /* ======================= laughsToTears ======================= */
  const BRIDGE = ["💬", "👀", "🧸", "♪", "..."];
  look("laughsToTears", (v, k, g) => {
    const dir = idx(v, "direction", 3);
    const spd = idx(v, "speed", 4);
    const dep = v.n("depth");
    const br = idx(v, "bridge", 5);
    const ret = idx(v, "returnLaugh", 4);
    let out = k.bg(S.bg);
    const b = { x: 50, y: 14, w: 220, h: 90 };
    out += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="5" fill="#1d1d24" stroke="#33333d"/>`;
    out += k.label({ x: b.x + 4, y: b.y + 10, text: "laughs", size: 7, color: S.gold, anchor: "start" }) + k.label({ x: b.x + 4, y: b.y + b.h - 4, text: "tears", size: 7, color: S.ice, anchor: "start" });
    const hi = 0.9;
    const lo = 0.5 - dep * 0.09;
    const wd = [0.3, 0.14, 0.05, 0.01][spd];
    const sm = (t, c) => {
      const x = k.clamp((t - (c - wd / 2)) / wd, 0, 1);
      return x * x * (3 - 2 * x);
    };
    const back = [2, 0.92, 0.7, 0.55][ret];
    const f = (t) => (dir === 0 ? hi - (hi - lo) * sm(t, 0.38) + (hi - lo) * sm(t, back) : dir === 2 ? lo + (hi - lo) * sm(t, 0.38) : hi - (hi - lo) * (sm(t, 0.25) - sm(t, 0.5) + sm(t, 0.75)));
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      pts.push(`${r1(b.x + t * b.w)},${r1(b.y + b.h - k.clamp(f(t), 0, 1) * b.h)}`);
    }
    out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${S.gold}" stroke-width="2.5" stroke-linejoin="round"/>`;
    /* what carries the switch */
    out += k.text({ x: b.x + 0.38 * b.w, y: b.y + b.h / 2 + 4, text: BRIDGE[br], size: 13, color: "#fff" });
    /* the laugh coming back */
    if (ret && dir !== 2) out += ha(k, b.x + Math.min(0.95, back) * b.w, b.y + 16, 0.2, -6, "ha");
    /* faces at the ends */
    out += k.face({ x: 26, y: 58, r: 16, mood: f(0) * 2 - 1, look: 1 }) + k.face({ x: 294, y: 58, r: 16, mood: f(1) * 2 - 1, look: -1 });
    for (let i = 0; i < Math.round(dep); i++) out += `<path d="M${r1(b.x + 0.5 * b.w + i * 10 - 20)} ${r1(b.y + b.h - lo * b.h + 6)} q-3 5 0 7 q3 -2 0 -7 Z" fill="${S.ice}"/>`;
    out += strip(k, [g.word("direction", "Turns"), g.steps("speed", "Sudden"), g.num("depth", "How sad", " of 5", S.ice), g.word("bridge", "Carried by"), g.steps("returnLaugh", "Laugh back")]);
    return out + k.caption(`${v("direction")} · ${v("speed")} · through ${v("bridge")}`);
  });

  /* ======================= selfMockery ======================= */
  const SELF = ["I'm a bit silly", "I'm a little hopeless", "I'm kind of a mess", "I'm a real mess", "I'm a total disaster", "I'm the worst, ever"];
  look("selfMockery", (v, k, g) => {
    const hr = Math.round(v.n("harshness"));
    const pur = idx(v, "purpose", 4);
    const oth = idx(v, "others", 4);
    const hon = v.n("honesty");
    const fq = idx(v, "frequency", 3);
    let out = stage(k, { spot: 100 });
    /* the truth under it: a shadow self */
    out += `<g opacity="${r1(0.08 + hon * 0.14)}">${guy(k, 82, { s: 0.95, color: "#5a6a8a", mood: -0.7 })}</g>` + (hon >= 3 ? k.label({ x: 70, y: 16, text: "true", size: 8, color: "#8aa" }) : "");
    out += guy(k, 100, { s: 0.95, color: S.orange, mood: 0.6 - hr * 0.12, arms: 0.35 });
    out += k.arrow({ x1: 124, y1: 50, x2: 110, y2: 62, color: S.gold, w: 1.5 });
    /* the jab(s) */
    const nb = [1, 2, 3][fq];
    for (let i = 0; i < nb; i++) out += k.bubble({ x: 160 + i * 6, y: 14 + i * 16, w: 112, h: 18, text: SELF[hr], tail: -40, size: 9 }).replace(/fill="#1c1712" text-anchor/, `fill="${k.mix("#1c1712", "#c0392b", hr / 5)}" text-anchor`);
    /* why they do it */
    out += k.text({ x: 100, y: 22, text: ["✨", "🛡️", "💔", "✔"][pur], size: 14 });
    /* the others */
    const om = [0.8, -0.2, -0.5, 0.5][oth];
    out += guy(k, 232, { s: 0.75, color: S.blue, mood: om, look: -1 }) + guy(k, 278, { s: 0.75, color: S.green, mood: om, look: -1 });
    out += chip(k, 255, 70, ["ha ha", "um...", "no, you're not!", "yep, true"][oth], ["#2f4a36", "#33323d", "#2c3346", "#4a2a2a"][oth], "middle");
    out += strip(k, [g.num("harshness", "Harsh", " of 5", S.red), g.word("purpose", "Why"), g.word("others", "Others"), g.num("honesty", "Truth under it", " of 5", "#8aa"), g.steps("frequency", "How often")]);
    return out + k.caption(`Mocking themselves ${v("purpose")} · others ${v("others")}`);
  });

  /* ======================= punchingBag ======================= */
  look("punchingBag", (v, k, g) => {
    const loss = Math.round(v.n("losses"));
    const sym = Math.round(v.n("sympathy"));
    const who = idx(v, "who", 3);
    const aw = idx(v, "aware", 3);
    const tn = idx(v, "turn", 3);
    let out = stage(k, { spot: 150 });
    out += guy(k, 150, { s: 0.95, color: S.blue, mood: [0.6, -0.5, -0.2][aw], arms: [0.1, -0.6, 0.9][aw], lean: aw === 1 ? 6 : 0, eyes: aw === 1 ? 0.4 : 0.9 });
    if (aw === 2) out += k.label({ x: 150, y: 14, text: "HEY!", size: 10, color: S.red, weight: 900 });
    /* who piles on */
    if (who === 0) out += k.text({ x: 150, y: 28, text: "🥧", size: 16 }) + k.text({ x: 180, y: 18, text: "🪨", size: 13 }) + `<line x1="150" y1="32" x2="150" y2="38" stroke="#eee"/>`;
    else {
      const nb = who === 1 ? 1 : 4;
      for (let i = 0; i < nb; i++) out += guy(k, 210 + i * 24, { s: 0.75, color: S.red, mood: 0.6, arms: 0.4, look: -1 });
    }
    /* tally of losses */
    for (let i = 0; i < loss; i++) out += `<line x1="${r1(14 + i * 6 + (i % 5 === 4 ? -24 : 0))}" y1="${i % 5 === 4 ? 20 : 12}" x2="${r1(14 + i * 6 + (i % 5 === 4 ? 0 : 0))}" y2="${i % 5 === 4 ? 12 : 26}" stroke="${S.red}" stroke-width="2"/>`;
    out += k.label({ x: 14, y: 38, text: `lost ${loss}×`, size: 8, color: "#ccc", anchor: "start" });
    /* how much we feel for them */
    for (let i = 0; i < sym; i++) out += k.label({ x: 30 + i * 12, y: 70 - (i % 2) * 6, text: "♥", size: 11, color: S.pink });
    /* their win */
    if (tn) out += k.text({ x: 100, y: 108, text: "🏆", size: [0, 12, 24][tn] }) + k.label({ x: 100, y: 84 - tn * 6, text: tn === 2 ? "big win!" : "small win", size: 8, color: S.gold });
    out += strip(k, [g.num("losses", "Loses", "×", S.red), g.num("sympathy", "We feel for them", " of 5", S.pink), g.word("who", "Piles on"), g.steps("aware", "Takes it"), g.steps("turn", "Gets a win", S.green)]);
    return out + k.caption(`Loses ${loss} times · ${v("aware")} · ${v("turn")}`);
  });

  /* ======================= mockEpic ======================= */
  look("mockEpic", (v, k, g) => {
    const gap = v.n("gap");
    const tool = idx(v, "tools", 5);
    const pl = idx(v, "played", 3);
    const len = v.n("length");
    const pun = idx(v, "puncture", 3);
    let out = stage(k, { bg: k.mix("#17161d", "#2a2238", gap / 5) });
    /* heroic rays around a tiny sock on a pedestal */
    const n = 3 + Math.round(gap * 4);
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / Math.max(1, n - 1)) * Math.PI;
      out += `<line x1="160" y1="84" x2="${r1(160 + Math.cos(a) * (30 + gap * 22))}" y2="${r1(84 + Math.sin(a) * (24 + gap * 14))}" stroke="${S.gold}" stroke-width="1.5" opacity="0.5"/>`;
    }
    out += `<rect x="146" y="92" width="28" height="20" fill="#bbb" stroke="${S.ink}"/>` + k.text({ x: 160, y: 90, text: "🧦", size: 12 });
    /* the main tool */
    const all = tool === 4;
    if (tool === 0 || all) out += k.label({ x: 60, y: 30, text: "♪♫ BWAAM ♫♪", size: 10, color: S.ice, weight: 700 });
    if (tool === 1 || all) out += motion(k, 136, 70, 3, 22, 1) + k.label({ x: 220, y: 52, text: "0.1×", size: 10, color: "#ddd" });
    if (tool === 2 || all) out += k.cam({ x: 104, y: 106, dir: -30, s: 0.8 });
    if (tool === 3 || all) out += k.mic({ x: 270, y: 70, s: 0.8 }) + k.bubble({ x: 262, y: 30, w: 76, h: 18, text: "In a world...", tail: 4, size: 8 });
    /* how straight it is played: a watcher */
    out += guy(k, 40, { s: 0.7, color: S.blue, mood: [0.8, 0.2, 0][pl], look: 1 }) + (pl === 0 ? k.label({ x: 52, y: 52, text: "😉", size: 11 }) : "");
    out += stopwatch(k, 180, 8, 80, len, 60, S.gold, `${fmt(len)} s`);
    /* how it ends */
    if (pun === 1) out += k.label({ x: 186, y: 100, text: "pfff...", size: 9, color: "#bbb", anchor: "start" });
    if (pun === 2) out += `<path d="M230 0 L200 120 L320 120 L320 0 Z" fill="#555" opacity="0.8"/>` + k.label({ x: 270, y: 108, text: "CUT: reality", size: 8, color: "#fff" });
    out += strip(k, [g.num("gap", "Gap", " of 5"), g.word("tools", "Main tool"), g.steps("played", "Played"), g.num("length", "Runs", " s"), g.steps("puncture", "Ends", S.red)]);
    return out + k.caption(`A sock made epic with ${v("tools")} · ${v("played")}`);
  });

  /* ======================= badDisguise ======================= */
  const DKIND = ["🎭 costume", "🗣️ fake voice", "📛 fake name", "💼 fake job", "all of it"];
  look("badDisguise", (v, k, g) => {
    const bad = Math.round(v.n("badness"));
    const fool = idx(v, "fooled", 4);
    const kind = idx(v, "kind", 5);
    const slips = Math.round(v.n("slips"));
    const um = idx(v, "unmasked", 4);
    let out = stage(k, { spot: um === 3 ? 90 : 0 });
    const x = 90;
    out += guy(k, x, { s: 1, color: S.orange, mood: 0.4, look: 1 });
    /* the disguise: worse and worse */
    out += `<path d="M${x - 11} 22 h22 v-6 h-22 Z" fill="#333"/>`; /* a hat */
    if (bad >= 1) out += `<path d="M${x - 8} 43 q4 -4 8 0 q4 -4 8 0 q-4 3 -8 0 q-4 3 -8 0 Z" fill="#3a2a1a" transform="rotate(12 ${x} 43)"/>`;
    if (bad >= 2) out += k.ring({ x: x - 4, y: 35, r: 3.5, color: S.ink, w: 1.2 }) + k.ring({ x: x + 4, y: 35, r: 3.5, color: S.ink, w: 1.2 });
    if (bad >= 3) out += `<rect x="${x + 8}" y="64" width="14" height="8" fill="#fff" stroke="${S.ink}"/>` + k.label({ x: x + 15, y: 71, text: "$5", size: 6, color: S.ink });
    if (bad >= 4) out += k.panel({ x: x - 22, y: 72, w: 44, h: 14, w2: 1 }) + k.label({ x, y: 82, text: "NOT ME", size: 7, color: S.ink, weight: 900 });
    if (bad >= 5) out += k.label({ x: x - 26, y: 66, text: "it's me", size: 7, color: S.red, anchor: "end" });
    out += chip(k, 40, 14, DKIND[kind], "#33323d", "middle");
    /* bits falling off */
    for (let i = 0; i < slips; i++) out += k.dot({ x: x + 22 + (i % 3) * 7, y: 50 + i * 9, r: 2, color: "#3a2a1a" });
    /* who is fooled */
    const nf = [0, 2, 5, 6][fool];
    for (let i = 0; i < 6; i++) out += k.face({ x: 200 + (i % 3) * 32, y: 54 + Math.floor(i / 3) * 34, r: 10, mood: i < nf ? 0.6 : -0.2, brows: i < nf ? 0.4 : -0.7, look: -1 }) + k.label({ x: 210 + (i % 3) * 32, y: 44 + Math.floor(i / 3) * 34, text: i < nf ? "✓" : "?", size: 8, color: i < nf ? S.green : S.red, weight: 700 });
    /* unmasked */
    if (um === 1) out += k.label({ x: x, y: 104, text: "oops", size: 9, color: S.red, anchor: "middle" });
    if (um === 2) out += k.hand({ x: x + 26, y: 30, s: 0.4, open: 0.4 }) + k.label({ x: x + 40, y: 20, text: "ta-da", size: 8, color: S.gold });
    if (um === 3) out += burst(k, 230, 20, 12, S.red, "!!", 9);
    out += strip(k, [g.num("badness", "How bad", " of 5", S.red), g.steps("fooled", "Fooled"), g.word("kind", "Kind"), g.num("slips", "Slips", "", S.red), g.word("unmasked", "Unmasked")]);
    return out + k.caption(`Disguise ${bad} of 5 bad · fools ${v("fooled")}`);
  });

  /* ======================= comicChase ======================= */
  look("comicChase", (v, k, g) => {
    const mh = Math.round(v.n("mishaps"));
    const spd = idx(v, "speed", 4);
    const obs = idx(v, "obstacles", 3);
    const frm = idx(v, "framing", 3);
    const lp = Math.round(v.n("loops"));
    const end = idx(v, "ending", 4);
    let out = stage(k);
    const wk = [0.3, 0.55, 0.8, 1][spd];
    out += guy(k, 210, { s: 0.85, color: S.orange, mood: -0.3, walk: wk, lean: spd * 5, arms: 0.4 });
    out += guy(k, 120, { s: 0.85, color: S.blue, mood: -0.5, walk: wk, lean: spd * 5, arms: 0.7 });
    out += motion(k, 192, 60, spd + 1, 10 + spd * 12, 1) + motion(k, 102, 60, spd + 1, 10 + spd * 12, 1);
    if (spd === 3) out += k.label({ x: 160, y: 46, text: "ZOOM", size: 10, color: S.gold, weight: 900 });
    /* things in the way */
    const no = [0, 2, 5][obs];
    for (let i = 0; i < no; i++) out += `<rect x="${r1(40 + i * 56)}" y="${FY - 10}" width="12" height="10" fill="#8a6a3a" stroke="${S.ink}"/>`;
    /* mishaps: little stars */
    for (let i = 0; i < mh; i++) out += k.label({ x: 30 + (i % 5) * 60 + (Math.floor(i / 5) * 28), y: 22 + Math.floor(i / 5) * 18, text: "✶", size: 12, color: S.gold });
    /* running in circles */
    for (let i = 0; i < lp; i++) out += k.ring({ x: 290, y: 30 + i * 14, r: 6, color: S.ice, w: 1.5, dash: "8 3" });
    /* framing */
    const F = [[94, 30, 140, 86], [60, 16, 210, 100], [6, 6, 308, 112]][frm];
    out += k.frame({ x: F[0], y: F[1], w: F[2], h: F[3], color: "#fff", w2: 1.5, dash: "5 3" });
    out += chip(k, 160, 104, ["caught!", "escaped", "both fall", "wait, why?"][end], ["#4a2a2a", "#2f4a36", "#4a3a20", "#2c3346"][end], "middle");
    out += strip(k, [g.num("mishaps", "Mishaps", "", S.gold), g.steps("speed", "Speed"), g.steps("obstacles", "In the way"), g.steps("framing", "Framed"), g.num("loops", "Circles", "", S.ice), g.word("ending", "Ends")]);
    return out + k.caption(`A ${v("speed")} chase · ${mh} mishaps · ${v("ending")}`);
  });

  /* ======================= nearMiss ======================= */
  look("nearMiss", (v, k, g) => {
    const cl = idx(v, "closeness", 4);
    const cnt = Math.round(v.n("count"));
    const dr = Math.round(v.n("doors"));
    const sees = idx(v, "audienceSees", 3);
    const ct = idx(v, "caught", 3);
    let out = stage(k);
    /* doors along the back wall */
    for (let i = 0; i < dr; i++) out += `<rect x="${r1(14 + i * 37)}" y="70" width="18" height="42" fill="#5a4636" stroke="${S.ink}"/><circle cx="${r1(28 + i * 37)}" cy="92" r="1.5" fill="${S.gold}"/>`;
    /* the two of them, and what is between */
    const ax = 80;
    const bx = [270, 210, 150, 104][cl];
    if (cl === 0) out += `<rect x="150" y="30" width="6" height="82" fill="#666"/><rect x="200" y="30" width="6" height="82" fill="#666"/>`;
    if (cl === 1) out += k.text({ x: (ax + bx) / 2 + 30, y: 108, text: "🪴", size: 26 });
    if (cl === 2) out += `<rect x="120" y="60" width="4" height="52" fill="#8a6a3a"/>`;
    out += guy(k, ax, { s: 0.85, color: S.orange, look: ct ? 1 : -1, mood: ct === 2 ? -0.7 : 0.3 });
    const bside = guy(k, bx, { s: 0.85, color: S.blue, look: ct ? -1 : 1, mood: ct === 2 ? -0.7 : 0.3 });
    out += bside;
    /* what we see: one side darkened when we cannot see both */
    if (sees < 2) out += `<rect x="${r1((ax + bx) / 2)}" y="0" width="${r1(320 - (ax + bx) / 2)}" height="${FY}" fill="#000" opacity="${sees === 0 ? 0.6 : 0.3}"/>`;
    out += k.label({ x: 20, y: 16, text: ["👁 one side", "👁 now and then", "👁👁 both sides"][sees], size: 9, color: "#ddd", anchor: "start" });
    /* how many near misses */
    for (let i = 0; i < cnt; i++) out += k.label({ x: 170 + i * 16, y: 18, text: "!", size: 12, color: S.red, weight: 900 });
    if (ct === 1) out += k.label({ x: (ax + bx) / 2, y: 40, text: "at last", size: 9, color: S.green });
    if (ct === 2) out += burst(k, (ax + bx) / 2, 40, 12, S.red, "!!", 9);
    out += strip(k, [g.steps("closeness", "How close"), g.num("count", "Near misses", "", S.red), g.num("doors", "Doors", ""), g.steps("audienceSees", "We see both"), g.word("caught", "They meet")]);
    return out + k.caption(`${v("closeness")} · ${cnt} near misses · meet ${v("caught")}`);
  });

  /* ======================= tagScene ======================= */
  look("tagScene", (v, k, g) => {
    const len = v.n("length");
    const link = idx(v, "link", 4);
    const pl = idx(v, "place", 4);
    const sz = idx(v, "size", 3);
    const who = idx(v, "who", 3);
    let out = stage(k);
    /* the film with the tag where it sits */
    const at = [0.3, 0.6, 0.86, 0.94][pl];
    const span = (len / 90) * 0.18;
    out += film(k, 14, 10, 292, { spans: [{ a: k.clamp(at - span, 0, 1), b: at, color: S.gold }].concat(pl === 3 ? [{ a: 0.88, b: 0.92, color: "#555" }] : []), pins: [{ p: at, color: S.gold, label: "tag" }], ends: false });
    if (pl === 3) out += k.label({ x: 14 + 0.9 * 292, y: 34, text: "credits", size: 7, color: "#999" });
    /* its link to the story: an arc back */
    if (link) out += `<path d="M${r1(14 + at * 292)} 22 Q${r1(14 + at * 292 - 80)} ${[0, 40, 54, 30][link]} ${r1(14 + (link === 3 ? Math.min(0.99, at + 0.05) : at * 0.4) * 292)} 22" fill="none" stroke="${S.ice}" stroke-width="1.5" stroke-dasharray="${link === 1 ? "2 3" : "5 2"}"/>` + k.label({ x: 30, y: 46, text: ["", "side joke", "callback", "sets up next"][link], size: 8, color: S.ice, anchor: "start" });
    /* who is in it */
    out += guy(k, 150, { s: [0.95, 0.75, 0.75][who], color: [S.orange, S.blue, S.grey][who], mood: 0.6, arms: 0.3, look: 1 });
    if (who === 2) out += k.bubble({ x: 210, y: 60, w: 84, h: 18, text: "remember me?", tail: -40, size: 8 });
    out += ha(k, 260, 96, sz / 2, -8);
    out += stopwatch(k, 20, 96, 70, len, 90, S.gold, `${fmt(len)} s`);
    out += strip(k, [g.num("length", "Length", " s"), g.steps("link", "Link"), g.word("place", "Sits"), g.steps("size", "Laugh"), g.word("who", "Who")]);
    return out + k.caption(`Tag at ${v("place")} · ${v("link")} · ${v("size")}`);
  });

  /* ======================= comicScore ======================= */
  const INST = ["🎻🎺🥁", "🎸🥁", "🪇🔔", "kazoo"];
  look("comicScore", (v, k, g) => {
    const pf = v.n("playfulness");
    const fm = idx(v, "followsMoves", 3);
    const wr = idx(v, "wrongness", 3);
    const sd = Math.round(v.n("stopsDead"));
    const ins = idx(v, "instruments", 4);
    let out = stage(k);
    /* the staff */
    for (let i = 0; i < 5; i++) out += `<line x1="20" y1="${14 + i * 6}" x2="300" y2="${14 + i * 6}" stroke="#555"/>`;
    const N = 12;
    const rests = new Set(Array.from({ length: sd }, (_, i) => 2 + i * 2));
    for (let i = 0; i < N; i++) {
      const x = 32 + i * 22;
      if (rests.has(i)) {
        out += `<rect x="${x - 3}" y="20" width="6" height="12" fill="${S.red}"/>`;
        continue;
      }
      const y = 26 + Math.sin(i * 1.7) * pf * 2.6;
      out += `<ellipse cx="${x}" cy="${r1(y)}" rx="4" ry="3" fill="${wr === 2 ? S.gold : "#ddd"}" transform="rotate(-20 ${x} ${r1(y)})"/><line x1="${x + 4}" y1="${r1(y)}" x2="${x + 4}" y2="${r1(y - 14)}" stroke="#ddd"/>`;
      /* steps the music copies */
      if (fm === 2 || (fm === 1 && i % 4 === 0)) out += `<line x1="${x}" y1="${r1(y + 4)}" x2="${x}" y2="${FY - 30}" stroke="${S.ice}" stroke-dasharray="2 3" opacity="0.6"/>`;
    }
    /* the scene below: its mood against the music */
    out += guy(k, 110, { s: 0.75, color: S.orange, walk: 0.6, mood: [0.4, 0, -0.7][wr], lean: pf * 2 });
    out += k.label({ x: 160, y: 70, text: ["fits", "a little off", "sad scene, silly tune"][wr], size: 8, color: wr ? S.red : S.green, anchor: "start" });
    out += k.text({ x: 260, y: 100, text: INST[ins], size: ins === 3 ? 12 : 14, color: S.gold, weight: 700 });
    out += strip(k, [g.num("playfulness", "Playful", " of 5"), g.steps("followsMoves", "Copies moves", S.ice), g.steps("wrongness", "Wrong", S.red), g.num("stopsDead", "Stops", "×", S.red), g.word("instruments", "Plays")]);
    return out + k.caption(`Playful ${Math.round(pf)} of 5 · ${v("instruments")} · ${v("wrongness")}`);
  });

  /* ======================= comicRamble ======================= */
  look("comicRamble", (v, k, g) => {
    const len = v.n("length");
    const dig = v.n("dig");
    const aw = idx(v, "aware", 3);
    const li = idx(v, "listener", 4);
    const st = idx(v, "stop", 4);
    let out = stage(k);
    /* the hole they dig: a pile of dirt and a sink */
    out += `<path d="M14 ${FY} q12 ${r1(-dig * 7)} 24 0 Z" fill="#6b5a45"/>`;
    out += `<ellipse cx="60" cy="${FY + 2}" rx="${r1(10 + dig * 2)}" ry="4" fill="#000"/>`;
    out += guy(k, 60, { y: FY + dig * 1.8, s: 0.85, color: S.orange, mood: [0.6, -0.4, -0.2][aw], arms: 0.4, eyes: aw === 1 ? 1 : 0.7 });
    if (aw === 1) out += k.label({ x: 60, y: 22, text: "!", size: 12, color: S.red, weight: 900 });
    if (aw === 2) out += sweat(k, 70, 40, 3);
    /* the ramble: a trail of bubbles */
    const nb = 1 + Math.round((len - 5) / 12);
    for (let i = 0; i < nb; i++) out += `<ellipse cx="${r1(100 + i * 20)}" cy="${r1(28 + (i % 2) * 10)}" rx="11" ry="8" fill="#fff" stroke="${S.ink}"/>` + k.label({ x: 100 + i * 20, y: 31 + (i % 2) * 10, text: "...", size: 8, color: S.ink });
    /* how it stops */
    const ex = 100 + nb * 20;
    out += k.label({ x: ex, y: 34, text: ["...", "STOP!", "✂", "→"][st], size: 11, color: [S.grey, S.red, "#fff", S.gold][st], weight: 700, anchor: "start" });
    /* the listener */
    const lx = li === 3 ? 290 : 240;
    out += guy(k, lx, { s: 0.8, color: S.blue, mood: [0.5, 0, -0.8, -0.2][li], look: li === 3 ? 1 : -1, walk: li === 3 ? 0.8 : 0, alpha: li === 3 ? 0.6 : 1 });
    if (li === 1) out += k.label({ x: lx, y: 30, text: "?", size: 12, color: "#ddd", weight: 900 });
    out += stopwatch(k, 110, 80, 90, len, 90, S.gold, `${fmt(len)} s`);
    out += strip(k, [g.num("length", "Goes on", " s"), g.num("dig", "Hole", " of 5", S.red), g.steps("aware", "They know"), g.word("listener", "Listener"), g.word("stop", "Stops")]);
    return out + k.caption(`Rambling ${fmt(len)} s · hole ${Math.round(dig)} of 5 · ${v("stop")}`);
  });

  /* ======================= repeatBack ======================= */
  const ECHO = ["I ate the cake.", "You ate the cake?", "Cake.", "I. Ate. The. Cake."];
  look("repeatBack", (v, k, g) => {
    const fl = v.n("flatness");
    const form = idx(v, "form", 4);
    const rp = Math.round(v.n("repeats"));
    const who = idx(v, "speaker", 4);
    const ps = Math.round(v.n("pause"));
    let out = stage(k);
    out += guy(k, 60, { s: 0.9, color: S.orange, mood: 0.5, look: 1 });
    out += k.bubble({ x: 84, y: 16, w: 86, h: 18, text: "I ate the cake.", tail: -20, size: 9 });
    /* the one who says it back */
    const rx = [250, 250, 180, 60][who];
    if (who < 3) out += guy(k, rx, { s: who === 2 ? 0.6 : 0.9, color: [S.blue, S.orange, S.grey][who], mood: 0.4 - fl * 0.08, eyes: 0.9 - fl * 0.1, look: -1 });
    const col = k.mix("#1c1712", "#888888", fl / 5);
    for (let i = 0; i < rp; i++) {
      const bx = who === 3 ? 150 + i * 10 : rx - 30 - i * 8;
      out += k.bubble({ x: bx, y: 44 + i * 16, w: 96, h: 16, text: "", tail: who === 3 ? -60 : 30 });
      out += k.text({ x: bx, y: 48 + i * 16, text: ECHO[form], size: 8, color: col, italic: form === 3 });
    }
    /* pause before */
    out += beats(k, 130, 104, ps, "#bbb", 10);
    out += strip(k, [g.num("flatness", "Flat", " of 5"), g.word("form", "Repeated as"), g.num("repeats", "Times", "×"), g.word("speaker", "Said back by"), g.num("pause", "Pause before", " beats")]);
    return out + k.caption(`Said back ${rp}× by ${v("speaker")} · ${v("form")}`);
  });

  /* ======================= narratorGag ======================= */
  const NSAYS = ["He was brave.", "This is Bob.", "Bob was not good at this.", "Bob, stop that."];
  look("narratorGag", (v, k, g) => {
    const kind = idx(v, "kind", 4);
    const con = v.n("contradiction");
    const tm = idx(v, "timing", 3);
    const tone = idx(v, "tone", 4);
    const uses = Math.round(v.n("uses"));
    let out = stage(k);
    /* the narrator: a voice box at the top */
    out += k.mic({ x: 26, y: 26, s: 0.8 }) + k.face({ x: 54, y: 22, r: 9, mood: [0, 0.6, 0.5, -0.6][tone], brows: [0, 0.3, 0.5, -0.8][tone], mouth: tone === 3 ? 0.5 : 0 });
    out += k.bubble({ x: 140, y: 20, w: 140, h: 20, text: NSAYS[kind], tail: -60, size: 9 });
    if (tone === 2) out += k.label({ x: 216, y: 16, text: "😏", size: 10, anchor: "start" });
    /* the picture: the more it contradicts, the more it disagrees */
    out += `<rect x="90" y="44" width="140" height="68" fill="#22303f" stroke="#ddd"/>`;
    out += guy(k, 160 + con * 8, { s: 0.7, color: S.orange, mood: 0.6 - con * 0.28, lean: con * 5, walk: con / 5 });
    out += sweat(k, 170 + con * 8, 66, con * 0.6);
    if (kind === 1) out += `<rect x="90" y="44" width="140" height="68" fill="#fff" opacity="0.15"/>` + k.label({ x: 160, y: 108, text: "FREEZE", size: 8, color: "#fff", weight: 900 });
    if (kind === 3) out += k.bubble({ x: 200, y: 60, w: 40, h: 16, text: "Hey!", tail: -10, size: 9 });
    /* when it speaks */
    out += `<rect x="244" y="60" width="66" height="6" rx="3" fill="#33323d"/><rect x="${[246, 270, 294][tm]}" y="58" width="12" height="10" rx="2" fill="${S.gold}"/>` + k.label({ x: 277, y: 80, text: ["before", "during", "after"][tm], size: 8, color: "#ccc" });
    /* times it happens */
    for (let i = 0; i < uses; i++) out += `<rect x="${r1(244 + (i % 6) * 11)}" y="${88 + Math.floor(i / 6) * 10}" width="8" height="7" fill="${S.ice}"/>`;
    out += strip(k, [g.word("kind", "Joke"), g.num("contradiction", "Picture disagrees", " of 5", S.red), g.steps("timing", "Speaks"), g.word("tone", "Tone"), g.num("uses", "Times", "×", S.ice)]);
    return out + k.caption(`${v("kind")} · ${v("tone")} narrator · ${uses} times`);
  });

  /* ======================= yesAnd ======================= */
  look("yesAnd", (v, k, g) => {
    const j = Math.round(v.n("joiners"));
    const bld = v.n("building");
    const ho = idx(v, "holdout", 3);
    const len = v.n("length");
    const end = idx(v, "end", 4);
    let out = stage(k);
    /* the first one, then everyone who joins, each adding a block higher */
    const bh = 4 + bld * 2;
    let top = FY - 50;
    for (let i = 0; i <= j; i++) {
      const x = 20 + i * 26;
      out += guy(k, x, { s: 0.55, color: i === 0 ? S.orange : S.blue, mood: 0.7, arms: 0.8 });
      const y = FY - 56 - i * bh;
      out += `<rect x="${x - 9}" y="${r1(y - bh)}" width="18" height="${r1(bh)}" fill="${k.mix("#ffd166", "#e4572e", i / 8)}" stroke="${S.ink}"/>`;
      top = y - bh;
    }
    const tx = 20 + j * 26;
    out += [k.label({ x: tx, y: top - 4, text: "...", size: 10, color: "#999" }), k.label({ x: tx, y: top - 4, text: "✋", size: 12 }), burst(k, tx, top - 10, 9, S.gold), burst(k, tx, top - 10, 10, S.red, "!", 9)][end];
    /* the one who refuses */
    if (ho) out += guy(k, 290, { s: ho === 2 ? 0.9 : 0.7, color: S.red, mood: -0.5, arms: -0.6, look: -1 }) + (ho === 2 ? `<path d="M282 ${ho === 2 ? 34 : 50} h16 v-6 h-16 Z" fill="#333"/>` : "") + k.label({ x: 290, y: 20, text: "no.", size: 9, color: S.red });
    out += stopwatch(k, 230, 100, 50, len, 8, S.ice, `${fmt(len)} beats`);
    out += strip(k, [g.num("joiners", "Join", " people"), g.num("building", "Each adds", " of 5"), g.steps("holdout", "Refuses", S.red), g.num("length", "Runs", " beats", S.ice), g.word("end", "Ends")]);
    return out + k.caption(`${j} join in · ${v("end")}`);
  });

  /* ======================= corpsing ======================= */
  look("corpsing", (v, k, g) => {
    const cr = idx(v, "crack", 4);
    const kept = idx(v, "kept", 3);
    const sp = Math.round(v.n("spreads"));
    const who = idx(v, "who", 3);
    const rec = v.n("recover");
    let out = stage(k);
    /* two actors; the one who cracks */
    const crack = (on) => (on ? { mood: [0, 0.2, 0.6, 0.9][cr], eyes: cr === 3 ? 0.2 : 0.8 } : { mood: 0, eyes: 0.8 });
    out += guy(k, 80, Object.assign({ s: 0.9, color: S.orange, look: 1, arms: who !== 1 && cr === 3 ? 0.6 : 0 }, crack(who !== 1)));
    out += guy(k, 150, Object.assign({ s: 0.9, color: S.blue, look: -1, arms: who !== 0 && cr === 3 ? 0.6 : 0 }, crack(who !== 0)));
    if (cr === 3) out += ha(k, who === 1 ? 150 : 80, 26, 0.5, -8);
    if (cr === 1) out += k.label({ x: who === 1 ? 162 : 92, y: 40, text: "~", size: 10, color: S.gold });
    /* the crew behind the camera, catching it */
    out += k.cam({ x: 214, y: 76, dir: 180, s: 0.9 });
    for (let i = 0; i < 5; i++) out += k.face({ x: 240 + (i % 3) * 22, y: 64 + Math.floor(i / 3) * 24, r: 8, mood: i < sp ? 0.9 : 0, mouth: i < sp ? 0.5 : 0, look: -1 });
    /* kept in the film? */
    out += `<rect x="16" y="8" width="150" height="14" fill="#2e2d36" stroke="#555"/>`;
    for (let i = 0; i < 5; i++) out += `<rect x="${20 + i * 29}" y="10" width="25" height="10" fill="${i === 2 ? [S.bg, "#556", S.gold][kept] : "#445"}" stroke="${i === 2 && kept === 0 ? S.red : "none"}" stroke-dasharray="2 2"/>`;
    out += k.label({ x: 172, y: 19, text: ["✂ cut out", "kept quietly", "★ highlight"][kept], size: 8, color: [S.red, "#ccc", S.gold][kept], anchor: "start" });
    out += stopwatch(k, 16, 98, 60, rec, 5, S.ice, `${fmt(rec)} s to recover`);
    out += strip(k, [g.steps("crack", "Cracks", S.gold), g.steps("kept", "Kept"), g.num("spreads", "Spreads to", " people"), g.word("who", "Who"), g.num("recover", "Recover", " s", S.ice)]);
    return out + k.caption(`${v("who")} cracks: ${v("crack")} · ${v("kept")}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
