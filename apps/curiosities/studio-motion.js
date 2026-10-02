/* Motion: the animation principles a Maya animator sets with keys, tangents and timing, on one
   moving object. Spacing (tangent shape), drawn on ones, twos or threes (stepped keys), anticipation,
   overshoot, squash and stretch, path shape (motion path), ghosting and the motion trail.
   Every control is a curiosity from the Animation group of the catalog. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-motion-v1";
  const DEFAULTS = { move: "hop", spacing: "ease both", stepping: "ones", anticipation: "small", overshoot: "settle", squash: 2, arcs: "arc", ghosts: 4, trail: true, fps: 24, frames: 36 };
  const CHOICES = {
    move: ["hop", "slide", "swing", "drop"],
    spacing: ["even", "ease in", "ease out", "ease both", "snap"],
    stepping: ["ones", "twos", "threes"],
    anticipation: ["none", "small", "big"],
    overshoot: ["none", "settle", "bounce"],
    arcs: ["straight", "arc", "figure eight"],
  };
  let timer = null;

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

  function pathAt(s, p, w, h) {
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

  function frameState(s, f, w, h) {
    const step = { ones: 1, twos: 2, threes: 3 }[s.stepping];
    const held = Math.floor(f / step) * step;
    const u = held / (s.frames - 1);
    const p = progress(s, Math.min(u, 1));
    const pos = pathAt(s, p, w, h);
    const prev = pathAt(s, progress(s, Math.max(0, (held - step) / (s.frames - 1))), w, h);
    const speed = Math.hypot(pos.x - prev.x, pos.y - prev.y) / step;
    const stretch = 1 + Math.min(speed / 30, 0.6) * (s.squash / 5);
    const landing = s.move !== "slide" && s.move !== "swing" && p > 0.97 && p < 1.03 ? 1 - (s.squash / 5) * 0.35 : 1;
    const ang = Math.atan2(pos.y - prev.y, pos.x - prev.x);
    return { pos, stretch: landing < 1 ? landing : stretch, ang: landing < 1 ? 0 : ang, squashed: landing < 1 };
  }

  function drawBall(ctx, st, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(st.pos.x, st.pos.y);
    if (st.squashed) ctx.scale(1 / st.stretch, st.stretch);
    else {
      ctx.rotate(st.ang);
      ctx.scale(st.stretch, 1 / st.stretch);
    }
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "#c45c26";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1c1712";
    ctx.stroke();
    ctx.restore();
  }

  function render(canvas, s, f) {
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
      for (let i = 0; i < s.frames; i++) {
        const p = frameState(s, i, w, h).pos;
        ctx.fillStyle = "rgba(28,23,18,0.45)";
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
    }
    for (let g = s.ghosts; g >= 1; g--) {
      const gf = f - g * 2;
      if (gf >= 0) drawBall(ctx, frameState(s, gf, w, h), 14, 0.12 + 0.05 * (s.ghosts - g));
    }
    drawBall(ctx, frameState(s, f, w, h), 14, 1);
    ctx.fillStyle = "#1c1712";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText(`frame ${f + 1}/${s.frames} · ${s.fps} fps`, 8, 16);
  }

  /* The spacing chart animators draw: one tick per frame between the two keys. */
  function spacingChart(s) {
    const ticks = [];
    for (let i = 0; i < s.frames; i++) {
      const step = { ones: 1, twos: 2, threes: 3 }[s.stepping];
      if (i % step) continue;
      const p = progress(s, i / (s.frames - 1));
      ticks.push(`<line x1="${(20 + p * 560).toFixed(1)}" x2="${(20 + p * 560).toFixed(1)}" y1="10" y2="${p < 0 || p > 1 ? 40 : 30}" stroke="${p < 0 || p > 1 ? "#c45c26" : "#1c1712"}" stroke-width="2"/>`);
    }
    return `<svg class="view" viewBox="0 0 600 48" role="img" aria-label="Spacing chart"><line x1="20" x2="580" y1="20" y2="20" stroke="rgba(28,23,18,0.3)"/>${ticks.join("")}<text x="20" y="46" font-size="10">key A</text><text x="548" y="46" font-size="10">key B</text></svg>`;
  }

  function draw(el, api) {
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign({}, DEFAULTS, st.get({}));
    if (timer) cancelAnimationFrame(timer);
    const sel = (k, label) =>
      `<label class="field">${esc(label)}<select data-k="${k}">${CHOICES[k].map((v) => `<option ${s[k] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
    el.innerHTML = `<div class="studio-grid">
      <div>
        ${sel("move", "The move")}
        ${sel("spacing", "Spacing (tangents)")}
        ${sel("stepping", "Drawn on")}
        ${sel("anticipation", "Anticipation")}
        ${sel("overshoot", "Overshoot")}
        ${sel("arcs", "Path shape")}
        <label class="field">Squash and stretch: ${s.squash}<input type="range" min="0" max="5" data-k="squash" value="${s.squash}"></label>
        <label class="field">Frames between keys: ${s.frames}<input type="range" min="8" max="72" data-k="frames" value="${s.frames}"></label>
        <label class="field">Frame rate<select data-k="fps">${[12, 24, 25, 30].map((v) => `<option ${s.fps == v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="field">Ghosts: ${s.ghosts}<input type="range" min="0" max="8" data-k="ghosts" value="${s.ghosts}"></label>
        <label class="field"><input type="checkbox" data-k="trail" ${s.trail ? "checked" : ""}> Motion trail</label>
      </div>
      <div>
        <canvas width="600" height="300" id="motion-canvas"></canvas>
        <p class="cap">Spacing chart: one tick per drawing. Ticks bunched together are slow; spread out is fast. Orange ticks go past the keys (anticipation and overshoot).</p>
        ${spacingChart(s)}
        <p>${["spacing", "stepping", "anticipation", "overshoot", "arcs"].map((k) => `<span class="chip">${k} ${esc(s[k])}</span>`).join(" ")} <span class="chip">squash ${s.squash}</span></p>
        <p class="cap">Takes ${(s.frames / s.fps).toFixed(2)} s. In Maya this is two keys on the Graph Editor, the tangent type, stepped keys for twos, and Ghosting plus Motion Trail turned on.</p>
      </div></div>`;
    el.querySelectorAll("[data-k]").forEach((x) =>
      x.addEventListener(x.type === "range" ? "input" : "change", () => {
        const k = x.dataset.k;
        s[k] = x.type === "checkbox" ? x.checked : x.type === "range" || k === "fps" ? Number(x.value) : x.value;
        st.set(s);
        draw(el, api);
      })
    );
    const canvas = el.querySelector("#motion-canvas");
    let start = null;
    const total = s.frames + Math.round(s.fps / 2);
    function tick(now) {
      if (!canvas.isConnected) return;
      if (start == null) start = now;
      const f = Math.floor(((now - start) / 1000) * s.fps) % total;
      render(canvas, s, Math.min(f, s.frames - 1));
      timer = requestAnimationFrame(tick);
    }
    timer = requestAnimationFrame(tick);
  }

  window.CuriosityStudio.register({ id: "motion", label: "Motion", order: 35, maya: "Graph Editor tangents, stepped keys, Ghosting, Motion Trail, Motion Path, the twelve principles", draw });
})();
