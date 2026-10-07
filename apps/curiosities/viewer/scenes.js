/* viewer/scenes.js: scenes in My film, and picking several storyboards at once (Jeremy, 2026-10-06).

   - A scene is a run of storyboard panels. A panel that carries panel.scene (a name) starts a new scene there;
     every panel after it belongs to that scene until the next one that starts a scene. The first scene is named
     after the film when its first panel has no name. "✂ New scene" in the storyboard's top row starts a
     scene at the selected panel (and "Join scene" undoes it); "Rename scene" names it. One undo step
     each.
   - Each scene's storyboards get their own color: a colored frame, the scene's name on its first panel, and a
     little gap between one scene and the next. Front and center (focus-lane.js) uses the same colors.
   - Shift+click a storyboard picks every panel from the selected one to it; Ctrl+click (⌘+click on a Mac)
     adds or takes out one panel. Right-click (Ctrl+click on a Mac) opens the storyboard menu (strip-drag.js).
     A plain click goes back to one panel. Front and center then shows just the
     picked panels in its lanes, and the pie becomes the attention across them.

   Needs viewer/viewer.js (CurioViewer.film, starts, live, edit, changed, onDraw, onChange). API:
   window.CurioScenes: list(), at(seconds), ofPanel(i), picked(), pick([i...]), clear(), onPick(fn),
   startHere(i, name), join(i), rename(n, name), COLORS. Rename scene types the name in a box in the top row
   (no pop-up question: those do not open inside the app link). */
(function () {
  "use strict";
  if (window.CurioScenes) return;
  const V = () => window.CurioViewer;
  const COLORS = ["#f59e0b", "#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#60a5fa", "#facc15", "#fb7185"];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  const ADD = MAC ? "⌘+click" : "Ctrl+click";
  const MENU = MAC ? "right-click or Ctrl+click" : "right-click";
  const nameOf = (p) => (p && typeof p.scene === "string" && p.scene.trim() ? p.scene.trim() : "");

  /* ---------- the scenes ---------- */
  let cache = null;
  function list() {
    const v = V();
    if (!v || !v.film) return [];
    const film = v.film();
    const P = film.panels || [];
    const sig = JSON.stringify([film.title, P.map((p) => [p.sec, nameOf(p)])]);
    if (cache && cache.sig === sig) return cache.list;
    const out = [];
    let t = 0;
    P.forEach((p, i) => {
      const nm = nameOf(p);
      const last = out[out.length - 1];
      /* a copy of a scene's first panel carries the same name: it stays in that scene */
      if (!last || (nm && nm !== last.name)) {
        const n = out.length;
        out.push({ n, name: nm || (n ? "Scene " + (n + 1) : String(film.title || "My film")), color: COLORS[n % COLORS.length], first: i, last: i, from: t, to: t + p.sec });
      } else {
        last.last = i;
        last.to = t + p.sec;
      }
      t += p.sec;
    });
    cache = { sig, list: out };
    return out;
  }
  /* "Scene 2: The road", or just "Scene 2" when it has no name of its own */
  const label = (sc) => (sc.name === "Scene " + (sc.n + 1) ? sc.name : `Scene ${sc.n + 1}: ${sc.name}`);
  const at = (t) => {
    const L = list();
    return L.find((s) => t >= s.from - 1e-6 && t < s.to - 1e-6) || L[L.length - 1] || null;
  };
  const ofPanel = (i) => list().find((s) => i >= s.first && i <= s.last) || null;

  /* ---------- picking several storyboards ---------- */
  let picks = [];
  let anchor = null;
  const pickFns = [];
  function setPicks(next) {
    const n = (V() && V().film().panels.length) || 0;
    const clean = [...new Set(next.map(Number).filter((i) => i >= 0 && i < n))].sort((a, b) => a - b);
    const was = picks.join(",");
    picks = clean.length >= 2 ? clean : [];
    if (picks.join(",") === was) return;
    marked = "";
    pickFns.forEach((fn) => {
      try {
        fn(picked());
      } catch (e) {}
    });
    V() && V().redraw && V().redraw();
  }
  function picked() {
    if (picks.length < 2) return null;
    const s = V().starts();
    const P = V().film().panels;
    const first = picks[0];
    const last = picks[picks.length - 1];
    return { panels: picks.slice(), first, last, from: s[first], to: s[last] + P[last].sec };
  }
  function onCardClick(e) {
    const card = e.target.closest && e.target.closest(".cv-root .cv-card[data-i]");
    if (!card) return;
    const i = +card.dataset.i;
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const from = anchor != null ? anchor : V().live().cur;
      const lo = Math.min(from, i);
      const hi = Math.max(from, i);
      const next = [];
      for (let k = lo; k <= hi; k++) next.push(k);
      setPicks(next);
      return;
    }
    /* on a Mac Ctrl+click is a right-click: the menu */
    if (e.ctrlKey && MAC) return;
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      const base = picks.length ? picks.slice() : [V().live().cur];
      const k = base.indexOf(i);
      if (k >= 0) base.splice(k, 1);
      else base.push(i);
      anchor = i;
      setPicks(base);
      return;
    }
    /* a plain click: back to one panel, and it is where the next Shift+click picks from */
    anchor = i;
    if (picks.length) setPicks([]);
  }

  /* ---------- changing scenes ---------- */
  function edit(tag, fn) {
    const v = V();
    v.edit(tag);
    fn(v.live().film);
    cache = null;
    v.changed(true);
  }
  function startHere(i, name) {
    const P = V().film().panels;
    if (!(i > 0 && i < P.length)) return false;
    const before = ofPanel(i - 1);
    edit("scene-split", (film) => {
      film.panels[i].scene = String(name || "Scene " + (list().length + 1));
      /* the panels after it that carried the old scene's name stay with the new scene */
      for (let k = i + 1; k < film.panels.length && before && nameOf(film.panels[k]) === before.name; k++) delete film.panels[k].scene;
    });
    return true;
  }
  function join(i) {
    const sc = ofPanel(i);
    if (!sc || sc.n === 0) return false;
    edit("scene-join", (film) => {
      for (let k = sc.first; k <= sc.last; k++) delete film.panels[k].scene;
    });
    return true;
  }
  function rename(n, name) {
    const sc = list()[n];
    if (!sc || !String(name || "").trim()) return false;
    edit("scene-name", (film) => {
      film.panels[sc.first].scene = String(name).trim();
      for (let k = sc.first + 1; k <= sc.last; k++) delete film.panels[k].scene;
    });
    return true;
  }

  /* ---------- drawing on the storyboard ---------- */
  const CSS = `
.cv-root .cv-card[data-cs-n] { border-color: var(--cs-c); border-width: 4px; }
.cv-root .cv-card[data-cs-n] .cv-num { background: var(--cs-c); color: #111; font-weight: 600; }
.cv-root .cv-card.cs-first:not(:first-child) { margin-left: 14px; }
.cv-root .cv-card[data-cs-n] .cv-force { background: var(--cs-c); color: #111; }
.cv-root .cv-card .cs-tag { position: absolute; left: 0; top: 21px; z-index: 1; max-width: calc(100% - 12px); padding: 1px 7px 2px; border-radius: 0 0 4px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5); background: var(--cs-c); color: #111; font: 700 10.5px/1.35 system-ui, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
.cv-root .cv-card.cs-picked { outline: 3px dashed #fff; outline-offset: 2px; box-shadow: 0 0 0 7px rgba(255, 255, 255, 0.14); }
.cv-root .cs-tools { display: inline-flex; gap: 4px; align-items: center; flex: none; }
/* the storyboard's top bar is one line (Jeremy 2026-10-07): the count shrinks first, the rest scrolls sideways */
.cv-root:not(.cv-comic) .cv-strip-head { flex-wrap: nowrap; gap: 4px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; white-space: nowrap; }
.cv-root:not(.cv-comic) .cv-strip-head::-webkit-scrollbar { display: none; }
.cv-root:not(.cv-comic) .cv-strip-head > * { flex: none; }
.cv-root:not(.cv-comic) .cv-strip-head .cv-k { flex: 1 1 0; min-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cv-root:not(.cv-comic) .cv-strip-head button { padding: 3px 8px; white-space: nowrap; }
.cv-root .cs-hint { color: var(--c-dim, #9b9ba3); font-size: 11px; }
.cv-root .cs-hint b { color: #fff; font-weight: 600; }
.cv-root .cs-name { width: 180px; font: inherit; font-size: 12px; padding: 3px 6px; border-radius: 5px; border: 1px solid #fde68a; background: #1d1d21; color: #fff; }
`;
  function style() {
    if (document.getElementById("cs-css")) return;
    const st = document.createElement("style");
    st.id = "cs-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  let marked = "";
  function mark() {
    const v = V();
    const root = document.querySelector(".cv-root");
    if (!v || !root) return;
    const cards = root.querySelectorAll(".cv-card[data-i]");
    const L = list();
    const cur = v.live().cur;
    const sig = [cards.length, cache && cache.sig, picks.join(","), cur, cards[0] && cards[0].dataset.csN == null, naming && naming.n].join("|");
    if (sig === marked) return;
    marked = sig;
    style();
    cards.forEach((card) => {
      const i = +card.dataset.i;
      const sc = L.find((s) => i >= s.first && i <= s.last);
      if (!sc) return;
      card.dataset.csN = sc.n;
      card.style.setProperty("--cs-c", sc.color);
      card.classList.toggle("cs-first", i === sc.first);
      card.classList.toggle("cs-picked", picks.includes(i));
      let tag = card.querySelector(".cs-tag");
      if (i === sc.first && L.length > 1) {
        if (!tag) {
          tag = document.createElement("span");
          tag.className = "cs-tag";
          card.appendChild(tag);
        }
        tag.textContent = label(sc);
      } else if (tag) tag.remove();
    });
    tools(root, L, cur);
  }
  /* Rename scene: a name box right in the storyboard's top row (the browser's own pop-up question doesn't open
     inside the app link, Jeremy 2026-10-07). Enter or Save keeps the name, Escape or Cancel leaves it. */
  let naming = null;
  function tools(root, L, cur) {
    const head = root.querySelector(".cv-strip-head");
    if (!head) return;
    let box = head.querySelector(".cs-tools");
    if (naming && box && box.querySelector(".cs-name")) return;
    if (!box) {
      box = document.createElement("span");
      box.className = "cs-tools";
      const k = head.querySelector(".cv-k");
      head.insertBefore(box, k ? k.nextSibling : head.firstChild);
    }
    const sc = ofPanel(cur);
    if (naming && L[naming.n]) {
      const nsc = L[naming.n];
      box.innerHTML = `<label class="cs-hint" for="cs-name-in">Name for scene ${nsc.n + 1}</label><input id="cs-name-in" class="cs-name" type="text" maxlength="80" value="${esc(nsc.name)}" aria-label="Name for scene ${nsc.n + 1}"><button type="button" data-cs="save">Save</button><button type="button" data-cs="cancel">Cancel</button>`;
      const inp = box.querySelector(".cs-name");
      inp.focus();
      inp.select();
      return;
    }
    naming = null;
    const starts = sc && sc.first === cur && cur > 0;
    const pk = picked();
    box.innerHTML =
      (pk
        ? `<span class="cs-hint"><b>${pk.panels.length} picked</b></span><button type="button" data-cs="clear" title="Back to one panel">✕ Unpick</button>`
        : "") +
      (starts
        ? `<button type="button" data-cs="join" title="This panel starts a scene: make it part of the scene before">Join scene</button>`
        : `<button type="button" data-cs="split" title="Start a new scene at this panel"${cur > 0 ? "" : " disabled"}>✂ New scene</button>`) +
      `<button type="button" data-cs="rename" title="Give this panel's scene a name">Rename scene</button>`;
    box.title = `Shift+click a storyboard to pick every panel up to it; ${ADD} to add or take out one; ${MENU} for the menu`;
  }
  function onToolClick(e) {
    const b = e.target.closest && e.target.closest(".cv-root [data-cs]");
    if (!b) return;
    e.stopPropagation();
    const cur = V().live().cur;
    if (b.dataset.cs === "clear") return setPicks([]);
    if (b.dataset.cs === "split") return void startHere(cur);
    if (b.dataset.cs === "join") return void join(cur);
    if (b.dataset.cs === "rename") {
      const sc = ofPanel(cur);
      if (!sc) return;
      naming = { n: sc.n };
      marked = "";
      return mark();
    }
    if (b.dataset.cs === "save") return saveName();
    if (b.dataset.cs === "cancel") return stopNaming();
  }
  function stopNaming() {
    naming = null;
    marked = "";
    const box = document.querySelector(".cv-root .cs-tools");
    if (box) box.innerHTML = "";
    mark();
  }
  function saveName() {
    const inp = document.querySelector(".cv-root .cs-name");
    const n = naming && naming.n;
    const name = inp ? inp.value.trim() : "";
    stopNaming();
    if (n != null && name) rename(n, name);
  }

  function wire() {
    const v = V();
    if (!v || !v.onDraw) return setTimeout(wire, 300);
    v.onDraw(mark);
    v.onChange(() => {
      cache = null;
      marked = "";
      const n = v.film().panels.length;
      if (picks.some((i) => i >= n)) setPicks(picks.filter((i) => i < n));
    });
    document.addEventListener("click", onCardClick, true);
    document.addEventListener("click", onToolClick, true);
    /* typing a name: no other part of the app reacts to these keys */
    window.addEventListener(
      "keydown",
      (e) => {
        if (!(e.target && e.target.classList && e.target.classList.contains("cs-name"))) return;
        e.stopPropagation();
        if (e.key === "Enter") return void (e.preventDefault(), saveName());
        if (e.key === "Escape") return void (e.preventDefault(), stopNaming());
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && picks.length && !(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) setPicks([]);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioScenes = {
    COLORS,
    label,
    list: () => list().map((s) => Object.assign({}, s)),
    at: (t) => at(+t || 0),
    ofPanel,
    picked,
    pick: (arr) => setPicks(Array.isArray(arr) ? arr : []),
    clear: () => setPicks([]),
    onPick: (fn) => pickFns.push(fn),
    startHere,
    join,
    rename,
  };
})();
