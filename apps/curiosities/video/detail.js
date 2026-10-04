/* video/detail.js: sharper, cleaner zooms. When the virtual camera (framing.js) or a closer shot zooms into a small
   clip, each source pixel becomes a 2 or 3 pixel blob: soft, with the video's 8x8 compression blocks showing.
   Here, free and in the browser, with no AI, the crop is read at its own size and:
   1. its 8x8 compression blocks are smoothed: a flat tile becomes a gentle slope to its neighbours, and small
      steps at block edges are softened (a real edge, a big step, is kept);
   2. it gets an edge-aware sharpen, stronger the more it will be zoomed: an unsharp mask on brightness that
      ignores small (noise) changes, sharpens less where the contrast is already high, and never goes past the
      brightest or darkest pixel near it, so no halos;
   3. then it is drawn up with the browser's high-quality smoothing.
   (before: false sharpens the drawn-up frame instead: a little smoother, about four times slower.)
   At no zoom (one source pixel per output pixel, or less) nothing changes.

   window.CurioDetail = {
     configure({ on, deblock, sharpen, threshold, before }) -> settings   on: false turns it all off
     deblock(rgba, w, h, ox, oy, strength)    softens the 8x8 grid in place (ox, oy: where the pixels sit in the frame)
     sharpen(rgba, w, h, scale, opts?)        the edge-aware sharpen in place, for a zoom of `scale`
     source(video, x, y, w, h, outW, outH)    page: the deblocked crop to draw from -> { img, ox, oy, scale } or null
     finish(ctx, W, H, scale)                 page: sharpens what was drawn
   }
   No AI upscaler: no small super-resolution model in ONNX form with a clear license was reachable (see README). */
(function () {
  const cfg = { on: true, deblock: 1, sharpen: 1, threshold: 2.5, min: 1.15, before: true };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function configure(o) {
    if (o) for (const k of Object.keys(cfg)) if (o[k] != null) cfg[k] = typeof cfg[k] === "boolean" ? !!o[k] : Number(o[k]);
    return Object.assign({}, cfg);
  }

  /* The 8x8 grid. A heavily compressed clip keeps only the average of many blocks, so a smooth cheek turns into
     flat tiles; blown up, the tiles show. Each flat block's average is swapped for a smooth slope between its
     neighbours' averages (its own fine detail kept on top). A block with texture in it, or a neighbour much
     lighter or darker (a real edge), is left as it is. Then, like a decoder's weak filter, the two pixels each
     side of a block edge are pulled together where the step is small. */
  function deblock(d, w, h, ox, oy, strength) {
    const s = strength == null ? 1 : strength;
    if (s <= 0 || w < 8 || h < 8) return d;
    ox = ox || 0;
    oy = oy || 0;
    const gx0 = Math.floor(ox / 8),
      gy0 = Math.floor(oy / 8),
      nx = Math.floor((ox + w - 1) / 8) - gx0 + 1,
      ny = Math.floor((oy + h - 1) / 8) - gy0 + 1;
    const mean = new Float32Array(nx * ny * 4),
      act = new Float32Array(nx * ny),
      cnt = new Float32Array(nx * ny * 2);
    const L = (p) => 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const bx = ((x + ox) >> 3) - gx0,
          by = ((y + oy) >> 3) - gy0,
          b = by * nx + bx,
          p = (y * w + x) * 4;
        mean[b * 4] += d[p];
        mean[b * 4 + 1] += d[p + 1];
        mean[b * 4 + 2] += d[p + 2];
        cnt[b * 2]++;
        /* texture: brightness steps inside the block only */
        if ((x + ox) & 7 && x > 0) {
          act[b] += Math.abs(L(p) - L(p - 4));
          cnt[b * 2 + 1]++;
        }
        if ((y + oy) & 7 && y > 0) {
          act[b] += Math.abs(L(p) - L(p - w * 4));
          cnt[b * 2 + 1]++;
        }
      }
    for (let b = 0; b < nx * ny; b++) {
      const n = cnt[b * 2] || 1;
      for (let c = 0; c < 3; c++) mean[b * 4 + c] /= n;
      mean[b * 4 + 3] = 0.299 * mean[b * 4] + 0.587 * mean[b * 4 + 1] + 0.114 * mean[b * 4 + 2];
      act[b] = cnt[b * 2 + 1] ? act[b] / cnt[b * 2 + 1] : 99;
    }
    const EDGE = 30,
      A0 = 1.5,
      A1 = 6;
    for (let y = 0; y < h; y++) {
      const Y = y + oy,
        by = (Y >> 3) - gy0,
        fy = (Y + 0.5) / 8 - 0.5 - gy0,
        j0 = Math.floor(fy),
        ty = fy - j0;
      for (let x = 0; x < w; x++) {
        const X = x + ox,
          bx = (X >> 3) - gx0,
          b = by * nx + bx;
        const flat = clamp((A1 - act[b]) / (A1 - A0), 0, 1) * Math.min(1, s);
        if (flat <= 0) continue;
        const fx = (X + 0.5) / 8 - 0.5 - gx0,
          i0 = Math.floor(fx),
          tx = fx - i0;
        const pick = (i, j) => {
          const n = clamp(j, 0, ny - 1) * nx + clamp(i, 0, nx - 1);
          return Math.abs(mean[n * 4 + 3] - mean[b * 4 + 3]) > EDGE ? b : n;
        };
        const n00 = pick(i0, j0),
          n10 = pick(i0 + 1, j0),
          n01 = pick(i0, j0 + 1),
          n11 = pick(i0 + 1, j0 + 1);
        const p = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const m = (mean[n00 * 4 + c] * (1 - tx) + mean[n10 * 4 + c] * tx) * (1 - ty) + (mean[n01 * 4 + c] * (1 - tx) + mean[n11 * 4 + c] * tx) * ty;
          d[p + c] = d[p + c] + flat * (m - mean[b * 4 + c]);
        }
      }
    }
    const alpha = 14 * s,
      beta = 5 * s,
      tc = 4 * s;
    const edge = (p1, p0, q0, q1) => {
      for (let c = 0; c < 3; c++) {
        const a = d[p1 + c],
          b = d[p0 + c],
          e = d[q0 + c],
          f = d[q1 + c];
        if (Math.abs(b - e) >= alpha || Math.abs(a - b) >= beta || Math.abs(f - e) >= beta || b === e) continue;
        const dl = clamp(((e - b) * 4 + (a - f)) / 8, -tc, tc);
        d[p0 + c] = b + dl;
        d[q0 + c] = e - dl;
        d[p1 + c] = a + dl / 2;
        d[q1 + c] = f - dl / 2;
      }
    };
    /* vertical block edges: x where (x + ox) % 8 === 0 */
    for (let x = (8 - (ox % 8)) % 8 || 8; x < w - 1; x += 8) {
      if (x < 2) continue;
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        edge(i - 8, i - 4, i, i + 4);
      }
    }
    /* horizontal block edges */
    const row = w * 4;
    for (let y = (8 - (oy % 8)) % 8 || 8; y < h - 1; y += 8) {
      if (y < 2) continue;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        edge(i - 2 * row, i - row, i, i + row);
      }
    }
    return d;
  }

  /* How hard to sharpen at a zoom: none at 1, growing with the zoom (the blur of an upscale grows with it). */
  const amountAt = (scale, k) => clamp(((scale - 1) / 1.2) * (k == null ? 1 : k), 0, 1.6);

  /* buffers kept between frames (a frame is big; making them again each time is slow) */
  let bufs = null;
  function scratch(n) {
    if (!bufs || bufs.n !== n) bufs = { n, Y: new Float32Array(n), hb: new Float32Array(n), hl: new Float32Array(n), hh: new Float32Array(n) };
    return bufs;
  }
  /* weights of a smooth bump (binomial, nearly a gaussian) r pixels each way */
  function bump(r) {
    let k = [1];
    for (let i = 0; i < 2 * r; i++) k = k.map((v, j) => v + (k[j - 1] || 0)).concat(1);
    const s = k.reduce((a, b) => a + b, 0);
    return k.map((v) => v / s);
  }

  function sharpen(d, w, h, scale, opts) {
    const o = opts || {};
    const amt = amountAt(scale, o.strength == null ? cfg.sharpen : o.strength);
    if (!(scale >= cfg.min) || amt <= 0.01 || w < 3 || h < 3) return d;
    const t = o.threshold == null ? cfg.threshold : o.threshold;
    const n = w * h,
      { Y, hb, hl, hh } = scratch(n);
    for (let i = 0, p = 0; i < n; i++, p += 4) Y[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
    /* the blur an upscale of `scale` adds, and the darkest and brightest close by (rm each way) */
    /* o.before: sharpened at the source's own size, before it is blown up (then the blur to undo is a pixel) */
    const r = o.before ? 1 : clamp(Math.round(scale * 0.7), 1, 4),
      rm = o.before ? 1 : Math.max(1, Math.round(scale * 0.5)),
      K = bump(r),
      R = Math.max(r, rm);
    /* across: blur, darkest, brightest */
    for (let y = 0; y < h; y++) {
      const o0 = y * w;
      for (let x = 0; x < w; x++) {
        let b = 0,
          lo = 1e9,
          hi = -1e9;
        for (let k = -R; k <= R; k++) {
          const v = Y[o0 + (x + k < 0 ? 0 : x + k >= w ? w - 1 : x + k)];
          if (k >= -r && k <= r) b += K[k + r] * v;
          if (k >= -rm && k <= rm) {
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
        }
        hb[o0 + x] = b;
        hl[o0 + x] = lo;
        hh[o0 + x] = hi;
      }
    }
    /* down, then the sharpen itself */
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let b = 0,
          lo = 1e9,
          hi = -1e9;
        for (let k = -R; k <= R; k++) {
          const q = (y + k < 0 ? 0 : y + k >= h ? h - 1 : y + k) * w + x;
          if (k >= -r && k <= r) b += K[k + r] * hb[q];
          if (k >= -rm && k <= rm) {
            if (hl[q] < lo) lo = hl[q];
            if (hh[q] > hi) hi = hh[q];
          }
        }
        const i = y * w + x;
        let det = Y[i] - b;
        /* small wiggles are noise or grain: leave them */
        det = det > t ? det - t : det < -t ? det + t : 0;
        if (!det) continue;
        /* contrast-adaptive: already-hard edges get less */
        const kk = amt * (1 - 0.5 * ((hi - lo) / 255));
        let ny = Y[i] + kk * det;
        ny = ny < lo ? lo : ny > hi ? hi : ny; /* never past the pixels around it: no halo */
        const dy = ny - Y[i];
        const p = i * 4;
        d[p] = d[p] + dy;
        d[p + 1] = d[p + 1] + dy;
        d[p + 2] = d[p + 2] + dy;
      }
    return d;
  }

  /* ---------- page ---------- */
  let buf = null;
  /* The crop (x, y, w, h in the video's pixels) read at its own size and deblocked, to draw from; null when it
     would not be enlarged (then the caller draws the video as before). */
  function source(video, x, y, w, h, outW, outH) {
    const vw = video && (video.videoWidth || video.width),
      vh = video && (video.videoHeight || video.height);
    const scale = Math.min(outW / w, outH / h);
    if (!cfg.on || !vw || !(scale >= cfg.min) || typeof document === "undefined") return null;
    /* whole 8x8 blocks, one more each side, so every block's average is a true one */
    const x0 = clamp(Math.floor(x / 8) * 8 - 8, 0, vw),
      y0 = clamp(Math.floor(y / 8) * 8 - 8, 0, vh),
      x1 = clamp(Math.ceil((x + w) / 8) * 8 + 8, 0, vw),
      y1 = clamp(Math.ceil((y + h) / 8) * 8 + 8, 0, vh);
    const cw = x1 - x0,
      ch = y1 - y0;
    if (cw < 4 || ch < 4) return null;
    if (!buf) buf = document.createElement("canvas");
    if (buf.width !== cw || buf.height !== ch) {
      buf.width = cw;
      buf.height = ch;
    }
    const bx = buf.getContext("2d", { willReadFrequently: true });
    try {
      bx.drawImage(video, x0, y0, cw, ch, 0, 0, cw, ch);
      if (cfg.deblock > 0 || cfg.before) {
        const img = bx.getImageData(0, 0, cw, ch);
        deblock(img.data, cw, ch, x0, y0, cfg.deblock);
        if (cfg.before) sharpen(img.data, cw, ch, scale, { before: true });
        bx.putImageData(img, 0, 0);
      }
    } catch (e) {
      return null; /* a video from another site can't be read: draw it as before */
    }
    return { img: buf, ox: x0, oy: y0, scale };
  }
  function finish(ctx, W, H, scale) {
    if (!cfg.on || cfg.before || !(scale >= cfg.min) || cfg.sharpen <= 0) return;
    try {
      const img = ctx.getImageData(0, 0, W, H);
      sharpen(img.data, W, H, scale);
      ctx.putImageData(img, 0, 0);
    } catch (e) {}
  }

  window.CurioDetail = { configure, deblock, sharpen, source, finish, amountAt };
})();
