/* video/speed.js: a smooth Play with AI element changes on. The AI cut-out costs a few hundred milliseconds a
   frame on a laptop's processor, so while a clip plays:
   - the AI looks at every few frames only (`every`, 3), or sooner when the picture changes a lot; between, the
     last cut-out is moved along with the picture (block by block, measured from one small gray frame to the next,
     shutter.js's flow);
   - cut-outs are kept per moment of the clip (and per crop of it), so a second Play needs no AI at all;
   - with a worker (mask.js's `worker`), the AI runs beside the drawing, never in its way.
   Saving a video and the check still cut out every frame, unless the preview mode is turned on for them too.
   And a timing breakdown per stage, behind a flag (`configure({ timing: true })`, `?videotiming` in the address,
   or localStorage `curio-video-timing` = 1): `report()` gives the average and slowest milliseconds per stage.
   Arithmetic only (Node tests feed it made-up frames); grayOf() needs a page.

   window.CurioSpeed
   - configure({ timing, preview, every, cache }) -> settings   preview: Play's speed-ups (on); every: AI every
                                                                  n-th frame in Play; cache: frames kept per clip
   - now(), mark(stage, t0), report(), reset()                    the timing (mark does nothing when it is off)
   - moveLabels(labels, w, h, field, aw) -> labels                a cut-out moved by a block field (flow on aw wide)
   - cutter({ cut, gray, cache?, every?, async? }) -> { get(img, { t, key }), stats }   one Play's cut-outs */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const cfg = { timing: false, preview: true, every: 3, previewW: 320, cutW: 160, cache: 600, change: 0.08, maxAge: 0.6, follow: 3 };
  try {
    if (root.location && /[?&]videotiming\b/.test(root.location.search)) cfg.timing = true;
    if (root.localStorage && root.localStorage.getItem("curio-video-timing") === "1") cfg.timing = true;
  } catch (e) {}
  const perf = root.performance || { now: () => Date.now() };
  const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

  function configure(o) {
    if (o) for (const k of Object.keys(cfg)) if (o[k] != null) cfg[k] = typeof cfg[k] === "boolean" ? !!o[k] : Number(o[k]);
    return Object.assign({}, cfg);
  }

  /* ---------- timing ---------- */
  let stages = {};
  const now = () => (cfg.timing ? perf.now() : 0);
  /* Adds the time since t0 to a stage. Stages with a dot (cut.segment) are a part of the one before the dot. */
  function mark(name, t0) {
    if (!cfg.timing) return;
    const ms = perf.now() - t0,
      s = stages[name] || (stages[name] = { n: 0, total: 0, max: 0 });
    s.n++;
    s.total += ms;
    if (ms > s.max) s.max = ms;
  }
  /* { stage: { n, avg, max } }, in milliseconds */
  function report() {
    const out = {};
    Object.keys(stages)
      .sort()
      .forEach((k) => {
        const s = stages[k];
        out[k] = { n: s.n, avg: Math.round((s.total / s.n) * 10) / 10, max: Math.round(s.max * 10) / 10 };
      });
    return out;
  }
  const reset = () => (stages = {});

  /* ---------- a cut-out moved with the picture ---------- */
  /* The block field from shutter.js's flow (where each block of the new frame came from in the old one), with
     each clear block's movement the middle one among its clear neighbours (one wrong match is outvoted), and
     plain blocks (no detail, no clear match) taking their neighbours' movement, or the whole picture's. */
  function fill(F) {
    const { gw, gh, vx, vy, ok } = F,
      n = gw * gh;
    const fx = new Float32Array(n),
      fy = new Float32Array(n),
      have = new Uint8Array(n);
    const mid = (a) => a.sort((x, y) => x - y)[(a.length - 1) >> 1];
    const allX = [],
      allY = [];
    for (let k = 0; k < n; k++) if (ok[k]) allX.push(vx[k]), allY.push(vy[k]);
    const gx = allX.length ? mid(allX) : 0,
      gy = allY.length ? mid(allY) : 0;
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        const xs = [],
          ys = [];
        for (let jj = Math.max(0, j - 1); jj <= Math.min(gh - 1, j + 1); jj++)
          for (let ii = Math.max(0, i - 1); ii <= Math.min(gw - 1, i + 1); ii++) {
            const q = jj * gw + ii;
            if (ok[q]) xs.push(vx[q]), ys.push(vy[q]);
          }
        const k = j * gw + i;
        if (xs.length) (fx[k] = mid(xs)), (fy[k] = mid(ys)), (have[k] = 1);
      }
    /* still unknown: grow from known neighbours a few times, then the whole picture's movement */
    for (let pass = 0; pass < 3; pass++) {
      const add = [];
      for (let j = 0; j < gh; j++)
        for (let i = 0; i < gw; i++) {
          const k = j * gw + i;
          if (have[k]) continue;
          let sx = 0,
            sy = 0,
            c = 0;
          for (let jj = Math.max(0, j - 1); jj <= Math.min(gh - 1, j + 1); jj++)
            for (let ii = Math.max(0, i - 1); ii <= Math.min(gw - 1, i + 1); ii++) {
              const q = jj * gw + ii;
              if (have[q]) (sx += fx[q]), (sy += fy[q]), c++;
            }
          if (c) add.push([k, sx / c, sy / c]);
        }
      if (!add.length) break;
      add.forEach(([k, x, y]) => ((fx[k] = x), (fy[k] = y), (have[k] = 1)));
    }
    for (let k = 0; k < n; k++) if (!have[k]) (fx[k] = gx), (fy[k] = gy);
    return { gw, gh, bs: F.bs, fx, fy };
  }
  /* labels (w x h) moved by a block field measured on gray frames aw x ah (raw from flow, or filled; no field: not
     moved): each pixel takes
     the label of the spot it came from (nearest, so labels stay whole numbers). ow x oh: the size to give back
     (w x h unless asked). */
  function moveLabels(labels, w, h, F, aw, ah, ow, oh) {
    ow = ow || w;
    oh = oh || h;
    const B = !F ? { gw: 1, gh: 1, bs: 1, fx: [0], fy: [0] } : F.fx ? F : fill(F),
      { gw, gh, bs, fx, fy } = B;
    const kx = aw / ow,
      ky = ah / oh, /* gray pixels per output pixel */
      sx0 = w / ow,
      sy0 = h / oh; /* label pixels per output pixel */
    const out = new Uint8Array(ow * oh);
    for (let y = 0; y < oh; y++) {
      const gyf = clamp(((y + 0.5) * ky) / bs - 0.5, 0, gh - 1),
        j0 = Math.floor(gyf),
        j1 = Math.min(gh - 1, j0 + 1),
        ty = gyf - j0;
      for (let x = 0; x < ow; x++) {
        const gxf = clamp(((x + 0.5) * kx) / bs - 0.5, 0, gw - 1),
          i0 = Math.floor(gxf),
          i1 = Math.min(gw - 1, i0 + 1),
          tx = gxf - i0;
        const a = j0 * gw + i0,
          b = j0 * gw + i1,
          c = j1 * gw + i0,
          e = j1 * gw + i1;
        const mx = (fx[a] * (1 - tx) + fx[b] * tx) * (1 - ty) + (fx[c] * (1 - tx) + fx[e] * tx) * ty,
          my = (fy[a] * (1 - tx) + fy[b] * tx) * (1 - ty) + (fy[c] * (1 - tx) + fy[e] * tx) * ty;
        const sx = clamp(Math.floor((x + 0.5 - mx / kx) * sx0), 0, w - 1),
          sy = clamp(Math.floor((y + 0.5 - my / ky) * sy0), 0, h - 1);
        out[y * ow + x] = labels[sy * w + sx];
      }
    }
    return out;
  }
  /* How different two gray frames of width w are (0..1): the mean step between their 8 x 8 averages, so people
     moving inside the picture count little and a new shot a lot. */
  function change(a, b, w) {
    if (!a || !b || a.length !== b.length) return 1;
    w = w || (root.CurioShutter && root.CurioShutter.AW) || 128;
    const h = Math.floor(a.length / w),
      gw = w >> 3,
      gh = h >> 3;
    if (!gw || !gh) {
      let s = 0;
      for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
      return s / a.length;
    }
    let s = 0;
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        let d = 0;
        for (let y = j * 8; y < j * 8 + 8; y++) for (let x = i * 8; x < i * 8 + 8; x++) d += a[y * w + x] - b[y * w + x];
        s += Math.abs(d) / 64;
      }
    return s / (gw * gh);
  }

  /* ---------- cut-outs kept per moment of a clip ---------- */
  /* One clip's store: per crop (key), the AI's cut-outs by clip time, with the small gray frame each was made on.
     At most cfg.cache in all; the oldest go first. */
  function store() {
    const byKey = new Map(),
      order = [];
    return {
      put(key, t, e) {
        e.t = t;
        e.key = key;
        let a = byKey.get(key);
        if (!a) byKey.set(key, (a = []));
        let i = 0;
        while (i < a.length && a[i].t < t) i++;
        if (a[i] && Math.abs(a[i].t - t) < 1e-4) a[i] = e;
        else a.splice(i, 0, e);
        order.push(e);
        while (order.length > cfg.cache) {
          const old = order.shift(),
            b = byKey.get(old.key),
            j = b ? b.indexOf(old) : -1;
          if (j >= 0) b.splice(j, 1);
        }
      },
      /* the one nearest in time, within maxAge seconds */
      near(key, t, maxAge) {
        const a = byKey.get(key);
        if (!a || !a.length) return null;
        let lo = 0,
          hi = a.length - 1;
        while (lo < hi) {
          const m = (lo + hi) >> 1;
          if (a[m].t < t) lo = m + 1;
          else hi = m;
        }
        let best = null;
        for (const e of [a[lo - 1], a[lo]]) if (e && Math.abs(e.t - t) <= maxAge && (!best || Math.abs(e.t - t) < Math.abs(best.t - t))) best = e;
        return best;
      },
      size: () => order.length,
      clear() {
        byKey.clear();
        order.length = 0;
      },
    };
  }

  /* Fields of movement, on blocks: { gw, gh, bs, fx, fy } (gray pixels; a pixel x of the later frame came from
     x - f(x) in the earlier one). still: no movement. compose(T, s): T from frame a to b, then s from b to c, gives
     a to c (a pixel came from x - s(x) in b, and that from there - T(there) in a). */
  const still = (gw, gh, bs) => ({ gw, gh, bs, fx: new Float32Array(gw * gh), fy: new Float32Array(gw * gh) });
  function sample(F, x, y) {
    const { gw, gh, bs, fx, fy } = F;
    const gx = clamp(x / bs - 0.5, 0, gw - 1),
      gy = clamp(y / bs - 0.5, 0, gh - 1),
      i0 = Math.floor(gx),
      j0 = Math.floor(gy),
      i1 = Math.min(gw - 1, i0 + 1),
      j1 = Math.min(gh - 1, j0 + 1),
      tx = gx - i0,
      ty = gy - j0;
    const a = j0 * gw + i0,
      b = j0 * gw + i1,
      c = j1 * gw + i0,
      e = j1 * gw + i1;
    return [(fx[a] * (1 - tx) + fx[b] * tx) * (1 - ty) + (fx[c] * (1 - tx) + fx[e] * tx) * ty, (fy[a] * (1 - tx) + fy[b] * tx) * (1 - ty) + (fy[c] * (1 - tx) + fy[e] * tx) * ty];
  }
  function compose(T, S) {
    const { gw, gh, bs } = S,
      out = still(gw, gh, bs);
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i,
          sx = S.fx[k],
          sy = S.fy[k];
        const [tx, ty] = sample(T, (i + 0.5) * bs - sx, (j + 0.5) * bs - sy);
        out.fx[k] = sx + tx;
        out.fy[k] = sy + ty;
      }
    return out;
  }

  /* One Play's cut-outs. o.cut(img, { track, t }) -> { w, h, labels }: the AI, now. o.cutAsync(img, { t }) ->
     Promise of the same, or null when it can't (no worker): the AI beside the drawing. o.gray(img) -> { g, w, h }:
     the picture small and gray (0..1). o.cache: the clip's store, kept from one Play to the next. o.fps: frames a
     second the clip is drawn at (30). get(img, { t, key }) gives this frame's cut-out:
     - kept from before at this very moment: that one;
     - else the newest of the AI's answers (kept from before or just in), moved with the picture: the movement is
       measured from each drawn frame to the next (block by block) and added up since that answer's frame, so a
       slow AI (an answer a second late) still lands where the people are now;
     - a new shot (a cut, a jump) starts again: the AI looks (the frame goes without the element changes until it
       answers, except a Play's first frame, or without a worker, where the page waits for it);
     - the AI is asked again when its answer is `every` frames old (in the page: after `every` frames drawn). */
  function cutter(o) {
    const SH = () => root.CurioShutter;
    const every = o.every || cfg.every,
      fps = o.fps || 30,
      st = o.cache || store();
    const stats = { ai: 0, moved: 0, kept: 0, async: 0, none: 0, shots: 0 };
    /* o.cutW: the cut-outs handed on are this wide at most (the per-pixel work on them is 4 times less at half) */
    const size = (k) => {
      const ow = o.cutW && k.w > o.cutW ? o.cutW : k.w;
      return [ow, ow === k.w ? k.h : Math.max(2, Math.round((ow * k.h) / k.w))];
    };
    const small = (e) => {
      const [ow, oh] = size(e.k);
      if (ow === e.k.w) return e.k;
      return e.s || (e.s = { w: ow, h: oh, labels: moveLabels(e.k.labels, e.k.w, e.k.h, null, 1, 1, ow, oh) });
    };
    let busy = false,
      n = 0 /* frames drawn */,
      lastAI = -Infinity /* the frame the AI last looked at in the page */,
      prev = null /* the last frame's gray */,
      anchor = null /* { e, T }: the answer moved from, and the movement since its frame */;
    const hist = []; /* the last frames' steps: { n, S } */
    const answers = []; /* the worker's answers, not used yet: { e, n } */
    function fresh(img, t, key, G) {
      const t0 = now();
      const k = o.cut(img, { track: "play", t });
      mark("cut.ai", t0);
      if (!k) return null;
      stats.ai++;
      lastAI = n;
      const e = { k, g: G.g };
      st.put(key, t, e);
      anchor = { e, T: null };
      return small(e);
    }
    function ask(img, key, t, G) {
      const p = o.cutAsync ? o.cutAsync(img, { t }) : null;
      if (!p) return false;
      busy = true;
      stats.async++;
      const at = n;
      p.then((k) => {
        busy = false;
        if (!k) return;
        stats.ai++;
        const e = { k, g: G.g };
        st.put(key, t, e);
        answers.push({ e, n: at });
      }).catch(() => (busy = false));
      return true;
    }
    /* the movement from frame m (its gray) to now: the steps since, added up (or measured straight across when
       they are not all kept) */
    function since(m, g, G) {
      const steps = hist.filter((h) => h.n > m);
      if (steps.length && steps[0].n === m + 1 && steps.length === n - m) return steps.reduce((T, h) => (T ? compose(T, h.S) : h.S), null);
      return fill(SH().flow(g, G.g, G.w, G.h));
    }
    function get(img, q) {
      const t = q.t || 0,
        key = q.key || "";
      const G = o.gray(img);
      n++;
      /* this frame's step from the last one; a new shot drops everything found before */
      let cut = !prev || prev.w !== G.w || prev.g.length !== G.g.length || change(prev.g, G.g, G.w) > cfg.change;
      let S = null;
      if (!cut) {
        const t0 = now();
        S = change(prev.g, G.g, G.w) < 0.002 ? still(Math.floor(G.w / 8), Math.floor(G.h / 8), 8) : fill(SH().flow(prev.g, G.g, G.w, G.h));
        mark("cut.flow", t0);
        hist.push({ n, S });
        if (hist.length > 90) hist.shift();
      } else {
        if (prev) stats.shots++;
        hist.length = 0;
        answers.length = 0;
        anchor = null;
      }
      prev = G;
      if (anchor) anchor.T = anchor.T ? (S ? compose(anchor.T, S) : anchor.T) : S;
      if (anchor && anchor.e.key !== key) anchor = null;
      /* kept from before at this very moment */
      const c = st.near(key, t, cfg.maxAge);
      if (c && Math.abs(c.t - t) * fps < 0.5 && change(c.g, G.g, G.w) <= cfg.change) {
        stats.kept++;
        anchor = { e: c, T: null };
        return small(c);
      }
      /* the worker's newest answer, moved from its frame to now */
      while (answers.length) {
        const a = answers.shift();
        if (a.e.key !== key || n - a.n > 90) continue;
        anchor = { e: a.e, T: a.n === n ? null : since(a.n, a.e.g, G) };
      }
      /* a kept answer nearer in time than the one followed (a second Play) */
      if (c && change(c.g, G.g, G.w) <= cfg.change && (!anchor || Math.abs(c.t - t) < Math.abs(anchor.e.t - t) - 0.5 / fps)) anchor = { e: c, T: fill(SH().flow(c.g, G.g, G.w, G.h)) };
      if (anchor && Math.abs(anchor.e.t - t) > cfg.follow) anchor = null; /* too old to trust */
      if (!anchor) {
        /* nothing to move: the AI looks */
        if ((n > 1 && !busy && ask(img, key, t, G)) || (busy && n > 1)) return stats.none++, null;
        return fresh(img, t, key, G);
      }
      /* due again */
      if (Math.abs(anchor.e.t - t) * fps >= every - 0.5) {
        if (!busy && !ask(img, key, t, G) && n - lastAI >= every) return fresh(img, t, key, G);
      }
      const k = anchor.e.k,
        T = anchor.T;
      if (!T) return small(anchor.e);
      const t0 = now();
      const [ow, oh] = size(k);
      const out = { w: ow, h: oh, labels: moveLabels(k.labels, k.w, k.h, T, G.w, G.h, ow, oh), moved: true };
      stats.moved++;
      mark("cut.move", t0);
      return out;
    }
    return { get, stats, cache: st };
  }

  /* In the page: a picture as gray AW wide (shutter.js's width, for its flow), one draw and one read. */
  const gc = { c: null, x: null };
  function grayOf(img) {
    const AW = (root.CurioShutter && root.CurioShutter.AW) || 128;
    const iw = img.width || img.videoWidth,
      ih = img.height || img.videoHeight;
    const h = Math.max(8, Math.round((AW * ih) / iw)) & ~1;
    if (!gc.c || gc.c.height !== h) {
      gc.c = Object.assign(document.createElement("canvas"), { width: AW, height: h });
      gc.x = gc.c.getContext("2d", { willReadFrequently: true });
    }
    gc.x.drawImage(img, 0, 0, AW, h);
    const d = gc.x.getImageData(0, 0, AW, h).data,
      g = new Float32Array(AW * h);
    for (let i = 0; i < g.length; i++) g[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255;
    return { g, w: AW, h };
  }
  /* Each clip's store, kept while the clip is open. */
  const stores = new WeakMap();
  function storeFor(clip) {
    if (!clip || typeof clip !== "object") return store();
    if (!stores.has(clip)) stores.set(clip, store());
    return stores.get(clip);
  }

  root.CurioSpeed = { configure, now, mark, report, reset, moveLabels, fill, compose, change, store, storeFor, cutter, grayOf };
})();
