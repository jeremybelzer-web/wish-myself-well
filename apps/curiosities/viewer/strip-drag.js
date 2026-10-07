/* viewer/strip-drag.js: move and stretch the storyboards with the mouse (Jeremy, 2026-10-07).

   - Grab a storyboard in the middle and drag it: a copy of it rides under the pointer, held where you grabbed it,
     and a bright line shows where it will land. Let go to drop it there (one undo step). Near the ends of the
     strip it scrolls along.
   - Near a storyboard's left or right edge the pointer turns into the resize arrows. Drag the edge to make the
     panel last longer or shorter, in quarter seconds (0.25 s to 30 s); a label says how long it is. One undo step.
   - "One size" in the storyboard's top row switches to "Relative size": then a longer panel is wider than a
     shorter one (2 seconds is the usual width). Kept per device in curio-strip-size-v1.
   Read as a comic lays panels out its own way, so none of this applies there.

   Needs viewer/viewer.js (CurioViewer.live, edit, changed, select, onDraw). API: window.CurioStripDrag:
   relative() -> true or false, setRelative(on), move(from, to), stretch(i, seconds). */
(function () {
  "use strict";
  if (window.CurioStripDrag) return;
  const V = () => window.CurioViewer;
  const KEY = "curio-strip-size-v1";
  const EDGE = 9; /* px from a card's side that resizes instead of moving */
  const MIN = 0.25;
  const MAX = 30;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const snap = (s) => clamp(Math.round(s * 4) / 4, MIN, MAX);

  let rel = false;
  try {
    rel = localStorage.getItem(KEY) === "relative";
  } catch (e) {}

  const CSS = `
.cv-root.csd-rel:not(.cv-comic) .cv-card { flex: 0 0 calc(172px * var(--csd-k, 1)); }
.cv-root.csd-rel.cf-big:not(.cv-comic) .cv-card { flex-basis: calc(92px * var(--csd-k, 1)); }
.cv-root:not(.cv-comic) .cv-card { cursor: grab; }
.cv-root:not(.cv-comic) .cv-card.csd-edge { cursor: col-resize; }
.cv-root .cv-card.csd-lifted { opacity: 0.3; }
.csd-ghost { position: fixed; z-index: 2147483000; pointer-events: none; opacity: 0.9; box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6); transform: rotate(-1.5deg); cursor: grabbing; }
.csd-ghost canvas { display: block; width: 100%; }
.csd-drop { position: fixed; z-index: 2147482999; width: 4px; margin-left: -2px; border-radius: 2px; background: #fde68a; box-shadow: 0 0 8px #fde68a; pointer-events: none; }
.csd-len { position: fixed; z-index: 2147483000; pointer-events: none; padding: 2px 7px; border-radius: 4px; background: #111; color: #fde68a; font: 600 12px/1.4 system-ui, sans-serif; }
body.csd-dragging, body.csd-dragging * { cursor: grabbing !important; user-select: none !important; -webkit-user-select: none !important; }
body.csd-sizing, body.csd-sizing * { cursor: col-resize !important; user-select: none !important; -webkit-user-select: none !important; }
.cv-root .csd-size[aria-pressed="true"] { background: #fde68a; color: #2b2418; }
`;
  function style() {
    if (document.getElementById("csd-css")) return;
    const st = document.createElement("style");
    st.id = "csd-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const root = () => document.querySelector(".cv-root");
  const comic = () => !!(root() && root().classList.contains("cv-comic"));
  const live = () => V().live();

  /* ---------- sizes ---------- */
  let sized = "";
  function size() {
    const r = root();
    if (!r) return;
    style();
    r.classList.toggle("csd-rel", rel);
    const P = live().film.panels;
    const cards = r.querySelectorAll(".cv-card[data-i]");
    const sig = rel + "|" + cards.length + "|" + P.map((p) => p.sec).join(",");
    if (sig !== sized) {
      sized = sig;
      cards.forEach((c) => {
        const p = P[+c.dataset.i];
        if (p) c.style.setProperty("--csd-k", String(clamp(p.sec / 2, 0.4, 5)));
      });
    }
    button(r);
  }
  function button(r) {
    const head = r.querySelector(".cv-strip-head");
    if (!head) return;
    let b = head.querySelector(".csd-size");
    if (!b) {
      b = document.createElement("button");
      b.type = "button";
      b.className = "csd-size";
      const k = head.querySelector(".cs-tools") || head.querySelector(".cv-k");
      head.insertBefore(b, k ? k.nextSibling : head.firstChild);
    }
    const text = rel ? "Relative size" : "One size";
    if (b.textContent !== text) {
      b.textContent = text;
      b.setAttribute("aria-pressed", String(rel));
      b.title = rel ? "Longer panels are wider. Click for every storyboard the same size." : "Every storyboard is the same size. Click so longer panels are wider.";
    }
    b.hidden = comic();
  }
  function setRelative(on) {
    rel = !!on;
    try {
      localStorage.setItem(KEY, rel ? "relative" : "one");
    } catch (e) {}
    sized = "";
    size();
    V().redraw && V().redraw();
  }

  /* ---------- changing the film ---------- */
  function move(from, to) {
    const P = live().film.panels;
    if (from === to || from < 0 || from >= P.length) return false;
    to = clamp(to, 0, P.length - 1);
    V().edit("panel-drag");
    const film = live().film;
    const [q] = film.panels.splice(from, 1);
    film.panels.splice(to, 0, q);
    V().changed(true);
    V().select(to);
    return true;
  }
  function stretch(i, sec) {
    const P = live().film.panels;
    if (!P[i]) return false;
    sec = snap(sec);
    if (sec === P[i].sec) return false;
    V().edit("panel-stretch");
    live().film.panels[i].sec = sec;
    V().changed(true);
    return true;
  }

  /* ---------- the pointer ---------- */
  const cardOf = (e) => (e.target.closest ? e.target.closest(".cv-root .cv-cards .cv-card[data-i]") : null);
  const edgeOf = (card, x) => {
    const r = card.getBoundingClientRect();
    if (x - r.left <= EDGE) return "l";
    if (r.right - x <= EDGE) return "r";
    return "";
  };
  let drag = null;
  let eatClick = false;

  function onHover(e) {
    if (drag || comic()) return;
    const c = cardOf(e);
    if (!c) return;
    c.classList.toggle("csd-edge", !!edgeOf(c, e.clientX));
  }
  function onDown(e) {
    if (e.button !== 0 || comic() || e.shiftKey || e.ctrlKey || e.metaKey) return;
    const c = cardOf(e);
    if (!c) return;
    const i = +c.dataset.i;
    const edge = edgeOf(c, e.clientX);
    const r = c.getBoundingClientRect();
    drag = { i, card: c, edge, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height, on: false, id: e.pointerId };
    if (edge) {
      /* resizing starts at once: no click on the card */
      e.preventDefault();
      e.stopPropagation();
      startSize();
    }
  }
  function startSize() {
    const P = live().film.panels;
    drag.on = true;
    drag.sec0 = P[drag.i].sec;
    /* how many px a second is: the card's own scale in Relative size, the usual 2 s width in One size */
    drag.pxs = rel ? drag.w / drag.sec0 : drag.w / 2;
    drag.label = document.createElement("div");
    drag.label.className = "csd-len";
    document.body.appendChild(drag.label);
    document.body.classList.add("csd-sizing");
    showSize(drag.sec0);
  }
  function showSize(sec) {
    const r = drag.card.getBoundingClientRect();
    drag.label.textContent = `${sec} s`;
    drag.label.style.left = r.left + r.width / 2 - 20 + "px";
    drag.label.style.top = r.top - 26 + "px";
  }
  function startMove() {
    drag.on = true;
    const ghost = drag.card.cloneNode(true);
    ghost.classList.add("csd-ghost");
    ghost.classList.remove("on", "now", "cs-picked", "csd-edge");
    ghost.style.width = drag.w + "px";
    ghost.style.height = drag.h + "px";
    /* the clone's canvas is blank: copy the picture */
    const a = drag.card.querySelector("canvas");
    const b = ghost.querySelector("canvas");
    if (a && b) {
      b.width = a.width;
      b.height = a.height;
      try {
        b.getContext("2d").drawImage(a, 0, 0);
      } catch (err) {}
    }
    ghost.removeAttribute("data-i");
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    drag.mark = document.createElement("div");
    drag.mark.className = "csd-drop";
    document.body.appendChild(drag.mark);
    drag.card.classList.add("csd-lifted");
    document.body.classList.add("csd-dragging");
  }
  /* where the dragged card would land: the gap nearest the pointer */
  function dropAt(x) {
    const cards = [...document.querySelectorAll(".cv-root .cv-cards .cv-card[data-i]")];
    let gap = cards.length;
    for (let k = 0; k < cards.length; k++) {
      const r = cards[k].getBoundingClientRect();
      if (x < r.left + r.width / 2) {
        gap = k;
        break;
      }
    }
    const ref = cards[Math.min(gap, cards.length - 1)].getBoundingClientRect();
    const left = gap < cards.length ? ref.left - 5 : ref.right + 5;
    /* the panel's new place once it is taken out of its old one */
    const to = gap > drag.i ? gap - 1 : gap;
    return { to, left, top: ref.top, h: ref.height };
  }
  function onMove(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      startMove();
    }
    e.preventDefault();
    const box = document.querySelector(".cv-root .cv-cards");
    if (box) {
      const br = box.getBoundingClientRect();
      if (e.clientX < br.left + 28) box.scrollLeft -= 16;
      if (e.clientX > br.right - 28) box.scrollLeft += 16;
    }
    if (drag.edge) {
      const d = (e.clientX - drag.x0) / Math.max(1, drag.pxs);
      const sec = snap(drag.sec0 + (drag.edge === "r" ? d : -d));
      drag.sec = sec;
      drag.card.style.flexBasis = Math.max(40, (rel ? sec * drag.pxs : drag.w + (sec - drag.sec0) * drag.pxs)) + "px";
      showSize(sec);
      return;
    }
    drag.ghost.style.left = e.clientX - drag.dx + "px";
    drag.ghost.style.top = e.clientY - drag.dy + "px";
    const at = dropAt(e.clientX);
    drag.to = at.to;
    drag.mark.style.left = at.left + "px";
    drag.mark.style.top = at.top + "px";
    drag.mark.style.height = at.h + "px";
  }
  function onUp() {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.on) return;
    eatClick = true;
    setTimeout(() => (eatClick = false), 0);
    document.body.classList.remove("csd-dragging", "csd-sizing");
    if (d.label) d.label.remove();
    if (d.ghost) d.ghost.remove();
    if (d.mark) d.mark.remove();
    d.card.classList.remove("csd-lifted");
    d.card.style.flexBasis = "";
    sized = "";
    if (d.edge) {
      if (d.sec != null) stretch(d.i, d.sec);
    } else if (d.to != null) move(d.i, d.to);
    size();
  }
  /* the click that ends a drag does not also pick the panel or jump in it */
  function onClick(e) {
    if (!eatClick) return;
    e.preventDefault();
    e.stopPropagation();
    eatClick = false;
  }

  function wire() {
    const v = V();
    if (!v || !v.onDraw || !v.live) return setTimeout(wire, 300);
    v.onDraw(size);
    v.onChange && v.onChange(() => (sized = ""));
    document.addEventListener("pointermove", onHover);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onUp, true);
    window.addEventListener("click", onClick, true);
    document.addEventListener(
      "click",
      (e) => {
        const b = e.target.closest && e.target.closest(".cv-root .csd-size");
        if (!b) return;
        e.stopPropagation();
        setRelative(!rel);
      },
      true,
    );
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioStripDrag = { relative: () => rel, setRelative, move, stretch };
})();
