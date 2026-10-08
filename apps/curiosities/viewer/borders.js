/* The Viewer's borders (Jeremy's notes, 2026-10-04 20:16Z: every border draggable, panels fully collapsible,
   triangles hinting which way to drag, undo for everything).

   Four borders, made with the Screen's own splitter (CurioScreen.splitter, screen/ui.js, PR #132), so they look
   and work the same everywhere: drag them, use the arrow keys, double-click for the usual size, Enter or « to
   fold a panel away, and click or drag the thin edge left behind to bring it back.
   - "In the scene" | the picture (left column)
   - the picture | Details (right column)
   - the picture | Front and center (the lane's height)
   - everything above | the storyboard strip (the strip's height)
   Sizes are kept with the film (film.view.borders), so Undo and Redo take a border move back like any other
   change, and they come back next time. Only on a wide screen; phones keep their one-column layout. */
(function () {
  "use strict";
  if (window.CurioBorders) return;
  const V = () => window.CurioViewer;
  const S = () => window.CurioScreen;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const USUAL = { left: 190, right: 330, lane: 0, strip: 0, side: 0 };
  const rootEl = () => document.querySelector(".cv-root.cv-viewer");

  function state() {
    const f = V().live().film;
    const b = (f.view && f.view.borders) || {};
    return {
      left: +b.left || USUAL.left,
      right: +b.right || USUAL.right,
      lane: +b.lane || 0,
      strip: +b.strip || 0,
      side: +b.side || 0,
      fold: Object.assign({ left: false, right: false, lane: false, strip: false, side: false }, b.fold || {}),
    };
  }
  function put(name, px, folded, phase) {
    const v = V();
    const f = v.live().film;
    /* the first change of a drag goes on the undo list; the rest of the drag joins it */
    if (phase === "move" || phase === "key" || phase === "fold" || phase === "end") v.remember("border-" + name);
    f.view = f.view || {};
    const b = (f.view.borders = Object.assign({}, f.view.borders || {}));
    b.fold = Object.assign({}, b.fold || {});
    if (px != null) b[name] = Math.round(px);
    b.fold[name] = !!folded;
    apply();
    if (phase !== "move") v.changed(false);
    else v.redraw();
  }
  /* wider than a phone: the app link opens in a frame often under 1100px (as viewer/workspace.js) */
  const wide = () => window.innerWidth > 760;

  /* ---------- the layout from the sizes ---------- */
  function apply() {
    const root = rootEl();
    if (!root) return;
    const main = root.querySelector(".cv-main");
    const things = root.querySelector(".cv-things");
    const details = root.querySelector(".cv-details");
    const strip = root.querySelector(".cv-strip");
    const under = root.querySelector(".cv-under");
    const s = state();
    const on = wide() && !root.classList.contains("cv-comic");
    root.classList.toggle("cvd-on", on);
    if (!on) {
      main.style.gridTemplateColumns = "";
      things.hidden = details.hidden = false;
      strip.style.height = "";
      strip.classList.remove("cvd-folded");
      strip.removeAttribute("data-cvd-sized");
      if (under) {
        under.style.height = "";
        under.removeAttribute("data-cvd-sized");
      }
      root.classList.remove("cvd-lane-folded", "cvd-side-folded", "cvd-stage-gone");
      sideWidth(root, null);
      return place();
    }
    const L = s.left;
    const R = s.right;
    /* a folded panel leaves the grid, so its column goes too */
    main.style.gridTemplateColumns = [s.fold.left ? "" : L + "px", "minmax(0, 1fr)", s.fold.right ? "" : R + "px"].filter(Boolean).join(" ");
    things.hidden = s.fold.left;
    details.hidden = s.fold.right;
    strip.classList.toggle("cvd-folded", s.fold.strip);
    strip.style.height = s.fold.strip ? "0px" : s.strip ? s.strip + "px" : "";
    /* a size you dragged wins over the Automation lanes tab's own (focus-lane.js), and viewer/fit.js fits what is inside to it */
    strip.toggleAttribute("data-cvd-sized", !s.fold.strip && !!s.strip);
    root.classList.toggle("cvd-lane-folded", s.fold.lane);
    if (under) {
      under.style.height = s.lane && !s.fold.lane ? s.lane + "px" : "";
      under.toggleAttribute("data-cvd-sized", !!s.lane && !s.fold.lane);
    }
    /* the picture | Front and center beside it: either side can go all the way (Jeremy 2026-10-08) */
    const beside = root.dataset.wsLanes === "beside";
    const pw = root.querySelector(".cv-player").clientWidth;
    root.classList.toggle("cvd-side-folded", beside && s.fold.side);
    root.classList.toggle("cvd-stage-gone", beside && !s.fold.side && !!s.side && s.side >= pw - 40);
    sideWidth(root, beside && !s.fold.side && s.side ? s.side : null);
    place();
  }
  /* how wide Front and center is beside the picture; null leaves it to viewer/workspace.js */
  function sideWidth(root, px) {
    const player = root.querySelector(".cv-player");
    if (px) player.style.setProperty("--ws-stage-w", `calc(100% - ${Math.round(px)}px)`);
    else if (/calc/.test(player.style.getPropertyValue("--ws-stage-w"))) player.style.removeProperty("--ws-stage-w");
  }
  /* a width you dragged (or a side folded away) wins over the workspace's own fit */
  const sideSet = () => {
    const s = state();
    return !!(s.side || s.fold.side);
  };

  /* ---------- the borders themselves ---------- */
  const B = {};
  function make(name, o) {
    const root = rootEl();
    const el = document.createElement("div");
    el.className = "cvd-border";
    el.dataset.border = name;
    root.appendChild(el);
    const ctl = S().splitter(el, o);
    B[name] = { el, ctl };
  }
  function build() {
    const root = rootEl();
    if (!root || !S() || !S().splitter || B.left) return !!B.left;
    const sz = (name, measure) => () => {
      const s = state();
      return s[name] || measure();
    };
    const H = () => window.innerHeight;
    make("left", {
      axis: "x",
      grow: 1,
      name: "the In the scene list",
      foldable: true,
      size: sz("left", () => USUAL.left),
      min: () => 150,
      max: () => Math.max(160, Math.min(420, window.innerWidth * 0.3)),
      folded: () => state().fold.left,
      set: (px, f, phase) => put("left", px, f, phase),
      reset: () => put("left", USUAL.left, false, "end"),
    });
    make("right", {
      axis: "x",
      grow: -1,
      name: "the Details panel",
      foldable: true,
      size: sz("right", () => USUAL.right),
      min: () => 260,
      max: () => Math.max(270, Math.min(640, window.innerWidth * 0.45)),
      folded: () => state().fold.right,
      set: (px, f, phase) => put("right", px, f, phase),
      reset: () => put("right", USUAL.right, false, "end"),
    });
    make("lane", {
      axis: "y",
      grow: -1,
      name: "the Front and center lane",
      foldable: true,
      size: sz("lane", () => (rootEl().querySelector(".cv-under") || {}).offsetHeight || 94),
      min: () => 70,
      max: () => H() * 0.45,
      folded: () => state().fold.lane,
      set: (px, f, phase) => put("lane", px, f, phase),
      reset: () => put("lane", 0, false, "end"),
    });
    make("side", {
      axis: "x",
      grow: -1,
      name: "Front and center",
      foldable: true,
      size: sz("side", () => (rootEl().querySelector(".cv-under") || {}).offsetWidth || 360),
      min: () => 160,
      max: () => rootEl().querySelector(".cv-player").clientWidth - 6,
      folded: () => state().fold.side,
      /* folded away from all the way open, it comes back at its usual width, not hiding the picture again */
      set: (px, f, phase) => put("side", f && px >= rootEl().querySelector(".cv-player").clientWidth - 40 ? 0 : px, f, phase),
      reset: () => put("side", 0, false, "end"),
    });
    make("strip", {
      axis: "y",
      grow: -1,
      name: "the storyboard",
      foldable: true,
      size: sz("strip", () => rootEl().querySelector(".cv-strip").offsetHeight || 240),
      min: () => 110,
      max: () => H() * 0.6,
      folded: () => state().fold.strip,
      set: (px, f, phase) => put("strip", px, f, phase),
      reset: () => put("strip", 0, false, "end"),
    });
    return true;
  }
  /* each border sits over the gap between its two panels */
  function place() {
    const root = rootEl();
    if (!root || !B.left) return;
    const on = root.classList.contains("cvd-on");
    const rr = root.getBoundingClientRect();
    const main = root.querySelector(".cv-main").getBoundingClientRect();
    const player = root.querySelector(".cv-player").getBoundingClientRect();
    const strip = root.querySelector(".cv-strip").getBoundingClientRect();
    const under = root.querySelector(".cv-under");
    const ur = under && !under.hidden ? under.getBoundingClientRect() : null;
    const pos = (name, show, css) => {
      const b = B[name];
      b.el.hidden = !show;
      if (show) Object.assign(b.el.style, css);
      b.ctl.update();
    };
    pos("left", on, { left: player.left - rr.left - 8 + "px", top: main.top - rr.top + "px", height: main.height + "px" });
    pos("right", on, { left: player.right - rr.left - 2 + "px", top: main.top - rr.top + "px", height: main.height + "px" });
    const laneFold = root.classList.contains("cvd-lane-folded");
    pos("lane", on && root.dataset.wsLanes !== "beside" && (!!ur || laneFold), {
      left: player.left - rr.left + "px",
      width: player.width + "px",
      top: (ur && !laneFold ? ur.top : player.bottom - 50) - rr.top - 8 + "px",
    });
    const beside = root.dataset.wsLanes === "beside";
    const sideFold = root.classList.contains("cvd-side-folded");
    pos("side", on && beside && (!!ur || sideFold), {
      left: (ur && !sideFold ? ur.left - 9 : player.right - 10) - rr.left + "px",
      top: player.top - rr.top + "px",
      height: (ur && !sideFold ? ur.height : player.height) + "px",
    });
    pos("strip", on, { left: "0px", width: rr.width + "px", top: strip.top - rr.top - 6 + "px" });
  }

  const CSS = `
.cv-root.cv-viewer .cvd-border[hidden] { display: none; }
.cv-root.cvd-lane-folded .cv-under { display: none !important; }
.cv-root.cvd-side-folded[data-ws-lanes="beside"] .cv-under { display: none !important; }
.cv-root.cvd-side-folded[data-ws-lanes="beside"] .cv-player { grid-template-columns: minmax(0, 1fr) 0 !important; }
.cv-root.cvd-stage-gone[data-ws-lanes="beside"] .cv-player > .cv-stage { display: none !important; }
.cv-root.cvd-stage-gone[data-ws-lanes="beside"] .cv-player { grid-template-columns: 0 minmax(0, 1fr) !important; }
.cv-strip.cvd-folded { overflow: hidden; padding-top: 0; padding-bottom: 0; border-top-width: 3px; }
.cv-root.cvd-on .cv-strip { overflow: auto; }
.cv-root.cvd-on .cv-under { overflow: auto; }
`;
  function tick() {
    const root = rootEl();
    if (!root || !V() || !V().remember) return setTimeout(tick, 300);
    if (!build()) return setTimeout(tick, 300);
    apply();
  }
  function wire() {
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    const v = V();
    if (!v || !v.onChange) return setTimeout(wire, 300);
    /* undo, redo and opening another film bring their own sizes */
    v.onChange(() => apply());
    v.onDraw && v.onDraw(() => place());
    window.addEventListener("resize", () => apply());
    tick();
    /* Read as a comic and back */
    const watch = () => {
      const root = rootEl();
      if (!root) return setTimeout(watch, 300);
      let was = root.classList.contains("cv-comic");
      new MutationObserver(() => {
        const now = root.classList.contains("cv-comic");
        if (now !== was) {
          was = now;
          apply();
        }
      }).observe(root, { attributes: true, attributeFilter: ["class"] });
    };
    watch();
    /* panels change size without a redraw (a toolbar opens, words wrap, fonts arrive), so follow their sizes too */
    const follow = () => {
      const root = rootEl();
      if (!root || !window.ResizeObserver) return setTimeout(follow, 300);
      let queued = false;
      const ro = new ResizeObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          place();
        });
      });
      [".cv-main", ".cv-player", ".cv-strip", ".cv-under"].forEach((q) => {
        const el = root.querySelector(q);
        if (el) ro.observe(el);
      });
    };
    follow();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioBorders = { state, apply, place, USUAL, sideSet };
})();
