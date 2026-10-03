/* video/clip.js: the browser half of taking a clip apart and applying it to another: reads a video file's
   frames and sound, draws a clip with another clip's curiosities applied, checks the result, and records it.
   All arithmetic is in video/measure.js (window.CurioVideo).

   window.CurioClip
   - open(file | url, name?) -> Promise<{ name, url, video, duration, width, height, file }>
   - dissect(clip, { fps?, onProgress? }) -> Promise<dissection>   frames by seeking (up to 15 looks a second, at most 900), sound
     by decoding the file (when the browser can)
   - pcm(clip) -> Promise<{ data: Float32Array, rate } | null>       the sound as one channel
   - drawApplied(ctx, video, adj, W, H)                               one output frame with a plan's changes
                                                                      (looks.js draws the palette, grain and frame shape)
   - check(plan, clip, group?, { onProgress? }) -> Promise<{ after, scores }>   renders the applied clip frame by
     frame (no recording), measures it again, and scores each group against the inspiration
   - render(plan, clip, { canvas, record?, speak?, onFrame? }) -> Promise<Blob | null>   plays the applied clip
     in real time on a canvas (with its sound changed too) and, with record, returns it as a video file
   - stop()                                                             stops a render */
(function () {
  const V = () => window.CurioVideo;
  const STAT_W = 96,
    GRAY_W = 64,
    MAX_LOOKS = 900; /* a camera's wobble is fast: up to 15 looks a second, 900 in all */
  let stopper = null;

  function open(src, name) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";
      const isFile = typeof src !== "string";
      const url = isFile ? URL.createObjectURL(src) : src;
      const finish = () => {
        if (!isFinite(video.duration) || !video.videoWidth) return reject(new Error("This browser can't read that video's picture. Try an .mp4 or .webm file."));
        video.currentTime = 0;
        resolve({ name: name || (isFile ? src.name : url.split("/").pop()), url, video, duration: video.duration, width: video.videoWidth, height: video.videoHeight, file: isFile ? src : null });
      };
      /* A video recorded in a browser often does not say how long it is until you look at its end. */
      const done = () => {
        if (isFinite(video.duration) || !video.videoWidth) return finish();
        video.addEventListener("durationchange", function once() {
          if (!isFinite(video.duration)) return;
          video.removeEventListener("durationchange", once);
          finish();
        });
        video.currentTime = 1e9;
      };
      video.addEventListener("loadeddata", done, { once: true });
      video.addEventListener("error", () => reject(new Error("This browser can't open that video. Try an .mp4 or .webm file.")), { once: true });
      video.src = url;
      video.load();
    });
  }
  function seek(video, t) {
    return new Promise((resolve) => {
      const target = Math.max(0, Math.min(t, (video.duration || 0) - 0.001));
      if (Math.abs(video.currentTime - target) < 1e-4 && video.readyState >= 2) return resolve();
      const done = () => {
        video.removeEventListener("seeked", done);
        resolve();
      };
      video.addEventListener("seeked", done);
      video.currentTime = target;
    });
  }
  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  /* The sound as one channel. Big files are read whole, so very long clips may be slow; a clip the browser cannot
     decode just has no sound curiosities. */
  const pcmCache = new WeakMap();
  async function pcm(clip) {
    if (pcmCache.has(clip)) return pcmCache.get(clip);
    let out = null;
    try {
      if (clip.file && clip.file.size > 600e6) throw new Error("too big");
      const buf = clip.file ? await clip.file.arrayBuffer() : await (await fetch(clip.url)).arrayBuffer();
      if (buf.byteLength > 600e6) throw new Error("too big");
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ctx = new AC(1, 16000, 16000);
      const audio = await ctx.decodeAudioData(buf);
      const n = audio.length;
      const data = new Float32Array(n);
      for (let c = 0; c < audio.numberOfChannels; c++) {
        const ch = audio.getChannelData(c);
        for (let i = 0; i < n; i++) data[i] += ch[i] / audio.numberOfChannels;
      }
      out = { data, rate: audio.sampleRate };
    } catch (e) {
      out = null;
    }
    pcmCache.set(clip, out);
    return out;
  }
  /* Frames at even times: stats on a small copy, brightness on a smaller one for the camera's slide. */
  async function frames(clip, times, draw, onProgress) {
    const FW = GRAY_W * 2;
    const h = Math.max(2, Math.round((STAT_W * clip.height) / clip.width)),
      gh = Math.max(2, Math.round((GRAY_W * clip.height) / clip.width)),
      fh = gh * 2;
    const f = canvas(FW, fh),
      a = canvas(STAT_W, h),
      b = canvas(GRAY_W, gh);
    const fx = f.getContext("2d", { willReadFrequently: true }),
      ax = a.getContext("2d", { willReadFrequently: true }),
      bx = b.getContext("2d", { willReadFrequently: true });
    const samples = [];
    let prev = null,
      prevFine = null;
    for (let i = 0; i < times.length; i++) {
      await draw(fx, FW, fh, times[i], i);
      ax.drawImage(f, 0, 0, STAT_W, h);
      bx.drawImage(f, 0, 0, GRAY_W, gh);
      const s = V().frameStats(ax.getImageData(0, 0, STAT_W, h).data, STAT_W, h);
      const g = V().toGray(bx.getImageData(0, 0, GRAY_W, gh).data, GRAY_W, gh);
      const gf = V().toGray(fx.getImageData(0, 0, FW, fh).data, FW, fh);
      if (window.CurioFraming) s.roll = window.CurioFraming.roll(gf, FW, fh); /* the horizon's roll, for a dutch tilt */
      samples.push({ t: times[i], s, m: prev ? V().motion(prev, g, GRAY_W, gh, 5, { prev: prevFine, cur: gf, w: FW, h: fh }) : null });
      prev = g;
      prevFine = gf;
      if (onProgress && i % 5 === 0) onProgress(i / times.length);
    }
    return { samples, gw: GRAY_W };
  }
  function evenTimes(duration, fps, maxLooks) {
    const n = Math.max(2, Math.min(maxLooks || MAX_LOOKS, Math.round(duration * fps)));
    const out = [];
    for (let i = 0; i < n; i++) out.push(Math.min(duration - 0.02, (i * duration) / n + 0.01));
    return out;
  }
  async function dissect(clip, opts) {
    opts = opts || {};
    const fps = opts.fps || Math.max(6, Math.min(15, MAX_LOOKS / Math.max(0.1, clip.duration)));
    /* Never more than maxLooks seeks in all (900 unless asked for fewer), so a long film is looked at more sparsely. */
    const times = evenTimes(clip.duration, fps, opts.maxLooks);
    const prog = (p) => opts.onProgress && opts.onProgress(p * 0.85, "Looking at the picture");
    /* Black bars around the picture (a letterboxed export or film) are not part of it: find the picture at a few
       moments first and measure only that, or the bars would count as dark and flat. */
    let box = { x: 0, y: 0, w: clip.width, h: clip.height };
    if (clip.width && clip.height && opts.bars !== false) {
      for (let i = 0; i < 6; i++) {
        await seek(clip.video, Math.min(clip.duration - 0.05, ((i + 0.5) * clip.duration) / 6));
        box = contentBox(clip.video);
      }
      if (box.w > clip.width * 0.97 && box.h > clip.height * 0.97) box = { x: 0, y: 0, w: clip.width, h: clip.height };
    }
    const fr = await frames(
      { width: box.w, height: box.h },
      times,
      async (ctx, w, h, t) => {
        await seek(clip.video, t);
        ctx.drawImage(clip.video, box.x, box.y, box.w, box.h, 0, 0, w, h);
      },
      prog
    );
    if (opts.onProgress) opts.onProgress(0.88, "Listening to the sound");
    /* The sound is decoded whole, so it is skipped when asked (sound: false) or the file is bigger than maxSoundBytes
       (300 MB unless set): those clips get no loudness or talking lanes. */
    const big = clip.file && clip.file.size > (opts.maxSoundBytes || 300e6);
    const p = opts.sound === false || big ? null : await pcm(clip);
    const sound = p ? V().envelope(p.data, p.rate) : null;
    const d = V().analyze({ name: clip.name, duration: clip.duration, aspect: box.h / box.w, samples: fr.samples, gw: fr.gw, sound });
    /* Its looks: palette, grain and sharpness, picture shape (video/looks.js), unless turned off. */
    if (opts.looks !== false && window.CurioLooks) {
      if (opts.onProgress) opts.onProgress(0.9, "Looking at its colors, grain and frame");
      d.looks = await window.CurioLooks.scan(clip, { onProgress: (p) => opts.onProgress && opts.onProgress(0.9 + p * 0.02, "Looking at its colors, grain and frame") });
    }
    /* The elements (AI cut-outs of the people, their hair, faces and clothes, and the set), unless turned off. */
    if (opts.elements !== false && window.CurioMask) {
      if (opts.onProgress) opts.onProgress(0.92, "Finding the people and their clothes (AI)");
      d.elements = await window.CurioMask.scan(clip, { box, onProgress: (p) => opts.onProgress && opts.onProgress(0.92 + p * 0.08, "Finding the people and their clothes (AI)") });
      if (!d.elements) delete d.elements;
    }
    if (opts.onProgress) opts.onProgress(1, "Done");
    return d;
  }

  /* A steadier that watches the frames as they play: how far the camera slid since the last frame (to a fraction
     of a pixel), its path, and the fast part of that path (its wobble), so a frame can be moved against it. */
  function steadier() {
    const W = 128;
    let c = null,
      cx = null,
      prev = null,
      prevSmall = null,
      lastSrc = null,
      px = 0,
      py = 0,
      sx = 0,
      sy = 0;
    return {
      update(video, src) {
        if (!c) {
          const h = Math.max(2, Math.round((W * video.videoHeight) / video.videoWidth));
          c = canvas(W, h);
          cx = c.getContext("2d", { willReadFrequently: true });
          c.small = canvas(W / 2, Math.max(2, Math.round(h / 2)));
          c.sx = c.small.getContext("2d", { willReadFrequently: true });
        }
        cx.drawImage(video, 0, 0, c.width, c.height);
        c.sx.drawImage(c, 0, 0, c.small.width, c.small.height);
        const g = V().toGray(cx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
        const gs = V().toGray(c.sx.getImageData(0, 0, c.small.width, c.small.height).data, c.small.width, c.small.height);
        const dt = lastSrc == null ? 0 : src - lastSrc;
        if (prev && dt > 0 && dt < 0.3) {
          const m = V().motion(prevSmall, gs, c.small.width, c.small.height, 5, { prev, cur: g, w: c.width, h: c.height });
          if (m.err < 0.12) {
            px += -m.dx / c.small.width;
            py += -m.dy / c.small.width;
          }
          const k = 1 - Math.exp(-dt / 0.12);
          sx += (px - sx) * k;
          sy += (py - sy) * k;
        } else {
          px = py = sx = sy = 0;
        }
        prev = g;
        prevSmall = gs;
        lastSrc = src;
        return { x: px - sx, y: py - sy };
      },
    };
  }
  /* Put the frame-exact wobble in place of the dissection's, then hold the slide inside the edge. */
  function steadyAdj(adj, st, video) {
    if (adj.unsteadyX == null || !st) return adj;
    const w = st.update(video, adj.src);
    const amt = adj.unsteadyAmount == null ? 1 : adj.unsteadyAmount;
    const a = Object.assign({}, adj);
    a.dx = adj.dx + adj.unsteadyX - Math.max(-0.06, Math.min(0.06, w.x)) * amt;
    a.dy = adj.dy + adj.unsteadyY - Math.max(-0.06, Math.min(0.06, w.y)) * amt;
    if (adj.margin) {
      a.dx = Math.max(-adj.margin.x, Math.min(adj.margin.x, a.dx));
      a.dy = Math.max(-adj.margin.y, Math.min(adj.margin.y, a.dy));
    }
    return a;
  }

  /* The part of a video's frame that is picture, not black bars: rows and columns at the edges that are black in
     this frame are trimmed. Remembered per video, and widened (never narrowed) as more frames are seen, so a
     dark moment does not shrink it. */
  function contentBox(v) {
    const vw = v.videoWidth,
      vh = v.videoHeight;
    const S = 96,
      sh = Math.max(2, Math.round((S * vh) / vw));
    const c = (contentBox.c = contentBox.c || canvas(S, sh));
    if (c.width !== S || c.height !== sh) {
      c.width = S;
      c.height = sh;
    }
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(v, 0, 0, S, sh);
    const d = x.getImageData(0, 0, S, sh).data;
    const lit = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] > 20;
    const rowLit = (y) => {
      for (let i = 0; i < S; i++) if (lit((y * S + i) * 4)) return true;
      return false;
    };
    const colLit = (xx) => {
      for (let y = 0; y < sh; y++) if (lit((y * S + xx) * 4)) return true;
      return false;
    };
    let t = 0,
      b = sh - 1,
      l = 0,
      r = S - 1;
    while (t < b && !rowLit(t)) t++;
    while (b > t && !rowLit(b)) b--;
    while (l < r && !colLit(l)) l++;
    while (r > l && !colLit(r)) r--;
    const k = vw / S;
    const now = { x: l * k, y: (t * vh) / sh, w: (r - l + 1) * k, h: ((b - t + 1) * vh) / sh };
    const old = v.__curioBox;
    const box =
      old && old.vw === vw
        ? { vw, x: Math.min(old.x, now.x), y: Math.min(old.y, now.y), w: Math.max(old.x + old.w, now.x + now.w) - Math.min(old.x, now.x), h: Math.max(old.y + old.h, now.y + now.h) - Math.min(old.y, now.y) }
        : Object.assign({ vw }, now);
    if (box.w < vw * 0.2 || box.h < vh * 0.2) return { x: 0, y: 0, w: vw, h: vh }; /* a black frame: use it all */
    v.__curioBox = box;
    return box;
  }

  /* One output frame: zoom and slide (camera curiosities), then light and color, then the new line as a
     subtitle. */
  function drawApplied(ctx, video, adj, W, H, opts) {
    opts = opts || {};
    /* Shot framing (framing.js): a virtual camera's crop of the frame; the other camera changes work inside it. */
    const F = adj.frame && window.CurioFraming ? window.CurioFraming.rect(adj.frame, video.videoWidth, video.videoHeight) : null;
    const vw = F ? F.w : video.videoWidth,
      vh = F ? F.h : video.videoHeight;
    const z = Math.max(1, adj.zoom || 1);
    const sw = vw / z,
      sh = vh / z;
    let cx = vw / 2,
      cy = vh / 2;
    if (z > 1.001) {
      cx = vw * (0.5 + ((adj.cx == null ? 0.5 : adj.cx) - 0.5) * 0.6);
      cy = vh * (0.5 + ((adj.cy == null ? 0.5 : adj.cy) - 0.5) * 0.6);
    }
    cx += (adj.dx || 0) * vw;
    cy += (adj.dy || 0) * vw;
    const sx = Math.max(0, Math.min(vw - sw, cx - sw / 2)),
      sy = Math.max(0, Math.min(vh - sh, cy - sh / 2));
    if (F && F.roll) {
      /* a dutch tilt: the whole frame turned about the crop's middle (the crop sits far enough in to fill) */
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(F.roll);
      ctx.scale(W / sw, H / sh);
      ctx.drawImage(video, -(F.x + sx + sw / 2), -(F.y + sy + sh / 2));
      ctx.restore();
    } else ctx.drawImage(video, (F ? F.x : 0) + sx, (F ? F.y : 0) + sy, sw, sh, 0, 0, W, H);
    /* Cut out the people before the light and contrast change: a darkened, hard-contrast frame confuses the AI. */
    const M = adj.parts && window.CurioMask && window.CurioMask.ready() ? window.CurioMask : null;
    const k = M ? M.cut(ctx.canvas, { track: "applied", t: video.currentTime }) : null;
    if (adj.want || adj.luma !== 1 || adj.contrast !== 1 || adj.sat !== 1 || adj.warm) {
      const img = ctx.getImageData(0, 0, W, H);
      const d = img.data;
      /* Measure this frame as it is now (zoomed and slid), then set the gains to land on the inspiration's. */
      const have = V().quickStats(d, 7);
      const a = V().fitLook(adj, have);
      const before = k && (a.warm || a.sat !== 1) ? new Uint8ClampedArray(d) : null;
      V().paint(d, W, H, a, have.luma);
      if (before) M.keepSkin(d, before, k, W, H);
      ctx.putImageData(img, 0, 0);
    }
    /* The inspiration's palette (video/looks.js); its grain, softness and frame shape go on last. */
    const LK = adj.looks && window.CurioLooks;
    if (LK) LK.draw(ctx, W, H, adj.looks, "color", adj.t);
    /* Element changes (AI cut-outs): recolor clothes or hair, resize or move the people, another clip's set. */
    if (M) {
      /* another clip's set: only its picture, not its black bars */
      const sv = adj.parts.background && opts.setVideo && opts.setVideo.videoWidth ? opts.setVideo : null;
      M.applyParts(ctx, W, H, adj.parts, { setVideo: opts.setVideo, setBox: sv ? contentBox(sv) : null, cut: k });
    }
    /* The inspiration's graphics on top, background taken out, fitted inside the frame. */
    if (adj.overlay && opts.overlay && opts.overlay.videoWidth) {
      const ov = opts.overlay;
      const c = (drawApplied.layer = drawApplied.layer && drawApplied.layer.width === W && drawApplied.layer.height === H ? drawApplied.layer : canvas(W, H));
      const lx = c.getContext("2d", { willReadFrequently: true });
      lx.clearRect(0, 0, W, H);
      /* Black bars around the graphic (a letterboxed export) are not part of it: find its picture and fit that. */
      const box = contentBox(ov);
      const k = Math.min(W / box.w, H / box.h);
      const ow = box.w * k,
        oh = box.h * k;
      lx.drawImage(ov, box.x, box.y, box.w, box.h, (W - ow) / 2, (H - oh) / 2, ow, oh);
      const img = lx.getImageData(0, 0, W, H);
      V().keyOut(img.data, adj.overlay.amount);
      lx.putImageData(img, 0, 0);
      ctx.drawImage(c, 0, 0);
    }
    if (LK) LK.draw(ctx, W, H, adj.looks, "finish", adj.t);
    if (adj.line && opts.captions !== false) {
      const fs = Math.max(12, Math.round(H / 16));
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = Math.max(3, fs / 5);
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.fillStyle = "#fff";
      ctx.strokeText(adj.line.text, W / 2, H - fs * 0.6, W * 0.94);
      ctx.fillText(adj.line.text, W / 2, H - fs * 0.6, W * 0.94);
    }
  }

  /* The applied clip's sound, worked out offline: the clip's sound taken in the time map's order, turned up and
     down by the plan, the clip's own voices stepped back under the new lines. (The new voice itself is spoken
     live by the browser and is not in this.) */
  function appliedPcm(plan, src) {
    const rate = src.rate,
      n = Math.round(plan.duration * rate);
    const out = new Float32Array(n);
    const per = Math.round(rate / plan.fps);
    for (let k = 0; k * per < n; k++) {
      const t = k / plan.fps;
      const a = V().at(plan, t);
      const from = Math.round(a.src * rate);
      let g = Math.pow(10, a.gainDb / 20);
      if (a.line) g *= Math.pow(10, (-14 * a.duck) / 20);
      for (let j = 0; j < per && k * per + j < n; j++) {
        const x = src.data[from + j];
        out[k * per + j] = x == null ? 0 : Math.max(-1, Math.min(1, x * g));
      }
    }
    return { data: out, rate };
  }

  /* Render the applied clip frame by frame (no recording), measure it, score it. */
  async function check(plan, clip, opts) {
    opts = opts || {};
    const over = plan.on.overlay && opts.overlay ? opts.overlay.video : null;
    const setV = plan.on.set && opts.overlay ? (await open(opts.overlay.url)).video : null;
    const M = window.CurioMask;
    const wantEl = M && M.ready() && (plan.on.wardrobe || plan.on.hair || plan.on.figure || plan.on.set || plan.on.framing);
    const looks = [],
      lk = [];
    const LK = (plan.on.palette || plan.on.grain || plan.on.shape) && window.CurioLooks;
    const W = 320,
      H = Math.max(2, Math.round((W * clip.height) / clip.width));
    const big = canvas(W, H);
    const bx = big.getContext("2d", { willReadFrequently: true });
    const times = evenTimes(plan.duration, opts.fps || Math.max(6, Math.min(15, MAX_LOOKS / plan.duration)));
    const st = plan.on.shake ? steadier() : null;
    const fr = await frames(
      clip,
      times,
      async (ctx, w, h, t) => {
        let a = V().at(plan, t);
        await seek(clip.video, a.src);
        a = steadyAdj(a, st, clip.video);
        if (over && a.overlay) await seek(over, a.overlay.t);
        if (setV && a.parts && a.parts.background) await seek(setV, a.parts.background.t);
        drawApplied(bx, clip.video, a, W, H, { captions: false, overlay: over, setVideo: setV });
        ctx.drawImage(big, 0, 0, w, h);
        if (LK && t - (lk.length ? lk[lk.length - 1].t : -1) >= 0.5) lk.push({ t, m: LK.measure(bx.getImageData(0, 0, W, H).data, W, H) });
        if (wantEl && looks.length < 240 && (looks.length === 0 || t - looks[looks.length - 1].t >= 0.25)) {
          const k = M.cut(big);
          looks.push({ t, stats: V().partStats(k.labels, k.rgba, k.w, k.h), blobs: window.CurioFraming ? window.CurioFraming.blobs(k.labels, k.w, k.h) : null });
        }
      },
      (p) => opts.onProgress && opts.onProgress(p * 0.9, "Measuring the changed clip")
    );
    const src = await pcm(clip);
    const sound = src ? V().envelope(appliedPcm(plan, src).data, src.rate) : null;
    const after = V().analyze({ name: clip.name + " (applied)", duration: plan.duration, aspect: clip.height / clip.width, samples: fr.samples, gw: fr.gw, sound });
    if (looks.length > 1) after.elements = V().elementSeries(looks);
    if (after.elements && window.CurioFraming) after.elements.main = window.CurioFraming.series(looks, H / W);
    if (lk.length) after.looks = LK.series(lk);
    if (opts.onProgress) opts.onProgress(1, "Done");
    return { after };
  }

  /* Real-time playback of the applied clip on a canvas, with its sound changed through Web Audio, and the new
     lines spoken by the browser's own voice (speak) or only shown as subtitles. */
  async function render(plan, clip, opts) {
    opts = opts || {};
    stop();
    const cv = opts.canvas;
    const W = cv.width,
      H = cv.height;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const video = document.createElement("video");
    video.src = clip.url;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    await new Promise((r) => {
      if (video.readyState >= 2) return r();
      video.addEventListener("loadeddata", r, { once: true });
      video.load();
    });
    let over = null;
    if (plan.on.overlay && opts.overlay) {
      over = document.createElement("video");
      over.src = opts.overlay.url;
      over.muted = true;
      over.playsInline = true;
      over.preload = "auto";
      await new Promise((r) => {
        if (over.readyState >= 2) return r();
        over.addEventListener("loadeddata", r, { once: true });
        over.load();
      });
      over.currentTime = plan.overlayFrom || 0;
    }
    let ac = null,
      gain = null,
      dest = null;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const node = ac.createMediaElementSource(video);
      gain = ac.createGain();
      node.connect(gain);
      dest = ac.createMediaStreamDestination();
      gain.connect(dest);
      if (opts.listen !== false) gain.connect(ac.destination);
    } catch (e) {
      video.muted = opts.listen === false;
    }
    let rec = null;
    const chunks = [];
    if (opts.record && cv.captureStream && window.MediaRecorder) {
      const stream = cv.captureStream(30);
      if (dest) dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      const type = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) || "";
      rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 4e6 } : {});
      rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
    }
    const synth = opts.speak !== false && window.speechSynthesis;
    let spoken = -1;
    let running = true;
    stopper = () => {
      running = false;
    };
    await video.play().catch(() => {});
    let setV = null;
    if (plan.on.set && opts.overlay) {
      setV = (await open(opts.overlay.url)).video;
      await setV.play().catch(() => {});
    }
    if (over) await over.play().catch(() => {});
    if (ac && ac.state === "suspended") await ac.resume().catch(() => {});
    if (rec) rec.start(250);
    const t0 = performance.now();
    const st = plan.on.shake ? steadier() : null;
    await new Promise((resolve) => {
      const tick = () => {
        if (!running) return resolve();
        const t = (performance.now() - t0) / 1000;
        if (t >= plan.duration || video.ended) return resolve();
        const a = V().at(plan, t);
        /* Keep the video on the time map: drift a little by speed, jump when it is far (a jump cut). */
        const k = Math.min(plan.src.length - 1, Math.floor(t * plan.fps));
        const next = plan.src[Math.min(plan.src.length - 1, k + 1)];
        const rate = Math.max(0.5, Math.min(2, (next - plan.src[k]) * plan.fps || 1));
        if (Math.abs(video.playbackRate - rate) > 0.02) video.playbackRate = rate;
        if (Math.abs(video.currentTime - a.src) > 0.25) video.currentTime = a.src;
        if (gain) {
          let g = Math.pow(10, a.gainDb / 20);
          if (a.line) g *= Math.pow(10, (-14 * a.duck) / 20);
          gain.gain.setTargetAtTime(g, ac.currentTime, 0.03);
        }
        if (over && a.overlay && Math.abs(over.currentTime - a.overlay.t) > 0.3) over.currentTime = a.overlay.t;
        if (setV && a.parts && a.parts.background && Math.abs(setV.currentTime - a.parts.background.t) > 0.3) setV.currentTime = a.parts.background.t;
        drawApplied(ctx, video, steadyAdj(a, st, video), W, H, { overlay: over, setVideo: setV });
        if (synth && a.line) {
          const i = plan.lines.indexOf(a.line);
          if (i !== spoken) {
            spoken = i;
            const u = new SpeechSynthesisUtterance(a.line.text);
            const secs = Math.max(0.3, a.line.end - a.line.start);
            /* Speak at the phrase's own tempo: a normal voice says about 3.5 syllables a second. */
            u.rate = Math.max(0.5, Math.min(2.5, a.line.syll / secs / 3.5));
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
          }
        }
        if (opts.onFrame) opts.onFrame(t, a);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    video.pause();
    if (over) over.pause();
    if (setV) setV.pause();
    if (synth) window.speechSynthesis.cancel();
    let blob = null;
    if (rec) {
      await new Promise((r) => {
        rec.onstop = r;
        rec.stop();
      });
      blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
    }
    if (ac) ac.close().catch(() => {});
    stopper = null;
    return blob;
  }
  function stop() {
    if (stopper) stopper();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  window.CurioClip = { steadier, steadyAdj, open, dissect, pcm, drawApplied, appliedPcm, check, render, stop, seek, evenTimes };
})();
