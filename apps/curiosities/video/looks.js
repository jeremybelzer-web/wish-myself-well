/* video/looks.js: three curiosities about how the picture itself looks, measured from the inspiration over time
   and applied to another clip, each its own switch with an amount:
   - Borrowed palette: the inspiration's color grade. Each color (red, green, blue) of your frame is remapped so
     its darks, mids and lights land where the inspiration's are (quantile matching), moment by moment; the
     brightness moves half way. Skin keeps most of its own hue, so faces don't turn blue or green.
   - Grain and softness: how grainy (noise in the flat parts) and how sharp (the edges' fine detail) the
     inspiration is; your clip is softened or sharpened to match, then grain is added.
   - Frame shape: the inspiration's picture shape (bars, or a tall or wide frame) and how dark its edges are
     (vignette); your clip gets the same bars and edge darkening.
   Pixel arithmetic only, so Node tests can feed it made-up frames. scan() and draw() need a page.

   window.CurioLooks
   - measure(rgba, w, h, bars?) -> { q: { r, g, b }, grain, sharp, sharpK, grainK, vig, bars, aspect }   one frame
   - barsOf(rgba, w, h) -> { top, bottom, left, right } (shares of the frame) | null (a black frame)
   - series([{ t, m }]) -> a clip's looks over time (dissection.looks); scan(clip, { looks?, onProgress? }) makes it
   - at(plan, ta, s) -> { palette?, texture?, shape? }   what to do at one output moment (CurioVideo.at calls it)
   - palette(rgba, w, h, want, amount, have?), texture(rgba, w, h, k, scale), grain(rgba, w, h, sigma, seed, cell),
     shape(rgba, w, h, shape): the changes, RGBA in place
   - draw(ctx, W, H, looks, stage, t)   stage "color" (after light) or "finish" (last, before subtitles)
   - score(plan, feature, before, after) */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const V = () => root.CurioVideo;
  const LOOK_W = 320; /* grain and sharpness are measured with the picture this wide */
  const QS = [0.02, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 0.98];
  const KS = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]; /* soften (below 0) to sharpen (above 0) */
  const NOBARS = { top: 0, bottom: 0, left: 0, right: 0 };
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

  /* ---------- frame shape ---------- */
  /* Black bars: rows (columns) at the edges that are dark all the way across. Bars thinner than 1.5% are noise. */
  function barsOf(d, w, h) {
    const dark = (x0, y0, dx, dy, n) => {
      let s = 0,
        mx = 0;
      for (let i = 0, x = x0, y = y0; i < n; i++, x += dx, y += dy) {
        const p = (y * w + x) * 4,
          v = luma(d[p], d[p + 1], d[p + 2]);
        s += v;
        if (v > mx) mx = v;
      }
      return s / n < 14 && mx < 40;
    };
    let t = 0,
      b = 0,
      l = 0,
      r = 0;
    while (t < h && dark(0, t, 1, 0, w)) t++;
    while (b < h - t && dark(0, h - 1 - b, 1, 0, w)) b++;
    while (l < w && dark(l, t, 0, 1, Math.max(1, h - t - b))) l++;
    while (r < w - l && dark(w - 1 - r, t, 0, 1, Math.max(1, h - t - b))) r++;
    if (h - t - b < h * 0.2 || w - l - r < w * 0.2) return null;
    const f = (n, of) => (n / of < 0.015 ? 0 : r3(n / of));
    return { top: f(t, h), bottom: f(b, h), left: f(l, w), right: f(r, w) };
  }

  /* ---------- planes ---------- */
  /* Box blur of one plane, radius R (whole pixels), edges held. */
  function box(src, w, h, R) {
    if (R < 1) return src;
    const tmp = new Float32Array(w * h),
      out = new Float32Array(w * h);
    const n = 2 * R + 1;
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let s = 0;
      for (let i = -R; i <= R; i++) s += src[o + clamp(i, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        tmp[o + x] = s / n;
        s += src[o + Math.min(w - 1, x + R + 1)] - src[o + Math.max(0, x - R)];
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
    return out;
  }
  /* Soften (k < 0: a blur up to 4 pixels of a LOOK_W-wide picture) or sharpen (k > 0: unsharp mask) one plane.
     scale = picture width / LOOK_W, so the same k looks the same at any size. */
  function texPlane(src, w, h, k, scale) {
    if (Math.abs(k) < 0.01) return src;
    const out = new Float32Array(w * h);
    if (k < 0) {
      const L = 4 * -k * scale,
        R0 = Math.floor(L),
        f = L - R0;
      const a = box(src, w, h, R0),
        b = box(src, w, h, R0 + 1);
      for (let i = 0; i < out.length; i++) out[i] = a[i] * (1 - f) + b[i] * f;
    } else {
      const b = box(src, w, h, Math.max(1, Math.round(scale)));
      for (let i = 0; i < out.length; i++) out[i] = src[i] + 2.5 * k * (src[i] - b[i]);
    }
    return out;
  }
  function nth(arr, p) {
    const s = Float32Array.from(arr).sort();
    return s.length ? s[clamp(Math.floor(p * (s.length - 1)), 0, s.length - 1)] : 0;
  }
  /* Grain: the noise left in the flat parts (Immerkaer's estimate over the calmest 30% of the picture). Sharpness:
     at the strongest edges, how much of the rise happens in one step. */
  function texStats(Y, w, h) {
    if (w < 8 || h < 8) return { grain: 0, sharp: 0 };
    const n = (w - 2) * (h - 2);
    const lap = new Float32Array(n),
      grad = new Float32Array(n);
    for (let y = 1, i = 0; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++, i++) {
        const o = y * w + x;
        const a = Y[o - w - 1],
          b = Y[o - w],
          c = Y[o - w + 1],
          d = Y[o - 1],
          e = Y[o],
          f = Y[o + 1],
          g = Y[o + w - 1],
          hh = Y[o + w],
          k = Y[o + w + 1];
        lap[i] = Math.abs(a - 2 * b + c - 2 * d + 4 * e - 2 * f + g - 2 * hh + k);
        grad[i] = Math.abs(c + 2 * f + k - a - 2 * d - g) + Math.abs(g + 2 * hh + k - a - 2 * b - c);
      }
    const calm = nth(grad, 0.3);
    let sl = 0,
      cl = 0;
    for (let i = 0; i < n; i++)
      if (grad[i] <= calm) {
        sl += lap[i];
        cl++;
      }
    const grain = cl ? (Math.sqrt(Math.PI / 2) / 6) * (sl / cl) : 0;
    /* sharpness: squared one-pixel slopes against squared slopes over six pixels, where the latter are strongest
       (a crisp edge rises in one step, a soft one spreads the same rise over many) */
    const s1 = [],
      s3 = [];
    for (let y = 3; y < h - 3; y++)
      for (let x = 3; x < w - 3; x++) {
        const o = y * w + x;
        s1.push((Y[o + 1] - Y[o - 1]) ** 2 + (Y[o + w] - Y[o - w]) ** 2);
        s3.push((Y[o + 3] - Y[o - 3]) ** 2 + (Y[o + 3 * w] - Y[o - 3 * w]) ** 2);
      }
    const edge = Math.max(0.03 * 0.03, nth(s3, 0.9));
    let sf = 0,
      sc = 0;
    for (let i = 0; i < s3.length; i++)
      if (s3[i] >= edge) {
        sf += s1[i];
        sc += s3[i];
      }
    return { grain: Math.round(grain * 1e5) / 1e5, sharp: sc ? r3(sf / sc) : 0 };
  }

  /* ---------- vignette ---------- */
  /* How much darker the edges are than the middle: 1 - edge / middle (0 = even, 0.5 = edges half as bright). */
  const rad = (x, y, w, h) => Math.hypot(((x + 0.5) / w) * 2 - 1, ((y + 0.5) / h) * 2 - 1);
  function vigOf(Y, w, h) {
    let se = 0,
      ne = 0,
      sc = 0,
      nc = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const r = rad(x, y, w, h);
        if (r > 0.95) {
          se += Y[y * w + x];
          ne++;
        } else if (r < 0.5) {
          sc += Y[y * w + x];
          nc++;
        }
      }
    return ne && nc && sc > 0.001 ? r3(1 - se / ne / (sc / nc)) : 0;
  }
  /* The darkening drawn for vignette amount a: 1 - a at the corners' side, nothing in the middle. */
  const vigFall = (r) => {
    const x = clamp((r - 0.45) / 0.85, 0, 1);
    return x * x * (3 - 2 * x);
  };
  /* For an even picture, the edge and middle shares of that darkening (so a can be solved in closed form). */
  let vigE = null;
  function vigShares() {
    if (vigE) return vigE;
    let se = 0,
      ne = 0,
      sc = 0,
      nc = 0;
    for (let y = 0; y < 72; y++)
      for (let x = 0; x < 128; x++) {
        const r = rad(x, y, 128, 72);
        if (r > 0.95) (se += vigFall(r)), ne++;
        else if (r < 0.5) (sc += vigFall(r)), nc++;
      }
    return (vigE = { edge: se / ne, mid: sc / nc });
  }
  /* The amount that takes a clip whose edges are vHave darker to vWant (only ever darker). */
  function vigAmount(vWant, vHave) {
    const rho = (1 - vWant) / Math.max(0.05, 1 - vHave);
    if (rho >= 1) return 0;
    const s = vigShares();
    return r3(clamp((1 - rho) / (s.edge - rho * s.mid), 0, 0.9));
  }

  /* ---------- one frame ---------- */
  function quantiles(d, w, h, step, bars) {
    bars = bars || NOBARS;
    const x0 = Math.round(bars.left * w),
      x1 = w - Math.round(bars.right * w),
      y0 = Math.round(bars.top * h),
      y1 = h - Math.round(bars.bottom * h);
    const hr = new Uint32Array(256),
      hg = new Uint32Array(256),
      hb = new Uint32Array(256);
    let n = 0;
    step = Math.max(1, step || 1);
    for (let y = y0; y < y1; y += step)
      for (let x = x0; x < x1; x += step) {
        const p = (y * w + x) * 4;
        hr[d[p]]++;
        hg[d[p + 1]]++;
        hb[d[p + 2]]++;
        n++;
      }
    const q = (hist) => {
      const out = [];
      let c = 0,
        k = 0;
      for (let v = 0; v < 256 && k < QS.length; v++) {
        c += hist[v];
        while (k < QS.length && c >= QS[k] * n) {
          out.push(r3((v + 0.5) / 256));
          k++;
        }
      }
      while (out.length < QS.length) out.push(1);
      return out;
    };
    return { r: q(hr), g: q(hg), b: q(hb) };
  }
  function measure(d, w, h, bars) {
    bars = bars || barsOf(d, w, h) || NOBARS;
    const x0 = Math.round(bars.left * w),
      y0 = Math.round(bars.top * h);
    const pw = Math.max(1, w - x0 - Math.round(bars.right * w)),
      ph = Math.max(1, h - y0 - Math.round(bars.bottom * h));
    const Y = new Float32Array(pw * ph);
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const p = ((y + y0) * w + x + x0) * 4;
        Y[y * pw + x] = luma(d[p], d[p + 1], d[p + 2]) / 255;
      }
    const sc = pw / LOOK_W;
    const t = texStats(Y, pw, ph);
    const K = KS.map((k) => (k ? texStats(texPlane(Y, pw, ph, k, sc), pw, ph) : t));
    return { q: quantiles(d, w, h, 1, bars), grain: t.grain, sharp: t.sharp, sharpK: K.map((x) => x.sharp), grainK: K.map((x) => x.grain), vig: vigOf(Y, pw, ph), bars, aspect: r3(pw / ph), frame: r3(w / h) };
  }

  /* ---------- a clip ---------- */
  function median(a) {
    const s = a.slice().sort((x, y) => x - y);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  }
  /* Looks over time. The bars are the clip's whole picture (widened over every look, so a dark scene's black
     top is not a bar). */
  function series(looks) {
    looks = (looks || []).filter((l) => l && l.m);
    if (!looks.length) return null;
    const times = looks.map((l) => l.t);
    const dt = times.length > 1 ? (times[times.length - 1] - times[0]) / (times.length - 1) : 1;
    const seen = looks.filter((l) => l.m.bars);
    const bars = {};
    Object.keys(NOBARS).forEach((k) => (bars[k] = seen.length ? Math.min(...seen.map((l) => l.m.bars[k])) : 0));
    const frame = looks[0].m.frame || 16 / 9;
    const aspect = r3((frame * (1 - bars.left - bars.right)) / Math.max(0.05, 1 - bars.top - bars.bottom));
    const get = (k) => looks.map((l) => l.m[k]);
    return { times, dt: r3(dt), q: get("q"), grain: get("grain"), sharp: get("sharp"), sharpK: get("sharpK"), grainK: get("grainK"), vig: get("vig"), vigMid: r3(median(get("vig"))), bars, aspect, frame };
  }
  /* A clip's looks at time t: one number, or a list (each entry interpolated), or { r, g, b } lists. */
  function lkAt(L, key, t, i) {
    const arr = L[key];
    const pick = i == null ? arr : arr.map((x) => x[i]);
    return V().sampleAt(L, pick, t);
  }
  function qAt(L, t) {
    const out = {};
    ["r", "g", "b"].forEach((c) => (out[c] = QS.map((_, i) => r3(V().sampleAt(L, L.q.map((x) => x[c][i]), t)))));
    return out;
  }
  /* Which k (soften to sharpen) brings a clip with this sharpness curve to sharpness s: the crossing nearest no
     change, or the closest value when none crosses. */
  function kFor(curve, s) {
    let best = null;
    for (let i = 0; i + 1 < KS.length; i++) {
      const a = curve[i],
        b = curve[i + 1];
      if ((s - a) * (s - b) <= 0 && a !== b) {
        const k = KS[i] + ((s - a) / (b - a)) * (KS[i + 1] - KS[i]);
        if (best == null || Math.abs(k) < Math.abs(best)) best = k;
      }
    }
    if (best != null) return best;
    let j = 0;
    curve.forEach((v, i) => Math.abs(v - s) < Math.abs(curve[j] - s) && (j = i));
    return KS[j];
  }
  const curveAt = (curve, k) => {
    const x = clamp((k + 1) * 4, 0, KS.length - 1),
      i = Math.min(KS.length - 2, Math.floor(x));
    return curve[i] + (curve[i + 1] - curve[i]) * (x - i);
  };

  /* ---------- applying ---------- */
  function at(p, ta, s) {
    const A = p.insp.looks,
      B = p.target.looks,
      on = p.on;
    if (!A || !V()) return null;
    const out = {};
    if (on.palette) out.palette = { q: qAt(A, ta), amount: on.palette };
    if (on.grain && B) {
      const want = lkAt(A, "sharp", ta),
        curve = KS.map((_, i) => lkAt(B, "sharpK", s, i)),
        noise = KS.map((_, i) => lkAt(B, "grainK", s, i));
      const k = clamp(kFor(curve, want), -1, 1) * on.grain;
      const g = lkAt(A, "grain", ta),
        have = curveAt(noise, k);
      out.texture = { k: r3(k), grain: r3(Math.sqrt(Math.max(0, g * g - have * have)) * on.grain * 1000) / 1000, amount: on.grain };
    }
    if (on.shape) {
      /* the picture's window follows your people (where skin is, over the second around), centered once bars are on */
      const T = p.target,
        near = (T.times || []).map((t, i) => (Math.abs(t - s) <= 1 && T.raw.skin[i] > 0.004 ? i : -1)).filter((i) => i >= 0);
      const avg = (k) => (near.length ? r3(near.reduce((a, i) => a + T.raw[k][i], 0) / near.length) : 0.5);
      out.shape = { aspect: A.aspect, vignette: r3(vigAmount(A.vigMid, B ? B.vigMid : 0) * on.shape), amount: on.shape, cx: T.raw && T.raw.skinX ? avg("skinX") : 0.5, cy: T.raw && T.raw.skinY ? avg("skinY") : 0.5 };
    }
    return Object.keys(out).length ? out : null;
  }

  /* One color's curve from have's quantiles to want's: straight between them, its steepness held to 1/5..5 (no
     banding), the ends carried on. A 256-entry table, mixed with no change by amount. */
  function curve(have, want, amount) {
    const xs = [0],
      ys = [clamp(want[0] - have[0], 0, 1)];
    /* quantiles that land on the same value (a flat grey wall) make one knot, at the middle of theirs */
    for (let i = 0; i < have.length; ) {
      let j = i;
      while (j + 1 < have.length && have[j + 1] - have[i] < 0.004) j++;
      const x = have[i],
        y = want.slice(i, j + 1).reduce((a, b) => a + b, 0) / (j - i + 1);
      if (x > xs[xs.length - 1] + 0.004 && x < 0.996) {
        xs.push(x);
        ys.push(y);
      }
      i = j + 1;
    }
    xs.push(1);
    ys.push(clamp(want[want.length - 1] + (1 - have[have.length - 1]), 0, 1));
    for (let i = 1; i < xs.length; i++) {
      const dx = xs[i] - xs[i - 1];
      ys[i] = clamp(ys[i], ys[i - 1] + dx * 0.2, ys[i - 1] + dx * 5);
    }
    const lut = new Float32Array(256);
    for (let v = 0, j = 0; v < 256; v++) {
      const x = v / 255;
      while (j < xs.length - 2 && x > xs[j + 1]) j++;
      const y = ys[j] + ((ys[j + 1] - ys[j]) * (x - xs[j])) / Math.max(1e-6, xs[j + 1] - xs[j]);
      lut[v] = clamp(v + (clamp(y, 0, 1) * 255 - v) * amount, 0, 255);
    }
    return lut;
  }
  /* How skin-like a color is (0..1): the YCbCr skin box of CurioVideo.frameStats, with soft sides. */
  function skinness(r, g, b) {
    const Y = luma(r, g, b),
      cb = 128 - 0.1482 * r - 0.291 * g + 0.4392 * b,
      cr = 128 + 0.4392 * r - 0.3678 * g - 0.0714 * b;
    const ramp = (x, a, z) => clamp((x - a) / z, 0, 1);
    return r > b ? ramp(Y, 45, 15) * ramp(cb, 77, 6) * ramp(127, cb, 6) * ramp(cr, 135, 6) * ramp(175, cr, 6) : 0;
  }
  /* The borrowed palette, in place. The colors take the inspiration's curves fully; the brightness moves only
     half way (TONE), so a dark room under a white title card turns pale and blue without washing out (the
     "Light and dark" switch does the rest). Skin keeps 80% of its own hue. */
  const TONE = 0.5;
  function palette(d, w, h, want, amount, have) {
    if (!want || !(amount > 0)) return;
    have = have || quantiles(d, w, h, 3);
    const L = ["r", "g", "b"].map((c) => curve(have[c], want[c], amount));
    for (let p = 0; p < w * h * 4; p += 4) {
      const r = d[p],
        g = d[p + 1],
        b = d[p + 2];
      const R = L[0][r],
        G = L[1][g],
        B = L[2][b];
      const y0 = luma(r, g, b),
        y1 = luma(R, G, B),
        y = y0 + (y1 - y0) * TONE,
        sk = skinness(r, g, b) * 0.8;
      d[p] = y + (R - y1) * (1 - sk) + (r - y0) * sk;
      d[p + 1] = y + (G - y1) * (1 - sk) + (g - y0) * sk;
      d[p + 2] = y + (B - y1) * (1 - sk) + (b - y0) * sk;
    }
  }
  /* Soften or sharpen every color, in place. */
  function texture(d, w, h, k, scale) {
    if (Math.abs(k) < 0.01) return;
    const n = w * h;
    for (let c = 0; c < 3; c++) {
      const pl = new Float32Array(n);
      for (let i = 0; i < n; i++) pl[i] = d[i * 4 + c];
      const o = texPlane(pl, w, h, k, scale);
      for (let i = 0; i < n; i++) d[i * 4 + c] = o[i];
    }
  }
  /* Film grain: brightness noise, sigma as measured (0..1), in clumps cell pixels wide, strongest in the mids and
     none in pure black (bars stay clean). */
  function grain(d, w, h, sigma, seed, cell) {
    if (!(sigma > 0.0005)) return;
    cell = Math.max(1, Math.round(cell || 1));
    const gw = Math.ceil(w / cell),
      gh = Math.ceil(h / cell);
    const z = new Float32Array(gw * gh);
    let s = (seed >>> 0) || 1;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < z.length; i++) z[i] = (rnd() + rnd() + rnd() - 1.5) * 2; /* about a bell curve, spread 1 */
    const amp = sigma * 255 * 1.1;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        const v = luma(d[p], d[p + 1], d[p + 2]) / 255;
        const e = z[((y / cell) | 0) * gw + ((x / cell) | 0)] * amp * Math.min(1, v * 10) * (0.35 + 2.6 * v * (1 - v)); /* black stays black */
        d[p] += e;
        d[p + 1] += e;
        d[p + 2] += e;
      }
  }
  /* The picture's shape (bars to the inspiration's picture shape, grown in by amount) and the vignette, in place.
     The window kept is centered on S.cx, S.cy (your people) and moved to the middle. Returns the bars (pixels). */
  function shape(d, w, h, S) {
    const fa = w / h;
    let bx = 0,
      by = 0;
    if (S.aspect && S.aspect > fa * 1.01) by = Math.round(((h - w / S.aspect) / 2) * S.amount);
    else if (S.aspect && S.aspect < fa / 1.01) bx = Math.round(((w - h * S.aspect) / 2) * S.amount);
    const pw = w - 2 * bx,
      ph = h - 2 * by;
    /* where the kept window starts in the frame */
    const ox = bx ? clamp(Math.round((S.cx == null ? 0.5 : S.cx) * w - pw / 2), 0, w - pw) : 0,
      oy = by ? clamp(Math.round((S.cy == null ? 0.5 : S.cy) * h - ph / 2), 0, h - ph) : 0;
    const src = ox !== bx || oy !== by ? new Uint8ClampedArray(d) : d;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        if (x < bx || x >= w - bx || y < by || y >= h - by) {
          d[p] = d[p + 1] = d[p + 2] = 0;
          continue;
        }
        const q = ((y - by + oy) * w + x - bx + ox) * 4;
        const f = S.vignette > 0 ? 1 - S.vignette * vigFall(rad(x - bx, y - by, pw, ph)) : 1;
        d[p] = src[q] * f;
        d[p + 1] = src[q + 1] * f;
        d[p + 2] = src[q + 2] * f;
      }
    return { x: bx, y: by };
  }

  /* ---------- in the page ---------- */
  /* The palette's view of your frame is smoothed over a few frames, so it does not pump. */
  let ema = null;
  function draw(ctx, W, H, L, stage, t) {
    if (!L) return;
    const color = stage === "color";
    if (color ? !L.palette : !(L.texture || L.shape)) return;
    const img = ctx.getImageData(0, 0, W, H),
      d = img.data;
    if (color) {
      let have = quantiles(d, W, H, 3);
      if (ema && t != null && ema.t != null && Math.abs(t - ema.t) < 0.5)
        ["r", "g", "b"].forEach((c) => (have[c] = have[c].map((v, i) => ema.q[c][i] + (v - ema.q[c][i]) * 0.35)));
      ema = { t, q: have };
      palette(d, W, H, L.palette.q, L.palette.amount, have);
    } else {
      if (L.texture) {
        texture(d, W, H, L.texture.k, W / LOOK_W);
        grain(d, W, H, L.texture.grain, Math.round((t || 0) * 30) * 7919 + 1, W / LOOK_W);
      }
      if (L.shape) shape(d, W, H, L.shape);
    }
    ctx.putImageData(img, 0, 0);
  }
  /* Look at a clip a few times a second (the whole frame, LOOK_W wide), then measure each look inside the clip's
     picture (its bars found over all the looks). */
  async function scan(clip, opts) {
    opts = opts || {};
    const W = LOOK_W,
      H = Math.max(8, Math.round((LOOK_W * clip.height) / clip.width));
    const c = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const x = c.getContext("2d", { willReadFrequently: true });
    const n = Math.max(4, Math.min(opts.looks || 48, Math.round(clip.duration * 1.5)));
    const raw = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(clip.duration - 0.05, ((i + 0.5) * clip.duration) / n);
      await root.CurioClip.seek(clip.video, t);
      x.drawImage(clip.video, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H).data;
      raw.push({ t, d, bars: barsOf(d, W, H) });
      if (opts.onProgress && i % 4 === 0) opts.onProgress(i / n);
    }
    const seen = raw.filter((l) => l.bars);
    const bars = {};
    Object.keys(NOBARS).forEach((k) => (bars[k] = seen.length ? Math.min(...seen.map((l) => l.bars[k])) : 0));
    return series(raw.map((l) => ({ t: l.t, m: Object.assign(measure(l.d, W, H, bars), { bars: l.bars }) })));
  }

  /* ---------- checks ---------- */
  /* Before and after against the inspiration, over time: palette by its color cast (red minus blue in the mids)
     and the gap between all the quantiles; grain and softness by sharpness; frame shape by the edges' darkness. */
  function score(p, feat, before, after) {
    const A = p.insp.looks,
      B = before.looks,
      F = after.looks;
    if (!A || !B || !F) return { feature: feat, note: "needs the looks of both clips" };
    const what = feat.slice(3);
    const srcAt = (t) => p.src[clamp(Math.round(t * p.fps), 0, p.src.length - 1)];
    const val = (L, t, i) => {
      if (what === "palette") {
        if (i != null) {
          const q = L.q[i];
          return q.r[4] - q.b[4];
        }
        const q = qAt(L, t);
        return q.r[4] - q.b[4];
      }
      const key = what === "grain" ? "sharp" : "vig";
      return i != null ? L[key][i] : lkAt(L, key, t);
    };
    const want = F.times.map((t) => val(A, p.tA(t, p.duration)));
    const bt = F.times.map((t) => val(B, srcAt(t)));
    const af = F.times.map((t, i) => val(F, t, i));
    const gap = (x) => r3(x.reduce((s, v, i) => s + Math.abs(v - want[i]), 0) / Math.max(1, x.length));
    let gapBefore = gap(bt),
      gapAfter = gap(af);
    if (what === "palette") {
      /* the gap between all 27 quantiles, not just the cast */
      const qd = (a, b) => ["r", "g", "b"].reduce((s, c) => s + a[c].reduce((u, v, i) => u + Math.abs(v - b[c][i]), 0), 0) / 27;
      const wq = F.times.map((t) => qAt(A, p.tA(t, p.duration)));
      const mq = (qs) => r3(qs.reduce((s, q, i) => s + qd(q, wq[i]), 0) / Math.max(1, qs.length));
      gapBefore = mq(F.times.map((t) => qAt(B, srcAt(t))));
      gapAfter = mq(F.q);
    }
    const V0 = V();
    return { feature: feat, corrBefore: r3(V0.corr(bt, want)), corrAfter: r3(V0.corr(af, want)), gapBefore, gapAfter };
  }

  root.CurioLooks = { LOOK_W, QS, KS, barsOf, measure, quantiles, series, at, kFor, vigOf, vigAmount, palette, texture, texStats, grain, shape, draw, scan, score, skinness };
})();
