/* viewer/focus-lane.js: "Front and center", the lane under the Viewer's picture (Jeremy, 2026-10-04 18:55Z):
   usually only one or two curiosities at a time move the plot forward and hold the audience's attention. This
   lane always shows which ones, moment by moment, and the suite they make up when one is there. When the one in
   front was set off by something else (a spark: a curiosity or suite set off by another), it says by what.

   It reads My film's panels as curiosity values and asks the app's own attention model (momentum/attention.js,
   CurioAttention.read) who holds attention, the same reading the Screen's Attention band uses. The values:
   - read from the picture: shot size, camera height, lens, fisheye, the camera pushing in or pulling out or
     circling, people moving toward or away from the camera, things and people coming into or out of the
     scene, rain, balloons and captions;
   - and the story values a panel carries in panel.v (emotion, plot progress, a reveal, a comic beat ...). The
     sample film has them; a saved copy of the sample borrows them from the sample.
   Rows: Leading (who holds attention, from the attention model; it holds until something else takes it), With
   it (the strongest other curiosity changing in that panel), Suite (the suite most of whose lenses are on, when
   half or more are). A ⚡ marks a proximity firing; the line above the rows says what set it off.

   Needs viewer/viewer.js (CurioViewer.onDraw, onChange, under, seek, film, project), momentum/notes.js
   (CurioMomentum), momentum/attention.js (CurioAttention), suites.js (CuriositySuites) and model.js
   (PROXIMITIES, SUITES). Any of those missing: the lane stays hidden. API: window.CurioFocusLane.read() ->
   per panel { lead, second, suite, trigger } for checks. */
(function () {
  if (window.CurioFocusLane) return;
  const V = () => window.CurioViewer;
  const M = () => window.CurioMomentum;
  const A = () => window.CurioAttention;
  const S = () => window.CuriositySuites;
  const STORY = { feeling: 1, plot: 1, voice: 1, comedy: 1, mind: 1 };

  const CSS = `
.cv-under { display: grid; gap: 4px; padding: 6px 8px 7px; background: #141416; border: 1px solid var(--c-line, #2e2e33); border-radius: 6px; font-size: 12px; color: #d6d6db; min-width: 0; }
.cv-under[hidden] { display: none; }
.cf-top { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.cf-top b { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #22d3ee; flex: none; }
.cf-now { flex: 1 1 auto; min-width: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.35; }
.cf-now .cf-sw { display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin: 0 3px 0 1px; vertical-align: 0; }
.cf-now em { font-style: normal; color: #9b9ba3; }
.cf-now .cf-trig { color: #fde047; }
.cf-force { flex: none; max-width: 40%; font-size: 15px; font-weight: 700; color: #fde68a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-force:empty { display: none; }
/* Two tabs (Jeremy 2026-10-05): Viewer focus (the 2 or 3 things holding attention on top, then the pie, the graph
   through the scene and the scrolling list) and Moments (the colored blocks, with the picked one readable on top). */
.cf-tabs { display: flex; gap: 2px; flex: none; }
.cv-root .cf-tabs button { padding: 2px 9px; font-size: 11px; border-radius: 5px; background: #222226; color: #b5b5bd; }
.cv-root .cf-tabs button[aria-selected="true"] { background: #22d3ee; color: #062a31; font-weight: 600; }
.cv-under[data-tab="focus"] .cf-pane-moments, .cv-under[data-tab="moments"] .cf-pane-focus { display: none; }
.cf-pane { display: grid; gap: 4px; min-width: 0; }
.cf-focus { margin: 0; font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-focus em { font-style: normal; font-weight: 400; color: #9b9ba3; }
.cf-charts { display: grid; grid-template-columns: 64px minmax(0, 1fr) minmax(150px, 220px); gap: 8px; align-items: stretch; }
.cf-charts canvas { display: block; background: #1d1d21; border-radius: 4px; }
.cf-pie { width: 64px; height: 64px; border-radius: 50% !important; }
.cf-graph.cf-ln-track { width: 100%; height: 64px; }
.cf-list { list-style: none; margin: 0; padding: 0; height: 64px; overflow-y: auto; font-size: 10.5px; display: grid; align-content: start; gap: 1px; }
.cf-list li { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; gap: 4px; align-items: center; }
.cf-list li i { width: 8px; height: 8px; border-radius: 2px; }
.cf-list li span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-list li b { font-weight: 500; color: #9b9ba3; font-variant-numeric: tabular-nums; }
.cv-under[data-tab="focus"] .cf-pane-lanes, .cv-under[data-tab="moments"] .cf-pane-lanes, .cv-under[data-tab="lanes"] .cf-pane-focus, .cv-under[data-tab="lanes"] .cf-pane-moments { display: none; }
.cf-lanes { display: grid; gap: 3px; max-height: 106px; overflow-y: auto; padding-right: 2px; }
.cf-ln { display: grid; grid-template-columns: 150px minmax(0, 1fr) 24px; gap: 6px; align-items: center; }
/* the pop-up button at the end of each lane (Jeremy 2026-10-05): opens that curiosity's window */
.cv-root .cf-ln-pop { width: 24px; height: 22px; padding: 0; border-radius: 5px; border: 1px solid #4a4a54; background: #26262b; color: #e6e6ea; font-size: 13px; line-height: 20px; cursor: pointer; }
.cv-root .cf-ln-pop:hover, .cv-root .cf-ln-pop:focus-visible { background: #22d3ee; color: #062a31; border-color: #22d3ee; }
.cf-ln-name { font-size: 11px; line-height: 1.2; min-width: 0; }
.cf-ln-name b { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-ln-name small { display: block; color: #9b9ba3; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-ln-track { position: relative; height: 32px; background: #1d1d21; border-radius: 4px; touch-action: none; }
.cf-ln-in { position: absolute; inset: 5px 0; }
.cf-ln-in svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.cf-ln-track .cf-ln-sep { position: absolute; top: 0; bottom: 0; width: 1px; background: #2c2c32; }
.cf-ln-dot { position: absolute; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; border: 2px solid #111; box-sizing: border-box; }
.cf-ln-dot.cf-ed { cursor: ns-resize; }
.cf-ln-in svg { pointer-events: none; }
.cf-seg { fill: none; stroke: transparent; stroke-width: 10; vector-effect: non-scaling-stroke; pointer-events: stroke; cursor: context-menu; }
.cf-seg:hover { stroke: rgba(255,255,255,0.18); }
.cf-g { position: absolute; inset: 0; pointer-events: none; }
.cf-g .cf-ln-dot { pointer-events: auto; }
.cf-graph.cf-picked .cf-g:not(.on) { opacity: 0.28; }
.cf-g.on { z-index: 2; }
.cf-g.on > svg > path:first-child { stroke-width: 3.5; }
.cv-root .cf-pie { cursor: pointer; }
.cf-list li { cursor: pointer; border-radius: 3px; padding: 0 2px; }
.cf-list li.on { background: #2c2c33; outline: 1px solid #22d3ee; }
/* a curiosity's window, and its search window docked beside it */
.cf-cwin, .cf-swin { position: fixed; z-index: 2147482990; width: 330px; max-height: min(560px, 80vh); display: grid; grid-template-rows: auto minmax(0, 1fr); background: #1b1b1f; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); font: 12px/1.35 system-ui, sans-serif; }
.cf-cwin header, .cf-swin header { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-bottom: 1px solid #2e2e33; cursor: move; touch-action: none; }
.cf-cwin header b, .cf-swin header b { flex: 1; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-cwin header i { width: 10px; height: 10px; border-radius: 2px; flex: none; }
.cf-cwin button, .cf-swin button, .cf-cwin select, .cf-swin input { font: inherit; background: #26262b; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 5px; padding: 3px 7px; }
.cf-cwin button, .cf-swin button { cursor: pointer; }
.cf-cwin [data-cw="search"] { background: #22d3ee; color: #062a31; border-color: #22d3ee; font-weight: 600; }
.cf-cwin-b, .cf-swin-b { overflow-y: auto; padding: 8px 10px 10px; display: grid; gap: 8px; align-content: start; }
.cf-cwin-b > p { margin: 0; color: #b5b5bd; }
.cf-cw-row { display: grid; gap: 3px; padding: 6px; background: #222226; border-radius: 6px; }
.cf-cw-row > div { display: flex; align-items: center; gap: 6px; }
.cf-cw-row b { flex: 1; font-weight: 600; }
.cf-cw-row small { color: #9b9ba3; }
.cf-cw-row select, .cf-cw-row input[type="range"] { flex: 1; min-width: 0; }
.cf-cw-row output { min-width: 2.2em; text-align: right; font-variant-numeric: tabular-nums; }
.cf-cw-key { width: 22px; padding: 0 !important; color: #fde047 !important; }
.cf-cw-key.off { color: #6b6b74 !important; }
.cf-swin-b p { margin: 0; color: #b5b5bd; }
/* the Curve window (Ctrl+click or double-click a line) */
.cf-ln-play { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 2px rgba(0,0,0,0.6); pointer-events: none; z-index: 1; }
.cf-seg.on { stroke: rgba(34,211,238,0.45); }
.cf-cpop { position: fixed; z-index: 2147483000; background: #1b1b1f; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); padding: 6px 10px 8px; font: 12px/1.35 system-ui, sans-serif; display: grid; gap: 6px; box-sizing: border-box; }
.cf-cpop header { display: flex; align-items: center; gap: 6px; }
.cf-cpop header b { flex: 1; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #22d3ee; }
.cf-cpop button { font: inherit; background: #26262b; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 5px; padding: 3px 7px; cursor: pointer; }
.cf-cpop canvas { width: 100%; aspect-ratio: 640 / 420; height: auto; border-radius: 5px; touch-action: none; display: block; }
.cf-cpresets { display: flex; flex-wrap: wrap; gap: 4px; }
.cf-cpresets button { display: inline-flex; align-items: center; gap: 4px; }
.cf-cpresets button.on { background: #22d3ee; color: #062a31; border-color: #22d3ee; font-weight: 600; }
.cf-cstatus { margin: 0; font-size: 11.5px; color: #d6d6db; min-height: 1.35em; }
.cf-chelp { margin: 0; font-size: 9px; color: #8b8b94; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Automation lanes, big (Jeremy 2026-10-05): stacked like tracks in Ableton Live, the top 4 in view, the rest a
   two-finger scroll away; the storyboards shrink while this tab is open so the lanes sit large and in front */
.cv-root.cf-big .cf-lanes { max-height: 196px; overscroll-behavior: contain; gap: 2px; }
.cv-root.cf-big .cf-ln { grid-template-columns: 170px minmax(0, 1fr) 26px; background: #18181b; border-radius: 4px; padding: 2px 4px 2px 0; border-left: 4px solid var(--ln-c, #444); }
.cv-root.cf-big .cf-ln-track { height: 42px; }
.cv-root.cf-big .cf-ln.cf-ln-suite .cf-ln-track { height: 30px; }
.cv-root.cf-big .cf-ln-name { padding-left: 6px; font-size: 12px; }
.cv-root.cf-big .cv-under:not([data-cvd-sized]) { height: auto !important; }
.cv-root.cf-big .cv-strip:not([data-cvd-sized]) { height: auto !important; }
.cv-root.cf-big .cv-strip { padding-top: 2px; padding-bottom: 4px; }
.cv-root.cf-big .cv-card { flex-basis: 92px; }
.cv-root.cf-big .cv-card .cv-cap, .cv-root.cf-big .cv-card .cv-how, .cv-root.cf-big .cv-card .cv-focus { display: none; }
.cf-ln-dot:hover, .cf-ln-dot.cf-drag { outline: 2px solid #fff; }
.cf-ln-head { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: #fff; opacity: 0.7; pointer-events: none; }
.cf-ln.cf-ln-suite .cf-ln-track { height: 22px; }
.cf-lanes-hint { margin: 0; font-size: 10.5px; color: #9b9ba3; }
/* drag Front and center out over the side panels (Jeremy 2026-10-05) */
.cf-grip { position: absolute; top: 0; bottom: 0; width: 8px; cursor: ew-resize; z-index: 3; touch-action: none; }
.cf-grip::after { content: ""; position: absolute; top: 50%; left: 2px; width: 4px; height: 28px; margin-top: -14px; border-radius: 2px; background: #3a3a42; }
.cf-grip:hover::after, .cf-grip.cf-drag::after { background: #22d3ee; }
.cf-grip-l { left: 0; }
.cf-grip-r { right: 0; }
.cv-root.cvd-on .cv-under { overflow: visible; }
body.cf-dragging { user-select: none; -webkit-user-select: none; }
.cv-under { position: relative; }
.cv-under[data-out] { margin-left: calc(-1 * var(--cf-out-l, 0px)); margin-right: calc(-1 * var(--cf-out-r, 0px)); z-index: 6; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
.cv-player:has(> .cv-under[data-out]) { overflow: visible; z-index: 6; }
.cv-root .cvd-border { z-index: 8; }
.cv-root.cvd-on .cv-things { margin-bottom: var(--cf-cover-l, 0px); }
.cv-root.cvd-on .cv-details { padding-bottom: var(--cf-cover-r, 0px); box-sizing: border-box; }
@media (max-width: 900px) { .cf-grip { display: none; } .cv-under[data-out] { margin: 0; } .cf-ln { grid-template-columns: 100px minmax(0, 1fr) 24px; } }
.cf-pane-moments { grid-template-columns: minmax(0, 1fr) minmax(180px, 280px); align-items: start; gap: 8px; }
.cf-mag { background: #1d1d21; border: 1px solid #2e2e33; border-radius: 6px; padding: 6px 8px; max-height: 96px; overflow-y: auto; display: grid; gap: 4px; font-size: 11.5px; line-height: 1.35; }
.cf-mag .cf-now { display: block; overflow: visible; -webkit-line-clamp: unset; }
@media (max-width: 900px) { .cf-pane-moments { grid-template-columns: minmax(0, 1fr); } }
.cf-pick { margin: 0; font-size: 12px; font-weight: 600; color: #fff; line-height: 1.35; }
.cf-pick:empty { display: none; }
@media (max-width: 900px) { .cf-charts { grid-template-columns: 64px minmax(0, 1fr); } .cf-list { grid-column: 1 / -1; height: auto; max-height: 90px; } }
.cf-zoom { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; font-size: 11px; color: #b5b5bd; }
.cf-zseg { display: inline-flex; gap: 2px; }
.cv-root .cf-zoom button { padding: 2px 8px; font-size: 11px; border-radius: 5px; background: #222226; color: #d6d6db; border: 1px solid #34343b; cursor: pointer; }
.cv-root .cf-zoom button[aria-pressed="true"] { background: #fde68a; color: #2b2418; border-color: #fde68a; font-weight: 600; }
.cf-zlab { display: inline-flex; align-items: center; gap: 3px; }
.cv-root .cf-zlab button { min-width: 28px; min-height: 28px; padding: 2px 0; text-align: center; }
.cf-zr { width: 120px; accent-color: #fde68a; }
.cf-zwhat { flex: 1 1 160px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-under[data-zoom="picked"] .cf-zwhat { color: #fff; font-weight: 600; }
.cv-root .cf-zoom .cf-zunpick { background: #fff; color: #111; border-color: #fff; }
.cv-root .cf-zoom .cf-zunpick[hidden] { display: none; }
.cf-ln-track { overflow: hidden; }
.cf-ln-sep.cf-sc-sep { width: 2px; margin-left: -1px; opacity: 0.85; z-index: 1; }
.cf-sc-track { height: 16px !important; }
.cv-root .cf-scb { all: unset; box-sizing: border-box; position: absolute; top: 0; bottom: 0; padding: 0 5px; font: 600 10px/16px system-ui, sans-serif; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; border-right: 2px solid #141416; }
.cf-row.cf-scene .cf-scb { line-height: 13px; font-size: 9.5px; }
.cv-root .cf-scb:hover, .cv-root .cf-scb:focus-visible { filter: brightness(1.15); outline: 1px solid #fff; outline-offset: -1px; }
.cf-pie.cf-across { box-shadow: 0 0 0 2px #fff; }
.cf-rows { position: relative; display: grid; grid-template-columns: 58px minmax(0, 1fr); row-gap: 2px; align-items: center; }
.cf-rows > span { font-size: 10px; color: #8b8b94; letter-spacing: 0.04em; }
.cf-row { position: relative; height: 18px; background: #1d1d21; border-radius: 3px; overflow: hidden; }
.cf-row.cf-thin { height: 13px; }
.cf-row button { all: unset; box-sizing: border-box; position: absolute; top: 0; bottom: 0; padding: 0 4px; font-size: 10.5px; line-height: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; border-right: 1px solid rgba(0,0,0,0.45); }
.cf-row.cf-thin button { line-height: 13px; font-size: 9.5px; opacity: 0.8; }
.cf-row button:hover, .cf-row button:focus-visible { filter: brightness(1.18); outline: 1px solid #fff; outline-offset: -1px; }
.cf-row .cf-bolt { position: absolute; top: 0; font-size: 11px; line-height: 18px; color: #fde047; pointer-events: none; text-shadow: 0 0 3px #000; margin-left: -5px; }
.cf-head { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: #fff; box-shadow: 0 0 4px #000; pointer-events: none; }
.cv-comic .cv-under { display: none; }
`;
  function style() {
    if (document.getElementById("cf-css")) return;
    const st = document.createElement("style");
    st.id = "cf-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const base = (id) => String(id).split("@")[0].split(".")[0];

  /* ---------- the panels as curiosity values ---------- */
  function shotSize(s) {
    if (s >= 1.6) return "wide";
    if (s >= 0.8) return "medium";
    if (s >= 0.35) return "close";
    return "insert";
  }
  function angleHeight(h) {
    if (h < -20) return "floor";
    if (h < -4) return "low";
    if (h <= 12) return "eye";
    if (h < 75) return "high";
    return "overhead";
  }
  const lensLength = (f) => (f < 24 ? "wide" : f < 70 ? "normal" : "long");
  function wrap180(a) {
    a = ((((a + 180) % 360) + 360) % 360) - 180;
    return a;
  }
  /* how far a thing is from this panel's camera (the Viewer's own camera maths) */
  function depth(film, panel, id) {
    const p = panel.place[id];
    const t = panel.place[panel.cam.aim] || p;
    if (!p || !t || !V().project) return null;
    const pan = Array.isArray(panel.cam.pan) ? panel.cam.pan : [0, 0, 0];
    try {
      const r = V().project(panel.cam, [t.x + pan[0], t.y + 1 + pan[1], t.z + pan[2]], 1600, 900, [p.x, p.y + 0.9, p.z]);
      return r ? r[2] : null;
    } catch (e) {
      return null;
    }
  }
  /* A saved copy of the sample has no story values: borrow them from the sample, panel by panel. */
  let sampleV = null;
  function storyOf(p) {
    if (p.v && typeof p.v === "object") return p.v;
    if (!sampleV) {
      sampleV = {};
      try {
        V()
          .sample()
          .panels.forEach((q) => q.v && (sampleV[q.id + "|" + q.note] = q.v));
      } catch (e) {}
    }
    return sampleV[p.id + "|" + p.note] || {};
  }
  /* "nothing happening" values: kept for the proximity checks, but a change back to rest takes no attention */
  const REST = { cameraMove: "none", characterPath: "still", bodyEnter: "already", objectEnter: "stays", "lensLength.distortion": "none", balloon: "", silence: "none" };
  function active(values) {
    const o = {};
    Object.keys(values).forEach((id) => {
      if (REST[id] === undefined || String(values[id]) !== String(REST[id])) o[id] = values[id];
    });
    return o;
  }
  function valuesOf(film, i) {
    const p = film.panels[i];
    const q = film.panels[i - 1];
    const c = p.cam;
    const v = {
      shotSize: shotSize(c.shot),
      angleHeight: angleHeight(c.height),
      lensLength: lensLength(c.lens),
      "lensLength.distortion": c.fish >= 0.45 ? "fisheye" : c.fish >= 0.2 ? "strong" : "none",
      weather: p.rain === "fall" ? "rain" : "clear",
      balloon: p.words.length && p.caption ? "both" : p.words.length ? "balloon" : p.caption ? "caption" : "",
      cameraMove: "none",
    };
    if (q) {
      if (q.cam.move === "glide") {
        const turn = Math.abs(wrap180(c.around - q.cam.around));
        v.cameraMove = turn > 60 ? "orbit" : c.shot < q.cam.shot * 0.8 ? "push in" : c.shot > q.cam.shot * 1.25 ? "pull out" : "track";
      }
      let path = "still";
      let enter = null;
      let thing = null;
      film.objects.forEach((o) => {
        const a = q.place[o.id];
        const b = p.place[o.id];
        if (!a || !b) return;
        const person = o.kind === "person";
        if ((a.show !== false) !== (b.show !== false)) {
          if (person) enter = b.show !== false ? "enters" : enter || "leaves";
          else if (o.kind !== "building") thing = b.show !== false ? "enters" : thing || "leaves";
        }
        if (person && b.show !== false && Math.hypot(b.x - a.x, b.z - a.z) > 0.3) {
          const d0 = depth(film, Object.assign({}, p, { place: Object.assign({}, p.place, { [o.id]: a }) }), o.id);
          const d1 = depth(film, p, o.id);
          const way = d0 != null && d1 != null && Math.abs(d1 - d0) > 0.4 ? (d1 < d0 ? "approach" : "retreat") : "cross";
          if (path === "still" || way === "approach") path = way;
        }
      });
      v.characterPath = path;
      v.bodyEnter = enter || "already";
      v.objectEnter = thing || "stays";
    }
    return Object.assign(v, storyOf(p));
  }

  /* ---------- reading ---------- */
  function rank(id, v) {
    if (typeof v === "number") return v;
    if (v != null && v !== "" && isFinite(Number(v))) return Number(v);
    const c = M().find(base(id));
    const slider = String(id).split(".")[1];
    const sl = c && Array.isArray(c.sliders) ? c.sliders.find((s) => s.id === (slider || c.main || "setting")) || c.sliders[0] : null;
    const list = sl && sl.scale ? sl.scale : c && Array.isArray(c.options) ? c.options : null;
    return list ? list.indexOf(v) : null;
  }
  function cond(c, K, i) {
    if (!c) return false;
    const now = K[i] || {};
    if (c.suite) return !!S() && S().present(c.suite, now);
    const id = c.curiosity;
    if (now[id] == null || now[id] === "") return false;
    if (c.is != null) return String(now[id]) === String(c.is);
    if (!c.change) return false;
    const was = (K[i - 1] || {})[id];
    if (was == null || String(was) === String(now[id])) return false;
    if (c.change === "changes") return true;
    const a = rank(id, was);
    const b = rank(id, now[id]);
    if (a == null || b == null || a < 0 || b < 0) return false;
    return c.change === "rises" ? b > a : c.change === "drops" ? b < a : false;
  }
  const pr_isSuite = (id) => typeof SUITES !== "undefined" && SUITES.some((s) => s.id === id);
  const whoLabel = (id) => (pr_isSuite(id) ? SUITES.find((x) => x.id === id).label : M().note(id).label || id);
  const named = (c) => (c && c.curiosity ? base(c.curiosity) : null);

  let cache = null;
  function read() {
    const v = V();
    if (!v || !M() || !A()) return null;
    /* edits clear the cache (onChange), so playing never re-reads */
    if (cache) return cache;
    const film = v.film();
    const key = JSON.stringify(film.panels.map((p) => [p.sec, p.cam, p.place, p.words.length, !!p.caption, p.rain, p.v || null, p.id, p.note, p.curves || null]));
    const starts = [];
    let t = 0;
    film.panels.forEach((p) => (starts.push(t), (t += p.sec)));
    const total = t;
    const raw = film.panels.map((_, i) => valuesOf(film, i));
    const K = [];
    raw.forEach((r, i) => (K[i] = Object.assign({}, K[i - 1] || {}, r)));
    const reading = A().read(
      raw.map((values, i) => ({ at: starts[i], values: active(values) })),
      { end: film.panels[film.panels.length - 1].sec },
    );
    const segs = reading.segments;
    const prox = typeof PROXIMITIES !== "undefined" ? PROXIMITIES : [];
    const suites = typeof SUITES !== "undefined" ? SUITES.filter((s) => s && s.set && Object.keys(s.set).length >= 2) : [];
    const panels = film.panels.map((p, i) => {
      const at = starts[i] + 1e-6;
      const seg = segs.find((s) => at >= s.from && at < s.to + 1e-6) || segs[segs.length - 1] || null;
      const lead = seg ? { id: seg.curiosity, label: seg.label, family: seg.family, from: seg.from, to: seg.to, fresh: seg.beat === i } : null;
      /* the strongest other curiosity changing here: the one that pushes the story hardest */
      let second = null;
      const changedHere = Object.keys(active(raw[i])).filter((id) => {
        const val = K[i][id];
        return val != null && val !== "" && !(i > 0 && String((K[i - 1] || {})[id]) === String(val));
      });
      changedHere.forEach((id) => {
        const val = K[i][id];
        if (val == null || val === "") return;
        if (i > 0 && String((K[i - 1] || {})[id]) === String(val)) return;
        if (lead && base(id) === lead.id) return;
        const n = M().note(base(id));
        const score = (n.push || 0) + (STORY[n.family] ? 0.6 : 0);
        if (!second || score > second.score) second = { id: base(id), label: n.label, family: n.family, score };
      });
      /* the suite most of whose lenses are on here */
      let suite = null;
      if (S())
        suites.forEach((s) => {
          const m = S().match(s, K[i]);
          if (!m || m.share < S().CAUSE_SHARE || !(m.on.length >= 3 || (m.share === 1 && m.on.length >= 2))) return;
          /* the suite in front: one the leading curiosity or the one with it belongs to */
          if (!m.on.some((id) => (lead && base(id) === lead.id) || (second && base(id) === second.id))) return;
          if (!suite || m.share > suite.share || (m.share === suite.share && m.total > suite.total)) suite = { id: s.id, label: s.label, share: m.share, total: m.total, on: m.on.length };
        });
      /* a proximity: the one in front (or with it) set off by something else a moment before */
      let trigger = null;
      const front = [lead && lead.fresh ? lead.id : null, second && second.id, suite && suite.id].filter(Boolean);
      const here = changedHere.map(base);
      /* front and center first, then anything else changing here */
      const weight = (pr) => {
        const who = pr.y.suite || named(pr.y);
        return (front.includes(who) ? 10 : 0) + (pr.y.suite ? 3 : M().note(who).push || 0);
      };
      const order = (a, b) => weight(b) - weight(a);
      prox
        .filter((pr) => pr && pr.x && pr.y)
        .sort(order)
        .forEach((pr) => {
        if (trigger || i === 0) return;
        const who = pr.y.suite || named(pr.y);
        if (!who || !(front.includes(who) || here.includes(who) || (pr.y.suite && S() && S().present(pr.y.suite, K[i])))) return;
        if (!cond(pr.y, K, i)) return;
        const within = Math.max(0, Math.min(8, Number(pr.within) || 1));
        for (let k = i; k >= Math.max(0, i - within); k--) {
          if (k === i && (named(pr.x) === who || (pr.x.suite && pr.x.suite === who))) continue;
          if (cond(pr.x, K, k)) {
            trigger = { id: pr.id, when: pr.when, then: pr.then, from: k, who };
            break;
          }
        }
        });
      /* a curiosity set off by another is front and center: it takes the "with it" place if it isn't there */
      if (trigger && !front.includes(trigger.who) && !pr_isSuite(trigger.who)) {
        const n = M().note(trigger.who);
        /* only when it pushes the story (3 of 5 or more), or at least as hard as what is with the lead now */
        if (second && (n.push || 0) < 3 && (n.push || 0) < (M().note(second.id).push || 0)) trigger = null;
      }
      if (trigger && !front.includes(trigger.who) && !pr_isSuite(trigger.who)) {
        const n = M().note(trigger.who);
        second = { id: trigger.who, label: n.label, family: n.family, score: 99 };
      }
      /* what changed here and how hard it pulls, for the attention pie and graph */
      const changes = changedHere.map((id) => {
        const n = M().note(base(id));
        let pull = 1 + 0.15 * (n.push || 0) + (STORY[n.family] ? 0.4 : 0);
        if (lead && lead.fresh && base(id) === lead.id) pull *= 1.8;
        if (second && base(id) === second.id) pull *= 1.3;
        return { id: base(id), label: n.label, family: n.family, pull };
      });
      const present = Object.keys(active(K[i])).map(base);
      return { i, at: starts[i], sec: p.sec, lead, second, suite, trigger, changes, present };
    });
    cache = { key, total, segs, panels, K, stats: reading.stats, limit: reading.limit, curves: film.panels.map((p) => p.curves || null) };
    /* the graph: everyone's share of attention through the film, in small steps */
    const step = Math.max(0.1, total / 240);
    const samples = [];
    for (let x = 0; x <= total + 1e-6; x += step) samples.push({ t: x, sh: sharesAt(cache, x) });
    const sum = {};
    samples.forEach((smp) => smp.sh.forEach((q) => (sum[q.id] = (sum[q.id] || 0) + q.share)));
    cache.top = Object.keys(sum)
      .sort((a, b) => sum[b] - sum[a])
      .slice(0, 6);
    cache.samples = samples;
    return cache;
  }

  /* ---------- the force driving the scene, and what holds attention (Jeremy, 2026-10-05) ----------
     "The force driving the scene and plot forward should be the title of each storyboard", and the pie and graph
     should say which things lead, like "Danger + Shot size": by default 2 things a panel, 3 when the scene is
     complex (a third that pulls nearly as hard as the second). A feeling is named by its value (Melancholy),
     anything else by its name (Shot size). */
  const cap = (w) => String(w).charAt(0).toUpperCase() + String(w).slice(1);
  /* Jeremy 2026-10-05: "emotion and tension are the same thing" (any feeling reads as Tension), and lean on what
     the audience sees first, then what it hears; temperature only shows when it is extreme (snow, shivering). */
  const TENSION = /^(emotion|emo[A-Z]|tension|feeling|mood)/;
  const SENSE = { camera: 1.7, movement: 1.5, light: 1.5, effects: 1.5, cut: 1.4, wardrobe: 1.3, place: 1.2, voice: 1.3, music: 1.3, feeling: 1, comedy: 0.8, plot: 0.7, mind: 0.7 };
  function nameAt(r, id) {
    if (TENSION.test(String(id))) return "Tension";
    return M().note(base(id)).label || id;
  }
  function weightOf(id) {
    if (TENSION.test(String(id))) return 1;
    if (base(id) === "temperature") return 0.6;
    return SENSE[M().note(base(id)).family] || 1;
  }
  function focusAt(r, i) {
    const p = r.panels[i];
    if (!p) return { force: "", focus: [] };
    const sh = sharesAt(r, p.at + Math.min(0.5, p.sec / 2));
    const by = {};
    sh.forEach((q) => {
      const nm = nameAt(r, q.id);
      by[nm] = (by[nm] || 0) + q.share * weightOf(q.id);
    });
    const ranked = Object.keys(by).sort((a, b) => by[b] - by[a]);
    let n = 2;
    if (ranked[2] && by[ranked[2]] >= 0.75 * by[ranked[1]] && by[ranked[2]] >= 0.15) n = 3;
    const names = ranked.slice(0, n);
    return { force: p.lead ? nameAt(r, p.lead.id) : names[0] || "", focus: names };
  }

  /* the storyboard cards under the picture: the force as each one's title, what holds attention at the bottom */
  function labelCards(r) {
    document.querySelectorAll(".cv-root .cv-card[data-i]").forEach((card) => {
      const fa = focusAt(r, +card.dataset.i);
      const fe = card.querySelector(".cv-force");
      const fo = card.querySelector(".cv-focus");
      if (fe) fe.textContent = fa.force;
      if (fo) fo.textContent = fa.focus.join(" + ");
    });
  }

  /* How much of the audience's attention each curiosity has at time t, 0 to 1, adding up to 1. A change pulls
     hardest the moment it happens and fades over a few seconds (TAU); whatever is on but not changing keeps a
     small share. The leading curiosity's change counts most. A guess in plain numbers, like the attention model. */
  const TAU = 3;
  function sharesAt(r, t) {
    const w = {};
    let i = 0;
    while (i + 1 < r.panels.length && r.panels[i + 1].at <= t + 1e-6) i++;
    const info = {};
    r.panels[i].present.forEach((id) => {
      const n = M().note(id);
      w[id] = 0.04 * ((n.push || 0) + 1);
      info[id] = { label: n.label, family: n.family };
    });
    for (let j = 0; j <= i; j++) {
      const P = r.panels[j];
      const k = Math.exp(-Math.max(0, t - P.at) / TAU);
      if (k < 0.01) continue;
      P.changes.forEach((c) => {
        if (!(c.id in w)) return;
        w[c.id] += c.pull * k;
      });
    }
    const all = Object.keys(w).reduce((a, id) => a + w[id], 0) || 1;
    return Object.keys(w)
      .map((id) => ({ id, label: info[id].label, family: info[id].family, share: w[id] / all }))
      .sort((a, b) => b.share - a.share);
  }
  function tint(hex, k) {
    const h = String(hex || "#888").replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k));
    return `rgb(${c.join(",")})`;
  }
  /* one color per curiosity: its family's color, lighter for the second and third of the same family */
  function colorsFor(ids) {
    const seen = {};
    const out = {};
    ids.forEach((id) => {
      const fam = M().note(id).family;
      const k = seen[fam] || 0;
      seen[fam] = k + 1;
      out[id] = tint(M().mark(fam).color, Math.min(0.6, k * 0.28));
    });
    return out;
  }
  let pieSh = [];
  function pieHit(cv, e) {
    const b = cv.getBoundingClientRect();
    const dx = e.clientX - b.left - b.width / 2;
    const dy = e.clientY - b.top - b.height / 2;
    if (Math.hypot(dx, dy) > b.width / 2) return null;
    let a = Math.atan2(dy, dx) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    let acc = 0;
    for (const q of pieSh) {
      acc += q.share * Math.PI * 2;
      if (a <= acc) return q.id;
    }
    return null;
  }
  function drawPie(cv, sh, cols) {
    pieSh = sh;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const S = cv.clientWidth || 70;
    if (cv.width !== Math.round(S * dpr)) cv.width = cv.height = Math.round(S * dpr);
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, S, S);
    let a = -Math.PI / 2;
    const r = S / 2 - 2;
    sh.forEach((q) => {
      const b = a + q.share * Math.PI * 2;
      g.beginPath();
      g.moveTo(S / 2, S / 2);
      g.arc(S / 2, S / 2, r, a, b);
      g.closePath();
      g.fillStyle = cols[q.id] || "#55555c";
      g.fill();
      g.strokeStyle = "#141416";
      g.lineWidth = 1;
      g.stroke();
      a = b;
    });
  }


  /* ---------- Automation lanes (Jeremy 2026-10-05: "the main thing that is missing is the automation lanes") ----------
     One lane per curiosity in the film, panel by panel, the things holding the most attention first, then a lane
     per suite (how much of it is on). Values a panel carries itself (panel.v: feelings, plot, comedy ...) can be
     dragged up or down a step of their scale; values read from the picture (shot size, lens, who moves) say where
     to change them instead. Every drag is one undo step. */
  const READ_FROM_PICTURE = { shotSize: "Camera & lens", angleHeight: "Camera & lens", lensLength: "Camera & lens", "lensLength.distortion": "Camera & lens", weather: "Words (the rain)", balloon: "Words", cameraMove: "Camera & lens", characterPath: "Move it", bodyEnter: "Move it", objectEnter: "Move it" };
  function scaleOf(id, vals) {
    const c = M().find ? M().find(base(id)) : null;
    const slider = String(id).split(".")[1];
    const sl = c && Array.isArray(c.sliders) ? c.sliders.find((x) => x.id === (slider || c.main || "setting")) || c.sliders[0] : null;
    const list = sl && Array.isArray(sl.scale) ? sl.scale : c && Array.isArray(c.options) ? c.options : null;
    if (list && list.length > 1) return { list: list.slice() };
    const nums = vals.filter((v) => v != null && v !== "" && isFinite(Number(v))).map(Number);
    if (nums.length && nums.length === vals.filter((v) => v != null && v !== "").length) {
      const lo = Math.min(0, ...nums);
      const hi = Math.max(lo + 1, ...nums, sl && isFinite(sl.max) ? sl.max : -Infinity);
      return { lo, hi, step: nums.every((n) => Number.isInteger(n)) ? 1 : 0.1 };
    }
    /* words with no known scale: the ones the film uses, in the order they first come */
    const seen = [];
    vals.forEach((v) => v != null && v !== "" && !seen.includes(String(v)) && seen.push(String(v)));
    return { list: seen, loose: true };
  }
  const yOf = (sc, v) => {
    if (v == null || v === "") return null;
    if (sc.list) {
      const k = sc.list.indexOf(v) >= 0 ? sc.list.indexOf(v) : sc.list.map(String).indexOf(String(v));
      return k < 0 ? null : sc.list.length > 1 ? k / (sc.list.length - 1) : 0.5;
    }
    return (Number(v) - sc.lo) / Math.max(1e-6, sc.hi - sc.lo);
  };
  function laneIds(r) {
    const all = {};
    r.K.forEach((k) => Object.keys(active(k)).forEach((id) => (all[id] = 1)));
    const order = [];
    r.top.forEach((id) => Object.keys(all).forEach((full) => base(full) === id && !order.includes(full) && order.push(full)));
    const score = (id) => M().note(base(id)).push || 0;
    Object.keys(all)
      .filter((id) => !order.includes(id))
      .sort((a, b) => score(b) - score(a))
      .forEach((id) => order.push(id));
    return order;
  }
  /* one curiosity's lane: a line through its value in each panel, a node per panel (draggable when it can be set here) */
  /* ---------- curves between two nodes (Jeremy 2026-10-05: the Curve window, from his music app's Slide window) ----------
     A line between node A (panel i, value a) and node B (the next panel with a value, value b) holds by default and
     steps at the panel's edge. Given a curve, it runs from A's middle to B's middle along the curve. The curve is
     panel.curves[curiosity] = { nodes: [[u, v], ...] } on panel A: u how far along in time (0 at A, 1 at B), v how
     far along from a to b. curveEval is the music app's function unchanged, so both apps draw and play the same
     curve; the lanes, the playhead reading (valueAt) and the window all call it. */
  function curveEval(nodes, u) {
    const p = [[0, 0]].concat((nodes || []).slice().sort((a, b) => a[0] - b[0])).concat([[1, 1]]),
      n = p.length;
    let i;
    u = Math.max(0, Math.min(1, u));
    for (i = 0; i < n - 2 && u > p[i + 1][0]; i++) {}
    const slope = (k) => {
      const a = p[Math.max(0, k - 1)],
        b = p[Math.min(n - 1, k + 1)];
      return b[0] - a[0] > 1e-9 ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
    };
    const u0 = p[i][0],
      u1 = p[i + 1][0],
      h = Math.max(1e-9, u1 - u0),
      s = (u - u0) / h,
      m0 = slope(i),
      m1 = slope(i + 1);
    const v = (2 * s * s * s - 3 * s * s + 1) * p[i][1] + (s * s * s - 2 * s * s + s) * h * m0 + (-2 * s * s * s + 3 * s * s) * p[i + 1][1] + (s * s * s - s * s) * h * m1;
    return Math.max(0, Math.min(1, v));
  }
  const PRESETS = [
    ["Straight", [[0.5, 0.5]], "An even change from one node to the next."],
    ["Ease in", [[0.5, 0.25]], "Starts slowly, speeds up toward the end."],
    ["Ease out", [[0.5, 0.75]], "Starts quickly, settles into the end."],
    ["S curve", [[0.25, 0.1], [0.75, 0.9]], "Slow start, quick middle, slow landing: the most natural fade or camera move."],
    ["Sharp in", [[0.5, 0.1], [0.75, 0.3]], "Barely moves, then rushes to the end."],
    ["Sharp out", [[0.25, 0.7], [0.5, 0.9]], "Jumps most of the way at once, then creeps in."],
  ];
  const CURVE = { max: 16, lo: 0.02, hi: 0.98, gap: 0.02 };
  const sameNodes = (x, y) => JSON.stringify((x || []).map((q) => q.map((n) => +n.toFixed(3)))) === JSON.stringify((y || []).map((q) => q.map((n) => +n.toFixed(3))));
  const presetOf = (nodes) => PRESETS.find((q) => sameNodes(q[1], nodes)) || null;
  function describe(nodes) {
    if (sameNodes(nodes, PRESETS[3][1])) return "S curve";
    const m = curveEval(nodes, 0.5);
    return Math.abs(m - 0.5) <= 0.02 ? "straight" : m > 0.5 ? "eases out (fast start)" : "eases in (slow start)";
  }
  /* a point dragged to (u, v): kept inside the limits and between its neighbours */
  function placeNode(nodes, k, u, v) {
    const lo = k > 0 ? nodes[k - 1][0] + CURVE.gap : CURVE.lo;
    const hi = k < nodes.length - 1 ? nodes[k + 1][0] - CURVE.gap : CURVE.hi;
    nodes[k] = [+Math.max(lo, Math.min(hi, u)).toFixed(4), +Math.max(0, Math.min(1, v)).toFixed(4)];
    return nodes;
  }
  function addNode(nodes, u) {
    if (nodes.length >= CURVE.max) return -1;
    u = Math.max(CURVE.lo, Math.min(CURVE.hi, u));
    if (nodes.some((q) => Math.abs(q[0] - u) < CURVE.gap)) return -1;
    nodes.push([+u.toFixed(4), +curveEval(nodes, u).toFixed(4)]);
    nodes.sort((a, b) => a[0] - b[0]);
    return nodes.findIndex((q) => q[0] === +u.toFixed(4));
  }
  function removeNode(nodes, k) {
    if (nodes.length <= 1) return false;
    nodes.splice(k, 1);
    return true;
  }
  const curveOf = (r, i, id) => {
    const c = r.curves && r.curves[i] && r.curves[i][id];
    return c && Array.isArray(c.nodes) && c.nodes.length ? c : null;
  };
  /* where a lane is at time t, 0 to 1 on its scale: what the lanes draw and the playhead reads */
  function laneAt(r, id, t) {
    const sc = scaleOf(id, r.K.map((k) => k[id]));
    const pts = [];
    r.panels.forEach((p, i) => {
      const y = yOf(sc, r.K[i][id]);
      if (y != null) pts.push({ i, y, x: p.at + p.sec / 2 });
    });
    if (!pts.length) return null;
    let k = pts.length - 1;
    while (k > 0 && pts[k].x > t) k--;
    const A = pts[k];
    const B = pts[k + 1];
    if (!B || t < A.x) return { y: A.y, sc };
    const c = curveOf(r, A.i, id);
    if (c) return { y: A.y + (B.y - A.y) * curveEval(c.nodes, (t - A.x) / Math.max(1e-6, B.x - A.x)), sc };
    return { y: t < r.panels[B.i].at ? A.y : B.y, sc };
  }
  function valueAt(r, id, t) {
    const q = laneAt(r, id, t);
    if (!q) return null;
    const sc = q.sc;
    if (sc.list) return { y: q.y, value: sc.list[Math.round(q.y * (sc.list.length - 1))] };
    return { y: q.y, value: sc.lo + q.y * (sc.hi - sc.lo) };
  }
  /* one curiosity's lane: a line through its value in each panel, a node per panel (draggable when it can be set here) */
  function laneParts(r, id, color) {
    const total = r.total;
    const n = M().note(base(id));
    const vals = r.K.map((k) => k[id]);
    const sc = scaleOf(id, vals);
    const where = READ_FROM_PICTURE[id];
    const edit = !where && !sc.loose;
    const col = color || M().mark(n.family).color;
    const X = (sec) => (fx(sec) * 1000).toFixed(1);
    const nodes = [];
    const dots = r.panels
      .map((p, i) => {
        const y = yOf(sc, vals[i]);
        if (y == null) return "";
        const Y = (1 - y) * 100;
        nodes.push({ i, x: p.at + p.sec / 2, Y, edge: p.at + p.sec });
        return `<i class="cf-ln-dot${edit ? " cf-ed" : ""}" data-ln="${esc(id)}" data-ln-i="${i}" style="left:${pct(p.at + p.sec / 2, total)};top:${Y.toFixed(1)}%;background:${col}" title="${esc(`${n.label}, panel ${i + 1}: ${vals[i]}`)}"></i>`;
      })
      .join("");
    let path = "";
    const hits = [];
    if (nodes.length) {
      const a0 = r.panels[nodes[0].i].at;
      path = `M${X(a0)},${nodes[0].Y.toFixed(1)} L${X(nodes[0].x)},${nodes[0].Y.toFixed(1)} `;
      nodes.forEach((A, k) => {
        const B = nodes[k + 1];
        if (!B) return void (path += `L${X(A.edge)},${A.Y.toFixed(1)} `);
        const c = curveOf(r, A.i, id);
        let seg = "";
        if (c) {
          for (let s2 = 1; s2 <= 80; s2++) {
            const t = s2 / 80;
            seg += `L${X(A.x + (B.x - A.x) * t)},${(A.Y + (B.Y - A.Y) * curveEval(c.nodes, t)).toFixed(1)} `;
          }
        } else {
          const e = r.panels[B.i].at;
          seg = `L${X(e)},${A.Y.toFixed(1)} L${X(e)},${B.Y.toFixed(1)} L${X(B.x)},${B.Y.toFixed(1)} `;
        }
        path += seg;
        hits.push(`<path class="cf-seg${segSel.has(id + "|" + A.i) ? " on" : ""}" d="M${X(A.x)},${A.Y.toFixed(1)} ${seg}" data-ln="${esc(id)}" data-seg="${A.i}" data-to="${B.i}"><title>${esc(`${n.label}: the line from panel ${A.i + 1} to ${B.i + 1}${c ? " (" + describe(c.nodes) + ")" : ""}. Ctrl+click or double-click: the Curve window. Click to select it, Shift+click to select more.`)}</title></path>`);
      });
    }
    const svg = `<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>${hits.join("")}</svg>`;
    return { n, sc, where, edit, svg, dots };
  }
  const sepsOf = (r) =>
    r.panels.map((p) => `<i class="cf-ln-sep" style="left:${pct(p.at, r.total)}"></i>`).join("") +
    scenesOf()
      .filter((sc) => sc.n > 0)
      .map((sc) => `<i class="cf-ln-sep cf-sc-sep" style="left:${pct(sc.from)};background:${sc.color}"></i>`)
      .join("");
  const laneName = (id, n) => (TENSION.test(String(id)) && n.label !== "Tension" ? "Tension: " + n.label : n.label || id);
  /* the Viewer focus graph is one view of the automation lanes: the top curiosities on one track, nodes and lines */
  let picked = null; /* the lane picked from the pie or the list: drawn on top, the others dimmed */
  function graphHtml(r) {
    const ids = laneIds(r).slice(0, 4);
    if (picked && !ids.some((id) => base(id) === picked)) {
      const more = laneIds(r).find((id) => base(id) === picked);
      if (more) ids.push(more);
    }
    const cols = colorsFor([...new Set([...r.top, ...ids.map(base)])]);
    return `${sepsOf(r)}<div class="cf-ln-in">${ids
      .map((id) => {
        const q = laneParts(r, id, cols[base(id)]);
        return `<div class="cf-g${picked === base(id) ? " on" : ""}" data-g="${esc(base(id))}">${q.svg}${q.dots}<i class="cf-ln-play" data-play="${esc(id)}"></i></div>`;
      })
      .join("")}</div><i class="cf-ln-head"></i>`;
  }
  function pick(id) {
    picked = picked === id ? null : id;
    const g = box && box.querySelector(".cf-graph");
    const r = read();
    if (g && r) {
      g.innerHTML = graphHtml(r);
      g.classList.toggle("cf-picked", !!picked);
    }
    box && box.querySelectorAll(".cf-list li").forEach((li) => li.classList.toggle("on", li.dataset.g === picked));
    V().redraw();
  }
  function lanesHtml(r) {
    const total = r.total;
    const seps = sepsOf(r);
    const L = scenesOf();
    const rows = laneIds(r).map((id) => {
      const { n, sc, where, edit, svg, dots } = laneParts(r, id);
      const tip = edit ? "Drag a dot up or down to change that panel" : where ? `Read from the picture: change it in ${where}` : "Set in the panels themselves";
      return `<div class="cf-ln${edit ? " cf-ln-edit" : ""}" data-ln="${esc(id)}" style="--ln-c:${M().mark(n.family).color}"><span class="cf-ln-name" title="${esc(n.label + ". " + tip)}"><b>${esc(laneName(id, n))}</b><small>${esc(edit ? (sc.list ? sc.list[0] + " to " + sc.list[sc.list.length - 1] : sc.lo + " to " + sc.hi) : tip)}</small></span><div class="cf-ln-track">${seps}<div class="cf-ln-in">${svg}${dots}<i class="cf-ln-play" data-play="${esc(id)}"></i></div><i class="cf-ln-head"></i></div><button type="button" class="cf-ln-pop" data-cwin="${esc(id)}" title="${esc("Open the " + n.label + " window")}" aria-label="${esc("Open the " + n.label + " window")}">⧉</button></div>`;
    });
    /* suites: how much of each suite in front is on, panel by panel */
    const suiteIds = [...new Set(r.panels.filter((p) => p.suite).map((p) => p.suite.id))];
    const all = typeof SUITES !== "undefined" ? SUITES : [];
    suiteIds.forEach((sid) => {
      const su = all.find((x) => x && x.id === sid);
      if (!su || !S()) return;
      let path = "";
      r.panels.forEach((p, i) => {
        const m = S().match(su, r.K[i]);
        const y = m ? m.share : 0;
        const x0 = fx(p.at) * 1000;
        const x1 = fx(p.at + p.sec) * 1000;
        path += `${path ? "L" : "M"}${x0.toFixed(1)},${((1 - y) * 100).toFixed(1)} L${x1.toFixed(1)},${((1 - y) * 100).toFixed(1)} `;
      });
      rows.push(`<div class="cf-ln cf-ln-suite" data-ln-suite="${esc(sid)}"><span class="cf-ln-name" title="${esc("Suite: " + su.label + ". How much of it is on in each panel; it follows its curiosities.")}"><b>Suite: ${esc(su.label)}</b><small>how much of it is on</small></span><div class="cf-ln-track">${seps}<div class="cf-ln-in"><svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="#a78bfa" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div><i class="cf-ln-head"></i></div><span></span></div>`);
    });
    if (!rows.length) return `<p class="cf-lanes-hint">Nothing is set yet.</p>`;
    /* the scenes on top, in the storyboard's colors, so the lanes read scene by scene */
    rows.unshift(`<div class="cf-ln cf-ln-scenes"><span class="cf-ln-name" title="Each scene in its storyboard color. Click one to show just that scene."><b>Scenes</b><small>${L.length} scene${L.length === 1 ? "" : "s"}</small></span><div class="cf-ln-track cf-sc-track">${sceneBlocks()}</div><span></span></div>`);
    return rows.join("");
  }
  /* drag a dot: the panel's own value moves a step along the curiosity's scale */
  function laneDrag(e, dot) {
    if (!dot.classList.contains("cf-ed")) return;
    const id = dot.dataset.ln;
    const i = +dot.dataset.lnI;
    const r = read();
    const sc = scaleOf(id, r.K.map((k) => k[id]));
    const track = dot.closest(".cf-ln-in").getBoundingClientRect();
    e.preventDefault();
    dot.setPointerCapture && dot.setPointerCapture(e.pointerId);
    dot.classList.add("cf-drag");
    document.body.classList.add("cf-dragging");
    V().remember("lane-" + id + "-" + i);
    const valueAt = (cy) => {
      const y = Math.max(0, Math.min(1, 1 - (cy - track.top) / Math.max(1, track.height)));
      if (sc.list) return sc.list[Math.round(y * (sc.list.length - 1))];
      const raw = sc.lo + y * (sc.hi - sc.lo);
      return Math.round(raw / sc.step) * sc.step;
    };
    const move = (ev) => {
      const v = valueAt(ev.clientY);
      const live = V().live();
      const p = live.film.panels[i];
      p.v = Object.assign({}, storyOf(p), { [id]: typeof v === "number" ? Number(v.toFixed(2)) : v });
      dot.style.top = ((1 - yOf(sc, p.v[id])) * 100).toFixed(1) + "%";
      dot.title = `${M().note(base(id)).label}, panel ${i + 1}: ${p.v[id]}`;
    };
    const up = () => {
      dot.removeEventListener("pointermove", move);
      dot.removeEventListener("pointerup", up);
      dot.removeEventListener("pointercancel", up);
      dot.classList.remove("cf-drag");
      document.body.classList.remove("cf-dragging");
      cache = null;
      V().changed(true);
    };
    dot.addEventListener("pointermove", move);
    dot.addEventListener("pointerup", up);
    dot.addEventListener("pointercancel", up);
  }
  /* drag Front and center wider, over the side panels; kept per device */
  const OUT_KEY = "curio-focus-out-v1";
  /* by default it runs from where it is to the right side of the screen (Jeremy 2026-10-05) */
  let out = { l: 0, r: "max" };
  try {
    out = Object.assign(out, JSON.parse(localStorage.getItem(OUT_KEY) || "{}"));
  } catch (e) {}
  function room(side) {
    const main = document.querySelector(".cv-root .cv-main");
    const player = document.querySelector(".cv-root .cv-player");
    if (!main || !player) return 0;
    const mr = main.getBoundingClientRect();
    const pr = player.getBoundingClientRect();
    return side === "l" ? Math.max(0, pr.left - mr.left - 6) : Math.max(0, mr.right - pr.right - 6);
  }
  const px = (side) => (out[side] === "max" ? room(side) : Math.min(room(side), +out[side] || 0));
  function applyOut() {
    if (!box) return;
    const L = px("l");
    const R = px("r");
    box.style.setProperty("--cf-out-l", L + "px");
    box.style.setProperty("--cf-out-r", R + "px");
    if (L || R) box.dataset.out = "1";
    else delete box.dataset.out;
    cover();
  }
  /* the side panel it covers ends above it, so nothing in that panel hides under it (its own scroll reaches all);
     measured again on every frame, since the picture and the storyboard can change size */
  function cover() {
    const root = box && box.isConnected && box.closest(".cv-root");
    const main = root && root.querySelector(".cv-main");
    if (!main || box.hidden || !box.offsetHeight) return;
    const ov = (side) => (out[side] === "max" || +out[side] > 0) && px(side) > 0;
    const c = Math.max(0, Math.round(main.getBoundingClientRect().bottom - box.getBoundingClientRect().top + 6));
    const l = (ov("l") ? c : 0) + "px";
    const r = (ov("r") ? c : 0) + "px";
    if (root.style.getPropertyValue("--cf-cover-l") !== l) root.style.setProperty("--cf-cover-l", l);
    if (root.style.getPropertyValue("--cf-cover-r") !== r) root.style.setProperty("--cf-cover-r", r);
  }
  function gripDrag(e, g) {
    const side = g.dataset.cfGrip;
    const main = document.querySelector(".cv-root .cv-main");
    const player = document.querySelector(".cv-root .cv-player");
    if (!main || !player) return;
    e.preventDefault();
    g.setPointerCapture && g.setPointerCapture(e.pointerId);
    g.classList.add("cf-drag");
    document.body.classList.add("cf-dragging");
    const max = room(side);
    const x0 = e.clientX;
    const start = px(side);
    const move = (ev) => {
      const d = side === "l" ? x0 - ev.clientX : ev.clientX - x0;
      out[side] = Math.round(Math.max(0, Math.min(max, start + d)));
      applyOut();
      V().redraw();
    };
    const up = () => {
      g.removeEventListener("pointermove", move);
      g.removeEventListener("pointerup", up);
      g.classList.remove("cf-drag");
      document.body.classList.remove("cf-dragging");
      try {
        localStorage.setItem(OUT_KEY, JSON.stringify(out));
      } catch (err) {}
    };
    g.addEventListener("pointermove", move);
    g.addEventListener("pointerup", up);
  }

  /* ---------- a curiosity's window (Jeremy 2026-10-05: "a little button ... at the end of each track ... that
     should launch it. There should also be a search button inside of each pop-up window") ----------
     ⧉ at the end of a lane opens that curiosity's window over the Viewer: what it is, then each of its sliders
     from the database with a control for the selected panel. A slider set in a panel becomes a lane of its own
     (◆: this panel sets it; ◇: it holds what came before), so every slider is automatable. Search opens a search
     window docked to its right edge, which moves and closes with it. The search itself (columns as filters over
     films, games, books, short stories, essays and poems) is the scene inspiration search (inspire/*.js,
     window.CurioInspire.openSearch(curiosityId, { anchor })): when it is loaded, Search opens it beside this
     window, already on this curiosity; without it, a plain search box stands in. */
  let cwin = null;
  let swin = null;
  function closeWin() {
    if (swin) swin.remove();
    if (cwin) cwin.remove();
    cwin = swin = null;
  }
  function closeSearch() {
    if (swin) swin.remove();
    swin = null;
  }
  const laneIdOf = (c, sl) => (sl.id === (c.main || "setting") ? c.id : c.id + "." + sl.id);
  function winRows(id) {
    const live = V().live();
    const i = live.cur;
    const r = read();
    const c = M().find ? M().find(base(id)) : null;
    const n = M().note(base(id));
    const sliders = c && Array.isArray(c.sliders) && c.sliders.length ? c.sliders : [{ id: (c && c.main) || "setting", label: n.label, plain: "Its setting in this panel." }];
    const own = (live.panel && live.panel.v) || {};
    return sliders
      .map((sl) => {
        const lid = c ? laneIdOf(c, sl) : id;
        const held = r && r.K[i] ? r.K[i][lid] : undefined;
        const where = READ_FROM_PICTURE[lid];
        const set = Object.prototype.hasOwnProperty.call(own, lid);
        let ctl;
        if (where) ctl = `<small>${esc(held == null ? "not set" : String(held))} · read from the picture: change it in ${esc(where)}</small>`;
        else if (Array.isArray(sl.scale) && sl.scale.length) ctl = `<select data-cw-set="${esc(lid)}" aria-label="${esc(sl.label)}"><option value="">(not set)</option>${sl.scale.map((o) => `<option${String(o) === String(held) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
        else {
          const g = sl.range || { min: 0, max: 5, step: 1 };
          const v = held == null || held === "" || !isFinite(Number(held)) ? g.min : Number(held);
          ctl = `<input type="range" data-cw-set="${esc(lid)}" min="${g.min}" max="${g.max}" step="${g.step || 1}" value="${v}" aria-label="${esc(sl.label)}"><output>${held == null ? "–" : esc(held)}</output>`;
        }
        const key = where ? "" : `<button type="button" class="cf-cw-key${set ? "" : " off"}" data-cw-key="${esc(lid)}" title="${set ? "This panel sets it (a node on its lane). Click to take the node out, so it holds what came before." : "This panel holds what came before. Pick a setting to put a node here."}">${set ? "◆" : "◇"}</button>`;
        return `<div class="cf-cw-row"><div><b>${esc(sl.label || lid)}</b>${key}</div><small>${esc(sl.plain || "")}</small><div>${ctl}</div></div>`;
      })
      .join("");
  }
  function drawWin() {
    if (!cwin) return;
    const id = cwin.dataset.cwin;
    const live = V().live();
    const c = M().find ? M().find(base(id)) : null;
    const n = M().note(base(id));
    cwin.querySelector(".cf-cwin-b").innerHTML = `<p>${esc((c && c.plain) || n.label)}</p><p><small>Panel ${live.cur + 1}: pick another panel in the storyboard to set it there.</small></p>${winRows(id)}`;
  }
  function dock() {
    if (!cwin || !swin) return;
    const b = cwin.getBoundingClientRect();
    const w = swin.offsetWidth;
    const right = b.right + 6 + w <= innerWidth - 8;
    swin.style.left = (right ? b.right + 6 : Math.max(8, b.left - 6 - w)) + "px";
    swin.style.top = b.top + "px";
  }
  function openSearch() {
    if (!cwin) return;
    if (swin) return closeSearch();
    const id = cwin.dataset.cwin;
    const I = window.CurioInspire;
    if (I && typeof I.openSearch === "function") {
      try {
        const d = I.openSearch(base(id), { anchor: cwin, lane: id });
        /* it opens as a plain (not modal) pop-up, so lift it over the Viewer like this window */
        if (d && d.style) d.style.zIndex = "2147482995";
        return;
      } catch (e) {}
    }
    const n = M().note(base(id));
    swin = document.createElement("div");
    swin.className = "cf-swin";
    swin.setAttribute("role", "dialog");
    swin.setAttribute("aria-label", "Search: " + n.label);
    swin.innerHTML = `<header><b>Search: ${esc(n.label)}</b><button type="button" data-sw="close" title="Close the search" aria-label="Close the search">✕</button></header><div class="cf-swin-b"></div>`;
    document.body.appendChild(swin);
    const body = swin.querySelector(".cf-swin-b");
    body.innerHTML = `<input type="search" placeholder="Search for ${esc(n.label.toLowerCase())}" aria-label="Search"><p>Coming next: search films, books, short stories, essays and poems for ${esc(n.label.toLowerCase())}, with columns that filter each other.</p>`;
    dock();
  }
  function openWin(id, btn) {
    const same = cwin && cwin.dataset.cwin === id;
    closeWin();
    if (same) return;
    const n = M().note(base(id));
    cwin = document.createElement("div");
    cwin.className = "cf-cwin";
    cwin.dataset.cwin = id;
    cwin.setAttribute("role", "dialog");
    cwin.setAttribute("aria-label", n.label + " window");
    cwin.innerHTML = `<header title="Drag to move"><i style="background:${M().mark(n.family).color}"></i><b>${esc(laneName(id, n))}</b><button type="button" data-cw="search" title="Search films and writing for this curiosity (opens beside this window)">🔍 Search</button><button type="button" data-cw="close" title="Close (Esc)" aria-label="Close">✕</button></header><div class="cf-cwin-b"></div>`;
    document.body.appendChild(cwin);
    drawWin();
    const b = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2 };
    const h = cwin.offsetHeight;
    cwin.style.left = Math.max(8, Math.min(innerWidth - cwin.offsetWidth - 8, b.left - cwin.offsetWidth - 8)) + "px";
    cwin.style.top = Math.max(8, Math.min(innerHeight - h - 8, b.top - h / 2)) + "px";
    cwin.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest('[data-cw="close"]')) return closeWin();
      if (t.closest('[data-cw="search"]')) return openSearch();
      const k = t.closest("[data-cw-key]");
      if (k && !k.classList.contains("off")) {
        const lid = k.dataset.cwKey;
        const live = V().live();
        V().remember("win-" + lid + "-" + live.cur);
        const p = live.panel;
        const v = Object.assign({}, storyOf(p));
        delete v[lid];
        p.v = v;
        cache = null;
        V().changed(true);
      }
    });
    const write = (el, final) => {
      const lid = el.dataset.cwSet;
      const live = V().live();
      const p = live.panel;
      const v = Object.assign({}, storyOf(p));
      if (el.value === "") delete v[lid];
      else v[lid] = el.type === "range" ? Number(el.value) : el.value;
      p.v = v;
      cache = null;
      const o = el.parentElement.querySelector("output");
      if (o) o.textContent = el.value;
      if (final) V().changed(true);
      else V().redraw();
    };
    let began = null;
    cwin.addEventListener("input", (e) => {
      const el = e.target.closest("[data-cw-set]");
      if (!el) return;
      if (began !== el) {
        V().remember("win-" + el.dataset.cwSet + "-" + V().live().cur);
        began = el;
      }
      write(el, el.tagName === "SELECT");
      if (el.tagName === "SELECT") began = null;
    });
    cwin.addEventListener("change", (e) => {
      const el = e.target.closest('input[data-cw-set]');
      if (!el) return;
      if (began !== el) V().remember("win-" + el.dataset.cwSet + "-" + V().live().cur);
      began = null;
      write(el, true);
    });
    /* drag it by its title bar; the search window moves with it */
    cwin.querySelector("header").addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      e.preventDefault();
      const r0 = cwin.getBoundingClientRect();
      const x0 = e.clientX;
      const y0 = e.clientY;
      const hd = e.currentTarget;
      hd.setPointerCapture && hd.setPointerCapture(e.pointerId);
      const move = (ev) => {
        cwin.style.left = Math.max(0, Math.min(innerWidth - 60, r0.left + ev.clientX - x0)) + "px";
        cwin.style.top = Math.max(0, Math.min(innerHeight - 40, r0.top + ev.clientY - y0)) + "px";
        dock();
      };
      const up = () => {
        hd.removeEventListener("pointermove", move);
        hd.removeEventListener("pointerup", up);
      };
      hd.addEventListener("pointermove", move);
      hd.addEventListener("pointerup", up);
    });
  }

  /* ---------- the Curve window (Jeremy 2026-10-05, his spec from the music app's Slide window) ----------
     Ctrl+click or double-click a line between two nodes. Drag a point up or down to shape the curve (sideways moves
     it along); double-click the curve for a new point, double-click a point to remove it; the buttons are ready-made
     curves. Each finished drag, added or removed point and preset is one undo step; while dragging, the lanes
     follow live. Click a line to select it, Shift+click to select more: a preset then goes on every selected line. */
  const segSel = new Set();
  let cpop = null;
  let cseg = null;
  const W = 640;
  const H = 420;
  const PX = 40;
  const TOP = 46;
  const BOT = 396;
  function closeCurve() {
    if (cpop) cpop.remove();
    cpop = null;
    cseg = null;
  }
  const liveFilm = () => V().live().film;
  function nodesOf(id, i) {
    const p = liveFilm().panels[i];
    const c = p && p.curves && p.curves[id];
    return c && Array.isArray(c.nodes) && c.nodes.length ? c.nodes.map((q) => q.slice()) : [[0.5, 0.5]];
  }
  function writeNodes(id, i, nodes) {
    const p = liveFilm().panels[i];
    p.curves = Object.assign({}, p.curves || {}, { [id]: { nodes: nodes.map((q) => q.slice()) } });
    cache = null;
  }
  function selectSeg(id, i, add) {
    const k = id + "|" + i;
    if (!add) segSel.clear();
    if (add && segSel.has(k)) segSel.delete(k);
    else segSel.add(k);
    document.querySelectorAll(".cv-under .cf-seg").forEach((el) => el.classList.toggle("on", segSel.has(el.dataset.ln + "|" + el.dataset.seg)));
  }
  const iconOf = (nodes) => {
    let d = "";
    for (let k = 0; k <= 16; k++) d += `${k ? "L" : "M"}${(2 + (k / 16) * 20).toFixed(1)},${(16 - curveEval(nodes, k / 16) * 14).toFixed(1)} `;
    return `<svg viewBox="0 0 24 18" width="24" height="18" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
  };
  function openCurve(seg, ev) {
    closeCurve();
    const r = read();
    if (!r) return;
    const id = seg.dataset.ln;
    const i = +seg.dataset.seg;
    const j = +seg.dataset.to;
    if (!segSel.has(id + "|" + i)) selectSeg(id, i, false);
    cseg = { id, i, j };
    const n = M().note(base(id));
    const label = laneName(id, n);
    const col = M().mark(n.family).color;
    cpop = document.createElement("div");
    cpop.className = "cf-cpop";
    cpop.setAttribute("role", "dialog");
    cpop.setAttribute("aria-label", "Curve: " + label);
    cpop.innerHTML = `<header><b>Curve</b><button type="button" data-c="close" title="Close (Esc)" aria-label="Close">✕</button></header>
      <canvas width="${W}" height="${H}" aria-label="The curve from one node to the next"></canvas>
      <div class="cf-cpresets">${PRESETS.map((q, k) => `<button type="button" data-preset="${k}" title="${esc(q[2])}">${iconOf(q[1])}<span>${esc(q[0])}</span></button>`).join("")}</div>
      <p class="cf-cstatus" aria-live="polite"></p>
      <p class="cf-chelp">drag a point up or down to shape the curve (sideways moves it along) · double-click the curve: a new point · double-click a point: remove it</p>`;
    document.body.appendChild(cpop);
    const cv = cpop.querySelector("canvas");
    const g = cv.getContext("2d");
    const status = cpop.querySelector(".cf-cstatus");
    let dragK = -1;
    let say = "";
    /* the two keyframes: their values, and which end is drawn on top */
    const ends = () => {
      const rr = read();
      const sc = scaleOf(id, rr.K.map((k) => k[id]));
      const a = rr.K[i][id];
      const b = rr.K[j][id];
      const ya = yOf(sc, a);
      const yb = yOf(sc, b);
      const fall = yb < ya;
      return { a, b, ya, yb, flat: ya === yb, ys: fall ? TOP : BOT, ye: fall ? BOT : TOP, secs: rr.panels[j].at + rr.panels[j].sec / 2 - (rr.panels[i].at + rr.panels[i].sec / 2) };
    };
    const X = (u) => PX + u * (W - 2 * PX);
    const Y = (e, v) => e.ys + (e.ye - e.ys) * v;
    function paint() {
      if (!cpop) return;
      const e = ends();
      const nodes = nodesOf(id, i);
      g.clearRect(0, 0, W, H);
      g.fillStyle = "#141416";
      g.fillRect(0, 0, W, H);
      g.font = "600 14px system-ui, sans-serif";
      g.fillStyle = "#e6e6ea";
      g.textBaseline = "middle";
      const title = `${label}: ${e.a} → ${e.b} · ${e.secs.toFixed(1)} s · ${describe(nodes)}`;
      let t = title;
      while (g.measureText(t).width > W - 24 && t.length > 8) t = t.slice(0, -2);
      g.fillText(t === title ? t : t + "…", 12, 18);
      g.strokeStyle = "#232328";
      g.lineWidth = 1;
      for (let k = 0; k <= 8; k++) {
        g.beginPath();
        g.moveTo(X(k / 8), TOP - 8);
        g.lineTo(X(k / 8), BOT + 8);
        g.stroke();
      }
      g.strokeStyle = "#3a3a42";
      g.setLineDash([5, 5]);
      g.beginPath();
      g.moveTo(X(0), e.ys);
      g.lineTo(X(1), e.ye);
      g.stroke();
      g.setLineDash([]);
      g.strokeStyle = col;
      g.lineWidth = 3;
      g.beginPath();
      for (let k = 0; k <= 80; k++) {
        const u = k / 80;
        k ? g.lineTo(X(u), Y(e, curveEval(nodes, u))) : g.moveTo(X(u), Y(e, curveEval(nodes, u)));
      }
      g.stroke();
      g.fillStyle = "#d6d6db";
      g.fillRect(X(0) - 14, e.ys - 8, 28, 16);
      g.fillRect(X(1) - 14, e.ye - 8, 28, 16);
      nodes.forEach((q, k) => {
        g.beginPath();
        g.arc(X(q[0]), Y(e, q[1]), 6, 0, Math.PI * 2);
        g.fillStyle = k === dragK ? "#22d3ee" : "#ffffff";
        g.fill();
        g.strokeStyle = "#111";
        g.lineWidth = 1.5;
        g.stroke();
      });
      const pr = presetOf(nodes);
      cpop.querySelectorAll("[data-preset]").forEach((b) => b.classList.toggle("on", !!pr && PRESETS[+b.dataset.preset] === pr));
      status.textContent = (say || `curve: ${nodes.length} point${nodes.length === 1 ? "" : "s"}`) + (e.flat ? " · these two nodes have the same setting, so the curve changes nothing until one of them moves" : "");
    }
    cpop.paint = paint;
    /* where it opens: above the click when there is room, else below */
    const w = Math.min(W + 22, innerWidth - 16);
    cpop.style.width = w + "px";
    paint();
    const h = cpop.offsetHeight;
    const cx = ev ? ev.clientX : seg.getBoundingClientRect().left;
    const cy = ev ? ev.clientY : seg.getBoundingClientRect().top;
    cpop.style.left = Math.max(8, Math.min(innerWidth - w - 8, cx - w / 2)) + "px";
    cpop.style.top = Math.max(8, cy - h - 14 >= 8 ? cy - h - 14 : Math.min(innerHeight - h - 8, cy + 14)) + "px";

    const at = (e) => {
      const b = cv.getBoundingClientRect();
      return [((e.clientX - b.left) / b.width) * W, ((e.clientY - b.top) / b.height) * H];
    };
    const pointAt = (x, y) => {
      const e = ends();
      return nodesOf(id, i).findIndex((q) => Math.hypot(X(q[0]) - x, Y(e, q[1]) - y) <= 6 + 8);
    };
    const onCurve = (x, y) => {
      const e = ends();
      const nodes = nodesOf(id, i);
      for (let k = 0; k <= 160; k++) {
        const u = k / 160;
        if (Math.hypot(X(u) - x, Y(e, curveEval(nodes, u)) - y) <= 8) return true;
      }
      return false;
    };
    const step = (label2, fn) => {
      V().remember("curve-" + id + "-" + i + "-" + label2);
      fn();
      cache = null;
      V().changed(true);
    };
    let last = null;
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const [x, y] = at(e);
      const b = cv.getBoundingClientRect();
      const now = performance.now();
      const dbl = last && now - last.t <= 350 && Math.hypot(e.clientX - last.x, e.clientY - last.y) <= 6;
      last = dbl ? null : { t: now, x: e.clientX, y: e.clientY };
      const k = pointAt(x, y);
      if (dbl) {
        if (k >= 0) {
          const nodes = nodesOf(id, i);
          if (!removeNode(nodes, k)) {
            say = "The last point stays: a curve needs one.";
            return paint();
          }
          say = `point removed · curve: ${nodes.length} point${nodes.length === 1 ? "" : "s"}`;
          step("remove", () => writeNodes(id, i, nodes));
        } else if (onCurve(x, y)) {
          const nodes = nodesOf(id, i);
          if (addNode(nodes, (x - PX) / (W - 2 * PX)) < 0) {
            say = nodes.length >= CURVE.max ? "A curve holds at most 16 points." : "Too close to another point.";
            return paint();
          }
          say = `point added · curve: ${nodes.length} points`;
          step("add", () => writeNodes(id, i, nodes));
        }
        return paint();
      }
      if (k < 0) return;
      dragK = k;
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      document.body.classList.add("cf-dragging");
      let moved = false;
      const move = (ev2) => {
        const [x2, y2] = at(ev2);
        const en = ends();
        const nodes = nodesOf(id, i);
        const u = (x2 - PX) / (W - 2 * PX);
        const v = en.ye === en.ys ? 0.5 : (y2 - en.ys) / (en.ye - en.ys);
        if (!moved) {
          V().remember("curve-" + id + "-" + i + "-drag");
          moved = true;
        }
        placeNode(nodes, dragK, u, v);
        writeNodes(id, i, nodes);
        say = "";
        paint();
        V().redraw();
      };
      const up = () => {
        cv.removeEventListener("pointermove", move);
        cv.removeEventListener("pointerup", up);
        cv.removeEventListener("pointercancel", up);
        document.body.classList.remove("cf-dragging");
        dragK = -1;
        if (moved) {
          cache = null;
          V().changed(true);
        }
        paint();
      };
      cv.addEventListener("pointermove", move);
      cv.addEventListener("pointerup", up);
      cv.addEventListener("pointercancel", up);
      paint();
    });
    cpop.addEventListener("click", (e) => {
      const pb = e.target.closest("[data-preset]");
      if (pb) {
        const q = PRESETS[+pb.dataset.preset];
        const targets = new Set(segSel);
        targets.add(id + "|" + i);
        step("preset", () =>
          targets.forEach((key) => {
            const cut = key.lastIndexOf("|");
            writeNodes(key.slice(0, cut), +key.slice(cut + 1), q[1]);
          })
        );
        say = `preset: ${q[0]}${targets.size > 1 ? ` on ${targets.size} lines` : ""}`;
        return paint();
      }
      if (e.target.closest('[data-c="close"]')) closeCurve();
    });
  }

  /* ---------- zoom: this scene, the whole film, or anything between (Jeremy 2026-10-06) ----------
     "We should be able to zoom that out so we can see the entire film ... or zoom it in to see the current scene.
     But it should also be adjustable at the top." This scene follows the scene the playhead is in; Whole film
     shows everything; the slider (or − and +) sets how many seconds the lanes show, and the window turns the
     page when the playhead runs off it. Panels picked in the storyboard (Shift+click, viewer/scenes.js) fill
     the lanes and make the pie the attention across them. Kept per device in curio-focus-zoom-v1. */
  const ZOOM_KEY = "curio-focus-zoom-v1";
  const MIN_SPAN = 2;
  let zoom = (() => {
    try {
      const z = JSON.parse(localStorage.getItem(ZOOM_KEY) || "null");
      if (z && (z.mode === "scene" || z.mode === "film" || z.mode === "zoom")) return { mode: z.mode, span: +z.span || 0 };
    } catch (e) {}
    return { mode: "scene", span: 0 };
  })();
  let view = { from: 0, span: 1, mode: "", sig: "" };
  const Sc = () => window.CurioScenes;
  function scenesOf() {
    if (Sc()) return Sc().list();
    const r = cache;
    return r ? [{ n: 0, name: "My film", color: "#22d3ee", first: 0, last: r.panels.length - 1, from: 0, to: r.total }] : [];
  }
  function pickedOf(r) {
    const pk = Sc() && Sc().picked();
    return pk && pk.last < r.panels.length ? pk : null;
  }
  /* the pie across picked panels: everyone's share averaged over those panels, a few moments each */
  function sharesAcross(r, pk) {
    const sum = {};
    const info = {};
    let n = 0;
    pk.panels.forEach((i) => {
      const p = r.panels[i];
      if (!p) return;
      [0.15, 0.5, 0.85].forEach((u) => {
        sharesAt(r, p.at + p.sec * u).forEach((q) => {
          sum[q.id] = (sum[q.id] || 0) + q.share;
          info[q.id] = q;
        });
        n++;
      });
    });
    return Object.keys(sum)
      .map((id) => ({ id, label: info[id].label, family: info[id].family, share: sum[id] / Math.max(1, n) }))
      .sort((a, b) => b.share - a.share);
  }
  function saveZoom() {
    try {
      localStorage.setItem(ZOOM_KEY, JSON.stringify(zoom));
    } catch (e) {}
  }
  /* the window the lanes show now; true when it moved (the rows are laid out again) */
  function updateView(r, t) {
    const total = Math.max(0.001, r.total);
    const pk = pickedOf(r);
    let from = 0;
    let span = total;
    let mode = zoom.mode;
    if (pk) {
      mode = "picked";
      from = pk.from;
      span = Math.max(0.25, pk.to - pk.from);
    } else if (zoom.mode === "scene") {
      const sc = Sc() ? Sc().at(t) : null;
      if (sc) {
        from = sc.from;
        span = Math.max(0.25, sc.to - sc.from);
      }
    } else if (zoom.mode === "zoom") {
      span = Math.max(Math.min(MIN_SPAN, total), Math.min(total, zoom.span || total));
      from = view.mode === "zoom" && Math.abs(view.span - span) < 1e-6 ? view.from : t - span / 2;
      /* turn the page when the playhead runs off the window */
      if (t < from - 1e-6 || t > from + span + 1e-6) from = t - span * 0.1;
      from = Math.max(0, Math.min(total - span, from));
    }
    const sig = [mode, from.toFixed(4), span.toFixed(4), r.key.length, pk ? pk.panels.join(",") : ""].join("|");
    if (sig === view.sig) return false;
    view = { from, span, mode, sig };
    return true;
  }
  const clock = (x) => {
    x = Math.max(0, x);
    const m = Math.floor(x / 60);
    const s2 = x - m * 60;
    return `${m}:${s2 < 10 ? "0" : ""}${(Math.round(s2 * 10) / 10).toString()}`;
  };
  /* slider 0 (whole film) to 100 (MIN_SPAN seconds), on a log scale so each step feels the same */
  const spanToSlider = (span, total) => (total <= MIN_SPAN ? 0 : Math.round((100 * Math.log(total / Math.max(MIN_SPAN, Math.min(total, span)))) / Math.log(total / MIN_SPAN)));
  const sliderToSpan = (v, total) => (total <= MIN_SPAN ? total : total * Math.pow(MIN_SPAN / total, Math.max(0, Math.min(100, v)) / 100));
  function zoomBar(r) {
    return `<div class="cf-zoom" role="toolbar" aria-label="How much of the film the lanes show">
        <span class="cf-zseg"><button type="button" data-cf-zoom="scene" title="Show the scene the playhead is in; it follows the playhead into the next scene">This scene</button><button type="button" data-cf-zoom="film" title="Show every scene of the film at once">Whole film</button></span>
        <label class="cf-zlab" title="Zoom in or out: from the whole film to a couple of seconds"><button type="button" data-cf-zoom="out" title="Zoom out" aria-label="Zoom out">−</button><input type="range" class="cf-zr" min="0" max="100" step="1" value="${spanToSlider(view.span, r.total)}" aria-label="Zoom"><button type="button" data-cf-zoom="in" title="Zoom in" aria-label="Zoom in">+</button></label>
        <span class="cf-zwhat" aria-live="polite"></span>
        <button type="button" class="cf-zunpick" data-cf-zoom="unpick" title="Back to one panel" hidden>✕ Unpick</button>
      </div>`;
  }
  /* the words and buttons of the zoom bar follow the window */
  function zoomState(r) {
    const z = box && box.querySelector(".cf-zoom");
    if (!z) return;
    const pk = pickedOf(r);
    z.querySelectorAll("[data-cf-zoom=scene],[data-cf-zoom=film]").forEach((b) => b.setAttribute("aria-pressed", String(!pk && zoom.mode === b.dataset.cfZoom)));
    const rng = z.querySelector(".cf-zr");
    if (rng && document.activeElement !== rng) rng.value = spanToSlider(view.span, r.total);
    const un = z.querySelector(".cf-zunpick");
    if (un) un.hidden = !pk;
    const L = scenesOf();
    const inView = L.filter((sc) => sc.to > view.from + 1e-6 && sc.from < view.from + view.span - 1e-6);
    let what = `${clock(view.from)} to ${clock(view.from + view.span)}`;
    if (pk) what = `Picked panels ${pk.first + 1} to ${pk.last + 1} · ${what} · the pie is the attention across them`;
    else if (inView.length === 1) what += ` · ${Sc() ? Sc().label(inView[0]) : inView[0].name} (of ${L.length})`;
    else if (inView.length > 1) what += ` · scenes ${inView[0].n + 1} to ${inView[inView.length - 1].n + 1} of ${L.length}`;
    const w = z.querySelector(".cf-zwhat");
    if (w && w.textContent !== what) w.textContent = what;
    box.dataset.zoom = pk ? "picked" : view.mode;
  }
  function sceneBlocks() {
    return scenesOf()
      .map((sc) => `<button type="button" class="cf-scb" data-cf-at="${sc.from}" data-cf-scene="${sc.n}" style="left:${pct(sc.from)};width:${pw(sc.to - sc.from)};background:${sc.color}" title="${esc(`Scene ${sc.n + 1}: ${sc.name}. Click to show just this scene.`)}" aria-label="${esc(`Scene ${sc.n + 1}: ${sc.name}`)}">${esc(sc.name)}</button>`)
      .join("");
  }
  /* the window moved: lay out the moments, the graph and the lanes again, keeping the zoom bar (and a slider
     being dragged) and where the lanes are scrolled */
  function relayout(r) {
    if (!box) return;
    const rows = box.querySelector(".cf-rows");
    if (rows) rows.innerHTML = momentsHtml(r);
    const g = box.querySelector(".cf-graph");
    if (g) g.innerHTML = graphHtml(r);
    const ln = box.querySelector(".cf-lanes");
    if (ln) {
      const top = ln.scrollTop;
      ln.innerHTML = lanesHtml(r);
      ln.scrollTop = top;
    }
    lastNow = "";
  }
  function setZoom(mode, span) {
    zoom = { mode, span: span || zoom.span || 0 };
    saveZoom();
    if (Sc() && Sc().picked()) Sc().clear();
    view.sig = "";
    V().redraw();
  }

  /* ---------- the tabs ---------- */
  const TAB_KEY = "curio-focus-tab-v1";
  function savedTab() {
    try {
      const t = localStorage.getItem(TAB_KEY);
      return t === "moments" || t === "lanes" ? t : "focus";
    } catch (e) {
      return "focus";
    }
  }
  function setTab(t) {
    if (!box) return;
    box.dataset.tab = t === "moments" || t === "lanes" ? t : "focus";
    const root = box.closest(".cv-root");
    if (root && root.classList.contains("cf-big") !== (box.dataset.tab === "lanes")) {
      root.classList.toggle("cf-big", box.dataset.tab === "lanes");
      setTimeout(() => V().redraw(), 0);
    }
    box.querySelectorAll("[data-cf-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.cfTab === box.dataset.tab)));
  }

  /* ---------- drawing ---------- */
  let box = null;
  let lastNow = "";
  /* every lane, row and graph is drawn through the zoom window (view): pct for a place, pw for a width */
  const fx = (x) => (x - view.from) / Math.max(0.001, view.span);
  const pct = (x) => (fx(x) * 100).toFixed(3) + "%";
  const pw = (d) => ((d / Math.max(0.001, view.span)) * 100).toFixed(3) + "%";
  function block(from, to, total, label, family, title, row) {
    const mk = M().mark(family);
    return `<button type="button" data-cf-at="${from}" style="left:${pct(from, total)};width:${pw(to - from)};background:${mk.color};color:${mk.ink}" title="${esc(title)}" aria-label="${esc(row + ": " + label + ", " + mk.label)}">${esc(label)}</button>`;
  }
  function momentsHtml(r) {
    const total = r.total;
    const lead = r.segs.map((s) => block(s.from, s.to, total, s.label, s.family, `${s.label} (${M().mark(s.family).label}) holds attention for ${s.dur} s. Click to go there.`, "Leading")).join("");
    const second = r.panels
      .filter((p) => p.second)
      .map((p) => block(p.at, p.at + p.sec, total, p.second.label, p.second.family, `${p.second.label} (${M().mark(p.second.family).label}) also changes in panel ${p.i + 1}.`, "With it"))
      .join("");
    /* suites: neighbouring panels with the same suite are one block */
    const runs = [];
    r.panels.forEach((p) => {
      const last = runs[runs.length - 1];
      if (p.suite && last && last.id === p.suite.id && last.to === p.at) last.to = p.at + p.sec;
      else if (p.suite) runs.push({ id: p.suite.id, label: p.suite.label, from: p.at, to: p.at + p.sec, share: p.suite.share });
    });
    const suite = runs
      .map((s) => `<button type="button" data-cf-at="${s.from}" style="left:${pct(s.from, total)};width:${pw(s.to - s.from)};background:#6d28d9;color:#fff" title="${esc(`Suite: ${s.label}, ${Math.round(s.share * 100)}% of its lenses are on. Click to go there.`)}">${esc(s.label)}</button>`)
      .join("");
    const bolts = r.panels
      .filter((p) => p.trigger)
      .map((p) => `<i class="cf-bolt" style="left:${pct(p.at, total)}" title="${esc(`Set off by a spark: ${p.trigger.when}`)}">⚡</i>`)
      .join("");
    return `<span>Scene</span><div class="cf-row cf-thin cf-scene">${sceneBlocks()}</div>
          <span>Leading</span><div class="cf-row cf-lead">${lead}${bolts}</div>
          <span>With it</span><div class="cf-row cf-thin cf-second">${second}</div>
          <span>Suite</span><div class="cf-row cf-thin cf-suite">${suite || ""}</div>
          <i class="cf-head"></i>`;
  }
  function build() {
    const v = V();
    const el = v && v.under && v.under();
    if (!el) return;
    const r = read();
    if (!r) {
      /* the momentum files load after the Viewer: try again shortly */
      el.hidden = true;
      clearTimeout(build.retry);
      build.retry = setTimeout(() => V().isOpen() && V().redraw(), 400);
      return;
    }
    box = el;
    style();
    const tab = box.dataset.tab || savedTab();
    el.innerHTML = `<div class="cf-top"><b title="Usually only one or two curiosities at a time move the plot forward and hold the audience's attention. This lane shows which, moment by moment.">Front and center</b><nav class="cf-tabs" role="tablist"><button type="button" role="tab" data-cf-tab="focus" title="The things holding the audience's attention now, the pie, and the graph through the scene">Viewer focus</button><button type="button" role="tab" data-cf-tab="moments" title="Who leads, moment by moment, as colored blocks. Pick one to read it in full.">Moments</button><button type="button" role="tab" data-cf-tab="lanes" title="A lane for every curiosity and suite in your film, panel by panel. Drag a dot up or down to change it.">Automation lanes</button></nav><strong class="cf-force" aria-live="polite" title="The force driving the scene and the plot forward right now"></strong></div>
      ${zoomBar(r)}
      <div class="cf-pane cf-pane-focus">
        <p class="cf-focus" aria-live="polite" title="What holds the audience's attention in this panel: 2 things, or 3 in a busy scene"></p>
        <div class="cf-charts" title="How much the app thinks the audience's attention is on each curiosity right now (the pie), through the scene (the graph), and every one on now (the list).">
          <canvas class="cf-pie" role="img" aria-label="Attention right now: click a color to pick its lane in the graph" title="Click a color to pick that curiosity's lane in the graph"></canvas>
          <div class="cf-graph cf-ln-track${picked ? " cf-picked" : ""}" role="img" aria-label="The top curiosities through the scene: drag a node to change that panel">${graphHtml(r)}</div>
          <ol class="cf-list" aria-label="Every curiosity on right now, by share of attention"></ol>
        </div>
      </div>
      <div class="cf-pane cf-pane-moments">
        <div class="cf-rows">${momentsHtml(r)}</div>
        <div class="cf-mag" title="The block you point at or pick, in full; otherwise what is in front now"><p class="cf-pick" aria-live="polite"></p><span class="cf-now" aria-live="polite"></span></div>
      </div>
      <div class="cf-pane cf-pane-lanes">
        <p class="cf-lanes-hint">The things holding attention come first; scroll for every other curiosity and suite. Drag a dot up or down to change that panel.</p>
        <div class="cf-lanes">${lanesHtml(r)}</div>
      </div>
      <i class="cf-grip cf-grip-l" data-cf-grip="l" title="Drag to widen Front and center over the left panel; double-click to put it back"></i><i class="cf-grip cf-grip-r" data-cf-grip="r" title="Drag to widen Front and center over the right panel; double-click to put it back"></i>`;
    applyOut();
    setTab(tab);
    el.hidden = false;
    labelCards(r);
    lastNow = "";
  }
  function now(t, i, total) {
    if (!box || !box.isConnected) return;
    const r = read();
    if (!r) return;
    if (r.key !== box.dataset.key) {
      build();
      box.dataset.key = r.key;
    }
    const head = box.querySelector(".cf-head");
    const rows = box.querySelector(".cf-rows");
    if (head && rows) {
      const lane = box.querySelector(".cf-lead");
      const u = fx(Math.max(0, Math.min(total, t)));
      head.style.left = lane.offsetLeft + lane.offsetWidth * u + "px";
      head.style.display = u < -1e-6 || u > 1 + 1e-6 ? "none" : "";
    }
    const tu = fx(Math.max(0, Math.min(total, t)));
    box.querySelectorAll(".cf-ln-head").forEach((h) => {
      h.style.left = (tu * 100).toFixed(3) + "%";
      h.style.display = tu < -1e-6 || tu > 1 + 1e-6 ? "none" : "";
    });
    const p = r.panels[i];
    if (!p) return;
    const seg = r.segs.find((s) => t >= s.from - 1e-6 && t < s.to) || null;
    const sig = [i, seg && seg.from].join("|");
    if (sig === lastNow) return;
    lastNow = sig;
    const sw = (fam) => `<i class="cf-sw" style="background:${M().mark(fam).color}"></i>`;
    let html = "";
    if (p.lead) {
      const st = M().status ? M().status(seg ? seg.dur : 0, r.limit) : null;
      html += `${sw(p.lead.family)}<strong>${esc(p.lead.label)}</strong> <em>(${esc(M().mark(p.lead.family).label)}${st ? `, held ${seg ? seg.dur : 0} s, ${st.icon} ${st.words}` : ""})</em>`;
    }
    if (p.second) html += ` with ${sw(p.second.family)}${esc(p.second.label)}`;
    if (p.trigger) html += ` <span class="cf-trig">⚡ ${esc(whoLabel(p.trigger.who))} was set off by a spark: ${esc(p.trigger.when)}${p.trigger.from < i ? ` (panel ${p.trigger.from + 1})` : ""}</span>`;
    if (p.suite) html += ` <em>· suite</em> ${esc(p.suite.label)} <em>${Math.round(p.suite.share * 100)}%</em>`;
    const fa = focusAt(r, i);
    const fe = box.querySelector(".cf-force");
    if (fe) fe.textContent = fa.force;
    const fo = box.querySelector(".cf-focus");
    if (fo) fo.textContent = fa.focus.join(" + ");
    const line = box.querySelector(".cf-now");
    if (line) {
      line.innerHTML = html || "<em>Nothing has changed yet.</em>";
      line.title = line.textContent;
    }
  }
  /* the pie, the graph and the list follow the playhead every frame */
  function charts(t) {
    const r = read();
    if (!r || !box) return;
    /* each lane's playhead dot rides the line, curves and all: the value the lane plays at this moment */
    box.querySelectorAll(".cf-ln-play").forEach((d) => {
      if (!d.offsetParent) return;
      const q = valueAt(r, d.dataset.play, t);
      if (!q) return void (d.style.display = "none");
      const u = fx(Math.max(0, Math.min(r.total, t)));
      d.style.display = u < -1e-6 || u > 1 + 1e-6 ? "none" : "";
      d.style.left = (u * 100).toFixed(3) + "%";
      d.style.top = ((1 - q.y) * 100).toFixed(2) + "%";
      d.title = "Now: " + (typeof q.value === "number" ? +q.value.toFixed(2) : q.value);
    });
    const pk = pickedOf(r);
    const sh = pk ? sharesAcross(r, pk) : sharesAt(r, t);
    const cols = colorsFor([...new Set([...r.top, ...sh.map((q) => q.id)])]);
    const pie = box.querySelector(".cf-pie");
    if (pie) pie.classList.toggle("cf-across", !!pk);
    if (pie && pie.offsetParent) drawPie(pie, sh, cols);
    const list = box.querySelector(".cf-list");
    if (list) {
      const sig = (pk ? pk.first + "-" + pk.last + ":" : "") + sh.map((q) => q.id + Math.round(q.share * 100)).join(",");
      if (list.dataset.sig !== sig) {
        list.dataset.sig = sig;
        list.innerHTML = sh.map((q) => `<li data-g="${esc(q.id)}" class="${q.id === picked ? "on" : ""}" title="${esc(q.label)}: ${Math.round(q.share * 100)}% of attention. Click to pick its lane in the graph."><i style="background:${cols[q.id]}"></i><span>${esc(q.label)}</span><b>${Math.round(q.share * 100)}%</b></li>`).join("");
      }
    }
  }

  function wire() {
    const v = V();
    if (!v || !v.onDraw) return setTimeout(wire, 300);
    v.onChange(() => {
      cache = null;
    });
    v.onDraw((t, i, total) => {
      const el = v.under && v.under();
      if (!el) return;
      const r = read();
      const moved = r ? updateView(r, t) : false;
      if (el !== box || !el.firstChild || el.hidden) {
        build();
        if (box) box.dataset.key = (read() || {}).key || "";
      } else if (moved && r && r.key === box.dataset.key) relayout(r);
      now(t, i, total);
      if (r) zoomState(r);
      charts(t);
      cover();
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest(".cv-under [data-cf-at]");
      if (b) {
        showName(b);
        V().seek(+b.dataset.cfAt);
      }
      const z = e.target.closest && e.target.closest(".cv-under [data-cf-zoom]");
      if (z) {
        const r = read();
        const k = z.dataset.cfZoom;
        if (k === "unpick") return Sc() && Sc().clear();
        if (k === "scene" || k === "film") return setZoom(k);
        if (r && (k === "in" || k === "out")) {
          const v0 = spanToSlider(view.span, r.total);
          return setZoom("zoom", sliderToSpan(v0 + (k === "in" ? 15 : -15), r.total));
        }
      }
      const sb = e.target.closest && e.target.closest(".cv-under [data-cf-scene]");
      if (sb && !pickedOf(read() || { panels: [] })) setZoom("scene");
      const c = e.target.closest && e.target.closest(".cv-under [data-cf-tab]");
      if (c && box) {
        setTab(c.dataset.cfTab);
        try {
          localStorage.setItem(TAB_KEY, c.dataset.cfTab);
        } catch (err) {}
        V().redraw();
      }
    });
    /* Ctrl+click (or right-click) a line between two nodes: the curve window */
    const segAt = (e) => e.target.closest && e.target.closest(".cv-under .cf-seg");
    document.addEventListener("dblclick", (e) => {
      const sg = segAt(e);
      if (sg) openCurve(sg, e);
    });
    v.onChange(() => cpop && cpop.paint && setTimeout(() => cpop && cpop.paint(), 0));
    /* the window follows the selected panel and undo */
    let winSig = "";
    v.onDraw(() => {
      if (!cwin) return;
      const live = V().live();
      const sig = live.cur + "|" + JSON.stringify(live.panel && live.panel.v) + "|" + (read() || {}).key;
      if (sig === winSig || (document.activeElement && cwin.contains(document.activeElement) && document.activeElement.type === "range")) return;
      winSig = sig;
      drawWin();
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest(".cv-under [data-cwin]");
      if (b) openWin(b.dataset.cwin, b);
      const sc = e.target.closest && e.target.closest('.cf-swin [data-sw="close"]');
      if (sc) closeSearch();
    });
    document.addEventListener("contextmenu", (e) => {
      const sg = segAt(e);
      if (!sg) return;
      e.preventDefault();
      openCurve(sg, e);
    });
    document.addEventListener("pointerdown", (e) => {
      if (cpop && !cpop.contains(e.target) && !segAt(e)) closeCurve();
    }, true);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (cpop) return closeCurve();
      if (swin) return closeSearch();
      if (cwin) closeWin();
    });
    /* a color in the pie or a row in the list picks that curiosity's lane in the graph */
    document.addEventListener("click", (e) => {
      const sg = segAt(e);
      if (sg && (e.ctrlKey || e.metaKey)) return openCurve(sg, e);
      if (sg) return selectSeg(sg.dataset.ln, +sg.dataset.seg, e.shiftKey);
      const pie = e.target.closest && e.target.closest(".cv-under .cf-pie");
      if (pie) {
        const id = pieHit(pie, e);
        if (id) pick(id);
        return;
      }
      const li = e.target.closest && e.target.closest(".cv-under .cf-list li[data-g]");
      if (li) pick(li.dataset.g);
    });
    document.addEventListener("pointerdown", (e) => {
      const d = e.target.closest && e.target.closest(".cv-under .cf-ln-dot");
      if (d) return laneDrag(e, d);
      const g = e.target.closest && e.target.closest(".cv-under [data-cf-grip]");
      if (g) gripDrag(e, g);
    });
    window.addEventListener("resize", () => applyOut());
    document.addEventListener("input", (e) => {
      const rng = e.target.closest && e.target.closest(".cv-under .cf-zr");
      const r = rng && read();
      if (r) setZoom(+rng.value <= 0 ? "film" : "zoom", sliderToSpan(+rng.value, r.total));
    });
    document.addEventListener("dblclick", (e) => {
      const g = e.target.closest && e.target.closest(".cv-under [data-cf-grip]");
      if (!g) return;
      out[g.dataset.cfGrip] = 0;
      applyOut();
      try {
        localStorage.setItem(OUT_KEY, JSON.stringify(out));
      } catch (err) {}
      V().redraw();
    });
    /* the block you point at or pick reads in full at the top of Moments */
    const showName = (b) => {
      const n = box && box.querySelector(".cf-pick");
      if (n) n.textContent = b.getAttribute("title") || b.getAttribute("aria-label") || b.textContent;
    };
    document.addEventListener("pointerover", (e) => {
      const b = e.target.closest && e.target.closest(".cv-under [data-cf-at]");
      if (b) showName(b);
    });
    document.addEventListener("focusin", (e) => {
      const b = e.target.closest && e.target.closest(".cv-under [data-cf-at]");
      if (b) showName(b);
    });
    try {
      v.redraw && v.isOpen() && v.redraw();
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioFocusLane = {
    read: () => {
      cache = null;
      const r = read();
      return r && r.panels.map((p) => ({ panel: p.i + 1, lead: p.lead && p.lead.label, leadId: p.lead && p.lead.id, fresh: !!(p.lead && p.lead.fresh), second: p.second && p.second.label, secondId: p.second && p.second.id, suite: p.suite && p.suite.label, trigger: p.trigger && p.trigger.when }));
    },
    values: (i) => valuesOf(V().film(), i),
    /* the force driving panel i (its title) and the 2 or 3 things holding attention (its label) */
    panel: (i) => {
      const r = read();
      return r ? focusAt(r, i) : null;
    },
    /* the lane picked in the graph (from the pie or the list), or null */
    picked: () => picked,
    /* a curiosity's window (⧉ at the end of its lane) and its search window */
    openWindow: (id) => openWin(id, document.querySelector(`.cv-under [data-cwin="${window.CSS.escape(id)}"]`)),
    closeWindow: closeWin,
    /* the curve between two nodes (the Curve window's maths), and where a lane is at time t: what the lanes play */
    curve: { eval: curveEval, PRESETS: PRESETS.map((q) => ({ name: q[0], nodes: q[1] })), place: placeNode, add: addNode, remove: removeNode, describe, limits: CURVE },
    valueAt: (id, t) => {
      const r = read();
      return r ? valueAt(r, id, t) : null;
    },
    pick: (id) => (pick(id), picked),
  };
})();
