/* look for the belonging curiosities in data/db-depth-belonging.js (2026-10-05): the live picture at the top of each
   window, in the same house style as look-depth-frame.js. Every own setting moves something of its own. */
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

  /* A ring of people around the character: used by most pictures here. */
  const ringOf = (k, cx, n, r, color, o) => {
    let out = "";
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / Math.max(1, n - 1)) * Math.PI;
      out += guy(k, cx + Math.cos(a) * r, Object.assign({ s: 0.45, color, y: FY - 4 - Math.abs(Math.sin(a)) * 10 }, o || {}));
    }
    return out;
  };

  /* ======================= needApproval ======================= */
  look("needApproval", (v, k, g) => {
    const nd = v.n("need") / 100;
    const wh = idx(v, "whose", 6);
    const sw = idx(v, "swayed", 4);
    const hd = idx(v, "hides", 3);
    const wt = idx(v, "withheld", 4);
    const sr = v.n("source") / 5;
    let out = stage(k);
    out += ringOf(k, 220, 5, 70, S.grey);
    out += guy(k, 110 + sw * 20, { color: S.blue, lean: nd * 20, look: 1, mood: hd === 2 ? 0.3 : -0.3 * nd });
    for (let i = 0; i < Math.round(nd * 5); i++) out += k.arrow({ x1: 120 + sw * 20, y1: 60 + i * 6, x2: 170, y2: 60 + i * 6, color: S.gold, w: 1 });
    out += glow(110 + sw * 20, 50, 4 + sr * 16, S.green, 0.4);
    out += k.text({ x: 290, y: 24, text: ["👪", "💑", "🧑‍🤝‍🧑", "👥", "🌐", "👔"][wh], size: 14 });
    out += k.label({ x: 20, y: 18, text: ["shrugs", "tries harder", "sulks", "turns on them"][wt], size: 8, color: wt === 3 ? S.red : "#ccc", anchor: "start" });
    out += strip(k, [g.num("need", "Need", "%", S.gold), g.steps("whose", "Whose"), g.steps("swayed", "Swayed"), g.steps("hides", "Hides"), g.steps("withheld", "Withheld", S.red), g.num("source", "Inside", "", S.green)]);
    return out + k.caption(`needs ${v("whose")}'s nod: ${v.n("need")}%`);
  });

  /* ======================= loveOrientation ======================= */
  look("loveOrientation", (v, k, g) => {
    const tw = v.n("toward") / 100;
    const wa = v.n("want") / 5;
    const hv = v.n("have") / 5;
    const on = idx(v, "one", 6);
    const sh = idx(v, "shows", 4);
    const jl = v.n("jealous") / 5;
    let out = stage(k);
    out += ringOf(k, 80, 5, 50, S.grey, { alpha: 1 - tw * 0.6 });
    out += guy(k, 250, { color: S.pink, alpha: 0.4 + tw * 0.6, label: ["?", "partner", "crush", "friend", "parent", "child"][on] });
    out += guy(k, 80 + tw * 120, { color: S.blue, look: tw > 0.5 ? 1 : -1, arms: [-0.3, 0.4, 0.8, 0.6][sh] });
    out += glow(80 + tw * 120, 50, 6 + wa * 18, S.pink, 0.3) + glow(80 + tw * 120, 50, 4 + hv * 14, S.gold, 0.45);
    if (jl > 0) out += k.text({ x: 300, y: 20, text: "💢", size: 8 + jl * 10 });
    out += strip(k, [g.num("toward", "To one", "%", S.pink), g.num("want", "Want"), g.num("have", "Have", "", S.gold), g.steps("one", "The one"), g.steps("shows", "Reaches"), g.num("jealous", "Jealous", "", S.red)]);
    return out + k.caption(tw > 0.5 ? `wants one person: ${v("one")}` : "wants the whole group's love");
  });

  /* ======================= circleSize ======================= */
  const NS = [0, 1, 3, 7, 12];
  look("circleSize", (v, k, g) => {
    const sz = idx(v, "size", 5);
    const wn = idx(v, "wants", 5);
    const ce = idx(v, "center", 4);
    const ch = idx(v, "changes", 5);
    const ou = idx(v, "outsider", 4);
    const co = v.n("cost") / 5;
    let out = stage(k);
    const n = NS[sz];
    for (let i = 0; i < n; i++) out += k.dot({ x: 150 + Math.cos((i / Math.max(1, n)) * 6.28) * (20 + n * 4), y: 60 + Math.sin((i / Math.max(1, n)) * 6.28) * (14 + n * 2), r: 4, color: S.grey });
    out += k.ring({ x: 150, y: 60, r: 18 + NS[wn] * 4, color: S.gold, w: 1, dash: "3 3" });
    out += k.dot({ x: 150 + (3 - ce) * 18, y: 60, r: 6, color: S.blue });
    out += k.text({ x: 40, y: 30, text: ["⏬", "🔽", "⏸️", "🔼", "⏫"][ch], size: 14 });
    out += k.dot({ x: 290, y: 60, r: 5, color: [S.green, S.gold, S.grey, S.red][ou] });
    out += box(20, 100, 120 * co, 6, S.red, { rx: 3 });
    out += strip(k, [g.steps("size", "Circle"), g.steps("wants", "Wants", S.gold), g.steps("center", "Place"), g.steps("changes", "Going"), g.steps("outsider", "Outsiders"), g.num("cost", "Cost", "", S.red)]);
    return out + k.caption(`${v("size")}, ${v("changes")}`);
  });

  /* ======================= inCharge ======================= */
  look("inCharge", (v, k, g) => {
    const rk = idx(v, "rank", 5);
    const wn = idx(v, "wants", 5);
    const gr = v.n("grip") / 5;
    const st = idx(v, "style", 5);
    const ea = idx(v, "earned", 4);
    const wt = v.n("weight") / 5;
    let out = stage(k);
    for (let i = 0; i < 5; i++) out += box(40 + i * 50, FY - 10 - i * 16, 46, 10 + i * 16, "#33323d", { stroke: "#555" });
    out += guy(k, 63 + rk * 50, { y: FY - 10 - rk * 16, s: 0.6, color: S.blue, lean: (1 - gr) * 15, arms: -wt });
    out += k.dot({ x: 63 + wn * 50, y: FY - 30 - wn * 16 - 10, r: 4, color: S.gold });
    out += k.text({ x: 300, y: 24, text: ["🤫", "🏃", "😊", "😠", "📜"][st], size: 14 });
    out += k.label({ x: 20, y: 18, text: ["born into it", "given it", "took it", "earned it"][ea], size: 8, color: "#ccc", anchor: "start" });
    out += strip(k, [g.steps("rank", "Rank"), g.steps("wants", "Wants", S.gold), g.num("grip", "Grip"), g.steps("style", "Style"), g.steps("earned", "Earned"), g.num("weight", "Weight", "", S.red)]);
    return out + k.caption(`${v("rank")}, wants ${v("wants")}`);
  });

  /* ======================= reliance ======================= */
  look("reliance", (v, k, g) => {
    const ln = v.n("lean") / 100;
    const wh = idx(v, "who", 5);
    const wt = v.n("weight") / 5;
    const ad = idx(v, "admits", 4);
    const rs = v.n("resent") / 5;
    const fl = idx(v, "flip", 3);
    let out = stage(k);
    out += guy(k, 160, { color: S.blue, lean: (ln - 0.5) * 20 * (fl === 2 ? -1 : 1), arms: -wt * 0.8 });
    for (let i = 0; i < 4; i++) {
      const x = i < 2 ? 70 + i * 30 : 220 + (i - 2) * 30;
      out += guy(k, x, { s: 0.6, color: S.grey, lean: (i < 2 ? 1 : -1) * (ln - 0.5) * 30 });
    }
    out += box(120, 10, 80 * wt, 6, S.orange, { rx: 3 });
    out += k.text({ x: 300, y: 24, text: ["👪", "💑", "🧑‍🤝‍🧑", "💼", "🏘️"][wh], size: 14 });
    out += k.label({ x: 160, y: 30, text: ["won't ask", "if desperate", "sometimes asks", "asks"][ad], size: 8, color: "#ccc" });
    if (rs > 0) out += glow(160, 60, 6 + rs * 14, S.red, 0.25);
    out += marks(20, 8, 60, 3, fl + 1, S.purple, 4);
    out += strip(k, [g.num("lean", "Leaned on", "%"), g.steps("who", "Who"), g.num("weight", "Weight", "", S.orange), g.steps("admits", "Asks"), g.num("resent", "Resent", "", S.red), g.steps("flip", "Flipped", S.purple)]);
    return out + k.caption(ln > 0.5 ? `${v("who")} lean on them` : `they lean on ${v("who")}`);
  });

  /* ======================= thriving ======================= */
  look("thriving", (v, k, g) => {
    const nw = v.n("now") / 100;
    const ps = idx(v, "past", 5) / 4;
    const hd = idx(v, "heading", 5);
    const ar = idx(v, "area", 6);
    const sh = idx(v, "shows", 3);
    const kn = idx(v, "knows", 3);
    let out = stage(k);
    const y = (p) => 100 - p * 80;
    const next = k.clamp(nw + (hd - 2) * 0.2, 0, 1);
    out += `<path d="M20 ${r1(y(ps))} L160 ${r1(y(nw))} L300 ${r1(y(next))}" stroke="${S.gold}" stroke-width="2" fill="none"/>`;
    out += `<path d="M160 ${r1(y(nw))} L300 ${r1(y(next))}" stroke="${hd < 2 ? S.red : S.green}" stroke-width="2.5" fill="none" stroke-dasharray="5 3"/>`;
    out += k.dot({ x: 160, y: y(nw), r: 6, color: S.blue, }) + k.label({ x: 20, y: 110, text: "before", size: 8, color: "#ccc", anchor: "start" }) + k.label({ x: 300, y: 110, text: "next", size: 8, color: "#ccc", anchor: "end" });
    out += k.text({ x: 40, y: 20, text: ["💰", "❤️", "🩺", "💼", "👪", "🧠"][ar], size: 12 });
    out += box(140, 4, 40, 8, S.grey, { alpha: [0.2, 0.6, 1][sh], rx: 3 });
    out += k.text({ x: 290, y: 20, text: ["🙈", "🤔", "👁️"][kn], size: 12 });
    out += strip(k, [g.num("now", "Now", "%", S.blue), g.steps("past", "Before"), g.steps("heading", "Heading"), g.steps("area", "Area"), g.steps("shows", "Shows"), g.steps("knows", "Sees it")]);
    return out + k.caption(`${v("past")} before, ${v("heading")} now`);
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
