/* viewer/focus-lane.js: "Front and center", the lane under the Viewer's picture (Jeremy, 2026-10-04 18:55Z):
   usually only one or two curiosities at a time move the plot forward and hold the audience's attention. This
   lane always shows which ones, moment by moment, and the suite they make up when one is there. When the one in
   front was set off by something else (a proximity: a curiosity or suite triggered by another), it says by what.

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
.cf-ln { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 6px; align-items: center; }
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
/* the curve window (Ctrl+click a line): the music app's slide window, as in the Screen's curves pop-up */
.cf-cpop { position: fixed; z-index: 2147483000; width: 300px; background: #1b1b1f; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); padding: 8px 10px 10px; font: 12px/1.35 system-ui, sans-serif; display: grid; gap: 7px; }
.cf-cpop header { display: flex; align-items: center; gap: 6px; }
.cf-cpop header b { flex: 1; font-size: 12.5px; }
.cf-cpop button { font: inherit; background: #26262b; color: #e6e6ea; border: 1px solid #3a3a42; border-radius: 5px; padding: 3px 7px; cursor: pointer; }
.cf-cpop button.on { background: #22d3ee; color: #062a31; border-color: #22d3ee; font-weight: 600; }
.cf-cpop .cf-cshapes { display: flex; flex-wrap: wrap; gap: 4px; }
.cf-cpop canvas { width: 100%; height: 140px; background: #111114; border-radius: 5px; touch-action: none; cursor: crosshair; display: block; }
.cf-cpop label { display: flex; align-items: center; gap: 8px; }
.cf-cpop label input { flex: 1; }
.cf-cpop .cf-cdo { display: flex; gap: 6px; justify-content: flex-end; }
.cf-cpop small { color: #9b9ba3; }
/* Automation lanes, big (Jeremy 2026-10-05): stacked like tracks in Ableton Live, the top 4 in view, the rest a
   two-finger scroll away; the storyboards shrink while this tab is open so the lanes sit large and in front */
.cv-root.cf-big .cf-lanes { max-height: 196px; overscroll-behavior: contain; gap: 2px; }
.cv-root.cf-big .cf-ln { grid-template-columns: 170px minmax(0, 1fr); background: #18181b; border-radius: 4px; padding: 2px 4px 2px 0; border-left: 4px solid var(--ln-c, #444); }
.cv-root.cf-big .cf-ln-track { height: 42px; }
.cv-root.cf-big .cf-ln.cf-ln-suite .cf-ln-track { height: 30px; }
.cv-root.cf-big .cf-ln-name { padding-left: 6px; font-size: 12px; }
.cv-root.cf-big .cv-under { height: auto !important; }
.cv-root.cf-big .cv-strip { height: auto !important; padding-top: 2px; padding-bottom: 4px; }
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
.cv-root .cv-things { padding-bottom: var(--cf-cover-l, 0px); }
.cv-root .cv-details .cv-body { padding-bottom: var(--cf-cover-r, 0px); }
@media (max-width: 900px) { .cf-grip { display: none; } .cv-under[data-out] { margin: 0; } .cf-ln { grid-template-columns: 100px minmax(0, 1fr); } }
.cf-pane-moments { grid-template-columns: minmax(0, 1fr) minmax(180px, 280px); align-items: start; gap: 8px; }
.cf-mag { background: #1d1d21; border: 1px solid #2e2e33; border-radius: 6px; padding: 6px 8px; max-height: 96px; overflow-y: auto; display: grid; gap: 4px; font-size: 11.5px; line-height: 1.35; }
.cf-mag .cf-now { display: block; overflow: visible; -webkit-line-clamp: unset; }
@media (max-width: 900px) { .cf-pane-moments { grid-template-columns: minmax(0, 1fr); } }
.cf-pick { margin: 0; font-size: 12px; font-weight: 600; color: #fff; line-height: 1.35; }
.cf-pick:empty { display: none; }
@media (max-width: 900px) { .cf-charts { grid-template-columns: 64px minmax(0, 1fr); } .cf-list { grid-column: 1 / -1; height: auto; max-height: 90px; } }
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
  /* the line between two nodes: a step at the panel edge, unless it was given a curve (Ctrl+click the line) */
  const SHAPES = {
    straight: ["Straight", "An even line from node to node."],
    smooth: ["Smooth", "Eases out of the first node and into the next; more bend, a stronger S."],
    slowStart: ["Slow start", "Starts gently and speeds up into the next node."],
    fastStart: ["Fast start", "Leaps away from the first node, then settles into the next."],
    overshoot: ["Overshoot", "Goes past the next node's setting, then settles back."],
    jumpEarly: ["Jump early", "Jumps to the next node's setting right away and holds it."],
    jumpLate: ["Jump late", "Holds the first node's setting, then jumps at the last moment."],
    draw: ["Draw your own", "The line you draw in the box."],
  };
  function shapeAt(c, t) {
    const E = window.CurioEngine;
    if (c.shape === "draw") {
      const pts = c.pts || [];
      if (pts.length < 2) return t;
      const x = t * (pts.length - 1);
      const k = Math.min(pts.length - 2, Math.floor(x));
      return pts[k] + (pts[k + 1] - pts[k]) * (x - k);
    }
    if (E && typeof E.shapeAt === "function") return E.shapeAt(c.shape, c.bend, t);
    const k = 1 + 4 * Math.max(0, Math.min(1, (Number(c.bend) || 0) / 100));
    if (c.shape === "smooth") return t < 0.5 ? 0.5 * Math.pow(2 * t, k) : 1 - 0.5 * Math.pow(2 - 2 * t, k);
    if (c.shape === "slowStart") return Math.pow(t, k);
    if (c.shape === "fastStart") return 1 - Math.pow(1 - t, k);
    if (c.shape === "overshoot") return 1 - Math.pow(1 - t, 2) + ((k - 1) / 4) * 0.35 * Math.sin(Math.PI * t);
    if (c.shape === "jumpEarly") return t > 0 ? 1 : 0;
    if (c.shape === "jumpLate") return t < 1 ? 0 : 1;
    return t;
  }
  const curveOf = (r, i, id) => (r.curves && r.curves[i] && r.curves[i][id]) || null;
  /* one curiosity's lane: a line through its value in each panel, a node per panel (draggable when it can be set here) */
  function laneParts(r, id, color) {
    const total = r.total;
    const n = M().note(base(id));
    const vals = r.K.map((k) => k[id]);
    const sc = scaleOf(id, vals);
    const where = READ_FROM_PICTURE[id];
    const edit = !where && !sc.loose;
    const col = color || M().mark(n.family).color;
    const X = (sec) => ((sec / total) * 1000).toFixed(1);
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
          for (let s2 = 1; s2 <= 32; s2++) {
            const t = s2 / 32;
            const Y = c.shape === "draw" ? (1 - shapeAt(c, t)) * 100 : A.Y + (B.Y - A.Y) * shapeAt(c, t);
            seg += `L${X(A.x + (B.x - A.x) * t)},${Y.toFixed(1)} `;
          }
        } else {
          const e = r.panels[B.i].at;
          seg = `L${X(e)},${A.Y.toFixed(1)} L${X(e)},${B.Y.toFixed(1)} L${X(B.x)},${B.Y.toFixed(1)} `;
        }
        path += seg;
        hits.push(`<path class="cf-seg" d="M${X(A.x)},${A.Y.toFixed(1)} ${seg}" data-ln="${esc(id)}" data-seg="${A.i}" data-to="${B.i}"><title>${esc(`${n.label}: the line from panel ${A.i + 1} to ${B.i + 1}${c ? " (" + SHAPES[c.shape][0] + ")" : ""}. Ctrl+click to give it a curve.`)}</title></path>`);
      });
    }
    const svg = `<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>${hits.join("")}</svg>`;
    return { n, sc, where, edit, svg, dots };
  }
  const sepsOf = (r) => r.panels.map((p) => `<i class="cf-ln-sep" style="left:${pct(p.at, r.total)}"></i>`).join("");
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
        return `<div class="cf-g${picked === base(id) ? " on" : ""}" data-g="${esc(base(id))}">${q.svg}${q.dots}</div>`;
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
    const rows = laneIds(r).map((id) => {
      const { n, sc, where, edit, svg, dots } = laneParts(r, id);
      const tip = edit ? "Drag a dot up or down to change that panel" : where ? `Read from the picture: change it in ${where}` : "Set in the panels themselves";
      return `<div class="cf-ln${edit ? " cf-ln-edit" : ""}" data-ln="${esc(id)}" style="--ln-c:${M().mark(n.family).color}"><span class="cf-ln-name" title="${esc(n.label + ". " + tip)}"><b>${esc(laneName(id, n))}</b><small>${esc(edit ? (sc.list ? sc.list[0] + " to " + sc.list[sc.list.length - 1] : sc.lo + " to " + sc.hi) : tip)}</small></span><div class="cf-ln-track">${seps}<div class="cf-ln-in">${svg}${dots}</div><i class="cf-ln-head"></i></div></div>`;
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
        const x0 = (p.at / total) * 1000;
        const x1 = ((p.at + p.sec) / total) * 1000;
        path += `${path ? "L" : "M"}${x0.toFixed(1)},${((1 - y) * 100).toFixed(1)} L${x1.toFixed(1)},${((1 - y) * 100).toFixed(1)} `;
      });
      rows.push(`<div class="cf-ln cf-ln-suite" data-ln-suite="${esc(sid)}"><span class="cf-ln-name" title="${esc("Suite: " + su.label + ". How much of it is on in each panel; it follows its curiosities.")}"><b>Suite: ${esc(su.label)}</b><small>how much of it is on</small></span><div class="cf-ln-track">${seps}<div class="cf-ln-in"><svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="#a78bfa" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div><i class="cf-ln-head"></i></div></div>`);
    });
    return rows.join("") || `<p class="cf-lanes-hint">Nothing is set yet.</p>`;
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
    /* the side panel it covers gets room at the bottom, so everything in it can still scroll up into view */
    const root = box.closest(".cv-root");
    if (!root) return;
    const top = box.getBoundingClientRect().top;
    [["l", L, ".cv-things"], ["r", R, ".cv-details .cv-body"]].forEach(([side, w, q]) => {
      const el = root.querySelector(q);
      const cover = w && el ? Math.max(0, Math.round(el.getBoundingClientRect().bottom - top)) : 0;
      root.style.setProperty("--cf-cover-" + side, cover + "px");
    });
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

  /* ---------- the curve window: Ctrl+click a line between two nodes (Jeremy 2026-10-05) ----------
     Pick a shape and a bend, or draw your own line in the box; Apply keeps it on the panel the line leaves
     (panel.curves[curiosity]) as one undo step. */
  let cpop = null;
  function closeCurve() {
    if (cpop) cpop.remove();
    cpop = null;
  }
  function openCurve(seg, ev) {
    closeCurve();
    const r = read();
    if (!r) return;
    const id = seg.dataset.ln;
    const i = +seg.dataset.seg;
    const j = +seg.dataset.to;
    const sc = scaleOf(id, r.K.map((k) => k[id]));
    const yA = yOf(sc, r.K[i][id]);
    const yB = yOf(sc, r.K[j][id]);
    const had = curveOf(r, i, id);
    const c = had ? JSON.parse(JSON.stringify(had)) : { shape: "smooth", bend: 40 };
    const label = laneName(id, M().note(base(id)));
    cpop = document.createElement("div");
    cpop.className = "cf-cpop";
    cpop.setAttribute("role", "dialog");
    cpop.innerHTML = `<header><b>Curve: ${esc(label)}, panel ${i + 1} to ${j + 1}</b><button type="button" data-c="close" title="Close" aria-label="Close">✕</button></header>
      <div class="cf-cshapes">${Object.keys(SHAPES)
        .map((k) => `<button type="button" data-shape="${k}" title="${esc(SHAPES[k][1])}">${esc(SHAPES[k][0])}</button>`)
        .join("")}</div>
      <canvas aria-label="The line from one node to the next: draw in it to make your own"></canvas>
      <label>Bend <input type="range" min="0" max="100" step="1" data-c="bend"></label>
      <small>Draw in the box with your finger or the mouse to make your own curve.</small>
      <div class="cf-cdo"><button type="button" data-c="step" title="Take the curve off: hold, then step at the panel's edge">No curve</button><button type="button" data-c="apply" class="on">Apply</button></div>`;
    document.body.appendChild(cpop);
    const cv = cpop.querySelector("canvas");
    const bend = cpop.querySelector('[data-c="bend"]');
    const W = 280;
    const H = 140;
    const pad = 12;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext("2d");
    const yAt = (t) => (c.shape === "draw" ? shapeAt(c, t) : yA + (yB - yA) * shapeAt(c, t));
    const px = (t, y) => [pad + t * (W - 2 * pad), pad + (1 - y) * (H - 2 * pad)];
    function paint() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.strokeStyle = "#26262c";
      g.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        const y = pad + (k / 4) * (H - 2 * pad);
        g.beginPath();
        g.moveTo(pad, y);
        g.lineTo(W - pad, y);
        g.stroke();
      }
      g.strokeStyle = "#22d3ee";
      g.lineWidth = 2.5;
      g.beginPath();
      for (let k = 0; k <= 64; k++) {
        const [x, y] = px(k / 64, yAt(k / 64));
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      [[0, yA], [1, yB]].forEach(([t, y]) => {
        const [x, yy] = px(t, y);
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(x, yy, 5, 0, Math.PI * 2);
        g.fill();
      });
      cpop.querySelectorAll("[data-shape]").forEach((b) => b.classList.toggle("on", b.dataset.shape === c.shape));
      bend.value = c.bend == null ? 40 : c.bend;
      bend.disabled = !/smooth|slowStart|fastStart|overshoot/.test(c.shape);
    }
    paint();
    const b = seg.getBoundingClientRect();
    const x = Math.max(8, Math.min(innerWidth - 310, (ev ? ev.clientX : b.left) - 150));
    const top = (ev ? ev.clientY : b.top) - cpop.offsetHeight - 12;
    cpop.style.left = x + "px";
    cpop.style.top = Math.max(8, top < 8 ? (ev ? ev.clientY : b.bottom) + 12 : top) + "px";
    cpop.addEventListener("click", (e) => {
      const sh = e.target.closest("[data-shape]");
      if (sh) {
        c.shape = sh.dataset.shape;
        if (c.shape === "draw" && !(c.pts && c.pts.length)) c.pts = Array.from({ length: 33 }, (_, k) => yA + ((yB - yA) * k) / 32);
        return paint();
      }
      const d = e.target.closest("[data-c]");
      if (!d) return;
      if (d.dataset.c === "close") return closeCurve();
      if (d.dataset.c === "apply" || d.dataset.c === "step") {
        V().remember("curve-" + id + "-" + i);
        const p = V().live().film.panels[i];
        const all = Object.assign({}, p.curves || {});
        if (d.dataset.c === "step") delete all[id];
        else {
          if (c.shape === "draw") {
            c.pts[0] = yA;
            c.pts[c.pts.length - 1] = yB;
          } else delete c.pts;
          all[id] = c;
        }
        if (Object.keys(all).length) p.curves = all;
        else delete p.curves;
        cache = null;
        V().changed(true);
        closeCurve();
      }
    });
    bend.addEventListener("input", () => {
      c.bend = +bend.value;
      paint();
    });
    /* draw your own: each point you pass sets the line there */
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      if (c.shape !== "draw") {
        const pts = Array.from({ length: 33 }, (_, k) => yAt(k / 32));
        c.shape = "draw";
        c.pts = pts;
      }
      let last = null;
      const at = (ev2) => {
        const bb = cv.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (((ev2.clientX - bb.left) / bb.width) * W - pad) / (W - 2 * pad)));
        const y = Math.max(0, Math.min(1, 1 - (((ev2.clientY - bb.top) / bb.height) * H - pad) / (H - 2 * pad)));
        const k = Math.round(t * 32);
        if (last) {
          const [k0, y0] = last;
          const n = Math.abs(k - k0);
          for (let q = 0; q <= n; q++) c.pts[k0 + Math.sign(k - k0) * q] = y0 + (y - y0) * (n ? q / n : 1);
        } else c.pts[k] = y;
        last = [k, y];
        paint();
      };
      at(e);
      const move = (ev2) => at(ev2);
      const up = () => {
        cv.removeEventListener("pointermove", move);
        cv.removeEventListener("pointerup", up);
      };
      cv.addEventListener("pointermove", move);
      cv.addEventListener("pointerup", up);
    });
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
  const pct = (x, total) => ((x / Math.max(0.001, total)) * 100).toFixed(3) + "%";
  function block(from, to, total, label, family, title, row) {
    const mk = M().mark(family);
    return `<button type="button" data-cf-at="${from}" style="left:${pct(from, total)};width:${pct(to - from, total)};background:${mk.color};color:${mk.ink}" title="${esc(title)}" aria-label="${esc(row + ": " + label + ", " + mk.label)}">${esc(label)}</button>`;
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
      .map((s) => `<button type="button" data-cf-at="${s.from}" style="left:${pct(s.from, total)};width:${pct(s.to - s.from, total)};background:#6d28d9;color:#fff" title="${esc(`Suite: ${s.label}, ${Math.round(s.share * 100)}% of its lenses are on. Click to go there.`)}">${esc(s.label)}</button>`)
      .join("");
    const bolts = r.panels
      .filter((p) => p.trigger)
      .map((p) => `<i class="cf-bolt" style="left:${pct(p.at, total)}" title="${esc(`Set off by: ${p.trigger.when}`)}">⚡</i>`)
      .join("");
    const tab = box.dataset.tab || savedTab();
    el.innerHTML = `<div class="cf-top"><b title="Usually only one or two curiosities at a time move the plot forward and hold the audience's attention. This lane shows which, moment by moment.">Front and center</b><nav class="cf-tabs" role="tablist"><button type="button" role="tab" data-cf-tab="focus" title="The things holding the audience's attention now, the pie, and the graph through the scene">Viewer focus</button><button type="button" role="tab" data-cf-tab="moments" title="Who leads, moment by moment, as colored blocks. Pick one to read it in full.">Moments</button><button type="button" role="tab" data-cf-tab="lanes" title="A lane for every curiosity and suite in your film, panel by panel. Drag a dot up or down to change it.">Automation lanes</button></nav><strong class="cf-force" aria-live="polite" title="The force driving the scene and the plot forward right now"></strong></div>
      <div class="cf-pane cf-pane-focus">
        <p class="cf-focus" aria-live="polite" title="What holds the audience's attention in this panel: 2 things, or 3 in a busy scene"></p>
        <div class="cf-charts" title="How much the app thinks the audience's attention is on each curiosity right now (the pie), through the scene (the graph), and every one on now (the list).">
          <canvas class="cf-pie" role="img" aria-label="Attention right now: click a color to pick its lane in the graph" title="Click a color to pick that curiosity's lane in the graph"></canvas>
          <div class="cf-graph cf-ln-track${picked ? " cf-picked" : ""}" role="img" aria-label="The top curiosities through the scene: drag a node to change that panel">${graphHtml(r)}</div>
          <ol class="cf-list" aria-label="Every curiosity on right now, by share of attention"></ol>
        </div>
      </div>
      <div class="cf-pane cf-pane-moments">
        <div class="cf-rows">
          <span>Leading</span><div class="cf-row cf-lead">${lead}${bolts}</div>
          <span>With it</span><div class="cf-row cf-thin cf-second">${second}</div>
          <span>Suite</span><div class="cf-row cf-thin cf-suite">${suite || ""}</div>
          <i class="cf-head"></i>
        </div>
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
      const left = lane.offsetLeft + (lane.offsetWidth * Math.max(0, Math.min(total, t))) / Math.max(0.001, total);
      head.style.left = left + "px";
    }
    box.querySelectorAll(".cf-ln-head").forEach((h) => (h.style.left = ((Math.max(0, Math.min(total, t)) / Math.max(0.001, total)) * 100).toFixed(3) + "%"));
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
    if (p.trigger) html += ` <span class="cf-trig">⚡ ${esc(whoLabel(p.trigger.who))} was set off by something else: ${esc(p.trigger.when)}${p.trigger.from < i ? ` (panel ${p.trigger.from + 1})` : ""}</span>`;
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
    const sh = sharesAt(r, t);
    const cols = colorsFor([...new Set([...r.top, ...sh.map((q) => q.id)])]);
    const pie = box.querySelector(".cf-pie");
    if (pie && pie.offsetParent) drawPie(pie, sh, cols);
    const list = box.querySelector(".cf-list");
    if (list) {
      const sig = sh.map((q) => q.id + Math.round(q.share * 100)).join(",");
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
      if (el !== box || !el.firstChild || el.hidden) {
        build();
        if (box) box.dataset.key = (read() || {}).key || "";
      }
      now(t, i, total);
      charts(t);
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest(".cv-under [data-cf-at]");
      if (b) {
        showName(b);
        V().seek(+b.dataset.cfAt);
      }
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
    document.addEventListener("contextmenu", (e) => {
      const sg = segAt(e);
      if (!sg) return;
      e.preventDefault();
      openCurve(sg, e);
    });
    document.addEventListener("pointerdown", (e) => {
      if (cpop && !cpop.contains(e.target) && !segAt(e)) closeCurve();
    }, true);
    document.addEventListener("keydown", (e) => e.key === "Escape" && cpop && closeCurve());
    /* a color in the pie or a row in the list picks that curiosity's lane in the graph */
    document.addEventListener("click", (e) => {
      const sg = segAt(e);
      if (sg && (e.ctrlKey || e.metaKey)) return openCurve(sg, e);
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
    pick: (id) => (pick(id), picked),
  };
})();
