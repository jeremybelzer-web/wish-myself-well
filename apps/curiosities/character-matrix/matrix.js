/* The 3D Character matrix.

   Cube view: the front face is the character face, one row per axis (stabilizer to catalyst, reactive to
   proactive...), cut into five cells from one pole to the other. Behind it sit nine more faces, one per
   Enneagram type, each lit where that type's fingerprint falls at the chosen health level. A character is a
   line across the front face, tied back to its own type's face. As its health falls the tie bends toward its
   stress type's face; as it rises, toward its growth type's face. "Reads most like" names the type whose
   average fingerprint the character is closest to right now, so an unhealthy 7 can be seen to read as a 1.

   Space view: pick any three axes; every character is a point that moves through them scene by scene, with
   the nine type fingerprints as fixed landmarks.

   Every axis, the health level and the dramatic role are curiosities registered with CurioAuto, so the one
   automation system (A to B, LFO, knob, MIDI note or CC, CC out to VCV Rack) drives them. A running patch moves
   the selected character live; "Write into scene" keeps what it is showing.

   window.CharacterMatrix.mount(element) draws the whole workspace into any element. State is localStorage key
   "curiosities-character-matrix-v1". Needs three.js (global THREE) for the 3D view. */

(function () {
  const D = window.CHARACTER_MATRIX_DATA;
  const KEY = "curiosities-character-matrix-v1";
  const AX = D.AXES;
  const AXI = Object.fromEntries(AX.map((a, i) => [a.id, i]));
  const TYPE = Object.fromEntries(D.TYPES.map((t) => [t.n, t]));
  const ROLE = Object.fromEntries(D.ROLES.map((r) => [r.id, r]));
  const BINS = 5;

  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const band = (h) => (h <= 3.5 ? "healthy" : h < 6.5 ? "average" : "unhealthy");
  const levelOf = (h) => D.LEVELS[clamp(Math.round(h), 1, 9) - 1];

  /* ---------- the model ---------- */

  /* A type's fingerprint at a health level (1 to 9, may be fractional). Level 5 is the average fingerprint.
     Healthier: borrows up to 30% of the growth type and picks up the shared healthy push.
     Less healthy: slides up to 65% toward the stress type, grows more extreme, and picks up the unhealthy push. */
  function typeProfile(n, h) {
    const t = TYPE[n];
    return t.profile.map((v, i) => {
      const id = AX[i].id;
      let x = v;
      if (h < 5) {
        const k = (5 - h) / 4;
        x = lerp(v, TYPE[t.growth].profile[i], 0.3 * k) + (D.HEALTH_PUSH.healthy[id] || 0) * k;
      } else if (h > 5) {
        const k = (h - 5) / 4;
        x = lerp(v, TYPE[t.stress].profile[i], 0.65 * k);
        x = 50 + (x - 50) * (1 + 0.15 * k) + (D.HEALTH_PUSH.unhealthy[id] || 0) * k;
      }
      return clamp(x);
    });
  }

  function distance(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]);
    return Math.sqrt(s / a.length);
  }
  /* A type's own fingerprint with only the push every type shares at that health: no borrowing from another type. */
  function plainProfile(n, h) {
    const k = Math.abs(h - 5) / 4;
    const push = h < 5 ? D.HEALTH_PUSH.healthy : D.HEALTH_PUSH.unhealthy;
    return TYPE[n].profile.map((v, i) => clamp(v + (push[AX[i].id] || 0) * k));
  }
  /* Which type a profile is closest to, best first, comparing like with like at the same health. */
  function nearestTypes(profile, h) {
    return D.TYPES.map((t) => ({ n: t.n, d: distance(profile, plainProfile(t.n, h == null ? 5 : h)) })).sort((a, b) => a.d - b.d);
  }

  /* ---------- state ---------- */
  let state = null;
  function fresh() {
    const ex = JSON.parse(JSON.stringify(D.EXAMPLE));
    return { scenes: ex.scenes, characters: ex.characters, selected: ex.characters[0].id, scene: 0, view: "cube", space: ["stability", "morality", "control"], refHealth: "follow", isolate: "related" };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? Object.assign(fresh(), JSON.parse(raw)) : fresh();
    } catch (e) {
      state = fresh();
    }
    normalise();
  }
  function normalise() {
    state.scenes = clamp(Math.round(state.scenes) || 1, 1, 40);
    state.characters.forEach((c) => {
      c.scenes = c.scenes || [];
      for (let i = 0; i < state.scenes; i++) {
        const prev = c.scenes[i - 1];
        c.scenes[i] = Object.assign({ health: prev ? prev.health : 5, role: prev ? prev.role : TYPE[c.type].roles.average, offsets: {} }, c.scenes[i] || {});
        c.scenes[i].offsets = c.scenes[i].offsets || {};
      }
      c.scenes.length = state.scenes;
    });
    if (!state.characters.some((c) => c.id === state.selected)) state.selected = state.characters[0] ? state.characters[0].id : null;
    state.scene = clamp(Math.round(state.scene) || 0, 0, state.scenes - 1);
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }
  const selected = () => state.characters.find((c) => c.id === state.selected) || null;

  /* ---------- automation: every axis, health and role is a curiosity ---------- */
  const AUTO = AX.map((a) => ({ id: "cm-" + a.id, axis: a.id, label: `${a.left} to ${a.right}`, kind: "range", min: 0, max: 100, step: 1 })).concat([
    { id: "cm-health", axis: "health", label: "Enneagram health (1 healthy to 9 unhealthy)", kind: "range", min: 1, max: 9, step: 0.1 },
    { id: "cm-role", axis: "role", label: "Dramatic role", values: D.ROLES.map((r) => r.id).join(", ") },
  ]);
  const auto = () => window.CurioAuto || null;
  function registerCuriosities() {
    const A = auto();
    if (!A) return;
    AUTO.forEach((c) => A.addCuriosity({ id: c.id, label: c.label, group: "Character matrix", kind: c.kind, min: c.min, max: c.max, step: c.step, values: c.values || "", options: c.values ? c.values.split(", ") : undefined }));
  }
  function curveOf(name, m) {
    m = clamp(Number(m) || 0, 0, 1);
    if (name === "ease") return m * m * (3 - 2 * m);
    if (name === "in") return m * m;
    if (name === "out") return 1 - (1 - m) * (1 - m);
    if (name === "steps") return Math.round(m * 4) / 4;
    return m;
  }
  /* Values of the matrix curiosities whose patches are running now. */
  function live() {
    const A = auto();
    const out = {};
    if (!A) return out;
    AUTO.forEach((c) => {
      const p = A.patch("c:" + c.id);
      if (!p || !p.running) return;
      const m = A.m("c:" + c.id);
      if (m == null) return;
      const k = curveOf(p.curve, m);
      if (c.kind === "range") out[c.axis] = lerp(p.a === "" ? c.min : Number(p.a), p.b === "" ? c.max : Number(p.b), k);
      else out[c.axis] = A.between(c.id, p.a, p.b, k);
    });
    return out;
  }

  /* A character at a scene (fractional scenes blend between neighbours while playing). */
  function sceneOf(ch, i) {
    return ch.scenes[clamp(i, 0, ch.scenes.length - 1)];
  }
  function characterAt(ch, s, overrides) {
    const i = Math.floor(s);
    const f = s - i;
    const a = sceneOf(ch, i);
    const b = sceneOf(ch, i + 1);
    let health = lerp(a.health, b.health, f);
    if (overrides && overrides.health != null) health = clamp(overrides.health, 1, 9);
    const base = typeProfile(ch.type, health);
    const profile = base.map((v, k) => {
      const id = AX[k].id;
      if (overrides && overrides[id] != null) return clamp(overrides[id]);
      return clamp(v + lerp(a.offsets[id] || 0, b.offsets[id] || 0, f));
    });
    const role = (overrides && overrides.role) || (f < 0.5 ? a.role : b.role);
    return { health, profile, base, role };
  }
  function nowOf(ch, s) {
    return characterAt(ch, s == null ? viewScene() : s, ch.id === state.selected ? live() : null);
  }

  /* The group's herd mentality in a scene: how conformist the cast is on average, 0 to 100. */
  function herd(s) {
    const cast = state.characters;
    if (!cast.length) return 0;
    return cast.reduce((t, c) => t + (100 - nowOf(c, s).profile[AXI.freedom]), 0) / cast.length;
  }
  function pairs(s) {
    const cast = state.characters.map((c) => ({ c, p: nowOf(c, s).profile }));
    const out = [];
    for (let i = 0; i < cast.length; i++)
      for (let j = i + 1; j < cast.length; j++) {
        const a = cast[i];
        const b = cast[j];
        let gap = 0;
        let axis = 0;
        a.p.forEach((v, k) => {
          if (Math.abs(v - b.p[k]) > gap) (gap = Math.abs(v - b.p[k])), (axis = k);
        });
        out.push({ a: a.c, b: b.c, d: distance(a.p, b.p), axis, gap });
      }
    return out.sort((x, y) => x.d - y.d);
  }

  /* ---------- 3D ---------- */
  const G = { W: 10, ROW: 0.55, LAYER: 1.8 };
  let three = null;

  function rowY(i) {
    return ((AX.length - 1) / 2 - i) * G.ROW;
  }
  function valueX(v) {
    return (v / 100 - 0.5) * G.W;
  }
  function layerZ(k) {
    return -k * G.LAYER + (9 * G.LAYER) / 2;
  }
  function mix(hex, toward, k) {
    return new THREE.Color(hex).lerp(new THREE.Color(toward), k);
  }

  function label(text, opts) {
    opts = opts || {};
    const size = opts.size || 0.32;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const font = `${opts.weight || 500} 44px ${opts.font || "IBM Plex Mono, ui-monospace, monospace"}`;
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 16;
    c.width = w;
    c.height = 60;
    ctx.font = font;
    ctx.fillStyle = opts.color || "#1c1712";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, 8, 31);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set((w / 60) * size, size, 1);
    s.center.set(opts.align === "right" ? 1 : opts.align === "center" ? 0.5 : 0, 0.5);
    return s;
  }

  function disposeGroup(g) {
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    while (g.children.length) g.remove(g.children[0]);
  }

  function initThree(host) {
    if (!window.THREE) {
      host.innerHTML = '<p class="cm-note">The 3D view needs three.js, which loads from cdnjs. Check the connection and reload. The panels on either side still work.</p>';
      return null;
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0xfffaf2, 1);
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    const orbit = { theta: -0.78, phi: 1.3, r: 30, target: new THREE.Vector3(0, 0, 0) };
    const statics = new THREE.Group();
    const dynamic = new THREE.Group();
    scene.add(statics, dynamic);
    const tip = document.createElement("div");
    tip.className = "cm-tip";
    host.appendChild(tip);
    const t = { host, renderer, scene, camera, orbit, statics, dynamic, cells: null, tip, built: null };

    let drag = null;
    renderer.domElement.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, theta: orbit.theta, phi: orbit.phi };
      renderer.domElement.setPointerCapture(e.pointerId);
    });
    renderer.domElement.addEventListener("pointermove", (e) => {
      if (drag) {
        orbit.theta = drag.theta - (e.clientX - drag.x) * 0.008;
        orbit.phi = clamp(drag.phi - (e.clientY - drag.y) * 0.008, 0.15, Math.PI - 0.15);
        tip.style.display = "none";
      } else hover(e);
    });
    renderer.domElement.addEventListener("pointerup", () => (drag = null));
    renderer.domElement.addEventListener("pointerleave", () => (tip.style.display = "none"));
    renderer.domElement.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        orbit.r = clamp(orbit.r * (1 + Math.sign(e.deltaY) * 0.08), 8, 70);
      },
      { passive: false }
    );
    const ray = new THREE.Raycaster();
    function hover(e) {
      if (!t.cells || state.view !== "cube") return (tip.style.display = "none");
      const r = renderer.domElement.getBoundingClientRect();
      const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v, camera);
      const hit = ray.intersectObject(t.cells)[0];
      if (!hit) return (tip.style.display = "none");
      const id = hit.instanceId;
      const layer = Math.floor(id / (AX.length * BINS));
      const row = Math.floor((id % (AX.length * BINS)) / BINS);
      const bin = id % BINS;
      const a = AX[row];
      const where = layer === 0 ? "Character face" : `Type ${layer} · ${TYPE[layer].name}`;
      tip.innerHTML = `<b>${esc(where)}</b><br>${esc(a.left)} to ${esc(a.right)}<br>cell ${bin * 20} to ${bin * 20 + 20}: ${bin < 2 ? esc(a.left) : bin > 2 ? esc(a.right) : "between"}`;
      tip.style.display = "block";
      tip.style.left = e.clientX - r.left + 12 + "px";
      tip.style.top = e.clientY - r.top + 12 + "px";
    }
    new ResizeObserver(() => resize(t)).observe(host);
    resize(t);
    return t;
  }
  function resize(t) {
    const w = t.host.clientWidth || 600;
    const h = t.host.clientHeight || 480;
    t.renderer.setSize(w, h);
    t.camera.aspect = w / h;
    t.camera.updateProjectionMatrix();
  }

  function buildCubeStatics(t) {
    disposeGroup(t.statics);
    const cellW = G.W / BINS;
    const geo = new THREE.BoxGeometry(cellW * 0.92, G.ROW * 0.8, 0.05);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
    const n = 10 * AX.length * BINS;
    const cells = new THREE.InstancedMesh(geo, mat, n);
    const m = new THREE.Matrix4();
    for (let layer = 0; layer < 10; layer++)
      for (let row = 0; row < AX.length; row++)
        for (let bin = 0; bin < BINS; bin++) {
          const i = (layer * AX.length + row) * BINS + bin;
          m.makeTranslation(-G.W / 2 + cellW * (bin + 0.5), rowY(row), layerZ(layer));
          cells.setMatrixAt(i, m);
          cells.setColorAt(i, new THREE.Color("#f7efe2"));
        }
    t.cells = cells;
    t.statics.add(cells);
    /* Row labels on the front face, layer labels across the top. */
    AX.forEach((a, row) => {
      const l = label(a.left, { size: 0.26, align: "right", color: "#3a3229" });
      l.position.set(-G.W / 2 - 0.15, rowY(row), layerZ(0));
      const r = label(a.right, { size: 0.26, color: "#3a3229" });
      r.position.set(G.W / 2 + 0.15, rowY(row), layerZ(0));
      t.statics.add(l, r);
    });
    t.layerLabels = [];
    for (let layer = 0; layer < 10; layer++) {
      const txt = layer === 0 ? "CHARACTER FACE" : `${layer} ${TYPE[layer].name.toUpperCase()}`;
      const s = label(txt, { size: 0.3, color: layer === 0 ? "#c45c26" : TYPE[layer].color, align: "right" });
      s.position.set(-G.W / 2 - 0.15, rowY(0) + G.ROW * 1.3, layerZ(layer));
      t.layerLabels[layer] = s;
      t.statics.add(s);
    }
    t.built = "cube";
  }

  function buildSpaceStatics(t) {
    disposeGroup(t.statics);
    t.cells = null;
    const S = 9;
    const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S, S, S)), new THREE.LineBasicMaterial({ color: 0x1c1712, transparent: true, opacity: 0.35 }));
    t.statics.add(box);
    const [x, y, z] = state.space.map((id) => AX[AXI[id]]);
    const put = (txt, pos, opts) => {
      const s = label(txt, opts);
      s.position.copy(pos);
      t.statics.add(s);
    };
    const h = S / 2 + 0.3;
    put(x.left, new THREE.Vector3(-h + 0.3, -h - 0.4, h), { size: 0.34, color: "#c45c26" });
    put(x.right, new THREE.Vector3(h, -h - 0.4, h), { size: 0.34, align: "right", color: "#c45c26" });
    put(y.left, new THREE.Vector3(-h, -h + 0.7, h), { size: 0.34, align: "right", color: "#2f6f8f" });
    put(y.right, new THREE.Vector3(-h, h, h), { size: 0.34, align: "right", color: "#2f6f8f" });
    put(z.left, new THREE.Vector3(h, -h, h - 0.4), { size: 0.34, color: "#4f7a4a" });
    put(z.right, new THREE.Vector3(h, -h, -h), { size: 0.34, color: "#4f7a4a" });
    /* Floor grid for depth. */
    const grid = new THREE.GridHelper(S, 6, 0xb8892d, 0xd8ccb8);
    grid.position.y = -S / 2;
    t.statics.add(grid);
    t.built = "space:" + state.space.join(",");
  }

  /* Which type faces to show: all nine, one, or the selected character's own type with its stress and growth types. */
  function shown(n) {
    if (state.isolate == null || state.isolate === "") return true;
    if (state.isolate === "related") {
      const c = selected();
      return !c || n === c.type || n === TYPE[c.type].stress || n === TYPE[c.type].growth;
    }
    return Number(state.isolate) === n;
  }
  function refHealth() {
    if (state.refHealth !== "follow") return Number(state.refHealth);
    const c = selected();
    return c ? nowOf(c).health : 5;
  }

  function sphere(color, r) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color }));
  }
  function line(points, color, opts) {
    opts = opts || {};
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = opts.dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: opts.opacity == null ? 1 : opts.opacity }) : new THREE.LineBasicMaterial({ color, transparent: true, opacity: opts.opacity == null ? 1 : opts.opacity });
    const l = new THREE.Line(geo, mat);
    if (opts.dashed) l.computeLineDistances();
    return l;
  }

  function drawCube(t) {
    const rh = refHealth();
    const bg = "#fffaf2";
    const colors = [];
    const lit = {};
    const fingerprints = {};
    for (let n = 1; n <= 9; n++) fingerprints[n] = typeProfile(n, rh);
    const binOf = (v) => Math.min(BINS - 1, Math.floor(v / (100 / BINS)));
    for (let n = 1; n <= 9; n++) fingerprints[n].forEach((v, row) => (lit[`${n}:${row}:${binOf(v)}`] = TYPE[n].color));
    const cast = state.characters.map((c) => ({ c, now: nowOf(c) }));
    cast.forEach(({ c, now }) => now.profile.forEach((v, row) => (lit[`0:${row}:${binOf(v)}`] = c.color)));
    const sel = selected();
    const selNow = sel ? nowOf(sel) : null;
    const reads = sel ? nearestTypes(selNow.profile, selNow.health)[0].n : null;
    for (let layer = 0; layer < 10; layer++)
      for (let row = 0; row < AX.length; row++)
        for (let bin = 0; bin < BINS; bin++) {
          const i = (layer * AX.length + row) * BINS + bin;
          const on = lit[`${layer}:${row}:${bin}`];
          const dim = layer !== 0 && !shown(layer);
          let col;
          if (on) col = mix(on, bg, dim ? 0.85 : layer === 0 ? 0.05 : 0.2);
          else if (layer === 0) col = mix("#efe4d2", bg, 0.2);
          else col = mix(TYPE[layer].color, bg, dim ? 0.97 : layer === reads ? 0.75 : 0.9);
          t.cells.setColorAt(i, col);
        }
    t.cells.instanceColor.needsUpdate = true;
    (t.layerLabels || []).forEach((s, layer) => (s.material.opacity = layer === 0 || shown(layer) ? 1 : 0.12));

    disposeGroup(t.dynamic);
    /* Type fingerprints as lines on their faces. */
    for (let n = 1; n <= 9; n++) {
      if (!shown(n)) continue;
      const pts = fingerprints[n].map((v, row) => new THREE.Vector3(valueX(v), rowY(row), layerZ(n) + 0.04));
      t.dynamic.add(line(pts, TYPE[n].color, { opacity: 0.7 }));
    }
    /* Characters on the front face, tied back to their type, bending toward stress or growth. */
    cast.forEach(({ c, now }) => {
      const isSel = c.id === state.selected;
      const pts = now.profile.map((v, row) => new THREE.Vector3(valueX(v), rowY(row), layerZ(0) + 0.06));
      t.dynamic.add(line(pts, c.color, { opacity: isSel ? 1 : 0.6 }));
      pts.forEach((p) => {
        const s = sphere(c.color, isSel ? 0.13 : 0.09);
        s.position.copy(p);
        t.dynamic.add(s);
      });
      const tag = label(c.name, { size: 0.3, color: c.color, weight: 600 });
      tag.position.set(pts[0].x + 0.2, rowY(0) + G.ROW * 0.6, layerZ(0) + 0.1);
      t.dynamic.add(tag);
      if (!isSel) return;
      const own = TYPE[c.type];
      const centre = (n) => {
        const fp = n === c.type ? typeProfile(n, now.health) : TYPE[n].profile;
        return new THREE.Vector3(valueX(fp.reduce((a, b) => a + b, 0) / fp.length), 0, layerZ(n));
      };
      const face = new THREE.Vector3(pts.reduce((a, p) => a + p.x, 0) / pts.length, 0, layerZ(0));
      t.dynamic.add(line([face, centre(c.type)], own.color, { opacity: 0.9 }));
      const k = Math.abs(now.health - 5) / 4;
      if (k > 0.02) {
        const other = now.health > 5 ? own.stress : own.growth;
        t.dynamic.add(line([centre(c.type), centre(other)], TYPE[other].color, { dashed: true, opacity: 0.25 + 0.75 * k }));
      }
    });
  }

  function drawSpace(t) {
    disposeGroup(t.dynamic);
    const S = 9;
    const idx = state.space.map((id) => AXI[id]);
    const at = (p) => new THREE.Vector3((p[idx[0]] / 100 - 0.5) * S, (p[idx[1]] / 100 - 0.5) * S, -(p[idx[2]] / 100 - 0.5) * S);
    const rh = refHealth();
    for (let n = 1; n <= 9; n++) {
      if (!shown(n)) continue;
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshBasicMaterial({ color: TYPE[n].color, transparent: true, opacity: 0.7 }));
      m.position.copy(at(typeProfile(n, rh)));
      t.dynamic.add(m);
      const l = label(String(n), { size: 0.34, color: TYPE[n].color, weight: 600 });
      l.position.copy(m.position).add(new THREE.Vector3(0.2, 0.2, 0));
      t.dynamic.add(l);
    }
    state.characters.forEach((c) => {
      const isSel = c.id === state.selected;
      const trail = [];
      for (let s = 0; s <= state.scenes - 1 + 1e-6; s += 0.125) trail.push(at(characterAt(c, s).profile));
      if (trail.length > 1) t.dynamic.add(line(trail, c.color, { opacity: isSel ? 0.9 : 0.45 }));
      for (let i = 0; i < state.scenes; i++) {
        const d = sphere(c.color, 0.07);
        d.position.copy(at(characterAt(c, i).profile));
        t.dynamic.add(d);
      }
      const now = sphere(c.color, isSel ? 0.26 : 0.19);
      now.position.copy(at(nowOf(c).profile));
      t.dynamic.add(now);
      const tag = label(c.name, { size: 0.32, color: c.color, weight: 600 });
      tag.position.copy(now.position).add(new THREE.Vector3(0.3, 0.3, 0));
      t.dynamic.add(tag);
    });
  }

  function render3D() {
    const t = three;
    if (!t) return;
    const want = state.view === "cube" ? "cube" : "space:" + state.space.join(",");
    if (t.built !== want) (state.view === "cube" ? buildCubeStatics : buildSpaceStatics)(t);
    if (state.view === "cube") drawCube(t);
    else drawSpace(t);
    const o = t.orbit;
    t.camera.position.set(o.target.x + o.r * Math.sin(o.phi) * Math.sin(o.theta), o.target.y + o.r * Math.cos(o.phi), o.target.z + o.r * Math.sin(o.phi) * Math.cos(o.theta));
    t.camera.lookAt(o.target);
    t.renderer.render(t.scene, t.camera);
  }

  /* ---------- the panels ---------- */
  let root = null;
  let playing = null;
  /* While scenes play, the view sits between two scenes. */
  let playScene = null;
  const viewScene = () => (playScene == null ? state.scene : playScene);

  function typeOptions(n) {
    return D.TYPES.map((t) => `<option value="${t.n}"${t.n === n ? " selected" : ""}>${t.n} · ${esc(t.name)}</option>`).join("");
  }
  function roleOptions(id) {
    return D.ROLES.map((r) => `<option value="${r.id}"${r.id === id ? " selected" : ""}>${esc(r.label)}</option>`).join("");
  }

  function renderCast() {
    const c = selected();
    const el = root.querySelector(".cm-cast");
    const list = state.characters
      .map((x) => `<button type="button" class="cm-chip${x.id === state.selected ? " on" : ""}" data-pick="${esc(x.id)}" style="--c:${esc(x.color)}">${esc(x.name)} <small>${x.type}</small></button>`)
      .join("");
    let body = `<h2>Cast</h2><div class="cm-chips">${list}<button type="button" class="cm-chip add" data-act="add">+ character</button></div>`;
    if (c) {
      const sc = c.scenes[state.scene];
      const now = nowOf(c);
      const lv = levelOf(sc.health);
      body += `
        <div class="cm-row2">
          <label class="field">Name<input data-f="name" value="${esc(c.name)}" /></label>
          <label class="field">Colour<input type="color" data-f="color" value="${esc(c.color)}" /></label>
        </div>
        <label class="field">Enneagram type<select data-f="type">${typeOptions(c.type)}</select></label>
        <p class="group-label">Scene ${state.scene + 1}</p>
        <label class="field">Health: ${sc.health} · ${esc(lv.label)} (${lv.band})<input type="range" min="1" max="9" step="1" data-f="health" value="${sc.health}" /></label>
        <label class="field">Dramatic role<select data-f="role">${roleOptions(sc.role)}</select></label>
        <p class="cm-small">${esc((ROLE[sc.role] || {}).label || "")} ${esc((ROLE[sc.role] || {}).does || "")}.</p>
        <div class="cm-btns">
          <button type="button" data-act="reset">Reset nudges</button>
          <button type="button" data-act="copy-next">Copy to next scene</button>
          <button type="button" data-act="remove">Remove character</button>
        </div>
        <p class="group-label">Axes in this scene</p>
        <p class="cm-small">The dot is the type at this health. Drag to nudge this character away from it.</p>
        ${groupsOf()
          .map(
            (g) => `<p class="cm-sub">${esc(g)}</p>` +
              AX.filter((a) => a.group === g)
                .map((a) => {
                  const i = AXI[a.id];
                  const v = Math.round(now.profile[i]);
                  const b = Math.round(now.base[i]);
                  return `<label class="cm-axis" title="${esc(a.asks)}"><span>${esc(a.left)}</span><span class="cm-track"><input type="range" min="0" max="100" data-axis="${a.id}" value="${v}" /><i style="left:${b}%"></i></span><span>${esc(a.right)}</span></label>`;
                })
                .join("")
          )
          .join("")}`;
    }
    el.innerHTML = body;
  }
  function groupsOf() {
    return AX.map((a) => a.group).filter((g, i, all) => all.indexOf(g) === i);
  }

  function renderReadout() {
    const el = root.querySelector(".cm-read");
    const c = selected();
    let html = "";
    if (c) {
      const now = nowOf(c);
      const t = TYPE[c.type];
      const near = nearestTypes(now.profile, now.health);
      const b = band(now.health);
      const lv = levelOf(now.health);
      const drift = now.health > 5 ? TYPE[t.stress] : now.health < 5 ? TYPE[t.growth] : null;
      html += `<h2 style="color:${esc(c.color)}">${esc(c.name)}</h2>
        <p class="cm-type"><b style="color:${t.color}">Type ${t.n} · ${esc(t.name)}</b> at health ${now.health.toFixed(1)} (${esc(lv.label)}, ${b})</p>
        <p class="cm-small">Wants ${esc(t.desire)}. Fears ${esc(t.fear)}.</p>
        <p>${esc(t[b])}</p>
        ${drift ? `<p class="cm-drift">${now.health > 5 ? "Under stress" : "In growth"} a ${t.n} ${esc(now.health > 5 ? t.stressLooks : t.growthLooks)}, taking on traits of <b style="color:${drift.color}">${drift.n} ${esc(drift.name)}</b>.</p>` : ""}
        <p class="group-label">Reads most like</p>
        <ol class="cm-near">${near
          .slice(0, 3)
          .map((x) => `<li><b style="color:${TYPE[x.n].color}">${x.n} ${esc(TYPE[x.n].name)}</b> ${Math.round(100 - x.d)}% alike${x.n === c.type ? " (own type)" : ""}</li>`)
          .join("")}</ol>
        <p class="group-label">Role in this scene</p>
        <p>${esc((ROLE[now.role] || {}).label || now.role)}: ${esc((ROLE[now.role] || {}).does || "")}. At this health a ${t.n} tends toward ${esc(ROLE[t.roles[b]].label)}.</p>
        <p class="cm-small">Story engine: ${esc(t.engine)}</p>
        <p class="group-label">Role across scenes</p>
        <p class="cm-arc">${c.scenes.map((s, i) => `<span class="${i === state.scene ? "on" : ""}">${esc((ROLE[s.role] || {}).label || s.role)}</span>`).join(" → ")}</p>`;
    }
    const h = herd(state.scene);
    html += `<p class="group-label">The group in scene ${state.scene + 1}</p>
      <p>Herd mentality <b>${Math.round(h)}</b> of 100 <span class="cm-bar"><i style="width:${h}%"></i></span></p>
      <p class="cm-small">How conformist the cast is on average (the Conformist to Individualist axis turned around).</p>`;
    const ps = pairs(state.scene);
    if (ps.length) {
      const near = ps[0];
      const far = ps[ps.length - 1];
      const ax = AX[far.axis];
      html += `<p class="group-label">Clash and likeness</p>
        <p>Most opposed: <b>${esc(far.a.name)}</b> and <b>${esc(far.b.name)}</b>, furthest apart on ${esc(ax.left)} to ${esc(ax.right)}.</p>
        <p>Most alike: <b>${esc(near.a.name)}</b> and <b>${esc(near.b.name)}</b>, ${Math.round(100 - near.d)}% alike${near.d < 15 ? ". They may be too similar to carry separate scenes." : "."}</p>`;
    }
    el.innerHTML = html;
  }

  function renderBar() {
    const el = root.querySelector(".cm-bar-top");
    const axisOpts = (cur) => AX.map((a) => `<option value="${a.id}"${a.id === cur ? " selected" : ""}>${esc(a.left)} to ${esc(a.right)}</option>`).join("");
    el.innerHTML = `
      <div class="cm-seg">
        <button type="button" data-view="cube" class="${state.view === "cube" ? "on" : ""}">Cube</button>
        <button type="button" data-view="space" class="${state.view === "space" ? "on" : ""}">Space</button>
      </div>
      <label>Scene <input type="range" min="0" max="${state.scenes - 1}" step="1" data-f="scene" value="${state.scene}" /> <b>${state.scene + 1}</b> of
        <button type="button" data-act="scenes-" title="Fewer scenes">−</button>${state.scenes}<button type="button" data-act="scenes+" title="More scenes">+</button></label>
      <button type="button" data-act="play">${playing ? "Stop" : "Play scenes"}</button>
      <label>Type faces at <select data-f="refHealth"><option value="follow"${state.refHealth === "follow" ? " selected" : ""}>selected's health</option>${D.LEVELS.map((l) => `<option value="${l.level}"${String(state.refHealth) === String(l.level) ? " selected" : ""}>${l.level} ${esc(l.label)}</option>`).join("")}</select></label>
      <label>Show <select data-f="isolate"><option value="related"${state.isolate === "related" ? " selected" : ""}>selected's type, stress and growth</option><option value=""${state.isolate == null || state.isolate === "" ? " selected" : ""}>all nine types</option>${D.TYPES.map((t) => `<option value="${t.n}"${Number(state.isolate) === t.n ? " selected" : ""}>only ${t.n} ${esc(t.name)}</option>`).join("")}</select></label>
      ${state.view === "space" ? `<span class="cm-xyz">X <select data-space="0">${axisOpts(state.space[0])}</select> Y <select data-space="1">${axisOpts(state.space[1])}</select> Z <select data-space="2">${axisOpts(state.space[2])}</select></span>` : ""}`;
  }

  function renderAuto() {
    const el = root.querySelector(".cm-auto");
    const A = auto();
    if (!A) {
      el.innerHTML = '<h2>Automate</h2><p class="cm-note">The automation system (automation.js) is not loaded on this page.</p>';
      return;
    }
    const binding = (k) => {
      const b = A.bindings()[k];
      return b ? (b.kind === "note" ? `note ${b.num}` : b.kind === "cc" ? `CC ${b.num}` : b.code || "") : "";
    };
    const rows = AUTO.map((c) => {
      const k = "c:" + c.id;
      const p = A.patch(k);
      const choice = !c.kind;
      const field = (f, v) =>
        choice
          ? `<select data-auto="${k}" data-af="${f}">${D.ROLES.map((r) => `<option value="${r.id}"${r.id === v ? " selected" : ""}>${esc(r.label)}</option>`).join("")}</select>`
          : `<input type="number" data-auto="${k}" data-af="${f}" min="${c.min}" max="${c.max}" step="${c.step}" value="${esc(v)}" />`;
      return `<tr class="${p.running ? "run" : ""}">
        <td><button type="button" data-run="${k}">${p.running ? "■" : "▶"}</button></td>
        <td>${esc(c.label)}</td>
        <td>${field("a", p.a)}</td><td>${field("b", p.b)}</td>
        <td><select data-auto="${k}" data-af="mod"><option value="lfo"${p.mod === "lfo" ? " selected" : ""}>LFO</option><option value="manual"${p.mod === "manual" ? " selected" : ""}>Knob</option><option value="midi"${p.mod === "midi" ? " selected" : ""}>MIDI CC</option></select></td>
        <td>${p.mod === "lfo" ? `<select data-auto="${k}" data-af="shape">${["sine", "triangle", "square", "saw", "random"].map((s) => `<option${s === p.shape ? " selected" : ""}>${s}</option>`).join("")}</select> <input type="number" data-auto="${k}" data-af="rate" min="0.05" max="10" step="0.05" value="${p.rate}" title="Hz" />` : `<input type="range" min="0" max="1" step="0.01" data-auto="${k}" data-af="manual" value="${p.manual}" />`}</td>
        <td><button type="button" data-learn="${k}">${A.midi.learning === k ? "…move a control" : "Learn"}</button> <small>${esc(binding(k))}</small></td>
        <td><input type="number" min="0" max="127" placeholder="CC" data-auto="${k}" data-af="outCC" value="${p.outCC == null ? "" : p.outCC}" title="Send position out as this MIDI CC" /></td>
      </tr>`;
    }).join("");
    el.innerHTML = `<h2>Automate</h2>
      <p class="cm-small">Each axis, the health level and the role is a curiosity. Run one and it moves the selected character between A and B, on an LFO, a knob, or a MIDI control. A MIDI note learned here starts and stops it. These are the same patches as the Automate tab, under "Character matrix". ${esc(A.midi.status === "off" ? "" : A.midi.status)}</p>
      <div class="cm-btns"><button type="button" data-act="midi">Connect MIDI</button><button type="button" data-act="write">Write into scene</button><button type="button" data-act="stop-all">Stop all</button></div>
      <div class="cm-scroll"><table class="cm-table"><thead><tr><th></th><th>Curiosity</th><th>A</th><th>B</th><th>Driven by</th><th>Rate or position</th><th>Trigger</th><th>Out</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderAll() {
    renderBar();
    renderCast();
    renderReadout();
    renderAuto();
    dirty = true;
  }

  function commit(re) {
    normalise();
    save();
    if (re === false) {
      renderReadout();
      dirty = true;
    } else renderAll();
  }

  function newId() {
    return "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }

  function onInput(e) {
    const el = e.target;
    const c = selected();
    if (el.dataset.axis && c) {
      const i = AXI[el.dataset.axis];
      const sc = c.scenes[state.scene];
      const base = typeProfile(c.type, sc.health)[i];
      sc.offsets[el.dataset.axis] = Number(el.value) - base;
      return commit(false);
    }
    const f = el.dataset.f;
    if (f === "scene") {
      state.scene = Number(el.value);
      return commit();
    }
    if (f === "health" && c) {
      c.scenes[state.scene].health = Number(el.value);
      return commit();
    }
    if (f === "name" && c && e.type === "change") {
      c.name = el.value || "Unnamed";
      return commit();
    }
    if (f === "color" && c) {
      c.color = el.value;
      return commit(e.type === "change" ? undefined : false);
    }
    if (el.dataset.auto && e.type === "change") {
      const A = auto();
      const af = el.dataset.af;
      let v = el.value;
      if (["rate", "manual"].includes(af)) v = Number(v);
      if (af === "outCC") v = v === "" ? null : clamp(Number(v), 0, 127);
      if ((af === "a" || af === "b") && el.type === "number") v = Number(v);
      A.set(el.dataset.auto, { [af]: v });
      if (af === "mod") renderAuto();
    } else if (el.dataset.auto && el.dataset.af === "manual") {
      auto().set(el.dataset.auto, { manual: Number(el.value) });
    }
  }
  function onChange(e) {
    const el = e.target;
    const c = selected();
    const f = el.dataset.f;
    if (f === "type" && c) {
      c.type = Number(el.value);
      return commit();
    }
    if (f === "role" && c) {
      c.scenes[state.scene].role = el.value;
      return commit();
    }
    if (f === "refHealth") {
      state.refHealth = el.value === "follow" ? "follow" : Number(el.value);
      return commit();
    }
    if (f === "isolate") {
      state.isolate = el.value === "related" ? "related" : el.value ? Number(el.value) : null;
      return commit();
    }
    if (el.dataset.space) {
      state.space[Number(el.dataset.space)] = el.value;
      return commit();
    }
    if (el.dataset.import != null && el.files && el.files[0]) {
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (!data.characters) throw new Error("no cast");
          state = Object.assign(fresh(), data);
          commit();
        } catch (err) {
          alert("That file is not a Character matrix export.");
        }
      };
      r.readAsText(el.files[0]);
      el.value = "";
      return;
    }
    onInput(e);
  }
  function onClick(e) {
    const b = e.target.closest("button");
    if (!b) return;
    const c = selected();
    const A = auto();
    if (b.dataset.pick) {
      state.selected = b.dataset.pick;
      return commit();
    }
    if (b.dataset.view) {
      state.view = b.dataset.view;
      return commit();
    }
    if (b.dataset.run && A) {
      const p = A.patch(b.dataset.run);
      (p.running ? A.stop : A.start)(b.dataset.run);
      return renderAuto();
    }
    if (b.dataset.learn && A) {
      A.learn(b.dataset.learn);
      return renderAuto();
    }
    const act = b.dataset.act;
    if (act === "add") {
      const n = 1 + Math.floor(Math.random() * 9);
      const ch = { id: newId(), name: `Character ${state.characters.length + 1}`, type: n, color: TYPE[n].color, scenes: [] };
      state.characters.push(ch);
      state.selected = ch.id;
      return commit();
    }
    if (act === "remove" && c && confirm(`Remove ${c.name}?`)) {
      state.characters = state.characters.filter((x) => x !== c);
      return commit();
    }
    if (act === "reset" && c) {
      c.scenes[state.scene].offsets = {};
      return commit();
    }
    if (act === "copy-next" && c && state.scene < state.scenes - 1) {
      c.scenes[state.scene + 1] = JSON.parse(JSON.stringify(c.scenes[state.scene]));
      state.scene += 1;
      return commit();
    }
    if (act === "scenes+") {
      state.scenes += 1;
      return commit();
    }
    if (act === "scenes-" && state.scenes > 1) {
      state.scenes -= 1;
      return commit();
    }
    if (act === "play") {
      if (playing) playing = null;
      else playing = { t0: performance.now(), from: state.scene >= state.scenes - 1 ? 0 : state.scene };
      return renderBar();
    }
    if (act === "midi" && A) return A.connectMidi().then(renderAuto);
    if (act === "stop-all" && A) {
      AUTO.forEach((x) => A.patch("c:" + x.id).running && A.stop("c:" + x.id));
      return commit();
    }
    if (act === "write" && c) {
      const now = nowOf(c);
      const sc = c.scenes[state.scene];
      sc.health = Math.round(now.health);
      sc.role = now.role;
      const base = typeProfile(c.type, sc.health);
      sc.offsets = {};
      now.profile.forEach((v, i) => {
        const d = Math.round(v - base[i]);
        if (d) sc.offsets[AX[i].id] = d;
      });
      return commit();
    }
    if (act === "export") {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "character-matrix.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
    if (act === "import") return root.querySelector("[data-import]").click();
    if (act === "example" && confirm("Replace the cast with the example cast?")) {
      state = fresh();
      return commit();
    }
  }

  let dirty = true;
  let lastRead = 0;
  function frame(now) {
    const A = auto();
    const runningHere = A && AUTO.some((c) => A.patch("c:" + c.id).running);
    if (playing) {
      /* rAF time can be a little older than the click that started playing. */
      const s = playing.from + Math.max(0, now - playing.t0) / 1200;
      if (s >= state.scenes - 1) {
        playing = null;
        state.scene = state.scenes - 1;
        renderAll();
      } else {
        const whole = Math.floor(s);
        if (whole !== state.scene) {
          state.scene = whole;
          renderBar();
          renderCast();
        }
        playScene = s;
      }
      dirty = true;
    } else playScene = null;
    if (runningHere) dirty = true;
    if (dirty && three) {
      render3D();
      dirty = false;
    } else if (three) {
      three.renderer.render(three.scene, three.camera);
      updateCamera();
    }
    if ((runningHere || playing) && now - lastRead > 200) {
      lastRead = now;
      renderReadout();
    }
    requestAnimationFrame(frame);
  }
  function updateCamera() {
    const o = three.orbit;
    three.camera.position.set(o.target.x + o.r * Math.sin(o.phi) * Math.sin(o.theta), o.target.y + o.r * Math.cos(o.phi), o.target.z + o.r * Math.sin(o.phi) * Math.cos(o.theta));
    three.camera.lookAt(o.target);
  }

  function mount(el) {
    if (root) return root;
    load();
    registerCuriosities();
    root = el;
    el.classList.add("cm");
    el.innerHTML = `
      <div class="cm-head">
        <div>
          <h2>Character matrix</h2>
          <p class="cm-small">Front face: who the character is, axis by axis. Depth: the nine Enneagram types, each a fingerprint across the same axes. Health bends a type toward its stress type or its growth type. Drag to turn, scroll to zoom.</p>
        </div>
        <div class="cm-btns"><button type="button" data-act="export">Export</button><button type="button" data-act="import">Import</button><button type="button" data-act="example">Example cast</button><input type="file" accept="application/json" data-import hidden /></div>
      </div>
      <div class="cm-grid">
        <aside class="cm-cast"></aside>
        <div class="cm-stage"><div class="cm-bar-top"></div><div class="cm-view"></div></div>
        <aside class="cm-read"></aside>
      </div>
      <section class="cm-auto"></section>`;
    el.addEventListener("input", onInput);
    el.addEventListener("change", onChange);
    el.addEventListener("click", onClick);
    three = initThree(el.querySelector(".cm-view"));
    const A = auto();
    if (A)
      A.on((type, data) => {
        if (type === "learned" || type === "midi-status") renderAuto();
        else if (type === "change" && data && String(data.key).startsWith("c:cm-")) {
          dirty = true;
          const run = root.querySelector(`[data-run="${data.key}"]`);
          if (run && run.textContent !== (A.patch(data.key).running ? "■" : "▶")) renderAuto();
        }
      });
    renderAll();
    requestAnimationFrame(frame);
    return el;
  }

  /* Register the curiosities as soon as the script loads, so the Automate tab lists them before the workspace opens. */
  registerCuriosities();

  window.CharacterMatrix = {
    mount,
    data: D,
    typeProfile,
    nearestTypes,
    characterAt: (ch, s) => characterAt(ch, s),
    curiosities: AUTO.map((c) => c.id),
    state: () => state,
  };
})();
