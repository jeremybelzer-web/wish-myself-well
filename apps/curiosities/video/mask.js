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
   - applyParts(ctx, W, H, parts, { setVideo? })  draws one frame's element changes on the canvas, in place
   - preview(ctx, W, H)                          tints each element on the canvas (to see what the AI found) */
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
            outputConfidenceMasks: false,
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

  /* One cut-out. image: a canvas (any size); it is looked at CUT_W wide. */
  const small = { c: null, x: null };
  function cut(image) {
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
    const labels = res.categoryMask.getAsUint8Array().slice();
    res.close();
    return { w, h, labels, rgba: small.x.getImageData(0, 0, w, h).data };
  }

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
      looks.push({ t, stats: V().partStats(k.labels, k.rgba, k.w, k.h) });
      if (opts.onProgress && i % 4 === 0) opts.onProgress(i / n);
    }
    return V().elementSeries(looks);
  }

  /* ---------- drawing the changes ---------- */
  /* A soft 0..1 mask for some labels, blurred a little at cut-out size, then stretched to W x H. */
  function softMask(k, ids, W, H) {
    const want = new Uint8Array(8);
    ids.forEach((i) => (want[i] = 1));
    const { w, h, labels } = k;
    let m = new Float32Array(w * h);
    for (let i = 0; i < m.length; i++) m[i] = want[labels[i] & 7];
    for (let pass = 0; pass < 2; pass++) {
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
  function recolor(d, mask, color, amount) {
    const Y = 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
    let cr = color[0] - Y,
      cg = color[1] - Y,
      cb = color[2] - Y;
    /* a dull target color is pushed to a clear, visible version of the same hue */
    const chroma = Math.max(Math.abs(cr), Math.abs(cg), Math.abs(cb));
    if (chroma > 0.004 && chroma < 0.12) {
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
      const room = Math.min(1, 4 * y * (1 - y) + 0.15);
      const nr = y + cr * room * 1.6,
        ng = y + cg * room * 1.6,
        nb = y + cb * room * 1.6;
      const o = [r + (nr - r) * a, g + (ng - g) * a, b + (nb - b) * a];
      for (let c = 0; c < 3; c++) d[i * 4 + c] = o[c] < 0 ? 0 : o[c] > 1 ? 255 : o[c] * 255;
    }
  }
  const frameC = { c: null, x: null };
  function applyParts(ctx, W, H, parts, opts) {
    if (!parts || !seg) return false;
    opts = opts || {};
    const k = cut(ctx.canvas);
    if (!k) return false;
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    if (parts.clothes) recolor(d, softMask(k, [4], W, H), parts.clothes.color, parts.clothes.amount);
    if (parts.hair) recolor(d, softMask(k, [1], W, H), parts.hair.color, parts.hair.amount);
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
        vw = v.videoWidth,
        vh = v.videoHeight;
      const kk = Math.max(W / vw, H / vh);
      frameC.x.drawImage(v, (W - vw * kk) / 2, (H - vh * kk) / 2, vw * kk, vh * kk);
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
    ctx.putImageData(img, 0, 0);
    return true;
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
      label: "MediaPipe in your browser (free, private)",
      where: "browser",
      cost: () => "free: it runs on your own computer",
      load,
      cut,
      scan,
    });

  window.CurioMask = { configure, load, ready, cut, scan, applyParts, preview, failed: () => failed, TINT };
})();
