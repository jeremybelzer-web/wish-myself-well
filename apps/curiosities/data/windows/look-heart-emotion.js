/* look for the emotion curiosities in data/db-heart.js (database thread): the live picture at the top of each
   window. As in look-feeling.js, the feeling is shown on people (faces, bodies, distance) and, where it lives in
   time, as a line or a bar through the scene or the film. Every own setting moves something of its own. */
(function (W) {
  const r1 = (n) => Math.round(n * 10) / 10;
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const BG = "#15151b";
  const ink = "#1c1712";
  /* Small grey words. */
  const S = (k, x, y, t, c, a, sz) => k.label({ x, y, text: t, size: sz || 8, color: c || "#bbb", anchor: a || "middle" });
  /* Index of a word setting on its scale (0, 1, 2 ...). */
  const I = (v, id) => {
    const s = v.slider(id);
    const n = s && Array.isArray(s.scale) ? s.scale.length : 2;
    return Math.round(v.p(id) * (n - 1));
  };
  const PAL = ["#ffd166", "#7fd4ff", "#ff7aa2", "#9be36b", "#c9a0ff", "#ff9a3c"];
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
  function heart(k, x, y, r, color) {
    return `<path d="M${r1(x)} ${r1(y + r)} C${r1(x - r * 2)} ${r1(y - r * 0.4)} ${r1(x - r * 0.9)} ${r1(y - r * 1.6)} ${r1(x)} ${r1(y - r * 0.5)} C${r1(x + r * 0.9)} ${r1(y - r * 1.6)} ${r1(x + r * 2)} ${r1(y - r * 0.4)} ${r1(x)} ${r1(y + r)} Z" fill="${color || "#ef5370"}" stroke="${ink}" stroke-width="1"/>`;
  }
  const tear = (x, y, s) => `<path d="M${r1(x)} ${r1(y)} Q${r1(x - 3 * s)} ${r1(y + 6 * s)} ${r1(x)} ${r1(y + 8 * s)} Q${r1(x + 3 * s)} ${r1(y + 6 * s)} ${r1(x)} ${r1(y)} Z" fill="#5aa0ff"/>`;
  /* A line through time in a box {x, y, w, h}; f(t) gives 0..1. */
  function line(b, f, o) {
    o = o || {};
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      pts.push(`${r1(b.x + t * b.w)},${r1(b.y + b.h - cl(f(t), 0, 1) * b.h)}`);
    }
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${o.color || "#ffd166"}" stroke-width="${o.w || 2.5}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
  }
  const box = (b, label, k) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="5" fill="#1d1d24" stroke="#33333d"/>` + (label ? S(k, b.x + 4, b.y + 9, label, "#888", "start", 7) : "");
  /* A row of n little people. */
  const crowd = (k, x, y, n, o) => {
    o = o || {};
    let s = "";
    for (let i = 0; i < n; i++) s += k.person({ x: x + i * (o.gap || 14), y, s: o.s || 0.45, color: o.color || "#7a8aa0", mood: o.mood || 0, look: o.look || 0 });
    return s;
  };

  /* ---------------- empathy: the audience, and the distance to the character they feel with ---------------- */
  W.look("empathy", (v, k) => {
    const lv = v.n("level") / 5;
    const wi = I(v, "whose");
    const di = I(v, "doorway");
    const fl = I(v, "flaw");
    const t = v.n("timeWithThem");
    const y = 140;
    const ax = 40;
    const cx = 270 - lv * 120;
    const cs = [0.6, 0.75, 0.9, 1.1][wi];
    const ccol = ["#666", "#7a8aa0", "#4a6fa5", "#e0a83c"][wi];
    const door = [
      k.ring({ x: cx, y: y - 64 * cs, r: 14 * cs + 4, color: "#ffd166" }),
      k.bubble({ x: cx + 34, y: y - 104, w: 52, h: 20, text: "...", tail: -18, size: 10 }),
      k.hand({ x: cx + 22, y: y - 34, s: 0.45, open: 1 }),
      `<polyline points="${cx - 30},${y} ${cx - 10},${y - 30} ${cx + 4},${y - 18} ${cx + 30},${y - 50}" fill="none" stroke="#9be36b" stroke-width="2"/>`,
      `<g opacity="0.45">${heart(k, cx + 28, y - 70, 6, "#888")}</g><line x1="${cx + 24}" y1="${y - 78}" x2="${cx + 32}" y2="${y - 62}" stroke="${ink}" stroke-width="1.5"/>`,
    ][di];
    let flaws = "";
    for (let i = 0; i < fl; i++) flaws += `<line x1="${r1(cx - 6 + i * 4)}" y1="${r1(y - 50 * cs)}" x2="${r1(cx - 2 + i * 4)}" y2="${r1(y - 36 * cs)}" stroke="#ef5350" stroke-width="2"/>`;
    return (
      k.bg(BG) +
      k.tint({ color: "#ff7aa2", alpha: lv * 0.18 }) +
      k.person({ x: ax, y, s: 0.9, mood: lv * 0.3 - 0.1, look: 1, color: "#555a66", label: "us" }) +
      heart(k, ax, y - 44, 2 + lv * 6) +
      `<line x1="${ax + 14}" y1="${y - 70}" x2="${r1(cx - 16)}" y2="${y - 70}" stroke="#ff7aa2" stroke-width="${r1(1 + lv * 3)}" stroke-dasharray="${lv > 0.5 ? "0" : "4 4"}"/>` +
      k.person({ x: cx, y, s: cs, mood: -0.2, look: -1, color: ccol, alpha: wi === 0 ? 0.4 : 1 }) +
      flaws +
      door +
      k.pie({ x: 296, y: 26, r: 12, p: t / 10, color: "#9fd3ff" }) +
      S(k, 280, 30, `${t} min alone with them`, "#aaa", "end", 7) +
      S(k, 20, 22, `way in: ${v("doorway")}`, "#ffd166", "start") +
      k.caption(`Feel with: ${v("whose")} · ${v.n("level")} of 5 · flaws: ${v("flaw")}`)
    );
  });

  /* ---------------- sideTaking: the crowd's faces turn for or against one character, over the story ---------------- */
  W.look("sideTaking", (v, k) => {
    const lp = v.p("lean");
    const mood = lp * 2 - 1;
    const ri = I(v, "reason");
    const fi = I(v, "flipped");
    const fp = v.n("flipPoint") / 100;
    const ci = I(v, "cost");
    const col = k.mix("#ef5350", "#6cc070", lp);
    let audience = "";
    for (let i = 0; i < 5; i++) audience += k.face({ x: 30 + i * 30, y: 70, r: 11, mood, brows: ci === 2 ? -0.8 : ci === 1 ? -0.3 : mood * 0.5, look: 1 });
    let sweat = "";
    for (let i = 0; i < ci * 2; i++) sweat += tear(42 + i * 30, 56, 0.7);
    const reasonC = PAL[ri];
    const b = { x: 20, y: 112, w: 280, h: 34 };
    const flips = [0, 1, 3][fi];
    const f = (t) => {
      let side = lp;
      const n = flips;
      for (let j = 0; j < n; j++) if (t > fp + j * 0.08) side = 1 - side;
      return n ? 1 - side + (side - (1 - side)) * 0 : side;
    };
    return (
      k.bg(BG) +
      audience +
      sweat +
      `<rect x="${r1(30 + lp * 120 - 3)}" y="88" width="6" height="12" fill="${col}"/><rect x="20" y="96" width="140" height="3" fill="#444"/>` +
      S(k, 20, 108, "against", "#ef5350", "start", 7) +
      S(k, 160, 108, "for", "#6cc070", "end", 7) +
      k.person({ x: 240, y: 98, s: 1, mood: ri >= 4 ? -0.6 : 0.5, color: reasonC, arms: ri === 3 ? 0.9 : 0 }) +
      S(k, 240, 22, v("reason"), reasonC) +
      box(b, `our side through the story (flips ${v("flipped")})`, k) +
      line(b, f, { color: col }) +
      (flips ? `<line x1="${r1(b.x + fp * b.w)}" y1="${b.y}" x2="${r1(b.x + fp * b.w)}" y2="${b.y + b.h}" stroke="#ffd166" stroke-dasharray="3 2"/>` : "") +
      pin(k, b.x, b.y + b.h + 9, b.w, fp, "#ffd166") +
      k.caption(`${v("lean")} · liking them costs ${v("cost")} · mind changes ${v.n("flipPoint")}% in`)
    );
  });

  /* ---------------- awe: a person small before something huge, held, with sound and a shade of fear ---------------- */
  W.look("awe", (v, k) => {
    const sz = v.n("size") / 5;
    const si = I(v, "source");
    const sm = I(v, "smallness");
    const hold = v.n("holdTime");
    const snd = I(v, "sound");
    const fear = v.n("fearMix") / 5;
    const g = 150;
    let rays = "";
    const n = 2 + Math.round(sz * 12);
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / Math.max(1, n - 1)) * Math.PI;
      rays += `<line x1="200" y1="70" x2="${r1(200 + Math.cos(a) * (40 + sz * 70))}" y2="${r1(70 + Math.sin(a) * (40 + sz * 60))}" stroke="#ffe9a8" stroke-width="1.5" opacity="0.5"/>`;
    }
    const thing = [
      `<path d="M110 ${g} L200 ${r1(30 - sz * 10)} L290 ${g} Z" fill="#6b7a99" stroke="${ink}"/><path d="M180 ${r1(56 - sz * 6)} L200 ${r1(30 - sz * 10)} L220 ${r1(56 - sz * 6)} Z" fill="#eef"/>`,
      crowd(k, 120, g, 12, { gap: 14, s: 0.5 }) + crowd(k, 127, g - 16, 11, { gap: 14, s: 0.4 }),
      `<rect x="170" y="${r1(40 - sz * 10)}" width="60" height="${r1(g - 40 + sz * 10)}" fill="#8a8f9c" stroke="${ink}"/><rect x="190" y="${r1(20 - sz * 10)}" width="20" height="22" fill="#8a8f9c" stroke="${ink}"/>`,
      k.person({ x: 200, y: g, s: 1.4, arms: 1, color: "#e0a83c" }) + k.dot({ x: 200, y: 50, r: 6, color: "#fff7c2" }),
      `<circle cx="200" cy="70" r="${r1(24 + sz * 16)}" fill="#c9a0ff" opacity="0.7"/>`,
    ][si];
    const ps = [1, 0.7, 0.4, 0.2][sm];
    const notes = ["", "~", "♪ ♪", "♪ ♫ ♪ ♫"][snd];
    return (
      k.sky(0.35 + sz * 0.3) +
      rays +
      thing +
      k.floor(g, "#2e2a24") +
      k.person({ x: 60, y: g, s: ps, look: 1, mood: 0.3 - fear * 0.6, color: "#4a6fa5" }) +
      k.tint({ color: "#5a0f1a", alpha: fear * 0.35 }) +
      k.wave({ x: 14, y: 20, w: 70, h: 16, amp: snd / 3, cycles: 5, color: "#9fd3ff" }) +
      S(k, 90, 24, notes, "#9fd3ff", "start", 9) +
      bar(k, 230, 18, 80, "") +
      piece(k, 230, 18, 80, 0, hold / 30, "#ffd166") +
      S(k, 310, 34, `held ${hold} s`, "#eee", "end", 7) +
      k.caption(`${v("source")} · they look ${v("smallness")} · ${v("sound")}`)
    );
  });

  /* ---------------- nostalgia: a person now, and the remembered picture of long ago ---------------- */
  W.look("nostalgia", (v, k) => {
    const st = v.n("strength") / 5;
    const ti = I(v, "trigger");
    const wi = I(v, "whose");
    const sw = v.p("sweetness");
    const li = I(v, "look");
    const yrs = v.n("distance");
    const fx = 30;
    const fy = 24;
    const fw = 130;
    const fh = 90;
    const warm = k.mix("#f2c27a", "#7a8cc0", sw);
    let grain = "";
    if (li === 3) for (let i = 0; i < 40; i++) grain += k.dot({ x: fx + k.rnd(i) * fw, y: fy + k.rnd(i + 50) * fh, r: 0.8, color: "#fff" });
    const scan = li === 3 ? `<line x1="${fx}" y1="${fy + 30}" x2="${fx + fw}" y2="${fy + 30}" stroke="#fff" opacity="0.4"/>` : "";
    const memory =
      `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${warm}" opacity="${r1(0.35 + st * 0.6)}"/>` +
      k.person({ x: fx + 45, y: fy + fh - 4, s: 0.6, mood: 0.8 - sw, color: "#d98a5a" }) +
      k.person({ x: fx + 85, y: fy + fh - 4, s: 0.45, mood: 0.8 - sw, color: "#a5d07a" }) +
      `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#fff8e0" opacity="${[0, 0.12, 0.25, 0.1][li]}"/>` +
      grain +
      scan +
      `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="#f4f1ea" stroke-width="${li === 3 ? 1 : 4}"/>`;
    const trig = ["♪", "☕", "⌂", "▣", "☺"][ti];
    const now = k.person({ x: 250, y: 150, s: 1, look: -1, mood: 0.5 - sw * 1.2, color: "#4a6fa5" });
    const pullW = 1 + st * 5;
    const aud = wi >= 1 ? k.face({ x: 290, y: 30, r: 13, mood: 0.6 - sw, look: -1 }) + S(k, 290, 52, "us too", "#ccc", "middle", 7) : "";
    return (
      k.bg(BG) +
      memory +
      `<path d="M230 100 Q200 ${r1(130 - st * 20)} 165 ${r1(fy + fh / 2)}" fill="none" stroke="${warm}" stroke-width="${r1(pullW)}" opacity="${r1(0.3 + st * 0.7)}"/>` +
      (wi === 1 ? `<g opacity="0.35">${now}</g>` : now) +
      k.text({ x: 210, y: 70, text: trig, size: 18, color: "#ffd166" }) +
      aud +
      bar(k, 30, 136, 130, "") +
      piece(k, 30, 136, 130, 1 - yrs / 60, 1, "#c9a0ff") +
      S(k, 95, 154, `${yrs} years ago`, "#c9a0ff") +
      k.caption(`${v("trigger")} · ${v("sweetness")} · ${v("look")} · ${v("whose")}`)
    );
  });

  /* ---------------- longing: a person reaching for something far away ---------------- */
  W.look("longing", (v, k) => {
    const st = v.n("strength") / 5;
    const ti = I(v, "target");
    const fi = I(v, "farAway");
    const sh = I(v, "shown");
    const sc = v.n("scenes");
    const fu = v.p("fulfilled");
    const y = 130;
    const ax = 50;
    const tx = [110, 170, 240, 290][fi];
    const ta = [1, 0.85, 0.6, 0.2][fi];
    const tcol = PAL[ti];
    const target = [
      k.person({ x: tx, y, s: 0.8, look: -1, color: tcol, alpha: ta }),
      `<g opacity="${ta}"><rect x="${tx - 16}" y="${y - 24}" width="32" height="24" fill="${tcol}"/><path d="M${tx - 20} ${y - 24} L${tx} ${y - 42} L${tx + 20} ${y - 24} Z" fill="${tcol}"/></g>`,
      `<g opacity="${ta}">${k.person({ x: tx, y, s: 0.6, color: tcol })}</g>`,
      `<g opacity="${ta}"><circle cx="${tx}" cy="${y - 30}" r="16" fill="${tcol}"/></g>`,
      `<g opacity="${ta}"><rect x="${tx - 12}" y="${y - 30}" width="24" height="30" rx="4" fill="${tcol}"/><circle cx="${tx}" cy="${y - 34}" r="7" fill="none" stroke="${tcol}" stroke-width="3"/></g>`,
    ][ti];
    const show = [
      "",
      `<line x1="${ax + 4}" y1="${y - 68}" x2="${tx}" y2="${y - 40}" stroke="#ffd166" stroke-dasharray="2 3"/>`,
      k.arrow({ x1: ax + 14, y1: y - 40, x2: ax + 40, y2: y - 46, color: "#ffd166", w: 2 }),
      k.bubble({ x: ax + 30, y: 30, w: 50, h: 20, text: "I wish", tail: -16, size: 9 }),
    ][sh];
    return (
      k.bg(BG) +
      k.floor(y, "#262229") +
      k.ring({ x: ax, y: y - 44, r: 10 + st * 30, color: "rgba(255,122,162,0.5)", w: 1 + st * 3 }) +
      k.person({ x: ax, y, s: 1, look: 1, arms: sh === 2 ? 0.8 : st * 0.5, lean: st * 8, mood: -0.2 - st * 0.4, color: "#4a6fa5" }) +
      show +
      target +
      `<line x1="${ax + 16}" y1="${y + 8}" x2="${tx}" y2="${y + 8}" stroke="#777" stroke-dasharray="3 3"/>` +
      bar(k, 20, 160, 280, "") +
      piece(k, 20, 160, 280, 0, sc / 30, "#ff7aa2") +
      piece(k, 20, 160, 280, sc / 30 - 0.02, sc / 30 - 0.02 + fu * 0.2, "#9be36b") +
      S(k, 300, 156, `${sc} scenes · gets it: ${v("fulfilled")}`, "#ccc", "end", 7) +
      k.caption(`Longs for ${v("target")} · ${v("farAway")} · shown ${v("shown")}`)
    );
  });

  /* ---------------- shame: a person shrinking under watching eyes ---------------- */
  W.look("shame", (v, k) => {
    const wt = v.n("weight") / 5;
    const ai = I(v, "about");
    const wi = I(v, "witnesses");
    const hi = I(v, "hiding");
    const lg = v.n("lingers");
    const sh = I(v, "shared");
    const y = 140;
    const x = hi === 4 ? 210 : 160;
    let eyes = "";
    const ne = [0, 1, 3, 8][wi];
    for (let i = 0; i < ne; i++) {
      const ex = 30 + (i % 4) * 22 + (i > 3 ? 220 : 0);
      const ey = 40 + Math.floor((i % 8) / 4) * 0 + (i % 2) * 18;
      eyes += `<ellipse cx="${ex}" cy="${ey}" rx="8" ry="5" fill="#fff"/><circle cx="${ex + 2}" cy="${ey}" r="2.5" fill="${ink}"/>`;
    }
    const pose = { look: hi === 1 ? -1 : 0, arms: hi === 3 ? 1 : -0.6, walk: hi === 4 ? 1 : 0, lean: hi === 4 ? 12 : wt * 14 };
    const extra = hi === 2 ? k.bubble({ x: x + 40, y: 60, w: 40, h: 18, text: "ha ha", tail: -20, size: 8 }) : "";
    const flush = `<circle cx="${x}" cy="${r1(y - 67 * (1 - wt * 0.25))}" r="${r1(10 * (1 - wt * 0.25))}" fill="#ef5350" opacity="${r1(wt * 0.5)}"/>`;
    return (
      k.bg(BG) +
      k.tint({ color: "#5a1020", alpha: wt * 0.25 }) +
      eyes +
      k.person({ x, y, s: 1 - wt * 0.25, mood: -0.3 - wt * 0.6, color: "#4a6fa5", ...pose }) +
      flush +
      extra +
      S(k, 160, 22, `about ${v("about")}`, PAL[ai]) +
      k.dot({ x: 100, y: 19, r: 3, color: PAL[ai] }) +
      k.face({ x: 290, y: 112, r: 14, mood: [-0.1, -0.5, -0.8][sh], brows: [0.3, -0.5, -0.9][sh], eyes: [1, 0.4, 0.3][sh] }) +
      S(k, 290, 136, "us", "#aaa") +
      bar(k, 20, 152, 200, "") +
      piece(k, 20, 152, 200, 0, lg / 10, "#a0405a") +
      S(k, 224, 158, `lingers ${lg} scenes`, "#aaa", "start", 7) +
      k.caption(`${v("witnesses")} sees · they ${v("hiding")} · ${v("shared")}`)
    );
  });

  /* ---------------- guilt: a stone on their back, the eyes that know, and the road to making it right ---------------- */
  W.look("guilt", (v, k) => {
    const wt = v.n("weight") / 5;
    const de = v.p("deserved");
    const ki = I(v, "known");
    const li = I(v, "leaks");
    const sc = v.n("scenes");
    const am = I(v, "amends");
    const y = 140;
    const x = 110;
    const rr = 6 + wt * 18;
    const stone = `<ellipse cx="${x - 10}" cy="${r1(y - 70 - rr * 0.5)}" rx="${r1(rr * 1.2)}" ry="${r1(rr)}" fill="${k.mix("#8a8f9c", "#5a2a2a", de)}" stroke="${ink}"/>`;
    let knowers = "";
    const nk = [0, 0, 1, 4][ki];
    for (let i = 0; i < nk; i++) knowers += k.person({ x: 200 + i * 22, y, s: 0.6, look: -1, color: i === 0 ? "#a55a4a" : "#7a8aa0" });
    const aud = ki >= 1 ? `<ellipse cx="290" cy="30" rx="12" ry="7" fill="#fff"/><circle cx="288" cy="30" r="4" fill="${ink}"/>` + S(k, 290, 48, "we know", "#ccc", "middle", 7) : "";
    const leakIcon = [`<path d="M20 30 Q30 22 26 36 Q16 38 20 30 Z" fill="#c9d4ff"/>`, heart(k, 24, 30, 5, "#ff7aa2"), `<polyline points="16,22 22,32 26,24 32,36" fill="none" stroke="#ef5350" stroke-width="2"/>`, `<rect x="16" y="20" width="14" height="22" fill="none" stroke="#9be36b" stroke-width="2"/>`, k.bubble({ x: 34, y: 30, w: 40, h: 18, text: "I did it", tail: -10, size: 7 })][li];
    let steps = "";
    for (let i = 0; i < 3; i++) steps += `<rect x="${256 + i * 14}" y="${150 - i * 10}" width="14" height="${10 + i * 10}" fill="${i < am ? "#6cc070" : "#333"}"/>`;
    return (
      k.bg(BG) +
      k.floor(y, "#232027") +
      k.person({ x, y, s: 1, lean: wt * 18, mood: -0.3 - wt * 0.6, color: "#4a6fa5" }) +
      stone +
      knowers +
      aud +
      leakIcon +
      S(k, 50, 54, v("leaks"), "#ccc", "start", 7) +
      steps +
      S(k, 278, 172 - 4, "", "#ccc") +
      bar(k, 20, 158, 200, "") +
      piece(k, 20, 158, 200, 0, sc / 30, "#8a5050") +
      S(k, 120, 174, "", "#ccc") +
      k.caption(`${v("deserved")} · known by ${v("known")} · ${sc} scenes · amends: ${v("amends")}`)
    );
  });

  /* ---------------- pride: a person on a pedestal, chest out, with who sees it and a crack below ---------------- */
  W.look("pride", (v, k) => {
    const lv = v.n("level") / 5;
    const ki = I(v, "kind");
    const wi = I(v, "inWhom");
    const si = I(v, "seenBy");
    const ea = v.p("earned");
    const fc = v.n("fallComing") / 5;
    const ph = 10 + lv * 50;
    const g = 150;
    const x = 120;
    const top = g - ph;
    const glow = ki === 1 ? k.ring({ x, y: top - 40, r: 30, color: "rgba(255,209,102,0.6)", w: 6 }) : "";
    const obj = [
      "",
      k.person({ x: x + 40, y: top, s: 0.5, color: "#a5d07a", mood: 0.6 }),
      crowd(k, x + 30, top, 3, { s: 0.45, color: "#7fd4ff", mood: 0.6 }),
      `<rect x="${x + 26}" y="${top - 20}" width="22" height="20" fill="#c9a0ff" stroke="${ink}"/>`,
      `<path d="M${x + 26} ${top} L${x + 26} ${top - 16} L${x + 38} ${top - 26} L${x + 50} ${top - 16} L${x + 50} ${top} Z" fill="#ff9a3c" stroke="${ink}"/>`,
    ][wi];
    let crack = "";
    if (fc > 0) crack = `<polyline points="${x - 4},${r1(top)} ${x + 6},${r1(top + ph * 0.3 * fc)} ${x - 6},${r1(top + ph * 0.6 * fc)} ${x + 4},${r1(top + ph * fc)}" fill="none" stroke="#ef5350" stroke-width="${r1(1 + fc * 2)}"/>`;
    const see = [0, 1, 6][si];
    return (
      k.bg(BG) +
      k.floor(g, "#2a2620") +
      `<rect x="${x - 24}" y="${r1(top)}" width="48" height="${r1(ph)}" fill="#8a7158" stroke="${ink}"/>` +
      crack +
      glow +
      k.person({ x, y: top, s: ki === 3 ? 1.15 : 1, lean: -4 - ki * 3, arms: ki >= 2 ? 1 : ki === 1 ? 0.2 : -0.5, mood: 0.3 + lv * 0.6, look: ki === 3 ? 1 : 0, color: "#4a6fa5" }) +
      obj +
      crowd(k, 210, g, see, { gap: 16, s: 0.5, look: -1, mood: 0.4 }) +
      k.dot({ x: x - 34, y: top + 10, r: 7, color: `rgba(255,209,102,${r1((0.15 + ea * 0.85) * 100) / 100})` }) +
      S(k, x - 34, top + 26, v("earned"), "#ccc", "middle", 7) +
      S(k, 20, 22, `pride ${v("inWhom")}`, "#ffd166", "start") +
      (fc > 0 ? k.arrow({ x1: 290, y1: 40, x2: 290, y2: 40 + fc * 50, color: "#ef5350", w: 2 }) + S(k, 290, 30, "fall coming", "#ef5350", "middle", 7) : "") +
      k.caption(`${v("kind")} · seen by ${v("seenBy")} · ${v.n("level")} of 5`)
    );
  });

  /* ---------------- jealousy: a triangle of three people, and where the heat goes ---------------- */
  W.look("jealousy", (v, k) => {
    const ht = v.n("heat") / 5;
    const oi = I(v, "of");
    const si = I(v, "shown");
    const ju = v.p("justified");
    const ti = I(v, "target");
    const tu = I(v, "turns");
    const y = 120;
    const jx = 60;
    const rx = 200;
    const lx = 260;
    const jcol = k.mix("#4a6fa5", "#3fae49", ht);
    const rival = k.person({ x: rx, y, s: [1, 0.95, 0.8, 0.7][oi], color: PAL[oi], mood: 0.6, look: 1 });
    const loved = k.person({ x: lx, y, s: 0.9, color: "#ff7aa2", mood: 0.4, look: -1 });
    const bubble = ["", "", k.bubble({ x: jx + 30, y: 26, w: 50, h: 18, text: "Great.", tail: -20, size: 8 }), k.bubble({ x: jx + 30, y: 26, w: 50, h: 18, text: "HOW DARE", tail: -20, size: 8 })][si];
    const tgt = [null, jx, rx, lx][ti];
    const arrowT = tgt == null ? "" : tgt === jx ? k.ring({ x: jx, y: y - 40, r: 26, color: "#3fae49", w: 2, dash: "3 2" }) : k.arrow({ x1: jx + 16, y1: y - 30, x2: tgt - 12, y2: y - 30, color: "#3fae49", w: 2 });
    const b = { x: 20, y: 140, w: 120, h: 22 };
    const tf = (t) => 0.5 + [0, -0.4, 0.45][tu] * t;
    return (
      k.bg(BG) +
      k.tint({ color: "#3fae49", alpha: ht * 0.15 }) +
      `<line x1="${rx}" y1="${y - 40}" x2="${lx}" y2="${y - 40}" stroke="#ff7aa2" stroke-width="2" opacity="${r1(0.2 + ju * 0.8)}"${ju < 0.5 ? ' stroke-dasharray="3 3"' : ""}/>` +
      k.person({ x: jx, y, s: 1, color: jcol, mood: [0, 0.3, -0.4, -0.9][si], look: 1, arms: si === 3 ? 0.9 : -0.4 }) +
      rival +
      loved +
      bubble +
      arrowT +
      S(k, rx, y + 12, v("of"), PAL[oi], "middle", 7) +
      box(b, `where it goes: ${v("turns")}`, k) +
      line(b, tf, { color: "#3fae49" }) +
      S(k, 300, 150, `${v("justified")} reason`, "#ccc", "end", 7) +
      k.caption(`Shown: ${v("shown")} · paid by ${v("target")} · heat ${v.n("heat")} of 5`)
    );
  });

  /* ---------------- relief: worry climbs, then drops, and the body lets go ---------------- */
  W.look("relief", (v, k) => {
    const sz = v.n("size") / 5;
    const af = v.n("after") / 5;
    const bi = I(v, "body");
    const sp = I(v, "speed");
    const la = I(v, "lasts");
    const shI = I(v, "shared");
    const b = { x: 16, y: 22, w: 160, h: 110 };
    const peak = 0.2 + af * 0.75;
    const at = 0.55;
    const fallW = [0.3, 0.1, 0.02][sp];
    const low = cl(peak - (0.1 + sz * 0.8), 0.02, 1);
    const back = [0.7, 0.35, 0][la];
    const f = (t) => {
      if (t < at) return 0.1 + (peak - 0.1) * (t / at);
      if (t < at + fallW) return peak + (low - peak) * ((t - at) / fallW);
      return low + (peak - low) * back * cl((t - at - fallW) / 0.25, 0, 1);
    };
    const y = 140;
    const x = 240;
    const pose = [{ arms: -0.4, mood: 0 }, { arms: -0.2, mood: 0.3 }, { arms: 0.5, mood: 0.9 }, { arms: -0.8, mood: 0.2 }, { arms: -0.6, mood: -0.3 }][bi];
    const bodyY = bi === 3 ? y + 14 : y;
    let extra = "";
    if (bi === 1) extra = `<path d="M${x + 8} ${bodyY - 64} Q${x + 22} ${bodyY - 70} ${x + 30} ${bodyY - 62}" fill="none" stroke="#cfe3f0" stroke-width="2"/>`;
    if (bi === 4) extra = tear(x - 4, bodyY - 68, 1) + tear(x + 4, bodyY - 68, 1);
    const others = crowd(k, 200, y, [0, 1, 3, 3][shI], { gap: 14, s: 0.45, mood: sz * 0.6 }).replace(/^/, "") + (shI === 3 ? k.face({ x: 296, y: 26, r: 12, mood: sz * 0.8 }) + S(k, 296, 48, "us", "#aaa", "middle", 7) : "");
    return (
      k.bg(BG) +
      box(b, "worry", k) +
      line(b, f, { color: "#ef8a5a" }) +
      S(k, b.x + b.w / 2, b.y + b.h + 10, `${v("speed")} · lasts ${v("lasts")}`, "#aaa", "middle", 7) +
      others +
      k.person({ x, y: bodyY, s: 1, color: "#4a6fa5", ...pose }) +
      extra +
      k.ring({ x, y: bodyY - 40, r: 8 + sz * 26, color: "rgba(108,192,112,0.5)", w: 2 }) +
      k.caption(`Relief ${v.n("size")} of 5 after worry ${v.n("after")} · ${v("body")} · ${v("shared")}`)
    );
  });

  /* ---------------- earnedTears: setup scenes planted, a quiet beat, then the tears ---------------- */
  W.look("earnedTears", (v, k) => {
    const ea = v.n("earned") / 5;
    const su = v.n("setup");
    const re = I(v, "restraint");
    const ti = I(v, "trigger");
    const mu = I(v, "musicHelp");
    const qb = v.n("quietBefore");
    let plants = "";
    for (let i = 0; i < su; i++) plants += `<line x1="${r1(20 + i * 4.5)}" y1="150" x2="${r1(20 + i * 4.5)}" y2="142" stroke="#9be36b" stroke-width="2"/>`;
    const qx = 20 + 40 * 4.5 + 6;
    const qw = qb * 6;
    const tears = [5, 3, 1, 1, 0][re];
    let td = "";
    for (let i = 0; i < tears; i++) td += tear(232 + (i % 2 ? 22 : -2) + (i > 1 ? 4 : 0), 76 + Math.floor(i / 2) * 12, 1.2);
    const fx = 244;
    return (
      k.bg(BG) +
      k.face({ x: fx, y: 70, r: 34, mood: [-0.9, -0.7, -0.4, -0.2, 0][re], brows: [-0.9, -0.6, -0.4, 0.4, 0][re], eyes: [0.2, 0.4, 0.8, 0.6, 1][re], mouth: re === 0 ? 0.6 : 0 }) +
      td +
      S(k, fx, 124, v("restraint"), "#ccc") +
      S(k, 20, 22, `set off by ${v("trigger")}`, PAL[ti], "start") +
      k.dot({ x: 14, y: 19, r: 3, color: PAL[ti] }) +
      heart(k, 70, 70, 4 + ea * 12) +
      S(k, 70, 104, `earned ${v.n("earned")} of 5`, "#ccc") +
      k.wave({ x: 130, y: 120, w: 70, h: 30, amp: mu / 3, cycles: 3, color: "#c9a0ff" }) +
      S(k, 165, 140, `music: ${v("musicHelp")}`, "#c9a0ff", "middle", 7) +
      plants +
      `<rect x="${qx}" y="142" width="${Math.max(1, qw)}" height="8" fill="#444"/>` +
      `<rect x="${qx + qw + 2}" y="138" width="10" height="12" fill="#5aa0ff"/>` +
      S(k, 20, 136, `${su} scenes of setup · ${qb} s of quiet`, "#9be36b", "start", 7) +
      k.caption(`Tears: ${v("restraint")} · ${v("trigger")} · ${v("musicHelp")} music`)
    );
  });

  /* ---------------- sentimentality: how much sugar is poured on, and what balances it ---------------- */
  W.look("sentimentality", (v, k) => {
    const sg = v.n("sugar") / 5;
    const pi = I(v, "pushers");
    const ex = I(v, "explained");
    const ui = I(v, "undercut");
    const li = v.n("linger");
    const tr = I(v, "trust");
    let sparkle = "";
    for (let i = 0; i < Math.round(sg * 20); i++) sparkle += k.dot({ x: 20 + k.rnd(i) * 200, y: 20 + k.rnd(i + 9) * 100, r: 1.5, color: "#ffc0e0" });
    const push = [
      k.wave({ x: 30, y: 30, w: 80, h: 20, amp: 0.9, cycles: 3, color: "#c9a0ff" }),
      `<line x1="30" y1="30" x2="110" y2="30" stroke="#9fd3ff" stroke-width="2" stroke-dasharray="1 6"/>`,
      k.bubble({ x: 70, y: 30, w: 80, h: 18, text: "I feel so...", tail: 0, size: 7 }),
      k.person({ x: 70, y: 46, s: 0.4, color: "#ffd166", mood: 1 }),
      tear(60, 22, 1.2) + tear(72, 22, 1.2) + tear(84, 22, 1.2),
    ][pi];
    let says = "";
    for (let i = 0; i < [0, 1, 4][ex]; i++) says += k.bubble({ x: 200 + (i % 2) * 20, y: 24 + i * 12, w: 56, h: 14, text: "I love you", tail: -10, size: 6 });
    const cut = ["", k.bubble({ x: 240, y: 110, w: 30, h: 14, text: "ha", tail: -8, size: 7 }), `<polyline points="230,100 240,90 250,104 260,92" fill="none" stroke="#ef5350" stroke-width="3"/>`, `<rect x="232" y="94" width="22" height="16" fill="#3a2a20" stroke="#ef5350"/>`][ui];
    return (
      k.bg(BG) +
      k.tint({ color: "#ff8fc8", alpha: sg * 0.3 }) +
      sparkle +
      k.person({ x: 120, y: 130, s: 1, mood: 0.4 + sg * 0.6, color: "#ff9ac0" }) +
      k.person({ x: 160, y: 130, s: 0.9, mood: 0.4 + sg * 0.6, color: "#c9a0ff", look: -1 }) +
      push +
      says +
      cut +
      `<path d="M300 ${r1(130 - tr * 0)} L${r1(300 - (2 - tr) * 20)} ${r1(110 + tr * 0)}" stroke="#ffd166" stroke-width="${3 - tr}"/>` +
      k.face({ x: 296, y: 140, r: 11, mood: tr === 2 ? 0.5 : -0.2, brows: tr === 0 ? -0.6 : 0.2 }) +
      S(k, 296, 124, v("trust"), "#ccc", "end", 7) +
      bar(k, 20, 156, 200, "") +
      piece(k, 20, 156, 200, 0, li / 60, "#ff8fc8") +
      S(k, 224, 162, `lingers ${li} s`, "#aaa", "start", 7) +
      k.caption(`Sugar ${v.n("sugar")} of 5 · ${v("pushers")} · said ${v("explained")}`)
    );
  });

  /* ---------------- storyTemperature: a thermometer, the camera's distance, music, and the line over time ---------------- */
  W.look("storyTemperature", (v, k) => {
    const tp = v.p("setting");
    const ci = I(v, "camera");
    const mu = I(v, "music");
    const ac = I(v, "access");
    const pe = I(v, "performance");
    const co = I(v, "consistency");
    const y = 120;
    const px = 200;
    const camX = [40, 80, 120, 158][ci];
    const col = k.mix("#5aa0ff", "#ef5350", tp);
    let notes = "";
    for (let i = 0; i < mu * 2; i++) notes += k.text({ x: 230 + i * 10, y: 30 + (i % 2) * 8, text: "♪", size: 12, color: "#c9a0ff" });
    const think = ac ? `<g opacity="${r1(0.3 + ac * 0.23)}">${k.bubble({ x: px + 30, y: 52, w: 20 + ac * 14, h: 16, text: "...", tail: -14, size: 8 })}</g>` : "";
    const b = { x: 20, y: 140, w: 200, h: 22 };
    const amp = [0.4, 0.2, 0][co];
    return (
      k.bg(BG) +
      k.tint({ color: col, alpha: 0.18 }) +
      k.cam({ x: camX, y: y - 50, s: 0.9 }) +
      `<line x1="${camX + 16}" y1="${y - 50}" x2="${px - 14}" y2="${y - 50}" stroke="#777" stroke-dasharray="3 3"/>` +
      k.person({ x: px, y, s: 1, arms: [-0.6, -0.2, 0.3, 1][pe], mood: [0, 0.2, 0.5, 0.9][pe], color: "#4a6fa5" }) +
      think +
      notes +
      `<rect x="290" y="30" width="12" height="90" rx="6" fill="#333"/><rect x="290" y="${r1(120 - (0.1 + tp * 0.9) * 90)}" width="12" height="${r1((0.1 + tp * 0.9) * 90)}" rx="6" fill="${col}"/>` +
      box(b, `changes: ${v("consistency")}`, k) +
      line(b, (t) => tp * 0.8 + 0.1 + amp * Math.sin(t * Math.PI * 4), { color: col }) +
      k.caption(`${v("setting")} · camera ${v("camera")} · music ${v("music")} · ${v("performance")}`)
    );
  });

  /* ---------------- bodyFeeling: a close face and neck, with breath, shaking, skin, tears and throat ---------------- */
  W.look("bodyFeeling", (v, k) => {
    const st = v.n("strength") / 5;
    const br = I(v, "breath");
    const sh = I(v, "shaking");
    const sk = I(v, "skin");
    const te = I(v, "tears");
    const th = I(v, "throat");
    const x = 150;
    const y = 70;
    const r = 30 + st * 14;
    const skin = ["#f0c8a0", "#ece6dc", "#f2a08c", "#d9534f"][sk];
    let puffs = "";
    for (let i = 0; i < [0, 2, 0, 3, 5][br]; i++) puffs += `<ellipse cx="${r1(x + r + 10 + i * 9)}" cy="${r1(y + r * 0.4 - i * 3)}" rx="${4 + i}" ry="${3 + i * 0.6}" fill="none" stroke="#cfe3f0"/>`;
    const held = br === 2 ? `<line x1="${r1(x - 10)}" y1="${r1(y + r * 0.45)}" x2="${r1(x + 10)}" y2="${r1(y + r * 0.45)}" stroke="${ink}" stroke-width="3"/>` : "";
    let shakes = "";
    for (let i = 0; i < sh * 2; i++) {
      const sd = i % 2 ? 1 : -1;
      const sx = x + sd * (r + 8 + Math.floor(i / 2) * 6);
      shakes += `<polyline points="${r1(sx)},${r1(y - 10)} ${r1(sx + 3)},${r1(y - 4)} ${r1(sx - 3)},${r1(y + 2)} ${r1(sx + 3)},${r1(y + 8)}" fill="none" stroke="#ffd166" stroke-width="1.5"/>`;
    }
    let tears = "";
    const nt = [0, 0, 1, 2, 4][te];
    for (let i = 0; i < nt; i++) tears += tear(x + (i % 2 ? 1 : -1) * r * 0.38, y + 2 + Math.floor(i / 2) * 12, 1.3);
    const glassy = te >= 1 ? `<ellipse cx="${r1(x - r * 0.38)}" cy="${r1(y - r * 0.15)}" rx="${r1(r * 0.15)}" ry="3" fill="#9fd3ff" opacity="0.6"/><ellipse cx="${r1(x + r * 0.38)}" cy="${r1(y - r * 0.15)}" rx="${r1(r * 0.15)}" ry="3" fill="#9fd3ff" opacity="0.6"/>` : "";
    const lump = th ? `<circle cx="${x}" cy="${r1(y + r + 16)}" r="${2 + th * 3}" fill="${k.mix(skin, "#a0522d", 0.4)}"/>` : "";
    return (
      k.bg(BG) +
      `<rect x="${x - 12}" y="${r1(y + r - 4)}" width="24" height="40" fill="${skin}" stroke="${ink}"/>` +
      `<rect x="${x - 50}" y="${r1(y + r + 30)}" width="100" height="40" rx="10" fill="#4a6fa5"/>` +
      k.face({ x, y, r, mood: -st * 0.7, brows: -st * 0.8, eyes: 0.9, color: skin, mouth: br >= 3 ? 0.5 : 0 }) +
      held +
      glassy +
      tears +
      lump +
      puffs +
      shakes +
      S(k, 20, 22, `breath: ${v("breath")}`, "#cfe3f0", "start") +
      S(k, 20, 36, `throat: ${v("throat")}`, "#ccc", "start") +
      S(k, 300, 22, `skin: ${v("skin")}`, skin, "end") +
      k.caption(`${v("shaking")} · tears: ${v("tears")} · body shows ${v.n("strength")} of 5`)
    );
  });

  /* ---------------- sceneAftertaste: the end of the scene, the held beat, and how far the feeling carries ---------------- */
  W.look("sceneAftertaste", (v, k) => {
    const st = v.n("strength") / 5;
    const ki = I(v, "kind");
    const hd = v.n("held");
    const ca = I(v, "carried");
    const se = I(v, "settled");
    const li = I(v, "lastImage");
    const col = ["#ffb347", "#c9a0ff", "#5aa0ff", "#ffd166", "#777788", "#9be36b"][ki];
    const fx = 40;
    const fy = 24;
    const img = [
      k.face({ x: fx + 60, y: fy + 42, r: 26, mood: [0.5, -0.3, -0.7, 0.9, 0, 0.4][ki] }),
      `<rect x="${fx + 20}" y="${fy + 20}" width="80" height="50" fill="none" stroke="#888"/><line x1="${fx}" y1="${fy + 70}" x2="${fx + 120}" y2="${fy + 70}" stroke="#888"/>`,
      `<rect x="${fx + 45}" y="${fy + 10}" width="30" height="62" fill="#5a4a3a" stroke="${ink}"/><rect x="${fx + 45}" y="${fy + 10}" width="8" height="62" fill="#222"/>`,
      `<rect x="${fx + 50}" y="${fy + 40}" width="20" height="24" rx="3" fill="#c9b79a" stroke="${ink}"/>`,
      `<path d="M${fx} ${fy + 70} L${fx + 40} ${fy + 30} L${fx + 70} ${fy + 55} L${fx + 120} ${fy + 20} L${fx + 120} ${fy + 84} L${fx} ${fy + 84} Z" fill="#4a5a6a"/>`,
    ][li];
    const bx = 20;
    const by = 140;
    const sceneW = 140;
    const heldW = hd * 6;
    const carryW = [0, 20, 50, 100][ca];
    return (
      k.bg(BG) +
      `<rect x="${fx}" y="${fy}" width="120" height="84" fill="#22222a" stroke="#555"/>` +
      img +
      `<rect x="${fx}" y="${fy}" width="120" height="84" fill="${col}" opacity="${r1(st * 0.35)}"/>` +
      S(k, 230, 40, v("kind"), col, "middle", 12) +
      (se === 0 ? `<path d="M210 60 L250 60" stroke="${col}" stroke-width="3"/>` : se === 1 ? `<path d="M210 60 L240 60" stroke="${col}" stroke-width="3"/><circle cx="250" cy="60" r="3" fill="${col}"/>` : `<path d="M210 60 Q230 50 250 64 Q260 72 252 80" fill="none" stroke="${col}" stroke-width="3"/>`) +
      S(k, 230, 92, v("settled"), "#ccc", "middle", 7) +
      `<rect x="${bx}" y="${by}" width="${sceneW}" height="10" fill="#4a4a55"/>` +
      `<rect x="${bx + sceneW}" y="${by}" width="${Math.max(1, heldW)}" height="10" fill="${col}" opacity="${r1(0.3 + st * 0.7)}"/>` +
      `<rect x="${bx + sceneW + heldW + 4}" y="${by}" width="100" height="10" fill="#33333d"/>` +
      (carryW ? `<rect x="${bx + sceneW + heldW + 4}" y="${by}" width="${carryW}" height="10" fill="${col}" opacity="${r1(0.15 + st * 0.4)}"/>` : "") +
      S(k, bx, by - 3, "this scene", "#999", "start", 7) +
      S(k, bx + sceneW + heldW + 6, by - 3, "next scene", "#999", "start", 7) +
      k.caption(`Held ${hd} s · ${v("carried")} · last image: ${v("lastImage")}`)
    );
  });

  /* ---------------- filmAftertaste: the audience walking out, carrying a feeling, after the last shot and credits ---------------- */
  W.look("filmAftertaste", (v, k) => {
    const st = v.n("strength") / 5;
    const ki = I(v, "kind");
    const re = I(v, "resolved");
    const ls = v.n("lastShotHold");
    const cr = I(v, "credits");
    const ec = I(v, "echo");
    const col = ["#ffd166", "#5aa0ff", "#ff9a3c", "#9b7bd1", "#9be36b", "#ef5350"][ki];
    const mood = [0.9, -0.9, 0.2, -0.4, 0.5, -0.7][ki];
    let threads = "";
    for (let i = 0; i < [6, 3, 0][re]; i++) threads += `<path d="M${130 + i * 6} 70 Q${136 + i * 6} ${84 + (i % 2) * 6} ${128 + i * 6} 96" fill="none" stroke="#c9b79a" stroke-width="1.5"/>`;
    let credits = "";
    for (let i = 0; i < 5; i++) credits += `<line x1="40" y1="${32 + i * 8}" x2="${60 + (i % 3) * 8}" y2="${32 + i * 8}" stroke="#ccc" stroke-width="1.5"/>`;
    const music = ["", "♪", "♪ ♫", "♫ ♪ ♫ ♪"][cr];
    const echoArc = ec ? `<path d="M30 110 Q160 ${110 - ec * 30} 290 110" fill="none" stroke="#c9a0ff" stroke-width="${ec * 1.5}" stroke-dasharray="4 3"/>` + S(k, 160, 104 - ec * 15, "echo of the opening", "#c9a0ff", "middle", 7) : "";
    return (
      k.bg(BG) +
      `<rect x="20" y="20" width="100" height="56" fill="#0b0b0f" stroke="#555"/>` +
      credits +
      S(k, 100, 46, music, "#c9a0ff", "middle", 10) +
      threads +
      S(k, 140, 64, `loose ends: ${v("resolved")}`, "#c9b79a", "start", 7) +
      echoArc +
      `<ellipse cx="240" cy="70" rx="${r1(20 + st * 50)}" ry="${r1(12 + st * 26)}" fill="${col}" opacity="${r1(0.15 + st * 0.5)}"/>` +
      crowd(k, 200, 140, 5, { gap: 20, s: 0.6, mood, color: "#555a66" }) +
      bar(k, 20, 152, 120, "") +
      piece(k, 20, 152, 120, 0, ls / 60, "#ffd166") +
      S(k, 20, 168, `last shot held ${ls} s`, "#aaa", "start", 7) +
      k.caption(`We walk out ${v("kind")} · credits: ${v("credits")}`)
    );
  });

  /* ---------------- laughThroughGrief: a band of grief and laughter, and the room ---------------- */
  W.look("laughThroughGrief", (v, k) => {
    const mx = v.p("mix");
    const si = I(v, "source");
    const wi = I(v, "who");
    const la = I(v, "landing");
    const af = I(v, "afterward");
    const tm = v.n("timing");
    const n = [1, 2, 6][wi];
    let people = "";
    for (let i = 0; i < 6; i++) {
      const laughs = i < n;
      people += k.person({ x: 40 + i * 42, y: 112, s: 0.75, mood: laughs ? 0.9 : -0.6, arms: laughs ? 0.3 : -0.6, color: "#454a58" });
      if (laughs) people += S(k, 40 + i * 42, 34, "ha", "#ffd166", "middle", 9);
    }
    const b = { x: 20, y: 124, w: 200, h: 30 };
    const f = (t) => {
      const base = 0.25 + mx * 0.3;
      const bump = Math.exp(-Math.pow((t - 0.5) / 0.08, 2));
      const dir = [0.5, 0.2, -0.2][la];
      const tail = [-0.15, 0, 0.2][af] * cl((t - 0.6) / 0.4, 0, 1);
      return base + bump * dir + tail;
    };
    return (
      k.bg(BG) +
      `<rect x="20" y="16" width="280" height="8" fill="#3c5a99"/><rect x="20" y="16" width="${r1(280 * (0.05 + mx * 0.6))}" height="8" fill="#ffd166"/>` +
      people +
      box(b, `the room's feeling (after: ${v("afterward")})`, k) +
      line(b, f, { color: k.mix("#5aa0ff", "#ffd166", mx) }) +
      bar(k, 230, 132, 80, "") +
      pin(k, 230, 132, 80, tm / 10, "#ef5350", `${tm} scenes after the loss`) +
      S(k, 270, 152, v("landing"), "#ccc", "middle", 7) +
      k.caption(`${v("mix")} · laugh from ${v("source")}`) +
      k.dot({ x: 12, y: 171, r: 3, color: PAL[si] })
    );
  });

  /* ---------------- grief: a person under a cloud, the stage they're at, and what brings it back ---------------- */
  W.look("grief", (v, k) => {
    const wt = v.n("weight") / 5;
    const st = I(v, "stage");
    const lo = I(v, "loss");
    const sh = I(v, "shown");
    const sc = v.n("scenes");
    const rm = v.n("reminders");
    const x = 90;
    const y = 130;
    const stages = ["numb", "denial", "anger", "bargaining", "sadness", "acceptance"];
    let ladder = "";
    stages.forEach((s, i) => (ladder += `<rect x="236" y="${120 - i * 16}" width="70" height="13" rx="3" fill="${i === st ? "#c9a0ff" : "#2c2c34"}"/>` + S(k, 271, 130 - i * 16, s, i === st ? ink : "#888", "middle", 7)));
    const ghost = [
      k.person({ x: x + 50, y, s: 0.9, color: "#888" }),
      `<ellipse cx="${x + 50}" cy="${y - 8}" rx="14" ry="8" fill="#888"/>`,
      `<rect x="${x + 36}" y="${y - 30}" width="28" height="30" fill="#888"/><path d="M${x + 32} ${y - 30} L${x + 50} ${y - 46} L${x + 68} ${y - 30} Z" fill="#888"/>`,
      `<circle cx="${x + 50}" cy="${y - 30}" r="14" fill="#888"/>`,
      k.person({ x: x + 44, y, s: 0.8, color: "#888" }) + k.person({ x: x + 60, y, s: 0.8, color: "#888" }),
    ][lo];
    let glints = "";
    for (let i = 0; i < rm; i++) glints += k.dot({ x: 30 + i * 30, y: 150, r: 3, color: "#ffd166" });
    return (
      k.bg(BG) +
      k.floor(y, "#1f1d22") +
      `<ellipse cx="${x}" cy="${r1(40 - wt * 6)}" rx="${r1(20 + wt * 40)}" ry="${r1(10 + wt * 14)}" fill="#3a3f55" opacity="${r1(0.3 + wt * 0.6)}"/>` +
      `<g opacity="0.3" stroke-dasharray="3 3">${ghost}</g>` +
      k.person({ x, y, s: 1, lean: sh === 2 ? -6 : wt * 10, arms: sh === 2 ? 1 : sh === 3 ? 0.2 : -0.7, mood: st === 5 ? 0.2 : -0.2 - wt * 0.7, color: "#4a6fa5" }) +
      (sh === 3 ? tear(x - 3, y - 66, 1) + tear(x + 3, y - 66, 1) : sh === 1 ? tear(x - 3, y - 66, 0.6) : "") +
      ladder +
      glints +
      S(k, 30, 164, `${rm} reminders`, "#ffd166", "start", 7) +
      bar(k, 130, 160, 100, "") +
      piece(k, 130, 160, 100, 0, sc / 40, "#5a6a99") +
      k.caption(`Lost ${v("loss")} · ${v("shown")} · ${sc} scenes`)
    );
  });

  /* ---------------- loneliness: a person in the frame, the space and sound around them, and reaching out ---------------- */
  W.look("loneliness", (v, k) => {
    const lv = v.n("level") / 5;
    const am = I(v, "among");
    const fr = I(v, "framing");
    const so = I(v, "sound");
    const ro = I(v, "reachOut");
    const sc = v.n("scenes");
    const y = 130;
    const s = [1, 0.85, 0.45, 0.8][fr];
    const x = [140, 70, 60, 150][fr];
    const others = am === 1 ? crowd(k, 170, y, 8, { gap: 16, s: 0.7, look: 1 }) : am === 2 ? k.person({ x: x + 60, y, s: 0.95, look: 1, color: "#a55a4a" }) : "";
    const glass = fr === 3 ? `<rect x="${x - 36}" y="30" width="72" height="104" fill="none" stroke="#9fd3ff" stroke-width="5"/><rect x="${x - 36}" y="30" width="72" height="104" fill="#9fd3ff" opacity="0.12"/>` : "";
    const reach = ro === 0 ? "" : ro === 1 ? `<line x1="${x + 14}" y1="${y - 40}" x2="${x + 40}" y2="${y - 40}" stroke="#ffd166" stroke-dasharray="3 3"/>` + S(k, x + 50, y - 38, "x", "#ef5350") : `<line x1="${x + 14}" y1="${y - 40}" x2="${x + 56}" y2="${y - 40}" stroke="#9be36b" stroke-width="2"/>` + k.dot({ x: x + 56, y: y - 40, r: 4, color: "#9be36b" });
    return (
      k.bg(k.mix("#2a2a30", "#0e1220", lv)) +
      k.floor(y, "#1c1c22") +
      others +
      glass +
      k.person({ x, y, s, arms: ro ? 0.2 : -0.6, mood: -lv * 0.8, color: "#4a6fa5" }) +
      reach +
      k.wave({ x: 220, y: 24, w: 90, h: 16, amp: [1, 0.4, 0.15, 0][so], noise: so === 0 ? 0.6 : 0, cycles: 6, color: "#9fd3ff" }) +
      S(k, 310, 44, v("sound"), "#9fd3ff", "end", 7) +
      bar(k, 20, 154, 200, "") +
      piece(k, 20, 154, 200, 0, sc / 30, "#5a6a99") +
      S(k, 224, 160, `${sc} scenes`, "#aaa", "start", 7) +
      k.caption(`${v("among")} · ${v("framing")} · reaching out: ${v("reachOut")}`)
    );
  });

  /* ---------------- tenderness: two people, how close their hands come, and the small act ---------------- */
  W.look("tenderness", (v, k) => {
    const lv = v.n("level") / 5;
    const to = I(v, "touch");
    const vo = I(v, "voice");
    const ai = I(v, "act");
    const wh = I(v, "who");
    const it = I(v, "interrupted");
    const y = 140;
    const gap = [90, 64, 48, 40, 24][to];
    const ax = 160 - gap / 2;
    const bx = 160 + gap / 2;
    const hearts = heart(k, ax, y - 92, 3 + lv * 4) + (wh === 1 ? heart(k, bx, y - 92, 3 + lv * 4) : "");
    const say = ["hey", "hey...", "shh"][vo];
    const icon = [
      `<path d="M${bx - 8} ${y - 58} L${bx} ${y - 50} L${bx + 8} ${y - 58}" fill="none" stroke="#fff" stroke-width="2"/>`,
      `<rect x="${bx - 24}" y="${y - 20}" width="48" height="14" fill="#9fd3ff"/>`,
      `<ellipse cx="160" cy="${y - 50}" rx="7" ry="4" fill="#c9b79a"/>`,
      `<rect x="${bx - 4}" y="${y - 44}" width="9" height="5" fill="#fff" stroke="#ef5350"/>`,
      `<rect x="154" y="${y - 52}" width="12" height="10" fill="#ff7aa2" stroke="${ink}"/>`,
    ][ai];
    const interrupt = ["", k.bubble({ x: 270, y: 40, w: 50, h: 18, text: "ha!", tail: -18, size: 8 }), `<polyline points="250,30 262,20 270,36 282,24" fill="none" stroke="#ffd166" stroke-width="2"/>`, k.person({ x: 290, y, s: 0.8, look: -1, color: "#888" })][it];
    return (
      k.bg(BG) +
      k.tint({ color: "#ffb36b", alpha: lv * 0.25 }) +
      k.person({ x: ax, y, s: 1, look: 1, lean: to * 2, arms: to >= 2 ? 0.4 : -0.3, mood: 0.2 + lv * 0.6, color: "#4a6fa5" }) +
      k.person({ x: bx, y, s: 0.95, look: -1, lean: -to * 2, arms: to >= 3 ? 0.4 : -0.3, mood: 0.2 + lv * 0.6, color: "#a55a4a" }) +
      icon +
      hearts +
      k.text({ x: ax - 30, y: y - 96, text: say, size: [12, 10, 7][vo], color: "#eee", italic: vo === 2 }) +
      interrupt +
      k.caption(`${v("act")} · ${v("touch")} · ${v("voice")} voice · ${v("who")} · interrupted ${v("interrupted")}`)
    );
  });

  /* ---------------- betrayal: the one they trusted, the moment it comes out, and how long it echoes ---------------- */
  W.look("betrayal", (v, k) => {
    const bl = v.n("blow") / 5;
    const cl2 = I(v, "closeness");
    const rv = I(v, "reveal");
    const kn = I(v, "known");
    const re = I(v, "reaction");
    const la = v.n("lasting");
    const y = 130;
    const ax = 80;
    const bx = [260, 200, 160, 130][cl2];
    const revealM = [k.bubble({ x: 160, y: 30, w: 70, h: 18, text: "I have to tell you", tail: -20, size: 7 }), `<path d="M${ax - 22} ${y - 78} Q${ax - 30} ${y - 70} ${ax - 22} ${y - 62}" fill="none" stroke="#ffd166" stroke-width="2"/>`, k.ring({ x: bx, y: y - 50, r: 30, color: "#ef5350", w: 2, dash: "4 3" }), `<rect x="200" y="20" width="40" height="28" rx="3" fill="#223" stroke="#9fd3ff"/>`][rv];
    const knowsAud = kn !== 1 ? `<ellipse cx="300" cy="26" rx="10" ry="6" fill="#fff"/><circle cx="300" cy="26" r="3" fill="${ink}"/>` : "";
    const knowsHero = kn >= 1 ? k.ring({ x: ax, y: y - 67, r: 14, color: "#ffd166", w: 1.5 }) : "";
    const pose = [{ arms: -0.9, mood: 0, eyes: 1 }, { arms: -0.6, mood: -0.6 }, { arms: -0.4, mood: -0.3, look: -1 }, { arms: 1, mood: -1 }][re];
    const crackN = Math.round(bl * 5);
    let crack = "";
    for (let i = 0; i < crackN; i++) crack += `<line x1="${r1(ax + 4 + i * 2)}" y1="${r1(y - 50 + i * 4)}" x2="${r1(ax + 10 + i * 2)}" y2="${r1(y - 44 + i * 4)}" stroke="#ef5350" stroke-width="2"/>`;
    return (
      k.bg(BG) +
      k.tint({ color: "#5a0f1a", alpha: bl * 0.3 }) +
      k.floor(y, "#201c20") +
      `<line x1="${ax + 14}" y1="${y + 6}" x2="${bx - 14}" y2="${y + 6}" stroke="#ff7aa2" stroke-width="2" stroke-dasharray="4 3"/>` +
      k.person({ x: ax, y, s: 1, color: "#4a6fa5", ...pose }) +
      crack +
      knowsHero +
      k.person({ x: bx, y, s: 0.95, look: 1, mood: 0.3, color: "#6b4a6b" }) +
      `<line x1="${bx - 16}" y1="${y - 50}" x2="${bx - 6}" y2="${y - 42}" stroke="#ddd" stroke-width="2"/>` +
      revealM +
      knowsAud +
      S(k, (ax + bx) / 2, y + 18, v("closeness"), "#ff7aa2", "middle", 7) +
      bar(k, 20, 160, 200, "") +
      piece(k, 20, 160, 200, 0, la / 40, "#a0405a") +
      S(k, 224, 166, `echoes ${la} scenes`, "#aaa", "start", 7) +
      k.caption(`${v("reveal")} · first known by ${v("known")} · ${v("reaction")}`)
    );
  });

  /* ---------------- forgiveness: a bridge between two people, built over time ---------------- */
  W.look("forgiveness", (v, k) => {
    const fu = v.p("fullness");
    const wa = v.n("wait");
    const as = I(v, "asked");
    const sh = I(v, "shown");
    const co = I(v, "cost");
    const af = I(v, "after");
    const y = 120;
    const gapAfter = [120, 90, 70, 40][af];
    const ax = 160 - gapAfter / 2;
    const bx = 160 + gapAfter / 2;
    const bridge = `<rect x="${ax + 10}" y="${y + 2}" width="${r1(Math.max(1, (bx - ax - 20) * fu))}" height="6" fill="#9be36b"/><rect x="${ax + 10}" y="${y + 2}" width="${bx - ax - 20}" height="6" fill="none" stroke="#555"/>`;
    const askB = ["", k.bubble({ x: bx + 20, y: 40, w: 50, h: 18, text: "sorry I guess", tail: -20, size: 7 }), k.bubble({ x: bx + 20, y: 40, w: 60, h: 18, text: "I was wrong.", tail: -20, size: 8 })][as];
    const showI = [
      S(k, ax, 50, "okay.", "#9be36b", "middle", 9),
      k.hand({ x: 160, y: y - 44, s: 0.4, open: 0.6 }),
      `<rect x="${ax - 40}" y="${y - 60}" width="16" height="60" fill="#5a4a3a" stroke="#9be36b"/>`,
      `<rect x="154" y="${y - 50}" width="12" height="10" fill="#c9a0ff" stroke="${ink}"/>`,
      S(k, 160, 50, "ha ha", "#ffd166", "middle", 9),
    ][sh];
    let weights = "";
    for (let i = 0; i < co; i++) weights += `<rect x="${ax - 8 + i * 6}" y="${y - 4}" width="5" height="5" fill="#8a8f9c"/>`;
    return (
      k.bg(BG) +
      k.person({ x: ax, y, s: 1, look: 1, mood: -0.3 + fu * 1, arms: sh === 1 ? 0.3 : -0.4, color: "#4a6fa5" }) +
      k.person({ x: bx, y, s: 1, look: -1, mood: -0.4 + fu * 0.8, color: "#a55a4a" }) +
      bridge +
      askB +
      showI +
      weights +
      S(k, ax, y + 18, co ? `costs ${v("cost")}` : "", "#8a8f9c", "middle", 7) +
      bar(k, 20, 150, 280, "") +
      piece(k, 20, 150, 280, 0, wa / 40, "#5a6a99") +
      pin(k, 20, 150, 280, wa / 40, "#9be36b", `forgiven after ${wa} scenes`) +
      k.caption(`${v("fullness")} forgiveness · ${v("asked")} · ${v("shown")} · after: ${v("after")}`)
    );
  });

  /* ---------------- resentment: an old grudge as a pot on the boil, aimed at someone ---------------- */
  W.look("resentment", (v, k) => {
    const ht = v.n("heat") / 5;
    const ag = v.n("age");
    const sh = I(v, "shown");
    const ti = I(v, "target");
    const fa = I(v, "fair");
    const bo = v.n("boilsOver") / 5;
    const px = 100;
    const py = 120;
    const col = k.mix("#5aa0ff", "#ef5350", ht);
    let rings = "";
    for (let i = 0; i < Math.min(10, Math.round(ag / 3)); i++) rings += `<line x1="${px - 30}" y1="${py - 6 - i * 4}" x2="${px + 30}" y2="${py - 6 - i * 4}" stroke="#222" stroke-width="1" opacity="0.6"/>`;
    const lid = py - 50 - bo * 18;
    let steam = "";
    const ns = [0, 3, 1, 6][sh];
    for (let i = 0; i < ns; i++) steam += `<path d="M${px - 20 + i * 8} ${r1(lid - 4)} Q${px - 26 + i * 8} ${r1(lid - 14)} ${px - 20 + i * 8} ${r1(lid - 24)}" fill="none" stroke="#ddd" stroke-width="${sh === 2 ? 3 : 1.5}" opacity="0.7"/>`;
    const tcol = PAL[ti];
    const tgt = ti === 4 ? `<circle cx="250" cy="90" r="30" fill="#3a6a5a" stroke="${tcol}" stroke-width="2"/>` : k.person({ x: 250, y: 130, s: [1, 0.8, 0.95, 1.1][ti], look: -1, color: tcol });
    return (
      k.bg(BG) +
      `<path d="M${px - 34} ${py - 50} L${px + 34} ${py - 50} L${px + 30} ${py} L${px - 30} ${py} Z" fill="#3a3a44" stroke="${ink}"/>` +
      `<rect x="${px - 30}" y="${r1(py - 46 + (1 - ht) * 30)}" width="60" height="${r1(16 + ht * 30)}" fill="${col}" opacity="0.8"/>` +
      rings +
      `<rect x="${px - 38}" y="${r1(lid)}" width="76" height="5" rx="2" fill="#666"/>` +
      steam +
      `<rect x="${px - 26}" y="${py}" width="52" height="8" fill="#ef5350" opacity="${r1(0.2 + ht * 0.8)}"/>` +
      k.arrow({ x1: px + 40, y1: 90, x2: 215, y2: 90, color: col, w: 1 + ht * 3 }) +
      tgt +
      S(k, 250, 150, v("target"), tcol, "middle", 8) +
      `<line x1="40" y1="${r1(30 + (fa - 1) * 8)}" x2="80" y2="${r1(30 - (fa - 1) * 8)}" stroke="#c9b79a" stroke-width="3"/><line x1="60" y1="30" x2="60" y2="48" stroke="#c9b79a" stroke-width="2"/>` +
      S(k, 60, 60, `fair: ${v("fair")}`, "#c9b79a", "middle", 7) +
      S(k, px, py + 22, `${ag} years old`, "#aaa", "middle", 7) +
      k.caption(`Shown by ${v("shown")} · near boiling ${v.n("boilsOver")} of 5 · heat ${v.n("heat")} of 5`)
    );
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
