/* 3D characters in the Viewer (Jeremy, 2026-10-04 22:06Z: "we want 3D characters both selectable and draw-able
   and tweak-able modifiable").

   A person in the Viewer can be played by a 3D character instead of the block figure: the Plain figure's
   skeleton (rig/, the 3D characters) dressed by "Make a character from words" (rig/maker.js). It is drawn by the
   Viewer itself, face by face like every other thing, so it sits in the same world: it hides behind things, the
   fisheye and the lens bend it, the color filters, blur and comic look reach it, and clicking it picks it.

   - Turn it on per person with the 3D button in "In the scene" (object.rig, the whole film), or per panel
     (place.rig = true or false, written by Draw & build).
   - Its look: place.look (words, per panel), else object.look, else words made from the person's own colors;
     then place.lookParts (or object.lookParts) changes single parts of what maker.read() made of the words
     (hair, hairColor, top, topColor, bottom, bottomColor, feet, shoesColor, hat, hatColor, skin, build, height,
     kid, old ... the maker's own names; a color may be a number or a word like "red").
   - Its pose: the same pose as the block figure (standing, walking, sitting, waving, and every pose Draw & build
     adds), from CurioViewer.limbs(pose, phase): the arms and legs of the skeleton are turned to those angles.
   - Its face: the mouth follows the People tab's feeling in that panel (smiling, grumpy, surprised, serious).
   The 3D files load on first use (CurioRig.load(), three.js from cdnjs); until then the block figure stands in.
   Each look is built once and kept; its surfaces are simplified (points closer than 4.5 cm merged, less on small
   pieces like eyes) so a scene still plays smoothly.

   API: window.CurioRigActors { on(objectId, panelIndex) -> bool, set(objectId, bool) (whole film, one undo
   step), ready(objectId) -> bool, plan(objectId, panelIndex) -> what maker.read made of the look, words(object),
   load() -> Promise, faces(objectId) -> how many faces the last drawing used }. */
(function () {
  "use strict";
  if (window.CurioRigActors) return;
  const V = () => window.CurioViewer;
  const DEG = Math.PI / 180;
  const CELL = 0.045; /* metres: points closer than this are merged */
  const FIGURE = "rig/models/rigged-figure.glb";
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  /* ---------- loading the 3D files, once ---------- */
  let loading = null;
  let failed = "";
  let figureBuf = null;
  function script(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error("could not load " + src));
      document.head.appendChild(s);
    });
  }
  function load() {
    if (loading) return loading;
    loading = (async () => {
      const R = window.CurioRig;
      if (!R) throw new Error("the 3D characters are not in this page");
      if (R.load) await R.load();
      if (!window.THREE) await script(THREE_URL);
      if (!window.THREE.GLTFLoader) await script("rig/GLTFLoader.js");
      const res = await fetch(FIGURE);
      if (!res.ok) throw new Error("could not load the Plain figure");
      figureBuf = await res.arrayBuffer();
    })().catch((e) => {
      failed = String((e && e.message) || e);
      loading = null;
      throw e;
    });
    return loading;
  }

  /* ---------- which people are 3D, and their look ---------- */
  const film = () => V().live().film;
  const objOf = (id) => film().objects.find((o) => o.id === id);
  function panelOf(place, id) {
    const P = film().panels;
    const k = P.findIndex((p) => p.place && p.place[id] === place);
    return k >= 0 ? k : V().live().cur;
  }
  function on(id, i) {
    const o = objOf(id);
    if (!o || o.kind !== "person") return false;
    const P = film().panels;
    const pl = P[i == null ? V().live().cur : i];
    const q = pl && pl.place && pl.place[id];
    if (q && typeof q.rig === "boolean") return q.rig;
    return !!o.rig;
  }
  /* the person's own colors, in words the maker reads */
  const NAMES = [
    ["black", [20, 20, 20]], ["white", [240, 240, 240]], ["gray", [128, 128, 128]], ["red", [200, 48, 44]], ["orange", [230, 128, 50]], ["yellow", [235, 200, 60]], ["green", [60, 140, 70]],
    ["blue", [50, 110, 220]], ["navy", [31, 47, 102]], ["purple", [120, 70, 160]], ["pink", [230, 120, 170]], ["brown", [110, 70, 40]], ["tan", [200, 160, 110]],
  ];
  function colorWord(hex) {
    const m = /^#?([0-9a-f]{6})/i.exec(hex || "");
    if (!m) return "";
    const n = parseInt(m[1], 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    let best = NAMES[0];
    let bd = 1e9;
    NAMES.forEach((x) => {
      const d = (x[1][0] - c[0]) ** 2 + (x[1][1] - c[1]) ** 2 + (x[1][2] - c[2]) ** 2;
      if (d < bd) (bd = d), (best = x);
    });
    return best[0];
  }
  const num = (hex) => {
    const m = /^#?([0-9a-f]{6})/i.exec(hex || "");
    return m ? parseInt(m[1], 16) : null;
  };
  function words(o) {
    if (o.look && typeof o.look === "string") return o.look;
    return `short ${colorWord(o.hair || "#1d1712")} hair, a ${colorWord(o.color || "#4a7bd0")} t-shirt, ${colorWord(o.pants || "#2d2f3a")} trousers and shoes`;
  }
  function plan(id, i) {
    const o = objOf(id);
    const R = window.CurioRig;
    if (!o || !R || !R.maker) return null;
    const P = film().panels;
    const q = (P[i == null ? V().live().cur : i] || {}).place;
    const pl = q && q[id];
    const text = pl && typeof pl.look === "string" && pl.look.trim() ? pl.look : words(o);
    const p = R.maker.read(text);
    /* without words of their own, the colors are exactly the person's */
    if (!(pl && pl.look) && !o.look) {
      const set = (k, hex) => num(hex) != null && (p[k] = num(hex));
      set("hairColor", o.hair || "#1d1712");
      set("topColor", o.color);
      set("bottomColor", o.pants || "#2d2f3a");
      set("skin", o.skin || "#c98d63");
    }
    const parts = Object.assign({}, o.lookParts || {}, (pl && pl.lookParts) || {});
    Object.keys(parts).forEach((k) => {
      let v = parts[k];
      if (/Color$|^skin$/.test(k) && typeof v === "string") {
        const r = R.maker.read("a " + v + " t-shirt");
        v = v.charAt(0) === "#" ? num(v) : r.topColor;
      }
      if (v != null) p[k] = v;
    });
    /* the mouth follows the feeling in the People tab */
    const P2 = window.CurioPeople;
    if (P2 && P2.at) {
      try {
        const E = P2.emotionOf(P2.at(i == null ? V().live().cur : i, id).emo);
        const f = E.family;
        if (E.r >= 0.12) p.mouth = /joy|trust|love|optimism|anticipation/.test(f) ? "smile" : /anger|disgust|contempt|aggressiveness|disapproval/.test(f) ? "grumpy" : /surprise|fear|awe/.test(f) ? "surprised" : "serious";
      } catch (e) {}
    }
    return p;
  }

  /* ---------- building a look: the figure, dressed, measured into simple surfaces ---------- */
  const built = new Map(); /* key (the plan) -> body */
  const building = new Set();
  const lastFaces = {};
  function keyOf(p) {
    return JSON.stringify(p, (k, v) => (k === "said" ? undefined : v));
  }
  async function build(key, p) {
    const T = window.THREE;
    const R = window.CurioRig;
    const gltf = await new Promise((res, rej) => new T.GLTFLoader().parse(figureBuf.slice(0), "", res, rej));
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(model);
    const size = box.getSize(new T.Vector3());
    model.scale.multiplyScalar(1.7 / Math.max(size.y, 1e-6));
    model.updateMatrixWorld(true);
    const b2 = new T.Box3().setFromObject(model);
    const c = b2.getCenter(new T.Vector3());
    model.position.x -= c.x;
    model.position.z -= c.z;
    model.position.y -= b2.min.y;
    model.updateMatrixWorld(true);
    const bones = [];
    model.traverse((o) => o.isSkinnedMesh && o.skeleton.bones.forEach((b) => !bones.includes(b) && bones.push(b)));
    const rig = R.classify(bones);
    const data = {};
    const ctx = { THREE: T, model, rig, bones, data: (id) => (data[id] = data[id] || {}), prefs: { character: "made" } };
    R.maker.make(ctx, p);
    model.updateMatrixWorld(true);
    /* every visible piece, simplified once, in its own space */
    const meshes = [];
    model.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || !o.visible) return;
      let hidden = false;
      for (let a = o; a; a = a.parent) if (a.visible === false) hidden = true;
      if (hidden || !o.geometry || !o.geometry.attributes.position) return;
      /* merged in the figure's own space (pieces may be stretched); small pieces (eyes, buttons) keep their
         shape (never merged more than a third of their size), and no piece keeps more faces than it needs to read
         (BUDGET: the head and hair get more) */
      const wb = new T.Box3().setFromObject(o);
      const ws = wb.getSize(new T.Vector3());
      const big = Math.max(ws.x, ws.y, ws.z);
      const budget = big > 0.22 ? 110 : 44;
      const pos = o.geometry.attributes.position;
      const idx = o.geometry.index;
      const world = [];
      const w = new T.Vector3();
      for (let k = 0; k < pos.count; k++) {
        w.set(pos.getX(k), pos.getY(k), pos.getZ(k)).applyMatrix4(o.matrixWorld);
        world.push([w.x, w.y, w.z]);
      }
      const simplify = (cell) => {
        const map = new Map();
        const verts = [];
        const vid = (k) => {
          const q = world[k];
          const g = Math.round(q[0] / cell) + "," + Math.round(q[1] / cell) + "," + Math.round(q[2] / cell);
          let n = map.get(g);
          if (n == null) {
            n = verts.length;
            map.set(g, n);
            verts.push([pos.getX(k), pos.getY(k), pos.getZ(k), 1]);
          } else {
            const v = verts[n];
            v[0] += pos.getX(k);
            v[1] += pos.getY(k);
            v[2] += pos.getZ(k);
            v[3]++;
          }
          return n;
        };
        const tris = [];
        const seen = new Set();
        const count = idx ? idx.count : pos.count;
        for (let k = 0; k + 2 < count; k += 3) {
          const a = vid(idx ? idx.getX(k) : k);
          const b = vid(idx ? idx.getX(k + 1) : k + 1);
          const d = vid(idx ? idx.getX(k + 2) : k + 2);
          if (a === b || b === d || a === d) continue;
          const t = [a, b, d].sort((x, y) => x - y).join(",");
          if (seen.has(t)) continue;
          seen.add(t);
          tris.push([a, b, d]);
        }
        return { verts, tris };
      };
      let cell = Math.max(0.004, Math.min(CELL, big / 3));
      let got = simplify(cell);
      for (let tries = 0; tries < 6 && got.tris.length > budget && cell < big / 2.2; tries++) {
        cell *= 1.3;
        const next = simplify(cell);
        if (next.tris.length < 4) break;
        got = next;
      }
      const { verts, tris } = got;
      if (!tris.length) return;
      verts.forEach((v) => ((v[0] /= v[3]), (v[1] /= v[3]), (v[2] /= v[3])));
      const m = o.material || {};
      const col = m.color ? "#" + m.color.getHexString() : "#888888";
      const P = o.geometry.parameters || {};
      const open = m.side === T.DoubleSide || P.openEnded || (P.thetaLength != null && P.thetaLength < Math.PI * 2 - 0.01 && o.geometry.type !== "CylinderGeometry") || (P.phiLength != null && P.phiLength < Math.PI * 2 - 0.01) || (P.arc != null && P.arc < Math.PI * 2 - 0.01);
      const glow = !!(m.emissive && m.emissive.getHex && m.emissive.getHex() > 0x202020);
      meshes.push({ mesh: o, verts: verts.map((v) => new T.Vector3(v[0], v[1], v[2])), tris, color: col, two: !!open, glow });
    });
    /* each limb: the joints from the shoulder or hip down, their rest turns and directions */
    const rest = new Map();
    bones.forEach((b) => rest.set(b, b.quaternion.clone()));
    const limb = (list) => {
      /* skip a collarbone: the limb starts at the joint whose child is farthest from it */
      const L = list.slice();
      if (L.length > 3) L.shift();
      return L;
    };
    const body = { model, rig, bones, rest, meshes, arms: { L: limb(rig.arms.L), R: limb(rig.arms.R) }, legs: { L: rig.legs.L.slice(), R: rig.legs.R.slice() }, hipsY: rig.hips ? rig.hips.getWorldPosition(new T.Vector3()).y : 0.9, inv: new T.Matrix4() };
    built.set(key, body);
    return body;
  }
  function bodyFor(id, i) {
    if (!figureBuf || !window.THREE) return null;
    const p = plan(id, i);
    if (!p) return null;
    const key = keyOf(p);
    const b = built.get(key);
    if (b) return b;
    if (!building.has(key)) {
      building.add(key);
      build(key, p)
        .catch((e) => console.warn("3D character: " + e.message))
        .then(() => {
          building.delete(key);
          V().redraw();
        });
    }
    return null;
  }

  /* ---------- posing: the limbs turned to the pose's angles ---------- */
  const tmp = {};
  function aimBone(b, child, dir) {
    const T = window.THREE;
    tmp.a = tmp.a || new T.Vector3();
    tmp.c = tmp.c || new T.Vector3();
    tmp.q = tmp.q || new T.Quaternion();
    tmp.pq = tmp.pq || new T.Quaternion();
    tmp.wq = tmp.wq || new T.Quaternion();
    b.updateMatrixWorld(true);
    const a = b.getWorldPosition(tmp.a);
    const c = child.getWorldPosition(tmp.c).sub(a);
    if (c.lengthSq() < 1e-10) return;
    c.normalize();
    /* turn in the world from where it points now to where it should point, then back into the joint's own terms */
    tmp.q.setFromUnitVectors(c, dir);
    b.getWorldQuaternion(tmp.wq);
    tmp.q.multiply(tmp.wq);
    if (b.parent) b.parent.getWorldQuaternion(tmp.pq).invert();
    else tmp.pq.identity();
    b.quaternion.copy(tmp.pq.multiply(tmp.q));
    b.updateMatrixWorld(true);
  }
  /* the direction a limb points: straight down, swung about x (forward is negative) and out about z */
  function dirOf(rx, rz) {
    const T = window.THREE;
    let v = [0, -1, 0];
    if (rz) {
      const s = Math.sin(rz * DEG);
      const c = Math.cos(rz * DEG);
      v = [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
    }
    if (rx) {
      const s = Math.sin(rx * DEG);
      const c = Math.cos(rx * DEG);
      v = [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    }
    return new T.Vector3(v[0], v[1], v[2]).normalize();
  }
  function pose(body, L) {
    body.bones.forEach((b) => b.quaternion.copy(body.rest.get(b)));
    body.model.updateMatrixWorld(true);
    const chainTo = (list, dirs) => {
      for (let k = 0; k < Math.min(dirs.length, list.length - 1); k++) aimBone(list[k], list[k + 1], dirs[k]);
    };
    /* arm B is the figure's left (+x), arm A its right; wave lifts the left arm out, waveL the right */
    chainTo(body.arms.L, [dirOf(L.armB, L.wave), dirOf(L.armB, L.wave)]);
    chainTo(body.arms.R, [dirOf(L.armA, -L.waveL), dirOf(L.armA, -L.waveL)]);
    if (L.sit) {
      const fwd = new window.THREE.Vector3(0, 0, 1);
      const down = new window.THREE.Vector3(0, -1, 0);
      chainTo(body.legs.L, [fwd, down]);
      chainTo(body.legs.R, [fwd, down]);
    } else {
      chainTo(body.legs.L, [dirOf(L.legB, 0), dirOf(L.legB, 0)]);
      chainTo(body.legs.R, [dirOf(L.legA, 0), dirOf(L.legA, 0)]);
    }
    body.model.updateMatrixWorld(true);
  }

  /* ---------- the Viewer draws it ---------- */
  function parts(prev, def, place, phase) {
    if (def.kind !== "person") return prev;
    const i = panelOf(place, def.id);
    if (!on(def.id, i)) return prev;
    if (!figureBuf) {
      if (!failed) load().then(() => V().redraw(), () => V().redraw());
      return prev;
    }
    const body = bodyFor(def.id, i);
    if (!body) return prev;
    const L = V().limbs ? V().limbs(place.pose || "stand", phase) : { legA: 0, legB: 0, armA: 0, armB: 0, wave: 0, waveL: 0, drop: 0, sit: false };
    pose(body, L);
    const T = window.THREE;
    /* the figure's own space: feet on the floor at 0, facing +z, like the block figure */
    body.inv.copy(body.model.parent ? body.model.parent.matrixWorld : new T.Matrix4()).invert();
    const drop = L.sit ? -(body.hipsY - 0.48) : L.drop || 0;
    const out = [];
    const v = new T.Vector3();
    const m = new T.Matrix4();
    let n = 0;
    body.meshes.forEach((M) => {
      m.multiplyMatrices(body.inv, M.mesh.matrixWorld);
      const pts = M.verts.map((p) => {
        v.copy(p).applyMatrix4(m);
        return [v.x, v.y + drop, v.z];
      });
      const c = [0, 0, 0];
      pts.forEach((q) => ((c[0] += q[0]), (c[1] += q[1]), (c[2] += q[2])));
      c[0] /= pts.length;
      c[1] /= pts.length;
      c[2] /= pts.length;
      n += M.tris.length;
      out.push({ poly: M.tris.map((t) => [pts[t[0]], pts[t[1]], pts[t[2]]]), center: c, color: M.color, two: M.two, glow: M.glow, soft: true, tag: "rig" });
    });
    lastFaces[def.id] = n;
    return out;
  }

  /* ---------- the 3D button in "In the scene" ---------- */
  function set(id, v) {
    const o = objOf(id);
    if (!o || o.kind !== "person") return;
    V().remember("rig3d");
    o.rig = !!v;
    V().changed(true);
    if (v) load().then(() => V().redraw(), () => V().changed(true));
  }
  function things(box) {
    box.querySelectorAll(".cv-thing").forEach((b) => {
      const o = objOf(b.dataset.thing);
      if (!o || o.kind !== "person") return;
      const isOn = !!o.rig;
      const t = document.createElement("span");
      t.className = "cvr-3d" + (isOn ? " on" : "");
      t.dataset.cvr3d = o.id;
      t.setAttribute("role", "button");
      t.tabIndex = 0;
      t.title = isOn
        ? `${o.name} is a 3D character${failed ? " (the 3D files did not load: " + failed + ")" : ""}. Click to go back to the block figure.`
        : `Make ${o.name} a 3D character: a body with joints, dressed from words, posed like the block figure.`;
      t.textContent = "3D";
      b.appendChild(t);
    });
  }
  function onClick(e) {
    const t = e.target.closest && e.target.closest("[data-cvr3d]");
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    const o = objOf(t.dataset.cvr3d);
    if (o) set(o.id, !o.rig);
  }
  const CSS = `
.cv-root .cvr-3d { margin-left: auto; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 6px; border: 1px solid var(--c-line); color: var(--c-dim); cursor: pointer; }
.cv-root .cvr-3d.on { background: var(--c-accent); color: var(--c-ink); border-color: var(--c-accent); }
`;
  function wire() {
    const v = V();
    if (!v || !v.onParts || !v.onThings) return setTimeout(wire, 300);
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    v.onParts(parts);
    v.onThings(things);
    document.addEventListener("click", onClick, true);
    /* a saved film with 3D people starts loading them at once */
    if (film().objects.some((o) => o.rig)) load().then(() => V().redraw(), () => {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioRigActors = { on, set, ready: (id) => !!(figureBuf && built.get(keyOf(plan(id) || {}))), plan, words, load, faces: (id) => lastFaces[id] || 0, error: () => failed,
    /* for tests: the built body of a person now, and posing one */
    _parts: parts, _body: (id) => built.get(keyOf(plan(id) || {})) || null, _pose: pose };
})();
