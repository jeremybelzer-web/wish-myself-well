/* look for the alone-with-themselves and healer curiosities in data/db-depth-alone.js (2026-10-05): the live picture
   at the top of each window, in the house style of look-depth-relations.js (helpers copied from there). Alone: the
   character stands by themselves under a thought cloud that runs from calm blue to stormy red with the main
   setting. Healing: a healer stands beside them and a warm light grows between them. The strip below shows every
   own setting. */
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

  const cloud = (k, x, y, p) => {
    const col = k.mix(S.teal, S.red, p);
    let out = "";
    [[-18, 4, 12], [0, -4, 16], [18, 4, 12], [0, 8, 13]].forEach(([dx, dy, r]) => (out += glow(x + dx, y + dy, r, col, 0.55)));
    const n = Math.round(p * 7);
    for (let i = 0; i < n; i++) {
      const a = (i / Math.max(1, n)) * Math.PI * 2;
      out += `<path d="M${r1(x + Math.cos(a) * 8)} ${r1(y + Math.sin(a) * 6)} l${r1(Math.cos(a + 1) * 9)} ${r1(Math.sin(a + 1) * 7)}" stroke="#fff" stroke-width="1.4" fill="none" opacity="0.8"/>`;
    }
    return out + glow(x - 12, y + 26, 3, col, 0.5) + glow(x - 6, y + 34, 2, col, 0.5);
  };
  /* Alone: one person, the room dim around them, a thought cloud above whose storm follows the main setting.
     flip: true when a high main setting is the calm end. */
  const self = (id, main, strips, flip) => look(id, (v, k, g) => {
    const raw = v.p(main);
    const p = flip ? 1 - raw : raw;
    let out = stage(k, { bg: k.mix("#1b2433", "#1a1216", p) });
    out += box(250, 30, 40, 50, k.mix("#2b3a55", "#3a2430", p), { rx: 2 });
    out += guy(k, 140, { color: S.blue, mood: 0.6 - p * 1.2, lean: p * 10 });
    out += cloud(k, 175, 34, p);
    out += chip(k, 60, 16, String(v(main)), "#33323d", "middle");
    out += strip(k, strips(g));
    return out + k.caption(`${String(v(main))}`);
  });
  /* Healing: the character and a healer side by side; the warm light between them grows with the main setting. */
  const heal = (id, main, strips) => look(id, (v, k, g) => {
    const p = v.p(main);
    let out = stage(k);
    out += glow(160, 70, 10 + p * 34, S.gold, 0.1 + p * 0.4);
    out += guy(k, 120 - p * 14, { color: S.blue, mood: -0.6 + p * 1.2, lean: p * 8 });
    out += guy(k, 205, { color: S.green, mood: 0.5, look: -1, s: 0.95 });
    out += chip(k, 160, 16, String(v(main)), "#33323d", "middle");
    out += strip(k, strips(g));
    return out + k.caption(`${String(v(main))}`);
  });

  self("innerWeather", "chaos", (g) => [g.num("chaos", "Peace or chaos", "%"), g.steps("usual", "Usual"), g.word("mood", "Feeling"), g.steps("thoughts", "Thoughts"), g.word("body", "In the body"), g.steps("shows", "Shows")]);
  self("selfTalk", "tone", (g) => [g.steps("tone", "Kind or cruel"), g.num("amount", "How much"), g.word("sounds", "Sounds like"), g.word("says", "Says"), g.steps("believe", "Believes it"), g.steps("argue", "Argues back")]);
  self("selfSoothe", "works", (g) => [g.num("works", "Works", "%"), g.word("how", "How"), g.steps("healthy", "Heals or numbs"), g.steps("fast", "How fast"), g.steps("ritual", "Ritual"), g.word("learned", "Learned from")], true);
  self("laughOrBeat", "harsh", (g) => [g.steps("answer", "Laugh or beat"), g.num("harsh", "How harsh"), g.steps("long", "How long"), g.steps("out", "Out loud"), g.word("kind", "Which mistakes"), g.steps("growing", "Changing")]);
  self("aloneComfort", "comfort", (g) => [g.num("comfort", "At ease", "%"), g.word("does", "Does"), g.steps("silence", "Silence"), g.steps("mirror", "Mirror"), g.steps("how-often", "How often"), g.steps("chose", "Chosen")], true);
  self("innerHurdle", "size", (g) => [g.num("size", "Inner hurdle"), g.num("outer", "Outer hurdle"), g.word("what", "What"), g.steps("aware", "Sees it"), g.steps("over", "Getting over"), g.steps("decides", "Decides it")]);
  self("selfCare", "care", (g) => [g.num("care", "Care", "%"), g.steps("body", "Body"), g.steps("mind", "Mind"), g.word("how", "How"), g.steps("first", "First"), g.steps("guilt", "Guilt")], true);
  heal("healerType", "skill", (g) => [g.num("skill", "Skill", "%"), g.word("kind", "Healer"), g.word("way", "How"), g.steps("healed", "Healed"), g.steps("looks", "Looks it"), g.steps("paid", "Paid")]);
  heal("facingFeelings", "stay", (g) => [g.steps("stay", "Run or stay"), g.word("feeling", "Feeling"), g.word("running", "Running to"), g.num("cost", "Cost"), g.steps("helped", "Help"), g.num("through", "Through", "%")]);
  heal("picturingOutcomes", "vivid", (g) => [g.steps("way", "Pictures"), g.num("vivid", "How vivid"), g.steps("guided", "Guided"), g.steps("feel", "Feels it"), g.steps("after", "After"), g.word("shown", "Shown as")]);
  heal("welcomingFeelings", "trust", (g) => [g.steps("welcome", "Greets them"), g.num("trust", "Trust", "%"), g.steps("practice", "Practice"), g.steps("breath", "Body"), g.word("words", "Says"), g.word("after", "Then")]);
  heal("awakening", "give", (g) => [g.steps("depth", "Awareness"), g.num("give", "Gives", "%"), g.steps("meaning", "Meaning"), g.steps("steady", "Steady"), g.steps("moment", "Moment"), g.word("shows", "Shows as")]);
  heal("healingArc", "stage", (g) => [g.steps("stage", "Stage"), g.steps("pace", "Pace"), g.steps("setback", "Step back"), g.word("who", "Helped by"), g.num("inner", "Inside", "%"), g.steps("shared", "Passes on")]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
