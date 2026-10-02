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
    guides: false,
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
      ["⇧↩", "In", "Nothing on the Screen yet (CapCut marks where a clip starts)"],
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
      ["⌘;", "Show/hide guides", "Thirds guides over the frames", (e) => mod(e) && !e.altKey && e.key === ";", () => toggleView("guides")],
      ["Long press ⌘", "Cancel player alignment", "Nothing yet (CapCut lets you place a clip freely while ⌘ is held)"],
    ]],
    ["Basic", [
      ["⌘C", "Copy", "Copy the picked node with every node joined to it", (e) => mod(e) && !e.shiftKey && !e.altKey && key(e, "c"), lk("copy")],
      ["⌘X", "Cut", "Copy it, then take it out", (e) => mod(e) && !e.shiftKey && !e.altKey && key(e, "x"), lk("cut")],
      ["⌘V", "Paste", "Paste it at the playhead's moment", (e) => mod(e) && !e.shiftKey && !e.altKey && key(e, "v"), lk("paste")],
      ["⇧⌘C", "Copy attributes", "Copy the picked node's setting", (e) => mod(e) && e.shiftKey && key(e, "c"), lk("copyLook")],
      ["⇧⌘V", "Paste attributes", "Give that setting to another node of the same curiosity", (e) => mod(e) && e.shiftKey && key(e, "v"), lk("pasteLook")],
      ["⌫", "Delete", "Remove the picked node", (e) => plain(e) && (e.key === "Backspace" || e.key === "Delete"), lk("delete")],
      ["⌘Z", "Undo", "Undo the last change to your film", (e) => mod(e) && !e.shiftKey && key(e, "z"), () => E() && E().undo()],
      ["⇧⌘Z", "Reset (redo)", "Redo what you undid", (e) => mod(e) && e.shiftKey && key(e, "z"), () => E() && E().redo()],
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
  function play(on) {
    if (timer) clearInterval(timer);
    timer = null;
    if (!on) (playDir = 1), (playRate = 1);
    if (on) timer = setInterval(() => setRow(playDir < 0 ? (row <= 0 ? nRows() - 1 : row - 1) : row + 1 >= nRows() ? 0 : row + 1), Math.round(1100 / ((prefs.speed || 1) * playRate)));
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
      <section class="sc-player sc-panel" aria-label="Player"><header class="sc-ph"></header><div class="sc-viewers"></div><div class="sc-transport"></div></section>
      <aside class="sc-inspector sc-panel" aria-label="Details"></aside>
      <div class="sc-timeline sc-panel"></div></div>`;
    document.body.appendChild(page);
    page.addEventListener("click", onClick);
    page.addEventListener("change", onChange);
    page.addEventListener("input", onInput);
    page.addEventListener("pointerdown", onKnobDown);
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
    page.dataset.guides = prefs.guides ? "1" : "";
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
      <button type="button" data-act="close" class="sc-close">Back to the app</button>
      <p class="sc-what">${esc(sel.label)}${sel.plain ? ": " + esc(sel.plain) : ""}</p>`;
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
  function groupsOf(cat) {
    const ws = (window.CuriosityDB && window.CuriosityDB.data.workspaces) || [];
    const out = cat.workspaces
      .map((w) => ({ id: "ws:" + w, label: (ws.find((x) => x.id === w) || {}).label || w, level: "curiosity", items: L().curiosities(cat.id).filter((c) => c.workspace === w) }))
      .filter((g) => g.items.length);
    [["suite", "Suites"], ["proximity", "Proximities"], ["proximitySuite", "Proximity suites"]].forEach(([lv, label]) => {
      const items = L().items(lv, cat.id);
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
    if (level === "link") return `<div class="sc-card" data-card="link"><div class="sc-card-b"><strong>${esc(it.label)}</strong><small>${esc(it.plain)}</small><em>Proximity</em></div></div>`;
    const on = prefs.sel.level === level && prefs.sel.id === it.id;
    let sub = it.plain || "";
    if (level === "suite") sub = (it.members || []).length + " curiosities: " + [...new Set((it.members || []).map((m) => labelOf(keyFor(m.curiosity))))].slice(0, 4).join(", ");
    const tag = level === "curiosity" ? (it.source === "Final Cut Pro and CapCut" ? "New from editing" : "") : L().LEVELS.find((l) => l.id === level).label;
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
    const tab = ["mine", "templates"].includes(prefs.libTab) ? prefs.libTab : "";
    const extra = [["mine", "My film", "film", "Everything automated in my film so far (like Maya's Outliner, or CapCut's Yours)"], ["templates", "Templates", "grid", "Ready-made recipes: every suite, dropped at the playhead as a set of nodes (CapCut's Templates)"]];
    page.querySelector(".sc-icons").innerHTML =
      extra.map(([id, label, ic, t]) => `<button type="button" data-libtab="${id}" class="${tab === id ? "on" : ""}" aria-pressed="${tab === id}" title="${esc(t)}">${icon(ic)}<span>${esc(label)}</span></button>`).join("") +
      L()
        .CATEGORIES.map((c) => `<button type="button" data-icat="${c.id}" class="${!tab && c.id === cat.id ? "on" : ""}" aria-pressed="${!tab && c.id === cat.id}" title="${esc(c.plain)}">${icon(c.icon)}<span>${esc(c.label)}</span></button>`)
        .join("");
    const groups = tab === "mine" ? mineGroups() : tab === "templates" ? templateGroups() : groupsOf(cat);
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
  function viewerHtml(kind, v) {
    const sel = selection();
    if (kind === "mine") {
      const beats = mineBeats();
      const i = Math.min(row, beats.length - 1);
      const vals = beats[i] ? beats[i].values : {};
      const fires = L().fires(prefs.sel.level, prefs.sel.id, beats);
      const att = attentionAt(beats, i);
      return `<article class="sc-viewer mine${prefs.focus === "mine" ? " focus" : ""}" data-viewer="mine">
        <header><button type="button" class="sc-vname" data-focus="mine">My film</button><span class="sc-vsub">${esc(E() ? E().state().name : "")} · moment ${i + 1} of ${beats.length}</span></header>
        <div class="sc-frame" data-focus="mine">${F().svg(vals, Object.assign(frameOpts(sel, vals), { title: "My film, moment " + (i + 1) }))}${att ? `<span class="sc-att" title="What holds the audience's attention now (momentum)">Attention: ${esc(att.label)}</span>` : ""}</div>
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
      .join("")}</div>`;
    page.querySelector(".sc-viewers").innerHTML = prefs.insp.map((v) => viewerHtml("insp", v)).join("") + viewerHtml("mine");
    page.querySelector(".sc-transport").innerHTML = `<span class="sc-tc" title="One moment of your film is ${secondsPerMoment()} seconds (the Momentum window's setting)">${tc(row)} / ${tc(Math.max(0, nRows() - 1))}</span>
      <span class="sc-play"><button type="button" data-act="prev" aria-label="Back one moment">◀</button><button type="button" data-act="play" class="sc-playb">${timer ? "Pause" : "Play"}</button><button type="button" data-act="next" aria-label="Forward one moment">▶</button><select data-speed aria-label="Speed">${[0.5, 1, 2, 4].map((sp) => `<option value="${sp}"${prefs.speed === sp ? " selected" : ""}>${sp}×</option>`).join("")}</select></span>
      <span class="sc-wins-set"><span class="sc-seg" role="group" aria-label="Windows">${[1, 2, 3].map((n) => `<button type="button" data-wins="${n}" class="${prefs.insp.length + 1 === n ? "on" : ""}" title="${n === 1 ? "Only your film" : n - 1 + " inspiration film" + (n > 2 ? "s" : "") + " and your film"}">${n}</button>`).join("")}</span><button type="button" data-act="add-insp" title="Add another inspiration film viewer">+ Inspiration film</button><span class="sc-seg" role="group" aria-label="Viewer layout"><button type="button" data-arr="side" class="${prefs.arrange === "side" ? "on" : ""}" title="Viewers side by side">Side</button><button type="button" data-arr="stack" class="${prefs.arrange === "stack" ? "on" : ""}" title="Viewers stacked">Stack</button></span></span>`;
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
        ${spark(key, ctx.beats)}
        ${fine.length ? `<button type="button" class="sc-fold" data-fold="${esc(c.id)}" aria-expanded="${open}" title="The fine controls inside it">${open ? "▾" : "▸"} ${fine.length}</button>` : ""}
      </div>
      ${mainS ? `<div class="sc-ctl"><span class="sc-ctl-l">${keyBtn(key, ctx)}${esc(mainS.label)}</span>${controlHtml(key, mainS, mainVal, !ctx.edit)}</div>` : ""}
      ${ctx.insp ? `<div class="sc-take"><label><input type="checkbox" data-take="${esc(key)}" ${take > 0 ? "checked" : ""}> Take into my film</label>${take > 0 ? `<input type="range" min="5" max="100" step="5" value="${Math.round(take * 100)}" data-take-amt="${esc(key)}" aria-label="Blend amount"><output>${Math.round(take * 100)}%</output>` : ""}</div>` : ""}
      ${open ? `<div class="sc-fine">${fine.map((s) => `<div class="sc-ctl"><span class="sc-ctl-l" title="${esc(s.plain || "")}">${keyBtn(sliderId(c, s), ctx)}${esc(s.label)}</span>${controlHtml(sliderId(c, s), s, ctx.value(sliderId(c, s)), !ctx.edit)}</div>`).join("")}</div>` : ""}
    </div>`;
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
    const cat = category();
    let list = L().curiosities(cat.id);
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
    if (prefs.showAll) L().CATEGORIES.forEach((cat) => prefs.openCats[cat.id] && L().curiosities(cat.id).forEach((c) => add(c.id, { group: cat.label })));
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
          ${prefs.showAll ? `<div class="sc-chips">${L().CATEGORIES.map((c) => `<button type="button" data-open-cat="${c.id}" class="${prefs.openCats[c.id] ? "on" : ""}">${esc(c.label)} <small>${L().curiosities(c.id).length}</small></button>`).join("")}</div>` : ""}
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
        header: prefs.view === "arrange" ? laneHeader : null,
        onClip: (j) => setRow(j),
        onHover: (j) => setRow(j),
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
    const t = e.target.closest("button, [data-scrub], .sc-frame");
    if (!t || !page.contains(t)) return;
    const d = t.dataset;
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
      return drawLibrary();
    }
    if ("drop" in d && d.drop) {
      showLane(d.drop);
      save();
      const res = setValue(d.drop, d.v);
      if (res && res.ok) toast(`${labelOf(d.drop)}: ${S().fix(d.drop, d.v)} at moment ${row + 1}.`);
      return drawTimeline(), drawLibrary();
    }
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

  window.CurioScreen = { open, close, isOpen: () => !!(page && !page.hidden), mountViewer, state: () => JSON.parse(JSON.stringify(prefs)), blendCommands, setRow, row: () => row, addPanel, on: (fn) => (typeof fn === "function" && listeners.push(fn), () => listeners.splice(listeners.indexOf(fn) >>> 0, 1)) };
})();
