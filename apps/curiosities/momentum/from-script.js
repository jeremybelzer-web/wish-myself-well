/* momentum/from-script.js: the "From your script" tab (See it). Check momentum before you shoot or animate:
   paste a scene, a short script or a shot list (one line per shot is fine), press Read it, and see where
   attention rests too long, on which lines of your script, and one thing to try for each.

   How the text becomes moments:
   1. It is cut into moments: each paragraph is one moment (a line of action, or a speech with its speaker's
      name). When the text has no empty lines between paragraphs, each line is one moment (a speaker's name on
      its own line goes with the line under it). A scene heading (INT., EXT.) is not a moment; it tells the
      moments under it where and when they are. A shot list with a heading row (size, angle, move...) is one
      moment per shot.
   2. The engine's own analysis (engine/analyze.js, CurioAnalyze.script and CurioAnalyze.shotList) reads every
      moment for how much is said and done, the feeling, how loud, how many people speak, inside or outside,
      the time of day, and any shot words (wide, close, pan, handheld...). Each moment is given its own scene
      heading so the engine reads one row per moment.
   3. When the engine cannot read it (the engine is not loaded, there are fewer than three moments, or no
      attention comes out), a plain guess is used instead: one moment per line, and the kind of curiosity
      (the attention family) guessed from keywords in the line (KEYWORDS below). The page says which was used.
   4. CurioAttention.read reads the moments. Each moment lasts about as long as its words take to say (one
      second for every 2.5 words, between 2 and 12 seconds), or Seconds per panel for every moment.

   window.CurioFromScript
   - cut(text) -> { kind: "blocks" | "lines" | "shotList", units: [{ text, heading, from, to, words }] }
       from and to are line numbers in the pasted text (1 is the first line).
   - readScript(text, { how: "both" (default) | "engine" | "plain", timing: "words" | "even", secondsPerBeat, limit }) ->
       { method: "both" | "engine" | "plain", why, kind, units, beats, reading, cells, weak, limit }
       cells: one per moment { i, from, to, family, curiosity, label, moved, held, status, at, dur }
       weak: one per stretch that rests too long { family, label, from, to, dur, status, moments, lines,
             longAt, suggest: { family, label, curiosity, cue, tryThis, text } }
   - plainGuess(units) -> beats, from keywords (works with no engine).
   - engineBatch(result, state) -> one CurioEngine batch that makes these moments My film's rows.
   - send(result) -> CurioEngine.send(engineBatch(...)): one Undo step.
   - SAMPLE (an original practice scene), KEYWORDS, STORE (localStorage key), addTab(), mountTab().
   Pure parts (all but addTab and mountTab) work in Node. The pasted text stays in this browser only, under
   localStorage key curiosities-momentum-script-v1; the engine gets values and "Moment 3 (line 7)" labels,
   never the text. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const STORE = "curiosities-momentum-script-v1";
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const AN = () => root.CurioAnalyze;
  const S = () => root.CurioScale;
  const E = () => root.CurioEngine;
  const MAX_MOMENTS = 64; /* the engine holds 64 rows */
  const WORDS_PER_SECOND = 2.5;
  const SMALL_STEP = 2; /* an engine amount (0 to 5) must move this much to count as a change */

  /* An original practice scene (written for this app, not from any film). */
  const SAMPLE = `INT. FERRY TICKET BOOTH - NIGHT

Rain drums on the glass. ODILE (70s), in a conductor's coat two sizes too big, stacks coins into neat towers.

A boy, PIP (10), soaked through, slides a crumpled drawing under the window instead of money.

PIP
It's a ticket. I drew it.

ODILE
Drawn tickets go on the drawn ferry.

PIP
Is there a drawn ferry?

ODILE
Pier nine. It leaves at never o'clock.

PIP
That's not a time.

ODILE
It's my favorite one.

PIP
Can I still go?

ODILE
Only if you hold on to your hat.

EXT. PIER - CONTINUOUS

Pip runs down the pier, his boots slapping the wet boards.

The fog horn sounds. He stops dead.

A single lamp flickers on at the end of the pier.

Close up: a tiny paper boat bobs on the black water. Its sail is his drawing.

INT. FERRY TICKET BOOTH - NIGHT

Odile hums along to the radio and stamps a second drawing. She smiles to herself.`;

  /* ---------- cutting the text into moments ---------- */
  const HEADING = /^\s*(INT\.?\/EXT\.?|EXT\.?\/INT\.?|I\/E\.?|INT\.|EXT\.|INT |EXT )/i;
  const TRANSITION = /^\s*([A-Z ]+TO:|FADE (IN|OUT)[.:]?|CUT TO BLACK\.?)\s*$/;
  const CUE_LINE = /^\s*[A-Z][A-Z0-9 .'\-]{1,30}(\s*\([A-Z.'’ ]+\))?\s*$/;
  const wordCount = (s) => (String(s).match(/[A-Za-z0-9'’]+/g) || []).length;

  function splitCells(line, sep) {
    return sep === "\t" ? line.split("\t") : line.split(",");
  }
  /* A heading row of a shot list: short cells, at least two of them naming a column the engine knows. */
  function shotHeader(line) {
    if (!line) return false;
    const sep = line.includes("\t") ? "\t" : line.includes(",") ? "," : null;
    if (!sep) return false;
    const cells = splitCells(line, sep).map((c) => c.trim());
    if (cells.some((c) => c.length > 24)) return false;
    return cells.filter((c) => /^(shot|size|framing|angle|height|move|movement|motion|rig|support|carry|lens|focal|dur|duration|length|time|sec|seconds|scene|sc|description|action|notes?|#|no\.?)\b/i.test(c)).length >= 2;
  }

  function cut(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const firstIdx = lines.findIndex((l) => l.trim());
    if (firstIdx < 0) return { kind: "lines", units: [] };
    if (shotHeader(lines[firstIdx].trim())) {
      const units = [];
      for (let i = firstIdx + 1; i < lines.length; i++) if (lines[i].trim()) units.push({ text: lines[i].trim(), heading: "", from: i + 1, to: i + 1, words: wordCount(lines[i]) });
      return { kind: "shotList", units: units.slice(0, MAX_MOMENTS), header: lines[firstIdx].trim(), more: Math.max(0, units.length - MAX_MOMENTS) };
    }
    /* Paragraphs first; with fewer than three, one moment per line. */
    const blocks = [];
    let cur = null;
    lines.forEach((l, i) => {
      if (!l.trim()) {
        cur = null;
        return;
      }
      if (!cur) blocks.push((cur = { lines: [] }));
      cur.lines.push({ n: i + 1, t: l.trim() });
    });
    let kind = "blocks";
    let groups = blocks.map((b) => b.lines);
    const content = (g) => g.filter((x) => !HEADING.test(x.t) && !TRANSITION.test(x.t));
    if (groups.filter((g) => content(g).length).length < 3) {
      kind = "lines";
      const all = [].concat(...groups);
      groups = [];
      for (let i = 0; i < all.length; i++) {
        const x = all[i];
        const next = all[i + 1];
        /* A speaker's name on its own line goes with the line under it. */
        if (CUE_LINE.test(x.t) && wordCount(x.t) <= 4 && next && !HEADING.test(next.t) && !CUE_LINE.test(next.t) && !HEADING.test(x.t) && !TRANSITION.test(x.t)) {
          groups.push([x, next]);
          i++;
        } else groups.push([x]);
      }
    }
    const units = [];
    let heading = "";
    groups.forEach((g) => {
      const rest = [];
      g.forEach((x) => {
        if (HEADING.test(x.t)) heading = x.t;
        else if (!TRANSITION.test(x.t)) rest.push(x);
      });
      if (!rest.length) return;
      const t = rest.map((x) => x.t).join("\n");
      units.push({ text: t, heading, from: rest[0].n, to: rest[rest.length - 1].n, words: wordCount(t) });
    });
    return { kind, units: units.slice(0, MAX_MOMENTS), more: Math.max(0, units.length - MAX_MOMENTS) };
  }

  /* ---------- the engine's analysis ---------- */
  /* Only a moment that talks about the shot is read for shot words ("He stands still" is not a locked camera). */
  const SHOT_WORDS = /\b(shot|close[- ]?up|closeup|wide|ecu|cu|mcu|ms|ws|ls|els|pan|pans|tilt|tilts|zoom|zooms|dolly|crane|angle|handheld|steadicam|tripod|pov|overhead|insert|\d+\s?mm)\b/i;
  function engineBeats(c, header) {
    const an = AN();
    if (!an || typeof an.script !== "function") return { why: "The engine's analysis is not loaded on this page." };
    const units = c.units;
    if (units.length < 3) return { why: "The engine needs at least three moments to compare, and this has " + units.length + "." };
    /* Each moment gets its own scene heading, so the engine reads one row per moment. */
    const wrapped = units.map((u) => (HEADING.test(u.heading) ? u.heading : "I/E.") + "\n" + u.text).join("\n\n");
    let lanes = {};
    const sc = an.script(wrapped, "From your script");
    if (sc && sc.rows && sc.rows.length === units.length) lanes = Object.assign(lanes, sc.lanes);
    /* Shot words in each moment (wide, close, low, pan, handheld, 50mm...), or the shot list's own columns. */
    const shotText = c.kind === "shotList" && header ? header + "\n" + units.map((u) => u.text).join("\n") : "shot\n" + units.map((u) => (SHOT_WORDS.test(u.text) ? u.text.replace(/\n/g, " ").replace(/"/g, "") : "-")).join("\n");
    const sh = typeof an.shotList === "function" ? an.shotList(shotText, "From your script") : null;
    if (sh && sh.rows && sh.rows.length === units.length) Object.assign(lanes, sh.lanes);
    if (!Object.keys(lanes).length) return { why: "The engine found nothing it could measure in this text." };
    /* The engine grades amounts from 0 to 5 against the busiest moment, so they wobble on every line. A wobble
       of one step is not something an audience notices: a number holds until it moves SMALL_STEP or more. */
    Object.keys(lanes).forEach((id) => {
      let held = null;
      lanes[id] = lanes[id].map((v) => {
        if (typeof v === "number" && typeof held === "number" && Math.abs(v - held) < SMALL_STEP) return held;
        held = v;
        return v;
      });
    });
    const beats = units.map((u, i) => {
      const values = {};
      Object.keys(lanes).forEach((id) => {
        const v = lanes[id][i];
        if (v != null && v !== "") values[id] = v;
      });
      return { values };
    });
    return { beats };
  }

  /* ---------- the plain guess: keywords per family ---------- */
  const KEYWORDS = {
    plot: ["reveals", "discovers", "finds", "decides", "secret", "letter", "arrives", "suddenly", "realizes", "must", "promise", "deal", "plan", "steals", "lies", "truth", "ticket", "missing", "chooses", "refuses"],
    voice: ["says", "asks", "whispers", "shouts", "yells", "calls", "answers", "tells", "replies", "speaks", "voice"],
    music: ["music", "song", "sings", "hums", "radio", "piano", "drum", "drums", "melody", "horn", "bell", "silence", "sound", "noise", "rings"],
    feeling: ["cries", "tears", "afraid", "scared", "angry", "furious", "sad", "sighs", "smiles", "grins", "nervous", "proud", "hurt", "love", "hugs", "trembles", "gasps"],
    comedy: ["laughs", "joke", "trips", "slips", "pratfall", "banana", "funny", "ridiculous", "absurd", "silly", "giggles", "oops"],
    camera: ["close up", "close-up", "closeup", "wide shot", "wide", "shot", "pan", "pans", "zoom", "dolly", "angle", "pov", "overhead", "tracking", "ecu", "cu", "ms", "ws", "insert", "handheld"],
    movement: ["runs", "walks", "jumps", "climbs", "dances", "turns", "grabs", "throws", "falls", "rushes", "chases", "slides", "steps", "spins", "crawls", "kicks", "stops"],
    place: ["room", "street", "kitchen", "forest", "beach", "house", "city", "pier", "booth", "station", "field", "roof", "window", "door", "garden", "shop", "water", "sea"],
    light: ["light", "lamp", "dark", "shadow", "shadows", "sunset", "dawn", "glow", "glows", "flicker", "flickers", "candle", "neon", "moon", "moonlight", "sunlight"],
    wardrobe: ["coat", "dress", "hat", "shoes", "boots", "scarf", "wears", "uniform", "costume", "jacket", "gloves"],
    mind: ["thinks", "remembers", "wonders", "imagines", "dream", "memory", "notices", "stares", "watches", "studies", "recalls"],
    effects: ["explodes", "explosion", "smoke", "sparks", "magic", "vanishes", "slow motion", "fog", "glitter"],
    cut: ["cut to", "smash cut", "montage", "later", "flashback", "dissolve", "fade", "meanwhile"],
  };
  /* When two families score the same, the one earlier here wins (story first). */
  const ORDER = ["plot", "feeling", "comedy", "voice", "music", "movement", "camera", "mind", "light", "place", "wardrobe", "effects", "cut"];

  function guessFamily(text, previous) {
    const lower = " " + String(text).toLowerCase().replace(/[^a-z0-9' -]+/g, " ") + " ";
    const score = {};
    Object.keys(KEYWORDS).forEach((f) => {
      KEYWORDS[f].forEach((w) => {
        let i = lower.indexOf(" " + w + " ");
        while (i >= 0) {
          score[f] = (score[f] || 0) + 1;
          i = lower.indexOf(" " + w + " ", i + 1);
        }
      });
    });
    /* A heading is a place; a speech (a name in capitals over a line, or words in quotes) is a voice. */
    if (HEADING.test(text)) score.place = (score.place || 0) + 3;
    const lines = String(text).split("\n");
    if ((lines.length > 1 && CUE_LINE.test(lines[0]) && !HEADING.test(lines[0])) || /["“][^"”]{2,}["”]/.test(text) || /^[A-Z][A-Z .'\-]{1,30}:\s/.test(text)) score.voice = (score.voice || 0) + 1.5;
    let best = null;
    ORDER.forEach((f) => {
      if (score[f] && (!best || score[f] > score[best])) best = f;
    });
    return best || previous || "plot";
  }

  const QUIET_WORD = /^(none|no |off|silence|silent|still|nothing|empty|stopped)/i;
  /* The values a curiosity can take that are not "nothing": a list, or a range turned into whole steps. */
  function choices(id) {
    const s = S();
    if (s && typeof s.domain === "function") {
      if (typeof s.known === "function" && !s.known(id)) return [];
      const d = s.domain(id);
      if (d.kind === "choice") return d.options.filter((v) => !QUIET_WORD.test(String(v)));
      if (d.kind === "range" && d.max - d.min >= 2) return [d.min + 1, d.max];
      return [];
    }
    const c = M().find(id);
    if (c && Array.isArray(c.options)) return c.options.filter((v) => !QUIET_WORD.test(String(v)));
    if (c && c.kind === "range") return [Number(c.min || 0) + 1, Number(c.max || 5)];
    return [];
  }
  /* The curiosity that stands in for each family in the plain guess: the first of these that the app knows. */
  const PREFER = { plot: ["plotProgress", "plotSecret", "arcStage"], voice: ["volume"], music: ["musicCue"], feeling: ["emotionIntensity"], comedy: ["comedyDevice"], camera: ["shotSize"], movement: ["characterPath"], place: ["setting"], light: ["key", "lighting"], wardrobe: ["mainEra"], mind: ["focusShift", "mindset"], effects: ["element", "atmosphere"], cut: ["transition", "intercut"] };
  let picks = null;
  /* One curiosity stands in for each family: PREFER, else one of that family that gives the family's usual cue. */
  function standIn(family) {
    if (!picks) {
      picks = {};
      Object.keys(PREFER).forEach((f) => {
        const id = PREFER[f].find((x) => M().find(x) && M().note(x).family === f && choices(x).length >= 2);
        if (id) picks[f] = id;
      });
      const loose = {};
      M()
        .all()
        .forEach((n) => {
          if (!n || !n.id || n.id.includes(".") || choices(n.id).length < 2) return;
          const fam = M().note(n.id).family;
          const f = M().family(fam);
          if (!f) return;
          if (!picks[fam] && n.cue === f.cue) picks[fam] = n.id;
          if (!loose[fam]) loose[fam] = n.id;
        });
      Object.keys(loose).forEach((f) => picks[f] || (picks[f] = loose[f]));
    }
    return picks[family] || null;
  }

  function plainGuess(units) {
    const known = {};
    let prev = null;
    return units.map((u) => {
      const family = guessFamily(u.text, prev && prev.family);
      const id = standIn(family);
      if (id) {
        const list = choices(id);
        /* Same family again: the same curiosity changes again (attention stays). A new family: it changes. */
        const now = known[id];
        known[id] = list[list.length - 1] !== now ? list[list.length - 1] : list[list.length - 2];
      }
      prev = { family };
      return { values: Object.assign({}, known), family };
    });
  }

  /* ---------- reading ---------- */
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  function durationOf(u) {
    return Math.max(2, Math.min(12, Math.round((u.words / WORDS_PER_SECOND) * 2) / 2));
  }
  const excerpt = (t, n) => {
    const s = String(t || "").replace(/\s+/g, " ").trim();
    return s.length > (n || 90) ? s.slice(0, (n || 90) - 1).replace(/\s+\S*$/, "") + "…" : s;
  };

  function readScript(text, options) {
    const o = Object.assign({ how: "both", timing: "words", secondsPerBeat: 3, limit: 20 }, options || {});
    const c = cut(text);
    let method = "plain";
    let why = "";
    let beats = null;
    if (o.how !== "plain") {
      const eb = engineBeats(c, c.header);
      if (eb.beats) {
        beats = eb.beats;
        method = "engine";
        /* Both: the keywords add what the engine does not measure (the plot, sound, light, places, comedy). */
        if (o.how === "both") {
          const guess = plainGuess(c.units);
          beats = beats.map((b, i) => ({ values: Object.assign({}, guess[i].values, b.values) }));
          method = "both";
        }
      } else why = eb.why;
    } else why = "You picked the plain guess.";
    const step = Number(o.secondsPerBeat) > 0 ? Number(o.secondsPerBeat) : 3;
    const durs = c.units.map((u) => (o.timing === "even" ? step : durationOf(u)));
    const times = [];
    durs.reduce((t, d, i) => ((times[i] = t), t + d), 0);
    const opts = { secondsPerBeat: step, limit: o.limit, end: durs[durs.length - 1] || step };
    const timed = (list) => list.map((b, i) => ({ at: times[i], values: b.values }));
    let reading = beats ? A().read(timed(beats), opts) : null;
    if (method !== "plain" && (!reading || !reading.segments.length)) {
      method = "plain";
      why = "The engine's analysis found no change of attention in this text.";
      beats = null;
    }
    if (!beats) {
      beats = plainGuess(c.units);
      reading = A().read(timed(beats), opts);
    }
    const cells = cellsOf(c.units, reading, times, durs, o.limit);
    const weak = weakSpots(c.units, cells, reading, o.limit);
    return { method, why, kind: c.kind, more: c.more || 0, units: c.units, beats: beats.map((b, i) => ({ at: times[i], values: b.values })), reading, cells, weak, limit: o.limit, secondsPerBeat: step, timing: o.timing === "even" ? "even" : "words", seconds: reading.seconds };
  }

  /* One cell per moment: who holds attention there, whether it just moved, and how long its family has held. */
  function cellsOf(units, reading, times, durs, limit) {
    const runs = reading.stats.familyRuns || [];
    let prevFam = null;
    return units.map((u, i) => {
      let seg = null;
      reading.segments.forEach((g) => g.beat <= i && (seg = g));
      const end = times[i] + durs[i];
      const run = seg ? runs.find((r) => r.from <= seg.from + 1e-6 && r.to >= seg.to - 1e-6) : null;
      const held = run ? round(end - run.from, 1) : null;
      const family = seg ? seg.family : null;
      const cell = { i, from: u.from, to: u.to, family, curiosity: seg ? seg.curiosity : null, label: seg ? seg.label : "", cue: seg ? seg.cue : null, quiet: !!(seg && seg.quiet), moved: !!(seg && seg.beat === i && family !== prevFam), held, status: M().status(held, limit), at: times[i], dur: durs[i], excerpt: excerpt(u.text, 70) };
      prevFam = family;
      return cell;
    });
  }

  const CUE_WORD = { visual: "something new to look at", audio: "something new to hear", thought: "something new to think about", movement: "something that moves", plot: "a turn in the story" };
  /* Where attention rests too long: every family stretch that reaches Getting long or Too long. */
  function weakSpots(units, cells, reading, limit) {
    const share = reading.stats.familyShare || {};
    const out = [];
    let i = 0;
    while (i < cells.length) {
      let j = i;
      while (j + 1 < cells.length && cells[j + 1].family === cells[i].family && !cells[j + 1].moved) j++;
      const last = cells[j];
      if (cells[i].family && last.status.key !== "fresh" && last.status.key !== "none") {
        const run = cells.slice(i, j + 1);
        const longCell = run.find((c) => c.status.key !== "fresh") || last;
        const next = cells[j + 1] ? cells[j + 1].family : null;
        out.push({ family: cells[i].family, label: (M().family(cells[i].family) || { label: cells[i].family }).label, curiosity: cells[i].curiosity, dur: round(last.held, 1), status: last.status, moments: run.map((c) => c.i), lines: [run[0].from, last.to], longAt: longCell.from, suggest: suggest(cells[i].family, next, share, longCell.from, out.map((w) => w.suggest.family)) });
      }
      i = j + 1;
    }
    return out;
  }
  /* A family to move to: one the script uses least (fresh to the audience), not the stuck one or the next one. */
  function suggest(stuck, next, share, line, used) {
    const fams = ORDER.filter((f) => f !== stuck && f !== next && standIn(f));
    /* Fresh first: a family not suggested yet, then the one the script gives the least time. */
    const seen = (f) => ((used || []).includes(f) ? 1 : 0);
    fams.sort((a, b) => seen(a) - seen(b) || (share[a] || 0) - (share[b] || 0) || ORDER.indexOf(a) - ORDER.indexOf(b));
    const family = fams[0] || "plot";
    const id = standIn(family);
    const n = id ? M().note(id) : null;
    const f = M().family(family) || { label: family, cue: "plot" };
    const cue = n ? n.cue : f.cue;
    const tryThis = n ? M().plain(n.tryThis) : "";
    const text = `Around line ${line}, let something else take attention: ${f.label}, ${CUE_WORD[cue] || "something new"}. ${tryThis}`.trim();
    return { family, label: f.label, curiosity: id, cue, tryThis, text };
  }

  /* ---------- the engine film ---------- */
  /* One batch that makes these moments My film's rows: the values go on the Master track (or a "From your
     script" track when Master is full). Tracks and links stay; rows and their old values are replaced. The
     labels say only the moment and its line, never the text. */
  function engineBatch(result, state) {
    const st = state || { rows: [], tracks: [], next: 1 };
    const sc = S();
    const ids = [];
    result.beats.forEach((b) => Object.keys(b.values).forEach((id) => ids.includes(id) || ids.push(id)));
    const usable = ids.filter((id) => !sc || (sc.known(id) && sc.fix(id, result.beats.find((b) => b.values[id] != null).values[id]) != null));
    let tracks = (st.tracks || []).map((t) => ({ id: t.id, kind: t.kind, label: t.label, curiosities: t.curiosities.slice() }));
    let host = tracks.find((t) => t.kind === "master");
    const perTrack = (E() && E().LIMIT && E().LIMIT.perTrack) || 24;
    const room = (t) => t && t.curiosities.filter((c) => !usable.includes(c)).length + usable.length <= perTrack;
    if (!host && !tracks.length) tracks.push((host = { id: "master", kind: "master", label: "Master", curiosities: [] }));
    if (!room(host)) {
      host = tracks.find((t) => t.id === "script");
      if (!host) tracks.push((host = { id: "script", kind: "other", label: "From your script", curiosities: [] }));
      if (!room(host)) host.curiosities = [];
    }
    usable.forEach((c) => host.curiosities.includes(c) || host.curiosities.push(c));
    const rows = result.cells.slice(0, MAX_MOMENTS).map((c, i) => ({ id: "scr" + (i + 1), label: `Moment ${i + 1} (line ${c.from})` }));
    const source = {};
    rows.forEach((r, i) => {
      const v = result.beats[i].values;
      usable.forEach((c) => {
        if (v[c] == null) return;
        const x = sc ? sc.fix(c, v[c]) : v[c];
        if (x != null) source[r.id + "|" + host.id + "|" + c] = x;
      });
    });
    return { type: "batch", label: "Momentum: moments from your script", commands: [{ type: "importFilm", film: { rows, tracks, source, next: st.next || 1 } }] };
  }
  function send(result) {
    if (!E() || typeof E().send !== "function") return { ok: false, error: "The engine is not loaded on this page." };
    if (!result || !result.cells.length) return { ok: false, error: "Read a script first." };
    return E().send(engineBatch(result, E().state()));
  }

  /* ---------- saving the pasted text (this browser only) ---------- */
  function load() {
    try {
      const p = JSON.parse(root.localStorage.getItem(STORE));
      return p && typeof p === "object" ? p : {};
    } catch (e) {
      return {};
    }
  }
  function save(p) {
    try {
      root.localStorage.setItem(STORE, JSON.stringify(p));
    } catch (e) {}
  }

  /* ---------- the tab ---------- */
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const chip = (family) => {
    const m = M().mark(family);
    return `<span class="msc-fam"><span class="msc-letter" style="background:${m.color};color:${m.ink}">${esc(m.letter)}</span> ${esc(m.label)}</span>`;
  };
  const statusHtml = (s) => `<span class="msc-status msc-${s.cls}">${s.icon} ${esc(s.words)}</span>`;
  const linesWord = (a, b) => (a === b ? `line ${a}` : `lines ${a} to ${b}`);
  const KIND_WORDS = { blocks: "one moment per paragraph", lines: "one moment per line", shotList: "one moment per shot" };

  /* How to read it. The engine's choices fall back to the plain guess when the engine cannot read the text. */
  const HOW = [
    ["both", "The engine's analysis and keywords"],
    ["engine", "The engine's analysis only"],
    ["plain", "The plain guess (keywords only)"],
  ];
  let state = null; /* { text, how, timing } */
  let result = null;
  let flash = "";

  function stripHtml(r) {
    const total = r.cells.reduce((a, c) => a + c.dur, 0) || 1;
    const cells = r.cells
      .map((c) => {
        const m = M().mark(c.family);
        const tip = `Moment ${c.i + 1}, ${linesWord(c.from, c.to)}: ${m.label || "nothing"} holds attention, ${c.held == null ? 0 : c.held} s so far, ${c.status.words}`;
        return `<span class="msc-cell" style="flex-grow:${c.dur};flex-basis:${((c.dur / total) * 100).toFixed(2)}%" title="${esc(tip)}"><i style="background:${m.color};color:${m.ink}">${c.moved ? esc(m.letter) : ""}</i><b class="msc-${c.status.cls}">${c.status.key === "long" || c.status.key === "over" ? c.status.icon : ""}</b></span>`;
      })
      .join("");
    const fams = [];
    r.cells.forEach((c) => c.family && !fams.includes(c.family) && fams.push(c.family));
    return `<div class="msc-strip" role="img" aria-label="Attention strip: one cell per moment, colored by the kind of curiosity holding attention">${cells}</div>
      <div class="msc-key">${fams.map(chip).join("")}${[M().status(r.limit * 0.9, r.limit), M().status(r.limit * 2, r.limit)].map((s) => `<span>${s.icon} ${esc(s.words)}</span>`).join("")}</div>`;
  }
  function weakHtml(r) {
    if (!r.weak.length)
      return `<p class="msc-good">${M().status(0, r.limit).icon} Attention never rests too long. Every kind of curiosity hands attention on before ${Math.round(r.limit * 0.75)} seconds (three quarters of your ${r.limit} second limit).</p>`;
    return `<ol class="msc-weak">${r.weak
      .map((w) => {
        const lines = w.lines;
        const quotes = r.cells
          .filter((c) => w.moments.includes(c.i))
          .slice(0, 3)
          .map((c) => `<li><span class="msc-ln">${esc(linesWord(c.from, c.to))}</span> ${esc(c.excerpt)}</li>`)
          .join("");
        const extra = w.moments.length > 3 ? `<li class="msc-more">and ${w.moments.length - 3} more moment${w.moments.length - 3 === 1 ? "" : "s"}</li>` : "";
        const through = [];
        r.cells.forEach((c) => w.moments.includes(c.i) && c.label && !through.includes(M().plain(c.label)) && through.push(M().plain(c.label)));
        return `<li><div class="msc-wh">${statusHtml(w.status)} ${chip(w.family)} holds attention for <b>${w.dur} seconds</b>, ${esc(linesWord(lines[0], lines[1]))}${through.length ? ` (through ${esc(through.slice(0, 4).join(", "))})` : ""}.</div>
          <ul class="msc-quotes">${quotes}${extra}</ul>
          <p class="msc-try"><b>Try this:</b> ${esc(w.suggest.text)}</p></li>`;
      })
      .join("")}</ol>`;
  }
  function momentsHtml(r) {
    return `<details class="msc-all"><summary>Every moment (${r.cells.length})</summary><ol>${r.cells
      .map((c) => `<li><span class="msc-ln">${esc(linesWord(c.from, c.to))}</span> ${chip(c.family)}${c.label ? ` <span class="msc-cur">(${esc(M().plain(c.label))})</span>` : ""} ${c.status.key === "long" || c.status.key === "over" ? statusHtml(c.status) : ""}<span class="msc-ex">${esc(c.excerpt)}</span></li>`)
      .join("")}</ol></details>`;
  }
  function resultHtml(r, ctx) {
    const ENGINE_WORDS = "how much is said and done, the feeling, how loud, who speaks, inside or outside, the time of day and any shot words";
    const methodLine =
      r.method === "both"
        ? `Read with <b>the engine's analysis</b> (the same one as Library, Engine, Analyze: ${ENGINE_WORDS}) and <b>keywords</b> for what the engine does not measure (the plot, sounds, light, places, comedy), ${KIND_WORDS[r.kind]}.`
        : r.method === "engine"
        ? `Read with <b>the engine's analysis</b> only (the same one as Library, Engine, Analyze: ${ENGINE_WORDS}), ${KIND_WORDS[r.kind]}.`
        : `Read with <b>the plain guess</b>: ${KIND_WORDS[r.kind]}, and the kind of curiosity guessed from words in it (a speaker's name means a voice, "runs" means movement, "lamp" means light). ${esc(r.why)}`;
    const timingLine = r.timing === "even" ? `Each moment lasts ${ctx.secondsPerBeat()} seconds (Seconds per panel).` : `Each moment lasts about as long as its words take to say, between 2 and 12 seconds.`;
    const st = r.reading.stats;
    const engineRows = E() && E().state ? E().state().rows.length : 0;
    return `<section class="msc-sec">
        <h3>What attention does</h3>
        <p class="mo-small">${methodLine} ${timingLine} ${r.cells.length} moments, about ${Math.round(r.seconds)} seconds in all.${r.more ? ` Only the first ${MAX_MOMENTS} moments are read; ${r.more} more were left out.` : ""}</p>
        ${stripHtml(r)}
        <p class="msc-sum">Attention moves ${st.switches} time${st.switches === 1 ? "" : "s"}, about ${st.switchesPerMinute} times a minute. The longest stretch on one kind of curiosity is ${Math.max(0, ...r.cells.map((c) => c.held || 0))} seconds, against your limit of ${r.limit} seconds.</p>
      </section>
      <section class="msc-sec"><h3>Where it rests too long</h3>${weakHtml(r)}</section>
      <section class="msc-sec">${momentsHtml(r)}</section>
      <section class="msc-sec"><h3>Use it in the other tabs</h3>
        <p class="mo-small">This makes these ${Math.min(MAX_MOMENTS, r.cells.length)} moments the rows of My film in the engine, so every tab can read it as "The engine's timeline". ${engineRows ? `It replaces My film's ${engineRows} rows and their values; its tracks and links stay. ` : ""}On the engine every moment lasts Seconds per panel. Only the values go to the engine, never your words. One Undo takes it back.</p>
        <div class="msc-btns"><button type="button" data-msc="send">Send these moments to the engine film</button>${E() && E().canUndo && E().canUndo() && /from your script/.test((E().history().undo || []).slice(-1)[0] || "") ? `<button type="button" data-msc="undo">Undo</button>` : ""}</div>
      </section>`;
  }

  function mountTab(el, ctx) {
    if (!state) {
      const p = load();
      state = { text: typeof p.text === "string" ? p.text : "", how: HOW.some((h) => h[0] === p.how) ? p.how : "both", timing: p.timing === "even" ? "even" : "words" };
    }
    if (state.text.trim() && (!result || result.limit !== ctx.limit() || result.secondsPerBeat !== ctx.secondsPerBeat())) result = readScript(state.text, { how: state.how, timing: state.timing, secondsPerBeat: ctx.secondsPerBeat(), limit: ctx.limit() });
    el.innerHTML = `<div class="msc">
      ${flash ? `<div class="mo-flash" role="status">${esc(flash)}</div>` : ""}
      <p class="mo-lede">Check momentum before you shoot or animate. Paste a scene, a short script or a shot list (one line per shot is fine) and see where the audience's attention rests on one kind of curiosity too long, on which lines, and one thing to try.</p>
      <label class="msc-label" for="msc-text">Your scene, script or shot list</label>
      <textarea id="msc-text" class="msc-text" rows="10" spellcheck="false" placeholder="INT. KITCHEN - NIGHT&#10;&#10;Mara drops the cup. It shatters.&#10;&#10;MARA&#10;That was my mother's.">${esc(state.text)}</textarea>
      <p class="mo-small">Your text stays in this browser only. It is kept on this device so it is here next time, and it is never sent anywhere.</p>
      <div class="mo-controls msc-controls">
        <label>Read it with <select data-msc="how">${HOW.map(([v, t]) => `<option value="${v}"${state.how === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>Each moment lasts <select data-msc="timing"><option value="words"${state.timing === "words" ? " selected" : ""}>As long as its words take to say</option><option value="even"${state.timing === "even" ? " selected" : ""}>Seconds per panel (${ctx.secondsPerBeat()} s)</option></select></label>
      </div>
      <div class="msc-btns"><button type="button" class="msc-primary" data-msc="read">Read it</button><button type="button" data-msc="sample">Try a sample</button>${state.text ? `<button type="button" data-msc="clear">Clear</button>` : ""}</div>
      ${result && result.cells.length ? resultHtml(result, ctx) : state.text.trim() && result ? `<p class="mo-empty">No moments were found in this text. Put each line of action or dialogue on its own line.</p>` : `<p class="mo-empty">Nothing read yet. Paste your own scene and press Read it, or press Try a sample to read a short practice scene.</p>`}
    </div>`;
    flash = "";
    const ta = el.querySelector("#msc-text");
    let timer = null;
    ta.addEventListener("input", () => {
      state.text = ta.value;
      clearTimeout(timer);
      timer = setTimeout(() => save(state), 400);
    });
    const reread = () => {
      state.text = ta.value;
      save(state);
      result = state.text.trim() ? readScript(state.text, { how: state.how, timing: state.timing, secondsPerBeat: ctx.secondsPerBeat(), limit: ctx.limit() }) : null;
      ctx.refresh();
    };
    el.querySelector('[data-msc="read"]').addEventListener("click", reread);
    el.querySelector('[data-msc="sample"]').addEventListener("click", () => {
      ta.value = SAMPLE;
      reread();
    });
    const clear = el.querySelector('[data-msc="clear"]');
    if (clear)
      clear.addEventListener("click", () => {
        ta.value = "";
        reread();
      });
    el.querySelector('[data-msc="how"]').addEventListener("change", (e) => {
      state.how = e.target.value;
      reread();
    });
    el.querySelector('[data-msc="timing"]').addEventListener("change", (e) => {
      state.timing = e.target.value;
      reread();
    });
    const sendBtn = el.querySelector('[data-msc="send"]');
    if (sendBtn)
      sendBtn.addEventListener("click", () => {
        const out = send(result);
        flash = out.ok ? `My film in the engine now has these ${Math.min(MAX_MOMENTS, result.cells.length)} moments. Pick "The engine's timeline" in any tab to read it. Undo takes it back.` : out.error || "The engine did not take it.";
        ctx.refresh();
      });
    const undoBtn = el.querySelector('[data-msc="undo"]');
    if (undoBtn)
      undoBtn.addEventListener("click", () => {
        E().undo();
        flash = "My film is back as it was before.";
        ctx.refresh();
      });
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "script", label: "From your script", group: "see", mount: mountTab });
  }

  const api = { cut, readScript, plainGuess, guessFamily, standIn, engineBatch, send, SAMPLE, KEYWORDS, STORE, MAX_MOMENTS, addTab, mountTab };
  root.CurioFromScript = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
