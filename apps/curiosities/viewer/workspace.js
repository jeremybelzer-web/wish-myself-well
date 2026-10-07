/* viewer/workspace.js: arrange the big Viewer your own way (Jeremy, 2026-10-07 01:10Z).

   "While there's only one viewer, there actually is quite a bit of negative space ... the viewer could be to the left
   of that large rectangle and on the right, taking up the same amount of size could be the automation lanes ... we
   can actually split the automation lane into two sections, like as if we're reading music from left to right, and
   then we drop down a row ... three lanes or four lanes, depending on how squashed that side window is ... That
   automation lane viewer should be able to be dragged by the upper left-hand corner to a new location below the
   viewer window and above the storyboards or below the storyboards ... the storyboards should also be draggable to
   the left or right of the view window as well. And they could also be cascading from left to right and then the next
   row ... the menu items on the left, that should also be draggable to a different location."

   Three parts move, each by the ⠿ handle at its top-left corner: drag it and drop it on one of the spots that light
   up, or click it for the same spots as a list.
   - Front and center (the lanes): Beside the picture, Under the picture, or Under the storyboards. Until you pick
     one it sits beside a single picture and under two or more. Beside the picture it takes the same width as the
     picture, and its nodes and lines wrap into 1 to 4 rows like lines of sheet music (the narrower it is, the more
     rows), each row a stretch of the scene read left to right, with the playhead running along them.
   - The storyboard: At the bottom, Left of the picture, or Right of the picture. At the side its cards run left to
     right and wrap onto the next row.
   - The menu on the left (the rail): Left, Right, or Top.
   Kept per device (localStorage curio-viewer-workspace-v1). Only in the big Viewer on a screen wider than 1100px;
   phones keep their one column. window.CurioWorkspace = { get(), set(part, spot), spots, apply() } */
(function () {
  "use strict";
  if (window.CurioWorkspace) return;
  const KEY = "curio-viewer-workspace-v1";
  const rootEl = () => document.querySelector(".cv-root.cv-viewer");
  const SPOTS = {
    lanes: [
      ["beside", "Beside the picture"],
      ["below", "Under the picture"],
      ["bottom", "Under the storyboards"],
    ],
    strip: [
      ["bottom", "At the bottom"],
      ["left", "Left of the picture"],
      ["right", "Right of the picture"],
    ],
    rail: [
      ["left", "Left"],
      ["right", "Right"],
      ["top", "Top"],
    ],
  };
  const NAMES = { lanes: "Front and center", strip: "the storyboard", rail: "the menu" };
  let ws = { lanes: "auto", strip: "bottom", rail: "left", follow: true };
  try {
    ws = Object.assign(ws, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ws));
    } catch (e) {}
  };

  const CSS = `
.ws-grip { position: absolute; top: 2px; left: 2px; z-index: 9; width: 20px; height: 20px; padding: 0 !important; border-radius: 5px !important; border: 1px solid #3a3a42 !important; background: #222226 !important; color: #b5b5bd !important; font: 13px/18px system-ui, sans-serif !important; cursor: grab; touch-action: none; display: none; }
.ws-grip:hover, .ws-grip:focus-visible { color: #062a31 !important; background: #22d3ee !important; border-color: #22d3ee !important; }
.cv-root[data-ws] .ws-grip { display: block; }
.cv-root[data-ws] .cv-strip, .cv-root[data-ws] .cvb-rail { position: relative; }
.cv-root[data-ws] .cv-under { padding-left: 26px; }
.cv-root[data-ws] .cv-strip-head { padding-left: 22px; }
.cv-root[data-ws] .cvb-rail { padding-top: 24px; }
.ws-menu { position: fixed; z-index: 2147483000; background: #1b1b1f; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); padding: 6px; display: grid; gap: 3px; font: 13px/1.3 system-ui, sans-serif; min-width: 200px; }
.ws-menu b { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #22d3ee; padding: 3px 6px; }
.ws-menu button { font: inherit; text-align: left; background: #26262b; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 5px; padding: 6px 9px; cursor: pointer; }
.ws-menu button[aria-checked="true"] { background: #22d3ee; color: #062a31; border-color: #22d3ee; font-weight: 600; }
.ws-zones { position: fixed; inset: 0; z-index: 2147482000; pointer-events: none; }
.ws-zone { position: fixed; border: 2px dashed #22d3ee; border-radius: 10px; background: rgba(34,211,238,0.10); display: grid; place-items: center; color: #e6faff; font: 600 15px system-ui, sans-serif; text-shadow: 0 1px 3px #000; }
.ws-zone.on { background: rgba(34,211,238,0.32); border-style: solid; }
body.ws-dragging, body.ws-dragging * { cursor: grabbing !important; user-select: none !important; }

/* the menu (rail) */
.cv-root.cv-big[data-ws-rail="right"] .cv-main { grid-template-columns: minmax(0, 1fr) 84px !important; }
.cv-root.cv-big[data-ws-rail="right"] .cvb-rail { grid-column: 2; }
.cv-root.cv-big[data-ws-rail="right"] .cv-main > .cv-player { grid-column: 1; grid-row: 1; }
.cv-root.cv-big[data-ws-rail="top"] .cv-main { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto minmax(0, 1fr); }
.cv-root.cv-big[data-ws-rail="top"] .cvb-rail { grid-column: 1; grid-row: 1; flex-direction: row; overflow-x: auto; overflow-y: hidden; padding-top: 0; padding-left: 26px; }
.cv-root.cv-big[data-ws-rail="top"] .cvb-rail button { grid-auto-flow: column; padding: 6px 10px; }
.cv-root.cv-big[data-ws-rail="top"] .cvb-rail .cvb-old { margin-top: 0; margin-left: auto; }
.cv-root.cv-big[data-ws-rail="top"] .cv-main > .cv-player { grid-column: 1; grid-row: 2; }

/* the storyboard beside the picture: its cards wrap into rows */
.cv-root[data-ws-strip="left"], .cv-root[data-ws-strip="right"] { grid-template-rows: auto minmax(0, 1fr) !important; }
.cv-root[data-ws-strip="right"] { grid-template-columns: minmax(0, 1fr) var(--ws-strip-w, clamp(260px, 28vw, 520px)); grid-template-areas: "bar bar" "main strip"; }
.cv-root[data-ws-strip="left"] { grid-template-columns: var(--ws-strip-w, clamp(260px, 28vw, 520px)) minmax(0, 1fr); grid-template-areas: "bar bar" "strip main"; }
.cv-root[data-ws-strip="left"] > .cv-bar, .cv-root[data-ws-strip="right"] > .cv-bar { grid-area: bar; }
.cv-root[data-ws-strip="left"] > .cv-main, .cv-root[data-ws-strip="right"] > .cv-main { grid-area: main; }
.cv-root[data-ws-strip="left"] > .cv-strip, .cv-root[data-ws-strip="right"] > .cv-strip { grid-area: strip; height: auto !important; min-height: 0; overflow: hidden; grid-template-rows: auto minmax(0, 1fr); align-content: stretch; border-top: 0; }
.cv-root[data-ws-strip="right"] > .cv-strip { border-left: 1px solid var(--c-line, #2e2e33); }
.cv-root[data-ws-strip="left"] > .cv-strip { border-right: 1px solid var(--c-line, #2e2e33); }
.cv-root[data-ws-strip="left"] .cv-cards, .cv-root[data-ws-strip="right"] .cv-cards { flex-wrap: wrap; overflow-x: hidden; overflow-y: auto; align-content: flex-start; scroll-snap-type: none; min-height: 0; }
.cv-root[data-ws-strip="left"] .cv-card, .cv-root[data-ws-strip="right"] .cv-card { flex: 0 0 calc((100% - 20px) / var(--ws-cols, 2)); }
.cv-root[data-ws-strip="left"] .cvc-ruler, .cv-root[data-ws-strip="right"] .cvc-ruler, .cv-root[data-ws-strip="left"] .cvc-line, .cv-root[data-ws-strip="right"] .cvc-line { display: none !important; }
.cv-root[data-ws-strip="left"] .cvd-border[data-border="strip"], .cv-root[data-ws-strip="right"] .cvd-border[data-border="strip"] { display: none !important; }
/* Front and center under the storyboards (moved there, after the strip) */
.cv-root[data-ws-lanes="bottom"] { grid-template-rows: auto minmax(0, 1fr) auto auto; }
.cv-root[data-ws-lanes="bottom"][data-ws-strip="left"], .cv-root[data-ws-lanes="bottom"][data-ws-strip="right"] { grid-template-rows: auto minmax(0, 1fr) auto !important; }
.cv-root[data-ws-lanes="bottom"][data-ws-strip="right"] { grid-template-areas: "bar bar" "main strip" "lanes lanes"; }
.cv-root[data-ws-lanes="bottom"][data-ws-strip="left"] { grid-template-areas: "bar bar" "strip main" "lanes lanes"; }
.cv-root[data-ws-lanes="bottom"] > .cv-under { grid-area: auto; margin: 0 6px 6px !important; max-height: 40vh; overflow: auto; }
.cv-root[data-ws-lanes="bottom"][data-ws-strip="left"] > .cv-under, .cv-root[data-ws-lanes="bottom"][data-ws-strip="right"] > .cv-under { grid-area: lanes; }
.cv-root[data-ws-lanes]:not([data-ws-lanes="below"]) .cvd-border[data-border="lane"] { display: none !important; }
.cv-root[data-ws-lanes]:not([data-ws-lanes="below"]) .cv-under { margin-left: 0 !important; margin-right: 0 !important; height: auto !important; box-shadow: none; }
.cv-root[data-ws-lanes]:not([data-ws-lanes="below"]) .cf-grip { display: none; }

/* Front and center beside the picture, the same width, its nodes and lines wrapping like sheet music */
.cv-root[data-ws-lanes="beside"] .cv-player { grid-template-columns: minmax(0, var(--ws-stage-w, 1fr)) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto !important; }
.cv-root[data-ws-lanes="beside"] .cv-player > .cv-stage { grid-column: 1; grid-row: 1; }
.cv-root[data-ws-lanes="beside"] .cv-player > .cv-under { grid-column: 2; grid-row: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; }
.cv-root[data-ws-lanes="beside"] .cv-player > .cv-transport { grid-column: 1 / -1; grid-row: 2; }
.cv-root[data-ws-lanes="beside"] .cv-under > .cf-pane { flex: 1 1 auto; min-height: 0; }
.cv-root[data-ws-lanes="beside"] .cv-under[data-tab="focus"] .cf-pane-focus { grid-template-rows: auto minmax(0, 1fr); }
.cv-root[data-ws-lanes="beside"] .cf-charts { grid-template-columns: 64px minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); grid-template-areas: "pie list" "sheet sheet"; min-height: 0; }
.cv-root[data-ws-lanes="beside"] .cf-charts .cf-pie { grid-area: pie; }
.cv-root[data-ws-lanes="beside"] .cf-charts .cf-list { grid-area: list; grid-column: auto; height: 64px; }
.cv-root[data-ws-lanes="beside"] .cf-lanes { max-height: none !important; overflow: visible; }
.ws-src { display: none !important; }
.cv-root .cv-views-menu > .ws-follow { display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; gap: 8px; border-bottom: 1px solid var(--c-line, #2e2e33); margin-bottom: 2px; }
.ws-follow > span:last-child { display: grid; gap: 1px; }
.ws-sw { position: relative; width: 32px; height: 18px; border-radius: 9px; background: #3a3a42; transition: background 0.15s; }
.ws-sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: left 0.15s; }
.ws-follow[aria-checked="true"] .ws-sw { background: #22d3ee; }
.ws-follow[aria-checked="true"] .ws-sw::after { left: 16px; }
.cf-charts > .ws-sheet { grid-area: sheet; }
.ws-sheet { display: grid; grid-auto-rows: minmax(52px, 1fr); gap: 6px; min-height: 0; }
.ws-sheet.ws-lanes { grid-auto-rows: auto; gap: 10px; }
.ws-sheet .cf-graph { height: auto; min-height: 52px; }
.ws-sys { position: relative; }
.ws-sys > .ws-n { position: absolute; left: 3px; top: 1px; z-index: 2; font: 600 9.5px/1 system-ui, sans-serif; color: #8b8b94; pointer-events: none; }
.ws-slice { position: absolute; top: 0; bottom: 0; }
.ws-slice > .cf-ln-in { inset: 5px 0; }
`;

  /* ---------- what is on now ---------- */
  const wide = () => window.innerWidth > 1100;
  const active = (root) => !!root && root.classList.contains("cv-big") && !root.classList.contains("cv-comic") && wide();
  const pictures = (root) => root.querySelectorAll(".cv-wins .cv-win").length;
  /* "Lanes follow the window" (Jeremy 2026-10-07 01:29Z, on by default, at the top of Views ▾): when the top part is
     short enough that the pictures leave room at their side, they move over and the lanes take that room; when it
     is tall enough for the pictures to fill the width, the lanes drop under them. */
  const LANE_MIN = 400;
  function fitSpot(root) {
    const player = root.querySelector(".cv-player");
    const tr = player && player.querySelector(":scope > .cv-transport");
    const win = root.querySelector(".cv-wins .cv-win");
    if (!player || !win || !win.offsetHeight) return { at: pictures(root) > 1 ? "below" : "beside" };
    const ratio = win.offsetWidth / win.offsetHeight;
    const n = pictures(root);
    /* the pictures' height beside the lanes: the Player less its padding, the transport row and the gap */
    const h = player.clientHeight - 12 - (tr ? tr.offsetHeight + 6 : 0) - 12;
    const picsW = Math.round(n * h * ratio + (n - 1) * 10 + 16);
    const room = player.clientWidth - 12 - picsW;
    const was = root.dataset.wsLanes === "beside";
    return { at: room >= (was ? LANE_MIN - 40 : LANE_MIN) ? "beside" : "below", picsW };
  }
  let fit = null;
  function lanesSpot(root) {
    fit = null;
    if (ws.lanes === "auto" && ws.follow) {
      fit = fitSpot(root);
      return fit.at;
    }
    if (ws.lanes === "auto") return pictures(root) > 1 ? "below" : "beside";
    return ws.lanes;
  }

  /* ---------- put the parts where they go ---------- */
  let applying = false;
  function apply() {
    const root = rootEl();
    if (!root || applying) return;
    applying = true;
    try {
      const under = root.querySelector(".cv-under");
      const player = root.querySelector(".cv-player");
      const on = active(root);
      const lanes = on ? lanesSpot(root) : "";
      const set = (k, v) => (v ? (root.dataset[k] = v) : delete root.dataset[k]);
      set("ws", on ? "1" : "");
      set("wsLanes", lanes);
      set("wsStrip", on && ws.strip !== "bottom" ? ws.strip : "");
      set("wsRail", on && ws.rail !== "left" ? ws.rail : "");
      /* following the window, the pictures keep their own width and the lanes take the rest */
      if (player) {
        if (lanes === "beside" && fit && fit.picsW) player.style.setProperty("--ws-stage-w", fit.picsW + "px");
        else player.style.removeProperty("--ws-stage-w");
      }
      toggle(root);
      /* under the storyboards it leaves the Player for the end of the page; anywhere else it goes back */
      if (under && player) {
        if (lanes === "bottom" && under.parentNode !== root) root.insertBefore(under, root.querySelector(":scope > .cv-strip").nextSibling);
        else if (lanes !== "bottom" && under.parentNode !== player) player.insertBefore(under, player.querySelector(":scope > .cv-transport"));
      }
      grips(root);
      stripCols(root);
      sheet(root);
    } finally {
      applying = false;
    }
  }
  /* everything that measures the layout measures again */
  function after() {
    window.dispatchEvent(new Event("resize"));
    if (window.CurioFit) window.CurioFit.now();
    if (window.CurioComic && window.CurioComic.place) window.CurioComic.place();
  }
  function set(part, spot) {
    if (!SPOTS[part] || !SPOTS[part].some((s) => s[0] === spot)) return false;
    ws[part] = spot;
    /* putting the lanes somewhere yourself stops them following the window */
    if (part === "lanes") ws.follow = false;
    save();
    apply();
    after();
    return true;
  }

  /* the switch at the top of Views ▾ */
  function follow(on) {
    ws.follow = !!on;
    if (on) ws.lanes = "auto";
    save();
    apply();
    after();
  }
  function toggle(root) {
    const m = root.querySelector(".cv-views-menu");
    if (!m) return;
    let b = m.querySelector(":scope > .ws-follow");
    if (!b) {
      b = document.createElement("button");
      b.type = "button";
      b.className = "ws-follow";
      b.setAttribute("role", "menuitemcheckbox");
      b.innerHTML = `<span class="ws-sw" aria-hidden="true"></span><span>Lanes follow the window<small>beside the pictures when there is room, under them when not</small></span>`;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        follow(!(ws.follow && ws.lanes === "auto"));
      });
      m.prepend(b);
    }
    b.setAttribute("aria-checked", String(ws.follow && ws.lanes === "auto"));
  }

  /* the storyboard at the side: as many cards in a row as fit at about 150px */
  function stripCols(root) {
    const st = root.querySelector(".cv-strip");
    if (!st) return;
    if (!root.dataset.wsStrip) return st.style.removeProperty("--ws-cols");
    st.style.setProperty("--ws-cols", String(Math.max(1, Math.min(4, Math.floor((st.clientWidth - 20) / 150)))));
  }

  /* ---------- the nodes and lines as sheet music ---------- */
  /* how many rows: the narrower Front and center is, the more */
  function rowsFor(w) {
    return w >= 1000 ? 1 : w >= 560 ? 2 : w >= 400 ? 3 : 4;
  }
  let sheetSig = "";
  function sheet(root) {
    const box = root.querySelector(".cv-under");
    if (!box) return;
    const beside = root.dataset.wsLanes === "beside";
    const n = beside ? rowsFor(box.clientWidth) : 1;
    const srcs = [box.querySelector(".cf-graph:not(.ws-copy)"), box.querySelector(".cf-lanes:not(.ws-copy)")].filter(Boolean);
    const sig = n + "|" + srcs.map((s) => s.dataset.wsGen || "").join(",");
    const fresh = srcs.every((s) => s.dataset.wsGen && s.nextElementSibling && s.nextElementSibling.classList.contains("ws-sheet"));
    if (n > 1 && fresh && sig === sheetSig) return;
    box.querySelectorAll(".ws-sheet").forEach((s) => s.remove());
    srcs.forEach((s) => s.classList.remove("ws-src"));
    sheetSig = "";
    if (n <= 1) return;
    srcs.forEach((src) => {
      src.dataset.wsGen = String((+src.dataset.wsGen || 0) + 1);
      const isLanes = src.classList.contains("cf-lanes");
      const wrap = document.createElement("div");
      wrap.className = "ws-sheet" + (isLanes ? " ws-lanes" : "");
      for (let k = 0; k < n; k++) {
        const c = src.cloneNode(true);
        c.classList.add("ws-copy", "ws-sys");
        delete c.dataset.wsGen;
        /* each track shows its own stretch of the scene: the k-th of n, read left to right */
        const tracks = c.classList.contains("cf-ln-track") ? [c] : [...c.querySelectorAll(".cf-ln-track")];
        tracks.forEach((t) => {
          const sl = document.createElement("div");
          sl.className = "ws-slice";
          sl.style.width = n * 100 + "%";
          sl.style.left = -k * 100 + "%";
          while (t.firstChild) sl.appendChild(t.firstChild);
          t.appendChild(sl);
        });
        const lab = document.createElement("span");
        lab.className = "ws-n";
        lab.textContent = `${k + 1}/${n}`;
        c.appendChild(lab);
        wrap.appendChild(c);
      }
      src.classList.add("ws-src");
      src.after(wrap);
    });
    sheetSig = n + "|" + srcs.map((s) => s.dataset.wsGen).join(",");
  }

  /* ---------- the handles, the list and the drop spots ---------- */
  function grips(root) {
    const places = { lanes: root.querySelector(".cv-under"), strip: root.querySelector(".cv-strip"), rail: root.querySelector(".cvb-rail") };
    Object.entries(places).forEach(([part, el]) => {
      if (!el || el.querySelector(`:scope > .ws-grip[data-ws-grip="${part}"]`)) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ws-grip";
      b.dataset.wsGrip = part;
      b.textContent = "⠿";
      b.title = `Drag to move ${NAMES[part]}, or click for the places it can go`;
      b.setAttribute("aria-label", `Move ${NAMES[part]}`);
      b.setAttribute("aria-haspopup", "menu");
      el.prepend(b);
    });
  }
  let menu = null;
  function closeMenu() {
    if (menu) menu.remove();
    menu = null;
  }
  function openMenu(grip) {
    closeMenu();
    const part = grip.dataset.wsGrip;
    const root = rootEl();
    const cur = part === "lanes" ? lanesSpot(root) : ws[part];
    menu = document.createElement("div");
    menu.className = "ws-menu";
    menu.setAttribute("role", "menu");
    menu.innerHTML = `<b>Move ${NAMES[part]}</b>` + SPOTS[part].map(([id, label]) => `<button type="button" role="menuitemradio" aria-checked="${id === cur}" data-ws-spot="${id}">${label}</button>`).join("");
    document.body.appendChild(menu);
    const r = grip.getBoundingClientRect();
    menu.style.left = Math.max(6, Math.min(innerWidth - menu.offsetWidth - 6, r.left)) + "px";
    menu.style.top = Math.max(6, Math.min(innerHeight - menu.offsetHeight - 6, r.bottom + 4)) + "px";
    menu.dataset.part = part;
    const first = menu.querySelector('[aria-checked="true"]') || menu.querySelector("button");
    if (first) first.focus();
  }
  /* where each spot is on the screen while you drag */
  function zones(part) {
    const root = rootEl();
    const R = (el) => el.getBoundingClientRect();
    const m = R(root.querySelector(".cv-main"));
    const rt = R(root);
    const box = (l, t, w, h) => ({ l, t, w, h });
    const Z = {};
    if (part === "lanes") {
      Z.beside = box(m.left + m.width * 0.5, m.top + 6, m.width * 0.5 - 6, m.height * 0.6 - 12);
      Z.below = box(m.left + 6, m.top + m.height * 0.6, m.width - 12, m.height * 0.4 - 6);
      Z.bottom = box(rt.left + 6, rt.bottom - Math.max(90, rt.height * 0.16), rt.width - 12, Math.max(90, rt.height * 0.16) - 6);
    } else if (part === "strip") {
      Z.left = box(m.left + 6, m.top + 6, m.width * 0.3, m.height - 12);
      Z.right = box(m.right - m.width * 0.3 - 6, m.top + 6, m.width * 0.3, m.height - 12);
      Z.bottom = box(rt.left + 6, rt.bottom - Math.max(110, rt.height * 0.2), rt.width - 12, Math.max(110, rt.height * 0.2) - 6);
    } else {
      Z.left = box(rt.left + 6, m.top + 60, 140, m.height - 66);
      Z.right = box(rt.right - 146, m.top + 60, 140, m.height - 66);
      Z.top = box(rt.left + 160, m.top + 6, rt.width - 320, 48);
    }
    return Z;
  }
  let drag = null;
  function down(e) {
    const g = e.target.closest && e.target.closest(".ws-grip");
    if (!g || e.button) return;
    e.preventDefault();
    e.stopPropagation();
    drag = { g, part: g.dataset.wsGrip, x: e.clientX, y: e.clientY, on: false, at: "" };
    g.setPointerCapture && g.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.on = true;
      closeMenu();
      document.body.classList.add("ws-dragging");
      const layer = document.createElement("div");
      layer.className = "ws-zones";
      const Z = zones(drag.part);
      layer.innerHTML = SPOTS[drag.part].map(([id, label]) => (Z[id] ? `<div class="ws-zone" data-ws-zone="${id}" style="left:${Z[id].l}px;top:${Z[id].t}px;width:${Z[id].w}px;height:${Z[id].h}px">${label}</div>` : "")).join("");
      document.body.appendChild(layer);
      drag.layer = layer;
      drag.Z = Z;
    }
    drag.at = "";
    for (const [id, z] of Object.entries(drag.Z)) if (e.clientX >= z.l && e.clientX <= z.l + z.w && e.clientY >= z.t && e.clientY <= z.t + z.h) drag.at = id;
    drag.layer.querySelectorAll(".ws-zone").forEach((z) => z.classList.toggle("on", z.dataset.wsZone === drag.at));
  }
  function up() {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.on) return openMenu(d.g);
    document.body.classList.remove("ws-dragging");
    d.layer.remove();
    if (d.at) set(d.part, d.at);
  }

  let soonQ = false;
  function soon() {
    if (soonQ) return;
    soonQ = true;
    requestAnimationFrame(() => {
      soonQ = false;
      const root = rootEl();
      const before = root ? [root.dataset.wsLanes, root.dataset.wsStrip, root.dataset.wsRail].join() : "";
      apply();
      if (root && before !== [root.dataset.wsLanes, root.dataset.wsStrip, root.dataset.wsRail].join()) after();
    });
  }
  function wire() {
    const root = rootEl();
    if (!root || !root.querySelector(".cv-under") || !root.querySelector(".cv-wins")) return setTimeout(wire, 300);
    const css = document.createElement("style");
    css.textContent = CSS;
    document.head.appendChild(css);
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("click", (e) => {
      const s = e.target.closest && e.target.closest(".ws-menu [data-ws-spot]");
      if (s) {
        const part = menu.dataset.part;
        closeMenu();
        return void set(part, s.dataset.wsSpot);
      }
      if (menu && !(e.target.closest && (e.target.closest(".ws-menu") || e.target.closest(".ws-grip")))) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu) {
        e.stopPropagation();
        closeMenu();
      }
    }, true);
    /* the big Viewer on or off, Read as a comic, a picture added or taken away, the lane rebuilt, a resize */
    new MutationObserver(soon).observe(root, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(soon).observe(root.querySelector(".cv-wins"), { childList: true });
    const box = root.querySelector(".cv-under");
    new MutationObserver((ms) => {
      /* the lane's own redraws (its graph and lanes rebuilt), not our copies of them */
      if (ms.some((m) => ![...m.addedNodes, ...m.removedNodes].every((n) => n.nodeType !== 1 || n.classList.contains("ws-sheet") || n.classList.contains("ws-slice") || n.classList.contains("ws-n") || (n.closest && n.closest(".ws-sheet"))))) soon();
    }).observe(box, { childList: true, subtree: true });
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(soon);
      ro.observe(box);
      ro.observe(root.querySelector(".cv-player"));
    }
    window.addEventListener("resize", soon);
    apply();
    after();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioWorkspace = { get: () => Object.assign({}, ws), set, follow, spots: SPOTS, apply };
})();
