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
     addPanel({ id, label, place, mount(el) }), removePanel(id), on(fn) -> off() }
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
    compare: { on: false, split: 50, with: "insp" },
    captions: { on: false, mode: "notes" },
    sizes: {},
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
      ["A", "Select mode", "Click a node to pick it, click an empty spot or a line to add one; drag a line to move it; Alt + drag a line to curve it", (e) => plain(e) && !e.shiftKey && key(e, "a"), lk("select")],
      ["B", "Split mode", "Click a lane to cut its line with a node", (e) => plain(e) && !e.shiftKey && key(e, "b"), lk("split")],
      ["[", "Select leftward", "Pick the node to the left (CapCut picks every clip to the left)", (e) => plain(e) && !e.shiftKey && e.key === "[", lk("left")],
      ["]", "Select rightward", "Pick the node to the right", (e) => plain(e) && !e.shiftKey && e.key === "]", lk("right")],
      ["P", "Main track magnet", "Moving a node moves every later node in its lane too", (e) => plain(e) && key(e, "p"), lk("magnet")],
      ["N", "Auto snapping", "A node dropped next to a marker lands on it", (e) => plain(e) && key(e, "n"), lk("snap")],
      ["~", "Linkage switch", "Joined nodes move and copy together (on) or alone (off)", (e) => plain(e) && (e.key === "~" || e.key === "`"), lk("linkage")],
      ["S", "Preview axis switch", "Hover over the timeline to see that moment in the player", (e) => plain(e) && !e.shiftKey && key(e, "s"), lk("skim")],
      ["M", "Add marker", "Put a marker on the playhead's moment (again to take it off)", (e) => plain(e) && key(e, "m"), lk("marker")],
      ["⇧[", "Previous marker", "Move the playhead back to the marker before it", (e) => plain(e) && e.shiftKey && (e.key === "{" || e.code === "BracketLeft"), lk("prevMarker")],
      ["⇧]", "Next marker", "Move the playhead on to the next marker", (e) => plain(e) && e.shiftKey && (e.key === "}" || e.code === "BracketRight"), lk("nextMarker")],
      ["⌘+", "Zoom in", "Wider moments on the timeline", (e) => mod(e) && !e.altKey && (e.key === "=" || e.key === "+"), lk("zoomIn")],
      ["⌘−", "Zoom out", "Narrower moments on the timeline", (e) => mod(e) && !e.altKey && (e.key === "-" || e.key === "_"), lk("zoomOut")],
      ["⇧Z", "Zoom to fit timeline", "The whole film fits the timeline", (e) => plain(e) && e.shiftKey && key(e, "z"), lk("zoomFit")],
      ["J", "Shuttle left", "Play backward; press again to go faster", (e) => plain(e) && key(e, "j"), () => shuttle(-1)],
      ["K", "Shuttle stop", "Stop playing", (e) => plain(e) && key(e, "k"), () => play(false)],
      ["L", "Shuttle right", "Play forward; press again to go faster", (e) => plain(e) && key(e, "l"), () => shuttle(1)],
      ["Q", "Delete left", "Remove the picked lane's nodes before the playhead", (e) => plain(e) && key(e, "q"), lk("deleteLeft")],
      ["W", "Delete right", "Remove the picked lane's nodes after the playhead", (e) => plain(e) && key(e, "w"), lk("deleteRight")],
      /* Ripple (CapCut's Split and Delete with the main track magnet, for whole moments). e.code, because Option
         changes e.key on a Mac (⌥M types µ). */
      ["⌥M", "Add a moment here", "Put a copy of the playhead's moment right after it, so nothing jumps; everything after slides one moment later", (e) => e.altKey && !mod(e) && !e.shiftKey && e.code === "KeyM", () => ripple("add")],
      ["⇧⌥M", "Duplicate moments", "Copy the stretch selected on the timeline (or the playhead's moment) right after itself; everything after slides later", (e) => e.altKey && e.shiftKey && !mod(e) && e.code === "KeyM", () => ripple("duplicate")],
      ["⌥⌫", "Take out moments", "Take out the playhead's moment (or the selected stretch) and close the gap; everything after slides earlier", (e) => e.altKey && !mod(e) && !e.shiftKey && (e.key === "Backspace" || e.key === "Delete"), () => ripple("delete")],
      ["⇧⌥K", "Add keyframe", "Add a node at the playhead on the picked lane (a node is a keyframe)", (e) => e.altKey && e.shiftKey && !mod(e) && e.code === "KeyK", lk("splitHere")],
      ["⇧↩ or I", "In", "Start the play range at the playhead, so Play loops over a part (Maya's playback range)", (e) => !mod(e) && ((e.shiftKey && e.key === "Enter") || (plain(e) && !e.shiftKey && key(e, "i"))), () => setRange("in")],
      ["O", "Out", "End the play range at the playhead (not in CapCut's list; most editors use it)", (e) => plain(e) && !e.shiftKey && key(e, "o"), () => setRange("out")],
      ["⌥X", "Clear the range", "Play the whole film again", (e) => e.altKey && !mod(e) && e.code === "KeyX", () => setRange(null)],
      ["G", "Ghosts", "See the moments before and after faintly (Maya's ghosting); not in CapCut", (e) => plain(e) && !e.shiftKey && key(e, "g"), () => ((prefs.ghost = !prefs.ghost), save(), drawViewers())],
      /* e.code, because Option changes e.key on a Mac (⌥K types ˚). */
      ["⌥K", "Show/hide keyframe panel", "Open or fold the picked lane's automation group: a lane for each setting in its window", (e) => e.altKey && !e.shiftKey && !mod(e) && e.code === "KeyK", lk("subs")],
      /* CapCut lists these four with the keyframe keys; Ease in, Ease out and Easing have no key there either. They
         do something here (test null: not faded), from a click or a right-click. */
      ["⇧ click", "Add keyframe on keyframe panel", "A click on a lane in the open automation group (⌥K) adds a node there, with or without ⇧", null],
      ["(none)", "Ease in", "Right-click a ◇ keyframe on a curiosity's lane, or a line, and pick Ease in", null],
      ["(none)", "Ease out", "Right-click a ◇ keyframe on a curiosity's lane, or a line, and pick Ease out", null],
      ["(none)", "Easing", "Right-click a ◇ keyframe on a curiosity's lane, or a line, and pick Ease in and out", null],
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
      /* e.code, because Option changes e.key on a Mac (⌥C types ç). */
      ["⌥⌘C", "Copy this moment's look", "Copy every setting My film plays at the playhead's moment (Copy attributes for a whole moment)", (e) => mod(e) && e.altKey && !e.shiftKey && e.code === "KeyC", () => lookCopy()],
      ["⌥⌘V", "Paste the look here", "Give the playhead's moment the copied look, or the whole stretch selected on the timeline", (e) => mod(e) && e.altKey && !e.shiftKey && e.code === "KeyV", () => lookPaste(curArea() ? "stretch" : "here")],
      ["⌫", "Delete", "Remove the picked node", (e) => plain(e) && (e.key === "Backspace" || e.key === "Delete"), lk("delete")],
      ["⌘Z", "Undo", "Undo the last change to your film", (e) => mod(e) && !e.shiftKey && key(e, "z"), () => undoAll("undo")],
      ["⇧⌘Z", "Reset (redo)", "Redo what you undid", (e) => mod(e) && e.shiftKey && key(e, "z"), () => undoAll("redo")],
      ["?", "Shortcuts", "Show or hide this list", (e) => !mod(e) && e.key === "?", () => showKeys(!keysOpen)],
      /* Quick find (the 🔍 in the top bar): handled first by its own listener, so it works while typing in a box too. */
      ["⌘K", "Quick find", "Find a curiosity, a suite, an action or a marker by typing a few words (Ctrl+K on Windows)", (e) => FIND.isKey(e), () => toggleFind()],
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
    const was = row;
    row = Math.max(0, Math.min(nRows() - 1, j | 0));
    trMoved(was, row); /* a transition plays when the playhead steps across a join */
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
    tell(); /* screen/triggers.js puts a performance back when playback stops */
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
    takeOpenSnap();
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
      <section class="sc-lib sc-panel" aria-label="Curiosity library"><div class="sc-icons-wrap"><button type="button" class="sc-icons-arr" data-icons-scroll="-1" tabindex="-1" aria-label="Scroll the categories left" title="More categories to the left" hidden>‹</button><nav class="sc-icons" aria-label="Categories"></nav><button type="button" class="sc-icons-arr" data-icons-scroll="1" tabindex="-1" aria-label="Scroll the categories right" title="More categories to the right" hidden>›</button></div><div class="sc-lib-body"><div class="sc-side"></div><div class="sc-grid"></div></div></section>
      <section class="sc-player sc-panel" aria-label="Player"><header class="sc-ph"></header><div class="sc-viewers"></div><div class="sc-overview" aria-label="Whole film"></div><div class="sc-transport"></div></section>
      <aside class="sc-inspector sc-panel" aria-label="Details"></aside>
      <div class="sc-timeline sc-panel"></div></div>`;
    document.body.appendChild(page);
    /* Undo for the view reads it before each gesture, so it listens first; then the borders between panels. */
    vuWire();
    splitsWire();
    page.addEventListener("keydown", winGripKey);
    trWire();
    txtWire();
    page.addEventListener("click", onClick);
    page.addEventListener("change", onChange);
    page.addEventListener("input", onInput);
    page.addEventListener("input", (e) => faces() && faces().input && faces().input(e, faceHelpers(mineCtx())));
    page.addEventListener("pointerdown", onKnobDown);
    if (faces() && faces().attach) faces().attach(faceApi());
    /* Esc closes the transport's ⋯ More or Captions ▾ menu and gives the focus back to its button. */
    page.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !trPop || !e.target.closest || !e.target.closest(".sc-transport")) return;
      e.preventDefault();
      e.stopPropagation();
      toggleTrPop(trPop, false);
    });
    page.addEventListener("keydown", (e) => faces() && faces().keydown && faces().keydown(e, faceHelpers(mineCtx()), faceApi()));
    page.addEventListener("pointerdown", (e) => onWinGrip(e) || onWinDrag(e) || onPad(e) || (faces() && faces().pointer(e, faceApi())) || onOverviewDrag(e) || onCompareDrag(e));
    ["click", "change", "input", "keyup"].forEach((t) => page.addEventListener(t, capSoon));
    page.addEventListener("scroll", (e) => e.target.classList && e.target.classList.contains("sl-scroll") && showTimelineWindow(), true);
    /* Undo and redo go to the app-wide undo list when the page has one (engine/store.js), so one ⌘Z undoes one
       step of anything. Caught first, on the window, so the app's own ⌘Z handler does not undo a second step. */
    window.addEventListener("keydown", (e) => {
      if (page.hidden || !mod(e) || e.altKey || inToolWindow(e)) return;
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
      if (page.hidden || inToolWindow(e)) return;
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
    sizesApply();
    tell();
  }
  /* Side panels other threads dock into the Screen (the momentum meter beside the Player):
     addPanel({ id, label, place: "player" | "under" | "details" | "timeline", mount(el) }). The Screen owns where they go;
     each is mounted once into its own element and kept across redraws. on(fn) is told after every redraw and
     every playhead move. */
  const panels = [];
  const listeners = [];
  const PLACE = { player: ".sc-player", under: ".sc-player", details: ".sc-inspector", timeline: ".sc-timeline" };
  /* Panels docked beside the Player stack top to bottom in one column the Screen owns (.sc-docks), in the order
     they were added, so two panels never fight over the Player's grid or sit on top of each other. */
  function dockHost(place) {
    const host = page.querySelector(PLACE[place] || PLACE.player);
    if (!host || (PLACE[place] || PLACE.player) !== PLACE.player) return host;
    /* "under": a full-width strip under the Player, for a slim bar whose panel floats (the 3D actors). */
    const cls = place === "under" ? "sc-under" : "sc-docks";
    let col = host.querySelector(":scope > ." + cls);
    if (!col) {
      col = document.createElement("div");
      col.className = cls;
      host.appendChild(col);
    }
    return col;
  }
  function placePanels() {
    if (!page) return;
    panels.forEach((p) => {
      const host = dockHost(p.place);
      if (!host) return;
      if (!p.el) {
        p.el = document.createElement("div");
        p.el.className = "sc-dock";
        p.el.dataset.panel = p.id;
        p.el.setAttribute("aria-label", p.label || p.id);
      }
      if (p.el.parentNode !== host) {
        host.appendChild(p.el);
        if (host.classList.contains("sc-docks")) host.parentNode.classList.add("sc-has-dock");
        else if (!host.classList.contains("sc-under")) host.classList.add("sc-has-dock");
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
  function removePanel(id) {
    const i = panels.findIndex((p) => p.id === id);
    if (i < 0) return false;
    const [p] = panels.splice(i, 1);
    if (p.el) p.el.remove();
    return true;
  }
  function tell() {
    listeners.forEach((fn) => {
      try {
        fn({ row, rows: nRows(), playing: !!timer });
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
    const histFocus = historyFocusKey();
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
      <button type="button" data-act="find" class="sc-find-b" aria-haspopup="dialog" aria-expanded="${findOpen}" title="Find anything: a curiosity, a suite, an action or a marker (${findKeyName()})" aria-label="Quick find (${findKeyName()})">🔍</button>
      <button type="button" data-act="shortcuts" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts"><svg class="sc-ico" viewBox="0 0 20 20" aria-hidden="true"><rect x="1.5" y="5" width="17" height="10" rx="1.5"/><path d="M5 8h1M8 8h1M11 8h1M14 8h1M5 11.5h10"/></svg> Shortcuts</button>
      ${exportMenuHtml()}
      ${historyMenuHtml()}
      ${window.CurioTriggers ? window.CurioTriggers.barHtml() : ""}
      <button type="button" data-act="close" class="sc-close">Back to the app</button>
      <p class="sc-what">${esc(sel.label)}${sel.plain ? ": " + esc(sel.plain) : ""}</p>`;
    if (histFocus) historyRefocus(histFocus);
    /* An engine undo redraws before the app-wide list has moved its step, so look again once it has. */
    if (historyOpen) setTimeout(() => drawHistory(), 0);
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
      /* Transitions: a "Transition in" column (how the moment before hands over to this one) once any join has one. */
      const tr = moments.some((m) => m.transition);
      /* Words on the frame: a "Text" column (every text that shows on the moment) once any moment has one. */
      const tx = moments.some((m) => m.text);
      const head = ["Moment", "Time", "Marker note"].concat(tr ? ["Transition in"] : [], tx ? ["Text"] : [], keys.map((k) => o.label(k)));
      const rows = moments.map((m) => [m.n, m.clock || "", m.note || ""].concat(tr ? [m.n > 1 ? m.transition || "Cut" : ""] : [], tx ? [m.text || ""] : [], keys.map((k) => (m.values && m.values[k] != null && m.values[k] !== "" ? text(k, m.values[k]) : ""))));
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
  ${m.transition ? `<p class="tr">Comes in with: ${html(m.transition)}</p>` : ""}${m.text ? `<p class="tx">On the frame: ${html(m.text)}</p>` : ""}<p class="ch">${m.changes ? html(m.changes) : m.n === 1 ? "Where the film starts." : "Nothing changes from the moment before."}</p></figcaption>
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
  .tr { margin: 3px 0 0; color: #0e7490; font-size: 12px; font-weight: 600; }
  .tx { margin: 3px 0 0; color: #7c2d12; font-size: 12px; }
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

  /* ---------- a curiosity row's ⋯ menu (CapCut's "Apply to all" and Reset in Details) ----------
     Pure command builders, one undo step each, so the tests can check them with no page. st is the engine state,
     track and cur name the lane, v is the setting to keep. add: the curiosity is not on the track yet, so it is
     put there first. Each returns { cmds, ... } or { error } in plain words. */
  const APPLY = (() => {
    const laneOf = (st, track, cur) => (track && st.lanes[track + "|" + cur]) || null;
    const pointRows = (st, lane) => (lane ? st.rows.map((r, j) => (lane.points[r.id] != null ? j : -1)).filter((j) => j >= 0) : []);
    const say = (cur) => (window.CurioScale && window.CurioScale.label ? window.CurioScale.label(cur) : cur);
    /* One node at the first moment with setting v, every other node off, and the lane set to Jump so it stays flat. */
    function allFilm(st, track, cur, v, add) {
      if (!st.rows.length) return { error: "Your film has no moments yet." };
      if (v == null) return { error: `${say(cur)} has no setting at the playhead to use.` };
      const lane = laneOf(st, track, cur);
      const cmds = add ? [{ type: "addCuriosity", track, curiosity: cur }] : [];
      cmds.push({ type: "setPoint", row: st.rows[0].id, track, curiosity: cur, value: v });
      const gone = pointRows(st, lane).filter((j) => j > 0);
      gone.forEach((j) => cmds.push({ type: "removePoint", row: st.rows[j].id, track, curiosity: cur }));
      cmds.push({ type: "laneMode", track, curiosity: cur, mode: "hold" });
      return { cmds, removed: gone.length };
    }
    /* Setting v held from moment j0 to moment j1: nodes at both ends, the nodes between them off. */
    function stretch(st, track, cur, v, j0, j1, add) {
      const a = Math.max(0, Math.min(j0, j1));
      const b = Math.min(st.rows.length - 1, Math.max(j0, j1));
      if (!(b >= a) || !st.rows[a]) return { error: "Select a stretch of moments on the timeline first." };
      if (v == null) return { error: `${say(cur)} has no setting at the playhead to use.` };
      const lane = laneOf(st, track, cur);
      const cmds = add ? [{ type: "addCuriosity", track, curiosity: cur }] : [];
      cmds.push({ type: "setPoint", row: st.rows[a].id, track, curiosity: cur, value: v });
      if (b > a) cmds.push({ type: "setPoint", row: st.rows[b].id, track, curiosity: cur, value: v });
      const gone = pointRows(st, lane).filter((j) => j > a && j < b);
      gone.forEach((j) => cmds.push({ type: "removePoint", row: st.rows[j].id, track, curiosity: cur }));
      return { cmds, removed: gone.length, from: a, to: b };
    }
    /* Back to how the scene starts: the nodes after the first moment off. When the first moment has no node of its
       own, one is put there with the setting it plays now (start), so the start looks the same afterwards. */
    function reset(st, track, cur, start) {
      const lane = laneOf(st, track, cur);
      const at = pointRows(st, lane);
      const gone = at.filter((j) => j > 0);
      if (!gone.length) return { error: `${say(cur)} already stays as it starts, so there is nothing to reset.` };
      const cmds = [];
      if (!at.includes(0) && start != null) cmds.push({ type: "setPoint", row: st.rows[0].id, track, curiosity: cur, value: start });
      gone.forEach((j) => cmds.push({ type: "removePoint", row: st.rows[j].id, track, curiosity: cur }));
      return { cmds, removed: gone.length };
    }
    /* Every node off the lane. */
    function clear(st, track, cur) {
      const lane = laneOf(st, track, cur);
      if (!lane) return { error: `${say(cur)} has no nodes, so there is nothing to clear.` };
      return { cmds: [{ type: "clearLane", track, curiosity: cur }], removed: pointRows(st, lane).length };
    }
    return { allFilm, stretch, reset, clear };
  })();
  window.CurioScreenApply = APPLY;

  /* ---------- a moment's look (CapCut's Copy attributes and Paste attributes, for a whole moment) ----------
     Copy takes every setting My film plays at one moment, after the engine's rewrite (the same values Details
     shows), for every curiosity on a track in the film. Paste writes those settings as nodes at another moment,
     or over a selected stretch, as one undo step. Pure: h holds what needs the engine or the page, so the tests
     can check it with no page:
       value(rowId, trackId, cur)  what plays there      trackOf(cur)  the track it is on now, or null
       trackFor(cur)  the track it would go on            locked(laneKey)  true when the lane is locked
       fix(cur, v)  v snapped to the curiosity's scale     start(cur)  where its scale starts
       known(cur)  true when the engine knows it           limit  how many curiosities a track holds
       perTrack  true: a curiosity on several tracks pastes each track's own setting (copy keeps them in byTrack) */
  const LOOK = (() => {
    const same = (h, cur, a, b) => a != null && b != null && String(h.fix(cur, a)) === String(h.fix(cur, b));
    /* -> { from, row, values: { cur: setting } } or { error } */
    function copy(st, j, h) {
      const r = st.rows[j];
      if (!r) return { error: "Your film has no moment there to copy." };
      const values = {};
      st.tracks.forEach((t) =>
        t.curiosities.forEach((cur) => {
          if (cur in values || !h.known(cur)) return;
          const track = h.trackOf(cur);
          if (!track) return;
          const v = h.fix(cur, h.value(r.id, track, cur));
          if (v != null) values[cur] = v;
        })
      );
      const n = Object.keys(values).length;
      if (!n) return { error: `Moment ${j + 1} has no settings to copy yet.` };
      /* A curiosity on several tracks (one per character) keeps each track's own setting too, by lane key, so
         pasting gives every track back its own; values keeps the one Details shows. */
      const byTrack = {};
      Object.keys(values).forEach((cur) => {
        const on = st.tracks.filter((t) => t.curiosities.includes(cur));
        if (on.length < 2) return;
        on.forEach((t) => {
          const v = h.fix(cur, h.value(r.id, t.id, cur));
          if (v != null) byTrack[t.id + "|" + cur] = v;
        });
      });
      const out = { from: j, row: r.id, values, count: n };
      if (Object.keys(byTrack).length) out.byTrack = byTrack;
      return out;
    }
    /* The look onto moments a to b (a === b: one moment). One moment gets a node per setting that differs. A stretch
       gets, per lane that does not already play the setting all the way through, a node at its first and its last
       moment with the nodes between them taken off, so it holds there whatever the lane's mode (two equal nodes
       play flat in Glide, Smooth and Jump alike). A setting that already plays there is left alone.
       -> { cmds, changed: [cur], matched: [cur], locked: [cur], full: [cur], added: [cur], from, to } or { error } */
    function paste(st, look, a, b, h) {
      if (!look || !look.values || !Object.keys(look.values).length) return { error: "Copy a moment's look first." };
      const from = Math.max(0, Math.min(a, b));
      const to = Math.min(st.rows.length - 1, Math.max(a, b));
      if (!st.rows[from] || to < from) return { error: "Your film has no moment there to paste onto." };
      const out = { cmds: [], changed: [], matched: [], locked: [], full: [], added: [], from, to };
      const adds = {};
      const roomOn = (track) => {
        const t = st.tracks.find((x) => x.id === track);
        return !!t && t.curiosities.length + (adds[track] || 0) < (h.limit || Infinity);
      };
      const sets = [];
      const removes = [];
      /* With h.perTrack, each track gets its own setting back where the look kept one (byTrack) and the track still
         carries the curiosity; such a curiosity counts once, changed when any of its lanes changed. */
      const tracksNow = (cur) => st.tracks.filter((t) => t.curiosities.includes(cur)).map((t) => t.id);
      Object.keys(look.values).forEach((cur) => {
        if (!h.known(cur)) return;
        const own = look.byTrack && h.perTrack ? tracksNow(cur).filter((t) => look.byTrack[t + "|" + cur] != null) : [];
        if (own.length > 1) {
          const rs = own.map((t) => one(cur, look.byTrack[t + "|" + cur], t));
          if (rs.includes("changed")) out.changed.push(cur);
          if (rs.includes("locked")) out.locked.push(cur);
          if (!rs.includes("changed") && !rs.includes("locked") && rs.includes("matched")) out.matched.push(cur);
          return;
        }
        const r = one(cur, look.values[cur], null);
        if (r && out[r]) out[r].push(cur);
      });
      /* One lane: "changed", "matched", "locked", "full" or "" (nothing to write). */
      function one(cur, value, onTrack) {
        const v = h.fix(cur, value);
        if (v == null) return "";
        let track = onTrack || h.trackOf(cur);
        const on = !!track;
        const plays = (j) => (on ? h.value(st.rows[j].id, track, cur) : h.start(cur));
        let all = true;
        for (let j = from; j <= to && all; j++) all = same(h, cur, plays(j), v);
        if (all) return "matched";
        if (!on) {
          track = h.trackFor(cur);
          if (!track || !roomOn(track)) return "full";
        }
        if (h.locked(track + "|" + cur)) return "locked";
        if (!on) {
          adds[track] = (adds[track] || 0) + 1;
          out.cmds.push({ type: "addCuriosity", track, curiosity: cur });
          out.added.push(cur);
        }
        sets.push({ type: "setPoint", row: st.rows[from].id, track, curiosity: cur, value: v });
        if (to > from) sets.push({ type: "setPoint", row: st.rows[to].id, track, curiosity: cur, value: v });
        const lane = on ? st.lanes[track + "|" + cur] : null;
        if (lane) for (let j = from + 1; j < to; j++) if (lane.points[st.rows[j].id] != null) removes.push({ type: "removePoint", row: st.rows[j].id, track, curiosity: cur });
        return "changed";
      }
      /* Sets before removes, so a lane never empties on the way. */
      out.cmds = out.cmds.concat(sets, removes);
      return out;
    }
    /* What is kept in sessionStorage, checked on the way back in. */
    function clean(x) {
      if (!x || typeof x !== "object" || !x.values || typeof x.values !== "object" || Array.isArray(x.values)) return null;
      const values = {};
      Object.keys(x.values).forEach((k) => {
        const v = x.values[k];
        if (typeof v === "string" || (typeof v === "number" && isFinite(v)) || typeof v === "boolean") values[k] = v;
      });
      const n = Object.keys(values).length;
      if (!n) return null;
      const out = { from: Math.max(0, Math.floor(Number(x.from)) || 0), row: typeof x.row === "string" ? x.row : "", values, count: n };
      if (x.byTrack && typeof x.byTrack === "object" && !Array.isArray(x.byTrack)) {
        const byTrack = {};
        Object.keys(x.byTrack).forEach((k) => {
          const v = x.byTrack[k];
          if (/^[^|]+\|[^|]+$/.test(k) && k.split("|")[1] in values && (typeof v === "string" || (typeof v === "number" && isFinite(v)) || typeof v === "boolean")) byTrack[k] = v;
        });
        if (Object.keys(byTrack).length) out.byTrack = byTrack;
      }
      return out;
    }
    return { copy, paste, clean };
  })();
  window.CurioScreenLook = LOOK;

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
    const menu = box.querySelector(".sc-export-menu");
    menu.hidden = !exportOpen;
    /* When the button has wrapped to the left of the bar, open the menu rightwards so it stays on screen. */
    menu.classList.toggle("sc-flip", exportOpen && box.getBoundingClientRect().right < menu.offsetWidth + 16);
    box.querySelector(".sc-export-b").setAttribute("aria-expanded", String(exportOpen));
    if (exportOpen && !toggleExport.wired) {
      /* Close on a click anywhere else, or Esc. */
      toggleExport.wired = true;
      document.addEventListener("pointerdown", (e) => exportOpen && !(e.target.closest && e.target.closest(".sc-export")) && toggleExport(false), true);
      document.addEventListener("keydown", (e) => exportOpen && e.key === "Escape" && toggleExport(false));
    }
  }
  /* ---------- History ▾ (the History panel of editing apps) ----------
     Lists the steps you can undo (newest first, under "Now") and the steps you can redo (over "Now"), by their
     plain names. It reads the app-wide undo list when the page has one (engine/store.js), else the engine's own.
     Clicking a step goes back or forward to just after it by pressing undo or redo that many times through
     undoAll, the same path as ⌘Z. The pure part (HISTORY) takes plain lists so tests can check it with no page. */
  const HISTORY_MAX = 30;
  const HISTORY = {
    /* A step's plain name: the engine's steps join the app-wide list as "Engine: <name>". */
    plain: (label) => String(label == null ? "" : label).replace(/^Engine:\s*/, "").trim() || "Change",
    /* h = { undo: [names, oldest first], redo: [names, next one first] } (both lists' own shape) -> what to draw:
       undo: newest first, each with how many undos go back to just after it (0 for the newest: you are there);
       redo: the furthest first, each with how many redos go forward to just after it (1 for the next one);
       earlier and later: steps past the last `max` that are not shown; all: every undo step. */
    rows(h, max) {
      const n = max > 0 ? Math.floor(max) : HISTORY_MAX;
      const u = (h && Array.isArray(h.undo) ? h.undo : []).slice().reverse();
      const r = h && Array.isArray(h.redo) ? h.redo : [];
      return {
        undo: u.slice(0, n).map((l, i) => ({ label: HISTORY.plain(l), steps: i })),
        redo: r.slice(0, n).map((l, i) => ({ label: HISTORY.plain(l), steps: i + 1 })).reverse(),
        earlier: Math.max(0, u.length - n),
        later: Math.max(0, r.length - n),
        all: u.length,
      };
    },
  };
  window.CurioScreenHistory = HISTORY;
  function historyNow() {
    const St = window.CurioStore;
    if (St && typeof St.external === "function" && typeof St.history === "function") return St.history();
    return E() && typeof E().history === "function" ? E().history() : { undo: [], redo: [] };
  }
  let historyOpen = false;
  let historyLeft = false; /* the menu opens rightward when its button sits in the left half of the bar */
  let historyTimer = 0;
  let historySig = "";
  const nSteps = (k) => `${k} ${k === 1 ? "step" : "steps"}`;
  function historyBody() {
    const h = HISTORY.rows(historyNow());
    historySig = JSON.stringify(h);
    if (!h.undo.length && !h.redo.length) return `<p class="sc-hist-empty">Nothing to undo yet.</p>`;
    const item = (dir, x) => `<button type="button" role="menuitem" data-hist="${dir}:${x.steps}" title="${dir === "undo" ? "Go back" : "Go forward"} ${nSteps(x.steps)}, to just after this">${esc(x.label)}</button>`;
    let out = "";
    if (h.redo.length) {
      out += `<p class="sc-k sc-hist-h">Can redo</p>`;
      if (h.later) out += `<p class="sc-hist-more">and ${h.later} later</p>`;
      out += h.redo.map((x) => item("redo", x)).join("");
    }
    out += `<p class="sc-hist-now" role="separator">Now</p>`;
    if (!h.undo.length) return out + `<p class="sc-hist-empty">Nothing left to undo.</p>`;
    out += `<p class="sc-k sc-hist-h">Can undo</p>`;
    out += h.undo.map((x) => (x.steps ? item("undo", x) : `<p class="sc-hist-cur" aria-current="step" title="Your film is just after this step">${esc(x.label)}</p>`)).join("");
    if (h.earlier) out += `<p class="sc-hist-more">and ${h.earlier} earlier</p>`;
    else out += `<button type="button" role="menuitem" data-hist="undo:${h.all}" class="sc-hist-start" title="Go back ${nSteps(h.all)}, to before every change listed">Before all of these</button>`;
    return out;
  }
  function historyMenuHtml() {
    return `<span class="sc-hist"><button type="button" data-act="history" class="sc-hist-b" aria-haspopup="true" aria-expanded="${historyOpen}" title="Every change you can undo or redo. Click one to go back or forward to just after it.">History ▾</button>
      <div class="sc-hist-menu${historyLeft ? " sc-hist-left" : ""}" role="menu" aria-label="History"${historyOpen ? "" : " hidden"}>${historyOpen ? historyBody() : ""}</div></span>`;
  }
  /* The menu's own list, redrawn only when the history changed (so focus and scrolling stay put otherwise). */
  function drawHistory(force) {
    const m = page && page.querySelector(".sc-hist-menu");
    if (!m || !historyOpen) return;
    const sig = JSON.stringify(HISTORY.rows(historyNow()));
    if (!force && sig === historySig && m.childElementCount) return;
    const key = historyFocusKey();
    m.innerHTML = historyBody();
    if (key) historyRefocus(key);
  }
  /* Which menu item has focus, so a redraw can give it back ("menu" when the item is gone). */
  function historyFocusKey() {
    const a = document.activeElement;
    if (!historyOpen || !a || !a.closest || !a.closest(".sc-hist")) return "";
    return a.dataset && a.dataset.hist ? a.dataset.hist : a.dataset && a.dataset.act === "history" ? "button" : "menu";
  }
  function historyRefocus(key) {
    const box = page && page.querySelector(".sc-hist");
    if (!box) return;
    const el = key === "button" ? box.querySelector(".sc-hist-b") : box.querySelector(`[data-hist="${key}"]`) || box.querySelector("[data-hist]") || box.querySelector(".sc-hist-b");
    if (el) el.focus();
  }
  function toggleHistory(on, keyboard) {
    historyOpen = on == null ? !historyOpen : !!on;
    const box = page && page.querySelector(".sc-hist");
    clearInterval(historyTimer);
    historyTimer = 0;
    if (!box) return;
    const m = box.querySelector(".sc-hist-menu");
    m.hidden = !historyOpen;
    box.querySelector(".sc-hist-b").setAttribute("aria-expanded", String(historyOpen));
    if (!historyOpen) return;
    if (exportOpen) toggleExport(false);
    const r = box.getBoundingClientRect();
    historyLeft = r.left + r.width / 2 < window.innerWidth / 2;
    m.classList.toggle("sc-hist-left", historyLeft);
    drawHistory(true);
    /* Steps from parts of the app that do not redraw the Screen (the app-wide list) show up while it is open. */
    historyTimer = setInterval(() => (!historyOpen || !page || page.hidden ? toggleHistory(false) : drawHistory()), 400);
    if (keyboard) historyRefocus("menu");
    if (!toggleHistory.wired) {
      /* Close on a click anywhere else, or Esc (focus goes back to the button); arrows move through the steps. */
      toggleHistory.wired = true;
      document.addEventListener("pointerdown", (e) => historyOpen && !(e.target.closest && e.target.closest(".sc-hist")) && toggleHistory(false), true);
      document.addEventListener("keydown", (e) => {
        if (!historyOpen || !page || page.hidden) return;
        const inMenu = e.target && e.target.closest && e.target.closest(".sc-hist");
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          toggleHistory(false);
          if (inMenu) page.querySelector(".sc-hist-b").focus();
          return;
        }
        if (!inMenu) return;
        const list = [...page.querySelectorAll(".sc-hist-menu [data-hist]")];
        if (!list.length) return;
        const i = list.indexOf(document.activeElement);
        const to = e.key === "ArrowDown" ? (i + 1) % list.length : e.key === "ArrowUp" ? (i <= 0 ? list.length - 1 : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -1;
        if (to < 0) return;
        e.preventDefault();
        e.stopPropagation();
        list[to].focus();
      }, true);
    }
  }
  /* "undo:3" or "redo:2": press undo or redo that many times, exactly like ⌘Z, and say what happened. */
  function historyPick(spec) {
    const [dir, k] = String(spec).split(":");
    const want = Math.max(0, Math.floor(Number(k)) || 0);
    if (dir !== "undo" && dir !== "redo") return;
    const before = HISTORY.rows(historyNow());
    const target = dir === "undo" ? before.undo.find((x) => x.steps === want) : before.redo.find((x) => x.steps === want);
    let done = 0;
    while (done < want && undoAll(dir)) done++;
    drawHistory(true);
    historyRefocus("menu");
    const way = dir === "undo" ? "back" : "forward";
    if (!done) return toast(dir === "undo" ? "There was nothing to undo." : "There was nothing to redo.");
    toast(done < want ? `Went ${way} ${done} of ${nSteps(want)}; the rest could not be ${dir === "undo" ? "undone" : "redone"}.` : `Went ${way} ${nSteps(done)}${target ? `, to just after "${target.label}"` : ", to before every change listed"}.`);
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
      const tr = i ? trAt(i + 1) : null;
      const texts = TEXT.at(txtData(), i + 1);
      return { n: i + 1, clock: tc(i), values, raw: b.values, note: mk ? mk.note || "" : "", color: mk ? mk.color : "", label: b.note && !/^moment \d+$/i.test(b.note) ? b.note : "", transition: tr && tr.kind !== "cut" ? TRANSITIONS.label(tr) : "", texts, text: TEXT.csvText(texts) };
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
          svg: txtPaint(EXPORT.frameSvg(F().svg(m.raw, Object.assign({ title: "Moment " + m.n }, opts)), d.shape), m.texts, d.shape),
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
      const svg = txtPaint(EXPORT.frameSvg(F().svg(m.raw, Object.assign({ title: "My film, moment " + m.n }, opts)), d.shape, what === "png" ? 1280 : 0), m.texts, d.shape);
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
      const trs = d.moments.filter((m) => m.transition).length;
      const txs = txtData().items.length;
      return toast(`Saved ${name}: ${d.moments.length} moments, ${d.keys.length} curiosities${trs ? `, ${trs} transition${trs === 1 ? "" : "s"}` : ""}${txs ? `, ${txs} text${txs === 1 ? "" : "s"}` : ""}.`);
    }
  }

  /* ---------- Transitions between moments (CapCut's Transitions tab, made for My film's joins) ----------
     The film is a flipbook-style storyboard, a moment at a time, so a transition sits on a join: how moment N
     hands over to moment N+1. Cut (nothing in between) is the default. Each join's choice is the Screen's own
     setting, not the engine's: a { kind, len } per join, keyed by the number of the moment it leads into ("3" is
     the join from moment 2 into moment 3), len a fraction of a moment. Saved under localStorage
     "curiosities-screen-transitions-v1" through a part of the app-wide store (engine/store.js), so every change
     is one step on the same undo list as ⌘Z and History ▾. (The data's Transition style curiosity is a value
     per moment that holds until the next node, so it can't say "this join only"; it is left as it is.)
     The pure part (TRANSITIONS) takes plain data so tests can check it with no page. */
  const TR_KEY = "curiosities-screen-transitions-v1";
  const TRANSITIONS = (() => {
    const KINDS = [
      ["cut", "Cut", "Cut: the next picture appears at once, with nothing in between."],
      ["fade", "Fade", "Fade: the picture melts into the next one."],
      ["wipe", "Wipe", "Wipe: the next picture slides in from the left like a curtain and covers this one."],
      ["push", "Push", "Push: the next picture shoves this one out of the frame, sideways."],
      ["zoom", "Zoom", "Zoom: this picture rushes toward you and fades, and the next one is behind it."],
      ["match", "Match", "Match: the drawing stays put and only the settings that change move into place."],
    ];
    const LENGTHS = [
      [0.25, "a quarter of a moment"],
      [0.5, "half a moment"],
      [0.75, "three quarters of a moment"],
      [1, "a whole moment"],
    ];
    const LEN = 0.5;
    const ids = KINDS.map((k) => k[0]);
    const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);
    const fixLen = (v) => {
      const n = Number(v);
      return isFinite(n) && n > 0 ? Math.round(Math.max(0.1, Math.min(1, n)) * 100) / 100 : LEN;
    };
    /* What is kept: { joins: { "3": { kind, len } } }. Cuts are not kept (they are the default); a broken entry
       is dropped quietly. */
    function clean(raw) {
      const out = { joins: {} };
      const j = isObj(raw) && isObj(raw.joins) ? raw.joins : {};
      Object.keys(j).forEach((k) => {
        const n = Number(k);
        const t = j[k];
        if (!Number.isInteger(n) || n < 2 || n > 100000 || !isObj(t) || !ids.includes(t.kind) || t.kind === "cut") return;
        out.joins[String(n)] = { kind: t.kind, len: fixLen(t.len) };
      });
      return out;
    }
    const at = (data, into) => {
      const t = data && data.joins && data.joins[String(into)];
      return t && ids.includes(t.kind) && t.kind !== "cut" ? { kind: t.kind, len: fixLen(t.len) } : { kind: "cut", len: LEN };
    };
    /* A new copy with the join into moment `into` set (kind "cut" takes it off). len left out keeps the join's own. */
    function set(data, into, kind, len) {
      const out = clean(data);
      const n = Number(into);
      if (!Number.isInteger(n) || n < 2 || !ids.includes(kind)) return out;
      const was = at(out, n);
      if (kind === "cut") delete out.joins[String(n)];
      else out.joins[String(n)] = { kind, len: fixLen(len == null ? was.len : len) };
      return out;
    }
    /* Use on every join: every join of a film with n moments gets the same kind and length. */
    function all(data, n, kind, len) {
      let out = { joins: {} };
      for (let j = 2; j <= n; j++) out = set(out, j, kind, len == null ? LEN : len);
      return out;
    }
    const kindOf = (id) => KINDS.find((k) => k[0] === id) || KINDS[0];
    const lenText = (len) => {
      const l = LENGTHS.find((x) => Math.abs(x[0] - len) < 0.001);
      return l ? l[1] : Math.round(len * 100) + "% of a moment";
    };
    /* "Fade, half a moment", or "Cut". */
    const label = (t) => (!t || t.kind === "cut" ? "Cut" : kindOf(t.kind)[1] + ", " + lenText(fixLen(t.len)));
    /* Every join that isn't a plain cut, in order, for Export: [{ into, kind, len, text }]. */
    function list(data, n) {
      const out = [];
      for (let j = 2; j <= n; j++) {
        const t = at(data, j);
        if (t.kind !== "cut") out.push({ into: j, kind: t.kind, len: t.len, text: label(t) });
      }
      return out;
    }
    const ease = (p) => {
      const x = Math.max(0, Math.min(1, Number(p) || 0));
      return x * x * (3 - 2 * x);
    };
    /* Match: the settings that differ move from a to b by their place on each curiosity's scale; a value that
       isn't on a scale changes halfway. domain(k) -> { kind: "choice", options } or { kind: "range", min, max, step }. */
    function blend(a, b, p, domain) {
      const out = Object.assign({}, a || {}, b || {});
      const x = Math.max(0, Math.min(1, Number(p) || 0));
      Object.keys(out).forEach((k) => {
        const va = a ? a[k] : undefined;
        const vb = b ? b[k] : undefined;
        if (va == null || vb == null) return (out[k] = x < 0.5 ? (va == null ? vb : va) : vb == null ? va : vb);
        if (String(va) === String(vb)) return (out[k] = vb);
        const d = domain ? domain(k) : null;
        if (d && d.kind === "range" && isFinite(Number(va)) && isFinite(Number(vb))) {
          const step = Number(d.step) || 0;
          const v = Number(va) + (Number(vb) - Number(va)) * x;
          return (out[k] = step ? Math.round(Math.round(v / step) * step * 1e6) / 1e6 : v);
        }
        const opts = d && d.kind === "choice" ? d.options || [] : [];
        const ia = opts.indexOf(String(va));
        const ib = opts.indexOf(String(vb));
        if (ia >= 0 && ib >= 0) return (out[k] = opts[Math.round(ia + (ib - ia) * x)]);
        out[k] = x < 0.5 ? va : vb;
      });
      return out;
    }
    /* How the two pictures look at progress p (0: all the moment before, 1: all the new one), as CSS for the
       picture going out (old) and the one coming in (cur). Match redraws the old picture instead (blend). */
    function style(kind, p) {
      const e = ease(p);
      const pc = (v) => Math.round(v * 1000) / 10 + "%";
      const r3 = (v) => String(Math.round(v * 1000) / 1000);
      if (kind === "fade") return { old: { opacity: r3(1 - e) }, cur: {} };
      if (kind === "wipe") return { old: { clipPath: `inset(0px 0px 0px ${pc(e)})` }, cur: {} };
      if (kind === "push") return { old: { transform: `translateX(-${pc(e)})` }, cur: { transform: `translateX(${pc(1 - e)})` } };
      if (kind === "zoom") return { old: { transform: `scale(${r3(1 + 0.6 * e)})`, opacity: r3(1 - e) }, cur: { transform: `scale(${r3(0.9 + 0.1 * e)})` } };
      return { old: {}, cur: {} };
    }
    return { KINDS, LENGTHS, LEN, clean, at, set, all, label, list, ease, blend, style, lenText };
  })();
  window.CurioScreenTransitions = TRANSITIONS;

  /* The saved transitions: a part of the app-wide store when the page has one (one undo step per change, on the
     same list as ⌘Z), else plain storage with no undo. */
  let trPart = null;
  function trStore() {
    if (trPart) return trPart;
    const St = window.CurioStore;
    const commands = {
      set: (d, m) => (d.joins = TRANSITIONS.set(d, m.into, m.kind, m.len).joins),
      all: (d, m) => (d.joins = TRANSITIONS.all(d, m.n, m.kind, m.len).joins),
      /* Ripple (adding or taking out moments) puts back a whole set of joins at once. */
      replace: (d, m) => (d.joins = TRANSITIONS.clean({ joins: m.joins }).joins),
    };
    if (St && typeof St.part === "function") {
      try {
        trPart = St.part("screenTransitions", { key: TR_KEY, initial: () => ({ joins: {} }), normalize: TRANSITIONS.clean, commands });
        trPart.on(trChanged);
        return trPart;
      } catch (e) {
        trPart = null;
      }
    }
    let data = { joins: {} };
    try {
      data = TRANSITIONS.clean(JSON.parse(localStorage.getItem(TR_KEY)));
    } catch (e) {}
    trPart = {
      undo: false,
      view: () => data,
      send(msg) {
        if (!msg || !commands[msg.type]) return { ok: false };
        const d = JSON.parse(JSON.stringify(data));
        commands[msg.type](d, msg);
        const next = TRANSITIONS.clean(d);
        if (JSON.stringify(next) === JSON.stringify(data)) return { ok: true, unchanged: true };
        data = next;
        try {
          localStorage.setItem(TR_KEY, JSON.stringify(data));
        } catch (e) {}
        trChanged();
        return { ok: true };
      },
    };
    return trPart;
  }
  const trData = () => trStore().view();
  const trAt = (into) => TRANSITIONS.at(trData(), into);
  function trChanged() {
    if (!page || page.hidden) return;
    trStop();
    drawViewers();
    drawInspector();
    if (lanes) lanes.draw();
    if (trMenuAt) {
      const m = trMenuDraw();
      const b = m.querySelector("[data-tr-kind].on");
      if (b && m.contains(document.activeElement) === false) b.focus();
    }
  }
  /* into: the moment number (1-based) the join leads into. */
  function trSet(into, kind, len) {
    const was = trAt(into);
    const t = { kind: kind || was.kind, len: len == null ? was.len : len };
    const r = trStore().send({ type: "set", into, kind: t.kind, len: t.len, label: `Transition into moment ${into}: ${TRANSITIONS.label(t)}` });
    if (r && r.ok && !r.unchanged) toast(`Moment ${into - 1} into moment ${into}: ${TRANSITIONS.label(t)}.${trStore().undo === false ? "" : " Undo takes it back."}`);
    return r;
  }
  function trAll(kind, len) {
    const n = nRows();
    const t = { kind, len: len == null ? TRANSITIONS.LEN : len };
    const r = trStore().send({ type: "all", n, kind, len: t.len, label: `Every join: ${TRANSITIONS.label(t)}` });
    if (r && r.ok && !r.unchanged) toast(`All ${Math.max(0, n - 1)} joins: ${TRANSITIONS.label(t)}.${trStore().undo === false ? "" : " Undo takes it back."}`);
    else if (r && r.unchanged) toast(`Every join is already ${TRANSITIONS.label(t)}.`);
    return r;
  }
  /* The ◇ on My film's clip track: one per join, for lanes.js (opts.joins). */
  function trJoins() {
    const n = nRows();
    const out = [null];
    for (let j = 1; j < n; j++) {
      const t = trAt(j + 1);
      out.push({ kind: t.kind, title: `Transition from moment ${j} into ${j + 1}: ${TRANSITIONS.label(t)}. Click to choose.` });
    }
    return out;
  }
  /* The chooser, used in Details and in the ◇'s pop-up: a button per kind, the length, Use on every join. */
  function trChooserHtml(into, where) {
    const t = trAt(into);
    return `<div class="sc-seg sc-tr-kinds" role="group" aria-label="Transition into moment ${into}">${TRANSITIONS.KINDS.map(([id, l, tip]) => `<button type="button" data-tr-kind="${id}" data-tr-into="${into}" class="${t.kind === id ? "on" : ""}" aria-pressed="${t.kind === id}" title="${esc(tip)}">${esc(l)}</button>`).join("")}</div>
      <div class="sc-tr-more"><label class="sc-tr-len" title="How long the transition takes, as a part of one moment">Length <select data-tr-len data-tr-into="${into}" aria-label="Length of the transition into moment ${into}"${t.kind === "cut" ? " disabled" : ""}>${TRANSITIONS.LENGTHS.map(([v, l]) => `<option value="${v}"${Math.abs(v - t.len) < 0.001 ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
      <button type="button" class="sc-tr-all" data-tr-all="${into}" data-tr-where="${where}" title="Give every join in your film this same transition and length (one undo step)">Use on every join</button></div>`;
  }
  /* Details: the join into the moment at the playhead. */
  function trRowHtml() {
    if (row < 1) return `<section class="sc-trrow" data-tr-row="1"><p><b>Transition</b> · Moment 1 is where the film starts, so there is no join before it. Move the playhead to a later moment to choose how it comes in.</p></section>`;
    const into = row + 1;
    const t = trAt(into);
    return `<section class="sc-trrow" data-tr-row="${into}"><p><b>Transition</b> · how moment ${row} hands over to moment ${into}: <span class="sc-tr-now">${esc(TRANSITIONS.label(t))}</span></p>${trChooserHtml(into, "details")}</section>`;
  }
  /* The ◇'s pop-up, beside the ◇. */
  let trMenuAt = null;
  function trMenuClose(focusBack) {
    const m = page && page.querySelector(".sc-tr-menu");
    if (m) m.remove();
    const j = trMenuAt;
    trMenuAt = null;
    if (focusBack && j) {
      const d = page.querySelector(`.sl-top [data-join="${j - 1}"]`);
      if (d && d.focus) d.focus();
    }
  }
  function trMenuDraw() {
    let m = page.querySelector(".sc-tr-menu");
    if (!m) {
      m = document.createElement("div");
      m.className = "sc-tr-menu";
      m.setAttribute("role", "dialog");
      page.appendChild(m);
    }
    const into = trMenuAt;
    const t = trAt(into);
    m.setAttribute("aria-label", `Transition into moment ${into}`);
    m.innerHTML = `<p class="sc-tr-mh"><b>Moment ${into - 1} → ${into}</b><button type="button" class="sc-tr-x" data-tr-close aria-label="Close">×</button></p>${trChooserHtml(into, "menu")}<p class="sc-tr-tip">${esc(TRANSITIONS.KINDS.find((k) => k[0] === t.kind)[2])}</p>`;
    return m;
  }
  function trMenuOpen(j, anchor) {
    /* One pop-up at a time: the words editor and Look ▾ give way (their own outside-click closing never sees this
       click, which stops here, nor Enter on a focused ◇). */
    if (txtEditId) txtMenuClose();
    closeLook();
    trMenuAt = j + 1;
    const m = trMenuDraw();
    const r = anchor.getBoundingClientRect();
    const w = Math.min(380, window.innerWidth - 32);
    m.style.width = w + "px";
    m.style.left = Math.max(16, Math.min(window.innerWidth - w - 16, r.left + r.width / 2 - w / 2)) + "px";
    const h = m.offsetHeight || 140;
    m.style.top = (r.top - h - 6 >= 8 ? r.top - h - 6 : Math.max(8, Math.min(window.innerHeight - h - 8, r.bottom + 6))) + "px";
    const b = m.querySelector("[data-tr-kind].on") || m.querySelector("button");
    if (b) b.focus();
  }
  /* Clicks, changes and keys, caught before the page's own handlers. */
  function trClick(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    if (trMenuAt && !t.closest(".sc-tr-menu, .sl-top [data-join]")) trMenuClose();
    const join = t.closest(".sl-top [data-join]");
    if (join) {
      e.stopPropagation();
      return trMenuAt === Number(join.dataset.join) + 1 ? trMenuClose() : trMenuOpen(Number(join.dataset.join), join);
    }
    const b = t.closest("[data-tr-kind], [data-tr-all], [data-tr-close]");
    if (!b || !page.contains(b)) return;
    e.stopPropagation();
    if (b.dataset.trClose != null) return trMenuClose(true);
    if (b.dataset.trKind) return trSet(Number(b.dataset.trInto), b.dataset.trKind);
    const t0 = trAt(Number(b.dataset.trAll));
    trAll(t0.kind, t0.len);
  }
  function trChange(e) {
    const s = e.target;
    if (!s || !s.dataset || s.dataset.trLen == null) return;
    e.stopPropagation();
    trSet(Number(s.dataset.trInto), null, Number(s.value));
  }
  function trKey(e) {
    const t = e.target;
    if (e.key === "Escape" && trMenuAt) {
      e.stopPropagation();
      return trMenuClose(true);
    }
    const join = t && t.closest && t.closest(".sl-top [data-join]");
    if (join && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      e.stopPropagation();
      trMenuOpen(Number(join.dataset.join), join);
    }
  }
  function trWire() {
    page.addEventListener("click", trClick, true);
    page.addEventListener("change", trChange, true);
    page.addEventListener("keydown", trKey, true);
  }
  /* Playing it: when the playhead steps one moment across a join (Play, ◀ ▶, scrubbing), the picture going out is
     laid over the new one and moved by the transition's style, a frame at a time, for its length. One moment
     lasts as long as Play holds it (1.1s at 1×), so a half-moment fade takes 0.55s at 1×. Cheap: one extra
     storyboard <svg> (cached) and a few CSS properties per frame. */
  let trAnim = null;
  const momentMs = () => Math.round(1100 / ((prefs.speed || 1) * playRate));
  function trMoved(was, now) {
    trStop();
    if (!page || page.hidden || Math.abs(now - was) !== 1) return;
    const into = Math.max(was, now) + 1;
    const t = trAt(into);
    if (t.kind === "cut") return;
    const beats = mineBeats();
    if (!beats[was] || !beats[now]) return;
    trAnim = { into, kind: t.kind, from: beats[was].values, to: beats[now].values, start: performance.now(), dur: Math.max(60, t.len * momentMs()), p: 0, frozen: false, cache: new Map() };
    trAnim.raf = requestAnimationFrame(trTick);
  }
  function trTick() {
    if (!trAnim || trAnim.frozen) return;
    const p = (performance.now() - trAnim.start) / trAnim.dur;
    if (p >= 1) return trStop();
    trPaint(p);
    trAnim.raf = requestAnimationFrame(trTick);
  }
  function trStop() {
    if (trAnim && trAnim.raf) cancelAnimationFrame(trAnim.raf);
    trAnim = null;
    const fr = page && page.querySelector(".sc-viewer.mine .sc-frame");
    if (!fr) return;
    const o = fr.querySelector(":scope > .sc-tr");
    if (o) o.remove();
    fr.classList.remove("sc-tr-on");
    delete fr.dataset.tr;
    const cur = fr.querySelector(":scope > svg");
    if (cur) cur.style.transform = "";
  }
  /* The old picture as an <svg>, in My film's frame shape (Match: the settings blended at p). */
  function trSvg(values) {
    const k = JSON.stringify(values);
    if (trAnim.cache.has(k)) return trAnim.cache.get(k);
    let svg = F().svg(values, { title: "", cast: castOf() });
    if (ratioShape() !== "wide") svg = svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ');
    if (trAnim.cache.size > 40) trAnim.cache.clear();
    trAnim.cache.set(k, svg);
    return svg;
  }
  function trPaint(p) {
    const fr = page && page.querySelector(".sc-viewer.mine .sc-frame");
    if (!trAnim || !fr || !F()) return;
    trAnim.p = p;
    const cur = fr.querySelector(":scope > svg");
    let o = fr.querySelector(":scope > .sc-tr");
    if (!o) {
      o = document.createElement("div");
      o.className = "sc-tr";
      o.setAttribute("aria-hidden", "true");
      if (cur) cur.after(o);
      else fr.prepend(o);
    }
    fr.classList.add("sc-tr-on");
    fr.dataset.tr = trAnim.kind;
    o.dataset.tr = trAnim.kind;
    o.dataset.p = String(Math.round(p * 100) / 100);
    const values = trAnim.kind === "match" ? TRANSITIONS.blend(trAnim.from, trAnim.to, TRANSITIONS.ease(p), (k) => (S() && S().known(k) ? S().domain(k) : null)) : trAnim.from;
    const svg = trSvg(values);
    if (o.__svg !== svg) (o.innerHTML = svg), (o.__svg = svg);
    const s = TRANSITIONS.style(trAnim.kind, p);
    o.style.opacity = s.old.opacity || "";
    o.style.clipPath = s.old.clipPath || "";
    o.style.transform = s.old.transform || "";
    /* The new picture keeps the Player zoom (--sc-pz) under its own move. */
    if (cur) cur.style.transform = s.cur.transform ? `${s.cur.transform} scale(var(--sc-pz, 1))` : "";
  }
  /* drawViewers rebuilt the Player: put a running transition back on the new frame. */
  function trDecorate() {
    if (trAnim) trPaint(trAnim.p);
  }
  /* Tests and a still preview: the join into moment `into`, held at progress p (the playhead on that moment). */
  function trPreview(into, p) {
    trStop();
    const n = Number(into);
    if (!page || !Number.isInteger(n) || n < 2 || n > nRows()) return null;
    row = n - 1;
    drawViewers();
    drawInspector();
    if (lanes) lanes.draw();
    tell();
    const t = trAt(n);
    if (t.kind === "cut") return { kind: "cut", len: t.len };
    const beats = mineBeats();
    trAnim = { into: n, kind: t.kind, from: beats[n - 2].values, to: beats[n - 1].values, p: 0, frozen: true, cache: new Map() };
    trPaint(Math.max(0, Math.min(1, Number(p) || 0)));
    return { kind: t.kind, len: t.len };
  }

  /* ---------- Words on the frame (CapCut's Text tab, made for a storyboard) ----------
     A text item is words drawn on My film's picture: the words (and, for a Lower third, a job or role), the
     moments it shows on (from moment A to moment B, 1-based), a place in the frame (a 9-spot grid, tl ... br),
     a size (S, M, L), a style (Title, Lower third, Sign / Insert, Sound effect, Thought) and a fade in and out.
     Like transitions, it is the Screen's own setting, kept under localStorage "curiosities-screen-text-v1" as
     { items: [{ id, words, sub, from, to, spot, size, style, fade }] } through a part of the app-wide store
     (engine/store.js, part "screenText"), so every change is one step on the same undo list as ⌘Z and History ▾.
     The pure part (TEXT) takes plain data so tests can check it with no page; it also draws the words as SVG for
     the Export (the PNG and SVG frame and the storyboard sheet). */
  const TXT_KEY = "curiosities-screen-text-v1";
  const TEXT = (() => {
    /* [id, label, one-line tooltip, default spot, default words] */
    const STYLES = [
      ["title", "Title", "Title: big bold words across the picture, like a film's name or a chapter card.", "bc", "Title"],
      ["lower", "Lower third", "Lower third: a name and job in the bottom corner, like the news.", "bl", "Name"],
      ["sign", "Sign / Insert", "Sign or insert: words written on something in the scene, like a shop sign, a letter or a phone screen.", "tc", "OPEN"],
      ["sfx", "Sound effect", "Sound effect: a comic-book noise like POW!, drawn big and bright.", "mc", "POW!"],
      ["thought", "Thought", "Thought: what someone is thinking, in a cloud bubble.", "tr", "I wonder…"],
    ];
    const SPOTS = [
      ["tl", "Top left"],
      ["tc", "Top centre"],
      ["tr", "Top right"],
      ["ml", "Middle left"],
      ["mc", "Middle"],
      ["mr", "Middle right"],
      ["bl", "Bottom left"],
      ["bc", "Bottom centre"],
      ["br", "Bottom right"],
    ];
    /* [id, button, name, font size as a percent of the frame's shorter side] */
    const SIZES = [
      ["s", "S", "Small", 5.5],
      ["m", "M", "Medium", 8],
      ["l", "L", "Large", 11.5],
    ];
    const SCALE = { title: 1.15, lower: 0.8, sign: 0.8, sfx: 1.45, thought: 0.75 };
    const SUB = "Job";
    const MAX = 60;
    const styleIds = STYLES.map((s) => s[0]);
    const spotIds = SPOTS.map((s) => s[0]);
    const sizeIds = SIZES.map((s) => s[0]);
    const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);
    const styleOf = (id) => STYLES.find((s) => s[0] === id) || STYLES[0];
    const sizeOf = (id) => SIZES.find((s) => s[0] === id) || SIZES[1];
    const spotName = (id) => (SPOTS.find((s) => s[0] === id) || SPOTS[7])[1];
    const moment = (v) => {
      const n = Math.round(Number(v));
      return isFinite(n) ? Math.max(1, Math.min(100000, n)) : null;
    };
    const str = (v, max) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").slice(0, max) : "");
    /* What is kept: a broken item is dropped quietly, a missing field gets its default. */
    function clean(raw) {
      const out = { items: [] };
      const list = isObj(raw) && Array.isArray(raw.items) ? raw.items : [];
      const seen = new Set();
      list.forEach((t) => {
        if (!isObj(t) || typeof t.id !== "string" || !/^[\w-]{1,24}$/.test(t.id) || seen.has(t.id) || out.items.length >= MAX) return;
        let a = moment(t.from);
        let b = moment(t.to == null ? t.from : t.to);
        if (a == null || b == null) return;
        if (a > b) [a, b] = [b, a];
        const style = styleIds.includes(t.style) ? t.style : "title";
        seen.add(t.id);
        out.items.push({ id: t.id, words: str(t.words, 160), sub: str(t.sub, 80), from: a, to: b, spot: spotIds.includes(t.spot) ? t.spot : styleOf(style)[3], size: sizeIds.includes(t.size) ? t.size : "m", style, fade: !!t.fade });
      });
      return out;
    }
    /* A new id no item has: t1, t2, ... */
    function nextId(data) {
      const nums = clean(data).items.map((t) => Number((/^t(\d+)$/.exec(t.id) || [])[1]) || 0);
      return "t" + (Math.max(0, ...nums) + 1);
    }
    /* A new text item with its style's defaults: { id, from, to?, style?, ... }. */
    function make(o) {
      const style = styleIds.includes(o && o.style) ? o.style : "title";
      const s = styleOf(style);
      return clean({ items: [Object.assign({ words: s[4], sub: style === "lower" ? SUB : "", spot: s[3], size: "m", style, fade: false }, o, { to: o && o.to != null ? o.to : o && o.from })] }).items[0] || null;
    }
    function add(data, item) {
      const out = clean(data);
      const t = make(item || {});
      if (t && !out.items.some((x) => x.id === t.id) && out.items.length < MAX) out.items.push(t);
      return out;
    }
    /* A new copy with item id changed. Changing the style also moves it to the new style's own spot when it still
       sat on the old style's, and swaps the words when they were still the old style's example words. */
    function update(data, id, patch) {
      const out = clean(data);
      const i = out.items.findIndex((x) => x.id === id);
      if (i < 0 || !isObj(patch)) return out;
      const was = out.items[i];
      const next = Object.assign({}, was);
      ["words", "sub", "from", "to", "spot", "size", "style", "fade"].forEach((k) => k in patch && (next[k] = patch[k]));
      if ("from" in patch && !("to" in patch) && moment(next.from) > was.to) next.to = next.from;
      if ("to" in patch && !("from" in patch) && moment(next.to) < was.from) next.from = next.to;
      if (patch.style && patch.style !== was.style && styleIds.includes(patch.style)) {
        const o = styleOf(was.style);
        const n = styleOf(patch.style);
        if (!("spot" in patch) && was.spot === o[3]) next.spot = n[3];
        if (!("words" in patch) && was.words === o[4]) next.words = n[4];
        if (!("sub" in patch) && patch.style === "lower" && !was.sub) next.sub = SUB;
      }
      out.items[i] = next;
      return clean(out);
    }
    function remove(data, id) {
      const out = clean(data);
      out.items = out.items.filter((x) => x.id !== id);
      return out;
    }
    /* The items that show on moment n (1-based), in the order they were added. */
    const at = (data, n) => clean(data).items.filter((t) => t.from <= n && n <= t.to);
    const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
    /* 'Title “The end”' */
    const label = (t) => `${styleOf(t.style)[1]} “${short(t.words || "", 28)}”`;
    const spanText = (t) => (t.from === t.to ? `moment ${t.from}` : `moments ${t.from} to ${t.to}`);
    /* The Settings list's Text cell for one moment: 'Title: The end · Lower third: Ana (director)'. */
    const csvText = (items) => (items || []).map((t) => `${styleOf(t.style)[1]}: ${t.words}${t.style === "lower" && t.sub ? ` (${t.sub})` : ""}`).join(" · ");
    /* Where a pointer lands, as fractions of the frame (0 to 1), is one of the 9 spots. */
    const spotAt = (fx, fy) => (fy < 1 / 3 ? "t" : fy < 2 / 3 ? "m" : "b") + (fx < 1 / 3 ? "l" : fx < 2 / 3 ? "c" : "r");
    /* Words broken into at most `max` lines of about `chars` letters each; what doesn't fit ends in "…". */
    function wrap(words, chars, max) {
      const c = Math.max(4, Math.floor(chars));
      const out = [];
      let line = "";
      String(words || "")
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w) => {
          while (w.length > c) {
            if (line) out.push(line);
            line = "";
            out.push(w.slice(0, c));
            w = w.slice(c);
          }
          if (!w) return;
          if (!line) line = w;
          else if ((line + " " + w).length <= c) line += " " + w;
          else out.push(line), (line = w);
        });
      if (line) out.push(line);
      if (out.length > max) {
        const keep = out.slice(0, max);
        keep[max - 1] = short(keep[max - 1] + " " + out[max], c);
        if (!/…$/.test(keep[max - 1])) keep[max - 1] = short(keep[max - 1], c - 1) + "…";
        return keep;
      }
      return out.length ? out : [""];
    }
    const xml = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
    const r1 = (n) => Math.round(n * 10) / 10;
    /* How big one item draws, in the frame's own units (box: the part of the 320 by 180 picture that shows). */
    function measure(t, box, maxW) {
      const fs = (sizeOf(t.size)[3] * (SCALE[t.style] || 1) * Math.min(box.w, box.h)) / 100;
      const cw = fs * (t.style === "sfx" ? 0.62 : 0.56);
      const pad = t.style === "thought" ? fs * 0.6 : t.style === "title" || t.style === "sfx" ? 0 : fs * 0.4;
      const lines = wrap(t.words, (maxW - pad * 2) / cw, t.style === "lower" ? 2 : 3);
      const subFs = fs * 0.68;
      const sub = t.style === "lower" && t.sub ? wrap(t.sub, (maxW - pad * 2) / (subFs * 0.55), 1) : [];
      const lh = fs * 1.15;
      const tw = Math.max(...lines.map((l) => l.length * cw), ...sub.map((l) => l.length * subFs * 0.55), fs);
      const extra = t.style === "lower" ? fs * 0.3 : 0; /* the colored edge */
      return { fs, lh, lines, sub, subFs, pad, w: Math.min(maxW, tw + pad * 2 + extra), h: lines.length * lh + (sub.length ? subFs * 1.2 : 0) + pad * 2, extra };
    }
    /* One item drawn at its box (x, y: top left; m: measure()). */
    function drawOne(t, x, y, m) {
      const font = 'font-family="Arial, Helvetica, sans-serif"';
      const cx = x + m.w / 2;
      const tsp = (lines, x0, y0, lh) => lines.map((l, i) => `<tspan x="${r1(x0)}" y="${r1(y0 + i * lh)}">${xml(l)}</tspan>`).join("");
      const base = y + m.pad + m.fs * 0.9;
      const g = (inner, more) => `<g class="cf-txt" data-txt="${xml(t.id)}" data-style="${t.style}"${more || ""}>${inner}</g>`;
      if (t.style === "title") return g(`<text ${font} font-size="${r1(m.fs)}" font-weight="800" text-anchor="middle" fill="#ffffff" stroke="#111111" stroke-width="${r1(m.fs * 0.14)}" stroke-linejoin="round" paint-order="stroke">${tsp(m.lines, cx, base, m.lh)}</text>`);
      if (t.style === "sfx") return g(`<text font-family="Impact, 'Arial Black', Arial, sans-serif" font-size="${r1(m.fs)}" font-weight="900" font-style="italic" text-anchor="middle" fill="#ffd43b" stroke="#c92a2a" stroke-width="${r1(m.fs * 0.16)}" stroke-linejoin="round" paint-order="stroke">${tsp(m.lines, cx, base, m.lh)}</text>`, ` transform="rotate(-8 ${r1(cx)} ${r1(y + m.h / 2)})"`);
      if (t.style === "lower")
        return g(
          `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(m.w)}" height="${r1(m.h)}" fill="#0f172a" fill-opacity="0.86"/><rect x="${r1(x)}" y="${r1(y)}" width="${r1(m.extra)}" height="${r1(m.h)}" fill="#22d3ee"/>` +
            `<text ${font} font-size="${r1(m.fs)}" font-weight="700" fill="#ffffff">${tsp(m.lines, x + m.extra + m.pad, base, m.lh)}</text>` +
            (m.sub.length ? `<text ${font} font-size="${r1(m.subFs)}" fill="#cbd5e1">${tsp(m.sub, x + m.extra + m.pad, y + m.pad + m.lines.length * m.lh + m.subFs * 0.85, m.subFs)}</text>` : "")
        );
      if (t.style === "sign") return g(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(m.w)}" height="${r1(m.h)}" rx="${r1(m.fs * 0.15)}" fill="#fff8dc" stroke="#3b2f2f" stroke-width="${r1(Math.max(0.6, m.fs * 0.08))}"/><text ${font} font-size="${r1(m.fs)}" font-weight="800" text-anchor="middle" fill="#2b2118" letter-spacing="${r1(m.fs * 0.04)}">${tsp(m.lines, cx, base, m.lh)}</text>`);
      /* thought: a cloud bubble with two small puffs under it */
      const pr = m.fs * 0.22;
      return g(`<circle cx="${r1(x + m.w * 0.22)}" cy="${r1(y + m.h + pr * 1.6)}" r="${r1(pr)}" fill="#ffffff" stroke="#333333" stroke-width="0.6"/><circle cx="${r1(x + m.w * 0.14)}" cy="${r1(y + m.h + pr * 3.6)}" r="${r1(pr * 0.6)}" fill="#ffffff" stroke="#333333" stroke-width="0.6"/><rect x="${r1(x)}" y="${r1(y)}" width="${r1(m.w)}" height="${r1(m.h)}" rx="${r1(Math.min(m.h / 2, m.w / 2))}" fill="#ffffff" stroke="#333333" stroke-width="0.7"/><text ${font} font-size="${r1(m.fs)}" font-style="italic" text-anchor="middle" fill="#222222">${tsp(m.lines, cx, base, m.lh)}</text>`);
    }
    /* Every item of one moment as SVG, in the frame's own units: box is the part of the 320 by 180 picture that
       shows ({ x, y, w, h }); o.lift raises the bottom row by that many units (to clear a caption). Items on the
       same spot stack: down from the top, up from the bottom, around the middle. */
    function svg(items, box, o) {
      const b = box || { x: 0, y: 0, w: 320, h: 180 };
      const mx = b.w * 0.04;
      const my = b.h * 0.05;
      const gap = Math.min(b.w, b.h) * 0.02;
      const lift = (o && o.lift) || 0;
      const out = [];
      spotIds.forEach((sp) => {
        const list = (items || []).filter((t) => t.spot === sp);
        if (!list.length) return;
        const col = sp[1];
        const rw = sp[0];
        const maxW = col === "c" ? b.w * 0.86 : b.w * 0.46;
        const ms = list.map((t) => measure(t, b, maxW));
        const total = ms.reduce((a, m) => a + m.h, 0) + gap * (ms.length - 1);
        let y = rw === "t" ? b.y + my : rw === "m" ? b.y + (b.h - total) / 2 : b.y + b.h - my - lift - total;
        list.forEach((t, i) => {
          const m = ms[i];
          const x = col === "l" ? b.x + mx : col === "c" ? b.x + (b.w - m.w) / 2 : b.x + b.w - mx - m.w;
          out.push(drawOne(t, x, y, m));
          y += m.h + gap;
        });
      });
      return out.length ? `<g class="cf-texts">${out.join("")}</g>` : "";
    }
    return { STYLES, SPOTS, SIZES, MAX, clean, nextId, make, add, update, remove, at, label, spanText, csvText, spotAt, spotName, wrap, svg, styleOf, sizeOf };
  })();
  window.CurioScreenText = TEXT;

  /* The saved text items: a part of the app-wide store when the page has one (one undo step per change), else
     plain storage with no undo. */
  let txtPart = null;
  function txtStore() {
    if (txtPart) return txtPart;
    const St = window.CurioStore;
    const commands = {
      add: (d, m) => (d.items = TEXT.add(d, m.item).items),
      update: (d, m) => (d.items = TEXT.update(d, m.id, m.patch).items),
      remove: (d, m) => (d.items = TEXT.remove(d, m.id).items),
      /* Ripple (adding or taking out moments) puts back a whole set of texts at once. */
      replace: (d, m) => (d.items = TEXT.clean({ items: m.items }).items),
    };
    if (St && typeof St.part === "function") {
      try {
        txtPart = St.part("screenText", { key: TXT_KEY, initial: () => ({ items: [] }), normalize: TEXT.clean, commands });
        txtPart.on(txtChanged);
        return txtPart;
      } catch (e) {
        txtPart = null;
      }
    }
    let data = { items: [] };
    try {
      data = TEXT.clean(JSON.parse(localStorage.getItem(TXT_KEY)));
    } catch (e) {}
    txtPart = {
      undo: false,
      view: () => data,
      send(msg) {
        if (!msg || !commands[msg.type]) return { ok: false };
        const d = JSON.parse(JSON.stringify(data));
        commands[msg.type](d, msg);
        const next = TEXT.clean(d);
        if (JSON.stringify(next) === JSON.stringify(data)) return { ok: true, unchanged: true };
        data = next;
        try {
          localStorage.setItem(TXT_KEY, JSON.stringify(data));
        } catch (e) {}
        txtChanged();
        return { ok: true };
      },
    };
    return txtPart;
  }
  const txtData = () => TEXT.clean(txtStore().view());
  const txtItem = (id) => txtData().items.find((t) => t.id === id) || null;
  const txtUndoSay = () => (txtStore().undo === false ? "" : " Undo takes it back.");
  let txtEditId = null;
  function txtChanged() {
    if (!page || page.hidden) return;
    drawViewers();
    if (lanes) lanes.draw();
    if (txtEditId) {
      if (!txtItem(txtEditId)) txtMenuClose();
      else txtMenuDraw();
    }
  }
  /* "T Text": a new Title at the playhead, and its editor open with the words picked, ready to type over. */
  function txtAdd() {
    if (!E()) return toast("Your film is not loaded yet.");
    const d = txtData();
    if (d.items.length >= TEXT.MAX) return toast(`Your film already has ${TEXT.MAX} texts; delete one to add another.`);
    const id = TEXT.nextId(d);
    const r = txtStore().send({ type: "add", item: { id, from: row + 1, to: row + 1 }, label: `Add text at moment ${row + 1}` });
    if (!r || !r.ok) return r;
    toast(`Words added at moment ${row + 1}. Type over them; drag them on the picture to move them.${txtUndoSay()}`);
    txtMenuOpen(id);
    return Object.assign({ id }, r);
  }
  function txtSet(id, patch, label, merge) {
    const t = txtItem(id);
    if (!t) return { ok: false };
    const msg = { type: "update", id, patch, label: label || `Change ${TEXT.label(t)}` };
    if (merge) msg.merge = merge;
    return txtStore().send(msg);
  }
  function txtSpan(id, a, b) {
    const t = txtItem(id);
    if (!t) return { ok: false };
    const n = nRows();
    const from = Math.max(1, Math.min(n, Math.min(a, b)));
    const to = Math.max(from, Math.min(n, Math.max(a, b)));
    const r = txtSet(id, { from, to }, `${TEXT.label(t)}: ${TEXT.spanText({ from, to })}`);
    if (r && r.ok && !r.unchanged) toast(`${TEXT.label(t)} shows on ${TEXT.spanText({ from, to })}.${txtUndoSay()}`);
    return r;
  }
  function txtMove(id, spot) {
    const t = txtItem(id);
    if (!t) return { ok: false };
    const r = txtSet(id, { spot }, `Move ${TEXT.label(t)} to ${TEXT.spotName(spot).toLowerCase()}`);
    if (r && r.ok && !r.unchanged) toast(`${TEXT.label(t)} moved to the ${TEXT.spotName(spot).toLowerCase()}.${txtUndoSay()}`);
    return r;
  }
  function txtDel(id) {
    const t = txtItem(id);
    if (!t) return { ok: false };
    const r = txtStore().send({ type: "remove", id, label: `Delete ${TEXT.label(t)}` });
    if (r && r.ok) toast(`${TEXT.label(t)} deleted.${txtUndoSay()}`);
    if (txtEditId === id) txtMenuClose();
    return r;
  }
  /* The words on My film's frame at moment i (0-based): HTML over the picture, one box per spot that has words.
     While Play runs, a text set to fade fades in on its first moment and out at the end of its last. */
  function txtLayerHtml(i) {
    const items = TEXT.at(txtData(), i + 1);
    if (!items.length) return "";
    const ms = momentMs();
    return `<div class="sc-txt-layer" style="--txt-fo:${Math.round(ms * 0.35)}ms;--txt-fd:${Math.round(ms * 0.6)}ms">${TEXT.SPOTS.map(([sp, name]) => {
      const list = items.filter((t) => t.spot === sp);
      if (!list.length) return "";
      return `<div class="sc-txt-spot" data-spot="${sp}" data-row="${sp[0]}" data-col="${sp[1]}">${list
        .map((t) => {
          const fade = timer && t.fade ? (t.from === i + 1 && t.to === i + 1 ? "both" : t.from === i + 1 ? "in" : t.to === i + 1 ? "out" : "") : "";
          return `<button type="button" class="sc-txt" data-txt="${esc(t.id)}" data-style="${t.style}" data-size="${t.size}"${fade ? ` data-fade="${fade}"` : ""}${txtEditId === t.id ? ' aria-expanded="true"' : ""} title="${esc(TEXT.label(t))} (${esc(TEXT.styleOf(t.style)[1])}, ${esc(name.toLowerCase())}, ${esc(TEXT.spanText(t))}). Click to change it, drag it to another place, Delete removes it."><span class="sc-txt-w">${esc(t.words || " ")}</span>${t.style === "lower" && t.sub ? `<span class="sc-txt-sub">${esc(t.sub)}</span>` : ""}</button>`;
        })
        .join("")}</div>`;
    }).join("")}</div>`;
  }
  /* Bottom-row words step up above a caption while one shows, so the two never cover each other. */
  function txtAvoid() {
    const frame = page && page.querySelector(".sc-viewer.mine .sc-frame");
    const layer = frame && frame.querySelector(".sc-txt-layer");
    if (!layer) return;
    const cap = frame.querySelector(".sc-cap p");
    if (!cap) return layer.classList.remove("sc-txt-lift");
    const fr = frame.getBoundingClientRect();
    const cr = cap.getBoundingClientRect();
    layer.style.setProperty("--txt-capb", Math.max(0, Math.round(fr.bottom - cr.top + 4)) + "px");
    layer.classList.add("sc-txt-lift");
  }
  /* The timeline's Text row (lanes.js, opts.texts). */
  function txtLanes() {
    return {
      items: txtData().items.map((t) => ({ id: t.id, j0: t.from - 1, j1: t.to - 1, style: t.style, text: `${TEXT.styleOf(t.style)[1]}: ${t.words}`, title: `${TEXT.label(t)}, on ${TEXT.spanText(t)}. Drag an end to change when it shows, the middle to move it; click it to change the words.` })),
      onSpan: (id, j0, j1) => txtSpan(id, j0 + 1, j1 + 1),
      onPick: (id) => txtPick(id),
    };
  }
  /* A bar on the timeline picked: the playhead goes to the text's first moment (unless it already shows), and its
     editor opens. */
  function txtPick(id) {
    const t = txtItem(id);
    if (!t) return;
    if (row + 1 < t.from || row + 1 > t.to) setRow(t.from - 1);
    txtMenuOpen(id);
  }
  /* The editor: a small pop-up beside the words. */
  function txtMenuClose(focusBack) {
    const m = page && page.querySelector(".sc-txt-menu");
    if (m) m.remove();
    const id = txtEditId;
    txtEditId = null;
    const el = id && page && page.querySelector(`.sc-viewer.mine [data-txt="${id}"]`);
    if (el) el.removeAttribute("aria-expanded");
    if (focusBack && el && el.focus) el.focus();
  }
  function txtMenuDraw() {
    const t = txtItem(txtEditId);
    if (!t) return null;
    let m = page.querySelector(".sc-txt-menu");
    /* Keep the focus (and the caret) where it was when the editor is drawn again after a change. */
    const fa = m && m.contains(document.activeElement) ? document.activeElement : null;
    let keep = null;
    if (fa) {
      const k = [...fa.attributes].map((a) => a.name).find((nm) => /^data-txt-/.test(nm));
      let s0 = null;
      let s1 = null;
      try {
        s0 = fa.selectionStart;
        s1 = fa.selectionEnd;
      } catch (err) {}
      if (k) keep = { sel: fa.getAttribute(k) ? `[${k}="${fa.getAttribute(k)}"]` : `[${k}]`, s: s0, e: s1 };
    }
    if (!m) {
      m = document.createElement("div");
      m.className = "sc-txt-menu";
      m.setAttribute("role", "dialog");
      page.appendChild(m);
    }
    const n = nRows();
    const st = TEXT.styleOf(t.style);
    m.setAttribute("aria-label", `Words on the frame: ${TEXT.label(t)}`);
    m.dataset.txtFor = t.id;
    m.innerHTML = `<p class="sc-txt-mh"><b>Words on the frame</b><button type="button" class="sc-tr-x" data-txt-close aria-label="Close">×</button></p>
      <label class="sc-txt-f">Words <input type="text" data-txt-words maxlength="160" value="${esc(t.words)}" aria-label="Words"></label>
      ${t.style === "lower" ? `<label class="sc-txt-f">Job or role <input type="text" data-txt-sub maxlength="80" value="${esc(t.sub)}" aria-label="Job or role"></label>` : ""}
      <div class="sc-seg sc-txt-styles" role="group" aria-label="Style">${TEXT.STYLES.map(([id, l, tip]) => `<button type="button" data-txt-style="${id}" class="${t.style === id ? "on" : ""}" aria-pressed="${t.style === id}" title="${esc(tip)}">${esc(l)}</button>`).join("")}</div>
      <div class="sc-txt-row"><div class="sc-txt-grid9" role="group" aria-label="Place in the frame">${TEXT.SPOTS.map(([id, l]) => `<button type="button" data-txt-spot="${id}" class="${t.spot === id ? "on" : ""}" aria-pressed="${t.spot === id}" aria-label="${esc(l)}" title="${esc(l)}"></button>`).join("")}</div>
      <div class="sc-txt-col"><span class="sc-seg" role="group" aria-label="Size">${TEXT.SIZES.map(([id, b, l]) => `<button type="button" data-txt-size="${id}" class="${t.size === id ? "on" : ""}" aria-pressed="${t.size === id}" title="${esc(l)}">${b}</button>`).join("")}</span>
      <span class="sc-txt-span">Shows on moments <span class="sc-txt-span-in"><input type="number" data-txt-from min="1" max="${n}" value="${t.from}" aria-label="First moment it shows on"> to <input type="number" data-txt-to min="1" max="${n}" value="${t.to}" aria-label="Last moment it shows on"></span></span>
      <label class="sc-txt-fade" title="The words fade in on their first moment and out at the end of their last, while Play runs"><input type="checkbox" data-txt-fade${t.fade ? " checked" : ""}> Fade in and out</label></div></div>
      <p class="sc-txt-tip">${esc(st[2])}</p>
      <p class="sc-txt-acts"><button type="button" class="sc-txt-del" data-txt-del title="Delete these words from your film (Undo brings them back)">Delete</button></p>`;
    if (keep) {
      const back = m.querySelector(keep.sel);
      if (back) {
        back.focus();
        try {
          if (keep.s != null && back.setSelectionRange) back.setSelectionRange(keep.s, keep.e);
        } catch (err) {}
      }
    }
    return m;
  }
  function txtMenuOpen(id) {
    if (!txtItem(id)) return;
    if (trMenuAt) trMenuClose();
    closeLook();
    txtEditId = id;
    const old = page.querySelector(".sc-txt-menu");
    if (old) old.remove();
    const m = txtMenuDraw();
    const anchor = page.querySelector(`.sc-viewer.mine [data-txt="${id}"]`) || page.querySelector(".sc-viewer.mine .sc-frame") || page.querySelector(".sc-player");
    if (anchor && anchor.dataset.txt) anchor.setAttribute("aria-expanded", "true");
    const r = anchor ? anchor.getBoundingClientRect() : { left: 16, right: 16, top: 16, bottom: 16, width: 0 };
    const w = Math.min(340, window.innerWidth - 32);
    m.style.width = w + "px";
    const h = m.offsetHeight || 260;
    /* Beside the words when there is room (right, then left), else under or over them. */
    let left = r.right + 10;
    let top = r.top + r.height / 2 - h / 2;
    if (left + w > window.innerWidth - 16) left = r.left - w - 10;
    if (left < 16) {
      left = Math.max(16, Math.min(window.innerWidth - w - 16, r.left + r.width / 2 - w / 2));
      top = r.bottom + 8 + h <= window.innerHeight - 8 ? r.bottom + 8 : r.top - h - 8;
    }
    m.style.left = Math.round(left) + "px";
    m.style.top = Math.round(Math.max(8, Math.min(window.innerHeight - h - 8, top))) + "px";
    const inp = m.querySelector("[data-txt-words]");
    if (inp) {
      inp.focus();
      inp.select();
    }
  }
  /* Clicks, typing, changes and keys, caught before the page's own handlers (as the transitions' are). */
  let txtSwallow = 0;
  function txtClick(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    if (txtEditId && !t.closest(".sc-txt-menu, [data-txt], [data-txt-bar], [data-act='txt-add'], [data-txt-add]")) txtMenuClose();
    if (Date.now() - txtSwallow < 350 && t.closest(".sc-viewer.mine .sc-frame")) {
      e.stopPropagation();
      return;
    }
    const add = t.closest("[data-act='txt-add'], [data-txt-add]");
    if (add && page.contains(add)) {
      e.stopPropagation();
      return txtAdd();
    }
    const word = t.closest(".sc-viewer.mine [data-txt]");
    if (word) {
      e.stopPropagation();
      return txtEditId === word.dataset.txt ? txtMenuClose() : txtMenuOpen(word.dataset.txt);
    }
    const m = t.closest(".sc-txt-menu");
    if (!m) return;
    e.stopPropagation();
    const b = t.closest("button");
    if (!b || !txtEditId) return;
    const id = txtEditId;
    const it = txtItem(id);
    if (b.dataset.txtClose != null) return txtMenuClose(true);
    if (b.dataset.txtDel != null) return txtDel(id);
    if (b.dataset.txtStyle) return txtSet(id, { style: b.dataset.txtStyle }, `${TEXT.label(it)}: ${TEXT.styleOf(b.dataset.txtStyle)[1]}`);
    if (b.dataset.txtSpot) return txtMove(id, b.dataset.txtSpot);
    if (b.dataset.txtSize) return txtSet(id, { size: b.dataset.txtSize }, `${TEXT.label(it)}: size ${TEXT.sizeOf(b.dataset.txtSize)[2].toLowerCase()}`);
  }
  function txtInput(e) {
    const s = e.target;
    if (!s || !s.closest || !s.closest(".sc-txt-menu")) return;
    e.stopPropagation();
    if (!txtEditId) return;
    if (s.dataset.txtWords != null) return txtSet(txtEditId, { words: s.value }, `Text words: “${s.value.slice(0, 28)}”`, "txt-words-" + txtEditId);
    if (s.dataset.txtSub != null) return txtSet(txtEditId, { sub: s.value }, `Text job or role: “${s.value.slice(0, 28)}”`, "txt-sub-" + txtEditId);
  }
  function txtChange(e) {
    const s = e.target;
    if (!s || !s.closest || !s.closest(".sc-txt-menu")) return;
    e.stopPropagation();
    if (!txtEditId) return;
    const t = txtItem(txtEditId);
    if (!t) return;
    if (s.dataset.txtFade != null) return txtSet(t.id, { fade: s.checked }, `${TEXT.label(t)}: ${s.checked ? "fade in and out" : "no fade"}`);
    if (s.dataset.txtFrom != null || s.dataset.txtTo != null) {
      const v = Math.round(Number(s.value));
      if (!isFinite(v)) return txtMenuDraw();
      return s.dataset.txtFrom != null ? txtSpan(t.id, v, Math.max(v, t.to)) : txtSpan(t.id, Math.min(v, t.from), v);
    }
  }
  function txtKey(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    const m = t.closest(".sc-txt-menu");
    if (m) {
      /* Keys typed in the editor stay there: no Screen shortcut sees them. */
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        txtMenuClose(true);
      } else if (e.key === "Enter" && t.tagName === "INPUT" && t.type !== "checkbox") {
        e.preventDefault();
        if (t.type === "number") t.dispatchEvent(new Event("change", { bubbles: true }));
        else txtMenuClose(true);
      }
      return;
    }
    if (e.key === "Escape" && txtEditId) {
      e.stopPropagation();
      return txtMenuClose(true);
    }
    const word = t.closest(".sc-viewer.mine [data-txt]");
    const bar = t.closest(".sl-top [data-txt-bar]");
    const id = word ? word.dataset.txt : bar ? bar.dataset.txtBar : null;
    if (!id) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      e.stopPropagation();
      return txtDel(id);
    }
    if (bar && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      e.stopPropagation();
      return txtPick(id);
    }
  }
  /* Drag the words on the picture to another of the 9 spots: the grid shows while dragging, the spot under the
     pointer lights up, and letting go moves them there (one undo step). */
  function txtDown(e) {
    const word = e.button > 0 || !e.target.closest ? null : e.target.closest(".sc-viewer.mine .sc-frame [data-txt]");
    if (!word) return;
    const frame = word.closest(".sc-frame");
    const id = word.dataset.txt;
    const x0 = e.clientX;
    const y0 = e.clientY;
    let dragging = false;
    let spot = null;
    e.preventDefault();
    e.stopPropagation();
    const at = (ev) => {
      const r = frame.getBoundingClientRect();
      return TEXT.spotAt(Math.max(0, Math.min(0.999, (ev.clientX - r.left) / Math.max(1, r.width))), Math.max(0, Math.min(0.999, (ev.clientY - r.top) / Math.max(1, r.height))));
    };
    const move = (ev) => {
      if (!dragging && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
      if (!dragging) {
        dragging = true;
        txtMenuClose();
        frame.classList.add("sc-txt-dragging");
        frame.insertAdjacentHTML("beforeend", `<div class="sc-txt-drop" aria-hidden="true">${TEXT.SPOTS.map(([sp, l]) => `<i data-drop="${sp}"><span>${esc(l)}</span></i>`).join("")}</div>`);
      }
      spot = at(ev);
      word.style.transform = `translate(${ev.clientX - x0}px, ${ev.clientY - y0}px)`;
      frame.querySelectorAll(".sc-txt-drop [data-drop]").forEach((c) => c.classList.toggle("on", c.dataset.drop === spot));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!dragging) return;
      txtSwallow = Date.now();
      frame.classList.remove("sc-txt-dragging");
      const g = frame.querySelector(".sc-txt-drop");
      if (g) g.remove();
      word.style.transform = "";
      const t = txtItem(id);
      if (t && spot && spot !== t.spot) txtMove(id, spot);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  function txtWire() {
    page.addEventListener("click", txtClick, true);
    page.addEventListener("input", txtInput, true);
    page.addEventListener("change", txtChange, true);
    page.addEventListener("keydown", txtKey, true);
    page.addEventListener("pointerdown", txtDown, true);
  }
  /* The Export's frames with the words drawn on: svg is a frame already cropped by EXPORT.frameSvg to shape. */
  function txtPaint(svg, items, shape) {
    if (!items || !items.length) return svg;
    const s = EXPORT.SHAPES[shape] || EXPORT.SHAPES.wide;
    const g = TEXT.svg(items, { x: (320 - s.w) / 2, y: (180 - s.h) / 2, w: s.w, h: s.h });
    const k = String(svg).lastIndexOf("</svg>");
    return k < 0 ? svg : svg.slice(0, k) + g + svg.slice(k);
  }
  const txtButtonHtml = () => `<button type="button" data-act="txt-add" class="sc-txt-b" title="Text: put words on your film's picture at this moment, like CapCut's Text tab (a title, a name and job, a sign, a sound effect or a thought). Click words on the picture to change them, drag them to move them.">T<span class="sc-lbl"> Text</span></button>`;

  /* ---------- Ripple: add, duplicate and take out moments (CapCut's Split and Delete with ripple, for moments) ----------
     My film is a flipbook-style storyboard, a moment at a time. Its moments are the engine's rows (engine/state.js
     st.rows, at most E.LIMIT.rows); the clock only says how long each lasts (secondsPerPanel in
     curiosities-momentum-v1), so adding or taking out a moment is the engine's own addRow and removeRow, sent from
     here. Everything kept per moment moves with it, in ONE undo step:
     - nodes on every lane: kept by moment id, so they slide along by themselves. A copied moment gets copies of its
       nodes (and its own material and pins), and where a lane's line would now play something else (a glide that
       got one moment longer, a node taken out), a node with what it played before goes in, so nothing jumps.
     - joins (proximities): a join inside a duplicated stretch is copied with it; one that spans the new or missing
       moments has its gap (within) changed; one that touches a moment taken out goes with it.
     - markers (curiosities-screen-tools-v1): kept by moment id, so they slide along; one on a moment taken out goes.
     - transitions (screenTransitions) and words on the frame (screenText): kept by moment NUMBER, so they are
       renumbered here. Copies of the joins and texts inside a duplicated stretch go with the copies.
     - the play range (I and O): renumbered the same way.
     The engine's step goes on the app-wide undo list as usual (CurioStore.external). The two store parts are
     changed with { record: false } (no step of their own), and this block listens to the engine: when that very
     step is undone or redone (⌘Z, History ▾, the timeline's Undo, or the engine's own undo), the transitions,
     texts, markers and play range are put back with it. So one ⌘Z takes back everything.
     Locked lanes (🔒): a ripple shifts the whole film in time, so a locked lane's nodes slide along with their
     moments like everything else, but nothing is ever added to or taken off a locked lane: a copy gets no node
     there (its line runs on across the copy), and taking out a moment that has a node on a locked lane is refused.
     The pure part (RIPPLE, window.CurioScreenRipple) takes the engine state and plain data, for tests. */
  const RIPPLE = (() => {
    const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
    const ease = (t) => t * t * (3 - 2 * t);
    const same = (x, y) => String(x) === String(y);
    const lkSplit = (lk) => [lk.slice(0, lk.indexOf("|")), lk.slice(lk.indexOf("|") + 1)];
    /* What a lane plays at each moment of ids: the engine's own rule (laneValues in engine/state.js). */
    function laneValues(ids, lane, cur, Sc) {
      const ix = {};
      ids.forEach((id, i) => (ix[id] = i));
      const pts = Object.keys((lane && lane.points) || {})
        .filter((r) => ix[r] != null)
        .map((r) => ({ i: ix[r], v: lane.points[r] }))
        .sort((p, q) => p.i - q.i);
      const out = new Array(ids.length).fill(undefined);
      if (!pts.length) return out;
      for (let i = 0; i < ids.length; i++) {
        let a = null;
        let b = null;
        for (const p of pts) {
          if (p.i <= i) a = p;
          if (p.i >= i && !b) b = p;
        }
        if (!a) out[i] = b.v;
        else if (!b || a === b || lane.mode === "hold") out[i] = a.v;
        else {
          const pa = Sc.pos(cur, a.v);
          const pb = Sc.pos(cur, b.v);
          const t = (i - a.i) / (b.i - a.i);
          out[i] = pa == null || pb == null ? a.v : Sc.at(cur, pa + (pb - pa) * (lane.mode === "smooth" ? ease(t) : t));
        }
      }
      return out;
    }
    const fits = (ids, want, lane, cur, Sc, pts) => {
      const got = laneValues(ids, { mode: lane.mode, points: pts }, cur, Sc);
      return ids.map((id, i) => i).filter((i) => want[i] !== undefined && !same(got[i], want[i]));
    };
    /* Nodes (into pts) so the lane plays `want` at every moment of ids: first at the edges of the change, then
       wherever it still plays something else, until nothing differs. */
    function keepShape(ids, want, lane, cur, Sc, pts, edges) {
      if (!fits(ids, want, lane, cur, Sc, pts).length) return;
      edges.forEach((i) => i >= 0 && i < ids.length && want[i] !== undefined && !own(pts, ids[i]) && (pts[ids[i]] = want[i]));
      for (let pass = 0; pass <= ids.length; pass++) {
        const off = fits(ids, want, lane, cur, Sc, pts);
        if (!off.length) return;
        off.forEach((i) => (pts[ids[i]] = want[i]));
      }
    }
    /* The ids the engine will give the next k rows (its newId: "r" + st.next, skipping any id already used). */
    function freshIds(st, k) {
      const used = new Set([].concat(st.rows.map((r) => r.id), st.tracks.map((t) => t.id), st.links.map((l) => l.id), (st.refs || []).map((r) => r.id)));
      let next = Number(st.next) || 1;
      const out = [];
      while (out.length < k) {
        let id;
        do id = "r" + next++;
        while (used.has(id));
        used.add(id);
        out.push(id);
      }
      return out;
    }
    const copyLabel = (r, j) => (!r.label || r.label === r.id || /^moment \d+$/i.test(r.label) ? `Copy of moment ${j + 1}` : (r.label + " (again)").slice(0, 80));
    const span = (a, b) => (a === b ? `moment ${a + 1}` : `moments ${a + 1} to ${b + 1}`);
    const check = (st, a, b) => Number.isInteger(a) && Number.isInteger(b) && a >= 0 && a <= b && b < st.rows.length;
    /* k = b - a + 1 copies of moments a..b (numbered from 0) go right after b. h = { S (CurioScale), locked(lk),
       maxRows, maxLinks }. -> { cmds, k, ids (the copies' ids), nodes, links, full (joins not copied: no room),
       locked: [lane keys whose line now runs across the copies] } or { error }. */
    function insert(st, a, b, h) {
      h = h || {};
      const Sc = h.S;
      if (!check(st, a, b)) return { error: "Pick a moment of your film first." };
      const n = st.rows.length;
      const k = b - a + 1;
      const max = h.maxRows || 64;
      if (n + k > max) return { error: `A film holds ${max} moments here, and this would make ${n + k}. Take some out first.` };
      const ids = st.rows.map((r) => r.id);
      const fresh = freshIds(st, k);
      const newIds = ids.slice(0, b + 1).concat(fresh, ids.slice(b + 1));
      const copyOf = {};
      ids.slice(a, b + 1).forEach((id, i) => (copyOf[id] = fresh[i]));
      const isLocked = (lk) => !!(h.locked && h.locked(lk));
      const cmds = [];
      for (let i = 0; i < k; i++) cmds.push({ type: "addRow", at: b + 1 + i, copy: false, label: copyLabel(st.rows[a + i], a + i) });
      /* The moment's own material and pins come along, so the copy looks the same. */
      Object.keys(st.source).forEach((key) => {
        const [r, t, c] = key.split("|");
        if (copyOf[r]) cmds.push({ type: "setSource", row: copyOf[r], track: t, curiosity: c, value: st.source[key] });
      });
      Object.keys(st.edits).forEach((key) => {
        const [r, t, c] = key.split("|");
        const e = st.edits[key];
        if (!copyOf[r] || !e) return;
        cmds.push(e.off ? { type: "edit", row: copyOf[r], track: t, curiosity: c, off: true } : { type: "edit", row: copyOf[r], track: t, curiosity: c, value: e.v });
      });
      let nodes = 0;
      const locked = [];
      Object.keys(st.lanes)
        .sort()
        .forEach((lk) => {
          const lane = st.lanes[lk];
          const [track, cur] = lkSplit(lk);
          const old = laneValues(ids, lane, cur, Sc);
          const want = old.slice(0, b + 1).concat(old.slice(a, b + 1), old.slice(b + 1));
          if (isLocked(lk)) {
            if (fits(newIds, want, lane, cur, Sc, lane.points).length) locked.push(lk);
            return;
          }
          const pts = Object.assign({}, lane.points);
          ids.slice(a, b + 1).forEach((id) => own(lane.points, id) && (pts[copyOf[id]] = lane.points[id]));
          keepShape(newIds, want, lane, cur, Sc, pts, [a, b, b + 1, b + k]);
          Object.keys(pts).forEach((id) => {
            if (own(lane.points, id) && same(lane.points[id], pts[id])) return;
            cmds.push({ type: "setPoint", row: id, track, curiosity: cur, value: pts[id] });
            nodes++;
          });
        });
      /* Joins: copied inside the stretch, a longer gap across it. */
      const ix = {};
      ids.forEach((id, i) => (ix[id] = i));
      let room = (h.maxLinks || 200) - st.links.length;
      let links = 0;
      let full = 0;
      st.links.forEach((l) => {
        if (!l.scope || ix[l.scope.from] == null || ix[l.scope.to] == null) return;
        const lo = Math.min(ix[l.scope.from], ix[l.scope.to]);
        const hi = Math.max(ix[l.scope.from], ix[l.scope.to]);
        if (lo >= a && hi <= b) {
          if (isLocked(l.from.track + "|" + l.from.curiosity) || isLocked(l.to.track + "|" + l.to.curiosity)) return;
          if (room <= 0) return void full++;
          const body = JSON.parse(JSON.stringify(l));
          delete body.id;
          body.type = "addLink";
          body.scope = { from: copyOf[l.scope.from], to: copyOf[l.scope.to] };
          cmds.push(body);
          room--;
          links++;
        } else if (lo <= b && hi > b) {
          const w = Math.min(16, hi - lo + k);
          if (w !== l.within) cmds.push({ type: "updateLink", link: l.id, changes: { within: w } });
        }
      });
      return { cmds, k, ids: fresh, nodes, links, full, locked };
    }
    /* Moments a..b (numbered from 0) come out and everything after slides back. -> { cmds, k, ids (the moments
       taken out), nodes (nodes that go with them), links (joins that go), fixed (nodes put in so the moments
       around the gap keep playing what they did), locked: [lanes whose line now joins across the gap] } or
       { error, locked } when a locked lane has a node there. */
    function remove(st, a, b, h) {
      h = h || {};
      const Sc = h.S;
      if (!check(st, a, b)) return { error: "Pick a moment of your film first." };
      const n = st.rows.length;
      const k = b - a + 1;
      if (n - k < 1) return { error: "Your film needs at least one moment, so they can't all be taken out." };
      const ids = st.rows.map((r) => r.id);
      const gone = ids.slice(a, b + 1);
      const doomed = new Set(gone);
      const keep = ids.filter((id) => !doomed.has(id));
      const isLocked = (lk) => !!(h.locked && h.locked(lk));
      const hit = Object.keys(st.lanes)
        .sort()
        .find((lk) => isLocked(lk) && gone.some((id) => own(st.lanes[lk].points, id)));
      if (hit) return { error: `${Sc && Sc.label ? Sc.label(lkSplit(hit)[1]) : hit} is locked (🔒) and has a node on ${span(a, b)}, so nothing was taken out. Unlock it first, or pick other moments.`, locked: hit };
      const cmds = [];
      const ix = {};
      ids.forEach((id, i) => (ix[id] = i));
      let links = 0;
      st.links.forEach((l) => {
        if (!l.scope || ix[l.scope.from] == null || ix[l.scope.to] == null) return;
        if (doomed.has(l.scope.from) || doomed.has(l.scope.to)) {
          cmds.push({ type: "removeLink", link: l.id });
          return void links++;
        }
        const lo = Math.min(ix[l.scope.from], ix[l.scope.to]);
        const hi = Math.max(ix[l.scope.from], ix[l.scope.to]);
        if (lo < a && hi > b) {
          const w = Math.min(16, hi - lo - k);
          if (w !== l.within) cmds.push({ type: "updateLink", link: l.id, changes: { within: w } });
        }
      });
      let nodes = 0;
      let fixed = 0;
      const locked = [];
      Object.keys(st.lanes)
        .sort()
        .forEach((lk) => {
          const lane = st.lanes[lk];
          const [track, cur] = lkSplit(lk);
          gone.forEach((id) => own(lane.points, id) && nodes++);
          const old = laneValues(ids, lane, cur, Sc);
          const want = old.slice(0, a).concat(old.slice(b + 1));
          const pts = {};
          Object.keys(lane.points).forEach((id) => !doomed.has(id) && (pts[id] = lane.points[id]));
          if (isLocked(lk)) {
            if (fits(keep, want, lane, cur, Sc, pts).length) locked.push(lk);
            return;
          }
          /* A lane whose every node was in the gap has nothing left to play: it goes with them. */
          if (!Object.keys(pts).length) return;
          keepShape(keep, want, lane, cur, Sc, pts, [a - 1, a]);
          Object.keys(pts).forEach((id) => {
            if (own(lane.points, id) && same(lane.points[id], pts[id])) return;
            cmds.push({ type: "setPoint", row: id, track, curiosity: cur, value: pts[id] });
            fixed++;
          });
        });
      gone.forEach((id) => cmds.push({ type: "removeRow", row: id }));
      return { cmds, k, ids: gone, nodes, links, fixed, locked };
    }
    /* The Screen's own per-moment things. op = { kind: "insert" | "delete", a, b }, moments numbered from 0. */
    /* Transitions: { "into": { kind, len } }, keyed by the number (from 1) of the moment the join leads into. A copy
       comes in on a cut; the joins inside a duplicated stretch are copied with it; the join into the moment after a
       gap keeps the transition that moment came in with. */
    function joins(j, op) {
      const out = {};
      const A = op.a + 1;
      const B = op.b + 1;
      const k = B - A + 1;
      Object.keys(j || {}).forEach((key) => {
        const m = Number(key);
        if (!Number.isInteger(m)) return;
        let to;
        if (op.kind === "insert") {
          to = m > B ? m + k : m;
          if (m > A && m <= B) out[String(m + k)] = j[key];
        } else to = m < A ? m : m > B ? m - k : null;
        if (to != null && to >= 2) out[String(to)] = j[key];
      });
      return out;
    }
    /* Words on the frame: [{ id, from, to, ... }], moments numbered from 1. Words showing on the stretch's last
       moment run on over the copies; words wholly inside the stretch get a copy on the copies; words after it
       slide along. Taking moments out shortens the words over them, and words wholly inside go.
       -> { items, copied, gone } */
    function texts(items, op, max) {
      const A = op.a + 1;
      const B = op.b + 1;
      const k = B - A + 1;
      const out = [];
      const extra = [];
      let gone = 0;
      (items || []).forEach((t) => {
        const x = Object.assign({}, t);
        if (op.kind === "insert") {
          if (t.from > B) Object.assign(x, { from: t.from + k, to: t.to + k });
          else if (t.to >= B) x.to = t.to + k;
          else if (t.from >= A) extra.push(Object.assign({}, t, { from: t.from + k, to: t.to + k }));
          out.push(x);
        } else {
          const f = t.from < A ? t.from : t.from > B ? t.from - k : A;
          const e = t.to < A ? t.to : t.to > B ? t.to - k : A - 1;
          if (f <= e) out.push(Object.assign(x, { from: f, to: e }));
          else gone++;
        }
      });
      let num = Math.max(0, ...out.map((t) => Number((/^t(\d+)$/.exec(t.id) || [])[1]) || 0));
      let copied = 0;
      extra.forEach((c) => {
        if (out.length >= (max || 60)) return;
        out.push(Object.assign(c, { id: "t" + ++num }));
        copied++;
      });
      return { items: out, copied, gone };
    }
    /* Markers are kept by moment id, so they slide along by themselves; one on a moment taken out goes. */
    const markers = (list, goneIds) => (list || []).filter((m) => !(goneIds || []).includes(m.row));
    /* The play range [from, to] (numbered from 0), or null. */
    function range(r, op) {
      if (!Array.isArray(r) || r.length < 2) return null;
      const k = op.b - op.a + 1;
      let [p, q] = r;
      if (op.kind === "insert") {
        if (p > op.b) p += k;
        if (q >= op.b) q += k;
      } else {
        p = p < op.a ? p : p > op.b ? p - k : op.a;
        q = q < op.a ? q : q > op.b ? q - k : op.a - 1;
      }
      return p < q ? [p, q] : null;
    }
    return { laneValues, freshIds, insert, remove, joins, texts, markers, range, span };
  })();
  window.CurioScreenRipple = RIPPLE;

  /* The page side: the buttons, keys and Quick find actions all come here. */
  const rippleSteps = { undo: [], redo: [] };
  let rippleHooked = false;
  function rippleSnap() {
    const LL = window.CurioLanes;
    return JSON.parse(
      JSON.stringify({
        joins: TRANSITIONS.clean(trData()).joins,
        items: txtData().items,
        markers: LL && LL.tools ? LL.tools().markers || [] : [],
        range: Array.isArray(prefs.range) ? prefs.range : null,
      })
    );
  }
  function ripplePut(s) {
    trStore().send({ type: "replace", joins: s.joins, label: "Moments moved" }, { record: false });
    txtStore().send({ type: "replace", items: s.items, label: "Moments moved" }, { record: false });
    if (window.CurioLanes && window.CurioLanes.setMarkers) window.CurioLanes.setMarkers(s.markers);
    prefs.range = s.range ? s.range.slice() : null;
    save();
    if (!page || page.hidden) return;
    if (row > nRows() - 1) setRow(nRows() - 1);
    drawViewers();
    if (lanes) lanes.draw();
  }
  /* The engine's step is the undo step: when it is undone or redone (however that happens), the rest follows. */
  function rippleHook() {
    if (rippleHooked || !E()) return;
    rippleHooked = true;
    E().on((ev) => {
      const l = String((ev && ev.label) || "");
      const top = (list) => list[list.length - 1];
      if (/^Undo: /.test(l)) {
        const s = top(rippleSteps.undo);
        if (s && l === "Undo: " + s.label) rippleSteps.redo.push(rippleSteps.undo.pop()), ripplePut(s.before);
      } else if (/^Redo: /.test(l)) {
        const s = top(rippleSteps.redo);
        if (s && l === "Redo: " + s.label) rippleSteps.undo.push(rippleSteps.redo.pop()), ripplePut(s.after);
      } else if (l === "Load" || l === "Reset") {
        rippleSteps.undo = [];
        rippleSteps.redo = [];
      } else rippleSteps.redo = [];
    });
  }
  const rippleWords = (xs) => (xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
  function rippleSay(m) {
    if (page) toast(m);
    if (lanes && lanes.say) lanes.say(m);
  }
  /* kind: "add" (a copy of the playhead's moment right after it), "duplicate" (the stretch selected on the
     timeline, else the playhead's moment) or "delete" (the selected stretch, else the playhead's moment).
     o.a and o.b (moments from 0) pick the moments instead. */
  function ripple(kind, o) {
    o = o || {};
    const Eng = E();
    if (!Eng || !S()) return rippleSay("Your film is not loaded yet."), { ok: false };
    const st = Eng.state();
    const raw = lanes && lanes.area ? lanes.area() : null;
    const ar = curArea();
    let a = row;
    let b = row;
    if (Number.isInteger(o.a)) (a = o.a), (b = Number.isInteger(o.b) ? o.b : o.a);
    else if (kind !== "add" && ar) (a = ar.j0), (b = Math.min(ar.j1, st.rows.length - 1));
    const LL = window.CurioLanes;
    const h = { S: S(), locked: (lk) => !!(LL && LL.isLocked && LL.isLocked(lk)), maxRows: (Eng.LIMIT && Eng.LIMIT.rows) || 64, maxLinks: (Eng.LIMIT && Eng.LIMIT.links) || 200 };
    const del = kind === "delete";
    const plan = del ? RIPPLE.remove(st, a, b, h) : RIPPLE.insert(st, a, b, h);
    if (plan.error) return rippleSay(plan.error), { ok: false, error: plan.error, locked: plan.locked };
    if (plan.cmds.length > 500) {
      const e = `That is too big a change for one step (${plan.cmds.length} small changes; the most is 500). Pick a shorter stretch.`;
      return rippleSay(e), { ok: false, error: e };
    }
    const k = plan.k;
    const op = { kind: del ? "delete" : "insert", a, b };
    const before = rippleSnap();
    const tx = RIPPLE.texts(before.items, op, TEXT.MAX);
    const after = { joins: RIPPLE.joins(before.joins, op), items: tx.items, markers: RIPPLE.markers(before.markers, del ? plan.ids : []), range: RIPPLE.range(before.range, op) };
    const where = RIPPLE.span(a, b);
    const label = kind === "add" ? `Add a moment after moment ${a + 1}` : del ? `Take out ${where}` : `Duplicate ${where}`;
    rippleHook();
    const r = Eng.send({ type: "batch", label, commands: plan.cmds });
    if (!r.ok) return rippleSay(r.error), r;
    rippleSteps.undo.push({ label, before, after });
    if (rippleSteps.undo.length > 100) rippleSteps.undo.shift();
    rippleSteps.redo = [];
    ripplePut(after);
    const names = plan.locked.map((lk) => labelOf(lk.slice(lk.indexOf("|") + 1)));
    const one = names.length === 1;
    const lockNote = names.length ? ` ${rippleWords(names)} ${one ? "is" : "are"} locked (🔒), so ${one ? "its line was" : "their lines were"} left alone and now ${del ? (one ? "joins" : "join") : one ? "runs" : "run"} across ${del ? "the gap" : "the new moments"}.` : "";
    const moved = "nodes, joins, markers, transitions and words";
    let msg;
    if (del) {
      const lost = [];
      if (plan.nodes) lost.push(`${plan.nodes} node${plan.nodes === 1 ? "" : "s"}`);
      if (plan.links) lost.push(`${plan.links} join${plan.links === 1 ? "" : "s"}`);
      const mk = before.markers.length - after.markers.length;
      if (mk) lost.push(`${mk} marker${mk === 1 ? "" : "s"}`);
      if (tx.gone) lost.push(`${tx.gone} text${tx.gone === 1 ? "" : "s"}`);
      msg = `Took out ${where}. Everything after moved ${k} moment${k === 1 ? "" : "s"} earlier (${moved}).${lost.length ? ` ${rippleWords(lost)} on ${k === 1 ? "it" : "them"} went too.` : ""} Undo takes it back.`;
      setRow(Math.min(a, nRows() - 1));
      if (raw && lanes.selectArea) lanes.selectArea(null);
    } else {
      const copies = RIPPLE.span(b + 1, b + k);
      msg = kind === "add" ? `Added moment ${b + 2}, a copy of moment ${a + 1}. Everything after it moved one moment later (${moved}). Undo takes it back.` : `Duplicated ${where}: the copy is ${copies}, and everything after moved ${k} moment${k === 1 ? "" : "s"} later (${moved}). Undo takes it back.`;
      if (plan.full) msg += ` ${plan.full} join${plan.full === 1 ? " was" : "s were"} not copied: your film holds ${h.maxLinks} joins here.`;
      setRow(b + 1);
      if (kind === "duplicate" && raw && lanes.selectArea) lanes.selectArea(Object.assign({}, raw, { j0: b + 1, j1: b + k }));
    }
    rippleSay(msg + lockNote);
    return { ok: true, k, a, b, message: msg + lockNote };
  }
  /* Quick find: the same, with the stretch's moments in plain words when one is selected. */
  function rippleFindActions(add) {
    const ar = curArea();
    if (!ar) return;
    const where = RIPPLE.span(ar.j0, ar.j1);
    add("ripple-dup-area", `Duplicate the selected stretch (${where})`, "A copy of every moment in it goes right after it; everything after slides later", "⇧⌥M", () => ripple("duplicate"));
    add("ripple-del-area", `Take out the selected stretch (${where})`, "The moments come out and everything after slides earlier to close the gap", "⌥⌫", () => ripple("delete"));
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
  /* ---------- My templates (CapCut's Templates, made curiosity-centric) ----------
     Stretches of the timeline you saved with Save as template (the timeline's area toolbar, or ⌘K), shown at the
     top of the Templates tab. Each card has the name, the note, how many moments, which curiosities and a tiny
     picture of each lane's shape. Use at the playhead (or drag the card onto the timeline at a moment; tick
     Stretch to the selected area to fit it to a selection instead), Rename, Delete (asks once more) and Export.
     Export all and Import… share them as a .json file. The list and its rules live in lanes.js (CurioLanes:
     templates(), useTemplateCommands, exportTemplates, importTemplates); using one is one undo step. */
  let tplStretch = false;
  const TPL = () => (window.CurioLanes && window.CurioLanes.templates ? window.CurioLanes : null);
  const tplList = () => (TPL() ? TPL().templates() : []);
  function tplCard(t) {
    return `<div class="sc-card sc-tplcard" data-card="mytpl" data-tpl="${esc(t.id)}" draggable="true" title="Drag onto the timeline to use it at that moment">
      <div class="sc-tpl-body"><strong>${esc(t.name)}</strong>${t.note ? `<small class="sc-tpl-note">${esc(t.note)}</small>` : ""}<small class="sc-tpl-what">${esc(TPL().templateSummary(t))}</small></div>
      <div class="sc-tpl-pic" aria-hidden="true">${TPL().templatePreview(t, 132, 48)}</div>
      <div class="sc-tpl-acts"><button type="button" class="on" data-tpl-act="use" data-tpl-id="${esc(t.id)}" title="Write this template's nodes starting at the playhead (or across the selected area when Stretch to the selected area is ticked). One undo takes it back.">Use at the playhead</button><button type="button" data-tpl-act="analogy" data-tpl-id="${esc(t.id)}" title="Carry this template's shape onto related curiosities instead (Shot size becomes Lens length, say). Shows what will change first.">Use as an analogy</button><button type="button" data-tpl-act="rename" data-tpl-id="${esc(t.id)}" title="Change its name or note">Rename</button><button type="button" data-tpl-act="delete" data-tpl-id="${esc(t.id)}" title="Delete this template (your film is not changed)">Delete</button><button type="button" data-tpl-act="export" data-tpl-id="${esc(t.id)}" title="Save this template as a .json file to share">Export</button></div>
    </div>`;
  }
  function myTplHtml() {
    const list = tplList();
    if (!TPL()) return "";
    return `<section class="sc-mytpl" id="sc-mytpl" aria-label="My templates">
      <div class="sc-mytpl-h"><p class="sc-grid-h sc-fave-h">My templates <small>${list.length}</small></p>
        <span class="sc-mytpl-tools"><label title="When an area is selected on the timeline, Use fits the template to it: its moves spread out or squeeze in to fill the selection"><input type="checkbox" data-tpl-stretch${tplStretch ? " checked" : ""}> Stretch to the selected area</label><button type="button" data-tpl-act="export-all"${list.length ? "" : " disabled"} title="Save every template as one .json file to share">Export all</button><button type="button" data-tpl-act="import" title="Bring in templates from a .json file someone shared">Import…</button><input type="file" accept=".json,application/json" data-tpl-file hidden></span></div>
      ${list.length ? `<div class="sc-cards sc-mytpl-cards">${list.map(tplCard).join("")}</div>` : `<p class="sc-k">Select a stretch on the timeline (drag across empty space on the lanes), then press Save as template in the timeline's toolbar. It shows up here, ready to use again in this film or another.</p>`}
      <p class="sc-grid-h sc-fave-h">Ready-made recipes</p>
    </section>`;
  }
  const tplSay = (m) => {
    if (lanes && lanes.say) lanes.say(m);
    toast(m);
  };
  function tplUse(id, o) {
    if (!lanes || !lanes.useTemplate) return toast("The timeline is not ready yet."), { ok: false };
    o = Object.assign({ stretch: tplStretch && !!curArea() }, o || {});
    if (tplStretch && !curArea() && o.at == null) toast("No area is selected, so it goes at the playhead.");
    const r = lanes.useTemplate(id, o);
    if (r && r.message) toast(r.message);
    else if (r && r.error) toast(r.error);
    return r;
  }
  function tplRename(id, name, note) {
    const list = tplList();
    const t = list.find((x) => x.id === id);
    name = String(name || "").trim().slice(0, 60);
    if (!t) return { ok: false, error: "That template is gone." };
    if (!name) return { ok: false, error: "Give the template a name first." };
    const was = t.name;
    t.name = name;
    if (note != null) t.note = String(note).trim().slice(0, 240);
    TPL().saveTemplates(list);
    const message = was === name ? `Kept the template "${name}"${note != null ? " with its note" : ""}.` : `Renamed the template "${was}" to "${name}".`;
    tplSay(message);
    return { ok: true, message };
  }
  function tplRemove(id) {
    const list = tplList();
    const t = list.find((x) => x.id === id);
    if (!t) return { ok: false, error: "That template is gone." };
    TPL().saveTemplates(list.filter((x) => x !== t));
    const message = `Deleted the template "${t.name}". Your film is not changed.`;
    tplSay(message);
    return { ok: true, message };
  }
  const tplExportJson = (ids) => TPL().exportTemplates(ids ? tplList().filter((t) => ids.includes(t.id)) : tplList());
  function tplImport(text) {
    const r = TPL().importTemplates(text, tplList());
    if (r.error) return tplSay(r.error), { ok: false, error: r.error };
    if (r.added.length) TPL().saveTemplates(r.list);
    const names = r.added.map((t) => `"${t.name}"`);
    const parts = [r.added.length ? `Imported ${r.added.length} template${r.added.length === 1 ? "" : "s"}: ${names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]}.` : "No new templates in that file."];
    if (r.skipped) parts.push(`${r.skipped} ${r.skipped === 1 ? "was" : "were"} already here or empty, so ${r.skipped === 1 ? "it was" : "they were"} skipped.`);
    if (r.dropped) parts.push(`${r.dropped} lane${r.dropped === 1 ? "" : "s"} of curiosities this app doesn't know ${r.dropped === 1 ? "was" : "were"} left out.`);
    const message = parts.join(" ");
    tplSay(message);
    return { ok: true, added: r.added.map((t) => t.id), skipped: r.skipped, dropped: r.dropped, message };
  }
  function tplDownload(ids, name) {
    const blob = new Blob([tplExportJson(ids)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const tplSlug = (s) => String(s || "template").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "template";
  /* The small pop-up for a template's new name and note, beside its card (Enter saves, Esc cancels). */
  function tplRenamePop(id, btn) {
    const t = tplList().find((x) => x.id === id);
    if (!t || !page) return;
    const old = page.querySelector(".sc-tplpop");
    if (old) old.remove();
    const pop = document.createElement("div");
    pop.className = "sc-tplpop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Rename template");
    pop.innerHTML = `<p><strong>Rename template</strong></p>
      <label>Name <input type="text" data-tplpop-name maxlength="60" value="${esc(t.name)}"></label>
      <label>Note (optional) <input type="text" data-tplpop-note maxlength="240" placeholder="e.g. hold wide, then push in on the face" value="${esc(t.note || "")}"></label>
      <div class="sc-tplpop-btns"><button type="button" data-tplpop="cancel">Cancel</button><button type="button" data-tplpop="ok" class="on">Rename</button></div>`;
    const r = btn ? btn.getBoundingClientRect() : { left: 40, bottom: 80 };
    pop.style.left = Math.max(8, Math.min(window.innerWidth - 290, r.left)) + "px";
    pop.style.top = Math.max(8, Math.min(window.innerHeight - 190, r.bottom + 6)) + "px";
    const close = () => {
      pop.remove();
      const b = page.querySelector(`[data-tpl-act="rename"][data-tpl-id="${CSS.escape(id)}"]`);
      if (b) b.focus();
    };
    const done = () => {
      const res = tplRename(id, pop.querySelector("[data-tplpop-name]").value, pop.querySelector("[data-tplpop-note]").value);
      if (!res.ok) return toast(res.error), pop.querySelector("[data-tplpop-name]").focus();
      close();
    };
    pop.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Escape") return ev.preventDefault(), close();
      if (ev.key === "Enter" && ev.target.matches("input")) ev.preventDefault(), done();
    });
    pop.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const b = ev.target.closest("[data-tplpop]");
      if (b) return b.dataset.tplpop === "ok" ? done() : close();
    });
    page.appendChild(pop);
    const inp = pop.querySelector("[data-tplpop-name]");
    inp.focus();
    inp.select();
    return pop;
  }
  /* Use as an analogy: a small pop-up first lists where each lane's shape will land ("Shot size → Lens length",
     and its values: "close → normal"), each with a pick of other close cousins, then Apply writes it (one undo
     step) and Cancel writes nothing. Keys typed in it stay in it (inToolWindow knows .sc-tplpop). */
  const tplAnalogyPlan = (id, picks) => {
    const t = tplList().find((x) => x.id === id);
    return t ? Object.assign(TPL().templateAnalogy(t, { picks: picks || null }), { template: t }) : null;
  };
  /* The picks as they stand: the first plan's choices, then whatever was changed in the pop-up. */
  const tplAnalogyPicks = (id, changed) => {
    const plan = tplAnalogyPlan(id);
    if (!plan) return null;
    const out = {};
    plan.pairs.forEach((p) => (out[p.from] = p.to || ""));
    return Object.assign(out, changed || {});
  };
  function tplAnalogyUse(id, picks) {
    const plan = tplAnalogyPlan(id, picks);
    if (!plan) return toast("That template is gone."), { ok: false, error: "That template is gone." };
    if (plan.clash) {
      const e = `Two lanes would both land on ${S() ? S().label(plan.clash) : plan.clash}. Pick a different cousin for one of them.`;
      return toast(e), { ok: false, error: e };
    }
    const keep = {};
    plan.pairs.forEach((p) => (keep[p.from] = p.to || ""));
    return tplUse(id, { analogy: keep });
  }
  function tplAnalogyPop(id, btn) {
    const t = tplList().find((x) => x.id === id);
    if (!t || !page) return null;
    const old = page.querySelector(".sc-tplpop");
    if (old) old.remove();
    const changed = {};
    const pop = document.createElement("div");
    pop.className = "sc-tplpop sc-tplan";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Use as an analogy");
    const lab = (cur) => (S() ? S().label(cur) : cur);
    const valWords = (p) => p.values.map((v) => `${v.from} → ${v.to == null ? "?" : v.to}`).join(", ");
    const drawPop = () => {
      const plan = tplAnalogyPlan(id, tplAnalogyPicks(id, changed));
      const rows = plan.pairs
        .map(
          (p) => `<li data-tplan-row="${esc(p.from)}"><span class="sc-tplan-map"><strong>${esc(p.fromLabel)}</strong> → ${
            p.choices.length
              ? `<select data-tplan-pick="${esc(p.from)}" aria-label="Where the shape of ${esc(p.fromLabel)} goes">${p.choices.map((c) => `<option value="${esc(c.cur)}"${c.cur === p.to ? " selected" : ""}>${esc(c.label)}</option>`).join("")}<option value=""${p.to ? "" : " selected"}>Leave it out</option></select>`
              : `<em>no close cousin</em>`
          }</span><small class="sc-tplan-vals">${p.to ? esc(valWords(p)) : "Left out: nothing is written for it."}</small></li>`
        )
        .join("");
      const can = !!plan.clip && !plan.clash;
      pop.innerHTML = `<p><strong>Use "${esc(t.name)}" as an analogy</strong></p>
        <p class="sc-tplan-help">Each lane's ups and downs move onto a related curiosity. A value keeps its place on the scale: the low end stays low, the top stays the top.</p>
        <ul class="sc-tplan-list">${rows}</ul>
        ${plan.clash ? `<p class="sc-tplan-warn">Two lanes both land on ${esc(lab(plan.clash))}. Pick a different one for one of them.</p>` : !plan.clip ? `<p class="sc-tplan-warn">Nothing to write: every lane is left out.</p>` : ""}
        <p class="sc-tplan-help">It starts at the playhead. One undo takes it back. Locked lanes (🔒) are skipped.</p>
        <div class="sc-tplpop-btns"><button type="button" data-tplpop="cancel">Cancel</button><button type="button" data-tplpop="ok" class="on"${can ? "" : " disabled"}>Apply</button></div>`;
    };
    drawPop();
    /* Beside the button, kept inside the window (a phone included). */
    const place = () => {
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      const r = btn && btn.isConnected && btn.offsetParent ? btn.getBoundingClientRect() : { left: (window.innerWidth - w) / 2, bottom: 72 };
      pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + "px";
      pop.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, r.bottom + 6)) + "px";
    };
    const close = () => {
      pop.remove();
      const b = page.querySelector(`[data-tpl-act="analogy"][data-tpl-id="${CSS.escape(id)}"]`);
      if (b && b.offsetParent) b.focus();
    };
    const done = () => {
      const res = tplAnalogyUse(id, tplAnalogyPicks(id, changed));
      if (res && res.ok === false && /Pick a different/.test(res.error || "")) return;
      close();
    };
    pop.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Escape") return ev.preventDefault(), close();
      if (ev.key === "Enter" && !ev.target.matches("select, button")) ev.preventDefault(), done();
    });
    pop.addEventListener("keyup", (ev) => ev.stopPropagation());
    pop.addEventListener("change", (ev) => {
      ev.stopPropagation();
      const sel = ev.target.closest && ev.target.closest("[data-tplan-pick]");
      if (!sel) return;
      changed[sel.dataset.tplanPick] = sel.value;
      drawPop();
      place();
      const again = pop.querySelector(`[data-tplan-pick="${CSS.escape(sel.dataset.tplanPick)}"]`);
      if (again) again.focus();
    });
    pop.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const b = ev.target.closest("[data-tplpop]");
      if (b && !b.disabled) return b.dataset.tplpop === "ok" ? done() : close();
    });
    page.appendChild(pop);
    place();
    const first = pop.querySelector('[data-tplpop="ok"]:not([disabled])') || pop.querySelector('[data-tplpop="cancel"]');
    if (first) first.focus();
    return pop;
  }
  function tplClick(e) {
    const b = e.target.closest && e.target.closest("[data-tpl-act]");
    if (!b || !page.contains(b)) return;
    const id = b.dataset.tplId;
    const act = b.dataset.tplAct;
    if (act === "use") return tplUse(id);
    if (act === "rename") return tplRenamePop(id, b);
    if (act === "analogy") return tplAnalogyPop(id, b);
    if (act === "export") {
      const t = tplList().find((x) => x.id === id);
      if (t) tplDownload([id], `curiomatic-template-${tplSlug(t.name)}.json`), toast(`Saved "${t.name}" as a .json file. Anyone can bring it in with Import…`);
      return;
    }
    if (act === "export-all") return tplDownload(null, "curiomatic-templates.json"), toast(`Saved ${tplList().length} template${tplList().length === 1 ? "" : "s"} as one .json file.`);
    if (act === "import") {
      const f = page.querySelector("[data-tpl-file]");
      return f && f.click();
    }
    if (act === "delete") {
      /* Two clicks: deleting a template can't be undone. */
      if (b.dataset.sure !== "1") {
        b.dataset.sure = "1";
        b.textContent = "Delete for good?";
        b.classList.add("sl-warn");
        return toast("Press Delete for good? to delete it. Your film is not changed.");
      }
      return tplRemove(id);
    }
  }
  function tplChange(e) {
    const t = e.target;
    if (!t.matches) return;
    if (t.matches("[data-tpl-stretch]")) {
      tplStretch = t.checked;
      return toast(tplStretch ? (curArea() ? "Use now fits a template to the selected area." : "Use will fit a template to the selected area. Select one on the timeline first.") : "Use puts a template at the playhead, at its own length.");
    }
    if (t.matches("[data-tpl-file]") && t.files && t.files[0]) {
      const file = t.files[0];
      t.value = "";
      (file.text ? file.text() : Promise.reject(new Error("no text"))).then(tplImport, () => tplSay("That file couldn't be read."));
    }
  }
  function tplDragStart(e) {
    const c = e.target.closest && e.target.closest("[data-tpl][draggable]");
    if (!c || !e.dataTransfer || !TPL()) return;
    e.dataTransfer.setData(TPL().TPL_MIME, c.dataset.tpl);
    e.dataTransfer.setData("text/plain", (tplList().find((x) => x.id === c.dataset.tpl) || {}).name || "");
    e.dataTransfer.effectAllowed = "copy";
  }
  let tplWired = false;
  function tplWire() {
    if (tplWired || !page) return;
    tplWired = true;
    page.addEventListener("click", tplClick);
    page.addEventListener("change", tplChange);
    page.addEventListener("dragstart", tplDragStart);
    window.addEventListener("curio-templates", () => prefs.libTab === "templates" && drawLibrary());
  }
  /* ⌘K's actions: save the selected stretch as a template, and use each one at the playhead. */
  function tplFindActions(add) {
    if (!TPL()) return;
    if (curArea()) add("tpl-save", "Save as template", "Keep the selected stretch of the timeline under a name, to use again anywhere", "", () => (lanes ? lanes.templateName() : toast("The timeline is not ready yet.")));
    tplList().forEach((t) => {
      add("tpl-use:" + t.id, `Use template: ${t.name}`, (t.note ? t.note + " · " : "") + TPL().templateSummary(t), "", () => tplUse(t.id));
      add("tpl-analogy:" + t.id, `Use template as an analogy: ${t.name}`, "Carry its shape onto related curiosities (shows what will change first) · " + TPL().templateSummary(t), "", () => setTimeout(() => tplAnalogyPop(t.id, null), 0));
    });
  }
  const TPL_API = {
    list: () => JSON.parse(JSON.stringify(tplList())),
    save: (name, note) => (lanes ? lanes.saveTemplate(name, note) : { ok: false, error: "The timeline is not ready yet." }),
    use: (id, o) => tplUse(id, o),
    rename: tplRename,
    remove: tplRemove,
    exportJson: tplExportJson,
    importJson: tplImport,
    stretch: (on) => (on != null && (tplStretch = !!on), tplStretch),
    /* As an analogy: plan(id, picks?) -> { pairs, left, clash, ok } (what would change), preview(id) opens the
       pop-up, analogy(id, picks?) uses it at once (one undo step). */
    plan: (id, picks) => {
      const p = tplAnalogyPlan(id, picks);
      return p ? JSON.parse(JSON.stringify({ pairs: p.pairs, left: p.left, clash: p.clash, ok: !!p.clip && !p.clash })) : null;
    },
    preview: (id) => !!tplAnalogyPop(id, page && page.querySelector(`[data-tpl-act="analogy"][data-tpl-id="${CSS.escape(id)}"]`)),
    analogy: (id, picks) => tplAnalogyUse(id, picks),
  };
  /* Favorites and Recently used (CapCut's star on any effect, and its Recently used list). Kept in localStorage
     "curiosities-screen-faves-v1" as { faves: ["level|id"], recent: ["level|id"] }: a view setting, not part of
     the film and never an undo step. faves are in the order starred; recent is newest first, at most 12, no
     repeats. Ids the database no longer has are skipped quietly. */
  const FAVE_KEY = "curiosities-screen-faves-v1";
  const FAVE_LEVELS = ["curiosity", "suite", "proximity", "proximitySuite"];
  const RECENT_MAX = 12;
  const faveRef = (level, id) => level + "|" + id;
  function faveClean(list, max) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach((x) => {
      if (typeof x !== "string" || out.includes(x)) return;
      if (x.indexOf("|") > 0 && FAVE_LEVELS.includes(x.slice(0, x.indexOf("|")))) out.push(x);
    });
    return max ? out.slice(0, max) : out;
  }
  function faveLoad() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(FAVE_KEY));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return { faves: faveClean(p.faves), recent: faveClean(p.recent, RECENT_MAX) };
  }
  let faves = faveLoad();
  function faveSave() {
    try {
      localStorage.setItem(FAVE_KEY, JSON.stringify(faves));
    } catch (e) {}
  }
  /* Pure steps on a { faves, recent } object, so tests can check them with no page. */
  function faveToggle(state, ref) {
    const has = state.faves.includes(ref);
    return { faves: has ? state.faves.filter((x) => x !== ref) : state.faves.concat(ref), recent: state.recent.slice() };
  }
  function faveUsed(state, ref) {
    return { faves: state.faves.slice(), recent: [ref].concat(state.recent.filter((x) => x !== ref)).slice(0, RECENT_MAX) };
  }
  /* The item a saved ref names, or null when the database no longer has it. A curiosity named by its lane key
     ("shotSize.setting", as in the My film tab) is found by its curiosity. */
  function faveItem(ref) {
    const at = String(ref).indexOf("|");
    const level = ref.slice(0, at);
    const id = ref.slice(at + 1);
    if (at < 1 || !L() || !FAVE_LEVELS.includes(level)) return null;
    let it = L().get(level, id);
    if (!it && level === "curiosity" && L().base) it = L().get("curiosity", L().base(id));
    return it ? { level, it } : null;
  }
  /* A card's own ref: curiosities are kept by their curiosity id, so a lane key and its curiosity share one star. */
  function cardRef(level, it) {
    const f = faveItem(faveRef(level, it.id));
    return f ? faveRef(level, f.it.id) : "";
  }
  const faveItems = (list) => list.map(faveItem).filter(Boolean);
  function faveStar(ref) {
    const f = faveItem(ref);
    if (!f) return;
    const r = faveRef(f.level, f.it.id);
    faves = faveToggle(faves, r);
    faveSave();
    toast(faves.faves.includes(r) ? `${f.it.label} is in Favorites.` : `${f.it.label} is out of Favorites.`);
    drawLibrary();
    const b = page && [...page.querySelectorAll("[data-fave]")].find((x) => x.dataset.fave === r);
    if (b) b.focus();
  }
  function faveUse(level, id) {
    const f = faveItem(faveRef(level, id));
    if (!f) return;
    faves = faveUsed(faves, faveRef(level, f.it.id));
    faveSave();
  }
  function faveGroups() {
    const recent = faveItems(faves.recent);
    const out = [];
    if (recent.length) out.push({ id: "fav:recent", label: "Recently used", items: recent });
    out.push({ id: "fav:stars", label: "Starred", items: faveItems(faves.faves), empty: "Star anything in the library to keep it here." });
    return out;
  }
  function cardHtml(level, it) {
    if (level === "fcp") return it.cur ? `<div class="sc-card sc-fcp" data-card="fcp"><button type="button" class="sc-card-b" data-pick-card="curiosity|${esc(it.cur)}"><strong>${esc(it.label)}</strong><small>${esc(it.plain)}</small><em>Final Cut Pro</em></button></div>` : `<div class="sc-card sc-fcp" data-card="fcp"><div class="sc-card-b"><strong>${esc(it.label)}</strong><small>${esc(it.plain)}</small><em>Final Cut Pro</em></div></div>`;
    if (level === "link") return `<div class="sc-card" data-card="link"><div class="sc-card-b"><strong>${esc(it.label)}</strong><small>${esc(it.plain)}</small><em>Proximity</em></div></div>`;
    const on = prefs.sel.level === level && prefs.sel.id === it.id;
    let sub = it.plain || "";
    if (level === "suite") sub = (it.members || []).length + " curiosities: " + [...new Set((it.members || []).map((m) => labelOf(keyFor(m.curiosity))))].slice(0, 4).join(", ");
    const tag = level === "curiosity" ? (isAdv(it) ? "Advanced: Final Cut Pro" : it.source === "Final Cut Pro and CapCut" ? "New from editing" : "") : L().LEVELS.find((l) => l.id === level).label;
    /* Yours (screen/mine.js): a small "mine" mark and a ✎ to change, share or delete it. */
    const mine = isMineIt(it.id) && !!MY_WORD[level];
    const add = level === "proximity" || level === "proximitySuite" ? "Add it to my film" : level === "suite" ? "Put its curiosities on the timeline" : "Put it on the timeline";
    const k = level === "curiosity" ? keyFor(it.id) : "";
    const tiles = on && k && prefs.view !== "arrange" ? tilesOf(k) : [];
    const here = tiles.length ? String(valueHere(k)) : "";
    return `<div class="sc-card${on ? " on" : ""}${tiles.length ? " wide" : ""}${mine ? " mine" : ""}" data-card="${esc(level)}" data-id="${esc(it.id)}" title="${esc(it.plain || it.label)}">
      <button type="button" class="sc-card-b" data-pick-card="${esc(level)}|${esc(it.id)}"><strong>${esc(it.label)}</strong><small>${esc(sub)}</small>${tag || mine ? `<em>${mine ? `<b class="sc-mine-tag">mine</b>` : ""}${esc(tag)}</em>` : ""}</button>
      ${mine ? `<button type="button" class="sc-my-edit" data-my-edit="${esc(level)}|${esc(it.id)}" aria-label="Change, share or delete ${esc(it.label)}" title="Change it, share it or delete it">✎</button>` : ""}
      <button type="button" class="sc-plus" data-add-card="${esc(level)}|${esc(it.id)}" aria-label="${esc(add)}: ${esc(it.label)}" title="${esc(add)}">+</button>
      ${starHtml(level, it)}
      ${tiles.length ? `<div class="sc-tiles" role="group" aria-label="Settings of ${esc(it.label)}"><span class="sc-k">Drop a setting at moment ${row + 1}:</span>${tiles.map((v) => `<button type="button" data-drop="${esc(k)}" data-v="${esc(v)}" class="${String(v) === here ? "on" : ""}">${esc(v)}${S().domain(k).unit && typeof v === "number" ? esc(S().domain(k).unit) : ""}</button>`).join("")}</div>` : ""}
    </div>`;
  }
  /* The small star on every card: a real button, so it works from the keyboard. */
  function starHtml(level, it) {
    const ref = cardRef(level, it);
    if (!ref) return "";
    const on = faves.faves.includes(ref);
    return `<button type="button" class="sc-star${on ? " on" : ""}" data-fave="${esc(ref)}" aria-pressed="${on}" aria-label="Favorite: ${esc(it.label)}" title="${on ? "In Favorites: click to take it out" : "Add to Favorites"}">${on ? "★" : "☆"}</button>`;
  }
  const cardList = (items) => items.map((x) => cardHtml(x.level, x.it)).join("");
  function drawLibrary() {
    if (!page || !L()) return;
    const box = page.querySelector(".sc-lib");
    box.hidden = prefs.view === "arrange";
    if (box.hidden) return;
    const cat = category();
    const tab = ["faves", "mine", "templates", "advanced"].includes(prefs.libTab) ? prefs.libTab : "";
    const extra = [["faves", "★ Favorites", "star", "Everything you starred, and the last 12 things you picked or put in your film"], ["mine", "My film", "film", "Everything automated in my film so far (like Maya's Outliner, or CapCut's Yours)"], ["templates", "Templates", "grid", "Ready-made recipes: every suite, dropped at the playhead as a set of nodes (CapCut's Templates)"]];
    page.querySelector(".sc-icons").innerHTML =
      extra.map(([id, label, ic, t]) => `<button type="button" data-libtab="${id}" class="${tab === id ? "on" : ""}" aria-pressed="${tab === id}" title="${esc(t)}">${icon(ic)}<span>${esc(label)}</span></button>`).join("") +
      L()
        .CATEGORIES.map((c) => `<button type="button" data-icat="${c.id}" class="${!tab && c.id === cat.id ? "on" : ""}" aria-pressed="${!tab && c.id === cat.id}" title="${esc(c.plain)}">${icon(c.icon)}<span>${esc(c.label)}</span></button>`)
        .join("") +
      `<button type="button" data-libtab="advanced" class="sc-adv${tab === "advanced" ? " on" : ""}" aria-pressed="${tab === "advanced"}" title="${esc(ADV.plain)}">${icon(ADV.icon)}<span>${ADV.label}</span></button>`;
    const groups = tab === "faves" ? faveGroups() : tab === "mine" ? mineGroups() : tab === "templates" ? templateGroups() : tab === "advanced" ? advancedGroups() : groupsOf(cat);
    const gkey = tab || cat.id;
    const gid = groups.some((g) => g.id === prefs.groups[gkey]) ? prefs.groups[gkey] : (groups[0] || {}).id;
    page.querySelector(".sc-side").innerHTML = groups.map((g) => `<button type="button" class="sc-pill${g.id === gid && !prefs.search ? " on" : ""}" data-group="${esc(g.id)}"><span>${esc(g.label)}</span><small>${g.items.length}</small></button>`).join("");
    let cards;
    let head;
    const q = String(prefs.search || "").trim().toLowerCase();
    let faveHtml = "";
    if (q) {
      const hits = L()
        .items("curiosity")
        .filter((c) => (c.label + " " + (c.plain || "")).toLowerCase().includes(q))
        .slice(0, 60);
      head = `${hits.length} curiosit${hits.length === 1 ? "y" : "ies"} match`;
      cards = hits.map((c) => cardHtml("curiosity", c)).join("");
      /* Search covers Favorites and Recently used too, suites and proximities included. In the Favorites tab
         they are all it shows; elsewhere they come after the matching curiosities. */
      const seen = new Set();
      const fh = faveItems(faves.faves.concat(faves.recent)).filter((x) => {
        const r = faveRef(x.level, x.it.id);
        if (seen.has(r)) return false;
        seen.add(r);
        return (x.it.label + " " + (x.it.plain || "")).toLowerCase().includes(q);
      });
      if (tab === "faves") {
        head = `${fh.length} favorite${fh.length === 1 ? "" : "s"} match`;
        cards = cardList(fh);
      } else if (fh.length) faveHtml = `<p class="sc-grid-h sc-fave-h">In Favorites and Recently used</p><div class="sc-cards">${cardList(fh)}</div>`;
    } else if (tab === "faves") {
      /* Both sections at once: Recently used on top, then everything starred. */
      faveHtml = groups.map((g) => `<p class="sc-grid-h sc-fave-h" id="sc-${g.id.replace(":", "-")}">${esc(g.label)}</p>${g.items.length ? `<div class="sc-cards">${cardList(g.items)}</div>` : `<p class="sc-k sc-fave-empty">${esc(g.empty)}</p>`}`).join("");
    } else {
      const g = groups.find((x) => x.id === gid);
      head = g ? g.label : "Nothing here yet";
      cards = g ? g.items.map((it) => cardHtml(g.level, it)).join("") : "";
    }
    const grid = page.querySelector(".sc-grid");
    const had = grid.querySelector("[data-lib-search]");
    const focused = had && document.activeElement === had;
    /* The Text tab starts with a way to put words on the frame (the same as T Text in the Player). */
    const txtLib = !tab && !q && cat.id === "text" ? `<div class="sc-txt-libadd"><button type="button" data-txt-add title="Put words on your film's picture at the playhead: a title, a name and job, a sign, a sound effect or a thought">T Words on the frame</button><small>Drawn on your film's picture at the playhead. Click them there to change them.</small></div>` : "";
    /* + New curiosity (or suite, or proximity), Export mine and Import… over a category's cards (screen/mine.js). */
    const myBar = !tab && !q ? myBarHtml((groups.find((x) => x.id === gid) || {}).level, groups) : "";
    const body = (tab === "templates" && !q ? myTplHtml() : "") + (tab === "faves" && !q ? faveHtml : `${txtLib}${myBar}<p class="sc-grid-h">${esc(head)}</p><div class="sc-cards">${cards || `<p class="sc-k">No matches.</p>`}</div>${faveHtml}`);
    grid.innerHTML = `<input type="search" data-lib-search placeholder="Search every curiosity" aria-label="Search every curiosity" value="${esc(prefs.search || "")}">${body}`;
    tplWire();
    myWire();
    iconsFit();
    if (focused) {
      const inp = grid.querySelector("[data-lib-search]");
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  }
  /* ---------- The library's category tabs (look check, decision 113) ----------
     Seventeen tabs don't fit a laptop's library (at 1280 wide they stopped at "Perform…"). Like CapCut's tab
     strip, the row scrolls sideways with a ‹ and › at its ends while there's more that way (greyed at an end,
     gone when everything fits); a mouse wheel scrolls it too, and a tab picked or reached with Tab is scrolled
     clear of the ADVANCED tab that stays pinned at the right end. */
  let iconsOn = null;
  let iconsWired = false;
  function iconsShow(b, nav) {
    if (!b || !nav) return;
    const n = nav.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    const adv = nav.querySelector(".sc-adv");
    const right = adv && adv !== b ? adv.getBoundingClientRect().left : n.right;
    if (r.left < n.left) nav.scrollLeft -= n.left - r.left + 4;
    else if (r.right > right) nav.scrollLeft += r.right - right + 4;
  }
  function iconsArrows() {
    const nav = page && page.querySelector(".sc-icons");
    if (!nav) return;
    const over = nav.scrollWidth > nav.clientWidth + 1;
    const [l, r] = page.querySelectorAll(".sc-icons-arr");
    l.hidden = r.hidden = !over;
    l.disabled = nav.scrollLeft <= 1;
    r.disabled = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 1;
  }
  function iconsFit() {
    const nav = page && page.querySelector(".sc-icons");
    if (!nav) return;
    if (!iconsWired) {
      iconsWired = true;
      nav.addEventListener("scroll", iconsArrows, { passive: true });
      nav.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || nav.scrollWidth <= nav.clientWidth + 1) return;
        nav.scrollLeft += e.deltaY;
        e.preventDefault();
      }, { passive: false });
      nav.addEventListener("focusin", (e) => iconsShow(e.target.closest && e.target.closest("button"), nav));
      page.addEventListener("click", (e) => {
        const a = e.target.closest && e.target.closest("[data-icons-scroll]");
        if (!a) return;
        /* A stretch is what shows left of the pinned ADVANCED tab, less a tab's width, so no tab is skipped. */
        const adv = nav.querySelector(".sc-adv");
        const room = (adv ? adv.getBoundingClientRect().left : nav.getBoundingClientRect().right) - nav.getBoundingClientRect().left;
        const widest = Math.max(48, ...[...nav.querySelectorAll("button:not(.sc-adv)")].map((b) => b.getBoundingClientRect().width));
        const by = Math.max(48, room - widest - 6) * Number(a.dataset.iconsScroll);
        nav.scrollBy({ left: by, behavior: "smooth" });
      });
      window.addEventListener("resize", () => !page.hidden && iconsArrows());
      if (window.ResizeObserver) new ResizeObserver(() => !page.hidden && iconsArrows()).observe(nav);
    }
    iconsArrows();
    const on = nav.querySelector("button.on");
    const id = on && (on.dataset.icat || on.dataset.libtab);
    if (on && id !== iconsOn) iconsShow(on, nav);
    iconsOn = id;
    iconsArrows();
  }
  /* Picking a card looks through it (Details and the timeline follow; a new prefs.sel opens its lane's group).
     Quick find (⌘K) picks through here too. */
  function pickCard(level, id) {
    prefs.sel = { level, id };
    faveUse(level, id);
    save();
    return drawAll();
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

  /* ---------- My own curiosities, suites and proximities (screen/mine.js) ----------
     Jeremy: "The user should be able to define and create their own curiosities as well as curiosity suites and
     proximities." The library's category tabs start with + New curiosity (+ New suite in Suites, + New proximity
     in Proximities, and either of those beside it when the category has none yet), Export mine and Import….
     Each opens a small form in a window over the Screen. What you make shows in the library like any card, with
     a small "mine" mark and a ✎ to change, share or delete it (Delete asks first); its + puts it in the film,
     its lane plays in the engine, Details edits it and Quick find finds it. Making or changing one is one undo
     step (CurioMine's part of the app-wide store). */
  const MY = () => window.CurioMine || null;
  const isMineIt = (id) => !!(MY() && MY().isMine(id));
  const MY_WORD = { curiosity: "curiosity", suite: "suite", proximity: "proximity" };
  const MY_NEW = { curiosity: "+ New curiosity", suite: "+ New suite", proximity: "+ New proximity" };
  const MY_TIP = {
    curiosity: "Make your own curiosity: one thing about a scene you can look at and change, with a scale from one end to the other",
    suite: "Make your own suite: a few curiosities you look at together",
    proximity: "Make your own proximity: when one curiosity changes, another one follows soon after",
  };
  const MY_CUES = [["visual", "the eye"], ["audio", "the ear"], ["thought", "the mind"], ["movement", "movement"], ["plot", "the plot"]];
  let myDlg = null; /* { el, level, it, picked } while the form is open */
  let myWired = false;
  function myWire() {
    if (myWired || !page) return;
    myWired = true;
    page.addEventListener("click", myClick);
    page.addEventListener("change", (e) => {
      const t = e.target;
      if (!t.matches || !t.matches("[data-my-file]") || !t.files || !t.files[0]) return;
      const file = t.files[0];
      t.value = "";
      (file.text ? file.text() : Promise.reject(new Error("no text"))).then(myImport, () => toast("That file couldn't be read."));
    });
    window.addEventListener("curio-mine", () => {
      laneOptsMemo = null;
      if (page && !page.hidden) drawAll();
    });
  }
  /* The bar over a category's cards: the + New button for the group you are in, and the other kinds the
     category has no group for yet, then Export mine and Import…. */
  function myBarHtml(level, groups) {
    if (!MY()) return "";
    const lv = level === "suite" ? "suite" : level === "proximity" || level === "proximitySuite" ? "proximity" : "curiosity";
    const extra = ["curiosity", "suite", "proximity"].filter((l) => l !== lv && l !== "curiosity" && !groups.some((g) => g.level === l));
    const d = MY().data();
    const n = d.curiosities.length + d.suites.length + d.proximities.length;
    const btn = (l, on) => `<button type="button" class="sc-my-new${on ? " on" : ""}" data-my-new="${l}" title="${esc(MY_TIP[l])}">${MY_NEW[l]}</button>`;
    return `<div class="sc-mybar">${btn(lv, true)}${extra.map((l) => btn(l)).join("")}<span class="sc-mybar-r"><button type="button" data-my-act="export"${n ? "" : " disabled"} title="Save everything you made (${n}) as one .json file to share">Export mine</button><button type="button" data-my-act="import" title="Bring in curiosities, suites and proximities someone shared as a .json file">Import…</button><input type="file" accept=".json,application/json" data-my-file hidden></span></div>`;
  }
  /* Every curiosity the engine can play, by category, yours first in each: [{ key, label, cat, mine }]. */
  function myAllCurs() {
    const out = [];
    L().CATEGORIES.forEach((c) => {
      const list = mainOnly(L().curiosities(c.id)).filter((x) => L().categoryOf(x.id) === c.id);
      list
        .filter((x) => isMineIt(x.id))
        .concat(list.filter((x) => !isMineIt(x.id)))
        .forEach((x) => {
          const key = keyFor(x.id);
          if (S() && S().known(key)) out.push({ key, label: x.label, cat: c.label, mine: isMineIt(x.id) });
        });
    });
    return out;
  }
  function myCurSelect(name, sel, all) {
    const groups = [];
    all.forEach((x) => {
      let g = groups.find((y) => y.cat === x.cat);
      if (!g) groups.push((g = { cat: x.cat, items: [] }));
      g.items.push(x);
    });
    return `<select name="${name}" data-my-cur><option value="">Pick a curiosity…</option>${groups.map((g) => `<optgroup label="${esc(g.cat)}">${g.items.map((x) => `<option value="${esc(x.key)}"${x.key === sel ? " selected" : ""}>${esc(x.label)}${x.mine ? " (mine)" : ""}</option>`).join("")}</optgroup>`).join("")}</select>`;
  }
  /* A setting of a curiosity: a list of its steps, or a number box for a range. */
  function myValueCtl(name, key, val, any) {
    const d = key && S() && S().known(key) ? S().domain(key) : null;
    if (!d) return `<select name="${name}" disabled><option value="">pick a curiosity first</option></select>`;
    if (d.kind === "range") return `<input type="number" name="${name}" min="${d.min}" max="${d.max}" step="${d.step || "any"}" value="${val == null ? "" : esc(val)}" placeholder="${any ? "any" : d.min + " to " + d.max}" aria-label="Setting">`;
    return `<select name="${name}" aria-label="Setting">${any ? `<option value="">any setting</option>` : ""}${d.options.map((o) => `<option${String(o) === String(val) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  }
  const myCatSelect = (sel) => `<select name="cat">${L().CATEGORIES.map((c) => `<option value="${c.id}"${c.id === sel ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</select>`;
  /* An extra slider's scale in one box: "slow, steady, fast" (steps) or "0 to 10 km/h" (a range with a unit). */
  function myScaleText(sc) {
    return !sc ? "" : sc.kind === "steps" ? sc.steps.join(", ") : `${sc.min} to ${sc.max}${sc.unit ? " " + sc.unit : ""}`;
  }
  function myParseScale(text) {
    const m = /^\s*(-?\d+(?:\.\d+)?)\s*(?:to|-|–|—|…|\.\.)\s*(-?\d+(?:\.\d+)?)\s*(.*)$/i.exec(String(text || ""));
    return m ? { kind: "range", min: Number(m[1]), max: Number(m[2]), unit: m[3].trim() } : { kind: "steps", steps: text };
  }
  const myExtraRow = (x) => `<div class="sc-myextra"${x && x.id ? ` data-x-id="${esc(x.id)}"` : ""}><input data-x="label" maxlength="40" placeholder="Name, e.g. Speed" value="${esc(x ? x.label : "")}" aria-label="Slider name"><input data-x="scale" placeholder="slow, steady, fast  or  0 to 10 km/h" value="${esc(x ? myScaleText(x.scale) : "")}" aria-label="Its steps, or a number range"><button type="button" data-my-extra-del aria-label="Take this slider out" title="Take this slider out">×</button></div>`;
  function myFormHtml(level, it) {
    const cat = it ? it.cat : prefs.libTab ? "story" : category().id;
    const head = `<h2>${it ? `Change ${esc(MY_WORD[level])}: ${esc(it.label)}` : MY_NEW[level].replace("+ ", "")}</h2>`;
    const foot = `<p class="sc-my-err" role="alert"></p>
      <div class="sc-my-sure" hidden><p></p><div class="sc-mybtns"><button type="button" data-my-do="keep">Keep it</button><button type="button" data-my-do="delete" class="sl-warn">Delete for good</button></div></div>
      <div class="sc-mybtns">${it ? `<button type="button" data-my-do="ask-delete" title="Delete this ${MY_WORD[level]} (asks first)">Delete…</button><button type="button" data-my-do="export" title="Save it as a .json file to share">Export this</button>` : ""}<span class="sc-mybtns-r"><button type="button" data-my-do="cancel">Cancel</button><button type="button" data-my-do="save" class="on">${it ? "Save changes" : level === "curiosity" ? "Make it" : "Make it"}</button></span></div>`;
    if (level === "curiosity") {
      const sc = it ? it.scale : { kind: "steps", steps: [] };
      const isRange = sc.kind === "range";
      return `<form class="sc-myform" data-my-form="curiosity" novalidate>${head}
        <p class="sc-k">A curiosity is one thing about a scene you can look at and change, with a scale from one end to the other, like how tense the room is: calm, tense, frantic.</p>
        <label>Name <input name="label" maxlength="60" placeholder="e.g. Tension in the room" value="${esc(it ? it.label : "")}"></label>
        <label>What it is <textarea name="plain" rows="2" maxlength="400" placeholder="e.g. How wound up everyone in the scene is.">${esc(it ? it.plain : "")}</textarea></label>
        <label>How it moves the story forward and the audience's attention <textarea name="story" rows="2" maxlength="400" placeholder="e.g. Rising tension makes the audience lean in and wait for something to break.">${esc(it ? it.story : "")}</textarea></label>
        <label>What to try <input name="tryThis" maxlength="240" placeholder="e.g. Let it climb for three moments, then drop it to calm at once." value="${esc(it ? it.tryThis : "")}"></label>
        <div class="sc-myrow"><label>Category ${myCatSelect(cat)}</label>
          <label>What it catches first <select name="cue">${MY_CUES.map(([v, l]) => `<option value="${v}"${(it ? it.cue : "visual") === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
          <label>How hard it pushes the story <select name="push">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}"${(it ? it.push : 2) === n ? " selected" : ""}>${n} of 5</option>`).join("")}</select></label></div>
        <fieldset><legend>Its scale</legend>
          <div class="sc-myrow"><label class="sc-myradio"><input type="radio" name="kind" value="steps"${isRange ? "" : " checked"}> Named steps</label><label class="sc-myradio"><input type="radio" name="kind" value="range"${isRange ? " checked" : ""}> A number range</label></div>
          <div data-my-steps${isRange ? " hidden" : ""}><label>Steps, in order <input name="steps" placeholder="calm, tense, frantic" value="${esc(!isRange ? sc.steps.join(", ") : "")}"></label><small class="sc-k">From one end to the other, with commas or → between them.</small></div>
          <div data-my-range class="sc-myrow"${isRange ? "" : " hidden"}><label>From <input type="number" step="any" name="min" value="${isRange ? esc(sc.min) : ""}" placeholder="0"></label><label>to <input type="number" step="any" name="max" value="${isRange ? esc(sc.max) : ""}" placeholder="100"></label><label>Unit <input name="unit" maxlength="16" placeholder="bpm, %, people" value="${isRange ? esc(sc.unit) : ""}"></label></div>
        </fieldset>
        <fieldset><legend>Extra sliders (if you like)</legend><small class="sc-k">Finer parts of it, each its own lane on the timeline.</small><div data-my-extras>${(it ? it.extras : []).map(myExtraRow).join("")}</div><button type="button" data-my-do="extra-add">+ Add a slider</button></fieldset>
        ${foot}</form>`;
    }
    if (level === "suite") {
      return `<form class="sc-myform" data-my-form="suite" novalidate>${head}
        <p class="sc-k">A suite is a few curiosities you look at together, each at a setting if you like (a handheld chase: handheld camera, fast cutting, close shots).</p>
        <label>Name <input name="label" maxlength="60" placeholder="e.g. The calm before the storm" value="${esc(it ? it.label : "")}"></label>
        <label>What it is <textarea name="plain" rows="2" maxlength="400" placeholder="e.g. Everything goes quiet and still just before the big moment.">${esc(it ? it.plain : "")}</textarea></label>
        <div class="sc-myrow"><label>Category ${myCatSelect(cat)}</label></div>
        <fieldset><legend>Its curiosities <small data-my-count></small></legend>
          <div data-my-picked class="sc-mypicked"></div>
          <input type="search" data-my-filter placeholder="Find curiosities to add, e.g. camera, music, mine" aria-label="Find curiosities to add">
          <div data-my-pick class="sc-mypick" role="group" aria-label="Curiosities to add"></div>
        </fieldset>
        ${foot}</form>`;
    }
    const all = myAllCurs();
    const w = it ? it.when : { curiosity: "", change: "rises" };
    const t = it ? it.then : { curiosity: "", change: "changes" };
    const chg = (name, cur, then) => `<select name="${name}" data-my-chg>${[["rises", "goes up"], ["drops", "goes down"], ["changes", then ? "changes too" : "changes"], ["is", "becomes…"]].map(([v, l]) => `<option value="${v}"${cur === v ? " selected" : ""}>${l}</option>`).join("")}</select>`;
    return `<form class="sc-myform" data-my-form="proximity" novalidate>${head}
      <p class="sc-k">A proximity is when one curiosity leads to another soon after: when the music swells, the camera pushes in within a moment or two.</p>
      <div class="sc-mysent"><span>When</span>${myCurSelect("whenCur", w.curiosity, all)}${chg("whenChange", w.change)}<span data-my-val="when">${w.change === "is" ? myValueCtl("whenIs", w.curiosity, w.is) : ""}</span>
        <span>then</span>${myCurSelect("thenCur", t.curiosity, all)}${chg("thenChange", t.change, true)}<span data-my-val="then">${t.change === "is" ? myValueCtl("thenIs", t.curiosity, t.is) : ""}</span>
        <span>within</span><input type="number" name="within" min="0" max="16" step="1" value="${it ? it.within : 2}" aria-label="Moments"><span>moments.</span></div>
      <p class="sc-mypreview" data-my-preview aria-live="polite"></p>
      <label>Name (if you like; the sentence above is used otherwise) <input name="label" maxlength="120" value="${esc(it ? it.label : "")}"></label>
      <label>What it is <textarea name="plain" rows="2" maxlength="400" placeholder="e.g. Why this tends to happen, or where you saw it.">${esc(it ? it.plain : "")}</textarea></label>
      <div class="sc-myrow"><label>Category ${myCatSelect(cat)}</label></div>
      ${foot}</form>`;
  }
  const myVal = (f, n) => {
    const x = f.querySelector(`[name="${n}"]`);
    return x ? x.value : "";
  };
  function myRead() {
    const d = myDlg;
    const f = d.el.querySelector("form");
    const id = d.it ? d.it.id : null;
    const M = MY();
    if (d.level === "curiosity") {
      const label = myVal(f, "label").trim();
      if (!label) return { error: "Give it a name.", focus: "label" };
      const kind = (f.querySelector('[name="kind"]:checked') || {}).value || "steps";
      const scale = kind === "range" ? { kind: "range", min: myVal(f, "min"), max: myVal(f, "max"), unit: myVal(f, "unit") } : { kind: "steps", steps: myVal(f, "steps") };
      if (!M.cleanScale(scale)) return kind === "range" ? { error: "Give a number to start from and a bigger one to end at, like 0 and 100.", focus: "min" } : { error: "Write at least two different steps, in order, like: calm, tense, frantic.", focus: "steps" };
      const extras = [];
      for (const r of f.querySelectorAll(".sc-myextra")) {
        const xl = r.querySelector('[data-x="label"]').value.trim();
        const xs = r.querySelector('[data-x="scale"]').value.trim();
        if (!xl && !xs) continue;
        if (!xl) return { error: "Give each extra slider a name." };
        const sc = myParseScale(xs);
        if (!M.cleanScale(sc)) return { error: `The slider "${xl}" needs at least two steps (slow, fast) or a number range (0 to 10 km/h).` };
        extras.push({ id: r.dataset.xId || undefined, label: xl, scale: sc });
      }
      const item = { id: id || M.newId(label, M.data()), label, plain: myVal(f, "plain"), story: myVal(f, "story"), tryThis: myVal(f, "tryThis"), cat: myVal(f, "cat"), cue: myVal(f, "cue"), push: Number(myVal(f, "push")), scale, extras };
      const c = M.clean({ curiosities: [item] }).curiosities[0];
      return c ? { item: c } : { error: "Something in it couldn't be kept; check the name and the scale." };
    }
    if (d.level === "suite") {
      const label = myVal(f, "label").trim();
      if (!label) return { error: "Give the suite a name.", focus: "label" };
      myKeepPicked();
      if (d.picked.length < 2) return { error: "Pick at least two curiosities for the suite (a suite is a group)." };
      const members = d.picked.map((m) => (m.value == null || m.value === "" ? { curiosity: m.curiosity } : { curiosity: m.curiosity, value: S().fix(m.curiosity, m.value) })).map((m) => (m.value == null ? { curiosity: m.curiosity } : m));
      const s = M.clean({ suites: [{ id: id || M.newId(label, M.data()), label, plain: myVal(f, "plain"), cat: myVal(f, "cat"), members }] }).suites[0];
      return s ? { item: s } : { error: "Something in it couldn't be kept." };
    }
    const end = (p) => {
      const cur = myVal(f, p + "Cur");
      const change = myVal(f, p + "Change");
      const o = { curiosity: cur, change };
      if (change === "is") o.is = S().fix(cur, myVal(f, p + "Is"));
      return o;
    };
    const when = end("when");
    const then = end("then");
    if (!when.curiosity || !then.curiosity) return { error: "Pick a curiosity for both halves: the one that changes first, and the one that follows." };
    if ((when.change === "is" && when.is == null) || (then.change === "is" && then.is == null)) return { error: "Pick the setting it becomes." };
    if (when.curiosity === then.curiosity && !(when.change === "is" && then.change === "is" && String(when.is) !== String(then.is))) return { error: "Pick two different curiosities, or the same one becoming two different settings (a setup and its payoff)." };
    const within = Math.max(0, Math.min(16, Math.round(Number(myVal(f, "within")) || 0)));
    const p = { id: "my-x", when, then, within, cat: myVal(f, "cat") };
    const label = myVal(f, "label").trim() || M.sentence(p, labelOf).replace(/\.$/, "");
    const item = M.clean({ proximities: [Object.assign(p, { id: id || M.newId(label.replace(/^When /, ""), M.data()), label, plain: myVal(f, "plain") })] }).proximities[0];
    return item ? { item } : { error: "Something in it couldn't be kept." };
  }
  function myErr(m, focus) {
    if (!myDlg) return;
    const p = myDlg.el.querySelector(".sc-my-err");
    p.textContent = m || "";
    const f = focus && myDlg.el.querySelector(`[name="${focus}"]`);
    if (f) f.focus();
  }
  /* Suites: the picked members (with a setting each) and a list to pick from, found by a few typed words. */
  function myKeepPicked() {
    const d = myDlg;
    if (!d || d.level !== "suite") return;
    d.el.querySelectorAll("[data-my-member]").forEach((row) => {
      const m = d.picked.find((x) => x.curiosity === row.dataset.myMember);
      const v = row.querySelector('[name="memberValue"]');
      if (m && v) m.value = v.value === "" ? null : v.value;
    });
  }
  function myDrawPick() {
    const d = myDlg;
    if (!d || d.level !== "suite") return;
    myKeepPicked();
    const all = d.all || (d.all = myAllCurs());
    const name = (k) => (all.find((x) => x.key === k) || {}).label || labelOf(k);
    d.el.querySelector("[data-my-count]").textContent = `(${d.picked.length} picked)`;
    d.el.querySelector("[data-my-picked]").innerHTML = d.picked.length
      ? d.picked.map((m) => `<div class="sc-mymember" data-my-member="${esc(m.curiosity)}"><span>${esc(name(m.curiosity))}</span>${myValueCtl("memberValue", m.curiosity, m.value, true)}<button type="button" data-my-unpick="${esc(m.curiosity)}" aria-label="Take ${esc(name(m.curiosity))} out of the suite" title="Take it out">×</button></div>`).join("")
      : `<p class="sc-k">Nothing picked yet. Tick curiosities below.</p>`;
    const q = String(d.el.querySelector("[data-my-filter]").value || "").trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const hits = all.filter((x) => !d.picked.some((m) => m.curiosity === x.key) && words.every((w) => (x.label + " " + x.cat + (x.mine ? " mine" : "")).toLowerCase().includes(w)));
    const shown = hits.slice(0, 40);
    d.el.querySelector("[data-my-pick]").innerHTML =
      shown.map((x) => `<label class="sc-mypick-row"><input type="checkbox" data-my-pickcur="${esc(x.key)}"> ${esc(x.label)} <small>${esc(x.cat)}${x.mine ? " · mine" : ""}</small></label>`).join("") + (hits.length > shown.length ? `<p class="sc-k">and ${hits.length - shown.length} more: type a few words to narrow it down.</p>` : hits.length ? "" : `<p class="sc-k">No curiosity matches.</p>`);
  }
  function myPreview() {
    const d = myDlg;
    if (!d || d.level !== "proximity") return;
    const f = d.el.querySelector("form");
    ["when", "then"].forEach((p) => {
      const box = f.querySelector(`[data-my-val="${p}"]`);
      const want = myVal(f, p + "Change") === "is" ? myVal(f, p + "Cur") : "";
      if (box.dataset.for !== want) {
        box.dataset.for = want;
        box.innerHTML = want ? myValueCtl(p + "Is", want, null) : "";
      }
    });
    const r = myRead();
    f.querySelector("[data-my-preview]").textContent = r.item ? MY().sentence(r.item, labelOf) : "";
  }
  function myOpen(level, id) {
    if (!MY() || !page || !L() || !MY_WORD[level]) return null;
    myClose();
    const it = id ? MY().get(level, id) : null;
    if (id && !it) return toast("That one is gone."), null;
    const el = document.createElement("dialog");
    el.className = "sc-mydlg";
    el.setAttribute("aria-label", it ? `Change ${MY_WORD[level]}: ${it.label}` : MY_NEW[level].replace("+ ", ""));
    myDlg = { el, level, it, picked: level === "suite" && it ? it.members.map((m) => ({ curiosity: m.curiosity, value: m.value == null ? null : m.value })) : [], back: document.activeElement };
    el.innerHTML = myFormHtml(level, it);
    page.appendChild(el);
    el.addEventListener("click", myDlgClick);
    el.addEventListener("input", myDlgInput);
    el.addEventListener("change", myDlgInput);
    el.addEventListener("submit", (e) => e.preventDefault());
    el.addEventListener("cancel", (e) => (e.preventDefault(), myClose()));
    /* Keys typed in the form stay in it (inToolWindow knows dialogs too): Enter in a box saves, Esc closes. */
    el.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Escape") return e.preventDefault(), myClose();
      if (e.key === "Enter" && e.target.matches && e.target.matches("input:not([type=checkbox]):not([type=radio]):not([type=search])")) return e.preventDefault(), mySave();
    });
    try {
      el.showModal();
    } catch (e) {
      el.setAttribute("open", "");
    }
    if (level === "suite") myDrawPick();
    if (level === "proximity") myPreview();
    const first = el.querySelector(level === "proximity" ? '[name="whenCur"]' : '[name="label"]');
    if (first) first.focus();
    return el;
  }
  function myClose() {
    if (!myDlg) return;
    const d = myDlg;
    myDlg = null;
    try {
      d.el.close();
    } catch (e) {}
    d.el.remove();
    if (d.back && d.back.isConnected && d.back.focus) d.back.focus();
  }
  /* After a curiosity's scale changed, its nodes in the film move to the same place on the new scale (the engine
     reads its film again with the new scale; CurioMine remembers the old one for the rest of the session). */
  function myRefit(before, after) {
    const Eng = E();
    if (!Eng || !Eng.load) return;
    const sc = (c) => JSON.stringify([c.scale].concat(c.extras.map((x) => [x.id, x.scale])));
    if (sc(before) === sc(after)) return;
    const st = Eng.state();
    if (!Object.keys(st.lanes).some((lk) => L().base(lk.split("|")[1]) === after.id)) return;
    Eng.load({ keepHistory: true });
    if (Eng.save) Eng.save();
  }
  function mySave() {
    const d = myDlg;
    if (!d) return { ok: false };
    const r = myRead();
    if (r.error) return myErr(r.error, r.focus), { ok: false, error: r.error };
    const item = r.item;
    const word = MY_WORD[d.level];
    const res = MY().store().send({ type: "put", level: d.level, item, label: `${d.it ? "Change" : "Make"} the ${word} ${item.label}`.slice(0, 80) });
    if (!res.ok) return myErr(res.error || "That couldn't be kept."), res;
    if (d.it && d.level === "curiosity") myRefit(d.it, item);
    myClose();
    /* Show it: its category's tab, its group, picked. */
    const row = L().get(d.level, item.id);
    prefs.libTab = "";
    prefs.search = "";
    prefs.cat = item.cat;
    prefs.groups[item.cat] = d.level === "curiosity" ? "ws:" + ((row && row.workspace) || "") : d.level;
    prefs.sel = { level: d.level, id: item.id };
    save();
    drawAll();
    const undo = MY().store().undo === false ? "" : " ⌘Z takes it back.";
    const next = d.level === "proximity" ? "Its + adds it to your film." : d.level === "suite" ? "Its + puts its curiosities on the timeline." : "Its + puts it on the timeline.";
    toast(res.unchanged ? `Nothing changed in ${item.label}.` : `${d.it ? "Changed" : "Made"} your ${word} ${item.label}. ${next}${undo}`);
    return { ok: true, id: item.id };
  }
  /* What deleting takes with it, in plain words. */
  function myDeleteWords() {
    const d = myDlg;
    const id = d.it.id;
    const parts = [];
    let lanesIn = 0;
    if (d.level === "curiosity") {
      const st = E() && E().state();
      lanesIn = st ? st.tracks.reduce((a, t) => a + t.curiosities.filter((c) => L().base(c) === id).length, 0) : 0;
      if (lanesIn) parts.push(`It is in your film on ${lanesIn} lane${lanesIn === 1 ? "" : "s"}; ${lanesIn === 1 ? "that lane comes" : "those lanes come"} out too.`);
      const data = MY().data();
      const users = data.suites.filter((s) => s.members.some((m) => L().base(m.curiosity) === id)).map((s) => s.label).concat(data.proximities.filter((p) => [p.when, p.then].some((e) => L().base(e.curiosity) === id)).map((p) => p.label));
      const q = users.slice(0, 3).map((u) => `"${u}"`);
      if (users.length) parts.push(`Your ${users.length === 1 ? "suite or proximity" : "suites and proximities"} ${q.join(", ")}${users.length > 3 ? " and " + (users.length - 3) + " more" : ""} will skip it.`);
    }
    return `Delete ${d.it.label}? ${parts.join(" ")}${MY().store().undo === false ? " This can't be undone." : lanesIn ? " ⌘Z twice brings both back." : " ⌘Z brings it back."}`;
  }
  function myDelete() {
    const d = myDlg;
    if (!d || !d.it) return { ok: false };
    const id = d.it.id;
    const name = d.it.label;
    let out = 0;
    if (d.level === "curiosity" && E()) {
      const cmds = [];
      E()
        .state()
        .tracks.forEach((t) => t.curiosities.forEach((c) => L().base(c) === id && cmds.push({ type: "removeCuriosity", track: t.id, curiosity: c })));
      if (cmds.length) {
        const r = E().send({ type: "batch", label: `Take ${name} out of my film`, commands: cmds });
        if (r.ok) out = cmds.length;
      }
      prefs.lanes = prefs.lanes.filter((c) => L().base(c) !== id);
    }
    const res = MY().store().send({ type: "remove", level: d.level, id, label: `Delete the ${MY_WORD[d.level]} ${name}`.slice(0, 80) });
    if (!res.ok) return myErr(res.error || "That couldn't be deleted."), res;
    if (prefs.sel.id === id) prefs.sel = JSON.parse(JSON.stringify(DEFAULTS.sel));
    myClose();
    save();
    drawAll();
    toast(`Deleted your ${MY_WORD[d.level]} ${name}${out ? ` and took its ${out} lane${out === 1 ? "" : "s"} out of your film` : ""}.${MY().store().undo === false ? "" : out ? " ⌘Z twice brings both back." : " ⌘Z brings it back."}`);
    return { ok: true };
  }
  function myDownload(ids, name) {
    downloadBlob(name, new Blob([MY().exportJson(null, ids)], { type: "application/json" }));
  }
  function myImport(text) {
    const r = MY().importJson(text);
    if (r.error) return toast(r.error), { ok: false, error: r.error };
    if (!r.added) {
      toast(`Nothing new in that file${r.skipped ? ": you already have " + (r.skipped === 1 ? "it" : "all " + r.skipped) : ""}.`);
      return Object.assign({ ok: true }, r);
    }
    const res = MY().store().send({ type: "add", items: r.items, label: `Import ${r.added} of my own curiosities` });
    if (!res.ok) return toast(res.error || "That file couldn't be brought in."), res;
    const n = (k, one, many) => (r.items[k].length ? `${r.items[k].length} ${r.items[k].length === 1 ? one : many}` : "");
    const what = [n("curiosities", "curiosity", "curiosities"), n("suites", "suite", "suites"), n("proximities", "proximity", "proximities")].filter(Boolean);
    const parts = [`Brought in ${what.length > 1 ? what.slice(0, -1).join(", ") + " and " + what[what.length - 1] : what[0]}.`];
    if (r.renamed) parts.push(`${r.renamed} had a name you already use, so ${r.renamed === 1 ? "it got" : "they got"} a new one.`);
    if (r.skipped) parts.push(`${r.skipped} you already had ${r.skipped === 1 ? "was" : "were"} skipped.`);
    if (r.dropped) parts.push(`${r.dropped} part${r.dropped === 1 ? "" : "s"} naming curiosities this app doesn't know ${r.dropped === 1 ? "was" : "were"} left out.`);
    toast(parts.join(" "));
    return Object.assign({ ok: true }, r);
  }
  function myClick(e) {
    const b = e.target.closest && e.target.closest("[data-my-new], [data-my-edit], [data-my-act]");
    if (!b || !page.contains(b) || (myDlg && myDlg.el.contains(b))) return;
    if (b.dataset.myNew) return myOpen(b.dataset.myNew);
    if (b.dataset.myEdit) {
      const [level, id] = b.dataset.myEdit.split("|");
      return myOpen(level, id);
    }
    if (b.dataset.myAct === "export") {
      const d = MY().data();
      const n = d.curiosities.length + d.suites.length + d.proximities.length;
      if (!n) return toast("You haven't made anything to share yet.");
      myDownload(null, "curiomatic-my-curiosities.json");
      return toast(`Saved everything you made (${n}) as one .json file. Anyone can bring it in with Import….`);
    }
    if (b.dataset.myAct === "import") {
      const f = page.querySelector("[data-my-file]");
      return f && f.click();
    }
  }
  function myDlgClick(e) {
    const d = myDlg;
    if (!d) return;
    if (e.target === d.el) return myClose(); /* a click on the dimmed backdrop */
    const b = e.target.closest && e.target.closest("button, [data-my-pickcur], input[name='kind']");
    if (!b) return;
    const f = d.el.querySelector("form");
    if (b.matches("[data-my-pickcur]")) {
      myKeepPicked();
      if (b.checked && !d.picked.some((m) => m.curiosity === b.dataset.myPickcur)) d.picked.push({ curiosity: b.dataset.myPickcur, value: null });
      return myDrawPick();
    }
    if (b.matches("input[name='kind']")) {
      f.querySelector("[data-my-steps]").hidden = b.value !== "steps";
      f.querySelector("[data-my-range]").hidden = b.value !== "range";
      return;
    }
    if (b.dataset.myUnpick) {
      myKeepPicked();
      d.picked = d.picked.filter((m) => m.curiosity !== b.dataset.myUnpick);
      return myDrawPick();
    }
    if ("myExtraDel" in b.dataset) return b.closest(".sc-myextra").remove();
    const act = b.dataset.myDo;
    if (act === "extra-add") {
      const box = f.querySelector("[data-my-extras]");
      if (box.children.length >= 8) return myErr("Eight extra sliders at most.");
      box.insertAdjacentHTML("beforeend", myExtraRow(null));
      return box.lastElementChild.querySelector("input").focus();
    }
    if (act === "cancel") return myClose();
    if (act === "save") return mySave();
    if (act === "export" && d.it) return myDownload([d.it.id], `curiomatic-mine-${MY().slug(d.it.label, "item")}.json`), toast(`Saved ${d.it.label} as a .json file to share.`);
    if (act === "ask-delete" && d.it) {
      const sure = f.querySelector(".sc-my-sure");
      sure.querySelector("p").textContent = myDeleteWords();
      sure.hidden = false;
      return sure.querySelector('[data-my-do="keep"]').focus();
    }
    if (act === "keep") {
      f.querySelector(".sc-my-sure").hidden = true;
      return f.querySelector('[data-my-do="ask-delete"]').focus();
    }
    if (act === "delete") return myDelete();
  }
  function myDlgInput(e) {
    const d = myDlg;
    if (!d) return;
    /* Only while typing: the search box's change event comes as it loses focus, often to a tick in the list, and
       redrawing the list then would take that tick away before its click lands. */
    if (e.target.matches("[data-my-filter]")) return e.type === "input" ? myDrawPick() : undefined;
    if (d.level === "proximity" && (e.type === "change" || e.target.name === "within")) myPreview();
    if (e.target.closest(".sc-my-err") === null && d.el.querySelector(".sc-my-err").textContent && e.type === "input") myErr("");
  }
  /* ⌘K: make a new one of each kind. */
  function myFindActions(add) {
    if (!MY()) return;
    ["curiosity", "suite", "proximity"].forEach((l) => add("my-new-" + l, MY_NEW[l].replace("+ ", ""), MY_TIP[l], "", () => myOpen(l)));
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
  /* ---------- Compare ◐ (CapCut's before/after compare slider) ----------
     Splits My film's frame: left of a line you can drag is another picture, right is My film at the playhead.
     The other picture is the film you're learning from at the matching moment (the picked inspiration viewer,
     else the first, its beats stretched over your film the way Blend and the film lines read it), or your film
     when you opened the Screen. The engine's history keeps only the names of its undo steps, not the film
     before them, so "before my last change" can't be shown; a copy taken when the Screen opens stands in.
     A view setting (prefs.compare: { on, split, with }), never an undo step. */
  const COMPARE_WITH = [
    ["insp", "The film I'm learning from"],
    ["open", "When I opened the Screen"],
  ];
  let openSnap = null;
  function takeOpenSnap() {
    if (!E()) return;
    const st = E().state();
    let res = null;
    try {
      res = E().rewrite(st);
    } catch (err) {}
    openSnap = res ? { st, res } : null;
  }
  function compareNow() {
    const c = prefs.compare && typeof prefs.compare === "object" ? prefs.compare : {};
    const split = Number(c.split);
    return { on: !!c.on, split: c.split != null && isFinite(split) ? Math.max(0, Math.min(100, split)) : 50, with: COMPARE_WITH.some((x) => x[0] === c.with) ? c.with : "insp" };
  }
  function setCompare(change) {
    prefs.compare = Object.assign(compareNow(), change);
    save();
  }
  /* My film's values at moment i as it was when the Screen opened (same moment by its id, else by its place). */
  function openValues(i) {
    if (!openSnap) takeOpenSnap();
    if (!openSnap) return null;
    const { st, res } = openSnap;
    const now = E().state().rows[i];
    const r = (now && st.rows.find((x) => x.id === now.id)) || st.rows[Math.min(i, st.rows.length - 1)];
    if (!r) return null;
    const values = {};
    st.tracks
      .slice()
      .sort((a, b) => rank(a) - rank(b))
      .forEach((t) => t.curiosities.forEach((c) => values[c] == null && (values[c] = res.dest[E().cellKey(r.id, t.id, c)])));
    Object.keys(values).forEach((k) => /\.setting$/.test(k) && values[L().base(k)] == null && (values[L().base(k)] = values[k]));
    return values;
  }
  /* The picture on the left: { values, label, title, cast } or { none: "why" }. */
  function compareSide(c, i) {
    if (c.with === "open") {
      const values = openValues(i);
      return values ? { values, label: "When I opened the Screen", title: "Your film at this moment when you opened the Screen", cast: castOf() } : { none: "Nothing kept from when you opened the Screen." };
    }
    const v = prefs.insp.find((x) => x.id === prefs.focus) || prefs.insp[0];
    const f = v && film(v.film);
    if (!f || !f.beats.length) return { none: "Add an inspiration film to compare with." };
    const b = beatFor(f);
    const values = f.beats[b].values || {};
    return { values, label: "Learning from: " + filmTitle(f), title: filmTitle(f) + ", beat " + (b + 1) + ", the moment that matches yours", cast: Number(values.peopleCount) || 2 };
  }
  function compareHtml(i, shape, sel) {
    const c = compareNow();
    if (!c.on || !F()) return "";
    const side = compareSide(c, i);
    if (side.none) return `<div class="sc-cmp" data-cmp="${c.with}"><span class="sc-cmp-lab l">${esc(side.none)}</span></div>`;
    let svg = F().svg(side.values, Object.assign(frameOpts(sel, side.values), { title: "", cast: side.cast }));
    svg = svg.replace("<svg ", `<svg preserveAspectRatio="xMidYMid ${shape === "wide" ? "meet" : "slice"}" `);
    const pct = Math.round(c.split);
    return `<div class="sc-cmp" data-cmp="${c.with}" style="--cmp:${pct}%"><div class="sc-cmp-pic" aria-hidden="true">${svg}</div><span class="sc-cmp-lab l" title="${esc(side.title)}">${esc(side.label)}</span><span class="sc-cmp-lab r">My film now</span><div class="sc-cmp-line" data-cmp-line tabindex="0" role="slider" aria-label="Where the split is: drag, or use the left and right arrow keys" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" title="Drag to move the split, or press ← →"></div></div>`;
  }
  function compareMenuHtml() {
    const c = compareNow();
    return `<span class="sc-cmp-set"><button type="button" data-act="compare" class="${c.on ? "on" : ""}" aria-pressed="${c.on}" title="Compare: split your film's picture with a line you can drag. Left of the line is another picture, right is your film now. It doesn't change your film."><span class="sc-lbl">Compare </span>◐</button></span>`;
  }
  /* What Compare shows left of the line: beside Compare ◐ when there's room, in ⋯ More when the bar is compact. */
  function compareWithHtml() {
    const c = compareNow();
    return `<label class="sc-cmpw"><span class="sc-cmpw-l">Compare with</span><select data-compare-with aria-label="Compare my film with" title="What to show left of the line">${COMPARE_WITH.map(([id, l]) => `<option value="${id}"${c.with === id ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
  }
  /* Move the split without redrawing, so the line keeps focus and the drag stays smooth. */
  function moveSplit(pct, keep) {
    const v = Math.round(Math.max(0, Math.min(100, pct)) * 10) / 10;
    prefs.compare = Object.assign(compareNow(), { split: v });
    const box = page && page.querySelector(".sc-cmp");
    if (box) {
      box.style.setProperty("--cmp", v + "%");
      const line = box.querySelector("[data-cmp-line]");
      if (line) line.setAttribute("aria-valuenow", String(Math.round(v)));
    }
    if (!keep) save();
  }
  function onCompareDrag(e) {
    const line = e.target.closest && e.target.closest("[data-cmp-line]");
    if (!line || e.button > 0) return false;
    const frame = line.closest(".sc-frame");
    const at = (ev) => {
      const r = frame.getBoundingClientRect();
      return r.width ? ((ev.clientX - r.left) / r.width) * 100 : compareNow().split;
    };
    line.focus();
    const move = (ev) => moveSplit(at(ev), true);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      save();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
    return true;
  }
  document.addEventListener("keydown", (e) => {
    const line = e.target && e.target.closest && e.target.closest("[data-cmp-line]");
    if (!line || !/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const step = e.shiftKey ? 10 : 2;
    const cur = compareNow().split;
    moveSplit(e.key === "Home" ? 0 : e.key === "End" ? 100 : cur + (e.key === "ArrowRight" ? step : -step));
  }, true);
  /* ---------- Captions (CapCut's captions, made from your markers) ----------
     A subtitle at the bottom of My film's frame for the moment at the playhead: the marker's note if the
     moment has one (an auto marker from Mark the turns says "(auto)" faintly), otherwise, if you ask for it,
     a dimmer "What's happening" line of the moment's biggest changes since the moment before, written by the
     Export sheet's own "what changed" helper. A view setting (prefs.captions: { on, mode }), never an undo step. */
  const CAPTION_MODES = [
    ["notes", "My notes only"],
    ["changes", "My notes and what changes"],
  ];
  function captionsNow() {
    const c = prefs.captions && typeof prefs.captions === "object" ? prefs.captions : {};
    return { on: !!c.on, mode: CAPTION_MODES.some((x) => x[0] === c.mode) ? c.mode : "notes" };
  }
  function setCaptions(change) {
    prefs.captions = Object.assign(captionsNow(), change);
    save();
  }
  /* The caption as plain data: { kind: "note" | "auto" | "hint" | "", text, color }. Pure, so tests can call it.
     o: { marker, prev, cur, mode, keys, label(k), text(k, v), size(k, a, b) }; size says how big a change is
     (0 to 1) so the biggest come first; without it the keys keep their order. */
  function captionFor(o) {
    const m = o && o.marker;
    const note = m && typeof m.note === "string" ? m.note.trim() : "";
    if (note) return { kind: m.auto ? "auto" : "note", text: note, color: m.color || "" };
    if (!o || o.mode !== "changes" || !o.prev || !o.cur) return { kind: "", text: "", color: "" };
    const prev = o.prev;
    const cur = o.cur;
    const keys = (o.keys || Object.keys(cur)).filter((k) => prev[k] != null && cur[k] != null && String(prev[k]) !== String(cur[k]));
    const big = (k) => {
      const n = o.size ? o.size(k, prev[k], cur[k]) : null;
      return n != null && isFinite(Number(n)) ? Number(n) : 0.5;
    };
    const order = o.size ? keys.map((k, i) => [k, big(k), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map((x) => x[0]) : keys;
    const text = EXPORT.changes(prev, cur, { keys: order, label: o.label || String, text: o.text, max: 2 });
    return { kind: text ? "hint" : "", text, color: "" };
  }
  /* My film's values with "x.setting" left out when it repeats its curiosity's own value, as the Export does. */
  const capValues = (vals) => {
    const out = {};
    Object.keys(vals || {}).forEach((k) => (/\.setting$/.test(k) && vals[L().base(k)] != null ? null : (out[k] = vals[k])));
    return out;
  };
  function captionAt(beats, i) {
    const c = captionsNow();
    if (!c.on || !beats[i]) return null;
    const cur = capValues(beats[i].values);
    const prev = i > 0 && beats[i - 1] ? capValues(beats[i - 1].values) : null;
    const lanesFirst = (prefs.lanes || []).filter((k) => k in cur);
    const keys = lanesFirst.concat(Object.keys(cur).filter((k) => !lanesFirst.includes(k)));
    const size = (k, a, b) => {
      try {
        if (!S() || !S().known(k)) return null;
        const pa = S().pos(k, a);
        const pb = S().pos(k, b);
        return pa == null || pb == null ? null : Math.abs(pa - pb);
      } catch (e) {
        return null;
      }
    };
    return captionFor({ marker: exportMarkers()[String(beats[i].row)], prev, cur, mode: c.mode, keys, label: labelOf, text: valueText, size });
  }
  function captionHtml(beats, i) {
    const cap = captionAt(beats, i);
    if (!cap || !cap.kind) return "";
    const said = cap.kind === "hint" ? `<span class="sc-cap-k">What's happening</span> ${esc(cap.text)}` : esc(cap.text) + (cap.kind === "auto" ? ` <span class="sc-cap-auto">(auto)</span>` : "");
    const tip = cap.kind === "hint" ? "What changed since the moment before (a hint, not your words)" : cap.kind === "auto" ? "The note Mark the turns put on this moment" : "Your marker's note on this moment";
    return `<div class="sc-cap" data-cap="${cap.kind}" title="${esc(tip)}"><p>${said}</p></div>`;
  }
  /* A marker's note can change in the timeline without the film changing: update the caption right after a
     click, a key or typing, without redrawing the Player. */
  function refreshCaption() {
    if (!page || page.hidden || !captionsNow().on) return;
    const frame = page.querySelector(".sc-viewer.mine .sc-frame");
    if (!frame) return;
    const beats = mineBeats();
    const html = captionHtml(beats, Math.min(row, beats.length - 1));
    const old = frame.querySelector(".sc-cap");
    if ((old ? old.outerHTML : "") === html) return;
    if (old) old.remove();
    if (html) frame.insertAdjacentHTML("beforeend", html);
    frame.classList.toggle("sc-cap-on", !!html);
    txtAvoid();
  }
  let capTimer = null;
  const capSoon = () => {
    if (capTimer || !captionsNow().on) return;
    capTimer = setTimeout(() => ((capTimer = null), refreshCaption()), 0);
  };
  /* The select shows only while Captions is on, so the transport bar keeps its room when they're off. */
  function captionsMenuHtml() {
    const c = captionsNow();
    const pick = `<select data-captions-mode aria-label="What the captions show" title="What the captions show">${CAPTION_MODES.map(([id, l]) => `<option value="${id}"${c.mode === id ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    return `<span class="sc-cap-set"><button type="button" data-act="captions" class="${c.on ? "on" : ""}" aria-pressed="${c.on}" title="Captions: your marker's note on this moment at the bottom of your film's picture, like subtitles. They don't change your film."><span class="sc-lbl">Captions</span></button>${c.on ? `<button type="button" data-act="cap-pop" class="sc-cap-pop-b${trPop === "cap" ? " on" : ""}" aria-haspopup="true" aria-expanded="${trPop === "cap"}" aria-label="What the captions show" title="What the captions show">▾</button><span class="sc-trpop sc-cap-pop${trPop === "cap" ? " open" : ""}">${pick}</span>` : ""}</span>`;
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
      const cap = captionHtml(beats, i);
      return `<article class="sc-viewer mine${prefs.focus === "mine" ? " focus" : ""}" data-viewer="mine">
        <header><button type="button" class="sc-vname" data-focus="mine">My film</button><span class="sc-vsub">${esc(E() ? E().state().name : "")} · moment ${i + 1} of ${beats.length}</span></header>
        <div class="sc-frame${compareNow().on ? " sc-cmp-on" : ""}${cap ? " sc-cap-on" : ""}" data-focus="mine" data-shape="${shape}">${fill(F().svg(vals, Object.assign(frameOpts(sel, vals), { title: "My film, moment " + (i + 1) })))}${prefs.ghost ? [[i - 1, "before"], [i + 1, "after"]].filter(([j]) => beats[j]).map(([j, w]) => `<div class="sc-ghost ${w}" aria-hidden="true">${F().svg(beats[j].values, { title: "" })}</div>`).join("") : ""}${compareHtml(i, shape, sel)}${guidesHtml(vals, att, shape)}${att ? `<span class="sc-att" title="What holds the audience's attention now (momentum)">Attention: ${esc(att.label)}</span>` : ""}${txtLayerHtml(i)}${cap}</div>
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
    /* A redraw while ⋯ More or Captions ▾ is open keeps the focus on the same control inside it. */
    const fa = trPop && !popFocus && document.activeElement;
    if (fa && fa.closest && fa.closest(".sc-transport .sc-trpop")) {
      const k = ["ratio", "compareWith", "captionsMode", "arr"].find((x) => x in fa.dataset);
      if (k) popFocus = `[data-${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}${k === "arr" ? `="${fa.dataset.arr}"` : ""}]`;
    }
    page.querySelector(".sc-transport").innerHTML =`<span class="sc-tc" title="One moment of your film is ${secondsPerMoment()} seconds (the Momentum window's setting)">${tc(row)} / ${tc(Math.max(0, nRows() - 1))}</span>
      <span class="sc-play"><button type="button" data-act="prev" aria-label="Back one moment">◀</button><button type="button" data-act="play" class="sc-playb">${timer ? "Pause" : "Play"}</button><button type="button" data-act="next" aria-label="Forward one moment">▶</button><select data-speed aria-label="Speed">${[0.5, 1, 2, 4].map((sp) => `<option value="${sp}"${prefs.speed === sp ? " selected" : ""}>${sp}×</option>`).join("")}</select>${rangeNow() ? `<button type="button" data-act="range-clear" class="sc-range-b on" title="Play loops over moments ${rangeNow()[0] + 1} to ${rangeNow()[1] + 1}. Click to play the whole film again.">Loop ${rangeNow()[0] + 1}–${rangeNow()[1] + 1} ×</button>` : ""}</span>
      <span class="sc-wins-set"><span class="sc-seg" role="group" aria-label="Windows">${[1, 2, 3].map((n) => `<button type="button" data-wins="${n}" class="${prefs.insp.length + 1 === n ? "on" : ""}" title="${n === 1 ? "Only your film" : n - 1 + " inspiration film" + (n > 2 ? "s" : "") + " and your film"}">${n}</button>`).join("")}</span><button type="button" data-act="add-insp" title="Add another inspiration film viewer">+<span class="sc-lbl"> Inspiration film</span></button>${guidesMenuHtml()}${compareMenuHtml()}${captionsMenuHtml()}${txtButtonHtml()}${moreMenuHtml()}</span>`;
    trDecorate();
    txtAvoid();
    fitTransport();
    if (popFocus) {
      const el = page.querySelector(".sc-transport " + popFocus);
      popFocus = null;
      if (el) el.focus();
    }
  }
  /* ---------- The transport bar's ⋯ More and Captions ▾ (look check, decisions 104 and 113) ----------
     With a panel docked beside the Player (the Momentum column) the bar is narrow, and turning Captions on used to
     wrap it onto five rows and squeeze the viewers. When the bar would take more than two rows it goes compact,
     like CapCut's Player bar: the timecode and play controls on the first row, the picture tools on the second,
     the captions mode behind a small ▾ on Captions, and the less-used controls (viewer Side/Stack, Ratio, what
     Compare shows) in a ⋯ More menu at the end (.sc-tr-compact). If that still takes more than two rows the
     picture tools get short labels too (+, ◐, CC, T; .sc-tr-short), the full names kept for screen readers and
     tooltips. Every control is the same element with the same data- attribute either way: CSS lays them out
     inline when there's room and as small menus when compact. Phones keep the inline bar. */
  let trPop = null; /* "more" | "cap" | null: which small transport menu is open */
  let popFocus = null; /* a selector to give the focus back to after a redraw while a menu is open */
  function moreMenuHtml() {
    const open = trPop === "more";
    const ratio = ratioOpts().length ? `<label class="sc-ratio" title="Frame shape (CapCut's Ratio): how wide or tall your film's picture is; picking one puts a node at this moment. Wide fits a TV or laptop, vertical a phone held upright, square a social post, cinema an extra-wide movie screen.">Ratio <select data-ratio aria-label="Frame shape of my film">${ratioOpts().map((o) => `<option${String(valueHere(RATIO)) === String(o) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>` : "";
    return `<span class="sc-more"><button type="button" data-act="tr-more" class="sc-more-b${open ? " on" : ""}" aria-haspopup="true" aria-expanded="${open}" aria-label="More Player controls" title="More: viewer layout, Ratio, and what Compare shows">⋯</button><span class="sc-trpop sc-more-menu${open ? " open" : ""}" role="group" aria-label="More Player controls"><span class="sc-seg sc-arr-set" role="group" aria-label="Viewer layout"><button type="button" data-arr="side" class="${prefs.arrange === "side" ? "on" : ""}" title="Viewers side by side">Side</button><button type="button" data-arr="stack" class="${prefs.arrange === "stack" ? "on" : ""}" title="Viewers stacked">Stack</button></span>${ratio}${compareWithHtml()}</span></span>`;
  }
  /* How many rows the bar's controls take (an open menu doesn't count). */
  function trRows(t) {
    const ys = [...t.querySelectorAll("button, select, .sc-tc")]
      .filter((e) => e.getClientRects().length && !e.closest(".sc-trpop.open"))
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 0)
      .map((r) => r.top + r.height / 2)
      .sort((a, b) => a - b);
    let n = 0;
    let last = -1e9;
    for (const y of ys) if (y - last > 8) (n++, (last = y));
    return n;
  }
  /* Compact when the bar would wrap past two rows; only on wide screens (phones lay the bar out on their own).
     Checked after every redraw of the bar and whenever its width changes (a panel docked or taken off, a resize). */
  let trWidth = 0;
  let trWatch = false;
  function fitTransport() {
    const t = page && page.querySelector(".sc-transport");
    if (!t || !t.getClientRects().length) return;
    trWidth = Math.round(t.getBoundingClientRect().width);
    t.classList.remove("sc-tr-compact", "sc-tr-short");
    if (innerWidth > 860 && trRows(t) > 2) {
      t.classList.add("sc-tr-compact");
      if (trRows(t) > 2) t.classList.add("sc-tr-short");
    }
    if (trWatch) return;
    trWatch = true;
    if (window.ResizeObserver)
      new ResizeObserver(() => {
        if (!page.hidden && Math.round(t.getBoundingClientRect().width) !== trWidth) fitTransport();
      }).observe(t);
    window.addEventListener("resize", () => !page.hidden && fitTransport());
  }
  function toggleTrPop(which, open) {
    trPop = open === undefined ? (trPop === which ? null : which) : open ? which : null;
    if (trPop) {
      guidesOpen = false;
      popFocus = trPop === "more" ? ".sc-more-menu button" : "[data-captions-mode]";
    } else popFocus = which === "more" ? '[data-act="tr-more"]' : '[data-act="cap-pop"]';
    drawViewers();
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
  function controlHtml(id, s, val, disabled, big) {
    const kind = L().control(s);
    const dis = disabled ? " disabled" : "";
    /* In a curiosity's own window a list with no order is a grid of chips to tap, not a menu (decision in
       decisions/curiosity-windows-thread.md). */
    if (kind === "choice" && big) return `<span class="sc-chips" role="group" aria-label="${esc(s.label)}">${s.scale.map((o) => `<button type="button" data-set="${esc(id)}" data-v="${esc(o)}" class="${String(val) === String(o) ? "on" : ""}"${dis}>${esc(o)}</button>`).join("")}</span>`;
    if (kind === "toggle") return `<span class="sc-toggle" role="group">${s.scale.map((o) => `<button type="button" data-set="${esc(id)}" data-v="${esc(o)}" class="${String(val) === String(o) ? "on" : ""}"${dis}>${esc(o)}</button>`).join("")}</span>`;
    if (kind === "choice") return `<select data-set="${esc(id)}"${dis}><option value="">not set</option>${s.scale.map((o) => `<option${String(val) === String(o) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    if (kind === "steps") {
      /* The engine's order when it has one for the same words (Emotion runs calm to charged, not database order). */
      const d = S() && S().known(id) ? S().domain(id) : null;
      const sc = d && d.kind === "choice" && d.options.length === s.scale.length && s.scale.every((o) => d.options.includes(String(o))) ? d.options : s.scale;
      const i = sc.findIndex((o) => String(o) === String(val));
      return `<span class="sc-steps"><input type="range" min="0" max="${sc.length - 1}" step="1" value="${i < 0 ? 0 : i}" data-step-set="${esc(id)}" data-scale="${esc(JSON.stringify(sc))}"${dis} aria-label="${esc(s.label)}"><output>${esc(val == null ? "not set" : val)}</output></span>`;
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
  /* CapCut's ◀ ◆ ▶ at the right end of a keyframed setting's row: jump to the key before or after the playhead, in
     Details and in the windows (Jeremy, 2026-10-04 17:41Z: the keyframe ◇ sits where CapCut's does). Shown once
     the lane has a node; an arrow with no key that way is greyed. */
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
  /* CapCut's section diamond (on "Position & Size" and the like): one ◇ for every setting under a heading. Filled
     when each of them has a key at the playhead, half-lit when some do. Click sets a key on every setting that has
     none here; when all have one, it takes them all off. One undo step; a locked lane (🔒) is left alone. In the
     title bar of a window it covers every setting in the window. */
  function keyAllBtn(ids, ctx, inTitle) {
    if (!ctx.edit || !S()) return "";
    const list = (ids || []).filter((id, i, a) => id && S().known(id) && a.indexOf(id) === i);
    if (list.length < 2) return "";
    const n = list.filter((id) => keyState(id) === "here").length;
    const k = n === list.length ? "here" : n ? "some" : "none";
    const what = inTitle ? `every setting in this window (${list.length})` : `the ${list.length} settings under this heading`;
    const t = k === "here" ? `A key is set here on ${what}; click to take them all off` : `Set a key here on ${what}${n ? ` (${n} already have one)` : ""}`;
    return `<button type="button" class="sc-key sc-keyall ${k}${inTitle ? " sc-keyall-t" : ""}" data-key-all="${esc(list.join(","))}" title="${esc(t)}" aria-label="${esc(t)}">${k === "here" ? "◆" : "◇"}</button>`;
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
    /* The fine controls live behind Fine-tune now (Jeremy, 2026-10-03 15:02Z: "All these parameters can be hidden
       under the word fine-tune"); the inline fold stays off. */
    const open = false;
    const fine = (c.sliders || []).filter((s) => s.id !== c.main && s.id !== "setting");
    const mainS = (c.sliders || []).find((s) => s.id === c.main || s.id === "setting") || (c.sliders || [])[0];
    const take = ctx.insp ? Number((ctx.insp.takes || {})[key]) || 0 : 0;
    return `<div class="sc-cur${sel ? " sel" : ""}">
      <div class="sc-cur-top">
        <button type="button" class="sc-cur-name" data-select-cur="${esc(c.id)}" title="${esc(c.plain || "")}">${esc(c.label)}</button>
        ${spark(key, ctx.beats)}<button type="button" class="sc-cur-win sc-finetune" data-open-win="${esc(c.id)}" title="Fine-tune ${esc(c.label)}: every setting inside it (${fine.length + 1}), each its own lane, or say what you want" aria-label="Fine-tune ${esc(c.label)}">Fine-tune</button>${ctx.edit && S() && S().known(key) ? `<button type="button" class="sc-cur-more" data-cur-menu="${esc(key)}" aria-haspopup="menu" aria-expanded="false" title="More for ${esc(c.label)}: use this setting all through the film or in the selected stretch, reset it, or clear its lane" aria-label="More for ${esc(c.label)}">⋯</button>` : ""}
      </div>
      ${mainS ? `<div class="sc-ctl sc-ctl-k"><span class="sc-ctl-l">${esc(mainS.label)}</span>${controlHtml(key, mainS, mainVal, !ctx.edit)}${keyNavBtns(key, ctx)}</div>` : ""}
      ${ctx.insp ? `<div class="sc-take"><label><input type="checkbox" data-take="${esc(key)}" ${take > 0 ? "checked" : ""}> Take into my film</label>${take > 0 ? `<input type="range" min="5" max="100" step="5" value="${Math.round(take * 100)}" data-take-amt="${esc(key)}" aria-label="Blend amount"><output>${Math.round(take * 100)}%</output>` : ""}</div>` : ""}
      ${sel && c.momentum ? momentumBox(c.momentum) : ""}
      ${open ? `<div class="sc-fine">${fine.map((s) => `<div class="sc-ctl sc-ctl-k"><span class="sc-ctl-l" title="${esc(s.plain || "")}">${esc(s.label)}</span>${controlHtml(sliderId(c, s), s, ctx.value(sliderId(c, s)), !ctx.edit)}${keyNavBtns(sliderId(c, s), ctx)}</div>`).join("")}</div>` : ""}
    </div>`;
  }
  /* The ⋯ menu on a Details row (CapCut's "Apply to all" and Reset): four ways to spread or take back one lane's
     setting, each one undo step (APPLY builds the commands). It opens under the row's name, is reached with Tab,
     moves with the arrow keys and closes on Esc or a click anywhere else. */
  let curMenu = null; /* { key, btn } while a row's menu is open */
  function curArea() {
    const a = lanes && lanes.area && lanes.area();
    return a && Number.isFinite(a.j0) && Number.isFinite(a.j1) ? { j0: Math.min(a.j0, a.j1), j1: Math.max(a.j0, a.j1) } : null;
  }
  function closeCurMenu(focusBack) {
    const m = page && page.querySelector(".sc-cur-menu");
    const had = curMenu;
    curMenu = null;
    if (m) m.remove();
    if (had && had.btn && had.btn.isConnected) {
      had.btn.setAttribute("aria-expanded", "false");
      if (focusBack) had.btn.focus();
    }
    return !!m;
  }
  function openCurMenu(btn) {
    const key = btn.dataset.curMenu;
    const was = curMenu && curMenu.key === key && page.querySelector(".sc-cur-menu");
    closeCurMenu();
    if (was) return;
    const ar = curArea();
    const items = [
      ["all", "Use this all through the film", "The setting at the playhead from the first moment to the last, flat"],
      ar && ["stretch", "Use this in the selected stretch", `The setting at the playhead held from moment ${ar.j0 + 1} to moment ${ar.j1 + 1}`],
      ["reset", "Reset to how the scene starts", "Take off this lane's nodes after the first moment"],
      ["clear", "Clear this lane", "Take every node off this lane"],
    ].filter(Boolean);
    const m = document.createElement("div");
    m.className = "sc-cur-menu";
    m.setAttribute("role", "menu");
    m.setAttribute("aria-label", "More for " + labelOf(key));
    m.innerHTML = items.map(([id, l, tip]) => `<button type="button" role="menuitem" data-cur-apply="${id}" data-cur="${esc(key)}"><b>${esc(l)}</b><small>${esc(tip)}</small></button>`).join("");
    m.addEventListener("keydown", onCurMenuKey);
    btn.closest(".sc-cur-top").after(m);
    btn.setAttribute("aria-expanded", "true");
    curMenu = { key, btn };
    m.querySelector("button").focus();
  }
  function onCurMenuKey(e) {
    const list = [...e.currentTarget.querySelectorAll("[data-cur-apply]")];
    const i = list.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      return closeCurMenu(true);
    }
    if (e.key === "Tab") return closeCurMenu();
    const to = e.key === "ArrowDown" ? (i + 1) % list.length : e.key === "ArrowUp" ? (i - 1 + list.length) % list.length : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    e.stopPropagation();
    list[to].focus();
  }
  /* Carry out a menu item on curiosity key's lane, and say what happened in the status line. */
  function applyCur(kind, key) {
    const st = E() && E().state();
    if (!st || !S()) return;
    const name = labelOf(key);
    const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
    let track = (trackHas(key, st) || {}).id;
    let add = false;
    if (!track && (kind === "reset" || kind === "clear")) return toast(`${name} has no nodes, so there is nothing to ${kind === "reset" ? "reset" : "clear"}.`);
    if (!track) {
      track = window.CurioLanes && window.CurioLanes.trackFor(key, st);
      if (!track) return toast("Every track is full; remove a lane in Arrange first.");
      add = true;
    }
    if (window.CurioLanes && window.CurioLanes.isLocked && window.CurioLanes.isLocked(track + "|" + key)) return toast(`${name} is locked (the 🔒 by its name on the timeline), so nothing was changed. Click the 🔒 to unlock it first.`);
    const r = st.rows[row];
    const here = r ? S().fix(key, add ? S().start(key) : E().value(r.id, track, key)) : null;
    let res;
    let label;
    let said;
    if (kind === "all") {
      res = APPLY.allFilm(st, track, key, here, add);
      label = `${name}: ${here} all through the film`;
      said = () => `${name} is now ${here} all through the film: one node at moment 1${res.removed ? `, ${n(res.removed, "other node", "other nodes")} taken off` : ""}, and the lane jumps so it stays flat. Undo takes it back.`;
    } else if (kind === "stretch") {
      const ar = curArea();
      if (!ar) return toast("Select a stretch of moments on the timeline first (drag across empty space in the lanes).");
      res = APPLY.stretch(st, track, key, here, ar.j0, ar.j1, add);
      label = `${name}: ${here} from moment ${ar.j0 + 1} to ${ar.j1 + 1}`;
      said = () => `${name} holds at ${here} from moment ${res.from + 1} to moment ${res.to + 1}${res.removed ? `; ${n(res.removed, "node", "nodes")} in between taken off` : ""}. Undo takes it back.`;
    } else if (kind === "reset") {
      res = APPLY.reset(st, track, key, st.rows[0] ? S().fix(key, E().value(st.rows[0].id, track, key)) : null);
      label = `Reset ${name} to how the scene starts`;
      said = () => `${name} is back to how the scene starts: ${n(res.removed, "node", "nodes")} after the first moment taken off. Undo takes it back.`;
    } else if (kind === "clear") {
      res = APPLY.clear(st, track, key);
      label = `Clear the ${name} lane`;
      said = () => `${name}'s lane is clear: ${n(res.removed, "node", "nodes")} taken off. Undo takes it back.`;
    } else return;
    if (res.error) return toast(res.error);
    if (kind === "all" || kind === "stretch") {
      showLane(key);
      save();
    }
    const out = E().send({ type: "batch", label, commands: res.cmds });
    if (!out.ok) return toast(out.error || "That did not work, so nothing was changed.");
    toast(said());
  }
  /* ---------- Look ▾ in Details' header for My film: copy a whole moment's look, paste it elsewhere ----------
     The copied look lives in memory and in sessionStorage (this tab only), never in the film and never in undo.
     LOOK builds the commands; these read the engine, write one batch and say what happened. */
  const LOOK_KEY = "curiosities-screen-look-v1";
  let look; /* undefined until first read from sessionStorage */
  let lookOpen = false;
  function lookNow() {
    if (look === undefined) {
      look = null;
      try {
        look = LOOK.clean(JSON.parse(sessionStorage.getItem(LOOK_KEY)));
      } catch (e) {}
    }
    return look;
  }
  function lookHelpers(st) {
    const CL = window.CurioLanes;
    return {
      value: (rid, track, cur) => E().value(rid, track, cur),
      trackOf: (cur) => (trackHas(cur, st) || {}).id || null,
      trackFor: (cur) => (CL && CL.trackFor ? CL.trackFor(cur, st) : null),
      locked: (lk) => !!(CL && CL.isLocked && CL.isLocked(lk)),
      fix: (cur, v) => S().fix(cur, v),
      start: (cur) => S().start(cur),
      known: (cur) => S().known(cur),
      limit: E().LIMIT && E().LIMIT.perTrack,
      perTrack: true,
    };
  }
  const nSettings = (k) => `${k} ${k === 1 ? "setting" : "settings"}`;
  function lookCopy() {
    closeLook();
    const st = E() && S() && E().state();
    if (!st) return toast("Your film is not loaded yet.");
    const res = LOOK.copy(st, row, lookHelpers(st));
    if (res.error) return toast(res.error);
    look = res;
    try {
      sessionStorage.setItem(LOOK_KEY, JSON.stringify(res));
    } catch (e) {}
    drawInspector();
    toast(`Copied moment ${row + 1}'s look: ${nSettings(res.count)}.`);
  }
  /* where: "here" (the playhead's moment) or "stretch" (the stretch selected on the timeline). */
  function lookPaste(where) {
    closeLook();
    const lk = lookNow();
    if (!lk) return toast("Copy a moment's look first: Look ▾ in Details, Copy this moment's look (or ⌥⌘C).");
    const st = E() && S() && E().state();
    if (!st) return toast("Your film is not loaded yet.");
    let a = row;
    let b = row;
    if (where === "stretch") {
      const ar = curArea();
      if (!ar) return toast("Select a stretch of moments on the timeline first (drag across empty space in the lanes).");
      a = ar.j0;
      b = ar.j1;
    }
    const h = lookHelpers(st);
    const res = LOOK.paste(st, lk, a, b, h);
    if (res.error) return toast(res.error);
    const names = (list) => list.slice(0, 3).map(labelOf).join(", ") + (list.length > 3 ? ` and ${list.length - 3} more` : "");
    const onto = res.from === res.to ? `moment ${res.from + 1}` : `moments ${res.from + 1} to ${res.to + 1}`;
    const src = `moment ${lk.from + 1}'s look`;
    const extra =
      (res.locked.length ? ` ${res.locked.length} locked ${res.locked.length === 1 ? "lane was" : "lanes were"} skipped (${names(res.locked)}).` : "") +
      (res.full.length ? ` ${res.full.length} could not go on a track because every track is full (${names(res.full)}).` : "");
    if (!res.changed.length) return toast(`Nothing changed: ${onto} already ${res.from === res.to ? "has" : "plays"} ${src} (${nSettings(res.matched.length)} already matched).${extra}`);
    const out = E().send({ type: "batch", label: `Paste ${src} onto ${onto}`, commands: res.cmds });
    if (!out.ok) return toast(out.error || "That did not work, so nothing was changed.");
    /* A link or a pin can still change what plays (the engine lays them on after the nodes); say so plainly. */
    const st2 = E().state();
    const off = res.changed.filter((cur) => {
      const t = h.trackOf(cur) || (trackHas(cur, st2) || {}).id;
      if (!t) return false;
      for (let j = res.from; j <= res.to; j++) if (String(S().fix(cur, E().value(st2.rows[j].id, t, cur))) !== String(S().fix(cur, lk.values[cur]))) return true;
      return false;
    });
    const how = res.from === res.to ? "" : ", held from start to end";
    toast(
      `Pasted ${src} onto ${onto}: ${nSettings(res.changed.length)} changed${how}, ${res.matched.length} already matched.` +
        extra +
        (off.length ? ` ${off.length} still ${off.length === 1 ? "plays" : "play"} differently because a link or a pin changes ${off.length === 1 ? "it" : "them"} (${names(off)}).` : "") +
        " Undo takes it back."
    );
  }
  function lookMenuHtml() {
    const lk = lookNow();
    const ar = curArea();
    const item = (id, l, tip, off) => `<button type="button" role="menuitem" data-look="${id}"${off ? " disabled" : ""}><b>${esc(l)}</b><small>${esc(tip)}</small></button>`;
    return `<span class="sc-mlook"><button type="button" class="sc-mlook-b" data-look-menu aria-haspopup="menu" aria-expanded="${lookOpen}" title="Copy every setting this moment plays, then paste that look onto another moment (CapCut's Copy and Paste attributes)">Look ▾</button>${
      lookOpen
        ? `<div class="sc-mlook-menu" role="menu" aria-label="This moment's look">${item("copy", "Copy this moment's look", `Every setting My film plays at moment ${row + 1}`)}${item(
            "paste",
            "Paste the look here",
            lk ? `Moment ${lk.from + 1}'s look (${nSettings(lk.count)}) onto moment ${row + 1}` : "Copy a moment's look first"
          , !lk)}${ar ? item("stretch", "Paste into the selected stretch", lk ? `Moment ${lk.from + 1}'s look held from moment ${ar.j0 + 1} to moment ${ar.j1 + 1}` : "Copy a moment's look first", !lk) : ""}<p class="sc-mlook-foot">⌥⌘C copies, ⌥⌘V pastes. One undo takes a paste back.</p></div>`
        : ""
    }</span>`;
  }
  function closeLook(focusBack) {
    if (!lookOpen) return false;
    lookOpen = false;
    const box = page && page.querySelector(".sc-mlook");
    if (box) {
      const m = box.querySelector(".sc-mlook-menu");
      if (m) m.remove();
      const b = box.querySelector(".sc-mlook-b");
      b.setAttribute("aria-expanded", "false");
      if (focusBack) b.focus();
    }
    return true;
  }
  function toggleLook() {
    if (closeLook()) return;
    lookOpen = true;
    const box = page.querySelector(".sc-mlook");
    if (!box) return;
    box.outerHTML = lookMenuHtml();
    const first = page.querySelector(".sc-mlook-menu [data-look]:not([disabled])");
    if (first) first.focus();
    if (!toggleLook.wired) {
      /* Esc closes it (focus back to Look ▾); the arrow keys, Home and End move through it. */
      toggleLook.wired = true;
      document.addEventListener("keydown", (e) => {
        if (!lookOpen || !page || page.hidden) return;
        const inMenu = e.target && e.target.closest && e.target.closest(".sc-mlook");
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          return closeLook(!!inMenu);
        }
        if (!inMenu) return;
        if (e.key === "Tab") return closeLook();
        const list = [...page.querySelectorAll(".sc-mlook-menu [data-look]:not([disabled])")];
        if (!list.length) return;
        const i = list.indexOf(document.activeElement);
        const to = e.key === "ArrowDown" ? (i + 1) % list.length : e.key === "ArrowUp" ? (i <= 0 ? list.length - 1 : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -1;
        if (to < 0) return;
        e.preventDefault();
        e.stopPropagation();
        list[to].focus();
      }, true);
    }
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
    if (had >= 0) {
      wins.push(wins.splice(had, 1)[0]);
      if (id !== base) wins[wins.length - 1].focus = id;
    } else {
      /* Kept inside the screen, so the × can always be tapped (phone width too); every new one steps down. */
      const vw = window.innerWidth || 1024;
      const vh = window.innerHeight || 768;
      const ww = Math.min(360, vw - 32);
      const n = wins.length;
      const wh = Math.min(vh * 0.78, 720);
      /* Each lap of seven moves a little right, so the eighth does not land exactly on the first. */
      const lap = Math.floor(n / 7) * 14;
      wins.push({ id: base, x: Math.max(8, Math.min(120 + (n % 7) * 28 + lap, vw - ww - 8)), y: (() => {
        /* On a short screen the cascade wraps back to the top instead of piling up at the bottom. */
        const room = Math.max(0, vh - wh - 16);
        return room > 0 ? 8 + ((82 + (n % 7) * 28) % (room + 1)) : 8;
      })(), focus: id === base ? "" : id });
    }
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
  /* Keys typed in a tool window over the Screen (a Maya tool such as 3D characters, or any open dialog) belong to
     that tool: the Screen's shortcuts and its ⌘Z leave them alone, so they never change the film behind it. */
  function inToolWindow(e) {
    /* The Viewer (Draw & build) open over the Screen takes every key: html.cv-open is set while it shows. */
    if (document.documentElement.classList.contains("cv-open")) return true;
    const t = e && e.target;
    if (t && t.closest && t.closest("dialog, .sc-maya-dlg, .rig-dlg, .sc-find, .sc-tplpop, .sl-tplpop, .sc-txt-menu")) return true;
    /* Quick find (⌘K) takes every key while it is open. */
    if (findOpen) return true;
    /* A tool opened as a modal window takes the keys even when nothing inside it has focus. */
    try {
      return !!document.querySelector("dialog:modal");
    } catch (err) {
      return false;
    }
  }
  function undoAll(dir) {
    const St = window.CurioStore;
    /* A view change still waiting to be written down goes on the list first; afterwards the view is read again,
       so what the undo put back is not taken for a new change. */
    if (St && typeof St.external === "function" && typeof St[dir] === "function") {
      vuFlush();
      const done = St[dir]();
      vuSync();
      return done;
    }
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
  /* The faces, groups, presets and shapes from data/windows (screen/windows.js, window.CurioWindowFaces). */
  const faces = () => window.CurioWindowFaces || null;
  const faceHelpers = (ctx, focus) => ({ esc, keyFor, sliderId, controlHtml, keyBtn, spark, row, ctx, focus });
  const faceApi = () => ({ setValues, setAt, showLane, toast, range: rangeNow, value: valueHere, helpers: () => faceHelpers(mineCtx()) });
  function winHtml(w, z) {
    const F = faces();
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
        <div class="sc-wctl-h"><span><b>${esc(main ? labelOf(id) : sl.label)}</b></span>${spark(id, ctx.beats)}${F && F.midiBtn ? F.midiBtn(id) : ""}<button type="button" data-win-lane="${esc(id)}" title="Put ${esc(sl.label)} on the timeline as its own lane">+ lane</button>${keyNavBtns(id, ctx)}</div>
        ${sl.plain ? `<p class="sc-k">${esc(sl.plain)}</p>` : ""}
        <div class="sc-ctl">${controlHtml(id, sl, ctx.value(id), !ctx.edit, true)}</div>
      </div>`;
    };
    const wh = `${w.w ? `;width:${w.w}px` : ""}${w.h ? `;height:${w.h}px;max-height:none` : ""}`;
    return `<section class="sc-win" data-win="${esc(c.id)}" role="dialog" aria-label="${esc(c.label)} window" style="left:${w.x}px;top:${w.y}px;z-index:${60 + z}${wh}">
      <header class="sc-win-h" data-win-drag="${esc(c.id)}">${icon(cat.icon)}<b>${esc(c.label)}</b><small>${esc(cat.label)}${isAdv(c) ? " · ADVANCED" : ""}</small>${keyAllBtn(sliders.map((s) => sliderId(c, s)), ctx, true)}<button type="button" data-win-close="${esc(c.id)}" aria-label="Close the ${esc(c.label)} window">×</button></header>
      <div class="sc-win-b">
        ${c.plain ? `<p class="sc-win-plain">${esc(c.plain)}</p>` : ""}
        <p class="sc-k">My film, moment ${row + 1}: every change here becomes a node.</p>
        ${F && F.lookHtml ? F.lookHtml(c, faceHelpers(ctx)) : ""}
        ${winSpecial(c, ctx)}
        ${F && F.sayHtml ? F.sayHtml(c, faceHelpers(ctx)) : ""}
        ${F ? F.html(c, faceHelpers(ctx, w.focus)) : ""}
        ${(F && F.grouped(c, block, (list) => keyAllBtn(list.map((s) => sliderId(c, s)), ctx))) || `<div class="sc-wpart"><div class="sc-wpart-h"><h4>Every knob and slider</h4>${keyAllBtn(sliders.map((s) => sliderId(c, s)), ctx)}</div>${sliders.map(block).join("")}</div>`}
        ${c.momentum ? momentumBox(c.momentum) : ""}
        <div class="sc-wbtns"><button type="button" data-select-cur="${esc(c.id)}">Look through it</button><button type="button" data-win-curve="${esc(key)}">Shape its curve</button></div>
      </div>
      <span class="sc-win-grip" data-win-grip="${esc(c.id)}" tabindex="0" role="separator" aria-label="Resize the ${esc(c.label)} window: drag this corner, or use the arrow keys" title="Drag this corner to resize the window (or focus it and use the arrow keys)"></span>
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
    /* Keep keyboard focus on the same control across the redraw, so arrow keys keep stepping. */
    const a = document.activeElement;
    const aw = a && box.contains(a) && a.closest(".sc-win");
    const attr = aw && ["data-set", "data-step-set", "data-knob", "data-cw-say-text", "data-cw-shape-pick"].find((n) => a.hasAttribute(n));
    const keep = attr ? `.sc-win[data-win="${aw.dataset.win}"] [${attr}="${a.getAttribute(attr)}"]${a.dataset.v != null ? `[data-v="${a.dataset.v}"]` : ""}` : null;
    box.innerHTML = wins.filter((w) => L().get("curiosity", w.id)).map((w, i) => winHtml(w, i)).join("");
    box.querySelectorAll(".sc-win").forEach((x) => scroll[x.dataset.win] && (x.querySelector(".sc-win-b").scrollTop = scroll[x.dataset.win]));
    if (keep) {
      try {
        const el = box.querySelector(keep);
        if (el) el.focus({ preventScroll: true });
      } catch (e) {}
    }
  }
  function winClick(d, t) {
    if (faces() && (d.cwPreset || d.cwShape || d.cwSurprise || d.cwSay || d.cwMic || d.cwMidi)) return faces().click(d, t, faceHelpers(mineCtx()), faceApi());
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
        sub: "Moment " + (row + 1) + ": every change becomes a node here" + onTrackNote(st),
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
    box.innerHTML = `<header class="sc-insp-h"><strong class="sc-details">Details</strong><span><b>${esc(ctx.title)}</b> · ${esc(ctx.sub)}</span>${insp ? `<button type="button" data-focus="mine">Inspect my film</button>` : ctx.edit ? lookMenuHtml() : ""}</header>${!insp && ctx.edit ? trRowHtml() : ""}${blend}<div class="sc-cats">${body}</div>`;
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
    /* Two or more tracks carrying the same curiosity (one per character, say) each get their own row, named by
       the track ("Eyelines · Character B"), with its own Off, Solo and Lock. One track: one row, as always. */
    const perTrack = (list) => {
      const rows = [];
      list.forEach((ln) => {
        const on = st.tracks.filter((t) => t.curiosities.includes(ln.cur));
        if (on.length < 2) return rows.push(ln);
        on.forEach((t) => rows.push(Object.assign({}, ln, { track: t.id, trackLabel: t.label || t.id, label: ln.label + " · " + (t.label || t.id) })));
      });
      return rows;
    };
    if (prefs.view === "screen") {
      /* What you are looking through, then the tracks you put on with a card's + . */
      sel.curiosities.forEach((c) => add(c));
      prefs.lanes.forEach((c) => add(c));
      return perTrack(out);
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
    /* Potential lanes: each main curiosity of an open category, with its graded lanes (eyeline.speaking...) right
       after it; a curiosity whose bare lane is only off or on shows its graded lane in its place. */
    if (prefs.showAll)
      L().CATEGORIES.forEach(
        (cat) =>
          prefs.openCats[cat.id] &&
          mainOnly(L().curiosities(cat.id)).forEach((c) => {
            const g = partsOf(c.id);
            if (!g.bareSecond) add(c.id, { group: cat.label });
            g.parts.forEach((p) => add(p.key, { group: cat.label }));
          })
      );
    return perTrack(out);
  }
  /* The graded lanes the pickers offer for a curiosity (CurioLanes.laneParts), or none when lanes.js is older. */
  function partsOf(id) {
    const CL = window.CurioLanes;
    return CL && CL.laneParts ? CL.laneParts(id) : { parts: [], bareSecond: false };
  }
  /* Every curiosity as <option>s by category, for Add a curiosity track and each track's dropdown. A curiosity's
     graded lanes follow it, indented ("↳ Eyelines: speaking now"); when its bare lane is only off or on, its
     graded lane takes its name and place, and the bare lane comes last, marked as the bare lane. Built once per
     timeline draw; each track's dropdown marks its own curiosity as selected. */
  var laneOptsMemo = null;
  function laneOptions() {
    if (laneOptsMemo) return laneOptsMemo;
    const opt = (v, text, title) => `<option value="${esc(v)}"${title ? ` title="${esc(title)}"` : ""}>${esc(text)}</option>`;
    const sub = (t) => "  ↳ " + t;
    laneOptsMemo = L()
      .CATEGORIES.map((c) => {
        const items = L()
          .curiosities(c.id)
          .map((x) => {
            const g = partsOf(x.id);
            if (!g.parts.length) return opt(keyFor(x.id), x.label);
            const main = g.parts.find((p) => p.main);
            const name = (p) => (p.main ? p.label : S() && S().known(p.key) ? labelOf(p.key) : p.label);
            const each = (p) => (p.track === "character" ? " One lane for each character." : "");
            const head = g.bareSecond ? opt(main.key, x.label, `${x.label}, graded (${main.key}).${each(main)}`) : opt(keyFor(x.id), x.label);
            const rest = g.parts.filter((p) => !(g.bareSecond && p === main)).map((p) => opt(p.key, sub(name(p)), `${name(p)} (${p.key}): a graded lane of ${x.label}.${each(p)}`));
            const bare = g.bareSecond ? opt(x.id, sub(x.label + " (bare lane)"), `The bare ${x.label} lane (${x.id}), kept for older films. The graded ${x.label} lane above is the one other tools read.`) : "";
            return head + rest.join("") + bare;
          })
          .join("");
        return `<optgroup label="${esc(c.label)}">${items}</optgroup>`;
      })
      .join("");
    return laneOptsMemo;
  }
  function laneHeader(ln, i) {
    const cat = L().categoryOf(ln.cur);
    const all = laneOptions();
    const mine = `value="${esc(ln.cur)}"`;
    const has = all.indexOf(mine + ">") >= 0 || all.indexOf(mine + " ") >= 0;
    const opts = has ? all.replace(new RegExp(mine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=[ >])"), mine + " selected") : all;
    const tr = ln.trackLabel && ln.track ? ` data-lane-track="${esc(ln.track)}"` : "";
    return `<select class="sl-pick" data-lane-cur="${esc(ln.cur)}"${tr} aria-label="Curiosity on this track${ln.trackLabel ? " (" + esc(ln.trackLabel) + ")" : ""}" title="${esc(((L().CATEGORIES.find((c) => c.id === cat) || {}).label || "") + (ln.group ? " · " + ln.group : "") + (ln.trackLabel ? " · " + ln.trackLabel : ""))}: change which curiosity this track is">${has ? "" : `<option selected>${esc(labelOf(ln.cur))}</option>`}${opts}</select>`;
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
  /* Picking a curiosity opens its lane's group on the timeline if it is folded (lanes.js reveal). Every pick sets a
     new prefs.sel, so a new one means a pick; a redraw because the film changed leaves the folds alone. */
  let revealed = prefs.sel;
  function drawTimeline(fromEngine) {
    const box = page.querySelector(".sc-timeline");
    if (!E() || !window.CurioLanes) {
      box.innerHTML = `<p class="sc-note">The timeline needs the engine (engine/load.js).</p>`;
      return;
    }
    const sel = selection();
    laneOptsMemo = null; /* the database may have grown graded lanes since the last draw */
    const potential =
      prefs.view === "arrange"
        ? `<div class="sc-potential">
          <button type="button" data-act="show-all" class="${prefs.showAll ? "on" : ""}" aria-pressed="${prefs.showAll}">Show all potential curiosities</button>
          <button type="button" data-act="show-suites" class="${prefs.showSuites ? "on" : ""}" aria-pressed="${prefs.showSuites}">Show all potential curiosity suites</button>
          <select data-add-lane aria-label="Add a curiosity track"><option value="">+ Add a curiosity track</option>${L()
            .CATEGORIES.length ? laneOptions() : ""}</select>
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
        joins: trJoins,
        texts: txtLanes,
        beats: () => mineBeats(),
        /* Film lines: the inspiration viewer picked in the Player (else the first one). */
        inspiration: () => { const v = prefs.insp.find((x) => x.id === prefs.focus) || prefs.insp[0], f = v && film(v.film); return f ? { name: filmTitle(f), beats: f.beats } : null; },
        showLanes: (curs) => (curs.forEach(showLane), save()),
        header: prefs.view === "arrange" ? laneHeader : null,
        onClip: (j) => setRow(j),
        onHover: (j) => setRow(j),
        onOpen: openWin,
        secondsPerMoment,
        range: rangeNow,
        /* Add, duplicate and take out moments (the timeline toolbar and its area tools), and the toolbar's Undo
           and Redo on the app-wide list, so they take back a whole ripple the way ⌘Z does. */
        ripple: (kind) => ripple(kind),
        undo: (dir) => undoAll(dir),
        canUndo: (dir) => { const St = window.CurioStore; return St && typeof St.external === "function" ? (dir === "redo" ? St.canRedo() : St.canUndo()) : !!(E() && (dir === "redo" ? E().canRedo() : E().canUndo())); },
        onSelect: (cur, track) => {
          /* A row of one track (two tracks carry this curiosity): Details now reads and writes that track's lane. */
          const before = pickedTrack ? pickedTrack.cur + "|" + pickedTrack.track : "";
          pickedTrack = track ? { cur, track } : null;
          const moved = before !== (pickedTrack ? cur + "|" + track : "");
          if (prefs.sel.level === "curiosity" && prefs.sel.id === cur) return moved ? drawInspector() : undefined;
          if (prefs.view === "screen" && prefs.sel.level !== "curiosity") return;
          prefs.sel = { level: "curiosity", id: cur };
          save();
          drawBar();
          drawViewers();
          drawInspector();
        },
      });
    } else lanes.draw();
    if (!fromEngine && prefs.sel !== revealed && prefs.sel && prefs.sel.level === "curiosity" && lanes.reveal) lanes.reveal(keyFor(prefs.sel.id));
    revealed = prefs.sel;
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
     curiosities, which every character has on their own track (the one picked in the Character tab). When several
     tracks carry another curiosity, it is the track whose row was last picked on the timeline, else the character
     picked in the Character tab if that character carries it, else the first. */
  var pickedTrack = null; /* { cur, track }: the row picked on the timeline */
  /* Details' header says which track it edits when the picked curiosity is on several: " · Eyelines on Character B". */
  function onTrackNote(st) {
    if (!st || !prefs.sel || prefs.sel.level !== "curiosity") return "";
    const id = keyFor(prefs.sel.id);
    if (st.tracks.filter((t) => t.curiosities.includes(id)).length < 2) return "";
    const t = trackHas(id, st);
    return t ? ` · ${labelOf(id)} on ${t.label || t.id}` : "";
  }
  function trackHas(id, st) {
    if (window.CharacterScreen && window.CharacterScreen.claims(id)) return window.CharacterScreen.trackHas(id, st);
    const on = st.tracks.filter((t) => t.curiosities.includes(id));
    if (on.length < 2) return on[0];
    const row = pickedTrack && pickedTrack.cur === id ? on.find((t) => t.id === pickedTrack.track) : null;
    if (row) return row;
    const CS = window.CharacterScreen;
    const ch = CS && CS.track ? CS.track(st) : null;
    return on.find((t) => t.kind === "character" && t.id === ch) || on[0];
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
    const locked = [];
    list.forEach(([id, v]) => {
      let track = placed[id] || (trackHas(id, st) || {}).id;
      /* A lane locked on the timeline (🔒) keeps its nodes: a change in Details or a window does not write one. */
      if (track && window.CurioLanes && window.CurioLanes.isLocked && window.CurioLanes.isLocked(track + "|" + id)) return locked.push(id);
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
    if (locked.length) toast(`${locked.length === 1 ? labelOf(locked[0]) + " is" : locked.length + " settings are"} locked (🔒 by the name on the timeline), so ${locked.length === 1 ? "its keys stay" : "their keys stay"} as they are. Click the 🔒 to unlock.`);
    if (!cmds.length) {
      if (locked.length) drawAll(); /* the control springs back to what still plays */
      return { ok: false, locked: locked.length > 0 };
    }
    const one = list.length === 1 ? list[0] : null;
    const res = E().send({ type: "batch", label: label || (one ? `${labelOf(one[0])}: ${S().fix(one[0], one[1])} at moment ${row + 1}` : `${list.length} nodes at moment ${row + 1}`), commands: cmds });
    if (!res.ok) toast(res.error);
    return res;
  }
  /* Is this setting's lane locked on the timeline (🔒)? */
  function lockedHere(id, st) {
    const t = trackHas(id, st || (E() && E().state()));
    return !!(t && window.CurioLanes && window.CurioLanes.isLocked && window.CurioLanes.isLocked(t.id + "|" + id));
  }
  /* CapCut's section ◇: set a key at the playhead on every setting in ids that has none here, or, when they all
     have one, take them all off. One undo step; locked lanes (🔒) are skipped and the status says so. */
  function keyAll(ids) {
    const st = E() && E().state();
    const r = st && st.rows[row];
    if (!r || !S()) return;
    const list = ids.filter((id) => S().known(id));
    const locked = list.filter((id) => lockedHere(id, st));
    const free = list.filter((id) => !locked.includes(id));
    const lockSay = locked.length ? ` ${locked.length === 1 ? labelOf(locked[0]) + " is" : locked.length + " settings are"} locked (🔒 on the timeline), so ${locked.length === 1 ? "it was" : "they were"} left as they are.` : "";
    if (!free.length) return toast(`Every setting here is locked (🔒 on the timeline), so nothing was changed.`);
    const allHere = list.every((id) => keyState(id) === "here");
    if (allHere) {
      const cmds = free.map((id) => ({ type: "removePoint", row: r.id, track: trackHas(id, st).id, curiosity: id }));
      const res = E().send({ type: "batch", label: `Take the keys off ${cmds.length} settings at moment ${row + 1}`, commands: cmds });
      if (!res.ok) return toast(res.error);
      return toast(`Took the keys off ${cmds.length} settings at moment ${row + 1}.${lockSay}`);
    }
    const need = free.filter((id) => keyState(id) !== "here");
    if (!need.length) return toast(`Every setting that is not locked already has a key at moment ${row + 1}.${lockSay}`);
    /* The curiosity's own lane shows on the timeline; its other settings' keys go in its automation group, where
       the lane's ◇ keyframes show them (as a clip's keyframes show in CapCut). */
    need.forEach((id) => showLane(laneFor(id)));
    save();
    const res = setValues(need.map((id) => [id, valueHere(id)]), `Set a key on ${need.length} settings at moment ${row + 1}`);
    if (res && res.ok) toast(`Set a key on ${need.length} setting${need.length === 1 ? "" : "s"} at moment ${row + 1}.${lockSay}`);
    drawTimeline();
  }
  /* What the current value of a curiosity is at the playhead in my film. */
  function valueHere(id) {
    const st = E() && E().state();
    const r = st && st.rows[row];
    if (!r) return undefined;
    const t = trackHas(id, st);
    return t ? E().value(r.id, t.id, id) : S() ? S().start(id) : undefined;
  }
  /* Maya's channel box colors a channel by its keys; here: a key at this moment, a lane with keys elsewhere, or none. */
  function keyState(id) {
    const st = E() && E().state();
    const r = st && st.rows[row];
    if (!r) return "";
    const t = trackHas(id, st);
    const lane = t && st.lanes[t.id + "|" + id];
    if (!lane) return "";
    return lane.points[r.id] != null ? "here" : "lane";
  }
  const showLane = (id) => !prefs.lanes.includes(id) && prefs.lanes.push(id);
  /* The lane a ◇ puts on the timeline: a curiosity's own lane. A setting inside its window (curiosity.setting)
     keys into that lane's automation group, where the lane's ◇ keyframes show it, as a clip's keyframes show in
     CapCut; "+ lane" in the window still gives a setting a lane of its own. */
  const laneFor = (id) => {
    const top = String(id).split(".")[0];
    return top !== id && S() && S().known(top) ? top : id;
  };
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
    if (trPop && !e.target.closest(trPop === "more" ? ".sc-more" : ".sc-cap-set")) {
      trPop = null;
      page.querySelectorAll(".sc-trpop.open").forEach((m) => m.classList.remove("open"));
      page.querySelectorAll('[data-act="tr-more"], [data-act="cap-pop"]').forEach((b) => (b.setAttribute("aria-expanded", "false"), b.classList.remove("on")));
    }
    if (curMenu && !e.target.closest(".sc-cur-menu, [data-cur-menu]")) closeCurMenu();
    if (lookOpen && !e.target.closest(".sc-mlook")) closeLook();
    if (e.target.closest("[data-cmp-line]")) return;
    const t = e.target.closest("button, [data-scrub], .sc-frame");
    if (!t || !page.contains(t)) return;
    const d = t.dataset;
    if (d.fave) {
      /* The star only toggles the favorite: the click goes no further, so the card is not picked. */
      e.stopPropagation();
      return faveStar(d.fave);
    }
    if (d.curMenu) return openCurMenu(t);
    if (d.curApply) return closeCurMenu(), applyCur(d.curApply, d.cur);
    if (d.lookMenu != null) return toggleLook();
    if (d.look === "copy") return lookCopy();
    if (d.look === "paste") return lookPaste("here");
    if (d.look === "stretch") return lookPaste("stretch");
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
    if (d.keyAll) return keyAll(d.keyAll.split(","));
    if ("key" in d && d.key) {
      /* Maya's Set Key: keep the setting at this moment as a node; on a key already here, take it off. */
      const st = E() && E().state();
      const r = st && st.rows[row];
      if (!r) return;
      const t = trackHas(d.key, st);
      /* A lane locked on the timeline (🔒) keeps its nodes: the diamond can't set or take off a key there. */
      if (t && window.CurioLanes && window.CurioLanes.isLocked(t.id + "|" + d.key)) return toast(`${labelOf(d.key)} is locked on the timeline (🔒 by its name), so its keys stay as they are.`);
      if (keyState(d.key) === "here") E().send({ type: "removePoint", row: r.id, track: t.id, curiosity: d.key, label: `Take the key off ${labelOf(d.key)}` });
      else {
        showLane(laneFor(d.key));
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
      drawLibrary();
      /* Favorites shows both its sections at once, so a pill scrolls to its section. */
      const sec = prefs.libTab === "faves" && page.querySelector("#sc-" + d.group.replace(":", "-"));
      if (sec && sec.scrollIntoView) sec.scrollIntoView({ block: "start" });
      return;
    }
    if (d.pickCard) {
      const [level, id] = d.pickCard.split("|");
      return pickCard(level, id);
    }
    if (d.addCard) {
      const [level, id] = d.addCard.split("|");
      faveUse(level, id);
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
    if (act === "find") return toggleFind(true);
    if (act === "export") return toggleExport();
    if (act === "history") return toggleHistory(null, !e.detail);
    if (d.hist) return historyPick(d.hist);
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
    if (act === "compare") {
      setCompare({ on: !compareNow().on });
      drawViewers();
      const b = page.querySelector('[data-act="compare"]');
      return b && b.focus();
    }
    if (act === "captions") {
      setCaptions({ on: !captionsNow().on });
      drawViewers();
      const b = page.querySelector('[data-act="captions"]');
      return b && b.focus();
    }
    if (act === "tr-more") return toggleTrPop("more");
    if (act === "cap-pop") return toggleTrPop("cap");
    if (act === "guides-menu") {
      trPop = null;
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
    /* The database's pack names a proximity's links "p:<id>" ("p:<id>#2" for a suite's members) and a proximity
       suite "ps:<id>", so those are what `only` asks for (the bare id alone matched nothing). */
    const pack = seeds.dbPack();
    const id = prefs.sel.id;
    const only = prefs.sel.level === "proximitySuite" ? [id, "ps:" + id] : [id, "p:" + id].concat((pack.links || []).filter((l) => l && l.proximity === id).map((l) => l.id));
    const r = Eng.send({ type: "importLinks", pack, only, addLanes: true, label: "Add " + selection().label });
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
    if ("captionsMode" in d) {
      setCaptions({ mode: t.value, on: true });
      drawViewers();
      const box = page.querySelector("[data-captions-mode]");
      return box && box.focus();
    }
    if ("compareWith" in d) {
      setCompare({ with: t.value, on: true });
      drawViewers();
      const box = page.querySelector("[data-compare-with]");
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
      eachCharacter(t.value);
      return drawTimeline();
    }
    if (d.laneCur) return swapLane(d.laneCur, t.value, d.laneTrack || null);
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
  /* A graded lane that every character has on their own track (eyeline.speaking, blocking.seated...): adding it
     puts it on each character track that has room, as one undo step, so each character gets their own row. */
  function eachCharacter(key) {
    const CL = window.CurioLanes;
    if (!E() || !CL || !CL.partTrack || CL.partTrack(key) !== "character") return null;
    const st = E().state();
    const cmds = st.tracks.filter((t) => t.kind === "character" && !t.curiosities.includes(key) && t.curiosities.length < E().LIMIT.perTrack).map((t) => ({ type: "addCuriosity", track: t.id, curiosity: key }));
    if (!cmds.length) return null;
    const r = E().send({ type: "batch", label: `Add a lane for each character: ${labelOf(key)}`, commands: cmds });
    if (!r.ok) toast(r.error);
    else toast(`${labelOf(key)}: one lane for each character (${cmds.length}).`);
    return r;
  }
  /* A track's dropdown changes which curiosity it is. On a row of one track (several tracks carry the curiosity),
     only that track's lane changes. */
  function swapLane(oldCur, newCur, onTrack) {
    if (!newCur || oldCur === newCur) return;
    const Eng = E();
    const st = Eng.state();
    const cmds = [];
    const t = (onTrack && st.tracks.find((x) => x.id === onTrack && x.curiosities.includes(oldCur))) || st.tracks.find((x) => x.curiosities.includes(oldCur));
    const lane = t && st.lanes[t.id + "|" + oldCur];
    if (lane) {
      const same = onTrack && t.id === onTrack && (t.curiosities.includes(newCur) || t.curiosities.length < Eng.LIMIT.perTrack) ? t.id : null;
      let track = same || (st.tracks.find((x) => x.curiosities.includes(newCur)) || {}).id;
      if (same && !t.curiosities.includes(newCur)) cmds.push({ type: "addCuriosity", track, curiosity: newCur });
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
    /* The other tracks' rows of the old curiosity stay when only one track's row changed. */
    const others = onTrack && st.tracks.some((x) => x.id !== onTrack && x.curiosities.includes(oldCur));
    if (!others) prefs.lanes = prefs.lanes.filter((c) => c !== oldCur);
    if (!prefs.lanes.includes(newCur)) prefs.lanes.push(newCur);
    if (prefs.sel.level === "curiosity" && prefs.sel.id === oldCur) prefs.sel.id = newCur;
    save();
    if (cmds.length) {
      const r = Eng.send({ type: "batch", label: `Track ${labelOf(oldCur)}${onTrack && t ? " on " + (t.label || t.id) : ""} becomes ${labelOf(newCur)}`, commands: cmds });
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
    const start = k.dataset.val !== "" && isFinite(Number(k.dataset.val)) ? Number(k.dataset.val) : min;
    const y0 = e.clientY;
    let val = start;
    const move = (ev) => {
      const dv = Math.round(((y0 - ev.clientY) / 80) * (max - min) / step) * step;
      val = Math.max(min, Math.min(max, start + dv));
      const b = k.querySelector("b");
      if (b) b.textContent = val;
      const ln = k.querySelector("line");
      if (ln) ln.setAttribute("transform", `rotate(${-135 + (270 * (val - min)) / (max - min || 1)} 16 16)`);
      if (faces() && faces().live) faces().live(k, [[k.dataset.knob, val]], faceApi());
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
    const v = Math.max(Number(k.dataset.min), Math.min(Number(k.dataset.max), (k.dataset.val !== "" && isFinite(Number(k.dataset.val)) ? Number(k.dataset.val) : Number(k.dataset.min)) + dir * step));
    setValue(k.dataset.knob, v);
  }, true);

  /* ---------- Quick find (⌘K, Ctrl+K on Windows; the 🔍 in the top bar) ----------
     CapCut's search and an editing app's command palette in one box: type a few words and pick from
     Curiosities (with each one's short plain description), Suites, Actions (the Screen's own menus, toolbar
     buttons and shortcuts, each run through the same function or button) and Moments and markers (a marker by
     its note, or "moment 12"). Arrow keys and Enter pick, Esc closes. With nothing typed it shows the last 8
     picks, kept in localStorage "curiosities-screen-find-v1" as { recent: [ids] } (a view setting, never an
     undo step). While it is open every key stays in the box: inToolWindow says so, and the box stops each key
     from going on to the Screen's shortcuts. The matcher (FIND) is pure, so tests can check it with no page. */
  const FIND = (() => {
    const KEY = "curiosities-screen-find-v1";
    const MAX = 8;
    const GROUPS = [["cur", "Curiosities"], ["suite", "Suites"], ["act", "Actions"], ["moment", "Moments and markers"]];
    const LIMITS = { cur: 8, suite: 5, act: 8, moment: 8 };
    /* Lower case, accents off, anything but letters and digits as one space. */
    const norm = (s) =>
      String(s == null ? "" : s)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const split = (s) => (s ? s.split(" ") : []);
    /* How well a query fits: every word typed must be found, in any order. A word that starts a word of the
       label counts most (the first word most of all), then one found inside the label, then one that starts a
       word of the extra words (the description, the category), then one found inside them. 0: no match. */
    function score(query, label, extra) {
      const q = norm(query);
      if (!q) return 1;
      const l = norm(label);
      const x = norm(extra);
      const lw = split(l);
      const xw = split(x);
      const tight = l.replace(/ /g, "");
      let total = 0;
      for (const t of split(q)) {
        const i = lw.findIndex((w) => w.startsWith(t));
        let s = 0;
        if (i === 0) s = 5;
        else if (i > 0) s = 4;
        else if (l.includes(t) || tight.includes(t)) s = 2;
        else if (xw.some((w) => w.startsWith(t))) s = 1.5;
        else if (x.includes(t)) s = 0.5;
        else return 0;
        total += s;
      }
      if (l === q) total += 6;
      else if ((l + " ").startsWith(q + " ")) total += 3;
      else if (l.startsWith(q)) total += 1;
      return total;
    }
    /* items: [{ id, group, label, words, boost? }] -> [{ group, label, items, more }], each group best first (ties
       keep the given order), at most limits[group] shown, groups ordered by their best match. boost lifts an item
       that matches at all: your own marker notes beat a curiosity that matches the same word as well. */
    function rank(query, items, limits) {
      const lim = limits || LIMITS;
      const by = {};
      (items || []).forEach((it, i) => {
        const s = score(query, it.label, it.words) + (Number(it.boost) || 0);
        if (s > Number(it.boost || 0)) (by[it.group] = by[it.group] || []).push({ it, s, i });
      });
      return GROUPS.filter(([g]) => by[g])
        .map(([g, label], gi) => {
          const list = by[g].sort((a, b) => b.s - a.s || a.i - b.i);
          const n = lim[g] || 8;
          return { group: g, label, best: list[0].s, gi, items: list.slice(0, n).map((x) => x.it), more: Math.max(0, list.length - n) };
        })
        .sort((a, b) => b.best - a.best || a.gi - b.gi)
        .map(({ group, label, items, more }) => ({ group, label, items, more }));
    }
    /* The recent picks: newest first, no repeats, at most 8; junk dropped. */
    function clean(list) {
      const out = [];
      (Array.isArray(list) ? list : []).forEach((x) => typeof x === "string" && /^(cur|suite|act|moment):./.test(x) && !out.includes(x) && out.push(x));
      return out.slice(0, MAX);
    }
    const remember = (list, id) => clean([id].concat(clean(list).filter((x) => x !== id)));
    /* ⌘K on a Mac, Ctrl+K on Windows: no Shift, no Option/Alt (⇧⌥K adds a keyframe, plain K stops playing). */
    const isKey = (e) => !!e && !!(e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.code === "KeyK" || String(e.key || "").toLowerCase() === "k");
    return { KEY, MAX, GROUPS, LIMITS, norm, score, rank, clean, remember, isKey };
  })();
  let findOpen = false;
  let findRoot = null;
  let findItems = [];
  let findShown = [];
  let findActive = 0;
  let findBack = null;
  const findMac = () => {
    try {
      return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
    } catch (e) {
      return true;
    }
  };
  const findKeyName = () => (findMac() ? "⌘K" : "Ctrl+K");
  function findRecent() {
    try {
      return FIND.clean((JSON.parse(localStorage.getItem(FIND.KEY)) || {}).recent);
    } catch (e) {
      return [];
    }
  }
  function findRemember(id) {
    try {
      localStorage.setItem(FIND.KEY, JSON.stringify({ recent: FIND.remember(findRecent(), id) }));
    } catch (e) {}
  }
  /* Look through a curiosity or a suite from the box: the library moves to its category and group (so its card
     shows, picked), then the card's own pick runs (Details, the Player and the timeline follow, and the lane's
     folded group opens). */
  function findLook(level, id) {
    const it = L().get(level, id);
    if (!it) return toast("The database no longer has that.");
    prefs.search = "";
    prefs.libTab = "";
    if (isAdv(it)) {
      prefs.libTab = "advanced";
      prefs.groups.advanced = level === "curiosity" ? "adv:fcp" : "adv:" + level;
    } else {
      const cat = level === "curiosity" ? L().categoryOf(id) : (L().resolve(level, id).categories || [])[0];
      if (cat && L().CATEGORIES.some((c) => c.id === cat)) prefs.cat = cat;
      if (level !== "curiosity") prefs.groups[prefs.cat] = level;
      else if (it.workspace) prefs.groups[prefs.cat] = "ws:" + it.workspace;
    }
    pickCard(level, id);
    const card = page.querySelector(".sc-card.on");
    if (card && card.scrollIntoView) card.scrollIntoView({ block: "nearest" });
    toast(`Looking through ${it.label}${level === "suite" ? " (a suite)" : ""}. Details and the timeline show it${level === "suite" ? "; its + in the library puts it on the timeline" : ""}.`);
  }
  /* Press a button that is on the Screen right now, the way a click would. */
  function findPress(sel, why) {
    const b = page && page.querySelector(sel);
    if (b && !b.disabled && b.offsetParent !== null) return b.click();
    toast(why || "That button is not on the Screen right now.");
  }
  const findSay = (r) => r && (r.message || r.error) && toast(r.message || r.error);
  const noLanes = () => toast("The timeline is not ready yet.");
  /* Every action: the Screen's shortcuts first, by CapCut's names and their plain descriptions, then the menus
     and toolbar buttons that have no key. Each runs the same function the key, menu or button runs. */
  function findActions() {
    const out = [];
    const add = (id, label, sub, keys, run) => out.push({ id: "act:" + id, group: "act", label, sub, keys: keys || "", words: sub, run });
    SHORTCUTS.forEach(([, rows]) =>
      rows.forEach((r) => {
        if (!r[3] || !r[4] || r[1] === "Quick find" || r[0] === "← →") return;
        add("key:" + r[1], r[1], r[2], r[0], () => r[4]({ key: "", code: "", preventDefault() {} }));
      })
    );
    const playerHidden = "The Player is hidden; switch to the Screen view first.";
    add("prev-moment", "Previous moment", "Move the playhead one moment back", "←", () => setRow(row - 1));
    add("next-moment", "Next moment", "Move the playhead one moment on", "→", () => setRow(row + 1));
    add("export-menu", "Export ▾", "Open the Export menu: a storyboard sheet, a picture or a spreadsheet", "", () => toggleExport(true));
    add("export-sheet", "Export a storyboard sheet", "Every moment as a frame, with notes and what changes, ready to print", "", () => runExport("sheet"));
    add("export-png", "Export this frame as a PNG picture", "My film at the playhead as a picture file", "", () => runExport("png"));
    add("export-svg", "Export this frame as an SVG picture", "My film at the playhead, sharp at any size", "", () => runExport("svg"));
    add("export-csv", "Export the settings list (spreadsheet)", "One row per moment, one column per curiosity, as a CSV file", "", () => runExport("csv"));
    add("history", "History ▾", "Every change you can undo or redo; pick one to go back or forward to it", "", () => toggleHistory(true, true));
    add("guides-menu", "Guides ▾", "Lines over your film's picture to help you place things", "", () => ((guidesOpen = true), drawViewers()));
    GUIDES.forEach(([id, l, tip]) => {
      const on = guidesOn().includes(id);
      add("guide-" + id, `Guides: ${on ? "hide" : "show"} ${l.toLowerCase()}`, tip, "", () => (setGuide(id, !guidesOn().includes(id)), drawViewers()));
    });
    add("compare", compareNow().on ? "Compare ◐: turn off" : "Compare ◐: turn on", "Split your film's picture with a line you can drag: another picture on the left, your film on the right", "", () => (setCompare({ on: !compareNow().on }), drawViewers()));
    COMPARE_WITH.forEach(([id, l]) => add("compare-" + id, "Compare with: " + l, "Turns Compare on with this picture left of the line", "", () => (setCompare({ with: id, on: true }), drawViewers())));
    add("captions", captionsNow().on ? "Captions: turn off" : "Captions: turn on", "Your marker's note on this moment at the bottom of your film's picture, like subtitles", "", () => (setCaptions({ on: !captionsNow().on }), drawViewers()));
    CAPTION_MODES.forEach(([id, l]) => add("captions-" + id, "Captions: " + l.toLowerCase(), "Turns Captions on, showing this", "", () => (setCaptions({ mode: id, on: true }), drawViewers())));
    add("text-add", "Text: add words on the frame", "Words drawn on your film's picture at the playhead: a title, a name and job, a sign, a sound effect or a thought", "", () => txtAdd());
    add("look-menu", "Look ▾", "Copy every setting this moment plays, then paste that look onto another moment", "", () => (page.querySelector(".sc-mlook") ? lookOpen || toggleLook() : toast("Look ▾ is in Details while My film is picked in the Player.")));
    add("look-stretch", "Paste the look into the selected stretch", "The copied look held over the stretch selected on the timeline", "", () => lookPaste("stretch"));
    add("mark-turns", "Mark the turns", "A marker on every moment where the film turns: attention moves, the feeling changes, or a track jumps", "", () => (lanes ? findSay(lanes.markTurns()) : noLanes()));
    add("clear-auto", "Clear auto markers", "Take off only the markers Mark the turns put on; your own markers stay", "", () => (lanes ? findSay(lanes.clearAuto()) : noLanes()));
    add("markers", "Markers ▾", "The list of every marker; pick one to move the playhead there", "", () => (lanes ? lanes.markers() : noLanes()));
    add("attention", "Attention track", "Show or hide the band under the clips that shows where the audience's attention is", "", () => (lanes ? lanes.attention() : noLanes()));
    add("film-lines", "Film lines", "Show or hide the inspiration film's settings as a faint line in each lane", "", () => (lanes ? lanes.filmLines() : noLanes()));
    add("fold-all", "Fold every lane group", "Each category's lanes fold into one header row on the timeline", "", () => (lanes ? lanes.foldAll(true) : noLanes()));
    add("open-all", "Open every lane group", "Unfold every category's lanes on the timeline", "", () => (lanes ? lanes.foldAll(false) : noLanes()));
    LAYOUTS.forEach(([id, l, tip]) => add("layout-" + id, "Layout: " + l, tip, "", () => ((prefs.layout = id), save(), drawAll())));
    [["screen", "Screen view", "Library, player and details on top, the timeline under them"], ["arrange", "Arrange view", "Every automated curiosity as a track, left to right"]].forEach(([id, l, tip]) => add("view-" + id, l, tip, "", () => ((prefs.view = id), save(), drawAll())));
    [1, 2, 3].forEach((n) => add("wins-" + n, `${n} window${n === 1 ? "" : "s"} in the Player`, n === 1 ? "Only your film" : `${n - 1} inspiration film${n > 2 ? "s" : ""} and your film`, "", () => findPress(`.sc-wins-set [data-wins="${n}"]`, playerHidden)));
    add("add-insp", "Add an inspiration film", "Another viewer with a film to learn from", "", () => findPress('[data-act="add-insp"]', playerHidden));
    [["side", "Viewers side by side"], ["stack", "Viewers stacked"]].forEach(([id, l]) => add("arr-" + id, l, "How the Player's viewers sit", "", () => ((prefs.arrange = id), save(), drawAll())));
    [["highlight", "Lens: highlight", "Light up only what you are looking through"], ["overlay", "Lens: overlay", "Write its values on the picture"], ["only", "Lens: lens only", "Draw only what it is about"], ["off", "Lens: off", "The plain picture"]].forEach(([id, l, tip]) => add("lens-" + id, l, tip, "", () => ((prefs.lens = id), save(), drawBar(), drawViewers())));
    add("overview", "Whole-film strip", "Show or hide a frame for every moment under the viewers", "", () => ((prefs.overview = !prefs.overview), save(), drawViewers()));
    add("panels-reset", "Reset the panel sizes", "Put every panel back to its usual size and bring back any you folded away", "", () => window.CurioScreen.panels.reset());
    add("close", "Back to the app", "Leave the Screen", "", () => close());
    tplFindActions(add);
    rippleFindActions(add);
    myFindActions(add);
    /* The ⋯ menu of the curiosity you are looking through (Details): the same four ways, the same steps. */
    if (prefs.sel.level === "curiosity" && E() && S()) {
      const k = keyFor(prefs.sel.id);
      if (S().known(k)) {
        const name = labelOf(k);
        add("row-all", `${name}: use this setting all through the film`, "From the ⋯ menu in Details: the setting at the playhead from the first moment to the last", "", () => applyCur("all", k));
        if (curArea()) add("row-stretch", `${name}: use this setting in the selected stretch`, "From the ⋯ menu in Details: held over the stretch selected on the timeline", "", () => applyCur("stretch", k));
        add("row-reset", `${name}: reset to how the scene starts`, "From the ⋯ menu in Details: take off this lane's nodes after the first moment", "", () => applyCur("reset", k));
        add("row-clear", `${name}: clear this lane`, "From the ⋯ menu in Details: take every node off this lane", "", () => applyCur("clear", k));
      }
    }
    return out;
  }
  /* Every moment of My film, by its number, its marker's note and its label: a marker by its note, or "moment 12". */
  function findMoments() {
    const st = E() && E().state();
    if (!st) return [];
    const marks = exportMarkers();
    return st.rows.map((r, j) => {
      const m = marks[String(r.id)];
      const note = m && typeof m.note === "string" ? m.note.trim() : "";
      const lab = r.label && !/^moment \d+$/i.test(r.label) ? String(r.label) : "";
      const sub = m ? `${m.auto ? "Auto marker (Mark the turns)" : "Marker"}${m.color ? ", " + m.color : ""}${note && lab ? " · " + lab : ""}` : "Move the playhead here";
      return {
        id: "moment:" + r.id,
        group: "moment",
        label: `Moment ${j + 1}` + (note ? ": " + note : lab ? ": " + lab : ""),
        sub,
        words: [m ? "marker" : "", m && m.color, note && lab, tc(j)].filter(Boolean).join(" "),
        boost: note ? 1.5 : 0,
        run: () => {
          setRow(j);
          toast(`Playhead on moment ${j + 1}${note ? ": " + note : ""}.`);
        },
      };
    });
  }
  function findCatalog() {
    if (!L()) return [];
    const catLabel = (id) => (L().CATEGORIES.find((c) => c.id === id) || {}).label || "";
    const curs = L()
      .items("curiosity")
      .map((c) => {
        const cat = catLabel(L().categoryOf(c.id));
        return { id: "cur:" + c.id, group: "cur", label: c.label, sub: c.plain || "", tag: isAdv(c) ? "Advanced" : isMineIt(c.id) ? "Mine · " + cat : cat, words: [c.plain, cat, isAdv(c) ? "advanced final cut pro" : "", isMineIt(c.id) ? "mine made by me my own" : ""].join(" "), run: () => findLook("curiosity", c.id) };
      });
    const suites = L()
      .items("suite")
      .map((s) => {
        const names = [...new Set((s.members || []).filter((m) => m.curiosity).map((m) => labelOf(keyFor(m.curiosity))))];
        const sub = s.plain || `${(s.members || []).length} curiosities: ${names.slice(0, 4).join(", ")}`;
        return { id: "suite:" + s.id, group: "suite", label: s.label, sub, words: [sub, names.join(" "), catLabel((L().resolve("suite", s.id).categories || [])[0]), isMineIt(s.id) ? "mine made by me my own" : ""].join(" "), run: () => findLook("suite", s.id) };
      });
    return curs.concat(suites, findActions(), findMoments());
  }
  const FIND_KIND = { cur: "Curiosity", suite: "Suite", act: "Action", moment: "Moment" };
  /* With nothing typed: the recent picks, then a few to try. */
  const FIND_TRY = ["act:export-sheet", "act:guides-menu", "act:mark-turns", "act:history", "act:key:Shortcuts"];
  function findGroups(q) {
    if (FIND.norm(q)) return FIND.rank(q, findItems);
    const byId = new Map(findItems.map((it) => [it.id, it]));
    const recent = findRecent()
      .map((id) => byId.get(id))
      .filter(Boolean);
    const out = [];
    if (recent.length) out.push({ group: "recent", label: "Recent", items: recent, more: 0 });
    const tries = FIND_TRY.map((id) => byId.get(id)).filter((it) => it && !recent.includes(it));
    if (tries.length) out.push({ group: "try", label: recent.length ? "Try" : "Try one of these, or type a few words", items: tries, more: 0 });
    return out;
  }
  function drawFind() {
    if (!findRoot) return;
    const q = findRoot.querySelector(".sc-find-q").value;
    const groups = findGroups(q);
    findShown = [].concat(...groups.map((g) => g.items));
    findActive = Math.max(0, Math.min(findActive, findShown.length - 1));
    let i = 0;
    const opt = (g, it) => {
      const n = i++;
      const tag = g.group === "recent" || g.group === "try" ? FIND_KIND[it.group] : it.group === "cur" ? it.tag : "";
      return `<li role="option" id="sc-find-o-${n}" class="sc-find-o" data-find-i="${n}" data-find-id="${esc(it.id)}" aria-selected="false"><span class="sc-find-t"><b>${esc(it.label)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ""}</span>${tag ? `<em>${esc(tag)}</em>` : ""}${it.keys ? `<kbd>${esc(it.keys)}</kbd>` : ""}</li>`;
    };
    findRoot.querySelector(".sc-find-list").innerHTML = groups.length
      ? groups.map((g) => `<li class="sc-find-h" role="presentation"><span>${esc(g.label)}</span>${g.more ? `<small>${g.more} more: type another word to narrow it down</small>` : ""}</li>` + g.items.map((it) => opt(g, it)).join("")).join("")
      : `<li class="sc-find-none" role="presentation">Nothing matches “${esc(q.trim())}”. Try fewer letters or another word.</li>`;
    findMark();
  }
  /* Move the highlight without redrawing the list. */
  function findMark() {
    const input = findRoot.querySelector(".sc-find-q");
    findRoot.querySelectorAll(".sc-find-o").forEach((li) => {
      const on = Number(li.dataset.findI) === findActive;
      li.classList.toggle("on", on);
      li.setAttribute("aria-selected", String(on));
      if (on && li.scrollIntoView) li.scrollIntoView({ block: "nearest" });
    });
    if (findShown.length) input.setAttribute("aria-activedescendant", "sc-find-o-" + findActive);
    else input.removeAttribute("aria-activedescendant");
  }
  function findBuild() {
    findRoot = document.createElement("div");
    findRoot.className = "sc-find";
    findRoot.innerHTML = `<div class="sc-find-in" role="dialog" aria-modal="true" aria-label="Quick find">
      <input type="text" class="sc-find-q" role="combobox" aria-expanded="true" aria-controls="sc-find-list" aria-autocomplete="list" aria-label="Find a curiosity, a suite, an action or a marker" placeholder="Find a curiosity, a suite, an action or a marker…" autocomplete="off" spellcheck="false">
      <ul id="sc-find-list" class="sc-find-list" role="listbox" aria-label="What matches"></ul>
      <p class="sc-find-foot">↑ ↓ to move · Enter to pick · Esc to close · ${esc(findKeyName())} opens this anywhere on the Screen</p></div>`;
    const input = findRoot.querySelector(".sc-find-q");
    input.addEventListener("input", () => ((findActive = 0), drawFind()));
    findRoot.addEventListener("keydown", (e) => {
      /* No key typed here goes on to the Screen's shortcuts, the timeline or the app behind it. */
      e.stopPropagation();
      const n = findShown.length;
      if (e.key === "Escape") return e.preventDefault(), closeFind(true);
      if (e.key === "Enter") return e.preventDefault(), findRun(findActive);
      const dir = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey) ? 1 : e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey) ? -1 : 0;
      if (e.key === "Tab") e.preventDefault();
      if (!dir || !n) return;
      e.preventDefault();
      findActive = (findActive + dir + n) % n;
      findMark();
    });
    ["keyup", "keypress"].forEach((t) => findRoot.addEventListener(t, (e) => e.stopPropagation()));
    findRoot.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (!e.target.closest(".sc-find-in")) {
        e.preventDefault();
        closeFind(true);
      } else if (e.target !== input) e.preventDefault(); /* the typing stays in the box */
    });
    findRoot.addEventListener("click", (e) => {
      e.stopPropagation();
      const li = e.target.closest("[data-find-i]");
      if (li) findRun(Number(li.dataset.findI));
    });
    findRoot.addEventListener("mousemove", (e) => {
      const li = e.target.closest("[data-find-i]");
      if (li && Number(li.dataset.findI) !== findActive) {
        findActive = Number(li.dataset.findI);
        findMark();
      }
    });
  }
  function openFind() {
    if (!page || page.hidden || !L()) return;
    if (findOpen) return findRoot.querySelector(".sc-find-q").focus();
    findBack = document.activeElement;
    if (exportOpen) toggleExport(false);
    if (historyOpen) toggleHistory(false);
    closeLook();
    closeCurMenu();
    if (trMenuAt) trMenuClose();
    if (txtEditId) txtMenuClose();
    if (keysOpen) showKeys(false);
    if (!findRoot) findBuild();
    findItems = findCatalog();
    findOpen = true;
    findActive = 0;
    findRoot.querySelector(".sc-find-q").value = "";
    page.appendChild(findRoot);
    drawFind();
    findRoot.querySelector(".sc-find-q").focus();
    const b = page.querySelector('[data-act="find"]');
    if (b) b.setAttribute("aria-expanded", "true");
  }
  function closeFind(back) {
    if (!findOpen) return;
    findOpen = false;
    if (findRoot) findRoot.remove();
    const b = page && page.querySelector('[data-act="find"]');
    if (b) b.setAttribute("aria-expanded", "false");
    if (back) {
      const to = findBack && findBack.isConnected && findBack !== document.body ? findBack : b;
      if (to && to.focus) to.focus();
    }
    findBack = null;
  }
  function toggleFind(on) {
    if (on == null ? findOpen : !on) closeFind(true);
    else openFind();
  }
  /* Pick a result: the box closes first, so a menu the action opens can take the focus. */
  function findRun(i) {
    const it = findShown[i];
    if (!it) return;
    closeFind(false);
    findRemember(it.id);
    try {
      it.run();
    } catch (err) {
      toast("That did not work: " + (err && err.message ? err.message : err));
    }
  }
  /* ⌘K before the Screen's other keys, so it also works while typing in a box (but not in a tool window). */
  document.addEventListener(
    "keydown",
    (e) => {
      if (!page || page.hidden) return;
      /* While it is open, a key pressed with the focus outside the box (after a click on its edge, say) still
         belongs to it: Esc closes it, anything else goes back into the box and no further. */
      if (findOpen && findRoot && !findRoot.contains(e.target) && !FIND.isKey(e)) {
        e.stopPropagation();
        if (e.key === "Escape") return e.preventDefault(), closeFind(true);
        return findRoot.querySelector(".sc-find-q").focus();
      }
      if (!FIND.isKey(e)) return;
      if (!findOpen && inToolWindow(e)) return;
      e.preventDefault();
      e.stopPropagation();
      toggleFind();
    },
    true
  );
  window.CurioScreenFind = Object.assign({}, FIND, { open: () => openFind(), close: () => closeFind(true), isOpen: () => findOpen, items: () => findCatalog().map(({ id, group, label, sub, keys }) => ({ id, group, label, sub, keys: keys || "" })) });

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

  window.CurioScreen = { open, close, isOpen: () => !!(page && !page.hidden), openWin, wins: () => wins.map((w) => w.id), mountViewer, state: () => JSON.parse(JSON.stringify(prefs)), blendCommands, guides: { list: () => GUIDES.map(([id, label, tip]) => ({ id, label, tip })), on: guidesOn, spot: guideSpot }, compare: { list: () => COMPARE_WITH.map(([id, label]) => ({ id, label })), now: compareNow }, captions: { list: () => CAPTION_MODES.map(([id, label]) => ({ id, label })), now: captionsNow, caption: captionFor }, faves: { key: FAVE_KEY, max: RECENT_MAX, now: () => JSON.parse(JSON.stringify(faves)), items: (which) => faveItems(faves[which === "recent" ? "recent" : "faves"]).map((x) => faveRef(x.level, x.it.id)), toggle: faveToggle, used: faveUsed, clean: faveClean }, text: { key: TXT_KEY, styles: () => TEXT.STYLES.map(([id, label, tip]) => ({ id, label, tip })), now: () => txtData(), add: txtAdd, set: (id, patch) => txtSet(id, patch), move: txtMove, span: txtSpan, remove: txtDel, edit: (id) => (id ? txtMenuOpen(id) : txtMenuClose()), editing: () => txtEditId }, transitions: { key: TR_KEY, kinds: () => TRANSITIONS.KINDS.map(([id, label, tip]) => ({ id, label, tip })), now: () => TRANSITIONS.clean(trData()), at: trAt, set: trSet, all: trAll, preview: trPreview, playing: () => (trAnim ? { into: trAnim.into, kind: trAnim.kind, p: trAnim.p } : null) }, setRow, row: () => row, playing: () => !!timer, addPanel, removePanel, on: (fn) => (typeof fn === "function" && listeners.push(fn), () => listeners.splice(listeners.indexOf(fn) >>> 0, 1)) };
  /* My templates: list(), save(name, note), use(id, { at, stretch, analogy }), rename(id, name, note), remove(id),
     exportJson(ids?), importJson(text), stretch(on?) (the Stretch to the selected area tick), and as an analogy
     plan(id, picks?), preview(id) (the pop-up) and analogy(id, picks?). */
  window.CurioScreen.templates = TPL_API;
  /* Ripple: ripple("add" | "duplicate" | "delete", { a, b }?) adds a copy of the playhead's moment, duplicates or
     takes out moments (the selected stretch, else the playhead's moment), as one undo step. */
  window.CurioScreen.ripple = (kind, o) => ripple(kind, o);

  /* ---------- Panels you can resize and fold away, and undo for the Screen's own view ----------
     Jeremy, 2026-10-04: "Each window should be resizable. The main view window, the control window to its right,
     all borders should be draggable and resizable ... The user should be able to completely collapse any window,
     and then hovering the cursor over that spot should show the user they can drag that border out", and "UNDO -
     undo should be able to undo absolutely anything. Even dragging windows around."

     Borders (splitters). Every border between the Screen's panels can be dragged: the library | Player, Player |
     Details, the panels above | the timeline, the Player | the side panels column beside it (Momentum), the
     library's group list | its cards, and the top of the whole film strip. Focus one (Tab) and the arrow keys move
     it (Shift for bigger steps, Home and End for the smallest and biggest); Enter folds the panel away and brings
     it back; a double-click puts it back to its usual size. Dragging a border past half its panel's smallest size
     folds the panel away completely, and so does the small « on the border. A folded panel leaves a thin edge:
     hovering over it shows the resize cursor and a small triangle pointing the way to drag; dragging it out, or
     a click, brings the panel back. Sizes are kept in the Screen's view (curiosities-screen-v1, prefs.sizes:
     { lib, insp, tl, dock, side, ov } in pixels and shut: { panel: true } for folded ones). Phones and narrow
     windows stack the panels and scroll, so the borders are only on screens wider than 860px.

     Undo for the view (VU). The film, transitions and words on the frame were already on the app-wide undo list
     (engine/store.js); the Screen's own view was not. Now each change you make to it is one step on the same list,
     with a plain name: panel sizes and folds, the ⧉ windows (open, close, move, resize), the Player's layout
     (1 2 3 windows, Side or Stack, the inspiration films and what you take from them, Guides, Compare and where
     its line is, Captions, Ghosts, the lens, the speed, the play range, rulers, the whole film strip), the layout
     menu, Screen or Arrange, which lanes show, and the timeline's own view (zoom, lane height, folded groups,
     markers, locks, Magnet, Snapping, Linkage, Film lines, the Attention track, the Select and Split tools).
     How: the view is read before each gesture (a press of the mouse or a key, a wheel turn) and again just after
     it ends; what changed becomes one step, so a whole drag is one step, not one per pixel. A gesture that also
     changed the film (an engine or store step: a ripple, a node, a template) is left to that step, so one undo
     never takes back half of something; a gesture that only moved around (picked a card, a category, a lane) is
     not a step either. Not steps: the playhead and playing, which card or category is picked, the library
     search, scrolling, and momentary things (menus, Quick find, the shortcuts sheet). Two key presses on the same
     border less than 1.5 seconds apart join one step. CurioScreenPanels holds the pure part, for tests. */
  const SPLIT = (() => {
    const PANES = {
      lib: { axis: "x", min: 200, max: 1400, name: "the library" },
      insp: { axis: "x", min: 220, max: 1400, name: "Details" },
      tl: { axis: "y", min: 110, max: 3000, name: "the timeline" },
      dock: { axis: "x", min: 150, max: 900, name: "the side panels beside the Player" },
      side: { axis: "x", min: 84, max: 420, name: "the library's group list" },
      ov: { axis: "y", min: 24, max: 160, name: "the whole film strip" },
    };
    const KEYS = Object.keys(PANES);
    const num = (v) => (typeof v === "number" && isFinite(v) ? Math.round(Math.max(0, Math.min(4000, v))) : null);
    /* A saved sizes object, checked: pixel sizes only where they are numbers, folds only for panels that fold. */
    function clean(raw) {
      const o = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      const out = { shut: {} };
      KEYS.forEach((k) => {
        const v = num(o[k]);
        if (v != null) out[k] = v;
        if (k !== "ov" && o.shut && typeof o.shut === "object" && o.shut[k] === true) out.shut[k] = true;
      });
      return out;
    }
    /* Where a drag lands: under half the smallest size the panel folds away (when it can), else it stays between
       its smallest and biggest size. */
    function settle(px, min, max, foldable) {
      if (foldable && px < min / 2) return { size: 0, shut: true };
      return { size: Math.round(Math.max(min, Math.min(Math.max(min, max), px))), shut: false };
    }
    /* The grid's columns and rows for the sizes you set (null where the stylesheet's own sizes are kept).
       layout: center | media | details | right; view: screen | arrange; open: the panels' sizes clamped to fit. */
    function templates(s, layout, view, fit, playerShown) {
      s = clean(s);
      const px = (k, d) => (s.shut[k] ? "0px" : s[k] != null ? Math.round(fit ? fit(k, s[k]) : s[k]) + "px" : d);
      let cols = null;
      let rows = null;
      const xSet = (k) => s[k] != null || !!s.shut[k];
      if (view === "arrange") {
        if (xSet("insp")) cols = `minmax(0, 1fr) ${px("insp", "minmax(280px, 340px)")}`;
        if (playerShown && xSet("tl")) rows = `minmax(0, 1fr) ${px("tl")}`;
        return { cols, rows };
      }
      const right = layout === "right";
      if (xSet("lib") || xSet("insp")) {
        const lib = px("lib", right ? "minmax(280px, 1.1fr)" : "minmax(280px, 0.95fr)");
        const insp = px("insp", right ? "minmax(260px, 0.8fr)" : "minmax(280px, 0.8fr)");
        cols = right ? `${lib} ${insp} minmax(0, 1.2fr)` : `${lib} minmax(0, 1.35fr) ${insp}`;
      }
      if (xSet("tl")) rows = `minmax(0, 1fr) ${px("tl")}`;
      return { cols, rows };
    }
    /* Which borders the layout has: [{ id, edge }], edge being the side of that panel the border runs along. */
    function borders(layout, view, has) {
      has = has || {};
      const out = [];
      if (view === "arrange") {
        out.push({ id: "insp", edge: "left" });
        if (has.player) out.push({ id: "tl", edge: "top" });
      } else {
        out.push({ id: "lib", edge: "right" });
        out.push({ id: "insp", edge: layout === "right" ? "right" : "left" });
        out.push({ id: "tl", edge: "top" });
      }
      if (has.side) out.push({ id: "side", edge: "right" });
      if (has.dock) out.push({ id: "dock", edge: "left" });
      if (has.ov) out.push({ id: "ov", edge: "top" });
      return out;
    }
    /* A drag towards the right (or down) makes a panel bigger when the border is on its right (or bottom) edge. */
    const grows = (edge) => (edge === "right" || edge === "bottom" ? 1 : -1);
    function sizesLabel(b, a, hint) {
      b = clean(b);
      a = clean(a);
      const changed = KEYS.filter((k) => b[k] !== a[k] || !!b.shut[k] !== !!a.shut[k]);
      if (!changed.length) return "";
      if (changed.length > 1 && changed.every((k) => a[k] == null && !a.shut[k])) return "Reset the panel sizes";
      const k = changed.find((x) => !!b.shut[x] !== !!a.shut[x]) || (hint && changed.includes(hint) ? hint : changed.find((x) => b[x] != null) || changed[0]);
      const name = PANES[k].name;
      if (!b.shut[k] && a.shut[k]) return "Collapse " + name;
      if (b.shut[k] && !a.shut[k]) return "Bring back " + name;
      if (a[k] == null) return "Reset the size of " + name;
      return "Resize " + name;
    }
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const onOff = (v, what) => `Turn ${what} ${v ? "on" : "off"}`;
    const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    /* The ⧉ windows: [{ id, x, y, w, h }] before and after. */
    function winsLabel(b, a, name) {
      name = name || ((id) => id);
      const ids = (l) => l.map((w) => w.id);
      const opened = a.filter((w) => !ids(b).includes(w.id));
      const closed = b.filter((w) => !ids(a).includes(w.id));
      if (opened.length) return `Open the ${name(opened[0].id)} window`;
      if (closed.length) return `Close the ${name(closed[0].id)} window`;
      const moved = a.find((w) => { const o = b.find((x) => x.id === w.id); return o && (o.x !== w.x || o.y !== w.y); });
      const sized = a.find((w) => { const o = b.find((x) => x.id === w.id); return o && (o.w !== w.w || o.h !== w.h); });
      if (sized) return `Resize the ${name(sized.id)} window`;
      if (moved) return `Move the ${name(moved.id)} window`;
      return "";
    }
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    /* The view's plain name for one step. d = { prefs: { key: [before, after] }, tools: { key: [b, a] }, wins: [b, a],
       hint }; names: { layout(id), guide(id), caption(id), compare(id), cat(id), win(id), lens(id) } (ids when left out). */
    function viewLabel(d, names) {
      const n = Object.assign({ layout: (x) => x, guide: (x) => x, caption: (x) => x, compare: (x) => x, cat: (x) => x, win: (x) => x, lens: (x) => x }, names || {});
      const P = (d && d.prefs) || {};
      const T = (d && d.tools) || {};
      const out = [];
      const add = (s) => s && out.push(s);
      if (P.sizes) add(sizesLabel(P.sizes[0], P.sizes[1], d.hint));
      if (d && d.wins) add(winsLabel(d.wins[0], d.wins[1], n.win));
      if (P.layout) add(`Layout: ${n.layout(P.layout[1])}`);
      if (P.view) add(P.view[1] === "arrange" ? "Open Arrange" : "Back to the Screen's panels");
      if (P.insp) {
        const [b, a] = P.insp.map((x) => (Array.isArray(x) ? x : []));
        if (a.length !== b.length) add(a.length === b.length + 1 ? "Add an inspiration film" : a.length === b.length - 1 ? "Remove an inspiration film" : a.length ? `Show ${a.length + 1} windows in the Player` : "Show only my film in the Player");
        else if (a.some((v, i) => (v && v.film) !== (b[i] && b[i].film))) add("Change the inspiration film");
        else if (!same(a.map((v) => v && v.takes), b.map((v) => v && v.takes))) add("Change what I take from an inspiration film");
        else add("Change the viewers");
      }
      if (P.arrange) add(P.arrange[1] === "stack" ? "Stack the viewers" : "Put the viewers side by side");
      if (P.lens) add(`Lens: ${n.lens(P.lens[1])}`);
      if (P.ghost) add(onOff(P.ghost[1], "Ghosts"));
      if (P.speed) add(`Play speed ${P.speed[1]}×`);
      if (P.playerZoom) add(Number(P.playerZoom[1]) === 1 ? "Reset the Player's zoom" : Number(P.playerZoom[1]) > Number(P.playerZoom[0]) ? "Zoom in on the Player" : "Zoom out of the Player");
      if (P.rulers) add(P.rulers[1] ? "Show the rulers" : "Hide the rulers");
      if (P.overview) add(P.overview[1] ? "Bring back the whole film strip" : "Collapse the whole film strip");
      if (P.range) add(P.range[1] ? `Play moments ${P.range[1][0] + 1} to ${P.range[1][1] + 1}` : "Play the whole film");
      if (P.guides) {
        const [b, a] = P.guides.map((x) => (Array.isArray(x) ? x : []));
        const on = a.filter((x) => !b.includes(x));
        const off = b.filter((x) => !a.includes(x));
        add(on.length === 1 && !off.length ? `Show the ${n.guide(on[0])} guide` : off.length === 1 && !on.length ? `Hide the ${n.guide(off[0])} guide` : a.length ? "Change the guides" : "Hide the guides");
      }
      if (P.compare) {
        const [b, a] = P.compare.map((x) => x || {});
        add(!!a.on !== !!b.on ? onOff(a.on, "Compare") : a.with !== b.with ? `Compare with ${n.compare(a.with)}` : "Move the Compare line");
      }
      if (P.captions) {
        const [b, a] = P.captions.map((x) => x || {});
        add(!!a.on !== !!b.on ? onOff(a.on, "captions") : `Captions show ${n.caption(a.mode)}`);
      }
      if (P.lanes) {
        const [b, a] = P.lanes.map((x) => (Array.isArray(x) ? x : []));
        add(a.length > b.length ? "Show a lane on the timeline" : a.length < b.length ? "Take a lane off the timeline" : "Reorder the lanes");
      }
      if (P.showAll) add(P.showAll[1] ? "Show all potential curiosities" : "Hide the potential curiosities");
      if (P.showSuites) add(P.showSuites[1] ? "Show all potential curiosity suites" : "Hide the potential curiosity suites");
      if (P.viewersInArrange) add(P.viewersInArrange[1] ? "Show the viewers in Arrange" : "Hide the viewers in Arrange");
      if (T.zoom) add(Number(T.zoom[1]) > Number(T.zoom[0] || 1) ? "Zoom in on the timeline" : "Zoom out of the timeline");
      if (T.laneH) add(Number(T.laneH[1]) > Number(T.laneH[0] || 0) ? "Make the lanes taller" : "Make the lanes shorter");
      if (T.folds) {
        const [b, a] = T.folds.map((x) => (x && typeof x === "object" ? x : {}));
        const shut = Object.keys(a).filter((k) => a[k] && !b[k]);
        const open = Object.keys(b).filter((k) => b[k] && !a[k]);
        add(shut.length > 1 ? "Fold every lane group" : open.length > 1 ? "Open every lane group" : shut.length ? `Fold the ${n.cat(shut[0])} lanes` : open.length ? `Open the ${n.cat(open[0])} lanes` : "");
      }
      if (T.markers) {
        const [b, a] = T.markers.map((x) => (Array.isArray(x) ? x : []));
        const auto = (l) => l.filter((m) => m && m.auto).length;
        add(auto(a) !== auto(b) && a.length - auto(a) === b.length - auto(b) ? (auto(a) > auto(b) ? "Add markers where the film turns" : "Take off the automatic markers") : a.length > b.length ? (a.length === b.length + 1 ? "Add a marker" : "Add markers") : a.length < b.length ? (a.length === b.length - 1 ? "Remove a marker" : "Remove markers") : "Change a marker");
      }
      if (T.locks) {
        const cnt = (x) => Object.keys(x && typeof x === "object" ? x : {}).filter((k) => x[k]).length;
        add(cnt(T.locks[1]) > cnt(T.locks[0]) ? "Lock a lane" : "Unlock a lane");
      }
      const BOOL = { magnet: "the magnet", snap: "snapping", linkage: "linkage", skim: "the preview axis", attention: "the Attention track", filmLines: "film lines" };
      Object.keys(BOOL).forEach((k) => T[k] && add(onOff(T[k][1] !== false && T[k][1] != null ? true : false, BOOL[k])));
      if (T.tool) add(T.tool[1] === "split" ? "Use the Split tool" : "Use the Select tool");
      if (T.linkKinds || T.linkDelete) add("Change the linkage settings");
      if (!out.length && Object.keys(T).length) add("Change the timeline's view");
      if (!out.length) return "Change the view";
      return out.length === 1 ? cap(out[0]) : `${cap(out[0])} (and ${plural(out.length - 1, "more change", "more changes")})`;
    }
    return { PANES, KEYS, clean, settle, templates, borders, grows, sizesLabel, winsLabel, viewLabel };
  })();
  window.CurioScreenPanels = SPLIT;

  /* splitter(el, o): makes el a border that can be dragged with the pointer or moved with the keyboard (focus it,
     then the arrow keys). Reusable: window.CurioScreen.splitter(el, o), so the Viewer's panels can have the same
     borders. It brings its own small stylesheet (#sc-split-css).
     o = {
       axis: "x" (a border between left and right, dragged sideways) or "y" (between top and bottom),
       grow: 1 when dragging right or down makes the panel bigger, -1 when left or up does,
       size() -> the panel's open size in px (kept while it is folded), min() and max() -> px,
       foldable: true when it can fold away (dragging past half the smallest size, Enter, or its « button),
       folded() -> true while folded away,
       set(px, folded, phase): phase is "move" while dragging, "end" when let go, "key" for a key, "fold" for a fold,
       reset(): a double-click, back to its usual size; name: "the library", for the tooltip and screen readers;
       step (default 10px), bigStep (default 60px with Shift) }
     -> { update(), destroy() }. update() refreshes the triangles (which way it can go) and the screen-reader values.
     While folded, the border is a thin edge: hovering shows the resize cursor and the triangle pointing the way to
     drag it out; a click or a drag brings the panel back. */
  function splitter(el, o) {
    if (!el || !o) return null;
    splitCss();
    const x = o.axis !== "y";
    const grow = o.grow === -1 ? -1 : 1;
    const name = o.name || "this panel";
    const step = o.step || 10;
    const big = o.bigStep || 60;
    const folded = () => !!(o.foldable && o.folded && o.folded());
    el.classList.add("sc-split");
    el.dataset.axis = x ? "x" : "y";
    el.setAttribute("role", "separator");
    el.setAttribute("aria-orientation", x ? "vertical" : "horizontal");
    if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
    const A = x ? "◂" : "▴";
    const B = x ? "▸" : "▾";
    el.innerHTML = `<i class="sc-split-line" aria-hidden="true"></i><span class="sc-split-tri" aria-hidden="true"><b class="a">${A}</b><b class="b">${B}</b></span>${o.foldable ? `<button type="button" class="sc-split-fold" tabindex="-1">${grow > 0 ? "«" : "»"}</button>` : ""}`;
    const fold = el.querySelector(".sc-split-fold");
    function update() {
      const f = folded();
      const s = f ? 0 : o.size();
      const max = o.max();
      const canGrow = s < max - 1;
      const canShrink = !f && (o.foldable || s > o.min() + 1);
      /* a = left or up, b = right or down. */
      const showA = grow > 0 ? canShrink : canGrow;
      const showB = grow > 0 ? canGrow : canShrink;
      el.classList.toggle("folded", f);
      el.classList.toggle("no-a", !showA);
      el.classList.toggle("no-b", !showB);
      el.setAttribute("aria-valuemin", "0");
      el.setAttribute("aria-valuemax", String(Math.round(max)));
      el.setAttribute("aria-valuenow", String(Math.round(s)));
      const way = x ? (grow > 0 ? "right" : "left") : grow > 0 ? "down" : "up";
      const tip = f ? `${cap(name)} is folded away. Drag ${way}, or click, to bring it back.` : `Drag to resize ${name}. Arrow keys work too.${o.foldable ? " Enter folds it away." : ""} Double-click for its usual size.`;
      el.title = tip;
      el.setAttribute("aria-label", f ? `Bring back ${name}` : `Resize ${name}`);
      if (fold) {
        fold.title = `Collapse ${name}`;
        fold.setAttribute("aria-label", `Collapse ${name}`);
      }
    }
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    /* from: the size the drag started at, kept as the size the panel comes back at if this folds it. */
    function land(px, phase, from) {
      const r = SPLIT.settle(px, o.min(), o.max(), !!o.foldable);
      o.set(r.shut ? from || o.size() : r.size, r.shut, phase);
      update();
    }
    function toggle() {
      if (!o.foldable) return;
      if (folded()) o.set(Math.max(o.min(), Math.min(o.max(), o.size() || o.min())), false, "fold");
      else o.set(o.size(), true, "fold");
      update();
    }
    let drag = null;
    function down(e) {
      if (e.button !== 0 || (fold && e.target === fold)) return;
      e.preventDefault();
      e.stopPropagation();
      const f = folded();
      drag = { at: x ? e.clientX : e.clientY, s0: f ? 0 : o.size(), f, moved: false, id: e.pointerId };
      try {
        el.setPointerCapture(e.pointerId);
      } catch (err) {}
      el.classList.add("drag");
      document.documentElement.dataset.scSplitting = x ? "x" : "y";
    }
    function move(e) {
      if (!drag) {
        /* The triangles follow the pointer along the border. */
        const r = el.getBoundingClientRect();
        const along = x ? e.clientY - r.top : e.clientX - r.left;
        const len = x ? r.height : r.width;
        el.style.setProperty("--at", Math.max(14, Math.min(len - 14, along)) + "px");
        return;
      }
      const d = ((x ? e.clientX : e.clientY) - drag.at) * grow;
      if (!drag.moved && Math.abs(d) < 3) return;
      drag.moved = true;
      land(drag.s0 + d, "move", drag.s0);
    }
    function end(e, cancel) {
      if (!drag) return;
      const g = drag;
      drag = null;
      el.classList.remove("drag");
      delete document.documentElement.dataset.scSplitting;
      try {
        el.releasePointerCapture(g.id);
      } catch (err) {}
      if (cancel) {
        o.set(g.f ? o.size() : g.s0, g.f, "end");
        return update();
      }
      if (!g.moved) {
        if (g.f) toggle();
        return;
      }
      land(g.s0 + ((x ? e.clientX : e.clientY) - g.at) * grow, "end", g.s0);
    }
    function key(e) {
      if (e.target !== el || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      const toB = x ? k === "ArrowRight" : k === "ArrowDown";
      const toA = x ? k === "ArrowLeft" : k === "ArrowUp";
      if (k === "Escape" && drag) return e.preventDefault(), e.stopPropagation(), end(null, true);
      if (k === "Enter") {
        if (!o.foldable) return;
        e.preventDefault();
        e.stopPropagation();
        return toggle();
      }
      if (!toA && !toB && k !== "Home" && k !== "End") return;
      e.preventDefault();
      e.stopPropagation();
      if (k === "Home") return land(o.min(), "key");
      if (k === "End") return land(o.max(), "key");
      const d = (toB ? 1 : -1) * grow * (e.shiftKey ? big : step);
      /* From folded, a press the right way opens it at its smallest size; the other way does nothing. */
      if (folded()) return d > 0 ? land(Math.max(o.min(), o.size() > 0 ? Math.min(o.size(), o.min()) : o.min()), "key") : undefined;
      const next = o.size() + d;
      /* Keys stop at the smallest size; only Enter or « folds, so holding a key down never folds by surprise. */
      land(Math.max(o.min(), next), "key");
    }
    const dbl = (e) => {
      if (fold && e.target === fold) return;
      e.preventDefault();
      if (o.reset) o.reset();
      update();
    };
    const foldClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    };
    const up = (e) => end(e, false);
    const cancel = (e) => end(e, true);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);
    el.addEventListener("lostpointercapture", up);
    el.addEventListener("keydown", key);
    el.addEventListener("dblclick", dbl);
    if (fold) fold.addEventListener("click", foldClick);
    update();
    return {
      update,
      destroy() {
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", cancel);
        el.removeEventListener("lostpointercapture", up);
        el.removeEventListener("keydown", key);
        el.removeEventListener("dblclick", dbl);
        if (fold) fold.removeEventListener("click", foldClick);
      },
    };
  }
  /* The splitter's own look, so it works on any page that calls it (the Screen places its borders in screen.css). */
  function splitCss() {
    if (typeof document === "undefined" || !document.head || document.getElementById("sc-split-css")) return;
    const st = document.createElement("style");
    st.id = "sc-split-css";
    st.textContent = `.sc-split { position: absolute; z-index: 5; box-sizing: border-box; touch-action: none; outline: none; --at: 50%; }
.sc-split[data-axis="x"] { width: 10px; cursor: col-resize; }
.sc-split[data-axis="y"] { height: 10px; cursor: row-resize; }
.sc-split-line { position: absolute; pointer-events: none; background: #22d3ee; opacity: 0; transition: opacity 0.12s; }
.sc-split[data-axis="x"] .sc-split-line { top: 0; bottom: 0; left: 4px; width: 2px; }
.sc-split[data-axis="y"] .sc-split-line { left: 0; right: 0; top: 4px; height: 2px; }
.sc-split:hover .sc-split-line, .sc-split:focus-visible .sc-split-line, .sc-split.drag .sc-split-line { opacity: 1; }
.sc-split-tri { position: absolute; display: flex; gap: 6px; pointer-events: none; opacity: 0; transition: opacity 0.12s; color: #22d3ee; font: 700 13px/1 system-ui, sans-serif; text-shadow: 0 0 3px #000, 0 0 2px #000; }
.sc-split[data-axis="x"] .sc-split-tri { top: var(--at); left: 50%; transform: translate(-50%, -50%); flex-direction: row; }
.sc-split[data-axis="y"] .sc-split-tri { left: var(--at); top: 50%; transform: translate(-50%, -50%); flex-direction: column; gap: 4px; }
.sc-split-tri b { display: block; }
.sc-split.no-a .sc-split-tri .a, .sc-split.no-b .sc-split-tri .b { visibility: hidden; }
.sc-split:hover .sc-split-tri, .sc-split:focus-visible .sc-split-tri, .sc-split.drag .sc-split-tri { opacity: 1; }
.sc-split-fold { position: absolute; display: none; z-index: 1; width: 18px; height: 18px; padding: 0 !important; border: 1px solid #22d3ee !important; border-radius: 50% !important; background: #1c1c1e !important; color: #22d3ee !important; font: 700 11px/16px system-ui, sans-serif !important; cursor: pointer; }
.sc-split[data-axis="x"] .sc-split-fold { top: 10px; left: 50%; transform: translateX(-50%); }
.sc-split[data-axis="y"] .sc-split-fold { left: 10px; top: 50%; transform: translateY(-50%) rotate(90deg); }
.sc-split:hover .sc-split-fold, .sc-split:focus-visible .sc-split-fold { display: block; }
.sc-split.folded .sc-split-fold { display: none; }
.sc-split.folded .sc-split-line { opacity: 0.55; background: #6b6b74; }
.sc-split.folded:hover .sc-split-line, .sc-split.folded:focus-visible .sc-split-line { opacity: 1; background: #22d3ee; }
.sc-split.folded[data-axis="x"] .sc-split-line { left: 3px; width: 4px; border-radius: 2px; }
.sc-split.folded[data-axis="y"] .sc-split-line { top: 3px; height: 4px; border-radius: 2px; }
html[data-sc-splitting="x"], html[data-sc-splitting="x"] * { cursor: col-resize !important; user-select: none !important; }
html[data-sc-splitting="y"], html[data-sc-splitting="y"] * { cursor: row-resize !important; user-select: none !important; }`;
    document.head.appendChild(st);
  }

  /* ---- The Screen's own borders ---- */
  const PLAYER_MIN_W = 240;
  const PLAYER_MIN_H = 140;
  const wide = () => (window.innerWidth || 1024) > 860;
  const sizesNow = () => SPLIT.clean(prefs.sizes);
  const splits = {}; /* id -> { el, ctl, edge } */
  let splitsHint = "";
  function paneEl(id) {
    if (!page) return null;
    return page.querySelector({ lib: ".sc-lib", insp: ".sc-inspector", tl: ".sc-timeline", dock: ".sc-player > .sc-docks", side: ".sc-lib .sc-side", ov: ".sc-player > .sc-overview" }[id]);
  }
  /* What a panel measures now (its open size even while folded: the size it comes back at). */
  function paneSize(id) {
    const s = sizesNow();
    if (id === "ov") return s.ov != null ? s.ov : 46;
    if (s[id] != null) return s[id];
    const el = paneEl(id);
    if (!el) return SPLIT.PANES[id].min;
    const r = el.getBoundingClientRect();
    const v = SPLIT.PANES[id].axis === "x" ? r.width : r.height;
    return v > 1 ? Math.round(v) : Math.round(SPLIT.PANES[id].min * 1.4);
  }
  function mainBox() {
    const m = page && page.querySelector(".sc-main");
    return m ? m.getBoundingClientRect() : { width: 1200, height: 700 };
  }
  /* The biggest a panel can be while the Player keeps room (and the timeline keeps its own). */
  function paneMax(id) {
    const P = SPLIT.PANES[id];
    const mb = mainBox();
    const s = sizesNow();
    const w = (k) => (s.shut[k] ? 0 : paneSize(k));
    if (id === "lib" || id === "insp") {
      const other = prefs.view === "arrange" ? 0 : w(id === "lib" ? "insp" : "lib");
      return Math.max(P.min, Math.min(P.max, mb.width - 24 - other - PLAYER_MIN_W));
    }
    if (id === "tl") return Math.max(P.min, Math.min(P.max, mb.height - 18 - PLAYER_MIN_H));
    if (id === "dock") {
      const pl = page.querySelector(".sc-player");
      return Math.max(P.min, Math.min(P.max, (pl ? pl.getBoundingClientRect().width : 600) - PLAYER_MIN_W));
    }
    if (id === "side") {
      const lib = paneEl("lib");
      return Math.max(P.min, Math.min(P.max, (lib ? lib.getBoundingClientRect().width : 300) - 120));
    }
    return P.max;
  }
  function paneFolded(id) {
    if (id === "ov") return !prefs.overview;
    return !!sizesNow().shut[id];
  }
  /* A border moved: keep the new size (folded or not) in the view, and redraw just the sizes. */
  function paneSet(id, px, shut, phase) {
    const s = sizesNow();
    /* The first time a side column is set, the other one keeps the width it has now, so only this border moves. */
    if ((id === "lib" || id === "insp") && prefs.view === "screen") {
      const other = id === "lib" ? "insp" : "lib";
      if (s[other] == null && !s.shut[other]) s[other] = paneSize(other);
    }
    if (id === "ov") {
      if (shut) prefs.overview = false;
      else {
        if (!prefs.overview) prefs.overview = true;
        s.ov = Math.round(px);
      }
    } else if (shut) {
      /* Folded, it keeps the size it comes back at: the one it had before this drag. */
      s[id] = px > 0 ? Math.round(px) : s[id] != null ? s[id] : paneSize(id);
      s.shut[id] = true;
    } else {
      s[id] = Math.round(px);
      delete s.shut[id];
    }
    prefs.sizes = s;
    splitsHint = id;
    save();
    /* The strip folds and comes back by redrawing it (its "▸ Whole film" header stays as the thin edge). */
    if (id === "ov" && !!page.querySelector(".sc-ov-strip") !== !!prefs.overview) drawViewers();
    sizesApply();
    if (phase !== "move") vuSoon(0);
  }
  function paneReset(id) {
    const s = sizesNow();
    delete s[id];
    delete s.shut[id];
    if (id === "ov" && !prefs.overview) prefs.overview = true;
    prefs.sizes = s;
    splitsHint = id;
    save();
    if (id === "ov") drawViewers();
    sizesApply();
    vuSoon(0);
  }
  /* Put the sizes on the grid. Called after every redraw, a border drag, a window resize and an undo. */
  let sizesRaf = 0;
  function sizesApply() {
    if (!page) return;
    const main = page.querySelector(".sc-main");
    if (!main) return;
    const s = sizesNow();
    const player = page.querySelector(".sc-player");
    const fit = (k, v) => Math.max(SPLIT.PANES[k].min, Math.min(paneMax(k), v));
    const t = SPLIT.templates(s, page.dataset.layout, prefs.view, wide() ? fit : null, !!(player && !player.hidden));
    const set = (attr, prop, v) => {
      if (v) {
        main.setAttribute(attr, "");
        main.style.setProperty(prop, v);
      } else {
        main.removeAttribute(attr);
        main.style.removeProperty(prop);
      }
    };
    set("data-cols", "--sc-cols", t.cols);
    set("data-rows", "--sc-rows", t.rows);
    ["lib", "insp", "tl"].forEach((k) => {
      const el = paneEl(k);
      if (el) el.classList.toggle("sc-shut", !!s.shut[k] && (k !== "lib" || prefs.view === "screen") && (k !== "tl" || prefs.view === "screen" || !!(player && !player.hidden)));
    });
    if (player) {
      const dockSet = s.dock != null || !!s.shut.dock;
      if (dockSet) player.style.setProperty("--sc-dock-user", s.shut.dock ? "0px" : Math.round(wide() ? fit("dock", s.dock) : s.dock) + "px");
      else player.style.removeProperty("--sc-dock-user");
      player.toggleAttribute("data-dock-sized", dockSet);
      const docks = paneEl("dock");
      if (docks) docks.classList.toggle("sc-shut", !!s.shut.dock);
      const ov = paneEl("ov");
      if (ov) {
        if (s.ov != null) ov.style.setProperty("--sc-ov-h", Math.max(SPLIT.PANES.ov.min, Math.min(SPLIT.PANES.ov.max, s.ov)) + "px");
        else ov.style.removeProperty("--sc-ov-h");
      }
    }
    const body = page.querySelector(".sc-lib-body");
    if (body) {
      const sideSet = s.side != null || !!s.shut.side;
      if (sideSet) body.style.setProperty("--sc-side-w", s.shut.side ? "0px" : Math.round(wide() ? fit("side", s.side) : s.side) + "px");
      else body.style.removeProperty("--sc-side-w");
      body.toggleAttribute("data-side-sized", sideSet);
      const side = paneEl("side");
      if (side) side.classList.toggle("sc-shut", !!s.shut.side);
    }
    if (!sizesRaf)
      sizesRaf = requestAnimationFrame(() => {
        sizesRaf = 0;
        splitsPlace();
        /* The timeline draws to its own width: redraw it only when a border changed that. */
        const tl = page.querySelector(".sc-timeline");
        const key = tl ? tl.clientWidth + "x" + tl.clientHeight : "";
        if (lanes && !page.hidden && key !== sizesApply.tl) {
          if (sizesApply.tl) lanes.draw();
          sizesApply.tl = key;
        }
      });
  }
  /* Which borders there are now, made once each and placed over the panels' edges. */
  function splitsPlace() {
    if (!page || page.hidden) return;
    const main = page.querySelector(".sc-main");
    let box = main && main.querySelector(":scope > .sc-splits");
    if (!main) return;
    if (!box) {
      box = document.createElement("div");
      box.className = "sc-splits";
      main.appendChild(box);
    }
    const player = page.querySelector(".sc-player");
    const playerShown = !!(player && !player.hidden);
    const lib = paneEl("lib");
    const libBody = page.querySelector(".sc-lib-body");
    const has = {
      player: playerShown,
      side: prefs.view === "screen" && !!lib && !sizesNow().shut.lib && !!libBody && getComputedStyle(libBody).gridTemplateColumns.split(" ").length > 1,
      dock: playerShown && !!player.querySelector(":scope > .sc-docks > .sc-dock:not(.folded)") && page.dataset.layout !== "right",
      ov: playerShown && !!paneEl("ov") && (!!page.querySelector(".sc-ov-strip") || !prefs.overview),
    };
    const list = wide() && !page.dataset.fullplayer ? SPLIT.borders(page.dataset.layout, prefs.view, has) : [];
    const want = new Set(list.map((b) => b.id));
    Object.keys(splits).forEach((id) => {
      if (want.has(id) && splits[id].edge === list.find((b) => b.id === id).edge) return;
      splits[id].ctl.destroy();
      splits[id].el.remove();
      delete splits[id];
    });
    const mb = main.getBoundingClientRect();
    list.forEach((b) => {
      if (!splits[b.id]) {
        const el = document.createElement("div");
        el.dataset.split = b.id;
        box.appendChild(el);
        const P = SPLIT.PANES[b.id];
        const ctl = splitter(el, {
          axis: P.axis,
          grow: SPLIT.grows(b.edge),
          name: P.name,
          foldable: true,
          size: () => paneSize(b.id),
          min: () => P.min,
          max: () => paneMax(b.id),
          folded: () => paneFolded(b.id),
          set: (px, shut, phase) => paneSet(b.id, px, shut, phase),
          reset: () => paneReset(b.id),
        });
        splits[b.id] = { el, ctl, edge: b.edge };
      }
      const sp = splits[b.id];
      const pane = paneEl(b.id);
      if (!pane) return (sp.el.hidden = true);
      sp.el.hidden = false;
      const r = pane.getBoundingClientRect();
      const L0 = r.left - mb.left;
      const T0 = r.top - mb.top;
      const st = sp.el.style;
      if (SPLIT.PANES[b.id].axis === "x") {
        const at = b.edge === "right" ? r.right - mb.left + (b.id === "side" ? 0 : 3) : L0 - (b.id === "dock" ? 0 : 3);
        st.left = Math.round(at - 5) + "px";
        st.top = Math.round(T0) + "px";
        st.height = Math.max(24, Math.round(r.height)) + "px";
        st.width = "";
      } else {
        const at = b.id === "ov" ? T0 : T0 - 3;
        st.top = Math.round(at - 5) + "px";
        st.left = Math.round(L0) + "px";
        st.width = Math.max(24, Math.round(r.width)) + "px";
        st.height = "";
      }
      sp.ctl.update();
    });
  }
  function splitsWire() {
    window.addEventListener("resize", () => page && !page.hidden && sizesApply());
    /* The stylesheet may arrive after the first drawing: place the borders again once it has. */
    const again = () => page && !page.hidden && sizesApply();
    window.addEventListener("load", again);
    document.querySelectorAll('link[rel="stylesheet"][href*="screen.css"]').forEach((l) => l.addEventListener("load", again));
    setTimeout(again, 600);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (!page || page.hidden || sizesRaf) return;
        sizesRaf = requestAnimationFrame(() => {
          sizesRaf = 0;
          splitsPlace();
        });
      });
      [".sc-main", ".sc-lib", ".sc-player", ".sc-inspector", ".sc-timeline", ".sc-player > .sc-overview"].forEach((q) => {
        const el = page.querySelector(q);
        if (el) ro.observe(el);
      });
    }
  }

  /* ---- Undo for the Screen's own view (see the top of this block) ---- */
  const VIEW_KEYS = ["sizes", "layout", "view", "insp", "arrange", "lens", "ghost", "speed", "playerZoom", "rulers", "overview", "range", "guides", "compare", "captions", "lanes", "showAll", "showSuites", "viewersInArrange"];
  const TOOLS_KEY = "curiosities-screen-tools-v1";
  const TOOL_SKIP = { solo: true }; /* Solo goes with the lane switches it turns off and on, which are the film's */
  const VU = { base: null, sig: "", timer: 0, open: false, kind: "", last: null, lastSig: "", wired: false };
  const vcl = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  function vuOn() {
    const St = window.CurioStore;
    return !!(page && !page.hidden && St && typeof St.external === "function" && typeof St.history === "function");
  }
  function vuNow() {
    const p = {};
    VIEW_KEYS.forEach((k) => (p[k] = vcl(prefs[k])));
    const T = {};
    const live = window.CurioLanes && window.CurioLanes.tools ? window.CurioLanes.tools() : null;
    if (live) Object.keys(live).forEach((k) => !TOOL_SKIP[k] && (T[k] = vcl(live[k])));
    const W = wins.map((w) => ({ id: w.id, x: w.x, y: w.y, w: w.w || null, h: w.h || null }));
    return { prefs: p, tools: T, wins: W, nav: JSON.stringify([prefs.sel, prefs.cat, prefs.libTab, prefs.focus]) };
  }
  function filmSig() {
    const St = window.CurioStore;
    if (!St || typeof St.history !== "function") return "";
    const h = St.history();
    return h.undo.length + "|" + h.redo.length + "|" + (h.undo[h.undo.length - 1] || "");
  }
  function vuSync() {
    clearTimeout(VU.timer);
    VU.timer = 0;
    if (!page) return;
    VU.base = vuNow();
    VU.sig = filmSig();
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /* What changed between two view readings: { prefs: {k: [b, a]}, tools: {k: [b, a]}, wins: [b, a] | null }. */
  function vuDiff(b, a) {
    const d = { prefs: {}, tools: {}, wins: null };
    VIEW_KEYS.forEach((k) => !same(b.prefs[k], a.prefs[k]) && (d.prefs[k] = [b.prefs[k], a.prefs[k]]));
    new Set(Object.keys(b.tools).concat(Object.keys(a.tools))).forEach((k) => !same(b.tools[k], a.tools[k]) && (d.tools[k] = [b.tools[k], a.tools[k]]));
    /* The windows' order (which is in front) is not a step on its own. */
    const key = (l) => JSON.stringify(l.slice().sort((p, q) => (p.id < q.id ? -1 : 1)));
    if (key(b.wins) !== key(a.wins)) d.wins = [b.wins, a.wins];
    return d;
  }
  const vuEmpty = (d) => !Object.keys(d.prefs).length && !Object.keys(d.tools).length && !d.wins;
  function vuCheck() {
    clearTimeout(VU.timer);
    VU.timer = 0;
    if (!vuOn() || !VU.base) return vuSync();
    const now = vuNow();
    const sig = filmSig();
    const base = VU.base;
    VU.base = now;
    const hint = splitsHint;
    splitsHint = "";
    /* The gesture changed the film too (its own undo step keeps it), or only moved around: not a view step. */
    if (sig !== VU.sig || now.nav !== base.nav) return void (VU.sig = sig);
    const d = vuDiff(base, now);
    if (vuEmpty(d)) return;
    d.hint = hint;
    const label = SPLIT.viewLabel(d, vuNames());
    const pick = (side) => ({ prefs: Object.fromEntries(Object.keys(d.prefs).map((k) => [k, vcl(d.prefs[k][side])])), tools: Object.fromEntries(Object.keys(d.tools).map((k) => [k, vcl(d.tools[k][side])])), wins: d.wins ? vcl(d.wins[side]) : null });
    const keys = JSON.stringify([Object.keys(d.prefs), Object.keys(d.tools), !!d.wins]);
    const t = Date.now();
    /* Arrow-key presses on the same border (or ⌘+ on the timeline, or a window's corner) close together join one
       step; clicks never do, so two markers added one after the other are two steps. */
    const steady = Object.keys(d.prefs).every((k) => k === "sizes") && Object.keys(d.tools).every((k) => k === "zoom" || k === "laneH");
    if (VU.kind === "key" && steady && VU.last && VU.lastSig === sig && VU.last.label === label && VU.last.keys === keys && t - VU.last.at < 1500) {
      VU.last.after = pick(1);
      VU.last.at = t;
      VU.sig = filmSig();
      return;
    }
    const step = { label, keys, at: t, before: pick(0), after: pick(1) };
    /* While the Viewer is open over the Screen (html.cv-open) it takes every key, so a ⌘Z that reaches the
       app-wide list then leaves the Screen's view as it is (the step still counts, so nothing older is undone). */
    const covered = () => document.documentElement.classList.contains("cv-open");
    window.CurioStore.external("screenView", {
      label,
      undo: () => (covered() || vuApply(step.before), true),
      redo: () => (covered() || vuApply(step.after), true),
    });
    VU.last = step;
    VU.sig = VU.lastSig = filmSig();
  }
  function vuNames() {
    const find = (list) => (id) => ((list || []).find((x) => x[0] === id) || [0, id])[1];
    return {
      layout: (id) => find(LAYOUTS)(id),
      guide: (id) => find(GUIDES)(id).toLowerCase(),
      caption: (id) => find(CAPTION_MODES)(id).toLowerCase(),
      compare: (id) => find(COMPARE_WITH)(id).toLowerCase(),
      lens: (id) => ({ highlight: "Highlight", overlay: "Overlay", only: "Lens only", off: "Off" })[id] || id,
      cat: (id) => ((L() && L().CATEGORIES.find((c) => c.id === id)) || { label: id }).label,
      win: (id) => ((L() && L().get("curiosity", id)) || { label: id }).label,
    };
  }
  /* Put one side of a view step back: only the parts that step changed. */
  function vuApply(part) {
    const speedWas = prefs.speed;
    Object.keys(part.prefs || {}).forEach((k) => (part.prefs[k] === undefined ? delete prefs[k] : (prefs[k] = vcl(part.prefs[k]))));
    if (!prefs.sizes) prefs.sizes = {};
    save();
    const live = window.CurioLanes && window.CurioLanes.tools ? window.CurioLanes.tools() : null;
    if (live && part.tools && Object.keys(part.tools).length) {
      Object.keys(part.tools).forEach((k) => (part.tools[k] === undefined ? delete live[k] : (live[k] = vcl(part.tools[k]))));
      try {
        localStorage.setItem(TOOLS_KEY, JSON.stringify(live));
      } catch (e) {}
    }
    if (part.wins) {
      const focus = {};
      wins.forEach((w) => (focus[w.id] = w.focus || ""));
      const order = wins.map((w) => w.id);
      const next = part.wins.map((w) => Object.assign({ focus: focus[w.id] || "" }, w));
      next.sort((p, q) => (order.indexOf(p.id) + 1 || 1e3) - (order.indexOf(q.id) + 1 || 1e3));
      wins.splice(0, wins.length, ...next);
      next.forEach((w) => {
        if (!w.w) delete w.w;
        if (!w.h) delete w.h;
      });
      drawWins();
    }
    if (page && !page.hidden) {
      drawAll();
      if (timer && prefs.speed !== speedWas) play(true);
    }
  }
  /* Check the view a moment after a gesture ends (the page's own handlers run first). */
  function vuSoon(ms) {
    if (!page || page.hidden) return;
    clearTimeout(VU.timer);
    VU.timer = setTimeout(vuCheck, ms == null ? 250 : ms);
  }
  /* Before a gesture: a check still waiting is done now (so steps keep their order); else the view is read fresh,
     so a change made with no gesture (a program, a reload of another part) is never taken for one of yours. */
  function vuStart(e) {
    if (!page || page.hidden || VU.open) return;
    VU.open = true;
    VU.kind = e && e.type === "keydown" ? "key" : "pointer";
    if (VU.timer) vuCheck();
    else vuSync();
  }
  function vuEnd() {
    if (!page || page.hidden) return;
    VU.open = false;
    vuSoon(250);
  }
  /* Before an undo or redo: a check still waiting goes on the list first; after it, the view is read again. */
  function vuFlush() {
    if (VU.timer) vuCheck();
  }
  function vuWire() {
    if (VU.wired) return;
    VU.wired = true;
    window.addEventListener("pointerdown", vuStart, true);
    window.addEventListener("keydown", (e) => !e.repeat && vuStart(e), true);
    window.addEventListener("pointerup", vuEnd, true);
    window.addEventListener("pointercancel", vuEnd, true);
    window.addEventListener("keyup", vuEnd, true);
    /* A list picked from (the layout menu, a film) changes after the press has ended. */
    window.addEventListener(
      "change",
      () => {
        if (!page || page.hidden || VU.open) return;
        /* Caught before the page's own handler: with no gesture waiting, read the view as it is before this change. */
        if (!VU.timer) vuSync();
        vuSoon(250);
      },
      true
    );
    /* The wheel zooms the timeline (⌘ or a pinch) and changes the lane height (Alt): one step when it stops. */
    window.addEventListener(
      "wheel",
      () => {
        if (!page || page.hidden) return;
        if (!VU.timer && !VU.open) {
          vuSync();
          VU.kind = "wheel";
        }
        if (!VU.open) vuSoon(450);
      },
      { capture: true, passive: true }
    );
    vuSync();
  }
  /* Keyboard for a ⧉ window's resize corner: arrows make it wider, narrower, taller or shorter (Shift: bigger steps). */
  function winGripKey(e) {
    const g = e.target && e.target.closest && e.target.closest("[data-win-grip]");
    if (!g || e.metaKey || e.ctrlKey || e.altKey) return;
    const dx = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const dy = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!dx && !dy) return;
    const w = wins.find((x) => x.id === g.dataset.winGrip);
    const win = g.closest(".sc-win");
    if (!w || !win) return;
    e.preventDefault();
    e.stopPropagation();
    const r = win.getBoundingClientRect();
    const st = e.shiftKey ? 60 : 20;
    winResizeTo(w, win, r.width + dx * st, r.height + dy * st);
  }
  function winResizeTo(w, win, ww, hh) {
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    w.w = Math.round(Math.max(240, Math.min(vw - w.x - 4, ww)));
    w.h = Math.round(Math.max(160, Math.min(vh - w.y - 4, hh)));
    win.style.width = w.w + "px";
    win.style.height = w.h + "px";
    win.style.maxHeight = "none";
  }
  function onWinGrip(e) {
    const g = e.target.closest && e.target.closest("[data-win-grip]");
    if (!g) return false;
    const w = wins.find((x) => x.id === g.dataset.winGrip);
    const win = g.closest(".sc-win");
    if (!w || !win) return false;
    const r = win.getBoundingClientRect();
    const x0 = e.clientX;
    const y0 = e.clientY;
    wins.push(wins.splice(wins.indexOf(w), 1)[0]);
    win.style.zIndex = 60 + wins.length;
    document.documentElement.dataset.scSplitting = "xy";
    const move = (ev) => winResizeTo(w, win, r.width + ev.clientX - x0, r.height + ev.clientY - y0);
    const up = () => {
      delete document.documentElement.dataset.scSplitting;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
    return true;
  }
  /* Borders for any page: CurioScreen.splitter(el, opts) (see splitter above). panels: the sizes now, and reset(). */
  window.CurioScreen.splitter = splitter;
  window.CurioScreen.panels = {
    now: () => sizesNow(),
    borders: () => Object.keys(splits).filter((id) => !splits[id].el.hidden),
    reset() {
      prefs.sizes = {};
      if (!prefs.overview) prefs.overview = true;
      save();
      if (page && !page.hidden) drawAll();
      vuSoon(0);
    },
  };

  /* Your own curiosities, suites and proximities (screen/mine.js): open(level, id?) the form (new, or change one
     of yours), save() what it holds, close(), form() the open window (or null), importText(text). */
  window.CurioScreen.mine = { open: myOpen, save: mySave, close: myClose, form: () => (myDlg ? myDlg.el : null), importText: myImport };
})();
