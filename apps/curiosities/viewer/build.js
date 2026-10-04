/* Build: draw, write and build right in the Viewer's 3D picture (an add-on to viewer/viewer.js).

   Jeremy (2026-10-04): draw in the 3D space with a pencil, keep it as a drawing or let the app make it 3D, put
   words there in different fonts, helper tools for drawing, a menu of shapes and of 3D shapes, and a search
   window of everyday objects with Omnisphere-style filter columns (Household > Kitchen > Kettle). Building
   follows Roblox Studio first (Select, Move, Scale, Rotate tools with handles, snapping in steps, basic parts,
   things land on surfaces, Duplicate), then Fortnite Creative (build pieces on a big grid, ready-made sets) and
   The Sims (drag out walls and rooms, Alt places freely, copy a color from one thing to another).

   Everything made here is a thing of kind "made" in the Viewer's film (o.make says which maker draws it), so it
   moves, turns, glides between panels, saves and undoes like every other thing. Cheap on purpose: simple
   shapes the app draws itself, no downloads, no paid assets, no AI.

   Settings (tool, snapping, pencil, words): localStorage "curiosities-build-v1". The object library is
   viewer/objects.js (window.CurioObjects). API: window.CurioBuild. */
(function () {
  "use strict";
  const V = window.CurioViewer;
  if (!V || !V.makers || window.CurioBuild) return;

  const KEY = "curiosities-build-v1";
  const DEG = Math.PI / 180;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => {
    const l = len(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const uid = (k) => k + "-" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const lib = () => window.CurioObjects || null;

  /* ---------- settings ---------- */
  const DEFAULTS = {
    tool: "select",
    snap: 0.25, /* move steps in metres (0 = off) */
    turnSnap: 15, /* turn steps in degrees (0 = off) */
    land: true, /* things land on whatever is under them */
    pen: { color: "#1c1712", w: 0.025, smooth: 0.5, mirror: false, on: "face", shape: "free" },
    words: { text: "Hello", font: "clean", size: 0.4, color: "#ffffff", bold: true, italic: false, outline: true, depth: 0, face: false, flat: false },
    wallH: 2.6,
    material: "wood",
  };
  let S = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s === "object") return Object.assign(clone(DEFAULTS), s, { pen: Object.assign(clone(DEFAULTS.pen), s.pen || {}), words: Object.assign(clone(DEFAULTS.words), s.words || {}) });
    } catch (e) {}
    return clone(DEFAULTS);
  })();
  function saveS() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}
  }

  /* ---------- fonts: ones every computer already has (no downloads) ---------- */
  const FONTS = {
    clean: ["Clean", "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"],
    book: ["Book", "Georgia, 'Times New Roman', Times, serif"],
    typewriter: ["Typewriter", "'Courier New', Courier, monospace"],
    comic: ["Comic", "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif"],
    poster: ["Poster", "Impact, 'Arial Black', 'Haettenschweiler', sans-serif"],
    hand: ["Handwriting", "'Segoe Print', 'Bradley Hand', 'Brush Script MT', 'Snell Roundhand', cursive"],
    rounded: ["Rounded", "'Trebuchet MS', 'Arial Rounded MT Bold', Verdana, sans-serif"],
    elegant: ["Elegant", "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif"],
    marker: ["Marker", "'Marker Felt', 'Chalkboard SE', 'Comic Sans MS', cursive"],
    oldstyle: ["Old sign", "Copperplate, 'Copperplate Gothic Light', 'Perpetua Titling MT', serif"],
    wide: ["Wide", "Verdana, Geneva, Tahoma, sans-serif"],
    narrow: ["Narrow", "'Arial Narrow', 'Helvetica Neue', 'Roboto Condensed', sans-serif"],
  };
  const fontOf = (k) => (FONTS[k] || FONTS.clean)[1];

  /* ---------- Roblox-style basic parts, plus a few more shapes. Each is about 1 m and stands on the floor. ---------- */
  const PARTS = {
    block: ["Block", "A box. Stretch it into a wall, a table top, a step.", (c) => [{ box: [1, 1, 1], at: [0, 0.5, 0], color: c }]],
    ball: ["Ball", "A round ball.", (c) => [{ ball: 0.5, at: [0, 0.5, 0], color: c }]],
    wedge: ["Wedge", "A ramp: flat at the front, tall at the back.", (c) => [{ wedge: [1, 1, 1], at: [0, 0.5, 0], color: c }]],
    cornerwedge: ["Corner wedge", "A ramp that rises to one corner, for roofs and corners.", (c) => {
      const A = [-0.5, 0, 0.5], B = [0.5, 0, 0.5], C = [0.5, 0, -0.5], D = [-0.5, 0, -0.5], E = [0.5, 1, -0.5];
      return [{ poly: [[A, B, C, D], [B, C, E], [C, D, E], [A, B, E], [D, A, E]], center: [0.15, 0.25, -0.15], color: c }];
    }],
    cylinder: ["Cylinder", "A can shape: posts, pipes, wheels (lay it down with Rotate).", (c) => [{ cyl: [0.5, 1], at: [0, 0, 0], color: c, n: 16 }]],
    cone: ["Cone", "A cone: traffic cones, tree tops, party hats.", (c) => [{ cone: [0.5, 1], at: [0, 0, 0], color: c }]],
    pyramid: ["Pyramid", "Four sloping sides to a point.", (c) => {
      const A = [-0.5, 0, 0.5], B = [0.5, 0, 0.5], C = [0.5, 0, -0.5], D = [-0.5, 0, -0.5], E = [0, 1, 0];
      return [{ poly: [[A, B, C, D], [A, B, E], [B, C, E], [C, D, E], [D, A, E]], center: [0, 0.25, 0], color: c }];
    }],
    dome: ["Dome", "Half a ball: a hill, a hut, a helmet.", (c) => {
      const F = [];
      const N = 14;
      const M = 5;
      const pt = (i, j) => {
        const th = (j / M) * (Math.PI / 2);
        const ph = (i / N) * Math.PI * 2;
        return [0.5 * Math.cos(th) * Math.cos(ph), 0.5 * Math.sin(th), 0.5 * Math.cos(th) * Math.sin(ph)];
      };
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) F.push([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]);
      return [{ poly: F, center: [0, 0.1, 0], color: c }];
    }],
    ring: ["Ring", "A doughnut: a tyre, a life ring, a halo.", (c) => {
      const F = [];
      const N = 18;
      const M = 8;
      const R = 0.38;
      const r = 0.12;
      const pt = (i, j) => {
        const a = (i / N) * Math.PI * 2;
        const b = (j / M) * Math.PI * 2;
        return [(R + r * Math.cos(b)) * Math.cos(a), r + r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)];
      };
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) F.push([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]);
      return [{ poly: F, two: true, color: c }];
    }],
    arch: ["Arch", "Two legs and a top: a doorway, a gate.", (c) => [
      { box: [0.25, 1, 0.3], at: [-0.375, 0.5, 0], color: c },
      { box: [0.25, 1, 0.3], at: [0.375, 0.5, 0], color: c },
      { box: [1, 0.25, 0.3], at: [0, 1.125, 0], color: c },
    ]],
    stairs: ["Stairs", "Five steps going up toward the back.", (c) => Array.from({ length: 5 }, (_, i) => ({ box: [1, (i + 1) * 0.2, 0.2], at: [0, ((i + 1) * 0.2) / 2, 0.4 - i * 0.2], color: c }))],
    plank: ["Plank", "A long flat board: shelves, benches, bridges.", (c) => [{ box: [2, 0.06, 0.3], at: [0, 0.03, 0], color: c }]],
    disc: ["Disc", "A flat round: a plate, a rug, a puddle.", (c) => [{ cyl: [0.5, 0.04], at: [0, 0, 0], color: c, n: 20 }]],
  };
  const PART_KEYS = Object.keys(PARTS);

  /* ---------- Fortnite-style build pieces on a 3 m grid ---------- */
  const TILE = 3;
  const MATERIALS = { wood: ["Wood", "#a5794a"], brick: ["Brick", "#a8553f"], metal: ["Metal", "#8d969e"], stone: ["Stone", "#9a978c"], paint: ["White paint", "#e9e5dc"] };
  const PIECES = {
    wall: ["Wall", "A whole wall, one grid square wide.", (c) => [{ box: [TILE, TILE, 0.2], at: [0, TILE / 2, 0], color: c }]],
    floor: ["Floor", "A floor square. Lift it to make a second storey.", (c) => [{ box: [TILE, 0.2, TILE], at: [0, 0.1, 0], color: c }]],
    stairs: ["Stairs", "A flight of stairs up one storey.", (c) => Array.from({ length: 8 }, (_, i) => ({ box: [TILE * 0.8, ((i + 1) * TILE) / 8, TILE / 8], at: [0, ((i + 1) * TILE) / 16, TILE / 2 - (i + 0.5) * (TILE / 8)], color: c }))],
    roof: ["Roof", "A sloping roof piece.", (c) => [{ wedge: [TILE, TILE / 2, TILE], at: [0, TILE / 4, 0], color: c }]],
    door: ["Door wall", "A wall with a doorway.", (c) => [
      { box: [(TILE - 1.1) / 2, TILE, 0.2], at: [-(TILE + 1.1) / 4, TILE / 2, 0], color: c },
      { box: [(TILE - 1.1) / 2, TILE, 0.2], at: [(TILE + 1.1) / 4, TILE / 2, 0], color: c },
      { box: [1.1, TILE - 2.2, 0.2], at: [0, 2.2 + (TILE - 2.2) / 2, 0], color: c },
    ]],
    window: ["Window wall", "A wall with a window you can see through.", (c) => [
      { box: [TILE, 1, 0.2], at: [0, 0.5, 0], color: c },
      { box: [TILE, TILE - 2.2, 0.2], at: [0, 2.2 + (TILE - 2.2) / 2, 0], color: c },
      { box: [(TILE - 1.4) / 2, 1.2, 0.2], at: [-(TILE + 1.4) / 4, 1.6, 0], color: c },
      { box: [(TILE - 1.4) / 2, 1.2, 0.2], at: [(TILE + 1.4) / 4, 1.6, 0], color: c },
      { box: [1.4, 1.2, 0.04], at: [0, 1.6, 0], color: "#9fc6d9", glass: true },
    ]],
  };

  /* ---------- makers: how each kind of made thing is drawn ---------- */
  const M = V.makers;
  M.part = (d) => (PARTS[d.shape] || PARTS.block)[2](d.color);
  M.piece = (d) => (PIECES[d.piece] || PIECES.wall)[2](d.color);
  M.catalog = (d) => {
    const it = lib() && lib().find(d.item);
    if (it && it.parts) return it.parts(d);
    return [{ box: [0.5, 0.5, 0.5], at: [0, 0.25, 0], color: d.color || "#888888" }];
  };
  M.text = (d) => {
    const base = { text: d.text || "", size: d.size || 0.4, font: fontOf(d.font), weight: d.bold ? "700" : "400", italic: !!d.italic, outline: d.outline ? (isDark(d.color) ? "#ffffff" : "#111111") : null, face: !!d.face, align: "center" };
    const y = (d.size || 0.4) * 0.25;
    const rx = d.flat && !d.face ? -90 : 0;
    const at = d.flat && !d.face ? [0, 0.01, 0] : [0, y, 0];
    const out = [];
    const depth = d.face ? 0 : clamp(+d.depth || 0, 0, 2);
    if (depth > 0) {
      /* 3D letters: the same words stacked from the back, darker, so they look solid */
      const n = 7;
      for (let i = 0; i < n - 1; i++) {
        const z = -depth * (1 - i / (n - 1));
        const p = Object.assign({}, base, { outline: null, color: shade(d.color, 0.45 + 0.3 * (i / n)), at: d.flat ? [at[0], at[1] - z, at[2]] : [at[0], at[1], at[2] + z], tag: "t" + i });
        if (rx) Object.assign(p, { rx, pivot: p.at });
        out.push(p);
      }
    }
    const front = Object.assign({}, base, { color: d.color || "#ffffff", at, tag: "front" });
    if (rx) Object.assign(front, { rx, pivot: at });
    out.push(front);
    return out;
  };
  M.walls = (d) => {
    const h = d.h || 2.6;
    const t = d.t || 0.15;
    const out = [];
    if (d.floor) {
      const [x0, z0, x1, z1] = d.floor;
      out.push({ flat: [Math.abs(x1 - x0), Math.abs(z1 - z0)], at: [(x0 + x1) / 2, 0.012, (z0 + z1) / 2], color: d.floorColor || "#b58a5a" });
    }
    (d.segs || []).forEach((s, i) => {
      const dx = s[2] - s[0];
      const dz = s[3] - s[1];
      const L = Math.hypot(dx, dz);
      if (L < 0.05) return;
      out.push({ box: [L + t, h, t], at: [(s[0] + s[2]) / 2, h / 2, (s[1] + s[3]) / 2], ry: Math.atan2(-dz, dx) / DEG, color: d.color, tag: "w" + i });
    });
    return out;
  };
  M.sketch = (d) => sketchParts(d);

  function isDark(hx) {
    const m = /^#([0-9a-f]{6})$/i.exec(hx || "");
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 < 110;
  }
  function shade(hx, k) {
    const m = /^#([0-9a-f]{6})$/i.exec(hx || "#888888");
    const n = parseInt(m ? m[1] : "888888", 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => clamp(Math.round(v * k), 0, 255));
    return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  /* ---------- drawings: flat pencil lines, or made 3D ---------- */
  /* A drawing lives on a flat sheet (its plane): o = a corner of the sheet, r = the sheet's right, u = its up,
     n = the side facing you. Each line is a list of [right, up] points on that sheet, in metres. */
  const SOLIDS = {
    flat: ["Keep it a drawing", "Pencil lines in the air, seen from every side."],
    puff: ["Puff it up", "Fills each closed line and blows it up like a pillow or a balloon."],
    push: ["Push it out", "Fills each closed line and pushes it out into a solid slab, like a cookie cutter."],
    tube: ["Make it a tube", "Turns every line into a round tube, like bent wire or modelling clay."],
    spin: ["Spin it round", "Spins the line around its left edge, like a potter's wheel: draw half a vase, get a vase."],
  };
  function sketchParts(d) {
    const P = d.plane || { o: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], n: [0, 0, 1] };
    const to3 = (u, v, h) => add(add(add(P.o, mul(P.r, u)), mul(P.u, v)), mul(P.n, h || 0));
    const out = [];
    const solid = d.solid || "flat";
    const depth = clamp(+d.depth || 0.2, 0.01, 5);
    let umin = Infinity;
    (d.strokes || []).forEach((st) => st.p.forEach((q) => (umin = Math.min(umin, q[0]))));
    (d.strokes || []).forEach((st, si) => {
      const pts = st.p || [];
      let col = st.c || d.color || "#1c1712";
      const w = st.w || 0.025;
      /* a dark pencil line made solid takes a soft clay color, so its shape and shading show */
      if (solid !== "flat" && isDark(col)) col = d.fill || "#d8c3a0";
      if (!pts.length) return;
      const closedOk = pts.length >= 3;
      if (solid === "flat" || ((solid === "puff" || solid === "push") && !closedOk) || pts.length < 2) {
        out.push({ line: pts.map((q) => to3(q[0], q[1], 0)), w, color: col, tag: "s" + si });
        return;
      }
      if (solid === "tube") return tubeParts(pts, Math.max(w * 1.2, depth * 0.25), to3, P, col, si).forEach((p) => out.push(p));
      if (solid === "spin") return out.push({ poly: lathe(pts, umin, P, to3), two: true, color: col, tag: "s" + si });
      let poly = resample(pts.concat([pts[0]]), 48);
      if (poly.length > 3 && Math.hypot(poly[0][0] - poly[poly.length - 1][0], poly[0][1] - poly[poly.length - 1][1]) < 1e-6) poly.pop();
      if (Math.abs(area(poly)) < 1e-5) return out.push({ line: pts.map((q) => to3(q[0], q[1], 0)), w, color: col, tag: "s" + si });
      if (area(poly) < 0) poly = poly.slice().reverse();
      if (solid === "puff") out.push({ poly: puffFaces(poly, depth, to3), color: col, tag: "s" + si });
      else out.push({ poly: pushFaces(poly, P.floor ? [0, depth] : [-depth / 2, depth / 2], to3), color: col, tag: "s" + si });
    });
    return out;
  }
  function area(p) {
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const b = p[(i + 1) % p.length];
      a += p[i][0] * b[1] - b[0] * p[i][1];
    }
    return a / 2;
  }
  /* even spacing along the line, at most n points */
  function resample(pts, n) {
    if (pts.length < 3) return pts.slice();
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (total < 1e-6) return [pts[0]];
    const want = Math.max(4, Math.min(n, pts.length));
    const step = total / (want - 1);
    const out = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      let a = pts[i - 1];
      const b = pts[i];
      let seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc + seg >= step && seg > 0) {
        const t = (step - acc) / seg;
        a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        out.push(a);
        seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
        acc = 0;
      }
      acc += seg;
    }
    if (out.length < want) out.push(pts[pts.length - 1]);
    return out;
  }
  function puffFaces(poly, depth, to3) {
    let cu = 0;
    let cv = 0;
    poly.forEach((q) => ((cu += q[0]), (cv += q[1])));
    cu /= poly.length;
    cv /= poly.length;
    const R = Math.sqrt(Math.abs(area(poly)) / Math.PI);
    const H = Math.max(0.02, Math.min(R, depth * 2) * 0.9);
    const K = 5;
    const ring = (k, side) => {
      const a = (k / K) * (Math.PI / 2);
      const s = Math.cos(a);
      const h = side * Math.sin(a) * H;
      return poly.map((q) => to3(cu + (q[0] - cu) * s, cv + (q[1] - cv) * s, h));
    };
    const F = [];
    [1, -1].forEach((side) => {
      for (let k = 0; k < K; k++) {
        const A = ring(k, side);
        const B = ring(k + 1, side);
        for (let i = 0; i < poly.length; i++) {
          const j = (i + 1) % poly.length;
          const q = k === K - 1 ? [A[i], A[j], B[i]] : [A[i], A[j], B[j], B[i]];
          F.push(side > 0 ? q : q.slice().reverse());
        }
      }
    });
    return F;
  }
  function pushFaces(poly, hs, to3) {
    const F = [];
    const tris = earClip(poly);
    tris.forEach(([a, b, c]) => {
      F.push([to3(poly[a][0], poly[a][1], hs[1]), to3(poly[b][0], poly[b][1], hs[1]), to3(poly[c][0], poly[c][1], hs[1])]);
      F.push([to3(poly[c][0], poly[c][1], hs[0]), to3(poly[b][0], poly[b][1], hs[0]), to3(poly[a][0], poly[a][1], hs[0])]);
    });
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      F.push([to3(a[0], a[1], hs[0]), to3(b[0], b[1], hs[0]), to3(b[0], b[1], hs[1]), to3(a[0], a[1], hs[1])]);
    }
    return F;
  }
  /* cut a flat outline (counter-clockwise) into triangles */
  function earClip(poly) {
    const idx = poly.map((_, i) => i);
    const out = [];
    const crossz = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inTri = (p, a, b, c) => crossz(a, b, p) >= 0 && crossz(b, c, p) >= 0 && crossz(c, a, p) >= 0;
    let guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      let cut = false;
      for (let k = 0; k < idx.length; k++) {
        const i0 = idx[(k + idx.length - 1) % idx.length];
        const i1 = idx[k];
        const i2 = idx[(k + 1) % idx.length];
        const a = poly[i0];
        const b = poly[i1];
        const c = poly[i2];
        if (crossz(a, b, c) <= 1e-12) continue;
        let blocked = false;
        for (const j of idx) {
          if (j === i0 || j === i1 || j === i2) continue;
          if (inTri(poly[j], a, b, c)) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;
        out.push([i0, i1, i2]);
        idx.splice(k, 1);
        cut = true;
        break;
      }
      if (!cut) break; /* a line that crosses itself: fill the rest as a fan */
    }
    for (let k = 1; k + 1 < idx.length; k++) out.push([idx[0], idx[k], idx[k + 1]]);
    return out;
  }
  function tubeParts(pts, r, to3, P, col, si) {
    const q = resample(pts, 60);
    const N = 7;
    const rings = q.map((p, i) => {
      const a = q[Math.max(0, i - 1)];
      const b = q[Math.min(q.length - 1, i + 1)];
      let tu = b[0] - a[0];
      let tv = b[1] - a[1];
      const l = Math.hypot(tu, tv) || 1;
      tu /= l;
      tv /= l;
      const side = add(mul(P.r, -tv), mul(P.u, tu));
      const c = to3(p[0], p[1], 0);
      return Array.from({ length: N }, (_, k) => {
        const ang = (k / N) * Math.PI * 2;
        return add(c, add(mul(side, r * Math.cos(ang)), mul(P.n, r * Math.sin(ang))));
      });
    });
    const out = [];
    for (let i = 0; i + 1 < rings.length; i++) {
      const F = [];
      for (let k = 0; k < N; k++) F.push([rings[i][k], rings[i][(k + 1) % N], rings[i + 1][(k + 1) % N], rings[i + 1][k]]);
      out.push({ poly: F, center: mul(add(to3(q[i][0], q[i][1], 0), to3(q[i + 1][0], q[i + 1][1], 0)), 0.5), color: col, tag: "s" + si });
    }
    if (q.length === 1) out.push({ ball: r, at: to3(q[0][0], q[0][1], 0), color: col, tag: "s" + si });
    return out;
  }
  function lathe(pts, umin, P, to3) {
    const q = resample(pts, 40);
    const N = 16;
    const at = (p, k) => {
      const rr = p[0] - umin;
      const a = (k / N) * Math.PI * 2;
      return add(to3(umin + rr * Math.cos(a), p[1], 0), mul(P.n, rr * Math.sin(a)));
    };
    const F = [];
    for (let i = 0; i + 1 < q.length; i++) for (let k = 0; k < N; k++) F.push([at(q[i], k), at(q[i + 1], k), at(q[i + 1], k + 1), at(q[i], k + 1)]);
    return F;
  }

  /* ---------- flat shapes for the pencil (the shapes menu) ---------- */
  const SHAPES = {
    free: ["✎", "Free hand", "Draw anything."],
    line: ["╱", "Straight line", "Drag from one end to the other. (Or hold Shift with Free hand.)"],
    rect: ["▭", "Rectangle", "Drag from corner to corner."],
    ellipse: ["◯", "Circle", "Drag across it. Hold Shift for a perfect circle."],
    triangle: ["△", "Triangle", "Drag across it."],
    star: ["☆", "Star", "Drag across it."],
    heart: ["♡", "Heart", "Drag across it."],
    arrow: ["➜", "Arrow", "Drag from tail to tip."],
    cloud: ["☁", "Cloud", "Drag across it: thought bubbles, smoke, clouds."],
    balloon: ["💬", "Speech balloon", "Drag across it: a balloon with a tail."],
  };
  function shapePoints(kind, a, b, square) {
    let [x0, y0] = a;
    let [x1, y1] = b;
    if (square && kind !== "line" && kind !== "arrow") {
      const s = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      x1 = x0 + Math.sign(x1 - x0 || 1) * s;
      y1 = y0 + Math.sign(y1 - y0 || 1) * s;
    }
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const rx = Math.abs(x1 - x0) / 2;
    const ry = Math.abs(y1 - y0) / 2;
    const ring = (n, f) => Array.from({ length: n + 1 }, (_, i) => f((i / n) * Math.PI * 2, i));
    switch (kind) {
      case "line":
        return [a, b];
      case "rect":
        return [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
      case "ellipse":
        return ring(40, (t) => [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
      case "triangle":
        return [[x0, Math.min(y0, y1)], [x1, Math.min(y0, y1)], [cx, Math.max(y0, y1)], [x0, Math.min(y0, y1)]];
      case "star":
        return ring(10, (t, i) => {
          const k = i % 2 ? 0.45 : 1;
          const ang = Math.PI / 2 + t;
          return [cx + rx * k * Math.cos(ang), cy + ry * k * Math.sin(ang)];
        });
      case "heart":
        return ring(48, (t) => {
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          return [cx + (hx / 17) * rx, cy + ((hy + 2) / 17) * ry];
        });
      case "cloud":
        return ring(64, (t) => {
          const k = 1 + 0.12 * Math.abs(Math.sin(t * 4));
          return [cx + rx * k * Math.cos(t) * 0.9, cy + ry * k * Math.sin(t) * 0.9];
        });
      case "balloon": {
        const pts = ring(36, (t) => [cx + rx * Math.cos(t), cy + ry * 0.2 + ry * 0.8 * Math.sin(t)]);
        /* cut in a tail at the bottom left */
        const k = pts.findIndex((p, i) => i > 18 && p[0] > cx - rx * 0.6);
        if (k > 0) pts.splice(k, 0, [cx - rx * 0.9, cy - ry * 1.05]);
        return pts;
      }
      case "arrow": {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L;
        const uy = dy / L;
        const hw = Math.min(L * 0.3, L);
        const back = [x1 - ux * hw, y1 - uy * hw];
        const sw = hw * 0.6;
        return [a, b, [back[0] - uy * sw, back[1] + ux * sw], b, [back[0] + uy * sw, back[1] - ux * sw]];
      }
      default:
        return [a, b];
    }
  }

  /* ---------- the live film ---------- */
  const L = () => V.live();
  const obj = (id) => L().film.objects.find((o) => o.id === id);
  const placeOf = (id) => L().panel.place[id];
  function insert(def, spot) {
    V.edit("build-add");
    const lv = L();
    lv.film.objects.push(def);
    lv.film.panels.forEach((p) => (p.place[def.id] = clone(spot)));
    lv.film.sel = def.id;
    V.changed(true);
    return def;
  }
  function removeThing(id) {
    const ids = Array.isArray(id) ? id : [id];
    const lv = L();
    if (!ids.some((x) => obj(x))) return;
    V.edit("build-del");
    ids.forEach((id) => {
      lv.film.objects = lv.film.objects.filter((x) => x.id !== id);
      lv.film.panels.forEach((q) => {
        delete q.place[id];
        if (q.cam.aim === id) q.cam.aim = lv.film.objects[0] ? lv.film.objects[0].id : null;
        (q.words || []).forEach((w) => w.who === id && (w.who = ""));
      });
    });
    lv.film.sel = null;
    multi = [];
    V.changed(true);
  }
  function duplicate(id) {
    const ids = Array.isArray(id) ? id : [id];
    if (ids.length > 1) {
      V.edit("build-dup");
      const ng = {};
      const made = ids.map((x) => dupOne(x, ng)).filter(Boolean);
      selectIds(made.map((c) => c.id));
      V.changed(true);
      return made[0] || null;
    }
    V.edit("build-dup");
    const c = dupOne(ids[0], {});
    if (c) {
      L().film.sel = c.id;
      multi = [];
    }
    V.changed(true);
    return c;
  }
  function dupOne(id, ng) {
    const lv = L();
    const o = obj(id);
    if (!o) return null;
    const c = clone(o);
    if (o.group) c.group = ng[o.group] || (ng[o.group] = uid("group"));
    c.id = uid(o.kind === "made" ? o.make || "made" : o.kind);
    c.name = (o.name || "Thing").replace(/( copy( \d+)?)?$/, "") + " copy";
    const { r } = V.floorDirs();
    const stepM = S.snap || 0.5;
    const off = Math.max(stepM, 0.5);
    lv.film.objects.push(c);
    lv.film.panels.forEach((p) => {
      const q = clone(p.place[id] || { x: 0, y: 0, z: 0, turn: 0, size: 1, show: true });
      q.x = r3(q.x + r[0] * off);
      q.z = r3(q.z + r[2] * off);
      p.place[c.id] = q;
    });
    return c;
  }

  /* ---------- picking several things (Roblox: Shift-click, Shift-drag a box; a click on a group picks the group) ---------- */
  let multi = []; /* the other picked things, besides film.sel */
  function selection() {
    const lv = L();
    const ids = [lv.film.sel].concat(multi).filter((id, i, a) => id && a.indexOf(id) === i && obj(id));
    multi = ids.slice(1);
    return ids;
  }
  function selectIds(ids) {
    const lv = L();
    ids = ids.filter((id, i, a) => a.indexOf(id) === i && obj(id));
    lv.film.sel = ids[0] || null;
    multi = ids.slice(1);
  }
  function groupOf(o) {
    if (!o || !o.group) return [o.id];
    return L().film.objects.filter((x) => x.group === o.group).map((x) => x.id);
  }
  function groupSel() {
    const ids = selection();
    if (ids.length < 2) return flash("Pick two or more things first (Shift-click, or Shift-drag a box), then group them.");
    V.edit("build-group");
    const lv = L();
    const n = new Set(lv.film.objects.filter((o) => o.group).map((o) => o.group)).size + 1;
    const g = uid("group");
    ids.forEach((id) => {
      const o = obj(id);
      o.group = g;
      o.groupName = "Group " + n;
    });
    V.changed(true);
    flash(`Grouped ${ids.length} things as Group ${n}. Clicking any of them picks them all; Alt-click picks one.`);
  }
  function ungroupSel() {
    const ids = selection();
    const groups = new Set(ids.map((id) => obj(id).group).filter(Boolean));
    if (!groups.size) return flash("Nothing picked is in a group.");
    V.edit("build-ungroup");
    L().film.objects.forEach((o) => {
      if (groups.has(o.group)) {
        delete o.group;
        delete o.groupName;
      }
    });
    V.changed(true);
    flash("Ungrouped. Each thing moves on its own again.");
  }

  /* ---------- where things are: boxes and surfaces ---------- */
  function bounds(o, place) {
    let lo = [Infinity, Infinity, Infinity];
    let hi = [-Infinity, -Infinity, -Infinity];
    V.faces(o, place).forEach((f) => {
      const pts = f.text ? [f.o, add(f.o, mul(f.ay, f.h)), add(f.o, mul(f.ax, f.h))] : f.pts;
      pts.forEach((p) => {
        for (let k = 0; k < 3; k++) {
          lo[k] = Math.min(lo[k], p[k]);
          hi[k] = Math.max(hi[k], p[k]);
        }
      });
    });
    if (!isFinite(lo[0])) {
      const p = [place.x || 0, place.y || 0, place.z || 0];
      lo = sub(p, [0.25, 0, 0.25]);
      hi = add(p, [0.25, 0.5, 0.25]);
    }
    return { lo, hi, c: mul(add(lo, hi), 0.5) };
  }
  /* the tops of every other thing (faces that look up), to land on: like a mug landing on a table */
  function surfaces(skipId) {
    const lv = L();
    const out = [];
    const skip = Array.isArray(skipId) ? skipId : [skipId];
    lv.film.objects.forEach((o) => {
      if (skip.includes(o.id)) return;
      const p = lv.panel.place[o.id];
      if (!p || p.show === false) return;
      V.faces(o, p).forEach((f) => {
        if (!f.n || f.line || f.text || f.glass || f.n[1] < 0.6 || f.pts.length < 3) return;
        out.push({ xz: f.pts.map((q) => [q[0], q[2]]), p: f.pts[0], n: f.n });
      });
    });
    return out;
  }
  function inside2(pt, s) {
    let c = false;
    for (let i = 0, j = s.length - 1; i < s.length; j = i++) {
      if (s[i][1] > pt[1] !== s[j][1] > pt[1] && pt[0] < ((s[j][0] - s[i][0]) * (pt[1] - s[i][1])) / (s[j][1] - s[i][1]) + s[i][0]) c = !c;
    }
    return c;
  }
  function topAt(surf, x, z, below) {
    let best = 0;
    surf.forEach((s) => {
      if (!inside2([x, z], s.xz)) return;
      const y = s.p[1] - (s.n[0] * (x - s.p[0]) + s.n[2] * (z - s.p[2])) / s.n[1];
      if (y > best && (below == null || y <= below)) best = y;
    });
    return best;
  }
  /* the point where the pointer's ray meets the flat level y */
  function hitLevel(e, y) {
    const R = V.ray(e);
    if (!R) return null;
    if (Math.abs(R.dir[1]) < 1e-4) return null;
    const t = (y - R.from[1]) / R.dir[1];
    if (t <= 0) return null;
    const p = add(R.from, mul(R.dir, Math.min(t, 400)));
    return p;
  }
  /* the first surface under the pointer: a thing's top, a wall, or the floor */
  function hitSurface(e) {
    const pk = V.pickAt(e);
    const R = V.ray(e);
    if (pk && pk.pts && pk.n && R) {
      const d = dot(pk.n, R.dir);
      if (Math.abs(d) > 1e-4) {
        const t = dot(pk.n, sub(pk.pts[0], R.from)) / d;
        if (t > 0) return { p: add(R.from, mul(R.dir, t)), n: pk.n, obj: pk.obj };
      }
    }
    const f = hitLevel(e, 0);
    return f ? { p: f, n: [0, 1, 0], obj: null } : null;
  }
  const snapV = (v, s, free) => (s && !free ? Math.round(v / s) * s : v);
  function facingCamera(x, z) {
    const C = L().C;
    return C ? Math.round(Math.atan2(C.pos[0] - x, C.pos[2] - z) / DEG) : 0;
  }
  /* where a new thing goes: the middle of the picture, nudged so new things do not land in a pile */
  let dropN = 0;
  function dropSpot(fly) {
    const C = L().C;
    const tg = C ? C.target : [0, 0, 0];
    const { r } = V.floorDirs();
    const k = dropN++ % 5;
    const off = [0, 1, -1, 2, -2][k] * 0.8;
    const surf = surfaces(null);
    const toCam = C ? norm([C.pos[0] - tg[0], 0, C.pos[2] - tg[2]]) : [0, 0, 1];
    let x = tg[0] + r[0] * off;
    let z = tg[2] + r[2] * off;
    /* if something already stands there (the tuk-tuk), step toward the camera until the floor is clear */
    for (let k = 0; k < 12 && topAt(surf, x, z) > 0.05; k++) {
      x += toCam[0] * 0.5;
      z += toCam[2] * 0.5;
    }
    x = r3(snapV(x, S.snap));
    z = r3(snapV(z, S.snap));
    const y = fly ? fly : r3(S.land ? topAt(surf, x, z) : 0);
    return { x, y, z, turn: facingCamera(x, z), size: 1, show: true, pose: "stand" };
  }

  /* ---------- adding things ---------- */
  function addPart(shape) {
    const P = PARTS[shape] || PARTS.block;
    const n = L().film.objects.filter((o) => o.make === "part" && o.shape === shape).length + 1;
    const spot = dropSpot();
    spot.turn = snapV(spot.turn, S.turnSnap);
    return insert({ id: uid("part"), kind: "made", make: "part", shape, name: P[0] + (n > 1 ? " " + n : ""), color: partColor(shape), look: 0.5, ring: 0.6 }, spot);
  }
  function partColor(shape) {
    return { block: "#a3a2a5", ball: "#d94f6a", wedge: "#7f8fa6", cornerwedge: "#7f8fa6", cylinder: "#5b8def", cone: "#ff8a3d", pyramid: "#e0b04f", dome: "#62b37a", ring: "#3b3b44", arch: "#b9a58a", stairs: "#a5794a", plank: "#a5794a", disc: "#ececec" }[shape] || "#a3a2a5";
  }
  function addPiece(piece) {
    const P = PIECES[piece] || PIECES.wall;
    const C = L().C;
    const tg = C ? C.target : [0, 0, 0];
    const x = Math.round(tg[0] / TILE) * TILE;
    const z = Math.round(tg[2] / TILE) * TILE;
    const turn = Math.round(facingCamera(x, z) / 90) * 90;
    const n = L().film.objects.filter((o) => o.make === "piece" && o.piece === piece).length + 1;
    return insert({ id: uid("piece"), kind: "made", make: "piece", piece, name: P[0] + (n > 1 ? " " + n : ""), color: MATERIALS[S.material] ? MATERIALS[S.material][1] : "#a5794a", look: 1.5, ring: 2.1, noShadow: true }, { x, y: 0, z, turn, size: 1, show: true });
  }
  function defFromItem(it) {
    if (it.person) {
      const p = it.person;
      return { id: uid("person"), kind: "person", name: it.name, color: p.color || "#4a7bd0", pants: p.pants, skin: p.skin, hair: p.hair, item: it.id };
    }
    return { id: uid(it.id), kind: "made", make: "catalog", item: it.id, name: it.name, color: it.color || "#888888", look: it.look != null ? it.look : 0.5, ring: it.ring != null ? it.ring : 0.5, noShadow: !!it.noShadow || (it.look != null && it.look < 0.05) };
  }
  function addItem(it) {
    if (!it) return null;
    const n = L().film.objects.filter((o) => o.item === it.id).length + 1;
    const def = defFromItem(it);
    if (n > 1) def.name += " " + n;
    const spot = dropSpot(it.fly || 0);
    return insert(def, spot);
  }
  /* Fortnite-style ready-made sets: several things placed together in one go */
  const PREFABS = [
    { id: "kitchen", name: "Kitchen corner", say: "Fridge, stove, sink, table and chairs, a kettle.", items: [["fridge", -2, -1.2, 0], ["stove", -1, -1.2, 0], ["sink", 0, -1.2, 0], ["kitchen-table", 0.3, 0.6, 0], ["chair", -0.5, 0.6, 90], ["chair", 1.1, 0.6, -90], ["kettle", -1, -1.2, 0, 0.9]] },
    { id: "living", name: "Living room", say: "Sofa, coffee table, TV, lamp, rug, plant.", items: [["rug", 0, 0, 0], ["sofa", 0, 1.2, 180], ["coffee-table", 0, 0, 0], ["tv-stand", 0, -1.6, 0], ["tv", 0, -1.6, 0, 0.5], ["floor-lamp", 1.4, 1.3, 0], ["potted-plant", -1.5, -1.4, 0]] },
    { id: "street", name: "Street corner", say: "Road, traffic light, stop sign, hydrant, a car, people.", items: [["road", 0, 0, 0], ["sidewalk", 0, -4.5, 0], ["traffic-light", 3, -3.6, 0], ["stop-sign", -3, -3.6, 0], ["fire-hydrant", 1.5, -3.8, 0], ["car", -1, 0.9, 90], ["pedestrian", 0, -4.3, 90], ["police-officer", 2, -4.5, 0]] },
    { id: "park", name: "Park", say: "Trees, a bench, a pond, a dog and birds.", items: [["oak-tree", -3, -2, 0], ["oak-tree", 3, -3, 0], ["park-bench", 0, -1.5, 0], ["pond", 2, 1.5, 0], ["dog", -1, 0.5, 45], ["pigeon", 0.6, 0.3, 0], ["squirrel", -2.2, -1.2, 0]] },
    { id: "camp", name: "Campsite", say: "Tent, campfire, logs, pine trees.", items: [["tent", -1.5, -1.5, 30], ["campfire", 0, 0, 0], ["log", 1.3, 0.2, 80], ["log", -0.4, 1.3, 10], ["pine-tree", -4, -3, 0], ["pine-tree", 3.5, -3.5, 0], ["pine-tree", 4.5, 0, 0]] },
    { id: "harbor", name: "Harbor", say: "Water, a dock, boats and gulls.", items: [["lake", 0, -3, 0], ["dock", 0, 0, 0], ["sailboat", -3, -4, 90], ["rowboat", 2.5, -2, 30], ["seagull", 0.5, 0.6, 0], ["buoy", 4, -6, 0]] },
  ];
  function addPrefab(id) {
    const pf = PREFABS.find((p) => p.id === id);
    const L0 = lib();
    if (!pf || !L0) return;
    const C = L().C;
    const tg = C ? C.target : [0, 0, 0];
    const { r, f } = V.floorDirs();
    V.edit("build-prefab");
    const lv = L();
    const base = Math.atan2(-f[0], -f[2]) / DEG; /* the set faces the camera */
    let last = null;
    pf.items.forEach(([iid, dx, dz, turn, y]) => {
      const it = L0.find(iid) || (L0.search(iid.replace(/-/g, " ")) || [])[0];
      if (!it) return;
      const def = defFromItem(it);
      const x = r3(tg[0] + r[0] * dx - f[0] * dz);
      const z = r3(tg[2] + r[2] * dx - f[2] * dz);
      const spot = { x, y: y != null ? y : it.fly || 0, z, turn: Math.round(base + (turn || 0)), size: 1, show: true, pose: "stand" };
      lv.film.objects.push(def);
      lv.film.panels.forEach((p) => (p.place[def.id] = clone(spot)));
      last = def.id;
    });
    if (last) lv.film.sel = last;
    V.changed(true);
  }

  /* ---------- the tools ---------- */
  const TOOLS = {
    select: ["↖", "Select", "1", "Click a thing to pick it. Drag it along the floor: it jumps in steps and lands on whatever is under it. Hold Alt (Option) to place it freely."],
    move: ["✥", "Move", "2", "Drag a colored arrow to slide it one way only: red is left and right, green is up and down, blue is near and far."],
    scale: ["⤢", "Scale", "3", "Drag a dot to stretch that side; the other side stays put. Hold Shift to grow it evenly."],
    rotate: ["⟳", "Rotate", "4", "Drag the yellow ring to turn it. It turns in steps; Alt (Option) turns it freely."],
    draw: ["✏", "Pencil", "P", "Draw in the picture. Pick a shape from the shapes menu to draw it by dragging."],
    words: ["T", "Words", "T", "Click where the words should go."],
    wall: ["▥", "Wall", "W", "Drag along the floor to build a wall, like The Sims."],
    room: ["▣", "Room", "R", "Drag a rectangle on the floor: four walls and a floor."],
    paint: ["💧", "Copy color", "C", "Click a thing to pick up its color, then click other things to paint them. Shift-click picks up a new color."],
  };
  let tool = TOOLS[S.tool] ? S.tool : "select";
  let drag = null;
  let handles = [];
  let hover = null;
  let paintColor = null;
  let pendingDrawing = null; /* the drawing the next pencil line joins */

  function setTool(t) {
    tool = TOOLS[t] ? t : "select";
    S.tool = tool;
    saveS();
    const root = document.querySelector(".cv-root.cv-viewer");
    if (root) {
      Object.keys(TOOLS).forEach((k) => root.classList.toggle("cvb-t-" + k, k === tool));
      root.querySelectorAll("[data-btool]").forEach((b) => b.classList.toggle("on", b.dataset.btool === tool));
    }
    if (tool !== "draw") pendingDrawing = null;
    V.redraw();
    renderTab();
  }

  /* Roblox-style handles on the picked thing */
  function computeHandles(C, st) {
    handles = [];
    const lv = L();
    const id = lv.film.sel;
    const o = id && obj(id);
    const pl = o && st.place[id];
    if (!o || !pl || !pl.show || !["move", "scale", "rotate"].includes(tool)) return;
    let b = bounds(o, pl);
    if (tool !== "scale") {
      /* several picked: one set of handles around all of them */
      selection().forEach((x) => {
        if (x === id || !st.place[x]) return;
        const bb = bounds(obj(x), st.place[x]);
        b = { lo: b.lo.map((v, k) => Math.min(v, bb.lo[k])), hi: b.hi.map((v, k) => Math.max(v, bb.hi[k])) };
      });
      b.c = mul(add(b.lo, b.hi), 0.5);
    }
    const c = b.c;
    const ext = sub(b.hi, b.lo);
    const big = Math.max(0.6, Math.max(ext[0], ext[1], ext[2]) * 0.5 + 0.35);
    if (tool === "move") {
      [[0, "#ff4d4d"], [1, "#4dff88"], [2, "#4da3ff"]].forEach(([k, col]) => {
        [1, -1].forEach((sgn) => {
          const dir = [0, 0, 0];
          dir[k] = sgn;
          const tip = add(c, mul(dir, k === 1 ? ext[1] / 2 + 0.45 : big));
          handles.push({ kind: "move", axis: dir, from: c, tip, col });
        });
      });
    } else if (tool === "scale") {
      const t = (pl.turn || 0) * DEG;
      const ax = [[Math.cos(t), 0, -Math.sin(t)], [0, 1, 0], [Math.sin(t), 0, Math.cos(t)]];
      const lb = bounds(o, Object.assign({}, pl, { x: 0, y: 0, z: 0, turn: 0 }));
      const lc = lb.c;
      const lext = sub(lb.hi, lb.lo);
      const centerW = add([pl.x, pl.y, pl.z], add(add(mul(ax[0], lc[0]), mul(ax[1], lc[1])), mul(ax[2], lc[2])));
      [[0, "#ff4d4d"], [1, "#4dff88"], [2, "#4da3ff"]].forEach(([k, col]) => {
        [1, -1].forEach((sgn) => {
          const tip = add(centerW, mul(ax[k], (sgn * lext[k]) / 2 + sgn * 0.08));
          handles.push({ kind: "scale", k, sgn, axis: mul(ax[k], sgn), from: centerW, tip, col, ext: Math.max(0.02, lext[k]) });
        });
      });
    } else {
      const R = Math.max(ext[0], ext[2]) * 0.6 + 0.3;
      const ring = [];
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        ring.push([c[0] + R * Math.cos(a), b.lo[1] + 0.02, c[2] + R * Math.sin(a)]);
      }
      handles.push({ kind: "rotate", ring, c: [c[0], b.lo[1] + 0.02, c[2]], col: "#ffd23f" });
    }
    const P = (p) => V.projectNow(p);
    handles.forEach((h) => {
      if (h.ring) h.sring = h.ring.map((p) => P(p));
      else {
        h.sfrom = P(h.from);
        h.stip = P(h.tip);
      }
    });
  }
  function drawHandles(ctx, C) {
    const W = ctx.canvas.width;
    const lw = Math.max(2, W / 520);
    handles.forEach((h) => {
      const hot = hover === h || (drag && drag.h === h);
      ctx.strokeStyle = h.col;
      ctx.fillStyle = h.col;
      ctx.lineWidth = hot ? lw * 1.8 : lw;
      if (h.kind === "rotate") {
        ctx.beginPath();
        let pen = false;
        h.sring.forEach((q) => {
          if (!q) return (pen = false);
          pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
          pen = true;
        });
        ctx.stroke();
        return;
      }
      if (!h.sfrom || !h.stip) return;
      if (h.kind === "move") {
        ctx.beginPath();
        ctx.moveTo(h.sfrom[0], h.sfrom[1]);
        ctx.lineTo(h.stip[0], h.stip[1]);
        ctx.stroke();
        const dx = h.stip[0] - h.sfrom[0];
        const dy = h.stip[1] - h.sfrom[1];
        const l = Math.hypot(dx, dy) || 1;
        const s = (hot ? 16 : 12) * (W / 1600) + 6;
        ctx.beginPath();
        ctx.moveTo(h.stip[0] + (dx / l) * s, h.stip[1] + (dy / l) * s);
        ctx.lineTo(h.stip[0] - (dy / l) * s * 0.6, h.stip[1] + (dx / l) * s * 0.6);
        ctx.lineTo(h.stip[0] + (dy / l) * s * 0.6, h.stip[1] - (dx / l) * s * 0.6);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(h.stip[0], h.stip[1], ((hot ? 11 : 8) * W) / 1600 + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#0b0b0d";
        ctx.stroke();
      }
    });
  }
  function handleAt(pt) {
    let best = null;
    let bd = 18 * (L().canvas ? L().canvas.width / Math.max(1, L().canvas.clientWidth || L().canvas.width) : 1);
    handles.forEach((h) => {
      if (h.kind === "rotate") {
        const s = h.sring;
        for (let i = 1; i < s.length; i++) {
          if (!s[i] || !s[i - 1]) continue;
          const d = segDist(pt, s[i - 1], s[i]);
          if (d < bd) {
            bd = d;
            best = h;
          }
        }
        return;
      }
      if (!h.stip) return;
      const d = Math.hypot(pt[0] - h.stip[0], pt[1] - h.stip[1]);
      const dl = h.kind === "move" && h.sfrom ? segDist(pt, h.sfrom, h.stip) + 4 : Infinity;
      const dd = Math.min(d, dl);
      if (dd < bd) {
        bd = dd;
        best = h;
      }
    });
    return best;
  }
  function segDist(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy || 1;
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2, 0, 1);
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }

  /* the sheet a pencil line is drawn on */
  function sheetFor(e) {
    const lv = L();
    const C = lv.C;
    if (!C) return null;
    const on = S.pen.on;
    if (on === "touch") {
      const h = hitSurface(e);
      if (h && h.obj) {
        const n = norm(h.n);
        let r = cross([0, 1, 0], n);
        if (len(r) < 0.2) r = [C.right[0], 0, C.right[2]];
        r = norm(r);
        const u = cross(n, r);
        return { o: add(h.p, mul(n, 0.012)), r, u, n, floor: n[1] > 0.9, on: h.obj };
      }
    }
    if (on === "floor" || on === "touch") {
      const p = hitLevel(e, 0.006);
      if (!p) return null;
      const { r, f } = V.floorDirs();
      return { o: p, r: norm(r), u: norm(f), n: [0, 1, 0], floor: true };
    }
    /* standing up, facing you, through what the camera looks at */
    const tg = C.target;
    let n = [C.pos[0] - tg[0], 0, C.pos[2] - tg[2]];
    if (len(n) < 1e-3) n = mul(C.fwd, -1);
    n = norm(n);
    const r = norm(cross([0, 1, 0], n));
    const u = cross(n, r);
    return { o: tg.slice(), r, u, n, floor: false };
  }
  /* world point -> a drawing's own flat [right, up] */
  function toSheet(d, place, world) {
    const t = (place.turn || 0) * DEG;
    const s = place.size || 1;
    const Sx = s * (place.sx || 1);
    const Sy = s * (place.sy || 1);
    const Sz = s * (place.sz || 1);
    const v = sub(world, [place.x, place.y, place.z]);
    const lx = v[0] * Math.cos(t) - v[2] * Math.sin(t);
    const lz = v[0] * Math.sin(t) + v[2] * Math.cos(t);
    const loc = [lx / Sx, v[1] / Sy, lz / Sz];
    const q = sub(loc, d.plane.o);
    return [dot(q, d.plane.r), dot(q, d.plane.u)];
  }
  function sheetHit(e, d, place) {
    /* where the pointer's ray meets the drawing's sheet, in the world */
    const t = (place.turn || 0) * DEG;
    const s = place.size || 1;
    const rotY = (v) => [v[0] * Math.cos(t) + v[2] * Math.sin(t), v[1], -v[0] * Math.sin(t) + v[2] * Math.cos(t)];
    const scl = (v) => [v[0] * s * (place.sx || 1), v[1] * s * (place.sy || 1), v[2] * s * (place.sz || 1)];
    const o = add([place.x, place.y, place.z], rotY(scl(d.plane.o)));
    const n = norm(rotY(scl(d.plane.n)));
    const R = V.ray(e);
    if (!R) return null;
    const den = dot(n, R.dir);
    if (Math.abs(den) < 1e-4) return null;
    const k = dot(n, sub(o, R.from)) / den;
    if (k <= 0) return null;
    return add(R.from, mul(R.dir, Math.min(k, 300)));
  }

  const handler = {
    down(e) {
      /* Control+drag a thing spins it; Control+click (or right-click) it opens what it can do (viewer/actions.js).
         Control+drag on empty space still slides you through the world. */
      if (((e.ctrlKey && !e.metaKey) || e.button === 2) && window.CurioActions) {
        const pk0 = V.pickAt(e);
        const o0 = pk0 && obj(pk0.obj);
        if (!o0) return false;
        if (o0.locked) {
          flash(o0.name + " is locked. Unlock it with 🔒 in the list on the left.");
          return true;
        }
        const ids0 = e.altKey ? [o0.id] : groupOf(o0);
        if (!ids0.every((id) => selection().includes(id))) selectIds(ids0);
        drag = { kind: "act" };
        if (window.CurioWear) window.CurioWear.hold(ids0);
        return window.CurioActions.down(e, o0, ids0);
      }
      if (e.ctrlKey || e.metaKey || e.button !== 0) return false;
      const lv = L();
      const pt = V.canvasPoint(e);
      if (["move", "scale", "rotate"].includes(tool)) {
        const h = handleAt(pt);
        if (h) return startHandle(e, h);
      }
      if (tool === "draw") return startStroke(e);
      if (tool === "words") return placeWords(e);
      if (tool === "wall" || tool === "room") return startWall(e);
      if (tool === "paint") return paintAt(e);
      /* select, move, scale, rotate: pick and drag along the floor, in steps, landing on surfaces */
      const pk = V.pickAt(e);
      const o = pk && obj(pk.obj);
      if (!o) {
        if (e.shiftKey) {
          /* Shift-drag on empty space: a box that picks everything inside it */
          drag = { kind: "box", a: pt, b: pt, add: selection() };
          return true;
        }
        multi = [];
        return false; /* empty space swings the camera, as before */
      }
      if (o.locked) {
        flash(o.name + " is locked. Unlock it with 🔒 in the list on the left.");
        return true;
      }
      const ids = e.altKey ? [o.id] : groupOf(o);
      const cur = selection();
      if (e.shiftKey) {
        /* Shift-click adds or takes away; Shift-drag lifts it into the air */
        drag = { kind: "shift", ids, pt0: pt, was: cur };
        if (window.CurioWear) window.CurioWear.hold(ids);
        return true;
      }
      if (!e.altKey && !ids.every((id) => cur.includes(id))) {
        /* the first click on a thing picks it; dragging from there swings the camera, so a plain drag
           anywhere in the picture looks around. Drag a thing that is already picked to move it. */
        selectIds(ids);
        V.changed(true);
        return "orbit";
      }
      if (e.altKey) selectIds(ids);
      else L().film.sel = o.id, (multi = cur.filter((id) => id !== o.id));
      V.edit("build-drag");
      const pl = placeOf(o.id);
      const grab = hitLevel(e, pl.y);
      if (!grab) {
        V.changed(true);
        return true;
      }
      const all = selection();
      const surf = surfaces(all);
      const restTop = topAt(surf, pl.x, pl.z, pl.y + 0.05);
      const starts = {};
      all.forEach((id) => (starts[id] = clone(placeOf(id) || {})));
      drag = { kind: "floor", id: o.id, ids: all, clickIds: ids, starts, off: [pl.x - grab[0], pl.z - grab[2]], y0: pl.y, surf, resting: Math.abs(pl.y - restTop) < 0.06 };
      if (window.CurioWear) window.CurioWear.hold(all);
      V.changed(true);
      return true;
    },
    move(e) {
      if (!drag) return;
      if (drag.kind === "act") return window.CurioActions.move(e);
      if (drag.kind === "floor") return moveFloor(e);
      if (drag.kind === "handle") return moveHandle(e);
      if (drag.kind === "stroke") return moveStroke(e);
      if (drag.kind === "wall") return moveWall(e);
      if (drag.kind === "box") {
        drag.b = V.canvasPoint(e);
        return V.redraw();
      }
      if (drag.kind === "shift" || drag.kind === "lift") return moveLift(e);
    },
    up(e) {
      const d = drag;
      drag = null;
      if (window.CurioWear) window.CurioWear.release();
      if (d && d.kind === "act") return window.CurioActions.up(e);
      if (d && d.kind === "stroke") endStroke(d);
      if (d && d.kind === "wall") endWall(d);
      if (d && d.kind === "box") endBox(d);
      /* a plain click (no drag) on one of several picked things picks just it (and its group) */
      if (d && d.kind === "floor" && !d.moved && d.ids.length > d.clickIds.length) selectIds(d.clickIds);
      if (d && d.kind === "shift") {
        /* a Shift-click that did not move: add to or take away from what is picked */
        const inAll = d.ids.every((id) => d.was.includes(id));
        selectIds(inAll ? d.was.filter((id) => !d.ids.includes(id)) : d.was.concat(d.ids));
      }
      V.changed(true);
    },
    hover(e, dragging) {
      if (dragging || !["move", "scale", "rotate"].includes(tool)) return;
      const h = handleAt(V.canvasPoint(e));
      if (h !== hover) {
        hover = h;
        V.redraw();
      }
    },
    dbl(e) {
      return tool === "draw" || tool === "wall" || tool === "room" || tool === "words";
    },
  };

  function moveFloor(e) {
    const pl = placeOf(drag.id);
    if (!pl) return;
    const p = hitLevel(e, drag.y0);
    if (!p) return;
    const free = e.altKey;
    pl.x = r3(snapV(p[0] + drag.off[0], S.snap, free));
    pl.z = r3(snapV(p[2] + drag.off[1], S.snap, free));
    drag.moved = true;
    const s0 = drag.starts[drag.id];
    const dy0 = pl.y;
    if (S.land && drag.resting) pl.y = r3(topAt(drag.surf, pl.x, pl.z));
    /* everything else picked moves the same way */
    drag.ids.forEach((id) => {
      if (id === drag.id) return;
      const q = placeOf(id);
      const q0 = drag.starts[id];
      if (!q || !q0) return;
      q.x = r3(q0.x + pl.x - s0.x);
      q.z = r3(q0.z + pl.z - s0.z);
      q.y = r3(Math.max(0, q0.y + pl.y - s0.y));
    });
    void dy0;
    V.changed(false);
  }
  /* Shift-drag on a thing lifts it (and everything picked with it) straight up or down */
  function moveLift(e) {
    const pt = V.canvasPoint(e);
    if (drag.kind === "shift") {
      if (Math.hypot(pt[0] - drag.pt0[0], pt[1] - drag.pt0[1]) < 5) return;
      if (!drag.ids.every((id) => drag.was.includes(id))) selectIds(drag.ids);
      V.edit("build-lift");
      const ids = selection();
      const starts = {};
      ids.forEach((id) => (starts[id] = clone(placeOf(id) || {})));
      const p0 = placeOf(L().film.sel);
      drag = { kind: "lift", ids, starts, pt0: drag.pt0, from: [p0.x, p0.y, p0.z] };
    }
    const d = snapV(alongAxis(e, drag.from, [0, 1, 0]), S.snap, e.altKey);
    drag.ids.forEach((id) => {
      const q = placeOf(id);
      if (q) q.y = r3(Math.max(0, drag.starts[id].y + d));
    });
    V.changed(false);
  }
  function endBox(d) {
    const x0 = Math.min(d.a[0], d.b[0]);
    const x1 = Math.max(d.a[0], d.b[0]);
    const y0 = Math.min(d.a[1], d.b[1]);
    const y1 = Math.max(d.a[1], d.b[1]);
    if (x1 - x0 < 4 && y1 - y0 < 4) return;
    const lv = L();
    const st = lv.state;
    const hit = [];
    lv.film.objects.forEach((o) => {
      const p = st.place[o.id];
      if (!p || !p.show || o.locked) return;
      const b = bounds(o, p);
      const q = V.projectNow(b.c);
      if (q && q[0] >= x0 && q[0] <= x1 && q[1] >= y0 && q[1] <= y1) groupOf(o).forEach((id) => hit.push(id));
    });
    selectIds(d.add.concat(hit));
    flash(hit.length ? `Picked ${selection().length} things. Drag one to move them all; ⌘G groups them.` : "Nothing inside the box.");
  }
  function startHandle(e, h) {
    const id = L().film.sel;
    const pl = placeOf(id);
    if (!pl) return false;
    V.edit("build-" + h.kind);
    const R = V.ray(e);
    const others = {};
    selection().forEach((x) => x !== id && placeOf(x) && (others[x] = clone(placeOf(x))));
    drag = { kind: "handle", h, id, start: clone(pl), others, pt0: V.canvasPoint(e) };
    if (window.CurioWear) window.CurioWear.hold([id].concat(Object.keys(others)));
    if (h.kind === "rotate") {
      const p = hitLevel(e, h.c[1]);
      drag.a0 = p ? Math.atan2(p[0] - h.c[0], p[2] - h.c[2]) / DEG : 0;
    }
    return !!R || true;
  }
  /* how far, in metres along the handle's direction, the pointer has moved since the drag began */
  function alongAxis(e, from, axis) {
    const a = V.projectNow(from);
    const b = V.projectNow(add(from, axis));
    if (!a || !b) return 0;
    const sx = b[0] - a[0];
    const sy = b[1] - a[1];
    const l2 = sx * sx + sy * sy;
    if (l2 < 1e-6) return 0;
    const pt = V.canvasPoint(e);
    return ((pt[0] - drag.pt0[0]) * sx + (pt[1] - drag.pt0[1]) * sy) / l2;
  }
  function moveHandle(e) {
    const h = drag.h;
    const pl = placeOf(drag.id);
    const s0 = drag.start;
    if (!pl) return;
    const free = e.altKey;
    if (h.kind === "move") {
      const d = snapV(alongAxis(e, h.from, h.axis), S.snap, free);
      pl.x = r3(s0.x + h.axis[0] * d);
      pl.y = r3(Math.max(0, s0.y + h.axis[1] * d));
      pl.z = r3(s0.z + h.axis[2] * d);
    } else if (h.kind === "scale") {
      let d = snapV(alongAxis(e, h.from, h.axis), S.snap ? S.snap / 2 : 0, free);
      d = Math.max(d, -h.ext + 0.02);
      const k = (h.ext + d) / h.ext;
      if (e.shiftKey) {
        pl.size = r3(clamp((s0.size || 1) * k, 0.05, 40));
      } else {
        const key = ["sx", "sy", "sz"][h.k];
        pl[key] = r3(clamp((s0[key] || 1) * k, 0.02, 60));
        /* the far side stays where it was: the middle moves half as far */
        const shift = mul(h.axis, d / 2);
        if (h.k === 1) {
          if (h.sgn < 0) pl.y = r3(Math.max(0, s0.y - d));
        } else {
          pl.x = r3(s0.x + shift[0]);
          pl.z = r3(s0.z + shift[2]);
        }
      }
    } else {
      const p = hitLevel(e, h.c[1]);
      if (!p) return;
      const a = Math.atan2(p[0] - h.c[0], p[2] - h.c[2]) / DEG;
      let t = s0.turn + (a - drag.a0);
      t = snapV(t, S.turnSnap, free);
      pl.turn = Math.round((((t + 180) % 360) + 360) % 360 - 180);
    }
    /* the others picked with it: moved by the same amount, or turned around the same middle */
    const dTurn = ((pl.turn - s0.turn) * Math.PI) / 180;
    Object.keys(drag.others).forEach((id) => {
      const q = placeOf(id);
      const q0 = drag.others[id];
      if (!q) return;
      if (h.kind === "move") {
        q.x = r3(q0.x + pl.x - s0.x);
        q.y = r3(Math.max(0, q0.y + pl.y - s0.y));
        q.z = r3(q0.z + pl.z - s0.z);
      } else if (h.kind === "rotate") {
        const dx = q0.x - h.c[0];
        const dz = q0.z - h.c[2];
        q.x = r3(h.c[0] + dx * Math.cos(dTurn) + dz * Math.sin(dTurn));
        q.z = r3(h.c[2] - dx * Math.sin(dTurn) + dz * Math.cos(dTurn));
        q.turn = Math.round(q0.turn + (dTurn * 180) / Math.PI);
      }
    });
    V.changed(false);
  }

  /* ---- the pencil ---- */
  function startStroke(e) {
    const lv = L();
    let d = pendingDrawing && obj(pendingDrawing);
    if (!d) {
      const sel = lv.film.sel && obj(lv.film.sel);
      if (sel && sel.make === "sketch" && S.pen.on !== "touch") d = sel;
    }
    V.edit("build-draw");
    let place;
    if (!d) {
      const sh = sheetFor(e);
      if (!sh) return false;
      const n = lv.film.objects.filter((o) => o.make === "sketch").length + 1;
      const anchor = [r3(sh.o[0]), 0, r3(sh.o[2])];
      const plane = { o: sub(sh.o, anchor).map(r3), r: sh.r.map(r3), u: sh.u.map(r3), n: sh.n.map(r3), floor: !!sh.floor };
      d = { id: uid("drawing"), kind: "made", make: "sketch", name: "Drawing " + n, color: S.pen.color, strokes: [], plane, solid: "flat", depth: 0.2, noShadow: true, look: Math.max(0.1, sh.o[1]), ring: 0.4 };
      place = { x: anchor[0], y: 0, z: anchor[2], turn: 0, size: 1, show: true };
      lv.film.objects.push(d);
      lv.film.panels.forEach((p) => (p.place[d.id] = clone(place)));
      /* drawn onto a thing (pencil "on things"): the drawing sticks to it and goes where it goes */
      const on = sh.on && obj(sh.on);
      if (on && on.make !== "sketch" && window.CurioWear) window.CurioWear.pin(d.id, on.id);
    }
    place = placeOf(d.id);
    pendingDrawing = d.id;
    lv.film.sel = d.id;
    const w = sheetHit(e, d, place);
    if (!w) return true;
    const q = toSheet(d, place, w).map(r3);
    const st = { p: [q], c: S.pen.color, w: S.pen.w };
    d.strokes.push(st);
    drag = { kind: "stroke", id: d.id, st, start: q, last: q, raw: [q], pt: V.canvasPoint(e) };
    V.changed(false);
    return true;
  }
  function moveStroke(e) {
    const d = obj(drag.id);
    const place = placeOf(drag.id);
    if (!d || !place) return;
    const w = sheetHit(e, d, place);
    if (!w) return;
    const q = toSheet(d, place, w);
    const shape = S.pen.shape;
    if (shape !== "free" || e.shiftKey) {
      drag.st.p = shapePoints(shape === "free" ? "line" : shape, drag.start, q, e.shiftKey && shape !== "free").map((p) => p.map(r3));
      return V.changed(false);
    }
    /* steady hand: the pencil trails a little behind the pointer, which smooths out the wobbles */
    const k = 1 - clamp(S.pen.smooth, 0, 0.95) * 0.85;
    const nq = [drag.last[0] + (q[0] - drag.last[0]) * k, drag.last[1] + (q[1] - drag.last[1]) * k];
    const pt = V.canvasPoint(e);
    if (Math.hypot(pt[0] - drag.pt[0], pt[1] - drag.pt[1]) < 3) return;
    drag.pt = pt;
    drag.last = nq;
    drag.st.p.push(nq.map(r3));
    V.changed(false);
  }
  function endStroke(dg) {
    const d = obj(dg.id);
    if (!d) return;
    const st = dg.st;
    if (S.pen.shape === "free" && st.p.length > 2) st.p.push(dg.last.map(r3));
    if (st.p.length > 400) st.p = resample(st.p, 400).map((p) => p.map(r3));
    if (S.pen.mirror) {
      /* mirror: the same line flipped across the sheet's middle (the dashed line) */
      d.strokes.push({ p: st.p.map((q) => [r3(-q[0]), q[1]]), c: st.c, w: st.w });
    }
  }

  /* ---- words ---- */
  function placeWords(e) {
    const h = hitSurface(e);
    if (!h) return false;
    const n = L().film.objects.filter((o) => o.make === "text").length + 1;
    const W = S.words;
    const x = r3(snapV(h.p[0], S.snap ? S.snap / 2 : 0, e.altKey));
    const z = r3(snapV(h.p[2], S.snap ? S.snap / 2 : 0, e.altKey));
    insert({ id: uid("words"), kind: "made", make: "text", name: "Words " + n, text: W.text || "Words", font: W.font, size: W.size, color: W.color, bold: W.bold, italic: W.italic, outline: W.outline, depth: W.depth, face: W.face, flat: W.flat, look: W.size / 2, ring: 0.3, noShadow: true }, { x, y: r3(h.p[1]), z, turn: facingCamera(x, z), size: 1, show: true });
    V.showTab("build");
    setTimeout(() => {
      const ta = document.querySelector('.cvb [data-bk="o.text"]');
      if (ta) {
        ta.focus();
        ta.select();
      }
    }, 30);
    return true;
  }

  /* ---- walls and rooms (The Sims) ---- */
  function startWall(e) {
    const p = hitLevel(e, 0);
    if (!p) return false;
    const g = e.altKey ? 0 : 0.5;
    const a = [r3(snapV(p[0], g)), r3(snapV(p[2], g))];
    V.edit("build-wall");
    const lv = L();
    const n = lv.film.objects.filter((o) => o.make === "walls").length + 1;
    const d = { id: uid("walls"), kind: "made", make: "walls", name: (tool === "room" ? "Room " : "Wall ") + n, color: "#e9e5dc", h: S.wallH, t: 0.15, segs: [[0, 0, 0, 0]], look: 1.3, ring: 1, noShadow: true };
    if (tool === "room") d.floor = [0, 0, 0, 0];
    const spot = { x: a[0], y: 0, z: a[1], turn: 0, size: 1, show: true };
    lv.film.objects.push(d);
    lv.film.panels.forEach((q) => (q.place[d.id] = clone(spot)));
    lv.film.sel = d.id;
    drag = { kind: "wall", id: d.id, a, room: tool === "room" };
    V.changed(false);
    return true;
  }
  function moveWall(e) {
    const d = obj(drag.id);
    const p = hitLevel(e, 0);
    if (!d || !p) return;
    const g = e.altKey ? 0 : 0.5;
    let bx = r3(snapV(p[0], g) - drag.a[0]);
    let bz = r3(snapV(p[2], g) - drag.a[1]);
    if (!drag.room && e.shiftKey) {
      /* Shift keeps the wall straight along the floor's lines or at 45 degrees */
      const ang = Math.round(Math.atan2(bz, bx) / (Math.PI / 4)) * (Math.PI / 4);
      const l = Math.hypot(bx, bz);
      bx = r3(Math.cos(ang) * l);
      bz = r3(Math.sin(ang) * l);
    }
    if (drag.room) {
      d.segs = [[0, 0, bx, 0], [bx, 0, bx, bz], [bx, bz, 0, bz], [0, bz, 0, 0]];
      d.floor = [0, 0, bx, bz];
    } else d.segs = [[0, 0, bx, bz]];
    d.ring = Math.max(0.5, Math.hypot(bx, bz) / 2);
    V.changed(false);
  }
  function endWall(dg) {
    const d = obj(dg.id);
    if (!d) return;
    const s = d.segs[d.room ? 0 : 0];
    const big = d.floor ? Math.abs(d.floor[2] - d.floor[0]) > 0.3 && Math.abs(d.floor[3] - d.floor[1]) > 0.3 : Math.hypot(s[2] - s[0], s[3] - s[1]) > 0.3;
    if (!big) {
      const lv = L();
      lv.film.objects = lv.film.objects.filter((x) => x.id !== d.id);
      lv.film.panels.forEach((q) => delete q.place[d.id]);
      lv.film.sel = null;
    }
  }

  /* ---- copy a color (The Sims' eyedropper) ---- */
  function paintAt(e) {
    const pk = V.pickAt(e);
    const o = pk && obj(pk.obj);
    if (!o) return true;
    if (!paintColor || e.shiftKey) {
      paintColor = o.color;
      flash("Picked up " + o.name + "'s color. Now click other things to paint them.");
      renderTab();
      return true;
    }
    V.edit("build-paint");
    o.color = paintColor;
    L().film.sel = o.id;
    V.changed(true);
    return true;
  }

  /* ---------- drawing over the picture: handles, the drawing sheet, the mirror line ---------- */
  V.onOverlay((ctx, C, st) => {
    computeHandles(C, st);
    drawPicked(ctx, st);
    drawHandles(ctx, C);
    drawSteps(ctx);
    if (tool === "draw" && C) drawSheetHint(ctx, C, st);
  });
  /* the other picked things get a dashed box; a Shift-drag shows its box */
  function drawPicked(ctx, st) {
    const W = ctx.canvas.width;
    ctx.save();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = Math.max(1.5, W / 800);
    ctx.setLineDash([6, 5]);
    multi.forEach((id) => {
      const o = obj(id);
      const p = o && st.place[id];
      if (!p || !p.show) return;
      const b = bounds(o, p);
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const q = V.projectNow([i & 1 ? b.hi[0] : b.lo[0], i & 2 ? b.hi[1] : b.lo[1], i & 4 ? b.hi[2] : b.lo[2]]);
        if (q) pts.push(q);
      }
      if (pts.length < 2) return;
      const xs = pts.map((q) => q[0]);
      const ys = pts.map((q) => q[1]);
      ctx.strokeRect(Math.min(...xs) - 3, Math.min(...ys) - 3, Math.max(...xs) - Math.min(...xs) + 6, Math.max(...ys) - Math.min(...ys) + 6);
    });
    if (drag && drag.kind === "box") {
      ctx.fillStyle = "rgba(34,211,238,0.12)";
      const x = Math.min(drag.a[0], drag.b[0]);
      const y = Math.min(drag.a[1], drag.b[1]);
      ctx.fillRect(x, y, Math.abs(drag.b[0] - drag.a[0]), Math.abs(drag.b[1] - drag.a[1]));
      ctx.strokeRect(x, y, Math.abs(drag.b[0] - drag.a[0]), Math.abs(drag.b[1] - drag.a[1]));
    }
    ctx.restore();
  }
  /* the step sizes, always in sight while building (UEFN shows them on its toolbar) */
  function stepWords() {
    const m = S.snap ? (S.snap < 1 ? Math.round(S.snap * 100) + " cm" : S.snap + " m") : "free";
    const t = S.turnSnap ? S.turnSnap + "°" : "free";
    return `Steps: move ${m} · turn ${t}`;
  }
  function drawSteps(ctx) {
    if (!["select", "move", "scale", "rotate"].includes(tool)) return;
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const fs = Math.max(11, Math.round(W / 105));
    ctx.save();
    ctx.font = `600 ${fs}px -apple-system, "Segoe UI", system-ui, sans-serif`;
    const n = selection().length;
    const txt = TOOLS[tool][1] + " · " + stepWords() + (n > 1 ? ` · ${n} picked` : "");
    const w = ctx.measureText(txt).width + fs * 1.2;
    const x = W - w - fs * 0.6;
    const y = H - fs * 2.4;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, w, fs * 1.7);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x + fs * 0.6, y + fs * 0.85);
    ctx.restore();
  }
  function drawSheetHint(ctx, C) {
    const lv = L();
    const d = (pendingDrawing && obj(pendingDrawing)) || (lv.film.sel && obj(lv.film.sel) && obj(lv.film.sel).make === "sketch" ? obj(lv.film.sel) : null);
    let o;
    let r;
    let u;
    if (d) {
      const pl = placeOf(d.id);
      if (!pl) return;
      const t = (pl.turn || 0) * DEG;
      const s = pl.size || 1;
      const rotY = (v) => [v[0] * Math.cos(t) + v[2] * Math.sin(t), v[1], -v[0] * Math.sin(t) + v[2] * Math.cos(t)];
      o = add([pl.x, pl.y, pl.z], rotY(mul(d.plane.o, s)));
      r = rotY(d.plane.r);
      u = rotY(d.plane.u);
    } else if (S.pen.on === "face") {
      const tg = C.target;
      let n = [C.pos[0] - tg[0], 0, C.pos[2] - tg[2]];
      if (len(n) < 1e-3) return;
      n = norm(n);
      r = norm(cross([0, 1, 0], n));
      u = [0, 1, 0];
      o = tg;
    } else return;
    const span = Math.max(1, Math.min(6, (C.d || 4) * 0.45));
    const P = (a, b) => V.projectNow(add(o, add(mul(r, a), mul(u, b))));
    ctx.save();
    ctx.strokeStyle = "rgba(34,211,238,0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 6]);
    const corners = [P(-span, -span * 0.6), P(span, -span * 0.6), P(span, span * 0.6), P(-span, span * 0.6)];
    if (corners.every(Boolean)) {
      ctx.beginPath();
      corners.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
      ctx.stroke();
    }
    if (S.pen.mirror) {
      const a = P(0, -span * 0.6);
      const b = P(0, span * 0.6);
      if (a && b) {
        ctx.strokeStyle = "rgba(255,159,67,0.8)";
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ---------- keys ---------- */
  V.onKey((e) => {
    if (!V.isOpen()) return false;
    const mod = e.metaKey || e.ctrlKey;
    const lv = L();
    const k0 = (e.key || "").toLowerCase();
    if (mod && k0 === "d") {
      if (!lv.film.sel) return false;
      e.preventDefault();
      duplicate(selection());
      return true;
    }
    if (mod && ((k0 === "g" && e.shiftKey) || k0 === "u")) {
      e.preventDefault();
      ungroupSel();
      return true;
    }
    if (mod && k0 === "g") {
      e.preventDefault();
      groupSel();
      return true;
    }
    if (mod && k0 === "a" && !e.shiftKey) {
      e.preventDefault();
      selectIds(lv.film.objects.filter((o) => !o.locked && lv.panel.place[o.id] && lv.panel.place[o.id].show !== false).map((o) => o.id));
      V.changed(true);
      return true;
    }
    if (mod || e.altKey) return false;
    if ((e.key === "Delete" || e.key === "Backspace") && lv.film.sel) {
      e.preventDefault();
      removeThing(selection());
      return true;
    }
    const map = { 1: "select", 2: "move", 3: "scale", 4: "rotate", p: "draw", t: "words", w: "wall", r: "room", c: "paint" };
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (map[k]) {
      setTool(map[k]);
      if (["draw", "words", "wall", "room", "paint"].includes(map[k])) V.showTab("build");
      else renderTab();
      return true;
    }
    if (e.key === "Escape" && tool !== "select") {
      setTool("select");
      renderTab();
      return true;
    }
    if (e.key === "Enter" && tool === "draw" && pendingDrawing) {
      pendingDrawing = null;
      flash("Drawing finished. The next line starts a new drawing.");
      return true;
    }
    return false;
  });

  /* ---------- the "In the scene" list: quick buttons ---------- */
  V.onThings((box) => {
    /* Explorer / Outliner: every row gets an eye (shown in this panel) and a lock (can't be picked by mistake) */
    const lv = L();
    const picked = selection();
    box.querySelectorAll("button.cv-thing[data-thing]").forEach((b) => {
      const id = b.dataset.thing;
      const o = obj(id);
      if (!o) return;
      const pl = lv.panel.place[id];
      const row = document.createElement("div");
      row.className = "cvb-trow" + (picked.includes(id) && id !== lv.film.sel ? " picked" : "");
      b.replaceWith(row);
      row.appendChild(b);
      if (o.group) b.insertAdjacentHTML("beforeend", `<small class="cvb-g" title="In ${esc(o.groupName || "a group")}">${esc((o.groupName || "Group").replace("Group ", "G"))}</small>`);
      row.insertAdjacentHTML("beforeend", `<button type="button" class="cvb-ic${pl && pl.show === false ? " off" : ""}" data-beye="${esc(id)}" title="${pl && pl.show === false ? "Hidden in this panel: click to show" : "Shown in this panel: click to hide"}" aria-label="Show or hide ${esc(o.name)}">${pl && pl.show === false ? "◌" : "👁"}</button><button type="button" class="cvb-ic${o.locked ? " on" : ""}" data-block="${esc(id)}" title="${o.locked ? "Locked: click to unlock" : "Lock it so it can't be picked or moved by mistake"}" aria-label="Lock ${esc(o.name)}">${o.locked ? "🔒" : "🔓"}</button>`);
    });
    if (!box.dataset.cvbRows) {
      box.dataset.cvbRows = "1";
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-beye], [data-block]");
        if (b) {
          const id = b.dataset.beye || b.dataset.block;
          const o = obj(id);
          if (!o) return;
          if (b.dataset.beye) {
            V.edit("build-eye");
            const pl = placeOf(id);
            if (pl) pl.show = pl.show === false;
          } else {
            V.edit("build-lock");
            o.locked = !o.locked;
            if (o.locked) selectIds(selection().filter((x) => x !== id));
          }
          return V.changed(true);
        }
        /* Shift-click a name adds it to what is picked; a plain click picks its whole group */
        const t = e.target.closest("button.cv-thing[data-thing]");
        if (!t) return;
        const o = obj(t.dataset.thing);
        if (!o) return;
        if (e.shiftKey) {
          const cur = selection().filter((x) => x !== o.id);
          selectIds(cur.concat([o.id]));
          setTimeout(() => V.changed(true), 0);
        } else if (o.group && !e.altKey) {
          setTimeout(() => {
            selectIds([o.id].concat(groupOf(o).filter((x) => x !== o.id)));
            V.changed(true);
          }, 0);
        } else multi = [];
      }, true);
    }
    /* Jeremy (20:16Z): the list scrolls, every row has a +, and the searches sit at the top */
    const rows = Array.from(box.querySelectorAll(":scope > .cvb-trow"));
    if (rows.length) {
      const sc = document.createElement("div");
      sc.className = "cvb-scroll cvb-scene";
      rows[0].before(sc);
      rows.forEach((r) => {
        const id = r.querySelector("[data-thing]").dataset.thing;
        r.querySelector("[data-beye]").insertAdjacentHTML("beforebegin", `<button type="button" class="cvb-ic cvb-plus" data-bplus="${esc(id)}" title="Add another one like it" aria-label="Add another ${esc((obj(id) || {}).name || "")}">+</button>`);
        sc.appendChild(r);
      });
    }
    const finds = document.createElement("div");
    finds.className = "cvb-finds";
    finds.innerHTML = `<button type="button" data-find="objects" title="Search hundreds of everyday objects: World, Place, Type">🔍 Object search</button><button type="button" data-find="settings" title="Pick where the scene takes place: a kitchen, a street, a forest, a harbor…">🏙 Setting search</button><button type="button" data-find="characters" title="Bring people and animals in, take them out, or change them">🧍 Character search</button>`;
    box.prepend(finds);
    const addRow = box.querySelector(".cv-addrow");
    if (addRow) {
      const list = document.createElement("div");
      list.className = "cvb-scroll cvb-addlist";
      addRow.querySelectorAll("[data-addkind]").forEach((b) => {
        b.className = "cvb-addit";
        b.innerHTML = `<span>${esc(b.textContent.replace(/^\+\s*/, ""))}</span><b aria-hidden="true">+</b>`;
        list.appendChild(b);
      });
      Object.keys(PARTS).forEach((k) => list.insertAdjacentHTML("beforeend", `<button type="button" class="cvb-addit" data-bpart="${k}" title="${esc(PARTS[k][1])}"><span>${esc(PARTS[k][0])}</span><b aria-hidden="true">+</b></button>`));
      list.insertAdjacentHTML("beforeend", `<button type="button" class="cvb-addit" data-bq="draw" title="Draw in the picture with a pencil (P)"><span>✏ A drawing</span><b aria-hidden="true">+</b></button><button type="button" class="cvb-addit" data-bq="words" title="Put words in the picture (T)"><span>T Words</span><b aria-hidden="true">+</b></button>`);
      addRow.replaceWith(list);
    }
    if (!box.dataset.cvbFinds) {
      box.dataset.cvbFinds = "1";
      box.addEventListener("click", (e) => {
        const f = e.target.closest("[data-find]");
        if (f) return openSearch({ mode: f.dataset.find });
        const pl = e.target.closest("[data-bplus]");
        if (pl) {
          e.stopPropagation();
          return duplicate(pl.dataset.bplus);
        }
        const pt = e.target.closest("[data-bpart]");
        if (pt) return addPart(pt.dataset.bpart);
        const q = e.target.closest("[data-bq]");
        if (q) {
          setTool(q.dataset.bq);
          V.showTab("build");
        }
      });
    }
  });

  /* ---------- the Build tab ---------- */
  let openSection = "tools";
  let bodyEl = null;
  function renderTab() {
    if (bodyEl && bodyEl.isConnected && L().tab === "build") render(bodyEl);
  }
  function seg(label, key, val, opts) {
    return `<label class="cv-field"><span><b>${label}</b></span><select data-bk="${key}">${opts.map(([v, l]) => `<option value="${v}"${String(v) === String(val) ? " selected" : ""}>${l}</option>`).join("")}</select></label>`;
  }
  function sec(id, title, html) {
    const open = openSection === id || id === "this" || id === "pencil" || id === "words";
    return `<details class="cvb-sec" data-sec="${id}"${open ? " open" : ""}><summary>${title}</summary><div class="cvb-in">${html}</div></details>`;
  }
  function render(body) {
    bodyEl = body;
    const lv = L();
    const o = lv.film.sel && obj(lv.film.sel);
    const T = TOOLS[tool];
    let h = `<div class="cvb"><div class="cvb-winslot"></div>`;
    h += `<div class="cvb-tools" role="toolbar" aria-label="Build tools">${Object.keys(TOOLS)
      .map((k) => `<button type="button" data-btool="${k}" class="${k === tool ? "on" : ""}" title="${esc(TOOLS[k][1])} (${TOOLS[k][2]}). ${esc(TOOLS[k][3])}"><span>${TOOLS[k][0]}</span><small>${esc(TOOLS[k][1])}</small></button>`)
      .join("")}</div>
      <p class="cv-say cvb-hint"><b>${esc(T[1])}:</b> ${esc(T[3])}</p>
      <div class="cv-row cvb-steps"><button type="button" data-ba="snapm" title="Click to change how far each move jumps">Move steps: <b>${S.snap ? (S.snap < 1 ? Math.round(S.snap * 100) + " cm" : S.snap + " m") : "free"}</b></button><button type="button" data-ba="snapt" title="Click to change how far each turn jumps">Turn steps: <b>${S.turnSnap ? S.turnSnap + "°" : "free"}</b></button></div>`;
    const nSel = selection().length;
    const inGroup = selection().some((id) => obj(id).group);
    h += `<div class="cv-row"><button type="button" class="cv-primary" data-ba="search">🔍 Search objects</button><button type="button" data-ba="dup" ${o ? "" : "disabled"} title="Make a copy right next to it (⌘D)">Duplicate</button><button type="button" data-ba="del" ${o ? "" : "disabled"} title="Take it out of the film (Delete)">Delete</button></div>
      <div class="cv-row"><button type="button" data-ba="group" ${nSel > 1 ? "" : "disabled"} title="Make the picked things one group that moves together (⌘G)">Group${nSel > 1 ? " " + nSel : ""}</button><button type="button" data-ba="ungroup" ${inGroup ? "" : "disabled"} title="Break the group apart (⌘U)">Ungroup</button><small class="cv-say">Shift-click to pick more, Shift-drag on empty space for a box, ⌘A for all.</small></div>`;
    if (o) h += sec("this", "This thing: " + esc(o.name), thisHtml(o));
    if (tool === "draw") h += sec("pencil", "Pencil", pencilHtml());
    if (tool === "words") h += sec("words", "Words", wordsHtml(null));
    h += sec("snap", "Snapping (steps)", `
      ${seg("Moves jump in steps of", "snap", S.snap, [[0, "No steps (free)"], [0.1, "10 cm"], [0.25, "25 cm"], [0.5, "half a metre"], [1, "1 metre"], [3, "3 metres (a build square)"]])}
      ${seg("Turns jump in steps of", "turnSnap", S.turnSnap, [[0, "No steps (free)"], [5, "5°"], [15, "15°"], [45, "45° (like The Sims)"], [90, "90° (a quarter turn)"]])}
      <label><input type="checkbox" data-bk="land" ${S.land ? "checked" : ""}/> Things land on what is under them (a mug on a table)</label>
      <small class="cv-say">Steps keep things lined up neatly, like Roblox. Hold Alt (Option) while dragging to place freely for one move.</small>`);
    h += sec("parts", "Parts and 3D shapes", `<div class="cvb-grid">${PART_KEYS.map((k) => `<button type="button" data-bpart="${k}" title="${esc(PARTS[k][1])}">${partIcon(k)}<small>${esc(PARTS[k][0])}</small></button>`).join("")}</div><small class="cv-say">A new part lands in the middle of the picture. Stretch it with Scale (3), turn it with Rotate (4).</small>`);
    h += sec("pieces", "Build pieces and ready-made sets", `
      <small class="cv-say">Like Fortnite Creative: whole walls, floors, stairs and roofs that click onto a 3-metre grid.</small>
      ${seg("Made of", "material", S.material, Object.keys(MATERIALS).map((k) => [k, MATERIALS[k][0]]))}
      <div class="cvb-grid">${Object.keys(PIECES).map((k) => `<button type="button" data-bpiece="${k}" title="${esc(PIECES[k][1])}"><b>${esc(PIECES[k][0])}</b></button>`).join("")}</div>
      <h3>Ready-made sets</h3>
      <div class="cvb-list">${PREFABS.map((p) => `<button type="button" data-bprefab="${p.id}" title="${esc(p.say)}"><b>${esc(p.name)}</b><small>${esc(p.say)}</small></button>`).join("")}</div>`);
    h += sec("walls", "Walls and rooms", `
      <small class="cv-say">Like The Sims: pick Wall (W) and drag along the floor; pick Room (R) and drag a rectangle. Walls click to a half-metre grid; hold Shift for straight lines, Alt for free.</small>
      <label class="cv-field"><span><b>Wall height</b><em>${S.wallH.toFixed(1)} m</em></span><input type="range" data-bk="wallH" min="0.5" max="6" step="0.1" value="${S.wallH}" /></label>`);
    h += `</div>`;
    body.innerHTML = h;
    if (window.CurioBuildWindows) window.CurioBuildWindows.slot(body.querySelector(".cvb-winslot"));
    if (!body.dataset.cvbWired) {
      body.dataset.cvbWired = "1";
      body.addEventListener("click", onTabClick);
      body.addEventListener("input", onTabInput);
      body.addEventListener("change", onTabInput);
      body.addEventListener("toggle", (e) => {
        const d = e.target;
        if (d.matches && d.matches("details.cvb-sec") && d.open) openSection = d.dataset.sec;
      }, true);
    }
  }
  function partIcon(k) {
    const I = { block: "■", ball: "●", wedge: "◢", cornerwedge: "◣", cylinder: "▮", cone: "▲", pyramid: "△", dome: "◓", ring: "◯", arch: "∩", stairs: "▟", plank: "▬", disc: "⬬" };
    return `<span>${I[k] || "■"}</span>`;
  }
  function pencilHtml() {
    const P = S.pen;
    return `
      <h3>Shapes</h3>
      <div class="cvb-grid">${Object.keys(SHAPES).map((k) => `<button type="button" data-bshape="${k}" class="${P.shape === k ? "on" : ""}" title="${esc(SHAPES[k][1])}: ${esc(SHAPES[k][2])}"><span>${SHAPES[k][0]}</span><small>${esc(SHAPES[k][1])}</small></button>`).join("")}</div>
      <div class="cv-row"><label>Color <input type="color" data-bk="pen.color" value="${esc(P.color)}" /></label>
      ${["#1c1712", "#ffffff", "#e23b3b", "#ff9f43", "#ffd23f", "#3fb950", "#22d3ee", "#4a7bd0", "#a970ff", "#ff6fb5"].map((c) => `<button type="button" class="cvb-sw" data-bpen="${c}" style="background:${c}" title="${c}" aria-label="Color ${c}"></button>`).join("")}</div>
      <label class="cv-field"><span><b>Pencil thickness</b><em>${Math.round(P.w * 1000) / 10} cm</em></span><input type="range" data-bk="pen.w" min="0.003" max="0.2" step="0.001" value="${P.w}" /></label>
      <label class="cv-field"><span><b>Steady hand</b><em>${Math.round(P.smooth * 100)}%</em></span><input type="range" data-bk="pen.smooth" min="0" max="0.95" step="0.05" value="${P.smooth}" /><small>Smooths out wobbles: the pencil trails a little behind your hand.</small></label>
      ${seg("Draw on", "pen.on", P.on, [["face", "A sheet standing up, facing me"], ["floor", "The floor"], ["touch", "Whatever I start on (a wall, a table)"]])}
      <label><input type="checkbox" data-bk="pen.mirror" ${P.mirror ? "checked" : ""}/> Mirror: every line is copied flipped across the orange line (faces, cars, butterflies)</label>
      <small class="cv-say">Hold Shift for a straight line. Lines join one drawing until you press Enter or click <b>New drawing</b>. Control-drag still slides the view.</small>
      <div class="cv-row"><button type="button" data-ba="newdrawing">New drawing</button><button type="button" data-ba="undoline" title="Take away the last line of this drawing">Take away last line</button></div>`;
  }
  function wordsHtml(o) {
    const W = o || S.words;
    const pre = o ? "o." : "words.";
    return `
      <textarea data-bk="${pre}text" rows="2" placeholder="Type the words">${esc(W.text)}</textarea>
      <div class="cvb-fonts">${Object.keys(FONTS).map((k) => `<button type="button" data-bfont="${k}" data-pre="${pre}" class="${W.font === k ? "on" : ""}" style="font-family:${esc(FONTS[k][1])}">${esc(FONTS[k][0])}</button>`).join("")}</div>
      <div class="cv-row"><label>Color <input type="color" data-bk="${pre}color" value="${esc(W.color)}" /></label>
      <label><input type="checkbox" data-bk="${pre}bold" ${W.bold ? "checked" : ""}/> <b>Bold</b></label>
      <label><input type="checkbox" data-bk="${pre}italic" ${W.italic ? "checked" : ""}/> <i>Slanted</i></label>
      <label><input type="checkbox" data-bk="${pre}outline" ${W.outline ? "checked" : ""}/> Outline</label></div>
      <label class="cv-field"><span><b>Letter height</b><em>${Math.round(W.size * 100)} cm</em></span><input type="range" data-bk="${pre}size" min="0.05" max="5" step="0.01" value="${W.size}" /></label>
      <label class="cv-field"><span><b>3D thickness</b><em>${W.depth ? Math.round(W.depth * 100) + " cm" : "flat"}</em></span><input type="range" data-bk="${pre}depth" min="0" max="1" step="0.01" value="${W.depth || 0}" /><small>Above zero, the letters become solid blocks.</small></label>
      <label><input type="checkbox" data-bk="${pre}face" ${W.face ? "checked" : ""}/> Always face the camera (like a label)</label>
      <label><input type="checkbox" data-bk="${pre}flat" ${W.flat ? "checked" : ""}/> Lay it on the floor (like words painted on a road)</label>
      ${o ? "" : `<small class="cv-say">Now click in the picture where the words should go.</small>`}`;
  }
  function thisHtml(o) {
    let h = "";
    if (o.make === "sketch") {
      h += `<small class="cv-say">${o.strokes.length} line${o.strokes.length === 1 ? "" : "s"}. Keep it as a pencil drawing, or let the app make it 3D:</small>
        <div class="cvb-list">${Object.keys(SOLIDS).map((k) => `<button type="button" data-bsolid="${k}" class="${(o.solid || "flat") === k ? "on" : ""}"><b>${esc(SOLIDS[k][0])}</b><small>${esc(SOLIDS[k][1])}</small></button>`).join("")}</div>
        ${(o.solid || "flat") !== "flat" ? `<label class="cv-field"><span><b>${o.solid === "puff" ? "How puffy" : o.solid === "tube" ? "How thick" : "How deep"}</b><em>${Math.round((o.depth || 0.2) * 100)} cm</em></span><input type="range" data-bk="o.depth" min="0.02" max="2" step="0.01" value="${o.depth || 0.2}" /></label>` : ""}
        <div class="cv-row"><label>Color of every line <input type="color" data-bk="o.allcolor" value="${esc((o.strokes[0] && o.strokes[0].c) || o.color)}" /></label></div>
        <div class="cv-row"><button type="button" data-ba="drawmore">✏ Draw more on it</button><button type="button" data-ba="undoline">Take away last line</button></div>
        <small class="cv-say">Closed shapes (a circle, a blob, a star) work best for Puff and Push. Spin round works best with half an outline drawn from its left edge.</small>`;
    } else if (o.make === "text") {
      h += wordsHtml(o);
    } else if (o.make === "part") {
      h += seg("Shape", "o.shape", o.shape, PART_KEYS.map((k) => [k, PARTS[k][0]]));
    } else if (o.make === "piece") {
      h += seg("Piece", "o.piece", o.piece, Object.keys(PIECES).map((k) => [k, PIECES[k][0]]));
      h += `<div class="cv-row">${Object.keys(MATERIALS).map((k) => `<button type="button" class="cvb-sw" data-bcolor="${MATERIALS[k][1]}" style="background:${MATERIALS[k][1]}" title="${MATERIALS[k][0]}" aria-label="${MATERIALS[k][0]}"></button>`).join("")}</div>`;
    } else if (o.make === "walls") {
      h += `<label class="cv-field"><span><b>Height</b><em>${(o.h || 2.6).toFixed(1)} m</em></span><input type="range" data-bk="o.h" min="0.3" max="8" step="0.1" value="${o.h || 2.6}" /></label>`;
      if (o.floor) h += `<div class="cv-row"><label>Floor color <input type="color" data-bk="o.floorColor" value="${esc(o.floorColor || "#b58a5a")}" /></label></div>`;
    } else if (o.item) {
      const it = lib() && lib().find(o.item);
      if (it) h += `<small class="cv-say">From the object library: ${esc(it.world)} › ${esc((it.places || []).join(", "))} › ${esc(it.type)}.</small><div class="cv-row"><button type="button" data-ba="similar">Find more like this</button></div>`;
    }
    h += `<div class="cv-row"><label>Color <input type="color" data-bk="o.color" value="${esc(o.color || "#888888")}" /></label><button type="button" data-ba="paintfrom" title="Pick up this color, then click other things to paint them">Copy this color</button></div>`;
    return h;
  }

  function onTabClick(e) {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    const lv = L();
    const o = lv.film.sel && obj(lv.film.sel);
    if (d.btool) {
      setTool(d.btool);
      return renderTab();
    }
    if (d.bpart) return addPart(d.bpart);
    if (d.bpiece) return addPiece(d.bpiece);
    if (d.bprefab) return addPrefab(d.bprefab);
    if (d.bshape) {
      S.pen.shape = d.bshape;
      saveS();
      if (tool !== "draw") setTool("draw");
      return renderTab();
    }
    if (d.bpen) {
      S.pen.color = d.bpen;
      saveS();
      return renderTab();
    }
    if (d.bfont) {
      if (d.pre === "o." && o) {
        V.edit("build-font");
        o.font = d.bfont;
        V.changed(true);
      } else {
        S.words.font = d.bfont;
        saveS();
        renderTab();
      }
      return;
    }
    if (d.bsolid && o) {
      V.edit("build-solid");
      o.solid = d.bsolid;
      o.noShadow = d.bsolid === "flat";
      return V.changed(true);
    }
    if (d.bcolor && o) {
      V.edit("build-color");
      o.color = d.bcolor;
      return V.changed(true);
    }
    switch (d.ba) {
      case "search":
        return openSearch();
      case "dup":
        return o && duplicate(selection());
      case "del":
        return o && removeThing(selection());
      case "group":
        return groupSel();
      case "ungroup":
        return ungroupSel();
      case "snapm": {
        const L1 = [0, 0.1, 0.25, 0.5, 1, 3];
        S.snap = L1[(L1.indexOf(S.snap) + 1) % L1.length];
        saveS();
        V.redraw();
        return renderTab();
      }
      case "snapt": {
        const L2 = [0, 5, 15, 45, 90];
        S.turnSnap = L2[(L2.indexOf(S.turnSnap) + 1) % L2.length];
        saveS();
        V.redraw();
        return renderTab();
      }
      case "newdrawing":
        pendingDrawing = null;
        lv.film.sel = null;
        V.changed(true);
        return flash("The next line starts a new drawing.");
      case "drawmore":
        pendingDrawing = o ? o.id : null;
        setTool("draw");
        return renderTab();
      case "undoline": {
        const t = (pendingDrawing && obj(pendingDrawing)) || (o && o.make === "sketch" ? o : null);
        if (!t || !t.strokes.length) return;
        V.edit("build-unline");
        t.strokes.pop();
        return V.changed(true);
      }
      case "paintfrom":
        if (!o) return;
        paintColor = o.color;
        setTool("paint");
        return flash("Picked up the color. Click other things to paint them.");
      case "similar": {
        const it = o && lib() && lib().find(o.item);
        if (it) openSearch({ world: it.world, place: (it.places || [])[0], type: it.type });
        return;
      }
    }
  }
  function onTabInput(e) {
    const el = e.target;
    const k = el.dataset && el.dataset.bk;
    if (!k) return;
    const v = el.type === "checkbox" ? el.checked : el.type === "range" ? +el.value : el.value;
    const live = e.type === "input" && el.type === "range";
    if (k.startsWith("o.")) {
      const o = obj(L().film.sel);
      if (!o) return;
      const f = k.slice(2);
      if (e.type === "input" && (el.type === "checkbox" || el.tagName === "SELECT")) return;
      V.edit("build-" + f);
      if (f === "allcolor") {
        o.strokes.forEach((s) => (s.c = v));
        o.color = v;
      } else o[f] = v;
      if (f === "text") o.name = String(v).split("\n")[0].slice(0, 24) || "Words";
      if (f === "h" && o.make === "walls") o.look = v / 2;
      V.changed(!(live || el.tagName === "TEXTAREA" || el.type === "color"));
      updateSays(el, v);
      return;
    }
    if (e.type === "input" && (el.type === "checkbox" || el.tagName === "SELECT")) return;
    const [a, b] = k.split(".");
    if (b) S[a][b] = v;
    else S[a] = el.tagName === "SELECT" && !isNaN(+v) && a !== "material" ? +v : v;
    saveS();
    updateSays(el, v);
    if (!live && el.tagName !== "TEXTAREA" && el.type !== "color") renderTab();
  }
  function updateSays(el, v) {
    const em = el.closest(".cv-field") && el.closest(".cv-field").querySelector("em");
    if (!em || el.type !== "range") return;
    const k = el.dataset.bk;
    if (/w$/.test(k) && k.startsWith("pen")) em.textContent = Math.round(v * 1000) / 10 + " cm";
    else if (/smooth/.test(k)) em.textContent = Math.round(v * 100) + "%";
    else if (/wallH|\.h$/.test(k)) em.textContent = (+v).toFixed(1) + " m";
    else if (/depth/.test(k)) em.textContent = v ? Math.round(v * 100) + " cm" : "flat";
    else em.textContent = Math.round(v * 100) + " cm";
  }
  V.addTab({ id: "build", label: "Draw &amp; build", render });

  /* ---------- a little message over the picture ---------- */
  let flashT = 0;
  function flash(msg) {
    const root = document.querySelector(".cv-root.cv-viewer");
    if (!root) return;
    let el = root.querySelector(".cvb-flash");
    if (!el) {
      el = document.createElement("div");
      el.className = "cvb-flash";
      el.setAttribute("role", "status");
      root.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(flashT);
    flashT = setTimeout(() => (el.hidden = true), 2600);
  }

  /* ---------- the Search window: Omnisphere-style filter columns ---------- */
  let SW = null;
  const filt = { world: null, place: null, type: null, q: "", mode: "objects" };
  /* three searches share one window: objects (World > Place > Type), settings (where the scene takes place) and
     characters (people and animals: bring them in, take them out, change them) */
  const MODES = {
    objects: ["Search objects", "Type anything: dog, boat, kitchen, police…", "Each column narrows the one after it, like Omnisphere: pick a world, then a place, then a type, or just type. Click an object to put it in the middle of your picture; double-click to put it in and close."],
    settings: ["Search settings", "Type a place: kitchen, street, forest, harbor…", "Pick where the scene takes place. A setting puts that place's things around the middle of your picture and leaves the middle free for your characters. Indoors gets walls."],
    characters: ["Search characters", "Type anyone: child, police, chef, dog, bird…", "Bring people and animals in, or take them out. Click one in the scene to pick it and change it in Move it; Control+click it in the picture to tell it what to do."],
  };
  const CHAR_TYPES = ["People", "Animals"];
  function openSearch(pre) {
    const L0 = lib();
    const root = document.querySelector(".cv-root.cv-viewer");
    if (!root) return;
    if (!L0) return flash("The object library did not load.");
    if (pre) Object.assign(filt, { world: pre.world || null, place: pre.place || null, type: pre.type || null, q: "", mode: MODES[pre.mode] ? pre.mode : "objects" });
    if (!MODES[filt.mode]) filt.mode = "objects";
    if (!SW) {
      SW = document.createElement("div");
      SW.className = "cvb-search";
      SW.setAttribute("role", "dialog");
      SW.setAttribute("aria-label", "Search objects");
      SW.innerHTML = `<div class="cvb-sbox">
        <header><b class="cvb-stitle">Search objects</b><nav class="cvb-modes">${Object.keys(MODES).map((m) => `<button type="button" data-smode="${m}">${MODES[m][0].replace("Search ", "")}</button>`).join("")}</nav><input type="search" class="cvb-q" placeholder="" aria-label="Search" /><span class="cvb-count"></span><button type="button" data-sclose aria-label="Close">×</button></header>
        <div class="cvb-cols">
          <div class="cvb-col" data-col="world"><h4>World</h4><div></div></div>
          <div class="cvb-col" data-col="place"><h4>Place</h4><div></div></div>
          <div class="cvb-col" data-col="type"><h4>Type</h4><div></div></div>
          <div class="cvb-results"><div class="cvb-inscene" hidden></div><div class="cvb-cards"></div></div>
        </div>
        <footer class="cv-say"><span class="cvb-sfoot"></span> <label class="cvb-repl" hidden><input type="checkbox" checked data-repl /> Replace the setting that is there now</label></footer></div>`;
      root.appendChild(SW);
      SW.addEventListener("click", onSearchClick);
      SW.addEventListener("dblclick", (e) => {
        const c = e.target.closest("[data-item]");
        if (c) closeSearch();
      });
      SW.querySelector(".cvb-q").addEventListener("input", (e) => {
        filt.q = e.target.value;
        fillSearch();
      });
      /* Escape closes it wherever the focus is (a removed button leaves the focus on the page) */
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && SW && !SW.hidden) {
          e.stopPropagation();
          closeSearch();
        }
      }, true);
    }
    SW.hidden = false;
    const M = MODES[filt.mode];
    SW.setAttribute("aria-label", M[0]);
    SW.querySelector(".cvb-stitle").textContent = M[0];
    SW.querySelector(".cvb-q").placeholder = M[1];
    SW.querySelector(".cvb-sfoot").textContent = M[2];
    SW.querySelector(".cvb-repl").hidden = filt.mode !== "settings";
    SW.querySelectorAll("[data-smode]").forEach((b) => b.classList.toggle("on", b.dataset.smode === filt.mode));
    SW.querySelector('[data-col="type"]').hidden = filt.mode === "settings";
    Object.keys(MODES).forEach((m) => SW.classList.toggle("cvb-m-" + m, m === filt.mode));
    SW.querySelector(".cvb-q").value = filt.q;
    fillSearch();
    setTimeout(() => SW.querySelector(".cvb-q").focus(), 0);
  }
  function closeSearch() {
    if (SW) SW.hidden = true;
  }
  function matches(it, f, skip) {
    if (f.mode === "characters" && !CHAR_TYPES.includes(it.type)) return false;
    if (skip !== "world" && f.world && it.world !== f.world) return false;
    if (skip !== "place" && f.place && !(it.places || []).includes(f.place)) return false;
    if (skip !== "type" && f.type && it.type !== f.type) return false;
    if (f.q) {
      const hay = [it.name, it.tags, it.world, (it.places || []).join(" "), it.type].join(" ").toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, "")))) return false;
    }
    return true;
  }
  function fillSearch() {
    const L0 = lib();
    const items = L0.items;
    const col = (name, values) => {
      const box = SW.querySelector(`[data-col="${name}"] > div`);
      const counts = {};
      items.forEach((it) => {
        if (!matches(it, filt, name)) return;
        const vals = name === "place" ? it.places || [] : [it[name]];
        vals.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
      });
      const all = items.filter((it) => matches(it, filt, name)).length;
      box.innerHTML = `<button type="button" data-f="${name}" data-v="" class="${filt[name] ? "" : "on"}">All <small>${all}</small></button>` + values.map((v) => `<button type="button" data-f="${name}" data-v="${esc(v)}" class="${filt[name] === v ? "on" : ""}${counts[v] ? "" : " none"}">${esc(v)} <small>${counts[v] || 0}</small></button>`).join("");
    };
    col("world", L0.WORLDS);
    const places = filt.world ? L0.PLACES[filt.world] || [] : L0.WORLDS.reduce((a, w) => a.concat(L0.PLACES[w] || []), []);
    col("place", places);
    col("type", filt.mode === "characters" ? CHAR_TYPES : L0.TYPES);
    fillInScene();
    if (filt.mode === "settings") return fillSettings(places);
    const found = items.filter((it) => matches(it, filt));
    SW.querySelector(".cvb-count").textContent = found.length + " found";
    const cards = SW.querySelector(".cvb-cards");
    cards.innerHTML = found.length
      ? found.map((it) => `<button type="button" class="cvb-card" data-item="${esc(it.id)}" title="${esc(it.name)}: ${esc(it.world)} › ${esc((it.places || []).join(", "))} › ${esc(it.type)}"><canvas width="132" height="104"></canvas><span>${esc(it.name)}</span></button>`).join("")
      : `<p class="cv-say">Nothing matches. Try fewer words, or press All in a column.</p>`;
    thumbQueue(found, cards);
  }
  let thumbJob = 0;
  function thumbQueue(found, cards) {
    const job = ++thumbJob;
    const els = cards.querySelectorAll("canvas");
    let i = 0;
    const step = () => {
      if (job !== thumbJob || !SW || SW.hidden) return;
      const t0 = performance.now();
      while (i < found.length && performance.now() - t0 < 12) {
        try {
          thumb(els[i], found[i]);
        } catch (e) {}
        i++;
      }
      if (i < found.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const thumbCache = {};
  function thumb(cv, it) {
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (thumbCache[it.id]) return ctx.putImageData(thumbCache[it.id], 0, 0);
    const def = defFromItem(it);
    def.id = "thumb";
    const faces = V.faces(def, { x: 0, y: 0, z: 0, turn: -30, size: 1, sx: 1, sy: 1, sz: 1, show: true, pose: "stand" });
    const W = cv.width;
    const H = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2d3140");
    g.addColorStop(1, "#1c1e26");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    let lo = [Infinity, Infinity, Infinity];
    let hi = [-Infinity, -Infinity, -Infinity];
    faces.forEach((f) => (f.pts || []).forEach((p) => p.forEach((v, k) => ((lo[k] = Math.min(lo[k], v)), (hi[k] = Math.max(hi[k], v))))));
    if (!isFinite(lo[0])) return;
    const c = mul(add(lo, hi), 0.5);
    const rad = Math.max(0.05, len(sub(hi, lo)) / 2);
    const dir = norm([0.35, 0.45, 1]);
    const camPos = add(c, mul(dir, rad * 3.2));
    const fwd = norm(sub(c, camPos));
    const right = norm(cross(fwd, [0, 1, 0]));
    const up = cross(right, fwd);
    const F = (H * 0.5) / Math.tan(20 * DEG);
    const P = (p) => {
      const v = sub(p, camPos);
      const z = dot(v, fwd);
      if (z < 0.01) return null;
      return [W / 2 + (F * dot(v, right)) / z, H / 2 - (F * dot(v, up)) / z, z];
    };
    const Lt = norm([0.4, 0.8, 0.5]);
    const polys = [];
    faces.forEach((f) => {
      if (f.text) return;
      const s = f.pts.map(P);
      if (s.some((q) => !q)) return;
      const depth = s.reduce((a, q) => a + q[2], 0) / s.length;
      if (!f.line) {
        const fc = f.pts.reduce((a, b) => add(a, b), [0, 0, 0]).map((v) => v / f.pts.length);
        let n = f.n;
        if (dot(n, sub(camPos, fc)) <= 0) {
          if (!f.two) return;
          n = mul(n, -1);
        }
        polys.push({ s, depth, f, n });
      } else polys.push({ s, depth, f });
    });
    polys.sort((a, b) => b.depth - a.depth);
    polys.forEach((p) => {
      const col = p.f.color;
      if (p.f.line) {
        ctx.strokeStyle = `rgb(${col.join(",")})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        p.s.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        return ctx.stroke();
      }
      const lam = p.f.glow ? 1.1 : 0.45 + 0.55 * Math.max(0, dot(p.n, Lt));
      ctx.fillStyle = `rgb(${col.map((v) => clamp(Math.round(v * lam), 0, 255)).join(",")})`;
      ctx.globalAlpha = p.f.glass ? 0.35 : 1;
      ctx.beginPath();
      p.s.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(10,10,14,0.45)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });
    try {
      thumbCache[it.id] = ctx.getImageData(0, 0, W, H);
    } catch (e) {}
  }
  /* ---- characters already in the scene: pick to change them, ✕ to take them out ---- */
  function charsInScene() {
    const L0 = lib();
    return L().film.objects.filter((o) => o.kind === "person" || (o.item && L0 && (L0.find(o.item) || {}).type === "Animals"));
  }
  function fillInScene() {
    const box = SW.querySelector(".cvb-inscene");
    if (filt.mode !== "characters") return (box.hidden = true);
    const list = charsInScene();
    box.hidden = false;
    if (!box.querySelector(".cvb-make")) {
      box.innerHTML = `<div class="cvb-make"><label><span>Make someone from words</span><input type="text" data-cwords placeholder="Ida: spiky red hair, overalls, boots" aria-label="Describe a person" /></label><button type="button" data-cmake title="Put a new person in the middle of the picture, dressed the way the words say">Make</button><button type="button" data-clook hidden></button><small class="cvb-read"></small></div><div class="cvb-chips"></div>`;
      box.querySelector("[data-cwords]").addEventListener("input", readLook);
      box.querySelector("[data-cwords]").addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.preventDefault(), makeFromWords(e.target.value);
      });
    }
    const who = L().film.sel && obj(L().film.sel);
    const lb = box.querySelector("[data-clook]");
    lb.hidden = !(who && who.kind === "person");
    if (!lb.hidden) {
      lb.dataset.clook = who.id;
      lb.textContent = "Give " + who.name + " this look";
    }
    box.querySelector(".cvb-chips").innerHTML = `<b>In this scene</b>` + (list.length ? list.map((o) => `<span class="cvb-chip"><button type="button" data-cpick="${esc(o.id)}" title="Pick ${esc(o.name)} and change it in Move it"><i style="background:${esc(o.color)}"></i>${esc(o.name)}</button><button type="button" data-cact="${esc(o.id)}" title="What should ${esc(o.name)} do?">⋯</button><button type="button" data-cout="${esc(o.id)}" title="Take ${esc(o.name)} out of the scene" aria-label="Take ${esc(o.name)} out">✕</button></span>`).join("") : `<span class="cv-say">Nobody yet. Pick someone below.</span>`);
  }

  /* ---- a person made from words (the 3D characters' reader): the words are kept as their look in every panel ---- */
  function readLook() {
    const box = SW && SW.querySelector(".cvb-read");
    if (!box) return;
    const t = SW.querySelector("[data-cwords]").value.trim();
    const LK = window.CurioWear;
    if (!t || !LK) return (box.textContent = "");
    const r = LK.read(lookWords(t));
    if (r) box.textContent = "Reads as: " + (r.said.length ? r.said.join(", ") : "an everyday look");
    else {
      box.textContent = LK.reader() ? "" : "Reading the words…";
      setTimeout(() => SW && !SW.hidden && readLook(), 400);
    }
  }
  /* "Ida: spiky red hair" or "Ida (spiky red hair)": a name first, then the look */
  function nameOf(t) {
    const m = String(t).match(/^\s*([A-Z][a-zA-Z'-]{1,20})\s*[:(,-]/);
    return m ? m[1] : "";
  }
  const lookWords = (t) => String(t).replace(/^\s*[A-Z][a-zA-Z'-]{1,20}\s*[:(,-]\s*/, "").replace(/\)\s*$/, "").trim();
  function makeFromWords(t) {
    t = String(t || "").trim();
    if (!t) return flash("Describe the person first, for example: Ida: spiky red hair, overalls, boots.");
    const n = L().film.objects.filter((o) => o.kind === "person").length + 1;
    const name = nameOf(t) || "Person " + n;
    /* rig: a full 3D character in the whole film (viewer/rig-actors.js; a panel's own place.rig wins) */
    const def = { id: uid("person"), kind: "person", name, color: "#7d8a96", pants: "#3d4a5e", skin: "#eac0a0", hair: "#4a3020", made: "words", rig: true };
    const spot = Object.assign(dropSpot(0), { look: lookWords(t) });
    insert(def, spot);
    const RA = window.CurioRigActors;
    if (RA && RA.load) Promise.resolve(RA.load()).then(() => V.redraw(), () => {});
    fillInScene();
    flash(name + " is in the picture. Pick them and open Windows to change any part, panel by panel.");
    return def;
  }
  function giveLook(id, t) {
    const o = obj(id);
    t = lookWords(String(t || "").trim());
    if (!o || !t) return flash("Describe the look first.");
    V.edit("build-look");
    L().film.panels.forEach((q) => q.place[id] && (q.place[id].look = t));
    V.changed(true);
    flash(o.name + " now looks like that in every panel. Undo takes it back.");
  }

  /* ---- settings: every place in the library, plus the ready-made sets ---- */
  const INDOORS = { Household: 1 };
  const FLOORS = { Kitchen: "#c9b79a", "Living room": "#a8774f", Bedroom: "#8f6f58", Bathroom: "#d9dde0", Garage: "#8c8c8c", Office: "#7d8794" };
  function settingItems(place) {
    const L0 = lib();
    const order = ["Furniture", "Buildings", "Nature", "Vehicles", "Signs & street", "Things", "Animals"];
    const its = L0.items.filter((it) => (it.places || []).includes(place) && it.type !== "People");
    its.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    const out = [];
    const perType = {};
    its.forEach((it) => {
      perType[it.type] = (perType[it.type] || 0) + 1;
      if (out.length < 9 && perType[it.type] <= (it.type === "Animals" ? 1 : 3)) out.push(it);
    });
    return out;
  }
  function fillSettings(places) {
    const L0 = lib();
    const q = filt.q.toLowerCase().split(/\s+/).filter(Boolean);
    const okWords = (hay) => q.every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, "")));
    const cards = [];
    L0.WORLDS.forEach((w) => {
      if (filt.world && w !== filt.world) return;
      (L0.PLACES[w] || []).forEach((pl) => {
        if (filt.place && pl !== filt.place) return;
        const its = settingItems(pl);
        if (!okWords([w, pl, its.map((i) => i.name).join(" ")].join(" ").toLowerCase())) return;
        cards.push(`<button type="button" class="cvb-setcard" data-setting="${esc(pl)}" data-sworld="${esc(w)}"><b>${esc(pl)}</b><small>${esc(w)}${INDOORS[w] ? " · indoors, with walls" : ""}</small><span>${esc(its.map((i) => i.name).join(", "))}</span></button>`);
      });
    });
    PREFABS.forEach((pf) => {
      if (filt.world || filt.place) return;
      if (!okWords([pf.name, pf.say].join(" ").toLowerCase())) return;
      cards.push(`<button type="button" class="cvb-setcard" data-prefab="${esc(pf.id)}"><b>${esc(pf.name)}</b><small>Ready-made set</small><span>${esc(pf.say)}</span></button>`);
    });
    SW.querySelector(".cvb-count").textContent = cards.length + " found";
    SW.querySelector(".cvb-cards").innerHTML = cards.length ? cards.join("") : `<p class="cv-say">Nothing matches. Try fewer words, or press All in a column.</p>`;
  }
  function clearSetting() {
    const ids = L().film.objects.filter((o) => o.setting).map((o) => o.id);
    const lv = L();
    lv.film.objects = lv.film.objects.filter((o) => !o.setting);
    lv.film.panels.forEach((p) => ids.forEach((id) => delete p.place[id]));
    if (ids.includes(lv.film.sel)) lv.film.sel = null;
    multi = [];
  }
  function addSetting(place, world, replace) {
    const L0 = lib();
    if (!L0) return 0;
    const its = settingItems(place);
    const C = L().C;
    const tg = C ? C.target : [0, 0, 0];
    const { r, f } = V.floorDirs();
    V.edit("build-setting");
    if (replace) clearSetting();
    const lv = L();
    const base = Math.atan2(-f[0], -f[2]) / DEG;
    const put = (def, dx, dz, turn, y) => {
      def.setting = place;
      const x = r3(tg[0] + r[0] * dx - f[0] * dz);
      const z = r3(tg[2] + r[2] * dx - f[2] * dz);
      lv.film.objects.push(def);
      lv.film.panels.forEach((p) => (p.place[def.id] = { x, y: y || 0, z, turn: Math.round(base + (turn || 0)), size: 1, show: true, pose: "stand" }));
    };
    if (INDOORS[world]) {
      /* three walls behind and beside the middle, and a floor; the side toward the camera stays open */
      const w = 9, d = 7;
      put({ id: uid("walls"), kind: "made", make: "walls", name: place + " walls", color: "#e9e5dc", h: S.wallH || 2.6, t: 0.15, segs: [[-w / 2, -d / 2, w / 2, -d / 2], [w / 2, -d / 2, w / 2, d / 2], [-w / 2, d / 2, -w / 2, -d / 2]], floor: [-w / 2, -d / 2, w / 2, d / 2], floorColor: FLOORS[place] || "#b59c7c", look: 1.3, ring: 4.5, noShadow: true }, 0, 0, 0);
    }
    /* a U around the middle: the back row first, then the sides */
    const spots = [[-2.8, 2.6, 0], [0, 3, 0], [2.8, 2.6, 0], [-3.6, 0.6, 70], [3.6, 0.6, -70], [-1.4, 3.4, 0], [1.4, 3.4, 0], [-3.4, -1.4, 80], [3.4, -1.4, -80]];
    its.forEach((it, i) => {
      const sp = spots[i];
      if (!sp) return;
      const def = defFromItem(it);
      put(def, sp[0], -sp[1] + (INDOORS[world] ? 0.4 : 0), sp[2], it.fly || 0);
    });
    V.changed(true);
    return its.length;
  }

  function onSearchClick(e) {
    if (e.target === SW || e.target.closest("[data-sclose]")) return closeSearch();
    const md = e.target.closest("[data-smode]");
    if (md) return openSearch({ mode: md.dataset.smode });
    const sc = e.target.closest("[data-setting], [data-prefab]");
    if (sc) {
      const repl = SW.querySelector("[data-repl]").checked;
      if (sc.dataset.prefab) {
        if (repl) {
          V.edit("build-setting");
          clearSetting();
        }
        const before = L().film.objects.length;
        addPrefab(sc.dataset.prefab);
        L().film.objects.slice(before).forEach((o) => (o.setting = sc.dataset.prefab));
        V.changed(true);
      } else addSetting(sc.dataset.setting, sc.dataset.sworld, repl);
      flash("The scene now takes place in: " + sc.querySelector("b").textContent + ". Undo takes it back.");
      return;
    }
    const cp = e.target.closest("[data-cpick]");
    if (cp) {
      selectIds([cp.dataset.cpick]);
      closeSearch();
      V.showTab("move");
      return V.changed(true);
    }
    const ca = e.target.closest("[data-cact]");
    if (ca && window.CurioActions) {
      selectIds([ca.dataset.cact]);
      V.changed(true);
      return window.CurioActions.open(ca.dataset.cact, e.clientX, e.clientY);
    }
    if (e.target.closest("[data-cmake]")) return makeFromWords(SW.querySelector("[data-cwords]").value);
    const cl = e.target.closest("[data-clook]");
    if (cl) return giveLook(cl.dataset.clook, SW.querySelector("[data-cwords]").value);
    const co = e.target.closest("[data-cout]");
    if (co) {
      removeThing(co.dataset.cout);
      return fillInScene();
    }
    const f = e.target.closest("[data-f]");
    if (f) {
      const name = f.dataset.f;
      const v = f.dataset.v || null;
      filt[name] = filt[name] === v ? null : v;
      if (name === "world" && filt.place && filt.world && !(lib().PLACES[filt.world] || []).includes(filt.place)) filt.place = null;
      if (name === "place" && v && !filt.world) {
        const w = lib().WORLDS.find((w) => (lib().PLACES[w] || []).includes(v));
        if (w) filt.world = w;
      }
      return fillSearch();
    }
    const c = e.target.closest("[data-item]");
    if (c) {
      const it = lib().find(c.dataset.item);
      if (!it) return;
      addItem(it);
      if (filt.mode === "characters") fillInScene();
      c.classList.add("added");
      setTimeout(() => c.classList.remove("added"), 700);
      flash(it.name + " is in your picture. Drag it where you want it.");
    }
  }

  /* ---------- looks ---------- */
  const CSS = `
.cv-root.cvb-t-draw .cv-win.is-mine .cv-canvas, .cv-root.cvb-t-wall .cv-win.is-mine .cv-canvas, .cv-root.cvb-t-room .cv-win.is-mine .cv-canvas { cursor: crosshair; }
.cv-root.cvb-t-words .cv-win.is-mine .cv-canvas { cursor: text; }
.cv-root.cvb-t-paint .cv-win.is-mine .cv-canvas { cursor: copy; }
.cv-root.cvb-t-move .cv-win.is-mine .cv-canvas, .cv-root.cvb-t-scale .cv-win.is-mine .cv-canvas, .cv-root.cvb-t-rotate .cv-win.is-mine .cv-canvas { cursor: default; }
.cvb { display: grid; gap: 8px; }
.cvb-tools { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.cv-root .cvb-tools button { display: grid; justify-items: center; gap: 1px; padding: 5px 2px; }
.cvb-tools span { font-size: 16px; line-height: 1.1; }
.cvb-tools small, .cvb-grid small { font-size: 10px; color: var(--c-dim); }
.cvb-tools .on small, .cvb-grid .on small { color: var(--c-accent); }
.cvb-hint { margin: 0; }
.cvb-sec { background: var(--c-raised); border-radius: 8px; padding: 0; }
.cvb-sec > summary { cursor: pointer; padding: 7px 10px; font-weight: 600; font-size: 12px; list-style: none; }
.cvb-sec > summary::-webkit-details-marker { display: none; }
.cvb-sec > summary::before { content: "▸ "; color: var(--c-dim); }
.cvb-sec[open] > summary::before { content: "▾ "; }
.cvb-in { display: grid; gap: 8px; padding: 0 10px 10px; }
.cv-root .cvb-in button { background: var(--c-panel); }
.cv-root .cvb-in button:hover:not(:disabled) { background: var(--c-hover); }
.cvb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); gap: 4px; }
.cv-root .cvb-grid button { display: grid; justify-items: center; gap: 2px; padding: 6px 2px; }
.cvb-grid span { font-size: 18px; line-height: 1; }
.cvb-list { display: grid; gap: 4px; }
.cv-root .cvb-list button { display: grid; text-align: left; gap: 1px; }
.cvb-list small { color: var(--c-dim); font-size: 11px; }
.cv-root .cvb-sw { width: 22px; height: 22px; padding: 0; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25); }
.cvb-fonts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.cv-root .cvb-fonts button { font-size: 14px; padding: 6px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-root .cvb-in input[type=color] { width: 30px; height: 24px; padding: 0; border: 0; background: none; vertical-align: middle; }
.cvb-quick { display: grid; gap: 6px; }
.cvb-trow { display: flex; gap: 2px; align-items: stretch; min-width: 0; }
.cvb-finds { display: grid; gap: 4px; }
.cv-root .cvb-finds button { text-align: left; font-weight: 600; }
.cvb-scroll { display: grid; gap: 4px; align-content: start; overflow: auto; max-height: 34vh; min-height: 0; padding-right: 2px; scrollbar-width: thin; }
.cvb-addlist { max-height: 26vh; gap: 2px; }
.cv-root .cvb-addit { display: flex; align-items: center; justify-content: space-between; gap: 6px; text-align: left; padding: 3px 4px 3px 8px; }
.cvb-addit b { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 5px; background: var(--c-raised, #2a2c34); color: var(--c-accent); font-size: 15px; line-height: 1; flex: none; }
.cvb-addit:hover b { background: var(--c-accent); color: #0b1a1d; }
.cv-root .cvb-plus { color: var(--c-accent); font-weight: 700; font-size: 15px; }
@media (max-width: 1100px) { .cvb-scroll { max-height: 30vh; width: 100%; } .cvb-finds { width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.cvb-modes { display: flex; gap: 2px; }
.cv-root .cvb-modes button { padding: 3px 8px; font-size: 12px; }
.cvb-modes button.on { background: var(--c-accent); color: #0b1a1d; }
.cvb-m-settings .cvb-cols { grid-template-columns: 150px 170px minmax(0, 1fr); }
.cvb-inscene { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--c-line); }
.cvb-inscene > b { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-dim); margin-right: 4px; }
.cvb-make { display: flex; flex-wrap: wrap; gap: 6px; align-items: end; width: 100%; padding-bottom: 8px; margin-bottom: 4px; border-bottom: 1px dashed var(--c-line); }
.cvb-make label { display: flex; flex-direction: column; gap: 3px; flex: 1 1 220px; min-width: 0; }
.cvb-make label span { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-dim); }
.cvb-make input { width: 100%; }
.cvb-read { flex-basis: 100%; color: var(--c-dim); min-height: 1em; }
.cvb-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; width: 100%; }
.cvb-chips > b { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-dim); margin-right: 4px; }
.cvb-chip { display: inline-flex; border: 1px solid var(--c-line); border-radius: 6px; overflow: hidden; }
.cv-root .cvb-chip button { border: 0; border-radius: 0; padding: 3px 7px; }
.cvb-chip i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }
.cvb-m-settings .cvb-cards { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.cv-root .cvb-setcard { display: grid; gap: 3px; text-align: left; padding: 9px 10px; align-content: start; }
.cvb-setcard small { color: var(--c-accent); font-size: 11px; }
.cvb-setcard span { color: var(--c-dim); font-size: 12px; line-height: 1.35; }
.cvb-repl { margin-left: 8px; color: var(--c-text, #e8e8ec); }
.cvb-trow > .cv-thing { flex: 1; min-width: 0; }
.cvb-trow.picked > .cv-thing { box-shadow: inset 0 0 0 1px var(--c-accent); border-style: dashed; }
.cv-root .cvb-ic { padding: 2px 4px; font-size: 11px; background: transparent; opacity: 0.55; flex: none; }
.cv-root .cvb-ic:hover { opacity: 1; }
.cv-root .cvb-ic.off, .cv-root .cvb-ic.on { opacity: 1; }
.cvb-g { margin-left: auto; font-size: 10px; color: var(--c-dim); border: 1px solid var(--c-line); border-radius: 4px; padding: 0 3px; }
.cvb-steps button b { color: var(--c-accent); }
.cvb-flash { position: fixed; left: 50%; bottom: 190px; transform: translateX(-50%); z-index: 90; background: rgba(12,12,14,0.92); color: #fff; padding: 8px 14px; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.4); font-size: 13px; pointer-events: none; max-width: calc(100vw - 32px); }
.cvb-search { position: fixed; inset: 0; z-index: 85; background: rgba(0,0,0,0.55); display: grid; place-items: center; padding: 16px; }
.cvb-sbox { width: min(1100px, 100%); height: min(720px, 100%); background: var(--c-panel); border: 1px solid var(--c-line); border-radius: 12px; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
.cvb-sbox header { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--c-line); }
.cvb-sbox header b { font-size: 14px; white-space: nowrap; }
.cv-root .cvb-q { flex: 1; min-width: 0; font-size: 14px; padding: 7px 10px; border: 1px solid var(--c-line); background: var(--c-raised); border-radius: 8px; }
.cvb-count { color: var(--c-dim); white-space: nowrap; font-size: 12px; }
.cv-root .cvb-sbox header button { width: 30px; height: 30px; padding: 0; font-size: 18px; }
.cvb-cols { display: grid; grid-template-columns: 150px 160px 150px minmax(0, 1fr); min-height: 0; }
.cvb-col { border-right: 1px solid var(--c-line); overflow: auto; padding: 6px; }
.cvb-col h4 { margin: 2px 4px 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-dim); }
.cvb-col > div { display: grid; gap: 2px; }
.cv-root .cvb-col button { background: transparent; text-align: left; display: flex; justify-content: space-between; gap: 6px; padding: 5px 8px; }
.cv-root .cvb-col button.on { background: var(--c-accent); color: var(--c-ink); box-shadow: none; }
.cv-root .cvb-col button.none { opacity: 0.35; }
.cvb-col small { opacity: 0.7; font-variant-numeric: tabular-nums; }
.cvb-results { overflow: auto; padding: 8px; }
.cvb-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(136px, 1fr)); gap: 8px; }
.cv-root .cvb-card { display: grid; gap: 4px; padding: 4px; background: var(--c-raised); border-radius: 8px; text-align: center; }
.cvb-card canvas { width: 100%; height: auto; border-radius: 6px; display: block; }
.cvb-card span { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-root .cvb-card.added { box-shadow: inset 0 0 0 2px var(--c-accent); }
.cvb-sbox footer { padding: 8px 12px; border-top: 1px solid var(--c-line); }
@media (max-width: 760px) {
  .cvb-cols { grid-template-columns: 1fr; grid-template-rows: auto auto auto minmax(0, 1fr); overflow: auto; }
  .cvb-col { border-right: 0; border-bottom: 1px solid var(--c-line); max-height: none; }
  .cvb-col > div { display: flex; flex-wrap: wrap; }
}`;
  if (!document.getElementById("cvb-style")) {
    const st = document.createElement("style");
    st.id = "cvb-style";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  V.setTool(handler);
  /* the tool's class goes on the Viewer once it exists */
  const mark = () => {
    if (document.querySelector(".cv-root.cv-viewer")) setTool(tool);
    else setTimeout(mark, 300);
  };
  mark();

  window.CurioBuild = {
    tool: () => tool,
    setTool,
    settings: () => clone(S),
    set: (patch) => {
      Object.keys(patch || {}).forEach((k) => (typeof patch[k] === "object" && S[k] && typeof S[k] === "object" ? Object.assign(S[k], patch[k]) : (S[k] = patch[k])));
      saveS();
      renderTab();
    },
    addPart,
    addPiece,
    addPrefab,
    addItem: (id) => addItem(lib() && lib().find(id)),
    duplicate,
    remove: removeThing,
    selection: () => selection(),
    select: (ids) => {
      selectIds(ids);
      V.changed(true);
    },
    group: groupSel,
    ungroup: ungroupSel,
    openSearch,
    closeSearch,
    parts: PART_KEYS.slice(),
    partNames: Object.fromEntries(PART_KEYS.map((k) => [k, PARTS[k][0]])),
    pieces: Object.keys(PIECES),
    pieceNames: Object.fromEntries(Object.keys(PIECES).map((k) => [k, PIECES[k][0]])),
    materials: Object.fromEntries(Object.keys(MATERIALS).map((k) => [k, MATERIALS[k].slice()])),
    prefabList: PREFABS.map((p) => ({ id: p.id, name: p.name, say: p.say })),
    addSetting,
    prefabs: PREFABS.map((p) => p.id),
    fonts: Object.keys(FONTS),
    shapes: Object.keys(SHAPES),
    solids: Object.keys(SOLIDS),
    /* for tests: build a drawing straight from flat points */
    drawing: (strokes, opts) => {
      const C = L().C;
      const tg = C ? C.target : [0, 1, 0];
      const n = norm(C ? [C.pos[0] - tg[0], 0, C.pos[2] - tg[2]] : [0, 0, 1]);
      const r = norm(cross([0, 1, 0], n));
      const def = Object.assign({ id: uid("drawing"), kind: "made", make: "sketch", name: "Drawing", color: "#1c1712", strokes: strokes.map((p) => ({ p, c: "#1c1712", w: 0.03 })), plane: { o: [0, tg[1], 0], r, u: [0, 1, 0], n, floor: false }, solid: "flat", depth: 0.2, noShadow: true, look: tg[1], ring: 0.4 }, opts || {});
      return insert(def, { x: r3(tg[0]), y: 0, z: r3(tg[2]), turn: 0, size: 1, show: true });
    },
    words: (text, opts) => {
      const W = Object.assign({}, S.words, opts || {});
      const sp = dropSpot();
      return insert({ id: uid("words"), kind: "made", make: "text", name: String(text).slice(0, 24), text, font: W.font, size: W.size, color: W.color, bold: W.bold, italic: W.italic, outline: W.outline, depth: W.depth, face: W.face, flat: W.flat, look: W.size / 2, ring: 0.3, noShadow: true }, sp);
    },
    _sketchParts: sketchParts,
    _shapePoints: shapePoints,
  };
})();
