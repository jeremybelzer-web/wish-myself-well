/* video/measure.js: take a video clip apart into curiosities, and work out how to apply one clip's curiosities
   to another clip. Part of the video core (no page): the browser half (video/clip.js) reads the frames and the
   sound, this file does all the arithmetic, so Node tests can feed it made-up frames.

   Jeremy's words (2026-10-02, this thread): "dissect the inspiration clip for all of the curiosities, and mark
   automation for when they change, across time. Then apply those to the second clip... If the curiosity is
   light vs dark, the other video should become light and dark at the same rate as the inspiration video. If it
   is rate of dialogue, then that should be transferred... the dialogue should fit the tempo and speed of the
   sentences of the other video." And: "use the title of the video you are working on" as the dialogue's topic.

   window.CurioVideo
   FRAMES
   - frameStats(data, w, h) -> { luma, std, sat, warm, skin, skinX, skinY, colors, hist }   (RGBA pixels, 0..1)
   - toGray(data, w, h) -> Float32Array of brightness 0..1
   - motion(prevGray, gray, w, h, R?, fine?) -> { dx, dy, zoom, err, still }  how far the picture slid between two
     frames (pixels of the small frame, to a fraction of a pixel when fine = { prev, cur, w, h } gives the same
     frames at twice the size), how much it grew (zoom), what moved that a slide does not explain (err), and
     how much changed at all (still)
   - histDistance(a, b) -> 0..1  (how different two frames' colors are; a spike is a cut)
   SOUND
   - envelope(pcm, rate) -> { hop, db: Float32Array }   loudness every 10 ms
   - speech(env) -> { phrases: [{ start, end, syll }], peaks: [t], floor, thr }   when someone talks, and the
     beats of their syllables (the tempo of the sentences)
   THE CLIP
   - analyze({ name, duration, samples: [{ t, s: frameStats, m: motion | null }], sound?: env }) -> a dissection:
     { name, duration, dt, times, raw: { feature: [per sample] }, cuts: [t], speech, curves: { curiosity: [value
       per sample] }, nodes: { curiosity: [{ t, value }] }, moments: [{ start, end, label }], lanes: { curiosity:
       [value per moment] }, how: { curiosity: { how: "measured" | "estimated", from } }, summary: [sentences] }
   - LIST: every curiosity a clip is measured for, with its group, its engine track and how it is measured.
   - engineCommands(dissection, engineState, opts) -> commands for CurioEngine.send({ type: "batch" }): one
     automation lane per curiosity on My film, with a node only where the value changes.
   APPLYING (one clip's curiosities onto another)
   - GROUPS: what can be applied, one by one (light, contrast, color, warmth, shake, camera move, shot size,
     cuts, movement speed, loudness, dialogue).
   - plan(inspiration, target, { mode: "same" | "stretch", on: { group: amount 0..1 }, title, lines? }) -> a plan
   - at(plan, t) -> { src, luma, contrast, sat, warm, dx, dy, zoom, cx, cy, gainDb, duck, line }   what to do to
     the frame shown at output time t
   - paint(data, w, h, adj, mean) -> changes RGBA pixels in place (light, contrast, color, warmth)
   - fitDialogue(title, phrases, opts) -> [{ start, end, text, syll }]   new lines on the title's topic, one per
     phrase of the inspiration's speech, each as long (in syllables and seconds) as the phrase it replaces
   - syllables(text), corr(a, b), series(dissection, feature), score(plan, before, after): checks
   Values only: a dissection keeps numbers and labels, never pictures or sound. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const S = () => root.CurioScale;

  /* ---------- small helpers ---------- */
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  function median(a) {
    if (!a.length) return 0;
    const b = a.slice().sort((x, y) => x - y);
    return b[Math.floor(b.length / 2)];
  }
  function percentile(a, p) {
    if (!a.length) return 0;
    const b = Array.from(a).sort((x, y) => x - y);
    return b[clamp(Math.floor(p * (b.length - 1)), 0, b.length - 1)];
  }
  /* Average over a window of n samples on each side (n = 0 leaves it alone). */
  function smooth(a, n) {
    if (n < 1) return a.slice();
    const out = new Array(a.length);
    for (let i = 0; i < a.length; i++) {
      let s = 0,
        c = 0;
      for (let j = Math.max(0, i - n); j <= Math.min(a.length - 1, i + n); j++) {
        if (a[j] == null || !isFinite(a[j])) continue;
        s += a[j];
        c++;
      }
      out[i] = c ? s / c : 0;
    }
    return out;
  }
  function corr(a, b) {
    const n = Math.min(a.length, b.length);
    if (n < 3) return 0;
    const ma = mean(a.slice(0, n)),
      mb = mean(b.slice(0, n));
    let sab = 0,
      saa = 0,
      sbb = 0;
    for (let i = 0; i < n; i++) {
      const x = a[i] - ma,
        y = b[i] - mb;
      sab += x * y;
      saa += x * x;
      sbb += y * y;
    }
    return saa > 1e-12 && sbb > 1e-12 ? sab / Math.sqrt(saa * sbb) : 0;
  }
  const r3 = (x) => Math.round(x * 1000) / 1000;

  /* ---------- frames ---------- */
  function frameStats(data, w, h) {
    const n = w * h;
    let sy = 0,
      syy = 0,
      ss = 0,
      sw = 0,
      sk = 0,
      skx = 0,
      sky = 0,
      satCount = 0;
    const hue = new Array(12).fill(0);
    const hist = new Array(64).fill(0);
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const r = data[p] / 255,
        g = data[p + 1] / 255,
        b = data[p + 2] / 255;
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      sy += y;
      syy += y * y;
      const mx = Math.max(r, g, b),
        mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      ss += sat;
      sw += r - b;
      hist[((data[p] >> 6) << 4) | ((data[p + 1] >> 6) << 2) | (data[p + 2] >> 6)]++;
      if (sat > 0.25 && mx > 0.15) {
        let hh;
        const d = mx - mn;
        if (mx === r) hh = ((g - b) / d + 6) % 6;
        else if (mx === g) hh = (b - r) / d + 2;
        else hh = (r - g) / d + 4;
        hue[Math.floor(hh * 2) % 12]++;
        satCount++;
      }
      /* Skin (any skin tone) in YCbCr: a rough sign of how much of the frame people's faces and hands fill. */
      const Y = 255 * y,
        cb = 128 - 37.797 * r - 74.203 * g + 112 * b,
        cr = 128 + 112 * r - 93.786 * g - 18.214 * b;
      if (Y > 50 && cb > 77 && cb < 127 && cr > 135 && cr < 175 && r > b) {
        sk++;
        skx += i % w;
        sky += Math.floor(i / w);
      }
    }
    const luma = sy / n;
    const colors = satCount < n * 0.03 ? 1 : Math.max(1, hue.filter((c) => c > satCount * 0.08).length);
    return {
      luma: r3(luma),
      std: r3(Math.sqrt(Math.max(0, syy / n - luma * luma))),
      sat: r3(ss / n),
      warm: r3(sw / n),
      skin: r3(sk / n),
      skinX: sk ? r3(skx / sk / w) : 0.5,
      skinY: sk ? r3(sky / sk / h) : 0.5,
      colors,
      hist: hist.map((c) => c / n),
    };
  }
  function toGray(data, w, h) {
    const g = new Float32Array(w * h);
    for (let i = 0, p = 0; i < g.length; i++, p += 4) g[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
    return g;
  }
  function histDistance(a, b) {
    if (!a || !b) return 0;
    let d = 0;
    for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]);
    return d / 2;
  }
  /* How far the picture slid from prev to cur: tries every shift up to R pixels each way and keeps the best, for
     the whole frame and for its four quarters (the quarters moving apart means the picture grew: a push in). */
  function motion(prev, cur, w, h, R, fine) {
    R = R || 5;
    const hw = w / 2,
      hh = h / 2;
    /* Compare shapes, not brightness: each frame less its own average and divided by its own spread, so a
       light turning on or dimming is not a move or a cut. */
    let spread = 0;
    const norm = (g, keep) => {
      let m = 0,
        v = 0;
      for (let i = 0; i < g.length; i++) m += g[i];
      m /= g.length || 1;
      for (let i = 0; i < g.length; i++) v += (g[i] - m) * (g[i] - m);
      const sd = Math.sqrt(v / (g.length || 1)) || 1e-3;
      if (keep) spread = sd;
      const o = new Float32Array(g.length);
      for (let i = 0; i < g.length; i++) o[i] = (g[i] - m) / Math.max(0.02, sd);
      return o;
    };
    const rawPrev = prev,
      rawCur = cur;
    prev = norm(prev);
    cur = norm(cur, true);
    if (fine && fine.prev && fine.cur) fine = { prev: norm(fine.prev), cur: norm(fine.cur), w: fine.w, h: fine.h };
    let best = null;
    const quarter = [null, null, null, null];
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const q = [0, 0, 0, 0],
          qn = [0, 0, 0, 0];
        for (let y = Math.max(0, dy); y < Math.min(h, h + dy); y++) {
          const yo = (y - dy) * w,
            yc = y * w,
            qy = y < hh ? 0 : 2;
          for (let x = Math.max(0, dx); x < Math.min(w, w + dx); x++) {
            const k = qy + (x < hw ? 0 : 1);
            q[k] += Math.abs(cur[yc + x] - prev[yo + x - dx]);
            qn[k]++;
          }
        }
        const all = (q[0] + q[1] + q[2] + q[3]) / Math.max(1, qn[0] + qn[1] + qn[2] + qn[3]);
        const cost = all + 0.0004 * (dx * dx + dy * dy); /* ties go to the smaller slide */
        if (!best || cost < best.cost) best = { dx, dy, cost, err: all };
        for (let k = 0; k < 4; k++) {
          const e = q[k] / Math.max(1, qn[k]) + 0.0004 * (dx * dx + dy * dy);
          if (!quarter[k] || e < quarter[k].e) quarter[k] = { dx, dy, e };
        }
      }
    /* Quarters: 0 top left, 1 top right, 2 bottom left, 3 bottom right. */
    const spreadX = (quarter[1].dx + quarter[3].dx - quarter[0].dx - quarter[2].dx) / 2 / hw;
    const spreadY = (quarter[2].dy + quarter[3].dy - quarter[0].dy - quarter[1].dy) / 2 / hh;
    let still = 0;
    for (let i = 0; i < cur.length; i++) still += Math.abs(rawCur[i] - rawPrev[i]);
    let dx = best.dx,
      dy = best.dy;
    /* Finer: the same frames at twice the size, two pixels around the best slide, then between pixels (a
       parabola through the costs), so a small wobble is not lost to rounding. */
    if (fine && fine.prev && fine.cur) {
      const fw = fine.w,
        fh = fine.h;
      const cost = (ox, oy) => {
        let s = 0,
          c = 0;
        for (let y = Math.max(0, oy) + 2; y < Math.min(fh, fh + oy) - 2; y += 1) {
          const yo = (y - oy) * fw,
            yc = y * fw;
          for (let x = Math.max(0, ox) + 2; x < Math.min(fw, fw + ox) - 2; x += 1) {
            s += Math.abs(fine.cur[yc + x] - fine.prev[yo + x - ox]);
            c++;
          }
        }
        return c ? s / c : 1;
      };
      let bx = 2 * dx,
        by = 2 * dy,
        bc = Infinity;
      const memo = {};
      const C = (x, y) => (memo[x + "," + y] != null ? memo[x + "," + y] : (memo[x + "," + y] = cost(x, y)));
      for (let oy = 2 * dy - 2; oy <= 2 * dy + 2; oy++)
        for (let ox = 2 * dx - 2; ox <= 2 * dx + 2; ox++) {
          const c = C(ox, oy);
          if (c < bc) {
            bc = c;
            bx = ox;
            by = oy;
          }
        }
      const sub = (l, m, r) => {
        const d = l - 2 * m + r;
        return d > 1e-9 ? clamp((0.5 * (l - r)) / d, -0.5, 0.5) : 0;
      };
      dx = (bx + sub(C(bx - 1, by), bc, C(bx + 1, by))) / 2;
      dy = (by + sub(C(bx, by - 1), bc, C(bx, by + 1))) / 2;
    }
    /* err: what is left unexplained, in brightness (shape difference times the frame's spread); shape: the same
       with no brightness, about 1.1 for two unrelated pictures and near 0 for the same picture moved. */
    return { dx: r3(dx), dy: r3(dy), zoom: r3((spreadX + spreadY) / 2), err: r3(best.err * spread), shape: r3(best.err), still: r3(still / cur.length) };
  }

  /* ---------- sound ---------- */
  function envelope(pcm, rate) {
    const hop = 0.01,
      step = Math.max(1, Math.round(rate * hop)),
      win = step * 2;
    const n = Math.max(0, Math.floor((pcm.length - win) / step) + 1);
    const db = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const o = i * step;
      for (let j = 0; j < win; j++) s += pcm[o + j] * pcm[o + j];
      db[i] = Math.max(-90, 10 * Math.log10(s / win + 1e-12));
    }
    return { hop, db };
  }
  /* Talking: stretches louder than the room by 10 dB or more, joined across short breaths; a phrase ends at a
     pause of 0.3 s. Syllables: the bumps of loudness inside a phrase (a voice gets louder on each vowel). */
  function speech(env) {
    const out = { phrases: [], peaks: [], floor: -90, thr: -90 };
    if (!env || !env.db || env.db.length < 10) return out;
    const db = env.db,
      hop = env.hop;
    const floor = percentile(db, 0.1);
    const thr = Math.max(floor + 10, -50);
    out.floor = r3(floor);
    out.thr = r3(thr);
    const runs = [];
    let st = -1;
    for (let i = 0; i <= db.length; i++) {
      const on = i < db.length && db[i] > thr;
      if (on && st < 0) st = i;
      if (!on && st >= 0) {
        runs.push([st, i]);
        st = -1;
      }
    }
    const merged = [];
    runs.forEach((r) => {
      const last = merged[merged.length - 1];
      if (last && (r[0] - last[1]) * hop < 0.3) last[1] = r[1];
      else merged.push(r.slice());
    });
    const phrases = merged.filter((r) => (r[1] - r[0]) * hop >= 0.15);
    /* Bumps: smooth over 50 ms, then a peak is the highest point within 70 ms that stands 2.5 dB above the dip
       before it. */
    const sm = smooth(Array.from(db), 2);
    phrases.forEach(([a, b]) => {
      let syll = 0,
        dip = Infinity,
        lastPeak = -1e9;
      for (let i = a; i < b; i++) {
        dip = Math.min(dip, sm[i]);
        let top = true;
        for (let j = Math.max(a, i - 7); j <= Math.min(b - 1, i + 7); j++) if (sm[j] > sm[i]) top = false;
        if (top && sm[i] > thr && sm[i] - dip >= 2.5 && (i - lastPeak) * hop >= 0.1) {
          syll++;
          out.peaks.push(r3(i * hop));
          lastPeak = i;
          dip = sm[i];
        }
      }
      out.phrases.push({ start: r3(a * hop), end: r3(b * hop), syll: Math.max(1, syll) });
    });
    return out;
  }

  /* ---------- the curiosities a clip is measured for ---------- */
  /* f is the features at one moment of the clip (see features() below). Values are on the app's own scales. */
  const pick = (opts, p) => opts[clamp(Math.round(p * (opts.length - 1)), 0, opts.length - 1)];
  const band = (x, cuts, opts) => {
    let i = 0;
    while (i < cuts.length && x >= cuts[i]) i++;
    return opts[i];
  };
  const LIST = [
    /* Light and color */
    { id: "valueKey", group: "Light and color", track: "master", how: "measured", from: "how bright the frame is on average", val: (f) => band(f.luma, [0.3, 0.6], ["low key", "mid", "high key"]) },
    { id: "setBrightness", group: "Light and color", track: "master", how: "measured", from: "how bright the frame is on average", val: (f) => band(f.luma, [0.2, 0.35, 0.5, 0.65], ["dark", "dull", "middle", "light", "bright"]) },
    { id: "contrast", group: "Light and color", track: "master", how: "measured", from: "how far the darks are from the lights", val: (f) => Math.round(clamp(f.std / 0.05, 0, 6)) },
    { id: "saturation", group: "Light and color", track: "master", how: "measured", from: "how strong the colors are", val: (f) => Math.round(clamp(f.sat / 0.11, 0, 5)) },
    { id: "colorRange", group: "Light and color", track: "master", how: "measured", from: "color strength and how many colors", val: (f) => (f.sat < 0.04 ? "black and white" : f.colors <= 1 ? "one color" : f.sat < 0.15 ? "muted color" : f.colors <= 3 && f.sat < 0.3 ? "two or three colors" : f.sat < 0.4 ? "natural color" : "vivid color") },
    { id: "colorCount", group: "Light and color", track: "master", how: "measured", from: "how many hues fill at least 8% of the colored part", val: (f) => clamp(Math.round(f.colors), 1, 6) },
    { id: "warmCool", group: "Light and color", track: "master", how: "measured", from: "red against blue", val: (f) => band(f.warm, [-0.12, -0.04, 0.04, 0.12], ["very cool", "cool", "neutral", "warm", "very warm"]) },
    { id: "colorTemp", group: "Light and color", track: "master", how: "measured", from: "red against blue", val: (f) => (f.warm > 0.06 ? "warm practical" : f.warm < -0.03 ? "cold day" : "mixed") },
    { id: "lightingLens", group: "Light and color", track: "master", how: "estimated", from: "brightness, contrast and warmth together", val: (f) => (f.luma < 0.25 && f.std > 0.2 ? "dark and harsh" : f.luma < 0.35 ? "dim" : f.luma > 0.55 && f.warm > 0.04 ? "bright and warm" : f.std < 0.16 ? "soft" : "neutral") },
    /* Camera */
    { id: "cameraShake", group: "Camera", track: "camera", how: "measured", from: "the small fast wobble of the whole picture", val: (f) => Math.round(clamp(f.jitter / 0.012, 0, 5)) },
    { id: "cameraCarry", group: "Camera", track: "camera", how: "measured", from: "wobble and steady movement of the whole picture", val: (f) => (f.jitter > 0.012 ? "handheld" : f.speed > 0.04 ? "smooth" : "locked") },
    { id: "cameraMove", group: "Camera", track: "camera", how: "measured", from: "which way the whole picture slides or grows", val: (f) => (Math.abs(f.zoomRate) > 0.06 && Math.abs(f.zoomRate) * 3 > Math.max(Math.abs(f.panX), Math.abs(f.panY)) ? (f.zoomRate > 0 ? "push in" : "pull out") : Math.max(Math.abs(f.panX), Math.abs(f.panY)) < 0.04 ? "none" : Math.abs(f.panX) >= Math.abs(f.panY) ? "pan" : "tilt") },
    { id: "moveSpeed", group: "Camera", track: "camera", how: "measured", from: "how fast the whole picture slides", val: (f) => clamp(1 + Math.round(f.speed / 0.08), 1, 5) },
    { id: "shotSize", group: "Camera", track: "camera", how: "estimated", from: "how much of the frame skin (faces and hands) fills", val: (f) => (f.skin >= 0.42 ? "close" : f.skin >= 0.2 ? "medium" : "wide") },
    /* Cutting */
    { id: "cutRate", group: "Cutting", track: "master", how: "measured", from: "cuts per minute around this moment", val: (f) => band(f.cutsPerMin, [6, 20], ["slow", "medium", "fast"]) },
    /* People and sound */
    { id: "movementAmount", group: "People and sound", track: "character", how: "measured", from: "movement inside the frame that a camera move does not explain", val: (f) => Math.round(clamp(f.local / 0.03, 0, 5)) },
    { id: "volume", group: "People and sound", track: "character", how: "measured", from: "how loud the sound is", val: (f) => (f.db == null ? null : band(f.db, [-42, -32, -24, -16], [1, 2, 3, 4, 5])) },
    { id: "wordsAmount", group: "People and sound", track: "character", how: "estimated", from: "how much of the time someone is talking (loud stretches)", val: (f) => (f.talk == null ? null : Math.round(clamp(f.talk * 5, 0, 5))) },
    { id: "pace", group: "People and sound", track: "character", how: "estimated", from: "syllables per second while talking (the tempo of the sentences)", val: (f) => (f.sylRate == null ? null : f.talk < 0.15 ? "slow" : band(f.sylRate, [2.5, 4.5], ["slow", "medium", "fast"])) },
    { id: "emoVoice", group: "People and sound", track: "character", how: "estimated", from: "how much the loudness swings", val: (f) => (f.dbSwing == null ? null : band(f.dbSwing, [8, 13, 18, 24], ["hidden", "a hint", "clear", "strong", "overflowing"])) },
    /* Feeling: a guess from the others */
    { id: "emotionIntensity", group: "Feeling", track: "master", how: "estimated", from: "loudness, movement, shake and cutting together", val: (f) => Math.round(clamp(f.energy * 5, 0, 5)) },
    { id: "emotion", group: "Feeling", track: "master", how: "estimated", from: "energy, brightness and warmth together (a guess: a computer cannot see feelings)", val: (f) => (f.energy > 0.55 ? (f.luma > 0.4 && f.warm > 0 ? "joyful" : f.luma < 0.3 ? "angry" : "anxious") : f.energy > 0.3 ? (f.warm > 0.03 ? "loving" : "curious") : f.luma < 0.3 || f.warm < -0.05 ? "melancholy" : "dreamlike") },
  ];

  /* ---------- the clip ---------- */
  /* The sampled frames as even series (one value per sample), plus cuts and the camera's path. */
  function features(clip) {
    const N = clip.samples.length;
    const dur = clip.duration || (N ? clip.samples[N - 1].t : 0);
    const dt = N > 1 ? (clip.samples[N - 1].t - clip.samples[0].t) / (N - 1) : 1;
    const gw = clip.gw || 64;
    const times = clip.samples.map((x) => r3(x.t));
    const get = (k) => clip.samples.map((x) => x.s[k]);
    const raw = { luma: get("luma"), std: get("std"), sat: get("sat"), warm: get("warm"), skin: get("skin"), skinX: get("skinX"), skinY: get("skinY"), colors: get("colors") };
    /* Cuts: a big jump in the colors that stands well above the frames on either side and that sliding the
       picture does not explain. */
    const hd = clip.samples.map((x, i) => (i ? histDistance(clip.samples[i - 1].s.hist, x.s.hist) : 0));
    const cuts = [];
    for (let i = 1; i < N; i++) {
      const around = Math.max(hd[i - 1] || 0, hd[i + 1] || 0);
      const m = clip.samples[i].m;
      /* A whip pan also changes the colors fast, but every frame around it differs too; a cut is one jump
         between two steadier frames. */
      const still = (j) => (clip.samples[j] && clip.samples[j].m ? clip.samples[j].m.still : 0);
      const steadyAround = !m || m.still > 2.5 * Math.max(still(i - 1), still(i + 1));
      if (hd[i] > 0.3 && hd[i] > 2 * around && steadyAround && (!m || (m.shape != null ? m.shape > 0.6 : m.err > 0.06)) && (!cuts.length || clip.samples[i].t - cuts[cuts.length - 1] > 0.4)) cuts.push(r3(clip.samples[i].t));
    }
    /* Camera path: the slide between samples, as a share of the frame width per second (a cut is not a move). */
    const isCut = new Set(cuts);
    const mv = clip.samples.map((x) => (x.m && !isCut.has(r3(x.t)) ? x.m : { dx: 0, dy: 0, zoom: 0, err: 0, still: 0 }));
    const panX = mv.map((m) => -m.dx / gw / dt);
    const panY = mv.map((m) => -m.dy / gw / dt);
    const zoomRate = mv.map((m) => m.zoom / dt);
    /* Where the camera points (summed slides), its steady part (smoothed over a second) and its wobble. */
    const posX = [],
      posY = [],
      zoomPos = [];
    let px = 0,
      py = 0,
      pz = 0;
    for (let i = 0; i < N; i++) {
      px += panX[i] * dt;
      py += panY[i] * dt;
      pz += zoomRate[i] * dt;
      posX.push(px);
      posY.push(py);
      zoomPos.push(pz);
    }
    const win = Math.max(1, Math.round(0.5 / dt));
    /* Shake is the fast part (quicker than about two wobbles a second): what is left after smoothing the path
       over a quarter second each way. Slower swings are camera moves. */
    const shakeWin = Math.max(1, Math.round(0.25 / dt));
    const steadyX = smooth(posX, shakeWin),
      steadyY = smooth(posY, shakeWin);
    const wobX = posX.map((x, i) => x - steadyX[i]),
      wobY = posY.map((y, i) => y - steadyY[i]);
    const jitter = smooth(
      wobX.map((x, i) => Math.hypot(x, wobY[i])),
      win
    );
    const speedRaw = panX.map((x, i) => Math.hypot(x, panY[i]));
    raw.panX = smooth(panX, win);
    raw.panY = smooth(panY, win);
    raw.zoomRate = smooth(zoomRate, win);
    raw.speed = smooth(speedRaw, win);
    raw.jitter = jitter;
    raw.wobX = wobX;
    raw.wobY = wobY;
    raw.steadyX = steadyX;
    raw.steadyY = steadyY;
    raw.zoomPos = zoomPos;
    raw.local = smooth(
      mv.map((m) => m.err / dt / 30),
      win
    ); /* per frame at 30 frames a second */
    raw.cutsPerMin = times.map((t) => {
      const span = Math.min(dur, 6);
      const a = clamp(t - span / 2, 0, Math.max(0, dur - span));
      return (cuts.filter((c) => c >= a && c < a + span).length * 60) / Math.max(span, 1);
    });
    /* Sound, at each sample time. */
    const sp = clip.sound ? speech(clip.sound) : null;
    if (clip.sound && clip.sound.db.length) {
      const env = clip.sound;
      const dbAt = (t0, t1) => {
        const a = clamp(Math.floor(t0 / env.hop), 0, env.db.length - 1),
          b = clamp(Math.ceil(t1 / env.hop), a + 1, env.db.length);
        const part = Array.from(env.db.slice(a, b));
        return part;
      };
      raw.db = times.map((t) => {
        const part = dbAt(t - dt / 2, t + dt / 2);
        return r3(10 * Math.log10(mean(part.map((d) => Math.pow(10, d / 10))) + 1e-12));
      });
      raw.dbSwing = times.map((t) => {
        const part = dbAt(t - 1, t + 1);
        return r3(percentile(part, 0.9) - percentile(part, 0.1));
      });
      raw.talk = times.map((t) => {
        const a = t - 1,
          b = t + 1;
        let on = 0;
        sp.phrases.forEach((p) => (on += Math.max(0, Math.min(b, p.end) - Math.max(a, p.start))));
        return r3(on / 2);
      });
      raw.sylRate = times.map((t) => {
        const a = t - 1.5,
          b = t + 1.5;
        let on = 0;
        sp.phrases.forEach((p) => (on += Math.max(0, Math.min(b, p.end) - Math.max(a, p.start))));
        const n = sp.peaks.filter((x) => x >= a && x < b).length;
        return on > 0.2 ? r3(n / on) : 0;
      });
    }
    /* Energy (0..1): how charged the moment is, for the feeling guesses. */
    raw.energy = times.map((_, i) => {
      const parts = [clamp(raw.local[i] / 0.04, 0, 1), clamp(raw.jitter[i] / 0.04, 0, 1), clamp(raw.cutsPerMin[i] / 20, 0, 1)];
      if (raw.db) parts.push(clamp((raw.db[i] + 45) / 30, 0, 1));
      return r3(mean(parts));
    });
    return { dur, dt, times, raw, cuts, speech: sp };
  }
  /* Nodes: a curiosity changes when its value moves to a new step and stays there for minHold seconds (so a
     flicker is not a change). The first sample is always a node. */
  function nodesOf(curve, times, minHold) {
    const dt = times.length > 1 ? times[1] - times[0] : 1;
    /* Runs of one value; the shortest run under minHold joins the longer of its neighbours, again and again. */
    let runs = [];
    curve.forEach((v, i) => {
      if (v == null) return;
      const last = runs[runs.length - 1];
      if (last && last.value === v) last.n++;
      else runs.push({ i, value: v, n: 1 });
    });
    for (;;) {
      let k = -1;
      runs.forEach((r, j) => r.n * dt < minHold && runs.length > 1 && (k < 0 || r.n < runs[k].n) && (k = j));
      if (k < 0) break;
      const a = runs[k - 1],
        b = runs[k + 1];
      const into = !a ? b : !b ? a : a.n >= b.n ? a : b;
      into.n += runs[k].n;
      if (into === b) b.i = runs[k].i;
      runs.splice(k, 1);
      const merged = [];
      runs.forEach((r) => {
        const last = merged[merged.length - 1];
        if (last && last.value === r.value) last.n += r.n;
        else merged.push(r);
      });
      runs = merged;
    }
    return runs.map((r) => ({ t: times[r.i], value: r.value }));
  }
  function valueAt(nodes, t) {
    let v = nodes.length ? nodes[0].value : null;
    for (const n of nodes) {
      if (n.t <= t + 1e-9) v = n.value;
      else break;
    }
    return v;
  }
  function analyze(clip) {
    const F = features(clip);
    const N = F.times.length;
    const curves = {},
      nodes = {},
      how = {};
    /* Curiosities read the features smoothed over half the shortest change (so one noisy look is not a change). */
    const minHold = Math.max(0.4, Math.min(1.5, F.dur / 40));
    const sm = {};
    const w = Math.max(0, Math.round(minHold / 2 / F.dt));
    Object.keys(F.raw).forEach((k) => (sm[k] = /^(wobX|wobY|steadyX|steadyY|zoomPos)$/.test(k) ? F.raw[k] : smooth(F.raw[k], w)));
    const fs = F.times.map((_, i) => {
      const f = {};
      Object.keys(sm).forEach((k) => (f[k] = sm[k][i]));
      return f;
    });
    LIST.forEach((c) => {
      const curve = fs.map((f) => {
        const v = c.val(f);
        return v == null ? null : S() ? S().fix(c.id, v) : v;
      });
      if (curve.every((v) => v == null)) return;
      curves[c.id] = curve;
      nodes[c.id] = nodesOf(curve, F.times, minHold);
      how[c.id] = { how: c.how, from: c.from };
    });
    /* Moments: even stretches (2.5 s or so, 4 to 24 of them), split at cuts when a cut is near. */
    const count = clamp(Math.round(F.dur / 2.5), 4, 24);
    const moments = [];
    for (let k = 0; k < count; k++) {
      const start = (k * F.dur) / count,
        end = ((k + 1) * F.dur) / count;
      moments.push({ start: r3(start), end: r3(end), label: fmt(start) + "-" + fmt(end) });
    }
    const lanes = {};
    Object.keys(nodes).forEach((id) => (lanes[id] = moments.map((m) => valueAt(nodes[id], (m.start + m.end) / 2))));
    const out = { name: String(clip.name || "A clip").slice(0, 80), title: titleOf(clip.name), aspect: clip.aspect ? r3(clip.aspect) : null, duration: r3(F.dur), dt: r3(F.dt), times: F.times, raw: F.raw, cuts: F.cuts, speech: F.speech, curves, nodes, how, moments, lanes };
    out.summary = summary(out);
    return out;
  }
  function fmt(t) {
    const m = Math.floor(t / 60),
      s = t - m * 60;
    return m ? m + ":" + (s < 10 ? "0" : "") + s.toFixed(0) : s.toFixed(1) + "s";
  }
  function titleOf(name) {
    return (
      String(name || "")
        .replace(/\.[a-z0-9]{2,4}$/i, "")
        .replace(/[_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "this clip"
    );
  }
  function most(arr) {
    const c = {};
    arr.forEach((v) => v != null && (c[v] = (c[v] || 0) + 1));
    return Object.keys(c).sort((a, b) => c[b] - c[a])[0];
  }
  function summary(d) {
    const out = [];
    const shots = d.cuts.length + 1;
    out.push(shots === 1 ? `One continuous shot, ${d.duration.toFixed(1)} seconds long.` : `${shots} shots in ${d.duration.toFixed(1)} seconds (a cut every ${(d.duration / shots).toFixed(1)} seconds on average).`);
    const c = d.curves;
    if (c.cameraCarry) out.push(`The camera is mostly ${most(c.cameraCarry)}${c.cameraShake ? `, shake ${most(c.cameraShake)} of 5` : ""}${c.cameraMove ? `, moves: ${[...new Set(d.nodes.cameraMove.map((n) => n.value))].join(", ")}` : ""}.`);
    if (c.setBrightness) out.push(`The light is mostly ${most(c.setBrightness)} and ${most(c.warmCool)}; it changes ${Math.max(0, d.nodes.setBrightness.length - 1)} time${d.nodes.setBrightness.length === 2 ? "" : "s"} between brighter and darker.`);
    if (d.speech && d.speech.phrases.length) {
      const talk = d.speech.phrases.reduce((s, p) => s + p.end - p.start, 0);
      const syl = d.speech.phrases.reduce((s, p) => s + p.syll, 0);
      out.push(`Talking about ${Math.round((100 * talk) / Math.max(0.1, d.duration))}% of the time, in ${d.speech.phrases.length} phrase${d.speech.phrases.length === 1 ? "" : "s"}, about ${(syl / Math.max(0.1, talk)).toFixed(1)} syllables a second.`);
    } else if (!d.raw.db) out.push("No sound could be read from this clip.");
    else out.push("Nobody seems to talk in this clip (no stretches stand out from the room's sound).");
    return out;
  }
  function series(d, feature) {
    return d.raw[feature] || [];
  }

  /* ---------- onto My film's automation lanes ---------- */
  /* One lane per curiosity, stretched over the film's moments, with a node only where the value changes. The
     lane holds between nodes (a change is a step, as in the clip). */
  function engineCommands(d, st, opts) {
    opts = opts || {};
    const only = opts.only ? new Set(opts.only) : null;
    const rows = st.rows || [];
    if (!rows.length) return [];
    const kindTrack = (kind) => (st.tracks || []).find((t) => t.kind === kind) || (st.tracks || [])[0];
    const cmds = [];
    const added = {};
    LIST.forEach((c) => {
      if (!d.nodes[c.id] || (only && !only.has(c.id))) return;
      const t = kindTrack(c.track);
      if (!t) return;
      const has = (t.curiosities || []).includes(c.id) || (added[t.id] || []).includes(c.id);
      if (!has) {
        if ((t.curiosities || []).length + (added[t.id] || []).length >= 24) return;
        cmds.push({ type: "addCuriosity", track: t.id, curiosity: c.id });
        (added[t.id] = added[t.id] || []).push(c.id);
      } else if (st.lanes && st.lanes[t.id + "|" + c.id]) cmds.push({ type: "clearLane", track: t.id, curiosity: c.id });
      let last = null;
      rows.forEach((r, i) => {
        const tm = ((i + 0.5) * d.duration) / rows.length;
        const v = valueAt(d.nodes[c.id], tm);
        if (v == null || v === last) return;
        cmds.push({ type: "setPoint", row: r.id, track: t.id, curiosity: c.id, value: v });
        last = v;
      });
      if (last != null) cmds.push({ type: "laneMode", track: t.id, curiosity: c.id, mode: "hold" });
    });
    return cmds;
  }
  /* The dissection as an engine reference (values per moment only), for the engine's Analyze list. */
  function toRef(d) {
    return { name: d.title.slice(0, 60), kind: "video", rows: d.moments.map((m) => m.label), lanes: d.lanes };
  }

  /* ---------- applying one clip's curiosities to another ---------- */
  const GROUPS = [
    { id: "light", label: "Light and dark", curiosities: ["valueKey", "setBrightness"], check: "luma", plain: "Brightens and darkens the clip so it gets lighter and darker exactly when, and as fast as, the inspiration does." },
    { id: "contrast", label: "Contrast", curiosities: ["contrast"], check: "std", plain: "Pulls the darks and lights apart or together to follow the inspiration's contrast." },
    { id: "color", label: "Color strength", curiosities: ["saturation", "colorRange"], check: "sat", plain: "Makes colors stronger or weaker over time, following the inspiration." },
    { id: "warmth", label: "Warm and cool", curiosities: ["warmCool", "colorTemp"], check: "warm", plain: "Tints the clip warmer (orange) or cooler (blue) as the inspiration does." },
    { id: "shake", label: "Camera shake", curiosities: ["cameraShake", "cameraCarry"], check: "jitter", plain: "Steadies the clip's own wobble and adds the inspiration's, frame by frame, as if the same hand held the camera." },
    { id: "move", label: "Camera moves", curiosities: ["cameraMove", "moveSpeed"], check: "panX", plain: "Slides and pushes the frame the way the inspiration's camera pans, tilts and pushes in." },
    { id: "size", label: "How close the shot is", curiosities: ["shotSize"], check: "skin", plain: "Moves in closer on the people when the inspiration is closer (it can only move in, not out)." },
    { id: "cuts", label: "Cuts", curiosities: ["cutRate"], check: "cuts", plain: "Cuts where the inspiration cuts, by jumping ahead a little (a jump cut). Cuts already in the clip stay." },
    { id: "speed", label: "Movement speed", curiosities: ["movementAmount"], check: "local", plain: "Speeds the clip up where the inspiration moves more and slows it down where it moves less." },
    { id: "loud", label: "Loudness", curiosities: ["volume", "emoVoice"], check: "db", plain: "Turns the sound up and down so it gets louder and quieter with the inspiration." },
    { id: "dialogue", label: "Dialogue tempo", curiosities: ["wordsAmount", "pace"], check: "speech", plain: "Writes new lines about the clip's title and times them to the inspiration's sentences: same lengths, same pauses, same syllables per second." },
    { id: "overlay", label: "Lay its graphics over", curiosities: ["colorRange"], check: "sat", off: true, plain: "Lays the inspiration's own picture over your clip with its plain light background taken out, so only its graphics (shapes, logos, colored text) show on top. For motion graphics like a title sequence. Off unless you turn it on." },
  ];
  /* Interpolate a per-sample series at time t. */
  function sampleAt(d, arr, t) {
    if (!arr || !arr.length) return 0;
    const x = clamp((t - d.times[0]) / (d.dt || 1), 0, arr.length - 1);
    const i = Math.floor(x),
      f = x - i;
    const a = arr[i],
      b = arr[Math.min(arr.length - 1, i + 1)];
    return a == null || b == null ? a == null ? b || 0 : a : a + (b - a) * f;
  }
  function plan(insp, target, opts) {
    opts = opts || {};
    const mode = opts.mode === "stretch" ? "stretch" : "same";
    const on = {};
    GROUPS.forEach((g) => {
      const v = opts.on ? opts.on[g.id] : g.off ? 0 : 1; /* given a list, what it leaves out is off */
      on[g.id] = v === true ? 1 : clamp(Number(v) || 0, 0, 1);
    });
    const p = { mode, on, insp, target, fps: 30 };
    /* The inspiration's time for an output time: the same seconds (repeating when the clip is longer), or the
       whole inspiration stretched over the clip. */
    p.tA = (t, outDur) => (mode === "stretch" ? (t * insp.duration) / Math.max(0.001, outDur || target.duration) : insp.duration > 0 ? t % insp.duration : 0);
    /* Time map: which moment of the clip shows at each output frame (movement speed and jump cuts change it). */
    const step = 1 / p.fps;
    const src = [];
    let s = 0,
      t = 0;
    const cutsA = insp.cuts || [];
    const outGuess = target.duration;
    const jumped = new Set();
    while (s < target.duration - 1e-6 && src.length < 60 * 60 * p.fps) {
      src.push(r3(s));
      const ta = p.tA(t, outGuess);
      let speed = 1;
      if (on.speed > 0) {
        const want = sampleAt(insp, insp.raw.local, ta),
          have = sampleAt(target, target.raw.local, s);
        speed = clamp(Math.pow(clamp((want + 0.004) / (have + 0.004), 0.25, 4), on.speed), 0.5, 2);
      }
      s += step * speed;
      if (on.cuts > 0 && cutsA.length) {
        const ta2 = p.tA(t + step, outGuess);
        const passes = cutsA.filter((c) => (ta <= ta2 ? c > ta && c <= ta2 : c > ta || c <= ta2));
        passes.forEach((c) => {
          const key = Math.floor((t + step) / Math.max(insp.duration, 0.001)) + ":" + c;
          if (mode === "stretch" || !jumped.has(key)) {
            s += 0.4 * on.cuts;
            jumped.add(key);
          }
        });
      }
      t += step;
    }
    p.src = src;
    p.duration = r3(src.length * step);
    /* Dialogue: new lines on the title's topic, one per phrase of the inspiration's speech, at its times. */
    p.lines = [];
    if (on.dialogue > 0 && insp.speech && insp.speech.phrases.length) {
      const pattern = [];
      if (mode === "stretch") {
        const k = p.duration / Math.max(0.001, insp.duration);
        insp.speech.phrases.forEach((ph) => pattern.push({ start: ph.start * k, end: ph.end * k, syll: ph.syll }));
      } else {
        for (let rep = 0; rep * insp.duration < p.duration; rep++)
          insp.speech.phrases.forEach((ph) => {
            const a = rep * insp.duration + ph.start;
            if (a < p.duration - 0.2) pattern.push({ start: a, end: Math.min(p.duration, rep * insp.duration + ph.end), syll: ph.syll });
          });
      }
      p.lines = opts.lines && opts.lines.length ? opts.lines : fitDialogue(opts.title || target.title, pattern, { seed: opts.seed });
    }
    /* The inspiration's camera moves, made to fit inside the frame's spare edge: its pans and tilts (the steady
       path with its slow drift over two seconds taken out, so a long pan does not run off the frame) and its
       pushes in and pulls out, scaled by the part of the inspiration that is used. */
    const used = mode === "stretch" ? insp.times.length : clamp(Math.ceil(Math.min(insp.duration, p.duration) / (insp.dt || 1)) + 1, 1, insp.times.length);
    const drift = Math.max(1, Math.round(2 / (insp.dt || 1)));
    const less = (a) => {
      const sm = smooth(a, drift);
      return a.map((x, i) => x - sm[i]);
    };
    const mvX = less(insp.raw.steadyX),
      mvY = less(insp.raw.steadyY),
      zp = less(insp.raw.zoomPos);
    const big = (a) => Math.max(1e-6, ...a.slice(0, used).map(Math.abs));
    p.move = { x: mvX, y: mvY, z: zp, kX: Math.min(1, 0.08 / big(mvX)), kY: Math.min(1, 0.08 / big(mvY)), kZ: Math.min(1, 0.15 / big(zp)) };
    /* One zoom for all the slides: enough for nearly all of them (the biggest 3% are held at the edge). */
    p.slideZoom = 1;
    /* Graphics laid over: start where the inspiration is most colorful for as long as your clip lasts (a title
       sequence often opens on a plain card), unless told where to start. */
    if (on.overlay) {
      const span = Math.min(insp.duration, p.duration);
      let from = 0;
      if (opts.overlayFrom != null) from = clamp(Number(opts.overlayFrom) || 0, 0, Math.max(0, insp.duration - 0.1));
      else if (insp.duration > span + 0.5) {
        let best = -1;
        for (let a = 0; a + span <= insp.duration + 1e-6; a += 0.5) {
          const part = insp.times.map((t, i) => (t >= a && t < a + span ? insp.raw.sat[i] : null)).filter((x) => x != null);
          const m = mean(part);
          if (m > best) {
            best = m;
            from = a;
          }
        }
      }
      p.overlayFrom = r3(from);
    }
    if (on.shake || on.move) {
      const need = [];
      for (let k = 0; k < p.src.length; k += 3) {
        const a = at(Object.assign({}, p, { slideZoom: 4 }), k / p.fps);
        need.push(Math.max(Math.abs(a.dx), Math.abs(a.dy) / (target.aspect || 9 / 16)));
      }
      const d = Math.min(0.12, percentile(need, 0.97));
      p.slideZoom = r3(1 / (1 - 2 * d) + 0.005);
    }
    return p;
  }
  function lineAt(p, t) {
    for (const l of p.lines || []) if (t >= l.start && t < l.end) return l;
    return null;
  }
  function at(p, t) {
    const k = clamp(Math.floor(t * p.fps), 0, Math.max(0, p.src.length - 1));
    const s = p.src.length ? p.src[k] : t;
    const A = p.insp,
      B = p.target,
      on = p.on;
    const ta = p.tA(t, p.duration);
    const g = (feat) => [sampleAt(A, A.raw[feat], ta), sampleAt(B, B.raw[feat], s)];
    const mix = (x, amt) => 1 + (x - 1) * amt;
    const adj = { t, src: s, ta, luma: 1, contrast: 1, sat: 1, warm: 0, dx: 0, dy: 0, zoom: 1, cx: 0.5, cy: 0.5, gainDb: 0, duck: 0, line: null };
    if (on.contrast) {
      const [a, b] = g("std");
      adj.contrast = mix(clamp(a / Math.max(0.02, b), 0.4, 2.5), on.contrast);
    }
    if (on.light) {
      const [a, b] = g("luma");
      adj.luma = mix(clamp(a / Math.max(0.03, b), 0.25, 3), on.light);
    }
    if (on.color) {
      const [a, b] = g("sat");
      adj.sat = mix(clamp(a / Math.max(0.02, b), 0, 3), on.color);
    }
    if (on.warmth) {
      const [a, b] = g("warm");
      adj.warm = clamp(a - b, -0.4, 0.4) * on.warmth;
    }
    /* What the inspiration's frame is like now, for a player that measures its own frame after zooming and
       sliding (fitLook): then the gains are exact even when the framing changes. */
    if (on.contrast || on.light || on.color || on.warmth) {
      adj.want = { std: g("std")[0], luma: g("luma")[0], sat: g("sat")[0], warm: g("warm")[0] };
      adj.amt = { contrast: on.contrast, light: on.light, color: on.color, warmth: on.warmth };
    }
    let zoom = 1;
    if (on.size) {
      const [a, b] = g("skin");
      if (a > 0.005 && b > 0.002 && a > b) zoom = Math.max(zoom, mix(clamp(Math.sqrt(a / b), 1, 1.8), on.size));
      adj.cx = sampleAt(B, B.raw.skinX, s);
      adj.cy = sampleAt(B, B.raw.skinY, s);
    }
    let push = 1;
    if (on.move) {
      const f = p.move;
      adj.dx += sampleAt(A, f.x, ta) * f.kX * on.move;
      adj.dy += sampleAt(A, f.y, ta) * f.kY * on.move;
      /* Kept 15% in so a pull out has room: push runs from 0.87 (pulled out) to 1.3 (pushed in). */
      push = 1.15 * clamp(1 + sampleAt(A, f.z, ta) * f.kZ * on.move, 0.87 / 1.15, 1.3 / 1.15);
    }
    if (on.shake) {
      /* Steady the clip's own wobble (move against it), then add the inspiration's: the same hand on the camera.
         The clip's wobble here comes from its dissection; a player that watches the frames itself (clip.js)
         puts its own, frame-exact measure in place of unsteady. */
      adj.unsteadyX = clamp(sampleAt(B, B.raw.wobX, s), -0.06, 0.06) * on.shake;
      adj.unsteadyY = clamp(sampleAt(B, B.raw.wobY, s), -0.06, 0.06) * on.shake;
      adj.unsteadyAmount = on.shake;
      adj.dx += clamp(sampleAt(A, A.raw.wobX, ta), -0.06, 0.06) * on.shake - adj.unsteadyX;
      adj.dy += clamp(sampleAt(A, A.raw.wobY, ta), -0.06, 0.06) * on.shake - adj.unsteadyY;
    }
    /* The frame must still cover the screen after sliding: one zoom for the whole clip (worked out in plan, so
       the picture does not breathe), and slides held inside the edge it leaves. */
    if (adj.dx || adj.dy) {
      const z = Math.max(zoom, p.slideZoom || 1) * push;
      const mx = (1 - 1 / z) / 2,
        my = mx * (B.aspect || 9 / 16);
      adj.margin = { x: mx, y: my };
      adj.dx = clamp(adj.dx, -mx, mx);
      adj.dy = clamp(adj.dy, -my, my);
      zoom = z;
    } else zoom *= push;
    adj.zoom = r3(Math.max(1, zoom));
    if (on.loud && A.raw.db && B.raw.db) {
      const [a, b] = g("db");
      adj.gainDb = clamp(a - b, -24, 18) * on.loud;
    }
    if (on.overlay) {
      const room = Math.max(0.1, A.duration - (p.overlayFrom || 0));
      adj.overlay = { t: r3((p.overlayFrom || 0) + (p.mode === "stretch" ? ((t / Math.max(0.001, p.duration)) * room) : t % room)), amount: on.overlay };
    }
    if (on.dialogue && p.lines.length) {
      adj.line = lineAt(p, t);
      adj.duck = on.dialogue; /* the clip's own voices step back under the new lines */
    }
    return adj;
  }
  /* Light, contrast, color strength and warmth, pixel by pixel (RGBA, in place). m is the frame's mean
     brightness (0..1) before the change. */
  function paint(data, w, h, a, m) {
    if (a.luma === 1 && a.contrast === 1 && a.sat === 1 && !a.warm) return;
    const mm = (m == null ? 0.5 : m) * 255;
    const rw = 1 + a.warm,
      bw = 1 - a.warm;
    for (let p = 0; p < w * h * 4; p += 4) {
      let r = data[p],
        g = data[p + 1],
        b = data[p + 2];
      r = (mm + (r - mm) * a.contrast) * a.luma;
      g = (mm + (g - mm) * a.contrast) * a.luma;
      b = (mm + (b - mm) * a.contrast) * a.luma;
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      r = (y + (r - y) * a.sat) * rw;
      g = y + (g - y) * a.sat;
      b = (y + (b - y) * a.sat) * bw;
      data[p] = r < 0 ? 0 : r > 255 ? 255 : r;
      data[p + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      data[p + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
  }

  /* A quick look at a frame (every step-th pixel): brightness, its spread, color strength, warmth. */
  function quickStats(data, step) {
    step = Math.max(1, step || 7);
    let n = 0,
      sy = 0,
      syy = 0,
      ss = 0,
      sw = 0;
    for (let p = 0; p < data.length; p += 4 * step) {
      const r = data[p] / 255,
        g = data[p + 1] / 255,
        b = data[p + 2] / 255;
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      const mx = Math.max(r, g, b),
        mn = Math.min(r, g, b);
      sy += y;
      syy += y * y;
      ss += mx > 0 ? (mx - mn) / mx : 0;
      sw += r - b;
      n++;
    }
    const luma = sy / Math.max(1, n);
    return { luma, std: Math.sqrt(Math.max(0, syy / Math.max(1, n) - luma * luma)), sat: ss / Math.max(1, n), warm: sw / Math.max(1, n) };
  }
  /* The light and color gains from the frame as it actually is (after zoom and slide) to the inspiration's. */
  function fitLook(adj, have) {
    if (!adj.want || !have) return adj;
    const mix = (x, amt) => 1 + (x - 1) * amt;
    const w = adj.want,
      a = adj.amt;
    const out = Object.assign({}, adj);
    if (a.contrast) out.contrast = mix(clamp(w.std / Math.max(0.02, have.std), 0.4, 2.5), a.contrast);
    if (a.light) out.luma = mix(clamp(w.luma / Math.max(0.03, have.luma), 0.25, 3), a.light);
    if (a.color) out.sat = mix(clamp(w.sat / Math.max(0.02, have.sat), 0, 3), a.color);
    if (a.warmth) out.warm = clamp(w.warm - have.warm, -0.4, 0.4) * a.warmth;
    return out;
  }

  /* Take out a graphic's plain background: light, nearly colorless pixels (white, pale grey, a pale tint, a
     grey checkerboard) become see-through, with a soft edge; color, dark text and shapes stay. amount 0..1 is
     how strongly what stays covers the picture underneath. RGBA in place. */
  function keyOut(data, amount) {
    const a = amount == null ? 1 : clamp(amount, 0, 1);
    for (let p = 0; p < data.length; p += 4) {
      const r = data[p],
        g = data[p + 1],
        b = data[p + 2];
      const mx = Math.max(r, g, b),
        mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      const y = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      /* How much it looks like background: pale (bright) and plain (colorless). */
      const pale = clamp((y - 0.45) / 0.15, 0, 1),
        plain = clamp((0.2 - sat) / 0.1, 0, 1);
      data[p + 3] = Math.round(255 * a * (1 - pale * plain));
    }
  }

  /* ---------- dialogue ---------- */
  function syllables(text) {
    return String(text || "")
      .toLowerCase()
      .split(/[^a-z']+/)
      .filter(Boolean)
      .reduce((s, w) => {
        if (w.length <= 3) return s + 1;
        let n = (w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g) || []).length;
        return s + Math.max(1, n);
      }, 0);
  }
  /* Lines for a topic. The topic is the clip's title (Jeremy's words): a name in it is the person the lines are
     for; known kinds of title (get well, birthday, thanks, love, a show or brand) pick the kind of line. */
  const COMMON = new Set("a an and the of to for we you i me my our your is are be with in on at it this that get well we love thank thanks happy birthday ver version final clip video theme".split(" "));
  const BANKS = {
    getwell: ["get well soon", "we miss you", "we love you so much", "rest up and feel better", "you are in our hearts", "sending you all our love", "everyone here is thinking of you", "we can't wait to see you again", "take it easy and heal up", "the whole table says hello", "you've got this", "hurry back to us", "big hugs from all of us", "feel better every day", "we are all cheering for you", "come home soon"],
    birthday: ["happy birthday", "here's to another great year", "make a wish", "we love you", "have the best day", "cake is on the way", "many happy returns", "you deserve it all"],
    thanks: ["thank you so much", "we couldn't have done it without you", "you made our day", "thanks for everything", "we are so grateful", "you're the best"],
    show: ["welcome back to the show", "here's what's coming up", "stay with us", "we've got a lot to talk about", "let's get into it", "this is where it all comes together", "you won't want to miss this", "more after this"],
    any: ["here we go", "this is the moment", "let's take a look", "you can feel it", "something is about to change", "keep watching", "that's the whole idea", "and that's how it goes"],
  };
  function topicOf(title) {
    const t = String(title || "").toLowerCase();
    const kind = /get well|feel better|recover|heal/.test(t) ? "getwell" : /birthday/.test(t) ? "birthday" : /thank/.test(t) ? "thanks" : /theme|show|cube|intro|episode|news/.test(t) ? "show" : "any";
    const words = String(title || "")
      .replace(/\.[a-z0-9]{2,4}$/i, "")
      .split(/[^A-Za-z']+/)
      .filter((w) => w && !COMMON.has(w.toLowerCase()) && !/^\d/.test(w));
    const name = words.find((w) => /^[A-Z]/.test(w)) || words[0] || "";
    return { kind, name, words };
  }
  function seeded(seed) {
    let x = (seed >>> 0) || 1;
    return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  function fitDialogue(title, pattern, opts) {
    opts = opts || {};
    const top = topicOf(title);
    const rnd = seeded(opts.seed || 7);
    const bank = BANKS[top.kind].concat(top.kind === "any" ? [] : BANKS.any.slice(0, 3));
    const withName = (s) => (top.name ? [s, s + ", " + top.name, top.name + ", " + s] : [s]);
    const cands = [];
    bank.forEach((s) => withName(s).forEach((x) => cands.push({ text: x[0].toUpperCase() + x.slice(1), syll: syllables(x) })));
    if (top.name) cands.push({ text: top.name + "!", syll: syllables(top.name) });
    if (top.words.length > 1) {
      const w = top.words.join(" ");
      cands.push({ text: "This one is all about " + w, syll: syllables("this one is all about " + w) });
    }
    const used = new Map();
    return pattern.map((ph) => {
      const want = ph.syll;
      /* Fill the phrase with one or two lines whose syllables add up closest to the phrase's. */
      let best = null;
      const score = (s, txt) => Math.abs(s - want) + (used.get(txt) || 0) * 1.5 + rnd() * 0.3;
      cands.forEach((a) => {
        const sc = score(a.syll, a.text);
        if (!best || sc < best.sc) best = { sc, text: a.text, syll: a.syll };
        if (a.syll < want)
          cands.forEach((b) => {
            if (b === a) return;
            const txt = a.text + ". " + b.text;
            const sc2 = score(a.syll + b.syll, txt) + 0.5 + (used.get(b.text) || 0);
            if (sc2 < best.sc) best = { sc: sc2, text: txt, syll: a.syll + b.syll };
          });
      });
      used.set(best.text, (used.get(best.text) || 0) + 1);
      return { start: r3(ph.start), end: r3(ph.end), text: best.text + (/[.!?]$/.test(best.text) ? "" : "."), syll: best.syll, want };
    });
  }

  /* ---------- checks ---------- */
  /* Before and after against the inspiration, for one group: the correlation over time (1 = rises and falls
     together) and the average gap. */
  function score(p, group, before, after) {
    const g = GROUPS.find((x) => x.id === group);
    const feat = g ? g.check : group;
    const A = p.insp;
    const tA = after.times.map((t) => p.tA(t, p.duration));
    if (feat === "cuts") return { feature: "cuts", inspiration: A.cuts.length, before: before.cuts.length, after: after.cuts.length };
    if (feat === "speech") {
      const sum = (d) => {
        const ph = (d.speech && d.speech.phrases) || [];
        const talk = ph.reduce((s, x) => s + x.end - x.start, 0);
        const syl = ph.reduce((s, x) => s + x.syll, 0);
        return { phrases: ph.length, perMinute: r3((ph.length * 60) / Math.max(0.1, d.duration)), sylPerSec: r3(syl / Math.max(0.1, talk)), talkShare: r3(talk / Math.max(0.1, d.duration)) };
      };
      return { feature: "speech", inspiration: sum(A), before: sum(before), after: sum(after) };
    }
    const want = tA.map((ta) => sampleAt(A, A.raw[feat], ta));
    const bt = after.times.map((t, i) => sampleAt(before, before.raw[feat], p.src[clamp(Math.round(t * p.fps), 0, p.src.length - 1)]));
    const af = after.raw[feat] || [];
    const gap = (x) => r3(mean(x.map((v, i) => Math.abs(v - want[i]))));
    return { feature: feat, corrBefore: r3(corr(bt, want)), corrAfter: r3(corr(af, want)), gapBefore: gap(bt), gapAfter: gap(af) };
  }

  /* One analyzer for the app: a dissection in the sample shape the media window (media/media.js, CurioMedia) reads,
     { duration, step, every, samples: [{ t, luma, contrast, sat, warm, cut, motion }] }, so its beats, highlights
     and studies come from these measures (subpixel motion, the steadier cut rule) instead of a second pass. */
  function toMedia(d, step) {
    const cuts = d.cuts || [];
    const samples = d.times.map((t, i) => ({
      t,
      luma: d.raw.luma[i],
      contrast: d.raw.std[i],
      sat: d.raw.sat[i],
      warm: d.raw.warm[i],
      cut: cuts.some((c) => Math.abs(c - t) < d.dt / 2),
      motion: r3(clamp((d.raw.local ? d.raw.local[i] : 0) / 0.04, 0, 1)),
    }));
    return { name: d.name, duration: d.duration, step: step || 2.5, every: d.dt, samples };
  }

  root.CurioVideo = { toMedia, keyOut, quickStats, fitLook, frameStats, toGray, motion, histDistance, envelope, speech, analyze, LIST, GROUPS, engineCommands, toRef, plan, at, paint, fitDialogue, syllables, topicOf, corr, series, score, sampleAt, valueAt, smooth };
})();
