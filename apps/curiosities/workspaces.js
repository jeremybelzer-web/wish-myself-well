/* Workspaces: the bar's tabs after My film. Each one is a family of curiosities a filmmaker keeps
   coming back to (camera angle, character arc, herd mentality...), and every workspace page has the
   same four parts:
   1. In my film: the workspace's curiosities as a grid, by panel of the board (scene workspaces) or by
      scene of the story for one character (story workspaces), showing what plays now, automation included.
      A scene cell writes to the board as an applied strand (CuriosityBoard.apply); a story cell writes to
      the story store (story.js).
   2. Automate: one compact automation module per curiosity (CuriosityAutomate.mount), then the suites,
      proximities and proximity suites that involve them.
   3. Cross-pollinate from a film: the Prism filtered to these curiosities (CuriosityPrism.mount).
   4. Tools: the Studio tools for this workspace (CuriosityStudio.mount), as small sub-tabs.
   Any of those three APIs may be missing; the page then shows a plain line in its place.
   Lens workspaces (Color, Wardrobe, Set design, Emotion, Emotional road, Comedy, Comedy from the mix) come
   from window.CURIOSITY_LENSES (lenses.js): the lens's question at the top, then the same four parts with the
   lens's main curiosity first and its sliders (sub-parameters) under it. Wardrobe joins two lenses, the main
   character's clothes and the background clothes, as two sections.
   The bar groups the workspaces into labelled sections: Camera, People, Look, Sound, Feeling, Comedy, Story (Sound, Page & panel
   and Editing & structure appear only when the curiosity database is loaded; see the database block below).
   "storyboard" is a page of its own (storyboard.js, CuriosityStoryboard.mount).
   Story workspaces also open with a Roadmap: one line chart per curiosity, scenes across, the curiosity's scale up
   the side (in CurioAuto.domain order), one line per character (each can be hidden), each line showing
   the automation running for that character live. A story module's "For" control picks who a patch plays on:
   every character, some (patch.who), or one character's own patch (key "c:<id>@<name>", automation.js). Emotional road adds "The film" (story.js FILM): its own row where set,
   otherwise the average of the characters shown. Each story scene column links to its storyboard scenes.
   window.CuriosityWorkspaces = { open(id), openFor(paramKey), list() }. Last open: curiosities-workspace-v1. */

(function () {
  const root = document.getElementById("workspace");
  const bar = document.getElementById("ws-buttons");
  if (!root || !bar) return;
  const LAST_KEY = "curiosities-workspace-v1";

  const WORKSPACES = [
    { id: "camera-angle", scope: "scene", label: "Camera angle", note: "Where the lens sits and what it sees: how close, how high, how long a lens, level or tilted, whose eyes.", ids: ["shotSize", "angleHeight", "lensLength", "dutch", "pov", "angleFamily", "angleChange", "angleToLine", "angleToAction", "composition"], tools: ["camera"] },
    { id: "camera-motion", scope: "scene", label: "Camera motion", note: "How the camera travels through the scene: carried how, which move, how fast, following whom, and how often it cuts.", ids: ["cameraCarry", "cameraMove", "moveSpeed", "moveFollows", "moveOn", "cameraOwner", "cutRate", "shotDuration", "cameraShake"], tools: ["sequencer", "curves", "remix"] },
    { id: "character-motion", scope: "scene", label: "Character motion", note: "How people move through the scene: their path, their speed, toward or away from the lens, who moves, who enters.", ids: ["characterPath", "characterSpeed", "characterToLens", "whoMoves", "bodyEnter", "moveTemper"], tools: ["motion", "rig", "crowd"] },
    { id: "placement", scope: "scene", label: "Placement", note: "Where people and things stand in the frame, how many, and how much the lens stretches what is near.", ids: ["blocking", "peopleCount", "foreshortening", "objectKind", "objectPath", "objectEnter", "objectSpeed", "characterToLens", "composition", "emptySpace"], tools: ["camera"] },
    { id: "lines", scope: "scene", label: "Lines & delivery", note: "The lines and how they land: tone, loudness, breath, pace, silence, and the feeling under them.", ids: ["vocalTone", "volume", "dynamicRange", "rangeChanges", "breath", "eating", "pace", "silence", "emotion", "timePerCharacter"], tools: ["face", "live"] },
    { id: "movement-lines", scope: "scene", label: "Movement with lines", note: "What the body does while a line is spoken: gesture, stillness, posture, where the eyes go, what leads.", ids: ["gesture", "stillness", "posture", "gazeShift", "blink", "touch", "faceIntensity", "leadPart", "anticipation"], tools: ["face", "rig", "live"] },
    { id: "background", scope: "scene", label: "Background action", note: "What happens behind the people: the room moving, weather, the place, extras and repeated things.", ids: ["envMotion", "weather", "setting", "intExt", "temperature", "scale", "repeatInFrame", "flocking"], tools: ["crowd", "dynamics"] },
    { id: "light", scope: "scene", label: "Light & look", note: "Light, color and surface: where the key is, how hard, how warm, how dark, and how the picture is drawn.", ids: ["lighting", "key", "softness", "contrast", "colorTemp", "timeOfDay", "rim", "valueKey", "atmosphere", "lightChange", "wetness", "renderStyle"], tools: ["light", "shading", "passes"] },
    { id: "effects", scope: "scene", label: "Effects", note: "Simulated things: wind, cloth, breakage, fur and hair, smoke, fire, water, snow.", ids: ["windForce", "turbulence", "clothResponse", "impacts", "breakage", "gravityFeel", "furResponse", "frizz", "element", "density", "growth", "viscosity", "waveHeight", "smokeStyle", "fireSize"], tools: ["dynamics", "fur", "bifrost", "chain"] },
    { id: "arc", scope: "story", label: "Character arc", note: "Where each character is on their arc in each scene, and the role they play for the others.", ids: ["arcStage", "dramaticRole"], tools: [] },
    { id: "plot", scope: "story", label: "Personal plot", note: "How much each scene serves a character's own plot, and how that plot meets the main one.", ids: ["plotWeight", "plotTouch"], tools: [] },
    { id: "mindset", scope: "story", label: "Perspective & mindset", note: "How wide a circle the character weighs, and how ready they are to change their mind.", ids: ["perspectiveWidth", "mindset"], tools: [] },
    { id: "focus", scope: "story", label: "Focus", note: "What the character pays attention to, and whether it is narrowing or widening.", ids: ["focusWidth", "focusShift"], tools: [] },
    { id: "archetype", scope: "story", label: "Archetype", note: "The character's Enneagram type and how healthy or unhealthy it plays in each scene.", ids: ["enneagramType", "enneagramHealth"], tools: [], matrix: true },
    { id: "herd", scope: "story", label: "Herd mentality", note: "How much the group thinks as one through the scenes, and who it follows.", ids: ["herdMentality", "herdLeader"], tools: [] },
  ];

  /* Lens workspaces. Each section is one lens: its main curiosity, then its sliders. */
  const LENS = Object.fromEntries((window.CURIOSITY_LENSES || []).map((l) => [l.id, l]));
  function lensWs(id, label, parts, o) {
    const sections = parts
      .map(([lensId, title]) => {
        const l = LENS[lensId];
        if (!l) return null;
        return { lens: l.id, title: title || l.label, question: l.question, main: l.main, scope: l.scope, ids: [l.main].concat((l.subs || []).filter((x) => x !== l.main)) };
      })
      .filter(Boolean);
    if (!sections.length) return null;
    const ids = [];
    sections.forEach((sec) => sec.ids.forEach((x) => ids.includes(x) || ids.push(x)));
    return Object.assign({ id, label, scope: sections[0].scope === "story" ? "story" : "scene", lens: true, question: sections.length === 1 ? sections[0].question : "", sections, ids, tools: [] }, o);
  }
  [
    lensWs("wardrobe", "Wardrobe", [["wardrobeMain", "Main character"], ["wardrobeBack", "Background"]], {
      question: "What are the people wearing? Look at the main character and at the people behind them: from when, how expensive, how much skin, and does it do a job?",
      note: "Clothes, seen two ways: what the main character wears, and what the people in the background wear.",
    }),
    lensWs("color", "Color", [["color"]], { note: "The color of the picture: black and white or full color, tinted, warm or cool.", tools: ["light", "passes"] }),
    lensWs("set", "Set design", [["set"]], { note: "The place itself: its style, materials, the art on the walls, how cramped or open it is.", tools: ["shading"] }),
    lensWs("emotion", "Emotion", [["emotion"]], { note: "The feeling of the scene and every way it shows: movement, voice, face, posture, words, place and light.", tools: ["face", "live"] }),
    lensWs("emo-road", "Emotional road", [["emoRoad"]], { note: "Each character's emotional road through the story, and the film's own road." }),
    lensWs("comedy", "Comedy", [["comedy"]], { note: "How the scene is funny: the kind of joke, what it is about, how big, how timed, who carries it.", tools: ["face", "live"] }),
    lensWs("comedy-mix", "Comedy from the mix", [["comedyMix"]], { note: "Who is in the room and what putting them together does for the laughs, the plot and the characters." }),
  ].forEach((w) => w && WORKSPACES.push(w));

  /* The curiosity database (data/curiosity-db.js), when index.html loads it. Each workspace then also takes
     its curiosities, suites, proximities and proximity suites from CuriosityDB.forWorkspace(id), added to the
     lists above so nothing disappears, and the database's new workspaces (Music & sound, Editing & structure,
     Page & panel) join the bar. Each item's plain description is its hint. Without the database, nothing changes. */
  const DB = window.CuriosityDB && typeof window.CuriosityDB.forWorkspace === "function" ? window.CuriosityDB : null;
  const DB_TOOLS = { music: ["sequencer", "live"], structure: ["sequencer", "remix"], page: ["print"] };
  if (DB) {
    try {
      ((DB.data && DB.data.workspaces) || []).forEach((w) => {
        if (!w || !w.id || WORKSPACES.some((x) => x.id === w.id)) return;
        WORKSPACES.push({ id: w.id, scope: w.scope === "story" ? "story" : "scene", label: w.label || w.id, note: w.plain || "", ids: [], tools: DB_TOOLS[w.id] || [], fromDb: true });
      });
      WORKSPACES.forEach((ws) => {
        const f = DB.forWorkspace(ws.id) || {};
        ws.db = { suites: f.suites || [], proximities: f.proximities || [], proximitySuites: f.proximitySuites || [] };
        const extra = (f.curiosities || []).map((c) => c.id).filter((id) => !ws.ids.includes(id));
        if (!extra.length) return;
        ws.ids = ws.ids.concat(extra);
        if (ws.sections) ws.sections.push({ lens: "db-more", title: "More in this workspace", question: "Other curiosities that belong here. Each one's sliders are lanes inside its own module.", main: null, extra: true, scope: ws.scope, ids: extra });
      });
    } catch (e) {
      /* A database that cannot be read leaves the workspaces as they are. */
    }
  }
  /* The plain words for an item: the database's description first, then the app's own note. */
  function hintOf(level, id) {
    let d = null;
    try {
      d = DB ? DB.get(level, id) : null;
    } catch (e) {}
    if (d && d.plain) return d.plain;
    if (level === "curiosity") {
      const c = CUR[id];
      return (c && (c.note || c.view)) || "";
    }
    return "";
  }

  /* The bar's sections, in order. Comedy is central, so it has its own marked section. */
  const GROUPS = [
    { title: "Camera", ids: ["camera-angle", "camera-motion", "placement"] },
    { title: "People", ids: ["character-motion", "lines", "movement-lines", "background", "wardrobe"] },
    { title: "Look", ids: ["color", "light", "set", "effects", "page"] },
    { title: "Sound", ids: ["music"] },
    { title: "Feeling", ids: ["emotion", "emo-road"] },
    { title: "Comedy", ids: ["comedy", "comedy-mix"], cls: "is-comedy" },
    { title: "Story", ids: ["arc", "plot", "mindset", "focus", "archetype", "herd", "structure"] },
  ];
  const byId = Object.fromEntries(WORKSPACES.map((w) => [w.id, w]));
  const CUR = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));
  const view = { ws: null, tool: {}, character: null, opened: {}, roadHide: {} };
  let page = null; /* "ws" or "tool" */

  const A = () => window.CurioAuto;
  const B = () => window.CuriosityBoard;
  const S = () => window.CuriosityStory;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function labelOf(id) {
    if (CUR[id]) return CUR[id].label;
    const p = A() && A().param && A().param("c:" + id);
    return p ? p.label : id;
  }
  /* A curiosity the workspace names but nothing defines is left out. */
  const exists = (id) => !!(CUR[id] || (A() && A().param && A().param("c:" + id)));
  function idsOf(ws) {
    return ws.ids.filter(exists);
  }
  /* A lens workspace's sections that have anything to show. */
  function sectionsOf(ws) {
    return (ws.sections || []).map((sec) => Object.assign({}, sec, { ids: sec.ids.filter(exists) })).filter((sec) => sec.ids.length);
  }
  /* Grid rows: plain, or per lens section (a heading row when there are two, the main row, then its sliders). */
  function gridRows(ws, cols, rowFn) {
    if (!ws.sections) return idsOf(ws).map((id) => rowFn(id, "")).join("");
    const secs = sectionsOf(ws);
    return secs
      .map(
        (sec) =>
          (secs.length > 1 ? `<tr class="ws-secrow"><th colspan="${cols + 1}" scope="colgroup">${esc(sec.title)}</th></tr>` : "") +
          sec.ids.map((id) => rowFn(id, sec.extra ? "" : id === sec.main ? "ws-main" : "ws-sub")).join("")
      )
      .join("");
  }
  const mainTag = (cls) => (cls === "ws-main" ? ` <span class="ws-tag" title="The lens's main curiosity; the rows under it are its sliders.">main</span>` : "");
  /* The values a cell can take: words in scale order, a number range, or free text. */
  function domainOf(id) {
    const c = CUR[id];
    if (c && c.kind === "tag") return { kind: "text" };
    let d = null;
    try {
      d = A() && A().domain ? A().domain(id) : null;
    } catch (e) {}
    if (!d && c && c.options) d = { kind: "choice", options: c.options };
    if (!d && c && c.kind === "range") d = { kind: "range", min: c.min, max: c.max, step: 1 };
    if (!d) return { kind: "text" };
    if (d.kind === "range") {
      const step = Number(d.step) || 1;
      const n = Math.floor((d.max - d.min) / step) + 1;
      if (n > 21) return { kind: "number", min: d.min, max: d.max, step };
      return { kind: "choice", options: Array.from({ length: n }, (_, k) => +(d.min + k * step).toFixed(3)) };
    }
    return d.options && d.options.length ? d : { kind: "text" };
  }

  /* ---------- the bar ---------- */
  function drawBar() {
    const listed = new Set();
    const btn = (w) => `<button type="button" data-tab="ws" data-ws="${w.id}" title="${esc(w.note)}">${esc(w.label)}</button>`;
    const sec = (title, list, cls) =>
      list.length ? `<div class="ws-sec ${cls || ""}" role="group" aria-label="${esc(title)}"><span class="ws-group">${esc(title)}</span>${list.map(btn).join("")}</div>` : "";
    let html = GROUPS.map((g) => {
      const list = g.ids.map((id) => byId[id]).filter((w) => w && (!w.fromDb || idsOf(w).length));
      list.forEach((w) => listed.add(w.id));
      return sec(g.title, list, g.cls);
    }).join("");
    /* Anything not in a section yet still gets a button. */
    html += sec("More", WORKSPACES.filter((w) => !listed.has(w.id) && (!w.fromDb || idsOf(w).length)));
    /* On a phone the sections open as a sheet from the "Workspaces" button; this heading shows only there. */
    bar.innerHTML = `<div class="ws-sheet-head"><strong id="ws-sheet-title">Pick a workspace</strong><button type="button" class="ws-sheet-close" data-sheet-close="1" aria-label="Close the list">Close</button></div>` + html;
  }

  /* ---------- the phone bar: one row, the workspaces in a sheet ---------- */
  const tabsEl = document.getElementById("tabs");
  const picker = document.createElement("button");
  picker.type = "button";
  picker.id = "ws-pick";
  picker.className = "ws-pick";
  picker.setAttribute("aria-haspopup", "true");
  picker.setAttribute("aria-expanded", "false");
  picker.setAttribute("aria-controls", "ws-buttons");
  const backdrop = document.createElement("div");
  backdrop.className = "ws-sheet-back";
  backdrop.hidden = true;
  (function placePicker() {
    const top = tabsEl.querySelector(".tabs-top");
    const sb = top && top.querySelector('button[data-ws="storyboard"]');
    if (top) top.insertBefore(picker, sb ? sb.nextSibling : top.firstChild);
    document.body.appendChild(backdrop);
    bar.setAttribute("aria-labelledby", "ws-sheet-title");
  })();
  function paintPicker() {
    const ws = page === "ws" ? byId[view.ws] : null;
    picker.innerHTML = `<span class="ws-pick-name">${esc(ws ? ws.label : "Workspaces")}</span> ▾`;
    picker.setAttribute("aria-label", ws ? `Workspaces: ${ws.label} is open. Pick another.` : "Workspaces: pick one");
    picker.classList.toggle("on", !!ws);
  }
  const sheetOpen = () => tabsEl.classList.contains("ws-sheet-open");
  function setSheet(on, focusBack) {
    tabsEl.classList.toggle("ws-sheet-open", on);
    picker.setAttribute("aria-expanded", on ? "true" : "false");
    backdrop.hidden = !on;
    if (on) {
      const cur = bar.querySelector("button.on[data-ws]") || bar.querySelector("button[data-ws]");
      if (cur) cur.focus();
    } else if (focusBack) picker.focus();
  }
  picker.addEventListener("click", () => setSheet(!sheetOpen()));
  backdrop.addEventListener("click", () => setSheet(false));
  bar.addEventListener("click", (e) => {
    if (e.target.closest("[data-sheet-close]")) setSheet(false, true);
  });
  document.addEventListener("click", (e) => {
    if (sheetOpen() && !e.target.closest("#ws-buttons") && !e.target.closest("#ws-pick")) setSheet(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheetOpen()) {
      e.preventDefault();
      setSheet(false, true);
    }
  });
  /* Tabbing out of the sheet closes it. */
  bar.addEventListener("focusout", (e) => {
    if (sheetOpen() && e.relatedTarget && !bar.contains(e.relatedTarget) && e.relatedTarget !== picker) setSheet(false);
  });
  /* Any tab in the bar repaints the picker (it shows the open workspace, or "Workspaces"). */
  tabsEl.addEventListener("click", (e) => {
    if (!e.target.closest("button[data-tab]")) return;
    if (sheetOpen()) setSheet(false);
    setTimeout(paintPicker, 0);
  });
  /* After a workspace opens, its page top comes into view (on a phone the bar would otherwise hide the change). */
  let firstOpen = true;
  function bringTop() {
    paintPicker();
    if (firstOpen) return;
    const r = root.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) root.scrollIntoView({ block: "start" });
  }
  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-ws], button[data-tool]");
    if (!b) return;
    if (b.dataset.ws) open(b.dataset.ws);
    else openTool(b.dataset.tool, b);
  });

  function show(tabButton) {
    if (window.CuriosityTabs) window.CuriosityTabs.show("ws", tabButton);
    else {
      document.querySelectorAll("main.layout > section").forEach((el) => el.classList.toggle("hidden", el !== root));
    }
  }

  /* ---------- open a workspace ---------- */
  function open(id) {
    if (id === "storyboard") return openStoryboard();
    const ws = byId[id];
    if (!ws) return;
    view.ws = id;
    page = "ws";
    try {
      localStorage.setItem(LAST_KEY, id);
    } catch (e) {}
    show(document.querySelector(`#tabs button[data-ws="${id}"]`));
    draw();
    bringTop();
  }

  /* The Storyboard: many scenes of My film, flipped through like a flip book (storyboard.js). */
  function openStoryboard() {
    view.ws = "storyboard";
    page = "sb";
    try {
      localStorage.setItem(LAST_KEY, "storyboard");
    } catch (e) {}
    show(document.querySelector('#tabs button[data-ws="storyboard"]'));
    root.innerHTML = `<div class="ws ws-sb"><h2>Storyboard</h2>
      <p class="cap">Save My film as scenes, make lots of them, and flip through them like a flip book.</p>
      <div id="ws-sb-body"></div></div>`;
    const el = document.getElementById("ws-sb-body");
    bringTop();
    const SB = window.CuriosityStoryboard;
    if (SB && typeof SB.mount === "function") {
      try {
        SB.mount(el);
        return;
      } catch (e) {
        el.innerHTML = `<p class="cap ws-fallback">The storyboard could not draw here (${esc(e.message)}).</p>`;
        return;
      }
    }
    el.innerHTML = `<p class="cap ws-fallback">The storyboard is not loaded.</p>`;
  }

  function draw() {
    const ws = byId[view.ws];
    if (!ws) return;
    const ids = idsOf(ws);
    root.innerHTML = `<div class="ws">
      <h2>${esc(ws.label)}</h2>
      ${ws.question ? `<p class="ws-question">${esc(ws.question)}</p>` : ""}
      <div class="ws-momentum" id="ws-momentum"></div>
      <p class="cap">${esc(ws.note)} ${ws.scope === "story" ? "A story workspace: one character, scene by scene through the whole story." : "A scene workspace: panel by panel through My film."}${
        ws.lens ? " This is a lens, one way of looking at the scene: its main curiosity comes first and its sliders under it. Every slider can be set per " + (ws.scope === "story" ? "scene" : "panel") + " and automated." : ""
      }</p>
      <nav class="ws-jump" aria-label="Parts of this workspace">
        ${ws.scope === "story" ? `<a href="#ws-road">Roadmap</a>` : ""}<a href="#ws-film">In my film</a><a href="#ws-auto">Automate</a><a href="#ws-prism">Cross-pollinate</a>${ws.tools.length ? `<a href="#ws-tools">Tools</a>` : ""}
      </nav>
      ${ws.scope === "story" ? `<section class="ws-part" id="ws-road"><h3>Roadmap</h3><div id="ws-road-body"></div></section>` : ""}
      <section class="ws-part" id="ws-film"><h3>In my film</h3><div id="ws-grid"></div>
        ${ws.matrix ? `<div class="ws-matrix" id="ws-matrix"></div>` : ""}</section>
      <section class="ws-part" id="ws-auto"><h3>Automate</h3>
        <p class="cap">Switch one on and it plays${ws.scope === "story" ? " through the scenes above, on the characters its For setting names (every character, some, or one with a patch of its own, so two characters can move in opposite directions)" : " on the board, in the moment you choose"}. From and to set the range; lanes grade its other parts.</p>
        <div class="${ws.sections ? "ws-lenses" : "ws-mods"}" id="ws-mods"></div>
        <div id="ws-related"></div></section>
      <section class="ws-part" id="ws-prism"><h3>Cross-pollinate from a film</h3><div id="ws-prism-body"></div></section>
      ${ws.tools.length ? `<section class="ws-part" id="ws-tools"><h3>Tools</h3><div id="ws-tools-body"></div></section>` : ""}
    </div>`;
    /* How this workspace's main curiosity drives the film forward (momentum PR, when loaded). */
    if (window.CurioMomentumUI && typeof CurioMomentumUI.mountNote === "function") {
      const main = (ws.sections && ws.sections[0] && ws.sections[0].main) || ids[0];
      try {
        if (main) CurioMomentumUI.mountNote(root.querySelector("#ws-momentum"), main);
      } catch (e) {}
    }
    drawGrid();
    if (ws.scope === "story") drawRoad(ws);
    if (ws.matrix) drawMatrix();
    drawAutomate(ws, ids);
    drawPrism(ws, ids);
    if (ws.tools.length) drawTools(ws);
  }

  /* ---------- 1. In my film ---------- */
  function drawGrid() {
    const ws = byId[view.ws];
    if (ws.scope === "scene") drawSceneGrid(ws);
    else drawStoryGrid(ws);
  }

  function cellControl(id, value, attrs, placeholder) {
    const d = domainOf(id);
    if (d.kind === "choice") {
      const opts = d.options.map((o) => `<option value="${esc(o)}" ${String(o) === String(value) ? "selected" : ""}>${esc(o)}</option>`).join("");
      return `<select ${attrs}><option value="">${esc(placeholder)}</option>${opts}</select>`;
    }
    if (d.kind === "number") return `<input type="number" ${attrs} min="${d.min}" max="${d.max}" step="${d.step}" value="${esc(value)}" placeholder="${esc(placeholder)}" />`;
    return `<input type="text" ${attrs} value="${esc(value)}" placeholder="${esc(placeholder)}" />`;
  }

  function strandValues() {
    const a = B() && B().applied ? B().applied() : null;
    return a ? a.values : {};
  }
  function panelCount() {
    if (!B()) return 4;
    if (B().count) return B().count();
    return Math.max(1, Number(B().values().angleCount) || 1);
  }
  function playing() {
    const b = B();
    if (!b) return [];
    if (b.panels) return b.panels();
    const n = panelCount();
    return Array.from({ length: n }, () => b.values());
  }
  const at = (vals, i) => (Array.isArray(vals) && vals.length ? vals[i % vals.length] : "");

  function drawSceneGrid(ws) {
    const el = document.getElementById("ws-grid");
    if (!el) return;
    if (!B()) {
      el.innerHTML = `<p class="cap">My film is not loaded, so there is nothing to set here yet.</p>`;
      return;
    }
    const ids = idsOf(ws);
    const n = panelCount();
    const set = strandValues();
    const now = playing();
    const base = B().values();
    const head = Array.from({ length: n }, (_, i) => `<th>Panel ${i + 1}</th>`).join("");
    const rows = gridRows(ws, n, (id, cls) => {
        const cells = Array.from({ length: n }, (_, i) => {
          const mine = at(set[id], i);
          const plays = now[i] ? now[i][id] : undefined;
          const fallback = base[id] != null ? "film: " + base[id] : "not set";
          return `<td>${cellControl(id, mine, `data-cell="${id}" data-i="${i}" aria-label="${esc(labelOf(id))}, panel ${i + 1}"`, fallback)}
            <span class="ws-now" data-now="${id}" data-i="${i}">${nowNote(mine, plays)}</span></td>`;
        }).join("");
        return `<tr class="${cls}"><th scope="row" title="${esc(hintOf("curiosity", id))}">${esc(labelOf(id))}${mainTag(cls)}${CUR[id] && CUR[id].live ? "" : ` <span class="ws-tag" title="Not one of the board's thirty controls: the strip shows it where it can.">extra</span>`}</th>${cells}</tr>`;
      });
    el.innerHTML = `<div class="ws-row">
        <label class="field ws-count">Panels in my film
          <span class="ws-step"><button type="button" data-count="-1" aria-label="One panel fewer">−</button><b>${n}</b><button type="button" data-count="1" aria-label="One panel more">+</button></span>
        </label>
        <button type="button" class="ws-clear" data-clear="1">Clear this workspace's cells</button>
        <button type="button" class="ws-clear" data-tab-board="1">See it in My film</button>
      </div>
      <p class="cap">Pick a value for a panel and the board's panel changes. Empty means the panel plays the film's own setting. A running automation shows its live value under the cell.</p>
      <div class="scroll ws-scroll"><table class="trace ws-grid"><thead><tr><th>Curiosity</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
      <div class="ws-mini" id="ws-mini"></div>`;
    drawMini();
  }

  function nowNote(mine, plays) {
    if (plays == null || plays === "") return "";
    if (mine !== "" && mine != null && String(mine) === String(plays)) return "";
    return mine !== "" && mine != null ? `now ${esc(plays)} (automation)` : `now ${esc(plays)}`;
  }

  /* A small copy of the strip, so a change can be seen without leaving the workspace. */
  function drawMini() {
    const el = document.getElementById("ws-mini");
    const b = B();
    if (!el || !b || !b.panel || !b.scene) return;
    const s = b.scene();
    const now = playing();
    el.innerHTML = `<div class="strip">${now
      .map((st, i) => {
        try {
          return b.panel(s.lines[i % s.lines.length], i, now.length, st);
        } catch (e) {
          return "";
        }
      })
      .join("")}</div>`;
  }

  function writeSceneCell(ws, id, i, value) {
    const b = B();
    if (!b) return;
    const n = panelCount();
    const cur = b.applied ? b.applied() : null;
    const values = cur ? cur.values : {};
    const arr = Array.from({ length: n }, (_, k) => {
      const v = at(values[id], k);
      return v == null ? "" : v;
    });
    const d = domainOf(id);
    arr[i] = value === "" ? "" : d.kind === "number" || (d.kind === "choice" && typeof d.options[0] === "number") ? Number(value) : value;
    if (arr.every((v) => v === "" || v == null)) delete values[id];
    else values[id] = arr;
    let label = ws.label;
    if (cur && cur.label && cur.label !== ws.label && !cur.label.split(" + ").includes(ws.label)) label = cur.label + " + " + ws.label;
    else if (cur && cur.label) label = cur.label;
    b.apply(label, values);
  }

  function clearScene(ws) {
    const b = B();
    if (!b || !b.applied) return;
    const cur = b.applied();
    if (!cur) return;
    idsOf(ws).forEach((id) => delete cur.values[id]);
    const label = cur.label.split(" + ").filter((x) => x !== ws.label).join(" + ") || ws.label;
    b.apply(label, cur.values);
  }

  /* Story scope: one character's values through the scenes, with running automation laid over them.
     Only the patches for that character play: shared ones for every character or naming them (patch.who),
     and the character's own ("c:arcStage@Nessa"). */
  function storyOverlay(n, who) {
    if (!A() || !A().resolve || !A().running || !A().running().length) return null;
    try {
      return A().resolve(n, undefined, {}, who == null ? view.character : who).panels;
    } catch (e) {
      return null;
    }
  }

  function drawStoryGrid(ws) {
    const el = document.getElementById("ws-grid");
    if (!el) return;
    const st = S();
    if (!st) {
      el.innerHTML = `<p class="cap">The story store is not loaded.</p>`;
      return;
    }
    const chars = st.characters();
    const pickable = withFilm(ws) ? st.withFilm() : chars;
    if (!pickable.includes(view.character)) view.character = chars[0];
    const who = view.character;
    const scenes = st.scenes();
    const vals = st.values(who);
    const over = storyOverlay(scenes.length, who);
    const ids = idsOf(ws);
    const head = scenes
      .map((s, i) => `<th>${esc(s)}<a href="#" class="ws-sblink" data-sb-scene="${i}" title="Open the Storyboard at the scenes tied to ${esc(s)}">See this scene's storyboard</a></th>`)
      .join("");
    const rows = gridRows(ws, scenes.length, (id, cls) => {
        const cells = scenes
          .map((_, i) => {
            const mine = vals[i] && vals[i][id] != null ? vals[i][id] : "";
            const plays = over && over[i] ? over[i][id] : undefined;
            return `<td>${cellControl(id, mine, `data-story="${id}" data-i="${i}" aria-label="${esc(labelOf(id))}, ${esc(who)}, scene ${i + 1}"`, "not set")}
              <span class="ws-now" data-now="${id}" data-i="${i}">${plays != null && String(plays) !== String(mine) ? `now ${esc(plays)} (automation)` : ""}</span></td>`;
          })
          .join("");
        return `<tr class="${cls}"><th scope="row">${esc(labelOf(id))}${mainTag(cls)}<br><span class="cap">${esc(hintOf("curiosity", id))}</span></th>${cells}</tr>`;
      });
    el.innerHTML = `<div class="ws-row">
        <label class="field">Character
          <select id="ws-char">${pickable.map((c) => `<option ${c === who ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
        </label>
        <label class="field">Add character
          <span class="ws-add"><input type="text" id="ws-newchar" placeholder="a name" /><button type="button" id="ws-addchar">Add</button></span>
        </label>
        <label class="field ws-count">Scenes in the story
          <span class="ws-step"><button type="button" data-scenes="-1" aria-label="One scene fewer">−</button><b>${scenes.length}</b><button type="button" data-scenes="1" aria-label="One scene more">+</button></span>
        </label>
      </div>
      <p class="cap">Set ${esc(who)}'s value for each scene${st.isFilm && st.isFilm(who) ? " (the whole film's own road, apart from any one character)" : ""}. It is kept in this browser and comes back when you reload.</p>
      <div class="scroll ws-scroll"><table class="trace ws-grid"><thead><tr><th>Curiosity</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
      ${drawStoryAll(ws, chars)}`;
  }

  /* Every character at once for the workspace's first curiosity: a quick read of the ensemble. */
  function drawStoryAll(ws, chars) {
    const id = idsOf(ws)[0];
    if (!id || chars.length < 2) return "";
    const st = S();
    const n = st.scenes().length;
    const rows = chars
      .map((c) => {
        const v = st.values(c);
        return `<tr><th scope="row">${esc(c)}</th>${Array.from({ length: n }, (_, i) => `<td class="mono">${esc((v[i] && v[i][id]) != null ? v[i][id] : "·")}</td>`).join("")}</tr>`;
      })
      .join("");
    return `<details class="ws-all"><summary>${esc(labelOf(id))} for everyone</summary>
      <div class="scroll ws-scroll"><table class="trace ws-grid"><thead><tr><th>Character</th>${Array.from({ length: n }, (_, i) => `<th>${i + 1}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }


  /* ---------- 0. Roadmap (story workspaces) ---------- */
  /* Colors that stay apart for most kinds of color blindness, dark enough to read on the paper. */
  const ROAD_COLORS = ["#0068a8", "#c2410c", "#00805a", "#b4508f", "#7a5c00", "#3d8fc4", "#6b3fa0", "#555555"];
  const withFilm = (ws) => !!(ws && ws.id === "emo-road" && S() && S().withFilm);
  function roadColor(name, chars) {
    if (S() && S().isFilm && S().isFilm(name)) return "#1c1712";
    const k = chars.indexOf(name);
    return ROAD_COLORS[(k < 0 ? 0 : k) % ROAD_COLORS.length];
  }
  /* Where a value sits on its curiosity's scale: a step number, or null when it is not on the scale. */
  function scaleOf(id) {
    const d = domainOf(id);
    if (d.kind === "choice") {
      const words = d.options.map(String);
      return { levels: words, min: 0, max: Math.max(1, words.length - 1), pos: (v) => (v == null || v === "" ? null : words.indexOf(String(v)) >= 0 ? words.indexOf(String(v)) : null) };
    }
    if (d.kind === "number") {
      const span = d.max - d.min || 1;
      const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => +(d.min + f * span).toFixed(2));
      return { levels: null, ticks, min: d.min, max: d.max, pos: (v) => (v == null || v === "" || isNaN(Number(v)) ? null : Math.max(d.min, Math.min(d.max, Number(v)))) };
    }
    return null;
  }
  /* One line's points for one curiosity: the kept values, with the automation running for that character laid over them. */
  function roadSeries(ws, id, sc, n) {
    const st = S();
    const chars = st.characters();
    const names = withFilm(ws) ? st.withFilm() : chars;
    const out = names.map((name) => {
      const vals = st.values(name);
      const over = storyOverlay(n, name);
      const pts = Array.from({ length: n }, (_, i) => {
        const auto = over && over[i] && over[i][id] != null ? over[i][id] : null;
        const raw = auto != null ? auto : vals[i] ? vals[i][id] : null;
        const y = sc.pos(raw);
        return y == null ? null : { y, raw, live: auto != null };
      });
      return { name, color: roadColor(name, chars), pts, film: !!(st.isFilm && st.isFilm(name)) };
    });
    /* The film: its own row where set, else the average of the characters on show. */
    const film = out.find((s) => s.film);
    if (film) {
      const shown = out.filter((s) => !s.film && !view.roadHide[s.name]);
      film.pts = film.pts.map((p, i) => {
        if (p) return p;
        const ys = shown.map((s) => s.pts[i]).filter(Boolean).map((q) => q.y);
        if (!ys.length) return null;
        const y = ys.reduce((a, b) => a + b, 0) / ys.length;
        return { y, raw: sc.levels ? "average, near " + sc.levels[Math.round(y)] : "average " + +y.toFixed(2), avg: true };
      });
    }
    return out;
  }
  function roadSvg(ws, id, width) {
    const st = S();
    const sc = scaleOf(id);
    const n = st.scenes().length;
    if (!sc) return `<p class="cap">This one is free text, so it has no scale to draw.</p>`;
    const series = roadSeries(ws, id, sc, n).filter((s) => !view.roadHide[s.name]);
    const W = Math.max(280, Math.round(width));
    const labels = sc.levels || sc.ticks.map(String);
    const longest = Math.max(...labels.map((l) => l.length));
    const L = Math.min(Math.round(W * 0.36), Math.max(44, longest * 6.4 + 14));
    const fit = Math.max(4, Math.floor((L - 12) / 6.4));
    const short = (l) => (l.length > fit ? l.slice(0, fit - 1) + "…" : l);
    const steps = sc.levels ? sc.levels.length : 5;
    const rowH = steps > 10 ? 17 : 22;
    const T = 12, Bm = 36, R = 16;
    const H = T + (steps - 1) * rowH + Bm;
    const plotW = W - L - R;
    const x = (i) => L + 8 + (n === 1 ? (plotW - 16) / 2 : (i * (plotW - 16)) / (n - 1));
    const y = (v) => T + (steps - 1) * rowH * (1 - (v - sc.min) / (sc.max - sc.min || 1));
    let g = "";
    const tickVals = sc.levels ? sc.levels.map((_, k) => k) : sc.ticks;
    tickVals.forEach((v, k) => {
      const yy = y(v).toFixed(1);
      g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="rgba(28,23,18,0.12)" />`;
      g += `<text x="${L - 6}" y="${yy}" dy="0.35em" text-anchor="end" class="ws-road-y"><title>${esc(labels[k])}</title>${esc(short(labels[k]))}</text>`;
    });
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 28))));
    for (let i = 0; i < n; i++) if (i % every === 0 || i === n - 1) g += `<text x="${x(i).toFixed(1)}" y="${H - Bm + 16}" text-anchor="middle" class="ws-road-x">${i + 1}</text>`;
    g += `<line x1="${L}" x2="${W - R}" y1="${H - Bm + 4}" y2="${H - Bm + 4}" stroke="#1c1712" />`;
    g += `<text x="${W - R}" y="${H - 4}" text-anchor="end" class="ws-road-x">scene →</text>`;
    /* Lines that share a value sit a hair apart, so every one can be seen. */
    const spread = Math.min(2.5, rowH / (series.length + 2));
    series.forEach((s, k) => {
      const off = (k - (series.length - 1) / 2) * spread;
      const pts = s.pts.map((p, i) => (p ? { X: x(i), Y: y(p.y) + off, p, i } : null));
      let d = "";
      let pen = false;
      pts.forEach((q) => {
        if (!q) return (pen = false);
        d += `${pen ? "L" : "M"}${q.X.toFixed(1)} ${q.Y.toFixed(1)} `;
        pen = true;
      });
      const dash = s.film ? ` stroke-dasharray="7 4"` : "";
      if (d) g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.film ? 3 : 2.2}" stroke-linejoin="round" stroke-linecap="round"${dash} />`;
      pts.forEach((q) => {
        if (!q) return;
        const tip = `<title>${esc(s.name)}, scene ${q.i + 1}: ${esc(q.p.raw)}${q.p.live ? " (automation playing)" : ""}</title>`;
        if (q.p.live) g += `<circle cx="${q.X.toFixed(1)}" cy="${q.Y.toFixed(1)}" r="6.5" fill="none" stroke="#c45c26" stroke-width="2" />`;
        g += q.p.avg
          ? `<circle cx="${q.X.toFixed(1)}" cy="${q.Y.toFixed(1)}" r="3.6" fill="#fffaf2" stroke="${s.color}" stroke-width="2">${tip}</circle>`
          : `<circle cx="${q.X.toFixed(1)}" cy="${q.Y.toFixed(1)}" r="3.6" fill="${s.color}" stroke="#fffaf2" stroke-width="1">${tip}</circle>`;
      });
    });
    if (!series.some((s) => s.pts.some(Boolean))) g += `<text x="${(L + (W - R)) / 2}" y="${T + ((steps - 1) * rowH) / 2}" dy="0.35em" text-anchor="middle" class="ws-road-empty">Nothing set yet for the lines shown</text>`;
    const told = series.map((s) => s.name + " " + s.pts.map((p, i) => (p ? `scene ${i + 1} ${p.raw}` : "")).filter(Boolean).join(", ")).join("; ");
    return `<svg class="ws-road-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labelOf(id))} by scene. ${esc(told || "Nothing set yet.")}">${g}</svg>`;
  }
  function drawRoad(ws) {
    const el = document.getElementById("ws-road-body");
    if (!el || !ws) return;
    const st = S();
    if (!st) {
      el.innerHTML = `<p class="cap">The story store is not loaded.</p>`;
      return;
    }
    const chars = st.characters();
    const names = withFilm(ws) ? st.withFilm() : chars;
    const ids = idsOf(ws).filter((id) => scaleOf(id));
    const toggles = names
      .map((name) => {
        const on = !view.roadHide[name];
        const film = st.isFilm && st.isFilm(name);
        return `<button type="button" class="ws-road-who ${on ? "on" : ""}" data-road-who="${esc(name)}" aria-pressed="${on}" title="${on ? "Hide" : "Show"} ${esc(name)}'s line"><span class="ws-road-key${film ? " film" : ""}" style="--c:${roadColor(name, chars)}"></span>${esc(name)}${name === view.character ? " ·&nbsp;chosen" : ""}</button>`;
      })
      .join("");
    el.innerHTML = `<p class="cap">${withFilm(ws) ? "Each character's road, and the film's own, " : "Each character "}through the ${st.scenes().length} scenes. Low on the scale is at the bottom, high at the top. Tap a name to hide or show its line. A ring marks a value that running automation is playing now, on the characters each automation is for (its For setting: every character, some, or one character's own patch).${
      withFilm(ws) ? " The film's line is dashed: a filled dot is its own row, a hollow dot is the average of the characters shown." : ""
    }</p>
      <div class="ws-road-who-row" role="group" aria-label="Lines on the roadmap">${toggles}</div>
      <div class="ws-road-grid" id="ws-road-charts">${ids.map((id) => `<figure class="ws-road-fig" data-road="${esc(id)}"><figcaption><b>${esc(labelOf(id))}</b> <span class="cap">${esc(hintOf("curiosity", id))}</span></figcaption><div class="ws-road-plot"></div></figure>`).join("") || `<p class="cap">Nothing here has a scale to draw.</p>`}</div>`;
    drawRoadCharts(ws);
  }
  function drawRoadCharts(ws) {
    if (!ws || ws.scope !== "story" || !S()) return;
    root.querySelectorAll("#ws-road-charts [data-road]").forEach((fig) => {
      const plot = fig.querySelector(".ws-road-plot");
      const w = plot.clientWidth || fig.clientWidth || 320;
      const html = roadSvg(ws, fig.dataset.road, w);
      if (plot.innerHTML !== html) plot.innerHTML = html;
    });
  }
  let roadResize = 0;
  window.addEventListener("resize", () => {
    clearTimeout(roadResize);
    roadResize = setTimeout(() => {
      const ws = byId[view.ws];
      if (page === "ws" && ws && ws.scope === "story") drawRoadCharts(ws);
    }, 150);
  });
  /* The story scene's storyboard: open the Storyboard at the scenes tied to it. */
  function openStoryScene(i) {
    open("storyboard");
    const SB = window.CuriosityStoryboard;
    if (SB && SB.focusStory) SB.focusStory(i);
  }
  function injectRoadStyle() {
    if (document.getElementById("ws-road-style")) return;
    const st = document.createElement("style");
    st.id = "ws-road-style";
    st.textContent = `
      .ws-road-who-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; }
      .ws-road-who { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 12px; background: var(--panel); color: var(--ink); border: 2px solid var(--ink); padding: 4px 8px; cursor: pointer; }
      .ws-road-who:not(.on) { opacity: 0.5; text-decoration: line-through; border-style: dashed; }
      .ws-road-who:focus-visible { outline: 3px solid var(--saffron); outline-offset: 2px; }
      .ws-road-empty { font: 12px var(--sans); fill: #7a6f63; }
      .ws-road-key { display: inline-block; width: 18px; height: 0; border-top: 3px solid var(--c); }
      .ws-road-key.film { border-top-style: dashed; }
      .ws-road-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 12px; min-width: 0; }
      .ws-road-fig { margin: 0; border: 1px solid var(--line); background: var(--panel); padding: 8px; min-width: 0; }
      .ws-road-fig figcaption { font-size: 13px; margin-bottom: 4px; }
      .ws-road-fig figcaption .cap { display: block; font-size: 12px; }
      .ws-road-plot { min-width: 0; overflow: hidden; }
      .ws-road-svg { display: block; max-width: 100%; height: auto; }
      .ws-road-y { font: 11px var(--sans); fill: #3a3229; }
      .ws-road-x { font: 10px var(--mono); fill: #3a3229; }
      .ws-grid thead th .ws-sblink { display: block; white-space: normal; text-transform: none; letter-spacing: 0; font-family: var(--sans); font-size: 11px; color: var(--saffron); max-width: 120px; margin-top: 2px; }
    `;
    document.head.appendChild(st);
  }
  injectRoadStyle();

  /* The 3D character matrix (character-matrix/) loads only when Archetype opens: its stylesheet, then three.js,
     data.js and matrix.js in order, once. If its own files are not in this folder, the placeholder line stays.
     Without three.js the matrix still mounts and says the 3D view needs it. */
  const MATRIX_NOTE = "The 3D character matrix is being built in its own thread and will appear here.";
  const MATRIX_FILES = ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "character-matrix/data.js", "character-matrix/matrix.js"];
  let matrixLoad = null;
  function loadMatrix() {
    if (matrixLoad) return matrixLoad;
    const add = (el) =>
      new Promise((ok, fail) => {
        el.onload = () => ok(true);
        el.onerror = () => fail(new Error("not found"));
        document.head.appendChild(el);
      });
    const css = () => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "character-matrix/matrix.css";
      l.id = "ws-matrix-css";
      return add(l);
    };
    const js = (src, optional) => {
      const sc = document.createElement("script");
      sc.src = src;
      sc.async = false;
      return add(sc).catch((e) => {
        if (!optional) throw e;
      });
    };
    matrixLoad = css()
      .then(() => (window.THREE ? null : js(MATRIX_FILES[0], true)))
      .then(() => js(MATRIX_FILES[1]))
      .then(() => js(MATRIX_FILES[2]))
      .then(() => !!(window.CharacterMatrix && typeof window.CharacterMatrix.mount === "function"))
      .catch(() => {
        const l = document.getElementById("ws-matrix-css");
        if (l) l.remove();
        return false;
      });
    return matrixLoad;
  }
  function mountMatrix(slot) {
    try {
      /* The matrix mounts once and hands back its element after that: put that element back in the new slot. */
      const el = window.CharacterMatrix.mount(slot);
      if (el && el.nodeType === 1 && el !== slot && !el.isConnected) slot.replaceWith(el);
      return true;
    } catch (e) {
      slot.innerHTML = `<p class="cap ws-fallback">${MATRIX_NOTE}</p>`;
      return false;
    }
  }
  function drawMatrix() {
    const slot = document.getElementById("ws-matrix");
    if (!slot) return;
    if (window.CharacterMatrix && typeof window.CharacterMatrix.mount === "function") return void mountMatrix(slot);
    slot.innerHTML = `<p class="cap ws-fallback">${MATRIX_NOTE}</p>`;
    loadMatrix().then((ok) => {
      /* Mount into the slot that is on the page now (the workspace may have been redrawn or left meanwhile). */
      const now = document.getElementById("ws-matrix");
      if (ok && now && page === "ws" && byId[view.ws] && byId[view.ws].matrix) mountMatrix(now);
    });
  }

  /* Only the "now" notes change while automation runs; the controls stay put so a choice isn't lost. */
  let pendingLive = false;
  let lastStoryLive = 0;
  function updateLive() {
    if (pendingLive || page !== "ws" || root.classList.contains("hidden")) return; // nothing to update while the page is away
    pendingLive = true;
    requestAnimationFrame(() => {
      pendingLive = false;
      if (page !== "ws" || root.classList.contains("hidden")) return;
      const ws = byId[view.ws];
      if (!ws) return;
      if (ws.scope === "scene") {
        const set = strandValues();
        const now = playing();
        root.querySelectorAll("#ws-grid [data-now]").forEach((s) => {
          const i = Number(s.dataset.i);
          const html = nowNote(at(set[s.dataset.now], i), now[i] ? now[i][s.dataset.now] : undefined);
          if (s.innerHTML !== html) s.innerHTML = html;
        });
        drawMini();
      } else {
        const st = S();
        if (!st) return;
        const vals = st.values(view.character);
        const over = storyOverlay(st.scenes().length, view.character);
        root.querySelectorAll("#ws-grid [data-now]").forEach((s) => {
          const i = Number(s.dataset.i);
          const mine = vals[i] && vals[i][s.dataset.now] != null ? vals[i][s.dataset.now] : "";
          const plays = over && over[i] ? over[i][s.dataset.now] : undefined;
          const html = plays != null && String(plays) !== String(mine) ? `now ${esc(plays)} (automation)` : "";
          if (s.innerHTML !== html) s.innerHTML = html;
        });
        drawRoadCharts(ws);
      }
    });
  }
  if (B() && B().on) B().on(updateLive);
  if (A() && A().on)
    A().on((type) => {
      const ws = byId[view.ws];
      if (!ws || page !== "ws") return;
      if (type === "change") return updateLive();
      if (type === "tick" && ws.scope === "story") {
        const t = performance.now();
        if (t - lastStoryLive > 200) {
          lastStoryLive = t;
          updateLive();
        }
      }
    });

  root.addEventListener("change", (e) => {
    const t = e.target;
    const ws = byId[view.ws];
    if (!ws) return;
    if (t.dataset.cell) {
      writeSceneCell(ws, t.dataset.cell, Number(t.dataset.i), t.value);
      updateLive();
      return;
    }
    if (t.dataset.story && S()) {
      const d = domainOf(t.dataset.story);
      const v = t.value === "" ? "" : d.kind === "number" || (d.kind === "choice" && typeof d.options[0] === "number") ? Number(t.value) : t.value;
      S().set(view.character, Number(t.dataset.i), t.dataset.story, v);
      updateLive();
      return;
    }
    if (t.id === "ws-char") {
      view.character = t.value;
      drawGrid();
      drawRoad(ws);
    }
  });
  root.addEventListener("keydown", (e) => {
    if (e.target.id === "ws-newchar" && e.key === "Enter") addCharacter();
  });
  function addCharacter() {
    const input = document.getElementById("ws-newchar");
    if (!input || !S()) return;
    const name = input.value.trim();
    if (!name) return input.focus();
    S().addCharacter(name);
    view.character = name;
    drawGrid();
    drawRoad(byId[view.ws]);
  }
  root.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const ws = byId[view.ws];
    if (t.closest(".ws-jump") && t.getAttribute("href")) {
      e.preventDefault();
      const target = document.getElementById(t.getAttribute("href").slice(1));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (t.id === "ws-addchar") return addCharacter();
    if (t.dataset.roadWho != null && ws) {
      const name = t.dataset.roadWho;
      view.roadHide[name] = !view.roadHide[name];
      drawRoad(ws);
      return;
    }
    if (t.dataset.sbScene != null) {
      e.preventDefault();
      return openStoryScene(Number(t.dataset.sbScene));
    }
    if (t.dataset.count && B()) {
      const c = CUR.angleCount || { min: 1, max: 8 };
      const n = Math.max(c.min || 1, Math.min(c.max || 8, panelCount() + Number(t.dataset.count)));
      if (B().set) B().set("angleCount", n);
      drawGrid();
      return;
    }
    if (t.dataset.scenes && S()) {
      S().setSceneCount(S().scenes().length + Number(t.dataset.scenes));
      drawGrid();
      drawRoad(ws);
      return;
    }
    if (t.dataset.clear && ws) {
      clearScene(ws);
      drawGrid();
      return;
    }
    if (t.dataset.tabBoard) {
      const b = document.querySelector('#tabs button[data-tab="board"]');
      if (b) b.click();
      return;
    }
    if (t.dataset.related) return openRelated(t.dataset.related);
    if (t.dataset.patchbay && window.CuriosityAutomate && window.CuriosityAutomate.open) return window.CuriosityAutomate.open(t.dataset.patchbay);
    if (t.dataset.wsTool && ws) {
      view.tool[ws.id] = t.dataset.wsTool;
      drawTools(ws);
      return;
    }
    if (t.dataset.manualTool) {
      view.tool.__manual = t.dataset.manualTool;
      drawToolPage("manual");
    }
  });

  /* ---------- 2. Automate ---------- */
  function mountModule(el, key) {
    if (String(key).startsWith("ps:") && !(A() && A().param && A().param(key)) && dbProximitySuite(el, key)) return;
    const CA = window.CuriosityAutomate;
    if (CA && typeof CA.mount === "function") {
      try {
        const ws = byId[view.ws];
        const story = ws && ws.scope === "story";
        /* A story module has a "For" control: every character, some, or one character's own patch. */
        CA.mount(el, key, { compact: true, unit: story ? "scene" : "panel", characters: story && S() ? (withFilm(ws) ? S().withFilm() : S().characters()) : undefined });
        return;
      } catch (e) {
        el.innerHTML = `<p class="cap ws-fallback">This automation could not draw here (${esc(e.message)}).</p>`;
      }
    } else el.innerHTML = "";
    const name = A() && A().param && A().param(key) ? A().param(key).label : key;
    el.insertAdjacentHTML(
      "beforeend",
      `<p class="cap ws-fallback"><strong>${esc(name)}</strong>: the compact automation module is not available here yet.${
        CA && CA.open ? ` <button type="button" data-patchbay="${esc(key)}">Open it in the patch bay</button>` : ""
      }</p>`
    );
  }

  function related(ids) {
    const has = new Set(ids);
    const CS = window.CuriositySuites;
    if (CS) CS.sync();
    const membersOf = (s) => (CS ? CS.members(s) : Object.keys(s.set || {}));
    const suites = (window.SUITES || (typeof SUITES !== "undefined" ? SUITES : [])).filter((s) => membersOf(s).some((id) => has.has(id)));
    const suiteIds = new Set(suites.map((s) => s.id));
    const touches = (side) => side && ((side.curiosity && has.has(side.curiosity)) || (side.suite && suiteIds.has(side.suite)));
    const proxList = typeof PROXIMITIES !== "undefined" ? PROXIMITIES : [];
    const prox = proxList.filter((p) => touches(p.x) || touches(p.y));
    const proxIds = new Set(prox.map((p) => p.id));
    const ps = ((A() && A().PROXIMITY_SUITES) || []).filter((s) => (s.members || []).some((m) => proxIds.has(m)));
    /* The database's own lists for this workspace, added to what the ids above found. */
    const ws = byId[view.ws];
    if (ws && ws.db) {
      const addBy = (list, items) => items.forEach((x) => x && !list.some((y) => y.id === x.id) && list.push(x));
      const allSuites = window.SUITES || (typeof SUITES !== "undefined" ? SUITES : []);
      addBy(suites, ws.db.suites.map((d) => allSuites.find((s) => s.id === d.id)));
      addBy(prox, ws.db.proximities.map((d) => proxList.find((p) => p.id === d.id)));
      const appPs = (A() && A().PROXIMITY_SUITES) || [];
      addBy(ps, ws.db.proximitySuites.map((d) => appPs.find((p) => p.id === d.id) || { id: d.id, label: d.label, members: d.members || [], fromDb: true }));
    }
    return { suites, prox, ps };
  }
  /* A proximity suite only the database knows has no module of its own yet: list its proximities, each with a module. */
  function dbProximitySuite(el, key) {
    const id = key.slice(3);
    const ws = byId[view.ws];
    const d = (ws && ws.db && ws.db.proximitySuites.find((x) => x.id === id)) || (DB && DB.get("proximitySuite", id));
    if (!d) return false;
    const proxList = typeof PROXIMITIES !== "undefined" ? PROXIMITIES : [];
    const members = (d.members || []).map((m) => proxList.find((p) => p.id === m)).filter(Boolean);
    el.innerHTML = `<div class="ws-psdb"><p><strong>${esc(d.label)}</strong></p>${d.plain ? `<p class="cap">${esc(d.plain)}</p>` : ""}
      <p class="cap">These proximities act together. Switch on each one you want; each has its own delay and how often.</p>
      <div class="ws-mods"></div></div>`;
    const box = el.querySelector(".ws-mods");
    members.forEach((p) => addModule(box, "p:" + p.id));
    if (!members.length) box.innerHTML = `<p class="cap">None of its proximities are loaded.</p>`;
    return true;
  }

  function addModule(box, key) {
    const slot = document.createElement("div");
    slot.className = "ws-mod";
    slot.dataset.autoSlot = key;
    box.appendChild(slot);
    mountModule(slot, key);
  }
  function drawAutomate(ws, ids) {
    const mods = document.getElementById("ws-mods");
    if (ws.sections) {
      /* A lens: its main curiosity's module, then one module per slider. The sliders are also lanes of the main one. */
      const secs = sectionsOf(ws);
      secs.forEach((sec) => {
        const subs = sec.ids.filter((id) => id !== sec.main);
        const box = document.createElement("div");
        box.className = "ws-lens";
        if (sec.extra) {
          /* Curiosities the database adds to this lens workspace: one module each. */
          box.innerHTML = `<h4>${esc(sec.title)}</h4><p class="cap ws-q">${esc(sec.question)}</p><div class="ws-mods"></div>`;
          mods.appendChild(box);
          sec.ids.forEach((id) => addModule(box.querySelector(".ws-mods"), "c:" + id));
          return;
        }
        box.innerHTML = `${secs.length > 1 ? `<h4>${esc(sec.title)}</h4><p class="cap ws-q">${esc(sec.question)}</p>` : ""}
          <p class="ws-g">The main curiosity</p><div class="ws-mods" data-lens-main="${esc(sec.lens)}"></div>
          ${subs.length ? `<p class="ws-g">Its sliders (${subs.length})</p><p class="cap">Each slider is one part of the lens you can turn up or down. It has its own module here, and it is also a lane inside the main module.</p><div class="ws-mods ws-sliders" data-lens-subs="${esc(sec.lens)}"></div>` : ""}`;
        mods.appendChild(box);
        if (sec.ids.includes(sec.main)) addModule(box.querySelector("[data-lens-main]"), "c:" + sec.main);
        const sb = box.querySelector("[data-lens-subs]");
        subs.forEach((id) => addModule(sb, "c:" + id));
      });
      drawRelated(ws, ids);
      return;
    }
    ids.forEach((id) => {
      const slot = document.createElement("div");
      slot.className = "ws-mod";
      slot.dataset.autoSlot = "c:" + id;
      mods.appendChild(slot);
      mountModule(slot, "c:" + id);
    });
    drawRelated(ws, ids);
  }

  /* What my film plays, per panel (scene workspaces) or per scene for the chosen character (story ones). */
  function suiteValues(ws) {
    if (ws.scope === "story") {
      const st = S();
      return st && view.character ? st.values(view.character) : [];
    }
    return playing();
  }

  function drawRelated(ws, ids) {
    const r = related(ids);
    const el = document.getElementById("ws-related");
    if (!r.suites.length && !r.prox.length && !r.ps.length) {
      el.innerHTML = ws.scope === "story" ? `<p class="cap">No suite or proximity involves these yet. Once films are traced for them, they will show here.</p>` : "";
      return;
    }
    const opened = view.opened[ws.id] || (view.opened[ws.id] = []);
    const chip = (key, label, title, extra) =>
      `<button type="button" class="chip-btn ${opened.includes(key) ? "on" : ""}" data-related="${esc(key)}" title="${esc(title || "")}">${esc(label)}${extra || ""}</button>`;
    /* A suite matches by degree: the share of its lenses my film shows, on average across the panels
       (or this character's scenes). A lens suite has nothing to match; it only groups lenses. */
    const CS = window.CuriositySuites;
    const mine = suiteValues(ws);
    const suiteChip = (s) => {
      const m = CS && CS.fixed(s) ? CS.across(s, mine) : null;
      const extra = m
        ? ` <span class="suite-n">${m.on} of ${m.total} ${m.total === 1 ? "lens" : "lenses"}, ${CS.pct(m.mean)}</span>${CS.bar(m.mean)}`
        : ` <span class="suite-n">${CS ? CS.members(s).length : ""} lenses, side by side</span>`;
      return chip("s:" + s.id, s.label, (hintOf("suite", s.id) || s.note || "") + (m ? ` In my film: ${CS.pct(m.mean)} on average, best ${CS.pct(m.peak)}.` : ""), extra);
    };
    const block = (title, items) => (items.length ? `<p class="ws-g">${esc(title)}</p><div class="ws-chips">${items.join("")}</div>` : "");
    el.innerHTML = `<h4>Suites and proximities that involve these</h4>
      <p class="cap">Tap one to open its automation here.</p>
      ${block("Suites, by how much my film shows of each", r.suites.map(suiteChip))}
      ${block("Proximities", r.prox.map((p) => chip("p:" + p.id, `When ${p.when}, ${p.then}`, hintOf("proximity", p.id) || p.note || "")))}
      ${block("Proximity suites", r.ps.map((p) => chip("ps:" + p.id, p.label, hintOf("proximitySuite", p.id))))}
      <div class="ws-mods" id="ws-related-mods"></div>`;
    const box = document.getElementById("ws-related-mods");
    opened.forEach((key) => {
      const slot = document.createElement("div");
      slot.className = "ws-mod";
      slot.dataset.autoSlot = key;
      box.appendChild(slot);
      mountModule(slot, key);
    });
  }

  function openRelated(key) {
    const ws = byId[view.ws];
    if (!ws) return;
    const opened = view.opened[ws.id] || (view.opened[ws.id] = []);
    const i = opened.indexOf(key);
    if (i >= 0) opened.splice(i, 1);
    else opened.unshift(key);
    drawRelated(ws, idsOf(ws));
    const slot = root.querySelector(`[data-auto-slot="${CSS.escape(key)}"]`);
    if (slot && slot.scrollIntoView) slot.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- 3. Cross-pollinate ---------- */
  function drawPrism(ws, ids) {
    const el = document.getElementById("ws-prism-body");
    const P = window.CuriosityPrism;
    if (P && typeof P.mount === "function") {
      try {
        P.mount(el, { curiosities: ids, title: ws.label });
        return;
      } catch (e) {
        el.innerHTML = `<p class="cap ws-fallback">The Prism could not draw here (${esc(e.message)}).</p>`;
        return;
      }
    }
    el.innerHTML = `<p class="cap ws-fallback">The filtered Prism is not available here yet. Open the whole-film Prism from the Library menu: Prism.</p>`;
  }

  /* ---------- 4. Tools ---------- */
  function toolLabel(id) {
    const St = window.CuriosityStudio;
    return (St && St.label && St.label(id)) || id.charAt(0).toUpperCase() + id.slice(1);
  }
  function mountTool(el, id) {
    const St = window.CuriosityStudio;
    if (St && typeof St.mount === "function") {
      try {
        St.mount(el, id);
        return;
      } catch (e) {
        el.innerHTML = `<p class="cap ws-fallback">This tool could not draw here (${esc(e.message)}).</p>`;
        return;
      }
    }
    el.innerHTML = `<p class="cap ws-fallback">The ${esc(toolLabel(id))} tool cannot be shown inside a workspace yet.</p>`;
  }
  function drawTools(ws) {
    const el = document.getElementById("ws-tools-body");
    if (!el) return;
    const cur = ws.tools.includes(view.tool[ws.id]) ? view.tool[ws.id] : ws.tools[0];
    view.tool[ws.id] = cur;
    el.innerHTML = `${ws.tools.length > 1 ? `<nav class="subtabs ws-subtabs">${ws.tools.map((t) => `<button type="button" data-ws-tool="${t}" class="${t === cur ? "on" : ""}">${esc(toolLabel(t))}</button>`).join("")}</nav>` : ""}
      <div class="ws-tool" id="ws-tool-body"></div>`;
    mountTool(document.getElementById("ws-tool-body"), cur);
  }

  /* Library pages that are Studio tools: the Maya manual (with Start here) and Print. */
  function openTool(tool, button) {
    page = "tool";
    if (window.CuriosityTabs) window.CuriosityTabs.show("tool", button);
    else show(null);
    drawToolPage(tool);
    bringTop();
  }
  function drawToolPage(tool) {
    /* Library > Words: the plain-language glossary (glossary.js). */
    if (tool === "words") {
      root.innerHTML = `<div class="ws" id="ws-words"></div>`;
      const G = window.CuriosityGlossary;
      if (G && typeof G.mountList === "function") G.mountList(document.getElementById("ws-words"));
      else document.getElementById("ws-words").innerHTML = `<p class="cap ws-fallback">The word list is not loaded.</p>`;
      return;
    }
    const St = window.CuriosityStudio;
    if (!(St && typeof St.mount === "function")) {
      /* Fall back to the old Studio page, opened on that tool. */
      if (window.CuriosityTabs) window.CuriosityTabs.show("studio", document.getElementById("lib-btn") && document.querySelector(`#lib-menu button[data-tool="${tool}"]`));
      if (St && St.open) St.open(tool === "manual" ? view.tool.__manual || "manual" : tool);
      return;
    }
    if (tool === "manual") {
      const cur = view.tool.__manual || "manual";
      root.innerHTML = `<div class="ws"><h2>Maya manual</h2>
        <p class="cap">Every topic of the Maya and Arnold for Maya manuals, with your keep or skip calls, and where to start.</p>
        <nav class="subtabs ws-subtabs">${[["manual", "Manual"], ["start", "Start here"]].map(([k, l]) => `<button type="button" data-manual-tool="${k}" class="${k === cur ? "on" : ""}">${l}</button>`).join("")}</nav>
        <div class="ws-tool" id="ws-tool-body"></div></div>`;
      mountTool(document.getElementById("ws-tool-body"), cur);
      return;
    }
    root.innerHTML = `<div class="ws"><h2>${esc(toolLabel(tool))}</h2><div class="ws-tool" id="ws-tool-body"></div></div>`;
    mountTool(document.getElementById("ws-tool-body"), tool);
  }

  /* ---------- open the workspace for a curiosity ---------- */
  function openFor(paramKey) {
    const key = String(paramKey || "");
    const id = key.startsWith("c:") ? key.slice(2) : key;
    /* The lens whose main curiosity it is first, then the first workspace that has it. */
    const ws = WORKSPACES.find((w) => (w.sections || []).some((sec) => sec.main === id)) || WORKSPACES.find((w) => w.ids.includes(id));
    if (!ws) {
      if (window.CuriosityAutomate && window.CuriosityAutomate.open) window.CuriosityAutomate.open(key);
      return;
    }
    open(ws.id);
    const slot = root.querySelector(`[data-auto-slot="${CSS.escape("c:" + id)}"]`);
    if (slot) {
      slot.classList.add("ws-flash");
      setTimeout(() => slot.classList.remove("ws-flash"), 1600);
      if (slot.scrollIntoView) slot.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  window.CuriosityWorkspaces = {
    open,
    openFor,
    list: () =>
      WORKSPACES.map((w) => ({
        id: w.id,
        label: w.label,
        scope: w.scope,
        curiosities: w.ids.slice(),
        tools: w.tools.slice(),
        lens: !!w.lens,
        question: w.question || "",
        sections: (w.sections || []).map((sec) => ({ title: sec.title, main: sec.main, sliders: sec.ids.filter((x) => x !== sec.main) })),
        group: (GROUPS.find((g) => g.ids.includes(w.id)) || { title: "More" }).title,
      })),
    current: () => (page === "ws" || page === "sb" ? view.ws : null),
  };

  /* Leaving a workspace detaches its body, so tool animations that check isConnected stop. */
  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b || b.dataset.ws || b.dataset.tool) return;
    page = null;
    setTimeout(() => {
      if (root.classList.contains("hidden")) root.innerHTML = "";
    }, 0);
  });

  /* ---------- saving: Library entries and the small save indicator (project.js) ---------- */
  (function wireProject() {
    const P = window.CuriosityProject;
    const menu = document.getElementById("lib-menu");
    const top = document.querySelector("#tabs .tabs-top");
    if (!P || !menu || !top) return;
    const closeMenu = () => {
      menu.hidden = true;
      const lb = document.getElementById("lib-btn");
      if (lb) lb.setAttribute("aria-expanded", "false");
    };
    const items = [
      ["save", "Save project", "keep your work in a .curio file"],
      ["file", "Open or new project", "open a .curio file, or start fresh"],
      ["history", "History", "the last 20 autosaves; restore any"],
    ];
    menu.insertAdjacentHTML(
      "afterbegin",
      items.map(([k, t, s]) => `<button type="button" data-project="${k}">${esc(t)}<small>${esc(s)}</small></button>`).join("")
    );
    menu.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-project]");
      if (!b) return;
      closeMenu();
      if (b.dataset.project === "save") P.save();
      else P.openPanel(b.dataset.project);
    });
    const ind = document.createElement("button");
    ind.type = "button";
    ind.className = "proj-ind";
    ind.addEventListener("click", () => P.openPanel("file"));
    const lib = top.querySelector(".lib");
    top.insertBefore(ind, lib || null);
    const paint = (s) => {
      const l = P.label(s);
      ind.textContent = l.text;
      ind.className = "proj-ind " + l.tone;
      ind.title = P.note + (s && s.fileName ? " Project file: " + s.fileName + "." : "");
    };
    paint(P.status());
    P.on(paint);
    setInterval(() => paint(P.status()), 60000);
  })();

  drawBar();
  let last = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch (e) {}
  if (last && (byId[last] || last === "storyboard")) open(last);
  paintPicker();
  firstOpen = false;
})();
