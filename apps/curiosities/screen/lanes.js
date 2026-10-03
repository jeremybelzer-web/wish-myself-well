/* screen/lanes.js: curiosity lanes with nodes and lines, on the engine's film (engine/state.js). Used by the
   automation lane under My film and by the Arrange view.

   Jeremy (2026-10-02 17:18Z and 17:22Z): an automation lane "using nodes and lines connecting those nodes",
   tracks of curiosities stacked so "the node from one" can "connect to the node of another one" to make a
   proximity, and "if one of the nodes is moved or copied to a new scene, then they're both copied". A
   proximity or proximity suite you like can be copied and pasted into a different scene.

   How it maps onto the engine (nothing new is saved outside it, so undo covers everything):
   - a lane is an engine automation lane ("track|curiosity"); a node is one of its points (a moment);
   - joining node A to node B is an engine link with from.is = A's value, does "set" B's value, within = how
     many moments later B sits, and scope { from: A's moment, to: B's moment }; that scope is how the Screen
     knows which two nodes a link joins;
   - nodes joined by links (directly or through others) are a group: moving or copying one moves or copies
     the whole group and its links, as one undo step. A group with several links is a proximity suite.

   Mouse: click an empty spot to add a node; drag a node up or down to change it, sideways to move it (and its
   partners); hold Alt (or Shift) while dragging to copy instead; drop a node on a node in another lane to join
   them; double-click a node to remove it. Click a line to switch it off or remove it. Drag across empty space to
   select an area; drag inside the area sideways to move all its nodes in time (Alt when you let go: copy them).

   window.CurioLanes
   - mount(el, opts) -> { draw(), destroy() }
       opts.lanes()      -> [{ track (or null), cur, label?, group? }]  which lanes to show, top to bottom
       opts.row()        -> the playhead's moment index (paste goes there)
       opts.onSelect(cur) told when a lane or node is picked
       opts.header(lane) -> extra HTML for a lane's header (the Arrange view's dropdown)
       opts.ruler        draw moment numbers above the lanes
       opts.range()      -> [from, to] or null: the play range, drawn with the moments outside it dimmed
       opts.thumbs()     -> one storyboard frame <svg> string per moment, drawn on My film's clip track when zoomed in
       opts.beats()      -> [{ values }] My film's values per moment, read by Mark the turns (else read from the engine)
   - turnMarkers(beats, rows, { attention, lanes }) -> the auto markers where the film turns (see below);
     mergeTurnMarkers(markers, turns) and clearAutoMarkers(markers) put them in and take them off
   - trackFor(cur)       the track a curiosity goes on when it is not on one yet
   - group(nodeKey)      the nodes and links joined to a node
   - copyGroup(nodeKey), paste(atRow) -> { ok, error? }   the proximity clipboard (kept across films)
   - ensure(cur)         make sure a lane's curiosity is on a track (one undo step), returns the track id
   - tools()             the timeline toolbar settings, kept in localStorage "curiosities-screen-tools-v1"
   - soloCommands(st, laneKey, prev), soloActive(st, solo), isLocked(laneKey)   the lane heads' Solo and Lock

   The toolbar copies CapCut's timeline toolbar (Jeremy's screenshots, 2026-10-02): the Select (A) and Split (B)
   tools, Undo, Delete, Add marker (M), the main track magnet (P), linkage (~), the preview axis (S) and zoom.
   Each one means the nearest thing for nodes and lines:
   - Select: click an empty spot to add a node where you click (as before). Split: click a lane to drop a node
     right on its line, so the line is cut there without changing what plays.
   - Magnet on: moving a node sideways moves every later node in its lane along with it, like CapCut closing
     the gap on the main track.
   - Linkage on (the default): joined nodes move and copy together. Off: a node moves alone and its lines stretch.
   - Auto snapping on (the default): a node dragged sideways to within one moment of a marker lands on it.
   - Preview axis on: hovering over the timeline moves the player to that moment (opts.onHover).
   - Markers: flags on moments of the film, kept by row id, each with a color and a note. Double-click (or
     right-click) a marker's flag on the ruler to write its note, pick its color or delete it; Markers ▾ lists
     them all, and clicking one moves the playhead there (opts.onRow, else opts.onClip).
   The mounted lanes answer command(name) so the Screen's keyboard shortcuts can drive them. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const E = () => root.CurioEngine;
  const S = () => root.CurioScale;
  const L = () => root.CurioLevels;
  const CLIP_KEY = "curiosities-screen-clip-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const LANE_H = 50;
  const PAD = 7;
  const RULER = 18;
  const TOOLS_KEY = "curiosities-screen-tools-v1";
  const TOOL_DEFAULTS = { tool: "select", magnet: false, linkage: true, linkKinds: {}, linkDelete: false, snap: true, skim: false, zoom: 1, markers: [] };
  let tools = Object.assign({}, TOOL_DEFAULTS);
  try {
    const t = JSON.parse(localStorage.getItem(TOOLS_KEY));
    if (t && typeof t === "object") tools = Object.assign({}, TOOL_DEFAULTS, t);
  } catch (e) {}
  /* Markers (CapCut's markers): a flag on one moment with a color and a short note ("the joke lands").
     Kept as [{ row, color, note }]; older saves kept a plain list of row ids, which migrateMarkers turns into
     orange markers with no note. */
  const MARK_COLORS = [
    ["red", "Red", "#ff5a5f"],
    ["orange", "Orange", "#ff9f43"],
    ["yellow", "Yellow", "#ffd43b"],
    ["green", "Green", "#51cf66"],
    ["blue", "Blue", "#4dabf7"],
    ["purple", "Purple", "#b197fc"],
  ];
  const MARK_DEFAULT = "orange";
  const NOTE_MAX = 80;
  const markColor = (id) => MARK_COLORS.find((c) => c[0] === id) || MARK_COLORS.find((c) => c[0] === MARK_DEFAULT);
  function migrateMarkers(list) {
    const out = [];
    const seen = new Set();
    (Array.isArray(list) ? list : []).forEach((m) => {
      const o = typeof m === "string" || typeof m === "number" ? { row: String(m) } : m && typeof m === "object" && m.row != null ? m : null;
      if (!o || seen.has(String(o.row))) return;
      seen.add(String(o.row));
      const k = { row: String(o.row), color: markColor(o.color)[0], note: String(o.note == null ? "" : o.note).trim().slice(0, NOTE_MAX) };
      if (o.auto) k.auto = true;
      out.push(k);
    });
    return out;
  }
  /* Auto markers, the film's "Beats" (CapCut puts markers on a song's beats; here they go on the moments where
     the film turns). turnMarkers(beats, rows, opts) -> [{ row, color, note, auto: true }], one per moment at most:
     - purple where what holds the audience's attention moves to another family (opts.attention, the
       CurioAttention ui.js uses: a new stretch of attention whose family differs from the one before);
     - red where the feeling of the moment (the "emotion" curiosity) changes;
     - yellow where a lane's value jumps by more than half its scale (opts.lanes: the curiosities to check).
     beats: [{ values }] one per moment; rows: the moments' row ids (or rows with an id), in the same order.
     opts.pos(cur, value) -> 0..1, opts.label(cur) and opts.familyLabel(family) can be stubbed for tests. */
  const TURN_COLORS = { attention: "purple", feeling: "red", jump: "yellow" };
  const TURN_FEELING = "emotion";
  function turnMarkers(beats, rows, o) {
    o = o || {};
    beats = Array.isArray(beats) ? beats : [];
    const ids = (Array.isArray(rows) ? rows : []).map((r) => (r == null ? null : String(typeof r === "object" ? r.id : r)));
    const famName = (f) => {
      if (o.familyLabel) return String(o.familyLabel(f));
      const M = root.CurioMomentum;
      const fam = M && M.family ? M.family(f) : null;
      return String(fam ? fam.label : f).toLowerCase();
    };
    const labelOf = o.label || ((c) => (S() ? S().label(c) : c));
    const posOf = o.pos || ((c, v) => (S() ? S().pos(c, v) : null));
    const found = {};
    const add = (i, kind, note) => {
      if (!(i >= 1 && i < beats.length) || ids[i] == null) return;
      (found[i] = found[i] || []).push({ kind, note });
    };
    if (o.attention && o.attention.read && beats.length > 1) {
      let reading = null;
      try {
        reading = o.attention.read(beats.map((b) => ({ at: b && b.at, values: (b && b.values) || {} })));
      } catch (e) {}
      const segs = (reading && reading.segments) || [];
      segs.forEach((s, k) => {
        const p = segs[k - 1];
        if (p && s.family && p.family && s.family !== p.family) add(s.beat, "attention", `attention moves from ${famName(p.family)} to ${famName(s.family)}`);
      });
    }
    const val = (i, c) => (beats[i] && beats[i].values ? beats[i].values[c] : null);
    const has = (v) => v != null && v !== "";
    for (let i = 1; i < beats.length; i++) {
      const a = val(i - 1, TURN_FEELING);
      const b = val(i, TURN_FEELING);
      if (has(a) && has(b) && String(a) !== String(b)) add(i, "feeling", `feeling turns from ${a} to ${b}`);
      (o.lanes || []).forEach((c) => {
        if (c === TURN_FEELING) return;
        const x = val(i - 1, c);
        const y = val(i, c);
        if (!has(x) || !has(y) || String(x) === String(y)) return;
        const px = posOf(c, x);
        const py = posOf(c, y);
        if (px == null || py == null || Math.abs(py - px) <= 0.5) return;
        add(i, "jump", `${String(labelOf(c)).toLowerCase()} jumps from ${x} to ${y}`);
      });
    }
    return Object.keys(found)
      .map(Number)
      .sort((a, b) => a - b)
      .map((i) => {
        const list = found[i];
        /* The first kind found sets the color; the notes are joined while they fit (a note is never cut off
           mid-sentence), and one big jump per moment is enough to say. */
        let jumped = false;
        const note = list
          .filter((t) => (t.kind !== "jump" ? true : jumped ? false : (jumped = true)))
          .reduce((s, t) => (!s ? t.note.slice(0, NOTE_MAX) : s.length + 2 + t.note.length <= NOTE_MAX ? s + "; " + t.note : s), "");
        return { row: ids[i], color: TURN_COLORS[list[0].kind], note, auto: true };
      });
  }
  /* Put auto markers into a marker list: the old auto ones go, the new ones are added, and a moment that already
     has a marker of your own keeps yours just as it is. */
  function mergeTurnMarkers(list, turns) {
    const mine = migrateMarkers(list).filter((m) => !m.auto);
    const taken = new Set(mine.map((m) => m.row));
    return migrateMarkers(mine.concat((turns || []).filter((t) => t && !taken.has(String(t.row)))));
  }
  const clearAutoMarkers = (list) => migrateMarkers(list).filter((m) => !m.auto);
  tools.markers = migrateMarkers(tools.markers);
  const markerOf = (rowId) => tools.markers.find((m) => m.row === rowId) || null;
  if (!tools.linkKinds || typeof tools.linkKinds !== "object") tools.linkKinds = {};
  /* Linkage settings, modeled on CapCut's Linkage settings box ("When linkage is turned on, the selected items
     will move or get deleted with the clips on the main track", with a tick per kind: Text, Effects, Stickers,
     Filters, Adjust, Overlay, Audio, Sound effects, Text to speech). Here the kinds are the Screen's categories:
     a joined node comes along only when its curiosity's category is ticked (all are, to start). The node you
     grab always moves. tools.linkDelete: Delete takes the ticked joined nodes too (off to start). */
  function kindOf(key) {
    const cur = key.slice(key.indexOf("|") + 1);
    return L() && L().categoryOf ? L().categoryOf(cur) : "";
  }
  const kindOk = (key) => tools.linkKinds[kindOf(key)] !== false;
  function saveTools() {
    try {
      localStorage.setItem(TOOLS_KEY, JSON.stringify(tools));
    } catch (e) {}
  }

  function trackFor(cur, st) {
    st = st || E().state();
    /* The character matrix's curiosities go on the picked character's own track (screen/character.js). */
    if (root.CharacterScreen && root.CharacterScreen.claims(cur)) return root.CharacterScreen.trackFor(cur, st);
    const have = st.tracks.find((t) => t.curiosities.includes(cur));
    if (have) return have.id;
    const cat = L() ? L().categoryOf(cur) : "";
    const kind = cat === "camera" ? "camera" : cat === "performance" || cat === "wardrobe" ? "character" : "master";
    const t = st.tracks.find((x) => x.kind === kind && x.curiosities.length < E().LIMIT.perTrack) || st.tracks.find((x) => x.curiosities.length < E().LIMIT.perTrack);
    return t ? t.id : null;
  }
  function ensure(cur) {
    const st = E().state();
    const on = st.tracks.find((t) => t.curiosities.includes(cur));
    if (on) return on.id;
    const t = trackFor(cur, st);
    if (!t) return null;
    const r = E().send({ type: "addCuriosity", track: t, curiosity: cur, label: "Add a lane: " + (S() ? S().label(cur) : cur) });
    return r.ok ? t : null;
  }

  /* ---------- groups: nodes joined by links ---------- */
  const nodeKey = (row, lk) => row + "@" + lk;
  function linkEnds(l) {
    if (!l.scope) return null;
    return [nodeKey(l.scope.from, l.from.track + "|" + l.from.curiosity), nodeKey(l.scope.to, l.to.track + "|" + l.to.curiosity)];
  }
  function group(key, st, allow) {
    st = st || E().state();
    const nodes = new Set([key]);
    const links = new Set();
    let grew = true;
    while (grew) {
      grew = false;
      st.links.forEach((l) => {
        const ends = linkEnds(l);
        if (!ends || links.has(l.id)) return;
        if (nodes.has(ends[0]) || nodes.has(ends[1])) {
          if (allow && !ends.every((n) => nodes.has(n) || allow(n))) return;
          links.add(l.id);
          ends.forEach((n) => nodes.add(n));
          grew = true;
        }
      });
    }
    return { nodes: [...nodes], links: st.links.filter((l) => links.has(l.id)) };
  }
  const split = (key) => {
    const at = key.indexOf("@");
    const lk = key.slice(at + 1);
    const [track, cur] = lk.split("|");
    return { row: key.slice(0, at), lk, track, cur };
  };
  function pointValue(st, n) {
    const lane = st.lanes[n.lk];
    if (lane && lane.points[n.row] != null) return lane.points[n.row];
    return E().value(n.row, n.track, n.cur);
  }
  /* Commands that move (or copy) a group by d moments. opt.solo: only this node (linkage off); opt.ripple: also
     every later node in its lane (the magnet). Lines with one end left behind stretch to the new moment. */
  function shiftCommands(st, key, d, copy, opt) {
    opt = opt || {};
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const keys = new Set(opt.solo ? [key] : group(key, st, opt.allow).nodes);
    if (opt.ripple) {
      const k0 = split(key);
      const lane = st.lanes[k0.lk];
      if (lane)
        Object.keys(lane.points).forEach((r) => {
          if (ix[r] != null && ix[r] > ix[k0.row]) (opt.solo ? [nodeKey(r, k0.lk)] : group(nodeKey(r, k0.lk), st, opt.allow).nodes).forEach((k) => keys.add(k));
        });
    }
    const nodes = [...keys].map(split);
    for (const n of nodes) {
      const to = ix[n.row] + d;
      if (ix[n.row] == null || to < 0 || to >= st.rows.length) return { error: "That would push part of the proximity off the end of the film." };
    }
    const at = (rowId) => st.rows[ix[rowId] + d].id;
    const cmds = [];
    const vals = nodes.map((n) => pointValue(st, n));
    if (!copy)
      nodes.forEach((n) => {
        const lane = st.lanes[n.lk];
        if (lane && lane.points[n.row] != null) cmds.push({ type: "removePoint", row: n.row, track: n.track, curiosity: n.cur });
      });
    nodes.forEach((n, i) => vals[i] != null && cmds.push({ type: "setPoint", row: at(n.row), track: n.track, curiosity: n.cur, value: vals[i] }));
    let joined = 0;
    st.links.forEach((l) => {
      const ends = linkEnds(l);
      if (!ends) return;
      const a = keys.has(ends[0]);
      const b = keys.has(ends[1]);
      if (!a && !b) return;
      if (a && b) joined++;
      const scope = { from: a ? at(l.scope.from) : l.scope.from, to: b ? at(l.scope.to) : l.scope.to };
      if (copy) {
        if (!(a && b)) return;
        const body = JSON.parse(JSON.stringify(l));
        delete body.id;
        cmds.push(Object.assign({ type: "addLink" }, body, { scope }));
      } else if (a && b) cmds.push({ type: "updateLink", link: l.id, changes: { scope } });
      else cmds.push({ type: "updateLink", link: l.id, changes: { scope, within: Math.max(0, Math.min(16, Math.abs(ix[scope.to] - ix[scope.from]))) } });
    });
    return { cmds, size: nodes.length, links: joined };
  }
  function linkCommand(st, a, b) {
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    let A = a;
    let B = b;
    if (ix[B.row] < ix[A.row]) [A, B] = [B, A];
    const av = pointValue(st, A);
    const bv = pointValue(st, B);
    const lab = (c) => (S() ? S().label(c) : c);
    return {
      type: "addLink",
      label: `When ${lab(A.cur)} is ${av}, ${lab(B.cur)} becomes ${bv}`,
      from: { track: A.track, curiosity: A.cur, is: av },
      to: { track: B.track, curiosity: B.cur },
      does: "set",
      value: bv,
      within: Math.min(16, ix[B.row] - ix[A.row]),
      scope: { from: A.row, to: B.row },
    };
  }

  /* ---------- the clipboard ---------- */
  let clip = null;
  try {
    clip = JSON.parse(localStorage.getItem(CLIP_KEY)) || null;
  } catch (e) {
    clip = null;
  }
  function copyGroup(key, opt) {
    opt = opt || {};
    const st = E().state();
    const g = opt.solo ? { nodes: [key], links: [] } : group(key, st, opt.allow);
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const nodes = g.nodes.map(split).filter((n) => ix[n.row] != null);
    if (!nodes.length) return { ok: false, error: "Pick a node first." };
    const first = Math.min(...nodes.map((n) => ix[n.row]));
    clip = {
      nodes: nodes.map((n) => ({ at: ix[n.row] - first, cur: n.cur, kind: (st.tracks.find((t) => t.id === n.track) || {}).kind || "master", track: n.track, value: pointValue(st, n) })),
      links: g.links.map((l) => ({ from: { cur: l.from.curiosity, track: l.from.track, at: ix[l.scope.from] - first, is: l.from.is }, to: { cur: l.to.curiosity, track: l.to.track, at: ix[l.scope.to] - first }, does: l.does, value: l.value, amount: l.amount, within: l.within, label: l.label })),
    };
    try {
      localStorage.setItem(CLIP_KEY, JSON.stringify(clip));
    } catch (e) {}
    return { ok: true, nodes: clip.nodes.length, links: clip.links.length };
  }
  function setClip(c) {
    clip = c;
    try {
      localStorage.setItem(CLIP_KEY, JSON.stringify(clip));
    } catch (e) {}
  }
  function paste(atRow) {
    if (clip && clip.kind === "area") {
      const st = E().state();
      /* Locked lanes are skipped (tools.locks). */
      let skipped = 0;
      const targets = clip.lanes.map((l) => (l && isLocked(l.track + "|" + l.cur) ? (skipped++, null) : l && { cur: l.cur, track: l.track }));
      const r = pasteAreaCommands(st, clip, targets, Math.max(0, Math.min(Number(atRow) || 0, st.rows.length - 1 - clip.span)));
      if (r.error) return { ok: false, error: r.error };
      if (!r.cmds.length) return { ok: false, error: skipped ? "Every lane in the clipboard is locked here, so nothing was pasted." : "Nothing in the clipboard fits this film's tracks." };
      const out = E().send({ type: "batch", label: "Paste automation", commands: r.cmds });
      return out.ok ? { ok: true, nodes: r.cmds.filter((x) => x.type === "setPoint").length, links: r.cmds.filter((x) => x.type === "addLink").length, skipped } : out;
    }
    if (!clip || !clip.nodes || !clip.nodes.length) return { ok: false, error: "Copy a proximity first (pick a node, then Copy)." };
    let st = E().state();
    const span = Math.max(...clip.nodes.map((n) => n.at));
    const start = Math.max(0, Math.min(Number(atRow) || 0, st.rows.length - 1 - span));
    if (start + span >= st.rows.length) return { ok: false, error: "The film is shorter than that proximity." };
    /* Put each curiosity on a track: the same track if this film has it with that curiosity, else the usual one. */
    const place = {};
    const adds = [];
    const trackOf = (cur, track) => {
      if (place[cur + "|" + track]) return place[cur + "|" + track];
      const same = st.tracks.find((t) => t.id === track && t.curiosities.includes(cur));
      let id = same ? same.id : (st.tracks.find((t) => t.curiosities.includes(cur)) || {}).id;
      if (!id) {
        id = trackFor(cur, st);
        if (id) adds.push({ type: "addCuriosity", track: id, curiosity: cur });
        const t = st.tracks.find((x) => x.id === id);
        if (t) t.curiosities.push(cur);
      }
      return (place[cur + "|" + track] = id);
    };
    const cmds = [];
    clip.nodes.forEach((n) => {
      const t = trackOf(n.cur, n.track);
      if (t && n.value != null) cmds.push({ type: "setPoint", row: st.rows[start + n.at].id, track: t, curiosity: n.cur, value: n.value });
    });
    clip.links.forEach((l) => {
      const ft = trackOf(l.from.cur, l.from.track);
      const tt = trackOf(l.to.cur, l.to.track);
      if (!ft || !tt) return;
      const link = { type: "addLink", label: l.label, from: { track: ft, curiosity: l.from.cur }, to: { track: tt, curiosity: l.to.cur }, does: l.does, amount: l.amount, within: l.within, scope: { from: st.rows[start + l.from.at].id, to: st.rows[start + l.to.at].id } };
      if (l.from.is != null) link.from.is = l.from.is;
      if (l.value != null) link.value = l.value;
      cmds.push(link);
    });
    /* Locked lanes are skipped: their nodes, and the joins that would end on them. */
    const lockedLk = (t, c) => isLocked(t + "|" + c);
    const kept = cmds.filter((c) => !(c.type === "setPoint" ? lockedLk(c.track, c.curiosity) : lockedLk(c.from.track, c.from.curiosity) || lockedLk(c.to.track, c.to.curiosity)));
    const skipped = cmds.filter((c) => c.type === "setPoint").length - kept.filter((c) => c.type === "setPoint").length;
    if (!kept.length) return { ok: false, error: skipped ? "Every lane that proximity lands on is locked here, so nothing was pasted." : "Nothing in the clipboard fits this film's tracks." };
    const links = kept.filter((c) => c.type === "addLink").length;
    const out = E().send({ type: "batch", label: links > 1 ? "Paste a proximity suite" : links ? "Paste a proximity" : "Paste nodes", commands: adds.concat(kept) });
    return out.ok ? { ok: true, nodes: kept.length - links, links, skipped } : out;
  }

  /* ---------- curves (Jeremy, 2026-10-02 20:26Z: "a curves pop-up menu that allow you to adjust precisely the
     curve of any automated line") ----------
     The engine plays a lane at whole moments, glide, smooth or jump between its nodes. A curve between two nodes
     is written into the moments between them as small curve points, so what plays follows the curve exactly at
     every moment. The curve's shape and bend are kept here (localStorage "curiosities-screen-curves-v1") only so
     it can be drawn and reopened; if the points between no longer match it (moved, undone), it is dropped. */
  const CURVES_KEY = "curiosities-screen-curves-v1";
  let curves = {};
  try {
    curves = JSON.parse(localStorage.getItem(CURVES_KEY)) || {};
  } catch (e) {
    curves = {};
  }
  const saveCurves = () => {
    try {
      localStorage.setItem(CURVES_KEY, JSON.stringify(curves));
    } catch (e) {}
  };
  /* [name, what it does, uses the bend] */
  const SHAPES = {
    straight: ["Straight", "An even line from node to node.", false],
    smooth: ["Smooth", "Eases out of the first node and into the next; more bend, a stronger S.", true],
    slowStart: ["Slow start", "Starts gently and speeds up into the next node.", true],
    fastStart: ["Fast start", "Leaps away from the first node, then settles into the next.", true],
    overshoot: ["Overshoot", "Goes past the next node's setting, then settles back (an animator's overshoot).", true],
    jumpEarly: ["Jump early", "Jumps to the next node's setting right away and holds it.", false],
    jumpLate: ["Jump late", "Holds the first node's setting, then jumps at the last moment.", false],
  };
  function shapeAt(shape, bend, t) {
    const k = 1 + 4 * Math.max(0, Math.min(1, (Number(bend) || 0) / 100));
    if (shape === "smooth") return t < 0.5 ? 0.5 * Math.pow(2 * t, k) : 1 - 0.5 * Math.pow(2 - 2 * t, k);
    if (shape === "slowStart") return Math.pow(t, k);
    if (shape === "fastStart") return 1 - Math.pow(1 - t, k);
    if (shape === "overshoot") return 1 - Math.pow(1 - t, 2) + ((k - 1) / 4) * 0.35 * Math.sin(Math.PI * t);
    if (shape === "jumpEarly") return t > 0 ? 1 : 0;
    if (shape === "jumpLate") return t < 1 ? 0 : 1;
    return t;
  }
  const segKey = (lk, ra, rb) => lk + "|" + ra + "|" + rb;
  /* The values a curve gives the moments strictly between its two nodes. a, b: { r, j, v }. */
  function bake(cur, a, b, rec, rows) {
    const pa = S().pos(cur, a.v);
    const pb = S().pos(cur, b.v);
    const out = [];
    if (pa == null || pb == null) return out;
    for (let j = a.j + 1; j < b.j; j++) {
      const t = (j - a.j) / (b.j - a.j);
      out.push({ row: rows[j].id, j, value: S().at(cur, Math.max(0, Math.min(1, pa + (pb - pa) * shapeAt(rec.shape, rec.bend, t)))) });
    }
    return out;
  }
  function curveOk(st, lk, a, b, rec) {
    const lane = st.lanes[lk];
    if (!lane || b.j - a.j < 2) return false;
    const cur = lk.slice(lk.indexOf("|") + 1);
    return bake(cur, a, b, rec, st.rows).every((p) => lane.points[p.row] != null && String(lane.points[p.row]) === String(p.value));
  }
  /* Which of a lane's points are curve points (rows), given all its points in film order. */
  function curvePoints(st, lk, all) {
    const out = new Set();
    Object.keys(curves).forEach((sk) => {
      if (!sk.startsWith(lk + "|")) return;
      const rest = sk.slice(lk.length + 1).split("|");
      const a = all.find((p) => p.r === rest[0]);
      const b = all.find((p) => p.r === rest[1]);
      if (!a || !b || !curveOk(st, lk, a, b, curves[sk])) return;
      all.forEach((p) => p.j > a.j && p.j < b.j && out.add(p.r));
    });
    return out;
  }
  function segPath(p, q, mode) {
    if (mode === "hold") return `H${q[0]} V${q[1]}`;
    if (mode === "smooth") return `C${(p[0] + q[0]) / 2} ${p[1]} ${(p[0] + q[0]) / 2} ${q[1]} ${q[0]} ${q[1]}`;
    return `L${q[0]} ${q[1]}`;
  }

  /* ---------- area copy and paste (Jeremy, 20:26Z: "select any selection that you want and copy it to any other
     selection", "select multiple tracks, automations at the same time and paste wherever you want", "paste one
     track's automation onto another track's automation") ----------
     An area is some lanes by some moments. Copying keeps each lane's nodes inside it, plus its value at both
     edges so the shape survives, and the joins whose two ends are both inside. Pasting replaces what the target
     lanes had over that stretch. Onto a different curiosity, each value keeps its place on the new scale (low
     stays low), as when an Arrange track changes curiosity. */
  function copyArea(st, lanes, ar) {
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const out = { kind: "area", span: ar.j1 - ar.j0, lanes: [], links: [] };
    const inside = new Set();
    for (let i = ar.i0; i <= ar.i1; i++) {
      const ln = lanes[i];
      if (!ln || !ln.track) {
        out.lanes.push(null);
        continue;
      }
      const lane = st.lanes[ln.lk];
      const pts = [];
      for (let j = ar.j0; j <= ar.j1; j++) {
        const r = st.rows[j];
        const has = lane && lane.points[r.id] != null;
        if (has || j === ar.j0 || j === ar.j1) pts.push({ at: j - ar.j0, value: has ? lane.points[r.id] : E().value(r.id, ln.track, ln.cur) });
        if (has) inside.add(nodeKey(r.id, ln.lk));
      }
      out.lanes.push({ cur: ln.cur, track: ln.track, row: i - ar.i0, mode: lane ? lane.mode : "ramp", points: pts });
    }
    st.links.forEach((l) => {
      const ends = linkEnds(l);
      if (!ends || !ends.every((k) => inside.has(k))) return;
      const li = (t, c) => out.lanes.findIndex((x) => x && x.track === t && x.cur === c);
      out.links.push({ from: { lane: li(l.from.track, l.from.curiosity), at: ix[l.scope.from] - ar.j0, is: l.from.is }, to: { lane: li(l.to.track, l.to.curiosity), at: ix[l.scope.to] - ar.j0 }, does: l.does, value: l.value, amount: l.amount, within: l.within, label: l.label });
    });
    return out;
  }
  const convert = (fromCur, toCur, v) => (fromCur === toCur ? v : S().at(toCur, S().pos(fromCur, v) == null ? 0.5 : S().pos(fromCur, v)));
  /* targets: one { cur, track } per copied lane (null to skip); start: the first moment; width: moments to fill
     (the copy repeats across a wider selection). Returns the commands, or { error }. */
  function pasteAreaCommands(st, c, targets, start, width) {
    const n = st.rows.length;
    const span = c.span + 1;
    const fill = Math.max(span, width || span);
    if (start + Math.min(span, fill) > n) return { error: "That doesn't fit before the end of the film." };
    const cmds = [];
    const adds = [];
    const placed = {};
    targets.forEach((t, k) => {
      const src = c.lanes[k];
      if (!t || !src) return;
      let track = placed[t.cur] || t.track || (st.tracks.find((x) => x.curiosities.includes(t.cur)) || {}).id;
      if (!track) {
        track = trackFor(t.cur, st);
        if (!track) return;
        adds.push({ type: "addCuriosity", track, curiosity: t.cur });
      }
      placed[t.cur] = track;
      const lane = st.lanes[track + "|" + t.cur];
      for (let j = start; j < Math.min(n, start + fill); j++) if (lane && lane.points[st.rows[j].id] != null) cmds.push({ type: "removePoint", row: st.rows[j].id, track, curiosity: t.cur });
      for (let rep = 0; rep * span < fill; rep++)
        src.points.forEach((p) => {
          const j = start + rep * span + p.at;
          if (j >= n || j >= start + fill) return;
          const v = S().fix(t.cur, convert(src.cur, t.cur, p.value));
          if (v != null) cmds.push({ type: "setPoint", row: st.rows[j].id, track, curiosity: t.cur, value: v });
        });
      t.track = track;
    });
    c.links.forEach((l) => {
      const a = targets[l.from.lane];
      const b = targets[l.to.lane];
      if (!a || !b || !a.track || !b.track || start + Math.max(l.from.at, l.to.at) >= n) return;
      const srcA = c.lanes[l.from.lane];
      const srcB = c.lanes[l.to.lane];
      const link = { type: "addLink", label: l.label, from: { track: a.track, curiosity: a.cur }, to: { track: b.track, curiosity: b.cur }, does: l.does, amount: l.amount, within: l.within, scope: { from: st.rows[start + l.from.at].id, to: st.rows[start + l.to.at].id } };
      if (l.from.is != null) link.from.is = S().fix(a.cur, convert(srcA.cur, a.cur, l.from.is));
      if (l.value != null) link.value = l.does === "set" ? S().fix(b.cur, convert(srcB.cur, b.cur, l.value)) : l.value;
      cmds.push(link);
    });
    return { cmds: adds.concat(cmds) };
  }

  /* ---------- area tools: Reverse, Flip, Stretch and Squeeze (CapCut's Reverse and speed, for nodes) ----------
     Each works on the selected area's nodes, lane by lane, as one batch (one undo step). lanes: [{ track, cur, lk }].
     remapArea moves every node in the area from moment j to mapJ(j). When two nodes land on one moment the later
     one wins. The area, and the moments a stretch now spreads over (until), are cleared first, so what was there
     is replaced. Joins follow their nodes; a join whose node was dropped is removed. */
  function remapArea(st, lanes, ar, mapJ, until) {
    const n = st.rows.length;
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const cmds = [];
    const moved = {}; /* old node key -> new row id, for nodes that survive */
    const dropped = new Set();
    let count = 0;
    for (let i = ar.i0; i <= ar.i1; i++) {
      const ln = lanes[i];
      const lane = ln && ln.lk && st.lanes[ln.lk];
      if (!lane) continue;
      const to = {}; /* new j -> [old j, value]; later old j wins */
      for (let j = ar.j0; j <= ar.j1; j++) {
        const v = lane.points[st.rows[j].id];
        if (v == null) continue;
        const k = Math.max(0, Math.min(n - 1, mapJ(j)));
        if (!to[k] || to[k][0] < j) to[k] = [j, v];
      }
      const news = Object.keys(to).map(Number);
      if (!news.length) continue;
      const a = Math.min(ar.j0, ...news);
      const b = Math.max(ar.j1, until || 0, ...news);
      for (let j = a; j <= b; j++) {
        const r = st.rows[j].id;
        if (lane.points[r] == null) continue;
        cmds.push({ type: "removePoint", row: r, track: ln.track, curiosity: ln.cur });
        dropped.add(nodeKey(r, ln.lk));
      }
      news.forEach((k) => {
        const old = nodeKey(st.rows[to[k][0]].id, ln.lk);
        cmds.push({ type: "setPoint", row: st.rows[k].id, track: ln.track, curiosity: ln.cur, value: to[k][1] });
        moved[old] = st.rows[k].id;
        dropped.delete(old);
        count++;
      });
    }
    st.links.forEach((l) => {
      const ends = linkEnds(l);
      if (!ends || !ends.some((k) => moved[k] || dropped.has(k))) return;
      if (ends.some((k) => dropped.has(k))) return cmds.push({ type: "removeLink", link: l.id });
      const scope = { from: moved[ends[0]] || l.scope.from, to: moved[ends[1]] || l.scope.to };
      if (scope.from !== l.scope.from || scope.to !== l.scope.to) cmds.push({ type: "updateLink", link: l.id, changes: { scope, within: Math.max(0, Math.min(16, Math.abs(ix[scope.to] - ix[scope.from]))) } });
    });
    return { cmds, nodes: count };
  }
  /* Reverse: the area's nodes play backwards (a node at moment j0 + k moves to j1 - k). */
  function reverseAreaCommands(st, lanes, ar) {
    return remapArea(st, lanes, ar, (j) => ar.j0 + ar.j1 - j);
  }
  /* Stretch (f = 2) or squeeze (f = 0.5): timing scaled from the area's first moment, clamped to the film's end. */
  function stretchAreaCommands(st, lanes, ar, f) {
    const last = Math.min(st.rows.length - 1, ar.j0 + Math.round((ar.j1 - ar.j0) * f));
    const out = remapArea(st, lanes, ar, (j) => ar.j0 + Math.round((j - ar.j0) * f), last);
    out.area = { i0: ar.i0, i1: ar.i1, j0: ar.j0, j1: Math.max(ar.j0, last) };
    return out;
  }
  /* Flip: each node's setting mirrored on its lane's scale (low becomes high), joins kept in step. */
  function flipAreaCommands(st, lanes, ar) {
    const cmds = [];
    const flipped = {};
    for (let i = ar.i0; i <= ar.i1; i++) {
      const ln = lanes[i];
      const lane = ln && ln.lk && st.lanes[ln.lk];
      if (!lane) continue;
      for (let j = ar.j0; j <= ar.j1; j++) {
        const r = st.rows[j].id;
        const p = lane.points[r] == null ? null : S().pos(ln.cur, lane.points[r]);
        if (p == null) continue;
        const v = S().fix(ln.cur, S().at(ln.cur, 1 - p));
        if (v == null) continue;
        cmds.push({ type: "setPoint", row: r, track: ln.track, curiosity: ln.cur, value: v });
        flipped[nodeKey(r, ln.lk)] = v;
      }
    }
    const nodes = cmds.length;
    st.links.forEach((l) => {
      const ends = linkEnds(l);
      if (!ends) return;
      if (flipped[ends[0]] != null && l.from.is != null) cmds.push({ type: "updateLink", link: l.id, changes: { from: { is: flipped[ends[0]] } } });
      if (flipped[ends[1]] != null && l.does === "set") cmds.push({ type: "updateLink", link: l.id, changes: { value: flipped[ends[1]] } });
    });
    return { cmds, nodes };
  }
  /* ---------- area tools: Freeze and Shape (CapCut's Freeze frame and Speed > Curve presets, for settings) ----------
     Both rewrite each selected lane's nodes over the area as one batch. laneSeries gives what a lane itself plays at
     every moment (the engine's own rule: before the first node its setting, after the last node its setting, and
     glide, smooth or jump between). rewriteArea puts a lane's new values (j -> value) in place of its nodes inside
     the area: sets go before removes so a lane never empties, a join to a node that is gone is removed, and a join
     to a node whose setting changed is kept in step (as Flip does). */
  function laneSeries(st, lane, cur) {
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const pts = Object.keys(lane.points)
      .filter((r) => ix[r] != null)
      .map((r) => ({ i: ix[r], v: lane.points[r] }))
      .sort((a, b) => a.i - b.i);
    return st.rows.map((_, i) => {
      if (!pts.length) return null;
      let a = null;
      let b = null;
      for (const p of pts) {
        if (p.i <= i) a = p;
        if (p.i >= i && !b) b = p;
      }
      if (!a) return b.v;
      if (!b || a === b || lane.mode === "hold") return a.v;
      const pa = S().pos(cur, a.v);
      const pb = S().pos(cur, b.v);
      let t = (i - a.i) / (b.i - a.i);
      if (lane.mode === "smooth") t = t * t * (3 - 2 * t);
      return pa == null || pb == null ? a.v : S().at(cur, pa + (pb - pa) * t);
    });
  }
  function rewriteArea(st, ar, edits) {
    const sets = [];
    const removes = [];
    const changed = {};
    const gone = new Set();
    edits.forEach(({ ln, lane, put }) => {
      for (let j = ar.j0; j <= ar.j1; j++) {
        const r = st.rows[j].id;
        const had = lane.points[r];
        const v = put[j];
        if (v == null) {
          if (had != null) removes.push({ type: "removePoint", row: r, track: ln.track, curiosity: ln.cur }), gone.add(nodeKey(r, ln.lk));
        } else if (had == null || String(had) !== String(v)) {
          sets.push({ type: "setPoint", row: r, track: ln.track, curiosity: ln.cur, value: v });
          if (had != null) changed[nodeKey(r, ln.lk)] = v;
        }
      }
    });
    const links = [];
    st.links.forEach((l) => {
      const ends = linkEnds(l);
      if (!ends) return;
      if (ends.some((k) => gone.has(k))) return links.push({ type: "removeLink", link: l.id });
      if (changed[ends[0]] != null && l.from.is != null) links.push({ type: "updateLink", link: l.id, changes: { from: { is: changed[ends[0]] } } });
      if (changed[ends[1]] != null && l.does === "set") links.push({ type: "updateLink", link: l.id, changes: { value: changed[ends[1]] } });
    });
    return sets.concat(removes, links);
  }
  /* Freeze: every selected lane holds the setting it has at the area's first moment until its last moment. The
     nodes inside go; a node at the first and last moment carry that one setting, so nothing drifts in between
     (glide, smooth or jump alike). Returns { cmds, nodes, lanes }. */
  function freezeAreaCommands(st, lanes, ar) {
    const edits = [];
    let nodes = 0;
    for (let i = ar.i0; i <= ar.i1; i++) {
      const ln = lanes[i];
      const lane = ln && ln.lk && st.lanes[ln.lk];
      if (!lane) continue;
      const v = laneSeries(st, lane, ln.cur)[ar.j0];
      if (v == null) continue;
      const put = { [ar.j0]: v, [ar.j1]: v };
      edits.push({ ln, lane, put });
      nodes += ar.j1 > ar.j0 ? 2 : 1;
    }
    return { cmds: rewriteArea(st, ar, edits), nodes, lanes: edits.length };
  }
  /* Shape presets (CapCut's speed curves, Montage, Hero, Bullet and so on, used on settings instead of speed).
     [name, what it does, f(k, n) -> 0..1 at moment k of the area's n + 1 moments, follows the lane's direction].
     A preset that follows the direction falls instead of rising when the lane ends lower than it starts. */
  const PRESETS = {
    easeIn: ["Ease in", "Ease in: starts slowly, then speeds up to the finish.", (k, n) => Math.pow(k / n, 2), true],
    easeOut: ["Ease out", "Ease out: moves fast at first, then settles gently.", (k, n) => 1 - Math.pow(1 - k / n, 2), true],
    riseFall: ["Rise and fall", "Rise and fall: climbs to its highest in the middle, then comes back down (a montage).", (k, n) => Math.sin(Math.PI * (k / n)), false],
    pulse: ["Pulse", "Pulse: a quick flash to its highest in the middle, low before and after.", (k, n) => (k > 0 && k < n && Math.abs(k - n / 2) < 1 ? 1 : 0), false],
    holdJump: ["Hold then jump", "Hold then jump: stays still, then changes all at once at the last moment (a hero moment).", (k, n) => (k === n ? 1 : 0), true],
    build: ["Build", "Build: climbs in a few even steps, like stairs.", (k, n) => { const L = Math.min(4, n + 1); return Math.min(1, Math.floor((k / n) * L) / (L - 1)); }, true],
  };
  /* Shape: each selected lane's settings over the area, rewritten by a preset between the lane's own lowest and
     highest setting there. Nodes go on whole moments only, and only where the shape bends (a flat run keeps its
     two ends). A lane that holds one setting over the whole area has nothing to shape and is left alone (flat).
     Returns { cmds, nodes, lanes, flat } or { error }. */
  function shapeAreaCommands(st, lanes, ar, preset) {
    const p = PRESETS[preset];
    if (!p) return { error: "There is no shape called " + preset + "." };
    const n = ar.j1 - ar.j0;
    if (n < 1) return { error: "Select at least two moments to shape." };
    const edits = [];
    let nodes = 0;
    let flat = 0;
    for (let i = ar.i0; i <= ar.i1; i++) {
      const ln = lanes[i];
      const lane = ln && ln.lk && st.lanes[ln.lk];
      if (!lane) continue;
      const series = laneSeries(st, lane, ln.cur);
      const pos = [];
      for (let j = ar.j0; j <= ar.j1; j++) pos.push(S().pos(ln.cur, series[j]));
      if (pos.some((x) => x == null)) continue;
      const lo = Math.min(...pos);
      const hi = Math.max(...pos);
      if (hi - lo < 1e-9) {
        flat++;
        continue;
      }
      const down = p[3] && pos[n] < pos[0];
      const vals = pos.map((_, k) => {
        const f = Math.max(0, Math.min(1, p[2](k, n)));
        return S().fix(ln.cur, S().at(ln.cur, down ? hi - (hi - lo) * f : lo + (hi - lo) * f));
      });
      const put = {};
      vals.forEach((v, k) => {
        if (v == null) return;
        if (k > 0 && k < n && String(vals[k - 1]) === String(v) && String(vals[k + 1]) === String(v)) return;
        put[ar.j0 + k] = v;
        nodes++;
      });
      edits.push({ ln, lane, put });
    }
    return { cmds: rewriteArea(st, ar, edits), nodes, lanes: edits.length, flat };
  }
  /* Move the selected area's nodes d moments later (d < 0: earlier), like dragging a group of clips sideways in
     CapCut. copy: the originals stay and a copy lands d moments away (Alt while dropping). The block is the whole
     area: whatever its lanes had over the moments it lands on is replaced, so one undo brings that back too. Sets
     go before removes, so a lane never empties on the way (an empty lane forgets its mode). Joins with both ends
     inside move (or are copied) with them; a join with one end left outside stretches; a join to a replaced node
     is removed. Returns { cmds, nodes, replaced, links, moved (old node key -> new row id), area } or { error }. */
  function moveAreaCommands(st, lanes, ar, d, copy) {
    const n = st.rows.length;
    d = Math.round(Number(d) || 0);
    const out = { cmds: [], nodes: 0, replaced: 0, links: 0, moved: {}, area: { i0: ar.i0, i1: ar.i1, j0: ar.j0 + d, j1: ar.j1 + d } };
    if (ar.j0 + d < 0 || ar.j1 + d > n - 1) return { error: "That would push part of the selection off the end of the film." };
    if (!d) return out;
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const sets = [];
    const removes = [];
    const dropped = new Set(); /* nodes that are gone: replaced, or (copy) originals written over by their copy */
    const inside = new Set();
    for (let i = ar.i0; i <= ar.i1; i++) {
      const ln = lanes[i];
      const lane = ln && ln.lk && st.lanes[ln.lk];
      if (!lane) continue;
      const before = {};
      for (let j = Math.min(ar.j0, ar.j0 + d); j <= Math.max(ar.j1, ar.j1 + d); j++) {
        const v = lane.points[st.rows[j].id];
        if (v != null) before[j] = v;
      }
      const after = Object.assign({}, before);
      const src = [];
      for (let j = ar.j0; j <= ar.j1; j++) if (before[j] != null) src.push([j, before[j]]);
      if (!copy) src.forEach(([j]) => delete after[j]);
      for (let j = ar.j0 + d; j <= ar.j1 + d; j++) {
        if (before[j] == null) continue;
        const k = nodeKey(st.rows[j].id, ln.lk);
        const isSrc = j >= ar.j0 && j <= ar.j1;
        if (copy || !isSrc) {
          dropped.add(k);
          if (!isSrc) out.replaced++;
        }
        delete after[j];
      }
      src.forEach(([j, v]) => {
        after[j + d] = v;
        const k = nodeKey(st.rows[j].id, ln.lk);
        inside.add(k);
        out.moved[k] = st.rows[j + d].id;
        out.nodes++;
      });
      Object.keys(after).forEach((j) => {
        if (before[j] == null || String(before[j]) !== String(after[j])) sets.push({ type: "setPoint", row: st.rows[j].id, track: ln.track, curiosity: ln.cur, value: after[j] });
      });
      Object.keys(before).forEach((j) => after[j] == null && removes.push({ type: "removePoint", row: st.rows[j].id, track: ln.track, curiosity: ln.cur }));
    }
    if (!out.nodes) return out;
    const linkCmds = [];
    st.links.forEach((l) => {
      const ends = linkEnds(l);
      if (!ends) return;
      const a = inside.has(ends[0]);
      const b = inside.has(ends[1]);
      if (copy) {
        /* The originals stay, unless their copy landed on them; joins with both ends inside get a copy. */
        if (ends.some((k) => dropped.has(k))) linkCmds.push({ type: "removeLink", link: l.id });
        if (!(a && b)) return;
        const body = JSON.parse(JSON.stringify(l));
        delete body.id;
        linkCmds.push(Object.assign({ type: "addLink" }, body, { scope: { from: out.moved[ends[0]], to: out.moved[ends[1]] } }));
        out.links++;
        return;
      }
      if (ends.some((k) => dropped.has(k))) return linkCmds.push({ type: "removeLink", link: l.id });
      if (!a && !b) return;
      const scope = { from: a ? out.moved[ends[0]] : l.scope.from, to: b ? out.moved[ends[1]] : l.scope.to };
      if (a && b) {
        out.links++;
        linkCmds.push({ type: "updateLink", link: l.id, changes: { scope } });
      } else linkCmds.push({ type: "updateLink", link: l.id, changes: { scope, within: Math.max(0, Math.min(16, Math.abs(ix[scope.to] - ix[scope.from]))) } });
    });
    out.cmds = sets.concat(removes, linkCmds);
    return out;
  }

  /* ---------- lane heads: Off, Solo and Lock (CapCut's track buttons: hide or mute a track, lock it; an audio
     app's solo) ----------
     Off is the engine lane's own `on` (film data, one undo step). Solo turns every other lane off as one batch and
     remembers each lane's on/off from before in tools.solo = { lk, was: { laneKey: on } }, so pressing it again puts
     them back (only lanes that still exist; lanes made since are left alone). Lock is a view setting, not film
     data: tools.locks = { laneKey: true } stops the timeline from changing that lane's nodes. */
  const onCmd = (lk, on) => {
    const at = lk.indexOf("|");
    return { type: "laneMode", track: lk.slice(0, at), curiosity: lk.slice(at + 1), on };
  };
  /* Is solo s still in force on this film: its lane is on and every lane it turned off is still off? */
  function soloActive(st, s) {
    if (!s || !s.lk || !st.lanes[s.lk] || !st.lanes[s.lk].on) return false;
    return Object.keys(s.was || {}).every((k) => k === s.lk || !st.lanes[k] || !st.lanes[k].on);
  }
  /* The commands for pressing Solo on lane lk, given the solo now remembered (prev). Returns { cmds, solo, off }:
     solo is what to remember next (null after un-solo); off is true when this press un-solos. */
  function soloCommands(st, lk, prev) {
    if (!st.lanes[lk]) return { error: "That lane has no nodes yet, so there is nothing to solo." };
    const keys = Object.keys(st.lanes).sort();
    const active = soloActive(st, prev);
    if (active && prev.lk === lk) {
      const cmds = keys.filter((k) => typeof prev.was[k] === "boolean" && st.lanes[k].on !== prev.was[k]).map((k) => onCmd(k, prev.was[k]));
      return { cmds, solo: null, off: true };
    }
    /* Soloing another lane while one is soloed keeps the first "before". */
    const base = active ? prev.was : {};
    const was = {};
    keys.forEach((k) => (was[k] = typeof base[k] === "boolean" ? base[k] : st.lanes[k].on !== false));
    const cmds = keys.filter((k) => st.lanes[k].on !== (k === lk)).map((k) => onCmd(k, k === lk));
    return { cmds, solo: { lk, was }, off: false };
  }
  if (!tools.locks || typeof tools.locks !== "object") tools.locks = {};
  const isLocked = (lk) => !!(lk && tools.locks[lk]);
  /* The lane a point command (or any command in a batch) would change that is locked, if any. */
  function lockedIn(m) {
    const list = m && m.type === "batch" ? m.commands || [] : [m];
    const hit = list.find((c) => c && (c.type === "setPoint" || c.type === "removePoint" || c.type === "clearLane") && isLocked(c.track + "|" + c.curiosity));
    return hit ? hit.track + "|" + hit.curiosity : null;
  }
  const lockSay = (lk) => `${S() ? S().label(lk.slice(lk.indexOf("|") + 1)) : lk} is locked (🔒 by its name), so its nodes stay as they are. Click the 🔒 to unlock it.`;

  /* ---------- the view ---------- */
  /* Storyboard frames for My film's clip track, as data pictures (each frame stays self-contained, so its arrow
     ids never clash with the page's). Cached by the frame's own text so redraws stay fast. */
  const THUMB_MIN = 40;
  const FRAME_AR = 16 / 9;
  const uris = new Map();
  function frameUri(svg) {
    let u = uris.get(svg);
    if (!u) {
      if (uris.size > 600) uris.clear();
      u = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(/xmlns=/.test(svg) ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
      uris.set(svg, u);
    }
    return u;
  }
  let mounts = 0;
  function mount(el, opts) {
    opts = opts || {};
    let sel = null; /* selected node key */
    let area = null; /* a selected area: lanes i0 to i1, moments j0 to j1 */
    let seg = null; /* a picked line between two nodes: "track|curiosity|rowA|rowB" */
    let drag = null;
    let msg = "";
    let geo = null;
    let laneTop = 0;

    function lanesNow(st) {
      return (opts.lanes ? opts.lanes() : []).map((ln) => {
        const track = ln.track && st.tracks.some((t) => t.id === ln.track && t.curiosities.includes(ln.cur)) ? ln.track : (st.tracks.find((t) => t.curiosities.includes(ln.cur)) || {}).id || null;
        return Object.assign({}, ln, { track, lk: track ? track + "|" + ln.cur : null });
      });
    }
    function yFor(cur, v, i) {
      const p = S().pos(cur, v);
      const top = laneTop + i * lh;
      return top + PAD + (1 - (p == null ? 0.5 : p)) * (lh - PAD * 2);
    }
    /* Curves between two nodes, drawn from the curve's own shape (what plays is its value at each moment). */
    function curvePath(cur, i, a, b, rec, colW) {
      const pa = S().pos(cur, a.v);
      const pb = S().pos(cur, b.v);
      const x0 = a.j * colW + colW / 2;
      const x1 = b.j * colW + colW / 2;
      const top = laneTop + i * lh;
      const out = [];
      for (let k = 1; k <= 32; k++) {
        const t = k / 32;
        const p = Math.max(0, Math.min(1, pa + (pb - pa) * shapeAt(rec.shape, rec.bend, t)));
        out.push(`L${(x0 + (x1 - x0) * t).toFixed(1)} ${(top + PAD + (1 - p) * (lh - PAD * 2)).toFixed(1)}`);
      }
      return out.join(" ");
    }
    /* How tall a lane is (dragging right on the lane names makes lanes taller), and how wide a moment is. */
    const laneH = () => Math.max(28, Math.min(320, Number(tools.laneH) || LANE_H));
    const zoomOf = () => Math.max(0.25, Math.min(32, Number(tools.zoom) || 1));
    let lh = LANE_H;
    const hatchId = "sl-hatch-" + ++mounts;
    /* The lane head's small buttons: Off (👁), Solo (S) and Lock (🔒). Off and Solo need an engine lane (a lane
       with nodes); Lock needs the lane to be on a track. They show on hover or focus, and always when in use. */
    function headBtns(ln, lane, off, solo, lock) {
      if (!ln.lk) return "";
      const name = esc(S().label(ln.cur));
      const lk = esc(ln.lk);
      const b = (act, on, cls, label, title, aria) => `<button type="button" class="sl-hb ${cls}${on ? " on" : ""}" data-act="${act}" data-lk="${lk}" aria-pressed="${on}" title="${title}" aria-label="${aria}">${label}</button>`;
      return `<span class="sl-hbtns">${
        lane
          ? b("lane-off", off, "sl-hb-off", "👁", off ? `${name}'s automation is off: it isn't changing the film. Click to turn it back on.` : `Turn ${name}'s automation off: it stops changing the film (its nodes stay, drawn faded). Click again to turn it back on.`, `${name}: automation off`) +
            b("lane-solo", solo, "sl-hb-solo", "S", solo ? `Solo: only ${name}'s automation is playing. Click to bring the other lanes back the way they were.` : `Solo: play only ${name}'s automation and turn every other lane off for now. Click again to bring them back.`, `${name}: solo`)
          : ""
      }${b("lane-lock", lock, "sl-hb-lock", "🔒", lock ? `Locked: ${name}'s nodes can't be added, moved or removed on the timeline. Click to unlock.` : `Lock ${name} so its nodes can't be added, moved or removed here by mistake. Click again to unlock.`, `${name}: lock`)}</span>`;
    }
    function draw() {
      const Eng = E();
      if (!Eng || !S()) {
        el.innerHTML = `<p class="sc-note">The engine is not loaded, so lanes cannot be drawn.</p>`;
        return;
      }
      const st = Eng.state();
      const lanes = lanesNow(st);
      const n = st.rows.length;
      const width = el.clientWidth || 800;
      const fit = Math.floor((width - 200) / Math.max(1, n));
      const zoom = zoomOf();
      const colW = Math.max(zoom < 1 ? 14 : 46, Math.floor(fit * zoom));
      const svgW = colW * n;
      lh = laneH();
      const clipRows = opts.clips ? opts.clips() : [];
      const CLIP_H = 28;
      const top = clipRows.length * CLIP_H + (opts.ruler ? RULER + 8 : 0);
      const svgH = lanes.length * lh;
      laneTop = 0;
      const playRow = opts.row ? opts.row() : -1;
      geo = { colW, lanes, top: 0, n, st, svgW, svgH, lh };
      /* Fine time lines: seconds inside each moment, then halves, quarters... as you zoom in (Jeremy, 20:26Z:
         "as you zoom in, you should see more and more fine grid lines"). A level shows once its lines are 10px apart. */
      const spm = Math.max(1, Math.round(Number(opts.secondsPerMoment ? opts.secondsPerMoment() : 3) || 3));
      const levels = [];
      for (let d = spm, lv = 1; colW / d >= 10 && n * d <= 8000 && lv <= 7; d *= 2, lv++) levels.push(d);
      const fineX = [];
      levels.forEach((d, li) =>
        st.rows.forEach((r, j) => {
          for (let k = 1; k < d; k++) if (li === 0 || k % 2) fineX.push([j * colW + (k * colW) / d, Math.min(3, li + 1)]);
        })
      );
      const inArea = (i, j) => area && i >= area.i0 && i <= area.i1 && j >= area.j0 && j <= area.j1;
      const soloNow = soloActive(st, tools.solo) ? tools.solo.lk : null;
      const heads = lanes
        .map((ln, i) => {
          const picked = (sel && sel.endsWith("@" + ln.lk)) || (area && i >= area.i0 && i <= area.i1);
          const ticks = scaleTicks(ln.cur);
          const lane = ln.lk ? st.lanes[ln.lk] : null;
          const off = !!lane && !lane.on;
          const solo = !!lane && soloNow === ln.lk;
          const lock = isLocked(ln.lk);
          return `<div class="sl-head${ln.group ? " sl-in-group" : ""}${picked ? " on" : ""}${ticks ? " has-ticks" : ""}${off ? " is-off" : ""}${solo ? " is-solo" : ""}${lock ? " is-locked" : ""}" style="height:${lh}px" data-i="${i}">
            <div class="sl-head-top">${opts.header ? opts.header(ln, i) : `<button type="button" class="sl-name" data-pick="${esc(ln.cur)}">${esc(ln.label || S().label(ln.cur))}</button>`}${headBtns(ln, lane, off, solo, lock)}<button type="button" class="sl-win" data-open-win="${esc(ln.cur)}" title="Open ${esc(S().label(ln.cur))}'s own window: every knob and slider it has" aria-label="Open ${esc(S().label(ln.cur))}'s window">⧉</button></div>
            <span class="sl-sub">${ln.lk && st.lanes[ln.lk] ? `<button type="button" class="sl-mode" data-act="mode" data-lk="${esc(ln.lk)}" title="${esc(MODES[modeOf(st.lanes[ln.lk])][2])} Click to change.">${MODES[modeOf(st.lanes[ln.lk])][1]}</button> ` : ""}${ln.group ? esc(ln.group) + " · " : ""}${ln.track ? esc((st.tracks.find((t) => t.id === ln.track) || {}).label || "") : "not on a track yet"}${ln.lk && st.lanes[ln.lk] ? " · " + Object.keys(st.lanes[ln.lk].points).length + " nodes" : ""}</span>
            ${ticks}
          </div>`;
        })
        .join("");
      const tsvg = []; /* the top bar: clip tracks and the ruler */
      const svg = [];
      const dots = []; /* nodes go on top of the lines */
      /* Film clip tracks first: one per inspiration film, then my film's moments. */
      /* My film's clip track shows a small storyboard frame per moment once a moment is wide enough, like the
         thumbnails on CapCut's main track (opts.thumbs() -> one frame <svg> string per moment). */
      let frames = null;
      clipRows.forEach((cr, k) => {
        const y = k * CLIP_H;
        const film = cr.thumbs || (cr.clips || []).some((c) => /\bmine\b/.test(c.cls || ""));
        if (film && !frames && opts.thumbs && colW >= THUMB_MIN) frames = opts.thumbs() || [];
        (cr.clips || []).forEach((c) => {
          const x = c.from * svgW;
          const w = Math.max(3, (c.to - c.from) * svgW - 2);
          const j = Math.floor(c.from * n + 1e-6);
          let tx = x + 6;
          let pic = "";
          const f = film && frames && frames[j];
          if (f) {
            const th = CLIP_H - 8;
            const tw = Math.min(w - 4, Math.round(th * FRAME_AR));
            pic = `<image class="sl-thumb" x="${x + 3}" y="${y + 4}" width="${tw}" height="${th}" preserveAspectRatio="xMidYMid slice" href="${frameUri(f)}"/>`;
            tx = x + tw + 8;
          }
          tsvg.push(`<g class="sl-clip ${esc(c.cls || "")}${pic ? " has-thumb" : ""}" data-clip="${j}"><rect x="${x + 1}" y="${y + 2}" width="${w}" height="${CLIP_H - 4}" rx="4"/>${pic}<text x="${tx}" y="${y + 18}">${esc(String(c.text || "").slice(0, Math.max(0, Math.floor((x + w - tx) / 6))))}</text><title>${esc(c.title || c.text || "")}</title></g>`);
        });
      });
      const rulerY = clipRows.length * CLIP_H;
      if (opts.ruler) {
        tsvg.push(`<rect class="sl-rulerbg" x="0" y="${rulerY}" width="${svgW}" height="${RULER + 8}"><title>Drag down to zoom in, up to zoom out, sideways to scroll</title></rect>`);
        st.rows.forEach((r, j) => tsvg.push(`<line class="sl-tick0" x1="${j * colW}" x2="${j * colW}" y1="${rulerY}" y2="${top}"/><text x="${j * colW + 4}" y="${rulerY + 12}" class="sl-ruler">${j + 1}</text>`));
        fineX.forEach(([x, lv]) => tsvg.push(`<line class="sl-tick${lv}" x1="${x}" x2="${x}" y1="${top - (lv === 1 ? 7 : lv === 2 ? 5 : 3)}" y2="${top}"/>`));
        /* Seconds under the moment numbers once there is room for them. */
        if (colW / spm >= 34) st.rows.forEach((r, j) => { for (let k = 1; k < spm; k++) { const t = j * spm + k; tsvg.push(`<text x="${j * colW + (k * colW) / spm + 2}" y="${rulerY + 12}" class="sl-ruler2">${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}</text>`); } });
      }
      lanes.forEach((ln, i) => {
        const y0 = i * lh;
        svg.push(`<rect class="sl-bg${i % 2 ? " odd" : ""}" x="0" y="${y0}" width="${svgW}" height="${lh}" data-lane="${i}"/>`);
        if (isLocked(ln.lk)) svg.push(`<rect class="sl-lockbg" x="0" y="${y0}" width="${svgW}" height="${lh}" fill="url(#${hatchId})"/>`);
        if (ln.track || S().known(ln.cur)) svg.push(valueLines(ln.cur, y0, svgW));
      });
      fineX.forEach(([x, lv]) => svg.push(`<line class="sl-fine sl-fine${lv}" x1="${x}" x2="${x}" y1="0" y2="${svgH}"/>`));
      for (let j = 0; j <= n; j++) svg.push(`<line class="sl-grid" x1="${j * colW}" x2="${j * colW}" y1="0" y2="${svgH}"/>`);
      const both = (h) => [tsvg, svg].forEach((list, k) => list.push(h(k ? svgH : top)));
      if (playRow >= 0 && playRow < n) both((h) => `<rect class="sl-play" x="${playRow * colW}" y="0" width="${colW}" height="${h}"/>`);
      const rg = opts.range ? opts.range() : null;
      if (rg) {
        /* The play range: moments outside it are dimmed, with a bracket at each end. */
        both((h) => (rg[0] > 0 ? `<rect class="sl-out" x="0" y="0" width="${rg[0] * colW}" height="${h}"/>` : ""));
        both((h) => (rg[1] < n - 1 ? `<rect class="sl-out" x="${(rg[1] + 1) * colW}" y="0" width="${(n - rg[1] - 1) * colW}" height="${h}"/>` : ""));
        svg.push(`<path class="sl-range" d="M${rg[0] * colW + 6} 2 H${rg[0] * colW + 1} V${svgH - 2} H${rg[0] * colW + 6} M${(rg[1] + 1) * colW - 6} 2 H${(rg[1] + 1) * colW - 1} V${svgH - 2} H${(rg[1] + 1) * colW - 6}"><title>Play range: moments ${rg[0] + 1} to ${rg[1] + 1}</title></path>`);
      }
      /* Markers in their own color, the note as the tooltip, and the note written beside the flag when there is
         room before the next marker. */
      const marked = st.rows.map((r, j) => [j, markerOf(r.id)]).filter((x) => x[1]);
      marked.forEach(([j, m], k) => {
        const x = j * colW + colW / 2;
        const c = markColor(m.color);
        const tip = `Marker at moment ${j + 1}${m.note ? ": " + m.note : ""} (${c[1].toLowerCase()})`;
        const room = (k + 1 < marked.length ? (marked[k + 1][0] - j) * colW : svgW - x) - 12;
        const fit = Math.floor(room / 5.6);
        const label = m.note && fit >= 3 ? (m.note.length > fit ? m.note.slice(0, fit - 1) + "…" : m.note) : "";
        const fy = Math.max(0, top - 11);
        tsvg.push(`<g class="sl-marker" data-marker="${j}" style="--mk:${c[2]}"><line x1="${x}" x2="${x}" y1="0" y2="${top}"/><rect class="sl-mkhit" x="${x - 7}" y="${Math.max(0, top - 16)}" width="14" height="16"/><path d="M${x - 5} ${fy}h10v7l-5 4-5-4z"/>${label ? `<text class="sl-mklabel" x="${x + 7}" y="${fy + 7}">${esc(label)}</text>` : ""}<title>${esc(tip)}. Double-click to write a note, change its color or delete it.</title></g>`);
        svg.push(`<g class="sl-marker" data-marker="${j}" style="--mk:${c[2]}"><line x1="${x}" x2="${x}" y1="0" y2="${svgH}"/><title>${esc(tip)}</title></g>`);
      });
      if (area) svg.push(`<rect class="sl-area" x="${area.j0 * colW}" y="${area.i0 * lh}" width="${(area.j1 - area.j0 + 1) * colW}" height="${(area.i1 - area.i0 + 1) * lh}"><title>Selected: moments ${area.j0 + 1} to ${area.j1 + 1}, ${area.i1 - area.i0 + 1} lane${area.i1 > area.i0 ? "s" : ""}. Drag it sideways to move it (hold Alt to copy), or Copy, then pick where it goes and Paste.</title></rect>`);
      const ix = st.rows.map((r) => r.id);
      lanes.forEach((ln, i) => {
        if (!ln.track) return;
        /* The result line (what plays), then the automation: nodes joined by lines. */
        const pts = st.rows.map((r, j) => [j * colW + colW / 2, yFor(ln.cur, Eng.value(r.id, ln.track, ln.cur), i)]);
        svg.push(`<polyline class="sl-result" points="${pts.map((p) => p.join(",")).join(" ")}"/>`);
        const lane = st.lanes[ln.lk];
        if (!lane) return;
        const all = Object.keys(lane.points)
          .filter((r) => ix.includes(r))
          .map((r) => ({ r, j: ix.indexOf(r), v: lane.points[r] }))
          .sort((a, b) => a.j - b.j);
        const cpts = curvePoints(st, ln.lk, all);
        const nodes = all.filter((p) => !cpts.has(p.r));
        const xyOf = (p) => [p.j * colW + colW / 2, yFor(ln.cur, p.v, i)];
        const xy = nodes.map(xyOf);
        if (xy.length > 1) {
          let d = `M${xy[0][0]} ${xy[0][1]}`;
          for (let k = 1; k < xy.length; k++) {
            const sk = segKey(ln.lk, nodes[k - 1].r, nodes[k].r);
            const rec = curves[sk] && curveOk(st, ln.lk, nodes[k - 1], nodes[k], curves[sk]) ? curves[sk] : null;
            const part = rec ? curvePath(ln.cur, i, nodes[k - 1], nodes[k], rec, colW) : segPath(xy[k - 1], xy[k], lane.mode);
            d += " " + part;
            const hit = `M${xy[k - 1][0]} ${xy[k - 1][1]} ` + part;
            svg.push(`<path class="sl-seghit${seg === sk ? " on" : ""}" d="${hit}" data-seg="${esc(sk)}"><title>A line from moment ${nodes[k - 1].j + 1} to ${nodes[k].j + 1}${rec ? ` (curve: ${esc(SHAPES[rec.shape] ? SHAPES[rec.shape][0] : rec.shape)})` : ""}. Click to pick it, double-click to shape its curve.</title></path>`);
          }
          svg.push(`<path class="sl-auto${lane.on ? "" : " off"}" d="${d}"/>`);
        }
        all.forEach((p) => {
          const key = nodeKey(p.r, ln.lk);
          const c = xyOf(p);
          const small = cpts.has(p.r);
          dots.push(`<circle class="sl-node${small ? " sl-cpt" : ""}${lane.on ? "" : " off"}${sel === key ? " on" : ""}${inArea(i, p.j) && !isLocked(ln.lk) ? " in" : ""}" cx="${c[0]}" cy="${c[1]}" r="${small ? 3.5 : 6}" data-node="${esc(key)}" data-lane="${i}"><title>${esc(S().label(ln.cur))}: ${esc(p.v)} at moment ${p.j + 1}${small ? " (on a curve)" : ""}</title></circle>`);
        });
      });
      /* Proximities: a line from node to node. */
      const laneIx = {};
      lanes.forEach((ln, i) => ln.lk && (laneIx[ln.lk] = i));
      const ixRow = {};
      st.rows.forEach((r, j) => (ixRow[r.id] = j));
      st.links.forEach((l) => {
        if (!l.scope) return;
        const a = laneIx[l.from.track + "|" + l.from.curiosity];
        const b = laneIx[l.to.track + "|" + l.to.curiosity];
        if (a == null || b == null) return;
        const x1 = ixRow[l.scope.from] * colW + colW / 2;
        const x2 = ixRow[l.scope.to] * colW + colW / 2;
        const y1 = yFor(l.from.curiosity, Eng.value(l.scope.from, l.from.track, l.from.curiosity), a);
        const y2 = yFor(l.to.curiosity, Eng.value(l.scope.to, l.to.track, l.to.curiosity), b);
        const mx = (x1 + x2) / 2 + (x1 === x2 ? 18 : 0);
        svg.push(`<path class="sl-link${l.on ? "" : " off"}" d="M${x1} ${y1} Q${mx} ${(y1 + y2) / 2} ${x2} ${y2}" data-link="${esc(l.id)}"><title>${esc(l.label || "Proximity")}${l.suite ? " (in a proximity suite)" : ""}. Click to switch off or remove.</title></path>`);
      });
      const others = st.links.filter((l) => !l.scope && laneIx[l.from.track + "|" + l.from.curiosity] != null && laneIx[l.to.track + "|" + l.to.curiosity] != null).length;
      const tb = (act, label, title, on) => `<button type="button" data-act="${act}" class="sl-tb${on ? " on" : ""}" title="${esc(title)}"${on == null ? "" : ` aria-pressed="${!!on}"`}>${label}</button>`;
      const canCopy = !!(sel || area);
      const pasteLabel = clip && clip.kind === "area" && area ? "Paste into the selection" : `Paste at moment ${playRow + 1}`;
      const old = el.querySelector(".sl-scroll");
      const keep = old ? [old.scrollLeft, old.scrollTop] : scrollKeep;
      el.innerHTML = `<div class="sl-tools">
          <span class="sl-seg" role="group" aria-label="Tool">${tb("tool-select", "Select", "Select (A): click a node to pick it, click an empty spot to add a node there, drag across empty space to select an area", tools.tool === "select")}${tb("tool-split", "Split", "Split (B): click a lane to cut its line with a node, keeping what plays", tools.tool === "split")}</span>
          <button type="button" data-act="undo" ${Eng.canUndo() ? "" : "disabled"}>Undo</button><button type="button" data-act="redo" ${Eng.canRedo() ? "" : "disabled"}>Redo</button>
          <button type="button" data-act="copy" ${canCopy ? "" : "disabled"} title="${area ? "Copy every lane's automation inside the selected area" : "Copy the picked node with every node joined to it"}">${area ? "Copy selection" : "Copy proximity"}</button>
          <button type="button" data-act="paste" ${clip ? "" : "disabled"} title="${area ? "Paste into the selected area (onto other lanes too: each value keeps its place on the new lane's scale)" : "Paste at the playhead's moment"}">${esc(pasteLabel)}</button>
          <button type="button" data-act="del" ${canCopy ? "" : "disabled"} title="Delete (⌫)">${area ? "Remove nodes" : "Remove node"}</button>
          ${area ? `<span class="sl-seg sl-areatools" role="group" aria-label="Change the selected area">${tb("area-reverse", "Reverse", "Reverse: play the selected stretch backwards. The last node comes first and the first comes last.")}${tb("area-flip", "Flip", "Flip: turn each selected node's setting upside down on its own lane. Low becomes high, high becomes low.")}${tb("area-stretch", "Stretch ×2", "Stretch: spread the selected nodes out so they take twice as long. Nodes already in the moments they spread over are replaced.")}${tb("area-squeeze", "Squeeze ½", "Squeeze: pull the selected nodes together so they take half as long.")}${tb("area-freeze", "Freeze", "Freeze: hold the first moment's settings still for the whole selected stretch.")}${tb("area-shape", "Shape ▾", "Shape: pick a ready-made shape (ease in, rise and fall, pulse and more) for each selected lane, between its own lowest and highest setting in the selection.")}</span>` : ""}
          ${tb("curves", "Curves", "Shape the curve of the picked line, or the line under the playhead in the picked lane (double-click a line too)")}
          <span class="sl-seg" role="group" aria-label="Markers">${tb("marker", "Marker", "Add marker (M) at the playhead's moment; press again to take it off. Double-click a marker's flag on the ruler to write a note or change its color.")}${tb("marker-list", `Markers${marked.length ? " " + marked.length : ""} ▾`, "Every marker in your film, with its note: click one to move the playhead there")}</span>
          ${tb("magnet", "Magnet", "Main track magnet (P): moving a node moves every later node in its lane too", tools.magnet)}
          ${tb("snap", "Snapping", "Auto snapping (N): a node dropped next to a marker lands on it", tools.snap)}
          <span class="sl-seg" role="group" aria-label="Linkage">${tb("linkage", "Linkage", "Linkage (~): joined nodes move and copy together", tools.linkage)}${tb("link-settings", "⚙", "Linkage settings: which kinds of joined node move, copy or get deleted with the one you grab")}</span>
          ${tb("skim", "Preview axis", "Preview axis (S): hover over the timeline to see that moment in the player", tools.skim)}
          <span class="sl-seg" role="group" aria-label="Zoom">${tb("zoom-out", "−", "Zoom out (⌘−), or drag up on the ruler")}${tb("zoom-fit", "Fit", "Zoom to fit the timeline (⇧Z)")}${tb("zoom-in", "+", "Zoom in (⌘+), or drag down on the ruler")}</span>
          <span class="sl-msg" role="status">${esc(msg || (area ? "Drag the selection sideways to move it; hold Alt (Option) to copy it instead." : others ? others + " more proximities between these lanes are rules for the whole lane (no nodes); the Engine's Links tab lists them." : "Drag down on the ruler to zoom in; drag right on the lane names for taller lanes. Drag across empty space to select."))}</span>
        </div>
        <div class="sl-scroll"><div class="sl-body" style="grid-template-columns: var(--sl-head-w, 190px) ${svgW}px">
          <div class="sl-corner" style="height:${top}px">${clipRows.map((cr) => `<div class="sl-head sl-cliphead" style="height:${CLIP_H}px" title="${esc(cr.title || "")}">${esc(cr.label)}</div>`).join("")}${opts.ruler ? `<div class="sl-rulerhead" style="height:${RULER + 8}px" title="Drag the ruler: down zooms in, up zooms out, sideways scrolls">⇕ zoom · ⇔ scroll</div>` : ""}</div>
          <div class="sl-top" style="height:${top}px"><svg class="sl-topsvg" width="${svgW}" height="${top}" viewBox="0 0 ${svgW} ${Math.max(1, top)}">${tsvg.join("")}</svg></div>
          <div class="sl-heads" title="Drag right for taller lanes, left for shorter; drag up and down to scroll. Click a lane's name area to select the whole lane (Shift adds more lanes).">${heads}</div>
          <div class="sl-lanes"><svg class="sl-svg" width="${svgW}" height="${Math.max(1, svgH)}" viewBox="0 0 ${svgW} ${Math.max(1, svgH)}"><defs><pattern id="${hatchId}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="sl-hatch" x1="0" y1="0" x2="0" y2="9"/></pattern></defs>${svg.join("")}${dots.join("")}${drag && drag.ghost ? drag.ghost : ""}</svg></div>
        </div></div>`;
      const sc = el.querySelector(".sl-scroll");
      const box = el.closest(".sc-timeline");
      if (box) {
        const room = box.getBoundingClientRect().bottom - sc.getBoundingClientRect().top - 14;
        sc.style.maxHeight = Math.max(160, Math.round(room)) + "px";
      }
      if (keep) {
        sc.scrollLeft = keep[0];
        sc.scrollTop = keep[1];
      }
    }
    let scrollKeep = null;
    /* The value lines inside a lane: one per step of its scale, thinned out until they are at least 7px apart, so a
       taller lane shows finer gradations (a 0 to 100 range: tens, then fives, then every step). */
    function valueLines(cur, y0, w) {
      const steps = S().steps(cur);
      const inner = lh - PAD * 2;
      const sp = inner / Math.max(1, steps);
      const stride = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 500, 1000].find((s) => sp * s >= 7) || steps;
      const out = [];
      for (let k = 0; k <= steps; k += stride) {
        const y = y0 + PAD + inner - k * sp;
        const cls = k === 0 || k === steps ? "sl-vedge" : (k / stride) % 5 === 0 || k * 2 === steps ? "sl-vmajor" : "sl-vfine";
        out.push(`<line class="${cls}" x1="0" x2="${w}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`);
      }
      return out.join("");
    }
    /* A tall lane writes its scale beside its name: the words of a list, or the numbers of a range. */
    function scaleTicks(cur) {
      if (!S() || !S().known(cur) || lh < 76) return "";
      const d = S().domain(cur);
      const inner = lh - PAD * 2;
      let marks = [];
      if (d.kind === "range") marks = [0, 0.5, 1].map((p) => [p, S().at(cur, p) + (d.unit || "")]);
      else {
        const o = d.options || [];
        const every = Math.ceil((o.length * 12) / inner);
        marks = o.map((v, k) => [o.length > 1 ? k / (o.length - 1) : 0.5, v]).filter((m, k) => k % every === 0 || k === o.length - 1);
      }
      return `<div class="sl-ticks" aria-hidden="true">${marks.map(([p, v]) => `<span style="top:${(PAD + (1 - p) * inner).toFixed(1)}px">${esc(String(v).slice(0, 14))}</span>`).join("")}</div>`;
    }

    function at(e) {
      const svg = el.querySelector(".sl-svg");
      const r = svg.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const j = Math.max(0, Math.min(geo.n - 1, Math.floor(x / geo.colW)));
      const i = Math.floor((y - geo.top) / geo.lh);
      const ln = geo.lanes[i];
      let p = null;
      if (ln) p = 1 - (y - geo.top - i * geo.lh - PAD) / (geo.lh - PAD * 2);
      return { x, y, j, i, ln, p: p == null ? null : Math.max(0, Math.min(1, p)) };
    }
    function say(m) {
      msg = m || "";
      const s = el.querySelector(".sl-msg");
      if (s) s.textContent = msg;
    }
    function send(m) {
      /* Lock: nothing on the timeline changes a locked lane's nodes. */
      const lk = lockedIn(m);
      if (lk) {
        say(lockSay(lk));
        return { ok: false, error: lockSay(lk), locked: true };
      }
      const r = E().send(m);
      if (!r.ok) say(r.error);
      return r;
    }
    /* ---------- moving around: zoom and scroll (Jeremy, 20:26Z) ----------
       Ruler (the top bar): drag down to zoom in, up to zoom out, sideways to scroll, all at once, keeping the
       moment under the pointer in place. Lane names (the left side): drag right for taller lanes, left for
       shorter, up and down to scroll. In the grid: two fingers scroll both ways (the browser's own scrolling);
       pinch or ⌘/Ctrl + scroll zooms; Alt + scroll changes lane height. On a touch screen, two fingers pan. */
    const scroller = () => el.querySelector(".sl-scroll");
    const headW = () => (el.querySelector(".sl-heads") || {}).offsetWidth || 190;
    const topH = () => (el.querySelector(".sl-top") || {}).offsetHeight || 0;
    function zoomAt(z, vx) {
      const sc = scroller();
      if (!sc || !geo) return;
      const frac = (sc.scrollLeft + vx - headW()) / Math.max(1, geo.svgW);
      tools.zoom = Math.max(0.25, Math.min(32, z));
      draw();
      const sc2 = scroller();
      sc2.scrollLeft = Math.max(0, frac * geo.svgW + headW() - vx);
    }
    function laneAt(h, vy) {
      const sc = scroller();
      if (!sc || !geo) return;
      const frac = (sc.scrollTop + vy - topH()) / Math.max(1, geo.svgH);
      tools.laneH = Math.round(Math.max(28, Math.min(320, h)));
      draw();
      const sc2 = scroller();
      sc2.scrollTop = Math.max(0, frac * geo.svgH + topH() - vy);
    }
    let pending = null;
    const later = (fn) => {
      pending = fn;
      requestAnimationFrame(() => {
        const f = pending;
        pending = null;
        if (f) f();
      });
    };
    const touches = new Map();
    let pan = null;
    let topDrag = null;
    let lastMark = null; /* the last click on a marker's flag: { j, t } */
    let leftDrag = null;
    const center = () => {
      const v = [...touches.values()];
      return [v.reduce((a, p) => a + p.x, 0) / v.length, v.reduce((a, p) => a + p.y, 0) / v.length];
    };
    function onDown(e) {
      if (e.button > 0) return;
      const sc = scroller();
      if (e.pointerType === "touch" && sc && sc.contains(e.target)) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) {
          drag = topDrag = leftDrag = null;
          const c = center();
          pan = { c, sl: sc.scrollLeft, st: sc.scrollTop };
          return;
        }
      }
      const node = e.target.closest && e.target.closest("[data-node]");
      const link = e.target.closest && e.target.closest("[data-link]");
      const segEl = e.target.closest && e.target.closest("[data-seg]");
      const clipEl = e.target.closest && e.target.closest("[data-clip]");
      const r = sc ? sc.getBoundingClientRect() : { left: 0, top: 0 };
      if (e.target.closest && e.target.closest(".sl-top, .sl-rulerhead")) {
        let j = null;
        const markEl = e.target.closest(".sl-top [data-marker]");
        if (markEl) j = Number(markEl.dataset.marker) || 0;
        else if (clipEl) j = Number(clipEl.dataset.clip) || 0;
        else if (geo && e.target.closest(".sl-top")) j = Math.max(0, Math.min(geo.n - 1, Math.floor((sc.scrollLeft + e.clientX - r.left - headW()) / geo.colW)));
        topDrag = { x0: e.clientX, y0: e.clientY, z0: zoomOf(), frac: geo ? (sc.scrollLeft + e.clientX - r.left - headW()) / Math.max(1, geo.svgW) : 0, clip: !!clipEl, mark: !!markEl, j, moved: false };
        e.preventDefault();
        return;
      }
      if (e.target.closest && e.target.closest(".sl-heads") && !e.target.closest("button, select, input, a, label, option")) {
        const h = e.target.closest(".sl-head[data-i]");
        leftDrag = { x0: e.clientX, y0: e.clientY, h0: lh, st0: sc.scrollTop, i: h ? Number(h.dataset.i) : null, shift: e.shiftKey, moved: false };
        e.preventDefault();
        return;
      }
      if (link) {
        linkMenu(link.dataset.link, e);
        return;
      }
      if (!e.target.closest || !e.target.closest(".sl-svg")) return;
      const a = at(e);
      /* A press inside the selected area may become a sideways drag of the whole block (decided in onMove). */
      const inArea = !!area && (node ? node.classList.contains("in") : inBlock(a));
      if (node && isLocked(split(node.dataset.node).lk) && !inArea) {
        /* A locked lane's node can be picked (to copy it) but not dragged. */
        sel = node.dataset.node;
        seg = null;
        if (opts.onSelect) opts.onSelect(split(sel).cur);
        e.preventDefault();
        draw();
        say(lockSay(split(sel).lk));
        return;
      }
      if (node) {
        sel = node.dataset.node;
        seg = null;
        drag = { key: sel, start: a, copy: e.altKey || e.shiftKey, moved: false, area: inArea };
        if (opts.onSelect) opts.onSelect(split(sel).cur);
        e.preventDefault();
        return;
      }
      if (segEl) {
        /* Pick the line (no redraw, so a double-click still lands on it and opens its curve). */
        seg = segEl.dataset.seg;
        el.querySelectorAll(".sl-seghit.on").forEach((x) => x.classList.remove("on"));
        segEl.classList.add("on");
        say("Line picked: double-click it, or press Curves, to shape its curve.");
        if (inArea) drag = { add: true, start: a, copy: e.altKey || e.shiftKey, area: true, quiet: true };
        return;
      }
      if (!a.ln) return;
      drag = { add: true, start: a, copy: e.altKey || e.shiftKey, area: inArea };
      if (inArea) e.preventDefault();
    }
    /* The lanes with the locked ones inside the selected area left out (lk: null), and how many were left out:
       the area tools, Move, Remove and Paste skip locked lanes. */
    function openLanes() {
      let skipped = 0;
      const lanes = geo.lanes.map((ln, i) => (ln && area && i >= area.i0 && i <= area.i1 && isLocked(ln.lk) ? (skipped++, Object.assign({}, ln, { lk: null })) : ln));
      return { lanes, skipped };
    }
    const skipNote = (n) => (n ? ` Skipped ${n} locked lane${n === 1 ? "" : "s"} (🔒).` : "");
    const inBlock = (a) => !!area && !!a.ln && a.i >= area.i0 && a.i <= area.i1 && a.x >= area.j0 * geo.colW && a.x < (area.j1 + 1) * geo.colW;
    /* ---------- dragging the selected area sideways (CapCut: drag a group of clips along the timeline) ----------
       The whole block snaps to whole moments and stays inside the film. While dragging, a copy of the area's
       outline and its nodes slides with the pointer (the originals fade, or stay put with Alt: a copy). */
    function areaShift(a, d) {
      const dj = Math.round((a.x - d.start.x) / geo.colW);
      return Math.max(-area.j0, Math.min(geo.n - 1 - area.j1, dj));
    }
    function areaPreview(dj, copy) {
      const svg = el.querySelector(".sl-svg");
      if (!svg) return;
      let g = svg.querySelector(".sl-areaghost");
      if (!g) {
        g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const box = svg.querySelector(".sl-area");
        if (box) g.appendChild(box.cloneNode(false));
        svg.querySelectorAll(".sl-node.in").forEach((c) => {
          const k = c.cloneNode(false);
          k.removeAttribute("data-node");
          g.appendChild(k);
        });
        svg.appendChild(g);
      }
      g.setAttribute("class", "sl-areaghost" + (copy ? " copy" : ""));
      g.setAttribute("transform", `translate(${dj * geo.colW} 0)`);
      svg.classList.toggle("sl-areamoving", !copy);
      const count = svg.querySelectorAll(".sl-node.in[data-node]").length;
      const nodes = `${count} node${count === 1 ? "" : "s"}`;
      if (!dj) say(`Drag sideways to move the selection (${nodes}); hold Alt (Option) when you let go to copy instead.`);
      else say(`${copy ? "Copy" : "Move"} ${nodes} ${Math.abs(dj)} moment${Math.abs(dj) === 1 ? "" : "s"} ${dj > 0 ? "later" : "earlier"}, to moments ${area.j0 + dj + 1} to ${area.j1 + dj + 1}.${copy ? " The originals stay." : " Hold Alt (Option) to copy instead."}`);
    }
    function dropArea(dj, copy) {
      const st = E().state();
      if (!dj) {
        say("The selection is back where it was; nothing moved.");
        return draw();
      }
      const open = openLanes();
      const r = moveAreaCommands(st, open.lanes, area, dj, copy);
      if (r.error) return say(r.error), draw();
      const where = Math.abs(dj) + " moment" + (Math.abs(dj) === 1 ? "" : "s") + (dj > 0 ? " later" : " earlier");
      if (!r.nodes) {
        area = r.area;
        say(open.skipped ? `Every lane with nodes in the selection is locked, so nothing moved.${skipNote(open.skipped)}` : `The selection moved ${where}; it had no nodes in it, so the film is the same.`);
        return draw();
      }
      const out = send({ type: "batch", label: copy ? "Copy the selection" : "Move the selection", commands: r.cmds });
      if (out.ok) {
        /* A curve whose two nodes both moved keeps its shape at the new moments. */
        let kept = false;
        Object.keys(curves).forEach((sk) => {
          const p = sk.split("|");
          const ra = r.moved[nodeKey(p[2], p[0] + "|" + p[1])];
          const rb = r.moved[nodeKey(p[3], p[0] + "|" + p[1])];
          if (ra && rb) (curves[segKey(p[0] + "|" + p[1], ra, rb)] = curves[sk]), (kept = true);
        });
        if (kept) saveCurves();
        if (sel && r.moved[sel] && !copy) sel = nodeKey(r.moved[sel], split(sel).lk);
        area = r.area;
        const nodes = `${r.nodes} node${r.nodes === 1 ? "" : "s"}`;
        say(
          `${copy ? "Copied" : "Moved"} ${nodes} ${where}; they now sit at moments ${area.j0 + 1} to ${area.j1 + 1}.` +
            (copy ? " The originals stayed where they were." : "") +
            (r.links ? ` ${r.links} join${r.links === 1 ? "" : "s"} came along.` : "") +
            (r.replaced ? ` ${r.replaced} node${r.replaced === 1 ? " that was" : "s that were"} already there ${r.replaced === 1 ? "was" : "were"} replaced.` : "") +
            skipNote(open.skipped) +
            " Undo (⌘Z) puts everything back."
        );
      }
      const keep = msg;
      draw();
      say(keep);
    }
    let hoverJ = -1;
    function onMove(e) {
      if (touches.has(e.pointerId)) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pan && touches.size >= 2) {
          const c = center();
          const sc = scroller();
          if (sc) {
            sc.scrollLeft = pan.sl - (c[0] - pan.c[0]);
            sc.scrollTop = pan.st - (c[1] - pan.c[1]);
          }
          return;
        }
      }
      if (topDrag) {
        const dx = e.clientX - topDrag.x0;
        const dy = e.clientY - topDrag.y0;
        if (!topDrag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        topDrag.moved = true;
        const r = scroller().getBoundingClientRect();
        const z = topDrag.z0 * Math.exp(dy * 0.012);
        const vx = e.clientX - r.left;
        const frac = topDrag.frac;
        /* Keep the moment grabbed under the pointer: zooming stretches around it, moving sideways scrolls. */
        later(() => {
          tools.zoom = Math.max(0.25, Math.min(32, z));
          draw();
          scroller().scrollLeft = Math.max(0, frac * geo.svgW + headW() - vx);
        });
        return;
      }
      if (leftDrag) {
        const dx = e.clientX - leftDrag.x0;
        const dy = e.clientY - leftDrag.y0;
        if (!leftDrag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        leftDrag.moved = true;
        const sc = scroller();
        const r = sc.getBoundingClientRect();
        if (Math.abs(dx) > Math.abs(dy) * 0.6) {
          const h = leftDrag.h0 * Math.exp(dx * 0.012);
          const vy = e.clientY - r.top;
          later(() => laneAt(h, vy));
        } else sc.scrollTop = Math.max(0, leftDrag.st0 - dy);
        return;
      }
      if (!drag && area && geo && e.target.closest && e.target.closest(".sl-svg") && el.contains(e.target)) {
        /* A grab hand over the selected area: it can be dragged sideways. */
        el.querySelector(".sl-svg").classList.toggle("sl-overarea", inBlock(at(e)));
      }
      if (!drag && tools.skim && opts.onHover && geo && e.target.closest && e.target.closest(".sl-svg") && el.contains(e.target)) {
        const a = at(e);
        if (a.j !== hoverJ) opts.onHover((hoverJ = a.j));
        return;
      }
      if (!drag) return;
      const a = at(e);
      if (Math.abs(a.x - drag.start.x) + Math.abs(a.y - drag.start.y) > 4) drag.moved = true;
      if (!drag.moved) return;
      if (drag.area && !drag.areaMove) {
        /* Inside the selected area: mostly sideways moves the whole block; mostly up or down does what it did
           before (a node's setting, or a new selection box). */
        if (Math.abs(a.x - drag.start.x) >= Math.abs(a.y - drag.start.y)) drag.areaMove = true;
        drag.area = false;
      }
      if (drag.areaMove) {
        if (area) areaPreview(areaShift(a, drag), drag.copy || e.altKey || e.shiftKey);
        return;
      }
      const svg = el.querySelector(".sl-svg");
      if (drag.add) {
        /* Dragging across empty space draws a selection box. */
        let b = svg.querySelector(".sl-boxing");
        if (!b) {
          b = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          b.setAttribute("class", "sl-boxing");
          svg.appendChild(b);
        }
        b.setAttribute("x", Math.min(a.x, drag.start.x));
        b.setAttribute("y", Math.min(a.y, drag.start.y));
        b.setAttribute("width", Math.abs(a.x - drag.start.x));
        b.setAttribute("height", Math.abs(a.y - drag.start.y));
        return;
      }
      let g = svg.querySelector(".sl-ghost");
      if (!g) {
        g = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        g.setAttribute("class", "sl-ghost" + (drag.copy || e.altKey || e.shiftKey ? " copy" : ""));
        g.setAttribute("r", "7");
        svg.appendChild(g);
      }
      g.setAttribute("cx", a.j * geo.colW + geo.colW / 2);
      g.setAttribute("cy", a.y);
    }
    function onUp(e) {
      if (touches.has(e.pointerId)) {
        touches.delete(e.pointerId);
        if (pan) {
          if (touches.size < 2) pan = null;
          return;
        }
      }
      if (topDrag) {
        const d = topDrag;
        topDrag = null;
        if (d.moved) {
          lastMark = null;
          saveTools();
          say(`Zoom ${Math.round(zoomOf() * 100)}%. Finer lines show as you zoom in.`);
          return;
        }
        /* A second click on the same marker's flag soon after the first is a double-click: open its pop-up.
           (The first click moved the playhead and redrew, so the browser's own dblclick may not reach the flag.) */
        const now = Date.now();
        if (d.mark && lastMark && lastMark.j === d.j && now - lastMark.t < 500) {
          lastMark = null;
          openMarker(d.j, e.clientX, e.clientY);
          return;
        }
        lastMark = d.mark ? { j: d.j, t: now } : null;
        if (d.j != null && opts.onClip) opts.onClip(d.j);
        return;
      }
      if (leftDrag) {
        const d = leftDrag;
        leftDrag = null;
        if (d.moved) return saveTools();
        if (d.i == null || !geo) return;
        /* A click on a lane's name area selects the whole lane; Shift adds lanes up to it. */
        const last = geo.n - 1;
        area = d.shift && area ? { i0: Math.min(area.i0, d.i), i1: Math.max(area.i1, d.i), j0: 0, j1: last } : { i0: d.i, i1: d.i, j0: 0, j1: last };
        sel = null;
        seg = null;
        say(`${area.i1 - area.i0 + 1} lane${area.i1 > area.i0 ? "s" : ""} selected. Copy, then pick another lane or area and Paste. Drag a selection sideways to move it; hold Alt to copy.`);
        return draw();
      }
      if (!drag) return;
      const d = drag;
      drag = null;
      const a = at(e);
      const st = E().state();
      if (d.areaMove) return area ? dropArea(areaShift(a, d), d.copy || e.altKey || e.shiftKey) : draw();
      if (d.quiet && !d.moved) return;
      if (d.add && d.moved) {
        const j0 = Math.max(0, Math.min(geo.n - 1, Math.floor(Math.min(a.x, d.start.x) / geo.colW)));
        const j1 = Math.max(0, Math.min(geo.n - 1, Math.floor(Math.max(a.x, d.start.x) / geo.colW)));
        const i0 = Math.max(0, Math.min(geo.lanes.length - 1, Math.floor(Math.min(a.y, d.start.y) / geo.lh)));
        const i1 = Math.max(0, Math.min(geo.lanes.length - 1, Math.floor(Math.max(a.y, d.start.y) / geo.lh)));
        area = { i0, i1, j0, j1 };
        sel = null;
        seg = null;
        say(`Selected moments ${j0 + 1} to ${j1 + 1} on ${i1 - i0 + 1} lane${i1 > i0 ? "s" : ""}. Drag it sideways to move it (Alt copies), or Copy and Paste elsewhere.`);
        return draw();
      }
      if (d.add) {
        if (area || seg) {
          /* A click on empty space first lets go of a selection. */
          area = null;
          seg = null;
          say("");
          return draw();
        }
        if (!a.ln || a.ln !== d.start.ln) return draw();
        if (isLocked(a.ln.lk)) return say(lockSay(a.ln.lk));
        let track = a.ln.track;
        if (!track) track = ensure(a.ln.cur);
        if (!track) return say("Every track is full; remove a lane first.");
        const rowId = E().state().rows[a.j].id;
        const v = tools.tool === "split" ? E().value(rowId, track, a.ln.cur) : S().at(a.ln.cur, a.p);
        const r = send({ type: "setPoint", row: rowId, track, curiosity: a.ln.cur, value: v, label: tools.tool === "split" ? "Split a line" : "Add a node" });
        if (r.ok) {
          sel = nodeKey(E().state().rows[a.j].id, track + "|" + a.ln.cur);
          say(`${S().label(a.ln.cur)} is ${v} at moment ${a.j + 1}.`);
        }
        return draw();
      }
      if (!d.moved) return draw();
      const from = split(d.key);
      const target = e.target.closest && e.target.closest("[data-node]");
      const copy = d.copy || e.altKey || e.shiftKey;
      /* Dropped on another lane's node: join them (a proximity). */
      if (target && target.dataset.node !== d.key && split(target.dataset.node).lk !== from.lk) {
        const lockLk = [from.lk, split(target.dataset.node).lk].find(isLocked);
        if (lockLk) return draw(), say(lockSay(lockLk));
        const r = send(Object.assign(linkCommand(st, from, split(target.dataset.node)), {}));
        if (r.ok) say("Joined: they now move and copy together. Copy proximity takes the pair to another scene.");
        return draw();
      }
      const ix = st.rows.findIndex((r) => r.id === from.row);
      let tj = a.j;
      if (tools.snap && tj !== ix) {
        /* Auto snapping: a marker one moment away pulls the node onto it (moments are whole steps already). */
        const pulls = st.rows.map((r, j) => (markerOf(r.id) ? j : -9));
        const near = pulls.filter((j) => j !== ix && Math.abs(j - tj) === 1);
        if (near.length && !pulls.includes(tj)) tj = near[0];
      }
      const dj = tj - ix;
      const onOwnLane = a.ln && a.ln.lk === from.lk;
      const cmds = [];
      let label = "Change a node";
      if (dj !== 0) {
        const sh = shiftCommands(st, d.key, dj, copy, { solo: !tools.linkage, ripple: tools.magnet && !copy, allow: kindOk });
        if (sh.error) return say(sh.error), draw();
        cmds.push(...sh.cmds);
        label = (copy ? "Copy " : "Move ") + (sh.links ? (sh.links > 1 ? "a proximity suite" : "a proximity") : "a node");
        if (sh.links) say(`${copy ? "Copied" : "Moved"} ${sh.size} joined nodes together.`);
      }
      if (onOwnLane && a.p != null) {
        const v = S().at(from.cur, a.p);
        const newRow = st.rows[ix + dj].id;
        cmds.push({ type: "setPoint", row: newRow, track: from.track, curiosity: from.cur, value: v });
        /* Keep the links' values in step with the node. */
        st.links.forEach((l) => {
          if (!l.scope) return;
          if (l.from.track + "|" + l.from.curiosity === from.lk && l.scope.from === from.row && !copy) cmds.push({ type: "updateLink", link: l.id, changes: { from: { is: v } } });
          if (l.to.track + "|" + l.to.curiosity === from.lk && l.scope.to === from.row && !copy && l.does === "set") cmds.push({ type: "updateLink", link: l.id, changes: { value: v } });
        });
        sel = nodeKey(newRow, from.lk);
      } else if (dj !== 0) sel = nodeKey(st.rows[ix + dj].id, from.lk);
      if (cmds.length) send({ type: "batch", label, commands: cmds });
      draw();
    }
    function removeNode(key) {
      const st = E().state();
      const doomed = tools.linkage && tools.linkDelete ? group(key, st, kindOk).nodes : [key];
      const cmds = [];
      st.links.forEach((l) => {
        const ends = linkEnds(l);
        if (ends && ends.some((k) => doomed.includes(k))) cmds.push({ type: "removeLink", link: l.id });
      });
      doomed.forEach((k) => {
        const n = split(k);
        if (st.lanes[n.lk] && st.lanes[n.lk].points[n.row] != null) cmds.push({ type: "removePoint", row: n.row, track: n.track, curiosity: n.cur });
      });
      if (cmds.length) send({ type: "batch", label: doomed.length > 1 ? "Remove joined nodes" : "Remove a node", commands: cmds });
      sel = null;
      draw();
    }
    function linkMenu(id, e) {
      const l = E().state().links.find((x) => x.id === id);
      if (!l) return;
      const old = el.querySelector(".sl-pop");
      if (old) old.remove();
      const pop = document.createElement("div");
      pop.className = "sl-pop";
      const r = el.getBoundingClientRect();
      pop.style.left = Math.max(0, e.clientX - r.left - 60) + "px";
      pop.style.top = Math.max(0, e.clientY - r.top + 8) + "px";
      pop.innerHTML = `<p>${esc(l.label || "Proximity")}</p><button type="button" data-l="toggle">${l.on ? "Switch off" : "Switch on"}</button><button type="button" data-l="remove">Remove the line</button><button type="button" data-l="close">Close</button>`;
      pop.onclick = (ev) => {
        const b = ev.target.closest("[data-l]");
        if (!b) return;
        if (b.dataset.l === "toggle") send({ type: "toggleLink", link: id });
        if (b.dataset.l === "remove") send({ type: "removeLink", link: id, label: "Remove a proximity" });
        pop.remove();
        draw();
      };
      el.appendChild(pop);
    }
    /* The lane head's buttons: Off, Solo and Lock. Focus goes back to the button after the redraw (keyboard). */
    function laneButton(act, lk) {
      const out = act === "lane-off" ? laneOff(lk) : act === "lane-solo" ? laneSolo(lk) : laneLock(lk);
      const keep = msg;
      draw();
      say(keep);
      const again = el.querySelector(`.sl-heads [data-act="${act}"][data-lk="${CSS.escape(lk)}"]`);
      if (again) again.focus();
      return out;
    }
    function laneOff(lk) {
      const st = E().state();
      const lane = st.lanes[lk];
      if (!lane) return say("That lane has no nodes yet, so there is nothing to turn off."), { ok: false };
      const name = S().label(lk.slice(lk.indexOf("|") + 1));
      const r = E().send(Object.assign(onCmd(lk, !lane.on), { label: lane.on ? "Turn a lane off" : "Turn a lane on" }));
      say(r.ok ? (lane.on ? `${name}'s automation is off: it no longer changes the film. Its nodes stay; 👁 turns it back on.` : `${name}'s automation is on again.`) : r.error);
      return r;
    }
    function laneSolo(lk) {
      const st = E().state();
      const r = soloCommands(st, lk, tools.solo);
      if (r.error) return say(r.error), { ok: false };
      const name = S().label(lk.slice(lk.indexOf("|") + 1));
      const out = r.cmds.length ? E().send({ type: "batch", label: r.off ? "Un-solo a lane" : "Solo a lane", commands: r.cmds }) : { ok: true };
      if (!out.ok) return say(out.error), out;
      tools.solo = r.solo;
      saveTools();
      say(r.off ? `Solo off: the other lanes are back the way they were.` : `Solo: only ${name}'s automation plays now. Press S again to bring the other lanes back.`);
      return out;
    }
    function laneLock(lk) {
      const name = S().label(lk.slice(lk.indexOf("|") + 1));
      if (tools.locks[lk]) delete tools.locks[lk];
      else tools.locks[lk] = true;
      saveTools();
      say(tools.locks[lk] ? `${name} is locked: its nodes can't be added, moved or removed on the timeline.` : `${name} is unlocked.`);
      return { ok: true, locked: !!tools.locks[lk] };
    }
    function onClick(e) {
      const w = e.target.closest("[data-open-win]");
      if (w) return opts.onOpen ? opts.onOpen(w.dataset.openWin) : null;
      const b = e.target.closest("button[data-act]");
      const pick = e.target.closest("[data-pick]");
      if (pick && opts.onSelect) opts.onSelect(pick.dataset.pick);
      if (!b) return;
      const act = b.dataset.act;
      if (act === "undo") E().undo();
      if (act === "redo") E().redo();
      if (act === "copy") return command("copy");
      if (act === "paste") return command("paste");
      if (act === "del") return command("delete");
      if (act === "curves") return command("curves");
      if (act === "link-settings") return linkSettings();
      if (act === "marker-list") return markerList(b);
      if (act === "area-shape") return shapeMenu(b);
      if (act === "lane-off" || act === "lane-solo" || act === "lane-lock") return laneButton(act, b.dataset.lk);
      if (act === "mode" && b.dataset.lk) {
        /* Maya's graph editor tangents in plain words: glide (linear) or jump (stepped). */
        const st = E().state();
        const lane = st.lanes[b.dataset.lk];
        const at = b.dataset.lk.indexOf("|");
        if (lane) {
          /* Glide, then Smooth, then Jump. An engine without smooth refuses it, so the switch skips to Jump. */
          const order = ["ramp", "smooth", "hold"];
          const base = { type: "laneMode", track: b.dataset.lk.slice(0, at), curiosity: b.dataset.lk.slice(at + 1) };
          let next = order[(order.indexOf(modeOf(lane)) + 1) % order.length];
          let r = E().send(Object.assign({}, base, { mode: next, label: MODES[next][3] }));
          if (!r.ok && next === "smooth") r = E().send(Object.assign({}, base, { mode: (next = "hold"), label: MODES.hold[3] }));
          if (!r.ok) say(r.error);
        }
        return draw();
      }
      if (TOOL_ACTS[act]) return command(TOOL_ACTS[act]);
      draw();
    }
    let look = null; /* copied attributes: one node's setting */
    /* How a lane moves between its nodes, in plain words for Maya's graph editor tangents. */
    const MODES = {
      ramp: ["ramp", "⟋ Glide", "Glides: a straight line from node to node (Maya's linear curve).", "Make a lane glide"],
      smooth: ["smooth", "∿ Smooth", "Smooth: eases out of each node and into the next (Maya's spline curve).", "Make a lane smooth"],
      hold: ["hold", "⌐ Jump", "Jumps: holds each node's setting until the next node (Maya's stepped curve).", "Make a lane jump"],
    };
    const modeOf = (lane) => (MODES[lane.mode] ? lane.mode : "ramp");
    const TOOL_ACTS = { "tool-select": "select", "tool-split": "split", marker: "marker", magnet: "magnet", snap: "snap", linkage: "linkage", skim: "skim", "zoom-in": "zoomIn", "zoom-out": "zoomOut", "zoom-fit": "zoomFit", "area-reverse": "reverse", "area-flip": "flip", "area-stretch": "stretch", "area-squeeze": "squeeze", "area-freeze": "freeze" };
    /* The nodes of a lane in film order, as keys. */
    function laneNodes(st, lk) {
      const lane = st.lanes[lk];
      if (!lane) return [];
      const ix = st.rows.map((r) => r.id);
      return Object.keys(lane.points).filter((r) => ix.includes(r)).sort((a, b) => ix.indexOf(a) - ix.indexOf(b)).map((r) => nodeKey(r, lk));
    }
    /* Step to the node on the left or right: of the picked node in its lane, or of the playhead in the first lane with nodes. */
    function step(dir) {
      const st = E().state();
      const ix = st.rows.map((r) => r.id);
      let lk = sel ? split(sel).lk : null;
      let from = sel ? ix.indexOf(split(sel).row) : opts.row ? opts.row() + (dir < 0 ? 0.5 : -0.5) : 0;
      if (!lk) lk = (geo ? geo.lanes : []).map((ln) => ln.lk).find((k) => k && laneNodes(st, k).length);
      if (!lk) return { ok: false, error: "There are no nodes to pick yet." };
      const list = laneNodes(st, lk).map((k) => [k, ix.indexOf(split(k).row)]);
      const hit = dir < 0 ? list.filter((x) => x[1] < from).pop() : list.find((x) => x[1] > from);
      if (!hit) return { ok: false, error: dir < 0 ? "No node further left in this lane." : "No node further right in this lane." };
      sel = hit[0];
      if (opts.onSelect) opts.onSelect(split(sel).cur);
      return { ok: true };
    }
    /* command(name): what the toolbar buttons and the Screen's keyboard shortcuts do. */
    function command(name, preset) {
      const st = E() && E().state();
      if (!st) return { ok: false };
      let out = { ok: true };
      const playRow = opts.row ? opts.row() : 0;
      if (name === "select" || name === "split") {
        tools.tool = name;
        say(name === "split" ? "Split: click a lane to cut its line with a node." : "Select: click a node to pick it, or an empty spot to add one.");
      } else if (name === "magnet") {
        tools.magnet = !tools.magnet;
        say(tools.magnet ? "Magnet on: later nodes in a lane move along with the one you move." : "Magnet off.");
      } else if (name === "snap") {
        tools.snap = !tools.snap;
        say(tools.snap ? "Auto snapping on: nodes dropped next to a marker land on it." : "Auto snapping off.");
      } else if (name === "splitHere" || name === "splitAll") {
        /* CapCut's Split (⌘B) and Split all (⌘⇧B): a node on the line at the playhead, keeping what plays. */
        const r = st.rows[playRow];
        const lns = (geo ? geo.lanes : []).filter((ln) => ln.track && (name === "splitAll" || (sel ? ln.lk === split(sel).lk : ln === geo.lanes.find((x) => x.track))));
        const cmds = r ? lns.filter((ln) => !(st.lanes[ln.lk] && st.lanes[ln.lk].points[r.id] != null)).map((ln) => ({ type: "setPoint", row: r.id, track: ln.track, curiosity: ln.cur, value: E().value(r.id, ln.track, ln.cur) })) : [];
        if (!cmds.length) return say("Nothing to split at this moment."), { ok: false };
        out = send({ type: "batch", label: name === "splitAll" ? "Split every lane" : "Split a line", commands: cmds });
        if (out.ok && name === "splitHere") sel = nodeKey(r.id, cmds[0].track + "|" + cmds[0].curiosity);
        say(out.ok ? `Split ${cmds.length} lane${cmds.length === 1 ? "" : "s"} at moment ${playRow + 1}.` : out.error);
      } else if (name === "deleteLeft" || name === "deleteRight") {
        /* CapCut's Delete left (Q) and Delete right (W): every node of the picked lane before or after the playhead. */
        const lkey = sel ? split(sel).lk : ((geo ? geo.lanes : []).find((ln) => ln.lk && laneNodes(st, ln.lk).length) || {}).lk;
        const ix = st.rows.map((x) => x.id);
        const doomed = lkey ? laneNodes(st, lkey).filter((k) => (name === "deleteLeft" ? ix.indexOf(split(k).row) < playRow : ix.indexOf(split(k).row) > playRow)) : [];
        if (!doomed.length) return say("No nodes on that side of the playhead."), { ok: false };
        const cmds = [];
        st.links.forEach((l) => {
          const ends = linkEnds(l);
          if (ends && ends.some((k) => doomed.includes(k))) cmds.push({ type: "removeLink", link: l.id });
        });
        doomed.forEach((k) => {
          const n = split(k);
          cmds.push({ type: "removePoint", row: n.row, track: n.track, curiosity: n.cur });
        });
        out = send({ type: "batch", label: name === "deleteLeft" ? "Delete left" : "Delete right", commands: cmds });
        if (sel && doomed.includes(sel)) sel = null;
        say(out.ok ? `Removed ${doomed.length} node${doomed.length === 1 ? "" : "s"} ${name === "deleteLeft" ? "before" : "after"} the playhead.` : out.error);
      } else if (name === "curves") {
        return openCurves();
      } else if (area && (name === "copy" || name === "cut" || name === "delete")) {
        if (name !== "delete") {
          setClip(copyArea(st, geo.lanes, area));
          const lanesN = clip.lanes.filter(Boolean).length;
          say(`Copied ${lanesN} lane${lanesN === 1 ? "" : "s"} over ${clip.span + 1} moment${clip.span ? "s" : ""}. Select where it goes (another lane works too) and Paste.`);
        }
        if (name !== "copy") out = removeArea();
        const keep = msg;
        draw();
        say(keep);
        return out;
      } else if (name === "reverse" || name === "flip" || name === "stretch" || name === "squeeze") {
        /* The area tools: one batch each, so one ⌘Z takes it back. */
        if (!area) return say("Select an area first: drag across empty space on the lanes."), { ok: false };
        const open = openLanes();
        const r = name === "reverse" ? reverseAreaCommands(st, open.lanes, area) : name === "flip" ? flipAreaCommands(st, open.lanes, area) : stretchAreaCommands(st, open.lanes, area, name === "stretch" ? 2 : 0.5);
        const what = { reverse: ["Reverse the selection", "Reversed"], flip: ["Flip the selection", "Flipped"], stretch: ["Stretch the selection", "Stretched"], squeeze: ["Squeeze the selection", "Squeezed"] }[name];
        if (!r.nodes) {
          say(open.skipped ? "Every lane with nodes in the selection is locked, so nothing changed." + skipNote(open.skipped) : "No nodes in the selection.");
          out = { ok: false };
        } else {
          out = send({ type: "batch", label: what[0], commands: r.cmds });
          if (out.ok) {
            if (r.area) area = r.area;
            say(`${what[1]} ${r.nodes} node${r.nodes === 1 ? "" : "s"}${r.area ? `; the selection is now moments ${area.j0 + 1} to ${area.j1 + 1}` : ""}. Undo takes it back.${skipNote(open.skipped)}`);
          }
        }
      } else if (name === "freeze" || name === "shape") {
        /* Freeze and Shape: one batch each, and the selection stays where it is. */
        if (!area) return say("Select an area first: drag across empty space on the lanes."), { ok: false };
        const open = openLanes();
        const r = name === "freeze" ? freezeAreaCommands(st, open.lanes, area) : shapeAreaCommands(st, open.lanes, area, preset);
        const span = `moment ${area.j0 + 1} to ${area.j1 + 1}`;
        const flatNote = r.flat ? ` Left ${r.flat} lane${r.flat === 1 ? "" : "s"} alone that stay${r.flat === 1 ? "s" : ""} at one setting there, so there is nothing to shape.` : "";
        if (r.error) {
          say(r.error);
          out = { ok: false, error: r.error };
        } else if (!r.lanes) {
          say(open.skipped ? "Every lane with nodes in the selection is locked, so nothing changed." + skipNote(open.skipped) : r.flat ? "Each selected lane stays at one setting there, so there is nothing to shape. Shape works between a lane's lowest and highest setting in the selection." : "No lanes with nodes in the selection.");
          out = { ok: false };
        } else if (!r.cmds.length) {
          say((name === "freeze" ? `Already still from ${span}.` : `Already in that shape from ${span}.`) + skipNote(open.skipped) + flatNote);
        } else {
          const label = name === "freeze" ? "Freeze the selection" : "Shape the selection: " + PRESETS[preset][0];
          out = send({ type: "batch", label, commands: r.cmds });
          const lanesN = `${r.lanes} lane${r.lanes === 1 ? "" : "s"}`;
          if (out.ok) say((name === "freeze" ? `Froze ${lanesN} from ${span}: each holds its setting from moment ${area.j0 + 1}.` : `${PRESETS[preset][0]} on ${lanesN} from ${span}.`) + " Undo takes it back." + skipNote(open.skipped) + flatNote);
        }
      } else if (name === "paste" && clip && clip.kind === "area") {
        out = pasteHere();
        const keep = msg;
        draw();
        say(keep);
        return out;
      } else if (name === "cut") {
        if (!sel) return { ok: false, error: "Pick a node first." };
        out = copyGroup(sel, { solo: !tools.linkage, allow: kindOk });
        if (out.ok) removeNode(sel);
        say(out.ok ? "Cut: move the playhead and paste." : out.error);
        return out;
      } else if (name === "copyLook") {
        /* CapCut's Copy attributes (⌘⇧C): the picked node's setting. */
        if (!sel) return { ok: false, error: "Pick a node first." };
        const n = split(sel);
        look = { cur: n.cur, value: pointValue(st, n) };
        say(`Copied the setting: ${S().label(n.cur)} is ${look.value}.`);
      } else if (name === "pasteLook") {
        if (!look || !sel) return say(look ? "Pick a node to paste onto." : "Copy a node's setting first."), { ok: false };
        const n = split(sel);
        if (n.cur !== look.cur) return say(`That setting is for ${S().label(look.cur)}; pick one of its nodes.`), { ok: false };
        out = send({ type: "setPoint", row: n.row, track: n.track, curiosity: n.cur, value: look.value, label: "Paste a setting" });
      } else if (name === "linkage") {
        tools.linkage = !tools.linkage;
        say(tools.linkage ? "Linkage on: joined nodes move and copy together." : "Linkage off: a node moves alone and its lines stretch.");
      } else if (name === "skim") {
        tools.skim = !tools.skim;
        say(tools.skim ? "Preview axis on: hover over the timeline to see that moment." : "Preview axis off.");
      } else if (name === "marker") {
        const r = st.rows[playRow];
        if (!r) return { ok: false };
        const had = markerOf(r.id);
        tools.markers = had ? tools.markers.filter((m) => m.row !== r.id) : tools.markers.concat({ row: r.id, color: MARK_DEFAULT, note: "" });
        say(had ? `Marker taken off moment ${playRow + 1}.` : `Marker added at moment ${playRow + 1}. Double-click its flag on the ruler to write a note or pick a color.`);
      } else if (name === "zoomIn" || name === "zoomOut" || name === "zoomFit") {
        const z = Number(tools.zoom) || 1;
        tools.zoom = name === "zoomFit" ? 1 : Math.max(0.25, Math.min(32, name === "zoomIn" ? z * 1.5 : z / 1.5));
      } else if (name === "left" || name === "right") {
        out = step(name === "left" ? -1 : 1);
        if (!out.ok) say(out.error);
      } else if (name === "delete") {
        if (!sel) return { ok: false, error: "Pick a node first." };
        removeNode(sel);
        return out;
      } else if (name === "copy") {
        if (!sel) return { ok: false, error: "Pick a node first." };
        out = copyGroup(sel, { solo: !tools.linkage, allow: kindOk });
        say(out.ok ? `Copied ${out.nodes} node${out.nodes === 1 ? "" : "s"} and ${out.links} line${out.links === 1 ? "" : "s"}. Move the playhead and press Paste.` : out.error);
      } else if (name === "paste") {
        out = paste(playRow);
        say(out.ok ? `Pasted ${out.nodes} nodes and ${out.links} lines.${out.skipped ? ` Skipped ${out.skipped} node${out.skipped === 1 ? "" : "s"} on locked lanes (🔒).` : ""}` : out.error);
      } else return { ok: false, error: "Unknown command." };
      saveTools();
      const keep = msg;
      draw();
      say(keep);
      return out;
    }
    /* Every node inside the selected area, and the joins touching them, removed as one undo step. */
    function removeArea() {
      const st = E().state();
      const doomed = [];
      const open = openLanes();
      for (let i = area.i0; i <= area.i1; i++) {
        const ln = open.lanes[i];
        const lane = ln && ln.lk && st.lanes[ln.lk];
        if (!lane) continue;
        for (let j = area.j0; j <= area.j1; j++) if (lane.points[st.rows[j].id] != null) doomed.push(nodeKey(st.rows[j].id, ln.lk));
      }
      if (!doomed.length) return say(open.skipped ? "Every lane with nodes in the selection is locked, so nothing was removed." + skipNote(open.skipped) : "No nodes in the selection."), { ok: false };
      const cmds = [];
      st.links.forEach((l) => {
        const ends = linkEnds(l);
        if (ends && ends.some((k) => doomed.includes(k))) cmds.push({ type: "removeLink", link: l.id });
      });
      doomed.forEach((k) => {
        const n = split(k);
        cmds.push({ type: "removePoint", row: n.row, track: n.track, curiosity: n.cur });
      });
      const out = send({ type: "batch", label: "Remove the selected nodes", commands: cmds });
      if (out.ok) say(`Removed ${doomed.length} node${doomed.length === 1 ? "" : "s"}.${skipNote(open.skipped)}`);
      return out;
    }
    /* Paste the copied area: into the selected area (repeating across a wider one; one copied lane fills every
       selected lane), else at the playhead, starting on the picked node's lane or the lane it came from. */
    function pasteHere() {
      const st = E().state();
      const lanes = geo.lanes;
      let c = clip;
      let i0;
      let start;
      let width = 0;
      if (area) {
        i0 = area.i0;
        start = area.j0;
        width = area.j1 - area.j0 + 1;
        const rows = area.i1 - area.i0 + 1;
        if (c.lanes.length === 1 && rows > 1) c = Object.assign({}, c, { lanes: Array.from({ length: rows }, () => c.lanes[0]), links: [] });
      } else {
        start = opts.row ? opts.row() : 0;
        const first = c.lanes.find(Boolean);
        i0 = sel ? lanes.findIndex((ln) => ln.lk === split(sel).lk) : first ? lanes.findIndex((ln) => ln.cur === first.cur) : 0;
        if (i0 < 0) i0 = 0;
      }
      let skipped = 0;
      const targets = c.lanes.map((src, k) => {
        const ln = lanes[i0 + k];
        if (src && ln && isLocked(ln.lk)) return skipped++, null;
        return src && ln ? { cur: ln.cur, track: ln.track } : null;
      });
      if (!targets.some(Boolean)) return say(skipped ? "Every lane there is locked, so nothing was pasted." + skipNote(skipped) : "There is no lane there to paste onto."), { ok: false };
      const r = pasteAreaCommands(st, c, targets, start, width);
      if (r.error) return say(r.error), { ok: false };
      const out = send({ type: "batch", label: "Paste automation", commands: r.cmds });
      if (out.ok) {
        const across = targets.filter(Boolean).filter((t, k) => c.lanes[k] && t.cur !== c.lanes[k].cur).length;
        const span = Math.max(c.span + 1, width);
        area = { i0, i1: Math.min(lanes.length - 1, i0 + c.lanes.length - 1), j0: start, j1: Math.min(st.rows.length - 1, start + span - 1) };
        say(`Pasted onto ${targets.filter(Boolean).length} lane${targets.filter(Boolean).length === 1 ? "" : "s"}${across ? `, ${across} of them a different curiosity (values keep their place on its scale)` : ""}.${skipNote(skipped)}`);
      }
      return out;
    }
    /* The curves pop-up for one line: a shape, a bend, a preview with fine grid lines, and the whole lane's mode. */
    function openCurves(sk) {
      const st = E().state();
      sk = sk || seg;
      if (!sk) {
        /* The line under the playhead in the picked lane (or the first lane with two nodes). */
        const playRow = opts.row ? opts.row() : 0;
        const lks = (sel ? [split(sel).lk] : []).concat(geo.lanes.map((ln) => ln.lk).filter(Boolean));
        for (const lk of lks) {
          const list = laneNodes(st, lk).map(split).map((n) => ({ r: n.row, j: st.rows.findIndex((x) => x.id === n.row) }));
          const all = list.map((p) => Object.assign(p, { v: st.lanes[lk].points[p.r] }));
          const cp = curvePoints(st, lk, all);
          const nodes = all.filter((p) => !cp.has(p.r));
          if (nodes.length < 2) continue;
          let k = nodes.findIndex((p, q) => q > 0 && nodes[q - 1].j <= playRow && p.j > playRow);
          if (k < 1) k = 1;
          sk = segKey(lk, nodes[k - 1].r, nodes[k].r);
          break;
        }
      }
      if (!sk) return say("Make a lane with two nodes first; a curve shapes the line between them."), { ok: false };
      const parts = sk.split("|");
      const lk = parts[0] + "|" + parts[1];
      if (isLocked(lk)) return say(lockSay(lk)), { ok: false, locked: true };
      const cur = parts[1];
      const lane = st.lanes[lk];
      const ja = st.rows.findIndex((r) => r.id === parts[2]);
      const jb = st.rows.findIndex((r) => r.id === parts[3]);
      if (!lane || ja < 0 || jb < 0) return say("That line is gone."), { ok: false };
      const a = { r: parts[2], j: ja, v: lane.points[parts[2]] };
      const b = { r: parts[3], j: jb, v: lane.points[parts[3]] };
      const had = curves[sk] && curveOk(st, lk, a, b, curves[sk]) ? curves[sk] : null;
      const pick = { shape: had ? had.shape : lane.mode === "hold" ? "jumpLate" : lane.mode === "smooth" ? "smooth" : "straight", bend: had ? had.bend : 40 };
      const room = jb - ja >= 2;
      const old = el.querySelector(".sl-pop");
      if (old) old.remove();
      const pop = document.createElement("div");
      pop.className = "sl-pop sl-curves";
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", "Curves");
      const W = 260;
      const H = 140;
      function preview() {
        const pa = S().pos(cur, a.v);
        const pb = S().pos(cur, b.v);
        const g = [];
        for (let k = 0; k <= 20; k++) g.push(`<line class="${k % 5 ? "cv-fine" : "cv-major"}" x1="${(k * W) / 20}" x2="${(k * W) / 20}" y1="0" y2="${H}"/>`);
        for (let k = 0; k <= 10; k++) g.push(`<line class="${k % 5 ? "cv-fine" : "cv-major"}" x1="0" x2="${W}" y1="${(k * H) / 10}" y2="${(k * H) / 10}"/>`);
        for (let j = ja + 1; j < jb; j++) g.push(`<line class="cv-moment" x1="${((j - ja) / (jb - ja)) * W}" x2="${((j - ja) / (jb - ja)) * W}" y1="0" y2="${H}"/>`);
        const y = (p) => 8 + (1 - Math.max(0, Math.min(1, p))) * (H - 16);
        const line = [];
        for (let k = 0; k <= 64; k++) line.push(`${((k / 64) * W).toFixed(1)},${y(pa + (pb - pa) * shapeAt(pick.shape, pick.bend, k / 64)).toFixed(1)}`);
        const dotsP = bake(cur, a, b, pick, st.rows).map((p) => `<circle class="cv-dot" cx="${((p.j - ja) / (jb - ja)) * W}" cy="${y(S().pos(cur, p.value))}" r="3.5"><title>Moment ${p.j + 1}: ${esc(p.value)}</title></circle>`);
        return `<svg class="cv-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${g.join("")}<polyline class="cv-line" points="${line.join(" ")}"/>${dotsP.join("")}<circle class="cv-end" cx="0" cy="${y(pa)}" r="5"/><circle class="cv-end" cx="${W}" cy="${y(pb)}" r="5"/></svg>`;
      }
      function paint() {
        const sh = SHAPES[pick.shape];
        pop.innerHTML = `<p><strong>Curve</strong> · ${esc(S().label(cur))}, moment ${ja + 1} (${esc(a.v)}) to moment ${jb + 1} (${esc(b.v)})</p>
          ${preview()}
          <div class="sl-shapes" role="group" aria-label="Shape">${Object.keys(SHAPES).map((k) => `<button type="button" data-shape="${k}" class="${k === pick.shape ? "on" : ""}" title="${esc(SHAPES[k][1])}">${esc(SHAPES[k][0])}</button>`).join("")}</div>
          <label class="sl-bend">Bend <input type="range" min="0" max="100" step="1" value="${pick.bend}" data-bend${sh[2] ? "" : " disabled"}><output>${pick.bend}</output></label>
          <p class="sl-note">${esc(sh[1])} ${room ? `The dots are what plays at moments ${ja + 2} to ${jb}.` : "These two nodes are on neighbouring moments, so nothing plays between them; move one further away to give the curve room."}</p>
          <p class="sl-note">Whole lane: <span class="sl-seg">${["ramp", "smooth", "hold"].map((m) => `<button type="button" data-lmode="${m}" class="${modeOf(lane) === m ? "on" : ""}">${MODES[m][1]}</button>`).join("")}</span></p>
          <div class="sl-pop-btns"><button type="button" data-l="cancel">Cancel</button><button type="button" data-l="apply" class="on"${room ? "" : " disabled"}>Apply</button></div>`;
      }
      paint();
      pop.addEventListener("input", (ev) => {
        if (!ev.target.matches("[data-bend]")) return;
        pick.bend = Number(ev.target.value);
        pop.querySelector(".cv-svg").outerHTML = preview();
        pop.querySelector(".sl-bend output").textContent = pick.bend;
      });
      pop.onclick = (ev) => {
        ev.stopPropagation();
        const t = ev.target.closest("button");
        if (!t) return;
        if (t.dataset.shape) {
          pick.shape = t.dataset.shape;
          return paint();
        }
        if (t.dataset.lmode) {
          const r = E().send({ type: "laneMode", track: parts[0], curiosity: cur, mode: t.dataset.lmode, label: MODES[t.dataset.lmode][3] });
          if (!r.ok) say(t.dataset.lmode === "smooth" ? "This engine can't make a whole lane smooth yet; shape this line with Smooth instead." : r.error);
          pop.remove();
          return draw();
        }
        if (t.dataset.l === "apply") {
          const now = E().state();
          const ln = now.lanes[lk];
          const cmds = [];
          /* Clear the moments between (old curve points), then write the curve. A straight line needs no points. */
          for (let j = ja + 1; j < jb; j++) if (ln && ln.points[now.rows[j].id] != null) cmds.push({ type: "removePoint", row: now.rows[j].id, track: parts[0], curiosity: cur });
          if (pick.shape !== "straight") bake(cur, a, b, pick, now.rows).forEach((p) => cmds.push({ type: "setPoint", row: p.row, track: parts[0], curiosity: cur, value: p.value }));
          if (pick.shape === "straight") delete curves[sk];
          else curves[sk] = { shape: pick.shape, bend: pick.bend };
          saveCurves();
          const r = cmds.length ? send({ type: "batch", label: "Shape a curve: " + SHAPES[pick.shape][0], commands: cmds }) : { ok: true };
          if (r.ok) say(`${SHAPES[pick.shape][0]} curve from moment ${ja + 1} to ${jb + 1}.`);
          seg = sk;
        }
        pop.remove();
        draw();
      };
      el.appendChild(pop);
      return { ok: true, pop };
    }
    /* CapCut's Linkage settings box: a tick per kind of node, Select all, Cancel and Done. */
    function linkSettings() {
      const old = el.querySelector(".sl-pop");
      if (old) old.remove();
      const cats = L() ? L().CATEGORIES : [];
      const pop = document.createElement("div");
      pop.className = "sl-pop sl-linkset";
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", "Linkage settings");
      pop.innerHTML = `<p><strong>Linkage settings</strong></p><p class="sl-note">When linkage is on, the kinds you tick move, copy and paste with the node you grab. The node you grab always moves.</p>
        <div class="sl-kinds">${cats.map((c) => `<label><input type="checkbox" data-kind="${esc(c.id)}"${tools.linkKinds[c.id] !== false ? " checked" : ""}> ${esc(c.label)}</label>`).join("")}</div>
        <label class="sl-all"><input type="checkbox" data-kind-all${cats.every((c) => tools.linkKinds[c.id] !== false) ? " checked" : ""}> Select all</label>
        <label><input type="checkbox" data-link-delete${tools.linkDelete ? " checked" : ""}> Delete them with it too</label>
        <div class="sl-pop-btns"><button type="button" data-l="cancel">Cancel</button><button type="button" data-l="done" class="on">Done</button></div>`;
      pop.addEventListener("change", (ev) => {
        if (ev.target.matches("[data-kind-all]")) pop.querySelectorAll("[data-kind]").forEach((b) => (b.checked = ev.target.checked));
        else if (ev.target.matches("[data-kind]")) pop.querySelector("[data-kind-all]").checked = [...pop.querySelectorAll("[data-kind]")].every((b) => b.checked);
      });
      pop.onclick = (ev) => {
        ev.stopPropagation();
        const b = ev.target.closest("[data-l]");
        if (!b) return;
        if (b.dataset.l === "done") {
          const kinds = {};
          pop.querySelectorAll("[data-kind]").forEach((x) => !x.checked && (kinds[x.dataset.kind] = false));
          tools.linkKinds = kinds;
          tools.linkDelete = pop.querySelector("[data-link-delete]").checked;
          saveTools();
          const off = Object.keys(kinds).length;
          say(off ? `Linkage leaves ${off} kind${off === 1 ? "" : "s"} of node behind.` : "Linkage takes every kind of joined node along.");
        }
        pop.remove();
      };
      el.appendChild(pop);
      return pop;
    }
    /* ---------- markers: the note-and-color pop-up and the Markers list (CapCut's markers) ---------- */
    const clockOf = (j) => {
      if (!opts.secondsPerMoment) return "";
      const t = Math.round(j * (Number(opts.secondsPerMoment()) || 3));
      return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
    };
    /* A pop-up placed near a point on the page, kept inside the timeline. */
    function popAt(cls, label, cx, cy) {
      const old = el.querySelector(".sl-pop");
      if (old) old.remove();
      const pop = document.createElement("div");
      pop.className = "sl-pop " + cls;
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", label);
      const r = el.getBoundingClientRect();
      pop.style.left = Math.max(0, Math.min((el.clientWidth || 800) - 280, cx - r.left - 40)) + "px";
      pop.style.top = Math.max(0, cy - r.top + 10) + "px";
      return pop;
    }
    function openMarker(j, cx, cy) {
      const st = E().state();
      const r = st.rows[j];
      const m = r && markerOf(r.id);
      if (!m) return say("There is no marker on that moment."), { ok: false };
      const pop = popAt("sl-mkpop", "Marker", cx, cy);
      const tc = clockOf(j);
      pop.innerHTML = `<p><strong>Marker</strong> · moment ${j + 1}${tc ? ` (${tc} into the film)` : ""}</p>
        <label class="sl-mknote">Note <input type="text" data-mk-note maxlength="${NOTE_MAX}" placeholder="What happens here, e.g. the joke lands" value="${esc(m.note)}"></label>
        <div class="sl-mkcolors" role="group" aria-label="Color">${MARK_COLORS.map((c) => `<button type="button" data-mk-color="${c[0]}" class="${m.color === c[0] ? "on" : ""}" aria-pressed="${m.color === c[0]}" title="${c[1]}" aria-label="${c[1]}" style="--mk:${c[2]}"></button>`).join("")}</div>
        <div class="sl-pop-btns"><button type="button" data-l="delete" title="Take this marker off the film">Delete marker</button><button type="button" data-l="done" class="on">Done</button></div>`;
      const close = (keepMsg) => {
        pop.remove();
        saveTools();
        const k = keepMsg || msg;
        draw();
        say(k);
        el.focus();
      };
      pop.addEventListener("input", (ev) => {
        if (!ev.target.matches("[data-mk-note]")) return;
        m.note = ev.target.value.slice(0, NOTE_MAX);
        /* An auto marker you write on becomes your own: Clear auto markers leaves it. */
        delete m.auto;
        saveTools();
      });
      pop.addEventListener("keydown", (ev) => {
        ev.stopPropagation();
        if (ev.key === "Escape" || (ev.key === "Enter" && ev.target.matches("[data-mk-note]"))) {
          ev.preventDefault();
          m.note = m.note.trim();
          close(m.note ? `Marker at moment ${j + 1}: ${m.note}.` : "");
        }
      });
      pop.onclick = (ev) => {
        ev.stopPropagation();
        const b = ev.target.closest("button");
        if (!b) return;
        if (b.dataset.mkColor) {
          m.color = markColor(b.dataset.mkColor)[0];
          delete m.auto;
          saveTools();
          pop.querySelectorAll("[data-mk-color]").forEach((x) => {
            x.classList.toggle("on", x === b);
            x.setAttribute("aria-pressed", String(x === b));
          });
          return;
        }
        if (b.dataset.l === "delete") {
          tools.markers = tools.markers.filter((x) => x !== m);
          return close(`Marker taken off moment ${j + 1}.`);
        }
        m.note = m.note.trim();
        close(m.note ? `Marker at moment ${j + 1}: ${m.note}.` : "");
      };
      el.appendChild(pop);
      const inp = pop.querySelector("[data-mk-note]");
      inp.focus();
      inp.select();
      return { ok: true, pop };
    }
    /* Move the playhead to a moment and scroll the timeline so it is in the middle of the view. */
    function goTo(j) {
      const move = opts.onRow || opts.onClip;
      if (move) move(j);
      else draw();
      const sc = scroller();
      if (sc && geo) sc.scrollLeft = Math.max(0, j * geo.colW + geo.colW / 2 - (sc.clientWidth - headW()) / 2);
    }
    /* Auto markers (Mark the turns): the film's values per moment come from opts.beats() (the Screen's own
       reading, the same one its Player and attention use), else straight from the engine's tracks. */
    function beatsNow(st) {
      if (opts.beats) return opts.beats() || [];
      return st.rows.map((r) => {
        const values = {};
        st.tracks.forEach((t) => t.curiosities.forEach((c) => values[c] == null && (values[c] = E().value(r.id, t.id, c))));
        return { values, row: r.id };
      });
    }
    function markTurns() {
      const st = E().state();
      const lanes = [...new Set(lanesNow(st).map((ln) => ln.cur))];
      const turns = turnMarkers(beatsNow(st), st.rows, { attention: root.CurioAttention, lanes });
      const before = tools.markers.filter((m) => !m.auto).length;
      tools.markers = mergeTurnMarkers(tools.markers, turns);
      const added = tools.markers.filter((m) => m.auto).length;
      saveTools();
      draw();
      const kept = turns.length - added;
      return {
        ok: true,
        added,
        message: turns.length
          ? `Marked ${added} turn${added === 1 ? "" : "s"} in your film${kept ? ` (${kept} moment${kept === 1 ? "" : "s"} already had a marker of yours, kept as it is)` : ""}.`
          : `No turns found: the attention and the feeling stay the same all through the film${before ? "; your markers are untouched" : ""}.`,
      };
    }
    function clearAuto() {
      const n = tools.markers.filter((m) => m.auto).length;
      tools.markers = clearAutoMarkers(tools.markers);
      saveTools();
      draw();
      return { ok: true, removed: n, message: n ? `Took off ${n} auto marker${n === 1 ? "" : "s"}; your own markers stay.` : "There are no auto markers to take off." };
    }
    /* Shape ▾: the presets as a small menu under the button. Each one is one undo step; the menu closes. */
    function shapeMenu(btn) {
      if (!area) return say("Select an area first: drag across empty space on the lanes."), { ok: false };
      const b = (btn || el.querySelector('[data-act="area-shape"]') || el).getBoundingClientRect();
      const pop = popAt("sl-shapemenu", "Shape", b.left + 40, b.bottom - 4);
      pop.innerHTML = `<p><strong>Shape</strong> · each selected lane, between its own lowest and highest setting from moment ${area.j0 + 1} to ${area.j1 + 1}</p>
        <div class="sl-presets" role="group" aria-label="Shapes">${Object.keys(PRESETS).map((k) => `<button type="button" data-preset="${k}" title="${esc(PRESETS[k][1])}">${esc(PRESETS[k][0])}</button>`).join("")}</div>
        <div class="sl-pop-btns"><button type="button" data-l="close">Close</button></div>`;
      pop.addEventListener("keydown", (ev) => {
        if (ev.key !== "Escape") return;
        ev.stopPropagation();
        pop.remove();
        el.focus();
      });
      pop.onclick = (ev) => {
        ev.stopPropagation();
        const t = ev.target.closest("button");
        if (!t) return;
        pop.remove();
        if (t.dataset.preset) command("shape", t.dataset.preset);
        else el.focus();
      };
      el.appendChild(pop);
      const first = pop.querySelector("button");
      if (first) first.focus();
      return pop;
    }
    function markerList(btn) {
      const st = E().state();
      const b = (btn || el.querySelector('[data-act="marker-list"]') || el).getBoundingClientRect();
      const pop = popAt("sl-marklist", "Markers", b.left + 40, b.bottom - 4);
      const list = st.rows.map((r, j) => [j, markerOf(r.id)]).filter((x) => x[1]);
      pop.innerHTML = `<p><strong>Markers</strong> · ${list.length ? `${list.length} in your film. Click one to move the playhead there.` : "none yet"}</p>
        <div class="sl-mkturns"><button type="button" data-l="mark-turns" title="Put a marker on every moment where the film turns: purple where the audience's attention moves to something else, red where the feeling changes, yellow where a track jumps by more than half its range. Your own markers stay as they are.">Mark the turns</button>${list.some(([, m]) => m.auto) ? `<button type="button" data-l="clear-auto" title="Take off only the markers Mark the turns put on; your own markers stay">Clear auto markers</button>` : ""}</div>
        ${list.length ? `<ul>${list.map(([j, m]) => { const c = markColor(m.color); const tc = clockOf(j); return `<li><button type="button" class="sl-mkgo" data-mk-go="${j}" title="Move the playhead to moment ${j + 1}"><i class="sl-mkdot" style="--mk:${c[2]}" aria-label="${c[1]}"></i><span class="sl-mkat">Moment ${j + 1}${tc ? ` <small>${tc}</small>` : ""}</span><span class="sl-mktext${m.note ? "" : " empty"}">${esc(m.note || "no note")}</span>${m.auto ? `<span class="sl-mkauto" title="Put here by Mark the turns">auto</span>` : ""}</button><button type="button" class="sl-mkedit" data-mk-edit="${j}" title="Write a note, change the color or delete this marker" aria-label="Edit the marker at moment ${j + 1}">✎</button></li>`; }).join("")}</ul>` : `<p class="sl-note">Press Marker (or M) to put a flag on the playhead's moment. Double-click a flag on the ruler to write what happens there and pick a color.</p>`}
        <div class="sl-pop-btns"><button type="button" data-l="close">Close</button></div>`;
      pop.addEventListener("keydown", (ev) => {
        if (ev.key !== "Escape") return;
        ev.stopPropagation();
        pop.remove();
        el.focus();
      });
      pop.onclick = (ev) => {
        ev.stopPropagation();
        const t = ev.target.closest("button");
        if (!t) return;
        if (t.dataset.l === "mark-turns" || t.dataset.l === "clear-auto") {
          const r = t.dataset.l === "mark-turns" ? markTurns() : clearAuto();
          pop.remove();
          markerList();
          say(r.message);
          return;
        }
        if (t.dataset.mkEdit != null) {
          const r = t.getBoundingClientRect();
          return openMarker(Number(t.dataset.mkEdit), r.left, r.bottom);
        }
        pop.remove();
        if (t.dataset.mkGo != null) {
          const j = Number(t.dataset.mkGo);
          const m = markerOf(st.rows[j].id);
          goTo(j);
          say(`Playhead on the marker at moment ${j + 1}${m && m.note ? ": " + m.note : ""}.`);
        }
      };
      el.appendChild(pop);
      const first = pop.querySelector("button");
      if (first) first.focus();
      return pop;
    }
    function onMenu(e) {
      const mk = e.target.closest && e.target.closest(".sl-top [data-marker]");
      if (!mk) return;
      e.preventDefault();
      openMarker(Number(mk.dataset.marker) || 0, e.clientX, e.clientY);
    }
    function onDbl(e) {
      const node = e.target.closest && e.target.closest("[data-node]");
      if (node) return removeNode(node.dataset.node);
      const s2 = e.target.closest && e.target.closest("[data-seg]");
      if (s2) openCurves(s2.dataset.seg);
    }
    function onWheel(e) {
      if (!e.target.closest || !e.target.closest(".sl-scroll")) return;
      const r = scroller().getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(zoomOf() * Math.exp(-e.deltaY * 0.01), e.clientX - r.left);
        saveTools();
      } else if (e.altKey) {
        e.preventDefault();
        laneAt(lh * Math.exp(-e.deltaY * 0.01), e.clientY - r.top);
        saveTools();
      }
    }
    function onKey(e) {
      const pop = el.querySelector(".sl-pop");
      if (e.key === "Escape" && pop) {
        /* Esc closes any pop-up (curves, linkage settings, a line's menu). */
        pop.remove();
        return el.focus();
      }
      if (e.key === "Escape" && (area || seg)) {
        area = null;
        seg = null;
        return draw();
      }
      if (area && (e.key === "Delete" || e.key === "Backspace") && document.activeElement === el) return command("delete");
      if (!sel || !el.contains(document.activeElement || el)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement === el) removeNode(sel);
    }
    el.classList.add("sl");
    el.tabIndex = el.tabIndex >= 0 ? el.tabIndex : 0;
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick);
    el.addEventListener("dblclick", onDbl);
    el.addEventListener("contextmenu", onMenu);
    el.addEventListener("keydown", onKey);
    el.addEventListener("wheel", onWheel, { passive: false });
    draw();
    return {
      draw,
      select: (key) => ((sel = key), draw()),
      selected: () => sel,
      area: () => area,
      selectArea: (a) => ((area = a), (sel = null), draw()),
      curves: (sk) => openCurves(sk),
      linkSettings,
      marker: (j) => openMarker(j, el.getBoundingClientRect().left + 40, el.getBoundingClientRect().top + 30),
      markers: () => markerList(),
      shapeMenu: () => shapeMenu(),
      shape: (preset) => command("shape", preset),
      markTurns,
      clearAuto,
      command,
      laneOff: (lk) => laneButton("lane-off", lk),
      solo: (lk) => laneButton("lane-solo", lk),
      lock: (lk) => laneButton("lane-lock", lk),
      destroy() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      },
    };
  }

  root.CurioLanes = { SHAPES, MARK_COLORS, migrateMarkers, soloCommands, soloActive, isLocked, shapeAt, copyArea, pasteAreaCommands, reverseAreaCommands, flipAreaCommands, stretchAreaCommands, freezeAreaCommands, shapeAreaCommands, PRESETS, moveAreaCommands, curves: () => curves, tools: () => tools, mount, trackFor, ensure, group, copyGroup, paste, shiftCommands, linkCommand, nodeKey, clip: () => clip, LANE_H, TURN_COLORS, turnMarkers, mergeTurnMarkers, clearAutoMarkers };
})();
