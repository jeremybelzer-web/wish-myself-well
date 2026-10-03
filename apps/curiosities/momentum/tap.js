/* momentum/tap.js: "Watch and tap", measure attention by hand while a real film plays.

   Most curated films have only Claude's estimates, so their rates of attention change are guesses. Here a person
   measures one: they play a film (a video file from their computer played right in the tab, or any film on
   another screen with the tab's own stopwatch) and tap the family of curiosities that holds their attention
   each time it changes. Holding Shift (or turning on "Something stopped") marks the change as a stop, a quiet
   cue (the music cut out, a silence, someone went still), and a second row picks the cue that moved it
   (visual, audio, thought, movement, plot) or leaves it blank.

   The taps become a trace: one beat every few seconds (the window's Seconds per panel by default), each with the
   family that held attention for most of that beat and the cue that moved it there, in the same shape
   CurioAttention.read accepts and CurioRates.measure measures. "Save as a curated film" adds it through
   CuriosityStudy.add (source "watched and tapped", counts and ids only, no notes), so it shows in Film rates,
   Cue lab and Three films as a measured film. Several people can tap the same film: "Average with an earlier
   tapping of the same title" keeps every tapping and takes the family most of them tapped at each beat.

   How a beat says what held attention: attention.js finds attention from curiosity values that change, and takes
   its cue from that curiosity's note. So each family move is written as one change of one stand-in curiosity of
   that family whose note gives the chosen cue (the first such curiosity the app knows, the same every time), and
   a stop is a change down to nothing ("none", 0 or the scale's own "no ..."). Nothing else changes in that beat,
   so the reading gives back exactly the families, cues and stops that were tapped. When no curiosity of a family
   gives the chosen cue (no music curiosity is a visual cue in the notes), the family's usual cue is used and the
   tab says so; the beat still keeps the tapped cue in its own "cue" field.

   window.CurioTap
   - tapsToBeats(taps, opts) -> beats (pure, works in Node)
       taps: [{ t: seconds, family, cue: "visual" | ... | null, stop: true | false }], any order
       opts: { beat: seconds a beat lasts (default 3), end: seconds the film lasts (default the last tap plus a beat) }
       beats: [{ at: "m:ss", values, family, curiosity, cue, quiet, move }] one per beat from 0; values holds only
       the one stand-in change on a beat where attention moved, and is empty elsewhere.
   - mergeTaps(traces, opts) -> beats: several tappings (beats lists, or studies with beats) made one, the family
       most of them tapped at each beat (a tie keeps the family that held before, else the earliest tapping's),
       and the cue and stop most of those tappings gave. opts.beat: the beat length (default the first trace's).
   - sequence(beats, beat) -> [{ family, cue, quiet } | null] one per beat (what mergeTaps works from)
   - standIn(family, cue) -> the curiosity id a move to that family on that cue is written with, or null
   - study(beats, { title, beat, tappings, id }) -> the study object "Save as a curated film" adds
   - FAMILY_KEYS, CUE_KEYS, addTab()
   Unsaved taps stay in this browser only (localStorage curiosities-momentum-tap-v1). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const KEY = "curiosities-momentum-tap-v1";
  const SOURCE = "watched and tapped";
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;

  /* Family colors, letters and labels: the same on every tab (notes.js always loads first). */
  const mark = (f) => M().mark(f);
  const famLabel = (f) => mark(f).label;
  const CUE_IDS = ["visual", "audio", "thought", "movement", "plot"];
  /* Keys by position (event.code), so Shift with a number still names the family. */
  const FAMILY_CODES = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "BracketLeft"];
  const FAMILY_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "["];
  const CUE_KEYS = { visual: "V", audio: "A", thought: "T", movement: "M", plot: "P" };
  const NO_CUE_KEY = "N";

  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  function clock(s, tenths) {
    const v = Math.max(0, s || 0);
    const m = Math.floor(v / 60);
    const sec = v - m * 60;
    if (tenths) return m + ":" + (sec < 10 ? "0" : "") + sec.toFixed(1);
    const whole = Math.round(sec * 10) / 10;
    const txt = whole % 1 ? whole.toFixed(1) : String(whole);
    return m + ":" + (whole < 10 ? "0" : "") + txt;
  }
  /* The families in pad order: the 8 colored ones first (as on the Pads tab), then the rest. */
  function families() {
    const all = M().FAMILIES.map((f) => f.id);
    const main = Object.keys(M().COLORS).filter((f) => all.includes(f));
    return main.concat(all.filter((f) => !main.includes(f)));
  }

  /* ---------- stand-in curiosities ---------- */
  const QUIET_WORD = /^(none|no |off|silence|silent|still|nothing|empty|stopped)/i;
  /* The scale a curiosity's value sits on, read the same way attention.js reads it. */
  function scaleOf(id) {
    const c = M().find(id);
    if (!c) return null;
    if (Array.isArray(c.options)) return { list: c.options };
    if (c.kind === "range") return { min: c.min == null ? 0 : c.min, max: c.max == null ? 5 : c.max };
    if (Array.isArray(c.sliders) && c.sliders[0]) {
      const s = c.sliders.find((x) => x.id === (c.main || "setting")) || c.sliders[0];
      if (s.scale) return { list: s.scale };
      if (s.range) return { min: s.range.min, max: s.range.max };
    }
    return null;
  }
  function usable(sc) {
    if (!sc) return false;
    if (sc.list) return sc.list.filter((v) => !QUIET_WORD.test(String(v))).length >= 2;
    return isFinite(sc.min) && isFinite(sc.max) && sc.max - sc.min >= 2;
  }
  let picks = null;
  function buildPicks() {
    picks = {};
    const seen = new Set();
    M()
      .all()
      .forEach((n) => {
        if (!n || !n.id || seen.has(n.id) || n.id.includes(".")) return;
        seen.add(n.id);
        const k = n.family + "/" + n.cue;
        if (picks[k] || !usable(scaleOf(n.id))) return;
        if (M().note(n.id).family !== n.family) return;
        picks[k] = n.id;
      });
    return picks;
  }
  /* The curiosity a move to `family` on `cue` is written with (cue blank or not found: the family's usual cue). */
  function standIn(family, cue) {
    if (!M() || !M().family(family)) return null;
    const p = picks || buildPicks();
    if (cue && p[family + "/" + cue]) return { id: p[family + "/" + cue], exact: true };
    const usual = M().family(family).cue;
    const id = p[family + "/" + usual] || CUE_IDS.map((c) => p[family + "/" + c]).find(Boolean) || null;
    return id ? { id, exact: !cue } : null;
  }
  /* A value for the stand-in that is a change from `known`: an ordinary value, or, for a stop, a value of nothing. */
  function valueFor(id, known, quiet) {
    const sc = scaleOf(id);
    if (quiet) {
      const own = sc && sc.list && QUIET_WORD.test(String(sc.list[0])) ? sc.list[0] : null;
      const zero = sc && !sc.list && sc.min <= 0 && sc.max >= 0 ? 0 : null;
      return [own, zero, "none", "off"].find((v) => v != null && v !== known);
    }
    if (sc && sc.list) {
      const ok = sc.list.filter((v) => !QUIET_WORD.test(String(v)));
      return ok[ok.length - 1] !== known ? ok[ok.length - 1] : ok[ok.length - 2];
    }
    if (sc) {
      const hi = sc.max;
      return hi !== known ? hi : hi - 1;
    }
    return known === "more" ? "less" : "more";
  }

  /* ---------- the pure part ---------- */
  /* One { family, cue, quiet } (or null before the first tap) per beat, made into beats that read back the same. */
  function fromSequence(seq, beat) {
    const known = {};
    let prev = null;
    return seq.map((s, i) => {
      const at = clock(i * beat);
      if (!s || !s.family) return { at, values: {}, family: null, curiosity: null, cue: null, quiet: false, move: false };
      if (prev && prev.family === s.family) {
        return { at, values: {}, family: s.family, curiosity: prev.curiosity, cue: prev.cue, quiet: prev.quiet, move: false };
      }
      const pick = standIn(s.family, s.cue);
      const values = {};
      if (pick) {
        const v = valueFor(pick.id, known[pick.id], !!s.quiet);
        known[pick.id] = v;
        values[pick.id] = v;
      }
      prev = { family: s.family, curiosity: pick ? pick.id : null, cue: s.cue || null, quiet: !!s.quiet };
      return { at, values, family: s.family, curiosity: prev.curiosity, cue: prev.cue, quiet: prev.quiet, move: true, exact: pick ? pick.exact : false };
    });
  }

  function cleanTaps(taps) {
    return (taps || [])
      .filter((t) => t && t.family && isFinite(Number(t.t)) && Number(t.t) >= 0)
      .map((t, i) => ({ t: Number(t.t), family: t.family, cue: CUE_IDS.includes(t.cue) ? t.cue : null, stop: !!t.stop, i }))
      .sort((a, b) => a.t - b.t || a.i - b.i);
  }
  function tapsToBeats(taps, opts) {
    const o = opts || {};
    const beat = Number(o.beat) > 0 ? Number(o.beat) : 3;
    const list = cleanTaps(taps);
    if (!list.length) return [];
    const last = list[list.length - 1].t;
    const end = Math.max(Number(o.end) > 0 ? Number(o.end) : 0, last + beat * 0.5, beat);
    const n = Math.max(1, Math.ceil(end / beat - 1e-9));
    const seq = [];
    let k = -1; /* the last tap at or before the time being looked at */
    for (let i = 0; i < n; i++) {
      const a = i * beat;
      const b = Math.min((i + 1) * beat, Math.max(end, a + beat));
      /* Time each family holds attention inside this beat. */
      const held = {};
      const order = [];
      let t = a;
      while (k + 1 < list.length && list[k + 1].t <= a) k++;
      let j = k;
      while (t < b) {
        const next = j + 1 < list.length && list[j + 1].t < b ? list[j + 1].t : b;
        const fam = j >= 0 ? list[j].family : null;
        if (fam) {
          if (!(fam in held)) order.push(fam);
          held[fam] = (held[fam] || 0) + (next - t);
          held[fam + "@last"] = j;
        }
        t = next;
        if (next < b) j++;
      }
      /* Most time wins; a tie goes to the family tapped later in the beat. */
      let best = null;
      order.forEach((f) => {
        if (!best || held[f] > held[best] + 1e-9 || (Math.abs(held[f] - held[best]) <= 1e-9 && held[f + "@last"] > held[best + "@last"])) best = f;
      });
      if (!best) {
        seq.push(null);
        continue;
      }
      /* The tap that moved attention to this family: the last tap of it, before the end of this beat, that
         followed a different family (the start of its stretch). */
      let s = held[best + "@last"];
      while (s > 0 && list[s - 1].family === best) s--;
      seq.push({ family: best, cue: list[s].cue, quiet: list[s].stop, tap: s });
    }
    /* A family that holds two stretches back to back with different taps is still one stretch for the family. */
    return fromSequence(seq, beat);
  }

  function beatLength(beats) {
    const t = (b) => {
      const at = b && b.at;
      if (typeof at === "number") return at;
      if (typeof at !== "string") return null;
      return at.split(":").reduce((s, p) => s * 60 + Number(p), 0);
    };
    if (beats && beats.length > 1) {
      const d = t(beats[1]) - t(beats[0]);
      if (d > 0) return d;
    }
    return 3;
  }
  /* A trace as one { family, cue, quiet } per beat of `beat` seconds, sampled at the middle of each beat. */
  function sequence(beats, beat) {
    const list = (beats && beats.beats) || beats || [];
    const own = beatLength(list);
    const step = Number(beat) > 0 ? Number(beat) : own;
    const total = list.length * own;
    const n = Math.max(0, Math.ceil(total / step - 1e-9));
    const out = [];
    for (let i = 0; i < n; i++) {
      const b = list[Math.min(list.length - 1, Math.floor(((i + 0.5) * step) / own))];
      out.push(b && b.family ? { family: b.family, cue: b.cue || null, quiet: !!b.quiet } : null);
    }
    return out;
  }
  function majority(items, prefer) {
    const count = new Map();
    items.forEach((x) => count.set(x, (count.get(x) || 0) + 1));
    let best = null;
    let bestN = 0;
    count.forEach((n, x) => {
      if (n > bestN) {
        best = x;
        bestN = n;
      }
    });
    const tied = [...count.entries()].filter(([, n]) => n === bestN).map(([x]) => x);
    if (tied.length > 1 && prefer != null && tied.includes(prefer)) return prefer;
    return tied.length > 1 ? items.find((x) => tied.includes(x)) : best;
  }
  function mergeTaps(traces, opts) {
    const list = (traces || []).map((t) => (t && t.beats) || t).filter((t) => Array.isArray(t) && t.length);
    if (!list.length) return [];
    const beat = (opts && Number(opts.beat) > 0 && Number(opts.beat)) || beatLength(list[0]);
    const seqs = list.map((t) => sequence(t, beat));
    const n = Math.max(...seqs.map((s) => s.length));
    const out = [];
    let prev = null;
    for (let i = 0; i < n; i++) {
      const here = seqs.map((s) => s[i]).filter((x) => x && x.family);
      if (!here.length) {
        out.push(prev ? Object.assign({}, prev) : null);
        continue;
      }
      const family = majority(here.map((x) => x.family), prev && prev.family);
      if (prev && prev.family === family) {
        out.push(Object.assign({}, prev));
        continue;
      }
      /* The cue and stop most of the tappings that agree gave where they moved to this family. */
      const agree = seqs.map((s) => ({ now: s[i], before: s[i - 1] })).filter((x) => x.now && x.now.family === family);
      const moved = agree.filter((x) => !x.before || x.before.family !== family);
      const from = (moved.length ? moved : agree).map((x) => x.now);
      const cues = from.map((x) => x.cue).filter(Boolean);
      const cue = cues.length * 2 >= from.length && cues.length ? majority(cues) : null;
      const quiet = from.filter((x) => x.quiet).length * 2 > from.length;
      prev = { family, cue, quiet };
      out.push(prev);
    }
    return fromSequence(out, beat);
  }

  /* The study "Save as a curated film" adds: counts and ids only, the title the person typed, no notes. */
  function study(beats, o) {
    const opts = o || {};
    const title = String(opts.title || "").trim() || "Tapped film";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "film";
    return {
      id: opts.id || "tapped-" + slug,
      title,
      kind: "film",
      camera: "measured",
      source: SOURCE,
      beatSeconds: Number(opts.beat) || beatLength(beats),
      tappings: Array.isArray(opts.tappings) ? opts.tappings : [],
      beats: beats.map((b) => ({ at: b.at, values: Object.assign({}, b.values), family: b.family, curiosity: b.curiosity, cue: b.cue, quiet: !!b.quiet, move: !!b.move })),
    };
  }
  /* One tapping kept small: per beat [family, cue, 1 for a stop], so later tappings can be averaged with it. */
  const pack = (beats, beat) => sequence(beats, beat).map((s) => (s ? [s.family, s.cue || "", s.quiet ? 1 : 0] : null));
  const unpack = (packed, beat) =>
    (packed || []).map((s, i) => (s ? { at: clock(i * beat), family: s[0], cue: s[1] || null, quiet: !!s[2], values: {} } : { at: clock(i * beat), family: null, values: {} }));

  /* ---------- the tab ---------- */
  const state = { taps: [], order: [], beat: 0, title: "", cue: null, stop: false, average: true, running: false, base: 0, startedAt: 0, video: null, videoUrl: "", videoName: "", flash: "", savedId: "", tick: null, keyHook: null, el: null, ctx: null };
  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object") {
        state.taps = Array.isArray(s.taps) ? cleanTaps(s.taps).map((t) => ({ t: t.t, family: t.family, cue: t.cue, stop: t.stop })) : [];
        state.order = state.taps.slice();
        state.beat = Number(s.beat) > 0 ? Number(s.beat) : 0;
        state.title = typeof s.title === "string" ? s.title : "";
        state.base = Number(s.clock) > 0 ? Number(s.clock) : state.taps.length ? state.taps[state.taps.length - 1].t : 0;
        state.average = s.average !== false;
      }
    } catch (e) {}
  }
  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ taps: state.taps, beat: state.beat, title: state.title, clock: round(now(), 2), average: state.average }));
    } catch (e) {}
  }
  let loaded = false;
  const perf = () => (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
  function now() {
    if (state.video) return state.video.currentTime || 0;
    return state.base + (state.running ? perf() - state.startedAt : 0);
  }
  const playing = () => (state.video ? !state.video.paused && !state.video.ended : state.running);
  function startClock() {
    if (state.video) return state.video.play && state.video.play().catch(() => {});
    if (state.running) return;
    state.running = true;
    state.startedAt = perf();
  }
  function pauseClock() {
    if (state.video) return state.video.pause && state.video.pause();
    if (!state.running) return;
    state.base = now();
    state.running = false;
  }
  const beatOf = () => state.beat || (state.ctx ? state.ctx.secondsPerBeat() : 3) || 3;
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const S = () => root.CuriosityStudy;
  function studies() {
    try {
      return (S() && S().studies()) || [];
    } catch (e) {
      return [];
    }
  }
  const norm = (t) => String(t || "").trim().toLowerCase().replace(/\s+/g, " ");
  const earlier = (title) => studies().filter((s) => s && s.source === SOURCE && norm(s.title) === norm(title) && norm(title));

  function tap(family, opts) {
    if (!families().includes(family)) return;
    const t = round(now(), 2);
    const entry = { t, family, cue: state.cue, stop: !!(state.stop || (opts && opts.stop)) };
    state.taps.push(entry);
    state.taps = cleanTaps(state.taps).map((x) => ({ t: x.t, family: x.family, cue: x.cue, stop: x.stop }));
    state.order.push(entry);
    state.cue = null;
    state.stop = false;
    state.savedId = "";
    state.flash = "";
    saveState();
    redraw();
    flashPad(family);
  }
  function undo() {
    const last = state.order.pop();
    if (!last) return;
    const i = state.taps.findIndex((x) => x.t === last.t && x.family === last.family && x.cue === last.cue && x.stop === last.stop);
    if (i >= 0) state.taps.splice(i, 1);
    state.flash = `Took back the tap on ${famLabel(last.family)} at ${clock(last.t)}.`;
    saveState();
    redraw();
  }
  function flashPad(family) {
    const el = state.el && state.el.querySelector(`[data-tp-pad="${family}"]`);
    if (!el) return;
    el.classList.add("mtp-hit");
    setTimeout(() => el.classList.remove("mtp-hit"), 160);
  }

  function ribbonHtml(beats, total) {
    if (!beats.length) return `<div class="mtp-rib mtp-rib-empty" aria-label="No taps yet"><span>Your taps draw here, one color for each kind of curiosity.</span></div>`;
    const beat = beatOf();
    const T = Math.max(total, beats.length * beat);
    const runs = [];
    beats.forEach((b, i) => {
      const last = runs[runs.length - 1];
      if (last && last.family === b.family && !b.move) last.to = (i + 1) * beat;
      else runs.push({ family: b.family, from: i * beat, to: (i + 1) * beat, cue: b.cue, quiet: b.quiet });
    });
    const cells = runs
      .map((r) => {
        const w = ((r.to - r.from) / T) * 100;
        if (!r.family) return `<span class="mtp-cell mtp-none" style="left:${(r.from / T) * 100}%;width:${w}%" title="Before the first tap"></span>`;
        const mk = mark(r.family);
        const cueTxt = r.cue ? (r.quiet ? "something stopped, a " : "a ") + r.cue + " cue" : r.quiet ? "something stopped" : "no cue chosen";
        const t = `${clock(r.from)} to ${clock(r.to)}: ${famLabel(r.family)}, moved by ${cueTxt}`;
        return `<span class="mtp-cell" style="left:${(r.from / T) * 100}%;width:${w}%;background:${mk.color};color:${mk.ink}" title="${esc(t)}" aria-label="${esc(t)}">${w > 3.2 ? (r.quiet ? "·" : "") + esc(mk.letter) : ""}</span>`;
      })
      .join("");
    const at = Math.min(100, (now() / T) * 100);
    return `<div class="mtp-rib" role="img" aria-label="${esc(`Ribbon of ${runs.filter((r) => r.family).length} stretches of attention`)}">${cells}<i class="mtp-head" style="left:${at}%"></i></div>
      <div class="mtp-ticks"><span>0:00</span><span>${clock(T / 2)}</span><span>${clock(T)}</span></div>`;
  }
  function nowHtml(beats) {
    const t = now();
    const cur = state.taps.filter((x) => x.t <= t + 1e-6);
    if (!cur.length) return `<p class="mtp-now">Nothing tapped yet. Press Start when the film starts, then tap what holds your attention.</p>`;
    const last = cur[cur.length - 1];
    let s = cur.length - 1;
    while (s > 0 && cur[s - 1].family === last.family) s--;
    const held = round(t - cur[s].t, 1);
    const limit = state.ctx ? state.ctx.limit() : 20;
    const st = M().status(held, limit);
    const mk = mark(last.family);
    return `<p class="mtp-now"><span class="mtp-chip"><span class="mtp-letter" style="background:${mk.color};color:${mk.ink}" aria-hidden="true">${esc(mk.letter)}</span>${esc(famLabel(last.family))}</span> has held your attention for ${held} seconds <span class="mo-status mo-${st.cls}">${st.icon} ${st.text}</span> <small>(limit ${limit} s)</small></p>`;
  }
  function tallyHtml(beats) {
    const moves = beats.filter((b) => b.move).length;
    const secs = beats.length * beatOf();
    const per = secs ? round((Math.max(0, moves - 1) / secs) * 60, 1) : 0;
    return `${state.taps.length} tap${state.taps.length === 1 ? "" : "s"}, ${beats.length} moment${beats.length === 1 ? "" : "s"} of ${beatOf()} second${beatOf() === 1 ? "" : "s"}, attention moved ${Math.max(0, moves - 1)} time${moves - 1 === 1 ? "" : "s"} (${per} a minute).`;
  }
  function listHtml() {
    const recent = state.order.slice(-6).reverse();
    if (!recent.length) return "";
    return `<ol class="mtp-taps" reversed>${recent
      .map((x) => {
        const mk = mark(x.family);
        return `<li><span class="mtp-time">${clock(x.t, true)}</span> <span class="mtp-chip"><span class="mtp-letter" style="background:${mk.color};color:${mk.ink}" aria-hidden="true">${esc(mk.letter)}</span>${esc(famLabel(x.family))}</span> ${x.stop ? '<span class="mo-badge">something stopped</span> ' : ""}${x.cue ? `<span class="mo-badge">${esc(x.cue)} cue</span>` : ""}</li>`;
      })
      .join("")}</ol>`;
  }

  function trace() {
    return tapsToBeats(state.taps, { beat: beatOf(), end: Math.max(now(), state.taps.length ? state.taps[state.taps.length - 1].t : 0) });
  }
  function redraw() {
    const el = state.el;
    if (!el || !el.isConnected) return;
    const beats = trace();
    const total = Math.max(now(), beats.length * beatOf());
    const q = (s) => el.querySelector(s);
    if (q(".mtp-clock")) q(".mtp-clock").textContent = clock(now(), true);
    if (q("[data-tp=start]")) q("[data-tp=start]").textContent = playing() ? "Pause" : now() > 0 ? "Go on" : "Start";
    if (q(".mtp-ribwrap")) q(".mtp-ribwrap").innerHTML = ribbonHtml(beats, total);
    if (q(".mtp-nowwrap")) q(".mtp-nowwrap").innerHTML = nowHtml(beats);
    if (q(".mtp-tally")) q(".mtp-tally").textContent = tallyHtml(beats);
    if (q(".mtp-list")) q(".mtp-list").innerHTML = listHtml();
    if (q("[data-tp=undo]")) q("[data-tp=undo]").disabled = !state.order.length;
    if (q("[data-tp=save]")) q("[data-tp=save]").disabled = !state.taps.length;
    el.querySelectorAll("[data-tp-cue]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.tpCue || null) === (state.cue || "") || (b.dataset.tpCue === "" && !state.cue))));
    const stop = q("[data-tp=stop]");
    if (stop) stop.setAttribute("aria-pressed", String(state.stop));
    if (q(".mtp-flash")) {
      q(".mtp-flash").textContent = state.flash;
      q(".mtp-flash").hidden = !state.flash;
    }
    const prior = earlier(state.title);
    const avg = q(".mtp-avg");
    if (avg) {
      avg.hidden = !prior.length;
      const n = prior.length ? (prior[0].tappings || []).length || 1 : 0;
      const lab = q(".mtp-avg-n");
      if (lab) lab.textContent = n ? `(${n} earlier tapping${n === 1 ? "" : "s"} saved)` : "";
    }
  }

  function save() {
    const title = String(state.title || "").trim();
    if (!title) {
      state.flash = "Type the film's title first, so the saved film has a name.";
      return redraw();
    }
    if (!state.taps.length) return;
    if (!S() || typeof S().add !== "function") {
      state.flash = "The Study part of the app is not here, so the film cannot be saved.";
      return redraw();
    }
    const beat = beatOf();
    const mine = trace();
    const prior = state.average ? earlier(title)[0] : null;
    let beats = mine;
    let tappings = [pack(mine, beat)];
    let id;
    if (prior) {
      const step = Number(prior.beatSeconds) || beatLength(prior.beats);
      const old = (prior.tappings && prior.tappings.length ? prior.tappings : [pack(prior.beats)]).map((p) => unpack(p, step));
      beats = mergeTaps(old.concat([mine]), { beat });
      tappings = old.map((b) => pack(b, beat)).concat(tappings);
      id = prior.id;
    } else {
      const used = new Set(studies().map((s) => s.id));
      const base = study(mine, { title }).id;
      id = base;
      for (let k = 2; used.has(id); k++) id = base + "-" + k;
    }
    const st = S().add(study(beats, { title, beat, tappings, id }));
    if (!st) {
      state.flash = "The film could not be saved.";
      return redraw();
    }
    const r = A().read(st.beats, { secondsPerBeat: beat });
    state.savedId = st.id;
    state.flash = `Saved "${title}" as a curated film${prior ? `, the average of ${tappings.length} tappings` : ""}. Attention moves ${r.stats.switchesPerMinute} times a minute and usually rests ${r.stats.medianDwell} second${r.stats.medianDwell === 1 ? "" : "s"}. It now shows in Film rates (press Measure there), Cue lab and Three films. Your taps were cleared for the next tapping.`;
    state.taps = [];
    state.order = [];
    state.base = 0;
    state.running = false;
    if (state.video) state.video.currentTime = 0;
    saveState();
    if (state.ctx) state.ctx.setSource("study:" + st.id);
    mountTab(state.el, state.ctx);
    const note = state.el && state.el.querySelector(".mtp-flash");
    if (note && note.scrollIntoView) note.scrollIntoView({ block: "nearest" });
  }

  function padsHtml() {
    return families()
      .map((f, i) => {
        const mk = mark(f);
        const key = FAMILY_KEYS[i];
        return `<button type="button" class="mtp-pad" data-tp-pad="${esc(f)}" style="--mtp-c:${mk.color}" aria-label="${esc(famLabel(f))}, key ${esc(key)}"><span class="mtp-letter" style="background:${mk.color};color:${mk.ink}" aria-hidden="true">${esc(mk.letter)}</span><span class="mtp-name">${esc(famLabel(f))}</span><span class="mtp-key">Key ${esc(key)}</span></button>`;
      })
      .join("");
  }
  function cuesHtml() {
    const chip = (id, label, key) => `<button type="button" class="mtp-cue" data-tp-cue="${id}" aria-pressed="false">${esc(label)} <small>${key}</small></button>`;
    return chip("", "No cue", NO_CUE_KEY) + CUE_IDS.map((c) => chip(c, c.charAt(0).toUpperCase() + c.slice(1), CUE_KEYS[c])).join("");
  }

  function mountTab(el, ctx) {
    if (!el) return;
    if (!loaded) {
      loadState();
      loaded = true;
    }
    state.el = el;
    state.ctx = ctx;
    const beat = beatOf();
    const beats = [1, 2, 3, 4, 5, 8].concat(beat && ![1, 2, 3, 4, 5, 8].includes(beat) ? [beat] : []).sort((a, b) => a - b);
    const missing = families().filter((f) => !standIn(f, M().family(f).cue));
    el.innerHTML = `<div class="mtp">
      <p class="mo-lede">Measure attention yourself while you watch a real film. Most curated films have only Claude's estimates, so how fast their attention moves is a guess. Each time what holds your attention changes, tap the kind of curiosity that took it. Your taps become a measured film the other tabs can read.</p>
      <div class="mtp-flash mo-flash" role="status"${state.flash ? "" : " hidden"}>${esc(state.flash)}</div>
      <section class="mtp-sec"><h3>1. Play the film</h3>
        <p class="mo-small">Play it anywhere: on a television, another screen, or a video file from your computer here (it stays on your computer and is never uploaded). With a film elsewhere, press Start the moment it starts, and Pause when you pause it.</p>
        <div class="mo-controls mtp-clockrow">
          <span class="mtp-clock" aria-live="off">${clock(now(), true)}</span>
          <button type="button" data-tp="start">${playing() ? "Pause" : now() > 0 ? "Go on" : "Start"}</button>
          <button type="button" data-tp="reset">Back to 0:00</button>
          <label>One moment lasts <select data-tp="beat">${beats.map((b) => `<option value="${b}"${b === beat ? " selected" : ""}>${b} second${b === 1 ? "" : "s"}</option>`).join("")}</select></label>
          <label class="mtp-file">Play a video file here <input type="file" accept="video/*" data-tp="file"></label>
        </div>
        ${state.videoUrl ? `<video class="mtp-video" src="${esc(state.videoUrl)}" controls playsinline></video><p class="mo-small">Playing ${esc(state.videoName)}. The clock follows the video, so pausing or skipping back keeps your taps in step.</p>` : ""}
      </section>
      <section class="mtp-sec"><h3>2. Tap what holds your attention</h3>
        <p class="mo-small">Tap a kind of curiosity (or press its key) each time your attention moves to it. Before a tap you can pick the cue that moved it with the second row (keys ${Object.values(CUE_KEYS).join(", ")}, ${NO_CUE_KEY} for none), and hold Shift or turn on "Something stopped" when a stop moved it: the music cut out, a silence fell, someone went still. Both last for one tap. Backspace or Z takes back the last tap.</p>
        <div class="mtp-cuerow" role="group" aria-label="The cue that moved attention">${cuesHtml()}<button type="button" class="mtp-cue mtp-stop" data-tp="stop" aria-pressed="false">Something stopped <small>Shift</small></button></div>
        <div class="mtp-pads">${padsHtml()}</div>
        <div class="mtp-nowwrap"></div>
        <div class="mtp-ribwrap"></div>
        <p class="mo-small mtp-tally"></p>
        <div class="mo-controls"><button type="button" data-tp="undo">Undo last tap</button><button type="button" data-tp="clear">Clear all taps</button></div>
        <div class="mtp-list"></div>
        ${missing.length ? `<p class="mo-small">No curiosity the app knows gives some cues for some kinds (for example ${esc(famLabel(missing[0]))}); there the kind's usual cue is used.</p>` : ""}
      </section>
      <section class="mtp-sec"><h3>3. Save it</h3>
        <div class="mo-controls">
          <label>The film's title <input type="text" data-tp="title" value="${esc(state.title)}" placeholder="Jaws" maxlength="80"></label>
          <label class="mtp-avg mtp-check"><span><input type="checkbox" data-tp="average"${state.average ? " checked" : ""}> Average with an earlier tapping of the same title <span class="mtp-avg-n"></span></span></label>
          <button type="button" data-tp="save">Save as a curated film</button>
        </div>
        <p class="mo-small">It is saved with only the kinds, the cues and the times, no notes. Several people can tap the same film: with the same title and the box ticked, each moment takes the kind most of the tappings chose.</p>
      </section>
    </div>`;
    const on = (sel, ev, fn) => el.querySelectorAll(sel).forEach((n) => n.addEventListener(ev, fn));
    on("[data-tp-pad]", "click", (e) => tap(e.currentTarget.dataset.tpPad, { stop: e.shiftKey }));
    on("[data-tp-cue]", "click", (e) => {
      const c = e.currentTarget.dataset.tpCue || null;
      state.cue = state.cue === c ? null : c;
      redraw();
    });
    on("[data-tp=stop]", "click", () => {
      state.stop = !state.stop;
      redraw();
    });
    on("[data-tp=start]", "click", () => {
      playing() ? pauseClock() : startClock();
      saveState();
      redraw();
      setTimeout(redraw, 30);
    });
    on("[data-tp=reset]", "click", () => {
      pauseClock();
      state.base = 0;
      if (state.video) state.video.currentTime = 0;
      saveState();
      redraw();
    });
    on("[data-tp=undo]", "click", undo);
    on("[data-tp=clear]", "click", () => {
      if (state.taps.length && typeof confirm === "function" && !confirm("Clear all your taps? This cannot be undone.")) return;
      state.taps = [];
      state.order = [];
      state.flash = "All taps cleared.";
      saveState();
      redraw();
    });
    on("[data-tp=beat]", "change", (e) => {
      state.beat = Number(e.target.value) || 0;
      saveState();
      redraw();
    });
    on("[data-tp=title]", "input", (e) => {
      state.title = e.target.value;
      saveState();
      redraw();
    });
    on("[data-tp=average]", "change", (e) => {
      state.average = e.target.checked;
      saveState();
    });
    on("[data-tp=save]", "click", save);
    on("[data-tp=file]", "change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (state.videoUrl && typeof URL !== "undefined") URL.revokeObjectURL(state.videoUrl);
      state.videoUrl = URL.createObjectURL(f);
      state.videoName = f.name;
      state.running = false;
      mountTab(el, ctx);
    });
    state.video = el.querySelector(".mtp-video");
    if (state.video) ["play", "pause", "seeked", "ended"].forEach((ev) => state.video.addEventListener(ev, redraw));
    if (!state.keyHook) {
      state.keyHook = onKey;
      document.addEventListener("keydown", onKey);
    }
    if (!state.tick) state.tick = setInterval(() => {
      if (!state.el || !state.el.isConnected) {
        clearInterval(state.tick);
        state.tick = null;
        if (state.keyHook) document.removeEventListener("keydown", state.keyHook);
        state.keyHook = null;
        if (state.running) state.base = now();
        return;
      }
      if (playing()) redraw();
    }, 250);
    redraw();
  }
  function onKey(e) {
    const el = state.el;
    if (!el || !el.isConnected || !el.offsetParent) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    const fi = FAMILY_CODES.indexOf(e.code);
    if (fi >= 0 && families()[fi]) {
      e.preventDefault();
      return tap(families()[fi], { stop: e.shiftKey });
    }
    const k = String(e.key || "").toUpperCase();
    const cue = CUE_IDS.find((c) => CUE_KEYS[c] === k);
    if (cue) {
      e.preventDefault();
      state.cue = state.cue === cue ? null : cue;
      return redraw();
    }
    if (k === NO_CUE_KEY) {
      e.preventDefault();
      state.cue = null;
      return redraw();
    }
    if (e.key === "Backspace" || k === "Z") {
      e.preventDefault();
      return undo();
    }
    if (e.key === " " && e.target === document.body) {
      e.preventDefault();
      playing() ? pauseClock() : startClock();
      redraw();
      return setTimeout(redraw, 30);
    }
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "tap", label: "Watch and tap", group: "learn", after: "end", mount: mountTab });
  }

  const api = { tapsToBeats, mergeTaps, sequence, standIn, study, mark, families, FAMILY_KEYS, CUE_KEYS, SOURCE, addTab };
  root.CurioTap = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
