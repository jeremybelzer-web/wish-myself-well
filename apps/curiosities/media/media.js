/* media/media.js: bring in your own video without the app choking on a big file (Jeremy, 2026-10-02 22:10Z:
   "look online about how the two apps deal with large file sizes that the user imports ... we should follow the
   same principles. Also ... how the AI used in CapCut works and try to apply it here").

   The principles, taken from Final Cut Pro and CapCut (docs/big-files-and-ai.md has the sources):
   1. Leave the file in place. Final Cut Pro can "leave files in place" and link to them instead of copying.
      Here the video is never uploaded and never copied into the browser's storage: the browser reads only the
      bits it needs, straight from the file on your computer.
   2. Edit on a small copy. Both apps make lightweight proxy media for smooth editing and switch back to the
      original for the finished film. Here the small copy is one small picture per moment (a few kilobytes each,
      kept in this browser), which is all a storyboard needs; the original is only used to play the real thing.
   3. Do the heavy work in the background, show progress, let people keep working and cancel.
   4. The original is the truth: the small copy is never used for anything final.
   And the AI, CapCut-style (auto captions, AutoCut / long video to shorts, auto adjust, auto reframe): here it
   reads curiosities, measured on this device: where the cuts are, how long shots hold, how bright, warm,
   colorful and contrasty the picture is, how much moves. Every guess is shown as a guess you can change, and the
   moments with the most change are offered as highlights (the momentum peaks), like CapCut's long video to shorts.

   window.CurioMedia
   - open()                     the import window
   - analyze(file, opts)        -> { duration, width, height, step, samples, beats, highlights } (no UI)
   - toStudy(result, file)      -> a study (a curated film) of curiosity values, beat by beat
   - videos() / forget(id)      what is kept in this browser (the small pictures and the measurements)
   - thumb(videoId, i)          -> a blob URL for moment i's small picture, or null
   Storage: IndexedDB "curiomatic-media" (stores "videos" and "thumbs"). Nothing is sent anywhere. */
(function () {
  const DB_NAME = "curiomatic-media";
  const PROXY_W = 240;
  const MAX_SAMPLES = 2400;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

  /* ---------- storage (IndexedDB; falls back to memory when it is blocked) ---------- */
  const mem = { videos: new Map(), thumbs: new Map() };
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore("videos");
          req.result.createObjectStore("thumbs");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await db();
    if (!d) return fn(null, mem[store]);
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const out = fn(t.objectStore(store));
      t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
      t.onerror = () => reject(t.error);
    });
  }
  const put = (store, key, val) => tx(store, "readwrite", (s, m) => (s ? s.put(val, key) : m.set(key, val)));
  const get = (store, key) => tx(store, "readonly", (s, m) => (s ? s.get(key) : m.get(key)));
  async function keys(store) {
    return tx(store, "readonly", (s, m) => (s ? s.getAllKeys() : Array.from(m.keys())));
  }
  async function del(store, key) {
    return tx(store, "readwrite", (s, m) => (s ? s.delete(key) : m.delete(key)));
  }

  /* ---------- reading the video, a few frames at a time ---------- */
  function once(el, ok, bad, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => done(reject, new Error("The video took too long to answer.")), ms || 8000);
      const a = () => done(resolve);
      const b = () => done(reject, new Error("This browser can't read this kind of video. MP4 (H.264) and WebM work everywhere."));
      function done(f, v) {
        clearTimeout(t);
        el.removeEventListener(ok, a);
        if (bad) el.removeEventListener(bad, b);
        f(v);
      }
      el.addEventListener(ok, a);
      if (bad) el.addEventListener(bad, b);
    });
  }
  const fmt = (t) => {
    t = Math.max(0, Math.round(t));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = String(t % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  };
  const beatSeconds = () => {
    const M = window.CurioMomentum;
    const v = M && (typeof M.secondsPerPanel === "function" ? M.secondsPerPanel() : M.secondsPerPanel);
    return Number(v) > 0 ? Number(v) : 3;
  };
  const idOf = (file) => "v" + [file.name, file.size, file.lastModified].join("|").split("").reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 7).toString(36);

  /* Measure one frame on a tiny canvas: brightness, color, contrast, a color histogram (for cuts) and the pixels
     (for motion). Values are 0..1. */
  function measure(ctx, w, h) {
    const px = ctx.getImageData(0, 0, w, h).data;
    const hist = new Float32Array(48);
    let lum = 0, lum2 = 0, sat = 0, warm = 0;
    const n = w * h;
    const grey = new Float32Array(n);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      grey[j] = l;
      lum += l;
      lum2 += l * l;
      sat += mx ? (mx - mn) / mx : 0;
      warm += r - b;
      hist[Math.min(15, (r * 16) | 0)]++;
      hist[16 + Math.min(15, (g * 16) | 0)]++;
      hist[32 + Math.min(15, (b * 16) | 0)]++;
    }
    lum /= n;
    for (let k = 0; k < 48; k++) hist[k] /= n;
    return { luma: lum, contrast: Math.sqrt(Math.max(0, lum2 / n - lum * lum)), sat: sat / n, warm: warm / n, hist, grey };
  }
  const histDiff = (a, b) => {
    let d = 0;
    for (let k = 0; k < 48; k++) d += Math.abs(a[k] - b[k]);
    return d / 6; /* 0 = same colors, 1 = nothing in common (three channels, each counted twice) */
  };
  const pixDiff = (a, b) => {
    let d = 0;
    for (let k = 0; k < a.length; k++) d += Math.abs(a[k] - b[k]);
    return d / a.length;
  };

  /* analyze(file, { step, onProgress(fraction, text), signal: { cancelled } })
     Seeks through the file, never loading it whole: one small picture per moment (step seconds), and finer
     samples in between to find cuts and motion. Long videos are sampled more coarsely (at most MAX_SAMPLES). */
  /* When the Video window's analyzer is loaded (video/, window.CurioClip + CurioVideo), it measures every video:
     finer looks, subpixel camera motion, a cut rule that ignores whip pans and flashes, and the sound. Its coarse
     mode keeps it within the big-file rules: at most MAX_SAMPLES seeks in all, and the sound skipped for files
     over SOUND_MAX_BYTES (it checks the size before reading anything). Without video/, the light loop below. */
  const SOUND_MAX_BYTES = 300e6;
  async function analyze(file, opts) {
    opts = opts || {};
    if (window.CurioClip && window.CurioVideo && typeof CurioVideo.toMedia === "function") {
      const clip = await CurioClip.open(file, file.name).catch(() => null);
      if (clip && clip.duration > 0 && isFinite(clip.duration)) return analyzeClip(file, clip, opts);
    }
    return analyzeLight(file, opts);
  }
  async function analyzeClip(file, clip, opts) {
    const step = opts.step || beatSeconds();
    const progress = opts.onProgress || (() => {});
    const signal = opts.signal || {};
    const videoId = idOf(file);
    const d = await CurioClip.dissect(clip, { maxLooks: Math.min(MAX_SAMPLES, Math.max(900, Math.ceil((clip.duration / step) * 4))), maxSoundBytes: SOUND_MAX_BYTES, onProgress: (p, t) => progress(p * 0.9, t || "Measuring") });
    if (signal.cancelled) throw Object.assign(new Error("Stopped."), { cancelled: true });
    const m = CurioVideo.toMedia(d, step);
    /* The small pictures: one seek per moment. */
    const vw = clip.width || 16, vh = clip.height || 9;
    const pw = PROXY_W, ph = Math.max(1, Math.round((PROXY_W * vh) / vw));
    const thumb = Object.assign(document.createElement("canvas"), { width: pw, height: ph });
    const tctx = thumb.getContext("2d");
    const nBeats = Math.max(1, Math.ceil(m.duration / step));
    for (let i = 0; i < nBeats; i++) {
      if (signal.cancelled) throw Object.assign(new Error("Stopped."), { cancelled: true });
      clip.video.currentTime = Math.min(i * step + 0.01, m.duration - 0.05);
      await once(clip.video, "seeked", "error", 8000);
      tctx.drawImage(clip.video, 0, 0, pw, ph);
      const blob = await new Promise((r) => thumb.toBlob(r, "image/jpeg", 0.7));
      if (blob) await put("thumbs", videoId + ":" + i, blob);
      progress(0.9 + (0.1 * (i + 1)) / nBeats, "Making the small pictures");
    }
    if (clip.url && String(clip.url).startsWith("blob:")) URL.revokeObjectURL(clip.url);
    return finish(file, { videoId, name: file.name, size: file.size, duration: m.duration, width: vw, height: vh, step, every: m.every, samples: m.samples, analyzer: "video" }, progress);
  }
  async function finish(file, result, progress) {
    result.beats = beatsOf(result);
    result.highlights = highlightsOf(result);
    await put("videos", result.videoId, { id: result.videoId, name: file.name, size: file.size, lastModified: file.lastModified, duration: result.duration, width: result.width, height: result.height, step: result.step, every: result.every, analyzer: result.analyzer, beats: result.beats, highlights: result.highlights, at: Date.now() });
    progress(1, "Done");
    return result;
  }
  async function analyzeLight(file, opts) {
    opts = opts || {};
    const step = opts.step || beatSeconds();
    const signal = opts.signal || {};
    const progress = opts.onProgress || (() => {});
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.src = url;
    const videoId = idOf(file);
    try {
      await once(video, "loadedmetadata", "error", 15000);
      /* Some recordings (browser and phone screen recordings) carry no length; seeking far past the end makes
         the browser work it out. */
      if (video.duration === Infinity) {
        video.currentTime = 1e101;
        await once(video, "durationchange", "error", 15000).catch(() => {});
        video.currentTime = 0;
        await once(video, "seeked", "error", 8000).catch(() => {});
      }
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) throw new Error("This video has no length the browser can read.");
      const vw = video.videoWidth || 16, vh = video.videoHeight || 9;
      const pw = PROXY_W, ph = Math.max(1, Math.round((PROXY_W * vh) / vw));
      const thumb = Object.assign(document.createElement("canvas"), { width: pw, height: ph });
      const tctx = thumb.getContext("2d");
      const sw = 32, sh = Math.max(2, Math.round((32 * vh) / vw));
      const small = Object.assign(document.createElement("canvas"), { width: sw, height: sh });
      const sctx = small.getContext("2d", { willReadFrequently: true });
      const every = Math.max(Math.min(step / 4, 0.5), duration / MAX_SAMPLES);
      const nBeats = Math.max(1, Math.ceil(duration / step));
      const samples = [];
      let prev = null;
      let nextThumb = 0;
      for (let t = 0; t < duration; t += every) {
        if (signal.cancelled) throw Object.assign(new Error("Stopped."), { cancelled: true });
        video.currentTime = Math.min(t + 0.01, duration - 0.05);
        await once(video, "seeked", "error", 8000);
        sctx.drawImage(video, 0, 0, sw, sh);
        const m = measure(sctx, sw, sh);
        const s = { t, luma: m.luma, contrast: m.contrast, sat: m.sat, warm: m.warm, cut: false, motion: 0 };
        if (prev) {
          const hd = histDiff(prev.hist, m.hist);
          const pd = pixDiff(prev.grey, m.grey);
          /* A cut: the colors change a lot at once, or the whole picture jumps. Motion: how much changed when
             it wasn't a cut. */
          s.cut = hd > 0.38 || (pd > 0.22 && hd > 0.2);
          s.motion = s.cut ? 0 : Math.min(1, pd * 6);
        }
        prev = m;
        samples.push(s);
        if (t >= nextThumb * step - 1e-6 && nextThumb < nBeats) {
          tctx.drawImage(video, 0, 0, pw, ph);
          const blob = await new Promise((r) => thumb.toBlob(r, "image/jpeg", 0.7));
          if (blob) await put("thumbs", videoId + ":" + nextThumb, blob);
          nextThumb++;
        }
        progress(t / duration, `Measuring ${fmt(t)} of ${fmt(duration)}`);
      }
      return await finish(file, { videoId, name: file.name, size: file.size, duration, width: vw, height: vh, step, every, samples, analyzer: "light" }, progress);
    } finally {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    }
  }

  /* ---------- from measurements to curiosities ---------- */
  /* CURIOSITIES is a top-level const of catalog.js, not a window property. */
  const catalog = () => (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : window.CURIOSITIES || []);
  const scaleOf = (id) => catalog().find((x) => x.id === id) || null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (id, i) => {
    const c = scaleOf(id);
    if (!c) return undefined;
    if (c.options) return c.options[clamp(Math.round(i), 0, c.options.length - 1)];
    if (c.kind === "range") return clamp(Math.round(i), c.min, c.max);
    return undefined;
  };
  /* Each rule: [curiosity id, (beat stats) -> index on its scale (or number on its range), what was measured]. */
  const RULES = [
    ["cutRate", (b) => (b.cutsPer10 < 1 ? 0 : b.cutsPer10 < 3 ? 1 : 2), "cuts in the ten seconds around this moment"],
    ["shotDuration", (b) => (b.shotLen < 2.5 ? 0 : b.shotLen < 6 ? 1 : 2), "how long the shot holds"],
    ["valueKey", (b) => (b.luma < 0.3 ? 0 : b.luma > 0.62 ? 2 : 1), "average brightness"],
    ["warmCool", (b) => (b.warm > 0.12 ? 0 : b.warm > 0.04 ? 1 : b.warm > -0.04 ? 2 : b.warm > -0.12 ? 3 : 4), "red against blue in the picture"],
    ["saturation", (b) => b.sat * 8, "how strong the colors are"],
    ["contrast", (b) => b.contrast * 14, "the spread between dark and bright"],
    ["colorRange", (b) => (b.sat < 0.04 ? 0 : b.sat < 0.12 ? 3 : b.sat < 0.3 ? 4 : 5), "how much color there is"],
  ];
  function beatsOf(r) {
    const n = Math.max(1, Math.ceil(r.duration / r.step));
    const cuts = r.samples.filter((s) => s.cut).map((s) => s.t);
    const bounds = [0].concat(cuts, [r.duration]);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = i * r.step, z = Math.min(r.duration, a + r.step), mid = (a + z) / 2;
      const ss = r.samples.filter((s) => s.t >= a && s.t < z);
      const avg = (k) => (ss.length ? ss.reduce((x, s) => x + s[k], 0) / ss.length : 0);
      let k = 0;
      while (k < bounds.length - 2 && bounds[k + 1] <= mid) k++;
      const stats = {
        luma: avg("luma"), contrast: avg("contrast"), sat: avg("sat"), warm: avg("warm"), motion: avg("motion"),
        cuts: ss.filter((s) => s.cut).length,
        cutsPer10: cuts.filter((t) => Math.abs(t - mid) <= 5).length,
        shotLen: bounds[k + 1] - bounds[k],
      };
      const values = {};
      RULES.forEach(([id, f]) => {
        const v = pick(id, f(stats));
        if (v !== undefined) values[id] = v;
      });
      out.push({ i, at: fmt(a), from: a, to: z, stats, values });
    }
    return out;
  }
  /* Highlights, like CapCut's long video to shorts: the stretches where the most is changing (cuts, motion and
     curiosities changing from the moment before), at most three, not touching each other. */
  function highlightsOf(r) {
    const b = r.beats;
    const score = b.map((x, i) => {
      const prev = b[i - 1];
      const changed = prev ? Object.keys(x.values).filter((k) => x.values[k] !== prev.values[k]).length : 0;
      return x.stats.cuts * 1.5 + x.stats.motion * 6 + changed;
    });
    const len = Math.max(1, Math.min(Math.round(15 / r.step), Math.ceil(b.length / 4)));
    const windows = [];
    for (let i = 0; i + len <= b.length; i++) windows.push({ i, score: score.slice(i, i + len).reduce((x, y) => x + y, 0) });
    windows.sort((x, y) => y.score - x.score);
    const out = [];
    windows.forEach((w) => {
      if (out.length >= 3 || w.score <= 0) return;
      if (out.some((o) => Math.abs(o.from - w.i) < len)) return;
      out.push({ from: w.i, to: w.i + len - 1, at: b[w.i].at, until: fmt(b[w.i + len - 1].to), score: Math.round(w.score * 10) / 10 });
    });
    return out.sort((x, y) => x.from - y.from);
  }
  /* A study (a curated film the Screen and the Prism can use), counts and settings only. */
  function toStudy(r) {
    const hl = new Set();
    (r.highlights || []).forEach((h) => {
      for (let i = h.from; i <= h.to; i++) hl.add(i);
    });
    return {
      id: "video-" + r.videoId,
      title: r.name.replace(/\.[^.]+$/, ""),
      kind: "film",
      camera: "measured",
      source: "my video",
      note: "Measured on this device from your own video, which never left it. Every value is a guess you can change.",
      media: { videoId: r.videoId, name: r.name, size: r.size, duration: r.duration, step: r.step },
      beats: r.beats.map((b) => ({ id: r.videoId + "-" + (b.i + 1), at: b.at, note: hl.has(b.i) ? "highlight" : "", values: b.values })),
    };
  }

  async function thumb(videoId, i) {
    const b = await get("thumbs", videoId + ":" + i);
    return b ? URL.createObjectURL(b) : null;
  }
  async function videos() {
    const ks = await keys("videos");
    const out = [];
    for (const k of ks) out.push(await get("videos", k));
    return out.filter(Boolean).sort((a, b) => b.at - a.at);
  }
  async function forget(videoId) {
    const ks = await keys("thumbs");
    for (const k of ks) if (String(k).startsWith(videoId + ":")) await del("thumbs", k);
    await del("videos", videoId);
  }

  /* ---------- the import window ---------- */
  let dlg = null;
  let job = null;
  let urls = [];
  let file = null;
  function freeUrls() {
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls = [];
  }
  function mb(n) {
    return n > 1e9 ? (n / 1e9).toFixed(1) + " GB" : Math.max(0.1, n / 1e6).toFixed(1) + " MB";
  }
  function open() {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "cm-media";
      dlg.innerHTML = `<header><strong>Bring in your own video</strong><button type="button" data-m="close">Close</button></header>
        <div class="cm-body"></div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener("click", onClick);
      dlg.addEventListener("change", onChange);
      dlg.addEventListener("close", () => {
        if (job) job.cancelled = true;
        freeUrls();
      });
    }
    if (typeof dlg.showModal === "function" && !dlg.open) dlg.showModal();
    else dlg.setAttribute("open", "");
    drawStart();
  }
  const body = () => dlg.querySelector(".cm-body");
  async function drawStart() {
    const list = await videos();
    body().innerHTML = `<p>Pick a video on your computer. It stays where it is: nothing is uploaded or copied. The app reads only what it needs, makes one small picture per moment for the storyboard, and measures each moment's curiosities.</p>
      <p><label class="cm-pick">Choose a video <input type="file" accept="video/*" data-m="file"></label>
      <label>One moment every <select data-m="step">${[1, 2, 3, 4, 5, 8].map((s) => `<option value="${s}" ${s === Math.round(beatSeconds()) ? "selected" : ""}>${s} s</option>`).join("")}</select></label></p>
      ${list.length ? `<h3>Kept in this browser</h3><ul class="cm-list">${list.map((v) => `<li><strong>${esc(v.name)}</strong> <small>${fmt(v.duration)} · ${v.beats.length} moments · ${mb(v.size)} original (not kept)</small> <button type="button" data-m="show" data-id="${esc(v.id)}">Show</button> <button type="button" data-m="forget" data-id="${esc(v.id)}">Forget</button></li>`).join("")}</ul>` : ""}
      <p class="cm-small">Only the small pictures and the measurements are kept, in this browser. Forget removes them; your video file is never touched.</p>`;
  }
  async function run(f) {
    file = f;
    const stepSel = dlg.querySelector('[data-m="step"]');
    const step = stepSel ? Number(stepSel.value) : beatSeconds();
    job = { cancelled: false };
    body().innerHTML = `<p><strong>${esc(f.name)}</strong> <small>${mb(f.size)}</small></p>
      <progress max="1" value="0"></progress> <span class="cm-prog">Starting</span>
      <p class="cm-small">You can keep working; this runs on its own. Long videos are measured more coarsely.</p>
      <p><button type="button" data-m="stop">Stop</button></p>`;
    const bar = dlg.querySelector("progress");
    const txt = dlg.querySelector(".cm-prog");
    try {
      const r = await analyze(f, { step, signal: job, onProgress: (p, t) => ((bar.value = p), (txt.textContent = t)) });
      const study = toStudy(r);
      if (window.CuriosityStudy && CuriosityStudy.add) CuriosityStudy.add(study);
      job = null;
      drawResult(await get("videos", r.videoId));
    } catch (e) {
      job = null;
      body().innerHTML = `<p>${e.cancelled ? "Stopped. Nothing was kept from this video." : "Could not read it: " + esc(e.message)}</p><p><button type="button" data-m="back">Back</button></p>`;
      if (e.cancelled) forget(idOf(f));
    }
  }
  async function drawResult(v) {
    if (!v) return drawStart();
    freeUrls();
    const ids = Object.keys((v.beats[0] || {}).values || {});
    const label = (id) => (catalog().find((c) => c.id === id) || { label: id }).label;
    const hl = new Set();
    (v.highlights || []).forEach((h) => {
      for (let i = h.from; i <= h.to; i++) hl.add(i);
    });
    const shown = v.beats.slice(0, 200);
    body().innerHTML = `<p><strong>${esc(v.name)}</strong> <small>${fmt(v.duration)} · ${v.beats.length} moments of ${v.step} s · ${v.width}×${v.height}</small></p>
      <p>It is now a curated film called <strong>${esc(v.name.replace(/\.[^.]+$/, ""))}</strong>: open it as an inspiration film in the Screen, split it in the Prism, or take its curiosities into your film. Every value below is a guess measured from the picture; change any of them in Study.</p>
      ${(v.highlights || []).length ? `<h3>Highlights</h3><p class="cm-small">The stretches where the most changes at once (cuts, movement, curiosities shifting): the momentum peaks, like CapCut's long video to shorts.</p><ul>${v.highlights.map((h) => `<li>${esc(h.at)} to ${esc(h.until)}</li>`).join("")}</ul>` : ""}
      <h3>Moment by moment</h3>
      <div class="cm-strip">${shown.map((b) => `<figure class="${hl.has(b.i) ? "hl" : ""}"><img data-i="${b.i}" alt="Moment at ${esc(b.at)}" width="120"><figcaption>${esc(b.at)}${b.stats.cuts ? ` · ${b.stats.cuts} cut${b.stats.cuts > 1 ? "s" : ""}` : ""}</figcaption></figure>`).join("")}</div>
      ${v.beats.length > shown.length ? `<p class="cm-small">Showing the first ${shown.length} of ${v.beats.length} moments.</p>` : ""}
      <h3>Curiosities it measured</h3>
      <table class="cm-table"><tr><th>Curiosity</th>${shown.slice(0, 12).map((b) => `<th>${esc(b.at)}</th>`).join("")}</tr>${ids.map((id) => `<tr><th>${esc(label(id))}</th>${shown.slice(0, 12).map((b) => `<td>${esc(b.values[id])}</td>`).join("")}</tr>`).join("")}</table>
      <p><button type="button" data-m="back">Bring in another video</button></p>`;
    for (const img of dlg.querySelectorAll(".cm-strip img")) {
      const u = await thumb(v.id, Number(img.dataset.i));
      if (!u || !dlg.open) break;
      urls.push(u);
      img.src = u;
    }
  }
  async function onClick(e) {
    const b = e.target.closest("[data-m]");
    if (!b || b.tagName === "INPUT" || b.tagName === "SELECT") return;
    const m = b.dataset.m;
    if (m === "close") return dlg.close();
    if (m === "stop" && job) job.cancelled = true;
    if (m === "back") return drawStart();
    if (m === "show") return drawResult(await get("videos", b.dataset.id));
    if (m === "forget") {
      await forget(b.dataset.id);
      return drawStart();
    }
  }
  function onChange(e) {
    if (e.target.dataset.m === "file" && e.target.files && e.target.files[0]) run(e.target.files[0]);
  }

  /* ---------- styles and the Library entry ---------- */
  function wire() {
    const css = document.createElement("style");
    css.textContent = `.cm-media{width:min(900px,96vw);max-height:92vh;overflow:auto;padding:0;border:1px solid #888;border-radius:.6rem}
.cm-media::backdrop{background:rgba(0,0,0,.55)}
.cm-media header{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.6rem .9rem;background:inherit;border-bottom:1px solid #8884;z-index:1}
.cm-body{padding:.4rem .9rem .9rem}
.cm-body h3{margin:1rem 0 .3rem;font-size:1rem}
.cm-small{font-size:.82rem;opacity:.75}
.cm-pick{display:inline-block;padding:.35rem .7rem;border:2px solid currentColor;border-radius:.4rem;cursor:pointer;margin-right:1rem}
.cm-pick input{display:block;max-width:220px;margin-top:.25rem}
.cm-media progress{width:min(420px,70vw)}
.cm-strip{display:flex;gap:.4rem;overflow-x:auto;padding-bottom:.4rem}
.cm-strip figure{margin:0;flex:0 0 auto;border:2px solid transparent;border-radius:.3rem}
.cm-strip figure.hl{border-color:#ff9f43}
.cm-strip img{display:block;width:120px;height:auto;min-height:40px;background:#8882}
.cm-strip figcaption{font-size:.72rem;opacity:.8;padding:.1rem .2rem}
.cm-table{border-collapse:collapse;font-size:.8rem;display:block;overflow-x:auto}
.cm-table th,.cm-table td{border:1px solid #8885;padding:.15rem .35rem;text-align:left;white-space:nowrap}
.cm-list{padding-left:1.1rem}.cm-list li{margin:.25rem 0}`;
    document.head.appendChild(css);
    const menu = document.getElementById("lib-menu");
    if (menu && !menu.querySelector("[data-media]")) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.media = "open";
      b.innerHTML = "Bring in a video<small>your own film, measured on this device, never uploaded</small>";
      menu.insertBefore(b, menu.firstChild);
      b.addEventListener("click", () => {
        menu.hidden = true;
        open();
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioMedia = { open, analyze, toStudy, videos, forget, thumb, beatsOf, highlightsOf, RULES };
})();
