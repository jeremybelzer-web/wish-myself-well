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
  const byId = Object.fromEntries(WORKSPACES.map((w) => [w.id, w]));
  const CUR = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));
  const view = { ws: null, tool: {}, character: null, opened: {} };
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
  function idsOf(ws) {
    return ws.ids.filter((id) => CUR[id] || (A() && A().param && A().param("c:" + id)));
  }
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
    const group = (scope, title) =>
      `<span class="ws-group" aria-hidden="true">${title}</span>` +
      WORKSPACES.filter((w) => w.scope === scope)
        .map((w) => `<button type="button" data-tab="ws" data-ws="${w.id}" title="${esc(w.note)}">${esc(w.label)}</button>`)
        .join("");
    bar.innerHTML = group("scene", "Scene") + group("story", "Story");
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
    const ws = byId[id];
    if (!ws) return;
    view.ws = id;
    page = "ws";
    try {
      localStorage.setItem(LAST_KEY, id);
    } catch (e) {}
    const btn = bar.querySelector(`button[data-ws="${id}"]`);
    show(btn);
    if (btn && btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", inline: "nearest" });
    draw();
  }

  function draw() {
    const ws = byId[view.ws];
    if (!ws) return;
    const ids = idsOf(ws);
    root.innerHTML = `<div class="ws">
      <h2>${esc(ws.label)}</h2>
      <p class="cap">${esc(ws.note)} ${ws.scope === "story" ? "A story workspace: one character, scene by scene through the whole story." : "A scene workspace: panel by panel through My film."}</p>
      <nav class="ws-jump" aria-label="Parts of this workspace">
        <a href="#ws-film">In my film</a><a href="#ws-auto">Automate</a><a href="#ws-prism">Cross-pollinate</a>${ws.tools.length ? `<a href="#ws-tools">Tools</a>` : ""}
      </nav>
      <section class="ws-part" id="ws-film"><h3>In my film</h3><div id="ws-grid"></div>
        ${ws.matrix ? `<div class="ws-matrix" id="ws-matrix"></div>` : ""}</section>
      <section class="ws-part" id="ws-auto"><h3>Automate</h3>
        <p class="cap">Switch one on and it plays${ws.scope === "story" ? " through the scenes above, for whichever character you pick" : " on the board, in the moment you choose"}. From and to set the range; lanes grade its other parts.</p>
        <div class="ws-mods" id="ws-mods"></div>
        <div id="ws-related"></div></section>
      <section class="ws-part" id="ws-prism"><h3>Cross-pollinate from a film</h3><div id="ws-prism-body"></div></section>
      ${ws.tools.length ? `<section class="ws-part" id="ws-tools"><h3>Tools</h3><div id="ws-tools-body"></div></section>` : ""}
    </div>`;
    drawGrid();
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
    const rows = ids
      .map((id) => {
        const cells = Array.from({ length: n }, (_, i) => {
          const mine = at(set[id], i);
          const plays = now[i] ? now[i][id] : undefined;
          const fallback = base[id] != null ? "film: " + base[id] : "not set";
          return `<td>${cellControl(id, mine, `data-cell="${id}" data-i="${i}" aria-label="${esc(labelOf(id))}, panel ${i + 1}"`, fallback)}
            <span class="ws-now" data-now="${id}" data-i="${i}">${nowNote(mine, plays)}</span></td>`;
        }).join("");
        return `<tr><th scope="row">${esc(labelOf(id))}${CUR[id] && CUR[id].live ? "" : ` <span class="ws-tag" title="Not one of the board's thirty controls: the strip shows it where it can.">extra</span>`}</th>${cells}</tr>`;
      })
      .join("");
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

  /* Story scope: one character's values through the scenes, with running automation laid over them. */
  function storyOverlay(n) {
    if (!A() || !A().resolve || !A().running || !A().running().length) return null;
    try {
      return A().resolve(n, undefined, {}).panels;
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
    if (!chars.includes(view.character)) view.character = chars[0];
    const who = view.character;
    const scenes = st.scenes();
    const vals = st.values(who);
    const over = storyOverlay(scenes.length);
    const ids = idsOf(ws);
    const head = scenes.map((s) => `<th>${esc(s)}</th>`).join("");
    const rows = ids
      .map((id) => {
        const cells = scenes
          .map((_, i) => {
            const mine = vals[i] && vals[i][id] != null ? vals[i][id] : "";
            const plays = over && over[i] ? over[i][id] : undefined;
            return `<td>${cellControl(id, mine, `data-story="${id}" data-i="${i}" aria-label="${esc(labelOf(id))}, ${esc(who)}, scene ${i + 1}"`, "not set")}
              <span class="ws-now" data-now="${id}" data-i="${i}">${plays != null && String(plays) !== String(mine) ? `now ${esc(plays)} (automation)` : ""}</span></td>`;
          })
          .join("");
        return `<tr><th scope="row">${esc(labelOf(id))}<br><span class="cap">${esc((CUR[id] && CUR[id].note) || "")}</span></th>${cells}</tr>`;
      })
      .join("");
    el.innerHTML = `<div class="ws-row">
        <label class="field">Character
          <select id="ws-char">${chars.map((c) => `<option ${c === who ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
        </label>
        <label class="field">Add character
          <span class="ws-add"><input type="text" id="ws-newchar" placeholder="a name" /><button type="button" id="ws-addchar">Add</button></span>
        </label>
        <label class="field ws-count">Scenes in the story
          <span class="ws-step"><button type="button" data-scenes="-1" aria-label="One scene fewer">−</button><b>${scenes.length}</b><button type="button" data-scenes="1" aria-label="One scene more">+</button></span>
        </label>
      </div>
      <p class="cap">Set ${esc(who)}'s value for each scene. It is kept in this browser and comes back when you reload.</p>
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

  function drawMatrix() {
    const slot = document.getElementById("ws-matrix");
    if (!slot) return;
    if (window.CharacterMatrix && typeof window.CharacterMatrix.mount === "function") {
      try {
        window.CharacterMatrix.mount(slot);
        return;
      } catch (e) {}
    }
    slot.innerHTML = `<p class="cap ws-fallback">The 3D character matrix is being built in its own thread and will appear here.</p>`;
  }

  /* Only the "now" notes change while automation runs; the controls stay put so a choice isn't lost. */
  let pendingLive = false;
  let lastStoryLive = 0;
  function updateLive() {
    if (pendingLive) return;
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
        const over = storyOverlay(st.scenes().length);
        root.querySelectorAll("#ws-grid [data-now]").forEach((s) => {
          const i = Number(s.dataset.i);
          const mine = vals[i] && vals[i][s.dataset.now] != null ? vals[i][s.dataset.now] : "";
          const plays = over && over[i] ? over[i][s.dataset.now] : undefined;
          const html = plays != null && String(plays) !== String(mine) ? `now ${esc(plays)} (automation)` : "";
          if (s.innerHTML !== html) s.innerHTML = html;
        });
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
    const CA = window.CuriosityAutomate;
    if (CA && typeof CA.mount === "function") {
      try {
        CA.mount(el, key, { compact: true });
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
    const suites = (window.SUITES || (typeof SUITES !== "undefined" ? SUITES : [])).filter((s) => Object.keys(s.set || {}).some((id) => has.has(id)));
    const suiteIds = new Set(suites.map((s) => s.id));
    const touches = (side) => side && ((side.curiosity && has.has(side.curiosity)) || (side.suite && suiteIds.has(side.suite)));
    const proxList = typeof PROXIMITIES !== "undefined" ? PROXIMITIES : [];
    const prox = proxList.filter((p) => touches(p.x) || touches(p.y));
    const proxIds = new Set(prox.map((p) => p.id));
    const ps = ((A() && A().PROXIMITY_SUITES) || []).filter((s) => (s.members || []).some((m) => proxIds.has(m)));
    return { suites, prox, ps };
  }

  function drawAutomate(ws, ids) {
    const mods = document.getElementById("ws-mods");
    ids.forEach((id) => {
      const slot = document.createElement("div");
      slot.className = "ws-mod";
      slot.dataset.autoSlot = "c:" + id;
      mods.appendChild(slot);
      mountModule(slot, "c:" + id);
    });
    drawRelated(ws, ids);
  }

  function drawRelated(ws, ids) {
    const r = related(ids);
    const el = document.getElementById("ws-related");
    if (!r.suites.length && !r.prox.length && !r.ps.length) {
      el.innerHTML = ws.scope === "story" ? `<p class="cap">No suite or proximity involves these yet. Once films are traced for them, they will show here.</p>` : "";
      return;
    }
    const opened = view.opened[ws.id] || (view.opened[ws.id] = []);
    const chip = (key, label, title) =>
      `<button type="button" class="chip-btn ${opened.includes(key) ? "on" : ""}" data-related="${esc(key)}" title="${esc(title || "")}">${esc(label)}</button>`;
    const block = (title, items) => (items.length ? `<p class="ws-g">${esc(title)}</p><div class="ws-chips">${items.join("")}</div>` : "");
    el.innerHTML = `<h4>Suites and proximities that involve these</h4>
      <p class="cap">Tap one to open its automation here.</p>
      ${block("Suites", r.suites.map((s) => chip("s:" + s.id, s.label, s.note)))}
      ${block("Proximities", r.prox.map((p) => chip("p:" + p.id, `When ${p.when}, ${p.then}`)))}
      ${block("Proximity suites", r.ps.map((p) => chip("ps:" + p.id, p.label)))}
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
  }
  function drawToolPage(tool) {
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
    const ws = WORKSPACES.find((w) => w.ids.includes(id));
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
    list: () => WORKSPACES.map((w) => ({ id: w.id, label: w.label, scope: w.scope, curiosities: w.ids.slice(), tools: w.tools.slice() })),
    current: () => (page === "ws" ? view.ws : null),
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

  drawBar();
  let last = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch (e) {}
  if (last && byId[last]) open(last);
})();
