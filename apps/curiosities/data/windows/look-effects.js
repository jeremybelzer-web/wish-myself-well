/* Effects: the live picture at the top of each effects curiosity's window (CuriosityWindows.look). Every own
   setting moves something in the picture: the thing itself (size, place, color, count, motion lines), or, for
   timing and "measured from" settings, a small timeline or a label chip. */
(function (W) {
  if (!W) return;
  const r1 = (n) => Math.round(n * 10) / 10;
  const INK = "#1c1712";

  /* The bottom caption, with float noise trimmed and the type shrunk (down to 7 px) so long settings fit. */
  const fitCaption = (k, t) => {
    let x = String(t).replace(/(\d+\.\d)\d{3,}/g, "$1");
    if (x.length > 78) x = x.slice(0, 77) + "…";
    const size = r1(k.clamp(300 / Math.max(1, x.length * 0.55), 7, 10));
    return `<rect x="0" y="162" width="320" height="18" fill="rgba(0,0,0,0.55)"/>` + k.label({ x: 160, y: 175, text: x, size, color: "#f4f4f4" });
  };
  /* ---------- small shared drawings ---------- */
  /* A dark room: wall and floor. */
  const room = (k, o) => {
    o = o || {};
    const fy = o.floorY == null ? 140 : o.floorY;
    return k.bg(o.bg || "#15161b") + `<rect x="0" y="${fy}" width="320" height="${180 - fy}" fill="${o.floor || "#26231f"}"/>`;
  };
  /* Little word tags in a row, for settings that are about when or why rather than how it looks. */
  function chips(k, items, o) {
    o = o || {};
    const x0 = o.x == null ? 6 : o.x;
    let x = x0;
    let y = o.y == null ? 5 : o.y;
    const maxX = o.maxX || 314;
    let out = "";
    items.filter(Boolean).forEach((t) => {
      t = String(t);
      const w = t.length * 4.4 + 10;
      if (x + w > maxX && x > x0) {
        x = x0;
        y += 14;
      }
      /* A lone chip too long for the space slides left to stay in the frame. */
      if (x + w > maxX && x === x0) x = Math.max(2, maxX - w);
      out += `<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="12" rx="6" fill="rgba(0,0,0,0.6)" stroke="#55555f"/>` + k.label({ x: x + w / 2, y: y + 9, text: t, size: 8, color: "#e4e4e4" });
      x += w + 4;
    });
    return out;
  }
  /* A small time bar: 0 to max seconds, with coloured spans and tick marks. */
  function timeline(k, o) {
    const x = o.x;
    const y = o.y;
    const w = o.w || 120;
    const max = o.max || 10;
    const X = (t) => x + k.clamp(t / max, 0, 1) * w;
    let out = `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="#33333a"/>`;
    (o.segs || []).forEach((s) => {
      const a = X(s.from);
      const b = Math.max(a + 1.5, X(s.to));
      out += `<rect x="${r1(a)}" y="${y}" width="${r1(b - a)}" height="6" rx="3" fill="${s.color || "#ffd166"}"${s.alpha != null ? ` opacity="${s.alpha}"` : ""}/>`;
    });
    (o.marks || []).forEach((m) => {
      out += `<line x1="${r1(X(m.at))}" y1="${y - 3}" x2="${r1(X(m.at))}" y2="${y + 9}" stroke="${m.color || "#fff"}" stroke-width="${m.w || 1.5}"/>`;
    });
    if (o.label) out += k.label({ x, y: y - 3, text: o.label, size: 8, color: "#bbb", anchor: "start" });
    return out;
  }
  /* A curve inside a box: f(t) for t 0..1 gives 0..1. */
  function curve(k, o) {
    const n = o.n || 48;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(`${r1(o.x + t * o.w)},${r1(o.y + o.h - k.clamp(o.f(t), 0, 1) * o.h)}`);
    }
    const box = o.box === false ? "" : `<rect x="${o.x - 3}" y="${o.y - 3}" width="${o.w + 6}" height="${o.h + 6}" rx="4" fill="rgba(0,0,0,0.5)" stroke="#444"/>`;
    const area = o.fill ? `<polygon points="${o.x},${o.y + o.h} ${pts.join(" ")} ${o.x + o.w},${o.y + o.h}" fill="${o.fill}" opacity="0.35"/>` : "";
    return box + area + `<polyline points="${pts.join(" ")}" fill="none" stroke="${o.color || "#ffd166"}" stroke-width="${o.sw || 2}" stroke-linejoin="round"/>` + (o.label ? k.label({ x: o.x, y: o.y + 7, text: o.label, size: r1(k.clamp((o.w + 4) / (String(o.label).length * 0.5), 6, 7)), color: "#aaa", anchor: "start" }) : "");
  }
  /* Rise, hold, fall over time (seconds), drawn as a curve: how an effect comes and goes. */
  function envelope(k, o) {
    const rise = Math.max(0.05, o.rise);
    const hold = Math.max(0.05, o.hold);
    const fall = Math.max(0.05, o.fall);
    const pre = o.pre == null ? 0.6 : o.pre;
    const total = pre + rise + hold + fall + 0.6;
    const peak = o.peak == null ? 1 : o.peak;
    const snap = o.snap || 0;
    const f = (t) => {
      const s = t * total;
      if (s < pre) return 0.04;
      if (s < pre + rise) {
        const u = (s - pre) / rise;
        return 0.04 + peak * Math.pow(u, 1 + snap * 3);
      }
      if (s < pre + rise + hold) return 0.04 + peak * (1 - (o.wobble || 0) * 0.15 * (1 - Math.cos((s - pre - rise) * 6)));
      if (s < pre + rise + hold + fall) {
        const u = (s - pre - rise - hold) / fall;
        return 0.04 + peak * (1 - u) * (o.linger ? 1 - u * 0.4 : 1) + (o.linger || 0) * 0.15 * (1 - u);
      }
      return 0.04 + (o.linger || 0) * 0.12;
    };
    return curve(k, Object.assign({ f, fill: o.color || "#ffd166", n: 60 }, o));
  }
  /* Scattered bits: dots, streaks, flakes, sparks, leaves, rings or squares. */
  function bits(k, o) {
    const n = Math.round(o.n);
    let out = "";
    const seed = o.seed || 1;
    const dx = o.dx || 0;
    const dy = o.dy || 0;
    for (let i = 0; i < n; i++) {
      const x = o.x + k.rnd(seed + i * 7.1) * o.w;
      const y = o.y + k.rnd(seed + i * 3.7 + 11) * o.h;
      const r = Math.max(0.6, o.r * (0.6 + k.rnd(seed + i * 1.3) * 0.8));
      const c = Array.isArray(o.color) ? o.color[i % o.color.length] : o.color;
      const a = o.alpha == null ? 1 : o.alpha;
      const shape = o.shape || "dot";
      if ((dx || dy) && shape !== "ring") out += `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x - dx)}" y2="${r1(y - dy)}" stroke="${c}" stroke-width="${r1(Math.max(0.6, r * 0.7))}" opacity="${r1(a * 0.6)}" stroke-linecap="round"/>`;
      if (shape === "square") out += `<rect x="${r1(x - r)}" y="${r1(y - r)}" width="${r1(r * 2)}" height="${r1(r * 1.4)}" fill="${c}" opacity="${a}" transform="rotate(${Math.round(k.rnd(i + seed) * 90)} ${r1(x)} ${r1(y)})"/>`;
      else if (shape === "leaf") out += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r * 1.6)}" ry="${r1(r * 0.8)}" fill="${c}" opacity="${a}" transform="rotate(${Math.round(k.rnd(i + seed) * 180)} ${r1(x)} ${r1(y)})"/>`;
      else if (shape === "ring") out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="none" stroke="${c}" stroke-width="1" opacity="${a}"/>`;
      else if (shape === "spark") out += `<path d="M${r1(x - r)} ${r1(y)} L${r1(x + r)} ${r1(y)} M${r1(x)} ${r1(y - r)} L${r1(x)} ${r1(y + r)}" stroke="${c}" stroke-width="1.2" opacity="${a}"/>`;
      else if (shape === "shard") out += `<path d="M${r1(x)} ${r1(y - r * 1.4)} L${r1(x + r)} ${r1(y + r)} L${r1(x - r * 0.9)} ${r1(y + r * 0.5)} Z" fill="${c}" opacity="${a}" stroke="${INK}" stroke-width="0.5"/>`;
      else out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${c}" opacity="${a}"/>`;
    }
    return out;
  }
  /* A flame: a teardrop with a bright core. */
  function flame(k, o) {
    const x = o.x;
    const y = o.y;
    const h = Math.max(2, o.h);
    const w = Math.max(2, o.w || h * 0.5);
    const lean = o.lean || 0;
    const tip = `${r1(x + lean)} ${r1(y - h)}`;
    const outer = `<path d="M${r1(x - w / 2)} ${r1(y)} Q${r1(x - w / 2)} ${r1(y - h * 0.55)} ${tip} Q${r1(x + w / 2)} ${r1(y - h * 0.55)} ${r1(x + w / 2)} ${r1(y)} Z" fill="${o.color || "#ff7a2a"}" opacity="${o.alpha == null ? 0.95 : o.alpha}"/>`;
    const inner = `<path d="M${r1(x - w / 4)} ${r1(y)} Q${r1(x - w / 4)} ${r1(y - h * 0.3)} ${r1(x + lean * 0.5)} ${r1(y - h * 0.55)} Q${r1(x + w / 4)} ${r1(y - h * 0.3)} ${r1(x + w / 4)} ${r1(y)} Z" fill="${o.core || "#ffe08a"}"/>`;
    return outer + inner;
  }
  const puff = (k, o) => `<circle cx="${r1(o.x)}" cy="${r1(o.y)}" r="${r1(Math.max(0.5, o.r))}" fill="${o.color || "#999"}" opacity="${r1(k.clamp(o.alpha == null ? 0.5 : o.alpha, 0, 1) * 100) / 100}"/>`;
  /* A spiral: turns, direction 1 or -1. */
  function spiral(k, o) {
    const pts = [];
    const turns = Math.max(0.2, o.turns || 2);
    const n = Math.round(24 * turns);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = (o.start || 0) + t * turns * Math.PI * 2 * (o.dir || 1);
      const r = o.r * t;
      pts.push(`${r1(o.x + Math.cos(a) * r)},${r1(o.y + Math.sin(a) * r * (o.squash || 1))}`);
    }
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${o.color || "#ccc"}" stroke-width="${o.w || 2}" opacity="${o.alpha == null ? 0.8 : o.alpha}" stroke-linecap="round"/>`;
  }
  /* A burst star for hits and flashes. */
  function star(k, o) {
    const n = o.points || 8;
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + (o.turn || 0);
      const r = i % 2 ? o.r * 0.45 : o.r;
      pts.push(`${r1(o.x + Math.cos(a) * r)},${r1(o.y + Math.sin(a) * r)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="${o.color || "#ffd166"}" stroke="${o.stroke || INK}" stroke-width="1.2" opacity="${o.alpha == null ? 1 : o.alpha}"/>`;
  }
  /* Wind lines: n wavy streaks across a box, at an angle (degrees, 0 = blowing to the right). */
  function windLines(k, o) {
    let out = "";
    const n = Math.round(o.n);
    const ang = k.rad(o.angle || 0);
    for (let i = 0; i < n; i++) {
      const x = o.x + k.rnd(i * 5.3 + (o.seed || 2)) * o.w;
      const y = o.y + k.rnd(i * 2.9 + (o.seed || 2) + 9) * o.h;
      const len = o.len * (0.6 + k.rnd(i + 4) * 0.6);
      const wob = (o.wobble || 0) * 8;
      const ex = x + Math.cos(ang) * len;
      const ey = y + Math.sin(ang) * len;
      const mx = (x + ex) / 2 - Math.sin(ang) * wob * (k.rnd(i + 21) - 0.5) * 2;
      const my = (y + ey) / 2 + Math.cos(ang) * wob * (k.rnd(i + 21) - 0.5) * 2;
      out += `<path d="M${r1(x)} ${r1(y)} Q${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}" fill="none" stroke="${o.color || "#cfe6ff"}" stroke-width="${o.sw || 1.6}" opacity="${o.alpha == null ? 0.7 : o.alpha}" stroke-linecap="round"/>`;
    }
    return out;
  }
  /* Radiating or converging streaks, for wind toward or away from the camera. */
  function radial(k, o) {
    let out = "";
    for (let i = 0; i < o.n; i++) {
      const a = (i / o.n) * Math.PI * 2 + k.rnd(i) * 0.3;
      const r0 = o.r0 + k.rnd(i + 3) * 20;
      const r1_ = r0 + o.len;
      const [a0, b0] = o.inward ? [r1_, r0] : [r0, r1_];
      out += k.arrow({ x1: o.x + Math.cos(a) * a0, y1: o.y + Math.sin(a) * a0 * 0.6, x2: o.x + Math.cos(a) * b0, y2: o.y + Math.sin(a) * b0 * 0.6, color: o.color || "#cfe6ff", w: 1.2 });
    }
    return out;
  }
  /* Strands of fur or hair rising from a curved patch of skin. */
  function strands(k, o) {
    let out = "";
    const n = Math.round(o.n);
    const seed = o.seed || 5;
    const g = Math.max(2, Math.round(o.group || 6));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const bx = o.x + t * o.w;
      const by = o.y - Math.sin(t * Math.PI) * (o.arch || 0);
      const L = Math.max(1, o.len * (1 - (o.jitter || 0) * k.rnd(seed + i * 1.7) * 0.85));
      const ang = k.rad((o.angle || 0) + (k.rnd(seed + i * 3.1) - 0.5) * (o.spread || 10) + (o.bendAt ? o.bendAt(t) : 0));
      const gc = o.x + ((Math.floor(i / g) * g + g / 2) / n) * o.w;
      const pts = [];
      for (let j = 0; j <= 6; j++) {
        const s = j / 6;
        const frz = o.frizz ? o.frizz * (o.frizzWhere ? o.frizzWhere(s) : 1) * (k.rnd(seed + i * 13 + j) - 0.5) * 9 : 0;
        const wav = o.curl ? Math.sin(s * (o.curlFreq || 3) * Math.PI * 2 + i) * o.curl * 5 : 0;
        let px = bx + Math.sin(ang) * L * s + Math.cos(ang) * (wav + frz);
        const py = by - Math.cos(ang) * L * s + Math.sin(ang) * (wav + frz);
        if (o.clump) px += (gc - bx) * o.clump * s * 0.9;
        pts.push(`${r1(px)},${r1(py)}`);
      }
      const c = typeof o.color === "function" ? o.color(i, t) : o.color;
      out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${c}" stroke-width="${o.sw || 1.6}" stroke-linecap="round" stroke-linejoin="round"${o.alpha != null ? ` opacity="${o.alpha}"` : ""}/>`;
    }
    return out;
  }
  /* A cape or a sheet of cloth hanging from (x, y): swing in degrees (0 hangs down, 90 streams out behind). */
  function cape(k, o) {
    const sw = k.rad(o.swing || 0);
    const d = [-Math.sin(sw), Math.cos(sw)];
    const p = [d[1], -d[0]];
    const len = o.len;
    const wid = o.width || 30;
    const C = [o.x + d[0] * len, o.y + d[1] * len];
    const L = [C[0] - (p[0] * wid) / 2, C[1] - (p[1] * wid) / 2];
    const R = [C[0] + (p[0] * wid) / 2, C[1] + (p[1] * wid) / 2];
    const A = [o.x - 7, o.y];
    const B = [o.x + 7, o.y];
    const bil = o.billow || 0;
    const wave = [];
    const waves = o.waves || 1;
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      const amp = (o.amp || 4) * Math.sin(t * waves * Math.PI * 2 + (o.phase || 0));
      wave.push(`${r1(L[0] + (R[0] - L[0]) * t + d[0] * amp)} ${r1(L[1] + (R[1] - L[1]) * t + d[1] * amp)}`);
    }
    const cA = [(A[0] + L[0]) / 2 - p[0] * bil, (A[1] + L[1]) / 2 - p[1] * bil];
    const cB = [(B[0] + R[0]) / 2 + p[0] * bil, (B[1] + R[1]) / 2 + p[1] * bil];
    return `<path d="M${r1(A[0])} ${r1(A[1])} Q${r1(cA[0])} ${r1(cA[1])} ${wave[0]} L${wave.join(" L")} Q${r1(cB[0])} ${r1(cB[1])} ${r1(B[0])} ${r1(B[1])} Z" fill="${o.color || "#b03a48"}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.5}" opacity="${o.alpha == null ? 1 : o.alpha}"/>`;
  }
  /* A screen inside the picture with a person in it (for edit-style effects). */
  const screen = (k, o) => {
    o = o || {};
    const x = o.x == null ? 20 : o.x;
    const y = o.y == null ? 18 : o.y;
    const w = o.w || 200;
    const h = o.h || 112;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill || "#2b3a4f"}" stroke="#666" stroke-width="1.5"/>` + `<rect x="${x}" y="${r1(y + h * 0.72)}" width="${w}" height="${r1(h * 0.28)}" fill="${o.floor || "#3a3127"}"/>`;
  };
  /* An animal's outline with one part lit up: the head, back, tail, belly, legs or the whole body. */
  function critter(k, o) {
    const x = o.x;
    const y = o.y;
    const s = o.s || 1;
    const on = (re) => (re.test(o.part || "") ? "#ffd166" : "#55555f");
    const all = /whole|all over/.test(o.part || "");
    const c = (re) => (all ? "#ffd166" : on(re));
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#2a2a30" stroke="${c(/back/)}" stroke-width="2"/><path d="M-20 6 Q-20 10 -21 10" stroke="${c(/belly/)}" stroke-width="2.5"/><line x1="-16" y1="10" x2="16" y2="10" stroke="${c(/belly/)}" stroke-width="2.5"/><circle cx="26" cy="-8" r="8" fill="#2a2a30" stroke="${c(/head/)}" stroke-width="2"/><path d="M-22 -2 Q-34 -12 -32 -20" fill="none" stroke="${c(/tail/)}" stroke-width="3"/>${[-14, -6, 8, 16].map((lx) => `<line x1="${lx}" y1="10" x2="${lx}" y2="20" stroke="${c(/legs/)}" stroke-width="2.5"/>`).join("")}</g>`;
  }
  /* Beats along a strip, with events that land on, early or late of them. */
  function beatStrip(k, o) {
    const x = o.x;
    const y = o.y;
    const w = o.w;
    let out = `<rect x="${x}" y="${y}" width="${w}" height="16" rx="3" fill="rgba(0,0,0,0.55)" stroke="#444"/>`;
    const nb = o.beats || 8;
    for (let i = 0; i <= nb; i++) out += `<line x1="${r1(x + (i / nb) * w)}" y1="${y + 2}" x2="${r1(x + (i / nb) * w)}" y2="${y + 14}" stroke="${o.gridColor || "#666"}" stroke-width="${o.gridW || 1}"/>`;
    (o.events || []).forEach((e) => {
      const ex = x + k.clamp(e.at, 0, 1) * w;
      out += `<rect x="${r1(ex - (e.w || 2) / 2)}" y="${y + 3}" width="${r1(Math.max(1.5, e.w || 2))}" height="10" rx="1" fill="${e.color || "#ffd166"}"${e.alpha != null ? ` opacity="${e.alpha}"` : ""}/>`;
    });
    if (o.label) out += k.label({ x, y: y - 3, text: o.label, size: 8, color: "#bbb", anchor: "start" });
    return out;
  }
  const r2 = (n) => Math.round(n * 100) / 100;
  /* An effect that is off still shows faintly, so its other settings can be seen before it is turned on. */
  const ghost = (on, svg) => (on ? svg : `<g opacity="0.3">${svg}</g>`);
  const offNote = (k, off, kind) => (off ? k.tint({ color: "#000", alpha: 0.45 }) + `<rect x="60" y="84" width="200" height="22" rx="11" fill="#000" opacity="0.85" stroke="#888"/>` + k.label({ x: 160, y: 99, text: `off · preview of ${kind}`, size: 11, color: "#fff", weight: 700 }) : "");
  const dist = (k, m, near, far) => k.clamp(1.5 - Math.log10(Math.max(0.05, m)) * 0.55, near == null ? 0.4 : near, far == null ? 2.2 : far);
  const POWER = { blue: "#5fb4ff", white: "#f5f5f5", gold: "#ffc94a", red: "#ff4d4d", purple: "#b77bff", green: "#5fe08a", neon: "#39ffb0", rainbow: "#ff7ae0", "the character's color": "#4a6fa5" };
  const ELEMENT = { water: "#4aa3df", smoke: "#9a9aa3", fire: "#ff7a2a", sand: "#d8b26a", snow: "#eef4ff", "the fire": "#ff7a2a", "the smoke": "#9a9aa3", "the water": "#4aa3df", "the sand": "#d8b26a", "the snow": "#eef4ff" };
  /* Every picture goes through tidy(): long decimals (0.30000000000000004) become at most two places. */
  /* The index of a setting on its scale (0, 1, 2...). */
  const LLidx = (v, sid) => {
    const sl = v.slider(sid);
    return sl && Array.isArray(sl.scale) ? Math.max(0, sl.scale.findIndex((o) => String(o) === String(v(sid)))) : 0;
  };
  const tidy = (svg) => String(svg).replace(/-?\d+\.\d{3,}/g, (m) => String(parseFloat(Number(m).toFixed(2))));
  const look = (id, fn) => W.look(id, (v, k) => tidy(fn(v, k)));
  const hasPad = (id) => (((W.get && W.get(id)) || {}).faces || []).some((f) => f.face === "pad");
  const pad = (id, x, y, xLabel, yLabel) => {
    if (W.get && W.get(id) && !hasPad(id)) W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };

  /* ========== physical effects ========== */

  /* Breakage: a thing at its place in the frame, holding, cracking or flying apart. */
  look("breakage", (v, k) => {
    const st = v.p("setting");
    const MAT = { glass: "#9fd8f0", wood: "#a8743f", pottery: "#c9744f", stone: "#8d8d8d", metal: "#b8c0c8" };
    const col = MAT[v("material")] || "#9fd8f0";
    const s = dist(k, v.n("distM"), 0.45, 2);
    const w = 40 * s;
    const h = 52 * s;
    /* Kept far enough from the edges that the flying pieces stay in the frame. */
    const fly = (8 + v.n("flyM") * 7) * s * (st < 1 ? 0.5 : 1);
    const m = Math.min(160, Math.max(Math.max(w, h) * 0.9, w * 0.4 + fly + 6));
    const cx = k.clamp(40 + v.p("across") * 240, m, 320 - m);
    const cy = k.clamp(150 - v.p("up") * 100, Math.min(90, m * 0.7 + 4), Math.max(90, 150 - h / 2));
    const eye = v.p("grabsEye");
    let out = room(k, { floorY: 150 });
    out += k.tint({ color: "#000", alpha: 0.15 + eye * 0.45 });
    if (eye > 0) out += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(w * (0.9 + eye))}" ry="${r1(h * (0.8 + eye * 0.6))}" fill="#fff6d8" opacity="${r1(eye * 0.18 * 100) / 100}"/>`;
    const whole = st < 1 ? `<rect x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(3 * s)}" fill="${col}" stroke="${INK}" stroke-width="2" opacity="${r1(0.55 + eye * 0.45)}"/>` : "";
    out += whole;
    /* Warning: hairline cracks creeping out before the break, or a "creak". */
    const warn = v.p("warning");
    if (warn > 0.9) for (let i = 0; i < 4; i++) out += `<path d="M${r1(cx)} ${r1(cy)} l${r1((k.rnd(i + 40) - 0.5) * w * 0.9)} ${r1((k.rnd(i + 50) - 0.5) * h * 0.9)}" stroke="#fff" stroke-width="0.8" opacity="0.6"/>`;
    else if (warn > 0.4) out += k.text({ x: cx + w / 2 + 14, y: cy - h / 2, text: "creak…", size: 10, color: "#e8d7b0", italic: true });
    /* Cracks. */
    if (st > 0) for (let i = 0; i < 3 + Math.round(st * 5); i++) {
      const a = (i / (3 + st * 5)) * Math.PI * 2;
      out += `<polyline points="${r1(cx)},${r1(cy)} ${r1(cx + Math.cos(a) * w * 0.25)},${r1(cy + Math.sin(a + 0.4) * h * 0.25)} ${r1(cx + Math.cos(a) * w * 0.55)},${r1(cy + Math.sin(a) * h * 0.55)}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
    }
    /* Pieces flying out: how many, how far, speed lines, slowed down. */
    const n = Math.round(v.n("pieces") * (st < 1 ? 0.12 : 0.4));
    const slow = v.p("slowMo");
    const spd = v.p("speed");
    out += k.ring({ x: cx, y: cy, r: w * 0.4 + fly, color: "#ffffff", dash: "2 4", w: 0.8 });
    for (let i = 0; i < n; i++) {
      const a = k.rnd(i + 3) * Math.PI * 2;
      const d = w * 0.4 + fly * (0.4 + k.rnd(i + 9) * 0.6);
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d * 0.7;
      const tl = (4 + spd * 16) * (1 - slow * 0.8) * s;
      out += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px - Math.cos(a) * tl)}" y2="${r1(py - Math.sin(a) * tl * 0.7)}" stroke="#fff" stroke-width="1" opacity="0.45"/>`;
      for (let g = 1; g <= Math.round(slow * 3); g++) out += bits(k, { n: 1, seed: i * 31, x: px - Math.cos(a) * g * 5 * s, y: py - Math.sin(a) * g * 3.5 * s, w: 0, h: 0, r: 3 * s, color: col, shape: "shard", alpha: r1(0.5 / g) });
      out += bits(k, { n: 1, seed: i * 31, x: px, y: py, w: 0, h: 0, r: 3 * s, color: col, shape: "shard", alpha: st === 0 ? 0.3 : 1 });
    }
    out += k.label({ x: 300, y: 172 - 18, text: `speed ${v.n("speed")}/5`, size: 8, color: "#bbb", anchor: "end" });
    out += timeline(k, { x: 8, y: 20, w: 90, max: 10, label: "warning", segs: [{ from: 0, to: v.n("warnSecs"), color: "#e8d7b0" }], marks: [{ at: v.n("warnSecs"), color: "#ff6b6b" }] });
    return out + fitCaption(k, `${v("material")} ${v("setting")} · ${v("slowMo")} · ${v.n("distM")} m away`);
  });

  /* Element: water, smoke, fire, sand or snow, placed near or far, moving, arriving. */
  look("element", (v, k) => {
    const el = String(v("setting"));
    const col = ELEMENT[el] || "#9a9aa3";
    const where = v.p("where");
    const cover = v.p("coverage");
    const much = v.p("howMuch");
    const motion = v.p("motion");
    const speed = v.p("driftSpeed");
    const pull = v.p("pull");
    const size = dist(k, v.n("distM"), 0.5, 2.2);
    let out = room(k);
    out += k.person({ x: 165, y: 150, s: 1.1, color: "#4a6fa5" });
    const n = 6 + Math.round((much * 0.5 + cover * 0.5) * 60);
    const box = where < 0.2 ? { x: 0, y: 20, w: 320, h: 70 } : where < 0.5 ? { x: 0, y: 0, w: 320, h: 180, edge: true } : where < 0.9 ? { x: 110, y: 50, w: 110, h: 100 } : { x: 0, y: 0, w: 320, h: 180 };
    const shape = el === "fire" ? "spark" : el === "snow" ? "dot" : el === "sand" ? "dot" : el === "water" ? "dot" : "dot";
    const r = (el === "smoke" ? 9 : 2.2) * size * (where > 0.9 ? 2.4 : 1);
    const streak = (motion * 20 + speed * 26) * size;
    const alpha = r1((0.35 + pull * 0.6) * (el === "smoke" ? 0.45 : 1));
    if (box.edge) {
      out += bits(k, { n: n / 2, seed: 4, x: 0, y: 0, w: 60, h: 180, r, color: col, alpha, dx: streak, dy: motion > 0.6 ? streak * 0.4 : 0, shape });
      out += bits(k, { n: n / 2, seed: 8, x: 260, y: 0, w: 60, h: 180, r, color: col, alpha, dx: streak, dy: 0, shape });
    } else out += bits(k, Object.assign({ n, seed: 4, r, color: col, alpha, dx: streak, dy: motion > 0.6 ? streak * 0.4 : 0, shape }, box));
    if (motion > 0.5 && motion < 0.9) out += spiral(k, { x: box.x + box.w / 2, y: box.y + box.h / 2, r: 30 * size, turns: 2, color: col, alpha: 0.5 });
    if (pull > 0.9) out += k.ring({ x: box.x + box.w / 2, y: box.y + box.h / 2, r: 50, color: "#ffd166", dash: "4 3", w: 1.5 });
    /* How it arrives: an arrow sweeping in from the side, thicker the faster. */
    const arr = v.p("arrives");
    if (arr > 0) out += k.arrow({ x1: 8, y1: 120, x2: 30 + arr * 60, y2: 120, color: col, w: 1 + arr * 4 });
    out += timeline(k, { x: 214, y: 20, w: 96, max: 30, label: "seconds to arrive", segs: [{ from: 0, to: v.n("arriveSecs"), color: col }] });
    out += chips(k, [`measured from ${v("relTo")}`], { x: 6, y: 5 });
    return out + fitCaption(k, `${el}, ${v("where")}, ${v("motion")} at ${v.n("driftSpeed")} m/s`);
  });

  /* Growth: a size-over-time curve (left) and the thing at its start and end size (right). */
  look("growth", (v, k) => {
    const dir = v.p("setting");
    let a = (v.p("startSize") + v.n("startPct") / 100) / 2;
    let b = (v.p("endSize") + v.n("endPct") / 100) / 2;
    if (dir < 0.4) [a, b] = [Math.max(a, b), Math.min(a, b)];
    else if (dir < 0.6) b = a + (b - a) * 0.15;
    else [a, b] = [Math.min(a, b), Math.max(a, b)];
    const SH = { even: (t) => t, "slow then sudden": (t) => t * t * t, "sudden then slow": (t) => 1 - Math.pow(1 - t, 3), "in surges": (t) => t };
    const sh = SH[v("shape")] || SH.even;
    const reach = k.clamp(v.n("reachSecs") / 120 / (0.4 + v.p("speed") * 0.9), 0.08, 1);
    const surges = v.n("surgesPerMin");
    const tension = v.p("tension");
    const what = String(v("whatGrows"));
    const col = ELEMENT[what] || "#ff7a2a";
    const sizeAt = (t) => {
      const u = Math.min(1, t / reach);
      const step = v.is("shape", /surges/) ? Math.floor(u * 4) / 4 + Math.pow((u * 4) % 1, 4) / 4 : sh(u);
      return k.clamp(a + (b - a) * step, 0, 1);
    };
    /* A night yard with a person for scale; the thing is shown now (solid) with dashed outlines of how big it
       was earlier in the shot, like a time-lapse. Fire and smoke grow up; water, sand and snow rise from the ground. */
    const GY = 148;
    let out = k.bg(k.mix("#141a26", "#2a1414", tension * 0.7)) + `<rect x="0" y="${GY}" width="320" height="${180 - GY}" fill="#2a2620"/>`;
    out += Array.from({ length: 14 }, (_, i) => k.dot({ x: 10 + k.rnd(i + 3) * 300, y: 8 + k.rnd(i + 21) * 50, r: 0.9, color: "#cfd6e6" })).join("");
    const worried = tension * (0.4 + b * 0.6);
    out += k.person({ x: 270, y: GY + 2, s: 1, color: "#4a6fa5", mood: -worried, arms: worried > 0.5 ? 0.6 : 0, lean: worried * -8 });
    const times = [0, 0.33, 0.66, 1];
    const layer = /water|sand|snow/.test(what);
    const shapeOf = (z, ghost) => {
      if (layer) {
        const h = 3 + z * 100;
        const wave = Array.from({ length: 17 }, (_, i) => `L${i * 20} ${r1(GY - h + (/water/.test(what) ? Math.sin(i * 1.3) * 2 : /snow/.test(what) ? -Math.abs(Math.sin(i * 0.7)) * 5 : Math.sin(i * 0.5) * 4))}`).join(" ");
        return ghost ? `<path d="M0 ${r1(GY - h)} ${wave.replace(/^L0/, "L0")}" fill="none" stroke="${col}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.6"/>` : `<path d="M0 180 L0 ${r1(GY - h)} ${wave} L320 ${r1(GY - h)} L320 180 Z" fill="${col}" opacity="${/water/.test(what) ? 0.75 : 0.95}"/>`;
      }
      if (/fire/.test(what)) {
        const h = 6 + z * 130;
        if (ghost) return `<path d="M${r1(110 - h * 0.35)} ${GY} Q${r1(110 - h * 0.35)} ${r1(GY - h * 0.55)} 110 ${r1(GY - h)} Q${r1(110 + h * 0.35)} ${r1(GY - h * 0.55)} ${r1(110 + h * 0.35)} ${GY}" fill="none" stroke="${col}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.6"/>`;
        const n = 1 + Math.round(z * 4);
        return Array.from({ length: n }, (_, i) => flame(k, { x: 110 + (i - (n - 1) / 2) * h * 0.18, y: GY, h: h * (0.75 + k.rnd(i + 4) * 0.3), w: h * 0.4, lean: (k.rnd(i + 8) - 0.5) * 8 })).join("");
      }
      const r = 4 + z * 70;
      return ghost ? k.ring({ x: 110, y: GY - r, r, color: col, dash: "3 3", w: 1.2 }) : [0, 1, 2].map((i) => puff(k, { x: 110 + (i - 1) * r * 0.45, y: GY - r * (0.8 + (i % 2) * 0.3), r: r * 0.7, color: col, alpha: 0.6 })).join("");
    };
    out += times.slice(0, 3).map((t) => shapeOf(sizeAt(t * 0.999), true)).join("") + shapeOf(sizeAt(1), false);
    /* Buried by a rising layer: the person still shows faintly, for scale. */
    if (layer && sizeAt(1) > 0.3) out += k.person({ x: 270, y: GY + 2, s: 1, color: "#4a6fa5", mood: -worried, alpha: 0.35 });
    /* Surges: pulses around the edge, more of them the more surges a minute. */
    const nS = Math.min(8, Math.round(surges / 4));
    const rNow = layer ? 0 : 4 + sizeAt(1) * 70;
    if (!layer) out += Array.from({ length: nS }, (_, i) => k.ring({ x: 110, y: GY - rNow, r: rNow + 6 + i * 4, color: "#ffd166", w: 0.8, dash: "1 3" })).join("");
    else out += Array.from({ length: nS }, (_, i) => `<line x1="${20 + i * 36}" y1="${r1(GY - 6 - sizeAt(1) * 100)}" x2="${20 + i * 36}" y2="${r1(GY - 16 - sizeAt(1) * 100)}" stroke="#ffd166" stroke-width="1.5"/>`).join("");
    if (tension > 0) out += k.tint({ color: "#ff2a2a", alpha: tension * 0.1 });
    /* How long it takes, as a small clock in the corner. */
    out += `<rect x="6" y="6" width="80" height="22" rx="5" fill="#000" opacity="0.6"/>` + k.clock({ x: 18, y: 17, r: 8, p: reach }) + k.label({ x: 30, y: 21, text: `${v.n("reachSecs")} s to full`, size: 8, color: "#ddd", anchor: "start" });
    return out + fitCaption(k, `${what} ${v("setting")}: ${v("startSize")} → ${v("endSize")}, ${v("shape")}`);
  });

  /* Smoke and fire: flames on the ground, a smoke column rising, the glow on the scene. */
  look("smokeFireLens", (v, k) => {
    const heat = v.p("heat");
    const s = dist(k, v.n("distM"), 0.5, 1.6);
    const danger = v.p("danger");
    const sky = k.mix("#1b2433", "#3a1410", danger);
    let out = k.bg(sky) + `<rect x="0" y="140" width="320" height="40" fill="#2a2420"/>`;
    const SMOKE = { "white steam": "#eeeeee", gray: "#8c8c94", black: "#2a2a2a", colored: "#b56be0" };
    const sc = SMOKE[v("smokeColor")] || "#8c8c94";
    const glow = v.p("fireGlow");
    const spread = v.p("spread");
    const fw = (30 + spread * 90) * s;
    out += `<ellipse cx="160" cy="142" rx="${r1(fw + glow * 110)}" ry="${r1(14 + glow * 30)}" fill="#ff8a2a" opacity="${r2((0.05 + glow * 0.3) * (heat > 0 ? 1 : 0.4))}"/>`;
    /* Smoke column: thickness, rise, swirl, fade, linger at the top. */
    const thick = v.p("thick");
    const cover = v.p("coverage");
    const riseH = (40 + v.p("rise") * 60) * (0.6 + cover * 0.6);
    const swirl = v.n("swirl");
    const fade = v.p("fade");
    const n = 8;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const r = (6 + thick * 14 + t * (8 + cover * 20)) * s;
      const x = 160 + Math.sin(t * Math.PI * 2 + 1) * swirl * 5 * t;
      const y = 135 - t * riseH;
      out += puff(k, { x, y, r, color: sc, alpha: (0.7 - t * (0.15 + fade * 0.55)) * (0.5 + thick * 0.5) });
    }
    const hang = v.n("hangSecs") / 300;
    out += `<ellipse cx="${r1(160 + swirl * 5)}" cy="${r1(135 - riseH - 6)}" rx="${r1(10 + hang * 120)}" ry="${r1(6 + hang * 6)}" fill="${sc}" opacity="${r1(0.15 + hang * 0.35 * (1 - fade * 0.6))}"/>`;
    /* Rise speed arrow. */
    out += k.arrow({ x1: 250, y1: 120, x2: 250, y2: 120 - 8 - v.n("riseSpeed") * 7, color: sc, w: 2 });
    /* Flames across the ground. */
    const fh = (4 + v.n("flameM") * 9) * s * (0.2 + heat);
    const nf = 2 + Math.round(spread * 4 + heat * 3);
    if (heat === 0) out += `<rect x="${r1(160 - fw / 2)}" y="136" width="${r1(fw)}" height="6" fill="#3b2a20"/>`;
    for (let i = 0; i < nf; i++) out += flame(k, { x: 160 - fw / 2 + (i + 0.5) * (fw / nf), y: 142, h: fh * (0.7 + k.rnd(i) * 0.5), w: (fw / nf) * 1.3, lean: (k.rnd(i + 2) - 0.5) * swirl * 3, color: heat > 0.9 ? "#ff4a1a" : "#ff8a2a", alpha: heat === 0 ? 0.25 : 0.95 });
    /* Growing or shrinking. */
    const g = v.p("grows");
    out += k.arrow({ x1: 34, y1: 140, x2: 34 + (g - 0.5) * 50 + (g === 0.5 ? 2 : 0), y2: 140 - (g - 0.5) * 30, color: g > 0.5 ? "#ff6b4a" : g < 0.5 ? "#7fb7ff" : "#aaa", w: 2.5 });
    out += `<rect x="6" y="146" width="${r1(String(v("grows")).length * 4.4 + 10)}" height="13" rx="4" fill="#000" opacity="0.6"/>` + k.label({ x: 11, y: 156, text: v("grows"), size: 8, color: "#ddd", anchor: "start" });
    return out + fitCaption(k, `${v("heat")}, ${v("thick")} of ${v("smokeColor")} smoke, ${v("danger")}`);
  });

  /* Side storyline: two lanes, the main story and the side one, with its cutaways and where they meet. */
  look("sideStoryline", (v, k) => {
    const st = v.p("setting");
    const share = v.n("share") / 100;
    const rel = String(v("relation"));
    const REL = { contrasts: "#ff7a5a", echoes: "#7fb7ff", foreshadows: "#c79bff" };
    const rc = REL[rel] || "#ff7a5a";
    /* A tiny shot: the main story is two people in a warm room; the side story is one person somewhere else,
       drawn to contrast (night), echo (same pose, other place) or foreshadow (a storm coming). */
    let nShot = 0;
    const shot = (x, y, w, h, side, both) => {
      const sx = w / 60;
      const head = (hx, c) => `<circle cx="${r1(x + hx * sx)}" cy="${r1(y + h * 0.5)}" r="${r1(Math.max(2, 6 * Math.min(sx, h / 34)))}" fill="#f0c8a0" stroke="${INK}"/><rect x="${r1(x + hx * sx - 5 * Math.min(sx, h / 34))}" y="${r1(y + h * 0.5 + 6 * Math.min(sx, h / 34))}" width="${r1(10 * Math.min(sx, h / 34))}" height="${r1(h * 0.3)}" fill="${c}"/>`;
      const cid = `cw-ss${++nShot}`;
      const clip = `<clipPath id="${cid}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"/></clipPath>`;
      let g;
      if (!side) g = `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="#8a6a4a"/><rect x="${r1(x)}" y="${r1(y + h * 0.78)}" width="${r1(w)}" height="${r1(h * 0.22)}" fill="#5a4030"/>` + head(20, "#4a6fa5") + head(40, "#c0392b");
      else {
        const bg = /contrast/.test(rel) ? "#1c2238" : /foreshadow/.test(rel) ? "#3a2a4a" : "#4a7a5a";
        g = `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${bg}"/>`;
        if (/contrast/.test(rel)) g += `<circle cx="${r1(x + w * 0.8)}" cy="${r1(y + h * 0.22)}" r="${r1(Math.max(1.5, h * 0.1))}" fill="#eef"/>`;
        if (/foreshadow/.test(rel)) g += `<path d="M${r1(x + w * 0.75)} ${r1(y + 2)} l${r1(-w * 0.08)} ${r1(h * 0.3)} l${r1(w * 0.06)} 0 l${r1(-w * 0.08)} ${r1(h * 0.3)}" fill="none" stroke="#ffd166" stroke-width="1.5"/>`;
        if (/echo/.test(rel)) g += `<path d="M${r1(x)} ${r1(y + h * 0.78)} L${r1(x + w)} ${r1(y + h * 0.78)} L${r1(x + w)} ${r1(y + h)} L${r1(x)} ${r1(y + h)} Z" fill="#2f5a3a"/>`;
        g += head(both ? 46 : 30, "#8e5bd0");
        if (both) g += head(14, "#4a6fa5");
      }
      return `<defs>${clip}</defs><g clip-path="url(#${cid})">${g}</g><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="none" stroke="${both ? "#ffd166" : side ? rc : "#000"}" stroke-width="${both ? 2 : 1}"/>`;
    };
    let out = k.bg("#141418");
    /* The film as a strip of shots, left to right: side-story shots cut in among the main story. */
    const X0 = 10;
    const SW = 300;
    const sy = 18;
    const sh = 34;
    out += k.label({ x: X0, y: 12, text: "the film, shot by shot", size: 8, color: "#aaa", anchor: "start" });
    for (let i = 0; i < 6; i++) out += shot(X0 + i * 50, sy, 50, sh, false);
    const lead = v.n("leadSecs");
    const ret = v.p("returns");
    const sides = [];
    if (st >= 0.99) sides.push([X0 + SW * (1 - Math.max(0.3, share)) / 2, SW * Math.max(0.3, share)]);
    else {
      const cuts = Math.max(1, Math.round((v.n("cutsPerMin") / 30) * 6 * (0.4 + ret * 0.8) * (st > 0.5 ? 1.4 : 1)));
      const cw = k.clamp((v.n("clipSecs") / 30) * 40 * (0.4 + share * 1.4), 8, SW / cuts - 4);
      for (let i = 0; i < cuts; i++) sides.push([k.clamp(X0 + ((i + 0.5) / cuts) * SW + lead * 3 - cw / 2, X0, X0 + SW - cw), cw]);
    }
    /* With no side story, faint outlines show where the cutaways would go. */
    sides.forEach(([x, w]) => (out += st > 0 ? shot(x, sy, w, sh, true) : `<rect x="${r1(x)}" y="${sy}" width="${r1(w)}" height="${sh}" fill="none" stroke="${rc}" stroke-dasharray="2 2" opacity="0.6"/>`));
    /* What it keeps time with, marked under the strip. */
    const tie = String(v("tiedTo"));
    for (let i = 0; i < 10; i++) {
      const tx = X0 + 15 + i * 30 + (/words/.test(tie) ? 0 : 0);
      out += /music/.test(tie) ? k.text({ x: tx, y: 64, text: "♪", size: 9, color: "#9fd3ff" }) : /words/.test(tie) ? `<rect x="${tx - 6}" y="58" width="12" height="4" rx="2" fill="#ccc"/>` : i % 3 === 0 ? k.clock({ x: tx, y: 60, r: 4, p: i / 10 }) : "";
    }
    /* Where the two stories meet: one shot with both of them in it. */
    const meets = v.p("meets");
    const mAt = meets > 0.9 ? v.n("meetsAt") / 100 : 0.93;
    if (meets > 0) out += shot(k.clamp(X0 + mAt * SW - 22, X0, X0 + SW - 44), sy - 2, 44, sh + 4, true, true);
    else out += `<line x1="${r1(X0 + (v.n("meetsAt") / 100) * SW)}" y1="${sy}" x2="${r1(X0 + (v.n("meetsAt") / 100) * SW)}" y2="${sy + sh}" stroke="#ffd166" stroke-dasharray="2 3" opacity="0.4"/>`;
    /* The two stories, big, side by side, and how they relate. */
    out += shot(14, 80, 110, 66, false) + k.label({ x: 69, y: 157, text: "main story", size: 8, color: "#ccc" });
    out += `<g opacity="${st === 0 ? 0.3 : 1}">${shot(196, 80, 110, 66, true)}</g>` + k.label({ x: 251, y: 157, text: st === 0 ? "no side story" : "side story", size: 8, color: rc });
    out += k.text({ x: 160, y: 112, text: /contrast/.test(rel) ? "≠" : /echo/.test(rel) ? "=" : "→", size: 20, color: rc, weight: 700 }) + k.label({ x: 160, y: 128, text: rel, size: 8, color: rc });
    out += k.label({ x: 10, y: 76, text: `side shots ${lead > 0 ? "ahead of" : lead < 0 ? "behind" : "with"} the words ${Math.abs(lead)} s`, size: 8, color: "#aaa", anchor: "start" });
    return out + fitCaption(k, `${v("setting")}: ${v.n("share")}% of the time, cuts back ${v("returns")}, ${meets > 0 ? (meets > 0.9 ? `they meet ${v.n("meetsAt")}% through` : "they meet at the end") : "they never meet"}`);
  });

  /* Wind: a person and a tree leaning, wind streaks from the chosen side, and a strength-over-time graph. */
  const windScene = (v, k, o) => {
    const str = v.p(o.str) * (o.mult || 1);
    const dir = String(v("direction"));
    const tilt = v.n("tilt");
    const gust = v.p("gusts");
    const unease = v.p(o.unease || "unease");
    let out = k.bg(k.mix("#2a3a52", "#121418", unease)) + `<rect x="0" y="140" width="320" height="40" fill="#28302a"/>`;
    const sign = /right/.test(dir) ? -1 : 1;
    const side = /left|right/.test(dir);
    const lean = side ? sign * str * 18 : 0;
    /* Tree. */
    out += `<line x1="250" y1="140" x2="${r1(250 + lean * 1.4)}" y2="70" stroke="#5a4030" stroke-width="5"/><ellipse cx="${r1(250 + lean * 2)}" cy="66" rx="${r1(24 + str * 8)}" ry="${r1(20 - str * 4)}" fill="#3f6b3f"/>`;
    out += k.person({ x: 130, y: 150, s: 1.1, lean, arms: side ? -0.2 : 0.2, color: "#4a6fa5", mood: -unease * 0.6 });
    if (o.extra) out += o.extra(str, sign, side, lean);
    const n = 4 + str * 26;
    if (side) out += windLines(k, { n, x: sign > 0 ? -20 : 120, y: 15, w: 220, h: 120, angle: (sign > 0 ? 0 : 180) - tilt * sign, len: 20 + str * 40, wobble: gust * 1.5, alpha: 0.35 + str * 0.5 });
    else if (/toward/.test(dir)) out += radial(k, { x: 160, y: 80, n: Math.round(6 + str * 10), r0: 12, len: 14 + str * 40 });
    else if (/behind/.test(dir)) out += radial(k, { x: 160, y: 80, n: Math.round(6 + str * 10), r0: 12, len: 14 + str * 40, inward: true });
    else out += spiral(k, { x: 160, y: 80, r: 30 + str * 40, turns: 2.5, color: "#cfe6ff", alpha: 0.6 });
    if (tilt) out += k.label({ x: 30, y: 135, text: tilt > 0 ? `${tilt}° upward` : `${-tilt}° downward`, size: 8, color: "#cfe6ff" });
    /* Strength over time: build-up, gusts per minute. */
    /* One minute: the build-up over its seconds, then a gust every so often, each lasting its seconds. */
    const ramp = v.n("rampSecs");
    const bu = v.p("buildUp");
    const gpm = v.n("gustsPerMin");
    const gsec = o.gustSecs ? v.n(o.gustSecs) : 2;
    const f = (t) => {
      const sec = t * 60;
      const r = bu === 0 ? 1 : bu === 1 ? (sec >= ramp ? 1 : 0.05) : Math.min(1, sec / Math.max(0.5, ramp));
      let g = 0;
      if (gpm) {
        const every = 60 / gpm;
        const into = sec % every;
        g = into < Math.max(0.4, gsec) ? 1 : 0;
      }
      return 0.08 + r * (0.2 + str * 0.4) + g * (0.12 + gust * 0.25);
    };
    out += curve(k, { x: 200, y: 108, w: 110, h: 30, f, n: 120, color: "#cfe6ff", label: "one minute of wind" });
    out += `<line x1="${r1(200 + Math.min(1, ramp / 60) * 110)}" y1="106" x2="${r1(200 + Math.min(1, ramp / 60) * 110)}" y2="140" stroke="#ffd166" stroke-dasharray="2 2"/>`;
    return out;
  };
  look("windForce", (v, k) => {
    let out = windScene(v, k, { str: "setting", gustSecs: "gustSecs" });
    out += k.speaker({ x: 20, y: 30, s: 0.9, level: v.p("howl") });
    out += chips(k, [`direction from ${v("relTo")}`], { x: 50, y: 5 });
    return out + fitCaption(k, `wind ${v.n("setting")}/5, ${v("gusts")}, ${v("direction")}, ${v("unease")}`);
  });

  /* Impacts: hits on a strip of beats, each one a burst sized by force, plus the jolt on a face. */
  look("impacts", (v, k) => {
    const n = v.n("setting");
    const force = v.p("force");
    const s = dist(k, v.n("distM"), 0.5, 1.6);
    const shake = v.p("shake");
    const rh = v.p("rhythm");
    let out = k.bg("#141418");
    const gap = v.n("gapSecs");
    const spacing = rh === 0 ? 0.02 : rh < 1 ? 0.05 + gap * 0.012 : 0.1 + gap * 0.01;
    const off = (v.n("offsetFrames") / 12) * 0.05;
    const landsOn = String(v("landsOn"));
    const stars = [];
    for (let i = 0; i < Math.max(1, n); i++) stars.push(0.12 + i * spacing + off);
    /* The scene with the hits, shaken. */
    const dx = shake * 6;
    const g = `<g transform="translate(${r1(dx)} ${r1(-shake * 3)})">`;
    let sc = `<rect x="10" y="10" width="190" height="110" fill="#24242c" stroke="#555"/>`;
    stars.forEach((t, i) => (sc += star(k, { x: 30 + ((t * 160) % 160), y: 60 + (i % 3) * 18 - 18, r: (6 + force * 16) * s, color: k.mix("#ffd166", "#ff5a3c", force), points: 6 + Math.round(force * 4), turn: i, alpha: n ? 1 : 0.3 })));
    if (shake > 0) out += `<g opacity="0.35" transform="translate(${r1(-dx)} ${r1(shake * 3)})">${sc}</g>`;
    out += g + sc + "</g>";
    const HV = { "light tap": 10, thud: 14, crunch: 17, boom: 22 };
    out += k.text({ x: 105, y: 112, text: String(v("heaviness")).toUpperCase() + "!", size: HV[v("heaviness")] || 14, color: "#fff", weight: 800, outline: INK, outlineW: 3 });
    /* The audience, jolted. */
    const jolt = v.p("jolt");
    out += k.face({ x: 262, y: 58, r: 30, mood: -jolt * 0.3, eyes: 0.4 + jolt * 0.6, mouth: jolt, brows: jolt });
    if (jolt > 0.9) out += k.text({ x: 262, y: 22, text: "!", size: 18, color: "#ffd166", weight: 800 });
    /* Loudness. */
    out += k.meter({ x: 215, y: 112, w: 95, p: v.n("loudPct") / 200, label: `${v.n("loudPct")}% loud` });
    /* The beat strip: music beats or cuts, and where the hits land. */
    out += beatStrip(k, { x: 10, y: 136, w: 300, beats: /cut/.test(landsOn) ? 4 : 8, gridColor: /anywhere/.test(landsOn) ? "#333" : /cut/.test(landsOn) ? "#ff6b6b" : "#9fd3ff", gridW: /anywhere/.test(landsOn) ? 1 : 2, events: stars.map((t) => ({ at: t, w: 2 + force * 4 })), label: `lands on ${landsOn}, ${v.n("offsetFrames")} frames` });
    return out + fitCaption(k, `${n} hits, ${v("rhythm")}, ${gap} s apart, ${v.n("distM")} m away`);
  });

  /* Fog or haze: a layer at its height, how thick, what it hides, light beams through it. */
  look("density", (v, k) => {
    const thick = v.p("setting");
    const op = 1 - v.n("opacity") / 100;
    const cover = v.p("coverage");
    const layerY = 140 - (v.p("layer") * 0.5 + v.p("layerM") * 0.5) * 120;
    const vis = v.p("visibleM");
    let out = k.bg("#1f2a36") + `<rect x="0" y="140" width="320" height="40" fill="#2b2a26"/>`;
    /* Far houses fade with how far you can see; the person in front. */
    for (let i = 0; i < 4; i++) out += `<rect x="${20 + i * 75}" y="${95 - i * 4}" width="40" height="${45 + i * 4}" fill="#3e4a58" opacity="${r1(0.15 + vis * 0.85)}"/>`;
    out += k.person({ x: 170, y: 160, s: 1.2, color: "#4a6fa5" });
    const beams = v.p("beams");
    if (beams > 0) for (let i = 0; i < 3; i++) out += k.beam({ x: 40 + i * 30, y: 0, dir: 70, len: 200, spread: beams > 0.9 ? 6 : 26, color: "#fff7d8", alpha: beams > 0.9 ? 0.35 : 0.14 });
    /* The fog band. */
    const bandH = 20 + thick * 70;
    const fw = 80 + cover * 240;
    const clears = v.p("clears");
    const alpha = r1((0.25 + thick * 0.45) * (0.4 + op * 0.6));
    const gapW = clears * 70;
    out += `<rect x="${r1(160 - fw / 2)}" y="${r1(layerY - bandH / 2)}" width="${r1(fw / 2 - gapW / 2)}" height="${r1(bandH)}" rx="16" fill="#d9e1e8" opacity="${alpha}"/><rect x="${r1(160 + gapW / 2)}" y="${r1(layerY - bandH / 2)}" width="${r1(fw / 2 - gapW / 2)}" height="${r1(bandH)}" rx="16" fill="#d9e1e8" opacity="${alpha}"/>`;
    /* What it hides, marked plainly. */
    const hides = v.p("hides");
    if (hides > 0.2 && hides < 0.4) out += `<rect x="0" y="40" width="320" height="100" fill="#d9e1e8" opacity="${r1(alpha * 0.8)}"/>`;
    if (hides > 0.6 && hides < 0.8) out += `<ellipse cx="170" cy="100" rx="22" ry="16" fill="#d9e1e8" opacity="${r1(Math.min(1, alpha + 0.3))}"/>`;
    if (hides > 0.9) out += k.tint({ color: "#d9e1e8", alpha: Math.min(0.85, alpha + 0.2) });
    out += timeline(k, { x: 214, y: 18, w: 96, max: 120, label: `clears: ${v("clears")}`, segs: [{ from: 0, to: v.n("clearSecs"), color: "#d9e1e8" }] });
    return out + fitCaption(k, `${v("setting")} at ${v.n("layerM")} m, see ${v.n("visibleM")} m, hides ${v("hides")}`);
  });

  /* Splash: a crown of liquid at its place, its droplets, and drops on the lens. */
  look("splash", (v, k) => {
    const st = v.p("setting");
    const LQ = { water: "#6fb8e8", mud: "#7a5a3a", paint: "#e85a9a", blood: "#a01818", milk: "#f4f1ea" };
    const col = LQ[v("liquid")] || "#6fb8e8";
    const s = dist(k, v.n("distM"), 0.5, 1.8);
    const gy = 140;
    const ht = (10 + v.p("height") * 50) * (0.3 + st * 0.7) * s;
    const wd = Math.min(130, (8 + v.n("widthM") * 9) * s);
    const cx = k.clamp(40 + v.p("across") * 240, Math.min(160, wd + 30), Math.max(160, 290 - wd));
    let out = room(k, { floorY: gy, bg: "#182028" });
    out += `<ellipse cx="${r1(cx)}" cy="${gy + 3}" rx="${r1(wd)}" ry="${r1(4 * s)}" fill="${col}" opacity="0.7"/>`;
    out += `<path${st > 0 ? "" : ' opacity="0.3"'} d="M${r1(cx - wd * 0.6)} ${gy} Q${r1(cx - wd * 0.7)} ${r1(gy - ht * 0.6)} ${r1(cx - wd * 0.4)} ${r1(gy - ht)} L${r1(cx - wd * 0.2)} ${r1(gy - ht * 0.5)} L${r1(cx)} ${r1(gy - ht * 1.05)} L${r1(cx + wd * 0.2)} ${r1(gy - ht * 0.5)} L${r1(cx + wd * 0.4)} ${r1(gy - ht)} Q${r1(cx + wd * 0.7)} ${r1(gy - ht * 0.6)} ${r1(cx + wd * 0.6)} ${gy} Z" fill="${col}" stroke="${INK}" stroke-width="1"/>`;
    /* Droplets on arcs; time in the air makes the arcs higher; slow motion leaves them frozen with trails. */
    const nd = 2 + Math.round(v.p("droplets") * 18 * (0.3 + st * 0.7));
    const air = v.n("airSecs");
    const slow = v.p("slowMo");
    for (let i = 0; i < nd; i++) {
      const sd = i % 2 ? 1 : -1;
      const t = 0.3 + k.rnd(i) * 0.7;
      const px = cx + sd * (wd * 0.5 + t * (20 + air * 10) * s);
      const py = gy - ht * 0.8 - Math.sin(t * Math.PI) * (6 + air * 14) * s;
      out += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px - sd * (3 + (1 - slow) * 10))}" y2="${r1(py + 2 + (1 - slow) * 8)}" stroke="${col}" stroke-width="1.5" opacity="0.6"/>` + k.dot({ x: px, y: py, r: 2.2 * s, color: col });
    }
    /* Drops on the lens. */
    const lens = v.p("hitsLens");
    const nl = Math.round(lens * 9);
    for (let i = 0; i < nl; i++) out += `<circle cx="${r1(20 + k.rnd(i + 70) * 280)}" cy="${r1(10 + k.rnd(i + 80) * 140)}" r="${r1(6 + k.rnd(i + 90) * (lens > 0.9 ? 22 : 8))}" fill="${col}" opacity="0.32" stroke="#fff" stroke-opacity="0.3"/>`;
    return out + fitCaption(k, `${v("setting")} of ${v("liquid")}, ${v.n("widthM")} m wide, ${v("slowMo")}`);
  });

  /* Fire lights the scene: a face lit from the fire's side, the glow color, flicker and dancing shadows. */
  look("fireLight", (v, k) => {
    const on = v.p("setting");
    const GC = { "candle orange": "#ff9a3c", "warm amber": "#ffb347", "deep red": "#d8382a", "blue gas": "#5fa8ff" };
    const gc = GC[v("glowColor")] || "#ff9a3c";
    const bright = v.p("brightness");
    const flick = v.p("flicker");
    const reach = v.p("reach");
    const share = v.n("sharePct") / 100;
    const around = v.n("around");
    const height = v.n("height");
    const near = 1 - v.p("fireM");
    const fx = 120 + Math.sin(k.rad(around)) * 90;
    const fy = 100 - (height / 90) * 60;
    let out = k.bg(k.mix("#2a2a34", "#0c0c10", share)) + `<rect x="0" y="140" width="240" height="40" fill="#1e1a17"/>`;
    /* Glow: reach and brightness. */
    const glowR = (40 + reach * 140) * (0.5 + near * 0.5);
    out += `<defs><radialGradient id="cw-fireLight-glow"><stop offset="0%" stop-color="${gc}" stop-opacity="${r1((0.2 + bright * 0.6) * (on > 0 ? 1 : 0.15) * 100) / 100}"/><stop offset="100%" stop-color="${gc}" stop-opacity="0"/></radialGradient></defs><circle cx="${r1(fx)}" cy="${r1(fy)}" r="${r1(glowR)}" fill="url(#cw-fireLight-glow)"/>`;
    /* Dancing shadows on the wall behind. */
    const sh = v.p("shadows");
    if (sh > 0) out += `<ellipse cx="${r1(120 - (fx - 120) * 0.8)}" cy="60" rx="${r1(18 + sh * 26)}" ry="${r1(40 + sh * 30)}" fill="#000" opacity="${r1(0.25 + sh * 0.3)}" transform="skewX(${r1(flick * 12)})"/>`;
    /* The face, lit on the fire's side. */
    out += k.face({ x: 120, y: 92, r: 30, mood: 0.1, color: k.mix("#7a6a5a", "#f0c8a0", on * 0.5 + bright * 0.5) });
    const side = Math.sin(k.rad(around)) >= 0 ? 1 : -1;
    out += `<clipPath id="cw-fireLight-face"><circle cx="120" cy="92" r="30"/></clipPath><rect x="${side > 0 ? 120 : 60}" y="${r1(62 + (height < 0 ? 20 : 0))}" width="60" height="60" fill="${gc}" opacity="${r1((0.15 + bright * 0.3) * (on > 0 ? 1 : 0.2))}" clip-path="url(#cw-fireLight-face)"/>`;
    out += k.wave({ x: 10, y: 160, w: 210, h: 22, amp: 0.1 + flick * 0.9, cycles: 3 + flick * 10, noise: flick * 0.5, color: gc });
    out += flame(k, { x: fx, y: fy + 8, h: 8 + near * 22 + bright * 8, w: 8 + near * 10, color: gc, lean: flick * 4 });
    /* The map. */
    out += `<rect x="244" y="12" width="70" height="70" rx="6" fill="#1d1d22" stroke="#444"/>` + k.dot({ x: 279, y: 47, r: 5, color: "#4a6fa5" }) + flame(k, { x: 279 + Math.sin(k.rad(around)) * (8 + v.p("fireM") * 22), y: 52 - Math.cos(k.rad(around)) * (8 + v.p("fireM") * 22), h: 10, w: 6, color: gc });
    out += k.label({ x: 279, y: 94, text: `${Math.abs(around)}° ${around < 0 ? "left" : around > 0 ? "right" : "front"}, ${height ? Math.abs(height) + "° " + (height > 0 ? "up" : "down") : "level"}`, size: 7, color: "#ccc" });
    out += k.meter({ x: 246, y: 112, w: 66, p: share, label: `${v.n("sharePct")}% of light` });
    out += chips(k, [`flares with ${v("surge")}`], { x: 6, y: 5 });
    return out + fitCaption(k, `${v("setting")}: ${v("glowColor")}, reaches ${v("reach")}, ${v.n("fireM")} m away`);
  });

  /* Forces: wind as above, plus weight (things falling), air thickness, a whirlwind, and a calm eye. */
  look("forcesLens", (v, k) => {
    const chaos = v.p("chaos");
    const weight = v.p("weight");
    const drag = v.p("drag");
    const extra = (str, sign, side) => {
      let o = "";
      /* Falling leaves: heavy ones drop straight, floaty ones drift with the wind; thick air slows them. */
      for (let i = 0; i < 5; i++) {
        const x0 = 40 + i * 45;
        const drift = (1 - weight) * 40 * (side ? sign : 0) * (0.5 + str);
        const fall = 30 + weight * 70 - drag * 25;
        o += `<path d="M${x0} 20 Q${r1(x0 + drift * 0.5 + (k.rnd(i) - 0.5) * chaos * 40)} ${r1(20 + fall / 2)} ${r1(x0 + drift)} ${r1(20 + fall)}" fill="none" stroke="#888" stroke-dasharray="2 3"/>` + k.dot({ x: x0 + drift, y: 20 + fall, r: 3 + weight * 3, color: "#c98a3a" });
      }
      if (drag > 0) o += `<rect x="0" y="0" width="320" height="140" fill="#5f8fb0" opacity="${r1(drag * 0.18)}"/>`;
      const wh = v.p("whirl");
      if (wh > 0) o += spiral(k, { x: 60, y: 100, r: 14 + wh * 26, turns: 3, color: "#cfe6ff", squash: 1.6, alpha: 0.7 });
      const eye = v.p("calmEye");
      o += k.ring({ x: 130, y: 110, r: 14 + eye * 10 + v.n("eyeM") * 2, color: "#9fffcf", dash: "4 3", w: eye > 0 ? 1.5 : 0.6 });
      return o;
    };
    let out = windScene(v, k, { str: "wind", unease: "chaos", extra, mult: 0.7 + chaos * 0.3 });
    out += chips(k, [`direction from ${v("relTo")}`], { x: 6, y: 5 });
    return out + fitCaption(k, `wind ${v.n("wind")}/5, ${v("gusts")}, ${v("weight")}, ${v("drag")}`);
  });

  /* Crash: a ball bouncing toward a row of things, sliding, knocking them over, leaving a mess. */
  look("crashLens", (v, k) => {
    const s = dist(k, v.n("distM"), 0.55, 1.4);
    const bnc = v.p("bounce");
    const nb = Math.min(8, v.n("bounces"));
    const slow = v.p("slowMo");
    const tone = v.p("tone");
    let out = room(k, { floorY: 140, bg: "#171a20" });
    /* The bounce path. */
    let x = 20;
    let h = 30 + bnc * 60;
    let path = `M${x} ${r1(140 - h)}`;
    const step = 90 / Math.max(1, nb + 1);
    for (let i = 0; i <= nb; i++) {
      path += ` Q${r1(x + step / 2)} ${r1(140 - h * 1.1)} ${r1(x + step)} 136`;
      x += step;
      h *= 0.35 + bnc * 0.55;
    }
    out += `<path d="${path}" fill="none" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    /* Slide along the floor. */
    const slide = (v.p("slide") * 0.5 + v.p("slideM") * 0.5) * 80;
    out += `<line x1="${r1(x)}" y1="139" x2="${r1(x + slide)}" y2="139" stroke="#9fd3ff" stroke-width="3"/>`;
    for (let g = 1; g <= Math.round(slow * 3); g++) out += k.dot({ x: x + slide - g * 8, y: 130, r: 7 * s, color: "#e05a3a" }).replace("/>", ` opacity="${r1(0.5 / g)}"/>`);
    out += k.dot({ x: x + slide, y: 130, r: 7 * s, color: "#e05a3a" });
    /* Hits per beat. */
    for (let i = 0; i < v.n("hits"); i++) out += star(k, { x: 20 + i * 14, y: 22, r: 5, points: 5 });
    /* Domino chain: how many, knocked over. */
    const chain = Math.min(14, v.n("chainCount")) * (0.4 + v.p("chain") * 0.6);
    const dx0 = x + slide + 12;
    for (let i = 0; i < Math.max(1, Math.round(chain)); i++) out += `<rect x="${r1(dx0 + i * 10)}" y="${r1(140 - 24 * s)}" width="${r1(5 * s)}" height="${r1(24 * s)}" fill="#c9b48a" stroke="${INK}" transform="rotate(${Math.round(55 - i * 3)} ${r1(dx0 + i * 10)} 140)"/>`;
    /* Breaks: cracks on the last one. Mess: bits on the floor. Settle: a wobble mark. */
    const brk = v.p("breaks");
    if (brk > 0) out += star(k, { x: dx0 + chain * 10 + 10, y: 128, r: 6 + brk * 8, color: "#fff", points: 4 + Math.round(brk * 4) });
    out += bits(k, { n: v.p("mess") * 24, seed: 3, x: dx0 - 20, y: 142, w: 140, h: 14, r: 2.2, color: "#c9b48a", shape: "square" });
    const settle = v.n("settle");
    out += k.label({ x: 300, y: 112, text: "~".repeat(1 + settle), size: 14, color: "#9fd3ff", anchor: "end" });
    /* Funny or serious: the onlooker. */
    out += k.face({ x: 285, y: 50, r: 22, mood: tone * 1.2 - 0.4, mouth: tone > 0.9 ? 0.7 : 0, brows: -0.5 + tone });
    if (tone > 0.9) out += star(k, { x: 262, y: 26, r: 6, points: 5, color: "#ffd166" }) + star(k, { x: 308, y: 26, r: 6, points: 5, color: "#ffd166" });
    return out + fitCaption(k, `${v("bounce")}, ${v("slide")}, ${v("chain")}, ${v("mess")}, ${v("slowMo")}`);
  });

  /* Liquid: a cross-section of the water: its level, depth, color, clearness, surface, flow, foam and drips. */
  look("liquidLens", (v, k) => {
    const TH = { water: "#3b8fd0", milk: "#e9e4d8", syrup: "#9a4a1a", honey: "#e0a020", mud: "#6a4a2a" };
    const col = TH[v("thickness")] || "#3b8fd0";
    const lineY = 160 - (v.n("waterline") / 100) * 130;
    const clarity = v.p("clarity");
    const surf = v.p("surface");
    let out = k.bg("#1a2230");
    /* The thing under the water: hidden as it gets murky. */
    out += `<rect x="190" y="140" width="30" height="20" fill="#c9744f" stroke="${INK}"/>`;
    let wv = `M0 ${r1(lineY)}`;
    for (let i = 0; i <= 32; i++) wv += ` L${i * 10} ${r1(lineY + Math.sin(i * (0.8 + surf * 1.2)) * (1 + surf * 7) + (surf > 0.9 ? (k.rnd(i) - 0.5) * 6 : 0))}`;
    out += `<path d="${wv} L320 180 L0 180 Z" fill="${col}" opacity="${r1(0.45 + clarity * 0.55)}"/>`;
    /* Depth ruler. */
    const depth = v.n("depthM");
    out += `<line x1="16" y1="${r1(lineY)}" x2="16" y2="${r1(lineY + 8 + (depth / 10) * 60)}" stroke="#fff" stroke-width="1.5"/>` + k.label({ x: 22, y: Math.min(lineY + 20, 156), text: `${depth} m deep`, size: 8, color: "#fff", anchor: "start" });
    /* Flow arrows under the surface. */
    const cur = v.p("current");
    const fs = v.n("flowSpeed");
    for (let i = 0; i < 1 + Math.round(cur * 3); i++) out += k.arrow({ x1: 60 + i * 50, y1: Math.min(172, lineY + 18 + i * 4), x2: 60 + i * 50 + 6 + fs * 5, y2: Math.min(172, lineY + 18 + i * 4), color: cur > 0 ? "#cfe6ff" : "#667", w: 1.5 });
    /* Rising or falling level. */
    const rr = v.n("riseRate");
    const rp = v.p("rising");
    const ry = (rp - 0.33) * 30 + rr * 0.25;
    out += k.arrow({ x1: 290, y1: lineY - 6, x2: 290, y2: lineY - 6 - ry - (ry === 0 ? 1 : 0), color: ry >= 0 ? "#ffd166" : "#7fb7ff", w: 2.5 });
    /* Foam on top, a splash, and drips from above. */
    const foam = v.p("foam");
    out += bits(k, { n: foam * 40, seed: 2, x: 0, y: lineY - 4, w: 320, h: 6, r: 2.4, color: "#fff", alpha: 0.85 });
    const sp = v.p("splash");
    if (sp > 0) out += `<path d="M140 ${r1(lineY)} L146 ${r1(lineY - 8 - sp * 22)} L152 ${r1(lineY - 4)} L158 ${r1(lineY - 12 - sp * 26)} L164 ${r1(lineY - 4)} L170 ${r1(lineY - 8 - sp * 20)} L176 ${r1(lineY)} Z" fill="${col}"/>`;
    const dr = v.p("drips");
    for (let i = 0; i < Math.round(dr * 8); i++) out += `<line x1="${60 + i * 28}" y1="0" x2="${60 + i * 28}" y2="${r1(10 + dr * 20)}" stroke="${col}" stroke-width="2"/>` + k.dot({ x: 60 + i * 28, y: 14 + dr * 24, r: 2.5, color: col });
    return out + fitCaption(k, `${v("amount")} of ${v("thickness")}, ${v("clarity")}, ${v("surface")}, ${v("current")}`);
  });

  /* ========== editing-style effects on a frame ========== */

  /* Overlay: a second picture over the main one: its size, place, opacity, and when it comes in. */
  look("overlay", (v, k) => {
    const kind = String(v("setting"));
    const size = v.n("size") / 100;
    const op = r1(0.15 + (v.n("opacity") / 100) * 0.85);
    let out = k.bg("#141418") + screen(k, { x: 10, y: 10, w: 210, h: 118 });
    out += k.person({ x: 115, y: 118, s: 1.1, color: "#4a6fa5" });
    const pos = String(v("position"));
    const ax = v.n("across") / 100;
    const uy = v.n("up") / 100;
    let ow = 210 * size;
    let oh = 118 * size;
    let ox;
    let oy;
    if (/split/.test(kind)) {
      ow = 105;
      oh = 118;
      ox = /left/.test(pos) ? 10 : 115;
      oy = 10;
    } else if (/full/.test(kind)) {
      ow = 210;
      oh = 118;
      ox = 10;
      oy = 10;
    } else {
      const bx = /left/.test(pos) ? 0.15 : /right/.test(pos) ? 0.85 : /corner/.test(pos) ? 0.9 : 0.5;
      const by = /corner/.test(pos) ? 0.15 : 0.5;
      ox = 10 + ((bx * 0.4 + ax * 0.6) * (210 - ow));
      oy = 10 + (((1 - by) * 0.4 + (1 - uy) * 0.6) * (118 - oh));
    }
    {
      const ci = String(v("comesIn"));
      const was = out.length;
      if (/slides/.test(ci)) out += k.arrow({ x1: ox - 30, y1: oy + oh / 2, x2: ox - 4, y2: oy + oh / 2, w: 2 });
      if (/grows/.test(ci)) out += `<rect x="${r1(ox + ow * 0.3)}" y="${r1(oy + oh * 0.3)}" width="${r1(ow * 0.4)}" height="${r1(oh * 0.4)}" fill="none" stroke="#ffd166" stroke-dasharray="3 2"/>`;
      out += `<rect x="${r1(ox)}" y="${r1(oy)}" width="${r1(ow)}" height="${r1(oh)}" fill="#c98a3a" opacity="${/fades/.test(ci) ? r1(op * 0.6) : op}" stroke="#ffd166" stroke-width="2"/>`;
      out += k.label({ x: ox + ow / 2, y: oy + oh / 2 + 4, text: /cutaway/.test(kind) ? "cutaway" : /none/.test(kind) ? "off" : "overlay", size: 10, color: "#fff" });
      if (/none/.test(kind)) out = out.slice(0, was) + ghost(false, out.slice(was));
    }
    /* When: lead or lag the words, how long to come in, how long it stays. */
    const lead = v.n("leadSecs");
    const stay = [0.6, 4, 12][Math.round(v.p("stays") * 2)];
    const start = 5 + lead;
    out += timeline(k, { x: 230, y: 30, w: 82, max: 20, label: "words at 5 s", segs: [{ from: start, to: start + v.n("inSecs") * 2, color: "#7fb7ff" }, { from: start + v.n("inSecs") * 2, to: start + stay, color: "#c98a3a" }], marks: [{ at: 5, color: "#fff" }] });
    out += k.label({ x: 230, y: 56, text: `${lead < 0 ? Math.abs(lead) + " s early" : lead > 0 ? lead + " s late" : "on the words"}`, size: 8, color: "#ccc", anchor: "start" });
    out += k.label({ x: 230, y: 70, text: `${v("comesIn")} ${v.n("inSecs")} s`, size: 8, color: "#ccc", anchor: "start" });
    out += k.label({ x: 230, y: 84, text: `stays ${v("stays")}`, size: 8, color: "#ccc", anchor: "start" });
    return out + fitCaption(k, `${kind}, ${v.n("size")}% at ${pos}, ${v.n("opacity")}% solid`);
  });

  /* Superpower: a glowing power on a character, its kind and color, its reach, and how it comes and goes. */
  const powerGlyph = (k, kind, x, y, o) => {
    const c = o.c;
    const L = o.reach;
    const a = o.alpha;
    const hy = y - 72 * o.s;
    if (/eyes/.test(kind)) {
      const col = /flame/.test(kind) ? "#ff7a2a" : c;
      if (/laser/.test(kind)) return `<line x1="${x + 3}" y1="${r1(hy)}" x2="${r1(x + 3 + L)}" y2="${r1(hy + 10)}" stroke="${col}" stroke-width="${r1(1 + a * 3)}" opacity="${a}"/>`;
      if (/electric/.test(kind)) return `<polyline points="${x + 3},${r1(hy)} ${r1(x + L * 0.3)},${r1(hy - 6)} ${r1(x + L * 0.5)},${r1(hy + 4)} ${r1(x + L * 0.8)},${r1(hy - 4)}" fill="none" stroke="${col}" stroke-width="2" opacity="${a}"/>`;
      return flame(k, { x: x + 3, y: hy + 2, h: 6 + L * 0.3, w: 6, color: col, alpha: a, lean: L * 0.1 });
    }
    if (/lightning/.test(kind)) return `<polyline points="${x},${r1(hy - 10)} ${x - 10},${r1(hy - 10 - L * 0.4)} ${x + 4},${r1(hy - 10 - L * 0.6)} ${x - 6},${r1(hy - 10 - L)}" fill="none" stroke="${c}" stroke-width="3" opacity="${a}"/>`;
    if (/trails|streaks/.test(kind)) return windLines(k, { n: 6, x: x - 12 - L, y: y - 70 * o.s, w: L, h: 60 * o.s, angle: 0, len: L * 0.8, color: c, alpha: a, sw: 2.5 });
    if (/horns/.test(kind)) return flame(k, { x: x - 6, y: hy - 6, h: 8 + L * 0.3, w: 6, color: c, alpha: a, lean: -4 }) + flame(k, { x: x + 6, y: hy - 6, h: 8 + L * 0.3, w: 6, color: c, alpha: a, lean: 4 });
    if (/tiger/.test(kind)) return `<path d="M${x + 14} ${r1(hy)} q${r1(L * 0.3)} -20 ${r1(L * 0.6)} 0 q-10 20 ${r1(-L * 0.6)} 14 z" fill="${c}" opacity="${r1(a * 0.7)}"/>`;
    if (/scan/.test(kind)) return `<rect x="${x - 14}" y="${r1(y - 90 * o.s)}" width="28" height="${r1(92 * o.s)}" fill="none" stroke="${c}" stroke-width="2" opacity="${a}"/><line x1="${x - 18}" y1="${r1(y - 40 * o.s)}" x2="${x + 18 + L * 0.2}" y2="${r1(y - 40 * o.s)}" stroke="${c}" stroke-width="2" opacity="${a}"/>`;
    if (/glitch/.test(kind)) return `<rect x="${x - 10}" y="${r1(hy - 6)}" width="${r1(20 + L * 0.2)}" height="5" fill="${c}" opacity="${a}"/><rect x="${x - 4}" y="${r1(hy + 2)}" width="${r1(16 + L * 0.2)}" height="4" fill="#ff4d4d" opacity="${a}"/>`;
    if (/galaxy/.test(kind)) return bits(k, { n: 10 + L * 0.4, seed: 4, x: x - 20 - L * 0.3, y: y - 100 * o.s, w: 40 + L * 0.6, h: 100 * o.s, r: 1.5, color: [c, "#fff"], alpha: a, shape: "spark" });
    return "";
  };
  look("superpowerEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "laser eyes" : raw;
    const c = POWER[v("powerColor")] || "#5fb4ff";
    const inten = v.n("intensity") / 100;
    const reach = 10 + (v.n("reachM") / 50) * 120;
    const bright = v.n("brightPct") / 300;
    const who = v.p("who");
    let out = room(k, { floorY: 120, bg: k.mix("#15161b", "#2b2f45", bright * 0.5) });
    const people = who === 0 ? [[70, 1]] : who < 1 ? [[70, 0], [140, 1]] : [[70, 1], [140, 1]];
    people.forEach(([x, on], i) => {
      out += k.person({ x, y: 125, s: 1, color: i ? "#7a5a8a" : "#4a6fa5" });
      if (!on || /none/.test(kind)) return;
      if (bright > 0) out += `<circle cx="${x}" cy="75" r="${r1(20 + bright * 30)}" fill="${c}" opacity="${r1(bright * 0.25)}"/>`;
      const after = v.p("afterglow");
      if (after > 0) out += `<g opacity="${r1(after * 0.4)}" transform="translate(${r1(-8 - after * 10)} 0)">${powerGlyph(k, kind, x, 125, { c, reach, alpha: 0.6, s: 1 })}</g>`;
      out += powerGlyph(k, kind, x, 125, { c, reach, alpha: r1(0.25 + inten * 0.75), s: 1 });
    });
    /* How it comes and goes, and how often. */
    const sh = v.p("shape");
    out += envelope(k, { x: 214, y: 22, w: 96, h: 50, rise: sh === 0.5 ? 0.05 : v.n("buildSecs") / 3, hold: v.n("holdSecs") / 6, fall: 0.6, snap: sh, peak: 0.3 + inten * 0.6, color: c, label: "comes and goes" });
    const fpm = v.n("firesPerMin");
    out += beatStrip(k, { x: 214, y: 92, w: 96, beats: 4, events: Array.from({ length: Math.min(30, fpm) }, (_, i) => ({ at: (i + 0.5) / Math.min(30, Math.max(1, fpm)), color: c, w: 1.5 })), label: `${fpm} a minute` });
    out += chips(k, [`fires ${v("trigger")}`, `on ${v("who")}`], { x: 6, y: 5, maxX: 210 });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v("powerColor")}, ${v.n("intensity")}%, reaches ${v.n("reachM")} m`);
  });

  /* Hallucination: patterns swelling around a person, or seen through their eyes. */
  look("hallucinationEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "vortex rings" : raw;
    const inten = v.n("intensity") / 100;
    const cov = v.n("coverage") / 100;
    const cyc = v.n("cyclesPerSec");
    const sway = v.p("sway");
    const pov = v.p("pov");
    const col = /fire/.test(kind) ? "#ff7a2a" : /electric/.test(kind) ? "#5fb4ff" : /molten/.test(kind) ? "#ff9a3c" : /stellar|infinite/.test(kind) ? "#ffe9a8" : "#c79bff";
    let out = k.bg(k.mix("#15161b", "#2a1838", inten));
    const cx = 105;
    const cy = 90;
    const R = 20 + cov * 90;
    const rot = Math.round(sway * 60 + cyc * 10);
    let pat = "";
    if (!/none/.test(kind)) {
      const rings = 2 + Math.round(cyc * 2);
      for (let i = 1; i <= rings; i++) pat += /rings|absorption|travel/.test(kind) ? k.ring({ x: cx, y: cy, r: (R * i) / rings, color: col, w: 1 + inten * 2 }) : /burst|wisps|current/.test(kind) ? radial(k, { x: cx, y: cy, n: 6 + i, r0: (R * (i - 1)) / rings, len: R / rings, color: col }) : spiral(k, { x: cx, y: cy, r: (R * i) / rings, turns: 1, start: i, color: col, w: 1 + inten * 2 });
      pat = `<g opacity="${r1(0.2 + inten * 0.8)}" transform="rotate(${rot} ${cx} ${cy})${sway > 0.9 ? ` skewX(${r1(sway * 10)})` : ""}">${pat}</g>`;
    }
    /* Whose head we're in: outside watching, half, or through their eyes (an eye-shaped frame). */
    if (pov < 0.4) out += pat + k.person({ x: cx, y: 160, s: 1.2, color: "#4a6fa5", mood: -0.3 });
    else if (pov < 0.9) out += k.person({ x: cx - 40, y: 160, s: 1.2, color: "#4a6fa5", mood: -0.3 }) + pat;
    else out += `<clipPath id="cw-hallucinationEffect-eye"><ellipse cx="${cx}" cy="${cy}" rx="95" ry="55"/></clipPath><g clip-path="url(#cw-hallucinationEffect-eye)"><rect x="0" y="0" width="210" height="180" fill="#2b3a4f"/>${pat}</g><ellipse cx="${cx}" cy="${cy}" rx="95" ry="55" fill="none" stroke="#f0c8a0" stroke-width="4"/>`;
    /* Onset, length and end over time. */
    const onset = v.p("onset");
    const end = v.p("ending");
    out += envelope(k, { x: 214, y: 30, w: 96, h: 56, rise: v.n("onsetSecs") / 2 + (1 - onset) * 0.5, hold: v.n("length"), fall: 0.05 + (v.n("endSecs") / 2) * (end === 0 ? 0.3 : 1), linger: end > 0.9 ? 1 : 0, snap: onset, wobble: sway, peak: 0.3 + inten * 0.6, color: col, label: "takes hold, wears off" });
    out += k.label({ x: 214, y: 124, text: `${v("onset")}, ${v("ending")}`, size: 8, color: "#ccc", anchor: "start" });
    out += k.label({ x: 214, y: 136, text: `${v("sway")}, ${cyc}/s`, size: 8, color: "#ccc", anchor: "start" });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v.n("intensity")}%, ${v("pov")}, ${v.n("length")} s`);
  });

  /* Glitch: the picture sliced and shifted, with colour split, and when the glitches land. */
  look("glitchEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "split colors" : raw;
    const inten = v.n("intensity") / 100;
    const shift = (v.n("shiftPct") / 10) * 40;
    const cov = v.n("coverage") / 100;
    const FEEL = { playful: ["#ff4de1", "#4dffea"], edgy: ["#ff3030", "#30a0ff"], creepy: ["#5aff5a", "#9a2a2a"] };
    const [ca, cb] = FEEL[v("feel")] || FEEL.edgy;
    let out = k.bg("#141418") + screen(k, { x: 10, y: 10, w: 200, h: 120 });
    out += k.person({ x: 110, y: 122, s: 1.2, color: "#4a6fa5" });
    if (!/none/.test(kind)) {
      const bw = /black and white/.test(kind);
      const slices = 1 + Math.round(cov * 7);
      for (let i = 0; i < slices; i++) {
        const y = 14 + k.rnd(i + 2) * 106;
        const h = 3 + k.rnd(i + 5) * 10;
        const dx = (k.rnd(i + 8) - 0.5) * 2 * shift;
        out += `<rect x="${r1(10 + dx)}" y="${r1(y)}" width="200" height="${r1(h)}" fill="${bw ? "#ddd" : i % 2 ? ca : cb}" opacity="${r1(0.15 + inten * 0.6)}"/>`;
      }
      out += `<g opacity="${r1(inten * 0.6)}">${k.person({ x: 110 - 2 - shift * 0.3, y: 122, s: 1.2, color: ca, alpha: 0.5 })}${k.person({ x: 110 + 2 + shift * 0.3, y: 122, s: 1.2, color: cb, alpha: 0.5 })}</g>`;
      if (/digits/.test(kind)) out += k.text({ x: 110, y: 50, text: "0101 1011", size: 12, color: ca, font: "monospace" });
    }
    /* Glitches per minute along a strip, each as long as a burst, getting worse; lined up with the beat or cut. */
    const gpm = Math.min(40, v.n("glitchesPerMin"));
    const often = v.p("often");
    const n = Math.max(1, Math.round(gpm * (0.15 + often * 0.85)));
    const late = (v.n("offsetFrames") / 12) * 0.04;
    const wor = v.p("worsens");
    out += beatStrip(k, { x: 10, y: 148, w: 300, beats: 8, gridColor: /beat|cut/.test(String(v("landsOn"))) ? "#9fd3ff" : "#333", events: Array.from({ length: n }, (_, i) => ({ at: (Math.round(((i + 0.5) / n) * 8) / 8) + late, w: 1 + v.n("burst") * 3, alpha: r1(0.4 + (i / n) * wor * 0.6), color: ca })), label: `lands on ${v("landsOn")}, ${v.n("offsetFrames")} frames` });
    out += k.label({ x: 216, y: 24, text: `${v("feel")}`, size: 10, color: ca, anchor: "start", weight: 700 });
    out += k.label({ x: 216, y: 38, text: `${v("often")}`, size: 8, color: "#ccc", anchor: "start" });
    out += k.label({ x: 216, y: 50, text: `worse: ${v("worsens")}`, size: 8, color: "#ccc", anchor: "start" });
    out += k.label({ x: 216, y: 62, text: `jumps ${v.n("shiftPct")}%`, size: 8, color: "#ccc", anchor: "start" });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v.n("intensity")}%, ${v.n("coverage")}% of the frame`);
  });

  /* Turbulence: a field of swirls, chaotic and sized, wildest in one place, with gusts and a hush over time. */
  look("turbulence", (v, k) => {
    const chaos = v.p("setting");
    const sc = v.p("scale");
    const wild = String(v("wildest"));
    let out = k.bg("#16202a");
    out += k.person({ x: 160, y: 130, s: 1, color: "#4a6fa5" });
    for (let gx = 0; gx < 7; gx++)
      for (let gy = 0; gy < 3; gy++) {
        const x = 25 + gx * 45;
        const y = 25 + gy * 35;
        const dEdge = Math.min(gx, 6 - gx, gy, 2 - gy) / 2;
        const dHero = Math.hypot(x - 160, y - 95) / 160;
        const w = /edges/.test(wild) ? 1 - dEdge : /behind/.test(wild) ? (gy === 0 ? 1 : 0.3) : /hero/.test(wild) ? 1 - dHero : 1;
        const jit = chaos * w;
        out += spiral(k, { x: x + (k.rnd(gx * 3 + gy) - 0.5) * jit * 20, y: y + (k.rnd(gx + gy * 7) - 0.5) * jit * 14, r: 5 + sc * 13 * (0.4 + w * 0.6), turns: 0.6 + jit * 2, dir: (gx + gy) % 2 ? 1 : -1, start: gx + gy, color: "#cfe6ff", alpha: r1(0.2 + jit * 0.7), w: 1.5 });
      }
    /* Gusts and the hush before. */
    const gpm = v.n("gustsPerMin");
    const gp = v.n("gustPct") / 300;
    const hush = v.p("hush");
    const hs = (0.03 + (v.n("hushSecs") / 30) * 0.3) * (0.4 + hush);
    const f = (t) => {
      if (t > 0.35 && t < 0.35 + hs) return (0.2 + chaos * 0.35) * (0.7 - hush * 0.6);
      const g = gpm ? Math.max(0, Math.sin(t * (2 + gpm * 0.8))) : 0;
      return 0.2 + chaos * 0.35 + g * gp * 0.45;
    };
    out += curve(k, { x: 12, y: 132, w: 190, h: 26, f, color: "#cfe6ff", label: "strength over time" });
    out += chips(k, [`gusts on ${v("gustsOn")}`], { x: 214, y: 134 });
    return out + fitCaption(k, `chaos ${v.n("setting")}/5, swirls ${v.n("scale")}/5, wildest ${wild}`);
  });

  /* Cloth: a cape on a person, swinging, fluttering, trailing, settling. */
  const clothPic = (v, k, o) => {
    const swing = v.n("swingDeg") * 0.5 * (o.react == null ? 1 : 0.5 + o.react);
    const flut = v.n("flutterPerSec");
    const lag = v.n("lagSecs");
    const bil = v.p("billow");
    const weight = o.weight;
    let out = k.bg("#1a1d26") + `<rect x="0" y="140" width="320" height="40" fill="#26231f"/>`;
    if (o.wind) out += windLines(k, { n: 10, x: 230, y: 30, w: 80, h: 90, angle: 180, len: 30, alpha: 0.5 });
    if (o.body) out += k.arrow({ x1: 120, y1: 160, x2: 200, y2: 160, color: "#ffd166", w: 2.5 });
    const cy = 82;
    const cx = 160;
    if (lag > 0) out += cape(k, { x: cx - lag * 25, y: cy, len: o.len, swing: swing * 0.6, width: 34 + bil * 26, waves: 0.5 + flut / 4, amp: o.amp, billow: bil * 18, color: o.color, alpha: 0.3, stroke: "none" });
    out += cape(k, { x: cx, y: cy, len: o.len, swing, width: 34 + bil * 26, waves: 0.5 + flut / 4, amp: o.amp, billow: bil * 18 + (o.extraBillow || 0), color: o.color, sw: 1 + weight * 2 });
    out += k.person({ x: cx, y: 150, s: 1.3, color: "#3a3a44", lean: o.body ? 8 : 0, walk: o.body ? 0.6 : 0 });
    return out;
  };
  look("clothResponse", (v, k) => {
    const st = v.p("setting");
    const w = v.p("weight");
    const much = v.p("howMuch");
    const mb = String(v("movedBy"));
    const trails = v.p("trails");
    let out = clothPic(v, k, { react: st, weight: w, len: 50 + w * 18 + trails * 10, amp: (1 + st * 4 + much * 6) * (1.2 - w * 0.6), color: k.mix("#d86a7a", "#5a1a2a", w), wind: /wind|both/.test(mb), body: /body|both/.test(mb), extraBillow: trails * 12 });
    const ss = v.n("settleSecs");
    out += curve(k, { x: 222, y: 20, w: 88, h: 34, f: (t) => 0.5 + 0.45 * Math.exp((-t * 8) / (0.3 + ss)) * Math.cos(t * 30), color: "#ffd166", label: `settles ${ss} s` });
    return out + fitCaption(k, `${v("setting")}, weight ${v.n("weight")}/5, ${v("trails")}, billows ${v("billow")}`);
  });

  /* Settle: an object's height after a hit: bounces, then wobble, a last move, and the pause before the next beat. */
  look("settleTime", (v, k) => {
    const st = v.n("setting");
    const bnc = v.p("bounce");
    const bc = Math.min(8, v.n("bounceCount") || (bnc > 0 ? 1 : 0));
    const wob = v.p("wobble");
    const wd = v.n("wobbleDeg");
    const wps = v.n("wobblePerSec");
    const hold = v.p("hold");
    const last = LLidx(v, "lastMove");
    /* A table in a room. A vase is dropped from the top left; its path is drawn as a dotted trail: each bounce
       a smaller hop to the right, then it rocks (ghost tilts), maybe tips or falls, while a person waits for the
       next beat. The longer it takes to settle, the further along the table it lands. */
    const TY = 120;
    let out = k.bg("#1b1a22") + `<rect x="0" y="140" width="320" height="40" fill="#2a2520"/>`;
    out += `<rect x="10" y="${TY}" width="226" height="8" fill="#7a5a3a" stroke="${INK}" stroke-width="1.5"/><rect x="18" y="${TY + 8}" width="8" height="32" fill="#5a4028"/><rect x="220" y="${TY + 8}" width="8" height="32" fill="#5a4028"/>`;
    const endX = 70 + st * 30 + bc * 4;
    const hop = (endX - 40) / Math.max(1, bc + 1);
    let x = 40;
    let path = `M30 14 Q34 ${TY - 40} 40 ${TY - 10}`;
    for (let i = 0; i < bc; i++) {
      const h = 80 * Math.pow(0.3 + bnc * 0.45, i + 1);
      path += ` Q${r1(x + hop / 2)} ${r1(TY - 10 - h * 2)} ${r1(x + hop)} ${TY - 10}`;
      x += hop;
    }
    path += ` L${r1(endX)} ${TY - 10}`;
    out += `<path d="${path}" fill="none" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.8"/>`;
    if (!bc) out += [-1, 1].map((sd) => `<line x1="${40 + sd * 8}" y1="${TY - 4}" x2="${40 + sd * 16}" y2="${TY - 12}" stroke="#ffd166" stroke-width="1.5"/>`).join("");
    const vase = (cx, ang, al, fy) => `<g transform="rotate(${r1(ang)} ${r1(cx)} ${fy})" opacity="${al}"><path d="M${r1(cx - 8)} ${fy} L${r1(cx - 11)} ${fy - 22} Q${r1(cx)} ${fy - 34} ${r1(cx + 11)} ${fy - 22} L${r1(cx + 8)} ${fy} Z" fill="#c9744f" stroke="${INK}" stroke-width="1.5"/></g>`;
    /* Rocking: ghost tilts either side, more of them the faster it wobbles. */
    const amp = wd * (0.3 + wob * 0.7);
    const nG = wob > 0 || wd > 0 ? 1 + Math.min(4, Math.round(wps / 5)) : 0;
    for (let i = nG; i >= 1; i--) out += vase(endX, amp * (i / nG), 0.25, TY) + vase(endX, -amp * (i / nG) * 0.8, 0.25, TY);
    if (last === 2) out += vase(endX, 0, 0.25, TY) + k.arrow({ x1: endX + 14, y1: TY - 10, x2: 244, y2: 146, color: "#ff6b6b" }) + vase(256, 90, 1, 156);
    else out += vase(endX, last === 1 ? 24 : 0, 1, TY) + (last === 1 ? k.arrow({ x1: endX + 4, y1: TY - 40, x2: endX + 18, y2: TY - 36, color: "#ffd166" }) : "");
    /* The next beat: a person who waits a breath, or a long hold, before moving on. */
    const pause = ["", "…", "……"][LLidx(v, "hold")];
    out += k.person({ x: 286, y: 158, s: 0.95, color: "#4a6fa5", arms: hold < 0.25 ? 0.7 : 0, walk: hold < 0.25 ? 0.6 : 0, look: -1 });
    out += k.bubble({ x: 286, y: 40, text: pause ? `wait ${pause}` : "go!", w: 56, h: 20, size: 9, tail: 0 });
    return out + fitCaption(k, `settles in ${st}/4, ${v.n("bounceCount")} bounces, ${v("wobble")} ${wd}° at ${wps}/s`);
  });

  /* Gravity: a jump's arc, a falling ball's path, and the pull arrow. */
  look("gravityFeel", (v, k) => {
    const g = v.n("scale");
    const w = v.p("setting");
    const jumps = v.p("jumps");
    const falls = v.p("falls");
    const ap = String(v("appliesTo"));
    const pp = /everything|people|one/.test(ap);
    const op = /everything|objects/.test(ap);
    const eff = (on) => (on ? g * (0.6 + w * 0.8) : 1);
    let out = room(k, { floorY: 150, bg: "#141826" });
    const jh = k.clamp((20 + jumps * 70) / eff(pp), 8, 120);
    out += `<path d="M40 150 Q90 ${r1(150 - jh * 2)} 140 150" fill="none" stroke="#9fd3ff" stroke-dasharray="3 3"/>`;
    out += k.person({ x: 90, y: 150 - jh, s: 0.8, arms: 0.8, color: /one/.test(ap) ? "#c98a3a" : "#4a6fa5", alpha: pp ? 1 : 0.6 });
    /* The falling ball: drift, float then drop, or a stone. */
    const fy = (y) => 20 + y;
    const fallEnd = k.clamp(40 + eff(op) * 40, 40, 128);
    out += falls === 0 ? `<path d="M200 ${fy(0)} Q230 ${fy(fallEnd * 0.4)} 210 ${fy(fallEnd * 0.6)}" fill="none" stroke="#ffd166" stroke-dasharray="2 3"/>` : falls < 1 ? `<path d="M200 ${fy(0)} L205 ${fy(fallEnd * 0.3)} L205 ${fy(fallEnd)}" fill="none" stroke="#ffd166" stroke-dasharray="2 3"/>` : `<line x1="200" y1="${fy(0)}" x2="200" y2="${fy(fallEnd)}" stroke="#ffd166" stroke-dasharray="2 3"/>`;
    out += k.dot({ x: 200 + (falls === 0 ? 10 : falls < 1 ? 5 : 0), y: fy(fallEnd), r: 6, color: op ? "#e05a3a" : "#7a5a5a" });
    /* The pull arrow; shifting gravity tilts it. */
    const sh = v.p("shifts");
    const ang = sh * 30;
    const L = 15 + g * 20;
    out += k.arrow({ x1: 280, y1: 40, x2: 280 + Math.sin(k.rad(ang)) * L, y2: 40 + Math.cos(k.rad(ang)) * L, color: "#ff9a3c", w: 3 }) + k.label({ x: 280, y: 30, text: `${g}× gravity`, size: 9, color: "#ff9a3c" });
    out += timeline(k, { x: 236, y: 130, w: 76, max: 30, label: `shifts ${v("shifts")}`, segs: [{ from: 0, to: v.n("shiftSecs"), color: "#ff9a3c" }] });
    return out + fitCaption(k, `${v("setting")}: ${v("jumps")}, things ${v("falls")}, on ${ap}`);
  });

  /* ========== fur and hair ========== */
  const HAIR = { light: "#d9b878", medium: "#8a5a32", dark: "#2e2018" };
  const furPatch = (k, o) => `<path d="M10 ${o.y} Q160 ${o.y - 40} 310 ${o.y} L310 180 L10 180 Z" fill="#6a5040"/>` + strands(k, Object.assign({ x: 14, y: o.y, w: 292, arch: 40 }, o));

  look("furLength", (v, k) => {
    const len = (v.p("setting") * 0.4 + (v.n("cm") / 50) * 0.6) * 90 + 6;
    const dens = v.p("density");
    const even = v.p("evenness");
    const fluff = v.p("fluff");
    const gr = v.n("growRate");
    let out = k.bg("#1b1d22");
    if (gr) out += furPatch(k, { y: 150, n: 14 + dens * 40, len: Math.max(2, len + gr * 4), jitter: even, spread: 10 + fluff * 50, color: "#c9a06a", alpha: 0.25, seed: 5 });
    out += furPatch(k, { y: 150, n: 14 + dens * 40, len, jitter: even * 0.9, spread: 10 + fluff * 50, angle: 10 - fluff * 10, color: "#c9a06a", sw: 1.5 + dens * 0.8, seed: 5 });
    const gw = v.p("grows");
    out += k.arrow({ x1: 290, y1: 70, x2: 290, y2: 70 - (gw - 0.33) * 45 - (gw === 0.33 ? 0 : 0), color: gw > 0.4 ? "#9fffcf" : gw < 0.3 ? "#ff6b6b" : "#888", w: 2.5 }) + k.label({ x: 290, y: 84, text: v("grows"), size: 8, color: "#ccc" });
    out += critter(k, { x: 40, y: 30, s: 0.8, part: v("whereOn") });
    return out + fitCaption(k, `${v("setting")}, ${v.n("cm")} cm on ${v("whereOn")}, ${v("evenness")}, ${v("fluff")}`);
  });

  look("clump", (v, k) => {
    const cl = v.p("setting");
    const much = v.p("howMuch");
    const size = v.p("clumpSize");
    const CAUSE = { nothing: "#c9a06a", water: "#7aa0c0", mud: "#6a4a2a", blood: "#8a2020", age: "#9a9a8a" };
    const col = CAUSE[v("cause")] || "#c9a06a";
    const hpc = v.n("hairsPerClump");
    let out = k.bg("#1b1d22");
    out += furPatch(k, { y: 150, n: 60, len: 60, spread: 16, color: col, clump: (0.2 + cl * 0.5) * (0.3 + much * 0.7), group: 3 + size * 6 + (hpc / 500) * 8, sw: 1.5, seed: 9 });
    if (/water|blood/.test(v("cause"))) out += bits(k, { n: 8, seed: 2, x: 30, y: 60, w: 260, h: 60, r: 2.5, color: col, alpha: 0.8 });
    const arc = v.p("arc");
    out += k.label({ x: 300, y: 24, text: `over the film: ${v("arc")}`, size: 9, color: arc > 0.6 ? "#ff9a6b" : arc < 0.4 ? "#9fffcf" : "#ccc", anchor: "end" });
    out += critter(k, { x: 40, y: 30, s: 0.8, part: v("whereOn") });
    return out + fitCaption(k, `${v("setting")} by ${v("cause")}, ${v("clumpSize")} clumps of ${hpc} hairs`);
  });

  look("frizz", (v, k) => {
    const fz = v.p("setting");
    const where = String(v("where"));
    const stray = v.n("strayCm") / 10;
    const halo = v.p("halo");
    const hp = v.n("haloPct") / 200;
    const CAUSE = { "dry air": "#d9b878", humidity: "#8a6a4a", static: "#e8d8a8", "a shock": "#f4f4f4" };
    let out = k.bg("#141418");
    if (halo > 0 || hp > 0) out += `<circle cx="160" cy="95" r="${r1(60 + hp * 30)}" fill="#fff4d0" opacity="${r2((0.05 + halo * 0.15) * (0.4 + hp * 0.6))}"/>`;
    out += strands(k, { x: 100, y: 110, w: 120, arch: 50, n: 50, len: 30 + stray * 25, angle: 0, spread: 120, bendAt: (t) => (t - 0.5) * 120, frizz: 0.2 + fz * 1.3, frizzWhere: /tips/.test(where) ? (s) => (s > 0.6 ? 1 : 0) : /roots/.test(where) ? (s) => (s < 0.4 ? 1 : 0) : () => 1, color: CAUSE[v("cause")] || "#d9b878", sw: 1.4, seed: 3 });
    out += k.face({ x: 160, y: 110, r: 30, mood: /shock/.test(v("cause")) ? -0.5 : 0, eyes: /shock/.test(v("cause")) ? 1 : 0.8 });
    const b = v.p("builds");
    out += k.arrow({ x1: 280, y1: 100, x2: 280, y2: 100 - (b - 0.5) * 50 - (b === 0.5 ? 1 : 0), color: "#ffd166", w: 2.5 }) + k.label({ x: 280, y: 118, text: v("builds"), size: 8, color: "#ccc" });
    return out + fitCaption(k, `frizz ${v.n("setting")}/5 at the ${where}, from ${v("cause")}, strays ${v.n("strayCm")} cm`);
  });

  look("hairColor", (v, k) => {
    const UND = { ash: "#8a8a80", natural: null, golden: "#e0b040", red: "#b04a2a" };
    const base0 = HAIR[v("setting")] || HAIR.medium;
    const und = UND[v("undertone")];
    const base = und ? k.mix(base0, und, 0.35) : base0;
    const gray = v.n("gray") / 100;
    const vari = v.p("variation");
    const dye = v.p("dye");
    const streak = v.n("streakPct") / 100;
    const roots = v.n("rootsCm") / 10;
    const ages = v.p("ages");
    let out = k.bg("#141418");
    const col = (i, t) => {
      let c = k.mix(base, "#cfcfcf", gray);
      if (k.rnd(i + 2) < streak * (0.4 + dye * 0.6)) c = dye > 0.9 ? "#d84ab0" : k.mix(c, "#f0d9a0", 0.6);
      return k.mix(c, k.rnd(i + 9) > 0.5 ? "#000000" : "#ffffff", vari * 0.25 * k.rnd(i));
    };
    out += strands(k, { x: 40, y: 150, w: 240, arch: 30, n: 70, len: 110, spread: 8, color: col, sw: 2.2, seed: 7 });
    if (roots > 0) out += `<path d="M40 150 Q160 120 280 150 L280 ${r1(150 - roots * 22)} Q160 ${r1(120 - roots * 22)} 40 ${r1(150 - roots * 22)} Z" fill="${base0}" opacity="0.85"/>`;
    /* Graying over the film: three little swatches, then and now. */
    [0, 1, 2].forEach((i) => (out += `<rect x="${250 + i * 20}" y="12" width="16" height="16" fill="${k.mix(k.mix(base, "#cfcfcf", gray), "#e8e8e8", ages * i * 0.4)}" stroke="#555"/>`));
    out += k.label({ x: 280, y: 40, text: `graying ${v("ages")}`, size: 8, color: "#ccc" });
    return out + fitCaption(k, `${v("setting")} ${v("undertone")}, ${v.n("gray")}% gray, ${v("dye")}, ${v.n("streakPct")}% highlights`);
  });

  look("hairShine", (v, k) => {
    const sh = v.p("setting");
    const much = v.p("howMuch");
    const wet = v.p("wetLook");
    const streak = v.p("streak");
    const sp = v.n("shinePct") / 300;
    const sw = v.n("streakWidth") / 50;
    let out = k.bg("#141418");
    out += strands(k, { x: 40, y: 150, w: 240, arch: 30, n: 60, len: 100 - wet * 20, spread: 8 - wet * 6, clump: wet * 0.6, group: 5, color: k.mix("#3a2418", "#1a100a", wet * 0.6), sw: 2.2, seed: 4 });
    const a = r2((0.1 + sh * 0.35 + much * 0.2 + sp * 0.3) * (0.4 + streak * 0.6));
    out += `<path d="M60 ${r1(95 - sw * 10)} Q160 ${r1(70 - sw * 10)} 260 ${r1(95 - sw * 10)}" fill="none" stroke="#fff" stroke-width="${r1(3 + sw * 26)}" opacity="${a}" stroke-linecap="round"/>`;
    if (wet > 0) out += bits(k, { n: wet * 14, seed: 6, x: 50, y: 60, w: 220, h: 80, r: 1.6, color: "#cfe6ff", alpha: 0.8 });
    out += chips(k, [`shines ${v("shinesWhen")}`], { x: 6, y: 5 });
    out += k.meter({ x: 220, y: 22, w: 90, p: sp, label: `${v.n("shinePct")}% of skin` });
    return out + fitCaption(k, `${v("setting")}, ${v("wetLook")}, streak ${v("streak")}, ${v.n("streakWidth")}% wide`);
  });

  look("furResponse", (v, k) => {
    const by = String(v("setting"));
    const str = v.p("strength");
    const bend = v.n("bendDeg") * (0.2 + str * 0.8);
    const trav = v.p("travels");
    const brist = v.p("bristle");
    let out = k.bg("#1b1d22");
    const wind = /wind|both/.test(by);
    const body = /body|both/.test(by);
    if (wind) out += windLines(k, { n: 8, x: 10, y: 20, w: 120, h: 70, angle: 0, len: 30, alpha: 0.5 });
    if (body) out += k.arrow({ x1: 220, y1: 40, x2: 300, y2: 40, color: "#ffd166" });
    const ripple = v.n("rippleSpeed");
    const by0 = by === "nothing" ? 0.2 : 1;
    out += furPatch(k, { y: 150, n: 50, len: 46 + brist * 14, spread: 8 + brist * 30, angle: 0, bendAt: (t) => by0 * bend * (trav === 0 ? 1 - t * ripple * 0.06 : 0.5 + 0.5 * Math.sin(t * (2 + trav * 6) * Math.PI + ripple * 0.5)), color: "#c9a06a", seed: 2 });
    const brT = `bristles ${v("bristle")}, ${v.n("bristleSecs")} s to rise`;
    out += `<rect x="4" y="90" width="${r1(brT.length * 4.4 + 8)}" height="13" rx="4" fill="#000" opacity="0.7"/>` + k.label({ x: 8, y: 100, text: brT, size: 8, color: "#ffd166", anchor: "start" });
    const st = v.p("settles");
    const ss = v.n("settleSecs");
    out += curve(k, { x: 222, y: 60, w: 88, h: 30, f: (t) => 0.5 + 0.45 * Math.exp((-t * 6) / (0.2 + ss * 0.3 + st)) * Math.cos(t * 25), color: "#ffd166", label: `settles ${v("settles")}` });
    return out + fitCaption(k, `fur moved by ${by}, ${v.n("strength")}/5, ${v("travels")}, bends ${v.n("bendDeg")}°`);
  });

  look("furLag", (v, k) => {
    const lag = v.n("setting");
    const spr = v.p("springiness");
    const os = v.p("overshoot");
    const od = v.n("overshootDeg");
    const sw = v.n("swings");
    const feel = v.p("feelsLike");
    const sells = v.p("sells");
    let out = k.bg("#1b1d22");
    /* A head turning right; the fur trails behind, then swings past. */
    out += k.arrow({ x1: 110, y1: 30, x2: 210, y2: 30, color: "#ffd166", w: 2 + sells * 3 }) + k.label({ x: 160, y: 22, text: `turn (sells ${v("sells")})`, size: 8, color: "#ffd166" });
    out += k.face({ x: 160, y: 110, r: 30, look: 1, color: "#c9a06a" });
    out += strands(k, { x: 125, y: 92, w: 70, arch: 20, n: 26, len: 34 - feel * 6, angle: -lag * 14, spread: 10, curl: feel * 0.5, curlFreq: 1, color: "#9a7040", sw: 2 + feel, seed: 3 });
    out += strands(k, { x: 125, y: 92, w: 70, arch: 20, n: 26, len: 34, angle: od * os * 0.8, spread: 10, color: "#9a7040", sw: 1, alpha: 0.35, seed: 3 });
    const f = (t) => 0.5 + 0.45 * Math.exp(-t * (6 - spr * 4)) * Math.cos(t * Math.PI * 2 * (0.5 + sw * 0.5)) * (0.3 + os * 0.7) * (0.4 + (od / 60) * 0.6);
    out += curve(k, { x: 222, y: 60, w: 88, h: 50, f, color: "#ffd166", label: `${sw} swings` });
    return out + fitCaption(k, `lag ${lag}/4, spring ${v.n("springiness")}/5, ${v("overshoot")} past by ${od}°, ${v("feelsLike")}`);
  });

  /* Curls of smoke: how many, how big, which way they turn, how long they hold. */
  look("curl", (v, k) => {
    const c = v.p("setting");
    const sz = v.p("size");
    const sp = v.p("speed");
    const hold = v.p("holds");
    const s = dist(k, v.n("distM"), 0.5, 1.8);
    const n = Math.max(1, Math.round(1 + (v.n("curlsInView") / 50) * 14));
    const spin = String(v("spin"));
    let out = k.bg("#16181e");
    const around = String(v("curlsAround"));
    out += `<rect x="0" y="150" width="320" height="30" fill="#24211d"/>`;
    /* A person in the scene for scale; in the curls when they swirl around a person, faint behind them otherwise. */
    out += k.person({ x: 160, y: 160, s: 1.2, color: "#4a6fa5", walk: /person/.test(around) ? 0.6 : 0, alpha: /person/.test(around) ? null : 0.5 });
    if (/beam/.test(around)) out += k.beam({ x: 0, y: 0, dir: 35, len: 380, spread: 14, alpha: 0.25 });
    for (let i = 0; i < n; i++) {
      const x = 30 + k.rnd(i + 1) * 260;
      const y = 25 + k.rnd(i + 7) * 120;
      const dir = /left/.test(spin) ? -1 : /right/.test(spin) ? 1 : i % 2 ? 1 : -1;
      out += spiral(k, { x, y, r: (6 + sz * 20) * s, turns: 0.4 + c * 2.2, dir, start: sp * 3 + i, color: "#c8c8d0", alpha: r1(0.25 + hold * 0.6), w: 1 + hold * 2 });
      if (sp > 0) out += `<path d="M${r1(x + (6 + sz * 20) * s)} ${r1(y)} a ${r1((6 + sz * 20) * s)} ${r1((6 + sz * 20) * s)} 0 0 ${dir > 0 ? 1 : 0} ${r1(-sp * 8)} ${r1(sp * 10 * dir)}" fill="none" stroke="#ffd166" stroke-width="1" opacity="0.6"/>`;
    }
    return out + fitCaption(k, `curl ${v.n("setting")}/5, size ${v.n("size")}/5, turning ${spin}, ${v("holds")}`);
  });

  /* Scattered things on the ground: how many, spread, size, kind, blowing, and the clear path for the hero. */
  look("scatter", (v, k) => {
    const KIND = { leaves: ["#c9772a", "#a0502a", "#d8a040"], litter: ["#ddd", "#9ab", "#c9b"], rubble: ["#8d8d8d", "#6d6d6d"], petals: ["#ff9ac0", "#ffd0e0"], people: ["#4a6fa5"] };
    const kind = String(v("kind"));
    const s = dist(k, v.n("distM"), 0.5, 1.8);
    const n = 4 + v.p("setting") * 70;
    const spread = v.p("spread");
    const size = (1.5 + v.p("size") * 4) * s;
    const stirs = v.p("stirs");
    const bs = v.n("blowSpeed");
    const path = v.p("clearPath");
    const pw = path ? (8 + v.n("pathM") * 8) * path : 0;
    let out = room(k, { floorY: 90, bg: "#1b2433", floor: "#3a3428" });
    const w = 120 + spread * 200;
    const x0 = 160 - w / 2;
    let pile = "";
    const N = Math.round(n);
    for (let i = 0; i < N; i++) {
      let x = x0 + k.rnd(i + 3) * w;
      const y = 96 + k.rnd(i + 8) * 76;
      if (pw && Math.abs(x - 160) < pw / 2) x = x < 160 ? 160 - pw / 2 - k.rnd(i) * 6 : 160 + pw / 2 + k.rnd(i) * 6;
      if (/people/.test(kind)) pile += k.person({ x, y, s: size * 0.12, color: "#4a6fa5" });
      else pile += bits(k, { n: 1, seed: i, x, y, w: 0, h: 0, r: size, color: KIND[kind] || KIND.leaves, shape: /leaves|petals/.test(kind) ? "leaf" : /rubble/.test(kind) ? "square" : "dot", dx: stirs > 0.9 ? 6 + bs * 3 : stirs > 0 ? 2 : 0 });
    }
    out += pile;
    if (pw) out += `<path d="M${r1(160 - pw / 2)} 180 L${r1(160 - pw / 6)} 90 M${r1(160 + pw / 2)} 180 L${r1(160 + pw / 6)} 90" stroke="#ffd166" stroke-dasharray="3 3"/>`;
    out += k.person({ x: 160, y: 170, s: 0.9, color: "#e05a3a" });
    if (stirs > 0.9) out += windLines(k, { n: 4 + bs, x: 0, y: 100, w: 300, h: 60, angle: 0, len: 10 + bs * 5, alpha: 0.5 });
    out += k.arrow({ x1: 230, y1: 20, x2: 240 + bs * 7, y2: 20, color: stirs > 0.9 ? "#cfe6ff" : "#556", w: 2 }) + k.label({ x: 228, y: 24, text: `${bs} m/s`, size: 8, color: "#ccc", anchor: "end" });
    return out + fitCaption(k, `${v("kind")}: ${v.n("setting")}/5, ${v("stirs")}, clear path: ${v("clearPath")}, ${v.n("pathM")} m`);
  });

  /* Cloth lens: the fabric itself: its weight, wrinkles, stretch, cling, tears and wetness on a cape. */
  look("clothLens", (v, k) => {
    const FAB = { silk: "#e8a0c8", cotton: "#d8d0c0", denim: "#3a5a8a", leather: "#6a3a1a", "chain mail": "#a8adb5" };
    const fp = v.p("fabric");
    const wet = v.p("wet");
    const cling = v.p("cling");
    const col = k.mix(FAB[v("fabric")] || "#d8d0c0", "#202830", wet * 0.4);
    const rx = v.p("reacts");
    let out = clothPic(v, k, { react: rx * (1 - cling * 0.6), weight: fp, len: 56 + fp * 10 + wet * 10 - cling * 12, amp: (1 + rx * 6) * (1.3 - fp * 0.7) * (1 - wet * 0.5), color: col });
    /* Wrinkles. */
    const wr = v.p("wrinkles");
    for (let i = 0; i < Math.round(wr * 6); i++) out += `<path d="M${150 + i * 3} ${92 + i * 6} q6 ${r1(3 + wr * 3)} ${r1(10 + wr * 4)} 0" fill="none" stroke="${INK}" stroke-width="1" opacity="0.6"/>`;
    /* Stretch arrows, a tear, drips. */
    const st = v.p("stretch");
    if (st > 0) out += k.arrow({ x1: 196, y1: 120, x2: 206 + st * 20, y2: 120, color: "#9fffcf" }) + k.arrow({ x1: 124, y1: 120, x2: 114 - st * 20, y2: 120, color: "#9fffcf" });
    const tr = v.p("tears");
    if (tr > 0) out += `<path d="M150 112 l4 ${r1(6 + tr * 12)} l-3 2 l5 ${r1(4 + tr * 10)}" fill="none" stroke="#111" stroke-width="${r1(1.5 + tr * 2)}"/>`;
    if (wet > 0) out += bits(k, { n: wet * 10, seed: 3, x: 130, y: 140, w: 60, h: 30, r: 1.8, color: "#9fd3ff" });
    out += k.label({ x: 300, y: 20, text: `${v("cling")}`, size: 9, color: "#ccc", anchor: "end" });
    return out + fitCaption(k, `${v("fabric")}, ${v("reacts")}, ${v("wrinkles")}, ${v("wet")}, ${v("tears")}`);
  });

  /* Bits in the air: dust, sparks, snow, rain… how many, how they fall, how far, how big, glowing. */
  look("bitsLens", (v, k) => {
    const KIND = { dust: "#d8c8a8", sparks: "#ffb347", snow: "#f4f8ff", rain: "#9fc8ff", leaves: "#c9772a", ash: "#888", confetti: ["#ff6b6b", "#ffd166", "#6bd0ff", "#9fffa0"], bubbles: "#bfe8ff" };
    const kind = String(v("kind"));
    const col = KIND[kind] || "#d8c8a8";
    const fall = v.p("fall");
    const speed = v.n("fallSpeed");
    const tilt = v.n("tiltDeg");
    const depth = v.p("depth");
    const sizeP = v.p("size");
    const s = dist(k, v.n("distM"), 0.5, 2);
    const shine = v.p("shine");
    const life = v.p("life");
    const n = 4 + v.p("howMany") * 40 + (v.n("count") / 2000) * 60 + v.p("amount") * 20;
    let out = room(k, { bg: "#141824" });
    out += k.person({ x: 160, y: 160, s: 1.2, color: "#4a6fa5" });
    const dy = (fall - 0.3) * (4 + speed * 3) * (fall < 0.2 ? -1 : 1);
    const dx = Math.tan(k.rad(tilt)) * Math.abs(dy);
    const r = (1 + sizeP * 3) * s * (depth > 0.9 ? 2.5 : depth < 0.1 ? 0.6 : 1);
    if (shine > 0.9) out += `<defs><filter id="cw-bitsLens-glow"><feGaussianBlur stdDeviation="2"/></filter></defs>` + bits(k, { n, seed: 3, x: 0, y: depth < 0.1 ? 10 : 0, w: 320, h: depth < 0.1 ? 90 : 170, r: r * 2, color: col, alpha: 0.4 }).replace(/<circle /g, '<circle filter="url(#cw-bitsLens-glow)" ');
    out += bits(k, { n, seed: 3, x: 0, y: depth < 0.1 ? 10 : 0, w: 320, h: depth < 0.1 ? 90 : 170, r, color: col, alpha: r1(0.4 + shine * 0.3 + life * 0.3), dx, dy, shape: /sparks/.test(kind) ? "spark" : /leaves/.test(kind) ? "leaf" : /confetti/.test(kind) ? "square" : /bubbles/.test(kind) ? "ring" : "dot" });
    const arr = v.p("arrives");
    out += chips(k, [`${v("arrives")}`, `last ${v("life")}`], { x: 6, y: 5 });
    if (arr > 0.9) out += star(k, { x: 300, y: 20, r: 10, color: "#ffd166" });
    return out + fitCaption(k, `${kind}: ${v("howMany")}, ${v("fall")} at ${speed} m/s, ${v("depth")}, ${v("size")}`);
  });

  /* Fur lens: a whole coat on one patch: length, thickness, clumps, frizz, curls, color, shine, wet, groom. */
  look("furLens", (v, k) => {
    const len = (v.p("length") * 0.5 + (v.n("lengthCm") / 50) * 0.5) * 90 + 8;
    const thick = v.p("thick");
    const wet = v.p("wet");
    const groom = v.p("groom");
    const shine = v.p("shine");
    const col = k.mix(HAIR[v("color")] || HAIR.medium, "#000000", wet * 0.3);
    const re = String(v("reacts"));
    const lag = v.n("lag");
    let out = k.bg("#1b1d22");
    if (/wind|both/.test(re)) out += windLines(k, { n: 8, x: 10, y: 15, w: 120, h: 50, angle: 0, len: 26, alpha: 0.5 });
    if (/body|both/.test(re)) out += k.arrow({ x1: 230, y1: 30, x2: 300, y2: 30, color: "#ffd166" });
    out += furPatch(k, {
      y: 150,
      n: 20 + thick * 50,
      len: len * (1 - wet * 0.25),
      spread: groom === 0 ? 4 : groom < 0.5 ? 6 : groom < 1 ? 50 : 20,
      angle: (groom > 0.3 && groom < 0.5 ? 35 : 0) - lag * 6,
      bendAt: groom > 0.9 ? (t) => (t - 0.5) * 30 : null,
      clump: v.p("clumps") * 0.7 + wet * 0.3,
      group: 6,
      frizz: v.n("frizz") / 5,
      curl: v.p("curls") * 1.2,
      curlFreq: 1 + v.p("curls") * 3,
      color: col,
      sw: 1.4 + thick,
      seed: 6,
    });
    if (shine > 0) out += `<path d="M40 105 Q160 75 280 105" fill="none" stroke="#fff" stroke-width="${r1(4 + shine * 10)}" opacity="${r1(shine * 0.35)}" stroke-linecap="round"/>`;
    out += critter(k, { x: 40, y: 92, s: 0.6, part: v("whereOn") });
    out += k.label({ x: 300, y: 60, text: `over the film: ${v("overFilm")}`, size: 8, color: "#ccc", anchor: "end" });
    return out + fitCaption(k, `${v("length")} ${v.n("lengthCm")} cm, ${v("thick")}, ${v("curls")}, ${v("groom")}, ${v("wet")}`);
  });

  /* ========== frame effects ========== */

  /* Cutout: a person lifted out of the green screen onto a new background, with edge, spill and shadow. */
  look("cutout", (v, k) => {
    const kind = String(v("setting"));
    const back = String(v("newBack"));
    const edge = v.n("edge") / 100;
    const spill = v.n("spillPct") / 100;
    const fake = v.p("fakeness");
    const lm = v.p("lightMatch");
    const BACK = { none: "#1ea84a", "solid color": "#6a5acd", "a new place": "#3a6a8a", blurred: "#4a5a6a", "an image": "#8a6a3a" };
    let out = k.bg(/none/.test(kind) ? "#1ea84a" : BACK[back] || "#3a6a8a");
    if (/new place|image/.test(back)) out += `<rect x="0" y="120" width="320" height="60" fill="#5a4a32"/><circle cx="260" cy="40" r="18" fill="#ffd27a"/>` + (/blur/.test(back) ? "" : `<path d="M0 120 L60 70 L120 120 L190 60 L260 120 Z" fill="#2c4a5a"/>`);
    if (/blurred/.test(back)) out += `<rect x="0" y="0" width="320" height="180" fill="#ccc" opacity="0.15"/>`;
    /* Reveal: half the frame still green while the new background wipes or fades in. */
    const rv = String(v("reveal"));
    const rs = v.n("revealSecs") / 5;
    if (/wipes/.test(rv)) out += `<rect x="${r1(320 - rs * 140)}" y="0" width="${r1(rs * 140)}" height="180" fill="#1ea84a"/>`;
    if (/fades/.test(rv)) out += `<rect x="0" y="0" width="320" height="180" fill="#1ea84a" opacity="${r1(rs * 0.6)}"/>`;
    /* The shadow on the new ground. */
    const sh = v.p("shadow");
    const sl = (v.n("shadowLen") / 300) * 120;
    const sd = v.n("shadowDeg");
    out += `<ellipse cx="${r1(160 + Math.sin(k.rad(sd)) * sl * 0.5)}" cy="${r1(152 - Math.cos(k.rad(sd)) * 6)}" rx="${r1(10 + sl * 0.5)}" ry="5" fill="#000" opacity="${r2(0.12 + sh * 0.45)}" transform="rotate(${r1(sd * 0.1)} 160 152)"${sh > 0 ? "" : ' stroke="#fff" stroke-dasharray="3 3" stroke-opacity="0.5"'}/>`;
    /* The person with a green fringe and soft edge; mismatched light tints them. */
    out += `<rect x="${r1(140 - edge * 6)}" y="${r1(55 - edge * 6)}" width="${r1(40 + edge * 12)}" height="${r1(100 + edge * 12)}" rx="${r1(6 + edge * 10)}" fill="#1ea84a" opacity="${r1(spill * 0.7)}"/>`;
    out += k.person({ x: 160, y: 155, s: 1.4, color: "#4a6fa5" });
    if (lm < 1) out += `<rect x="140" y="55" width="40" height="100" fill="${lm < 0.5 ? "#ff6bd0" : "#ffb070"}" opacity="${r1((1 - lm) * 0.3)}"/>`;
    if (fake > 0) out += `<rect x="${r1(138 - fake * 4)}" y="${r1(53 - fake * 4)}" width="${r1(44 + fake * 8)}" height="${r1(104 + fake * 8)}" fill="none" stroke="#fff" stroke-width="${r1(fake * 3)}" stroke-dasharray="${fake > 0.9 ? "0" : "4 3"}"/>`;
    out += timeline(k, { x: 214, y: 18, w: 96, max: 5, label: `${rv}, ${v.n("revealSecs")} s`, segs: [{ from: 0, to: v.n("revealSecs"), color: "#1ea84a" }] });
    return out + fitCaption(k, `${kind} onto ${back}, edge ${v.n("edge")}%, ${v("fakeness")}`);
  });

  /* Mask: a shape over the frame showing inside or outside, its place, size, turn, shape and feather. */
  look("maskShape", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "circle" : raw;
    const feather = v.n("feather") / 100;
    const inv = v.p("invert") > 0.5;
    const ax = (v.p("across") * 0.5 + (v.n("centerAcross") / 100) * 0.5) * 320;
    const uy = 180 - (v.p("height") * 0.5 + (v.n("centerUp") / 100) * 0.5) * 180;
    const size = v.n("size") / 100;
    const asp = v.n("aspect") / 100;
    const turn = v.n("turn");
    const ry = 10 + size * 80;
    const rx = k.clamp(ry * asp, 6, 300);
    let pic = k.bg("#2b3a4f") + `<rect x="0" y="130" width="320" height="50" fill="#3a3127"/>` + k.person({ x: 160, y: 160, s: 1.4, color: "#4a6fa5" }) + `<circle cx="260" cy="40" r="16" fill="#ffd27a"/>`;
    let shape = /circle|vignette|follows/.test(kind) ? `<ellipse cx="${r1(ax)}" cy="${r1(uy)}" rx="${r1(rx)}" ry="${r1(ry)}" transform="rotate(${turn} ${r1(ax)} ${r1(uy)})"/>` : /rectangle|gradient/.test(kind) ? `<rect x="${r1(ax - rx)}" y="${r1(uy - ry)}" width="${r1(rx * 2)}" height="${r1(ry * 2)}" transform="rotate(${turn} ${r1(ax)} ${r1(uy)})"/>` : /drawn/.test(kind) ? `<path d="M${r1(ax - rx)} ${r1(uy)} Q${r1(ax - rx * 0.5)} ${r1(uy - ry * 1.3)} ${r1(ax + rx * 0.4)} ${r1(uy - ry)} Q${r1(ax + rx * 1.2)} ${r1(uy)} ${r1(ax + rx * 0.3)} ${r1(uy + ry)} Q${r1(ax - rx * 0.8)} ${r1(uy + ry)} ${r1(ax - rx)} ${r1(uy)} Z" transform="rotate(${turn} ${r1(ax)} ${r1(uy)})"/>` : "";
    let out = "";
    if (!shape) out = pic;
    else {
      const blur = feather > 0 ? `<filter id="cw-maskShape-f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r1(feather * 14)}"/></filter>` : "";
      const fill = (c) => shape.replace("/>", ` fill="${c}"${feather > 0 ? ' filter="url(#cw-maskShape-f)"' : ""}/>`);
      out = `<defs>${blur}<mask id="cw-maskShape-m"><rect x="0" y="0" width="320" height="180" fill="${inv ? "#fff" : "#000"}"/>${fill(inv ? "#000" : "#fff")}</mask></defs>` + k.bg("#08080a") + `<g mask="url(#cw-maskShape-m)">${pic}</g>`;
      out += shape.replace("/>", ` fill="none" stroke="#ffd166" stroke-width="1" stroke-dasharray="4 3"/>`);
    }
    const mv = v.p("moves");
    if (mv > 0) out += k.arrow({ x1: ax, y1: uy, x2: ax + (mv > 0.9 ? 40 : 20), y2: uy + (mv > 0.9 ? -10 : 0), color: "#ffd166" });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, shows ${v("invert")}, ${v.n("size")}%, turned ${turn}°, feather ${v.n("feather")}%`);
  });

  /* Tracking: a label or sticker following a moving target, beside it, lagging or leading. */
  look("tracking", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "text follows" : raw;
    const smooth = v.n("smooth") / 100;
    const target = String(v("target"));
    const lead = v.n("leadFrames") / 24 + (v.p("lead") - 0.5);
    const gap = (v.n("gapPct") / 50) * 60;
    const side = String(v("side"));
    const ff = v.p("followFor");
    let out = k.bg("#141418") + screen(k, { x: 6, y: 6, w: 308, h: 150 });
    /* The target's path and its spot now. */
    const path = (t) => [40 + t * 230, 110 - Math.sin(t * Math.PI) * 50];
    let d = "";
    for (let i = 0; i <= 20; i++) d += (i ? " L" : "M") + path(i / 20).map(r1).join(" ");
    out += `<path d="${d}" fill="none" stroke="#666" stroke-dasharray="3 3"/>`;
    /* How long it follows: the dashed part of the path it keeps up. */
    const t = 0.55;
    const [tx, ty] = path(t);
    const T = /face/.test(target) ? k.face({ x: tx, y: ty, r: 14 }) : /body/.test(target) ? k.person({ x: tx, y: ty + 40, s: 0.9, color: "#4a6fa5", walk: 0.5 }) : `<rect x="${r1(tx - 12)}" y="${r1(ty - 10)}" width="24" height="20" rx="3" fill="#c98a3a" stroke="${INK}"/>`;
    out += T;
    if (!/none/.test(kind)) {
      const [lx, ly] = path(k.clamp(t + lead * 0.12, 0, 1));
      const off = /above/.test(side) ? [0, -gap - 26] : /below/.test(side) ? [0, gap + 26] : /left/.test(side) ? [-gap - 34, 0] : /right/.test(side) ? [gap + 34, 0] : [0, 0];
      const jit = (1 - smooth) * 6;
      const ox = lx + off[0] + (k.rnd(3) - 0.5) * jit;
      const oy = ly + off[1] + (k.rnd(5) - 0.5) * jit;
      const tag = /text/.test(kind) ? `<rect x="${r1(ox - 24)}" y="${r1(oy - 8)}" width="48" height="16" rx="3" fill="#fff"/>${k.label({ x: ox, y: oy + 4, text: "Name", size: 9, color: INK })}` : /sticker/.test(kind) ? star(k, { x: ox, y: oy, r: 12, color: "#ffd166", points: 5 }) : /mask/.test(kind) ? k.ring({ x: ox, y: oy, r: 20, dash: "3 2" }) : k.frame({ x: ox - 22, y: oy - 22, w: 44, h: 44 });
      out += tag;
      for (let g = 1; g <= Math.round((1 - smooth) * 3); g++) out += `<g opacity="${r1(0.3 / g)}" transform="translate(${-g * 3} ${g * 2})">${tag}</g>`;
      let kept = "";
      for (let i = 0; i <= 10; i++) kept += (i ? " L" : "M") + path(t - (0.1 + ff * 0.45) * (1 - i / 10)).map(r1).join(" ");
      out += `<path d="${kept}" fill="none" stroke="#ffd166" stroke-width="2"/>`;
    }
    return out + offNote(k, off, kind) + fitCaption(k, `${kind} ${v("target")}, ${v("side")}, ${v("lead")} (${v.n("leadFrames")} fr)`);
  });

  /* Video effect: the kind on a frame, its intensity and coverage, a body treatment, and pulses on a strip. */
  const fx = (k, kind, inten, cov, col) => {
    const a = r1(0.15 + inten * 0.75);
    const R = 20 + cov * 110;
    if (/glow|light leak|portrait/.test(kind)) return `<circle cx="${/leak/.test(kind) ? 20 : 110}" cy="${/leak/.test(kind) ? 20 : 70}" r="${r1(R)}" fill="${col}" opacity="${r1(a * 0.5)}"/>`;
    if (/blur/.test(kind)) return `<rect x="10" y="10" width="200" height="120" fill="#ccc" opacity="${r1(a * 0.4)}"/>`;
    if (/glitch/.test(kind)) return [0, 1, 2, 3].map((i) => `<rect x="${10 + (i % 2 ? 6 : -4) * inten * 3}" y="${20 + i * 26}" width="${r1(60 + cov * 140)}" height="6" fill="${i % 2 ? "#ff3060" : "#30e0ff"}" opacity="${a}"/>`).join("");
    if (/old TV/.test(kind)) return Array.from({ length: Math.round(4 + cov * 20) }, (_, i) => `<line x1="10" y1="${12 + i * 5}" x2="210" y2="${12 + i * 5}" stroke="#000" opacity="${r1(a * 0.5)}"/>`).join("");
    if (/shake/.test(kind)) return `<rect x="${r1(10 + inten * 8)}" y="${r1(10 - inten * 4)}" width="200" height="120" fill="none" stroke="#fff" opacity="${a}"/>`;
    if (/flash/.test(kind)) return `<rect x="10" y="10" width="200" height="120" fill="#fff" opacity="${r1(a * 0.6 * (0.3 + cov))}"/>`;
    if (/zoom/.test(kind)) return `<rect x="${r1(110 - 50 - cov * 50)}" y="${r1(70 - 30 - cov * 30)}" width="${r1(100 + cov * 100)}" height="${r1(60 + cov * 60)}" fill="none" stroke="#fff" stroke-width="${r1(1 + inten * 3)}"/>`;
    if (/mirror/.test(kind)) return `<line x1="110" y1="10" x2="110" y2="130" stroke="#fff" stroke-width="2" opacity="${a}"/>`;
    if (/outline/.test(kind)) return `<rect x="88" y="40" width="44" height="90" rx="14" fill="none" stroke="${col}" stroke-width="${r1(1 + inten * 4)}"/>`;
    return "";
  };
  look("videoEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "glow" : raw;
    const inten = v.n("intensity") / 100;
    const cov = v.n("coverage") / 100;
    let out = k.bg("#141418") + screen(k, { x: 10, y: 10, w: 200, h: 120 });
    const body = String(v("body"));
    if (/trail/.test(body)) out += k.person({ x: 96, y: 124, s: 1.2, color: "#4a6fa5", alpha: 0.3 }) + k.person({ x: 103, y: 124, s: 1.2, color: "#4a6fa5", alpha: 0.5 });
    out += k.person({ x: 110, y: 124, s: 1.2, color: "#4a6fa5", skin: /smooth/.test(body) ? "#ffe0c8" : undefined });
    if (/outline glow/.test(body)) out += `<rect x="94" y="56" width="32" height="70" rx="12" fill="none" stroke="#9fffcf" stroke-width="2"/>`;
    out += fx(k, kind, inten, cov, "#ffd27a");
    if (/mirror/.test(kind)) out += k.person({ x: 150, y: 124, s: 1.2, color: "#4a6fa5", alpha: 0.6 });
    /* Pulses on a strip of beats; offset early or late; comes in over seconds; lasts. */
    const ppm = Math.min(32, Math.round(v.n("pulsesPerMin") / 8));
    const beat = v.p("onBeat") > 0.5;
    const late = (v.n("offsetFrames") / 12) * 0.05;
    out += beatStrip(k, { x: 10, y: 146, w: 300, beats: 8, gridColor: beat ? "#9fd3ff" : "#333", events: Array.from({ length: Math.max(1, ppm) }, (_, i) => ({ at: (beat ? Math.round(((i + 0.5) / Math.max(1, ppm)) * 8) / 8 : (i + 0.5) / Math.max(1, ppm)) + late, w: 2 })), label: `${v.n("pulsesPerMin")} pulses a minute, ${v.n("offsetFrames")} frames` });
    out += envelope(k, { x: 222, y: 26, w: 88, h: 46, rise: v.n("inSecs") * (/snaps/.test(v("comesIn")) ? 0.1 : /builds/.test(v("comesIn")) ? 1.5 : 1), snap: /builds/.test(v("comesIn")) ? 1 : 0, hold: v.n("lasts"), fall: 0.4, peak: 0.3 + inten * 0.6, label: `${v("comesIn")}, lasts ${v.n("lasts")} s` });
    out += chips(k, [`to ${v("usedTo")}`], { x: 222, y: 84 });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v.n("intensity")}%, ${v.n("coverage")}% of the frame, body: ${body}`);
  });

  /* Effect family: a grid of the families, the chosen one lit, and a sample of how much of the frame it covers. */
  look("videoEffectFamily", (v, k) => {
    const fam = String(v("setting"));
    const list = v.slider("setting") ? v.slider("setting").scale : [fam];
    const inten = v.n("intensity") / 100;
    const sp = v.p("spread");
    const vibe = v.p("vibe");
    const col = k.mix(k.mix("#7fb7ff", "#ffd166", Math.min(1, vibe * 2)), "#ff4de1", Math.max(0, vibe * 2 - 1));
    let out = k.bg("#141418");
    list.forEach((f, i) => {
      const x = 8 + (i % 4) * 34;
      const y = 8 + Math.floor(i / 4) * 30;
      const on = f === fam;
      out += `<rect x="${x}" y="${y}" width="31" height="26" rx="4" fill="${on ? col : "#2a2a30"}" stroke="${on ? "#fff" : "#444"}"/>` + k.label({ x: x + 15.5, y: y + 16, text: String(f).slice(0, 6), size: 7, color: on ? INK : "#999" });
    });
    out += screen(k, { x: 150, y: 10, w: 162, h: 100 });
    out += k.person({ x: 230, y: 104, s: 1, color: "#4a6fa5" });
    if (!/none/.test(fam)) {
      if (sp === 0) out += bits(k, { n: 8, seed: 2, x: 270, y: 14, w: 38, h: 30, r: 2.5 + inten * 3, color: col, shape: "spark" });
      else if (sp < 1) out += k.ring({ x: 230, y: 70, r: 26 + inten * 10, color: col, w: 1 + inten * 4 });
      else out += `<rect x="150" y="10" width="162" height="100" fill="${col}" opacity="${r1(0.1 + inten * 0.4)}"/>` + bits(k, { n: 20, seed: 9, x: 150, y: 10, w: 162, h: 100, r: 2 + inten * 2, color: col, shape: "spark" });
    }
    const beat = v.p("onBeat") > 0.5;
    out += beatStrip(k, { x: 150, y: 128, w: 162, beats: 8, gridColor: beat ? "#9fd3ff" : "#333", events: Array.from({ length: 8 }, (_, i) => ({ at: beat ? i / 8 : (i + k.rnd(i) * 0.6) / 8, w: 2, color: col })), label: beat ? "pulses on the beat" : "steady" });
    out += chips(k, [`switches ${v("switches")}`], { x: 150, y: 150 });
    return out + fitCaption(k, `${fam}: ${v.n("intensity")}%, ${v("spread")}, ${v("vibe")}`);
  });

  /* Multiply: copies of the picture laid out in a grid, scatter, stack or ring, turning, delayed. */
  look("multiplyEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "grid" : raw;
    const n = /none/.test(kind) ? 1 : v.n("count");
    const arr = String(v("arrange"));
    const gap = (v.n("gapPct") / 50) * 16;
    const differ = v.p("differ");
    const delay = v.n("delayFrames");
    const tps = v.n("turnsPerSec");
    const mo = v.p("motion");
    const app = v.p("appear");
    const as = v.n("appearSecs") / 5;
    let out = k.bg("#141418");
    const cols = Math.ceil(Math.sqrt(n));
    const cw = (200 - gap * (cols - 1)) / cols;
    const ch = cw * 0.62;
    const COL = ["#4a6fa5", "#a54a6f", "#6fa54a", "#a58a4a", "#6a4aa5"];
    for (let i = 0; i < n; i++) {
      let x;
      let y;
      let rot = 0;
      if (/ring/.test(arr)) {
        const a = (i / n) * Math.PI * 2;
        x = 110 + Math.cos(a) * 60 - 22;
        y = 80 + Math.sin(a) * 45 - 14;
      } else if (/stack/.test(arr)) {
        x = 60 + i * (3 + gap * 0.3);
        y = 40 + i * (3 + gap * 0.3);
        rot = (k.rnd(i) - 0.5) * 12;
      } else if (/scatter/.test(arr)) {
        x = 15 + k.rnd(i + 2) * 150;
        y = 15 + k.rnd(i + 5) * 100;
        rot = (k.rnd(i) - 0.5) * 30;
      } else {
        x = 10 + (i % cols) * (cw + gap);
        y = 10 + Math.floor(i / cols) * (ch + gap);
      }
      const w = /grid/.test(arr) ? cw : 44;
      const h = /grid/.test(arr) ? ch : 28;
      rot += mo > 0.6 && mo < 0.9 ? tps * 30 * (i + 1) : mo > 0 && mo < 0.5 ? 4 : 0;
      const fill = differ > 0.9 ? COL[i % COL.length] : "#4a6fa5";
      const op = app > 0 && i > n * (1 - as) ? 0.3 : 1;
      const lag = differ > 0.4 && differ < 0.6 ? (i * delay) / 30 : (i * delay) / 60;
      out += `<g transform="rotate(${r1(rot)} ${r1(x + w / 2)} ${r1(y + h / 2)})" opacity="${op}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="#2b3a4f" stroke="#ddd"/>${k.person({ x: x + w / 2 + lag * 6, y: y + h - 2, s: h / 70, color: fill })}</g>`;
    }
    if (mo > 0.9) out += k.label({ x: 110, y: 157, text: "♪ on the beat", size: 9, color: "#9fd3ff" });
    out += k.label({ x: 218, y: 30, text: `${v("motion")}, ${tps} turns/s`, size: 8, color: "#ccc", anchor: "start" });
    out += k.label({ x: 218, y: 44, text: `${v("differ")}`, size: 8, color: "#ccc", anchor: "start" });
    out += k.label({ x: 218, y: 58, text: `each ${delay} frames late`, size: 8, color: "#ccc", anchor: "start" });
    out += timeline(k, { x: 220, y: 80, w: 90, max: 5, label: `${v("appear")}`, segs: [{ from: 0, to: v.n("appearSecs"), color: "#ffd166" }] });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}: ${n} copies, ${arr}, ${v.n("gapPct")}% apart`);
  });

  /* Light effect: rays, flare, halo or burn coming from a corner, warm or cool, sweeping or flickering. */
  look("lightEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "god rays" : raw;
    const st = v.n("strength") / 100;
    const cov = v.n("coverage") / 100;
    const WARM = { cool: "#a8d0ff", neutral: "#ffffff", warm: "#ffc070", golden: "#ffd84a" };
    const col = WARM[v("warmth")] || "#ffffff";
    const FROM = { "top left": [20, 10, 40], top: [160, 0, 90], "top right": [300, 10, 140], right: [320, 80, 180], left: [0, 80, 0] };
    const [sx, sy, dir] = FROM[v("comesFrom")] || FROM.top;
    let out = k.bg("#141418") + `<rect x="0" y="130" width="320" height="50" fill="#26231f"/>` + k.person({ x: 160, y: 150, s: 1.3, color: "#4a6fa5" });
    const mv = v.p("moves");
    const sweep = (v.n("sweepSecs") / 60) * 30 * (mv > 0.2 && mv < 0.5 ? 1 : 0.2);
    const a = r1(0.1 + st * 0.6);
    if (/rays/.test(kind)) for (let i = 0; i < 4; i++) out += k.beam({ x: sx, y: sy, dir: dir - 20 + i * 12 + sweep, len: 140 + cov * 240, spread: 6 + cov * 6, color: col, alpha: a });
    else if (/flare/.test(kind)) for (let i = 0; i < 4; i++) out += `<circle cx="${r1(sx + (160 - sx) * i * 0.4)}" cy="${r1(sy + (90 - sy) * i * 0.4)}" r="${r1((8 + cov * 30) / (i + 1))}" fill="${col}" opacity="${r1(a * (1 - i * 0.2))}"/>`;
    else if (/halo/.test(kind)) out += k.ring({ x: 160, y: 75, r: 18 + cov * 30, color: col, w: 2 + st * 6 });
    else if (/leak|burn/.test(kind)) out += `<ellipse cx="${sx}" cy="${sy}" rx="${r1(60 + cov * 200)}" ry="${r1(40 + cov * 120)}" fill="${/burn/.test(kind) ? "#ff7030" : col}" opacity="${Math.min(a, 0.5)}"/>`;
    else if (/blaze/.test(kind)) out += star(k, { x: sx, y: Math.max(20, sy), r: 20 + cov * 60, color: col, points: 12, alpha: a });
    else if (/lightning/.test(kind)) out += `<polyline points="${sx},${sy} ${sx + 20},${sy + 40} ${sx - 10},${sy + 60} ${sx + 15},${r1(sy + 80 + cov * 40)}" fill="none" stroke="${col}" stroke-width="${r1(2 + st * 4)}"/>` + k.tint({ color: col, alpha: st * 0.2 });
    if (mv > 0.5 && mv < 0.9) out += k.wave({ x: 10, y: 120, w: 300, h: 10, amp: 0.8, cycles: 14, noise: 0.6, color: col });
    if (mv > 0.9) out += k.ring({ x: sx, y: Math.max(10, sy), r: 30, color: col, dash: "3 3" });
    const late = (v.n("offsetFrames") / 12) * 0.05;
    out += beatStrip(k, { x: 10, y: 150, w: 300, beats: 8, gridColor: /beat/.test(v("hitsOn")) ? "#9fd3ff" : "#333", events: [0.125, 0.375, 0.625].map((t) => ({ at: t + late, w: 2 + v.n("hitSecs") * 3, color: col })), label: `hits ${v("hitsOn")}, ${v.n("hitSecs")} s each, ${v.n("offsetFrames")} frames` });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind} from ${v("comesFrom")}, ${v("warmth")}, ${v.n("strength")}%, ${v("moves")}`);
  });

  /* Body effect: a glow, trail or outline on one person or everyone, with its color and reach. */
  look("bodyEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "outline" : raw;
    const c = POWER[v("color")] || "#f5f5f5";
    const inten = v.n("intensity") / 100;
    const who = v.p("who");
    const tr = v.p("trail");
    const ts = v.n("trailSecs");
    const glow = v.n("glowCm") / 100;
    let out = room(k, { floorY: 140 });
    const people = who === 0 ? [[110, 1]] : who < 1 ? [[110, 0], [190, 1]] : [[110, 1], [190, 1]];
    people.forEach(([x, on], i) => {
      if (on && !/none/.test(kind)) {
        const ghosts = Math.round(tr * 2 + ts);
        for (let g = ghosts; g >= 1; g--) out += k.person({ x: x - g * (6 + ts * 4), y: 150, s: 1.2, color: c, alpha: r1((0.5 / g) * (0.3 + inten * 0.7)) });
        out += `<ellipse cx="${x}" cy="105" rx="${r1(14 + glow * 30)}" ry="${r1(40 + glow * 30)}" fill="${c}" opacity="${r1((0.1 + inten * 0.3) * (/glow|superpower/.test(kind) ? 1.2 : 0.6))}"/>`;
        if (/outline|lines/.test(kind)) out += `<rect x="${x - 14}" y="62" width="28" height="90" rx="12" fill="none" stroke="${c}" stroke-width="${r1(1 + inten * 3)}"${/lines/.test(kind) ? ' stroke-dasharray="6 3"' : ""}/>`;
        if (/clone/.test(kind)) out += k.person({ x: x + 22, y: 150, s: 1.2, color: c, alpha: 0.5 });
        if (/hallucination/.test(kind)) out += spiral(k, { x, y: 70, r: 22, turns: 2, color: c });
      }
      out += k.person({ x, y: 150, s: 1.2, color: i ? "#7a5a8a" : "#4a6fa5" });
    });
    out += timeline(k, { x: 222, y: 20, w: 88, max: 5, label: "comes in", segs: [{ from: 0, to: v.n("inSecs"), color: c }] });
    out += chips(k, [`shows ${v("showsWhen")}`], { x: 6, y: 5 });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v("color")} on ${v("who")}, ${v.n("intensity")}%, glow ${v.n("glowCm")} cm`);
  });

  /* Clones: copies of the person, how many, how far apart, lagging and fading. */
  look("cloneEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "clone trail" : raw;
    const n = /none/.test(kind) ? 0 : v.n("count");
    const ap = v.p("apart");
    const gap = 4 + v.n("gapM") * 8 + ap * 14;
    const ghost = v.p("ghostly");
    const fade = v.n("fadePct") / 100;
    const lagF = v.n("delayFrames") / 60 + v.p("delay");
    let out = room(k, { floorY: 140 });
    for (let i = n; i >= 1; i--) {
      let x;
      let y = 150;
      if (ap > 0.9) {
        const a = (i / n) * Math.PI * 2;
        x = 160 + Math.cos(a) * (40 + gap);
        y = 150 + Math.sin(a) * 14;
      } else x = 160 - i * gap;
      const alpha = r1(Math.max(0.08, (1 - ghost * 0.5) * (1 - (fade * i) / Math.max(1, n))));
      out += k.person({ x, y, s: 1.2, color: "#4a6fa5", alpha, arms: lagF * 0.5 - (i / Math.max(1, n)) * lagF * 0.8, lean: -lagF * i * 2 });
    }
    out += k.person({ x: 160, y: 150, s: 1.2, color: "#4a6fa5", arms: 0.6 });
    out += k.label({ x: 300, y: 20, text: `${v("delay")}, ${v.n("delayFrames")} frames`, size: 9, color: "#ccc", anchor: "end" });
    out += chips(k, [`appear ${v("when")}`], { x: 6, y: 5 });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}: ${n} copies, ${v("apart")}, ${v("ghostly")}, fade ${v.n("fadePct")}%`);
  });

  /* Outline: a line around the person: style, thickness, color, glow spread, pulse, drawing on. */
  look("outlineEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "glowing lines" : raw;
    const c = POWER[v("color")] || "#f5f5f5";
    const th = 1.5 + v.p("thickness") * 5;
    const glow = v.p("glow");
    const ds = v.n("drawSecs") / 5;
    const app = v.p("appears");
    let out = room(k, { floorY: 140 }) + k.person({ x: 120, y: 155, s: 1.5, color: "#4a6fa5" });
    if (!/none/.test(kind)) {
      const pathD = "M120 32 C100 32 98 60 104 64 L94 66 L92 132 L100 155 L140 155 L148 132 L146 66 L136 64 C142 60 140 32 120 32 Z";
      const len = 360;
      const drawn = app > 0.4 && app < 0.6 ? len * (1 - ds * 0.7) : len;
      const dash = /sparkle|paper|hand/.test(kind) ? "6 4" : `${r1(drawn)} ${len}`;
      if (glow > 0) out += `<path d="${pathD}" fill="none" stroke="${c}" stroke-width="${r1(th + glow * 18)}" opacity="${r1(0.12 + glow * 0.12)}"/>`;
      out += `<path d="${pathD}" fill="none" stroke="${/rainbow/.test(kind) ? "#ff7ae0" : /flame/.test(kind) ? "#ff7a2a" : c}" stroke-width="${r1(th)}" stroke-dasharray="${dash}" stroke-linejoin="round"/>`;
      if (/flame/.test(kind)) out += flame(k, { x: 120, y: 34, h: 18, w: 10 });
      if (app > 0.9) out += star(k, { x: 150, y: 50, r: 10, color: c });
    }
    /* Pulse over time. */
    const pul = v.p("pulse");
    const ppm = v.n("pulsesPerMin");
    out += curve(k, { x: 200, y: 40, w: 110, h: 40, f: (t) => 0.5 + (pul === 0 ? 0 : 0.4 * Math.sin(t * Math.PI * 2 * (1 + ppm / 12))) * (pul > 0.9 ? Math.sign(Math.sin(t * Math.PI * 2 * (1 + ppm / 12))) : 1), color: c, label: `${v("pulse")}, ${ppm}/min` });
    out += timeline(k, { x: 200, y: 110, w: 110, max: 5, label: `${v("appears")}`, segs: [{ from: 0, to: v.n("drawSecs"), color: c }] });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v("thickness")} ${v("color")}, ${v("glow")}`);
  });

  /* Distortion: a ripple or warp over a grid, where and how strong, bending and settling. */
  look("distortionEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "ripple" : raw;
    const st = v.n("strength") / 100;
    const area = v.p("area");
    let out = k.bg("#141418") + screen(k, { x: 10, y: 10, w: 200, h: 130 });
    out += k.person({ x: 110, y: 132, s: 1.3, color: "#4a6fa5" });
    /* A warped grid: how much each line bends depends on strength and where the warp is. */
    const amt = /none/.test(kind) ? 0 : st;
    const wgt = (x, y) => (area === 0 ? Math.min(1, Math.max(Math.abs(x - 110) / 100, Math.abs(y - 75) / 65) ** 3) : area < 1 ? Math.max(0, 1 - Math.hypot(x - 110, y - 90) / 60) : 1);
    const freq = /ripple|water/.test(kind) ? 0.12 : /stir|glassy/.test(kind) ? 0.06 : 0.03;
    for (let gy = 20; gy <= 130; gy += 14) {
      let d = "";
      for (let x = 10; x <= 210; x += 8) d += `${d ? " L" : "M"}${x} ${r1(gy + Math.sin(x * freq + gy) * 10 * amt * wgt(x, gy))}`;
      out += `<path d="${d}" fill="none" stroke="#9fd3ff" stroke-width="1" opacity="0.5"/>`;
    }
    if (/stardust|mist/.test(kind)) out += bits(k, { n: 6 + st * 30, seed: 4, x: 90, y: 50, w: 80, h: 80, r: 1.5, color: "#fff", alpha: 0.8 });
    if (/clones/.test(kind)) out += k.person({ x: 130, y: 132, s: 1.3, color: "#4a6fa5", alpha: r1(0.2 + st * 0.4) });
    /* Over time: bend, then stay bent or settle back. */
    const bs = v.p("bendSpeed");
    const settles = v.p("settles") > 0.5;
    out += envelope(k, { x: 222, y: 24, w: 88, h: 50, rise: (v.n("bendSecs") / 3) * (1.2 - bs), snap: bs, hold: 0.8, fall: settles ? 0.05 + v.n("settleSecs") / 3 : 6 + v.n("settleSecs"), pre: 0.4 + v.n("offsetFrames") / 24, peak: 0.2 + st * 0.7, label: `${v("bendSpeed")}, then ${v("settles")}` });
    out += chips(k, [`set off by ${v("cause")}`], { x: 222, y: 94 });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v.n("strength")}%, ${v("area")}, ${v.n("offsetFrames")} frames`);
  });

  /* Party flash: flashes on the beat, their color and length, saved for the drop. */
  look("partyEffect", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "flash" : raw;
    const st = v.n("strength") / 100;
    const FC = { white: "#ffffff", warm: "#ffb060", cool: "#80c0ff", rainbow: ["#ff6b6b", "#ffd166", "#6bd0ff", "#c79bff"] };
    const fc = FC[v("flashColor")] || "#ffffff";
    const c0 = Array.isArray(fc) ? fc[0] : fc;
    let out = k.bg("#101014") + screen(k, { x: 10, y: 10, w: 200, h: 110, fill: "#1a1a28" });
    out += k.person({ x: 90, y: 112, s: 1, color: "#4a6fa5", arms: 0.9 }) + k.person({ x: 140, y: 112, s: 1, color: "#a54a6f", arms: 0.7 });
    if (!/none/.test(kind)) {
      if (/black/.test(kind)) out += `<rect x="10" y="10" width="200" height="110" fill="#000" opacity="${r1(st * 0.7)}"/>`;
      else if (/shockwave|spotlight/.test(kind)) out += k.ring({ x: 110, y: 65, r: 20 + st * 40, color: c0, w: 3 + st * 5 });
      else if (/cross/.test(kind)) out += `<path d="M10 65 L210 65 M110 10 L110 120" stroke="${c0}" stroke-width="${r1(2 + st * 10)}" opacity="0.7"/>`;
      else if (/jitter|vibration/.test(kind)) out += `<g opacity="0.4" transform="translate(0 ${r1(3 + st * 6)})">${k.person({ x: 90, y: 112, s: 1, color: c0 })}</g>`;
      else out += `<rect x="10" y="10" width="200" height="110" fill="${c0}" opacity="${r1(st * 0.6)}"/>`;
    }
    /* Flashes along the song: how often, on the beat or free, how long, early or late, saved for a moment. */
    const per = [1, 4, 8, 16][Math.round(v.p("every") * 3)];
    const beat = v.p("onBeat") > 0.5;
    const late = (v.n("offsetFrames") / 6) * 0.02;
    const saved = v.p("savedFor");
    const from = saved === 0 ? 0 : saved < 1 ? 0.5 : 0.75;
    const ev = [];
    for (let i = 0; i < per; i++) {
      const t = from + ((i + 0.2) / per) * (1 - from);
      ev.push({ at: (beat ? Math.round(t * 16) / 16 : t + k.rnd(i) * 0.03) + late, w: 1 + v.n("flashFrames") * 0.4, color: Array.isArray(fc) ? fc[i % fc.length] : fc });
    }
    out += beatStrip(k, { x: 10, y: 146, w: 300, beats: 16, gridColor: beat ? "#9fd3ff" : "#333", events: ev, label: `${v("every")}, ${v.n("flashFrames")} frames each, ${v.n("offsetFrames")} off` });
    if (saved > 0) out += `<line x1="${r1(10 + from * 300)}" y1="140" x2="${r1(10 + from * 300)}" y2="166" stroke="#ff6b6b" stroke-width="2"/>` + k.label({ x: 12 + from * 300, y: 134, text: saved < 1 ? "the drop" : "final chorus", size: 8, color: "#ff6b6b", anchor: "start" });
    out += k.label({ x: 222, y: 30, text: `${kind}`, size: r1(k.clamp(92 / (String(kind).length * 0.6), 7, 10)), color: c0, anchor: "start", weight: 700 });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind}, ${v("flashColor")}, ${v.n("strength")}%, ${beat ? "on the beat" : "free"}`);
  });

  /* Blend mode: layers stacked over a picture, mixed by the mode and opacity. */
  look("blendMode", (v, k) => {
    const mode = String(v("setting"));
    const op = v.n("opacity") / 100;
    const layers = v.n("layers");
    const PUR = { texture: "#8a7a5a", "light and flare": "#ffc070", "double exposure": "#6a9ad0", darkening: "#202030" };
    const col = PUR[v("purpose")] || "#8a7a5a";
    const css = { normal: "normal", screen: "screen", multiply: "multiply", overlay: "overlay", lighten: "lighten", darken: "darken", add: "plus-lighter" }[mode] || "normal";
    let out = k.bg("#141418") + screen(k, { x: 10, y: 10, w: 200, h: 130 }) + k.person({ x: 110, y: 132, s: 1.4, color: "#4a6fa5" }) + `<circle cx="170" cy="40" r="14" fill="#ffd27a"/>`;
    for (let i = 0; i < layers; i++) out += `<rect x="${10 + i * 12}" y="${10 + i * 8}" width="${200 - i * 24}" height="${130 - i * 16}" fill="${/double/.test(v("purpose")) && i === 0 ? "#6a9ad0" : col}" opacity="${r1(op * (1 - i * 0.12))}" style="mix-blend-mode:${css}"/>`;
    if (/double/.test(v("purpose"))) out += `<g opacity="${r1(op * 0.6)}">${k.person({ x: 150, y: 132, s: 1.8, color: "#ddd" })}</g>`;
    /* The layer stack on the right. */
    for (let i = 0; i < layers; i++) out += `<rect x="${230 + i * 4}" y="${110 - i * 14}" width="70" height="12" rx="2" fill="${col}" opacity="${r1(0.4 + op * 0.6)}" stroke="#ddd"/>`;
    out += `<rect x="230" y="124" width="70" height="12" rx="2" fill="#2b3a4f" stroke="#ddd"/>` + k.label({ x: 265, y: 148, text: `${layers} layer${layers > 1 ? "s" : ""} · ${mode}`, size: 8, color: "#ccc" });
    out += timeline(k, { x: 230, y: 20, w: 76, max: 2, label: `${v("fadesIn")}`, segs: [{ from: 0, to: [0.05, 0.5, 2][Math.round(v.p("fadesIn") * 2)], color: col }] });
    return out + fitCaption(k, `${mode} at ${v.n("opacity")}% for ${v("purpose")}`);
  });

  /* Stock clip: a film strip with the stock clip placed at the start, middle or end, and how it fits. */
  look("stockClip", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "scenery" : raw;
    const len = v.n("length");
    const fit = v.p("fit");
    const ed = v.p("edited");
    const pl = v.p("placed");
    const use = String(v("use"));
    let out = k.bg("#141418");
    /* The film, with the clip in place. */
    const x0 = 10;
    const W_ = 300;
    out += `<rect x="${x0}" y="30" width="${W_}" height="36" fill="#4a6fa5"/>`;
    const cw = Math.max(4, (len / 30) * 120 * (ed > 0 ? 0.75 : 1));
    const cx = x0 + pl * (W_ - cw);
    const ccol = k.mix("#e09a3a", "#4a6fa5", fit * 0.7);
    if (!/none/.test(kind)) {
      if (/over/.test(use)) out += `<rect x="${r1(cx)}" y="22" width="${r1(cw)}" height="18" fill="${ccol}" stroke="#fff"/>`;
      else if (/background/.test(use)) out += `<rect x="${r1(cx)}" y="48" width="${r1(cw)}" height="26" fill="${ccol}" stroke="#fff" opacity="0.8"/>`;
      else out += `<rect x="${r1(cx)}" y="30" width="${r1(cw)}" height="36" fill="${ccol}" stroke="#fff"/>`;
      out += k.label({ x: k.clamp(cx + cw / 2, 40, 280), y: 90, text: `${len} s ${kind}`, size: 9, color: "#ffd166" });
      if (ed > 0.9) out += `<rect x="${r1(cx)}" y="30" width="${r1(cw)}" height="36" fill="#c79bff" opacity="0.35"/>`;
      if (ed > 0) out += k.label({ x: cx + cw / 2, y: 18, text: "✂", size: 12, color: "#fff" });
    }
    out += k.label({ x: x0, y: 82, text: "opening", size: 8, color: "#888", anchor: "start" }) + k.label({ x: 160, y: 82, text: "middle", size: 8, color: "#888" }) + k.label({ x: 310, y: 82, text: "ending", size: 8, color: "#888", anchor: "end" });
    /* How it sits next to the film's own shots. */
    out += `<rect x="70" y="104" width="80" height="45" fill="#4a6fa5"/><rect x="170" y="104" width="80" height="45" fill="${ccol}" stroke="${fit > 0.9 ? "none" : "#fff"}" stroke-dasharray="3 2"/>` + k.label({ x: 110, y: 160, text: "your shot", size: 8, color: "#ccc" }) + k.label({ x: 210, y: 160, text: v("fit"), size: 8, color: "#ccc" });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind} as ${use}, ${v("placed")}, ${v("edited")}`);
  });

  /* Generated shot: a made-up shot next to filmed ones: what it's made from, its look, how much moves. */
  look("generatedShot", (v, k) => {
    const raw = String(v("setting"));
    const off = raw === "none";
    const kind = off ? "video" : raw;
    const len = v.n("length");
    const style = String(v("style"));
    const bl = v.p("blends");
    const mo = v.p("motion");
    const from = String(v("from"));
    const STY = { "real footage": "#3a6a8a", painterly: "#b0804a", animated: "#e06a9a", dreamlike: "#8a6ad0" };
    const sc = k.mix(STY[style] || "#3a6a8a", "#3a6a8a", bl * 0.6);
    let out = k.bg("#141418");
    /* What it's made from (left), an arrow, the shot (right). */
    if (/description/.test(from)) out += `<rect x="10" y="40" width="70" height="50" rx="4" fill="#f4f1ea"/>` + [0, 1, 2, 3].map((i) => `<rect x="16" y="${48 + i * 10}" width="${50 - i * 8}" height="4" fill="#888"/>`).join("");
    else if (/several/.test(from)) out += [0, 1, 2].map((i) => `<rect x="${10 + i * 6}" y="${40 + i * 6}" width="56" height="38" fill="#3a6a8a" stroke="#ddd"/>`).join("");
    else out += `<rect x="10" y="40" width="70" height="50" fill="#3a6a8a" stroke="#ddd"/>` + k.person({ x: 45, y: 86, s: 0.6 });
    out += k.arrow({ x1: 88, y1: 65, x2: 118, y2: 65 });
    out += `<rect x="126" y="20" width="184" height="100" fill="${sc}" stroke="${bl > 0.9 ? "#3a6a8a" : "#fff"}" stroke-width="2"/>`;
    if (!/none/.test(kind)) {
      if (/painterly/.test(style)) out += bits(k, { n: 30, seed: 3, x: 126, y: 20, w: 184, h: 100, r: 5, color: ["#d0a060", "#8a6a4a"], alpha: 0.5, shape: "leaf" });
      if (/dreamlike/.test(style)) out += `<circle cx="218" cy="70" r="46" fill="#fff" opacity="0.15"/>`;
      out += k.person({ x: 218, y: 112, s: 1, color: "#4a6fa5", walk: mo, arms: mo * 0.5 });
      if (/dialogue/.test(kind)) out += k.person({ x: 268, y: 112, s: 1, color: "#a54a6f" }) + k.bubble({ x: 250, y: 40, text: "…", w: 40, h: 22 });
      if (/image/.test(kind)) out += k.label({ x: 300, y: 34, text: "still", size: 8, color: "#fff", anchor: "end" });
      if (mo > 0) out += windLines(k, { n: Math.round(mo * 6), x: 160, y: 60, w: 40, h: 50, angle: 180, len: 12, alpha: 0.6 });
    }
    out += timeline(k, { x: 126, y: 134, w: 184, max: 30, label: `${len} s`, segs: [{ from: 0, to: len, color: sc }] });
    return out + offNote(k, off, kind) + fitCaption(k, `${kind} from ${from}, ${style}, ${v("blends")}`);
  });

  /* Extra dot grids where two settings pair naturally and the window has no pad yet. */
  pad("breakage", "across", "up", "Across the frame", "Up the frame");
  pad("overlay", "across", "up", "Across", "Up");
  pad("maskShape", "centerAcross", "centerUp", "Center across", "Center up");
  pad("fireLight", "around", "height", "Left or right", "Above or below");
  pad("cutout", "shadowDeg", "shadowLen", "Shadow direction", "Shadow length");
  pad("hairColor", "gray", "streakPct", "Gray", "Highlights");
  pad("lightEffect", "strength", "coverage", "Strength", "Frame filled");
  pad("windForce", "setting", "tilt", "Wind strength", "Up or down");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
