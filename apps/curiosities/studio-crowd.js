/* Crowd: a MASH network on a 2D canvas. A Distribute node lays out copies (line, grid, radial,
   scatter, along a path), Random jitters them from a seed, Offset moves them all, Signal animates
   them over time (noise or sine), and Flight turns them into a flock (separation, alignment,
   cohesion). Color by id, and the Type tool turns a word into letters to distribute.
   What the crowd does is measured as curiosities: peopleCount, groups, density, uniformity,
   envMotion and formation. The live ones go to the board. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-crowd-v1";
  const W = 600, H = 320;
  const DEFAULTS = {
    mode: "grid", count: 24, shape: "people", text: "CROWD", seed: 7,
    jPos: 6, jScale: 0.15, jRot: 10,
    offX: 0, offY: 0, offRot: 0, offScale: 1,
    signal: "none", amp: 6, freq: 1,
    flight: false, sep: 3, ali: 2, coh: 2,
    colorById: true, playing: true,
  };
  const CHOICES = {
    mode: ["line", "grid", "radial", "scatter", "path"],
    shape: ["people", "umbrellas", "birds", "letters"],
    signal: ["none", "noise", "sine"],
  };
  let timer = null;
  let flock = null;
  let flockSig = "";
  let clock = 0;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Distribute node: the base position of copy i. */
  function distribute(s, i, n) {
    const cx = W / 2, cy = H / 2;
    if (s.mode === "line") return { x: 40 + (n > 1 ? (i / (n - 1)) * (W - 80) : (W - 80) / 2), y: cy };
    if (s.mode === "grid") {
      const cols = Math.ceil(Math.sqrt(n * (W / H)));
      const rows = Math.ceil(n / cols);
      const gx = (W - 60) / Math.max(1, cols), gy = (H - 60) / Math.max(1, rows);
      return { x: 30 + gx * ((i % cols) + 0.5), y: 30 + gy * (Math.floor(i / cols) + 0.5) };
    }
    if (s.mode === "radial") {
      const a = (i / n) * Math.PI * 2;
      return { x: cx + Math.cos(a) * H * 0.38, y: cy + Math.sin(a) * H * 0.38 };
    }
    if (s.mode === "scatter") {
      const r = rng(s.seed * 7919 + i * 104729);
      return { x: 25 + r() * (W - 50), y: 25 + r() * (H - 50) };
    }
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { x: 40 + t * (W - 80), y: cy + Math.sin(t * Math.PI * 2) * H * 0.3 };
  }

  function smoothNoise(x) {
    const i = Math.floor(x), f = x - i;
    const h = (k) => {
      const v = Math.sin(k * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const u = f * f * (3 - 2 * f);
    return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1;
  }

  function sigOf(s) {
    return [s.mode, s.count, s.seed, s.flight].join("|");
  }

  /* Flight node: simple boids, seeded from the distributed positions. */
  function stepFlock(s, nodes) {
    if (!flock || flockSig !== sigOf(s)) {
      flockSig = sigOf(s);
      const r = rng(s.seed + 99);
      flock = nodes.map((p) => ({ x: p.x, y: p.y, vx: r() * 2 - 1, vy: r() * 2 - 1 }));
    }
    const R = 50, SEP = 18;
    flock.forEach((b, i) => {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
      flock.forEach((o, j) => {
        if (i === j) return;
        const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
        if (d < R) {
          ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; n++;
          if (d < SEP && d > 0) { sx -= dx / d; sy -= dy / d; }
        }
      });
      if (n) {
        b.vx += ((ax / n - b.vx) * s.ali) / 40 + ((cx / n - b.x) * s.coh) / 2000;
        b.vy += ((ay / n - b.vy) * s.ali) / 40 + ((cy / n - b.y) * s.coh) / 2000;
      }
      b.vx += (sx * s.sep) / 10;
      b.vy += (sy * s.sep) / 10;
      if (b.x < 30) b.vx += 0.3;
      if (b.x > W - 30) b.vx -= 0.3;
      if (b.y < 30) b.vy += 0.3;
      if (b.y > H - 30) b.vy -= 0.3;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const max = 2.4, min = 0.8;
      if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
      if (sp < min) { b.vx *= min / sp; b.vy *= min / sp; }
    });
    flock.forEach((b) => { b.x += b.vx; b.y += b.vy; });
  }

  /* The whole network for one frame: distribute, random, offset, signal, flight. */
  function nodesAt(s, t) {
    const n = Math.max(1, Math.min(200, s.count));
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = distribute(s, i, n);
      const r = rng(s.seed * 31 + i * 977 + 1);
      let x = p.x + (r() * 2 - 1) * s.jPos;
      let y = p.y + (r() * 2 - 1) * s.jPos;
      let scale = Math.max(0.2, 1 + (r() * 2 - 1) * s.jScale) * s.offScale;
      let rot = ((r() * 2 - 1) * s.jRot + s.offRot) * (Math.PI / 180);
      x += s.offX; y += s.offY;
      if (s.signal === "sine") {
        y += Math.sin(t * s.freq * 2 + i * 0.5) * s.amp;
        rot += Math.sin(t * s.freq * 2 + i * 0.5) * s.amp * 0.01;
      } else if (s.signal === "noise") {
        x += smoothNoise(t * s.freq + i * 13.1) * s.amp;
        y += smoothNoise(t * s.freq + i * 7.3 + 50) * s.amp;
      }
      out.push({ x, y, scale, rot, i });
    }
    if (s.flight) {
      stepFlock(s, out);
      out.forEach((p, i) => {
        p.x = flock[i].x + s.offX * 0;
        p.y = flock[i].y;
        p.rot = Math.atan2(flock[i].vy, flock[i].vx);
      });
    } else flock = null;
    return out;
  }

  function colorOf(s, i, n) {
    if (!s.colorById) return "#1c1712";
    return `hsl(${Math.round((i * 137.5) % 360)}, 55%, ${40 + ((i * 7) % 3) * 6}%)`;
  }

  function drawNode(ctx, s, p, n) {
    const c = colorOf(s, p.i, n);
    const k = 7 * p.scale;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = c;
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    if (s.shape === "people") {
      ctx.beginPath();
      ctx.arc(0, -k, k * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-k * 0.6, k * 0.9);
      ctx.lineTo(0, -k * 0.3);
      ctx.lineTo(k * 0.6, k * 0.9);
      ctx.closePath();
      ctx.fill();
    } else if (s.shape === "umbrellas") {
      ctx.beginPath();
      ctx.arc(0, 0, k * 1.3, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1c1712";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, k * 1.2);
      ctx.arc(-k * 0.25, k * 1.2, k * 0.25, 0, Math.PI);
      ctx.stroke();
    } else if (s.shape === "birds") {
      const flap = Math.sin(clock * 8 + p.i) * k * 0.4;
      ctx.beginPath();
      ctx.moveTo(-k, -k * 0.6 - flap);
      ctx.quadraticCurveTo(-k * 0.4, -k * 0.2, 0, 0);
      ctx.quadraticCurveTo(k * 0.4, -k * 0.2, k, -k * 0.6 - flap);
      ctx.stroke();
    } else {
      const txt = (s.text || "A").replace(/\s+/g, "") || "A";
      ctx.font = `bold ${Math.round(k * 2.4)}px Fraunces, Palatino, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt[p.i % txt.length], 0, 0);
    }
    ctx.restore();
  }

  function render(canvas, s, nodes) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(0, 0, W, H);
    if (s.mode === "path" && !s.flight) {
      ctx.strokeStyle = "rgba(184,137,45,0.6)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const t = k / 60;
        const x = 40 + t * (W - 80) + s.offX, y = H / 2 + Math.sin(t * Math.PI * 2) * H * 0.3 + s.offY;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    nodes.forEach((p) => drawNode(ctx, s, p, nodes.length));
    ctx.fillStyle = "#1c1712";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText(`${nodes.length} nodes · ${s.flight ? "flight" : s.mode} · ${s.playing ? "playing" : "paused"}`, 8, 16);
  }

  /* Measurement: clusters by a simple distance link, density, uniformity, formation. */
  function measure(s, nodes) {
    const n = nodes.length;
    const nn = nodes.map((a, i) => {
      let best = Infinity;
      nodes.forEach((b, j) => {
        if (i !== j) best = Math.min(best, Math.hypot(a.x - b.x, a.y - b.y));
      });
      return best;
    });
    const finite = nn.filter((d) => isFinite(d));
    const mean = finite.length ? finite.reduce((a, b) => a + b, 0) / finite.length : 0;
    const link = Math.max(24, mean * 2.2);
    const parent = nodes.map((_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) <= link) parent[find(i)] = find(j);
    const roots = new Set(nodes.map((_, i) => find(i)));
    const clusters = roots.size;
    const xs = nodes.map((p) => p.x), ys = nodes.map((p) => p.y);
    const area = Math.max(2500, (Math.max(...xs) - Math.min(...xs) + 20) * (Math.max(...ys) - Math.min(...ys) + 20));
    const density = Math.max(0, Math.min(5, Math.round((n * 10000) / area / 3)));
    let uniformity = 5;
    if (finite.length > 1 && mean > 0) {
      const sd = Math.sqrt(finite.reduce((a, d) => a + (d - mean) * (d - mean), 0) / finite.length);
      const scaleVar = s.jScale;
      uniformity = Math.max(0, Math.min(5, Math.round(5 * (1 - Math.min(1, sd / mean + scaleVar)))));
    }
    const envMotion = s.flight || s.signal === "noise" ? "crowd" : s.signal === "sine" ? "wind" : "still";
    let formation = s.flight ? "flock" : { line: "line", path: "line", grid: "grid", radial: "ring", scatter: "scatter" }[s.mode];
    if (!s.flight && s.mode !== "scatter" && uniformity <= 1) formation = "scatter";
    return { peopleCount: n, groups: clusters, density, uniformity, envMotion, formation };
  }

  function catalogOf(id) {
    return typeof CURIOSITIES !== "undefined" ? CURIOSITIES.find((c) => c.id === id) : null;
  }

  /* Only ids live in catalog.js, each fitted to its range or options. */
  function boardValues(m) {
    const out = {};
    const pc = catalogOf("peopleCount");
    if (pc && pc.live) out.peopleCount = [Math.max(pc.min || 1, Math.min(pc.max || 8, m.peopleCount))];
    const g = catalogOf("groups");
    if (g && g.live) out.groups = [m.groups >= 2 ? "2" : "1"];
    const e = catalogOf("envMotion");
    if (e && e.live && e.options.includes(m.envMotion)) out.envMotion = [m.envMotion];
    const cp = catalogOf("characterPath");
    if (cp && cp.live) out.characterPath = [m.envMotion === "still" ? "still" : m.formation === "ring" || m.formation === "flock" ? "circle" : "cross"];
    return out;
  }

  function chips(esc, m) {
    return [
      `peopleCount ${m.peopleCount}`,
      `groups ${m.groups}`,
      `crowd density ${m.density}`,
      `uniformity ${m.uniformity}`,
      `envMotion ${m.envMotion}`,
      `formation ${m.formation}`,
    ]
      .map((x, i) => `<span class="chip${i === 5 ? " suite" : ""}">${esc(x)}</span>`)
      .join(" ");
  }

  function draw(el, api) {
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign({}, DEFAULTS, st.get({}));
    if (timer) cancelAnimationFrame(timer);
    if (!document.getElementById("studio-crowd-style")) {
      const style = document.createElement("style");
      style.id = "studio-crowd-style";
      style.textContent = `
        #crowd-canvas { width: 100%; height: auto; border: 1px solid var(--line, #ddd); background: #fffaf2; display: block; }
        .crowd-nodes fieldset { border: 1px solid var(--line, #ddd); margin: 0 0 10px; padding: 6px 8px; }
        .crowd-nodes legend { font-family: var(--mono, monospace); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
        .crowd-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 8px 0; }
      `;
      document.head.appendChild(style);
    }
    const sel = (k, label) =>
      `<label class="field">${esc(label)}<select data-k="${k}">${CHOICES[k].map((v) => `<option ${s[k] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
    const rng_ = (k, label, min, max, step) =>
      `<label class="field">${esc(label)}: <span data-v="${k}">${s[k]}</span><input type="range" min="${min}" max="${max}" step="${step || 1}" data-k="${k}" value="${s[k]}"></label>`;
    const chk = (k, label) => `<label class="field"><input type="checkbox" data-k="${k}" ${s[k] ? "checked" : ""}> ${esc(label)}</label>`;
    el.innerHTML = `<div class="studio-grid">
      <div class="crowd-nodes">
        <fieldset><legend>Distribute</legend>
          ${sel("mode", "Distribute")}
          ${rng_("count", "Count", 1, 200)}
          ${sel("shape", "Copies of")}
          <label class="field">Type tool text<input data-k="text" value="${esc(s.text)}" maxlength="40"></label>
        </fieldset>
        <fieldset><legend>Random</legend>
          ${rng_("seed", "Seed", 1, 999)}
          ${rng_("jPos", "Position", 0, 60)}
          ${rng_("jScale", "Scale", 0, 1, 0.05)}
          ${rng_("jRot", "Rotation", 0, 180)}
        </fieldset>
        <fieldset><legend>Offset</legend>
          ${rng_("offX", "X", -150, 150)}
          ${rng_("offY", "Y", -100, 100)}
          ${rng_("offRot", "Rotate", -180, 180)}
          ${rng_("offScale", "Scale", 0.3, 2.5, 0.05)}
        </fieldset>
        <fieldset><legend>Signal</legend>
          ${sel("signal", "Signal")}
          ${rng_("amp", "Amplitude", 0, 40)}
          ${rng_("freq", "Frequency", 0.1, 5, 0.1)}
        </fieldset>
        <fieldset><legend>Flight</legend>
          ${chk("flight", "Flock (boids)")}
          ${rng_("sep", "Separation", 0, 5, 0.5)}
          ${rng_("ali", "Alignment", 0, 5, 0.5)}
          ${rng_("coh", "Cohesion", 0, 5, 0.5)}
        </fieldset>
        ${chk("colorById", "Color by id")}
      </div>
      <div>
        <canvas width="${W}" height="${H}" id="crowd-canvas"></canvas>
        <div class="crowd-row">
          <button type="button" id="crowd-play">${s.playing ? "Pause" : "Play"}</button>
          <button type="button" id="crowd-reseed">New seed</button>
          <button type="button" id="crowd-send">Send to board</button>
        </div>
        <p id="crowd-chips"></p>
        <table class="trace"><thead><tr><th>Curiosity</th><th>Measured</th><th>To the board</th></tr></thead><tbody id="crowd-table"></tbody></table>
        <p class="cap">Groups come from linking copies closer than about twice their mean spacing. Density counts copies per area of the crowd's box; uniformity falls as spacing and scale vary. A signal of sine reads as wind, noise or a flock reads as a crowd. Formation is a new curiosity and stays in the studio; only ids live in the catalog go to the board.</p>
      </div></div>`;

    el.querySelectorAll("[data-k]").forEach((x) => {
      const k = x.dataset.k;
      const live = x.type === "range" || x.type === "text" || x.tagName === "INPUT" && x.type !== "checkbox";
      x.addEventListener(live ? "input" : "change", () => {
        s[k] = x.type === "checkbox" ? x.checked : x.type === "range" ? Number(x.value) : x.value;
        st.set(s);
        const v = el.querySelector(`[data-v="${k}"]`);
        if (v) v.textContent = s[k];
        if (!s.playing) frame(true);
      });
    });
    el.querySelector("#crowd-play").addEventListener("click", (e) => {
      s.playing = !s.playing;
      st.set(s);
      e.target.textContent = s.playing ? "Pause" : "Play";
    });
    el.querySelector("#crowd-reseed").addEventListener("click", () => {
      s.seed = 1 + Math.floor(Math.random() * 999);
      st.set(s);
      const r = el.querySelector('[data-k="seed"]');
      r.value = s.seed;
      el.querySelector('[data-v="seed"]').textContent = s.seed;
      if (!s.playing) frame(true);
    });
    el.querySelector("#crowd-send").addEventListener("click", () => {
      const m = measure(s, nodesAt(s, clock));
      api.toBoard(`Crowd: ${m.formation}, ${m.peopleCount}`, boardValues(m));
    });

    const canvas = el.querySelector("#crowd-canvas");
    const chipEl = el.querySelector("#crowd-chips");
    const tableEl = el.querySelector("#crowd-table");
    let n = 0;
    let last = null;
    function frame(force) {
      const nodes = nodesAt(s, clock);
      render(canvas, s, nodes);
      if (force || n++ % 12 === 0) {
        const m = measure(s, nodes);
        chipEl.innerHTML = chips(esc, m);
        const b = boardValues(m);
        tableEl.innerHTML = [
          ["peopleCount", m.peopleCount], ["groups", m.groups], ["crowdDensity", m.density],
          ["uniformity", m.uniformity], ["envMotion", m.envMotion], ["formation", m.formation], ["characterPath", ""],
        ]
          .map(([id, v]) => `<tr><td>${esc(id)}</td><td>${esc(v)}</td><td>${b[id] ? esc(b[id][0]) : "studio only"}</td></tr>`)
          .join("");
      }
    }
    function tick(now) {
      if (!canvas.isConnected) return;
      if (s.playing) {
        if (last != null) clock += Math.min(0.1, (now - last) / 1000);
        frame(false);
      }
      last = now;
      timer = requestAnimationFrame(tick);
    }
    frame(true);
    timer = requestAnimationFrame(tick);
  }

  window.CuriosityStudio.register({ id: "crowd", label: "Crowd", order: 45, maya: "MASH networks (Distribute, Random, Offset, Signal, Flight, Replicator), Type tool", draw });
})();
