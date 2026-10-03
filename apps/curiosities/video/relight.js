/* video/relight.js: the key light. Where the inspiration's main light comes from, and your people lit the same way.
   - Measuring it: on the people's skin (the AI cut-out, faces first), which side is brighter. Each skin pixel gets
     a direction its surface faces (a soft shape blown up from the cut-out: the middle of a face faces the camera,
     its edges face out), and the brightness is fitted against those directions: that gives the light's side
     (left, right, from above), how much brighter the lit side is than the shadow side (key to fill), the light's
     color (the lit side's tint against the shadow side's), and a rim (a bright edge on the shadow side). The set's
     own brightness slope across the frame is kept too.
   - Applying it ("Key light", off unless turned on): your people are shaded again with a simple Lambert term
     (brightness follows how much each spot faces the light), from the inspiration's side, with its contrast and
     tint; your clip's own light is partly taken off first, so a face lit from the left can turn to the right.
     The shading is worked out on the soft shape and blended in by the soft cut-out, so it falls off gently and
     leaves no rim around the people. Skin keeps its own hue (only a little of the light's tint). An optional soft
     rim light on the edges facing away, and the set gets a gentle matching slope.
   Arithmetic only, so Node tests can feed it made-up frames. scan() and draw() need a page.

   window.CurioRelight
   - normals(labels, w, h) -> { nx, ny, nz, person, skin }   the soft shape (Float32Arrays at cut-out size)
   - measure(labels, rgba, w, h) -> { conf, lx, ly, side, ratio, key: [r,g,b], fill: [r,g,b], rim, level, setGx, setGy }
   - series([{ t, m }]) -> a clip's light over time (dissection.light); scan(clip, { box?, onProgress? }) makes it
   - at(p, ta, s) -> { want, have, amount } | null   what to do at one output moment (CurioVideo.at calls it)
   - apply(rgba, W, H, cut, R)   relights one frame in place (cut: { w, h, labels } at any smaller size)
   - draw(ctx, W, H, R, cut);   score(p, before, after) -> the light's side and contrast, before and after */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const V = () => root.CurioVideo;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

  /* ---------- the soft shape ---------- */
  /* Box blur of one plane, radius R, twice (a soft triangle), edges held. */
  function blur(src, w, h, R) {
    R = Math.max(1, Math.round(R));
    let a = src;
    for (let pass = 0; pass < 2; pass++) {
      const tmp = new Float32Array(w * h),
        out = new Float32Array(w * h),
        n = 2 * R + 1;
      for (let y = 0; y < h; y++) {
        const o = y * w;
        let s = 0;
        for (let i = -R; i <= R; i++) s += a[o + clamp(i, 0, w - 1)];
        for (let x = 0; x < w; x++) {
          tmp[o + x] = s / n;
          s += a[o + Math.min(w - 1, x + R + 1)] - a[o + Math.max(0, x - R)];
        }
      }
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let i = -R; i <= R; i++) s += tmp[clamp(i, 0, h - 1) * w + x];
        for (let y = 0; y < h; y++) {
          out[y * w + x] = s / n;
          s += tmp[Math.min(h - 1, y + R + 1) * w + x] - tmp[Math.max(0, y - R) * w + x];
        }
      }
      a = out;
    }
    return a;
  }
  /* How many separate patches of a label (bigger than min pixels): the number of faces. */
  function patches(on, w, h, min) {
    const seen = new Uint8Array(w * h),
      stack = new Int32Array(w * h);
    let count = 0;
    for (let s = 0; s < w * h; s++) {
      if (seen[s] || !on[s]) continue;
      let top = 0,
        n = 0;
      stack[top++] = s;
      seen[s] = 1;
      while (top) {
        const i = stack[--top];
        n++;
        const y = (i / w) | 0,
          x = i - y * w;
        if (x > 0 && !seen[i - 1] && on[i - 1]) (seen[i - 1] = 1), (stack[top++] = i - 1);
        if (x < w - 1 && !seen[i + 1] && on[i + 1]) (seen[i + 1] = 1), (stack[top++] = i + 1);
        if (y > 0 && !seen[i - w] && on[i - w]) (seen[i - w] = 1), (stack[top++] = i - w);
        if (y < h - 1 && !seen[i + w] && on[i + w]) (seen[i + w] = 1), (stack[top++] = i + w);
      }
      if (n >= min) count++;
    }
    return count;
  }
  /* The people blown up like a cushion: a body-sized bump for the whole person and a face-sized one for each
     face, the facing direction from their slopes (steep at the edges, flat in the middle). */
  const TILT = 1.4; /* how far the edges turn away from the camera */
  function normals(labels, w, h) {
    const n = w * h;
    const person = new Float32Array(n),
      face = new Float32Array(n),
      skin = new Float32Array(n);
    let np = 0,
      nf = 0;
    for (let i = 0; i < n; i++) {
      const l = labels[i] & 7;
      if (l >= 1 && l <= 5) (person[i] = 1), np++;
      if (l === 3) (face[i] = 1), nf++;
      if (l === 2 || l === 3) skin[i] = 1;
    }
    const nx = new Float32Array(n),
      ny = new Float32Array(n),
      nz = new Float32Array(n).fill(1);
    if (np < n * 0.002) return { nx, ny, nz, person: blur(person, w, h, 1), raw: person, skin, np, nf };
    /* three sizes of bump: each whole person (a broad roll from the lit side to the shadow side), their body's
       edges, and each face */
    const people = Math.max(1, patches(person, w, h, n * 0.002));
    const Rg = clamp(0.3 * Math.sqrt(np / people), 3, 0.2 * w),
      Rb = clamp(0.12 * Math.sqrt(np / people), 2, 0.08 * w);
    const hg = blur(person, w, h, Rg),
      hb = blur(person, w, h, Rb);
    const faces = nf > 12 ? Math.max(1, patches(face, w, h, 12)) : 0;
    const Rf = faces ? clamp(0.3 * Math.sqrt(nf / faces), 2, 0.1 * w) : 0;
    const hf = faces ? blur(face, w, h, Rf) : null;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          xl = x > 0 ? i - 1 : i,
          xr = x < w - 1 ? i + 1 : i,
          yu = y > 0 ? i - w : i,
          yd = y < h - 1 ? i + w : i;
        const sx = (xr - xl) || 1,
          sy = (yd - yu) / w || 1;
        let gx = ((hg[xr] - hg[xl]) / sx) * 2 * Rg + ((hb[xr] - hb[xl]) / sx) * Rb,
          gy = ((hg[yd] - hg[yu]) / sy) * 2 * Rg + ((hb[yd] - hb[yu]) / sy) * Rb;
        if (hf) {
          /* the face's own bump, on top of the body's (a face is rounder than a torso) */
          gx += ((hf[xr] - hf[xl]) / sx) * 2 * Rf * 0.8;
          gy += ((hf[yd] - hf[yu]) / sy) * 2 * Rf * 0.8;
        }
        gx *= TILT;
        gy *= TILT;
        const L = Math.sqrt(gx * gx + gy * gy + 1);
        nx[i] = -gx / L;
        ny[i] = -gy / L;
        nz[i] = 1 / L;
      }
    return { nx, ny, nz, person: blur(person, w, h, 1), raw: person, skin, np, nf };
  }

  /* ---------- measuring ---------- */
  /* Solve a small least-squares fit (normal equations, Gaussian elimination). */
  function solve(A, b) {
    const n = b.length,
      M = A.map((row, i) => row.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      if (Math.abs(M[c][c]) < 1e-9) return null;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map((row, i) => row[n] / row[i]);
  }
  /* The set's brightness slope: brightness against place in the frame (relative change from the left edge to the
     right edge, and from top to bottom). */
  function setSlope(labels, rgba, w, h) {
    const A = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      b = [0, 0, 0];
    let cnt = 0;
    for (let y = 0; y < h; y += 2)
      for (let x = 0; x < w; x += 2) {
        const i = y * w + x;
        if (labels[i] & 7) continue;
        const Y = luma(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) / 255,
          f = [1, x / w - 0.5, y / h - 0.5];
        for (let r = 0; r < 3; r++) {
          b[r] += f[r] * Y;
          for (let c = 0; c < 3; c++) A[r][c] += f[r] * f[c];
        }
        cnt++;
      }
    if (cnt < 50) return { gx: 0, gy: 0 };
    const s = solve(A, b);
    if (!s || s[0] < 0.02) return { gx: 0, gy: 0 };
    return { gx: r3(clamp(s[1] / s[0], -1.5, 1.5)), gy: r3(clamp(s[2] / s[0], -1.5, 1.5)) };
  }
  const sideOf = (lx, ly) => (Math.abs(lx) >= Math.abs(ly) * 0.8 ? (lx < 0 ? "left" : "right") : ly < 0 ? "top" : "below");
  function measure(labels, rgba, w, h) {
    const S = setSlope(labels, rgba, w, h);
    const none = { conf: 0, lx: 0, ly: 0, side: "none", ratio: 1, key: [1, 1, 1], fill: [1, 1, 1], rim: 0, level: 0, setGx: S.gx, setGy: S.gy };
    const sh = normals(labels, w, h);
    if (sh.np < w * h * 0.002) return none;
    /* skin, well inside (the cut-out's edge mixes in the set), not blown out or black; faces count most */
    const inner = blur(sh.skin, w, h, 1);
    const A = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      b = [0, 0, 0];
    let cnt = 0,
      sw = 0;
    const px = [];
    for (let i = 0; i < w * h; i++) {
      if (!sh.skin[i] || inner[i] < 0.75) continue;
      const R = rgba[i * 4],
        G = rgba[i * 4 + 1],
        B = rgba[i * 4 + 2],
        Y = luma(R, G, B) / 255;
      if (Y < 0.03 || Y > 0.98) continue;
      const wt = (labels[i] & 7) === 3 ? 1 : 0.5;
      const f = [1, sh.nx[i], sh.ny[i]];
      for (let r = 0; r < 3; r++) {
        b[r] += wt * f[r] * Y;
        for (let c = 0; c < 3; c++) A[r][c] += wt * f[r] * f[c];
      }
      cnt++;
      sw += wt;
      px.push(i);
    }
    if (cnt < Math.max(30, w * h * 0.001)) return none;
    const s = solve(A, b);
    if (!s || s[0] < 0.02) return none;
    const mag = Math.hypot(s[1], s[2]);
    const lx = mag > 1e-6 ? s[1] / mag : 0,
      ly = mag > 1e-6 ? s[2] / mag : 0;
    /* lit side against shadow side, along the light's direction */
    const sum = { lit: [0, 0, 0, 0, 0], shd: [0, 0, 0, 0, 0], all: [0, 0, 0, 0, 0], rim: [0, 0], core: [0, 0] };
    const add = (k, i, Y) => {
      const a = sum[k];
      a[0] += rgba[i * 4];
      a[1] += rgba[i * 4 + 1];
      a[2] += rgba[i * 4 + 2];
      a[3] += Y;
      a[4]++;
    };
    px.forEach((i) => {
      const Y = luma(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
      const pr = sh.nx[i] * lx + sh.ny[i] * ly,
        side = Math.hypot(sh.nx[i], sh.ny[i]);
      add("all", i, Y);
      if (pr > 0.2) add("lit", i, Y);
      else if (pr < -0.2) add("shd", i, Y);
      /* rim: the shadow side's outer edge against its inner part */
      if (pr < -0.15) {
        if (side > 0.75) (sum.rim[0] += Y), sum.rim[1]++;
        else if (side < 0.55) (sum.core[0] += Y), sum.core[1]++;
      }
    });
    const mean = (a) => (a[4] ? a[3] / a[4] : 0);
    const level = mean(sum.all) / 255;
    /* key to fill: from the two sides when both have enough skin, else from the fit (brightness at n = +-0.6) */
    let ratio;
    if (sum.lit[4] > 15 && sum.shd[4] > 15) ratio = mean(sum.lit) / Math.max(1, mean(sum.shd));
    else ratio = (s[0] + 0.6 * mag) / Math.max(0.01, s[0] - 0.6 * mag);
    ratio = clamp(ratio, 1, 8);
    /* the light's color: each side's tint (its color over its brightness) against the whole skin's */
    const tint = (a) => {
      if (a[4] < 10 || a[3] < 1) return [1, 1, 1];
      const all = sum.all;
      return [0, 1, 2].map((c) => r3(clamp(a[c] / a[3] / (all[c] / all[3]), 0.85, 1.15)));
    };
    const rim = sum.rim[1] > 10 && sum.core[1] > 10 ? clamp((sum.rim[0] / sum.rim[1] / Math.max(1, sum.core[0] / sum.core[1]) - 1.05) / 0.4, 0, 1) : 0;
    /* how sure: enough skin, and a clear slope (a flat-lit face has no side) */
    const strength = mag / s[0];
    const conf = r3(clamp(cnt / (w * h * 0.01), 0, 1) * clamp(strength / 0.15, 0, 1));
    const side = strength < 0.06 ? "front" : sideOf(lx, ly);
    return { conf, lx: r3(lx), ly: r3(ly), side, ratio: r3(ratio), key: tint(sum.lit), fill: tint(sum.shd), rim: r3(rim), level: r3(level), setGx: S.gx, setGy: S.gy };
  }

  /* ---------- a clip ---------- */
  /* Light over time. Moments with no people take the nearest moment that has them. */
  function series(looks) {
    looks = (looks || []).filter((l) => l && l.m);
    if (!looks.length) return null;
    const times = looks.map((l) => l.t);
    const dt = times.length > 1 ? (times[times.length - 1] - times[0]) / (times.length - 1) : 1;
    const ok = looks.map((l) => l.m.conf > 0.05);
    if (!ok.some(Boolean)) return { times, dt: r3(dt), seen: 0, conf: looks.map(() => 0), setGx: looks.map((l) => l.m.setGx), setGy: looks.map((l) => l.m.setGy) };
    const near = (i) => {
      for (let d = 0; d < looks.length; d++) {
        if (i - d >= 0 && ok[i - d]) return looks[i - d].m;
        if (i + d < looks.length && ok[i + d]) return looks[i + d].m;
      }
      return looks[i].m;
    };
    const raw = looks.map((l, i) => (ok[i] ? l.m : near(i)));
    /* steadier: each look's direction and contrast mixed with its neighbours' (about a second either side), the
       clearer lights counting more, so the light does not swing from look to look; not across a cut (a big jump
       in the set's slope or the light's side) */
    const span = Math.max(1, Math.round(1 / Math.max(0.1, dt)));
    const ms = raw.map((m, i) => {
      let x = 0,
        y = 0,
        r = 0,
        wsum = 0;
      for (let j = Math.max(0, i - span); j <= Math.min(raw.length - 1, i + span); j++) {
        const o = raw[j];
        if (j !== i && Math.hypot(o.setGx - m.setGx, o.setGy - m.setGy) > 0.8) continue;
        const wt = (0.2 + (o.ratio - 1)) * (ok[j] ? 1 : 0.3) * (1 - Math.abs(j - i) / (span + 1));
        x += o.lx * wt;
        y += o.ly * wt;
        r += Math.log(o.ratio) * wt;
        wsum += wt;
      }
      const L = Math.hypot(x, y) || 1;
      const lx = r3(x / L),
        ly = r3(y / L);
      return Object.assign({}, m, { lx, ly, ratio: r3(Math.exp(r / wsum)), side: m.side === "front" ? "front" : sideOf(lx, ly) });
    });
    const get = (k) => ms.map((m) => m[k]);
    return {
      times,
      dt: r3(dt),
      seen: r3(ok.filter(Boolean).length / ok.length),
      conf: looks.map((l) => l.m.conf),
      lx: get("lx"),
      ly: get("ly"),
      ratio: get("ratio"),
      rim: get("rim"),
      level: get("level"),
      key: get("key"),
      fill: get("fill"),
      side: get("side"),
      setGx: looks.map((l) => l.m.setGx),
      setGy: looks.map((l) => l.m.setGy),
    };
  }
  const near = (L, t) => clamp(Math.round((t - L.times[0]) / (L.dt || 1)), 0, L.times.length - 1);
  /* The light at time t: numbers interpolated, the direction kept a unit length, colors from the nearest look. */
  function lightAt(L, t) {
    if (!L || !L.lx || !V()) return null;
    const at = (k) => V().sampleAt(L, L[k], t);
    let lx = at("lx"),
      ly = at("ly");
    const m = Math.hypot(lx, ly) || 1;
    const i = near(L, t);
    return { lx: r3(lx / m), ly: r3(ly / m), ratio: r3(at("ratio")), rim: r3(at("rim")), key: L.key[i], fill: L.fill[i], side: L.side[i], setGx: r3(at("setGx")), setGy: r3(at("setGy")) };
  }
  /* A clip's light, looked at twice a second (at most 60 looks), with the AI cut-out of each look. */
  async function scan(clip, opts) {
    opts = opts || {};
    const M = root.CurioMask;
    if (!M || !(await M.load())) return null;
    const box = opts.box || { x: 0, y: 0, w: clip.width, h: clip.height };
    const W = 320,
      H = Math.max(8, Math.round((W * box.h) / box.w));
    const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const x = c.getContext("2d", { willReadFrequently: true });
    const n = Math.max(2, Math.min(opts.looks || 60, Math.round(clip.duration * 2)));
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(clip.duration - 0.05, ((i + 0.5) * clip.duration) / n);
      await root.CurioClip.seek(clip.video, t);
      x.drawImage(clip.video, box.x, box.y, box.w, box.h, 0, 0, W, H);
      const k = M.cut(c);
      if (k) out.push({ t, m: measure(k.labels, k.rgba, k.w, k.h) });
      if (opts.onProgress && i % 4 === 0) opts.onProgress(i / n);
    }
    return series(out);
  }

  /* ---------- applying ---------- */
  function at(p, ta, s) {
    const amt = p.on.relight || 0;
    if (!(amt > 0)) return null;
    const want = lightAt(p.insp.light, ta);
    if (!want) return null;
    return { amount: amt, want, have: lightAt(p.target.light, s) };
  }
  /* The light as a 3D direction (x right, y down, z toward the camera). A hard light sits more to the side. */
  function dir3(l) {
    const hard = clamp((l.ratio - 1) / 3, 0, 1);
    const lz = 0.6 - 0.3 * hard,
      k = Math.sqrt(1 - lz * lz);
    return [l.lx * k, l.ly * k, lz];
  }
  /* The fill (how bright the shadow side stays, 0..1) that gives a key-to-fill ratio on a round face. */
  const fillFor = (ratio) => clamp(0.55 / (Math.max(1, ratio) - 1 + 0.55), 0.12, 1);
  const WRAP = 0.3; /* light wraps a little past the edge: soft falloff, no hard terminator */
  const lam = (d) => Math.max(0, (d + WRAP) / (1 + WRAP));
  /* Shading for one light: fill + (1 - fill) x Lambert, divided by its average over a round face (so the lit
     side gets brighter and the shadow side darker, and the face as a whole stays about as bright). */
  function shader(l) {
    const L = dir3(l),
      fill = fillFor(l.ratio);
    let s = 0,
      c = 0;
    for (let y = -1; y <= 1; y += 0.1)
      for (let x = -1; x <= 1; x += 0.1) {
        const r2 = x * x + y * y;
        if (r2 > 1) continue;
        s += fill + (1 - fill) * lam(x * L[0] + y * L[1] + Math.sqrt(1 - r2) * L[2]);
        c++;
      }
    const avg = s / c;
    return (nx, ny, nz) => (fill + (1 - fill) * lam(nx * L[0] + ny * L[1] + nz * L[2])) / avg;
  }
  /* Bilinear stretch of a cut-out-sized plane to W x H. */
  function upsample(m, w, h, W, H) {
    if (w === W && h === H) return m;
    const o = new Float32Array(W * H);
    for (let Y = 0; Y < H; Y++) {
      const fy = clamp(((Y + 0.5) * h) / H - 0.5, 0, h - 1),
        y0 = Math.floor(fy),
        y1 = Math.min(h - 1, y0 + 1),
        ty = fy - y0;
      for (let X = 0; X < W; X++) {
        const fx = clamp(((X + 0.5) * w) / W - 0.5, 0, w - 1),
          x0 = Math.floor(fx),
          x1 = Math.min(w - 1, x0 + 1),
          tx = fx - x0;
        o[Y * W + X] = (m[y0 * w + x0] * (1 - tx) + m[y0 * w + x1] * tx) * (1 - ty) + (m[y1 * w + x0] * (1 - tx) + m[y1 * w + x1] * tx) * ty;
      }
    }
    return o;
  }
  /* Brightened highlights roll off toward white instead of clipping flat (what was already bright stays as it was). */
  const soft = (v, o) => {
    const b = Math.max(210, o);
    return v <= b || b >= 254 ? v : b + (v - b) / (1 + (v - b) / (255 - b));
  };
  const UNDO = 0.8; /* how much of your clip's own light is taken off first */
  /* The inspiration's contrast is played up a little (1.4 times, in stops) at full amount: the shape is rough and
     eyes, brows and hair blur the measure, so a face measured at 2 to 1 is usually lit harder than that. */
  const PUSH = 1.4;
  function apply(d, W, H, cut, R) {
    if (!R || !(R.amount > 0) || !R.want || !cut || !cut.labels) return false;
    const { w, h, labels } = cut,
      a = clamp(R.amount, 0, 1),
      want = R.want,
      have = R.have && R.have.lx != null ? R.have : null;
    const sh = normals(labels, w, h);
    const newS = shader(Object.assign({}, want, { ratio: Math.pow(Math.max(1, want.ratio), PUSH) })),
      oldS = have ? shader(have) : null;
    const rimS = clamp(want.rim || 0, 0, 1) * a;
    const L = dir3(want);
    /* planes at cut-out size: the people's brightness change, three color gains, the rim */
    const n = w * h,
      gain = new Float32Array(n),
      cr = new Float32Array(n),
      cg = new Float32Array(n),
      cb = new Float32Array(n),
      rim = new Float32Array(n),
      setG = new Float32Array(n);
    const key = want.key || [1, 1, 1],
      fl = want.fill || [1, 1, 1];
    /* the set: the inspiration's slope less part of your own, or a little of the key's side when it has none */
    const hasSet = want.setGx || want.setGy;
    const sgx = (hasSet ? want.setGx - (have ? have.setGx * 0.5 : 0) : 0.3 * want.lx * (1 - fillFor(want.ratio))) * 0.6,
      sgy = (hasSet ? want.setGy - (have ? have.setGy * 0.5 : 0) : 0.3 * want.ly * (1 - fillFor(want.ratio))) * 0.6;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          nx = sh.nx[i],
          ny = sh.ny[i],
          nz = sh.nz[i];
        let g = newS(nx, ny, nz);
        if (oldS) g /= Math.pow(oldS(nx, ny, nz), UNDO);
        gain[i] = Math.pow(clamp(g, 0.2, 2.6), a);
        /* tint: half of the key's color on the lit side and of the fill's in the shadow, less on skin */
        const t = lam(nx * L[0] + ny * L[1] + nz * L[2]),
          k = a * 0.5 * (1 - 0.6 * sh.skin[i]);
        cr[i] = 1 + (fl[0] + (key[0] - fl[0]) * t - 1) * k;
        cg[i] = 1 + (fl[1] + (key[1] - fl[1]) * t - 1) * k;
        cb[i] = 1 + (fl[2] + (key[2] - fl[2]) * t - 1) * k;
        /* rim: the edges turned away from the key, brightest where they turn most */
        if (rimS > 0) {
          const away = Math.max(0, -(nx * L[0] + ny * L[1])) / Math.max(0.2, Math.hypot(L[0], L[1]));
          rim[i] = rimS * Math.pow(1 - nz, 1.5) * away;
        }
        setG[i] = clamp(Math.exp(a * (sgx * (x / w - 0.5) + sgy * (y / h - 0.5))), 0.6, 1.6);
      }
    /* the cut-out's people, a little softer, so the change fades in over their edge; the fade sits just inside
       the edge, so the set around them is never lit by the people's change (no glow around a face) */
    const m = blur(sh.raw, w, h, Math.max(1, Math.round(w / 320)));
    for (let i = 0; i < n; i++) {
      const u = clamp((m[i] - 0.62) / 0.38, 0, 1);
      m[i] = u * u * (3 - 2 * u);
    }
    const U = (p) => upsample(p, w, h, W, H);
    const M = U(m),
      G = U(gain),
      CR = U(cr),
      CG = U(cg),
      CB = U(cb),
      RM = rimS > 0 ? U(rim) : null,
      SG = U(setG);
    for (let i = 0; i < W * H; i++) {
      const p = i * 4,
        mm = M[i],
        gs = SG[i];
      const gp = G[i];
      const gr = gs * (1 - mm) + gp * CR[i] * mm,
        gg = gs * (1 - mm) + gp * CG[i] * mm,
        gb = gs * (1 - mm) + gp * CB[i] * mm;
      let r = d[p] * gr,
        g = d[p + 1] * gg,
        b = d[p + 2] * gb;
      if (RM && RM[i] > 0.002) {
        const e = RM[i] * mm * 140;
        r += e * key[0] * (1 - r / 255);
        g += e * key[1] * (1 - g / 255);
        b += e * key[2] * (1 - b / 255);
      }
      d[p] = soft(r, d[p]);
      d[p + 1] = soft(g, d[p + 1]);
      d[p + 2] = soft(b, d[p + 2]);
    }
    return true;
  }
  /* In the page: relight the canvas, with the frame's cut-out (made before the light changed). */
  function draw(ctx, W, H, R, cut) {
    if (!R || !cut) return false;
    const img = ctx.getImageData(0, 0, W, H);
    if (!apply(img.data, W, H, cut, R)) return false;
    ctx.putImageData(img, 0, 0);
    return true;
  }

  /* ---------- checks ---------- */
  /* Where the light comes from, before and after, against the inspiration: the gap in direction (0 = the same
     side, 2 = the opposite side) and in contrast, with a plain sentence. */
  function score(p, before, after) {
    const A = p.insp.light,
      B = before.light,
      F = after.light;
    if (!A || !A.lx) return { feature: "relight", note: "the inspiration has no faces to read its light from" };
    if (!F || !F.lx) return { feature: "relight", note: "no faces found in the changed clip to measure" };
    const srcAt = (t) => p.src[clamp(Math.round(t * p.fps), 0, p.src.length - 1)];
    const gaps = (get) => {
      let d = 0,
        c = 0,
        n = 0;
      F.times.forEach((t, i) => {
        const w = lightAt(A, p.tA(t, p.duration)),
          x = get(t, i);
        if (!w || !x) return;
        d += Math.hypot(w.lx - x.lx, w.ly - x.ly);
        c += Math.abs(Math.log(w.ratio / x.ratio));
        n++;
      });
      return n ? { dir: r3(d / n), contrast: r3(c / n) } : null;
    };
    const bt = B && B.lx ? gaps((t) => lightAt(B, srcAt(t))) : null,
      af = gaps((t, i) => lightAt(F, F.times[i]));
    const med = (L) => {
      const s = L.side.slice().sort(),
        cnt = {};
      s.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
      return Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])[0];
    };
    const mr = (L) => r3(L.ratio.slice().sort((x, y) => x - y)[Math.floor(L.ratio.length / 2)]);
    const note = `light from the ${med(A)} (contrast ${mr(A).toFixed(1)}): yours ${B && B.lx ? `from the ${med(B)} (${mr(B).toFixed(1)})` : "unknown"} → from the ${med(F)} (${mr(F).toFixed(1)})`;
    return { feature: "relight", note, gapBefore: bt ? bt.dir : null, gapAfter: af ? af.dir : null, contrastBefore: bt ? bt.contrast : null, contrastAfter: af ? af.contrast : null };
  }

  /* The group it adds to CurioVideo.GROUPS (off unless turned on). */
  const GROUPS = [
    { id: "relight", label: "Key light", curiosities: ["lightingLens"], check: "relight", needs: "light", off: true, plain: "Finds where the inspiration's main light comes from (which side of the faces is brighter), how dark its shadow side is, and the light's color, then lights your people again the same way: the lit side brighter, the shadow side darker, a little of its color, a soft rim on the edges when it has one, and a gentle matching slope on the set. Off unless you turn it on." },
  ];
  if (V() && V().GROUPS && !V().GROUPS.some((g) => g.id === "relight")) V().GROUPS.push(...GROUPS);

  root.CurioRelight = { normals, measure, series, lightAt, scan, at, shader, apply, draw, score, GROUPS };
})();
