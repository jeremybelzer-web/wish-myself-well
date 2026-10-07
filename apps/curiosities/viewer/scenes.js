/* viewer/scenes.js: scenes in My film, and picking several storyboards at once (Jeremy, 2026-10-06).

   - A scene is a run of storyboard panels. A panel that carries panel.scene (a name) starts a new scene there;
     every panel after it belongs to that scene until the next one that starts a scene. The first scene is named
     after the film when its first panel has no name. "✂ New scene here" in the storyboard's top row starts a
     scene at the selected panel (and "Join the scene before" undoes it); "Rename scene" names it. One undo step
     each.
   - Each scene's storyboards get their own color: a colored frame, the scene's name on its first panel, and a
     little gap between one scene and the next. Front and center (focus-lane.js) uses the same colors.
   - Shift+click a storyboard picks every panel from the selected one to it; Ctrl+click (⌘+click on a Mac)
     adds or takes out one panel. A plain click goes back to one panel. Front and center then shows just the
     picked panels in its lanes, and the pie becomes the attention across them.

   Needs viewer/viewer.js (CurioViewer.film, starts, live, edit, changed, onDraw, onChange). API:
   window.CurioScenes: list(), at(seconds), ofPanel(i), picked(), pick([i...]), clear(), onPick(fn),
   startHere(i, name), join(i), rename(n, name), COLORS. */
(function () {
  "use strict";
  if (window.CurioScenes) return;
  const V = () => window.CurioViewer;
  const COLORS = ["#f59e0b", "#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#60a5fa", "#facc15", "#fb7185"];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
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
    if (e.ctrlKey || e.metaKey) {
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
    edit("scene", (film) => {
      film.panels[i].scene = String(name || "Scene " + (list().length + 1));
      /* the panels after it that carried the old scene's name stay with the new scene */
      for (let k = i + 1; k < film.panels.length && before && nameOf(film.panels[k]) === before.name; k++) delete film.panels[k].scene;
    });
    return true;
  }
  function join(i) {
    const sc = ofPanel(i);
    if (!sc || sc.n === 0) return false;
    edit("scene", (film) => {
      for (let k = sc.first; k <= sc.last; k++) delete film.panels[k].scene;
    });
    return true;
  }
  function rename(n, name) {
    const sc = list()[n];
    if (!sc || !String(name || "").trim()) return false;
    edit("scene", (film) => {
      film.panels[sc.first].scene = String(name).trim();
      for (let k = sc.first + 1; k <= sc.last; k++) delete film.panels[k].scene;
    });
    return true;
  }

  /* ---------- drawing on the storyboard ---------- */
  const CSS = `
.cs-ask { position: fixed; z-index: 2147483000; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px 10px; background: #1b1b1f; color: #e6e6ea; border: 1px solid #22d3ee; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); font: 13px/1.3 system-ui, sans-serif; }
.cs-ask label { display: flex; align-items: center; gap: 6px; }
.cs-ask input { font: inherit; width: 220px; padding: 5px 7px; border-radius: 5px; border: 1px solid #3a3a42; background: #111114; color: #fff; }
.cs-ask button { font: inherit; padding: 5px 10px; border-radius: 5px; border: 1px solid #3a3a42; background: #26262b; color: #e6e6ea; cursor: pointer; }
.cs-ask button[type="submit"] { background: #22d3ee; color: #062a31; border-color: #22d3ee; font-weight: 600; }
.cv-root .cv-card[data-cs-n] { border-color: var(--cs-c); border-width: 4px; }
.cv-root .cv-card[data-cs-n] .cv-num { background: var(--cs-c); color: #111; font-weight: 600; }
.cv-root .cv-card.cs-first:not(:first-child) { margin-left: 14px; }
.cv-root .cv-card[data-cs-n] .cv-force { background: var(--cs-c); color: #111; }
.cv-root .cv-card .cs-tag { position: absolute; left: 0; top: 21px; z-index: 1; max-width: calc(100% - 12px); padding: 1px 7px 2px; border-radius: 0 0 4px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5); background: var(--cs-c); color: #111; font: 700 10.5px/1.35 system-ui, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
.cv-root .cv-card.cs-picked { outline: 3px dashed #fff; outline-offset: 2px; box-shadow: 0 0 0 7px rgba(255, 255, 255, 0.14); }
.cv-root .cs-tools { display: inline-flex; gap: 4px; align-items: center; }
.cv-root .cs-hint { color: var(--c-dim, #9b9ba3); font-size: 11px; }
.cv-root .cs-hint b { color: #fff; font-weight: 600; }
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
    const sig = [cards.length, cache && cache.sig, picks.join(","), cur, cards[0] && cards[0].dataset.csN == null].join("|");
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
  function tools(root, L, cur) {
    const head = root.querySelector(".cv-strip-head");
    if (!head) return;
    let box = head.querySelector(".cs-tools");
    if (!box) {
      box = document.createElement("span");
      box.className = "cs-tools";
      const k = head.querySelector(".cv-k");
      head.insertBefore(box, k ? k.nextSibling : head.firstChild);
    }
    const sc = ofPanel(cur);
    const starts = sc && sc.first === cur && cur > 0;
    const pk = picked();
    box.innerHTML =
      (pk
        ? `<span class="cs-hint"><b>Panels ${pk.first + 1} to ${pk.last + 1} picked</b> (${pk.panels.length})</span><button type="button" data-cs="clear" title="Back to one panel">✕ Unpick</button>`
        : `<span class="cs-hint" title="Shift+click a storyboard to pick every panel up to it; Ctrl+click (⌘+click) to add or take out one">Shift+click to pick several</span>`) +
      (starts
        ? `<button type="button" data-cs="join" title="This panel starts a scene: make it part of the scene before">Join the scene before</button>`
        : `<button type="button" data-cs="split" title="Start a new scene at this panel"${cur > 0 ? "" : " disabled"}>✂ New scene here</button>`) +
      `<button type="button" data-cs="rename" title="Give this panel's scene a name">Rename scene</button>`;
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
      askName(b, sc);
    }
  }
  /* Rename scene asks in the page itself: the browser's own prompt box is blocked inside the app link (Jeremy
     2026-10-07: "The rename scene button doesn't seem to be working"). Enter or Save names it, Esc or Cancel leaves it. */
  function askName(btn, sc) {
    document.querySelectorAll(".cs-ask").forEach((x) => x.remove());
    const f = document.createElement("form");
    f.className = "cs-ask";
    f.innerHTML = `<label>Name this scene <input type="text" maxlength="80"></label><button type="submit">Save</button><button type="button" data-cs-cancel>Cancel</button>`;
    const inp = f.querySelector("input");
    inp.value = sc.name || "";
    document.body.appendChild(f);
    const r = btn.getBoundingClientRect();
    f.style.left = Math.max(6, Math.min(innerWidth - f.offsetWidth - 6, r.left)) + "px";
    f.style.top = (r.bottom + f.offsetHeight + 6 < innerHeight ? r.bottom + 4 : Math.max(6, r.top - f.offsetHeight - 4)) + "px";
    const done = () => {
      f.remove();
      btn.focus();
    };
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = inp.value.trim();
      done();
      if (name) rename(sc.n, name);
    });
    f.querySelector("[data-cs-cancel]").addEventListener("click", done);
    f.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Escape") done();
    });
    inp.focus();
    inp.select();
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
