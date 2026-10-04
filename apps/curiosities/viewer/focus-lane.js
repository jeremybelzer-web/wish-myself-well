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
.cf-name { flex: none; max-width: 40%; font-size: 11px; color: #fff; background: #2a2a30; border-radius: 4px; padding: 1px 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-name:empty { display: none; }
.cf-body { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: start; }
.cf-charts { display: grid; grid-template-columns: 58px 150px 150px; gap: 6px; align-items: start; }
.cf-charts canvas { display: block; cursor: zoom-in; background: #1d1d21; border-radius: 4px; }
.cf-pie { width: 58px; height: 58px; border-radius: 50% !important; }
.cf-graph { width: 150px; height: 58px; }
.cf-list { list-style: none; margin: 0; padding: 0; max-height: 58px; overflow-y: auto; font-size: 10.5px; display: grid; gap: 1px; }
.cf-list li { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; gap: 4px; align-items: center; }
.cf-list li i { width: 8px; height: 8px; border-radius: 2px; }
.cf-list li span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cf-list li b { font-weight: 500; color: #9b9ba3; font-variant-numeric: tabular-nums; }
.cv-under[data-only="pie"] .cf-graph, .cv-under[data-only="graph"] .cf-pie { display: none; }
.cv-under[data-only="pie"] .cf-charts { grid-template-columns: 120px 150px; }
.cv-under[data-only="pie"] .cf-pie { width: 120px; height: 120px; cursor: zoom-out; }
.cv-under[data-only="pie"] .cf-list { max-height: 120px; }
.cv-under[data-only="graph"] .cf-charts { grid-template-columns: 300px 150px; }
.cv-under[data-only="graph"] .cf-graph { width: 300px; height: 120px; cursor: zoom-out; }
.cv-under[data-only="graph"] .cf-list { max-height: 120px; }
@media (max-width: 900px) { .cf-body { grid-template-columns: minmax(0, 1fr); } .cf-charts { grid-template-columns: 58px minmax(0, 1fr) minmax(0, 1fr); } .cf-graph { width: 100%; } }
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
    const key = JSON.stringify(film.panels.map((p) => [p.sec, p.cam, p.place, p.words.length, !!p.caption, p.rain, p.v || null, p.id, p.note]));
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
    cache = { key, total, segs, panels, stats: reading.stats, limit: reading.limit };
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
  function drawPie(cv, sh, cols) {
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
  function drawGraph(cv, r, t, cols) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth || 200;
    const H = cv.clientHeight || 60;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const n = r.samples.length;
    const x = (k) => (k / Math.max(1, n - 1)) * W;
    /* stacked: each of the top curiosities is a band; the rest is grey at the top */
    let lower = r.samples.map(() => 0);
    [...r.top, "_rest"].forEach((id) => {
      const upper = r.samples.map((smp, k) => {
        const v = id === "_rest" ? 1 - r.top.reduce((a, t2) => a + ((smp.sh.find((q) => q.id === t2) || {}).share || 0), 0) : (smp.sh.find((q) => q.id === id) || {}).share || 0;
        return lower[k] + Math.max(0, v);
      });
      g.beginPath();
      upper.forEach((v, k) => (k ? g.lineTo(x(k), H - v * H) : g.moveTo(x(k), H - v * H)));
      for (let k = n - 1; k >= 0; k--) g.lineTo(x(k), H - lower[k] * H);
      g.closePath();
      g.fillStyle = id === "_rest" ? "#3a3a40" : cols[id];
      g.fill();
      lower = upper;
    });
    const px = (Math.max(0, Math.min(r.total, t)) / Math.max(0.001, r.total)) * W;
    g.fillStyle = "#fff";
    g.fillRect(px - 1, 0, 2, H);
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
    const was = box.dataset.only || "";
    el.innerHTML = `<div class="cf-top"><b title="Usually only one or two curiosities at a time move the plot forward and hold the audience's attention. This lane shows which, moment by moment.">Front and center</b><span class="cf-now" aria-live="polite"></span><span class="cf-name" aria-live="polite"></span></div>
      <div class="cf-body">
      <div class="cf-rows">
        <span>Leading</span><div class="cf-row cf-lead">${lead}${bolts}</div>
        <span>With it</span><div class="cf-row cf-thin cf-second">${second}</div>
        <span>Suite</span><div class="cf-row cf-thin cf-suite">${suite || ""}</div>
        <i class="cf-head"></i>
      </div>
      <div class="cf-charts" title="How much the app thinks the audience's attention is on each curiosity right now (the pie) and through the whole film (the graph). Click one to see it bigger; click again for both.">
        <canvas class="cf-pie" data-cf-only="pie" role="img" aria-label="Attention right now"></canvas>
        <canvas class="cf-graph" data-cf-only="graph" role="img" aria-label="Attention through the film"></canvas>
        <ol class="cf-list" aria-label="Every curiosity on right now, by share of attention"></ol>
      </div>
      </div>`;
    el.dataset.only = was;
    el.hidden = false;
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
    const graph = box.querySelector(".cf-graph");
    if (pie && pie.offsetParent) drawPie(pie, sh, cols);
    if (graph && graph.offsetParent) drawGraph(graph, r, t, cols);
    const list = box.querySelector(".cf-list");
    if (list) {
      const sig = sh.map((q) => q.id + Math.round(q.share * 100)).join(",");
      if (list.dataset.sig !== sig) {
        list.dataset.sig = sig;
        list.innerHTML = sh.map((q) => `<li title="${esc(q.label)}: ${Math.round(q.share * 100)}% of attention"><i style="background:${cols[q.id]}"></i><span>${esc(q.label)}</span><b>${Math.round(q.share * 100)}%</b></li>`).join("");
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
      const c = e.target.closest && e.target.closest(".cv-under [data-cf-only]");
      if (c && box) {
        box.dataset.only = box.dataset.only === c.dataset.cfOnly ? "" : c.dataset.cfOnly;
        V().redraw();
      }
    });
    /* a shortened name ("Shot…") shows in full at the top right when you point at it or pick it */
    const showName = (b) => {
      const n = box && box.querySelector(".cf-name");
      if (n) n.textContent = b.getAttribute("aria-label") || b.textContent;
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
  };
})();
