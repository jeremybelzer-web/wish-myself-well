/* Light: the live picture at the top of each light curiosity's window (CuriosityWindows.look).
   Most pictures are one small "test room": a wall with a window, a lamp, a plant and a person seen from the
   chest up. The person's face is lit by a main light whose side, hardness and strength follow the settings,
   and the whole picture can be graded (warmer, paler, darker) through an SVG color filter. These shared
   helpers live on CuriosityWindows.lightLook so look-grade.js can use them too (it reads them when drawing). */
(function (W) {
  const LL = (W.lightLook = W.lightLook || {});
  const r1 = (n) => Math.round(n * 10) / 10;
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const f3 = (n) => (Math.round(cl(n, 0, 1) * 1000) / 1000).toString();

  /* Hues by name, for the many "which color" settings. */
  const HUES = { red: 0, orange: 28, yellow: 50, green: 125, teal: 175, blue: 215, purple: 275, pink: 330, magenta: 310, "cool blue": 215, "warm orange": 28, neutral: null };
  LL.hueOf = (name) => (Object.prototype.hasOwnProperty.call(HUES, name) ? HUES[name] : null);
  /* A hue as red/green/blue offsets around gray (each about -0.5..0.5), times a. */
  LL.hueRGB = (h, a) => {
    if (h == null) return [0, 0, 0];
    const f = (n) => {
      const kk = (n + h / 30) % 12;
      return 0.5 - 0.5 * Math.max(-1, Math.min(kk - 3, 9 - kk, 1));
    };
    const c = [f(0), f(8), f(4)];
    const m = (c[0] + c[1] + c[2]) / 3;
    return c.map((x) => (x - m) * (a == null ? 1 : a));
  };
  /* A hue as a #rrggbb color (so the kit's mix() works on it). */
  LL.hueCss = (h, s, l) => {
    const S = (h == null ? 0 : s == null ? 75 : s) / 100;
    const Lg = (l == null ? 55 : l) / 100;
    const H = (((h || 0) % 360) + 360) % 360;
    const f = (n) => {
      const kk = (n + H / 30) % 12;
      const c = Lg - S * Math.min(Lg, 1 - Lg) * Math.max(-1, Math.min(kk - 3, 9 - kk, 1));
      return Math.round(cl(c, 0, 1) * 255).toString(16).padStart(2, "0");
    };
    return "#" + f(0) + f(8) + f(4);
  };
  /* Warm (+) or cool (-) as red/green/blue offsets. */
  LL.warmRGB = (w) => [0.13 * w, 0.025 * w, -0.13 * w];

  /* A tone curve: bright -1..1 (lift all), contrast -1..1, lift 0..1 (raise the blacks), cap 0..1 (lower the
     whites), mid -1..1 (bend the middle), crush 0..1 (blacks to pure black), clip 0..1 (whites burn out). */
  LL.curve = (o) => (x) => {
    o = o || {};
    let y = x;
    if (o.mid) y = Math.pow(y, Math.pow(2, -o.mid * 1.2));
    if (o.s) y = y + o.s * 0.5 * Math.sin((y - 0.5) * Math.PI * 2) * -0.25 * 2;
    if (o.contrast) y = 0.5 + (y - 0.5) * (1 + o.contrast * 1.1);
    if (o.bright) y = y + o.bright * 0.45;
    if (o.crush) y = (y - o.crush * 0.35) / (1 - o.crush * 0.35);
    if (o.clip) y = y / (1 - o.clip * 0.45);
    if (o.lift || o.cap) y = (o.lift || 0) * 0.6 + y * (1 - (o.lift || 0) * 0.6 - (o.cap || 0) * 0.6);
    if (o.invert) y = 1 - y;
    return y;
  };

  /* An SVG color filter for a whole picture. o: sat (1 normal), curve(x) for all three colors, tone(x) gives
     [r,g,b] offsets at brightness x (for tints and split toning), blur in px, sepia 0..1. */
  LL.fx = (fid, o) => {
    o = o || {};
    const N = 12;
    const tab = (ch) => {
      const a = [];
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        let y = o.curve ? o.curve(x) : x;
        if (o.tone) y += o.tone(cl(y, 0, 1))[ch];
        a.push(f3(y));
      }
      return a.join(" ");
    };
    const sat = cl(o.sat == null ? 1 : o.sat, 0, 3);
    const sep = cl(o.sepia || 0, 0, 1);
    const sepM = sep ? `<feColorMatrix type="matrix" values="${[
      [0.393, 0.769, 0.189],
      [0.349, 0.686, 0.168],
      [0.272, 0.534, 0.131],
    ].map((row, i) => row.map((c, j) => r1((sep * c + (1 - sep) * (i === j ? 1 : 0)) * 1000) / 1000).join(" ") + " 0 0").join(" ")} 0 0 0 1 0"/>` : "";
    return `<filter id="${fid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${o.blur ? `<feGaussianBlur stdDeviation="${r1(o.blur)}"/>` : ""}${sat !== 1 ? `<feColorMatrix type="saturate" values="${Math.round(sat * 100) / 100}"/>` : ""}${sepM}<feComponentTransfer><feFuncR type="table" tableValues="${tab(0)}"/><feFuncG type="table" tableValues="${tab(1)}"/><feFuncB type="table" tableValues="${tab(2)}"/></feComponentTransfer></filter>`;
  };
  /* Wrap a picture in a filter: returns defs + group. */
  LL.graded = (fid, o, inner) => `<defs>${LL.fx(fid, o)}</defs><g filter="url(#${fid})">${inner}</g>`;

  /* ---------- the test room ---------- */
  const WALL = "#b9a58c";
  const FLOOR = "#6d5a48";
  const SKIN = "#e8b894";
  LL.HEAD = { x: 160, y: 80, r: 27 };
  /* The person's outline, head and shoulders. */
  LL.bustPath = (x, y, r) => `M${r1(x - 58)} 180 L${r1(x - 50)} ${r1(y + r + 30)} Q${r1(x - 46)} ${r1(y + r + 14)} ${r1(x - 20)} ${r1(y + r + 10)} L${r1(x - 9)} ${r1(y + r - 2)} L${r1(x + 9)} ${r1(y + r - 2)} L${r1(x + 20)} ${r1(y + r + 10)} Q${r1(x + 46)} ${r1(y + r + 14)} ${r1(x + 50)} ${r1(y + r + 30)} L${r1(x + 58)} 180 Z`;

  /* The room behind the person. o: wall, floor, win (0..1 window light, false for none), sky, sun {x,y,r},
     clouds 0..1, lamp {on 0..1, color, x, y, glow 0..1, kind}, plant, pools [{x,y,rx,a,color}], props string. */
  LL.room = (o, k) => {
    o = o || {};
    const win = o.win === false ? "" : (() => {
      const wl = o.win == null ? 0.85 : o.win;
      const sky = o.sky || k.mix("#1b2438", "#8cc0ea", wl);
      const sun = o.sun ? `<circle cx="${r1(o.sun.x)}" cy="${r1(o.sun.y)}" r="${r1(o.sun.r || 6)}" fill="${o.sun.color || "#fff1b8"}"/>` : "";
      const clouds = o.clouds ? `<g fill="#e8eaee" opacity="${r1(cl(o.clouds, 0, 1) * 0.9 * 10) / 10}"><ellipse cx="40" cy="36" rx="${r1(8 + o.clouds * 14)}" ry="${r1(4 + o.clouds * 6)}"/><ellipse cx="62" cy="48" rx="${r1(6 + o.clouds * 14)}" ry="${r1(3 + o.clouds * 6)}"/></g>` : "";
      return `<clipPath id="${o.id || "cw-ll"}-win"><rect x="22" y="22" width="56" height="52"/></clipPath><g clip-path="url(#${o.id || "cw-ll"}-win)"><rect x="22" y="22" width="56" height="52" fill="${sky}"/>${sun}${clouds}<path d="M22 74 L36 58 L48 66 L62 52 L78 70 L78 74 Z" fill="${k.mix("#1d3322", "#4f8a4a", wl)}"/></g><rect x="22" y="22" width="56" height="52" fill="none" stroke="#3a2e24" stroke-width="3"/><line x1="50" y1="22" x2="50" y2="74" stroke="#3a2e24" stroke-width="2"/>`;
    })();
    const lamp = o.lamp ? (() => {
      const L = o.lamp;
      const x = L.x == null ? 262 : L.x;
      const y = L.y == null ? 70 : L.y;
      const on = cl(L.on == null ? 1 : L.on, 0, 1);
      const col = L.color || "#ffcf7a";
      const glow = cl(L.glow == null ? on : L.glow, 0, 1.5);
      return `${glow > 0.02 ? `<circle cx="${x}" cy="${y}" r="${r1(10 + glow * 30)}" fill="${col}" opacity="${r1(glow * 0.35 * 100) / 100}"/>` : ""}<line x1="${x}" y1="${y + 8}" x2="${x}" y2="120" stroke="#3a2e24" stroke-width="3"/><path d="M${x - 13} ${y + 8} L${x - 8} ${y - 10} L${x + 8} ${y - 10} L${x + 13} ${y + 8} Z" fill="${k.mix("#6a5a40", col, on)}" stroke="#3a2e24" stroke-width="1.5"/>`;
    })() : "";
    const plant = o.plant === false ? "" : `<rect x="288" y="104" width="18" height="18" fill="#a0522d" stroke="#3a2e24"/><g fill="${o.plantColor || "#3f8f3a"}"><ellipse cx="290" cy="96" rx="9" ry="13" transform="rotate(-25 290 96)"/><ellipse cx="304" cy="94" rx="9" ry="14" transform="rotate(25 304 94)"/><ellipse cx="297" cy="88" rx="7" ry="13"/></g>`;
    const pools = (o.pools || []).map((p) => `<ellipse cx="${r1(p.x)}" cy="${r1(p.y == null ? 140 : p.y)}" rx="${r1(p.rx || 30)}" ry="${r1((p.rx || 30) * 0.3)}" fill="${p.color || "#ffe9b0"}" opacity="${r1(cl(p.a == null ? 0.5 : p.a, 0, 1) * 100) / 100}"/>`).join("");
    return `<rect x="0" y="0" width="320" height="122" fill="${o.wall || WALL}"/><rect x="0" y="122" width="320" height="58" fill="${o.floor || FLOOR}"/>${win}${lamp}${plant}${pools}${o.props || ""}`;
  };

  /* The person, lit. o: x, y, r, shirt, skin, mood, look, key {ang (light comes from: 180 left, 0 right, -90 top,
     90 below), dark 0..1 (how dark the shadow side is), soft 0..1, lit 0..1 (share of the face in light),
     color, colorA}, rim {side -1 left, 0 both, 1 right, w px, color, a}, sparkle 0..1, dim 0..1 (whole person
     darker), glow {color, a, where} light through skin, shine 0..1 shine spots, flush color. */
  LL.bust = (o, k, id) => {
    o = o || {};
    const x = o.x == null ? LL.HEAD.x : o.x;
    const y = o.y == null ? LL.HEAD.y : o.y;
    const r = o.r || LL.HEAD.r;
    const skin = o.skin || SKIN;
    const shape = `<circle cx="${x}" cy="${y}" r="${r}"/><path d="${LL.bustPath(x, y, r)}"/>`;
    const clip = `<clipPath id="${id}-bust">${shape}</clipPath>`;
    const key = o.key || {};
    const dark = cl(key.dark == null ? 0.55 : key.dark, 0, 1);
    const soft = cl(key.soft == null ? 0.3 : key.soft, 0, 1);
    const lit = cl(key.lit == null ? 0.5 : key.lit, 0, 1);
    const ang = key.ang == null ? 180 : key.ang;
    const t = r * 1.6 * (1 - 2 * lit);
    const blur = soft > 0.02 ? `<filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r1(soft * 12)}"/></filter>` : "";
    const shade = dark > 0.01 && !key.none ? `<g${blur ? ` filter="url(#${id}-soft)"` : ""}><g transform="translate(${x} ${y}) rotate(${r1(ang)})"><rect x="-400" y="-400" width="${r1(Math.max(0, 400 + t))}" height="800" fill="#0b0a12" opacity="${r1(dark * 0.85 * 100) / 100}"/></g></g>` : "";
    const keyCol = key.color && key.colorA ? `<g transform="translate(${x} ${y}) rotate(${r1(ang)})"><rect x="${r1(t)}" y="-400" width="400" height="800" fill="${key.color}" opacity="${r1(cl(key.colorA, 0, 1) * 100) / 100}"/></g>` : "";
    const dim = o.dim ? `<rect x="0" y="0" width="320" height="180" fill="#000" opacity="${r1(cl(o.dim, 0, 1) * 100) / 100}"/>` : "";
    const glowS = o.glow && o.glow.a ? (() => {
      const g = o.glow;
      const wh = g.where || "whole face";
      const spots = /ears/.test(wh) ? [[x - r, y + 2, r * 0.3], [x + r, y + 2, r * 0.3]] : /nose/.test(wh) ? [[x, y + 4, r * 0.25], [x - r * 0.5, y + 8, r * 0.3], [x + r * 0.5, y + 8, r * 0.3]] : /hands/.test(wh) ? [[x - 40, y + r + 40, 12], [x + 40, y + r + 40, 12]] : [[x, y, r * 0.95]];
      const ears = /ears/.test(wh) ? `<g fill="${skin}" stroke="#1c1712" stroke-width="1.2"><ellipse cx="${x - r}" cy="${y + 2}" rx="5" ry="8"/><ellipse cx="${x + r}" cy="${y + 2}" rx="5" ry="8"/></g>` : "";
      return ears + spots.map(([sx, sy, sr]) => `<circle cx="${r1(sx)}" cy="${r1(sy)}" r="${r1(sr)}" fill="${g.color}" opacity="${r1(cl(g.a, 0, 1) * 0.75 * 100) / 100}" filter="url(#${id}-gl)"/>`).join("");
    })() : "";
    const glowF = o.glow && o.glow.a ? `<filter id="${id}-gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r1(2 + (o.glow.depth || 0) * 6)}"/></filter>` : "";
    const hands = o.glow && o.glow.a && /hands/.test(o.glow.where || "") ? `<g fill="${skin}" stroke="#1c1712" stroke-width="1.2"><circle cx="${x - 40}" cy="${y + r + 40}" r="10"/><circle cx="${x + 40}" cy="${y + r + 40}" r="10"/></g>` : "";
    const shine = o.shine ? [[x - r * 0.35, y - r * 0.55, 1], [x + r * 0.05, y + r * 0.1, 0.7], [x + r * 0.45, y - r * 0.1, 0.6]].slice(0, 1 + Math.round(cl(o.shineN == null ? o.shine : o.shineN, 0, 1) * 2)).map(([sx, sy, m]) => `<ellipse cx="${r1(sx)}" cy="${r1(sy)}" rx="${r1(r * (0.08 + (o.shineSize == null ? 0.15 : o.shineSize) * 0.25) * m)}" ry="${r1(r * (0.05 + (o.shineSize == null ? 0.15 : o.shineSize) * 0.12) * m)}" fill="#fff" opacity="${r1(cl(o.shine, 0, 1) * 0.9 * 100) / 100}"/>`).join("") : "";
    const flush = o.flush ? `<g fill="${o.flushColor || "#e0473a"}" opacity="${r1(cl(o.flush, 0, 1) * 0.7 * 100) / 100}"><ellipse cx="${x - r * 0.5}" cy="${y + r * 0.25}" rx="${r1(r * 0.24)}" ry="${r1(r * 0.15)}"/><ellipse cx="${x + r * 0.5}" cy="${y + r * 0.25}" rx="${r1(r * 0.24)}" ry="${r1(r * 0.15)}"/></g>` : "";
    const pores = o.pores ? Array.from({ length: Math.round(o.pores * 40) }, (_, i) => `<circle cx="${r1(x - r * 0.7 + k.rnd(i + 2) * r * 1.4)}" cy="${r1(y - r * 0.2 + k.rnd(i + 40) * r * 0.8)}" r="0.7" fill="#7a4a30" opacity="0.6"/>`).join("") : "";
    const rim = o.rim && o.rim.a > 0.01 && o.rim.w > 0.1 ? (() => {
      const R = o.rim;
      const side = R.side || 0;
      const cr = side < 0 ? `<rect x="0" y="0" width="${x - r * 0.2}" height="180"/>` : side > 0 ? `<rect x="${x + r * 0.2}" y="0" width="320" height="180"/>` : `<rect x="0" y="0" width="320" height="180"/>`;
      return `<clipPath id="${id}-rimc">${cr}</clipPath><g clip-path="url(#${id}-rimc)" fill="none" stroke="${R.color || "#fff6dc"}" stroke-width="${r1(R.w)}" opacity="${r1(cl(R.a, 0, 1) * 100) / 100}" stroke-linejoin="round"><circle cx="${x}" cy="${y}" r="${r}"/><path d="${LL.bustPath(x, y, r)}"/></g>`;
    })() : "";
    const sparkle = o.sparkle ? [-1, 1].map((sd) => `<circle cx="${r1(x + sd * r * 0.38 + r * 0.05)}" cy="${r1(y - r * 0.2)}" r="${r1(0.6 + o.sparkle * r * 0.07)}" fill="#fff"/>`).join("") : "";
    const body = `<path d="${LL.bustPath(x, y, r)}" fill="${o.shirt || "#c0392b"}" stroke="#1c1712" stroke-width="2"/>${k.face({ x, y, r, mood: o.mood == null ? 0.2 : o.mood, look: o.look || 0, color: skin, eyes: o.eyes })}`;
    return `<defs>${clip}${blur}${glowF}</defs>${hands}${body}${flush}${pores}${glowS}${shine}<g clip-path="url(#${id}-bust)">${keyCol}${shade}${dim}</g>${rim}${sparkle}`;
  };

  /* Light patterns thrown on the wall (blinds, leaves, barndoor). o: kind, size 0..1, ang, a, blur 0..1,
     share 0..1 (how much of the width), y0/y1 band, shift (slides). */
  LL.pattern = (o, k, id) => {
    o = o || {};
    if (!o.kind || !o.a) return "";
    const share = cl(o.share == null ? 1 : o.share, 0.02, 1);
    const y0 = o.y0 == null ? 0 : o.y0;
    const y1 = o.y1 == null ? 122 : o.y1;
    const sz = cl(o.size == null ? 0.4 : o.size, 0, 1);
    const sh = o.shift || 0;
    let shapes = "";
    if (o.kind === "blinds") {
      const step = 6 + sz * 22;
      for (let yy = -200; yy < 400; yy += step) shapes += `<rect x="-200" y="${r1(yy + sh)}" width="720" height="${r1(step * 0.45)}"/>`;
    } else if (o.kind === "leaves") {
      for (let i = 0; i < 46; i++) shapes += `<ellipse cx="${r1(k.rnd(i + 5) * 340 - 10 + sh)}" cy="${r1(k.rnd(i + 77) * 200 - 10)}" rx="${r1(4 + sz * 16 * (0.5 + k.rnd(i + 9)))}" ry="${r1(3 + sz * 9 * (0.5 + k.rnd(i + 19)))}"/>`;
    } else if (o.kind === "open") {
      const w = 50 + sz * 150;
      const blurO = o.blur ? `<filter id="${id}-pb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${r1(o.blur * 6)}"/></filter>` : "";
      return `<defs><clipPath id="${id}-pc"><rect x="0" y="${y0}" width="${r1(320 * share)}" height="${y1 - y0}"/></clipPath>${blurO}</defs><g clip-path="url(#${id}-pc)"><g fill="#fff6dc" opacity="${r1(cl(o.a, 0, 1) * 0.45 * 100) / 100}"${blurO ? ` filter="url(#${id}-pb)"` : ""}><rect x="${r1(160 - w / 2 + sh)}" y="${r1(y0 + 6)}" width="${r1(w)}" height="${r1((y1 - y0) * 0.8)}" transform="rotate(${r1(o.ang || 0)} 160 ${r1((y0 + y1) / 2)})"/></g></g>`;
    } else {
      const w = 60 + sz * 160;
      shapes = `<path d="M-200 -200 L520 -200 L520 400 L-200 400 Z M${r1(160 - w / 2 + sh)} -10 L${r1(160 + w / 2 + sh)} -10 L${r1(160 + w * 0.7 + sh)} 200 L${r1(160 - w * 0.7 + sh)} 200 Z" fill-rule="evenodd"/>`;
    }
    const blur = o.blur ? `<filter id="${id}-pb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${r1(o.blur * 6)}"/></filter>` : "";
    return `<defs><clipPath id="${id}-pc"><rect x="0" y="${y0}" width="${r1(320 * share)}" height="${y1 - y0}"/></clipPath>${blur}</defs><g clip-path="url(#${id}-pc)"><g fill="#120d08" opacity="${r1(cl(o.a, 0, 1) * 0.7 * 100) / 100}"${blur ? ` filter="url(#${id}-pb)"` : ""}><g transform="rotate(${r1(o.ang || 0)} 160 60)">${shapes}</g></g></g>`;
  };

  /* Haze over the picture, thicker far away (top) when depth > 0. Beams: {n, ang, a, x, y, spread}. */
  LL.haze = (o, k, id) => {
    o = o || {};
    const a = cl(o.a || 0, 0, 1);
    const col = o.color || "#d8dde4";
    const depth = cl(o.depth == null ? 0.4 : o.depth, 0, 1);
    const g = a > 0.01 ? `<defs><linearGradient id="${id}-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity="${r1(a * (0.45 + depth * 0.5) * 100) / 100}"/><stop offset="1" stop-color="${col}" stop-opacity="${r1(a * 0.45 * (1 - depth * 0.7) * 100) / 100}"/></linearGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-hz)"/>` : "";
    const b = o.beams || {};
    const beams = b.n && b.a ? Array.from({ length: b.n }, (_, i) => k.beam({ x: (b.x == null ? 50 : b.x) + i * 4, y: (b.y == null ? 40 : b.y) + i * 7, dir: (b.ang == null ? 25 : b.ang) + (i - (b.n - 1) / 2) * 3, len: 320, spread: b.spread || 8, color: b.color || "#fff4d6", alpha: cl(b.a, 0, 1) * 0.45 })).join("") : "";
    const swirl = o.swirl ? Array.from({ length: 4 }, (_, i) => `<path d="M${20 + i * 75} ${110 - i * 12} q20 -${r1(4 + o.swirl * 16)} 40 0 t40 0" fill="none" stroke="${col}" stroke-width="3" opacity="${r1(0.25 + a * 0.4)}"/>`).join("") : "";
    return g + beams + swirl;
  };

  /* The whole test scene. o: room {...}, bust {...} or false, pattern {...}, haze {...}, roomDim 0..1, over
     (string drawn on top before grading), under (drawn between room and person), grade (LL.fx options). */
  LL.scene = (o, k, id) => {
    o = o || {};
    const roomDim = o.roomDim ? `<rect x="0" y="0" width="320" height="180" fill="#000" opacity="${r1(cl(o.roomDim, 0, 1) * 100) / 100}"/>` : "";
    const inner = LL.room(Object.assign({ id }, o.room), k) + LL.pattern(o.pattern, k, id) + roomDim + (o.under || "") + (o.bust === false ? "" : LL.bust(o.bust, k, id)) + LL.haze(o.haze, k, id) + (o.over || "");
    return o.grade ? LL.graded(`${id}-fx`, o.grade, inner) : inner;
  };

  /* ---------- small marks ---------- */
  LL.box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#141418" opacity="0.82" stroke="#444"/>`;
  LL.chip = (k, x, y, text, color) => {
    const w = Math.max(30, String(text).length * 5.2 + 12);
    return `<rect x="${r1(x)}" y="${r1(y - 10)}" width="${r1(w)}" height="14" rx="7" fill="${color || "#2b2b33"}" opacity="0.9" stroke="#555"/>${k.label({ x: x + w / 2, y: y + 0.5, text, size: 8, color: "#eee" })}`;
  };
  /* A row of tick marks for "per second / per minute" rates: n ticks across w. */
  LL.ticks = (k, x, y, w, n, color, label) => {
    const N = Math.round(cl(n, 0, 40));
    const t = Array.from({ length: N }, (_, i) => `<line x1="${r1(x + ((i + 0.5) / Math.max(1, N)) * w)}" y1="${y - 5}" x2="${r1(x + ((i + 0.5) / Math.max(1, N)) * w)}" y2="${y + 5}" stroke="${color || "#ffd166"}" stroke-width="2"/>`).join("");
    const lw = label ? String(label).length * 4.6 + 6 : 0;
    return `${label ? `<rect x="${r1(x - 3)}" y="${y - 17}" width="${r1(lw)}" height="11" rx="3" fill="#141418" opacity="0.8"/>` : ""}<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="#555" stroke-width="1"/>${t}${label ? k.label({ x, y: y - 8, text: label, size: 8, anchor: "start", color: "#eee" }) : ""}`;
  };
  /* A small timeline: a value that holds, then moves to a new level over a ramp, around a beat mark.
     o: x, y, w, h, from 0..1, to 0..1, at 0..1 (where the move starts), len 0..1 (how long), beat 0..1 (mark),
     beatLabel, color, title, steps (draw as a staircase). */
  LL.ramp = (k, o) => {
    const x = o.x;
    const y = o.y;
    const w = o.w;
    const h = o.h;
    const Y = (p) => r1(y + h - cl(p, 0, 1) * h);
    const a = x + cl(o.at == null ? 0.4 : o.at, 0, 1) * w;
    const b = Math.min(x + w, a + Math.max(0.5, cl(o.len == null ? 0.2 : o.len, 0, 1) * w));
    const pts = o.steps ? `${x},${Y(o.from)} ${r1(a)},${Y(o.from)} ${r1(a)},${Y((o.from + o.to) / 2)} ${r1((a + b) / 2)},${Y((o.from + o.to) / 2)} ${r1((a + b) / 2)},${Y(o.to)} ${x + w},${Y(o.to)}` : `${x},${Y(o.from)} ${r1(a)},${Y(o.from)} ${r1(b)},${Y(o.to)} ${x + w},${Y(o.to)}`;
    const bx = o.beat == null ? null : x + cl(o.beat, 0, 1) * w;
    return `${LL.box(x - 6, y - 14, w + 12, h + 22)}${o.title ? k.label({ x: x - 1, y: y - 4, text: o.title, size: 8, anchor: "start", color: "#ccc" }) : ""}${bx != null ? `<line x1="${r1(bx)}" y1="${y}" x2="${r1(bx)}" y2="${y + h}" stroke="#e85d75" stroke-width="1.5" stroke-dasharray="2 2"/>${o.beatLabel ? k.label({ x: bx, y: y + h + 6, text: o.beatLabel, size: 7, color: "#e85d75" }) : ""}` : ""}<polyline points="${pts}" fill="none" stroke="${o.color || "#ffd166"}" stroke-width="2"/>`;
  };
  /* The bottom caption, shrunk to fit the width when the words run long. */
  LL.caption = (k, text) => {
    const t = String(text);
    const size = r1(cl(300 / Math.max(1, t.length * 0.55), 7, 10));
    return `<rect x="0" y="162" width="320" height="18" fill="rgba(0,0,0,0.55)"/>` + k.label({ x: 160, y: 175, text: t, size, color: "#f4f4f4" });
  };
  /* A chip that ends at xr (for the right-hand corner). */
  LL.chipR = (k, xr, y, text, color) => LL.chip(k, xr - Math.max(30, String(text).length * 5.2 + 12), y, text, color);
  /* A number without float noise (0.30000000000000004 -> 0.3). */
  LL.num = (n) => String(Math.round(Number(n) * 100) / 100);
  LL.word = (v, sid) => String(v(sid));
  /* The index of a setting on its scale (0, 1, 2...). */
  LL.idx = (v, sid) => {
    const s = v.slider(sid);
    return s && Array.isArray(s.scale) ? Math.max(0, s.scale.findIndex((o) => String(o) === String(v(sid)))) : 0;
  };

  /* Where a "main light" word puts the light. */
  LL.keyDir = (w) =>
    ({ side: { ang: 180, dark: 0.75, lit: 0.5 }, front: { ang: 200, dark: 0.25, lit: 0.85 }, back: { ang: 0, dark: 0.85, lit: 0.08, rim: 1 }, under: { ang: 90, dark: 0.7, lit: 0.45 }, none: { ang: 180, dark: 0, lit: 1, none: true, dim: 0.55 } })[w] || { ang: 180, dark: 0.6, lit: 0.5 };
  /* Kelvin as warm (+) or cool (-), about -1..1, with 5600 K neutral. */
  LL.kelvinWarm = (K) => cl((5600 - K) / 3600, -1.2, 1.2);

  /* ================= the pictures ================= */

  /* When the light changes: before on the left, after on the right, and a timeline of the change. */
  W.look("lightChange", (v, k) => {
    const id = "cw-lightChange";
    const dirI = LL.idx(v, "direction") - 2;
    const stops = v.n("changeStops");
    const size = v.n("size");
    const never = v.is("setting", /never/);
    const sign = Math.sign(stops + dirI) || 1;
    const delta = cl(stops * 0.07 + dirI * 0.09 + sign * size * 0.035, -0.6, 0.6);
    const area = v.p("changeArea");
    const eye = LL.idx(v, "eyeLead");
    const before = LL.scene({ room: { lamp: { on: 0.6 } }, bust: { key: { dark: 0.5 } } }, k, id + "-a");
    const after = LL.scene({ room: { lamp: { on: delta > 0 ? 1 : 0.2 } }, bust: { key: { dark: 0.5 } }, grade: { curve: LL.curve({ bright: delta * 1.6 }) } }, k, id + "-b");
    const ax = 160 + (1 - area) * 160 * 0.5;
    const eyeMark = eye === 0 ? "" : eye === 1 ? k.ring({ x: 300, y: 18, r: 12, color: "#ffd166" }) : eye === 2 ? k.ring({ x: 160, y: 80, r: 33, color: "#ffd166" }) : k.arrow({ x1: 250, y1: 30, x2: 314, y2: 30 });
    const rampLen = (v.n("rampTime") / 30) * 0.6 + (1 - v.p("speed")) * 0.3;
    const lead = v.n("lead");
    const beatLbl = never ? "no change" : v("setting").replace(/^on the |^during the /, "");
    return `${k.bg("#111")}${before}<clipPath id="${id}-r"><rect x="${r1(ax)}" y="0" width="${r1(320 - ax)}" height="180"/></clipPath><g clip-path="url(#${id}-r)">${after}</g>${ax > 161 ? `<rect x="${r1(ax)}" y="0" width="${r1(320 - ax)}" height="180" fill="none" stroke="#ffd166" stroke-dasharray="3 3"/>` : ""}<line x1="160" y1="0" x2="160" y2="162" stroke="#fff" stroke-width="2"/>${k.text({ x: 80, y: 15, text: "before", size: 10, weight: 700, outline: "#000", outlineW: 3 })}${k.text({ x: 240, y: 15, text: never ? "after (no change)" : "after", size: 10, weight: 700, outline: "#000", outlineW: 3 })}${eyeMark}${LL.ramp(k, { x: 14, y: 116, w: 120, h: 26, from: 0.5, to: 0.5 + delta * 0.8, at: 0.45 + lead * 0.1, len: rampLen, beat: 0.45, beatLabel: beatLbl, title: "brightness", color: never ? "#777" : "#ffd166" })}${LL.chip(k, 176, 158 - 10, "set off by " + v("trigger"))}${LL.caption(k, never ? "The light never changes" : `${delta >= 0 ? "Brighter" : "Darker"} ${v("setting")}, ${v.n("rampTime")} s ramp`)}`;
  });

  /* Time of day: the sun's place, the sky, the length of the shadow and a clock. */
  W.look("timeOfDay", (v, k) => {
    const id = "cw-timeOfDay";
    const tod = LL.idx(v, "setting"); // dawn day dusk night
    const hour = v.n("hour");
    const sunH = v.n("sunHeight") / 90;
    const night = tod === 3;
    const skyI = LL.idx(v, "sky") / 4;
    const skyCol = night ? "#0e1428" : tod === 0 ? k.mix("#f2a6a0", "#9cc4e6", sunH) : tod === 2 ? k.mix("#e8743b", "#e8b26a", sunH) : k.mix("#9cc4e6", "#4f8fd6", sunH);
    const sky = k.mix(skyCol, "#7d828c", skyI * 0.8);
    const side = v.n("sunFromCamera");
    const sunX = 50 + (side / 180) * 24;
    const sunY = 70 - sunH * 44;
    const shadowL = [10, 30, 60, 100][LL.idx(v, "shadowLength")];
    const shDir = side >= 0 ? -1 : 1;
    const warm = night ? -0.6 : tod === 0 ? 0.3 : tod === 2 ? 0.7 : 0;
    const bright = night ? -0.4 : 0.05 - (1 - sunH) * 0.15 - skyI * 0.12;
    const shadow = `<ellipse cx="${r1(160 + shDir * shadowL * 0.6)}" cy="170" rx="${r1(30 + shadowL * 0.6)}" ry="6" fill="#000" opacity="${r1(0.45 - skyI * 0.3)}"/>`;
    const pace = LL.idx(v, "clockPace");
    const passed = v.n("timePassed");
    const clock = `${LL.box(240, 96, 74, 62)}${k.clock({ x: 262, y: 124, r: 16, p: (hour % 12) / 12 })}<path d="M262 124 L262 108 A16 16 0 ${passed / 720 > 0.5 ? 1 : 0} 1 ${r1(262 + Math.sin((passed / 720) * Math.PI * 2) * 16)} ${r1(124 - Math.cos((passed / 720) * Math.PI * 2) * 16)} Z" fill="#ffd166" opacity="${passed ? 0.45 : 0}"/>${k.label({ x: 296, y: 116, text: `${hour}:00`, size: 9 })}${k.label({ x: 296, y: 128, text: `+${passed}m`, size: 8, color: "#ffd166" })}${LL.ticks(k, 246, 150, 62, [0, 2, 6, 14][pace], "#9fd3ff")}`;
    return `${LL.scene({ room: { sky, win: night ? 0.1 : 0.9, sun: night ? { x: sunX, y: 40, r: 5, color: "#e8ecf7" } : { x: sunX, y: sunY, r: 6 + (1 - sunH) * 3, color: tod === 2 ? "#ffb070" : "#fff1b8" }, clouds: skyI, lamp: { on: night ? 1 : 0.2 } }, under: shadow, bust: { key: { ang: side >= 0 ? 180 : 0, dark: 0.3 + sunH * 0.4 - skyI * 0.25, soft: skyI } }, grade: { curve: LL.curve({ bright }), tone: () => LL.warmRGB(warm) } }, k, id)}${clock}${LL.caption(k, `${v("setting")}, ${v("sky")} sky, time ${v("clockPace")}`)}`;
  });

  /* A light you can see in the shot: what it is, how many, where, how bright, flicker. */
  W.look("practicalInFrame", (v, k) => {
    const id = "cw-practicalInFrame";
    const shown = v.is("setting", /yes/);
    const n0 = shown ? Math.max(0, Math.round(v.n("count"))) : 0;
    const n = Math.max(1, n0);
    const kind = v("kind");
    const br = v.p("brightness");
    const vs = v.p("vsFaces");
    const col = { lamp: "#ffcf7a", candle: "#ffb347", screen: "#9ecbff", "neon sign": "#ff5fa2", fire: "#ff8a3c", window: "#e6f0f7" }[kind] || "#ffcf7a";
    const flick = LL.idx(v, "flicker") / 3;
    const px = 20 + v.p("placeX") * 270;
    const py = 150 - v.p("placeY") * 120;
    const far = v.p("fromFaces");
    const sz = 1.2 - far * 0.6;
    const glow = (0.3 + br * 0.7) * (0.5 + vs * 0.7) * (1 - flick * 0.4);
    const icon = (x, y, i) => {
      const s = sz * (i ? 0.7 : 1);
      const body = kind === "candle" ? `<rect x="${r1(x - 3 * s)}" y="${r1(y)}" width="${r1(6 * s)}" height="${r1(14 * s)}" fill="#f3ead8"/><ellipse cx="${x}" cy="${r1(y - 4 * s)}" rx="${r1(3 * s)}" ry="${r1(6 * s)}" fill="${col}"/>` : kind === "screen" ? `<rect x="${r1(x - 12 * s)}" y="${r1(y - 9 * s)}" width="${r1(24 * s)}" height="${r1(17 * s)}" fill="${col}" stroke="#222" stroke-width="2"/>` : kind === "neon sign" ? `<text x="${x}" y="${r1(y + 4)}" font-size="${r1(12 * s)}" fill="${col}" text-anchor="middle" font-family="system-ui" font-weight="700">OPEN</text>` : kind === "fire" ? `<path d="M${r1(x - 8 * s)} ${r1(y + 8 * s)} Q${x} ${r1(y - 18 * s)} ${r1(x + 8 * s)} ${r1(y + 8 * s)} Z" fill="${col}"/>` : kind === "window" ? `<rect x="${r1(x - 10 * s)}" y="${r1(y - 12 * s)}" width="${r1(20 * s)}" height="${r1(24 * s)}" fill="${col}" stroke="#3a2e24" stroke-width="2"/>` : `<path d="M${r1(x - 9 * s)} ${r1(y + 5 * s)} L${r1(x - 6 * s)} ${r1(y - 7 * s)} L${r1(x + 6 * s)} ${r1(y - 7 * s)} L${r1(x + 9 * s)} ${r1(y + 5 * s)} Z" fill="${col}" stroke="#3a2e24" stroke-width="1.5"/>`;
      return `<g opacity="${i < n0 ? 1 : 0.3}"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1((12 + glow * 26) * s)}" fill="${col}" opacity="${r1(cl(glow, 0, 1) * 0.45 * 100) / 100}"/>${body}</g>`;
    };
    const lamps = Array.from({ length: n }, (_, i) => icon(i === 0 ? px : 20 + k.rnd(i + 3) * 280, i === 0 ? py : 30 + k.rnd(i + 11) * 70, i)).join("");
    const works = LL.idx(v, "doesWork") / 2;
    const drawsEye = LL.idx(v, "drawsEye") / 3;
    const sw = { "stays on": "", "turns on": "off → on", "turns off": "on → off", "on and off": "on ↔ off" }[v("switchMoment")];
    const rate = v.n("flickerRate");
    return `${LL.scene({ room: { win: false, lamp: null }, roomDim: 0.45 - br * 0.2, under: lamps, bust: { x: 150, key: { ang: px < 150 ? 180 : 0, dark: 0.85 - works * 0.6, color: col, colorA: works * 0.35 }, dim: (0.1 + drawsEye * 0.25) } }, k, id)}${drawsEye > 0.5 && n ? k.ring({ x: px, y: py, r: 18 * sz, color: "#ffd166", dash: "3 2" }) : ""}${sw ? LL.chip(k, 8, 20, sw) : ""}${LL.ticks(k, 220, 150, 90, Math.min(20, rate), col, "flicker " + rate + "/s")}${LL.caption(k, shown ? `${n0} ${kind}${n0 === 1 ? "" : "s"} in frame, ${v("flicker")}, ${v.n("fromFaces")} m from faces` : "No light source in the frame")}`;
  });

  /* Wet surfaces: rain, puddles that mirror, drips, and drying. */
  W.look("wetness", (v, k) => {
    const id = "cw-wetness";
    const wet = LL.idx(v, "setting") / 2;
    const rain = LL.idx(v, "rainFall");
    const rate = v.p("rainRate");
    const puddles = LL.idx(v, "puddles");
    const refl = v.p("reflections");
    const share = v.p("wetShare");
    const drips = v.n("drips");
    const drops = Array.from({ length: Math.round(rain * 14 + rate * 30) }, (_, i) => {
      const x = k.rnd(i + 1) * 320;
      const y = k.rnd(i + 50) * 150;
      return `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x - 3)}" y2="${r1(y + 8 + rate * 8)}" stroke="#bcd7f0" stroke-width="1.2" opacity="0.7"/>`;
    }).join("");
    const pud = Array.from({ length: [0, 2, 4, 6][puddles] }, (_, i) => `<ellipse cx="${r1(30 + k.rnd(i + 7) * 260)}" cy="${r1(132 + k.rnd(i + 3) * 24)}" rx="${r1(14 + k.rnd(i + 4) * 22 + (puddles === 3 ? 30 : 0))}" ry="${r1(3 + k.rnd(i + 5) * 3)}" fill="${k.mix("#4a3c30", "#c8dcef", 0.3 + refl * 0.6)}"/>`).join("");
    const sheen = `<rect x="0" y="122" width="${r1(320 * share)}" height="58" fill="#9fc3e6" opacity="${r1((0.08 + wet * 0.3) * (0.3 + refl * 0.7) * 100) / 100}"/><rect x="0" y="0" width="${r1(320 * share)}" height="122" fill="#7da7cf" opacity="${r1(wet * 0.12)}"/>`;
    const mirror = refl > 0.05 ? `<g opacity="${r1(refl * 0.6 * (0.3 + wet) * 100) / 100}"><rect x="26" y="124" width="48" height="${r1(20 + refl * 30)}" fill="#8cc0ea"/><rect x="254" y="124" width="16" height="${r1(16 + refl * 30)}" fill="#ffcf7a"/><rect x="136" y="124" width="48" height="${r1(10 + refl * 24)}" fill="#c0392b"/></g>` : "";
    const dripS = Array.from({ length: drips }, (_, i) => `<path d="M${30 + i * 50} 0 l0 ${8 + i * 3} q-3 5 0 7 q3 -2 0 -7" fill="#bcd7f0" stroke="#bcd7f0"/>`).join("");
    const pace = LL.idx(v, "dryingPace");
    const dt = v.n("dryTime");
    return `${LL.scene({ room: { sky: k.mix("#8cc0ea", "#59636f", rain / 3), clouds: rain / 3 }, under: sheen + pud + mirror, bust: { shine: wet * 0.8, shineN: wet }, over: drops + dripS, grade: { sat: 1 - rain * 0.12, curve: LL.curve({ contrast: wet * 0.15 }) } }, k, id)}${LL.ramp(k, { x: 236, y: 22, w: 72, h: 20, from: 0.5, to: [0.1, 0.5, 0.9][pace], at: 0.1, len: dt / 120, title: "wet over " + dt + " min" })}${LL.caption(k, `${v("setting")}, ${v("rainFall")}, ${v("puddles")} puddles`)}`;
  });

  /* Something glows: an orb, the person or the room, with halo, spill and pulse. */
  W.look("glow", (v, k) => {
    const id = "cw-glow";
    const what = v("setting");
    const col = { warm: "#ffb347", white: "#f5f5f0", cool: "#9ecbff", colored: "#c26bff" }[v("color")];
    const br = v.p("brightness") * 0.6 + v.p("vsScene") * 0.4;
    const bloom = v.p("bloom");
    const spill = LL.idx(v, "spill") / 3;
    const reach = v.p("reach");
    const size = v.p("glowSize");
    const pulse = LL.idx(v, "pulse");
    const pull = LL.idx(v, "pull") / 2;
    const ox = what === "person" ? 160 : 245;
    const oy = what === "person" ? 80 : 100;
    const r0 = 4 + size * 26;
    const none = what === "none";
    const halo = `<g opacity="${none ? 0.35 : 1}"><defs><radialGradient id="${id}-g"><stop offset="0" stop-color="${col}" stop-opacity="${r1(cl(0.5 + br * 0.5, 0, 1) * 100) / 100}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><circle cx="${ox}" cy="${oy}" r="${r1(r0 + 10 + bloom * 50 + reach * 60)}" fill="url(#${id}-g)"/>${what === "object" ? `<circle cx="${ox}" cy="${oy}" r="${r1(r0 * 0.5)}" fill="${col}"/>` : ""}${what === "room" ? `<rect x="0" y="0" width="320" height="180" fill="${col}" opacity="${r1(0.15 + br * 0.25)}"/>` : ""}${none ? `<circle cx="${ox}" cy="${oy}" r="${r1(r0 * 0.5)}" fill="none" stroke="#fff" stroke-dasharray="2 2"/>` : ""}</g>`;
    const spillS = none ? "" : `<rect x="0" y="0" width="320" height="180" fill="${col}" opacity="${r1(spill * 0.25 * 100) / 100}"/>`;
    const beat = [0, 1, 2, 3][pulse];
    const rate = v.n("pulseRate");
    const wave = k.wave({ x: 12, y: 26, w: 80, h: 14, amp: beat ? 0.4 + beat * 0.2 : 0.02, cycles: Math.max(1, rate / 20), noise: pulse === 3 ? 0.6 : 0, color: col });
    return `${LL.scene({ room: { win: 0.3, lamp: null }, roomDim: 0.45 - spill * 0.3, under: what !== "person" ? halo : "", bust: { dim: pull * 0.2, key: { ang: 0, dark: 0.7 - spill * 0.4, color: col, colorA: spill * 0.4 } }, over: (what === "person" ? halo : "") + spillS }, k, id)}${LL.box(6, 10, 92, 26)}${wave}${LL.caption(k, none ? "Nothing glows" : `A glowing ${what}, ${v("pulse")}, ${rate} pulses a minute`)}`;
  });

  /* Wear: dust, scratches, rust or stains over the room; how much, where, how old and getting worse or not. */
  W.look("wear", (v, k) => {
    const id = "cw-wear";
    const lvl = LL.idx(v, "setting") / 2;
    const how = v.p("howMuch");
    const kind = v("kind");
    const spread = LL.idx(v, "spread");
    const age = LL.idx(v, "age") / 3;
    const share = v.p("wornFrame");
    const amt = cl(0.15 + lvl * 0.45 + how * 0.4, 0, 1);
    const n = Math.round(amt * 60);
    const area = [[230, 10, 80, 50], [0, 0, 320, 122], [0, 0, 320, 160], [0, 0, 320, 180]][spread];
    const colr = { dust: "#d8cdb8", scratches: "#f0e8dc", rust: "#8a4a1c", stains: "#5a3a22" }[kind];
    const marks = Array.from({ length: n }, (_, i) => {
      const x = area[0] + k.rnd(i + 3) * area[2] * (spread === 1 && i % 2 ? 0.15 : 1) + (spread === 1 && i % 4 === 1 ? area[2] * 0.85 : 0);
      const y = area[1] + k.rnd(i + 31) * area[3];
      if (kind === "scratches") return `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + 6 + k.rnd(i) * 14)}" y2="${r1(y + 3 - k.rnd(i + 9) * 6)}" stroke="${colr}" stroke-width="0.8" opacity="0.8"/>`;
      if (kind === "dust") return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.8 + k.rnd(i + 4) * 1.6)}" fill="${colr}" opacity="0.7"/>`;
      return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(3 + k.rnd(i + 4) * 7)}" ry="${r1(2 + k.rnd(i + 8) * 4)}" fill="${colr}" opacity="0.45"/>`;
    }).join("");
    const worse = LL.idx(v, "worsens");
    const story = LL.idx(v, "story");
    const clip = `<clipPath id="${id}-c"><rect x="0" y="0" width="${r1(Math.max(8, 320 * share))}" height="180"/></clipPath>`;
    return `${LL.scene({ room: { wall: k.mix("#b9a58c", "#8a7a62", age), lamp: { on: 0.7 } }, under: `<defs>${clip}</defs><g clip-path="url(#${id}-c)">${marks}</g>`, grade: { sat: 1 - age * 0.45, sepia: age * 0.35 } }, k, id)}${story === 2 ? k.ring({ x: area[0] + area[2] / 2, y: area[1] + Math.min(area[3], 120) / 2, r: 22, color: "#ffd166", dash: "4 3" }) : story === 1 ? LL.chip(k, 8, 20, "hints at the past") : ""}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.5, to: [0.15, 0.5, 0.75, 1][worse], at: 0.05, len: 0.9, title: "wear over the film" })}${LL.caption(k, `${v("setting")} ${kind}, looks ${v("age")} old`)}`;
  });

  /* One color that pops: an accent in one place, everything else muted. */
  W.look("colorAccent", (v, k) => {
    const id = "cw-colorAccent";
    const lvl = LL.idx(v, "setting");
    const hue = LL.hueOf(v("accentHue"));
    const rest = LL.idx(v, "restColor") / 3;
    const share = v.p("accentShare");
    const ax = 20 + v.p("accentX") * 280;
    const ay = 160 - v.p("accentY") * 140;
    const strong = v.p("accentVsRest");
    const carrier = v("carrier");
    const col = LL.hueCss(hue, 55 + strong * 40, 50);
    const rr = 6 + share * 90;
    const cloth = carrier === "clothing";
    const bx = cloth ? 110 + v.p("accentX") * 100 : 160;
    const by = 80;
    const pw = rr * 1.4;
    const ph = Math.min(rr, 120);
    const pxx = cl(ax - pw / 2, 0, 320 - pw);
    const pyy = cl(ay - ph / 2, 36, 162 - ph);
    const accent = `<g opacity="${lvl === 0 ? 0.35 : 1}">` + (cloth ? `<clipPath id="${id}-sh"><rect x="0" y="${r1(cl(176 - v.p("accentY") * 66 - share * 60, 104, 170))}" width="320" height="${r1(14 + share * 120)}"/></clipPath><path d="${LL.bustPath(bx, by, 27)}" fill="${col}" stroke="#1c1712" stroke-width="2" clip-path="url(#${id}-sh)"/>` : carrier === "a light" ? `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="${r1(rr * 0.6)}" fill="${col}" opacity="0.5"/><circle cx="${r1(ax)}" cy="${r1(ay)}" r="${r1(4 + rr * 0.15)}" fill="${col}"/>` : carrier === "a place" ? `<rect x="${r1(pxx)}" y="${r1(pyy)}" width="${r1(pw)}" height="${r1(ph)}" fill="${col}" opacity="0.85"/>` : `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="${r1(rr * (0.3 + lvl * 0.15))}" fill="${col}" stroke="#1c1712" stroke-width="1.5"/><line x1="${r1(ax)}" y1="${r1(ay + rr * 0.4)}" x2="${r1(ax)}" y2="${r1(ay + rr * 0.4 + 18)}" stroke="#1c1712"/>`) + "</g>";
    const base = LL.scene({ room: { lamp: { on: 0.6 } }, bust: { shirt: "#6f6a8a", x: bx, y: by }, grade: { sat: 1 - rest * 0.98 } }, k, id);
    const leads = LL.idx(v, "leads");
    const recurs = LL.idx(v, "recurs");
    const strip = Array.from({ length: 6 }, (_, i) => `<rect x="${236 + i * 12}" y="16" width="10" height="10" fill="${[[0], [0, 3], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5]][recurs].includes(i) ? col : "#555"}" stroke="#222"/>`).join("");
    const lead = leads ? k.arrow({ x1: ax, y1: ay, x2: leads === 1 ? 160 : leads === 2 ? 290 : 316, y2: leads === 1 ? 70 : leads === 2 ? 100 : ay, color: "#fff", w: 1.5 }) : "";
    return `${base}${accent}${lead}${LL.box(230, 6, 84, 26)}${strip}${LL.caption(k, lvl ? `${v("accentHue")} on ${cloth ? "the clothing" : carrier}; the rest ${v("restColor")}` : "No accent color")}`;
  });

  /* The color drifts over the scene: a filmstrip that warms or cools as it goes. */
  W.look("colorDrift", (v, k) => {
    const id = "cw-colorDrift";
    const way = LL.idx(v, "driftWay") - 2;
    const kel = v.n("driftKelvin") / 3000;
    const warm = cl(way * 0.3 + kel * 0.5, -1.2, 1.2);
    const satD = v.n("driftColor") / 100;
    const brD = v.n("driftBright") / 3;
    const kind = LL.idx(v, "setting");
    const start = LL.idx(v, "startsAt") / 4;
    const time = v.n("driftTime");
    const span = Math.max(0.05, (time / 120) * (1 - start));
    /* How far the drift has gone at film time t (0..1). */
    const at = (t) => {
      let p = kind === 0 ? 0 : kind === 3 ? (t >= start + 0.01 ? 1 : 0) : cl((t - start) / span, 0, 1);
      if (kind === 2) p = Math.round(p * 2) / 2;
      return p;
    };
    const gradeAt = (p) => ({ sat: cl(1 + satD * p, 0, 2), tone: () => LL.warmRGB(warm * p), curve: LL.curve({ bright: brD * p * 0.6 }) });
    /* Three moments of the scene, big enough to see the color: start, middle, end. */
    const frames = [0, 0.5, 1].map((t, i) => {
      const x = 8 + i * 104;
      return `<clipPath id="${id}-c${i}"><rect x="${x}" y="24" width="96" height="54"/></clipPath><g clip-path="url(#${id}-c${i})"><g transform="translate(${x} 24) scale(0.3)">${LL.scene({ room: { lamp: { on: 0.7 } }, bust: { key: { dark: 0.45 } }, grade: gradeAt(kind === 0 && i === 2 ? 1 : at(t)) }, k, `${id}-${i}`)}</g></g><rect x="${x}" y="24" width="96" height="54" fill="none" stroke="${kind === 0 && i === 2 ? "#888" : "#000"}" stroke-width="1.5"${kind === 0 && i === 2 ? ' stroke-dasharray="3 2"' : ""}/>${k.label({ x: x + 48, y: 90, text: kind === 0 && i === 2 ? "if it drifted" : ["start of the scene", "middle", "end of the scene"][i], size: 8, color: "#ccc" })}`;
    }).join("");
    /* The wall color along the scene, as a band of swatches. */
    const base = [0.73, 0.65, 0.55];
    const band = Array.from({ length: 24 }, (_, i) => {
      const p = at(i / 23);
      const w = LL.warmRGB(warm * p);
      const c = base.map((b, ch) => {
        const gray = (base[0] + base[1] + base[2]) / 3;
        const sat = gray + (b - gray) * cl(1 + satD * p, 0, 2);
        return Math.round(cl(sat + w[ch] + brD * p * 0.25, 0, 1) * 255).toString(16).padStart(2, "0");
      }).join("");
      return `<rect x="${r1(14 + i * 12.25)}" y="108" width="12.6" height="20" fill="#${c}"/>`;
    }).join("");
    const sx = 14 + start * 294;
    return `${k.bg("#141418")}${k.label({ x: 8, y: 15, text: `starts ${v("startsAt")} · follows ${v("follows")}`, size: 9, anchor: "start", color: "#ddd" })}${frames}${k.label({ x: 14, y: 103, text: "wall color through the scene", size: 8, anchor: "start", color: "#aaa" })}${band}<rect x="14" y="108" width="294" height="20" fill="none" stroke="#555"/>${`<g opacity="${kind ? 1 : 0.35}"><line x1="${r1(sx)}" y1="104" x2="${r1(sx)}" y2="132" stroke="#ffd166" stroke-width="2"/>${k.arrow({ x1: sx, y1: 142, x2: Math.min(308, sx + Math.max(8, span * 294)), y2: 142, color: "#ffd166", w: 1.5 })}${k.label({ x: Math.min(250, sx + 4), y: 155, text: `${time} s`, size: 8, anchor: "start", color: "#ffd166" })}</g>`}${LL.caption(k, kind ? `${v("driftWay")} over ${time} s` : "The color holds steady")}`;
  });

  /* The whole lighting plan, from the lens: one scene that takes every setting. */
  W.look("lightingLens", (v, k) => {
    const id = "cw-lightingLens";
    const mood = LL.idx(v, "mood") / 4;
    const kd = LL.keyDir(v("key"));
    const soft = v.is("softness", /soft/) ? 0.8 : 0;
    const con = v.p("contrast");
    const temp = LL.idx(v, "colorTemp") - 1;
    const vk = LL.idx(v, "valueKey") - 1;
    const rimI = LL.idx(v, "rim");
    const count = v.n("lightCount");
    const shape = v("lightShape");
    const air = LL.idx(v, "atmosphere");
    const mot = v("motivation");
    const faceL = LL.idx(v, "faceLight") / 3;
    const move = LL.idx(v, "movement");
    const acc = LL.idx(v, "colorAccent");
    const shadows = LL.idx(v, "shadows") / 4;
    const eyeTo = v("eyeTo");
    const litShare = v.p("litShare");
    const fvr = v.n("faceVsRoom") / 3;
    const mpm = v.n("movesPerMin");
    const lamp = /lamp|fire/.test(mot) ? { on: 1, color: /fire/.test(mot) ? "#ff8a3c" : "#ffcf7a" } : { on: 0.15 };
    const screen = /screen/.test(mot) ? `<rect x="230" y="80" width="40" height="28" fill="#9ecbff" stroke="#222" stroke-width="2"/>` : "";
    const accCols = ["#ff5fa2", "#3fd0ff", "#b6ff5f"];
    const accS = Array.from({ length: acc === 3 ? 3 : acc }, (_, i) => `<circle cx="${40 + i * 120}" cy="${150 - i * 10}" r="40" fill="${accCols[i]}" opacity="0.28"/>`).join("");
    const pools = Array.from({ length: Math.min(8, count) - 1 }, (_, i) => ({ x: 20 + (i * 41) % 300, a: 0.15 + litShare * 0.4, rx: 18 + litShare * 22 }));
    const eye = { "the face": [160, 80, 34], "the hands": [120, 160, 16], "a doorway": [300, 70, 20], "the background": [260, 40, 24] }[eyeTo];
    const scene = LL.scene({
      room: { win: /window|sky/.test(mot) ? 0.95 : 0.25, lamp, pools },
      under: screen,
      roomDim: cl(0.35 - mood * 0.3 - vk * 0.15 + fvr * 0.2 + (1 - litShare) * 0.2, 0, 0.85),
      pattern: { kind: shape, a: 0.6, size: 0.4 },
      bust: { key: { ang: kd.ang + (move ? 20 : 0), dark: kd.none ? 0 : cl(0.2 + con * 0.4 + shadows * 0.4, 0, 1), soft, lit: cl(kd.lit * 0.4 + faceL * 0.6, 0, 1), none: kd.none }, dim: (kd.dim || 0) + (1 - faceL) * 0.25, rim: { w: [0, 2, 5][rimI], a: 0.9, side: 1 }, sparkle: faceL },
      haze: { a: [0, 0.35, 0.3][air], beams: { n: air === 2 ? 3 : 0, a: 0.8 } },
      over: accS + (eye ? k.ring({ x: eye[0], y: eye[1], r: eye[2], color: "#ffd166", dash: "3 3", w: 1.5 }) : ""),
      grade: { tone: () => LL.warmRGB(-temp * 0.6 + mood * 0.2), curve: LL.curve({ bright: vk * 0.12 + (mood - 0.5) * 0.15, contrast: (con - 0.5) * 0.5 }) },
    }, k, id);
    return `${scene}${move ? LL.chip(k, 6, 18, `light ${v("movement")} · ${mpm}/min`) : LL.chip(k, 6, 18, `still · ${mpm}/min`)}${LL.chipR(k, 314, 18, "measured on " + v("measuredOn"))}${LL.caption(k, `${v("mood")}, ${v("key")} light, ${count} light${count === 1 ? "" : "s"}`)}`;
  });

  /* The lighting rig, from the lens: which light, its spread, bounce and reach. */
  W.look("lightRigLens", (v, k) => {
    const id = "cw-lightRigLens";
    const type = v("lightType");
    const ratio = LL.idx(v, "ratio") / 3;
    const bounce = Math.max(LL.idx(v, "bounce") / 2 * 0.6, v.p("bounceShare") * 0.6) + v.p("bounceShare") * 0.2;
    const fall = LL.idx(v, "falloff") / 2;
    const half = v.p("halfDistance");
    const link = v("linking");
    const soft = v.is("softness", /soft/) ? 0.8 : 0;
    const rimI = LL.idx(v, "rim");
    const haze = LL.idx(v, "haze");
    const shape = v("shape");
    const prac = v.is("practical", /yes/);
    const col = { sun: "#fff1b8", "open sky": "#cfe3ff", window: "#eef4ff", spotlight: "#ffffff", "bare bulb": "#ffcf7a", "glowing object": "#c26bff" }[type];
    const reach = cl(1 - fall * 0.7 + half * 0.5, 0.1, 1.3);
    const gradient = `<defs><linearGradient id="${id}-fo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="${r1(cl(reach * 0.6, 0.05, 0.95) * 100) / 100}" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${r1(0.15 + fall * 0.6)}"/></linearGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-fo)"/>`;
    const srcR = type === "spotlight" || type === "bare bulb" ? 6 : 12;
    const src = `<circle cx="${srcR + 3}" cy="40" r="${srcR}" fill="${col}" stroke="#1c1712" stroke-width="1"/>`;
    const bg = link === "only the hero" ? 0.45 : 0;
    const hero = link === "only the background" ? 0.45 : 0;
    return `${LL.scene({ room: { win: type === "window" ? 1 : 0.4, lamp: prac ? { on: 1 } : null }, roomDim: bg, pattern: { kind: shape, a: 0.6 }, under: gradient + `<rect x="0" y="0" width="320" height="180" fill="${col}" opacity="${r1(bounce * 0.15)}"/>`, bust: { key: { ang: 190, dark: cl(0.1 + ratio * 0.9 - bounce * 0.25, 0, 1), soft, color: col, colorA: 0.25 }, dim: hero, rim: { w: [0, 2, 5][rimI], a: 0.9, side: 1 } }, haze: { a: [0, 0.35, 0.3][haze], beams: { n: haze === 2 ? 3 : 0, a: 0.8, x: 10, y: 40 } }, over: src }, k, id)}${LL.chipR(k, 314, 18, `halves every ${LL.num(v.n("halfDistance"))} m`)}${LL.chip(k, 6, 18, `lights ${link}`)}${LL.caption(k, `${type}, ${v("ratio")}, ${/bounce/.test(v("bounce")) ? v("bounce") : v("bounce") + " bounce"}`)}`;
  });

  /* Skin, from the lens: light through the skin, oil, flush, pores. A big face. */
  W.look("skinLens", (v, k) => {
    const id = "cw-skinLens";
    const thr = LL.idx(v, "glowThrough") / 3;
    const sl = v.p("skinLight");
    const oil = LL.idx(v, "oil") / 3;
    const flush = LL.idx(v, "flush") / 3;
    const det = LL.idx(v, "detail") / 2;
    const timing = LL.idx(v, "flushTiming");
    const shineShare = v.p("shineShare");
    const ft = v.n("flushTime");
    const svs = v.n("skinVsScene") / 3;
    const skin = k.mix(k.mix("#efe2d8", "#e8b894", Math.min(1, flush * 2)), "#d0453a", Math.max(0, flush - 0.5) * 0.8);
    const waxy = thr < 0.2 ? `<circle cx="160" cy="80" r="45" fill="#fff" opacity="0.12"/>` : "";
    const bust = LL.bust({ r: 45, y: 82, skin, key: { ang: 0, dark: 0.45, soft: 0.6 }, glow: { a: 0.2 + thr * 0.5 + sl * 0.3, color: "#ff5a3c", where: thr > 0.9 ? "ears" : "whole face", depth: sl }, shine: 0.15 + oil * 0.85, shineN: shineShare, shineSize: oil, flush: flush * 0.8, pores: det, dim: -0 }, k, id);
    const room = `<rect x="0" y="0" width="320" height="180" fill="${k.mix("#2a2a36", "#9c9cb0", 0.5 - svs * 0.4)}"/>`;
    return `${room}${bust}${waxy}${det < 0.1 ? `<circle cx="160" cy="82" r="45" fill="${skin}" opacity="0.2"/>` : ""}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.15, to: timing ? 0.9 : 0.15, at: [0, 0.1, 0.4, 0.5][timing], len: timing === 3 ? 0.02 : ft / 30, title: "face colors" })}${LL.caption(k, `${v("glowThrough")}, ${v("oil")} skin, ${v("flush")}, ${v("detail")}`)}`;
  });

  /* Where the light is: a map from above, plus what it does to the face. */
  W.look("lightPlace", (v, k) => {
    const id = "cw-lightPlace";
    const around = v.n("around");
    const height = v.n("height");
    const dist = v.n("distance");
    const sizeI = LL.idx(v, "size") / 4;
    const fill = v.p("fill");
    const front = Math.cos(k.rad(around));
    const side = Math.sin(k.rad(around));
    const ang = Math.atan2(-height / 90, side >= 0 ? -1 : 1) * 180 / Math.PI;
    const angDeg = side >= 0 ? 180 + height * 0.6 : -height * 0.6;
    const lit = cl(0.5 + front * 0.4 - (Math.abs(height) / 90) * 0.15, 0.02, 0.98);
    const face = LL.scene({ room: { win: false, lamp: null }, roomDim: 0.3 + cl(dist / 30, 0, 1) * 0.35, bust: { x: 105, key: { ang: Math.abs(side) < 0.1 && front < 0 ? 0 : angDeg, dark: cl(0.9 - fill * 0.85, 0, 1), soft: sizeI, lit }, rim: { w: front < -0.3 ? 4 : 0, a: 0.9, side: side >= 0 ? -1 : 1 }, dim: cl(dist / 30, 0, 1) * 0.3 } }, k, id);
    const mx = 262;
    const my = 62;
    const R = 10 + Math.sqrt(dist / 30) * 36;
    const a = k.rad(around - 90);
    const lx = mx + Math.cos(a) * R;
    const ly = my - Math.sin(a) * R;
    void ang;
    const map = `<rect x="212" y="6" width="102" height="152" rx="6" fill="#1d1d22" stroke="#444"/>${k.ring({ x: mx, y: my, r: R, color: "#555", dash: "3 3", w: 1 })}${k.dot({ x: mx, y: my, r: 6, color: "#c0392b" })}${k.cam({ x: mx, y: 124, dir: -90, s: 0.45 })}${k.dot({ x: lx, y: ly, r: 3 + sizeI * 7, color: "#ffe28a" })}${k.label({ x: mx, y: 143, text: `${Math.round(around)}° · ${LL.num(dist)} m`, size: 8, color: "#ccc" })}${k.label({ x: mx, y: 153, text: height > 5 ? `${height}° above` : height < -5 ? `${-height}° below` : "eye level", size: 8, color: "#ccc" })}`;
    return `<clipPath id="${id}-v"><rect x="0" y="0" width="210" height="180"/></clipPath><g clip-path="url(#${id}-v)">${face}</g>${map}${LL.caption(k, `${v("size")}, fill ${v.n("fill")}%`)}`;
  });

  /* The key light: side, height, ratio, which side of the face, sparkle and swing. */
  W.look("key", (v, k) => {
    const id = "cw-key";
    const kd = LL.idx(v, "setting");
    const dir = LL.keyDir(v("setting"));
    const h = v.n("height");
    const ratio = v.p("ratio");
    const litSide = LL.idx(v, "litSide");
    const eye = LL.idx(v, "eyeLight") / 2;
    const faceLit = v.p("faceLit");
    const swing = LL.idx(v, "swing");
    const rate = v.n("swingRate");
    const mot = v("motivatedBy");
    const from = v("keyFrom");
    let ang = dir.ang;
    if (kd === 0 || kd === 1) ang = (litSide === 2 ? 0 : 180) + (litSide === 2 ? -1 : 1) * h * 0.8 * (litSide === 2 ? -1 : 1);
    if (kd === 1) ang = litSide === 2 ? 340 - h * 0.5 : 200 + h * 0.5;
    const lit = cl(dir.lit * 0.5 + faceLit * 0.5 + (litSide === 1 ? 0.1 : 0), 0, 1);
    const lamp = /lamp/.test(mot) ? { on: 1, x: litSide === 2 ? 270 : 50, y: 80 - h * 0.4 } : /fire/.test(mot) ? { on: 1, color: "#ff8a3c", x: 50, y: 110 } : null;
    const screen = /screen/.test(mot) ? `<rect x="40" y="96" width="34" height="24" fill="#9ecbff" stroke="#222" stroke-width="2"/>` : "";
    const arcs = swing ? `<path d="M110 ${30} A60 30 0 0 1 210 30" fill="none" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="${swing === 3 ? "none" : "4 3"}"/>${k.arrow({ x1: 200, y1: 26, x2: 212, y2: 32, w: 1.5 })}` : "";
    return `${LL.scene({ room: { win: /window/.test(mot) ? 1 : 0.25, lamp }, under: screen, roomDim: 0.25, bust: { key: { ang, dark: dir.none ? 0 : cl(0.1 + ratio * 0.9, 0, 1), soft: 0.25, lit, none: dir.none }, dim: dir.dim || 0, rim: { w: dir.rim ? 4 : 0, a: 0.9 }, sparkle: eye } }, k, id)}${arcs}${LL.ticks(k, 236, 150, 74, Math.round(rate / 24), "#ffd166", `swing ${rate}°/min`)}${LL.chip(k, 6, 18, "measured from " + from)}${LL.caption(k, `${v("setting")} light, ${h}° up, ${v.n("ratio")}:1`)}`;
  });

  /* Contrast: how far apart the brights and darks are, with a scale of grays and a face. */
  W.look("contrast", (v, k) => {
    const id = "cw-contrast";
    const c = v.p("setting") * 0.5 + v.p("contrastStops") * 0.5;
    const fill = LL.idx(v, "shadowFill") / 2;
    const blacks = LL.idx(v, "blacks");
    const brights = LL.idx(v, "brights");
    const fvr = LL.idx(v, "faceVsRoom") - 1;
    const build = LL.idx(v, "buildUp");
    const t = v.n("contrastTime");
    const curve = LL.curve({ contrast: (c - 0.4) * 1.4, lift: blacks === 0 ? 0.25 : blacks === 1 ? 0.08 : 0, crush: blacks === 3 ? 0.7 : 0, clip: brights === 3 ? 0.8 : brights === 2 ? 0.35 : 0, cap: brights === 0 ? 0.15 : 0 });
    const steps = Array.from({ length: 8 }, (_, i) => `<rect x="${236 + i * 9}" y="22" width="9" height="14" fill="${k.mix("#000000", "#ffffff", cl(curve(i / 7), 0, 1))}"/>`).join("");
    return `${LL.scene({ room: { lamp: { on: 0.8 } }, roomDim: fvr > 0 ? 0.3 : 0, bust: { key: { dark: cl(0.95 - fill * 0.7, 0, 1), soft: 0.25 }, dim: fvr < 0 ? 0.35 : 0 }, grade: { curve } }, k, id)}${LL.box(230, 8, 84, 34)}${k.label({ x: 236, y: 18, text: "dark → bright", size: 8, anchor: "start", color: "#ccc" })}${steps}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.5, to: [0.2, 0.5, 0.75, 0.9][build], at: 0.2, len: build === 3 ? 0.01 : t / 60, title: "over the scene" })}${LL.chip(k, 6, 18, "measured on " + v("contrastFrom"))}${LL.caption(k, `Contrast ${v.n("setting")}, ${v.n("contrastStops")} stops, ${v("blacks")} blacks`)}`;
  });

  /* The color of the light, in kelvin, with warm/cool split and green/pink cast. */
  W.look("colorTemp", (v, k) => {
    const id = "cw-colorTemp";
    const word = LL.idx(v, "setting") - 1;
    const warm = cl(LL.kelvinWarm(v.n("kelvin")) * 0.7 - word * 0.4, -1.3, 1.3);
    const ft = LL.idx(v, "faceTemp") - 1;
    const split = LL.idx(v, "splitTemp") / 3;
    const sk = v.p("splitKelvin");
    const castA = (LL.idx(v, "cast") - 1) * 0.4 + v.n("castAmount") / 20 * 0.6;
    const cast = [castA * 0.04, -castA * 0.07, castA * 0.04];
    const sp = split * 0.5 + sk * 0.5;
    const tone = (x) => {
      const w = LL.warmRGB(warm);
      const s = LL.warmRGB(-sp * 0.8);
      const h = LL.warmRGB(sp * 0.8);
      const m = cl((x - 0.5) * 2, -1, 1);
      return [0, 1, 2].map((i) => w[i] + cast[i] + (m < 0 ? s[i] * -m : h[i] * m));
    };
    const t = v.n("tempTime");
    const scale = `<defs><linearGradient id="${id}-k" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a2a"/><stop offset="0.45" stop-color="#fff4e0"/><stop offset="1" stop-color="#8fb8ff"/></linearGradient></defs><rect x="236" y="22" width="72" height="8" fill="url(#${id}-k)"/>${k.dot({ x: 236 + v.p("kelvin") * 72, y: 26, r: 4, color: "#fff" })}`;
    return `${LL.scene({ room: { lamp: { on: 1 } }, bust: { key: { ang: 180, color: ft > 0 ? "#ff9a3c" : ft < 0 ? "#5aa0ff" : "#fff", colorA: Math.abs(ft) * 0.35, dark: 0.5 } }, grade: { tone } }, k, id)}${LL.box(230, 8, 84, 26)}${k.label({ x: 236, y: 18, text: `${v.n("kelvin")} K`, size: 8, anchor: "start", color: "#ccc" })}${scale}${LL.chip(k, 6, 18, "on " + v("measuredOn"))}${LL.chip(k, 6, 36, "shifts with " + v("shiftWith"))}${k.meter({ x: 236, y: 150, w: 72, p: t / 120, label: `change in ${t} s` })}${LL.caption(k, `${v("setting")} light, ${v("splitTemp")}, ${v("cast")} cast`)}`;
  });

  /* The lighting plan: pools of light, where the dark sits, who is picked out. */
  W.look("lighting", (v, k) => {
    const id = "cw-lighting";
    const kind = v("setting");
    const st = v.p("strength");
    const poolsW = LL.idx(v, "pools");
    const pc = Math.round(v.n("poolCount"));
    const dark = v("darkPlace");
    const picks = LL.idx(v, "picksOut") / 3;
    const preset = { dusk: { warm: 0.5, br: -0.15, win: 0.5, sky: "#e8834b" }, flat: { warm: 0, br: 0.1, win: 0.9 }, practical: { warm: 0.4, br: -0.1, win: 0.2 }, hard: { warm: 0, br: 0, win: 0.9 }, moon: { warm: -0.8, br: -0.3, win: 0.1, sky: "#1b2a4a" } }[kind];
    const n = poolsW === 3 ? Math.min(1, pc) : Math.round(pc * [1, 1, 0.5, 0.2][poolsW]);
    const pools = Array.from({ length: n }, (_, i) => ({ x: 20 + ((i * 53) % 290), rx: [60, 34, 46, 20][poolsW] + st * 10, a: (poolsW ? 0.25 : 0.1) + st * 0.4 }));
    const darkS = { corners: `<defs><radialGradient id="${id}-v"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-v)"/>`, background: `<rect x="0" y="0" width="320" height="122" fill="#000" opacity="0.5"/>`, "behind the people": `<rect x="100" y="0" width="120" height="122" fill="#000" opacity="0.55"/>`, "over the faces": "" }[dark];
    const lead = v.n("shiftLead");
    const time = v.n("shiftTime");
    return `${LL.scene({ room: { win: preset.win, sky: preset.sky, lamp: { on: kind === "practical" ? 1 : 0.2 }, pools }, under: darkS, bust: { key: { dark: kind === "flat" ? 0.1 : 0.3 + st * 0.6, soft: kind === "hard" ? 0 : 0.6 }, dim: dark === "over the faces" ? 0.5 : 0, rim: { w: picks * 5, a: 0.9 } }, over: picks > 0.9 ? `<path d="M0 0 H320 V180 H0 Z M160 32 a52 52 0 1 0 0.1 0 Z" fill="#000" fill-rule="evenodd" opacity="0.45"/>` : "", grade: { tone: () => LL.warmRGB(preset.warm), curve: LL.curve({ bright: preset.br }) } }, k, id)}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.3, to: 0.8, at: 0.45 + lead * 0.08, len: time / 30, beat: 0.45, beatLabel: v("shiftCue"), title: "shift" })}${LL.caption(k, `${kind} lighting, ${v("pools")}, ${n} pool${n === 1 ? "" : "s"}`)}`;
  });

  /* Hard or soft light: the shadow edge on the face and the source size. */
  W.look("softness", (v, k) => {
    const id = "cw-softness";
    const soft = v.is("setting", /soft/) ? 0.5 : 0;
    const size = v.p("size");
    const width = v.p("sourceWidth");
    const dist = v.p("distance");
    const dif = v.p("diffusion");
    const edge = LL.idx(v, "edge") / 3;
    const wrap = LL.idx(v, "wrap") / 3;
    const s = cl(soft * 0.3 + edge * 0.3 + size * 0.15 + width * 0.1 + dif * 0.15 - dist * 0.2, 0, 1);
    const lw = 4 + size * 18 + width * 22;
    const src = `<rect x="${r1(14 - lw / 4)}" y="${r1(60 - lw / 2)}" width="${r1(lw / 2)}" height="${r1(lw)}" rx="2" fill="#fff6dc"/>${dif > 0.05 ? `<rect x="${r1(14 + lw / 4 + 4)}" y="${r1(60 - lw / 2 - 4)}" width="3" height="${r1(lw + 8)}" fill="#fff" opacity="${r1(dif * 0.9)}"/>` : ""}`;
    const t = v.n("softTime");
    return `${LL.scene({ room: { win: false, lamp: null }, roomDim: 0.35, pattern: null, bust: { x: 160 + dist * 40, key: { ang: 180, dark: 0.85 - wrap * 0.3, soft: s, lit: 0.45 + wrap * 0.35 } } }, k, id)}${src}${k.meter({ x: 236, y: 150, w: 72, p: t / 30, label: `change in ${t} s` })}${LL.caption(k, `${v("setting")} light, ${v("edge")} shadow edge`)}`;
  });

  /* Rim light: a bright edge around them, which side, how thick, its color. */
  W.look("rim", (v, k) => {
    const id = "cw-rim";
    const on = LL.idx(v, "setting");
    const inten = v.p("intensity") * 0.6 + v.p("rimVsKey") * 0.4;
    const col = { "matches the key": "#fff6dc", warmer: "#ffb35c", cooler: "#8ec0ff", colored: "#d36cff" }[v("color")];
    const side = LL.idx(v, "rimSide") - 1;
    const width = [1, 2.5, 5, 9][LL.idx(v, "width")];
    const sep = LL.idx(v, "separate") / 3;
    const around = v.n("rimAround");
    const height = v.n("rimHeight");
    const appears = v("appears");
    const fade = v.n("rimFadeIn");
    const ox = (around / 180) * 6;
    const oy = -height / 90 * 6;
    return `${LL.scene({ room: { win: 0.2, lamp: null, wall: k.mix("#4a4a55", "#2a2a33", sep) }, roomDim: sep * 0.35, bust: { key: { dark: 0.5 }, rim: { side, w: width * (on === 1 ? 0.6 : 1), color: col, a: cl(0.3 + inten * 0.7, 0, 1) * (on ? 1 : 0.3) } } }, k, id).replace(/(<g clip-path="url\(#cw-rim-rimc\)"[^>]*)>/, `$1 transform="translate(${r1(ox)} ${r1(oy)})">`)}${LL.chip(k, 6, 18, "appears " + appears)}${k.meter({ x: 236, y: 150, w: 72, p: fade / 10, label: `fades in over ${fade} s` })}${LL.caption(k, `${on ? `${v("setting")} ${v("color")} rim, ${v("rimSide")}` : "Rim light off"}, ${Math.round(around)}° around, ${height}° up`)}`;
  });

  /* How many lights: lamps around the set, seen and unseen, fill, background and edge lights. */
  W.look("lightCount", (v, k) => {
    const id = "cw-lightCount";
    const n = Math.round(v.n("setting"));
    const seen = v.p("motivated");
    const fill = LL.idx(v, "fill") / 2;
    const bg = [0, 1, 3, 6][LL.idx(v, "bgLights")];
    const edges = LL.idx(v, "edgeLights");
    const come = LL.idx(v, "comeAndGo");
    const keyShare = v.p("keyShare");
    const rate = v.n("switchRate");
    const nSeen = Math.round(n * seen);
    const lamps = Array.from({ length: nSeen }, (_, i) => `<circle cx="${30 + i * 36}" cy="14" r="6" fill="#ffcf7a"/><circle cx="${30 + i * 36}" cy="14" r="12" fill="#ffcf7a" opacity="0.3"/>`).join("");
    const hidden = Array.from({ length: n - nSeen }, (_, i) => `<g transform="translate(${18 + i * 12} 150) rotate(-40) scale(0.55)"><path d="M-10 -9 L8 -6 L8 6 L-10 9 Z" fill="#555" stroke="#1c1712" stroke-width="1.5"/><circle cx="9" cy="0" r="5" fill="#fff3c4"/></g>`).join("") + (n - nSeen ? LL.chip(k, 6, 136, `${n - nSeen} off screen`) : "");
    const bgPools = Array.from({ length: bg }, (_, i) => ({ x: 30 + i * 46, y: 40, rx: 14, a: 0.5 }));
    const switching = come ? Array.from({ length: Math.min(n, come * 2) }, (_, i) => `<line x1="${24 + i * 36}" y1="4" x2="${36 + i * 36}" y2="24" stroke="#e85d75" stroke-width="2"/>`).join("") : "";
    return `${LL.scene({ room: { win: 0.3, lamp: null, pools: bgPools }, roomDim: 0.4 - Math.min(n, 8) * 0.03, bust: { key: { dark: cl(0.95 - fill * 0.7 - (1 - keyShare) * 0.3, 0, 1), soft: 0.3 }, rim: { w: edges * 2, side: edges >= 2 ? 0 : 1, a: 0.9 } } }, k, id)}${lamps}${switching}${hidden}${LL.ticks(k, 236, 130, 72, Math.min(30, rate), "#e85d75", `${rate} switch/min`)}${LL.caption(k, `${n} light${n === 1 ? "" : "s"}, ${nSeen} seen, key gives ${v.n("keyShare")}%`)}`;
  });

  /* Shaped light: blinds, leaves or a barndoor cut thrown across the room. */
  W.look("lightShape", (v, k) => {
    const id = "cw-lightShape";
    const kind = v("setting");
    const st = v.p("strength");
    const size = LL.idx(v, "patternSize") / 3;
    const on = v("fallsOn");
    const sway = LL.idx(v, "sway");
    const edge = LL.idx(v, "patternEdge") / 2;
    const share = v.p("patternShare");
    const ang = v.n("patternAngle");
    const rate = v.n("swayRate");
    const band = { "the wall": [0, 122], "the floor": [122, 180], "the people": [40, 180], everything: [0, 180] }[on];
    const pat = { kind, a: 0.2 + st * 0.8, size, ang, blur: edge, share, y0: band[0], y1: band[1], shift: sway * 4 };
    const inner = LL.room({ id }, k) + (on === "the people" ? "" : LL.pattern(pat, k, id)) + LL.bust({ key: { dark: 0.3 } }, k, id) + (on === "the people" ? `<g>${LL.pattern(Object.assign({}, pat, { share: share * 0.5 + 0.5 * (share > 0) }), k, id + "-p")}</g>` : on === "everything" ? LL.pattern(pat, k, id + "-e") : "");
    const swayM = sway ? k.arrow({ x1: 140, y1: 10, x2: 180, y2: 10, color: "#ffd166", w: 1.5 }) + k.arrow({ x1: 180, y1: 10, x2: 140, y2: 10, color: "#ffd166", w: 1.5 }) : "";
    return `${inner}${swayM}${LL.ticks(k, 236, 150, 72, Math.round(rate / 3), "#ffd166", `${v("sway")}, ${rate}/min`)}${LL.caption(k, kind === "open" ? "Open light, no pattern" : `${kind} on ${on}, ${v("patternSize")}, ${v("patternEdge")} edge`)}`;
  });

  /* The air: haze, smoke, fog, beams, how far you can see. */
  W.look("atmosphere", (v, k) => {
    const id = "cw-atmosphere";
    const air = LL.idx(v, "setting");
    const th = v.p("thickness");
    const kind = v("airKind");
    const drift = LL.idx(v, "drift");
    const depth = v.p("depthFade");
    const beams = LL.idx(v, "beams");
    const vis = v.p("visibility");
    const speed = v.p("airSpeed");
    const col = { haze: "#d8dde4", smoke: "#a8a8a8", dust: "#d8c098", steam: "#f2f4f6", fog: "#c8d0d8" }[kind];
    const a = cl((air ? 0.2 : 0.05) + th * 0.55 + (1 - vis) * 0.3, 0, 1);
    const far = `<rect x="0" y="0" width="320" height="122" fill="${col}" opacity="${r1(depth * 0.5 * 100) / 100}"/>`;
    return `${LL.scene({ room: { lamp: { on: 0.8 } }, under: far, bust: { key: { dark: 0.5, ang: 160 } }, haze: { a, color: col, depth, swirl: drift ? drift / 3 + speed * 0.3 : 0, beams: { n: beams ? beams + (air === 2 ? 1 : 0) : air === 2 ? 1 : 0, a: 0.4 + beams * 0.2, spread: 4 + beams * 3, x: 50, y: 30 } } }, k, id)}${k.arrow({ x1: 230, y1: 30, x2: 236 + speed * 74, y2: 30, color: drift ? col : "#777", w: 2 })}${LL.caption(k, `${v("setting")}, ${kind}, ${v("drift")}, see ${v.n("visibility")} m`)}`;
  });

  /* Brightness key: a mostly dark or mostly bright frame, and where the eye goes. */
  W.look("valueKey", (v, k) => {
    const id = "cw-valueKey";
    const key = LL.idx(v, "setting") - 1;
    const ex = v.n("exposure") / 3;
    const dark = v.p("darkShare");
    const lit = v.p("litShare");
    const bright = v("brightest");
    const arc = LL.idx(v, "arc");
    const guide = LL.idx(v, "eyeGuide") / 3;
    const fs = v.n("faceStops") / 3;
    const shadow = `<rect x="${r1(320 - dark * 320)}" y="0" width="${r1(dark * 320)}" height="180" fill="#000" opacity="0.6"/>`;
    const litS = `<rect x="0" y="0" width="${r1(lit * 320)}" height="180" fill="#fff" opacity="0.18"/>`;
    const brightS = { "the face": "", "a window": `<rect x="22" y="22" width="56" height="52" fill="#fff"/>`, "a lamp": `<circle cx="262" cy="70" r="22" fill="#fff6c4"/>`, "the sky": `<rect x="0" y="0" width="320" height="18" fill="#eaf4ff"/>` }[bright];
    const spot = guide > 0 ? `<defs><radialGradient id="${id}-s" cx="0.5" cy="0.45" r="${r1(0.9 - guide * 0.55)}"><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${r1(guide * 0.8)}"/></radialGradient></defs><rect x="0" y="0" width="320" height="180" fill="url(#${id}-s)"/>` : "";
    return `${LL.scene({ room: { lamp: { on: 0.8 } }, under: brightS + litS + shadow, bust: { key: { dark: 0.5 }, dim: cl(-fs * 0.4, 0, 0.6) }, over: (fs > 0 ? `<circle cx="160" cy="80" r="27" fill="#fff" opacity="${r1(fs * 0.3)}"/>` : "") + spot, grade: { curve: LL.curve({ bright: key * 0.25 + ex * 0.2, contrast: key === 0 ? 0 : 0.1 }) } }, k, id)}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.5, to: [0.15, 0.5, 0.85][arc], at: 0.1, len: 0.8, title: "over the section" })}${LL.caption(k, `${v("setting")}, exposure ${v.n("exposure")}, brightest: ${bright}`)}`;
  });

  /* Render style: photo, paint, toon or flat, applied to part of the frame. */
  W.look("renderStyle", (v, k) => {
    const id = "cw-renderStyle";
    const st = v("setting");
    const far = v.p("strength");
    const det = LL.idx(v, "detailLevel") / 3;
    const shading = LL.idx(v, "shading") / 3;
    const reach = LL.idx(v, "styleReach");
    const share = v.p("styledShare");
    const rate = v.n("drawRate");
    const time = v.n("styleTime");
    const base = LL.scene({ room: { lamp: { on: 0.8 } }, bust: { key: { dark: 0.2 + shading * 0.5, soft: shading } } }, k, id + "-a");
    const detail = Array.from({ length: Math.round(det * 30) }, (_, i) => `<line x1="${r1(k.rnd(i + 4) * 320)}" y1="${r1(k.rnd(i + 8) * 120)}" x2="${r1(k.rnd(i + 4) * 320 + 6)}" y2="${r1(k.rnd(i + 8) * 120 + 2)}" stroke="#5a4a3a" stroke-width="0.8"/>`).join("");
    const styleF = st === "photoreal" ? { sat: 1 + far * 0.4, curve: LL.curve({ contrast: far * 0.3 }) } : st === "painterly" ? { blur: 0.5 + far * 2, sat: 1.2 } : st === "toon" ? { sat: 1.3 + far * 0.4, curve: (x) => Math.round(x * (5 - far * 3)) / (5 - far * 3) } : { sat: 1.1, curve: (x) => Math.round(x * (3 - far * 1.5)) / (3 - far * 1.5) };
    const styled = LL.graded(`${id}-st`, styleF, base + detail + (st === "toon" ? `<g fill="none" stroke="#000" stroke-width="${r1(1 + far * 2)}"><circle cx="160" cy="80" r="27"/><path d="${LL.bustPath(160, 80, 27)}"/></g>` : ""));
    const clipX = reach === 0 ? null : 0;
    void clipX;
    const sw = r1(Math.max(4, share * 320));
    const keepFace = reach < 2 ? `<clipPath id="${id}-f"><circle cx="160" cy="80" r="27"/>${reach === 0 ? `<path d="${LL.bustPath(160, 80, 27)}"/>` : ""}</clipPath><g clip-path="url(#${id}-f)">${base}</g>` : "";
    return `${base}<clipPath id="${id}-c"><rect x="0" y="0" width="${sw}" height="180"/></clipPath><g clip-path="url(#${id}-c)">${styled}${keepFace}</g><line x1="${sw}" y1="0" x2="${sw}" y2="162" stroke="#ffd166" stroke-dasharray="3 3"/>${LL.ticks(k, 236, 130, 72, Math.round(rate / 2), "#ffd166", `${rate} drawings/s`)}${LL.chip(k, 6, 18, `shifts ${v("styleMoment")} · ${time} s`)}${LL.caption(k, `${st}, ${v("detailLevel")}, ${v("shading")} shading, ${v("styleReach")}`)}`;
  });

  /* Ink line: outline weight, color, wobble, inner lines, thinner far away, shimmer. */
  W.look("lineWeight", (v, k) => {
    const id = "cw-lineWeight";
    const ink = LL.idx(v, "setting");
    const varr = v.p("variation");
    const colW = v("color");
    const col = { black: "#111", "dark color": "#3b2a5a", light: "#eee", none: "none" }[colW];
    const wob = LL.idx(v, "wobble") / 3;
    const inner = LL.idx(v, "innerLines");
    const byD = LL.idx(v, "byDistance") / 2;
    const boil = LL.idx(v, "boil");
    const px = v.n("linePx");
    const rate = v.n("boilRate");
    const off = ink === 0 || col === "none";
    const w = (ink === 2 ? 1 : 0.5) * (0.5 + px * 0.6);
    const jit = (i) => (k.rnd(i) - 0.5) * wob * 6;
    const head = (x, y, r, s, i) => `<path d="${Array.from({ length: 25 }, (_, j) => `${j ? "L" : "M"}${r1(x + Math.cos((j / 24) * Math.PI * 2) * (r + jit(i * 30 + j)))} ${r1(y + Math.sin((j / 24) * Math.PI * 2) * (r + jit(i * 30 + j + 7)))}`).join(" ")}" fill="none" stroke="${col}" stroke-width="${r1(s)}" stroke-linejoin="round"/>`;
    const near = head(110, 80, 34, w * (1 + varr * 0.6), 1);
    const nearB = `<path d="${LL.bustPath(110, 80, 34)}" fill="none" stroke="${col}" stroke-width="${r1(w * (1 - varr * 0.4))}"/>`;
    const farW = w * (1 - byD * 0.7);
    const farH = `<g transform="translate(250 70) scale(0.5) translate(-110 -80)">${head(110, 80, 34, farW * 2, 2)}<path d="${LL.bustPath(110, 80, 34)}" fill="none" stroke="${col}" stroke-width="${r1(farW * 2)}"/></g>`;
    const innerL = inner ? Array.from({ length: inner * 4 }, (_, i) => `<line x1="${r1(80 + i * 8)}" y1="${r1(130 + jit(i))}" x2="${r1(84 + i * 8)}" y2="${r1(150 + jit(i + 3))}" stroke="${col}" stroke-width="${r1(w * 0.5)}"/>`).join("") : "";
    const fills = `<rect x="0" y="0" width="320" height="180" fill="#e8dcc6"/><path d="${LL.bustPath(110, 80, 34)}" fill="#c0392b"/><circle cx="110" cy="80" r="34" fill="#e8b894"/><g transform="translate(250 70) scale(0.5) translate(-110 -80)"><path d="${LL.bustPath(110, 80, 34)}" fill="#4a6fa5"/><circle cx="110" cy="80" r="34" fill="#e8b894"/></g>`;
    return `${fills}<g opacity="${off ? 0.25 : 1}"${off ? ' stroke-dasharray="3 3"' : ""}>${(near + nearB + farH + innerL).replace(/stroke="none"/g, 'stroke="#999"')}</g>${boil ? `<g opacity="0.5">${head(110, 80, 34 + boil, w, 9)}</g>` : ""}${LL.ticks(k, 236, 140, 72, Math.round(rate / 2), "#555", `redraws ${rate}/s`)}${LL.caption(k, !off ? `${v("setting")} ${colW} line, ${px} px, ${v("wobble")}` : "No ink line")}`;
  });

  /* Gloss: matte to mirror; shine spots, reflections and glints. */
  W.look("gloss", (v, k) => {
    const id = "cw-gloss";
    const g = LL.idx(v, "setting") / 2;
    const how = v.p("howMuch");
    const size = LL.idx(v, "shineSize") / 3;
    const refl = LL.idx(v, "reflects") / 3;
    const what = v("whatShines");
    const glint = LL.idx(v, "glint");
    const stops = v.p("shineStops");
    const rate = v.n("glintRate");
    const amt = cl(0.15 + g * 0.5 + how * 0.35, 0, 1);
    const floorShine = /floors|everything/.test(what) ? `<rect x="0" y="122" width="320" height="58" fill="#fff" opacity="${r1(amt * 0.15)}"/><g opacity="${r1(refl * amt * 0.6)}" transform="translate(0 244) scale(1 -1)"><rect x="22" y="22" width="56" height="52" fill="#8cc0ea"/><path d="${LL.bustPath(160, 80, 27)}" fill="#c0392b"/></g>` : "";
    const obj = `<circle cx="262" cy="105" r="16" fill="#3a6fd9" stroke="#1c1712" stroke-width="1.5"/>${/objects|everything/.test(what) ? `<ellipse cx="256" cy="98" rx="${r1(2 + size * 6)}" ry="${r1(1.5 + size * 4)}" fill="#fff" opacity="${r1(cl(amt * (0.5 + stops * 0.5), 0, 1))}"/>${refl ? `<rect x="262" y="96" width="8" height="10" fill="#8cc0ea" opacity="${r1(refl * amt)}"/>` : ""}` : ""}`;
    const glints = glint ? Array.from({ length: glint }, (_, i) => `<path d="M${200 + i * 30} ${40 + i * 18} l2 -8 l2 8 l8 2 l-8 2 l-2 8 l-2 -8 l-8 -2 z" fill="#fff"/>`).join("") : "";
    return `${LL.scene({ room: { lamp: null, plant: false }, under: floorShine + obj, bust: { key: { dark: 0.4 }, shine: /skin|everything/.test(what) ? amt * (0.6 + stops * 0.4) : 0, shineN: amt, shineSize: size }, over: glints }, k, id)}${LL.ticks(k, 236, 150, 72, Math.round(rate / 3), "#fff", `${rate} glints/min`)}${LL.caption(k, `${v("setting")} ${what}, ${v("shineSize")} shine, reflects ${v("reflects")}`)}`;
  });

  /* Light in skin: warm, pink or cool glow under the skin, where, how deep. */
  W.look("skinLight", (v, k) => {
    const id = "cw-skinLight";
    const amt = v.p("setting");
    const col = { none: "#fff0e0", warm: "#ff8a3c", pink: "#ff5f80", cool: "#6aa0ff" }[v("color")];
    const where = v("whereShows");
    const back = LL.idx(v, "backlight") / 2;
    const depth = LL.idx(v, "depth") / 2;
    const warms = LL.idx(v, "warmsUp");
    const share = v.p("glowShare");
    const t = v.n("warmTime");
    const backS = back ? `<circle cx="160" cy="82" r="${r1(50 + back * 30)}" fill="#fff4d6" opacity="${r1(back * 0.5)}"/>` : "";
    return `<rect x="0" y="0" width="320" height="180" fill="#2a2a33"/>${backS}${LL.bust({ r: 42, y: 84, key: { ang: 0, dark: 0.45, soft: 0.6 }, glow: { a: 0.15 + amt * (0.3 + share * 0.5) + back * 0.2, color: col, where, depth: depth + share * 0.5 } }, k, id)}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.2, to: warms ? 0.85 : 0.2, at: warms === 2 ? 0.45 : 0.1, len: t / 30, beat: warms === 2 ? 0.45 : null, title: "warms up" })}${LL.caption(k, v("color") === "none" ? "No color under the skin" : `${v("color")} glow in the ${where}, ${v("depth")}`)}`;
  });

  /* Saturation: the color strength of the frame, the hero, skin and which colors. */
  W.look("saturation", (v, k) => {
    const id = "cw-saturation";
    const sat = v.p("setting") * 0.5 + v.p("satPercent") * 0.5;
    const s = sat * 2;
    const trend = LL.idx(v, "trend") - 1;
    const which = v("whichColors");
    const skinP = LL.idx(v, "skinProtect") / 2;
    const hero = cl(LL.idx(v, "heroColor") / 2 * 0.5 + v.p("heroGap") * 0.5, 0, 1);
    const pace = v.n("pace");
    const from = v("satFrom");
    const room = LL.scene({ room: { lamp: { on: 0.8 }, plantColor: "#2fae3a" }, bust: false, grade: { sat: which === "all" ? s : 1 } }, k, id + "-r");
    /* which colors: draw colored swatches that follow the setting */
    const sw = [["#e04a2a", "warm"], ["#f0b030", "warm"], ["#2fae3a", "green"], ["#3a6fd9", "cool"], ["#2a9d9a", "cool"]].map(([c, t], i) => {
      const hit = which === "all" || (which === "warm ones" && t === "warm") || (which === "cool ones" && t === "cool") || (which === "greens" && t === "green");
      return `<rect x="${236 + i * 14}" y="16" width="12" height="12" fill="${hit ? k.mix("#888888", c, cl(s, 0, 1)) : c}"/>`;
    }).join("");
    const person = LL.bust({ key: { dark: 0.4 } }, k, id);
    const ps = cl(s + hero * 0.8, 0, 3);
    const personG = LL.graded(`${id}-p`, { sat: ps }, person);
    const skinFix = skinP ? `<circle cx="160" cy="80" r="27" fill="#e8b894" opacity="${r1(skinP * 0.6)}"/>` : "";
    return `${room}${personG}${skinFix}${LL.box(230, 6, 80, 28)}${sw}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.5, to: 0.5 + trend * 0.4, at: 0.1, len: pace / 60, title: "over the scene" })}${LL.chip(k, 6, 18, "measured on " + from)}${LL.caption(k, `Color strength ${v.n("satPercent")}%, ${v("trend")}`)}`;
  });

  /* Palette: main and second color, shares, harmony and colors for the characters. */
  W.look("palette", (v, k) => {
    const id = "cw-palette";
    const dom = LL.idx(v, "setting");
    const harm = LL.idx(v, "harmony");
    let h1 = LL.hueOf(v("mainHue"));
    let h2 = LL.hueOf(v("secondHue"));
    const gap = v.n("hueGap");
    const h2raw = h2;
    h2 = harm === 3 ? h2raw + gap * 0.2 : [h1, h1 + 30, h1 + 180][harm] + (gap - 60) * 0.25 + (h2raw - h1) * 0.12;
    const m = v.p("mainShare");
    const s2 = v.p("secondShare");
    const satL = [45, 60, 75, 85][dom];
    const c1 = LL.hueCss(h1, satL, 52);
    const c2 = LL.hueCss(h2, satL, 45);
    const extra = dom === 3 ? ["#e0c040", "#40b0e0", "#e060a0"] : dom === 2 ? ["#c0a060"] : [];
    const per = LL.idx(v, "perCharacter");
    const tot = Math.max(0.01, m + s2) ;
    const wallW = 320 * (m / tot);
    const people = Array.from({ length: [1, 1, 2, 3][per] }, (_, i) => LL.bust({ x: 90 + i * 70, r: 20, y: 92, shirt: per === 0 ? "#777" : i === 0 ? c2 : LL.hueCss(h1 + 60 * (i + 1), satL, 50), key: { dark: 0.3 } }, k, `${id}-p${i}`)).join("");
    const shift = v("shiftOn");
    const bar = `<rect x="236" y="16" width="${r1(72 * m / tot)}" height="10" fill="${c1}"/><rect x="${r1(236 + 72 * m / tot)}" y="16" width="${r1(72 * s2 / tot)}" height="10" fill="${c2}"/>`;
    return `<rect x="0" y="0" width="${r1(wallW)}" height="122" fill="${c1}"/><rect x="${r1(wallW)}" y="0" width="${r1(320 - wallW)}" height="122" fill="${c2}"/><rect x="0" y="122" width="320" height="58" fill="${LL.hueCss(h1, satL * 0.5, 28)}"/>${extra.map((c, i) => `<circle cx="${40 + i * 40}" cy="40" r="12" fill="${c}"/>`).join("")}${people}${LL.box(230, 6, 84, 26)}${bar}<rect x="300" y="28" width="8" height="2" fill="${LL.hueCss(h2raw, 70, 50)}"/>${LL.chip(k, 6, 18, "changes on " + shift)}${LL.caption(k, `${v("setting")}: ${v("mainHue")} with ${harm === 0 ? "more " + v("mainHue") : v("secondHue")}, ${v("harmony")}`)}`;
  });

  /* Color range: black and white through vivid, hue, film look, brightness and grain. */
  W.look("colorRange", (v, k) => {
    const id = "cw-colorRange";
    const r = LL.idx(v, "setting");
    const hue = LL.hueOf(v("paletteHue"));
    const kind = v("filterKind");
    const br = LL.idx(v, "brightness") - 2;
    const stock = LL.idx(v, "filmStock");
    const arc = LL.idx(v, "rangeArc");
    const pct = v.p("colorPercent");
    const t = v.n("rangeTime");
    const sat = ([0, 0.15, 0.5, 0.6, 1, 1.6][r] + 0.06) * (0.3 + pct * 1.4);
    const hueTone = LL.hueRGB(hue, r === 1 || r === 2 ? 0.3 : 0.06);
    const ft = { none: {}, "soft diffusion": { blur: 1.2 }, sepia: { sepia: 0.8 }, "bleach bypass": { sat: 0.5, contrast: 0.5 }, "cross processed": { tone: [0.05, 0.08, -0.12] }, "heavy tint": { tone: LL.hueRGB(hue, 0.35) } }[kind];
    const grain = stock ? Array.from({ length: stock * 70 }, (_, i) => `<circle cx="${r1(k.rnd(i + 1) * 320)}" cy="${r1(k.rnd(i + 99) * 180)}" r="${r1(0.5 + stock * 0.2)}" fill="${i % 2 ? "#fff" : "#000"}" opacity="0.35"/>`).join("") + (stock >= 3 ? `<line x1="${60 + stock * 30}" y1="0" x2="${64 + stock * 30}" y2="180" stroke="#eee" stroke-width="1" opacity="0.6"/>` : "") : "";
    return `${LL.scene({ room: { lamp: { on: 0.8 } }, bust: { key: { dark: 0.4 } }, over: grain, grade: { sat: Math.min(3, sat * (ft.sat || 1)), blur: ft.blur, sepia: ft.sepia, curve: LL.curve({ bright: br * 0.18, contrast: ft.contrast || 0 }), tone: () => hueTone.map((x, i) => x + (ft.tone ? ft.tone[i] : 0)) } }, k, id)}${LL.ramp(k, { x: 236, y: 120, w: 72, h: 22, from: 0.5, to: [0.1, 0.5, 0.9][arc], at: 0.2, len: t / 60, title: "color over the film" })}${LL.caption(k, `${v("setting")}, ${kind}, ${v("filmStock")}`)}`;
  });

  /* A color filter: how strong, in the shadows, middle or highlights, over part of the frame. */
  W.look("colorFilter", (v, k) => {
    const id = "cw-colorFilter";
    const lvl = LL.idx(v, "setting") / 3;
    const pct = v.p("tintPercent");
    const where = LL.idx(v, "tintWhere");
    const share = v.p("tintShare");
    const method = v("method");
    const marks = v("marks");
    const t = v.n("fadeTime");
    const a = lvl * 0.6 + pct * 0.4;
    const tint = LL.hueRGB(marks === "the past or a dream" ? 40 : 200, 0.45 * a);
    const wf = [(x) => (1 - x) * (1 - x) * 1.6, (x) => 1 - Math.abs(x - 0.5) * 2, (x) => x * x * 1.4, () => 1][where];
    const g = LL.scene({ room: { lamp: { on: method === "colored lights" ? 1 : 0.6, color: method === "colored lights" ? "#9ecbff" : undefined } }, bust: { key: { dark: 0.45 } }, grade: { tone: (x) => tint.map((c) => c * wf(x)) } }, k, id + "-t");
    const plain = LL.scene({ room: { lamp: { on: 0.6 } }, bust: { key: { dark: 0.45 } } }, k, id + "-p");
    const sw = r1(Math.max(4, share * 320));
    const glass = method === "glass on the lens" ? `<circle cx="300" cy="22" r="12" fill="${LL.hueCss(marks === "the past or a dream" ? 40 : 200, 70, 55)}" opacity="0.6" stroke="#ddd"/>` : method === "in the edit" ? LL.chip(k, 250, 24, "in the edit") : "";
    return `${plain}<clipPath id="${id}-c"><rect x="0" y="0" width="${sw}" height="180"/></clipPath><g clip-path="url(#${id}-c)">${g}</g>${glass}${k.meter({ x: 236, y: 150, w: 72, p: t / 30, label: `tints over ${t} s` })}${LL.chip(k, 6, 18, "marks " + marks)}${LL.caption(k, lvl ? `${v("setting")} filter in ${v("tintWhere")}, ${v.n("tintShare")}% of frame` : `No color filter (${v.n("tintPercent")}% if one is used)`)}`;
  });

  /* Filter color: the exact hue, pale or deep, and how it slides along. */
  W.look("filterHue", (v, k) => {
    const id = "cw-filterHue";
    const h0 = LL.hueOf(v("setting"));
    const ang = v.n("hueAngle");
    const h = h0 * 0.5 + ang * 0.5;
    const str = v.p("tintStrength");
    const pd = LL.idx(v, "paleDeep") - 1;
    const slide = LL.idx(v, "slide");
    const sa = v.n("slideAngle");
    const st = v.n("slideTime");
    const meaning = v("meaning");
    const tone = () => LL.hueRGB(h, 0.1 + str * 0.45).map((c) => c + pd * 0);
    const scene = LL.scene({ room: { lamp: { on: 0.7 } }, bust: { key: { dark: 0.4 } }, grade: { tone, sat: 1 + pd * 0.4, curve: LL.curve({ bright: -pd * 0.1, lift: pd < 0 ? 0.15 : 0 }) } }, k, id);
    const wheel = Array.from({ length: 12 }, (_, i) => `<path d="M270 40 L${r1(270 + Math.cos(k.rad(i * 30 - 90)) * 22)} ${r1(40 + Math.sin(k.rad(i * 30 - 90)) * 22)} A22 22 0 0 1 ${r1(270 + Math.cos(k.rad(i * 30 - 60)) * 22)} ${r1(40 + Math.sin(k.rad(i * 30 - 60)) * 22)} Z" fill="${LL.hueCss(i * 30, 70, 55)}"/>`).join("");
    const pt = (a) => [r1(270 + Math.cos(k.rad(a - 90)) * 16), r1(40 + Math.sin(k.rad(a - 90)) * 16)];
    const [x1, y1] = pt(h);
    const [x2, y2] = pt(h + sa);
    const slideM = sa ? `<path d="M${x1} ${y1} A16 16 0 ${Math.abs(sa) > 180 ? 1 : 0} ${sa > 0 ? 1 : 0} ${x2} ${y2}" fill="none" stroke="#fff" stroke-width="2"${slide ? "" : ' stroke-dasharray="2 2" opacity="0.5"'}/><circle cx="${x2}" cy="${y2}" r="2.5" fill="#fff"/>` : "";
    return `${scene}${LL.box(240, 10, 60, 60)}${wheel}${slideM}<circle cx="${x1}" cy="${y1}" r="4" fill="#fff" stroke="#000"/>${k.meter({ x: 236, y: 150, w: 72, p: st / 120, label: `slides over ${st} s` })}${LL.chip(k, 6, 18, "means " + meaning)}${LL.caption(k, `${v("paleDeep")} ${v("setting")} tint, ${v.n("tintStrength")}%, ${v("slide")}`)}`;
  });

  /* Number of colors: costume and background colors, the biggest share, the hero's color. */
  W.look("colorCount", (v, k) => {
    const id = "cw-colorCount";
    const n = Math.round(v.n("setting"));
    const bg = LL.idx(v, "bgColors");
    const cos = LL.idx(v, "costumeColors");
    const over = LL.idx(v, "overStory") - 1;
    const hero = LL.idx(v, "heroOwns") / 2;
    const big = v.p("biggestShare");
    const hues = [10, 210, 45, 130, 280, 175];
    const cols = hues.slice(0, n).map((h) => LL.hueCss(h, 65, 52));
    const rest = 320 * (1 - big);
    const bgCols = [["#9a9a9a"], [cols[0]], cols.slice(0, 3), cols.concat(["#e0c040", "#40b0e0"])][bg];
    const wall = `<rect x="0" y="0" width="${n === 1 ? 320 : r1(320 * big)}" height="122" fill="${cols[0]}"/>${n === 1 ? `<rect x="${r1(320 * big)}" y="0" width="${r1(rest)}" height="122" fill="#000" opacity="0.15"/>` : ""}` + cols.slice(1).map((c, i) => `<rect x="${r1(320 * big + (i * rest) / Math.max(1, n - 1))}" y="0" width="${r1(rest / Math.max(1, n - 1))}" height="122" fill="${c}"/>`).join("");
    const dots = bgCols.map((c, i) => `<circle cx="${30 + i * 30}" cy="140" r="9" fill="${c}" stroke="#222"/>`).join("");
    const costumes = [["#777777", "#777777", "#777777"], [cols[1 % n], cols[1 % n], cols[1 % n]], [cols[1 % n], cols[2 % n], cols[0]], [cols[1 % n], "#e0c040", "#e060a0"]][cos];
    const people = [0, 1, 2].map((i) => LL.bust({ x: 110 + i * 60, y: 96, r: 18, shirt: i === 1 && hero ? k.mix(costumes[i], cols[0], hero) : costumes[i], key: { dark: 0.3 } }, k, `${id}-${i}`)).join("");
    const story = `<g transform="translate(236 16)">${[0, 1, 2].map((s) => Array.from({ length: cl(n + over * s, 1, 8) }, (_, j) => `<rect x="${s * 26 + j * 3}" y="0" width="3" height="10" fill="${LL.hueCss(hues[j % 6], 65, 52)}"/>`).join("")).join("")}</g>`;
    return `<rect x="0" y="122" width="320" height="58" fill="#4a3c30"/>${wall}${dots}${people}${LL.box(230, 6, 84, 26)}${story}${LL.caption(k, `${n} main color${n === 1 ? "" : "s"}, biggest ${v.n("biggestShare")}%, colors ${v("overStory")} over the story`)}`;
  });

  /* Warm to cool: the frame's warmth in kelvin, faces against the room, cool shadows, and by place. */
  W.look("warmCool", (v, k) => {
    const id = "cw-warmCool";
    const word = LL.idx(v, "setting") - 2;
    const warm = cl(-word * 0.3 + LL.kelvinWarm(v.n("kelvin")) * 0.6, -1.3, 1.3);
    const face = LL.idx(v, "faceWarmth") - 1;
    const split = LL.idx(v, "coolShadows") / 2;
    const place = LL.idx(v, "byPlace");
    const t = v.n("shiftTime");
    const tone = (x) => {
      const w = LL.warmRGB(warm);
      const s = LL.warmRGB(-split * 0.8 * (1 - x) * 2);
      const h = LL.warmRGB(split * 0.6 * x);
      return [0, 1, 2].map((i) => w[i] + s[i] + h[i]);
    };
    const scene = LL.scene({ room: { lamp: { on: 0.8 } }, bust: { key: { dark: 0.5, color: face > 0 ? "#ff9a3c" : "#5aa0ff", colorA: Math.abs(face) * 0.35 } }, grade: { tone } }, k, id);
    const places = Array.from({ length: 4 }, (_, i) => `<rect x="${236 + i * 18}" y="16" width="16" height="10" fill="${k.mix("#ffb066", "#9ec4f0", cl(0.5 - warm * 0.4 + (place ? (i % 2 ? 0.3 : -0.3) * [0, 0.4, 1, 1.3][place] * (place === 3 ? (i - 1.5) / 1.5 : 1) : 0), 0, 1))}"/>`).join("");
    return `${scene}${LL.box(230, 6, 84, 26)}${places}${k.meter({ x: 236, y: 150, w: 72, p: t / 60, label: `change in ${t} s` })}${LL.caption(k, `${v("setting")}, ${v.n("kelvin")} K, faces ${v("faceWarmth")}`)}`;
  });

  /* Skin truth: scene color creeping into skin, which faces are protected, evenness and cut-to-cut match. */
  W.look("skinColorTruth", (v, k) => {
    const id = "cw-skinColorTruth";
    const truth = LL.idx(v, "setting") / 3;
    const prot = LL.idx(v, "protectWho");
    const tint = v.p("tintOnSkin");
    const even = LL.idx(v, "evenness") / 3;
    const match = LL.idx(v, "matchCuts") / 2;
    const off = v.p("hueOff");
    const sceneTint = LL.hueRGB(175, 0.35);
    const people = [0, 1, 2].map((i) => {
      const safe = prot === 3 || (prot >= 1 && i === 0) || (prot >= 2 && i === 1);
      const a = cl((1 - truth) * 0.6 + tint * 0.5 + off * 0.4, 0, 1) * (safe ? 0.15 : 1);
      const skin = k.mix("#e8b894", "#7fbfa0", a);
      return LL.bust({ x: 70 + i * 90, y: 84, r: 24, skin, shirt: ["#c0392b", "#4a6fa5", "#8a6a3a"][i], key: { dark: 0.35 } }, k, `${id}-${i}`) + (i === 0 && prot ? k.label({ x: 70, y: 52, text: "★", size: 11, color: "#ffd166" }) : "") + (even < 0.2 ? Array.from({ length: 5 }, (_, j) => `<circle cx="${r1(70 + i * 90 - 12 + k.rnd(j + i * 7) * 24)}" cy="${r1(84 + k.rnd(j + 30) * 12)}" r="2" fill="#b07a5a" opacity="0.6"/>`).join("") : "");
    }).join("");
    const cuts = [0, 1, 2].map((i) => `<rect x="${236 + i * 24}" y="16" width="22" height="12" fill="${k.mix("#e8b894", ["#d08a6a", "#f0c8a8", "#c8a070"][i], 1 - match)}" stroke="#222"/>`).join("");
    return `${LL.graded(`${id}-g`, { tone: () => sceneTint }, `<rect x="0" y="0" width="320" height="122" fill="#a8b8c0"/><rect x="0" y="122" width="320" height="58" fill="#5a6a6a"/>`)}${people}${LL.box(230, 6, 84, 26)}${cuts}${LL.caption(k, `Skin ${v("setting")}, protected: ${v("protectWho")}, off by ${v.n("hueOff")}°`)}`;
  });

  /* A surface, from the lens: a sphere and a floor tile showing shine, see-through, bumps, coat, fuzz,
     rainbow film, wet, glow and wear. */
  W.look("surfaceLens", (v, k) => {
    const id = "cw-surfaceLens";
    const mat = v("material");
    const shine = LL.idx(v, "shine") / 2;
    const see = LL.idx(v, "seeThrough") / 2;
    const bumps = LL.idx(v, "bumps") / 3;
    const coat = LL.idx(v, "coat") / 2;
    const sheen = LL.idx(v, "sheen") / 2;
    const rainbow = LL.idx(v, "rainbow");
    const wet = LL.idx(v, "wet") / 2;
    const glow = LL.idx(v, "glow");
    const wear = LL.idx(v, "wear") / 2;
    const refl = v.p("reflectPercent");
    const rough = v.p("roughness");
    const thru = v.p("lightThrough");
    const base = { matte: "#b04a3a", satin: "#b04a3a", glossy: "#c0392b", mirror: "#b8c0c8", metal: "#8a8f96", glass: "#9fd0e0" }[mat];
    const cx = 160;
    const cy = 82;
    const R = 46;
    const spec = cl(shine * 0.5 + refl * 0.4 + coat * 0.3 + wet * 0.3 - rough * 0.3, 0, 1);
    const bl = rough * 6;
    const defs = `<defs><radialGradient id="${id}-b" cx="0.35" cy="0.3"><stop offset="0" stop-color="${k.mix(base, "#ffffff", 0.35)}"/><stop offset="1" stop-color="${k.mix(base, "#000000", 0.5)}"/></radialGradient><filter id="${id}-s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r1(0.3 + bl)}"/></filter><clipPath id="${id}-c"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><linearGradient id="${id}-rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fa2"/><stop offset="0.33" stop-color="#ffe45f"/><stop offset="0.66" stop-color="#5fffc8"/><stop offset="1" stop-color="#7a5fff"/></linearGradient></defs>`;
    const stripes = `<g clip-path="url(#${id}-c)">${Array.from({ length: 8 }, (_, i) => `<rect x="${cx - R + i * 12}" y="${cy - R}" width="6" height="${2 * R}" fill="#222" opacity="${r1(see * 0.4 + thru * 0.4)}"/>`).join("")}</g>`;
    const ball = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${id}-b)" opacity="${r1(1 - see * 0.4 - thru * 0.3)}"/>`;
    const bumpS = bumps ? `<g clip-path="url(#${id}-c)">${Array.from({ length: Math.round(bumps * 70) }, (_, i) => `<circle cx="${r1(cx - R + k.rnd(i + 2) * 2 * R)}" cy="${r1(cy - R + k.rnd(i + 60) * 2 * R)}" r="${r1(0.6 + bumps * 2)}" fill="#000" opacity="0.25"/>`).join("")}</g>` : "";
    const reflS = refl > 0.05 ? `<g clip-path="url(#${id}-c)" opacity="${r1(refl * 0.7 * (1 - rough * 0.6))}"><rect x="${cx - 30}" y="${cy - 30}" width="18" height="14" fill="#8cc0ea" filter="url(#${id}-s)"/><rect x="${cx - R}" y="${cy + 14}" width="${2 * R}" height="${R}" fill="#6d5a48"/></g>` : "";
    const specS = `<ellipse cx="${cx - 16}" cy="${cy - 18}" rx="${r1(4 + rough * 12)}" ry="${r1(3 + rough * 8)}" fill="#fff" opacity="${r1(spec)}" filter="url(#${id}-s)"/>`;
    const coatS = coat ? `<circle cx="${cx}" cy="${cy}" r="${R + 1}" fill="none" stroke="#fff" stroke-width="${r1(coat * 3)}" opacity="0.5"/>` : "";
    const sheenS = sheen ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${k.mix(base, "#ffffff", 0.6)}" stroke-width="${r1(sheen * 8)}" opacity="0.55" filter="url(#${id}-s)"/>` : "";
    const rbS = rainbow ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${id}-rb)" opacity="${rainbow === 1 ? 0.3 : 0.45}"/>` : "";
    const wetS = wet ? Array.from({ length: Math.round(wet * 8) }, (_, i) => `<ellipse cx="${r1(cx - 30 + k.rnd(i + 5) * 60)}" cy="${r1(cy - 20 + k.rnd(i + 9) * 50)}" rx="2.5" ry="3.5" fill="#fff" opacity="0.7"/>`).join("") : "";
    const glowS = glow ? `<circle cx="${cx}" cy="${cy}" r="${R + 6 + glow * 10}" fill="#ffd27a" opacity="${r1(0.12 + glow * 0.08)}"/>` : "";
    const wearS = wear ? `<g clip-path="url(#${id}-c)">${Array.from({ length: Math.round(wear * 14) }, (_, i) => `<line x1="${r1(cx - R + k.rnd(i + 3) * 2 * R)}" y1="${r1(cy - R + k.rnd(i + 13) * 2 * R)}" x2="${r1(cx - R + k.rnd(i + 3) * 2 * R + 10)}" y2="${r1(cy - R + k.rnd(i + 13) * 2 * R + 4)}" stroke="#e8e0d0" stroke-width="1"/>`).join("")}</g>` : "";
    const bg = `<rect x="0" y="0" width="320" height="120" fill="#c9bba4"/><rect x="0" y="120" width="320" height="60" fill="#6d5a48"/>`;
    return `${bg}${defs}${glowS}${stripes}${ball}${bumpS}${reflS}${rbS}${sheenS}${coatS}${specS}${wetS}${wearS}<ellipse cx="${cx}" cy="${cy + R + 6}" rx="${R * 0.8}" ry="6" fill="#000" opacity="${r1(0.4 - see * 0.2)}"/>${LL.caption(k, `${mat}: ${v("shine")}, ${v("seeThrough")}, ${v("bumps")}`)}`;
  });

  /* Rendering look, from the lens: outline, shading bands, hatching, wobble, paper. */
  W.look("renderLookLens", (v, k) => {
    const id = "cw-renderLookLens";
    const look = v("look");
    const outline = LL.idx(v, "outline");
    const bands = LL.idx(v, "bands");
    const hatch = LL.idx(v, "hatching");
    const wob = LL.idx(v, "wobble") / 2;
    const paper = LL.idx(v, "paper");
    const rate = v.n("drawRate");
    const px = v.n("linePx");
    const levels = [0, 4, 3, 2][bands];
    const curve = levels ? (x) => Math.round(x * (levels - 1)) / (levels - 1) : null;
    const lf = look === "painterly" ? { blur: 1.4, sat: 1.15 } : look === "toon" ? { sat: 1.4 } : look === "flat" ? { sat: 1.2, curve: (x) => Math.round(x * 2) / 2 } : {};
    const g = Object.assign({}, lf, curve ? { curve } : {});
    const base = LL.scene({ room: { lamp: { on: 0.8 } }, bust: { key: { dark: 0.6, soft: 0.6 } }, grade: g }, k, id);
    const w = (outline === 2 ? 1.2 : 0.6) * (0.5 + px * 0.5);
    const jit = (i) => (k.rnd(i) - 0.5) * wob * 6;
    const line = `<g opacity="${outline ? 1 : 0.25}"><path d="${Array.from({ length: 17 }, (_, j) => `${j ? "L" : "M"}${r1(160 + Math.cos((j / 16) * Math.PI * 2) * (27 + jit(j)))} ${r1(80 + Math.sin((j / 16) * Math.PI * 2) * (27 + jit(j + 5)))}`).join(" ")}" fill="none" stroke="#111" stroke-width="${r1(w)}"/><path d="${LL.bustPath(160, 80, 27)}" fill="none" stroke="#111" stroke-width="${r1(w)}"/></g>`;
    const hatchS = hatch ? `<defs><clipPath id="${id}-h"><rect x="100" y="60" width="60" height="120"/></clipPath></defs><g clip-path="url(#${id}-h)" stroke="#111" stroke-width="0.7" opacity="0.6">${Array.from({ length: 24 }, (_, i) => `<line x1="${90 + i * 5}" y1="60" x2="${70 + i * 5}" y2="180"/>`).join("")}${hatch === 2 ? Array.from({ length: 24 }, (_, i) => `<line x1="${70 + i * 5}" y1="60" x2="${90 + i * 5}" y2="180"/>`).join("") : ""}</g>` : "";
    const paperS = paper ? `<rect x="0" y="0" width="320" height="180" fill="${paper === 3 ? "#f4ecd8" : "#efe6d2"}" opacity="${[0, 0.1, 0.18, 0.28][paper]}"/>${Array.from({ length: paper * 40 }, (_, i) => `<circle cx="${r1(k.rnd(i + 3) * 320)}" cy="${r1(k.rnd(i + 70) * 180)}" r="0.8" fill="#8a7a62" opacity="0.4"/>`).join("")}${paper === 3 ? `<circle cx="80" cy="140" r="40" fill="#9fc3e6" opacity="0.2"/>` : ""}` : "";
    return `${base}${line}${hatchS}${paperS}${LL.ticks(k, 236, 130, 72, Math.round(rate / 2), "#ffd166", `${rate} drawings/s`)}${LL.chip(k, 6, 18, "changes " + v("lookMoment"))}${LL.caption(k, `${look}, ${v("outline")} outline, ${v("bands")} shading`)}`;
  });

  /* Layers of depth, from the lens: foreground, middle and far, fog, contact shadows and where attention goes. */
  W.look("layersLens", (v, k) => {
    const id = "cw-layersLens";
    const sep = LL.idx(v, "separation");
    const fog = LL.idx(v, "depthFog") / 2;
    const contact = LL.idx(v, "contact") / 2;
    const mix = LL.idx(v, "lightMix") - 1;
    const iso = LL.idx(v, "isolate") / 2;
    const att = LL.idx(v, "attention") - 1;
    const n = Math.round(v.n("layerCount"));
    const fs = v.p("fogStart");
    const fvb = v.n("frontVsBack") / 4;
    const layers = Math.max(1, Math.min(8, Math.round(n * 0.5 + sep * 0.8)));
    const fogA = (i) => (sep === 0 ? 0 : cl((i / Math.max(1, layers - 1) - fs * 0.8) * fog * 1.2, 0, 0.85));
    const hills = Array.from({ length: layers }, (_, i) => {
      const j = layers - 1 - i;
      const y = 60 + i * (60 / layers);
      const col = k.mix("#3f6a4a", "#c8d4dc", fogA(j));
      const bright = cl(0.5 - fvb * 0.3 * (j / Math.max(1, layers - 1)) * 2 + mix * 0.2, 0, 1);
      return `<path d="M0 ${r1(y + 20)} Q80 ${r1(y - 10 + (i % 2) * 10)} 160 ${r1(y + 6)} T320 ${r1(y)} L320 180 L0 180 Z" fill="${k.mix(col, "#ffffff", bright * 0.25)}" opacity="${sep === 0 ? 0.35 : 1}"/>`;
    }).join("");
    const sky = `<rect x="0" y="0" width="320" height="180" fill="${k.mix("#8cc0ea", "#e0e6ec", fog * 0.6)}"/>`;
    const shadow = `<ellipse cx="160" cy="166" rx="40" ry="5" fill="#000" opacity="${r1(contact * 0.6)}"/>`;
    const person = LL.bust({ x: 160, y: 96, r: 22, key: { dark: 0.4 }, dim: cl(fvb < 0 ? -fvb * 0.4 : 0, 0, 0.5) }, k, id);
    const isoS = iso ? `<rect x="0" y="0" width="320" height="180" fill="#000" opacity="${r1(iso * 0.45)}"/>` : "";
    const att2 = att < 0 ? k.ring({ x: 260, y: 60, r: 22, color: "#ffd166", dash: "3 3" }) : att > 0 ? k.ring({ x: 160, y: 110, r: 40, color: "#ffd166", dash: "3 3" }) : "";
    const blurF = `<defs><filter id="${id}-bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${att > 0 ? 1.5 : 0}"/></filter></defs>`;
    return `${blurF}<g filter="url(#${id}-bl)">${sky}${hills}</g>${isoS}${shadow}<path d="M100 166 L220 166" stroke="#000" opacity="0"/>${person}${att2}${LL.caption(k, `${v("separation")}, ${layers} layer${layers === 1 ? "" : "s"}, fog from ${v.n("fogStart")} m`)}`;
  });
  /* Dot grids where two settings pair naturally (only where the window has no pad yet). */
  const pad = (id, x, y, xLabel, yLabel) => {
    const spec = W.get(id);
    if (spec && (spec.faces || []).some((f) => f.face === "pad")) return;
    W.add(id, { window: { faces: [{ face: "pad", x, y, xLabel, yLabel }] } });
  };
  pad("glow", "glowSize", "reach", "bigger in frame", "reaches further");
  pad("contrast", "contrastStops", "contrastTime", "bright to dark, stops", "time to get there");
  pad("colorTemp", "kelvin", "castAmount", "kelvin", "green to pink");
  pad("saturation", "satPercent", "heroGap", "color strength", "hero more colorful");
  pad("lightShape", "patternAngle", "patternShare", "tilt", "share of frame");
  pad("atmosphere", "visibility", "depthFade", "see further", "far fades more");
  pad("valueKey", "darkShare", "litShare", "more in shadow", "more in full light");
  pad("filterHue", "hueAngle", "tintStrength", "color on the wheel", "stronger tint");
  pad("lightingLens", "litShare", "faceVsRoom", "more of frame lit", "face brighter than room");
  pad("wetness", "wetShare", "reflections", "more surfaces wet", "more reflection");
  pad("lightCount", "setting", "keyShare", "more lights", "brightest light's share");
  pad("warmCool", "kelvin", "shiftTime", "kelvin", "time to change");
  pad("skinLight", "glowShare", "warmTime", "more of the face", "time to warm up");
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
