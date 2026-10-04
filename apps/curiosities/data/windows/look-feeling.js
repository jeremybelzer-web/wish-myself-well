/* Feeling: the live picture at the top of each feeling curiosity's window (CuriosityWindows.look).
   Pictures follow one idea: show the feeling on people (faces, bodies, distance) and, where it lives in time,
   as a line through the scene or the film. Every own setting moves something on its own, so no setting
   hides another one. */
(function (W) {
  const r1 = (n) => Math.round(n * 10) / 10;
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  /* Small grey words. */
  const S = (k, x, y, t, c, a, sz) => k.label({ x, y, text: t, size: sz || 8, color: c || "#bbb", anchor: a || "middle" });
  /* Index of a word setting on its scale (0, 1, 2 ...). */
  const I = (v, id) => {
    const s = v.slider(id);
    const n = s && Array.isArray(s.scale) ? s.scale.length : 2;
    return Math.round(v.p(id) * (n - 1));
  };
  const bump = (t, c, w) => Math.exp(-Math.pow((t - c) / Math.max(0.01, w), 2));
  /* A smooth line through evenly spaced heights. */
  const smooth = (a) => (t) => {
    const x = cl(t, 0, 1) * (a.length - 1);
    const i = Math.min(a.length - 2, Math.floor(x));
    const g = (1 - Math.cos((x - i) * Math.PI)) / 2;
    return a[i] + (a[i + 1] - a[i]) * g;
  };
  /* A box to draw a line through time in: {x, y, w, h}. */
  const px = (b, t) => b.x + cl(t, 0, 1) * b.w;
  const py = (b, y) => b.y + b.h - cl(y, 0, 1) * b.h;
  const box = (k, b, label) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="5" fill="#1d1d24" stroke="#33333d"/>` + (label ? S(k, b.x + 4, b.y + 9, label, "#888", "start", 7) : "");
  function line(k, b, f, o) {
    o = o || {};
    const n = o.n || 72;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(`${r1(px(b, t))},${r1(py(b, f(t)))}`);
    }
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${o.color || "#ffd166"}" stroke-width="${o.w || 2.5}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.alpha != null ? ` opacity="${o.alpha}"` : ""}/>`;
  }
  const vline = (k, b, t, color, text) => {
    const x = r1(px(b, t));
    return `<line x1="${x}" y1="${b.y}" x2="${x}" y2="${b.y + b.h}" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 2"/>` + (text ? S(k, cl(x, b.x + 30, b.x + b.w - 30), b.y - 2, text, color) : "");
  };
  /* A thin bar standing for the scene (or film), with pieces and pins on it. */
  const bar = (k, x, y, w, label) => `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="#2c2c34"/>` + (label ? S(k, x, y - 2, label, "#999", "start", 7) : "");
  const piece = (k, x, y, w, a, b, color) => {
    const x1 = x + cl(Math.min(a, b), 0, 1) * w;
    const x2 = x + cl(Math.max(a, b), 0, 1) * w;
    return `<rect x="${r1(x1)}" y="${y}" width="${r1(Math.max(2, x2 - x1))}" height="7" rx="3" fill="${color}"/>`;
  };
  const pin = (k, x, y, w, t, color, text) => {
    const xx = r1(x + cl(t, 0, 1) * w);
    return `<path d="M${xx} ${y - 1} l-4 -6 h8 z" fill="${color}"/>` + (text ? S(k, xx, y - 9, text, color, "middle", 7) : "");
  };
  /* n little marks in a row (or rows). */
  const dots = (k, x, y, n, o) => {
    o = o || {};
    const cols = o.cols || 10;
    const gap = o.gap || 8;
    let s = "";
    for (let i = 0; i < n; i++) s += k.dot({ x: x + (i % cols) * gap, y: y + Math.floor(i / cols) * gap, r: o.r || 2.6, color: Array.isArray(o.color) ? o.color[i % o.color.length] : o.color || "#ddd" });
    return s;
  };
  const ticks = (k, x, y, n, o) => {
    o = o || {};
    let s = "";
    for (let i = 0; i < n; i++) s += `<line x1="${r1(x + i * (o.gap || 5))}" y1="${y}" x2="${r1(x + i * (o.gap || 5))}" y2="${r1(y - (o.h ? o.h(i) : 7))}" stroke="${o.color || "#ffd166"}" stroke-width="${o.w || 2}" stroke-linecap="round"/>`;
    return s;
  };
  const FEEL = { joyful: "#ffd166", loving: "#ff7aa2", curious: "#7fd4ff", melancholy: "#7a8cc0", anxious: "#c9a0ff", fearful: "#9b7bd1", angry: "#ef5350", triumphant: "#ffb347", absurd: "#9be36b" };
  const BG = "#15151b";
  const ink = "#1c1712";

  /* ---------------- stakes: a person at the edge of a pit, the thing they could lose on the far side ---------------- */
  W.look("stakes", (v, k) => {
    const size = v.p("size");
    const g = 100;
    const depth = 14 + size * 62;
    const rz = I(v, "raised");
    const len = [-16, 0, 16, 30][rz];
    const pit = `<rect x="0" y="${g}" width="320" height="${180 - g}" fill="#3a3027"/><rect x="132" y="${g}" width="66" height="${r1(depth)}" fill="#08080b"/>`;
    const raise = len ? k.arrow({ x1: 165, y1: g + 8, x2: 165, y2: g + 8 + len, color: len > 0 ? "#ef5350" : "#6cc070", w: 2 }) : `<line x1="157" y1="${g + 10}" x2="173" y2="${g + 10}" stroke="#bbb" stroke-width="2"/>`;
    const extra = [0, 1, 3, 6][I(v, "whoLoses")];
    let fam = "";
    for (let i = 0; i < extra; i++) fam += k.person({ x: 14 + i * 13, y: g, s: 0.42, color: "#7a8aa0", mood: -0.3 });
    const care = v.p("care");
    const clear = v.p("clear");
    const prize = `<rect x="226" y="${g - 28}" width="58" height="26" rx="4" fill="#e0a83c" opacity="${r1((0.2 + clear * 0.8) * 100) / 100}" stroke="${ink}"/>` + S(k, 255, g - 11, clear < 0.3 ? "?" : v("kind"), ink, "middle", clear < 0.3 ? 14 : 9);
    const n = Math.round(1 + ((v.n("atRisk") - 1) / 99) * 29);
    const crowd = dots(k, 214, 112, n, { cols: 10, gap: 9, color: "#c9b79a" }) + S(k, 256, 150, `${v.n("atRisk")} could lose`, "#d8c9ae");
    const tl = v.n("timeLeft");
    const clockC = k.mix("#777777", "#ef5350", v.p("clock"));
    const clock = k.pie({ x: 296, y: 26, r: 12, p: tl / 120, color: clockC }) + k.ring({ x: 296, y: 26, r: 14, color: clockC, w: 2 }) + S(k, 296, 50, `${tl} min · ${v("clock")}`, "#ccc", "end", 7);
    const learn = bar(k, 20, 16, 230, "we learn what's at risk") + pin(k, 20, 16, 230, v.p("learnedAt"), "#ffd166");
    const hero = k.person({ x: 116, y: g, s: 0.95, mood: -0.2 - size * 0.6, color: "#4a6fa5", lean: 6 }) + `<path d="M116 ${r1(g - 86 + 3)} m0 0" />` + heart(k, 138, g - 74, 3 + care * 6);
    return k.bg(BG) + pit + learn + clock + fam + hero + raise + prize + crowd + k.caption(`Could lose ${v("kind")} · ${v("whoLoses")} · ${v("clear")}`);
  });
  function heart(k, x, y, r) {
    return `<path d="M${r1(x)} ${r1(y + r)} C${r1(x - r * 2)} ${r1(y - r * 0.4)} ${r1(x - r * 0.9)} ${r1(y - r * 1.6)} ${r1(x)} ${r1(y - r * 0.5)} C${r1(x + r * 0.9)} ${r1(y - r * 1.6)} ${r1(x + r * 2)} ${r1(y - r * 0.4)} ${r1(x)} ${r1(y + r)} Z" fill="#ef5370" stroke="${ink}" stroke-width="1"/>`;
  }

  /* ---------------- emoRoadCharacter: the character's road through the story, against the film's road ---------------- */
  W.look("emoRoadCharacter", (v, k) => {
    const b = { x: 18, y: 26, w: 284, h: 112 };
    const h = v.n("height") / 5;
    const sw = v.n("swing") / 5;
    const turns = v.n("turns");
    const lo = v.n("lowPoint") / 100;
    const hi = v.n("highPoint") / 100;
    const endT = (v.p("endsAbove") - 0.5) * 0.5;
    const ch = (t) => 0.5 + h * 0.22 + sw * 0.16 * Math.sin(t * Math.PI * (turns + 1)) - 0.22 * bump(t, lo, 0.07) + 0.22 * bump(t, hi, 0.07) + endT * t;
    const wf = I(v, "withFilm");
    const off = v.n("fromFilm") / 10 * 0.3;
    const film = (t) => {
      const base = (u) => 0.5 + 0.18 * Math.sin(u * Math.PI * 2) - off;
      if (wf === 0) return 1 - ch(t) - off;
      return base(t + [0, -0.12, 0, 0.12][wf]);
    };
    const now = 0.68;
    const nx = px(b, now);
    const ny = py(b, ch(now));
    const st = I(v, "setting");
    const dir = [0, 22, 0, -22, 0][st];
    const sl = v.n("sinceLast");
    const nowMark = (st === 0 || st === 4 ? k.ring({ x: nx, y: ny, r: 9, color: st === 0 ? "#5aa0ff" : "#ffd166", w: 2 }) : "") + (dir ? k.arrow({ x1: nx + 6, y1: ny, x2: nx + 22, y2: ny + dir * 0.6, color: "#fff", w: 1.5 }) : `<line x1="${nx + 6}" y1="${ny}" x2="${nx + 22}" y2="${ny}" stroke="#fff" stroke-width="1.5"/>`);
    const ghost = sl ? k.arrow({ x1: nx - 14, y1: ny + sl * 4, x2: nx - 14, y2: ny + sl * 0.6, color: "#9be36b", w: 1.5 }) + S(k, nx - 18, ny + sl * 4 + (sl > 0 ? 9 : -3), "last scene", "#9be36b", "end", 7) : "";
    const pull = k.ring({ x: nx, y: ny, r: 5 + v.p("pull") * 14, color: "rgba(255,209,102,0.45)", w: 3 });
    const pace = v.p("roadPace");
    let speed = "";
    for (let i = 0; i < Math.round(pace * 4); i++) speed += `<line x1="${r1(nx - 10 - i * 3)}" y1="${r1(ny - 6 + i * 4)}" x2="${r1(nx - 22 - pace * 16 - i * 3)}" y2="${r1(ny - 6 + i * 4)}" stroke="#fff" stroke-width="1" opacity="0.6"/>`;
    const sinceT = Math.max(0.02, now - v.n("scenesSinceTurn") / 40 * 0.6);
    const bracket = `<line x1="${r1(px(b, sinceT))}" y1="${b.y + b.h - 6}" x2="${r1(nx)}" y2="${b.y + b.h - 6}" stroke="#c9a0ff" stroke-width="2"/>` + S(k, px(b, sinceT), b.y + b.h - 9, `${v.n("scenesSinceTurn")} scenes since a turn`, "#c9a0ff", "start", 7);
    let tp = "";
    for (let i = 1; i <= turns; i++) tp += `<circle cx="${r1(b.x + (i / (turns + 1)) * b.w)}" cy="${b.y + b.h + 6}" r="2.5" fill="#c9a0ff"/>`;
    return k.bg(BG) + tp + box(k, b) + S(k, b.x + 4, b.y - 4, "up = better for them", "#888", "start", 7) + S(k, b.x + b.w, b.y - 4, `film's road: ${v("withFilm")}`, "#888", "end", 7) + line(k, b, film, { color: "#777", dash: "4 3", w: 1.5 }) + line(k, b, ch, { color: "#ffd166" }) + vline(k, b, lo, "#5aa0ff") + vline(k, b, hi, "#ffb347") + bracket + speed + pull + `<circle cx="${r1(nx)}" cy="${r1(ny)}" r="5" fill="#fff"/>` + nowMark + ghost + k.caption(`Now: ${v("setting")} · ends ${v("endsAbove")} · ${v("roadPace")}`);
  });

  /* ---------------- emoRoadFilm: the shape of the whole film's feeling ---------------- */
  const SHAPES = { "rags to riches": [0.15, 0.35, 0.55, 0.85], "riches to rags": [0.85, 0.6, 0.4, 0.15], "fall then rise": [0.7, 0.25, 0.2, 0.85], "rise then fall": [0.2, 0.8, 0.75, 0.15], "rise, fall, rise": [0.2, 0.7, 0.25, 0.85], "fall, rise, fall": [0.8, 0.3, 0.75, 0.15] };
  W.look("emoRoadFilm", (v, k) => {
    const b = { x: 18, y: 22, w: 230, h: 108 };
    const base = smooth(SHAPES[v("shape")] || SHAPES["rags to riches"]);
    const pk = v.n("peakPlace") / 100;
    const steep = v.n("steep") / 5;
    const pw = 0.02 + v.n("peakLength") / 600 * 0.12;
    const alt = I(v, "alternation");
    const br = I(v, "breathers");
    const hgt = v.n("height") / 5;
    const f = (t) => {
      let y = 0.5 + (base(t) - 0.5) * (0.5 + steep * 0.9) + hgt * 0.12;
      y += 0.22 * bump(t, pk, pw);
      y += [0, 0.03, 0.06][alt] * Math.sin(t * Math.PI * [2, 10, 26][alt]);
      for (let i = 1; i <= [0, 2, 4, 7][br]; i++) y -= 0.08 * bump(t, i / ([0, 2, 4, 7][br] + 1), 0.015);
      return y;
    };
    const now = 0.72;
    const nx = px(b, now);
    const ny = py(b, f(now));
    const ch = v.n("changeHere");
    const sincePk = Math.max(0, now - v.n("sinceLastPeak") / 60 * 0.5);
    const st = I(v, "setting");
    const faces = [["tension", -0.5, "#ef5350"], ["laughter", 0.9, "#ffd166"], ["relief", 0.4, "#6cc070"]]
      .map(([id, mood, c], i) => k.face({ x: 285, y: 32 + i * 40, r: 6 + v.n(id) * 2.4, mood, mouth: id === "laughter" ? 0.5 : 0, brows: id === "tension" ? -0.8 : 0, color: k.mix("#f0c8a0", c, 0.35) }) + S(k, 285, 32 + i * 40 + 23, id === "relief" ? "release" : id, c, "middle", 7))
      .join("");
    const grip = v.p("grip");
    return (
      k.bg(BG) +
      box(k, b) +
      S(k, b.x + 4, b.y - 4, "the film's feeling, start to end", "#888", "start", 7) +
      line(k, b, f, { color: "#ffd166" }) +
      vline(k, b, pk, "#ffb347", "peak") +
      `<line x1="${r1(px(b, sincePk))}" y1="${b.y + b.h - 6}" x2="${r1(nx)}" y2="${b.y + b.h - 6}" stroke="#c9a0ff" stroke-width="2"/>` +
      S(k, px(b, sincePk), b.y + b.h - 9, `${v.n("sinceLastPeak")} min since a peak`, "#c9a0ff", "start", 7) +
      `<circle cx="${r1(nx)}" cy="${r1(ny)}" r="5" fill="#fff"/>` +
      (st === 0 || st === 4 ? k.ring({ x: nx, y: ny, r: 9, color: st ? "#ffd166" : "#5aa0ff" }) : "") +
      S(k, nx, ny - 10, ["lowest", "falling", "steady", "rising", "highest"][st], "#fff") +
      (ch ? k.arrow({ x1: nx + 12, y1: ny, x2: nx + 12, y2: ny - ch * 5, color: ch > 0 ? "#6cc070" : "#ef5350", w: 2 }) : "") +
      faces +
      k.person({ x: 40, y: 168, s: 0.4, lean: -10 + grip * 30, color: "#888", eyes: 0.3 + grip * 0.7 }) +
      S(k, 52, 158, `audience ${grip > 0.6 ? "gripped" : grip < 0.3 ? "loose" : "held"}`, "#aaa", "start", 7) +
      k.caption(`${v("shape")} · rests: ${v("breathers")} · peak ${Math.round(v.n("peakLength"))} s`)
    );
  });

  /* ---------------- emoTurn: a face before and after, and the feeling line through the scene ---------------- */
  W.look("emoTurn", (v, k) => {
    const dirI = I(v, "direction");
    const sign = [-1, 0.3, 1][dirI];
    const amt = [0.2, 0.45, 0.75, 1.1][I(v, "setting")];
    const delta = sign * (0.12 + (v.n("turnSize") / 100) * 0.34) * amt;
    const b = { x: 20, y: 98, w: 280, h: 46 };
    const when = v.n("when") / 100;
    const wdt = 0.02 + (v.n("turnSeconds") / 60) * 0.22 + (1 - v.p("speed")) * 0.12;
    const f = (t) => 0.5 + delta * cl((t - when + wdt / 2) / wdt, 0, 1);
    const hint = cl(when - wdt / 2 - (v.n("hintBefore") / 120) * 0.35, 0, 1);
    const warned = v.p("warned");
    const tint = dirI === 0 ? "#3c6cff" : dirI === 2 ? "#ffb347" : "#9be36b";
    return (
      k.bg(BG) +
      k.tint({ color: tint, alpha: 0.05 + Math.abs(delta) * 0.3 }) +
      k.face({ x: 60, y: 48, r: 26, mood: 0.1 }) +
      S(k, 60, 88, "before", "#aaa") +
      k.face({ x: 260, y: 48, r: 26, mood: cl(0.1 + delta * 2.4, -1, 1), brows: dirI === 1 ? -0.7 : undefined, eyes: dirI === 1 ? 1 : 0.8 }) +
      S(k, 260, 88, "after", "#aaa") +
      k.arrow({ x1: 98, y1: 48, x2: 222, y2: 48, color: "#ffd166", w: 2 }) +
      S(k, 160, 40, `turned by ${v("trigger")}`, "#ffd166", "middle", 9) +
      S(k, 160, 62, `from ${v("turnedBy")}`, "#ccc") +
      box(k, b) +
      line(k, b, f, { color: tint }) +
      vline(k, b, when, "#fff") +
      `<g opacity="${r1((0.2 + warned * 0.8) * 100) / 100}">${vline(k, b, hint, "#ffd166")}${S(k, cl(px(b, hint), 60, 260), b.y + b.h + 9, `hint ${v.n("hintBefore")} s before`, "#ffd166")}</g>` +
      k.caption(`${v("setting")} ${v("direction")} · ${v("warned")} · ${v.n("turnSeconds")} s`)
    );
  });

  /* ---------------- emoRelease: the feeling bursting out of a person, with the timing underneath ---------------- */
  W.look("emoRelease", (v, k) => {
    const how = v("how");
    const size = v.p("size");
    const x = 120;
    const y = 120;
    const hy = 50;
    const col = { "it doesn't": "#888", "a sigh": "#cfe3f0", tears: "#5aa0ff", "a laugh": "#ffd166", "a shout": "#ef5350", "an action": "#ff9a3c" }[how] || "#ccc";
    let burst = "";
    const n = 4 + Math.round(size * 10);
    for (let i = 0; i < n; i++) {
      const a = (-160 + (i / Math.max(1, n - 1)) * 140) * (Math.PI / 180);
      const r0 = 18;
      const r = r0 + 6 + size * 32;
      burst += `<line x1="${r1(x + Math.cos(a) * r0)}" y1="${r1(hy + Math.sin(a) * r0)}" x2="${r1(x + Math.cos(a) * r)}" y2="${r1(hy + Math.sin(a) * r)}" stroke="${col}" stroke-width="2" stroke-linecap="round"${how === "it doesn't" ? ' stroke-dasharray="2 3"' : ""}/>`;
    }
    if (how === "tears") burst += `<path d="M${x - 5} ${hy + 6} q-2 8 0 12 q2 -4 0 -12" fill="#5aa0ff"/><path d="M${x + 5} ${hy + 6} q-2 8 0 12 q2 -4 0 -12" fill="#5aa0ff"/>`;
    const fight = v.p("fightsIt");
    const w = I(v, "witnessed");
    let watch = "";
    for (let i = 0; i < [0, 0, 1, 4][w]; i++) watch += k.person({ x: 20 + i * 18, y, s: 0.5, color: "#7a8aa0", mood: -0.1 });
    if (w === 1) watch += `<ellipse cx="32" cy="40" rx="12" ry="7" fill="#fff"/><circle cx="32" cy="40" r="4" fill="${ink}"/>` + S(k, 32, 58, "just us", "#ccc");
    const nx = x + 26 + (v.n("nearest") / 20) * 120;
    const after = I(v, "after");
    const t0 = v.n("releaseAt") / 100;
    const held = (v.n("heldBefore") / 60) * 0.25;
    const lasts = (v.n("lasts") / 30) * 0.18;
    const calm = (v.n("backToCalm") / 300) * 0.3;
    const by = 150;
    return (
      k.bg(BG) +
      watch +
      (fight < 0.5 ? k.ring({ x, y: hy + 4, r: 22 + fight * 20, color: "#888", w: 3 - fight * 3 + 1, dash: "4 3" }) : "") +
      burst +
      k.person({ x, y, s: 1, arms: -0.8 + fight * 1.7, mood: how === "a laugh" ? 0.8 : how === "it doesn't" ? 0 : -0.5, color: "#4a6fa5" }) +
      k.person({ x: nx, y, s: 0.75, color: "#8a8a8a", look: -1, alpha: 0.85 }) +
      S(k, (x + nx) / 2 + 8, y + 10, `${v.n("nearest")} m`, "#aaa") +
      k.face({ x: 290, y: 30, r: 15, mood: [-0.8, 0, 0.7, 0.2][after], brows: after === 3 ? -0.8 : undefined, eyes: after === 3 ? 1 : 0.7 }) +
      S(k, 290, 56, `after: ${v("after")}`, "#ccc") +
      bar(k, 20, by, 280, "") +
      piece(k, 20, by, 280, t0 - held, t0, "#666") +
      piece(k, 20, by, 280, t0, t0 + lasts, col) +
      piece(k, 20, by, 280, t0 + lasts, t0 + lasts + calm, "rgba(108,192,112,0.5)") +
      S(k, 20 + (t0 - held / 2) * 280, by - 3, "held", "#aaa", "middle", 7) +
      S(k, 20 + (t0 + lasts + calm / 2) * 280, by - 3, "calm", "#6cc070", "middle", 7) +
      k.caption(`${how} · ${v("fightsIt")} · seen by ${v("witnessed")}`)
    );
  });

  /* ---------------- audienceFeeling: the character on screen, and us in our seat ---------------- */
  W.look("audienceFeeling", (v, k) => {
    const m = I(v, "match");
    const usMood = [0.6, 0.9, 0.3, 0.6, -0.7][m];
    const st = v.n("strength");
    const lean = [-16, 0, 14, 28][I(v, "lean")];
    const vs = v.n("vsCharacter") / 100;
    const usT = 0.5 + (v.p("lands") - 0.5) * 0.3 + (v.n("leadLag") / 30) * 0.15;
    const know = v.n("weKnow");
    let bulbs = "";
    for (let i = 0; i < know; i++) bulbs += k.dot({ x: 210 + i * 12, y: 18, r: 4, color: "#ffd166" });
    return (
      k.bg(BG) +
      `<rect x="16" y="14" width="140" height="92" rx="4" fill="#2a3340" stroke="#555"/>` +
      S(k, 86, 26, "on screen", "#aaa") +
      k.face({ x: 86, y: 62, r: 26, mood: 0.6 }) +
      k.meter({ x: 46, y: 112, w: 80, p: 0.5, color: "#7fb7ff", label: "them" }) +
      `<rect x="196" y="120" width="60" height="30" rx="5" fill="#5a2f35"/>` +
      `<g transform="rotate(${-lean} 226 120)">${k.face({ x: 226, y: 80, r: 12 + st * 4, mood: usMood, brows: m === 3 ? -0.7 : undefined, look: m === 3 ? 1 : -0.6 })}</g>` +
      S(k, 226, 160, v("lean"), "#ccc") +
      k.meter({ x: 186, y: 112, w: 80, p: cl(0.5 * (1 + vs), 0, 1), color: "#ffd166", label: "us" }) +
      bulbs +
      (know ? S(k, 205, 30, "we know", "#ffd166", "start", 7) : "") +
      S(k, 300, 60, v("why"), "#ddd", "end", 8) +
      bar(k, 20, 136, 140, "when it lands") +
      pin(k, 20, 136, 140, 0.5, "#7fb7ff") +
      pin(k, 20, 136, 140, usT, "#ffd166") +
      k.caption(`We feel it ${v("match")} · lands ${v("lands")}`)
    );
  });

  /* ---------------- catharsis: tension building over the film, then let go ---------------- */
  const THROUGH = { tears: "#5aa0ff", laughter: "#ffd166", "a fight": "#ef5350", "a confession": "#c9a0ff", music: "#6cc070" };
  W.look("catharsis", (v, k) => {
    const b = { x: 18, y: 20, w: 284, h: 72 };
    const pl = v.n("placed") / 100;
    const wait = Math.max(0.03, (v.n("wait") / 100) * pl);
    const size = v.n("size") / 5;
    const lasts = 0.01 + (v.n("lasts") / 300) * 0.12;
    const settle = (v.n("settle") / 120) * 0.15;
    const top = 0.35 + size * 0.6;
    const f = (t) => {
      if (t < pl - wait) return 0.25;
      if (t < pl) return 0.25 + (top - 0.25) * ((t - (pl - wait)) / wait);
      if (t < pl + lasts) return top - (top - 0.08) * ((t - pl) / lasts);
      if (t < pl + lasts + settle) return 0.08;
      return 0.2;
    };
    const earned = v.p("earned");
    const col = THROUGH[v("through")] || "#ffd166";
    const sur = I(v, "surprise");
    let fore = "";
    for (let i = 1; i <= [3, 1, 0][sur]; i++) fore += `<circle cx="${r1(px(b, pl - wait * (i / 4)))}" cy="${b.y + b.h + 5}" r="2.5" fill="#ffd166"/>`;
    const many = v.n("howMany");
    const shown = Math.min(12, many);
    const sh = I(v, "shared");
    const lit = [1, 2, shown, 0][sh];
    let ppl = "";
    for (let i = 0; i < shown; i++) ppl += k.person({ x: 24 + i * 20, y: 152, s: 0.42, arms: i < lit ? 0.9 : -0.3, color: i < lit ? col : "#666", mood: i < lit ? 0.4 : 0 });
    const aud = sh === 3 ? `<rect x="268" y="128" width="40" height="24" rx="4" fill="${col}" opacity="0.8"/>` + S(k, 288, 143, "us", ink) : `<rect x="268" y="128" width="40" height="24" rx="4" fill="#333"/>` + S(k, 288, 143, "us", "#888");
    return (
      k.bg(BG) +
      box(k, b) +
      S(k, b.x + 4, b.y - 4, "tension held, then let go", "#888", "start", 7) +
      line(k, b, f, { color: col, w: 1.5 + earned * 2.5, dash: earned < 0.3 ? "4 3" : "" }) +
      vline(k, b, pl, "#fff") +
      (sur === 2 ? k.text({ x: px(b, pl) + 8, y: b.y + 18, text: "!", size: 16, color: "#ffd166", weight: 700 }) : "") +
      fore +
      `<rect x="${r1(px(b, pl + lasts))}" y="${b.y + b.h - 8}" width="${r1(Math.max(1, settle * b.w))}" height="6" fill="#4fb3a5" opacity="0.7"/>` +
      ppl +
      (many > 12 ? S(k, 262, 120, `+${many - 12}`, "#ccc", "end") : "") +
      aud +
      k.caption(`Let go through ${v("through")} · ${v("earned")} · shared by ${v("shared")}`)
    );
  });

  /* ---------------- hope: a little flame held up on a thread ---------------- */
  W.look("hope", (v, k) => {
    const lvl = v.p("level");
    const fr = I(v, "fragile");
    const x = 100;
    const fy = 70;
    const fl = 8 + lvl * 22;
    const flame = `<path d="M${x} ${r1(fy - fl)} C${r1(x + fl * 0.6)} ${r1(fy - fl * 0.3)} ${r1(x + fl * 0.5)} ${fy + 6} ${x} ${fy + 6} C${r1(x - fl * 0.5)} ${fy + 6} ${r1(x - fl * 0.6)} ${r1(fy - fl * 0.3)} ${x} ${r1(fy - fl)} Z" fill="#ffb347"/><circle cx="${x}" cy="${fy}" r="${r1(fl * 1.4)}" fill="#ffd166" opacity="${r1(0.08 + lvl * 0.2)}"/>`;
    const thread = `<line x1="${x}" y1="6" x2="${x}" y2="${r1(fy - fl - 2)}" stroke="#ddd" stroke-width="${[4, 2, 0.8][fr]}"${fr === 1 ? ' stroke-dasharray="6 2"' : ""}/>`;
    const dashed = I(v, "dashed");
    const wind = dashed ? k.arrow({ x1: x + 70 + dashed * 10, y1: fy - 4, x2: x + 26, y2: fy - 4, color: "#7a8cc0", w: 1 + dashed * 1.4 }) + `<ellipse cx="${x + 84 + dashed * 10}" cy="${fy - 6}" rx="${12 + dashed * 6}" ry="${8 + dashed * 3}" fill="#454a5a"/>` : "";
    const wh = I(v, "whose");
    const char = k.person({ x: x - 28, y: 150, s: 0.9, arms: 0.6, mood: lvl - 0.3, color: wh !== 1 ? "#4a6fa5" : "#555" });
    const aud = `<rect x="20" y="152" width="70" height="10" rx="3" fill="${wh !== 0 ? "#ffd166" : "#333"}" opacity="0.7"/>` + S(k, 55, 174 - 16, "us", wh !== 0 ? ink : "#888", "middle", 7);
    const g = { x: 196, y: 30, w: 110, h: 58 };
    const dropBy = v.n("dropBy") / 100;
    const ds = 0.02 + (v.n("dropSeconds") / 60) * 0.25;
    const ret = v.n("returns") / 20;
    const f = (t) => (t < 0.25 ? 0.85 : t < 0.25 + ds ? 0.85 - dropBy * 0.7 * ((t - 0.25) / ds) : t < 0.3 + ds + ret * 0.6 ? 0.85 - dropBy * 0.7 : 0.75);
    return (
      k.bg(BG) +
      thread +
      S(k, x + 6, 16, `rests on ${v("rests")}`, "#ccc", "start") +
      flame +
      wind +
      char +
      aud +
      box(k, g, "hope over the next scenes") +
      line(k, g, f, { color: "#ffb347", w: 2 }) +
      S(k, g.x + g.w, g.y + g.h + 10, `back after ${v.n("returns")} scenes`, "#aaa", "end", 7) +
      k.pie({ x: 290, y: 130, r: 13, p: v.n("odds") / 100, color: "#6cc070" }) +
      S(k, 270, 134, `real odds ${v.n("odds")}%`, "#ccc", "end") +
      k.caption(`Hope ${v("fragile")} · ${v("dashed")} · ${v("whose")}`)
    );
  });

  /* ---------------- falseHigh: the line climbs (or sinks), then the floor gives way ---------------- */
  W.look("falseHigh", (v, k) => {
    const b = { x: 18, y: 22, w: 284, h: 100 };
    const ki = I(v, "kind");
    const sign = ki === 1 ? -1 : 1;
    const amp = (0.08 + (v.n("size") / 5) * 0.3) * (ki === 0 ? 0.25 : 1);
    const pl = v.n("placed") / 100;
    const und = 0.03 + (v.n("undone") / 20) * 0.25;
    const fall = (v.n("fallSize") / 10) * 0.4;
    const fs = 0.01 + (v.n("fallSeconds") / 120) * 0.1;
    const base = 0.5;
    const f = (t) => {
      if (t < pl - 0.1) return base;
      if (t < pl) return base + sign * amp * ((t - (pl - 0.1)) / 0.1);
      if (t < pl + und) return base + sign * amp;
      if (t < pl + und + fs) return base + sign * amp - sign * (amp + fall) * ((t - pl - und) / fs);
      return base - sign * fall;
    };
    const cx = px(b, pl + und + fs);
    const cy = py(b, base - sign * fall);
    const crash = v.n("crash") / 5;
    let star = "";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      star += `<line x1="${r1(cx)}" y1="${r1(cy)}" x2="${r1(cx + Math.cos(a) * (3 + crash * 14))}" y2="${r1(cy + Math.sin(a) * (3 + crash * 14))}" stroke="#ef5350" stroke-width="1.5"/>`;
    }
    let flags = "";
    const nc = [0, 1, 3][I(v, "clues")];
    for (let i = 0; i < nc; i++) {
      const fx = px(b, pl + (und * (i + 1)) / (nc + 1));
      const fyy = py(b, base + sign * amp) - 4;
      flags += `<line x1="${r1(fx)}" y1="${r1(fyy)}" x2="${r1(fx)}" y2="${r1(fyy - 12)}" stroke="#ddd"/><path d="M${r1(fx)} ${r1(fyy - 12)} l7 3 l-7 3 z" fill="#ef5350"/>`;
    }
    const bi = I(v, "believedBy");
    return (
      k.bg(BG) +
      box(k, b) +
      S(k, b.x + 4, b.y - 4, ki === 1 ? "a false low before a rise" : "it looks won... then it isn't", "#888", "start", 7) +
      line(k, b, f, { color: "#ffd166" }) +
      flags +
      star +
      S(k, cx, cy + (sign > 0 ? 24 : -18), v("turnBy"), "#ef5350") +
      k.face({ x: 40, y: 146, r: 11, mood: bi === 3 ? -0.2 : 0.7, eyes: bi === 1 ? 0.2 : 0.9 }) +
      `<ellipse cx="74" cy="146" rx="10" ry="6" fill="${bi === 1 || bi === 2 ? "#fff" : "#444"}"/><circle cx="74" cy="146" r="3.5" fill="${ink}"/>` +
      S(k, 92, 149, `believed by ${v("believedBy")}`, "#ccc", "start") +
      k.caption(`${v("kind")} · undone in ${v.n("undone")} scenes · ${v.n("fallSeconds")} s to crash`)
    );
  });

  /* ---------------- twoRoads: two people's roads through the film ---------------- */
  W.look("twoRoads", (v, k) => {
    const b = { x: 18, y: 22, w: 284, h: 104 };
    const rel = I(v, "relation");
    const g = 0.15 + (v.n("gap") / 10) * 0.6;
    const ca = v.n("crossAt") / 100;
    const ah = (0.5 - v.p("ahead")) * 0.25;
    const lag = (v.n("lag") / 20) * 0.25;
    const d = (t) => [(t - 0.5) * 1.2 * g, (t - ca) * 1.2 * g, t * g, g * 0.5, 0.06 * g][rel] + ah * t;
    const c = (t) => 0.5 + 0.12 * Math.sin(t * Math.PI * 2);
    const A = (t) => c(t) + d(t) / 2;
    const B = (t) => c(t - lag) - d(t - lag) / 2;
    const ln = I(v, "linked");
    let links = "";
    for (let i = 1; i <= [0, 1, 3][ln]; i++) {
      const t = i / 4;
      links += k.arrow({ x1: px(b, t), y1: py(b, A(t)), x2: px(b, t + 0.03), y2: py(b, B(t + 0.03)), color: "#888", w: 1 });
    }
    const gc = v.n("gapChange");
    const ex = px(b, 0.97);
    const mid = (py(b, A(0.97)) + py(b, B(0.97))) / 2;
    const gapArrows = gc ? k.arrow({ x1: ex, y1: mid, x2: ex, y2: mid - gc * 2.4, color: gc > 0 ? "#ef5350" : "#6cc070", w: 1.5 }) + k.arrow({ x1: ex, y1: mid, x2: ex, y2: mid + gc * 2.4, color: gc > 0 ? "#ef5350" : "#6cc070", w: 1.5 }) : "";
    const who = { "the leads": ["lead one", "lead two"], "hero and villain": ["hero", "villain"], friends: ["friend", "friend"], family: ["parent", "child"], lovers: ["one lover", "the other"] }[v("whichTwo")] || ["first", "second"];
    return (
      k.bg(BG) +
      box(k, b) +
      vline(k, b, ca, "#c9a0ff", "planned crossing") +
      line(k, b, A, { color: "#5aa0ff" }) +
      line(k, b, B, { color: "#ffb347" }) +
      links +
      gapArrows +
      S(k, 24, 142, who[0], "#5aa0ff", "start", 9) +
      S(k, 100, 142, who[1], "#ffb347", "start", 9) +
      S(k, 300, 142, `${v.n("lag")} scenes behind`, "#aaa", "end") +
      k.caption(`Roads: ${v("relation")} · higher now: ${v("ahead")} · ${v("linked")} linked`)
    );
  });

  /* ---------------- dread: a shape in the dark, coming closer ---------------- */
  W.look("dread", (v, k) => {
    const lvl = v.p("level");
    const dist = v.n("threatDistance") / 100;
    const seen = v.n("threatSeen") / 100;
    const tx = 40 + dist * 150;
    const ts = 1.3 - dist * 0.6;
    const kn = I(v, "known");
    const scenes = v.n("scenes");
    let strip = "";
    for (let i = 0; i < scenes; i++) strip += `<rect x="${20 + i * 11}" y="10" width="9" height="12" fill="${k.mix("#555b66", "#1a0f14", i / 20)}"/>`;
    const rem = v.n("reminders");
    for (let i = 0; i < rem; i++) strip += `<line x1="${24 + i * 22}" y1="25" x2="${24 + i * 22}" y2="31" stroke="#ef5350" stroke-width="2"/>`;
    const pay = I(v, "payoff");
    const q = v.n("quietBefore") / 60;
    const wv = k.wave({ x: 20, y: 150, w: 120 * (1 - q * 0.8), h: 14, amp: 0.6, cycles: 10, color: "#888" }) + `<line x1="${r1(20 + 120 * (1 - q * 0.8))}" y1="150" x2="140" y2="150" stroke="#555"/>`;
    const hit = pay === 0 ? k.ring({ x: 160, y: 150, r: 9, color: "#666", dash: "2 3" }) : k.dot({ x: 160, y: 150, r: [0, 5, 9, 14][pay], color: "#ef5350" });
    return (
      k.bg(k.mix("#22222a", "#060608", lvl)) +
      `<rect x="0" y="120" width="320" height="60" fill="${k.mix("#2f2b28", "#120f0e", lvl)}"/>` +
      strip +
      S(k, 20 + Math.max(scenes, 1) * 11 + 4, 20, `${scenes} scenes of build`, "#aaa", "start", 7) +
      `<g opacity="${r1((0.15 + seen * 0.85) * 100) / 100}"><ellipse cx="${r1(tx)}" cy="${r1(120 - 40 * ts)}" rx="${r1(16 * ts)}" ry="${r1(42 * ts)}" fill="#050505" stroke="#3a1a20" stroke-width="2"/><circle cx="${r1(tx - 5 * ts)}" cy="${r1(120 - 64 * ts)}" r="${r1(2 * ts)}" fill="#ef5350"/><circle cx="${r1(tx + 5 * ts)}" cy="${r1(120 - 64 * ts)}" r="${r1(2 * ts)}" fill="#ef5350"/></g>` +
      `<rect x="${r1(tx - 30)}" y="34" width="${r1(60 * (1 - seen))}" height="90" fill="${k.mix("#22222a", "#060608", lvl)}"/>` +
      S(k, tx, 34, kn === 0 ? "?" : kn === 1 ? `maybe ${v("of")}?` : v("of"), "#ef9a9a", "middle", kn === 0 ? 14 : 9) +
      k.person({ x: 262, y: 128, s: 0.9, mood: -0.3 - lvl * 0.6, look: -1, arms: -0.4, color: "#4a6fa5" }) +
      S(k, (tx + 262) / 2, 114, `${v.n("threatDistance")} m`, "#aaa") +
      wv +
      hit +
      S(k, 176, 153, `quiet ${v.n("quietBefore")} s, then ${v("payoff")}`, "#ccc", "start", 7) +
      k.vignette(0.3 + lvl * 0.6) +
      k.caption(`Dread of ${v("of")} · ${v("known")}`)
    );
  });

  /* ---------------- emotionIntensity: how the feeling rises, holds and fades in the scene ---------------- */
  W.look("emotionIntensity", (v, k) => {
    const b = { x: 18, y: 22, w: 224, h: 112 };
    const pk = 0.15 + (v.n("setting") / 5) * 0.8;
    const at = v.n("peakAt") / 100;
    const rise = 0.01 + [0, 0.05, 0.12, 0.22][I(v, "build")] + (v.n("riseSeconds") / 60) * 0.15;
    const hold = (v.n("peakHold") / 10) * 0.12;
    const fd = [0.005, 0.05, 0.18, 0.4][I(v, "fade")];
    const lid = [0.4, 0.7, 1.05][I(v, "contain")];
    const f = (t) => {
      if (t < at - rise) return 0.08;
      if (t < at) return 0.08 + (pk - 0.08) * ((t - at + rise) / rise);
      if (t < at + hold) return pk;
      return 0.08 + (pk - 0.08) * Math.exp(-(t - at - hold) / fd);
    };
    const shown = (t) => Math.min(f(t), lid);
    const sc = cl(0.4 - (v.n("vsScene") / 100) * 0.3, 0.02, 0.98);
    const last = cl(pk - (v.n("sinceLast") / 5) * 0.35, 0.02, 1);
    return (
      k.bg(BG) +
      box(k, b) +
      S(k, b.x + 4, b.y - 4, "strength through the scene", "#888", "start", 7) +
      `<line x1="${b.x}" y1="${r1(py(b, sc))}" x2="${b.x + b.w}" y2="${r1(py(b, sc))}" stroke="#666" stroke-dasharray="2 3"/>` +
      S(k, b.x + b.w - 2, py(b, sc) - 2, "rest of scene", "#777", "end", 7) +
      `<line x1="${b.x + 4}" y1="${r1(py(b, last))}" x2="${b.x + 40}" y2="${r1(py(b, last))}" stroke="#9be36b" stroke-width="2"/>` +
      S(k, b.x + 6, py(b, last) - 3, "last scene", "#9be36b", "start", 7) +
      line(k, b, f, { color: "#ef5350", dash: "3 3", w: 1.5, alpha: 0.6 }) +
      line(k, b, shown, { color: "#ef5350" }) +
      (lid < 1 ? `<line x1="${b.x}" y1="${r1(py(b, lid))}" x2="${b.x + b.w}" y2="${r1(py(b, lid))}" stroke="#ccc" stroke-width="2"/>` + S(k, b.x + b.w / 2, py(b, lid) - 3, "held in", "#ccc", "middle", 7) : "") +
      k.face({ x: 282, y: 70, r: 26, mood: -0.2 - pk * 0.6, brows: -pk, mouth: lid > 1 ? pk * 0.8 : 0, eyes: 0.6 + pk * 0.4 }) +
      S(k, 282, 110, `${v("contain")}`, "#ccc") +
      S(k, 282, 122, `${v.n("riseSeconds")} s to peak`, "#aaa", "middle", 7) +
      k.caption(`Strength ${v.n("setting")} of 5 · builds ${v("build")} · ${v("fade")}`)
    );
  });

  /* ---------------- emoActions: a person acting out the feeling on something ---------------- */
  W.look("emoActions", (v, k) => {
    const sz = v.p("setting");
    const x = 70;
    const y = 132;
    const reach = v.n("reach") / 10;
    const ai = I(v, "aimedAt");
    const tx = x + 40 + reach * 170;
    const tgt = [
      `<path d="M${x + 22} 70 C ${x + 60} 40, ${x + 60} 110, ${x + 14} 86" fill="none" stroke="#ff9a3c" stroke-width="${r1(1 + sz * 4)}"/>`,
      `<rect x="${r1(tx - 12)}" y="${y - 30}" width="24" height="30" fill="#8a7158" stroke="${ink}"/>` + S(k, tx, y + 10, "a thing", "#aaa"),
      k.person({ x: tx, y, s: 0.85, look: -1, mood: -0.4, color: "#8a8a8a" }),
      `<rect x="${r1(tx - 30)}" y="30" width="60" height="${y - 30}" fill="none" stroke="#888" stroke-dasharray="4 3"/>` + S(k, tx, 26, "the room", "#aaa"),
    ][ai];
    const arrowTo = ai === 0 ? "" : k.arrow({ x1: x + 18, y1: 84, x2: tx - 20, y2: 84, color: "#ff9a3c", w: r1(1 + sz * 4) });
    const oi = I(v, "object");
    const cupX = [x + 28, x + 20, x + 18, (x + tx) / 2][oi];
    const cupY = [y, 92, 80, 60][oi];
    const cup = `<g transform="rotate(${oi === 3 ? 35 : 0} ${cupX} ${cupY})"><rect x="${cupX - 6}" y="${cupY - 12}" width="12" height="12" rx="2" fill="#e8e4da" stroke="${ink}"/>${oi === 3 ? `<path d="M${cupX - 2} ${cupY - 12} l2 5 l-2 3" stroke="${ink}" fill="none"/>` : ""}</g>` + (oi === 2 ? k.ring({ x: cupX, y: cupY - 6, r: 9, color: "#ffd166", w: 1.5 }) : "");
    const esc = I(v, "escalate");
    const cnt = v.n("count");
    const tall = ticks(k, 200, 20, cnt, { gap: 9, w: 3, color: "#ff9a3c", h: (i) => [12 - i, 8, 4 + i * 1.5, 3 + i * i * 0.4][esc] });
    const after = (v.n("afterTrigger") / 10) * 100;
    const ri = I(v, "regret");
    return (
      k.bg(BG) +
      k.floor(y, "#2a2520") +
      tgt +
      arrowTo +
      `<line x1="${x}" y1="${y + 8}" x2="${r1(tx)}" y2="${y + 8}" stroke="#666" stroke-dasharray="2 3"/>` +
      S(k, (x + tx) / 2, y + 18, `reaches ${v.n("reach")} m`, "#aaa", "middle", 7) +
      k.person({ x, y, s: 1, arms: 0.2 + sz * 0.7, lean: sz * 14, mood: -0.6, color: "#4a6fa5" }) +
      cup +
      tall +
      S(k, 200, 32, `${cnt} actions`, "#aaa", "start", 7) +
      k.face({ x: 22, y: 26, r: 12, mood: [0.7, 0.3, -0.3, -0.7][ri], brows: ri > 1 ? 0.6 : -0.2 }) +
      S(k, 38, 29, `after: ${v("regret")}`, "#ccc", "start", 7) +
      `<path d="M30 160 l4 -8 l-2 0 l4 -8" stroke="#ffd166" stroke-width="2" fill="none"/>` +
      `<line x1="40" y1="156" x2="${r1(40 + after)}" y2="156" stroke="#888" stroke-dasharray="2 2"/>` +
      k.dot({ x: 40 + after + 4, y: 156, r: 4, color: "#ff9a3c" }) +
      S(k, 50 + after, 159, `${v.n("afterTrigger")} s after`, "#aaa", "start", 7) +
      k.caption(`${v("setting")} actions at ${v("aimedAt")} · ${v("object")}`)
    );
  });

  /* ---------------- emoContrastPrev: last scene and this scene side by side ---------------- */
  W.look("emoContrastPrev", (v, k) => {
    const dk = v.p("darker");
    const same = I(v, "setting");
    const right = dk < 0.5 ? k.mix("#5a6f8a", "#0c0f1a", (0.5 - dk) * 2) : k.mix("#5a6f8a", "#f2c46e", (dk - 0.5) * 2);
    const bri = I(v, "bridge");
    const L = { x: 14, y: 20, w: 130, h: 96 };
    const R = { x: 176, y: 20, w: 130, h: 96 };
    const linger = (v.n("linger") / 30) * 70;
    const jolt = v.n("jolt");
    let zig = "";
    if (jolt) zig = `<polyline points="${[0, 1, 2, 3, 4, 5].map((i) => `${150 + (i % 2 ? 1 : -1) * (2 + jolt * 2)},${30 + i * 15}`).join(" ")}" fill="none" stroke="#ffd166" stroke-width="2"/>`;
    const join = [
      "",
      k.wave({ x: 120, y: 68, w: 80, h: 18, amp: 0.7, cycles: 3, color: "#9fd3ff" }),
      `<defs><linearGradient id="cw-emoContrastPrev-fade"><stop offset="0" stop-color="#5a6f8a"/><stop offset="1" stop-color="${right}"/></linearGradient></defs><rect x="140" y="20" width="40" height="96" fill="url(#cw-emoContrastPrev-fade)"/>`,
      k.ring({ x: 79, y: 68, r: 18, color: "#fff", w: 2 }) + k.ring({ x: 241, y: 68, r: 18, color: "#fff", w: 2 }),
    ][bri];
    const moodR = [0.5, 0.2, -0.3, -0.8][same];
    const sw = (v.n("switchSeconds") / 30) * 220;
    return (
      k.bg(BG) +
      `<rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" fill="#5a6f8a"/>` +
      `<rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" fill="${right}"/>` +
      (linger > 0 ? `<rect x="${R.x}" y="${R.y}" width="${r1(linger)}" height="${R.h}" fill="#5a6f8a" opacity="0.55"/>` : "") +
      join +
      k.face({ x: 79, y: 68, r: 16, mood: 0.5 }) +
      k.face({ x: 241, y: 68, r: 16, mood: moodR, brows: same === 2 ? -0.7 : undefined }) +
      zig +
      S(k, 79, 130, v("against"), "#ccc") +
      S(k, 241, 130, "this scene", "#ccc") +
      `<line x1="40" y1="150" x2="${r1(40 + sw)}" y2="150" stroke="#ffd166" stroke-width="3"/>` +
      S(k, 46 + sw, 153, `${v.n("switchSeconds")} s to switch`, "#aaa", "start", 7) +
      k.caption(`${v("setting")} · ${v("darker")} · ${v("bridge")}`)
    );
  });

  /* ---------------- emoShown: a mask over the true face ---------------- */
  W.look("emoShown", (v, k) => {
    const st = v.p("setting");
    const x = 90;
    const y = 72;
    const mi = I(v, "mask");
    const off = st * 70;
    const mask = `<g transform="translate(${r1(off)} ${r1(-st * 10)}) rotate(${r1(st * 25)} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="#e8e4da" stroke="${ink}" stroke-width="2"/>${[
      `<line x1="${x - 10}" y1="${y + 14}" x2="${x + 10}" y2="${y + 14}" stroke="${ink}" stroke-width="2"/>`,
      `<path d="M${x - 12} ${y + 10} Q${x} ${y + 22} ${x + 12} ${y + 10}" fill="none" stroke="${ink}" stroke-width="2"/>`,
      `<path d="M${x - 10} ${y + 14} Q${x} ${y + 17} ${x + 10} ${y + 14}" fill="none" stroke="${ink}" stroke-width="2"/><line x1="${x - 16}" y1="${y - 6}" x2="${x - 6}" y2="${y - 6}" stroke="${ink}" stroke-width="2"/><line x1="${x + 6}" y1="${y - 6}" x2="${x + 16}" y2="${y - 6}" stroke="${ink}" stroke-width="2"/>`,
      `<path d="M${x - 12} ${y + 18} Q${x} ${y + 8} ${x + 12} ${y + 18}" fill="none" stroke="${ink}" stroke-width="2"/><line x1="${x - 18}" y1="${y - 14}" x2="${x - 6}" y2="${y - 8}" stroke="${ink}" stroke-width="2.5"/><line x1="${x + 18}" y1="${y - 14}" x2="${x + 6}" y2="${y - 8}" stroke="${ink}" stroke-width="2.5"/>`,
      `<path d="M${x - 14} ${y + 8} Q${x} ${y + 26} ${x + 14} ${y + 8} Z" fill="#5a1f1f"/>` + S(k, x + 26, y - 26, "ha!", "#ffd166"),
    ][mi]}<circle cx="${x - 11}" cy="${y - 6}" r="4" fill="${ink}"/><circle cx="${x + 11}" cy="${y - 6}" r="4" fill="${ink}"/></g>`;
    const slips = v.n("slips");
    let sp = "";
    for (let i = 0; i < slips; i++) {
      const a = (i / 8) * Math.PI * 2;
      sp += k.dot({ x: x + Math.cos(a) * 44, y: y + Math.sin(a) * 44, r: 2.5, color: "#7fd4ff" });
    }
    const tw = I(v, "toWhom");
    const nx = 190 + (v.n("nearest") / 10) * 90;
    let ws = "";
    for (let i = 0; i < [0, 0, 1, 3][tw]; i++) ws += k.person({ x: nx + i * 16, y: 132, s: 0.6, look: -1, color: "#8a8a8a" });
    if (tw === 1) ws += `<ellipse cx="${nx}" cy="104" rx="12" ry="7" fill="#fff"/><circle cx="${nx}" cy="104" r="4" fill="${ink}"/>`;
    const cost = I(v, "cost");
    let coins = "";
    for (let i = 0; i < [0, 1, 3, 6][cost]; i++) coins += `<ellipse cx="290" cy="${40 - i * 4}" rx="10" ry="3.5" fill="#e0a83c" stroke="${ink}"/>`;
    const da = v.n("dropAt") / 100;
    const mo = (v.n("maskOff") / 60) * 0.4;
    return (
      k.bg(BG) +
      k.face({ x, y, r: 30, mood: -0.8, brows: 0.8, eyes: 0.6 }) +
      `<path d="M${x - 12} ${y} q-2 8 0 12 q2 -4 0 -12" fill="#5aa0ff"/>` +
      mask +
      sp +
      ws +
      S(k, nx, 146, `${v.n("nearest")} m away`, "#aaa") +
      coins +
      S(k, 290, 56, `costs ${v("cost")}`, "#ccc", "middle", 7) +
      bar(k, 20, 154, 280, "mask off") +
      piece(k, 20, 154, 280, da, da + mo, "#7fd4ff") +
      k.caption(`${v("setting")} · instead: ${v("mask")} · to ${v("toWhom")}`)
    );
  });

  /* ---------------- emotionGap: two people feeling different things ---------------- */
  W.look("emotionGap", (v, k) => {
    const apart = v.n("apart") / 10;
    const ax = 120 - apart * 80;
    const bx = 200 + apart * 80;
    const lo = v.p("louder");
    const aw = I(v, "awareness");
    const gap = v.n("gap") / 5;
    const play = I(v, "playedFor");
    const cl0 = I(v, "closing");
    const mx = (ax + bx) / 2;
    let rift = `<polyline points="${[0, 1, 2, 3, 4, 5, 6].map((i) => `${r1(mx + (i % 2 ? 1 : -1) * (1 + gap * 7))},${30 + i * 14}`).join(" ")}" fill="none" stroke="#ef5350" stroke-width="${r1(1 + gap * 2)}"/>`;
    const arr = cl0 === 1 ? "" : cl0 === 0 ? k.arrow({ x1: mx - 4, y1: 128, x2: mx - 28, y2: 128, color: "#ef5350", w: 2 }) + k.arrow({ x1: mx + 4, y1: 128, x2: mx + 28, y2: 128, color: "#ef5350", w: 2 }) : k.arrow({ x1: mx - 28, y1: 128, x2: mx - 6, y2: 128, color: "#6cc070", w: 2 }) + k.arrow({ x1: mx + 28, y1: 128, x2: mx + 6, y2: 128, color: "#6cc070", w: 2 });
    return (
      k.bg(BG) +
      k.tint({ color: ["#3c5cff", "#9a7cff", "#ffd166"][play], alpha: 0.12 }) +
      rift +
      k.face({ x: ax, y: 72, r: 20 + (1 - lo) * 14, mood: v.n("firstFeels") / 5, look: aw >= 1 ? 1 : -1 }) +
      k.face({ x: bx, y: 72, r: 20 + lo * 14, mood: v.n("secondFeels") / 5, look: aw === 2 ? -1 : 1 }) +
      S(k, mx, 146, `${v.n("apart")} m apart`, "#aaa") +
      arr +
      S(k, 300, 20, `played for ${v("playedFor")}`, "#ccc", "end") +
      bar(k, 20, 154, 120, "closes at") +
      pin(k, 20, 154, 120, v.n("closeAt") / 100, "#6cc070") +
      k.caption(`${v("awareness")} · ${v("closing")} · louder: ${v("louder")}`)
    );
  });

  /* ---------------- subtext: what they say, and what they think ---------------- */
  W.look("subtext", (v, k) => {
    const gi = I(v, "gap");
    const think = ["I'm fine.", "I'm... fine.", "I'm not fine.", "I'm falling apart."][gi];
    const x = 70;
    const y = 140;
    const pause = v.n("pauseBefore");
    const dotsN = Math.round(pause * 2);
    const say = `${".".repeat(dotsN)} I'm fine.`;
    const leak = I(v, "leak");
    const spot = [[x, y - 70], [x + 16, y - 46], [x + 26, y - 82], [x, y - 60]][leak];
    const tells = v.n("tells");
    let sp = "";
    for (let i = 0; i < tells; i++) {
      const a = (i / 8) * Math.PI * 2;
      sp += k.dot({ x: spot[0] + Math.cos(a) * 12, y: spot[1] + Math.sin(a) * 12, r: 1.8, color: "#c9a0ff" });
    }
    const ci = I(v, "caught");
    const catcher = (ci === 2 || ci === 3 ? k.person({ x: 250, y, s: 0.9, look: -1, mood: -0.2, color: "#8a8a8a" }) + S(k, 250, y - 86, "!", "#ffd166", "middle", 16) : k.person({ x: 250, y, s: 0.9, look: -1, mood: 0.3, color: "#8a8a8a" })) + (ci === 1 || ci === 3 ? `<ellipse cx="290" cy="28" rx="12" ry="7" fill="#fff"/><circle cx="290" cy="28" r="4" fill="${ink}"/>` : "");
    const hs = Math.round(v.n("hiddenShare") / 10);
    let lines = "";
    for (let i = 0; i < 10; i++) lines += `<rect x="${150 + i * 9}" y="150" width="7" height="5" fill="${i < hs ? "#c9a0ff" : "#555"}"/>`;
    const tOut = I(v, "truthOut");
    return (
      k.bg(BG) +
      k.tint({ color: ["#3c5cff", "#9a7cff", "#ffd166"][I(v, "playedFor")], alpha: 0.1 }) +
      k.bubble({ x: 168, y: 46, w: 110, h: 28, text: say, tail: -60, size: 10 }) +
      `<g opacity="${r1(0.5 + gi * 0.17)}"><ellipse cx="84" cy="22" rx="${46 + gi * 6}" ry="14" fill="#c9a0ff"/>${k.text({ x: 84, y: 26, text: think, size: 10, color: ink })}</g>` +
      k.person({ x, y, s: 1, mood: 0.3, color: "#4a6fa5", arms: leak === 1 ? 0.3 : -0.2 }) +
      k.ring({ x: spot[0], y: spot[1], r: 7, color: "#c9a0ff", w: 1.5 }) +
      sp +
      catcher +
      lines +
      S(k, 150, 146, "lines with a hidden meaning", "#aaa", "start", 7) +
      S(k, 20, 158, `truth out: ${v("truthOut")}`, tOut === 0 ? "#777" : "#ffd166", "start", 7) +
      k.caption(`${v("gap")} · leaks in ${v("leak")} · caught by ${v("caught")}`)
    );
  });

  /* ---------------- emotionalDebt: a jar filling with what they hold in ---------------- */
  const HELD = { grief: "#2b2b3a", anger: "#c0392b", love: "#ff7aa2", fear: "#7b5cc4", shame: "#6b8f3a" };
  W.look("emotionalDebt", (v, k) => {
    const col = HELD[v("what")] || "#888";
    const held = v.p("held");
    const jx = 110;
    const jy = 30;
    const jw = 80;
    const jh = 100;
    const lvl = 0.1 + held * 0.85;
    const brk = I(v, "breaking");
    let cracks = "";
    for (let i = 0; i < [0, 1, 3, 6][brk]; i++) cracks += `<polyline points="${jx + 6 + i * 12},${jy + 10 + (i % 2) * 30} ${jx + 12 + i * 12},${jy + 22 + (i % 2) * 30} ${jx + 8 + i * 12},${jy + 34 + (i % 2) * 30}" fill="none" stroke="#fff" stroke-width="1.5"/>`;
    const leaks = v.n("leaks");
    let drops = "";
    for (let i = 0; i < leaks; i++) drops += `<path d="M${jx + jw + 6} ${jy + 70 + i * 10} q-3 6 0 8 q3 -2 0 -8" fill="${col}"/>`;
    const add = v.n("addedHere");
    const pour = add ? `<rect x="${jx + jw / 2 - add}" y="6" width="${add * 2}" height="${jy + jh * (1 - lvl) - 6}" fill="${col}" opacity="0.8"/>` : "";
    const sc = v.n("scenes");
    let stack = "";
    for (let i = 0; i < sc; i++) stack += `<rect x="${30 + (i % 4) * 12}" y="${126 - Math.floor(i / 4) * 10}" width="10" height="8" fill="#555"/>`;
    const since = v.n("sinceLeak");
    return (
      k.bg(BG) +
      stack +
      S(k, 30, 140, `held ${sc} scenes`, "#aaa", "start", 7) +
      pour +
      `<rect x="${jx}" y="${r1(jy + jh * (1 - lvl))}" width="${jw}" height="${r1(jh * lvl)}" fill="${col}"/>` +
      `<rect x="${jx}" y="${jy}" width="${jw}" height="${jh}" rx="8" fill="none" stroke="#ddd" stroke-width="3"/>` +
      cracks +
      drops +
      `<ellipse cx="${jx + jw + 30}" cy="118" rx="${r1(Math.max(1, 16 - since * 0.7))}" ry="3" fill="${col}" opacity="0.6"/>` +
      S(k, jx + jw + 30, 132, `${since} scenes since a leak`, "#aaa", "middle", 7) +
      k.person({ x: 290, y: 100, s: 0.75, look: -1, color: "#8a8a8a" }) +
      S(k, 290, 112, v("owedTo"), "#ccc") +
      bar(k, 20, 154, 280, "") +
      pin(k, 20, 154, 280, v.n("dueAt") / 100, "#ef5350", "comes due") +
      k.caption(`Holding in ${v("what")} · ${v("breaking")}`)
    );
  });

  /* ---------------- feelingEcho: the first time and its echo ---------------- */
  function motif(k, kind, x, y, s, col) {
    if (kind === "music") return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><circle cx="-6" cy="8" r="6" fill="${col}"/><line x1="0" y1="8" x2="0" y2="-14" stroke="${col}" stroke-width="2.5"/><path d="M0 -14 q8 3 10 10" stroke="${col}" stroke-width="2.5" fill="none"/></g>`;
    if (kind === "a place") return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><path d="M-14 12 v-14 l14 -12 l14 12 v14 z" fill="${col}"/></g>`;
    if (kind === "a line") return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><rect x="-16" y="-10" width="32" height="18" rx="6" fill="${col}"/><path d="M-6 8 l-4 8 l10 -8" fill="${col}"/></g>`;
    if (kind === "a shot") return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><rect x="-16" y="-11" width="32" height="22" fill="none" stroke="${col}" stroke-width="3"/></g>`;
    return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s)})"><circle r="12" fill="${col}"/></g>`;
  }
  W.look("feelingEcho", (v, k) => {
    const th = v("through");
    const seed = v.p("seeded");
    const lk = I(v, "likeness");
    const chg = I(v, "changed");
    const str = v.p("strength");
    const gap = v.n("gap") / 40;
    const L = [70, 72];
    const R = [250, 72];
    const rCol = ["#ffd166", "#ff9a3c", "#5aa0ff"][chg];
    const rBg = ["#2c3340", "#1a1f2a", "#3d3220"][chg];
    const rs = 1.2 * [0.6, 0.85, 1][lk] * (chg === 1 ? 1.15 : 1);
    const rRot = [30, 10, 0][lk];
    const rOff = [16, 6, 0][lk];
    const lasts = (v.n("lasts") / 60) * 100;
    return (
      k.bg(BG) +
      `<rect x="20" y="30" width="100" height="84" fill="#2c3340"/>` +
      `<rect x="200" y="30" width="100" height="84" fill="${rBg}"/>` +
      motif(k, th, L[0], L[1], 0.8 + seed * 0.6, k.mix("#6e6e6e", "#ffd166", 0.3 + seed * 0.7)) +
      `<g transform="rotate(${rRot} ${R[0]} ${R[1]})">${motif(k, th, R[0] + rOff, R[1] - rOff / 2, rs, rCol)}</g>` +
      k.ring({ x: R[0], y: R[1], r: 18 + str * 22, color: "rgba(255,209,102,0.5)", w: 1 + str * 3 }) +
      `<path d="M70 28 Q160 ${r1(26 - 10 - gap * 18)} 250 28" fill="none" stroke="#888" stroke-dasharray="4 3"/>` +
      S(k, 160, r1(18 - gap * 9), `${v.n("gap")} scenes · ${v.n("minutesSince")} min`, "#ccc") +
      S(k, 70, 126, "the first time", "#aaa") +
      S(k, 250, 126, `on ${v("landsOn")}`, "#aaa") +
      `<rect x="200" y="134" width="${r1(Math.max(1, lasts))}" height="6" fill="#ffd166"/>` +
      S(k, 200, 150, `lasts ${v.n("lasts")} s`, "#aaa", "start", 7) +
      k.caption(`Echo through ${th} · ${v("likeness")} · means ${v("changed")}`)
    );
  });

  /* ---------------- warmth: two people, the air between them warm or cold ---------------- */
  W.look("warmth", (v, k) => {
    const lv = v.n("level") / 5;
    const gap = 70 - lv * 30;
    const ti = I(v, "touch");
    const ax = 160 - gap / 2 - (ti === 3 ? -14 : 0);
    const bx = 160 + gap / 2 + (ti === 3 ? -14 : 0);
    const y = 140;
    const trust = v.p("trust");
    const look = v.n("lookShare") / 100;
    const tr = I(v, "trend");
    const tease = ["", "hm.", "ha!", "♪ remember?"][I(v, "teasing")];
    const tc = v.n("touchCount");
    const thermo = cl(0.5 + lv * 0.45, 0.05, 1);
    const ghost = cl(thermo - (v.n("sinceLast") / 5) * 0.45, 0, 1);
    return (
      k.bg(BG) +
      k.tint({ color: lv >= 0 ? "#ff9a3c" : "#3c8cff", alpha: 0.05 + Math.abs(lv) * 0.25 }) +
      `<rect x="${r1(ax)}" y="${y}" width="${r1(bx - ax)}" height="${r1(2 + trust * 6)}" fill="#c9b79a"${trust < 0.4 ? ' stroke-dasharray="4 4" stroke="#c9b79a"' : ""}/>` +
      `<line x1="${r1(ax)}" y1="${y - 68}" x2="${r1(bx)}" y2="${y - 68}" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="3 3" opacity="${r1(0.1 + look * 0.9)}"/>` +
      k.person({ x: ax, y, s: 1, mood: lv * 0.8, look: 1, arms: ti >= 2 ? 0.4 : -0.3, lean: ti === 1 ? 6 : 0, color: "#4a6fa5" }) +
      k.person({ x: bx, y, s: 1, mood: lv * 0.8, look: -1, arms: ti >= 2 ? 0.4 : -0.3, lean: ti === 1 ? -6 : 0, color: "#a55a4a" }) +
      (ti === 2 ? k.dot({ x: 160, y: y - 40, r: 4, color: "#f0c8a0" }) : "") +
      (tease ? k.bubble({ x: 230, y: 30, w: 80, h: 22, text: tease, tail: -16, size: 9 }) : "") +
      ticks(k, 20, 30, tc, { gap: 7, color: "#ff7aa2", w: 3 }) +
      S(k, 20, 42, `${tc} touches`, "#aaa", "start", 7) +
      `<rect x="296" y="50" width="10" height="80" rx="5" fill="#333"/><rect x="296" y="${r1(130 - thermo * 80)}" width="10" height="${r1(thermo * 80)}" rx="5" fill="${lv >= 0 ? "#ff9a3c" : "#5aa0ff"}"/><line x1="290" y1="${r1(130 - ghost * 80)}" x2="312" y2="${r1(130 - ghost * 80)}" stroke="#9be36b" stroke-width="2"/>` +
      ([2, 1, 0, -1, -2][tr] ? k.arrow({ x1: 284, y1: 90, x2: 284, y2: 90 + [2, 1, 0, -1, -2][tr] * 10, color: tr > 2 ? "#ff9a3c" : "#5aa0ff", w: 2 }) : "") +
      bar(k, 20, 160, 120, "") +
      pin(k, 20, 160, 120, v.n("turnAt") / 100, "#ffd166", "turn") +
      k.caption(`${v("trend")} · touch: ${v("touch")} · trust ${v.n("trust")} of 5`)
    );
  });

  /* ---------------- emoVoice: the voice as a wave, with its pauses ---------------- */
  W.look("emoVoice", (v, k) => {
    const st = v.p("setting");
    const col = k.mix("#9fd3ff", "#ef5350", st);
    const vol = v.p("volume");
    const louder = v.n("louder") / 100;
    const amp = cl(0.25 + vol * 0.55 + louder * 0.2, 0.08, 1);
    const pitch = I(v, "pitch");
    const cyc = 2 + v.n("pace") * 0.6 + (v.n("wordsPerMinute") - 60) / 180 * 2 + pitch * 0.4;
    const cr = I(v, "crack");
    const pauses = v.n("pauses");
    const longest = 6 + (v.n("longestPause") / 10) * 50;
    const segs = pauses + 1;
    const gaps = pauses * 6 + longest;
    const sw = (280 - gaps) / segs;
    let x = 20;
    let s = "";
    for (let i = 0; i < segs; i++) {
      s += k.wave({ x, y: 80, w: sw, h: 70, amp, cycles: Math.max(1, cyc * (sw / 60)), noise: [0, 0.15, 0.35, 0.6][cr], color: col });
      x += sw;
      if (i < segs - 1) {
        const gw = i === 0 ? longest : 6;
        if (i === 0) s += S(k, x + gw / 2, 128, `${v.n("longestPause")} s`, "#aaa", "middle", 7);
        x += gw;
      }
    }
    const br = I(v, "breath");
    let puffs = "";
    for (let i = 0; i < [1, 2, 4, 7][br]; i++) puffs += `<circle cx="${30 + i * 14}" cy="${150 + (br === 3 ? (i % 2) * 5 : 0)}" r="3" fill="none" stroke="#cfe3f0"/>`;
    return (
      k.bg(BG) +
      k.mic({ x: 296, y: 30, s: 0.9 }) +
      S(k, 20, 22, `pitch: ${v("pitch")} · ${v.n("wordsPerMinute")} words a minute`, "#ccc", "start") +
      `<line x1="20" y1="80" x2="300" y2="80" stroke="#333"/>` +
      s +
      puffs +
      S(k, 20, 166 - 4, `breath: ${v("breath")}`, "#aaa", "start", 7) +
      k.caption(`${v("setting")} · ${v("volume")} · ${v("crack")}`)
    );
  });

  /* ---------------- wordsAmount: speech bubbles in the scene ---------------- */
  W.look("wordsAmount", (v, k) => {
    const amt = v.n("setting") / 5;
    const wi = I(v, "whoTalks");
    const share = v.n("mainShare") / 100;
    const people = [70, 140, 210, 270];
    const ppl = people.map((x, i) => k.person({ x, y: 160, s: 0.7, color: i === 0 ? "#4a6fa5" : "#8a8a8a", mood: 0.1 })).join("");
    const talkers = [1, 2, 2, 4][wi];
    const lines = Math.round(1 + (v.n("wordCount") / 2000) * 5);
    const onT = I(v, "onTopic");
    let bub = "";
    for (let i = 0; i < talkers; i++) {
      const w = i === 0 ? 40 + share * 70 * (0.4 + amt) : 30 + (1 - share) * 40 * (0.4 + amt) * (wi === 1 ? 0.5 : 1);
      const h = 14 + lines * 5;
      const x = people[i];
      bub += `<rect x="${r1(x - w / 2)}" y="${r1(90 - h)}" width="${r1(w)}" height="${h}" rx="8" fill="#fff" stroke="${ink}" opacity="${r1(0.5 + amt * 0.5)}"/>`;
      for (let j = 0; j < lines; j++) bub += `<line x1="${r1(x - w / 2 + 6)}" y1="${r1(90 - h + 8 + j * 5)}" x2="${r1(x + w / 2 - 6)}" y2="${r1(90 - h + 8 + j * 5)}" stroke="#999" stroke-width="1.5"/>`;
      if (i === 0) bub += heart(k, x + (onT === 0 ? w / 2 + 8 : 0), 90 - h - 4, onT === 1 ? 4 : 5) + (onT === 0 ? "" : "");
    }
    const intr = v.n("interrupt");
    for (let i = 0; i < intr; i++) bub += `<path d="M${105 + i * 30} ${40} l6 -8 l2 8 l6 -8" stroke="#ef5350" stroke-width="2" fill="none"/>`;
    const tr = I(v, "trend");
    const sil = (v.n("silence") / 30) * 60;
    const lng = (v.n("longestSpeech") / 120) * 80;
    let tl = `<rect x="20" y="8" width="${r1(lng)}" height="8" fill="#ffd166"/>`;
    let x = 22 + lng;
    for (let i = 0; i < 12 && x < 300 - sil; i++) {
      const hh = cl([8 - i * 0.6, 5, 2 + i * 0.5, 2 + i * 0.9][tr], 1, 10);
      tl += `<rect x="${r1(x)}" y="${r1(16 - hh)}" width="6" height="${r1(hh)}" fill="#9fd3ff"/>`;
      x += 9;
      if (i === 4) {
        tl += `<rect x="${r1(x)}" y="14" width="${r1(Math.max(1, sil))}" height="2" fill="#555"/>`;
        x += sil + 2;
      }
    }
    return (
      k.bg(BG) +
      bub +
      tl +
      ppl +
      S(k, 300, 28, `${v.n("wordCount")} words · ${v.n("silence")} s silence`, "#aaa", "end", 7) +
      k.caption(`${v("whoTalks")} · ${v("onTopic")} · ${v("trend")}`)
    );
  });

  /* ---------------- emoSpread: a feeling rippling out through the room ---------------- */
  W.look("emoSpread", (v, k) => {
    const cx = 110;
    const cy = 90;
    const rad = 14 + (v.n("radius") / 30) * 86;
    const gi = I(v, "grows");
    let rings = "";
    for (let i = 1; i <= 3; i++) {
      const a = gi === 0 ? 0.8 - i * 0.22 : gi === 2 ? 0.2 + i * 0.22 : 0.5;
      rings += k.ring({ x: cx, y: cy, r: (rad * i) / 3, color: `rgba(255,209,102,${r1(a * 100) / 100})`, w: 1 + gi });
    }
    const sp = v.n("speed");
    for (let i = 0; i < sp; i++) rings += `<line x1="${r1(cx + rad + 4)}" y1="${cy - 8 + i * 4}" x2="${r1(cx + rad + 10 + sp * 3)}" y2="${cy - 8 + i * 4}" stroke="#ffd166"/>`;
    const near = [0, 1, 3, 5][I(v, "setting")];
    const hold = [0, 1, 3][I(v, "holdout")];
    let ppl = "";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.6;
      const x = cx + Math.cos(a) * 42;
      const y = cy + Math.sin(a) * 34;
      const held = i >= 5 - hold;
      ppl += k.face({ x, y, r: 8, mood: held ? -0.3 : i < near ? 0.8 : 0, color: held ? "#999" : i < near ? "#ffd8a0" : "#d6c2a8", brows: held ? -0.8 : 0 });
    }
    const reached = Math.round((v.n("reached") / 50) * 40);
    let crowd = "";
    for (let i = 0; i < 40; i++) crowd += k.dot({ x: 210 + (i % 8) * 12, y: 30 + Math.floor(i / 8) * 14, r: 3, color: i < reached ? "#ffd166" : "#444" });
    const us = v.p("reachesUs");
    return (
      k.bg(BG) +
      rings +
      k.face({ x: cx, y: cy, r: 13, mood: 0.9, mouth: 0.4 }) +
      S(k, cx, cy - 18, `by ${v("passes")}`, "#ffd166", "middle", 7) +
      ppl +
      crowd +
      S(k, 254, 108, `${v.n("reached")} people · ${v.n("radius")} m`, "#ccc") +
      `<rect x="210" y="120" width="92" height="10" rx="3" fill="#333"/><rect x="210" y="120" width="${r1(Math.max(1, 92 * us))}" height="10" rx="3" fill="#ffd166"/>` +
      S(k, 256, 142, `us: ${v("reachesUs")}`, "#aaa") +
      k.pie({ x: 30, y: 30, r: 12, p: v.n("spreadSeconds") / 120, color: "#9fd3ff" }) +
      S(k, 48, 34, `${v.n("spreadSeconds")} s`, "#aaa", "start") +
      k.caption(`Spreads to ${v("setting")} · ${v("grows")} · holdouts: ${v("holdout")}`)
    );
  });

  /* ---------------- mixedFeelings: a face split between two feelings ---------------- */
  W.look("mixedFeelings", (v, k) => {
    const c1 = FEEL[v("first")] || "#ffd166";
    const c2 = FEEL[v("second")] || "#7a8cc0";
    const bal = [0.95, 0.7, 0.5, 0.3][I(v, "balance")];
    const shown = [0.15, 0.5, 1][I(v, "shown")];
    const cx = 90;
    const cy = 72;
    const r = 44;
    const split = cx - r + bal * 2 * r;
    const face1 = k.face({ x: cx, y: cy, r, mood: 0.7, color: k.mix("#f0c8a0", c1, 0.45) });
    const face2 = k.face({ x: cx, y: cy, r, mood: -0.6, brows: 0.7, color: k.mix("#f0c8a0", c2, 0.45) });
    const share = v.n("secondShare") / 100;
    const at = v.n("secondAt") / 100;
    const sw = v.n("switches");
    let tl = `<rect x="20" y="140" width="280" height="10" fill="${c1}"/>`;
    const parts = sw + 1;
    const span = (1 - at) * 280;
    for (let i = 0; i < parts; i++) {
      if (i % 2) continue;
      const x0 = 20 + at * 280 + (i / parts) * span;
      tl += `<rect x="${r1(x0)}" y="140" width="${r1(Math.max(1, (span / parts) * (0.3 + share * 1.4)))}" height="10" fill="${c2}"/>`;
    }
    const wi = I(v, "wins");
    return (
      k.bg(BG) +
      `<clipPath id="cw-mixedFeelings-a"><rect x="0" y="0" width="${r1(split)}" height="180"/></clipPath><clipPath id="cw-mixedFeelings-b"><rect x="${r1(split)}" y="0" width="${r1(320 - split)}" height="180"/></clipPath>` +
      `<g clip-path="url(#cw-mixedFeelings-a)">${face1}</g><g clip-path="url(#cw-mixedFeelings-b)" opacity="${shown}">${face2}</g>` +
      `<line x1="${r1(split)}" y1="${cy - r - 4}" x2="${r1(split)}" y2="${cy + r + 4}" stroke="#fff" stroke-dasharray="2 2"/>` +
      S(k, 190, 50, v("first"), c1, "start", 12) +
      S(k, 190, 70, "and", "#888", "start", 9) +
      S(k, 190, 90, v("second"), c2, "start", 12) +
      tl +
      `<rect x="296" y="136" width="18" height="18" rx="4" fill="${[c1, "#888", c2][wi]}"/>` +
      S(k, 292, 132, `wins: ${v("wins")}`, "#aaa", "end", 7) +
      k.caption(`${v("balance")} · ${v("shown")} · ${sw} switches`)
    );
  });

  /* ---------------- personalSpace: two people and the space between them ---------------- */
  W.look("personalSpace", (v, k) => {
    const m = v.n("meters");
    const want = v.n("wantMeters");
    const pxm = 22;
    const ax = 60;
    const bx = ax + 14 + m * pxm;
    const wx = ax + 14 + want * pxm;
    const y = 140;
    const hg = v.n("heightGap") * 14;
    const ci = I(v, "comfort");
    const di = I(v, "distance");
    const zones = ["touching", "close", "conversation", "apart", "across the room"];
    let floorZ = "";
    for (let i = 0; i < 5; i++) floorZ += `<rect x="${ax + i * 50}" y="${y + 2}" width="48" height="6" fill="${i === di ? "#ffd166" : "#333"}"/>`;
    const bi = I(v, "barrier");
    const bxm = (ax + bx) / 2;
    const barrier = ["", `<rect x="${r1(bxm - 6)}" y="${y - 12}" width="12" height="12" fill="#8a7158"/>`, `<rect x="${r1(bxm - 18)}" y="${y - 30}" width="36" height="5" fill="#8a7158"/><line x1="${r1(bxm - 14)}" y1="${y - 25}" x2="${r1(bxm - 14)}" y2="${y}" stroke="#8a7158" stroke-width="3"/><line x1="${r1(bxm + 14)}" y1="${y - 25}" x2="${r1(bxm + 14)}" y2="${y}" stroke="#8a7158" stroke-width="3"/>`, `<rect x="${r1(bxm - 4)}" y="${y - 90}" width="8" height="90" fill="#6b6b75"/>`][bi];
    const mv = I(v, "movement");
    const mArrow = [-1, 0, 0.5, 1][mv];
    const who = I(v, "who");
    let arrows = "";
    if (mArrow) {
      if (who !== 0 || true) arrows += k.arrow({ x1: bx, y1: 40, x2: bx - mArrow * 22, y2: 40, color: mArrow > 0 ? "#6cc070" : "#ef5350", w: 2 });
      if (who === 2) arrows += k.arrow({ x1: ax, y1: 40, x2: ax + mArrow * 22, y2: 40, color: mArrow > 0 ? "#6cc070" : "#ef5350", w: 2 });
    }
    const face = v.n("facing");
    return (
      k.bg(BG) +
      floorZ +
      S(k, ax + di * 50 + 24, y + 18, zones[di], "#ffd166", "middle", 7) +
      barrier +
      k.person({ x: ax, y, s: 1, look: 1, mood: [-0.8, -0.4, 0.2, 0.7][ci], color: "#4a6fa5" }) +
      `<g opacity="0.35">${k.person({ x: wx, y: y - hg, s: 1, color: "#888" })}</g>` +
      `<g transform="translate(${r1(bx)} 0) scale(${r1(Math.max(0.35, Math.cos((face * Math.PI) / 360)))} 1) translate(${r1(-bx)} 0)">${k.person({ x: bx, y: y - hg, s: 1, look: face > 90 ? 1 : -1, mood: 0, color: "#a55a4a" })}</g>` +
      arrows +
      S(k, 160, 22, `${who === 0 ? "nobody closes it" : who === 1 ? "one closes it" : "both close it"} · ${v("movement")}`, "#ccc") +
      S(k, (ax + bx) / 2, y - 80, `${m} m (wants ${want} m)`, "#ccc") +
      S(k, 300, 60, `turned ${face}°`, "#aaa", "end") +
      k.pie({ x: 290, y: 90, r: 9, p: v.n("holdTime") / 30, color: "#9fd3ff" }) +
      S(k, 278, 94, `${v.n("holdTime")} s`, "#aaa", "end", 7) +
      k.caption(`${v("distance")} · ${v("comfort")} · ${v("barrier")} between`)
    );
  });

  /* ---------------- breather: the dip of rest between two big moments ---------------- */
  W.look("breather", (v, k) => {
    const b = { x: 18, y: 26, w: 284, h: 104 };
    const rest = v.n("rest") / 5;
    const quiet = v.n("quieter") / 100;
    const soon = [0.02, 0.06, 0.14][I(v, "soonAfter")];
    const len = 0.05 + (v.n("length") / 5) * 0.2;
    const s0 = 0.18 + soon;
    const next = s0 + len + 0.03 + (v.n("untilNext") / 20) * 0.35;
    const low = cl(0.55 - rest * 0.2 - quiet * 0.3, 0.03, 0.6);
    const f = (t) => 0.55 + 0.4 * bump(t, 0.15, 0.03) + 0.4 * bump(t, next, 0.03) - (0.55 - low) * (t > s0 && t < s0 + len ? 1 : t > s0 - 0.03 && t <= s0 ? (t - s0 + 0.03) / 0.03 : t >= s0 + len && t < s0 + len + 0.03 ? 1 - (t - s0 - len) / 0.03 : 0);
    const cb = I(v, "calmBefore");
    const cloud = cb ? `<ellipse cx="${r1(px(b, next))}" cy="${b.y + 8}" rx="${8 + cb * 7}" ry="${5 + cb * 3}" fill="#555b6a"/>` : "";
    const grip = v.p("grip");
    return (
      k.bg(BG) +
      box(k, b) +
      line(k, b, f, { color: "#ffd166" }) +
      cloud +
      S(k, px(b, 0.15), b.y + 10, "big moment", "#ffd166") +
      S(k, px(b, s0 + len / 2), py(b, low) + 12, v("kind"), "#6cc070") +
      k.face({ x: 290, y: 150, r: 12, eyes: 0.2 + grip * 0.8, mood: 0.2, look: -1 }) +
      S(k, 274, 154, grip > 0.5 ? "still held" : "drifting", "#aaa", "end") +
      S(k, 20, 152, `${v.n("length")} min rest · ${Math.round(v.n("quieter"))}% quieter · ${v.n("untilNext")} min to next`, "#aaa", "start", 7) +
      k.caption(`${v("kind")} · ${v("soonAfter")} · ${v("calmBefore")}`)
    );
  });

  /* ---------------- emoMove: how the body moves with the feeling ---------------- */
  W.look("emoMove", (v, k) => {
    const st = v.p("setting");
    const pace = v.n("pace") / 5;
    const cov = v.n("metersCovered") / 30;
    const sp = [0.8, 1, 1.2][I(v, "space")];
    const tw = I(v, "toward");
    const x = 120 + (tw - 1) * 30;
    const y = 140;
    const rh = I(v, "rhythm");
    const start = x - 20 - cov * 90;
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const xx = start + (x - start) * t;
      const yy = y + 6 + [Math.sin(t * 6) * 2, Math.sin(t * 13) * 4 * (i % 3 ? 1 : -0.5), (i % 2 ? 5 : -5), 0][rh];
      pts.push(`${r1(xx)},${r1(yy)}`);
    }
    const trail = `<polyline points="${pts.join(" ")}" fill="none" stroke="#9fd3ff" stroke-width="2"${rh === 3 ? ' stroke-dasharray="8 6"' : ""}/>`;
    let lines = "";
    for (let i = 0; i < Math.round(st * 6); i++) lines += `<line x1="${r1(x - 18 - i * 2)}" y1="${r1(y - 70 + i * 10)}" x2="${r1(x - 24 - pace * 20 - i * 2)}" y2="${r1(y - 70 + i * 10)}" stroke="#fff" stroke-width="1.2" opacity="0.6"/>`;
    const wh = I(v, "where");
    const spot = [[x + 16 * sp, y - 54 * sp], [x, y - 58 * sp], [x, y - 2], [x, y - 40 * sp]][wh];
    const cb = v.n("closerBy");
    const other = 250 - cb * 4;
    return (
      k.bg(BG) +
      k.floor(y, "#26221e") +
      trail +
      lines +
      `<g transform="rotate(${r1((st - 0.5) * 10 * (rh === 2 ? -1 : 1))} ${x} ${y})">${k.person({ x, y, s: sp, arms: -0.6 + st * 1.4, walk: pace, mood: 0, look: tw === 0 ? -1 : 1, color: "#4a6fa5" })}</g>` +
      k.ring({ x: spot[0], y: spot[1], r: wh === 3 ? 40 * sp : 9, color: "#ffd166", w: 1.5, dash: "3 2" }) +
      k.person({ x: other, y, s: 0.8, look: -1, color: "#8a8a8a" }) +
      S(k, other, 24, `${v("towardWhat")}`, "#ccc") +
      S(k, other, 36, `${cb > 0 ? cb + " m closer" : cb < 0 ? -cb + " m farther" : "same distance"}`, "#aaa") +
      S(k, start, y + 18, `${v.n("metersCovered")} m`, "#9fd3ff", "start", 7) +
      k.caption(`${v("setting")} · ${v("rhythm")} · ${v("toward")}`)
    );
  });

  /* ---------------- movementAmount: how much the people in the scene move ---------------- */
  W.look("movementAmount", (v, k) => {
    const amt = v.n("setting") / 5;
    const front = [1, 3, 5][I(v, "who")];
    const pu = I(v, "purpose");
    let out = "";
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 52;
      const moving = i < front;
      out += k.person({ x, y: 120, s: 0.75, walk: moving ? 0.3 + amt * 0.7 : 0, arms: moving ? amt * 0.6 : -0.3, color: moving ? "#4a6fa5" : "#666" });
      if (moving) {
        const len = 6 + amt * 22;
        out += [
          `<path d="M${x - 10} 128 q${r1(len / 2)} -10 ${r1(len)} 0 q-${r1(len / 2)} 10 -${r1(len)} 0" fill="none" stroke="#9fd3ff"/>`,
          `<path d="M${x - 6} 128 l3 -3 l3 3 l3 -3 l3 3" fill="none" stroke="#9fd3ff"/>`,
          k.arrow({ x1: x - len / 2, y1: 128, x2: x + len / 2, y2: 128, color: "#9fd3ff", w: 1.2 }) + k.arrow({ x1: x + len / 2, y1: 131, x2: x - len / 2, y2: 131, color: "#9fd3ff", w: 1.2 }),
          k.arrow({ x1: x - 6, y1: 128, x2: x + 6 + len, y2: 128, color: "#9fd3ff", w: 2 }),
        ][pu];
      }
    }
    const pm = Math.round((v.n("peopleMoving") / 50) * 24);
    let crowd = "";
    for (let i = 0; i < 24; i++) crowd += k.dot({ x: 20 + i * 12, y: 30 + (i % 2) * 6, r: 3, color: i < pm ? "#9fd3ff" : "#444" });
    const share = v.n("movingShare") / 100;
    const tr = I(v, "trend");
    let tl = "";
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const h = cl([8 - t * 6, 5, 2 + t * 6, 2 + t * t * 9][tr], 1, 10);
      tl += `<rect x="${20 + i * 14}" y="${r1(156 - h)}" width="10" height="${r1(h)}" fill="${t < share ? "#9fd3ff" : "#444"}"/>`;
    }
    const fz = [0, 1, 3][I(v, "freeze")];
    const lf = 4 + (v.n("longestFreeze") / 30) * 50;
    for (let i = 0; i < fz; i++) tl += `<rect x="${r1(60 + i * 80)}" y="144" width="${r1(i === 0 ? lf : 5)}" height="12" fill="#e8f4ff" opacity="0.8"/>`;
    if (!fz) tl += `<rect x="60" y="158" width="${r1(lf)}" height="2" fill="#e8f4ff" opacity="0.4"/>`;
    return k.bg(BG) + crowd + S(k, 20, 18, `${v.n("peopleMoving")} people moving`, "#aaa", "start", 7) + out + tl + k.caption(`${v("purpose")} · ${v("who")} · freezes: ${v("freeze")}`);
  });

  /* ---------------- postureChanges: one person shifting while the other reacts ---------------- */
  W.look("postureChanges", (v, k) => {
    const lean = v.n("lean");
    const dir = v.p("direction");
    const turned = v.n("turnedAway");
    const ax = 110;
    const bx = 210;
    const y = 140;
    const n = v.n("setting");
    let ghosts = "";
    for (let i = 0; i < n; i++) ghosts += `<g opacity="0.12">${k.person({ x: ax - 4 - i * 4, y, s: 1, lean: lean * (i / Math.max(1, n)), color: "#4a6fa5" })}</g>`;
    const mi = I(v, "mirror");
    const bLean = [-lean, 0, -lean * 0.5, -lean][mi] * (mi === 0 ? -1 : 1);
    const cue = I(v, "cue");
    const bubbles = k.bubble({ x: ax, y: 26, w: 44, h: 18, text: cue === 0 ? "..." : "", tail: 0, size: 9 }).replace(/<g>/, `<g opacity="${cue === 0 ? 1 : 0.25}">`) + k.bubble({ x: bx, y: 26, w: 44, h: 18, text: cue === 1 ? "..." : "", tail: 0, size: 9 }).replace(/<g>/, `<g opacity="${cue === 1 ? 1 : 0.25}">`) + (cue === 2 ? S(k, 160, 30, "(silence)", "#ffd166") : "");
    const rs = (v.n("reactSeconds") / 5) * 100;
    const bg = v("biggest");
    return (
      k.bg(BG) +
      k.floor(y, "#26221e") +
      ghosts +
      `<g transform="translate(${ax} 0) scale(${r1(Math.max(0.35, Math.cos((turned * Math.PI) / 360)))} 1) translate(${-ax} 0)">${k.person({ x: ax, y, s: 1, lean, arms: -0.9 + dir * 1.6, look: turned > 90 ? -1 : 1, mood: dir - 0.5, color: "#4a6fa5" })}</g>` +
      k.person({ x: bx, y, s: 1, lean: bLean, look: -1, color: "#a55a4a" }) +
      bubbles +
      S(k, 290, 60, "biggest:", "#888", "end", 7) +
      S(k, 290, 72, bg, "#ffd166", "end", 9) +
      `<line x1="40" y1="160" x2="${r1(40 + rs)}" y2="160" stroke="#ffd166" stroke-width="2"/>` +
      S(k, 46 + rs, 163, `shifts ${v.n("reactSeconds")} s after the line`, "#aaa", "start", 7) +
      k.caption(`${n} shifts · ${v("direction")} · ${v("mirror")} mirror`)
    );
  });

  /* ---------------- settingMood: the place around the character ---------------- */
  const PLACE = ["#3b2f3a", "#5a6470", "#9a9a8c", "#c69a6a", "#f2c46e"];
  W.look("settingMood", (v, k) => {
    const si = I(v, "setting");
    const col = PLACE[si];
    const w = v("weather");
    let wx = "";
    if (w === "clear") wx = k.dot({ x: 280, y: 26, r: 12, color: "#ffd166" });
    if (w === "grey" || w === "rain" || w === "storm") wx = `<ellipse cx="80" cy="18" rx="60" ry="14" fill="#6b6f78"/><ellipse cx="230" cy="20" rx="70" ry="14" fill="#6b6f78"/>`;
    if (w === "rain" || w === "storm") for (let i = 0; i < 30; i++) wx += `<line x1="${(i * 37) % 320}" y1="${(i * 23) % 120 + 30}" x2="${((i * 37) % 320) - 4}" y2="${(i * 23) % 120 + 40}" stroke="#9fc4e8" opacity="0.6"/>`;
    if (w === "storm") wx += `<path d="M200 30 l-10 24 h10 l-8 22" stroke="#fff27a" stroke-width="2.5" fill="none"/>`;
    if (w === "snow") for (let i = 0; i < 30; i++) wx += k.dot({ x: (i * 41) % 320, y: ((i * 29) % 130) + 10, r: 2, color: "#fff" });
    const crowdN = [0, 3, 7, 12][I(v, "crowd")];
    let crowd = "";
    for (let i = 0; i < crowdN; i++) crowd += k.person({ x: 20 + ((i * 53) % 290), y: 128 - (i % 3) * 4, s: 0.42, color: "#555a66", alpha: 0.8 });
    const pplN = Math.round((v.n("people") / 500) * 40);
    let far = "";
    for (let i = 0; i < pplN; i++) far += k.dot({ x: 10 + ((i * 29) % 300), y: 102 + (i % 4) * 3, r: 1.6, color: "#222" });
    const intr = v.n("intrude") / 5;
    let props = "";
    for (let i = 0; i < 3; i++) props += `<rect x="${30 + i * 100}" y="${70 - i * 6}" width="${r1(14 + intr * 16)}" height="${r1(20 + intr * 16)}" fill="${k.mix("#555555", "#ff7a59", intr)}" opacity="${r1(0.4 + intr * 0.6)}"/>`;
    const pf = v.n("placeInFrame") / 100;
    const ps = 2.2 - pf * 1.6;
    const ag = I(v, "agrees");
    const placeMood = (si - 2) / 2;
    const charMood = ag === 2 ? placeMood : ag === 0 ? -placeMood - 0.4 : 0;
    const loud = (v.n("loudness") - 20) / 80;
    return (
      `<rect x="0" y="0" width="320" height="180" fill="${col}"/>` +
      `<rect x="0" y="110" width="320" height="70" fill="${k.mix(col, "#000000", 0.35)}"/>` +
      far +
      props +
      wx +
      crowd +
      k.person({ x: 160, y: 158, s: ps, mood: charMood, color: "#4a6fa5" }) +
      k.speaker({ x: 290, y: 140, s: 0.8, level: loud }) +
      S(k, 290, 160, `${v.n("loudness")} dB`, "#fff", "middle", 7) +
      k.caption(`${v("setting")} place · ${w} · it ${v("agrees")}`)
    );
  });

  /* ---------------- lightingMood: a face in the scene's light ---------------- */
  W.look("lightingMood", (v, k) => {
    const st = v.p("setting");
    const warm = (v.p("warmth") - 0.5) * 2;
    const sh = v.p("shadows");
    const con = (v.n("contrast") - 1) / 15;
    const share = v.n("shadowShare") / 100;
    const base = k.mix("#1f1f2e", "#f2d9a0", st);
    const fx = 140;
    const fy = 70;
    const shadowSide = `<path d="M${fx} ${fy - 40} A40 40 0 0 1 ${fx} ${fy + 40} Z" fill="#000" opacity="${r1((0.1 + sh * 0.7) * 100) / 100}"/>`;
    const b = { x: 210, y: 112, w: 96, h: 40 };
    const si = I(v, "shift");
    const at = v.n("shiftAt") / 100;
    const ramp = 0.01 + (v.n("shiftSeconds") / 60) * 0.4;
    const f = (t) => (si === 0 ? 0.5 : si === 1 ? 0.3 + t * 0.4 : 0.3 + 0.4 * cl((t - at + ramp / 2) / ramp, 0, 1));
    return (
      k.bg(base) +
      `<rect x="0" y="${r1(180 - share * 180)}" width="320" height="${r1(share * 180)}" fill="#000" opacity="0.45"/>` +
      k.face({ x: fx, y: fy, r: 40, mood: st - 0.5 }) +
      shadowSide +
      k.grade({ warm, bright: 0.3 + st * 0.4, contrast: 0.3 + con * 0.7 }) +
      box(k, b, "light over the scene") +
      line(k, b, f, { color: "#ffd166", w: 2 }) +
      vline(k, b, at, "#fff") +
      S(k, b.x + b.w, b.y + b.h + 9, `change takes ${v.n("shiftSeconds")} s`, "#fff", "end", 7) +
      S(k, 20, 150, `${v.n("contrast")} stops · ${v.n("shadowShare")}% in shadow`, "#fff", "start", 8) +
      k.caption(`${v("setting")} · ${v("warmth")} · ${v("shadows")} shadows`)
    );
  });

  /* ---------------- emoEyes: a close-up of the eyes ---------------- */
  W.look("emoEyes", (v, k) => {
    const lk = v("look");
    const wide = v.p("wide");
    const eh = 8 + wide * 16;
    const lid = v.n("blinks") / 5;
    const off = v.n("offAngle") / 90;
    const ud = v.n("upDown") / 45;
    const base = { down: [0, 0.8], away: [-0.9, 0], "at the other": [0.8, 0], "through the other": [0.6, -0.1], "at the camera": [0, 0] }[lk] || [0, 0];
    const dx = cl(base[0] + off * 0.6, -1, 1) * 14;
    const dy = cl(base[1] - ud * 0.8, -1, 1) * (eh * 0.6);
    const wet = I(v, "wet");
    const dart = v.n("dart");
    const ag = I(v, "agree");
    let eyes = "";
    [110, 210].forEach((ex) => {
      const ey = 74;
      eyes += `<ellipse cx="${ex}" cy="${ey}" rx="34" ry="${r1(eh)}" fill="#fff" stroke="${ink}" stroke-width="2.5"/>`;
      eyes += `<circle cx="${r1(ex + dx)}" cy="${r1(ey + dy)}" r="${r1(Math.min(eh, 11))}" fill="#4a3a2a"/><circle cx="${r1(ex + dx)}" cy="${r1(ey + dy)}" r="${r1(Math.min(eh, 11) * (lk === "through the other" ? 0.8 : 0.45))}" fill="${ink}"/>`;
      if (wet >= 1) eyes += `<circle cx="${r1(ex + dx + 4)}" cy="${r1(ey + dy - 4)}" r="2.5" fill="#fff"/>`;
      if (wet >= 2) eyes += `<path d="M${ex + 20} ${r1(ey + eh - 1)} q-3 6 0 9 q3 -3 0 -9" fill="#7fc4ff"/>`;
      if (wet === 3) eyes += `<line x1="${ex + 20}" y1="${r1(ey + eh + 8)}" x2="${ex + 22}" y2="150" stroke="#7fc4ff" stroke-width="2.5"/>`;
      eyes += `<rect x="${ex - 36}" y="${r1(ey - eh - 2)}" width="72" height="${r1(lid * eh)}" fill="#e4b98f"/>`;
      for (let i = 0; i < dart; i++) eyes += `<line x1="${r1(ex - 16 + i * 8)}" y1="${r1(ey - eh - 6)}" x2="${r1(ex - 12 + i * 8)}" y2="${r1(ey - eh - 10)}" stroke="#ffd166" stroke-width="1.5"/>`;
      const bt = [-0.6, 0, 0.8][ag];
      eyes += `<line x1="${ex - 28}" y1="${r1(ey - eh - 14 - bt * 4)}" x2="${ex + 28}" y2="${r1(ey - eh - 14 + bt * 4 * (ex < 160 ? -1 : 1))}" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
    });
    const hold = (v.n("holdGaze") / 10) * 120;
    const rate = Math.round(v.n("blinkRate") / 2);
    return (
      `<rect x="0" y="0" width="320" height="180" fill="#e4b98f"/>` +
      eyes +
      k.bubble({ x: 160, y: 126, w: 96, h: 20, text: "I'm happy.", tail: 0, size: 9 }) +
      `<rect x="20" y="146" width="${r1(Math.max(1, hold))}" height="4" fill="#4a6fa5"/>` +
      S(k, 20, 158, `holds a look ${v.n("holdGaze")} s`, ink, "start", 7) +
      ticks(k, 200, 158, rate, { gap: 3.5, h: () => 6, color: ink, w: 1.2 }) +
      S(k, 300, 146, `${v.n("blinkRate")} blinks/min`, ink, "end", 7) +
      k.caption(`Looking ${lk} · ${v("wet")} · eyes ${v("agree")} the words`)
    );
  });

  /* ---------------- emoHands: hands doing the feeling ---------------- */
  W.look("emoHands", (v, k) => {
    const d = v("doing");
    const tens = v.n("tension") / 5;
    const fx = 90;
    const fy = 44;
    const dist = (v.n("fromFace") / 80) * 90;
    let hx = fx + 30;
    let hy = fy + 26 + dist;
    if (d === "touch the face") (hx = fx + 14), (hy = fy + 14 + dist * 0.3);
    if (d === "reach out") (hx = fx + 110), (hy = fy + 30 + dist * 0.5);
    if (d === "hide") hx = fx - 40;
    const open = d === "clench" ? 0 : cl(1 - tens * 0.7, 0, 1);
    const q = v.n("quick") / 5;
    let speed = "";
    for (let i = 0; i < Math.round(q * 4); i++) speed += `<line x1="${r1(hx - 24 - i * 3)}" y1="${r1(hy - 10 + i * 5)}" x2="${r1(hx - 34 - q * 20 - i * 3)}" y2="${r1(hy - 10 + i * 5)}" stroke="#fff" opacity="0.6"/>`;
    let shake = "";
    if (d === "fidget" || tens > 0.6) for (let i = 0; i < 3; i++) shake += `<path d="M${hx + 22} ${hy - 12 + i * 8} q3 -3 6 0" stroke="#ffd166" fill="none"/>`;
    const ti = I(v, "touches");
    const thing = ["", "", `<rect x="${r1(hx + 18)}" y="${r1(hy - 6)}" width="14" height="16" rx="2" fill="#e8e4da" stroke="${ink}"/>`, k.hand({ x: Math.min(300, hx + 46), y: hy, s: 0.9, open: 0.8 })][ti] + (ti === 1 ? `<rect x="${r1(hx - 20)}" y="${r1(hy + 16)}" width="40" height="10" rx="5" fill="#4a6fa5"/>` : "");
    const fr = I(v, "framed");
    const frame = [{ x: 140, y: 10, w: 170, h: 120 }, { x: 20, y: 6, w: 290, h: 150 }, { x: hx - 34, y: hy - 34, w: 68, h: 64 }][fr];
    const g = v.n("gestures");
    const share = v.n("inFrame") / 100;
    return (
      k.bg(BG) +
      k.face({ x: fx, y: fy, r: 24, mood: -tens * 0.6 }) +
      `<rect x="${fx - 18}" y="${fy + 24}" width="36" height="70" rx="8" fill="#4a6fa5"/>` +
      `<g opacity="${d === "hide" ? 0.3 : 1}">${k.hand({ x: hx, y: hy, s: 1, open })}</g>` +
      `<rect x="${r1(hx - 15)}" y="${r1(hy - 4)}" width="30" height="24" rx="6" fill="#ff5a3c" opacity="${r1(tens * 0.4 * 100) / 100}"/>` +
      thing +
      speed +
      shake +
      k.frame({ x: frame.x, y: frame.y, w: frame.w, h: frame.h, color: "#ffd166", dash: "5 3" }) +
      S(k, 300, 20, `${v("framed")}`, "#ffd166", "end", 7) +
      `<line x1="${fx + 40}" y1="${fy}" x2="${fx + 40}" y2="${r1(fy + 26 + dist)}" stroke="#888" stroke-dasharray="2 2"/>` +
      S(k, fx + 44, fy + 12, `${v.n("fromFace")} cm`, "#aaa", "start", 7) +
      ticks(k, 200, 150, Math.round(g / 2), { gap: 5, color: "#ffd166", w: 2 }) +
      S(k, 200, 160, `${g} gestures a minute`, "#aaa", "start", 7) +
      `<rect x="20" y="152" width="120" height="6" fill="#333"/><rect x="20" y="152" width="${r1(Math.max(1, share * 120))}" height="6" fill="#9fd3ff"/>` +
      k.caption(`${d} · touching ${v("touches")} · tension ${v.n("tension")} of 5`)
    );
  });

  /* ---------------- a dot grid (pad) for two settings that pair naturally, on each curiosity that had none ---------------- */
  [
    ["stakes", "size", "care", "How much is at stake", "How much we care"],
    ["emoRoadFilm", "peakPlace", "height", "Where the peak falls", "How high or low"],
    ["emoTurn", "when", "turnSize", "When it turns", "How far it turns"],
    ["emoRelease", "releaseAt", "size", "When it comes", "How big"],
    ["catharsis", "placed", "size", "Where in the film", "How much is let go"],
    ["falseHigh", "placed", "size", "Where in the film", "How convincing"],
    ["twoRoads", "crossAt", "gap", "Where they cross", "How far apart"],
    ["emoActions", "reach", "count", "How far it reaches", "Actions this scene"],
    ["emoContrastPrev", "linger", "jolt", "Old feeling lingers", "Jolt to us"],
    ["emoShown", "dropAt", "maskOff", "When the mask drops", "Seconds it stays off"],
    ["subtext", "hiddenShare", "pauseBefore", "Lines with hidden meaning", "Pause before the line"],
    ["emotionalDebt", "dueAt", "held", "When it comes due", "How much held in"],
    ["feelingEcho", "seeded", "strength", "How strongly planted", "How strong the echo"],
    ["emoVoice", "wordsPerMinute", "louder", "Words a minute", "Louder or quieter"],
    ["wordsAmount", "mainShare", "wordCount", "Main character's share", "Words in the scene"],
    ["emoSpread", "radius", "reached", "How far it travels", "People it reaches"],
    ["mixedFeelings", "secondAt", "secondShare", "When the second appears", "Share of the second"],
    ["breather", "length", "quieter", "How long", "Quieter than before"],
    ["emoMove", "metersCovered", "closerBy", "Distance covered", "Closer or farther"],
    ["movementAmount", "movingShare", "peopleMoving", "Share of the scene moving", "People moving"],
    ["settingMood", "placeInFrame", "loudness", "How much is the place", "How loud"],
    ["lightingMood", "contrast", "shadowShare", "Bright to dark difference", "Share in shadow"],
    ["emoHands", "fromFace", "tension", "Distance from the face", "Tension"],
  ].forEach(([id, x, y, xLabel, yLabel]) => {
    const spec = W.get && W.get(id);
    if (spec && (spec.faces || []).some((f) => f.face === "pad")) return;
    W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  });

  /* ---------- Face and feelings: one face mixing six feelings, and where the eyes look ---------- */
  const FEELS = [["happy", "😊", "#ffd166"], ["sad", "😢", "#5a7bb5"], ["angry", "😠", "#d9483b"], ["scared", "😨", "#6b5aa8"], ["surprised", "😮", "#6fd3c4"], ["disgust", "🤢", "#7fae4a"]];
  W.look("feelingFaceLens", (v, k) => {
    const a = {};
    FEELS.forEach(([id]) => (a[id] = v.p(id)));
    const mood = cl(a.happy - a.sad - a.angry * 0.5 - a.scared * 0.3 - a.disgust * 0.4, -1, 1);
    const brows = cl(a.surprised * 0.9 + a.scared * 0.6 + a.sad * 0.3 + a.happy * 0.1 - a.angry * 0.9 - a.disgust * 0.3, -1, 1);
    const eyes = cl(0.75 + a.surprised * 0.25 + a.scared * 0.25 - a.angry * 0.35 - a.happy * 0.15 - a.disgust * 0.2, 0.1, 1);
    const mouth = cl(a.surprised * 0.9 + a.scared * 0.5 + a.angry * 0.2, 0, 1);
    const lk = String(v("look"));
    const look = lk === "left" ? -1 : lk === "right" ? 1 : 0;
    const top = FEELS.slice().sort((x, y) => a[y[0]] - a[x[0]])[0];
    let s = k.bg("#141418") + `<rect x="6" y="6" width="198" height="150" rx="4" fill="${top && a[top[0]] > 0 ? top[2] : "#2a2f3a"}" opacity="0.18"/>`;
    s += k.face({ x: 96, y: 80 + (lk === "down" ? 4 : lk === "up" ? -4 : 0), r: 50, mood, brows, eyes, mouth, look });
    if (a.scared > 0) s += `<path d="M${r1(140)} ${r1(50)} q4 8 0 12 q-4 -4 0 -12" fill="#6ec3ff" opacity="${r1(0.3 + a.scared * 0.7)}"/>`;
    if (a.disgust > 0) s += `<path d="M84 ${r1(84)} q6 -${r1(3 + a.disgust * 4)} 12 0 q6 -${r1(3 + a.disgust * 4)} 12 0" fill="none" stroke="#1c1712" stroke-width="1.5" opacity="${r1(0.3 + a.disgust * 0.7)}"/>`;
    /* Where the eyes look. */
    const D = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[lk];
    if (D) s += k.arrow({ x1: 96 + D[0] * 58, y1: 70 + D[1] * 58, x2: 96 + D[0] * 80, y2: 70 + D[1] * 68, color: "#ffd166", w: 2 });
    if (lk === "at the camera") s += k.cam({ x: 180, y: 140, dir: 200, s: 0.55, color: "#ffd166" });
    s += S(k, 10, 18, `eyes: ${lk}`, "#ffd166", "start", 8);
    /* The mix as six upright bars. */
    s += `<rect x="214" y="6" width="102" height="152" rx="6" fill="#1d1d22" stroke="#444"/>` + S(k, 265, 18, "the mix", "#999", "middle", 7.5);
    FEELS.forEach(([id, icon, col], i) => {
      const h = 4 + a[id] * 90;
      s += `<rect x="${222 + i * 15}" y="${r1(130 - h)}" width="11" height="${r1(h)}" rx="2" fill="${col}" opacity="${r1(0.35 + a[id] * 0.65)}"/>` + k.label({ x: 227.5 + i * 15, y: 146, text: icon, size: 9 });
    });
    const shown = FEELS.filter(([id]) => a[id] > 0).map(([id]) => `${v(id)} ${id === "disgust" ? "disgusted" : id}`);
    return s + k.caption(shown.length ? shown.join(", ") : "no feeling showing yet");
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
