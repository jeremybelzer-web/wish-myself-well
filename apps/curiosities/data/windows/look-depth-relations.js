/* look for the relationship curiosities in data/db-depth-relations.js (2026-10-05): the live picture at the top of
   each window, in the same house style as look-depth-frame.js. The character stands in the middle, the people or
   thing named by the main setting gather around them, and the strip below shows every own setting. */
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

  /* The character in the middle; a ring of figures (or a glow) whose size and color follow the main setting, and a
     word chip for the first word setting. Every own setting also moves its gauge in the strip. */
  const rel = (id, main, strips) => look(id, (v, k, g) => {
    const p = v.p(main);
    let out = stage(k);
    const n = 1 + Math.round(p * 5);
    for (let i = 0; i < n; i++) out += guy(k, 40 + i * 50 + (i >= 2 ? 80 : 0), { s: 0.55, color: k.mix(S.grey, S.purple, p), look: i < 2 ? 1 : -1, alpha: 0.5 + p * 0.5 });
    out += guy(k, 160, { color: S.blue, mood: 0.6 - p * 1.2, lean: (p - 0.5) * 16 });
    out += glow(160, 60, 8 + p * 26, S.gold, 0.12 + p * 0.35);
    out += chip(k, 160, 16, String(v(main)), "#33323d", "middle");
    out += strip(k, strips(g));
    return out + k.caption(`${String(v(main))}`);
  });
  rel("whoIsNear", "who", (g) => [g.steps("who", "Who is"), g.steps("where", "Where they"), g.steps("close", "How close"), g.steps("many", "How many"), g.steps("power", "Their power"), g.steps("wanted", "Wanted or")]);
  rel("whatIsNear", "pull", (g) => [g.num("pull", "How hard"), g.steps("what", "What it"), g.steps("reach", "How easy"), g.steps("whose", "Whose it"), g.steps("watched", "Is anyone"), g.steps("means", "What it")]);
  rel("copingStyle", "style", (g) => [g.steps("style", "How they"), g.num("strength", "How strong"), g.steps("fast", "How fast"), g.steps("seen", "Do others"), g.steps("since", "Since when"), g.steps("changing", "Is it")]);
  rel("reliefSeeking", "urge", (g) => [g.num("urge", "How strong"), g.steps("by", "What they"), g.steps("act", "What they"), g.steps("hidden", "How hidden"), g.steps("after", "How they"), g.num("loop", "How fast")]);
  rel("attachment", "style", (g) => [g.steps("style", "Attachment style"), g.num("strength", "How strongly"), g.steps("to", "With whom"), g.steps("stress", "Under stress"), g.num("trust", "How much"), g.steps("healing", "Is it")]);
  rel("authorityStance", "stance", (g) => [g.steps("stance", "Stance"), g.num("trust", "Trust in"), g.steps("which", "Which authority"), g.steps("shows", "How it"), g.steps("why", "Where it"), g.steps("changing", "Is it")]);
  rel("groupStance", "comfort", (g) => [g.num("comfort", "Comfort in"), g.steps("kind", "Which group"), g.steps("prefers", "What they"), g.steps("strangers", "With strangers"), g.steps("move", "What they"), g.steps("after", "Afterwards")]);
  rel("kindredPeople", "who", (g) => [g.steps("who", "Their kind"), g.num("with", "Comfort with"), g.num("without", "Comfort everywhere"), g.steps("where", "Where they"), g.num("opens", "How much"), g.steps("exclusive", "Closed to")]);
  rel("socialPlace", "standing", (g) => [g.steps("standing", "Standing"), g.num("money", "Money"), g.steps("insider", "Insider or"), g.steps("born", "Born into"), g.steps("feel", "How they"), g.steps("moving", "Moving")]);
  rel("livingSituation", "with", (g) => [g.steps("with", "Lives with"), g.steps("feel", "How they"), g.num("free", "How independent"), g.steps("leave", "Want to"), g.steps("space", "Room of"), g.num("shown", "How much")]);
  rel("craft", "skill", (g) => [g.num("skill", "How good"), g.steps("what", "What it"), g.steps("speed", "How fast"), g.num("love", "How much"), g.steps("seen", "Recognized by"), g.steps("tools", "Help they")]);
  rel("worldShift", "effect", (g) => [g.steps("effect", "Easier or"), g.steps("kind", "What changed"), g.steps("fast", "How fast"), g.steps("adapt", "How they"), g.steps("others", "Is it"), g.num("big", "How big")]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
