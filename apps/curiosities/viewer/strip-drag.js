/* viewer/strip-drag.js: move and stretch the storyboards with the mouse (Jeremy, 2026-10-07).

   - Grab a storyboard in the middle and drag it: a copy of it rides under the pointer, held where you grabbed it,
     and a bright line shows where it will land. Let go to drop it there (one undo step). Near the ends of the
     strip it scrolls along.
   - Near a storyboard's left or right edge the pointer turns into the resize arrows. Drag the edge to make the
     panel last longer or shorter, in quarter seconds (0.25 s to 30 s); a label says how long it is. One undo step.
   - Panels picked together (Shift+click, ⌘ or Alt+click: viewer/scenes.js) drag together and stretch together:
     grab any one of them. The copy under the pointer says how many.
   - Right-click or Ctrl+click a storyboard: a menu of CapCut's and Maya's everyday clip commands (Play from
     here, Copy, Cut, Paste after, Duplicate, Split in two, Join into one panel, Freeze frame after, Reverse their
     order, Length, Twice as fast, Half speed, Move to the start or end, Pick the whole scene, New scene here,
     Delete) for that panel, or for every picked panel when it is one of them. One undo step each.
   - "One size" in the storyboard's top row switches to "Relative size": then a longer panel is wider than a
     shorter one (2 seconds is the usual width). Kept per device in curio-strip-size-v1.
   Read as a comic lays panels out its own way, so none of this applies there.

   Needs viewer/viewer.js (CurioViewer.live, edit, changed, select, onDraw). API: window.CurioStripDrag:
   relative() -> true or false, setRelative(on), move(from, to), moveGroup(list, to), stretch(i, seconds),
   stretchGroup(list, bySeconds), openMenu(i, x, y), closeMenu(), run(command, list). */
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
.csd-ghost .csd-count { position: absolute; right: -10px; bottom: -10px; padding: 3px 8px; border-radius: 10px; background: #fde68a; color: #111; font: 700 12px/1.2 system-ui, sans-serif; box-shadow: 4px 4px 0 #b9a24a, 8px 8px 0 #7a6a2d; }
.csd-drop { position: fixed; z-index: 2147482999; width: 4px; margin-left: -2px; border-radius: 2px; background: #fde68a; box-shadow: 0 0 8px #fde68a; pointer-events: none; }
.csd-len { position: fixed; z-index: 2147483000; pointer-events: none; padding: 2px 7px; border-radius: 4px; background: #111; color: #fde68a; font: 600 12px/1.4 system-ui, sans-serif; }
.csd-menu { position: fixed; z-index: 2147483001; min-width: 230px; padding: 4px; display: grid; background: #1b1b1f; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 8px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6); font: 12.5px/1.3 system-ui, sans-serif; }
.csd-menu header { padding: 4px 8px 5px; color: #fde68a; font-weight: 600; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }
.csd-menu > button { all: unset; display: flex; justify-content: space-between; gap: 16px; padding: 5px 8px; border-radius: 5px; cursor: pointer; }
.csd-menu > button:hover:not([disabled]), .csd-menu > button:focus-visible { background: #22d3ee; color: #062a31; }
.csd-menu > button[disabled] { opacity: 0.38; cursor: default; }
.csd-menu kbd { font: inherit; color: #8b8b94; }
.csd-menu > button:hover kbd, .csd-menu > button:focus-visible kbd { color: #062a31; }
.csd-menu hr { border: 0; border-top: 1px solid #2e2e33; margin: 3px 4px; }
.csd-len-row { display: flex; align-items: center; gap: 3px; padding: 3px 8px; }
.csd-len-row span { flex: 1; }
.csd-len-row button { all: unset; padding: 2px 6px; border-radius: 4px; background: #26262b; cursor: pointer; font-size: 11.5px; }
.csd-len-row button:hover, .csd-len-row button:focus-visible { background: #fde68a; color: #111; }
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
  const Sc = () => window.CurioScenes;
  /* the panels a drag or the menu works on: every picked panel when the one under the pointer is picked */
  function groupOf(i) {
    const pk = Sc() && Sc().picked();
    return pk && pk.panels.includes(i) ? pk.panels.slice() : [i];
  }
  /* move panels (a list, kept in order) so the first of them lands at place `to` among the others */
  function moveGroup(list, to) {
    const P = live().film.panels;
    list = [...new Set(list)].filter((i) => i >= 0 && i < P.length).sort((a, b) => a - b);
    if (!list.length) return false;
    const rest = P.map((_, i) => i).filter((i) => !list.includes(i));
    to = clamp(to, 0, rest.length);
    const order = [...rest.slice(0, to), ...list, ...rest.slice(to)];
    if (order.every((i, k) => i === k)) return false;
    V().edit("panel-drag");
    const film = live().film;
    const old = film.panels.slice();
    film.panels.splice(0, film.panels.length, ...order.map((i) => old[i]));
    V().changed(true);
    V().select(to);
    if (list.length > 1 && Sc()) Sc().pick(list.map((_, k) => to + k));
    return true;
  }
  const move = (from, to) => moveGroup([from], to);
  /* stretch: panel i (and every panel picked with it) gets `sec` seconds longer or shorter, or (by) is added */
  function stretchGroup(list, by) {
    const P = live().film.panels;
    const next = list.map((i) => (P[i] ? snap(P[i].sec + by) : null));
    if (next.every((v, k) => v == null || v === P[list[k]].sec)) return false;
    V().edit("panel-stretch");
    list.forEach((i, k) => next[k] != null && (live().film.panels[i].sec = next[k]));
    V().changed(true);
    return true;
  }
  const stretch = (i, sec) => (live().film.panels[i] ? stretchGroup([i], snap(sec) - live().film.panels[i].sec) : false);

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
    if (e.button !== 0 || comic() || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    const c = cardOf(e);
    if (!c) return;
    const i = +c.dataset.i;
    const edge = edgeOf(c, e.clientX);
    const r = c.getBoundingClientRect();
    drag = { i, group: groupOf(i), card: c, edge, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height, on: false, id: e.pointerId };
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
    drag.label.textContent = drag.group.length > 1 ? `${sec} s (${sec >= drag.sec0 ? "+" : "−"}${Math.abs(sec - drag.sec0)} s on all ${drag.group.length})` : `${sec} s`;
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
    if (drag.group.length > 1) {
      const n = document.createElement("b");
      n.className = "csd-count";
      n.textContent = `${drag.group.length} panels`;
      ghost.appendChild(n);
    }
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    drag.mark = document.createElement("div");
    drag.mark.className = "csd-drop";
    document.body.appendChild(drag.mark);
    drag.lifted = drag.group.map((i) => document.querySelector(`.cv-root .cv-card[data-i="${i}"]`)).filter(Boolean);
    drag.lifted.forEach((c) => c.classList.add("csd-lifted"));
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
    /* the panels' new place once they are taken out of their old ones */
    const to = gap - drag.group.filter((i) => i < gap).length;
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
    (d.lifted || []).forEach((c) => c.classList.remove("csd-lifted"));
    d.card.style.flexBasis = "";
    sized = "";
    if (d.edge) {
      if (d.sec != null) stretchGroup(d.group, d.sec - d.sec0);
    } else if (d.to != null) moveGroup(d.group, d.to);
    size();
  }
  /* the click that ends a drag does not also pick the panel or jump in it */
  function onClick(e) {
    if (!eatClick) return;
    e.preventDefault();
    e.stopPropagation();
    eatClick = false;
  }


  /* ---------- the storyboard menu: right-click or Ctrl+click (Jeremy 2026-10-07) ----------
     The everyday clip commands of CapCut (copy, cut, paste, duplicate, split, freeze frame, speed, reverse,
     delete) and Maya's Camera Sequencer (shot length, move to start or end), for the panel under the pointer,
     or every picked panel when it is one of them. Each one is one undo step. */
  let clip = [];
  let menuEl = null;
  let menuAt = 0;
  const newId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const copyOf = (p) => Object.assign(JSON.parse(JSON.stringify(p)), { id: newId() });
  function change(tag, fn, pickAfter) {
    V().edit(tag);
    const film = live().film;
    const sel = fn(film);
    V().changed(true);
    if (sel != null) V().select(clamp(sel, 0, film.panels.length - 1));
    if (Sc()) Sc().pick(pickAfter || []);
  }
  /* list: the panels, in order. Returns false when the command can't run on them. */
  const COMMANDS = {
    play: (list) => {
      V().select(list[0]);
      V().play && V().play(true);
    },
    copy: (list) => {
      const P = live().film.panels;
      clip = list.map((i) => JSON.parse(JSON.stringify(P[i])));
    },
    cut: (list) => {
      const P = live().film.panels;
      if (list.length >= P.length) return false;
      clip = list.map((i) => JSON.parse(JSON.stringify(P[i])));
      change("panel-cut", (film) => {
        list.slice().reverse().forEach((i) => film.panels.splice(i, 1));
        return list[0];
      });
    },
    paste: (list) => {
      if (!clip.length) return false;
      const at = list[list.length - 1] + 1;
      change("panel-paste", (film) => (film.panels.splice(at, 0, ...clip.map(copyOf)), at), clip.length > 1 ? clip.map((_, k) => at + k) : []);
    },
    duplicate: (list) => {
      const at = list[list.length - 1] + 1;
      change("panel-duplicate", (film) => (film.panels.splice(at, 0, ...list.map((i) => copyOf(film.panels[i]))), at), list.length > 1 ? list.map((_, k) => at + k) : []);
    },
    split: (list) => {
      if (list.some((i) => live().film.panels[i].sec < MIN * 2)) return false;
      change("panel-split", (film) => {
        list.slice().reverse().forEach((i) => {
          const p = film.panels[i];
          const half = snap(p.sec / 2);
          const b = copyOf(p);
          b.sec = snap(p.sec - half);
          p.sec = half;
          delete b.scene;
          film.panels.splice(i + 1, 0, b);
        });
        return list[0];
      });
    },
    join: (list) => {
      if (list.length < 2) return false;
      change("panel-join", (film) => {
        const total = list.reduce((a, i) => a + film.panels[i].sec, 0);
        film.panels[list[0]].sec = clamp(Math.round(total * 4) / 4, MIN, MAX);
        list.slice(1).reverse().forEach((i) => film.panels.splice(i, 1));
        return list[0];
      });
    },
    freeze: (list) => {
      const i = list[list.length - 1];
      change("panel-freeze", (film) => {
        const f = copyOf(film.panels[i]);
        f.sec = 1;
        f.cam.move = "cut";
        f.words = [];
        f.caption = "";
        f.note = "Hold: a freeze frame of panel " + (i + 1) + ".";
        delete f.scene;
        film.panels.splice(i + 1, 0, f);
        return i + 1;
      });
    },
    faster: (list) => stretchTo(list, (s) => s / 2),
    slower: (list) => stretchTo(list, (s) => s * 2),
    reverse: (list) => {
      if (list.length < 2) return false;
      change("panel-reverse", (film) => {
        const ps = list.map((i) => film.panels[i]).reverse();
        list.forEach((i, k) => (film.panels[i] = ps[k]));
        return list[0];
      }, list);
    },
    first: (list) => moveGroup(list, 0),
    last: (list) => moveGroup(list, live().film.panels.length - list.length),
    scene: (list) => {
      const sc = Sc() && Sc().ofPanel(list[0]);
      if (!sc) return false;
      const all = [];
      for (let k = sc.first; k <= sc.last; k++) all.push(k);
      Sc().pick(all);
    },
    newscene: (list) => (Sc() ? Sc().startHere(list[0]) : false),
    del: (list) => {
      if (list.length >= live().film.panels.length) return false;
      change("panel-delete", (film) => {
        list.slice().reverse().forEach((i) => film.panels.splice(i, 1));
        return list[0];
      });
    },
  };
  function stretchTo(list, fn) {
    const P = live().film.panels;
    V().edit("panel-speed");
    list.forEach((i) => (live().film.panels[i].sec = snap(fn(P[i].sec))));
    V().changed(true);
  }
  const LENGTHS = [0.5, 1, 2, 3, 5];
  function closeMenu() {
    if (menuEl) menuEl.remove();
    menuEl = null;
  }
  function openMenu(i, x, y) {
    closeMenu();
    menuAt = Date.now();
    const list = groupOf(i);
    const n = list.length;
    const what = n > 1 ? `${n} panels` : `panel ${i + 1}`;
    const P = live().film.panels;
    const sc = Sc() && Sc().ofPanel(i);
    const item = (cmd, label, key, off) => `<button type="button" role="menuitem" data-csm="${cmd}"${off ? " disabled" : ""}><span>${label}</span>${key ? `<kbd>${key}</kbd>` : ""}</button>`;
    const sep = `<hr>`;
    const m = document.createElement("div");
    m.className = "csd-menu";
    m.setAttribute("role", "menu");
    m.dataset.i = i;
    m.innerHTML =
      `<header>${what}</header>` +
      item("play", "Play from here", "") +
      sep +
      item("copy", "Copy", "") +
      item("cut", "Cut", "", n >= P.length) +
      item("paste", clip.length ? `Paste ${clip.length > 1 ? clip.length + " panels" : "panel"} after` : "Paste after", "", !clip.length) +
      item("duplicate", "Duplicate", "") +
      sep +
      item("split", "Split in two", "", list.some((k) => P[k].sec < MIN * 2)) +
      item("join", "Join into one panel", "", n < 2) +
      item("freeze", "Freeze frame after", "") +
      item("reverse", "Reverse their order", "", n < 2) +
      sep +
      `<div class="csd-len-row"><span>Length</span>${LENGTHS.map((l) => `<button type="button" data-csm="len" data-len="${l}" title="${l} seconds each">${l} s</button>`).join("")}</div>` +
      item("faster", "Twice as fast", "") +
      item("slower", "Half speed", "") +
      sep +
      item("first", "Move to the start", "") +
      item("last", "Move to the end", "") +
      sep +
      item("scene", sc ? `Pick all of ${Sc().label ? Sc().label(sc) : sc.name}` : "Pick the whole scene", "", !sc) +
      item("newscene", "✂ New scene here", "", list[0] === 0 || (sc && sc.first === list[0])) +
      sep +
      item("del", "Delete", "", n >= P.length);
    document.body.appendChild(m);
    const r = m.getBoundingClientRect();
    m.style.left = clamp(x, 4, innerWidth - r.width - 4) + "px";
    m.style.top = clamp(y, 4, innerHeight - r.height - 4) + "px";
    menuEl = m;
    m.list = list;
    const first = m.querySelector("button:not([disabled])");
    if (first) first.focus();
  }
  function onMenuClick(e) {
    const b = e.target.closest && e.target.closest(".csd-menu [data-csm]");
    if (!b || b.disabled) return;
    e.stopPropagation();
    const list = menuEl.list;
    const cmd = b.dataset.csm;
    closeMenu();
    if (cmd === "len") {
      V().edit("panel-length");
      list.forEach((i) => (live().film.panels[i].sec = snap(+b.dataset.len)));
      V().changed(true);
      return;
    }
    if (COMMANDS[cmd]) COMMANDS[cmd](list);
  }
  function onContext(e) {
    if (comic()) return;
    const c = cardOf(e);
    if (!c) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu(+c.dataset.i, e.clientX, e.clientY);
  }
  /* Ctrl+click: the menu too (on a Mac the browser sends it as a right-click already) */
  function onCtrlClick(e) {
    if (!e.ctrlKey || comic()) return;
    const c = cardOf(e);
    if (!c) return;
    e.preventDefault();
    e.stopPropagation();
    if (Date.now() - menuAt > 400) openMenu(+c.dataset.i, e.clientX, e.clientY);
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
    window.addEventListener("click", onCtrlClick, true);
    window.addEventListener("click", onMenuClick, true);
    document.addEventListener("contextmenu", onContext, true);
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (menuEl && !menuEl.contains(e.target)) closeMenu();
      },
      true,
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (!menuEl) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closeMenu();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          const bs = [...menuEl.querySelectorAll("button:not([disabled])")];
          const k = bs.indexOf(document.activeElement);
          const nx = bs[(k + (e.key === "ArrowDown" ? 1 : -1) + bs.length) % bs.length];
          if (nx) nx.focus();
        }
      },
      true,
    );
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

  window.CurioStripDrag = { relative: () => rel, setRelative, move, moveGroup, stretch, stretchGroup, openMenu, closeMenu, run: (cmd, list) => COMMANDS[cmd] && COMMANDS[cmd](list) };
})();
