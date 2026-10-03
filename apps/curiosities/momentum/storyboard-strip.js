/* momentum/storyboard-strip.js: the attention meter where people flip through panels, on the Storyboard
   (storyboard.js). Nothing in storyboard.js is changed.

   Under each storyboard scene's panels (All scenes) and under the flip book's small pictures (Flip through) it
   adds a momentum strip: one cell per panel, colored by the family of curiosities holding the audience's
   attention there, a letter where attention moved to a new family (the cue that moved it: V visual, A audio,
   T thought, M movement, P plot; a dot before it means a quiet cue, something stopping), and ▲ Getting long or
   ■ Too long where one family has held attention near or past the limit (the words are in each cell's title).
   Cells line up under the panels (the storyboard's own column widths) and scroll with them; clicking a cell
   jumps the flip book there, through the storyboard's own data-go / data-open handling.
   In Flip through a compact meter under the transport follows the panel on show, also while it plays.

   Each scene is read with CurioAttention.fromScene; a panel lasts the Momentum window's "Seconds per panel"
   (localStorage curiosities-momentum-v1, 3 by default) and the limit is that window's too.

   Docking: the storyboard exposes no redraw or panel-change event, so one MutationObserver on the page notices
   its elements (.sb, .sb-reel, the flip book's [data-sb=count] that it rewrites on every panel) and, once per
   animation frame at most, adds a strip to any reel that has none and moves the meter to the panel shown
   (.sb-thumb.on, else the "n / total" in the count line). The storyboard redraws its reels on every change, so
   new reels get new strips.

   window.CurioMomentumStoryboard
   - model(scene, { secondsPerPanel, limit }) -> { cells: [{ panel, family, label, cue, quiet, held, status,
       moved: { from, cue, quiet } | null }], limit, spb, reading }   (pure; works in Node)
   - settings(prefs, CurioRates) -> { spb, limit }                       (pure)
   - status(held, limit) -> { cls, icon, text }
   - attach() / detach() / attached() / scan() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const R = () => root.CurioRates;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  /* The same family colors as the Momentum window (ui.js). */
  /* Family colors and the status marks come from notes.js (CurioMomentum.mark, CurioMomentum.status). */
  const colorOf = (f) => M().mark(f).color;
  const famLabel = (f) => (M() && M().family(f) ? M().family(f).label : f || "");
  const cueLabel = (c) => {
    const x = M() && M().CUES.find((k) => k.id === c);
    return x ? x.label : c || "";
  };
  const cueLetter = (c, quiet) => (quiet ? "·" : "") + String(c || "?")[0].toUpperCase();
  const r1 = (x) => Math.round(x * 10) / 10;

  /* ---------- the reading (pure) ---------- */
  const status = (held, limit) => M().status(held, limit);
  /* The Momentum window's seconds per panel and limit, from its saved choices. */
  function settings(p, Rates) {
    p = p && typeof p === "object" ? p : {};
    const spb = Number(p.secondsPerPanel) > 0 ? Number(p.secondsPerPanel) : 3;
    let limit = Number(p.limit) > 0 ? Number(p.limit) : null;
    if (!limit && Rates) {
      const compare = Array.isArray(p.compare) && p.compare.length ? p.compare : ["pulp-fiction"];
      const measured = Array.isArray(p.measured) ? p.measured.filter((x) => x && x.id) : [];
      const picked = Rates.DEFAULT_FILMS.concat(measured).filter((x) => compare.includes(x.id));
      try {
        limit = Rates.limitFor(Rates.average(picked.length ? picked : Rates.DEFAULT_FILMS.slice(0, 1)));
      } catch (e) {
        limit = null;
      }
    }
    return { spb, limit: limit || 20 };
  }
  /* One cell per panel: who holds attention there, how long their family has held it by the end of that panel,
     and whether attention moved to a new family on this panel (with the cue). */
  function model(scene, opts) {
    const o = opts || {};
    const spb = Number(o.secondsPerPanel) > 0 ? Number(o.secondsPerPanel) : 3;
    const limit = Number(o.limit) > 0 ? Number(o.limit) : 20;
    const panels = (scene && Array.isArray(scene.panels) && scene.panels) || [];
    const reading = A().fromScene(scene, { secondsPerBeat: spb, limit });
    const segs = reading.segments;
    const runs = A().familyRuns(segs);
    const cells = panels.map((p, i) => {
      let seg = null;
      let k = -1;
      for (let j = 0; j < segs.length && segs[j].beat <= i; j++) {
        seg = segs[j];
        k = j;
      }
      if (!seg) return { panel: i, family: null, label: "", cue: null, quiet: false, held: null, status: status(null, limit), moved: null };
      const start = i * spb;
      const run = runs.find((r) => r.from <= start + 1e-9 && start < r.to - 1e-9) || runs[runs.length - 1];
      const held = r1(Math.min(run.to, start + spb) - run.from);
      const prev = k > 0 ? segs[k - 1] : null;
      const moved = seg.beat === i && prev && prev.family !== seg.family ? { from: prev.family, cue: seg.cue, quiet: !!seg.quiet } : null;
      return { panel: i, family: seg.family, label: seg.label, cue: seg.cue, quiet: !!seg.quiet, held, status: status(held, limit), moved };
    });
    return { cells, limit, spb, reading };
  }

  const api = { model, settings, status, colorOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CurioMomentumStoryboard = api;
  if (typeof document === "undefined") return;

  /* ---------- drawing ---------- */
  /* The storyboard's own column widths (storyboard.js THUMB_PITCH and GRID_PITCH): a 64px small picture plus a
     4px gap, and a 170px grid panel plus a 10px gap. */
  const THUMB_PITCH = 68;
  const GRID_PITCH = 180;
  const PREFS = "curiosities-momentum-v1";
  function prefsText() {
    try {
      return localStorage.getItem(PREFS) || "";
    } catch (e) {
      return "";
    }
  }
  function currentSettings(text) {
    let p = null;
    try {
      p = JSON.parse(text);
    } catch (e) {}
    return settings(p, R());
  }
  function cellTitle(c, sceneNo, set) {
    if (!c.family) return `Scene ${sceneNo}, panel ${c.panel + 1}: nothing holds attention yet.`;
    let t = `Scene ${sceneNo}, panel ${c.panel + 1}: ${famLabel(c.family)} holds attention (${c.label}), ${c.held} of ${set.limit} seconds. ${c.status.icon} ${c.status.text}.`;
    if (c.moved) t += ` Attention moved here from ${famLabel(c.moved.from)} on ${c.moved.quiet ? "a quiet " + cueLabel(c.moved.cue).toLowerCase() + " cue (something stopping)" : "a " + cueLabel(c.moved.cue).toLowerCase() + " cue"}.`;
    return t;
  }
  /* items: [{ si, pi, k? , cell }] in reel order. */
  function stripHtml(items, pitch, set, kind) {
    const cells = items
      .map((it) => {
        const c = it.cell;
        const go = it.k != null ? `data-go="${it.k}"` : `data-open="${it.si}:${it.pi}"`;
        const first = it.pi === 0 && kind === "flip" ? " first" : "";
        const mark = c.status.cls !== "good" ? `<span class="mo-sbs-st ${c.status.cls}" aria-hidden="true">${c.status.icon}</span>` : "";
        const cue = c.moved ? `<span class="mo-sbs-cue" aria-hidden="true">${esc(cueLetter(c.moved.cue, c.moved.quiet))}</span>` : "";
        return `<span class="mo-sbs-cell${first}${c.moved ? " moved" : ""}" ${go} data-mo-k="${it.k != null ? it.k : ""}" title="${esc(cellTitle(c, it.si + 1, set))}"><i style="background:${c.family ? colorOf(c.family) : "transparent"}"></i>${cue}${mark}</span>`;
      })
      .join("");
    return `<div class="mo-sbs-label"><b>Attention</b> <span class="sb-small">color: the kind of curiosity holding attention; letter: the cue that moved it there; ▲ getting long, ■ too long. A panel lasts ${set.spb} s, the limit is ${set.limit} s.</span></div>
      <div class="mo-sbs-row" style="--mo-pitch:${pitch}px;--mo-gap:${pitch === THUMB_PITCH ? 4 : 10}px;width:${items.length * pitch}px" role="group" aria-label="What holds attention across ${items.length} panels">${cells}</div>`;
  }
  function meterHtml(it, set) {
    if (!it) return "";
    const c = it.cell;
    const sceneNo = it.si + 1;
    if (!c.family) return `<p class="mo-sbm-line"><b>Attention</b> <span class="sb-small">Nothing holds attention yet in scene ${sceneNo}, panel ${it.pi + 1}.</span></p>`;
    const pct = Math.min(100, (c.held / set.limit) * 100);
    const moved = c.moved
      ? `Moved here from ${esc(famLabel(c.moved.from))} on ${c.moved.quiet ? "a quiet " + esc(cueLabel(c.moved.cue).toLowerCase()) + " cue" : "a " + esc(cueLabel(c.moved.cue).toLowerCase()) + " cue"}.`
      : "";
    return `<p class="mo-sbm-line"><i class="mo-sbm-sw" style="background:${colorOf(c.family)}"></i><b>${esc(famLabel(c.family))}</b> <span class="sb-small">${esc(c.label)}</span>
        <span class="mo-sbm-st ${c.status.cls}">${c.status.icon} ${esc(c.status.text)}</span></p>
      <div class="mo-sbm-bar ${c.status.cls}" role="meter" aria-label="How long ${esc(famLabel(c.family))} has held attention" aria-valuemin="0" aria-valuemax="${set.limit}" aria-valuenow="${c.held}"><span style="width:${pct.toFixed(1)}%"></span></div>
      <p class="mo-sbm-held sb-small">${c.held} s of ${set.limit} s by the end of panel ${it.pi + 1}. ${moved}</p>`;
  }

  /* ---------- docking on the storyboard ---------- */
  let watcher = null;
  let queued = false;
  let lastPrefs = null;
  let cache = null; /* { sig, scenes: [model] } */
  function models(text) {
    const SB = root.CuriosityStoryboard;
    if (!SB || typeof SB.data !== "function" || !A() || !M()) return null;
    const set = currentSettings(text);
    const data = SB.data();
    const sig = text + "|" + JSON.stringify(data.scenes.map((s) => s.panels));
    if (cache && cache.sig === sig) return cache;
    const scenes = data.scenes.map((s) => {
      try {
        return model(s, { secondsPerPanel: set.spb, limit: set.limit });
      } catch (e) {
        return { cells: s.panels.map((p, i) => ({ panel: i, family: null, held: null, status: status(null, set.limit), moved: null })) };
      }
    });
    cache = { sig, set, scenes };
    return cache;
  }
  function flipItems(mo) {
    const out = [];
    mo.scenes.forEach((m, si) => m.cells.forEach((cell, pi) => out.push({ si, pi, k: out.length, cell })));
    return out;
  }
  function currentPage(viewer) {
    const on = viewer.querySelector(".sb-thumb.on[data-go]");
    if (on) return Number(on.dataset.go);
    const count = viewer.querySelector("[data-sb=count]");
    const m = count && /(\d+)\s*\/\s*(\d+)\s*$/.exec(count.textContent);
    return m ? Number(m[1]) - 1 : -1;
  }
  function scan() {
    queued = false;
    const sb = document.querySelector(".sb");
    if (!sb) return false;
    const text = prefsText();
    const changed = text !== lastPrefs;
    lastPrefs = text;
    if (changed) document.querySelectorAll(".mo-sbs, .mo-sbm").forEach((n) => n.remove());
    let mo = null;
    const get = () => mo || (mo = models(text));
    /* All scenes: one strip per scene, between its panels and the storyboard's bands. */
    document.querySelectorAll(".sb-scene[data-scene]").forEach((sec) => {
      const reel = sec.querySelector(".sb-reel");
      const strip = reel && reel.querySelector(":scope > .sb-strip");
      if (!strip || reel.querySelector(":scope > .mo-sbs") || !get()) return;
      const si = Number(sec.dataset.scene);
      const m = mo.scenes[si];
      if (!m) return;
      const box = document.createElement("div");
      box.className = "mo-sbs";
      box.innerHTML = stripHtml(m.cells.map((cell, pi) => ({ si, pi, cell })), GRID_PITCH, mo.set, "grid");
      strip.after(box);
    });
    /* Flip through: a strip across every panel under the small pictures, and the meter under the transport. */
    const viewer = document.querySelector(".sb [data-sb=viewer]");
    if (viewer) {
      const reel = viewer.querySelector("[data-sb=thumbs]");
      const row = reel && reel.querySelector(":scope > .sb-thumbrow");
      let box = reel && reel.querySelector(":scope > .mo-sbs");
      if (row && !box && get()) {
        box = document.createElement("div");
        box.className = "mo-sbs";
        box.innerHTML = stripHtml(flipItems(mo), THUMB_PITCH, mo.set, "flip");
        box.__mo = mo;
        row.after(box);
      }
      /* The reading the strip was drawn from: the storyboard redraws the reel whenever its scenes change. */
      const shown = (box && box.__mo) || get();
      let meter = viewer.querySelector(":scope > .mo-sbm");
      const transport = viewer.querySelector(":scope > .sb-transport");
      if (!meter && transport && shown) {
        meter = document.createElement("div");
        meter.className = "mo-sbm";
        transport.after(meter);
      }
      const k = currentPage(viewer);
      if (meter && shown && String(k) !== meter.dataset.at) {
        meter.dataset.at = String(k);
        meter.innerHTML = meterHtml(flipItems(shown)[k], shown.set);
        if (box) {
          const old = box.querySelector(".mo-sbs-cell.on");
          if (old) old.classList.remove("on");
          const cur = box.querySelector(`.mo-sbs-cell[data-mo-k="${k}"]`);
          if (cur) cur.classList.add("on");
        }
      }
    }
    return true;
  }
  const schedule = () => {
    if (queued) return;
    queued = true;
    (root.requestAnimationFrame || setTimeout)(scan);
  };
  /* Changes inside the strip, the Momentum window or the Screen's momentum panel never touch a storyboard reel,
     so they do not wake the scan (every Momentum tab draw would otherwise). */
  const ours = (n) => {
    const el = n && (n.nodeType === 1 ? n : n.parentElement);
    return !!(el && el.closest && el.closest(".mo-sbs, .mo-sbm, .mo-dlg, .mo-sp"));
  };
  function onMutate(list) {
    /* The strip's own changes (and the Momentum window's) do not count. */
    for (const m of list) {
      if (ours(m.target)) continue;
      if (m.type === "childList" && [...m.addedNodes, ...m.removedNodes].every(ours)) continue;
      return schedule();
    }
  }
  function attach() {
    if (watcher || !document.body) return !!watcher;
    watcher = new MutationObserver(onMutate);
    watcher.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    schedule();
    return true;
  }
  function detach() {
    if (watcher) watcher.disconnect();
    watcher = null;
    cache = null;
    document.querySelectorAll(".mo-sbs, .mo-sbm").forEach((n) => n.remove());
  }
  function boot() {
    attach();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  /* The Momentum window's settings live in localStorage; another tab changing them redraws too. */
  root.addEventListener("storage", (e) => e.key === PREFS && schedule());

  Object.assign(api, { attach, detach, attached: () => !!watcher, scan, refresh: () => ((lastPrefs = null), schedule()) });
})();
