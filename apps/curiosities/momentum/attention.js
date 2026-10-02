/* momentum/attention.js: the attention model. Jeremy's thesis (2026-10-02): the audience's attention can only
   rest on one thing at a time; when what holds it keeps moving between different curiosities, the film feels
   rich and keeps going somewhere. So the app shows how long attention has rested on each curiosity, warns
   when one runs too long, and records which cue (visual, audio, thought, movement, plot) moved it on.

   Part of the momentum core (no page). Needs momentum/notes.js (window.CurioMomentum).

   How attention is read from a film (a study, a storyboard scene, an analyzed script, or My film live):
   1. A film is a list of beats, each with a time and the curiosity values that are on.
   2. At each beat, every curiosity whose value changed is a candidate for the audience's attention. Its pull
      is how big the change is (steps along its scale), times how strongly its family draws the eye
      (FAMILY_PULL: faces, voices and plot pull hardest), nudged up by how much it pushes the story (push).
   3. The strongest candidate takes attention, if its pull is over SHIFT_MIN; otherwise attention stays where
      it was. The cue is that curiosity's usual cue. A change down to nothing (music stops, a silence, a body
      going still) is marked as a non-action cue ("quiet").
   4. Attention stays on that curiosity until another one takes it. That stretch is a segment.
   These are guesses about how people watch, set out in plain numbers so they can be tuned or measured.

   window.CurioAttention
   - read(beats, opts) -> a reading: { segments, stats, warnings, beats: n, seconds }
       beats: [{ at, values }]   at: seconds, "m:ss", "h:mm:ss", or missing (then opts.secondsPerBeat apart)
       opts: { secondsPerBeat: 3, limit: seconds before a family has held attention too long (default 20),
               shiftMin, end: seconds the last beat lasts (default secondsPerBeat) }
   - fromStudy(study, opts), fromScene(storyboardScene, opts), fromReference(engineReference, opts)
   - live(opts) -> a recorder for a performance: push(values, seconds?) adds a beat now; reading() reads it.
   - stats: { switchesPerMinute, medianDwell, longestDwell, familyShare {family: 0..1}, curiosityShare,
       cueShare {cue: 0..1}, quietShare, momentum 0..5, familyRuns, currentRun }
   - warnings: [{ family, from, to, dur, text }]: a family that held attention longer than the limit. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;

  /* How strongly each family draws the eye when it changes. Faces, voices and plot turns pull hardest. */
  const FAMILY_PULL = { feeling: 1.25, plot: 1.2, voice: 1.1, comedy: 1.1, movement: 1.0, music: 1.0, mind: 0.9, camera: 0.9, cut: 0.85, place: 0.8, light: 0.7, wardrobe: 0.7, effects: 0.7 };
  const SHIFT_MIN = 0.12;
  const LIVE_BEATS = 400;
  const DEFAULTS = { secondsPerBeat: 3, limit: 20 };
  const QUIET = /^(none|no |off|silence|silent|still|nothing|empty|stopped|0$)/i;

  function seconds(at) {
    if (typeof at === "number" && isFinite(at)) return at;
    if (typeof at !== "string") return null;
    const t = at.trim();
    if (!/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null;
    return t.split(":").reduce((s, p) => s * 60 + Number(p), 0);
  }

  /* The scale a value sits on, from the database slider or the catalog row. */
  function scaleOf(id) {
    const parts = String(id).split("@")[0].split(".");
    const c = M().find(parts[0]);
    if (!c) return null;
    if (parts[1] && Array.isArray(c.sliders)) {
      const s = c.sliders.find((x) => x.id === parts[1]);
      if (s) return s.scale ? { list: s.scale } : s.range ? { min: s.range.min, max: s.range.max } : null;
    }
    if (Array.isArray(c.options)) return { list: c.options };
    if (c.kind === "range") return { min: c.min == null ? 0 : c.min, max: c.max == null ? 5 : c.max };
    if (Array.isArray(c.sliders) && c.sliders[0]) {
      const s = c.sliders.find((x) => x.id === (c.main || "setting")) || c.sliders[0];
      if (s.scale) return { list: s.scale };
      if (s.range) return { min: s.range.min, max: s.range.max };
    }
    return null;
  }
  /* How big a change is, 0 to 1. A thing appearing counts as 0.6. */
  function changeSize(id, before, after) {
    if (before === undefined) return 0.6;
    if (before === after) return 0;
    const sc = scaleOf(id);
    if (sc && sc.list) {
      const a = sc.list.indexOf(before);
      const b = sc.list.indexOf(after);
      if (a >= 0 && b >= 0) return Math.min(1, 0.35 + Math.abs(a - b) / Math.max(1, sc.list.length - 1));
      return 0.6;
    }
    const x = Number(before);
    const y = Number(after);
    if (isFinite(x) && isFinite(y)) {
      const span = sc && isFinite(sc.max - sc.min) && sc.max > sc.min ? sc.max - sc.min : Math.max(5, Math.abs(x), Math.abs(y));
      return Math.min(1, 0.25 + Math.abs(x - y) / span);
    }
    return 0.6;
  }
  function isQuiet(id, after) {
    if (after === 0 || after === "0") return true;
    if (typeof after === "string" && QUIET.test(after)) return true;
    const sc = scaleOf(id);
    return !!(sc && sc.list && sc.list[0] === after && /none|no|off|silen|still|nothing|empty/i.test(String(after)));
  }

  function median(list) {
    if (!list.length) return 0;
    const s = list.slice().sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);

  function read(beats, options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    const step = Number(opts.secondsPerBeat) > 0 ? Number(opts.secondsPerBeat) : DEFAULTS.secondsPerBeat;
    const shiftMin = opts.shiftMin != null ? opts.shiftMin : SHIFT_MIN;
    const list = (beats || []).filter((b) => b && b.values && typeof b.values === "object");
    /* Times: given ones, else evenly spaced; never going backwards. */
    let t = 0;
    const times = list.map((b, i) => {
      const s = seconds(b.at);
      t = s != null && s >= t ? s : i === 0 ? 0 : t + step;
      return t;
    });
    const end = list.length ? times[times.length - 1] + (opts.end != null ? opts.end : step) : 0;
    const known = {};
    const segments = [];
    let cur = null;
    list.forEach((b, i) => {
      let best = null;
      Object.keys(b.values).forEach((id) => {
        const v = b.values[id];
        if (v == null || v === "") return;
        const size = changeSize(id, known[id], v);
        known[id] = v;
        if (!size) return;
        const n = M().note(id);
        const pull = size * (FAMILY_PULL[n.family] || 0.8) * (0.8 + 0.08 * n.push);
        if (!best || pull > best.pull) best = { id, pull, n, quiet: isQuiet(id, v) };
      });
      const start = times[i];
      /* The same curiosity changing again keeps attention where it is: the stretch goes on. */
      if (best && cur && M().baseId(best.id) === cur.curiosity) {
        cur.refreshed = (cur.refreshed || 0) + 1;
        return;
      }
      if (best && (best.pull >= shiftMin || !cur)) {
        if (cur) cur.to = start;
        cur = { curiosity: M().baseId(best.id), slider: best.id.split("@")[0].includes(".") ? best.id.split("@")[0] : null, label: best.n.label, family: best.n.family, cue: best.n.cue, quiet: best.quiet, push: best.n.push, from: start, to: end, beat: i };
        segments.push(cur);
      }
    });
    segments.forEach((s) => (s.dur = round(Math.max(0, s.to - s.from), 2)));
    const stats = summarize(segments, end - (times[0] || 0), opts);
    return { segments, stats, warnings: stats.warnings, beats: list.length, seconds: round(end - (times[0] || 0), 2), limit: opts.limit };
  }

  /* Families held in a row: two curiosities of the same family back to back are one stretch for the family. */
  function familyRuns(segments) {
    const runs = [];
    segments.forEach((s) => {
      const last = runs[runs.length - 1];
      if (last && last.family === s.family) {
        last.to = s.to;
        last.dur = round(last.to - last.from, 2);
        last.count++;
      } else runs.push({ family: s.family, from: s.from, to: s.to, dur: s.dur, count: 1 });
    });
    return runs;
  }

  function summarize(segments, total, opts) {
    const fam = {};
    const cur = {};
    const cue = {};
    let quiet = 0;
    let push = 0;
    const limit = Number(opts.limit) > 0 ? Number(opts.limit) : DEFAULTS.limit;
    segments.forEach((s) => {
      fam[s.family] = (fam[s.family] || 0) + s.dur;
      cur[s.curiosity] = (cur[s.curiosity] || 0) + s.dur;
      cue[s.cue] = (cue[s.cue] || 0) + 1;
      if (s.quiet) quiet++;
    });
    const runs = familyRuns(segments);
    /* Momentum reading, 0 to 5: the push of whatever holds attention, worn down once a family stays past the
       limit (fresh attention moves the film; stale attention stalls it). A thesis, not a law. */
    runs.forEach((r) => {
      const segs = segments.filter((s) => s.from >= r.from && s.to <= r.to);
      segs.forEach((s) => {
        const intoRun = s.to - r.from;
        const fresh = intoRun <= limit ? 1 : Math.max(0.2, limit / intoRun);
        push += s.push * fresh * s.dur;
      });
    });
    const sum = total > 0 ? total : segments.reduce((a, s) => a + s.dur, 0) || 1;
    const share = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, round(v / sum, 3)]));
    const n = segments.length || 1;
    /* Which family follows which, counted over the family stretches: what the Compass learns from films. */
    const transitions = {};
    for (let i = 1; i < runs.length; i++) {
      const a = runs[i - 1].family;
      const b = runs[i].family;
      transitions[a] = transitions[a] || {};
      transitions[a][b] = (transitions[a][b] || 0) + 1;
    }
    const warnings = runs
      .filter((r) => r.dur > limit)
      .map((r) => {
        const f = M().family(r.family);
        return Object.assign({}, r, { text: `${f ? f.label : r.family} held the audience for ${round(r.dur)} seconds (from ${clock(r.from)}), past the ${limit} second limit. Try moving attention with a ${otherCue(r.family)} cue.` });
      });
    return {
      segments: segments.length,
      switches: Math.max(0, segments.length - 1),
      switchesPerMinute: round((Math.max(0, segments.length - 1) / sum) * 60, 1),
      medianDwell: round(median(segments.map((s) => s.dur)), 1),
      longestDwell: round(Math.max(0, ...segments.map((s) => s.dur)), 1),
      medianFamilyRun: round(median(runs.map((r) => r.dur)), 1),
      familyShare: share(fam),
      curiosityShare: share(cur),
      cueShare: Object.fromEntries(Object.entries(cue).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, round(v / n, 3)])),
      quietShare: round(quiet / n, 3),
      momentum: round(push / sum, 2),
      familyRuns: runs,
      transitions,
      currentRun: runs[runs.length - 1] || null,
      warnings,
      limit,
    };
  }
  /* A cue from outside the stuck family, to suggest. */
  function otherCue(family) {
    const f = M().family(family);
    const order = ["plot", "audio", "movement", "thought", "visual"];
    return order.find((c) => !f || c !== f.cue) || "plot";
  }
  function clock(s) {
    s = Math.max(0, Math.round(s));
    const m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  }

  /* ---------- sources ---------- */
  function fromStudy(study, opts) {
    return read((study && study.beats) || [], opts);
  }
  /* A storyboard scene: { panels: [{ v: {...} }] }. Panels have no times; secondsPerBeat sets them. */
  function fromScene(scene, opts) {
    return read(((scene && scene.panels) || []).map((p) => ({ values: (p && p.v) || {} })), opts);
  }
  /* An engine reference (engine/analyze.js): { rows, lanes: { id: [value per row] } }. */
  function fromReference(ref, opts) {
    const rows = (ref && ref.rows) || [];
    const lanes = (ref && ref.lanes) || {};
    const beats = rows.map((_, i) => {
      const values = {};
      Object.keys(lanes).forEach((id) => {
        const v = lanes[id][i];
        if (v != null && v !== "") values[id] = v;
      });
      return { values };
    });
    return read(beats, opts);
  }
  /* A performance recorder: each push is a beat at the time it happened. */
  function live(opts) {
    const beats = [];
    let t0 = null;
    const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
    return {
      push(values, at) {
        const t = at != null ? at : now();
        if (t0 == null) t0 = t;
        beats.push({ at: round(t - t0, 2), values: Object.assign({}, values) });
        if (beats.length > 5000) beats.shift();
      },
      reading(extra) {
        const o = Object.assign({}, opts || {}, extra || {});
        /* The last beat lasts until now, so the meter climbs while nothing changes. */
        if (beats.length && o.end == null) o.end = Math.max(0, now() - t0 - beats[beats.length - 1].at);
        /* A long performance reads its last LIVE_BEATS beats, so the meter stays quick. */
        return read(beats.length > LIVE_BEATS ? beats.slice(-LIVE_BEATS) : beats, o);
      },
      clear() {
        beats.length = 0;
        t0 = null;
      },
      beats: () => beats.slice(),
    };
  }

  const api = { read, fromStudy, fromScene, fromReference, live, familyRuns, clock, FAMILY_PULL, SHIFT_MIN, DEFAULTS };
  root.CurioAttention = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
