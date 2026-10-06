/* The Paintings menu (window.CurioPaintings): 62 famous paintings as five-colour swatches, so things in the film
   can take colours a great painter already chose. Ported from the Paintings window and THE PAINT strip of
   Jeremy's music app (spec: painting-swatches-prompt.md, 2026-10-06). The data is paintings/paintings-data.js.

   - Paint ▾ in the Viewer's bar: Paintings (the window), The paint strip, Forget the colours.
   - The window: what the painting is for, the default row (Keep these colours as the default / the default ✓
     and Back to random, Another random painting, Keep it with this project), a hint line, then all 62 as rows
     (the swatch on the left, name and artist on the right; the painting in force is lit). A click chooses.
   - The paint strip: Control-click empty space in the picture (or Paint ▾ ▸ The paint strip) lays it along the
     edge of My film's window away from the click. Seven rows: the painting in force, then the next six. Click a
     swatch to hold its colour, then click things in the picture: each takes it (one undo step each).
   - Which painting is in force: the project's own (film.painting), else this opening's "Another random
     painting" (film.paintingNow, cleared at every opening, so never kept), else the default kept on this
     device (localStorage curio-paintings-default-v1, outside the curiosities-* project keys on purpose), else
     one random painting picked once per opening.
   - Everything that changes the film goes through the Viewer's own undo (CurioViewer.edit / changed), so ⌘Z
     and the Undo button take it back. A painted thing remembers its own colour in o.paintWas so Forget the
     colours can put it back.
   Hooks only: one <script> tag in index.html; no change to the Viewer's files. */
(function () {
  const DATA = window.CURIO_PAINTINGS;
  if (!DATA) return;
  const LIST = DATA.list;
  const N = LIST.length;
  const PREF = "curio-paintings-default-v1";
  const V = () => window.CurioViewer;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const valid = (i) => Number.isInteger(i) && i >= 0 && i < N;
  const label = (i) => LIST[i].name + " — " + LIST[i].artist;

  /* one random painting per opening of the app */
  const openingRandom = Math.floor(Math.random() * N);

  function film() {
    const v = V();
    return v && v.live ? v.live().film : null;
  }
  function pref() {
    try {
      const raw = localStorage.getItem(PREF);
      const i = raw == null ? NaN : Number(raw);
      return valid(i) ? i : null;
    } catch (e) {
      return null;
    }
  }
  function setPref(i) {
    try {
      if (i == null) localStorage.removeItem(PREF);
      else localStorage.setItem(PREF, String(i));
    } catch (e) {}
  }
  /* the painting in force and where it comes from: "project", "now" (another random), "default", "opening" */
  function inForce() {
    const f = film();
    if (f && valid(f.painting)) return { i: f.painting, from: "project" };
    if (f && valid(f.paintingNow)) return { i: f.paintingNow, from: "now" };
    const d = pref();
    if (d != null) return { i: d, from: "default" };
    return { i: openingRandom, from: "opening" };
  }
  const isRandom = (s) => s.from === "now" || s.from === "opening";
  const FROM = { project: "this project's", now: "picked at random for this opening", default: "the default", opening: "picked at random for this opening" };

  /* ---------- changes (each one Viewer undo step) ---------- */
  let step = 0;
  function edit(fn) {
    const v = V();
    const f = film();
    if (!v || !f) return false;
    v.edit("paintings-" + ++step);
    fn(film());
    v.changed(true);
    return true;
  }
  function choose(i) {
    if (!valid(i)) return false;
    const ok = edit((f) => {
      f.painting = i;
      delete f.paintingNow;
    });
    if (ok) say("colours: " + label(i));
    return ok;
  }
  function anotherRandom() {
    const cur = inForce().i;
    let i = Math.floor(Math.random() * (N - 1));
    if (i >= cur) i++;
    const ok = edit((f) => {
      delete f.painting;
      f.paintingNow = i;
    });
    if (ok) say("colours: " + label(i) + " (picked at random)");
    return ok;
  }
  function keepWithProject() {
    const s = inForce();
    if (!isRandom(s)) return false;
    const ok = edit((f) => {
      f.painting = s.i;
      delete f.paintingNow;
    });
    if (ok) say("kept with this project: " + label(s.i));
    return ok;
  }
  function keepDefault() {
    const i = inForce().i;
    setPref(i);
    say("at every opening: " + label(i));
    render();
  }
  function backToRandom() {
    setPref(null);
    say("at every opening: a random painting");
    render();
  }

  /* ---------- the status line ---------- */
  let sayT = 0;
  function say(msg) {
    let el = document.querySelector(".cvp-status");
    if (!el) {
      el = document.createElement("div");
      el.className = "cvp-status";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(sayT);
    sayT = setTimeout(() => (el.hidden = true), 2600);
  }

  /* ---------- the default row (the window and the strip both show it) ---------- */
  function defaultRow() {
    const s = inForce();
    const d = pref();
    let h = `<span class="cvp-dim">At every opening: ${d == null ? "a random painting" : esc(LIST[d].name) + " (the default)"}</span>`;
    if (d != null && d === s.i) h += `<span class="cvp-kept">the default ✓</span><button type="button" data-cvp="unkeep" title="Forget the default: each opening picks a random painting">Back to random</button>`;
    else if (d != null) h += `<button type="button" data-cvp="default" title="Open on this painting every time, in every project that has none of its own">Keep these colours as the default</button><button type="button" data-cvp="unkeep" title="Forget the default: each opening picks a random painting">Back to random</button>`;
    else h += `<button type="button" data-cvp="default" title="Open on this painting every time, in every project that has none of its own">Keep these colours as the default</button>`;
    h += `<button type="button" data-cvp="random" title="Jump to a different random painting now">Another random painting</button>`;
    if (isRandom(s)) h += `<button type="button" data-cvp="keep" title="Save this painting with the project, so it opens on it">Keep it with this project</button>`;
    return h;
  }
  function act(what) {
    if (what === "default") keepDefault();
    else if (what === "unkeep") backToRandom();
    else if (what === "random") anotherRandom();
    else if (what === "keep") keepWithProject();
    else if (what === "forget") forget();
    else if (what === "close") closeWindow();
    else if (what === "strip-close") strip(false);
  }
  const swatch = (i) => LIST[i].colors.map((c) => `<i style="background:${c}"></i>`).join("");

  /* ---------- the window ---------- */
  let win = null;
  function openWindow(anchor) {
    style();
    if (!win) {
      win = document.createElement("div");
      win.className = "cvp-win";
      win.setAttribute("role", "dialog");
      win.setAttribute("aria-label", "Paintings");
      win.addEventListener("click", (e) => {
        const r = e.target.closest("[data-pick]");
        if (r) return choose(+r.dataset.pick);
        const b = e.target.closest("[data-cvp]");
        if (b) act(b.dataset.cvp);
      });
      document.addEventListener("keydown", (e) => e.key === "Escape" && win && !win.hidden && closeWindow());
      document.body.appendChild(win);
    }
    win.hidden = false;
    renderWindow();
    const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    const w = win.offsetWidth;
    win.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r ? r.right - w : (window.innerWidth - w) / 2)) + "px";
    win.style.top = Math.max(8, r ? r.bottom + 6 : 60) + "px";
    const lit = win.querySelector(".cvp-row.on");
    if (lit && lit.scrollIntoView) lit.scrollIntoView({ block: "nearest" });
  }
  function closeWindow() {
    if (win) win.hidden = true;
  }
  function renderWindow() {
    if (!win || win.hidden) return;
    const s = inForce();
    const list = win.querySelector(".cvp-list");
    const top = list ? list.scrollTop : 0;
    win.innerHTML = `<header><b>Paintings</b><button type="button" data-cvp="close" aria-label="Close">×</button></header>
      <p class="cvp-dim">The painting's five colours are what the paint strip offers: pick one, then click things in the picture to give them that colour.</p>
      <div class="cvp-defaults">${defaultRow()}</div>
      <p class="cvp-hint">The painting in force: <b>${esc(label(s.i))}</b> (${FROM[s.from]}). Control-click empty space in the picture for the paint strip, pick a colour, then click anything.</p>
      <div class="cvp-list">${LIST.map((p, i) => `<button type="button" class="cvp-row${i === s.i ? " on" : ""}" data-pick="${i}" title="${esc(label(i))}"><span class="cvp-sw">${swatch(i)}</span><span class="cvp-name">${esc(p.name)}</span><span class="cvp-artist">${esc(p.artist)}</span></button>`).join("")}</div>`;
    win.querySelector(".cvp-list").scrollTop = top;
  }

  /* ---------- the paint strip ---------- */
  let bar = null;
  let held = null; /* { hex, i, k } */
  let side = "bottom";
  function mine() {
    const v = V();
    const c = v && v.live ? v.live().canvas : null;
    return c ? c.closest(".cv-win") : null;
  }
  function strip(on, clientY) {
    style();
    if (on === undefined) on = !(bar && !bar.hidden);
    if (!on) {
      if (bar) bar.hidden = true;
      held = null;
      return false;
    }
    const w = mine();
    if (!w) return false;
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "cvp-strip";
      bar.setAttribute("aria-label", "The paint strip");
      bar.addEventListener("pointerdown", (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();
          strip(false);
          return;
        }
        e.stopPropagation();
      });
      bar.addEventListener("click", (e) => {
        if (e.ctrlKey) return;
        const sw = e.target.closest("[data-hex]");
        if (sw) {
          held = { hex: sw.dataset.hex, i: +sw.dataset.i, k: +sw.dataset.k };
          renderStrip();
          return;
        }
        const b = e.target.closest("[data-cvp]");
        if (b) act(b.dataset.cvp);
      });
      bar.addEventListener("contextmenu", (e) => e.ctrlKey && e.preventDefault());
    }
    if (clientY != null) {
      const r = w.getBoundingClientRect();
      side = clientY > r.top + r.height / 2 ? "top" : "bottom";
    }
    if (bar.parentNode !== w) w.appendChild(bar);
    bar.hidden = false;
    renderStrip();
    return true;
  }
  function stripRows() {
    const first = inForce().i;
    const out = [first];
    for (let k = 1; out.length < 7 && k < N; k++) out.push((first + k) % N);
    return out;
  }
  function renderStrip() {
    if (!bar || bar.hidden) return;
    const w = mine();
    if (w && bar.parentNode !== w) w.appendChild(bar);
    bar.dataset.side = side;
    const short = (s) => (s.length > 28 ? s.slice(0, 27) + "…" : s);
    bar.innerHTML = `<div class="cvp-head">${defaultRow()}<span class="cvp-dim"><b>THE PAINT</b> · pick a colour, then click anything and it takes it · ${held ? `<span class="cvp-held" style="--h:${held.hex}"></span>a colour is held` : "no colour held"} · ctrl-click closes</span><button type="button" data-cvp="forget" title="Put back every thing's own colour in My film">Forget the colours</button><button type="button" data-cvp="strip-close" aria-label="Close the paint strip">×</button></div>
      <div class="cvp-rows">${stripRows()
        .map(
          (i) =>
            `<div class="cvp-srow" data-row="${i}"><span class="cvp-sname" title="${esc(label(i))}">${esc(short(LIST[i].name))}</span>${LIST[i].colors
              .map((c, k) => `<button type="button" class="cvp-cell${held && held.i === i && held.k === k ? " held" : ""}" data-hex="${c}" data-i="${i}" data-k="${k}" style="background:${c}" title="${esc(LIST[i].name)}: ${c}" aria-label="${esc(LIST[i].name)} colour ${k + 1}"></button>`)
              .join("")}</div>`
        )
        .join("")}</div>`;
  }

  /* ---------- painting a thing ---------- */
  function thing(id) {
    const f = film();
    return f ? f.objects.find((o) => o.id === id) : null;
  }
  function paint(id, hex) {
    if (!thing(id) || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
    const ok = edit((f) => {
      const o = f.objects.find((x) => x.id === id);
      if (!o) return;
      if (o.paintWas === undefined) o.paintWas = { color: o.color === undefined ? null : o.color, strokes: Array.isArray(o.strokes) ? o.strokes.map((s) => s.c) : null };
      o.color = hex;
      /* a pencil drawing's lines carry their own colours */
      if (Array.isArray(o.strokes)) o.strokes.forEach((s) => (s.c = hex));
      f.sel = id;
    });
    if (ok) say(thing(id).name + " takes " + hex);
    return ok;
  }
  function forget() {
    const f = film();
    if (!f || !f.objects.some((o) => o.paintWas !== undefined)) {
      say("My film: no painted colours to forget");
      return false;
    }
    edit((g) =>
      g.objects.forEach((o) => {
        const w = o.paintWas;
        if (w === undefined) return;
        if (w && w.color != null) o.color = w.color;
        else delete o.color;
        if (w && Array.isArray(w.strokes) && Array.isArray(o.strokes)) o.strokes.forEach((s, k) => w.strokes[k] != null && (s.c = w.strokes[k]));
        delete o.paintWas;
      })
    );
    say("My film: the colours forgotten");
    return true;
  }

  /* Control-click empty space opens or closes the strip (Control-click a thing still opens what it can do, and
     Control-drag still slides); with a colour held, a click on a thing paints it. Listened for before the
     Viewer's own handlers, so the Viewer needs no change. */
  let ctrlDown = null;
  function onDown(e) {
    const v = V();
    if (!v || !v.isOpen || !v.isOpen() || e.button !== 0) return;
    const c = v.live().canvas;
    if (e.target !== c) return;
    const pk = v.pickAt(e);
    const hit = pk && pk.obj && thing(pk.obj);
    if (e.ctrlKey) {
      ctrlDown = hit ? null : { x: e.clientX, y: e.clientY };
      return;
    }
    if (held && bar && !bar.hidden && hit) {
      e.preventDefault();
      e.stopImmediatePropagation();
      paint(pk.obj, held.hex);
    }
  }
  function onUp(e) {
    const d = ctrlDown;
    ctrlDown = null;
    if (!d || !e.ctrlKey || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
    strip(!(bar && !bar.hidden), e.clientY);
  }
  /* two quick Control-clicks open and close the strip; they are not a double-click zoom */
  function onDbl(e) {
    const v = V();
    if (e.ctrlKey && v && v.live && e.target === v.live().canvas) e.stopImmediatePropagation();
  }

  /* ---------- Paint ▾ in the Viewer's bar ---------- */
  let menu = null;
  function menuOpen(btn) {
    style();
    if (!menu) {
      menu = document.createElement("div");
      menu.className = "cvp-menu";
      menu.setAttribute("role", "menu");
      menu.hidden = true;
      menu.innerHTML = `<button type="button" role="menuitem" data-m="win">Paintings<small>choose the painting whose five colours you paint with</small></button><button type="button" role="menuitem" data-m="strip">The paint strip<small>or Control-click empty space in the picture</small></button><button type="button" role="menuitem" data-m="forget">Forget the colours<small>put back every thing's own colour in My film</small></button>`;
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("[data-m]");
        if (!b) return;
        menu.hidden = true;
        if (b.dataset.m === "win") openWindow(btn);
        else if (b.dataset.m === "strip") strip(true, 0);
        else forget();
      });
      document.addEventListener("click", (e) => {
        if (menu && !menu.hidden && !e.target.closest(".cvp-menu") && !e.target.closest(".cvp-btn")) menu.hidden = true;
      });
      document.body.appendChild(menu);
    }
    menu.hidden = !menu.hidden;
    if (menu.hidden) return;
    const r = btn.getBoundingClientRect();
    const w = menu.offsetWidth;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + "px";
    menu.style.top = r.bottom + 4 + "px";
  }
  function ensureButton() {
    const vb = document.querySelector(".cv-root.cv-viewer .cv-bar-r");
    if (!vb || vb.querySelector(".cvp-btn")) return !!vb;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cvp-btn";
    b.textContent = "Paint ▾";
    b.title = "Paintings: give things in the picture the colours of a famous painting";
    b.setAttribute("aria-haspopup", "true");
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      menuOpen(b);
    });
    const undo = vb.querySelector('[data-act="undo"]');
    vb.insertBefore(b, undo || vb.firstChild);
    return true;
  }

  function render() {
    renderWindow();
    renderStrip();
  }

  const CSS = `
.cvp-win, .cvp-strip, .cvp-menu { --p-bg:#0f0f10; --p-panel:#1c1c1e; --p-line:#2e2e33; --p-text:#ececee; --p-dim:#9b9ba3; --p-acc:#22d3ee; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; color: var(--p-text); }
.cvp-win[hidden], .cvp-strip[hidden], .cvp-menu[hidden], .cvp-status[hidden] { display: none !important; }
.cvp-win button, .cvp-strip button, .cvp-menu button { font: inherit; color: inherit; cursor: pointer; }
.cvp-win { position: fixed; z-index: 95; width: 460px; height: 520px; max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); box-sizing: border-box; display: grid; grid-template-rows: auto auto auto auto minmax(0, 1fr); gap: 6px; padding: 8px 10px 10px; background: var(--p-bg); border: 1px solid var(--p-line); border-radius: 10px; box-shadow: 0 14px 44px rgba(0,0,0,0.6); font-size: 13px; }
.cvp-win header { display: flex; justify-content: space-between; align-items: center; }
.cvp-win header button { all: unset; cursor: pointer; font-size: 18px; padding: 0 4px; color: var(--p-dim); }
.cvp-win p { margin: 0; }
.cvp-dim { color: var(--p-dim); font-size: 12px; }
.cvp-hint { font-size: 12px; color: var(--p-dim); }
.cvp-hint b { color: var(--p-text); font-weight: 600; }
.cvp-defaults, .cvp-head { display: flex; flex-wrap: wrap; gap: 3px 6px; align-items: center; }
.cvp-defaults button, .cvp-head button { border: 1px solid var(--p-line); background: var(--p-panel); border-radius: 4px; padding: 1px 6px; font-size: 11px; line-height: 1.4; }
.cvp-defaults button:hover, .cvp-head button:hover { border-color: var(--p-acc); }
.cvp-kept { font-size: 12px; color: var(--p-acc); }
.cvp-list { overflow: auto; display: grid; gap: 3px; align-content: start; padding-right: 2px; }
.cvp-row { line-height: 1.25; display: grid; grid-template-columns: 112px minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 8px; text-align: left; padding: 3px 6px; border-radius: 4px; background: var(--p-panel); border: 1px solid var(--p-line); }
.cvp-row:hover { border-color: var(--p-dim); }
.cvp-row.on { border-color: var(--p-acc); box-shadow: inset 0 0 0 1px var(--p-acc); }
.cvp-sw { grid-row: 1 / 3; align-self: center; display: flex; height: 18px; width: 112px; }
.cvp-sw i { flex: 1; }
.cvp-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
.cvp-artist { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; color: var(--p-dim); }
.cvp-strip { position: absolute; left: 0; right: 0; z-index: 6; max-height: 62%; overflow: auto; box-sizing: border-box; padding: 4px 6px; background: rgba(15,15,16,0.94); font-size: 12px; display: grid; gap: 4px; }
.cvp-strip[data-side="top"] { top: 0; border-bottom: 1px solid var(--p-line); }
.cvp-strip[data-side="bottom"] { bottom: 0; border-top: 1px solid var(--p-line); }
.cvp-head { font-size: 12px; line-height: 1.4; }
.cvp-head b { color: var(--p-text); letter-spacing: 0.06em; }
.cvp-held { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--h); vertical-align: -1px; margin-right: 4px; box-shadow: 0 0 0 1px var(--p-text); }
.cvp-rows { display: flex; flex-wrap: wrap; gap: 3px 14px; }
.cvp-srow { display: flex; align-items: center; gap: 3px; }
.cvp-sname { width: 190px; flex: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--p-dim); }
.cvp-cell { width: 36px; height: 22px; padding: 0; border: 1px solid var(--p-bg); border-radius: 0; flex: none; }
.cvp-cell.held { outline: 2px solid var(--p-text); outline-offset: -3px; }
.cvp-menu { position: fixed; z-index: 96; display: grid; gap: 2px; padding: 4px; min-width: 220px; background: #1b1c21; border: 1px solid #3a3b44; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.55); font-size: 13px; }
.cvp-menu button { all: unset; box-sizing: border-box; cursor: pointer; display: grid; padding: 5px 8px; border-radius: 6px; }
.cvp-menu button small { color: var(--p-dim); font-size: 11px; }
.cvp-menu button:hover, .cvp-menu button:focus-visible { background: #2a2c34; }
.cvp-status { position: fixed; left: 50%; bottom: 150px; transform: translateX(-50%); z-index: 97; background: rgba(12,12,14,0.92); color: #fff; padding: 8px 14px; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.4); font-size: 13px; pointer-events: none; max-width: calc(100vw - 32px); }
@media (max-width: 760px) {
  .cvp-sname { width: 120px; }
  .cvp-cell { width: 30px; }
}`;
  function style() {
    if (document.getElementById("cvp-style")) return;
    const st = document.createElement("style");
    st.id = "cvp-style";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function wire() {
    style();
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("dblclick", onDbl, true);
    /* this opening's "another random" pick is never kept: clear it from the film as it loads */
    const hook = () => {
      const v = V();
      if (!v || !v.onChange) return setTimeout(hook, 300);
      const f = film();
      if (f && f.paintingNow !== undefined) delete f.paintingNow;
      v.onChange(render);
      const tryBtn = () => ensureButton() || setTimeout(tryBtn, 400);
      tryBtn();
    };
    hook();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioPaintings = {
    list: () => LIST.map((p) => ({ name: p.name, artist: p.artist, tags: p.tags.slice(), colors: p.colors.slice() })),
    credit: DATA.credit,
    /* { i, name, artist, colors, from: "project" | "now" | "default" | "opening" } */
    inForce: () => {
      const s = inForce();
      return { i: s.i, from: s.from, name: LIST[s.i].name, artist: LIST[s.i].artist, colors: LIST[s.i].colors.slice() };
    },
    choose,
    anotherRandom,
    keepWithProject,
    keepDefault,
    backToRandom,
    defaultIndex: () => pref(),
    open: (anchor) => openWindow(anchor || document.querySelector(".cvp-btn")),
    close: closeWindow,
    isOpen: () => !!(win && !win.hidden),
    strip: (on, clientY) => strip(on, clientY),
    stripOpen: () => !!(bar && !bar.hidden),
    stripRows,
    hold: (hex) => {
      held = hex ? { hex, i: -1, k: -1 } : null;
      renderStrip();
    },
    held: () => (held ? held.hex : null),
    paint,
    forget,
    key: PREF,
  };
})();
