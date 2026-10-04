/* momentum/comedy-timing.js: comedy rhythm (Jeremy: comedy is central to the app). Reads any film through the
   attention model and finds its comedy beats: the setups, the payoffs, the toppers, the cutaways, the callbacks,
   and every stretch where comedy holds the audience's attention. Then it measures:

   - jokes per minute (a joke is a laugh moment: a payoff, a topper, a cutaway, a callback, or attention moving to
     a comedy curiosity with no setup marked);
   - the gap from each setup to its payoff (a payoff pays off the most recent setup still waiting);
   - the beat before the punchline: whether a pause comes right before a payoff (a written "Pause before the
     punchline", a quiet cue such as music cutting out, or a moment where nothing changes);
   - how long the laugh is allowed to land before attention moves to something that is not comedy;
   - callbacks: a payoff that returns to an earlier joke (marked as a callback or running gag, or the same comedy
     curiosity coming back after a while).

   The comedy markers come from the curiosity database: "Setup and payoff" (comicBeat: setup planted, building,
   payoff lands), "Kind of joke" (comedyDevice: callback, running gag), Callback, Running gag, The topper,
   Cutaway gag, "Oddly specific" (an oddly specific detail is a setup for a later callback), and "Pause before
   the punchline" (comicTiming), plus any curiosity whose id or label names a setup, payoff, callback, topper or
   cutaway.

   COMEDY_FILMS are Claude's ESTIMATES of the comedy rhythm of the comedy films in the default list (Paddington 2,
   Hot Fuzz, The Grand Budapest Hotel), from general film knowledge, not measurements. They live here, never in
   rates.js. Any film you pick can be measured with profile().

   window.CurioComedyTiming (part of the momentum screens; the core works in Node with no page)
   - timing(beats, opts) -> { jokes: [{ setupAt, payoffAt, gap, pauseBefore, landing, callback, kind, label,
       curiosity, at, beat, row }], setups, perMinute, everySeconds, medianGap, pauseShare, medianLanding,
       callbacks, unpaid: [{ at, label, curiosity, beat, row }], seconds, suggestions, sentences }
       beats: the same beats CurioAttention.read takes ([{ at, values, row? }]).
       opts: { secondsPerBeat: 3, end, compare: [profile] (default COMEDY_FILMS), title }
   - profile(result, { id, title }) -> a measured comedy profile, comparable with COMEDY_FILMS
   - pauseMove(joke) -> { commands, track, value } | null: on the engine's film, a pause written before that
       payoff (one notch more "Pause before the punchline" at its moment); applyPause(joke) sends it as one batch.
   - COMEDY_FILMS, clock(seconds) */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const E = () => root.CurioEngine;

  /* Claude's estimates, not measured. secondsPerJoke: one laugh moment every this many seconds. medianGap: the
     usual seconds from a setup to its payoff. longestGap: the longest wait. pauseShare: share of payoffs with a
     beat before them. landing: usual seconds a laugh gets before attention moves on. callbackShare: share of
     jokes that return to an earlier one. */
  const P = (id, title, year, secondsPerJoke, medianGap, longestGap, pauseShare, landing, callbackShare, why) => ({
    id, title, year, estimate: true, source: "Claude's estimate from general film knowledge, not measured",
    secondsPerJoke, perMinute: Math.round((60 / secondsPerJoke) * 10) / 10, medianGap, longestGap, pauseShare, landing, callbackShare, why,
  });
  const COMEDY_FILMS = [
    P("paddington-2", "Paddington 2", 2017, 30, 90, 5400, 0.6, 2.5, 0.15,
      "Gentle gags with room to land; small things planted early (the barber shop, the window cleaning) pay off much later."),
    P("hot-fuzz", "Hot Fuzz", 2007, 15, 45, 4800, 0.3, 1, 0.25,
      "Fast cuts on small actions, and nearly every early detail comes back as a payoff an hour later."),
    P("grand-budapest", "The Grand Budapest Hotel", 2014, 20, 30, 3600, 0.55, 1.5, 0.1,
      "Deadpan: a held, still frame before the punchline, then a quick move on to the next joke."),
  ];

  const SETUP_RE = /set ?up|planted|\bplant/i;
  const PAYOFF_RE = /pay ?off|punch ?line|lands\b/i;
  const CALLBACK_RE = /call ?back|running ?gag/i;
  const TOPPER_RE = /topper/i;
  const CUTAWAY_RE = /cut ?away/i;
  const QUIET_RE = /^(none|no |no$|off|silence|silent|still|nothing|empty|stopped|never|0$)/i;
  /* Measures and settings, not moments: they describe the comedy but never mark a joke on their own. */
  const NOT_EVENTS = new Set(["comicTiming", "payoffDistance", "laughsPerMinute"]);
  /* Comedy curiosities too general to be a callback just by coming back (every payoff is "payoff lands"). */
  const GENERIC = new Set(["comicBeat", "comedyDevice", "comicTiming", "payoffDistance", "laughsPerMinute", "comicReaction", "comicRegister", "comedyTopic"]);
  /* Reactions and laughs in the room are the laugh landing, not a new joke. */
  const REACTIONS = new Set(["comicReaction", "mixLaughs"]);
  const CALLBACK_MIN = 30;
  const DEFAULTS = { secondsPerBeat: 3 };

  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  function clock(s) {
    s = Math.max(0, Math.round(s));
    const m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  }
  function median(list) {
    if (!list.length) return null;
    const s = list.slice().sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function seconds(at) {
    if (typeof at === "number" && isFinite(at)) return at;
    if (typeof at !== "string") return null;
    const t = at.trim();
    if (!/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null;
    return t.split(":").reduce((s, p) => s * 60 + Number(p), 0);
  }
  const headOf = (id) => String(id).split("@")[0].split(".")[0];
  const sliderOf = (id) => String(id).split("@")[0].split(".")[1] || null;
  const trackOf = (id) => (String(id).includes("@") ? String(id).split("@")[1] : null);
  function labelOf(id) {
    const n = M() && M().note ? M().note(headOf(id)) : null;
    return (n && n.label) || headOf(id);
  }
  function familyOf(id) {
    const n = M() && M().note ? M().note(headOf(id)) : null;
    return n ? n.family : null;
  }
  function isQuiet(v) {
    if (v === 0 || v === "0" || v === false) return true;
    return typeof v === "string" && QUIET_RE.test(v.trim());
  }
  const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && isFinite(Number(v)) ? Number(v) : null);

  /* What one changed value marks: setup, payoff, callback, topper, cutaway, building, or nothing. */
  function markerOf(id, value, before) {
    const head = headOf(id);
    const slider = sliderOf(id);
    if (NOT_EVENTS.has(head)) return null;
    if (value == null || value === "" || isQuiet(value)) return null;
    const text = typeof value === "string" ? value : "";
    const n = num(value);
    const b = num(before);
    const rising = n != null ? n > (b == null ? 0 : b) : true;
    /* Outside the comedy family only plain words count ("setup planted", a "Payoff" row), so a row such as
       setUpkeep (how well a place is kept) is never read as a setup. */
    const comedy = familyOf(id) === "comedy";
    /* The value says it first: "setup planted", "payoff lands", "callback", "running gag", "building". */
    if (text) {
      if (!comedy) {
        if (/^setup planted$/i.test(text)) return "setup";
        if (/^payoff lands$/i.test(text)) return "payoff";
      } else {
        if (/^building$/i.test(text)) return "building";
        if (CALLBACK_RE.test(text) && !slider) return "callback";
        if (PAYOFF_RE.test(text)) return "payoff";
        if (SETUP_RE.test(text)) return "setup";
        if (head === "specificity" && /oddly|absurdly/.test(text)) return "setup";
        if (head === "callback" && slider === "form") return "callback";
      }
    }
    /* Then the curiosity's own name. A slider of a comedy row (how dark, mean or kind) is a setting, not a moment. */
    if (slider && !/^(count|setting|level|size|length)$/.test(slider)) return null;
    const name = comedy ? head + " " + labelOf(id) : /\b(setups?|payoffs?|callbacks?|toppers?|cutaways?)\b/i.test(labelOf(id)) ? labelOf(id) : "";
    if (!name || !rising) return null;
    if (CALLBACK_RE.test(name)) return "callback";
    if (TOPPER_RE.test(name)) return "topper";
    if (CUTAWAY_RE.test(name)) return "cutaway";
    const s = SETUP_RE.test(name);
    const p = PAYOFF_RE.test(name);
    if (s && !p) return "setup";
    if (p && !s) return "payoff";
    return null;
  }
  const RANK = { payoff: 5, callback: 4, topper: 3, cutaway: 2, joke: 1 };
  const KIND_WORDS = { payoff: "a payoff", callback: "a callback", topper: "a topper (a joke on top of a joke)", cutaway: "a cutaway gag", joke: "a joke" };

  function timing(beats, options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    const step = Number(opts.secondsPerBeat) > 0 ? Number(opts.secondsPerBeat) : DEFAULTS.secondsPerBeat;
    const list = (beats || []).filter((b) => b && b.values && typeof b.values === "object");
    let t = 0;
    const times = list.map((b, i) => {
      const s = seconds(b.at);
      t = s != null && s >= t ? s : i === 0 ? 0 : t + step;
      return t;
    });
    const start = times.length ? times[0] : 0;
    const end = list.length ? times[times.length - 1] + (opts.end != null ? Number(opts.end) : step) : 0;
    const total = Math.max(0, end - start);
    const reading = A() ? A().read(list, { secondsPerBeat: step, end: opts.end, limit: opts.limit }) : { segments: [] };
    const segAt = {};
    reading.segments.forEach((s) => (segAt[s.beat] = s));

    /* 1. Walk the film: what changed at each beat, and what it marks. */
    const known = {};
    const info = list.map((b, i) => {
      const changes = [];
      const marks = [];
      let pause = 0;
      Object.keys(b.values).forEach((id) => {
        const v = b.values[id];
        if (v == null || v === "") return;
        const was = known[id];
        known[id] = v;
        if (headOf(id) === "comicTiming" && !sliderOf(id) && num(v) > 0) pause = Math.max(pause, num(v));
        if (was !== undefined && String(was) === String(v)) return;
        changes.push({ id, v, quiet: isQuiet(v) });
        const k = markerOf(id, v, was);
        if (k) marks.push({ kind: k, id, v });
      });
      return { i, at: times[i], changes, marks, pause, row: b.row != null ? b.row : null, seg: segAt[i] || null };
    });

    /* 2. Jokes and setups, in order. */
    const setups = [];
    const open = [];
    const jokes = [];
    info.forEach((x) => {
      x.marks.filter((m) => m.kind === "setup").forEach((m) => {
        const s = { at: x.at, label: labelOf(m.id), curiosity: headOf(m.id), key: m.id, beat: x.i, row: x.row, paid: false };
        setups.push(s);
        open.push(s);
      });
      const laughs = x.marks.filter((m) => m.kind !== "setup" && m.kind !== "building");
      let kind = null;
      let mark = null;
      laughs.forEach((m) => {
        if (!kind || RANK[m.kind] > RANK[kind]) {
          kind = m.kind;
          mark = m;
        }
      });
      /* Attention moving to a comedy curiosity is a laugh moment too, unless this beat only plants a setup. */
      if (!kind && x.seg && x.seg.family === "comedy" && !x.marks.length && !NOT_EVENTS.has(x.seg.curiosity) && !REACTIONS.has(x.seg.curiosity) && !x.seg.quiet) {
        kind = "joke";
        mark = { id: x.seg.curiosity, v: null };
      }
      if (!kind) return;
      const isCallback = laughs.some((m) => m.kind === "callback");
      const joke = { at: x.at, payoffAt: x.at, setupAt: null, gap: null, kind, label: labelOf(mark.id), curiosity: headOf(mark.id), key: mark.id, beat: x.i, row: x.row, pauseBefore: null, landing: 0, callback: null, explicitCallback: isCallback };
      /* A payoff (or a callback) pays off the most recent setup still waiting. */
      if ((kind === "payoff" || kind === "callback") && open.length) {
        const s = open.pop();
        s.paid = true;
        joke.setupAt = s.at;
        joke.gap = round(x.at - s.at, 1);
        joke.setup = { label: s.label, curiosity: s.curiosity, beat: s.beat };
      }
      jokes.push(joke);
    });

    /* 3. The beat before the punchline, the landing, and callbacks. */
    jokes.forEach((j, k) => {
      const x = info[j.beat];
      const prev = info[j.beat - 1];
      if (x.pause > 0) j.pauseBefore = { kind: "timing", seconds: null, text: `a written pause of ${x.pause} beat${x.pause === 1 ? "" : "s"} before the punchline` };
      else if (prev && prev.changes.length && prev.changes.every((c) => c.quiet)) {
        const q = prev.changes[0];
        j.pauseBefore = { kind: "quiet", seconds: round(j.at - prev.at, 1), text: `a quiet cue just before it (${labelOf(q.id)} went to ${q.v})` };
      } else if (prev && !prev.changes.length && j.beat > 1) j.pauseBefore = { kind: "still", seconds: round(j.at - prev.at, 1), text: `a still moment just before it, where nothing changes for ${round(j.at - prev.at, 1)} seconds` };
      /* The laugh lands until attention moves to something that is not comedy, or the next joke or setup. */
      let until = end;
      for (let i = j.beat + 1; i < info.length; i++) {
        const y = info[i];
        if (y.marks.some((m) => m.kind !== "building") || (y.seg && y.seg.family !== "comedy")) {
          until = y.at;
          break;
        }
        if (jokes[k + 1] && jokes[k + 1].beat === i) {
          until = y.at;
          break;
        }
      }
      j.landing = round(Math.max(0, until - j.at), 1);
      /* Callbacks: marked as one, or the same particular comedy curiosity coming back after a while. */
      const earlier = jokes.slice(0, k);
      const same = earlier.filter((e) => e.curiosity === j.curiosity && !GENERIC.has(j.curiosity) && j.at - e.at >= CALLBACK_MIN);
      const between = (e) => jokes.indexOf(e) < k - 1;
      const back = same.find(between);
      if (back) j.callback = { to: jokes.indexOf(back), at: back.at, label: back.label, gap: round(j.at - back.at, 1), guess: false };
      else if (j.explicitCallback && earlier.length) {
        const to = earlier.find((e) => j.at - e.at >= CALLBACK_MIN) || earlier[0];
        j.callback = { to: jokes.indexOf(to), at: to.at, label: to.label, gap: round(j.at - to.at, 1), guess: true };
      } else if (j.explicitCallback) j.callback = { to: null, at: null, label: null, gap: null, guess: true };
      delete j.explicitCallback;
    });

    const unpaid = setups.filter((s) => !s.paid).map((s) => ({ at: s.at, label: s.label, curiosity: s.curiosity, beat: s.beat, row: s.row }));
    const payoffs = jokes.filter((j) => j.kind === "payoff" || j.setupAt != null);
    const gaps = jokes.filter((j) => j.gap != null).map((j) => j.gap);
    const res = {
      jokes,
      setups: setups.map((s) => ({ at: s.at, label: s.label, curiosity: s.curiosity, beat: s.beat, row: s.row, paid: s.paid })),
      unpaid,
      seconds: round(total, 1),
      perMinute: total > 0 ? round((jokes.length / total) * 60, 1) : 0,
      everySeconds: jokes.length ? round(total / jokes.length, 1) : null,
      medianGap: gaps.length ? round(median(gaps), 1) : null,
      longestGap: gaps.length ? Math.max(...gaps) : null,
      payoffs: payoffs.length,
      pauseShare: payoffs.length ? round(payoffs.filter((j) => j.pauseBefore).length / payoffs.length, 2) : null,
      medianLanding: jokes.length ? round(median(jokes.map((j) => j.landing)), 1) : null,
      callbacks: jokes.filter((j) => j.callback).length,
      callbackShare: jokes.length ? round(jokes.filter((j) => j.callback).length / jokes.length, 2) : null,
      beats: list.length,
      comedyStretches: reading.segments.filter((g) => g.family === "comedy").map((g) => ({ from: g.from, to: g.to, label: g.label })),
    };
    res.suggestions = suggest(res);
    const near = nearest(res, opts.compare || COMEDY_FILMS);
    res.closest = near ? near.id : null;
    res.sentences = sentences(res, opts.compare || COMEDY_FILMS, opts.title);
    return res;
  }

  /* ---------- plain words ---------- */
  const secs = (s) => {
    if (s == null) return "";
    if (s >= 120) return `${round(s / 60, 1)} minutes`;
    const n = s < 10 ? round(s, 1) : round(s);
    return `${n} second${n === 1 ? "" : "s"}`;
  };
  function suggest(r) {
    const out = [];
    r.jokes.forEach((j, k) => {
      if ((j.kind === "payoff" || j.setupAt != null) && !j.pauseBefore)
        out.push({ kind: "pause", joke: k, at: j.at, row: j.row, text: `Add a pause before the payoff at ${clock(j.at)} (${j.label}). One still moment, or something going quiet, lets the audience lean in before the laugh.` });
      if (j.landing < 1 && k < r.jokes.length - 1)
        out.push({ kind: "land", joke: k, at: j.at, row: j.row, text: `The laugh at ${clock(j.at)} gets ${j.landing ? "under a second" : "no time"} before attention moves on. Hold on a reaction for a moment so it can land.` });
    });
    r.unpaid.forEach((s) => out.push({ kind: "unpaid", at: s.at, row: s.row, text: `The setup at ${clock(s.at)} (${s.label}) never pays off. Pay it off later, or cut it.` }));
    if (r.jokes.length >= 3 && !r.callbacks) {
      const first = r.jokes[0];
      out.push({ kind: "callback", at: first.at, text: `Nothing comes back as a callback. Bring back the joke from ${clock(first.at)} (${first.label}) near the end, a little changed.` });
    }
    return out;
  }
  /* The comedy whose joke rhythm is nearest to this film's. */
  function nearest(r, compare) {
    const films = (compare || []).filter((p) => p && p.secondsPerJoke);
    if (r.everySeconds == null || !films.length) return films[0] || null;
    return films.slice().sort((x, y) => Math.abs(x.secondsPerJoke - r.everySeconds) - Math.abs(y.secondsPerJoke - r.everySeconds))[0];
  }
  function sentences(r, compare, title) {
    const you = title ? title : "Your film";
    const yours = title ? "Its" : "Your";
    const out = [];
    if (!r.jokes.length && !r.setups.length) {
      out.push(`${you} has no jokes yet. Mark a moment with "Setup and payoff" (setup planted, then payoff lands later), a Topper, a Cutaway gag or a Callback, and the rhythm shows here.`);
      return out;
    }
    const films = (compare || []).filter((p) => p && p.secondsPerJoke);
    const est = (p) => (p.estimate ? "is estimated at about" : "was measured at");
    /* The comedy whose joke rhythm is nearest to this film's is the one the other sentences compare with. */
    const near = nearest(r, films);
    if (r.jokes.length) {
      const one = films.length ? `; ${films.map((p) => `${p.title} ${est(p)} one every ${round(p.secondsPerJoke)}`).join(", ")}` : "";
      out.push(`${yours} jokes come every ${round(r.everySeconds)} seconds (${r.perMinute} a minute)${one}.`);
      if (near) out.push(`That rhythm is closest to ${near.title}, so the rest compares with it.`);
    } else out.push(`${you} plants ${r.setups.length} setup${r.setups.length === 1 ? "" : "s"} but no joke lands yet.`);
    const p = near;
    if (r.medianGap != null) out.push(`A setup usually pays off ${secs(r.medianGap)} later${r.longestGap > r.medianGap ? `, and the longest wait is ${secs(r.longestGap)}` : ""}${p && p.medianGap != null ? `. ${p.title} ${est(p)} ${secs(p.medianGap)}${p.longestGap ? `, with its longest setups waiting ${secs(p.longestGap)}` : ""}` : ""}.`);
    if (r.payoffs) {
      const n = r.jokes.filter((j) => (j.kind === "payoff" || j.setupAt != null) && j.pauseBefore).length;
      out.push(`${n} of ${r.payoffs} payoff${r.payoffs === 1 ? " has" : "s have"} a pause before the punchline (a written pause, a quiet cue, or a still moment)${p && p.pauseShare != null ? `; ${p.title} ${est(p)} ${Math.round(p.pauseShare * 100)} in 100` : ""}.`);
    }
    if (r.jokes.length) {
      out.push(`A laugh usually gets ${secs(r.medianLanding)} to land before attention moves on${p && p.landing != null ? `; ${p.title} ${est(p)} ${secs(p.landing)}` : ""}.`);
      out.push(r.callbacks ? `${r.callbacks} joke${r.callbacks === 1 ? " is a callback" : "s are callbacks"} to an earlier one.` : "No joke comes back as a callback yet.");
    }
    if (r.unpaid.length) out.push(`${r.unpaid.length} setup${r.unpaid.length === 1 ? " never pays" : "s never pay"} off.`);
    return out;
  }

  /* A measured comedy profile, comparable with COMEDY_FILMS. */
  function profile(r, info) {
    const i = info || {};
    return {
      id: i.id || "measured-comedy",
      title: i.title || "Measured film",
      estimate: false,
      source: "Measured from the film's jokes",
      secondsPerJoke: r.everySeconds,
      perMinute: r.perMinute,
      medianGap: r.medianGap,
      longestGap: r.longestGap,
      pauseShare: r.pauseShare,
      landing: r.medianLanding,
      callbackShare: r.callbackShare,
      jokes: r.jokes.length,
    };
  }

  /* ---------- on the engine: a pause before a payoff ---------- */
  function pauseMove(joke) {
    const S = root.CurioScale;
    if (!joke || joke.row == null || !E() || !E().state || !S || !S.known("comicTiming")) return null;
    const st = E().state();
    if (!st.rows.some((r) => r.id === joke.row)) return null;
    const want = trackOf(joke.key);
    const track = st.tracks.find((t) => t.id === want) || st.tracks.find((t) => t.curiosities.includes("comicTiming")) || st.tracks.find((t) => t.kind === "master") || st.tracks[0];
    if (!track) return null;
    const commands = [];
    let was = null;
    if (!track.curiosities.includes("comicTiming")) commands.push({ type: "addCuriosity", track: track.id, curiosity: "comicTiming" });
    else was = E().value(joke.row, track.id, "comicTiming");
    const base = was != null && was !== "" ? was : S.domain("comicTiming").kind === "range" ? S.domain("comicTiming").min : S.start("comicTiming");
    let value = S.step("comicTiming", base, 1);
    if (value == null || String(value) === String(was)) return null;
    commands.push({ type: "setPoint", row: joke.row, track: track.id, curiosity: "comicTiming", value });
    return { commands, track: track.id, row: joke.row, value, label: `Comedy timing: a pause before the payoff at ${clock(joke.at)}` };
  }
  function applyPause(joke) {
    const mv = pauseMove(joke);
    if (!mv) return { ok: false, error: "There is no moment on the engine for that payoff." };
    return E().send({ type: "batch", label: mv.label, commands: mv.commands });
  }

  const api = { timing, profile, pauseMove, applyPause, markerOf, COMEDY_FILMS, clock };
  root.CurioComedyTiming = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab (only on a page, inside the Momentum window) ---------- */
  if (typeof document === "undefined") return;
  const KEY = "curiosities-momentum-comedy-v1";
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  function loadPrefs() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return { measured: Array.isArray(p.measured) ? p.measured.filter((x) => x && x.id) : [], other: p.other || "" };
  }
  const prefs = loadPrefs();
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {}
  }
  let flash = "";

  function pickSource(ctx) {
    const list = ctx.sources();
    const cur = ctx.source();
    if (cur && list.some((s) => s.id === cur)) return cur;
    const any = list.find((s) => s.id.startsWith("study:")) || list[0];
    return any ? any.id : "";
  }
  function readOf(ctx, id, title) {
    const beats = ctx.beatsOf(id);
    return timing(beats, { secondsPerBeat: ctx.secondsPerBeat(), compare: COMEDY_FILMS.concat(prefs.measured), title });
  }

  /* The strip: the film left to right, a marker per setup (S, hollow circle), payoff (P, filled circle), other
     joke (J, small square), callback (C, diamond), an arc over the top from each setup to its payoff, and a
     dashed arc under the line from a callback back to the joke it returns to. */
  function stripSvg(r, width) {
    const W = Math.max(280, Math.round(width));
    const pad = 14;
    const H = 150;
    const base = 92;
    const total = r.seconds || 1;
    const x = (t) => pad + (Math.max(0, Math.min(total, t)) / total) * (W - pad * 2);
    const parts = [];
    parts.push(`<line x1="${pad}" x2="${W - pad}" y1="${base}" y2="${base}" class="ct-axis"></line>`);
    /* Comedy holding attention: a light band on the line. */
    (r.comedyStretches || []).forEach((g) => parts.push(`<rect x="${x(g.from)}" y="${base - 4}" width="${Math.max(1, x(g.to) - x(g.from))}" height="8" class="ct-band"><title>Comedy holds attention from ${clock(g.from)} to ${clock(g.to)} (${esc(g.label)})</title></rect>`));
    const minute = [10, 30, 60, 120, 300, 600, 1200].find((m) => total / m <= 8) || 1800;
    for (let t = 0; t <= total + 0.01; t += minute) parts.push(`<line x1="${x(t)}" x2="${x(t)}" y1="${base - 3}" y2="${base + 3}" class="ct-axis"></line><text x="${x(t)}" y="${base + 16}" class="ct-tick" text-anchor="middle">${clock(t)}</text>`);
    r.jokes.forEach((j) => {
      if (j.setupAt == null) return;
      const a = x(j.setupAt);
      const b = x(j.payoffAt);
      const h = Math.min(base - 12, 18 + Math.abs(b - a) * 0.35);
      parts.push(`<path d="M${a} ${base - 8} Q${(a + b) / 2} ${base - 8 - h * 2} ${b} ${base - 8}" class="ct-arc"><title>Setup at ${clock(j.setupAt)}, payoff at ${clock(j.payoffAt)}: ${j.gap} seconds</title></path>`);
    });
    r.jokes.forEach((j) => {
      if (!j.callback || j.callback.at == null) return;
      const a = x(j.callback.at);
      const b = x(j.at);
      const h = Math.min(40, 12 + Math.abs(b - a) * 0.2);
      parts.push(`<path d="M${a} ${base + 8} Q${(a + b) / 2} ${base + 8 + h} ${b} ${base + 8}" class="ct-arc ct-arc-cb"><title>Callback at ${clock(j.at)} to the joke at ${clock(j.callback.at)}${j.callback.guess ? " (probably)" : ""}</title></path>`);
    });
    r.unpaid.forEach((s) => {
      const a = x(s.at);
      parts.push(`<path d="M${a} ${base - 8} q 12 -30 34 -30" class="ct-arc ct-arc-open"><title>Setup at ${clock(s.at)} never pays off</title></path><text x="${Math.min(W - pad, a + 38)}" y="${base - 34}" class="ct-q">?</text>`);
    });
    const mark = (cx, kind, title) => {
      let shape;
      if (kind === "S") shape = `<circle cx="${cx}" cy="${base}" r="7" class="ct-m ct-s"></circle>`;
      else if (kind === "C") shape = `<path d="M${cx} ${base - 8} l8 8 l-8 8 l-8 -8 z" class="ct-m ct-c"></path>`;
      else if (kind === "J") shape = `<rect x="${cx - 5}" y="${base - 5}" width="10" height="10" class="ct-m ct-j"></rect>`;
      else shape = `<circle cx="${cx}" cy="${base}" r="7" class="ct-m ct-p"></circle>`;
      return `<g class="ct-mark">${shape}<text x="${cx}" y="${base - 12}" text-anchor="middle" class="ct-letter">${kind}</text><title>${esc(title)}</title></g>`;
    };
    r.setups.forEach((s) => parts.push(mark(x(s.at), "S", `Setup at ${clock(s.at)}: ${s.label}${s.paid ? "" : " (never pays off)"}`)));
    r.jokes.forEach((j) => {
      const k = j.callback ? "C" : j.kind === "payoff" || j.setupAt != null ? "P" : "J";
      parts.push(mark(x(j.at), k, `${clock(j.at)}: ${KIND_WORDS[j.kind]} (${j.label})${j.pauseBefore ? ", with a pause before it" : ""}, lands for ${j.landing} seconds`));
    });
    return `<svg class="ct-strip" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="The film's jokes: setups, payoffs and callbacks, with an arc from each setup to its payoff">${parts.join("")}</svg>`;
  }

  function tiles(r, cmp) {
    const t = (label, value, sub) => `<div class="mo-tile"><div class="mo-tile-v">${value}</div><div class="mo-tile-l">${label}</div>${sub ? `<div class="mo-tile-s">${sub}</div>` : ""}</div>`;
    const dash = "none yet";
    const them = (k, fmt) => (cmp && cmp[k] != null ? `${esc(cmp.title)}: ${cmp.estimate ? "about " : ""}${fmt(cmp[k])}` : "");
    return `<div class="mo-tiles">
      ${t("Jokes a minute", r.perMinute, them("perMinute", (v) => v))}
      ${t("Setup to payoff", r.medianGap != null ? secs(r.medianGap) : dash, them("medianGap", secs))}
      ${t("Pause before the punchline", r.pauseShare != null ? `${Math.round(r.pauseShare * 100)} <small>in 100 payoffs</small>` : dash, them("pauseShare", (v) => `${Math.round(v * 100)} in 100`))}
      ${t("Time to land", r.medianLanding != null ? secs(r.medianLanding) : dash, them("landing", secs))}
      ${t("Callbacks", r.callbacks, r.unpaid.length ? `${r.unpaid.length} setup${r.unpaid.length === 1 ? "" : "s"} never pay${r.unpaid.length === 1 ? "s" : ""} off` : "")}
    </div>`;
  }

  function compareTable(r, ctx) {
    const pct = (x) => (x == null ? "" : Math.round(x * 100) + " in 100");
    const row = (p, badge, extra) => `<tr><td>${esc(p.title)}${p.year ? ` <small>${p.year}</small>` : ""}</td><td>${badge}</td><td>${p.secondsPerJoke != null ? `every ${round(p.secondsPerJoke)} s` : "no jokes"}</td><td>${p.medianGap != null ? secs(p.medianGap) : ""}</td><td>${pct(p.pauseShare)}</td><td>${p.landing != null ? secs(p.landing) : ""}</td><td>${pct(p.callbackShare)}</td><td class="mo-why">${esc(p.why || "")}${extra || ""}</td></tr>`;
    const mine = profile(r, { title: "This film" });
    const others = ctx
      .sources()
      .filter((s) => s.id !== "live")
      .map((s) => `<option value="${esc(s.id)}"${s.id === prefs.other ? " selected" : ""}>${esc(s.label)}</option>`)
      .join("");
    return `<div class="mo-scroll"><table class="mo-rates ct-table"><thead><tr><th>Film</th><th></th><th>A joke</th><th>Setup to payoff</th><th>Pause before</th><th>Time to land</th><th>Callbacks</th><th>Why</th></tr></thead><tbody>
      ${row(mine, `<span class="mo-badge mo-badge-m">this film</span>`)}
      ${COMEDY_FILMS.map((p) => row(p, `<span class="mo-badge">estimate</span>`)).join("")}
      ${prefs.measured.map((p) => row(p, `<span class="mo-badge mo-badge-m">measured</span>`, ` <button type="button" data-ct-unmeasure="${esc(p.id)}">Remove</button>`)).join("")}
      </tbody></table></div>
      <p class="mo-small">The three comedies are <b>Claude's estimates from general film knowledge, not measurements</b>. Measure any other film to compare with real numbers.</p>
      <div class="mo-controls"><label>Measure another film<select data-ct-other aria-label="Film to measure">${others}</select></label><button type="button" data-ct-measure>Measure its comedy</button></div>`;
  }

  function mountTab(el, ctx) {
    const id = pickSource(ctx);
    const r = readOf(ctx, id);
    const engine = id === "engine";
    const said = flash;
    flash = "";
    const list = r.jokes
      .map((j) => {
        const bits = [`<b>${clock(j.at)}</b> ${esc(KIND_WORDS[j.kind])}: ${esc(j.label)}.`];
        if (j.setupAt != null) bits.push(`It pays off the setup at ${clock(j.setupAt)}, ${secs(j.gap)} later.`);
        bits.push(j.pauseBefore ? `There is ${esc(j.pauseBefore.text)}.` : j.kind === "payoff" || j.setupAt != null ? "No pause comes before it." : "");
        bits.push(`It gets ${secs(j.landing)} to land.`);
        if (j.callback) bits.push(j.callback.at != null ? `It calls back to the joke at ${clock(j.callback.at)}${j.callback.guess ? " (probably)" : ""}.` : "It is marked as a callback.");
        return `<li>${bits.filter(Boolean).join(" ")}</li>`;
      })
      .join("");
    const sugg = r.suggestions
      .map((s, i) => `<li><span>${esc(s.text)}</span>${engine && s.kind === "pause" && pauseMove(r.jokes[s.joke]) ? `<button type="button" data-ct-pause="${i}">Add this pause on the engine</button>` : ""}</li>`)
      .join("");
    el.innerHTML = `<div class="ct-root">
      ${said ? `<div class="mo-flash" role="status">${esc(said)}</div>` : ""}
      <p>Comedy rhythm: how often the jokes come, how long a setup waits for its payoff, whether a pause comes before the punchline, and how long a laugh gets before attention moves on.</p>
      <div class="mo-controls"><label>Film${ctx.sourcePicker("data-ct-source")}</label></div>
      ${tiles(r, COMEDY_FILMS.concat(prefs.measured).find((p) => p.id === r.closest) || COMEDY_FILMS[1])}
      <section><h3>In plain words</h3><ul class="ct-sent">${r.sentences.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>
      <section><h3>The film, left to right</h3>
        <div class="ct-strip-box">${stripSvg(r, Math.max(280, (el.clientWidth || 600) - 4))}</div>
        <ul class="ct-key"><li><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" class="ct-m ct-s"></circle></svg> S, a setup</li><li><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" class="ct-m ct-p"></circle></svg> P, a payoff</li><li><svg width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" class="ct-m ct-j"></rect></svg> J, another joke (a topper, a cutaway, a laugh)</li><li><svg width="16" height="16" aria-hidden="true"><path d="M8 1 l7 7 l-7 7 l-7 -7 z" class="ct-m ct-c"></path></svg> C, a callback</li><li><svg width="16" height="16" aria-hidden="true"><rect x="0" y="5" width="16" height="6" class="ct-band"></rect></svg> comedy holds attention</li><li>An arc above joins a setup to its payoff; a dashed arc below joins a callback to the joke it returns to; a ? marks a setup that never pays off.</li></ul>
      </section>
      <section><h3>Suggestions</h3>${sugg ? `<ul class="mo-sugg">${sugg}</ul>${engine ? `<p class="mo-small">A pause on the engine is one more notch of "Pause before the punchline" at that moment. The engine's Undo takes it back.</p>` : ""}` : `<p class="mo-small"><span class="mo-status mo-good">●</span> Nothing to suggest: every payoff has a pause before it and every setup pays off.</p>`}</section>
      ${list ? `<details class="mo-table"><summary>Every joke (${r.jokes.length})</summary><ol class="ct-jokes">${list}</ol></details>` : ""}
      <section><h3>Compared with comedies</h3>${compareTable(r, ctx)}</section>
    </div>`;
    /* The strip is drawn at the width it gets, so its letters stay readable on a phone; the window may not be
       laid out yet the first time, so it is drawn again once it is. */
    const fit = () => {
      const box = el.querySelector(".ct-strip-box");
      const svg = box && box.querySelector("svg");
      if (!box || !svg || !box.clientWidth) return;
      const w = Math.max(280, box.clientWidth - 2);
      if (Math.abs(Number(svg.getAttribute("viewBox").split(" ")[2]) - w) > 8) box.innerHTML = stripSvg(r, w);
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(fit);
    el.onchange = (e) => {
      const t = e.target;
      if (t.matches("[data-ct-source]")) {
        ctx.setSource(t.value);
        ctx.refresh();
      } else if (t.matches("[data-ct-other]")) {
        prefs.other = t.value;
        save();
      }
    };
    el.onclick = (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.ctPause != null) {
        const s = r.suggestions[Number(t.dataset.ctPause)];
        const res = s ? applyPause(r.jokes[s.joke]) : { ok: false };
        flash = res && res.ok ? `Added a pause before the payoff at ${clock(s.at)} on the engine. Undo in the engine takes it back.` : "The engine said: " + ((res && res.error) || "no");
        ctx.refresh();
      } else if (t.dataset.ctMeasure != null) {
        const sel = el.querySelector("[data-ct-other]");
        const sid = sel && sel.value;
        const src = ctx.sources().find((s) => s.id === sid);
        if (!src) return;
        prefs.other = sid;
        const p = profile(readOf(ctx, sid, src.label), { id: "comedy-" + sid, title: src.label.replace(/\s*\(.*\)$/, "").replace(/^Model scene:\s*/, "") });
        prefs.measured = prefs.measured.filter((x) => x.id !== p.id).concat([p]);
        save();
        flash = `Measured the comedy of ${p.title}: ${p.jokes} joke${p.jokes === 1 ? "" : "s"}.`;
        ctx.refresh();
      } else if (t.dataset.ctUnmeasure) {
        prefs.measured = prefs.measured.filter((x) => x.id !== t.dataset.ctUnmeasure);
        save();
        ctx.refresh();
      }
    };
  }

  function attach() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    U.addTab({ id: "comedy", label: "Comedy timing", mount: mountTab });
    return true;
  }
  api.mountTab = mountTab;
  if (!attach()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
    else setTimeout(attach, 0);
  }
})();
