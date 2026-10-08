/* look for the kid goals curiosities in data/db-depth-kid-goals.js (2026-10-08): the live picture at the top of each
   window, in the same house style as look-depth-belonging.js. Every own setting moves something of its own. */
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

  /* A ring of people around the character. */
  const ringOf = (k, cx, n, r, color, o) => {
    let out = "";
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / Math.max(1, n - 1)) * Math.PI;
      out += guy(k, cx + Math.cos(a) * r, Object.assign({ s: 0.45, color, y: FY - 4 - Math.abs(Math.sin(a)) * 10 }, o || {}));
    }
    return out;
  };

  /* ======================= kidGoal ======================= */
  look("kidGoal", (v, k, g) => {
    const rk = v.n("risk") / 100;
    const tg = idx(v, "tangible", 4);
    const aw = idx(v, "aware", 4);
    const wa = idx(v, "watched", 4);
    const ag = idx(v, "age", 6);
    const cs = v.n("cost") / 5;
    let out = stage(k);
    const gx = 290 - tg * 40;
    out += k.text({ x: gx, y: 50, text: "⭐", size: 18 });
    out += guy(k, 70, { color: S.blue, s: 0.5 + ag * 0.08, lean: rk * 25, arms: rk, mood: -cs });
    out += box(90, 60 - rk * 30, rk * (gx - 100), 4, S.red, { rx: 2 });
    for (let i = 0; i < 3 - aw; i++) out += k.text({ x: 140 + i * 30, y: 100, text: "⚠️", size: 10 });
    if (wa > 1) out += guy(k, 40, { color: S.green, s: 0.5 + wa * 0.1, alpha: 0.8 });
    out += strip(k, [g.num("risk", "Risk", "%", S.red), g.steps("tangible", "Close"), g.steps("aware", "Aware"), g.steps("watched", "Watched", S.green), g.word("age", "Age"), g.num("cost", "Cost", "", S.orange)]);
    return out + k.caption(`risks ${v.n("risk")}% for a goal ${v("tangible")}`);
  });

  /* ======================= preteenGoal ======================= */
  look("preteenGoal", (v, k, g) => {
    const dr = idx(v, "dare", 4);
    const fw = v.n("forWhom") / 100;
    const pr = idx(v, "prize", 4);
    const kd = idx(v, "kind", 5);
    const sc = idx(v, "secret", 3);
    let out = stage(k);
    out += box(158, 10, 4, FY - 10, S.beige);
    out += guy(k, 160, { color: S.orange, s: 0.6, y: FY - dr * 22, arms: 1 });
    out += ringOf(k, 160, Math.round(fw * 6), 90, S.grey);
    out += k.text({ x: 290, y: 24, text: ["🍬", "🏅", "💘", "🌟"][pr], size: 14 });
    out += k.text({ x: 30, y: 24, text: ["🧗", "🃏", "🔥", "👀", "🕵️"][kd], size: 14 });
    if (sc < 2) out += guy(k, 280, { color: S.purple, s: 0.55, alpha: sc === 0 ? 1 : 0.4 });
    out += strip(k, [g.steps("dare", "Dare", S.red), g.num("forWhom", "For others", "%"), g.steps("prize", "Prize"), g.word("kind", "Kind"), g.steps("secret", "Secret")]);
    return out + k.caption(`${v("kind")}: ${v("dare")}`);
  });

  /* ======================= teenGoal ======================= */
  look("teenGoal", (v, k, g) => {
    const sz = idx(v, "size", 4);
    const fr = v.n("freedom") / 100;
    const id = v.n("identity") / 5;
    const kd = idx(v, "kind", 6);
    const cr = idx(v, "crew", 4);
    let out = stage(k);
    out += box(20, 20, 60 + sz * 55, 10 + sz * 6, S.frame, { stroke: S.gold, rx: 3 });
    out += guy(k, 160, { color: S.teal, s: 0.6 + id * 0.25, arms: id });
    for (let i = 0; i < [0, 1, 3, 6][cr]; i++) out += guy(k, 200 + i * 18, { color: S.grey, s: 0.45 });
    if (fr < 0.9) out += `<line x1="110" y1="${FY - 30}" x2="160" y2="${FY - 40}" stroke="${S.red}" stroke-width="2" stroke-dasharray="${r1(2 + fr * 20)} 4"/>` + guy(k, 110, { color: S.wood, s: 0.6 });
    out += k.text({ x: 295, y: 24, text: ["👑", "💘", "🗝️", "📋", "🚪", "🤘"][kd], size: 14 });
    out += strip(k, [g.steps("size", "Size"), g.num("freedom", "Freedom", "%", S.green), g.num("identity", "Who I am", "", S.purple), g.word("kind", "Kind"), g.steps("crew", "Crew")]);
    return out + k.caption(`${v("kind")}, ${v("size")}`);
  });

  /* ======================= shyKidGoal ======================= */
  look("shyKidGoal", (v, k, g) => {
    const sn = v.n("seen") / 100;
    const br = idx(v, "brave", 4);
    const hp = idx(v, "helper", 4);
    const rt = v.n("retreat") / 5;
    let out = stage(k);
    out += ringOf(k, 160, 5, 80, S.grey);
    out += glow(160, 70, 6 + br * 12, S.gold, 0.35);
    out += guy(k, 160, { color: S.blue, s: 0.5 + sn * 0.3, alpha: 0.35 + sn * 0.65, arms: br / 3, lean: -rt * 15 });
    if (hp > 0) out += guy(k, 110, { color: [S.grey, S.green, S.orange, S.wood][hp], s: 0.6 });
    out += strip(k, [g.num("seen", "Seen", "%", S.gold), g.steps("brave", "Brave", S.green), g.word("helper", "Helper"), g.num("retreat", "Hides", "", S.grey)]);
    return out + k.caption(`brave moment: ${v("brave")}`);
  });

  /* ======================= sportsKidGoal ======================= */
  look("sportsKidGoal", (v, k, g) => {
    const ht = idx(v, "hurt", 4);
    const fw = v.n("forWhom") / 100;
    const lv = idx(v, "level", 5);
    const wl = idx(v, "winLose", 4);
    let out = stage(k, { floor: S.green });
    out += guy(k, 150, { color: S.red, s: 0.7, walk: 1, lean: ht * 8, mood: wl >= 2 ? 0.6 : -0.6 });
    for (let i = 0; i < ht; i++) out += k.text({ x: 125 + i * 12, y: 60, text: "🩹", size: 9 });
    out += guy(k, 240, { color: S.wood, s: 0.5 + fw * 0.4, arms: fw });
    out += marks(20, 20, 120, 5, lv + 1, S.gold);
    out += k.text({ x: 290, y: 24, text: ["😞", "😕", "🙂", "🏆"][wl], size: 14 });
    out += strip(k, [g.steps("hurt", "Hurt", S.red), g.num("forWhom", "For coach", "%"), g.steps("level", "Level", S.gold), g.steps("winLose", "Result", S.green)]);
    return out + k.caption(`${v("level")}, ${v("hurt")}`);
  });

  /* ======================= lateLifeGoal ======================= */
  look("lateLifeGoal", (v, k, g) => {
    const tl = idx(v, "timeLeft", 4);
    const lk = v.n("looking") / 100;
    const fw = idx(v, "forWhom", 4);
    const kd = idx(v, "kind", 5);
    let out = stage(k, { bg: k.mix ? "#1d1a22" : S.bg });
    out += glow(270, 40 + tl * 15, 20, S.orange, 0.5 - tl * 0.08);
    out += guy(k, 150, { color: S.beige, s: 0.65, lean: 6, mood: lk * 2 - 1 });
    out += k.text({ x: 40, y: 24, text: ["🙂", "👪", "👶", "🙏"][fw], size: 14 });
    out += k.text({ x: 200, y: 70, text: ["🕊️", "🌳", "🧭", "🙏", "🌅"][kd], size: 16 });
    out += strip(k, [g.steps("timeLeft", "Time left", S.orange), g.num("looking", "Grateful", "%", S.gold), g.word("forWhom", "For"), g.word("kind", "Kind")]);
    return out + k.caption(`${v("kind")}, ${v("timeLeft")} time left`);
  });

  /* ======================= friendGroup ======================= */
  look("friendGroup", (v, k, g) => {
    const st = idx(v, "status", 5);
    const gp = idx(v, "group", 6);
    const ti = v.n("tight") / 5;
    const wo = v.n("wantOut") / 5;
    const os = idx(v, "outsiders", 4);
    let out = stage(k);
    for (let i = 0; i < 5; i++) out += box(20 + i * 58, 100 - i * 14, 52, 6, i === st ? S.gold : "#33323d", { rx: 2 });
    const cx = 49 + st * 58;
    for (let i = 0; i < 3; i++) out += guy(k, cx - 12 * (1 - ti * 0.6) + i * 12 * (1 - ti * 0.6), { color: [S.grey, S.purple, S.blue, S.red, S.teal, S.gold][gp], s: 0.35, y: 98 - st * 14 });
    out += guy(k, cx + 20 + wo * 60, { color: S.white, s: 0.35, y: 98 - st * 14, look: 1, alpha: 0.9 });
    out += k.label({ x: 300, y: 18, text: ["kind", "ignores", "teases", "cruel"][os], size: 8, color: os === 3 ? S.red : "#ccc", anchor: "end" });
    out += strip(k, [g.steps("status", "Status", S.gold), g.word("group", "Group"), g.num("tight", "Tight", ""), g.num("wantOut", "Want out", "", S.orange), g.steps("outsiders", "Outsiders", S.red)]);
    return out + k.caption(`${v("group")}: ${v("status")}`);
  });

  /* ======================= siblingHero ======================= */
  look("siblingHero", (v, k, g) => {
    const lu = v.n("lookUp") / 100;
    const li = idx(v, "letIn", 4);
    const pr = v.n("pride") / 5;
    const mo = idx(v, "moment", 5);
    let out = stage(k);
    out += glow(200, 60, 8 + lu * 30, S.gold, 0.4);
    out += guy(k, 200, { color: S.red, s: 0.8 });
    out += guy(k, 200 - 30 - (3 - li) * 30, { color: S.blue, s: 0.55, look: 1, mood: pr, arms: pr * 0.8 });
    out += k.text({ x: 290, y: 24, text: ["🛟", "🎲", "💛", "🚗", "🛡️"][mo], size: 14 });
    out += strip(k, [g.num("lookUp", "Looks up", "%", S.gold), g.steps("letIn", "Let in"), g.num("pride", "Pride", "", S.green), g.word("moment", "Moment")]);
    return out + k.caption(`looks up ${v.n("lookUp")}%: ${v("moment")}`);
  });

  /* ======================= rulesBreakable ======================= */
  look("rulesBreakable", (v, k, g) => {
    const sz = idx(v, "size", 4);
    const hm = idx(v, "harm", 4);
    const th = v.n("thrill") / 5;
    const st = idx(v, "stays", 4);
    const cg = idx(v, "caught", 3);
    let out = stage(k);
    out += box(150, FY - 20 - sz * 15, 10, 20 + sz * 15, S.grey);
    out += `<line x1="140" y1="${FY - 10 - sz * 12}" x2="175" y2="${FY - 20 - sz * 8}" stroke="${S.red}" stroke-width="3"/>`;
    out += guy(k, 200, { color: S.orange, s: 0.6, arms: th, mood: th * 2 - 1, lean: -10 });
    for (let i = 0; i < hm; i++) out += guy(k, 40 + i * 22, { color: S.grey, s: 0.4, alpha: 0.7 });
    out += glow(200, 50, 4 + st * 8, S.purple, 0.4);
    if (cg > 0) out += k.text({ x: 290, y: 24, text: cg === 2 ? "🚨" : "👀", size: 14 });
    out += strip(k, [g.steps("size", "Rule", S.red), g.steps("harm", "Harm"), g.num("thrill", "Thrill", "", S.gold), g.steps("stays", "Stays", S.purple), g.steps("caught", "Caught")]);
    return out + k.caption(`breaks a ${v("size")} rule`);
  });

  /* ======================= coolGrownup ======================= */
  look("coolGrownup", (v, k, g) => {
    const cl = v.n("cool") / 100;
    const te = idx(v, "teaches", 4);
    const he = idx(v, "hero", 5);
    const hg = v.n("hangs") / 5;
    let out = stage(k);
    out += guy(k, 120, { color: S.frame, s: 0.85, lean: -cl * 10, mood: cl, arms: cl * 0.5 });
    for (let i = 0; i < 4; i++) out += guy(k, 170 + i * (16 + (1 - hg) * 20), { color: S.blue, s: 0.45, look: -1, arms: te / 3 });
    out += k.text({ x: 40, y: 24, text: ["❔", "🎸", "🏅", "📚", "🎬"][he], size: 14 });
    out += glow(120, 40, 5 + cl * 20, S.gold, 0.35);
    out += strip(k, [g.num("cool", "Cool", "%", S.gold), g.steps("teaches", "Teaches"), g.word("hero", "Hero"), g.num("hangs", "Hangs out", "", S.green)]);
    return out + k.caption(`cool ${v.n("cool")}%, teaches ${v("teaches")}`);
  });

  /* ======================= rizz ======================= */
  look("rizz", (v, k, g) => {
    const rz = v.n("rizz") / 100;
    const ld = idx(v, "lands", 4);
    const nv = v.n("nerve") / 5;
    const sy = idx(v, "style", 5);
    let out = stage(k);
    out += guy(k, 120 + nv * 40, { color: S.teal, s: 0.75, lean: nv * 10, arms: rz * 0.6 });
    out += guy(k, 230, { color: S.pink, s: 0.7, look: -1, mood: ld / 1.5 - 1 });
    for (let i = 0; i < Math.round(rz * 5); i++) out += k.text({ x: 175 + i * 6, y: 40 - i * 4, text: "✨", size: 8 });
    out += k.text({ x: 30, y: 24, text: ["😂", "💐", "😎", "🕶️", "💛"][sy], size: 14 });
    out += strip(k, [g.num("rizz", "Rizz", "%", S.pink), g.steps("lands", "Lands", S.green), g.num("nerve", "Nerve", ""), g.word("style", "Style")]);
    return out + k.caption(`rizz ${v.n("rizz")}%, lands ${v("lands")}`);
  });

  /* ======================= aura ======================= */
  look("aura", (v, k, g) => {
    const au = (v.n("aura") + 100) / 200;
    const sn = idx(v, "seen", 4);
    const tr = idx(v, "trend", 5);
    const ef = v.n("effort") / 5;
    let out = stage(k);
    out += glow(160, 60, 5 + au * 45, au > 0.5 ? S.gold : S.purple, 0.3 + Math.abs(au - 0.5) * 0.6);
    out += guy(k, 160, { color: S.blue, s: 0.8, mood: au * 2 - 1, arms: ef * 0.8, lean: ef * 6 });
    for (let i = 0; i < [0, 1, 3, 6][sn]; i++) out += guy(k, i % 2 ? 230 + i * 12 : 90 - i * 12, { color: S.grey, s: 0.4, look: i % 2 ? -1 : 1 });
    out += k.arrow({ x1: 290, y1: 60, x2: 290, y2: 60 - (tr - 2) * 15, color: tr >= 2 ? S.green : S.red, w: 2 });
    out += strip(k, [g.num("aura", "Aura", "", S.gold), g.steps("seen", "Seen by"), g.steps("trend", "Going", S.green), g.num("effort", "Trying", "", S.orange)]);
    return out + k.caption(`aura ${v.n("aura")}, ${v("trend")}`);
  });

  /* ======================= attractionTime ======================= */
  look("attractionTime", (v, k, g) => {
    const sh = v.n("share") / 100;
    const sg = idx(v, "stage", 5);
    const pl = v.n("pull") / 5;
    const tw = idx(v, "toward", 4);
    let out = stage(k);
    out += guy(k, 110, { color: S.blue, s: 0.45 + sg * 0.1, look: 1, lean: pl * 12 });
    out += `<circle cx="110" cy="40" r="22" fill="#33323d"/><path d="M110 40 L110 18 A22 22 0 ${sh > 0.5 ? 1 : 0} 1 ${r1(110 + 22 * Math.sin(sh * 6.283))} ${r1(40 - 22 * Math.cos(sh * 6.283))} Z" fill="${S.pink}"/>`;
    out += k.text({ x: 250, y: 70, text: ["❔", "💞", "💗", "🌈"][tw], size: 18 });
    out += strip(k, [g.num("share", "Mind", "%", S.pink), g.steps("stage", "Stage"), g.num("pull", "Pull", "", S.orange), g.word("toward", "Toward")]);
    return out + k.caption(`${v.n("share")}% of the mind, ${v("stage")}`);
  });

  /* ======================= godInLife ======================= */
  look("godInLife", (v, k, g) => {
    const bl = idx(v, "belief", 5);
    const gi = idx(v, "godIs", 5);
    const dl = v.n("deal") / 5;
    const gr = v.n("grateful") / 5;
    const dr = v.n("drives") / 5;
    let out = stage(k);
    out += glow(160, 20, 4 + bl * 10, S.gold, 0.15 + bl * 0.1);
    out += k.text({ x: 160, y: 30, text: ["⚖️", "👪", "🤝", "🌍", "🕉️"][gi], size: 12 + bl * 2 });
    out += guy(k, 160, { color: S.purple, s: 0.7, arms: gr, lean: dr * 8 });
    for (let i = 0; i < Math.round(dl * 4); i++) out += k.text({ x: 200 + i * 18, y: 70, text: "🤝", size: 9 });
    out += strip(k, [g.steps("belief", "Belief", S.gold), g.word("godIs", "God is"), g.num("deal", "Deals", ""), g.num("grateful", "Grateful", "", S.green), g.num("drives", "Drives", "", S.orange)]);
    return out + k.caption(`${v("belief")}: God is ${v("godIs")}`);
  });

  /* ======================= bornNature ======================= */
  look("bornNature", (v, k, g) => {
    const df = v.n("different") / 100;
    const fx = v.n("fixed") / 5;
    const ln = idx(v, "leaning", 6);
    const fg = v.n("fights") / 5;
    const cols = [S.red, S.green, S.blue, S.wood, S.gold, S.orange];
    let out = stage(k);
    out += guy(k, 110, { color: cols[ln], s: 0.7, lean: fg * 12, mood: -fg });
    out += guy(k, 210, { color: cols[(ln + Math.round(df * 3)) % 6], s: 0.7, lean: df * -15 });
    out += box(80, 30, 60, 8, "#33323d", { rx: 4 }) + box(80, 30, 60 * fx, 8, S.purple, { rx: 4 });
    out += strip(k, [g.num("different", "Different", "%", S.orange), g.num("fixed", "Fixed", "", S.purple), g.word("leaning", "Leaning"), g.num("fights", "Fights it", "", S.red)]);
    return out + k.caption(`${v("leaning")}, ${v.n("different")}% unlike their siblings`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
