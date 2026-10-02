/* Motion: the animation principles a Maya animator sets with keys, tangents and timing, on one
   moving object. Spacing (tangent shape), drawn on ones, twos or threes (stepped keys), anticipation,
   overshoot, squash and stretch, path shape (motion path), ghosting and the motion trail.
   "Draw path" is Maya's Attach to Motion Path: draw a path freehand or drag its 3 to 6 control
   points, and the object rides it with the same spacing, with Follow (turns along the path) and
   Bank (tilts into turns). An editable motion trail lets you drag a frame's dot along the path to
   retime it, like Maya's Editable Motion Trail; the override is kept in order with its neighbours.
   Every control is a curiosity from the Animation group of the catalog. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-motion-v1";
  const DEFAULT_PATH = [[0.1, 0.75], [0.3, 0.35], [0.5, 0.62], [0.7, 0.3], [0.9, 0.7]];
  const DEFAULTS = {
    move: "hop", spacing: "ease both", stepping: "ones", anticipation: "small", overshoot: "settle", squash: 2, arcs: "arc", ghosts: 4, trail: true, fps: 24, frames: 36,
    path: DEFAULT_PATH, pathTool: "points", follow: true, bank: true, editTrail: false, override: [],
  };
  const CHOICES = {
    move: ["hop", "slide", "swing", "drop", "drawn path"],
    spacing: ["even", "ease in", "ease out", "ease both", "snap"],
    stepping: ["ones", "twos", "threes"],
    anticipation: ["none", "small", "big"],
    overshoot: ["none", "settle", "bounce"],
    arcs: ["straight", "arc", "figure eight"],
  };
  const W = 600, H = 300;
  let timer = null;

  function css() {
    if (document.getElementById("studio-motion")) return;
    const st = document.createElement("style");
    st.id = "studio-motion";
    st.textContent = `#motion-canvas{touch-action:none}#motion-canvas.edit{cursor:crosshair}.mo-row{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center}.mo-row label{font-size:13px}`;
    document.head.appendChild(st);
  }

  function ease(kind, t) {
    if (kind === "even") return t;
    if (kind === "ease in") return t * t;
    if (kind === "ease out") return 1 - (1 - t) * (1 - t);
    if (kind === "snap") return t < 0.15 ? t / 0.15 : 1;
    return t * t * (3 - 2 * t);
  }

  /* 0..1 progress along the move at time u (0..1), with anticipation before and overshoot after. */
  function progress(s, u) {
    const a = { none: 0, small: 0.12, big: 0.25 }[s.anticipation];
    const o = s.overshoot === "none" ? 0 : 0.25;
    const moveEnd = 1 - o;
    if (u < a) return -0.08 * (a > 0.2 ? 2 : 1) * Math.sin((u / a) * Math.PI * 0.5);
    if (u < moveEnd) {
      const t = (u - a) / (moveEnd - a);
      const start = a ? -0.08 * (a > 0.2 ? 2 : 1) : 0;
      return start + (1 - start) * ease(s.spacing, t);
    }
    const t = (u - moveEnd) / (1 - moveEnd || 1);
    if (s.overshoot === "settle") return 1 + 0.08 * Math.sin(t * Math.PI) * (1 - t);
    return 1 + 0.12 * Math.sin(t * Math.PI * 3) * Math.pow(1 - t, 2);
  }

  const stepOf = (s) => ({ ones: 1, twos: 2, threes: 3 }[s.stepping]);
  const baseP = (s, f) => progress(s, Math.min(1, Math.max(0, f / (s.frames - 1))));
  /* Progress at a drawing frame, with the trail's hand edits on top. */
  function pAt(s, f) {
    const o = s.override && s.override[f];
    return o != null ? o : baseP(s, f);
  }

  /* ---------- drawn path: a Catmull-Rom curve through the control points, by arc length ---------- */
  let cacheKey = "", cache = null;
  function drawnPath(s) {
    const key = JSON.stringify(s.path);
    if (key === cacheKey) return cache;
    const P = (s.path && s.path.length >= 2 ? s.path : DEFAULT_PATH).map(([x, y]) => ({ x: x * W, y: y * H }));
    const pts = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const n = P.length > 8 ? 6 : 16;
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
        pts.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
      }
    }
    pts.push(P[P.length - 1]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    cacheKey = key;
    cache = { pts, cum, total: cum[cum.length - 1] || 1, ctrl: P };
    return cache;
  }
  function drawnAt(s, p) {
    const d = drawnPath(s), { pts, cum, total } = d;
    const dir = (a, b) => {
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
    };
    if (p <= 0) {
      const v = dir(pts[0], pts[1]);
      return { x: pts[0].x + v.x * p * total, y: pts[0].y + v.y * p * total };
    }
    if (p >= 1) {
      const n = pts.length - 1, v = dir(pts[n - 1], pts[n]);
      return { x: pts[n].x + v.x * (p - 1) * total, y: pts[n].y + v.y * (p - 1) * total };
    }
    const target = p * total;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (cum[m] < target) lo = m;
      else hi = m;
    }
    const t = (target - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * t, y: pts[lo].y + (pts[hi].y - pts[lo].y) * t };
  }

  function pathAt(s, p, w, h) {
    if (s.move === "drawn path") return drawnAt(s, p);
    const x0 = w * 0.15, x1 = w * 0.85, y = h * 0.72;
    const x = x0 + (x1 - x0) * p;
    if (s.move === "drop") return { x: w * 0.5, y: h * 0.12 + (y - h * 0.12) * Math.min(Math.max(p, -0.2), 1.2) };
    if (s.move === "swing") {
      const ang = (-0.9 + 1.8 * p);
      return { x: w * 0.5 + Math.sin(ang) * h * 0.55, y: h * 0.12 + Math.cos(ang) * h * 0.55 };
    }
    let lift = 0;
    if (s.move === "hop") lift = s.arcs === "straight" ? 0 : Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI) * h * 0.45;
    let side = 0;
    if (s.arcs === "figure eight") side = Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI * 2) * h * 0.12;
    return { x, y: y - lift + side };
  }

  function tangentAng(s, p) {
    const a = pathAt(s, p - 0.01, W, H), b = pathAt(s, p + 0.01, W, H);
    return Math.atan2(b.y - a.y, b.x - a.x);
  }
  /* Bank: lean into the turn, from how fast the path direction changes. */
  function bankAt(s, p) {
    let d = tangentAng(s, p + 0.03) - tangentAng(s, p - 0.03);
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.max(-0.6, Math.min(0.6, d * 1.2));
  }

  function frameState(s, f, w, h) {
    const step = stepOf(s);
    const held = Math.floor(f / step) * step;
    const p = pAt(s, held);
    const pos = pathAt(s, p, w, h);
    const prev = pathAt(s, pAt(s, Math.max(0, held - step)), w, h);
    const speed = Math.hypot(pos.x - prev.x, pos.y - prev.y) / step;
    const stretch = 1 + Math.min(speed / 30, 0.6) * (s.squash / 5);
    const landing = s.move !== "slide" && s.move !== "swing" && s.move !== "drawn path" && p > 0.97 && p < 1.03 ? 1 - (s.squash / 5) * 0.35 : 1;
    const moving = Math.hypot(pos.x - prev.x, pos.y - prev.y) > 0.5;
    const ang = s.move === "drawn path" && s.follow ? tangentAng(s, Math.min(1, Math.max(0, p))) : moving ? Math.atan2(pos.y - prev.y, pos.x - prev.x) : 0;
    const bank = s.move === "drawn path" && s.bank ? bankAt(s, Math.min(0.97, Math.max(0.03, p))) : 0;
    return { pos, p, stretch: landing < 1 ? landing : stretch, ang: landing < 1 ? 0 : ang, squashed: landing < 1, bank };
  }

  function drawBall(ctx, st, r, alpha, s) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(st.pos.x, st.pos.y);
    const follow = s && s.move === "drawn path" && s.follow;
    if (st.squashed) ctx.scale(1 / st.stretch, st.stretch);
    else {
      ctx.rotate(st.ang + (follow ? 0 : st.bank));
      ctx.scale(st.stretch, (1 / st.stretch) * (follow && st.bank ? Math.cos(st.bank) : 1));
    }
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "#c45c26";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1c1712";
    ctx.stroke();
    if (follow) {
      ctx.beginPath();
      ctx.moveTo(r + 7, 0);
      ctx.lineTo(r - 2, -5);
      ctx.lineTo(r - 2, 5);
      ctx.closePath();
      ctx.fillStyle = "#1c1712";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.4, -r * 0.35, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (s && s.move === "drawn path" && s.bank && Math.abs(st.bank) > 0.02 && alpha === 1) {
      /* a little wing bar above the object tilts with the bank */
      ctx.save();
      ctx.translate(st.pos.x, st.pos.y - r - 10);
      ctx.rotate(st.bank);
      ctx.strokeStyle = "#1c1712";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  function render(canvas, s, f, ui) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(28,23,18,0.3)";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72 + 14);
    ctx.lineTo(w, h * 0.72 + 14);
    ctx.stroke();
    if (s.move === "drawn path") {
      const d = drawnPath(s);
      ctx.strokeStyle = "rgba(28,23,18,0.25)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      d.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.lineWidth = 1;
      if (d.ctrl.length <= 6 && !s.editTrail)
        d.ctrl.forEach((p, i) => {
          ctx.fillStyle = ui.dragCtrl === i ? "#c45c26" : "#fff";
          ctx.strokeStyle = "#1c1712";
          ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
          ctx.strokeRect(p.x - 6, p.y - 6, 12, 12);
        });
    }
    if (ui.stroke && ui.stroke.length > 1) {
      ctx.strokeStyle = "#c45c26";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ui.stroke.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    if (s.trail) {
      ctx.strokeStyle = "rgba(184,137,45,0.8)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let i = 0; i < s.frames; i++) {
        const p = frameState(s, i, w, h).pos;
        if (i) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      const step = stepOf(s);
      for (let i = 0; i < s.frames; i += step) {
        const p = pathAt(s, pAt(s, i), w, h);
        const edited = s.override && s.override[i] != null;
        if (s.editTrail) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, ui.dragFrame === i ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = edited ? "#c45c26" : "rgba(28,23,18,0.6)";
          ctx.fill();
        } else {
          ctx.fillStyle = edited ? "#c45c26" : "rgba(28,23,18,0.45)";
          ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        }
      }
    }
    for (let g = s.ghosts; g >= 1; g--) {
      const gf = f - g * 2;
      if (gf >= 0) drawBall(ctx, frameState(s, gf, w, h), 14, 0.12 + 0.05 * (s.ghosts - g), s);
    }
    drawBall(ctx, frameState(s, f, w, h), 14, 1, s);
    ctx.fillStyle = "#1c1712";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText(`frame ${f + 1}/${s.frames} · ${s.fps} fps`, 8, 16);
    if (ui.hint) ctx.fillText(ui.hint, 8, h - 8);
  }

  /* The spacing chart animators draw: one tick per frame between the two keys. */
  function spacingChart(s) {
    const ticks = [];
    const step = stepOf(s);
    for (let i = 0; i < s.frames; i += step) {
      const p = pAt(s, i);
      const edited = s.override && s.override[i] != null;
      const col = edited ? "#2a6f97" : p < 0 || p > 1 ? "#c45c26" : "#1c1712";
      ticks.push(`<line x1="${(20 + p * 560).toFixed(1)}" x2="${(20 + p * 560).toFixed(1)}" y1="10" y2="${p < 0 || p > 1 ? 40 : 30}" stroke="${col}" stroke-width="2"/>`);
    }
    return `<svg class="view" viewBox="0 0 600 48" role="img" aria-label="Spacing chart" id="motion-chart"><line x1="20" x2="580" y1="20" y2="20" stroke="rgba(28,23,18,0.3)"/>${ticks.join("")}<text x="20" y="46" font-size="10">key A</text><text x="548" y="46" font-size="10">key B</text></svg>`;
  }

  /* Path shape measured from the path the object actually travels: straight, arc or figure eight. */
  function measureArcs(s) {
    const pts = [];
    for (let i = 0; i <= 80; i++) pts.push(pathAt(s, i / 80, W, H));
    const a = pts[0], b = pts[pts.length - 1];
    let len = 0, dev = 0;
    const cl = Math.hypot(b.x - a.x, b.y - a.y);
    pts.forEach((p, i) => {
      if (i) len += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      const d = cl > 1 ? Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / cl : Math.hypot(p.x - a.x, p.y - a.y);
      dev = Math.max(dev, d);
    });
    if (len < 1 || dev / len < 0.05) return "straight";
    /* crossings of the path with itself */
    const cross = (p1, p2, p3, p4) => {
      const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
      if (Math.abs(d) < 1e-9) return false;
      const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
      const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
      return t > 0 && t < 1 && u > 0 && u < 1;
    };
    for (let i = 0; i < pts.length - 1; i++) for (let j = i + 2; j < pts.length - 1; j++) if (cross(pts[i], pts[i + 1], pts[j], pts[j + 1])) return "figure eight";
    let changes = 0, last = 0;
    for (let i = 2; i < pts.length; i++) {
      const c = (pts[i - 1].x - pts[i - 2].x) * (pts[i].y - pts[i - 1].y) - (pts[i - 1].y - pts[i - 2].y) * (pts[i].x - pts[i - 1].x);
      if (Math.abs(c) < 2) continue;
      const sg = Math.sign(c);
      if (last && sg !== last) changes++;
      last = sg;
    }
    return changes >= 3 ? "figure eight" : "arc";
  }

  /* Nearest progress (0..1) on the path to a canvas point. */
  function nearestP(s, x, y) {
    let best = 0, bd = Infinity;
    for (let i = 0; i <= 400; i++) {
      const p = i / 400, q = pathAt(s, p, W, H);
      const d = (q.x - x) * (q.x - x) + (q.y - y) * (q.y - y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  /* Freehand stroke to at most 24 control points spaced along its length. */
  function simplify(stroke, n) {
    const cum = [0];
    for (let i = 1; i < stroke.length; i++) cum.push(cum[i - 1] + Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y));
    const total = cum[cum.length - 1];
    const out = [];
    for (let k = 0; k < n; k++) {
      const t = (k / (n - 1)) * total;
      let i = 0;
      while (i < cum.length - 1 && cum[i + 1] < t) i++;
      const p = stroke[Math.min(i + 1, stroke.length - 1)];
      out.push([Math.round((p.x / W) * 1000) / 1000, Math.round((p.y / H) * 1000) / 1000]);
    }
    return out;
  }

  function draw(el, api) {
    css();
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign({}, DEFAULTS, st.get({}));
    if (!Array.isArray(s.override) || s.override.length !== s.frames) s.override = Array(s.frames).fill(null);
    if (timer) cancelAnimationFrame(timer);
    const drawn = s.move === "drawn path";
    const arcs = drawn ? measureArcs(s) : s.arcs;
    const edits = s.override.filter((v) => v != null).length;
    let maxBank = 0;
    if (drawn && s.bank) for (let i = 0; i <= 40; i++) maxBank = Math.max(maxBank, Math.abs(bankAt(s, 0.03 + (0.94 * i) / 40)));
    const sel = (k, label) =>
      `<label class="field">${esc(label)}<select data-k="${k}">${CHOICES[k].map((v) => `<option ${s[k] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
    el.innerHTML = `<div class="studio-grid">
      <div>
        ${sel("move", "The move")}
        ${sel("spacing", "Spacing (tangents)")}
        ${sel("stepping", "Drawn on")}
        ${sel("anticipation", "Anticipation")}
        ${sel("overshoot", "Overshoot")}
        ${drawn ? `<p class="cap">Path shape is measured from your path: <strong>${esc(arcs)}</strong>.</p>` : sel("arcs", "Path shape")}
        <label class="field">Squash and stretch: ${s.squash}<input type="range" min="0" max="5" data-k="squash" value="${s.squash}"></label>
        <label class="field">Frames between keys: ${s.frames}<input type="range" min="8" max="72" data-k="frames" value="${s.frames}"></label>
        <label class="field">Frame rate<select data-k="fps">${[12, 24, 25, 30].map((v) => `<option ${s.fps == v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="field">Ghosts: ${s.ghosts}<input type="range" min="0" max="8" data-k="ghosts" value="${s.ghosts}"></label>
        <label class="field"><span><input type="checkbox" data-k="trail" ${s.trail ? "checked" : ""}> Motion trail</span></label>
        <label class="field"><span><input type="checkbox" data-k="editTrail" ${s.editTrail ? "checked" : ""}> Edit the trail (drag dots to retime)</span></label>
      </div>
      <div>
        ${drawn
          ? `<div class="mo-row"><label><input type="radio" name="mo-tool" data-tool="points" ${s.pathTool === "points" ? "checked" : ""}> Drag points</label>
             <label><input type="radio" name="mo-tool" data-tool="freehand" ${s.pathTool === "freehand" ? "checked" : ""}> Draw freehand</label>
             <label><input type="checkbox" data-k="follow" ${s.follow ? "checked" : ""}> Follow</label>
             <label><input type="checkbox" data-k="bank" ${s.bank ? "checked" : ""}> Bank</label>
             <label>Points <select data-act="npts">${[3, 4, 5, 6].map((n) => `<option ${s.path.length === n ? "selected" : ""}>${n}</option>`).join("")}${s.path.length > 6 ? `<option selected value="">${s.path.length} (freehand)</option>` : ""}</select></label></div>`
          : `<div class="mo-row"><button type="button" data-act="drawmode">Draw a path</button><span class="cap">Or pick “drawn path” as the move.</span></div>`}
        <canvas width="${W}" height="${H}" id="motion-canvas" class="${drawn || s.editTrail ? "edit" : ""}"></canvas>
        <p class="cap">Spacing chart: one tick per drawing. Ticks bunched together are slow; spread out is fast. Orange ticks go past the keys (anticipation and overshoot); blue ticks are frames you moved on the trail.</p>
        ${spacingChart(s)}
        <p id="motion-chips">${["spacing", "stepping", "anticipation", "overshoot"].map((k) => `<span class="chip">${k} ${esc(s[k])}</span>`).join(" ")} <span class="chip">arcs ${esc(arcs)}</span> <span class="chip">squash ${s.squash}</span>${drawn ? ` <span class="chip">follow ${s.follow ? "on" : "off"}</span> <span class="chip">bank ${s.bank ? Math.round((maxBank * 180) / Math.PI) + "°" : "off"}</span>` : ""}${edits ? ` <span class="chip">retimed frames ${edits}</span>` : ""}</p>
        <div class="bar-actions"><button type="button" data-act="keep">Keep on Shelf</button> <button type="button" data-act="reset" ${edits ? "" : "disabled"}>Reset spacing</button> <span class="cap">None of these are board controls, so they go to the Shelf only.</span></div>
        <p class="cap">Takes ${(s.frames / s.fps).toFixed(2)} s. In Maya this is two keys on the Graph Editor, the tangent type, stepped keys for twos, Ghosting, an Editable Motion Trail${drawn ? ", and Attach to Motion Path with Follow and Bank" : ""}.</p>
      </div></div>`;
    const save = () => st.set(s);
    const redraw = () => {
      save();
      draw(el, api);
    };
    el.querySelectorAll("[data-k]").forEach((x) =>
      x.addEventListener(x.type === "range" ? "input" : "change", () => {
        const k = x.dataset.k;
        s[k] = x.type === "checkbox" ? x.checked : x.type === "range" || k === "fps" ? Number(x.value) : x.value;
        if (k === "trail" && !s.trail) s.editTrail = false;
        if (k === "editTrail" && s.editTrail) s.trail = true;
        redraw();
      })
    );
    el.querySelectorAll("[data-tool]").forEach((x) => x.addEventListener("change", () => ((s.pathTool = x.dataset.tool), redraw())));
    const npts = el.querySelector('[data-act="npts"]');
    if (npts)
      npts.addEventListener("change", () => {
        const n = Number(npts.value);
        if (!n) return;
        const d = drawnPath(s);
        s.path = simplify(d.pts, n);
        redraw();
      });
    const dm = el.querySelector('[data-act="drawmode"]');
    if (dm) dm.addEventListener("click", () => ((s.move = "drawn path"), (s.pathTool = "freehand"), redraw()));
    el.querySelector('[data-act="reset"]').addEventListener("click", () => ((s.override = Array(s.frames).fill(null)), redraw()));
    el.querySelector('[data-act="keep"]').addEventListener("click", () => {
      if (!api.toShelf) return;
      api.toShelf("Motion · " + s.move, {
        spacing: [s.spacing],
        stepping: [s.stepping],
        anticipation: [s.anticipation],
        overshoot: [s.overshoot],
        arcs: [arcs],
        squash: [Number(s.squash)],
      });
    });

    /* ---------- canvas: draw the path, drag its points, or drag trail dots to retime ---------- */
    const canvas = el.querySelector("#motion-canvas");
    const ui = { stroke: null, dragCtrl: null, dragFrame: null, hint: "" };
    if (s.editTrail) ui.hint = "Drag a dot along the path to retime that frame.";
    else if (drawn && s.pathTool === "freehand") ui.hint = "Draw a path with your finger or mouse.";
    else if (drawn) ui.hint = "Drag the square points to shape the path.";
    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };
    const neighbours = (f) => {
      const step = stepOf(s);
      return [f - step >= 0 ? pAt(s, f - step) : -Infinity, f + step < s.frames ? pAt(s, f + step) : Infinity, f - step >= 0 ? baseP(s, f - step) : -Infinity, f + step < s.frames ? baseP(s, f + step) : Infinity];
    };
    canvas.addEventListener("pointerdown", (e) => {
      const q = at(e);
      if (s.editTrail && s.trail) {
        let best = -1, bd = 18 * 18;
        for (let i = 0; i < s.frames; i += stepOf(s)) {
          const p = pathAt(s, pAt(s, i), W, H);
          const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        if (best < 0) return;
        ui.dragFrame = best;
      } else if (drawn && s.pathTool === "freehand") {
        ui.stroke = [q];
      } else if (drawn && s.path.length <= 6) {
        const d = drawnPath(s);
        const i = d.ctrl.findIndex((p) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 < 16 * 16);
        if (i < 0) return;
        ui.dragCtrl = i;
      } else return;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", (e) => {
      const q = at(e);
      if (ui.stroke) {
        const l = ui.stroke[ui.stroke.length - 1];
        if (Math.hypot(q.x - l.x, q.y - l.y) > 4) ui.stroke.push(q);
      } else if (ui.dragCtrl != null) {
        s.path = s.path.map((p, i) => (i === ui.dragCtrl ? [Math.round(Math.max(0, Math.min(1, q.x / W)) * 1000) / 1000, Math.round(Math.max(0, Math.min(1, q.y / H)) * 1000) / 1000] : p));
      } else if (ui.dragFrame != null) {
        const f = ui.dragFrame;
        let p = nearestP(s, q.x, q.y);
        const [lo, hi, blo, bhi] = neighbours(f);
        /* keep order where the move runs forward; anticipation and overshoot frames may run back */
        const forward = blo <= baseP(s, f) && baseP(s, f) <= bhi;
        if (forward) p = Math.max(lo === -Infinity ? 0 : lo, Math.min(hi === Infinity ? 1 : hi, p));
        s.override[f] = Math.round(p * 1000) / 1000;
        const ch = el.querySelector("#motion-chart");
        if (ch) ch.outerHTML = spacingChart(s);
      }
    });
    const end = () => {
      if (ui.stroke) {
        if (ui.stroke.length >= 4) {
          const n = Math.min(24, Math.max(3, Math.round(ui.stroke.length / 3)));
          s.path = simplify(ui.stroke, n);
        }
        ui.stroke = null;
        redraw();
      } else if (ui.dragCtrl != null || ui.dragFrame != null) {
        ui.dragCtrl = ui.dragFrame = null;
        redraw();
      }
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    let start = null;
    const total = s.frames + Math.round(s.fps / 2);
    function tick(now) {
      if (!canvas.isConnected || document.getElementById("studio").classList.contains("hidden")) return;
      if (start == null) start = now;
      const f = Math.floor(((now - start) / 1000) * s.fps) % total;
      render(canvas, s, Math.min(f, s.frames - 1), ui);
      timer = requestAnimationFrame(tick);
    }
    timer = requestAnimationFrame(tick);
  }

  window.CuriosityStudio.register({ id: "motion", label: "Motion", order: 35, maya: "Graph Editor tangents, stepped keys, Ghosting, Editable Motion Trail, Attach to Motion Path (Follow, Bank), the twelve principles", draw });
})();
