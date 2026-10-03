/* screen/ui.js: the Screen, Curiomatic's main layout. First modeled on Final Cut Pro (Jeremy, 2026-10-02 17:18Z
   to 17:24Z), now laid out and dark like CapCut (18:00Z: "I'm leaning towards mainly using CapCut... I think their
   user interface is great"). His words are in /mnt/project-files/decisions/jeremys-words.md, the choices in
   layout-thread.md.

   CapCut's four panels, with curiosities in them:
   - Top left, the library: the categories as a row of icon tabs (CapCut's Media, Audio, Text, Effects,
     Transitions, Filters...), a sidebar of groups (the category's workspaces, then its suites, proximities and
     proximity suites), and a grid of cards. Click a card to look through it; its + puts it on the timeline.
   - Center, the Player: the viewers, timecode and play controls, the window layout.
   - Right, Details: the inspector for the selected category and viewer.
   - Bottom, full width, the timeline.

   - Viewers on top: one or more inspiration films (curated films, as cheap animated storyboards) and one
     viewer for your own film. Add as many inspiration viewers as you like; it starts with one. Side by side
     or stacked.
   - The inspector on the right, like Final Cut Pro's: it shows the picked viewer, grouped by the major
     filmmaking categories (screen/levels.js), main curiosities first, the fine ones folded inside. For your
     film every control writes a node at the playhead; for an inspiration film each curiosity can be taken
     into a blend with an amount.
   - "Looking through": pick a curiosity, a suite, a proximity or a proximity suite; every viewer lights up
     what it is about (Highlight), writes its values on the picture (Overlay), or draws only it (Lens only),
     and the scrub bars mark where it happens.
   - Below the viewers, the timeline: film clip tracks on top, then curiosity lanes left to right with nodes
     and lines (screen/lanes.js). Join a node to a node in another lane to make a proximity; copy and paste
     it into another scene.
   - Arrange: the timeline on its own (viewers hidden unless you want them), every automated curiosity as
     a lane, a curiosity dropdown on each lane, Show all potential curiosities, Show all potential suites.

   window.CurioScreen = { open(), close(), isOpen(), mountViewer(el, opts), state(), setRow(i), row(),
     addPanel({ id, label, place, mount(el) }), on(fn) -> off() }
   mountViewer lets any other screen of the app put a viewer at its top (Jeremy 17:20Z: "a view window for
   every single screen of the app"). Saved view: localStorage "curiosities-screen-v1". */
(function () {
  const KEY = "curiosities-screen-v1";
  const L = () => window.CurioLevels;
  const F = () => window.CurioFrame;
  const E = () => window.CurioEngine;
  const S = () => window.CurioScale;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MAIN_SHOWN = 5;

  const DEFAULTS = {
    open: true,
    view: "screen",
    arrange: "side",
    insp: [{ id: "v1", film: "", takes: {} }],
    sel: { level: "curiosity", id: "shotSize" },
    lens: "highlight",
    focus: "mine",
    cat: "camera",
    folds: {},
    showFine: {},
    speed: 1,
    viewersInArrange: false,
    lanes: [],
    showAll: false,
    showSuites: false,
    openSuites: {},
    openCats: {},
    groups: {},
    search: "",
    layout: "center",
    playerZoom: 1,
    libTab: "",
    ghost: false,
    overview: true,
    range: null,
    guides: [],
    rulers: false,
  };
  /* CapCut's layout menu (the layout icon at the top right of its window). Jeremy's screenshots show four
     arrangements: the default, the media panel full height on the left, Details full height on the right, and
     the Player full height on the right. */
  const LAYOUTS = [
    ["center", "Player in the middle", "Library, Player and Details across the top, the timeline under them (CapCut's default)"],
    ["media", "Library full height", "The library runs down the whole left side; Player and Details on the right, the timeline under them"],
    ["details", "Details full height", "Details runs down the whole right side; library and Player on the left, the timeline under them"],
    ["right", "Player on the right", "Library and Details side by side over the timeline, the Player as a tall column on the right"],
  ];
  /* CapCut's keyboard shortcuts (its Shortcut window: Timeline, Player, Basic and Other tabs, plus the toolbar's
     tooltips), each mapped to the nearest thing on the Screen. [keys, CapCut's name, what it does here, test(e), run(e)].
     A row without test/run is a CapCut key with nothing to do on the Screen yet, listed so nothing is hidden. */
  const mod = (e) => e.ctrlKey || e.metaKey;
  const plain = (e) => !mod(e) && !e.altKey;
  const key = (e, k) => e.key.toLowerCase() === k;
  const lk = (name) => () => lanes && lanes.command(name);
  const SHORTCUTS = [
    ["Timeline", [
      ["⌘B", "Split", "Cut the picked lane's line at the playhead with a node, keeping what plays", (e) => mod(e) && !e.shiftKey && key(e, "b"), lk("splitHere")],
      ["⇧⌘B", "Split all", "Cut every lane on the timeline at the playhead", (e) => mod(e) && e.shiftKey && key(e, "b"), lk("splitAll")],
      ["A", "Select mode", "Click a node to pick it, click an empty spot to add one", (e) => plain(e) && !e.shiftKey && key(e, "a"), lk("select")],
      ["B", "Split mode", "Click a lane to cut its line with a node", (e) => plain(e) && !e.shiftKey && key(e, "b"), lk("split")],
      ["[", "Select leftward", "Pick the node to the left (CapCut picks every clip to the left)", (e) => plain(e) && e.key === "[", lk("left")],
      ["]", "Select rightward", "Pick the node to the right", (e) => plain(e) && e.key === "]", lk("right")],
      ["P", "Main track magnet", "Moving a node moves every later node in its lane too", (e) => plain(e) && key(e, "p"), lk("magnet")],
      ["N", "Auto snapping", "A node dropped next to a marker lands on it", (e) => plain(e) && key(e, "n"), lk("snap")],
      ["~", "Linkage switch", "Joined nodes move and copy together (on) or alone (off)", (e) => plain(e) && (e.key === "~" || e.key === "`"), lk("linkage")],
      ["S", "Preview axis switch", "Hover over the timeline to see that moment in the player", (e) => plain(e) && !e.shiftKey && key(e, "s"), lk("skim")],
      ["M", "Add marker", "Put a marker on the playhead's moment (again to take it off)", (e) => plain(e) && key(e, "m"), lk("marker")],
      ["⌘+", "Zoom in", "Wider moments on the timeline", (e) => mod(e) && !e.altKey && (e.key === "=" || e.key === "+"), lk("zoomIn")],
      ["⌘−", "Zoom out", "Narrower moments on the timeline", (e) => mod(e) && !e.altKey && (e.key === "-" || e.key === "_"), lk("zoomOut")],
      ["⇧Z", "Zoom to fit timeline", "The whole film fits the timeline", (e) => plain(e) && e.shiftKey && key(e, "z"), lk("zoomFit")],
      ["J", "Shuttle left", "Play backward; press again to go faster", (e) => plain(e) && key(e, "j"), () => shuttle(-1)],
      ["K", "Shuttle stop", "Stop playing", (e) => plain(e) && key(e, "k"), () => play(false)],
      ["L", "Shuttle right", "Play forward; press again to go faster", (e) => plain(e) && key(e, "l"), () => shuttle(1)],
      ["Q", "Delete left", "Remove the picked lane's nodes before the playhead", (e) => plain(e) && key(e, "q"), lk("deleteLeft")],
      ["W", "Delete right", "Remove the picked lane's nodes after the playhead", (e) => plain(e) && key(e, "w"), lk("deleteRight")],
      ["⇧⌥K", "Add keyframe", "Add a node at the playhead on the picked lane (a node is a keyframe)", (e) => e.altKey && e.shiftKey && !mod(e) && e.code === "KeyK", lk("splitHere")],
      ["⇧↩ or I", "In", "Start the play range at the playhead, so Play loops over a part (Maya's playback range)", (e) => !mod(e) && ((e.shiftKey && e.key === "Enter") || (plain(e) && !e.shiftKey && key(e, "i"))), () => setRange("in")],
      ["O", "Out", "End the play range at the playhead (not in CapCut's list; most editors use it)", (e) => plain(e) && !e.shiftKey && key(e, "o"), () => setRange("out")],
      ["⌥X", "Clear the range", "Play the whole film again", (e) => e.altKey && !mod(e) && e.code === "KeyX", () => setRange(null)],
      ["G", "Ghosts", "See the moments before and after faintly (Maya's ghosting); not in CapCut", (e) => plain(e) && !e.shiftKey && key(e, "g"), () => ((prefs.ghost = !prefs.ghost), save(), drawViewers())],
      ["⌥K", "Show/hide keyframe panel", "Nothing yet: the timeline's lanes are always the keyframe panel"],
    ]],
    ["Player", [
      ["Space", "Play/Pause", "Play the film from the playhead", (e) => plain(e) && e.key === " ", () => play(!timer)],
      ["← →", "Back or forward", "One moment back or forward", (e) => plain(e) && (e.key === "ArrowLeft" || e.key === "ArrowRight"), (e) => setRow(row + (e.key === "ArrowRight" ? 1 : -1))],
      ["⇧⌘F", "Enter/Exit full screen", "The Player fills the window (Esc to leave)", (e) => mod(e) && e.shiftKey && key(e, "f"), () => fullPlayer(!page.dataset.fullplayer)],
      ["⌥⇧+", "Zoom in player", "Bigger frames in the Player", (e) => e.altKey && e.shiftKey && (e.code === "Equal" || e.code === "NumpadAdd"), () => zoomPlayer(1.25)],
      ["⌥⇧−", "Zoom out player", "Smaller frames in the Player", (e) => e.altKey && e.shiftKey && (e.code === "Minus" || e.code === "NumpadSubtract"), () => zoomPlayer(0.8)],
      ["⌥⇧Z", "Zoom to fit player", "Frames fit the Player again", (e) => e.altKey && e.shiftKey && e.code === "KeyZ", () => zoomPlayer(0)],
      ["⌘⌥R", "Show/hide rulers", "Rulers along the frames' edges", (e) => mod(e) && e.altKey && e.code === "KeyR", () => toggleView("rulers")],
      ["⌘;", "Show/hide guides", "The thirds guide over your film (Guides ▾ in the Player has more)", (e) => mod(e) && !e.altKey && e.key === ";", () => (setGuide("thirds", !guidesOn().includes("thirds")), drawViewers())],
      ["Long press ⌘", "Cancel player alignment", "Nothing yet (CapCut lets you place a clip freely while ⌘ is held)"],
    ]],
    ["Basic", [
      ["⌘C", "Copy", "Copy the picked node with every node joined to it", (e) => mod(e) && !e.shiftKey && !e.altKey && key(e, "c"), lk("copy")],
      ["⌘X", "Cut", "Copy it, then take it out", (e) => mod(e) && !e.shiftKey && !e.altKey && key(e, "x"), lk("cut")],
      ["⌘V", "Paste", "Paste it at the playhead's moment", (e) => mod(e) && !e.shiftKey && !e.altKey && key(e, "v"), lk("paste")],
      ["⇧⌘C", "Copy attributes", "Copy the picked node's setting", (e) => mod(e) && e.shiftKey && key(e, "c"), lk("copyLook")],
      ["⇧⌘V", "Paste attributes", "Give that setting to another node of the same curiosity", (e) => mod(e) && e.shiftKey && key(e, "v"), lk("pasteLook")],
      ["⌫", "Delete", "Remove the picked node", (e) => plain(e) && (e.key === "Backspace" || e.key === "Delete"), lk("delete")],
      ["⌘Z", "Undo", "Undo the last change to your film", (e) => mod(e) && !e.shiftKey && key(e, "z"), () => undoAll("undo")],
      ["⇧⌘Z", "Reset (redo)", "Redo what you undid", (e) => mod(e) && e.shiftKey && key(e, "z"), () => undoAll("redo")],
      ["?", "Shortcuts", "Show or hide this list", (e) => !mod(e) && e.key === "?", () => showKeys(!keysOpen)],
      ["esc", "Exit full screen", "Leave the full-screen Player, or close this list", null, null],
      ["⌘I, ⌘E, ⌘N", "Import, Export, New project", "In the app's Library menu (Open, Print, New project); the browser keeps these keys"],
      ["⇥", "Switch material panel", "Tab moves between buttons, as on any web page; click the icon row instead"],
      ["⌘Q, ⌘⌥Q, ⌘^F", "Quit, Back to edit, Full screen", "Handled by the browser or the desktop app"],
    ]],
    ["Other", [["⌥ drag", "Resize the text box from the center", "Nothing yet: there are no text boxes on the Screen"]]],
  ];
  /* J and L: each press goes one step faster in that direction, like CapCut's shuttle. */
  let playDir = 1;
  let playRate = 1;
  function shuttle(dir) {
    if (timer && playDir === dir) playRate = Math.min(8, playRate * 2);
    else playRate = 1;
    playDir = dir;
    play(true);
  }
  function fullPlayer(on) {
    if (on) page.dataset.fullplayer = "1";
    else delete page.dataset.fullplayer;
  }
  function zoomPlayer(f) {
    prefs.playerZoom = f ? Math.max(0.5, Math.min(3, (Number(prefs.playerZoom) || 1) * f)) : 1;
    save();
    page.style.setProperty("--sc-pz", String(prefs.playerZoom));
  }
  function toggleView(k) {
    prefs[k] = !prefs[k];
    save();
    page.dataset[k] = prefs[k] ? "1" : "";
  }
  let keysOpen = false;
  function showKeys(on) {
    keysOpen = !!on;
    let box = page.querySelector(".sc-keys");
    if (!keysOpen) return box && box.remove();
    if (!box) {
      box = document.createElement("div");
      box.className = "sc-keys";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-label", "Keyboard shortcuts");
      page.appendChild(box);
    }
    box.innerHTML = `<div class="sc-keys-in"><header><strong>Keyboard shortcuts</strong><span class="sc-k">CapCut's keys, doing the nearest thing for curiosity nodes. ⌘ is Ctrl on Windows; faded rows have nothing to do here yet.</span><button type="button" data-act="keys-close" aria-label="Close">×</button></header>${SHORTCUTS.map(
      ([h, rows]) => `<section><h3>${esc(h)}</h3>${rows.map(([k, name, what, test]) => `<p${test === undefined ? ' class="sc-key-none"' : ""}><kbd>${esc(k)}</kbd><b>${esc(name)}</b><span>${esc(what)}</span></p>`).join("")}</section>`
    ).join("")}</div>`;
  }
  let prefs = load();
  function load() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY));
      if (p && typeof p === "object") return Object.assign({}, JSON.parse(JSON.stringify(DEFAULTS)), p);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  /* ---------- films ---------- */
  function films() {
    let list = [];
    try {
      if (window.CuriosityStudy && window.CuriosityStudy.studies) list = window.CuriosityStudy.studies();
    } catch (e) {
      list = [];
    }
    if (!list.length && window.CuriosityDB && window.CuriosityDB.data) list = window.CuriosityDB.data.scenes || [];
    return list.filter((s) => s && Array.isArray(s.beats) && s.beats.length);
  }
  function film(id) {
    const list = films();
    return list.find((f) => f.id === id) || list[0] || null;
  }
  const filmTitle = (f) => (f ? String(f.title || f.name || f.id).replace(/^Model scene: /, "") : "No film");

  /* My film, from the engine: each moment flattened to { curiosity: value } (Master, then Camera, then the
     first character, so the frame has one value per curiosity), plus how many character tracks there are. */
  function ensureFilm() {
    const Eng = E();
    if (!Eng) return false;
    if (Eng.state().rows.length) return true;
    if (!window.CurioSeeds) return false;
    const r = Eng.send({ type: "batch", label: "Start a new film", commands: [{ type: "importFilm", film: window.CurioSeeds.starter() }] });
    if (r.ok) {
      const links = window.CurioSeeds.letterLinks(Eng.state());
      if (links.length) Eng.send({ type: "batch", label: "Add the letter's links", commands: links });
    }
    return Eng.state().rows.length > 0;
  }
  function mineBeats() {
    const Eng = E();
    if (!Eng) return [];
    const st = Eng.state();
    const order = st.tracks.slice().sort((a, b) => rank(a) - rank(b));
    return st.rows.map((r) => {
      const values = {};
      order.forEach((t) => t.curiosities.forEach((c) => values[c] == null && (values[c] = Eng.value(r.id, t.id, c))));
      /* "transitionKind.setting" is the curiosity's own value, so the frame reads it as transitionKind. */
      Object.keys(values).forEach((k) => /\.setting$/.test(k) && values[L().base(k)] == null && (values[L().base(k)] = values[k]));
      return { at: null, note: r.label, values, row: r.id };
    });
  }
  const rank = (t) => ({ master: 0, camera: 1, character: 2 })[t.kind] ?? 3;
  const castOf = () => (E() ? Math.max(1, E().state().tracks.filter((t) => t.kind === "character").length) : 2);

  /* ---------- the playhead: My film's moment; inspiration films follow it proportionally ---------- */
  let row = 0;
  let timer = null;
  const nRows = () => (E() ? E().state().rows.length : 1);
  const beatFor = (f) => (f && f.beats.length > 1 && nRows() > 1 ? Math.round((row * (f.beats.length - 1)) / (nRows() - 1)) : 0);
  function setRow(j) {
    row = Math.max(0, Math.min(nRows() - 1, j | 0));
    drawViewers();
    drawInspector();
    if (lanes) lanes.draw();
    tell();
  }
  /* The play range (Maya's playback range; CapCut's In point): [from, to] moments, or null for the whole film. */
  function rangeNow() {
    const r = prefs.range;
    if (!r || !Array.isArray(r)) return null;
    const n = nRows();
    const a = Math.max(0, Math.min(n - 1, r[0] | 0));
    const b = Math.max(0, Math.min(n - 1, r[1] | 0));
    return a < b ? [a, b] : null;
  }
  function setRange(end) {
    const cur = rangeNow() || [0, nRows() - 1];
    prefs.range = end === "in" ? [row, Math.max(row + 1, cur[1])] : end === "out" ? [Math.min(cur[0], row - 1), row] : null;
    if (prefs.range && prefs.range[0] < 0) prefs.range[0] = 0;
    save();
    drawViewers();
    if (lanes) lanes.draw();
    toast(rangeNow() ? `Play loops over moments ${rangeNow()[0] + 1} to ${rangeNow()[1] + 1}.` : "Play runs over the whole film.");
  }
  function play(on) {
    if (timer) clearInterval(timer);
    timer = null;
    if (!on) (playDir = 1), (playRate = 1);
    if (on) {
      const rg = rangeNow();
      if (rg && (row < rg[0] || row > rg[1])) setRow(playDir < 0 ? rg[1] : rg[0]);
    }
    if (on)
      timer = setInterval(() => {
        const [a, b] = rangeNow() || [0, nRows() - 1];
        setRow(playDir < 0 ? (row <= a ? b : row - 1) : row >= b ? a : row + 1);
      }, Math.round(1100 / ((prefs.speed || 1) * playRate)));
    const b = page && page.querySelector('[data-act="play"]');
    if (b) b.textContent = on ? "Pause" : "Play";
  }

  /* ---------- looking through ---------- */
  function selection() {
    return L() ? L().resolve(prefs.sel.level, prefs.sel.id) : { curiosities: [], pairs: [], categories: [] };
  }
  /* A curiosity's own setting as a lane id. The engine knows the catalog's curiosities by their bare id; one
     it doesn't know yet (rows loaded after install) is
     reached through its main slider, "transitionKind.setting". */
  function keyFor(id) {
    if (!S() || S().known(id) || !L()) return id;
    const c = L().get("curiosity", id);
    const k = c && id + "." + (c.main || "setting");
    return k && S().known(k) ? k : id;
  }
  function labelOf(id) {
    const c = L() && /\.setting$/.test(id) ? L().get("curiosity", L().base(id)) : null;
    if (c && c.main === "setting") return c.label;
    return S() ? S().label(id) : id;
  }
  function frameOpts(sel, values) {
    const o = { cast: castOf() };
    if (prefs.lens === "off") return o;
    if (prefs.lens === "highlight" || prefs.lens === "only") {
      o.highlight = sel.categories;
      o.only = prefs.lens === "only";
    }
    if (prefs.lens === "overlay" || prefs.lens === "only") o.labels = sel.curiosities.slice(0, 6).map((c) => [labelOf(c), values[c]]);
    return o;
  }
  function attentionAt(beats, i) {
    const A = window.CurioAttention;
    if (!A) return null;
    try {
      const r = A.read(beats);
      let s = null;
      r.segments.forEach((x) => x.beat <= i && (s = x));
      return s;
    } catch (e) {
      return null;
    }
  }

  /* ---------- the page ---------- */
  let page = null;
  let lanes = null;
  function open() {
    if (!page) build();
    page.hidden = false;
    document.documentElement.classList.add("sc-open");
    prefs.open = true;
    save();
    ensureFilm();
    drawAll();
  }
  function close() {
    play(false);
    if (page) page.hidden = true;
    document.documentElement.classList.remove("sc-open");
    prefs.open = false;
    save();
  }
  function build() {
    page = document.createElement("section");
    page.className = "sc-page";
    page.setAttribute("aria-label", "Screen");
    page.innerHTML = `<header class="sc-bar"></header><div class="sc-main">
      <section class="sc-lib sc-panel" aria-label="Curiosity library"><nav class="sc-icons" aria-label="Categories"></nav><div class="sc-lib-body"><div class="sc-side"></div><div class="sc-grid"></div></div></section>
      <section class="sc-player sc-panel" aria-label="Player"><header class="sc-ph"></header><div class="sc-viewers"></div><div class="sc-overview" aria-label="Whole film"></div><div class="sc-transport"></div></section>
      <aside class="sc-inspector sc-panel" aria-label="Details"></aside>
      <div class="sc-timeline sc-panel"></div></div>`;
    document.body.appendChild(page);
    page.addEventListener("click", onClick);
    page.addEventListener("change", onChange);
    page.addEventListener("input", onInput);
    page.addEventListener("pointerdown", onKnobDown);
    page.addEventListener("pointerdown", (e) => onWinDrag(e) || onPad(e) || onOverviewDrag(e));
    page.addEventListener("scroll", (e) => e.target.classList && e.target.classList.contains("sl-scroll") && showTimelineWindow(), true);
    /* Undo and redo go to the app-wide undo list when the page has one (engine/store.js), so one ⌘Z undoes one
       step of anything. Caught first, on the window, so the app's own ⌘Z handler does not undo a second step. */
    window.addEventListener("keydown", (e) => {
      if (page.hidden || !mod(e) || e.altKey) return;
      const tag = (e.target && e.target.tagName) || "";
      if (/INPUT|SELECT|TEXTAREA/.test(tag) || (e.target && e.target.isContentEditable)) return;
      const k = e.key.toLowerCase();
      const dir = k === "z" ? (e.shiftKey ? "redo" : "undo") : k === "y" && !e.shiftKey ? "redo" : null;
      if (!dir) return;
      e.preventDefault();
      e.stopPropagation();
      undoAll(dir);
    }, true);
    document.addEventListener("keydown", (e) => {
      if (page.hidden) return;
      const tag = (e.target && e.target.tagName) || "";
      if (/INPUT|SELECT|TEXTAREA/.test(tag) || (e.target && e.target.isContentEditable)) return;
      if (e.key === "Escape" && keysOpen) return showKeys(false);
      if (e.key === "Escape" && page.dataset.fullplayer) return fullPlayer(false);
      /* Leave the browser's own copy alone when text is selected. */
      if (mod(e) && e.key.toLowerCase() === "c" && String(window.getSelection && window.getSelection()).length) return;
      for (const [, rows] of SHORTCUTS)
        for (const r of rows)
          if (r[3] && r[3](e)) {
            e.preventDefault();
            r[4](e);
            if (keysOpen && r[0] !== "?") showKeys(true);
            return;
          }
    });
    if (E()) E().on(() => !page.hidden && drawAll(true));
    /* Something outside the Screen changed what it shows (the Character tab's picked character). */
    window.addEventListener("curio-screen-redraw", () => !page.hidden && drawAll());
    window.addEventListener("resize", () => !page.hidden && lanes && lanes.draw());
  }
  function drawAll(fromEngine) {
    if (!page || page.hidden) return;
    row = Math.min(row, nRows() - 1);
    page.dataset.view = prefs.view;
    page.dataset.arrange = prefs.arrange;
    page.dataset.layout = LAYOUTS.some((l) => l[0] === prefs.layout) ? prefs.layout : "center";
    page.dataset.rulers = prefs.rulers ? "1" : "";
    page.style.setProperty("--sc-pz", String(Number(prefs.playerZoom) || 1));
    drawBar();
    drawLibrary();
    drawViewers();
    drawInspector();
    drawTimeline(fromEngine);
    placePanels();
    tell();
  }
  /* Side panels other threads dock into the Screen (the momentum meter beside the Player):
     addPanel({ id, label, place: "player" | "details" | "timeline", mount(el) }). The Screen owns where they go;
     each is mounted once into its own element and kept across redraws. on(fn) is told after every redraw and
     every playhead move. */
  const panels = [];
  const listeners = [];
  const PLACE = { player: ".sc-player", details: ".sc-inspector", timeline: ".sc-timeline" };
  function placePanels() {
    if (!page) return;
    panels.forEach((p) => {
      const host = page.querySelector(PLACE[p.place] || PLACE.player);
      if (!host) return;
      if (!p.el) {
        p.el = document.createElement("div");
        p.el.className = "sc-dock";
        p.el.dataset.panel = p.id;
        p.el.setAttribute("aria-label", p.label || p.id);
      }
      if (p.el.parentNode !== host) {
        host.appendChild(p.el);
        host.classList.add("sc-has-dock");
      }
      if (!p.mounted) {
        p.mounted = true;
        try {
          p.mount(p.el);
        } catch (e) {
          p.el.textContent = (p.label || p.id) + " could not load.";
        }
      }
    });
  }
  function addPanel(spec) {
    if (!spec || !spec.id || typeof spec.mount !== "function") return false;
    if (panels.some((p) => p.id === spec.id)) return false;
    panels.push(Object.assign({ place: "player" }, spec));
    placePanels();
    return true;
  }
  function tell() {
    listeners.forEach((fn) => {
      try {
        fn({ row, rows: nRows() });
      } catch (e) {}
    });
  }

  function selectOptions() {
    const lv = prefs.sel.level;
    const groups = L().CATEGORIES.map((c) => ({ c, items: L().items(lv, c.id) })).filter((g) => g.items.length);
    return groups
      .map((g) => `<optgroup label="${esc(g.c.label)}">${g.items.map((it) => `<option value="${esc(it.id)}"${it.id === prefs.sel.id ? " selected" : ""}>${esc(it.label)}</option>`).join("")}</optgroup>`)
      .join("");
  }
  function drawBar() {
    const bar = page.querySelector(".sc-bar");
    if (!L()) {
      bar.innerHTML = `<strong>Screen</strong> <span>The curiosity database is not loaded.</span> <button type="button" data-act="close">Back to the app</button>`;
      return;
    }
    const sel = selection();
    bar.innerHTML = `
      <strong class="sc-title">Curiomatic</strong>
      <div class="sc-seg" role="group" aria-label="View">
        <button type="button" data-view="screen" class="${prefs.view === "screen" ? "on" : ""}" title="Library, player and details on top, the timeline under them">Screen</button>
        <button type="button" data-view="arrange" class="${prefs.view === "arrange" ? "on" : ""}" title="Every automated curiosity as a track, left to right">Arrange</button>
      </div>
      <div class="sc-look">
        <span class="sc-k">Looking through</span>
        <div class="sc-seg" role="group" aria-label="Level">${L()
          .LEVELS.map((l) => `<button type="button" data-level="${l.id}" class="${prefs.sel.level === l.id ? "on" : ""}">${l.label}</button>`)
          .join("")}</div>
        <select data-pick-item aria-label="Which ${esc(prefs.sel.level)}">${selectOptions()}</select>
      </div>
      ${prefs.view === "arrange" ? `<label class="sc-chk"><input type="checkbox" data-act="viewers-in-arrange" ${prefs.viewersInArrange ? "checked" : ""}> Show the player</label>` : ""}
      <label class="sc-layout" title="Layout, like CapCut's layout menu"><span class="sc-k">Layout</span><select data-pick-layout aria-label="Layout">${LAYOUTS.map(([id, l, t]) => `<option value="${id}" title="${esc(t)}"${prefs.layout === id ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
      <button type="button" data-act="shortcuts" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts"><svg class="sc-ico" viewBox="0 0 20 20" aria-hidden="true"><rect x="1.5" y="5" width="17" height="10" rx="1.5"/><path d="M5 8h1M8 8h1M11 8h1M14 8h1M5 11.5h10"/></svg> Shortcuts</button>
      ${exportMenuHtml()}
      <button type="button" data-act="close" class="sc-close">Back to the app</button>
      <p class="sc-what">${esc(sel.label)}${sel.plain ? ": " + esc(sel.plain) : ""}</p>`;
  }

  /* ---------- Export (CapCut's big Export button at the top right) ----------
     The beta exports storyboards only: a printable storyboard sheet (every moment of My film as a frame, with
     its number, clock time, marker note and what changed), this frame as a picture (PNG or SVG), and the
     settings list as a spreadsheet (CSV). Everything is made in the browser and saved with <a download>;
     nothing is uploaded. The pure parts (EXPORT, below) take plain data so tests can check them with no page. */
  const EXPORT = (() => {
    const W = 320;
    const H = 180;
    const SHAPES = {
      wide: { label: "wide 16:9", w: W, h: H },
      vertical: { label: "vertical 9:16", w: (H * 9) / 16, h: H },
      square: { label: "square 1:1", w: H, h: H },
      cinema: { label: "cinema 2.39", w: W, h: W / 2.39 },
    };
    const MARK_HEX = { red: "#ff5a5f", orange: "#ff9f43", yellow: "#ffd43b", green: "#51cf66", blue: "#4dabf7", purple: "#b197fc" };
    const html = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const r2 = (n) => Math.round(n * 100) / 100;
    /* A storyboard frame (CurioFrame.svg) as a file of its own in a frame shape: the wide picture cropped to
       the shape, centered, as the Player does; no shaking; xmlns so it opens anywhere. px sets the long side. */
    function frameSvg(svg, shape, px) {
      const s = SHAPES[shape] || SHAPES.wide;
      const x = r2((W - s.w) / 2);
      const y = r2((H - s.h) / 2);
      const scale = px ? px / Math.max(s.w, s.h) : 1;
      return String(svg)
        .replace(/\bcf-shake\b/g, "")
        .replace(/^<svg /, `<svg xmlns="http://www.w3.org/2000/svg" width="${r2(s.w * scale)}" height="${r2(s.h * scale)}" `)
        .replace(/viewBox="0 0 320 180"/, `viewBox="${x} ${y} ${r2(s.w)} ${r2(s.h)}"`);
    }
    /* "Shot size: wide → close-up · Feeling: joyful → anxious and 2 more", or "" when nothing changed. */
    function changes(prev, cur, o) {
      if (!prev || !cur) return "";
      const max = o.max || 3;
      const text = o.text || ((k, v) => String(v));
      const moved = o.keys.filter((k) => prev[k] != null && cur[k] != null && String(prev[k]) !== String(cur[k]));
      const parts = moved.slice(0, max).map((k) => `${o.label(k)}: ${text(k, prev[k])} → ${text(k, cur[k])}`);
      return parts.length ? parts.join(" · ") + (moved.length > max ? ` and ${moved.length - max} more` : "") : "";
    }
    /* The keys worth a column: a value somewhere in the film. */
    const keysWithValues = (moments, order) => {
      const seen = [];
      (order || []).concat(...moments.map((m) => Object.keys(m.values || {}))).forEach((k) => {
        if (!seen.includes(k) && moments.some((m) => m.values && m.values[k] != null && m.values[k] !== "")) seen.push(k);
      });
      return seen;
    };
    function csvCell(v) {
      /* A cell starting with = + - or @ would run as a formula in a spreadsheet app: a leading ' keeps it plain text. */
      const raw = String(v == null ? "" : v);
      const s = /^-?\d+(\.\d+)?$/.test(raw) ? raw : raw.replace(/^[=+\-@\t\r]/, (c) => "'" + c);
      return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }
    /* One row per moment, one column per curiosity that has a value anywhere, plain labels and plain values.
       moments: [{ n, clock, note, values }]; o: { keys, label(k), text(k, v) }. Starts with a byte-order mark so
       spreadsheet apps read it as UTF-8; lines end in CRLF (the CSV standard). */
    function csv(moments, o) {
      const keys = keysWithValues(moments, o.keys);
      const text = o.text || ((k, v) => String(v));
      const head = ["Moment", "Time", "Marker note"].concat(keys.map((k) => o.label(k)));
      const rows = moments.map((m) => [m.n, m.clock || "", m.note || ""].concat(keys.map((k) => (m.values && m.values[k] != null && m.values[k] !== "" ? text(k, m.values[k]) : ""))));
      return "﻿" + [head].concat(rows).map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
    }
    /* The printable storyboard sheet: a whole page of its own (opened in a new tab), 2, 3 or 4 frames per row,
       a Print button. moments: [{ n, clock, svg, note, color, changes, label }] where svg is already shaped. */
    function sheetHtml(d) {
      const per = [2, 3, 4].includes(Number(d.perRow)) ? Number(d.perRow) : 3;
      const n = d.moments.length;
      const shape = SHAPES[d.shape] || SHAPES.wide;
      const card = (m) => `<figure class="f">
  <div class="pic">${m.svg}</div>
  <figcaption><b>Moment ${html(m.n)}</b> <span class="t">${html(m.clock)}</span>${m.label ? ` <span class="l">${html(m.label)}</span>` : ""}
  ${m.note ? `<p class="mk"><i style="background:${MARK_HEX[m.color] || MARK_HEX.orange}"></i>${html(m.note)}</p>` : ""}
  <p class="ch">${m.changes ? html(m.changes) : m.n === 1 ? "Where the film starts." : "Nothing changes from the moment before."}</p></figcaption>
</figure>`;
      return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(d.title || "Curiomatic storyboard")}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 16px; background: #fff; color: #1c1712; font: 13px/1.4 -apple-system, "Segoe UI", system-ui, sans-serif; }
  header { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: baseline; margin-bottom: 12px; }
  h1 { font-size: 18px; margin: 0; }
  .sub { color: #6b625a; }
  .tools { margin-left: auto; display: flex; gap: 6px; align-items: center; }
  .tools button { font: inherit; border: 1px solid #c9c1b8; background: #fff; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
  .tools button.on { background: #1c1712; color: #fff; border-color: #1c1712; }
  .tools .print { background: #0e7490; color: #fff; border-color: #0e7490; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(var(--per, 3), minmax(0, 1fr)); gap: 14px; }
  .f { margin: 0; break-inside: avoid; page-break-inside: avoid; }
  .pic { border: 1px solid #1c1712; aspect-ratio: ${r2(shape.w)} / ${r2(shape.h)}; max-height: 60vh; margin: 0 auto; overflow: hidden; background: #fffaf2; }
  .pic svg { display: block; width: 100%; height: 100%; }
  figcaption { padding-top: 4px; }
  .t { color: #6b625a; font-variant-numeric: tabular-nums; }
  .l { color: #6b625a; }
  .mk { margin: 3px 0 0; font-weight: 600; }
  .mk i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: 0; }
  .ch { margin: 3px 0 0; color: #4a423b; font-size: 12px; }
  @media (max-width: 600px) { .grid { grid-template-columns: repeat(min(var(--per, 3), 2), minmax(0, 1fr)); } }
  @media print { body { padding: 0; } .tools { display: none; } .grid { gap: 10px; } }
</style></head>
<body style="--per:${per}">
<header><h1>${html(d.title || "Curiomatic storyboard")}</h1>
<span class="sub">${n} moment${n === 1 ? "" : "s"}${d.seconds ? ` · ${html(d.seconds)} seconds each` : ""} · ${html(shape.label)}${d.date ? ` · ${html(d.date)}` : ""}</span>
<span class="tools" role="group" aria-label="Frames per row">Frames per row ${[2, 3, 4].map((k) => `<button type="button" data-per="${k}"${k === per ? ' class="on"' : ""}>${k}</button>`).join("")}<button type="button" class="print" data-print>Print</button></span></header>
<main class="grid">
${d.moments.map(card).join("\n")}
</main>
<script>
document.addEventListener("click", function (e) {
  var b = e.target.closest("button");
  if (!b) return;
  if (b.hasAttribute("data-print")) return window.print();
  if (b.dataset.per) {
    document.body.style.setProperty("--per", b.dataset.per);
    document.querySelectorAll("[data-per]").forEach(function (x) { x.classList.toggle("on", x === b); });
  }
});
</script>
</body></html>`;
    }
    /* "curiomatic-my-first-film-moment-3.png": plain letters and dashes. */
    function fileName(film, what, ext) {
      const slug = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      return ["curiomatic", slug(film), slug(what)].filter(Boolean).join("-") + "." + ext;
    }
    return { SHAPES, frameSvg, changes, csv, csvCell, sheetHtml, fileName, keysWithValues };
  })();
  window.CurioScreenExport = EXPORT;

  let exportOpen = false;
  function exportMenuHtml() {
    return `<span class="sc-export"><button type="button" data-act="export" class="sc-export-b" aria-haspopup="true" aria-expanded="${exportOpen}" title="Save your film as a storyboard sheet, a picture or a spreadsheet. Nothing is uploaded.">Export ▾</button>
      <div class="sc-export-menu" role="menu" aria-label="Export"${exportOpen ? "" : " hidden"}>
        <button type="button" role="menuitem" data-export="sheet"><b>Storyboard sheet</b><small>Every moment as a frame, with notes and what changes, ready to print</small></button>
        <p class="sc-k">This frame as a picture (moment ${row + 1})</p>
        <div class="sc-export-two"><button type="button" role="menuitem" data-export="png"><b>PNG</b><small>A picture file</small></button><button type="button" role="menuitem" data-export="svg"><b>SVG</b><small>Sharp at any size</small></button></div>
        <button type="button" role="menuitem" data-export="csv"><b>Settings list (spreadsheet)</b><small>One row per moment, one column per curiosity, as a CSV file</small></button>
        <p class="sc-export-foot">Made on this device. Nothing is uploaded.</p>
      </div></span>`;
  }
  function toggleExport(on) {
    exportOpen = on == null ? !exportOpen : !!on;
    const box = page && page.querySelector(".sc-export");
    if (!box) return;
    box.querySelector(".sc-export-menu").hidden = !exportOpen;
    box.querySelector(".sc-export-b").setAttribute("aria-expanded", String(exportOpen));
    if (exportOpen && !toggleExport.wired) {
      /* Close on a click anywhere else, or Esc. */
      toggleExport.wired = true;
      document.addEventListener("pointerdown", (e) => exportOpen && !(e.target.closest && e.target.closest(".sc-export")) && toggleExport(false), true);
      document.addEventListener("keydown", (e) => exportOpen && e.key === "Escape" && toggleExport(false));
    }
  }
  /* Markers from the timeline's tools (localStorage "curiosities-screen-tools-v1", markers [{ row, color, note }]). */
  function exportMarkers() {
    let list = null;
    try {
      if (window.CurioLanes && window.CurioLanes.tools) list = window.CurioLanes.tools().markers;
    } catch (e) {}
    if (!Array.isArray(list))
      try {
        list = (JSON.parse(localStorage.getItem("curiosities-screen-tools-v1")) || {}).markers;
      } catch (e) {}
    if (window.CurioLanes && window.CurioLanes.migrateMarkers) list = window.CurioLanes.migrateMarkers(list);
    const out = {};
    (Array.isArray(list) ? list : []).forEach((m) => m && typeof m === "object" && m.row != null && (out[String(m.row)] = m));
    return out;
  }
  const valueText = (k, v) => {
    const d = S() && S().known(k) ? S().domain(k) : null;
    return String(v) + (typeof v === "number" && d && d.unit ? d.unit : "");
  };
  /* My film as plain data for the builders: each moment's number, clock, marker, values. "x.setting" keys that
     repeat their curiosity's own value are left out, so each curiosity is one column. */
  function exportData() {
    const beats = mineBeats();
    const marks = exportMarkers();
    const moments = beats.map((b, i) => {
      const values = {};
      Object.keys(b.values).forEach((k) => (/\.setting$/.test(k) && b.values[L().base(k)] != null ? null : (values[k] = b.values[k])));
      const mk = marks[String(b.row)];
      return { n: i + 1, clock: tc(i), values, raw: b.values, note: mk ? mk.note || "" : "", color: mk ? mk.color : "", label: b.note && !/^moment \d+$/i.test(b.note) ? b.note : "" };
    });
    const film = E() ? E().state().name : "";
    return { moments, film, keys: EXPORT.keysWithValues(moments, prefs.lanes), shape: ratioShape() };
  }
  function downloadBlob(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.hidden = true;
    page.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function runExport(what) {
    toggleExport(false);
    if (!E() || !F()) return toast("Your film is not loaded yet.");
    const d = exportData();
    if (!d.moments.length) return toast("Your film has no moments to export yet.");
    const opts = { cast: castOf() };
    if (what === "sheet") {
      const moments = d.moments.map((m, i) =>
        Object.assign({}, m, {
          svg: EXPORT.frameSvg(F().svg(m.raw, Object.assign({ title: "Moment " + m.n }, opts)), d.shape),
          changes: i ? EXPORT.changes(d.moments[i - 1].values, m.values, { keys: d.keys, label: labelOf, text: valueText }) : "",
        })
      );
      const page2 = EXPORT.sheetHtml({ title: "Curiomatic storyboard" + (d.film ? ": " + d.film : ""), moments, shape: d.shape, perRow: 3, seconds: secondsPerMoment(), date: new Date().toLocaleDateString() });
      const blob = new Blob([page2], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      if (w) return toast(`Storyboard sheet opened in a new tab: ${moments.length} frames. Use its Print button.`);
      downloadBlob(EXPORT.fileName(d.film, "storyboard", "html"), blob);
      return toast("Your browser kept the new tab closed, so the storyboard sheet was saved as a file instead. Open it to print.");
    }
    if (what === "svg" || what === "png") {
      const i = Math.min(row, d.moments.length - 1);
      const m = d.moments[i];
      const base = EXPORT.fileName(d.film, "moment " + m.n, what);
      const svg = EXPORT.frameSvg(F().svg(m.raw, Object.assign({ title: "My film, moment " + m.n }, opts)), d.shape, what === "png" ? 1280 : 0);
      if (what === "svg") {
        downloadBlob(base, new Blob([svg], { type: "image/svg+xml" }));
        return toast(`Saved ${base}.`);
      }
      /* PNG: draw the SVG onto a canvas on a white ground, then save the canvas. */
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = Math.round(img.width) || 1280;
        c.height = Math.round(img.height) || 720;
        const g = c.getContext("2d");
        g.fillStyle = "#fffaf2";
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? (downloadBlob(base, b), toast(`Saved ${base}.`)) : toast("The picture could not be made in this browser.")), "image/png");
      };
      img.onerror = () => (URL.revokeObjectURL(url), toast("The picture could not be made in this browser."));
      img.src = url;
      return;
    }
    if (what === "csv") {
      const name = EXPORT.fileName(d.film, "settings", "csv");
      downloadBlob(name, new Blob([EXPORT.csv(d.moments, { keys: d.keys, label: labelOf, text: valueText })], { type: "text/csv;charset=utf-8" }));
      return toast(`Saved ${name}: ${d.moments.length} moments, ${d.keys.length} curiosities.`);
    }
  }

  /* ---------- the library (CapCut's top-left panel) ---------- */
  /* Line icons for the category tabs, drawn on a 20 by 20 grid in the current text color. */
  const ICONS = {
    camera: '<rect x="2" y="6" width="12" height="9" rx="1"/><path d="M14 9l4-2v7l-4-2"/>',
    person: '<circle cx="10" cy="5" r="3"/><path d="M4 18c0-4 3-6 6-6s6 2 6 6"/>',
    sun: '<circle cx="10" cy="10" r="3.5"/><path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2 2M14.4 14.4l2 2M3.6 16.4l2-2M14.4 5.6l2-2"/>',
    filter: '<circle cx="7.5" cy="8" r="4.5"/><circle cx="12.5" cy="8" r="4.5"/><circle cx="10" cy="12.5" r="4.5"/>',
    house: '<path d="M3 9l7-6 7 6v8H3z"/><path d="M8 17v-5h4v5"/>',
    shirt: '<path d="M7 3L3 6l2 3 2-1v9h6V8l2 1 2-3-4-3c-1 1.5-2 2-3 2S8 4.5 7 3z"/>',
    note: '<path d="M8 15V4l8-2v11"/><circle cx="6" cy="15" r="2"/><circle cx="14" cy="13" r="2"/>',
    text: '<path d="M3 4h10M8 4v13M13 9h5M15.5 9v8"/>',
    star: '<path d="M10 2l2.4 5 5.6.6-4.2 3.8 1.2 5.6L10 14.2 5 17l1.2-5.6L2 7.6 7.6 7z"/>',
    bowtie: '<path d="M3 4l7 6-7 6zM17 4l-7 6 7 6z"/>',
    gauge: '<path d="M3 15a7 7 0 1 1 14 0"/><path d="M10 15l4-5"/>',
    scissors: '<circle cx="5" cy="15" r="2.5"/><circle cx="15" cy="15" r="2.5"/><path d="M6.5 13L15 3M13.5 13L5 3"/>',
    heart: '<path d="M10 17s-7-4.5-7-9a4 4 0 0 1 7-2.5A4 4 0 0 1 17 8c0 4.5-7 9-7 9z"/>',
    smile: '<circle cx="10" cy="10" r="8"/><path d="M6.5 12a4 4 0 0 0 7 0M7.5 7.5v1M12.5 7.5v1"/>',
    book: '<path d="M3 4h5a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H3zM17 4h-5a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h5z"/>',
    page: '<rect x="4" y="2" width="12" height="16"/><path d="M4 9h12M10 9v9"/>',
    film: '<rect x="2" y="4" width="16" height="12" rx="1"/><path d="M5 4v12M15 4v12M2 8h3M2 12h3M15 8h3M15 12h3"/>',
    grid: '<rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/>',
    people: '<circle cx="7" cy="6" r="2.5"/><circle cx="14" cy="7" r="2"/><path d="M2 17c0-3.5 2.2-5.5 5-5.5s5 2 5 5.5M12.5 12c2.8-.4 5 1.4 5 4.5"/>',
  };
  const icon = (name) => `<svg class="sc-ico" viewBox="0 0 20 20" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;
  function category() {
    return L().CATEGORIES.find((c) => c.id === prefs.cat) || L().CATEGORIES[0];
  }
  /* The sidebar's groups for a category: its workspaces, then its suites, proximities and proximity suites. */
  /* ADVANCED (Jeremy, 2026-10-02 20:21Z): "keep the features of Final Cut Pro and hide them under a tab that
     says ADVANCED and then focus on the features of CapCut". Rows tagged "advanced" (Final Cut Pro features
     CapCut has no match for, data/db-editing.js) stay out of the category grids and Details, and live under
     the ADVANCED tab with a map of every Final Cut Pro feature the Screen already does in CapCut's way. */
  const isAdv = (it) => !!(it && Array.isArray(it.tags) && it.tags.includes("advanced"));
  const mainOnly = (list) => list.filter((it) => !isAdv(it));
  const ADV = { id: "advanced", label: "ADVANCED", icon: "gauge", windows: 2, plain: "Final Cut Pro's features: the ones CapCut has no match for, as curiosities, and where every other one lives on this screen." };
  /* [Final Cut Pro feature, where it is here, the curiosity it opens (or none)] */
  const FCP_MAP = [
    ["Browser and Viewer", "The library and the Player", ""],
    ["Inspector", "Details, on the right", ""],
    ["Video tracks", "The film clip tracks at the top of the timeline", ""],
    ["Magnetic timeline", "Magnet in the timeline toolbar (P)", ""],
    ["Skimming", "Preview axis in the timeline toolbar (S)", ""],
    ["Range selection", "Play range: I and O", ""],
    ["Markers", "Marker in the timeline toolbar (M)", ""],
    ["Keyframes and the Video Animation editor", "Nodes on a lane, with Glide, Smooth or Jump", ""],
    ["Connected clips", "Overlay", "overlay"],
    ["Transitions browser", "Transition style", "transitionKind"],
    ["Retime menu", "Clip speed", "clipSpeed"],
    ["Hold frame", "Freeze frame", "freezeFrame"],
    ["Beat Detection", "Cutting to the beat", "beatSync"],
    ["Color board", "Exposure, and Warmth and tint", "exposure"],
    ["Match Color and Balance Color", "Shot matching", "colorMatch"],
    ["Custom LUT", "LUT", "lut"],
    ["Titles", "On-screen text", "onScreenText"],
    ["Captions", "Captions", "captions"],
    ["Keyer", "Cutout and green screen", "cutout"],
    ["Shape and color masks", "Mask", "maskShape"],
    ["Object tracker", "Tracking", "tracking"],
    ["Stabilization and rolling shutter", "Steadying", "stabilization"],
    ["Ken Burns", "Punch-in and reframe", "reframe"],
    ["Voiceover tool", "Voice-over", "voiceover"],
  ];
  function advancedGroups() {
    const out = [{ id: "adv:fcp", label: "Final Cut Pro's own", level: "curiosity", items: L().items("curiosity").filter(isAdv) }];
    [["suite", "Advanced suites"], ["proximity", "Advanced proximities"], ["proximitySuite", "Advanced proximity suites"]].forEach(([lv, label]) => {
      const items = L().items(lv).filter(isAdv);
      if (items.length) out.push({ id: "adv:" + lv, label, level: lv, items });
    });
    out.push({ id: "adv:map", label: "Final Cut Pro, here", level: "fcp", items: FCP_MAP.map(([id, plain, cur]) => ({ id, label: id, plain: "Here: " + plain, cur: cur && S() && S().known(cur) ? cur : "" })) });
    return out;
  }
  function groupsOf(cat) {
    const ws = (window.CuriosityDB && window.CuriosityDB.data.workspaces) || [];
    const out = cat.workspaces
      .map((w) => ({ id: "ws:" + w, label: (ws.find((x) => x.id === w) || {}).label || w, level: "curiosity", items: mainOnly(L().curiosities(cat.id)).filter((c) => c.workspace === w) }))
      .filter((g) => g.items.length);
    [["suite", "Suites"], ["proximity", "Proximities"], ["proximitySuite", "Proximity suites"]].forEach(([lv, label]) => {
      const items = mainOnly(L().items(lv, cat.id));
      if (items.length) out.push({ id: lv, label, level: lv, items });
    });
    return out;
  }
  /* "My film": every lane with nodes (an outliner), then the proximities and suites already joined in. */
  function mineGroups() {
    const st = E() && E().state();
    if (!st) return [];
    const lanes = Object.keys(st.lanes).map((lk) => {
      const cur = lk.slice(lk.indexOf("|") + 1);
      const t = st.tracks.find((x) => lk.startsWith(x.id + "|"));
      const n = Object.keys(st.lanes[lk].points).length;
      return { id: cur, label: labelOf(cur), plain: `${n} node${n === 1 ? "" : "s"} on ${t ? t.label : "a track"}${st.lanes[lk].mode === "hold" ? ", jumps between them" : ""}` };
    });
    const out = [{ id: "mine:lanes", label: "Automated curiosities", level: "curiosity", items: lanes }];
    const links = st.links.map((l) => ({ id: l.id, label: l.label || "A proximity", plain: (l.on ? "" : "Switched off. ") + (l.scope ? "Joins two nodes." : "A rule for the whole lane."), link: true }));
    if (links.length) out.push({ id: "mine:links", label: "Proximities in my film", level: "link", items: links });
    return out;
  }
  /* "Templates": every suite, by category, and the proximity suites as linked recipes. */
  function templateGroups() {
    const out = L()
      .CATEGORIES.map((c) => ({ id: "tpl:" + c.id, label: c.label, level: "suite", items: L().items("suite", c.id) }))
      .filter((g) => g.items.length);
    const ps = L().items("proximitySuite");
    if (ps.length) out.push({ id: "tpl:linked", label: "Linked recipes", level: "proximitySuite", items: ps });
    return out;
  }
  function cardHtml(level, it) {
    if (level === "fcp") return it.cur ? `<div class="sc-card sc-fcp" data-card="fcp"><button type="button" class="sc-card-b" data-pick-card="curiosity|${esc(it.cur)}"><strong>${esc(it.label)}</strong><small>${esc(it.plain)}</small><em>Final Cut Pro</em></button></div>` : `<div class="sc-card sc-fcp" data-card="fcp"><div class="sc-card-b"><strong>${esc(it.label)}</strong><small>${esc(it.plain)}</small><em>Final Cut Pro</em></div></div>`;
    if (level === "link") return `<div class="sc-card" data-card="link"><div class="sc-card-b"><strong>${esc(it.label)}</strong><small>${esc(it.plain)}</small><em>Proximity</em></div></div>`;
    const on = prefs.sel.level === level && prefs.sel.id === it.id;
    let sub = it.plain || "";
    if (level === "suite") sub = (it.members || []).length + " curiosities: " + [...new Set((it.members || []).map((m) => labelOf(keyFor(m.curiosity))))].slice(0, 4).join(", ");
    const tag = level === "curiosity" ? (isAdv(it) ? "Advanced: Final Cut Pro" : it.source === "Final Cut Pro and CapCut" ? "New from editing" : "") : L().LEVELS.find((l) => l.id === level).label;
    const add = level === "proximity" || level === "proximitySuite" ? "Add it to my film" : level === "suite" ? "Put its curiosities on the timeline" : "Put it on the timeline";
    const k = level === "curiosity" ? keyFor(it.id) : "";
    const tiles = on && k && prefs.view !== "arrange" ? tilesOf(k) : [];
    const here = tiles.length ? String(valueHere(k)) : "";
    return `<div class="sc-card${on ? " on" : ""}${tiles.length ? " wide" : ""}" data-card="${esc(level)}" data-id="${esc(it.id)}" title="${esc(it.plain || it.label)}">
      <button type="button" class="sc-card-b" data-pick-card="${esc(level)}|${esc(it.id)}"><strong>${esc(it.label)}</strong><small>${esc(sub)}</small>${tag ? `<em>${esc(tag)}</em>` : ""}</button>
      <button type="button" class="sc-plus" data-add-card="${esc(level)}|${esc(it.id)}" aria-label="${esc(add)}: ${esc(it.label)}" title="${esc(add)}">+</button>
      ${tiles.length ? `<div class="sc-tiles" role="group" aria-label="Settings of ${esc(it.label)}"><span class="sc-k">Drop a setting at moment ${row + 1}:</span>${tiles.map((v) => `<button type="button" data-drop="${esc(k)}" data-v="${esc(v)}" class="${String(v) === here ? "on" : ""}">${esc(v)}${S().domain(k).unit && typeof v === "number" ? esc(S().domain(k).unit) : ""}</button>`).join("")}</div>` : ""}
    </div>`;
  }
  function drawLibrary() {
    if (!page || !L()) return;
    const box = page.querySelector(".sc-lib");
    box.hidden = prefs.view === "arrange";
    if (box.hidden) return;
    const cat = category();
    const tab = ["mine", "templates", "advanced"].includes(prefs.libTab) ? prefs.libTab : "";
    const extra = [["mine", "My film", "film", "Everything automated in my film so far (like Maya's Outliner, or CapCut's Yours)"], ["templates", "Templates", "grid", "Ready-made recipes: every suite, dropped at the playhead as a set of nodes (CapCut's Templates)"]];
    page.querySelector(".sc-icons").innerHTML =
      extra.map(([id, label, ic, t]) => `<button type="button" data-libtab="${id}" class="${tab === id ? "on" : ""}" aria-pressed="${tab === id}" title="${esc(t)}">${icon(ic)}<span>${esc(label)}</span></button>`).join("") +
      L()
        .CATEGORIES.map((c) => `<button type="button" data-icat="${c.id}" class="${!tab && c.id === cat.id ? "on" : ""}" aria-pressed="${!tab && c.id === cat.id}" title="${esc(c.plain)}">${icon(c.icon)}<span>${esc(c.label)}</span></button>`)
        .join("") +
      `<button type="button" data-libtab="advanced" class="sc-adv${tab === "advanced" ? " on" : ""}" aria-pressed="${tab === "advanced"}" title="${esc(ADV.plain)}">${icon(ADV.icon)}<span>${ADV.label}</span></button>`;
    const groups = tab === "mine" ? mineGroups() : tab === "templates" ? templateGroups() : tab === "advanced" ? advancedGroups() : groupsOf(cat);
    const gkey = tab || cat.id;
    const gid = groups.some((g) => g.id === prefs.groups[gkey]) ? prefs.groups[gkey] : (groups[0] || {}).id;
    page.querySelector(".sc-side").innerHTML = groups.map((g) => `<button type="button" class="sc-pill${g.id === gid && !prefs.search ? " on" : ""}" data-group="${esc(g.id)}"><span>${esc(g.label)}</span><small>${g.items.length}</small></button>`).join("");
    let cards;
    let head;
    const q = String(prefs.search || "").trim().toLowerCase();
    if (q) {
      const hits = L()
        .items("curiosity")
        .filter((c) => (c.label + " " + (c.plain || "")).toLowerCase().includes(q))
        .slice(0, 60);
      head = `${hits.length} curiosit${hits.length === 1 ? "y" : "ies"} match`;
      cards = hits.map((c) => cardHtml("curiosity", c)).join("");
    } else {
      const g = groups.find((x) => x.id === gid);
      head = g ? g.label : "Nothing here yet";
      cards = g ? g.items.map((it) => cardHtml(g.level, it)).join("") : "";
    }
    const grid = page.querySelector(".sc-grid");
    const had = grid.querySelector("[data-lib-search]");
    const focused = had && document.activeElement === had;
    grid.innerHTML = `<input type="search" data-lib-search placeholder="Search every curiosity" aria-label="Search every curiosity" value="${esc(prefs.search || "")}"><p class="sc-grid-h">${esc(head)}</p><div class="sc-cards">${cards || `<p class="sc-k">No matches.</p>`}</div>`;
    if (focused) {
      const inp = grid.querySelector("[data-lib-search]");
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  }
  /* A card's + : a curiosity goes on the timeline, a suite's curiosities go on it, a proximity (or proximity
     suite) goes into my film as lane rules. */
  function addCard(level, id) {
    if (level === "proximity" || level === "proximitySuite") {
      prefs.sel = { level, id };
      save();
      addProximity();
      return drawAll();
    }
    /* Everything picked lands as nodes on automation lanes at the playhead: a curiosity at its current setting,
       a suite (a template) with each member at the suite's own setting. */
    const s = level === "suite" ? L().get("suite", id) : null;
    const list = s ? (s.members || []).filter((m) => m.curiosity).map((m) => [m.slider ? m.curiosity + "." + m.slider : keyFor(m.curiosity), m.value]) : [[keyFor(id), valueHere(keyFor(id))]];
    const ok = list.filter(([k]) => S() && S().known(k));
    ok.forEach(([k]) => showLane(k));
    save();
    if (E() && ok.length) {
      const res = setValues(ok.map(([k, v]) => [k, v == null ? S().start(k) : v]), s ? `Drop ${s.label} at moment ${row + 1}` : null);
      if (res && res.ok) toast(s ? `${s.label}: ${ok.length} nodes dropped at moment ${row + 1}. Each one is a lane you can automate.` : `${labelOf(ok[0][0])} is on the timeline with a node at moment ${row + 1}. Drag it, or click the lane to add more.`);
    } else toast(`${list.length > 1 ? list.length + " curiosities are" : labelOf(keyFor(id)) + " is"} on the timeline.`);
    drawTimeline();
  }

  /* ---------- viewers ---------- */
  function scrub(beats, current, fires, kind, id) {
    const n = beats.length;
    const marks = (fires || []).map((f) => `<i class="sc-fire" style="left:${((f.beat + 0.5) / n) * 100}%;opacity:${0.35 + 0.65 * (f.strength || 1)}" title="Happens at beat ${f.beat + 1}"></i>`).join("");
    return `<div class="sc-scrub" data-scrub="${kind}" data-id="${esc(id || "")}" title="Click to move the playhead">${beats.map((b, i) => `<b class="${i === current ? "on" : ""}" style="width:${100 / n}%"></b>`).join("")}${marks}</div>`;
  }
  /* CapCut's Ratio menu: my film's frame shape is Canvas edges' "Frame shape" slider, a node at the playhead.
     The Player's frame of my film takes that shape (the picture cropped to fill it); inspiration films keep their own. */
  const RATIO = "canvasFill.ratio";
  const ratioOpts = () => (S() && S().known(RATIO) ? S().domain(RATIO).options || [] : []);
  function ratioShape() {
    const v = ratioOpts().length ? String(valueHere(RATIO) || "") : "";
    return /9:16/.test(v) ? "vertical" : /1:1/.test(v) ? "square" : /2\.39/.test(v) ? "cinema" : "wide";
  }
  /* ---------- Guides (CapCut's Player guides) ----------
     Lines over My film's picture to help place things, any combination, following the Ratio frame shape. They
     are a view setting (prefs.guides, a list of ids), not part of the film and not undo steps. "Where attention
     is" glows on the part of the picture the moment's attention sits on: CurioFrame doesn't hand out where it
     drew things, so guideSpot works it out from the same values and the same placement rules frame.js uses. */
  const GUIDES = [
    ["thirds", "Thirds", "Thirds: put the important thing where the lines cross; pictures feel more alive than when it's dead center."],
    ["center", "Center cross", "Center cross: marks the exact middle, for things you want perfectly balanced or straight on."],
    ["safe", "Safe areas", "Safe areas: keep words inside the inner box and action inside the outer one, so no screen cuts them off at the edges."],
    ["golden", "Golden ratio", "Golden ratio: like thirds but a little nearer the middle; an old painters' rule for a calm, pleasing balance."],
    ["attention", "Where attention is", "Where attention is: a soft glow on the part of the picture the audience is looking at in this moment."],
  ];
  let guidesOpen = false;
  function guidesOn() {
    const g = prefs.guides;
    if (g === true) return ["thirds"]; /* an older save kept one switch: the thirds grid (⌘;) */
    return Array.isArray(g) ? GUIDES.map((x) => x[0]).filter((id) => g.includes(id)) : [];
  }
  function setGuide(id, on) {
    const cur = guidesOn();
    prefs.guides = GUIDES.map((x) => x[0]).filter((k) => (k === id ? !!on : cur.includes(k)));
    save();
  }
  /* Where the moment's attention sits in the frame's own 320×180 drawing: { x, y, rx, ry, family, what }.
     Mirrors frame.js: the horizon from the angle, the size from the shot, the main character first in line
     (or left of center when the composition says so), the speech balloon, the music notes, the window. */
  function guideSpot(values, family, cast) {
    const v = values || {};
    const W = (F() && F().W) || 320;
    const H = (F() && F().H) || 180;
    const num = (x, d) => (x == null || x === "" || !isFinite(Number(x)) ? d : Number(x));
    const shot = String(v.shotSize || "medium");
    const angle = String(v.angleHeight || "eye");
    const horizon = angle === "low" ? 140 : angle === "high" ? 70 : /overhead/.test(angle) ? 30 : /floor/.test(angle) ? 160 : 112;
    const s = shot === "wide" ? 0.75 : shot === "close" ? 2.6 : shot === "insert" ? 1 : 1.35;
    const n = shot === "close" ? 1 : Math.max(1, Math.min(6, num(cast, num(v.peopleCount, 2))));
    const floorY = shot === "close" ? H + 120 : Math.min(H - 6, horizon + 40 + (shot === "wide" ? 0 : 20));
    const span = shot === "wide" ? 200 : 170;
    const x = n === 1 ? (/left/.test(String(v.composition || "")) ? W * 0.36 : W / 2) : W / 2 - span / 2;
    const top = floorY - 74 * s;
    const foot = Math.min(floorY, H);
    const insert = shot === "insert";
    const face = { x, y: floorY - 65 * s, rx: Math.max(18, 20 * s), ry: Math.max(16, 18 * s), what: "the main character's face" };
    const body = { x, y: (top + foot) / 2, rx: Math.max(20, 22 * s), ry: (foot - top) / 2 + 6, what: "the main character" };
    const person = (p) => (insert ? { x: W / 2, y: H / 2, rx: 56, ry: 42, what: "the object in the shot" } : p);
    const vol = num(v.volume, 0);
    const words = num(v.wordsAmount, vol ? 2 : 0);
    const f = String(family || "");
    let spot;
    if (/^(feeling|mind|plot)$/.test(f)) spot = person(face);
    else if (f === "voice") spot = words > 0 && !insert ? { x: W * 0.3, y: 28, rx: 28 + vol * 5, ry: 18 + vol * 1.5, what: "what is being said" } : person(face);
    else if (/^(movement|wardrobe|camera)$/.test(f)) spot = person(body);
    else if (f === "comedy") spot = v.physicalComedy && !insert ? { x: W / 2 + 48, y: floorY - 52, rx: 26, ry: 24, what: "the gag" } : num(v.laughsPerMinute, 0) > 0 ? { x: W - 48, y: H - 22, rx: 42, ry: 22, what: "the laughs" } : person(face);
    else if (f === "music") spot = { x: 34, y: H - 16, rx: 40, ry: 22, what: "the music" };
    else if (/^(place|light)$/.test(f)) spot = { x: W - 56, y: Math.max(8, horizon - 70) + 22, rx: 46, ry: 36, what: f === "light" ? "the light from the window" : "the set" };
    else if (f) spot = { x: W / 2, y: H / 2, rx: W * 0.32, ry: H * 0.38, what: "the whole picture" };
    else spot = Object.assign({}, person(face), { what: insert ? "the object in the shot" : "the main character's face, where the eye goes first" });
    const r = (k) => Math.round(k * 10) / 10;
    return { x: r(spot.x), y: r(Math.max(0, Math.min(H, spot.y))), rx: r(spot.rx), ry: r(spot.ry), family: f || null, what: spot.what };
  }
  function guidesHtml(vals, att, shape) {
    const on = guidesOn();
    if (!on.length) return "";
    const line = (k, p) => `<i class="sc-gd-${k}" style="${k === "v" ? "left" : "top"}:${p}%"></i>`;
    const lines = (ps) => ps.map((p) => line("v", p) + line("h", p)).join("");
    const W = F().W;
    const H = F().H;
    const part = {
      thirds: () => lines([33.333, 66.667]),
      golden: () => lines([38.197, 61.803]),
      center: () => `<i class="sc-gd-cross"></i>`,
      safe: () => `<div class="sc-gd-box action"><span>keep action inside</span></div><div class="sc-gd-box title"><span>keep words inside</span></div>`,
      attention: () => {
        const s = guideSpot(vals, att && att.family, castOf());
        const el = `cx="${s.x}" cy="${s.y}" rx="${s.rx}" ry="${s.ry}"`;
        return `<svg class="sc-gd-att" viewBox="0 0 ${W} ${H}"${shape === "wide" ? "" : ' preserveAspectRatio="xMidYMid slice"'} data-family="${esc(s.family || "")}"><defs><radialGradient id="sc-gd-hole"><stop offset="0.55" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient><mask id="sc-gd-mask"><rect width="${W}" height="${H}" fill="#fff"/><ellipse ${el} fill="url(#sc-gd-hole)"/></mask></defs><rect width="${W}" height="${H}" fill="rgba(0,0,0,0.38)" mask="url(#sc-gd-mask)"/><ellipse class="sc-gd-spot" ${el} fill="none" stroke="#ffd34d" stroke-width="1.5" stroke-dasharray="4 3"/></svg><span class="sc-gd-cap">Eyes on: ${esc(s.what)}</span>`;
      },
    };
    return `<div class="sc-gd" aria-hidden="true">${on.map((id) => `<div class="sc-gd-g" data-gd="${id}">${part[id]()}</div>`).join("")}</div>`;
  }
  function guidesMenuHtml() {
    const on = guidesOn();
    return `<span class="sc-guides"><button type="button" data-act="guides-menu" class="${on.length ? "on" : ""}" aria-haspopup="true" aria-expanded="${guidesOpen}" title="Guides: lines over your film's picture to help you place things. They don't change your film.">Guides${on.length ? " · " + on.length : ""} ▾</button>${
      guidesOpen
        ? `<div class="sc-guides-menu" role="group" aria-label="Guides over my film">${GUIDES.map(([id, l, t]) => `<label title="${esc(t)}"><input type="checkbox" data-guide="${id}"${on.includes(id) ? " checked" : ""}> ${esc(l)}</label>`).join("")}<p>Only over your film, in its frame shape. Hover over one to see what it is for.</p></div>`
        : ""
    }</span>`;
  }
  function viewerHtml(kind, v) {
    const sel = selection();
    if (kind === "mine") {
      const beats = mineBeats();
      const i = Math.min(row, beats.length - 1);
      const vals = beats[i] ? beats[i].values : {};
      const fires = L().fires(prefs.sel.level, prefs.sel.id, beats);
      const att = attentionAt(beats, i);
      /* A frame shape other than wide crops the storyboard picture to fill it, as reframing a shot would. */
      const shape = ratioShape();
      const fill = (svg) => (shape === "wide" ? svg : svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" '));
      return `<article class="sc-viewer mine${prefs.focus === "mine" ? " focus" : ""}" data-viewer="mine">
        <header><button type="button" class="sc-vname" data-focus="mine">My film</button><span class="sc-vsub">${esc(E() ? E().state().name : "")} · moment ${i + 1} of ${beats.length}</span></header>
        <div class="sc-frame" data-focus="mine" data-shape="${shape}">${fill(F().svg(vals, Object.assign(frameOpts(sel, vals), { title: "My film, moment " + (i + 1) })))}${prefs.ghost ? [[i - 1, "before"], [i + 1, "after"]].filter(([j]) => beats[j]).map(([j, w]) => `<div class="sc-ghost ${w}" aria-hidden="true">${F().svg(beats[j].values, { title: "" })}</div>`).join("") : ""}${guidesHtml(vals, att, shape)}${att ? `<span class="sc-att" title="What holds the audience's attention now (momentum)">Attention: ${esc(att.label)}</span>` : ""}</div>
        ${scrub(beats, i, fires, "mine")}
        <p class="sc-vnote">${fires.length ? `${esc(sel.label)} shows up ${fires.length} time${fires.length === 1 ? "" : "s"} in your film.` : `${esc(sel.label)} does not show up in your film yet.`}</p>
      </article>`;
    }
    const f = film(v.film);
    if (!f) return `<article class="sc-viewer"><p>No curated films yet.</p></article>`;
    const b = beatFor(f);
    const vals = f.beats[b].values || {};
    const fires = L().fires(prefs.sel.level, prefs.sel.id, f.beats);
    const att = attentionAt(f.beats, b);
    const takes = Object.keys(v.takes || {}).filter((k) => v.takes[k] > 0).length;
    return `<article class="sc-viewer insp${prefs.focus === v.id ? " focus" : ""}" data-viewer="${esc(v.id)}">
      <header><select data-film="${esc(v.id)}" aria-label="Inspiration film">${films()
        .map((x) => `<option value="${esc(x.id)}"${x.id === f.id ? " selected" : ""}>${esc(filmTitle(x))}</option>`)
        .join("")}</select><button type="button" class="sc-vname" data-focus="${esc(v.id)}" title="Show this film in the inspector">Inspect${takes ? ` · ${takes} taken` : ""}</button>${prefs.insp.length > 0 ? `<button type="button" data-remove="${esc(v.id)}" aria-label="Remove this viewer" title="Remove this viewer">×</button>` : ""}</header>
      <div class="sc-frame" data-focus="${esc(v.id)}">${F().svg(vals, Object.assign(frameOpts(sel, vals), { title: filmTitle(f) + ", beat " + (b + 1), cast: Number(vals.peopleCount) || 2 }))}${att ? `<span class="sc-att">Attention: ${esc(att.label)}</span>` : ""}</div>
      ${scrub(f.beats, b, fires, "insp", v.id)}
      <p class="sc-vnote">${esc(f.beats[b].at || "")} ${esc(f.beats[b].note || "")}${fires.length ? ` · ${esc(sel.label)}: ${fires.length} time${fires.length === 1 ? "" : "s"}` : ""}</p>
    </article>`;
  }
  /* ---------- the whole film at a glance (decision 74) ----------
     The viewers show one moment at a time, so this strip shows every moment of My film as a small storyboard
     frame, always squeezed to fit, like the thumbnails on CapCut's main track and Final Cut Pro's filmstrips.
     Click or drag along it to jump anywhere. The bright box is the stretch the timeline below shows now. */
  const thumbs = new Map();
  function thumb(values) {
    const k = castOf() + JSON.stringify(values);
    if (!thumbs.has(k)) {
      if (thumbs.size > 400) thumbs.clear();
      thumbs.set(k, F().svg(values, { title: "", cast: castOf() }).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" '));
    }
    return thumbs.get(k);
  }
  function overviewHtml() {
    const beats = mineBeats();
    const n = beats.length;
    if (!prefs.overview) return `<div class="sc-ov-h"><button type="button" data-act="overview" class="sc-ov-toggle" title="Show every moment of your film in one strip">▸ Whole film</button></div>`;
    if (!n) return "";
    const rg = rangeNow();
    const fires = new Set(L().fires(prefs.sel.level, prefs.sel.id, beats).map((f) => f.beat));
    const sel = selection();
    return `<div class="sc-ov-h"><button type="button" data-act="overview" class="sc-ov-toggle" title="Hide the whole-film strip">▾ Whole film</button><span>${n} moment${n === 1 ? "" : "s"} · ${n * secondsPerMoment()} seconds</span>${fires.size ? `<span class="sc-ov-key"><em></em>${esc(sel.label)}</span>` : ""}<span class="sc-ov-tip">Click or drag to jump anywhere</span></div>
      <div class="sc-ov-strip" data-ov-strip style="--n:${n}">${beats
        .map((b, j) => `<button type="button" class="sc-ov-f${j === row ? " on" : ""}${rg && (j < rg[0] || j > rg[1]) ? " out" : ""}" data-ov="${j}" title="Moment ${j + 1}${b.note ? ": " + esc(b.note) : ""}. Click to jump here." aria-label="Jump to moment ${j + 1}">${thumb(b.values)}<i>${j + 1}</i>${fires.has(j) ? `<em title="${esc(sel.label)} happens here"></em>` : ""}</button>`)
        .join("")}<span class="sc-ov-win" hidden></span></div>`;
  }
  /* The box on the strip that shows which part of the film the timeline is scrolled to. */
  function showTimelineWindow() {
    const box = page && page.querySelector(".sc-ov-win");
    const sc = page && page.querySelector(".sl-scroll");
    if (!box) return;
    const head = sc && sc.querySelector(".sl-heads");
    const hw = head ? head.offsetWidth : 0;
    const total = sc ? sc.scrollWidth - hw : 0;
    const seen = sc ? sc.clientWidth - hw : 0;
    if (!sc || total <= 0 || seen >= total - 2) return (box.hidden = true);
    box.hidden = false;
    box.style.left = (100 * sc.scrollLeft) / total + "%";
    box.style.width = (100 * Math.min(seen, total)) / total + "%";
  }
  /* Jump to a moment from the strip, and scroll the timeline so the playhead is in view. */
  function jumpTo(j) {
    setRow(j);
    const sc = page.querySelector(".sl-scroll");
    const play = sc && sc.querySelector(".sl-lanes .sl-play, .sl-topsvg .sl-play");
    const head = sc && sc.querySelector(".sl-heads");
    if (!play) return;
    const hw = head ? head.offsetWidth : 0;
    const x = Number(play.getAttribute("x"));
    const w = Number(play.getAttribute("width")) || 0;
    const seen = sc.clientWidth - hw;
    if (x < sc.scrollLeft || x + w > sc.scrollLeft + seen) sc.scrollLeft = Math.max(0, w > seen ? x : x + w / 2 - seen / 2);
    showTimelineWindow();
  }
  function onOverviewDrag(e) {
    const strip = e.target.closest && e.target.closest("[data-ov-strip]");
    if (!strip || e.button > 0) return false;
    const at = (ev) => {
      const s = page.querySelector("[data-ov-strip]");
      const r = s.getBoundingClientRect();
      return Math.floor(Math.max(0, Math.min(0.9999, (ev.clientX - r.left) / r.width)) * nRows());
    };
    let last = at(e);
    jumpTo(last);
    const move = (ev) => {
      const j = at(ev);
      if (j !== last) jumpTo((last = j));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
    return true;
  }
  /* CapCut-style timecode: one moment of my film counts as one second. */
  /* Seconds per moment: the Momentum window's own setting (localStorage "curiosities-momentum-v1",
     secondsPerPanel, 3 by default), so the Screen's clock and the momentum meter agree. */
  function secondsPerMoment() {
    try {
      const p = JSON.parse(localStorage.getItem("curiosities-momentum-v1"));
      if (p && Number(p.secondsPerPanel) > 0) return Number(p.secondsPerPanel);
    } catch (e) {}
    return 3;
  }
  const tc = (n) => {
    const t = Math.round(n * secondsPerMoment());
    return "00:" + String(Math.floor(t / 3600)).padStart(2, "0") + ":" + String(Math.floor((t % 3600) / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  };
  function drawViewers() {
    if (!page || !L() || !F()) return;
    const box = page.querySelector(".sc-player");
    const hide = prefs.view === "arrange" && !prefs.viewersInArrange;
    box.hidden = hide;
    page.querySelector(".sc-viewers").hidden = hide;
    if (hide) return;
    page.querySelector(".sc-ph").innerHTML = `<strong>Player</strong><div class="sc-seg sc-lens" role="group" aria-label="Lens">${[
      ["highlight", "Highlight", "Light up only what it is about"],
      ["overlay", "Overlay", "Write its values on the picture"],
      ["only", "Lens only", "Draw only what it is about"],
      ["off", "Off", "The plain picture"],
    ]
      .map(([id, l, t]) => `<button type="button" data-lens="${id}" class="${prefs.lens === id ? "on" : ""}" title="${t}">${l}</button>`)
      .join("")}</div><button type="button" data-act="ghost" class="sc-ghost-b${prefs.ghost ? " on" : ""}" aria-pressed="${!!prefs.ghost}" title="Ghosts: see the moments before and after faintly over your film (Maya's ghosting, an animator's onion skin)">Ghosts</button>`;
    page.querySelector(".sc-viewers").innerHTML = prefs.insp.map((v) => viewerHtml("insp", v)).join("") + viewerHtml("mine");
    page.querySelector(".sc-overview").innerHTML = overviewHtml();
    showTimelineWindow();
    page.querySelector(".sc-transport").innerHTML = `<span class="sc-tc" title="One moment of your film is ${secondsPerMoment()} seconds (the Momentum window's setting)">${tc(row)} / ${tc(Math.max(0, nRows() - 1))}</span>
      <span class="sc-play"><button type="button" data-act="prev" aria-label="Back one moment">◀</button><button type="button" data-act="play" class="sc-playb">${timer ? "Pause" : "Play"}</button><button type="button" data-act="next" aria-label="Forward one moment">▶</button><select data-speed aria-label="Speed">${[0.5, 1, 2, 4].map((sp) => `<option value="${sp}"${prefs.speed === sp ? " selected" : ""}>${sp}×</option>`).join("")}</select>${rangeNow() ? `<button type="button" data-act="range-clear" class="sc-range-b on" title="Play loops over moments ${rangeNow()[0] + 1} to ${rangeNow()[1] + 1}. Click to play the whole film again.">Loop ${rangeNow()[0] + 1}–${rangeNow()[1] + 1} ×</button>` : ""}</span>
      <span class="sc-wins-set"><span class="sc-seg" role="group" aria-label="Windows">${[1, 2, 3].map((n) => `<button type="button" data-wins="${n}" class="${prefs.insp.length + 1 === n ? "on" : ""}" title="${n === 1 ? "Only your film" : n - 1 + " inspiration film" + (n > 2 ? "s" : "") + " and your film"}">${n}</button>`).join("")}</span><button type="button" data-act="add-insp" title="Add another inspiration film viewer">+ Inspiration film</button><span class="sc-seg" role="group" aria-label="Viewer layout"><button type="button" data-arr="side" class="${prefs.arrange === "side" ? "on" : ""}" title="Viewers side by side">Side</button><button type="button" data-arr="stack" class="${prefs.arrange === "stack" ? "on" : ""}" title="Viewers stacked">Stack</button></span>${ratioOpts().length ? `<label class="sc-ratio" title="Frame shape (CapCut's Ratio): how wide or tall your film's picture is; picking one puts a node at this moment. Wide fits a TV or laptop, vertical a phone held upright, square a social post, cinema an extra-wide movie screen.">Ratio <select data-ratio aria-label="Frame shape of my film">${ratioOpts().map((o) => `<option${String(valueHere(RATIO)) === String(o) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>` : ""}${guidesMenuHtml()}</span>`;
  }

  /* ---------- the inspector ---------- */
  function fineCount(c) {
    return (c.sliders || []).length;
  }
  function sliderId(c, s) {
    return s.id === c.main || s.id === "setting" ? keyFor(c.id) : c.id + "." + s.id;
  }
  function knob(id, s, val, disabled) {
    const r = s.range;
    const p = r.max > r.min ? (Number(val) - r.min) / (r.max - r.min) : 0;
    const a = -135 + 270 * (isFinite(p) ? Math.max(0, Math.min(1, p)) : 0);
    return `<span class="sc-knob${disabled ? " dis" : ""}" role="slider" tabindex="${disabled ? -1 : 0}" aria-label="${esc(s.label)}" aria-valuemin="${r.min}" aria-valuemax="${r.max}" aria-valuenow="${esc(val)}" data-knob="${esc(id)}" data-min="${r.min}" data-max="${r.max}" data-step="${r.step || 1}" data-val="${esc(val)}"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13"/><line x1="16" y1="16" x2="16" y2="5" transform="rotate(${a} 16 16)"/></svg><b>${esc(val == null ? "–" : val)}</b></span>`;
  }
  function controlHtml(id, s, val, disabled) {
    const kind = L().control(s);
    const dis = disabled ? " disabled" : "";
    if (kind === "toggle") return `<span class="sc-toggle" role="group">${s.scale.map((o) => `<button type="button" data-set="${esc(id)}" data-v="${esc(o)}" class="${String(val) === String(o) ? "on" : ""}"${dis}>${esc(o)}</button>`).join("")}</span>`;
    if (kind === "choice") return `<select data-set="${esc(id)}"${dis}><option value="">not set</option>${s.scale.map((o) => `<option${String(val) === String(o) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    if (kind === "steps") {
      const i = s.scale.findIndex((o) => String(o) === String(val));
      return `<span class="sc-steps"><input type="range" min="0" max="${s.scale.length - 1}" step="1" value="${i < 0 ? 0 : i}" data-step-set="${esc(id)}" data-scale="${esc(JSON.stringify(s.scale))}"${dis} aria-label="${esc(s.label)}"><output>${esc(val == null ? "not set" : val)}</output></span>`;
    }
    if (kind === "knob") return knob(id, s, val == null ? s.range.min : val, disabled);
    const r = s.range || { min: 0, max: 100, step: 1, unit: "" };
    return `<span class="sc-steps"><input type="range" min="${r.min}" max="${r.max}" step="${r.step || 1}" value="${esc(val == null ? r.min : val)}" data-set="${esc(id)}"${dis} aria-label="${esc(s.label)}"><output>${esc(val == null ? "–" : val + (r.unit || ""))}</output></span>`;
  }
  function spark(id, beats) {
    const pts = beats.map((b, i) => {
      const v = L().beatValue(beats, i, id);
      const p = v == null || !S() ? null : S().pos(id, v);
      return p == null ? null : [(i / Math.max(1, beats.length - 1)) * 70 + 1, 15 - p * 13];
    });
    const ok = pts.filter(Boolean);
    if (!ok.length) return `<svg class="sc-spark" viewBox="0 0 72 16"></svg>`;
    return `<svg class="sc-spark" viewBox="0 0 72 16" aria-hidden="true"><polyline points="${ok.map((p) => p.join(",")).join(" ")}"/></svg>`;
  }
  /* The key diamond in front of every control (Maya's channel box): filled when there is a node at this moment,
     hollow when the lane has nodes elsewhere, faint when it is not automated yet. Click to set or take off a key. */
  function keyBtn(id, ctx) {
    if (!ctx.edit || !S() || !S().known(id)) return "";
    const k = keyState(id);
    const t = k === "here" ? "A key (node) is set here; click to take it off" : k === "lane" ? "Automated, no key at this moment; click to set one" : "Not automated yet; click to set a key here and put it on the timeline";
    return `<button type="button" class="sc-key ${k || "none"}" data-key="${esc(id)}" title="${t}" aria-label="${esc(t)}: ${esc(labelOf(id))}">${k === "here" ? "◆" : "◇"}</button>`;
  }
  /* CapCut's ◀ ◆ ▶ beside a keyframed setting: jump to the key before or after the playhead (Details rows only;
     the windows keep the bare diamond). Shown once the lane has a node; an arrow with no key that way is greyed. */
  function keyNav(id) {
    const st = E() && E().state();
    const t = st && st.tracks.find((x) => x.curiosities.includes(id));
    const lane = t && st.lanes[t.id + "|" + id];
    if (!lane) return null;
    const at = st.rows.map((r, j) => (lane.points[r.id] != null ? j : -1)).filter((j) => j >= 0);
    if (!at.length) return null;
    return { prev: at.filter((j) => j < row).pop() ?? -1, next: at.find((j) => j > row) ?? -1 };
  }
  function keyNavBtns(id, ctx) {
    const k = keyBtn(id, ctx);
    const n = k && keyNav(id);
    if (!n) return k;
    const b = (dir, j) => {
      const t = j < 0 ? `No key ${dir === "prev" ? "before" : "after"} this moment` : `Jump to the ${dir === "prev" ? "previous" : "next"} key (node), at moment ${j + 1}`;
      return `<button type="button" class="sc-knav-b" data-key-jump="${j < 0 ? "" : j}" data-dir="${dir}"${j < 0 ? " disabled" : ""} title="${t}" aria-label="${esc(t)}: ${esc(labelOf(id))}">${dir === "prev" ? "◀" : "▶"}</button>`;
    };
    return `<span class="sc-knav">${b("prev", n.prev)}${k}${b("next", n.next)}</span>`;
  }
  /* Momentum, the heart of the app: how the picked curiosity moves the story and the audience's attention. */
  function momentumBox(m) {
    const push = Math.max(0, Math.min(5, Number(m.push) || 0));
    const CUE = { visual: "the eye", audio: "the ear", thought: "the mind", movement: "movement", plot: "the plot" };
    return `<div class="sc-mom" aria-label="Momentum"><p><strong>Momentum</strong> <span class="sc-mom-bar" title="How hard it pushes the story: ${push} of 5">${"●".repeat(push)}${"○".repeat(5 - push)}</span>${m.cue ? ` <span class="sc-k">pulls ${esc(CUE[m.cue] || m.cue)}</span>` : ""}</p>${m.plot ? `<p><b>Story:</b> ${esc(m.plot)}</p>` : ""}${m.theme ? `<p><b>Theme:</b> ${esc(m.theme)}</p>` : ""}${m.pull ? `<p><b>Attention:</b> ${esc(m.pull)}</p>` : ""}${m.tryThis ? `<p><b>Try:</b> ${esc(m.tryThis)}</p>` : ""}</div>`;
  }
  function curiosityRow(c, ctx) {
    const key = keyFor(c.id);
    const sel = prefs.sel.level === "curiosity" && (prefs.sel.id === c.id || prefs.sel.id === key);
    const mainVal = ctx.value(key);
    const open = !!prefs.folds[c.id];
    const fine = (c.sliders || []).filter((s) => s.id !== c.main && s.id !== "setting");
    const mainS = (c.sliders || []).find((s) => s.id === c.main || s.id === "setting") || (c.sliders || [])[0];
    const take = ctx.insp ? Number((ctx.insp.takes || {})[key]) || 0 : 0;
    return `<div class="sc-cur${sel ? " sel" : ""}">
      <div class="sc-cur-top">
        <button type="button" class="sc-cur-name" data-select-cur="${esc(c.id)}" title="${esc(c.plain || "")}">${esc(c.label)}</button>
        ${spark(key, ctx.beats)}<button type="button" class="sc-cur-win" data-open-win="${esc(c.id)}" title="Open ${esc(c.label)}'s own window: every knob and slider it has" aria-label="Open ${esc(c.label)}'s window">⧉</button>
        ${fine.length ? `<button type="button" class="sc-fold" data-fold="${esc(c.id)}" aria-expanded="${open}" title="The fine controls inside it">${open ? "▾" : "▸"} ${fine.length}</button>` : ""}
      </div>
      ${mainS ? `<div class="sc-ctl"><span class="sc-ctl-l">${keyNavBtns(key, ctx)}${esc(mainS.label)}</span>${controlHtml(key, mainS, mainVal, !ctx.edit)}</div>` : ""}
      ${ctx.insp ? `<div class="sc-take"><label><input type="checkbox" data-take="${esc(key)}" ${take > 0 ? "checked" : ""}> Take into my film</label>${take > 0 ? `<input type="range" min="5" max="100" step="5" value="${Math.round(take * 100)}" data-take-amt="${esc(key)}" aria-label="Blend amount"><output>${Math.round(take * 100)}%</output>` : ""}</div>` : ""}
      ${sel && c.momentum ? momentumBox(c.momentum) : ""}
      ${open ? `<div class="sc-fine">${fine.map((s) => `<div class="sc-ctl"><span class="sc-ctl-l" title="${esc(s.plain || "")}">${keyNavBtns(sliderId(c, s), ctx)}${esc(s.label)}</span>${controlHtml(sliderId(c, s), s, ctx.value(sliderId(c, s)), !ctx.edit)}</div>`).join("")}</div>` : ""}
    </div>`;
  }
  /* ---------- a window for every curiosity (Jeremy, 2026-10-02 20:26Z: "a separate pop-up window for every
     single curiosity which has specific knobs and sliders and features that apply just to that curiosity") ----------
     Built from the curiosity's own sliders in the database: each one gets the control that fits it (toggle,
     list, stepped slider, knob or slider), its key diamond, a "+ lane" button and a small chart of how it moves
     through my film. Emotion, Shot size and Comedy have hand-made parts on top. Windows float over the Screen,
     several at once; drag one by its title bar. Opened from ⧉ on a lane or in Details. */
  const wins = [];
  function openWin(id) {
    if (!L() || !id) return;
    const base = L().get("curiosity", id) ? id : L().base(id);
    if (!L().get("curiosity", base)) return toast("That curiosity has no window yet.");
    const had = wins.findIndex((w) => w.id === base);
    if (had >= 0) wins.push(wins.splice(had, 1)[0]);
    else wins.push({ id: base, x: 120 + (wins.length % 5) * 28, y: 90 + (wins.length % 5) * 28, focus: id === base ? "" : id });
    drawWins();
  }
  function mineCtx() {
    const beats = mineBeats();
    const st = E() ? E().state() : null;
    const r = st && st.rows[row];
    return {
      insp: null,
      beats,
      edit: !!r,
      value: (id) => {
        if (!st || !r) return undefined;
        const t = st.tracks.find((x) => x.curiosities.includes(id));
        return t ? E().value(r.id, t.id, id) : S() ? S().start(id) : undefined;
      },
    };
  }
  function undoAll(dir) {
    const St = window.CurioStore;
    if (St && typeof St.external === "function" && typeof St[dir] === "function") return St[dir]();
    return E() && E()[dir]();
  }
  /* Nodes at given moments (not just the playhead), as one undo step: [[curiosity key, moment index, value]]. */
  function setAt(items, label) {
    const st = E() && E().state();
    if (!st) return { ok: false };
    const cmds = [];
    const placed = {};
    items.forEach(([id, j, v]) => {
      const r = st.rows[j];
      if (!r || !S().known(id)) return;
      let track = placed[id] || (st.tracks.find((t) => t.curiosities.includes(id)) || {}).id;
      if (!track) {
        track = window.CurioLanes.trackFor(id, st);
        if (!track) return;
        cmds.push({ type: "addCuriosity", track, curiosity: id });
      }
      placed[id] = track;
      const val = S().fix(id, v);
      if (val != null) cmds.push({ type: "setPoint", row: r.id, track, curiosity: id, value: val });
      showLane(id);
    });
    if (!cmds.length) return { ok: false };
    save();
    const res = E().send({ type: "batch", label, commands: cmds });
    if (!res.ok) toast(res.error);
    return res;
  }
  const FEEL_COLOR = { dreamlike: "#9b8cff", melancholy: "#5b7bd5", loving: "#ff7eb6", curious: "#33d1c6", absurd: "#c7e04a", joyful: "#ffd34d", anxious: "#ff9f43", fearful: "#a46cff", triumphant: "#ffb000", angry: "#ff5656" };
  /* Hand-made parts for the most important curiosities. */
  function winSpecial(c, ctx) {
    const key = keyFor(c.id);
    const n = ctx.beats.length;
    const strip = (k, fmt) => `<div class="sc-wstrip" role="group" aria-label="Through my film">${ctx.beats.map((b, j) => { const v = L().beatValue(ctx.beats, j, k); return `<button type="button" data-win-row="${j}" class="${j === row ? "on" : ""}" title="Moment ${j + 1}: ${esc(v == null ? "not set" : v)}" style="${fmt ? fmt(v) : ""}"><b>${j + 1}</b><span>${esc(v == null ? "–" : String(v).slice(0, 10))}</span></button>`; }).join("")}</div>`;
    if (c.id === "emotion") {
      /* The feeling pad: unpleasant to pleasant across, calm to charged up (the valence and arousal sliders), with
         each feeling placed where it sits, and the film's emotional road under it. */
      const SPOT = { dreamlike: [0.62, 0.15], melancholy: [0.18, 0.22], loving: [0.82, 0.35], curious: [0.6, 0.55], absurd: [0.5, 0.68], joyful: [0.88, 0.7], anxious: [0.25, 0.78], fearful: [0.12, 0.88], triumphant: [0.85, 0.92], angry: [0.32, 0.95] };
      const cur = ctx.value(key);
      const vk = c.id + ".valence";
      const ak = c.id + ".arousal";
      const vp = S().known(vk) ? S().pos(vk, ctx.value(vk)) : null;
      const ap = S().known(ak) ? S().pos(ak, ctx.value(ak)) : null;
      return `<div class="sc-wpart"><h4>Feeling pad</h4><p class="sc-k">Click a feeling to set it here. Click the pad itself to set how pleasant (across) and how charged (up) it is.</p>
        <div class="sc-pad" data-pad="${esc(c.id)}"><span class="sc-pad-x">unpleasant · pleasant</span><span class="sc-pad-y">calm · charged</span>${vp != null && ap != null ? `<i class="sc-pad-dot" style="left:${vp * 100}%;top:${(1 - ap) * 100}%"></i>` : ""}${(S().domain(key).options || []).map((o) => { const p = SPOT[o] || [0.5, 0.5]; return `<button type="button" data-set="${esc(key)}" data-v="${esc(o)}" class="${String(cur) === o ? "on" : ""}" style="left:${p[0] * 100}%;top:${(1 - p[1]) * 100}%;--feel:${FEEL_COLOR[o] || "#888"}">${esc(o)}</button>`; }).join("")}</div>
        <h4>Emotional road</h4>${strip(key, (v) => `--feel:${FEEL_COLOR[v] || "#555"}`)}</div>`;
    }
    if (c.id === "shotSize") {
      /* Frame sizes drawn around a person: click the frame you want. */
      const cur = ctx.value(key);
      const F = { wide: [4, 4, 92, 92], medium: [26, 14, 48, 56], close: [36, 12, 28, 30], insert: [62, 52, 16, 16] };
      return `<div class="sc-wpart"><h4>Frame sizes</h4><p class="sc-k">Click a frame to set the shot size here.</p>
        <div class="sc-frames"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="24" r="8"/><path d="M50 32v30M50 40l-14 14M50 40l14 12M50 62l-10 30M50 62l10 30"/><rect x="62" y="54" width="10" height="7" rx="1"/></svg>${["wide", "medium", "close", "insert"].map((o) => { const r = F[o]; return `<button type="button" data-set="${esc(key)}" data-v="${o}" class="${String(cur) === o ? "on" : ""}" style="left:${r[0]}%;top:${r[1]}%;width:${r[2]}%;height:${r[3]}%" title="${o}"><span>${o}</span></button>`; }).join("")}</div>
        <h4>Through my film</h4>${strip(key)}</div>`;
    }
    if (c.id === "angleHeight") {
      /* Camera height seen from the side: a person, and a camera at each height on an arc around them. */
      const cur = ctx.value(key);
      const SPOT = { floor: [12, 90, -8], low: [16, 70, -25], eye: [20, 40, 0], high: [24, 14, 30], overhead: [50, 4, 85] };
      return `<div class="sc-wpart"><h4>Camera height</h4><p class="sc-k">Seen from the side. Click where the camera should be: lower makes a person look bigger and stronger, higher makes them look smaller.</p>
        <div class="sc-heights"><svg viewBox="0 0 100 100" aria-hidden="true"><path class="arc" d="M12 92 Q14 10 50 4"/><circle cx="72" cy="34" r="7"/><path d="M72 41v28M72 48l-10 12M72 48l10 12M72 69l-8 23M72 69l8 23"/><line class="floor" x1="0" y1="93" x2="100" y2="93"/></svg>${["floor", "low", "eye", "high", "overhead"]
          .map((o) => { const p = SPOT[o]; return `<button type="button" data-set="${esc(key)}" data-v="${o}" class="${String(cur) === o ? "on" : ""}" style="left:${p[0]}%;top:${p[1]}%" title="${o}"><svg viewBox="0 0 20 12" aria-hidden="true" style="transform:rotate(${p[2]}deg)"><rect x="1" y="2" width="12" height="8" rx="1.5"/><path d="M13 4l6-3v10l-6-3z"/></svg><span>${o}</span></button>`; })
          .join("")}</div>
        <h4>Through my film</h4>${strip(key)}</div>`;
    }
    if (c.id === "cameraMove") {
      /* Each camera move as a small picture of what the camera does. */
      const cur = ctx.value(key);
      const PIC = {
        none: '<rect x="9" y="10" width="14" height="10" rx="2"/>',
        pan: '<rect x="11" y="11" width="10" height="8" rx="2"/><path d="M4 24 Q16 30 28 24" class="mv"/><path d="M28 24l-4 0M28 24l-2 -3" class="mv"/>',
        tilt: '<rect x="11" y="11" width="10" height="8" rx="2"/><path d="M27 4 Q32 15 27 26" class="mv"/><path d="M27 4l0 4M27 4l3 2" class="mv"/>',
        "push in": '<rect x="3" y="11" width="9" height="8" rx="2"/><path d="M14 15h12M26 15l-4-3M26 15l-4 3" class="mv"/><circle cx="29" cy="15" r="2"/>',
        "pull out": '<rect x="20" y="11" width="9" height="8" rx="2"/><path d="M18 15H6M6 15l4-3M6 15l4 3" class="mv"/><circle cx="3" cy="15" r="2"/>',
        track: '<rect x="11" y="6" width="10" height="8" rx="2"/><path d="M3 22h26M29 22l-4-3M29 22l-4 3" class="mv"/><path d="M3 26h26" class="rail"/>',
        crane: '<rect x="18" y="3" width="10" height="8" rx="2"/><path d="M4 28L22 11" class="rail"/><path d="M8 18 Q10 8 16 5" class="mv"/>',
        zoom: '<rect x="4" y="11" width="10" height="8" rx="2"/><path d="M14 13l14-7M14 17l14 7" class="mv"/>',
        orbit: '<circle cx="16" cy="15" r="3"/><ellipse cx="16" cy="15" rx="13" ry="7" class="mv"/><rect x="25" y="9" width="6" height="5" rx="1"/>',
      };
      return `<div class="sc-wpart"><h4>Camera moves</h4><p class="sc-k">Click the move the camera makes at this moment.</p>
        <div class="sc-moves">${(S().domain(key).options || Object.keys(PIC))
          .map((o) => `<button type="button" data-set="${esc(key)}" data-v="${esc(o)}" class="${String(cur) === o ? "on" : ""}"><svg viewBox="0 0 32 30" aria-hidden="true">${PIC[o] || PIC.none}</svg><span>${esc(o)}</span></button>`)
          .join("")}</div>
        <h4>Through my film</h4>${strip(key)}</div>`;
    }
    if (c.id === "colorRange") {
      /* From black and white to vivid color, painted in the picked main color; the main colors as swatches. */
      const cur = ctx.value(key);
      const hk = c.id + ".paletteHue";
      const hue = S().known(hk) ? ctx.value(hk) : null;
      const H = { red: 0, orange: 28, yellow: 50, green: 120, teal: 175, blue: 215, purple: 275, pink: 325 };
      const h = H[hue] != null ? H[hue] : 28;
      const SAT = { "black and white": [0, 0], "one color": [55, 0], "two or three colors": [60, 1], "muted color": [28, 3], "natural color": [50, 3], "vivid color": [90, 4] };
      const chips = (o) => { const [sat, more] = SAT[o] || [40, 2]; return [0, 1, 2, 3, 4].map((k) => `<i style="background:hsl(${(h + (k <= more ? k * 72 : 0)) % 360} ${sat}% ${30 + k * 10}%)"></i>`).join(""); };
      return `<div class="sc-wpart"><h4>How much color</h4><p class="sc-k">From black and white to vivid color. Each choice is painted in your film's main color.</p>
        <div class="sc-colors">${(S().domain(key).options || Object.keys(SAT)).map((o) => `<button type="button" data-set="${esc(key)}" data-v="${esc(o)}" class="${String(cur) === o ? "on" : ""}"><span class="sc-chips">${chips(o)}</span><span>${esc(o)}</span></button>`).join("")}</div>
        ${S().known(hk) ? `<h4>Main color</h4><div class="sc-hues">${(S().domain(hk).options || Object.keys(H)).map((o) => `<button type="button" data-set="${esc(hk)}" data-v="${esc(o)}" class="${String(hue) === o ? "on" : ""}" style="--sw:hsl(${H[o] || 0} 75% 52%)" title="${esc(o)}" aria-label="${esc(o)}"></button>`).join("")}</div>
        <h4>Main color through my film</h4>${strip(hk, (v) => (H[v] != null ? `--feel:hsl(${H[v]} 75% 52%)` : ""))}` : `<h4>Through my film</h4>${strip(key)}`}</div>`;
    }
    if (c.id === "comedyDevice") {
      /* Joke timing: where setups and payoffs land, and quick ways to build a joke from the playhead. */
      const bk = keyFor("comicBeat");
      const last = n - 1;
      const room = (k) => row + k <= last;
      return `<div class="sc-wpart"><h4>Joke timing</h4><p class="sc-k">The comic beat at each moment: plant a setup, let it build, land the payoff.</p>
        ${S().known(bk) ? strip(bk, (v) => (v === "payoff lands" ? "--feel:#ffd34d" : v === "setup planted" ? "--feel:#33d1c6" : v === "building" ? "--feel:#ff9f43" : "")) : ""}
        <div class="sc-wbtns">
          <button type="button" data-joke="setup">Plant a setup here</button>
          <button type="button" data-joke="payoff">Land the payoff here</button>
          <button type="button" data-joke="three"${room(2) ? "" : " disabled"} title="Setup, build, payoff on three moments in a row from the playhead">Rule of three from here</button>
          <button type="button" data-joke="callback"${room(3) ? "" : " disabled"} title="A setup here, paid off as a callback three moments later">Callback later</button>
        </div></div>`;
    }
    return "";
  }
  function winHtml(w, z) {
    const c = L().get("curiosity", w.id);
    const ctx = mineCtx();
    const key = keyFor(c.id);
    const cat = L().CATEGORIES.find((x) => x.id === L().categoryOf(c.id)) || { label: "", icon: "star" };
    const sliders = (c.sliders || []).slice().sort((a, b) => (a.id === c.main || a.id === "setting" ? -1 : b.id === c.main || b.id === "setting" ? 1 : 0));
    const block = (sl) => {
      const id = sliderId(c, sl);
      if (!S().known(id)) return "";
      const main = id === key;
      return `<div class="sc-wctl${main ? " main" : ""}${w.focus === id ? " focus" : ""}">
        <div class="sc-wctl-h"><span>${keyBtn(id, ctx)}<b>${esc(main ? labelOf(id) : sl.label)}</b></span>${spark(id, ctx.beats)}<button type="button" data-win-lane="${esc(id)}" title="Put ${esc(sl.label)} on the timeline as its own lane">+ lane</button></div>
        ${sl.plain ? `<p class="sc-k">${esc(sl.plain)}</p>` : ""}
        <div class="sc-ctl">${controlHtml(id, sl, ctx.value(id), !ctx.edit)}</div>
      </div>`;
    };
    return `<section class="sc-win" data-win="${esc(c.id)}" role="dialog" aria-label="${esc(c.label)} window" style="left:${w.x}px;top:${w.y}px;z-index:${60 + z}">
      <header class="sc-win-h" data-win-drag="${esc(c.id)}">${icon(cat.icon)}<b>${esc(c.label)}</b><small>${esc(cat.label)}${isAdv(c) ? " · ADVANCED" : ""}</small><button type="button" data-win-close="${esc(c.id)}" aria-label="Close the ${esc(c.label)} window">×</button></header>
      <div class="sc-win-b">
        ${c.plain ? `<p class="sc-win-plain">${esc(c.plain)}</p>` : ""}
        <p class="sc-k">My film, moment ${row + 1}: every change here becomes a node.</p>
        ${winSpecial(c, ctx)}
        <div class="sc-wpart"><h4>Every knob and slider</h4>${sliders.map(block).join("")}</div>
        ${c.momentum ? momentumBox(c.momentum) : ""}
        <div class="sc-wbtns"><button type="button" data-select-cur="${esc(c.id)}">Look through it</button><button type="button" data-win-curve="${esc(key)}">Shape its curve</button></div>
      </div>
    </section>`;
  }
  function drawWins() {
    if (!page) return;
    let box = page.querySelector(".sc-wins-layer");
    if (!box) {
      box = document.createElement("div");
      box.className = "sc-wins-layer";
      page.appendChild(box);
    }
    const scroll = {};
    box.querySelectorAll(".sc-win").forEach((x) => (scroll[x.dataset.win] = (x.querySelector(".sc-win-b") || {}).scrollTop || 0));
    box.innerHTML = wins.filter((w) => L().get("curiosity", w.id)).map((w, i) => winHtml(w, i)).join("");
    box.querySelectorAll(".sc-win").forEach((x) => scroll[x.dataset.win] && (x.querySelector(".sc-win-b").scrollTop = scroll[x.dataset.win]));
  }
  function winClick(d, t) {
    if (d.winClose) {
      wins.splice(wins.findIndex((w) => w.id === d.winClose) >>> 0, 1);
      return drawWins(), true;
    }
    if (d.winLane) {
      showLane(d.winLane);
      save();
      drawTimeline();
      toast(`${labelOf(d.winLane)} is on the timeline.`);
      return true;
    }
    if (d.winRow != null && d.winRow !== "") return setRow(Number(d.winRow)), true;
    if (d.winCurve) {
      showLane(d.winCurve);
      save();
      drawTimeline();
      const r = lanes && lanes.command ? lanes.curves() : null;
      if (!r || !r.ok) toast("Give this lane two nodes first; a curve shapes the line between them.");
      return true;
    }
    if (d.joke) {
      const dev = keyFor("comedyDevice");
      const bk = keyFor("comicBeat");
      const now = mineCtx().value(dev);
      const R = {
        setup: [[bk, row, "setup planted"]],
        payoff: [[bk, row, "payoff lands"]],
        three: [[bk, row, "setup planted"], [bk, row + 1, "building"], [bk, row + 2, "payoff lands"], [dev, row, "rule of three"]],
        callback: [[bk, row, "setup planted"], [bk, row + 3, "payoff lands"], [dev, row + 3, "callback"]],
      }[d.joke];
      if (R) setAt(R, { setup: "Plant a setup", payoff: "Land a payoff", three: "Rule of three", callback: "A callback" }[d.joke]);
      if (now == null && d.joke !== "three" && d.joke !== "callback") setAt([[dev, row, S().start(dev)]], "Set the comedy device");
      return true;
    }
    return false;
  }
  function onPad(e) {
    const pad = e.target.closest && e.target.closest("[data-pad]");
    if (!pad || e.target.closest("button")) return false;
    const r = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
    const id = pad.dataset.pad;
    const list = [[id + ".valence", S().at(id + ".valence", x)], [id + ".arousal", S().at(id + ".arousal", y)]].filter(([k]) => S().known(k));
    list.forEach(([k]) => showLane(k));
    if (list.length) setValues(list, "Set how the feeling feels");
    return true;
  }
  function onWinDrag(e) {
    const h = e.target.closest && e.target.closest("[data-win-drag]");
    if (!h || e.target.closest("button")) return false;
    const w = wins.find((x) => x.id === h.dataset.winDrag);
    if (!w) return false;
    const win = h.closest(".sc-win");
    const x0 = e.clientX - w.x;
    const y0 = e.clientY - w.y;
    wins.push(wins.splice(wins.indexOf(w), 1)[0]);
    win.style.zIndex = 60 + wins.length;
    const move = (ev) => {
      w.x = Math.max(0, Math.min(window.innerWidth - 80, ev.clientX - x0));
      w.y = Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - y0));
      win.style.left = w.x + "px";
      win.style.top = w.y + "px";
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
    return true;
  }
  function drawInspector() {
    if (!page || !L()) return;
    const box = page.querySelector(".sc-inspector");
    const insp = prefs.insp.find((v) => v.id === prefs.focus) || null;
    if (!insp && prefs.focus !== "mine") prefs.focus = "mine";
    let ctx;
    if (insp) {
      const f = film(insp.film);
      const b = beatFor(f);
      ctx = { insp, beats: f ? f.beats : [], edit: false, value: (id) => (f ? L().beatValue(f.beats, b, id) : undefined), title: filmTitle(f), sub: "Inspiration film, beat " + (b + 1) };
    } else {
      const beats = mineBeats();
      const st = E() ? E().state() : null;
      const r = st && st.rows[row];
      ctx = {
        insp: null,
        beats,
        edit: !!r,
        value: (id) => {
          if (!st || !r) return undefined;
          const t = trackHas(id, st);
          return t ? E().value(r.id, t.id, id) : S() ? S().start(id) : undefined;
        },
        title: "My film",
        sub: "Moment " + (row + 1) + ": every change becomes a node here",
      };
    }
    const sel = selection();
    /* Details shows the category picked in the library's icon row, like CapCut's Details panel follows what
       is selected. An inspiration film shows the curiosities it actually uses first. */
    const adv = prefs.libTab === "advanced";
    const cat = adv ? ADV : category();
    let list = adv ? L().items("curiosity").filter(isAdv) : mainOnly(L().curiosities(cat.id));
    if (insp) list = list.filter((c) => ctx.value(keyFor(c.id)) != null).concat(list.filter((c) => ctx.value(keyFor(c.id)) == null));
    const all = !!prefs.showFine[cat.id];
    /* The main ones, plus whatever you are looking through, so it is always in reach. */
    const shown = all ? list : list.filter((c, i) => i < MAIN_SHOWN || sel.curiosities.includes(c.id) || sel.curiosities.includes(keyFor(c.id)));
    const others = sel.categories.filter((id) => id !== cat.id).map((id) => L().CATEGORIES.find((c) => c.id === id)).filter(Boolean);
    const body = `<section class="sc-cat open${sel.categories.includes(cat.id) ? " lit" : ""}" data-cat-id="${cat.id}">
      <h3 class="sc-cat-h">${icon(cat.icon)}<span>${esc(cat.label)}</span><small>${list.length}</small></h3>
      <p class="sc-cat-plain">${esc(cat.plain)} <button type="button" class="sc-wins" data-wins="${cat.windows}" title="The window layout suggested for ${esc(cat.label)}">Use ${cat.windows} window${cat.windows === 1 ? "" : "s"}</button></p>
      ${cat.id === "character" && !insp && window.CharacterScreen ? window.CharacterScreen.barHtml() : ""}
      ${shown.map((c) => curiosityRow(c, ctx)).join("")}
      ${list.length > MAIN_SHOWN ? `<button type="button" class="sc-more" data-more="${cat.id}">${all ? "Show only the main ones" : `Show all ${list.length} in ${esc(cat.label)}`}</button>` : ""}
      ${others.length ? `<p class="sc-also">What you are looking through is also in ${others.map((c) => `<button type="button" data-icat="${c.id}">${esc(c.label)}</button>`).join(" ")}</p>` : ""}
    </section>`;
    const blend = insp ? blendHtml() : "";
    box.innerHTML = `<header class="sc-insp-h"><strong class="sc-details">Details</strong><span><b>${esc(ctx.title)}</b> · ${esc(ctx.sub)}</span>${insp ? `<button type="button" data-focus="mine">Inspect my film</button>` : ""}</header>${blend}<div class="sc-cats">${body}</div>`;
    drawWins();
  }

  /* ---------- blending inspiration films onto my film ---------- */
  function takesFor(cur) {
    return prefs.insp.filter((v) => Number((v.takes || {})[cur]) > 0).map((v) => ({ v, f: film(v.film), amt: Number(v.takes[cur]) }));
  }
  function blendHtml() {
    const curs = [...new Set([].concat(...prefs.insp.map((v) => Object.keys(v.takes || {}).filter((k) => v.takes[k] > 0))))];
    if (!curs.length) return `<p class="sc-blend-empty">Tick "Take into my film" on any curiosity below, here or in another inspiration viewer, to blend it onto your film.</p>`;
    return `<div class="sc-blend"><strong>Blend into my film</strong>${curs
      .map((c) => {
        const t = takesFor(c);
        return `<div class="sc-blend-row"><span>${esc(labelOf(c))}</span><small>${t.map((x) => esc(filmTitle(x.f)) + " " + Math.round(x.amt * 100) + "%").join(" + ")}</small><button type="button" data-blend="${esc(c)}">Blend</button></div>`;
      })
      .join("")}<button type="button" data-blend="*">Blend all</button><p class="sc-k">Each film pulls your film toward it by its amount; two films at 50% meet halfway. Every blend is one undo step.</p></div>`;
  }
  function blendCommands(cur) {
    const Eng = E();
    const st = Eng.state();
    const takes = takesFor(cur).filter((x) => x.f);
    if (!takes.length) return { error: "Nothing is taken for " + labelOf(cur) + "." };
    const track = window.CurioLanes.trackFor(cur, st);
    if (!track) return { error: "Every track is full." };
    const on = st.tracks.find((t) => t.id === track).curiosities.includes(cur);
    const cmds = on ? [] : [{ type: "addCuriosity", track, curiosity: cur }];
    const n = st.rows.length;
    const sum = takes.reduce((a, x) => a + x.amt, 0);
    const mineW = Math.max(0, 1 - sum);
    const d = S().domain(cur);
    const unordered = d.kind === "choice" && L().get("curiosity", L().base(cur)) && ((L().get("curiosity", L().base(cur)).sliders || []).find((s) => sliderId(L().get("curiosity", L().base(cur)), s) === cur) || {}).unordered;
    st.rows.forEach((r, j) => {
      const fr = n > 1 ? j / (n - 1) : 0;
      let acc = 0;
      let w = 0;
      let best = null;
      takes.forEach((x) => {
        const b = Math.round(fr * (x.f.beats.length - 1));
        const v = L().beatValue(x.f.beats, b, cur);
        const p = v == null ? null : S().pos(cur, v);
        if (p == null) return;
        acc += p * x.amt;
        w += x.amt;
        if (!best || x.amt > best.amt) best = { amt: x.amt, v };
      });
      if (!w) return;
      const mineV = on ? Eng.value(r.id, track, cur) : S().start(cur);
      const mp = S().pos(cur, mineV);
      let out;
      if (unordered) out = best.amt >= 0.5 || sum >= 0.5 ? S().fix(cur, best.v) : mineV;
      else out = S().at(cur, (acc + (mp == null ? 0 : mp * mineW)) / (w + (mp == null ? 0 : mineW)));
      if (out != null) cmds.push({ type: "setPoint", row: r.id, track, curiosity: cur, value: out });
    });
    return { cmds, track };
  }
  function blend(cur) {
    if (!E()) return;
    const list = cur === "*" ? [...new Set([].concat(...prefs.insp.map((v) => Object.keys(v.takes || {}).filter((k) => v.takes[k] > 0))))] : [cur];
    const all = [];
    let err = "";
    list.forEach((c) => {
      const r = blendCommands(c);
      if (r.error) err = r.error;
      else all.push(...r.cmds);
    });
    if (!all.length) return toast(err || "Nothing to blend.");
    const r = E().send({ type: "batch", label: list.length > 1 ? "Blend " + list.length + " curiosities from inspiration films" : "Blend " + labelOf(list[0]) + " from inspiration films", commands: all });
    toast(r.ok ? "Blended into your film. Undo takes it back." : r.error);
    if (r.ok && list.length === 1) {
      prefs.sel = { level: "curiosity", id: list[0] };
      save();
      drawAll();
    }
  }

  /* ---------- the timeline ---------- */
  function timelineLanes() {
    const st = E() ? E().state() : null;
    if (!st) return [];
    const sel = selection();
    const out = [];
    const seen = new Set();
    const add = (cur, extra) => {
      cur = cur && keyFor(cur);
      if (!cur || seen.has(cur) || !S() || !S().known(cur)) return;
      seen.add(cur);
      out.push(Object.assign({ cur, track: null, label: labelOf(cur) }, extra || {}));
    };
    if (prefs.view === "screen") {
      /* What you are looking through, then the tracks you put on with a card's + . */
      sel.curiosities.forEach((c) => add(c));
      prefs.lanes.forEach((c) => add(c));
      return out;
    }
    /* Arrange: every automated curiosity, the ones you added, then the potential ones. */
    sel.curiosities.forEach((c) => add(c));
    Object.keys(st.lanes).forEach((lk) => add(lk.split("|")[1]));
    prefs.lanes.forEach((c) => add(c));
    if (prefs.showSuites) {
      L().CATEGORIES.forEach((cat) => {
        L()
          .items("suite", cat.id)
          .forEach((s) => {
            if (!prefs.openSuites[s.id]) return;
            (s.members || []).forEach((m) => add(m.curiosity, { group: s.label }));
          });
      });
    }
    if (prefs.showAll) L().CATEGORIES.forEach((cat) => prefs.openCats[cat.id] && mainOnly(L().curiosities(cat.id)).forEach((c) => add(c.id, { group: cat.label })));
    return out;
  }
  function laneHeader(ln, i) {
    const cat = L().categoryOf(ln.cur);
    const opts = L()
      .CATEGORIES.map((c) => `<optgroup label="${esc(c.label)}">${L().curiosities(c.id).map((x) => `<option value="${esc(keyFor(x.id))}"${keyFor(x.id) === ln.cur ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</optgroup>`)
      .join("");
    const known = L().get("curiosity", L().base(ln.cur)) && keyFor(L().base(ln.cur)) === ln.cur;
    return `<select class="sl-pick" data-lane-cur="${esc(ln.cur)}" aria-label="Curiosity on this track" title="${esc(((L().CATEGORIES.find((c) => c.id === cat) || {}).label || "") + (ln.group ? " · " + ln.group : ""))}: change which curiosity this track is">${known ? "" : `<option selected>${esc(labelOf(ln.cur))}</option>`}${opts}</select>`;
  }
  function clipRows() {
    const rows = [];
    prefs.insp.forEach((v) => {
      const f = film(v.film);
      if (!f) return;
      const n = f.beats.length;
      rows.push({ label: filmTitle(f), title: "Inspiration film: its beats stretched over your film", clips: f.beats.map((b, i) => ({ from: i / n, to: (i + 1) / n, text: b.note || b.at || "beat " + (i + 1), title: (b.at || "") + " " + (b.note || ""), cls: "insp" })) });
    });
    const st = E() ? E().state() : null;
    if (st) rows.push({ label: "My film", title: "Your film's moments", clips: st.rows.map((r, i) => ({ from: i / st.rows.length, to: (i + 1) / st.rows.length, text: r.label, cls: "mine" })) });
    return rows;
  }
  function drawTimeline(fromEngine) {
    const box = page.querySelector(".sc-timeline");
    if (!E() || !window.CurioLanes) {
      box.innerHTML = `<p class="sc-note">The timeline needs the engine (engine/load.js).</p>`;
      return;
    }
    const sel = selection();
    const potential =
      prefs.view === "arrange"
        ? `<div class="sc-potential">
          <button type="button" data-act="show-all" class="${prefs.showAll ? "on" : ""}" aria-pressed="${prefs.showAll}">Show all potential curiosities</button>
          <button type="button" data-act="show-suites" class="${prefs.showSuites ? "on" : ""}" aria-pressed="${prefs.showSuites}">Show all potential curiosity suites</button>
          <select data-add-lane aria-label="Add a curiosity track"><option value="">+ Add a curiosity track</option>${L()
            .CATEGORIES.map((c) => `<optgroup label="${esc(c.label)}">${L().curiosities(c.id).map((x) => `<option value="${esc(keyFor(x.id))}">${esc(x.label)}</option>`).join("")}</optgroup>`)
            .join("")}</select>
          ${prefs.showAll ? `<div class="sc-chips">${L().CATEGORIES.map((c) => `<button type="button" data-open-cat="${c.id}" class="${prefs.openCats[c.id] ? "on" : ""}">${esc(c.label)} <small>${mainOnly(L().curiosities(c.id)).length}</small></button>`).join("")}</div>` : ""}
          ${prefs.showSuites ? `<div class="sc-chips">${L().CATEGORIES.map((c) => { const list = L().items("suite", c.id); return list.length ? `<details${list.some((s) => prefs.openSuites[s.id]) ? " open" : ""}><summary>${esc(c.label)} <small>${list.length} suites</small></summary>${list.map((s) => `<button type="button" data-open-suite="${esc(s.id)}" class="${prefs.openSuites[s.id] ? "on" : ""}" title="${esc(s.plain || "")}">${esc(s.label)}</button>`).join("")}</details>` : ""; }).join("")}</div>` : ""}
        </div>`
        : `<p class="sc-tl-h"><strong>Timeline</strong> ${esc(sel.label)}${sel.pairs.length ? ` · ${sel.pairs.length} proximit${sel.pairs.length === 1 ? "y" : "ies"}: <button type="button" data-act="add-prox">Add ${sel.level === "proximitySuite" ? "this proximity suite" : "this proximity"} to my film</button>` : ""}${prefs.lanes.length ? ` · ${prefs.lanes.length} track${prefs.lanes.length === 1 ? "" : "s"} you added <button type="button" data-act="clear-lanes" title="Take the tracks you added off the timeline (their nodes stay in your film)">Clear</button>` : ""}</p>`;
    if (!fromEngine || !lanes) {
      if (lanes) lanes.destroy();
      box.innerHTML = potential + `<div class="sc-lanes"></div>`;
      lanes = window.CurioLanes.mount(box.querySelector(".sc-lanes"), {
        lanes: timelineLanes,
        row: () => row,
        ruler: true,
        clips: clipRows,
        thumbs: () => mineBeats().map((b) => thumb(b.values)),
        beats: () => mineBeats(),
        showLanes: (curs) => (curs.forEach(showLane), save()),
        header: prefs.view === "arrange" ? laneHeader : null,
        onClip: (j) => setRow(j),
        onHover: (j) => setRow(j),
        onOpen: openWin,
        secondsPerMoment,
        range: rangeNow,
        onSelect: (cur) => {
          if (prefs.sel.level === "curiosity" && prefs.sel.id === cur) return;
          if (prefs.view === "screen" && prefs.sel.level !== "curiosity") return;
          prefs.sel = { level: "curiosity", id: cur };
          save();
          drawBar();
          drawViewers();
          drawInspector();
        },
      });
    } else lanes.draw();
  }

  /* ---------- events ---------- */
  function toast(m) {
    let t = page.querySelector(".sc-toast");
    if (!t) {
      t = document.createElement("p");
      t.className = "sc-toast";
      t.setAttribute("role", "status");
      page.appendChild(t);
    }
    t.textContent = m;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.textContent = ""), 5000);
  }
  /* The track a curiosity is read from and written to: the first one with it, except the character matrix's
     curiosities, which every character has on their own track (the one picked in the Character tab). */
  function trackHas(id, st) {
    if (window.CharacterScreen && window.CharacterScreen.claims(id)) return window.CharacterScreen.trackHas(id, st);
    return st.tracks.find((t) => t.curiosities.includes(id));
  }
  function setValue(id, v) {
    return setValues([[id, v]]);
  }
  /* Nodes at the playhead for several curiosities at once (a suite or template dropped in), as one undo step. */
  function setValues(list, label) {
    if (!E()) return { ok: false };
    const st = E().state();
    const r = st.rows[row];
    if (!r) return { ok: false };
    const cmds = [];
    const placed = {};
    let full = false;
    list.forEach(([id, v]) => {
      let track = placed[id] || (trackHas(id, st) || {}).id;
      if (!track) {
        track = window.CurioLanes.trackFor(id, st);
        if (!track) return (full = true);
        cmds.push({ type: "addCuriosity", track, curiosity: id });
      }
      placed[id] = track;
      const val = S().fix(id, v);
      if (val != null) cmds.push({ type: "setPoint", row: r.id, track, curiosity: id, value: val });
    });
    if (full) toast("Every track is full; remove a lane in Arrange first.");
    if (!cmds.length) return { ok: false };
    const one = list.length === 1 ? list[0] : null;
    const res = E().send({ type: "batch", label: label || (one ? `${labelOf(one[0])}: ${S().fix(one[0], one[1])} at moment ${row + 1}` : `${list.length} nodes at moment ${row + 1}`), commands: cmds });
    if (!res.ok) toast(res.error);
    return res;
  }
  /* What the current value of a curiosity is at the playhead in my film. */
  function valueHere(id) {
    const st = E() && E().state();
    const r = st && st.rows[row];
    if (!r) return undefined;
    const t = st.tracks.find((x) => x.curiosities.includes(id));
    return t ? E().value(r.id, t.id, id) : S() ? S().start(id) : undefined;
  }
  /* Maya's channel box colors a channel by its keys; here: a key at this moment, a lane with keys elsewhere, or none. */
  function keyState(id) {
    const st = E() && E().state();
    const r = st && st.rows[row];
    if (!r) return "";
    const t = st.tracks.find((x) => x.curiosities.includes(id));
    const lane = t && st.lanes[t.id + "|" + id];
    if (!lane) return "";
    return lane.points[r.id] != null ? "here" : "lane";
  }
  const showLane = (id) => !prefs.lanes.includes(id) && prefs.lanes.push(id);
  /* A curiosity's settings as tiles, like CapCut's grid of effect thumbnails: every option, or five steps of a range. */
  function tilesOf(id) {
    if (!S() || !S().known(id)) return [];
    const d = S().domain(id);
    if (d.kind === "range") return [0, 0.25, 0.5, 0.75, 1].map((p) => S().at(id, p)).filter((v, i, a) => a.indexOf(v) === i);
    return (d.options || []).slice(0, 18);
  }
  function onClick(e) {
    if (guidesOpen && !e.target.closest(".sc-guides")) {
      guidesOpen = false;
      const m = page.querySelector(".sc-guides-menu");
      if (m) m.remove();
      const b = page.querySelector('[data-act="guides-menu"]');
      if (b) b.setAttribute("aria-expanded", "false");
    }
    const t = e.target.closest("button, [data-scrub], .sc-frame");
    if (!t || !page.contains(t)) return;
    const d = t.dataset;
    if (d.openWin && !t.closest(".sl")) return openWin(d.openWin);
    if (winClick(d, t)) return;
    if (d.ov != null && !e.detail) return jumpTo(Number(d.ov));
    if (d.ov != null) return;
    if (t.matches("[data-scrub]")) {
      const r = t.getBoundingClientRect();
      const fr = Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width));
      return setRow(Math.round(fr * (nRows() - 1)));
    }
    if (d.view) {
      prefs.view = d.view;
      save();
      return drawAll();
    }
    if (d.level) {
      prefs.sel = { level: d.level, id: (L().items(d.level, prefs.cat)[0] || L().items(d.level)[0] || {}).id || "" };
      save();
      return drawAll();
    }
    if (d.lens) {
      prefs.lens = d.lens;
      save();
      drawBar();
      return drawViewers();
    }
    if (d.arr) {
      prefs.arrange = d.arr;
      save();
      return drawAll();
    }
    if (d.focus) {
      prefs.focus = d.focus;
      save();
      drawViewers();
      return drawInspector();
    }
    if (d.wins) {
      const want = Math.max(0, Number(d.wins) - 1);
      while (prefs.insp.length > want) prefs.insp.pop();
      while (prefs.insp.length < want) addInspiration();
      if (!prefs.insp.some((v) => v.id === prefs.focus)) prefs.focus = "mine";
      save();
      return drawAll();
    }
    if (d.remove) {
      prefs.insp = prefs.insp.filter((v) => v.id !== d.remove);
      if (prefs.focus === d.remove) prefs.focus = "mine";
      save();
      return drawAll();
    }
    if (d.libtab) {
      prefs.libTab = prefs.libTab === d.libtab ? "" : d.libtab;
      prefs.search = "";
      save();
      drawLibrary();
      return drawInspector();
    }
    if ("drop" in d && d.drop) {
      showLane(d.drop);
      save();
      const res = setValue(d.drop, d.v);
      if (res && res.ok) toast(`${labelOf(d.drop)}: ${S().fix(d.drop, d.v)} at moment ${row + 1}.`);
      return drawTimeline(), drawLibrary();
    }
    if (d.keyJump) return setRow(Number(d.keyJump));
    if ("key" in d && d.key) {
      /* Maya's Set Key: keep the setting at this moment as a node; on a key already here, take it off. */
      const st = E() && E().state();
      const r = st && st.rows[row];
      if (!r) return;
      const t = st.tracks.find((x) => x.curiosities.includes(d.key));
      if (keyState(d.key) === "here") E().send({ type: "removePoint", row: r.id, track: t.id, curiosity: d.key, label: `Take the key off ${labelOf(d.key)}` });
      else {
        showLane(d.key);
        save();
        setValue(d.key, valueHere(d.key));
        drawTimeline();
      }
      return;
    }
    if (d.icat) {
      prefs.libTab = "";
      prefs.cat = d.icat;
      prefs.search = "";
      save();
      drawLibrary();
      return drawInspector();
    }
    if (d.group) {
      prefs.groups[prefs.libTab || prefs.cat || category().id] = d.group;
      prefs.search = "";
      save();
      return drawLibrary();
    }
    if (d.pickCard) {
      const [level, id] = d.pickCard.split("|");
      prefs.sel = { level, id };
      save();
      return drawAll();
    }
    if (d.addCard) {
      const [level, id] = d.addCard.split("|");
      return addCard(level, id);
    }
    if (d.more) {
      prefs.showFine[d.more] = !prefs.showFine[d.more];
      save();
      return drawInspector();
    }
    if (d.fold) {
      prefs.folds[d.fold] = !prefs.folds[d.fold];
      save();
      return drawInspector();
    }
    if (d.selectCur) {
      prefs.sel = { level: "curiosity", id: d.selectCur };
      save();
      drawBar();
      drawViewers();
      drawInspector();
      return drawTimeline();
    }
    if (d.set && d.v != null) return setValue(d.set, d.v);
    if (d.blend) return blend(d.blend);
    if (d.openCat) {
      prefs.openCats[d.openCat] = !prefs.openCats[d.openCat];
      save();
      return drawTimeline();
    }
    if (d.openSuite) {
      prefs.openSuites[d.openSuite] = !prefs.openSuites[d.openSuite];
      save();
      return drawTimeline();
    }
    const act = d.act;
    if (act === "close") return close();
    if (act === "shortcuts") return showKeys(!keysOpen);
    if (act === "export") return toggleExport();
    if (d.export) return runExport(d.export);
    if (act === "overview") {
      prefs.overview = !prefs.overview;
      save();
      return drawViewers();
    }
    if (act === "ghost") {
      prefs.ghost = !prefs.ghost;
      save();
      return drawViewers();
    }
    if (act === "guides-menu") {
      guidesOpen = !guidesOpen;
      drawViewers();
      const b = page.querySelector('[data-act="guides-menu"]');
      return b && b.focus();
    }
    if (act === "range-clear") return setRange(null);
    if (act === "keys-close") return showKeys(false);
    if (act === "play") return play(!timer);
    if (act === "prev") return setRow(row - 1);
    if (act === "next") return setRow(row + 1);
    if (act === "add-insp") {
      addInspiration();
      save();
      return drawAll();
    }
    if (act === "show-all" || act === "show-suites") {
      const k = act === "show-all" ? "showAll" : "showSuites";
      prefs[k] = !prefs[k];
      save();
      return drawTimeline();
    }
    if (act === "add-prox") return addProximity();
    if (act === "clear-lanes") {
      prefs.lanes = [];
      save();
      return drawTimeline();
    }
  }
  /* A new inspiration viewer, on a film no other viewer shows yet. */
  function addInspiration() {
    const used = new Set(prefs.insp.map((v) => (film(v.film) || {}).id));
    const next = films().find((f) => !used.has(f.id)) || films()[0];
    let n = prefs.insp.length + 1;
    while (prefs.insp.some((v) => v.id === "v" + n)) n++;
    prefs.insp.push({ id: "v" + n, film: next ? next.id : "", takes: {} });
  }
  /* The selected database proximity (or proximity suite) onto my film as lane rules, through the engine's
     own pack import (engine/seeds.js dbPack), adding any lanes it needs. */
  function addProximity() {
    const Eng = E();
    const seeds = window.CurioSeeds;
    if (!Eng || !seeds || !seeds.dbPack) return toast("The engine's link pack is not loaded.");
    const r = Eng.send({ type: "importLinks", pack: seeds.dbPack(), only: [prefs.sel.id], addLanes: true, label: "Add " + selection().label });
    toast(r.ok ? `Added: ${r.added || 0} new, ${r.updated || 0} updated${r.waiting ? ", " + r.waiting + " waiting for lanes" : ""}. They are rules for the whole lane; join nodes in the lanes to pin one to two moments.` : r.error);
  }
  function onChange(e) {
    const t = e.target;
    const d = t.dataset;
    if ("pickLayout" in d) {
      prefs.layout = t.value;
      save();
      return drawAll();
    }
    if ("pickItem" in d) {
      prefs.sel = { level: prefs.sel.level, id: t.value };
      const r = selection();
      if (r.categories[0]) prefs.cat = r.categories[0];
      save();
      return drawAll();
    }
    if (d.film) {
      const v = prefs.insp.find((x) => x.id === d.film);
      if (v) v.film = t.value;
      save();
      drawViewers();
      drawInspector();
      return lanes && lanes.draw();
    }
    if ("guide" in d) {
      setGuide(d.guide, t.checked);
      drawViewers();
      const box = page.querySelector(`.sc-guides-menu [data-guide="${d.guide}"]`);
      return box && box.focus();
    }
    if ("ratio" in d) {
      showLane(RATIO);
      save();
      const res = setValue(RATIO, t.value);
      if (res && res.ok) toast(`Frame shape: ${t.value} at moment ${row + 1}.`);
      return drawTimeline();
    }
    if ("speed" in d) {
      prefs.speed = Number(t.value) || 1;
      save();
      if (timer) play(true);
      return;
    }
    if (d.act === "viewers-in-arrange") {
      prefs.viewersInArrange = t.checked;
      save();
      return drawViewers();
    }
    if (d.take) {
      const v = prefs.insp.find((x) => x.id === prefs.focus);
      if (!v) return;
      v.takes = v.takes || {};
      if (t.checked) v.takes[d.take] = 0.5;
      else delete v.takes[d.take];
      save();
      drawViewers();
      return drawInspector();
    }
    if ("addLane" in d && t.value) {
      if (!prefs.lanes.includes(t.value)) prefs.lanes.push(t.value);
      save();
      return drawTimeline();
    }
    if (d.laneCur) return swapLane(d.laneCur, t.value);
    if (d.set && t.tagName === "SELECT") return t.value && setValue(d.set, t.value);
    if (d.set) return setValue(d.set, Number(t.value));
    if (d.stepSet) {
      const scale = JSON.parse(d.scale);
      return setValue(d.stepSet, scale[Number(t.value)]);
    }
  }
  function onInput(e) {
    const t = e.target;
    const d = t.dataset;
    if ("libSearch" in d) {
      prefs.search = t.value;
      save();
      return drawLibrary();
    }
    if (d.stepSet) {
      const scale = JSON.parse(d.scale);
      const o = t.parentNode.querySelector("output");
      if (o) o.textContent = scale[Number(t.value)];
    } else if (d.set && t.type === "range") {
      const o = t.parentNode.querySelector("output");
      if (o) o.textContent = t.value;
    } else if (d.takeAmt) {
      const v = prefs.insp.find((x) => x.id === prefs.focus);
      if (!v) return;
      v.takes[d.takeAmt] = Number(t.value) / 100;
      const o = t.parentNode.querySelector("output");
      if (o) o.textContent = t.value + "%";
      save();
      const b = page.querySelector(".sc-blend");
      if (b) b.outerHTML = blendHtml();
    }
  }
  /* A track's dropdown changes which curiosity it is: its nodes move to the new curiosity, each kept at the
     same place on its scale (low stays low), as one undo step. */
  function swapLane(oldCur, newCur) {
    if (!newCur || oldCur === newCur) return;
    const Eng = E();
    const st = Eng.state();
    const cmds = [];
    const t = st.tracks.find((x) => x.curiosities.includes(oldCur));
    const lane = t && st.lanes[t.id + "|" + oldCur];
    if (lane) {
      let track = (st.tracks.find((x) => x.curiosities.includes(newCur)) || {}).id;
      if (!track) {
        track = window.CurioLanes.trackFor(newCur, st);
        if (!track) return toast("Every track is full.");
        cmds.push({ type: "addCuriosity", track, curiosity: newCur });
      }
      Object.keys(lane.points).forEach((r) => {
        const p = S().pos(oldCur, lane.points[r]);
        const v = p == null ? null : S().at(newCur, p);
        if (v != null) cmds.push({ type: "setPoint", row: r, track, curiosity: newCur, value: v });
      });
      cmds.push({ type: "clearLane", track: t.id, curiosity: oldCur });
    }
    prefs.lanes = prefs.lanes.filter((c) => c !== oldCur);
    if (!prefs.lanes.includes(newCur)) prefs.lanes.push(newCur);
    if (prefs.sel.level === "curiosity" && prefs.sel.id === oldCur) prefs.sel.id = newCur;
    save();
    if (cmds.length) {
      const r = Eng.send({ type: "batch", label: `Track ${labelOf(oldCur)} becomes ${labelOf(newCur)}`, commands: cmds });
      if (!r.ok) toast(r.error);
    }
    drawAll();
  }
  /* Knobs: drag up or down (or use the arrow keys) to turn. */
  function onKnobDown(e) {
    const k = e.target.closest && e.target.closest("[data-knob]");
    if (!k || k.classList.contains("dis")) return;
    e.preventDefault();
    const min = Number(k.dataset.min);
    const max = Number(k.dataset.max);
    const step = Number(k.dataset.step) || 1;
    const start = Number(k.dataset.val) || min;
    const y0 = e.clientY;
    let val = start;
    const move = (ev) => {
      const dv = Math.round(((y0 - ev.clientY) / 80) * (max - min) / step) * step;
      val = Math.max(min, Math.min(max, start + dv));
      const b = k.querySelector("b");
      if (b) b.textContent = val;
      const ln = k.querySelector("line");
      if (ln) ln.setAttribute("transform", `rotate(${-135 + (270 * (val - min)) / (max - min || 1)} 16 16)`);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (val !== start) setValue(k.dataset.knob, val);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  document.addEventListener("keydown", (e) => {
    const k = e.target && e.target.closest && e.target.closest("[data-knob]");
    if (!k || k.classList.contains("dis") || !/Arrow(Up|Down|Left|Right)/.test(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const step = Number(k.dataset.step) || 1;
    const dir = /Up|Right/.test(e.key) ? 1 : -1;
    const v = Math.max(Number(k.dataset.min), Math.min(Number(k.dataset.max), (Number(k.dataset.val) || 0) + dir * step));
    setValue(k.dataset.knob, v);
  }, true);

  /* ---------- a viewer for any other screen ---------- */
  /* mountViewer(el, { curiosities: [ids], category, film: studyId | "mine" }): a small viewer that plays a film
     with the given curiosities highlighted. Workspaces can call it at their top. */
  function mountViewer(el, opts) {
    opts = opts || {};
    let i = 0;
    let t = null;
    function beats() {
      if (opts.film === "mine") return mineBeats();
      const f = film(opts.film || (prefs.insp[0] && prefs.insp[0].film));
      return f ? f.beats : [];
    }
    function draw() {
      const b = beats();
      if (!b.length || !F()) {
        el.innerHTML = `<p class="sc-note">No film to show yet.</p>`;
        return;
      }
      i = i % b.length;
      const vals = b[i].values || {};
      const cats = opts.category ? [opts.category] : (opts.curiosities || []).map((c) => L().categoryOf(c));
      el.innerHTML = `<div class="sc-mini">${F().svg(vals, { highlight: cats, labels: (opts.curiosities || []).slice(0, 4).map((c) => [labelOf(c), vals[c]]), cast: Number(vals.peopleCount) || castOf() })}<div class="sc-mini-bar"><button type="button" data-m="play">${t ? "Pause" : "Play"}</button><span>${i + 1} / ${b.length}</span><button type="button" data-m="screen">Open the Screen</button></div></div>`;
    }
    el.onclick = (e) => {
      const b = e.target.closest("[data-m]");
      if (!b) return;
      if (b.dataset.m === "play") {
        if (t) clearInterval(t);
        t = t ? null : setInterval(() => ((i += 1), draw()), 1100);
        draw();
      } else open();
    };
    draw();
    return { draw, stop: () => t && clearInterval(t) };
  }

  /* ---------- into the app ---------- */
  function wire() {
    const top = document.querySelector(".tabs-top");
    if (top && !top.querySelector("[data-screen]")) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.screen = "open";
      b.className = "sc-open-btn";
      b.title = "The main screen: inspiration films and your film side by side, the inspector, and the timeline";
      b.textContent = "Screen";
      top.insertBefore(b, top.firstChild);
      b.addEventListener("click", open);
    }
    const menu = document.getElementById("lib-menu");
    if (menu && !menu.querySelector("[data-screen]")) {
      /* On a phone the bar has no room for the Screen button (screen.css hides it), so the Library opens it. */
      const s = document.createElement("button");
      s.type = "button";
      s.dataset.screen = "screen";
      s.innerHTML = "Screen<small>films side by side, the inspector, the timeline</small>";
      menu.insertBefore(s, menu.firstChild);
      s.addEventListener("click", () => {
        menu.hidden = true;
        prefs.view = "screen";
        open();
      });
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.screen = "arrange";
      b.innerHTML = "Arrange<small>every curiosity as a track, left to right</small>";
      menu.insertBefore(b, s.nextSibling);
      b.addEventListener("click", () => {
        menu.hidden = true;
        prefs.view = "arrange";
        open();
      });
    }
    /* The Screen is the default: it opens on start unless you closed it last time (or ?screen=0). */
    /* Automated test runs (navigator.webdriver) skip it too, so other parts' browser tests that click the
       app underneath keep working; ?screen=1 opens it anyway (screen/tests/browser.js uses that). */
    let skip = false;
    try {
      const q = location.search;
      skip = /[?&]screen=0\b/.test(q) || (!!navigator.webdriver && !/[?&]screen=1\b/.test(q));
    } catch (e) {}
    if (prefs.open && !skip) setTimeout(open, 0);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioScreen = { open, close, isOpen: () => !!(page && !page.hidden), openWin, wins: () => wins.map((w) => w.id), mountViewer, state: () => JSON.parse(JSON.stringify(prefs)), blendCommands, guides: { list: () => GUIDES.map(([id, label, tip]) => ({ id, label, tip })), on: guidesOn, spot: guideSpot }, setRow, row: () => row, addPanel, on: (fn) => (typeof fn === "function" && listeners.push(fn), () => listeners.splice(listeners.indexOf(fn) >>> 0, 1)) };
})();
