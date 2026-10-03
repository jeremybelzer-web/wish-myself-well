/* momentum/lesson.js: "Learn it", a guided walk-through that teaches momentum with any film in the source picker.
   Made for beginner filmmakers, film students and performers who are new to film words.

   It steps through the film's attention reading one moment (beat) at a time, with Back and Next (or the left and
   right arrow keys while the tab has focus). Each moment shows
     - the family of curiosities holding attention, as a colored chip with its letter (never color alone),
     - a small barometer of how long that family has held attention against the limit (● Fresh, ▲ Getting long,
       ■ Too long),
     - two or three plain sentences made from the data: what took attention and on which cue, how long the last
       thing held, and "Try this in your film" from that curiosity's momentum note (notes.js tryThis).
   Every few moments a quick check asks a question with three choices made from the data ("What took attention
   here?"), says kindly whether the answer was right, and keeps a score for the session. A list of moments can
   jump anywhere, and "Skip the quiet holds" keeps only the moments where attention moved. For the engine's film,
   or a curated film shown in one of the Screen's inspiration viewers, "Watch this moment" moves the Screen's
   playhead there (CurioScreen.setRow; an inspiration film follows My film's playhead proportionally).

   window.CurioLesson
   - lessonSteps(reading, opts) -> { steps, moves, seconds, limit, quizzes }   pure, works in Node
       reading: CurioAttention.read(...)
       opts: { limit, secondsPerBeat, beats (the film's beats, for exact times), quizEvery: 3 }
       step: { index, beat, at, clock, kind: "start" | "move" | "shift" | "hold" | "empty", moved, family,
               familyLabel, letter, curiosity, label, cue, cueLabel, quiet, held, limit, status { cls, icon, text },
               before, title, sentences [2 or 3], tryThis, quiz | null }
       quiz: { kind: "cue" | "family" | "status", question, choices [{ id, text }], answer, explain }
   - check(quiz, choiceId) -> { right, text }   the kind words for an answer
   - CUE_WORDS, addTab() (the family letters are CurioMomentum.LETTERS, in notes.js)
   Saves the source, the skip choice and the last moment per film under localStorage key
   curiosities-momentum-lesson-v1. The score lasts for the session (until the page reloads). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const KEY = "curiosities-momentum-lesson-v1";
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;

  /* Family colors and letters, and the Fresh / Getting long / Too long marks, come from notes.js
     (CurioMomentum.mark and CurioMomentum.status), the same on every tab. */
  const mark = (f) => M().mark(f);

  /* Each cue in everyday words: "short" answers the quick check, "long" goes in a sentence. */
  const CUE_WORDS = {
    visual: { short: "something to look at", long: "something new to look at", label: "a visual cue" },
    audio: { short: "a sound", long: "something new to hear", label: "an audio cue" },
    thought: { short: "a thought", long: "something new to think about", label: "a thought cue" },
    movement: { short: "a movement", long: "something moving", label: "a movement cue" },
    plot: { short: "a turn in the story", long: "a turn in the story", label: "a plot cue" },
  };
  const STATUS = () => ["fresh", "long", "over"].map((k) => M().STATUS[k]);
  const statusOf = (held, limit) => M().status(held || 0, limit);
  const STATUS_SAYS = {
    Fresh: "That is still fresh.",
    "Getting long": "That is getting long: the audience will soon want something new.",
    "Too long": "That is too long: the audience starts to drift.",
  };

  /* A curiosity's name in quotes, so a long name reads as one thing inside a sentence. */
  const q_ = (t) => "\u201c" + t + "\u201d";
  const round1 = (n) => Math.round(n * 10) / 10;
  function clock(s) {
    s = Math.max(0, Math.round(s || 0));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  const secs = (n) => {
    const r = Math.round(n);
    return r + (r === 1 ? " second" : " seconds");
  };
  function famLabel(f) {
    const x = M() && M().family ? M().family(f) : null;
    return x ? x.label : f || "";
  }
  function cueLabelOf(c) {
    const x = M() && M().CUES ? M().CUES.find((k) => k.id === c) : null;
    return x ? x.label : c || "";
  }
  function noteOf(id) {
    try {
      return (M() && M().note(id)) || null;
    } catch (e) {
      return null;
    }
  }
  function cuePhrase(cue, quiet) {
    const w = CUE_WORDS[cue] || CUE_WORDS.visual;
    return quiet ? `something stopping (${w.label})` : `${w.long} (${w.label})`;
  }
  /* Times of the beats: the same rules as CurioAttention.read (given times, else evenly spaced, never back). */
  function parseAt(at) {
    if (typeof at === "number" && isFinite(at)) return at;
    if (typeof at !== "string" || !/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(at.trim())) return null;
    return at
      .trim()
      .split(":")
      .reduce((s, p) => s * 60 + Number(p), 0);
  }
  function beatTimes(reading, opts) {
    const n = reading.beats || 0;
    const step = Number(opts.secondsPerBeat) > 0 ? Number(opts.secondsPerBeat) : 3;
    const raw = Array.isArray(opts.beats) ? opts.beats.filter((b) => b && b.values && typeof b.values === "object") : null;
    const times = new Array(n).fill(0);
    if (raw && raw.length === n) {
      let t = 0;
      raw.forEach((b, i) => {
        const s = parseAt(b.at);
        t = s != null && s >= t ? s : i === 0 ? 0 : t + step;
        times[i] = t;
      });
      return times;
    }
    /* No beats given: segment starts are exact; spread the beats in between evenly. */
    const segs = reading.segments || [];
    const end = segs.length ? segs[segs.length - 1].to : n * step;
    for (let k = 0; k < segs.length; k++) {
      const s = segs[k];
      const nb = k + 1 < segs.length ? segs[k + 1].beat : n;
      const nt = k + 1 < segs.length ? segs[k + 1].from : end;
      for (let j = s.beat; j < nb; j++) times[j] = s.from + ((j - s.beat) * (nt - s.from)) / Math.max(1, nb - s.beat);
    }
    const first = segs.length ? segs[0].beat : n;
    for (let j = 0; j < first; j++) times[j] = j * step;
    return times;
  }
  /* A small seeded shuffle, so the same moment always asks the same way (tests and Back/Next agree). */
  function seeded(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }
  function shuffle(list, rnd) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const AB = ["a", "b", "c"];

  function makeQuiz(kind, st, ctx) {
    const rnd = seeded(st.beat + 7 * (ctx.quizN + 1));
    let choices;
    let answer;
    let question;
    let explain;
    if (kind === "cue") {
      const others = shuffle(Object.keys(CUE_WORDS).filter((c) => c !== st.cue), rnd).slice(0, 2);
      choices = shuffle([st.cue].concat(others), rnd).map((c) => ({ id: c, text: CUE_WORDS[c].short }));
      answer = st.cue;
      question = "What took attention here?";
      explain = `${q_(st.label)} came in with ${cuePhrase(st.cue, st.quiet)}.`;
    } else if (kind === "family") {
      const inFilm = ctx.families.filter((f) => f !== st.family);
      const rest = M().FAMILIES.map((f) => f.id).filter((f) => f !== st.family && !inFilm.includes(f));
      const others = shuffle(inFilm, rnd).concat(shuffle(rest, rnd)).slice(0, 2);
      choices = shuffle([st.family].concat(others), rnd).map((f) => ({ id: f, text: famLabel(f) }));
      answer = st.family;
      question = "What kind of curiosity holds attention now?";
      explain = `${q_(st.label)} belongs to ${st.familyLabel}.`;
    } else {
      choices = STATUS().map((s) => ({ id: s.words, text: s.icon + " " + s.words }));
      answer = st.status.text;
      question = "Has this held attention too long yet?";
      explain = `${st.familyLabel} has held attention for ${secs(st.held)} of the ${st.limit} second limit, which counts as ${st.status.text.toLowerCase()}. Under three quarters of the limit is fresh; past the limit is too long.`;
    }
    return { kind, question, choices: choices.map((c, i) => Object.assign({ key: AB[i] }, c)), answer, explain };
  }

  /* The lesson, made from a reading. Pure: it only reads the reading and the momentum notes. */
  function lessonSteps(reading, options) {
    const opts = Object.assign({ quizEvery: 3 }, options || {});
    const r = reading || { segments: [], beats: 0, stats: {} };
    const limit = Number(opts.limit) > 0 ? Number(opts.limit) : Number(r.limit) > 0 ? Number(r.limit) : 20;
    const n = r.beats || 0;
    const segs = r.segments || [];
    const step = Number(opts.secondsPerBeat) > 0 ? Number(opts.secondsPerBeat) : 3;
    const times = beatTimes(r, Object.assign({}, opts, { secondsPerBeat: step }));
    const end = segs.length ? segs[segs.length - 1].to : n * step;
    const runs = (r.stats && r.stats.familyRuns) || (A() ? A().familyRuns(segs) : []);
    const runOf = (s) => runs.findIndex((x) => x.from <= s.from + 1e-9 && s.to <= x.to + 1e-9);
    const families = [...new Set(segs.map((s) => s.family))];
    const steps = [];
    const quizEvery = Math.max(1, Number(opts.quizEvery) || 3);
    let sinceQuiz = 0;
    let quizN = 0;
    let k = -1;
    for (let j = 0; j < n; j++) {
      while (k + 1 < segs.length && segs[k + 1].beat <= j) k++;
      const at = round1(times[j]);
      const endOfBeat = j + 1 < n ? times[j + 1] : end;
      const st = { index: j, beat: j, at, clock: clock(at), limit, quiz: null };
      if (k < 0) {
        Object.assign(st, { kind: "empty", moved: false, family: null, familyLabel: "", letter: "", curiosity: null, label: "", cue: null, cueLabel: "", quiet: false, held: 0, status: M().status(null), before: null, tryThis: "" });
        st.title = "Nothing holds attention yet";
        st.sentences = [`At ${st.clock}, nothing on screen has changed enough to take the audience's attention yet.`, "Attention needs something new: a face, a sound, a movement, a thought or a turn in the story."];
        steps.push(st);
        sinceQuiz++;
        continue;
      }
      const s = segs[k];
      const ri = runOf(s);
      const run = runs[ri] || { from: s.from, family: s.family };
      const held = round1(Math.max(0, endOfBeat - run.from));
      const note = noteOf(s.curiosity);
      const kind = s.beat !== j ? "hold" : k === 0 ? "start" : segs[k - 1].family !== s.family ? "move" : "shift";
      Object.assign(st, {
        kind,
        moved: kind !== "hold",
        family: s.family,
        familyLabel: famLabel(s.family),
        letter: mark(s.family).letter,
        curiosity: s.curiosity,
        label: s.label,
        cue: s.cue,
        cueLabel: cueLabelOf(s.cue),
        quiet: !!s.quiet,
        held,
        status: statusOf(held, limit),
        tryThis: (note && note.tryThis) || "",
        before: null,
      });
      const fam = st.familyLabel;
      const how = `${fam} has held attention for ${secs(held)} so far, against a limit of ${limit} seconds. ${STATUS_SAYS[st.status.text]}`;
      let what;
      let last;
      if (kind === "start") {
        st.title = `${s.label} takes attention first`;
        what = `At ${st.clock}, ${q_(s.label)} takes the audience's attention first, with ${cuePhrase(s.cue, s.quiet)}. That puts attention on ${fam}.`;
        last = `Nothing held attention before it, so the clock starts here. By the end of this moment it has held for ${secs(held)}, against a limit of ${limit} seconds. ${STATUS_SAYS[st.status.text]}`;
      } else if (kind === "move") {
        const prev = runs[ri - 1] || { family: segs[k - 1].family, dur: segs[k - 1].dur };
        st.before = { family: prev.family, familyLabel: famLabel(prev.family), held: round1(prev.dur), label: segs[k - 1].label };
        st.title = `${s.label} moves attention to ${fam}`;
        what = `At ${st.clock}, ${q_(s.label)} takes attention away from ${st.before.familyLabel}, with ${cuePhrase(s.cue, s.quiet)}. Attention is now on ${fam}.`;
        last = `Before that, ${st.before.familyLabel} held attention for ${secs(prev.dur)}${prev.dur > limit ? `, past the ${limit} second limit, so this move came late` : prev.dur >= limit * 0.75 ? ", which was getting long" : ""}.`;
      } else if (kind === "shift") {
        const prev = segs[k - 1];
        st.before = { family: prev.family, familyLabel: famLabel(prev.family), held: round1(prev.dur), label: prev.label };
        st.title = `${s.label} takes over, still ${fam}`;
        what = `At ${st.clock}, ${q_(s.label)} takes attention from ${q_(prev.label)}, with ${cuePhrase(s.cue, s.quiet)}. Both belong to ${fam}, so to the audience it is still the same kind of thing.`;
        last = how;
      } else {
        st.title = `Still on ${fam}`;
        what = `At ${st.clock}, nothing new takes attention, so it stays on ${q_(s.label)} (${fam}).`;
        last = how;
      }
      st.sentences = [what, last];
      if (st.tryThis) st.sentences.push(`Try this in your film: ${st.tryThis}`);
      /* A quick check every few moments: what moved it (cue), what holds it (family), or has it held too long. */
      sinceQuiz++;
      if (sinceQuiz >= quizEvery) {
        const qk = st.moved ? (quizN % 2 === 0 ? "cue" : "family") : "status";
        st.quiz = makeQuiz(qk, st, { families, quizN });
        quizN++;
        sinceQuiz = 0;
      }
      steps.push(st);
    }
    return { steps, moves: steps.filter((x) => x.kind === "move").length, seconds: round1(end - (times[0] || 0)), limit, quizzes: quizN };
  }

  function check(quiz, choiceId) {
    if (!quiz) return { right: false, text: "" };
    const right = choiceId === quiz.answer;
    const ans = quiz.choices.find((c) => c.id === quiz.answer);
    return {
      right,
      text: right ? `Right. ${quiz.explain}` : `Not quite, and that is fine: the answer is ${ans ? ans.key + ") " + ans.text : quiz.answer}. ${quiz.explain}`,
    };
  }

  /* ---------- the tab ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function loadOwn() {
    let p = null;
    try {
      p = JSON.parse(root.localStorage.getItem(KEY));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return { source: typeof p.source === "string" ? p.source : "", skip: !!p.skip, listOpen: !!p.listOpen, steps: p.steps && typeof p.steps === "object" ? p.steps : {} };
  }
  function saveOwn(o) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {}
  }
  /* The score for this session: one answer per film and moment. */
  const session = { answers: {} };
  function score() {
    const list = Object.values(session.answers);
    return { asked: list.length, right: list.filter((a) => a.right).length };
  }

  /* Where "Watch this moment" can take the Screen: the engine's film is My film (moment = row); a curated film
     can be watched when one of the Screen's inspiration viewers shows it (it follows My film proportionally). */
  function screenFilmIds() {
    const S = root.CurioScreen;
    if (!S || typeof S.state !== "function") return [];
    let list = [];
    try {
      if (root.CuriosityStudy && root.CuriosityStudy.studies) list = root.CuriosityStudy.studies();
    } catch (e) {}
    list = (list || []).filter((f) => f && Array.isArray(f.beats) && f.beats.length);
    const st = S.state() || {};
    return (st.insp || []).map((v) => (list.find((f) => f.id === v.film) || list[0] || {}).id).filter(Boolean);
  }
  function watchPlan(src, beat, nBeats) {
    const S = root.CurioScreen;
    const E = root.CurioEngine;
    if (!S || typeof S.setRow !== "function" || !E || !E.state) return null;
    const rows = (E.state().rows || []).length;
    if (src === "engine") return rows ? { row: Math.min(beat, rows - 1) } : null;
    if (!src.startsWith("study:")) return null;
    const id = src.slice(6);
    if (!screenFilmIds().includes(id)) return rows ? { missing: true } : null;
    if (rows < 1) return null;
    const beatFor = (r) => (nBeats > 1 && rows > 1 ? Math.round((r * (nBeats - 1)) / (rows - 1)) : 0);
    let best = 0;
    for (let r = 0; r < rows; r++) if (Math.abs(beatFor(r) - beat) < Math.abs(beatFor(best) - beat)) best = r;
    return { row: best, beat: beatFor(best) };
  }

  function chipHtml(st, big) {
    if (!st.family) return `<span class="mls-chip"><span class="mls-letter" style="background:${mark(null).color};color:${mark(null).ink}">?</span>Nothing yet</span>`;
    return `<span class="mls-chip${big ? " big" : ""}"><span class="mls-letter" style="background:${mark(st.family).color};color:${mark(st.family).ink}" aria-hidden="true">${esc(st.letter)}</span>${esc(st.familyLabel)}</span>`;
  }
  function baroHtml(st) {
    if (!st.family) return "";
    const pct = Math.min(100, (st.held / st.limit) * 100);
    const lim = Math.min(100, (st.limit / Math.max(st.limit, st.held)) * 100);
    return `<div class="mls-baro">
      <div class="mo-gauge" role="meter" aria-label="How long ${esc(st.familyLabel)} has held attention" aria-valuemin="0" aria-valuemax="${st.limit}" aria-valuenow="${Math.round(st.held)}"><div class="mo-gauge-fill mo-${st.status.cls}" style="width:${pct.toFixed(1)}%"></div>${st.held > st.limit ? `<div class="mo-gauge-limit" style="left:${lim.toFixed(1)}%"></div>` : ""}</div>
      <p class="mls-baro-t"><span>Held by the end of this moment: ${Math.round(st.held)} s of ${st.limit} s</span><span class="mo-status mo-${st.status.cls}">${st.status.icon} ${esc(st.status.text)}</span></p>
    </div>`;
  }

  function mountTab(el, ctx) {
    const own = loadOwn();
    const sources = ctx.sources().filter((s) => s.id !== "live");
    let src = own.source;
    if (!sources.some((s) => s.id === src)) src = (sources.find((s) => s.id.startsWith("study:")) || sources.find((s) => s.id === "engine") || sources.find((s) => s.id === "board") || sources[0] || { id: "" }).id;
    const limit = ctx.limit();
    const spb = ctx.secondsPerBeat();
    const beats = src ? ctx.beatsOf(src) : [];
    const reading = A().read(beats, { secondsPerBeat: spb, limit });
    const lesson = lessonSteps(reading, { limit, secondsPerBeat: spb, beats });
    const steps = lesson.steps;
    let cur = Math.max(0, Math.min(steps.length - 1, Number(own.steps[src]) || 0));
    let said = "";
    el.tabIndex = 0;
    el.classList.add("mls-host");

    const visible = () => steps.filter((s) => !own.skip || s.moved || s.index === cur);
    const neighbor = (dir) => {
      for (let j = cur + dir; j >= 0 && j < steps.length; j += dir) if (!own.skip || steps[j].moved) return j;
      return -1;
    };
    function go(j) {
      if (j < 0 || j >= steps.length) return;
      cur = j;
      said = "";
      own.steps[src] = cur;
      own.source = src;
      saveOwn(own);
      render();
    }
    function picker() {
      const groups = [...new Set(sources.map((x) => x.group))];
      return `<select data-ls-source aria-label="Film to learn with">${groups.map((g) => `<optgroup label="${esc(g)}">${sources.filter((x) => x.group === g).map((x) => `<option value="${esc(x.id)}"${x.id === src ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</optgroup>`).join("")}</select>`;
    }
    function quizHtml(st) {
      const q = st.quiz;
      if (!q) return "";
      const a = session.answers[src + "|" + st.beat];
      const res = a ? check(q, a.choice) : null;
      return `<fieldset class="mls-quiz"><legend>Quick check: ${esc(q.question)}</legend>
        <div class="mls-choices">${q.choices
          .map((c) => {
            const mark = a ? (c.id === q.answer ? " right" : c.id === a.choice ? " wrong" : "") : "";
            return `<button type="button" data-ls-answer="${esc(c.id)}" class="mls-choice${mark}"${a ? ' aria-disabled="true"' : ""}>${c.key}) ${esc(c.text)}${a && c.id === q.answer ? " ✓" : a && c.id === a.choice ? " ✗" : ""}</button>`;
          })
          .join("")}</div>
        ${res ? `<p class="mls-said ${res.right ? "right" : "wrong"}" role="status">${esc(res.text)}</p>` : ""}</fieldset>`;
    }
    function render() {
      const focusedAct = el.contains(document.activeElement) && document.activeElement !== el ? (document.activeElement.dataset || {}).ls || null : document.activeElement === el ? "@host" : null;
      const sc = score();
      if (!steps.length) {
        el.innerHTML = `<div class="mls"><p class="mls-lede">${lede()}</p><div class="mo-controls"><label>Film ${picker()}</label></div><p class="mo-empty">This film has no moments to learn from yet. Pick a curated film above, or add moments to My film.</p></div>`;
        return wire();
      }
      const st = steps[cur];
      const back = neighbor(-1);
      const next = neighbor(1);
      const plan = watchPlan(src, st.beat, steps.length);
      const watch = plan && plan.missing ? `<p class="mo-small">To watch this moment, choose this film in one of the Screen's inspiration viewers.</p>` : plan ? `<button type="button" data-ls="watch" title="Close this window and move the Screen's playhead to this moment">Watch this moment</button>` : "";
      const list = visible()
        .map((s) => `<li><button type="button" data-ls-go="${s.index}"${s.index === cur ? ' aria-current="step"' : ""} class="${s.moved ? "moved" : "hold"}"><span class="mls-time">${s.clock}</span>${s.family ? `<span class="mls-letter" style="background:${mark(s.family).color};color:${mark(s.family).ink}" aria-hidden="true">${esc(s.letter)}</span>` : ""}<span class="mls-li-t">${esc(s.title)}</span>${s.status.cls !== "good" ? `<span class="mo-status mo-${s.status.cls}" title="${esc(s.status.text)}">${s.status.icon}</span>` : ""}${s.quiz ? '<span class="mls-q" title="Quick check">?</span>' : ""}</button></li>`)
        .join("");
      el.innerHTML = `<div class="mls">
        <p class="mls-lede">${lede()}</p>
        <div class="mo-controls">
          <label>Film ${picker()}</label>
          <label class="mls-skip"><span><input type="checkbox" data-ls-skip${own.skip ? " checked" : ""}> Skip the quiet holds</span></label>
          <p class="mls-score" aria-live="polite">${sc.asked ? `Quick checks: <b>${sc.right} of ${sc.asked}</b> right` : "Quick checks: none answered yet"}</p>
        </div>
        <article class="mls-card mo-${st.status.cls}" aria-labelledby="mls-title">
          <header class="mls-top"><span class="mls-pos">Moment ${cur + 1} of ${steps.length} · ${st.clock}</span>${chipHtml(st, true)}</header>
          <h3 id="mls-title" class="mls-title">${esc(st.title)}</h3>
          ${baroHtml(st)}
          <div class="mls-text">${st.sentences.map((t, i) => (i === 2 && st.tryThis ? `<p class="mls-try"><b>Try this in your film:</b> ${esc(st.tryThis)}</p>` : `<p>${esc(t)}</p>`)).join("")}</div>
          ${quizHtml(st)}
          ${said ? `<p class="mo-flash" role="status">${esc(said)}</p>` : ""}
          <div class="mls-nav">
            <button type="button" data-ls="back"${back < 0 ? " disabled" : ""}>← Back</button>
            <button type="button" data-ls="next" class="mls-next"${next < 0 ? " disabled" : ""}>Next →</button>
            ${watch}
          </div>
          <p class="mo-small">Tip: the left and right arrow keys step too, while this tab has focus.</p>
        </article>
        <details class="mls-list"${own.listOpen ? " open" : ""}><summary>Every moment (${own.skip ? lesson.moves + " where attention moved to a new kind of curiosity, plus the first" : steps.length})</summary><ol>${list}</ol></details>
        <p class="mo-small">The limit is ${limit} seconds and an untimed moment lasts ${spb} seconds (both set on the Attention tab). Under three quarters of the limit is ● Fresh, up to the limit is ▲ Getting long, past it is ■ Too long.</p>
      </div>`;
      wire();
      /* Keep focus where it was, so stepping with the keyboard does not lose your place. */
      if (focusedAct === "@host") el.focus({ preventScroll: true });
      else if (focusedAct) {
        const b = el.querySelector(`[data-ls="${focusedAct}"]:not([disabled])`) || el.querySelector('[data-ls="next"]:not([disabled])') || el.querySelector('[data-ls="back"]:not([disabled])');
        if (b) b.focus({ preventScroll: true });
        else el.focus({ preventScroll: true });
      }
    }
    function lede() {
      return "Learn momentum one moment at a time. The audience can only pay attention to one thing at a time; when what holds it keeps moving to different kinds of things, the film feels like it is going somewhere. Step through a film with Back and Next to see what holds attention, how long it has held, and one thing to try in your own film.";
    }
    function wire() {
      const pick = el.querySelector("[data-ls-source]");
      if (pick)
        pick.addEventListener("change", () => {
          own.source = pick.value;
          saveOwn(own);
          ctx.refresh();
        });
      const skip = el.querySelector("[data-ls-skip]");
      if (skip)
        skip.addEventListener("change", () => {
          own.skip = skip.checked;
          saveOwn(own);
          render();
        });
      const det = el.querySelector(".mls-list");
      if (det)
        det.addEventListener("toggle", () => {
          if (own.listOpen === det.open) return;
          own.listOpen = det.open;
          saveOwn(own);
        });
    }
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !el.contains(b) || b.disabled) return;
      if (b.dataset.ls === "back") go(neighbor(-1));
      else if (b.dataset.ls === "next") go(neighbor(1));
      else if (b.dataset.lsGo != null) go(Number(b.dataset.lsGo));
      else if (b.dataset.lsAnswer != null) {
        const st = steps[cur];
        const k = src + "|" + st.beat;
        if (!st.quiz || session.answers[k]) return;
        session.answers[k] = { choice: b.dataset.lsAnswer, right: b.dataset.lsAnswer === st.quiz.answer };
        render();
        const r = el.querySelector(".mls-said");
        if (r) r.scrollIntoView({ block: "nearest" });
      } else if (b.dataset.ls === "watch") {
        const plan = watchPlan(src, steps[cur].beat, steps.length);
        const S = root.CurioScreen;
        if (!plan || plan.missing || !S) return;
        if (root.CurioMomentumUI && root.CurioMomentumUI.close) root.CurioMomentumUI.close();
        if (typeof S.isOpen === "function" && !S.isOpen() && typeof S.open === "function") S.open();
        S.setRow(plan.row);
      }
    });
    el.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      e.stopPropagation();
      go(neighbor(e.key === "ArrowRight" ? 1 : -1));
    });
    render();
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "lesson", label: "Learn it", mount: mountTab });
  }

  const api = { lessonSteps, check, statusOf, CUE_WORDS, KEY, addTab, watchPlan };
  root.CurioLesson = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
