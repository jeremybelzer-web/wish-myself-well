/* momentum/ui.js: the Momentum window. Opens from the Library menu ("Momentum"), or on its own page
   (momentum/index.html). Its own tabs (the rest come from other momentum files through addTab):

   - Attention: pick a film (My film live while you play or perform it, My film's panels, a storyboard scene,
     the whole storyboard, or any curated film) and see
       the meter     how long the audience's attention has rested on one family of curiosities, against the limit
       the pie       what share of the time each family held attention
       the timeline  which family held attention when, the cue that moved it on, and how long each stretch ran
       warnings      every stretch past the limit, with a cue to try
       compared      your film against a film you love (or the average of several), in plain sentences
   - Film rates: the default curated list (Claude's estimates, marked) and any film you measure from a trace.
   - Momentum notes: every curiosity's note: how it moves the plot and themes forward and pulls attention on.

   window.CurioMomentumUI = { open(tab), close(), mount(el), noteHtml(id), mountNote(el, id), addTab(spec), context() }
   addTab({ id, label, after?: "end", group?: "see"|"fix"|"learn"|"live"|"share", mount(el, ctx) }) adds a tab
   from another momentum file. The tabs sit in five groups (See it, Fix it, Learn it, Play it live, Share it):
   without a group a known id goes to its own group (TAB_GROUP) and an unknown one to See it. Within a group the
   order is the built-in tabs, then added tabs, then those with after: "end". Every group shows with its name
   (over its tabs on a wide screen, beside them on a phone), so every tab is one click away; the group of the
   open tab is marked, and open(id) marks the right group.
   mount is called each time the tab is drawn, with ctx: prefs(),
   sources(), source(), setSource(id), sourcePicker(attr), readSource(id), beatsOf(id), profiles() (the films
   picked to compare with), allProfiles(), target(), limit(), secondsPerBeat(), refresh().
   unmount?() is called when another tab opens or the window closes, so a tab can stop listening (engine on(),
   timers) while it is not on show; mount is called again when it comes back.
   Saves its choices under localStorage key curiosities-momentum-v1 (source, compare-with list, limit,
   seconds per panel, measured films). */
(function () {
  const KEY = "curiosities-momentum-v1";
  const M = window.CurioMomentum;
  const A = window.CurioAttention;
  const R = window.CurioRates;
  const CP = () => window.CurioCompass;
  const ME = () => window.CurioMomentumEngine;
  const PF = () => window.CurioPerform;
  if (!M || !A || !R) return;

  /* Eight fixed family colors (validated categorical order); the other families share gray as "Other". */
  /* Family colors and the status marks come from notes.js (CurioMomentum.mark, CurioMomentum.status). */
  const OTHER = M.OTHER;
  const colorOf = (f) => M.mark(f).color;
  const famLabel = (f) => (M.family(f) || { label: f }).label;
  const cueLabel = (c) => (M.CUES.find((x) => x.id === c) || { label: c }).label;

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const pct = (x) => Math.round((x || 0) * 100) + "%";

  function loadPrefs() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return {
      tab: p.tab || "attention",
      source: p.source || "",
      compare: Array.isArray(p.compare) && p.compare.length ? p.compare : ["pulp-fiction"],
      limit: Number(p.limit) > 0 ? Number(p.limit) : null,
      secondsPerPanel: Number(p.secondsPerPanel) > 0 ? Number(p.secondsPerPanel) : 3,
      measured: Array.isArray(p.measured) ? p.measured.filter((x) => x && x.id) : [],
      noteFilter: p.noteFilter || "",
      noteFamily: p.noteFamily || "",
    };
  }
  const prefs = loadPrefs();
  function savePrefs() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  /* ---------- films to read ---------- */
  function studies() {
    if (window.CuriosityStudy && typeof window.CuriosityStudy.studies === "function") {
      try {
        return window.CuriosityStudy.studies();
      } catch (e) {}
    }
    let mine = [];
    try {
      const s = JSON.parse(localStorage.getItem("curiosities-studies-v1"));
      mine = (s && Array.isArray(s.studies) && s.studies) || [];
    } catch (e) {}
    const DB = window.CuriosityDB;
    const model = DB && typeof DB.studiesExport === "function" ? DB.studiesExport().studies || [] : [];
    return mine.concat(model.map((x) => Object.assign({ curated: true }, x)));
  }
  function storyboardScenes() {
    const SB = window.CuriosityStoryboard;
    try {
      const d = SB && typeof SB.data === "function" ? SB.data() : JSON.parse(localStorage.getItem("curiosities-storyboard-v1"));
      return (d && Array.isArray(d.scenes) ? d.scenes : []).filter((s) => s && Array.isArray(s.panels) && s.panels.length);
    } catch (e) {
      return [];
    }
  }
  function sources() {
    const out = [];
    const B = window.CuriosityBoard;
    if (B) {
      out.push({ id: "live", group: "My film", label: "My film, live (follows what you play or perform)" });
      out.push({ id: "board", group: "My film", label: "My film's panels" });
    }
    if (ME() && ME().available()) out.push({ id: "engine", group: "My film", label: `The engine's timeline (${window.CurioEngine.state().rows.length} moments)` });
    const scenes = storyboardScenes();
    if (scenes.length > 1) out.push({ id: "sb:all", group: "Storyboard", label: `The whole storyboard (${scenes.length} scenes)` });
    scenes.forEach((s, i) => out.push({ id: "sb:" + s.id, group: "Storyboard", label: `${s.name || "Scene " + (i + 1)} (${s.panels.length} panels)` }));
    studies().forEach((s) => out.push({ id: "study:" + s.id, group: "Curated films", label: `${s.title || s.id}${s.curated ? " (made-up practice scene)" : ""}` }));
    return out;
  }
  function readSource(id) {
    const per = { secondsPerBeat: prefs.secondsPerPanel, limit: limit() };
    if (id === "live") return recorder ? recorder.reading({ limit: limit() }) : A.read([], per);
    if (id === "board") {
      const B = window.CuriosityBoard;
      return A.read((B ? B.panels() : []).map((v) => ({ values: v })), per);
    }
    if (id === "engine") return ME() ? ME().reading(per) : A.read([], per);
    if (id === "sb:all") return A.read(storyboardScenes().reduce((all, s) => all.concat(s.panels.map((p) => ({ values: p.v || {} }))), []), per);
    if (id.startsWith("sb:")) {
      const s = storyboardScenes().find((x) => "sb:" + x.id === id);
      return A.fromScene(s, per);
    }
    if (id.startsWith("study:")) {
      const s = studies().find((x) => "study:" + x.id === id);
      return A.fromStudy(s, per);
    }
    return A.read([], per);
  }

  /* The beats a source reads (live: what the recorder has so far), for tabs that need the film itself. */
  function beatsOf(id) {
    if (id === "live") return recorder ? recorder.beats() : [];
    if (id === "board") return ((window.CuriosityBoard && window.CuriosityBoard.panels()) || []).map((v) => ({ values: v }));
    if (id === "engine") return ME() ? ME().beats() : [];
    if (id === "sb:all") return storyboardScenes().reduce((all, s) => all.concat(s.panels.map((p) => ({ values: p.v || {} }))), []);
    if (id && id.startsWith("sb:")) {
      const s = storyboardScenes().find((x) => "sb:" + x.id === id);
      return s ? s.panels.map((p) => ({ values: (p && p.v) || {} })) : [];
    }
    if (id && id.startsWith("study:")) {
      const s = studies().find((x) => "study:" + x.id === id);
      return (s && s.beats) || [];
    }
    return [];
  }

  /* ---------- plain words ---------- */
  /* The words every tab uses, explained once, in the same words as the README's "Plain words". The short line
     sits under the tabs on every tab; "More words" opens the rest. */
  const WORDS = [
    ["Curiosity", "one thing in a film you can change, like the shot size, a feeling or the music."],
    ["Family", "a kind of curiosity, such as Camera, Feeling or Comedy. Each has its own color and short letter."],
    ["Attention", "the one thing the audience is watching at a moment. It can rest on only one thing at a time."],
    ["Moment", "one step of a film: a row of the engine, a panel of a storyboard, or a few seconds of a curated film."],
    ["Panel", "one picture of a storyboard scene. A panel has no clock, so Seconds per panel says how long it lasts."],
    ["Cue", "what moves attention to something new: something to see, a sound, a thought, a movement or a plot turn."],
    ["Quiet cue", "a cue that is a stop instead of a start: the music cuts out, a silence falls, someone goes still."],
    ["Limit", "how many seconds one family can hold attention before the audience tires: ● Fresh, ▲ Getting long, ■ Too long."],
    ["Momentum", "how hard what holds attention pushes the story, from 0 (stalled) to 5 (surging)."],
    ["My film", "the film you are making, the one the Screen plays and the engine keeps."],
    ["Curated film", "a film to learn from. Estimate means Claude's guess; measured means counted from its moments."],
  ];
  const wordsHtml = () =>
    `<details class="mo-words"><summary><span>Words: a <b>family</b> is a kind of curiosity, a <b>cue</b> is what moves attention to it, and a <b>moment</b> is one step of the film.</span> <span class="mo-words-more">More words</span></summary><dl>${WORDS.map(([w, d]) => `<dt>${esc(w)}</dt><dd>${esc(d)}</dd>`).join("")}</dl></details>`;

  /* My film lives in the engine, which is empty on a fresh browser until the Screen opens. Tabs that need it
     offer this button, which starts the same example film the Screen starts (one engine step). */
  function canStartFilm() {
    return !!(window.CurioEngine && window.CurioSeeds && typeof window.CurioSeeds.starter === "function");
  }
  function startFilm() {
    const Eng = window.CurioEngine;
    if (!canStartFilm()) return false;
    if (Eng.state().rows.length) return true;
    const r = Eng.send({ type: "batch", label: "Start a new film", commands: [{ type: "importFilm", film: window.CurioSeeds.starter() }] });
    if (r && r.ok && typeof window.CurioSeeds.letterLinks === "function") {
      const links = window.CurioSeeds.letterLinks(Eng.state());
      if (links.length && !Eng.state().links.length) Eng.send({ type: "batch", label: "Add the letter's links", commands: links });
    }
    return Eng.state().rows.length > 0;
  }
  const startFilmButton = () => (canStartFilm() ? `<button type="button" class="mo-start-film" data-m="start-film">Start the example film</button>` : "");

  /* ---------- tabs other momentum files add (addTab) ---------- */
  const extraTabs = [];
  /* The five groups the tabs sit in, so a beginner can tell where to start. A tab added without a group goes
     where its id says (TAB_GROUP), and an unknown id goes to "See it". */
  const GROUPS = [
    { id: "see", label: "See it", hint: "See it: look at how attention moves through a film." },
    { id: "fix", label: "Fix it", hint: "Fix it: get ideas and changes for your own film." },
    { id: "learn", label: "Learn it", hint: "Learn it: learn the idea, and the films it is measured against." },
    { id: "live", label: "Play it live", hint: "Play it live: move attention yourself while a film plays." },
    { id: "share", label: "Share it", hint: "Share it: make a page or a sheet to show other people." },
  ];
  const TAB_GROUP = {
    attention: "see", watch: "see", curve: "see", drive: "see", comedy: "see",
    compass: "fix", engine: "fix", pace: "fix", cuelab: "fix",
    lesson: "learn", rates: "learn", notes: "learn",
    pads: "live", perform: "live",
    report: "share", cuesheet: "share",
  };
  const groupOf = (id, given) => (GROUPS.some((g) => g.id === given) ? given : TAB_GROUP[id] || "see");
  function addTab(spec) {
    if (!spec || !spec.id || typeof spec.mount !== "function" || extraTabs.some((t) => t.id === spec.id)) return false;
    extraTabs.push(Object.assign({ label: spec.id }, spec, { group: groupOf(spec.id, spec.group) }));
    if (host) draw();
    return true;
  }
  /* What an added tab can use: the window's own settings and readings, read-only. */
  function context() {
    return {
      prefs: () => JSON.parse(JSON.stringify(prefs)),
      sources,
      source: () => ensureSource(),
      readSource,
      beatsOf,
      profiles: () => profiles().filter((p) => prefs.compare.includes(p.id)),
      allProfiles: profiles,
      target,
      limit,
      secondsPerBeat: () => prefs.secondsPerPanel,
      refresh: () => draw(),
      sourcePicker: (attr) => {
        const list = sources();
        ensureSource(list);
        const groups = [...new Set(list.map((x) => x.group))];
        return `<select ${attr || "data-ext-source"} aria-label="Film">${groups.map((g) => `<optgroup label="${esc(g)}">${list.filter((x) => x.group === g).map((x) => `<option value="${esc(x.id)}"${x.id === prefs.source ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</optgroup>`).join("")}</select>`;
      },
      setSource: (id) => {
        prefs.source = id;
        savePrefs();
      },
    };
  }

  /* The film the tabs read. On a fresh browser (or when the saved one is gone) it is the first curated film, so
     every tab has something to show; My film, live stays one pick away. */
  function ensureSource(list) {
    list = list || sources();
    if (prefs.source && list.some((s) => s.id === prefs.source)) return prefs.source;
    const first = list.find((s) => s.id.startsWith("study:")) || list[0];
    prefs.source = first ? first.id : "";
    return prefs.source;
  }

  /* ---------- compare-with ---------- */
  const profiles = () => R.DEFAULT_FILMS.concat(prefs.measured);
  function target() {
    const picked = profiles().filter((p) => prefs.compare.includes(p.id));
    return picked.length ? R.average(picked) : null;
  }
  function limit() {
    if (prefs.limit) return prefs.limit;
    return R.limitFor(target());
  }

  /* ---------- live ---------- */
  let recorder = null;
  let unhook = null;
  let ticker = null;
  function startLive() {
    if (recorder || !window.CuriosityBoard) return;
    const B = window.CuriosityBoard;
    recorder = A.live({});
    const push = () => {
      const p = B.panels();
      recorder.push(p[0] || B.values());
    };
    push();
    unhook = B.on(push);
    ticker = setInterval(() => {
      if (!host || !host.isConnected) return stopLive();
      if (prefs.source !== "live") return;
      if (prefs.tab === "attention") drawAttention(true);
      else if (prefs.tab === "compass") drawCompass();
    }, 1000);
  }
  function stopLive() {
    if (unhook) unhook();
    if (ticker) clearInterval(ticker);
    unhook = null;
    ticker = null;
    recorder = null;
  }

  /* ---------- pieces ---------- */
  const statusOf = (run, lim) => M.status(run ? run.dur : null, lim);
  function meterHtml(reading, at) {
    const s = reading.stats;
    const run = at ? at.run : s.currentRun;
    const lim = reading.limit;
    const st = statusOf(run, lim);
    const max = lim * 1.5;
    const fill = run ? Math.min(100, (run.dur / max) * 100) : 0;
    const seg = at ? at.seg : reading.segments[reading.segments.length - 1];
    const who = run ? `${esc(famLabel(run.family))}${seg ? ` <small>(now: ${esc(seg.label)})</small>` : ""}` : "nothing yet";
    const when = at ? `At ${A.clock(at.t)}, attention is on` : prefs.source === "live" ? "Attention is on" : "At the end, attention is on";
    return `<div class="mo-meter" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${run ? Math.round(run.dur) : 0}" aria-label="How long attention has rested on one family">
        <div class="mo-meter-top"><span>${when} <b>${who}</b></span><span class="mo-status mo-${st.cls}">${st.icon} ${st.text}</span></div>
        <div class="mo-gauge"><div class="mo-gauge-fill mo-${st.cls}" style="width:${fill}%"></div><div class="mo-gauge-limit" style="left:${(lim / max) * 100}%" title="Limit: ${lim} seconds"></div></div>
        <div class="mo-meter-scale"><span>0 s</span><span style="left:${(lim / max) * 100}%">limit ${lim} s</span><span>${Math.round(max)} s</span></div>
        <div class="mo-meter-now">${at ? "Following the pointer on the timeline. " : prefs.source === "live" ? "" : "Point at the timeline to see the meter at any moment. "}${run ? `${Math.round(run.dur)} seconds on ${esc(famLabel(run.family))}${run.count > 1 ? `, across ${run.count} curiosities in a row` : ""}` : "Play or pick a film to start."}</div>
      </div>`;
  }
  function tilesHtml(reading, tgt) {
    const s = reading.stats;
    const t = (label, value, sub) => `<div class="mo-tile"><div class="mo-tile-v">${value}</div><div class="mo-tile-l">${label}</div>${sub ? `<div class="mo-tile-s">${sub}</div>` : ""}</div>`;
    return `<div class="mo-tiles">
      ${t("Momentum reading", s.momentum.toFixed(1) + " <small>of 5</small>", "How hard what holds attention pushes the story, worn down when it stays too long")}
      ${t("Moves a minute", s.switchesPerMinute, tgt ? `${esc(tgt.title)}: about ${tgt.switchesPerMinute}` : "")}
      ${t("Usual hold", s.medianDwell + " s", tgt ? `${esc(tgt.title)}: about ${tgt.medianDwell} s` : "")}
      ${t("Longest hold", s.longestDwell + " s", "")}
    </div>`;
  }
  /* Pie (as a ring): share of time per family. Fixed colors per family; others are gray. */
  function pieHtml(stats) {
    const entries = Object.entries(stats.familyShare || {}).filter(([, v]) => v > 0);
    if (!entries.length) return `<p class="mo-empty">No attention yet.</p>`;
    const named = entries.filter(([f]) => M.COLORS[f]);
    const other = entries.filter(([f]) => !M.COLORS[f]);
    const otherShare = other.reduce((a, [, v]) => a + v, 0);
    const slices = named.concat(otherShare > 0 ? [["other", otherShare]] : []);
    const total = slices.reduce((a, [, v]) => a + v, 0) || 1;
    const R0 = 70;
    const R1 = 44;
    let a0 = -Math.PI / 2;
    const arcs = slices
      .map(([f, v]) => {
        const sweep = (v / total) * Math.PI * 2;
        const a1 = a0 + sweep;
        const large = sweep > Math.PI ? 1 : 0;
        const p = (r, a) => `${(80 + r * Math.cos(a)).toFixed(2)} ${(80 + r * Math.sin(a)).toFixed(2)}`;
        const d =
          sweep >= Math.PI * 2 - 1e-6
            ? `M ${p(R0, 0)} A ${R0} ${R0} 0 1 1 ${p(R0, Math.PI)} A ${R0} ${R0} 0 1 1 ${p(R0, 0)} M ${p(R1, 0)} A ${R1} ${R1} 0 1 0 ${p(R1, Math.PI)} A ${R1} ${R1} 0 1 0 ${p(R1, 0)} Z`
            : `M ${p(R0, a0)} A ${R0} ${R0} 0 ${large} 1 ${p(R0, a1)} L ${p(R1, a1)} A ${R1} ${R1} 0 ${large} 0 ${p(R1, a0)} Z`;
        const name = f === "other" ? "Other (" + other.map(([o]) => famLabel(o)).join(", ") + ")" : famLabel(f);
        a0 = a1;
        return `<path d="${d}" fill="${f === "other" ? OTHER : colorOf(f)}" class="mo-slice" data-tip="${esc(name)}: ${pct(v / total)} of the time"><title>${esc(name)}: ${pct(v / total)}</title></path>`;
      })
      .join("");
    const top = slices.slice().sort((a, b) => b[1] - a[1])[0];
    const legend = slices
      .map(([f, v]) => `<li><i style="background:${f === "other" ? OTHER : colorOf(f)}"></i>${esc(f === "other" ? "Other" : famLabel(f))}<span>${pct(v / total)}</span></li>`)
      .join("");
    const otherList = other.length ? `<p class="mo-small">Other: ${other.map(([o, v]) => `${esc(famLabel(o))} ${pct(v)}`).join(", ")}.</p>` : "";
    return `<div class="mo-pie"><svg viewBox="0 0 160 160" role="img" aria-label="Share of time on each family">${arcs}
        <text x="80" y="78" text-anchor="middle" class="mo-pie-big">${pct(top[1] / total)}</text>
        <text x="80" y="94" text-anchor="middle" class="mo-pie-small">${esc(top[0] === "other" ? "Other" : famLabel(top[0]))}</text></svg>
        <ul class="mo-legend">${legend}</ul></div>${otherList}`;
  }
  /* Timeline: a band of who held attention (by family), cue marks at each move, and under it how long the
     current family had held attention at each moment (it climbs, then drops when attention moves). */
  function timelineHtml(reading) {
    const segs = reading.segments;
    if (!segs.length) return `<p class="mo-empty">No attention yet.</p>`;
    const W = 1000;
    const t0 = segs[0].from;
    const t1 = Math.max(segs[segs.length - 1].to, t0 + 1);
    const x = (t) => ((t - t0) / (t1 - t0)) * W;
    const runs = A.familyRuns(segs);
    const lim = reading.limit;
    const yMax = Math.max(lim * 1.25, ...runs.map((r) => r.dur)) || 1;
    const H = 120;
    const y = (s) => H - (s / yMax) * H;
    const band = segs
      .map((s, i) => {
        const x0 = x(s.from);
        const w = Math.max(1, x(s.to) - x0 - (i < segs.length - 1 ? 2 : 0));
        return `<rect x="${x0.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="26" rx="3" fill="${colorOf(s.family)}" class="mo-seg" data-i="${i}"></rect>`;
      })
      .join("");
    const showCues = segs.length <= 80;
    const at = (t) => ((x(t) / W) * 100).toFixed(2) + "%";
    const cues = showCues
      ? segs
          .map((s, i) => (i === 0 ? "" : `<span style="left:${at(s.from)}" title="${esc(cueLabel(s.cue))}${s.quiet ? " (quiet)" : ""}">${esc((s.quiet ? "·" : "") + s.cue[0].toUpperCase())}</span>`))
          .join("")
      : "";
    let path = "";
    runs.forEach((r) => {
      path += `M ${x(r.from).toFixed(1)} ${y(0).toFixed(1)} L ${x(r.to).toFixed(1)} ${y(r.dur).toFixed(1)} `;
    });
    const over = runs
      .filter((r) => r.dur > lim)
      .map((r) => `<line x1="${x(r.from + lim).toFixed(1)}" x2="${x(r.to).toFixed(1)}" y1="${y(lim).toFixed(1)}" y2="${y(r.dur).toFixed(1)}" class="mo-over" vector-effect="non-scaling-stroke"></line>`)
      .join("");
    const ticks = [];
    const span = t1 - t0;
    const step = span > 1800 ? 300 : span > 600 ? 60 : span > 120 ? 30 : span > 40 ? 10 : 5;
    for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) ticks.push(`<span style="left:${at(t)}">${A.clock(t)}</span>`);
    return `<div class="mo-tl" data-t0="${t0}" data-t1="${t1}">
      <svg viewBox="0 0 ${W} 26" preserveAspectRatio="none" class="mo-tl-band" role="img" aria-label="Which family held attention over time">${band}</svg>
      ${showCues ? `<div class="mo-tl-cues" aria-hidden="true">${cues}</div>` : ""}
      <div class="mo-tl-plot">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="mo-tl-line" role="img" aria-label="How long the current family had held attention, against the limit">
          <line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="mo-base" vector-effect="non-scaling-stroke"></line>
          <line x1="0" x2="${W}" y1="${y(lim).toFixed(1)}" y2="${y(lim).toFixed(1)}" class="mo-limit" vector-effect="non-scaling-stroke"></line>
          <path d="${path}" class="mo-run" vector-effect="non-scaling-stroke"></path>${over}
          <line class="mo-cross" x1="0" x2="0" y1="0" y2="${H}" visibility="hidden" vector-effect="non-scaling-stroke"></line>
        </svg>
        <span class="mo-limit-l" style="top:${((y(lim) / H) * 100).toFixed(1)}%">limit ${lim} s</span>
      </div>
      <div class="mo-ticks">${ticks.join("")}</div>
      <div class="mo-tip" hidden></div>
      <p class="mo-small">Top: who held attention (colors as in the ring). Letters: the cue that moved it on (V visual, A audio, T thought, M movement, P plot; a dot means a quiet cue, something stopping). Below: how long one family had held attention, climbing until attention moves; the red part is past the limit.</p>
    </div>`;
  }
  function cueHtml(stats) {
    const cues = M.CUES.map((c) => [c, (stats.cueShare || {})[c.id] || 0]);
    return `<ul class="mo-bars">${cues
      .map(([c, v]) => `<li title="${esc(c.plain)}"><span class="mo-bar-l">${esc(c.label)}</span><span class="mo-bar"><i style="width:${Math.round(v * 100)}%"></i></span><span class="mo-bar-v">${pct(v)}</span></li>`)
      .join("")}<li><span class="mo-bar-l">Quiet cues</span><span class="mo-bar"><i style="width:${Math.round((stats.quietShare || 0) * 100)}%"></i></span><span class="mo-bar-v">${pct(stats.quietShare)}</span></li></ul>
      <p class="mo-small">Quiet cues are a stop rather than a start: the music cuts out, a silence, someone goes still. They count inside the five kinds too.</p>`;
  }
  /* Every move between families, counted: from where, to where, how often, on which cue, by which curiosity,
     and the cue the films you compare with use for the same move (measured films only). */
  function movesHtml(stats, picked) {
    const rows = [];
    Object.entries(stats.moveCues || {}).forEach(([a, row]) =>
      Object.entries(row).forEach(([b, c]) => {
        const by = {};
        (stats.moves || []).filter((m) => m.from === a && m.to === b).forEach((m) => (by[m.label] = (by[m.label] || 0) + 1));
        rows.push({ a, b, c, by: Object.entries(by).sort((x, y) => y[1] - x[1]).slice(0, 2).map((x) => x[0]) });
      })
    );
    if (!rows.length) return `<p class="mo-small">Attention has not moved between families yet.</p>`;
    rows.sort((x, y) => y.c.n - x.c.n);
    const measured = (picked || []).filter((p) => p.moveCues);
    const theirs = (r) => {
      const h = measured.length ? R.howItMoves(measured, r.a, r.b) : null;
      return h ? `${esc(cueLabel(h.cue))} <small>${pct(h.share)}</small>` : `<small>${measured.length ? "never" : "measure a film"}</small>`;
    };
    const main = (c) => {
      const [cue, k] = Object.entries(c.cues).sort((x, y) => y[1] - x[1])[0];
      return `${esc(cueLabel(cue))} <small>${pct(k / c.n)}</small>`;
    };
    return `<div class="mo-scroll"><table class="mo-moves"><thead><tr><th>From</th><th>To</th><th>Times</th><th>Main cue</th><th>Something stopped</th><th>What took it</th><th>Your films' cue</th></tr></thead><tbody>${rows
      .slice(0, 12)
      .map((r) => `<tr><td><i class="mo-key" style="background:${colorOf(r.a)}"></i>${esc(famLabel(r.a))}</td><td><i class="mo-key" style="background:${colorOf(r.b)}"></i>${esc(famLabel(r.b))}</td><td>${r.c.n}</td><td>${main(r.c)}</td><td>${pct(r.c.quiet / r.c.n)}</td><td>${esc(r.by.join(", "))}</td><td>${theirs(r)}</td></tr>`)
      .join("")}</tbody></table></div>
      <p class="mo-small">${rows.length > 12 ? `The 12 most common of ${rows.length} moves. ` : ""}"Something stopped" counts quiet cues: the move came from a stop (music cutting out, a silence, stillness), not a start. "Your films' cue" needs a measured film in Compare with (Film rates, Measure a traced film); estimated films have no counts.</p>`;
  }
  function tableHtml(reading) {
    return `<details class="mo-table"><summary>Every stretch as a table (${reading.segments.length})</summary><table><thead><tr><th>From</th><th>Curiosity</th><th>Family</th><th>Cue that brought it</th><th>Seconds</th></tr></thead><tbody>${reading.segments
      .map((s, i) => `<tr><td>${A.clock(s.from)}</td><td>${esc(s.label)}</td><td>${esc(famLabel(s.family))}</td><td>${i === 0 ? "start" : esc(cueLabel(s.cue)) + (s.quiet ? " (quiet)" : "")}</td><td>${s.dur}</td></tr>`)
      .join("")}</tbody></table></details>`;
  }

  /* ---------- tabs ---------- */
  let host = null;
  function attentionHtml(boxClass) {
    const list = sources();
    ensureSource(list);
    const groups = [...new Set(list.map((s) => s.group))];
    const options = groups.map((g) => `<optgroup label="${esc(g)}">${list.filter((s) => s.group === g).map((s) => `<option value="${esc(s.id)}"${s.id === prefs.source ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</optgroup>`).join("");
    const cmp = profiles()
      .map((p) => `<label class="mo-chip"><input type="checkbox" data-cmp="${esc(p.id)}"${prefs.compare.includes(p.id) ? " checked" : ""}/> ${esc(p.title)}${p.estimate ? " <small>est.</small>" : " <small>measured</small>"}</label>`)
      .join("");
    return `<div class="mo-controls">
        <label>Film <select data-m="source">${options}</select></label>
        <label>Seconds per panel <input type="number" min="0.5" max="60" step="0.5" value="${prefs.secondsPerPanel}" data-m="spp" title="Panels and storyboard frames have no clock; this sets how long each one lasts." /></label>
        <label>Limit (seconds) <input type="number" min="2" max="600" step="1" value="${prefs.limit || ""}" placeholder="${R.limitFor(target())}" data-m="limit" title="How long one family may hold attention before the meter warns. Empty: 2.5 times the usual stretch in the films you compare with." /></label>
        ${prefs.source === "live" ? `<button type="button" data-m="restart">Start the clock again</button>` : ""}
      </div>
      <details class="mo-compare"><summary>Compare with: ${esc((target() || { title: "nothing" }).title)}</summary><div class="mo-chips">${cmp}</div><p class="mo-small">Films marked est. are Claude's estimates from general film knowledge, not measurements. Measure a traced film in Film rates to get real numbers.</p></details>
      <div class="${boxClass || "mo-attn"}"></div>`;
  }
  function drawAttention(liveTick) {
    const box = host && host.querySelector(".mo-attn");
    if (!box) return;
    if (prefs.tab !== "attention") return;
    if (prefs.source === "live") startLive();
    else stopLive();
    const reading = readSource(prefs.source);
    const tgt = target();
    const sentences = R.compare(reading.stats, tgt);
    const open = box.querySelector(".mo-table") && box.querySelector(".mo-table").open;
    const liveHint = prefs.source === "live" && reading.segments.length <= 1 ? `<p class="mo-empty">My film, live follows what you play: press Play or change a control on My film, and the meter follows it.</p>` : "";
    box.innerHTML = `${liveHint}${meterHtml(reading)}${tilesHtml(reading, tgt)}
      <div class="mo-grid">
        <section><h3>Where attention went</h3>${pieHtml(reading.stats)}</section>
        <section><h3>What moved it on</h3>${cueHtml(reading.stats)}</section>
      </div>
      <section><h3>Over time</h3>${timelineHtml(reading)}</section>
      <section><h3>How attention moves</h3>${movesHtml(reading.stats, profiles().filter((p) => prefs.compare.includes(p.id)))}</section>
      <div class="mo-grid">
        <section><h3>Held too long</h3>${reading.warnings.length ? `<ul class="mo-warn">${reading.warnings.map((w) => `<li><span class="mo-status mo-crit">■</span> ${esc(w.text)}</li>`).join("")}</ul>` : `<p class="mo-small"><span class="mo-status mo-good">●</span> No family held attention past the ${reading.limit} second limit.</p>`}</section>
        <section><h3>Against ${esc(tgt ? tgt.title : "nothing picked")}</h3>${sentences.length ? `<ul class="mo-sent">${sentences.slice(0, 5).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : `<p class="mo-small">Pick a film to compare with.</p>`}</section>
      </div>
      ${tableHtml(reading)}`;
    if (open) box.querySelector(".mo-table").open = true;
    wireTimeline(box, reading);
    if (!liveTick) box.dataset.read = String(reading.segments.length);
  }
  function wireTimeline(box, reading) {
    const tl = box.querySelector(".mo-tl");
    if (!tl) return;
    const tip = tl.querySelector(".mo-tip");
    const cross = tl.querySelector(".mo-cross");
    const t0 = Number(tl.dataset.t0);
    const t1 = Number(tl.dataset.t1);
    const runs = A.familyRuns(reading.segments);
    function show(ev) {
      const svg = tl.querySelector(".mo-tl-band");
      const r = svg.getBoundingClientRect();
      const fx = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const t = t0 + fx * (t1 - t0);
      const s = reading.segments.find((g) => t >= g.from && t < g.to) || reading.segments[reading.segments.length - 1];
      const run = runs.find((g) => t >= g.from && t < g.to);
      const i = reading.segments.indexOf(s);
      const meter = box.querySelector(".mo-meter");
      if (meter && run) meter.outerHTML = meterHtml(reading, { t, seg: s, run: Object.assign({}, run, { dur: t - run.from, count: reading.segments.filter((g) => g.from >= run.from && g.from <= t).length }) });
      tip.hidden = false;
      tip.innerHTML = `<b>${A.clock(t)}</b> · ${esc(s.label)}<br>${esc(famLabel(s.family))}${run ? `, ${Math.round(t - run.from)} s in` : ""}<br><small>${i === 0 ? "Start of the film" : "Brought by a " + esc(cueLabel(s.cue).toLowerCase()) + (s.quiet ? " (quiet)" : "")}</small>`;
      const left = Math.min(r.width - 180, Math.max(0, fx * r.width - 90));
      tip.style.left = left + "px";
      cross.setAttribute("x1", fx * 1000);
      cross.setAttribute("x2", fx * 1000);
      cross.setAttribute("visibility", "visible");
    }
    tl.addEventListener("pointermove", show);
    tl.addEventListener("pointerleave", () => {
      const meter = box.querySelector(".mo-meter");
      if (meter) meter.outerHTML = meterHtml(reading);
      tip.hidden = true;
      cross.setAttribute("visibility", "hidden");
    });
  }

  function ratesHtml() {
    const curated = studies();
    const row = (p) => {
      const top = Object.entries(p.familyShare || {})
        .slice(0, 3)
        .map(([f, v]) => `${esc(famLabel(f))} ${pct(v)}`)
        .join(", ");
      return `<tr><td><label><input type="checkbox" data-cmp="${esc(p.id)}"${prefs.compare.includes(p.id) ? " checked" : ""}/> ${esc(p.title)}${p.year ? ` <small>${p.year}</small>` : ""}</label></td>
        <td>${p.estimate ? `<span class="mo-badge">estimate</span>` : `<span class="mo-badge mo-badge-m">measured</span>`}</td>
        <td>${p.switchesPerMinute}</td><td>${p.medianDwell} s</td><td>${p.medianFamilyRun} s</td><td>${top}</td>
        <td class="mo-why">${esc(p.why || p.source || "")}${p.estimate ? "" : ` <button type="button" data-unmeasure="${esc(p.id)}">Remove</button>`}</td></tr>`;
    };
    return `<p>How fast attention moves in films people love. The default list is <b>Claude's estimates from general film knowledge, not measurements</b>. Measure any traced film below and it joins the list with real numbers. Tick films to compare your own film with them (several ticked are averaged).</p>
      <div class="mo-scroll"><table class="mo-rates"><thead><tr><th>Film</th><th></th><th>Moves a minute</th><th>Usual hold on one curiosity</th><th>Usual hold on one family</th><th>Top families</th><th>Why</th></tr></thead><tbody>${profiles().map(row).join("")}</tbody></table></div>
      <h3>Measure a traced film</h3>
      <p class="mo-small">A traced film is any Curated film (Library, Curated films) or a shared trace file (Library, Share a film). Only counts are read.</p>
      <ul class="mo-measure">${
        curated.length
          ? curated.map((s) => `<li><span>${esc(s.title || s.id)} <small>${(s.beats || []).length} moments${s.curated ? ", made-up practice scene" : ""}</small></span><button type="button" data-measure="${esc(s.id)}">Measure</button></li>`).join("")
          : "<li>No curated films yet.</li>"
      }</ul>`;
  }

  function noteHtml(id) {
    const n = M.note(id);
    const dots = "●".repeat(n.push) + "○".repeat(5 - n.push);
    return `<div class="mo-note"><div class="mo-note-h"><b>${esc(n.label)}</b><span class="mo-fam"><i style="background:${colorOf(n.family)}"></i>${esc(famLabel(n.family))}</span><span class="mo-push" title="Pushes the story: ${n.push} of 5">${dots}</span></div>
      <dl><dt>Moves the plot</dt><dd>${esc(n.plot)}</dd><dt>Builds the themes</dt><dd>${esc(n.theme)}</dd><dt>Pulls attention on</dt><dd>${esc(n.pull)} <small>(usually a ${esc(cueLabel(n.cue).toLowerCase())})</small></dd><dt>Try this</dt><dd>${esc(n.tryThis)}</dd></dl>
      <small class="mo-src">${n.source === "written" ? "Written for this curiosity" : n.source === "database" ? "From the curiosity database" : "From its workspace's note"} · Claude's draft, to check</small></div>`;
  }
  function notesHtml() {
    const fams = M.FAMILIES.map((f) => `<option value="${f.id}"${prefs.noteFamily === f.id ? " selected" : ""}>${esc(f.label)}</option>`).join("");
    return `<p>Every curiosity has a momentum note: how it moves the plot and the themes forward, and how it pulls the audience's attention on into what comes next. Even the clothes and the landscape.</p>
      <div class="mo-controls"><label>Find <input type="search" data-m="nfind" value="${esc(prefs.noteFilter)}" placeholder="clothes, setting, music…" /></label>
      <label>Family <select data-m="nfam"><option value="">All</option>${fams}</select></label></div>
      <div class="mo-notes"></div>`;
  }
  function drawNotes() {
    const box = host && host.querySelector(".mo-notes");
    if (!box) return;
    const q = prefs.noteFilter.trim().toLowerCase();
    const list = M.all()
      .filter((n) => !prefs.noteFamily || n.family === prefs.noteFamily)
      .filter((n) => !q || (n.label + " " + n.plot + " " + n.theme + " " + n.pull + " " + famLabel(n.family)).toLowerCase().includes(q))
      .sort((a, b) => (a.source === b.source ? b.push - a.push : a.source === "written" ? -1 : 1));
    box.innerHTML = `<p class="mo-small">${list.length} curiosities${list.length > 60 ? ", first 60 shown" : ""}.</p>` + list.slice(0, 60).map((n) => noteHtml(n.id)).join("");
  }

  /* ---------- Compass ---------- */
  let lastCompass = null;
  let flash = "";
  function compassSvg(res) {
    const fams = M.FAMILIES;
    const n = fams.length;
    const cx = 150;
    const cy = 150;
    const R0 = 104;
    const scores = Object.fromEntries(res.options.map((o) => [o.family, o.score]));
    const max = Math.max(0.001, ...res.options.map((o) => o.score));
    const best = res.options[0];
    const ang = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2;
    const spokes = fams
      .map((f, i) => {
        const a = ang(i);
        const sc = scores[f.id] || 0;
        const r = 18 + (R0 - 18) * (sc / max);
        const x = cx + Math.cos(a) * R0;
        const y = cy + Math.sin(a) * R0;
        const lx = cx + Math.cos(a) * (R0 + 14);
        const ly = cy + Math.sin(a) * (R0 + (Math.sin(a) > 0.9 ? 22 : 14));
        const isNow = res.now && res.now.family === f.id;
        const anchor = Math.abs(Math.cos(a)) < 0.08 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="mo-spoke"></line>
          ${sc ? `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="5" fill="${colorOf(f.id)}" class="mo-dot"><title>${esc(f.label)}: score ${sc}</title></circle>` : ""}
          <text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${anchor}" class="mo-spoke-l${isNow ? " mo-now" : ""}${best && best.family === f.id ? " mo-best" : ""}">${esc(f.label)}${isNow ? " (now)" : ""}</text>`;
      })
      .join("");
    let needle = "";
    if (best) {
      const i = fams.findIndex((f) => f.id === best.family);
      const a = ang(i);
      needle = `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * (R0 - 8)).toFixed(1)}" y2="${(cy + Math.sin(a) * (R0 - 8)).toFixed(1)}" class="mo-needle"></line><circle cx="${cx}" cy="${cy}" r="6" class="mo-hub"></circle>`;
    }
    return `<svg viewBox="-60 0 420 310" class="mo-compass-svg" role="img" aria-label="Compass pointing to ${esc(best ? best.label : "nothing")}"><circle cx="${cx}" cy="${cy}" r="${R0}" class="mo-ring"></circle>${spokes}${needle}</svg>`;
  }
  function drawCompass() {
    const box = host && host.querySelector(".mo-compass");
    if (!box || !CP()) return;
    if (prefs.source === "live") startLive();
    else stopLive();
    const reading = readSource(prefs.source);
    const list = profiles().filter((p) => prefs.compare.includes(p.id));
    const res = CP().point(reading, list);
    lastCompass = res;
    const now = res.now
      ? `<p class="mo-compass-now">Attention is on <b>${esc(famLabel(res.now.family))}</b> for ${res.now.seconds} seconds. ${res.now.left > 0 ? `Your films usually move on after about ${res.now.usual} seconds: ${res.now.left} left.` : `That is already longer than the usual ${res.now.usual} seconds in your films: move it now.`}</p>`
      : `<p class="mo-compass-now">Nothing holds attention yet.</p>`;
    const opts = res.options
      .slice(0, 3)
      .map(
        (o, i) => `<li class="mo-opt"><div class="mo-opt-h"><span class="mo-fam"><i style="background:${colorOf(o.family)}"></i><b>${i === 0 ? "Next: " : ""}${esc(o.label)}</b></span><small>${esc(cueLabel(o.cue))}</small></div>
          <ul class="mo-reasons">${o.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          ${o.note ? `<p class="mo-small"><b>Try:</b> ${esc(o.note.label)}. ${esc(o.note.tryThis)}</p>` : ""}
          ${window.CuriosityBoard ? `<button type="button" data-compass-move="${i}">Make this move on My film</button>` : ""}</li>`
      )
      .join("");
    box.innerHTML = `${flash ? `<div class="mo-flash" role="status">${esc(flash)}</div>` : ""}
      <div class="mo-grid"><section>${compassSvg(res)}</section><section>${now}<ol class="mo-opts">${opts || "<li>Pick a film to compare with.</li>"}</ol></section></div>
      <p class="mo-small">${res.cue ? `Your films lean on ${esc(cueLabel(res.cue).toLowerCase())}s more than yours does. ` : ""}${res.quiet ? "They also use more quiet cues: try a stop, a silence or stillness. " : ""}${res.basis === "measured" ? "The needle uses which family follows which in your measured films, plus how much time each family gets." : "The needle uses how much time each family gets in your films. Measure a traced film (Film rates) and it also learns which family usually follows which."}</p>`;
    flash = "";
  }

  /* ---------- On the engine ---------- */
  function engineHtml() {
    if (!ME() || !ME().available())
      return `<p>This tab shows My film moment by moment: what holds attention and the cue that moved it there.</p><p class="mo-empty">My film has no moments yet. Press Start the example film to get one you can change, or open the engine to start your own.</p><div class="mo-controls">${startFilmButton()}${window.CurioEngineUI ? `<button type="button" data-m="open-engine">Open the engine</button>` : ""}</div>`;
    const opts = { secondsPerBeat: prefs.secondsPerPanel, limit: limit() };
    const L = ME().lanes(opts);
    const sg = ME().suggestions(opts);
    const head = L.rows.map((r) => `<th>${esc(r.label)}</th>`).join("");
    const att = L.attention.map((c) => `<td title="${esc(c.title)}" class="${c.over ? "mo-cell-over" : ""}">${c.family ? `<i style="background:${colorOf(c.family)}"></i>${esc(famLabel(c.family))}<br><small>${c.seconds} s${c.over ? " ■" : ""}</small>` : ""}</td>`).join("");
    const cue = L.cue.map((c) => `<td title="${esc(c.title)}">${esc(c.text)}</td>`).join("");
    const said = flash;
    flash = "";
    return `${said ? `<div class="mo-flash" role="status">${esc(said)}</div>` : ""}<p>The engine's film as the audience would watch it: which family holds attention at each moment, how long it has held it (■ past the ${L.reading.limit} second limit), and the cue that moved it there. Each moment lasts ${prefs.secondsPerPanel} seconds (set it in Attention).</p>
      <div class="mo-scroll"><table class="mo-lanes"><thead><tr><th></th>${head}</tr></thead><tbody><tr><th>Attention</th>${att}</tr><tr><th>Cue</th>${cue}</tr></tbody></table></div>
      <h3>Suggestions</h3>${
        sg.length
          ? `<ul class="mo-sugg">${sg.map((x, i) => `<li><span>${esc(x.text)}</span><button type="button" data-sugg="${i}">Add this link to the engine</button></li>`).join("")}</ul><p class="mo-small">A link is a proximity: when the leader changes, the follower moves with it. It acts only over the long stretch, and the engine's Undo takes it back.</p>`
          : `<p class="mo-small"><span class="mo-status mo-good">●</span> No family holds attention past the limit, so there is nothing to suggest.</p>`
      }
      ${window.CurioEngineUI ? `<button type="button" data-m="open-engine">Open the engine</button>` : ""}`;
  }

  /* ---------- Perform ---------- */
  let pfUnhook = null;
  function performHtml() {
    if (!PF()) return "<p>Perform is not loaded.</p>";
    const st = PF().settings();
    const outs = PF().midi.outputs();
    const ccIn = (k, label) => `<label title="The control change number (CC) a knob or light on your gear listens to, 0 to 127.">${label} CC <input type="number" min="0" max="127" value="${st.cc[k]}" data-pfset="cc:${k}" /></label>`;
    return `<p>Perform follows My film while it plays and sends the meter out live, so you can see it or feel it on stage. It can send MIDI (the signal music keyboards, synths, stage lights and VCV Rack understand), send the same numbers to other programs through the desktop app's bridge, and buzz a phone when attention has stayed too long.</p>
      <div class="mo-controls">
        <button type="button" data-pf="${PF().running() ? "stop" : "start"}">${PF().running() ? "Stop following My film" : "Start following My film"}</button>
        <button type="button" data-pf="stage">Stage meter (full screen)</button>
      </div>
      <div class="mo-pf-live"></div>
      <h3>MIDI out</h3>
      <p class="mo-small">Each number goes out on its own control change (CC), the number a knob or a light on your gear listens to. Change them to match your gear.</p>
      <div class="mo-controls">
        <button type="button" data-pf="midi">Turn on MIDI</button>
        <label>Output <select data-pfset="output"><option value="">None</option>${outs.map((o) => `<option value="${esc(o.id)}"${o.id === st.output ? " selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>
        <label>Channel <input type="number" min="1" max="16" value="${st.channel}" data-pfset="channel" /></label>
        ${ccIn("attention", "Attention")}${ccIn("momentum", "Momentum")}${ccIn("family", "Family")}${ccIn("compass", "Compass")}
      </div>
      <div class="mo-controls">
        <label class="mo-chip"><input type="checkbox" data-pfset="notes"${st.notes ? " checked" : ""}/> Notes when attention moves (60 visual, 61 audio, 62 thought, 63 movement, 64 plot) and 72 past the limit</label>
        <label class="mo-chip"><input type="checkbox" data-pfset="buzz"${st.buzz ? " checked" : ""}/> Buzz the phone past the limit</label>
        <label class="mo-chip" title="OSC and WebSocket are two ways programs pass numbers to each other. The addresses start with /curio/value/m/."><input type="checkbox" data-pfset="bridge"${st.bridge ? " checked" : ""}/> Send to other programs through the desktop app's bridge</label>
      </div>
      <p class="mo-small mo-pf-status">${esc(PF().midi.status())}${PF().midi.output() ? " Sending to " + esc(PF().midi.output()) + "." : ""}</p>
      <p class="mo-small">The bridge sends five numbers from 0 to 1: m:attention (how long attention has stayed, against the limit), m:over (1 once it is past the limit), m:momentum, m:family (which kind of curiosity holds attention) and m:compass (which kind to move to next). The limit and the films you compare with come from the Attention tab.</p>`;
  }
  function livePanelHtml(s) {
    const st = statusOf(s.family ? { dur: s.seconds } : null, s.limit || 20);
    return `<div class="mo-pf-grid"><div><b>${esc(s.family ? famLabel(s.family) : "Not following yet: press Start following My film.")}</b> <span class="mo-status mo-${st.cls}">${st.icon} ${st.text}</span><br><small>${s.seconds} of ${s.limit} seconds${s.label ? " · now: " + esc(s.label) : ""}</small></div>
      <div><small>Attention</small> ${Math.round(s.attention * 127)} · <small>Momentum</small> ${Math.round(s.momentum * 127)} · <small>Next</small> ${esc(s.compass ? famLabel(s.compass) : "–")}</div></div>`;
  }
  function drawPerform() {
    if (!PF() || !host) return;
    const box = host.querySelector(".mo-pf-live");
    if (box) box.innerHTML = livePanelHtml(PF().state());
    if (!pfUnhook)
      pfUnhook = PF().on((s) => {
        const b = host && host.querySelector(".mo-pf-live");
        if (b) b.innerHTML = livePanelHtml(s);
        drawStage(s);
      });
  }
  function performClick(what) {
    const P = PF();
    if (!P) return;
    if (what === "start") P.start();
    else if (what === "stop") P.stop();
    else if (what === "midi") {
      P.midi.enable().then(() => draw());
      return;
    } else if (what === "stage") {
      if (!P.running()) P.start();
      openStage();
    }
    draw();
  }
  function performChange(t) {
    const P = PF();
    const k = t.dataset.pfset;
    if (k === "output") P.midi.setOutput(t.value);
    else if (k === "channel") P.set({ channel: Number(t.value) });
    else if (k.startsWith("cc:")) P.set({ cc: { [k.slice(3)]: Number(t.value) } });
    else P.set({ [k]: !!t.checked });
    draw();
  }
  /* The stage meter: big enough to read from across a room. A dialog of its own, so it sits above the
     Momentum window; only its inside redraws, so the close button stays put. */
  let stage = null;
  function openStage() {
    if (!stage) {
      stage = document.createElement("dialog");
      stage.className = "mo-stage";
      stage.setAttribute("aria-label", "Stage meter");
      stage.innerHTML = `<button type="button" class="mo-stage-x" data-stage-close aria-label="Close the stage meter">×</button><div class="mo-stage-body"></div>`;
      stage.addEventListener("click", (e) => {
        if (e.target.closest("[data-stage-close]")) closeStage();
      });
      stage.addEventListener("close", () => {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      });
      document.body.appendChild(stage);
    }
    if (!stage.open) {
      if (stage.showModal) stage.showModal();
      else stage.setAttribute("open", "");
    }
    if (stage.requestFullscreen) stage.requestFullscreen().catch(() => {});
    if (!pfUnhook && PF()) pfUnhook = PF().on((s) => drawStage(s));
    drawStage(PF().state());
  }
  function closeStage() {
    if (stage && stage.open) {
      if (stage.close) stage.close();
      else stage.removeAttribute("open");
    }
  }
  function drawStage(s) {
    if (!stage || !stage.open) return;
    const st = statusOf(s.family ? { dur: s.seconds } : null, s.limit || 20);
    stage.className = "mo-stage mo-stage-" + st.cls;
    stage.querySelector(".mo-stage-body").innerHTML = `<div class="mo-stage-fam">${esc(s.family ? famLabel(s.family) : "Waiting for My film")}</div>
      <div class="mo-stage-bar"><i style="width:${Math.round(Math.min(1, s.attention) * 100)}%"></i></div>
      <div class="mo-stage-n">${st.icon} ${Math.round(s.seconds)} s <small>of ${s.limit}</small></div>
      <div class="mo-stage-next">Next: ${esc(s.compass ? famLabel(s.compass) : "–")}</div>`;
  }

  /* Every tab in its group, in the old order within each group (built-in tabs, added tabs, then after: "end"). */
  function tabList() {
    const flat = [
      ["attention", "Attention"],
      ["compass", "Compass"],
      ["engine", "On the engine"],
      ...extraTabs.filter((t) => t.after !== "end").map((t) => [t.id, t.label, t.group]),
      ["perform", "Perform"],
      ["rates", "Film rates"],
      ["notes", "Momentum notes"],
      ...extraTabs.filter((t) => t.after === "end").map((t) => [t.id, t.label, t.group]),
    ].map(([id, label, g]) => ({ id, label, group: groupOf(id, g) }));
    return GROUPS.map((g) => Object.assign({}, g, { tabs: flat.filter((t) => t.group === g.id) })).filter((g) => g.tabs.length);
  }
  /* "Start here": a one-line hint shown until the person opens Learn it or hides the hint. */
  const START_KEY = "curiosities-momentum-start-v1";
  function startSeen() {
    try {
      return localStorage.getItem(START_KEY) === "1";
    } catch (e) {
      return false;
    }
  }
  function markStartSeen() {
    try {
      localStorage.setItem(START_KEY, "1");
    } catch (e) {}
  }

  /* The added tab on show, so it can be told when it is left (spec.unmount). */
  let shownExt = null;
  function leaveExt(next) {
    const was = shownExt;
    if (!was || was === next) return;
    shownExt = null;
    try {
      if (typeof was.unmount === "function") was.unmount();
    } catch (e) {}
  }
  function draw() {
    if (!host) return;
    const groups = tabList();
    const all = groups.reduce((a, g) => a.concat(g.tabs), []);
    const cur = all.find((t) => t.id === prefs.tab) || all[0];
    const hasLesson = all.some((t) => t.id === "lesson");
    if (prefs.tab === "lesson") markStartSeen();
    const showStart = hasLesson && !startSeen();
    const ext = extraTabs.find((t) => t.id === prefs.tab);
    leaveExt(ext);
    const tabBtn = (t) => `<button type="button" role="tab" aria-selected="${prefs.tab === t.id}" data-tab="${esc(t.id)}">${esc(t.label)}</button>`;
    host.innerHTML = `<div class="mo-in">
      <div class="mo-head"><h2>Momentum</h2>${dlg ? `<button type="button" class="mo-x" data-m="close" aria-label="Close">×</button>` : ""}</div>
      <p class="mo-lede">The heart of the app: the feeling that the film is going somewhere important. Attention can rest on only one thing at a time; when what holds it keeps changing, the film stays alive.</p>
      ${showStart ? `<p class="mo-start"><b>Start here:</b> <button type="button" data-m="start">Open Learn it</button> <span>a short walk through a film, one moment at a time.</span> <button type="button" class="mo-start-x" data-m="start-hide" aria-label="Hide this hint">Hide</button></p>` : ""}
      <div class="mo-nav">
        <div class="mo-tabs">${groups
          .map((g) => `<div class="mo-tabgroup${cur.group === g.id ? " on" : ""}" data-tabgroup="${g.id}"><span class="mo-tabgroup-name" id="mo-g-${g.id}">${g.label}</span><div class="mo-tabrow" role="tablist" aria-labelledby="mo-g-${g.id}">${g.tabs.map(tabBtn).join("")}</div></div>`)
          .join("")}</div>
        <p class="mo-group-hint">${esc((groups.find((g) => g.id === cur.group) || {}).hint || "")}</p>
        ${wordsHtml()}
      </div>
      <div class="mo-body">${ext ? `<div class="mo-ext" data-ext="${esc(ext.id)}"></div>` : prefs.tab === "rates" ? ratesHtml() : prefs.tab === "notes" ? notesHtml() : prefs.tab === "compass" ? attentionHtml("mo-compass") : prefs.tab === "engine" ? engineHtml() : prefs.tab === "perform" ? performHtml() : attentionHtml()}</div></div>`;
    if (prefs.tab === "attention") drawAttention();
    else if (prefs.tab === "compass") drawCompass();
    else stopLive();
    if (prefs.tab === "notes") drawNotes();
    if (prefs.tab === "perform") drawPerform();
    if (ext) {
      shownExt = ext;
      try {
        ext.mount(host.querySelector(".mo-ext"), context());
      } catch (e) {
        host.querySelector(".mo-ext").textContent = ext.label + " could not open: " + e.message;
      }
    }
    stackTables(host);
  }

  /* On a phone the wide tables (one film or one move per row) turn into small cards: each cell gets its column's
     name (data-l), which momentum.css shows before it under 600 pixels. Tables that are timelines (On the
     engine) keep scrolling sideways instead. */
  const STACK = "table.mo-rates, table.mo-moves, table.pc-nums, details.mo-table table";
  function stackTables(el) {
    if (!el || !el.querySelectorAll) return;
    el.querySelectorAll(STACK).forEach((tb) => {
      if (tb.dataset.stacked) return;
      tb.dataset.stacked = "1";
      tb.classList.add("mo-stack");
      const names = [...tb.querySelectorAll("thead th")].map((th) => th.textContent.trim());
      tb.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => names[i] && !td.dataset.l && (td.dataset.l = names[i])));
    });
  }
  let stackQueued = false;
  function stackSoon() {
    if (stackQueued) return;
    stackQueued = true;
    setTimeout(() => {
      stackQueued = false;
      stackTables(host);
    }, 0);
  }
  function wire(el) {
    ["click", "change", "input"].forEach((type) => el.addEventListener(type, stackSoon));
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || !el.contains(t)) return;
      if (t.dataset.tab) {
        prefs.tab = t.dataset.tab;
        savePrefs();
        draw();
      } else if (t.dataset.m === "start") {
        markStartSeen();
        prefs.tab = "lesson";
        savePrefs();
        draw();
      } else if (t.dataset.m === "start-hide") {
        markStartSeen();
        draw();
      } else if (t.dataset.m === "close") close();
      else if (t.dataset.m === "restart") {
        stopLive();
        drawAttention();
      } else if (t.dataset.measure) {
        const s = studies().find((x) => x.id === t.dataset.measure);
        if (!s) return;
        const p = R.measure(s, { secondsPerBeat: prefs.secondsPerPanel });
        prefs.measured = prefs.measured.filter((x) => x.id !== p.id).concat([p]);
        if (!prefs.compare.includes(p.id)) prefs.compare.push(p.id);
        savePrefs();
        draw();
      } else if (t.dataset.compassMove != null) {
        const opt = lastCompass && lastCompass.options[Number(t.dataset.compassMove)];
        const B = window.CuriosityBoard;
        const mv = CP() && CP().move(opt, B);
        if (mv && B) {
          B.set(mv.id, mv.value);
          flash = `Moved ${mv.label} to ${mv.value} on My film.`;
        } else flash = "No control on My film belongs to that family yet; use the note's idea instead.";
        drawCompass();
      } else if (t.dataset.sugg != null) {
        const sg = (ME() ? ME().suggestions({ secondsPerBeat: prefs.secondsPerPanel, limit: limit() }) : [])[Number(t.dataset.sugg)];
        const res = sg ? ME().addSuggestion(sg) : { ok: false, error: "That suggestion is gone." };
        flash = res && res.ok ? "Added the link to the engine. Undo in the engine takes it back." : "The engine said: " + ((res && res.error) || "no");
        draw();
      } else if (t.dataset.m === "start-film") {
        if (startFilm()) {
          prefs.source = "engine";
          savePrefs();
        }
        draw();
      } else if (t.dataset.m === "open-engine") {
        if (window.CurioEngineUI && window.CurioEngineUI.open) {
          close();
          window.CurioEngineUI.open();
        }
      } else if (t.dataset.pf) {
        performClick(t.dataset.pf);
      } else if (t.dataset.unmeasure) {
        prefs.measured = prefs.measured.filter((x) => x.id !== t.dataset.unmeasure);
        prefs.compare = prefs.compare.filter((x) => x !== t.dataset.unmeasure);
        savePrefs();
        draw();
      }
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.cmp) {
        prefs.compare = prefs.compare.filter((x) => x !== t.dataset.cmp).concat(t.checked ? [t.dataset.cmp] : []);
        savePrefs();
        draw();
      } else if (t.dataset.m === "source") {
        prefs.source = t.value;
        stopLive();
        savePrefs();
        draw();
      } else if (t.dataset.m === "spp") {
        prefs.secondsPerPanel = Number(t.value) > 0 ? Number(t.value) : 3;
        savePrefs();
        drawAttention();
      } else if (t.dataset.m === "limit") {
        prefs.limit = Number(t.value) > 0 ? Number(t.value) : null;
        savePrefs();
        drawAttention();
      } else if (t.dataset.pfset) {
        performChange(t);
      } else if (t.dataset.m === "nfam") {
        prefs.noteFamily = t.value;
        savePrefs();
        drawNotes();
      }
    });
    el.addEventListener("input", (e) => {
      if (e.target.dataset.m === "nfind") {
        prefs.noteFilter = e.target.value;
        savePrefs();
        drawNotes();
      }
    });
  }

  /* ---------- open as a window, or mount into a page ---------- */
  let dlg = null;
  function mount(el) {
    host = el;
    host.classList.add("mo-root");
    if (!host.dataset.moWired) {
      wire(host);
      host.dataset.moWired = "1";
    }
    draw();
  }
  function open(tab) {
    if (tab) prefs.tab = tab;
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "mo-dlg";
      dlg.addEventListener("close", () => {
        stopLive();
        leaveExt(null);
      });
      document.body.appendChild(dlg);
    }
    mount(dlg);
    if (!dlg.open) {
      if (dlg.showModal) dlg.showModal();
      else dlg.setAttribute("open", "");
    }
  }
  function close() {
    stopLive();
    leaveExt(null);
    if (dlg && dlg.open) {
      if (dlg.close) dlg.close();
      else dlg.removeAttribute("open");
    }
  }
  function mountNote(el, id) {
    if (el) el.innerHTML = noteHtml(id);
  }

  /* The Library menu gets a Momentum item, near the top: it is the heart of the app. */
  function wireMenu() {
    const menu = document.getElementById("lib-menu");
    if (!menu || menu.querySelector("[data-momentum]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.momentum = "open";
    b.innerHTML = "Momentum<small>attention meter, pie, timeline, momentum notes</small>";
    menu.insertBefore(b, menu.firstChild);
    b.addEventListener("click", () => {
      menu.hidden = true;
      const lb = document.getElementById("lib-btn");
      if (lb) lb.setAttribute("aria-expanded", "false");
      open();
    });
  }
  /* When the engine offers bands under its timeline (requested: CurioEngineUI.addBand), show the Attention
     and Cue lanes there too. */
  function wireEngineBand() {
    const U = window.CurioEngineUI;
    if (!U || typeof U.addBand !== "function" || U.__momentumBand || !ME()) return;
    U.__momentumBand = true;
    U.addBand(() => (ME().available() ? ME().band({ secondsPerBeat: prefs.secondsPerPanel, limit: limit() }) : null));
  }
  function wireAll() {
    wireMenu();
    wireEngineBand();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireAll);
  else wireAll();

  window.CurioMomentumUI = { open, close, mount, noteHtml, mountNote, draw, addTab, context, WORDS, startFilm, startFilmButton, stackTables };
})();
