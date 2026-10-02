/* Dynamics: a small 2D nucleus solver, the way Maya's nucleus drives nCloth, nParticles and
   rigid bodies under shared fields. Verlet cloth pinned at the top (presets after nCloth's
   heavy denim, t-shirt, silk and chain mail), an nParticle emitter (rain, dust, sparks, confetti),
   boxes that collide, bounce and break, and fields: gravity with drag, air/wind with gusts,
   and turbulence. One beat is one second of simulated time.
   Curiosities: envMotion, windForce, turbulence, clothResponse, impacts, breakage, settleTime, gravityFeel. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-dynamics-v1";
  const W = 320;
  const H = 200;
  const FLOOR = 190;
  const DEFAULTS = { cloth: "t-shirt", gravity: "real", drag: 1, wind: 1, windDir: 0, gusts: false, turb: 1, mode: "dust", rate: 20, life: 3, size: 2, hit: 120, strength: 260, camera: "locked" };
  const CLOTHS = {
    "heavy denim": { mass: 2.2, iter: 8, bend: 0.5, resp: 0.5, damp: 0.985, word: "stiff" },
    "t-shirt": { mass: 1, iter: 5, bend: 0.15, resp: 1, damp: 0.99, word: "loose" },
    silk: { mass: 0.4, iter: 3, bend: 0.02, resp: 2.2, damp: 0.995, word: "flutter" },
    "chain mail": { mass: 4, iter: 10, bend: 0, resp: 0.15, damp: 0.98, word: "stiff" },
  };
  const GRAV = { floaty: 120, real: 400, heavy: 800 };
  const MODES = ["off", "rain", "dust", "sparks", "confetti"];
  const CAMERAS = ["locked", "smooth", "handheld", "handheld on a hit"];
  const SUITES_HERE = [
    { id: "storm", label: "Storm", note: "windForce 5, turbulence 4, clothResponse flutter", set: { wind: 5, turb: 4, cloth: "silk", gusts: true, mode: "rain" } },
    { id: "slow", label: "Slow motion", note: "gravityFeel floaty, settleTime long", set: { gravity: "floaty", drag: 0, wind: 0, turb: 0 }, slow: true, drop: 2 },
    { id: "brawl", label: "Brawl", note: "impacts 6, breakage shatters, cameraCarry handheld", set: { gravity: "heavy", strength: 140, hit: 90, camera: "handheld", mode: "sparks" }, drop: 6 },
  ];

  let s = null;
  let api = null;
  let sim = null;
  let raf = 0;
  let last = 0;
  let paused = false;
  let slow = false;

  /* ---------- simulation ---------- */

  function newSim() {
    const cols = 12;
    const rows = 10;
    const sp = 8;
    const x0 = 210;
    const y0 = 14;
    const pts = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * sp;
        const y = y0 + r * sp;
        pts.push({ x, y, px: x, py: y, pin: r === 0 && c % 3 === 0 });
      }
    const links = [];
    const bends = [];
    const at = (r, c) => r * cols + c;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (c + 1 < cols) links.push([at(r, c), at(r, c + 1), sp]);
        if (r + 1 < rows) links.push([at(r, c), at(r + 1, c), sp]);
        if (c + 2 < cols) bends.push([at(r, c), at(r, c + 2), sp * 2]);
        if (r + 2 < rows) bends.push([at(r, c), at(r + 2, c), sp * 2]);
      }
    return {
      t: 0,
      cloth: { pts, links, bends, cols, rows },
      boxes: [],
      parts: [],
      emitAcc: 0,
      gust: 0,
      nextGust: 3,
      hits: [], // { t, v }
      breaks: [], // { t, word }
      gusts: [], // { t, base, peak }
      settles: [], // { t, sec }
      lastHit: -1,
      settled: true,
      energy: [],
      beats: [], // per completed second: { impacts, breakage }
      beatAt: 1,
      sparkAt: null,
    };
  }

  function noise(x, y, t) {
    return (Math.sin(x * 0.05 + t * 1.7) + Math.sin(y * 0.07 - t * 2.3) + Math.sin((x + y) * 0.03 + t * 0.9)) / 3;
  }

  function field(x, y, t, resp) {
    const a = (s.windDir * Math.PI) / 180;
    const gust = 1 + sim.gust * 2.5;
    const w = s.wind * 40 * gust;
    const tu = s.turb * 45;
    return {
      x: (Math.cos(a) * w + tu * noise(x, y, t)) * resp,
      y: (Math.sin(a) * w + tu * noise(y + 40, x - 20, t * 1.3)) * resp,
    };
  }

  function dropBox(x) {
    if (sim.boxes.length > 60) return;
    const w = 14 + Math.random() * 14;
    sim.boxes.push({ x: x != null ? x : 20 + Math.random() * 150, y: -30, w, h: w * (0.7 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 60, vy: 0, hue: Math.floor(Math.random() * 360) });
    sim.settled = false;
  }

  function gust() {
    sim.gust = 1;
    sim.gusts.push({ t: sim.t, base: clothSpeed(), peak: 0 });
    if (sim.gusts.length > 20) sim.gusts.shift();
  }

  function clothSpeed() {
    const p = sim.cloth.pts;
    let v = 0;
    p.forEach((q) => (v += Math.hypot(q.x - q.px, q.y - q.py)));
    return (v / p.length) * 60;
  }

  function registerHit(v, x, y) {
    if (v < s.hit) return;
    sim.hits.push({ t: sim.t, v });
    if (sim.hits.length > 400) sim.hits.shift();
    sim.lastHit = sim.t;
    sim.settled = false;
    sim.sparkAt = { x, y, t: sim.t };
  }

  function breakBox(b, v) {
    if (v < s.strength || b.w < 9 || sim.boxes.length > 56) return null;
    const word = v > s.strength * 1.6 ? "shatters" : "cracks";
    sim.breaks.push({ t: sim.t, word });
    const pieces = [];
    if (word === "cracks") {
      const half = b.w / 2;
      pieces.push({ ...b, w: half - 0.5, vx: b.vx - 20 }, { ...b, x: b.x + half + 0.5, w: half - 0.5, vx: b.vx + 20 });
    } else {
      const hw = b.w / 2;
      const hh = b.h / 2;
      [0, 1].forEach((i) =>
        [0, 1].forEach((j) =>
          pieces.push({ ...b, x: b.x + i * hw, y: b.y + j * hh, w: hw - 0.5, h: hh - 0.5, vx: b.vx + (i ? 1 : -1) * (40 + Math.random() * 60), vy: b.vy - 60 - Math.random() * 80 })
        )
      );
    }
    return pieces;
  }

  function step(dt) {
    const t = (sim.t += dt);
    const g = GRAV[s.gravity] || 400;
    const drag = Math.min(0.5, s.drag * 0.25 * dt);
    if (sim.gust > 0) sim.gust = Math.max(0, sim.gust - dt / 1.2);
    if (s.gusts && t > sim.nextGust) {
      gust();
      sim.nextGust = t + 2 + Math.random() * 3;
    }

    /* Cloth: Verlet with stretch and bend constraints. */
    const cp = CLOTHS[s.cloth] || CLOTHS["t-shirt"];
    const pts = sim.cloth.pts;
    pts.forEach((q) => {
      if (q.pin) return;
      const f = field(q.x, q.y, t, cp.resp / cp.mass);
      const vx = (q.x - q.px) * cp.damp * (1 - drag);
      const vy = (q.y - q.py) * cp.damp * (1 - drag);
      q.px = q.x;
      q.py = q.y;
      q.x += vx + f.x * dt * dt;
      q.y += vy + (g + f.y) * dt * dt;
      if (q.y > FLOOR) q.y = FLOOR;
    });
    for (let k = 0; k < cp.iter; k++) {
      sim.cloth.links.forEach((l) => solve(pts[l[0]], pts[l[1]], l[2], 1));
      if (cp.bend > 0) sim.cloth.bends.forEach((l) => solve(pts[l[0]], pts[l[1]], l[2], cp.bend));
    }

    /* Rigid boxes. */
    const boxes = sim.boxes;
    const born = [];
    const dead = new Set();
    boxes.forEach((b) => {
      const f = field(b.x, b.y, t, 0.08);
      b.vx += f.x * dt;
      b.vy += (g + f.y * 0.3) * dt;
      b.vx *= 1 - drag;
      b.vy *= 1 - drag;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y + b.h > FLOOR) {
        b.y = FLOOR - b.h;
        if (b.vy > 0) {
          const v = b.vy;
          registerHit(v, b.x + b.w / 2, FLOOR);
          const pieces = breakBox(b, v);
          if (pieces) {
            dead.add(b);
            pieces.forEach((p) => {
              p.vy = -v * 0.25 - Math.random() * 40;
              born.push(p);
            });
          }
          b.vy = Math.abs(b.vy) < 25 ? 0 : -b.vy * 0.35;
          b.vx *= 0.8;
        }
      }
      if (b.x < 0) {
        b.x = 0;
        b.vx = Math.abs(b.vx) * 0.5;
      }
      if (b.x + b.w > W) {
        b.x = W - b.w;
        b.vx = -Math.abs(b.vx) * 0.5;
      }
    });
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox <= 0 || oy <= 0) continue;
        const ma = a.w * a.h;
        const mb = b.w * b.h;
        let nx = 0;
        let ny = 0;
        if (ox < oy) {
          nx = a.x < b.x ? 1 : -1;
          const push = ox / 2;
          a.x -= nx * push;
          b.x += nx * push;
        } else {
          ny = a.y < b.y ? 1 : -1;
          const tot = ma + mb;
          a.y -= ny * oy * (mb / tot);
          b.y += ny * oy * (ma / tot);
        }
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) {
          const jimp = (-(1.35) * rv) / (1 / ma + 1 / mb);
          a.vx -= (jimp / ma) * nx;
          a.vy -= (jimp / ma) * ny;
          b.vx += (jimp / mb) * nx;
          b.vy += (jimp / mb) * ny;
          a.vx *= 0.96;
          b.vx *= 0.96;
          registerHit(-rv, (a.x + b.x) / 2 + a.w / 2, (a.y + b.y) / 2 + a.h / 2);
          [a, b].forEach((x) => {
            const pieces = !dead.has(x) && breakBox(x, -rv);
            if (pieces) {
              dead.add(x);
              born.push(...pieces);
            }
          });
        }
      }
    if (dead.size || born.length) sim.boxes = boxes.filter((b) => !dead.has(b)).concat(born);
    sim.boxes.forEach((b) => {
      if (b.y + b.h >= FLOOR - 0.5 && Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6) {
        b.vx = 0;
        b.vy = 0;
      }
    });

    /* nParticles. */
    if (s.mode !== "off") {
      sim.emitAcc += s.rate * dt;
      while (sim.emitAcc >= 1 && sim.parts.length < 400) {
        sim.emitAcc -= 1;
        emit();
      }
    }
    const pm = { rain: [1.2, 0.2, 0.02], dust: [0.04, 1.4, 0.6], sparks: [1, 0.3, 0.05], confetti: [0.25, 1.6, 0.35] };
    sim.parts = sim.parts.filter((p) => {
      p.age += dt;
      if (p.age > p.life || p.y > FLOOR + 2 || p.x < -20 || p.x > W + 20) return false;
      const m = pm[p.mode] || pm.dust;
      const f = field(p.x, p.y, t, m[1]);
      p.vx += f.x * dt;
      p.vy += (g * m[0] + f.y) * dt;
      p.vx *= 1 - Math.min(0.5, (m[2] + drag) * dt * 4);
      p.vy *= 1 - Math.min(0.5, (m[2] + drag) * dt * 4);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > FLOOR) {
        if (p.mode === "dust" || p.mode === "confetti") {
          p.y = FLOOR;
          p.vy = 0;
          p.vx *= 0.5;
        } else return false;
      }
      return true;
    });

    /* Measures: energy, settle, beats. */
    let ke = 0;
    sim.boxes.forEach((b) => (ke += 0.5 * b.w * b.h * (b.vx * b.vx + b.vy * b.vy)));
    const keN = sim.boxes.length ? ke / 1e5 : 0;
    const cs = clothSpeed();
    sim.energy.push({ t, box: keN, cloth: cs });
    if (sim.energy.length > 600) sim.energy.shift();
    if (!sim.settled && sim.lastHit >= 0 && sim.boxes.every((b) => Math.hypot(b.vx, b.vy) < 8) && t - sim.lastHit > 0.1) {
      sim.settled = true;
      sim.settles.push({ t, sec: t - sim.lastHit, clothAt: cs });
      if (sim.settles.length > 20) sim.settles.shift();
    }
    sim.gusts.forEach((gu) => {
      if (t - gu.t <= 1) gu.peak = Math.max(gu.peak, cs);
    });
    if (t >= sim.beatAt) {
      const from = sim.beatAt - 1;
      const impacts = sim.hits.filter((h) => h.t >= from && h.t < sim.beatAt).length;
      const br = sim.breaks.filter((b) => b.t >= from && b.t < sim.beatAt);
      sim.beats.push({ impacts, breakage: br.some((b) => b.word === "shatters") ? "shatters" : br.length ? "cracks" : "holds" });
      if (sim.beats.length > 16) sim.beats.shift();
      sim.beatAt += 1;
    }
  }

  function solve(a, b, rest, k) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const diff = ((d - rest) / d) * 0.5 * k;
    const ox = dx * diff;
    const oy = dy * diff;
    if (!a.pin && !b.pin) {
      a.x += ox;
      a.y += oy;
      b.x -= ox;
      b.y -= oy;
    } else if (!a.pin) {
      a.x += ox * 2;
      a.y += oy * 2;
    } else if (!b.pin) {
      b.x -= ox * 2;
      b.y -= oy * 2;
    }
  }

  function emit() {
    const m = s.mode;
    const life = s.life * (0.6 + Math.random() * 0.8);
    const base = { mode: m, age: 0, life, size: s.size, hue: Math.floor(Math.random() * 360) };
    if (m === "rain") Object.assign(base, { x: Math.random() * W, y: -5, vx: 0, vy: 260 });
    else if (m === "dust") Object.assign(base, { x: Math.random() * W, y: FLOOR - Math.random() * 30, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 10 });
    else if (m === "sparks") {
      const at = sim.sparkAt && sim.t - sim.sparkAt.t < 0.4 ? sim.sparkAt : { x: 40, y: 60 };
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
      const v = 120 + Math.random() * 160;
      Object.assign(base, { x: at.x, y: at.y - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: Math.min(life, 1.2) });
    } else Object.assign(base, { x: Math.random() * W, y: -5, vx: (Math.random() - 0.5) * 30, vy: 20 });
    sim.parts.push(base);
  }

  /* ---------- measures ---------- */

  function measures() {
    const t = sim.t;
    const win = Math.min(4, Math.max(1, t));
    const recent = sim.hits.filter((h) => h.t > t - win).length;
    const impacts = Math.max(0, Math.min(8, Math.round(recent / win)));
    const br = sim.breaks.filter((b) => b.t > t - 6);
    const breakage = br.some((b) => b.word === "shatters") ? "shatters" : br.length ? "cracks" : "holds";
    const lastSettle = sim.settles[sim.settles.length - 1];
    const settleSec = !sim.settled && sim.lastHit >= 0 ? t - sim.lastHit : lastSettle ? lastSettle.sec : 0;
    const settleTime = Math.max(0, Math.min(4, Math.round(settleSec)));
    const envMotion = s.mode === "rain" ? "water" : s.wind >= 1 || s.turb >= 2 || sim.gust > 0 ? "wind" : "still";
    return {
      envMotion,
      windForce: Math.round(Math.min(5, s.wind + (sim.gust > 0.3 ? 1 : 0))),
      turbulence: Math.round(s.turb),
      clothResponse: (CLOTHS[s.cloth] || CLOTHS["t-shirt"]).word,
      impacts,
      breakage,
      settleTime,
      settleSec,
      gravityFeel: s.gravity,
    };
  }

  function cameraFor(impacts) {
    if (s.camera === "handheld on a hit") return impacts > 0 ? "handheld" : "locked";
    return s.camera;
  }

  function proximities(m) {
    const out = [];
    /* 1. When an impact, the camera goes handheld (within 0 beats). */
    const hitBeats = sim.beats.filter((b) => b.impacts > 0);
    if (!hitBeats.length && !m.impacts) out.push(["When an impact, the camera goes handheld (0 beats)", null, "no impact yet: drop an object"]);
    else out.push(["When an impact, the camera goes handheld (0 beats)", cameraFor(1) === "handheld", `camera is ${cameraFor(1)} on a hit`]);
    /* 2. When a gust hits, cloth reacts (within 1 beat). */
    const gu = sim.gusts.filter((g) => sim.t - g.t >= 1).pop();
    if (!gu) out.push(["When a gust hits, cloth reacts (1 beat)", null, "no gust yet: press Gust"]);
    else {
      const ok = gu.peak > gu.base * 1.4 + 6;
      out.push(["When a gust hits, cloth reacts (1 beat)", ok, `cloth speed ${gu.base.toFixed(0)} → ${gu.peak.toFixed(0)} px/s`]);
    }
    /* 3. When breakage shatters, silence follows (within 2 beats). */
    const sh = sim.breaks.filter((b) => b.word === "shatters" && sim.t - b.t >= 2).pop();
    if (!sh) out.push(["When breakage shatters, silence follows (2 beats)", null, "nothing has shattered yet"]);
    else {
      const late = sim.hits.filter((h) => h.t > sh.t + 0.5 && h.t <= sh.t + 2).length;
      out.push(["When breakage shatters, silence follows (2 beats)", late === 0, late ? `${late} more hits after it` : "no hits after the shatter"]);
    }
    /* 4. When the object stops, overlap and cloth settle (within 2 beats). */
    const st = sim.settles.filter((x) => sim.t - x.t >= 2).pop();
    if (!st) out.push(["When the object stops, overlap and cloth settle (2 beats)", null, "no object has come to rest yet"]);
    else {
      const after = sim.energy.filter((e) => e.t > st.t && e.t <= st.t + 2);
      const end = after.length ? after[after.length - 1].cloth : 0;
      out.push(["When the object stops, overlap and cloth settle (2 beats)", end < 8, `cloth at ${end.toFixed(0)} px/s two beats on`]);
    }
    return out;
  }

  /* ---------- drawing ---------- */

  function injectStyle() {
    if (document.getElementById("studio-dynamics")) return;
    const css = document.createElement("style");
    css.id = "studio-dynamics";
    css.textContent = `
.dyn-root { min-width: 0; max-width: 100%; }
.dyn-root .studio-grid > * { min-width: 0; }
.dyn-root canvas { width: 100%; height: auto; display: block; border: 2px solid var(--ink); background: #fff; }
.dyn-root canvas.dyn-energy { border-width: 1px; margin-top: 6px; }
.dyn-root .bar-actions { margin: 8px 0; }
.dyn-root .bar-actions button.on { background: var(--ink); color: var(--paper); }
.dyn-prox { list-style: none; padding: 0; margin: 6px 0; font-size: 13px; }
.dyn-prox li { margin: 0 0 4px; }
.dyn-prox .chip { min-width: 70px; text-align: center; }
.dyn-prox .chip.no { border-color: #8a2b1c; color: #8a2b1c; }
.dyn-root .studio-grid select, .dyn-root .studio-grid input[type=range] { width: 100%; box-sizing: border-box; }
`;
    document.head.appendChild(css);
  }

  function paint(ctx) {
    ctx.fillStyle = "#fffaf2";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e6dccb";
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    /* wind arrow */
    if (s.wind > 0 || sim.gust > 0) {
      const a = (s.windDir * Math.PI) / 180;
      const len = 6 + s.wind * 5 * (1 + sim.gust);
      ctx.strokeStyle = "rgba(63,110,140,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(14 + Math.cos(a) * len, 14 + Math.sin(a) * len);
      ctx.stroke();
    }
    /* cloth */
    const c = sim.cloth;
    ctx.strokeStyle = s.cloth === "chain mail" ? "#777" : s.cloth === "heavy denim" ? "#2f4a6d" : s.cloth === "silk" ? "#c45c26" : "#b8892d";
    ctx.lineWidth = s.cloth === "heavy denim" ? 1.6 : 1;
    ctx.beginPath();
    c.links.forEach((l) => {
      const a = c.pts[l[0]];
      const b = c.pts[l[1]];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    });
    ctx.stroke();
    ctx.fillStyle = "#1c1712";
    ctx.fillRect(200, 10, 104, 3);
    /* boxes */
    sim.boxes.forEach((b) => {
      ctx.fillStyle = `hsl(${b.hue},35%,55%)`;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#1c1712";
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    });
    /* particles */
    sim.parts.forEach((p) => {
      const fade = 1 - p.age / p.life;
      if (p.mode === "rain") {
        ctx.strokeStyle = `rgba(63,110,140,${0.6 * fade})`;
        ctx.lineWidth = Math.max(0.5, p.size / 2);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
      } else if (p.mode === "sparks") {
        ctx.fillStyle = `rgba(255,${120 + Math.floor(100 * fade)},40,${fade})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.mode === "confetti") {
        ctx.fillStyle = `hsla(${p.hue},70%,55%,${fade})`;
        const w = p.size * (1 + Math.abs(Math.sin(p.age * 8)));
        ctx.fillRect(p.x, p.y, w, p.size * 1.5);
      } else {
        ctx.fillStyle = `rgba(120,100,80,${0.35 * fade})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
    ctx.fillStyle = "#1c1712";
    ctx.font = "9px monospace";
    ctx.fillText(`${sim.t.toFixed(1)}s${slow ? " · 0.25x" : ""}${paused ? " · paused" : ""}`, W - 78, H - 2);
  }

  function paintEnergy(ctx, w, h) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    const e = sim.energy;
    if (e.length < 2) return;
    const maxB = Math.max(1, ...e.map((x) => x.box));
    const maxC = Math.max(20, ...e.map((x) => x.cloth));
    const line = (key, max, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      e.forEach((x, i) => {
        const px = (i / (e.length - 1)) * w;
        const py = h - 2 - (x[key] / max) * (h - 12);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();
    };
    line("box", maxB, "#c45c26");
    line("cloth", maxC, "#3f6e8c");
    ctx.fillStyle = "#c45c26";
    const t0 = e[0].t;
    const span = e[e.length - 1].t - t0 || 1;
    sim.hits.forEach((x) => {
      if (x.t >= t0) ctx.fillRect(((x.t - t0) / span) * w, 0, 1, 6);
    });
    ctx.fillStyle = "#1c1712";
    ctx.font = "9px monospace";
    ctx.fillText("energy: bodies (orange), cloth (blue), ticks = impacts", 4, h - 3);
  }

  function chipsHtml(m) {
    const esc = api.esc;
    const ids = ["envMotion", "windForce", "turbulence", "clothResponse", "impacts", "breakage", "settleTime", "gravityFeel"];
    return ids.map((id) => `<span class="chip ${id === "envMotion" ? "lit" : ""}">${esc(id)} ${esc(m[id])}</span>`).join(" ") + ` <span class="chip">cameraCarry ${esc(cameraFor(m.impacts))}</span>`;
  }

  function proxHtml(m) {
    const esc = api.esc;
    return proximities(m)
      .map(([label, ok, why]) => `<li><span class="chip ${ok === true ? "lit" : ok === false ? "no" : ""}">${ok === true ? "holds" : ok === false ? "doesn’t hold" : "waiting"}</span> ${esc(label)} <span class="cap">· ${esc(why)}</span></li>`)
      .join("");
  }

  function draw(el, a) {
    api = a;
    injectStyle();
    const store = api.store(KEY);
    if (!s) s = Object.assign({}, DEFAULTS, store.get({}));
    if (!sim) sim = newSim();
    const esc = api.esc;
    el.classList.add("dyn-root");
    const sel = (k, label, opts) =>
      `<label class="field">${esc(label)}<select data-k="${k}">${opts.map((v) => `<option ${String(s[k]) === String(v) ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
    const rng = (k, label, min, max, stepv) =>
      `<label class="field">${esc(label)}: <span data-v="${k}">${s[k]}</span><input type="range" min="${min}" max="${max}" step="${stepv || 1}" data-k="${k}" value="${s[k]}"></label>`;
    el.innerHTML = `<div class="studio-grid">
      <div>
        <p class="cap">Suites</p>
        <div class="bar-actions">${SUITES_HERE.map((x) => `<button type="button" data-suite="${x.id}" title="${esc(x.note)}">${esc(x.label)}</button>`).join(" ")}</div>
        ${sel("cloth", "nCloth preset", Object.keys(CLOTHS))}
        ${sel("gravity", "Gravity", Object.keys(GRAV))}
        ${rng("drag", "Drag", 0, 5)}
        ${rng("wind", "Air / wind", 0, 5)}
        ${rng("windDir", "Wind direction (degrees)", -180, 180, 15)}
        <label class="field"><span><input type="checkbox" data-k="gusts" ${s.gusts ? "checked" : ""}> Gusts on their own</span></label>
        ${rng("turb", "Turbulence", 0, 5)}
        ${sel("mode", "nParticles", MODES)}
        ${rng("rate", "Rate per second", 0, 60)}
        ${rng("life", "Lifespan (s)", 0.5, 6, 0.5)}
        ${rng("size", "Size", 1, 5)}
        ${rng("hit", "Impact threshold (px/s)", 40, 300, 10)}
        ${rng("strength", "Breaks above (px/s)", 80, 600, 10)}
        ${sel("camera", "Camera", CAMERAS)}
      </div>
      <div>
        <canvas width="${W}" height="${H}" id="dyn-canvas" aria-label="Nucleus simulation"></canvas>
        <div class="bar-actions">
          <button type="button" data-act="drop">Drop object</button>
          <button type="button" data-act="gust">Gust</button>
          <button type="button" data-act="play">${paused ? "Play" : "Pause"}</button>
          <button type="button" data-act="slow" class="${slow ? "on" : ""}">Slow motion 0.25x</button>
          <button type="button" data-act="reset">Reset</button>
        </div>
        <canvas width="${W}" height="60" class="dyn-energy" id="dyn-energy" aria-label="Energy over time"></canvas>
        <p class="cap" id="dyn-meter"></p>
        <p class="group-label">Curiosities this sim produces</p>
        <p id="dyn-chips"></p>
        <p class="group-label">Proximities, measured as it runs (one beat is one second)</p>
        <ul class="dyn-prox" id="dyn-prox"></ul>
        <div class="bar-actions">
          <button type="button" data-act="board">Send to board</button>
          <button type="button" data-act="shelf">Keep on Shelf</button>
          <span class="cap">Board: envMotion and cameraCarry over the last four beats.</span>
        </div>
        <p class="cap">In Maya: a nucleus node solves nCloth and nParticles together; gravity, air and drag live on it, and turbulence is a field. Cloth presets come from nCloth's preset list.</p>
      </div></div>`;

    el.querySelectorAll("[data-k]").forEach((x) =>
      x.addEventListener(x.type === "range" ? "input" : "change", () => {
        const k = x.dataset.k;
        s[k] = x.type === "checkbox" ? x.checked : x.type === "range" ? Number(x.value) : x.value;
        const v = el.querySelector(`[data-v="${k}"]`);
        if (v) v.textContent = s[k];
        store.set(s);
      })
    );
    el.querySelectorAll("[data-suite]").forEach((b) =>
      b.addEventListener("click", () => {
        const su = SUITES_HERE.find((x) => x.id === b.dataset.suite);
        Object.assign(s, su.set);
        slow = !!su.slow;
        store.set(s);
        sim = newSim();
        for (let i = 0; i < (su.drop || 0); i++) dropBox(10 + i * 26);
        if (su.id === "storm") gust();
        draw(el, api);
      })
    );
    const act = (name, fn) => el.querySelector(`[data-act="${name}"]`).addEventListener("click", fn);
    act("drop", () => dropBox());
    act("gust", gust);
    act("play", (e) => {
      paused = !paused;
      e.target.textContent = paused ? "Play" : "Pause";
    });
    act("slow", (e) => {
      slow = !slow;
      e.target.classList.toggle("on", slow);
    });
    act("reset", () => {
      sim = newSim();
    });
    act("board", () => {
      const beats = beats4();
      api.toBoard("Dynamics", { envMotion: beats.map(() => measures().envMotion), cameraCarry: beats.map((b) => cameraFor(b.impacts)) });
    });
    act("shelf", () => {
      const m = measures();
      const beats = beats4();
      api.toShelf("Dynamics", {
        envMotion: beats.map(() => m.envMotion),
        windForce: beats.map(() => m.windForce),
        turbulence: beats.map(() => m.turbulence),
        clothResponse: beats.map(() => m.clothResponse),
        impacts: beats.map((b) => Math.min(8, b.impacts)),
        breakage: beats.map((b) => b.breakage),
        settleTime: beats.map(() => m.settleTime),
        gravityFeel: beats.map(() => m.gravityFeel),
        cameraCarry: beats.map((b) => cameraFor(b.impacts)),
      });
    });

    const canvas = el.querySelector("#dyn-canvas");
    const ctx = canvas.getContext("2d");
    const ectx = el.querySelector("#dyn-energy").getContext("2d");
    let uiAt = 0;
    cancelAnimationFrame(raf);
    last = 0;
    function tick(now) {
      const studio = document.getElementById("studio");
      if (!canvas.isConnected || (studio && studio.classList.contains("hidden"))) return;
      const real = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (!paused) {
        const total = real * (slow ? 0.25 : 1);
        const n = Math.max(1, Math.ceil(total / (1 / 120)));
        for (let i = 0; i < n; i++) step(total / n);
      }
      paint(ctx);
      if (now - uiAt > 250) {
        uiAt = now;
        const m = measures();
        paintEnergy(ectx, W, 60);
        el.querySelector("#dyn-chips").innerHTML = chipsHtml(m);
        el.querySelector("#dyn-prox").innerHTML = proxHtml(m);
        el.querySelector("#dyn-meter").textContent = `Impacts in the last beats: ${sim.beats.slice(-4).map((b) => b.impacts).join(" · ") || "—"} · settle ${m.settleSec.toFixed(2)} s · ${sim.boxes.length} bodies · ${sim.parts.length} particles`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  /* The last four completed beats, padded at the front with quiet beats. */
  function beats4() {
    const b = sim.beats.slice(-4);
    while (b.length < 4) b.unshift({ impacts: 0, breakage: "holds" });
    return b;
  }

  window.CuriosityStudio.register({
    id: "dynamics",
    label: "Dynamics",
    order: 50,
    maya: "nucleus solver and fields (gravity, air/wind, turbulence, drag), nParticles, nCloth, rigid bodies",
    draw,
  });
})();
