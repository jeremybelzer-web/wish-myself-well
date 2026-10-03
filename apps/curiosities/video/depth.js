/* video/depth.js: how far away each spot of the picture is, and a new camera height from it.

   A camera angle change (Camera angle, high or low) needs to know what is near and what is far: from higher up,
   near things slide down the frame more than far things, and the picture tips. Two ways to know it:

   - A free depth AI in the browser (onnxruntime-web). The default is FastDepth (MIT license, 5.8 MB, trained on
     rooms), from the npm package com.bonjour-lab.monoculardepth. Depth Anything V2 small (Apache-2.0) is
     stronger: configure({ model: { url, kind: "depth-anything", size: 518 } }). It loads the first time a camera
     angle change is drawn, and works one frame behind (its answer comes back while the next frame is drawn).
   - A made-up depth from the AI cut-out alone: the floor gets nearer toward the bottom of the frame, the walls
     stay far, and each person stands where their feet touch the floor. Used with the AI's depth (people come
     mostly from the cut-out, which is sharp and on time), or alone when no depth AI is loaded.

   The warp: each column of pixels slides by its own depth (a 1D mesh, so nothing tears; where a near edge
   uncovers what was behind it, the farther side is stretched into the gap), then the whole picture is turned
   to look down (or up) at the people, who stay where they were, and zoomed a little to hide the edges.

   window.CurioDepth
   - configure({ ort, wasm, model: { url, kind, size }, guess })   where to load the AI from; guess: false
                                                 turns off the made-up depth (then no depth AI means the old
                                                 two-layer tilt in mask.js)
   - load() -> Promise<boolean>, ready(), failed()
   - estimate(image) -> Promise<{ w, h, near }>  the AI's depth of one picture (near: 0 far .. 1 near)
   - guess(labels, w, h) -> Float32Array         made-up depth from cut-out labels (0 set, 1..5 people)
   - warp(rgba, W, H, near, w, h, tilt, opts) -> Uint8ClampedArray   the frame from a new camera height
   - tilt(ctx, W, H, cut, tilt) -> boolean        mask.js's camera-angle stage; false when it can't (no depth) */
(function () {
  const ORT = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
  const cfg = {
    ort: ORT + "ort.wasm.min.mjs",
    wasm: ORT,
    model: { url: "https://cdn.jsdelivr.net/npm/com.bonjour-lab.monoculardepth@1.0.8-preview/ONNX/fastdepth_7.onnx", kind: "fastdepth", size: 224 },
    guess: true,
    proxy: true /* the AI in onnxruntime's own worker, beside the drawing (falls back to the page) */,
  };
  let ort = null,
    session = null,
    loading = null,
    failed = "",
    busy = false,
    asked = -1e9,
    last = null;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function configure(o) {
    o = o || {};
    if (o.ort) cfg.ort = o.ort;
    if (o.wasm) cfg.wasm = o.wasm;
    if (o.model) cfg.model = Object.assign({}, cfg.model, o.model);
    if (o.guess != null) cfg.guess = !!o.guess;
    if (o.proxy != null) cfg.proxy = !!o.proxy;
    if (o.ort || o.model) {
      session = null;
      loading = null;
      failed = "";
      last = null;
    }
  }
  function load() {
    if (session) return Promise.resolve(true);
    if (!cfg.model.url) return Promise.resolve(false);
    if (!loading)
      loading = (async () => {
        try {
          ort = await import(cfg.ort);
          ort.env.wasm.wasmPaths = cfg.wasm;
          ort.env.wasm.numThreads = 1;
          const make = () => ort.InferenceSession.create(cfg.model.url, { executionProviders: ["wasm"], logSeverityLevel: 3 });
          ort.env.wasm.proxy = !!cfg.proxy;
          try {
            session = await make();
          } catch (e) {
            if (!cfg.proxy) throw e;
            ort.env.wasm.proxy = false;
            session = await make();
          }
          return true;
        } catch (e) {
          failed = (e && e.message) || String(e);
          return false;
        }
      })();
    return loading;
  }
  const ready = () => !!session;

  /* Spread values to 0..1 by their 2nd and 98th percentiles (one far window or lamp doesn't squash the rest). */
  function spread(v) {
    const n = v.length,
      step = Math.max(1, Math.floor(n / 4000)),
      s = [];
    for (let i = 0; i < n; i += step) if (isFinite(v[i])) s.push(v[i]);
    if (!s.length) return new Float32Array(n);
    s.sort((a, b) => a - b);
    const lo = s[Math.floor(s.length * 0.02)],
      hi = s[Math.floor(s.length * 0.98)],
      k = hi - lo > 1e-6 ? 1 / (hi - lo) : 0;
    const o = new Float32Array(n);
    for (let i = 0; i < n; i++) o[i] = isFinite(v[i]) ? clamp((v[i] - lo) * k, 0, 1) : 0;
    return o;
  }
  /* The AI's depth of one picture. FastDepth answers in meters (far is big), Depth Anything in nearness. */
  let inC = null;
  async function estimate(image) {
    if (!session) return null;
    const S = cfg.model.size || 224,
      da = cfg.model.kind === "depth-anything";
    if (!inC || inC.width !== S) inC = Object.assign(document.createElement("canvas"), { width: S, height: S });
    const x = inC.getContext("2d", { willReadFrequently: true });
    x.drawImage(image, 0, 0, S, S);
    const px = x.getImageData(0, 0, S, S).data,
      N = S * S;
    const t = new Float32Array(3 * N),
      M = [0.485, 0.456, 0.406],
      SD = [0.229, 0.224, 0.225];
    for (let i = 0; i < N; i++)
      for (let c = 0; c < 3; c++) {
        const v = px[i * 4 + c] / 255;
        t[c * N + i] = da ? (v - M[c]) / SD[c] : v;
      }
    const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", t, [1, 3, S, S]) });
    const o = out[session.outputNames[0]],
      dims = o.dims,
      h = dims[dims.length - 2],
      w = dims[dims.length - 1];
    const raw = new Float32Array(w * h);
    for (let i = 0; i < raw.length; i++) raw[i] = da ? o.data[i] : 1 / Math.max(0.05, o.data[i]);
    let near = spread(raw);
    /* Steadier from frame to frame: half of the last answer, unless the picture changed a lot (a cut). */
    if (last && last.w === w && last.h === h) {
      let diff = 0;
      for (let i = 0; i < near.length; i++) diff += Math.abs(near[i] - last.near[i]);
      if (diff / near.length < 0.15) for (let i = 0; i < near.length; i++) near[i] = 0.5 * near[i] + 0.5 * last.near[i];
    }
    last = { w, h, near };
    return last;
  }

  /* Made-up depth from a cut-out. The floor: far (0.12) up to a horizon a little above the middle, then nearer
     toward the bottom (0.82). Each person (a joined patch of people pixels) as near as the floor at their feet,
     and a little nearer. */
  const HZ = 0.42;
  const floorNear = (yn) => (yn < HZ ? 0.12 + 0.1 * (yn / HZ) : 0.22 + 0.6 * ((yn - HZ) / (1 - HZ)));
  function guess(labels, w, h) {
    const near = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const v = floorNear((y + 0.5) / h);
      for (let x = 0; x < w; x++) near[y * w + x] = v;
    }
    const seen = new Uint8Array(w * h),
      stack = new Int32Array(w * h);
    for (let s = 0; s < w * h; s++) {
      if (seen[s] || !(labels[s] & 7)) continue;
      /* one patch: flood it, note its lowest row */
      let n = 0,
        top = 0,
        bottom = 0;
      const members = [];
      stack[top++] = s;
      seen[s] = 1;
      while (top) {
        const i = stack[--top];
        members.push(i);
        n++;
        const y = (i / w) | 0,
          x = i - y * w;
        if (y > bottom) bottom = y;
        if (x > 0 && !seen[i - 1] && labels[i - 1] & 7) (seen[i - 1] = 1), (stack[top++] = i - 1);
        if (x < w - 1 && !seen[i + 1] && labels[i + 1] & 7) (seen[i + 1] = 1), (stack[top++] = i + 1);
        if (y > 0 && !seen[i - w] && labels[i - w] & 7) (seen[i - w] = 1), (stack[top++] = i - w);
        if (y < h - 1 && !seen[i + w] && labels[i + w] & 7) (seen[i + w] = 1), (stack[top++] = i + w);
      }
      const v = clamp(floorNear((bottom + 1) / h) + 0.08, 0.45, 0.95);
      for (let j = 0; j < n; j++) {
        const i = members[j];
        near[i] = (labels[i] & 7) === 3 ? Math.min(1, v + 0.03) : v; /* a face a touch in front of the hair */
      }
    }
    return near;
  }
  /* The AI's depth with the made-up one: people mostly from the cut-out (sharp, on time), the set mostly from
     the AI. */
  function fuse(g, labels, w, h, m) {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const my = Math.min(m.h - 1, Math.floor(((y + 0.5) * m.h) / h));
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          a = m.near[my * m.w + Math.min(m.w - 1, Math.floor(((x + 0.5) * m.w) / w))];
        out[i] = labels[i] & 7 ? 0.3 * a + 0.7 * g[i] : 0.6 * a + 0.4 * g[i];
      }
    }
    return out;
  }
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

  /* Holes (what a near edge uncovered) filled from the pixels around them, far ones counting most, by
     averaging over ever bigger squares (pull-push), so a wide hole gets a soft, plain fill, not stripes. */
  function fillHoles(col, hole, zb, W, H) {
    let any = 0;
    for (let i = 0; i < hole.length && !any; i++) any = hole[i];
    if (!any) return;
    const lv = [];
    let w = W,
      h = H,
      c = new Float32Array(W * H * 3),
      wt = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (hole[i]) continue;
      const f = 1 - clamp(zb[i], 0, 1),
        k = 0.02 + f * f * f * f;
      wt[i] = k;
      for (let q = 0; q < 3; q++) c[i * 3 + q] = col[i * 3 + q] * k;
    }
    lv.push({ w, h, c, wt });
    while (w > 1 || h > 1) {
      const nw = Math.max(1, (w + 1) >> 1),
        nh = Math.max(1, (h + 1) >> 1),
        nc = new Float32Array(nw * nh * 3),
        nwt = new Float32Array(nw * nh);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x,
            j = (y >> 1) * nw + (x >> 1);
          nwt[j] += wt[i];
          nc[j * 3] += c[i * 3];
          nc[j * 3 + 1] += c[i * 3 + 1];
          nc[j * 3 + 2] += c[i * 3 + 2];
        }
      w = nw;
      h = nh;
      c = nc;
      wt = nwt;
      lv.push({ w, h, c, wt });
    }
    /* down again: each level's color, topped up from the level above where it has little weight */
    let up = lv[lv.length - 1];
    let upCol = new Float32Array(3);
    if (up.wt[0] > 0) for (let q = 0; q < 3; q++) upCol[q] = up.c[q] / up.wt[0];
    for (let L = lv.length - 2; L >= 0; L--) {
      const a = lv[L],
        out = new Float32Array(a.w * a.h * 3);
      for (let y = 0; y < a.h; y++)
        for (let x = 0; x < a.w; x++) {
          const i = y * a.w + x,
            k = a.wt[i],
            s = Math.min(1, k * 4),
            m = 1 - s;
          /* the level above, smoothly (bilinear), so the fill has no blocks */
          const fx = clamp((x + 0.5) / 2 - 0.5, 0, up.w - 1),
            fy = clamp((y + 0.5) / 2 - 0.5, 0, up.h - 1),
            x0 = Math.floor(fx),
            y0 = Math.floor(fy),
            x1 = Math.min(up.w - 1, x0 + 1),
            y1 = Math.min(up.h - 1, y0 + 1),
            tx = fx - x0,
            ty = fy - y0;
          const j00 = (y0 * up.w + x0) * 3,
            j01 = (y0 * up.w + x1) * 3,
            j10 = (y1 * up.w + x0) * 3,
            j11 = (y1 * up.w + x1) * 3;
          for (let q = 0; q < 3; q++) {
            const pc = (upCol[j00 + q] * (1 - tx) + upCol[j01 + q] * tx) * (1 - ty) + (upCol[j10 + q] * (1 - tx) + upCol[j11 + q] * tx) * ty;
            out[i * 3 + q] = (k > 0 ? (a.c[i * 3 + q] / k) * s : 0) + pc * m;
          }
        }
      up = a;
      upCol = out;
    }
    for (let i = 0; i < W * H; i++) if (hole[i]) for (let q = 0; q < 3; q++) col[i * 3 + q] = upCol[i * 3 + q];
  }
  /* The frame from a camera moved up (tilt > 0, looking down at the people) or down (tilt < 0).
     rgba: W x H pixels; near: w x h (0 far .. 1 near). opts: ref (the people's nearness, they stay put), refY
     (their middle row, 0..1), lift (how far things slide per unit of nearness, a share of the height), pitch
     (radians of turn at tilt 1), zoom (extra), fit (false: don't zoom to cut off the empty edges). */
  function warp(rgba, W, H, near0, w, h, tilt, opts) {
    const o = opts || {};
    const T = clamp(tilt, -1, 1);
    const near = upsample(near0, w, h, W, H);
    const ref = o.ref == null ? 0.5 : o.ref;
    const P = (o.lift == null ? 0.14 : o.lift) * T * H;
    const EDGE = 0.04;
    /* 1. Each column slides by depth, as a 1D mesh with a nearness test (near wins). */
    const col = new Float32Array(W * H * 3),
      zb = new Float32Array(W * H).fill(-1),
      hole = new Uint8Array(W * H),
      ty = new Float32Array(H),
      gapTop = new Float32Array(W),
      gapBot = new Float32Array(W);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) ty[y] = y + P * (near[y * W + x] - ref);
      const put = (r, i, z) => {
        const t = r * W + x;
        if (z <= zb[t]) return;
        zb[t] = z;
        hole[t] = i < 0 ? 1 : 0;
        if (i < 0) return;
        col[t * 3] = rgba[i * 4];
        col[t * 3 + 1] = rgba[i * 4 + 1];
        col[t * 3 + 2] = rgba[i * 4 + 2];
      };
      const putMix = (r, i0, i1, f, z) => {
        const t = r * W + x;
        if (z <= zb[t]) return;
        zb[t] = z;
        hole[t] = 0;
        for (let c = 0; c < 3; c++) col[t * 3 + c] = rgba[i0 * 4 + c] * (1 - f) + rgba[i1 * 4 + c] * f;
      };
      for (let y = 0; y < H - 1; y++) {
        const i0 = y * W + x,
          i1 = i0 + W,
          t0 = ty[y],
          t1 = ty[y + 1],
          n0 = near[i0],
          n1 = near[i1];
        const lo = Math.max(0, Math.ceil(Math.min(t0, t1) - 0.5)),
          hi = Math.min(H - 1, Math.floor(Math.max(t0, t1) + 0.5));
        if (Math.abs(n0 - n1) > EDGE) {
          /* a depth edge: each side keeps its own pixel; the gap between them (what was hidden) is a hole, filled
             below from the far things around it */
          const fz = Math.min(n0, n1);
          for (let r = lo; r <= hi; r++) {
            if (Math.abs(r - t0) <= 0.5) put(r, i0, n0);
            else if (Math.abs(r - t1) <= 0.5) put(r, i1, n1);
            else put(r, -1, fz - 1e-4);
          }
        } else
          for (let r = lo; r <= hi; r++) {
            const f = t1 === t0 ? 0 : clamp((r - t0) / (t1 - t0), 0, 1);
            putMix(r, i0, i1, f, n0 + (n1 - n0) * f);
          }
      }
      /* rows nothing landed on (top and bottom edges): the nearest row that has something */
      let lastRow = -1;
      for (let r = 0; r < H; r++) {
        const t = r * W + x;
        if (zb[t] >= 0 && !hole[t]) {
          if (lastRow < 0) gapTop[x] = r;
          if (lastRow < 0) for (let q = 0; q < r; q++) for (let c = 0; c < 3; c++) col[(q * W + x) * 3 + c] = col[t * 3 + c];
          lastRow = r;
        } else if (lastRow >= 0 && zb[t] < 0) for (let c = 0; c < 3; c++) col[t * 3 + c] = col[(lastRow * W + x) * 3 + c];
      }
      gapBot[x] = lastRow < 0 ? 0 : H - 1 - lastRow;
      if (lastRow < 0) for (let r = 0; r < H; r++) for (let c = 0; c < 3; c++) col[(r * W + x) * 3 + c] = rgba[(r * W + x) * 4 + c];
    }
    fillHoles(col, hole, zb, W, H);
    /* 2. Turn the camera to look down (or up) at the people, keep them where they were, zoom to hide the edges. */
    const th = (o.pitch == null ? 0.14 : o.pitch) * T,
      f = 0.9 * Math.max(W, H),
      cx = W / 2,
      cy = H / 2,
      ys = clamp((o.refY == null ? 0.5 : o.refY) * H, H * 0.2, H * 0.8);
    /* zoom in (about the people) enough that the empty bands at the top and bottom (what slid in from outside the
       frame) are cut off, and a little more for the turn */
    const pct = (a) => Array.from(a).sort((p, q) => p - q)[Math.floor(a.length * 0.9)] || 0;
    const z = clamp((o.fit === false ? 1 : Math.max(ys / Math.max(1, ys - pct(gapTop)), (H - ys) / Math.max(1, H - ys - pct(gapBot)))) * (1 + (o.zoom == null ? 0.04 : o.zoom) * Math.abs(T)), 1, 1.3);
    const cs = Math.cos(th),
      sn = Math.sin(th);
    const shift = cy + f * Math.tan(Math.atan((ys - cy) / f) - th) - ys;
    const out = new Uint8ClampedArray(W * H * 4);
    for (let Y = 0; Y < H; Y++) {
      const yn = (ys + (Y - ys) / z + shift - cy) / f;
      for (let X = 0; X < W; X++) {
        const xn = (X - cx) / z / f;
        const dz = cs - yn * sn;
        const sx = clamp(cx + (f * xn) / dz, 0, W - 1),
          sy = clamp(cy + (f * (yn * cs + sn)) / dz, 0, H - 1);
        const x0 = Math.floor(sx),
          y0 = Math.floor(sy),
          x1 = Math.min(W - 1, x0 + 1),
          y1 = Math.min(H - 1, y0 + 1),
          fx = sx - x0,
          fy = sy - y0;
        const a = (y0 * W + x0) * 3,
          b = (y0 * W + x1) * 3,
          c = (y1 * W + x0) * 3,
          d = (y1 * W + x1) * 3,
          p = (Y * W + X) * 4;
        for (let k = 0; k < 3; k++) out[p + k] = (col[a + k] * (1 - fx) + col[b + k] * fx) * (1 - fy) + (col[c + k] * (1 - fx) + col[d + k] * fx) * fy;
        out[p + 3] = 255;
      }
    }
    return out;
  }

  /* mask.js's camera-angle stage. cut: this frame's cut-out ({ w, h, labels }). Uses the AI's depth when it has
     one (and asks it about this frame for next time), else the made-up depth; false when neither (mask.js then
     draws its two-layer tilt). */
  function tilt(ctx, W, H, cut, t) {
    if (!cut || !cut.labels) return false;
    if (!session && !loading && cfg.model.url && !failed) load();
    if (!session && !cfg.guess) return false;
    /* in a smooth Play (speed.js) the depth is asked about once a second at most */
    const gap = window.CurioSpeed && window.CurioSpeed.playing === "preview" ? 1000 : 0;
    if (session && !busy && performance.now() - asked >= gap) {
      busy = true;
      asked = performance.now();
      const S = window.CurioSpeed,
        t0 = S ? S.now() : 0;
      estimate(ctx.canvas)
        .catch(() => null)
        .then(() => {
          busy = false;
          if (S) S.mark("depth.estimate", t0); /* the depth AI, on its own (it runs beside the drawing) */
        });
    }
    const { w, h, labels } = cut;
    const g = guess(labels, w, h);
    const near = last ? fuse(g, labels, w, h, last) : g;
    /* the people's nearness and middle row: they stay where they are */
    let n = 0,
      s = 0,
      sy = 0;
    for (let i = 0; i < w * h; i++)
      if (labels[i] & 7) {
        n++;
        s += near[i];
        sy += (i / w) | 0;
      }
    const img = ctx.getImageData(0, 0, W, H);
    const out = warp(img.data, W, H, near, w, h, t, n > w * h * 0.003 ? { ref: s / n, refY: (sy / n + 0.5) / h } : {});
    img.data.set(out);
    ctx.putImageData(img, 0, 0);
    return true;
  }

  if (window.CurioAI)
    window.CurioAI.register("depth", "fastdepth", {
      label: "Free: FastDepth in your browser (private, no key)",
      where: "browser",
      cost: () => "free: it runs on your own computer",
      load,
      estimate,
    });

  window.CurioDepth = { configure, load, ready, failed: () => failed, estimate, guess, fuse, warp, tilt, spread, latest: () => last };
})();
