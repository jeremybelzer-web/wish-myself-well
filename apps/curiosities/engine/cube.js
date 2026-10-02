/* engine/cube.js: the clip matrix, and the cube it becomes (the letter, part 3; Jeremy's words #13). A way of seeing and wiring
   what the engine already holds: a cell is a clip (one track at one moment), a layer is a curiosity, a node
   is that clip's curiosity, and an edge is a link.

   - Front face: the matrix. Tracks across, moments down. Each cell is the clip: the sum of its curiosities
     (shown as how many of them are set by you, by automation, by links, by pins).
   - Step back (the arrows, a swipe, or the Left and Right keys): the layer behind is the same grid, but each
     cell now shows one curiosity of its clip, coloured by where it sits on its scale.
   - Turn: rotate the cube to see every clip's curiosities lined up behind it (drag to turn, wheel to zoom).
   - Inside (double-click): each clip is a block with a node per curiosity, and the links that fired are
     drawn between nodes. Click a node, then another, to link them (opens Links with both filled in).

   Uses three.js (r128, already loaded by the app). Without it, the same layers show as a flat grid.
   window.CurioCube = { mount(el, { onLink }), unmount() } */
(function () {
  const E = window.CurioEngine;
  const S = window.CurioScale;
  if (!E || typeof document === "undefined") return;
  const W = 1.7;
  const H = 0.62;
  const D = 1.1;
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let ctx = null;
  let layer = 0;
  let mode = "front"; /* front, turn, inside */
  let picked = null;

  function layersOf(st) {
    const out = [];
    st.tracks.forEach((t) => t.curiosities.forEach((c) => out.includes(c) || out.push(c)));
    return out;
  }
  /* A colour for a value's place on its scale: low is cool, high is warm; empty is dark. */
  function heat(p, THREE) {
    if (p == null) return new THREE.Color(0x3a332c);
    const c = new THREE.Color();
    c.setHSL(0.58 - 0.55 * p, 0.55, 0.45 + 0.1 * p);
    return c;
  }
  const WHYCOL = { source: "#f7efe2", lane: "#dce9f2", link: "#f6e2b8", edit: "#e7dcf3", off: "#9c958c" };

  function flat(el, st, res, layers) {
    const cur = layer ? layers[layer - 1] : null;
    const cols = st.tracks.length;
    let html = `<div class="en-cube-flat" style="grid-template-columns:repeat(${cols}, minmax(70px, 1fr))">`;
    st.tracks.forEach((t) => (html += `<div><b>${esc(t.label)}</b></div>`));
    st.rows.forEach((r) =>
      st.tracks.forEach((t) => {
        if (!cur) html += `<div>${t.curiosities.length} curiosities</div>`;
        else html += `<div>${t.curiosities.includes(cur) ? esc(res.dest[E.cellKey(r.id, t.id, cur)]) : ""}</div>`;
      })
    );
    el.innerHTML = html + "</div>";
  }

  function mount(host, opts) {
    unmount();
    const st = E.state();
    const res = E.result();
    const layers = layersOf(st);
    if (layer > layers.length) layer = 0;
    host.innerHTML = `<div class="en-cube-bar">
        <button data-c="prev" title="The layer in front (Left key)">◀ Layer</button>
        <b data-c="name" style="font-family:var(--mono);font-size:12px;min-width:12em"></b>
        <button data-c="next" title="The layer behind (Right key)">Layer ▶</button>
        <button data-c="front">Front face</button>
        <button data-c="turn">Turn the cube</button>
        <button data-c="inside">Inside: blocks and nodes</button>
      </div><div class="en-cube" tabindex="0" aria-label="The clip-matrix cube"><div class="en-cube-tip"></div></div>`;
    const box = host.querySelector(".en-cube");
    const tip = host.querySelector(".en-cube-tip");
    const nameEl = host.querySelector("[data-c=name]");
    const THREE = window.THREE;
    ctx = { host, box, tip, opts: opts || {}, st, res, layers, THREE, alive: true };
    const setName = () => {
      nameEl.textContent = layer ? "Layer " + layer + ": " + S.label(layers[layer - 1]) : "Front: the clips";
      host.querySelectorAll("[data-c=front],[data-c=turn],[data-c=inside]").forEach((b) => b.classList.toggle("on", b.dataset.c === mode));
    };
    setName();
    host.querySelector(".en-cube-bar").addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (!b) return;
      const c = b.dataset.c;
      if (c === "prev") layer = Math.max(0, layer - 1);
      if (c === "next") layer = Math.min(layers.length, layer + 1);
      if (c === "front" || c === "turn" || c === "inside") mode = c;
      picked = null;
      setName();
      if (ctx.redraw) ctx.redraw();
      else flat(box, st, res, layers);
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") layer = Math.min(layers.length, layer + 1);
      else if (e.key === "ArrowLeft") layer = Math.max(0, layer - 1);
      else return;
      e.preventDefault();
      setName();
      if (ctx.redraw) ctx.redraw();
      else flat(box, st, res, layers);
    });
    if (!THREE || !st.rows.length || !st.tracks.length) {
      flat(box, st, res, layers);
      box.style.background = "transparent";
      box.style.height = "auto";
      if (!THREE) tip.textContent = "three.js is not loaded, so the cube shows flat.";
      return;
    }
    build(setName);
  }

  function build(setName) {
    const { box, tip, st, res, layers, THREE } = ctx;
    const width = box.clientWidth || 800;
    const height = box.clientHeight || 560;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height);
    box.insertBefore(renderer.domElement, tip);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1712);
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 500);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(4, 6, 8);
    scene.add(sun);
    const T = st.tracks.length;
    const R = st.rows.length;
    const L = layers.length + 1;
    const xAt = (ti) => (ti - (T - 1) / 2) * W;
    const yAt = (ri) => -(ri - (R - 1) / 2) * H;
    /* Layers sit closer together when there are many, so the cube stays a cube rather than a long bar. */
    const Dz = Math.max(0.3, Math.min(D, (W * T * 1.3) / L));
    const zAt = (li) => -li * Dz;
    const group = new THREE.Group();
    scene.add(group);
    let pickables = [];

    /* The front face's words, painted on one canvas. */
    function fitText(g, text, maxW) {
      let t = String(text);
      if (g.measureText(t).width <= maxW) return t;
      while (t.length > 1 && g.measureText(t + "…").width > maxW) t = t.slice(0, -1);
      return t + "…";
    }
    function faceTexture(li) {
      const cw = Math.max(1, Math.min(220, Math.floor(4096 / T)));
      const ch = Math.max(1, Math.min(56, Math.floor(4096 / R)));
      const cv = document.createElement("canvas");
      cv.width = cw * T;
      cv.height = ch * R;
      const g = cv.getContext("2d");
      const cur = li ? layers[li - 1] : null;
      st.rows.forEach((r, ri) =>
        st.tracks.forEach((t, ti) => {
          let text = "";
          let fill = "#2b241e";
          let ink = "#f7efe2";
          if (!cur) {
            const n = { source: 0, lane: 0, link: 0, edit: 0, off: 0 };
            t.curiosities.forEach((c) => {
              const w = res.why[E.cellKey(r.id, t.id, c)] || "source";
              n[w.startsWith("link:") ? "link" : w]++;
            });
            text = t.label + " · " + r.label;
            fill = n.link ? "#5a4421" : n.edit ? "#4a3c5c" : n.lane ? "#2f4656" : "#2b241e";
            g.fillStyle = fill;
            g.fillRect(ti * cw + 1, ri * ch + 1, cw - 2, ch - 2);
            g.fillStyle = ink;
            g.font = Math.round(ch * 0.3) + "px sans-serif";
            g.fillText(fitText(g, text, cw - 12), ti * cw + 6, ri * ch + ch * 0.42);
            g.font = Math.round(ch * 0.26) + "px monospace";
            g.fillStyle = "#d9c9ad";
            g.fillText(fitText(g, t.curiosities.length + " curiosities" + (n.link ? ", " + n.link + " by links" : "") + (n.edit ? ", " + n.edit + " pinned" : ""), cw - 12), ti * cw + 6, ri * ch + ch * 0.8);
            return;
          }
          if (!t.curiosities.includes(cur)) {
            g.fillStyle = "#231d18";
            g.fillRect(ti * cw + 1, ri * ch + 1, cw - 2, ch - 2);
            return;
          }
          const k = E.cellKey(r.id, t.id, cur);
          const v = res.dest[k];
          const p = S.pos(cur, v);
          g.fillStyle = "#" + heat(p, THREE).getHexString();
          g.fillRect(ti * cw + 1, ri * ch + 1, cw - 2, ch - 2);
          const w = res.why[k] || "source";
          g.fillStyle = WHYCOL[w.startsWith("link:") ? "link" : w] || ink;
          g.fillRect(ti * cw + 1, ri * ch + 1, 5, ch - 2);
          g.fillStyle = "#fffaf2";
          g.font = Math.round(ch * 0.36) + "px sans-serif";
          g.fillText(fitText(g, v == null ? "off" : v, cw - 16), ti * cw + 10, ri * ch + ch * 0.6);
        })
      );
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;
      return tex;
    }

    function clear() {
      while (group.children.length) {
        const o = group.children.pop();
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      }
      pickables = [];
    }
    const dummy = new THREE.Object3D();
    function slab(li, opacity) {
      const cur = li ? layers[li - 1] : null;
      const geo = new THREE.BoxGeometry(W * 0.94, H * 0.9, Dz * 0.6);
      const mat = new THREE.MeshLambertMaterial({ transparent: opacity < 1, opacity });
      const mesh = new THREE.InstancedMesh(geo, mat, T * R);
      const cells = [];
      st.rows.forEach((r, ri) =>
        st.tracks.forEach((t, ti) => {
          const i = cells.length;
          dummy.position.set(xAt(ti), yAt(ri), zAt(li));
          dummy.scale.set(1, 1, cur && !t.curiosities.includes(cur) ? 0.15 : 1);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          const p = cur ? S.pos(cur, res.dest[E.cellKey(r.id, t.id, cur)]) : 0.5;
          mesh.setColorAt(i, cur && t.curiosities.includes(cur) ? heat(p, THREE) : new THREE.Color(cur ? 0x2a231d : 0x6b5a47));
          cells.push({ li, ri, ti });
        })
      );
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.userData.cells = cells;
      group.add(mesh);
      pickables.push(mesh);
    }
    function face(li) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(W * T, H * R), new THREE.MeshBasicMaterial({ map: faceTexture(li), transparent: false }));
      plane.position.set(0, 0, zAt(li) + Dz * 0.31);
      group.add(plane);
    }
    /* Inside: a block per clip, a node per curiosity, edges for the links that fired. */
    function inside() {
      const geo = new THREE.BoxGeometry(W * 0.9, H * 0.86, D * 1.6);
      const mat = new THREE.MeshLambertMaterial({ color: 0x6b5a47, transparent: true, opacity: 0.18, depthWrite: false });
      const blocks = new THREE.InstancedMesh(geo, mat, T * R);
      let b = 0;
      const nodePos = {};
      const nodes = [];
      st.rows.forEach((r, ri) =>
        st.tracks.forEach((t, ti) => {
          dummy.position.set(xAt(ti), yAt(ri), -D * 0.8);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          blocks.setMatrixAt(b++, dummy.matrix);
          const n = t.curiosities.length;
          const cols = Math.max(1, Math.ceil(Math.sqrt(n * 2.5)));
          const rows = Math.max(1, Math.ceil(n / cols));
          t.curiosities.forEach((c, k) => {
            const cx = k % cols;
            const cy = Math.floor(k / cols);
            const pos = new THREE.Vector3(xAt(ti) + (cx - (cols - 1) / 2) * ((W * 0.8) / cols), yAt(ri) - (cy - (rows - 1) / 2) * ((H * 0.75) / rows), -D * 0.8 + (k / Math.max(1, n - 1) - 0.5) * D);
            nodePos[E.cellKey(r.id, t.id, c)] = pos;
            nodes.push({ pos, row: r.id, track: t.id, curiosity: c });
          });
        })
      );
      blocks.instanceMatrix.needsUpdate = true;
      group.add(blocks);
      const sg = new THREE.SphereGeometry(Math.min(0.07, (W * 0.8) / 14), 10, 8);
      const nm = new THREE.InstancedMesh(sg, new THREE.MeshLambertMaterial(), Math.max(1, nodes.length));
      nodes.forEach((nd, i) => {
        dummy.position.copy(nd.pos);
        const isPicked = picked && picked.track === nd.track && picked.curiosity === nd.curiosity && picked.row === nd.row;
        dummy.scale.setScalar(isPicked ? 2.2 : 1);
        dummy.updateMatrix();
        nm.setMatrixAt(i, dummy.matrix);
        const v = res.dest[E.cellKey(nd.row, nd.track, nd.curiosity)];
        nm.setColorAt(i, isPicked ? new THREE.Color(0xffffff) : heat(S.pos(nd.curiosity, v), THREE));
      });
      nm.count = nodes.length;
      nm.instanceMatrix.needsUpdate = true;
      if (nm.instanceColor) nm.instanceColor.needsUpdate = true;
      nm.userData.nodes = nodes;
      group.add(nm);
      pickables.push(nm);
      /* Edges: every link that fired, and the picked node's own links. */
      const pts = [];
      res.events.forEach((e) => {
        const l = st.links.find((x) => x.id === e.link);
        if (!l) return;
        const a = nodePos[E.cellKey(e.fromRow, l.from.track, l.from.curiosity)];
        const z = nodePos[E.cellKey(e.toRow, l.to.track, l.to.curiosity)];
        if (a && z) pts.push(a, z);
      });
      if (pts.length) group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xe0a33a, transparent: true, opacity: 0.85 })));
      if (picked) {
        const mine = [];
        const ix = {};
        st.rows.forEach((r, i) => (ix[r.id] = i));
        st.links.forEach((l) => {
          const lead = l.from.track === picked.track && l.from.curiosity === picked.curiosity;
          const foll = l.to.track === picked.track && l.to.curiosity === picked.curiosity;
          if (!lead && !foll) return;
          const i = ix[picked.row];
          const fromRow = lead ? i : i - l.within;
          const toRow = lead ? i + l.within : i;
          if (fromRow < 0 || toRow >= R) return;
          const a = nodePos[E.cellKey(st.rows[fromRow].id, l.from.track, l.from.curiosity)];
          const z = nodePos[E.cellKey(st.rows[toRow].id, l.to.track, l.to.curiosity)];
          if (a && z) mine.push(a, z);
        });
        if (mine.length) group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(mine), new THREE.LineBasicMaterial({ color: 0xffffff })));
      }
    }

    /* The camera turns around the middle of the cube. */
    const view = { theta: 0, phi: 0, radius: 1, tTheta: 0, tPhi: 0, tRadius: 1, zoom: 1 };
    function fit() {
      const tan = Math.tan((camera.fov * Math.PI) / 360);
      const aspect = (box.clientWidth || width) / (box.clientHeight || height);
      let r;
      if (mode === "front") r = Math.max((H * R) / 2 / tan, (W * T) / 2 / (tan * aspect)) * 1.15 + Dz;
      else {
        const depth = mode === "inside" ? D * 1.6 : Dz * L;
        const sphere = Math.sqrt((W * T) ** 2 + (H * R) ** 2 + depth ** 2) / 2;
        r = (sphere / Math.min(tan, tan * aspect)) * 1.05;
      }
      view.tRadius = r * view.zoom;
    }
    function aim(m) {
      if (m === "front") {
        view.tTheta = 0;
        view.tPhi = 0;
      } else if (m === "turn") {
        view.tTheta = -0.75;
        view.tPhi = 0.32;
      } else {
        view.tTheta = -0.45;
        view.tPhi = 0.22;
      }
      fit();
    }
    function redraw() {
      clear();
      if (mode === "inside") inside();
      else if (mode === "front") {
        for (let li = layer; li < L; li++) slab(li, li === layer ? 1 : 0.5);
        face(layer);
      } else {
        for (let li = 0; li < L; li++) slab(li, li === layer ? 1 : 0.55);
        face(layer);
      }
      aim(mode);
      if (setName) setName();
    }
    ctx.redraw = redraw;
    redraw();
    view.theta = view.tTheta;
    view.phi = view.tPhi;
    view.radius = view.tRadius;

    const centerZ = () => (mode === "inside" ? -D * 0.8 : mode === "front" ? zAt(layer) : zAt((L - 1) / 2));
    function place() {
      const cz = centerZ();
      camera.position.set(view.radius * Math.sin(view.theta) * Math.cos(view.phi), view.radius * Math.sin(view.phi), cz + view.radius * Math.cos(view.theta) * Math.cos(view.phi));
      camera.lookAt(0, 0, cz);
    }
    function frame() {
      if (!ctx || !ctx.alive) return;
      view.theta += (view.tTheta - view.theta) * 0.15;
      view.phi += (view.tPhi - view.phi) * 0.15;
      view.radius += (view.tRadius - view.radius) * 0.15;
      place();
      renderer.render(scene, camera);
      ctx.raf = requestAnimationFrame(frame);
    }
    frame();

    /* Drag to turn (or, on the front face, a quick sideways swipe to change layer), wheel to zoom. */
    const ray = new THREE.Raycaster();
    let drag = null;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, t: Date.now(), theta: view.tTheta, phi: view.tPhi, moved: false };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        if (mode !== "front" && drag.moved) {
          view.tTheta = drag.theta - dx * 0.008;
          view.tPhi = Math.max(-1.3, Math.min(1.3, drag.phi + dy * 0.008));
        }
        return;
      }
      const hit = pick(e);
      tip.textContent = hit ? hit.text : mode === "inside" ? "Click a node, then another, to link them." : "Drag to turn, wheel to zoom, double-click to go inside.";
    });
    el.addEventListener("pointerup", (e) => {
      const d = drag;
      drag = null;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (mode === "front" && d.moved && Math.abs(dx) > 40 && Date.now() - d.t < 600) {
        layer = dx < 0 ? Math.min(L - 1, layer + 1) : Math.max(0, layer - 1);
        redraw();
        return;
      }
      if (!d.moved && mode === "inside") {
        const hit = pick(e);
        if (!hit || !hit.node) return;
        if (picked && !(picked.track === hit.node.track && picked.curiosity === hit.node.curiosity)) {
          const from = { track: picked.track, curiosity: picked.curiosity };
          const to = { track: hit.node.track, curiosity: hit.node.curiosity };
          picked = null;
          if (ctx.opts.onLink) ctx.opts.onLink(from, to);
          return;
        }
        picked = hit.node;
        redraw();
      }
    });
    el.addEventListener("dblclick", () => {
      mode = mode === "inside" ? "front" : "inside";
      picked = null;
      redraw();
    });
    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        view.zoom = Math.max(0.25, Math.min(3, view.zoom * (e.deltaY > 0 ? 1.1 : 0.9)));
        fit();
      },
      { passive: false }
    );
    function pick(e) {
      const r = el.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hits = ray.intersectObjects(pickables);
      if (!hits.length) return null;
      const h = hits[0];
      if (h.object.userData.nodes) {
        const nd = h.object.userData.nodes[h.instanceId];
        if (!nd) return null;
        const t = st.tracks.find((x) => x.id === nd.track);
        const r2 = st.rows.find((x) => x.id === nd.row);
        const v = res.dest[E.cellKey(nd.row, nd.track, nd.curiosity)];
        return { node: nd, text: (t ? t.label : "") + " · " + (r2 ? r2.label : "") + " · " + S.label(nd.curiosity) + ": " + (v == null ? "off" : v) + (picked ? "  (click to link from " + S.label(picked.curiosity) + ")" : "") };
      }
      const c = h.object.userData.cells && h.object.userData.cells[h.instanceId];
      if (!c) return null;
      const t = st.tracks[c.ti];
      const r2 = st.rows[c.ri];
      if (!c.li) return { text: t.label + " · " + r2.label + ": " + t.curiosities.length + " curiosities" };
      const cur = layers[c.li - 1];
      const v = res.dest[E.cellKey(r2.id, t.id, cur)];
      return { text: t.label + " · " + r2.label + " · " + S.label(cur) + ": " + (t.curiosities.includes(cur) ? (v == null ? "off" : v) : "not on this track") };
    }
    const onResize = () => {
      const w = box.clientWidth || width;
      const h = box.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    ctx.cleanup = () => {
      window.removeEventListener("resize", onResize);
      clear();
      renderer.dispose();
    };
  }

  function unmount() {
    if (!ctx) return;
    ctx.alive = false;
    if (ctx.raf) cancelAnimationFrame(ctx.raf);
    if (ctx.cleanup) ctx.cleanup();
    ctx = null;
  }

  /* Redraw with the new film after every change while the cube is open. */
  E.on(() => {
    if (!ctx || !ctx.alive || !document.body.contains(ctx.box)) return;
    const host = ctx.host;
    const opts = ctx.opts;
    mount(host, opts);
  });

  window.CurioCube = { mount, unmount, layers: () => layersOf(E.state()) };
})();
