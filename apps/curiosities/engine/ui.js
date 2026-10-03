/* engine/ui.js: the engine's window. Opens from the Library menu ("Engine: timeline, links, cube"), or on its
   own page (engine/index.html). Every part is a view of window.CurioEngine: it reads state() and result()
   and changes things only by sending messages (send, undo, redo). It keeps no copy of the film.

   window.CurioEngineUI = { open(tab), close(), host(), mount(el), addBand(provider) }
   Tabs: Timeline (the master: tracks down, moments across, a lane per curiosity), Links (proximities as a
   list, and what fired), Cube (cube.js), Analyze (pull curiosities out of a script or shot list, carry one
   onto your film), History (undo, the save-and-reload check, host calls, and the app-wide history). */
(function () {
  const E = window.CurioEngine;
  const S = window.CurioScale;
  if (!E || !S || typeof document === "undefined") return;

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const TABS = [
    ["timeline", "Timeline"],
    ["links", "Links"],
    ["cube", "Cube"],
    ["analyze", "Analyze"],
    ["history", "History"],
  ];
  const WHY = {
    source: "your material",
    lane: "an automation lane",
    edit: "your pin (a hand edit)",
    off: "switched off by hand",
  };
  const DOES = {
    follow: "moves to the same place on its scale",
    oppose: "moves to the opposite place on its scale",
    rise: "steps up",
    fall: "steps down",
    moveWith: "moves the way the leader moved",
    set: "becomes a value",
  };

  let root = null;
  let tab = "timeline";
  let host = null;
  let lastPrint = null;
  let message = "";
  let analysis = null;
  let linkDraft = null;
  let selfResult = null;
  try {
    tab = localStorage.getItem("curiosities-engine-view-v1") || "timeline";
  } catch (e) {}

  /* three.js r128, the version the app uses, loaded once on demand; without it the cube shows a flat grid. */
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  let threeTried = false;
  let threeLoad = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(true);
    if (threeLoad) return threeLoad;
    threeLoad = new Promise((done) => {
      const sc = document.createElement("script");
      sc.src = THREE_URL;
      sc.onload = () => done(!!window.THREE);
      sc.onerror = () => done(false);
      document.head.appendChild(sc);
      setTimeout(() => done(!!window.THREE), 15000);
    }).then((ok) => {
      threeTried = true;
      return ok;
    });
    return threeLoad;
  }

  /* ---------- the host ---------- */
  function getHost() {
    if (host) return host;
    if (window.CuriosityBoard && window.CurioHost) host = window.CurioHost.board(window.CuriosityBoard);
    else if (window.CurioFakeHost && window.CurioHost) host = window.CurioHost.board(window.CurioFakeHost.board({ values: { angleCount: 8 } }));
    return host;
  }
  let board = null;
  function getStoryboard() {
    if (board) return board;
    if (window.CuriosityStoryboard && window.CuriosityStoryboard.data && window.CurioHost && window.CurioHost.storyboard) board = window.CurioHost.storyboard(window.CuriosityStoryboard);
    return board;
  }
  const REOPEN = "curio-engine-reopen";
  function print() {
    const h = getHost();
    if (!h) return say("There is no My film to send to on this page.");
    const out = h.print(E.state(), E.result());
    lastPrint = out;
    if (out.error) return say(out.error);
    const span = out.of > out.count ? " (moments " + (out.from + 1) + " to " + (out.from + out.count) + " of " + out.of + ")" : "";
    say(out.sent ? "Sent to My film" + span + ": " + out.printed.map(S.label).join(", ") + "." : "My film already shows this" + span + ".");
  }
  /* A storyboard without its own door for the engine is written to its saved key, and the page reloads so
     the storyboard reads it; the engine opens again on the same tab. */
  function afterStoryboard(out, done) {
    if (!out || out.error) return say((out && out.error) || "The storyboard did not answer.");
    if (out.reload) {
      try {
        sessionStorage.setItem(REOPEN, tab);
      } catch (e) {}
      say(done + " Reloading so the storyboard shows it…");
      setTimeout(() => location.reload(), 300);
      return;
    }
    say(done);
  }
  function startFilm(from) {
    const h = getHost();
    let film = null;
    if (from === "board" && h) {
      film = h.read();
      if (film.error) {
        say(film.error);
        film = null;
      }
    }
    if (!film) film = window.CurioSeeds.starter();
    const cmds = [{ type: "importFilm", film }];
    const out = E.send({ type: "batch", label: from === "board" ? "Read My film" : "Start a new film", commands: cmds });
    if (!out.ok) return say(out.error);
    const links = window.CurioSeeds.letterLinks(E.state());
    if (links.length && !E.state().links.length) E.send({ type: "batch", label: "Add the letter's links", commands: links });
    say(from === "board" ? "Read My film: one row per panel." : "Started a new film.");
  }
  function say(m) {
    message = m || "";
    const el = root && root.querySelector(".en-msg");
    if (el) el.textContent = message;
  }

  /* ---------- labels ---------- */
  const trackOf = (st, id) => st.tracks.find((t) => t.id === id);
  const rowOf = (st, id) => st.rows.find((r) => r.id === id);
  const linkOf = (st, id) => st.links.find((l) => l.id === id);
  function endName(st, e) {
    const t = trackOf(st, e.track);
    return S.label(e.curiosity) + (t ? " (" + t.label + ")" : "");
  }
  function linkWords(st, l) {
    const lead = endName(st, l.from) + (l.from.is != null ? " is " + l.from.is : l.from.change === "rises" ? " rises" : l.from.change === "drops" ? " drops" : " changes");
    const what = l.does === "set" ? "becomes " + l.value : DOES[l.does];
    const start = l.every ? "Every " + l.every + " row" + (l.every > 1 ? "s" : "") + ", " : "When " + lead + ", ";
    const later = l.within ? ", " + l.within + " row" + (l.within > 1 ? "s" : "") + " later" : "";
    const amount = l.does !== "set" && l.amount < 1 ? " (" + Math.round(l.amount * 100) + "%)" : "";
    return start + endName(st, l.to) + " " + what + later + amount;
  }
  function whyWords(st, why) {
    if (!why) return "";
    if (why.startsWith("link:")) {
      const l = linkOf(st, why.slice(5));
      return "a link: " + (l ? l.label || linkWords(st, l) : "removed");
    }
    return WHY[why] || why;
  }
  const short = (v) => (v == null ? "—" : String(v));

  /* ---------- the frame ---------- */
  function frame() {
    const st = E.state();
    const h = E.history();
    return `<div class="en-wrap">
      <div class="en-head">
        <h2>Engine</h2>
        <input class="en-name" data-act="name" value="${esc(st.name)}" aria-label="Film name" />
        <span class="en-sp"></span>
        <button data-act="undo" ${E.canUndo() ? "" : "disabled"} title="${esc(h.undo[h.undo.length - 1] || "")}">Undo</button>
        <button data-act="redo" ${E.canRedo() ? "" : "disabled"} title="${esc(h.redo[0] || "")}">Redo</button>
        <button data-act="print" title="Play the result on My film's panels">Send to My film</button>
        <label class="en-note" style="margin:0"><input type="checkbox" data-act="auto" ${st.print.auto ? "checked" : ""}/> send every change</label>
        ${root && root.classList.contains("en-overlay") ? `<button data-act="close">Close</button>` : ""}
      </div>
      <div class="en-tabs" role="tablist">${TABS.map(([id, label]) => `<button role="tab" data-tab="${id}" class="${tab === id ? "on" : ""}" aria-selected="${tab === id}">${label}</button>`).join("")}</div>
      <div class="en-msg" role="status">${esc(message)}</div>
      <div class="en-body"></div>
    </div>`;
  }
  function draw() {
    if (!root) return;
    const keepScroll = root.querySelector(".en-scroll");
    const sx = keepScroll ? keepScroll.scrollLeft : 0;
    const sy = root.scrollTop;
    root.innerHTML = frame();
    const body = root.querySelector(".en-body");
    if (!E.state().rows.length && tab !== "analyze" && tab !== "history") body.innerHTML = emptyHtml();
    else if (tab === "timeline") body.innerHTML = timelineHtml();
    else if (tab === "links") body.innerHTML = linksHtml();
    else if (tab === "cube") {
      body.innerHTML = `<p class="en-note">The clip matrix as a cube. The front face is the matrix: tracks across, moments down, each cell a clip (the whole of that track at that moment). Step back a layer and each cell shows one curiosity of its clip. Turn the cube to see every clip's curiosities lined up behind it. Double-click to go inside: each clip is a block with a node per curiosity. Click one node, then another, to link them.</p><div class="en-cube-host"></div>`;
      const cubeHost = body.querySelector(".en-cube-host");
      if (!window.CurioCube) cubeHost.textContent = "The cube is not loaded on this page.";
      else if (window.THREE || threeTried) window.CurioCube.mount(cubeHost, { onLink: draftLink });
      else {
        /* three.js is no longer on every page (the app loads it when a 3D view opens), so load it here once. */
        cubeHost.textContent = "Loading the 3D view…";
        loadThree().then(() => {
          if (root && !root.hidden && tab === "cube" && cubeHost.isConnected) window.CurioCube.mount(cubeHost, { onLink: draftLink });
        });
      }
    } else if (tab === "analyze") body.innerHTML = analyzeHtml();
    else if (tab === "history") body.innerHTML = historyHtml();
    const sc = root.querySelector(".en-scroll");
    if (sc) sc.scrollLeft = sx;
    root.scrollTop = sy;
  }
  function emptyHtml() {
    return `<div class="en-panel"><p>Your film has no rows yet. Start from My film (one row per panel, its controls as your material), or from a starting film with eight moments, a Master track, a Camera track and two characters.</p>
      <p><button class="en-primary" data-act="start-board">Read My film</button> <button data-act="start-new">Start a new film</button></p></div>`;
  }

  /* ---------- timeline ---------- */
  function timelineHtml() {
    const st = E.state();
    const res = E.result();
    const fired = new Set(res.events.map((e) => e.toRow + "|" + e.to));
    const points = new Set();
    Object.keys(st.lanes).forEach((lk) => Object.keys(st.lanes[lk].points).forEach((r) => points.add(r + "|" + lk)));
    let shown = 8;
    try {
      shown = Math.max(1, Number(window.CuriosityBoard ? window.CuriosityBoard.count() : 8) || 8);
    } catch (e) {}
    const inWin = (i) => st.rows.length > shown && i >= st.print.from && i < st.print.from + shown;
    const head = `<tr><th class="en-lane">Track and lane</th>${st.rows.map((r, i) => `<th${inWin(i) ? ' class="en-win"' : ""}><button data-act="row" data-row="${esc(r.id)}" title="Rename, move, add or remove this row">${esc(r.label)}</button></th>`).join("")}<th><button data-act="add-row" title="Add a row at the end">+ row</button></th></tr>`;
    const body = st.tracks
      .map((t) => {
        const top = `<tr class="en-track"><th class="en-lane">${esc(t.label)} ${t.label.toLowerCase() === t.kind ? "" : `<small style="display:inline;opacity:.7">${esc(t.kind)}</small>`}
          <button class="en-small" data-act="track" data-track="${esc(t.id)}" title="Rename, add a curiosity, or remove this track">Edit</button></th><td colspan="${st.rows.length + 1}"></td></tr>`;
        const lanes = t.curiosities
          .map((c) => {
            const lk = E.laneKey(t.id, c);
            const lane = st.lanes[lk];
            const lab = `<th class="en-lane" title="${esc(c)}">${esc(S.label(c))}<small>${lane ? (lane.on ? "automated, " + (lane.mode === "hold" ? "holds" : "ramps") : "automation off") : esc(S.group(c) || "")}
              <button class="en-small" data-act="lane" data-track="${esc(t.id)}" data-cur="${esc(c)}" title="This lane's automation, links and removal">…</button></small></th>`;
            const cells = st.rows
              .map((r) => {
                const k = E.cellKey(r.id, t.id, c);
                const v = res.dest[k];
                const why = res.why[k] || "source";
                const cls = "en-cell why-" + (why.startsWith("link:") ? "link" : why) + (points.has(r.id + "|" + lk) ? " en-point" : "") + (fired.has(r.id + "|" + lk) ? " en-fired" : "");
                const p = S.pos(c, v);
                return `<td><button class="${cls}" data-act="cell" data-row="${esc(r.id)}" data-track="${esc(t.id)}" data-cur="${esc(c)}" title="${esc(short(v) + ": " + whyWords(st, why))}">${esc(short(v))}${p == null ? "" : `<i style="width:${Math.round(p * 100)}%"></i>`}</button></td>`;
              })
              .join("");
            return `<tr>${lab}${cells}<td></td></tr>`;
          })
          .join("");
        return top + lanes;
      })
      .join("");
    return `<p class="en-note">Your film as one timeline. Each track is a column of the clip matrix (Master for the whole film, Camera, one per character); each line under it is one curiosity, moment by moment. Click a cell to change it. A change ripples through your links; a pin stays put whatever the links do.</p>
      <div class="en-legend"><span style="--sw:transparent">your material</span><span style="--sw:#dce9f2">automation lane (● a point)</span><span style="--sw:#f6e2b8">set by a link</span><span style="--sw:#e7dcf3">pinned by hand</span><span style="--sw:#e4e0da">switched off</span></div>
      <div class="en-scroll en-panel"><table class="en-tl"><thead>${head}</thead><tbody>${body}${bandsHtml(st)}</tbody></table></div>
      <p><button data-act="add-track">Add a track</button> <button data-act="start-board">Read My film again</button> <button data-act="start-new">Start a new film</button> <button data-act="unprint" title="Put back what My film showed before the engine sent anything">Take back from My film</button></p>
      ${windowHtml(st)}${storyboardHtml()}`;
  }
  /* Read-only bands under the timeline, drawn by other parts of the app (momentum's Attention and Cue).
     addBand(provider): provider() -> { id, label, lanes: [{ id, label, cells: [{ row, text, title, family?,
     warn? }] }] }, asked again on every redraw. A provider that throws or returns nothing is skipped. */
  const bands = [];
  function addBand(provider) {
    if (typeof provider !== "function" || bands.includes(provider)) return false;
    bands.push(provider);
    if (root && !root.hidden && tab === "timeline") draw();
    return () => {
      const i = bands.indexOf(provider);
      if (i >= 0) bands.splice(i, 1);
      if (root && !root.hidden && tab === "timeline") draw();
    };
  }
  function bandsHtml(st) {
    return bands
      .map((fn) => {
        let b = null;
        try {
          b = fn();
        } catch (e) {
          b = null;
        }
        if (!b || !Array.isArray(b.lanes) || !b.lanes.length) return "";
        const bid = esc(String(b.id == null ? "" : b.id).slice(0, 60));
        const top = `<tr class="en-track en-band" data-band="${bid}"><th class="en-lane">${esc(String(b.label || b.id || "Band").slice(0, 60))} <small style="display:inline;opacity:.7">read only</small></th><td colspan="${st.rows.length + 1}"></td></tr>`;
        return (
          top +
          b.lanes
            .slice(0, 12)
            .map((lane) => {
              const byRow = Object.create(null);
              (Array.isArray(lane && lane.cells) ? lane.cells : []).forEach((c) => c && typeof c.row === "string" && (byRow[c.row] = c));
              const cells = st.rows
                .map((r) => {
                  const c = byRow[r.id];
                  if (!c) return `<td></td>`;
                  const fam = typeof c.family === "string" ? c.family.replace(/[^a-z0-9-]/gi, "").slice(0, 30) : "";
                  return `<td><div class="en-bandcell${c.warn ? " en-warn" : ""}"${fam ? ` data-family="${fam}"` : ""} title="${esc(String(c.title == null ? "" : c.title).slice(0, 300))}">${esc(String(c.text == null ? "" : c.text).slice(0, 40))}</div></td>`;
                })
                .join("");
              return `<tr data-band="${bid}"><th class="en-lane">${esc(String((lane && (lane.label || lane.id)) || "").slice(0, 60))}</th>${cells}<td></td></tr>`;
            })
            .join("")
        );
      })
      .join("");
  }

  /* My film shows as many moments as it has panels (Angles per scene, up to 8); a longer film is sent a
     window at a time. The storyboard takes the whole film. */
  function windowHtml(st) {
    const h = getHost();
    let n = 8;
    try {
      n = Math.max(1, Number(window.CuriosityBoard ? window.CuriosityBoard.count() : 8) || 8);
    } catch (e) {}
    if (!h || st.rows.length <= n) return "";
    const from = st.print.from;
    const to = Math.min(st.rows.length, from + n);
    return `<div class="en-panel en-window"><b>My film shows moments ${from + 1} to ${to} of ${st.rows.length}</b> <span class="en-note">(it has ${n} panels; the outlined moments are the ones it shows)</span>
      <div class="en-row" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px"><button data-act="win-prev" ${from ? "" : "disabled"}>Earlier moments</button><button data-act="win-next" ${to < st.rows.length ? "" : "disabled"}>Later moments</button></div></div>`;
  }
  function storyboardHtml() {
    const sb = getStoryboard();
    if (!sb) return "";
    const list = sb.scenes();
    if (!Array.isArray(list)) return "";
    const mine = list.filter((x) => !x.engine);
    const printed = list.filter((x) => x.engine).length;
    return `<div class="en-panel" style="margin-top:10px"><h3 style="margin:0 0 4px">The storyboard</h3>
      <p class="en-note">The storyboard has no 8-panel limit: send the whole film there as scenes of up to ${sb.PER} panels, or read storyboard scenes in as moments (up to 64).</p>
      <div class="en-row" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><button class="en-primary" data-act="sb-print">Send the whole film to the storyboard</button>${printed ? `<button data-act="sb-unprint">Remove the engine's scenes (${printed})</button>` : ""}</div>
      ${mine.length ? `<div class="en-row" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px"><label class="en-note">Read <select data-field="sb-scene"><option value="all">every scene</option>${mine.map((x) => `<option value="${x.index}">${esc(x.name)} (${x.panels} panels)</option>`).join("")}</select></label><button data-act="sb-read">Read it as the film</button></div>` : ""}</div>`;
  }

  /* A small window next to the thing clicked. */
  let pop = null;
  function closePop() {
    if (pop) pop.remove();
    pop = null;
  }
  function openPop(anchor, html, wire) {
    closePop();
    pop = document.createElement("div");
    pop.className = "en-pop";
    pop.setAttribute("role", "dialog");
    pop.innerHTML = html + `<div class="en-row"><button class="en-small" data-pop="close">Close</button></div>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    const w = pop.offsetWidth;
    const hgt = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + "px";
    pop.style.top = (r.bottom + hgt + 8 < window.innerHeight ? r.bottom + 4 : Math.max(8, r.top - hgt - 4)) + "px";
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pop]");
      if (!b) return;
      if (b.dataset.pop === "close") return closePop();
      wire(b.dataset.pop, pop);
    });
    const first = pop.querySelector("select, input, button");
    if (first) first.focus();
  }
  function valueField(c, v, name) {
    const d = S.domain(c);
    if (d.kind === "range") return `<input type="number" name="${name || "v"}" min="${d.min}" max="${d.max}" step="${d.step}" value="${esc(v == null ? S.start(c) : v)}" />`;
    return `<select name="${name || "v"}">${d.options.map((o) => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  }
  function cellPop(btn) {
    const { row, track, cur } = btn.dataset;
    const st = E.state();
    const k = E.cellKey(row, track, cur);
    const v = E.result().dest[k];
    const why = E.result().why[k] || "source";
    const lane = st.lanes[E.laneKey(track, cur)];
    const hasPoint = lane && lane.points[row] != null;
    const pinned = why === "edit" || why === "off";
    const where = why === "lane" ? "the automation lane at this row" : why.startsWith("link:") ? "a pin (a link set it, so a change here is kept as a hand edit)" : "your material, and ripples through your links";
    openPop(
      btn,
      `<h4>${esc((rowOf(st, row) || {}).label)} · ${esc((trackOf(st, track) || {}).label)} · ${esc(S.label(cur))}</h4>
       <div>Now <b>${esc(short(v))}</b>, from ${esc(whyWords(st, why))}.</div>
       <div class="en-row">${valueField(cur, v)} <button class="en-primary" data-pop="change">Change it</button></div>
       <div class="en-note">Change it goes into ${esc(where)}.</div>
       <div class="en-row"><button data-pop="pin">Pin it</button><button data-pop="point">Automation point</button><button data-pop="off">Switch off here</button></div>
       <div class="en-row">${pinned ? `<button data-pop="unpin">Unpin</button>` : ""}${hasPoint ? `<button data-pop="unpoint">Remove the point</button>` : ""}${st.source[k] != null ? `<button data-pop="reset">Reset my value</button>` : ""}<button data-pop="link">Link from here</button></div>`,
      (act, el) => {
        const field = el.querySelector("[name=v]");
        const val = field ? (field.type === "number" ? Number(field.value) : field.value) : null;
        const base = { row, track, curiosity: cur };
        let out = null;
        if (act === "change") {
          if (why === "lane") out = E.send(Object.assign({ type: "setPoint", value: val }, base));
          else if (why.startsWith("link:") || pinned) out = E.send(Object.assign({ type: "edit", value: val }, base));
          else out = E.send(Object.assign({ type: "setSource", value: val }, base));
        } else if (act === "pin") out = E.send(Object.assign({ type: "edit", value: val }, base));
        else if (act === "point") out = E.send(Object.assign({ type: "setPoint", value: val }, base));
        else if (act === "off") out = E.send(Object.assign({ type: "edit", off: true }, base));
        else if (act === "unpin") out = E.send(Object.assign({ type: "clearEdit" }, base));
        else if (act === "unpoint") out = E.send(Object.assign({ type: "removePoint" }, base));
        else if (act === "reset") out = E.send(Object.assign({ type: "clearSource" }, base));
        else if (act === "link") {
          closePop();
          draftLink({ track, curiosity: cur }, null);
          return;
        }
        if (out && !out.ok) say(out.error);
        closePop();
      }
    );
  }
  function rowPop(btn) {
    const id = btn.dataset.row;
    const st = E.state();
    const r = rowOf(st, id);
    const i = st.rows.indexOf(r);
    openPop(
      btn,
      `<h4>${esc(r.label)}</h4>
       <div class="en-row"><input name="label" value="${esc(r.label)}" aria-label="Row name"/><button data-pop="rename">Rename</button></div>
       <div class="en-row"><button data-pop="left" ${i ? "" : "disabled"}>Move earlier</button><button data-pop="right" ${i < st.rows.length - 1 ? "" : "disabled"}>Move later</button></div>
       <div class="en-row"><button data-pop="after">Add a row after</button><button data-pop="remove">Remove this row</button></div>`,
      (act, el) => {
        let out = null;
        if (act === "rename") out = E.send({ type: "renameRow", row: id, label: el.querySelector("[name=label]").value });
        if (act === "left") out = E.send({ type: "moveRow", row: id, to: i - 1 });
        if (act === "right") out = E.send({ type: "moveRow", row: id, to: i + 1 });
        if (act === "after") out = E.send({ type: "addRow", at: i + 1 });
        if (act === "remove") out = E.send({ type: "removeRow", row: id });
        if (out && !out.ok) say(out.error);
        closePop();
      }
    );
  }
  function curiosityOptions(exclude) {
    const list = (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : window.CURIOSITIES || []).filter((c) => !(exclude || []).includes(c.id));
    return list.map((c) => `<option value="${esc(c.id)}">${esc(c.label)} · ${esc(c.group || "")}</option>`).join("");
  }
  function trackPop(btn) {
    const id = btn.dataset.track;
    const st = E.state();
    const t = trackOf(st, id);
    openPop(
      btn,
      `<h4>${esc(t.label)}</h4>
       <div class="en-row"><input name="label" value="${esc(t.label)}" aria-label="Track name"/><button data-pop="rename">Rename</button></div>
       <div class="en-row"><input name="cur" list="en-curs" placeholder="Find a curiosity" aria-label="Curiosity"/><datalist id="en-curs">${curiosityOptions(t.curiosities)}</datalist><button data-pop="add">Add lane</button></div>
       <div class="en-row"><button data-pop="remove">Remove this track</button></div>`,
      (act, el) => {
        let out = null;
        if (act === "rename") out = E.send({ type: "renameTrack", track: id, label: el.querySelector("[name=label]").value });
        if (act === "add") {
          const raw = el.querySelector("[name=cur]").value.trim();
          const list = typeof CURIOSITIES !== "undefined" ? CURIOSITIES : [];
          const hit = list.find((c) => c.id === raw) || list.find((c) => c.label.toLowerCase() === raw.toLowerCase()) || list.find((c) => (c.label + " · " + (c.group || "")).toLowerCase() === raw.toLowerCase());
          out = hit ? E.send({ type: "addCuriosity", track: id, curiosity: hit.id }) : { ok: false, error: "Pick a curiosity from the list." };
        }
        if (act === "remove") out = E.send({ type: "removeTrack", track: id });
        if (out && !out.ok) say(out.error);
        closePop();
      }
    );
  }
  function lanePop(btn) {
    const { track, cur } = btn.dataset;
    const st = E.state();
    const lane = st.lanes[E.laneKey(track, cur)];
    const leads = st.links.filter((l) => l.from.track === track && l.from.curiosity === cur).length;
    const follows = st.links.filter((l) => l.to.track === track && l.to.curiosity === cur).length;
    openPop(
      btn,
      `<h4>${esc(S.label(cur))} · ${esc((trackOf(st, track) || {}).label)}</h4>
       <div class="en-note">Leads ${leads} link${leads === 1 ? "" : "s"}, follows ${follows}.</div>
       ${lane ? `<div class="en-row"><button data-pop="mode">${lane.mode === "hold" ? "Ramp between points" : "Hold between points"}</button><button data-pop="onoff">${lane.on ? "Switch automation off" : "Switch automation on"}</button><button data-pop="clear">Clear the lane</button></div>` : `<div class="en-note">No automation yet: click a cell and choose Automation point.</div>`}
       <div class="en-row"><button data-pop="lead">Link from this lane</button><button data-pop="remove">Remove from the track</button></div>`,
      (act) => {
        let out = null;
        if (act === "mode") out = E.send({ type: "laneMode", track, curiosity: cur, mode: lane.mode === "hold" ? "ramp" : "hold" });
        if (act === "onoff") out = E.send({ type: "laneMode", track, curiosity: cur, on: !lane.on });
        if (act === "clear") out = E.send({ type: "clearLane", track, curiosity: cur });
        if (act === "remove") out = E.send({ type: "removeCuriosity", track, curiosity: cur });
        if (act === "lead") {
          closePop();
          draftLink({ track, curiosity: cur }, null);
          return;
        }
        if (out && !out.ok) say(out.error);
        closePop();
      }
    );
  }

  /* ---------- links ---------- */
  function draftLink(from, to) {
    linkDraft = { from: from || null, to: to || null };
    open("links");
    say(to ? "Two nodes picked: set the rule below and Add the link." : "Leader picked: now choose the follower below.");
  }
  function endSelect(st, name, e) {
    const opts = st.tracks.map((t) => `<optgroup label="${esc(t.label)}">${t.curiosities.map((c) => `<option value="${esc(t.id + "|" + c)}" ${e && e.track === t.id && e.curiosity === c ? "selected" : ""}>${esc(S.label(c))}</option>`).join("")}</optgroup>`).join("");
    return `<select name="${name}">${opts}</select>`;
  }
  function linksHtml() {
    const st = E.state();
    const res = E.result();
    const d = linkDraft || {};
    const rowsOpt = (sel) => `<option value="">whole film</option>` + st.rows.map((r) => `<option value="${esc(r.id)}" ${sel === r.id ? "selected" : ""}>${esc(r.label)}</option>`).join("");
    const firedBy = {};
    res.events.forEach((e) => (firedBy[e.link] = (firedBy[e.link] || 0) + 1));
    const list = st.links.length
      ? `<table class="en-list"><thead><tr><th>On</th><th>The link</th><th>Leader</th><th>Follower</th><th>Rule</th><th>Fired</th><th></th></tr></thead><tbody>${st.links
          .map(
            (l) => `<tr class="${l.on ? "" : "off"}"><td><input type="checkbox" data-act="link-on" data-link="${esc(l.id)}" ${l.on ? "checked" : ""} aria-label="Switch this link"/></td>
          <td>${esc(l.label || linkWords(st, l))}${l.label ? `<div class="en-note">${esc(linkWords(st, l))}${l.chance != null ? ", " + Math.round(l.chance * 100) + "% of the time" : ""}</div>` : ""}${l.seed ? `<div class="en-note">from ${esc(seedWords(st, l))}</div>` : ""}</td>
          <td>${esc(endName(st, l.from))}</td><td>${esc(endName(st, l.to))}</td>
          <td>${esc(l.does === "set" ? "becomes " + l.value : DOES[l.does])}<div class="en-row" style="display:flex;gap:4px;align-items:center;font-size:11px">amount <input type="range" min="0" max="100" value="${Math.round(l.amount * 100)}" data-act="link-amount" data-link="${esc(l.id)}" aria-label="Amount" style="width:80px"/> later <input type="number" min="0" max="16" value="${l.within}" data-act="link-within" data-link="${esc(l.id)}" style="width:44px" aria-label="Rows later"/></div></td>
          <td>${firedBy[l.id] || 0}</td><td><button class="en-small" data-act="link-remove" data-link="${esc(l.id)}">Remove</button></td></tr>`
          )
          .join("")}</tbody></table>`
      : `<p>No links yet.</p>`;
    const chains = E.chains().slice(0, 40);
    const chainHtml = chains.length
      ? chains
          .map(
            (c) =>
              `<div class="en-chain">${c
                .map((e, i) => {
                  const [t, cur] = e.to.split("|");
                  const r = rowOf(st, e.toRow);
                  return (i ? " → " : "<b>" + esc((rowOf(st, e.fromRow) || {}).label) + "</b>: ") + esc(S.label(cur) + " (" + ((trackOf(st, t) || {}).label || t) + ") " + short(e.before) + " → " + short(e.after) + (e.toRow !== e.fromRow ? " at " + (r ? r.label : "") : ""));
                })
                .join("")}</div>`
          )
          .join("")
      : `<p class="en-note">Nothing fired: no leader changed, or no links are on.</p>`;
    return `<p class="en-note">A link is a curiosity proximity: when the leader changes, the follower changes with it by a rule. Many links make a proximity suite, and a change runs through them as a chain reaction. Links are plain data: list them, switch them off, change them, undo them.</p>
      <div class="en-panel"><h3 style="margin:0">Add a link</h3>
      <div class="en-form" data-form="link">
        <label>Leader ${endSelect(st, "from", d.from)}</label>
        <label>When it <select name="change"><option value="any">changes</option><option value="rises">rises</option><option value="drops">drops</option><option value="is">is…</option></select></label>
        <label>Is <input name="is" placeholder="a value (optional)" style="width:9em"/></label>
        <label>Follower ${endSelect(st, "to", d.to)}</label>
        <label>Does <select name="does">${Object.keys(DOES).map((k) => `<option value="${k}">${esc(DOES[k])}</option>`).join("")}</select></label>
        <label>Value <input name="value" placeholder="for becomes" style="width:8em"/></label>
        <label>Amount <input name="amount" type="range" min="0" max="100" value="100"/></label>
        <label>Rows later <input name="within" type="number" min="0" max="16" value="0" style="width:4em"/></label>
        <label>Every <input name="every" type="number" min="0" max="64" value="0" style="width:4em" title="0: whenever the leader changes. 2: every second row."/></label>
        <label>From <select name="sfrom">${rowsOpt()}</select></label>
        <label>To <select name="sto">${rowsOpt()}</select></label>
        <label>Name <input name="label" placeholder="optional" style="width:12em"/></label>
        <button class="en-primary" data-act="link-add">Add the link</button>
      </div>
      <p><button data-act="seed-letter">Add the letter's links</button></p></div>
      ${proximitiesHtml(st)}
      <div class="en-panel" style="margin-top:12px"><h3 style="margin:0 0 6px">Your links (${st.links.length})</h3><div class="en-scroll">${list}</div></div>
      <div class="en-panel" style="margin-top:12px"><h3 style="margin:0 0 6px">What fired, as chains</h3>${chainHtml}</div>`;
  }
  function seedWords(st, l) {
    const suite = l.suite && st.suites.find((x) => x.id === l.suite);
    if (suite) return "the suite " + suite.label;
    if (l.seed.startsWith("letter")) return "the letter";
    return "the app's proximities";
  }
  /* The app's proximities and proximity suites (the curiosity database), added a suite at a time: there are
     more than a film holds, and a suite brings the lanes it needs. */
  let pack = null;
  function getPack() {
    if (!pack && window.CurioSeeds && window.CurioSeeds.dbPack) pack = window.CurioSeeds.dbPack();
    return pack;
  }
  function proximitiesHtml(st) {
    const p = getPack();
    const groups = p ? p.groups || (p.suites || []).map((x) => ({ id: x.id, label: x.label, links: x.members })) : [];
    const have = new Set(st.suites.map((x) => x.seed));
    const src = p && p.format === "curiosities-links" ? "db" : "app";
    const yours = st.suites.length
      ? `<table class="en-list" style="margin-bottom:8px"><thead><tr><th>On</th><th>Suite in your film</th><th>Links</th><th></th></tr></thead><tbody>${st.suites
          .map((x) => `<tr class="${x.on ? "" : "off"}"><td><input type="checkbox" data-act="suite-on" data-suite="${esc(x.id)}" ${x.on ? "checked" : ""} aria-label="Switch this suite"/></td><td>${esc(x.label)}</td><td>${st.links.filter((l) => l.suite === x.id).length}</td><td><button class="en-small" data-act="suite-remove" data-suite="${esc(x.id)}">Remove with its links</button></td></tr>`)
          .join("")}</tbody></table>`
      : "";
    const rows = groups
      .filter((g) => g && g.id && (g.links || []).length)
      .map((g) => `<tr><td>${esc(g.label || g.id)}${g.plain ? `<div class="en-note">${esc(String(g.plain).slice(0, 220))}</div>` : ""}</td><td>${(g.links || []).length}</td><td>${have.has(src + ":" + g.id) ? `<span class="en-note">in your film</span>` : `<button class="en-small" data-act="pack-group" data-group="${esc(g.id)}">Add</button>`}</td></tr>`)
      .join("");
    return `<div class="en-panel" style="margin-top:12px"><h3 style="margin:0 0 4px">The app's proximities</h3>
      <p class="en-note">${p ? p.links.length + " proximities from the curiosity database, in " + groups.length + " suites." : "The curiosity database is not loaded on this page."} A film holds ${E.LIMIT.links} links, so add a suite at a time: its links come in together, switch on and off together, and any lane they need is added to the right track.</p>
      ${yours}${p ? `<p><button data-act="pack-fit">Add every proximity that fits your tracks now</button></p>` : ""}
      ${rows ? `<div class="en-scroll" style="max-height:320px"><table class="en-list"><thead><tr><th>Proximity suite</th><th>Links</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}</div>`;
  }
  function importPack(only, addLanes) {
    const p = getPack();
    if (!p) return { ok: false, error: "The curiosity database is not loaded on this page." };
    const out = E.send({ type: "importLinks", label: "Add the app's proximities", pack: p, only, addLanes });
    if (out.ok) say((out.added || 0) + " links added" + (out.updated ? ", " + out.updated + " brought up to date" : "") + (out.lanesAdded ? ", " + out.lanesAdded + " lanes added for them" : "") + (out.waiting ? ". " + out.waiting + " wait for curiosities your tracks do not have" : "") + ".");
    return out;
  }
  function addLinkFromForm(form) {
    const f = (n) => form.querySelector(`[name=${n}]`);
    const [ft, fc] = f("from").value.split("|");
    const [tt, tc] = f("to").value.split("|");
    const from = { track: ft, curiosity: fc };
    if (f("change").value === "is") {
      if (!f("is").value.trim()) return say("Say what value the leader is, or pick changes.");
      from.is = S.fix(fc, f("is").value.trim());
      if (from.is == null) return say("That value does not fit " + S.label(fc) + ".");
    } else from.change = f("change").value;
    const msg = { type: "addLink", from, to: { track: tt, curiosity: tc }, does: f("does").value, amount: Number(f("amount").value) / 100, within: Number(f("within").value) || 0, every: Number(f("every").value) || 0, label: f("label").value.trim() };
    if (msg.does === "set") msg.value = S.fix(tc, f("value").value.trim());
    if (f("sfrom").value && f("sto").value) msg.scope = { from: f("sfrom").value, to: f("sto").value };
    const out = E.send(msg);
    if (!out.ok) return say(out.error);
    linkDraft = null;
    say("Link added.");
  }

  /* ---------- analyze ---------- */
  function analyzeHtml() {
    const st = E.state();
    const A = window.CurioAnalyze;
    const preview = analysis
      ? `<div class="en-panel" style="margin-top:12px"><h3 style="margin:0">${esc(analysis.name)}</h3><p class="en-note">${esc(analysis.notes || "")}. Only these values are kept; the text is not.</p>
        <div class="en-scroll"><table class="en-list"><thead><tr><th>Row</th>${Object.keys(analysis.lanes).map((c) => `<th>${esc(S.label(c))}</th>`).join("")}</tr></thead><tbody>${analysis.rows
          .slice(0, 30)
          .map((r, i) => `<tr><td>${esc(r)}</td>${Object.keys(analysis.lanes).map((c) => `<td>${esc(short(analysis.lanes[c][i]))}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>
        <p><button class="en-primary" data-act="ref-keep">Keep it as a reference</button></p></div>`
      : "";
    const refs = st.refs.length
      ? st.refs
          .map(
            (r) => `<div class="en-panel" style="margin-top:10px"><b>${esc(r.name)}</b> <span class="en-note">${esc(r.kind)}, ${r.rows.length} rows</span> <button class="en-small" data-act="ref-remove" data-ref="${esc(r.id)}">Remove</button>
          <div class="en-form" data-form="carry" data-ref="${esc(r.id)}">
            <label>Carry <select name="cur">${Object.keys(r.lanes).map((c) => `<option value="${esc(c)}">${esc(S.label(c))}</option>`).join("")}</select></label>
            <label>Onto track <select name="track">${st.tracks.map((t) => `<option value="${esc(t.id)}">${esc(t.label)}</option>`).join("")}</select></label>
            <label>As <select name="onto"><option value="">the same curiosity</option>${curiosityOptions([])}</select></label>
            <button data-act="carry">Carry it</button>
          </div></div>`
          )
          .join("")
      : `<p class="en-note">No references kept yet.</p>`;
    return `<p class="en-note">Pull curiosities out of a work you love, then carry one onto your own film. Paste a screenplay (scene headings like INT. KITCHEN - NIGHT, names in capitals over their lines) or a shot list (one shot per line, with a heading row such as Shot, Size, Angle, Movement, Duration). The engine reads it once and keeps only the values: how charged each scene is, how loud, how much is said and done, how often the speaker changes, the shot sizes and moves.</p>
      <div class="en-two"><div class="en-panel">
        <label class="en-note" style="display:block">Name <input data-field="ref-name" value="A reference" style="width:16em"/></label>
        <textarea data-field="ref-text" placeholder="Paste a script or a shot list here" aria-label="Script or shot list"></textarea>
        <p><button class="en-primary" data-act="analyze">Analyze</button> <button data-act="analyze-scenes" ${A && (typeof SCENES !== "undefined") ? "" : "disabled"}>Use the app's reference scenes</button></p>
      </div><div class="en-panel"><h3 style="margin:0">Kept references</h3>${refs}</div></div>${preview}`;
  }

  /* ---------- history ---------- */
  function historyHtml() {
    const h = E.history();
    const chk = E.lastCheck();
    const ho = getHost();
    const app = window.CurioAppUndo;
    const appSteps = app ? app.steps() : [];
    return `<div class="en-two"><div class="en-panel"><h3 style="margin:0 0 6px">This film's undo</h3>
        <p class="en-note">Every change is one step: values, pins, lanes, links, rows, tracks, references. Ctrl+Z and Ctrl+Shift+Z work in this window.</p>
        <ol>${h.undo.map((l) => `<li>${esc(l)}</li>`).join("") || "<li class='en-note'>Nothing yet.</li>"}</ol>
        ${h.redo.length ? `<p class="en-note">Can redo: ${h.redo.map(esc).join(", ")}</p>` : ""}
      </div><div class="en-panel"><h3 style="margin:0 0 6px">Saving check</h3>
        <p>${chk.ok ? "Saved and read back: identical." : "Warning: " + esc(chk.note || "the film did not come back the same.")}</p>
        <p class="en-note">Fingerprint ${esc(chk.saved || E.fingerprint())}${chk.loaded && chk.loaded !== chk.saved ? ", read back as " + esc(chk.loaded) : ""}. The film is saved in this browser under ${esc(E.KEY)} and goes into your project file with everything else.</p>
        <p><button data-act="check">Check now</button> <button data-act="selfcheck" title="Forty test changes, undone; then everything is compared with how it was">Run the self-check</button></p>
        ${selfResult ? `<ul>${selfResult.lines.map((l) => `<li>${l.ok ? "✓" : "✗"} ${esc(l.text)}</li>`).join("")}</ul>` : ""}
        <h3 style="margin:10px 0 6px">My film</h3>
        <p class="en-note">${ho ? ho.calls() + " calls to My film so far" : "No My film on this page"}${lastPrint && lastPrint.printed ? ". Last send: " + esc(lastPrint.printed.map(S.label).join(", ")) : ""}${lastPrint && lastPrint.notPrinted && lastPrint.notPrinted.length ? ". My film has no place for: " + esc(lastPrint.notPrinted.map(S.label).join(", ")) + " (they stay in the engine)" : ""}.</p>
      </div></div>
      <div class="en-panel" style="margin-top:12px"><h3 style="margin:0 0 6px">Everything else in the app</h3>
        <p class="en-note">Changes made anywhere else (My film, workspaces, the storyboard, curated films, automations, tools), newest first. Undoing one puts back what was there before it and reloads the page, because those parts each keep their own copy while open.</p>
        ${storeHtml()}
        ${app ? (appSteps.length ? `<ol>${appSteps.map((s, i) => `<li>${esc(s.label)} <span class="en-note">${esc(s.when)}</span> <button class="en-small" data-act="app-undo" data-i="${i}">Undo back to before this</button></li>`).join("")}</ol>` : `<p class="en-note">No changes recorded since this page opened.</p>`) + (app.canRedo() ? `<p><button data-act="app-redo">Redo the last app undo</button></p>` : "") : `<p class="en-note">Not available on this page.</p>`}
      </div>`;
  }

  /* Parts of the app already on the shared store (engine/store.js) undo in place, no reload. */
  function storeHtml() {
    const C = window.CurioStore;
    if (!C || !C.parts().length) return "";
    const h = C.history();
    return `<p class="en-note">On the shared state now: ${esc(C.parts().join(", "))}. Their changes undo in place (Ctrl+Z outside this window).</p>
      <p><button data-act="store-undo" ${C.canUndo() ? "" : "disabled"}>Undo ${esc(h.undo[h.undo.length - 1] || "")}</button> <button data-act="store-redo" ${C.canRedo() ? "" : "disabled"}>Redo ${esc(h.redo[0] || "")}</button></p>`;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const tb = e.target.closest("[data-tab]");
    if (tb && root.contains(tb) && tb.closest(".en-tabs")) return open(tb.dataset.tab);
    const b = e.target.closest("[data-act]");
    if (!b || !root.contains(b)) return;
    const act = b.dataset.act;
    let out = null;
    switch (act) {
      case "close":
        return close();
      case "undo":
        return E.undo();
      case "redo":
        return E.redo();
      case "print":
        return print();
      case "unprint": {
        const h = getHost();
        return say(h && h.unprint() === true ? "My film is back to what it showed before." : "The engine had not sent anything to My film.");
      }
      case "start-board":
        return startFilm("board");
      case "start-new":
        return startFilm("new");
      case "add-row":
        out = E.send({ type: "addRow" });
        break;
      case "add-track": {
        const name = prompt("Name of the new track (a character, a prop, the sound…)", "New track");
        if (name == null) return;
        out = E.send({ type: "addTrack", label: name, kind: "character", curiosities: window.CurioTracks.TEMPLATE[2].curiosities });
        break;
      }
      case "cell":
        return cellPop(b);
      case "row":
        return rowPop(b);
      case "track":
        return trackPop(b);
      case "lane":
        return lanePop(b);
      case "link-add":
        return addLinkFromForm(b.closest("[data-form]"));
      case "link-remove":
        out = E.send({ type: "removeLink", link: b.dataset.link });
        break;
      case "seed-letter": {
        const cmds = window.CurioSeeds.letterLinks(E.state());
        out = cmds.length ? E.send({ type: "batch", label: "Add the letter's links", commands: cmds }) : { ok: false, error: "None of the letter's links fit your tracks." };
        break;
      }
      case "pack-fit":
        out = importPack(null, false);
        break;
      case "pack-group":
        out = importPack([b.dataset.group], true);
        break;
      case "suite-remove":
        out = E.send({ type: "removeSuite", suite: b.dataset.suite, links: true });
        break;
      case "win-prev":
      case "win-next": {
        let n = 8;
        try {
          n = Math.max(1, Number(window.CuriosityBoard ? window.CuriosityBoard.count() : 8) || 8);
        } catch (e) {}
        const from = E.state().print.from + (act === "win-next" ? n : -n);
        out = E.send({ type: "printFrom", label: "Show other moments on My film", from: Math.max(0, from) });
        if (out.ok) print();
        break;
      }
      case "sb-print": {
        const sb = getStoryboard();
        const r = sb && sb.print(E.state(), E.result());
        return afterStoryboard(r, r && !r.error ? "Sent " + r.panels + " moments to the storyboard as " + r.scenes + " scene" + (r.scenes === 1 ? "" : "s") + "." : "");
      }
      case "sb-unprint": {
        const sb = getStoryboard();
        const r = sb && sb.unprint();
        if (r === false) return say("The storyboard has no scenes from the engine.");
        return afterStoryboard(r, "Removed the engine's scenes from the storyboard.");
      }
      case "sb-read": {
        const sb = getStoryboard();
        const v = root.querySelector("[data-field=sb-scene]").value;
        const film = sb && sb.read(v === "all" ? null : [Number(v)]);
        if (!film || film.error || !film.rows.length) return say((film && film.error) || "That scene has no panels.");
        out = E.send({ type: "batch", label: "Read the storyboard", commands: [{ type: "importFilm", film }] });
        if (out.ok) {
          const links = window.CurioSeeds.letterLinks(E.state());
          if (links.length && !E.state().links.length) E.send({ type: "batch", label: "Add the letter's links", commands: links });
          say("Read " + film.rows.length + " storyboard panels as moments.");
        }
        break;
      }
      case "analyze": {
        const text = root.querySelector("[data-field=ref-text]").value;
        const name = root.querySelector("[data-field=ref-name]").value;
        const A = window.CurioAnalyze;
        analysis = A.detect(text) === "shotList" ? A.shotList(text, name) : A.script(text, name);
        root.querySelector("[data-field=ref-text]").value = "";
        if (!analysis.rows.length || !Object.keys(analysis.lanes).length) {
          analysis = null;
          say("Nothing to read there: paste a screenplay or a shot list.");
        } else say("Read " + analysis.rows.length + " rows. The text was not kept.");
        return draw();
      }
      case "analyze-scenes":
        analysis = window.CurioAnalyze.scenes(typeof SCENES !== "undefined" ? SCENES : []);
        return draw();
      case "ref-keep":
        out = E.send({ type: "addRef", ref: analysis });
        if (out.ok) analysis = null;
        break;
      case "ref-remove":
        out = E.send({ type: "removeRef", ref: b.dataset.ref });
        break;
      case "carry": {
        const f = b.closest("[data-form]");
        const msg = { type: "carry", ref: f.dataset.ref, curiosity: f.querySelector("[name=cur]").value, track: f.querySelector("[name=track]").value };
        const onto = f.querySelector("[name=onto]").value;
        if (onto) msg.onto = onto;
        out = E.send(msg);
        if (out.ok) say("Carried. It is an automation lane now: see the Timeline.");
        break;
      }
      case "check": {
        const c = E.check();
        say(c.ok ? "Checked: the film comes back from saving exactly as it is." : "The check failed: " + (c.note || "something would change on reload."));
        return draw();
      }
      case "selfcheck":
        selfResult = window.CurioSelfCheck ? window.CurioSelfCheck.run() : { ok: false, lines: [{ ok: false, text: "The self-check is not loaded on this page." }] };
        say(selfResult.ok ? "Self-check passed." : "Self-check found a problem: see History.");
        return draw();
      case "app-undo":
        return window.CurioAppUndo && window.CurioAppUndo.undoTo(Number(b.dataset.i));
      case "store-undo":
        window.CurioStore && window.CurioStore.undo();
        return draw();
      case "store-redo":
        window.CurioStore && window.CurioStore.redo();
        return draw();
      case "app-redo":
        return window.CurioAppUndo && window.CurioAppUndo.redo();
    }
    if (out && !out.ok) say(out.error);
  }
  function onChange(e) {
    const t = e.target;
    const act = t.dataset && t.dataset.act;
    let out = null;
    if (act === "name") out = E.send({ type: "rename", name: t.value });
    else if (act === "auto") out = E.send({ type: "printAuto", on: t.checked });
    else if (act === "suite-on") out = E.send({ type: "toggleSuite", suite: t.dataset.suite, on: t.checked });
    else if (act === "link-on") out = E.send({ type: "toggleLink", link: t.dataset.link, on: t.checked });
    else if (act === "link-amount") out = E.send({ type: "updateLink", link: t.dataset.link, changes: { amount: Number(t.value) / 100 } });
    else if (act === "link-within") out = E.send({ type: "updateLink", link: t.dataset.link, changes: { within: Number(t.value) } });
    if (out && !out.ok) say(out.error);
  }
  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === "Escape") {
      if (pop) return closePop();
      if (root.classList.contains("en-overlay")) return close();
    }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "");
    if (typing || !(e.ctrlKey || e.metaKey)) return;
    if (e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      E.undo();
    } else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
      e.preventDefault();
      E.redo();
    }
  }

  function open(t) {
    if (t && TABS.some(([id]) => id === t)) tab = t;
    try {
      localStorage.setItem("curiosities-engine-view-v1", tab);
    } catch (e) {}
    if (!root) {
      root = document.createElement("div");
      root.className = "en-overlay en-root";
      document.body.appendChild(root);
      wire(root);
    }
    root.hidden = false;
    document.documentElement.style.overflow = "hidden";
    draw();
  }
  function close() {
    closePop();
    if (window.CurioCube && window.CurioCube.unmount) window.CurioCube.unmount();
    if (root && root.classList.contains("en-overlay")) {
      root.hidden = true;
      document.documentElement.style.overflow = "";
    }
  }
  function wire(el) {
    el.addEventListener("click", onClick);
    el.addEventListener("change", onChange);
  }
  /* On its own page: draw into an element instead of an overlay. */
  function mount(el) {
    root = el;
    el.classList.add("en-root");
    wire(el);
    draw();
  }

  E.on(({ state, label }) => {
    if (state.print.auto && label !== "Load") print();
    if (root && !root.hidden && tab !== "cube") draw();
    else if (root && !root.hidden && tab === "cube") {
      const head = root.querySelector(".en-head");
      if (head) {
        const u = root.querySelector("[data-act=undo]");
        const r = root.querySelector("[data-act=redo]");
        if (u) u.disabled = !E.canUndo();
        if (r) r.disabled = !E.canRedo();
      }
    }
  });
  document.addEventListener("keydown", onKey);
  document.addEventListener("click", (e) => {
    if (pop && !pop.contains(e.target) && !e.target.closest("[data-act=cell],[data-act=row],[data-act=track],[data-act=lane]")) closePop();
  });

  /* The Library menu gets an Engine item. It has no data-tab, so the app's own tab switching ignores it. */
  function addMenuItem() {
    const menu = document.getElementById("lib-menu");
    if (!menu || menu.querySelector("[data-engine]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.engine = "1";
    b.innerHTML = "Engine<small>timeline, links, cube, analysis, undo</small>";
    b.addEventListener("click", () => {
      menu.hidden = true;
      const lib = document.getElementById("lib-btn");
      if (lib) lib.setAttribute("aria-expanded", "false");
      open();
    });
    menu.appendChild(b);
  }

  E.load();
  addMenuItem();
  if (window.CurioHost && window.CurioHost.extendBridge) window.CurioHost.extendBridge();
  try {
    const again = sessionStorage.getItem(REOPEN);
    if (again) {
      sessionStorage.removeItem(REOPEN);
      setTimeout(() => open(again), 0);
    }
  } catch (e) {}
  window.CurioEngineUI = { open, close, mount, host: getHost, draw, say, addBand };
})();
