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
  const DEFAULTS = { cloth: "t-shirt", gravity: "real", drag: 1, wind: 1, windDir: 0, gusts: false, turb: 1, mode: "dust", rate: 20, life: 3, size: 2, hit: 120, strength: 260, camera: "locked", figure: true, tear: 1.6, spawn: true, fields: [] };
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
    const rows = 14;
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

  /* A standing person as collision circles: head, chest, belly, hips, two legs. */
  const FIGURE = [
    [254, 92, 10],
    [254, 117, 15],
    [254, 140, 13],
    [254, 158, 11],
    [247, 177, 7],
    [261, 177, 7],
  ];

  function collideFigure(o, r, bounce) {
    if (!s.figure) return false;
    let hit = false;
    FIGURE.forEach(([cx, cy, cr]) => {
      const dx = o.x - cx;
      const dy = o.y - cy;
      const d = Math.hypot(dx, dy);
      const min = cr + r;
      if (d < min && d > 0.0001) {
        const nx = dx / d;
        const ny = dy / d;
        o.x = cx + nx * min;
        o.y = cy + ny * min;
        if (bounce && o.vx != null) {
          const vn = o.vx * nx + o.vy * ny;
          if (vn < 0) {
            o.vx -= (1 + bounce) * vn * nx;
            o.vy -= (1 + bounce) * vn * ny;
          }
        }
        hit = true;
      }
    });
    return hit;
  }

  function noise(x, y, t) {
    return (Math.sin(x * 0.05 + t * 1.7) + Math.sin(y * 0.07 - t * 2.3) + Math.sin((x + y) * 0.03 + t * 0.9)) / 3;
  }

  /* Maya's dynamic fields as gizmos: magnitude 0-5, attenuation 0-5 (falloff with distance). */
  const FIELD_TYPES = {
    newton: { label: "Newton", tip: "attracts" },
    radial: { label: "Radial", tip: "pushes out" },
    vortex: { label: "Vortex", tip: "spins" },
    uniform: { label: "Uniform", tip: "constant push one way" },
    volume: { label: "Volume axis", tip: "a cylinder that pushes along its axis and draws in toward it" },
  };
  const MAX_FIELDS = 6;
  let selField = -1;

  /* Force from the placed fields at a point, split so swirl and blast can be measured. */
  function gizmoForce(x, y) {
    const out = { x: 0, y: 0, swirl: 0, blast: 0, other: 0 };
    (s.fields || []).forEach((f) => {
      const dx = x - f.x;
      const dy = y - f.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const fall = Math.exp((-f.att * d) / 100);
      const k = f.mag * 160 * fall;
      const a = (f.ang * Math.PI) / 180;
      let fx = 0;
      let fy = 0;
      if (f.type === "newton") {
        const kk = k * Math.min(1, d / 12);
        fx = (-dx / d) * kk;
        fy = (-dy / d) * kk;
      } else if (f.type === "radial") {
        fx = (dx / d) * k;
        fy = (dy / d) * k;
        out.blast += Math.hypot(fx, fy);
      } else if (f.type === "vortex") {
        fx = (-dy / d) * k;
        fy = (dx / d) * k;
        out.swirl += Math.hypot(fx, fy);
      } else if (f.type === "uniform") {
        fx = Math.cos(a) * k;
        fy = Math.sin(a) * k;
      } else if (f.type === "volume") {
        const ax = Math.cos(a);
        const ay = Math.sin(a);
        const u = dx * ax + dy * ay;
        const v = -dx * ay + dy * ax;
        if (Math.abs(u) < 60 && Math.abs(v) < 20) {
          const kv = f.mag * 160 * Math.exp((-f.att * Math.abs(v)) / 40);
          const inflow = (-v / 20) * kv * 0.4;
          fx = ax * kv - ay * inflow;
          fy = ay * kv + ax * inflow;
          out.swirl += Math.abs(inflow);
        }
      }
      out.x += fx;
      out.y += fy;
      if (f.type !== "vortex" && f.type !== "radial") out.other += Math.hypot(fx, fy);
    });
    return out;
  }

  function field(x, y, t, resp) {
    const a = (s.windDir * Math.PI) / 180;
    const w = (s.wind * (1 + sim.gust * 1.5) + sim.gust * 3) * 40;
    const tu = s.turb * 45;
    let door = 0;
    if (sim.door) {
      const age = t - sim.door.t;
      const front = age * 700;
      if (age < 1.2 && x < front) door = 3000 * Math.exp(-age * 1.8) * Math.max(0, 1 - (front - x) / 320);
    }
    const gz = s.fields && s.fields.length ? gizmoForce(x, y) : { x: 0, y: 0 };
    return {
      x: (Math.cos(a) * w + tu * noise(x, y, t) + door + gz.x) * resp,
      y: (Math.sin(a) * w + tu * noise(y + 40, x - 20, t * 1.3) + gz.y) * resp,
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

  function doorSlam() {
    sim.door = { t: sim.t };
    sim.gusts.push({ t: sim.t, base: clothSpeed(), peak: 0, kind: "door" });
    if (sim.gusts.length > 20) sim.gusts.shift();
    registerHit(s.hit + 1, 4, 120);
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
    /* nCloth tearing, measured on the strain before the solver pulls links back: a link stretched past the ratio breaks. 1.6 means it never tears; the first half second lets the cloth settle onto the figure. */
    if (s.tear < 1.6 && t > 0.5) {
      const before = sim.cloth.links.length;
      sim.cloth.links = sim.cloth.links.filter((l) => Math.hypot(pts[l[0]].x - pts[l[1]].x, pts[l[0]].y - pts[l[1]].y) <= l[2] * s.tear);
      const torn = before - sim.cloth.links.length;
      if (torn) {
        const gone = new Set();
        sim.cloth.links.forEach((l) => (gone.add(l[0]), gone.add(l[1])));
        sim.cloth.bends = sim.cloth.bends.filter((b) => gone.has(b[0]) && gone.has(b[1]) && Math.hypot(pts[b[0]].x - pts[b[1]].x, pts[b[0]].y - pts[b[1]].y) <= b[2] * s.tear);
        sim.torn = (sim.torn || 0) + torn;
        const recent = sim.breaks.filter((b) => b.cloth && t - b.t < 1).reduce((a, b) => a + b.n, 0) + torn;
        sim.breaks.push({ t, word: recent >= 12 ? "shatters" : "cracks", cloth: true, n: torn });
        if (sim.breaks.length > 200) sim.breaks.shift();
      }
    }

    for (let k = 0; k < cp.iter; k++) {
      sim.cloth.links.forEach((l) => solve(pts[l[0]], pts[l[1]], l[2], 1));
      if (cp.bend > 0) sim.cloth.bends.forEach((l) => solve(pts[l[0]], pts[l[1]], l[2], cp.bend));
      pts.forEach((q) => {
        if (!q.pin) collideFigure(q, 1.5, 0);
      });
    }
    /* Rigid boxes. */
    const boxes = sim.boxes;
    const born = [];
    const dead = new Set();
    boxes.forEach((b) => {
      const f = field(b.x, b.y, t, 0.08);
      if (s.fields && s.fields.length) {
        const gz = gizmoForce(b.x + b.w / 2, b.y + b.h / 2);
        b.vx += gz.x * 0.5 * dt;
        b.vy += gz.y * 0.5 * dt;
      }
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
    if (s.figure)
      boxes.forEach((b) => {
        const c = { x: b.x + b.w / 2, y: b.y + b.h / 2, vx: b.vx, vy: b.vy };
        const v0 = Math.hypot(b.vx, b.vy);
        if (collideFigure(c, Math.min(b.w, b.h) / 2, 0.3)) {
          b.x = c.x - b.w / 2;
          b.y = c.y - b.h / 2;
          b.vx = c.vx;
          b.vy = c.vy;
          registerHit(v0 - Math.hypot(c.vx, c.vy) + v0 * 0.3, c.x, c.y);
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
    const pm = { rain: [1.2, 0.2, 0.02], dust: [0.04, 1.4, 0.6], sparks: [1, 0.3, 0.05], confetti: [0.25, 1.6, 0.35], splash: [1, 0.3, 0.1], ember: [0.8, 0.3, 0.2] };
    const kids = [];
    /* nParticle collision event: a drop or a spark that lands makes a few short-lived children. */
    const spawn = (p, x, y) => {
      sim.pcoll = (sim.pcoll || 0) + 1;
      if (!s.spawn || p.child || sim.parts.length + kids.length > 520) return;
      const n = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const v = (p.mode === "rain" ? 40 : 70) + Math.random() * 50;
        kids.push({ mode: p.mode === "rain" ? "splash" : "ember", child: true, age: 0, life: 0.25 + Math.random() * 0.3, size: Math.max(1, p.size * 0.6), hue: 0, x, y: y - 1, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
      }
    };
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
      if (collideFigure(p, p.size / 2, p.mode === "rain" ? 0.1 : 0.5) && (p.mode === "rain" || p.mode === "sparks")) {
        spawn(p, p.x, p.y);
        if (p.mode === "rain") return false;
      }
      if (p.y > FLOOR) {
        if (p.mode === "dust" || p.mode === "confetti") {
          p.y = FLOOR;
          p.vy = 0;
          p.vx *= 0.5;
        } else {
          if (p.mode === "rain" || p.mode === "sparks") spawn(p, p.x, FLOOR);
          return false;
        }
      }
      return true;
    });
    if (kids.length) sim.parts.push(...kids);

    /* Measures: energy, settle, beats. */
    let ke = 0;
    sim.boxes.forEach((b) => (ke += 0.5 * b.w * b.h * (b.vx * b.vx + b.vy * b.vy)));
    const keN = sim.boxes.length ? ke / 1e5 : 0;
    const cs = clothSpeed();
    sim.energy.push({ t, box: keN, cloth: cs });
    if (sim.energy.length > 600) sim.energy.shift();
    if (!sim.settled && sim.lastHit >= 0 && sim.boxes.every((b) => Math.hypot(b.vx, b.vy) < 15) && t - sim.lastHit > 0.1) {
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
      ...swirlBlast(),
    };
  }

  /* swirl: the vortex and turbulence share of the non-gravity push, sampled over the room.
     blast: how hard radial fields push out. */
  function swirlBlast() {
    let sw = 0;
    let tot = 0;
    let blast = 0;
    const a = (s.windDir * Math.PI) / 180;
    for (let gx = 20; gx < W; gx += 40)
      for (let gy = 20; gy < FLOOR; gy += 40) {
        const gz = gizmoForce(gx, gy);
        const turb = s.turb * 45 * 0.6;
        const wind = s.wind * 40;
        sw += gz.swirl + turb;
        tot += gz.swirl + turb + gz.blast + gz.other + wind;
        blast = Math.max(blast, gz.blast);
        void a;
      }
    const swirl = tot > 0 ? Math.round((sw / tot) * 5) : 0;
    const bl = blast < 40 ? "none" : blast < 400 ? "push" : "explosion";
    return { swirl, blast: bl };
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
    /* 2. When a door opens fast or a gust hits, cloth (and hair) react (within 1 beat). */
    const gu = sim.gusts.filter((g) => sim.t - g.t >= 1).pop();
    const P2 = "When a door opens fast or a gust hits, cloth and hair react (1 beat)";
    if (!gu) out.push([P2, null, "no gust or door yet: press Gust or Door slams"]);
    else {
      const ok = gu.peak > gu.base * 1.4 + 6;
      out.push([P2, ok, `${gu.kind === "door" ? "door" : "gust"}: cloth speed ${gu.base.toFixed(0)} → ${gu.peak.toFixed(0)} px/s`]);
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
.dyn-root canvas.dyn-energy { border-width: 1px; margin-top: 6px; height: 60px; box-sizing: border-box; }
.dyn-root .bar-actions { margin: 8px 0; }
.dyn-root .bar-actions button.on { background: var(--ink); color: var(--paper); }
.dyn-root .dyn-auto { margin: 0 0 0 6px; font-size: 9px; padding: 1px 4px; vertical-align: middle; }
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
    if (s.figure) {
      ctx.fillStyle = "rgba(28,23,18,0.18)";
      FIGURE.forEach(([cx, cy, cr]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const doorAge = sim.door ? sim.t - sim.door.t : 9;
    const swing = doorAge < 0.5 ? Math.sin((doorAge / 0.5) * Math.PI) : 0;
    ctx.fillStyle = "#8a6a3a";
    ctx.fillRect(0, FLOOR - 70, 4 + swing * 22, 70);
    if (doorAge < 0.8) {
      ctx.strokeStyle = `rgba(63,110,140,${0.8 - doorAge})`;
      ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        const x = doorAge * 700 - k * 18;
        ctx.beginPath();
        ctx.moveTo(x, FLOOR - 80 + k * 14);
        ctx.lineTo(x - 30, FLOOR - 80 + k * 14);
        ctx.stroke();
      }
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
      } else if (p.mode === "splash") {
        ctx.fillStyle = `rgba(63,110,140,${0.8 * fade})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.mode === "sparks" || p.mode === "ember") {
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
    paintFields(ctx);
    ctx.fillStyle = "#1c1712";
    ctx.font = "9px monospace";
    ctx.fillText(`${sim.t.toFixed(1)}s${slow ? " · 0.25x" : ""}${paused ? " · paused" : ""}`, W - 78, H - 2);
  }

  function paintFields(ctx) {
    (s.fields || []).forEach((f, i) => {
      const on = i === selField;
      ctx.strokeStyle = on ? "#c45c26" : "rgba(28,23,18,0.75)";
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = on ? 1.6 : 1;
      const a = (f.ang * Math.PI) / 180;
      if (f.att > 0 && f.type !== "volume") {
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(f.x, f.y, Math.min(200, (100 * Math.LN2) / f.att), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (f.type === "volume") {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(a);
        ctx.strokeRect(-60, -20, 120, 40);
        ctx.beginPath();
        ctx.ellipse(60, 0, 4, 20, 0, 0, Math.PI * 2);
        ctx.moveTo(-40, 0);
        ctx.lineTo(40, 0);
        ctx.lineTo(34, -4);
        ctx.moveTo(40, 0);
        ctx.lineTo(34, 4);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        if (f.type === "newton" || f.type === "radial") {
          for (let k = 0; k < 4; k++) {
            const r = (k * Math.PI) / 2 + Math.PI / 4;
            const [r0, r1] = f.type === "newton" ? [16, 11] : [11, 16];
            ctx.moveTo(f.x + Math.cos(r) * r0, f.y + Math.sin(r) * r0);
            ctx.lineTo(f.x + Math.cos(r) * r1, f.y + Math.sin(r) * r1);
          }
        } else if (f.type === "vortex") {
          ctx.arc(f.x, f.y, 14, 0, Math.PI * 1.5);
        } else {
          ctx.moveTo(f.x - Math.cos(a) * 14, f.y - Math.sin(a) * 14);
          ctx.lineTo(f.x + Math.cos(a) * 16, f.y + Math.sin(a) * 16);
        }
        ctx.stroke();
      }
      ctx.font = "8px monospace";
      ctx.fillText(FIELD_TYPES[f.type].label[0], f.x - 2.5, f.y + 3);
    });
  }

  function paintEnergy(ctx, w, h) {
    const cv = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    w = Math.max(100, Math.round(cv.clientWidth || w));
    h = Math.max(20, Math.round(cv.clientHeight || h));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  }

  function chipsHtml(m) {
    const esc = api.esc;
    const ids = ["envMotion", "windForce", "turbulence", "clothResponse", "impacts", "breakage", "settleTime", "gravityFeel", "swirl", "blast"];
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
        ${rng("tear", "Cloth tears above (stretch ×, 1.6 = never)", 1.05, 1.6, 0.05)}
        <label class="field"><span><input type="checkbox" data-k="spawn" ${s.spawn ? "checked" : ""}> Collisions spawn (splashes and sparks)</span></label>
        <label class="field"><span><input type="checkbox" data-k="figure" ${s.figure ? "checked" : ""}> Person under the cloth (collider)</span></label>
        ${sel("camera", "Camera", CAMERAS)}
      </div>
      <div>
        <canvas width="${W}" height="${H}" id="dyn-canvas" aria-label="Nucleus simulation"></canvas>
        <div class="bar-actions">
          <button type="button" data-act="drop">Drop object</button>
          <button type="button" data-act="gust">Gust</button>
          <button type="button" data-act="door">Door slams</button>
          <button type="button" data-act="play">${paused ? "Play" : "Pause"}</button>
          <button type="button" data-act="slow" class="${slow ? "on" : ""}">Slow motion 0.25x</button>
          <button type="button" data-act="reset">Reset</button>
        </div>
        <p class="group-label">Fields (drag a gizmo on the canvas)</p>
        <div class="bar-actions">${Object.entries(FIELD_TYPES).map(([k, v]) => `<button type="button" data-addfield="${k}" title="${esc(v.tip)}">+ ${esc(v.label)}</button>`).join(" ")}</div>
        <div id="dyn-field"></div>
        <canvas width="${W}" height="60" class="dyn-energy" id="dyn-energy" aria-label="Energy over time"></canvas>
        <p class="cap">Energy: bodies in orange, cloth in blue; ticks along the top are impacts.</p>
        <p class="cap" id="dyn-meter"></p>
        <p class="group-label">Curiosities this sim produces</p>
        <p id="dyn-chips"></p>
        <p class="cap">Click a chip to automate it, or open Automate.</p>
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
    el.querySelectorAll("[data-suite]").forEach((b) => b.addEventListener("click", () => applySuite(b.dataset.suite, el)));
    listen(el);
    const act = (name, fn) => el.querySelector(`[data-act="${name}"]`).addEventListener("click", fn);
    act("drop", () => dropBox());
    act("gust", gust);
    act("door", doorSlam);
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
        swirl: beats.map(() => m.swirl),
        blast: beats.map(() => m.blast),
        cameraCarry: beats.map((b) => cameraFor(b.impacts)),
      });
    });

    const canvas = el.querySelector("#dyn-canvas");
    const ctx = canvas.getContext("2d");
    s.fields = Array.isArray(s.fields) ? s.fields.map((f) => Object.assign({}, f)).slice(0, MAX_FIELDS) : [];
    const fieldBox = el.querySelector("#dyn-field");
    function fieldPanel() {
      const f = s.fields[selField];
      canvas.style.touchAction = s.fields.length ? "none" : "pan-y";
      el.querySelectorAll("[data-addfield]").forEach((b) => (b.disabled = s.fields.length >= MAX_FIELDS));
      if (!f) {
        fieldBox.innerHTML = s.fields.length ? `<p class="cap">${s.fields.length} of ${MAX_FIELDS} fields. Tap a gizmo to set it.</p>` : `<p class="cap">No fields placed. Up to ${MAX_FIELDS}.</p>`;
        return;
      }
      const r = (k, label, min, max, st) => `<label class="field">${esc(label)}: <span data-fv="${k}">${f[k]}</span><input type="range" min="${min}" max="${max}" step="${st}" data-fk="${k}" value="${f[k]}"></label>`;
      fieldBox.innerHTML = `<p class="cap"><strong>${esc(FIELD_TYPES[f.type].label)}</strong> · ${esc(FIELD_TYPES[f.type].tip)} · at ${Math.round(f.x)}, ${Math.round(f.y)}</p>
        ${r("mag", "Magnitude", 0, 5, 0.5)}${r("att", "Attenuation", 0, 5, 0.5)}${f.type === "uniform" || f.type === "volume" ? r("ang", "Direction (degrees)", -180, 180, 15) : ""}
        <div class="bar-actions"><button type="button" data-delfield>Remove field</button></div>`;
      fieldBox.querySelectorAll("[data-fk]").forEach((x) =>
        x.addEventListener("input", () => {
          f[x.dataset.fk] = Number(x.value);
          fieldBox.querySelector(`[data-fv="${x.dataset.fk}"]`).textContent = x.value;
          store.set(s);
        })
      );
      fieldBox.querySelector("[data-delfield]").addEventListener("click", () => {
        s.fields.splice(selField, 1);
        selField = -1;
        store.set(s);
        fieldPanel();
      });
    }
    el.querySelectorAll("[data-addfield]").forEach((b) =>
      b.addEventListener("click", () => {
        if (s.fields.length >= MAX_FIELDS) return;
        const type = b.dataset.addfield;
        s.fields.push({ type, x: 60 + ((s.fields.length * 47) % 200), y: 70 + ((s.fields.length * 29) % 80), mag: type === "radial" ? 3 : 2, att: type === "uniform" ? 0 : 1, ang: type === "volume" ? -90 : 0 });
        selField = s.fields.length - 1;
        store.set(s);
        fieldPanel();
      })
    );
    const toSim = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };
    canvas.addEventListener("pointerdown", (e) => {
      const p = toSim(e);
      let hit = -1;
      let best = 16;
      s.fields.forEach((f, i) => {
        const d = Math.hypot(f.x - p.x, f.y - p.y);
        if (d < best) {
          best = d;
          hit = i;
        }
      });
      if (hit < 0) {
        if (selField >= 0) {
          selField = -1;
          fieldPanel();
        }
        return;
      }
      e.preventDefault();
      selField = hit;
      fieldPanel();
      canvas.setPointerCapture(e.pointerId);
      const f = s.fields[hit];
      const move = (ev) => {
        const q = toSim(ev);
        f.x = Math.max(0, Math.min(W, q.x));
        f.y = Math.max(0, Math.min(FLOOR, q.y));
      };
      const up = () => {
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        store.set(s);
        fieldPanel();
      };
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
    });
    fieldPanel();
    const ectx = el.querySelector("#dyn-energy").getContext("2d");
    let uiAt = 0;
    cancelAnimationFrame(raf);
    last = 0;
    function tick(now) {
      if (!canvas.isConnected) return;
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
        el.querySelector("#dyn-meter").textContent = `Impacts in the last beats: ${sim.beats.slice(-4).map((b) => b.impacts).join(" · ") || "—"} · settle ${m.settleSec.toFixed(2)} s · ${sim.boxes.length} bodies · ${sim.torn || 0} cloth links torn · ${sim.parts.length} particles · ${sim.pcoll || 0} particle collisions`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  function applySuite(id, el) {
    const su = SUITES_HERE.find((x) => x.id === id);
    if (!su) return;
    Object.assign(s, su.set);
    slow = !!su.slow;
    api.store(KEY).set(s);
    sim = newSim();
    for (let i = 0; i < (su.drop || 0); i++) dropBox(10 + i * 26);
    if (su.id === "storm") gust();
    draw(el, api);
  }

  /* ---------- automation: performable through CurioAuto (LFOs, MIDI) ---------- */
  const CLOTH_FOR = { stiff: "heavy denim", loose: "t-shirt", flutter: "silk" };
  const AUTO = {
    windForce: { k: "wind", to: (v) => Math.max(0, Math.min(5, Number(v) || 0)) },
    turbulence: { k: "turb", to: (v) => Math.max(0, Math.min(5, Number(v) || 0)) },
    gravityFeel: { k: "gravity", to: (v) => (GRAV[v] ? v : null) },
    clothResponse: { k: "cloth", to: (v) => CLOTH_FOR[v] || null },
  };
  let autoOff = null;
  let autoEl = null;
  const suiteOn = {};
  let lastImpacts = null;

  function badge(el, k, on) {
    const input = el.querySelector(`[data-k="${k}"]`);
    const label = input && input.closest("label");
    if (!label) return;
    let b = label.querySelector(".dyn-auto");
    if (!b && on) {
      b = document.createElement("span");
      b.className = "chip lit dyn-auto";
      b.textContent = "automated";
      label.insertBefore(b, label.firstChild.nextSibling);
    }
    if (b) b.hidden = !on;
  }

  function listen(el) {
    autoEl = el;
    if (autoOff || !window.CurioAuto || !window.CurioAuto.on) return;
    autoOff = window.CurioAuto.on((type, d) => {
      const host = autoEl;
      if (!host || !host.isConnected || !host.querySelector("#dyn-canvas")) {
        if (autoOff) autoOff();
        autoOff = null;
        return;
      }
      if (type === "change") {
        /* A patch stopped or started: badges follow what is running now. */
        const run = window.CurioAuto.running ? window.CurioAuto.running() : [];
        Object.entries(AUTO).forEach(([id, m]) => badge(host, m.k, run.includes("c:" + id)));
        if (!run.includes("c:impacts")) lastImpacts = null;
        SUITES_HERE.forEach((su) => {
          if (!run.includes("s:" + su.id)) suiteOn[su.id] = false;
        });
        return;
      }
      if (type !== "tick" || !d || !d.ms || !d.panels || !d.panels[0]) return;
      const v0 = d.panels[0];
      let changed = false;
      Object.entries(AUTO).forEach(([id, m]) => {
        const on = d.ms["c:" + id] != null;
        badge(host, m.k, on);
        if (!on) return;
        const v = m.to(v0[id]);
        if (v == null || s[m.k] === v) return;
        s[m.k] = v;
        changed = true;
        const input = host.querySelector(`[data-k="${m.k}"]`);
        if (input) input.value = v;
        const lab = host.querySelector(`[data-v="${m.k}"]`);
        if (lab) lab.textContent = v;
      });
      /* impacts rising drops objects into the sim. */
      if (d.ms["c:impacts"] != null) {
        const n = Number(v0.impacts) || 0;
        if (lastImpacts != null && n > lastImpacts) for (let i = 0; i < Math.min(3, n - lastImpacts); i++) dropBox();
        lastImpacts = n;
      } else lastImpacts = null;
      if (changed) api.store(KEY).set(s);
      /* Suite presets apply once as they turn on. */
      SUITES_HERE.forEach((su) => {
        const m = d.ms["s:" + su.id];
        const now = m != null && m >= 0.5;
        if (now && !suiteOn[su.id]) {
          suiteOn[su.id] = true;
          applySuite(su.id, host);
        } else if (!now) suiteOn[su.id] = false;
      });
    });
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
