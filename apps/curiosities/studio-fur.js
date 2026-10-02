/* Fur & hair: a groom lab. A few hundred to 1500 strands grow from a scalp curve on a head, an
   animal's back or a mane. Groom modifiers follow XGen Interactive Groom (length, density, clumping,
   frizz/noise, curl, cut, comb). The look follows Arnold Standard Hair (melanin, pheomelanin redness,
   roughness as a highlight band along each strand, a back light that makes the edge glow). Each strand
   is a short Verlet chain, like nHair: gravity, stiffness, wind and the body moving. The tool measures
   the fur lag (phase delay of the tips behind the driver, in beats) and the settle time after the body
   stops, and logs one row per beat so the proximities are counted, not assumed. One beat = 0.25 s. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-fur-v1";
  const BEAT = 0.25;
  const W = 480, H = 300;
  const DEFAULTS = {
    form: "head", furLength: "medium", count: 700, clump: "fine", frizz: 1, curl: 0, cut: 0, comb: 0,
    melanin: 0.45, red: 0.25, shine: "sheen", rim: "off", wetness: "dry",
    wind: 0, gravity: 1, stiffness: 0.5, sway: false,
  };
  const CHOICES = {
    form: ["head", "animal back", "mane"],
    furLength: ["short", "medium", "long"],
    clump: ["fine", "tufted", "matted"],
    shine: ["dull", "sheen", "glossy"],
    rim: ["off", "thin", "strong"],
    wetness: ["dry", "damp", "soaked"],
  };
  const SUITES = [
    { id: "drenched", label: "Drenched", note: "clump matted, hairShine glossy, furResponse the body", set: { wetness: "soaked", clump: "matted", shine: "glossy", wind: 0, sway: true }, check: (m) => m.clump === "matted" && m.hairShine === "glossy" && m.furResponse === "the body" },
    { id: "backlit", label: "Backlit fluff", note: "frizz 4, rim strong, hairShine sheen", set: { frizz: 4, rim: "strong", shine: "sheen", wetness: "dry", clump: "fine" }, check: (m) => m.frizz === 4 && m.rim === "strong" && m.hairShine === "sheen" },
    { id: "windblown", label: "Windblown", note: "furResponse wind, frizz 3, furLag 1", set: { wind: 3, frizz: 3, sway: false, stiffness: 0, gravity: 0.6, furLength: "long", wetness: "dry" }, check: (m) => m.furResponse === "wind" && m.frizz === 3 && m.furLag === 1 },
  ];
  const PROX = [
    { id: "soak-mat", when: "wetness is soaked", then: "clumping goes matted", within: 1, x: (r) => r.wet === "soaked", y: (r) => r.clump === "matted" },
    { id: "rim-glow", when: "rim light is strong", then: "the fur edge glows", within: 0, x: (r) => r.rim === "strong", y: (r) => r.glow },
    { id: "stop-settle", when: "the character stops", then: "fur settles", within: 2, x: (r, p) => p && p.moving && !r.moving, y: (r) => r.still, edge: true },
    { id: "wind-lag", when: "windForce rises", then: "fur lags behind the body", within: 1, x: (r, p) => p && r.wind > p.wind, y: (r) => r.lagging, edge: true },
  ];

  /* Module-level so a suite click or a redraw keeps the simulation and the beat log running. */
  let s = null;
  let sim = null;
  let log = [];
  let timer = null;
  const clock = { t: 0, beatT: 0, shakeT: -10, drag: null, bx: 0, by: 0, rot: 0, pbx: 0, prot: 0 };
  const meas = { clumpAmt: 0.15, glow: 0, lagSec: 0, lagBeats: 0, settleBeats: null, stopAt: null, moving: false, movingS: 0, tipSpeed: 0, trail: 0, visible: 1, driver: [], resp: [], hist: [], lastMoving: -99, lastWind: -99 };

  function rnd(seed) {
    let x = seed >>> 0 || 1;
    return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* The scalp: root positions and normals for each form, plus the pivot the body turns about. */
  function scalp(form, u) {
    if (form === "head") {
      const cx = W * 0.5, cy = H * 0.36, r = H * 0.17;
      const a = -Math.PI + 0.15 + u * (Math.PI - 0.3);
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a), droop: 0.95 };
    }
    if (form === "animal back") {
      const x = W * 0.08 + u * W * 0.84;
      const y = H * 0.62 - Math.sin(u * Math.PI) * H * 0.18;
      const dy = -Math.cos(u * Math.PI) * Math.PI * H * 0.18 / (W * 0.84);
      const l = Math.hypot(1, dy);
      return { x, y, nx: dy / l, ny: -1 / l, droop: 0.12 };
    }
    const x = W * 0.3 + u * W * 0.32;
    const y = H * 0.12 + u * u * H * 0.5;
    const tx = W * 0.32, ty = 2 * u * H * 0.5;
    const l = Math.hypot(tx, ty);
    return { x, y, nx: ty / l, ny: -tx / l, droop: 0.9 };
  }
  function pivot(form) {
    if (form === "head") return { x: W * 0.5, y: H * 0.5 };
    if (form === "animal back") return { x: W * 0.5, y: H * 0.8 };
    return { x: W * 0.5, y: H * 0.85 };
  }

  const LEN = { short: [4, 18], medium: [6, 44], long: [9, 92] };

  function build() {
    const [S, L] = LEN[s.furLength];
    const N = s.count;
    const r = rnd(7 + N);
    const roots = new Float32Array(N * 2);
    const rest = new Float32Array(N * S * 2);
    const seg = new Float32Array(N);
    const u = new Float32Array(N);
    const stray = new Float32Array(N);
    const restDX = new Float32Array(N);
    const restDY = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const ui = (i + r()) / N;
      u[i] = ui;
      const p = scalp(s.form, ui);
      const inset = r() * 5;
      roots[i * 2] = p.x - p.nx * inset;
      roots[i * 2 + 1] = p.y - p.ny * inset;
      const isStray = r() < s.frizz * 0.04;
      stray[i] = isStray ? 1 : r() * 0.3;
      seg[i] = (L * (0.75 + r() * 0.35) * (isStray ? 1.25 : 1)) / S;
      let a0 = Math.atan2(p.ny, p.nx) + s.comb * 0.9;
      const phase = r() * 6.28;
      for (let k = 0; k < S; k++) {
        const t = (k + 1) / S;
        const down = Math.PI / 2;
        let d = down - a0;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        let a = a0 + d * p.droop * Math.sqrt(t);
        a += s.curl * 0.38 * Math.sin(k * 1.9 + phase);
        a += (r() - 0.5) * s.frizz * (isStray ? 0.5 : 0.12);
        rest[(i * S + k) * 2] = Math.cos(a);
        rest[(i * S + k) * 2 + 1] = Math.sin(a);
        restDX[i] += Math.cos(a) * seg[i];
        restDY[i] += Math.sin(a) * seg[i];
      }
    }
    const nn = N * (S + 1);
    const keep = sim && sim.N === N && sim.S === S && sim.form === s.form;
    const px = keep ? sim.px : new Float32Array(nn), py = keep ? sim.py : new Float32Array(nn), ox = keep ? sim.ox : new Float32Array(nn), oy = keep ? sim.oy : new Float32Array(nn);
    sim = { N, S, L, roots, rest, seg, u, stray, restDX, restDY, px, py, ox, oy, form: s.form, key: s.form + s.furLength + N + s.frizz + s.curl + s.comb };
    pose(!keep);
  }

  /* Body transform: a turn about the pivot plus an offset. */
  function bodyXY(x, y) {
    const pv = pivot(sim.form);
    const c = Math.cos(clock.rot), sn = Math.sin(clock.rot);
    const dx = x - pv.x, dy = y - pv.y;
    return [pv.x + clock.bx + dx * c - dy * sn, pv.y + clock.by + dx * sn + dy * c];
  }

  function pose(reset) {
    const { N, S, roots, rest, seg, px, py, ox, oy } = sim;
    const c = Math.cos(clock.rot), sn = Math.sin(clock.rot);
    for (let i = 0; i < N; i++) {
      const [rx, ry] = bodyXY(roots[i * 2], roots[i * 2 + 1]);
      const b = i * (S + 1);
      px[b] = rx; py[b] = ry; ox[b] = rx; oy[b] = ry;
      if (!reset) continue;
      let x = rx, y = ry;
      for (let k = 0; k < S; k++) {
        const dx = rest[(i * S + k) * 2], dy = rest[(i * S + k) * 2 + 1];
        x += (dx * c - dy * sn) * seg[i];
        y += (dx * sn + dy * c) * seg[i];
        px[b + k + 1] = ox[b + k + 1] = x;
        py[b + k + 1] = oy[b + k + 1] = y;
      }
    }
  }

  const WET = { dry: { w: 1, damp: 0, clump: 0, shine: 0 }, damp: { w: 1.35, damp: 0.01, clump: 0.6, shine: 1 }, soaked: { w: 1.9, damp: 0.025, clump: 0.92, shine: 2 } };
  const CLUMP = { fine: 0.15, tufted: 0.6, matted: 0.92 };
  const RIM = { off: 0, thin: 0.5, strong: 1 };

  function gust(t, x) {
    return 0.6 + 0.25 * Math.sin(t * 2.3 + x * 0.012) + 0.3 * Math.sin(t * 6.1 + x * 0.03);
  }

  /* Body motion: a shake/turn burst, a steady sway, or the pointer drag. */
  function moveBody(dt) {
    clock.pbx = clock.bx; clock.prot = clock.rot;
    const ts = clock.t - clock.shakeT;
    let bx = 0, rot = 0;
    if (s.sway) {
      bx += Math.sin(clock.t * 2 * Math.PI * 0.6) * 22;
      rot += Math.sin(clock.t * 2 * Math.PI * 0.6) * 0.08;
    }
    if (ts >= 0 && ts < 1.6) {
      const env = Math.sin((ts / 1.6) * Math.PI);
      rot += Math.sin(ts * 2 * Math.PI * 2.2) * 0.28 * env;
      bx += Math.sin(ts * 2 * Math.PI * 1.1) * 18 * env;
    }
    if (clock.drag) {
      clock.bx += (clock.drag.x - clock.bx) * Math.min(1, dt * 20);
      clock.by += (clock.drag.y - clock.by) * Math.min(1, dt * 20);
    } else {
      clock.bx += (bx - clock.bx) * Math.min(1, dt * 30);
      clock.by += (0 - clock.by) * Math.min(1, dt * 6);
    }
    clock.rot = rot;
  }

  function step(dt) {
    const { N, S, rest, seg, px, py, ox, oy } = sim;
    const wet = WET[s.wetness];
    const g = 520 * s.gravity * wet.w;
    const windA = (s.wind * 520) / wet.w;
    const damp = 0.975 - wet.damp;
    const c = Math.cos(clock.rot), sn = Math.sin(clock.rot);
    const stiffBase = (0.02 + 0.25 * s.stiffness) / Math.sqrt(wet.w);
    const dt2 = dt * dt;
    pose(false);
    for (let i = 0; i < N; i++) {
      const b = i * (S + 1);
      const gx = s.wind ? windA * gust(clock.t, px[b]) : 0;
      for (let k = 1; k <= S; k++) {
        const j = b + k;
        const vx = (px[j] - ox[j]) * damp, vy = (py[j] - oy[j]) * damp;
        ox[j] = px[j]; oy[j] = py[j];
        const lift = s.wind ? Math.sin(clock.t * 5 + i * 0.7 + k) * windA * 0.15 * (k / S) : 0;
        px[j] += vx + gx * (0.4 + 0.6 * k / S) * dt2;
        py[j] += vy + (g + lift) * dt2;
      }
      for (let k = 1; k <= S; k++) {
        const j = b + k;
        const dx = rest[(i * S + k - 1) * 2], dy = rest[(i * S + k - 1) * 2 + 1];
        const tx = px[j - 1] + (dx * c - dy * sn) * seg[i];
        const ty = py[j - 1] + (dx * sn + dy * c) * seg[i];
        const st = stiffBase * (1 - 0.55 * (k / S));
        px[j] += (tx - px[j]) * st;
        py[j] += (ty - py[j]) * st;
        const ex = px[j] - px[j - 1], ey = py[j] - py[j - 1];
        const l = Math.hypot(ex, ey) || 1;
        const f = seg[i] / l;
        const nx = px[j - 1] + ex * f, ny = py[j - 1] + ey * f;
        ox[j] += (nx - px[j]) * 0.6;
        oy[j] += (ny - py[j]) * 0.6;
        px[j] = nx; py[j] = ny;
      }
    }
  }

  /* Hair color from melanin (eumelanin) and redness (pheomelanin), Arnold Standard Hair style. */
  function hairRGB() {
    const m = s.melanin;
    const blond = [236, 206, 150], brown = [104, 66, 38], black = [22, 17, 14];
    let col = m < 0.5 ? blond.map((v, i) => v + (brown[i] - v) * (m / 0.5)) : brown.map((v, i) => v + (black[i] - v) * ((m - 0.5) / 0.5));
    const ginger = [196, 82, 30].map((v) => v * (1 - m * 0.65));
    col = col.map((v, i) => v + (ginger[i] - v) * s.red * 0.75);
    if (s.wetness !== "dry") col = col.map((v) => v * (s.wetness === "soaked" ? 0.72 : 0.86));
    return col;
  }
  function shineLevel() {
    return Math.min(2, CHOICES.shine.indexOf(s.shine) + WET[s.wetness].shine * 0.5 + (s.wetness === "soaked" ? 0.5 : 0));
  }

  function render(ctx) {
    const { N, S, px, py, u, stray } = sim;
    const rim = RIM[s.rim];
    ctx.fillStyle = rim ? `rgb(${Math.round(250 - 70 * rim)},${Math.round(244 - 74 * rim)},${Math.round(232 - 70 * rim)})` : "#fffaf2";
    ctx.fillRect(0, 0, W, H);
    if (rim) {
      const gr = ctx.createRadialGradient(W * 0.5, H * 0.3, 10, W * 0.5, H * 0.3, W * 0.45);
      gr.addColorStop(0, `rgba(255,236,190,${0.55 * rim})`);
      gr.addColorStop(1, "rgba(255,236,190,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }
    // body
    ctx.save();
    const pv = pivot(sim.form);
    ctx.translate(pv.x + clock.bx, pv.y + clock.by);
    ctx.rotate(clock.rot);
    ctx.translate(-pv.x, -pv.y);
    ctx.fillStyle = sim.form === "head" ? "#e2b48f" : "#8c6a4f";
    ctx.strokeStyle = "#1c1712";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (sim.form === "head") {
      ctx.rect(W * 0.46, H * 0.48, W * 0.08, H * 0.2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.37, H * 0.165, H * 0.2, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1c1712";
      ctx.fillRect(W * 0.46, H * 0.38, 4, 4);
      ctx.fillRect(W * 0.53, H * 0.38, 4, 4);
      ctx.fillRect(W * 0.495, H * 0.46, 8, 2);
    } else if (sim.form === "animal back") {
      ctx.moveTo(W * 0.04, H);
      for (let i = 0; i <= 20; i++) { const p = scalp(sim.form, i / 20); ctx.lineTo(p.x, p.y); }
      ctx.lineTo(W * 0.96, H);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.moveTo(W * 0.24, H);
      for (let i = 0; i <= 20; i++) { const p = scalp(sim.form, i / 20); ctx.lineTo(p.x + 6, p.y + 4); }
      ctx.lineTo(W * 0.62, H * 0.62);
      ctx.lineTo(W * 0.8, H);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(W * 0.22, H * 0.15, 40, 22, -0.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    if (rim) {
      ctx.strokeStyle = `rgba(255,240,205,${0.7 * rim})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // strands: clump toward a guide, cut to a line, shade with a Kajiya-Kay highlight band.
    const amt = meas.clumpAmt;
    const word = clumpWord(amt);
    const groupSize = word === "fine" ? 6 : word === "tufted" ? 18 : 45;
    const G = Math.max(1, Math.round(N / groupSize));
    const cutY = s.cut ? (sim.form === "animal back" ? H * (0.62 - 0.18) - (1 - s.cut) * 60 : H * (0.18 + (1 - s.cut) * 0.82)) : null;
    const base = hairRGB();
    const sh = shineLevel();
    const expo = [3, 16, 60][Math.round(sh)] || 16;
    const specI = [0.12, 0.45, 0.85][Math.round(sh)] * (sh % 1 ? 1.1 : 1);
    const L3 = [-0.45, -0.75, 0.48];
    const hx = L3[0], hy = L3[1], hz = L3[2] + 1;
    const hl = Math.hypot(hx, hy, hz);
    const Hx = hx / hl, Hy = hy / hl;
    const buckets = [];
    for (let q = 0; q < 15; q++) buckets.push([]);
    const glowPts = [];
    let drawn = 0, total = 0;
    const tmpx = new Float32Array(S + 1), tmpy = new Float32Array(S + 1);
    for (let i = 0; i < N; i++) {
      const b = i * (S + 1);
      const gi = Math.min(N - 1, Math.floor((Math.floor(u[i] * G) + 0.5) / G * N));
      const gb = gi * (S + 1);
      const own = stray[i] > 0.9 ? 0.2 : 1;
      for (let k = 0; k <= S; k++) {
        const w = amt * own * Math.pow(k / S, 0.8);
        tmpx[k] = px[b + k] + (px[gb + k] + (px[b] - px[gb]) * 0.15 - px[b + k]) * w;
        tmpy[k] = py[b + k] + (py[gb + k] + (py[b] - py[gb]) * 0.15 - py[b + k]) * w;
      }
      let last = S;
      if (cutY != null) {
        for (let k = 1; k <= S; k++) {
          const beyond = sim.form === "animal back" ? tmpy[k] < cutY : tmpy[k] > cutY;
          if (beyond) { last = k - 1; break; }
        }
      }
      total += S; drawn += last;
      for (let k = 0; k < last; k++) {
        const dx = tmpx[k + 1] - tmpx[k], dy = tmpy[k + 1] - tmpy[k];
        const l = Math.hypot(dx, dy) || 1;
        const d = (dx * Hx + dy * Hy) / l;
        const spec = Math.pow(Math.max(0, 1 - d * d), expo / 2) * specI;
        const diff = k / S < 0.34 ? 0 : k / S < 0.67 ? 1 : 2;
        const sq = Math.min(4, Math.floor(spec * 5));
        buckets[diff * 5 + sq].push(tmpx[k], tmpy[k], tmpx[k + 1], tmpy[k + 1]);
      }
      if (last >= S - 1 && last > 1) {
        const k0 = Math.max(1, Math.floor(last * 0.55));
        for (let k = k0; k < last; k++) glowPts.push(tmpx[k], tmpy[k], tmpx[k + 1], tmpy[k + 1]);
      }
    }
    meas.visible = total ? drawn / total : 1;
    ctx.lineCap = "round";
    ctx.lineWidth = s.wetness === "soaked" ? 1.3 : 1;
    for (let q = 0; q < 15; q++) {
      const arr = buckets[q];
      if (!arr.length) continue;
      const diff = [0.55, 0.8, 1][Math.floor(q / 5)];
      const spec = (q % 5) / 4;
      const col = base.map((v) => Math.round(clamp(v * diff + (255 - v * diff) * spec * 0.75, 0, 255)));
      ctx.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.beginPath();
      for (let n = 0; n < arr.length; n += 4) { ctx.moveTo(arr[n], arr[n + 1]); ctx.lineTo(arr[n + 2], arr[n + 3]); }
      ctx.stroke();
    }
    if (meas.glow > 0.02 && glowPts.length) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, meas.glow * 0.8);
      ctx.strokeStyle = "rgb(255,214,150)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let n = 0; n < glowPts.length; n += 4) { ctx.moveTo(glowPts[n], glowPts[n + 1]); ctx.lineTo(glowPts[n + 2], glowPts[n + 3]); }
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#1c1712";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText(`${N} strands · ${S} segments · beat ${log.length ? log[log.length - 1].beat : 0}`, 8, 16);
    if (cutY != null) {
      ctx.strokeStyle = "rgba(196,92,38,0.6)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, cutY); ctx.lineTo(W, cutY); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function clumpWord(a) {
    return a < 0.35 ? "fine" : a < 0.8 ? "tufted" : "matted";
  }

  /* Measurements: clumping ramp (water soaks in slower on long hair), edge glow, lag by
     cross-correlation of tips against the driver, settle time after the body stops. */
  function measure(dt) {
    const wet = WET[s.wetness];
    const target = Math.max(CLUMP[s.clump], wet.clump);
    const lenF = CHOICES.furLength.indexOf(s.furLength);
    const k = target > meas.clumpAmt ? [18, 8, 3.2][lenF] : 3 / (1 + lenF);
    meas.clumpAmt += (target - meas.clumpAmt) * Math.min(1, k * dt);
    const strayness = clamp(0.25 + s.frizz * 0.12 + (1 - meas.clumpAmt) * 0.35 - (s.wetness === "soaked" ? 0.25 : s.wetness === "damp" ? 0.1 : 0) - (1 - meas.visible) * 0.2, 0, 1);
    meas.glow = RIM[s.rim] * strayness * (s.shine === "dull" ? 0.85 : 1);

    const { N, S, px, py, ox, oy } = sim;
    let tipX = 0, rootX = 0, sp = 0, restX = 0, gsum = 0;
    const stepN = Math.max(1, Math.floor(N / 150));
    let n = 0;
    for (let i = 0; i < N; i += stepN) {
      const b = i * (S + 1), t = b + S;
      gsum += gust(clock.t, px[b]); tipX += px[t]; rootX += px[b]; restX += sim.restDX[i] * Math.cos(clock.rot) - sim.restDY[i] * Math.sin(clock.rot);
      const vx = (px[t] - ox[t]) - (px[b] - ox[b]);
      const vy = (py[t] - oy[t]) - (py[b] - oy[b]);
      sp += Math.hypot(vx, vy);
      n++;
    }
    tipX /= n; rootX /= n; restX /= n;
    meas.tipSpeed = sp / n / dt;
    const bodySpeed = (Math.abs(clock.bx - clock.pbx) + Math.abs(clock.rot - clock.prot) * 120) / dt;
    meas.movingS += ((bodySpeed > 12 ? 1 : 0) - meas.movingS) * Math.min(1, dt * 8);
    const wasMoving = meas.moving;
    meas.moving = meas.movingS > 0.5;
    if (meas.moving) meas.lastMoving = clock.t;
    if (s.wind > 0) meas.lastWind = clock.t;
    if (wasMoving && !meas.moving) { meas.stopAt = clock.t; meas.settleBeats = null; }
    if (meas.stopAt != null && meas.tipSpeed < 14) {
      meas.settleBeats = Math.ceil((clock.t - meas.stopAt) / BEAT);
      meas.stopAt = null;
    }
    // how far the tips trail downwind of the groomed rest shape, against the strand length
    meas.trail = (tipX - rootX - restX) / sim.L;

    const bodyX = clock.bx + clock.rot * 120;
    const recentBody = clock.t - meas.lastMoving < 1.5;
    meas.driver.push(recentBody ? bodyX : s.wind * gsum / n);
    meas.resp.push(tipX - rootX - restX);
    meas.hist.push(recentBody ? 1 : s.wind > 0 ? 2 : 0);
    if (meas.driver.length > 180) { meas.driver.shift(); meas.resp.shift(); meas.hist.shift(); }
  }

  function computeLag() {
    const d = meas.driver, r = meas.resp, n = d.length;
    const mode = meas.hist[n - 1];
    if (n < 90 || !mode) { meas.lagSec = 0; return; }
    let md = 0, mr = 0;
    for (let i = 0; i < n; i++) { md += d[i]; mr += r[i]; }
    md /= n; mr /= n;
    let vd = 0;
    for (let i = 0; i < n; i++) vd += (d[i] - md) ** 2;
    if (vd / n < (mode === 1 ? 4 : 0.02)) { meas.lagSec = 0; return; }
    let best = -Infinity, bestL = 0;
    for (let L = 0; L <= 48; L += 1) {
      let c = 0, cd = 0, cr = 0;
      for (let i = 0; i + L < n; i++) {
        const a = d[i] - md, b = r[i + L] - mr;
        c += a * b; cd += a * a; cr += b * b;
      }
      const v = c / Math.sqrt(cd * cr || 1);
      if (v > best + 1e-4) { best = v; bestL = L; }
    }
    meas.lagSec = best > 0.3 ? bestL / 60 : 0;
    meas.corr = best;
  }

  function current() {
    const lagBeats = Math.round(meas.lagSec / BEAT);
    const body = clock.t - meas.lastMoving < 1.5;
    const wind = s.wind > 0;
    const effLen = sim.L * meas.visible;
    const shineW = CHOICES.shine[Math.round(shineLevel())];
    return {
      furLength: effLen < 26 ? "short" : effLen < 60 ? "medium" : "long",
      clump: clumpWord(meas.clumpAmt),
      frizz: s.frizz,
      melanin: s.melanin,
      hairColor: s.melanin < 0.35 ? "light" : s.melanin < 0.7 ? "medium" : "dark",
      hairShine: shineW,
      furResponse: body && wind ? "both" : body ? "the body" : wind ? "wind" : "nothing",
      furLag: clamp(Math.max(lagBeats, wind && meas.trail > 0.1 ? 1 : 0), 0, 4),
      settleTime: meas.settleBeats == null ? null : clamp(meas.settleBeats, 0, 4),
      wetness: s.wetness,
      rim: s.rim,
      windForce: s.wind,
      glow: meas.glow >= 0.35,
    };
  }

  function logBeat() {
    const m = current();
    const prev = log[log.length - 1];
    log.push({
      beat: prev ? prev.beat + 1 : 1,
      wet: s.wetness, clump: m.clump, rim: s.rim, glow: m.glow,
      moving: meas.moving, still: !meas.moving && meas.tipSpeed < 14,
      wind: s.wind, lagging: m.furLag >= 1, m,
    });
    if (log.length > 64) log.shift();
  }

  function proxStatus(p) {
    let seen = 0, held = 0, waiting = 0, lastFail = null;
    for (let i = 0; i < log.length; i++) {
      const r = log[i], pr = log[i - 1];
      const on = p.edge ? p.x(r, pr) : p.x(r) && !(pr && p.x(pr));
      if (!on || (!pr && !p.edge)) continue;
      if (i + p.within >= log.length) { waiting++; continue; }
      seen++;
      let ok = false;
      for (let j = i; j <= i + p.within; j++) if (p.y(log[j])) { ok = true; break; }
      if (ok) held++; else lastFail = r.beat;
    }
    return { seen, held, waiting, lastFail };
  }

  function draw(el, api) {
    const esc = api.esc;
    const st = api.store(KEY);
    if (!s) s = Object.assign({}, DEFAULTS, st.get({}));
    if (timer) cancelAnimationFrame(timer);
    if (!sim || sim.key !== s.form + s.furLength + s.count + s.frizz + s.curl + s.comb) build();
    if (!document.getElementById("studio-fur")) {
      const style = document.createElement("style");
      style.id = "studio-fur";
      style.textContent = `
        .fur-nodes fieldset { border: 1px solid var(--line, #ddd); margin: 0 0 10px; padding: 6px 8px; min-width: 0; }
        .fur-nodes legend { font-family: var(--mono, monospace); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
        .fur-nodes input[type=range] { width: 100%; }
        #fur-canvas { touch-action: none; cursor: grab; }
        .fur-prox { margin: 6px 0; font-size: 13px; }
        .fur-prox b.ok { color: #2f6b3a; } .fur-prox b.no { color: #b23a1e; } .fur-prox b.wait { color: #8a7a60; }
        .fur-table { width: 100%; }
        .fur-table td { word-break: break-word; }
        .fur-auto { margin-left: 6px; font-size: 10px; padding: 1px 4px; }
      `;
      document.head.appendChild(style);
    }
    const sel = (k, label) =>
      `<label class="field">${esc(label)}<select data-k="${k}">${CHOICES[k].map((v) => `<option ${s[k] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
    const rng = (k, label, min, max, stp) =>
      `<label class="field">${esc(label)}: <span data-v="${k}">${s[k]}</span><input type="range" min="${min}" max="${max}" step="${stp || 1}" data-k="${k}" value="${s[k]}"></label>`;
    el.innerHTML = `<div class="studio-grid">
      <div class="fur-nodes">
        <fieldset><legend>Interactive Groom</legend>
          ${sel("form", "Groom on")}
          ${sel("furLength", "Length")}
          ${rng("count", "Density (strands)", 200, 1500, 50)}
          ${sel("clump", "Clumping")}
          ${rng("frizz", "Frizz / noise", 0, 5)}
          ${rng("curl", "Curl", 0, 5)}
          ${rng("cut", "Cut line (0 = off)", 0, 1, 0.05)}
          ${rng("comb", "Comb direction", -1, 1, 0.1)}
        </fieldset>
        <fieldset><legend>Standard Hair</legend>
          ${rng("melanin", "Melanin", 0, 1, 0.05)}
          ${rng("red", "Redness (pheomelanin)", 0, 1, 0.05)}
          ${sel("shine", "Roughness / shine")}
          ${sel("rim", "Back light rim")}
          ${sel("wetness", "Wet")}
        </fieldset>
        <fieldset><legend>nHair dynamics</legend>
          ${rng("wind", "Wind", 0, 5)}
          ${rng("gravity", "Gravity", 0, 2, 0.1)}
          ${rng("stiffness", "Stiffness", 0, 1, 0.05)}
          <label class="field"><input type="checkbox" data-k="sway" ${s.sway ? "checked" : ""}> Body sways (steady)</label>
        </fieldset>
      </div>
      <div>
        <canvas width="${W}" height="${H}" id="fur-canvas" aria-label="Groom lab: drag the body to move it"></canvas>
        <div class="bar-actions" style="margin-top:6px">
          <button type="button" data-act="shake">Shake / turn</button>
          <button type="button" data-act="combout">Comb out (rest)</button>
          <span class="cap">Drag the canvas to move the body.</span>
        </div>
        <p class="cap">Suites, one click:</p>
        <div class="bar-actions">${SUITES.map((x) => `<button type="button" data-suite="${x.id}" title="${esc(x.note)}">${esc(x.label)}</button>`).join("")}</div>
        <p id="fur-chips"></p>
        <p class="cap">Click a chip to automate it, or open Automate.</p>
        <div id="fur-prox"></div>
        <table class="trace fur-table"><thead><tr><th>Measured</th><th>Now</th><th>How</th></tr></thead><tbody id="fur-table"></tbody></table>
        <div class="bar-actions" style="margin-top:8px">
          <button type="button" data-act="keep">Keep on Shelf</button>
          <button type="button" data-act="board">Send to board</button>
        </div>
        <p class="cap">One beat is 0.25 s. Fur lag is the delay that best lines up the strand tips with the driver (the body when it moved in the last 1.5 s, else the wind gust), found by cross-correlation and rounded to beats; tips pushed downwind by more than 10% of their length also count as at least 1 beat behind. Settle time counts beats from the body stopping until the tips go still. Water soaks long hair slower, so soaked hair can take more than a beat to mat. The fur ids are not board controls; the board gets envMotion, characterPath and characterSpeed.</p>
      </div></div>`;

    function syncControls() {
      el.querySelectorAll("[data-k]").forEach((x) => {
        const k = x.dataset.k;
        if (x.type === "checkbox") x.checked = !!s[k];
        else x.value = s[k];
        const v = el.querySelector(`[data-v="${k}"]`);
        if (v) v.textContent = s[k];
      });
    }
    function changed() {
      st.set(s);
      if (sim.key !== s.form + s.furLength + s.count + s.frizz + s.curl + s.comb) {
        build();
      }
    }
    el.querySelectorAll("[data-k]").forEach((x) => {
      const k = x.dataset.k;
      x.addEventListener(x.type === "range" ? "input" : "change", () => {
        s[k] = x.type === "checkbox" ? x.checked : x.type === "range" ? Number(x.value) : x.value;
        const v = el.querySelector(`[data-v="${k}"]`);
        if (v) v.textContent = s[k];
        changed();
      });
    });
    el.querySelectorAll("[data-suite]").forEach((b) =>
      b.addEventListener("click", () => {
        const su = SUITES.find((x) => x.id === b.dataset.suite);
        Object.assign(s, su.set);
        syncControls();
        changed();
      })
    );
    el.querySelector('[data-act="shake"]').addEventListener("click", () => (clock.shakeT = clock.t));
    el.querySelector('[data-act="combout"]').addEventListener("click", () => {
      pose(true);
    });
    const canvas = el.querySelector("#fur-canvas");
    const ctx = canvas.getContext("2d");
    function toLocal(e) {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    canvas.addEventListener("pointerdown", (e) => {
      const p = toLocal(e);
      clock.drag = { x: clock.bx, y: clock.by, sx: p.x - clock.bx, sy: p.y - clock.by };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!clock.drag) return;
      const p = toLocal(e);
      clock.drag.x = clamp(p.x - clock.drag.sx, -W * 0.3, W * 0.3);
      clock.drag.y = clamp(p.y - clock.drag.sy, -H * 0.2, H * 0.2);
    });
    const endDrag = () => (clock.drag = null);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    function values(n) {
      const rows = log.slice(-n);
      const pick = (f) => rows.map((r) => f(r.m));
      return {
        furLength: pick((m) => m.furLength),
        clump: pick((m) => m.clump),
        frizz: pick((m) => m.frizz),
        hairColor: pick((m) => m.hairColor),
        hairShine: pick((m) => m.hairShine),
        furResponse: pick((m) => m.furResponse),
        furLag: pick((m) => m.furLag),
        wetness: pick((m) => m.wetness),
        rim: pick((m) => m.rim),
        windForce: pick((m) => m.windForce),
      };
    }
    el.querySelector('[data-act="keep"]').addEventListener("click", () => {
      if (!log.length) logBeat();
      const v = values(16);
      const settle = log.slice(-16).map((r) => r.m.settleTime);
      if (settle.some((x) => x != null)) v.settleTime = settle.map((x) => (x == null ? 0 : x));
      api.toShelf(`Fur · ${s.form}, ${current().clump}, ${s.wetness}`, v);
    });
    el.querySelector('[data-act="board"]').addEventListener("click", () => {
      const live = (id) => typeof CURIOSITIES !== "undefined" && CURIOSITIES.some((c) => c.id === id && c.live);
      if (!log.length) logBeat();
      const rows = [];
      for (let p = 0; p < 4; p++) rows.push(log[Math.max(0, log.length - 1 - Math.round(((3 - p) * (Math.min(log.length, 16) - 1)) / 3))]);
      const out = {};
      if (live("envMotion")) out.envMotion = rows.map((r) => (r.wind > 0 ? "wind" : "still"));
      if (live("characterPath")) out.characterPath = rows.map((r) => (r.moving ? (s.sway ? "circle" : "cross") : "still"));
      if (live("characterSpeed")) out.characterSpeed = rows.map((r) => (r.moving ? clamp(2 + Math.round(r.m.furLag + (s.sway ? 1 : 2)), 1, 5) : 1));
      api.toBoard(`Fur: ${s.form}, ${current().furResponse}`, out);
    });

    const chipEl = el.querySelector("#fur-chips");
    const proxEl = el.querySelector("#fur-prox");
    const tableEl = el.querySelector("#fur-table");
    function panel() {
      const m = current();
      const lit = SUITES.filter((x) => x.check(m)).map((x) => x.label);
      chipEl.innerHTML = [
        `furLength ${m.furLength}`, `clump ${m.clump}`, `frizz ${m.frizz}`, `hairColor ${m.hairColor} (melanin ${m.melanin.toFixed(2)})`,
        `hairShine ${m.hairShine}`, `furResponse ${m.furResponse}`, `furLag ${m.furLag}`, `wetness ${m.wetness}`, `rim ${m.rim}`, `windForce ${m.windForce}`,
        `settleTime ${m.settleTime == null ? "—" : m.settleTime}`,
      ].map((x) => `<span class="chip">${esc(x)}</span>`).join(" ") +
        SUITES.map((x) => ` <span class="chip suite${lit.includes(x.label) ? " lit" : ""}">${esc(x.label)}</span>`).join("");
      proxEl.innerHTML = PROX.map((p) => {
        const r = proxStatus(p);
        const word = r.seen === 0 ? `<b class="wait">not tested yet</b>${r.waiting ? " (watching)" : ""}` : r.held === r.seen ? `<b class="ok">holds</b>` : `<b class="no">doesn’t hold</b>`;
        return `<p class="fur-prox">When ${esc(p.when)}, ${esc(p.then)} (within ${p.within} beat${p.within === 1 ? "" : "s"}): ${word} <span class="cap">${r.held}/${r.seen} in the last ${log.length} beats${r.lastFail ? `, missed at beat ${r.lastFail}` : ""}</span></p>`;
      }).join("");
      tableEl.innerHTML = [
        ["clump", `${m.clump} (${meas.clumpAmt.toFixed(2)})`, "groom, raised by water"],
        ["edge glow", `${meas.glow.toFixed(2)} ${m.glow ? "glows" : "no"}`, "rim × stray fibres"],
        ["furLag", `${(meas.lagSec / BEAT).toFixed(2)} beats`, "cross-correlation"],
        ["tips trail", `${(meas.trail * 100).toFixed(0)}% of length`, "tip shift vs rest"],
        ["tip speed", `${meas.tipSpeed.toFixed(0)} px/s`, meas.moving ? "body moving" : "body still"],
        ["settleTime", m.settleTime == null ? "—" : `${m.settleTime} beats`, "stop → tips still"],
      ].map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("");
    }

    let last = null, frameN = 0;
    function tick(now) {
      if (!canvas.isConnected) { timer = null; return; }
      const dt = last == null ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const sub = 2;
      for (let q = 0; q < sub; q++) {
        clock.t += dt / sub;
        moveBody(dt / sub);
        step(dt / sub);
      }
      measure(dt);
      render(ctx);
      clock.beatT += dt;
      if (clock.beatT >= BEAT) { clock.beatT -= BEAT; logBeat(); }
      if (frameN++ % 10 === 0) { computeLag(); panel(); }
      timer = requestAnimationFrame(tick);
    }
    panel();
    listen(el, api, syncControls, changed);
    timer = requestAnimationFrame(tick);
  }

  /* ---------- automation: performable through CurioAuto (LFOs, MIDI straps) ---------- */
  const MEL = { light: 0.2, medium: 0.5, dark: 0.85 };
  const choice = (k) => (v) => (CHOICES[k].includes(v) ? v : null);
  const num = (lo, hi) => (v) => (v === "" || v == null || isNaN(Number(v)) ? null : clamp(Math.round(Number(v)), lo, hi));
  const AUTO = {
    furLength: { k: "furLength", to: choice("furLength") },
    clump: { k: "clump", to: choice("clump") },
    frizz: { k: "frizz", to: num(0, 5) },
    hairColor: { k: "melanin", to: (v) => (v in MEL ? MEL[v] : isNaN(Number(v)) ? null : clamp(Number(v), 0, 1)) },
    hairShine: { k: "shine", to: choice("shine") },
    wetness: { k: "wetness", to: choice("wetness") },
    rim: { k: "rim", to: choice("rim") },
    windForce: { k: "wind", to: num(0, 5) },
  };
  /* Catalog suites that touch fur, plus this tool's own presets if they are ever added to the catalog. */
  const AUTO_SUITES = {
    drenched: SUITES[0].set, backlit: SUITES[1].set, windblown: SUITES[2].set,
    "wet-night": { wetness: "soaked", shine: "glossy" },
    storm: { wind: 5, frizz: 4, sway: false },
    "golden-hour": { rim: "strong" },
  };
  let autoOff = null, autoEl = null, autoSync = null, autoChanged = null;
  const suiteOn = {};
  let lastTrig = {};

  function badge(host, k, on) {
    const input = host.querySelector(`[data-k="${k}"]`);
    const label = input && input.closest("label");
    if (!label) return;
    let b = label.querySelector(".fur-auto");
    if (!b && on) {
      b = document.createElement("span");
      b.className = "chip lit fur-auto";
      b.textContent = "automated";
      label.insertBefore(b, label.firstChild.nextSibling);
    }
    if (b) b.hidden = !on;
  }

  function listen(el, api, sync, changed) {
    autoEl = el; autoSync = sync; autoChanged = changed;
    if (autoOff || !window.CurioAuto || !window.CurioAuto.on) return;
    autoOff = window.CurioAuto.on((type, d) => {
      const host = autoEl;
      if (!host || !host.isConnected || !host.querySelector("#fur-canvas")) {
        if (autoOff) autoOff();
        autoOff = null;
        return;
      }
      if (type !== "tick" || !d || !d.ms || !d.panels || !d.panels[0]) return;
      const v0 = d.panels[0];
      let dirty = false;
      Object.entries(AUTO).forEach(([id, m]) => {
        const on = d.ms["c:" + id] != null;
        badge(host, m.k, on);
        if (!on) return;
        const v = m.to(v0[id]);
        if (v == null || s[m.k] === v) return;
        s[m.k] = v;
        dirty = true;
        const input = host.querySelector(`[data-k="${m.k}"]`);
        if (input) input.value = v;
        const lab = host.querySelector(`[data-v="${m.k}"]`);
        if (lab) lab.textContent = v;
      });
      /* A rising gesture or rising impacts shakes / turns the body. */
      ["gesture", "impacts"].forEach((id) => {
        if (d.ms["c:" + id] == null) { lastTrig[id] = null; return; }
        const raw = v0[id];
        const dom = window.CurioAuto.PARAMS && window.CurioAuto.PARAMS.find((p) => p.key === "c:" + id);
        const n = isNaN(Number(raw)) ? (dom && dom.domain && dom.domain.options ? dom.domain.options.indexOf(raw) : 0) : Number(raw);
        if (lastTrig[id] != null && n > lastTrig[id]) clock.shakeT = clock.t;
        lastTrig[id] = n;
      });
      /* Suite presets apply once as they turn on. */
      Object.entries(AUTO_SUITES).forEach(([sid, set]) => {
        const m = d.ms["s:" + sid];
        const now = m != null && m >= 0.5;
        if (now && !suiteOn[sid]) { Object.assign(s, set); autoSync(); dirty = true; }
        suiteOn[sid] = now;
      });
      if (dirty) autoChanged();
    });
  }

  window.CuriosityStudio.register({ id: "fur", label: "Fur & hair", order: 52, maya: "XGen Interactive Groom (length, clumping, noise/frizz, curl, cut), nHair dynamics, Arnold Standard Hair (melanin, roughness, specular)", draw });
})();
