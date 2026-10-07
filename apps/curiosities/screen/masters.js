/* screen/masters.js: master nodes, the track master lanes and the Master Nodes window (window.CurioMasters).

   Built from the notes the music app's Claude wrote for this app (Jeremy, 2026-10-04;
   /mnt/project-files/reference/music-app-automation-notes.md, sections 3 to 6 and 8) so the two apps stay one
   design. Decisions and differences: /mnt/project-files/decisions/music-app-parity.md.

   THE DATA lives in the engine (CurioEngine state.masters, see engine/state.js MASTERS), so it is saved with the
   film and undo covers it. A master is a whole suite of automation placed as one thing:
     - its source ◇ sits where the suite was copied from (src: { tracks, t0, t1 });
     - each destination ◆ (a node) is one placed copy on one track, from moment t for span moments;
     - the source controls all its destinations unless a destination was given its own setting (on, gate, lfo,
       scale on the node itself).
   A master node writes its suite into the lanes as ordinary points, so the engine, the Player and every export
   play the same thing (one engine). Before writing, it saves what lies under it (node.under). Every change puts
   back the under-data of the master nodes it overlaps, newest first, then writes them again oldest first (so where
   two overlap, the newest wins): switching a node off, moving it or deleting it leaves the old place exactly as
   it was. Only master nodes that overlap the change are rewritten, so hand edits elsewhere survive. plan() does it
   and returns the commands for one engine batch: one undo step per gesture.

   What a node plays at moment k of its span (effective(): the node's own setting, else its master's):
     on        false: nothing is written; what was there before plays
     gate[k]   0: that moment plays what was there before
     lfo       1, 2 or 4: on for that many moments, then off for as many, from the start
     scale     0 (off: what was there before) to 100 (the suite as copied): each value moves that share of
               the way from what was there before (Jeremy, 2026-10-04: "0-100 not -100 to +100")
   A node fully on at 100% writes the suite's own nodes (the same points a plain paste writes); otherwise it writes
   one point per moment so the gate, LFO and scale play exactly.

   PERFORMANCE: trigger(id, on, { scale }) switches or scales a master (or one node) while the film plays, without
   an undo step: it lays the lanes it would write over the saved ones with CurioEngine.perform("masters", layer)
   (the Triggers helper's layer API) and trigger(id, null) puts it back as drawn. No perform API: nothing happens.

   THE VIEW (lanes.js draws it): one master lane per track, in a band under the timeline's lanes (the music app
   has "each track has its notes, then one Master lane"; here the lanes stay grouped by category, CapCut-style, so
   the master lanes sit together under them). The band shows the tracks that hold master nodes, lit or folded
   tracks, or every track with Tracks switched on in the Master Nodes window. The track's name selects the track (click: just it; ⌘/Ctrl:
   add or take away; ⇧: a run); selected tracks light up and are where a multi-track paste goes. ▸/▾ folds every
   lane on that track; a folded track's master lane shows faint ticks wherever the track holds automation.
   On a master lane:
     double-click ◆ or ◇      on / off (◇: the master, so every destination that has no setting of its own)
     click one moment of a line  gate that moment (click again to open it)
     drag a line up or down      scale from 0% (off) to 100%
     drag ◆ sideways             move that destination
     ⌥-click (or Delete)         remove a ◆ (⌥-click ◇ removes the whole master and every destination)
     right-click                 a menu: On / Off, LFO every 1, 2 or 4 moments, Scale, Remove, Master Nodes…
   The Master Nodes window lists every master with all of these, and the switch "A paste makes a master node". */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const E = () => root.CurioEngine;
  const S = () => root.CurioScale;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const LFOS = [0, 1, 2, 4];

  /* ---------- the rules (pure; tested without a page) ---------- */
  function effective(m, node) {
    const own = (k) => node && node[k] != null;
    return {
      on: own("on") ? node.on !== false : m.on !== false,
      gate: own("gate") ? node.gate || {} : m.gate || {},
      lfo: own("lfo") ? Number(node.lfo) || 0 : Number(m.lfo) || 0,
      scale: own("scale") ? Number(node.scale) : m.scale == null ? 100 : Number(m.scale),
    };
  }
  /* Does moment k of the span play the suite? */
  function momentOn(eff, k) {
    if (!eff.on) return false;
    if (eff.gate && Number(eff.gate[k]) === 0 && eff.gate[k] != null) return false;
    if (eff.lfo > 0 && Math.floor(k / eff.lfo) % 2 === 1) return false;
    return true;
  }
  const amountOf = (scale) => Math.max(0, Math.min(1, (Number(scale) || 0) / 100));
  /* A value at a place on a curiosity's scale, and back. */
  const posOf = (cur, v) => (S() ? S().pos(cur, v) : null);
  const atPos = (cur, p) => S().at(cur, Math.max(0, Math.min(1, p)));
  function convert(fromCur, toCur, v) {
    if (fromCur === toCur) return v;
    const p = posOf(fromCur, v);
    return S().fix(toCur, atPos(toCur, p == null ? 0.5 : p));
  }
  /* A lane's value at every moment from its points (the engine's own rule: ramp, smooth or hold). */
  function series(rows, points, mode, cur) {
    const pts = [];
    rows.forEach((r, i) => points && points[r.id] != null && pts.push({ i, v: points[r.id] }));
    return rows.map((_, i) => {
      if (!pts.length) return undefined;
      let a = null;
      let b = null;
      for (const p of pts) {
        if (p.i <= i) a = p;
        if (p.i >= i && !b) b = p;
      }
      if (!a) return b.v;
      if (!b || a === b || mode === "hold") return a.v;
      const pa = posOf(cur, a.v);
      const pb = posOf(cur, b.v);
      let t = (i - a.i) / (b.i - a.i);
      if (mode === "smooth") t = t * t * (3 - 2 * t);
      return pa == null || pb == null ? a.v : atPos(cur, pa + (pb - pa) * t);
    });
  }
  /* The suite lane's value at moment k of the span (its own points, held before the first and after the last). */
  function suiteAt(sl, k) {
    const pts = sl.points || [];
    if (!pts.length) return undefined;
    let a = null;
    let b = null;
    for (const p of pts) {
      if (p[0] <= k) a = p;
      if (p[0] >= k && !b) b = p;
    }
    if (!a) return b[1];
    if (!b || a === b || sl.mode === "hold") return a[1];
    const pa = posOf(sl.cur, a[1]);
    const pb = posOf(sl.cur, b[1]);
    let t = (k - a[0]) / (b[0] - a[0]);
    if (sl.mode === "smooth") t = t * t * (3 - 2 * t);
    return pa == null || pb == null ? a[1] : atPos(sl.cur, pa + (pb - pa) * t);
  }
  const lkCur = (lk) => lk.slice(lk.indexOf("|") + 1);
  const lkTrack = (lk) => lk.slice(0, lk.indexOf("|"));
  /* Every destination node, with its master and where it sits: [{ m, node, j0, j1, lks }] */
  function placed(st, ms) {
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const out = [];
    ((ms && ms.list) || []).forEach((m) =>
      (m.nodes || []).forEach((node) => {
        if (ix[node.t] == null) return;
        const j0 = ix[node.t];
        out.push({ m, node, j0, j1: Math.min(st.rows.length - 1, j0 + m.span - 1), lks: (node.lks || []).filter(Boolean) });
      })
    );
    return out;
  }
  const overlaps = (a, b) => a.j0 <= b.j1 && b.j0 <= a.j1 && a.lks.some((lk) => b.lks.includes(lk));
  /* What a node is, leaving out what it saved under it: a change here means it must be rewritten. */
  const sig = (p) => JSON.stringify([p.j0, p.j1, p.node.lks, p.node.on, p.node.gate, p.node.lfo, p.node.scale, p.m.on, p.m.gate, p.m.lfo, p.m.scale, p.m.span, p.m.suite]);
  /* The value nothing-applied plays in a lane with no points: its own material, else the curiosity's start. */
  function bare(st, lk, rowId) {
    const k = rowId + "|" + lk;
    return st.source && st.source[k] != null ? st.source[k] : S().start(lkCur(lk));
  }
  /* Write one node into the working points (pts: { lk: { rowId: value } }). Saves what lay under it first. */
  function writeNode(st, pts, modes, p, over) {
    const { m, node } = p;
    const eff = Object.assign(effective(m, node), over || {});
    const amount = amountOf(eff.scale);
    const rows = st.rows.slice(p.j0, p.j1 + 1);
    const under = {};
    (node.lks || []).forEach((lk, k) => {
      const sl = m.suite && m.suite.lanes ? m.suite.lanes[k] : null;
      if (!lk || !sl) return;
      const lane = pts[lk] || (pts[lk] = {});
      const u = (under[lk] = {});
      rows.forEach((r) => (u[r.id] = lane[r.id] != null ? lane[r.id] : null));
      const cur = lkCur(lk);
      const on = rows.map((_, k2) => momentOn(eff, k2));
      if (!on.some(Boolean) || amount <= 0) return;
      if (amount >= 1 && on.every(Boolean)) {
        rows.forEach((r) => delete lane[r.id]);
        (sl.points || []).forEach(([at, v]) => {
          if (rows[at]) lane[rows[at].id] = convert(sl.cur, cur, v);
        });
        return;
      }
      const base = series(st.rows, lane, modes[lk] || "ramp", cur);
      rows.forEach((r, k2) => {
        const was = base[p.j0 + k2] === undefined ? bare(st, lk, r.id) : base[p.j0 + k2];
        if (!on[k2]) {
          if (lane[r.id] == null) lane[r.id] = was;
          return;
        }
        const want = convert(sl.cur, cur, suiteAt(sl, k2));
        const pw = posOf(cur, was);
        const pv = posOf(cur, want);
        lane[r.id] = pw == null || pv == null ? (amount >= 0.5 ? want : was) : atPos(cur, pw + (pv - pw) * amount);
      });
    });
    return under;
  }
  function restoreNode(pts, node) {
    Object.keys(node.under || {}).forEach((lk) => {
      const lane = pts[lk] || (pts[lk] = {});
      Object.keys(node.under[lk]).forEach((r) => {
        const v = node.under[lk][r];
        if (v == null) delete lane[r];
        else lane[r] = v;
      });
    });
  }
  /* The commands that take the film from st (with its masters) to the masters `next`: put back and rewrite every
     node that changed and every node overlapping one that did. o.over: { nodeId: { on?, scale? } } a performance's
     overrides (then the result is { lanes } for CurioEngine.perform, and no commands). o.locked(lk): a lane that
     must not change. -> { cmds, lanes, touched, error? } */
  function plan(st, next, o) {
    o = o || {};
    next = clone(next && next.list ? next : { list: [] });
    const before = placed(st, st.masters);
    const after = placed(st, next);
    const was = {};
    before.forEach((p) => (was[p.node.id] = p));
    const now = {};
    after.forEach((p) => (now[p.node.id] = p));
    const hit = new Set();
    after.forEach((p) => (!was[p.node.id] || sig(was[p.node.id]) !== sig(p) || (o.over && o.over[p.node.id])) && hit.add(p.node.id));
    before.forEach((p) => !now[p.node.id] && hit.add(p.node.id));
    (o.force || []).forEach((id) => hit.add(id));
    /* Grow to every node that overlaps one being rewritten (where it was, or where it goes). */
    let grew = true;
    while (grew) {
      grew = false;
      const span = [];
      hit.forEach((id) => [was[id], now[id]].forEach((p) => p && span.push(p)));
      before.concat(after).forEach((p) => {
        if (hit.has(p.node.id)) return;
        if (span.some((q) => overlaps(p, q))) {
          hit.add(p.node.id);
          grew = true;
        }
      });
    }
    const lks = new Set();
    hit.forEach((id) => [was[id], now[id]].forEach((p) => p && p.lks.forEach((lk) => lks.add(lk))));
    if (o.locked) {
      const lk = [...lks].find((x) => o.locked(x));
      if (lk) return { error: "locked", lk, cmds: [] };
    }
    const pts = {};
    const modes = {};
    lks.forEach((lk) => {
      const lane = st.lanes[lk];
      pts[lk] = lane ? Object.assign({}, lane.points) : {};
      modes[lk] = lane ? lane.mode : "ramp";
    });
    /* Put back, newest first; write again, oldest first (the newest wins). */
    before
      .filter((p) => hit.has(p.node.id))
      .sort((a, b) => b.node.n - a.node.n)
      .forEach((p) => restoreNode(pts, p.node));
    after
      .filter((p) => hit.has(p.node.id))
      .sort((a, b) => a.node.n - b.node.n)
      .forEach((p) => (p.node.under = writeNode(st, pts, modes, p, o.over ? o.over[p.node.id] : null)));
    if (o.over) {
      const lanes = {};
      lks.forEach((lk) => (lanes[lk] = { on: st.lanes[lk] ? st.lanes[lk].on !== false : true, mode: modes[lk], points: pts[lk] }));
      return { lanes, touched: [...hit], cmds: [] };
    }
    const sets = [];
    const removes = [];
    lks.forEach((lk) => {
      const old = st.lanes[lk] ? st.lanes[lk].points : {};
      const nw = pts[lk];
      const track = lkTrack(lk);
      const curiosity = lkCur(lk);
      Object.keys(nw).forEach((r) => String(old[r]) !== String(nw[r]) && sets.push({ type: "setPoint", row: r, track, curiosity, value: nw[r] }));
      Object.keys(old).forEach((r) => nw[r] == null && removes.push({ type: "removePoint", row: r, track, curiosity }));
    });
    /* Points first, then removals, so a lane that keeps any point keeps its mode, level and switch. */
    return { cmds: sets.concat(removes, [{ type: "setMasters", masters: next.list.length ? next : null }]), touched: [...hit], masters: next };
  }
  /* Play the batch's point commands on a copy of the film, so the next plan starts from where they leave it. */
  function simulate(st, cmds) {
    st = clone(st);
    (cmds || []).forEach((c) => {
      if (!c) return;
      if (c.type === "addCuriosity") {
        const t = st.tracks.find((x) => x.id === c.track);
        if (t && !t.curiosities.includes(c.curiosity)) t.curiosities.push(c.curiosity);
      } else if (c.type === "setPoint") {
        const lk = c.track + "|" + c.curiosity;
        const lane = st.lanes[lk] || (st.lanes[lk] = { on: true, mode: "ramp", points: {} });
        lane.points[c.row] = c.value;
      } else if (c.type === "removePoint") {
        const lk = c.track + "|" + c.curiosity;
        if (st.lanes[lk]) {
          delete st.lanes[lk].points[c.row];
          if (!Object.keys(st.lanes[lk].points).length) delete st.lanes[lk];
        }
      } else if (c.type === "setMasters") {
        if (c.masters) st.masters = clone(c.masters);
        else delete st.masters;
      }
    });
    return st;
  }
  function newIds(ms, n) {
    const have = new Set();
    ((ms && ms.list) || []).forEach((m) => (have.add(m.id), (m.nodes || []).forEach((x) => have.add(x.id))));
    const out = [];
    let k = 1;
    while (out.length < n) {
      const id = "mn" + k++;
      if (!have.has(id)) out.push(id);
    }
    return out;
  }
  /* A paste's commands made into a master (the music app's "complex way"): the lanes it writes become the suite,
     one destination ◆ per destination track. cmds: what pasteAreaCommands gave; start: its first moment; span: how
     many moments it fills; src: { tracks, t0, t1 } where it was copied from. Its addCuriosity and addLink commands
     are kept as they are; the points are written by the master (the same points, when it is fully on).
     -> { cmds } for one batch, or { error }. */
  function wrapPaste(st, cmds, start, span, src, o) {
    o = o || {};
    const adds = cmds.filter((c) => c.type === "addCuriosity");
    const links = cmds.filter((c) => c.type === "addLink");
    const writes = {};
    const order = [];
    cmds.forEach((c) => {
      if (c.type !== "setPoint" && c.type !== "removePoint") return;
      const lk = c.track + "|" + c.curiosity;
      if (!writes[lk]) (writes[lk] = []), order.push(lk);
      if (c.type === "setPoint") {
        const j = st.rows.findIndex((r) => r.id === c.row);
        if (j >= start && j < start + span) writes[lk].push([j - start, c.value]);
      }
    });
    const lanes = order.filter((lk) => writes[lk].length);
    if (!lanes.length) return { cmds };
    const sim = simulate(st, adds);
    const next = clone(sim.masters || { list: [] });
    next.seq = Number(next.seq) || 0;
    const tracks = [];
    lanes.forEach((lk) => !tracks.includes(lkTrack(lk)) && tracks.push(lkTrack(lk)));
    const ids = newIds(next, 1 + tracks.length);
    const m = {
      id: ids[0],
      label: o.label || "Pasted " + lanes.map((lk) => (S() ? S().label(lkCur(lk)) : lkCur(lk))).slice(0, 2).join(" + ") + (lanes.length > 2 ? " +" + (lanes.length - 2) : ""),
      src: { tracks: (src && src.tracks) || [], t0: (src && src.t0) || "", t1: (src && src.t1) || "" },
      span,
      suite: { lanes: lanes.map((lk) => ({ cur: lkCur(lk), track: lkTrack(lk), mode: (sim.lanes[lk] && sim.lanes[lk].mode) || "ramp", points: writes[lk].sort((a, b) => a[0] - b[0]) })) },
      on: true,
      gate: {},
      lfo: 0,
      scale: 100,
      nodes: tracks.map((t, k) => ({ id: ids[k + 1], n: ++next.seq, track: t, t: st.rows[start].id, lks: lanes.map((lk) => (lkTrack(lk) === t ? lk : null)), under: {} })),
    };
    next.list.push(m);
    const p = plan(sim, next, { locked: o.locked });
    if (p.error) return p;
    return { cmds: adds.concat(p.cmds.filter((c) => c.type !== "setMasters"), links, p.cmds.filter((c) => c.type === "setMasters")), master: m.id, nodes: m.nodes.length };
  }
  /* Option B of a multi-track paste: each copied lane as a percentage of its first point, applied to the level the
     destination has where the paste starts (on the curiosity's 0 to 1 scale; from a first point at 0, the same
     steps up or down instead). lane: { cur, points: [{ at, value }] } -> a copy with new values. */
  function percentLane(lane, destCur, destValue) {
    const pts = lane.points || [];
    if (!pts.length) return lane;
    const p0 = posOf(lane.cur, pts[0].value);
    const d0 = posOf(destCur, destValue);
    return Object.assign({}, lane, {
      cur: destCur,
      points: pts.map((p) => {
        const pi = posOf(lane.cur, p.value);
        if (pi == null || p0 == null || d0 == null) return Object.assign({}, p, { value: convert(lane.cur, destCur, p.value) });
        const to = p0 > 1e-6 ? d0 * (pi / p0) : d0 + (pi - p0);
        return Object.assign({}, p, { value: S().fix(destCur, atPos(destCur, to)) });
      }),
    });
  }
  /* The copied tracks, in order, repeated over the selected tracks (the music app: "when more tracks are selected
     than were copied, the copied tracks repeat in order from the top"). -> [[destTrack, copiedTrack]] */
  function repeatTracks(copied, chosen) {
    return (chosen || []).map((t, k) => [t, copied.length ? copied[k % copied.length] : null]);
  }

  /* ---------- the performance (triggers) ---------- */
  const overNow = {};
  function performNow() {
    const Eng = E();
    if (!Eng || typeof Eng.perform !== "function") return { ok: false, error: "This engine has no performance layer yet." };
    const st = Eng.state();
    if (!Object.keys(overNow).length || !st.masters) {
      Eng.perform("masters", null);
      return { ok: true, cleared: true };
    }
    const r = plan(st, st.masters, { over: overNow });
    Eng.perform("masters", { lanes: r.lanes });
    return { ok: true, lanes: Object.keys(r.lanes) };
  }
  /* trigger(id, on, { scale }): id is a master (its every destination) or one destination. on: true or false
     switches it; null puts it back as drawn. Not an undo step: a performance, put back when playback stops. */
  function trigger(id, on, opts) {
    const Eng = E();
    const st = Eng ? Eng.state() : null;
    if (!st || !st.masters) return { ok: false, error: "There are no master nodes." };
    const m = st.masters.list.find((x) => x.id === id || (x.nodes || []).some((n) => n.id === id));
    if (!m) return { ok: false, error: "There is no master node " + id + "." };
    const nodes = m.id === id ? m.nodes : m.nodes.filter((n) => n.id === id);
    nodes.forEach((n) => {
      if (on == null) delete overNow[n.id];
      else {
        const o = { on: !!on };
        if (opts && opts.scale != null && isFinite(Number(opts.scale))) o.scale = Math.max(0, Math.min(100, Number(opts.scale)));
        overNow[n.id] = o;
      }
    });
    const r = performNow();
    try {
      if (root.CurioScreen && root.CurioScreen.setRow && root.CurioScreen.row) root.CurioScreen.setRow(root.CurioScreen.row());
    } catch (e) {}
    return r;
  }
  function stopAll() {
    Object.keys(overNow).forEach((k) => delete overNow[k]);
    const Eng = E();
    if (Eng && typeof Eng.perform === "function") Eng.perform("masters", null);
  }

  root.CurioMasters = { effective, momentOn, amountOf, series, suiteAt, placed, plan, simulate, wrapPaste, percentLane, repeatTracks, convert, trigger, performing: () => Object.assign({}, overNow), stopAll, LFOS };
})();
