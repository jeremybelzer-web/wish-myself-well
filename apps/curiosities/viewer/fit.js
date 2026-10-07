/* viewer/fit.js: what is inside Front and center and the Storyboard fits the size you drag them to (Jeremy,
   2026-10-07 01:06Z): "when I resized those windows, it did not change the contents ... it should still attempt to
   make itself legible and usable."

   Front and center (the lane of automation views under the picture), once you drag its border:
   - smaller than its contents: everything in it gets tinier, the same amount, so all of it still shows;
   - too small for that to stay readable (under 55%): it stays at that smallest size and shows only the part you
     work with, the nodes and lines (the graph, the colored moments or the automation lanes, for the tab that is
     open); the tabs and buttons above it are a scroll up away.
   The Storyboard, once you drag its border: the cards get smaller with the strip, so every one can still be picked.
   First the whole card shrinks; then the words under the picture go and the picture with its title shrinks; at
   the smallest only the picture and its number are left.
   Back to the usual size (double-click a border) puts everything back as it was. Uses CSS zoom, so clicks and drags
   still land where you see them. window.CurioFit = { lane(), strip(), now() } */
(function () {
  "use strict";
  if (window.CurioFit) return;
  const rootEl = () => document.querySelector(".cv-root.cv-viewer");
  const LANE_MIN = 0.55;
  /* card levels, biggest first: the smallest zoom each one may use before the next one takes over */
  const CARD = [
    ["", 0.75],
    ["pic", 0.6],
    ["tiny", 0.2],
  ];
  const WORKS = { focus: ".cf-charts", moments: ".cf-rows", lanes: ".cf-lanes" };

  const CSS = `
.cv-under[data-fit] > :not(.cf-grip) { zoom: var(--cf-fit, 1); }
.cv-under[data-fit="small"] { padding-bottom: var(--cf-fit-tail, 7px); }
.cv-root.cvd-on .cv-under[data-cvd-sized] { overflow-y: auto; overflow-x: hidden; align-content: start; overscroll-behavior: contain; }
.cv-strip[data-fit] .cv-cards > * { zoom: var(--cv-fit, 1); }
.cv-strip[data-fit] .cv-cards, .cv-strip[data-fit-measure] .cv-cards { align-items: flex-start; }
.cv-strip[data-fit] .cv-card, .cv-strip[data-fit-measure] .cv-card { height: max-content; }
.cv-strip[data-fit="pic"] .cv-card .cv-cap, .cv-strip[data-fit="pic"] .cv-card .cv-how, .cv-strip[data-fit="pic"] .cv-card .cv-focus,
.cv-strip[data-fit="tiny"] .cv-card > :not(canvas):not(.cv-num) { display: none !important; }
.cv-strip[data-fit="pic"] .cv-card canvas, .cv-strip[data-fit="tiny"] .cv-card canvas { border-bottom: 0; }
.cv-strip[data-fit="tiny"] .cv-card .cv-num { font-size: 13px; }
.cv-root.cvd-on .cv-strip[data-cvd-sized] { align-content: start; }
`;

  /* ---------- Front and center ---------- */
  function lane() {
    const box = document.querySelector(".cv-root .cv-under");
    if (!box) return;
    const clear = () => {
      if (!box.hasAttribute("data-fit")) return;
      box.removeAttribute("data-fit");
      box.style.removeProperty("--cf-fit");
      box.style.removeProperty("--cf-fit-tail");
      delete box.dataset.fitScrolled;
    };
    /* only under the picture: beside it or under the storyboards it has its own room (viewer/workspace.js) */
    const ws = box.closest(".cv-root") && box.closest(".cv-root").dataset.wsLanes;
    if (box.hidden || !box.hasAttribute("data-cvd-sized") || !box.closest(".cvd-on") || (ws && ws !== "below")) return clear();
    const H = box.clientHeight;
    const tail = box.style.getPropertyValue("--cf-fit-tail");
    const top = box.scrollTop;
    /* the contents' own height, at full size */
    box.style.setProperty("--cf-fit", "1");
    box.style.removeProperty("--cf-fit-tail");
    const N = box.scrollHeight;
    if (N <= H + 1) return clear();
    const pad = parseFloat(getComputedStyle(box).paddingTop) + parseFloat(getComputedStyle(box).paddingBottom);
    const s = Math.max(0.2, (H - pad) / Math.max(1, N - pad));
    if (s >= LANE_MIN) {
      box.dataset.fit = "shrink";
      box.style.setProperty("--cf-fit", s.toFixed(3));
      delete box.dataset.fitScrolled;
      return;
    }
    box.style.setProperty("--cf-fit", String(LANE_MIN));
    const tab = box.dataset.tab || "focus";
    if (box.dataset.fit === "small" && box.dataset.fitScrolled === tab && tail) {
      /* still small, same tab: leave it where you scrolled it */
      box.style.setProperty("--cf-fit-tail", tail);
      box.scrollTop = top;
      return;
    }
    box.dataset.fit = "small";
    /* scroll the nodes and lines to the top; the tabs and buttons stay a scroll up away */
    const w = box.querySelector(WORKS[tab] || WORKS.focus);
    if (w && w.offsetParent) {
      /* room under the last part, so it can scroll all the way up even when it is the bottom one */
      box.style.setProperty("--cf-fit-tail", Math.max(7, H - w.getBoundingClientRect().height) + "px");
      box.scrollTop = w.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 2;
      box.dataset.fitScrolled = tab;
    }
  }

  /* ---------- the Storyboard ---------- */
  function strip() {
    const st = document.querySelector(".cv-root .cv-strip");
    const cards = st && st.querySelector(".cv-cards");
    if (!cards) return;
    const clear = () => {
      if (!st.hasAttribute("data-fit")) return;
      st.removeAttribute("data-fit");
      st.style.removeProperty("--cv-fit");
    };
    const root = st.closest(".cv-root");
    if (!st.hasAttribute("data-cvd-sized") || !root.classList.contains("cvd-on") || root.classList.contains("cv-comic") || root.dataset.wsStrip) return clear();
    const cs = getComputedStyle(st);
    const gap = parseFloat(cs.rowGap) || 0;
    /* the room left for the cards: the strip less its padding and everything above the cards */
    let R = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    [...st.children].forEach((c) => {
      const p = getComputedStyle(c).position;
      if (c !== cards && c.offsetParent && p !== "absolute" && p !== "fixed") R -= c.offsetHeight + gap;
    });
    const cc = getComputedStyle(cards);
    const scroll = cards.offsetHeight - cards.clientHeight;
    R -= parseFloat(cc.paddingTop) + parseFloat(cc.paddingBottom) + Math.max(0, scroll) + 2;
    const tallest = () => Math.max(1, ...[...cards.querySelectorAll(".cv-card")].map((c) => c.offsetHeight));
    st.style.setProperty("--cv-fit", "1");
    /* measured at their own full height, not squeezed into the strip */
    st.setAttribute("data-fit-measure", "");
    try {
      return pick();
    } finally {
      st.removeAttribute("data-fit-measure");
    }
    function pick() {
      for (const [level, min] of CARD) {
        if (level) st.dataset.fit = level;
        else st.removeAttribute("data-fit");
        const N = tallest();
        if (!level && N <= R) return clear();
        const s = R / N;
        if (s >= min || level === "tiny") {
          st.dataset.fit = level || "shrink";
          st.style.setProperty("--cv-fit", Math.max(min, Math.min(1, s)).toFixed(3));
          return;
        }
      }
    }
  }

  let queued = false;
  function now() {
    lane();
    const was = stripSig();
    strip();
    /* the time ruler over the cards and the playhead line follow the cards' new size (viewer/comic.js) */
    if (stripSig() !== was && window.CurioComic && window.CurioComic.place) window.CurioComic.place();
  }
  function stripSig() {
    const st = document.querySelector(".cv-root .cv-strip");
    return st ? (st.dataset.fit || "") + st.style.getPropertyValue("--cv-fit") : "";
  }
  function soon() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      now();
    });
  }

  function wire() {
    const root = rootEl();
    const box = root && root.querySelector(".cv-under");
    const st = root && root.querySelector(".cv-strip");
    if (!root || !box || !st || !window.ResizeObserver) return setTimeout(wire, 300);
    const css = document.createElement("style");
    css.textContent = CSS;
    document.head.appendChild(css);
    const ro = new ResizeObserver(soon);
    [box, st, st.querySelector(".cv-cards")].forEach((el) => el && ro.observe(el));
    /* a border dragged, the tab changed, the lane rebuilt, cards added or taken out */
    const mo = new MutationObserver(soon);
    mo.observe(box, { attributes: true, attributeFilter: ["data-cvd-sized", "data-tab", "hidden"], childList: true });
    mo.observe(st, { attributes: true, attributeFilter: ["data-cvd-sized"] });
    mo.observe(st.querySelector(".cv-cards") || st, { childList: true });
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", soon);
    if (window.CurioViewer && window.CurioViewer.onChange) window.CurioViewer.onChange(soon);
    soon();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioFit = { lane, strip, now };
})();
