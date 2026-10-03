/* Character: the live picture at the top of each character curiosity's window (CuriosityWindows.look).
   Most character curiosities are a line between two ends (Reactive to Proactive, Honest to Deceptive ...). Each
   picture puts that line across the top (where they sit now, how far they swing, where they started) and below
   it a small scene where the person acts it out. "Hidden or shown" is a spotlight: hidden keeps them in the dark. */
(function (W) {
  const r1 = (n) => Math.round(n * 10) / 10;
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const ink = "#1c1712";
  const BG = "#15151b";
  const S = (k, x, y, t, c, a, sz) => k.label({ x, y, text: t, size: sz || 8, color: c || "#bbb", anchor: a || "middle" });
  const I = (v, id) => {
    const s = v.slider(id);
    const n = s && Array.isArray(s.scale) ? s.scale.length : 2;
    return Math.round(v.p(id) * (n - 1));
  };
  /* The line between the two ends, across the top: a dot where they are, a band for the swing, and (from) a
     ghost where they began. */
  function spectrum(k, v, L, R, from) {
    const x0 = 20;
    const x1 = 300;
    const y = 22;
    const p = cl(v.n("position") / 100, 0, 1);
    const sw = v.n("swing") / 100;
    const X = (q) => r1(x0 + cl(q, 0, 1) * (x1 - x0));
    let s = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#444" stroke-width="4" stroke-linecap="round"/>`;
    s += `<rect x="${X(p - sw)}" y="${y - 5}" width="${r1(Math.max(1, X(p + sw) - X(p - sw)))}" height="10" rx="5" fill="#ffd166" opacity="0.3"/>`;
    if (from != null) {
      const f = cl(p - from / 100, 0, 1);
      s += `<circle cx="${X(f)}" cy="${y}" r="4" fill="none" stroke="#9be36b" stroke-width="1.5"/>`;
      if (Math.abs(X(p) - X(f)) > 8) s += k.arrow({ x1: X(f), y1: y + 9, x2: X(p), y2: y + 9, color: "#9be36b", w: 1.2 });
    }
    s += `<circle cx="${X(p)}" cy="${y}" r="6" fill="#ffd166" stroke="${ink}"/>`;
    s += S(k, x0, y - 10, L, "#ccc", "start", 8) + S(k, x1, y - 10, R, "#ccc", "end", 8);
    return s;
  }
  /* Hidden or shown: a spotlight on (x, y feet) and how visible the person is. */
  function lit(k, v, x, y, body) {
    const sh = I(v, "shown");
    return (sh === 2 ? k.beam({ x, y: 30, dir: 90, len: y - 24, spread: 34, color: "#fff3c4", alpha: 0.18 }) : "") + `<g opacity="${[0.35, 0.65, 1][sh]}">${body}</g>` + (sh === 0 ? S(k, x, y + 12, "hidden", "#777", "middle", 7) : "");
  }
  const dots = (k, x, y, n, o) => {
    o = o || {};
    let s = "";
    for (let i = 0; i < n; i++) s += k.dot({ x: x + (i % (o.cols || 10)) * (o.gap || 8), y: y + Math.floor(i / (o.cols || 10)) * (o.gap || 8), r: o.r || 2.6, color: o.color || "#ddd" });
    return s;
  };
  const star = (k, x, y, r, c) => {
    let s = "";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      s += `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + Math.cos(a) * r)}" y2="${r1(y + Math.sin(a) * r)}" stroke="${c}" stroke-width="1.5"/>`;
    }
    return s;
  };
  const clockFace = (k, x, y, r, secs, max, c) => k.pie({ x, y, r, p: secs / max, color: c || "#9fd3ff" }) + k.ring({ x, y, r: r + 2, color: "#666", w: 1.5 }) + S(k, x, y + r + 11, `${secs} s`, "#aaa", "middle", 7);
  const eye = (k, x, y, on) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5.5" fill="${on ? "#fff" : "#444"}"/><circle cx="${x}" cy="${y}" r="3" fill="${ink}"/>`;

  /* ---------------- cm-agency: do things happen to them, or do they make things happen ---------------- */
  W.look("cm-agency", (v, k) => {
    const p = v.n("position") / 100;
    const x = 130;
    const y = 132;
    const steer = v.n("steers") / 5;
    const started = v.n("started");
    let sparks = "";
    for (let i = 0; i < started; i++) sparks += star(k, 190 + (i % 5) * 22, 56 + Math.floor(i / 5) * 24, 6, "#ffd166");
    const delay = I(v, "delay");
    const gap = delay * 40 + (v.n("actSeconds") / 60) * 60;
    return (
      k.bg(BG) +
      spectrum(k, v, "Reactive", "Proactive", v.n("sinceStart")) +
      k.ring({ x, y: y - 40, r: 22 + steer * 26, color: "rgba(255,209,102,0.5)", w: 2, dash: "4 3" }) +
      `<g opacity="${r1((1 - p) * 0.8 + 0.15)}">${k.arrow({ x1: 20, y1: 90, x2: x - 22, y2: 90, color: "#ef5350", w: 3 })}</g>` +
      S(k, 50, 82, v("trigger"), "#ef9a9a") +
      `<g opacity="${r1(p * 0.8 + 0.15)}">${k.arrow({ x1: x + 22, y1: 90, x2: 182, y2: 90, color: "#6cc070", w: 3 })}</g>` +
      sparks +
      lit(k, v, x, y, k.person({ x, y, s: 1, lean: -6 + p * 20, walk: p * 0.6, arms: -0.4 + p * 0.9, mood: p - 0.4, look: 1, color: "#4a6fa5" })) +
      `<path d="M24 158 l4 -8 h-3 l4 -8" stroke="#ef5350" stroke-width="2" fill="none"/>` +
      `<line x1="34" y1="154" x2="${r1(34 + gap)}" y2="154" stroke="#888" stroke-dasharray="2 2"/>` +
      k.dot({ x: 38 + gap, y: 154, r: 4, color: "#6cc070" }) +
      S(k, 46 + gap, 157, `acts ${v("delay")} (${v.n("actSeconds")} s)`, "#aaa", "start", 7) +
      k.caption(`${started} things started · steers ${v.n("steers")} of 5`)
    );
  });

  /* ---------------- cm-openness: a chest of what they keep, open or shut ---------------- */
  W.look("cm-openness", (v, k) => {
    const p = v.n("position") / 100;
    const x = 80;
    const y = 140;
    const cx = 140;
    const cy = 112;
    const lid = -(1 - p) * 75;
    const rev = v.n("reveals");
    let papers = "";
    for (let i = 0; i < rev; i++) papers += `<rect x="${cx + 4 + i * 9}" y="${cy - 30 - (i % 2) * 10}" width="8" height="10" fill="#f4f1ea" transform="rotate(${-15 + i * 8} ${cx + 8 + i * 9} ${cy - 25})"/>`;
    const tr = [0, 1, 3, 5][I(v, "trusts")];
    let ls = "";
    for (let i = 0; i < 5; i++) ls += k.person({ x: 214 + i * 20, y, s: 0.6, look: -1, color: i < tr ? "#6cc070" : "#555", mood: i < tr ? 0.4 : 0 });
    const ec = v.n("eyeContact") / 100;
    const ab = Math.round(v.n("aboutSelf") / 10);
    let cells = "";
    for (let i = 0; i < 10; i++) cells += `<rect x="${20 + i * 9}" y="40" width="7" height="7" fill="${i < ab ? "#ffd166" : "#555"}"/>`;
    return (
      k.bg(BG) +
      spectrum(k, v, "Open", "Secretive") +
      cells +
      S(k, 20, 58, "lines about themselves", "#aaa", "start", 7) +
      `<line x1="${x + 6}" y1="${y - 68}" x2="214" y2="${y - 38}" stroke="#ffd166" stroke-dasharray="3 3" opacity="${r1((0.08 + ec * 0.9) * 100) / 100}"/>` +
      `<rect x="${cx - 22}" y="${cy}" width="44" height="28" fill="#8a6038" stroke="${ink}" stroke-width="2"/>` +
      `<rect x="${cx - 22}" y="${cy - 8}" width="44" height="8" fill="#a0703f" stroke="${ink}" stroke-width="2" transform="rotate(${r1(lid)} ${cx - 22} ${cy})"/>` +
      papers +
      S(k, cx, cy + 40, v("secret"), "#e0b080") +
      lit(k, v, x, y, k.person({ x, y, s: 1, look: 1, arms: -0.5 + (1 - p) * 0.9, mood: 0.4 - p * 0.6, color: "#4a6fa5" })) +
      S(k, 264, y + 12, `with ${v("openWith")}`, "#aaa") +
      k.caption(`Keeps ${v("secret")} · opens to ${v("trusts")} · ${rev} revealed`)
    );
  });

  /* ---------------- cm-conflict: squaring up to someone, or backing off ---------------- */
  W.look("cm-conflict", (v, k) => {
    const p = v.n("position") / 100;
    const ax = 130;
    const bx = ax + 26 + v.n("closeIn") * 28;
    const y = 140;
    const st = I(v, "style");
    const mx = (ax + bx) / 2;
    const icon = [
      `<path d="M${mx - 10} 70 l8 4 l-8 4" stroke="#c9a0ff" fill="none" stroke-width="2"/>`,
      S(k, mx, 76, "...", "#9fd3ff", "middle", 18),
      k.bubble({ x: mx, y: 62, w: 44, h: 20, text: "No.", tail: -8, size: 9 }),
      `<polygon points="${mx - 26},50 ${mx - 8},58 ${mx},44 ${mx + 8},58 ${mx + 26},50 ${mx + 14},66 ${mx + 26},80 ${mx},72 ${mx - 26},80 ${mx - 14},66" fill="#fff" stroke="${ink}"/>` + S(k, mx, 69, "NO!", "#c0392b", "middle", 10),
      star(k, mx, 70, 16, "#ef5350"),
    ][st];
    const fuse = [70, 46, 24, 8][I(v, "fuse")];
    const back = v.p("backDown");
    return (
      k.bg(BG) +
      spectrum(k, v, "Avoids it", "Confronts it") +
      `<circle cx="300" cy="56" r="9" fill="#333" stroke="#666"/><path d="M300 47 q-10 -10 -${r1(fuse * 0.5)} -${r1(fuse * 0.12)}" fill="none" stroke="#c9a76a" stroke-width="2"/>` +
      star(k, 300 - fuse * 0.5, 47 - fuse * 0.12, 4, "#ffd166") +
      clockFace(k, 300, 100, 9, v.n("flareSeconds"), 60) +
      `<line x1="${ax - 30}" y1="${y}" x2="${ax - 30}" y2="${y - 70}" stroke="#bbb" stroke-width="2"/><path d="M${ax - 30} ${r1(y - 18 - back * 50)} h18 v12 h-18 z" fill="#fff"/>` +
      icon +
      lit(k, v, ax, y, k.person({ x: ax, y, s: 1, lean: -14 + p * 30, arms: -0.6 + p * 1.1, mood: -0.2 - p * 0.6, look: 1, color: k.mix("#4a6fa5", "#b04a3a", p) })) +
      k.person({ x: bx, y, s: 1, look: -1, mood: -0.3, color: "#8a8a8a" }) +
      S(k, bx, y + 12, v("foe"), "#aaa") +
      S(k, mx, y + 12, `${v.n("closeIn")} m`, "#777", "middle", 7) +
      k.caption(`Fights with ${v("style")} · ${v("fuse")} · backs down ${v("backDown")}`)
    );
  });

  /* ---------------- cm-truth: what they say, how much of it is true ---------------- */
  W.look("cm-truth", (v, k) => {
    const p = v.n("position") / 100;
    const x = 90;
    const y = 140;
    const ls = I(v, "lieSize");
    const facade = [[60, 34], [90, 54], [130, 80], [170, 104]][ls];
    const skill = v.n("skill") / 5;
    let sweat = "";
    for (let i = 0; i < Math.round((1 - skill) * 4); i++) sweat += `<path d="M${x + 10 + i * 4} ${y - 80 + i * 3} q-2 4 0 6 q2 -2 0 -6" fill="#9fd3ff"/>`;
    const tr = Math.round(v.n("trueShare") / 10);
    let cells = "";
    for (let i = 0; i < 10; i++) cells += `<rect x="${150 + i * 9}" y="48" width="7" height="12" rx="1" fill="${i < tr ? "#f4f1ea" : "#9b6bd1"}"/>`;
    const lies = v.n("lies");
    let marks = "";
    for (let i = 0; i < lies; i++) marks += S(k, 150 + i * 12, 78, "✕", "#c9a0ff", "middle", 10);
    const cr = I(v, "caughtRisk");
    const lx = 270;
    const sx = lx - 20 - (1 - cr / 3) * 60;
    return (
      k.bg(BG) +
      spectrum(k, v, "Honest", "Deceptive") +
      `<rect x="${x - facade[0] / 2}" y="${y - facade[1]}" width="${facade[0]}" height="${facade[1]}" fill="#6b5a8a" opacity="${r1(0.25 + p * 0.5)}" stroke="#9b6bd1" stroke-dasharray="4 3"/>` +
      S(k, x, y - facade[1] - 3, v("lieSize"), "#c9a0ff", "middle", 7) +
      lit(k, v, x, y, k.person({ x, y, s: 1, look: 1, mood: 0.5 - p * 0.3, color: "#4a6fa5" }) + sweat) +
      `<rect x="140" y="38" width="100" height="30" rx="8" fill="none" stroke="#ddd"/>` +
      cells +
      S(k, 190, 32, `${v.n("trueShare")}% true`, "#ddd") +
      marks +
      S(k, 150, 92, `why: ${v("reason")}`, "#aaa", "start", 7) +
      k.beam({ x: lx, y: y - 66, dir: 180, len: lx - sx, spread: 16, color: "#fff27a", alpha: 0.12 + cr * 0.1 }) +
      (cr === 3 ? k.ring({ x, y: y - 40, r: 34, color: "#ef5350", w: 3 }) : "") +
      k.person({ x: lx, y, s: 0.85, look: -1, mood: -cr * 0.25, color: "#8a8a8a" }) +
      S(k, lx, y + 12, v("liedTo"), "#aaa") +
      k.caption(`${lies} lies · ${v("caughtRisk")} · skill ${v.n("skill")} of 5`)
    );
  });

  /* ---------------- enneagramType: the nine-point circle ---------------- */
  const ENN_STRESS = { 1: 4, 2: 8, 3: 9, 4: 2, 5: 7, 6: 3, 7: 1, 8: 5, 9: 6 };
  const ENN_GROW = { 1: 7, 2: 4, 3: 6, 4: 1, 5: 8, 6: 9, 7: 5, 8: 2, 9: 3 };
  const ennPt = (n, cx, cy, r) => {
    const a = ((n % 9) / 9) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  W.look("enneagramType", (v, k) => {
    const t = parseInt(v("setting"), 10) || 1;
    const cx = 100;
    const cy = 88;
    const R = 58;
    let s = k.ring({ x: cx, y: cy, r: R, color: "#555", w: 1.5 });
    const ai = I(v, "arrow");
    const target = ai === 0 ? ENN_STRESS[t] : ai === 2 ? ENN_GROW[t] : t;
    const [tx, ty] = ennPt(t, cx, cy, R);
    if (target !== t) {
      const [gx, gy] = ennPt(target, cx, cy, R);
      s += k.arrow({ x1: tx, y1: ty, x2: tx + (gx - tx) * 0.8, y2: ty + (gy - ty) * 0.8, color: ai === 0 ? "#ef5350" : "#6cc070", w: 2 });
    }
    const wing = v.n("wing");
    const wn = wing < 0 ? (t === 1 ? 9 : t - 1) : t === 9 ? 1 : t + 1;
    if (wing) {
      const [wx, wy] = ennPt(wn, cx, cy, R);
      s += `<line x1="${r1(tx)}" y1="${r1(ty)}" x2="${r1(wx)}" y2="${r1(wy)}" stroke="#ffd166" stroke-width="${r1(1 + Math.abs(wing) * 1.4)}" opacity="0.7"/>`;
    }
    const pur = v.n("purity") / 100;
    for (let n = 1; n <= 9; n++) {
      const [x, y] = ennPt(n, cx, cy, R);
      const on = n === t;
      s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${on ? 11 : 8}" fill="${on ? k.mix("#8a7a50", "#ffd166", pur) : "#2c2c34"}" stroke="${on ? "#fff" : "#555"}"/>` + S(k, x, y + 3, String(n), on ? ink : "#aaa", "middle", 9);
    }
    const fear = v.n("fearShown") / 5;
    const desire = v.n("desireShown") / 5;
    const fm = v.n("fearMoments");
    let bolts = "";
    for (let i = 0; i < fm; i++) bolts += `<path d="M${200 + i * 10} 56 l-3 7 h4 l-3 7" stroke="#c9a0ff" fill="none" stroke-width="1.5"/>`;
    return (
      k.bg(BG) +
      s +
      `<ellipse cx="236" cy="40" rx="${r1(10 + fear * 28)}" ry="${r1(7 + fear * 10)}" fill="#3a3550"/>` +
      bolts +
      S(k, 236, 44, "fear", "#c9a0ff", "middle", 7) +
      star(k, 286, 110, 6 + desire * 18, "#ffd166") +
      S(k, 286, 140, "desire", "#ffd166", "middle", 7) +
      k.person({ x: 236, y: 150, s: 0.8, mood: desire - fear, color: "#4a6fa5" }) +
      S(k, 236, 162 - 2, v("instinct"), "#aaa", "middle", 7) +
      k.caption(`${v("setting")} · wing ${wing} · leaning to ${v("arrow")}`)
    );
  });

  /* ---------------- a ladder of nine levels of health (shared by enneagramHealth and cm-health) ---------------- */
  function ladder(k, v, opts) {
    const x = 60;
    const top = 26;
    const step = 13;
    const lvl = cl(v.n("level"), 1, 9);
    const Y = (n) => top + (cl(n, 1, 9) - 1) * step;
    let s = "";
    for (let n = 1; n <= 9; n++) s += `<rect x="${x - 26}" y="${Y(n) - 5}" width="52" height="10" rx="2" fill="${k.mix("#4caf6a", "#c0392b", (n - 1) / 8)}" opacity="${n === lvl ? 1 : 0.35}"/>` + S(k, x - 32, Y(n) + 3, String(n), "#888", "end", 7);
    s += S(k, x + 32, top + 3, "healthy", "#6cc070", "start", 7) + S(k, x + 32, Y(9) + 3, "unhealthy", "#ef5350", "start", 7);
    const start = cl(lvl - v.n("levelsMoved"), 1, 9);
    s += `<circle cx="${x}" cy="${r1(Y(start))}" r="4" fill="none" stroke="#9be36b" stroke-width="1.5"/>`;
    s += `<circle cx="${x}" cy="${r1(Y(lvl))}" r="6" fill="#fff" stroke="${ink}"/>`;
    const pl = I(v, "pull");
    const dr = v.n("drift");
    s += pl === 1 ? "" : k.arrow({ x1: x + 12, y1: Y(lvl), x2: x + 12, y2: Y(lvl) + (pl === 0 ? -1 : 1) * (6 + dr * 8), color: pl === 0 ? "#6cc070" : "#ef5350", w: 2 });
    s += `<line x1="${x + 20}" y1="${r1(Y(lvl))}" x2="${r1(x + 20 + dr * 10)}" y2="${r1(Y(lvl))}" stroke="#ffd166" stroke-width="2"/>`;
    const seen = [0, 1, 2, 5][I(v, "seenBy")];
    for (let i = 0; i < 5; i++) s += eye(k, 140 + i * 22, 156, i < seen);
    s += S(k, 140 + 2 * 22, 146, `noticed by ${v("seenBy")}`, "#aaa", "middle", 7);
    return s;
  }
  W.look("enneagramHealth", (v, k) => {
    const hi = I(v, "setting");
    const sc = v.n("scenesHere");
    let stack = "";
    for (let i = 0; i < sc; i++) stack += `<rect x="${160 + (i % 10) * 12}" y="${108 - Math.floor(i / 10) * 10}" width="10" height="8" fill="#555"/>`;
    return (
      k.bg(BG) +
      ladder(k, v) +
      k.person({ x: 220, y: 100, s: 0.9, mood: [-0.8, 0, 0.8][hi], lean: [-12, 0, 0][hi], arms: [-0.8, -0.2, 0.6][hi], color: ["#7a5a5a", "#4a6fa5", "#4a8f6a"][hi] }) +
      S(k, 220, 18, `tipped by ${v("trigger")}`, "#ccc") +
      stack +
      S(k, 160, 128, `${sc} scenes at this level`, "#aaa", "start", 7) +
      k.caption(`${v("setting")} · level ${v.n("level")} · ${v("pull")}`)
    );
  });
  W.look("cm-health", (v, k) => {
    const g = { x: 160, y: 30, w: 140, h: 60 };
    const rec = I(v, "recover");
    const rs = v.n("recoverScenes") / 20;
    const f = (t) => (t < 0.2 ? 0.8 : t < 0.25 ? 0.8 - 0.6 * ((t - 0.2) / 0.05) : 0.2 + Math.min(0.6, ((t - 0.25) / (0.05 + rs * 0.7)) * [0.15, 0.4, 0.6, 0.6][rec]));
    let pts = "";
    for (let i = 0; i <= 50; i++) pts += `${r1(g.x + (i / 50) * g.w)},${r1(g.y + g.h - f(i / 50) * g.h)} `;
    return (
      k.bg(BG) +
      ladder(k, v) +
      `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="4" fill="#1d1d24" stroke="#33333d"/>` +
      `<polyline points="${pts.trim()}" fill="none" stroke="#6cc070" stroke-width="2"/>` +
      S(k, g.x + 4, g.y - 4, `bounces back ${v("recover")} · ${v.n("recoverScenes")} scenes`, "#aaa", "start", 7) +
      S(k, 230, 112, `tipped by ${v("trigger")}`, "#ccc") +
      k.caption(`Health level ${v.n("level")} · ${v("pull")} · drift ${v.n("drift")}`)
    );
  });

  /* ---------------- cm-stability: ripples spreading from them, calm or rough ---------------- */
  W.look("cm-stability", (v, k) => {
    const p = v.n("position") / 100;
    const cx = 110;
    const cy = 100;
    const rip = I(v, "ripple");
    let rings = "";
    for (let i = 1; i <= 1 + rip; i++) {
      const r = 18 + i * 16;
      let d = "";
      for (let j = 0; j <= 40; j++) {
        const a = (j / 40) * Math.PI * 2;
        const rr = r + Math.sin(a * 8 + i) * p * 5;
        d += `${j ? "L" : "M"}${r1(cx + Math.cos(a) * rr)} ${r1(cy + Math.sin(a) * rr * 0.55)}`;
      }
      rings += `<path d="${d}Z" fill="none" stroke="${k.mix("#7fd4ff", "#ef5350", p)}" stroke-width="1.5" opacity="0.7"/>`;
    }
    const arr = I(v, "arrival");
    const aff = Math.round((v.n("affected") / 100) * 24);
    let room = "";
    for (let i = 0; i < 24; i++) {
      const gx = 210 + (i % 6) * 16;
      const gy = 50 + Math.floor(i / 6) * 18;
      const j = arr * 5;
      room += k.dot({ x: gx + (k.rnd(i) - 0.5) * j * 2, y: gy + (k.rnd(i + 9) - 0.5) * j * 2, r: 3, color: i < aff ? "#ffd166" : "#555" });
    }
    const ch = v.n("changes");
    let sp = "";
    for (let i = 0; i < ch; i++) sp += star(k, 26 + (i % 5) * 16, 44 + Math.floor(i / 5) * 16, 5, "#ff9a3c");
    return (
      k.bg(BG) +
      spectrum(k, v, "Stabilizer", "Catalyst") +
      rings +
      lit(k, v, cx, cy + 14, k.person({ x: cx, y: cy + 14, s: 0.8, mood: 0.3, arms: p * 0.8 - 0.3, color: "#4a6fa5" })) +
      S(k, cx, 160, `holds steady: ${v("anchor")}`, "#9fd3ff") +
      room +
      S(k, 250, 134, `when they arrive, ${v("arrival")}`, "#aaa", "middle", 7) +
      sp +
      clockFace(k, 296, 150, 8, v.n("roomSeconds"), 60) +
      k.caption(`Reaches ${v("ripple")} · ${v.n("affected")} affected · ${ch} changes`)
    );
  });

  /* ---------------- cm-freedom: the group, and how far they stand from it ---------------- */
  W.look("cm-freedom", (v, k) => {
    const p = v.n("position") / 100;
    const n = Math.max(1, Math.round((v.n("groupSize") / 100) * 15));
    let grp = "";
    for (let i = 0; i < n; i++) grp += k.person({ x: 20 + (i % 5) * 16, y: 112 + Math.floor(i / 5) * 18, s: 0.4, color: "#6b6f78", look: 1 });
    const fx = 120 + (v.n("fromGroup") / 20) * 150;
    const y = 140;
    const so = v.p("standsOut");
    const pr = v.n("pressure");
    let arrows = "";
    for (let i = 0; i < pr; i++) arrows += k.arrow({ x1: 100, y1: 70 + i * 10, x2: fx - 20, y2: 80 + i * 6, color: "#888", w: 1.2 });
    const ga = v.n("goAlong") / 100;
    return (
      k.bg(BG) +
      spectrum(k, v, "Conformist", "Individualist") +
      grp +
      S(k, 60, 58, v("whichGroup"), "#aaa") +
      arrows +
      lit(k, v, fx, y, k.person({ x: fx, y, s: 1, look: p > 0.5 ? 1 : -1, lean: (p - 0.5) * 16, mood: p - 0.4, color: k.mix("#6b6f78", "#ff7a59", so) })) +
      `<rect x="160" y="152" width="140" height="6" fill="#333"/><rect x="160" y="152" width="${r1(Math.max(1, ga * 140))}" height="6" fill="#888"/>` +
      `<path d="M${r1(160 + (v.n("breakAt") / 100) * 140)} 151 l-4 -6 h8 z" fill="#ff7a59"/>` +
      S(k, 158, 157, "goes along, breaks at ▼", "#aaa", "end", 7) +
      k.caption(`${v("standsOut")} · ${v.n("fromGroup")} m from the group · pressure ${pr}`)
    );
  });

  /* ---------------- cm-morality: who they share with ---------------- */
  W.look("cm-morality", (v, k) => {
    const p = v.n("position") / 100;
    const cx = 100;
    const cy = 96;
    const ci = I(v, "circle");
    let rings = "";
    ["themselves", "family", "friends", "strangers"].forEach((nm, i) => (rings += k.ring({ x: cx, y: cy, r: 22 + i * 18, color: i <= ci ? "#6cc070" : "#3a3a40", w: i === ci ? 3 : 1.5 })));
    const hp = Math.round((v.n("helped") / 100) * 30);
    let ppl = "";
    for (let i = 0; i < hp; i++) {
      const a = (i / 30) * Math.PI * 2;
      const r = 24 + (i % 4) * 18;
      ppl += k.dot({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, r: 2.5, color: "#ffd166" });
    }
    const given = v.n("givenAway") / 100;
    const coins = 10;
    let pile = "";
    for (let i = 0; i < coins; i++) {
      const out = i < Math.round(given * coins);
      pile += `<ellipse cx="${out ? 250 + (i % 3) * 18 : 210}" cy="${out ? 130 - Math.floor(i / 3) * 6 : 140 - i * 4}" rx="8" ry="3" fill="#e0a83c" stroke="${ink}"/>`;
    }
    const ti = I(v, "tested");
    const fork = ti === 0 ? `<line x1="230" y1="60" x2="230" y2="30" stroke="#888" stroke-width="3"/>` : `<path d="M230 64 V48 L${230 - ti * 14} 30 M230 48 L${230 + ti * 14} 30" stroke="#888" stroke-width="3" fill="none"/>`;
    return (
      k.bg(BG) +
      spectrum(k, v, "Altruistic", "Self-serving") +
      rings +
      ppl +
      lit(k, v, cx, cy + 22, k.person({ x: cx, y: cy + 22, s: 0.7, arms: (1 - p) * 0.9 - 0.3, mood: 0.5 - p * 0.5, color: "#4a6fa5" })) +
      pile +
      S(k, 210, 156, "keeps", "#aaa", "middle", 7) +
      S(k, 268, 156, "gives", "#aaa", "middle", 7) +
      fork +
      S(k, 260, 46, v("tested"), "#ccc", "start", 7) +
      k.caption(`Would give up ${v("sacrifice")} · cares for ${v("circle")}`)
    );
  });

  /* ---------------- cm-risk: how close to the edge ---------------- */
  W.look("cm-risk", (v, k) => {
    const p = v.n("position") / 100;
    const edge = 250;
    const x = edge - 10 - (v.n("toDanger") / 20) * 190;
    const y = 120;
    const si = I(v, "stake");
    const odds = v.n("odds") / 100;
    let cracks = "";
    for (let i = 0; i < Math.round(odds * 6); i++) cracks += `<polyline points="${edge - 8 - i * 14},${y} ${edge - 12 - i * 14},${y + 8} ${edge - 6 - i * 14},${y + 14}" fill="none" stroke="#ef5350" stroke-width="1.5"/>`;
    const pl = I(v, "planning");
    let paper = "";
    for (let i = 0; i < pl; i++) paper += `<rect x="${20 + i * 6}" y="${40 + i * 4}" width="28" height="34" fill="#f4f1ea" stroke="${ink}"/>`;
    for (let i = 0; i < pl * 2; i++) paper += `<line x1="${24 + (pl - 1) * 6}" y1="${48 + (pl - 1) * 4 + i * 4}" x2="${42 + (pl - 1) * 6}" y2="${48 + (pl - 1) * 4 + i * 4}" stroke="#888"/>`;
    const th = v.n("thrill") / 5;
    return (
      k.bg(BG) +
      spectrum(k, v, "Cautious", "Reckless") +
      `<rect x="0" y="${y}" width="${edge}" height="60" fill="#5a4a3a"/><rect x="${edge}" y="${y}" width="${320 - edge}" height="60" fill="#050507"/>` +
      cracks +
      S(k, 290, y + 20, `${v.n("odds")}% it goes wrong`, "#ef9a9a", "middle", 7) +
      paper +
      S(k, 34, 90, v("planning"), "#aaa", "middle", 7) +
      lit(k, v, x, y, k.person({ x, y, s: 1, lean: (p - 0.5) * 30, walk: p * 0.5, mood: th * 1.2 - 0.4, arms: th * 0.8 - 0.2, color: "#4a6fa5" })) +
      `<rect x="${r1(x + 14)}" y="${y - 40}" width="${6 + si * 4}" height="${6 + si * 4}" rx="2" fill="#e0a83c" stroke="${ink}"/>` +
      S(k, x, y - 84, `bets ${v("stake")}`, "#e0b080") +
      S(k, (x + edge) / 2, y + 12, `${v.n("toDanger")} m to the edge`, "#ccc", "middle", 7) +
      clockFace(k, 296, 50, 9, v.n("thinkSeconds"), 60) +
      k.caption(`Thinks ${v.n("thinkSeconds")} s · thrill ${v.n("thrill")} of 5`)
    );
  });

  /* ---------------- cm-control: strings from their hands ---------------- */
  W.look("cm-control", (v, k) => {
    const p = v.n("position") / 100;
    const center = 160;
    const x = center - 20 + (v.n("fromCenter") / 10) * 120 * (1 - 0) - 60;
    const y = 140;
    const ti = I(v, "target");
    const targets = [[], [[x + 70, 110, "plan"]], [[x + 90, 140, "p"]], [[x + 70, 140, "p"], [x + 100, 140, "p"], [x + 130, 140, "p"], [x + 160, 140, "p"]]][ti];
    const gi = I(v, "grip");
    let strings = "";
    const hx = x + 10;
    const hy = y - 72;
    if (ti === 0) strings += `<path d="M${hx} ${hy} Q${hx + 20} ${hy + 30 - p * 20} ${x - 12} ${y - 40}" stroke="#ddd" fill="none" stroke-width="${1 + gi}"/>`;
    targets.forEach(([tx, ty, kind]) => {
      const sag = (1 - p) * 40;
      strings += `<path d="M${hx} ${hy} Q${r1((hx + tx) / 2)} ${r1(Math.min(hy, ty - 70) + sag)} ${r1(tx)} ${r1(ty - 66 * 0.7)}" stroke="#ddd" fill="none" stroke-width="${1 + gi}"/>`;
      strings += kind === "plan" ? `<rect x="${tx - 12}" y="${ty - 48}" width="24" height="30" fill="#f4f1ea" stroke="${ink}"/>` : k.person({ x: tx, y: ty, s: 0.7, color: "#8a8a8a", arms: 0.6 * p, mood: -0.2 });
    });
    const orders = v.n("orders");
    let bangs = "";
    for (let i = 0; i < orders; i++) bangs += S(k, 20 + (i % 10) * 10, 44 + Math.floor(i / 10) * 14, "!", "#ef5350", "middle", 11);
    return (
      k.bg(BG) +
      spectrum(k, v, "Surrender", "Controlling") +
      `<ellipse cx="${center}" cy="${y + 2}" rx="18" ry="4" fill="none" stroke="#666" stroke-dasharray="2 2"/>` +
      S(k, center, y + 14, "room center", "#666", "middle", 7) +
      bangs +
      strings +
      lit(k, v, x, y, k.person({ x, y, s: 1, arms: 0.2 + p * 0.6, mood: p * 0.4 - 0.1, color: "#4a6fa5" })) +
      S(k, 300, 44, `by ${v("method")}`, "#ffd166", "end", 9) +
      k.pie({ x: 290, y: 70, r: 10, p: v.n("talkShare") / 100, color: "#ffd166" }) +
      S(k, 276, 74, `${v.n("talkShare")}% of the talk`, "#aaa", "end", 7) +
      k.caption(`Steers ${v("target")} · grip ${v("grip")} · ${orders} orders`)
    );
  });

  /* ---------------- cm-adaptability: bending in the wind, or standing stiff ---------------- */
  W.look("cm-adaptability", (v, k) => {
    const p = v.n("position") / 100;
    const x = 110;
    const y = 140;
    const bend = (1 - p) * 26;
    const up = I(v, "underPressure");
    const stick = [
      `<path d="M240 ${y} Q 244 ${y - 40} 272 ${y - 70}" stroke="#a0703f" stroke-width="5" fill="none"/>`,
      `<path d="M240 ${y} Q 242 ${y - 40} 258 ${y - 74}" stroke="#a0703f" stroke-width="5" fill="none"/>`,
      `<line x1="240" y1="${y}" x2="240" y2="${y - 76}" stroke="#a0703f" stroke-width="5"/><polyline points="236,${y - 40} 244,${y - 34} 238,${y - 28}" stroke="#fff" fill="none" stroke-width="1.5"/>`,
      `<line x1="240" y1="${y}" x2="240" y2="${y - 40}" stroke="#a0703f" stroke-width="5"/><line x1="246" y1="${y - 2}" x2="266" y2="${y - 30}" stroke="#a0703f" stroke-width="5"/>`,
    ][up];
    const ri = I(v, "rules");
    let sign = `<rect x="20" y="40" width="44" height="${16 + ri * 10}" fill="#f4f1ea" stroke="${ink}"/>`;
    for (let i = 0; i < ri * 2 + 1; i++) sign += `<line x1="24" y1="${46 + i * 5}" x2="60" y2="${46 + i * 5}" stroke="${ri === 3 ? ink : "#999"}" stroke-width="${ri === 3 ? 1.5 : 1}"/>`;
    const imp = v.n("improvise");
    let bulbs = "";
    for (let i = 0; i < imp; i++) bulbs += k.dot({ x: x - 20 + i * 10, y: y - 96, r: 3.5, color: "#ffd166" });
    const pc = v.n("plansChanged");
    let plans = "";
    for (let i = 0; i < pc; i++) plans += `<rect x="${150 + (i % 5) * 14}" y="${40 + Math.floor(i / 5) * 18}" width="11" height="14" fill="#f4f1ea"/><line x1="${150 + (i % 5) * 14}" y1="${40 + Math.floor(i / 5) * 18}" x2="${161 + (i % 5) * 14}" y2="${54 + Math.floor(i / 5) * 18}" stroke="#ef5350"/>`;
    let wind = "";
    for (let i = 0; i < 3; i++) wind += `<path d="M${x - 70} ${70 + i * 18} q14 -6 28 0" stroke="#9fd3ff" fill="none"/>`;
    return (
      k.bg(BG) +
      spectrum(k, v, "Flexible", "Rigid") +
      sign +
      S(k, 42, 34, v("rules"), "#aaa", "middle", 7) +
      wind +
      bulbs +
      lit(k, v, x, y, k.person({ x, y, s: 1, lean: bend, arms: (1 - p) * 0.6 - 0.3, mood: 0.4 - p * 0.6, color: k.mix("#4a8f6a", "#6b6f78", p) }) + (p > 0.6 ? `<rect x="${x - 14}" y="${y - 82}" width="28" height="82" fill="none" stroke="#aaa" stroke-dasharray="3 2"/>` : "")) +
      plans +
      stick +
      S(k, 250, y + 12, `under pressure: ${v("underPressure")}`, "#aaa", "middle", 7) +
      clockFace(k, 296, 46, 9, v.n("adjustSeconds"), 120) +
      k.caption(`${pc} plans changed · thinks on their feet ${imp} of 5`)
    );
  });

  /* ---------------- cm-competence: a target with their tries on it ---------------- */
  W.look("cm-competence", (v, k) => {
    const p = v.n("position") / 100;
    const tx = 220;
    const ty = 92;
    let s = "";
    [44, 32, 20, 9].forEach((r, i) => (s += `<circle cx="${tx}" cy="${ty}" r="${r}" fill="${i % 2 ? "#f4f1ea" : "#c0392b"}"/>`));
    const tries = v.n("tries");
    const hits = Math.round(tries * (v.n("successRate") / 100));
    for (let i = 0; i < tries; i++) {
      const hit = i < hits;
      const a = k.rnd(i + 1) * Math.PI * 2;
      const r = hit ? k.rnd(i + 7) * 9 : 12 + (1 - p) * 30 + k.rnd(i + 3) * 10;
      s += k.dot({ x: tx + Math.cos(a) * r, y: ty + Math.sin(a) * r, r: 2.5, color: hit ? "#ffd166" : ink });
    }
    const mis = v.n("mistakes");
    for (let i = 0; i < mis; i++) s += S(k, 170 + i * 14, 150, "✕", "#ef5350", "middle", 12);
    const sb = v.n("selfBelief") / 100;
    const li = I(v, "learning");
    const dy = [10, 0, -10, -18][li];
    return (
      k.bg(BG) +
      spectrum(k, v, "Ineffective", "Highly capable") +
      `<g opacity="0.25">${k.person({ x: 80, y: 150, s: 0.6 + sb * 1.1, color: "#ffd166" })}</g>` +
      lit(k, v, 80, 150, k.person({ x: 80, y: 150, s: 1, arms: 0.3, mood: p - 0.4, look: 1, color: "#4a6fa5" })) +
      S(k, 80, 40, "how big they feel", "#ffd166", "middle", 7) +
      s +
      S(k, tx, 152, `${hits} of ${tries} work`, "#ccc", "middle", 8).replace(/y="152"/, 'y="144"') +
      k.arrow({ x1: 280, y1: 60, x2: 304, y2: 60 + dy, color: li >= 2 ? "#6cc070" : "#ef5350", w: 2 }) +
      S(k, 300, 82, v("learning"), "#aaa", "end", 7) +
      k.caption(`Measured against ${v("comparedWith")} · ${mis} mistakes`)
    );
  });

  /* ---------------- cm-need: the safe house, or the open road ---------------- */
  W.look("cm-need", (v, k) => {
    const p = v.n("position") / 100;
    const y = 140;
    const x = 80 + p * 170;
    const tied = I(v, "tiedBy");
    const yrs = v.n("yearsTied") / 50;
    const urge = v.n("urge") / 5;
    const gl = v.n("doorGlances");
    let looks = "";
    for (let i = 0; i < gl; i++) looks += `<line x1="${r1(x + 6)}" y1="${y - 72}" x2="300" y2="${60 + i * 7}" stroke="#ffd166" stroke-dasharray="2 3" opacity="0.5"/>`;
    const ti = I(v, "trade");
    const tilt = [-14, -5, 5, 14][ti];
    return (
      k.bg(BG) +
      spectrum(k, v, "Security", "Freedom") +
      `<path d="M20 ${y} v-50 l36 -28 l36 28 v50 z" fill="#8a6038" stroke="${ink}" stroke-width="2"/><rect x="48" y="${y - 30}" width="16" height="30" fill="#3a2a1a"/>` +
      `<path d="M240 ${y} L320 ${y - 30} L320 ${y} Z" fill="#3c5a3a"/><rect x="290" y="${y - 70}" width="20" height="40" fill="#cfe8ff" opacity="0.4"/>` +
      `<line x1="56" y1="${y - 20}" x2="${r1(x - 8)}" y2="${y - 30}" stroke="${k.mix("#d8c39a", "#6b5a3a", yrs)}" stroke-width="${[0.6, 1.5, 2.5, 4][tied]}"${tied === 0 ? ' stroke-dasharray="2 3"' : ""}/>` +
      S(k, 100, y + 12, `tied by ${v("tiedBy")} · ${v.n("yearsTied")} years`, "#aaa", "middle", 7) +
      looks +
      lit(k, v, x, y, k.person({ x, y, s: 1, lean: urge * 18, walk: urge * 0.5, look: 1, mood: p - 0.5, color: "#4a6fa5" })) +
      `<g transform="rotate(${tilt} 160 48)"><line x1="136" y1="48" x2="184" y2="48" stroke="#ccc" stroke-width="2"/><rect x="132" y="48" width="10" height="6" fill="#8a6038"/><rect x="178" y="48" width="10" height="6" fill="#3c5a3a"/></g><line x1="160" y1="48" x2="160" y2="62" stroke="#ccc" stroke-width="2"/>` +
      S(k, 160, 74, `would trade: ${v("trade")}`, "#aaa", "middle", 7) +
      k.caption(`Urge to run ${v.n("urge")} of 5 · ${gl} looks at the way out`)
    );
  });

  /* ---------------- cm-motivation: pulled by a prize, or lit from inside ---------------- */
  W.look("cm-motivation", (v, k) => {
    const p = v.n("position") / 100;
    const x = 110;
    const y = 140;
    const ai = I(v, "audience");
    const wn = Math.round((v.n("watchers") / 1000) * 40);
    let crowd = "";
    for (let i = 0; i < wn; i++) crowd += k.dot({ x: 200 + (i % 10) * 11, y: 120 + Math.floor(i / 10) * 9, r: 2.5, color: "#888" });
    const who = [S(k, 250, 100, "(nobody)", "#666", "middle", 7), `<rect x="236" y="70" width="22" height="34" rx="3" fill="#9fd3ff" opacity="0.4" stroke="#ccc"/>` + S(k, 247, 114, "a mirror", "#aaa", "middle", 7), k.person({ x: 250, y: 112, s: 0.6, look: -1, color: "#8a8a8a" }), k.beam({ x: 250, y: 30, dir: 120, len: 140, spread: 30, color: "#fff3c4", alpha: 0.15 }), k.ring({ x: 250, y: 90, r: 26, color: "#5aa0ff", w: 2 }) + S(k, 250, 94, "the world", "#9fd3ff", "middle", 7)][ai];
    const ch = v.n("checksWatchers");
    let glances = "";
    for (let i = 0; i < Math.min(ch, 10); i++) glances += `<line x1="${x + 6}" y1="${y - 72}" x2="${200 + i * 10}" y2="118" stroke="#ffd166" stroke-dasharray="2 3" opacity="0.4"/>`;
    const aw = I(v, "aware");
    return (
      k.bg(BG) +
      spectrum(k, v, "External", "Internal") +
      `<g opacity="${r1((1 - p) * 0.85 + 0.1)}"><line x1="${x + 10}" y1="${y - 60}" x2="${x + 60}" y2="${y - 90}" stroke="#ccc"/><line x1="${x + 60}" y1="${y - 90}" x2="${x + 60}" y2="${y - 70}" stroke="#ccc"/><rect x="${x + 46}" y="${y - 70}" width="28" height="16" rx="3" fill="#e0a83c"/>${S(k, x + 60, y - 74 + 15, v("prize"), ink, "middle", 7)}</g>` +
      `<circle cx="${x}" cy="${y - 44}" r="${r1(4 + p * 12)}" fill="#ffd166" opacity="${r1(0.15 + p * 0.6)}"/>` +
      glances +
      crowd +
      who +
      lit(k, v, x, y, k.person({ x, y, s: 1, look: 1, walk: (1 - p) * 0.4, mood: 0.3, color: "#4a6fa5" })) +
      `<g opacity="${[0.35, 0.65, 1][aw]}"><ellipse cx="${x - 50}" cy="46" rx="34" ry="12" fill="#f4f1ea"/>${S(k, x - 50, 49, ["why? ...", "maybe it's...", "I know why"][aw], ink, "middle", 8)}</g>` +
      k.caption(`After ${v("prize")} · for ${v("audience")} · ${v.n("watchers")} watching`)
    );
  });

  /* ---------------- cm-worldview: sun or storm overhead ---------------- */
  W.look("cm-worldview", (v, k) => {
    const p = v.n("position") / 100;
    const x = 110;
    const y = 140;
    const ws = v.n("worstShare") / 100;
    let rain = "";
    for (let i = 0; i < Math.round(ws * 24); i++) rain += `<line x1="${30 + ((i * 37) % 200)}" y1="${50 + ((i * 13) % 50)}" x2="${26 + ((i * 37) % 200)}" y2="${58 + ((i * 13) % 50)}" stroke="#9fc4e8"/>`;
    const vi = I(v, "voiced");
    const pi = I(v, "proved");
    return (
      k.bg(k.mix("#2a3550", "#1a1a1e", p)) +
      spectrum(k, v, "Idealist", "Cynic", v.n("sinceStart")) +
      `<circle cx="70" cy="56" r="${r1(6 + (1 - p) * 16)}" fill="#ffd166" opacity="${r1(0.2 + (1 - p) * 0.8)}"/>` +
      `<ellipse cx="160" cy="54" rx="${r1(10 + p * 50)}" ry="${r1(6 + p * 12)}" fill="#4a4f5c" opacity="${r1(0.3 + p * 0.7)}"/>` +
      rain +
      lit(k, v, x, y, k.person({ x, y, s: 1, look: 1, mood: 0.6 - p * 1.2, color: "#4a6fa5" })) +
      `<g opacity="${[0.15, 0.45, 0.75, 1][vi]}">${k.bubble({ x: 200, y: 96, w: 100, h: 22, text: p > 0.5 ? "It won't work." : "It'll work out.", tail: -40, size: 9 })}</g>` +
      `<rect x="250" y="${y - 20}" width="56" height="20" rx="3" fill="#2c2c34" stroke="#555"/>` +
      S(k, 278, y - 6, v("shapedBy"), "#ccc", "middle", 7) +
      S(k, 290, 50, pi === 0 ? "✕" : pi === 2 ? "✓" : "?", pi === 0 ? "#ef5350" : pi === 2 ? "#6cc070" : "#aaa", "middle", 20) +
      S(k, 290, 66, v("proved"), "#aaa", "middle", 7) +
      k.caption(`Shaped by ${v("shapedBy")} · says it ${v("voiced")} · ${v.n("worstShare")}% expects the worst`)
    );
  });

  /* ---------------- cm-emotion: heart and head ---------------- */
  W.look("cm-emotion", (v, k) => {
    const p = v.n("position") / 100;
    const cx = 110;
    const cy = 58;
    const bt = [0, 1, 3, 6][I(v, "breaksThrough")];
    let sp = "";
    for (let i = 0; i < bt; i++) sp += k.dot({ x: cx - 8 + (i % 3) * 8, y: cy + 60 + Math.floor(i / 3) * 10, r: 2.5, color: p > 0.5 ? "#ef5350" : "#7fb7ff" });
    const si = I(v, "showsIn");
    const spot = [[cx, cy, 30], [cx, cy + 22, 9], [cx, cy + 70, 34], [cx + 46, cy + 56, 12]][si];
    const dd = I(v, "decideSpeed") * 34 + (v.n("decideSeconds") / 120) * 70;
    const bf = Math.round(v.n("byFeeling") / 10);
    let cells = "";
    for (let i = 0; i < 10; i++) cells += `<rect x="${200 + i * 10}" y="70" width="8" height="8" fill="${i < bf ? "#ef5370" : "#5aa0ff"}"/>`;
    const hr = 5 + (1 - p) * 9;
    const hx = cx - 14;
    const hy = cy + 56;
    return (
      k.bg(BG) +
      spectrum(k, v, "Emotional", "Rational") +
      `<g opacity="${[0.35, 0.65, 1][I(v, "shown")]}">` +
      `<rect x="${cx - 32}" y="${cy + 28}" width="64" height="${150 - cy - 28}" rx="14" fill="#4a6fa5"/>` +
      `<line x1="${cx + 32}" y1="${cy + 44}" x2="${cx + 46}" y2="${cy + 56}" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>` +
      k.face({ x: cx, y: cy, r: 30, mood: 0.4 - p * 0.5 }) +
      `<path d="M${hx} ${r1(hy + hr)} C${r1(hx - hr * 2)} ${r1(hy - hr * 0.4)} ${r1(hx - hr * 0.9)} ${r1(hy - hr * 1.6)} ${hx} ${r1(hy - hr * 0.5)} C${r1(hx + hr * 0.9)} ${r1(hy - hr * 1.6)} ${r1(hx + hr * 2)} ${r1(hy - hr * 0.4)} ${hx} ${r1(hy + hr)} Z" fill="#ef5370"/>` +
      `<circle cx="${cx + 14}" cy="${cy - 6}" r="${r1(3 + p * 9)}" fill="none" stroke="#5aa0ff" stroke-width="3" stroke-dasharray="3 2" opacity="0.8"/>` +
      `</g>` +
      sp +
      k.ring({ x: spot[0], y: spot[1], r: spot[2], color: "#ffd166", w: 1.5, dash: "3 3" }) +
      S(k, 200, 60, "choices: feeling vs head", "#aaa", "start", 7) +
      cells +
      `<path d="M200 118 l4 -8 h-3 l4 -8" stroke="#ffd166" stroke-width="2" fill="none"/>` +
      `<line x1="210" y1="114" x2="${r1(210 + dd * 0.6)}" y2="114" stroke="#888" stroke-dasharray="2 2"/>` +
      S(k, r1(214 + dd * 0.6), 117, "✓", "#6cc070", "start", 11) +
      S(k, 200, 134, `decides ${v("decideSpeed")} (${v.n("decideSeconds")} s)`, "#aaa", "start", 7) +
      k.caption(`Shows in ${v("showsIn")} · other side: ${v("breaksThrough")}`)
    );
  });

  /* ---------------- cm-temperament: their room, neat or a mess ---------------- */
  W.look("cm-temperament", (v, k) => {
    const p = v.n("position") / 100;
    const oop = Math.round(v.n("outOfPlace") / 50 * 16);
    let things = "";
    for (let i = 0; i < 16; i++) {
      const gx = 30 + (i % 8) * 22;
      const gy = 60 + Math.floor(i / 8) * 34;
      const j = p * 10 + (i < oop ? 14 : 0);
      const dx = (k.rnd(i + 1) - 0.5) * j * 1.6;
      const dy = (k.rnd(i + 5) - 0.5) * j;
      const rot = (k.rnd(i + 9) - 0.5) * (p * 40 + (i < oop ? 70 : 0));
      things += `<rect x="${r1(gx + dx)}" y="${r1(gy + dy)}" width="14" height="18" rx="2" fill="${["#c0392b", "#5aa0ff", "#e0a83c", "#6cc070"][i % 4]}" transform="rotate(${r1(rot)} ${r1(gx + dx + 7)} ${r1(gy + dy + 9)})"/>`;
    }
    const mi = I(v, "mess");
    let mess = "";
    for (let i = 0; i < [0, 1, 3, 6, 10][mi]; i++) mess += `<ellipse cx="${30 + ((i * 47) % 170)}" cy="${138 + (i % 3) * 5}" rx="${8 + (i % 3) * 3}" ry="3" fill="#6b5a3a"/>`;
    const ri = I(v, "routine");
    let sched = `<rect x="226" y="30" width="44" height="58" fill="#f4f1ea" stroke="${ink}"/>`;
    for (let i = 0; i < [8, 6, 3, 0][ri]; i++) sched += `<line x1="230" y1="${36 + i * 6}" x2="${266 - (ri === 2 ? (i % 2) * 12 : 0)}" y2="${36 + i * 6}" stroke="#555"/>`;
    const late = I(v, "onTime") * 10 + v.n("minutesLate");
    const ang = ((late / 60) * 360 - 90) * (Math.PI / 180);
    return (
      k.bg(BG) +
      spectrum(k, v, "Orderly", "Chaotic") +
      `<rect x="20" y="40" width="186" height="110" rx="4" fill="#24242c"/>` +
      things +
      mess +
      S(k, 113, 160 - 2, `${v.n("outOfPlace")} things out of place · ${v("mess")}`, "#aaa", "middle", 7) +
      sched +
      S(k, 248, 100, `routine: ${v("routine")}`, "#aaa", "middle", 7) +
      `<circle cx="290" cy="130" r="16" fill="#f4f1ea" stroke="${ink}" stroke-width="2"/><line x1="290" y1="130" x2="290" y2="117" stroke="${ink}" stroke-width="2"/><line x1="290" y1="130" x2="${r1(290 + Math.cos(ang) * 13)}" y2="${r1(130 + Math.sin(ang) * 13)}" stroke="#c0392b" stroke-width="2"/>` +
      S(k, 250, 152, `${v("onTime")} (${v.n("minutesLate")} min)`, "#aaa", "start", 7) +
      `<g opacity="${[0.35, 0.65, 1][I(v, "shown")]}">${k.person({ x: 240, y: 160, s: 0.5, mood: 0.2, color: "#4a6fa5" })}</g>` +
      k.caption(`${v("mess")} space · ${v("routine")} routine · ${v("onTime")}`)
    );
  });

  /* ---------------- a dot grid (pad) for two settings that pair naturally, on each curiosity that had none ---------------- */
  [
    ["cm-agency", "position", "steers", "Reactive to Proactive", "How much they steer"],
    ["cm-openness", "position", "eyeContact", "Open to Secretive", "Time meeting eyes"],
    ["cm-conflict", "position", "closeIn", "Avoids to Confronts", "How close they get"],
    ["cm-truth", "trueShare", "skill", "Share that's true", "How good a liar"],
    ["enneagramType", "wing", "purity", "Wing", "How purely the type plays"],
    ["enneagramHealth", "levelsMoved", "level", "Levels moved", "Level"],
    ["cm-stability", "position", "affected", "Stabilizer to Catalyst", "People affected"],
    ["cm-morality", "position", "givenAway", "Altruistic to Self-serving", "Share given away"],
    ["cm-control", "position", "talkShare", "Surrender to Controlling", "Share of the talking"],
    ["cm-adaptability", "position", "improvise", "Flexible to Rigid", "Thinks on their feet"],
    ["cm-need", "position", "urge", "Security to Freedom", "Urge to run"],
    ["cm-motivation", "position", "watchers", "External to Internal", "People watching"],
    ["cm-health", "level", "drift", "Health", "Drift per scene"],
    ["cm-worldview", "position", "worstShare", "Idealist to Cynic", "Lines expecting the worst"],
    ["cm-emotion", "position", "byFeeling", "Emotional to Rational", "Choices made by feeling"],
    ["cm-temperament", "position", "outOfPlace", "Orderly to Chaotic", "Things out of place"],
  ].forEach(([id, x, y, xLabel, yLabel]) => {
    const spec = W.get && W.get(id);
    if (spec && (spec.faces || []).some((f) => f.face === "pad")) return;
    W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
