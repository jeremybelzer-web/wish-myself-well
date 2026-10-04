/* viewer/flight.js: a camera flight path for a panel, planned the way drone pilots plan a waypoint mission
   (Jeremy, 2026-10-04 20:16Z: "the user should even be able to map out a camera angle flight path, spinning
   around the lens as we go. We need a record button ... How do drone flier operators make the drone go exactly
   where they want? Please look it up and use the same parameters").

   Drone apps (DJI waypoint missions, Litchi) plan a flight as waypoints. Each waypoint has a place and a height,
   a speed, a heading (which way the drone faces), a gimbal pitch (camera up or down) and a "curve size" so the
   drone flies smooth corners instead of stopping at each point. The heading follows one of three modes: toward
   a point of interest, along the path, or as set at each waypoint (interpolated between them). Here:
   - Waypoints: where the camera is (x, height, z), when it gets there (a share of the panel's seconds), which
     way it looks, how far the lens is turned (roll) and the lens length.
   - Look: "As I pointed it" (each waypoint's own look, blended between: Litchi's Interpolate / Custom heading),
     "Always at …" (a point of interest: one thing in the scene stays in the middle), or "Ahead, along the path"
     (Follow path).
   - Smooth corners: the curve size, 0 (straight lines, sharp turns) to 1 (a smooth curve through every point).
   - Spin while flying: extra turns of the lens over the whole flight.
   - ● Record: plays the panel while you fly the camera live (drag to swing round, Control- or right-drag to
     slide, wheel to go closer, Q/E to turn the lens, W/A/S/D to fly forward, left, back, right, R/F up and down);
     a waypoint is kept every 0.25 s.
   - The 3D graph shows the path from outside: drag to turn the graph all the way round, wheel to zoom, drag a
     waypoint to move it (Shift-drag changes its height).
   Data: panel.flight = { on, look: "recorded" | "poi" | "path", poi, curve, spin, pts: [{ t, p: [x,y,z],
   l: [x,y,z], roll, lens }] }. Needs viewer/viewer.js (CurioViewer.onPose, addTab, live, edit, changed, ...). */
(function () {
  if (window.CurioFlight) return;
  const V = () => window.CurioViewer;
  const DEG = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => mul(a, 1 / (len(a) || 1));
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const r2 = (v) => Math.round(v * 100) / 100;
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /* ---------- flying along the path ---------- */
  /* Catmull-Rom through the points, blended with straight lines by the curve size */
  function along(pts, key, u, curve) {
    const n = pts.length;
    let k = 0;
    while (k < n - 2 && pts[k + 1].t <= u) k++;
    const a = pts[k];
    const b = pts[k + 1];
    const s = clamp((u - a.t) / Math.max(1e-6, b.t - a.t), 0, 1);
    const P0 = (pts[k - 1] || a)[key];
    const P1 = a[key];
    const P2 = b[key];
    const P3 = (pts[k + 2] || b)[key];
    const straight = lerp3(P1, P2, s);
    if (!curve) return straight;
    const s2 = s * s;
    const s3 = s2 * s;
    const cr = [0, 1, 2].map((i) => 0.5 * (2 * P1[i] + (-P0[i] + P2[i]) * s + (2 * P0[i] - 5 * P1[i] + 4 * P2[i] - P3[i]) * s2 + (-P0[i] + 3 * P1[i] - 3 * P2[i] + P3[i]) * s3));
    return lerp3(straight, cr, curve);
  }
  function num(pts, key, u, dflt) {
    let k = 0;
    while (k < pts.length - 2 && pts[k + 1].t <= u) k++;
    const a = pts[k];
    const b = pts[k + 1];
    const s = clamp((u - a.t) / Math.max(1e-6, b.t - a.t), 0, 1);
    const x = a[key] == null ? dflt : a[key];
    const y = b[key] == null ? dflt : b[key];
    return x == null || y == null ? dflt : lerp(x, y, s);
  }
  function poseAt(f, u, place) {
    const pts = f.pts;
    const curve = f.curve == null ? 0.6 : f.curve;
    const pos = along(pts, "p", u, curve);
    let target;
    if (f.look === "poi" && f.poi) target = V().aimPoint(f.poi, place);
    else if (f.look === "path") {
      const ahead = along(pts, "p", Math.min(1, u + 0.04), curve);
      const dir = len(sub(ahead, pos)) > 1e-3 ? norm(sub(ahead, pos)) : norm(sub(along(pts, "p", Math.min(1, u + 0.2), curve), pos));
      target = add(pos, mul(dir, 3));
    } else target = along(pts, "l", u, curve);
    const roll = num(pts, "roll", u, 0) + (f.spin || 0) * u;
    const lens = num(pts, "lens", u, null);
    return { pos, target, roll, lens };
  }
  /* playing: a panel with a flight path flies its camera */
  let rec = null;
  function pose(panel, u, place) {
    if (rec && rec.panel === panel.id) return rec.live;
    const f = panel.flight;
    if (!f || !f.on || !Array.isArray(f.pts) || f.pts.length < 2) return null;
    return poseAt(f, u, place);
  }

  /* ---------- recording ---------- */
  function startRecord() {
    const L = V().live();
    const p = L.panel;
    const C = L.C;
    if (!C) return;
    V().edit("flight-record");
    const starts = V().starts();
    const t0 = starts[L.cur];
    const keep = p.flight || {};
    rec = {
      panel: p.id,
      cur: L.cur,
      t0,
      sec: p.sec,
      start: performance.now(),
      pts: [],
      yaw: Math.atan2(C.pos[0] - C.target[0], C.pos[2] - C.target[2]),
      pitch: Math.asin(clamp((C.pos[1] - C.target[1]) / Math.max(1e-6, len(sub(C.pos, C.target))), -1, 1)),
      dist: len(sub(C.pos, C.target)),
      target: C.target.slice(),
      roll: p.cam.tilt || 0,
      lens: C.lens,
      keys: {},
      keep,
    };
    rec.live = livePose();
    window.addEventListener("keydown", recKey, true);
    window.addEventListener("keyup", recKey, true);
    const cv = L.canvas;
    cv.addEventListener("pointerdown", recDown, true);
    window.addEventListener("pointermove", recMove, true);
    window.addEventListener("pointerup", recUp, true);
    cv.addEventListener("wheel", recWheel, { capture: true, passive: false });
    rec.canvas = cv;
    requestAnimationFrame(recTick);
    render();
  }
  function livePose() {
    const d = rec.dist;
    const pos = add(rec.target, [d * Math.sin(rec.yaw) * Math.cos(rec.pitch), d * Math.sin(rec.pitch), d * Math.cos(rec.yaw) * Math.cos(rec.pitch)]);
    return { pos, target: rec.target.slice(), roll: rec.roll, lens: rec.lens };
  }
  function recTick(now) {
    if (!rec) return;
    const el = (now - rec.start) / 1000;
    const u = clamp(el / rec.sec, 0, 1);
    /* drone-style keys fly the camera: W/S forward and back, A/D left and right, R/F up and down, Q/E turn the lens */
    const k = rec.keys;
    const dt = rec.last ? Math.min(0.05, (now - rec.last) / 1000) : 0;
    rec.last = now;
    const speed = Math.max(1.5, rec.dist * 0.8);
    const fwd = norm([-Math.sin(rec.yaw), 0, -Math.cos(rec.yaw)]);
    const right = [-fwd[2], 0, fwd[0]];
    let mv = [0, 0, 0];
    if (k.w) mv = add(mv, fwd);
    if (k.s) mv = sub(mv, fwd);
    if (k.d) mv = add(mv, right);
    if (k.a) mv = sub(mv, right);
    if (k.r) mv = add(mv, [0, 1, 0]);
    if (k.f) mv = sub(mv, [0, 1, 0]);
    if (len(mv) > 0) rec.target = add(rec.target, mul(norm(mv), speed * dt));
    if (k.q) rec.roll -= 90 * dt;
    if (k.e) rec.roll += 90 * dt;
    rec.live = livePose();
    const lastT = rec.pts.length ? rec.pts[rec.pts.length - 1].t : -1;
    if (u - lastT >= 0.25 / rec.sec || u >= 1) rec.pts.push({ t: Math.round(u * 1000) / 1000, p: rec.live.pos.map(r2), l: rec.live.target.map(r2), roll: Math.round(rec.live.roll), lens: Math.round(rec.live.lens) });
    V().time(rec.t0 + u * rec.sec * 0.999);
    const bar = document.querySelector(".cvf-recbar i");
    if (bar) bar.style.width = Math.round(u * 100) + "%";
    if (u >= 1) return stopRecord(true);
    requestAnimationFrame(recTick);
  }
  function stopRecord(keepIt) {
    if (!rec) return;
    const r = rec;
    rec = null;
    window.removeEventListener("keydown", recKey, true);
    window.removeEventListener("keyup", recKey, true);
    r.canvas.removeEventListener("pointerdown", recDown, true);
    window.removeEventListener("pointermove", recMove, true);
    window.removeEventListener("pointerup", recUp, true);
    r.canvas.removeEventListener("wheel", recWheel, { capture: true });
    const L = V().live();
    const p = L.film.panels.find((x) => x.id === r.panel);
    if (keepIt && p && r.pts.length >= 2) {
      p.flight = { on: true, look: "recorded", poi: r.keep.poi || p.cam.aim || null, curve: r.keep.curve == null ? 0.6 : r.keep.curve, spin: r.keep.spin || 0, pts: r.pts };
      p.flight.pts[0].t = 0;
      p.flight.pts[p.flight.pts.length - 1].t = 1;
    }
    V().changed(true);
    V().select(r.cur);
    render();
  }
  function recKey(e) {
    if (!rec) return;
    const k = e.key.toLowerCase();
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      return stopRecord(false);
    }
    if ("wasdrfqe".includes(k) && k.length === 1) {
      rec.keys[k] = e.type === "keydown";
      e.preventDefault();
      e.stopPropagation();
    }
  }
  function recDown(e) {
    if (!rec) return;
    e.preventDefault();
    e.stopPropagation();
    rec.drag = { x: e.clientX, y: e.clientY, pan: e.ctrlKey || e.metaKey || e.button === 1 || e.button === 2 };
  }
  function recMove(e) {
    if (!rec || !rec.drag) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - rec.drag.x;
    const dy = e.clientY - rec.drag.y;
    rec.drag.x = e.clientX;
    rec.drag.y = e.clientY;
    if (rec.drag.pan) {
      const fwd = norm([-Math.sin(rec.yaw), 0, -Math.cos(rec.yaw)]);
      const right = [-fwd[2], 0, fwd[0]];
      const k = rec.dist / 500;
      rec.target = add(rec.target, add(mul(right, -dx * k), mul(fwd, dy * k)));
    } else {
      rec.yaw -= dx * 0.008;
      rec.pitch = clamp(rec.pitch + dy * 0.008, -1.55, 1.55);
    }
  }
  function recUp(e) {
    if (!rec || !rec.drag) return;
    e.stopPropagation();
    rec.drag = null;
  }
  function recWheel(e) {
    if (!rec) return;
    e.preventDefault();
    e.stopPropagation();
    rec.dist = clamp(rec.dist * Math.exp(e.deltaY * 0.0015), 0.3, 120);
  }

  /* ---------- the tab ---------- */
  let gv = { yaw: 0.7, pitch: 0.55, zoom: 1 };
  let body = null;
  function panel() {
    const L = V().live();
    return L.panel;
  }
  function render(el) {
    if (el) body = el;
    if (!body || !body.isConnected) return;
    const L = V().live();
    const p = L.panel;
    const f = p.flight || null;
    const has = f && Array.isArray(f.pts) && f.pts.length >= 2;
    const objs = L.film.objects;
    body.innerHTML = `
      <p class="cv-help">Fly the camera through <b>panel ${L.cur + 1}</b> like a drone. Press <b>● Record</b>: the panel plays for its ${p.sec} seconds while you fly. Drag to swing round, Control-drag to slide, the wheel to go closer, <b>W A S D</b> to fly forward, left, back and right, <b>R</b>/<b>F</b> up and down, <b>Q</b>/<b>E</b> to turn the lens. Esc stops without keeping it.</p>
      <div class="cvf-row">
        ${rec ? `<button type="button" class="cv-primary" data-fl="stop">■ Stop</button><span class="cvf-recbar"><i></i></span>` : `<button type="button" class="cvf-rec" data-fl="rec">● Record</button>`}
        <button type="button" data-fl="addwp" title="Add a waypoint: where the camera is now, at the playhead's moment in this panel">+ Waypoint here</button>
        ${has ? `<button type="button" data-fl="clear" title="Take the flight path out of this panel">Clear</button>` : ""}
      </div>
      ${
        has
          ? `<label class="cv-check"><input type="checkbox" data-flk="on"${f.on ? " checked" : ""} /> Fly this panel's camera along the path</label>
      <label class="cv-field"><span><b>Where the camera looks</b></span><select data-flk="look">
        <option value="recorded"${f.look === "recorded" ? " selected" : ""}>As I pointed it, blended between waypoints</option>
        <option value="poi"${f.look === "poi" ? " selected" : ""}>Always at one thing (a point of interest)</option>
        <option value="path"${f.look === "path" ? " selected" : ""}>Ahead, along the path</option></select></label>
      ${f.look === "poi" ? `<label class="cv-field"><span><b>Point of interest</b></span><select data-flk="poi">${objs.map((o) => `<option value="${esc(o.id)}"${o.id === f.poi ? " selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>` : ""}
      <label class="cv-field"><span><b>Smooth corners</b><em>${Math.round((f.curve == null ? 0.6 : f.curve) * 100)}%</em></span><input type="range" data-flk="curve" min="0" max="100" value="${Math.round((f.curve == null ? 0.6 : f.curve) * 100)}" /><span class="cv-ends"><span>sharp turns, straight lines</span><span>one smooth curve</span></span></label>
      <label class="cv-field"><span><b>Spin the lens while flying</b><em>${Math.round(f.spin || 0)}°</em></span><input type="range" data-flk="spin" min="-720" max="720" step="15" value="${Math.round(f.spin || 0)}" /><span class="cv-ends"><span>two turns left</span><span>two turns right</span></span></label>`
          : `<p class="cv-help">No flight path in this panel yet. Record one, or add waypoints one at a time: move the playhead, place the camera, press + Waypoint here.</p>`
      }
      <h3>The flight from outside</h3>
      <canvas class="cvf-graph" width="640" height="420" aria-label="The flight path in 3D. Drag to turn it, wheel to zoom, drag a waypoint to move it, Shift-drag to change its height."></canvas>
      <small class="cv-say">Drag to turn the graph all the way round; the wheel zooms. Drag a numbered waypoint to move it; Shift-drag lifts or lowers it. Cyan is the path, white is the camera now, and the line shows where it looks.</small>
      ${
        has
          ? `<h3>Waypoints</h3><div class="cvf-wps">${f.pts
              .map(
                (q, k) => `<div class="cvf-wp"><b>${k + 1}</b><span>${Math.round(q.t * p.sec * 10) / 10}s</span><span>height ${r2(q.p[1])} m</span><label>turn <input type="number" data-wp="${k}" data-wk="roll" value="${Math.round(q.roll || 0)}" step="15" /></label><label>lens <input type="number" data-wp="${k}" data-wk="lens" value="${Math.round(q.lens || 35)}" min="8" max="400" /></label><button type="button" data-wpdel="${k}" title="Take out this waypoint">✕</button></div>`,
              )
              .join("")}</div>`
          : ""
      }`;
    graph();
  }
  /* ---------- the 3D graph ---------- */
  function graphCam(W, H) {
    const L = V().live();
    const f = L.panel.flight;
    const pts = f && f.pts ? f.pts.map((q) => q.p) : [];
    const things = L.film.objects.map((o) => L.panel.place[o.id]).filter(Boolean);
    const all = pts.concat(things.map((p) => [p.x, p.y, p.z]));
    if (L.C) all.push(L.C.pos);
    const c = all.length ? mul(all.reduce((a, b) => add(a, b), [0, 0, 0]), 1 / all.length) : [0, 0, 0];
    const span = Math.max(6, ...all.map((p) => len(sub(p, c))));
    const d = span * 2.4 * gv.zoom;
    const pos = add(c, [d * Math.sin(gv.yaw) * Math.cos(gv.pitch), d * Math.sin(gv.pitch), d * Math.cos(gv.yaw) * Math.cos(gv.pitch)]);
    const fwd = norm(sub(c, pos));
    const right = norm([fwd[2], 0, -fwd[0]]);
    const up = [right[1] * fwd[2] - right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2], right[0] * fwd[1] - right[1] * fwd[0]];
    const F = W * 1.1;
    const pr = (p) => {
      const v = sub(p, pos);
      const z = v[0] * fwd[0] + v[1] * fwd[1] + v[2] * fwd[2];
      if (z < 0.1) return null;
      const x = v[0] * right[0] + v[1] * right[1] + v[2] * right[2];
      const y = v[0] * up[0] + v[1] * up[1] + v[2] * up[2];
      return [W / 2 - (F * x) / z, H / 2 - (F * y) / z, z];
    };
    return { pr, c, span };
  }
  function graph() {
    const cv = body && body.querySelector(".cvf-graph");
    if (!cv) return;
    const g = cv.getContext("2d");
    const W = cv.width;
    const H = cv.height;
    const L = V().live();
    const { pr, c, span } = graphCam(W, H);
    g.fillStyle = "#101013";
    g.fillRect(0, 0, W, H);
    /* the floor grid and the three axes */
    const step = Math.pow(10, Math.floor(Math.log10(span))) / (span < 20 ? 2 : 1);
    const R = Math.ceil((span * 1.4) / step) * step;
    g.lineWidth = 1;
    for (let k = -R; k <= R + 1e-6; k += step) {
      [
        [
          [c[0] + k, 0, c[2] - R],
          [c[0] + k, 0, c[2] + R],
        ],
        [
          [c[0] - R, 0, c[2] + k],
          [c[0] + R, 0, c[2] + k],
        ],
      ].forEach(([a, b]) => {
        const p = pr(a);
        const q = pr(b);
        if (!p || !q) return;
        g.strokeStyle = "rgba(255,255,255,0.09)";
        g.beginPath();
        g.moveTo(p[0], p[1]);
        g.lineTo(q[0], q[1]);
        g.stroke();
      });
    }
    /* things in the scene, as labelled dots */
    g.font = "12px system-ui, sans-serif";
    L.film.objects.forEach((o) => {
      const p = L.panel.place[o.id];
      if (!p || p.show === false) return;
      const a = pr([p.x, 0, p.z]);
      const b = pr([p.x, Math.max(0.3, p.y + 1), p.z]);
      if (!a || !b) return;
      g.strokeStyle = o.color || "#888";
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.lineTo(b[0], b[1]);
      g.stroke();
      g.fillStyle = o.color || "#888";
      g.beginPath();
      g.arc(b[0], b[1], 4, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#bbb";
      g.fillText(o.name, b[0] + 6, b[1] + 4);
    });
    /* the path, with drop lines to the floor so its height reads */
    const f = L.panel.flight;
    if (f && f.pts && f.pts.length >= 2) {
      const curve = f.curve == null ? 0.6 : f.curve;
      g.strokeStyle = "#22d3ee";
      g.lineWidth = 2.5;
      g.beginPath();
      for (let k = 0; k <= 120; k++) {
        const q = pr(along(f.pts, "p", k / 120, curve));
        if (!q) continue;
        k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
      }
      g.stroke();
      f.pts.forEach((q, k) => {
        const a = pr(q.p);
        const b = pr([q.p[0], 0, q.p[2]]);
        if (!a) return;
        if (b) {
          g.strokeStyle = "rgba(34,211,238,0.3)";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(a[0], a[1]);
          g.lineTo(b[0], b[1]);
          g.stroke();
        }
        if (f.pts.length <= 40 || k % Math.ceil(f.pts.length / 20) === 0 || k === f.pts.length - 1) {
          g.fillStyle = "#22d3ee";
          g.beginPath();
          g.arc(a[0], a[1], 7, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#062a31";
          g.font = "bold 10px system-ui, sans-serif";
          g.textAlign = "center";
          g.fillText(String(k + 1), a[0], a[1] + 3.5);
          g.textAlign = "left";
        }
      });
    }
    /* the camera now, and where it looks */
    if (L.C) {
      const a = pr(L.C.pos);
      const b = pr(L.C.target);
      if (a && b) {
        g.strokeStyle = "#fff";
        g.setLineDash([4, 4]);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0], b[1]);
        g.stroke();
        g.setLineDash([]);
      }
      if (a) {
        g.fillStyle = "#fff";
        g.fillRect(a[0] - 6, a[1] - 4, 12, 8);
      }
    }
  }
  let gdrag = null;
  function graphDown(e) {
    const cv = e.target.closest(".cvf-graph");
    if (!cv) return;
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * cv.width;
    const sy = ((e.clientY - r.top) / r.height) * cv.height;
    const f = panel().flight;
    let hit = -1;
    if (f && f.pts) {
      const { pr } = graphCam(cv.width, cv.height);
      let best = 14;
      f.pts.forEach((q, k) => {
        const a = pr(q.p);
        if (!a) return;
        const d = Math.hypot(a[0] - sx, a[1] - sy);
        if (d < best) (best = d), (hit = k);
      });
    }
    if (hit >= 0) V().edit("flight-waypoint");
    gdrag = { x: e.clientX, y: e.clientY, hit, shift: e.shiftKey, cv };
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (err) {}
  }
  function graphMove(e) {
    if (!gdrag) return;
    const dx = e.clientX - gdrag.x;
    const dy = e.clientY - gdrag.y;
    gdrag.x = e.clientX;
    gdrag.y = e.clientY;
    if (gdrag.hit < 0) {
      gv.yaw -= dx * 0.01;
      gv.pitch = clamp(gv.pitch + dy * 0.01, -1.5, 1.5);
      return graph();
    }
    const f = panel().flight;
    const q = f.pts[gdrag.hit];
    const { span } = graphCam(gdrag.cv.width, gdrag.cv.height);
    const k = (span * 2.4 * gv.zoom) / gdrag.cv.getBoundingClientRect().width;
    if (gdrag.shift || e.shiftKey) q.p[1] = r2(q.p[1] - dy * k);
    else {
      const fwd = [-Math.sin(gv.yaw), 0, -Math.cos(gv.yaw)];
      const right = [fwd[2], 0, -fwd[0]];
      /* across the floor only: the height stays exactly as it was (rounding it would nudge it up or down) */
      const n = add(q.p, add(mul(right, -dx * k), mul(fwd, -dy * k)));
      q.p = [r2(n[0]), q.p[1], r2(n[2])];
    }
    V().changed(false);
    graph();
  }
  function graphUp() {
    if (!gdrag) return;
    const moved = gdrag.hit >= 0;
    gdrag = null;
    if (moved) render();
  }

  /* ---------- edits ---------- */
  function onClick(e) {
    const b = e.target.closest && e.target.closest(".cvf-body [data-fl], .cvf-body [data-wpdel]");
    if (!b) return;
    const L = V().live();
    const p = L.panel;
    if (b.dataset.fl === "rec") return startRecord();
    if (b.dataset.fl === "stop") return stopRecord(true);
    if (b.dataset.fl === "clear") {
      V().edit("flight-clear");
      delete p.flight;
      V().changed(true);
      return render();
    }
    if (b.dataset.fl === "addwp") {
      const C = L.C;
      if (!C) return;
      /* read the moment first: an edit puts the playhead back at the panel's start */
      const u = clamp((V().time() - V().starts()[L.cur]) / p.sec, 0, 1);
      V().edit("flight-waypoint");
      const f = (p.flight = p.flight || { on: true, look: "recorded", poi: p.cam.aim || null, curve: 0.6, spin: 0, pts: [] });
      /* if the path is on, the camera now IS the path: add the point where the plain camera would be */
      f.pts = f.pts.filter((q) => Math.abs(q.t - u) > 0.01);
      f.pts.push({ t: Math.round(u * 1000) / 1000, p: C.pos.map(r2), l: C.target.map(r2), roll: Math.round(p.cam.tilt || 0), lens: Math.round(C.lens) });
      f.pts.sort((a, c) => a.t - c.t);
      if (f.pts.length === 1) f.on = false;
      else f.on = true;
      V().changed(true);
      return render();
    }
    if (b.dataset.wpdel != null) {
      V().edit("flight-waypoint");
      p.flight.pts.splice(+b.dataset.wpdel, 1);
      if (p.flight.pts.length < 2) p.flight.on = false;
      V().changed(true);
      return render();
    }
  }
  function onInput(e) {
    const el = e.target;
    if (!el.closest || !el.closest(".cvf-body")) return;
    const p = panel();
    const f = p.flight;
    if (!f) return;
    if (el.dataset.flk) {
      if (e.type === "input" && el.type !== "range") return;
      V().edit("flight-" + el.dataset.flk);
      const k = el.dataset.flk;
      if (k === "on") f.on = el.checked;
      if (k === "look") f.look = el.value;
      if (k === "poi") f.poi = el.value;
      if (k === "curve") f.curve = +el.value / 100;
      if (k === "spin") f.spin = +el.value;
      V().changed(false);
      if (e.type === "change") render();
      else graph();
    }
    if (el.dataset.wp != null && e.type === "change") {
      V().edit("flight-waypoint");
      f.pts[+el.dataset.wp][el.dataset.wk] = +el.value;
      V().changed(false);
    }
  }

  const CSS = `
.cvf-body .cvf-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0 8px; }
.cv-root .cvf-rec { background: #b91c1c; color: #fff; font-weight: 700; }
.cvf-recbar { flex: 1 1 80px; height: 8px; background: #2a2a30; border-radius: 4px; overflow: hidden; }
.cvf-recbar i { display: block; height: 100%; width: 0; background: #ef4444; }
.cvf-graph { width: 100%; height: auto; aspect-ratio: 640 / 420; display: block; border-radius: 6px; cursor: grab; touch-action: none; }
.cvf-wps { display: grid; gap: 3px; max-height: 220px; overflow-y: auto; }
.cvf-wp { display: grid; grid-template-columns: 22px 42px 1fr auto auto auto; gap: 6px; align-items: center; font-size: 12px; }
.cvf-wp b { background: #22d3ee; color: #062a31; border-radius: 50%; text-align: center; font-size: 10px; line-height: 18px; }
.cvf-wp input { width: 54px; }
`;
  function wire() {
    const v = V();
    if (!v || !v.onPose || !v.addTab) return setTimeout(wire, 300);
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    v.onPose(pose);
    v.addTab({
      id: "flight",
      label: "Flight path",
      /* our own box inside the tab, so other tabs never get our class and a stale box is simply disconnected */
      render: (el) => {
        const d = document.createElement("div");
        d.className = "cvf-body";
        el.appendChild(d);
        render(d);
      },
    });
    v.onDraw && v.onDraw(() => body && body.isConnected && !gdrag && graph());
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onInput);
    document.addEventListener("pointerdown", graphDown);
    document.addEventListener("pointermove", graphMove);
    document.addEventListener("pointerup", graphUp);
    document.addEventListener(
      "wheel",
      (e) => {
        if (!e.target.closest || !e.target.closest(".cvf-graph")) return;
        e.preventDefault();
        gv.zoom = clamp(gv.zoom * Math.exp(e.deltaY * 0.0015), 0.2, 4);
        graph();
      },
      { passive: false },
    );
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioFlight = {
    poseAt,
    record: startRecord,
    stop: () => stopRecord(true),
    recording: () => !!rec,
    /* where waypoint k sits on the 3D graph, in page pixels (for tests and the walkthrough) */
    graphPoint: (k) => {
      const cv = body && body.querySelector(".cvf-graph");
      const f = panel().flight;
      if (!cv || !f || !f.pts[k]) return null;
      const a = graphCam(cv.width, cv.height).pr(f.pts[k].p);
      const r = cv.getBoundingClientRect();
      return a && [r.left + (a[0] / cv.width) * r.width, r.top + (a[1] / cv.height) * r.height];
    },
  };
})();
