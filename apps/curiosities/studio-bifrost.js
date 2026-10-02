/* Bifrost: an element simulator in the spirit of Bifrost Graph. Aero (smoke and fire) is a small
   stable-fluids grid (advect, light diffuse, project) with density, temperature, buoyancy and
   vorticity confinement. Liquid is a particle fluid (double-density relaxation) you can drop
   things into. Sand and snow are granular grains that pile at their angle of repose and can
   avalanche. An emitter (rate ramp, size, position, thickness), a draggable collider, a scatter
   on the ground, and fire that lights the scene. Every readout is a curiosity. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-bifrost-v1";
  const W = 320, H = 240, GROUND = 212;
  const BEAT = 1.5, SHOT = 8, BNORM = 128; /* seconds per beat, beats per shot (the growth ramp) */
  const DEFAULTS = {
    element: "fire", rate: 3, growth: "steady", size: 3, density: "plume", curl: 2,
    collider: "figure", beam: false, scatterKind: "leaves", scatter: 2, dropSize: "stone",
    ex: 150, ey: 200, cx: 228, cy: 182,
    viscosity: 0, liquidMode: "particles", waveHeight: 2, chop: 2, wind: "right", wet: false,
  };
  const CHOICES = {
    element: ["water", "smoke", "fire", "sand", "snow"],
    growth: ["shrinking", "steady", "building"],
    density: ["wisp", "plume", "wall"],
    collider: ["none", "box", "figure"],
    scatterKind: ["leaves", "debris", "rocks"],
    dropSize: ["pebble", "stone", "boulder"],
    liquidMode: ["particles", "ocean"],
    wind: ["left", "right"],
  };
  const EMIT_AT = { water: [90, 40], smoke: [150, 200], fire: [150, 200], sand: [110, 14], snow: [110, 14] };
  const SUITES = [
    { id: "hearth", label: "Hearth", note: "element fire, growth steady, fireLight flicker, colorTemp 2700K",
      set: { element: "fire", growth: "steady", density: "plume", rate: 3, size: 3, curl: 2, collider: "figure", beam: false, ex: 150, ey: 200, cx: 228, cy: 182 } },
    { id: "avalanche", label: "Avalanche", note: "element snow, density wall, growth building, impacts 8",
      set: { element: "snow", growth: "building", density: "wall", rate: 5, size: 4, curl: 1, collider: "box", beam: false, ex: 110, ey: 14, cx: 262, cy: 192 }, avalanche: true },
    { id: "drift", label: "Drift", note: "element smoke, density wisp, curl 3, atmosphere beams",
      set: { element: "smoke", growth: "steady", density: "wisp", rate: 2, size: 2, curl: 3, collider: "none", beam: true, ex: 120, ey: 204 } },
  ];
  let anim = null;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  /* ---------- collider shape ---------- */
  function sdf(s, x, y) {
    if (s.collider === "box") {
      const dx = Math.abs(x - s.cx) - 24, dy = Math.abs(y - s.cy) - 20;
      return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
    }
    if (s.collider === "figure") {
      const head = Math.hypot(x - s.cx, y - (s.cy - 22)) - 7;
      const ty = clamp(y, s.cy - 12, s.cy + 22);
      const body = Math.hypot(x - s.cx, y - ty) - 8;
      return Math.min(head, body);
    }
    return 1e9;
  }

  /* ---------- Aero: stable fluids on a 64 x 48 grid ---------- */
  const NX = 64, NY = 48, CS = 5, SZ = (NX + 2) * (NY + 2);
  const IX = (i, j) => i + (NX + 2) * j;
  function makeAero() {
    const f = () => new Float32Array(SZ);
    return { u: f(), v: f(), u0: f(), v0: f(), d: f(), d0: f(), t: f(), t0: f(), solid: new Uint8Array(SZ), curlW: f() };
  }
  function bnd(b, x, solid) {
    for (let i = 1; i <= NX; i++) {
      x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
      x[IX(i, NY + 1)] = b === 2 ? -x[IX(i, NY)] : x[IX(i, NY)];
    }
    for (let j = 1; j <= NY; j++) {
      x[IX(0, j)] = b === 1 ? -x[IX(1, j)] : x[IX(1, j)];
      x[IX(NX + 1, j)] = b === 1 ? -x[IX(NX, j)] : x[IX(NX, j)];
    }
    if (b) for (let k = 0; k < SZ; k++) if (solid[k]) x[k] = 0;
  }
  function linSolve(b, x, x0, a, c, solid, iters) {
    for (let it = 0; it < iters; it++) {
      for (let j = 1; j <= NY; j++)
        for (let i = 1; i <= NX; i++) {
          const k = IX(i, j);
          x[k] = (x0[k] + a * (x[k - 1] + x[k + 1] + x[k - NX - 2] + x[k + NX + 2])) / c;
        }
      bnd(b, x, solid);
    }
  }
  function advect(b, d, d0, u, v, dt, solid) {
    for (let j = 1; j <= NY; j++)
      for (let i = 1; i <= NX; i++) {
        const k = IX(i, j);
        let x = clamp(i - dt * u[k], 0.5, NX + 0.5), y = clamp(j - dt * v[k], 0.5, NY + 0.5);
        const i0 = x | 0, j0 = y | 0, s1 = x - i0, t1 = y - j0;
        d[k] = (1 - s1) * ((1 - t1) * d0[IX(i0, j0)] + t1 * d0[IX(i0, j0 + 1)]) + s1 * ((1 - t1) * d0[IX(i0 + 1, j0)] + t1 * d0[IX(i0 + 1, j0 + 1)]);
      }
    bnd(b, d, solid);
  }
  function project(F) {
    const { u, v, u0: p, v0: div, solid } = F;
    for (let j = 1; j <= NY; j++)
      for (let i = 1; i <= NX; i++) {
        const k = IX(i, j);
        div[k] = -0.5 * (u[k + 1] - u[k - 1] + v[k + NX + 2] - v[k - NX - 2]);
        p[k] = 0;
      }
    bnd(0, div, solid);
    bnd(0, p, solid);
    linSolve(0, p, div, 1, 4, solid, 14);
    for (let j = 1; j <= NY; j++)
      for (let i = 1; i <= NX; i++) {
        const k = IX(i, j);
        u[k] -= 0.5 * (p[k + 1] - p[k - 1]);
        v[k] -= 0.5 * (p[k + NX + 2] - p[k - NX - 2]);
      }
    bnd(1, u, solid);
    bnd(2, v, solid);
  }
  function aeroStep(F, s, emit, dt) {
    const fire = s.element === "fire";
    const { u, v, d, t, solid, curlW } = F;
    /* emitter */
    const thick = { wisp: 0.5, plume: 1, wall: 1.7 }[s.density];
    const ei = Math.round(s.ex / CS) + 1, ej = Math.round(s.ey / CS) + 1;
    const r = s.density === "wall" ? s.size * 3 + 4 : s.size;
    const amt = emit * thick;
    for (let j = ej - Math.ceil(s.size / 2); j <= ej + Math.ceil(s.size / 2); j++)
      for (let i = ei - r; i <= ei + r; i++) {
        if (i < 1 || i > NX || j < 1 || j > NY) continue;
        const k = IX(i, j);
        if (solid[k]) continue;
        const fall = 1 - Math.abs(i - ei) / (r + 1);
        const jit = 0.6 + Math.random() * 0.8;
        if (fire) {
          t[k] += amt * 0.38 * fall * jit;
          d[k] += amt * 0.06 * fall;
        } else {
          d[k] += amt * 0.16 * fall * jit;
          t[k] += amt * 0.05 * fall;
        }
        v[k] -= amt * (fire ? 3.5 : 1.6) * fall;
        u[k] += (Math.random() - 0.5) * 2;
      }
    /* buoyancy (y is down) */
    for (let k = 0; k < SZ; k++) v[k] += dt * (-(fire ? 34 : 18) * t[k] + 3 * d[k]);
    /* vorticity confinement */
    const eps = s.curl * (fire ? 3.2 : 2.6);
    if (eps > 0) {
      for (let j = 1; j <= NY; j++)
        for (let i = 1; i <= NX; i++) {
          const k = IX(i, j);
          curlW[k] = 0.5 * (v[k + 1] - v[k - 1] - (u[k + NX + 2] - u[k - NX - 2]));
        }
      for (let j = 2; j < NY; j++)
        for (let i = 2; i < NX; i++) {
          const k = IX(i, j);
          let nx = 0.5 * (Math.abs(curlW[k + 1]) - Math.abs(curlW[k - 1]));
          let ny = 0.5 * (Math.abs(curlW[k + NX + 2]) - Math.abs(curlW[k - NX - 2]));
          const len = Math.hypot(nx, ny) + 1e-5;
          nx /= len;
          ny /= len;
          u[k] += dt * eps * ny * curlW[k];
          v[k] -= dt * eps * nx * curlW[k];
        }
    }
    /* light velocity diffusion, project, advect, project */
    F.u0.set(u);
    F.v0.set(v);
    const vis = dt * 0.02 * NX * NY * 0.001;
    linSolve(1, u, F.u0, vis, 1 + 4 * vis, solid, 3);
    linSolve(2, v, F.v0, vis, 1 + 4 * vis, solid, 3);
    project(F);
    F.u0.set(u);
    F.v0.set(v);
    advect(1, u, F.u0, F.u0, F.v0, dt, solid);
    advect(2, v, F.v0, F.u0, F.v0, dt, solid);
    project(F);
    F.d0.set(d);
    F.t0.set(t);
    advect(0, d, F.d0, u, v, dt, solid);
    advect(0, t, F.t0, u, v, dt, solid);
    const cool = fire ? 0.955 : 0.97, fade = fire ? 0.985 : 0.996;
    for (let k = 0; k < SZ; k++) {
      t[k] *= cool;
      d[k] *= fade;
      if (solid[k]) d[k] = t[k] = 0;
      u[k] *= 0.999;
      v[k] *= 0.999;
    }
  }
  function aeroSolid(F, s) {
    F.solid.fill(0);
    if (s.collider === "none") return;
    for (let j = 1; j <= NY; j++)
      for (let i = 1; i <= NX; i++) if (sdf(s, (i - 0.5) * CS, (j - 0.5) * CS) < 0) F.solid[IX(i, j)] = 1;
  }

  /* ---------- Liquid: particles with double-density relaxation ---------- */
  const LH = 11, RHO0 = 4.2, KP = 0.09, KN = 0.35, LMAX = 640;
  function makeLiquid() {
    const L = { n: 0, x: new Float32Array(LMAX), y: new Float32Array(LMAX), px: new Float32Array(LMAX), py: new Float32Array(LMAX), vx: new Float32Array(LMAX), vy: new Float32Array(LMAX), born: new Float32Array(LMAX), cells: new Map(), drop: null, foam: [] };
    for (let y = GROUND - 4; y > GROUND - 48; y -= 5.2) for (let x = 4; x < W - 4; x += 5.2) addParticle(L, x + Math.random(), y, 0, 0, -10);
    return L;
  }
  function addParticle(L, x, y, vx, vy, now) {
    if (L.n >= LMAX) return false;
    const i = L.n++;
    L.x[i] = x;
    L.y[i] = y;
    L.vx[i] = vx;
    L.vy[i] = vy;
    L.born[i] = now;
    return true;
  }
  function liquidStep(L, s, emit, now, meas) {
    const { x, y, px, py, vx, vy } = L;
    const n = L.n;
    /* emitter */
    const thick = { wisp: 0.4, plume: 1, wall: 2 }[s.density];
    L.acc = (L.acc || 0) + emit * thick * 0.5;
    const spread = (s.density === "wall" ? s.size * 9 : s.size * 2) * (1 - s.viscosity * 0.1);
    while (L.acc >= 1) {
      L.acc -= 1;
      addParticle(L, s.ex + (Math.random() - 0.5) * spread, s.ey + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 0.3, 1.5, now);
    }
    /* gravity + neighbour grid */
    const cells = new Map();
    for (let i = 0; i < L.n; i++) {
      vy[i] += 0.22;
      px[i] = x[i];
      py[i] = y[i];
      x[i] += vx[i];
      y[i] += vy[i];
      const key = ((x[i] / LH) | 0) * 1000 + ((y[i] / LH) | 0);
      let c = cells.get(key);
      if (!c) cells.set(key, (c = []));
      c.push(i);
    }
    /* relaxation */
    const nb = [];
    for (let i = 0; i < L.n; i++) {
      const gx = (x[i] / LH) | 0, gy = (y[i] / LH) | 0;
      let rho = 0, rhoN = 0;
      nb.length = 0;
      for (let a = -1; a <= 1; a++)
        for (let b = -1; b <= 1; b++) {
          const c = cells.get((gx + a) * 1000 + gy + b);
          if (!c) continue;
          for (const j of c) {
            if (j === i) continue;
            const dx = x[j] - x[i], dy = y[j] - y[i];
            const r2 = dx * dx + dy * dy;
            if (r2 >= LH * LH) continue;
            const r = Math.sqrt(r2) || 0.01, q = 1 - r / LH;
            rho += q * q;
            rhoN += q * q * q;
            nb.push(j, dx / r, dy / r, q);
          }
        }
      const P = KP * (rho - RHO0), PN = KN * rhoN;
      let ddx = 0, ddy = 0;
      for (let m = 0; m < nb.length; m += 4) {
        const j = nb[m], q = nb[m + 3];
        const D = (P * q + PN * q * q) * 0.5;
        const ux = nb[m + 1] * D, uy = nb[m + 2] * D;
        x[j] += ux;
        y[j] += uy;
        ddx -= ux;
        ddy -= uy;
      }
      x[i] += ddx;
      y[i] += ddy;
    }
    /* dropped object */
    const o = L.drop;
    if (o) {
      o.vy += 0.3;
      o.y += o.vy;
      o.x += o.vx;
      let touching = 0;
      for (let i = 0; i < L.n; i++) {
        const dx = x[i] - o.x, dy = y[i] - o.y, r = Math.hypot(dx, dy);
        if (r < o.r + 3) {
          touching++;
          const push = o.r + 3 - r, nx = dx / (r || 1), ny = dy / (r || 1);
          x[i] += nx * push;
          y[i] += ny * push;
          vx[i] += nx * Math.abs(o.vy) * 0.25 + o.vx * 0.3;
          vy[i] += Math.min(0, ny) * Math.abs(o.vy) * 0.6 * (o.r / 9);
        }
      }
      if (touching && !o.hit) {
        o.hit = now;
        spawnFoam(L.foam, o.x, o.y + o.r * 0.5, Math.round(o.r * 3.5 * (1 - s.viscosity / 6)), 2.2);
        meas.drops++;
        meas.impacts += 1 + Math.round(o.r / 6);
      }
      if (touching) {
        o.vy *= 1 - Math.min(0.12, touching * 0.004);
        o.vx *= 0.95;
      }
      if (o.y > GROUND - o.r) {
        o.y = GROUND - o.r;
        o.vy = 0;
      }
      if (o.hit && now - o.hit < 0.5) {
        for (let i = 0; i < L.n; i++) if (y[i] - py[i] < -1.5 && L.born[i] < o.hit) o.launched.add(i);
      }
      if (o.hit && now - o.hit > 0.5 && !o.splash) {
        const c = o.launched.size;
        o.splash = c < 3 ? "none" : c < 22 ? "drip" : "burst";
        meas.splash = o.splash;
      }
      if (o.hit && now - o.hit > 6) L.drop = null;
    }
    /* collisions, velocity, viscosity-ish damping */
    let ke = 0, cnt = 0;
    for (let i = 0; i < L.n; i++) {
      if (s.collider !== "none") {
        const dd = sdf(s, x[i], y[i]);
        if (dd < 2) {
          const gx = sdf(s, x[i] + 1, y[i]) - sdf(s, x[i] - 1, y[i]), gy = sdf(s, x[i], y[i] + 1) - sdf(s, x[i], y[i] - 1);
          const g = Math.hypot(gx, gy) || 1;
          x[i] += (gx / g) * (2 - dd);
          y[i] += (gy / g) * (2 - dd);
        }
      }
      if (x[i] < 2) x[i] = 2;
      if (x[i] > W - 2) x[i] = W - 2;
      if (y[i] > GROUND - 2) y[i] = GROUND - 2 - Math.random() * 0.1;
      if (y[i] < 2) y[i] = 2;
      /* viscosity: water 0 to honey 3 to lava 5 damps the motion and slows the spread */
      const damp = 0.985 - s.viscosity * 0.024;
      vx[i] = (x[i] - px[i]) * damp * (1 - s.viscosity * 0.025);
      vy[i] = (y[i] - py[i]) * damp;
      if (s.viscosity < 4.5 && vx[i] * vx[i] + vy[i] * vy[i] > 6 && Math.random() < 0.05 * (1 - s.viscosity / 5)) spawnFoam(L.foam, x[i], y[i], 1, 0.6);
      if (now - L.born[i] > 2) {
        ke += vx[i] * vx[i] + vy[i] * vy[i];
        cnt++;
      }
    }
    meas.liquidSpeed = cnt ? Math.sqrt(ke / cnt) : 0;
    stepFoam(L.foam);
  }

  /* ---------- Foam: white particles that fade ---------- */
  function spawnFoam(foam, x, y, n, kick) {
    for (let i = 0; i < n && foam.length < 420; i++)
      foam.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * kick * 2, vy: -Math.random() * kick * 1.6, life: 1, rate: 0.006 + Math.random() * 0.008 });
  }
  function stepFoam(foam) {
    for (let i = foam.length - 1; i >= 0; i--) {
      const f = foam[i];
      f.vy += 0.04;
      f.vx *= 0.95;
      f.vy *= 0.92;
      f.x += f.vx;
      f.y += f.vy;
      if (f.y > GROUND - 2) f.y = GROUND - 2;
      f.life -= f.rate;
      if (f.life <= 0) foam.splice(i, 1);
    }
  }
  const foamWord = (n) => (n < 6 ? "none" : n < 70 ? "froth" : "surf");
  const viscWord = (v) => (v <= 1 ? "thin" : v <= 3 ? "syrupy" : "thick");
  function liquidColor(v, a) {
    const A = [70, 130, 190], B = [196, 138, 38], C = [226, 78, 22];
    const t = v / 5, c = t < 0.5 ? A.map((x, i) => x + (B[i] - x) * t * 2) : B.map((x, i) => x + (C[i] - x) * (t - 0.5) * 2);
    return `rgba(${c.map(Math.round).join(",")},${a})`;
  }

  /* ---------- Ocean: a sum of directional waves with a floating object ---------- */
  const SEA = 150;
  const WAVES = [[150, 3.0, 0], [92, 1.7, 1.3], [57, 0.9, 2.1], [34, 0.45, 4.0]];
  function makeOcean() {
    return { t: 0, foam: [], float: { x: 160, y: SEA - 4, vy: 0, ang: 0, inAir: false } };
  }
  /* surface point for rest position x0: Gerstner-style, choppiness pulls crests sideways */
  function seaPoint(s, x0, t) {
    const dir = s.wind === "left" ? -1 : 1;
    let x = x0, y = SEA;
    for (const [len, amp, ph] of WAVES) {
      const k = (2 * Math.PI) / len, w = Math.sqrt(9.8 * k * 60), A = amp * s.waveHeight;
      const th = dir * k * x0 - w * t * 0.5 + ph;
      const Q = A ? Math.min(0.9 / (k * A * WAVES.length), 1e3) * (s.chop / 5) : 0;
      x += dir * Q * A * Math.cos(th);
      y -= A * Math.sin(th);
    }
    return [x, y];
  }
  function seaY(s, x, t) {
    return seaPoint(s, x, t)[1];
  }
  function oceanStep(O, s, dt, meas) {
    O.t += dt;
    const f = O.float, dir = s.wind === "left" ? -1 : 1;
    const sy = seaY(s, f.x, O.t);
    if (f.inAir || f.y < sy - 8) {
      f.vy += 0.3;
      f.y += f.vy;
      if (f.y >= sy - 4) {
        const v = f.vy;
        f.inAir = false;
        const sp = v > 7 ? "burst" : v > 3.5 ? "drip" : "none";
        meas.splash = sp;
        meas.impacts += v > 3.5 ? 1 : 0;
        spawnFoam(O.foam, f.x, sy, Math.round(v * 5), 2.4);
      }
    } else {
      /* bob: a damped spring onto the surface */
      f.vy += (sy - 4 - f.y) * 0.08;
      f.vy *= 0.86;
      f.y += f.vy;
    }
    const slope = (seaY(s, f.x + 6, O.t) - seaY(s, f.x - 6, O.t)) / 12;
    f.ang += (Math.atan(slope) - f.ang) * 0.15;
    f.x += dir * (0.05 + s.waveHeight * 0.03);
    if (f.x > W + 10) f.x = -10;
    if (f.x < -10) f.x = W + 10;
    /* whitecaps on steep crests */
    if (s.waveHeight > 0) {
      for (let x0 = 0; x0 < W; x0 += 5) {
        const [x, y] = seaPoint(s, x0, O.t), [x2, y2] = seaPoint(s, x0 + 3, O.t);
        const steep = Math.abs((y2 - y) / Math.max(0.3, x2 - x));
        if (y < SEA - s.waveHeight * 2.4 && steep > 0.25 && Math.random() < 0.012 * s.waveHeight * (0.4 + s.chop / 3)) spawnFoam(O.foam, x, y, 2, 0.5);
      }
    }
    for (let i = O.foam.length - 1; i >= 0; i--) {
      const p = O.foam[i];
      const sy2 = seaY(s, p.x, O.t);
      if (p.y > sy2) p.y += (sy2 - p.y) * 0.3;
      p.x += dir * 0.3;
    }
    stepFoam(O.foam);
  }

  /* ---------- Granular: sand and snow grains on a 160 x 120 grid ---------- */
  const GW = 160, GH = 120, GC = 2, GFLOOR = Math.floor(GROUND / GC);
  function makeGrain() {
    return { g: new Uint8Array(GW * GH), fall: new Uint8Array(GW * GH), stick: new Uint8Array(GW * GH), aval: 0, count: 0 };
  }
  function grainStamp(G, s) {
    const g = G.g;
    for (let k = 0; k < g.length; k++) if (g[k] === 3) g[k] = 0;
    if (s.collider === "none") return;
    for (let y = 0; y < GFLOOR; y++)
      for (let x = 0; x < GW; x++) {
        if (sdf(s, (x + 0.5) * GC, (y + 0.5) * GC) >= 0) continue;
        const k = y * GW + x;
        if (g[k] === 1) {
          /* lift the grain above the collider */
          let yy = y;
          while (yy > 0 && (g[yy * GW + x] !== 0 || sdf(s, (x + 0.5) * GC, (yy + 0.5) * GC) < 0)) yy--;
          if (yy > 0) g[yy * GW + x] = 1;
        }
        g[k] = 3;
      }
  }
  function prefillSlope(G) {
    for (let x = 0; x < 120; x++) {
      const top = GFLOOR - Math.max(0, Math.round((120 - x) * 0.55));
      for (let y = Math.max(2, top); y < GFLOOR; y++) if (!G.g[y * GW + x]) {
        G.g[y * GW + x] = 1;
        G.stick[y * GW + x] = 9;
      }
    }
  }
  function grainStep(G, s, emit, meas) {
    const g = G.g, fall = G.fall, stick = G.stick;
    const snow = s.element === "snow";
    const wet = !snow && !!s.wet; /* MPM-style cohesion: wet sand stands steeper and clumps */
    const empty = (x, y) => x >= 0 && x < GW && y >= 0 && y < GFLOOR && g[y * GW + x] === 0;
    /* emitter */
    const thick = { wisp: 0.5, plume: 1, wall: 2.2 }[s.density];
    G.acc = (G.acc || 0) + emit * thick * (snow ? 2.2 : 2.6);
    const gx0 = Math.round(s.ex / GC), gy0 = Math.max(0, Math.round(s.ey / GC));
    const spread = s.density === "wall" ? GW * 0.7 : s.size * (s.density === "plume" ? 3 : 1);
    while (G.acc >= 1) {
      G.acc -= 1;
      const x = clamp(Math.round(gx0 + (Math.random() - 0.5) * spread), 0, GW - 1);
      const y = clamp(gy0 + ((Math.random() * 3) | 0), 0, GFLOOR - 1);
      const k = y * GW + x;
      const clump = wet ? [0, 1, GW, GW + 1] : [0];
      for (const o of clump) {
        if (k + o < GW * GFLOOR && !g[k + o]) {
          g[k + o] = 1;
          fall[k + o] = 0;
          stick[k + o] = 0;
        }
      }
    }
    const aval = G.aval > 0;
    if (aval) G.aval--;
    const ltr = Math.random() < 0.5;
    let count = 0;
    for (let y = GFLOOR - 1; y >= 0; y--) {
      for (let n = 0; n < GW; n++) {
        const x = ltr ? n : GW - 1 - n;
        const k = y * GW + x;
        if (g[k] !== 1) continue;
        count++;
        let nx = x, ny = y;
        if (empty(x, y + 1) && !(snow && Math.random() < 0.35)) {
          ny = y + 1;
          if (snow && Math.random() < 0.3) {
            const d = Math.random() < 0.5 ? -1 : 1;
            if (empty(x + d, y + 1)) nx = x + d;
          }
          if (y + 2 < GFLOOR && empty(x, y + 2) && !snow) ny = y + 2;
        } else if (!empty(x, y + 1)) {
          if (fall[k] > 14) {
            meas.landings++;
            if (y + 1 < GFLOOR && g[(y + 1) * GW + x] === 3) meas.hits++;
          }
          fall[k] = 0;
          const loose = aval || (snow ? stick[k] < 5 : wet ? stick[k] < 2 : true);
          if (loose) {
            let d = Math.random() < 0.5 ? -1 : 1;
            if (aval) {
              /* slide downhill: toward the side with more air */
              const hl = empty(x - 1, y + 1) + empty(x - 2, y + 1) + empty(x - 2, y + 2), hr = empty(x + 1, y + 1) + empty(x + 2, y + 1) + empty(x + 2, y + 2);
              d = hr > hl ? 1 : hl > hr ? -1 : d;
            }
            if (empty(x + d, y + 1) && empty(x + d, y)) nx = x + d, ny = y + 1;
            else if (empty(x - d, y + 1) && empty(x - d, y)) nx = x - d, ny = y + 1;
            if (nx === x && (aval || (!snow && !wet && Math.random() < 0.4)) && empty(x + d, y) && empty(x + 2 * d, y) && empty(x + 2 * d, y + 1)) nx = x + 2 * d, ny = y + 1;
            if (nx === x && aval && empty(x + d, y) && !empty(x + d, y + 1) && Math.random() < 0.08) nx = x + d;
            if (nx !== x) {
              if (aval) meas.slides++;
              const side = x + 2 * (nx - x);
              if (side >= 0 && side < GW && g[ny * GW + side] === 3 && aval) meas.hits++;
            } else if (snow || wet) stick[k]++;
          }
        }
        if (nx !== x || ny !== y) {
          const k2 = ny * GW + nx;
          g[k2] = 1;
          g[k] = 0;
          fall[k2] = Math.min(255, fall[k] + (ny - y));
          stick[k2] = aval ? 0 : stick[k] > 2 ? stick[k] - 2 : 0;
          fall[k] = stick[k] = 0;
          /* wake neighbours above so a gap lets them move */
          if (y > 0) {
            if (g[k - GW] === 1) stick[k - GW] = 0;
          }
        }
      }
    }
    G.count = count;
    /* cap: remove the top layer once the room is full */
    if (count > 9000) for (let k = 0; k < GW * 6; k++) if (g[k] === 1) g[k] = 0;
  }

  /* ---------- light ---------- */
  const KTAB = [[1900, [255, 131, 0]], [2700, [255, 167, 87]], [3500, [255, 196, 137]], [4500, [255, 219, 186]], [5600, [255, 238, 227]], [7500, [228, 234, 255]]];
  function kColor(K) {
    for (let i = 1; i < KTAB.length; i++)
      if (K <= KTAB[i][0]) {
        const a = KTAB[i - 1], b = KTAB[i], t = (K - a[0]) / (b[0] - a[0]);
        return a[1].map((c, j) => Math.round(c + (b[1][j] - c) * clamp(t, 0, 1)));
      }
    return KTAB[KTAB.length - 1][1];
  }
  function fireColor(t) {
    const r = clamp(t * 2.6, 0, 1), g = clamp(t * 1.8 - 0.35, 0, 1), b = clamp(t * 1.4 - 0.9, 0, 1);
    return [r * 255, g * 235, b * 200, clamp(t * 2.2, 0, 1)];
  }
  const kWord = (K) => (K <= 3600 ? "warm practical" : K >= 5000 ? "cold day" : "mixed");

  /* ---------- tool ---------- */
  function draw(el, api) {
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign({}, DEFAULTS, st.get({}));
    if (anim) cancelAnimationFrame(anim);
    if (!document.getElementById("studio-bifrost")) {
      const style = document.createElement("style");
      style.id = "studio-bifrost";
      style.textContent = `
        #bif-canvas { touch-action: none; cursor: crosshair; image-rendering: auto; }
        .bif-nodes fieldset { border: 1px solid var(--line, #ddd); margin: 0 0 10px; padding: 6px 8px; min-width: 0; }
        .bif-nodes legend { font-family: var(--mono, monospace); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
        .bif-read { display: flex; flex-wrap: wrap; gap: 6px 14px; font-family: var(--mono, monospace); font-size: 12px; margin: 6px 0; }
        .bif-read b { font-weight: 600; }
        .bif-swatch { display: inline-block; width: 12px; height: 12px; border: 1px solid var(--ink, #222); vertical-align: -2px; margin-right: 4px; }
        .bif-ramp { height: 6px; background: var(--line, #ddd); position: relative; margin: 2px 0 8px; }
        .bif-ramp i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--saffron, #c45c26); }
        .bif-prox { list-style: none; padding: 0; margin: 6px 0; font-size: 13px; }
        .bif-prox li { margin: 4px 0; }
        .bif-prox .ok { color: #2e7d32; font-weight: 600; } .bif-prox .no { color: #b3261e; font-weight: 600; } .bif-prox .wait { opacity: 0.7; }
        .bif-grid > div { min-width: 0; }
        .bif-auto { display: inline-block; margin-left: 6px; padding: 0 4px; font-size: 10px; font-family: var(--mono, monospace); background: var(--saffron, #c45c26); color: #fff; text-transform: none; letter-spacing: 0; }
        .bif-tablewrap { overflow-x: auto; max-width: 100%; }
      `;
      document.head.appendChild(style);
    }
    const sel = (k, label) =>
      `<label class="field">${esc(label)}<select data-k="${k}">${CHOICES[k].map((v) => `<option ${s[k] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
    const rg = (k, label, min, max) => `<label class="field">${esc(label)}: <span data-v="${k}">${s[k]}</span><input type="range" min="${min}" max="${max}" data-k="${k}" value="${s[k]}"></label>`;
    el.innerHTML = `<div class="studio-grid bif-grid">
      <div class="bif-nodes">
        <fieldset><legend>Element</legend>${sel("element", "Element")}
          <div class="bar-actions"><button type="button" data-act="reset">Reset sim</button> <button type="button" data-act="pause">Pause</button></div></fieldset>
        <fieldset><legend>Emitter</legend>
          ${rg("rate", "Rate", 0, 5)}
          ${sel("growth", "Growth over the shot")}
          ${rg("size", "Size", 1, 5)}
          ${sel("density", "Thickness")}
          <p class="cap">Drag the dashed ring on the canvas to move the emitter.</p></fieldset>
        <fieldset><legend>Aero</legend>${rg("curl", "Curl (vorticity)", 0, 5)}
          <label class="field"><input type="checkbox" data-k="beam" ${s.beam ? "checked" : ""}> Window beam through the air</label></fieldset>
        <fieldset><legend>Collider</legend>${sel("collider", "Collider")}<p class="cap">Drag it on the canvas.</p></fieldset>
        <fieldset><legend>Liquid</legend>${sel("liquidMode", "Liquid as")}
          ${rg("viscosity", "Viscosity (water, honey, lava)", 0, 5)}
          ${rg("waveHeight", "Ocean wave height", 0, 5)}
          ${rg("chop", "Ocean choppiness", 0, 5)}
          ${sel("wind", "Wind toward")}
          ${sel("dropSize", "Drop")}
          <div class="bar-actions"><button type="button" data-act="drop">Drop into water</button></div>
          <p class="cap">Or tap the water. Switches to water if needed.</p></fieldset>
        <fieldset><legend>Granular</legend><div class="bar-actions"><button type="button" data-act="avalanche">Avalanche</button></div>
          <label class="field"><input type="checkbox" data-k="wet" ${s.wet ? "checked" : ""}> Wet sand (cohesion)</label></fieldset>
        <fieldset><legend>Scatter</legend>${sel("scatterKind", "Scatter")}${rg("scatter", "Scatter density", 0, 5)}</fieldset>
      </div>
      <div>
        <p class="bar-actions">${SUITES.map((x) => `<button type="button" data-suite="${x.id}" title="${esc(x.note)}">${esc(x.label)}</button>`).join(" ")}</p>
        <canvas width="${W}" height="${H}" id="bif-canvas"></canvas>
        <div class="bif-ramp" title="Growth ramp over the shot"><i id="bif-ramp"></i></div>
        <div class="bif-read" id="bif-read"></div>
        <p id="bif-chips"></p>
        <p class="cap">Click a chip to automate it, or open Automate.</p>
        <h3>Proximities</h3>
        <ul class="bif-prox" id="bif-prox"></ul>
        <div class="bar-actions"><button type="button" data-act="shelf">Keep on Shelf</button> <button type="button" data-act="board">Send to board</button> <span class="cap" id="bif-boardcap"></span></div>
        <div class="bif-tablewrap"><table class="trace"><thead><tr><th>Beat</th><th>element</th><th>growth</th><th>fireLight</th><th>colorTemp</th><th>contrast</th><th>atmosphere</th><th>splash</th><th>impacts</th></tr></thead><tbody id="bif-trace"></tbody></table></div>
        <p class="cap">One beat is ${BEAT} s; the growth ramp runs over a ${SHOT}-beat shot and repeats. Fire brightness is the sum of hot cells; it sets fireLight, warms the color temperature of the key and raises contrast. Smoke and falling snow lower contrast and turn the air to haze, or to beams when the window light is on.</p>
      </div></div>`;

    const canvas = el.querySelector("#bif-canvas");
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    off.width = NX;
    off.height = NY;
    const octx = off.getContext("2d");
    const offImg = octx.createImageData(NX, NY);
    const off2 = document.createElement("canvas");
    off2.width = NX;
    off2.height = NY;
    const o2ctx = off2.getContext("2d");
    const fireImg = o2ctx.createImageData(NX, NY);
    const goff = document.createElement("canvas");
    goff.width = GW;
    goff.height = GH;
    const gctx = goff.getContext("2d");
    const gImg = gctx.createImageData(GW, GH);

    let F = null, L = null, G = null, O = null;
    let paused = false, clock = 0, frame = 0;
    const brightHist = [];
    let history = [];
    let beatAcc = null;
    let lastMeasure = { bright: 0, cv: 0, K: 5600, contrast: 3, smoke: 0, fireLight: "no", atmosphere: "clear", splash: "none", impacts: 0 };
    let lastSplash = "none";
    const drops = []; /* {t, splash, settledAt} */

    function newBeat() {
      return { bright: 0, n: 0, smoke: 0, contrast: 0, impacts: 0, landings: 0, hits: 0, slides: 0, drops: 0, splash: null, liquidSpeed: 0, samples: [] };
    }
    function resetSim(extra) {
      F = L = G = O = null;
      if (s.element === "smoke" || s.element === "fire") {
        F = makeAero();
        aeroSolid(F, s);
      } else if (s.element === "water") {
        if (s.liquidMode === "ocean") O = makeOcean();
        else L = makeLiquid();
      }
      else {
        G = makeGrain();
        grainStamp(G, s);
        if (extra && extra.avalanche) prefillSlope(G);
      }
      clock = 0;
      history = [];
      brightHist.length = 0;
      drops.length = 0;
      lastSplash = "none";
      beatAcc = newBeat();
    }
    resetSim();

    const save = () => st.set(s);
    const growthMul = () => {
      const t = (clock % (BEAT * SHOT)) / (BEAT * SHOT);
      return s.growth === "building" ? 0.25 + 1.5 * t : s.growth === "shrinking" ? 1.6 - 1.45 * t : 1;
    };
    function colliderMoved() {
      if (F) aeroSolid(F, s);
      if (G) grainStamp(G, s);
    }

    el.querySelectorAll("[data-k]").forEach((x) => {
      const k = x.dataset.k;
      x.addEventListener(x.type === "range" ? "input" : "change", () => {
        s[k] = x.type === "checkbox" ? x.checked : x.type === "range" ? Number(x.value) : x.value;
        const v = el.querySelector(`[data-v="${k}"]`);
        if (v) v.textContent = s[k];
        if (k === "liquidMode" && s.element !== "water") {
          s.element = "water";
          [s.ex, s.ey] = EMIT_AT.water;
          syncControls();
        }
        if (k === "element" || k === "liquidMode") {
          [s.ex, s.ey] = EMIT_AT[s.element];
          resetSim();
        }
        if (k === "collider") colliderMoved();
        save();
      });
    });
    function syncControls() {
      el.querySelectorAll("[data-k]").forEach((x) => {
        const k = x.dataset.k;
        if (x.type === "checkbox") x.checked = !!s[k];
        else x.value = s[k];
        const v = el.querySelector(`[data-v="${k}"]`);
        if (v) v.textContent = s[k];
      });
    }
    function dropAt(x) {
      if (s.element !== "water") {
        s.element = "water";
        [s.ex, s.ey] = EMIT_AT.water;
        syncControls();
        save();
        resetSim();
      }
      if (O) {
        O.float.x = clamp(x, 20, W - 20);
        O.float.y = 10;
        O.float.vy = 2;
        O.float.inAir = true;
        return;
      }
      const r = { pebble: 4, stone: 8, boulder: 13 }[s.dropSize];
      L.drop = { x: clamp(x, 20, W - 20), y: 10, vx: 0, vy: 2, r, hit: 0, launched: new Set(), splash: null };
      drops.push({ t: clock, o: L.drop, splash: null, settledAt: null });
    }
    el.querySelector('[data-act="reset"]').addEventListener("click", () => resetSim());
    el.querySelector('[data-act="pause"]').addEventListener("click", (e) => {
      paused = !paused;
      e.target.textContent = paused ? "Play" : "Pause";
    });
    el.querySelector('[data-act="drop"]').addEventListener("click", () => dropAt(W * 0.55));
    el.querySelector('[data-act="avalanche"]').addEventListener("click", () => {
      if (s.element !== "sand" && s.element !== "snow") {
        s.element = "snow";
        [s.ex, s.ey] = EMIT_AT.snow;
        syncControls();
        save();
        resetSim({ avalanche: true });
      }
      G.aval = 150;
    });
    el.querySelectorAll("[data-suite]").forEach((b) =>
      b.addEventListener("click", () => {
        const su = SUITES.find((x) => x.id === b.dataset.suite);
        Object.assign(s, su.set);
        save();
        syncControls();
        resetSim({ avalanche: su.avalanche });
        if (su.avalanche) G.aval = 240;
      })
    );

    /* dragging */
    let dragging = null;
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    };
    canvas.addEventListener("pointerdown", (e) => {
      const [x, y] = toLocal(e);
      if (Math.hypot(x - s.ex, y - s.ey) < 18) dragging = "emitter";
      else if (s.collider !== "none" && sdf(s, x, y) < 8) dragging = "collider";
      else if (s.element === "water") dropAt(x);
      if (dragging) {
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const [x, y] = toLocal(e);
      if (dragging === "emitter") {
        s.ex = Math.round(clamp(x, 6, W - 6));
        s.ey = Math.round(clamp(y, 6, GROUND - 4));
      } else {
        s.cx = Math.round(clamp(x, 20, W - 20));
        s.cy = Math.round(clamp(y, 40, GROUND - (s.collider === "box" ? 20 : 22)));
        colliderMoved();
      }
    });
    const endDrag = () => {
      if (dragging) save();
      dragging = null;
    };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    /* ---- scatter on the ground ---- */
    function drawScatter() {
      const n = s.scatter * 9;
      const r = rng(17 + s.scatter);
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = GROUND + 3 + r() * (H - GROUND - 6), a = r() * Math.PI, sz = 2 + r() * 3;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        if (s.scatterKind === "leaves") {
          ctx.fillStyle = ["#9a5a1e", "#b8892d", "#7a3f18"][i % 3];
          ctx.beginPath();
          ctx.ellipse(0, 0, sz + 1, sz * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.scatterKind === "debris") {
          ctx.fillStyle = ["#6b6258", "#8a7a64", "#4a443c"][i % 3];
          ctx.fillRect(-sz, -1, sz * 2, 2 + (i % 2));
        } else {
          ctx.fillStyle = ["#7d7a73", "#5e5b55", "#9a958b"][i % 3];
          ctx.beginPath();
          ctx.ellipse(0, 0, sz + 1, sz * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function drawCollider(m) {
      if (s.collider === "none") return;
      ctx.save();
      ctx.fillStyle = "#2a2622";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (s.collider === "box") ctx.rect(s.cx - 24, s.cy - 20, 48, 40);
      else {
        ctx.arc(s.cx, s.cy - 22, 7, 0, Math.PI * 2);
        ctx.moveTo(s.cx + 8, s.cy - 12);
        ctx.arc(s.cx, s.cy - 12, 8, 0, Math.PI, true);
        ctx.lineTo(s.cx - 8, s.cy + 22);
        ctx.arc(s.cx, s.cy + 22, 8, Math.PI, 0, true);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      /* rim from the fire */
      if (m.bright > 0.05) {
        const c = kColor(m.K);
        const side = m.fx < s.cx ? -1 : 1;
        const g = ctx.createLinearGradient(s.cx + side * 10, 0, s.cx - side * 4, 0);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${clamp(m.bright * m.flick, 0, 0.9)})`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.restore();
    }

    function renderAero(m) {
      const d = F.d, t = F.t, px = offImg.data, fp = fireImg.data;
      const fire = s.element === "fire";
      for (let j = 0; j < NY; j++)
        for (let i = 0; i < NX; i++) {
          const k = IX(i + 1, j + 1), p = (j * NX + i) * 4;
          let dd = clamp(d[k], 0, 1.2);
          let shade = fire ? 60 : 200;
          if (s.beam) {
            /* beam from the window, upper left, falling to the lower right */
            const bx = i * CS, by = j * CS;
            const dist = Math.abs((by - 10) - (bx - 30) * 0.9) / 1.35;
            if (dist < 22) shade = Math.min(255, shade + 55 * (1 - dist / 22)), dd *= 1 + 0.7 * (1 - dist / 22);
          }
          px[p] = shade;
          px[p + 1] = shade;
          px[p + 2] = shade + (fire ? 0 : 6);
          px[p + 3] = clamp(dd * 230, 0, 235);
          if (fire) {
            const c = fireColor(t[k]);
            fp[p] = c[0];
            fp[p + 1] = c[1];
            fp[p + 2] = c[2];
            fp[p + 3] = c[3] * 255;
          } else fp[p + 3] = 0;
        }
      octx.putImageData(offImg, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, -CS / 2, -CS / 2, NX * CS, NY * CS);
      return () => {
        if (!fire) return;
        o2ctx.putImageData(fireImg, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(off2, -CS / 2, -CS / 2, NX * CS, NY * CS);
        ctx.restore();
      };
    }

    function renderGrain() {
      const g = G.g, px = gImg.data, snow = s.element === "snow";
      for (let k = 0; k < GW * GH; k++) {
        const p = k * 4;
        if (g[k] === 1) {
          const n = (k * 2654435761) >>> 28;
          if (snow) {
            px[p] = 236 + (n & 7);
            px[p + 1] = 240 + (n & 7);
            px[p + 2] = 250;
          } else {
            px[p] = 206 + n * 2;
            px[p + 1] = 168 + n * 2;
            px[p + 2] = 102 + n;
          }
          px[p + 3] = 255;
        } else px[p + 3] = 0;
      }
      gctx.putImageData(gImg, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(goff, 0, 0, GW * GC, GH * GC);
      ctx.imageSmoothingEnabled = true;
    }

    function renderFoam(foam) {
      for (const f of foam) {
        ctx.fillStyle = `rgba(255,255,255,${(f.life * 0.9).toFixed(2)})`;
        ctx.fillRect(f.x - 1.2, f.y - 1.2, 2.4, 2.4);
      }
    }
    function renderOcean() {
      const t = O.t;
      const g = ctx.createLinearGradient(0, SEA - 20, 0, H);
      g.addColorStop(0, "#3f7fa8");
      g.addColorStop(1, "#14324a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x0 = -20; x0 <= W + 20; x0 += 3) {
        const [x, y] = seaPoint(s, x0, t);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(220,240,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x0 = -20; x0 <= W + 20; x0 += 3) {
        const [x, y] = seaPoint(s, x0, t);
        if (x0 === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const f = O.float;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.ang);
      ctx.fillStyle = "#8a6a3e";
      ctx.strokeStyle = "#1c1712";
      ctx.fillRect(-9, -7, 18, 12);
      ctx.strokeRect(-9, -7, 18, 12);
      ctx.restore();
      renderFoam(O.foam);
    }
    function renderLiquid() {
      ctx.fillStyle = liquidColor(s.viscosity, 0.88);
      ctx.beginPath();
      for (let i = 0; i < L.n; i++) {
        ctx.moveTo(L.x[i] + 4, L.y[i]);
        ctx.arc(L.x[i], L.y[i], 4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = "rgba(200,230,255,0.55)";
      ctx.beginPath();
      for (let i = 0; i < L.n; i++) {
        const sp = Math.abs(L.vx[i]) + Math.abs(L.vy[i]);
        if (sp > 1.2) {
          ctx.moveTo(L.x[i] + 1.5, L.y[i]);
          ctx.arc(L.x[i], L.y[i], 1.5, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      renderFoam(L.foam);
      const o = L.drop;
      if (o) {
        ctx.fillStyle = "#4a443c";
        ctx.strokeStyle = "#111";
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    /* ---- measure ---- */
    function measureNow() {
      const m = { bright: 0, fx: s.ex, fy: s.ey, smoke: 0, air: 0 };
      if (F) {
        let sum = 0, sx = 0, sy = 0, dsum = 0;
        for (let j = 1; j <= NY; j++)
          for (let i = 1; i <= NX; i++) {
            const k = IX(i, j);
            const h = Math.max(0, F.t[k] - 0.15);
            sum += h;
            sx += h * i;
            sy += h * j;
            dsum += Math.min(1, F.d[k]);
          }
        if (s.element === "fire") {
          m.bright = sum / BNORM;
          if (sum > 0.01) {
            m.fx = (sx / sum) * CS;
            m.fy = (sy / sum) * CS;
          }
        }
        m.smoke = dsum / (NX * NY);
      }
      if (G && s.element === "snow") {
        /* airborne snow reads as haze */
        let air = 0;
        for (let k = 0; k < GW * GFLOOR; k++) if (G.g[k] === 1 && G.fall[k] > 2) air++;
        m.air = air / 1500;
      }
      brightHist.push(m.bright);
      if (brightHist.length > 40) brightHist.shift();
      const mean = brightHist.reduce((a, b) => a + b, 0) / brightHist.length;
      const sd = Math.sqrt(brightHist.reduce((a, b) => a + (b - mean) * (b - mean), 0) / brightHist.length);
      m.cv = mean > 0.01 ? sd / mean : 0;
      m.flick = 0.75 + 0.25 * Math.sin(clock * 17) * Math.min(1, m.cv * 6) + (Math.random() - 0.5) * 0.15;
      const b = m.bright;
      m.fireLight = b < 0.12 ? "no" : b < 0.62 ? "flicker" : "floods";
      m.K = Math.round(clamp(5600 - 2900 * Math.min(1.35, b / 0.45), 1900, 5600) / 100) * 100;
      const haze = m.smoke * 7 + m.air;
      m.contrastF = clamp(2.5 + Math.min(b, 1) * 3.2 - haze * 3.5, 0, 6);
      m.contrast = Math.round(m.contrastF);
      m.atmosphere = haze < 0.12 ? "clear" : s.beam && haze < 1.4 ? "beams" : "haze";
      return m;
    }

    function finishBeat(m) {
      const a = beatAcc;
      const n = Math.max(1, a.n);
      const bright = a.bright / n, smoke = a.smoke / n, contrastF = a.contrast / n;
      const K = Math.round(clamp(5600 - 2900 * Math.min(1.35, bright / 0.45), 1900, 5600) / 100) * 100;
      const impactsRaw = a.impacts + a.hits / 6 + a.landings / 60 + a.slides / 260;
      const rec = {
        beat: history.length ? history[history.length - 1].beat + 1 : 1,
        element: s.element, density: s.density, growth: s.growth, curl: s.curl, scatter: s.scatter,
        fireLight: bright < 0.12 ? "no" : bright < 0.62 ? "flicker" : "floods",
        K, colorTemp: kWord(K), contrastF, contrast: Math.round(contrastF),
        atmosphere: m.atmosphere, smoke, bright, cv: m.cv,
        viscosity: viscWord(s.viscosity), foam: foamWord(a.foamMax || 0), waveHeight: O ? s.waveHeight : 0, cohesion: s.wet ? "wet" : "dry",
        splash: a.splash || "none", impacts: clamp(Math.round(impactsRaw), 0, 8), drops: a.drops, liquidSpeed: a.liquidSpeed / n,
      };
      history.push(rec);
      if (history.length > 24) history.shift();
      beatAcc = newBeat();
      return rec;
    }

    /* ---- proximities over the beats so far ---- */
    function proximities() {
      const out = [];
      const h = history;
      /* 1. fire building -> key warms and flickers, 0 beats */
      let x1 = 0, y1 = 0;
      for (let i = 1; i < h.length; i++) {
        const b = h[i], p = h[i - 1];
        if (b.element === "fire" && b.growth === "building" && b.bright > p.bright + 0.01) {
          x1++;
          if (b.fireLight !== "no" && (b.K < p.K || b.K <= 3000) && b.cv > 0.02) y1++;
        }
      }
      out.push(["When fire is building, the key warms and flickers (0 beats)", x1, y1, "Set element fire and growth building."]);
      /* 2. drop into water -> splash, then settle within 2 beats */
      let x2 = 0, y2 = 0, pend = 0;
      drops.forEach((d) => {
        if (!d.o.hit) return pend++;
        if (d.settledAt == null && clock - d.o.hit <= 2 * BEAT) return pend++;
        x2++;
        if (d.o.splash && d.o.splash !== "none" && d.settledAt != null && d.settledAt - d.o.hit <= 2 * BEAT + 0.5) y2++;
      });
      out.push(["When an object drops into water, splash, then the surface settles (within 2 beats)", x2, y2, pend ? "A drop is in the air or still settling." : "Drop something into the water."]);
      /* 3. smoke thickens -> contrast falls within 1 beat */
      let x3 = 0, y3 = 0;
      for (let i = 1; i < h.length; i++) {
        const b = h[i], p = h[i - 1];
        if (b.smoke > p.smoke * 1.08 && b.smoke > 0.006) {
          if (i + 1 >= h.length && !(b.contrastF < p.contrastF - 0.05)) continue; /* wait for the next beat */
          x3++;
          if (b.contrastF < p.contrastF - 0.05 || (h[i + 1] && h[i + 1].contrastF < p.contrastF - 0.05)) y3++;
        }
      }
      out.push(["When smoke thickens, contrast falls (within 1 beat)", x3, y3, "Set smoke or fire and let the emitter build."]);
      return out;
    }

    /* ---- what goes out ---- */
    function liveIds() {
      const live = new Set();
      try {
        if (typeof CURIOSITIES !== "undefined") CURIOSITIES.forEach((c) => c.live && live.add(c.id));
      } catch (e) {}
      return live;
    }
    function produced(r) {
      return { element: r.element, density: r.density, growth: r.growth, curl: r.curl, splash: r.splash, scatter: r.scatter, fireLight: r.fireLight, colorTemp: r.colorTemp, contrast: r.contrast, impacts: r.impacts, atmosphere: r.atmosphere, viscosity: r.viscosity, foam: r.foam, waveHeight: r.waveHeight, cohesion: r.cohesion };
    }
    function boardFor(r, live) {
      const out = {};
      const p = produced(r);
      Object.keys(p).forEach((k) => live.has(k) && (out[k] = p[k]));
      if (live.has("lighting")) out.lighting = r.fireLight === "floods" ? "hard" : r.fireLight === "flicker" ? "practical" : r.atmosphere === "haze" ? "flat" : r.element === "snow" ? "moon" : "dusk";
      if (live.has("envMotion")) out.envMotion = r.element === "water" ? "water" : r.element === "fire" ? "still" : "wind";
      if (live.has("temperature")) out.temperature = r.element === "fire" ? "hot" : r.element === "snow" ? "cold" : "mild";
      return out;
    }
    const beatsForOut = () => {
      if (history.length) return history.slice(-8);
      return [finishBeat(lastMeasure)];
    };
    el.querySelector('[data-act="shelf"]').addEventListener("click", () => {
      const beats = beatsForOut();
      const vals = {};
      beats.forEach((r) => {
        const p = produced(r);
        Object.keys(p).forEach((k) => (vals[k] = vals[k] || []).push(p[k]));
      });
      api.toShelf(`Bifrost · ${s.element} ${s.density} ${s.growth}`, vals);
    });
    el.querySelector('[data-act="board"]').addEventListener("click", () => {
      const live = liveIds();
      let beats = beatsForOut().slice(-4);
      while (beats.length < 4) beats = [beats[0]].concat(beats);
      const vals = {};
      beats.forEach((r) => {
        const b = boardFor(r, live);
        Object.keys(b).forEach((k) => (vals[k] = vals[k] || []).push(b[k]));
      });
      if (!Object.keys(vals).length) return;
      api.toBoard(`Bifrost: ${s.element}`, vals);
    });
    {
      const live = liveIds();
      const ids = Object.keys(boardFor(Object.assign({ element: s.element }, lastMeasure, { splash: "none", density: s.density, growth: s.growth, curl: s.curl, scatter: s.scatter, colorTemp: "mixed" }), live));
      el.querySelector("#bif-boardcap").textContent = ids.length ? `Board gets ${ids.join(", ")} over 4 panels (last 4 beats); the rest stay on the Shelf.` : "None of these are board controls yet; Shelf only.";
      if (!ids.length) el.querySelector('[data-act="board"]').hidden = true;
    }

    const readEl = el.querySelector("#bif-read"), chipEl = el.querySelector("#bif-chips"), proxEl = el.querySelector("#bif-prox"), traceEl = el.querySelector("#bif-trace"), rampEl = el.querySelector("#bif-ramp");
    function updatePanel(m) {
      const c = kColor(m.K);
      const beatInShot = Math.floor((clock % (BEAT * SHOT)) / BEAT) + 1;
      rampEl.style.width = `${clamp((growthMul() / 1.75) * 100, 2, 100)}%`;
      const ent = history.length ? history[history.length - 1] : null;
      const impacts = ent ? ent.impacts : 0;
      readEl.innerHTML = `<span>beat <b>${beatInShot}/${SHOT}</b></span><span>emit ×<b>${growthMul().toFixed(2)}</b></span><span>fire <b>${m.bright.toFixed(2)}</b></span><span>fireLight <b>${m.fireLight}</b></span><span><i class="bif-swatch" style="background:rgb(${c.join(",")})"></i><b>${m.K}K</b> ${kWord(m.K)}</span><span>contrast <b>${m.contrast}</b></span><span>air <b>${m.atmosphere}</b></span>${O ? `<span>sea <b>h${s.waveHeight} chop${s.chop}</b> wind ${s.wind}</span>` : ""}${L || O ? `<span>foam <b>${m.foamN || 0}</b></span>` : ""}${L ? `<span>surface <b>${m.liquidSpeed < 0.35 ? "settled" : "moving"}</b></span>` : ""}${G ? `<span>grains <b>${G.count}</b>${G.aval > 0 ? " · sliding" : ""}</span>` : ""}`;
      const chips = [
        ["element", s.element], ["density", s.density], ["growth", s.growth], ["curl", s.curl], ["splash", lastSplash], ["scatter", s.scatter],
        ["fireLight", m.fireLight], ["colorTemp", `${kWord(m.K)} (${m.K}K)`], ["contrast", m.contrast], ["impacts", impacts], ["atmosphere", m.atmosphere],
        ["viscosity", viscWord(s.viscosity)], ["foam", foamWord(m.foamN || 0)], ["waveHeight", O ? s.waveHeight : 0], ["cohesion", s.wet ? "wet" : "dry"],
      ];
      chipEl.innerHTML = chips.map(([k, v]) => `<span class="chip${["fireLight", "colorTemp", "contrast", "atmosphere"].includes(k) && m.bright > 0.12 ? " lit" : ""}">${esc(k)} ${esc(v)}</span>`).join(" ") +
        " " + SUITES.filter((su) => suiteFires(su, m, impacts)).map((su) => `<span class="chip suite">suite ${esc(su.label)}</span>`).join(" ");
      proxEl.innerHTML = proximities()
        .map(([txt, x, y, hint]) => {
          const cls = !x ? "wait" : y === x ? "ok" : y ? "ok" : "no";
          const verdict = !x ? `not tested yet. ${hint}` : y === x ? `holds (${y} of ${x})` : y ? `holds ${y} of ${x}` : `doesn’t hold (0 of ${x})`;
          return `<li><span class="${cls}">${y && y < x ? "partly · " : ""}${esc(verdict)}</span> — ${esc(txt)}</li>`;
        })
        .join("");
      traceEl.innerHTML = history
        .slice(-6)
        .reverse()
        .map((r) => `<tr><td>${r.beat}</td><td>${r.element}</td><td>${r.growth}</td><td>${r.fireLight}</td><td>${r.K}K</td><td>${r.contrast}</td><td>${r.atmosphere}</td><td>${r.splash}</td><td>${r.impacts}</td></tr>`)
        .join("");
    }
    function suiteFires(su, m, impacts) {
      if (su.id === "hearth") return s.element === "fire" && s.growth === "steady" && m.fireLight === "flicker" && m.K <= 3200;
      if (su.id === "avalanche") return s.element === "snow" && s.density === "wall" && s.growth === "building" && impacts >= 6;
      return s.element === "smoke" && s.density === "wisp" && s.curl === 3 && m.atmosphere === "beams";
    }

    function render(m, lateFire) {
      /* scene: cool dusk room */
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, "#2b3240");
      sky.addColorStop(1, "#46505e");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      /* window */
      ctx.fillStyle = s.beam ? "#cfd8e6" : "#5a6576";
      ctx.fillRect(14, 6, 34, 24);
      ctx.fillStyle = "#3a3530";
      ctx.fillRect(0, GROUND, W, H - GROUND);
      drawScatter();
      if (G) renderGrain();
      if (L) renderLiquid();
      if (O) renderOcean();
      let fireLayer = null;
      if (F) fireLayer = renderAero(m);
      drawCollider(m);
      if (fireLayer) fireLayer();
      /* fire light on the scene */
      if (m.bright > 0.02) {
        const c = kColor(m.K);
        const a = clamp(m.bright * 0.7 * m.flick, 0, 0.85);
        const g = ctx.createRadialGradient(m.fx, m.fy, 4, m.fx, m.fy, 70 + 120 * Math.min(1.3, m.bright));
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      /* emitter */
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = O ? "rgba(0,0,0,0)" : "#f2c14e";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const er = s.density === "wall" ? s.size * 12 + 16 : 6 + s.size * 3;
      if (s.density === "wall") ctx.ellipse(s.ex, s.ey, er, 6, 0, 0, Math.PI * 2);
      else ctx.arc(s.ex, s.ey, er, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.fillText(`${s.element} · ${s.density} · ${s.growth}`, 56, 14);
    }

    function tick() {
      if (!canvas.isConnected || document.getElementById("studio").classList.contains("hidden")) {
        anim = null;
        return;
      }
      if (!paused) {
        const dt = 1 / 60;
        const emit = (s.rate / 3) * growthMul();
        const meas = { impacts: 0, hits: 0, landings: 0, slides: 0, drops: 0, splash: null, liquidSpeed: 0 };
        if (F) aeroStep(F, s, emit, dt * 6);
        if (L) liquidStep(L, s, emit * 0.6, clock, meas);
        if (O) oceanStep(O, s, dt, meas);
        if (G) grainStep(G, s, emit, meas);
        clock += dt;
        const m = measureNow();
        m.liquidSpeed = meas.liquidSpeed;
        m.foamN = L ? L.foam.length : O ? O.foam.length : 0;
        lastMeasure = m;
        const a = beatAcc;
        a.n++;
        a.bright += m.bright;
        a.smoke += m.smoke + m.air / 7;
        a.contrast += m.contrastF;
        a.impacts += meas.impacts;
        a.hits += meas.hits;
        a.landings += meas.landings;
        a.slides += meas.slides;
        a.drops += meas.drops;
        a.liquidSpeed += meas.liquidSpeed;
        a.foamMax = Math.max(a.foamMax || 0, m.foamN);
        if (meas.splash) a.splash = lastSplash = meas.splash;
        /* settle tracking for drops */
        drops.forEach((d) => {
          if (d.o.hit && d.settledAt == null && clock - d.o.hit > 0.6 && meas.liquidSpeed < 0.35) d.settledAt = clock;
        });
        if (drops.length > 12) drops.shift();
        if (Math.floor(clock / BEAT) !== Math.floor((clock - dt) / BEAT)) finishBeat(m);
        render(m);
        if (frame++ % 10 === 0) updatePanel(m);
      }
      anim = requestAnimationFrame(tick);
    }
    anim = requestAnimationFrame(tick);

    /* ---- performable: follow the automation layer (LFOs, MIDI) ---- */
    const AUTO_IDS = ["element", "density", "growth", "curl", "scatter", "viscosity", "waveHeight"];
    el.querySelectorAll("[data-k]").forEach((x) => {
      if (!AUTO_IDS.includes(x.dataset.k)) return;
      const lab = x.closest("label");
      const b = document.createElement("span");
      b.className = "bif-auto";
      b.dataset.auto4 = x.dataset.k;
      b.textContent = "automated";
      b.hidden = true;
      (lab || x.parentNode).insertBefore(b, x);
    });
    /* splash is performed as a drop: a cue to drip or burst throws something into the water */
    const splashBadge = document.createElement("span");
    splashBadge.className = "bif-auto";
    splashBadge.textContent = "automated";
    splashBadge.hidden = true;
    el.querySelector('[data-act="drop"]').after(splashBadge);
    const hearthBtn = el.querySelector('[data-suite="hearth"]');
    const hearthBadge = document.createElement("span");
    hearthBadge.className = "bif-auto";
    hearthBadge.textContent = "automated";
    hearthBadge.hidden = true;
    hearthBtn.after(hearthBadge);
    let lastSplashCue = "none", hearthOn = false;
    function drive(k, v) {
      if (v == null || v === "") return;
      const x = el.querySelector(`[data-k="${k}"]`);
      if (!x) return;
      if (x.type === "range") {
        const n = clamp(Math.round(Number(v)), Number(x.min), Number(x.max));
        if (Number.isNaN(n) || n === s[k]) return;
        x.value = n;
        x.dispatchEvent(new Event("input"));
      } else {
        if (!CHOICES[k] || !CHOICES[k].includes(String(v)) || s[k] === String(v)) return;
        x.value = String(v);
        x.dispatchEvent(new Event("change"));
      }
    }
    const offAuto = window.CurioAuto
      ? window.CurioAuto.on((type, d) => {
          if (!el.isConnected || !canvas.isConnected) {
            if (offAuto) offAuto();
            return;
          }
          if (type !== "tick" || !d || !d.ms || !d.panels || !d.panels[0]) return;
          const v0 = d.panels[0];
          AUTO_IDS.forEach((k) => {
            const on = d.ms["c:" + k] != null;
            const badge = el.querySelector(`.bif-auto[data-auto4="${k}"]`);
            if (badge && badge.hidden === on) badge.hidden = !on;
            if (!on) return;
            if (k === "waveHeight" && s.element === "water" && s.liquidMode !== "ocean" && Number(v0[k]) > 0) drive("liquidMode", "ocean");
            drive(k, v0[k]);
          });
          const sp = d.ms["c:splash"] != null;
          splashBadge.hidden = !sp;
          if (sp) {
            const cue = String(v0.splash || "none");
            if (cue !== lastSplashCue && (cue === "drip" || cue === "burst")) {
              s.dropSize = cue === "burst" ? "boulder" : "pebble";
              syncControls();
              dropAt(W * (0.3 + Math.random() * 0.4));
            }
            lastSplashCue = cue;
          }
          const hm = d.ms["s:hearth"];
          hearthBadge.hidden = hm == null;
          const now = hm != null && hm >= 0.5;
          if (now && !hearthOn) hearthBtn.click();
          hearthOn = now;
        })
      : null;
    /* expose for tests */
    el._bifrost = { get s() { return s; }, get history() { return history; }, get m() { return lastMeasure; }, drops };
  }

  window.CuriosityStudio.register({
    id: "bifrost",
    label: "Bifrost",
    order: 54,
    maya: "Bifrost Graph: Aero (smoke, fire), liquids, MPM (sand, snow), scattering; emitters, colliders, volume rendering",
    draw,
  });
})();
