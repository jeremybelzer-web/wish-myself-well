/* video/rhythm.js: the inspiration's rhythm, put onto another clip so you can see it (and, if you like, hear it).
   - Finding it: where the sound suddenly gets louder or brighter (onsets: the rise of each frequency band, every
     10 ms), the beat's speed (tempo: how far apart the onsets repeat, by autocorrelation, leaning toward 120 beats
     a minute), then the beats themselves (a path through the onsets that keeps that spacing). Strong onsets are
     accents. No beats come from silence. With no clear beat (talking, a crowd), the clip's cuts are its beat, or,
     with no cuts, its strongest sounds (claps, shouts).
   - Applying it ("Rhythm", off unless turned on): on every beat a jump cut (a little ahead in your clip) and a
     punch-in (alternating close and wide, with a small bump), and a quick flash on strong accents.
     "Hold and burst" freezes your clip on each beat, then rushes to catch up before the next one.
     "Its music under yours" mixes the inspiration's sound under your clip in Play and in a saved video.
   Arithmetic only, so Node tests can feed it made-up sound. draw() needs a canvas.

   window.CurioRhythm
   - onsets(pcm, rate) -> { hop, t0, o: Float32Array, db: Float32Array }   onset strength and loudness every 10 ms
   - find(pcm, rate, { cuts?, duration? }) -> { from: "sound" | "cuts" | "accents" | "none", bpm, period, clarity, beats: [t],
       strength: [0..1 per beat], accents: [t] }   (dissection.rhythm, values only)
   - fromCuts(cuts, duration), of(dissection) -> the rhythm to use (its own, or one from its cuts)
   - retime(plan, src) -> src with the jumps and holds (CurioVideo.plan calls it; sets plan.rhythm, output times)
   - at(plan, t, adj)   adds the punch-in to adj.zoom and adj.rhythm = { flash, beat } (CurioVideo.at calls it)
   - draw(ctx, W, H, r)   the flash;   score(plan, before, after) -> in step with the beat, before and after */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const V = () => root.CurioVideo;
  const HOP = 0.01;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const pct = (a, p) => {
    const s = Array.from(a).sort((x, y) => x - y);
    return s.length ? s[clamp(Math.floor(p * (s.length - 1)), 0, s.length - 1)] : 0;
  };

  /* ---------- finding the beat ---------- */
  /* In-place radix-2 FFT (re, im of length 2^k). */
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let b = n >> 1;
      for (; j & b; b >>= 1) j ^= b;
      j ^= b;
      if (i < j) {
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const a = (-2 * Math.PI) / len,
        wr = Math.cos(a),
        wi = Math.sin(a);
      for (let i = 0; i < n; i += len) {
        let cr = 1,
          ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const p = i + k,
            q = p + len / 2;
          const tr = re[q] * cr - im[q] * ci,
            ti = re[q] * ci + im[q] * cr;
          re[q] = re[p] - tr;
          im[q] = im[p] - ti;
          re[p] += tr;
          im[p] += ti;
          const nr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr;
          cr = nr;
        }
      }
    }
  }
  /* Onset strength: how much each of 24 bands got louder since the last step (rises only, in log loudness),
     summed, with its slow average taken off. Also the loudness (dB), to keep beats out of silence. */
  function onsets(pcm, rate) {
    const hop = Math.max(1, Math.round(rate * HOP));
    let N = 256;
    while (N < rate * 0.04) N <<= 1;
    const frames = Math.max(0, Math.floor((pcm.length - N) / hop) + 1);
    const o = new Float32Array(frames),
      db = new Float32Array(frames);
    const B = 24,
      edges = [];
    /* bands spaced evenly in log frequency from 60 Hz to 6 kHz (or half the rate) */
    const top = Math.min(6000, rate / 2 - 1);
    for (let b = 0; b <= B; b++) edges.push(Math.max(1, Math.round(((60 * Math.pow(top / 60, b / B)) * N) / rate)));
    const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
    const re = new Float32Array(N),
      im = new Float32Array(N);
    let prev = null;
    for (let f = 0; f < frames; f++) {
      const off = f * hop;
      let e = 0;
      for (let i = 0; i < N; i++) {
        const x = pcm[off + i] || 0;
        e += x * x;
        re[i] = x * win[i];
        im[i] = 0;
      }
      db[f] = Math.max(-90, 10 * Math.log10(e / N + 1e-12));
      fft(re, im);
      const L = new Float32Array(B);
      for (let b = 0; b < B; b++) {
        let s = 0;
        for (let k = edges[b]; k < Math.max(edges[b] + 1, edges[b + 1]); k++) s += re[k] * re[k] + im[k] * im[k];
        L[b] = Math.log(1 + 1000 * Math.sqrt(s));
      }
      let flux = 0;
      if (prev) for (let b = 0; b < B; b++) flux += Math.max(0, L[b] - prev[b]);
      o[f] = flux;
      prev = L;
    }
    /* take off the running average over 0.4 s, keep the rises */
    const w = 20;
    const cs = new Float64Array(frames + 1);
    for (let i = 0; i < frames; i++) cs[i + 1] = cs[i] + o[i];
    const out = new Float32Array(frames);
    for (let i = 0; i < frames; i++) {
      const a = Math.max(0, i - w),
        z = Math.min(frames, i + w + 1);
      out[i] = Math.max(0, o[i] - (cs[z] - cs[a]) / (z - a));
    }
    /* t0: when step 0's onset is heard (a sound counts once it is three quarters into the window) */
    return { hop: hop / rate, t0: (0.75 * N) / rate, o: out, db };
  }
  /* Tempo: the spacing at which the onsets repeat best (autocorrelation), from 40 to 240 beats a minute, each
     spacing weighed by how usual it is (most music sits near 120). clarity: how strongly they repeat (0..1). */
  function tempo(o, hop) {
    const n = o.length;
    const m = mean(Array.from(o));
    const x = Float32Array.from(o, (v) => v - m);
    const lo = Math.round(0.25 / hop),
      hi = Math.min(Math.round(1.5 / hop), Math.floor(n / 2));
    if (hi <= lo + 2) return { period: 0, clarity: 0 };
    let e0 = 0;
    for (let i = 0; i < n; i++) e0 += x[i] * x[i];
    if (e0 <= 1e-9) return { period: 0, clarity: 0 };
    const ac = new Float32Array(hi + 2);
    for (let L = lo - 1; L <= hi + 1; L++) {
      let s = 0;
      for (let i = L; i < n; i++) s += x[i] * x[i - L];
      ac[L] = s / e0 / ((n - L) / n); /* fair to long spacings, which overlap less */
    }
    let best = -1,
      bL = 0;
    for (let L = lo; L <= hi; L++) {
      const w = Math.exp(-0.5 * Math.pow(Math.log2((L * hop) / 0.5) / 1.2, 2));
      if (ac[L] * w > best && ac[L] >= ac[L - 1] && ac[L] >= ac[L + 1]) {
        best = ac[L] * w;
        bL = L;
      }
    }
    if (!bL) return { period: 0, clarity: 0 };
    /* the peak between two steps (a parabola through three) */
    const a = ac[bL - 1],
      b = ac[bL],
      c = ac[bL + 1];
    const d = a - 2 * b + c;
    const L = bL + (d < 0 ? clamp((0.5 * (a - c)) / d, -0.5, 0.5) : 0);
    return { period: L * hop, clarity: clamp(b, 0, 1) };
  }
  /* Beats: the path through the onsets that keeps to the tempo (dynamic programming: each beat adds its onset
     strength, and steps far from one period cost), then beats where nothing sounds are dropped. */
  function track(o, db, hop, period) {
    const n = o.length,
      P = period / hop;
    const sd = Math.sqrt(mean(Array.from(o, (v) => v * v))) || 1;
    const on = Float32Array.from(o, (v) => v / sd);
    const C = new Float32Array(n),
      back = new Int32Array(n).fill(-1);
    const tight = 100;
    for (let t = 0; t < n; t++) {
      let best = 0,
        bi = -1;
      for (let s = Math.max(0, Math.round(t - 2 * P)); s <= t - Math.round(P / 2); s++) {
        const v = C[s] - tight * Math.pow(Math.log((t - s) / P), 2);
        if (v > best) {
          best = v;
          bi = s;
        }
      }
      C[t] = on[t] + best;
      back[t] = bi;
    }
    /* end on the best score in the last period */
    let e = n - 1;
    for (let t = Math.max(0, Math.round(n - P)); t < n; t++) if (C[t] > C[e]) e = t;
    const beats = [];
    for (let t = e; t >= 0; t = back[t]) beats.unshift(t);
    /* no beats from silence: the sound around the beat must be well above the quiet parts and something must
       start near it */
    const loud = pct(db, 0.98),
      quiet = pct(db, 0.05);
    const floor = Math.max(-60, quiet + 0.25 * (loud - quiet), loud - 40);
    const near = Math.max(2, Math.round(P * 0.2));
    return beats.filter((t) => {
      let mx = -90,
        om = 0;
      for (let i = Math.max(0, t - near); i <= Math.min(n - 1, t + near); i++) {
        mx = Math.max(mx, db[i]);
        om = Math.max(om, on[i]);
      }
      return loud > -60 && mx > floor && om > 0.5;
    });
  }
  /* Accents: onsets that stand out (well above the usual onset), at least apart seconds (0.25) apart, strongest
     first. */
  function accents(o, db, hop, apart) {
    const n = o.length;
    const loud = pct(db, 0.98);
    const nz = Array.from(o).filter((v) => v > 0);
    if (!nz.length || loud < -60) return [];
    const thr = Math.max(pct(nz, 0.9), mean(nz) * 2);
    const gap = Math.round((apart || 0.25) / hop);
    const peaks = [];
    for (let i = 1; i < n - 1; i++) if (o[i] >= thr && o[i] >= o[i - 1] && o[i] > o[i + 1]) peaks.push(i);
    /* the hardest hit is the loudest just after its onset */
    const hit = (i) => Math.max(...Array.from(db.subarray(i, Math.min(n, i + 5))));
    peaks.sort((a, b) => hit(b) - hit(a));
    const keep = [];
    peaks.forEach((i) => {
      if (keep.every((k) => Math.abs(k - i) >= gap)) keep.push(i);
    });
    return keep; /* loudest first */
  }
  function find(pcm, rate, opts) {
    opts = opts || {};
    const dur = opts.duration || (pcm && rate ? pcm.length / rate : 0);
    if (!pcm || !rate || pcm.length < rate) return fromCuts(opts.cuts, dur);
    const O = onsets(pcm, rate);
    const T = tempo(O.o, O.hop);
    const peak = (t) => {
      const i = Math.round((t - O.t0) / O.hop);
      let m = 0;
      for (let k = Math.max(0, i - 2); k <= Math.min(O.o.length - 1, i + 2); k++) m = Math.max(m, O.o[k]);
      return m;
    };
    /* the hardest hits only: about one every two beats, never closer than a beat and a half, so the flashes stay special */
    const all = accents(O.o, O.db, O.hop, Math.max(0.25, 1.5 * T.period));
    const most = Math.max(2, Math.round(dur / (2 * (T.period || 1))));
    const acc = all
      .slice(0, most)
      .sort((a, b) => a - b)
      .map((i) => r3(i * O.hop + O.t0));
    /* a clear beat: the onsets repeat strongly, and the beats found cover most of the clip */
    let beats = T.period ? track(O.o, O.db, O.hop, T.period).map((i) => i * O.hop + O.t0) : [];
    const covered = beats.length * T.period;
    const clear = T.clarity >= 0.2 && beats.length >= 6 && covered > 0.4 * Math.min(dur, O.o.length * O.hop);
    if (!clear) {
      /* no clear beat: its cuts, or else its strongest sounds (a clap, a shout), at least 0.4 s apart */
      const c = fromCuts(opts.cuts, dur);
      c.clarity = r3(T.clarity);
      if (c.beats.length >= 2) return c;
      const hits = acc.filter((t, i) => !i || t - acc[i - 1] >= 0.4);
      if (hits.length >= 4) return Object.assign(fromCuts(hits, dur), { from: "accents", clarity: r3(T.clarity), accents: acc });
      return { from: "none", bpm: 0, period: 0, clarity: r3(T.clarity), beats: [], strength: [], accents: acc };
    }
    const top = pct(beats.map(peak), 0.9) || 1;
    return {
      from: "sound",
      bpm: Math.round((600 / T.period)) / 10,
      period: r3(T.period),
      clarity: r3(T.clarity),
      beats: beats.map(r3),
      strength: beats.map((t) => r3(clamp(peak(t) / top, 0, 1))),
      accents: acc,
    };
  }
  /* No clear beat: the cuts are the beat (each one an accent too). */
  function fromCuts(cuts, duration) {
    const c = (cuts || []).filter((t) => t > 0.05 && (!duration || t < duration - 0.05));
    const gaps = c.slice(1).map((t, i) => t - c[i]);
    const period = gaps.length ? pct(gaps, 0.5) : c.length ? Math.min(c[0], (duration || c[0] * 2) - c[0]) : 0;
    return { from: c.length ? "cuts" : "none", bpm: period ? Math.round(600 / period) / 10 : 0, period: r3(period), clarity: 0, beats: c.map(r3), strength: c.map(() => 1), accents: c.map(r3) };
  }
  /* The rhythm a dissection carries, or one from its cuts (clips taken apart before rhythm.js existed). */
  function of(d) {
    if (!d) return null;
    if (d.rhythm && d.rhythm.beats && d.rhythm.beats.length) return d.rhythm;
    return fromCuts(d.cuts, d.duration);
  }

  /* ---------- applying it ---------- */
  /* The inspiration's beats and accents in output time: the same seconds (repeating) or stretched. Beats closer
     than 0.35 s are taken every other one, so the cuts stay watchable. */
  function outTimes(p, R, dur) {
    const D = Math.max(0.001, p.insp.duration);
    const map = (list) => {
      const out = [];
      if (p.mode === "stretch") list.forEach((t, i) => out.push([(t * dur) / D, i]));
      else for (let r = 0; r * D < dur; r++) list.forEach((t, i) => r * D + t < dur && out.push([r * D + t, i]));
      return out;
    };
    let beats = map(R.beats).map(([t, i]) => ({ t: r3(t), s: R.strength[i] == null ? 1 : R.strength[i] }));
    const k = p.mode === "stretch" ? dur / D : 1;
    if (R.period * k < 0.35 && beats.length > 2) beats = beats.filter((_, i) => i % 2 === 0);
    return { beats, accents: map(R.accents || []).map(([t]) => r3(t)), period: r3(R.period * k) };
  }
  /* The time map with the beat in it. Jump cut: on each beat your clip skips ahead (a third of a beat, at most
     0.6 s). Hold and burst: your clip stands still from the beat for up to 40% of the beat, then plays fast to
     the moment it would have reached. */
  function retime(p, src) {
    const amt = p.on.rhythm || 0,
      burst = p.on.burst || 0;
    if (!(amt > 0 || burst > 0)) return src;
    const R = of(p.insp);
    if (!R || !R.beats.length) return src;
    const step = 1 / p.fps,
      dur = src.length * step;
    const B = outTimes(p, R, dur);
    p.rhythm = B;
    const jump = amt * clamp(B.period / 3, 0.2, 0.6);
    const hold = 0.4 * burst;
    const base = (t) => src[clamp(Math.round(t / step), 0, src.length - 1)];
    const out = [];
    let k = -1,
      off = 0;
    for (let f = 0; f < src.length; f++) {
      const t = f * step;
      while (k + 1 < B.beats.length && B.beats[k + 1].t <= t + 1e-6) {
        k++;
        off += jump;
      }
      let s = src[f];
      if (hold > 0 && k >= 0) {
        const a = B.beats[k].t,
          z = k + 1 < B.beats.length ? B.beats[k + 1].t : a + (B.period || 0.5);
        const u = (t - a) / Math.max(step, z - a);
        const w = u < hold ? 0 : (u - hold) / (1 - hold);
        s = base(a) + w * (base(z) - base(a));
      }
      s += off;
      if (s > p.target.duration - step) break;
      out.push(r3(s));
    }
    return out.length > p.fps ? out : src;
  }
  /* At output time t: the punch-in (beats alternate close and wide, each with a quick extra push that settles in
     0.15 s) and the flash (strong accents, fading in 0.12 s). */
  function at(p, t, adj) {
    const B = p.rhythm;
    if (!B || !B.beats.length) return;
    const amt = p.on.rhythm || 0;
    let k = -1;
    for (let i = 0; i < B.beats.length && B.beats[i].t <= t + 1e-6; i++) k = i;
    let flash = 0;
    for (const a of B.accents) {
      if (a > t + 1e-6) break;
      if (t - a < 0.4) flash = Math.max(flash, Math.exp(-(t - a) / 0.12));
    }
    if (!amt) return;
    let zoom = 1;
    if (k >= 0) {
      const b = B.beats[k];
      const close = k % 2 === 0 ? 1 + 0.4 * amt * (0.6 + 0.4 * b.s) : 1;
      zoom = close * (1 + 0.08 * amt * Math.exp(-(t - b.t) / 0.15));
      /* when the people are known, punch in on them */
      const T = p.target;
      if (!p.on.size && T.raw && T.raw.skinX && V()) {
        const s = adj.src;
        if (V().sampleAt(T, T.raw.skin, s) > 0.004) {
          adj.cx = r3(V().sampleAt(T, T.raw.skinX, s));
          adj.cy = r3(V().sampleAt(T, T.raw.skinY, s));
        }
      }
    }
    adj.zoom = r3(Math.max(1, (adj.zoom || 1) * zoom));
    adj.rhythm = { beat: k, flash: r3(flash * amt) };
  }
  /* The flash: light added over the whole frame (a white-out at full strength on the strongest accent). */
  function draw(ctx, W, H, r) {
    if (!r || !(r.flash > 0.01)) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255,255,255,${clamp(r.flash * 0.6, 0, 0.6)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  /* In step with the beat: how much the picture changes (brightness and contrast jumps, and movement) at each
     sample, against a pulse on the beats, as a correlation (1 = it changes exactly on the beat). */
  function score(p, before, after) {
    const B = p.rhythm;
    if (!B || !B.beats.length) return { feature: "rhythm", note: "the inspiration has no beat or cuts to follow" };
    const times = after.times,
      dt = after.dt || 0.1;
    const pulse = times.map((t) => (B.beats.some((b) => t >= b.t - dt * 0.5 && t < b.t + dt * 1.5) ? 1 : 0));
    const change = (d, i, j) => Math.abs(d.raw.luma[i] - d.raw.luma[j]) + Math.abs(d.raw.std[i] - d.raw.std[j]);
    const af = times.map((_, i) => (i ? change(after, i, i - 1) + (after.raw.local ? after.raw.local[i] : 0) : 0));
    const bt = times.map((t, i) => {
      if (!i) return 0;
      const s = (x) => p.src[clamp(Math.round(x * p.fps), 0, p.src.length - 1)];
      const at = (x) => clamp(Math.round((s(x) - before.times[0]) / (before.dt || 1)), 0, before.times.length - 1);
      const a = at(t),
        b = at(times[i - 1]);
      return a === b ? 0 : change(before, a, b) + (before.raw.local ? before.raw.local[a] : 0);
    });
    return { feature: "rhythm", beats: B.beats.length, corrBefore: r3(V().corr(bt, pulse)), corrAfter: r3(V().corr(af, pulse)) };
  }

  /* The groups it adds to CurioVideo.GROUPS (all off unless turned on). */
  const GROUPS = [
    { id: "rhythm", label: "Rhythm (beat and accents)", curiosities: ["cutRate", "pace"], check: "rhythm", off: true, plain: "Finds the beat in the inspiration's music (or its cuts, when there is no clear beat) and cuts your clip to it: on every beat a jump cut and a punch-in (close, then wide, then close), and a quick flash on the strongest hits. Off unless you turn it on." },
    { id: "burst", label: "Hold and burst on the beat", curiosities: ["pace"], check: "rhythm", off: true, plain: "Freezes your clip on each beat of the inspiration, then rushes it forward to catch up before the next beat: a stop-start pulse. Off unless you turn it on." },
    { id: "music", label: "Its music under yours", curiosities: ["volume"], check: "db", off: true, plain: "Plays the inspiration's sound under your clip (your own sound turned down), in time with its beat, in Play and in a saved video. Off unless you turn it on." },
  ];
  if (V() && V().GROUPS && !V().GROUPS.some((g) => g.id === "rhythm")) V().GROUPS.push(...GROUPS);

  root.CurioRhythm = { onsets, tempo, track, accents, find, fromCuts, of, outTimes, retime, at, draw, score, GROUPS };
})();
