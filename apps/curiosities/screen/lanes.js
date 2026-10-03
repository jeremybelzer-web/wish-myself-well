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
   them; double-click a node to remove it. Click a line to switch it off or remove it.

   window.CurioLanes
   - mount(el, opts) -> { draw(), destroy() }
       opts.lanes()      -> [{ track (or null), cur, label?, group? }]  which lanes to show, top to bottom
       opts.row()        -> the playhead's moment index (paste goes there)
       opts.onSelect(cur) told when a lane or node is picked
       opts.header(lane) -> extra HTML for a lane's header (the Arrange view's dropdown)
       opts.ruler        draw moment numbers above the lanes
       opts.range()      -> [from, to] or null: the play range, drawn with the moments outside it dimmed
   - trackFor(cur)       the track a curiosity goes on when it is not on one yet
   - group(nodeKey)      the nodes and links joined to a node
   - copyGroup(nodeKey), paste(atRow) -> { ok, error? }   the proximity clipboard (kept across films)
   - ensure(cur)         make sure a lane's curiosity is on a track (one undo step), returns the track id
   - tools()             the timeline toolbar settings, kept in localStorage "curiosities-screen-tools-v1"

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
   - Markers: flags on moments of the film, kept by row id.
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
  if (!Array.isArray(tools.markers)) tools.markers = [];
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
      const r = pasteAreaCommands(st, clip, clip.lanes.map((l) => l && { cur: l.cur, track: l.track }), Math.max(0, Math.min(Number(atRow) || 0, st.rows.length - 1 - clip.span)));
      if (r.error) return { ok: false, error: r.error };
      if (!r.cmds.length) return { ok: false, error: "Nothing in the clipboard fits this film's tracks." };
      const out = E().send({ type: "batch", label: "Paste automation", commands: r.cmds });
      return out.ok ? { ok: true, nodes: r.cmds.filter((x) => x.type === "setPoint").length, links: clip.links.length } : out;
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
    if (!cmds.length) return { ok: false, error: "Nothing in the clipboard fits this film's tracks." };
    const out = E().send({ type: "batch", label: clip.links.length > 1 ? "Paste a proximity suite" : clip.links.length ? "Paste a proximity" : "Paste nodes", commands: adds.concat(cmds) });
    return out.ok ? { ok: true, nodes: clip.nodes.length, links: clip.links.length } : out;
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

  /* ---------- the view ---------- */
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
      const heads = lanes
        .map((ln, i) => {
          const picked = (sel && sel.endsWith("@" + ln.lk)) || (area && i >= area.i0 && i <= area.i1);
          const ticks = scaleTicks(ln.cur);
          return `<div class="sl-head${ln.group ? " sl-in-group" : ""}${picked ? " on" : ""}${ticks ? " has-ticks" : ""}" style="height:${lh}px" data-i="${i}">
            <div class="sl-head-top">${opts.header ? opts.header(ln, i) : `<button type="button" class="sl-name" data-pick="${esc(ln.cur)}">${esc(ln.label || S().label(ln.cur))}</button>`}<button type="button" class="sl-win" data-open-win="${esc(ln.cur)}" title="Open ${esc(S().label(ln.cur))}'s own window: every knob and slider it has" aria-label="Open ${esc(S().label(ln.cur))}'s window">⧉</button></div>
            <span class="sl-sub">${ln.lk && st.lanes[ln.lk] ? `<button type="button" class="sl-mode" data-act="mode" data-lk="${esc(ln.lk)}" title="${esc(MODES[modeOf(st.lanes[ln.lk])][2])} Click to change.">${MODES[modeOf(st.lanes[ln.lk])][1]}</button> ` : ""}${ln.group ? esc(ln.group) + " · " : ""}${ln.track ? esc((st.tracks.find((t) => t.id === ln.track) || {}).label || "") : "not on a track yet"}${ln.lk && st.lanes[ln.lk] ? " · " + Object.keys(st.lanes[ln.lk].points).length + " nodes" : ""}</span>
            ${ticks}
          </div>`;
        })
        .join("");
      const tsvg = []; /* the top bar: clip tracks and the ruler */
      const svg = [];
      const dots = []; /* nodes go on top of the lines */
      /* Film clip tracks first: one per inspiration film, then my film's moments. */
      clipRows.forEach((cr, k) => {
        const y = k * CLIP_H;
        (cr.clips || []).forEach((c) => {
          const x = c.from * svgW;
          const w = Math.max(3, (c.to - c.from) * svgW - 2);
          tsvg.push(`<g class="sl-clip ${esc(c.cls || "")}" data-clip="${Math.floor(c.from * n + 1e-6)}"><rect x="${x + 1}" y="${y + 2}" width="${w}" height="${CLIP_H - 4}" rx="4"/><text x="${x + 6}" y="${y + 18}">${esc(String(c.text || "").slice(0, Math.max(0, Math.floor(w / 6))))}</text><title>${esc(c.title || c.text || "")}</title></g>`);
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
      st.rows.forEach((r, j) => {
        if (!tools.markers.includes(r.id)) return;
        const x = j * colW + colW / 2;
        tsvg.push(`<g class="sl-marker" data-marker="${j}"><line x1="${x}" x2="${x}" y1="0" y2="${top}"/><path d="M${x - 5} ${Math.max(0, top - 11)}h10v7l-5 4-5-4z"/><title>Marker at moment ${j + 1}</title></g>`);
        svg.push(`<g class="sl-marker" data-marker="${j}"><line x1="${x}" x2="${x}" y1="0" y2="${svgH}"/><title>Marker at moment ${j + 1}</title></g>`);
      });
      if (area) svg.push(`<rect class="sl-area" x="${area.j0 * colW}" y="${area.i0 * lh}" width="${(area.j1 - area.j0 + 1) * colW}" height="${(area.i1 - area.i0 + 1) * lh}"><title>Selected: moments ${area.j0 + 1} to ${area.j1 + 1}, ${area.i1 - area.i0 + 1} lane${area.i1 > area.i0 ? "s" : ""}. Copy, then pick where it goes and Paste.</title></rect>`);
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
          dots.push(`<circle class="sl-node${small ? " sl-cpt" : ""}${sel === key ? " on" : ""}${inArea(i, p.j) ? " in" : ""}" cx="${c[0]}" cy="${c[1]}" r="${small ? 3.5 : 6}" data-node="${esc(key)}" data-lane="${i}"><title>${esc(S().label(ln.cur))}: ${esc(p.v)} at moment ${p.j + 1}${small ? " (on a curve)" : ""}</title></circle>`);
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
          ${tb("curves", "Curves", "Shape the curve of the picked line, or the line under the playhead in the picked lane (double-click a line too)")}
          ${tb("marker", "Marker", "Add marker (M) at the playhead's moment; press again to take it off")}
          ${tb("magnet", "Magnet", "Main track magnet (P): moving a node moves every later node in its lane too", tools.magnet)}
          ${tb("snap", "Snapping", "Auto snapping (N): a node dropped next to a marker lands on it", tools.snap)}
          <span class="sl-seg" role="group" aria-label="Linkage">${tb("linkage", "Linkage", "Linkage (~): joined nodes move and copy together", tools.linkage)}${tb("link-settings", "⚙", "Linkage settings: which kinds of joined node move, copy or get deleted with the one you grab")}</span>
          ${tb("skim", "Preview axis", "Preview axis (S): hover over the timeline to see that moment in the player", tools.skim)}
          <span class="sl-seg" role="group" aria-label="Zoom">${tb("zoom-out", "−", "Zoom out (⌘−), or drag up on the ruler")}${tb("zoom-fit", "Fit", "Zoom to fit the timeline (⇧Z)")}${tb("zoom-in", "+", "Zoom in (⌘+), or drag down on the ruler")}</span>
          <span class="sl-msg" role="status">${esc(msg || (others ? others + " more proximities between these lanes are rules for the whole lane (no nodes); the Engine's Links tab lists them." : "Drag down on the ruler to zoom in; drag right on the lane names for taller lanes. Drag across empty space to select."))}</span>
        </div>
        <div class="sl-scroll"><div class="sl-body" style="grid-template-columns: var(--sl-head-w, 190px) ${svgW}px">
          <div class="sl-corner" style="height:${top}px">${clipRows.map((cr) => `<div class="sl-head sl-cliphead" style="height:${CLIP_H}px" title="${esc(cr.title || "")}">${esc(cr.label)}</div>`).join("")}${opts.ruler ? `<div class="sl-rulerhead" style="height:${RULER + 8}px" title="Drag the ruler: down zooms in, up zooms out, sideways scrolls">⇕ zoom · ⇔ scroll</div>` : ""}</div>
          <div class="sl-top" style="height:${top}px"><svg class="sl-topsvg" width="${svgW}" height="${top}" viewBox="0 0 ${svgW} ${Math.max(1, top)}">${tsvg.join("")}</svg></div>
          <div class="sl-heads" title="Drag right for taller lanes, left for shorter; drag up and down to scroll. Click a lane's name area to select the whole lane (Shift adds more lanes).">${heads}</div>
          <div class="sl-lanes"><svg class="sl-svg" width="${svgW}" height="${Math.max(1, svgH)}" viewBox="0 0 ${svgW} ${Math.max(1, svgH)}">${svg.join("")}${dots.join("")}${drag && drag.ghost ? drag.ghost : ""}</svg></div>
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
        if (clipEl) j = Number(clipEl.dataset.clip) || 0;
        else if (geo && e.target.closest(".sl-top")) j = Math.max(0, Math.min(geo.n - 1, Math.floor((sc.scrollLeft + e.clientX - r.left - headW()) / geo.colW)));
        topDrag = { x0: e.clientX, y0: e.clientY, z0: zoomOf(), frac: geo ? (sc.scrollLeft + e.clientX - r.left - headW()) / Math.max(1, geo.svgW) : 0, clip: !!clipEl, j, moved: false };
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
      if (node) {
        sel = node.dataset.node;
        seg = null;
        drag = { key: sel, start: a, copy: e.altKey || e.shiftKey, moved: false };
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
        return;
      }
      if (!a.ln) return;
      drag = { add: true, start: a };
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
      if (!drag && tools.skim && opts.onHover && geo && e.target.closest && e.target.closest(".sl-svg") && el.contains(e.target)) {
        const a = at(e);
        if (a.j !== hoverJ) opts.onHover((hoverJ = a.j));
        return;
      }
      if (!drag) return;
      const a = at(e);
      if (Math.abs(a.x - drag.start.x) + Math.abs(a.y - drag.start.y) > 4) drag.moved = true;
      if (!drag.moved) return;
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
          saveTools();
          say(`Zoom ${Math.round(zoomOf() * 100)}%. Finer lines show as you zoom in.`);
        } else if (d.j != null && opts.onClip) opts.onClip(d.j);
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
        say(`${area.i1 - area.i0 + 1} lane${area.i1 > area.i0 ? "s" : ""} selected. Copy, then pick another lane or area and Paste.`);
        return draw();
      }
      if (!drag) return;
      const d = drag;
      drag = null;
      const a = at(e);
      const st = E().state();
      if (d.add && d.moved) {
        const j0 = Math.max(0, Math.min(geo.n - 1, Math.floor(Math.min(a.x, d.start.x) / geo.colW)));
        const j1 = Math.max(0, Math.min(geo.n - 1, Math.floor(Math.max(a.x, d.start.x) / geo.colW)));
        const i0 = Math.max(0, Math.min(geo.lanes.length - 1, Math.floor(Math.min(a.y, d.start.y) / geo.lh)));
        const i1 = Math.max(0, Math.min(geo.lanes.length - 1, Math.floor(Math.max(a.y, d.start.y) / geo.lh)));
        area = { i0, i1, j0, j1 };
        sel = null;
        seg = null;
        say(`Selected moments ${j0 + 1} to ${j1 + 1} on ${i1 - i0 + 1} lane${i1 > i0 ? "s" : ""}. Copy, then select where it goes and Paste.`);
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
        const r = send(Object.assign(linkCommand(st, from, split(target.dataset.node)), {}));
        if (r.ok) say("Joined: they now move and copy together. Copy proximity takes the pair to another scene.");
        return draw();
      }
      const ix = st.rows.findIndex((r) => r.id === from.row);
      let tj = a.j;
      if (tools.snap && tj !== ix) {
        /* Auto snapping: a marker one moment away pulls the node onto it (moments are whole steps already). */
        const pulls = st.rows.map((r, j) => (tools.markers.includes(r.id) ? j : -9));
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
    const TOOL_ACTS = { "tool-select": "select", "tool-split": "split", marker: "marker", magnet: "magnet", snap: "snap", linkage: "linkage", skim: "skim", "zoom-in": "zoomIn", "zoom-out": "zoomOut", "zoom-fit": "zoomFit" };
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
    function command(name) {
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
        const had = tools.markers.includes(r.id);
        tools.markers = had ? tools.markers.filter((m) => m !== r.id) : tools.markers.concat(r.id);
        say(had ? `Marker taken off moment ${playRow + 1}.` : `Marker added at moment ${playRow + 1}.`);
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
        say(out.ok ? `Pasted ${out.nodes} nodes and ${out.links} lines.` : out.error);
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
      for (let i = area.i0; i <= area.i1; i++) {
        const ln = geo.lanes[i];
        const lane = ln && ln.lk && st.lanes[ln.lk];
        if (!lane) continue;
        for (let j = area.j0; j <= area.j1; j++) if (lane.points[st.rows[j].id] != null) doomed.push(nodeKey(st.rows[j].id, ln.lk));
      }
      if (!doomed.length) return say("No nodes in the selection."), { ok: false };
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
      if (out.ok) say(`Removed ${doomed.length} node${doomed.length === 1 ? "" : "s"}.`);
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
      const targets = c.lanes.map((src, k) => {
        const ln = lanes[i0 + k];
        return src && ln ? { cur: ln.cur, track: ln.track } : null;
      });
      if (!targets.some(Boolean)) return say("There is no lane there to paste onto."), { ok: false };
      const r = pasteAreaCommands(st, c, targets, start, width);
      if (r.error) return say(r.error), { ok: false };
      const out = send({ type: "batch", label: "Paste automation", commands: r.cmds });
      if (out.ok) {
        const across = targets.filter(Boolean).filter((t, k) => c.lanes[k] && t.cur !== c.lanes[k].cur).length;
        const span = Math.max(c.span + 1, width);
        area = { i0, i1: Math.min(lanes.length - 1, i0 + c.lanes.length - 1), j0: start, j1: Math.min(st.rows.length - 1, start + span - 1) };
        say(`Pasted onto ${targets.filter(Boolean).length} lane${targets.filter(Boolean).length === 1 ? "" : "s"}${across ? `, ${across} of them a different curiosity (values keep their place on its scale)` : ""}.`);
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
      command,
      destroy() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      },
    };
  }

  root.CurioLanes = { SHAPES, shapeAt, copyArea, pasteAreaCommands, curves: () => curves, tools: () => tools, mount, trackFor, ensure, group, copyGroup, paste, shiftCommands, linkCommand, nodeKey, clip: () => clip, LANE_H };
})();
