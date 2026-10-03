/* momentum/engine-lanes.js: attention and momentum on the engine's timeline (engine/, window.CurioEngine).
   Reads the engine's result (every row, every track, every curiosity) as a film, one beat per row, and
   gives back two lanes, one cell per moment (row):
     attention  which family holds the audience's attention at that moment, and how long it has held it
     cue        the cue that moved attention there (visual, audio, thought, movement, plot; quiet when it stops)
   and suggestions for every stretch that holds one family too long: an engine link (a proximity, as data)
   that makes a curiosity of another family change with the one holding attention, so attention moves.
   Adding a suggestion is an ordinary engine command (addLink), so it is one undo step and can be removed.

   This file never changes the engine's files or state on its own. Part of the momentum core (no page).

   window.CurioMomentumEngine
   - available() -> true when the engine is loaded and has rows
   - reading(opts) -> an attention reading of the engine's film (attention.js), rows as beats
   - lanes(opts) -> { rows: [{ id, label }], attention: [cell], cue: [cell], reading }
       cell: { row, family, label, color?, seconds, over (past the limit), text, title }
   - suggestions(opts) -> [{ id, text, link }]: link is ready for CurioEngine.send({ type: "addLink", ...link })
   - addSuggestion(s) -> the engine's reply
   - band(opts): the two lanes in the shape an engine timeline band could draw:
       { id: "momentum", label, lanes: [{ id, label, cells: [{ row, text, title, color, warn }] }] }
     (requested from the engine thread as CurioEngineUI.addBand; see momentum/README.md).
   - flatBeats() -> one beat per row with one value per curiosity (Master first, then Camera, then the
       characters), the way the Screen's Player reads My film, so a meter beside the Player agrees with it.
   - moveAt(option, rowId) -> { track, curiosity, label, value, from, commands } | null: the Compass's move
       (an option from compass.js) as engine commands: one curiosity of that family stepped one notch at that
       moment (a node at the playhead). Adds the curiosity to a track first when no track has one.
   - applyMove(move) -> the engine's reply (one undo step). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const E = () => root.CurioEngine;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;

  function available() {
    return !!(E() && E().state && E().state().rows && E().state().rows.length);
  }
  /* One beat per row: every curiosity on every track, keyed "curiosity@track" so two characters' feelings
     are both seen (the attention model reads them as the same curiosity). */
  function beats() {
    if (!available()) return [];
    const st = E().state();
    return st.rows.map((r) => {
      const values = {};
      st.tracks.forEach((t) =>
        t.curiosities.forEach((c) => {
          const v = E().value(r.id, t.id, c);
          if (v != null && v !== "") values[c + "@" + t.id] = v;
        })
      );
      return { values, row: r.id, label: r.label };
    });
  }
  function reading(opts) {
    return A().read(beats(), Object.assign({ secondsPerBeat: 3 }, opts || {}));
  }

  function lanes(opts) {
    const b = beats();
    const r = A().read(b, Object.assign({ secondsPerBeat: 3 }, opts || {}));
    const rows = b.map((x) => ({ id: x.row, label: x.label }));
    const segAt = (i) => {
      let s = null;
      r.segments.forEach((g) => g.beat <= i && (s = g));
      return s;
    };
    const runs = A().familyRuns(r.segments);
    const attention = [];
    const cue = [];
    rows.forEach((row, i) => {
      const s = segAt(i);
      if (!s) {
        attention.push({ row: row.id, family: null, text: "", title: "Nothing holds attention yet" });
        cue.push({ row: row.id, text: "", title: "" });
        return;
      }
      const run = runs.find((g) => s.from >= g.from && s.from < g.to + 1e-9) || { from: s.from };
      /* Seconds the family has held attention by the end of this row. */
      const step = r.beats ? r.seconds / r.beats : 3;
      const held = Math.round((i + 1) * step - run.from);
      const fam = M().family(s.family);
      const over = held > r.limit;
      attention.push({ row: row.id, family: s.family, label: s.label, seconds: held, over, text: (fam ? fam.label : s.family) + " " + held + "s", title: `${s.label} (${fam ? fam.label : s.family}) has held attention for ${held} seconds${over ? ", past the " + r.limit + " second limit" : ""}` });
      const starts = s.beat === i;
      cue.push({ row: row.id, cue: starts ? s.cue : null, quiet: starts && s.quiet, text: starts ? (i === 0 ? "start" : (s.quiet ? "quiet " : "") + s.cue) : "", title: starts && i > 0 ? `Attention moved to ${s.label} on a ${s.cue} cue${s.quiet ? " (something stopped)" : ""}` : "" });
    });
    return { rows, attention, cue, reading: r };
  }

  /* For each stretch past the limit: a link from the curiosity holding attention to one of another family on
     the same track (or any track), so the next change of the leader also changes something new. */
  function suggestions(opts) {
    if (!available()) return [];
    const st = E().state();
    const L = lanes(opts);
    const out = [];
    const runs = A().familyRuns(L.reading.segments).filter((g) => g.dur > L.reading.limit);
    runs.forEach((run, k) => {
      const seg = L.reading.segments.find((g) => g.from >= run.from && g.family === run.family);
      if (!seg) return;
      const startRow = st.rows[seg.beat];
      const step = L.reading.beats ? L.reading.seconds / L.reading.beats : 3;
      const endIdx = Math.min(st.rows.length - 1, Math.max(seg.beat, Math.ceil(run.to / step) - 1));
      const leaderTrack = st.tracks.find((t) => t.curiosities.includes(seg.curiosity));
      if (!leaderTrack) return;
      const candidates = [];
      st.tracks.forEach((t) =>
        t.curiosities.forEach((c) => {
          const n = M().note(c);
          if (n.family === run.family) return;
          candidates.push({ track: t.id, curiosity: c, n, same: t.id === leaderTrack.id });
        })
      );
      if (!candidates.length) return;
      candidates.sort((a, b) => b.same - a.same || b.n.push - a.n.push);
      const pick = candidates[0];
      const fam = M().family(run.family);
      const link = {
        label: `Momentum: move attention off ${fam ? fam.label : run.family} (${M().note(seg.curiosity).label} leads ${pick.n.label})`,
        from: { track: leaderTrack.id, curiosity: seg.curiosity, change: "any" },
        to: { track: pick.track, curiosity: pick.curiosity },
        does: "moveWith",
        amount: 1,
        within: 1,
        scope: { from: startRow.id, to: st.rows[endIdx].id },
      };
      out.push({
        id: "m" + k,
        text: `${fam ? fam.label : run.family} holds attention for ${Math.round(run.dur)} seconds from ${startRow.label || "row " + (seg.beat + 1)}. Link ${pick.n.label} to ${M().note(seg.curiosity).label} so the next change also moves ${M().family(pick.n.family).label}, a ${pick.n.cue} cue.`,
        link,
      });
    });
    return out;
  }
  function addSuggestion(s) {
    if (!s || !s.link || !E()) return { ok: false, error: "No engine here." };
    return E().send(Object.assign({ type: "addLink" }, s.link));
  }

  function band(opts) {
    const L = lanes(opts);
    return {
      id: "momentum",
      label: "Momentum",
      lanes: [
        { id: "attention", label: "Attention", cells: L.attention.map((c) => ({ row: c.row, text: c.text, title: c.title, family: c.family, warn: !!c.over })) },
        { id: "cue", label: "Cue", cells: L.cue.map((c) => ({ row: c.row, text: c.text, title: c.title })) },
      ],
    };
  }

  /* The Screen's view of My film: each curiosity's first value going Master, Camera, then characters. */
  const RANK = { master: 0, camera: 1, character: 2 };
  const ordered = (st) => st.tracks.slice().sort((a, b) => (RANK[a.kind] ?? 3) - (RANK[b.kind] ?? 3));
  function flatBeats() {
    if (!available()) return [];
    const st = E().state();
    const order = ordered(st);
    return st.rows.map((r) => {
      const values = {};
      order.forEach((t) =>
        t.curiosities.forEach((c) => {
          if (values[c] != null) return;
          const v = E().value(r.id, t.id, c);
          if (v != null && v !== "") values[c] = v;
        })
      );
      return { values, row: r.id, label: r.label };
    });
  }

  /* Which kind of track a family's curiosities usually live on. */
  const TRACK_FOR = { camera: "camera", movement: "character", voice: "character", feeling: "character", wardrobe: "character", comedy: "character", mind: "character" };
  function moveAt(option, rowId) {
    const S = root.CurioScale;
    if (!available() || !option || !option.family || !S) return null;
    const st = E().state();
    const row = st.rows.find((r) => r.id === rowId) || st.rows[0];
    const fam = option.family;
    /* A curiosity of that family already on a track: the Compass's own pick first, then the one that pushes
       the story hardest (written notes before workspace ones). */
    const rank = (c) => M().note(c).push + (M().note(c).source === "workspace" ? 0 : 0.5);
    const on = [];
    ordered(st).forEach((t) => t.curiosities.forEach((c) => S.known(c) && M().familyOf(c) === fam && on.push({ track: t.id, curiosity: c })));
    let pick = on.find((x) => M().baseId(x.curiosity) === option.curiosity) || on.slice().sort((a, b) => rank(b.curiosity) - rank(a.curiosity))[0];
    const commands = [];
    if (!pick) {
      const cur = [option.curiosity]
        .concat((M().all ? M().all() : []).filter((n) => n.family === fam).sort((a, b) => b.push - a.push).map((n) => n.id))
        .find((c) => c && S.known(c));
      if (!cur) return null;
      const kind = TRACK_FOR[fam] || "master";
      const track = st.tracks.find((t) => t.kind === kind) || st.tracks[0];
      if (!track) return null;
      pick = { track: track.id, curiosity: cur };
      commands.push({ type: "addCuriosity", track: track.id, curiosity: cur });
    }
    const was = commands.length ? null : E().value(row.id, pick.track, pick.curiosity);
    const base = was != null && was !== "" ? was : S.start(pick.curiosity);
    let value = S.step(pick.curiosity, base, 1);
    if (value == null || String(value) === String(base)) value = S.step(pick.curiosity, base, -1);
    if (value == null || (was != null && String(value) === String(was))) return null;
    commands.push({ type: "setPoint", row: row.id, track: pick.track, curiosity: pick.curiosity, value });
    const label = M().plain ? M().plain(S.label(pick.curiosity)) : S.label(pick.curiosity);
    return { track: pick.track, curiosity: pick.curiosity, label, value, from: was, row: row.id, family: fam, commands };
  }
  function applyMove(move) {
    if (!move || !E()) return { ok: false, error: "No engine here." };
    const fam = M().family(move.family);
    return E().send({ type: "batch", label: `Momentum: move attention to ${fam ? fam.label : move.family} (${move.label})`, commands: move.commands });
  }

  const api = { available, beats, flatBeats, reading, lanes, suggestions, addSuggestion, band, moveAt, applyMove };
  root.CurioMomentumEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
