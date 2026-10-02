/* Storyboard: the beta's main job. Keep many scenes, each a list of panels with all their values, and flip
   through them like a flip book. Panels are drawn with CuriosityBoard.panel, so they look like My film.
   "Make many" samples running automation at evenly spaced moments: the cheap way to get lots of boards.
   Shape: { scenes: [ { id, name, note, made, board: {id, title, slug, people}, panels: [ { v: {curiosityId: value}, line: {who, text} } ] } ] }.
   A scene can be tied to a scene of the story (story.js): scene.story = its index, -1 for none, unset = same
   place (storyboard scene 3 is story scene 3). The flip book then shows, under the panel, the story values of
   the characters in that panel (arc stage, emotional road, role, herd mentality).
   localStorage key curiosities-storyboard-v1. Exposes window.CuriosityStoryboard = { mount(el), focusStory(i) }. */

(function () {
  const KEY = "curiosities-storyboard-v1";
  const PREFS = "curiosities-storyboard-view-v1";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  /* ---------- the store ---------- */
  function load() {
    const saved = readJson(KEY);
    const st = saved && typeof saved === "object" ? saved : {};
    if (!Array.isArray(st.scenes)) st.scenes = [];
    st.scenes = st.scenes.filter((s) => s && Array.isArray(s.panels));
    return st;
  }
  const store = load();
  let saveError = "";
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      saveError = "";
    } catch (e) {
      saveError = "The browser is out of room, so the last change was not kept. Download the storyboard, then delete some scenes.";
    }
  }
  function prefs() {
    const p = readJson(PREFS) || {};
    return Object.assign({ speed: 4, many: 16, len: 8, as: "scenes", view: "flip" }, p);
  }
  function savePrefs(p) {
    try {
      localStorage.setItem(PREFS, JSON.stringify(p));
    } catch (e) {}
  }
  let idSeed = 0;
  function newId() {
    return "sb" + Date.now().toString(36) + (idSeed++).toString(36);
  }
  /* Scene names come from the story (Scene 1, Scene 2...) when there is one. */
  function defaultName(i) {
    try {
      const names = window.CuriosityStory && window.CuriosityStory.scenes();
      if (names && names[i]) return names[i];
    } catch (e) {}
    return "Scene " + (i + 1);
  }

  /* ---------- the tie to the story ---------- */
  const ST = () => window.CuriosityStory;
  function storyCount() {
    try {
      return ST() ? ST().scenes().length : 0;
    } catch (e) {
      return 0;
    }
  }
  /* The story scene a storyboard scene belongs to, or -1. */
  function storyOf(scene, si) {
    const n = storyCount();
    if (!n) return -1;
    const k = scene && scene.story != null && scene.story !== "" ? Number(scene.story) : si;
    return k >= 0 && k < n ? k : -1;
  }
  const STORY_BITS = [
    ["arcStage", "arc"],
    ["emoRoadCharacter", "road"],
    ["emotion", "feeling"],
    ["dramaticRole", "role"],
    ["herdMentality", "herd"],
  ];
  /* One plain line: the story values for the characters in this panel, in this story scene. */
  function storyLine(scene, si, p) {
    const st = ST();
    if (!st) return "";
    const k = storyOf(scene, si);
    if (k < 0) return `<span class="sb-small">Not tied to a story scene. Pick one under All scenes.</span>`;
    const chars = st.characters();
    const here = [];
    const add = (w) => {
      if (w && chars.includes(w) && !here.includes(w)) here.push(w);
    };
    add(p && p.line && p.line.who);
    ((scene.board && scene.board.people) || []).forEach((w) => add(typeof w === "string" ? w : w && w.name));
    const who = here.slice(0, 3);
    const head = `<b>Story scene ${k + 1}</b>`;
    if (!who.length) return `${head} · <span class="sb-small">no story character is in this panel.</span>`;
    const parts = who.map((w) => {
      const v = st.values(w)[k] || {};
      const bits = STORY_BITS.filter(([id]) => v[id] != null && v[id] !== "").map(([id, word]) => `${word} ${esc(v[id])}${id === "herdMentality" ? " of 5" : ""}`);
      return `<span class="sb-who">${esc(w)}</span>: ${bits.length ? bits.join(", ") : `<span class="sb-small">nothing set yet</span>`}`;
    });
    return `${head} · ${parts.join(" · ")}`;
  }
  let active = null; /* the mounted page, so the story workspaces can jump into it */
  let pendingStory = null;

  /* ---------- capturing My film ---------- */
  function boardInfo() {
    const B = window.CuriosityBoard;
    const s = (B && B.scene()) || { id: "", title: "", slug: "", people: [], lines: [] };
    return { id: s.id, title: s.title, slug: s.slug, people: (s.people || []).slice(), lines: (s.lines || []).slice() };
  }
  function panelCount() {
    const B = window.CuriosityBoard;
    return Math.max(1, Number(B && B.values().angleCount) || 4);
  }
  /* The panels as they play at one moment: the controls, the applied strand, then running automation on top. */
  function capture(count, now) {
    const B = window.CuriosityBoard;
    const A = window.CurioAuto;
    const base = B ? B.values() : {};
    const applied = B && B.applied ? B.applied() : null;
    const running = A && A.running && A.running().length;
    const auto = running ? A.resolve(count, now).panels : null;
    const info = boardInfo();
    const lines = info.lines.length ? info.lines : [{ who: "", text: "—" }];
    return Array.from({ length: count }, (_, i) => {
      const v = Object.assign({}, base);
      if (applied)
        Object.entries(applied.values || {}).forEach(([id, vals]) => {
          const x = Array.isArray(vals) && vals.length ? vals[i % vals.length] : null;
          if (x != null && x !== "") v[id] = x;
        });
      if (auto && auto[i])
        Object.entries(auto[i]).forEach(([id, x]) => {
          if (x != null && x !== "" && String(x) !== String(base[id])) v[id] = x;
        });
      const l = lines[i % lines.length];
      return { v, line: { who: l.who, text: l.text } };
    });
  }
  function sceneRecord(panels, name, note) {
    const info = boardInfo();
    return { id: newId(), name, note: note || "", made: new Date().toISOString(), board: { id: info.id, title: info.title, slug: info.slug, people: info.people }, panels };
  }

  /* ---------- drawing a panel ---------- */
  function panelHtml(scene, p, i) {
    const B = window.CuriosityBoard;
    if (!B || !B.panel) return `<figure class="panel"><p class="cap">The board is not loaded.</p></figure>`;
    try {
      return B.panel(p.line || { who: "", text: "—" }, i, scene.panels.length, p.v || {});
    } catch (e) {
      return `<figure class="panel"><p class="cap">This panel could not be drawn.</p></figure>`;
    }
  }
  function stageOnly(html) {
    const m = /<svg class="stage[\s\S]*?<\/svg>/.exec(html);
    return m ? m[0] : "";
  }
  /* Every panel of every scene in order: the flip book's pages. */
  function pages() {
    const out = [];
    store.scenes.forEach((s, si) => s.panels.forEach((p, pi) => out.push({ si, pi })));
    return out;
  }

  /* ---------- the PNG contact sheet: each panel's stage drawing plus its words, drawn on a canvas ---------- */
  const LIGHT_BG = { dusk: "#d7c7ae", flat: "#f4f1ea", practical: "#fff6e4", hard: "#f3f3f3", moon: "#d5dde6" };
  function svgImage(svg) {
    return new Promise((res) => {
      if (!svg) return res(null);
      const src = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="180" ');
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
    });
  }
  function clip(ctx, text, w) {
    text = String(text || "");
    if (ctx.measureText(text).width <= w) return text;
    while (text.length > 1 && ctx.measureText(text + "…").width > w) text = text.slice(0, -1);
    return text + "…";
  }
  async function contactSheet() {
    const all = pages().slice(0, 600);
    if (!all.length) return null;
    const cols = Math.min(8, Math.max(...store.scenes.map((s) => s.panels.length)));
    const W = 220, H = 150, PAD = 12, LABEL = 22;
    const rows = [];
    store.scenes.forEach((s, si) => {
      for (let k = 0; k < s.panels.length; k += cols) rows.push({ si, from: k, first: k === 0 });
    });
    const height = PAD + rows.reduce((h, r) => h + (r.first ? LABEL : 0) + H + PAD, 0);
    const canvas = document.createElement("canvas");
    canvas.width = PAD + cols * (W + PAD);
    canvas.height = Math.min(30000, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f7efe2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let y = PAD;
    for (const r of rows) {
      if (y > canvas.height) break;
      const s = store.scenes[r.si];
      if (r.first) {
        ctx.fillStyle = "#c45c26";
        ctx.font = "500 13px 'IBM Plex Mono', monospace";
        ctx.fillText(clip(ctx, `${r.si + 1}. ${s.name}${s.note ? " · " + s.note : ""}`, canvas.width - 2 * PAD), PAD, y + 14);
        y += LABEL;
      }
      for (let k = 0; k < cols && r.from + k < s.panels.length; k++) {
        const pi = r.from + k;
        const p = s.panels[pi];
        const v = p.v || {};
        const x = PAD + k * (W + PAD);
        ctx.fillStyle = LIGHT_BG[v.lighting] || "#fffaf2";
        ctx.fillRect(x, y, W, H);
        ctx.strokeStyle = "#1c1712";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, W - 3, H - 3);
        ctx.fillStyle = "#c45c26";
        ctx.font = "10px 'IBM Plex Mono', monospace";
        ctx.fillText(clip(ctx, `PANEL ${pi + 1}${v.emotion ? " · " + v.emotion : ""}`, W / 2), x + 8, y + 16);
        const right = [v.angleHeight, v.shotSize].filter(Boolean).join(" ");
        ctx.textAlign = "right";
        ctx.fillText(clip(ctx, right, W / 2 - 12), x + W - 8, y + 16);
        ctx.textAlign = "left";
        const img = await svgImage(stageOnly(panelHtml(s, p, pi)));
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(x + 8, y + 24, W - 16, 86);
        if (img) ctx.drawImage(img, x + 8, y + 24, W - 16, 86);
        ctx.fillStyle = "#1c1712";
        ctx.font = "12px Fraunces, Palatino, serif";
        const line = p.line || {};
        ctx.fillText(clip(ctx, `${line.who || ""} ${line.text || ""}`.trim(), W - 16), x + 8, y + 132);
      }
      y += H + PAD;
    }
    return canvas;
  }

  function download(name, blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  /* ---------- styles ---------- */
  function injectStyle() {
    if (document.getElementById("storyboard-style")) return;
    const st = document.createElement("style");
    st.id = "storyboard-style";
    st.textContent = `
      .sb { min-width: 0; max-width: 100%; }
      .sb h3 { font-family: var(--serif); font-weight: 500; font-size: 20px; margin: 0 0 4px; }
      .sb h4 { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px; }
      .sb-note { font-size: 13px; color: #3a3229; margin: 2px 0 8px; }
      .sb-note.later { font-style: italic; }
      .sb-warn { border: 1px dashed var(--saffron); background: #fff8ef; padding: 6px 8px; font-size: 13px; }
      .sb-box { border-top: 2px solid var(--ink); padding-top: 10px; margin-top: 14px; min-width: 0; }
      .sb-row { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: end; margin: 6px 0; }
      .sb-row label.field { margin: 0; min-width: 0; }
      .sb-row select, .sb-row input[type=number] { max-width: 160px; }
      .sb-views { display: flex; gap: 6px; flex-wrap: wrap; }
      .sb-views button.on { background: var(--ink); color: var(--paper); }
      .sb-viewer { outline: none; }
      .sb-viewer:focus-visible { outline: 3px solid var(--saffron); outline-offset: 4px; }
      .sb-stagewrap { display: flex; justify-content: center; min-height: 200px; }
      .sb-big { width: 100%; max-width: 620px; }
      .sb-big .panel { flex: none; width: 100%; min-height: 0; }
      .sb-big .stage { height: auto; aspect-ratio: 200 / 90; }
      .sb-big .cap { font-size: 14px; }
      .sb-big .balloon { font-size: max(16px, 1em) !important; }
      .sb-count { font-family: var(--mono); font-size: 13px; text-align: center; margin: 8px 0; }
      .sb-count b { font-family: var(--serif); font-weight: 500; font-size: 18px; }
      .sb-transport { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 12px; }
      .sb-transport button { min-width: 44px; min-height: 36px; }
      .sb-transport label { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 12px; }
      .sb-transport input[type=range] { width: 140px; max-width: 40vw; }
      .sb-thumbs { display: flex; gap: 4px; overflow-x: auto; padding: 6px 0 8px; margin-top: 8px; max-width: 100%; }
      .sb-thumb { flex: none; width: 64px; padding: 0; border: 2px solid var(--line); background: var(--panel); cursor: pointer; display: grid; font-family: var(--mono); font-size: 9px; line-height: 1.3; }
      .sb-thumb.first { border-left: 4px solid var(--saffron); }
      .sb-thumb.on { border-color: var(--ink); background: #ffe2c4; }
      .sb-thumb svg { width: 100%; height: 29px; display: block; }
      .sb-grid { display: grid; gap: 14px; }
      .sb-scene { border: 2px solid var(--ink); padding: 8px; min-width: 0; background: var(--panel); }
      .sb-scene-head { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; }
      .sb-scene-head input { flex: 1 1 140px; min-width: 0; font-family: var(--serif); font-size: 16px; }
      .sb-scene-head .sb-acts { display: flex; gap: 4px; flex-wrap: wrap; }
      .sb-scene-head .sb-acts button { font-family: var(--mono); font-size: 11px; }
      .sb-scene .strip { margin-top: 6px; }
      .sb-scene .panel { flex: 0 0 170px; min-height: 0; cursor: pointer; }
      .sb-scene .panel .cap { font-size: 11px; }
      .sb-scene .balloon { font-size: 12px !important; }
      .sb-scene .stage { height: 64px; }
      .sb-small { font-family: var(--mono); font-size: 11px; color: #7a6f63; }
      .sb-story { font-size: 13px; text-align: center; margin: 6px auto 0; max-width: 620px; color: #3a3229; }
      .sb-story .sb-who { font-weight: 600; }
      .sb-tie { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 11px; }
      .sb-tie select { font-size: 12px; max-width: 150px; }
      .sb-status { font-family: var(--mono); font-size: 12px; color: var(--saffron); min-height: 1.3em; margin: 4px 0; }
    `;
    document.head.appendChild(st);
  }

  /* ---------- the page ---------- */
  function mount(el) {
    if (!el) return null;
    injectStyle();
    const view = prefs();
    let at = 0; /* the page the flip book shows */
    let playing = false;
    let raf = 0;
    let last = 0;
    let status = "";

    function setStatus(s) {
      status = s;
      const n = el.querySelector("[data-sb=status]");
      if (n) n.textContent = s;
    }
    function persist(msg) {
      save();
      setStatus(saveError || msg || "");
    }

    function sceneOptions() {
      const opts = store.scenes.map((s, i) => `<option value="${i}">${i + 1}. ${esc(s.name)}</option>`);
      opts.push(`<option value="new" selected>${store.scenes.length + 1}. ${esc(defaultName(store.scenes.length))} (new)</option>`);
      return opts.join("");
    }

    function draw() {
      const running = window.CurioAuto && window.CurioAuto.running ? window.CurioAuto.running().length : 0;
      el.innerHTML = `<div class="sb">
        <h3>Storyboard</h3>
        <p class="sb-note">Save My film as scenes, make lots of them, and flip through them like a flip book.</p>
        <p class="sb-note later">Later this storyboard can be turned into a finished film or handed to an AI video tool.</p>

        <div class="sb-box">
          <h4>Save my film</h4>
          <div class="sb-row">
            <label class="field">Into scene
              <select data-sb="into">${sceneOptions()}</select>
            </label>
            <button type="button" data-sb="save">Save my film into this scene</button>
          </div>
          <p class="sb-small">Takes the ${panelCount()} panels of My film as they play right now, running automation included. Saving into a scene you already have replaces its panels.</p>
        </div>

        <div class="sb-box">
          <h4>Make many</h4>
          <p class="sb-note">Running automation keeps changing the film; this takes snapshots of it at evenly spaced moments, so one automation gives you many storyboards at once.</p>
          <div class="sb-row">
            <label class="field">How many
              <select data-sb="many">${[4, 8, 16, 32, 64].map((n) => `<option ${n === Number(view.many) ? "selected" : ""}>${n}</option>`).join("")}</select>
            </label>
            <label class="field">Across (seconds)
              <input type="number" data-sb="len" min="0.5" max="600" step="0.5" value="${esc(view.len)}" />
            </label>
            <label class="field">Keep each as
              <select data-sb="as">
                <option value="scenes" ${view.as === "scenes" ? "selected" : ""}>its own scene</option>
                <option value="panels" ${view.as === "panels" ? "selected" : ""}>more panels in one new scene</option>
              </select>
            </label>
            <button type="button" data-sb="make">Make them</button>
          </div>
          <p class="sb-small">${running ? `${running} automation${running === 1 ? " is" : "s are"} running now.` : "No automation is running, so every snapshot will look the same. Turn one on in a workspace first (an LFO moves on its own)."}</p>
        </div>

        <p class="sb-status" data-sb="status" role="status">${esc(saveError || status)}</p>

        <div class="sb-box">
          <div class="sb-row" style="justify-content: space-between; align-items: center">
            <div class="sb-views" role="group" aria-label="View">
              <button type="button" data-sb="view-flip" class="${view.view === "flip" ? "on" : ""}">Flip through</button>
              <button type="button" data-sb="view-grid" class="${view.view === "grid" ? "on" : ""}">All scenes</button>
            </div>
            <span class="sb-small">${store.scenes.length} scene${store.scenes.length === 1 ? "" : "s"} · ${pages().length} panel${pages().length === 1 ? "" : "s"}</span>
          </div>
          <div data-sb="body"></div>
        </div>

        <div class="sb-box">
          <h4>Take it with you</h4>
          <div class="sb-row">
            <button type="button" data-sb="json">Download storyboard (JSON)</button>
            <button type="button" data-sb="png">Download contact sheet (PNG)</button>
            <label class="field">Open a storyboard file
              <input type="file" accept="application/json,.json" data-sb="import" />
            </label>
          </div>
          <p class="sb-small">The contact sheet draws each panel's stage and its line; long captions are left out to keep it quick.</p>
        </div>
      </div>`;
      drawBody();
    }

    function drawBody() {
      const body = el.querySelector("[data-sb=body]");
      if (!body) return;
      if (!store.scenes.length) {
        body.innerHTML = `<p class="sb-note">No scenes yet. Save My film above, or make many from a running automation.</p>`;
        return;
      }
      if (view.view === "grid") body.innerHTML = gridHtml();
      else body.innerHTML = flipHtml();
      if (view.view !== "grid") showPage();
    }

    function flipHtml() {
      const thumbs = pages()
        .map((pg, k) => {
          const s = store.scenes[pg.si];
          return `<button type="button" class="sb-thumb ${pg.pi === 0 ? "first" : ""}" data-go="${k}" aria-label="Scene ${pg.si + 1}, panel ${pg.pi + 1}">${stageOnly(panelHtml(s, s.panels[pg.pi], pg.pi))}<span>${pg.si + 1}·${pg.pi + 1}</span></button>`;
        })
        .join("");
      return `<div class="sb-viewer" tabindex="0" data-sb="viewer" aria-label="Flip book. Left and right arrows move, space plays.">
          <p class="sb-count" data-sb="count"></p>
          <div class="sb-stagewrap"><div class="sb-big" data-sb="big"></div></div>
          <p class="sb-story" data-sb="story"></p>
          <div class="sb-transport">
            <button type="button" data-sb="prev" aria-label="Previous panel">◀</button>
            <button type="button" data-sb="play">${playing ? "Pause" : "Play"}</button>
            <button type="button" data-sb="next" aria-label="Next panel">▶</button>
            <label>Speed <input type="range" data-sb="speed" min="0.5" max="24" step="0.5" value="${esc(view.speed)}" /> <span data-sb="speedread">${esc(view.speed)}</span> panels a second</label>
          </div>
          <div class="sb-thumbs" data-sb="thumbs">${thumbs}</div>
          <p class="sb-small">Arrow keys move one panel; space plays and pauses. Tap a small picture to jump.</p>
        </div>`;
    }

    function showPage() {
      const all = pages();
      if (!all.length) return;
      at = ((at % all.length) + all.length) % all.length;
      const pg = all[at];
      const s = store.scenes[pg.si];
      const big = el.querySelector("[data-sb=big]");
      const count = el.querySelector("[data-sb=count]");
      if (big) big.innerHTML = panelHtml(s, s.panels[pg.pi], pg.pi);
      const tie = el.querySelector("[data-sb=story]");
      if (tie) tie.innerHTML = storyLine(s, pg.si, s.panels[pg.pi]);
      if (count)
        count.innerHTML = `Scene <b>${pg.si + 1}</b> of ${store.scenes.length} · ${esc(s.name)}${s.note ? ` <span class="sb-small">(${esc(s.note)})</span>` : ""} · panel <b>${pg.pi + 1}</b> of ${s.panels.length} · ${at + 1} / ${all.length}`;
      const strip = el.querySelector("[data-sb=thumbs]");
      if (strip) {
        const prev = strip.querySelector(".sb-thumb.on");
        if (prev) prev.classList.remove("on");
        const cur = strip.querySelector(`[data-go="${at}"]`);
        if (cur) {
          cur.classList.add("on");
          const l = cur.offsetLeft - strip.offsetLeft;
          if (l < strip.scrollLeft || l + cur.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = l - strip.clientWidth / 2 + cur.offsetWidth / 2;
        }
      }
    }

    function gridHtml() {
      return `<div class="sb-grid">${store.scenes
        .map(
          (s, si) => `<section class="sb-scene" data-scene="${si}">
          <div class="sb-scene-head">
            <span class="sb-small">${si + 1}.</span>
            <input type="text" value="${esc(s.name)}" data-rename="${si}" aria-label="Scene ${si + 1} name" />
            <div class="sb-acts">
              <button type="button" data-act="up" data-i="${si}" ${si === 0 ? "disabled" : ""} aria-label="Move scene ${si + 1} earlier">↑ Earlier</button>
              <button type="button" data-act="down" data-i="${si}" ${si === store.scenes.length - 1 ? "disabled" : ""} aria-label="Move scene ${si + 1} later">↓ Later</button>
              <button type="button" data-act="dup" data-i="${si}">Duplicate</button>
              <button type="button" data-act="del" data-i="${si}">Delete</button>
            </div>
          </div>
          ${tieHtml(s, si)}
          <p class="sb-small">${s.panels.length} panel${s.panels.length === 1 ? "" : "s"}${s.note ? " · " + esc(s.note) : ""}${s.board && s.board.title ? " · from " + esc(s.board.title) : ""}</p>
          <div class="strip">${s.panels
            .map((p, pi) => panelHtml(s, p, pi).replace("<figure ", `<figure data-open="${si}:${pi}" role="button" tabindex="0" aria-label="Open scene ${si + 1}, panel ${pi + 1} in the flip book" `))
            .join("")}</div>
        </section>`
        )
        .join("")}</div>`;
    }

    function tieHtml(s, si) {
      const n = storyCount();
      if (!n) return "";
      const k = storyOf(s, si);
      const opts = Array.from({ length: n }, (_, i) => `<option value="${i}" ${i === k ? "selected" : ""}>Story scene ${i + 1}</option>`).join("");
      return `<label class="sb-tie">Tied to <select data-tie="${si}" aria-label="Story scene for storyboard scene ${si + 1}"><option value="-1" ${k < 0 ? "selected" : ""}>no story scene</option>${opts}</select></label>`;
    }
    /* Jump to the first storyboard scene tied to story scene k. */
    function jumpStory(k) {
      const si = store.scenes.findIndex((s, i) => storyOf(s, i) === k);
      if (si < 0) {
        draw();
        setStatus(`No storyboard scene is tied to story scene ${k + 1} yet. Save My film into a scene, then tie it under All scenes.`);
        return false;
      }
      at = pages().findIndex((pg) => pg.si === si);
      if (view.view !== "flip") {
        view.view = "flip";
        savePrefs(view);
      }
      setPlaying(false);
      draw();
      setStatus(`Showing storyboard scene ${si + 1}, tied to story scene ${k + 1}.`);
      const v = el.querySelector("[data-sb=viewer]");
      if (v && v.scrollIntoView) v.scrollIntoView({ block: "start" });
      return true;
    }

    /* ---------- actions ---------- */
    function saveInto(where) {
      const panels = capture(panelCount(), performance.now());
      if (where === "new" || store.scenes[Number(where)] == null) {
        store.scenes.push(sceneRecord(panels, defaultName(store.scenes.length)));
        persist(`Saved as scene ${store.scenes.length}.`);
        at = pages().length - panels.length;
      } else {
        const i = Number(where);
        const old = store.scenes[i];
        store.scenes[i] = Object.assign(sceneRecord(panels, old.name), { id: old.id });
        persist(`Scene ${i + 1} replaced with My film.`);
        at = pages().findIndex((pg) => pg.si === i);
      }
      draw();
    }

    function makeMany() {
      const n = Math.max(1, Math.min(200, Number(view.many) || 16));
      const len = Math.max(0.5, Math.min(600, Number(view.len) || 8));
      const count = panelCount();
      const start = performance.now();
      const firstPage = pages().length;
      const firstScene = store.scenes.length;
      if (view.as === "panels") {
        const panels = [];
        for (let k = 0; k < n; k++) panels.push(...capture(count, start + (len * 1000 * k) / n));
        store.scenes.push(sceneRecord(panels, defaultName(firstScene), `${n} moments across ${len} s`));
      } else {
        for (let k = 0; k < n; k++) {
          const secs = Math.round(((len * k) / n) * 100) / 100;
          store.scenes.push(sceneRecord(capture(count, start + secs * 1000), defaultName(firstScene + k), `moment ${k + 1} of ${n}, at ${secs} s`));
        }
      }
      at = firstPage;
      persist(view.as === "panels" ? `Made one scene with ${n * count} panels.` : `Made ${n} scenes.`);
      draw();
    }

    function move(d) {
      at += d;
      showPage();
    }
    function setPlaying(on) {
      playing = on && pages().length > 1;
      const b = el.querySelector("[data-sb=play]");
      if (b) b.textContent = playing ? "Pause" : "Play";
      cancelAnimationFrame(raf);
      if (playing) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }
    function loop(now) {
      if (!el.isConnected || !playing) return (playing = false);
      const gap = 1000 / Math.max(0.5, Number(view.speed) || 4);
      if (now - last >= gap) {
        last = now - ((now - last) % gap);
        if (el.offsetParent !== null) move(1);
      }
      raf = requestAnimationFrame(loop);
    }

    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sb],[data-go],[data-act],[data-open]");
      if (!b || !el.contains(b)) return;
      if (b.dataset.go != null) {
        at = Number(b.dataset.go);
        return showPage();
      }
      if (b.dataset.open) {
        const [si, pi] = b.dataset.open.split(":").map(Number);
        at = pages().findIndex((pg) => pg.si === si && pg.pi === pi);
        view.view = "flip";
        savePrefs(view);
        return draw();
      }
      if (b.dataset.act) {
        const i = Number(b.dataset.i);
        const s = store.scenes[i];
        if (!s) return;
        if (b.dataset.act === "up" && i > 0) store.scenes.splice(i - 1, 0, store.scenes.splice(i, 1)[0]);
        if (b.dataset.act === "down" && i < store.scenes.length - 1) store.scenes.splice(i + 1, 0, store.scenes.splice(i, 1)[0]);
        if (b.dataset.act === "dup") store.scenes.splice(i + 1, 0, Object.assign(JSON.parse(JSON.stringify(s)), { id: newId(), name: s.name + " (copy)" }));
        if (b.dataset.act === "del") {
          if (!confirm(`Delete scene ${i + 1}, "${s.name}"?`)) return;
          store.scenes.splice(i, 1);
        }
        persist({ up: "Moved earlier.", down: "Moved later.", dup: "Duplicated.", del: "Deleted." }[b.dataset.act]);
        return draw();
      }
      const k = b.dataset.sb;
      if (k === "save") saveInto(el.querySelector("[data-sb=into]").value);
      else if (k === "make") makeMany();
      else if (k === "prev") move(-1);
      else if (k === "next") move(1);
      else if (k === "play") setPlaying(!playing);
      else if (k === "view-flip" || k === "view-grid") {
        view.view = k === "view-grid" ? "grid" : "flip";
        if (view.view === "grid") setPlaying(false);
        savePrefs(view);
        draw();
      } else if (k === "json") {
        download("storyboard.json", new Blob([JSON.stringify({ kind: "curiosities-storyboard", version: 1, scenes: store.scenes }, null, 2)], { type: "application/json" }));
        setStatus("Downloaded storyboard.json.");
      } else if (k === "png") {
        if (!store.scenes.length) return setStatus("Nothing to draw yet.");
        setStatus("Drawing the contact sheet…");
        contactSheet().then((c) => {
          if (!c) return setStatus("Nothing to draw yet.");
          c.toBlob((blob) => {
            if (!blob) return setStatus("The browser could not make the picture.");
            download("storyboard-contact-sheet.png", blob);
            setStatus("Downloaded the contact sheet.");
          }, "image/png");
        });
      }
    });
    el.addEventListener("keydown", (e) => {
      const fig = e.target.closest && e.target.closest("[data-open]");
      if (fig && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        fig.click();
      }
    });
    el.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.sb === "speed") {
        view.speed = Number(t.value);
        const r = el.querySelector("[data-sb=speedread]");
        if (r) r.textContent = t.value;
        savePrefs(view);
      } else if (t.dataset.sb === "len") {
        view.len = t.value;
        savePrefs(view);
      }
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.sb === "many" || t.dataset.sb === "as") {
        view[t.dataset.sb] = t.value;
        savePrefs(view);
      } else if (t.dataset.tie != null) {
        const i = Number(t.dataset.tie);
        const s = store.scenes[i];
        if (s) {
          const k = Number(t.value);
          if (k === i) delete s.story;
          else s.story = k;
          persist(k < 0 ? `Scene ${i + 1} is not tied to the story.` : `Scene ${i + 1} is tied to story scene ${k + 1}.`);
        }
      } else if (t.dataset.rename != null) {
        const s = store.scenes[Number(t.dataset.rename)];
        if (s) {
          s.name = t.value.trim() || s.name;
          persist("Renamed.");
        }
      } else if (t.dataset.sb === "import" && t.files && t.files[0]) {
        const r = new FileReader();
        r.onload = () => {
          let data = null;
          try {
            data = JSON.parse(r.result);
          } catch (err) {}
          const scenes = data && Array.isArray(data.scenes) ? data.scenes.filter((s) => s && Array.isArray(s.panels)) : null;
          if (!scenes || !scenes.length) return setStatus("That file is not a storyboard.");
          scenes.forEach((s) => store.scenes.push(Object.assign({}, s, { id: newId(), name: String(s.name || defaultName(store.scenes.length)) })));
          persist(`Added ${scenes.length} scene${scenes.length === 1 ? "" : "s"} from the file.`);
          draw();
        };
        r.readAsText(t.files[0]);
      }
    });
    /* Arrow keys flip; space plays. Only while this page is on screen and you are not typing. */
    function onKey(e) {
      if (!el.isConnected) return document.removeEventListener("keydown", onKey);
      if (el.offsetParent === null || view.view !== "flip" || !store.scenes.length) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (["input", "select", "textarea"].includes(tag) || e.target.isContentEditable) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === " " && e.target.closest && e.target.closest("[data-sb=viewer]") && !e.target.closest("button")) setPlaying(!playing);
      else return;
      e.preventDefault();
    }
    document.addEventListener("keydown", onKey);
    /* Keep the "is automation running" line honest. */
    if (window.CurioAuto && window.CurioAuto.on)
      window.CurioAuto.on((type) => {
        if (type !== "change" || !el.isConnected) return;
        const live = el.querySelector("[data-sb=make]");
        if (live && live.parentNode && live.parentNode.nextElementSibling) {
          const n = window.CurioAuto.running().length;
          live.parentNode.nextElementSibling.textContent = n
            ? `${n} automation${n === 1 ? " is" : "s are"} running now.`
            : "No automation is running, so every snapshot will look the same. Turn one on in a workspace first (an LFO moves on its own).";
        }
      });

    draw();
    const api = {
      redraw: draw,
      jumpStory,
      isLive: () => el.isConnected,
      destroy() {
        setPlaying(false);
        document.removeEventListener("keydown", onKey);
        el.innerHTML = "";
        if (active === api) active = null;
      },
    };
    active = api;
    if (pendingStory != null) {
      const k = pendingStory;
      pendingStory = null;
      jumpStory(k);
    }
    return api;
  }

  window.CuriosityStoryboard = {
    KEY,
    mount,
    /* Show the storyboard scenes tied to story scene k (0-based). Waits for the next mount if none is on screen. */
    focusStory(k) {
      k = Number(k) || 0;
      if (active && active.isLive()) return active.jumpStory(k);
      pendingStory = k;
      return false;
    },
    /* The story scene a storyboard scene is tied to (-1 for none). */
    storyOf: (si) => storyOf(store.scenes[si], si),
    /* A copy of everything kept, for other pages (and a future film or AI video export). */
    data: () => JSON.parse(JSON.stringify(store)),
  };
})();
