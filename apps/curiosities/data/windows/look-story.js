/* Story: the live picture at the top of each story curiosity's window (CuriosityWindows.look). Story ideas are
   drawn as simple diagrams a beginner can read: arcs and paths, people closer or apart, a clock, a timeline of
   the scene with a "when" marker, a stopwatch for how long something takes, and little counters (dots, hearts,
   watchers) for how many. Decisions are listed in the window notes (look-story decisions) for Jeremy to review. */
(function (W) {
  /* The bottom caption, its words shrunk (and at worst cut) so a long one never runs off the picture. */
  const fitCap = (k, text) => {
    let t = String(text);
    if (t.length > 74) t = t.slice(0, 73) + "…";
    const sz = Math.round(Math.max(7.5, Math.min(10, 570 / Math.max(1, t.length))) * 10) / 10;
    return k.caption(t).replace('font-size="10"', `font-size="${sz}"`);
  };
  /* ---------- shared drawing for story pictures ---------- */
  const BG = "#15151b";
  const HERO = "#4a6fa5";
  const GOLD = "#ffd166";
  const RED = "#e2574c";
  const GREEN = "#6cc58a";
  const r1 = (n) => Math.round(n * 10) / 10;
  /* A scene timeline: a thin bar with a marker at p (0 = start of the scene, 1 = end). */
  const when = (k, p, text, o) => {
    o = o || {};
    const x = o.x == null ? 10 : o.x;
    const y = o.y == null ? 150 : o.y;
    const w = o.w || 130;
    const mx = x + k.clamp(p, 0, 1) * w;
    return `<rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="#3a3a44"/><rect x="${x}" y="${y}" width="${r1(mx - x)}" height="4" rx="2" fill="#6a6a7a"/><circle cx="${r1(mx)}" cy="${y + 2}" r="4" fill="${o.color || GOLD}" stroke="#15151b"/>${k.label({ x, y: y - 5, text, size: 8, anchor: "start", color: "#aaa" })}`;
  };
  /* A stopwatch: a pie filling up with the seconds, and the seconds written beside it. */
  const watch = (k, x, y, sec, max, text) => `${k.pie({ x, y, r: 9, p: k.clamp(sec / max, 0, 1), color: "#9fd3ff" })}<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#888"/><rect x="${x - 2}" y="${y - 13}" width="4" height="3" fill="#888"/>${k.label({ x: x + 13, y: y + 3, text, size: 8, anchor: "start", color: "#ccc" })}`;
  const secs = (s) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? " " + (s % 60) + " s" : ""}` : `${s} s`);
  const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}` : `${m} min`);
  /* n little dots in a row (wrapping), for counts. */
  const pips = (k, n, x, y, color, per) => {
    per = per || 10;
    let s = "";
    for (let i = 0; i < n; i++) s += k.dot({ x: x + (i % per) * 7, y: y + Math.floor(i / per) * 7, r: 2.4, color: color || GOLD });
    return s;
  };
  /* Hearts: how much we root for or hope for someone (0 to 5), full ones bright, the rest grey. */
  const hearts = (k, n, x, y, text) => {
    let s = "";
    for (let i = 0; i < 5; i++) s += k.text({ x: x + i * 11, y, text: "♥", size: 11, color: i < n ? "#ff6b8a" : "#444" });
    return s + (text ? k.label({ x: x - 6, y: y, text, size: 8, anchor: "end", color: "#aaa" }) : "");
  };
  /* Small watching faces: who sees something. */
  const watchers = (k, n, x, y, mood) => {
    let s = "";
    for (let i = 0; i < n; i++) s += k.face({ x: x + i * 13, y, r: 5.5, mood: mood == null ? 0 : mood, eyes: 1, color: "#d8b48c" });
    return s;
  };
  /* A small tag: a word in a rounded box. */
  const tag = (k, x, y, text, color, anchor) => {
    const w = String(text).length * 4.6 + 10;
    const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
    return `<rect x="${r1(left)}" y="${y - 9}" width="${r1(w)}" height="13" rx="6" fill="${color || "#2c2c36"}" stroke="#555"/>${k.label({ x: left + w / 2, y: y + 1, text, size: 8, color: "#eee" })}`;
  };
  /* A row of tiny people (for groups and crowds). */
  const crowd = (k, n, x, y, o) => {
    o = o || {};
    let s = "";
    const gap = o.gap == null ? 14 : o.gap;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / (o.per || 8));
      const col = i % (o.per || 8);
      s += k.person({ x: x + col * gap + (row % 2) * gap * 0.5, y: y - row * 10, s: o.s || 0.32, color: typeof o.color === "function" ? o.color(i) : o.color || "#777", mood: o.mood || 0, look: o.look || 0, lean: typeof o.lean === "function" ? o.lean(i) : o.lean || 0 });
    }
    return s;
  };
  /* A ladder of words with one lit (for ordered choices shown as steps). */
  const steps = (k, list, i, x, y, color) => list.map((t, j) => k.label({ x, y: y + j * 10, text: (j === i ? "▸ " : "  ") + t, size: 8, anchor: "start", color: j === i ? color || GOLD : "#666", weight: j === i ? 700 : null })).join("");
  const idx = (v, id) => {
    const s = v.slider(id);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.indexOf(v(id))) : 0;
  };
  const sc = (v, id) => (v.slider(id) && v.slider(id).scale) || [];

  /* ---------- arcs and change ---------- */

  /* Arc stage: the five stages of an arc as a path (want, doubt, crisis, choice, change); the person stands in
     the lit stage at its progress, a dashed line marks where they tip into the next. */
  W.look("arcStage", (v, k) => {
    const st = idx(v, "setting");
    const names = ["want", "doubt", "crisis", "choice", "change"];
    const ys = [80, 98, 122, 92, 52];
    const lenP = v.p("stageLength");
    /* The lit stage grows wider the longer it lasts. */
    const base = 48;
    const wide = base + lenP * 50;
    const ws = names.map((_, i) => (i === st ? wide : (300 - wide) / 4));
    let x = 10;
    const xs = ws.map((w) => { const a = x; x += w; return a; });
    const yAt = (i, t) => k.lerp(ys[i], ys[Math.min(4, i + 1)], t);
    let path = "";
    names.forEach((n, i) => {
      path += `<rect x="${r1(xs[i])}" y="26" width="${r1(ws[i] - 2)}" height="110" fill="${i === st ? "#262634" : "#1b1b22"}"/>`;
      path += k.label({ x: xs[i] + ws[i] / 2, y: 36, text: n, size: 9, color: i === st ? GOLD : "#777", weight: i === st ? 700 : null });
    });
    const pts = [];
    names.forEach((_, i) => { for (let t = 0; t <= 1; t += 0.25) pts.push(`${r1(xs[i] + t * ws[i])},${r1(yAt(i, t))}`); });
    path += `<polyline points="${pts.join(" ")}" fill="none" stroke="#8fb2d8" stroke-width="2.5"/>`;
    const pr = v.p("progress");
    const tip = v.p("tipPoint");
    const px = k.clamp(xs[st] + pr * ws[st], xs[st] + 8, xs[st] + ws[st] - 8);
    /* a face along the line in every other stage, showing how that stage feels */
    const moods = [0.5, -0.2, -0.8, 0.1, 0.8];
    let faces = "";
    names.forEach((_, i) => { if (i !== st) faces += k.face({ x: r1(xs[i] + ws[i] / 2), y: r1(Math.max(50, yAt(i, 0.5) - 12)), r: 6, mood: moods[i], eyes: 1, color: "#d8b48c" }); });
    const tx = xs[st] + tip * ws[st];
    path += `<line x1="${r1(tx)}" y1="44" x2="${r1(tx)}" y2="134" stroke="${RED}" stroke-dasharray="3 3"/>${k.label({ x: tx, y: 132, text: "tips", size: 7, color: RED })}`;
    /* Moments that show the stage: dots along its stretch. */
    const m = v.n("stageMoments");
    for (let i = 0; i < m; i++) { const t = (i + 0.5) / Math.max(1, m); path += k.dot({ x: xs[st] + t * ws[st], y: yAt(st, t) + 8, r: 2.2, color: GOLD }); }
    const who = v("arcOf");
    const col = /villain/.test(who) ? "#a33" : /side/.test(who) ? "#7a8a5a" : HERO;
    const fig = /couple/.test(who) ? k.person({ x: px - 5, y: yAt(st, pr) - 2, s: 0.34, color: col }) + k.person({ x: px + 5, y: yAt(st, pr) - 2, s: 0.34, color: "#a56a8a" }) : /group/.test(who) ? crowd(k, 3, px - 9, yAt(st, pr) - 2, { gap: 9, s: 0.3, color: col }) : k.person({ x: px, y: yAt(st, pr) - 2, s: 0.4, color: col, mood: st === 2 ? -0.7 : st === 4 ? 0.7 : 0 });
    /* Seen coming: an eye ahead of them, further ahead the more the audience knows. */
    const seen = v.p("seenComing");
    const ey = Math.max(46, yAt(st, pr) - 34);
    const eye = `${k.arrow({ x1: px + 4, y1: ey, x2: px + 8 + seen * 40, y2: ey, color: "#9fd3ff", w: 1.2 })}`;
    return `${k.bg(BG)}${k.title(`Arc of ${who}`)}${path}${faces}${eye}${fig}${hearts(k, v.n("rootingFor"), 262, 14, "rooting")}${watch(k, 236, 152, v.n("turnSeconds"), 120, `turn ${secs(v.n("turnSeconds"))}`)}${k.label({ x: 10, y: 150, text: `stage lasts ${v("stageLength")}`, size: 8, anchor: "start", color: "#aaa" })}${k.label({ x: 10, y: 160, text: `\u{1F441} ${v("seenComing")}`, size: 8, anchor: "start", color: "#9fd3ff" })}${fitCap(k, `${v("setting")}: ${Math.round(pr * 100)}% through, tips at ${Math.round(tip * 100)}%`)}`;
  });

  /* Arc direction: a line from who they were to who they become, rising (grows) or falling (falls); its shape
     is the pace, its end goes foggy when we can't tell where it ends, hearts are hope. */
  W.look("arcDirection", (v, k) => {
    const dir = v.is("direction", /grows/) ? 1 : v.is("direction", /falls/) ? -1 : 0;
    const size = v.n("size") / 5;
    const pace = idx(v, "pace");
    const y0 = 92;
    const y1 = y0 - dir * (8 + size * 52);
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const f = [t * 0.2, Math.pow(t, 2.4), t, Math.pow(t, 0.45), t < 0.6 ? 0 : 1][pace];
      pts.push(`${r1(40 + t * 200)},${r1(k.lerp(y0, y1, f))}`);
    }
    const cert = v.p("certainty");
    const endFog = cert < 1 ? k.ring({ x: 240, y: y1, r: 8 + (1 - cert) * 18, color: "#999", w: 1, dash: "2 3" }) + k.text({ x: 240 + 12 + (1 - cert) * 18, y: y1 - 6, text: "?".repeat(Math.round((1 - cert) * 3)), size: 10, color: "#999" }) : "";
    const span = v.n("arcSpan");
    let ticks = "";
    const nt = Math.min(30, Math.max(1, Math.round(span / 2)));
    for (let i = 0; i <= nt; i++) ticks += `<line x1="${r1(40 + (i / nt) * 200)}" y1="140" x2="${r1(40 + (i / nt) * 200)}" y2="144" stroke="#666"/>`;
    /* Changes others: little people around the end turning the hero's color. */
    const others = idx(v, "flatChangesOthers");
    const ring = [0, 2, 5][others];
    let around = "";
    for (let i = 0; i < 5; i++) around += k.person({ x: 268 + (i % 3) * 16, y: 70 + Math.floor(i / 3) * 34, s: 0.28, color: i < ring ? GREEN : "#555", mood: i < ring ? 0.6 : 0 });
    const endMood = dir * 0.8;
    return `${k.bg(BG)}${k.title("Where the arc heads")}<line x1="40" y1="140" x2="240" y2="140" stroke="#666"/>${ticks}${k.label({ x: 140, y: 154, text: `over ${span} scene${span === 1 ? "" : "s"} · ${v("pace")} · ends: ${v("certainty")}`, size: 8, color: "#aaa" })}<polyline points="${pts.join(" ")}" fill="none" stroke="${dir > 0 ? GREEN : dir < 0 ? RED : "#aaa"}" stroke-width="3"/>${k.person({ x: 40, y: y0 + 18, s: 0.36, color: HERO })}${k.label({ x: 40, y: y0 + 30, text: "start", size: 7, color: "#aaa" })}${k.person({ x: 240, y: y1 + 18, s: 0.36, color: HERO, mood: endMood, alpha: 0.4 + cert * 0.6 })}${endFog}${around}${k.label({ x: 284, y: 130, text: "others", size: 7, color: "#888" })}${hearts(k, v.n("hope"), 262, 14, "hope")}${fitCap(k, `${v("direction")} · compared with ${v("comparedWith")}`)}`;
  });

  /* Want and need: a gold star on a post (what they want) and a heart (what they need); the further apart they
     sit the bigger the gap; the person runs at the star and may or may not look at the heart. */
  W.look("plotWant", (v, k) => {
    const gapP = v.p("gap");
    const wx = 262;
    const wy = 62;
    const needX = r1(k.lerp(226, 176, gapP));
    const ny = r1(k.lerp(108, 116, gapP));
    const chase = v.n("chase") / 5;
    const px = 50 + chase * 40;
    const py = 132;
    const sees = idx(v, "sees");
    const cost = idx(v, "needCost");
    const hs = 16 + cost * 5;
    const sight = sees === 0 ? "" : `<line x1="${r1(px + 4)}" y1="${py - 40}" x2="${r1(needX - 8)}" y2="${r1(ny - hs * 0.4)}" stroke="#ff8fab" stroke-width="1.4" ${sees === 1 ? 'stroke-dasharray="3 4"' : ""}/>`;
    const clarity = 0.3 + v.p("wantShown") * 0.7;
    const trend = idx(v, "gapCloses");
    const tWord = ["gap widening", "gap holds", "gap closing"][trend];
    const speed = chase > 0 ? [0, 1, 2].map((i) => `<line x1="${r1(px - 14 - i * 3)}" y1="${py - 30 + i * 8}" x2="${r1(px - 14 - i * 3 - chase * 18)}" y2="${py - 30 + i * 8}" stroke="#aaa" stroke-width="1.5"/>`).join("") : "";
    const post = `<line x1="${wx}" y1="${wy}" x2="${wx}" y2="${py}" stroke="#665a3a" stroke-width="3"/>`;
    return `${k.bg(BG)}${k.floor(py, "#22201c")}${k.title("What they want vs what they need")}${post}${k.text({ x: wx, y: wy + 8, text: "★", size: 30, color: GOLD, alpha: clarity })}${k.label({ x: wx, y: wy - 20, text: `WANT (${v("wantShown")})`, size: 8, color: GOLD })}<line x1="${wx}" y1="${wy + 10}" x2="${needX}" y2="${r1(ny - hs * 0.4)}" stroke="#666" stroke-dasharray="2 3"/>${k.text({ x: needX, y: ny, text: "♥", size: hs, color: "#ff8fab" })}${k.fitText({ x: needX, y: ny + 12, text: `NEED: costs ${v("needCost")}`, size: 8, min: 6, w: 120, color: "#ff8fab" })}${k.label({ x: 310, y: 154, text: tWord, size: 8, anchor: "end", color: trend === 2 ? GREEN : trend === 0 ? RED : "#aaa" })}${k.arrow({ x1: px + 12, y1: py - 36, x2: wx - 18, y2: wy, color: GOLD, w: 1 + chase * 3 })}${sight}${speed}${k.person({ x: px, y: py, s: 0.5, color: HERO, lean: chase * 18, walk: chase, look: 1, eyes: sees === 0 ? 0.1 : 0.9 })}${pips(k, v.n("wantMentions"), 10, 30, GOLD)}${k.label({ x: 10, y: 24, text: `want said ${v.n("wantMentions")}×`, size: 8, anchor: "start", color: "#aaa" })}${when(k, v.p("needShownAt"), "need shows", { x: 10, y: 150, w: 120 })}${fitCap(k, `Want and need: ${v("gap")} · ${v("sees")} · gap ${v("gapCloses")}`)}`;
  });

  /* Arc test: the old temptation behind them, a hurdle ahead; result puts them past it, on it, or back. */
  W.look("arcTest", (v, k) => {
    const size = v.n("size") / 5;
    const res = idx(v, "result");
    const hx = 190;
    const hh = 12 + size * 60;
    const hurdle = `<rect x="${hx - 6}" y="${r1(130 - hh)}" width="12" height="${r1(hh)}" fill="#8a6a4a" stroke="#1c1712"/>`;
    const px = [120, hx - 14, 240][res];
    const near = v.n("temptNear");
    const tx = Math.max(16, px - 32 - near * 4.5);
    const tName = v("temptation");
    const temp = `${k.text({ x: tx, y: 112, text: "✦", size: 20, color: "#d58cff" })}${k.label({ x: tx, y: 124, text: tName, size: 8, color: "#d58cff" })}${k.arrow({ x1: px - 10, y1: 100, x2: tx + 12, y2: 104, color: "#d58cff", w: 1.2 })}`;
    /* Echo: a faint ghost of them from the earlier moment, clearer when it echoes exactly. */
    const echo = idx(v, "echo");
    const gx = Math.max(30, 110 - (v.n("echoGap") / 180) * 80);
    const ghost = echo ? k.person({ x: gx, y: 70, s: 0.42, color: "#888", alpha: echo === 2 ? 0.7 : 0.3 }) + k.label({ x: gx, y: 80, text: `${mins(v.n("echoGap"))} ago`, size: 7, color: "#888" }) : k.label({ x: gx, y: 70, text: "(no echo)", size: 7, color: "#555" });
    const wit = [0, 1, 3, 6][idx(v, "witnessed")];
    return `${k.bg(BG)}${k.title(`The test: ${v("result")}`)}${k.floor(130, "#2a2620")}${hurdle}${temp}${ghost}${k.person({ x: px, y: 130, s: 0.7, color: HERO, mood: [-0.7, -0.2, 0.7][res], lean: [-10, 0, 8][res] })}${watchers(k, wit, 236, 30, 0)}${k.label({ x: 310, y: 46, text: `seen by ${v("witnessed")}`, size: 7, anchor: "end", color: "#aaa" })}${watch(k, 168, 152, v.n("hesitation"), 30, `hesitates ${v.n("hesitation")} s`)}${when(k, v.p("testAt"), "test comes", { w: 130 })}${fitCap(k, `Size ${v.n("size")}/5 · tempted by ${tName}, ${near} m away`)}`;
  });

  /* Relapse: stairs they climbed since they began to change; they slide back down some, for a while. */
  W.look("relapse", (v, k) => {
    const climbed = 2 + Math.round((v.n("sinceChange") / 120) * 5);
    let st = "";
    for (let i = 0; i < climbed; i++) st += `<rect x="${30 + i * 26}" y="${130 - (i + 1) * 12}" width="26" height="${(i + 1) * 12}" fill="#2e3a4a" stroke="#1c1712"/>`;
    const back = Math.round((v.n("size") / 5) * climbed);
    const at = Math.max(0, climbed - 1 - back);
    const top = climbed - 1;
    const px = 43 + at * 26;
    const py = 130 - (at + 1) * 12;
    const dur = idx(v, "duration");
    const shade = `<rect x="${43 + at * 26 - 13}" y="${py - 50}" width="${26 + dur * 26}" height="50" fill="${RED}" opacity="0.15"/>`;
    const slide = back ? k.arrow({ x1: 43 + top * 26, y1: 130 - (top + 1) * 12 - 30, x2: px + 8, y2: py - 30, color: RED, w: 2 }) : "";
    const caught = [0, 0, 1, 4][idx(v, "caught")];
    const dread = v.n("dread") / 5;
    return `${k.bg(BG)}${k.tint({ color: "#000", alpha: dread * 0.35 })}${k.title("Slipping back")}${st}${shade}${slide}${k.person({ x: px, y: py, s: 0.42, color: HERO, mood: -0.6, lean: -12 })}${k.label({ x: 43 + top * 26, y: 130 - (top + 1) * 12 - 4, text: "⚑", size: 12, color: GREEN })}${tag(k, 250, 40, `cause: ${v("cause")}`)}${k.label({ x: 250, y: 58, text: `stays slipped: ${v("duration")}`, size: 8, color: "#ccc" })}${watchers(k, caught, 220, 80, -0.4)}${k.label({ x: 250, y: 98, text: `caught by: ${v("caught")}`, size: 8, color: "#aaa" })}${k.label({ x: 250, y: 112, text: `dread ${v.n("dread")}/5`, size: 8, color: "#aaa" })}${watch(k, 168, 152, v.n("slideSeconds"), 120, `slide ${secs(v.n("slideSeconds"))}`)}${when(k, v.p("slipAt"), "slips at")}${fitCap(k, `Back ${v.n("size")}/5 steps · ${mins(v.n("sinceChange"))} since they began to change`)}`;
  });

  /* Change shows: before and after side by side; how different the after looks, and through what. */
  W.look("changeShows", (v, k) => {
    const vis = v.n("visible") / 5;
    const thr = v("through");
    const con = idx(v, "contrast");
    const after = k.mix("#4a6fa5", "#e0a040", /clothes/.test(thr) ? 0.25 + vis * 0.75 : vis * 0.3);
    const lean = /posture/.test(thr) ? -vis * 0 : 0;
    const bx = con === 3 ? 80 : con === 2 ? 80 : con === 1 ? 70 : 60;
    const ax = con === 3 ? 240 : con === 2 ? 240 : 250;
    const extra = /speech/.test(thr) ? k.bubble({ x: ax, y: 38, w: 70, h: 22, text: vis > 0.5 ? "I can do this" : "maybe...", size: 9 }) : /habit/.test(thr) ? k.label({ x: ax + 30, y: 90, text: vis > 0.5 ? "☕→\u{1F3C3}" : "☕", size: 14 }) : /place/.test(thr) ? `<rect x="${ax - 40}" y="30" width="80" height="100" fill="${k.mix("#2a2a30", "#3d5a40", vis)}" opacity="0.8"/>` : /object/.test(thr) ? k.text({ x: ax + 26, y: 108, text: "✦", size: 10 + vis * 16, color: GOLD }) : "";
    const before = `${/speech/.test(thr) ? k.bubble({ x: bx, y: 38, w: 70, h: 22, text: "I can't", size: 9 }) : ""}${/habit/.test(thr) ? k.label({ x: bx + 30, y: 90, text: "☕", size: 14 }) : ""}${/object/.test(thr) ? k.text({ x: bx + 26, y: 108, text: "✦", size: 10, color: "#777" }) : ""}`;
    const postureA = /posture/.test(thr) ? { lean: 0, arms: vis * 0.8, mood: vis * 0.8 } : { lean: 0, mood: vis * 0.5 };
    const divider = con === 0 ? "" : `<line x1="160" y1="26" x2="160" y2="140" stroke="#666" ${con === 1 ? 'stroke-dasharray="2 5"' : con === 2 ? 'stroke-dasharray="6 3"' : ""}/>`;
    let sparks = "";
    for (let i = 0; i < v.n("signs"); i++) sparks += k.text({ x: ax - 24 - (i % 2) * 11, y: 62 + Math.floor(i / 2) * 13, text: "✧", size: 9, color: GOLD });
    const noticed = [0, 0, 1, 4][idx(v, "noticedBy")];
    return `${k.bg(BG)}${k.title(`Change shown through ${thr}`)}${divider}${k.label({ x: bx, y: 30, text: "before", size: 8, color: "#888" })}${k.label({ x: ax, y: 30, text: "after", size: 8, color: GOLD })}${extra}${before}${k.person({ x: bx, y: 130, s: 0.7, color: "#4a6fa5", lean: /posture/.test(thr) ? 14 : 0, mood: -0.3, arms: /posture/.test(thr) ? -0.6 : 0 })}${k.person(Object.assign({ x: ax, y: 130, s: 0.7, color: after }, postureA, { lean }))}${sparks}${watchers(k, noticed, 108, 112, 0.4)}${k.label({ x: 130, y: 130, text: noticed ? `noticed by ${v("noticedBy")}` : v("noticedBy") === "no one" ? "no one notices" : "only we notice", size: 7, color: "#aaa" })}${watch(k, 168, 152, v.n("showSeconds"), 60, `on screen ${v.n("showSeconds")} s`)}${when(k, v.p("landsAt"), "shows at")}${fitCap(k, `Visible ${v.n("visible")}/5 · ${v("contrast")} · ${mins(v.n("sinceOldWay"))} since the old way`)}`;
  });

  /* ---------- plot ---------- */

  /* Plot progress: a road to the flag; the move pushes them forward or back; a new problem drops onto the road. */
  W.look("plotProgress", (v, k) => {
    const mv = idx(v, "move") - 2;
    const left = v.p("wayLeft");
    const px = 30 + (1 - left) * 240;
    const fromX = k.clamp(px - mv * 34, 20, 290);
    const road = `<rect x="20" y="104" width="270" height="10" fill="#3a3a44"/>${k.label({ x: 290, y: 98, text: "⚑", size: 18, color: GREEN })}`;
    const arrow = mv ? k.arrow({ x1: fromX, y1: 86, x2: px, y2: 86, color: mv > 0 ? GREEN : RED, w: 1.5 + Math.abs(mv) * 1.5 }) : k.label({ x: px, y: 80, text: "no change", size: 8, color: "#aaa" });
    const np = idx(v, "newProblem");
    const rock = np ? `<ellipse cx="${r1(Math.min(270, px + 40))}" cy="${104 - np * 6}" rx="${8 + np * 8}" ry="${6 + np * 6}" fill="#6a5a50" stroke="#1c1712"/>` : "";
    const sur = idx(v, "surprise");
    const bangs = sur ? k.text({ x: px, y: 64, text: "!".repeat(sur), size: 16, color: GOLD, weight: 700 }) : "";
    const n = v.n("beats");
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(i === 0 ? 0.5 : i % 2 ? 0.85 : 0.15);
    const zig = n ? k.graph({ x: 10, y: 34, w: 90, h: 16, points: pts, color: "#9fd3ff", w2: 1.5 }) : "";
    return `${k.bg(BG)}${k.title("Toward the goal")}${road}${zig}${k.label({ x: 10, y: 30, text: n ? `${n} wins and losses on the way` : "no ups and downs on the way", size: 7, anchor: "start", color: "#aaa" })}${rock}${arrow}${bangs}${k.person({ x: px, y: 104, s: 0.45, color: HERO, mood: mv * 0.35 })}${k.label({ x: px, y: 126, text: `by ${v("cause")}`, size: 8, color: "#ccc" })}${watch(k, 168, 152, v.n("landSeconds"), 60, `lands in ${v.n("landSeconds")} s`)}${when(k, v.p("lands"), "lands at")}${fitCap(k, `${v("move")} · ${v("surprise")} · ${Math.round(left * 100)}% of the way left`)}`;
  });

  /* Plot touch: the main plot as a straight line, their own plot as a second line that stays apart, crosses it
     or joins it, at the meeting point. */
  W.look("plotTouch", (v, k) => {
    const mode = idx(v, "setting");
    const meet = 30 + v.p("meetAt") * 240;
    const pull = v.n("pull") / 5;
    const cross = v.n("crossings");
    const impact = idx(v, "impact");
    const main = [];
    const own = [];
    for (let i = 0; i <= 60; i++) {
      const x = 30 + (i / 60) * 260;
      const after = x > meet;
      const my = 80 + (after ? (impact * 10 * (x - meet)) / 100 : 0);
      main.push(`${r1(x)},${r1(my)}`);
      const base = mode === 0 ? 34 - pull * 16 : mode === 2 && after ? 0 : 30 * (1 - pull * 0.5);
      const off = mode === 1 || (mode === 2 && !after) ? Math.cos(((x - 30) / Math.max(1, meet - 30)) * Math.PI * Math.max(0.5, cross / 2)) * base : base;
      own.push(`${r1(x)},${r1(my - (mode === 2 && after ? 4 : off))}`);
    }
    const ant = v.n("anticipation") / 5;
    const glow = `<circle cx="${r1(meet)}" cy="80" r="${r1(6 + ant * 14)}" fill="${GOLD}" opacity="${r1((0.1 + ant * 0.4) * 100) / 100}"/>`;
    const hint = idx(v, "foreshadow");
    let hints = "";
    for (let i = 0; i < hint * 2; i++) { const hx = meet - 26 - i * 16; if (hx > 16) hints += k.text({ x: hx, y: 50, text: "…", size: 12, color: "#d58cff" }); }
    const share = v.p("sharedShare");
    /* a person walking each road: the hero on the main plot, the side character on their own */
    const at = (pts, x) => { const i = Math.round(((x - 30) / 260) * 60); return Number(pts[k.clamp(i, 0, 60)].split(",")[1]); };
    const walkers = `${k.person({ x: 96, y: at(main, 96), s: 0.3, color: HERO, walk: 0.5 })}${k.person({ x: 120, y: at(own, 120), s: 0.3, color: "#e0a040", walk: 0.5 })}`;
    return `${k.bg(BG)}${k.title(`Own plot ${v("setting") === "apart" ? "apart from" : v("setting")} the main plot`)}${glow}<polyline points="${main.join(" ")}" fill="none" stroke="#8fb2d8" stroke-width="3"/><polyline points="${own.join(" ")}" fill="none" stroke="#e0a040" stroke-width="2.5"/>${hints}${walkers}${k.label({ x: 30, y: 100, text: "main plot", size: 8, anchor: "start", color: "#8fb2d8" })}${k.label({ x: 30, y: 36, text: "their plot", size: 8, anchor: "start", color: "#e0a040" })}${tag(k, 250, 112, `meets ${v("who")}`)}${k.label({ x: 250, y: 126, text: `${v("impact")} · ${cross} crossings`, size: 7, color: "#aaa" })}${k.meter({ x: 160, y: 150, w: 70, p: share, label: `shared ${Math.round(share * 100)}%`, color: "#e0a040" })}${when(k, v.p("meetAt"), "they meet")}${fitCap(k, `Pull ${v.n("pull")}/5 · ${v("foreshadow")} · we feel it ${v.n("anticipation")}/5`)}`;
  });

  /* Plot weight: their plot as a block on a scale; a spotlight; pies for share of scene and lines. */
  W.look("plotWeight", (v, k) => {
    const wgt = v.n("setting") / 5;
    const tilt = (wgt - 0.5) * 24;
    const bw = 20 + wgt * 40;
    const beam = `<g transform="rotate(${r1(tilt)} 90 90)"><line x1="40" y1="90" x2="140" y2="90" stroke="#aaa" stroke-width="3"/><rect x="${r1(140 - bw / 2 - 10)}" y="${r1(90 - bw * 0.7)}" width="${r1(bw)}" height="${r1(bw * 0.7)}" fill="#e0a040" stroke="#1c1712"/><rect x="25" y="76" width="30" height="14" fill="#8fb2d8" stroke="#1c1712"/></g><path d="M90 90 l-10 30 h20 z" fill="#666"/>${k.label({ x: 40, y: 134, text: "main plot", size: 7, color: "#8fb2d8" })}${k.label({ x: 140, y: 134, text: "their plot", size: 7, color: "#e0a040" })}`;
    const tr = idx(v, "trend");
    const trend = tr === 1 ? k.label({ x: 140, y: 30, text: "steady", size: 8, color: "#aaa" }) : k.arrow({ x1: 150, y1: tr === 2 ? 44 : 26, x2: 150, y2: tr === 2 ? 24 : 46, color: tr === 2 ? GREEN : RED, w: 2 });
    const spot = idx(v, "spotlight");
    const light = spot ? k.beam({ x: 230, y: 0, dir: 90 + (spot === 2 ? 0 : -14), len: 130, spread: 26, color: "#fff3c4", alpha: spot === 2 ? 0.35 : 0.18 }) : "";
    const ho = idx(v, "handoff");
    const hand = ho ? k.arrow({ x1: 268, y1: 120, x2: 306, y2: 120, color: GOLD, w: ho * 1.5 }) + k.label({ x: 290, y: 112, text: "next scene", size: 7, color: "#aaa" }) : "";
    let shots = "";
    const cu = v.n("closeUps");
    for (let i = 0; i < Math.min(cu, 30); i++) shots += `<rect x="${186 + (i % 15) * 8}" y="${22 + Math.floor(i / 15) * 8}" width="6" height="5" fill="#9fd3ff"/>`;
    return `${k.bg(BG)}${k.title("Weight of their plot")}${light}${beam}${trend}${k.person({ x: 230, y: 120, s: 0.45, color: "#e0a040" })}${hand}${shots}${k.label({ x: 186, y: 46, text: `${cu} close-ups`, size: 7, anchor: "start", color: "#aaa" })}${k.pie({ x: 186, y: 150, r: 9, p: v.p("screenShare"), color: "#e0a040" })}${k.label({ x: 199, y: 153, text: `scene ${v.n("screenShare")}%`, size: 8, anchor: "start", color: "#ccc" })}${k.pie({ x: 262, y: 150, r: 9, p: v.p("lineShare"), color: "#9fd3ff" })}${k.label({ x: 275, y: 153, text: `lines ${v.n("lineShare")}%`, size: 8, anchor: "start", color: "#ccc" })}${k.label({ x: 10, y: 154, text: `stakes: ${v("stakes")}`, size: 8, anchor: "start", color: "#ccc" })}${fitCap(k, `Weight ${v.n("setting")}/5, ${v("trend")} · camera: ${v("spotlight")}`)}`;
  });

  /* Secret: a locked box; lid opens as it slips; who knows look at it; the proof lies some way off. */
  W.look("plotSecret", (v, k) => {
    const kept = idx(v, "kept");
    const lid = (3 - kept) * 14;
    const box = `<rect x="130" y="90" width="50" height="34" fill="#6a4a2a" stroke="#1c1712" stroke-width="2"/><g transform="rotate(${-lid} 130 90)"><rect x="128" y="82" width="54" height="9" fill="#7a5a3a" stroke="#1c1712" stroke-width="2"/></g>${kept === 3 ? `<rect x="149" y="98" width="12" height="10" fill="${GOLD}" stroke="#1c1712"/>` : kept === 0 ? k.text({ x: 155, y: 76, text: "✉", size: 16, color: "#fff" }) : ""}`;
    const cost = v.n("cost") / 5;
    const fuse = `<circle cx="196" cy="${r1(118 - cost * 6)}" r="${r1(4 + cost * 9)}" fill="#222" stroke="#666"/>${cost > 0 ? `<path d="M${196} ${r1(118 - cost * 6 - 4 - cost * 9)} q4 -6 8 -4" stroke="${GOLD}" fill="none"/>` : ""}`;
    const knowers = [0, 1, 1, 4][idx(v, "whoKnows")];
    const hide = idx(v, "hiding");
    let sweat = "";
    for (let i = 0; i < hide; i++) sweat += k.text({ x: 112 + i * 6, y: 96 - (i % 2) * 6, text: "\u{1F4A7}", size: 7 });
    const near = v.n("proofNear");
    const proofX = 290 - near * 3.5;
    let misses = "";
    for (let i = 0; i < v.n("nearMiss"); i++) misses += k.text({ x: 230 + i * 10, y: 34, text: "!", size: 12, color: RED, weight: 700 });
    return `${k.bg(BG)}${k.title(`Secret kept from ${v("keptFrom")}`)}${k.floor(124, "#22201c")}${box}${fuse}${k.person({ x: 100, y: 124, s: 0.45, color: HERO, mood: -hide * 0.25, look: 1 })}${sweat}${watchers(k, knowers, 40, 40, 0.2)}${k.label({ x: 40, y: 56, text: v("whoKnows"), size: 7, anchor: "start", color: "#aaa" })}${k.person({ x: 270, y: 124, s: 0.42, color: "#8a5a6a", look: -1 })}${k.text({ x: proofX - 20, y: 120, text: "\u{1F4C4}", size: 11 })}${k.label({ x: proofX - 20, y: 134, text: `proof ${near} m`, size: 7, color: "#aaa" })}${misses}${k.label({ x: 228, y: 46, text: `${v.n("nearMiss")} close calls`, size: 7, anchor: "start", color: "#aaa" })}${when(k, v.p("revealAt"), `out by: ${v("revealWay")}`)}${k.label({ x: 170, y: 154, text: `kept ${v.n("keptFor")} years`, size: 8, anchor: "start", color: "#ccc" })}${fitCap(k, `${v("kept")} · hiding: ${v("hiding")} · cost ${v.n("cost")}/5`)}`;
  });

  /* Open questions: an audience in the seats with question marks over their heads; answered ones turn to ticks,
     new ones pop up in gold; the redder and bigger the marks, the more badly we need to know. */
  W.look("openQuestions", (v, k) => {
    const n = v.n("setting");
    const ans = v.n("answered");
    const urg = v.n("urgency") / 5;
    const old = v.p("oldestOpen");
    const raisedN = v.n("raised");
    const marks = [];
    for (let i = 0; i < n; i++) marks.push({ t: "?", col: k.mix("#9fd3ff", "#ff6b6b", urg), size: 18 + urg * 14, alpha: i === 0 ? 1 - old * 0.5 : 1 });
    for (let i = 0; i < ans; i++) marks.push({ t: "✓", col: GREEN, size: 18, alpha: 1 });
    for (let i = 0; i < raisedN; i++) marks.push({ t: "?", col: GOLD, size: 15, alpha: 1, isNew: true });
    const gap = marks.length > 9 ? 27 : 32;
    const x0 = 160 - ((marks.length - 1) * gap) / 2;
    let qs = "";
    marks.forEach((m, i) => {
      const x = x0 + i * gap;
      qs += k.text({ x, y: 74 - (i % 2) * 12, text: m.t, size: m.size, color: m.col, weight: 700, alpha: m.alpha });
      if (m.isNew) qs += k.label({ x, y: 84 - (i % 2) * 12, text: "new", size: 7, color: GOLD });
    });
    if (!marks.length) qs = k.label({ x: 160, y: 66, text: "no open questions", size: 10, color: "#777" });
    /* the audience: heads from the front, worried the more badly they need to know */
    let seats = `<rect x="0" y="112" width="320" height="16" fill="#2a1f24"/>`;
    for (let i = 0; i < 9; i++) seats += k.face({ x: 24 + i * 34, y: 104, r: 9, mood: n ? -urg * 0.7 : 0.4, brows: n ? -urg : 0.2, mouth: urg * 0.5, eyes: 1, color: "#d8b48c" });
    const nxt = `next answer in ${mins(v.n("nextAnswer"))}`;
    return `${k.bg(BG)}${k.title(`Biggest: ${v("kind")}?`)}${qs}${seats}${k.fitText({ x: 10, y: 138, text: `answers: ${v("answerKind")} · oldest open ${mins(v.n("oldestOpen"))}`, size: 8, min: 6.5, w: 200, anchor: "start", color: "#ccc" })}${k.clock({ x: 300, y: 146, r: 9, p: v.p("nextAnswer") })}${k.label({ x: 286, y: 151, text: nxt, size: 8, anchor: "end", color: "#ccc" })}${fitCap(k, `${n} open · ${ans} answered · ${raisedN} new · need to know ${v.n("urgency")}/5`)}`;
  });

  /* Ticking clock: a clock face running out; red as time runs out, motion lines as it speeds up. */
  W.look("tickingClock", (v, k) => {
    const tight = idx(v, "setting");
    const left = v.p("timeLeft");
    const shown = idx(v, "shown");
    const r = 26 + shown * 10;
    const cx = 106;
    const col = k.mix("#9fd3ff", "#ff4b4b", tight / 3);
    const acc = idx(v, "acceleration");
    let lines = "";
    for (let i = 0; i < acc * 2; i++) lines += `<path d="M${r1(cx + r + 6 + i * 5)} ${80 - 10 + i * 5} q6 10 0 20" stroke="${col}" fill="none" stroke-width="1.5"/>`;
    const rem = idx(v, "reminders");
    let ticks = "";
    const nt = [1, 3, 6, 12][rem];
    for (let i = 0; i < nt; i++) ticks += `<line x1="${r1(176 + (i / Math.max(1, nt - 1)) * 124)}" y1="124" x2="${r1(176 + (i / Math.max(1, nt - 1)) * 124)}" y2="132" stroke="${GOLD}" stroke-width="2"/>`;
    const speed = v.n("clockSpeed");
    /* the person racing the clock: running harder, and more worried, the tighter it is */
    const runner = k.person({ x: 28, y: 132, s: 0.5, color: HERO, lean: tight * 6, walk: tight / 3, arms: tight ? 0.3 : 0, mood: -tight * 0.25, look: 1 });
    const hand = k.rad(-90 + ((speed - 10) / 490) * 300);
    return `${k.bg(BG)}${k.title(`Clock: ${v("setting")}`)}${tight ? "" : k.tint({ color: "#000", alpha: 0.3 })}<g opacity="${r1((0.45 + shown * 0.27) * 100) / 100}">${k.pie({ x: cx, y: 80, r, p: 1 - left, color: col })}<circle cx="${cx}" cy="80" r="${r}" fill="none" stroke="#eee" stroke-width="2"/><line x1="${cx}" y1="80" x2="${r1(cx + Math.cos(hand) * r * 0.9)}" y2="${r1(80 + Math.sin(hand) * r * 0.9)}" stroke="#fff" stroke-width="2"/></g>${lines}${runner}${k.label({ x: cx, y: 80 + r + 12, text: `${v.n("timeLeft")} min left · ${v("shown")}`, size: 8, color: "#ccc" })}${tag(k, 240, 46, `if it runs out: ${v("consequence")}`, "#3a2020")}${tag(k, 240, 70, `whose: ${v("clockOf")}`)}${k.label({ x: 240, y: 96, text: `runs at ${speed}% of real time`, size: 8, color: "#aaa" })}${k.label({ x: 240, y: 110, text: `${v("acceleration")}`, size: 8, color: "#aaa" })}${ticks}${k.label({ x: 176, y: 146, text: `reminders: ${v("reminders")}`, size: 8, anchor: "start", color: "#aaa" })}${fitCap(k, `${v("setting")} · ${v.n("timeLeft")} min left · ${v("acceleration")}`)}`;
  });

  /* Knowledge gap: the audience (a face in the seats) and the character on a race to the truth; who is ahead. */
  W.look("knowledgeGap", (v, k) => {
    const who = v("setting");
    const gap = (idx(v, "gap") + 1) / 3;
    const tx = 286;
    const lead = 200 + gap * 0;
    const aud = /audience first/.test(who) ? lead + gap * 70 : /character first/.test(who) ? lead - gap * 70 : /together/.test(who) ? lead : 140;
    const chr = /character first/.test(who) ? lead + gap * 70 : /audience first/.test(who) ? lead - gap * 70 : /together/.test(who) ? lead : 140;
    const near = v.n("truthNear");
    const cx = Math.min(tx - 20, k.clamp(tx - 20 - near * 9, 20, tx - 20));
    const charX = Math.min(cx, chr);
    const tension = v.n("tension") / 5;
    const surprise = /nobody/.test(who);
    return `${k.bg(BG)}${k.title(`Who knows first: ${who}`)}${k.text({ x: tx, y: 90, text: "\u{1F4A1}", size: 22 })}${k.label({ x: tx, y: 104, text: "truth", size: 7, color: "#aaa" })}<line x1="10" y1="60" x2="${tx - 12}" y2="60" stroke="#333"/><line x1="10" y1="118" x2="${tx - 12}" y2="118" stroke="#333"/>${k.face({ x: Math.min(tx - 30, aud), y: 48, r: 11, mood: -tension * 0.6, brows: -tension, mouth: tension * 0.4, eyes: 1 })}${k.label({ x: 14, y: 52, text: "us", size: 8, anchor: "start", color: "#aaa" })}${k.person({ x: charX, y: 118, s: 0.55, color: HERO })}${k.label({ x: 14, y: 112, text: "them", size: 8, anchor: "start", color: "#aaa" })}${surprise ? k.text({ x: 200, y: 92, text: "?!", size: 18, color: GOLD, weight: 700 }) : ""}${k.label({ x: charX, y: 130, text: `${near} m from it`, size: 7, color: "#aaa" })}${tag(k, 10, 32, `learned by ${v("howTold")}`, null, "start")}${tag(k, 310, 32, `in the dark: ${v("inTheDark")}`, null, "end")}${watch(k, 168, 152, v.n("catchUpSeconds"), 60, `catch-up ${v.n("catchUpSeconds")} s`)}${when(k, v.p("revealAt"), "gap closes")}${fitCap(k, `Ahead by ${v("gap")} · we squirm ${v.n("tension")}/5`)}`;
  });

  /* ---------- roles and people ---------- */
  const roleIcon = { stabilizer: "⚓", catalyst: "⚡", challenger: "⚔", mediator: "⚖", mentor: "\u{1F393}", temptation: "\u{1F34E}", mirror: "\u{1FA9E}", foil: "⇄", wildcard: "\u{1F0CF}", anchor: "⚓", trickster: "\u{1F3AD}", "moral center": "⚖", "moral-center": "⚖", antagonist: "☠", ally: "\u{1F91D}" };
  const roleScene = (k, o) => {
    const target = o.target;
    const tx = 230;
    const rx = k.clamp(tx - 20 - o.dist * 8, 20, tx - 20);
    const present = o.present;
    const ry = 128;
    const alpha = [0.25, 0.55, 0.9, 1][present];
    const glow = `<circle cx="${r1(rx)}" cy="${ry - 30}" r="${r1(10 + o.strength * 24)}" fill="${GOLD}" opacity="${r1((0.06 + o.strength * 0.25) * 100) / 100}"/>`;
    const spot = o.eye > 0 ? k.beam({ x: rx, y: 0, dir: 90, len: 130, spread: 10 + o.eye * 30, color: "#fff3c4", alpha: 0.05 + o.eye * 0.3 }) : "";
    const targets = target === 0 ? "" : target === 3 ? crowd(k, 4, 214, ry, { gap: 16, s: 0.34, color: "#7a8a5a" }) : k.person({ x: tx, y: ry, s: target === 2 ? 0.48 : 0.36, color: target === 2 ? HERO : "#7a8a5a" });
    const link = target === 0 ? "" : k.arrow({ x1: rx + 12, y1: ry - 30, x2: tx - 14, y2: ry - 30, color: GOLD, w: 1 + o.strength * 3 });
    return `${spot}${glow}${targets}${link}${k.person({ x: rx, y: ry, s: 0.48, color: "#c07a3a", alpha, mood: o.mood || 0, eyes: o.eyes })}${k.text({ x: rx, y: ry - 54, text: roleIcon[o.role] || "★", size: 14 })}${k.label({ x: rx, y: ry + 10, text: `${o.dist} m`, size: 7, color: "#888" })}`;
  };

  /* Dramatic role: the role-player (orange) and who they work on; glow is how strongly, the spotlight is how
     much they pull our eye, distance is how close they stand. */
  W.look("dramaticRole", (v, k) => {
    const role = v("setting");
    let bites = "";
    const n = v.n("roleMoments");
    for (let i = 0; i < n; i++) bites += k.text({ x: 304 - (i % 10) * 11, y: 42 + Math.floor(i / 10) * 11, text: "⚡", size: 9, color: GOLD });
    return `${k.bg(BG)}${k.title(`Role: ${role}`)}${k.floor(128, "#22201c")}${roleScene(k, { role, target: idx(v, "target"), dist: v.n("targetDistance"), present: idx(v, "onScreen"), strength: v.n("strength") / 5, eye: v.n("drawsEye") / 5 })}${bites}${k.label({ x: 310, y: 30, text: n ? `bites ${n}× in the scene` : "no big moments yet", size: 7, anchor: "end", color: "#aaa" })}${when(k, v.p("roleStartsAt"), "kicks in")}${fitCap(k, `${role} on ${v("target")} · ${v("onScreen")} · strength ${v.n("strength")}/5`)}`;
  });

  W.look("cm-role", (v, k) => {
    const role = v("role");
    const aw = idx(v, "awareness");
    let bites = "";
    const n = v.n("roleMoments");
    for (let i = 0; i < n; i++) bites += k.text({ x: 304 - (i % 10) * 11, y: 42 + Math.floor(i / 10) * 11, text: "⚡", size: 9, color: GOLD });
    const shift = idx(v, "roleShift");
    const pts = [[0.5, 0.5, 0.5, 0.5], [0.3, 0.45, 0.6, 0.75], [0.3, 0.3, 0.7, 0.7], [0.3, 0.3, 0.3, 0.9]][shift];
    return `${k.bg(BG)}${k.title(`Role: ${role}`)}${k.floor(128, "#22201c")}${roleScene(k, { role, target: idx(v, "target"), dist: v.n("targetDistance"), present: 2, strength: v.n("strength") / 5, eye: v.n("drawsEye") / 5, eyes: [0.25, 0.6, 1][aw] })}${bites}${k.label({ x: 310, y: 30, text: n ? `bites ${n}× in the scene` : "no big moments yet", size: 7, anchor: "end", color: "#aaa" })}${k.graph({ x: 256, y: 72, w: 50, h: 14, points: pts, color: "#9fd3ff", w2: 1.5 })}${k.label({ x: 281, y: 96, text: `role ${v("roleShift")}`, size: 7, color: "#aaa" })}${watch(k, 20, 152, v.n("switchSeconds"), 60, `switch takes ${v.n("switchSeconds")} s`)}${fitCap(k, `${role}, ${v("awareness")}, on ${v("target")} · strength ${v.n("strength")}/5`)}`;
  });

  /* Dissenter: one person apart from the group, arms up the more openly they defy; some of the group may cross. */
  W.look("dissenter", (v, k) => {
    const ag = idx(v, "against");
    const apart = v.n("apartBy");
    const dx = k.clamp(170 - apart * 7, 26, 170);
    const joined = [0, 1, 3, 6][idx(v, "joined")];
    const iso = idx(v, "isolation");
    const firm = idx(v, "firmness");
    const group = crowd(k, 6, 196, 128, { gap: 18, s: 0.4, color: (i) => (i < joined ? "#c07a3a" : "#6a6a7a"), look: -1 });
    const frame = iso ? k.frame({ x: dx - 22, y: 46, w: 44, h: 90, color: GOLD, dash: iso === 1 ? "3 3" : null, w2: iso }) : "";
    const dark = iso === 3 ? `<rect x="180" y="20" width="140" height="120" fill="#000" opacity="0.5"/>` : "";
    const bubble = ag >= 2 ? k.bubble({ x: dx + 30, y: 34, w: 64, h: 20, text: ag === 3 ? "NO!" : "I disagree", size: 9, tail: -20 }) : ag === 1 ? k.text({ x: dx + 18, y: 60, text: "…?", size: 12, color: "#aaa" }) : "";
    const cost = v.n("cost");
    return `${k.bg(BG)}${k.title(`Against ${v("dissentsFrom")}`)}${k.floor(128, "#22201c")}${group}${dark}${frame}${k.person({ x: dx, y: 128, s: 0.48, color: "#c07a3a", arms: ag / 3, lean: [-14, -6, 0, 4][firm], mood: ag === 0 ? -0.4 : 0.2 })}${bubble}${k.label({ x: k.clamp(dx, 70, 200), y: 138, text: `${apart} m apart`, size: 7, color: "#aaa" })}${pips(k, cost, 262, 30, RED)}${k.label({ x: 256, y: 33, text: `cost ${cost}/5`, size: 7, anchor: "end", color: "#aaa" })}${hearts(k, v.n("rooting"), 262, 14)}${watch(k, 168, 152, v.n("speakSeconds"), 300, `speaks ${secs(v.n("speakSeconds"))}`)}${when(k, v.p("speakAt"), "speaks up")}${fitCap(k, `${v("against")} · ${v("firmness")} · joined by ${v("joined")}`)}`;
  });

  /* Group pressure: a group pressing in on one person; arrows are the press, distance is how near they stand. */
  W.look("groupPressure", (v, k) => {
    const press = v.n("press") / 5;
    const n = [1, 3, 5, 8][idx(v, "outnumbered")];
    const near = v.n("groupNear");
    const iso = v.p("isolation");
    const px = 60;
    const gx = px + 30 + near * 12;
    const gives = idx(v, "gives");
    const by = v("shownBy");
    const group = crowd(k, n, gx, 128, { gap: 15, s: 0.38, color: "#6a6a7a", look: -1, per: 6, mood: /looks|all/.test(by) ? -0.6 : 0 });
    let arrows = "";
    for (let i = 0; i < 3; i++) arrows += k.arrow({ x1: gx - 4, y1: 84 + i * 12, x2: gx - 8 - press * 20, y2: 84 + i * 12, color: RED, w: 0.8 + press * 2.2 });
    const words = /words|all/.test(by) ? k.bubble({ x: gx + 40, y: 34, w: 70, h: 20, text: "come on...", size: 9, tail: -24 }) : "";
    const place = /placement|all/.test(by) ? `<line x1="${px + 18}" y1="134" x2="${gx - 8}" y2="134" stroke="#888" stroke-dasharray="2 3"/>` : "";
    const b = idx(v, "build");
    const pts = [[0.9, 0.9, 0.9, 0.9], [0.3, 0.8, 0.3, 0.9], [0.1, 0.35, 0.6, 0.95]][b];
    return `${k.bg(BG)}${k.title(`Pressure by ${by}`)}${k.floor(128, "#22201c")}<rect x="0" y="20" width="${r1(px + 20 + iso * 30)}" height="108" fill="#000" opacity="${r1(iso * 0.4 * 100) / 100}"/>${group}${arrows}${words}${place}${k.person({ x: px, y: 128, s: 0.48, color: HERO, lean: [0, -8, -18][gives], mood: [0.2, -0.3, -0.8][gives], arms: gives === 0 ? 0.3 : -0.4 })}${k.label({ x: px, y: 142, text: `${near} m from the group`, size: 7, color: "#aaa" })}${k.graph({ x: 250, y: 140, w: 60, h: 14, points: pts, color: RED, w2: 1.5 })}${k.label({ x: 280, y: 136, text: v("build"), size: 7, color: "#aaa" })}${watch(k, 20, 158, v.n("pressSeconds"), 600, `lasts ${secs(v.n("pressSeconds"))}`)}${fitCap(k, `Press ${v.n("press")}/5 · ${v("outnumbered")} against one · ${v("gives")}`)}`;
  });

  /* Herd mentality: a crowd, more of them facing and leaning the same way the stronger the herd. */
  W.look("herdMentality", (v, k) => {
    const herd = v.n("setting") / 5;
    const press = v.n("pressure") / 5;
    const size = [2, 5, 10, 20][idx(v, "size")];
    const sp = v.n("spacing");
    const frameI = idx(v, "inFrame");
    const dirI = idx(v, "direction");
    const holdouts = Math.min(size - 1, Math.round(v.n("holdouts") / 5));
    const dirCol = [GREEN, "#aaa", RED][dirI];
    let s = "";
    /* fewer people are drawn bigger, so a pair reads as clearly as a crowd */
    const ps = size <= 2 ? 0.75 : size <= 5 ? 0.62 : size <= 10 ? 0.48 : 0.38;
    const cols = Math.min(size, 7);
    const cl = frameI === 0 ? 1 : frameI === 1 ? 0.7 : frameI === 2 ? 0.45 : 0.25;
    const gap = Math.min(36, ((8 + sp * 3) * cl + 4) * (ps / 0.34));
    const x0 = 150 - ((cols - 1) * gap) / 2;
    for (let i = 0; i < size; i++) {
      const isOut = i >= size - holdouts;
      const agrees = !isOut && k.rnd(i + 2) < 0.2 + herd * 0.8;
      const col = i % 7;
      const row = Math.floor(i / 7);
      const x = x0 + col * gap + (frameI === 0 ? (k.rnd(i + 5) - 0.5) * 24 : 0) + (frameI === 1 && col > 3 ? 20 : 0);
      s += k.person({ x, y: 132 - row * 16 + (frameI === 0 ? k.rnd(i + 7) * 8 : 0), s: ps, color: isOut ? "#c07a3a" : agrees ? k.mix("#6a6a7a", dirCol, 0.6) : "#555", lean: agrees ? 8 + press * 10 : -4, look: agrees ? 1 : -1 });
    }
    const spd = v.n("speed") / 5;
    let lines = "";
    for (let i = 0; i < Math.round(spd * 4); i++) lines += `<line x1="${14}" y1="${70 + i * 12}" x2="${r1(14 + 10 + spd * 14)}" y2="${70 + i * 12}" stroke="#aaa" stroke-width="1.5"/>`;
    return `${k.bg(BG)}${k.title(`Herd heads ${v("direction")}`)}${k.floor(134, "#22201c")}${k.arrow({ x1: 220, y1: 30, x2: 300, y2: 30, color: dirCol, w: 3 })}${lines}${s}${k.label({ x: 310, y: 50, text: `${v.n("holdouts") ? v.n("holdouts") + " hold out" : "no holdouts"} · ${sp} m apart`, size: 7, anchor: "end", color: "#aaa" })}${k.label({ x: 310, y: 62, text: `${v("inFrame")} · spreads ${v.n("speed")}/5`, size: 7, anchor: "end", color: "#aaa" })}${fitCap(k, `Herd ${v.n("setting")}/5 · pressure ${v.n("pressure")}/5 · ${v("size")}`)}`;
  });

  /* Herd leader: the leader placed in the frame, above and ahead of the followers, with lines of pull. */
  W.look("herdLeader", (v, k) => {
    const lead = idx(v, "setting");
    const str = v.n("strength") / 5;
    const lx = 30 + v.p("placement") * 260;
    const above = v.n("leaderAbove");
    const ahead = v.n("leaderAhead");
    /* height drawn up to 5 m (a plinth); below the group they stand in a dip, drawn a little lower */
    const ly = 128 - k.clamp(above, -1, 5) * 10;
    const fCount = Math.max(1, Math.min(14, Math.round(Math.sqrt(v.n("followers")) * 0.65)));
    /* followers trail behind the leader, on whichever side has room */
    const side = lx < 150 ? 1 : -1;
    const fx = lx + side * (26 + Math.min(ahead, 20) * 3);
    let fol = "";
    let pull = "";
    for (let i = 0; i < fCount; i++) {
      const x = k.clamp(fx + side * (i % 7) * 17, 10, 310);
      const y = 128 - Math.floor(i / 7) * 12;
      fol += k.person({ x, y, s: 0.45, color: "#6a6a7a", look: -side });
      if (lead) pull += `<line x1="${r1(x)}" y1="${y - 20}" x2="${r1(lx)}" y2="${r1(ly - 30)}" stroke="${GOLD}" opacity="${r1((0.05 + str * 0.4) * 100) / 100}"/>`;
    }
    const leaders = lead === 0 ? k.ring({ x: lx, y: ly - 24, r: 14, color: "#888", w: 1.5, dash: "3 3" }) + k.text({ x: lx, y: ly - 19, text: "?", size: 14, color: "#aaa" }) + k.label({ x: k.clamp(lx, 34, 286), y: ly - 44, text: "no leader", size: 8, color: "#aaa" }) : lead === 3 ? crowd(k, 3, lx - 14, ly, { gap: 14, s: 0.4, color: "#c07a3a" }) : lead === 2 ? crowd(k, 2, lx - 7, ly, { gap: 14, s: 0.45, color: "#c07a3a" }) : k.person({ x: lx, y: ly, s: 0.6, color: "#c07a3a", arms: 0.6 });
    const ch = idx(v, "challenged");
    const chal = ch ? k.person({ x: k.clamp(lx - side * 34, 14, 306), y: 128, s: 0.4, color: RED, arms: ch / 3, lean: ch === 3 ? 0 : -6 }) + (ch === 3 ? `<path d="M${r1(lx - 12)} ${r1(ly - 46)} l24 24 m0 -24 l-24 24" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>` : "") : "";
    const plinth = above > 0 ? `<rect x="${r1(lx - 14)}" y="${r1(ly)}" width="28" height="${r1(128 - ly)}" fill="#3a3a44"/>` : above < 0 ? `<rect x="${r1(lx - 16)}" y="128" width="32" height="${r1(ly - 128)}" fill="#0e0e12"/>` : "";
    return `${k.bg(BG)}${k.title(`Led by ${v("setting")}, through ${v("leadsBy")}`)}${k.floor(128, "#22201c")}${pull}${plinth}${fol}${leaders}${chal}${k.label({ x: 10, y: 154, text: `${v.n("followers")} follow · ${above} m above · ${ahead} m ahead`, size: 8, anchor: "start", color: "#ccc" })}${fitCap(k, `Pull ${v.n("strength")}/5 · ${v("challenged")} · placed at ${v.n("placement")}%`)}`;
  });

  /* ---------- the inner life ---------- */

  /* The lie: a shell around the person with the lie written on it; cracks and blows from life. */
  W.look("theLie", (v, k) => {
    const grip = v.n("grip") / 5;
    const see = v.p("weSee");
    const cr = idx(v, "cracks");
    const about = v("about");
    const sh = idx(v, "shown");
    const age = Math.min(1, v.n("heldFor") / 80);
    const shellCol = k.mix("#7a8aa0", "#8a7a5a", age);
    let cracks = "";
    for (let i = 0; i < cr * 2; i++) { const a = k.rad(-60 + i * 35); cracks += `<path d="M${r1(110 + Math.cos(a) * 50)} ${r1(84 + Math.sin(a) * 50)} l${r1(-Math.cos(a) * (8 + cr * 6))} ${r1(-Math.sin(a) * (8 + cr * 6) + 4)} l4 6" stroke="#fff" fill="none" stroke-width="1.2"/>`; }
    const blows = v.n("blows");
    const ch = v.n("challenged") / 5;
    let hits = "";
    for (let i = 0; i < blows; i++) { const a = k.rad(-80 + i * 17); hits += k.arrow({ x1: 110 + Math.cos(a) * (70 + ch * 30), y1: 84 + Math.sin(a) * (54 + ch * 20), x2: 110 + Math.cos(a) * 56, y2: 84 + Math.sin(a) * 52, color: RED, w: 0.8 + ch * 1.6 }); }
    return `${k.bg(BG)}${k.title(`The lie about ${about}`)}${k.person({ x: 110, y: 124, s: 0.55, color: HERO, mood: -0.3 })}<ellipse cx="110" cy="84" rx="50" ry="50" fill="${shellCol}" opacity="${r1((0.85 - see * 0.6) * 100) / 100}" stroke="${shellCol}" stroke-width="${r1(2 + grip * 8)}"/>${cracks}${hits}${k.text({ x: 110, y: 46, text: sh === 0 ? "" : `"${about}"`, size: 10, color: "#fff", alpha: sh === 1 ? 0.45 : 1, italic: true })}${tag(k, 250, 50, `from ${v("learnedFrom")}`)}${k.label({ x: 250, y: 72, text: `believed ${v.n("heldFor")} years`, size: 8, color: "#ccc" })}${k.label({ x: 250, y: 86, text: `${blows} blows · pushed ${v.n("challenged")}/5`, size: 8, color: "#ccc" })}${k.label({ x: 250, y: 100, text: `we see through it: ${v("weSee")}`, size: 8, color: "#ccc" })}${fitCap(k, `Grip ${v.n("grip")}/5 · ${v("cracks")} · ${v("shown")}`)}`;
  });

  /* The wound: a mark on the chest, red when raw; a weight it hangs on them; a memory panel from years back. */
  W.look("wound", (v, k) => {
    const weight = v.n("weight") / 5;
    const raw = idx(v, "rawness");
    const col = ["#c9a58a", "#d8706a", "#e02c2c"][raw];
    const years = v.n("yearsAgo");
    const mx = 210 + Math.min(1, years / 80) * 70;
    const touched = v.n("touched");
    let pulses = "";
    for (let i = 0; i < touched; i++) pulses += k.ring({ x: 100, y: 88, r: 8 + i * 5, color: col, w: 1 });
    const rev = idx(v, "revealed");
    const cur = v.n("curiosity") / 5;
    const qs = cur > 0 ? k.text({ x: 40, y: 40, text: "?".repeat(Math.round(cur * 5)), size: 12, color: GOLD }) : "";
    return `${k.bg(BG)}${k.title(`A wound from ${v("woundBy")}`)}${k.person({ x: 100, y: 132, s: 0.65, color: HERO, lean: weight * 10, mood: -0.4 })}${pulses}<path d="M94 84 l12 8 M96 92 l8 -8" stroke="${col}" stroke-width="${2 + raw}" stroke-linecap="round"/><line x1="108" y1="96" x2="${r1(118 + weight * 10)}" y2="${r1(110 + weight * 14)}" stroke="#888"/><rect x="${r1(112 + weight * 10)}" y="${r1(110 + weight * 14)}" width="${r1(8 + weight * 16)}" height="${r1(8 + weight * 12)}" fill="#555" stroke="#1c1712"/>${qs}${k.panel({ x: mx - 30, y: 34, w: 60, h: 40, fill: "#2a2a34" })}${k.label({ x: mx, y: 58, text: "the past", size: 8, color: "#999" })}${k.label({ x: mx, y: 86, text: `${years} years ago`, size: 8, color: "#ccc" })}${tag(k, mx, 102, v("howShown"))}${watch(k, 168, 152, v.n("revealLength"), 300, `reveal ${secs(v.n("revealLength"))}`)}${rev === 0 ? k.label({ x: 10, y: 154, text: "we never learn it", size: 8, anchor: "start", color: "#aaa" }) : when(k, [0, 0.85, 0.5, 0.15][rev], `we learn it ${v("revealed")}`)}${fitCap(k, `Drives them ${v.n("weight")}/5 · ${v("rawness")} · touched ${touched}/5`)}`;
  });

  /* Belief shown: what they say in a bubble, what they do with their hands; matching or opposite. */
  W.look("beliefShown", (v, k) => {
    const how = idx(v, "how");
    const ag = idx(v, "against");
    const cost = v.n("cost") / 5;
    const actCol = ag === 0 ? GREEN : ag === 1 ? GOLD : RED;
    const act = how === 3 ? k.bubble({ x: 150, y: 40, w: 90, h: 22, text: "I believe it", size: 9, tail: -40 }) : k.text({ x: 160, y: 104, text: how === 2 ? "⭐" : how === 1 ? "•" : "·", size: 10 + how * 10, color: actCol });
    const words = k.bubble({ x: 60, y: 34, w: 80, h: 20, text: ag === 2 ? "I don't care" : ag === 1 ? "I guess..." : "I care", size: 9, tail: 0 });
    const wit = [0, 0, 1, 4][idx(v, "witness")];
    let shows = "";
    for (let i = 0; i < v.n("showings"); i++) shows += `<rect x="${200 + i * 10}" y="24" width="7" height="10" fill="${actCol}"/>`;
    return `${k.bg(BG)}${k.title("Belief shown")}${k.floor(130, "#22201c")}${words}${k.person({ x: 110, y: 130, s: 0.55, color: HERO, arms: 0.2 + how * 0.2, mood: 0.2 })}${act}<rect x="170" y="${r1(112 - cost * 30)}" width="${r1(10 + cost * 14)}" height="${r1(4 + cost * 30)}" fill="#555" stroke="#1c1712"/>${k.label({ x: 186, y: 126, text: `costs ${v.n("cost")}/5`, size: 7, color: "#aaa" })}${watchers(k, wit, 240, 80, 0.3)}${k.label({ x: 270, y: 98, text: `seen by ${v("witness")}`, size: 7, color: "#aaa" })}${shows}${k.label({ x: 200, y: 44, text: `shows ${v.n("showings")}×`, size: 7, anchor: "start", color: "#aaa" })}${watch(k, 168, 152, v.n("showSeconds"), 120, `for ${secs(v.n("showSeconds"))}`)}${when(k, v.p("shownAt"), "shows at")}${fitCap(k, `${v("how")} · words and deeds: ${v("against")}`)}`;
  });

  /* Mindset: a head with a door, shut (fixed) or open; pressure arrows and bolts of challenge hit it. */
  W.look("mindset", (v, k) => {
    const m = idx(v, "setting");
    const pr = v.n("pressure") / 5;
    const ch = v.n("challenge") / 5;
    const deceit = v.p("selfDeceit");
    const listen = idx(v, "listening");
    const cx = 120;
    const cy = 80;
    const door = `<rect x="${cx - 12}" y="${cy - 16}" width="24" height="32" fill="#2a2a34" stroke="#888"/><g transform="rotate(${[0, 30, 75][m]} ${cx - 12} ${cy})"><rect x="${cx - 12}" y="${cy - 16}" width="24" height="32" fill="#8a6a4a" stroke="#1c1712" transform="scale(1 1)"/></g>${m === 0 ? k.text({ x: cx + 4, y: cy + 4, text: "\u{1F512}", size: 10 }) : ""}`;
    let arrows = "";
    for (let i = 0; i < 3; i++) arrows += k.arrow({ x1: cx - 60 - pr * 30, y1: cy - 16 + i * 16, x2: cx - 50, y2: cy - 16 + i * 16, color: "#9fd3ff", w: 1 + pr * 2.5 });
    let bolts = "";
    const nb = v.n("challenges");
    for (let i = 0; i < nb; i++) bolts += k.text({ x: cx + 54 + (i % 5) * 9, y: cy - 30 + Math.floor(i / 5) * 12, text: "⚡", size: 8 + ch * 8, color: GOLD });
    const ear = [0, 1, 2, 3].slice(0, listen).map((i) => `<path d="M${cx + 52 + i * 6} ${cy - 6 - i * 3} q5 ${6 + i * 3} 0 ${12 + i * 6}" stroke="#9fd3ff" fill="none"/>`).join("");
    return `${k.bg(BG)}${k.title(`Mindset: ${v("setting")}`)}<circle cx="${cx}" cy="${cy}" r="48" fill="#f0c8a0" stroke="#1c1712" stroke-width="2"/>${door}<rect x="${cx - 40}" y="${cy - 34}" width="80" height="10" rx="4" fill="#222" opacity="${r1(deceit * 0.9 * 100) / 100}"/>${arrows}${bolts}${ear}${k.label({ x: 250, y: 104, text: `challenged by ${v("challengedBy")}`, size: 8, color: "#ccc" })}${k.label({ x: 250, y: 118, text: `listening: ${v("listening")}`, size: 7, color: "#aaa" })}${k.label({ x: 250, y: 130, text: `fooling self: ${v("selfDeceit")}`, size: 7, color: "#aaa" })}${watch(k, 168, 152, v.n("holdOut"), 600, `holds out ${secs(v.n("holdOut"))}`)}${when(k, v.p("turningPoint"), "mind shifts")}${fitCap(k, `Pressure ${v.n("pressure")}/5 · challenge ${v.n("challenge")}/5 · hit ${nb}×`)}`;
  });

  /* Resistance: someone pushes; they push back behind a shield that cracks as they start to give way. */
  W.look("resistance", (v, k) => {
    const lvl = v.n("level") / 5;
    const crack = idx(v, "cracking");
    const away = v.n("stepsAway");
    const px = 90;
    const ox = k.clamp(px + 50 + away * 8, 150, 300);
    const who = v("whoPushes");
    const pusher = /no one/.test(who) ? k.label({ x: 250, y: 100, text: "(no one pushing)", size: 8, color: "#777" }) : /life/.test(who) ? k.text({ x: ox, y: 110, text: "\u{1F30A}", size: 30 }) : k.person({ x: ox, y: 130, s: 0.48, color: /enemy/.test(who) ? RED : /love/.test(who) ? "#ff8fab" : "#7a8a5a", lean: -10, arms: 0.4 });
    let cr = "";
    for (let i = 0; i < crack * 2; i++) cr += `<path d="M${px + 26} ${70 + i * 10} l6 4 l-4 5" stroke="#fff" fill="none"/>`;
    let pb = "";
    for (let i = 0; i < v.n("pushBacks"); i++) pb += k.arrow({ x1: px + 34, y1: 40 + i * 3.5, x2: px + 44 + lvl * 20, y2: 40 + i * 3.5, color: "#9fd3ff", w: 1 });
    return `${k.bg(BG)}${k.title(`Fighting it with ${v("how")}`)}${k.floor(130, "#22201c")}${pusher}${k.arrow({ x1: ox - 18, y1: 96, x2: px + 40, y2: 96, color: RED, w: 2 })}<rect x="${px + 20}" y="${r1(84 - lvl * 22)}" width="${r1(8 + lvl * 6)}" height="${r1(30 + lvl * 44)}" rx="3" fill="#8fb2d8" stroke="#1c1712"/>${cr}${k.person({ x: px, y: 130, s: 0.52, color: HERO, lean: lvl * 14, arms: 0.4, mood: -0.4 })}${pb}${k.label({ x: px + 40, y: 32, text: `pushes back ${v.n("pushBacks")}×`, size: 7, color: "#aaa" })}${k.label({ x: (px + ox) / 2 + 10, y: 144, text: `${away} m apart`, size: 7, color: "#aaa" })}${when(k, v.p("giveWay"), "gives way")}${fitCap(k, `Resists ${v.n("level")}/5 · ${v("cracking")} · pushed by ${who}`)}`;
  });

  /* ---------- focus and perspective ---------- */
  /* A person with a cone of attention from their head: angle is how wide, length is how far. */
  const cone = (k, o) => {
    const x = o.x;
    const y = o.y;
    const half = k.clamp(o.angle, 4, 359) / 2;
    const len = o.len;
    const big = half > 90 ? 1 : 0;
    const a1 = k.rad(o.dir - half);
    const a2 = k.rad(o.dir + half);
    const path = half >= 179 ? `<circle cx="${x}" cy="${y}" r="${r1(len)}" fill="${o.color}" opacity="${o.alpha}"/>` : `<path d="M${x} ${y} L${r1(x + Math.cos(a1) * len)} ${r1(y + Math.sin(a1) * len)} A${r1(len)} ${r1(len)} 0 ${big} 1 ${r1(x + Math.cos(a2) * len)} ${r1(y + Math.sin(a2) * len)} Z" fill="${o.color}" opacity="${o.alpha}"/>`;
    return path;
  };
  const eye = (k, x, y) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="6" fill="#fff" stroke="#1c1712"/><circle cx="${x + 3}" cy="${y}" r="3" fill="#1c1712"/>`;
  const camFollow = (k, i, x, y, tx, ty) => i === 0 ? k.cam({ x, y, dir: -90, s: 0.5, color: "#666" }) : k.cam({ x, y, dir: (Math.atan2(ty - y, tx - x) * 180) / Math.PI, s: 0.5, color: i === 1 ? "#aaa" : "#fff" }) + (i === 2 ? `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="#fff" stroke-dasharray="2 3" opacity="0.5"/>` : "");

  W.look("focusShift", (v, k) => {
    const d = idx(v, "setting");
    const spd = v.n("speed") / 5;
    const dist = v.n("focusDistance");
    const hx = 76;
    const hy = 91;
    const tx = 120 + Math.min(1, dist / 50) * 160;
    const angle = [16, 44, 100][d];
    const target = v("onto");
    const icon = { "a thought": "\u{1F4AD}", "a person": "\u{1F9CD}", "an object": "\u{1F4E6}", "a goal": "⚑", "a threat": "⚠" }[target] || "★";
    let lines = "";
    for (let i = 0; i < Math.round(spd * 4); i++) lines += `<line x1="${r1(hx + 30 + i * 8)}" y1="122" x2="${r1(hx + 30 + i * 8)}" y2="${r1(128 - spd * 4)}" stroke="#aaa"/>`;
    const mx = (hx + tx) / 2;
    const half = Math.tan(k.rad(angle / 2)) * (mx - hx);
    const arr = d === 1 ? "" : d === 0 ? k.arrow({ x1: mx, y1: hy - half - 18, x2: mx, y2: hy - half + 4, color: GOLD, w: 1.5 }) + k.arrow({ x1: mx, y1: hy + half + 18, x2: mx, y2: hy + half - 4, color: GOLD, w: 1.5 }) : k.arrow({ x1: mx, y1: hy - half + 4, x2: mx, y2: hy - half - 18, color: GOLD, w: 1.5 }) + k.arrow({ x1: mx, y1: hy + half - 4, x2: mx, y2: hy + half + 18, color: GOLD, w: 1.5 });
    return `${k.bg(BG)}${k.floor(130, "#22201c")}${k.title(`Focus ${v("setting")} on ${target}`)}${cone(k, { x: hx, y: hy, angle, len: tx - hx, dir: 0, color: GOLD, alpha: 0.22 })}${arr}${k.person({ x: 70, y: 130, s: 0.55, color: HERO, look: 1 })}${k.text({ x: tx, y: hy + 6, text: icon, size: 18 })}${k.label({ x: tx, y: hy + 20, text: `${dist} m`, size: 7, color: "#aaa" })}${lines}${camFollow(k, idx(v, "cameraFollows"), 296, 140, tx, hy)}${k.pie({ x: 300, y: 30, r: 9, p: v.p("eyesOnIt"), color: GOLD })}${k.label({ x: 286, y: 33, text: `eyes on it ${v.n("eyesOnIt")}%`, size: 8, anchor: "end", color: "#ccc" })}${when(k, v.p("shiftAt"), "shifts at")}${fitCap(k, `Speed ${v.n("speed")}/5 · camera ${v("cameraFollows")}`)}`;
  });

  W.look("focusWidth", (v, k) => {
    const w = idx(v, "setting");
    const ang = v.n("viewAngle");
    const reach = v.n("reach");
    const hx = 76;
    const hy = 91;
    const len = 30 + Math.min(1, reach / 100) * 150;
    const str = v.n("strength") / 5;
    const steer = idx(v, "steersUs");
    const usAng = Math.min(360, ang * [1.6, 1, 0.5][steer]);
    const things = ["\u{1F4E6}", "\u{1F9CD}", "\u{1F3E0}", "\u{1F465}", "\u{1F30D}"];
    const miss = idx(v, "misses");
    const missed = miss ? k.text({ x: 28, y: 126, text: ["", "•", "⚠", "❗"][miss], size: 10 + miss * 4, color: RED }) + k.fitText({ x: 8, y: 152, text: `behind them they miss ${v("misses")}`, size: 7.5, min: 6, w: 160, anchor: "start", color: RED }) : "";
    return `${k.bg(BG)}${k.floor(130, "#22201c")}${k.title(`Focus on ${v("setting")}`)}${cone(k, { x: hx, y: hy, angle: usAng, len: len + 10, dir: 0, color: "#9fd3ff", alpha: 0.12 })}${cone(k, { x: hx, y: hy, angle: ang, len, dir: 0, color: GOLD, alpha: r1((0.1 + str * 0.3) * 100) / 100 })}${k.person({ x: 70, y: 130, s: 0.55, color: HERO, look: 1 })}${k.text({ x: Math.min(270, hx + len * 0.75), y: hy + 6, text: things[w], size: 12 + w * 3 })}${missed}${camFollow(k, idx(v, "camera"), 296, 40, hx, hy)}${k.label({ x: 310, y: 62, text: `camera ${v("camera")}`, size: 7, anchor: "end", color: "#aaa" })}${k.label({ x: 10, y: 34, text: `${ang}° wide, ${reach} m`, size: 8, anchor: "start", color: "#ccc" })}${k.label({ x: 10, y: 46, text: `blue: we see ${steer === 0 ? "more" : steer === 1 ? "the same" : "less"}`, size: 7, anchor: "start", color: "#9fd3ff" })}${when(k, v.p("shiftAt"), "changes at", { x: 186, w: 120, y: 152 })}${fitCap(k, `How firmly ${v.n("strength")}/5 · ${v("setting")}`)}`;
  });

  W.look("cm-focus", (v, k) => {
    const pos = v.p("position");
    const swing = v.n("swing") / 100;
    const ang = 10 + pos * 260;
    const reach = v.n("reach");
    const len = 30 + Math.min(1, reach / 100) * 140;
    const sh = idx(v, "shown");
    const hx = 76;
    const hy = 91;
    const lo = Math.max(10, 10 + (pos - swing) * 260);
    const hi = 10 + Math.min(1, pos + swing) * 260;
    const icon = { "a task": "\u{1F4CB}", "a person": "\u{1F9CD}", "a worry": "\u{1F4AD}", "a goal": "⚑", "everything": "\u{1F30D}" }[v("onWhat")] || "★";
    return `${k.bg(BG)}${k.floor(130, "#22201c")}${k.title(`Held by ${v("onWhat")}`)}${cone(k, { x: hx, y: hy, angle: hi, len: len + 6, dir: 0, color: "#9fd3ff", alpha: 0.1 })}${cone(k, { x: hx, y: hy, angle: lo, len: len + 3, dir: 0, color: "#15151b", alpha: 0.5 })}${cone(k, { x: hx, y: hy, angle: ang, len, dir: 0, color: GOLD, alpha: [0.12, 0.25, 0.45][sh] })}${k.person({ x: 70, y: 130, s: 0.55, color: HERO, look: 1 })}${k.text({ x: Math.min(270, hx + len * 0.75), y: hy + 6, text: icon, size: 16 })}${camFollow(k, idx(v, "cameraFollows"), 296, 40, hx, hy)}${k.label({ x: 310, y: 62, text: `camera ${v("cameraFollows")}`, size: 7, anchor: "end", color: "#aaa" })}${k.label({ x: 10, y: 34, text: `reach ${reach} m · ${v("shown")}`, size: 8, anchor: "start", color: "#ccc" })}${k.label({ x: 10, y: 46, text: `blue band: swings ±${v.n("swing")}`, size: 7, anchor: "start", color: "#9fd3ff" })}${watch(k, 168, 152, v.n("shiftSeconds"), 300, `shift ${secs(v.n("shiftSeconds"))}`)}${when(k, v.p("shiftAt"), "shifts at")}${fitCap(k, `${pos < 0.35 ? "Narrow" : pos > 0.65 ? "Wide" : "Middling"} focus (${v.n("position")})`)}`;
  });

  /* Perspective width: rings of self, family, group, world, each with its people; the lit rings are whose good
     they weigh (those faces smile, the rest are grey). */
  W.look("perspectiveWidth", (v, k) => {
    const w = idx(v, "setting");
    const str = v.n("strength") / 5;
    const names = ["self", "family", "group", "world"];
    const cx = 100;
    const cy = 88;
    const R = [13, 29, 45, 61];
    let rings = "";
    names.forEach((n, i) => {
      rings += k.ring({ x: cx, y: cy, r: R[i], color: i <= w ? GOLD : "#444", w: i === w ? 1.5 + str * 3 : 1, dash: i <= w ? null : "2 3" });
      rings += k.label({ x: cx, y: cy - R[i] + 9, text: n, size: 7, color: i <= w ? GOLD : "#666" });
    });
    /* the people in each ring: 2 family, 4 of the group, 7 of the world, spread round the lower part */
    let folk = "";
    [[1, 2], [2, 4], [3, 7]].forEach(([ring, cnt]) => {
      const rr = (R[ring - 1] + R[ring]) / 2;
      for (let j = 0; j < cnt; j++) {
        const a = k.rad(20 + (140 * (j + 0.5)) / cnt);
        folk += k.face({ x: r1(cx + Math.cos(a) * rr), y: r1(cy + Math.sin(a) * rr), r: 4.5, mood: ring <= w ? 0.6 : 0, eyes: 1, color: ring <= w ? "#d8b48c" : "#6a6a72" });
      }
    });
    const sh = idx(v, "shift");
    const r0 = R[w];
    const shArr = sh === 1 ? "" : k.arrow({ x1: cx + r0 + (sh === 2 ? -4 : 12), y1: cy, x2: cx + r0 + (sh === 2 ? 12 : -4), y2: cy, color: sh === 2 ? GREEN : RED, w: 2 });
    const people = Math.round(Math.log10(Math.max(1, v.n("peopleWeighed"))) * 8) + 1;
    const tested = idx(v, "tested");
    return `${k.bg(BG)}${k.title(`Whose good: ${v("setting")}`)}${rings}${folk}${k.face({ x: cx, y: cy + 2, r: 7, mood: 0.3, eyes: 1, color: "#f0c8a0" })}${shArr}${pips(k, people, 200, 34, "#9fd3ff", 12)}${k.label({ x: 200, y: 28, text: `weighs ${v.n("peopleWeighed")} people`, size: 7, anchor: "start", color: "#aaa" })}${tested ? k.text({ x: 230, y: 92, text: "⚖", size: 10 + tested * 8 }) : ""}${k.label({ x: 250, y: 108, text: `${v("tested")}`, size: 7, color: "#aaa" })}${tag(k, 250, 124, `moved by ${v("triggeredBy")}`)}${k.label({ x: 250, y: 140, text: `shown by ${v("shownTo")}`, size: 7, color: "#aaa" })}${watch(k, 168, 152, v.n("shiftSeconds"), 600, `takes ${secs(v.n("shiftSeconds"))}`)}${when(k, v.p("shiftAt"), "circle moves", { w: 120 })}${fitCap(k, `How firmly ${v.n("strength")}/5 · circle ${v("shift")}`)}`;
  });

  /* Closed to widening mindset: a person behind a wall with a door that slides up as they open; through it, other
     people in the light. The dashed marks are how far it swings between scenes; resisting, they lean away. */
  W.look("cm-perspective", (v, k) => {
    const pos = v.p("position");
    const swing = v.n("swing") / 100;
    const sh = idx(v, "shown");
    const res = v.n("resists") / 5;
    const wx = 124;
    const fy = 130;
    const gapH = (p) => 6 + p * 84;
    const oh = gapH(pos);
    const lo = gapH(Math.max(0, pos - swing));
    const hi = gapH(Math.min(1, pos + swing));
    const lit = k.mix("#2a2a34", "#5a5236", pos);
    let others = "";
    for (let i = 0; i < 3; i++) others += k.person({ x: 152 + i * 22, y: fy, s: 0.36, color: k.mix("#555", ["#7a8a5a", "#a56a8a", "#c07a3a"][i], 0.3 + pos * 0.7), mood: pos * 0.6, look: -1 });
    const light = `<path d="M${wx} ${r1(fy - oh)} L${wx} ${fy} L${r1(wx - 20 - pos * 70)} ${fy} Z" fill="#fff3c4" opacity="${r1((0.05 + pos * 0.25) * [0.5, 0.8, 1][sh] * 100) / 100}"/>`;
    const marks = [lo, hi].map((h) => `<line x1="${wx - 4}" y1="${r1(fy - h)}" x2="${wx + 14}" y2="${r1(fy - h)}" stroke="#9fd3ff" stroke-dasharray="2 2"/>`).join("");
    const wall = `<rect x="${wx}" y="28" width="10" height="${r1(fy - oh - 28)}" fill="#6a6a78" stroke="#1c1712"/>`;
    return `${k.bg(BG)}<rect x="${wx + 10}" y="28" width="90" height="${fy - 28}" fill="${lit}"/>${k.floor(fy, "#22201c")}${k.title(`Opened or closed by ${v("trigger")}`)}${others}${light}${wall}${marks}${k.person({ x: 70, y: fy, s: 0.55, color: HERO, look: 1, lean: -res * 12, arms: res > 0.5 ? -0.6 : 0, mood: pos * 0.6 - 0.2 })}${k.label({ x: 270, y: 50, text: "compared with", size: 7, color: "#888" })}${k.fitText({ x: 270, y: 62, text: v("comparedWith"), size: 8, min: 6.5, w: 92, color: "#ccc" })}${k.fitText({ x: 270, y: 82, text: `${v("shown")} · swings ±${v.n("swing")}`, size: 8, min: 6.5, w: 92, color: "#ccc" })}${k.label({ x: 270, y: 100, text: `resists ${v.n("resists")}/5`, size: 8, color: "#ccc" })}${watch(k, 168, 152, v.n("shiftSeconds"), 600, `shift ${secs(v.n("shiftSeconds"))}`)}${when(k, v.p("shiftAt"), "shifts at")}${fitCap(k, `${pos < 0.35 ? "Closed" : pos > 0.65 ? "Widening" : "In between"} (${v.n("position")})`)}`;
  });

  /* Distraction: a person at their task (a desk in front of them) turns toward the distraction; 0° is straight
     ahead, 90° off to the side (drawn above), 180° behind them. What they miss sits on the floor behind them. */
  W.look("distraction", (v, k) => {
    const pull = v.n("pull") / 5;
    const deg = Math.abs(v.n("pullAngle"));
    const a = k.rad(deg);
    const dist = 26 + Math.min(1, v.n("pullDistance") / 50) * 54;
    const px = 112;
    const fy = 130;
    const hy = 93;
    const dx = k.clamp(px + Math.cos(a) * dist, 16, 200);
    const dy = hy - Math.sin(a) * dist * 0.7;
    const src = v("source");
    const icon = { "a thought": "\u{1F4AD}", "a person": "\u{1F9CD}", "an object": "\u{1F4E6}", "a sound": "\u{1F514}", "a screen": "\u{1F4F1}" }[src] || "★";
    const mi = idx(v, "missed");
    const mx = k.clamp(px - 24 - Math.min(1, v.n("missedNear") / 20) * 60, 22, 90);
    const aud = idx(v, "audienceSees");
    const dur = idx(v, "duration");
    const snap = idx(v, "snapBack");
    const desk = `<rect x="150" y="108" width="54" height="5" fill="#8a6a4a" stroke="#1c1712"/><line x1="156" y1="113" x2="156" y2="${fy}" stroke="#5a4a3a" stroke-width="3"/><line x1="198" y1="113" x2="198" y2="${fy}" stroke="#5a4a3a" stroke-width="3"/><rect x="166" y="102" width="20" height="6" fill="#eee" stroke="#1c1712"/>`;
    const lookSide = Math.cos(a) >= 0 ? 1 : -1;
    const missedThing = mi ? `${aud ? `<circle cx="${r1(mx)}" cy="120" r="12" fill="${GOLD}" opacity="${aud === 2 ? 0.4 : 0.15}"/>` : ""}${k.text({ x: mx, y: 126, text: ["", "•", "⚠", "❗"][mi], size: 10 + mi * 3, color: RED })}` : "";
    return `${k.bg(BG)}${k.title(`Pulled by ${src}`)}${k.floor(fy, "#22201c")}${desk}${k.label({ x: 177, y: 142, text: "the task", size: 7, color: "#888" })}<line x1="${px}" y1="${hy}" x2="${r1(dx)}" y2="${r1(dy)}" stroke="#d58cff" stroke-width="${r1(1 + pull * 4)}" stroke-dasharray="4 3"/>${k.text({ x: dx, y: dy + 6, text: icon, size: 16 })}${missedThing}${k.person({ x: px, y: fy, s: 0.55, color: HERO, look: lookSide, lean: lookSide * -pull * 8, mood: -0.1 })}${k.fitText({ x: 8, y: 152, text: mi ? `behind them they miss ${v("missed")}` : "they miss nothing", size: 8, min: 6.5, w: 150, anchor: "start", color: RED })}${k.label({ x: 260, y: 50, text: `holds them: ${v("duration")}`, size: 8, color: "#ccc" })}${k.meter({ x: 220, y: 60, w: 80, p: (dur + 1) / 4, color: "#d58cff" })}${k.label({ x: 260, y: 90, text: `snaps back: ${v("snapBack")}`, size: 8, color: snap === 3 ? RED : "#ccc" })}${k.label({ x: 260, y: 104, text: `we see it: ${v("audienceSees")}`, size: 8, color: "#ccc" })}${fitCap(k, `Pull ${v.n("pull")}/5 at ${v.n("pullAngle")}°, ${v.n("pullDistance")} m · missed thing ${v.n("missedNear")} m away`)}`;
  });

  /* Fixation: they stare at one thing, rings of grip around it; others may look too; the camera frames it. */
  W.look("fixation", (v, k) => {
    const grip = v.n("grip") / 5;
    const dist = v.n("thingDistance");
    const tx = 90 + Math.min(1, dist / 50) * 160;
    const ty = 80;
    const icon = { "an object": "\u{1F4E6}", "a person": "\u{1F9CD}", "an idea": "\u{1F4A1}", "a sound": "\u{1F514}", "a memory": "\u{1F4AD}" }[v("onWhat")] || "★";
    let rings = "";
    for (let i = 0; i < Math.round(grip * 4); i++) rings += k.ring({ x: tx, y: ty, r: 12 + i * 6, color: GOLD, w: 1 });
    const ret = idx(v, "returns");
    let looks = "";
    for (let i = 0; i < [1, 2, 4, 7][ret]; i++) looks += `<path d="M60 ${78 - i * 3} Q${r1((60 + tx) / 2)} ${40 - i * 6} ${r1(tx - 10)} ${78 - i * 2}" fill="none" stroke="${GOLD}" opacity="0.5"/>`;
    const sh = [0, 1, 3][idx(v, "shared")];
    const weLook = v.n("weLook") / 5;
    const frame = weLook > 0 ? k.frame({ x: tx - 20 - (1 - weLook) * 40, y: ty - 18 - (1 - weLook) * 26, w: 40 + (1 - weLook) * 80, h: 36 + (1 - weLook) * 52, color: "#fff", dash: "4 3", w2: 1 }) : "";
    return `${k.bg(BG)}${k.title(`Fixed on ${v("onWhat")}`)}${looks}${frame}${rings}${k.text({ x: tx, y: ty + 7, text: icon, size: 18 })}${k.label({ x: tx, y: ty + 40, text: `${dist} m away`, size: 7, color: "#aaa" })}${k.person({ x: 50, y: 130, s: 0.5, color: HERO, look: 1, lean: grip * 10 })}${watchers(k, sh, 200, 140, 0)}${k.label({ x: 200, y: 156, text: sh ? `noticed by ${v("shared")}` : "no one notices", size: 7, anchor: "start", color: "#aaa" })}${k.pie({ x: 290, y: 30, r: 10, p: v.p("lookShare"), color: GOLD })}${k.label({ x: 276, y: 34, text: `${v.n("lookShare")}% of the scene`, size: 8, anchor: "end", color: "#ccc" })}${watch(k, 20, 154, v.n("longestLook"), 60, `longest look ${v.n("longestLook")} s`)}${fitCap(k, `Grip ${v.n("grip")}/5 · goes back ${v("returns")} · we look ${v.n("weLook")}/5`)}`;
  });

  /* ---------- dot grids: two settings that pair naturally, dragged together (only where no pad exists) ---------- */
  const PADS = [
    ["arcTest", "size", "hesitation", "How hard the test", "How long they hesitate"],
    ["openQuestions", "setting", "urgency", "Open questions", "Need to know"],
    ["dramaticRole", "strength", "drawsEye", "How strongly", "Pulls our eye"],
    ["cm-role", "strength", "drawsEye", "How strongly", "Pulls our eye"],
    ["dissenter", "cost", "rooting", "What it costs", "We side with them"],
    ["theLie", "grip", "challenged", "Grip", "Life pushes on it"],
    ["wound", "weight", "curiosity", "Drives them", "We want to know"],
    ["relapse", "size", "dread", "How far back", "Dread"],
    ["tickingClock", "timeLeft", "clockSpeed", "Time left", "Clock speed"],
    ["knowledgeGap", "revealAt", "tension", "When the gap closes", "We squirm"],
    ["plotWeight", "screenShare", "lineShare", "Share of the scene", "Share of the lines"],
    ["focusShift", "speed", "eyesOnIt", "Speed", "Eyes on it"],
    ["cm-perspective", "position", "resists", "Closed to widening", "Resists"],
    ["cm-focus", "position", "reach", "Narrow to wide", "Reach"],
    ["fixation", "grip", "weLook", "Grip", "We look too"],
    ["groupPressure", "press", "isolation", "How hard", "Alone in frame"],
    ["resistance", "level", "giveWay", "How hard", "When they give way"],
    ["changeShows", "visible", "signs", "How visible", "Signs"],
  ];
  PADS.forEach(([id, x, y, xLabel, yLabel]) => {
    const spec = W.get(id);
    if (spec && !(spec.faces || []).some((f) => f.face === "pad")) W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
