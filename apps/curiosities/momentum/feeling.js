/* momentum/feeling.js: the emotional road against attention ("Feeling road"). Jeremy: emotion is a major
   curiosity, with an emotional road for each character and for the whole film. This lays each road (the
   feeling, scene by scene, placed on the feeling scale) under one attention ribbon of My film (the engine's
   film, the one the Screen plays), and finds three things:
     flat     a stretch where a character's feeling stays the same for several scenes while attention also
              stalls (it never moves to another family inside the stretch), with a suggestion to turn the
              feeling there: one step up or down the scale, toward the value the road reaches next
     missed   a big feeling turn in a scene where attention never rests on Feeling, so the audience may not
              notice it
     align    how many feeling turns come with a move of attention in the same scene

   Where the roads come from: the story store (story.js, window.CuriosityStory: the Emotional road workspace,
   one "emotion" word per character per scene, plus "The film"). When no feeling is set there yet, the
   engine film's feeling lanes: the "emotion" curiosity on the Master track (the film's road) and on any
   character track, one scene per engine row.
   Where a suggestion is written: back where its road came from, so the road on screen and its undo agree.
   A story road goes through CuriosityStory.applyRoad (its own undo: CuriosityStory.undoRoad); an engine road
   goes through CurioEngine.send as one batch (one engine undo step). The Screen reads only the engine, so only
   an engine road's change shows on the Screen; a story road's change shows in the Emotional road workspace.

   The scale: CurioScale.domain("emotion"), which orders the emotions from calm to charged (engine/catalog.js
   ENERGY): dreamlike, melancholy, loving, curious, absurd, joyful, anxious, fearful, triumphant, angry.

   Part of the momentum core (no page) plus a tab in the Momentum window, "Feeling road" (when ui.js is here).

   window.CurioFeeling
   - feelingRoad(reading, roads, opts) -> { scenes, beats, unit, scale, spans, sceneInfo, ribbon, roads, flat,
       missed, align, sentences }   pure, works in Node
       reading: a CurioAttention reading ({ segments, beats })
       roads: [{ id, label, film?, values: [feeling word or null, one per scene], source?, track? }]
       opts: { flatScenes: 3 (scenes the same before it counts as flat), bigTurn: 3 (steps on the scale that
               make a big turn), scale: [words] (default CurioScale's emotion order), unit: "scene" | "moment" }
       flat: [{ road, label, from, to, value, families, suggest: { scene, from, to, toward, towardScene, dir, text } , text }]
       missed: [{ road, label, scene, from, to, steps, families, text }]
       align: { turns, aligned, share, byRoad: { id: { turns, aligned } }, text }
   - storyRoads(), engineRoads(), roads() -> { source: "story" | "engine", roads, scenes }
   - apply(suggestion) -> { ok, error?, undo: "story" | "engine" }; undo() puts the last applied one back. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const FEEL_ID = "emotion";
  const FALLBACK_SCALE = ["dreamlike", "melancholy", "loving", "curious", "absurd", "joyful", "anxious", "fearful", "triumphant", "angry"];
  const DEFAULTS = { flatScenes: 3, bigTurn: 3, unit: "scene" };

  function scaleList() {
    try {
      const d = root.CurioScale && root.CurioScale.domain(FEEL_ID);
      if (d && d.kind === "choice" && d.options && d.options.length > 1) return d.options.slice();
    } catch (e) {}
    return FALLBACK_SCALE.slice();
  }
  const famLabel = (f) => {
    const x = M() && M().family ? M().family(f) : null;
    return x ? x.label : String(f || "nothing");
  };
  const listWords = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
  const famWords = (fams) => (fams.length ? listWords(fams.map(famLabel)) : "nothing yet");

  /* The beats one scene covers: its share of the film, at least one beat. */
  function spanOf(i, S, B) {
    if (!B) return [0, -1];
    const a = Math.min(B - 1, Math.floor((i * B) / S));
    const z = Math.max(a, Math.min(B - 1, Math.floor(((i + 1) * B) / S) - 1));
    return [a, z];
  }

  function feelingRoad(reading, roads, options) {
    const o = Object.assign({}, DEFAULTS, options || {});
    const scale = Array.isArray(o.scale) && o.scale.length > 1 ? o.scale.map(String) : scaleList();
    const lower = scale.map((w) => w.toLowerCase());
    const idxOf = (v) => (v == null || v === "" ? null : lower.indexOf(String(v).toLowerCase()) >= 0 ? lower.indexOf(String(v).toLowerCase()) : null);
    const top = scale.length - 1;
    const unit = o.unit === "moment" ? "moment" : "scene";
    const flatN = Math.max(2, Math.round(Number(o.flatScenes) || DEFAULTS.flatScenes));
    const big = Math.max(1, Number(o.bigTurn) || DEFAULTS.bigTurn);

    roads = (roads || []).filter((r) => r && Array.isArray(r.values));
    const S = Math.max(0, Number(o.scenes) || 0, ...roads.map((r) => r.values.length));
    const segs = ((reading && reading.segments) || []).slice().sort((a, b) => a.beat - b.beat);
    const B = Math.max(Number(reading && reading.beats) || 0, segs.length ? segs[segs.length - 1].beat + 1 : 0);

    /* Attention beat by beat: the family holding it, and whether it moved to a new family there. */
    const ribbon = [];
    let k = -1;
    for (let b = 0; b < B; b++) {
      while (k + 1 < segs.length && segs[k + 1].beat <= b) k++;
      const s = k >= 0 ? segs[k] : null;
      const prev = ribbon[b - 1];
      const fam = s ? s.family : null;
      const move = !!(s && s.beat === b && prev && prev.family && prev.family !== fam);
      ribbon.push({ beat: b, family: fam, curiosity: s ? s.curiosity : null, label: s ? s.label : "", cue: s && s.beat === b ? s.cue : null, quiet: !!(s && s.quiet && s.beat === b), move, start: !!(s && s.beat === b && !(prev && prev.family)) });
    }

    const spans = Array.from({ length: S }, (_, i) => spanOf(i, S, B));
    const sceneInfo = spans.map(([a, z]) => {
      const fams = [];
      const movedTo = [];
      let moves = 0;
      for (let b = a; b <= z; b++) {
        const r = ribbon[b];
        if (!r) continue;
        if (r.family && !fams.includes(r.family)) fams.push(r.family);
        if (r.move) {
          moves++;
          if (!movedTo.includes(r.family)) movedTo.push(r.family);
        }
      }
      return { from: a, to: z, families: fams, moves, movedTo, feeling: fams.includes("feeling") };
    });
    const name = (i) => unit + " " + (i + 1);
    const Name = (i) => (unit === "moment" ? "Moment " : "Scene ") + (i + 1);

    const outRoads = roads.map((r) => {
      const points = [];
      for (let i = 0; i < S; i++) {
        const v = r.values[i];
        const ix = idxOf(v);
        points.push({ scene: i, value: ix == null ? null : scale[ix], step: ix, pos: ix == null ? null : top ? ix / top : 0.5, raw: v == null ? null : v });
      }
      return { id: String(r.id), label: String(r.label || r.id), film: !!r.film, source: r.source || null, track: r.track || null, points, set: points.filter((p) => p.step != null).length };
    });

    const flat = [];
    const missed = [];
    const align = { turns: 0, aligned: 0, share: 0, byRoad: {}, text: "" };
    outRoads.forEach((r) => {
      const P = r.points;
      const tally = (align.byRoad[r.id] = { turns: 0, aligned: 0 });
      /* (3) every turn, and (2) the big ones attention misses. */
      /* A scene with no feeling set is skipped: the turn lands where the next feeling is set. */
      let prevStep = null;
      for (let i = 0; i < S; i++) {
        const a = prevStep;
        const b = P[i].step;
        if (b != null) prevStep = b;
        if (a == null || b == null || a === b) continue;
        align.turns++;
        tally.turns++;
        if (sceneInfo[i].moves > 0) {
          align.aligned++;
          tally.aligned++;
        }
        const steps = Math.abs(b - a);
        if (steps >= big && !sceneInfo[i].feeling) {
          const fams = sceneInfo[i].families;
          missed.push({
            road: r.id,
            label: r.label,
            scene: i,
            from: scale[a],
            to: scale[b],
            steps,
            families: fams.slice(),
            text: `In ${name(i)}, ${r.film ? "the film's feeling" : r.label + "'s feeling"} turns from ${scale[a]} to ${scale[b]} (${steps} steps on the feeling scale), but attention stays on ${famWords(fams)} and never moves to Feeling. The audience may not notice the turn. Give it a face, a voice or a pause, so attention moves to the feeling.`,
          });
        }
      }
      /* (1) flat stretches: the same feeling for flatN scenes or more, with no move of attention inside. */
      let i = 0;
      while (i < S) {
        const v = P[i].step;
        if (v == null) {
          i++;
          continue;
        }
        let j = i;
        while (j + 1 < S && P[j + 1].step === v) j++;
        /* Split the run where attention moves: a move starts a new window. */
        let a = i;
        for (let x = i + 1; x <= j + 1; x++) {
          if (x > j || sceneInfo[x].moves > 0) {
            if (x - a >= flatN) flat.push(flatItem(r, a, x - 1, v));
            a = x;
          }
        }
        i = j + 1;
      }
    });

    function flatItem(r, a, z, v) {
      const P = r.points;
      const fams = [];
      for (let x = a; x <= z; x++) sceneInfo[x].families.forEach((f) => !fams.includes(f) && fams.push(f));
      const at = a + Math.floor((z - a + 1) / 2);
      /* Toward the value the road reaches next; else the one it came from; else up the scale. */
      let toward = null;
      let towardScene = null;
      let why = "";
      for (let x = z + 1; x < S && toward == null; x++) if (P[x].step != null && P[x].step !== v) (toward = P[x].step), (towardScene = x), (why = "next");
      for (let x = a - 1; x >= 0 && toward == null; x--) if (P[x].step != null && P[x].step !== v) (toward = P[x].step), (towardScene = x), (why = "before");
      const dir = toward == null ? (v < top ? 1 : -1) : toward > v ? 1 : -1;
      const to = Math.max(0, Math.min(top, v + dir));
      const who = r.film ? "the film" : r.label;
      const whose = r.film ? "the film's" : r.label + "'s";
      const len = z - a + 1;
      const reason =
        why === "next"
          ? `${Name(towardScene)} goes to ${scale[toward]}, so this starts the road ${dir > 0 ? "up" : "down"} toward it.`
          : why === "before"
          ? `the road has nowhere new to go after this, so this leans back toward ${scale[toward]} from ${name(towardScene)}.`
          : `the road stays ${scale[v]} everywhere, so this simply lifts it one step${dir < 0 ? " down" : ""}.`;
      const suggest = {
        road: r.id,
        label: r.label,
        film: r.film,
        source: r.source,
        track: r.track,
        scene: at,
        from: scale[v],
        to: scale[to],
        toward: toward == null ? null : scale[toward],
        towardScene,
        dir,
        button: `Turn ${whose} feeling to ${scale[to]} in ${name(at)}`,
        text: `Turn ${whose} feeling in ${name(at)} one step ${dir > 0 ? "up" : "down"} the scale, from ${scale[v]} to ${scale[to]}: ${reason.charAt(0).toUpperCase() + reason.slice(1)}`,
      };
      return {
        road: r.id,
        label: r.label,
        from: a,
        to: z,
        scenes: len,
        value: scale[v],
        families: fams,
        suggest,
        text: `${r.film ? "The film" : who} feels ${scale[v]} for ${len} ${unit}s in a row (${name(a)} to ${name(z)}), and attention also stalls there: it stays on ${famWords(fams)} and never moves to something new.`,
      };
    }

    align.share = align.turns ? Math.round((align.aligned / align.turns) * 100) / 100 : 0;
    align.text = align.turns
      ? `${align.aligned} of ${align.turns} feeling turns (${Math.round(align.share * 100)}%) come in a ${unit} where attention also moves to something new. ${
          align.share >= 0.67 ? "Most turns get the audience's attention moving too." : align.share >= 0.34 ? "About half of them do; the others may slip by." : "Most turns happen while attention stays put, so they may slip by."
        }`
      : "No feeling turns yet: every road keeps one feeling from start to end, or has too few feelings set.";

    const sentences = [];
    sentences.push(flat.length ? `${flat.length} flat ${flat.length === 1 ? "stretch" : "stretches"}: a feeling that holds while attention stalls.` : `No flat stretches: no feeling holds for ${flatN} ${unit}s while attention stalls.`);
    sentences.push(missed.length ? `${missed.length} big feeling ${missed.length === 1 ? "turn" : "turns"} that attention misses.` : "Attention catches every big feeling turn.");
    sentences.push(align.text);
    return { scenes: S, beats: B, unit, scale, spans, sceneInfo, ribbon, roads: outRoads, flat, missed, align, sentences, flatScenes: flatN, bigTurn: big };
  }

  /* ---------- where the roads come from (browser) ---------- */
  const ST = () => (root.CuriosityStory && typeof root.CuriosityStory.get === "function" ? root.CuriosityStory : null);
  const EN = () => (root.CurioEngine && root.CurioEngine.state ? root.CurioEngine : null);

  function storyRoads() {
    const S = ST();
    if (!S) return { roads: [], scenes: 0, any: false };
    const names = S.withFilm ? S.withFilm() : S.characters();
    const scenes = S.scenes().length;
    let any = false;
    const roads = names.map((n) => {
      const vals = S.get(n).map((o) => (o && o[FEEL_ID] != null && o[FEEL_ID] !== "" ? o[FEEL_ID] : null));
      if (vals.some((v) => v != null)) any = true;
      const film = S.isFilm ? S.isFilm(n) : n === S.FILM;
      return { id: n, label: film ? "The film" : n, film, values: vals, source: "story" };
    });
    return { roads: roads.filter((r) => r.values.some((v) => v != null)), all: roads, scenes, any };
  }
  function engineRoads() {
    const E = EN();
    if (!E) return { roads: [], scenes: 0 };
    const st = E.state();
    const rows = st.rows || [];
    const roads = (st.tracks || [])
      .filter((t) => (t.kind === "master" || t.kind === "character") && (t.curiosities || []).includes(FEEL_ID))
      .map((t) => ({ id: t.id, label: t.kind === "master" ? "The film" : t.label || t.id, film: t.kind === "master", track: t.id, source: "engine", values: rows.map((r) => {
        const v = E.value(r.id, t.id, FEEL_ID);
        return v == null || v === "" ? null : v;
      }) }));
    /* Characters first, the film last, the same as the story store. */
    roads.sort((a, b) => (a.film === b.film ? 0 : a.film ? 1 : -1));
    return { roads, scenes: rows.length, rows };
  }
  function roads() {
    const s = storyRoads();
    if (s.any) return { source: "story", roads: s.roads, scenes: s.scenes, unit: "scene" };
    const e = engineRoads();
    return { source: "engine", roads: e.roads, scenes: e.scenes, unit: "moment", storyEmpty: !!ST() };
  }

  /* ---------- writing a suggestion back ---------- */
  let last = null;
  const LABEL = "Feeling road";
  function apply(sug) {
    if (!sug || sug.to == null) return { ok: false, error: "That suggestion is gone." };
    const label = `${LABEL}: ${sug.film ? "the film" : sug.label} feels ${sug.to} in ${sug.source === "engine" ? "moment" : "scene"} ${sug.scene + 1}`;
    if (sug.source === "story") {
      const S = ST();
      if (!S || typeof S.applyRoad !== "function") return { ok: false, error: "The story store is not loaded." };
      const n = S.scenes().length;
      const plan = Array.from({ length: n }, (_, i) => ({ values: i === sug.scene ? { [FEEL_ID]: sug.to } : {} }));
      const touched = S.applyRoad(sug.road, plan, label);
      if (!touched) return { ok: false, error: "Nothing changed." };
      last = { undo: "story", label };
      return { ok: true, undo: "story", label };
    }
    const E = EN();
    if (!E) return { ok: false, error: "The engine is not loaded." };
    const st = E.state();
    const row = st.rows[sug.scene];
    const t = st.tracks.find((x) => x.id === sug.track);
    if (!row || !t) return { ok: false, error: "That moment or track is gone." };
    const cmds = [];
    if (!t.curiosities.includes(FEEL_ID)) cmds.push({ type: "addCuriosity", track: t.id, curiosity: FEEL_ID });
    /* A column with automation points is shaped by its lane, so a plain value would not show: pin a hand edit
       on that one cell instead. Otherwise change the cell's own value. */
    const lane = st.lanes && st.lanes[t.id + "|" + FEEL_ID];
    const laned = lane && lane.on !== false && lane.points && Object.keys(lane.points).length;
    cmds.push({ type: laned ? "edit" : "setSource", row: row.id, track: t.id, curiosity: FEEL_ID, value: sug.to });
    const res = E.send({ type: "batch", label, commands: cmds });
    if (!res || !res.ok) return { ok: false, error: (res && res.error) || "The engine said no." };
    last = { undo: "engine", label };
    return { ok: true, undo: "engine", label };
  }
  /* The last change this tab made, while it can still be undone. */
  function pending() {
    if (!last) return null;
    if (last.undo === "story") {
      const S = ST();
      const lr = S && S.lastRoad ? S.lastRoad() : null;
      return lr && lr.label === last.label ? last : null;
    }
    const E = EN();
    const h = E && E.history ? E.history() : null;
    const top = h && h.undo && h.undo.length ? h.undo[h.undo.length - 1] : null;
    return top === last.label || (top && top.label === last.label) ? last : null;
  }
  function undo() {
    const p = pending();
    if (!p) return false;
    last = null;
    if (p.undo === "story") return !!ST().undoRoad();
    const r = EN().undo();
    return r == null || r === true || !!(r && r.ok !== false);
  }

  const api = { feelingRoad, storyRoads, engineRoads, roads, apply, undo, pending, scaleList, DEFAULTS, FEEL_ID };
  root.CurioFeeling = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab ---------- */
  if (typeof document === "undefined") return;
  const COLORS = { feeling: "#2a78d6", plot: "#eb6834", voice: "#1baf7a", comedy: "#eda100", movement: "#e87ba4", music: "#008300", camera: "#4a3aa7", place: "#e34948" };
  const OTHER = "#a8a39a";
  const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
  const FILM_INK = "#1c1712";
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const letterOf = (f) => (famLabel(f) || "?").charAt(0).toUpperCase();

  let unhook = null;
  let mounted = null;
  let flash = "";
  let lastResult = null;

  function mount(el, ctx) {
    mounted = { el, ctx };
    const E = EN();
    if (E && E.on && !unhook)
      unhook = E.on(() => {
        if (!mounted || !mounted.el.isConnected) {
          if (unhook) unhook();
          unhook = null;
          mounted = null;
          return;
        }
        draw(mounted.el, mounted.ctx);
      });
    draw(el, ctx);
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !el.contains(b)) return;
      if (b.dataset.fr === "apply") {
        const it = lastResult && lastResult.flat[Number(b.dataset.i)];
        const res = apply(it && it.suggest);
        flash = res.ok
          ? `Done: ${res.label.replace(LABEL + ": ", "")}. ${res.undo === "engine" ? "Written to the engine (My film, the Screen shows it). Undo here or in the engine takes it back." : "Written to the story store (the Emotional road workspace). Undo here takes it back."}`
          : "That did not work: " + res.error;
        draw(el, ctx);
      } else if (b.dataset.fr === "undo") {
        flash = undo() ? "Undone: the feeling is back as it was." : "There is nothing of this tab's to undo.";
        draw(el, ctx);
      } else if (b.dataset.fr === "workspace") {
        if (root.CurioMomentumUI) root.CurioMomentumUI.close();
        if (root.CuriosityWorkspaces && root.CuriosityWorkspaces.open) root.CuriosityWorkspaces.open("emo-road");
      } else if (b.dataset.fr === "open-engine") {
        if (root.CurioEngineUI && root.CurioEngineUI.open) {
          if (root.CurioMomentumUI) root.CurioMomentumUI.close();
          root.CurioEngineUI.open();
        }
      }
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.frSet) {
        prefs[t.dataset.frSet] = Number(t.value);
        savePrefs();
        draw(el, ctx);
      }
    });
  }

  const PKEY = "curiosities-momentum-feeling-v1";
  const prefs = (() => {
    try {
      return Object.assign({ flatScenes: 3, bigTurn: 3 }, JSON.parse(localStorage.getItem(PKEY)) || {});
    } catch (e) {
      return { flatScenes: 3, bigTurn: 3 };
    }
  })();
  function savePrefs() {
    try {
      localStorage.setItem(PKEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  function draw(el, ctx) {
    const ME = root.CurioMomentumEngine;
    const haveEngine = ME && ME.available && ME.available();
    if (!haveEngine) {
      el.innerHTML = `<div class="mo-fr"><p class="mo-empty">My film (the engine's film, the one the Screen plays) has no moments yet, so there is no attention to lay the feelings over. Start a film in the engine, then come back here.</p>${root.CurioEngineUI ? `<button type="button" class="mo-fr-btn" data-fr="open-engine">Open the engine</button>` : ""}</div>`;
      return;
    }
    const reading = ME.reading({ secondsPerBeat: ctx.secondsPerBeat(), limit: ctx.limit() });
    const src = roads();
    const res = feelingRoad(reading, src.roads, { flatScenes: prefs.flatScenes, bigTurn: prefs.bigTurn, unit: src.unit, scenes: src.scenes });
    lastResult = res;
    const unitWord = res.unit;
    const p = pending();

    const fill = `<p class="mo-fr-fill">Your story has no feelings set yet. To fill it, open the <b>Emotional road</b> workspace (Feeling, then Emotional road), pick a character and choose a feeling for each scene, and one for the film as a whole. Until then this reads the feeling lanes of the engine's film instead${src.roads.length ? "" : ", and it has none yet either: add the Emotion curiosity to a character's track in the engine"}.</p>${root.CuriosityWorkspaces ? `<button type="button" class="mo-fr-btn" data-fr="workspace">Open the Emotional road workspace</button>` : ""}`;
    const head = `<p>Each character's emotional road, and the film's, laid under the attention of My film. A line is one road: higher is a more charged feeling (${esc(res.scale[0])} at the bottom, ${esc(res.scale[res.scale.length - 1])} at the top), one point per ${unitWord}. ${
      src.source === "story"
        ? `The roads come from the story store (${res.scenes} scenes), each scene laid over its share of My film's ${res.beats} moments.`
        : `The roads come from the engine's film: the Emotion on the Master track is the film's road, and Emotion on a character's track is that character's road, one point per moment.`
    }</p>`;
    const controls = `<div class="mo-controls"><label>Flat after <select data-fr-set="flatScenes" aria-label="Flat after how many ${unitWord}s">${[2, 3, 4, 5].map((n) => `<option value="${n}"${n === res.flatScenes ? " selected" : ""}>${n} ${unitWord}s</option>`).join("")}</select></label>
      <label>A big turn is <select data-fr-set="bigTurn" aria-label="Steps that make a big turn">${[2, 3, 4, 5].map((n) => `<option value="${n}"${n === res.bigTurn ? " selected" : ""}>${n} steps or more</option>`).join("")}</select></label></div>`;
    const status = `${flash ? `<p class="mo-fr-flash" role="status">${esc(flash)}</p>` : ""}${p ? `<p class="mo-fr-undo"><button type="button" class="mo-fr-btn" data-fr="undo">Undo: ${esc(p.label.replace(LABEL + ": ", ""))}</button></p>` : ""}`;
    flash = "";

    if (!res.roads.length) {
      el.innerHTML = `<div class="mo-fr">${src.source === "engine" ? fill : ""}${status}<p class="mo-empty">No emotional road to show yet.</p></div>`;
      return;
    }

    /* The chart: the ribbon on top, one road per row, all on the same width. */
    const B = res.beats || 1;
    const S = res.scenes || 1;
    const ribbon = res.ribbon
      .map((r) => {
        const c = r.family ? COLORS[r.family] || OTHER : "transparent";
        const t = r.family ? `Moment ${r.beat + 1}: attention on ${famLabel(r.family)}${r.label ? " (" + r.label + ")" : ""}${r.move ? ", it just moved here" : ""}` : `Moment ${r.beat + 1}: nothing holds attention yet`;
        return `<span class="mo-fr-cell${r.move ? " mo-fr-move" : ""}" style="background:${c}" title="${esc(t)}" aria-label="${esc(t)}">${r.family && (r.move || r.start) ? esc(letterOf(r.family)) : ""}</span>`;
      })
      .join("");
    const ticks = Array.from({ length: S }, (_, i) => `<span>${i + 1}</span>`).join("");
    const flatBy = {};
    res.flat.forEach((f, i) => (flatBy[f.road] = (flatBy[f.road] || []).concat([Object.assign({ i }, f)])));
    const missBy = {};
    res.missed.forEach((m) => (missBy[m.road] = (missBy[m.road] || []).concat([m])));
    let ci = 0;
    const rows = res.roads
      .map((r) => {
        const color = r.film ? FILM_INK : PALETTE[ci++ % PALETTE.length];
        const x = (i) => ((i + 0.5) / S) * 100;
        const y = (pos) => 22 - pos * 20;
        const pts = r.points.filter((q) => q.pos != null);
        /* A line through the set points, broken where a scene has none. */
        let d = "";
        r.points.forEach((q, i) => {
          if (q.pos == null) return;
          d += (i > 0 && r.points[i - 1].pos != null ? "L" : "M") + x(i).toFixed(2) + " " + y(q.pos).toFixed(2) + " ";
        });
        const bands = (flatBy[r.id] || []).map((f) => `<rect x="${((f.from / S) * 100).toFixed(2)}" y="0" width="${(((f.to - f.from + 1) / S) * 100).toFixed(2)}" height="24" class="mo-fr-flatband"/>`).join("");
        const dots = pts.map((q) => `<line x1="${x(q.scene).toFixed(2)}" y1="${y(q.pos).toFixed(2)}" x2="${x(q.scene).toFixed(2)}" y2="${y(q.pos).toFixed(2)}" stroke="${color}" class="mo-fr-dot"/>`).join("");
        const marks = (missBy[r.id] || []).map((m) => `<span class="mo-fr-mark" style="left:${x(m.scene).toFixed(2)}%" title="${esc(m.text)}">!</span>`).join("");
        const words = r.points.map((q) => `${q.scene + 1}: ${q.value || "not set"}`).join(", ");
        return `<div class="mo-fr-row"><span class="mo-fr-name"><i style="background:${color}"></i>${esc(r.label)}</span>
          <div class="mo-fr-plot" role="img" aria-label="${esc(r.label + "'s road, " + unitWord + " by " + unitWord + ": " + words)}" title="${esc(words)}">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">${bands}<path d="${d.trim()}" stroke="${color}" class="mo-fr-line${r.film ? " mo-fr-film" : ""}"/>${dots}</svg>${marks}</div></div>`;
      })
      .join("");
    const usedFams = [...new Set(res.ribbon.map((r) => r.family).filter(Boolean))];
    const legend = usedFams.map((f) => `<li><i style="background:${COLORS[f] || OTHER}"></i>${esc(letterOf(f))} ${esc(famLabel(f))}</li>`).join("");

    const flatList = res.flat.length
      ? `<ol class="mo-fr-list">${res.flat
          .map((f, i) => `<li><p>${esc(f.text)}</p><p class="mo-small">${esc(f.suggest.text)}</p><button type="button" class="mo-fr-btn" data-fr="apply" data-i="${i}">${esc(f.suggest.button)}</button></li>`)
          .join("")}</ol>`
      : `<p class="mo-small"><span class="mo-status mo-good">● Fresh</span> No feeling holds for ${res.flatScenes} ${unitWord}s while attention stalls.</p>`;
    const missList = res.missed.length
      ? `<ol class="mo-fr-list mo-fr-misses">${res.missed.map((m) => `<li><span class="mo-fr-mark mo-fr-key" aria-hidden="true">!</span><span>${esc(m.text)}</span></li>`).join("")}</ol>`
      : `<p class="mo-small"><span class="mo-status mo-good">● Fresh</span> Every big feeling turn (${res.bigTurn} steps or more) comes where attention rests on Feeling.</p>`;
    const share = res.align.turns ? Math.round(res.align.share * 100) : 0;
    const per = res.roads
      .filter((r) => res.align.byRoad[r.id] && res.align.byRoad[r.id].turns)
      .map((r) => `<li>${esc(r.label)}: ${res.align.byRoad[r.id].aligned} of ${res.align.byRoad[r.id].turns}</li>`)
      .join("");

    el.innerHTML = `<div class="mo-fr">${src.source === "engine" && src.storyEmpty ? fill : ""}${head}${controls}${status}
      <section><h3>The roads under attention</h3>
        <div class="mo-fr-chart">
          <div class="mo-fr-row mo-fr-ribrow"><span class="mo-fr-name">Attention</span><div class="mo-fr-ribbon" style="grid-template-columns:repeat(${B}, minmax(0, 1fr))" role="group" aria-label="What holds attention, moment by moment">${ribbon}</div></div>
          ${rows}
          <div class="mo-fr-row"><span class="mo-fr-name mo-small">${unitWord === "scene" ? "Scene" : "Moment"}</span><div class="mo-fr-ticks" style="grid-template-columns:repeat(${S}, minmax(0, 1fr))">${ticks}</div></div>
        </div>
        <ul class="mo-legend mo-fr-legend">${legend}<li><span class="mo-fr-key-band"></span> a flat stretch</li><li><span class="mo-fr-mark mo-fr-key">!</span> a turn attention misses</li></ul>
        <p class="mo-small">A letter on the ribbon marks where attention moved to a new family. Point at a line to read each ${unitWord}'s feeling.</p></section>
      <section><h3>Flat feelings</h3>${flatList}</section>
      <section><h3>Feeling turns that attention misses</h3>${missList}</section>
      <section><h3>Do feeling turns move attention?</h3><p class="mo-fr-big"><b>${res.align.aligned}</b> of <b>${res.align.turns}</b> ${res.align.turns ? `(${share}%)` : ""}</p><p>${esc(res.align.text)}</p>${per ? `<ul class="mo-fr-per mo-small">${per}</ul>` : ""}</section></div>`;
  }

  function addTab() {
    const UI = root.CurioMomentumUI;
    if (!UI || !UI.addTab) return false;
    return UI.addTab({ id: "feeling", label: "Feeling road", after: "end", group: "see", mount });
  }
  if (!addTab()) {
    let tries = 0;
    const t = setInterval(() => {
      if (addTab() || ++tries > 50) clearInterval(t);
    }, 100);
  }
})();
