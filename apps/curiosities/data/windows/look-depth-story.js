/* look for the story curiosities in data/db-depth-story.js (depth thread): the live picture at the top of each
   window. Same house style as look-heart-comedy.js: a stage on top (y 0 to 120) with little people acting out the
   story move, a strip of small labelled gauges below it, and a caption. Colors: gold = attention and hope, red =
   trouble and cost, blue = the hero, purple = the other side, green = what is true, grey = what is hidden. Every own
   setting moves something of its own. */
(function (W) {
  const S = { bg: "#17161d", floor: "#2b2533", gold: "#ffd166", red: "#e4572e", blue: "#4a6fa5", orange: "#e8913a", green: "#5fae78", purple: "#9b6bb5", grey: "#8a8a96", pink: "#d9789b", paper: "#f4f1ea", ink: "#1c1712", ice: "#9fd3ff" };
  const r1 = (n) => Math.round(n * 10) / 10;
  const fmt = (n) => String(Math.round(n * 100) / 100);
  const FY = 112; /* the stage floor: people's feet */

  /* ---------- the stage (copied from look-heart-comedy.js) ---------- */
  const stage = (k, o) => {
    o = o || {};
    return k.bg(o.bg || S.bg) + `<rect x="0" y="${FY}" width="320" height="8" fill="${o.floor || S.floor}"/>` + (o.spot ? `<ellipse cx="${o.spot}" cy="${FY + 2}" rx="70" ry="9" fill="#fff4c8" opacity="0.12"/>` : "");
  };
  const guy = (k, x, o) => k.person(Object.assign({ x, y: FY }, o || {}));
  const emo = (k, x, y, e, size, alpha) => `<text x="${r1(x)}" y="${r1(y)}" font-size="${r1(size || 14)}" text-anchor="middle"${alpha != null ? ` opacity="${r1(alpha)}"` : ""}>${k.esc(e)}</text>`;
  function burst(k, x, y, r, color, txt, tsize) {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rr = i % 2 ? r * 0.62 : r;
      pts.push(`${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="${color || S.gold}" stroke="${S.ink}" stroke-width="2"/>` + (txt ? k.text({ x, y: y + (tsize || 10) * 0.35, text: txt, size: tsize || 10, color: S.ink, weight: 900 }) : "");
  }
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
  const chip = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 5.2 + 10;
    const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
    return `<rect x="${r1(x0)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="${color || "#33323d"}" stroke="#555" stroke-width="0.8"/>` + k.label({ x: x0 + w / 2, y: y + 0.5, text, size: 9, color: "#fff" });
  };
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
  const stopwatch = (k, x, y, w, sec, max, color, lab) => `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="#33323d"/><rect x="${x}" y="${y}" width="${r1(Math.max(2, (w * k.clamp(sec, 0, max)) / max))}" height="7" rx="3.5" fill="${color || S.gold}"/>` + k.label({ x: x + w + 4, y: y + 7, text: lab || `${fmt(sec)} s`, size: 8, color: "#ddd", anchor: "start" });
  const beats = (k, x, y, n, color, gap) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => k.dot({ x: x + i * (gap || 9), y, r: 3, color: color || "#bbb" })).join("");

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
    when: (id, label, unit, color) => ({ label, kind: "when", p: v.p(id), text: fmt(v.n(id)) + (unit || ""), color }),
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

  /* ======================= incitingEvent ======================= */
  /* A calm little house; the event lands on it with a burst. The hero says yes or no; neighbors watch. */
  look("incitingEvent", (v, k, g) => {
    const jolt = v.p("jolt");
    const kind = idx(v, "kind", 6);
    const ref = idx(v, "refused", 4);
    const seen = idx(v, "seenBy", 3);
    let out = stage(k, { spot: 120 });
    out += `<path d="M40 ${FY} L40 70 L70 48 L100 70 L100 ${FY} Z" fill="#3a3346" stroke="#555"/>` + `<rect x="62" y="86" width="16" height="26" fill="#2a2430"/>`;
    const EV = ["✉️", "🕯️", "🤝", "💔", "🔍", "🎁"];
    out += burst(k, 150, 40, 10 + jolt * 16, k.mix("#6b5a2e", S.gold, jolt)) + emo(k, 150, 46, EV[kind], 14 + jolt * 6);
    out += guy(k, 120, { s: 0.85, color: S.blue, lean: -jolt * 18, arms: 0.2 + jolt * 0.6, mood: -jolt * 0.6, look: 1 });
    out += k.bubble({ x: 92, y: 18, w: 60, h: 20, text: ["yes!", "um...", "no.", "no! no!"][ref], tail: 18, size: 10 });
    const n = [0, 3, 12][seen];
    out += heads(k, n, 200, 70, 110, { r: 4.5, color: (i) => (i % 2 ? "#c9b49a" : "#b39a80") });
    if (!n) out += k.label({ x: 255, y: 80, text: "no one else knows", size: 8, color: "#888" });
    out += film(k, 200, 96, 110, { pins: [{ p: v.p("when"), color: S.gold, label: `${fmt(v.n("when"))} min` }], ends: false });
    out += strip(k, [g.num("jolt", "Hits", " of 5", S.red), g.when("when", "When", " min"), g.word("kind", "Event"), g.steps("refused", "Answer"), g.steps("seenBy", "Who knows")]);
    return out + k.caption(`${v("kind")} at ${fmt(v.n("when"))} min · ${v("refused")}`);
  });

  /* ======================= complication ======================= */
  /* The hero walks to a goal flag; rocks pile up on the way and the flag drifts further off. */
  look("complication", (v, k, g) => {
    const w = v.p("weight");
    const src = idx(v, "source", 5);
    const pile = Math.round(v.n("pileUp"));
    const tim = idx(v, "timing", 4);
    const sol = idx(v, "solvable", 4);
    let out = stage(k);
    const fx = 220 + w * 80;
    out += `<line x1="${r1(fx)}" y1="${FY}" x2="${r1(fx)}" y2="${FY - 46}" stroke="#ddd" stroke-width="2"/><path d="M${r1(fx)} ${FY - 46} l18 6 l-18 6 Z" fill="${S.gold}"/>`;
    out += guy(k, 40, { s: 0.85, color: S.blue, walk: 0.6, mood: -w * 0.6, look: 1 });
    const solCol = [S.green, S.gold, S.orange, S.red][sol];
    for (let i = 0; i < pile; i++) out += `<rect x="${r1(70 + i * 22)}" y="${r1(FY - 10 - (i % 2) * 4 - w * 8)}" width="16" height="${r1(10 + (i % 2) * 4 + w * 8)}" rx="3" fill="${solCol}" stroke="${S.ink}"/>`;
    if (sol === 3) out += k.label({ x: 70 + pile * 11, y: 52, text: "🔒", size: 14 });
    out += emo(k, 120, 26, ["🎲", "🤦", "🗡️", "🫂", "🌍"][src], 18);
    out += film(k, 170, 18, 140, { spans: tim >= 2 ? [{ a: 0.4, b: [0.1, 0.5, 0.7, 0.9][tim] - 0.02, color: S.green, alpha: 0.6 }] : [], pins: [{ p: [0.1, 0.5, 0.7, 0.9][tim], color: S.red, label: "lands" }], ends: false });
    out += strip(k, [g.num("weight", "Harder", " of 5", S.red), g.word("source", "From"), g.num("pileUp", "At once", ""), g.steps("timing", "When"), g.steps("solvable", "Fix", S.orange)]);
    return out + k.caption(`${pile} problem${pile === 1 ? "" : "s"} · ${v("timing")} · ${v("solvable")}`);
  });

  /* ======================= reversal ======================= */
  /* A fortune line runs along; at the flip it jumps. Hints before it, a shaded stretch after it. */
  look("reversal", (v, k, g) => {
    const f = v.p("flip");
    const dir = idx(v, "direction", 3);
    const seen = idx(v, "seenComing", 4);
    const cause = idx(v, "cause", 4);
    const last = v.p("lasting");
    let out = stage(k, { floor: "#1d1c24" });
    const x0 = 20, xf = 150, x1 = 300, mid = 60, amp = 8 + f * 40;
    const start = dir === 2 ? mid + amp / 2 : mid - amp / 2;
    const after = dir === 2 ? mid - amp / 2 : mid + amp / 2;
    out += `<rect x="${xf}" y="14" width="${r1((x1 - xf) * Math.max(0.03, last))}" height="92" fill="${S.purple}" opacity="0.18"/>`;
    let d = `M${x0} ${r1(start)} L${xf} ${r1(start)} L${xf + 6} ${r1(after)}`;
    if (dir === 1) d += ` L${xf + 40} ${r1(start)} L${xf + 46} ${r1(after)}`;
    d += ` L${x1} ${r1(after)}`;
    out += `<path d="${d}" fill="none" stroke="${S.gold}" stroke-width="3"/>`;
    out += k.label({ x: 12, y: 24, text: "better", size: 8, color: "#888", anchor: "start" }) + k.label({ x: 12, y: 104, text: "worse", size: 8, color: "#888", anchor: "start" });
    for (let i = 0; i < seen; i++) out += k.label({ x: 70 + i * 22, y: r1(start - 10), text: "?", size: 12, color: S.ice, weight: 700 });
    out += burst(k, xf + 3, r1((start + after) / 2), 6 + f * 8, S.red) + emo(k, xf + 3, 20, ["🫵", "🧑", "🎲", "🔍"][cause], 14);
    out += strip(k, [g.num("flip", "Flip", " of 5", S.red), g.word("direction", "Way"), g.steps("seenComing", "Hinted", S.ice), g.word("cause", "Cause"), g.num("lasting", "Changes", " scenes", S.purple)]);
    return out + k.caption(`${v("direction")}, ${v("seenComing")}`);
  });

  /* ======================= costlyChoice ======================= */
  /* A fork in the road; a red loss mark on each path; a gate closing behind. */
  look("costlyChoice", (v, k, g) => {
    const cost = v.p("cost");
    const kind = idx(v, "kind", 4);
    const time = idx(v, "time", 4);
    const shown = idx(v, "shown", 3);
    const undo = idx(v, "undo", 3);
    let out = stage(k);
    out += `<path d="M60 ${FY} L150 70 L250 30" fill="none" stroke="#5a5266" stroke-width="10" stroke-linecap="round"/><path d="M150 70 L270 100" fill="none" stroke="#5a5266" stroke-width="10" stroke-linecap="round"/>`;
    const IC = [["🍰", "🎁"], ["⚡", "🔥"], ["⭐", "⚖️"], ["🙋", "👥"]][kind];
    out += emo(k, 255, 30, IC[0], 16) + emo(k, 275, 98, IC[1], 16);
    out += k.ring({ x: 252, y: 25, r: 4 + cost * 12, color: S.red, w: 2 }) + k.ring({ x: 272, y: 93, r: 4 + cost * 12, color: S.red, w: 2 });
    out += guy(k, 150, { s: 0.8, color: S.blue, mood: -0.2 - cost * 0.6, arms: shown === 2 ? 0.7 : 0.1 });
    out += beats(k, 130, 20, [0, 1, 5][shown], "#bbb", 8);
    out += `<rect x="30" y="${FY - 40}" width="6" height="40" fill="#777"/>` + `<rect x="36" y="${FY - 36}" width="${[30, 16, 0][undo]}" height="4" fill="#999"/>` + (undo === 2 ? `<rect x="36" y="${FY - 40}" width="20" height="40" fill="#555" stroke="#888"/>` : "");
    out += stopwatch(k, 200, 10, 40, [1, 3, 6, 10][time], 10, S.ice, v("time"));
    out += strip(k, [g.num("cost", "Cost", " of 5", S.red), g.word("kind", "Choice"), g.steps("time", "Time"), g.steps("shown", "We see"), g.steps("undo", "Undo", S.red)]);
    return out + k.caption(`${v("kind")} · ${v("undo")}`);
  });

  /* ======================= pointOfNoReturn ======================= */
  look("pointOfNoReturn", (v, k, g) => {
    const fin = v.p("finality");
    const line = idx(v, "line", 5);
    const will = idx(v, "willing", 4);
    const wit = Math.round(v.n("witnesses"));
    let out = stage(k);
    out += `<line x1="150" y1="20" x2="150" y2="${FY + 6}" stroke="${S.red}" stroke-width="${r1(1 + fin * 4)}" stroke-dasharray="${fin > 0.8 ? "0" : "6 4"}"/>`;
    out += `<rect x="96" y="${FY - 54}" width="32" height="54" fill="#3a3346" stroke="#555"/>` + `<rect x="96" y="${FY - 54}" width="${r1(32 * (1 - fin))}" height="54" fill="#0b0a10"/>`;
    out += emo(k, 112, 40, ["🚪", "🤫", "🚨", "🤞", "🧳"][line], 16);
    out += guy(k, 180, { s: 0.85, color: S.blue, lean: [18, 10, 0, -6][will], mood: [-0.6, -0.4, -0.1, 0.4][will], walk: 0.5, look: 1 });
    if (will === 0) out += k.hand({ x: 160, y: 70, s: 0.4, open: 1 });
    if (will === 1) out += k.label({ x: 168, y: 40, text: "?!", size: 12, color: S.orange, weight: 700 });
    out += heads(k, wit, 210, 30, 100, { r: 4 });
    out += film(k, 210, 98, 100, { pins: [{ p: v.p("place"), color: S.red }], ends: false });
    out += strip(k, [g.num("finality", "Final", " of 5", S.red), g.word("line", "Line"), g.steps("willing", "Willing"), g.num("witnesses", "Watching", ""), g.when("place", "When", "%")]);
    return out + k.caption(`${v("line")} · ${v("willing")}`);
  });

  /* ======================= opponentMove ======================= */
  look("opponentMove", (v, k, g) => {
    const th = v.p("threat");
    const seen = idx(v, "seen", 4);
    const smart = idx(v, "smart", 4);
    const dist = idx(v, "distance", 4);
    const who = idx(v, "who", 5);
    let out = stage(k);
    out += guy(k, 260, { s: 0.85, color: S.blue, look: seen === 3 ? -1 : 1, mood: seen === 3 ? -0.5 : 0.2 });
    const ox = [40, 120, 190, 225][dist];
    out += `<circle cx="${ox}" cy="${FY - 30}" r="${r1(12 + th * 26)}" fill="${S.red}" opacity="0.18"/>`;
    out += guy(k, ox, { s: 0.85, color: S.purple, mood: -0.4, lean: 6, look: 1 });
    out += emo(k, ox, 26, ["🦹", "🥊", "🏛️", "🌪️", "🫂"][who], 16);
    for (let i = 0; i <= smart; i++) out += emo(k, 20 + i * 14, 18, "♟", 12);
    if (smart === 3) out += k.arrow({ x1: ox + 10, y1: 46, x2: 250, y2: 46, color: S.purple, w: 2 });
    if (seen >= 1) out += k.label({ x: 160, y: 18, text: ["", "a hint", "👁 we see it", "👁 the hero sees it"][seen], size: 9, color: seen === 1 ? "#999" : S.gold });
    out += strip(k, [g.num("threat", "Threat", " of 5", S.red), g.steps("seen", "Seen by"), g.steps("smart", "Clever", S.purple), g.steps("distance", "Close", S.red), g.word("who", "Who")]);
    return out + k.caption(`${v("who")} · ${v("distance")} · ${v("smart")}`);
  });

  /* ======================= plantForgotten ======================= */
  look("plantForgotten", (v, k, g) => {
    const bur = v.p("buried");
    const kind = idx(v, "kind", 5);
    const sh = Math.round(v.n("showings"));
    const gap = v.p("gap");
    const dis = idx(v, "disguise", 4);
    const pay = v.p("payoffSize");
    let out = stage(k, { floor: "#1d1c24" });
    const IC = ["🔑", "💬", "🎯", "📍", "🔁"][kind];
    out += emo(k, 40, 60, IC, 20, 1 - bur * 0.8);
    out += emo(k, 40, 84, ["", "😂", "💥", "🌳"][dis], 14);
    out += k.label({ x: 40, y: 30, text: "planted", size: 8, color: "#999" });
    const px = 60 + 220 * Math.max(0.05, gap);
    out += burst(k, px, 50, 8 + pay * 18, S.gold) + emo(k, px, 56, IC, 12 + pay * 8);
    const pins = [];
    for (let i = 0; i < sh; i++) pins.push({ p: (i / Math.max(1, sh)) * Math.max(0.05, gap) * 0.9, color: S.ice });
    pins.push({ p: Math.max(0.05, gap), color: S.gold });
    out += film(k, 20, 96, 280, { pins });
    out += strip(k, [g.num("buried", "Hidden", " of 5", S.grey), g.word("kind", "Plant"), g.num("showings", "Shown", "x", S.ice), g.num("gap", "Payoff in", " min"), g.word("disguise", "Disguise"), g.num("payoffSize", "Payoff", " of 5")]);
    return out + k.caption(`${v("kind")}, ${v("disguise")}, pays off in ${fmt(v.n("gap"))} min`);
  });

  /* ======================= planShown ======================= */
  look("planShown", (v, k, g) => {
    const shown = v.p("shown");
    const works = idx(v, "works", 4);
    const told = idx(v, "told", 4);
    const hid = idx(v, "hidden", 4);
    const steps = Math.round(v.n("steps"));
    let out = stage(k, { floor: "#1d1c24" });
    out += k.panel({ x: 20, y: 12, w: 280, h: 70, fill: "#e8e0c8" });
    const bw = 260 / steps;
    const nShown = Math.round(shown * steps);
    const nHidden = [0, 1, Math.ceil(steps / 3), steps][hid];
    const nFail = [0, 1, Math.ceil(steps / 2), steps][works];
    for (let i = 0; i < steps; i++) {
      const x = 30 + i * bw;
      const isHidden = i >= steps - nHidden;
      const fill = isHidden ? "#333" : i < nShown ? "#fff" : "#bbb";
      out += `<rect x="${r1(x)}" y="30" width="${r1(bw - 4)}" height="20" fill="${fill}" stroke="${S.ink}"/>`;
      if (i < nFail && !isHidden) out += k.label({ x: x + (bw - 4) / 2, y: 46, text: "✗", size: 12, color: S.red, weight: 900 });
      if (i < nShown && i >= nFail) out += k.label({ x: x + (bw - 4) / 2, y: 46, text: "✓", size: 10, color: S.green, weight: 900 });
      if (i < steps - 1) out += `<line x1="${r1(x + bw - 4)}" y1="40" x2="${r1(x + bw)}" y2="40" stroke="${S.ink}"/>`;
    }
    out += emo(k, 40, 72, ["💬", "🗣️", "🗺️", "🎞️"][told], 14);
    out += guy(k, 270, { s: 0.6, color: S.blue, mood: [0.6, 0.2, -0.4, -0.8][works] });
    out += strip(k, [g.num("shown", "Told", " of 5", S.ice), g.steps("works", "Goes", S.red), g.word("told", "How"), g.steps("hidden", "Hidden", S.grey), g.num("steps", "Steps", "")]);
    return out + k.caption(`${steps} steps, ${v("works")}`);
  });

  /* ======================= mentorLesson ======================= */
  look("mentorLesson", (v, k, g) => {
    const wt = v.p("weight");
    const heard = idx(v, "heard", 4);
    const ret = idx(v, "returns", 4);
    const form = idx(v, "form", 4);
    const fate = idx(v, "mentorFate", 4);
    let out = stage(k);
    out += guy(k, 60, { s: 0.95, color: "#7a6a5a", mood: 0.3, look: 1, alpha: [1, 0.6, 0.8, 0.25][fate], lean: fate === 2 ? -10 : 0 });
    out += emo(k, 60, 20, ["🏠", "🚶", "💔", "🕯️"][fate], 12);
    out += k.bubble({ x: 120, y: 26, w: 40 + wt * 60, h: 22, text: ["told", "shown", "a story", "a test"][form], tail: -40, size: 10 });
    out += guy(k, 200, { s: 0.8, color: S.blue, look: heard === 0 ? 1 : -1, mood: [-0.2, 0, 0.3, 0.6][heard] });
    out += k.label({ x: 200, y: 26, text: ["🙉", "🤔", "💡", "⭐"][heard], size: 12 });
    const pins = [{ p: 0.1, color: S.gold, label: "lesson" }];
    [[], [0.5], [0.9], [0.35, 0.6, 0.85]][ret].forEach((p) => pins.push({ p, color: S.green }));
    out += film(k, 230, 96, 80, { pins, ends: false });
    out += strip(k, [g.num("weight", "Matters", " of 5"), g.steps("heard", "Heard"), g.steps("returns", "Returns", S.green), g.word("form", "Taught"), g.word("mentorFate", "Mentor")]);
    return out + k.caption(`${v("form")} · ${v("heard")} · back ${v("returns")}`);
  });

  /* ======================= foil ======================= */
  look("foil", (v, k, g) => {
    const like = v.p("likeness");
    const path = idx(v, "path", 4);
    const sc = Math.round(v.n("scenes"));
    const seen = idx(v, "seen", 3);
    const clash = v.p("clash");
    let out = stage(k);
    const ROAD = ["#3a2140", "#4a4430", "#5a3a20", "#3a3a3a"][path];
    out += `<rect x="170" y="${FY}" width="150" height="8" fill="${ROAD}"/>` + emo(k, 280, 30, ["🌑", "🛋️", "🦁", "🪨"][path], 16);
    out += `<line x1="160" y1="20" x2="160" y2="${FY}" stroke="#555" stroke-dasharray="3 3"/>`;
    out += guy(k, 110, { s: 0.9, color: S.blue, look: 1, mood: seen === 2 ? -0.5 : 0.1, eyes: seen === 2 ? 1 : 0.7 });
    out += guy(k, 210, { s: 0.9, color: k.mix("#9b6bb5", "#4a6fa5", like), look: -1, mood: -0.2 });
    if (clash > 0.05) out += burst(k, 160, 50, 4 + clash * 14, S.red);
    if (seen >= 1) out += k.ring({ x: 110, y: 70, r: seen === 2 ? 26 : 16, color: S.gold, dash: seen === 1 ? "3 3" : "" });
    out += beats(k, 20, 18, Math.min(sc, 14), S.ice, 7);
    out += strip(k, [g.num("likeness", "Alike", " of 5", S.purple), g.word("path", "Road"), g.num("scenes", "Together", " scenes", S.ice), g.steps("seen", "Sees it"), g.num("clash", "Clash", " of 5", S.red)]);
    return out + k.caption(`mirror took ${v("path")} · seen ${v("seen")}`);
  });

  /* ======================= realization ======================= */
  look("realization", (v, k, g) => {
    const cl = v.p("clarity");
    const trig = idx(v, "trigger", 5);
    const sp = idx(v, "speed", 3);
    const sh = idx(v, "shown", 3);
    let out = stage(k, { floor: "#1d1c24" });
    out += k.face({ x: 110, y: 62, r: 34, mood: sh === 0 ? 0 : 0.3, eyes: 0.5 + cl * 0.5, mouth: sh === 2 ? 0.5 : 0, look: 0 });
    out += `<circle cx="170" cy="30" r="12" fill="${k.mix("#3a3a3a", S.gold, cl)}" stroke="${S.ink}"/>`;
    for (let i = 0; i < [2, 5, 9][sp]; i++) {
      const a = (i / 9) * Math.PI * 2;
      out += `<line x1="${r1(170 + Math.cos(a) * 15)}" y1="${r1(30 + Math.sin(a) * 15)}" x2="${r1(170 + Math.cos(a) * (18 + cl * 8))}" y2="${r1(30 + Math.sin(a) * (18 + cl * 8))}" stroke="${S.gold}" stroke-width="2"/>`;
    }
    out += emo(k, 40, 40, ["💬", "🔑", "💭", "❌", "😢"][trig], 18);
    if (sh === 1) out += k.hand({ x: 160, y: 96, s: 0.5, open: 0.3 });
    if (sh === 2) out += k.bubble({ x: 230, y: 70, w: 70, h: 20, text: "I see now", tail: -20, size: 9 });
    out += film(k, 200, 14, 110, { pins: [{ p: v.p("late"), color: S.gold }], ends: false });
    out += strip(k, [g.num("clarity", "Clear", " of 5"), g.word("trigger", "Trigger"), g.steps("speed", "Speed"), g.steps("shown", "Shown"), g.when("late", "When", "%")]);
    return out + k.caption(`${v("trigger")} · ${v("speed")} · ${v("shown")}`);
  });

  /* ======================= sacrifice ======================= */
  look("sacrifice", (v, k, g) => {
    const sz = v.p("size");
    const what = idx(v, "what", 5);
    const fw = idx(v, "forWhom", 4);
    const known = idx(v, "known", 3);
    const reg = idx(v, "regret", 3);
    let out = stage(k);
    out += guy(k, 70, { s: 0.9, color: S.blue, arms: 0.4, look: 1, mood: [0.4, 0, -0.6][reg] });
    if (reg >= 1) out += `<path d="M76 ${FY - 64} q-2 4 0 6 q2 -2 0 -6 Z" fill="${S.ice}"/>` + (reg === 2 ? `<path d="M64 ${FY - 62} q-2 4 0 6 q2 -2 0 -6 Z" fill="${S.ice}"/>` : "");
    out += emo(k, 120, 60, ["🏆", "🌠", "❤️", "🛡️", "👑"][what], 10 + sz * 18);
    out += k.arrow({ x1: 95, y1: 70, x2: 160, y2: 70, color: S.gold, w: 2 });
    const n = [1, 1, 1, 8][fw];
    const col = ["#4a6fa5", "#5fae78", "#c9b49a", "#c9b49a"][fw];
    if (fw === 0) out += k.label({ x: 190, y: 60, text: "for themself", size: 9, color: "#bbb" });
    else if (n === 1) out += guy(k, 190, { s: 0.8, color: col, look: -1, mood: 0.5 });
    else out += heads(k, n, 170, 70, 60, { r: 6, color: col });
    const watch = [0, 0, 10][known];
    out += heads(k, watch, 240, 30, 70, { r: 4 });
    out += k.label({ x: 275, y: 22, text: ["nobody knows", "only they know", "everyone knows"][known], size: 8, color: "#999" });
    out += strip(k, [g.num("size", "Gives up", " of 5", S.red), g.word("what", "What"), g.word("forWhom", "For"), g.steps("known", "Known"), g.steps("regret", "Regret", S.ice)]);
    return out + k.caption(`${v("what")} for ${v("forWhom")} · ${v("regret")}`);
  });

  /* ======================= eyeFirst ======================= */
  look("eyeFirst", (v, k, g) => {
    const pull = v.p("pull");
    const by = idx(v, "by", 6);
    const pl = idx(v, "place", 3);
    const riv = Math.round(v.n("rivals"));
    const hold = v.p("holdTime");
    let out = k.bg("#0d0d12");
    out += k.frame({ x: 20, y: 10, w: 280, h: 100, color: "#444", w2: 1.5 });
    const x = [70, 160, 250][pl];
    out += `<circle cx="${x}" cy="60" r="${r1(14 + pull * 26)}" fill="${S.gold}" opacity="${r1(0.08 + pull * 0.3)}"/>`;
    const SUB = ["💡", "🏃", "🙂", "🔴", "📐", "🔎"][by];
    out += emo(k, x, 66, SUB, 18 + pull * 6);
    if (by === 4) out += `<line x1="20" y1="110" x2="${x}" y2="60" stroke="#666"/><line x1="300" y1="110" x2="${x}" y2="60" stroke="#666"/>`;
    for (let i = 0; i < riv; i++) out += k.dot({ x: [40, 290, 120, 210][i], y: [25, 30, 95, 92][i], r: 6, color: "#666" });
    out += k.ring({ x, y: 60, r: 8 + hold * 30, color: S.ice, w: 1.5, dash: "3 3" });
    out += strip(k, [g.num("pull", "Pull", " of 5"), g.word("by", "Pulled by"), g.word("place", "Where"), g.num("rivals", "Rivals", "", S.grey), g.num("holdTime", "Holds", " s", S.ice)]);
    return out + k.caption(`eye goes ${v("place")}, pulled by ${v("by")}`);
  });

  /* ======================= returningObject ======================= */
  look("returningObject", (v, k, g) => {
    const n = Math.round(v.n("returns"));
    const obj = idx(v, "object", 6);
    const mean = idx(v, "meaning", 4);
    const size = idx(v, "size", 4);
    const shf = idx(v, "shifts", 4);
    let out = k.bg(S.bg);
    const IC = ["🖼️", "🔫", "🔑", "✉️", "🧸", "💍"][obj];
    const cols = Math.min(n, 10);
    const fw = 300 / cols;
    for (let i = 0; i < cols; i++) {
      const x = 10 + i * fw;
      out += `<rect x="${r1(x)}" y="20" width="${r1(fw - 4)}" height="70" fill="#26252e" stroke="#555"/>`;
      const last = i === cols - 1;
      const sz = [8, 12, 18, 26][size] * Math.min(1, (fw - 4) / 30);
      const ox = x + (fw - 4) * [0.8, 0.85, 0.5, 0.5][size] + (last && shf === 1 ? -6 : 0);
      const oy = [40, 82, 62, 66][size];
      if (!(last && shf === 3)) out += emo(k, ox, oy, IC, sz, size === 0 ? 0.6 : 1);
      if (last && shf === 2) out += `<line x1="${r1(ox - 6)}" y1="${r1(oy - 12)}" x2="${r1(ox + 6)}" y2="${r1(oy)}" stroke="${S.red}" stroke-width="2"/>`;
      if (mean >= 2) out += k.ring({ x: ox, y: oy - sz * 0.35, r: sz * 0.6 + mean * 2, color: S.gold, w: 1 });
    }
    out += k.label({ x: 160, y: 108, text: ["just a thing", "a hint", "a symbol", "the key to the story"][mean], size: 9, color: [S.grey, "#bbb", S.gold, S.gold][mean] });
    out += strip(k, [g.num("returns", "Returns", "x"), g.word("object", "Object"), g.steps("meaning", "Means", S.gold), g.steps("size", "Size"), g.word("shifts", "Changes")]);
    return out + k.caption(`${v("object")} seen ${n} times · ${v("shifts")}`);
  });

  /* ======================= unreliableView ======================= */
  look("unreliableView", (v, k, g) => {
    const dbt = v.p("doubt");
    const why = idx(v, "why", 5);
    const cl = Math.round(v.n("clues"));
    const caught = idx(v, "caught", 4);
    const who = idx(v, "who", 4);
    let out = stage(k, { floor: "#1d1c24" });
    out += k.label({ x: 80, y: 14, text: "what we are told", size: 8, color: "#bbb" }) + k.label({ x: 240, y: 14, text: "what happened", size: 8, color: S.green });
    out += k.frame({ x: 10, y: 20, w: 140, h: 70, color: "#666", w2: 1 }) + k.frame({ x: 170, y: 20, w: 140, h: 70, color: S.green, w2: 1 });
    out += guy(k, 80 + dbt * 40, { y: 86, s: 0.55, color: S.blue, mood: 0.5 - dbt });
    out += guy(k, 220, { y: 86, s: 0.55, color: S.blue, mood: -0.4 });
    if (dbt > 0.5) out += guy(k, 270, { y: 86, s: 0.5, color: S.purple, alpha: dbt });
    out += emo(k, 22, 34, ["🤥", "🌫️", "😵", "💤", "🤒"][why], 12) + emo(k, 140, 34, ["🎙️", "🎥", "🧑", "👀"][who], 11);
    for (let i = 0; i < cl; i++) out += k.label({ x: 20 + i * 15, y: 104, text: "?", size: 10, color: S.ice, weight: 700 });
    out += film(k, 200, 96, 110, { pins: caught ? [{ p: [0, 0.9, 0.5, 0.15][caught], color: S.red }] : [], ends: false });
    out += strip(k, [g.num("doubt", "Untrue", " of 5", S.red), g.word("why", "Why"), g.num("clues", "Clues", "", S.ice), g.steps("caught", "Found out"), g.word("who", "Whose")]);
    return out + k.caption(`${v("who")}: ${v("why")} · caught ${v("caught")}`);
  });

  /* ======================= offscreen ======================= */
  look("offscreen", (v, k, g) => {
    const hid = v.p("hidden");
    const hint = idx(v, "hint", 5);
    const later = idx(v, "shownLater", 4);
    const rt = v.n("reactionTime");
    const what = idx(v, "what", 5);
    let out = k.bg("#0d0d12");
    const fr = 300 - hid * 120;
    out += `<rect x="10" y="10" width="${r1(fr - 10)}" height="100" fill="#1e1d26" stroke="#888" stroke-width="2"/>`;
    out += emo(k, 270, 66, ["💥", "👹", "🧍", "🎁", "🙂"][what], 26, 0.15 + (1 - hid) * 0.85);
    out += guy(k, 60, { y: 104, s: 0.8, color: S.blue, look: 1, mood: -0.5, eyes: 1 });
    out += guy(k, 100, { y: 104, s: 0.7, color: S.orange, look: 1, mood: hint === 3 ? -0.9 : -0.3, eyes: 1 });
    if (hint === 1) out += k.speaker({ x: fr - 30, y: 30, s: 0.7, level: 0.9 });
    if (hint === 2) out += `<ellipse cx="${r1(fr - 40)}" cy="104" rx="30" ry="5" fill="#000" opacity="0.7"/>`;
    if (hint === 4) out += emo(k, fr - 14, 60, ["💥", "👹", "🧍", "🎁", "🙂"][what], 12, 0.6);
    out += stopwatch(k, 20, 16, 60, rt, 10, S.ice, `${fmt(rt)} s on faces`);
    out += k.label({ x: 150, y: 16, text: ["never shown", "shown at the end", "shown later", "shown soon"][later], size: 8, color: "#aaa", anchor: "start" });
    out += strip(k, [g.num("hidden", "Kept out", " of 5", S.grey), g.word("hint", "Hint"), g.steps("shownLater", "Shown"), g.num("reactionTime", "On faces", " s", S.ice), g.word("what", "What")]);
    return out + k.caption(`${v("what")} kept out · hinted by ${v("hint")}`);
  });

  /* ======================= lingeringShot ======================= */
  look("lingeringShot", (v, k, g) => {
    const ov = v.n("overstay");
    const on = idx(v, "on", 5);
    const snd = idx(v, "sound", 4);
    const mv = idx(v, "moves", 3);
    const mean = idx(v, "meaning", 4);
    let out = k.bg("#0d0d12");
    const zoom = [1, 1.06, 1.18][mv];
    out += `<g transform="translate(160 55) scale(${zoom}) translate(-160 -55)${mv === 1 ? " translate(6 0)" : ""}">`;
    out += `<rect x="40" y="10" width="240" height="90" fill="#24232c" stroke="#555"/>`;
    out += emo(k, 160, 70, ["🪑", "🙂", "🔑", "🚪", "🪟"][on], 32);
    out += `</g>`;
    if (mean >= 1) out += k.label({ x: 260, y: 26, text: ["", "~", "⚠", "?"][mean], size: 16, color: [S.grey, S.ice, S.red, S.gold][mean], weight: 700 });
    out += k.speaker({ x: 20, y: 40, s: 0.6, level: [0, 0.3, 0.6, 1][snd] });
    const total = 4 + ov;
    out += film(k, 20, 104, 280, { spans: [{ a: 0, b: 4 / 14, color: S.blue }, { a: 4 / 14, b: total / 14, color: S.gold }], ends: false });
    out += strip(k, [g.num("overstay", "Extra", " s"), g.word("on", "Stays on"), g.steps("sound", "Sound", S.ice), g.steps("moves", "Camera"), g.steps("meaning", "Hints", S.red)]);
    return out + k.caption(`${fmt(ov)} extra seconds on ${v("on")}`);
  });

  /* ======================= blindSpot ======================= */
  look("blindSpot", (v, k, g) => {
    const sz = v.p("size");
    const about = idx(v, "about", 5);
    const seers = Math.round(v.n("seers"));
    const hints = Math.round(v.n("hints"));
    const opens = idx(v, "opens", 3);
    let out = stage(k);
    out += guy(k, 100, { s: 0.9, color: S.blue, look: -1, eyes: [0.3, 0.6, 1][opens], mood: opens === 2 ? -0.6 : 0.2 });
    out += `<path d="M110 ${FY - 66} L${r1(220 + sz * 40)} ${r1(FY - 66 - 10 - sz * 30)} L${r1(220 + sz * 40)} ${r1(FY - 66 + 10 + sz * 30)} Z" fill="#000" opacity="${r1(0.25 + (1 - opens * 0.4) * 0.4)}"/>`;
    out += emo(k, 220, 70, ["🪞", "⚠️", "❤️", "🗡️", "⭐"][about], 20);
    out += heads(k, seers, 20, 20, 60, { r: 4, color: S.gold });
    for (let i = 0; i < hints; i++) out += k.label({ x: 30 + (i % 4) * 14, y: 60 + Math.floor(i / 4) * 12, text: "💬", size: 9 });
    out += strip(k, [g.num("size", "Size", " of 5", S.grey), g.word("about", "Cannot see"), g.num("seers", "Others see", "", S.gold), g.num("hints", "Told", "x", S.ice), g.steps("opens", "Opens")]);
    return out + k.caption(`cannot see ${v("about")} · ${seers} others can`);
  });

  /* ======================= excuses ======================= */
  look("excuses", (v, k, g) => {
    const str = v.p("excuseStrength");
    const doing = idx(v, "doing", 4);
    const voice = idx(v, "voice", 4);
    const bel = idx(v, "believe", 3);
    const steps = Math.round(v.n("steps"));
    let out = stage(k);
    const sw = 150 / steps;
    for (let i = 0; i < steps; i++) out += `<rect x="${r1(30 + i * sw)}" y="${r1(60 + i * (44 / steps))}" width="${r1(sw)}" height="${r1(FY - 60 - i * (44 / steps))}" fill="#3a3346" stroke="#555"/>`;
    const gx = 30 + (steps - 0.5) * sw;
    out += guy(k, gx, { y: 60 + (steps - 1) * (44 / steps), s: 0.5, color: S.blue, mood: [-0.4, 0.1, 0.6][bel], lean: 10 });
    out += k.bubble({ x: 150, y: 18, w: 60 + str * 30, h: 18, text: "just this once", tail: -30, size: 8 + str * 3 });
    out += emo(k, 250, 90, ["🍪", "💸", "🔥", "👊"][doing], 18 + doing * 4) + `<circle cx="250" cy="84" r="${18 + doing * 4}" fill="${S.red}" opacity="${r1(0.1 + doing * 0.12)}"/>`;
    out += emo(k, 290, 30, ["💭", "🗣️", "🪞", "🎥"][voice], 14);
    out += strip(k, [g.num("excuseStrength", "Excuse", " of 5"), g.steps("doing", "Into", S.red), g.word("voice", "Heard"), g.steps("believe", "Believe"), g.num("steps", "Steps", "")]);
    return out + k.caption(`${steps} excuses down to ${v("doing")}`);
  });

  /* ======================= misreading ======================= */
  look("misreading", (v, k, g) => {
    const wr = v.p("wrongness");
    const reads = idx(v, "reads", 5);
    const cl = Math.round(v.n("clues"));
    const acts = idx(v, "acts", 4);
    const clr = idx(v, "cleared", 3);
    let out = stage(k);
    const PAIR = [["🎭", "🎁"], ["😢", "❤️"], ["😠", "😄"], ["😡", "😨"], ["🗡️", "🫂"]][reads];
    out += guy(k, 80, { s: 0.9, color: S.blue, look: 1, mood: -wr * 0.8, lean: [0, -10, 4, 10][acts], arms: acts === 3 ? 0.8 : 0 });
    out += guy(k, 230, { s: 0.9, color: S.green, look: -1, mood: 0.4, lean: acts === 1 ? 0 : 0 });
    out += k.bubble({ x: 80, y: 18, w: 44, h: 22, text: PAIR[0], tail: 0, size: 12 });
    out += emo(k, 230, 30, PAIR[1], 14);
    out += `<rect x="80" y="44" width="150" height="4" fill="${k.mix("#5fae78", "#e4572e", wr)}"/>`;
    for (let i = 0; i < cl; i++) out += k.dot({ x: 110 + i * 16, y: 100, r: 3, color: S.ice });
    if (acts >= 2) out += k.label({ x: 150, y: 70, text: acts === 3 ? "💥" : "💢", size: 14 });
    out += k.label({ x: 155, y: 88, text: ["never cleared up", "cleared up late", "cleared up soon"][clr], size: 8, color: ["#e4572e", "#e8913a", "#5fae78"][clr] });
    out += strip(k, [g.num("wrongness", "Wrong", " of 5", S.red), g.word("reads", "Reads"), g.num("clues", "Missed", "", S.ice), g.steps("acts", "Acts"), g.steps("cleared", "Cleared", S.green)]);
    return out + k.caption(`reads ${v("reads")} · ${v("acts")}`);
  });

  /* ======================= readingSigns ======================= */
  look("readingSigns", (v, k, g) => {
    const bel = v.p("belief");
    const sign = idx(v, "sign", 5);
    const cnt = Math.round(v.n("count"));
    const right = idx(v, "right", 4);
    const acts = idx(v, "acts", 4);
    let out = stage(k);
    const IC = ["7️⃣", "🐦‍⬛", "⛈️", "🎵", "🧥"][sign];
    out += guy(k, 160, { s: 0.85, color: S.blue, eyes: 0.6 + bel * 0.4, mood: bel - 0.5, lean: [0, 0, -12, -20][acts] });
    for (let i = 0; i < cnt; i++) {
      const a = (i / Math.max(1, cnt)) * Math.PI * 2;
      const x = 160 + Math.cos(a) * 110, y = 55 + Math.sin(a) * 40;
      out += emo(k, x, y, IC, 12);
      if (bel > 0.2) out += `<line x1="160" y1="58" x2="${r1(x)}" y2="${r1(y - 4)}" stroke="${S.gold}" opacity="${r1(bel * 0.6)}" stroke-dasharray="2 3"/>`;
      if (i < 4) out += k.label({ x: x + 8, y: y - 8, text: [["✗", "✗", "✗", "✗"], ["✓", "✗", "✗", "✓"], ["✓", "✗", "✓", "✓"], ["✓", "✓", "✓", "✓"]][right][i], size: 8, color: right >= 2 ? S.green : S.red });
    }
    if (acts >= 2) out += k.arrow({ x1: 160, y1: FY - 2, x2: [160, 160, 110, 60][acts], y2: FY - 2, color: S.orange, w: 2 });
    out += strip(k, [g.num("belief", "Belief", " of 5"), g.word("sign", "Sign"), g.num("count", "Signs", "", S.ice), g.steps("right", "Right", S.green), g.steps("acts", "Acts")]);
    return out + k.caption(`${cnt} signs · ${v("right")} · ${v("acts")}`);
  });

  /* ======================= crowdTurns ======================= */
  look("crowdTurns", (v, k, g) => {
    const turn = v.p("turn");
    const trig = idx(v, "trigger", 5);
    const first = idx(v, "first", 4);
    const sp = v.n("speed");
    const ag = idx(v, "against", 4);
    let out = stage(k);
    const n = 30;
    const turned = Math.round(turn * n);
    const order = (i) => [i, (i * 7) % n, i, i][first];
    const lead = first === 2 ? 0 : -1;
    for (let i = 0; i < n; i++) {
      const x = 20 + (i % 10) * 18, y = 40 + Math.floor(i / 10) * 20;
      const isT = first === 3 ? i < turned : order(i) < turned;
      out += k.dot({ x, y, r: i === lead ? 7 : 6, color: isT ? S.red : S.green });
    }
    out += emo(k, 100, 22, ["🎤", "🤥", "🗣️", "⚡", "🦁"][trig], 14);
    out += guy(k, 270, { s: 0.85, color: [S.blue, S.purple, S.grey, S.gold][ag], mood: -turn, look: -1 });
    out += stopwatch(k, 20, 100, 120, sp, 30, S.ice, `${fmt(sp)} s to spread`);
    out += strip(k, [g.num("turn", "Turns", " of 5", S.red), g.word("trigger", "Trigger"), g.word("first", "First"), g.num("speed", "Spreads in", " s", S.ice), g.word("against", "Against")]);
    return out + k.caption(`${turned} of ${n} turn on ${v("against")}`);
  });

  /* ======================= rallyingSpeech ======================= */
  look("rallyingSpeech", (v, k, g) => {
    const win = v.p("win");
    const tool = idx(v, "tool", 5);
    const st = idx(v, "start", 3);
    const conv = Math.round(v.n("converts"));
    const hold = idx(v, "holdout", 4);
    let out = stage(k, { spot: 50 });
    out += `<rect x="36" y="${FY - 26}" width="28" height="26" fill="#5a4a3a" stroke="${S.ink}"/>`;
    out += guy(k, 50, { y: FY - 26, s: 0.7, color: S.blue, arms: 0.2 + win * 0.8, mood: win - 0.3 });
    out += emo(k, 50, 20, ["🎤", "📄", "🦁", "😄", "🕯️"][tool], 14);
    const n = 30;
    const startFor = [0, 6, 15][st];
    const hN = [0, 1, 3, 1][hold];
    for (let i = 0; i < n; i++) {
      const x = 110 + (i % 10) * 19, y = 40 + Math.floor(i / 10) * 22;
      const isHold = i >= n - hN;
      const won = !isHold && i < startFor + conv;
      out += k.dot({ x, y, r: hold === 3 && isHold ? 8 : 6, color: isHold ? "#7a1f1f" : won ? S.gold : S.grey });
    }
    out += strip(k, [g.num("win", "Works", " of 5"), g.word("tool", "Wins by"), g.steps("start", "Starts"), g.num("converts", "Won over", "", S.gold), g.steps("holdout", "Holdout", S.red)]);
    return out + k.caption(`${conv} won over by ${v("tool")}`);
  });

  /* ======================= copying ======================= */
  look("copying", (v, k, g) => {
    const cp = v.p("copy");
    const what = idx(v, "what", 5);
    const who = idx(v, "who", 4);
    const dl = v.n("delay");
    const aw = idx(v, "aware", 3);
    let out = stage(k);
    const n = 7;
    const copiers = [1, 3, 5, 6][who];
    for (let i = 0; i < n; i++) {
      const x = 30 + i * 42;
      const copies = i === 0 || i <= copiers;
      const arms = i === 0 ? 0.9 : copies ? 0.9 * cp : 0;
      out += guy(k, x, { s: 0.7, color: i === 0 ? S.orange : S.blue, arms, look: aw === 0 ? 0 : i === 0 ? 0 : -1, eyes: aw === 2 ? 1 : 0.7 });
      if (copies && i > 0) out += k.label({ x, y: FY + 6, text: `+${fmt(dl * i * 0.3)}s`, size: 6, color: "#999" });
    }
    out += emo(k, 30, 14, ["👕", "💬", "😂", "✋", "👊"][what], 14);
    out += strip(k, [g.num("copy", "Copy", " of 5"), g.word("what", "What"), g.steps("who", "How many"), g.num("delay", "Delay", " s", S.ice), g.steps("aware", "Aware")]);
    return out + k.caption(`${v("who")} copy ${v("what")} · ${v("aware")}`);
  });

  /* ======================= rumor ======================= */
  look("rumor", (v, k, g) => {
    const sp = v.p("spread");
    const truth = idx(v, "truth", 4);
    const hops = Math.round(v.n("hops"));
    const gr = idx(v, "growth", 4);
    const reach = idx(v, "reaches", 4);
    let out = stage(k);
    const shown = Math.min(hops, 8);
    const col = k.mix("#e4572e", "#5fae78", truth / 3);
    for (let i = 0; i < shown; i++) {
      const x = 20 + i * (240 / Math.max(1, shown));
      out += k.face({ x, y: 80, r: 9, mood: 0.2, look: 1 });
      const f = [1 - i * 0.08, 1, 1 + i * 0.12, 1 + i * 0.3][gr];
      out += `<circle cx="${r1(x + 12)}" cy="56" r="${r1(Math.max(2, 5 * f))}" fill="${col}" opacity="0.85"/>`;
    }
    out += heads(k, Math.round(sp * 30), 20, 18, 220, { r: 3, color: "#8a7a6a" });
    const subjCol = ["#555", "#e8913a", "#ffd166", "#5fae78"][reach];
    out += k.face({ x: 290, y: 80, r: 14, mood: reach === 1 ? -0.6 : 0, color: subjCol });
    out += k.label({ x: 290, y: 104, text: ["never hears", "hears late", "hears soon", "hears first"][reach], size: 7, color: "#bbb" });
    out += strip(k, [g.num("spread", "Spreads", " of 5"), g.steps("truth", "True", S.green), g.num("hops", "Passes", " people", S.ice), g.steps("growth", "Grows", S.red), g.steps("reaches", "Subject")]);
    return out + k.caption(`${v("truth")} · ${v("growth")} · through ${hops}`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
