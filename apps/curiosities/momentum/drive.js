/* momentum/drive.js: "Story drive". Jeremy (2026-10-03): every curiosity must say how it drives the plot and
   the themes forward; momentum is the feeling of going somewhere important, not just change. So this reads every
   move of attention in a film (stats.moves from CurioAttention.read) and says whether the story moved with it,
   and how:
     plot       a story curiosity changed: a want, a secret, stakes, a reveal, a turn, a lie growing
     character  a character moved: a feeling, a step on their arc, a mind opening or closing, a choice
     theme      an echo: a curiosity that held attention earlier comes back, a while later, with a new value
                (or the beat marks it "Tied to a theme": clearly or more)
     none       a change that only decorates: a look, a camera move, a color, with no story curiosity changing
                in the same moment or the next two

   The rules (kept simple on purpose, all numbers below):
   1. A change "pushes the story" when its curiosity's momentum note (notes.js, or the database's momentum field)
      says so: its family is Plot & character, Feeling or Thought & focus, or its usual cue is a plot cue, or it
      pushes the story STORY_PUSH (4) or more out of 5 and is not one of the look-and-sound families (Camera,
      Light & color, Wardrobe, Set & landscape, Effects, Cut & structure, Music & sound). When the beat itself
      sets the curiosity's "Pushes the story" slider (id.push), that number decides instead (4 or more).
   2. The move drives the story through its own curiosity when that one pushes the story or echoes. Otherwise it
      looks at every other change in the move's moment and the next WINDOW_BEATS (2) moments (even when that
      change takes attention itself, so a close-up just before a face changes counts): an echo first, then the change that pushes the story hardest. If nothing qualifies, the move is
      "none" (decoration only).
   3. The kind: an echo, or a "Tied to a theme" slider at "clearly" or more, is theme. A curiosity of the Character
      arc, Archetype, Perspective & mindset or Focus workspaces (its own or one it also belongs to) is character.
      Then one whose usual cue is a plot cue (stakes, a secret, a reveal, a lie growing) is plot. Then one of the
      Feeling or Thought & focus families, or the Emotion or Emotional road workspaces, is character. Every other
      change that pushes the story is plot.
   4. An echo: the curiosity held attention before, has not held it for at least ECHO_GAP (30) seconds, and now
      changes to a value different from the one it had the last time it held attention. Camera and cut curiosities
      never echo: they are how the film is shot, not what is in it.
   These are guesses about how stories move, written down so they can be argued with and tuned. Nothing here is
   measured: the comparison films are read from their traces, and an estimated film (no trace) gets no number.

   Part of the momentum core (no page): drive() works in Node. The tab "Story drive" is the drawing.

   window.CurioDrive
   - drive(beats, opts) -> {
       moves:   [{ at, label, curiosity, family, from, to, beat, row, drives: "plot"|"character"|"theme"|"none",
                   why (one plain sentence), by: { curiosity, label, key, value, beat, own, echo } | null, note }]
       totals:  { moves, driving, share 0..1, counts: { plot, character, theme, none },
                  longestEmpty (seconds), emptyRuns: [{ from, to, dur, moves, beat, row, labels }] longest first }
       echoes:  [{ curiosity, label, times, returns: [{ at, from, to }] }] themes that come back changed
       seconds, reading }
       opts: { secondsPerBeat: 3, limit: 20, end, storyPush, windowBeats, echoGap }
   - suggest(beats, run, profiles, opts) -> a Compass option of a story family to bring in for an empty stretch
   - headline(result) -> "7 of 10 times attention moves, the story moves too."
   - KINDS, STORY_FAMILIES, DEFAULTS, addTab() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const CP = () => root.CurioCompass;
  const DEFAULTS = { secondsPerBeat: 3, limit: 20, storyPush: 4, windowBeats: 2, echoGap: 30 };
  const KINDS = [
    { id: "plot", label: "Plot", letter: "P", plain: "the plot moved: a want, a secret, the stakes, a reveal, a turn" },
    { id: "character", label: "Character", letter: "C", plain: "a character moved: a feeling, a step on their arc, a choice" },
    { id: "theme", label: "Theme", letter: "T", plain: "a theme came back: something seen before returned changed" },
    { id: "none", label: "Decoration only", letter: "D", plain: "only the look or sound changed, and no story curiosity changed with it" },
  ];
  /* Families whose curiosities carry the story (the Compass suggests one of these for an empty stretch). */
  const STORY_FAMILIES = ["plot", "feeling", "mind", "voice"];
  const CHARACTER_FAMILIES = ["feeling", "mind"];
  /* Always story: Plot & character, Feeling, Thought & focus. Never story on push alone: how it looks and sounds. */
  const STORY_FAMILIES_OWN = ["plot", "feeling", "mind"];
  const LOOK_FAMILIES = ["camera", "light", "wardrobe", "place", "effects", "cut", "music"];
  /* How it is filmed, not what is in it: a camera or cut coming back is not an echo. */
  const NO_ECHO = ["camera", "cut"];
  const ARC_WORKSPACES = ["arc", "archetype", "mindset", "focus"];
  const CHARACTER_WORKSPACES = ["emotion", "emo-road"];
  const THEME_LINK = ["clearly", "it is the theme"];
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);

  function seconds(at) {
    if (typeof at === "number" && isFinite(at)) return at;
    if (typeof at !== "string") return null;
    const t = at.trim();
    if (!/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null;
    return t.split(":").reduce((s, p) => s * 60 + Number(p), 0);
  }
  /* Beat times the way attention.js works them out (given, else evenly spaced, never going backwards). */
  function beatTimes(list, step) {
    let t = 0;
    return list.map((b, i) => {
      const s = seconds(b.at);
      t = s != null && s >= t ? s : i === 0 ? 0 : t + step;
      return t;
    });
  }
  /* "emotion.push@t2" -> { base: "emotion", slider: "push", track: "t2" } */
  function parts(key) {
    const [head, track] = String(key).split("@");
    const [base, slider] = head.split(".");
    return { base, slider: slider || null, track: track || null };
  }
  const sliderKey = (p, s) => p.base + "." + s + (p.track ? "@" + p.track : "");

  /* Rule 1: does this curiosity push the story, by its momentum note? */
  function isStory(n, o) {
    if (!n) return false;
    return n.cue === "plot" || STORY_FAMILIES_OWN.includes(n.family) || (!LOOK_FAMILIES.includes(n.family) && n.push >= ((o && o.storyPush) || DEFAULTS.storyPush));
  }
  /* What one change does for the story, by the rules above. */
  function kindOf(key, values, o) {
    const p = parts(key);
    const n = M().note(p.base);
    const raw = values[sliderKey(p, "push")];
    const explicit = raw != null && raw !== "" && isFinite(Number(raw));
    const push = explicit ? Number(raw) : n.push;
    const c = M().find(p.base);
    const ws = [(c && c.workspace) || n.workspace || ""].concat((c && Array.isArray(c.also) && c.also) || []);
    const themed = THEME_LINK.includes(values[sliderKey(p, "themeLink")]);
    const story = explicit ? push >= o.storyPush : isStory(n, o);
    let kind = null;
    if (themed) kind = "theme";
    else if (story) {
      if (ws.some((w) => ARC_WORKSPACES.includes(w))) kind = "character";
      else if (n.cue === "plot") kind = "plot";
      else kind = CHARACTER_FAMILIES.includes(n.family) || ws.some((w) => CHARACTER_WORKSPACES.includes(w)) ? "character" : "plot";
    }
    return { kind, push, note: n, base: p.base, themed };
  }

  function drive(beats, options) {
    const o = Object.assign({}, DEFAULTS, options || {});
    const step = Number(o.secondsPerBeat) > 0 ? Number(o.secondsPerBeat) : DEFAULTS.secondsPerBeat;
    const list = (beats || []).filter((b) => b && b.values && typeof b.values === "object");
    const reading = A().read(list, { secondsPerBeat: step, limit: o.limit, end: o.end });
    const times = beatTimes(list, step);
    const segs = reading.segments;
    const empty = { moves: [], totals: { moves: 0, driving: 0, share: 0, counts: { plot: 0, character: 0, theme: 0, none: 0 }, longestEmpty: 0, emptyRuns: [] }, echoes: [], seconds: reading.seconds, reading };
    if (!list.length || !segs.length) return empty;

    /* Every change, beat by beat: { beat: [{ key, value, was }] }. The first beat sets the scene, not a change. */
    const known = {};
    const changes = list.map((b, i) => {
      const out = [];
      Object.keys(b.values).forEach((k) => {
        const v = b.values[k];
        if (v == null || v === "") return;
        if (i > 0 && String(known[k]) !== String(v)) out.push({ key: k, value: v, was: known[k] });
        known[k] = v;
      });
      return out;
    });
    /* Values each curiosity had while it last held attention (by beat), and when that stretch ended. */
    const valuesAt = [];
    const now = {};
    list.forEach((b, i) => {
      Object.keys(b.values).forEach((k) => {
        const v = b.values[k];
        if (v != null && v !== "") now[k] = v;
      });
      valuesAt[i] = Object.assign({}, now);
    });
    const segAtBeat = (i) => {
      let s = null;
      segs.forEach((g) => g.beat <= i && (s = g));
      return s;
    };
    /* An echo: the curiosity held attention before, not for echoGap seconds, and its value is new since then. */
    function echoOf(ch, beat) {
      const p = parts(ch.key);
      if (p.slider === "push" || p.slider === "themeLink" || p.slider === "pointsAhead") return null;
      if (NO_ECHO.includes(M().note(p.base).family)) return null;
      const t = times[beat];
      let last = null;
      segs.forEach((g) => g.curiosity === p.base && g.beat < beat && (last = g));
      if (!last) return null;
      const cur = segAtBeat(beat);
      if (cur && cur.curiosity === p.base && cur.beat < beat) return null; /* still holding attention */
      if (t - last.to < o.echoGap) return null;
      const then = valuesAt[last.beat][ch.key];
      if (then === undefined || String(then) === String(ch.value)) return null;
      return { from: then, to: ch.value, gap: round(t - last.to), at: round(t - times[0], 2) };
    }

    /* The moves, with the beat each one starts on (the same pairs attention.js counts). */
    const moves = [];
    let k = 0;
    for (let i = 1; i < segs.length; i++) {
      if (segs[i].family === segs[i - 1].family) continue;
      const m = reading.stats.moves[k++];
      if (m) moves.push(Object.assign({}, m, { beat: segs[i].beat, curiosity: segs[i].curiosity, family: segs[i].family }));
    }
    const echoes = {};
    const out = moves.map((m) => {
      const label = m.label;
      const at = round(times[m.beat] - times[0], 2);
      const row = list[m.beat].row || null;
      const values = list[m.beat].values;
      /* 1. The move's own change. */
      const ownCh = changes[m.beat].filter((c) => parts(c.key).base === m.curiosity);
      let pick = null;
      ownCh.forEach((c) => {
        const kd = kindOf(c.key, values, o);
        const echo = echoOf(c, m.beat);
        const kind = echo ? "theme" : kd.kind;
        if (kind && (!pick || (kind === "theme" && pick.kind !== "theme") || kd.push > pick.push)) pick = { kind, push: kd.push, c, beat: m.beat, own: true, echo, note: kd.note };
      });
      /* 2. Any other change in this moment or the next windowBeats: an echo first, then the hardest push. */
      if (!pick) {
        const last = Math.min(list.length - 1, m.beat + o.windowBeats);
        for (let b = m.beat; b <= last; b++) {
          changes[b].forEach((c) => {
            if (parts(c.key).base === m.curiosity) return;
            const kd = kindOf(c.key, list[b].values, o);
            const echo = echoOf(c, b);
            const kind = echo ? "theme" : kd.kind;
            if (!kind) return;
            const better = !pick || (kind === "theme" && pick.kind !== "theme") || (pick.kind !== "theme" && kind !== "theme" && kd.push > pick.push) || (kind === pick.kind && kd.push === pick.push && b < pick.beat);
            if (better) pick = { kind, push: kd.push, c, beat: b, own: false, echo, note: kd.note };
          });
        }
      }
      if (pick && pick.echo) {
        const e = (echoes[pick.note.id] = echoes[pick.note.id] || { curiosity: pick.note.id, label: pick.note.label, returns: [] });
        if (!e.returns.some((r) => r.at === pick.echo.at)) e.returns.push(pick.echo);
      }
      const drives = pick ? pick.kind : "none";
      const by = pick ? { curiosity: pick.note.id, label: pick.note.label, key: pick.c.key, value: pick.c.value, beat: pick.beat, own: pick.own, echo: pick.echo || null } : null;
      return { at, label, curiosity: m.curiosity, family: m.family, from: m.from, to: m.to, cue: m.cue, beat: m.beat, row, drives, by, why: why(m, pick, o), note: pick ? pickText(pick) : "" };
    });

    /* Runs of empty moves: from the first empty move to the next move that drives the story (or the film's end). */
    const end = reading.seconds;
    const runs = [];
    let run = null;
    out.forEach((mv, i) => {
      if (mv.drives === "none") {
        if (!run) run = { from: mv.at, beat: mv.beat, row: mv.row, moves: 0, labels: [] };
        run.moves++;
        if (!run.labels.includes(mv.label)) run.labels.push(mv.label);
      } else if (run) {
        run.to = mv.at;
        runs.push(run);
        run = null;
      }
      if (i === out.length - 1 && run) {
        run.to = end;
        runs.push(run);
        run = null;
      }
    });
    runs.forEach((r) => (r.dur = round(r.to - r.from, 1)));
    runs.sort((a, b) => b.dur - a.dur || a.from - b.from);
    const counts = { plot: 0, character: 0, theme: 0, none: 0 };
    out.forEach((mv) => counts[mv.drives]++);
    const driving = out.length - counts.none;
    const echoList = Object.values(echoes)
      .map((e) => Object.assign(e, { times: e.returns.length }))
      .sort((a, b) => b.times - a.times || a.returns[0].at - b.returns[0].at);
    return {
      moves: out,
      totals: { moves: out.length, driving, share: out.length ? round(driving / out.length, 3) : 0, counts, longestEmpty: runs.length ? runs[0].dur : 0, emptyRuns: runs },
      echoes: echoList,
      seconds: reading.seconds,
      reading,
    };
  }

  const v = (x) => String(x);
  /* One plain sentence for each move. */
  function why(m, pick, o) {
    if (!pick) return `${m.label} took attention, but nothing that pushes the story changed in that moment or the next ${o.windowBeats}, so this move only decorates.`;
    const lbl = pick.note.label;
    const when = pick.own ? "" : pick.beat === m.beat ? " at the same moment" : ` ${pick.beat - m.beat} moment${pick.beat - m.beat === 1 ? "" : "s"} later`;
    if (pick.kind === "theme" && pick.echo) {
      const head = pick.own ? `${lbl} came back` : `${m.label} took attention, and ${lbl} came back${when}`;
      return `${head} ${pick.echo.gap} seconds after it last held attention, changed from "${v(pick.echo.from)}" to "${v(pick.echo.to)}": an echo that builds a theme.`;
    }
    if (pick.kind === "theme") return pick.own ? `${lbl} took attention, and it is marked as tied to a theme here.` : `${m.label} took attention, and ${lbl}${when} is marked as tied to a theme.`;
    const what = pick.kind === "character" ? "moves a character on" : "moves the plot forward";
    const val = ` (now "${v(pick.c.value)}")`;
    if (pick.own) return `${lbl}${val} took attention and ${what}: it pushes the story ${pick.push} of 5.`;
    return `${m.label} took attention, and ${lbl}${val} changed${when}, which ${what} (it pushes the story ${pick.push} of 5).`;
  }
  /* The momentum note's own words for how the change drives the story. */
  function pickText(pick) {
    const n = pick.note;
    return pick.kind === "theme" ? n.theme || "" : n.plot || "";
  }

  function headline(res) {
    const t = res && res.totals;
    if (!t || !t.moves) return "Attention never moves from one kind of curiosity to another in this film yet, so there is nothing to read.";
    if (t.driving === t.moves) return `Every one of the ${t.moves} times attention moves, the story moves too.`;
    if (!t.driving) return `Attention moves ${t.moves} time${t.moves === 1 ? "" : "s"}, and the story never moves with it.`;
    return `${t.driving} of ${t.moves} times attention moves, the story moves too.`;
  }

  /* For an empty stretch: the Compass, read on the film up to that stretch, narrowed to the story families. */
  function suggest(beats, run, profiles, options) {
    const o = Object.assign({}, DEFAULTS, options || {});
    const step = Number(o.secondsPerBeat) > 0 ? Number(o.secondsPerBeat) : DEFAULTS.secondsPerBeat;
    const list = (beats || []).filter((b) => b && b.values);
    const upto = list.slice(0, Math.max(1, (run && run.beat != null ? run.beat : list.length - 1) + 1));
    const fallback = (fam) => {
      const f = M().family(fam);
      const top = M()
        .all()
        .filter((n) => n.family === fam && isStory(n, o))
        .sort((a, b) => b.push - a.push || (a.source === "workspace") - (b.source === "workspace"))[0];
      return { family: fam, label: f ? f.label : fam, cue: top ? top.cue : "plot", curiosity: top ? top.id : null, note: top || null, reasons: [] };
    };
    if (!CP() || !upto.length) return fallback("plot");
    let best = null;
    try {
      const r = A().read(upto, { secondsPerBeat: step, limit: o.limit });
      const res = CP().point(r, profiles || []);
      best = res.options.find((x) => STORY_FAMILIES.includes(x.family)) || null;
    } catch (e) {
      best = null;
    }
    if (!best) return fallback("plot");
    /* Pick the family's curiosity that pushes the story hardest, so the move drives it. */
    if (!best.note || !isStory(best.note, o)) {
      const fb = fallback(best.family);
      best = Object.assign({}, best, { curiosity: fb.curiosity, note: fb.note });
    }
    return best;
  }

  /* ---------------------------------------------------------------- the tab (browser only) */
  const COLORS = { feeling: "#2a78d6", plot: "#eb6834", voice: "#1baf7a", comedy: "#eda100", movement: "#e87ba4", music: "#008300", camera: "#4a3aa7", place: "#e34948" };
  const famColor = (f) => COLORS[f] || "#a8a39a";
  const KEY = "curiosities-momentum-drive-v1";
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const clock = (s) => (A() ? A().clock(s) : String(Math.round(s)));
  const famLabel = (f) => ((M() && M().family(f)) || { label: f || "nothing" }).label;
  const kind = (id) => KINDS.find((x) => x.id === id);
  const pct = (x) => Math.round((x || 0) * 100) + "%";
  const shortName = (s) => {
    const t = String(s || "").replace(/^Model scene:\s*/i, "").replace(/\s*\(made-up practice scene\)$/, "");
    return t.length > 28 ? t.slice(0, 27).trim() + "…" : t;
  };
  function loadOwn() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return { also: typeof p.also === "string" ? p.also : "", all: !!p.all };
  }
  function saveOwn(own) {
    try {
      localStorage.setItem(KEY, JSON.stringify(own));
    } catch (e) {}
  }
  let flash = "";

  /* The film from start to end, each stretch between moves colored by what the move did. */
  function strip(res) {
    const T = res.seconds || 1;
    const ms = res.moves;
    const cells = [];
    if (ms.length && ms[0].at > 0) cells.push(`<span class="mdr-cell mdr-start" style="left:0;width:${(ms[0].at / T) * 100}%" title="The opening, before attention first moves"></span>`);
    ms.forEach((m, i) => {
      const to = i + 1 < ms.length ? ms[i + 1].at : T;
      const w = ((to - m.at) / T) * 100;
      const k = kind(m.drives);
      cells.push(`<span class="mdr-cell mdr-${m.drives}" style="left:${(m.at / T) * 100}%;width:${w}%" title="${esc(clock(m.at))}: ${esc(k.label)}. ${esc(m.why)}">${w > 2.4 ? k.letter : ""}</span>`);
    });
    const ticks = [0, T / 3, (2 * T) / 3, T].map((t, i) => `<span style="left:${(t / T) * 100}%" class="${i === 3 ? "mdr-tick-end" : i ? "mdr-tick-mid" : ""}">${clock(t)}</span>`).join("");
    const c = res.totals.counts;
    const legend = KINDS.map((k) => `<li><i class="mdr-key mdr-${k.id}">${k.letter}</i> ${esc(k.label)} <span>${c[k.id]}</span></li>`).join("");
    return `<div class="mdr-strip" role="img" aria-label="${esc(KINDS.map((k) => `${k.label}: ${c[k.id]} moves`).join(", "))}">${cells.join("")}</div><div class="mdr-ticks">${ticks}</div><ul class="mdr-legend">${legend}</ul>`;
  }

  function compareRows(ctx, own, res, src) {
    const sources = ctx.sources();
    const studies = sources.filter((s) => s.id.startsWith("study:"));
    const opts = { secondsPerBeat: ctx.secondsPerBeat(), limit: ctx.limit() };
    const rows = [{ name: "Your film", res, me: true }];
    ctx.profiles().forEach((p) => {
      if (p.estimate) return rows.push({ name: p.title, estimate: true });
      const sid = "study:" + String(p.id).replace(/^measured-/, "");
      const s = studies.find((x) => x.id === sid);
      rows.push(s ? { name: p.title, res: drive(ctx.beatsOf(sid), opts) } : { name: p.title, missing: true });
    });
    if (own.also && own.also !== src && studies.some((s) => s.id === own.also)) rows.push({ name: shortName(studies.find((s) => s.id === own.also).label), res: drive(ctx.beatsOf(own.also), opts), also: true });
    return rows
      .map((r) => {
        if (r.estimate) return `<li class="mdr-cmp-row"><span class="mdr-cmp-name">${esc(r.name)} <span class="mo-badge">estimate</span></span><span class="mdr-cmp-none">No trace to read, so no share. Measure it in Film rates to see it here.</span></li>`;
        if (r.missing) return `<li class="mdr-cmp-row"><span class="mdr-cmp-name">${esc(r.name)}</span><span class="mdr-cmp-none">Its trace is not in this app's films.</span></li>`;
        const t = r.res.totals;
        const seg = KINDS.map((k) => (t.moves ? `<i class="mdr-${k.id}" style="width:${(t.counts[k.id] / t.moves) * 100}%"></i>` : "")).join("");
        return `<li class="mdr-cmp-row${r.me ? " mdr-me" : ""}"><span class="mdr-cmp-name">${esc(r.name)}${r.me ? "" : ' <span class="mo-badge mo-badge-m">read from its trace</span>'}</span><span class="mdr-cmp-bar" aria-hidden="true">${seg}</span><span class="mdr-cmp-v"><b>${t.moves ? pct(t.share) : "none"}</b> <small>${t.driving} of ${t.moves} moves drive the story${t.longestEmpty ? `, longest empty stretch ${Math.round(t.longestEmpty)} s` : ""}</small></span></li>`;
      })
      .join("");
  }

  function mountTab(el, ctx) {
    const own = loadOwn();
    const sources = ctx.sources();
    let src = ctx.source();
    if (!sources.some((s) => s.id === src)) src = (sources.find((s) => s.id === "engine") || sources.find((s) => s.id.startsWith("study:")) || sources[0] || { id: "" }).id;
    const studies = sources.filter((s) => s.id.startsWith("study:"));
    const opts = { secondsPerBeat: ctx.secondsPerBeat(), limit: ctx.limit() };
    const beats = ctx.beatsOf(src);
    const res = drive(beats, opts);
    const isEngine = src === "engine" && root.CurioMomentumEngine && root.CurioMomentumEngine.available();
    const picker = ctx.sourcePicker("data-dr-source").replace(/<option value="([^"]*)"( selected)?>/g, (m0, val) => `<option value="${val}"${val === src ? " selected" : ""}>`);
    const t = res.totals;
    const runs = t.emptyRuns.slice(0, 5);
    const profiles = ctx.profiles();
    const sugg = runs.map((r) => suggest(beats, r, profiles, opts));
    const runItems = runs
      .map((r, i) => {
        const s = sugg[i];
        const st = r.dur > ctx.limit() ? ["crit", "■", "Too long"] : r.dur > ctx.limit() / 2 ? ["warn", "▲", "Getting long"] : ["good", "●", "Short"];
        const tryNote = s.note ? ` Try ${esc(s.note.label)}: ${esc(String(s.note.tryThis || "").replace(/\s+$/, ""))}` : "";
        const btn = isEngine && r.row != null ? `<button type="button" data-dr-move="${i}">Make this move here</button>` : "";
        return `<li class="mdr-run"><div><b>${clock(r.from)} to ${clock(r.to)}</b> <small>(${Math.round(r.dur)} seconds, ${r.moves} move${r.moves === 1 ? "" : "s"} of decoration only)</small> <span class="mo-status mo-${st[0]}">${st[1]} ${st[2]}</span></div>
          <div>What took attention: ${esc(r.labels.slice(0, 4).join(", "))}${r.labels.length > 4 ? ", and more" : ""}.</div>
          <div class="mdr-try"><b>Bring in:</b> <span class="mo-fam"><i style="background:${famColor(s.family)}"></i>${esc(s.label)}</span>, so the story moves when attention does.${tryNote}</div>${btn}</li>`;
      })
      .join("");
    const shown = own.all ? res.moves : res.moves.slice(0, 12);
    const moveRows = shown
      .map((m) => {
        const k = kind(m.drives);
        return `<tr><td>${clock(m.at)}</td><td><span class="mo-fam"><i style="background:${famColor(m.family)}"></i>${esc(m.label)}</span></td><td><i class="mdr-key mdr-${m.drives}">${k.letter}</i> ${esc(k.label)}</td><td class="mo-why">${esc(m.why)}</td></tr>`;
      })
      .join("");
    const echoItems = res.echoes
      .map((e) => `<li><b>${esc(e.label)}</b> comes back changed ${e.times} time${e.times === 1 ? "" : "s"}: ${e.returns.map((r) => `at ${clock(r.at)}, "${esc(r.from)}" became "${esc(r.to)}"`).join("; ")}.</li>`)
      .join("");
    el.innerHTML = `<div class="mdr">${flash ? `<div class="mo-flash" role="status">${esc(flash)}</div>` : ""}
      <p class="mdr-head">${esc(headline(res))}</p>
      <p class="mo-lede">Momentum is the feeling of going somewhere important, not just change. Every time attention moves to a new kind of curiosity, this asks whether the story moved with it: the plot, a character, or a theme coming back changed. A move where only the look or the sound changes is decoration only.</p>
      <div class="mo-controls">
        <label>Film ${picker}</label>
        <label>Also compare with <select data-dr-also aria-label="Also compare with"><option value="">No other film</option>${studies.map((s) => `<option value="${esc(s.id)}"${s.id === own.also ? " selected" : ""}>${esc(shortName(s.label))}</option>`).join("")}</select></label>
      </div>
      ${
        t.moves
          ? `<section><h3>What each move did, across the film</h3>${strip(res)}</section>
      <div class="mo-tiles">
        <div class="mo-tile"><div class="mo-tile-v">${pct(t.share)}</div><div class="mo-tile-l">Moves that drive the story</div><div class="mo-tile-s">${t.driving} of ${t.moves}</div></div>
        <div class="mo-tile"><div class="mo-tile-v">${Math.round(t.longestEmpty)} s</div><div class="mo-tile-l">Longest decoration-only stretch</div><div class="mo-tile-s">${t.emptyRuns.length} stretch${t.emptyRuns.length === 1 ? "" : "es"} in all</div></div>
        <div class="mo-tile"><div class="mo-tile-v">${res.echoes.length}</div><div class="mo-tile-l">Themes that echo</div><div class="mo-tile-s">curiosities that come back changed</div></div>
      </div>
      <section><h3>Empty stretches</h3>${
        runs.length
          ? `<p class="mo-small">Where attention keeps moving but the story does not, longest first. Each one suggests a kind of story curiosity to bring in (from the Compass, compared with the films you picked).${isEngine ? " Make this move here changes one curiosity of that kind by one notch at the start of the stretch, and Undo takes it back." : src === "live" || src === "board" ? " Pick the engine's timeline as the film to make these moves on My film." : ""}</p><ol class="mdr-runs">${runItems}</ol>`
          : `<p class="mo-small"><span class="mo-status mo-good">●</span> No empty stretches: every move of attention also moves the story.</p>`
      }</section>
      <section><h3>Themes that echo</h3>${res.echoes.length ? `<ul class="mdr-echo">${echoItems}</ul>` : `<p class="mo-small">Nothing that held attention comes back changed after ${DEFAULTS.echoGap} seconds or more. A thing seen early and brought back different (a prop, a tune, a line, a coat) is how a film builds a theme.</p>`}</section>
      <section><h3>Every move</h3><div class="mo-scroll"><table class="mo-moves mdr-table"><thead><tr><th>When</th><th>Attention moved to</th><th>Drives</th><th>Why</th></tr></thead><tbody>${moveRows}</tbody></table></div>${res.moves.length > 12 ? `<button type="button" class="mdr-all" data-dr-all>${own.all ? "Show the first 12" : `Show all ${res.moves.length}`}</button>` : ""}</section>`
          : `<p class="mo-empty">${src === "live" ? "Play or perform My film to read it." : "Attention never moves from one kind of curiosity to another in this film yet."}</p>`
      }
      <section><h3>Compared with your films</h3><p class="mo-small">The share of moves that drive the story in each film, read from its trace with the same rules. Films with only an estimate have no trace, so they get no number.</p><ul class="mdr-cmp">${compareRows(ctx, own, res, src)}</ul></section>
      <details class="mdr-rules"><summary>How this is worked out</summary><ul class="mo-small">
        <li>A change pushes the story when it is about the plot, a feeling or a character's thinking, or when its momentum note says it pushes the story ${DEFAULTS.storyPush} or more out of 5. How a scene looks and sounds (camera, light, clothes, the set, effects, cuts, music) only pushes the story when it comes back changed.</li>
        <li>A move drives the story when the curiosity that took attention pushes it, or when another one that does changes in the same moment or the next ${DEFAULTS.windowBeats}.</li>
        <li>Arcs, types, mindsets and focus are character. Stakes, secrets, reveals and turns are plot. Feelings and thoughts are character. A curiosity that held attention before and comes back changed after ${DEFAULTS.echoGap} seconds or more is a theme (a camera move or a cut coming back does not count). The rest is plot.</li>
      </ul></details></div>`;
    wire(el, ctx, own, res, runs, sugg);
  }

  function wire(el, ctx, own, res, runs, sugg) {
    flash = "";
    const pick = el.querySelector("[data-dr-source]");
    if (pick)
      pick.addEventListener("change", () => {
        ctx.setSource(pick.value);
        ctx.refresh();
      });
    const also = el.querySelector("[data-dr-also]");
    if (also)
      also.addEventListener("change", () => {
        own.also = also.value;
        saveOwn(own);
        ctx.refresh();
      });
    const all = el.querySelector("[data-dr-all]");
    if (all)
      all.addEventListener("click", () => {
        own.all = !own.all;
        saveOwn(own);
        ctx.refresh();
      });
    el.querySelectorAll("[data-dr-move]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.drMove);
        const r = runs[i];
        const s = sugg[i];
        const ME = root.CurioMomentumEngine;
        const mv = ME && r && s ? ME.moveAt(s, r.row) : null;
        if (!mv) flash = `There is nothing of ${s ? s.label : "that kind"} to change at that moment on the engine.`;
        else {
          const rep = ME.applyMove(mv);
          flash = rep && rep.ok === false ? `The engine said no: ${rep.error || "it could not make the change"}.` : `Changed ${mv.label} to "${mv.value}" at ${clock(r.from)}. Undo takes it back.`;
        }
        const keep = flash;
        ctx.refresh();
        if (!el.querySelector(".mo-flash")) {
          const f = document.createElement("div");
          f.className = "mo-flash";
          f.setAttribute("role", "status");
          f.textContent = keep;
          const box = el.querySelector(".mdr");
          if (box) box.prepend(f);
        }
      })
    );
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "drive", label: "Story drive", mount: mountTab });
  }

  const api = { drive, suggest, headline, kindOf, KINDS, STORY_FAMILIES, DEFAULTS, addTab };
  root.CurioDrive = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
