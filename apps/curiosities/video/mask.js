/* video/mask.js: AI cut-outs, automatic. Finds the people in every frame and splits them into hair, face, skin
   and clothes, with everything else as the set (background). Then it changes only one element: recolor the clothes
   or hair, make the people bigger or smaller or move them, or put them in another clip's set.

   The AI is Google's MediaPipe (the "selfie multiclass" cut-out model). It runs free in the browser on your own
   computer, so the clip never leaves it. It loads the first time it is needed (about 16 MB, from the web). A
   stronger server AI can take over through CurioAI (family "cutout").

   window.CurioMask
   - configure({ lib, wasm, models: { parts } })  where to load MediaPipe and the model from
   - load() -> Promise<boolean>                  loads the AI once; false when it can't (offline, old browser)
   - ready() -> boolean
   - cut(image) -> { w, h, labels }              labels per pixel: 0 set, 1 hair, 2 body skin, 3 face skin,
                                                 4 clothes, 5 other (glasses, hats)
   - scan(clip, { box?, looks?, onProgress? }) -> Promise<elements>   the clip's elements over time (CurioVideo.
                                                 elementSeries), about 4 looks a second, 240 at most
   - applyParts(ctx, W, H, parts, { setVideo?, setBox?, cut? })  draws one frame's element changes on the canvas, in place
   - cutoutCanvas(image, W, H) -> canvas|null    just the people, on a see-through background (null: no one there)
   - preview(ctx, W, H)                          tints each element on the canvas (to see what the AI found)
   - configure({ steady: false | { temporal, clean, mix, island, hole, close, feather } })   the steadier cut-out (on by default):
                                                 each frame's AI answer blended with the last frame's, specks of
                                                 person dropped, small holes in people filled, soft edges */
(function () {
  const V = () => window.CurioVideo;
  const cfg = {
    lib: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs",
    wasm: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    models: { parts: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite" },
  };
  let seg = null,
    loading = null,
    failed = "";
  const CUT_W = 320;
  const mk = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });

  function configure(o) {
    o = o || {};
    if (o.lib) cfg.lib = o.lib;
    if (o.wasm) cfg.wasm = o.wasm;
    if (o.models) Object.assign(cfg.models, o.models);
    if (o.steady === false) steady.temporal = steady.clean = false;
    else if (o.steady === true) steady.temporal = steady.clean = true;
    else if (o.steady) Object.assign(steady, o.steady);
    if (o.steady != null) tracks.clear();
  }
  function load() {
    if (seg) return Promise.resolve(true);
    if (!loading)
      loading = (async () => {
        try {
          const MP = await import(cfg.lib);
          const files = await MP.FilesetResolver.forVisionTasks(cfg.wasm);
          seg = await MP.ImageSegmenter.createFromOptions(files, {
            baseOptions: { modelAssetPath: cfg.models.parts, delegate: "CPU" },
            runningMode: "IMAGE",
            outputCategoryMask: true,
            outputConfidenceMasks: true,
          });
          return true;
        } catch (e) {
          failed = (e && e.message) || String(e);
          loading = null;
          return false;
        }
      })();
    return loading;
  }
  const ready = () => !!seg;

  /* One cut-out. image: a canvas (any size); it is looked at CUT_W wide. opts.track names a run of frames (one
     clip playing): its cut-outs are steadied against the frame before; opts.t is the clip time, so a jump resets. */
  const small = { c: null, x: null };
  function cut(image, opts) {
    if (!seg) return null;
    const iw = image.width || image.videoWidth,
      ih = image.height || image.videoHeight;
    const w = Math.min(CUT_W, iw),
      h = Math.max(2, Math.round((w * ih) / iw));
    if (!small.c || small.c.width !== w || small.c.height !== h) {
      small.c = mk(w, h);
      small.x = small.c.getContext("2d", { willReadFrequently: true });
    }
    small.x.drawImage(image, 0, 0, w, h);
    const res = seg.segment(small.c);
    let labels = res.categoryMask.getAsUint8Array().slice(),
      conf = null;
    /* the AI's confidence per element (0 set ... 5 other), when it gives them at the cut-out size */
    const cm = res.confidenceMasks;
    if (cm && cm.length === 6 && cm[0].width === w && cm[0].height === h) conf = cm.map((m) => m.getAsFloat32Array().slice());
    res.close();
    const k = { w, h, labels, rgba: small.x.getImageData(0, 0, w, h).data };
    tidy(k, conf, opts && opts.track ? opts : null);
    return k;
  }

  /* ---------- steadier cut-outs ---------- */
  /* temporal: blend with the frame before (mix = how much of the new frame, more where the picture moved);
     clean: drop specks of person smaller than island, fill holes in people smaller than hole (parts of the frame);
     close: narrow gaps on people's edges shut (pixels); feather: blur passes on the edges (2 when off) */
  const steady = { temporal: true, clean: true, mix: 0.45, island: 0.002, hole: 0.02, close: 2, feather: 3 };
  const tracks = new Map();
  function tidy(k, conf, tr) {
    if (!steady.temporal && !steady.clean) return k;
    const { w, h, rgba } = k,
      n = w * h;
    if (conf && tr && steady.temporal) {
      const gray = new Uint8Array(n);
      for (let i = 0; i < n; i++) gray[i] = (rgba[i * 4] * 77 + rgba[i * 4 + 1] * 150 + rgba[i * 4 + 2] * 29) >> 8;
      if (blend(conf, gray, tracks.get(tr.track), tr.t, steady.mix)) k.steadied = true;
      tracks.set(tr.track, { gray, t: tr.t, conf: conf.map((c) => c.slice()) });
      if (tracks.size > 4) tracks.delete(tracks.keys().next().value);
    }
    let pc = null;
    if (conf) {
      k.labels = argmax(conf, n);
      pc = new Float32Array(n);
      for (let i = 0; i < n; i++) pc[i] = 1 - conf[0][i];
    }
    if (steady.clean) cleanLabels(k.labels, w, h, steady, pc);
    return k;
  }
  /* Blend this frame's confidences (in place) with the last frame's. False (and nothing blended) after a cut, a jump
     in time or a size change. Where the picture changed a lot, the new frame counts more, so moving arms don't smear. */
  function blend(conf, gray, prev, t, mix) {
    const n = gray.length;
    if (!prev || prev.gray.length !== n || prev.conf.length !== conf.length) return false;
    if (t != null && prev.t != null && (t < prev.t - 0.01 || t - prev.t > 0.5)) return false;
    let diff = 0;
    for (let i = 0; i < n; i += 3) diff += Math.abs(gray[i] - prev.gray[i]);
    if (diff / Math.ceil(n / 3) > 30) return false; /* a cut: a new shot starts fresh */
    for (let i = 0; i < n; i++) {
      const a = Math.min(0.9, mix + Math.abs(gray[i] - prev.gray[i]) / 80);
      for (let l = 0; l < conf.length; l++) conf[l][i] = prev.conf[l][i] + (conf[l][i] - prev.conf[l][i]) * a;
    }
    return true;
  }
  /* Person where the person elements together beat the set (a blurred arm is often half clothes, half skin, and
     loses to the set one by one), then whichever element is likeliest. */
  function argmax(conf, n) {
    const labels = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (conf[0][i] >= 0.5) continue;
      let b = 1,
        bv = conf[1][i];
      for (let l = 2; l < conf.length; l++) if (conf[l][i] > bv) (bv = conf[l][i]), (b = l);
      labels[i] = b;
    }
    return labels;
  }
  /* Drop small islands of person and fill small holes inside people, in place. Returns a map per pixel: 1 dropped
     (now set), 2 filled (now person, with the element most found around the hole). p (optional): the AI's person
     confidence; a hole bigger than a speck is filled only where the AI half saw a person (motion blur), so a real
     gap (an arm on a hip) stays open. */
  function cleanLabels(labels, w, h, o, p) {
    const n = w * h,
      fix = new Uint8Array(n),
      seen = new Uint8Array(n),
      stack = new Int32Array(n),
      comp = new Int32Array(n);
    const minIsland = Math.max(4, (o.island || 0) * n),
      maxHole = (o.hole || 0) * n;
    /* the parts of one kind (person or set) joined to i; votes counts the elements around a set part */
    function grow(i0, fg, votes) {
      let sp = 0,
        len = 0,
        edge = false;
      stack[sp++] = i0;
      seen[i0] = 1;
      while (sp) {
        const i = stack[--sp];
        comp[len++] = i;
        const x = i % w,
          y = (i / w) | 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
        for (let d = 0; d < 4; d++) {
          const xx = x + (d === 0 ? -1 : d === 1 ? 1 : 0),
            yy = y + (d === 2 ? -1 : d === 3 ? 1 : 0);
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = yy * w + xx;
          if (!labels[j] !== !fg) {
            if (votes) votes[labels[j] & 7]++;
            continue;
          }
          if (!seen[j]) {
            seen[j] = 1;
            stack[sp++] = j;
          }
        }
      }
      return { len, edge };
    }
    let biggest = 0;
    const islands = [];
    for (let i = 0; i < n; i++)
      if (labels[i] && !seen[i]) {
        const g = grow(i, true, null);
        biggest = Math.max(biggest, g.len);
        if (g.len < minIsland) islands.push(comp.slice(0, g.len));
      }
    /* a speck goes, unless it is all the person there is (someone far away) */
    islands.forEach((c) => {
      if (c.length === biggest) return;
      for (let q = 0; q < c.length; q++) (labels[c[q]] = 0), (fix[c[q]] = 1);
    });
    /* close narrow gaps (r pixels) along the people's edge, so a ragged blur-bitten edge is whole again and a hole
       with a thin opening counts as a hole */
    const r = o.close || 0;
    if (r > 0 && biggest) {
      const fg = new Uint8Array(n);
      for (let i = 0; i < n; i++) fg[i] = labels[i] ? 1 : 0;
      const shut = boxAll(boxAny(fg, w, h, r), w, h, r);
      for (let i = 0; i < n; i++)
        if (shut[i] && !fg[i]) {
          const x = i % w,
            y = (i / w) | 0;
          let best = 0;
          for (let d = 1; d <= r && !best; d++)
            for (let q = 0; q < 4 && !best; q++) {
              const xx = x + (q === 0 ? -d : q === 1 ? d : 0),
                yy = y + (q === 2 ? -d : q === 3 ? d : 0);
              if (xx >= 0 && yy >= 0 && xx < w && yy < h) best = fg[yy * w + xx] ? labels[yy * w + xx] : 0;
            }
          labels[i] = best || 4;
          fix[i] = 2;
        }
    }
    seen.fill(0);
    for (let i = 0; i < n; i++)
      if (!labels[i] && !seen[i]) {
        const votes = new Int32Array(8);
        const g = grow(i, false, votes);
        if (g.edge || g.len > maxHole || !biggest) continue;
        if (p && g.len > minIsland) {
          let s = 0;
          for (let q = 0; q < g.len; q++) s += p[comp[q]];
          if (s / g.len < 0.15) continue;
        }
        let best = 4;
        for (let l = 1; l < 6; l++) if (votes[l] > votes[best]) best = l;
        for (let q = 0; q < g.len; q++) (labels[comp[q]] = best), (fix[comp[q]] = 2);
      }
    return fix;
  }
  /* Binary grow (any yes within r) and shrink (all yes within r), square windows, by running counts. */
  function boxCount(m, w, h, r, all) {
    const t = new Uint8Array(m.length),
      o = new Uint8Array(m.length);
    const pass = (src, dst, len, lines, at) => {
      for (let L = 0; L < lines; L++) {
        let c = 0,
          seen = 0;
        for (let i = 0; i < Math.min(r, len); i++) (c += src[at(L, i)]), seen++;
        for (let i = 0; i < len; i++) {
          if (i + r < len) (c += src[at(L, i + r)]), seen++;
          if (i - r - 1 >= 0) (c -= src[at(L, i - r - 1)]), seen--;
          dst[at(L, i)] = all ? (c === seen ? 1 : 0) : c > 0 ? 1 : 0;
        }
      }
    };
    pass(m, t, w, h, (y, x) => y * w + x);
    pass(t, o, h, w, (x, y) => y * w + x);
    return o;
  }
  const boxAny = (m, w, h, r) => boxCount(m, w, h, r, false),
    boxAll = (m, w, h, r) => boxCount(m, w, h, r, true);

  /* The clip's elements over time. */
  async function scan(clip, opts) {
    opts = opts || {};
    if (!(await load())) return null;
    const box = opts.box || { x: 0, y: 0, w: clip.width, h: clip.height };
    const n = Math.max(2, Math.min(opts.looks || 240, Math.round(clip.duration * 4)));
    const c = mk(CUT_W, Math.max(2, Math.round((CUT_W * box.h) / box.w)));
    const x = c.getContext("2d", { willReadFrequently: true });
    const looks = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(clip.duration - 0.05, ((i + 0.5) * clip.duration) / n);
      await window.CurioClip.seek(clip.video, t);
      x.drawImage(clip.video, box.x, box.y, box.w, box.h, 0, 0, c.width, c.height);
      const k = cut(c);
      looks.push({ t, stats: V().partStats(k.labels, k.rgba, k.w, k.h), blobs: window.CurioFraming ? window.CurioFraming.blobs(k.labels, k.w, k.h) : null });
      if (opts.onProgress && i % 4 === 0) opts.onProgress(i / n);
    }
    const el = V().elementSeries(looks);
    if (window.CurioFraming) el.main = window.CurioFraming.series(looks, c.height / c.width); /* the main person, for shot framing */
    return el;
  }

  /* ---------- drawing the changes ---------- */
  /* A soft 0..1 mask for some labels, blurred a little at cut-out size, then stretched to W x H. */
  function softMask(k, ids, W, H) {
    const want = new Uint8Array(8);
    ids.forEach((i) => (want[i] = 1));
    const { w, h, labels } = k;
    let m = new Float32Array(w * h);
    for (let i = 0; i < m.length; i++) m[i] = want[labels[i] & 7];
    /* a softer edge for the steadier cut-out (a cleaned edge is smooth enough to blur a little more) */
    const passes = steady.clean ? steady.feather : 2;
    for (let pass = 0; pass < passes; pass++) {
      const o = new Float32Array(m.length);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          let s = 0,
            c = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const xx = x + dx,
                yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
              s += m[yy * w + xx];
              c++;
            }
          o[y * w + x] = s / c;
        }
      m = o;
    }
    return upsample(m, w, h, W, H);
  }
  function upsample(m, w, h, W, H) {
    const out = new Float32Array(W * H);
    for (let Y = 0; Y < H; Y++) {
      const fy = Math.min(h - 1.001, Math.max(0, ((Y + 0.5) * h) / H - 0.5)),
        y0 = fy | 0,
        ty = fy - y0;
      for (let X = 0; X < W; X++) {
        const fx = Math.min(w - 1.001, Math.max(0, ((X + 0.5) * w) / W - 0.5)),
          x0 = fx | 0,
          tx = fx - x0;
        const i = y0 * w + x0;
        out[Y * W + X] = (m[i] * (1 - tx) + m[i + 1] * tx) * (1 - ty) + (m[i + w] * (1 - tx) + m[i + w + 1] * tx) * ty;
      }
    }
    return out;
  }
  /* Fill the holes (where hole > 0.5) from the colors around them: push-pull, at cut-out size. Returns RGB at
     W x H. Rough, like a smeared clean plate; a server inpainting model does this properly. */
  function fillFrom(k, holeIds, W, H) {
    const { w, h, labels, rgba } = k;
    const hole = new Uint8Array(8);
    holeIds.forEach((i) => (hole[i] = 1));
    /* grow the hole by 2 pixels so the edge of the person isn't smeared in */
    const isHole = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let any = 0;
        for (let dy = -2; dy <= 2 && !any; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx,
              yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < w && yy < h && hole[labels[yy * w + xx] & 7]) {
              any = 1;
              break;
            }
          }
        isHole[y * w + x] = any;
      }
    let levels = [];
    let cw = w,
      ch = h;
    let col = new Float32Array(cw * ch * 3),
      wt = new Float32Array(cw * ch);
    for (let i = 0; i < cw * ch; i++)
      if (!isHole[i]) {
        wt[i] = 1;
        col[i * 3] = rgba[i * 4];
        col[i * 3 + 1] = rgba[i * 4 + 1];
        col[i * 3 + 2] = rgba[i * 4 + 2];
      }
    levels.push({ cw, ch, col, wt });
    while (cw > 2 && ch > 2) {
      const nw = Math.ceil(cw / 2),
        nh = Math.ceil(ch / 2);
      const nc = new Float32Array(nw * nh * 3),
        nwt = new Float32Array(nw * nh);
      for (let y = 0; y < ch; y++)
        for (let x = 0; x < cw; x++) {
          const i = y * cw + x,
            j = (y >> 1) * nw + (x >> 1);
          nwt[j] += wt[i];
          nc[j * 3] += col[i * 3] * wt[i];
          nc[j * 3 + 1] += col[i * 3 + 1] * wt[i];
          nc[j * 3 + 2] += col[i * 3 + 2] * wt[i];
        }
      for (let j = 0; j < nw * nh; j++)
        if (nwt[j] > 0) {
          nc[j * 3] /= nwt[j];
          nc[j * 3 + 1] /= nwt[j];
          nc[j * 3 + 2] /= nwt[j];
          nwt[j] = Math.min(1, nwt[j]);
        }
      cw = nw;
      ch = nh;
      col = nc;
      wt = nwt;
      levels.push({ cw, ch, col, wt });
    }
    for (let l = levels.length - 2; l >= 0; l--) {
      const L = levels[l],
        U = levels[l + 1];
      for (let y = 0; y < L.ch; y++)
        for (let x = 0; x < L.cw; x++) {
          const i = y * L.cw + x;
          if (L.wt[i] >= 1) continue;
          /* the coarser level, read smoothly (bilinear) so the fill has no blocks */
          const fx = Math.min(U.cw - 1, Math.max(0, (x + 0.5) / 2 - 0.5)),
            fy = Math.min(U.ch - 1, Math.max(0, (y + 0.5) / 2 - 0.5));
          const x0 = fx | 0,
            y0 = fy | 0,
            x1 = Math.min(U.cw - 1, x0 + 1),
            y1 = Math.min(U.ch - 1, y0 + 1),
            tx = fx - x0,
            ty = fy - y0,
            a = L.wt[i];
          for (let c = 0; c < 3; c++) {
            const u = (U.col[(y0 * U.cw + x0) * 3 + c] * (1 - tx) + U.col[(y0 * U.cw + x1) * 3 + c] * tx) * (1 - ty) + (U.col[(y1 * U.cw + x0) * 3 + c] * (1 - tx) + U.col[(y1 * U.cw + x1) * 3 + c] * tx) * ty;
            L.col[i * 3 + c] = L.col[i * 3 + c] * a + u * (1 - a);
          }
          L.wt[i] = 1;
        }
    }
    const base = levels[0].col;
    const out = [0, 1, 2].map((c) => {
      const m = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) m[i] = base[i * 3 + c];
      return upsample(m, w, h, W, H);
    });
    return out;
  }
  /* Recolor: each pixel keeps its own light and shade (its brightness) and takes the new color's hue and
     strength, so folds and shadows stay. Very dark and very bright pixels take less of it, as dyed cloth does. */
  function recolor(d, mask, color, amount, keepLight) {
    const Y = 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
    let cr = color[0] - Y,
      cg = color[1] - Y,
      cb = color[2] - Y;
    /* a dull target color is pushed to a clear, visible version of the same hue */
    const chroma = Math.max(Math.abs(cr), Math.abs(cg), Math.abs(cb));
    /* (not for hair: real hair colors are dull, and a boosted brown turns ginger) */
    if (!keepLight && chroma > 0.004 && chroma < 0.12) {
      const k = 0.12 / chroma;
      cr *= k;
      cg *= k;
      cb *= k;
    }
    for (let i = 0; i < mask.length; i++) {
      const a = mask[i] * amount;
      if (a < 0.01) continue;
      const r = d[i * 4] / 255,
        g = d[i * 4 + 1] / 255,
        b = d[i * 4 + 2] / 255;
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      /* gray and white hair stays gray: hair that is not dark and has little color of its own is dyed only as
         much as it has color (dark hair and colored hair, blond or red, take the new color fully) */
      let aa = a;
      if (keepLight && y > 0.3) aa *= Math.min(1, (Math.max(r, g, b) - Math.min(r, g, b)) / 0.15);
      if (aa <= 0.01) continue;
      const o2 = recolorPixel(r, g, b, y, cr, cg, cb, aa);
      for (let c = 0; c < 3; c++) d[i * 4 + c] = o2[c];
    }
  }
  function recolorPixel(r, g, b, y, cr, cg, cb, a) {
    {
      const room = Math.min(1, 4 * y * (1 - y) + 0.15);
      const nr = y + cr * room * 1.6,
        ng = y + cg * room * 1.6,
        nb = y + cb * room * 1.6;
      const o = [r + (nr - r) * a, g + (ng - g) * a, b + (nb - b) * a];
      return o.map((v) => (v < 0 ? 0 : v > 1 ? 255 : v * 255));
    }
  }
  /* Faces and skin keep most of their own color when the whole frame is tinted (warmer, cooler, stronger or
     weaker color): they take the new brightness, but 70% of their own hue. before: the frame's pixels before the
     tint; d: after, changed in place. */
  function keepSkin(d, before, k, W, H) {
    const m = softMask(k, [2, 3], W, H);
    for (let i = 0; i < m.length; i++) {
      const a = m[i] * 0.7;
      if (a < 0.01) continue;
      const p = i * 4;
      const y0 = 0.299 * before[p] + 0.587 * before[p + 1] + 0.114 * before[p + 2],
        y1 = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      for (let c = 0; c < 3; c++) {
        const own = y1 + (before[p + c] - y0);
        const v = d[p + c] * (1 - a) + own * a;
        d[p + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }
  const frameC = { c: null, x: null };
  function applyParts(ctx, W, H, parts, opts) {
    if (!parts || !seg) return false;
    opts = opts || {};
    const k = opts.cut || cut(ctx.canvas);
    if (!k) return false;
    if (opts.cut && small.x && small.c.width === k.w && small.c.height === k.h) {
      /* A cut made before the light changed: take this frame's colors for filling gaps. */
      small.x.drawImage(ctx.canvas, 0, 0, k.w, k.h);
      k.rgba = small.x.getImageData(0, 0, k.w, k.h).data;
    }
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    if (parts.clothes) recolor(d, softMask(k, [4], W, H), parts.clothes.color, parts.clothes.amount);
    if (parts.hair) recolor(d, softMask(k, [1], W, H), parts.hair.color, parts.hair.amount, true);
    let personA = null;
    if (parts.person || parts.background) personA = softMask(k, [1, 2, 3, 4, 5], W, H);
    if (parts.person && (Math.abs(parts.person.scale - 1) > 0.01 || Math.abs(parts.person.dx) > 0.005)) {
      /* The people, cut out, scaled about their feet (bottom middle) and slid; the gap filled from around it. */
      const fill = fillFrom(k, [1, 2, 3, 4, 5], W, H);
      const st = V().partStats(k.labels, null, k.w, k.h).person;
      const ax = st.cx * W,
        ay = Math.min(H, st.bottom * H);
      const s = parts.person.scale,
        sx = parts.person.dx * W;
      const src = new Uint8ClampedArray(d);
      const newA = new Float32Array(W * H);
      for (let Y = 0; Y < H; Y++)
        for (let X = 0; X < W; X++) {
          const i = Y * W + X;
          const a0 = personA[i];
          /* the set behind: the frame, with the old people filled */
          let r = src[i * 4] * (1 - a0) + fill[0][i] * a0,
            g = src[i * 4 + 1] * (1 - a0) + fill[1][i] * a0,
            b = src[i * 4 + 2] * (1 - a0) + fill[2][i] * a0;
          const ux = Math.round((X - ax - sx) / s + ax),
            uy = Math.round((Y - ay) / s + ay);
          if (ux >= 0 && uy >= 0 && ux < W && uy < H) {
            const j = uy * W + ux,
              a = personA[j];
            if (a > 0.001) {
              r = r * (1 - a) + src[j * 4] * a;
              g = g * (1 - a) + src[j * 4 + 1] * a;
              b = b * (1 - a) + src[j * 4 + 2] * a;
              newA[i] = a;
            }
          }
          d[i * 4] = r;
          d[i * 4 + 1] = g;
          d[i * 4 + 2] = b;
        }
      personA = newA;
    }
    if (parts.background && opts.setVideo && opts.setVideo.videoWidth) {
      /* Another clip's set: its frame, cover-fitted; your people on top. */
      if (!frameC.c || frameC.c.width !== W || frameC.c.height !== H) {
        frameC.c = mk(W, H);
        frameC.x = frameC.c.getContext("2d", { willReadFrequently: true });
      }
      const v = opts.setVideo,
        bx = opts.setBox || { x: 0, y: 0, w: v.videoWidth, h: v.videoHeight },
        vw = bx.w,
        vh = bx.h;
      const kk = Math.max(W / vw, H / vh);
      frameC.x.drawImage(v, bx.x, bx.y, vw, vh, (W - vw * kk) / 2, (H - vh * kk) / 2, vw * kk, vh * kk);
      const setD = frameC.x.getImageData(0, 0, W, H).data;
      /* Its own people stay (yours stand in front of them) unless asked to take them out (a rough fill). */
      const empty = parts.background.empty;
      const k2 = empty ? cut(frameC.c) : null;
      const theirs = empty ? softMask(k2, [1, 2, 3, 4, 5], W, H) : null;
      const fill = empty ? fillFrom(k2, [1, 2, 3, 4, 5], W, H) : null;
      const amt = parts.background.amount;
      for (let i = 0; i < W * H; i++) {
        const t = empty ? theirs[i] : 0;
        const sr = t ? setD[i * 4] * (1 - t) + fill[0][i] * t : setD[i * 4],
          sg = t ? setD[i * 4 + 1] * (1 - t) + fill[1][i] * t : setD[i * 4 + 1],
          sb = t ? setD[i * 4 + 2] * (1 - t) + fill[2][i] * t : setD[i * 4 + 2];
        const keep = 1 - (1 - personA[i]) * amt;
        d[i * 4] = d[i * 4] * keep + sr * (1 - keep);
        d[i * 4 + 1] = d[i * 4 + 1] * keep + sg * (1 - keep);
        d[i * 4 + 2] = d[i * 4 + 2] * keep + sb * (1 - keep);
      }
    }
    if (parts.angle && Math.abs(parts.angle.tilt) > 0.02) {
      ctx.putImageData(img, 0, 0);
      /* by depth (depth.js) when it can; else two flat layers */
      if (!(window.CurioDepth && window.CurioDepth.tilt(ctx, W, H, k, parts.angle.tilt)))
        tiltView(ctx, W, H, k, personA || softMask(k, [1, 2, 3, 4, 5], W, H), parts.angle.tilt);
      return true;
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }
  /* A new camera height, in 2.5D: the people are one flat layer, the set another flat layer behind them. From
     higher up (tilt > 0) the people slide further down the frame than the set does (parallax), look a little
     shorter, and the set leans back (its top narrows); from lower down, the opposite. The gap the people leave
     is filled from around it. Small tilts only: there is no real 3D here. */
  function tiltView(ctx, W, H, k, personA, tilt) {
    const T = Math.max(-1, Math.min(1, tilt));
    /* this frame's colors (after any recolor or new set) for the fill */
    small.x.drawImage(ctx.canvas, 0, 0, k.w, k.h);
    const fill = fillFrom({ w: k.w, h: k.h, labels: k.labels, rgba: small.x.getImageData(0, 0, k.w, k.h).data }, [1, 2, 3, 4, 5], W, H);
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data,
      src = new Uint8ClampedArray(d);
    const st = V().partStats(k.labels, null, k.w, k.h).person;
    const top = (st.area > 0.003 ? st.top : 0.2) * H;
    const z = 1.08 + 0.05 * Math.abs(T),
      lean = 0.2 * T,
      setDown = 0.04 * T * H,
      peopleDown = 0.12 * T * H,
      squash = 1 - 0.14 * T;
    const cx = W / 2,
      cy = H / 2;
    for (let Y = 0; Y < H; Y++) {
      const Yz = cy + (Y - cy) / z;
      const f = 1 + lean * (1 - (2 * Y) / H);
      const sy = Math.max(0, Math.min(H - 1, Math.round(Yz - setDown)));
      const uy = Math.round(top + (Yz - peopleDown - top) / squash);
      for (let X = 0; X < W; X++) {
        const Xz = cx + (X - cx) / z;
        const sx = Math.max(0, Math.min(W - 1, Math.round(cx + (Xz - cx) * f)));
        const j = sy * W + sx,
          pa = personA[j];
        /* the set: that spot, with any person there filled in */
        let r = src[j * 4] * (1 - pa) + fill[0][j] * pa,
          g = src[j * 4 + 1] * (1 - pa) + fill[1][j] * pa,
          b = src[j * 4 + 2] * (1 - pa) + fill[2][j] * pa;
        const ux = Math.round(Xz);
        if (uy >= 0 && uy < H && ux >= 0 && ux < W) {
          const u = uy * W + ux,
            a = personA[u];
          if (a > 0.001) {
            r = r * (1 - a) + src[u * 4] * a;
            g = g * (1 - a) + src[u * 4 + 1] * a;
            b = b * (1 - a) + src[u * 4 + 2] * a;
          }
        }
        const i = (Y * W + X) * 4;
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  /* Just the people of a frame, on a see-through background (for a puppet, a sticker, another scene). */
  function cutoutCanvas(image, W, H) {
    const c = mk(W, H),
      x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(image, 0, 0, W, H);
    const k = cut(c);
    if (!k) return null;
    let people = 0;
    for (let i = 0; i < k.labels.length; i++) if (k.labels[i]) people++;
    if (people < k.labels.length * 0.002) return null; /* no one in the frame */
    const a = softMask(k, [1, 2, 3, 4, 5], W, H);
    const img = x.getImageData(0, 0, W, H);
    for (let i = 0; i < a.length; i++) img.data[i * 4 + 3] = Math.round(255 * a[i]);
    x.putImageData(img, 0, 0);
    return c;
  }
  const TINT = [null, [255, 60, 60], [60, 220, 90], [250, 220, 50], [60, 110, 255], [230, 80, 230]];
  function preview(ctx, W, H) {
    const k = cut(ctx.canvas);
    if (!k) return false;
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let id = 1; id <= 5; id++) {
      const m = softMask(k, [id], W, H),
        c = TINT[id];
      for (let i = 0; i < m.length; i++) {
        const a = m[i] * 0.5;
        if (a < 0.01) continue;
        d[i * 4] = d[i * 4] * (1 - a) + c[0] * a;
        d[i * 4 + 1] = d[i * 4 + 1] * (1 - a) + c[1] * a;
        d[i * 4 + 2] = d[i * 4 + 2] * (1 - a) + c[2] * a;
      }
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }

  /* The free browser cut-out is the default for the "cutout" family. */
  if (window.CurioAI)
    window.CurioAI.register("cutout", "mediapipe", {
      label: "Free: MediaPipe in your browser (private, no key)",
      where: "browser",
      cost: () => "free: it runs on your own computer",
      load,
      cut,
      scan,
    });

  window.CurioMask = { configure, load, ready, cut, scan, applyParts, keepSkin, cutoutCanvas, preview, failed: () => failed, TINT, tidy: { cleanLabels, blend, argmax, boxAny, boxAll } };
})();
