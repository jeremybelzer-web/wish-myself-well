/* momentum/screen-lane.js: an "Attention" lane on the Screen's timeline (screen/ui.js, CapCut layout).
   One cell per moment of My film, colored by the family of curiosities holding the audience's attention, with
   the family's letter where attention moved to it. Under it a thin strip says how long that family has held
   attention (● Fresh, ▲ Getting long, ■ Too long), with a small "Fix this" link on each Too long stretch that
   opens the Momentum window on its Compass tab. The playhead's moment is outlined; click a cell to move the
   playhead there; hover a cell for a plain sentence about it. A fold button shrinks the lane to its name.

   Lining up with the timeline: the timeline (screen/lanes.js) draws one column per moment, colW pixels wide,
   inside a scrolling box (.sl-scroll) after a column of lane names, and zooms by changing colW. This lane reads
   where the timeline's drawing (.sl-svg) actually sits on the page and puts its cells at the same left edge
   and the same width, clipped to the part of the timeline you can see. Scrolling the timeline moves the cells
   (no redraw); zooming or resizing redraws the timeline, which this lane notices and follows. With no
   timeline drawing to measure, the cells share the lane's width evenly instead.

   Cost (momentum/PERFORMANCE.md): one reading of My film after an engine change, nothing else. A playhead move
   only moves the outline. Nothing is drawn or read while the Screen is closed; the Screen tells us when it
   opens again (CurioScreen.on) and the lane catches up then.

   It docks through CurioScreen.addPanel({ id: "momentum-lane", place: "timeline", mount(el) }); nothing in
   screen/ or engine/ is changed. Family colors and letters come from CurioMomentum.mark, the marks from
   CurioMomentum.status.

   window.CurioMomentumLane
   - cells(reading, { n, secondsPerBeat, limit, status }) -> [{ i, family, start, moved, held, status }]
       (pure; also module.exports.cells in Node). One entry per moment: the family holding attention (null
       before anything does), start: true where a family's stretch begins, moved: true where attention came
       from another family, held: seconds that family has held attention by the end of the moment, status:
       status(held, limit) or null.
   - stretches(cells) -> [{ from, to, family }]: the Too long stretches, for the "Fix this" links (pure).
   - tip(cell, mark) -> the hover sentence (pure).
   - attach() / detach() / attached()
   Its own setting (folded or not) is localStorage key curiosities-momentum-lane-v1; seconds per moment, the
   limit and the films to compare with are the Momentum window's (curiosities-momentum-v1) and the Screen
   panel's (curiosities-momentum-screen-v1), so the lane agrees with the meter beside the Player. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;

  /* ---------- the pure part ---------- */
  function cells(reading, opts) {
    const o = opts || {};
    const segs = (reading && reading.segments) || [];
    const n = Math.max(0, o.n == null ? (reading && reading.beats) || 0 : o.n | 0);
    const spb = Number(o.secondsPerBeat) > 0 ? Number(o.secondsPerBeat) : 3;
    const lim = Number(o.limit) > 0 ? Number(o.limit) : 20;
    const t0 = segs.length ? segs[0].from - segs[0].beat * spb : 0;
    const out = [];
    let k = -1;
    let runFrom = null;
    let runFam = null;
    let prevFam = null;
    for (let i = 0; i < n; i++) {
      let start = false;
      while (k + 1 < segs.length && segs[k + 1].beat <= i) {
        k++;
        if (segs[k].family !== runFam) {
          prevFam = runFam;
          runFam = segs[k].family;
          runFrom = segs[k].from;
          start = true;
        }
      }
      if (k < 0) {
        out.push({ i, family: null, start: false, moved: false, held: null, status: null });
        continue;
      }
      const end = t0 + (i + 1) * spb;
      const held = Math.max(0, Math.round((end - runFrom) * 10) / 10);
      out.push({ i, family: runFam, start, moved: start && prevFam != null, held, status: typeof o.status === "function" ? o.status(held, lim) : null });
    }
    return out;
  }
  function stretches(list) {
    const out = [];
    (list || []).forEach((c) => {
      const over = c.status && c.status.key === "over";
      const last = out[out.length - 1];
      if (!over) return;
      if (last && last.to === c.i - 1 && last.family === c.family && !c.start) last.to = c.i;
      else out.push({ from: c.i, to: c.i, family: c.family });
    });
    return out;
  }
  function tip(c, mk) {
    if (!c) return "";
    const head = "Moment " + (c.i + 1) + ": ";
    if (!c.family) return head + "Nothing holds attention yet.";
    const name = (mk && mk.label) || c.family;
    return head + name + " holds attention, " + Math.round(c.held) + " s so far" + (c.status ? ", " + c.status.words : "") + (c.moved ? ". Attention moved here." : "");
  }

  const api = { cells, stretches, tip };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") {
    root.CurioMomentumLane = api;
    return;
  }

  /* ---------- the lane on the Screen ---------- */
  const KEY = "curiosities-momentum-lane-v1";
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const R = () => root.CurioRates;
  const ME = () => root.CurioMomentumEngine;
  const SC = () => root.CurioScreen;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const load = (k) => {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  };
  let own = { folded: !!load(KEY).folded };
  const saveOwn = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(own));
    } catch (e) {}
  };

  /* Seconds per moment and the limit, worked out the way the Screen's momentum panel does, so both agree. */
  const measured = new WeakMap();
  function settings() {
    const p = load("curiosities-momentum-v1");
    const spb = Number(p.secondsPerPanel) > 0 ? Number(p.secondsPerPanel) : 3;
    if (Number(p.limit) > 0) return { spb, limit: Number(p.limit) };
    const compare = Array.isArray(p.compare) && p.compare.length ? p.compare : ["pulp-fiction"];
    let profiles = R().DEFAULT_FILMS.concat(Array.isArray(p.measured) ? p.measured : []).filter((x) => compare.includes(x.id));
    if (load("curiosities-momentum-screen-v1").against !== "list") {
      const onScreen = screenFilms().map((f) => {
        let m = measured.get(f);
        if (!m || m.spb !== spb || m.len !== f.beats.length) measured.set(f, (m = { spb, len: f.beats.length, p: R().measure(f, { secondsPerBeat: spb }) }));
        return m.p;
      });
      if (onScreen.length) profiles = onScreen;
    }
    return { spb, limit: R().limitFor(R().average(profiles)) };
  }
  function screenFilms() {
    let list = [];
    try {
      if (root.CuriosityStudy && root.CuriosityStudy.studies) list = root.CuriosityStudy.studies();
    } catch (e) {}
    if (!list.length && root.CuriosityDB && root.CuriosityDB.data) list = root.CuriosityDB.data.scenes || [];
    list = list.filter((s) => s && Array.isArray(s.beats) && s.beats.length);
    const st = SC() && SC().state ? SC().state() : null;
    return ((st && st.insp) || []).map((v) => list.find((f) => f.id === v.film) || list[0]).filter(Boolean);
  }

  /* Where the timeline draws its moments: the drawing's box, the visible part of the scrolling box after the
     lane names, and how many moments. null when there is no timeline drawing to measure. */
  function timelineBox(host) {
    const sc = host && host.querySelector(".sl-scroll");
    const svg = sc && (sc.querySelector(".sl-svg") || sc.querySelector(".sl-topsvg"));
    if (!svg) return null;
    const heads = sc.querySelector(".sl-heads");
    const s = sc.getBoundingClientRect();
    const d = svg.getBoundingClientRect();
    const hw = heads ? heads.offsetWidth : 0;
    return { left: s.left + hw, right: s.left + sc.clientWidth, x: d.left, w: d.width };
  }

  function mount(el) {
    let data = null;
    let dirty = true;
    let key = "";
    let shownRow = -1;
    el.classList.add("mo-al");
    function compute() {
      if (!A() || !M() || !R() || !ME()) return null;
      const { spb, limit } = settings();
      const beats = ME().flatBeats();
      const reading = A().read(beats, { secondsPerBeat: spb, limit });
      const list = cells(reading, { n: beats.length, secondsPerBeat: spb, limit, status: M().status });
      return { spb, limit, list, over: stretches(list) };
    }
    function html(d, row) {
      const n = d.list.length;
      const head = `<div class="mo-al-head"><button type="button" data-mo-al="fold" aria-expanded="${!own.folded}" title="${own.folded ? "Show the Attention lane" : "Fold the Attention lane"}">${own.folded ? "▸" : "▾"} Attention</button>${own.folded ? "" : `<small>A moment is ${d.spb} s. Too long after ${d.limit} s.</small>`}</div>`;
      if (own.folded) return `<div class="mo-al-row">${head}</div>`;
      if (!n) return `<div class="mo-al-row">${head}<p class="mo-al-empty">The lane fills in once your film has moments.</p></div>`;
      const cellHtml = d.list
        .map((c) => {
          const mk = M().mark(c.family);
          const bg = c.family ? `background:${mk.color};color:${mk.ink}` : "";
          return `<button type="button" class="mo-al-c${c.family ? "" : " none"}${c.i === row ? " on" : ""}" style="${bg}" data-mo-al-row="${c.i}" title="${esc(tip(c, mk).replace(/\.$/, ""))}. Click to move the playhead here." aria-label="${esc(tip(c, mk))}">${c.start ? `<b>${esc(mk.letter)}</b>` : ""}</button>`;
        })
        .join("");
      const baro = d.list
        .map((c, j) => {
          const prev = d.list[j - 1];
          const first = c.status && (!prev || !prev.status || prev.status.key !== c.status.key || c.start);
          return `<i class="${c.status ? "mo-al-" + c.status.cls : "mo-al-empty-st"}">${first ? esc(c.status.icon) : ""}</i>`;
        })
        .join("");
      const fixes = d.over
        .map((s) => `<button type="button" class="mo-al-fix" data-mo-al="fix" style="left:${((100 * s.from) / n).toFixed(3)}%" title="${esc(M().mark(s.family).label)} holds attention too long over moments ${s.from + 1} to ${s.to + 1}. Open the Compass for what to move attention to next.">Fix this</button>`)
        .join("");
      return `<div class="mo-al-row">${head}<div class="mo-al-view"><div class="mo-al-track" style="--n:${n}"><div class="mo-al-cells">${cellHtml}</div><div class="mo-al-baro" aria-hidden="true">${baro}</div>${fixes ? `<div class="mo-al-fixes">${fixes}</div>` : ""}</div></div></div>`;
    }
    /* Put the cells exactly over the timeline's columns, and the lane's name over the timeline's lane names. */
    function align() {
      const view = el.querySelector(".mo-al-view");
      const track = el.querySelector(".mo-al-track");
      const head = el.querySelector(".mo-al-head");
      if (!view || !track) return;
      const box = timelineBox(el.closest(".sc-timeline"));
      const me = el.getBoundingClientRect();
      if (!box || box.right - box.left < 20) {
        el.classList.add("mo-al-share");
        head.style.width = "";
        view.style.width = "";
        track.style.left = "0px";
        track.style.width = "100%";
        return;
      }
      el.classList.remove("mo-al-share");
      head.style.width = Math.max(0, box.left - me.left) + "px";
      view.style.width = Math.max(0, box.right - box.left) + "px";
      track.style.left = (box.x - box.left).toFixed(2) + "px";
      track.style.width = box.w.toFixed(2) + "px";
    }
    function draw(force) {
      if (!el.isConnected || (!force && !el.getClientRects().length)) return;
      if (dirty || !data) {
        try {
          data = compute();
        } catch (e) {
          data = null;
        }
        dirty = false;
      }
      const row = SC() && SC().row ? SC().row() | 0 : 0;
      if (!data) {
        el.innerHTML = `<p class="mo-al-empty">The Attention lane needs the engine and Momentum.</p>`;
        return;
      }
      const k = JSON.stringify([own.folded, data.spb, data.limit, data.list.map((c) => [c.family, c.start, c.status && c.status.key])]);
      if (force || k !== key) {
        key = k;
        el.innerHTML = html(data, row);
        shownRow = row;
      } else if (row !== shownRow) {
        const old = el.querySelector(".mo-al-c.on");
        if (old) old.classList.remove("on");
        const now = el.querySelector(`.mo-al-c[data-mo-al-row="${row}"]`);
        if (now) now.classList.add("on");
        shownRow = row;
      }
      align();
    }
    function onClick(e) {
      const t = e.target.closest("[data-mo-al], [data-mo-al-row]");
      if (!t || !el.contains(t)) return;
      if (t.dataset.moAlRow != null) {
        if (SC() && SC().setRow) SC().setRow(Number(t.dataset.moAlRow));
        return draw();
      }
      if (t.dataset.moAl === "fold") {
        own.folded = !own.folded;
        saveOwn();
        return draw(true);
      }
      if (t.dataset.moAl === "fix" && root.CurioMomentumUI) root.CurioMomentumUI.open("compass");
    }
    /* Scrolling the timeline only slides the cells. */
    const onScroll = (e) => e.target && e.target.classList && e.target.classList.contains("sl-scroll") && align();
    /* The timeline redraws itself when it zooms or the window resizes: follow its new columns. */
    let host = null;
    const watch = new MutationObserver((recs) => {
      if (recs.some((r) => r.target === host || (r.target.classList && r.target.classList.contains("sc-lanes")))) align();
    });
    function hook() {
      const h = el.closest(".sc-timeline");
      if (h === host) return;
      if (host) host.removeEventListener("scroll", onScroll, true);
      host = h;
      watch.disconnect();
      if (!host) return;
      host.addEventListener("scroll", onScroll, true);
      watch.observe(host, { childList: true, subtree: true });
    }
    el.addEventListener("click", onClick);
    hook();
    draw(true);
    return {
      draw() {
        hook();
        draw();
      },
      changed() {
        dirty = true;
      },
      destroy() {
        watch.disconnect();
        if (host) host.removeEventListener("scroll", onScroll, true);
        el.removeEventListener("click", onClick);
        el.classList.remove("mo-al", "mo-al-share");
        el.innerHTML = "";
      },
    };
  }

  /* ---------- docking on the timeline ---------- */
  let lane = null;
  let dock = null;
  let unScreen = null;
  let unEngine = null;
  let queued = false;
  const redraw = () => {
    if (queued) return;
    queued = true;
    (root.requestAnimationFrame || setTimeout)(() => {
      queued = false;
      if (lane) lane.draw();
    });
  };
  function attach() {
    const S = SC();
    if (lane) return true;
    if (!S || typeof S.addPanel !== "function") return false;
    S.addPanel({
      id: "momentum-lane",
      label: "Attention lane",
      place: "timeline",
      mount(el) {
        dock = el;
        lane = mount(el);
        if (typeof S.on === "function") unScreen = S.on(redraw);
        if (root.CurioEngine && root.CurioEngine.on)
          unEngine = root.CurioEngine.on(() => {
            if (lane) lane.changed();
            redraw();
          });
      },
    });
    return true;
  }
  function detach() {
    if (typeof unScreen === "function") unScreen();
    if (typeof unEngine === "function") unEngine();
    if (lane) lane.destroy();
    lane = dock = unScreen = unEngine = null;
  }
  function boot() {
    if (attach()) return;
    root.addEventListener("load", () => attach());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  root.CurioMomentumLane = Object.assign(api, { attach, detach, attached: () => !!(dock && dock.isConnected) });
})();
