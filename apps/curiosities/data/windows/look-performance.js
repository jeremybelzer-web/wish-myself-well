/* Performance: the live picture at the top of each performance curiosity's window (CuriosityWindows.look).
   Most pictures have the same three parts, so a beginner learns to read them once:
     - the scene on the left: people, faces and bodies doing the thing, drawn as simply as possible;
     - a dark panel on the right with small gauges and words for the numbers (seconds, meters, per minute);
     - sometimes a timeline under the scene, where a blue block is "the line" being spoken.
   A setting that switches the thing off (none, never, 0) still shows it faint, so the other settings can be
   seen working before it is switched on. */
(function (W) {
  const BG = "#141418";
  const r1 = (n) => Math.round(n * 10) / 10;
  const YEL = "#ffd166";
  const BLUE = "#4a6fa5";
  const ORANGE = "#e0a050";

  /* The right-hand panel: rows of {label, p} meters, {label, text} words or {label, n} tick counts. */
  function side(k, rows, title) {
    let s = `<rect x="214" y="6" width="102" height="152" rx="6" fill="#1d1d22" stroke="#444"/>`;
    let y = 8;
    if (title) (s += k.label({ x: 265, y: 18, text: title, size: 7.5, color: "#999" })), (y = 20);
    rows.filter(Boolean).forEach((r) => {
      if (r.text != null) {
        const t = String(r.text);
        s += k.label({ x: 220, y: y + 7, text: r.label, size: 7, color: "#999", anchor: "start" }) + k.label({ x: 220, y: y + 17, text: t.length > 24 ? t.slice(0, 23) + "…" : t, size: t.length > 18 ? 7 : 8.5, color: "#f2f2f2", anchor: "start", weight: 600 });
      } else if (r.n != null) {
        const n = Math.max(0, Math.round(r.n));
        s += k.label({ x: 220, y: y + 7, text: `${r.label} (${r.show != null ? r.show : n})`, size: 7, color: "#999", anchor: "start" });
        for (let i = 0; i < n; i++) s += `<line x1="${r1(220 + ((i + 0.5) * 90) / n)}" y1="${y + 10}" x2="${r1(220 + ((i + 0.5) * 90) / n)}" y2="${y + 18}" stroke="${r.color || YEL}" stroke-width="${n > 30 ? 1 : 2}"/>`;
        s += `<line x1="220" y1="${y + 18}" x2="310" y2="${y + 18}" stroke="#555"/>`;
      } else s += k.label({ x: 220, y: y + 7, text: r.label, size: 7, color: "#bbb", anchor: "start" }) + k.meter({ x: 220, y: y + 10, w: 90, p: r.p, color: r.color });
      y += 21;
    });
    return s;
  }
  /* A timeline: t0..t1 seconds across w pixels; an optional blue block for the spoken line. Returns {s, X}. */
  function track(k, o) {
    const X = (t) => o.x + k.clamp((t - o.t0) / (o.t1 - o.t0), 0, 1) * o.w;
    let s = `<line x1="${o.x}" y1="${o.y}" x2="${o.x + o.w}" y2="${o.y}" stroke="#666"/>`;
    if (o.line) s += `<rect x="${r1(X(o.line[0]))}" y="${o.y - 5}" width="${r1(Math.max(2, X(o.line[1]) - X(o.line[0])))}" height="10" rx="2" fill="#3d5a80"/>` + k.label({ x: (X(o.line[0]) + X(o.line[1])) / 2, y: o.y + 3, text: o.lineLabel || "the line", size: 7, color: "#dde" });
    if (o.label) s += k.label({ x: o.x, y: o.y - 8, text: o.label, size: 7, color: "#999", anchor: "start" });
    return { s, X };
  }
  /* A small down-pointing marker with words over it. */
  const mark = (k, x, y, color, text) => `<path d="M${r1(x - 4)} ${y - 7} L${r1(x + 4)} ${y - 7} L${r1(x)} ${y} Z" fill="${color || YEL}"/>${text ? k.label({ x, y: y - 9, text, size: 7, color: color || YEL }) : ""}`;
  /* "before the line | on the line | after the line" style words, as seconds against a line from 0 to 2. */
  const when = (p) => -1.2 + 4.4 * p;
  const ghost = (on, svg) => (on ? svg : `<g opacity="0.3">${svg}</g>`);
  const speed = (k, x, y, n, len, color) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => `<line x1="${r1(x - 4)}" y1="${r1(y - 10 + i * 6)}" x2="${r1(x - 4 - len * (0.6 + 0.4 * ((i + 1) % 2)))}" y2="${r1(y - 10 + i * 6)}" stroke="${color || "#9fd3ff"}" stroke-width="1.5" stroke-linecap="round"/>`).join("");
  const pill = (k, x, y, text, color) => `<rect x="${r1(x)}" y="${r1(y - 9)}" width="${r1(String(text).length * 4.6 + 10)}" height="13" rx="6" fill="${color || "#2c2c34"}" stroke="#555"/>` + k.label({ x: x + 5, y, text, size: 8, color: "#eee", anchor: "start" });
  const idx = (v, id, n) => Math.round(v.p(id) * (n - 1));

  /* ---------- Emotion of the beat: a face, its color, who feels it, and the feeling on a timeline ---------- */
  const EMO = { loving: "#e86a9a", joyful: "#ffd166", curious: "#6fd3c4", melancholy: "#5a7bb5", anxious: "#b59a5a", fearful: "#6b5aa8", angry: "#d9483b", triumphant: "#f0a830", absurd: "#b56bd9", dreamlike: "#9ab8e8" };
  W.look("emotion", (v, k) => {
    const em = String(v("setting"));
    const col = EMO[em] || "#888";
    const val = v.n("valence") / 5;
    const ar = v.n("arousal") / 5;
    const mask = idx(v, "masking", 4);
    const shownMood = mask === 3 ? -val : mask === 2 ? val * 0.25 : val;
    const felt = String(v("feltBy"));
    let s = k.bg(BG) + `<rect x="0" y="0" width="210" height="162" fill="${col}" opacity="${r1(0.12 + ar * 0.3)}"/>`;
    if (felt === "the whole room") s += `<rect x="3" y="3" width="204" height="156" fill="none" stroke="${col}" stroke-width="4"/>`;
    /* A second feeling as a slice around the face. */
    const share = (v.n("secondShare") / 100) * [0.35, 0.7, 1][idx(v, "mixed", 3)];
    const second = val >= 0 ? "#5a7bb5" : "#ffd166";
    s += `<circle cx="70" cy="66" r="47" fill="${col}"/>` + k.pie({ x: 70, y: 66, r: 47, p: share, color: second }).replace('fill="#3a3a40"', `fill="${col}"`);
    if (felt === "the speaker") s += k.ring({ x: 70, y: 66, r: 52, color: "#fff", w: 2, dash: "4 3" });
    s += k.face({ x: 70, y: 66, r: 40, mood: shownMood, eyes: 0.35 + ar * 0.65, mouth: ar > 0.6 && shownMood > 0 ? (ar - 0.6) * 2 : 0, brows: mask === 2 ? 0 : shownMood * 0.6 - ar * 0.3 });
    if (ar > 0.5) s += [0, 1, 2].map((i) => `<path d="M${118 + i * 4} ${30 + i * 10} l6 -3" stroke="#fff" stroke-width="1.5"/>`).join("");
    if (mask === 1) s += k.hand({ x: 70, y: 98, s: 1.3, open: 1 });
    if (mask === 2) s += `<rect x="30" y="90" width="80" height="8" fill="#1c1712" opacity="0.7"/>` + k.label({ x: 70, y: 117, text: "bottled up", size: 8, color: "#ccc" });
    if (mask === 3) s += k.face({ x: 132, y: 26, r: 12, mood: val, eyes: 0.6 }) + k.label({ x: 132, y: 47, text: "inside", size: 7, color: "#ccc" }) + [0, 1].map((i) => `<circle cx="${112 - i * 7}" cy="${38 + i * 6}" r="${2.5 - i}" fill="#ddd"/>`).join("");
    /* The listener, small, at the right of the scene. */
    s += k.person({ x: 170, y: 118, s: 0.75, color: "#777", mood: felt === "the listener" ? val : 0, alpha: 0.9 });
    if (felt === "the listener") s += k.ring({ x: 170, y: 82, r: 14, color: "#fff", w: 2, dash: "4 3" });
    /* The feeling on a timeline: it lands before or after the line, and lasts. */
    const t = track(k, { x: 10, y: 142, w: 195, t0: -6, t1: 30, line: [0, 3], label: "the feeling (bar) against the line" });
    const a = v.n("landsAt");
    const len = v.n("lastsFor");
    s += t.s + `<rect x="${r1(t.X(a))}" y="150" width="${r1(Math.max(2, t.X(a + len) - t.X(a)))}" height="6" rx="3" fill="${col}"/>` + (a + len > 30 ? k.label({ x: 203, y: 132, text: `${len} s ›`, size: 7, color: col, anchor: "end" }) : "");
    /* How fast the feeling turns, and the audience. */
    const sp = idx(v, "shiftSpeed", 3);
    const pts = Array.from({ length: 13 }, (_, i) => { const x = i / 12; return sp === 0 ? x : sp === 1 ? 1 / (1 + Math.exp(-(x - 0.5) * 10)) : x < 0.5 ? 0.05 : 0.95; });
    s += side(k, []) + k.label({ x: 265, y: 18, text: "how it turns", size: 7.5, color: "#999" }) + `<rect x="222" y="24" width="86" height="40" fill="#141418"/>` + k.graph({ x: 224, y: 26, w: 82, h: 36, points: pts, color: col });
    const aud = idx(v, "audienceShare", 3);
    s += k.label({ x: 265, y: 80, text: "the audience", size: 7.5, color: "#999" });
    for (let i = 0; i < 4; i++) s += k.face({ x: 230 + i * 23, y: 98, r: 9, mood: aud === 0 ? 0 : val * (aud === 1 ? 0.4 : 1), eyes: 0.7, color: aud === 2 ? k.mix("#f0c8a0", col, 0.35) : "#c9b8a6" });
    if (felt === "the audience") s += `<rect x="219" y="85" width="92" height="26" rx="5" fill="none" stroke="#fff" stroke-dasharray="4 3" stroke-width="2"/>`;
    s += k.label({ x: 265, y: 124, text: String(v("audienceShare")), size: 7, color: "#ddd" }) + k.label({ x: 265, y: 140, text: `felt by ${felt}`, size: 7, color: "#ddd" }) + k.label({ x: 265, y: 151, text: String(v("mixed")), size: 7, color: "#ddd" });
    return s + k.caption(`${em}: ${val > 0.2 ? "happy" : val < -0.2 ? "unhappy" : "neither"}, ${ar > 0.6 ? "wound up" : ar > 0.2 ? "stirred" : "calm"}, ${v("masking")}`);
  });

  /* ---------- Character path: a map of the room from above, with the walk drawn on it ---------- */
  W.look("characterPath", (v, k) => {
    const still = String(v("setting")) === "still";
    const shape = still ? "cross" : String(v("setting"));
    const S = [50, 90];
    const O = [150, 62];
    const L = 18 + 100 * (0.25 + 0.75 * v.p("length")) * (0.35 + 0.65 * v.p("pathMeters"));
    const toO = Math.atan2(O[1] - S[1], O[0] - S[0]);
    let P = [S];
    const at = (a, d) => [S[0] + Math.cos(a) * d, S[1] + Math.sin(a) * d];
    if (shape === "cross") P = [S, [S[0] + L * 0.5, S[1] + 6], [S[0] + L, S[1]]];
    if (shape === "approach") P = [S, at(toO, L * 0.5), at(toO, L)];
    if (shape === "retreat") P = [S, at(toO + Math.PI, L * 0.4), at(toO + Math.PI, L * 0.8)];
    if (shape === "circle") P = Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i / 8) * Math.PI * 1.6; const R = 30 + L * 0.2; return [O[0] + Math.cos(a) * R + 10, O[1] + Math.sin(a) * R * 0.8 + 20]; });
    /* Where they end up, and how far from the other person. */
    const gap = 6 + v.n("endGap") * 5;
    const end = String(v("endMark"));
    const last = P[P.length - 1];
    if (end === "same place") P.push(S);
    if (end === "nearer someone") P.push([O[0] - gap, O[1] + 4]);
    if (end === "further away") P.push([Math.max(14, last[0] - 30), Math.min(132, last[1] + 30)]);
    if (end === "off screen") P.push([214, last[1]]);
    /* Smooth, stopping and starting, or erratic: subdivide and shake. */
    const sm = idx(v, "smoothness", 3);
    const Q = [];
    P.forEach((p, i) => {
      if (i === 0) return Q.push(p);
      const q = P[i - 1];
      for (let j = 1; j <= 4; j++) {
        const f = j / 4;
        const n = sm === 2 ? (k.rnd(i * 7 + j) - 0.5) * 16 : 0;
        Q.push([q[0] + (p[0] - q[0]) * f + n, q[1] + (p[1] - q[1]) * f + n * 0.7]);
      }
    });
    const pur = String(v("purpose"));
    const col = { wandering: "#9fb4cc", "going somewhere": YEL, fleeing: "#ff6b5a", chasing: "#ff9f40" }[pur];
    const line = (pts, dash, op) => `<polyline points="${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ")}" fill="none" stroke="${col}" stroke-width="2.5" ${dash ? `stroke-dasharray="${dash}"` : ""} opacity="${r1(op * (still ? 0.3 : 1))}" stroke-linejoin="round"/>`;
    let s = k.bg(BG) + `<rect x="6" y="6" width="204" height="140" rx="4" fill="#26262c" stroke="#444"/>`;
    const rel = String(v("pathRelative"));
    s += `<rect x="8" y="30" width="6" height="30" fill="${rel === "a door or object" ? YEL : "#6b4a2b"}"/>` + k.label({ x: 22, y: 26, text: "door", size: 7, color: "#aaa" });
    if (rel === "the room") s += `<rect x="9" y="9" width="198" height="134" fill="none" stroke="${YEL}" stroke-dasharray="4 3"/>`;
    s += k.ring({ x: O[0], y: O[1], r: gap, color: "#666", w: 1, dash: "3 3" }) + k.dot({ x: O[0], y: O[1], r: 7, color: "#5a9fd0" }) + k.label({ x: O[0], y: O[1] - 10, text: "them", size: 8, color: rel === "the other character" ? YEL : "#aaa" });
    /* Repeats: a second pass, or back and forth. */
    const rep = idx(v, "pathRepeat", 3);
    if (rep >= 1) s += `<g transform="translate(0 6)">${line(rep === 2 ? Q.slice().reverse() : Q, "4 3", 0.6)}</g>`;
    if (rep === 2) s += `<g transform="translate(0 12)">${line(Q, "4 3", 0.4)}</g>`;
    s += line(Q, sm === 1 ? "10 5" : "", 1);
    if (sm === 1) s += Q.filter((_, i) => i % 4 === 0 && i).map((p) => k.dot({ x: p[0], y: p[1], r: 2.5, color: "#fff" })).join("");
    const E = Q[Q.length - 1];
    const E2 = Q[Q.length - 2] || S;
    s += ghost(!still, k.arrow({ x1: E2[0], y1: E2[1], x2: E[0], y2: E[1], color: col, w: 2 }));
    if (still) s += k.label({ x: 108, y: 22, text: "stays still: the walk is shown faint", size: 8, color: "#aaa" });
    if (pur === "going somewhere") s += `<line x1="${r1(E[0])}" y1="${r1(E[1])}" x2="${r1(E[0])}" y2="${r1(E[1] - 14)}" stroke="#ddd"/><path d="M${r1(E[0])} ${r1(E[1] - 14)} l9 3 l-9 3 Z" fill="${YEL}"/>`;
    if (pur === "fleeing") s += k.dot({ x: S[0] - 16, y: S[1] + 8, r: 5, color: "#c0392b" }) + k.label({ x: S[0] - 16, y: S[1] + 22, text: "threat", size: 7, color: "#e88" });
    if (pur === "chasing") s += k.dot({ x: E[0] + 12, y: E[1] - 6, r: 4, color: "#7fd18b" });
    /* The walker, and how much they pull the eye. */
    const pull = v.p("pullOfEye");
    s += `<circle cx="${S[0]}" cy="${S[1]}" r="${r1(10 + pull * 12)}" fill="${YEL}" opacity="${r1(0.08 + pull * 0.35)}"/>` + k.dot({ x: S[0], y: S[1], r: 7, color: ORANGE }) + k.label({ x: S[0], y: S[1] + 18, text: "walker", size: 8, color: "#ddd" });
    /* The camera, at the bottom, and the walk's direction against it. */
    const hd = k.rad(v.n("pathHeading") - 90);
    s += k.cam({ x: 108, y: 136, dir: -90, s: 0.55, color: rel === "the camera" ? YEL : "#e2e2e2" }) + k.arrow({ x1: 108, y1: 136, x2: 108 + Math.cos(hd) * 22, y2: 136 + Math.sin(hd) * 22, color: "#9fd3ff", w: 1.5 });
    const tm = idx(v, "pathTiming", 3);
    s += side(k, [{ label: "When they set off", text: v("pathTiming") }, { label: "Moving relative to", text: rel }, { label: "Meters walked", text: `${v.n("pathMeters")} m` }, { label: `Seconds: ${v.n("pathSeconds")} s`, p: v.p("pathSeconds"), color: "#9fd3ff" }, { label: `Ends ${v.n("endGap")} m from them`, p: v.p("endGap") }, { label: "Heading vs camera", text: `${v.n("pathHeading")}°` }]);
    const t = track(k, { x: 10, y: 156, w: 196, t0: -2, t1: 5, line: [0, 2] });
    s += t.s + mark(k, t.X(when(tm / 2)), 150, col, "");
    return s + k.caption(still ? "stays still" : `${shape}, ${pur}, ${v("smoothness")}, ends ${end}`);
  });

  /* ---------- Body in frame: the frame, and someone already in it, coming in or going out ---------- */
  W.look("bodyEnter", (v, k) => {
    const mode = String(v("setting"));
    const side_ = String(v("side"));
    const sz = k.clamp(v.n("entryHeight") / 60, 0.15, 3.2);
    const d = Math.max(0.3, v.n("entryDistance"));
    const feet = k.clamp(150 - 30 / Math.sqrt(d) * 0 - Math.log(d + 1) * 10, 92, 158);
    const spd = idx(v, "speed", 3);
    const reveal = v.p("reveal");
    const thr = String(v("throughWhat"));
    let x = 105;
    let y = feet;
    let dir = [0, 0];
    if (mode !== "already") {
      if (side_ === "left") (x = 18), (dir = [1, 0]);
      if (side_ === "right") (x = 192), (dir = [-1, 0]);
      if (side_ === "top") (y = Math.min(feet, 60)), (dir = [0, 1]);
      if (side_ === "bottom") (y = 190), (dir = [0, -1]);
      if (side_ === "toward the lens") (y = 175), (dir = [0, 0]);
      if (mode === "leaves") dir = [-dir[0], -dir[1]];
    }
    let s = k.bg(BG) + `<clipPath id="cw-bodyEnter-clip"><rect x="6" y="6" width="198" height="140"/></clipPath><g clip-path="url(#cw-bodyEnter-clip)">` + k.wall({ y: 100, color: "#4a4f5c", floor: "#3a3128" });
    s += `<circle cx="${x}" cy="${y - 60 * sz}" r="${r1(30 + reveal * 50)}" fill="${YEL}" opacity="${r1(reveal * 0.3)}"/>`;
    if (thr === "a door") s += `<rect x="${x < 105 ? 8 : 172}" y="40" width="30" height="62" fill="#2a1e12" stroke="#6b4a2b" stroke-width="3"/>`;
    const fig = k.person({ x, y, s: side_ === "toward the lens" && mode !== "already" ? sz * 1.8 : sz, color: BLUE, walk: mode === "already" ? 0 : 0.6 + spd * 0.2, lean: dir[0] * spd * 6, mood: 0.2 });
    s += thr === "out of the blur" ? `<g opacity="0.45">${fig}</g>` + k.ring({ x, y: y - 40 * sz, r: 30 * sz, color: "#ccc", w: 6, dash: "1 5" }) : fig;
    if (thr === "from behind something") s += `<rect x="${x - 22}" y="${y - 45 * sz}" width="44" height="${45 * sz + 4}" fill="#4d6b3b" stroke="#1c1712" stroke-width="2"/>` + k.label({ x, y: y - 45 * sz - 4, text: "plant", size: 7, color: "#ccc" });
    if (mode === "already") {
      const g = { left: [24, 90, 1, 0], right: [186, 90, -1, 0], top: [105, 18, 0, 1], bottom: [105, 140, 0, -1], "toward the lens": [105, 130, 0, 0] }[side_] || [24, 90, 1, 0];
      s += ghost(false, g[2] || g[3] ? k.arrow({ x1: g[0] - g[2] * 14, y1: g[1] - g[3] * 14, x2: g[0] + g[2] * 16, y2: g[1] + g[3] * 16, color: YEL, w: 3 }) : k.ring({ x: g[0], y: g[1], r: 14, color: YEL, w: 3 })) + k.label({ x: k.clamp(g[0], 40, 170), y: g[1] + (g[3] > 0 ? 26 : -12), text: `the ${side_} side`, size: 7, color: "#888" });
    }
    if (mode !== "already" && (dir[0] || dir[1])) s += k.arrow({ x1: x - dir[0] * 10, y1: y - 50 * sz - dir[1] * 10, x2: x + dir[0] * (26 + spd * 14), y2: y - 50 * sz + dir[1] * (26 + spd * 14), color: YEL, w: 1.5 + spd });
    if (spd === 2) s += speed(k, x - dir[0] * 14, y - 50 * sz, 3, 18);
    const ann = idx(v, "announce", 3);
    if (ann === 1) s += [0, 1, 2].map((i) => k.label({ x: 40 + i * 22, y: 136 - (i % 2) * 6, text: "tap", size: 8, color: "#bbb" })).join("");
    if (ann === 2) s += k.bubble({ x: 150, y: 30, text: "Hello?", w: 60, h: 22, size: 10, tail: side_ === "left" ? -30 : 20 });
    s += `</g><rect x="6" y="6" width="198" height="140" fill="none" stroke="#ddd" stroke-width="2"/>`;
    const t = track(k, { x: 10, y: 156, w: 196, t0: -6, t1: 5, line: [0, 2] });
    const at = [-1, 0.2, 1, 3][idx(v, "entryTiming", 4)];
    s += t.s + `<rect x="${r1(t.X(at - v.n("holdBefore")))}" y="152" width="${r1(t.X(at) - t.X(at - v.n("holdBefore")))}" height="8" fill="#555"/>` + mark(k, t.X(at), 151, YEL, "");
    s += side(k, [{ label: "When they arrive", text: v("entryTiming") }, { label: `Empty frame first: ${v.n("holdBefore")} s`, p: v.p("holdBefore"), color: "#999" }, { label: `Seconds to come in: ${v.n("crossSeconds")}`, p: v.p("crossSeconds"), color: "#9fd3ff" }, { label: "Heard first", text: v("announce") }, { label: "Comes in through", text: thr }, { label: "Distance from camera", text: `${d} m` }, { label: "How big a moment", p: reveal }]);
    return s + k.caption(`${mode}${mode === "already" ? " in the frame" : ` from the ${side_}`}, ${v("speed")}`);
  });

  /* ---------- Silence length: two people, the pause between their lines, and how it feels ---------- */
  W.look("silence", (v, k) => {
    const on = idx(v, "setting", 3);
    const sec = v.n("seconds");
    const ten = idx(v, "tension", 3);
    const mood = [0.3, -0.25, -0.7][ten];
    const fill = String(v("filled"));
    const br = String(v("breaker"));
    let s = k.bg(BG) + k.wall({ y: 112, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    if (fill === "room sound") s += k.wave({ x: 10, y: 30, w: 190, h: 14, amp: 0.6, cycles: 14, noise: 0.5, color: "#556" });
    s += k.person({ x: 50, y: 140, s: 1.05, color: ORANGE, mood, look: 1, arms: fill === "action" ? 0.4 : 0 }) + k.person({ x: 160, y: 140, s: 1.05, color: "#5a9fd0", mood, look: -1 });
    if (fill === "breath") s += [0, 1].map((i) => `<path d="M${68 + i * 6} ${64 - i * 3} q4 -3 8 0" fill="none" stroke="#ccd" stroke-width="1.5"/>`).join("");
    if (fill === "action") s += `<rect x="70" y="${84}" width="10" height="12" fill="#ddd" stroke="#1c1712"/>` + k.label({ x: 75, y: 80, text: "cup", size: 7, color: "#ccc" });
    if (ten >= 1) s += [0, 1, 2].slice(0, ten === 1 ? 1 : 3).map((i) => `<path d="M${152 + i * 12} ${50 - i * 2} q-3 6 0 8 q3 -2 0 -8" fill="#9fd3ff"/>`).join("");
    /* The silence: dots in the air between them, more for longer. */
    const dots = ["", "·", "· · ·"][on];
    s += ghost(on > 0, k.bubble({ x: 105, y: 36, text: dots || "·", w: 40 + on * 12, h: 22, size: 14, tail: 0 }));
    /* Who breaks it and how. */
    const bw = idx(v, "breakWith", 3);
    const bx = br === "the speaker" ? 50 : br === "the listener" ? 160 : 105;
    const word = ["mm…", "So…", "HEY!"][bw];
    if (br === "something else") s += k.label({ x: 105, y: 104, text: "☎ ring!", size: 9 + bw * 3, color: YEL, weight: 700 });
    else s += k.label({ x: bx, y: 66, text: word, size: 8 + bw * 4, color: bw === 2 ? "#ff6b5a" : "#eee", weight: 700 });
    /* The timeline: the line, the gap, the answer; the gap sits where it falls. */
    const pl = String(v("placement"));
    const gapX = sec;
    const t = track(k, { x: 10, y: 154, w: 196, t0: 0, t1: 26, label: `silence: ${sec} s, ${pl}` });
    let a0 = 1;
    const blocks = pl === "mid-line" ? [[a0, a0 + 2, ORANGE], [a0 + 2 + gapX, a0 + 4 + gapX, ORANGE], [a0 + 4.5 + gapX, a0 + 7 + gapX, "#5a9fd0"]] : pl === "after the punchline" ? [[a0, a0 + 3, ORANGE], [a0 + 3.3, a0 + 5, "#5a9fd0"], [a0 + 5 + gapX, a0 + 7 + gapX, ORANGE]] : [[a0, a0 + 3, ORANGE], [a0 + 3 + gapX, a0 + 6 + gapX, "#5a9fd0"]];
    s += t.s + blocks.map((b) => `<rect x="${r1(t.X(b[0]))}" y="150" width="${r1(Math.max(1, t.X(b[1]) - t.X(b[0])))}" height="8" rx="2" fill="${b[2]}"/>`).join("");
    s += side(k, [{ label: "Silence", text: `${v("setting")}, ${sec} s` }, { label: "Feels", text: v("tension") }, { label: "Filled with", text: fill }, { label: "Broken by", text: `${br}: ${v("breakWith")}` }, { label: "Silences a minute", n: v.n("silenceRate"), color: "#9fd3ff" }, { label: `Share in silence: ${v.n("silenceShare")}%`, p: v.p("silenceShare"), color: "#999" }]);
    return s + k.caption(`${v("setting")} silence, ${v("tension")}`);
  });

  /* ---------- Face acting: one big face with every part set ---------- */
  W.look("faceLens", (v, k) => {
    const amp = [0.1, 0.35, 0.65, 0.85, 1][idx(v, "expression", 5)];
    const brows = (v.p("brows") * 2 - 1) * (0.4 + amp * 0.6);
    const eyeI = idx(v, "eyes", 5);
    const mouthI = idx(v, "mouth", 5);
    const mood = [-0.5, 0, 0.8, 0.3, 0.3][mouthI] * (0.4 + amp * 0.6);
    const mo = [0, 0, 0, 0.45, 1][mouthI] * (0.4 + amp * 0.6);
    const r = 14 + v.p("faceHeight") * 46;
    const cx = 92;
    const cy = 78;
    const lookAt = String(v("lookingAt"));
    const off = v.n("eyelineOff") / 90;
    const look = lookAt === "the camera" ? 0 : lookAt === "an object" ? -off - 0.2 : lookAt === "nothing" ? off * 0.5 : off + 0.2;
    const turn = v.n("faceTurn");
    const tilt = v.n("faceTilt");
    const sided = idx(v, "sided", 3);
    let s = k.bg(BG) + `<rect x="6" y="6" width="198" height="150" fill="#2a2f3a"/>`;
    s += `<rect x="${r1(cx - r * 1.4)}" y="${r1(cy - r * 1.4)}" width="${r1(r * 2.8)}" height="${r1(r * 2.8)}" fill="none" stroke="#555" stroke-dasharray="3 3"/>`;
    const f = k.face({ x: 0, y: 0, r, mood, brows, eyes: [0, 0.35, 0.8, 1, 1][eyeI], mouth: mo, look });
    s += `<g transform="translate(${cx} ${cy}) rotate(${r1(-tilt * 0.4)}) skewY(${sided * 6}) scale(${r1(Math.max(0.35, Math.cos(k.rad(turn))))} 1)">${f}${eyeI === 4 ? [-1, 1].map((sd) => k.ring({ x: sd * r * 0.38, y: -r * 0.15, r: r * 0.2, color: "#1c1712", w: 1.5 })).join("") : ""}</g>`;
    const nz = r * 0.12;
    s += `<path d="M${r1(cx + Math.sin(k.rad(turn)) * r * 0.45)} ${r1(cy - nz)} l${r1(turn >= 0 ? nz : -nz)} ${r1(nz * 1.6)} l${r1(turn >= 0 ? -nz : nz)} ${r1(nz * 0.4)}" fill="none" stroke="#1c1712" stroke-width="1.5"/>`;
    /* What the face is aimed at. */
    if (lookAt === "the other person") s += k.person({ x: 186, y: 140, s: 0.6, color: "#777" });
    if (lookAt === "an object") s += `<rect x="16" y="120" width="14" height="16" fill="#ddd" stroke="#1c1712"/>`;
    if (lookAt === "the camera") s += k.cam({ x: 186, y: 22, dir: 180, s: 0.5 });
    if (lookAt === "nothing") s += k.label({ x: 186, y: 30, text: "…", size: 14, color: "#888" });
    /* Darting eyes, blinks, a feeling leaking out. */
    const darts = idx(v, "darts", 3);
    s += [0, 1, 2, 3, 4].slice(0, [0, 2, 5][darts]).map((i) => k.arrow({ x1: cx + r * 0.5 + 4, y1: cy - r * 0.6 - i * 6, x2: cx + r * 0.5 + 14 + (i % 2) * 6, y2: cy - r * 0.6 - i * 6 - 3, color: "#9fd3ff", w: 1 })).join("");
    const leak = idx(v, "leak", 3);
    if (leak) s += `<circle cx="${cx - r - 6}" cy="${cy - r * 0.6}" r="${leak * 4}" fill="#ff6b5a" opacity="${leak * 0.4}"/>` + k.label({ x: cx - r - 6, y: cy - r * 0.6 - 10, text: "true feeling", size: 7, color: "#ff9a8a" });
    const sp = idx(v, "changeSpeed", 3);
    const pts = Array.from({ length: 13 }, (_, i) => { const x = i / 12; return sp === 0 ? x : sp === 1 ? 1 / (1 + Math.exp(-(x - 0.5) * 10)) : x < 0.5 ? 0.05 : 0.95; });
    s += side(k, [{ label: "Blinks", n: v.n("blinks") }, { label: "Mouth shapes (lip sync)", n: v.n("lipSync"), color: "#ff9a8a" }, { label: "Reaction lands", text: v("faceTiming") }, { label: "Aimed at", text: lookAt }, { label: "Turn · tilt · eyeline", text: `${turn}° · ${tilt}° · ${v.n("eyelineOff")}°` }]);
    s += k.label({ x: 265, y: 120, text: `changes: ${v("changeSpeed")}`, size: 7, color: "#999" }) + `<rect x="222" y="124" width="86" height="28" fill="#141418"/>` + k.graph({ x: 224, y: 126, w: 82, h: 24, points: pts, color: "#ff9a8a" });
    return s + k.caption(`${v("expression")}: brows ${v("brows")}, eyes ${v("eyes")}, mouth ${v("mouth")}`);
  });

  /* ---------- Character speed: someone moving across, with the trail of where they were ---------- */
  W.look("characterSpeed", (v, k) => {
    const sp = v.p("setting");
    const mps = v.n("speedMps");
    const ease = idx(v, "easing", 3);
    const feel = idx(v, "feelsLike", 5);
    const n = 5 + Math.round(sp * 4);
    const step = 8 + v.p("speedMps") * 18;
    let s = k.bg(BG) + k.wall({ y: 118, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    /* Someone or something to compare against. */
    const vs = String(v("speedVs"));
    const cmp = idx(v, "contrast", 5);
    const other = step * [1.9, 1.4, 1, 0.65, 0.4][cmp];
    if (vs === "the camera") s += k.cam({ x: 30 + other * 3, y: 30, s: 0.6 }) + k.arrow({ x1: 20, y1: 44, x2: 24 + other * 3, y2: 44, color: "#aaa", w: 1.2 });
    if (vs === "the other characters" || vs === "the crowd") for (let i = 0; i < (vs === "the crowd" ? 4 : 1); i++) s += k.person({ x: 20 + other * 3 + i * 16, y: 112 - i * 3, s: 0.5, color: "#666", walk: 0.3 }) + (i === 0 ? k.arrow({ x1: 14 + i * 16, y1: 50, x2: 16 + other * 3, y2: 50, color: "#777", w: 1.2 }) : "");
    if (vs === "their usual pace") s += k.person({ x: 30 + other * 3, y: 112, s: 0.55, color: BLUE, alpha: 0.3 }) + k.label({ x: 30 + other * 3, y: 48, text: "usual", size: 7, color: "#999" });
    /* The trail: even, speeding up or slowing down. */
    let x = 16;
    const xs = [];
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      xs.push(x);
      x += step * (ease === 0 ? 1 : ease === 1 ? 0.4 + f * 1.4 : 1.6 - f * 1.3) * (0.5 + 0.5 * (1 - v.p("rampSeconds") * (f < 0.3 ? 1 : 0)));
    }
    const sc = 190 / Math.max(190, xs[xs.length - 1]);
    const bursts = [0, 1, 3][idx(v, "bursts", 3)];
    xs.forEach((xx, i) => {
      const X = 10 + xx * sc;
      if (i < xs.length - 1) s += k.dot({ x: X, y: 146, r: 3, color: YEL });
      if (i > 0 && i <= bursts) s += k.label({ x: 10 + xs[i * 2 - 1 < xs.length ? i * 2 - 1 : i] * sc, y: 136, text: "✸", size: 12, color: "#ff6b5a" });
    });
    const px = 10 + xs[xs.length - 1] * sc;
    const lean = [-4, 2, 8, 14, 20][feel];
    s += speed(k, px - 10, 98, 1 + Math.round(sp * 4), 12 + sp * 20) + k.person({ x: px, y: 140, s: 1, color: BLUE, walk: 0.3 + sp * 0.7, lean, mood: [0.2, 0.3, 0.1, -0.3, -0.7][feel], arms: feel === 4 ? 0.8 : 0 });
    s += side(k, [{ label: "Speed", text: `${v("setting")} of 5 · ${mps} m/s` }, { label: `Full speed after ${v.n("rampSeconds")} s`, p: v.p("rampSeconds"), color: "#9fd3ff" }, { label: `Crosses the frame in ${v.n("crossFrame")} s`, p: v.p("crossFrame"), color: "#999" }, { label: "Reads as", text: v("feelsLike") }, { label: "Against others", text: v("contrast") }, { label: "Compared with", text: vs }]);
    return s + k.caption(`${v("feelsLike")}, ${v("easing")}, bursts ${v("bursts")}`);
  });

  /* ---------- Toward the lens: what the camera sees, from where they start to where they stop ---------- */
  W.look("characterToLens", (v, k) => {
    const dir = String(v("setting"));
    const sz = (m) => k.clamp(2.2 / Math.sqrt(Math.max(0.1, m)), 0.25, 4.5);
    const sStart = sz(v.n("startMeters"));
    const sEnd = sz(v.n("endMeters")) * (0.6 + v.p("distance") * 0.5) * (0.7 + v.p("arrival") * 0.6);
    const ang = v.n("angle");
    const eyeH = v.n("eyeHeight");
    const [a, b] = dir === "away" ? [sEnd, sStart] : [sStart, sEnd];
    const xa = 105 + (dir === "across" ? -70 : ang * 0.9);
    const xb = dir === "across" ? 170 : 105 + ang * 0.15;
    let s = k.bg(BG) + `<clipPath id="cw-characterToLens-clip"><rect x="0" y="0" width="210" height="162"/></clipPath><g clip-path="url(#cw-characterToLens-clip)">` + k.wall({ y: 92, color: "#3c414d", floor: "#2e2822" });
    const conf = v.p("confront");
    s += `<rect x="0" y="0" width="210" height="162" fill="#c0392b" opacity="${r1(conf * 0.2)}"/>`;
    s += k.person({ x: xa, y: 110 + a * 10, s: a, color: "#777", alpha: 0.4 });
    const feetB = 110 + b * 10 - eyeH * 12;
    const look = k.clamp(v.n("eyelineMiss") / 45, 0, 1) * 0.9;
    const eyeL = idx(v, "eyeLine", 3);
    s += k.person({ x: xb, y: feetB, s: b, color: BLUE, mood: -conf * 0.5, look: eyeL === 2 ? look * 0.3 : eyeL === 1 ? look : 1, eyes: 0.8 });
    s += k.arrow({ x1: xa, y1: 60, x2: xb + (xa < xb ? -10 : 10), y2: 60, color: YEL, w: 1.5 + idx(v, "approachSpeed", 3) });
    s += speed(k, xa + 10, 60, idx(v, "approachSpeed", 3) * 2, 14);
    /* The lens height: a dashed line across. */
    s += `<line x1="0" y1="70" x2="210" y2="70" stroke="#9fd3ff" stroke-dasharray="4 4" opacity="0.6"/>` + k.label({ x: 6, y: 66, text: "lens height", size: 7, color: "#9fd3ff", anchor: "start" });
    if (eyeL === 2) s += k.ring({ x: xb, y: feetB - 66 * b, r: 12 * b, color: "#fff", w: 1.5, dash: "2 2" });
    s += `</g>`;
    s += side(k, [{ label: "Starts", text: `${v.n("startMeters")} m from camera` }, { label: "Stops", text: `${v.n("endMeters")} m · ${v("arrival")}` }, { label: `Angle of approach ${ang}°`, p: ang / 90 }, { label: "Into the lens", text: `${v("eyeLine")}, misses by ${v.n("eyelineMiss")}°` }, { label: "Eyes vs lens", text: `${eyeH > 0 ? "+" : ""}${eyeH} m` }, { label: `Move takes ${v.n("moveSeconds")} s`, p: v.p("moveSeconds"), color: "#9fd3ff" }, { label: "Feels", text: v("confront") }]);
    return s + k.caption(`${dir}, ${v("approachSpeed")}, near ${v("distance")} of 5`);
  });

  /* ---------- Who moves: the speaker and the listener, and the one who moves ---------- */
  W.look("whoMoves", (v, k) => {
    const who = String(v("setting"));
    const pw = idx(v, "power", 3);
    const L = 12 + v.p("moveMeters") * 60;
    const spMoves = who === "speaker" || who === "both";
    const liMoves = who === "listener" || who === "both";
    const size = (m) => (m ? [0.8, 1, 1.25][pw] : 1);
    let s = k.bg(BG) + k.wall({ y: 118, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    const still = v.p("stillContrast");
    const stillOne = spMoves && !liMoves ? 150 : liMoves && !spMoves ? 55 : null;
    if (stillOne) s += `<circle cx="${stillOne}" cy="95" r="${r1(20 + still * 20)}" fill="#fff" opacity="${r1(still * 0.18)}"/>`;
    s += k.person({ x: 55, y: 146, s: size(spMoves), color: ORANGE, mood: 0, look: 1, lean: spMoves ? 8 : 0, label: "speaker" });
    s += k.person({ x: 150, y: 146, s: size(liMoves), color: "#5a9fd0", mood: 0, look: -1, lean: liMoves ? -8 : 0, label: "listener" });
    if (spMoves) s += k.arrow({ x1: 40, y1: 40, x2: 40 + L, y2: 40, color: YEL, w: 2.5 });
    if (liMoves) s += k.arrow({ x1: 166, y1: 52, x2: 166 - L, y2: 52, color: YEL, w: 2.5 });
    if (who === "neither") s += k.label({ x: 105, y: 40, text: "nobody moves", size: 10, color: "#aaa" });
    const tr = idx(v, "trades", 3);
    if (tr) s += k.label({ x: 105, y: 22, text: tr === 1 ? "⇄ swaps once" : "⇄ ⇄ ⇄ back and forth", size: 9, color: "#9fd3ff" });
    /* From above: where the mover ends, around the other and how far away. */
    const ca = k.rad(v.n("circleAround") - 90);
    const R = 8 + v.p("endGap") * 30;
    s += side(k, [{ label: `Lines with movement ${v.n("share")}%`, p: v.p("share") }, { label: "Moves", text: v("moveWhen") }, { label: "Power", text: v("power") }], "");
    s += `<rect x="220" y="76" width="90" height="78" fill="#141418"/>` + k.label({ x: 265, y: 86, text: "from above", size: 7, color: "#999" }) + k.dot({ x: 265, y: 118, r: 5, color: "#5a9fd0" }) + k.ring({ x: 265, y: 118, r: R, color: "#555", w: 1, dash: "2 2" }) + k.dot({ x: 265 + Math.cos(ca) * R, y: 118 + Math.sin(ca) * R, r: 5, color: ORANGE }) + k.label({ x: 265, y: 151, text: `${v.n("circleAround")}° · ${v.n("endGap")} m · ${v.n("moveMeters")} m`, size: 7, color: "#ccc" });
    return s + k.caption(`${who} moves, ${v("moveWhen")}`);
  });

  /* ---------- Volume of the lines: a face, the words getting bigger, sound waves ---------- */
  W.look("volume", (v, k) => {
    const vol = v.p("setting");
    const db = v.n("loudDb");
    const words = ["I", "never", "said", "that"];
    const peak = String(v("peakWord"));
    const trend = idx(v, "trend", 3);
    const fsz = 10 + vol * 14;
    let s = k.bg(BG);
    /* How far they sound: something between the two people. */
    const dist = idx(v, "distanceFeel", 4);
    const lx = 70 + k.clamp(Math.log(1 + v.n("listenerMeters")) * 34, 6, 120);
    if (dist === 1) s += `<rect x="62" y="122" width="${r1(lx - 80)}" height="8" fill="#6b4a2b"/>` + k.label({ x: (lx + 62) / 2 - 8, y: 140, text: "table", size: 7, color: "#aaa" });
    if (dist === 2) s += `<rect x="4" y="8" width="204" height="150" fill="none" stroke="#555" stroke-width="2"/>` + k.label({ x: 106, y: 152, text: "across the room", size: 7, color: "#aaa" });
    if (dist === 3) s += `<path d="M0 150 Q60 120 120 145 T210 140" fill="none" stroke="#4d6b3b" stroke-width="3"/>` + k.label({ x: 160, y: 156, text: "outdoors, far", size: 7, color: "#aaa" });
    s += k.face({ x: 34, y: 96, r: 22, mood: -vol * 0.3, mouth: 0.1 + vol * 0.8, eyes: 0.7 + vol * 0.3 }) + k.speaker({ x: 66, y: 92, s: 0.8, level: vol });
    s += k.person({ x: lx, y: 140, s: 0.65, color: "#777", lean: vol > 0.6 ? 6 : 0 });
    let x = 12;
    words.forEach((w, i) => {
      const tr = trend === 0 ? 1 - i * 0.15 : trend === 2 ? 0.7 + i * 0.15 : 1;
      const big = (peak === "the key word" && i === 1) || (peak === "the last word" && i === 3) ? 1.45 : 1;
      const z = fsz * tr * big;
      s += k.text({ x, y: 40, text: w, size: z, color: big > 1 ? "#ff9a5a" : "#f2f2f2", anchor: "start", weight: 700 });
      x += (w.length + 0.7) * z * 0.55;
    });
    /* The second voice, smaller or bigger by the gap between voices. */
    const gap = v.p("spread");
    s += k.text({ x: 120, y: 66, text: ", so?", size: k.clamp(fsz * (1 - gap * 0.7), 6, 30), color: "#9fd3ff", anchor: "start", weight: 600 });
    /* The level over time: building or falling, with sudden jumps; and the voice above the room. */
    const jumps = idx(v, "sudden", 3);
    const pts = Array.from({ length: 24 }, (_, i) => { const f = i / 23; let y = 0.3 + vol * 0.4 + (trend === 0 ? 0.25 - f * 0.4 : trend === 2 ? -0.2 + f * 0.4 : 0); if (jumps && i % (jumps === 1 ? 11 : 4) === 3) y += 0.35; return k.clamp(y, 0.03, 0.97); });
    const room = k.clamp((db - v.n("overRoom") - 30) / 80, 0.02, 0.98);
    s += side(k, [{ label: `Loudness ${db} dB`, p: (db - 30) / 80, color: "#ff9a5a" }, { label: `Voice over the room +${v.n("overRoom")} dB`, p: v.p("overRoom"), color: "#9fd3ff" }, { label: `Builds over ${v.n("buildTime")} s`, p: v.p("buildTime"), color: "#999" }, { label: "Speaking to", text: `${v.n("listenerMeters")} m away, ${v("distanceFeel")}` }]);
    s += `<rect x="220" y="96" width="90" height="56" fill="#141418"/><line x1="222" y1="${r1(150 - room * 52)}" x2="308" y2="${r1(150 - room * 52)}" stroke="#666" stroke-dasharray="3 2"/>` + k.label({ x: 306, y: 147 - room * 52, text: "room", size: 6.5, color: "#888", anchor: "end" }) + k.graph({ x: 222, y: 98, w: 86, h: 52, points: pts, color: "#ff9a5a", w2: 2 });
    return s + k.caption(`volume ${v("setting")} of 5, ${v("trend")}, loudest on ${peak}`);
  });

  /* ---------- Pace: the lines of two speakers on a 20-second strip, one dot per word ---------- */
  W.look("pace", (v, k) => {
    const lpm = Math.max(1, v.n("linesPerMin"));
    const speedF = [1.25, 1, 0.75][idx(v, "setting", 3)];
    const wpm = v.n("wpm");
    const ov = idx(v, "overlap", 3);
    const pick = [0.5, 0, -0.4][idx(v, "pickup", 3)];
    const rush = [1.4, 1, 0.65][idx(v, "rush", 3)] * (1 - v.n("endChange") / 120);
    const vari = [0, 0.3, 0.7][idx(v, "variation", 3)];
    const gap = v.n("pauseBetween") + pick - (ov / 2) * Math.max(0.3, v.n("overlapSecs"));
    const px = 300 / 20;
    let s = k.bg(BG) + k.label({ x: 10, y: 22, text: "A", size: 10, color: ORANGE, weight: 700, anchor: "start" }) + k.label({ x: 10, y: 62, text: "B", size: 10, color: "#5a9fd0", weight: 700, anchor: "start" });
    s += `<line x1="20" y1="80" x2="316" y2="80" stroke="#555"/>` + [0, 5, 10, 15, 20].map((t) => k.label({ x: 20 + t * px * 0.985, y: 92, text: `${t}s`, size: 7, color: "#888" })).join("");
    let t = 0;
    for (let i = 0; i < 40 && t < 20; i++) {
      const late = t > 13 ? rush : 1;
      const len = Math.max(0.6, (60 / lpm) * 0.8 * speedF * late * (1 + (k.rnd(i + 1) - 0.5) * 2 * vari));
      const y = i % 2 ? 46 : 8;
      const x0 = 20 + t * px;
      const w = Math.min(len * px, 316 - x0);
      if (w > 0) {
        s += `<rect x="${r1(x0)}" y="${y}" width="${r1(w)}" height="22" rx="4" fill="${i % 2 ? "#5a9fd0" : ORANGE}" opacity="0.85"/>`;
        const sp = (60 / wpm) * px;
        for (let d = x0 + 3; d < x0 + w - 2; d += sp) s += `<circle cx="${r1(d)}" cy="${y + 11}" r="1.6" fill="#1c1712"/>`;
      }
      t += len + gap;
    }
    s += side(k, []).replace('y="6" width="102" height="152"', 'y="100" width="102" height="58"') + k.label({ x: 220, y: 112, text: `${wpm} words a minute`, size: 8, color: "#eee", anchor: "start" }) + k.label({ x: 220, y: 124, text: `${lpm} lines a minute`, size: 8, color: "#eee", anchor: "start" }) + k.label({ x: 220, y: 136, text: `gap ${v.n("pauseBetween")} s, overlap ${v.n("overlapSecs")} s`, size: 7, color: "#ccc", anchor: "start" }) + k.label({ x: 220, y: 148, text: `end ${v.n("endChange") > 0 ? "+" : ""}${v.n("endChange")}%`, size: 7, color: "#ccc", anchor: "start" });
    s += k.label({ x: 10, y: 112, text: `Pace: ${v("setting")}`, size: 11, color: "#fff", anchor: "start", weight: 700 }) + k.label({ x: 10, y: 128, text: `${v("overlap")} · cues ${v("pickup")}`, size: 8, color: "#ccc", anchor: "start" }) + k.label({ x: 10, y: 142, text: `near the end ${v("rush")} · ${v("variation")}`, size: 8, color: "#ccc", anchor: "start" });
    return s + k.caption("each block is a line, each dot a word");
  });

  /* ---------- Facial expression: a face and the strength of the expression over time ---------- */
  W.look("faceIntensity", (v, k) => {
    const I0 = v.n("setting") / 5;
    const I = I0 || 0.6;
    const hid = idx(v, "hidden", 3);
    const shown = I0 * [1, 0.7, 0.4][hid];
    const reg = String(v("region"));
    const shx = 50;
    const shy = 66;
    let s = k.bg(BG);
    s += k.face({ x: shx, y: shy, r: 34, mood: reg === "eyes" || reg === "brow" ? 0.1 : shown * 0.9, brows: reg === "mouth" ? 0 : -shown * 0.9, eyes: reg === "mouth" || reg === "brow" ? 0.8 : 0.5 + shown * 0.5, mouth: reg === "eyes" || reg === "brow" ? 0 : shown * 0.6 });
    const hl = { eyes: [shx, shy - 6, 24, 10], mouth: [shx, shy + 16, 18, 10], brow: [shx, shy - 16, 24, 7], "whole face": [shx, shy, 40, 40] }[reg];
    s += `<ellipse cx="${hl[0]}" cy="${hl[1]}" rx="${hl[2]}" ry="${hl[3]}" fill="none" stroke="${YEL}" stroke-width="2" stroke-dasharray="3 2"/>`;
    if (hid) s += k.hand({ x: shx + 30, y: shy + 34, s: 0.7 + hid * 0.2, open: 0.6 });
    const to = String(v("showsTo"));
    if (to === "the other person") s += k.person({ x: 104, y: 150, s: 0.55, color: "#777" });
    if (to === "the camera") s += k.cam({ x: 104, y: 124, dir: 180, s: 0.6 });
    if (to === "nobody, alone") s += k.label({ x: 104, y: 130, text: "alone", size: 8, color: "#888" });
    if (to === "a crowd") s += [0, 1, 2, 3].map((i) => k.face({ x: 80 + i * 14, y: 136, r: 6, mood: 0 })).join("");
    /* Strength over time: rise, hold, fade the chosen way, peaking where chosen. */
    const peakT = [1, 3, 6][idx(v, "peakAt", 3)];
    const rise = v.n("riseSeconds");
    const hold = v.n("hold");
    const rel = idx(v, "release", 3);
    const fade = rel === 0 ? 0.1 : v.n("fadeSeconds") * (rel === 2 ? 2 : 1);
    const T = 14;
    const env = (t) => (t < peakT - rise ? 0 : t < peakT ? (t - (peakT - rise)) / Math.max(0.01, rise) : t < peakT + hold ? 1 : t < peakT + hold + fade ? 1 - (t - peakT - hold) / Math.max(0.01, fade) * (rel === 2 ? 0.7 : 1) : rel === 2 ? 0.3 : 0);
    const G = { x: 126, y: 20, w: 184, h: 92 };
    const felt = Array.from({ length: 57 }, (_, i) => Math.max(0.02, env((i / 56) * T) * I));
    const show = felt.map((p) => Math.max(0.02, p * [1, 0.7, 0.4][hid]));
    s += `<rect x="${G.x - 4}" y="${G.y - 6}" width="${G.w + 8}" height="${G.h + 22}" rx="5" fill="#1d1d22" stroke="#444"/>`;
    const scene = k.clamp(I / Math.max(0.1, v.n("vsScene") / 100), 0, 1);
    s += `<line x1="${G.x}" y1="${r1(G.y + G.h - scene * G.h)}" x2="${G.x + G.w}" y2="${r1(G.y + G.h - scene * G.h)}" stroke="#777" stroke-dasharray="4 3"/>` + k.label({ x: G.x + G.w - 2, y: G.y + G.h - scene * G.h - 3, text: "rest of the scene", size: 7, color: "#999", anchor: "end" });
    if (hid) s += k.graph({ x: G.x, y: G.y, w: G.w, h: G.h, points: felt, color: "#ff9a8a", w2: 1.2 }).replace("<polyline", '<polyline stroke-dasharray="3 2"');
    s += ghost(I0 > 0, k.graph({ x: G.x, y: G.y, w: G.w, h: G.h, points: show, color: YEL }));
    if (!I0) s += k.label({ x: G.x + G.w / 2, y: G.y + 8, text: "no expression yet: shape shown faint", size: 7, color: "#aaa" });
    s += k.label({ x: G.x, y: G.y + G.h + 11, text: `0 s`, size: 7, color: "#888", anchor: "start" }) + k.label({ x: G.x + G.w, y: G.y + G.h + 11, text: `${T} s`, size: 7, color: "#888", anchor: "end" }) + k.label({ x: G.x + G.w / 2, y: G.y + G.h + 11, text: `rise ${rise} s · hold ${hold} s · fade ${v.n("fadeSeconds")} s`, size: 7, color: "#ccc" });
    return s + k.caption(`strength ${v("setting")} of 5, ${reg}, ${v("release")}`);
  });

  /* ---------- Touch: two people, the hand that reaches, where it lands and how it is taken ---------- */
  W.look("touch", (v, k) => {
    const kind = idx(v, "setting", 4);
    const press = v.p("pressure");
    const who = String(v("who"));
    const where = String(v("where"));
    const wel = idx(v, "welcome", 4);
    const gap = 50 + v.p("gapBefore") * 40;
    const ax = 60;
    const bx = ax + gap;
    let s = k.bg(BG) + k.wall({ y: 120, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    const away = wel === 0;
    s += k.person({ x: ax, y: 150, s: 1.1, color: ORANGE, look: 1, lean: who !== "the listener" ? 6 : 0, label: "speaker" });
    s += k.person({ x: bx + (away ? 8 : 0), y: 150, s: 1.1, color: "#5a9fd0", look: away ? 1 : -1, lean: away ? 10 : wel === 3 ? -6 : 0, mood: [-0.6, -0.1, 0.4, 0.6][wel], label: "listener" });
    /* Where the hand lands on the other body. */
    const ty = { hand: 108, arm: 98, shoulder: 84, face: 72, embrace: 92 }[where];
    const from = who === "the listener" ? [bx - 4, 96] : [ax + 4, 96];
    const to = who === "the listener" ? [ax + 8, ty] : [bx - 8 + (away ? 8 : 0), ty];
    let touch = `<line x1="${from[0]}" y1="${from[1]}" x2="${r1(to[0])}" y2="${to[1]}" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>`;
    if (who === "both") touch += `<line x1="${bx - 4}" y1="98" x2="${ax + 8}" y2="${ty + 4}" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>`;
    if (where === "embrace") touch += `<ellipse cx="${(ax + bx) / 2}" cy="94" rx="${gap / 2 + 6}" ry="12" fill="none" stroke="#f0c8a0" stroke-width="4"/>`;
    touch += `<circle cx="${r1(to[0])}" cy="${to[1]}" r="${r1(4 + press * 9)}" fill="#ff6b8a" opacity="${r1(0.25 + press * 0.5)}"/>`;
    if (kind >= 2) touch += k.ring({ x: to[0], y: to[1], r: 14, color: "#ff9ab0", w: 1, dash: kind === 3 ? "" : "2 2" });
    s += ghost(kind > 0, touch);
    if (!kind) s += k.label({ x: 105, y: 22, text: "no touch: shown faint", size: 8, color: "#aaa" });
    if (wel === 0) s += k.arrow({ x1: bx + 14, y1: 60, x2: bx + 34, y2: 60, color: "#ff6b5a", w: 1.5 });
    if (wel === 3) s += k.label({ x: (ax + bx) / 2, y: 44, text: "♥", size: 14, color: "#ff6b8a" });
    /* From above: the side the touch comes from. */
    const fa = k.rad(v.n("fromAngle") - 90);
    s += side(k, [{ label: "Touch", text: `${v("setting")}, ${where}` }, { label: "Lands", text: v("touchTiming") }, { label: `Lasts ${v.n("touchSeconds")} s`, p: v.p("touchSeconds"), color: "#ff9ab0" }, { label: "Touches a minute", n: v.n("touchesPerMin"), color: "#ff9ab0" }, { label: "Taken as", text: v("welcome") }]);
    s += `<rect x="220" y="114" width="90" height="40" fill="#141418"/>` + k.dot({ x: 265, y: 136, r: 5, color: "#5a9fd0" }) + k.arrow({ x1: 265 + Math.cos(fa) * 18, y1: 136 + Math.sin(fa) * 18, x2: 265 + Math.cos(fa) * 7, y2: 136 + Math.sin(fa) * 7, color: "#ff9ab0", w: 1.5 }) + k.label({ x: 265, y: 152, text: `from ${v.n("fromAngle")}°, ${v.n("gapBefore")} m away`, size: 6.5, color: "#ccc" });
    return s + k.caption(`${v("setting")} touch, pressure ${v("pressure")}, ${who} starts it`);
  });

  /* ---------- Tone of the line: a speech bubble, and the line's pitch drawn as a curve ---------- */
  W.look("vocalTone", (v, k) => {
    const tone = String(v("setting"));
    const st = 0.2 + v.p("strength") * 0.8;
    const warm = v.p("warmth");
    const base = 0.5 + ([-0.2, 0, 0.2][idx(v, "pitch", 3)] + v.n("pitchShift") / 40);
    const swing = v.n("pitchSwing") / 30;
    const cracks = [0, 1, 4][idx(v, "crack", 3)];
    const breathy = v.n("breathiness") / 100;
    const col = k.mix("#7fb7ff", "#ff9a5a", warm);
    const pts = Array.from({ length: 40 }, (_, i) => {
      const f = i / 39;
      let y = base + swing * f;
      if (tone === "rising") y += f * 0.35 * st;
      if (tone === "falling") y -= f * 0.35 * st;
      if (tone === "breaking") y += (k.rnd(i) - 0.5) * 0.25 * st;
      if (tone === "shouted") y += Math.sin(f * 9) * 0.08 * st + 0.1;
      if (cracks && i % Math.floor(40 / (cracks + 1)) === 5) y += 0.25;
      y += (k.rnd(i + 50) - 0.5) * breathy * 0.15;
      return k.clamp(y, 0.03, 0.97);
    });
    let s = k.bg(BG) + `<rect x="0" y="0" width="320" height="162" fill="${col}" opacity="0.08"/>`;
    const aim = String(v("aimedAt"));
    s += k.face({ x: 36, y: 112, r: 24, mood: [-0.3, -0.1, 0, 0.3, 0.6][idx(v, "warmth", 5)], mouth: tone === "shouted" ? 0.9 : tone === "whispered" ? 0.1 : 0.3, look: aim === "the listener" ? 1 : aim === "themself" ? -1 : 0, eyes: aim === "themself" ? 0.3 : 0.8 });
    if (aim === "the listener") s += k.person({ x: 296, y: 154, s: 0.5, color: "#777" });
    if (aim === "the camera") s += k.cam({ x: 296, y: 140, dir: 180, s: 0.5 });
    if (aim === "the room") s += `<rect x="4" y="4" width="312" height="154" fill="none" stroke="#666" stroke-dasharray="3 3"/>`;
    if (aim === "themself") s += k.label({ x: 36, y: 80, text: "(to themself)", size: 7, color: "#aaa" });
    const big = (tone === "shouted" ? 18 : tone === "whispered" ? 9 : 13) * (0.75 + st * 0.4);
    s += k.bubble({ x: 120, y: 28, text: tone === "shouted" ? "FINE." : "Fine.", w: 90, h: 30, size: big, tail: -50 });
    s += `<rect x="70" y="56" width="236" height="78" rx="6" fill="#1d1d22" stroke="#444"/>` + k.label({ x: 76, y: 66, text: "pitch", size: 7, color: "#999", anchor: "start" });
    s += k.graph({ x: 80, y: 62, w: 220, h: 68, points: pts, color: col, w2: tone === "whispered" ? 1.2 : tone === "shouted" ? 4 : 2.5 }).replace("<polyline", tone === "whispered" ? '<polyline stroke-dasharray="3 3"' : "<polyline");
    const sub = idx(v, "subtext", 3);
    if (sub) s += k.label({ x: 230, y: 30, text: sub === 1 ? "(hmm…)" : "means: NOT fine", size: 9, color: sub === 2 ? "#ff6b5a" : "#bbb", weight: 600 });
    s += k.label({ x: 300, y: 150, text: `shift ${v.n("pitchShift")} · swing ${v.n("pitchSwing")} semitones · breath ${v.n("breathiness")}%`, size: 7, color: "#aaa", anchor: "end" });
    return s + k.caption(`${tone}, ${v("warmth")}, ${v("pitch")} pitch, cracks ${v("crack")}`);
  });

  /* ---------- Where the tone sits in the story: the story's rising line with this tone's stretch on it ---------- */
  const TONE = { hopeful: "#7fd18b", playful: "#ffd166", tense: "#ff9a5a", grim: "#8a8fa8", bittersweet: "#c28fd8" };
  W.look("toneArc", (v, k) => {
    const G = { x: 14, y: 26, w: 292, h: 96 };
    const arc = (f) => (f < 0.75 ? 0.15 + f * 1.0 : 0.9 - (f - 0.75) * 2.4);
    const col = TONE[String(v("toneColor"))] || "#ccc";
    const pos = v.n("position") / 100;
    const stretch = 0.04 + (v.n("stretch") / 100) * 0.5;
    const a = k.clamp(pos - stretch / 2, 0, 1);
    const b = k.clamp(pos + stretch / 2, 0, 1);
    const X = (f) => G.x + f * G.w;
    const Y = (f) => G.y + G.h - arc(f) * G.h;
    const tall = k.clamp(v.n("vsFilm") / 100, 0, 3);
    let s = k.bg(BG);
    /* Acts along the bottom, the chosen one lit. */
    const acts = ["opening", "rising", "midpoint", "climax", "ending"];
    const act = String(v("setting"));
    acts.forEach((n, i) => (s += `<rect x="${r1(X(i / 5))}" y="128" width="${r1(G.w / 5 - 2)}" height="14" rx="3" fill="${n === act ? "#3d5a80" : "#24242a"}"/>` + k.label({ x: X(i / 5 + 0.1), y: 138, text: n, size: 8, color: n === act ? "#fff" : "#888" })));
    /* The tone before it: the same, a shade off, or a sharp turn. */
    const cp = idx(v, "contrastPrev", 3);
    const prevCol = cp === 0 ? col : cp === 1 ? k.mix(col.length === 7 ? col : "#cccccc", "#888888", 0.5) : "#5a7bb5";
    const pb = Math.max(0, a - 0.18);
    s += `<rect x="${r1(X(pb))}" y="${G.y}" width="${r1(X(a) - X(pb))}" height="${G.h}" fill="${prevCol}" opacity="0.18"/>`;
    /* The turn: a soft edge as wide as the seconds it takes. */
    const turn = 2 + (v.n("turnSeconds") / 300) * 30;
    s += `<defs><linearGradient id="cw-toneArc-turn" x1="0" x2="1"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset="1" stop-color="${col}" stop-opacity="0.45"/></linearGradient></defs><rect x="${r1(X(a) - turn)}" y="${G.y}" width="${r1(turn)}" height="${G.h}" fill="url(#cw-toneArc-turn)"/>`;
    const hh = Math.min(G.h, G.h * 0.4 * tall + 10);
    s += `<rect x="${r1(X(a))}" y="${r1(G.y + G.h - hh)}" width="${r1(Math.max(2, X(b) - X(a)))}" height="${r1(hh)}" fill="${col}" opacity="0.45"/>`;
    const ret = idx(v, "returnLater", 3);
    if (ret >= 1) s += `<rect x="${r1(X(Math.min(0.95, b + 0.2)))}" y="${G.y + G.h - 20}" width="10" height="20" fill="${col}" opacity="0.5"/>`;
    if (ret === 2) s += `<rect x="${r1(X(0.97))}" y="${G.y + G.h - 30}" width="8" height="30" fill="${col}" opacity="0.7"/>`;
    s += k.graph({ x: G.x, y: G.y, w: G.w, h: G.h, points: Array.from({ length: 41 }, (_, i) => arc(i / 40)), color: "#ddd", w2: 2 });
    s += k.dot({ x: X(pos), y: Y(pos), r: 5, color: col }) + k.label({ x: X(pos), y: Y(pos) - 9, text: `${v.n("position")}%`, size: 8, color: col });
    s += k.label({ x: 8, y: 16, text: "the story's tension, start to end", size: 8, color: "#999", anchor: "start" }) + k.label({ x: 312, y: 16, text: `turns in ${v.n("turnSeconds")} s · ${v.n("vsFilm")}% of the film's strength`, size: 7, color: "#aaa", anchor: "end" });
    return s + k.caption(`${v("toneColor")} at the ${act}, ${v("contrastPrev")}, ${v("returnLater") === "never" ? "never returns" : v("returnLater")}`);
  });

  /* ---------- Time on each character: a strip of shots colored by who is on screen ---------- */
  W.look("timePerCharacter", (v, k) => {
    const lead = v.n("lead");
    const sec = v.n("secondShare");
    const third = Math.max(5, 100 - lead - sec);
    const evenP = [0, 0.4, 1][idx(v, "setting", 3)];
    let sh = [lead + 5, sec + 5, third].map((x) => x / (lead + sec + 5 + 5 + third));
    sh = sh.map((x) => k.lerp(x, 1 / 3, evenP));
    if (idx(v, "setting", 3) === 0) sh = [Math.max(sh[0], 0.6), sh[1] * 0.6, sh[2] * 0.6];
    const tot = sh[0] + sh[1] + sh[2];
    sh = sh.map((x) => x / tot);
    const n = k.clamp(Math.round(80 / Math.max(0.5, v.n("avgShot"))), 3, 40);
    const shifts = [0, 1, 3][idx(v, "shiftAt", 3)];
    const COL = [ORANGE, "#5a9fd0", "#7fd18b"];
    const hide = idx(v, "withholds", 3);
    let s = k.bg(BG);
    /* The portraits, sized by their share. */
    ["A", "B", "C"].forEach((nm, i) => {
      const r = 10 + sh[i] * 40;
      const x = [48, 120, 184][i];
      s += k.face({ x, y: 56, r, color: k.mix("#f0c8a0", COL[i], 0.3), alpha: i === 2 && hide ? 1 - hide * 0.35 : 1 }) + k.label({ x, y: 112, text: `${nm} ${Math.round(sh[i] * 100)}%`, size: 9, color: COL[i], weight: 700 });
      if (i === 2 && hide === 2) s += k.label({ x, y: 62, text: "?", size: 22, color: "#fff", weight: 800 });
    });
    /* The strip: n shots, each colored by who; the lead swaps at each shift. */
    const W0 = 200;
    let x = 8;
    const away = v.n("longestAway") / 600;
    for (let i = 0; i < n; i++) {
      const f = i / n;
      const seg = Math.floor(f * (shifts + 1));
      const pick = k.rnd(i + 3);
      let who = pick < sh[0] ? 0 : pick < sh[0] + sh[1] ? 1 : 2;
      if (seg % 2 === 1 && who < 2) who = 1 - who;
      if (f > 0.1 && f < 0.1 + away * 0.8 && who === 1) who = 0;
      const w = W0 / n;
      s += `<rect x="${r1(x)}" y="124" width="${r1(Math.max(1, w - 1))}" height="22" fill="${COL[who]}"/>`;
      const lt = v.n("listenerTime") / 100;
      if (k.rnd(i + 40) < lt) s += `<rect x="${r1(x)}" y="138" width="${r1(Math.max(1, w - 1))}" height="8" fill="#000" opacity="0.4"/>`;
      x += w;
    }
    for (let j = 1; j <= shifts; j++) s += `<line x1="${r1(8 + (W0 * j) / (shifts + 1))}" y1="118" x2="${r1(8 + (W0 * j) / (shifts + 1))}" y2="152" stroke="#fff" stroke-width="2"/>`;
    if (away > 0.001) s += `<path d="M${r1(8 + W0 * 0.1)} 154 l0 4 l${r1(W0 * away * 0.8)} 0 l0 -4" fill="none" stroke="#5a9fd0" stroke-width="1.5"/>`;
    s += side(k, [{ label: "Counted across", text: v("countedOver") }, { label: `Average shot ${v.n("avgShot")} s`, p: v.p("avgShot"), color: "#999" }, { label: `On the listener ${v.n("listenerTime")}%`, p: v.p("listenerTime"), color: "#555" }, { label: `B away for up to ${v.n("longestAway")} s`, p: v.p("longestAway"), color: "#5a9fd0" }, { label: "New lead", text: v("shiftAt") }, { label: "Keeps C off screen", text: v("withholds") }]);
    return s + k.caption(`${v("setting")}: lead ${lead}%, second ${sec}%`);
  });

  /* ---------- Cut rate in action: a strip of shots, shorter as the cutting speeds up ---------- */
  W.look("actionCutRate", (v, k) => {
    const rate = 0.5 + v.n("setting");
    const vari = v.p("variation");
    const build = idx(v, "buildUp", 3);
    const br = [0, 0.12, 0.3][idx(v, "breather", 3)];
    const brLen = v.n("breatherLength");
    const minLen = v.n("shortestShot") / 24;
    const clar = v.p("clarity");
    const jump = v.n("angleJump");
    const T = 10;
    const px = 296 / T;
    let t = 0;
    let s = k.bg(BG) + k.label({ x: 12, y: 16, text: "10 seconds of action", size: 8, color: "#999", anchor: "start" });
    let i = 0;
    while (t < T && i < 120) {
      const f = t / T;
      let len = (1 / rate) * (1 + (k.rnd(i + 2) - 0.5) * 1.6 * vari);
      if (build === 1) len *= 1.5 - f;
      if (build === 2) len *= f > 0.75 ? 0.3 : 1.2;
      len = Math.max(minLen, len);
      const calm = br && k.rnd(i + 70) < br;
      if (calm) len = brLen * 0.6;
      const w = Math.min(len * px, 306 - (12 + t * px));
      const x = 12 + t * px;
      s += `<rect x="${r1(x)}" y="30" width="${r1(Math.max(1, w - 1.5))}" height="46" fill="${calm ? "#3d5a80" : i % 2 ? "#a8553a" : "#c46a45"}"/>`;
      if (w > 9) {
        const jx = (1 - clar) * (k.rnd(i + 9) - 0.5) * w * 0.8;
        s += `<circle cx="${r1(x + w / 2 + jx)}" cy="${r1(52 + (1 - clar) * (k.rnd(i) - 0.5) * 30)}" r="${r1(Math.min(6, w / 4))}" fill="#fff" opacity="${r1(0.4 + clar * 0.6)}"/>`;
        const a = k.rad(-90 + (i % 2 ? jump : -jump) / 2);
        s += `<line x1="${r1(x + w / 2)}" y1="92" x2="${r1(x + w / 2 + Math.cos(a) * 9)}" y2="${r1(92 + Math.sin(a) * 9)}" stroke="#9fd3ff" stroke-width="1.5"/>`;
      }
      t += len;
      i++;
    }
    if (build === 2) s += k.label({ x: 300, y: 26, text: "✸ hit", size: 10, color: YEL, anchor: "end" });
    /* The talking scene for comparison: fewer cuts. */
    const tr = rate / Math.max(1, v.n("vsTalk") / 100);
    const tn = Math.max(1, Math.round(tr * T));
    s += k.label({ x: 12, y: 112, text: `a talking scene (${v.n("vsTalk")}% slower)`, size: 8, color: "#999", anchor: "start" }) + Array.from({ length: tn }, (_, j) => `<rect x="${r1(12 + (j * 296) / tn)}" y="118" width="${r1(296 / tn - 1.5)}" height="20" fill="${j % 2 ? "#556" : "#667"}"/>`).join("");
    s += k.label({ x: 12, y: 103, text: `camera jump per cut ${jump}°`, size: 7, color: "#9fd3ff", anchor: "start" }) + k.label({ x: 308, y: 103, text: `shortest ${v.n("shortestShot")} frames · calm shots ${brLen} s`, size: 7, color: "#aaa", anchor: "end" });
    s += k.label({ x: 160, y: 154, text: `${i} shots: ${v("clarity")}, ${v("buildUp")}`, size: 9, color: "#eee" });
    return s + k.caption(`${v("setting")} cuts a second, variation ${v("variation")}, breathers ${v("breather")}`);
  });

  /* ---------- Walk and talk: two people walking and talking, and a map of the route from above ---------- */
  W.look("walkAndTalk", (v, k) => {
    const pace = idx(v, "pace", 4);
    const gap = 14 + v.p("sideGap") * 40;
    const sp = v.p("walkSpeed");
    const ppl = [0, 2, 6][idx(v, "passersby", 3)];
    let s = k.bg(BG) + k.wall({ y: 110, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    for (let i = 0; i < ppl; i++) s += k.person({ x: 20 + k.rnd(i + 4) * 180, y: 112, s: 0.45, color: "#555", walk: 0.5 });
    const obs = Math.round(v.n("obstacles"));
    for (let i = 0; i < obs; i++) s += `<rect x="${r1(30 + i * 34)}" y="128" width="14" height="14" fill="#6b4a2b" stroke="#1c1712"/>`;
    const cx = 100;
    s += speed(k, cx - gap / 2 - 10, 96, 1 + pace, 8 + sp * 26) + k.person({ x: cx - gap / 2, y: 150, s: 1, color: ORANGE, walk: 0.3 + pace * 0.23, lean: pace * 5, look: 1 }) + k.person({ x: cx + gap / 2, y: 150, s: 1, color: "#5a9fd0", walk: 0.3 + pace * 0.23, lean: pace * 5, look: -1 });
    s += k.bubble({ x: cx, y: 24, text: "…and then?", w: 74, h: 22, size: 9, tail: -10 });
    /* Share of the talk spent walking, and the stops for big lines. */
    const share = v.n("share") / 100;
    const stops = [0, 1, 3][idx(v, "stopForLine", 3)];
    s += `<rect x="8" y="48" width="194" height="6" fill="#444"/><rect x="8" y="48" width="${r1(194 * share)}" height="6" fill="${YEL}"/>` + k.label({ x: 8, y: 64, text: `walking ${v.n("share")}% of the talk`, size: 7, color: "#ccc", anchor: "start" });
    for (let j = 0; j < stops; j++) s += `<rect x="${r1(8 + 194 * share * ((j + 1) / (stops + 1)))}" y="45" width="3" height="12" fill="#ff6b5a"/>`;
    /* The map: the route, the walkers and the camera around them. */
    const route = idx(v, "routeLength", 3);
    const rp = [[[226, 90], [304, 90]], [[226, 90], [270, 90], [270, 52], [304, 52]], [[226, 90], [304, 90], [304, 128], [226, 128], [226, 150], [304, 150]]][route];
    s += side(k, []) + k.label({ x: 265, y: 18, text: "from above", size: 7.5, color: "#999" }) + `<polyline points="${rp.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#3a3a42" stroke-width="12" stroke-linejoin="round"/>`;
    const camBase = { "ahead of them": 0, "beside them": 90, "behind them": 180 }[String(v("camera"))];
    const th = k.rad(camBase + v.n("camAround"));
    const R = 10 + v.p("camDistance") * 28;
    const mx = 244;
    const my = 90;
    const camX = mx + Math.cos(th) * R;
    const camY = my - Math.sin(th) * R;
    s += k.ring({ x: mx, y: my, r: R, color: "#555", w: 1, dash: "2 2" }) + k.dot({ x: mx, y: my - 5, r: 4, color: ORANGE }) + k.dot({ x: mx, y: my + 5, r: 4, color: "#5a9fd0" }) + k.arrow({ x1: mx - 6, y1: my, x2: mx + 12, y2: my, color: "#aaa", w: 1 }) + k.cam({ x: camX, y: camY, dir: (Math.atan2(my - camY, mx - camX) * 180) / Math.PI, s: 0.5 });
    s += k.label({ x: 265, y: 158 - 2, text: `camera ${v.n("camAround")}° · ${v.n("walkSpeed")} m/s · gap ${v.n("sideGap")} m`, size: 7, color: "#ccc" }).replace(/y="156"/, 'y="152"');
    return s + k.caption(`${v("pace")}, camera ${v("camera")} at ${v.n("camDistance")} m, ${v("routeLength")}`);
  });

  /* ---------- The listener's body: the speaker talks, the listener shows us how it lands ---------- */
  W.look("listenerBody", (v, k) => {
    const re = idx(v, "reaction", 4);
    const hands = String(v("hands"));
    const gap = 30 + v.p("listenGap") * 110;
    const lx = Math.min(196, 50 + gap);
    const ls = k.clamp(v.n("listenerHeight") / 50, 0.3, 2.2) * 0.8;
    const ag = idx(v, "agrees", 3);
    const turned = v.n("turnedFrom");
    const steal = v.p("stealsFocus");
    let s = k.bg(BG) + k.wall({ y: 120, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    s += `<circle cx="${lx}" cy="100" r="${r1(20 + steal * 30)}" fill="${YEL}" opacity="${r1(steal * 0.25)}"/>`;
    s += k.person({ x: 50, y: 150, s: 1, color: ORANGE, look: 1, alpha: 1 - steal * 0.5 }) + k.bubble({ x: 56, y: 26, text: "…and that's it.", w: 86, h: 22, size: 9, tail: -8 });
    const lean = -v.n("listenLean") + [8, 0, -8][ag];
    const look = turned > 90 ? 1 : -1 + turned / 90;
    const body = k.person({ x: lx, y: 150, s: ls, color: "#5a9fd0", lean, look, mood: [-0.5, 0, 0.5][ag], arms: re === 3 ? 0.9 : hands === "touch face" ? 0.8 : 0 });
    s += turned > 90 ? `<g transform="translate(${lx} 0) scale(-1 1) translate(${-lx} 0)">${body}</g>` : body;
    const hy = 150 - 24 * ls - 34 * ls + 22 * ls;
    if (hands === "cross arms") s += `<rect x="${r1(lx - 12 * ls)}" y="${r1(hy - 4)}" width="${r1(24 * ls)}" height="6" rx="3" fill="#1c1712"/>`;
    if (hands === "fidget") s += [-1, 1].map((sd) => `<path d="M${r1(lx + sd * 18 * ls)} ${r1(hy + 10)} q3 -4 6 0 q3 4 6 0" fill="none" stroke="#9fd3ff" stroke-width="1.5"/>`).join("");
    const shakes = [0, 1, 3, 5][re];
    for (let i = 0; i < shakes; i++) s += `<path d="M${r1(lx + 18 * ls + 4)} ${r1(100 - i * 7)} l4 -2 l-4 -2" fill="none" stroke="#fff" stroke-width="1.2"/>`;
    /* What we see of them. */
    const seen = idx(v, "seen", 3);
    if (seen === 0) s += `<rect x="6" y="6" width="${r1(lx - 30 * ls - 6)}" height="150" fill="none" stroke="#ddd" stroke-width="2"/>` + k.label({ x: lx, y: 20, text: "off screen", size: 7, color: "#aaa" });
    if (seen === 1) s += `<rect x="6" y="6" width="${r1(lx - 6)}" height="150" fill="none" stroke="#ddd" stroke-width="2"/>`;
    if (seen === 2) s += `<rect x="${r1(lx - 36 * ls)}" y="${r1(150 - 90 * ls)}" width="${r1(72 * ls)}" height="${r1(96 * ls)}" fill="none" stroke="#ddd" stroke-width="2"/>`;
    s += side(k, [{ label: "Reacts", text: v("reactTiming") }, { label: "Reaction", text: v("reaction") }, { label: "Hands", text: hands }, { label: `Distance ${v.n("listenGap")} m`, p: v.p("listenGap"), color: "#999" }, { label: "Lean · turned away", text: `${v.n("listenLean")}° · ${turned}°` }, { label: `Size in frame ${v.n("listenerHeight")}%`, p: v.p("listenerHeight"), color: "#5a9fd0" }, { label: "Agrees", text: v("agrees") }]);
    return s + k.caption(`${v("stealsFocus")}, ${v("seen")}`);
  });

  /* ---------- Animation feel: a ball jumping, drawn as onion-skin poses along its path ---------- */
  function ease(kind, t) {
    if (kind === "ease in") return t * t;
    if (kind === "ease out") return 1 - (1 - t) * (1 - t);
    if (kind === "ease both") return t * t * (3 - 2 * t);
    if (kind === "snap") return t < 0.5 ? t * 0.2 : 0.9 + (t - 0.5) * 0.2;
    return t;
  }
  W.look("animFeelLens", (v, k) => {
    const style = idx(v, "style", 5);
    const push = (v.n("pushPct") / 100) * (1 + idx(v, "exaggeration", 4) * 0.25);
    const H = k.clamp(30 * push, 12, 118);
    const arcs = String(v("arcs"));
    const P = (t) => {
      const x = 30 + t * 150;
      const y = arcs === "straight" ? 140 - (t < 0.5 ? t * 2 : (1 - t) * 2) * H : 140 - 4 * t * (1 - t) * H;
      return [x + (arcs === "figure eight" ? Math.sin(t * Math.PI * 2) * 18 : 0), y];
    };
    let s = k.bg(BG);
    const busy = [6, 2, 0][idx(v, "staging", 3)];
    for (let i = 0; i < busy; i++) s += `<rect x="${r1(10 + k.rnd(i + 11) * 180)}" y="${r1(20 + k.rnd(i + 31) * 80)}" width="12" height="12" fill="#3a3a44" transform="rotate(${r1(k.rnd(i) * 40)} 100 60)"/>`;
    s += `<line x1="0" y1="146" x2="210" y2="146" stroke="#666" stroke-width="2"/>`;
    const path = Array.from({ length: 31 }, (_, i) => P(i / 30));
    s += `<polyline points="${path.map((p) => p.map(r1).join(",")).join(" ")}" fill="none" stroke="#444" stroke-dasharray="3 3"/>`;
    const n = Math.round(v.n("poseRate")) + 3;
    const sp = String(v("spacing"));
    const sq = v.n("squash") / 5;
    const col = ["#9aa3ad", "#e0a050", "#ff9a5a", "#ff6b8a", "#c28fd8"][style];
    const over = [0, 1, 2, 3, 4][idx(v, "overlap", 5)];
    const ball = (x, y, sx, sy, a) => {
      let b = style === 0 ? `<rect x="${r1(x - 7 * sx)}" y="${r1(y - 7 * sy)}" width="${r1(14 * sx)}" height="${r1(14 * sy)}" fill="${col}" opacity="${a}"/>` : `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(7 * sx)}" ry="${r1(7 * sy)}" fill="${col}" opacity="${a}"/>`;
      for (let j = 0; j < over; j++) b += `<path d="M${r1(x - 6)} ${r1(y - 3 + j * 2)} q-6 ${style === 4 ? 6 : 2} -${10 + j * 2} 0" fill="none" stroke="${col}" stroke-width="1.5" opacity="${a}"/>`;
      if (style === 4) b += `<path d="M${r1(x - 3)} ${r1(y + 7)} q-4 6 0 10 M${r1(x + 3)} ${r1(y + 7)} q4 6 0 10" fill="none" stroke="#1c1712" stroke-width="2" opacity="${a}"/>`;
      return b;
    };
    /* Wind-up before, overshoot after. */
    const ant = idx(v, "anticipation", 3);
    if (ant) s += ball(30 - ant * 8, 140 + ant * 2, 1 + ant * 0.2 * (0.3 + sq), 1 - ant * 0.15 * (0.3 + sq), 0.5);
    for (let i = 0; i < n; i++) {
      const t = ease(sp, i / (n - 1));
      const [x, y] = P(t);
      const mid = Math.sin(t * Math.PI);
      const land = i === n - 1;
      const sx = land ? 1 + sq * 0.5 : 1 - mid * sq * 0.25;
      const sy = land ? 1 - sq * 0.4 : 1 + mid * sq * 0.4;
      s += ball(x, y - 7 * (sy - 1), sx, sy, i === n - 1 ? 1 : 0.35 + 0.5 * (i / n));
    }
    const os = idx(v, "overshoot", 3);
    const E = P(1);
    if (os === 1) s += ball(E[0] + 8, E[1] + 2, 1.1, 0.9, 0.35);
    if (os === 2) s += `<path d="M${r1(E[0])} ${r1(E[1])} q8 -18 16 0 q5 -8 10 0" fill="none" stroke="${col}" stroke-dasharray="2 2"/>` + ball(E[0] + 26, E[1], 1, 1, 0.4);
    const holds = idx(v, "holds", 4);
    for (let j = 0; j < holds; j++) s += k.ring({ x: P(0.5)[0] + (j - holds / 2) * 6, y: P(0.5)[1] - 14, r: 3 + j, color: "#9fd3ff", w: 1 });
    const sec = idx(v, "secondary", 3);
    for (let j = 0; j < sec * 3; j++) s += k.label({ x: 60 + j * 22, y: 30 + (j % 2) * 12, text: "✦", size: 8, color: YEL });
    s += side(k, [{ label: "Kind of movement", text: v("style") }, { label: "Spacing", text: sp }, { label: `Squash ${v("squash")} · push ${v.n("pushPct")}%`, p: v.p("pushPct"), color: "#ff9a5a" }, { label: "Poses per beat", n: v.n("poseRate") }, { label: "Holds", text: v("holds") }, { label: "Feel changes", text: v("feelShift") }]);
    return s + k.caption(`${v("exaggeration")}, ${v("anticipation")} wind-up, ${v("overshoot")} overshoot`);
  });

  /* ---------- Poses and body control: one figure, its line of action, its weight and its feet ---------- */
  W.look("poseRigLens", (v, k) => {
    const loa = idx(v, "lineOfAction", 4);
    const bend = (v.n("bodyBend") / 60) * 30 + [0, 6, 16, 12][loa];
    const bal = idx(v, "balance", 5);
    const tilt = [24, 12, 5, 0, 0][bal];
    const feet = String(v("feet"));
    const stance = 6 + v.p("stanceWidth") * 50;
    const fw = v.n("frontWeight") / 100;
    const turnX = Math.max(0.3, Math.abs(Math.cos(k.rad(v.n("bodyTurn")))));
    const shW = (14 + [0, 4, 8][idx(v, "twist", 3)] - (v.n("hipTwist") / 90) * 10) * turnX;
    const sil = idx(v, "silhouette", 3);
    const col = ["#4a4f5c", "#4a6fa5", "#6fa8ff"][sil];
    const gx = 95;
    const gy = 140 - (feet === "in the air" ? 16 : 0);
    const hipY = gy - 40;
    const headY = hipY - 58;
    const cb = loa === 3 ? `C${gx + bend} ${hipY - 20} ${gx - bend} ${hipY - 40} ${gx} ${headY + 8}` : `Q${gx + bend} ${hipY - 30} ${gx + bend * 0.3} ${headY + 8}`;
    let s = k.bg(BG) + `<line x1="0" y1="140" x2="210" y2="140" stroke="#666" stroke-width="2"/>`;
    if (feet === "in the air") s += `<ellipse cx="${gx}" cy="142" rx="20" ry="3" fill="#000" opacity="0.5"/>`;
    let fig = `<path d="M${gx} ${hipY} ${cb}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round"/>`;
    fig += `<path d="M${gx} ${hipY} ${cb}" fill="none" stroke="#ff6b8a" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    fig += `<circle cx="${r1(gx + bend * 0.3)}" cy="${headY}" r="10" fill="#f0c8a0" stroke="#1c1712" stroke-width="1.5"/>`;
    const sy = headY + 20;
    const sx = gx + bend * 0.35;
    const sym = idx(v, "symmetry", 3);
    const focus = idx(v, "focusPose", 3);
    const armA = [40, 40 - sym * 25];
    if (focus) armA[1] = -10;
    fig += [-1, 1].map((sd, i) => { const a = k.rad(90 - sd * armA[i]); return `<line x1="${r1(sx + sd * shW)}" y1="${sy}" x2="${r1(sx + sd * shW + Math.cos(a) * sd * 26)}" y2="${r1(sy + Math.sin(a) * 26)}" stroke="#1c1712" stroke-width="4" stroke-linecap="round"/>`; }).join("");
    fig += `<line x1="${r1(sx - shW)}" y1="${sy}" x2="${r1(sx + shW)}" y2="${sy}" stroke="#1c1712" stroke-width="4" stroke-linecap="round"/>`;
    const lift = feet === "lifted" ? 14 : 0;
    fig += `<line x1="${gx}" y1="${hipY}" x2="${r1(gx - stance / 2)}" y2="${gy}" stroke="#1c1712" stroke-width="5" stroke-linecap="round"/><line x1="${gx}" y1="${hipY}" x2="${r1(gx + stance / 2)}" y2="${gy - lift}" stroke="#1c1712" stroke-width="5" stroke-linecap="round"/>`;
    if (sil === 2) fig = `<g stroke-opacity="1">${fig}</g>`;
    s += `<g transform="rotate(${tilt} ${gx} 140)">${fig}</g>`;
    if (sil === 2) s += `<rect x="${gx - 40}" y="${headY - 16}" width="80" height="${140 - headY + 20}" fill="none" stroke="#6fa8ff" stroke-dasharray="2 4" opacity="0.6"/>`;
    if (feet === "sliding") s += speed(k, gx - stance / 2 - 2, 144, 2, 14);
    if (feet === "planted" || bal === 4) s += `<line x1="${gx - stance / 2 - 8}" y1="141" x2="${gx + stance / 2 + 8}" y2="141" stroke="${YEL}" stroke-width="3"/>`;
    s += k.dot({ x: gx - stance / 2 + fw * stance, y: 152, r: 4, color: "#ff9a5a" }) + k.label({ x: gx, y: 160, text: "weight", size: 7, color: "#ff9a5a" });
    const hands = String(v("hands"));
    const hx = sx + shW + Math.cos(k.rad(90 - armA[1])) * 26;
    const hy = sy + Math.sin(k.rad(90 - armA[1])) * 26;
    if (hands === "a prop") s += `<rect x="${r1(hx - 4)}" y="${r1(hy - 6)}" width="8" height="12" fill="#ddd" stroke="#1c1712"/>`;
    if (hands === "a surface") s += `<rect x="${r1(hx - 10)}" y="${r1(hy + 3)}" width="40" height="6" fill="#6b4a2b"/>`;
    if (hands === "another person") s += k.person({ x: 180, y: 140, s: 0.8, color: "#777" });
    if (focus === 2) s += k.label({ x: 186, y: 50, text: "★", size: 16, color: YEL });
    const ws = [0, 1, 3][idx(v, "weightShift", 3)];
    for (let j = 0; j < ws; j++) s += `<path d="M${gx - 14 + j * 10} 156 l4 -3 l4 3" fill="none" stroke="#ff9a5a"/>`;
    s += side(k, [{ label: "Line of action", text: v("lineOfAction") }, { label: "Balance · feet", text: `${v("balance")} · ${feet}` }, { label: "Turn · bend · twist", text: `${v.n("bodyTurn")}° · ${v.n("bodyBend")}° · ${v.n("hipTwist")}°` }, { label: `Holds ${v.n("poseHold")} frames`, p: v.p("poseHold"), color: "#9fd3ff" }, { label: `Feet ${v.n("stanceWidth")} m apart`, p: v.p("stanceWidth"), color: "#999" }, { label: "Outline", text: v("silhouette") }, { label: "Body", text: `${v("twist")}, ${v("symmetry")}` }]);
    return s + k.caption(`points our eye ${v("focusPose")}, hands: ${hands}`);
  });

  /* ---------- Dynamic range of the lines: one bar per line, from the quietest to the loudest ---------- */
  W.look("dynamicRange", (v, k) => {
    const qdb = v.n("quietDb") - [6, 3, 0, -3][idx(v, "quietest", 4)];
    const ldb = v.n("loudDb") + [-6, 0, 4, 8][idx(v, "loudest", 4)];
    const wide = String(v("setting")) === "wide" ? 1 : 0.55;
    const r = (0.35 + 0.65 * (v.n("db") / 30)) * wide;
    const mid = (qdb + ldb) / 2;
    const lo = mid - ((ldb - qdb) / 2) * r;
    const hi = mid + ((ldb - qdb) / 2) * r;
    const js = idx(v, "jumpSpeed", 3);
    const surp = [0, 1, 3][idx(v, "surprise", 3)];
    const N = 10;
    const pattern = Array.from({ length: N }, (_, i) => (js === 0 ? i / (N - 1) : js === 1 ? (i % 3 === 2 ? 1 : 0.2 + (i % 3) * 0.1) : i === N - 2 ? 1 : 0.15));
    const Y = (db) => 150 - k.clamp((db - 15) / 105, 0, 1) * 128;
    let s = k.bg(BG) + [20, 40, 60, 80, 100, 120].map((d) => `<line x1="30" y1="${r1(Y(d))}" x2="206" y2="${r1(Y(d))}" stroke="#2a2a30"/>` + k.label({ x: 26, y: Y(d) + 3, text: `${d}`, size: 7, color: "#777", anchor: "end" })).join("");
    s += k.label({ x: 6, y: 14, text: "dB", size: 7, color: "#777", anchor: "start" });
    pattern.forEach((p, i) => {
      let d = lo + (hi - lo) * p;
      const isS = surp && (i === 4 || (surp === 3 && (i === 1 || i === 7)));
      if (isS) d = hi + 6;
      const x = 36 + i * 17;
      s += `<rect x="${x}" y="${r1(Y(d))}" width="12" height="${r1(150 - Y(d))}" fill="${isS ? "#ff6b5a" : k.mix("#5a7bb5", "#ff9a5a", p)}"/>` + (isS ? k.label({ x: x + 6, y: Y(d) - 4, text: "!", size: 10, color: "#ff6b5a", weight: 800 }) : "");
    });
    s += `<line x1="30" y1="${r1(Y(lo))}" x2="206" y2="${r1(Y(lo))}" stroke="#5a7bb5" stroke-dasharray="3 2"/><line x1="30" y1="${r1(Y(hi))}" x2="206" y2="${r1(Y(hi))}" stroke="#ff9a5a" stroke-dasharray="3 2"/>`;
    s += side(k, [{ label: "Quietest line", text: `${v("quietest")}, ${v.n("quietDb")} dB` }, { label: "Loudest line", text: `${v("loudest")}, ${v.n("loudDb")} dB` }, { label: `Range ${v.n("db")} dB (${v("setting")})`, p: v.n("db") / 30, color: "#ff9a5a" }, { label: "Quiet to loud", text: v("jumpSpeed") }, { label: "Startles us", text: v("surprise") }]);
    return s + k.caption(`each bar is one line: ${Math.round(lo)} to ${Math.round(hi)} dB`);
  });

  /* ---------- How often the range changes: the level of the voice over a minute, with its jumps ---------- */
  W.look("rangeChanges", (v, k) => {
    const n = Math.round(v.n("jumpsPerMin"));
    const every = [3, 2, 1][idx(v, "setting", 3)];
    const size = (0.25 + 0.75 * (v.n("size") / 5)) * (0.2 + (v.n("jumpDb") / 40) * 0.8);
    const dir = String(v("direction"));
    const pat = idx(v, "pattern", 3);
    const settle = v.n("settle");
    const ramp = v.n("jumpSeconds");
    const G = { x: 12, y: 28, w: 194, h: 90 };
    const T = 60;
    const X = (t) => G.x + (t / T) * G.w;
    const jumps = [];
    for (let i = 0; i < n; i++) jumps.push(((i + 0.5) / Math.max(1, n)) * T + (pat ? (k.rnd(i + 5) - 0.5) * (T / Math.max(1, n)) * pat * 0.8 : 0));
    const lvl = (t) => {
      let y = 0.45;
      jumps.forEach((j, i) => {
        if (t < j) return;
        const up = dir === "quiet to loud" ? 1 : dir === "loud to quiet" ? -1 : i % 2 ? -1 : 1;
        const into = Math.min(1, (t - j) / Math.max(0.05, ramp));
        const back = settle ? Math.exp(-Math.max(0, t - j - ramp) / Math.max(0.3, settle)) : t - j < ramp + 0.6 ? 1 : 0;
        y += up * size * 0.45 * into * back;
      });
      return k.clamp(y, 0.03, 0.97);
    };
    let s = k.bg(BG) + `<rect x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}" fill="#1d1d22"/>`;
    s += k.graph({ x: G.x, y: G.y, w: G.w, h: G.h, points: Array.from({ length: 241 }, (_, i) => lvl((i / 240) * T)), color: "#ff9a5a", w2: 2 });
    /* The lines underneath: every Nth one has a jump; the cue word marked. */
    const cue = String(v("cueWord"));
    for (let i = 0; i < 12; i++) {
      const x = G.x + i * (G.w / 12);
      const on = i % every === 0;
      s += `<rect x="${r1(x + 1)}" y="126" width="${r1(G.w / 12 - 2)}" height="10" rx="2" fill="${on ? "#3d5a80" : "#2a2a30"}"/>`;
      if (on && cue !== "any word") s += `<rect x="${r1(x + (cue === "the punchline" ? G.w / 12 - 6 : 4))}" y="126" width="4" height="10" fill="${YEL}"/>`;
    }
    s += k.label({ x: G.x, y: 148, text: `lines; a jump on ${every === 1 ? "every line" : every === 2 ? "every other line" : "the odd line"}${cue === "any word" ? "" : `, on ${cue}`}`, size: 7, color: "#aaa", anchor: "start" });
    s += k.label({ x: G.x, y: 20, text: "loudness over one minute", size: 8, color: "#999", anchor: "start" });
    s += side(k, [{ label: "Jumps a minute", n }, { label: `Jump size ${v.n("jumpDb")} dB`, p: v.n("jumpDb") / 40, color: "#ff9a5a" }, { label: `Jump takes ${ramp} s`, p: ramp / 5, color: "#9fd3ff" }, { label: `Settles back in ${settle} s`, p: settle / 10, color: "#999" }, { label: "Mostly goes", text: dir }, { label: "Pattern", text: v("pattern") }]);
    return s + k.caption(`${v("setting")}, size ${v("size")} of 5`);
  });

  /* ---------- Breathing and speaking: a face with its breath, and breaths (grey) against lines (blue) ---------- */
  W.look("breath", (v, k) => {
    const mode = idx(v, "setting", 3);
    const aud = v.n("audible") / 5;
    const len = 0.3 + v.n("length");
    const feel = String(v("breathFeel"));
    const before = idx(v, "breathBefore", 3);
    const held = idx(v, "held", 3);
    const gapS = v.n("breathGap");
    let s = k.bg(BG);
    s += k.face({ x: 46, y: 62, r: 30, mood: feel === "sigh" ? -0.3 : 0, eyes: feel === "gasp" ? 1 : 0.7, mouth: held ? 0 : feel === "gasp" ? 0.7 : 0.25 });
    if (held) s += [-1, 1].map((sd) => `<circle cx="${46 + sd * 20}" cy="70" r="${5 + held * 2}" fill="#f0a080" opacity="0.6"/>`).join("") + k.label({ x: 46, y: 108, text: `holding ${v.n("heldSeconds")} s`, size: 8, color: "#ff9a8a" });
    const puff = 6 + aud * 14;
    const puffPath = feel === "sigh" ? `M84 70 q14 8 30 4 q10 -2 18 4` : feel === "gasp" ? `M84 66 l14 -10 l6 8 l10 -10` : feel === "shaky" ? `M84 66 q4 -6 8 0 q4 6 8 0 q4 -6 8 0 q4 6 8 0` : `M84 66 q14 -10 30 0`;
    s += ghost(aud > 0, `<path d="${puffPath}" fill="none" stroke="#cfe3ff" stroke-width="${r1(1 + aud * 3)}" stroke-linecap="round"/><circle cx="${r1(100 + puff)}" cy="58" r="${r1(puff)}" fill="#cfe3ff" opacity="${r1(0.15 + aud * 0.3)}"/>`);
    if (!aud) s += k.label({ x: 120, y: 40, text: "breath you can't hear", size: 7, color: "#888" });
    /* The timeline: breaths before lines (or under them), with the chosen gap. */
    const t = track(k, { x: 10, y: 140, w: 196, t0: 0, t1: 16, label: "breaths (grey) and lines (blue)" });
    s += t.s;
    let at = 0.4;
    for (let i = 0; i < 3; i++) {
      const key = i === 1;
      const breathe = mode !== 2 && (before === 2 || (before === 1 && key) || (before === 0 && i === 0));
      if (breathe) {
        const bs = mode === 1 ? at + 0.3 : at;
        s += `<path d="M${r1(t.X(bs))} 146 Q${r1(t.X(bs + len / 2))} ${r1(146 - 6 - aud * 16)} ${r1(t.X(bs + len))} 146 Z" fill="#9aa3ad" opacity="0.9"/>`;
        if (mode === 0) at += len + gapS;
      }
      if (held && key) {
        s += `<rect x="${r1(t.X(at))}" y="137" width="${r1(t.X(at + Math.min(4, 0.5 + v.n("heldSeconds") / 15)) - t.X(at))}" height="6" fill="#ff9a8a"/>`;
        at += Math.min(4, 0.5 + v.n("heldSeconds") / 15);
      }
      s += `<rect x="${r1(t.X(at))}" y="134" width="${r1(t.X(at + 2.5) - t.X(at))}" height="12" rx="3" fill="#3d5a80"/>`;
      at += 3;
    }
    s += side(k, [{ label: "Breathing and speaking", text: v("setting") }, { label: "Kind of breath", text: feel }, { label: "Breaths a minute", n: v.n("breathRate") / 2, show: v.n("breathRate"), color: "#cfe3ff" }, { label: `Breath to word ${gapS} s`, p: gapS / 2, color: "#9aa3ad" }, { label: "Held breath", text: `${v("held")}, up to ${v.n("heldSeconds")} s` }, { label: `Breath ${v.n("length")} s, audible ${v("audible")}/5`, p: aud, color: "#cfe3ff" }]);
    return s + k.caption(`${v("setting")}, ${feel}, held ${v("held")}`);
  });

  /* ---------- Eating and speaking: someone at a table, food, crumbs, and bites against lines ---------- */
  W.look("eating", (v, k) => {
    const mode = idx(v, "setting", 3);
    const mess = Math.round(v.n("messiness"));
    const food = String(v("food"));
    const full = v.n("mouthFull") / 100;
    const app = idx(v, "appetite", 3);
    let s = k.bg(BG) + k.wall({ y: 110, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    s += k.face({ x: 70, y: 62, r: 26, mood: 0.2, mouth: mode === 2 ? 0.4 : 0, eyes: 0.8 });
    s += [-1, 1].map((sd) => `<circle cx="${70 + sd * 20}" cy="70" r="${r1(2 + full * 8)}" fill="#f0b890" stroke="#1c1712" stroke-width="0.8" opacity="${r1(0.3 + full * 0.7)}"/>`).join("");
    s += `<rect x="20" y="104" width="180" height="10" fill="#6b4a2b"/><rect x="30" y="114" width="6" height="40" fill="#4a3220"/><rect x="184" y="114" width="6" height="40" fill="#4a3220"/>`;
    let plate = "";
    const pile = 0.6 + app * 0.3;
    if (food === "a snack") plate = [0, 1, 2, 3].map((i) => `<ellipse cx="${100 + i * 9}" cy="${100 - (i % 2) * 2}" rx="${r1(5 * pile)}" ry="3" fill="#e8c35a" stroke="#1c1712" stroke-width="0.6"/>`).join("");
    if (food === "a meal") plate = `<ellipse cx="114" cy="102" rx="${r1(22 * pile)}" ry="5" fill="#eee" stroke="#1c1712"/><ellipse cx="114" cy="99" rx="${r1(12 * pile)}" ry="4" fill="#b5583a"/>`;
    if (food === "something crunchy") plate = `<circle cx="114" cy="94" r="${r1(9 * pile)}" fill="#c0392b" stroke="#1c1712"/>` + k.label({ x: 140, y: 86, text: "crunch!", size: 8, color: YEL });
    if (food === "a drink") plate = `<rect x="106" y="${r1(104 - 22 * pile)}" width="14" height="${r1(22 * pile)}" fill="#9fd3ff" opacity="0.7" stroke="#ddd"/>`;
    s += ghost(mode > 0, plate);
    for (let i = 0; i < mess * 3; i++) s += k.dot({ x: 50 + k.rnd(i + 2) * 100, y: i % 3 ? 102 - k.rnd(i) * 4 : 80 + k.rnd(i + 8) * 16, r: 1.3, color: "#e8c35a" });
    const chew = idx(v, "chewing", 3);
    if (chew) s += k.label({ x: 30, y: 30, text: "munch", size: 7 + chew * 4, color: "#ddd", weight: 700 });
    if (app === 2) s += speed(k, 96, 80, 3, 12, "#ddd");
    if (mode === 2) s += k.bubble({ x: 150, y: 30, text: "mmf, so…", w: 64, h: 22, size: 9, tail: -40 });
    if (!mode) s += k.label({ x: 150, y: 30, text: "not eating: food shown faint", size: 7, color: "#888" });
    /* Bites against lines. */
    const t = track(k, { x: 10, y: 146, w: 196, t0: 0, t1: 14 });
    const bt = String(v("biteTiming"));
    const cb = v.n("chewBefore") * 0.4;
    s += t.s + [[1, 4], [7.5, 10.5]].map((b) => `<rect x="${r1(t.X(b[0] + (mode === 1 ? cb : 0)))}" y="141" width="${r1(t.X(b[1]) - t.X(b[0]))}" height="10" rx="2" fill="#3d5a80"/>`).join("");
    const bx = bt === "between lines" ? [0.5, 6] : bt === "before the punchline" ? [6.8, 0.3] : [2.5, 9];
    s += bx.map((x) => mark(k, t.X(x), 140, "#e8c35a", "bite")).join("") + (mode === 1 ? `<rect x="${r1(t.X(1))}" y="153" width="${r1(t.X(1 + cb) - t.X(1))}" height="3" fill="#e8c35a"/>` : "");
    s += side(k, [{ label: "Eating and speaking", text: v("setting") }, { label: `Lines while eating ${v.n("share")}%`, p: v.p("share"), color: "#e8c35a" }, { label: "Bites a minute", n: v.n("bitesPerMin"), color: "#e8c35a" }, { label: `Chewing first ${v.n("chewBefore")} s`, p: v.p("chewBefore"), color: "#999" }, { label: "Appetite", text: v("appetite") }, { label: "Mouth full", p: full, color: "#f0b890" }]);
    return s + k.caption(`${food}, messiness ${mess}, chewing ${v("chewing")}`);
  });

  /* ---------- Size of gesture: a person and the arm doing the gesture, with its reach and height ---------- */
  W.look("gesture", (v, k) => {
    const size = v.n("setting") / 5;
    const type = String(v("type"));
    const reach = 10 + v.p("reach") * 42 * (0.4 + size * 0.6);
    const hgt = idx(v, "height", 4);
    const elev = [-50, -10, 25, 70][hgt];
    const ang = v.n("pointAngle");
    const px = 80;
    const sy = 84;
    let s = k.bg(BG) + k.wall({ y: 130, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    s += k.person({ x: px, y: 156, s: 1.3, color: BLUE, mood: 0.2, look: 0.5 });
    const dirx = Math.cos(k.rad(ang)) >= 0 ? 1 : -1;
    const a = k.rad(-elev);
    let hx = px + dirx * Math.cos(a) * reach;
    let hy = sy + Math.sin(a) * reach;
    if (type === "self-touch") (hx = px + 4), (hy = sy + 8);
    const arm = `<line x1="${px}" y1="${sy}" x2="${r1(hx)}" y2="${r1(hy)}" stroke="#1c1712" stroke-width="5" stroke-linecap="round"/>`;
    s += arm + k.dot({ x: hx, y: hy, r: 5, color: "#f0c8a0" });
    if (type === "pointing") s += `<line x1="${r1(hx)}" y1="${r1(hy)}" x2="${r1(hx + dirx * 9)}" y2="${r1(hy + Math.sin(a) * 4)}" stroke="#f0c8a0" stroke-width="3" stroke-linecap="round"/>`;
    if (type === "illustrating") s += `<line x1="${px}" y1="${sy}" x2="${r1(px - dirx * Math.cos(a) * reach)}" y2="${r1(hy)}" stroke="#1c1712" stroke-width="5" stroke-linecap="round"/>` + k.ring({ x: px, y: hy - 4, r: reach * 0.6, color: "#9fd3ff", w: 1, dash: "3 3" });
    if (type === "beat on the words") s += [0, 1, 2].map((i) => `<line x1="${r1(hx - 8 + i * 8)}" y1="${r1(hy + 8)}" x2="${r1(hx - 8 + i * 8)}" y2="${r1(hy + 14)}" stroke="${YEL}" stroke-width="2"/>`).join("");
    if (type === "big sweep") s += `<path d="M${r1(px - dirx * reach)} ${sy + 20} Q${px} ${r1(sy - reach * 1.2)} ${r1(hx)} ${r1(hy)}" fill="none" stroke="#9fd3ff" stroke-width="2" stroke-dasharray="4 3"/>`;
    s += speed(k, hx - dirx * 6, hy, idx(v, "gestureSpeed", 3) * 2, 10);
    const habit = [0, 1, 2][idx(v, "habit", 3)];
    for (let i = 1; i <= habit; i++) s += `<line x1="${px}" y1="${sy}" x2="${r1(hx - dirx * i * 6)}" y2="${r1(hy + i * 6)}" stroke="#1c1712" stroke-width="4" stroke-linecap="round" opacity="${0.35 / i}"/>`;
    const pe = idx(v, "pointsEye", 3);
    if (pe === 2) s += k.label({ x: Math.min(200, hx + dirx * 40), y: hy, text: "★", size: 16, color: YEL });
    if (pe === 1) s += k.ring({ x: px, y: 58, r: 16, color: YEL, w: 1.5, dash: "3 2" });
    const t = track(k, { x: 10, y: 150, w: 196, t0: -3, t1: 3, line: [0, 0.6], lineLabel: "word" });
    s += t.s + mark(k, t.X(v.n("timing") * 0.6), 144, YEL, "") + k.label({ x: 10, y: 138, text: `gesture ${v.n("timing")} beats from the word`, size: 7, color: "#999", anchor: "start" });
    const ga = k.rad(ang - 90);
    s += side(k, [{ label: "Kind · height", text: `${type} · ${v("height")}` }, { label: `Reach ${v.n("reach")} m`, p: v.p("reach"), color: "#9fd3ff" }, { label: "Gestures a minute", n: v.n("gesturesPerMin") / 2, show: v.n("gesturesPerMin") }, { label: `One lasts ${v.n("gestureSeconds")} s`, p: v.p("gestureSeconds"), color: "#999" }, { label: "Speed · habit", text: `${v("gestureSpeed")} · ${v("habit")}` }]);
    s += `<rect x="220" y="118" width="90" height="36" fill="#141418"/>` + k.dot({ x: 250, y: 136, r: 4, color: BLUE }) + k.arrow({ x1: 250, y1: 136, x2: 250 + Math.cos(ga) * 14, y2: 136 + Math.sin(ga) * 14, color: YEL, w: 1.5 }) + k.label({ x: 286, y: 139, text: `aims ${ang}°`, size: 7, color: "#ccc" });
    return s + k.caption(`gesture size ${v("setting")} of 5, ${type}, ${v("height")}`);
  });

  /* ---------- Stillness: a body that holds still, with only the chosen part moving ---------- */
  W.look("stillness", (v, k) => {
    const st = v.n("setting") / 5;
    const parts = String(v("whatMoves"));
    const feel = idx(v, "stillFeel", 3);
    const px = 90;
    let s = k.bg(BG) + k.wall({ y: 130, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    const sway = 1 + v.n("sway") * 2.2;
    s += `<path d="M${r1(px - sway)} 34 Q${px} 26 ${r1(px + sway)} 34" fill="none" stroke="#9fd3ff" stroke-width="1.5"/>`;
    s += k.person({ x: px, y: 150, s: 1.4, color: BLUE, mood: [0.3, 0, -0.3][feel], lean: feel === 2 ? 10 : 0, look: feel === 1 ? 1 : 0, arms: feel === 2 ? -0.3 : 0, walk: feel === 2 ? 0.4 : 0 });
    if (feel === 1) s += k.clock({ x: 170, y: 40, r: 12, p: 0.3 });
    if (feel === 2) s += [0, 1, 2].map((i) => `<path d="M${120 + i * 6} ${70 + i * 10} l6 -3 l-6 -3" fill="none" stroke="#ff6b5a" stroke-width="1.5"/>`).join("");
    /* Motion marks: fewer as they get stiller, and on the part that still moves. */
    const marks = Math.round((1 - st) * 6);
    for (let i = 0; i < marks; i++) s += `<path d="M${r1(px - 30 + (i % 2) * 60)} ${r1(60 + i * 12)} q4 -4 8 0" fill="none" stroke="#ccc" stroke-width="1.2"/>`;
    const pp = { nothing: null, "the eyes": [px, 46], "the hands": [px + 22, 104], "the breath": [px, 84] }[parts];
    if (pp) s += k.ring({ x: pp[0], y: pp[1], r: 8, color: YEL, w: 2 }) + `<path d="M${pp[0] + 10} ${pp[1] - 4} q3 4 0 8" fill="none" stroke="${YEL}" stroke-width="1.5"/>`;
    const mp = v.n("movePct") / 100;
    s += `<rect x="${px - 13}" y="${r1(150 - 150 * 0.62 * mp)}" width="26" height="${r1(150 * 0.62 * mp)}" fill="${YEL}" opacity="0.18"/>`;
    const bk = idx(v, "breakWith", 3);
    s += k.label({ x: 170, y: 110, text: ["then: a tiny shift", "then: a normal move", "then: SUDDEN move!"][bk], size: 7 + bk * 1.5, color: bk === 2 ? "#ff6b5a" : "#bbb" });
    s += side(k, [{ label: "Stillness", text: `${v("setting")} of 5` }, { label: `Holds still ${v.n("holdTime")} s`, p: v.p("holdTime"), color: "#9fd3ff" }, { label: "Only this moves", text: parts }, { label: `Body moving ${v.n("movePct")}%`, p: mp }, { label: `Sway ${v.n("sway")} cm`, p: v.p("sway"), color: "#9fd3ff" }, { label: "Feels like", text: v("stillFeel") }]);
    return s + k.caption(`stillness ${v("setting")} of 5, ${v("stillFeel")}`);
  });

  /* ---------- Blink: a pair of eyes, and a minute of blinks with the thoughts and cuts ---------- */
  W.look("blink", (v, k) => {
    const on = String(v("setting")) === "yes";
    const rate = v.n("rate");
    const spd = idx(v, "blinkSpeed", 3);
    const ms = v.n("blinkMs");
    let s = k.bg(BG);
    const lid = on ? 0.25 + spd * 0.25 : 0;
    [-1, 1].forEach((sd) => {
      const x = 105 + sd * 40;
      s += `<ellipse cx="${x}" cy="50" rx="28" ry="18" fill="#fff" stroke="#1c1712" stroke-width="2"/><circle cx="${x}" cy="50" r="9" fill="#3b6ea5"/><circle cx="${x}" cy="50" r="4" fill="#111"/><rect x="${x - 29}" y="31" width="58" height="${r1(36 * lid)}" fill="#f0c8a0" stroke="#1c1712"/>`;
    });
    if (!on) s += k.label({ x: 105, y: 88, text: "no blinking: a stare", size: 8, color: "#ff9a8a" });
    /* A minute: blinks, thoughts and cuts. */
    const T = 60;
    const t = track(k, { x: 10, y: 130, w: 196, t0: 0, t1: T, label: "one minute: blinks (ticks), thoughts (◆), cuts (red)" });
    s += t.s;
    const hold = v.n("holdOff");
    const n = Math.round(rate);
    const mean = idx(v, "meaning", 3);
    const cuts = [5, 22, 41];
    const thoughts = [12, 30, 50];
    thoughts.forEach((x) => (s += k.label({ x: t.X(x), y: 146, text: "◆", size: 8, color: YEL })));
    cuts.forEach((x) => (s += `<line x1="${r1(t.X(x))}" y1="112" x2="${r1(t.X(x))}" y2="136" stroke="#ff6b5a" stroke-width="1.5"/>`));
    s += `<rect x="${r1(t.X(20))}" y="114" width="${r1(t.X(20 + hold) - t.X(20))}" height="4" fill="#9fd3ff"/>`;
    const oc = idx(v, "onCut", 3);
    const w = Math.max(1, (ms / 1000) * (196 / T) * 4);
    const times = [];
    for (let i = 0; i < n; i++) {
      let x = ((i + 0.5) / Math.max(1, n)) * T + (k.rnd(i) - 0.5) * 3;
      if (mean === 2 || (mean === 1 && i % 2 === 0)) x = thoughts[i % 3] + Math.floor(i / 3) * 0.8;
      if (oc === 2 || (oc === 1 && i % 3 === 0)) x = cuts[i % 3] + Math.floor(i / 3) * 0.8;
      if (x > 20 && x < 20 + hold) x = 20 + hold + (i % 4);
      times.push(x);
    }
    s += ghost(on, times.map((x) => `<rect x="${r1(t.X(x))}" y="120" width="${r1(w)}" height="10" fill="#f0c8a0"/>`).join(""));
    s += side(k, [{ label: "Blinks a minute", n: rate / 2, show: rate, color: "#f0c8a0" }, { label: `One blink ${ms} ms`, p: (ms - 80) / 420, color: "#f0c8a0" }, { label: `Holds a stare ${hold} s`, p: hold / 30, color: "#9fd3ff" }, { label: "On the thought", text: v("meaning") }, { label: "On the cut", text: v("onCut") }, { label: "Speed", text: v("blinkSpeed") }]);
    return s + k.caption(on ? `${rate} blinks a minute, ${v("blinkSpeed")}` : "no blinking");
  });

  /* ---------- Move temper: the action (yellow) and the camera following it (blue) ---------- */
  W.look("moveTemper", (v, k) => {
    const temper = v.p("setting");
    const reacts = idx(v, "reactsTo", 3);
    const lagF = v.n("lag");
    const leads = idx(v, "leads", 3);
    const shake = (v.n("shake") / 5) * 0.5 + (v.n("shakeSize") / 20) * 0.5;
    const os = v.n("overshootPct") / 100;
    const N = 120;
    const act = (i) => {
      const f = i / N;
      return 0.5 + 0.28 * Math.sin(f * Math.PI * 3) + (f > 0.55 && f < 0.7 ? 0.18 : 0);
    };
    const shift = Math.round(((leads === 0 ? 1 : leads === 1 ? 0 : -1) * (2 + lagF)) * 0.9);
    const actP = Array.from({ length: N + 1 }, (_, i) => act(i));
    const camP = Array.from({ length: N + 1 }, (_, i) => {
      const j = k.clamp(i - shift, 0, N);
      let y = act(j);
      if (reacts === 0) y = 0.5;
      if (reacts === 1) y = 0.5 + (act(j) - 0.5) * 0.5 + (j / N > 0.55 && j / N < 0.7 ? 0.1 : 0);
      const prev = act(Math.max(0, j - 3));
      y += (y - prev) * os * 3;
      y += (k.rnd(i + 3) - 0.5) * shake * 0.15;
      y = 0.5 + (y - 0.5) * (0.6 + temper * 0.5);
      return k.clamp(y, 0.02, 0.98);
    });
    const G = { x: 12, y: 26, w: 194, h: 110 };
    let s = k.bg(BG) + `<rect x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}" fill="#1d1d22"/>`;
    s += k.graph({ x: G.x, y: G.y, w: G.w, h: G.h, points: actP, color: YEL, w2: 3 }) + k.graph({ x: G.x, y: G.y, w: G.w, h: G.h, points: camP, color: "#6fb4ff", w2: 2 });
    s += k.label({ x: 12, y: 18, text: "the action (yellow), the camera (blue)", size: 8, color: "#bbb", anchor: "start" }) + k.cam({ x: 196, y: 150, s: 0.5 });
    s += side(k, [{ label: "Temper", text: `${v("setting")} of 5` }, { label: "Reacts to", text: v("reactsTo") }, { label: `Lag ${lagF} frames`, p: lagF / 24, color: "#6fb4ff" }, { label: "Gets there", text: v("leads") }, { label: `Wobble ${v("shake")}/5, ${v.n("shakeSize")} cm`, p: shake }, { label: `Swings past ${v.n("overshootPct")}%`, p: os / 0.3, color: "#ff9a5a" }]);
    return s + k.caption(`camera ${v("leads")}, reacts to ${v("reactsTo")}`);
  });

  /* ---------- Spacing: a ball moving from left to right, one dot per frame ---------- */
  W.look("spacing", (v, k) => {
    const kind = String(v("setting"));
    const st = 0.6 + (v.n("strength") / 5) * 1.8;
    const rest = Math.round(v.n("restEnds") / 3);
    const wt = idx(v, "weight", 5);
    const vary = idx(v, "varies", 3);
    const drift = idx(v, "drift", 3);
    const ep = v.n("easePct") / 100;
    const kinds = ["even", "ease in", "ease out", "ease both", "snap"];
    const curve = (kd, t, strength) => {
      const e = ease(kd, t);
      const shaped = kd === "ease in" ? Math.pow(t, 1 + strength * 0.6) : kd === "ease out" ? 1 - Math.pow(1 - t, 1 + strength * 0.6) : e;
      return t < ep / 2 || t > 1 - ep / 2 || kd === "even" ? shaped : k.lerp(t, shaped, 0.5);
    };
    let s = k.bg(BG);
    const rows = [0, 1, 2];
    rows.forEach((r) => {
      let kd = kind;
      if (vary === 1 && r === 2) kd = kinds[(kinds.indexOf(kind) + 1) % 5];
      if (vary === 2) kd = kinds[(kinds.indexOf(kind) + r * 2) % 5];
      const str = st * (drift === 0 ? 1 - r * 0.3 : drift === 2 ? 1 + r * 0.4 : 1);
      const y = 36 + r * 42;
      const n = 12;
      s += `<line x1="16" y1="${y}" x2="196" y2="${y}" stroke="#333"/>`;
      const xs = [];
      for (let i = 0; i < rest; i++) xs.push(0);
      for (let i = 0; i <= n; i++) xs.push(curve(kd, i / n, str));
      for (let i = 0; i < rest; i++) xs.push(1);
      xs.forEach((p, i) => (s += `<circle cx="${r1(20 + p * 172)}" cy="${y + (i < rest || i >= xs.length - rest ? (i % 2 ? -5 : 5) : 0)}" r="${r1(3 + wt * 0.9)}" fill="${k.mix("#bfe3ff", "#3b4b6b", wt / 4)}" stroke="#1c1712" stroke-width="0.6"/>`));
      s += k.label({ x: 20, y: y - 10, text: `${r === 0 ? "move 1" : r === 1 ? "later" : "much later"}: ${kd}`, size: 7, color: "#999", anchor: "start" });
    });
    s += side(k, [{ label: "Spacing", text: kind }, { label: `Strength ${v("strength")}/5`, p: v.n("strength") / 5 }, { label: `Rest at each end ${v.n("restEnds")} fr`, p: v.n("restEnds") / 12, color: "#999" }, { label: `Easing ${v.n("easePct")}% of the move`, p: ep, color: "#9fd3ff" }, { label: "Weight", text: v("weight") }, { label: "Over the film", text: `${v("drift")}, ${v("varies")}` }]);
    return s + k.caption("one dot per frame: close dots are slow, far apart is fast");
  });

  /* ---------- Drawn on ones, twos or threes: frames in a row, a new drawing at each color change ---------- */
  W.look("stepping", (v, k) => {
    const n = (id) => idx(v, id, id === "holdRate" ? 4 : 3) + 1;
    const mix = idx(v, "mix", 3);
    const rows = [["this shot", n("setting")], ["fast action", n("actionRate")], ["quiet moments", n("holdRate")]];
    let s = k.bg(BG);
    const sw = [0, 1, 3][idx(v, "switchFor", 3)];
    rows.forEach(([name, step], r) => {
      const y = 22 + r * 32;
      s += k.label({ x: 8, y: y - 3, text: `${name}: on ${["ones", "twos", "threes", "fours"][step - 1]}`, size: 7, color: "#aaa", anchor: "start" });
      let draw = 0;
      let left = 0;
      for (let f = 0; f < 24; f++) {
        let st = step;
        if (r === 0 && mix === 1 && f >= 16) st = Math.max(1, step - 1);
        if (r === 0 && mix === 2) st = 1 + ((Math.floor(f / 6) + step) % 3);
        if (r === 0 && sw && [6, 14, 20].slice(0, sw).some((x) => f >= x && f < x + 3)) st = 1;
        if (left <= 0) (draw++, (left = st));
        left--;
        s += `<rect x="${r1(8 + f * 8.4)}" y="${y}" width="7.6" height="14" fill="${draw % 2 ? "#6c8fb8" : "#a7c4e4"}"/>`;
      }
      if (r === 0 && sw) [6, 14, 20].slice(0, sw).forEach((x) => (s += k.label({ x: 8 + x * 8.4 + 12, y: y + 22, text: "★", size: 7, color: YEL })));
    });
    /* The drawn wobble ("boil"): a little figure drawn three times. */
    const boil = (v.n("boilPx") + idx(v, "boil", 3) * 1.5) * 0.8;
    s += k.label({ x: 60, y: 122, text: "hand-drawn wobble", size: 7, color: "#aaa" });
    for (let c = 0; c < 3; c++) {
      const pts = Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * Math.PI * 2; const rr = 14 + (k.rnd(i + c * 20) - 0.5) * boil * 2; return `${r1(30 + c * 30 + Math.cos(a) * rr)},${r1(144 + Math.sin(a) * rr * 0.8)}`; });
      s += `<polygon points="${pts.join(" ")}" fill="none" stroke="${["#ff9a8a", "#9fd3ff", "#ffd166"][c]}" stroke-width="1.5" opacity="0.8"/>`;
    }
    s += side(k, [{ label: "Drawn on", text: v("setting") }, { label: "Mixed", text: v("mix") }, { label: "Big moments", text: v("switchFor") }, { label: `Wobble ${v.n("boilPx")} px`, p: v.n("boilPx") / 6, color: "#ff9a8a" }, { label: "Boil", text: v("boil") }]);
    return s + k.caption("24 frames = 1 second; each color block is one drawing");
  });

  /* ---------- Anticipation: a wind-up before the move, as ghosts of the pose ---------- */
  W.look("anticipation", (v, k) => {
    const on = idx(v, "setting", 3);
    const sz = (0.3 + on * 0.35) * (0.3 + (v.n("size") / 5) * 0.7);
    const frames = Math.round(v.n("frames"));
    const way = String(v("windupWay"));
    let s = k.bg(BG) + `<line x1="0" y1="140" x2="210" y2="140" stroke="#666" stroke-width="2"/>`;
    const sx = 80;
    const back = 10 + sz * 40;
    const ghosts = Math.max(1, Math.round(frames / 2));
    let wind = "";
    for (let i = 1; i <= ghosts; i++) {
      const f = i / ghosts;
      const x = way === "the opposite way" ? sx : sx - back * f;
      const y = way === "the opposite way" ? 140 + f * back * 0.2 : 140;
      const sq = way === "the opposite way" ? 1 - f * 0.3 : 1;
      wind += `<g transform="translate(${r1(x)} ${r1(y)}) scale(1 ${r1(sq)}) translate(${-r1(x)} ${-r1(y)})">${k.person({ x, y, s: 1, color: "#ff9a5a", lean: -f * 15 * sz * 2, alpha: 0.25 + 0.4 * f })}</g>`;
    }
    if (way === "a big loop") wind += `<path d="M${sx} 70 q-${r1(back)} -30 -${r1(back)} 10 q0 30 ${r1(back * 1.4)} 10" fill="none" stroke="#ff9a5a" stroke-dasharray="3 3" stroke-width="1.5"/>`;
    s += ghost(on > 0, wind);
    s += k.person({ x: sx + 60, y: 140, s: 1, color: BLUE, lean: 18, walk: 0.8 }) + k.arrow({ x1: sx + 10, y1: 60, x2: sx + 80, y2: 60, color: YEL, w: 2.5 });
    if (!on) s += k.label({ x: 105, y: 22, text: "no wind-up: shown faint", size: 8, color: "#aaa" });
    const warn = idx(v, "warns", 3);
    if (warn) s += k.label({ x: 30, y: 36, text: warn === 1 ? "?" : "!", size: 10 + warn * 6, color: YEL, weight: 800 });
    const fake = [0, 1, 3][idx(v, "fakeOut", 3)];
    for (let i = 0; i < fake; i++) s += `<path d="M${130 + i * 20} 112 q8 -16 16 0" fill="none" stroke="#ff6b8a" stroke-width="1.5" stroke-dasharray="2 2"/>` + k.label({ x: 138 + i * 20, y: 124, text: "fake", size: 6.5, color: "#ff6b8a" });
    /* Which moves get it: small, bigger, the big one. */
    const used = idx(v, "usedOn", 3);
    s += side(k, [{ label: "Wind-up", text: `${v("setting")}, ${way}` }, { label: `Length ${frames} frames`, p: frames / 12, color: "#ff9a5a" }, { label: `Size ${v("size")}/5`, p: v.n("size") / 5, color: "#ff9a5a" }, { label: "Warns us", text: v("warns") }, { label: "Fake-out", text: v("fakeOut") }]);
    s += k.label({ x: 265, y: 126, text: "on which moves", size: 7, color: "#999" }) + [0, 1, 2].map((i) => `<rect x="${226 + i * 28}" y="${148 - (i + 1) * 6}" width="20" height="${(i + 1) * 6}" fill="${i >= used ? "#ff9a5a" : "#444"}"/>`).join("");
    return s + k.caption(`${v("setting")} wind-up, ${frames} frames, on ${v("usedOn")}`);
  });

  /* ---------- Overshoot: the move goes past its mark and settles, drawn as a line over time ---------- */
  W.look("overshoot", (v, k) => {
    const mode = idx(v, "setting", 3);
    const amt = (0.15 + (v.n("howMuch") / 5) * 0.85) * (0.1 + v.n("pastPct") / 40);
    const wob = Math.round(v.n("wobbles")) + (mode === 2 ? 1 : 0);
    const settle = 4 + v.n("settleFrames");
    const G = { x: 14, y: 30, w: 192, h: 90 };
    const T = 40;
    const pts = Array.from({ length: 81 }, (_, i) => {
      const t = (i / 80) * T;
      const arrive = 12;
      if (t < arrive) return 0.1 + 0.6 * ease("ease in", t / arrive);
      const u = (t - arrive) / settle;
      if (u > 1 || mode === 0) return 0.7;
      const osc = Math.sin(u * Math.PI * (wob + 1)) * (1 - u);
      return k.clamp(0.7 + osc * amt * 0.5 * (mode === 0 ? 0 : 1), 0.02, 0.98);
    });
    let s = k.bg(BG) + `<rect x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}" fill="#1d1d22"/><line x1="${G.x}" y1="${r1(G.y + G.h * 0.3)}" x2="${G.x + G.w}" y2="${r1(G.y + G.h * 0.3)}" stroke="#7fd18b" stroke-dasharray="4 3"/>` + k.label({ x: G.x + G.w - 2, y: G.y + G.h * 0.3 - 4, text: "the mark", size: 7, color: "#7fd18b", anchor: "end" });
    s += ghost(mode > 0, k.graph({ x: G.x, y: G.y, w: G.w, h: G.h, points: pts, color: YEL }));
    if (!mode) s += k.label({ x: 110, y: 46, text: "no overshoot: it stops dead (shown faint)", size: 7, color: "#aaa" });
    const what = String(v("whatOvershoots"));
    s += k.label({ x: 14, y: 20, text: `what goes past: ${what}`, size: 8, color: "#ccc", anchor: "start" });
    /* Which stops get it. */
    const em = idx(v, "emphasis", 3);
    s += k.label({ x: 14, y: 136, text: "stops in the scene:", size: 7, color: "#999", anchor: "start" });
    [0.3, 0.6, 1].forEach((h, i) => {
      const on = em === 0 || (em === 1 && i > 0) || (em === 2 && i === 2);
      s += `<rect x="${90 + i * 36}" y="${150 - h * 14}" width="26" height="${h * 14}" fill="${on ? YEL : "#444"}"/>` + (on ? `<path d="M${90 + i * 36} ${146 - h * 14} q6 -6 13 0 q6 6 13 0" fill="none" stroke="${YEL}"/>` : "");
    });
    s += side(k, [{ label: "Overshoot", text: v("setting") }, { label: `How much ${v("howMuch")}/5, past by ${v.n("pastPct")}%`, p: amt / 1.1 }, { label: "Wobbles", n: v.n("wobbles") }, { label: `Settles in ${v.n("settleFrames")} frames`, p: v.n("settleFrames") / 12, color: "#9fd3ff" }, { label: "Used on", text: v("emphasis") }]);
    return s + k.caption(`${v("setting")}, ${wob} wobble${wob === 1 ? "" : "s"} before rest`);
  });

  /* ---------- Overlap: a figure that has just stopped, with loose parts still swinging ---------- */
  W.look("overlap", (v, k) => {
    const which = idx(v, "setting", 5);
    const lag = v.n("lag");
    const amt = 0.3 + (v.n("howMuch") / 5) * 0.7;
    const flop = idx(v, "floppiness", 3);
    const wind = idx(v, "wind", 3);
    const trail = v.n("trailAngle");
    const ft = Math.round(v.n("followThrough") / 6);
    const px = 120;
    let s = k.bg(BG) + `<line x1="0" y1="146" x2="210" y2="146" stroke="#666" stroke-width="2"/>`;
    for (let i = 0; i < wind * 3; i++) s += `<line x1="${10 + i * 14}" y1="${40 + (i % 3) * 22}" x2="${30 + i * 14 + wind * 8}" y2="${40 + (i % 3) * 22}" stroke="#556" stroke-width="1.2"/>`;
    const bodyS = k.person({ x: px, y: 146, s: 1.5, color: BLUE, lean: -4, look: -1 });
    s += k.label({ x: 8, y: 20, text: "← was moving left, now stopped: loose parts swing on", size: 7, color: "#999", anchor: "start" });
    /* The loose parts: hair, a scarf, the hands. They swing forward past the stop. */
    const a = k.rad(90 + trail * amt + lag * 3);
    const wig = flop * 4;
    const hair = (gx, gy, len, col, w) => `<path d="M${gx} ${gy} q${r1(Math.cos(a) * len * 0.5 + wig)} ${r1(Math.sin(a) * len * 0.5 - wig)} ${r1(Math.cos(a) * len)} ${r1(Math.sin(a) * len)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
    const head = [px, 146 - 36 - 51 - 13];
    const showHair = which === 1 || which === 4;
    const showCloth = which === 2 || which === 4;
    const showHands = which === 3 || which === 4;
    const hairS = [0, 1, 2].map((j) => hair(head[0] + 2 + j * 4, head[1] - 10 + j * 3, 34 + lag * 2, "#6b3f1f", 3)).join("");
    const clothS = hair(px, 146 - 36 - 46, 40 + lag * 3, "#c0392b", 6);
    const handS = [-1, 1].map((sd) => `<circle cx="${r1(px + sd * 24 + Math.cos(a) * 10 * amt)}" cy="${r1(96 + Math.sin(a) * 6)}" r="4" fill="#f0c8a0" stroke="#1c1712"/>`).join("");
    let pre = ghost(showHair, hairS);
    for (let i = 1; i <= ft; i++) pre += `<g opacity="${r1(0.25 / i)}" transform="rotate(${i * 8} ${head[0]} ${head[1]})">${showHair ? hairS : clothS}</g>`;
    s += pre + bodyS + ghost(showCloth, clothS) + ghost(showHands, handS);
    s += k.caption(`${v("setting")} keep moving, ${v("floppiness")}, ${v("wind")}`);
    if (!which) s += k.label({ x: 105, y: 34, text: "nothing overlaps: loose parts shown faint", size: 7, color: "#aaa" });
    s += side(k, [{ label: "What keeps moving", text: v("setting") }, { label: `Lag ${lag} frames`, p: lag / 8, color: "#9fd3ff" }, { label: `Follow-through ${v.n("followThrough")} frames`, p: v.n("followThrough") / 24 }, { label: `Trails by ${trail}°`, p: trail / 90, color: "#ff9a5a" }, { label: "Floppy or stiff", text: v("floppiness") }, { label: "Wind", text: v("wind") }]);
    return s;
  });

  /* ---------- Path shape: the path a body part draws through the air ---------- */
  W.look("arcs", (v, k) => {
    const shape = String(v("setting"));
    const round = v.n("roundness") / 5;
    const size = 0.35 + (v.n("arcSize") / 5) * 0.65;
    const part = String(v("whichPart"));
    const trail = idx(v, "trail", 3);
    const tf = Math.round(v.n("trailFrames") / 2);
    const P = (t) => {
      const x = 30 + t * 150;
      let y = 100;
      if (shape === "straight") y = 100 - t * 50 * size;
      if (shape === "arc") y = 100 - Math.sin(t * Math.PI) * 70 * size * (0.3 + round * 0.7) - t * 20 * (1 - round);
      if (shape === "figure eight") return [105 + Math.sin(t * Math.PI * 2) * 70 * size, 80 + Math.sin(t * Math.PI * 4) * 30 * size * (0.4 + round * 0.6)];
      return [x, y];
    };
    let s = k.bg(BG);
    const pts = Array.from({ length: 41 }, (_, i) => P(i / 40));
    s += `<polyline points="${pts.map((p) => p.map(r1).join(",")).join(" ")}" fill="none" stroke="#555" stroke-dasharray="3 3"/>`;
    const col = { "the head": "#f0c8a0", "the hands": "#ffd166", "the whole body": "#6fa8ff" }[part];
    const rr = part === "the whole body" ? 11 : part === "the head" ? 8 : 5;
    const ghosts = Math.max(1, tf);
    const tr = Array.from({ length: ghosts }, (_, i) => { const p = P(0.9 - (i + 1) * 0.05); return `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${rr}" fill="${col}" opacity="${r1((trail === 2 ? 0.5 : 0.22) * (1 - i / ghosts))}"/>`; }).join("");
    s += ghost(trail > 0, tr);
    const E = P(0.9);
    s += `<circle cx="${r1(E[0])}" cy="${r1(E[1])}" r="${rr}" fill="${col}" stroke="#1c1712" stroke-width="1.5"/>` + k.label({ x: E[0], y: E[1] - rr - 5, text: part, size: 8, color: "#ddd" });
    /* What keeps straight lines: a machine or a shock. */
    const sf = String(v("straightFor"));
    if (sf === "machines") s += `<rect x="16" y="128" width="20" height="18" fill="#888" stroke="#1c1712"/><line x1="40" y1="137" x2="90" y2="137" stroke="#bbb" stroke-width="2"/>` + k.label({ x: 60, y: 154, text: "machines: straight", size: 7, color: "#aaa" });
    if (sf === "sudden shocks") s += k.label({ x: 26, y: 142, text: "⚡", size: 14, color: YEL }) + `<line x1="40" y1="137" x2="90" y2="137" stroke="${YEL}" stroke-width="2"/>` + k.label({ x: 66, y: 154, text: "shocks: straight", size: 7, color: "#aaa" });
    if (sf === "nothing") s += k.label({ x: 60, y: 150, text: "nothing moves straight", size: 7, color: "#888" });
    s += side(k, [{ label: "Path shape", text: shape }, { label: `Roundness ${v("roundness")}/5`, p: round, color: "#9fd3ff" }, { label: `Size ${v("arcSize")}/5`, p: v.n("arcSize") / 5 }, { label: "Trail", text: `${v("trail")}, ${v.n("trailFrames")} frames` }, { label: "Straight lines for", text: sf }]);
    return s + k.caption(`${part} moves in ${shape === "straight" ? "a straight line" : `${shape === "arc" ? "an arc" : "a figure eight"}`}`);
  });

  /* ---------- Leads the move: which part turns first, and the rest following in order ---------- */
  W.look("leadPart", (v, k) => {
    const lead = String(v("setting"));
    const next = String(v("nextPart"));
    const order = [lead].concat(next !== lead ? [next] : []).concat(["eyes", "head", "hands", "hips"].filter((p) => p !== lead && p !== next));
    const pos = { eyes: [94, 46], head: [86, 42], hands: [116, 100], hips: [90, 112] };
    const px = 90;
    const lf = v.n("lead");
    let s = k.bg(BG) + `<line x1="0" y1="150" x2="210" y2="150" stroke="#666" stroke-width="2"/>`;
    s += k.person({ x: px, y: 150, s: 1.45, color: BLUE, look: 1, eyes: 0.9 });
    const turn = v.n("leadTurn");
    const p0 = pos[lead];
    s += `<path d="M${p0[0] + 14} ${p0[1]} A16 16 0 ${turn > 180 ? 1 : 0} 1 ${r1(p0[0] + 14 * Math.cos(k.rad(turn * 0.8)))} ${r1(p0[1] + 14 * Math.sin(k.rad(turn * 0.8)))}" fill="none" stroke="${YEL}" stroke-width="2"/>`;
    order.forEach((p, i) => {
      const q = pos[p];
      s += `<circle cx="${q[0] + (i === 0 ? 0 : -14)}" cy="${q[1]}" r="8" fill="${i === 0 ? YEL : i === 1 ? "#ff9a5a" : "#666"}" stroke="#1c1712"/>` + k.label({ x: q[0] + (i === 0 ? 0 : -14), y: q[1] + 3.5, text: `${i + 1}`, size: 9, color: "#111", weight: 700 });
    });
    /* The chain: a wave across the parts, slow, normal or a whip. */
    const ch = idx(v, "chainSpeed", 3);
    const pts = Array.from({ length: 31 }, (_, i) => { const f = i / 30; return 0.5 + Math.sin(f * Math.PI * (1 + ch)) * 0.35 * (ch === 2 ? f : 1); });
    s += k.graph({ x: 130, y: 120, w: 76, h: 26, points: pts, color: "#ff9a5a", w2: 1.5 }) + k.label({ x: 168, y: 116, text: v("chainSpeed"), size: 7, color: "#ccc" });
    const pa = idx(v, "pullsAudience", 3);
    if (pa) s += k.arrow({ x1: 112, y1: 42, x2: 180, y2: 42, color: "#9fd3ff", w: 1 + pa }) + k.label({ x: 186, y: 34, text: "we look", size: 7, color: "#9fd3ff" });
    s += side(k, [{ label: "Leads", text: lead }, { label: "Then", text: next }, { label: `${lf} frames ahead`, p: lf / 6 }, { label: `Lead part turns ${turn}°`, p: turn / 180, color: YEL }, { label: "We follow their look", text: v("pullsAudience") }]);
    return s + k.caption(`${lead} lead, then ${next}`);
  });

  /* ---------- Squash and stretch: a bouncing shape that squashes on landing and stretches in the air ---------- */
  W.look("squash", (v, k) => {
    const amt = 0.3 + (v.n("setting") / 5) * 0.7;
    const sq = (v.n("squashPct") / 100) * amt;
    const st = (v.n("stretchPct") / 100) * amt;
    const keep = v.n("volume") / 5;
    const part = String(v("parts"));
    const onI = idx(v, "onImpact", 3);
    const feel = idx(v, "squashFeel", 3);
    const rec = Math.round(v.n("recover") / 4);
    const col = part === "props" ? "#c0392b" : "#6fa8ff";
    let s = k.bg(BG) + `<line x1="0" y1="140" x2="210" y2="140" stroke="#666" stroke-width="2"/>`;
    const shape = (x, y, sx, sy, a) => {
      const w = 14 * sx;
      const h = 14 * sy;
      let g = part === "props" ? `<rect x="${r1(x - w * 0.6)}" y="${r1(y - h * 2)}" width="${r1(w * 1.2)}" height="${r1(h * 2)}" rx="${r1(w * 0.3)}" fill="${col}" opacity="${a}" stroke="#1c1712"/>` : `<ellipse cx="${r1(x)}" cy="${r1(y - h)}" rx="${r1(w)}" ry="${r1(h)}" fill="${col}" opacity="${a}" stroke="#1c1712"/>`;
      if (part !== "props") g += `<g opacity="${a}">${k.face({ x, y: y - h, r: Math.min(w, h) * (part === "the face" ? 0.9 : 0.6), mood: 0.4 })}</g>`;
      return g;
    };
    const P = (t) => [20 + t * 170, 140 - Math.abs(Math.sin(t * Math.PI * 2)) * 90];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const [x, y] = P(t);
      const ground = Math.abs(Math.sin(t * Math.PI * 2)) < 0.05;
      const air = !ground;
      const doSq = ground || onI === 2;
      const doSt = air && (onI >= 1 || i % 2 === 1);
      let sx = 1;
      let sy = 1;
      if (doSq && ground) (sy = 1 - sq), (sx = 1 + sq * keep);
      else if (doSt) (sy = 1 + st * 0.7), (sx = 1 - st * 0.35 * keep);
      s += shape(x, y, sx, sy, ground ? 1 : 0.4);
      if (ground && rec) for (let j = 1; j <= rec; j++) s += shape(x + j * 8, y, 1 + (sx - 1) / (j + 1), 1 + (sy - 1) / (j + 1), 0.18);
      if (ground && feel) s += `<path d="M${r1(x - 16)} ${r1(y - 4)} q-4 ${-4 * feel} 0 ${-8 * feel} M${r1(x + 16)} ${r1(y - 4)} q4 ${-4 * feel} 0 ${-8 * feel}" fill="none" stroke="#9fd3ff" stroke-width="1.2"/>`;
    }
    s += side(k, [{ label: "Squash and stretch", text: `${v("setting")} of 5, ${v("squashFeel")}` }, { label: `Squashed by ${v.n("squashPct")}%`, p: v.n("squashPct") / 60, color: "#6fa8ff" }, { label: `Stretched by ${v.n("stretchPct")}%`, p: v.n("stretchPct") / 100, color: "#ff9a5a" }, { label: `Keeps its volume ${v("volume")}/5`, p: keep, color: "#999" }, { label: `Snaps back in ${v.n("recover")} frames`, p: v.n("recover") / 12, color: "#9fd3ff" }, { label: "When", text: v("onImpact") }]);
    return s + k.caption(`${part}: flat on landing, long in the air`);
  });

  /* ---------- Key poses per line: the poses in a row under the words ---------- */
  W.look("poseRate", (v, k) => {
    const n = Math.max(1, Math.round(v.n("setting")));
    const hold = v.n("holdFrames");
    const btw = idx(v, "between", 3);
    const strong = String(v("strongOn"));
    const vari = idx(v, "variety", 3);
    const bu = idx(v, "buildUp", 3);
    let s = k.bg(BG) + `<line x1="6" y1="120" x2="310" y2="120" stroke="#555"/>`;
    const words = ["Well,", "I", "really", "don't", "know"];
    const sw = { "the first word": 0, "the key word": 2, "the last word": 4 }[strong];
    words.forEach((w, i) => (s += k.label({ x: 30 + i * 62, y: 140, text: w, size: 10, color: i === sw ? "#ff9a5a" : "#ddd", weight: i === sw ? 700 : 400 })));
    const sx = 300 / n;
    const strongI = strong === "the first word" ? 0 : strong === "the last word" ? n - 1 : Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
      const x = 10 + sx * (i + 0.5);
      const grow = bu === 0 ? 1.15 - (i / n) * 0.4 : bu === 2 ? 0.75 + (i / n) * 0.45 : 1;
      const sz = Math.min(0.95, sx / 50) * grow * (i === strongI ? 1.3 : 1);
      const arms = vari === 0 ? 0.3 : vari === 1 ? (i % 2 ? 0.8 : -0.2) : [-0.6, 0.9, 0.1, 0.6, -0.2, 1, -0.4, 0.4][i % 8];
      s += k.person({ x, y: 116, s: sz, color: i === strongI ? "#ff9a5a" : BLUE, arms, lean: vari === 2 ? ((i % 3) - 1) * 10 : 0 });
      s += `<rect x="${r1(x - Math.min(sx / 2 - 2, 2 + hold * 0.6))}" y="124" width="${r1(Math.min(sx - 4, 4 + hold * 1.2))}" height="4" fill="#9fd3ff"/>`;
      if (i < n - 1) {
        const x2 = 10 + sx * (i + 1.5);
        if (btw === 1) s += k.arrow({ x1: x + 10, y1: 40, x2: x2 - 10, y2: 40, color: "#888", w: 1 });
        if (btw === 2) s += `<path d="M${r1(x + 10)} 42 Q${r1((x + x2) / 2)} 28 ${r1(x2 - 10)} 42" fill="none" stroke="#888" stroke-width="1.2" stroke-dasharray="3 2"/>`;
      }
    }
    if (btw === 0) s += k.label({ x: 160, y: 156, text: "(snaps from pose to pose)", size: 7, color: "#888" });
    return s + k.caption(`${n} pose${n > 1 ? "s" : ""} a line, held ${hold} frames, ${v("variety")}, ${v("buildUp")}`);
  });

  /* ---------- Mouth shapes: a face, a row of mouth shapes under the sound ---------- */
  W.look("lipSync", (v, k) => {
    const n = Math.round(v.n("setting"));
    const acc = v.n("accuracy") / 5;
    const lead = v.n("lead");
    const open = [0.25, 0.5, 0.75, 1][idx(v, "openness", 4)];
    const vh = idx(v, "vowelHold", 3);
    const teeth = idx(v, "teeth", 3);
    let s = k.bg(BG);
    s += k.face({ x: 46, y: 66, r: 34, mood: 0.1, mouth: 0.2 + open * 0.8 });
    if (teeth) s += `<rect x="38" y="${r1(78 + open * 2)}" width="16" height="3" fill="#fff"/>` + (teeth === 2 ? `<ellipse cx="46" cy="${r1(84 + open * 4)}" rx="5" ry="2" fill="#d55"/>` : "");
    const G = { x: 96, w: 210 };
    s += k.label({ x: G.x, y: 24, text: "the sound", size: 7, color: "#999", anchor: "start" }) + k.wave({ x: G.x, y: 40, w: G.w, h: 22, amp: 0.9, cycles: 6, noise: 0.3, color: "#9fd3ff" });
    s += k.label({ x: G.x, y: 70, text: `mouth shapes (${n})`, size: 7, color: "#999", anchor: "start" });
    const cnt = Math.max(1, n);
    const step = G.w / cnt;
    let row = "";
    for (let i = 0; i < cnt; i++) {
      const off = (lead * 4) + (1 - acc) * (k.rnd(i + 3) - 0.5) * step * 0.8;
      const x = G.x + step * (i + 0.5) + off;
      const o = open * (0.3 + 0.7 * Math.abs(Math.sin((i + 1) * 1.7)));
      const w = vh && i % 3 === 1 ? 8 + vh * 6 : 8;
      row += `<ellipse cx="${r1(x)}" cy="88" rx="${r1(w)}" ry="${r1(1 + o * 8)}" fill="#5a1f1f" stroke="#1c1712"/>` + (teeth ? `<rect x="${r1(x - w * 0.6)}" y="${r1(88 - o * 8 + 1)}" width="${r1(w * 1.2)}" height="2" fill="#fff"/>` : "");
      row += `<line x1="${r1(G.x + step * (i + 0.5))}" y1="58" x2="${r1(x)}" y2="78" stroke="#555" stroke-dasharray="1 2"/>`;
    }
    s += ghost(n > 0, row);
    s += k.label({ x: 200, y: 120, text: `mouth ${lead > 0 ? "ahead of" : lead < 0 ? "behind" : "on"} the sound by ${Math.abs(lead)} frames`, size: 8, color: "#ccc" });
    s += k.meter({ x: 110, y: 134, w: 180, label: `accuracy ${v("accuracy")}/5`, p: acc, color: "#7fd18b" });
    return s + k.caption(`${n} mouth shapes, ${v("openness")}, long sounds: ${v("vowelHold")}, teeth ${v("teeth")}`);
  });

  /* ---------- Eye darts: big eyes, and where they flick to ---------- */
  W.look("gazeShift", (v, k) => {
    const n = Math.round(v.n("setting"));
    const sz = (0.3 + (v.n("size") / 5) * 0.7) * (0.3 + (v.n("dartDeg") / 60) * 0.7);
    const lx = v.n("lookAround") / 90;
    const ly = v.n("lookUpDown") / 60;
    const tgt = String(v("target"));
    let s = k.bg(BG);
    [-1, 1].forEach((sd) => {
      const x = 80 + sd * 36;
      s += `<ellipse cx="${x}" cy="56" rx="26" ry="18" fill="#fff" stroke="#1c1712" stroke-width="2"/><circle cx="${r1(x + lx * 14)}" cy="${r1(56 + ly * 9)}" r="8" fill="#3b6ea5"/><circle cx="${r1(x + lx * 14)}" cy="${r1(56 + ly * 9)}" r="3.5" fill="#111"/>`;
    });
    /* The darts: arrows out from the eyes, toward the target. */
    const ta = { away: [1, -0.3], down: [0.2, 1], "to another person": [1, 0.1], "to an object": [-1, 0.6] }[tgt];
    for (let i = 0; i < Math.max(1, n); i++) {
      const L = 20 + sz * 60;
      const a = Math.atan2(ta[1], ta[0]) + (k.rnd(i + 2) - 0.5) * 0.9;
      const ax = 80 + Math.cos(a) * 30;
      const ay = 56 + Math.sin(a) * 22;
      s += ghost(n > 0, k.arrow({ x1: ax, y1: ay, x2: ax + Math.cos(a) * L, y2: ay + Math.sin(a) * L * 0.6, color: "#9fd3ff", w: 1.5 }));
    }
    if (tgt === "to another person") s += k.person({ x: 194, y: 120, s: 0.6, color: "#777" });
    if (tgt === "to an object") s += `<rect x="10" y="96" width="14" height="16" fill="#ddd" stroke="#1c1712"/>`;
    if (tgt === "down") s += `<line x1="40" y1="140" x2="130" y2="140" stroke="#555" stroke-width="3"/>`;
    const gv = String(v("givesAway"));
    if (gv !== "nothing") s += k.label({ x: 80, y: 18, text: { nerves: "nervous", "a lie": "a lie?", "a secret": "a secret…" }[gv], size: 9, color: "#ff9a8a", weight: 600 });
    const ret = String(v("returnTo"));
    if (ret !== "nobody") s += k.arrow({ x1: 150, y1: 100, x2: 100, y2: 82, color: "#7fd18b", w: 1.2 }) + k.label({ x: 160, y: 108, text: `back to ${ret === "the camera" ? "camera" : "them"}`, size: 7, color: "#7fd18b" });
    const lu = idx(v, "leadsUs", 3);
    for (let i = 0; i < lu * 2; i++) s += k.face({ x: 20 + i * 18, y: 150, r: 6, look: ta[0] > 0 ? 1 : -1 });
    const t = track(k, { x: 100, y: 150, w: 100, t0: 0, t1: 10 });
    s += t.s + mark(k, t.X(v.n("firstDart")), 146, "#9fd3ff", "") + `<rect x="${r1(t.X(v.n("firstDart")))}" y="152" width="${r1(t.X(v.n("firstDart") + v.n("holdLook")) - t.X(v.n("firstDart")))}" height="4" fill="#9fd3ff"/>`;
    s += side(k, [{ label: "Darts", n }, { label: `Each dart ${v.n("dartDeg")}°, size ${v("size")}`, p: sz }, { label: "Look around · up/down", text: `${v.n("lookAround")}° · ${v.n("lookUpDown")}°` }, { label: `First dart after ${v.n("firstDart")} s`, p: v.n("firstDart") / 10, color: "#9fd3ff" }, { label: `Holds the look ${v.n("holdLook")} s`, p: v.n("holdLook") / 5, color: "#9fd3ff" }, { label: "Gives away", text: gv }]);
    return s + k.caption(`${n} dart${n === 1 ? "" : "s"} ${tgt}`);
  });

  /* ---------- Posture: one body, closed or open, leaning, tall or shrunk, facing the other ---------- */
  W.look("posture", (v, k) => {
    const op = idx(v, "setting", 3);
    const lean = v.n("lean") * 3 + v.n("leanDegrees");
    const ten = v.n("tension") / 5;
    const stat = [0.75, 0.88, 1, 1.15][idx(v, "stature", 4)];
    const face = idx(v, "facing", 3);
    const turned = v.n("turnedDeg");
    const gap = 40 + v.p("standGap") * 80;
    const px = 70;
    const sh = idx(v, "shiftOnLine", 3);
    let s = k.bg(BG) + k.wall({ y: 130, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    const sc = Math.max(0.35, Math.abs(Math.cos(k.rad(turned))));
    const lookDir = turned > 90 || face === 0 ? -1 : face === 1 ? 0.3 : 1;
    if (sh) s += `<g opacity="0.25">${k.person({ x: px, y: 152, s: 1.3 * stat, color: BLUE, lean: -lean, arms: op === 0 ? 0.6 : -0.2 })}</g>`;
    const body = k.person({ x: px, y: 152, s: 1.3 * stat, color: BLUE, lean, arms: [-0.35, 0, 0.6][op], mood: [-0.3, 0, 0.3][op], look: lookDir });
    s += `<g transform="translate(${px} 0) scale(${r1(sc)} 1) translate(${-px} 0)">${body}</g>`;
    const chestY = 152 - 31 * stat - 38 * stat;
    if (op === 0) s += `<rect x="${px - 14}" y="${r1(chestY + 6)}" width="28" height="6" rx="3" fill="#1c1712" transform="rotate(${r1(lean)} ${px} 152)"/>`;
    if (ten > 0) s += [-1, 1].map((sd) => `<path d="M${r1(px + sd * 14)} ${r1(chestY - 6)} l${sd * 4} -4 l${sd * 4} 4" fill="none" stroke="#ff6b5a" stroke-width="${r1(0.6 + ten * 1.6)}"/>`).join("");
    const chin = v.n("chin");
    s += k.arrow({ x1: px, y1: chestY - 40 * stat, x2: px + 18, y2: chestY - 40 * stat - chin * 0.6, color: "#9fd3ff", w: 1.2 });
    s += k.person({ x: Math.min(200, px + gap), y: 152, s: 1.1, color: "#777", look: -1 }) + `<line x1="${px}" y1="160" x2="${Math.min(200, px + gap)}" y2="160" stroke="#666" stroke-dasharray="2 2"/>` + k.label({ x: px + gap / 2, y: 158, text: `${v.n("standGap")} m`, size: 7, color: "#aaa" });
    if (sh) s += k.label({ x: 110, y: 22, text: sh === 1 ? "shifts a little on the key line" : "a big change on the key line", size: 8, color: "#ccc" });
    s += side(k, [{ label: "Posture", text: v("setting") }, { label: "Lean", text: `${v("lean")} · ${v.n("leanDegrees")}°` }, { label: `Tension ${v("tension")}/5`, p: ten, color: "#ff6b5a" }, { label: "Stature", text: v("stature") }, { label: "Facing the other", text: `${v("facing")}, ${turned}°` }, { label: "Chin", text: `${chin > 0 ? "up" : chin < 0 ? "down" : "level"} ${Math.abs(chin)}°` }]);
    return s;
  });

  /* ---------- Shapes in the scene: a frame with a person and the big shapes around them ---------- */
  W.look("sceneShapes", (v, k) => {
    const base = [0, 1, 4, 10][idx(v, "setting", 4)];
    const count = Math.max(1, Math.round((base + v.n("shapeCount")) / 2));
    const size = 0.4 + (v.n("size") / 5) * 0.8;
    const kind = String(v("shapeKind"));
    const arr = String(v("arrangement"));
    const crowd = idx(v, "crowding", 3);
    const fill = v.n("shapeFill") / 100;
    const px = 10 + (v.n("personAcross") / 100) * 190;
    let s = k.bg(BG) + `<rect x="6" y="6" width="198" height="150" fill="#262a32"/>`;
    const near = [60, 34, 16][crowd];
    let shapes = "";
    for (let i = 0; i < count; i++) {
      let x;
      let y;
      if (arr === "balanced") (x = 20 + ((i + 0.5) / count) * 170), (y = 40 + (i % 2) * 60);
      if (arr === "off to one side") (x = 150 + k.rnd(i) * 45), (y = 20 + k.rnd(i + 5) * 120);
      if (arr === "stacked") (x = 40 + (i % 2) * 6), (y = 140 - i * 18);
      if (arr === "scattered") (x = 14 + k.rnd(i + 2) * 180), (y = 14 + k.rnd(i + 9) * 130);
      if (Math.abs(x - px) < near) x = px + (x < px ? -near : near);
      const r = (6 + fill * 26) * size;
      const col = k.mix("#5a6a80", "#c0a070", (i % 3) / 3);
      if (kind === "round") shapes += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${col}" opacity="0.85"/>`;
      if (kind === "square") shapes += `<rect x="${r1(x - r)}" y="${r1(y - r)}" width="${r1(r * 2)}" height="${r1(r * 2)}" fill="${col}" opacity="0.85"/>`;
      if (kind === "sharp triangles") shapes += `<path d="M${r1(x)} ${r1(y - r)} L${r1(x + r)} ${r1(y + r)} L${r1(x - r)} ${r1(y + r)} Z" fill="${col}" opacity="0.85"/>`;
    }
    s += `<clipPath id="cw-sceneShapes-clip"><rect x="6" y="6" width="198" height="150"/></clipPath><g clip-path="url(#cw-sceneShapes-clip)">${ghost(base > 0, shapes)}`;
    const le = String(v("leadEye"));
    if (le !== "nowhere") {
      const tx = le === "the speaker" ? px : 180;
      const ty = le === "the speaker" ? 80 : 120;
      s += [[10, 10], [200, 10], [10, 150]].map((c) => `<line x1="${c[0]}" y1="${c[1]}" x2="${tx}" y2="${ty}" stroke="${YEL}" stroke-width="1" opacity="0.6"/>`).join("");
      if (le === "the key object") s += `<rect x="174" y="112" width="12" height="14" fill="${YEL}"/>`;
    }
    s += k.person({ x: px, y: 150, s: 1, color: ORANGE }) + `</g>`;
    if (!base) s += k.label({ x: 105, y: 20, text: "empty frame: shapes shown faint", size: 8, color: "#aaa" });
    s += side(k, [{ label: "Shapes", text: `${v("setting")}, ${kind}` }, { label: "Number of big shapes", n: v.n("shapeCount") }, { label: `Frame filled ${v.n("shapeFill")}%`, p: fill }, { label: `Person ${v.n("personAcross")}% across`, p: v.n("personAcross") / 100, color: ORANGE }, { label: "Sit", text: arr }, { label: "Space around them", text: v("crowding") }]);
    return s + k.caption(`size ${v("size")} of 5, leads the eye to ${le}`);
  });

  /* ---------- Business with a prop: hands busy with something while they talk ---------- */
  W.look("propBusiness", (v, k) => {
    const prop = String(v("prop"));
    const pace = idx(v, "handPace", 3);
    const eye = idx(v, "eyeOn", 3);
    const reach = 18 + v.p("propReach") * 60;
    const wrong = idx(v, "goesWrong", 3);
    const px = 60;
    let s = k.bg(BG) + k.wall({ y: 110, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    s += `<rect x="20" y="110" width="190" height="10" fill="#6b4a2b"/>`;
    s += k.person({ x: px, y: 150, s: 1.15, color: BLUE, arms: 0.2, look: 1, mood: [-0.3, 0, 0.3][idx(v, "fits", 3)] });
    const ox = px + reach;
    const draw = {
      cooking: `<rect x="${ox - 14}" y="98" width="28" height="10" rx="3" fill="#333" stroke="#ddd"/><line x1="${ox + 14}" y1="102" x2="${ox + 30}" y2="100" stroke="#333" stroke-width="3"/>`,
      cleaning: `<rect x="${ox - 10}" y="102" width="20" height="8" rx="2" fill="#7fd18b"/>`,
      "fixing something": `<rect x="${ox - 10}" y="96" width="22" height="14" fill="#888" stroke="#1c1712"/><line x1="${ox - 14}" y1="92" x2="${ox}" y2="100" stroke="#ccc" stroke-width="3"/>`,
      "eating or drinking": `<rect x="${ox - 6}" y="92" width="12" height="18" fill="#ddd" stroke="#1c1712"/>`,
      fiddling: `<line x1="${ox - 10}" y1="104" x2="${ox + 10}" y2="98" stroke="${YEL}" stroke-width="3"/>`,
    }[prop];
    s += draw + `<line x1="${px + 12}" y1="96" x2="${ox - 4}" y2="100" stroke="#1c1712" stroke-width="3.5" stroke-linecap="round"/>`;
    s += speed(k, ox - 16, 92, pace * 2, 10, "#ddd");
    if (wrong === 1) s += k.label({ x: ox + 10, y: 84, text: "oops", size: 8, color: "#ff9a5a" });
    if (wrong === 2) s += [0, 1, 2].map((i) => `<circle cx="${ox + i * 8 - 8}" cy="${80 - i * 6}" r="${5 + i * 2}" fill="#777" opacity="0.6"/>`).join("") + k.label({ x: ox + 18, y: 66, text: "disaster!", size: 9, color: "#ff6b5a", weight: 700 });
    const spot = eye === 0 ? [px, 60] : eye === 2 ? [ox, 100] : [(px + ox) / 2, 80];
    s += `<circle cx="${spot[0]}" cy="${spot[1]}" r="${eye === 1 ? 50 : 26}" fill="${YEL}" opacity="0.15"/>`;
    /* Busy share and the pause for the big line. */
    const t = track(k, { x: 10, y: 150, w: 196, t0: 0, t1: 30 });
    const busy = v.n("busyShare") / 100;
    const stops = [0, 1, 3][idx(v, "stopsFor", 3)];
    const ps = Math.max(0.5, v.n("pauseSeconds"));
    s += t.s + `<rect x="10" y="146" width="${r1(196 * busy)}" height="8" fill="#7fd18b" opacity="0.7"/>`;
    for (let i = 0; i < stops; i++) { const at = (30 * busy * (i + 1)) / (stops + 1); s += `<rect x="${r1(t.X(at))}" y="144" width="${r1(t.X(at + ps) - t.X(at))}" height="12" fill="#ff6b5a"/>`; }
    s += k.label({ x: 10, y: 140, text: `hands busy ${v.n("busyShare")}% · stops for big lines ${v("stopsFor")}, ${v.n("pauseSeconds")} s`, size: 7, color: "#aaa", anchor: "start" });
    s += side(k, [{ label: "The business", text: prop }, { label: "Hands move", text: v("handPace") }, { label: `Prop ${v.n("propReach")} m away`, p: v.p("propReach"), color: "#999" }, { label: "Eye goes", text: v("eyeOn") }, { label: "Fits the line", text: v("fits") }, { label: "Goes wrong", text: v("goesWrong") }]);
    return s;
  });

  /* ---------- Move on the line: the move, where it lands on the line, and the freeze after ---------- */
  W.look("moveOnLine", (v, k) => {
    const kind = String(v("kind"));
    const size = 0.3 + (v.n("size") / 5) * 0.7;
    const dist = (8 + v.p("moveMeters") * 50) * size;
    const dirI = idx(v, "moveDir", 3);
    const sharp = idx(v, "sharpness", 3);
    const turn = v.n("turnDegrees");
    const px = 80;
    const other = 175;
    const dx = dirI === 2 ? 1 : dirI === 0 ? -1 : 0;
    let s = k.bg(BG) + k.wall({ y: 118, color: "#3c414d", floor: "#2e2822" }).replace(/width="320"/g, 'width="210"');
    s += k.person({ x: other, y: 140, s: 0.95, color: "#777", look: -1 }) + k.label({ x: other, y: 154, text: "them", size: 7, color: "#aaa" });
    const ex = px + dx * dist;
    const ey = dirI === 1 ? 140 : 140;
    s += `<g opacity="0.3">${k.person({ x: px, y: 140, s: 1.05, color: BLUE })}</g>`;
    let lean = 0;
    let sc = 1.05;
    if (kind === "a lean") lean = dx * 12 * size + (dx === 0 ? 10 * size : 0);
    if (kind === "sitting or standing") sc = 0.8;
    const fx = kind === "a step" ? ex : kind === "a turn" ? px : px + dx * dist * 0.3;
    const body = k.person({ x: fx, y: ey, s: sc, color: BLUE, lean, look: kind === "a turn" && turn > 90 ? -1 : dx || 1 });
    s += kind === "a turn" ? `<g transform="translate(${fx} 0) scale(${r1(Math.max(0.3, Math.abs(Math.cos(k.rad(turn)))))} 1) translate(${-fx} 0)">${body}</g>` : body;
    if (kind === "sitting or standing") s += `<rect x="${fx - 14}" y="112" width="28" height="6" fill="#6b4a2b"/><rect x="${fx + 10}" y="96" width="5" height="22" fill="#6b4a2b"/>`;
    if (kind === "a turn") s += `<path d="M${px - 16} 30 A16 8 0 ${turn > 180 ? 1 : 0} 1 ${r1(px - 16 * Math.cos(k.rad(turn)))} ${r1(30 + 8 * Math.sin(k.rad(turn)))}" fill="none" stroke="${YEL}" stroke-width="2"/>` + k.label({ x: px, y: 22, text: `turns ${turn}°`, size: 8, color: YEL });
    if (dx && kind !== "a turn") s += sharp === 2 ? k.arrow({ x1: px, y1: 50, x2: ex, y2: 50, color: YEL, w: 2.5 }) : `<path d="M${px} 50 Q${(px + ex) / 2} ${sharp === 0 ? 30 : 42} ${ex} 50" fill="none" stroke="${YEL}" stroke-width="2" stroke-dasharray="${sharp === 0 ? "4 3" : ""}"/>`;
    if (!dx && kind !== "a turn") s += k.label({ x: px, y: 46, text: "sideways ↕", size: 8, color: YEL });
    /* When: on the line's timeline, with the freeze after. */
    const at = [-1.4, 0.8, 3.4, 4.6][idx(v, "timing", 4)] + v.n("moveOffset");
    const t = track(k, { x: 10, y: 154, w: 196, t0: -4, t1: 14, line: [0, 3] });
    const fz = idx(v, "freeze", 3);
    const fs = v.n("freezeSeconds") + [0, 0.5, 2][fz];
    s += t.s + `<rect x="${r1(t.X(at))}" y="140" width="${r1(Math.max(2, t.X(at + 0.6) - t.X(at)))}" height="6" fill="${YEL}"/>` + `<rect x="${r1(t.X(at + 0.6))}" y="140" width="${r1(t.X(at + 0.6 + fs) - t.X(at + 0.6))}" height="6" fill="#9fd3ff"/>` + k.label({ x: 10, y: 136, text: "the move (yellow), the freeze (blue)", size: 7, color: "#999", anchor: "start" });
    s += side(k, [{ label: "When", text: v("timing") }, { label: `Off the key word ${v.n("moveOffset")} s`, p: (v.n("moveOffset") + 3) / 6 }, { label: `Goes ${v.n("moveMeters")} m, size ${v("size")}`, p: size, color: YEL }, { label: "The move", text: `${kind}, ${v("moveDir")}` }, { label: "Sharpness", text: v("sharpness") }, { label: "Relative to", text: v("moveRel") }, { label: `Freeze ${v("freeze")}, ${v.n("freezeSeconds")} s`, p: v.n("freezeSeconds") / 10, color: "#9fd3ff" }]);
    return s;
  });

  /* ---------- Movement rules (the 3D character's rules): one figure walking by its rules ---------- */
  W.look("rigRulesLens", (v, k) => {
    const word = (id) => (v(id) == null ? "" : String(v(id)));
    const mode = word("setting");
    const moving = /walk|run/.test(mode);
    const run = /run/.test(mode);
    const pace = v.p("pace");
    const slump = v.p("slump");
    const flop = v.p("floppy");
    const limits = v.p("limits");
    const br = v.p("breath");
    const px = 90;
    const lean = Math.min(24, (run ? 10 : moving ? 4 : 0) + pace * 6 + (1 - slump) * 10);
    let s = k.bg(BG) + `<line x1="0" y1="146" x2="210" y2="146" stroke="#666" stroke-width="2"/>`;
    if (moving) s += speed(k, px - 18, 100, 1 + Math.round(pace * 3) + (run ? 2 : 0), 10 + v.n("walkSpeed") * 5);
    const look = /ground/.test(word("lookAt")) ? 0 : /camera/.test(word("lookAt")) ? 0 : 1;
    let f = k.person({ x: px, y: 146, s: 1.2 * (0.85 + slump * 0.2), color: BLUE, walk: run ? 1 : moving ? 0.5 + pace * 0.3 : 0, lean: 0, look, eyes: /ground/.test(word("lookAt")) ? 0.4 : 0.9, arms: run ? 0.4 : 0 });
    const headY = 146 - 1.2 * (0.85 + slump * 0.2) * (24 + 34 + 9);
    if (/ground/.test(word("lookAt"))) f += `<line x1="${px + 4}" y1="${headY}" x2="${px + 40}" y2="146" stroke="#9fd3ff" stroke-dasharray="2 3"/>`;
    if (/around/.test(word("setting") + word("lookAt"))) f += k.arrow({ x1: px, y1: headY - 22, x2: px - 30, y2: headY - 22, color: "#9fd3ff", w: 1.2 }) + k.arrow({ x1: px, y1: headY - 22, x2: px + 30, y2: headY - 22, color: "#9fd3ff", w: 1.2 });
    /* How far the head may turn, as an arc over the head. */
    const ht = v.n("headTurn");
    f += `<path d="M${r1(px - Math.sin(k.rad(ht)) * 24)} ${r1(headY - Math.cos(k.rad(ht)) * 24)} A24 24 0 0 1 ${r1(px + Math.sin(k.rad(ht)) * 24)} ${r1(headY - Math.cos(k.rad(ht)) * 24)}" fill="none" stroke="${YEL}" stroke-width="1.5"/>`;
    /* Loose parts lag and flop; limits bend the arms. */
    const lagL = 6 + v.n("lag") * 30;
    f += `<path d="M${px - 8} ${r1(headY + 30)} q${r1(-lagL * 0.5)} ${r1(flop * 10)} ${r1(-lagL)} ${r1(4 + flop * 12)}" fill="none" stroke="#c0392b" stroke-width="4" stroke-linecap="round"/>`;
    f += `<path d="M${px + 10} ${r1(headY + 36)} q${r1(10 + limits * 10)} ${r1(limits * 14)} ${r1(6)} ${r1(20 + limits * 6)}" fill="none" stroke="#1c1712" stroke-width="3" stroke-dasharray="${limits > 0.7 ? "" : "1 0"}"/>`;
    if (br > 0) f += [0, 1].slice(0, br > 0.5 ? 2 : 1).map((i) => `<path d="M${px + 14 + i * 6} ${r1(headY + 2 - i * 4)} q4 -3 8 0" fill="none" stroke="#cfe3ff" stroke-width="1.5"/>`).join("");
    s += `<g transform="rotate(${r1(lean)} ${px} 146)">${f}</g>`;
    s += side(k, [{ label: "Doing", text: `${mode}, ${word("pace")}` }, { label: `Walk speed ${v.n("walkSpeed")} m/s`, p: v.n("walkSpeed") / 6, color: "#9fd3ff" }, { label: `Head turns up to ${ht}°`, p: ht / 90 }, { label: `Loose parts lag ${v.n("lag")} s`, p: v.n("lag"), color: "#c0392b" }, { label: "Breaths a minute", n: v.n("breathRate") / 2, show: v.n("breathRate"), color: "#cfe3ff" }, { label: "Body", text: `${word("slump")}, ${word("floppy")}` }, { label: "Joints · breath", text: `${word("limits")}, ${word("breath")}` }]);
    return s + k.caption(`looking ${word("lookAt") || "ahead"}`);
  });

  /* ---------- Dot grids (a pad) where two settings pair naturally and the window has none yet ---------- */
  const pad = (id, x, y, xLabel, yLabel) => {
    const spec = W.get(id);
    if (spec && !(spec.faces || []).some((f) => f.face === "pad")) W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("bodyEnter", "entryDistance", "entryHeight", "near to far from the camera", "small to tall");
  pad("silence", "seconds", "silenceShare", "shorter to longer", "less to more of the scene");
  pad("characterSpeed", "speedMps", "rampSeconds", "slower to faster", "quick to slow to get going");
  pad("whoMoves", "moveMeters", "endGap", "moves less to more", "ends closer to further");
  pad("volume", "loudDb", "overRoom", "quieter to louder", "lost in the room to above it");
  pad("faceIntensity", "riseSeconds", "fadeSeconds", "quick to slow to arrive", "quick to slow to fade");
  pad("touch", "touchSeconds", "pressure", "shorter to longer", "lighter to firmer");
  pad("toneArc", "position", "stretch", "start to end of the story", "a moment to most of the film");
  pad("timePerCharacter", "lead", "secondShare", "lead's share", "second person's share");
  pad("actionCutRate", "setting", "variation", "fewer to more cuts", "even to varied");
  pad("walkAndTalk", "camAround", "camDistance", "camera around them", "closer to further");
  pad("animFeelLens", "squash", "pushPct", "less to more squash", "real to pushed");
  pad("rangeChanges", "jumpsPerMin", "jumpDb", "fewer to more jumps", "smaller to bigger jumps");
  pad("breath", "audible", "length", "silent to loud", "short to long breath");
  pad("eating", "messiness", "mouthFull", "tidy to messy", "empty to full mouth");
  pad("stillness", "holdTime", "movePct", "shorter to longer hold", "still to moving body");
  pad("blink", "rate", "blinkMs", "fewer to more blinks", "quick to slow blink");
  pad("spacing", "strength", "easePct", "gentle to strong", "less to more of the move easing");
  pad("anticipation", "frames", "size", "shorter to longer wind-up", "smaller to bigger");
  pad("overlap", "lag", "followThrough", "less to more lag", "shorter to longer follow-through");
  pad("leadPart", "lead", "leadTurn", "less to more ahead", "smaller to bigger turn");
  pad("squash", "squashPct", "stretchPct", "less to more squash", "less to more stretch");
  pad("lipSync", "setting", "accuracy", "fewer to more mouth shapes", "loose to exact");
  pad("sceneShapes", "shapeCount", "shapeFill", "fewer to more shapes", "emptier to fuller frame");
  pad("propBusiness", "busyShare", "pauseSeconds", "hands less to more busy", "shorter to longer pause");
  pad("moveOnLine", "moveOffset", "moveMeters", "before to after the word", "smaller to bigger move");
  pad("rigRulesLens", "walkSpeed", "headTurn", "slower to faster walk", "head turns less to more");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
