/* video/shutter.js: "Motion feel", how movement looks in the inspiration, put onto another clip.
   - Measuring it: at a few moments the clip is looked at 60 times a second for most of a second.
     * Picture rate: how often the picture really changes (a phone clip 30 times a second; animation "on twos"
       15; stop motion 8 to 12). Repeated pictures are held frames.
     * Smear (shutter angle): how far moving things are smeared along their movement, against how far they move
       from one picture to the next. 360° = smeared all the way to the next picture (a dim room, a phone); 180° =
       half way (the usual film look); 45° or less = crisp (action films, animation, games).
     * Strobing: the gap a moving thing jumps that its smear does not fill (crisp and choppy = strobing).
   - Applying it ("Motion feel", off unless turned on): your clip is smeared along its own movement (measured
     from one drawn frame to the next, block by block) until it is as smeary as the inspiration, very smeary
     inspirations leave light trails too, and a choppy inspiration makes your clip hold each picture (step
     printing) so it moves at the same picture rate. A clip can be made smearier, not crisper.
   Arithmetic on gray frames, so Node tests can feed it made-up frames. scan(), draw(), held() and keep() need a page.

   window.CurioShutter
   - flow(a, b, w, h) -> { bs, gw, gh, vx, vy, ok }   block movement from gray frame a to b (pixels)
   - burst([{ t, g }], w, h) -> { t, rate, shutter, smear, v, strobe }   one moment, frames 1/60 s apart
   - summary(moments) -> { rate, shutter, smear, strobe, choppy, moments }   (dissection.shutter)
   - scan(clip, { plan?, moments?, onProgress? })   measures a clip (or, with a plan, the clip as applied)
   - at(plan, t) -> { id, t, rate, angle, trails, amount } | null   (CurioVideo.at calls it)
   - smear(rgba, w, h, field, k)   smears RGBA in place along a block field (k: output pixels per field pixel)
   - held(ctx, s, W, H), draw(ctx, W, H, s), keep(ctx, s, W, H)   the hooks in CurioClip.drawApplied
   - score(plan, before, after) */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const V = () => root.CurioVideo;
  const AW = 128; /* frames are measured this wide */
  const STEP = 1 / 60;
  const BS = 8; /* block size for movement */
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const median = (a) => {
    const s = a.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y);
    return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
  };

  /* ---------- movement, block by block ---------- */
  /* Half-size copy of a gray frame. */
  function half(g, w, h) {
    const w2 = w >> 1,
      h2 = h >> 1,
      o = new Float32Array(w2 * h2);
    for (let y = 0; y < h2; y++)
      for (let x = 0; x < w2; x++) {
        const i = 2 * y * w + 2 * x;
        o[y * w2 + x] = (g[i] + g[i + 1] + g[i + w] + g[i + w + 1]) / 4;
      }
    return o;
  }
  /* Sum of differences between block (bx, by) of b and the same block of a moved by (dx, dy). */
  function sad(a, b, w, h, x0, y0, n, dx, dy) {
    let s = 0;
    for (let y = y0; y < y0 + n; y++) {
      const ya = clamp(y - dy, 0, h - 1) * w;
      for (let x = x0; x < x0 + n; x++) s += Math.abs(b[y * w + x] - a[ya + clamp(x - dx, 0, w - 1)]);
    }
    return s / (n * n);
  }
  /* Where each 8-pixel block of b came from in a: a coarse search on half-size frames (up to 12 pixels each
     way), refined to a fraction of a pixel. ok = the block has detail and one clear best match. Smaller moves
     win ties, so a plain edge only moves across itself. */
  function flow(a, b, w, h) {
    const gw = Math.floor(w / BS),
      gh = Math.floor(h / BS);
    const vx = new Float32Array(gw * gh),
      vy = new Float32Array(gw * gh),
      ok = new Uint8Array(gw * gh);
    const a2 = half(a, w, h),
      b2 = half(b, w, h),
      w2 = w >> 1,
      h2 = h >> 1;
    const R2 = 6,
      pen = 0.0006;
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        const x0 = i * BS,
          y0 = j * BS,
          k = j * gw + i;
        /* detail: the block's spread */
        let m = 0,
          v = 0;
        for (let y = y0; y < y0 + BS; y++) for (let x = x0; x < x0 + BS; x++) m += b[y * w + x];
        m /= BS * BS;
        for (let y = y0; y < y0 + BS; y++) for (let x = x0; x < x0 + BS; x++) v += (b[y * w + x] - m) * (b[y * w + x] - m);
        const sd = Math.sqrt(v / (BS * BS));
        if (sd < 0.02) continue;
        /* coarse, on the half-size frames */
        let best = Infinity,
          bx = 0,
          by = 0;
        const all = [];
        for (let dy = -R2; dy <= R2; dy++)
          for (let dx = -R2; dx <= R2; dx++) {
            const c = sad(a2, b2, w2, h2, x0 >> 1, y0 >> 1, BS >> 1, dx, dy);
            all.push([dx, dy, c]);
            const cc = c + pen * (dx * dx + dy * dy);
            if (cc < best) {
              best = cc;
              bx = dx;
              by = dy;
            }
          }
        /* clear: nothing two steps or more away matches nearly as well (a plain edge matches all along itself) */
        let other = Infinity;
        for (const [dx, dy, c] of all) if (Math.max(Math.abs(dx - bx), Math.abs(dy - by)) >= 2 && c < other) other = c;
        /* fine, two pixels around it on the full frames */
        let fb = Infinity,
          fx = 2 * bx,
          fy = 2 * by;
        const cost = {};
        for (let dy = 2 * by - 2; dy <= 2 * by + 2; dy++)
          for (let dx = 2 * bx - 2; dx <= 2 * bx + 2; dx++) {
            const c = sad(a, b, w, h, x0, y0, BS, dx, dy) + (pen / 4) * (dx * dx + dy * dy);
            cost[dx + "," + dy] = c;
            if (c < fb) {
              fb = c;
              fx = dx;
              fy = dy;
            }
          }
        /* between pixels: a parabola through the costs either side */
        const sub = (l, c, r) => {
          const d = l - 2 * c + r;
          return l != null && r != null && d > 1e-9 ? clamp((0.5 * (l - r)) / d, -0.5, 0.5) : 0;
        };
        vx[k] = fx + sub(cost[fx - 1 + "," + fy], fb, cost[fx + 1 + "," + fy]);
        vy[k] = fy + sub(cost[fx + "," + (fy - 1)], fb, cost[fx + "," + (fy + 1)]);
        ok[k] = best < 0.75 * other ? 1 : 0;
      }
    return { bs: BS, gw, gh, vx, vy, ok };
  }

  /* Each block's movement as the middle one (x and y each) among it and its clear neighbours: one wrong match
     is outvoted, and a plain block (no detail, so no clear match) takes its neighbours' movement. */
  function spread(F) {
    const { gw, gh } = F;
    const fx = new Float32Array(gw * gh),
      fy = new Float32Array(gw * gh),
      ok = new Uint8Array(gw * gh);
    const mid = (a) => a.sort((x, y) => x - y)[(a.length - 1) >> 1];
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        const xs = [],
          ys = [];
        for (let jj = Math.max(0, j - 1); jj <= Math.min(gh - 1, j + 1); jj++)
          for (let ii = Math.max(0, i - 1); ii <= Math.min(gw - 1, i + 1); ii++) {
            const q = jj * gw + ii;
            if (!F.ok[q]) continue;
            xs.push(F.vx[q]);
            ys.push(F.vy[q]);
          }
        if (!xs.length) continue;
        const k = j * gw + i;
        fx[k] = mid(xs);
        fy[k] = mid(ys);
        ok[k] = 1;
      }
    return Object.assign({}, F, { vx: fx, vy: fy, ok });
  }

  /* ---------- how smeared, how choppy ---------- */
  const at2 = (g, w, h, x, y) => {
    x = clamp(x, 0, w - 1.001);
    y = clamp(y, 0, h - 1.001);
    const i = Math.floor(x),
      j = Math.floor(y),
      fx = x - i,
      fy = y - j,
      o = j * w + i;
    return g[o] * (1 - fx) * (1 - fy) + g[o + 1] * fx * (1 - fy) + g[o + w] * (1 - fx) * fy + g[o + w + 1] * fx * fy;
  };
  /* How wide the edges in one block are along direction (ux, uy), whatever their number or contrast: blur the
     block a known DELTA pixels more that way and see how much of its one-pixel slope is lost. A crisp picture
     loses most (its edges get DELTA wide); one already smeared by L loses little (L becomes about
     sqrt(L^2 + DELTA^2)). Returns [slope energy before, after]. */
  const DELTA = 4;
  function slopeSums(g, w, h, x0, y0, ux, uy) {
    let a = 0,
      b = 0;
    const blur = (x, y) => {
      let s = 0;
      for (let q = 0; q < 5; q++) {
        const f = (q / 4 - 0.5) * DELTA;
        s += at2(g, w, h, x + f * ux, y + f * uy);
      }
      return s / 5;
    };
    for (let y = Math.max(1, y0); y < Math.min(h - 1, y0 + BS); y++)
      for (let x = Math.max(1, x0); x < Math.min(w - 1, x0 + BS); x++) {
        /* only where the slope points this way, so edges are always measured straight across */
        const o = y * w + x,
          gx = g[o + 1] - g[o - 1],
          gy = g[o + w] - g[o - w];
        if (Math.abs(gx * ux + gy * uy) < 2 * Math.abs(gy * ux - gx * uy)) continue;
        const d = at2(g, w, h, x + ux / 2, y + uy / 2) - at2(g, w, h, x - ux / 2, y - uy / 2);
        const e = blur(x + ux / 2, y + uy / 2) - blur(x - ux / 2, y - uy / 2);
        a += d * d;
        b += e * e;
      }
    return [a, b];
  }
  /* The edge width from those sums: a box L wide blurred DELTA more keeps L(DELTA - L/3)/DELTA^2 of its slope
     energy when L <= DELTA, and 1 - DELTA/(3L) when wider. */
  const widthOf = (a, b) => {
    const R = clamp(b / Math.max(1e-12, a), 0, 0.98);
    return R <= 2 / 3 ? (DELTA * (3 - Math.sqrt(Math.max(0, 9 - 12 * R)))) / 2 : DELTA / (3 * (1 - R));
  };
  /* The smear (pixels) from how much wider edges are along the movement (v pixels a picture): edges smeared
     L wide read about 1 + L/4 wide here, and small smears hide in a picture's own softness (calibrated on
     made-up pans smeared 90, 180 and 360 degrees). */
  function smearOf(excess, v) {
    const raw = clamp((360 * 4 * excess) / Math.max(v, 1e-6), 0, 360);
    return v * Math.pow(raw / 360, 0.62);
  }
  /* One moment: frames 1/60 s apart (or any steady step). */
  function burst(frames, w, h) {
    if (!frames || frames.length < 4) return null;
    const step = (frames[frames.length - 1].t - frames[0].t) / (frames.length - 1) || STEP;
    const D = [0];
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1].g,
        b = frames[i].g;
      let s = 0;
      for (let k = 0; k < a.length; k += 2) s += Math.abs(a[k] - b[k]);
      D.push(s / (a.length / 2));
    }
    const top = Math.max(...D);
    const out = { t: r3(frames[0].t), rate: null, shutter: null, smear: 0, v: 0, strobe: 0 };
    if (top < 0.004) return out; /* nothing moves */
    /* a new picture: a clear change (repeats from a held frame or a re-encode change only a little) */
    const thr = Math.max(0.002, 0.2 * top);
    const news = [0];
    for (let i = 1; i < D.length; i++) if (D[i] > thr) news.push(i);
    const gaps = news.slice(1).map((n, i) => (n - news[i]) * step).filter((g) => g <= 0.3);
    if (gaps.length >= 2) out.rate = r3(1 / (gaps.reduce((s, x) => s + x, 0) / gaps.length));
    /* smear: in the blocks that moved, how wide edges are along the movement against across it (where movement
       cannot smear them) */
    let pa = 0,
      pb = 0,
      qa = 0,
      qb = 0,
      vs = 0,
      vw = 0,
      n = 0;
    const pairs = [];
    for (let i = 1; i < news.length; i++) if ((news[i] - news[i - 1]) * step <= 0.3) pairs.push([frames[news[i - 1]].g, frames[news[i]].g]);
    const every = Math.max(1, Math.ceil(pairs.length / 10));
    for (let pi = 0; pi < pairs.length; pi += every) {
      const [a, b] = pairs[pi];
      const F0 = flow(a, b, w, h),
        F = spread(F0);
      for (let j = 0; j < F.gh; j++)
        for (let i = 0; i < F.gw; i++) {
          const k = j * F.gw + i;
          if (!F0.ok[k] || !F.ok[k]) continue;
          const len = Math.hypot(F.vx[k], F.vy[k]);
          if (len < 1.5) continue;
          const ux = F.vx[k] / len,
            uy = F.vy[k] / len;
          const s = slopeSums(b, w, h, i * BS, j * BS, ux, uy),
            c = slopeSums(b, w, h, i * BS, j * BS, -uy, ux);
          pa += s[0];
          pb += s[1];
          qa += c[0];
          qb += c[1];
          vs += len * s[0];
          vw += s[0];
          n++;
        }
    }
    if (n >= 3 && pa > 0) {
      const wPar = widthOf(pa, pb),
        w0 = qa > 0 ? widthOf(qa, qb) : 1;
      const v = vs / vw;
      out.wp = r3(wPar);
      out.w0 = r3(w0);
      const L = smearOf(wPar - w0, v);
      out.v = r3(v / w);
      out.smear = r3(L / w);
      if (v >= 1.5) out.shutter = Math.round((360 * L) / v);
      out.strobe = r3(clamp((v - L) / (0.04 * w), 0, 1));
    }
    return out;
  }
  /* The whole clip: the middle value over the moments that moved. choppy: 0 (smooth, 24 or more pictures a
     second) to 1 (8 or fewer). */
  function summary(moments) {
    const m = (moments || []).filter(Boolean);
    const rate = median(m.map((x) => x.rate)),
      shutter = median(m.map((x) => x.shutter));
    const moved = m.filter((x) => x.v > 0);
    return {
      rate: rate == null ? null : r3(rate),
      shutter: shutter == null ? null : Math.round(shutter),
      smear: r3(median(moved.map((x) => x.smear)) || 0),
      strobe: r3(median(moved.map((x) => x.strobe)) || 0),
      choppy: rate == null ? 0 : r3(clamp((24 - rate) / 16, 0, 1)),
      moments: m,
    };
  }

  /* The applied clip's moment against the same moment as it was: the same picture, so its own edges cancel out
     and only the added smear counts. */
  function compare(was, now, w) {
    if (!was || !now || now.wp == null || was.wp == null || !(now.v > 0)) return now;
    const v = now.v * w;
    const L = smearOf(Math.max(0, was.wp - was.w0) + (now.wp - was.wp), v);
    return Object.assign({}, now, { smear: r3(L / w), shutter: v >= 1.5 ? Math.round((360 * L) / v) : null, strobe: r3(clamp((v - L) / (0.04 * w), 0, 1)) });
  }

  /* ---------- measuring a clip in the page ---------- */
  /* A picture (video or canvas) as gray AW wide: drawn 4 times as wide, then each 4 x 4 averaged, so fine detail
     is not lost or turned to false crisp edges by a one-step shrink. */
  function grayOf(st, img, h) {
    const c = (st.c4 = st.c4 && st.c4.height === h * 4 ? st.c4 : Object.assign(document.createElement("canvas"), { width: AW * 4, height: h * 4 }));
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0, AW * 4, h * 4);
    const d = x.getImageData(0, 0, AW * 4, h * 4).data,
      g = new Float32Array(AW * h),
      W4 = AW * 4;
    for (let y = 0; y < h * 4; y++)
      for (let xx = 0; xx < W4; xx++) {
        const p = (y * W4 + xx) * 4;
        g[(y >> 2) * AW + (xx >> 2)] += (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) / (255 * 16);
      }
    return g;
  }
  /* opts.plan: measure the clip as applied (drawn by CurioClip.drawApplied), for the check. */
  async function scan(clip, opts) {
    opts = opts || {};
    const C = root.CurioClip;
    const plan = opts.plan;
    const dur = plan ? plan.duration : clip.duration;
    const h = Math.max(8, Math.round((AW * clip.height) / clip.width));
    const st = {};
    const DW = 512,
      DH = Math.max(8, Math.round((DW * clip.height) / clip.width));
    const big = plan ? Object.assign(document.createElement("canvas"), { width: DW, height: DH }) : null;
    const bx = big ? big.getContext("2d", { willReadFrequently: true }) : null;
    const span = Math.min(0.8, dur / 2);
    const n = Math.max(1, Math.min(opts.moments || 8, Math.floor(dur / Math.max(0.5, span))));
    const ms = [];
    for (let i = 0; i < n; i++) {
      const t0 = Math.max(0, ((i + 0.5) * dur) / n - span / 2);
      const fr = [],
        fr0 = [];
      for (let k = 0; k * STEP <= span; k++) {
        const t = Math.min(dur - 0.02, t0 + k * STEP);
        if (plan) {
          const a = V().at(plan, t);
          await C.seek(clip.video, a.src);
          fr0.push({ t, g: grayOf(st, clip.video, h) });
          C.drawApplied(bx, clip.video, a, DW, DH, { captions: false });
        } else await C.seek(clip.video, t);
        fr.push({ t, g: grayOf(st, plan ? big : clip.video, h) });
      }
      ms.push(plan ? compare(burst(fr0, AW, h), burst(fr, AW, h), AW) : burst(fr, AW, h));
      if (opts.onProgress) opts.onProgress((i + 1) / n);
    }
    return summary(ms);
  }

  /* ---------- applying it ---------- */
  let ids = 0;
  /* What to do at output time t: the smear to add (degrees of shutter beyond your clip's own), light trails
     when the inspiration is very smeary, and the picture rate to hold to when it is choppy. */
  function at(p, t) {
    const A = p.insp.shutter,
      amt = p.on.shutter || 0;
    if (!A || !(amt > 0)) return null;
    const B = p.target.shutter || {};
    if (p.__shId == null) p.__shId = ++ids;
    const angle = A.shutter == null ? 0 : Math.max(0, A.shutter - (B.shutter || 0)) * amt;
    let rate = 0;
    if (A.rate && A.rate < 22 && (!B.rate || B.rate > A.rate + 2)) {
      const r = 30 / (1 + amt * (30 / A.rate - 1));
      if (r < 24) rate = r3(r);
    }
    const trails = A.shutter == null ? 0 : r3(clamp((A.shutter - 270) / 90, 0, 1) * 0.3 * amt);
    if (!angle && !rate && !trails) return null;
    return { id: p.__shId, t, rate, angle: Math.round(angle), trails, amount: amt };
  }
  /* Smear RGBA in place along a block field (vx, vy in field pixels, k output pixels per field pixel): each
     pixel becomes the average of the picture along its block's movement (a box, as a shutter makes), at most
     24 pixels long. Blocks borrow their biggest moving neighbour (spread), so edges smear too. */
  function smear(d, w, h, F, k) {
    if (!F || !(k > 0)) return;
    const { gw, gh } = F;
    /* then softened over 3 x 3 blocks, so a moving thing smears as one piece, not block by block */
    const S = spread(F);
    const fx = new Float32Array(gw * gh),
      fy = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        let sx = 0,
          sy = 0,
          n = 0;
        for (let jj = Math.max(0, j - 1); jj <= Math.min(gh - 1, j + 1); jj++)
          for (let ii = Math.max(0, i - 1); ii <= Math.min(gw - 1, i + 1); ii++) {
            const q = jj * gw + ii;
            if (!S.ok[q]) continue;
            sx += S.vx[q];
            sy += S.vy[q];
            n++;
          }
        if (n) {
          fx[j * gw + i] = (sx / n) * k;
          fy[j * gw + i] = (sy / n) * k;
        }
      }
    const src = new Uint8ClampedArray(d);
    const sx = gw / w,
      sy = gh / h,
      MAX = 24;
    for (let y = 0; y < h; y++) {
      const gyf = clamp(y * sy - 0.5, 0, gh - 1),
        j0 = Math.floor(gyf),
        j1 = Math.min(gh - 1, j0 + 1),
        ty = gyf - j0;
      for (let x = 0; x < w; x++) {
        const gxf = clamp(x * sx - 0.5, 0, gw - 1),
          i0 = Math.floor(gxf),
          i1 = Math.min(gw - 1, i0 + 1),
          tx = gxf - i0;
        const a = j0 * gw + i0,
          b = j0 * gw + i1,
          c = j1 * gw + i0,
          e = j1 * gw + i1;
        let mx = (fx[a] * (1 - tx) + fx[b] * tx) * (1 - ty) + (fx[c] * (1 - tx) + fx[e] * tx) * ty;
        let my = (fy[a] * (1 - tx) + fy[b] * tx) * (1 - ty) + (fy[c] * (1 - tx) + fy[e] * tx) * ty;
        let len = Math.hypot(mx, my);
        if (len < 0.75) continue;
        if (len > MAX) {
          mx *= MAX / len;
          my *= MAX / len;
          len = MAX;
        }
        const taps = Math.ceil(len) + 1;
        let r = 0,
          g = 0,
          bl = 0;
        for (let q = 0; q < taps; q++) {
          const f = q / (taps - 1) - 0.5;
          const xx = clamp(Math.round(x + f * mx), 0, w - 1),
            yy = clamp(Math.round(y + f * my), 0, h - 1);
          const o = (yy * w + xx) * 4;
          r += src[o];
          g += src[o + 1];
          bl += src[o + 2];
        }
        const o = (y * w + x) * 4;
        d[o] = r / taps;
        d[o + 1] = g / taps;
        d[o + 2] = bl / taps;
      }
    }
  }
  /* Movement from the last drawn picture to this one, per second of output, kept on the canvas. A repeat of the
     same picture (a 30-a-second video drawn 60 times a second) is marked, so it can be drawn as before. */
  function track(st, g, w, h, t) {
    st.repeat = false;
    if (st.prev && st.w === w && st.h === h) {
      let s = 0;
      for (let i = 0; i < g.length; i += 3) s += Math.abs(g[i] - st.prev[i]);
      if (s / (g.length / 3) < 0.0015) {
        st.repeat = true;
        return st.field;
      }
      const dt = t - st.t;
      st.field = dt > 0.005 && dt < 0.3 ? Object.assign(flow(st.prev, g, w, h), { dt }) : null;
    } else st.field = null;
    st.prev = g;
    st.t = t;
    st.w = w;
    st.h = h;
    return st.field;
  }
  /* The hooks in CurioClip.drawApplied. held: a choppy look shows the picture kept for this step (true = done). */
  function held(ctx, s, W, H) {
    if (!s || !s.rate) return false;
    const c = ctx.canvas.__shHold,
      step = Math.floor(s.t * s.rate + 1e-6);
    if (c && c.shId === s.id && c.step === step && c.width === W && c.height === H) {
      ctx.drawImage(c, 0, 0);
      return true;
    }
    return false;
  }
  /* The smear (and trails), after the picture's changes, before the flash and subtitles. */
  function draw(ctx, W, H, s) {
    if (!s) return;
    const cv = ctx.canvas;
    const st = (cv.__sh = cv.__sh && cv.__sh.id === s.id ? cv.__sh : { id: s.id });
    const h = Math.max(8, Math.round((AW * H) / W));
    const F = track(st, grayOf(st, cv, h), AW, h, s.t);
    const same = (c) => c && c.width === W && c.height === H;
    /* the same picture again: draw it as it was last time (its trails must not build up twice) */
    if (st.repeat && same(st.out)) return ctx.drawImage(st.out, 0, 0);
    if (F && s.angle > 0) {
      /* blur length = movement per picture x the shutter's share of it */
      const per = 1 / (s.rate || 30);
      const k = (W / AW) * (per / F.dt) * (s.angle / 360);
      const img = ctx.getImageData(0, 0, W, H);
      smear(img.data, W, H, F, k);
      ctx.putImageData(img, 0, 0);
    }
    /* light trails: a little of the last picture left on this one */
    if (s.trails > 0 && same(st.out)) {
      ctx.save();
      ctx.globalAlpha = s.trails;
      ctx.drawImage(st.out, 0, 0);
      ctx.restore();
    }
    st.out = same(st.out) ? st.out : Object.assign(document.createElement("canvas"), { width: W, height: H });
    st.out.getContext("2d").drawImage(cv, 0, 0);
  }
  /* Keep the finished picture for the rest of its step. */
  function keep(ctx, s, W, H) {
    if (!s || !s.rate) return;
    const cv = ctx.canvas;
    const c = (cv.__shHold = cv.__shHold && cv.__shHold.width === W && cv.__shHold.height === H ? cv.__shHold : Object.assign(document.createElement("canvas"), { width: W, height: H }));
    c.getContext("2d").drawImage(cv, 0, 0);
    c.shId = s.id; /* not .id: a canvas's id is a string */
    c.step = Math.floor(s.t * s.rate + 1e-6);
  }

  /* ---------- check ---------- */
  /* How far from the inspiration's motion feel, before and after: the shutter's gap (a share of 360°) plus the
     picture rate's gap (in doublings), 0 = the same. */
  function score(p, before, after) {
    const A = p.insp.shutter,
      B = before && before.shutter,
      F = after && after.shutter;
    if (!A || !B || !F) return { feature: "shutter", note: "needs the motion feel of both clips" };
    const gap = (x) => r3((A.shutter != null && x.shutter != null ? Math.abs(A.shutter - x.shutter) / 360 : 0) + (A.rate && x.rate ? Math.abs(Math.log2(A.rate / x.rate)) : 0));
    const f = (x) => (x.shutter == null && !x.rate ? "too still to tell" : `${x.shutter == null ? "?" : x.shutter + "°"} smear, ${x.rate ? Math.round(x.rate) : "?"} pictures a second`);
    return {
      feature: "shutter",
      inspiration: { shutter: A.shutter, rate: A.rate },
      before: { shutter: B.shutter, rate: B.rate },
      after: { shutter: F.shutter, rate: F.rate },
      gapBefore: gap(B),
      gapAfter: gap(F),
      text: `yours ${f(B)} → ${f(F)} (inspiration ${f(A)})`,
    };
  }

  /* The group it adds to CurioVideo.GROUPS (off unless turned on). */
  const GROUPS = [
    { id: "shutter", label: "Motion feel (smear and choppiness)", curiosities: ["movementAmount", "moveSpeed"], check: "shutter", needs: "shutter", off: true, plain: "Measures how movement looks in the inspiration: how much moving things smear (a dreamy 180° film look or a dim phone clip's long smear, against a crisp 45° action look) and how choppy it is (8 or 12 pictures a second like stop motion or animation, against a smooth 30). Then your clip is smeared along its own movement to match, with light trails when the inspiration is very smeary, and holds each picture to move at the same choppy rate. It can add smear, not take it away. Off unless you turn it on." },
  ];
  if (V() && V().GROUPS && !V().GROUPS.some((g) => g.id === "shutter")) V().GROUPS.push(...GROUPS);

  root.CurioShutter = { AW, flow, burst, compare, summary, scan, at, smear, track, held, draw, keep, score, GROUPS };
})();
