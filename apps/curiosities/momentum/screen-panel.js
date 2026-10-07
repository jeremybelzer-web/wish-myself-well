/* momentum/screen-panel.js: the momentum meter as a panel beside the Screen's Player (screen/, CapCut layout).
   It follows the Player's playhead and shows, for My film and for each inspiration film in the Player:
   which family of curiosities holds the audience's attention at that moment, how long it has held it against
   the limit (● Fresh, ▲ Getting long, ■ Too long), and a ribbon of the whole film colored by family (click it
   to move the playhead). Under them the Compass points at the family to move attention to next, compared
   with the inspiration films on screen, and "Make this move here" writes a node at the playhead (one undo step).
   A fold button shrinks the panel to a slim meter.

   It docks through the Screen's own hooks: CurioScreen.addPanel({ id, label, place: "player", mount(el) }) (the
   Screen owns where the panel goes), CurioScreen.row() and setRow() for the playhead, and CurioScreen.on(fn) to
   redraw after every Screen redraw and playhead move. With an older Screen that has no addPanel it puts itself
   in the Player (.sc-player) and reads the playhead from the Player's text. momentum.css lays out the column.
   Nothing in screen/ or engine/ is changed.

   window.CurioMomentumScreen
   - attach() / detach() / attached()
   - mount(el, { row(), setRow(i) }) -> { draw, destroy }: the panel in any element
   - read() -> { row, mine: { reading, at }, films: [{ id, title, reading, at, beat }], compass }
   Its own setting (folded or not) is localStorage key curiosities-momentum-screen-v1; seconds per moment, the
   limit and the films to compare with are the Momentum window's (curiosities-momentum-v1). */
(function () {
  const KEY = "curiosities-momentum-screen-v1";
  const A = () => window.CurioAttention;
  const M = () => window.CurioMomentum;
  const R = () => window.CurioRates;
  const C = () => window.CurioCompass;
  const ME = () => window.CurioMomentumEngine;
  const SC = () => window.CurioScreen;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  /* The same family colors as the Momentum window (ui.js). */
  /* Family colors and the status marks come from notes.js (CurioMomentum.mark, CurioMomentum.status). */
  const colorOf = (f) => M().mark(f).color;
  const famLabel = (f) => (M() && M().family(f) ? M().family(f).label : f || "");
  const cueLabel = (c) => {
    const x = M() && M().CUES.find((k) => k.id === c);
    return x ? x.label : c || "";
  };

  let own = { folded: false, against: "screen" };
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    if (p && typeof p === "object") own = { folded: !!p.folded, against: p.against === "list" ? "list" : "screen" };
  } catch (e) {}
  const saveOwn = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(own));
    } catch (e) {}
  };
  /* The Momentum window's settings. */
  function momentumPrefs() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem("curiosities-momentum-v1"));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return {
      spb: Number(p.secondsPerPanel) > 0 ? Number(p.secondsPerPanel) : 3,
      limit: Number(p.limit) > 0 ? Number(p.limit) : null,
      compare: Array.isArray(p.compare) && p.compare.length ? p.compare : ["pulp-fiction"],
      measured: Array.isArray(p.measured) ? p.measured : [],
    };
  }

  /* ---------- the films in the Player (the same lists the Screen uses) ---------- */
  function films() {
    let list = [];
    try {
      if (window.CuriosityStudy && window.CuriosityStudy.studies) list = window.CuriosityStudy.studies();
    } catch (e) {
      list = [];
    }
    if (!list.length && window.CuriosityDB && window.CuriosityDB.data) list = window.CuriosityDB.data.scenes || [];
    return list.filter((s) => s && Array.isArray(s.beats) && s.beats.length);
  }
  const filmTitle = (f) => (f ? String(f.title || f.name || f.id).replace(/^Model scene: /, "") : "");
  function screenFilms() {
    const st = SC() && SC().state ? SC().state() : null;
    const list = films();
    return ((st && st.insp) || []).map((v) => list.find((f) => f.id === v.film) || list[0]).filter(Boolean);
  }

  /* ---------- the playhead ---------- */
  function rowNow() {
    if (SC() && typeof SC().row === "function") return SC().row() | 0;
    const sub = document.querySelector('.sc-page .sc-viewer.mine .sc-vsub');
    const m = sub && /moment (\d+) of/.exec(sub.textContent);
    if (m) return Math.max(0, Number(m[1]) - 1);
    const tc = document.querySelector(".sc-page .sc-tc");
    const t = tc && /(\d+):(\d+)\s*\//.exec(tc.textContent);
    return t ? Number(t[1]) * 60 + Number(t[2]) : 0;
  }

  /* ---------- the readings ---------- */
  /* Attention at beat i: the reading of the film up to and including it, so "held" is how long the family
     has held attention by the end of that beat. */
  function readAt(beats, i, opts) {
    const r = A().read(beats.slice(0, Math.max(0, i) + 1), opts);
    return { reading: r, run: r.stats.currentRun, seg: r.segments[r.segments.length - 1] || null };
  }
  /* The family holding attention on each beat, for the ribbon. */
  function ribbon(beats, opts) {
    const r = A().read(beats, opts);
    const out = new Array(beats.length).fill(null);
    r.segments.forEach((s, k) => {
      const end = k + 1 < r.segments.length ? r.segments[k + 1].beat : beats.length;
      for (let j = s.beat; j < end; j++) out[j] = s.family;
    });
    return { families: out, full: r };
  }
  /* The inspiration films do not change when My film does, so their readings are kept: an engine change then
     reads only My film (2 readings instead of 2 per film). Keyed by the film itself, the beat and the settings. */
  let filmMemo = new WeakMap();
  function memo(f, key, make) {
    let m = filmMemo.get(f);
    if (!m || m.beats !== f.beats || m.len !== f.beats.length) filmMemo.set(f, (m = { beats: f.beats, len: f.beats.length, map: new Map() }));
    if (!m.map.has(key)) {
      if (m.map.size > 200) m.map.clear();
      m.map.set(key, make());
    }
    return m.map.get(key);
  }
  const filmAt = (f, b, fo) => memo(f, "at|" + b + "|" + fo.secondsPerBeat + "|" + fo.limit, () => Object.assign(readAt(f.beats, b, fo), ribbon(f.beats, fo)));
  const measured = (f, spb) => memo(f, "measure|" + spb, () => R().measure(f, { secondsPerBeat: spb }));
  function read(rowArg) {
    if (!A() || !M() || !R()) return null;
    const mp = momentumPrefs();
    const onScreen = screenFilms();
    const listed = R().DEFAULT_FILMS.concat(mp.measured).filter((x) => mp.compare.includes(x.id));
    const measuredOnScreen = onScreen.map((f) => measured(f, mp.spb));
    const profiles = own.against === "screen" && measuredOnScreen.length ? measuredOnScreen : listed;
    const target = R().average(profiles);
    const limit = mp.limit || R().limitFor(target);
    const opts = { secondsPerBeat: mp.spb, limit };
    const mineBeats = ME() ? ME().flatBeats() : [];
    const row = Math.max(0, Math.min(mineBeats.length - 1, rowArg == null ? rowNow() : rowArg));
    const mine = mineBeats.length ? Object.assign(readAt(mineBeats, row, opts), ribbon(mineBeats, opts), { n: mineBeats.length }) : null;
    const n = mineBeats.length;
    const filmsOut = onScreen.map((f, k) => {
      const b = f.beats.length > 1 && n > 1 ? Math.round((row * (f.beats.length - 1)) / (n - 1)) : 0;
      const fo = { secondsPerBeat: mp.spb, limit };
      return Object.assign({ id: f.id, key: f.id + ":" + k, title: filmTitle(f), beat: b, n: f.beats.length }, filmAt(f, b, fo));
    });
    const compass = mine && C() ? C().point(mine.reading, profiles) : null;
    return { row, n, limit, spb: mp.spb, mine, films: filmsOut, compass, against: profiles.length ? (own.against === "screen" && measuredOnScreen.length ? "the films on screen" : profiles.map((p) => p.title).join(", ")) : "" };
  }

  /* ---------- drawing ---------- */
  const status = (run, lim) => M().status(run ? run.dur : null, lim);
  function meterHtml(name, sub, x, lim, kind, key) {
    const run = x && x.run;
    const st = status(run, lim);
    const held = run ? Math.round(run.dur) : 0;
    const pct = run ? Math.min(100, (run.dur / lim) * 100) : 0;
    const seg = x && x.seg;
    const mv = (x && x.reading && x.reading.stats.moves) || [];
    const lastMove = mv[mv.length - 1] || null;
    const fams = (x && x.families) || [];
    const at = kind === "mine" ? x && x.reading.beats - 1 : x && x.beat;
    const cells = fams.map((f, j) => `<i style="background:${f ? colorOf(f) : "transparent"}"${j === at ? ' class="on"' : ""} title="${esc("Moment " + (j + 1) + (f ? ": " + famLabel(f) : ""))}"></i>`).join("");
    return `<div class="mo-sp-film" data-kind="${kind}"${key ? ` data-key="${esc(key)}"` : ""}>
      <p class="mo-sp-name"><b title="${esc(name)}">${esc(name)}</b><small>${esc(sub)}</small></p>
      ${run ? `<p class="mo-sp-fam"><i style="background:${colorOf(run.family)}"></i><b>${esc(famLabel(run.family))}</b>${seg ? `<small>${esc(seg.label)}</small>` : ""}</p>` : `<p class="mo-sp-fam"><small>Nothing holds attention yet.</small></p>`}
      <div class="mo-sp-bar ${st.cls}" role="meter" aria-label="${esc(name)}: how long attention has stayed" aria-valuemin="0" aria-valuemax="${lim}" aria-valuenow="${held}"><span style="width:${pct.toFixed(1)}%"></span></div>
      <p class="mo-sp-held"><span>${held} s of ${lim} s</span><span class="mo-sp-st ${st.cls}">${st.icon} ${esc(st.text)}</span></p>
      ${lastMove ? `<p class="mo-sp-move" title="The last time attention moved from one kind of curiosity to another, and the cue (what made it move) that did it">Came from ${esc(famLabel(lastMove.from))} on ${lastMove.quiet ? "a stop (" + esc(cueLabel(lastMove.cue).toLowerCase()) + ")" : "a " + esc(cueLabel(lastMove.cue).toLowerCase())}</p>` : ""}
      ${cells ? `<div class="mo-sp-rib" data-rib="${kind}" data-n="${fams.length}" title="${kind === "mine" ? "Your film, colored by what holds attention. Click to move the playhead." : "This film, colored by what holds attention. Click to move the playhead."}">${cells}</div>` : ""}
    </div>`;
  }
  function compassHtml(c, about) {
    if (!c || !c.options.length) return "";
    const o = c.options[0];
    const reason = o.reasons[0] || "";
    const n = o.note;
    return `<div class="mo-sp-next">
      <p class="mo-sp-name"><b>Move attention next to</b></p>
      <p class="mo-sp-fam"><i style="background:${colorOf(o.family)}"></i><b>${esc(o.label)}</b><small>${esc(cueLabel(o.cue))}</small></p>
      ${reason ? `<p class="mo-sp-why">${esc(reason)}</p>` : ""}
      ${n ? `<p class="mo-sp-why">Try: <b>${esc(n.label)}</b>. ${esc(n.tryThis || "")}</p>` : ""}
      <p class="mo-sp-why"><small>Compared with ${esc(about)}.</small></p>
      <button type="button" data-mo-sp="move" title="Change one ${esc(o.label)} curiosity one step at the playhead, so attention moves to it. Undo takes it back.">Make this move here</button>
    </div>`;
  }

  function mount(el, hooks) {
    const h = hooks || {};
    const getRow = () => (typeof h.row === "function" ? h.row() : rowNow());
    let last = "";
    let flash = "";
    let data = null;
    el.classList.add("mo-sp");
    function draw(force) {
      if (!el.isConnected) return;
      /* While the Screen is closed the panel is not on show: skip the work; the Screen redraws when it opens again
         and tells us (CurioScreen.on), so the panel is drawn fresh then, instead of reading the films for nothing. */
      if (!force && !el.getClientRects().length) return;
      try {
        data = read(getRow());
      } catch (e) {
        data = null;
      }
      el.classList.toggle("folded", own.folded);
      let html;
      if (!data || !data.mine) {
        html = `<header class="mo-sp-h"><strong>Momentum</strong><button type="button" data-mo-sp="fold" aria-expanded="${!own.folded}" title="${own.folded ? "Show the momentum panel" : "Fold it to a slim meter"}">${own.folded ? "‹" : "›"}</button></header><p class="mo-sp-empty">The meter shows here once your film has moments.</p>`;
      } else if (own.folded) {
        const run = data.mine.run;
        const st = status(run, data.limit);
        const pct = run ? Math.min(100, (run.dur / data.limit) * 100) : 0;
        html = `<button type="button" data-mo-sp="fold" class="mo-sp-slim" aria-expanded="false" title="Momentum: ${esc(run ? famLabel(run.family) + " has held attention " + Math.round(run.dur) + " of " + data.limit + " seconds (" + st.text + ")" : "nothing yet")}. Click to open the panel.">
          <span class="mo-sp-vbar ${st.cls}"><span style="height:${pct.toFixed(1)}%;--w:${pct.toFixed(1)}%;background:${run ? colorOf(run.family) : M().OTHER}"></span></span><span class="mo-sp-st ${st.cls}">${st.icon}</span><span class="mo-sp-vt">Momentum</span></button>`;
      } else {
        html = `<header class="mo-sp-h"><strong>Momentum</strong><button type="button" data-mo-sp="open" title="Open the whole Momentum window">Open</button><button type="button" data-mo-sp="fold" aria-expanded="true" title="Fold it to a slim meter">›</button></header>
          ${flash ? `<p class="mo-sp-flash" role="status">${esc(flash)}</p>` : ""}
          <div class="mo-sp-body">
            ${meterHtml("My film", `moment ${data.row + 1} of ${data.n}`, data.mine, data.limit, "mine")}
            ${data.films.map((f) => meterHtml(f.title, `moment ${f.beat + 1} of ${f.n}`, f, data.limit, "film", f.key)).join("")}
            ${compassHtml(data.compass, data.against)}
            <p class="mo-sp-foot">A moment lasts ${data.spb} s; the limit is ${data.limit} s. <label><input type="checkbox" data-mo-sp="against"${own.against === "screen" ? " checked" : ""}> Compare with the films on screen</label></p>
          </div>`;
      }
      if (!force && html === last) return;
      last = html;
      el.innerHTML = html;
    }
    function onClick(e) {
      const t = e.target.closest("[data-mo-sp], .mo-sp-rib");
      if (!t || !el.contains(t)) return;
      const act = t.dataset.moSp;
      if (act === "fold") {
        own.folded = !own.folded;
        saveOwn();
        flash = "";
        return draw(true);
      }
      if (act === "open") return window.CurioMomentumUI && window.CurioMomentumUI.open();
      if (act === "move") {
        const o = data && data.compass && data.compass.options[0];
        const st = window.CurioEngine && window.CurioEngine.state();
        const rowId = st && st.rows[data.row] && st.rows[data.row].id;
        const mv = o && ME() ? ME().moveAt(o, rowId) : null;
        const r = mv ? ME().applyMove(mv) : null;
        flash = r && r.ok ? `${mv.label} is now ${mv.value} at moment ${data.row + 1}. Undo takes it back.` : `Nothing to move here${r && r.error ? ": " + r.error : "."}`;
        return draw(true);
      }
      if (t.classList.contains("mo-sp-rib")) {
        const box = t.getBoundingClientRect();
        const n = Number(t.dataset.n) || 1;
        const j = Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - box.left) / Math.max(1, box.width)) * n)));
        const total = data ? data.n : 1;
        const row = t.dataset.rib === "mine" ? j : n > 1 && total > 1 ? Math.round((j * (total - 1)) / (n - 1)) : 0;
        flash = "";
        if (typeof h.setRow === "function") h.setRow(row);
        else if (SC() && SC().setRow) SC().setRow(row);
        return draw(true);
      }
    }
    function onChange(e) {
      if (e.target.dataset.moSp === "against") {
        own.against = e.target.checked ? "screen" : "list";
        saveOwn();
        draw(true);
      }
    }
    el.addEventListener("click", onClick);
    el.addEventListener("change", onChange);
    draw(true);
    return {
      draw,
      destroy() {
        el.removeEventListener("click", onClick);
        el.removeEventListener("change", onChange);
        el.classList.remove("mo-sp", "folded");
        el.innerHTML = "";
      },
    };
  }

  /* ---------- docking beside the Player ---------- */
  let dock = null;
  let panel = null;
  let watcher = null;
  let unEngine = null;
  let queued = false;
  const redraw = () => {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || setTimeout)(() => {
      queued = false;
      if (panel) panel.draw();
    });
  };
  let unScreen = null;
  function attach() {
    if (dock && dock.isConnected) return true;
    const S = SC();
    /* The Screen's own dock: it decides where the panel goes in each layout and tells us on every redraw and
       every playhead move. */
    if (S && typeof S.addPanel === "function") {
      if (panel) return true;
      return S.addPanel({
        id: "momentum",
        label: "Momentum",
        place: "player",
        mount(el) {
          dock = el;
          panel = mount(el, { row: () => S.row(), setRow: (i) => S.setRow(i) });
          if (typeof S.on === "function") unScreen = S.on(redraw);
          if (window.CurioEngine && window.CurioEngine.on) unEngine = window.CurioEngine.on(redraw);
        },
      }) !== false || !!panel;
    }
    /* An older Screen with no dock: put the panel in the Player ourselves and watch it redraw. */
    const player = document.querySelector(".sc-page .sc-player");
    if (!player) return false;
    dock = document.createElement("aside");
    dock.setAttribute("aria-label", "Momentum");
    player.appendChild(dock);
    player.classList.add("mo-sp-host");
    panel = mount(dock);
    watcher = new MutationObserver(redraw);
    [".sc-viewers", ".sc-transport"].forEach((sel) => {
      const n = player.querySelector(sel);
      if (n) watcher.observe(n, { childList: true, subtree: true, characterData: true });
    });
    if (window.CurioEngine && window.CurioEngine.on) unEngine = window.CurioEngine.on(redraw);
    return true;
  }
  function detach() {
    if (watcher) watcher.disconnect();
    if (typeof unEngine === "function") unEngine();
    if (typeof unScreen === "function") unScreen();
    if (panel) panel.destroy();
    if (dock && dock.parentNode) {
      dock.parentNode.classList.remove("mo-sp-host");
      dock.remove();
    }
    dock = panel = watcher = unEngine = unScreen = null;
  }
  /* The Screen builds its page (on the body) when it first opens, which can be long after the app starts. */
  function boot() {
    if (attach() || !document.body) return;
    /* The Screen's files load after this one: once they have, use its dock even before it opens. */
    window.addEventListener("load", () => !panel && attach());
    const wait = new MutationObserver(() => attach() && wait.disconnect());
    wait.observe(document.body, { childList: true });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  window.CurioMomentumScreen = { attach, detach, attached: () => !!(dock && dock.isConnected), mount, read, rowNow };
})();
