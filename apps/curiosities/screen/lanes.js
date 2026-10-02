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
   - trackFor(cur)       the track a curiosity goes on when it is not on one yet
   - group(nodeKey)      the nodes and links joined to a node
   - copyGroup(nodeKey), paste(atRow) -> { ok, error? }   the proximity clipboard (kept across films)
   - ensure(cur)         make sure a lane's curiosity is on a track (one undo step), returns the track id */
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

  function trackFor(cur, st) {
    st = st || E().state();
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
  function group(key, st) {
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
  /* Commands that move (or copy) a group by d moments. */
  function shiftCommands(st, key, d, copy) {
    const g = group(key, st);
    const ix = {};
    st.rows.forEach((r, i) => (ix[r.id] = i));
    const nodes = g.nodes.map(split);
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
    g.links.forEach((l) => {
      const scope = { from: at(l.scope.from), to: at(l.scope.to) };
      if (copy) {
        const body = JSON.parse(JSON.stringify(l));
        delete body.id;
        cmds.push(Object.assign({ type: "addLink" }, body, { scope }));
      } else cmds.push({ type: "updateLink", link: l.id, changes: { scope } });
    });
    return { cmds, size: nodes.length, links: g.links.length };
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
  function copyGroup(key) {
    const st = E().state();
    const g = group(key, st);
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
  function paste(atRow) {
    if (!clip || !clip.nodes.length) return { ok: false, error: "Copy a proximity first (pick a node, then Copy)." };
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

  /* ---------- the view ---------- */
  function mount(el, opts) {
    opts = opts || {};
    let sel = null; /* selected node key */
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
      const top = laneTop + i * LANE_H;
      return top + PAD + (1 - (p == null ? 0.5 : p)) * (LANE_H - PAD * 2);
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
      const colW = Math.max(46, Math.floor((width - 200) / Math.max(1, n)));
      const svgW = colW * n;
      const clipRows = opts.clips ? opts.clips() : [];
      const CLIP_H = 28;
      const top = clipRows.length * CLIP_H + (opts.ruler ? RULER : 0);
      const svgH = top + lanes.length * LANE_H;
      laneTop = top;
      const playRow = opts.row ? opts.row() : -1;
      geo = { colW, lanes, top, n, st };
      const heads = lanes
        .map(
          (ln, i) => `<div class="sl-head${ln.group ? " sl-in-group" : ""}${sel && sel.endsWith("@" + ln.lk) ? " on" : ""}" style="height:${LANE_H}px" data-i="${i}">
            ${opts.header ? opts.header(ln, i) : `<button type="button" class="sl-name" data-pick="${esc(ln.cur)}">${esc(ln.label || S().label(ln.cur))}</button>`}
            <span class="sl-sub">${ln.group ? esc(ln.group) + " · " : ""}${ln.track ? esc((st.tracks.find((t) => t.id === ln.track) || {}).label || "") : "not on a track yet"}${ln.lk && st.lanes[ln.lk] ? " · " + Object.keys(st.lanes[ln.lk].points).length + " nodes" : ""}</span>
          </div>`
        )
        .join("");
      const svg = [];
      const dots = []; /* nodes go on top of the lines */
      /* Film clip tracks first, like the video tracks at the top of Final Cut Pro's timeline. */
      clipRows.forEach((cr, k) => {
        const y = k * CLIP_H;
        (cr.clips || []).forEach((c) => {
          const x = c.from * svgW;
          const w = Math.max(3, (c.to - c.from) * svgW - 2);
          svg.push(`<g class="sl-clip ${esc(c.cls || "")}" data-clip="${Math.floor(c.from * n + 1e-6)}"><rect x="${x + 1}" y="${y + 2}" width="${w}" height="${CLIP_H - 4}" rx="4"/><text x="${x + 6}" y="${y + 18}">${esc(String(c.text || "").slice(0, Math.max(0, Math.floor(w / 6))))}</text><title>${esc(c.title || c.text || "")}</title></g>`);
        });
      });
      const rulerY = clipRows.length * CLIP_H;
      if (opts.ruler) st.rows.forEach((r, j) => svg.push(`<text x="${j * colW + 4}" y="${rulerY + 12}" class="sl-ruler">${j + 1}</text>`));
      lanes.forEach((ln, i) => {
        const y0 = top + i * LANE_H;
        svg.push(`<rect class="sl-bg${i % 2 ? " odd" : ""}" x="0" y="${y0}" width="${svgW}" height="${LANE_H}" data-lane="${i}"/>`);
      });
      for (let j = 0; j <= n; j++) svg.push(`<line class="sl-grid" x1="${j * colW}" x2="${j * colW}" y1="0" y2="${svgH}"/>`);
      if (playRow >= 0 && playRow < n) svg.push(`<rect class="sl-play" x="${playRow * colW}" y="0" width="${colW}" height="${svgH}"/>`);
      lanes.forEach((ln, i) => {
        if (!ln.track) return;
        /* The result line (what plays), then the automation: nodes joined by lines. */
        const pts = st.rows.map((r, j) => [j * colW + colW / 2, yFor(ln.cur, Eng.value(r.id, ln.track, ln.cur), i)]);
        svg.push(`<polyline class="sl-result" points="${pts.map((p) => p.join(",")).join(" ")}"/>`);
        const lane = st.lanes[ln.lk];
        if (!lane) return;
        const ix = st.rows.map((r) => r.id);
        const nodes = Object.keys(lane.points)
          .filter((r) => ix.includes(r))
          .map((r) => ({ r, j: ix.indexOf(r), v: lane.points[r] }))
          .sort((a, b) => a.j - b.j);
        const xy = nodes.map((p) => [p.j * colW + colW / 2, yFor(ln.cur, p.v, i)]);
        if (xy.length > 1) {
          const d = lane.mode === "hold" ? xy.map((p, k) => (k ? `H${p[0]} V${p[1]}` : `M${p[0]} ${p[1]}`)).join(" ") : "M" + xy.map((p) => p.join(" ")).join(" L");
          svg.push(`<path class="sl-auto${lane.on ? "" : " off"}" d="${d}"/>`);
        }
        nodes.forEach((p, k) => {
          const key = nodeKey(p.r, ln.lk);
          dots.push(`<circle class="sl-node${sel === key ? " on" : ""}" cx="${xy[k][0]}" cy="${xy[k][1]}" r="6" data-node="${esc(key)}" data-lane="${i}"><title>${esc(S().label(ln.cur))}: ${esc(p.v)} at moment ${p.j + 1}</title></circle>`);
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
      el.innerHTML = `<div class="sl-tools">
          <button type="button" data-act="undo" ${Eng.canUndo() ? "" : "disabled"}>Undo</button><button type="button" data-act="redo" ${Eng.canRedo() ? "" : "disabled"}>Redo</button>
          <button type="button" data-act="copy" ${sel ? "" : "disabled"} title="Copy the picked node with every node joined to it">Copy proximity</button>
          <button type="button" data-act="paste" ${clip ? "" : "disabled"} title="Paste at the playhead's moment">Paste at moment ${playRow + 1}</button>
          <button type="button" data-act="del" ${sel ? "" : "disabled"}>Remove node</button>
          <span class="sl-msg" role="status">${esc(msg || (others ? others + " more proximities between these lanes are rules for the whole lane (no nodes); the Engine's Links tab lists them." : "Drag a node onto another lane's node to join them."))}</span>
        </div>
        <div class="sl-body"><div class="sl-heads">${clipRows.map((cr) => `<div class="sl-head sl-cliphead" style="height:${CLIP_H}px" title="${esc(cr.title || "")}">${esc(cr.label)}</div>`).join("")}${opts.ruler ? `<div style="height:${RULER}px"></div>` : ""}${heads}</div>
        <div class="sl-scroll"><svg class="sl-svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">${svg.join("")}${dots.join("")}${drag && drag.ghost ? drag.ghost : ""}</svg></div></div>`;
    }

    function at(e) {
      const svg = el.querySelector(".sl-svg");
      const r = svg.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const j = Math.max(0, Math.min(geo.n - 1, Math.floor(x / geo.colW)));
      const i = Math.floor((y - geo.top) / LANE_H);
      const ln = geo.lanes[i];
      let p = null;
      if (ln) p = 1 - (y - geo.top - i * LANE_H - PAD) / (LANE_H - PAD * 2);
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
    function onDown(e) {
      const node = e.target.closest && e.target.closest("[data-node]");
      const link = e.target.closest && e.target.closest("[data-link]");
      const clipEl = e.target.closest && e.target.closest("[data-clip]");
      if (clipEl && opts.onClip) {
        opts.onClip(Number(clipEl.dataset.clip) || 0);
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
        drag = { key: sel, start: a, copy: e.altKey || e.shiftKey, moved: false };
        if (opts.onSelect) opts.onSelect(split(sel).cur);
        e.preventDefault();
        return;
      }
      if (!a.ln) return;
      drag = { add: true, start: a };
    }
    function onMove(e) {
      if (!drag || drag.add) return;
      const a = at(e);
      if (Math.abs(a.x - drag.start.x) + Math.abs(a.y - drag.start.y) > 4) drag.moved = true;
      if (!drag.moved) return;
      const svg = el.querySelector(".sl-svg");
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
      if (!drag) return;
      const d = drag;
      drag = null;
      const a = at(e);
      const st = E().state();
      if (d.add) {
        if (Math.abs(a.x - d.start.x) + Math.abs(a.y - d.start.y) > 4 || !a.ln || a.ln !== d.start.ln) return draw();
        let track = a.ln.track;
        if (!track) track = ensure(a.ln.cur);
        if (!track) return say("Every track is full; remove a lane first.");
        const v = S().at(a.ln.cur, a.p);
        const r = send({ type: "setPoint", row: E().state().rows[a.j].id, track, curiosity: a.ln.cur, value: v, label: "Add a node" });
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
      const dj = a.j - ix;
      const onOwnLane = a.ln && a.ln.lk === from.lk;
      const cmds = [];
      let label = "Change a node";
      if (dj !== 0) {
        const sh = shiftCommands(st, d.key, dj, copy);
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
      const n = split(key);
      const cmds = [];
      st.links.forEach((l) => {
        const ends = linkEnds(l);
        if (ends && ends.includes(key)) cmds.push({ type: "removeLink", link: l.id });
      });
      if (st.lanes[n.lk] && st.lanes[n.lk].points[n.row] != null) cmds.push({ type: "removePoint", row: n.row, track: n.track, curiosity: n.cur });
      if (cmds.length) send({ type: "batch", label: "Remove a node", commands: cmds });
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
      const b = e.target.closest("button[data-act]");
      const pick = e.target.closest("[data-pick]");
      if (pick && opts.onSelect) opts.onSelect(pick.dataset.pick);
      if (!b) return;
      const act = b.dataset.act;
      if (act === "undo") E().undo();
      if (act === "redo") E().redo();
      if (act === "copy" && sel) {
        const r = copyGroup(sel);
        say(r.ok ? `Copied ${r.nodes} node${r.nodes === 1 ? "" : "s"} and ${r.links} line${r.links === 1 ? "" : "s"}. Move the playhead and press Paste.` : r.error);
      }
      if (act === "paste") {
        const r = paste(opts.row ? opts.row() : 0);
        say(r.ok ? `Pasted ${r.nodes} nodes and ${r.links} lines.` : r.error);
      }
      if (act === "del" && sel) return removeNode(sel);
      draw();
      if (act === "copy" || act === "paste") say(msg);
    }
    function onDbl(e) {
      const node = e.target.closest && e.target.closest("[data-node]");
      if (node) removeNode(node.dataset.node);
    }
    function onKey(e) {
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
    draw();
    return {
      draw,
      select: (key) => ((sel = key), draw()),
      destroy() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      },
    };
  }

  root.CurioLanes = { mount, trackFor, ensure, group, copyGroup, paste, shiftCommands, linkCommand, nodeKey, clip: () => clip, LANE_H };
})();
