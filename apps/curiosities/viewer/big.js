/* viewer/big.js: the big Viewer (Jeremy, 2026-10-06 05:38Z, after the Show me clips): "all that information on one
   screen was confusing ... it needs to be broken up into multiple screens, like multiple tabs inside of a window. And
   the window needs to be really big." He liked the Viewer as it first was: a really big picture, the storyboards
   across the whole bottom, and just above them the lane of automatable curiosity views, long and not too tall,
   running from a vertical rectangle on the left to the right side. A second picture window should be just as big
   and crowd out what is left and right of it.

   So, while it is on (the default): the left and right panels leave the screen. A slim rail on the left lists them
   (In the scene, Move it, Camera & lens, Words and any tab another part adds); a button opens that panel as one big
   window with tabs on the right half of the screen, so the picture stays in view while you change it. ✕ or Esc
   closes it. The picture, Front and center (with its tabs, already running to the right edge) and the Storyboard get the
   room; the storyboard cards are a little smaller (Jeremy 05:43Z).
   "Side panels" in the rail's last button puts the old three-column Viewer back (kept per device). Browser tests
   (navigator.webdriver) start with the side panels unless curio-viewer-big-v1 is "1".

   window.CurioBigView = { on(), set(bool), show("things" | "<tab id>" | ""), panel() } */
(function () {
  "use strict";
  const KEY = "curio-viewer-big-v1";
  const rootEl = () => document.querySelector(".cv-root.cv-viewer");
  /* Browser tests start with the side panels (the older suites look for them); people start big. */
  let on = !(typeof navigator !== "undefined" && navigator.webdriver);
  try {
    const v = localStorage.getItem(KEY);
    if (v) on = v === "1";
  } catch (e) {}
  let panel = "";

  const CSS = `
.cv-root.cv-big .cv-main { grid-template-columns: 84px minmax(0, 1fr) !important; }
.cv-root.cv-big .cv-main > .cv-things, .cv-root.cv-big .cv-main > .cv-details { display: none !important; }
.cv-root.cv-big .cvd-border[data-border="left"], .cv-root.cv-big .cvd-border[data-border="right"] { display: none !important; }
.cvb-rail { display: none; }
.cv-root.cv-big .cvb-rail { display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow-y: auto; grid-column: 1; grid-row: 1 / -1; }
.cv-root .cvb-rail button { display: grid; justify-items: center; gap: 3px; padding: 10px 4px; font-size: 11.5px; line-height: 1.2; text-align: center; border-radius: 8px; }
.cv-root .cvb-rail button i { font-style: normal; font-size: 20px; }
.cv-root .cvb-rail button.on { color: var(--c-accent, #22d3ee); box-shadow: inset 0 0 0 1px var(--c-accent, #22d3ee); }
.cv-root .cvb-rail .cvb-old { margin-top: auto; font-size: 10.5px; opacity: 0.75; }
.cv-root.cv-big .cv-main > .cv-player { grid-column: 2; }
.cv-root.cv-big .cv-card { flex-basis: 140px; font-size: 11px; }
.cv-root.cv-big .cv-cards { gap: 8px; }
.cvb-win { display: none; }
.cv-root.cv-big .cvb-win:not([hidden]) { display: grid; grid-template-rows: auto minmax(0, 1fr); position: absolute; z-index: 20; top: 52px; right: 10px; bottom: 10px; width: min(760px, 52vw); background: var(--c-panel, #1c1c1f); border: 1px solid var(--c-accent, #22d3ee); border-radius: 10px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); overflow: hidden; }
.cvb-win-h { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--c-line, #2e2e33); }
.cvb-tabs { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; }
.cv-root .cvb-tabs button { font-size: 14px; padding: 7px 14px; background: transparent; }
.cv-root .cvb-tabs button.on { background: var(--c-raised, #2a2a2e); color: var(--c-text, #ececee); font-weight: 600; }
.cv-root .cvb-x { font-size: 16px; padding: 4px 12px; }
.cvb-body { min-height: 0; display: grid; overflow: hidden; }
.cvb-body > .cv-things, .cvb-body > .cv-details { display: none !important; margin: 0 !important; padding-bottom: 0 !important; border-radius: 0; }
.cvb-win[data-panel="things"] .cvb-body > .cv-things { display: grid !important; overflow-y: auto; }
.cvb-win:not([data-panel="things"]) .cvb-body > .cv-details { display: grid !important; }
.cvb-body > .cv-details .cv-tabs { display: none; }
.cvb-body .cv-body { font-size: 14px; }
@media (max-width: 760px) {
  .cv-root.cv-big .cv-main { grid-template-columns: minmax(0, 1fr) !important; }
  .cv-root.cv-big .cvb-rail { flex-direction: row; grid-row: auto; overflow-x: auto; }
  .cv-root.cv-big .cv-main > .cv-player { grid-column: 1; }
  .cv-root.cv-big .cvb-win:not([hidden]) { left: 6px; right: 6px; top: 6px; bottom: 6px; width: auto; }
}`;

  /* The panels the rail opens: In the scene, then every Details tab (read from the Viewer, so added tabs come too). */
  function list(root) {
    const out = [["things", "In the scene", "🎬"]];
    const icons = { move: "✥", camera: "🎥", words: "💬", build: "✏️", flight: "🛩", people: "🙂" };
    root.querySelectorAll(".cv-details .cv-tabs [data-tab]").forEach((b) => out.push([b.dataset.tab, b.textContent.trim(), icons[b.dataset.tab] || "▦"]));
    return out;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }
  function build(root) {
    if (root.querySelector(".cvb-rail")) return true;
    const main = root.querySelector(".cv-main");
    const things = root.querySelector(".cv-things");
    const details = root.querySelector(".cv-details");
    if (!main || !things || !details) return false;
    const rail = document.createElement("nav");
    rail.className = "cvb-rail";
    rail.setAttribute("aria-label", "Open a panel");
    main.insertBefore(rail, main.firstChild);
    const win = document.createElement("section");
    win.className = "cvb-win";
    win.hidden = true;
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", "Panels");
    win.innerHTML = `<header class="cvb-win-h"><nav class="cvb-tabs" role="tablist"></nav><button type="button" class="cvb-x" data-cvb="" title="Close (Esc)" aria-label="Close">✕</button></header><div class="cvb-body"></div>`;
    root.appendChild(win);
    root.addEventListener("click", onClick, true);
    return true;
  }
  /* The panels sit in the big window while it is on and go back to their columns when it is off. */
  function apply() {
    const root = rootEl();
    if (!root || !build(root)) return;
    const main = root.querySelector(".cv-main");
    const player = root.querySelector(".cv-player");
    const things = root.querySelector(".cv-things");
    const details = root.querySelector(".cv-details");
    const win = root.querySelector(".cvb-win");
    const body = win.querySelector(".cvb-body");
    root.classList.toggle("cv-big", on);
    if (on) {
      if (things.parentNode !== body) body.appendChild(things);
      if (details.parentNode !== body) body.appendChild(details);
    } else {
      if (things.parentNode !== main) main.insertBefore(things, player);
      if (details.parentNode !== main) main.insertBefore(details, player.nextSibling);
      panel = "";
    }
    const items = list(root);
    const onTab = root.querySelector(".cv-details .cv-tabs button.on");
    const cur = panel === "things" ? "things" : panel ? (onTab && onTab.dataset.tab) || panel : "";
    root.querySelector(".cvb-rail").innerHTML =
      items.map(([id, label, ico]) => `<button type="button" data-cvb="${id}" class="${panel && cur === id ? "on" : ""}" title="Open ${esc(label)} in a big window"><i aria-hidden="true">${ico}</i>${esc(label)}</button>`).join("") +
      `<button type="button" class="cvb-old" data-cvb-old title="Put the panels back on the left and right of the picture">Side panels</button>`;
    win.querySelector(".cvb-tabs").innerHTML = items.map(([id, label]) => `<button type="button" role="tab" data-cvb="${id}" class="${cur === id ? "on" : ""}" aria-selected="${cur === id}">${esc(label)}</button>`).join("");
    win.hidden = !on || !panel;
    win.dataset.panel = panel === "things" ? "things" : "details";
    redraw();
  }
  function redraw() {
    const v = window.CurioViewer;
    requestAnimationFrame(() => {
      /* Front and center measures the room beside the picture on a resize, so it stretches to the new edges. */
      window.dispatchEvent(new Event("resize"));
      if (v && v.redraw) v.redraw();
    });
  }
  function show(id) {
    const root = rootEl();
    if (!root) return;
    panel = id || "";
    if (panel && panel !== "things") {
      const t = root.querySelector(`.cv-details .cv-tabs [data-tab="${panel}"]`);
      if (t && !t.classList.contains("on")) {
        showing = true;
        t.click();
        showing = false;
      }
    }
    apply();
  }
  let showing = false;
  function onClick(e) {
    if (!on) {
      const old = e.target.closest && e.target.closest("[data-cvb-old]");
      return old ? set(true) : undefined;
    }
    const tab = e.target.closest && e.target.closest(".cv-details .cv-tabs [data-tab]");
    /* a Details tab picked another way (the App Walkthrough, a hook) opens the window on it */
    if (tab && !showing) return void setTimeout(() => show(tab.dataset.tab));
    const old = e.target.closest && e.target.closest("[data-cvb-old]");
    if (old) return set(false);
    const b = e.target.closest && e.target.closest("[data-cvb]");
    if (!b) return;
    e.stopPropagation();
    const id = b.dataset.cvb;
    show(b.closest(".cvb-rail") && id && panel && (id === panel) ? "" : id);
  }
  function set(v) {
    on = !!v;
    try {
      localStorage.setItem(KEY, on ? "1" : "0");
    } catch (e) {}
    apply();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !on || !panel) return;
    const root = rootEl();
    if (!root || root.hidden) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
    show("");
  });

  function boot() {
    const st = document.createElement("style");
    st.id = "cvb-css";
    st.textContent = CSS;
    document.head.appendChild(st);
    /* The Viewer builds itself when it opens; the rail follows, and picks up Details tabs other parts add later. */
    const tick = () => {
      const root = rootEl();
      if (root) {
        const n = root.querySelectorAll(".cv-details .cv-tabs [data-tab]").length + (root.classList.contains("cv-big") === on ? 0 : 100);
        if (n !== tick.n || !root.querySelector(".cvb-rail")) {
          tick.n = n;
          apply();
        }
      }
      setTimeout(tick, 500);
    };
    tick();
  }
  window.CurioBigView = { on: () => on, set, show, panel: () => panel };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
