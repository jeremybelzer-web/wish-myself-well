/* viewer/viewer.js: the Viewer, the first thing Curiomatic shows.

   A big picture of the film where shapes move, a comic strip of panels with words in balloons that plays one
   panel at a time, and plain controls: move a thing left, right, up, down or on a diagonal, turn it toward the
   camera, change the lens (fisheye, more or less foreshortening), the camera's height, side and lean.

   Everything is drawn on a canvas by the small 3D drawer in this file (no three.js), so it opens at once, works
   offline and inside the one-page link. A panel keeps where every thing stands and where the camera is; while
   the film plays, things glide from where they stand in one panel to where they stand in the next.

   One line in index.html loads it. It opens on start; ?viewer=0 skips that, and automated test runs
   (navigator.webdriver) skip it unless ?viewer=1, so other parts' browser tests keep clicking the app underneath.
   State: localStorage "curiosities-viewer-v1". API: window.CurioViewer (see the end of the file). */
(function () {
  "use strict";
  if (window.CurioViewer) return;

  const KEY = "curiosities-viewer-v1";
  const SENSOR_W = 36;
  const SENSOR_H = 20.25; /* a 16:9 frame on a 36 mm wide sensor */
  const DEG = Math.PI / 180;

  /* ---------- small math ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => {
    const l = len(a);
    return l > 1e-9 ? mul(a, 1 / l) : [0, 0, 0];
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const lerpAngle = (a, b, t) => a + wrap180(b - a) * t;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const hex = (h) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || "");
    const n = m ? parseInt(m[1], 16) : 0x888888;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function rand(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0) / 4294967296;
  }

  /* ---------- shapes: each kind is a list of parts in its own space, facing +z (toward the camera at "in front") ---------- */
  const KINDS = {
    person: { label: "Person", look: 1.6, ring: 0.45, color: "#4a7bd0" },
    box: { label: "Box", look: 0.3, ring: 0.5, color: "#e07a3f" },
    ball: { label: "Ball", look: 0.3, ring: 0.4, color: "#d94f6a" },
    tree: { label: "Tree", look: 1.6, ring: 0.8, color: "#3f8f4f" },
    lamp: { label: "Lamp post", look: 2.4, ring: 0.4, color: "#3a3a40" },
    building: { label: "Building", look: 3, ring: 3.5, color: "#3b3f58" },
    tuktuk: { label: "Tuk-tuk", look: 1.1, ring: 1.6, color: "#e7c235" },
    napkin: { label: "Napkin", look: 0, ring: 0.2, color: "#f7f4ea" },
    phone: { label: "Phone", look: 0, ring: 0.15, color: "#1b1b20" },
    /* anything made with the Build tools (viewer/build.js): drawings, words, parts, objects from the search.
       o.make names its maker (MAKERS), and o.look / o.ring override these. */
    made: { label: "Thing", look: 0.5, ring: 0.5, color: "#8a8f9c" },
  };
  const MAKERS = {};
  const ringOf = (o) => (o.ring != null ? o.ring : KINDS[o.kind].ring || 0.5);
  const lookOf = (o) => (o.look != null ? o.look : KINDS[o.kind].look || 0);
  const ADDABLE = ["person", "box", "ball", "tree", "lamp", "building"];
  /* Hooks for add-ons (viewer/build.js): extra tabs, a tool that takes over the pointer, drawings over the
     picture, extra rows in the "In the scene" list, and keys. */
  const HOOK = { tabs: [], tool: null, over: [], things: [], keys: [], draw: [], change: [], pose: [], parts: [], play: [] };
  /* more poses for people (viewer/build.js adds run, lie down, swim ...): name -> fn(phase) giving limb angles */
  const POSE_FX = {};
  const POSES = [
    ["stand", "Standing"],
    ["walk", "Walking"],
    ["reach", "Reaching out"],
    ["sit", "Sitting"],
    ["sitreach", "Sitting, reaching out"],
    ["wave", "Waving"],
  ];

  /* the limb angles of a pose at a moment (degrees): legs and arms swing forward (negative) or back about the hip
     or shoulder, wave lifts the right arm out to the side, waveL the left; drop lowers the body (metres). The
     block figure and the 3D characters (viewer/rig-actors.js) are both posed from these. */
  function limbsOf(pose, phase) {
    let legA = 0;
    let legB = 0;
    let armA = 0;
    let armB = 0;
    let wave = 0;
    let waveL = 0;
    let drop = 0;
    if (pose === "walk") {
      const s = Math.sin(phase) * 28;
      legA = s;
      legB = -s;
      armA = -s * 0.8;
      armB = s * 0.8;
    }
    if (pose === "reach" || pose === "sitreach") armA = armB = -80;
    if (pose === "wave") wave = 150 + Math.sin(phase * 1.4) * 15;
    if (POSE_FX[pose]) {
      const r = POSE_FX[pose].fn(phase || 0) || {};
      legA = r.legA || 0;
      legB = r.legB || 0;
      armA = r.armA || 0;
      armB = r.armB || 0;
      wave = r.wave || 0;
      waveL = r.waveL || 0;
      drop = r.drop || 0;
    }
    return { legA, legB, armA, armB, wave, waveL, drop, sit: /^sit/.test(pose) };
  }
  function personParts(d, pose, phase) {
    const skin = d.skin || "#c98d63";
    const shirt = d.color || "#4a7bd0";
    const pants = d.pants || "#2d2f3a";
    const hair = d.hair || "#1d1712";
    let { legA, legB, armA, armB, wave, waveL, drop } = limbsOf(pose, phase);
    const P = [];
    if (/^sit/.test(pose)) {
      drop = -0.4;
      [-0.1, 0.1].forEach((x) => {
        P.push({ box: [0.15, 0.16, 0.46], at: [x, 0.85, 0.2], color: pants });
        P.push({ box: [0.14, 0.47, 0.15], at: [x, 0.62, 0.4], color: pants });
      });
    } else {
      P.push({ box: [0.14, 0.85, 0.16], at: [-0.1, 0.425, 0], pivot: [-0.1, 0.85, 0], rx: legA, color: pants });
      P.push({ box: [0.14, 0.85, 0.16], at: [0.1, 0.425, 0], pivot: [0.1, 0.85, 0], rx: legB, color: pants });
    }
    P.push({ box: [0.44, 0.6, 0.26], at: [0, 1.15, 0], color: shirt });
    P.push({ box: [0.11, 0.56, 0.12], at: [-0.285, 1.16, 0], pivot: [-0.285, 1.42, 0], rx: armA, rz: -waveL, color: shirt });
    P.push({ box: [0.1, 0.1, 0.1], at: [-0.285, 0.84, 0], pivot: [-0.285, 1.42, 0], rx: armA, rz: -waveL, color: skin });
    P.push({ box: [0.11, 0.56, 0.12], at: [0.285, 1.16, 0], pivot: [0.285, 1.42, 0], rx: armB, rz: wave, color: shirt });
    P.push({ box: [0.1, 0.1, 0.1], at: [0.285, 0.84, 0], pivot: [0.285, 1.42, 0], rx: armB, rz: wave, color: skin });
    P.push({ box: [0.27, 0.3, 0.27], at: [0, 1.62, 0], color: skin });
    P.push({ box: [0.29, 0.08, 0.29], at: [0, 1.79, 0], color: hair });
    P.push({ box: [0.29, 0.22, 0.06], at: [0, 1.66, -0.13], color: hair });
    P.push({ box: [0.05, 0.05, 0.02], at: [-0.065, 1.66, 0.14], color: "#15110e" });
    P.push({ box: [0.05, 0.05, 0.02], at: [0.065, 1.66, 0.14], color: "#15110e" });
    P.push({ box: [0.05, 0.07, 0.07], at: [0, 1.6, 0.16], color: d.skin ? d.skin : "#b77a52" });
    P.push({ box: [0.1, 0.02, 0.02], at: [0, 1.54, 0.14], color: "#7a3b30" });
    if (drop) P.forEach((p) => (p.at = [p.at[0], p.at[1] + drop, p.at[2]], p.pivot && (p.pivot = [p.pivot[0], p.pivot[1] + drop, p.pivot[2]])));
    return P;
  }
  function tuktukParts(d) {
    const body = d.color || "#e7c235";
    const dark = "#22252b";
    return [
      { box: [1.3, 0.55, 2.3], at: [0, 0.6, -0.1], color: body },
      { box: [0.9, 0.9, 0.35], at: [0, 0.8, 1.2], color: body },
      { box: [1.0, 0.55, 0.04], at: [0, 1.5, 1.08], color: "#9fc6d9", glass: true },
      { box: [1.42, 0.1, 2.15], at: [0, 1.9, -0.15], color: "#2f5d3a" },
      { box: [0.06, 1.0, 0.06], at: [-0.62, 1.4, 0.85], color: dark },
      { box: [0.06, 1.0, 0.06], at: [0.62, 1.4, 0.85], color: dark },
      { box: [0.06, 1.0, 0.06], at: [-0.62, 1.4, -1.15], color: dark },
      { box: [0.06, 1.0, 0.06], at: [0.62, 1.4, -1.15], color: dark },
      { box: [1.3, 1.0, 0.06], at: [0, 1.35, -1.22], color: "#c9a52a" },
      { box: [0.5, 0.12, 0.4], at: [0, 0.93, 0.45], color: dark },
      { box: [1.1, 0.12, 0.5], at: [0, 0.93, -0.65], color: dark },
      { box: [1.1, 0.45, 0.1], at: [0, 1.2, -0.95], color: dark },
      { box: [0.14, 0.44, 0.44], at: [0, 0.22, 1.15], color: "#111" },
      { box: [0.14, 0.44, 0.44], at: [-0.62, 0.22, -0.75], color: "#111" },
      { box: [0.14, 0.44, 0.44], at: [0.62, 0.22, -0.75], color: "#111" },
      { box: [0.2, 0.15, 0.06], at: [0, 1.1, 1.39], color: "#ffe9a0", glow: true },
      { box: [0.12, 0.08, 0.03], at: [0.32, 1.85, 1.0], color: "#cfd8dc" },
    ];
  }
  function buildingParts(d) {
    const w = d.w || 5;
    const h = d.h || 8;
    const dd = d.d || 4;
    const P = [{ box: [w, h, dd], at: [0, h / 2, 0], color: d.color || "#3b3f58" }];
    const r = rand(hash(d.id || "b"));
    const signs = ["#ff4fa3", "#4fe3ff", "#ffd24f", "#ff8a3d", "#9b7bff"];
    for (let y = 1.4; y < h - 0.6; y += 1.3) {
      for (let x = -w / 2 + 0.8; x < w / 2 - 0.4; x += 1.1) {
        const lit = r() < 0.55;
        P.push({ quad: [0.6, 0.7], at: [x, y, dd / 2 + 0.01], color: lit ? "#ffd98a" : "#1f2233", glow: lit });
      }
    }
    /* a glowing price sign, like the city in Episode 1 */
    P.push({ quad: [Math.min(w - 0.6, 2.6), 0.7], at: [0, Math.min(3.2, h - 0.8), dd / 2 + 0.03], color: signs[hash(d.id || "s") % signs.length], glow: true });
    return P;
  }
  function kindParts(d, place, phase) {
    switch (d.kind) {
      case "person":
        return personParts(d, place.pose || "stand", phase);
      case "tuktuk":
        return tuktukParts(d);
      case "building":
        return buildingParts(d);
      case "box":
        return [{ box: [0.6, 0.6, 0.6], at: [0, 0.3, 0], color: d.color }, { box: [0.62, 0.08, 0.2], at: [0, 0.45, 0.22], color: "#00000033" }];
      case "ball":
        return [{ ball: 0.3, at: [0, 0.3, 0], color: d.color }];
      case "tree":
        return [{ box: [0.22, 1.1, 0.22], at: [0, 0.55, 0], color: "#6b4a2f" }, { cone: [0.85, 2.2], at: [0, 1.0, 0], color: d.color }];
      case "lamp":
        return [{ box: [0.1, 3, 0.1], at: [0, 1.5, 0], color: d.color }, { box: [0.5, 0.08, 0.12], at: [0, 3.0, 0.2], color: d.color }, { box: [0.3, 0.12, 0.25], at: [0, 2.92, 0.38], color: "#fff1b8", glow: true }];
      case "napkin":
        return [{ box: [0.24, 0.24, 0.012], at: [0, 0, 0], color: d.color || "#f7f4ea" }];
      case "phone":
        return [{ box: [0.08, 0.15, 0.012], at: [0, 0, 0], color: "#1b1b20" }, { quad: [0.068, 0.13], at: [0, 0, 0.0075], color: d.screen || "#ff3b3b", glow: true }];
      case "made":
        if (MAKERS[d.make]) {
          try {
            return MAKERS[d.make](d, place, phase) || [];
          } catch (e) {
            return [{ box: [0.5, 0.5, 0.5], at: [0, 0.25, 0], color: d.color }];
          }
        }
        return [{ box: [0.5, 0.5, 0.5], at: [0, 0.25, 0], color: d.color }];
      default:
        return [{ box: [0.5, 0.5, 0.5], at: [0, 0.25, 0], color: d.color }];
    }
  }

  /* ---------- faces ---------- */
  function boxCorners(c, s) {
    const [x, y, z] = c;
    const hx = s[0] / 2;
    const hy = s[1] / 2;
    const hz = s[2] / 2;
    const P = (i, j, k) => [x + i * hx, y + j * hy, z + k * hz];
    return [
      [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)],
      [P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1)],
      [P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1)],
      [P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1)],
      [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)],
      [P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)],
    ];
  }
  function partFaces(p) {
    const c = p.at;
    if (p.box) return { faces: boxCorners(c, p.box), center: c };
    if (p.quad) {
      const [w, h] = p.quad;
      return { faces: [[[c[0] - w / 2, c[1] - h / 2, c[2]], [c[0] + w / 2, c[1] - h / 2, c[2]], [c[0] + w / 2, c[1] + h / 2, c[2]], [c[0] - w / 2, c[1] + h / 2, c[2]]]], center: [c[0], c[1], c[2] - 1] };
    }
    if (p.ball) {
      const r = p.ball;
      const F = [];
      const N = 10;
      const M = 6;
      const pt = (i, j) => {
        const th = (j / M) * Math.PI;
        const ph = (i / N) * Math.PI * 2;
        return [c[0] + r * Math.sin(th) * Math.cos(ph), c[1] + r * Math.cos(th), c[2] + r * Math.sin(th) * Math.sin(ph)];
      };
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) F.push([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]);
      return { faces: F, center: c };
    }
    if (p.cyl) {
      const [r, h] = p.cyl;
      const N = p.n || 12;
      const F = [];
      const ring = (y) => Array.from({ length: N }, (_, i) => [c[0] + r * Math.cos((i / N) * Math.PI * 2), y, c[2] + r * Math.sin((i / N) * Math.PI * 2)]);
      const lo = ring(c[1]);
      const hi = ring(c[1] + h);
      for (let i = 0; i < N; i++) F.push([lo[i], lo[(i + 1) % N], hi[(i + 1) % N], hi[i]]);
      F.push(hi.slice(), lo.slice().reverse());
      return { faces: F, center: [c[0], c[1] + h / 2, c[2]] };
    }
    if (p.wedge) {
      const [w, h, d] = p.wedge;
      const x0 = c[0] - w / 2, x1 = c[0] + w / 2, y0 = c[1] - h / 2, y1 = c[1] + h / 2, z0 = c[2] - d / 2, z1 = c[2] + d / 2;
      return {
        faces: [
          [[x0, y0, z1], [x1, y0, z1], [x1, y1, z0], [x0, y1, z0]],
          [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]],
          [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
          [[x0, y0, z0], [x0, y0, z1], [x0, y1, z0]],
          [[x1, y0, z0], [x1, y1, z0], [x1, y0, z1]],
        ],
        center: [c[0], c[1] - h / 6, c[2] - d / 6],
      };
    }
    if (p.flat) {
      const [w, d] = p.flat;
      return { faces: [[[c[0] - w / 2, c[1], c[2] + d / 2], [c[0] + w / 2, c[1], c[2] + d / 2], [c[0] + w / 2, c[1], c[2] - d / 2], [c[0] - w / 2, c[1], c[2] - d / 2]]], center: [c[0], c[1] - 1, c[2]] };
    }
    /* poly: faces given point by point (two: true shows them from both sides) */
    if (p.poly) return { faces: p.poly, center: p.center || c || [0, 0, 0] };
    if (p.cone) {
      const [r, h] = p.cone;
      const F = [];
      const N = 9;
      const top = [c[0], c[1] + h, c[2]];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const b = ((i + 1) / N) * Math.PI * 2;
        const pa = [c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)];
        const pb = [c[0] + r * Math.cos(b), c[1], c[2] + r * Math.sin(b)];
        F.push([pa, pb, top]);
      }
      return { faces: F, center: [c[0], c[1] + h / 3, c[2]] };
    }
    return { faces: [], center: c };
  }
  function rotX(p, a) {
    const s = Math.sin(a);
    const co = Math.cos(a);
    return [p[0], p[1] * co - p[2] * s, p[1] * s + p[2] * co];
  }
  function rotZ(p, a) {
    const s = Math.sin(a);
    const co = Math.cos(a);
    return [p[0] * co - p[1] * s, p[0] * s + p[1] * co, p[2]];
  }
  function newell(pts) {
    let n = [0, 0, 0];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      n = add(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]);
    }
    return norm(n);
  }

  /* World faces of one thing at one moment. */
  function thingFaces(def, place, phase) {
    let parts = kindParts(def, place, phase);
    /* HOOK.parts: change a thing's parts for this moment (fire, breaking apart, a color for this panel) */
    HOOK.parts.forEach((fn) => {
      try {
        parts = fn(parts, def, place, phase) || parts;
      } catch (e) {}
    });
    const s = place.size || 1;
    /* sx, sy, sz stretch one way only (the Scale tool), on top of size */
    const S = [s * (place.sx || 1), s * (place.sy || 1), s * (place.sz || 1)];
    const t = (place.turn || 0) * DEG;
    const st = Math.sin(t);
    const ct = Math.cos(t);
    const pos = [place.x || 0, place.y || 0, place.z || 0];
    /* tilt (forward or back) and roll (side to side) turn the whole thing about its feet, or about lift height */
    const tl = (place.tilt || 0) * DEG;
    const rl = (place.roll || 0) * DEG;
    const ph = place.pivotY || 0;
    const toWorld = (p) => {
      let q = [p[0] * S[0], p[1] * S[1], p[2] * S[2]];
      if (tl || rl) {
        q = [q[0], q[1] - ph, q[2]];
        if (rl) q = rotZ(q, rl);
        if (tl) q = rotX(q, tl);
        q = [q[0], q[1] + ph, q[2]];
      }
      return [pos[0] + (q[0] * ct + q[2] * st), pos[1] + q[1], pos[2] + (-q[0] * st + q[2] * ct)];
    };
    const out = [];
    parts.forEach((p, pi) => {
      const piv = p.pivot || p.at;
      const turned = (p.rx || p.ry || p.rz) && piv;
      const local = (q) => {
        if (!turned) return q;
        let v = sub(q, piv);
        if (p.rz) v = rotZ(v, p.rz * DEG);
        if (p.rx) v = rotX(v, p.rx * DEG);
        if (p.ry) {
          const a = p.ry * DEG;
          v = [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
        }
        return add(v, piv);
      };
      const rgba = /^#[0-9a-f]{8}$/i.test(p.color || "") ? null : hex(p.color);
      if (!rgba) return;
      const tag = p.tag != null ? p.tag : pi;
      if (p.line) {
        /* a pencil line: drawn as a stroke of width w metres, seen from every side */
        const pts = p.line.map((q) => toWorld(local(q)));
        if (pts.length) out.push({ pts, line: true, w: (p.w || 0.02) * Math.cbrt(S[0] * S[1] * S[2]), color: rgba, obj: def.id, tag, dash: p.dash });
        return;
      }
      if (p.text != null) {
        /* words in the world: a sign of height h metres, written along +x, facing +z */
        const h = p.size || 0.3;
        const a = p.at || [0, 0, 0];
        out.push({ text: String(p.text), face: !!p.face, font: p.font || "system-ui, sans-serif", weight: p.weight || "700", italic: !!p.italic, align: p.align || "center", h, color: rgba, glow: !!p.glow, obj: def.id, tag, outline: p.outline,
          o: toWorld(local(a)), ax: sub(toWorld(local(add(a, [1, 0, 0]))), toWorld(local(a))), ay: sub(toWorld(local(add(a, [0, 1, 0]))), toWorld(local(a))), n: norm(sub(toWorld(local(add(a, [0, 0, 1]))), toWorld(local(a)))), pts: [toWorld(local(a))] });
        return;
      }
      const pf = partFaces(p);
      const cw = toWorld(local(pf.center));
      pf.faces.forEach((f) => {
        const pts = f.map((q) => toWorld(local(q)));
        let n = newell(pts);
        const fc = pts.reduce((a, b) => add(a, b), [0, 0, 0]).map((v) => v / pts.length);
        if ((!p.poly || p.center) && dot(n, sub(fc, cw)) < 0) n = mul(n, -1);
        out.push({ pts, n, color: rgba, glow: !!p.glow, glass: !!p.glass, two: !!p.two, soft: !!p.soft, obj: def.id, tag });
      });
    });
    return out;
  }

  /* ---------- the camera and the lens ---------- */
  /* shot = how many metres of height the frame holds at the subject; lens = focal length in mm (35 mm terms);
     fish = 0 (straight lines stay straight) to 1 (a full fisheye); height = degrees above the subject (negative is
     below, looking up); around = degrees around the subject (0 is in front, from +z); tilt = the frame's lean. */
  function makeCamera(cam, target, W, H) {
    const f = clamp((cam.pose && cam.pose.lens) || cam.lens || 35, 4, 600);
    let d = Math.max(0.12, ((cam.shot || 2) * f) / SENSOR_H);
    const pitch = clamp(cam.height || 0, -89, 89.5) * DEG;
    const yaw = (cam.around || 0) * DEG;
    let pos = [target[0] + d * Math.sin(yaw) * Math.cos(pitch), target[1] + d * Math.sin(pitch), target[2] + d * Math.cos(yaw) * Math.cos(pitch)];
    /* a flight path (viewer/flight.js) puts the camera at a spot and points it at a spot */
    if (cam.pose && cam.pose.pos) {
      pos = cam.pose.pos.slice();
      d = Math.max(0.05, len(sub(target, pos)));
      if (d < 0.06) target = add(pos, [0, 0, -1]);
    }
    const fwd = norm(sub(target, pos));
    let right = norm(cross(fwd, [0, 1, 0]));
    if (len(right) < 0.5) right = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const up = cross(right, fwd);
    const r = ((cam.tilt || 0) + ((cam.pose && cam.pose.roll) || 0)) * DEG;
    const R = add(mul(right, Math.cos(r)), mul(up, Math.sin(r)));
    const U = add(mul(up, Math.cos(r)), mul(right, -Math.sin(r)));
    /* Fisheye: 0 is a normal straight-line lens. Going up, the picture bends more and more like a real fisheye:
       halfway is an "equidistant" fisheye, all the way is an "equisolid" one (like an 8mm circular fisheye),
       which squeezes the edges hard and sees all round. The lens also widens as it bends, so more of the
       background and foreground comes in at the edges. */
    const fish = clamp(cam.fish || 0, 0, 1);
    const a = 1 - 1.5 * fish;
    const thMax = a > 1e-3 ? Math.min((Math.PI / 2 / a) * 0.985, Math.PI * 0.96) : Math.PI * 0.96;
    return { pos, fwd, right: R, up: U, a, F: (f / SENSOR_W) * W * (1 - 0.4 * fish), W, H, thMax, target, d, lens: f };
  }
  /* how far from the middle of the picture a ray at angle th lands (per unit of F), and back again */
  function lensR(C, th) {
    const a = C.a;
    if (a > 1e-3) return Math.tan(th * a) / a;
    if (a > -1e-3) return th;
    return Math.sin(th * -a) / -a;
  }
  function lensTh(C, r) {
    const a = C.a;
    if (a > 1e-3) return Math.atan(r * a) / a;
    if (a > -1e-3) return r;
    return Math.asin(Math.min(1, r * -a)) / -a;
  }
  function project(C, p) {
    const v = sub(p, C.pos);
    const x = dot(v, C.right);
    const y = dot(v, C.up);
    const z = dot(v, C.fwd);
    const rho = Math.hypot(x, y);
    const th = Math.atan2(rho, z);
    if (C.a > 0.999 ? z < 0.03 : th > C.thMax) return null;
    const k = rho < 1e-9 ? 0 : (C.F * lensR(C, th)) / rho;
    return [C.W / 2 + k * x, C.H / 2 - k * y, Math.hypot(x, y, z)];
  }

  /* ---------- the film ---------- */
  function cam(o) {
    return Object.assign({ shot: 2.2, lens: 35, fish: 0, height: 8, around: 0, tilt: 0, aim: null, move: "cut", pan: [0, 0, 0] }, o);
  }
  function sampleFilm() {
    /* Episode 1, scene 1 ("The napkin") from Wish Myself Well, as 13 panels. */
    const objects = [
      { id: "tuktuk", kind: "tuktuk", name: "Tuk-tuk", color: "#e7c235" },
      { id: "biju", kind: "person", name: "Biju", color: "#e2803a", skin: "#a8714d", hair: "#121010", pants: "#3b3a46" },
      { id: "passenger", kind: "person", name: "Passenger", color: "#5d7fa8", skin: "#d7a17c", hair: "#5a3a22", pants: "#2a2d36" },
      { id: "phone", kind: "phone", name: "Phone", color: "#1b1b20" },
      { id: "napkin", kind: "napkin", name: "Napkin", color: "#f7f4ea" },
      { id: "b1", kind: "building", name: "Building 1", color: "#353a57", w: 6, h: 9, d: 4 },
      { id: "b2", kind: "building", name: "Building 2", color: "#4a3550", w: 5, h: 13, d: 4 },
      { id: "b3", kind: "building", name: "Building 3", color: "#2f4a52", w: 6, h: 7, d: 4 },
      { id: "b4", kind: "building", name: "Building 4", color: "#4b3d3a", w: 5, h: 11, d: 4 },
      { id: "lamp1", kind: "lamp", name: "Street lamp", color: "#3a3a40" },
    ];
    const base = {
      tuktuk: { x: 0, y: 0, z: 0, turn: 90, size: 1, show: true },
      biju: { x: 0.45, y: 0.55, z: 0, turn: 90, size: 1, show: true, pose: "sit" },
      passenger: { x: -0.6, y: 0.55, z: 0, turn: 90, size: 1, show: true, pose: "sit" },
      phone: { x: -0.2, y: 1.0, z: 0.12, turn: 20, size: 1, show: true },
      napkin: { x: 0.7, y: 1.2, z: 0.5, turn: 0, size: 1, show: false },
      b1: { x: -9, y: 0, z: -7, turn: 0, size: 1, show: true },
      b2: { x: -2.5, y: 0, z: -8, turn: 0, size: 1, show: true },
      b3: { x: 3.8, y: 0, z: -7, turn: 0, size: 1, show: true },
      b4: { x: 9.5, y: 0, z: -7.5, turn: -10, size: 1, show: true },
      lamp1: { x: 2.6, y: 0, z: 1.6, turn: 180, size: 1, show: true },
    };
    const P = [];
    let n = 0;
    function panel(sec, c, change, extra) {
      const prev = P.length ? P[P.length - 1].place : base;
      const place = clone(prev);
      Object.keys(change || {}).forEach((k) => Object.assign(place[k], change[k]));
      P.push(Object.assign({ id: "p" + ++n, sec, cam: cam(c), place, words: [], caption: "", note: "", rain: "fall" }, extra || {}));
    }
    panel(2.5, { shot: 9, lens: 24, height: 22, around: 15, aim: "tuktuk", move: "glide" }, { passenger: { x: -2.2, z: 3.2, y: 0, turn: -150, pose: "walk" }, phone: { show: false } }, { v: { emotion: "melancholy", temperature: "cold", tensionCurve: 1 }, note: "WIDE, high. A rain city at dusk.", caption: "A rain city at dusk. Prices glow on every wall like shop signs." });
    panel(2, { shot: 4.2, lens: 28, height: 14, around: 30, aim: "tuktuk" }, { passenger: { x: -1.6, z: 2.4, turn: -160 } }, { v: { tensionCurve: 1 }, note: "WIDE, high, push in. One small tuk-tuk at the curb, its little lamp on.", caption: "One small tuk-tuk at the curb, its little lamp on." });
    panel(2, { shot: 1.1, lens: 40, height: 4, around: 78, aim: "biju" }, { passenger: { x: -1.3, z: 1.4, turn: 170 } }, { v: { emotion: "joyful", emotionIntensity: 1, tensionCurve: 1 }, note: "MEDIUM. Biju, in the driver's seat, eats a slice of mango. Calm.", caption: "Biju eats a slice of mango. Calm." });
    panel(2, { shot: 2.6, lens: 32, height: 8, around: 15, aim: "tuktuk", move: "cut" }, { passenger: { x: -0.6, z: 0, y: 0.55, turn: 90, pose: "sit" }, phone: { show: true } }, { v: { plotProgress: "step forward", tensionCurve: 2 }, note: "MEDIUM. A passenger climbs into the back, soaked, staring at a phone." });
    panel(2, { shot: 0.32, lens: 50, height: 12, around: 10, aim: "phone" }, {}, { v: { reveal: "with", plotSecret: "slipping", tensionCurve: 3 }, note: "TINY. The phone: a number counting down fast, in red.", caption: "A number counting down fast, in red." });
    panel(2, { shot: 0.5, lens: 35, height: 2, around: 80, aim: "passenger", move: "glide" }, {}, { v: { emotion: "anxious", emotionIntensity: 4, faceIntensity: 4, tensionCurve: 4, volume: 4 }, note: "CLOSE. The passenger's face, lit red.", words: [{ who: "passenger", text: "No. No no." }] });
    panel(2, { shot: 0.42, lens: 22, height: 0, around: 70, aim: "passenger" }, {}, { v: { plotProgress: "big setback", emotion: "melancholy", emoTurn: "flips", emotionIntensity: 5, tensionCurve: 5, volume: 3 }, note: "CLOSE, push in.", words: [{ who: "passenger", text: "It's gone. I had a year in there." }] });
    panel(2, { shot: 2.3, lens: 30, height: 4, around: 8, aim: "tuktuk" }, {}, { v: { eyeline: "glances", tensionCurve: 5, volume: 4 }, note: "MEDIUM. Biju looks in the little mirror.", words: [{ who: "passenger", text: "Say something." }] });
    panel(2, { shot: 0.5, lens: 50, height: 6, around: 5, aim: "napkin" }, { napkin: { show: true, turn: 0 }, phone: { show: false } }, { v: { emotion: "dreamlike", silence: "long", tensionCurve: 5, volume: 1 }, note: "TINY. He takes one napkin. The raindrops start to stop in the air.", caption: "He takes one napkin. The rain stops in the air.", rain: "frozen" });
    panel(2.5, { shot: 7, lens: 20, height: 18, around: -40, aim: "tuktuk", move: "glide" }, {}, { v: { comicBeat: "setup planted", emotionIntensity: 3 }, note: "WIDE, circle. The camera goes all the way around the tuk-tuk.", caption: "Every raindrop hangs, frozen.", rain: "frozen" });
    panel(1.5, { shot: 7, lens: 20, height: 18, around: 140, aim: "tuktuk" }, {}, { note: "WIDE, circle (the camera arrives on the far side).", rain: "frozen" });
    panel(2.5, { shot: 1.3, lens: 16, fish: 0.5, height: -10, around: -30, aim: "biju" }, { biju: { turn: -90, pose: "sitreach" }, napkin: { x: 0.0, y: 1.12, z: 0.3, turn: -30 } }, { v: { comicBeat: "building", emotion: "absurd", emotionIntensity: 4, silence: "none", volume: 2 }, note: "CLOSE, low. Biju turns and holds the napkin out with both hands, like the last wire on a bomb.", words: [{ who: "biju", text: "Wipe your face." }], rain: "frozen" });
    panel(2.5, { shot: 0.5, lens: 50, height: 8, around: -20, aim: "napkin" }, { napkin: { x: -0.25, z: 0.3, turn: -20 } }, { v: { comicBeat: "payoff lands", emotion: "loving", plotProgress: "step forward", tensionCurve: 1, emotionIntensity: 2 }, note: "TINY, payoff. The fingers take it. The rain falls again.", caption: "The fingers take it. The rain falls again.", rain: "fall" });
    return { v: 1, title: "The napkin (Episode 1, scene 1)", look: "dusk", objects, panels: P, sel: "biju" };
  }

  /* Inspiration films: short built-in examples to study and borrow from, shown in extra windows. */
  function makeFilm(id, title, look, objects, base, steps) {
    const P = [];
    steps.forEach(([sec, c, change, extra], k) => {
      const prev = P.length ? P[P.length - 1].place : base;
      const place = clone(prev);
      Object.keys(change || {}).forEach((o) => Object.assign(place[o], change[o]));
      P.push(Object.assign({ id: id + "-" + (k + 1), sec, cam: cam(c), place, words: [], caption: "", note: "", rain: "none" }, extra || {}));
    });
    return { v: 1, id, title, look, objects, panels: P, sel: null, inspiration: true };
  }
  function chaseFilm() {
    const objects = [
      { id: "runner", kind: "person", name: "Runner", color: "#d94f4f", skin: "#c58b62", hair: "#2a1a10" },
      { id: "chaser", kind: "person", name: "Chaser", color: "#2b2d3a", skin: "#e0b08a", hair: "#111", pants: "#15161c" },
      { id: "crate", kind: "box", name: "Crate", color: "#9b6b3d" },
      { id: "c1", kind: "building", name: "Building", color: "#2c3047", w: 6, h: 10, d: 4 },
      { id: "c2", kind: "building", name: "Building", color: "#3a2c40", w: 5, h: 7, d: 4 },
      { id: "c3", kind: "building", name: "Building", color: "#26383d", w: 7, h: 12, d: 4 },
      { id: "cl1", kind: "lamp", name: "Lamp", color: "#3a3a40" },
      { id: "cl2", kind: "lamp", name: "Lamp", color: "#3a3a40" },
    ];
    const base = {
      runner: { x: -6, y: 0, z: 2, turn: 90, size: 1, show: true, pose: "walk" },
      chaser: { x: -9.5, y: 0, z: 2.4, turn: 90, size: 1, show: true, pose: "walk" },
      crate: { x: 4.5, y: 0, z: 0.6, turn: 10, size: 1, show: true },
      c1: { x: -8, y: 0, z: -6, turn: 0, size: 1, show: true },
      c2: { x: -1, y: 0, z: -6.5, turn: 0, size: 1, show: true },
      c3: { x: 7, y: 0, z: -6, turn: 0, size: 1, show: true },
      cl1: { x: -3, y: 0, z: -2.5, turn: 0, size: 1, show: true },
      cl2: { x: 5, y: 0, z: -2.5, turn: 0, size: 1, show: true },
    };
    return makeFilm("insp-chase", "The chase", "night", objects, base, [
      [2, { shot: 7, lens: 24, height: 20, around: 25, aim: "runner", move: "glide" }, {}, { caption: "Someone runs.", note: "WIDE, high. The runner comes round the corner." }],
      [2, { shot: 2.4, lens: 12, fish: 0.6, height: -22, around: 75, aim: "runner", move: "glide" }, { runner: { x: -2, z: 1.5 }, chaser: { x: -6, z: 2 } }, { note: "Worm's eye, fisheye: the runner looms over the lens." }],
      [1.5, { shot: 0.6, lens: 35, height: 2, around: 70, tilt: 18, aim: "chaser" }, { runner: { x: 1.5, z: 1 }, chaser: { x: -2.5, z: 1.6 } }, { words: [{ who: "chaser", text: "Stop!" }], note: "CLOSE, Dutch angle on the chaser." }],
      [2, { shot: 2.2, lens: 18, height: -10, around: 100, aim: "runner" }, { runner: { x: 4.3, y: 0.6, z: 0.6 }, chaser: { x: 0.5, z: 1.2 } }, { note: "LOW. The runner jumps onto the crate." }],
      [2, { shot: 9, lens: 24, height: 86, around: 0, aim: "runner" }, { runner: { x: 8, y: 0, z: -0.5 }, chaser: { x: 4, z: 0.4 } }, { note: "Bird's eye: two dots on the street." }],
      [2, { shot: 0.5, lens: 120, height: 3, around: 60, aim: "runner" }, { runner: { turn: 200, pose: "stand" }, chaser: { pose: "stand" } }, { words: [{ who: "runner", text: "Not today." }], note: "CLOSE, long lens: the runner looks back." }],
    ]);
  }
  function takeFilm() {
    const objects = [
      { id: "ida", kind: "person", name: "Ida", color: "#3f9b6a", skin: "#e2b18f", hair: "#b8442c" },
      { id: "nessa", kind: "person", name: "Nessa", color: "#e8c547", skin: "#8a5a3c", hair: "#111" },
      { id: "tree", kind: "tree", name: "Tree", color: "#3f8f4f" },
      { id: "ball", kind: "ball", name: "Ball", color: "#d94f6a" },
      { id: "t1", kind: "building", name: "House", color: "#b8a68e", w: 7, h: 5, d: 5 },
    ];
    const base = {
      ida: { x: -0.45, y: 0, z: 0, turn: 0, size: 1, show: true, pose: "stand" },
      nessa: { x: 0.45, y: 0, z: 0, turn: 0, size: 1, show: true, pose: "stand" },
      tree: { x: -3, y: 0, z: -2.5, turn: 0, size: 1.4, show: true },
      ball: { x: 1.6, y: 0, z: 0.8, turn: 0, size: 0.6, show: true },
      t1: { x: 2.5, y: 0, z: -6, turn: 0, size: 1, show: true },
    };
    return makeFilm("insp-take", "The double take", "day", objects, base, [
      [2, { shot: 2.2, lens: 35, height: 4, around: 0, aim: "nessa" }, {}, { words: [{ who: "nessa", text: "I sold the house." }], note: "MEDIUM two-shot. Both face us." }],
      [1.5, { shot: 0.9, lens: 50, height: 2, around: 0, aim: "ida" }, {}, { words: [{ who: "ida", text: "Nice." }], note: "Ida doesn't react." }],
      [1, { shot: 0.9, lens: 50, height: 2, around: 0, aim: "ida" }, {}, { caption: "A beat.", note: "Hold. Nothing happens." }],
      [1.5, { shot: 0.55, lens: 85, height: 2, around: -10, aim: "ida", move: "glide" }, { ida: { turn: 80 } }, { words: [{ who: "ida", text: "You WHAT?" }], note: "The double take: Ida's head snaps round." }],
      [1.5, { shot: 0.3, lens: 85, height: 0, around: -15, aim: "ida" }, {}, { note: "Push in on the face." }],
      [2, { shot: 4, lens: 24, height: 12, around: -30, aim: "nessa" }, { nessa: { pose: "wave", turn: -60 } }, { words: [{ who: "nessa", text: "It was a good offer." }], note: "WIDE. Nessa shrugs it off." }],
    ]);
  }

  function fixFilm(f) {
    if (!f || !Array.isArray(f.panels) || !f.panels.length || !Array.isArray(f.objects)) return sampleFilm();
    f.objects = f.objects.filter((o) => o && o.id && KINDS[o.kind]);
    f.panels.forEach((p, i) => {
      p.id = p.id || "p" + (i + 1) + "-" + Date.now().toString(36);
      p.sec = clamp(+p.sec || 2, 0.25, 30);
      p.cam = cam(p.cam);
      p.place = p.place || {};
      f.objects.forEach((o) => {
        if (!p.place[o.id]) p.place[o.id] = { x: 0, y: 0, z: 0, turn: 0, size: 1, show: true };
      });
      p.words = Array.isArray(p.words) ? p.words.filter((w) => w && typeof w.text === "string") : [];
      p.caption = p.caption || "";
      p.note = p.note || "";
      p.rain = p.rain || "none";
    });
    f.look = f.look || "dusk";
    f.title = f.title || "My film";
    return f;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return fixFilm(JSON.parse(raw));
    } catch (e) {}
    return sampleFilm();
  }

  let film = load();
  let cur = 0; /* the selected panel */
  let T = 0; /* the playhead, in seconds from the start of the film */
  let playing = false;
  let speed = 1;
  let loop = true;
  /* when you stop: go back to where you pressed Play ("replay", the default) or stay where it stopped ("advance") */
  const AFTERSTOP_KEY = "curiosities-viewer-afterstop-v1";
  let afterStop = "replay";
  try {
    if (localStorage.getItem(AFTERSTOP_KEY) === "advance") afterStop = "advance";
  } catch (e) {}
  let playFrom = null;
  let upMeans = "floor"; /* the pad's up and down: "floor" (farther and nearer) or "air" (lift and lower) */
  let step = 0.3;
  let tab = "move";
  let rainT = 0;

  /* ---------- windows: My film plus as many inspiration films as you like ---------- */
  const WKEY = "curiosities-viewer-windows-v1";
  const INSP = [chaseFilm(), takeFilm()]; /* plus videos brought in this session (not saved: they stay on your computer) */
  let wins = (() => {
    try {
      const w = JSON.parse(localStorage.getItem(WKEY) || "null");
      if (Array.isArray(w) && w.length) return w.filter((id) => id === "mine" || INSP.some((f) => f.id === id)).slice(0, 8);
    } catch (e) {}
    return ["mine"];
  })();
  if (!wins.length) wins = ["mine"];
  const W_EL = []; /* per window: { el, canvas, ctx, hud, video, picks } */
  let activeWin = 0;
  /* Two ways to see many windows: "fit" shrinks them all to fit the stage, "swipe" keeps one big window and
     you drag along its top edge (or click the dots) to see the others. */
  const MKEY = "curiosities-viewer-winmode-v1";
  let winMode = (() => {
    try {
      return localStorage.getItem(MKEY) === "swipe" ? "swipe" : "fit";
    } catch (e) {
      return "fit";
    }
  })();
  let shownWin = 0;
  function setWinMode(m) {
    winMode = m === "swipe" ? "swipe" : "fit";
    try {
      localStorage.setItem(MKEY, winMode);
    } catch (e) {}
    shownWin = Math.min(shownWin, wins.length - 1);
    buildWins();
    draw();
  }
  function showWin(i) {
    const n = wins.length;
    shownWin = ((i % n) + n) % n;
    activeWin = shownWin;
    canvas = W_EL[shownWin].canvas;
    picks = W_EL[shownWin].picks;
    W_EL.forEach((w, k) => w.el.querySelectorAll(".cv-wdots i").forEach((d, j) => d.classList.toggle("on", j === shownWin)));
    draw();
  }
  function saveWins() {
    try {
      localStorage.setItem(WKEY, JSON.stringify(wins.filter((id) => id === "mine" || !/^vid-/.test(id))));
    } catch (e) {}
  }
  const allFilms = () => [{ id: "mine", title: "My film" }, ...INSP.map((f) => ({ id: f.id, title: f.title, video: f.kind === "video" }))];
  const filmFor = (id) => (id === "mine" ? film : INSP.find((f) => f.id === id) || film);
  function withFilm(f, fn) {
    const keep = film;
    film = f;
    try {
      return fn();
    } finally {
      film = keep;
    }
  }

  const starts = () => {
    const s = [];
    let t = 0;
    film.panels.forEach((p) => (s.push(t), (t += p.sec)));
    return s;
  };
  const total = () => film.panels.reduce((a, p) => a + p.sec, 0);
  function panelAt(t) {
    const s = starts();
    for (let i = s.length - 1; i >= 0; i--) if (t >= s[i] - 1e-6) return { i, u: clamp((t - s[i]) / film.panels[i].sec, 0, 1) };
    return { i: 0, u: 0 };
  }
  const objById = (id) => film.objects.find((o) => o.id === id);

  /* Where everything is at time t: things glide from this panel's spots to the next panel's spots; the camera
     holds (a cut) unless the panel says glide. */
  function stateAt(t) {
    const { i, u } = panelAt(t);
    const a = film.panels[i];
    const b = film.panels[i + 1] || a;
    const e = ease(u);
    const place = {};
    const moving = {};
    film.objects.forEach((o) => {
      const p = a.place[o.id];
      const q = b.place[o.id] || p;
      const dist = Math.hypot(q.x - p.x, q.z - p.z);
      moving[o.id] = dist > 0.15;
      place[o.id] = {
        x: lerp(p.x, q.x, e),
        y: lerp(p.y, q.y, e),
        z: lerp(p.z, q.z, e),
        turn: lerpAngle(p.turn, q.turn, e),
        size: lerp(p.size || 1, q.size || 1, e),
        sx: lerp(p.sx || 1, q.sx || 1, e),
        sy: lerp(p.sy || 1, q.sy || 1, e),
        sz: lerp(p.sz || 1, q.sz || 1, e),
        show: p.show !== false,
        pose: moving[o.id] && !/^sit/.test(p.pose || "") && !/^sit/.test(q.pose || "") && !(POSE_FX[p.pose] && POSE_FX[p.pose].keep) && u < 0.999 ? "walk" : p.pose || "stand",
      };
      /* anything else a panel keeps about a thing (tilt, a color for this panel, fire ...): numbers glide, the rest holds */
      Object.keys(p).forEach((k) => {
        if (k in place[o.id]) return;
        place[o.id][k] = typeof p[k] === "number" && typeof q[k] === "number" ? (/^(tilt|roll)$/.test(k) ? lerpAngle(p[k], q[k], e) : lerp(p[k], q[k], e)) : p[k];
      });
    });
    let c = a.cam;
    if (a.cam.move === "glide" && b !== a) {
      const n = b.cam;
      c = Object.assign({}, a.cam, {
        shot: Math.exp(lerp(Math.log(a.cam.shot), Math.log(n.shot), e)),
        lens: Math.exp(lerp(Math.log(a.cam.lens), Math.log(n.lens), e)),
        fish: lerp(a.cam.fish, n.cam === undefined ? n.fish : n.fish, e),
        height: lerp(a.cam.height, n.height, e),
        around: lerp(a.cam.around, n.around, e),
        tilt: lerp(a.cam.tilt, n.tilt, e),
        aimFrom: a.cam.aim,
        aimTo: n.aim,
        aimMix: e,
        pan: [0, 1, 2].map((k) => lerp((a.cam.pan || [0, 0, 0])[k], (n.pan || [0, 0, 0])[k], e)),
      });
    }
    /* a flight path for this panel (viewer/flight.js) flies the camera instead */
    for (const fn of HOOK.pose) {
      let pose = null;
      try {
        pose = fn(a, u, place, c);
      } catch (err) {}
      if (pose) {
        c = Object.assign({}, c, { pose });
        break;
      }
    }
    return { i, u, panel: a, place, cam: c, phase: t * Math.PI * 2 * 1.5 };
  }
  function aimPoint(id, place) {
    const o = objById(id);
    const p = o && place[o.id];
    if (!o || !p) return [0, 0.9, 0];
    const sitDrop = o.kind === "person" && /^sit/.test(p.pose || "") ? 0.4 : 0;
    return [p.x, p.y + (lookOf(o) - sitDrop) * (p.size || 1) * (p.sy || 1), p.z];
  }
  /* Where the camera looks: its subject, slid by pan (Control-drag, or a double-click zoom). */
  function camTarget(st) {
    const c = st.cam;
    if (c.pose && c.pose.target) return c.pose.target.slice();
    const pan = Array.isArray(c.pan) ? c.pan : [0, 0, 0];
    let t;
    if (c.aimFrom !== undefined) {
      const a = aimPoint(c.aimFrom, st.place);
      const b = aimPoint(c.aimTo, st.place);
      t = [lerp(a[0], b[0], c.aimMix), lerp(a[1], b[1], c.aimMix), lerp(a[2], b[2], c.aimMix)];
    } else t = aimPoint(c.aim, st.place);
    return [t[0] + (pan[0] || 0), Math.max(0, t[1] + (pan[1] || 0)), t[2] + (pan[2] || 0)];
  }
  /* The ray from the camera through a point of the picture (the projection run backwards). */
  function unproject(C, sx, sy) {
    const x = (sx - C.W / 2) / C.F;
    const y = -(sy - C.H / 2) / C.F;
    const r = Math.hypot(x, y);
    if (r < 1e-9) return C.fwd;
    const th = lensTh(C, r);
    return norm(add(mul(C.fwd, Math.cos(th)), mul(add(mul(C.right, x / r), mul(C.up, y / r)), Math.sin(th))));
  }

  /* ---------- drawing a frame ---------- */
  const LOOKS = {
    dusk: { sky: ["#1d1f45", "#5b3d6e", "#d0735a"], floor: ["#2b2f3f", "#323748"], fog: [90, 70, 100], light: [0.45, 0.75, 0.5], amb: 0.45, rain: "rgba(200,215,255,0.55)" },
    day: { sky: ["#5aa7ef", "#a8d2f5", "#e9f4fb"], floor: ["#a7a9a3", "#b5b7b0"], fog: [210, 225, 240], light: [0.4, 0.85, 0.35], amb: 0.55, rain: "rgba(120,140,170,0.55)" },
    night: { sky: ["#05060d", "#0d1226", "#1b2340"], floor: ["#161923", "#1b1f2b"], fog: [20, 24, 40], light: [0.3, 0.7, 0.6], amb: 0.35, rain: "rgba(170,190,255,0.5)" },
  };
  let floorCache = null;
  function floorFaces() {
    if (floorCache) return floorCache;
    const F = [];
    const S = 1.5;
    for (let i = -14; i < 14; i++) {
      for (let j = -14; j < 14; j++) {
        const x = i * S;
        const z = j * S;
        F.push({ pts: [[x, 0, z], [x, 0, z + S], [x + S, 0, z + S], [x + S, 0, z]], alt: (i + j) & 1 });
      }
    }
    return (floorCache = F);
  }
  function subdivide(pts, n) {
    if (n <= 1 || pts.length !== 4) return [pts];
    const [a, b, c, d] = pts;
    const at = (u, v) => add(mul(add(mul(a, 1 - u), mul(b, u)), 1 - v), mul(add(mul(d, 1 - u), mul(c, u)), v));
    const out = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push([at(i / n, j / n), at((i + 1) / n, j / n), at((i + 1) / n, (j + 1) / n), at(i / n, (j + 1) / n)]);
    return out;
  }
  function shadeColor(f, L, look, depth) {
    const lam = f.glow ? 1 : look.amb + (1 - look.amb) * Math.max(0, dot(f.n, L));
    const fog = clamp((depth - fogOff - 8) / 45, 0, 0.75);
    const c = f.color.map((v, k) => lerp(v * (f.glow ? 1.15 : lam), look.fog[k], fog));
    return `rgb(${c.map((v) => clamp(Math.round(v), 0, 255)).join(",")})`;
  }
  /* A face part behind the camera is cut off at the camera instead of the whole face being dropped, so walls
     and buildings stay when you move right up to them or past them. A plain lens cuts the face at a plane just
     in front of the camera; a fisheye (which can see further round) splits the face into smaller pieces and
     keeps every piece it can see. */
  const NEAR = 0.05;
  /* Haze starts past the subject, not at a fixed distance, so a long lens far away (little foreshortening)
     still shows a clear picture instead of a grey one. Set by drawFrame for the frame it draws. */
  let fogOff = 0;
  function clipNear(C, pts) {
    const zs = pts.map((p) => dot(sub(p, C.pos), C.fwd));
    if (zs.every((z) => z >= NEAR)) return pts;
    if (zs.every((z) => z < NEAR)) return null;
    const out = [];
    pts.forEach((a, i) => {
      const j = (i + 1) % pts.length;
      const b = pts[j];
      if (zs[i] >= NEAR) out.push(a);
      if (zs[i] >= NEAR !== zs[j] >= NEAR) out.push(add(a, mul(sub(b, a), (NEAR - zs[i]) / (zs[j] - zs[i]))));
    });
    return out.length >= 3 ? out : null;
  }
  function projectFace(C, pts, depth) {
    const s = pts.map((q) => project(C, q));
    if (!s.some((q) => !q)) return [s];
    if (C.a > 0.999 || pts.length !== 4 || (depth || 0) >= 3) {
      const c = clipNear(C, pts);
      if (!c) return [];
      const t = c.map((q) => project(C, q));
      return t.some((q) => !q) ? [] : [t];
    }
    return subdivide(pts, 2).flatMap((pp) => projectFace(C, pp, (depth || 0) + 1));
  }
  function polyPath(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(s[0][0], s[0][1]);
    for (let k = 1; k < s.length; k++) ctx.lineTo(s[k][0], s[k][1]);
    ctx.closePath();
  }

  /* A pencil line in the world: thicker near, thinner far. Clicking near it picks its thing. */
  function drawLine(ctx, C, P, look, opts) {
    const f = P.f;
    const fog = clamp((P.depth - fogOff - 8) / 45, 0, 0.75);
    const c = f.color.map((v, k) => clamp(Math.round(lerp(v, look.fog[k], fog)), 0, 255));
    ctx.strokeStyle = `rgb(${c.join(",")})`;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (f.dash) ctx.setLineDash([6, 6]);
    const s = P.s;
    for (let k = 1; k < s.length; k++) {
      const a = s[k - 1];
      const b = s[k];
      if (!a || !b) continue;
      ctx.lineWidth = Math.max(1, (f.w * C.F) / Math.max(0.05, (a[2] + b[2]) / 2));
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    if (s.length === 1 && s[0]) {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(s[0][0], s[0][1], Math.max(1, (f.w * C.F) / s[0][2] / 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.setLineDash([]);
    if (opts.picks) {
      /* a thin band around the line, so it can be clicked */
      for (let k = 1; k < s.length; k++) {
        const a = s[k - 1];
        const b = s[k];
        if (!a || !b) continue;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const l = Math.hypot(dx, dy) || 1;
        const r = Math.max(5, ctx.lineWidth);
        const nx = (-dy / l) * r;
        const ny = (dx / l) * r;
        opts.picks.push({ s: [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], obj: f.obj, tag: f.tag });
      }
    }
  }
  /* Words in the world: laid on a flat sign, so they shrink with distance and lean with the thing.
     Seen from behind they are turned round so they still read left to right. */
  function drawText3(ctx, C, P, look, opts, W) {
    const f = P.f;
    let ax = f.ax;
    let ay = f.ay;
    if (f.face) {
      /* always turned to face the camera, like a label */
      ax = mul(C.right, len(f.ax));
      ay = mul(C.up, len(f.ay));
    } else if (dot(f.n, sub(C.pos, f.o)) < 0) ax = mul(ax, -1);
    const o = project(C, f.o);
    const px = project(C, add(f.o, mul(ax, 0.01)));
    const py = project(C, add(f.o, mul(ay, 0.01)));
    if (!o || !px || !py) return;
    const a = [(px[0] - o[0]) / 0.01, (px[1] - o[1]) / 0.01];
    const b = [(py[0] - o[0]) / 0.01, (py[1] - o[1]) / 0.01];
    if (Math.abs(a[0] * b[1] - a[1] * b[0]) < 1e-6) return;
    const fog = clamp((P.depth - fogOff - 8) / 45, 0, 0.75);
    const c = f.color.map((v, k) => clamp(Math.round(lerp(v, look.fog[k], fog)), 0, 255));
    const PX = 100; /* draw the letters 100 px tall, then map to h metres */
    const k = f.h / PX;
    ctx.save();
    /* text space: x right along ax, y down (minus ay) */
    ctx.setTransform(a[0] * k, a[1] * k, -b[0] * k, -b[1] * k, o[0], o[1]);
    ctx.font = `${f.italic ? "italic " : ""}${f.weight} ${PX}px ${f.font}`;
    ctx.textAlign = f.align;
    ctx.textBaseline = "alphabetic";
    const lines = f.text.split("\n");
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
    lines.forEach((l, i) => {
      const y = (i - lines.length + 1) * PX * 1.15;
      if (f.outline) {
        ctx.lineWidth = 8;
        ctx.strokeStyle = f.outline;
        ctx.lineJoin = "round";
        ctx.strokeText(l, 0, y);
      }
      ctx.fillStyle = `rgb(${c.join(",")})`;
      ctx.fillText(l, 0, y);
    });
    ctx.restore();
    if (opts.picks) {
      const x0 = f.align === "center" ? -w / 2 : f.align === "right" || f.align === "end" ? -w : 0;
      const top = -(lines.length - 1) * PX * 1.15 - PX * 0.85;
      const map = (x, y) => [o[0] + a[0] * k * x - b[0] * k * y, o[1] + a[1] * k * x - b[1] * k * y];
      opts.picks.push({ s: [map(x0, top), map(x0 + w, top), map(x0 + w, PX * 0.25), map(x0, PX * 0.25)], obj: f.obj, tag: f.tag });
    }
  }

  /* Draws the frame at time t (or a panel's first moment) into a 2D context of W x H.
     opts: { sel, words: true, picks: [] (filled with what was drawn, for clicking), guides } */
  function drawFrame(ctx, W, H, st, opts) {
    opts = opts || {};
    const look = LOOKS[film.look] || LOOKS.dusk;
    const target = camTarget(st);
    const C = makeCamera(st.cam, target, W, H);
    fogOff = Math.max(0, C.d - 6);
    const L = norm(look.light);
    /* sky */
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, look.sky[0]);
    g.addColorStop(0.55, look.sky[1]);
    g.addColorStop(1, look.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const nsub = C.a < 0.999 ? (C.a < 0.4 ? 5 : 3) : 1;
    /* from underneath, the floor is see-through like glass */
    const under = C.pos[1] < 0.02;
    /* the ground all the way to the horizon, under the street's tiles */
    if (!under) {
      const ring = [];
      const yaw0 = Math.atan2(C.fwd[0], C.fwd[2]);
      for (let k = -36; k <= 36; k++) {
        const a = yaw0 + (k / 36) * Math.PI;
        const q = project(C, [C.pos[0] + Math.sin(a) * 600, 0, C.pos[2] + Math.cos(a) * 600]);
        if (q) ring.push(q);
      }
      const base = hex(look.floor[0]);
      const far = base.map((v, k) => Math.round(lerp(v * look.amb * 1.4, look.fog[k], 0.7)));
      ctx.fillStyle = `rgb(${far.join(",")})`;
      if (ring.length < 2) {
        if (C.fwd[1] < 0) ctx.fillRect(0, 0, W, H);
      } else {
        ctx.beginPath();
        ring.forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        if (C.fwd[1] < -0.7) ctx.closePath();
        else {
          const last = ring[ring.length - 1];
          const first = ring[0];
          ctx.lineTo(last[0] + W * 0.02, H * 3);
          ctx.lineTo(first[0] - W * 0.02, H * 3);
          ctx.closePath();
        }
        ctx.fill();
      }
    }
    /* the street */
    const floorN = [0, 1, 0];
    if (under) ctx.globalAlpha = 0.28;
    floorFaces().forEach((f) => {
      const pieces = subdivide(f.pts, C.a < 0.999 || C.pos[1] < 0.6 ? 3 : 1);
      pieces.forEach((pp) => projectFace(C, pp).forEach((s) => {
        const depth = s.reduce((a, q) => a + q[2], 0) / s.length;
        const fog = clamp((depth - fogOff - 8) / 45, 0, 0.8);
        const base = hex(look.floor[f.alt]);
        const lam = look.amb + (1 - look.amb) * Math.max(0, dot(floorN, L));
        const c = base.map((v, k) => Math.round(lerp(v * lam, look.fog[k], fog)));
        ctx.fillStyle = `rgb(${c.join(",")})`;
        polyPath(ctx, s);
        ctx.fill();
        ctx.strokeStyle = `rgba(${c.join(",")},1)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }));
    });
    ctx.globalAlpha = 1;
    /* grid lines on the floor show the lens bending and stretching space */
    ctx.strokeStyle = film.look === "day" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = Math.max(1, W / 900);
    for (let i = -14; i <= 14; i++) {
      [0, 1].forEach((axis) => {
        ctx.beginPath();
        let pen = false;
        for (let k = -14 * 4; k <= 14 * 4; k++) {
          const a = i * 1.5;
          const b = (k / 4) * 1.5;
          const q = project(C, axis ? [a, 0.001, b] : [b, 0.001, a]);
          if (!q || Math.abs(q[0]) > W * 4 || Math.abs(q[1]) > H * 4) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
          pen = true;
        }
        ctx.stroke();
      });
    }
    /* soft shadows under things */
    film.objects.forEach((o) => {
      const p = st.place[o.id];
      if (!p || !p.show || p.y > 0.3 || o.kind === "building" || o.noShadow) return;
      const r = ringOf(o) * (p.size || 1) * Math.max(p.sx || 1, p.sz || 1) * 0.85;
      ctx.beginPath();
      let ok = true;
      for (let k = 0; k <= 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const q = project(C, [p.x + r * Math.cos(a), 0.002, p.z + r * Math.sin(a)]);
        if (!q) {
          ok = false;
          break;
        }
        k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
      }
      if (!ok) return;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fill();
    });
    /* the selected thing's ring */
    if (opts.sel) {
      const p = st.place[opts.sel];
      const o = objById(opts.sel);
      if (p && o) {
        const r = ringOf(o) * (p.size || 1) * Math.max(p.sx || 1, p.sz || 1);
        ctx.beginPath();
        let ok = true;
        for (let k = 0; k <= 32; k++) {
          const a = (k / 32) * Math.PI * 2;
          const q = project(C, [p.x + r * Math.cos(a), 0.004, p.z + r * Math.sin(a)]);
          if (!q) {
            ok = false;
            break;
          }
          k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
        }
        if (ok) {
          ctx.strokeStyle = "#22d3ee";
          ctx.lineWidth = Math.max(2, W / 400);
          ctx.setLineDash([W / 120, W / 160]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    /* things, back to front */
    const polys = [];
    film.objects.forEach((o) => {
      const p = st.place[o.id];
      if (!p || !p.show) return;
      thingFaces(o, p, st.phase).forEach((f) => {
        if (f.line) {
          const s = f.pts.map((q) => project(C, q));
          const ok = s.filter(Boolean);
          if (!ok.length) return;
          polys.push({ s, depth: ok.reduce((a, q) => a + q[2], 0) / ok.length, f });
          return;
        }
        if (f.text) {
          const s0 = project(C, f.o);
          if (!s0) return;
          polys.push({ s: [s0], depth: s0[2], f });
          return;
        }
        const fc = f.pts.reduce((a, b) => add(a, b), [0, 0, 0]).map((v) => v / f.pts.length);
        if (dot(f.n, sub(C.pos, fc)) <= 0) {
          if (!f.two) return;
          f = Object.assign({}, f, { n: mul(f.n, -1) });
        }
        const big = nsub > 1 && Math.max(len(sub(f.pts[0], f.pts[2])), len(sub(f.pts[1], f.pts[f.pts.length - 1]))) > 0.6;
        subdivide(f.pts, big ? nsub : 1).forEach((pp) =>
          projectFace(C, pp).forEach((s) => {
            const depth = s.reduce((a, q) => a + q[2], 0) / s.length;
            polys.push({ s, depth, f });
          }),
        );
      });
    });
    polys.sort((a, b) => b.depth - a.depth);
    const lw = Math.max(0.6, W / 1100);
    /* background blur: draw everything, blur it, then draw the subject and what is in front of it sharp again */
    const blur = clamp(st.cam.blur || 0, 0, 1);
    const subjD = len(sub(target, C.pos)) + 0.6;
    const drawPoly = (P) => {
      if (P.f.line) return drawLine(ctx, C, P, look, opts);
      if (P.f.text) return drawText3(ctx, C, P, look, opts, W);
      const col = shadeColor(P.f, L, look, P.depth);
      ctx.fillStyle = col;
      polyPath(ctx, P.s);
      if (P.f.glass) ctx.globalAlpha = 0.28;
      ctx.fill();
      ctx.globalAlpha = 1;
      /* soft: a smooth surface made of many small faces (a 3D character) shows no lines between them */
      ctx.strokeStyle = P.f.glow || P.f.soft ? col : "rgba(10,10,14,0.55)";
      ctx.lineWidth = lw;
      ctx.stroke();
      if (opts.picks) opts.picks.push({ s: P.s, obj: P.f.obj, tag: P.f.tag, n: P.f.n, pts: P.f.pts });
    };
    if (blur > 0.01 && typeof document !== "undefined") {
      polys.forEach((P) => P.depth > subjD && drawPoly(P));
      const tmp = document.createElement("canvas");
      tmp.width = W;
      tmp.height = H;
      tmp.getContext("2d").drawImage(ctx.canvas, 0, 0);
      ctx.save();
      ctx.filter = `blur(${(blur * W) / 90}px)`;
      ctx.drawImage(tmp, 0, 0);
      ctx.restore();
      polys.forEach((P) => P.depth <= subjD && drawPoly(P));
    } else polys.forEach(drawPoly);
    /* rain */
    if (st.panel.rain !== "none") {
      const frozen = st.panel.rain === "frozen";
      const r = rand(7);
      ctx.strokeStyle = look.rain;
      ctx.fillStyle = "rgba(225,235,255,0.85)";
      ctx.lineWidth = Math.max(1, W / 1000);
      const cx = target[0];
      const cz = target[2];
      const span = clamp(C.d * 1.6 + 2, 3, 14);
      const tt = opts.rainT === undefined ? rainT : opts.rainT;
      ctx.beginPath();
      for (let k = 0; k < 420; k++) {
        const x = cx + (r() - 0.5) * 2 * span;
        const z = cz + (r() - 0.5) * 2 * span;
        const y0 = r() * 7;
        const y = (((y0 - tt * 7) % 7) + 7) % 7;
        const a = project(C, [x, y, z]);
        const b = project(C, [x, y + (frozen ? 0.025 : 0.22), z]);
        if (!a || !b) continue;
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
    }
    /* a full fisheye shows the round edge of its picture */
    if ((st.cam.fish || 0) > 0.8) {
      const R = C.F * lensR(C, Math.min(Math.PI / 2, C.thMax));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2, true);
      ctx.fillStyle = "rgba(0,0,0,0.92)";
      ctx.fill("evenodd");
      ctx.restore();
    }
    /* the color filter over the picture (the words stay clear on top) */
    const flt = FILTERS[st.cam.filter || "none"];
    if (flt && flt.css && typeof document !== "undefined") {
      const tmp = document.createElement("canvas");
      tmp.width = W;
      tmp.height = H;
      tmp.getContext("2d").drawImage(ctx.canvas, 0, 0);
      ctx.save();
      ctx.filter = flt.css;
      ctx.drawImage(tmp, 0, 0);
      ctx.restore();
    }
    if (opts.words !== false) drawWords(ctx, W, H, st, C, opts);
    return C;
  }

  /* ---------- comic words: a caption box and speech balloons with tails ---------- */
  const COMIC = "'Comic Neue','Comic Sans MS','Chalkboard SE','Marker Felt',system-ui,sans-serif";
  function wrapText(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((w) => {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  function drawWords(ctx, W, H, st, C, opts) {
    opts = opts || {};
    const p = st.panel;
    const fs = Math.max(9, Math.round(W * (W < 700 ? 0.042 : 0.022)));
    ctx.textBaseline = "top";
    if (p.caption) {
      ctx.font = `600 ${fs}px ${COMIC}`;
      const lines = wrapText(ctx, p.caption.toUpperCase(), W * (W < 700 ? 0.5 : 0.38));
      const pad = fs * 0.5;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2;
      const h = lines.length * fs * 1.2 + pad * 2 - fs * 0.2;
      const x = W * 0.02;
      const y = H * 0.03 + (opts.top || 0);
      ctx.fillStyle = "#ffe98a";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = Math.max(1, W / 450);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#111";
      lines.forEach((l, k) => ctx.fillText(l, x + pad, y + pad + k * fs * 1.2));
    }
    const n = p.words.length;
    p.words.forEach((wd, k) => {
      if (!wd.text) return;
      /* playing: the words appear at the speed they are spoken (viewer/speech.js); the balloon keeps its full size */
      const said = opts.talk && window.CurioSpeech ? CurioSpeech.reveal(p, k, st.u * p.sec) : null;
      if (said === "") return;
      ctx.font = `700 ${fs}px ${COMIC}`;
      const lines = wrapText(ctx, wd.text, W * (W < 700 ? 0.42 : 0.28));
      const pad = fs * 0.6;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2;
      const h = lines.length * fs * 1.15 + pad * 2 - fs * 0.15;
      const who = st.place[wd.who];
      let head = null;
      if (who && who.show) {
        const o = objById(wd.who);
        const mouth = o && o.kind === "person" ? (/^sit/.test(who.pose || "") ? 1.14 : 1.54) * (who.size || 1) : (o ? lookOf(o) : KINDS.box.look);
        head = project(C, [who.x, who.y + mouth, who.z]);
        if (head && (head[0] < 0 || head[0] > W || head[1] < 0 || head[1] > H)) head = null;
      }
      const capBottom = p.caption ? H * 0.03 + (opts.top || 0) + fs * 1.2 * 3 + fs : 0;
      let x;
      let y;
      if (head) {
        /* above the speaker when there is room, else beside the face */
        x = head[0] - w / 2;
        y = head[1] - h - Math.max(H * 0.1, fs * 2);
        if (y < H * 0.03 + (opts.top || 0)) {
          y = H * 0.04 + (opts.top || 0) + k * (h + fs * 0.5);
          const room = head[0] > W / 2 ? head[0] - W * 0.08 - w : W * 0.92 - (head[0] + W * 0.08);
          x = head[0] > W / 2 ? head[0] - W * 0.08 - w : head[0] + W * 0.08;
          if (room < 0) x = head[0] > W / 2 ? W * 0.02 : W * 0.98 - w;
        }
      } else {
        x = W * (n === 1 ? 0.62 : 0.5 + 0.22 * k) - w / 2;
        y = H * 0.04 + (opts.top || 0) + k * (h + fs * 0.6);
      }
      x = clamp(x, W * 0.02, W * 0.98 - w);
      if (p.caption && x < W * 0.5 && y < capBottom) y = capBottom;
      ctx.lineWidth = Math.max(1.2, W / 380);
      ctx.strokeStyle = "#111";
      ctx.fillStyle = "#fff";
      /* the balloon */
      const r = Math.min(h / 2, fs * 1.4);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      /* the tail points at whoever speaks; off screen, the tail points out of the frame */
      let tipX = head ? head[0] : x + w * 0.75 + fs * 1.2;
      let tipY = head ? head[1] : y + h + fs * 1.4;
      const bx = clamp(head ? lerp(x + w / 2, head[0], 0.6) : x + w * 0.7, x + r, x + w - r);
      if (head) {
        /* keep the tail short: stop it a little before the mouth */
        const dx = tipX - bx;
        const dy = tipY - (y + h);
        const l = Math.hypot(dx, dy);
        const want = Math.min(l * 0.85, Math.max(fs * 1.5, H * 0.14));
        if (l > 1) {
          tipX = bx + (dx / l) * want;
          tipY = y + h + (dy / l) * want;
        }
        if (tipY < y + h + fs * 0.6) tipY = y + h + fs * 0.6;
      }
      ctx.beginPath();
      ctx.moveTo(bx - fs * 0.5, y + h - 1);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(bx + fs * 0.5, y + h - 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - fs * 0.5, y + h);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(bx + fs * 0.5, y + h);
      ctx.stroke();
      ctx.fillStyle = "#111";
      let left = said == null ? Infinity : said.split(/\s+/).filter(Boolean).length;
      lines.forEach((l, i) => {
        if (left <= 0) return;
        const ws = l.split(/\s+/).filter(Boolean);
        ctx.fillText(ws.length <= left ? l : ws.slice(0, left).join(" "), x + pad, y + pad + i * fs * 1.15);
        left -= ws.length;
      });
    });
  }

  /* ---------- plain words for the camera ---------- */
  const shotFromSlider = (v) => 15 * Math.pow(0.08 / 15, v / 100);
  const sliderFromShot = (s) => (Math.log(s / 15) / Math.log(0.08 / 15)) * 100;
  const lensFromSlider = (v) => 300 * Math.pow(8 / 300, v / 100); /* the Foreshortening slider: right = wider lens */
  const sliderFromLens = (f) => (Math.log(f / 300) / Math.log(8 / 300)) * 100;
  function shotWords(s) {
    if (s >= 6) return ["Extreme wide", "the whole place, people tiny"];
    if (s >= 2.6) return ["Wide", "the whole place"];
    if (s >= 1.6) return ["Full", "a person head to toe"];
    if (s >= 0.8) return ["Medium", "a person from the waist up"];
    if (s >= 0.35) return ["Close", "one face fills the picture"];
    return ["Extreme close", "one small thing, an eye, a hand"];
  }
  function lensWords(f) {
    if (f < 14) return ["Ultra wide", "huge foreshortening: what is near the camera looks giant, the back of the room looks far away"];
    if (f < 24) return ["Wide", "strong foreshortening: near things look big, far things small, space feels deep"];
    if (f < 40) return ["Normal-wide", "a little foreshortening, like a phone camera"];
    if (f < 70) return ["Normal", "close to how your eye sees"];
    if (f < 135) return ["Long", "little foreshortening: the background looks closer and bigger, space feels flat"];
    return ["Very long", "almost no foreshortening: everything looks stacked flat, like a telephoto at a sports game"];
  }
  function heightWords(h) {
    if (h < -45) return ["From underneath", "below the floor, looking up as if the floor were glass"];
    if (h < -20) return ["Worm's eye", "from the floor, looking up: they look huge and strong"];
    if (h < -4) return ["Low", "a little below, looking up: they look bigger"];
    if (h <= 12) return ["Eye level", "straight on, like a person standing there"];
    if (h < 45) return ["High", "above, looking down: they look smaller"];
    if (h < 75) return ["Very high", "far above, looking down"];
    return ["Overhead", "straight down, a bird's eye view"];
  }
  function aroundWords(rel) {
    const a = Math.abs(wrap180(rel));
    const side = wrap180(rel) > 0 ? "their left" : "their right";
    if (a < 20) return "in front of them";
    if (a < 70) return "three-quarter, toward " + side;
    if (a < 110) return "from the side (" + side + ")";
    if (a < 160) return "behind, toward " + side;
    return "behind them";
  }
  function blurWords(b) {
    return b < 0.02 ? "none" : b < 0.35 ? "a little" : b < 0.7 ? "soft background" : "only the subject is sharp";
  }
  /* color filters over the whole picture (canvas filters) */
  const FILTERS = {
    none: { label: "None", css: "" },
    warm: { label: "Warm, golden", css: "sepia(0.35) saturate(1.25) hue-rotate(-10deg)" },
    cool: { label: "Cool, blue", css: "saturate(0.9) hue-rotate(18deg) brightness(0.97)" },
    noir: { label: "Black and white", css: "grayscale(1) contrast(1.25)" },
    sepia: { label: "Old photo", css: "sepia(0.85) contrast(0.95)" },
    neon: { label: "Neon night", css: "saturate(1.8) contrast(1.15) hue-rotate(-20deg)" },
    faded: { label: "Faded film", css: "contrast(0.8) saturate(0.7) brightness(1.08)" },
    dream: { label: "Dreamy glow", css: "brightness(1.12) saturate(1.2) blur(0.6px)" },
  };
  function tiltWords(t) {
    if (Math.abs(t) < 2) return "level";
    if (Math.abs(t) > 150) return "upside down";
    if (Math.abs(t) > 60) return (t > 0 ? "turned far right" : "turned far left") + ", the world on its side";
    return (t > 0 ? "leaning right" : "leaning left") + " (a Dutch angle: the world feels off balance)";
  }
  function panelLine(p) {
    const c = p.cam;
    const bits = [shotWords(c.shot)[0], heightWords(c.height)[0], Math.round(c.lens) + "mm"];
    if (c.fish > 0.25) bits.push("fisheye");
    if (Math.abs(c.tilt) >= 2) bits.push("leaning");
    if (c.move === "glide") bits.push("camera glides");
    return bits.join(" · ");
  }
  function faceWords(o, place, camPos) {
    const toCam = Math.atan2(camPos[0] - place.x, camPos[2] - place.z) / DEG;
    const d = Math.abs(wrap180(place.turn - toCam));
    if (d < 25) return "faces the camera";
    if (d < 70) return "three-quarter to the camera";
    if (d < 110) return "side on to the camera (profile)";
    if (d < 155) return "turned mostly away";
    return "back to the camera";
  }

  /* ---------- undo and saving ---------- */
  const undo = [];
  const redo = [];
  let lastTag = "";
  let lastAt = 0;
  function remember(tag) {
    const now = Date.now();
    if (tag && tag === lastTag && now - lastAt < 900) {
      lastAt = now;
      return;
    }
    lastTag = tag || "";
    lastAt = now;
    undo.push(JSON.stringify({ film, cur }));
    if (undo.length > 80) undo.shift();
    redo.length = 0;
  }
  function restore(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify({ film, cur }));
    const s = JSON.parse(from.pop());
    film = fixFilm(s.film);
    cur = clamp(s.cur, 0, film.panels.length - 1);
    lastTag = "";
    T = starts()[cur];
    thumbsDirty = true;
    changed(true);
  }
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(film));
      } catch (e) {}
    }, 250);
  }

  /* ---------- the page ---------- */
  const CSS = `
.cv-root.cv-viewer { --c-ground:#0f0f10; --c-panel:#1c1c1e; --c-raised:#2a2a2d; --c-hover:#34343a; --c-line:#2e2e33; --c-text:#ececee; --c-dim:#9b9ba3; --c-accent:#22d3ee; --c-ink:#062a31; --c-warm:#ff9f43;
  position: fixed; inset: 0; z-index: 70; background: var(--c-ground); color: var(--c-text); display: grid; grid-template-rows: auto minmax(0, 1fr) auto;
  font-family: -apple-system, "Segoe UI", system-ui, sans-serif; font-size: 13px; color-scheme: dark; }
.cv-root.cv-viewer[hidden] { display: none; }
.cv-root [hidden] { display: none !important; }
.cv-root button, .cv-root select, .cv-root input, .cv-root textarea { font: inherit; font-size: 12px; color: inherit; }
.cv-root button { border: 0; background: var(--c-raised); padding: 5px 10px; cursor: pointer; border-radius: 6px; }
.cv-root button:hover:not(:disabled) { background: var(--c-hover); }
.cv-root button:disabled { opacity: 0.4; cursor: default; }
.cv-root button.on { color: var(--c-accent); box-shadow: inset 0 0 0 1px var(--c-accent); }
.cv-root button.cv-primary { background: var(--c-accent); color: var(--c-ink); font-weight: 600; }
.cv-root button.cv-primary:hover:not(:disabled) { background: #67e8f9; }
.cv-root select { width: auto; max-width: 100%; }
.cv-root .cv-field select { width: 100%; }
.cv-root label { margin: 0; text-transform: none; letter-spacing: 0; font-family: inherit; }
.cv-root select, .cv-root input[type=text], .cv-root input[type=number], .cv-root textarea { border: 1px solid var(--c-line); background: var(--c-raised); padding: 4px 6px; border-radius: 6px; min-width: 0; }
.cv-root textarea { width: 100%; box-sizing: border-box; resize: vertical; }
.cv-root input[type=range] { accent-color: var(--c-accent); width: 100%; }
.cv-root :focus-visible { outline: 2px solid var(--c-accent); outline-offset: 1px; }
.cv-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 8px 14px; border-bottom: 1px solid var(--c-line); }
.cv-brand { font-size: 15px; letter-spacing: 0.01em; }
.cv-title { font-size: 14px; color: var(--c-dim); padding: 2px 6px; border-radius: 4px; outline: none; }
.cv-title:focus { background: var(--c-raised); color: var(--c-text); }
.cv-bar-r { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.cv-views { position: relative; }
.cv-views-menu { position: absolute; right: 0; top: calc(100% + 4px); z-index: 30; min-width: 250px; display: grid; gap: 2px; padding: 4px; background: var(--c-raised); border: 1px solid var(--c-line); border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.45); }
.cv-views-menu[hidden] { display: none; }
.cv-views-menu button { display: grid; text-align: left; gap: 1px; }
.cv-views-menu small { color: var(--c-dim); font-size: 11px; }
.cv-main { display: grid; grid-template-columns: 190px minmax(0, 1fr) 330px; gap: 6px; padding: 6px; min-height: 0; }
.cv-pane { background: var(--c-panel); border-radius: 8px; min-height: 0; overflow: auto; }
/* Jeremy 2026-10-05: the side panels scroll when their contents don't fit. */
.cv-things, .cv-details .cv-body { overflow-y: auto; }
.cv-things { padding: 10px; display: grid; align-content: start; gap: 6px; }
.cv-things h3, .cv-details h3 { margin: 4px 0 2px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-dim); }
.cv-thing { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; }
.cv-thing.on { color: var(--c-accent); box-shadow: inset 0 0 0 1px var(--c-accent); }
.cv-thing.off { opacity: 0.5; }
.cv-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.cv-addrow { display: flex; flex-wrap: wrap; gap: 4px; }
.cv-player { display: grid; grid-template-rows: minmax(0, 1fr) auto auto; padding: 6px; gap: 6px; overflow: hidden; }
.cv-stage { position: relative; min-height: 0; display: grid; place-items: center; }
.cv-wins { display: grid; gap: 6px; justify-content: center; align-content: center; width: 100%; height: 100%; }
.cv-win { position: relative; background: #000; border-radius: 4px; overflow: hidden; box-shadow: inset 0 0 0 1px var(--c-line); }
.cv-win.is-mine { box-shadow: 0 0 0 1px var(--c-accent); }
.cv-wins[data-n="1"] .cv-win.is-mine { box-shadow: none; }
.cv-canvas, .cv-video { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; object-fit: contain; background: #000; }
.cv-win:not(.is-mine) .cv-canvas { cursor: default; }
.cv-wtab { position: absolute; left: 6px; top: 6px; display: flex; align-items: center; gap: 2px; background: rgba(12,12,14,0.78); border-radius: 6px; padding: 2px; touch-action: pan-y; user-select: none; max-width: calc(100% - 50px); z-index: 2; }
.cv-root .cv-wtab button { background: transparent; padding: 3px 7px; font-size: 12px; }
.cv-root .cv-wtab .cv-wplus { background: #22d3ee; color: #062a31; font-weight: 700; font-size: 15px; line-height: 1; padding: 2px 8px; margin-left: 4px; border-radius: 5px; }
.cv-wtop { display: none; position: absolute; left: 0; right: 0; top: 0; height: 14px; z-index: 1; cursor: ew-resize; touch-action: pan-y; background: linear-gradient(rgba(34,211,238,0.35), transparent); }
.cv-wins[data-mode="swipe"] .cv-wtop { display: flex; justify-content: center; align-items: center; }
.cv-wins[data-mode="swipe"][data-n="1"] .cv-wtop { display: none; }
.cv-wdots { display: flex; gap: 5px; }
.cv-wdots i { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; }
.cv-wdots i.on { background: #22d3ee; }
.cv-wins[data-mode="swipe"] .cv-wtab { top: 16px; }
.cv-root .cv-wtab .cv-wname { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.cv-win.is-mine .cv-wname { color: var(--c-accent); }
.cv-wmenu { position: absolute; left: 6px; top: 38px; z-index: 3; display: grid; background: var(--c-panel); border: 1px solid var(--c-line); border-radius: 8px; padding: 4px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); max-width: calc(100% - 12px); }
.cv-root .cv-wmenu button { background: transparent; text-align: left; }
.cv-root .cv-wclose { position: absolute; right: 6px; top: 6px; z-index: 2; background: rgba(12,12,14,0.78); width: 28px; height: 28px; padding: 0; font-size: 16px; }
.cv-root .cv-wadd { font-weight: 600; }
.cv-root .cv-wuse { position: absolute; right: 6px; bottom: 6px; z-index: 2; font-size: 11px; background: rgba(12,12,14,0.8); }
.cv-slide-l { animation: cv-sl 0.22s ease-out; }
.cv-slide-r { animation: cv-sr 0.22s ease-out; }
@keyframes cv-sl { from { transform: translateX(24px); opacity: 0.4; } to { transform: none; opacity: 1; } }
@keyframes cv-sr { from { transform: translateX(-24px); opacity: 0.4; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .cv-slide-l, .cv-slide-r { animation: none; } }
.cv-canvas.dragging { cursor: grabbing; }
.cv-hud { position: absolute; left: 8px; bottom: 6px; font-size: 11px; color: #fff; background: rgba(0,0,0,0.55); padding: 3px 8px; border-radius: 4px; pointer-events: none; max-width: 70%; }
.cv-transport { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.cv-transport .cv-time { font-variant-numeric: tabular-nums; color: var(--c-dim); min-width: 92px; }
.cv-transport input[type=range] { flex: 1 1 160px; width: auto; }
.cv-play { min-width: 74px; }
.cv-details { display: grid; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; }
.cv-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 8px 0; border-bottom: 1px solid var(--c-line); }
.cv-tabs button { border-radius: 6px 6px 0 0; }
.cv-body { padding: 10px 12px 16px; overflow: auto; display: grid; align-content: start; gap: 8px; }
.cv-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.cv-row > label { display: flex; align-items: center; gap: 4px; }
.cv-field { display: grid; gap: 3px; }
.cv-field > span { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; }
.cv-field > span b { font-weight: 600; }
.cv-field > span em { font-style: normal; color: var(--c-accent); text-align: right; }
.cv-field small, .cv-say { color: var(--c-dim); font-size: 11px; line-height: 1.35; }
.cv-ends { display: flex; justify-content: space-between; font-size: 10px; color: var(--c-dim); margin-top: -2px; }
.cv-pad { display: grid; grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(3, 40px); gap: 4px; }
.cv-pad button { font-size: 18px; padding: 0; }
.cv-pad .cv-mid { font-size: 10px; line-height: 1.1; }
.cv-moverow { display: flex; gap: 12px; align-items: start; flex-wrap: wrap; }
.cv-side { display: grid; gap: 4px; }
.cv-presets { display: flex; flex-wrap: wrap; gap: 4px; }
.cv-presets button { font-size: 11px; }
.cv-map { width: 100%; height: 150px; background: #121214; border-radius: 6px; display: block; }
.cv-balloon { display: grid; gap: 4px; padding: 6px; background: var(--c-raised); border-radius: 6px; }
.cv-strip { border-top: 1px solid var(--c-line); padding: 6px 10px 10px; display: grid; gap: 6px; min-height: 0; }
.cv-strip-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.cv-strip-head b { font-size: 13px; }
.cv-strip-head .cv-k { color: var(--c-dim); font-size: 12px; margin-right: auto; }
.cv-cards { display: flex; gap: 10px; overflow-x: auto; padding: 4px 2px 6px; scroll-snap-type: x proximity; }
.cv-card { flex: 0 0 172px; background: #f4efe3; color: #111; border: 3px solid #111; border-radius: 3px; padding: 0; cursor: pointer; display: grid; text-align: left; scroll-snap-align: start; position: relative; }
.cv-root .cv-card { background: #f4efe3; color: #111; padding: 0; border-radius: 3px; }
.cv-root .cv-card:hover { background: #fffaf0; }
.cv-card.on { outline: 3px solid var(--c-accent); outline-offset: 2px; }
/* the picked panel keeps its own dark, readable words; only the outline is blue (Jeremy 2026-10-05) */
.cv-root .cv-card.on .cv-cap, .cv-root .cv-card.on .cv-focus { color: #111; }
.cv-root .cv-card.on .cv-how { color: #6a5d4c; }
.cv-card.now { outline: 3px solid var(--c-warm); outline-offset: 2px; }
.cv-card canvas { width: 100%; aspect-ratio: 16 / 9; display: block; border-bottom: 3px solid #111; background: #333; }
.cv-card .cv-cap { padding: 4px 7px 6px; font-size: 11px; line-height: 1.3; font-family: ${COMIC}; }
/* Jeremy 2026-10-05: each panel is titled with the force driving the scene, and labelled at the bottom with the
   2 (or 3) things holding the audience's attention, from Front and center (CurioFocusLane.panel). */
.cv-card .cv-force { display: block; padding: 3px 44px 3px 7px; background: #111; color: #fde68a; font: 700 11px/1.3 system-ui, sans-serif; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-card .cv-focus { display: block; padding: 3px 7px 4px; border-top: 2px solid #111; background: #e6dcc6; color: #2b2418; font: 600 10.5px/1.3 system-ui, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cv-card .cv-force:empty, .cv-card .cv-focus:empty { display: none; }
/* the words scroll inside the card (two fingers on a trackpad, or the wheel) */
.cv-root:not(.cv-comic) .cv-card .cv-cap { height: 4.1em; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
.cv-card .cv-num { position: absolute; top: 4px; right: 4px; background: #111; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 3px; font-family: system-ui; }
.cv-card .cv-how { display: block; color: #6a5d4c; font-family: system-ui; font-size: 10px; margin-top: 2px; }
.cv-addcard { flex: 0 0 120px; border: 2px dashed var(--c-line); background: transparent; color: var(--c-dim); border-radius: 6px; }
.cv-root.cv-comic .cv-main { display: none; }
.cv-root.cv-comic { grid-template-rows: auto minmax(0, 1fr); }
.cv-root.cv-comic .cv-strip { overflow: auto; background: #e9e1cf; border-top: 0; }
.cv-root.cv-comic .cv-strip-head { color: #111; }
.cv-root.cv-comic .cv-strip-head .cv-k { color: #5a5040; }
.cv-root.cv-comic .cv-strip-head button { background: #d8ceb8; color: #111; }
.cv-root.cv-comic .cv-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); overflow: visible; gap: 14px; padding: 6px 4px 30px; }
.cv-root.cv-comic .cv-card .cv-cap { font-size: 14px; }
.cv-root.cv-comic .cv-addcard { min-height: 120px; color: #5a5040; border-color: #b9ab8f; }
.cv-help { font-size: 12px; line-height: 1.45; color: var(--c-dim); background: #15181a; border-left: 3px solid var(--c-accent); padding: 6px 8px; border-radius: 4px; }
.cv-help b { color: var(--c-text); }
.cv-open-btn { font-weight: 600; }
@media (max-width: 1100px) { .cv-main { grid-template-columns: minmax(0, 1fr) 300px; } .cv-things { grid-column: 1 / -1; order: 3; display: flex; flex-wrap: wrap; } .cv-things h3 { width: 100%; } .cv-thing { width: auto; } }
@media (max-width: 760px) {
  .cv-root.cv-viewer { display: block; overflow: auto; }
  .cv-main { display: flex; flex-direction: column; padding: 6px 0; }
  .cv-pane, .cv-details, .cv-body, .cv-player { overflow: visible; }
  .cv-player { display: block; }
  .cv-stage { display: block; margin-bottom: 6px; }
  .cv-things { order: 3; }
  .cv-strip { padding: 6px 16px 16px; }
  .cv-root.cv-comic .cv-strip { min-height: 100vh; }
  .cv-bar { padding: 8px 16px; }
  .cv-card { flex-basis: 180px; }
}`;

  let root = null;
  let canvas = null;
  let picks = [];
  let lastC = null;
  let thumbsDirty = true;

  function build() {
    if (!document.getElementById("cv-style")) {
      const st = document.createElement("style");
      st.id = "cv-style";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    root = document.createElement("section");
    /* cv-viewer marks this as the Viewer's own root: other parts may use a .cv-root of their own (voice/voice.js's
       🎤 does), and the full-window layout below must never land on theirs (it turned it into a black page
       over the Screen and the app whenever the Viewer was closed). */
    root.className = "cv-root cv-viewer";
    root.setAttribute("aria-label", "Viewer");
    root.innerHTML = `
      <header class="cv-bar">
        <b class="cv-brand">Curiomatic</b>
        <span class="cv-title" contenteditable="true" spellcheck="false" title="The film's name. Click to change it."></span>
        <div class="cv-bar-r">
          <select data-k="look" title="The light of the whole film"><option value="dusk">Dusk light</option><option value="day">Daylight</option><option value="night">Night</option></select>
          <button type="button" data-act="undo" title="Undo (⌘Z)">Undo</button>
          <button type="button" data-act="redo" title="Redo (⇧⌘Z)">Redo</button>
          <button type="button" data-act="comic" title="See every panel big, like a comic book page">Read as a comic</button>
          <button type="button" data-act="sample" title="Throw away your changes and load the Episode 1 sample again">Start over</button>
          <span class="cv-views"><button type="button" data-act="views" aria-haspopup="true" aria-expanded="false" title="Open one part of the editor on its own, big and easy to read">Views ▾</button><span class="cv-views-menu" role="menu" hidden>
            <button type="button" data-view="lib" role="menuitem">Curiosity library<small>every curiosity, to add to your film</small></button>
            <button type="button" data-view="insp" role="menuitem">Details<small>everything about the curiosity you picked</small></button>
            <button type="button" data-view="momentum" role="menuitem">Momentum<small>what holds attention, and for how long</small></button>
            <button type="button" data-view="tl" role="menuitem">Timeline<small>a lane for each curiosity, to automate it</small></button>
          </span></span>
          <button type="button" data-act="close" title="The other pages: My film boards, Storyboard, the Workspaces and the Library. The Viewer button there brings you back.">More pages ▸</button>
        </div>
      </header>
      <div class="cv-main">
        <aside class="cv-pane cv-things" aria-label="In the scene"></aside>
        <section class="cv-pane cv-player" aria-label="Player">
          <div class="cv-stage"><div class="cv-wins"></div><input type="file" class="cv-vfile" accept="video/*" hidden /></div>
          <div class="cv-under" hidden></div>
          <div class="cv-transport">
            <button type="button" data-act="first" title="First panel">⏮</button>
            <button type="button" data-act="prev" title="Previous panel">◀</button>
            <button type="button" class="cv-primary cv-play" data-act="play" title="Play (space)">▶ Play</button>
            <button type="button" data-act="next" title="Next panel">▶</button>
            <span class="cv-time"></span>
            <input type="range" class="cv-scrub" min="0" max="1000" value="0" aria-label="Where in the film" />
            <button type="button" class="cv-wadd" data-act="addwin" title="Open another window next to your film, to watch an inspiration film side by side. Add as many as you like.">+ Window</button>
            <select data-k="winmode" title="How to see many windows: fit them all on screen, or keep one big and swipe its top edge to see the others"><option value="fit">Fit all windows on screen</option><option value="swipe">Keep size, swipe the top edge</option></select>
            <select data-k="speed" title="How fast it plays"><option value="0.5">½ speed</option><option value="1" selected>Normal speed</option><option value="2">2× speed</option></select>
            <label title="Start again at the end"><input type="checkbox" data-k="loop" checked /> Loop</label>
            <select data-k="afterstop" title="What happens when you press Pause"><option value="replay"${afterStop === "replay" ? " selected" : ""}>Pause: back to where I pressed Play</option><option value="advance"${afterStop === "advance" ? " selected" : ""}>Pause: stay where it stopped</option></select>
          </div>
        </section>
        <aside class="cv-pane cv-details" aria-label="Details">
          <nav class="cv-tabs">
            <button type="button" data-tab="move">Move it</button>
            <button type="button" data-tab="camera">Camera &amp; lens</button>
            <button type="button" data-tab="words">Words</button>${HOOK.tabs.map((t) => `<button type="button" data-tab="${t.id}">${t.label}</button>`).join("")}
          </nav>
          <div class="cv-body"></div>
        </aside>
      </div>
      <section class="cv-strip" aria-label="Storyboard">
        <div class="cv-strip-head">
          <b>Storyboard</b><span class="cv-k"></span>
          <button type="button" data-act="addpanel" title="A new panel after this one, starting as a copy of it">+ New panel</button>
          <button type="button" data-act="left" title="Move this panel earlier">◀ Earlier</button>
          <button type="button" data-act="right" title="Move this panel later">Later ▶</button>
          <button type="button" data-act="delpanel" title="Take this panel out">Delete panel</button>
        </div>
        <div class="cv-cards"></div>
      </section>`;
    document.body.appendChild(root);
    buildWins();
    root.querySelector(".cv-vfile").addEventListener("change", onVideoFile);
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onInput);
    root.querySelector(".cv-title").addEventListener("input", (e) => {
      remember("title");
      film.title = e.target.textContent.trim() || "My film";
      save();
    });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", () => draw());
    /* the stage changes size without a window resize too (the Front and center lane arrives a moment after the
       first picture): fit the windows again then, so the picture never jumps and drags use fresh coordinates */
    if (window.ResizeObserver) {
      let lastH = 0;
      let lastW = 0;
      new ResizeObserver((es) => {
        const r = es[0].contentRect;
        if (Math.abs(r.height - lastH) < 1 && Math.abs(r.width - lastW) < 1) return;
        lastH = r.height;
        lastW = r.width;
        requestAnimationFrame(() => draw());
      }).observe(root.querySelector(".cv-stage"));
    }
    root.querySelector(".cv-cards").addEventListener("dblclick", (e) => {
      const c = e.target.closest(".cv-card");
      if (!c) return;
      selectPanel(+c.dataset.i);
      setPlaying(true);
    });
  }

  /* ---------- drawing the page ---------- */
  function buildWins() {
    const box = root.querySelector(".cv-wins");
    W_EL.forEach((w) => w.video && w.video.pause());
    box.innerHTML = "";
    W_EL.length = 0;
    wins.forEach((id, i) => {
      const el = document.createElement("div");
      el.className = "cv-win";
      el.dataset.w = i;
      el.innerHTML = `<canvas class="cv-canvas" tabindex="0" aria-label="The picture. Drag a shape to move it. Drag empty space to swing the camera. Control-drag to slide around the world. Double-click to zoom in there. Scroll to go closer or farther."></canvas><video class="cv-video" muted playsinline loop hidden></video>
        <div class="cv-wtop" title="Drag left or right along the top edge to see your other open windows"><span class="cv-wdots">${wins.map((_, j) => `<i data-wshow="${j}" class="${j === shownWin ? "on" : ""}" title="Window ${j + 1}"></i>`).join("")}</span></div>
        <div class="cv-wtab" title="Drag left or right here, or use the arrows, to switch which film this window shows"><button type="button" data-wstep="-1" aria-label="Previous film">‹</button><button type="button" class="cv-wname" data-wmenu="${i}"></button><button type="button" data-wstep="1" aria-label="Next film">›</button><button type="button" class="cv-wplus" data-act="addwin" title="Add a window, to watch another film beside this one" aria-label="Add a window">+</button></div>
        ${i ? `<button type="button" class="cv-wclose" data-wclose="${i}" title="Close this window" aria-label="Close this window">×</button>` : ""}
        <div class="cv-wmenu" hidden></div>
        <div class="cv-hud"></div><button type="button" class="cv-wuse" data-wuse="${i}" title="Copy this film's camera (shot size, lens, fisheye, height, side, lean) onto the panel you are working on" hidden>Use this camera in my panel</button>`;
      box.appendChild(el);
      const w = { el, canvas: el.querySelector("canvas"), hud: el.querySelector(".cv-hud"), video: el.querySelector("video"), picks: [] };
      w.ctx = w.canvas.getContext("2d");
      const on = (fn) => (e) => {
        activeWin = i;
        canvas = w.canvas;
        picks = w.picks;
        fn(e);
      };
      w.canvas.addEventListener("pointerdown", on(onDown));
      w.canvas.addEventListener("pointermove", on(onMove));
      w.canvas.addEventListener("pointerup", on(onUp));
      w.canvas.addEventListener("pointercancel", on(onUp));
      w.canvas.addEventListener("wheel", on(onWheel), { passive: false });
      w.canvas.addEventListener("dblclick", on((e) => {
        if (wins[i] !== "mine") return;
        if (HOOK.tool && HOOK.tool.dbl && HOOK.tool.dbl(e)) return;
        zoomAt(e, e.shiftKey || e.altKey ? 2 : 0.5);
      }));
      w.canvas.addEventListener("contextmenu", (e) => wins[i] === "mine" && e.preventDefault());
      swipeable(el.querySelector(".cv-wtab"), i);
      topSwipe(el.querySelector(".cv-wtop"));
      W_EL.push(w);
    });
    root.querySelector(".cv-wins").dataset.mode = winMode;
    const ms = root.querySelector('[data-k="winmode"]');
    if (ms) {
      ms.value = winMode;
      ms.disabled = wins.length < 2;
    }
    canvas = W_EL[0].canvas;
    picks = W_EL[0].picks;
    root.querySelector(".cv-wins").dataset.n = wins.length;
  }
  /* In "swipe" mode, drag along a window's top edge to see the next or previous open window. */
  function topSwipe(bar) {
    let x0 = null;
    bar.addEventListener("pointerdown", (e) => {
      const d = e.target.closest("[data-wshow]");
      if (d) return showWin(+d.dataset.wshow);
      x0 = e.clientX;
      try {
        bar.setPointerCapture(e.pointerId);
      } catch (err) {}
    });
    bar.addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      /* one window per swipe, like turning a page */
      if (Math.abs(dx) > 40) {
        x0 = null;
        showWin(shownWin + (dx < 0 ? 1 : -1));
      }
    });
    const end = () => (x0 = null);
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
  }
  /* Swipe the corner tab left or right to switch which film the window shows. */
  function swipeable(tabEl, i) {
    let x0 = null;
    let moved = false;
    tabEl.addEventListener("pointerdown", (e) => {
      x0 = e.clientX;
      moved = false;
    });
    tabEl.addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 36) {
        if (!moved) {
          try {
            tabEl.setPointerCapture(e.pointerId);
          } catch (err) {}
        }
        moved = true;
        x0 = e.clientX;
        stepWin(i, dx < 0 ? 1 : -1);
      }
    });
    const end = () => {
      x0 = null;
      if (moved) {
        tabEl.dataset.swiped = "1";
        setTimeout(() => (tabEl.dataset.swiped = ""), 50);
      }
    };
    tabEl.addEventListener("pointerup", end);
    tabEl.addEventListener("pointercancel", end);
  }
  function stepWin(i, d) {
    const list = allFilms();
    const at = list.findIndex((f) => f.id === wins[i]);
    setWin(i, list[(at + d + list.length) % list.length].id, d);
  }
  function setWin(i, id, d) {
    wins[i] = id;
    saveWins();
    const w = W_EL[i];
    if (w) {
      w.el.classList.remove("cv-slide-l", "cv-slide-r");
      void w.el.offsetWidth;
      if (d) w.el.classList.add(d > 0 ? "cv-slide-l" : "cv-slide-r");
      w.el.querySelector(".cv-wmenu").hidden = true;
    }
    draw();
  }
  function addWin() {
    if (wins.length >= 8) return;
    const shown = new Set(wins);
    const next = INSP.find((f) => !shown.has(f.id)) || INSP[0];
    wins.push(next ? next.id : "mine");
    saveWins();
    shownWin = wins.length - 1;
    buildWins();
    if (winMode === "swipe") showWin(shownWin);
    draw();
  }
  function closeWin(i) {
    if (!i || i >= wins.length) return;
    wins.splice(i, 1);
    saveWins();
    buildWins();
    draw();
  }
  function winMenu(i) {
    const m = W_EL[i] && W_EL[i].el.querySelector(".cv-wmenu");
    if (!m) return;
    if (!m.hidden) return (m.hidden = true);
    m.innerHTML =
      allFilms()
        .map((f) => `<button type="button" data-wpick="${i}" data-film="${esc(f.id)}"${f.id === wins[i] ? ' class="on"' : ""}>${f.id === "mine" ? "My film" : (f.video ? "Video: " : "Inspiration: ") + esc(f.title)}</button>`)
        .join("") + `<button type="button" data-wvideo="${i}">+ Bring in a video from my computer…</button>`;
    m.hidden = false;
  }
  let videoFor = 0;
  function onVideoFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const id = "vid-" + Date.now().toString(36);
    INSP.push({ id, kind: "video", title: file.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(file) });
    setWin(videoFor, id, 1);
  }
  function layoutWins() {
    const stage = root.querySelector(".cv-stage");
    const r = stage.getBoundingClientRect();
    const swipe = winMode === "swipe" && W_EL.length > 1;
    if (shownWin >= W_EL.length) shownWin = 0;
    W_EL.forEach((w, i) => (w.el.hidden = swipe && i !== shownWin));
    const n = swipe ? 1 : W_EL.length;
    const gap = 6;
    const autoH = r.height < 60 || window.innerWidth <= 760;
    let best = { cols: 1, w: r.width };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      let w = (r.width - gap * (cols - 1)) / cols;
      if (!autoH) w = Math.min(w, (((r.height - gap * (rows - 1)) / rows) * 16) / 9);
      if (autoH && cols > (r.width < 560 ? 1 : 2)) break;
      if (w > best.w || cols === 1) best = { cols, w };
    }
    const box = root.querySelector(".cv-wins");
    box.style.gridTemplateColumns = `repeat(${best.cols}, ${Math.floor(best.w)}px)`;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W_EL.forEach((w) => {
      const W = Math.max(320, Math.round(best.w * dpr * (n > 2 ? 0.85 : 1)));
      const H = Math.round((W * 9) / 16);
      if (w.canvas.width !== W || w.canvas.height !== H) {
        w.canvas.width = W;
        w.canvas.height = H;
      }
      w.el.style.width = Math.floor(best.w) + "px";
      w.el.style.height = Math.floor((best.w * 9) / 16) + "px";
    });
  }
  function camLine(c) {
    return `${shotWords(c.shot)[0]} · ${heightWords(c.height)[0]} · ${Math.round(c.lens)}mm lens${c.fish > 0.05 ? " · fisheye " + Math.round(c.fish * 100) + "%" : ""}${Math.abs(c.tilt) >= 2 ? " · leaning" : ""}`;
  }
  function draw() {
    if (!root || root.hidden) return;
    layoutWins();
    let mineC = null;
    let st = null;
    W_EL.forEach((w, i) => {
      const f = filmFor(wins[i]);
      const mine = f === film;
      const list = allFilms();
      const at = list.findIndex((x) => x.id === wins[i]);
      w.el.classList.toggle("is-mine", mine);
      w.el.querySelector(".cv-wname").textContent = (mine ? "My film" : (f.kind === "video" ? "Video · " : "Inspiration · ") + f.title) + ` (${at + 1}/${list.length})`;
      w.el.querySelector(".cv-wuse").hidden = mine || f.kind === "video";
      if (f.kind === "video") {
        w.canvas.hidden = true;
        w.video.hidden = false;
        if (w.video.dataset.src !== f.url) {
          w.video.src = f.url;
          w.video.dataset.src = f.url;
        }
        if (playing && w.video.paused) w.video.play().catch(() => {});
        if (!playing) {
          w.video.pause();
          const d = w.video.duration;
          if (d && isFinite(d) && Math.abs(w.video.currentTime - (T % d)) > 0.08) w.video.currentTime = T % d;
        }
        w.hud.textContent = "Your video · plays only on this computer";
        return;
      }
      w.canvas.hidden = false;
      w.video.hidden = true;
      if (!w.video.paused) w.video.pause();
      w.picks.length = 0;
      withFilm(f, () => {
        const len = total();
        const s = stateAt(mine ? T : T % Math.max(0.001, len));
        const C = drawFrame(w.ctx, w.canvas.width, w.canvas.height, s, { talk: playing, sel: mine && !playing ? film.sel : null, picks: w.picks, top: (36 * w.canvas.width) / Math.max(1, w.el.clientWidth || w.canvas.width) });
        if (mine && !playing) HOOK.over.forEach((fn) => fn(w.ctx, C, s));
        if (mine && !mineC) mineC = C;
        if (mine && !st) st = s;
        w.hud.textContent = (mine ? "" : "Inspiration · ") + `Panel ${s.i + 1} of ${film.panels.length} · ` + camLine(s.cam);
        w.state = s;
      });
    });
    if (mineC) lastC = mineC;
    if (!st) st = stateAt(T);
    if (!lastC) lastC = makeCamera(st.cam, camTarget(st), 1600, 900);
    const tt = root.querySelector(".cv-time");
    tt.textContent = `${fmt(T)} / ${fmt(total())}`;
    const sc = root.querySelector(".cv-scrub");
    if (document.activeElement !== sc) sc.value = String(Math.round((T / Math.max(0.001, total())) * 1000));
    root.querySelectorAll(".cv-card").forEach((el) => {
      el.classList.toggle("now", playing && +el.dataset.i === st.i);
    });
    root.querySelector(".cv-wadd").disabled = wins.length >= 8;
    if (tab === "camera") drawMap();
    if (root.classList.contains("cv-comic") && playing) {
      const card = root.querySelector(`.cv-card[data-i="${st.i}"] canvas`);
      if (card) drawFrame(card.getContext("2d"), card.width, card.height, st, {});
    }
    HOOK.draw.forEach((fn) => {
      try {
        fn(T, st.i, total());
      } catch (e) {}
    });
  }
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const r = s - m * 60;
    return m + ":" + (r < 10 ? "0" : "") + r.toFixed(1);
  };

  function drawThings() {
    const box = root.querySelector(".cv-things");
    const p = film.panels[cur];
    box.innerHTML =
      `<h3>In the scene</h3>` +
      film.objects
        .map((o) => {
          const pl = p.place[o.id];
          return `<button type="button" class="cv-thing${o.id === film.sel ? " on" : ""}${pl && pl.show === false ? " off" : ""}" data-thing="${esc(o.id)}" title="${pl && pl.show === false ? "Hidden in this panel. " : ""}Click to pick it, then move it with the arrows or by dragging it in the picture."><span class="cv-dot" style="background:${esc(o.color)}"></span>${esc(o.name)}</button>`;
        })
        .join("") +
      `<h3>Add a shape</h3><div class="cv-addrow">${ADDABLE.map((k) => `<button type="button" data-addkind="${k}">+ ${KINDS[k].label}</button>`).join("")}</div>`;
    HOOK.things.forEach((fn) => fn(box));
  }

  function rng(k, label, min, max, stepv, val, say, ends) {
    return `<label class="cv-field"><span><b>${label}</b><em data-say="${k}">${esc(say || "")}</em></span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${stepv}" value="${val}" />${ends ? `<span class="cv-ends"><span>${ends[0]}</span><span>${ends[1]}</span></span>` : ""}</label>`;
  }
  function drawDetails() {
    root.querySelectorAll(".cv-tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    const body = root.querySelector(".cv-body");
    const p = film.panels[cur];
    if (tab === "move") body.innerHTML = moveHtml(p);
    else if (tab === "camera") body.innerHTML = cameraHtml(p);
    else if (HOOK.tabs.some((t) => t.id === tab)) {
      body.innerHTML = "";
      HOOK.tabs.find((t) => t.id === tab).render(body);
    } else body.innerHTML = wordsHtml(p);
    if (tab === "camera") drawMap();
  }
  function moveHtml(p) {
    const o = objById(film.sel);
    if (!o) return `<p class="cv-help">Click a shape in the picture, or a name on the left, to pick it. Then move it with the arrows here.</p>`;
    const pl = p.place[o.id];
    const camPos = lastC ? lastC.pos : [0, 2, 8];
    const isPerson = o.kind === "person";
    return `
      <div class="cv-row"><input type="text" data-k="name" value="${esc(o.name)}" aria-label="Name" style="flex:1" /><input type="color" data-k="color" value="${esc(o.color)}" title="Color" style="width:34px;height:26px;padding:0;border:0;background:none" /></div>
      <p class="cv-help">These changes are for <b>panel ${cur + 1}</b>. When the film plays, ${esc(o.name)} glides from where it stands here to where it stands in the next panel.</p>
      <h3>Move</h3>
      <div class="cv-moverow">
        <div class="cv-pad" role="group" aria-label="Move it">
          <button type="button" data-mv="-1,1" title="Up and left">↖</button><button type="button" data-mv="0,1" title="Up">↑</button><button type="button" data-mv="1,1" title="Up and right">↗</button>
          <button type="button" data-mv="-1,0" title="Left">←</button><button type="button" class="cv-mid" data-act="floor" title="Put it back down on the floor">on the floor</button><button type="button" data-mv="1,0" title="Right">→</button>
          <button type="button" data-mv="-1,-1" title="Down and left">↙</button><button type="button" data-mv="0,-1" title="Down">↓</button><button type="button" data-mv="1,-1" title="Down and right">↘</button>
        </div>
        <div class="cv-side">
          <small class="cv-say">Up and down on the arrows means:</small>
          <label><input type="radio" name="cv-up" data-k="upMeans" value="floor" ${upMeans === "floor" ? "checked" : ""}/> farther and nearer</label>
          <label><input type="radio" name="cv-up" data-k="upMeans" value="air" ${upMeans === "air" ? "checked" : ""}/> up in the air</label>
          <small class="cv-say">Each press moves it</small>
          <select data-k="step"><option value="0.1"${step === 0.1 ? " selected" : ""}>a little</option><option value="0.3"${step === 0.3 ? " selected" : ""}>a step</option><option value="1"${step === 1 ? " selected" : ""}>a lot</option></select>
        </div>
      </div>
      <small class="cv-say">Or drag it in the picture (hold Shift to lift it). Arrow keys work too.</small>
      <h3>Turn</h3>
      <div class="cv-row">
        <button type="button" data-turn="-15" title="Turn to its left">⟲ Turn</button><button type="button" data-turn="15" title="Turn to its right">Turn ⟳</button>
        <button type="button" data-act="face" title="Turn it so it looks straight at the camera">Face the camera</button>
        <button type="button" data-act="profile" title="Turn it sideways to the camera">Side on</button>
        <button type="button" data-act="away" title="Turn its back to the camera">Back to camera</button>
      </div>
      ${rng("turn", "Which way it faces", -180, 180, 1, Math.round(wrap180(pl.turn)), faceWords(o, pl, camPos))}
      ${rng("size", "Size", 0.2, 4, 0.05, pl.size || 1, (pl.size || 1).toFixed(2) + "×")}
      ${rng("lift", "Height off the floor", 0, 4, 0.05, pl.y, pl.y.toFixed(2) + " m")}
      ${isPerson ? `<label class="cv-field"><span><b>Pose</b></span><select data-k="pose">${POSES.map(([v, l]) => `<option value="${v}"${(pl.pose || "stand") === v ? " selected" : ""}>${l}</option>`).join("")}</select><small>Walking happens by itself when a person stands somewhere else in the next panel.</small></label>` : ""}
      <label><input type="checkbox" data-k="show" ${pl.show !== false ? "checked" : ""}/> Shown in this panel</label>
      <div class="cv-row"><small class="cv-say">Put it in this same spot in:</small><button type="button" data-act="spotnext">the next panel</button><button type="button" data-act="spotall">every panel</button></div>
      <div class="cv-row"><button type="button" data-act="aimhere" title="Point the camera at this">Point the camera at it</button><button type="button" data-act="delthing" title="Take it out of the whole film">Remove from the film</button></div>`;
  }
  function cameraHtml(p) {
    const c = p.cam;
    const aim = objById(c.aim);
    const aimTurn = aim ? p.place[aim.id].turn : 0;
    const sw = shotWords(c.shot);
    const lw = lensWords(c.lens);
    const hw = heightWords(c.height);
    return `
      <p class="cv-help">The camera for <b>panel ${cur + 1}</b>. Drag empty space in the picture to swing the camera around; scroll to go closer or farther.</p>
      <p class="cv-help"><b>Move yourself around:</b> hold Control and drag (or drag with the right mouse button) to slide through the world. <b>Double-click</b> a spot to zoom in there, like a map; Shift and double-click zooms out. Scroll to go closer or farther.</p>
      <div class="cv-row"><button type="button" data-act="unpan" title="Point the camera straight back at what it looks at"${(c.pan || [0, 0, 0]).some((v) => Math.abs(v) > 0.001) ? "" : " disabled"}>Back to the subject</button></div>
      <label class="cv-field"><span><b>Looks at</b></span><select data-k="aim">${film.objects.map((o) => `<option value="${esc(o.id)}"${o.id === c.aim ? " selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>
      <div class="cv-presets">
        <button type="button" data-preset="normal" title="A normal lens at eye level">Normal</button>
        <button type="button" data-preset="fisheye" title="A very wide lens that bends straight lines into curves">Fisheye</button>
        <button type="button" data-preset="more" title="A wider lens moved closer: near things grow, far things shrink">More foreshortening</button>
        <button type="button" data-preset="flat" title="A long lens from far away: space looks flat">Flat (long lens)</button>
        <button type="button" data-preset="worm" title="From the floor, looking up">Worm's eye</button>
        <button type="button" data-preset="bird" title="From straight above">Bird's eye</button>
        <button type="button" data-preset="dutch" title="The picture leans">Dutch angle</button>
      </div>
      ${rng("shot", "How much we see", 0, 100, 0.5, sliderFromShot(c.shot).toFixed(1), sw[0], ["the whole place", "one small thing"])}
      <small class="cv-say" data-sayl="shot">${sw[1]}</small>
      ${rng("fore", "Foreshortening", 0, 100, 0.5, sliderFromLens(c.lens).toFixed(1), lw[0] + " · " + Math.round(c.lens) + "mm", ["less (long lens, far away)", "more (wide lens, up close)"])}
      <small class="cv-say" data-sayl="fore">${lw[1]}. The subject stays the same size: the camera moves back or in to make up for the lens.</small>
      ${rng("fish", "Fisheye", 0, 100, 1, Math.round(c.fish * 100), Math.round(c.fish * 100) + "%", ["straight lines", "round, bent lines"])}
      <small class="cv-say">Bends straight lines into curves and squeezes more of the world in at the edges, like a door's peephole.</small>
      ${rng("height", "Camera height", -89, 89, 1, Math.round(c.height), hw[0], ["straight below, through the floor", "straight above"])}
      <small class="cv-say" data-sayl="height">${hw[1]}</small>
      ${rng("around", "Camera side", -180, 180, 1, Math.round(c.around), aroundWords(c.around - aimTurn), ["", ""])}
      ${rng("tilt", "Lean (turn the lens)", -180, 180, 1, Math.round(c.tilt), tiltWords(c.tilt), ["all the way round to the left", "all the way round to the right"])}
      <label class="cv-field"><span><b>Color filter</b></span><select data-k="filter">${Object.keys(FILTERS).map((k) => `<option value="${k}"${(c.filter || "none") === k ? " selected" : ""}>${FILTERS[k].label}</option>`).join("")}</select></label>
      ${rng("blur", "Background blur", 0, 100, 1, Math.round((c.blur || 0) * 100), blurWords(c.blur || 0), ["sharp all through", "only the subject is sharp"])}
      <small class="cv-say">Blurs everything behind what the camera points at, like a wide-open lens, so the subject stands out.</small>
      <label class="cv-field"><span><b>From this panel to the next</b></span><select data-k="move"><option value="cut"${c.move !== "glide" ? " selected" : ""}>Cut: jump to the next panel's camera</option><option value="glide"${c.move === "glide" ? " selected" : ""}>Glide: the camera moves smoothly into the next panel's camera</option></select></label>
      <h3>From above</h3>
      <canvas class="cv-map" width="600" height="300" aria-label="A map from above: the camera and what it sees"></canvas>
      <small class="cv-say">The map shows the scene from above: the cyan wedge is what the camera sees.</small>`;
  }
  function wordsHtml(p) {
    const people = film.objects;
    return `
      <p class="cv-help">Words for <b>panel ${cur + 1}</b>. Balloons point at whoever speaks. The yellow box is the narrator.</p>
      <label class="cv-field"><span><b>What happens</b></span><textarea data-k="note" rows="2" placeholder="What we see in this panel">${esc(p.note)}</textarea></label>
      <label class="cv-field"><span><b>Narrator box</b></span><textarea data-k="caption" rows="2" placeholder="Words in the yellow box (leave empty for none)">${esc(p.caption)}</textarea></label>
      <h3>Speech balloons</h3>
      ${p.words
        .map(
          (w, k) => `<div class="cv-balloon"><div class="cv-row"><select data-k="who" data-w="${k}">${people.map((o) => `<option value="${esc(o.id)}"${o.id === w.who ? " selected" : ""}>${esc(o.name)}</option>`).join("")}<option value=""${!w.who ? " selected" : ""}>Someone we can't see</option></select><button type="button" data-delword="${k}" title="Take this balloon out">✕</button></div><textarea data-k="text" data-w="${k}" rows="2">${esc(w.text)}</textarea>${window.CurioSpeech ? CurioSpeech.row(w, k) : ""}</div>`
        )
        .join("")}
      <button type="button" data-act="addword">+ Add a balloon</button>
      <label class="cv-field"><span><b>Seconds on screen</b><em>${p.sec.toFixed(2)} s</em></span><input type="number" data-k="sec" min="0.25" max="30" step="0.25" value="${p.sec}" /></label>
      <label class="cv-field"><span><b>Rain</b></span><select data-k="rain"><option value="fall"${p.rain === "fall" ? " selected" : ""}>Rain falling</option><option value="frozen"${p.rain === "frozen" ? " selected" : ""}>Rain frozen in the air</option><option value="none"${p.rain === "none" ? " selected" : ""}>No rain</option></select></label>`;
  }

  function drawMap() {
    const m = root && root.querySelector(".cv-map");
    if (!m || !lastC) return;
    const c = m.getContext("2d");
    const W = m.width;
    const H = m.height;
    const st = stateAt(T);
    c.fillStyle = "#121214";
    c.fillRect(0, 0, W, H);
    const tg = lastC.target;
    const span = Math.max(4, lastC.d * 1.4 + 2);
    const sc = Math.min(W, H) / (2 * span);
    const X = (x) => W / 2 + (x - tg[0]) * sc;
    const Z = (z) => H / 2 + (z - tg[2]) * sc;
    c.strokeStyle = "#222228";
    c.lineWidth = 1;
    for (let g = -30; g <= 30; g += 1.5) {
      c.beginPath();
      c.moveTo(X(g), 0);
      c.lineTo(X(g), H);
      c.moveTo(0, Z(g));
      c.lineTo(W, Z(g));
      c.stroke();
    }
    /* the view wedge */
    const cp = lastC.pos;
    const hf = Math.min(85, lensTh(lastC, lastC.W / 2 / lastC.F) / DEG);
    const yaw = Math.atan2(tg[0] - cp[0], tg[2] - cp[2]);
    const reach = span * 3;
    c.fillStyle = "rgba(34,211,238,0.14)";
    c.strokeStyle = "rgba(34,211,238,0.7)";
    c.beginPath();
    c.moveTo(X(cp[0]), Z(cp[2]));
    [-hf, hf].forEach((a) => {
      const t = yaw + a * DEG;
      c.lineTo(X(cp[0] + Math.sin(t) * reach), Z(cp[2] + Math.cos(t) * reach));
    });
    c.closePath();
    c.fill();
    c.stroke();
    film.objects.forEach((o) => {
      const p = st.place[o.id];
      if (!p || !p.show) return;
      const r = Math.max(3, (ringOf(o) || 0.4) * (p.size || 1) * sc * (o.kind === "building" ? 0.8 : 0.5));
      c.fillStyle = o.color;
      c.globalAlpha = o.id === film.sel ? 1 : 0.75;
      c.beginPath();
      c.arc(X(p.x), Z(p.z), r, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = o.id === film.sel ? "#22d3ee" : "#000";
      c.lineWidth = o.id === film.sel ? 2 : 1;
      c.stroke();
      const t = (p.turn || 0) * DEG;
      c.beginPath();
      c.moveTo(X(p.x), Z(p.z));
      c.lineTo(X(p.x + Math.sin(t) * r * 1.8 / sc), Z(p.z + Math.cos(t) * r * 1.8 / sc));
      c.strokeStyle = "#fff";
      c.stroke();
      if (sc > 18 || o.id === film.sel) {
        c.fillStyle = "#ccc";
        c.font = "18px system-ui";
        c.fillText(o.name, X(p.x) + r + 3, Z(p.z) + 5);
      }
    });
    c.fillStyle = "#22d3ee";
    c.beginPath();
    c.arc(X(cp[0]), Z(cp[2]), 7, 0, Math.PI * 2);
    c.fill();
    c.font = "bold 18px system-ui";
    c.fillText("camera", X(cp[0]) + 10, Z(cp[2]) - 8);
  }

  function drawStrip() {
    const box = root.querySelector(".cv-cards");
    const ps = film.panels;
    if (box.children.length !== ps.length + 1) {
      box.innerHTML =
        ps.map((p, i) => `<button type="button" class="cv-card" data-i="${i}"><span class="cv-force"></span><canvas width="480" height="270"></canvas><span class="cv-num"></span><span class="cv-cap"></span><span class="cv-focus"></span></button>`).join("") +
        `<button type="button" class="cv-addcard" data-act="addend">+ New panel<br/>at the end</button>`;
      thumbsDirty = true;
    }
    const s = starts();
    box.querySelectorAll(".cv-card").forEach((el, i) => {
      const p = ps[i];
      el.classList.toggle("on", i === cur);
      const num = el.querySelector(".cv-num");
      num.textContent = p.name ? `${i + 1} · ${p.name} · ${p.sec}s` : `${i + 1} · ${p.sec}s`;
      num.title = i === cur ? "Click to rename this panel" : p.name || "";
      el.querySelector(".cv-cap").innerHTML = `${esc(p.note || "(nothing written yet)")}<span class="cv-how">${esc(panelLine(p))}</span>`;
      const fl = window.CurioFocusLane && typeof window.CurioFocusLane.panel === "function" ? window.CurioFocusLane.panel(i) : null;
      const fe = el.querySelector(".cv-force");
      const fo = el.querySelector(".cv-focus");
      fe.textContent = (fl && fl.force) || "";
      fe.title = fl && fl.force ? `What drives the scene and the plot forward here: ${fl.force}` : "";
      fo.textContent = fl && fl.focus.length ? fl.focus.join(" + ") : "";
      fo.title = fl && fl.focus.length ? `What holds the audience's attention here: ${fl.focus.join(", ")}` : "";
      el.title = "Click to work on this panel. Double-click to play from here.";
      if (thumbsDirty || el.dataset.drawn !== JSON.stringify([p, film.objects, film.look])) {
        const cv = el.querySelector("canvas");
        drawFrame(cv.getContext("2d"), cv.width, cv.height, stateAt(s[i] + 1e-6), { rainT: 0.3 });
        el.dataset.drawn = JSON.stringify([p, film.objects, film.look]);
      }
    });
    thumbsDirty = false;
    root.querySelector(".cv-strip-head .cv-k").textContent = `${ps.length} panels · ${fmt(total())} · click a panel to change it, double-click to play from it`;
    root.querySelector('[data-act="left"]').disabled = cur === 0;
    root.querySelector('[data-act="right"]').disabled = cur >= ps.length - 1;
    root.querySelector('[data-act="delpanel"]').disabled = ps.length <= 1;
  }
  function drawBar() {
    const t = root.querySelector(".cv-title");
    if (document.activeElement !== t) t.textContent = film.title;
    root.querySelector('[data-k="look"]').value = film.look;
    root.querySelector('[data-act="undo"]').disabled = !undo.length;
    root.querySelector('[data-act="redo"]').disabled = !redo.length;
    root.querySelector('[data-act="comic"]').textContent = root.classList.contains("cv-comic") ? "Back to the viewer" : "Read as a comic";
    root.querySelector('[data-act="play"]').textContent = playing ? "❚❚ Pause" : "▶ Play";
  }
  function drawAll() {
    if (!root) return;
    drawBar();
    drawThings();
    drawDetails();
    drawStrip();
    draw();
  }
  /* After a change: save, redraw. full = rebuild the side panels too (not while a slider is being dragged). */
  function changed(full) {
    save();
    HOOK.change.forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
    if (full) drawAll();
    else {
      drawBar();
      drawStrip();
      draw();
      refreshSays();
    }
  }
  function refreshSays() {
    const p = film.panels[cur];
    const c = p.cam;
    const set = (k, v) => {
      const el = root.querySelector(`[data-say="${k}"]`);
      if (el) el.textContent = v;
    };
    const setl = (k, v) => {
      const el = root.querySelector(`[data-sayl="${k}"]`);
      if (el) el.textContent = v;
    };
    if (tab === "camera") {
      const aim = objById(c.aim);
      set("shot", shotWords(c.shot)[0]);
      setl("shot", shotWords(c.shot)[1]);
      set("fore", lensWords(c.lens)[0] + " · " + Math.round(c.lens) + "mm");
      setl("fore", lensWords(c.lens)[1] + ". The subject stays the same size: the camera moves back or in to make up for the lens.");
      set("fish", Math.round(c.fish * 100) + "%");
      set("height", heightWords(c.height)[0]);
      setl("height", heightWords(c.height)[1]);
      set("around", aroundWords(c.around - (aim ? p.place[aim.id].turn : 0)));
      set("tilt", tiltWords(c.tilt));
    }
    if (tab === "move") {
      const o = objById(film.sel);
      if (!o) return;
      const pl = p.place[o.id];
      set("turn", faceWords(o, pl, lastC ? lastC.pos : [0, 2, 8]));
      set("size", (pl.size || 1).toFixed(2) + "×");
      set("lift", pl.y.toFixed(2) + " m");
      const sl = root.querySelector('[data-k="turn"]');
      if (sl && document.activeElement !== sl) sl.value = String(Math.round(wrap180(pl.turn)));
      const ll = root.querySelector('[data-k="lift"]');
      if (ll && document.activeElement !== ll) ll.value = String(pl.y);
    }
  }

  /* ---------- actions ---------- */
  function selectPanel(i) {
    setPlaying(false);
    cur = clamp(i, 0, film.panels.length - 1);
    T = starts()[cur];
    drawAll();
    const el = root.querySelector(`.cv-card[data-i="${cur}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function atPanelStart() {
    /* Edits always change the selected panel's first moment, so the picture jumps there. */
    if (playing) setPlaying(false);
    const s = starts()[cur];
    if (Math.abs(T - s) > 1e-6) T = s;
  }
  function selPlace() {
    return film.panels[cur].place[film.sel];
  }
  function floorDirs() {
    const C = lastC || makeCamera(film.panels[cur].cam, [0, 1, 0], 1600, 900);
    let r = [C.right[0], 0, C.right[2]];
    if (len(r) < 1e-3) r = [1, 0, 0];
    r = norm(r);
    const f = [-r[2], 0, r[0]]; /* away from the camera on the floor */
    const ff = dot(f, C.fwd) < 0 && Math.abs(C.fwd[1]) < 0.99 ? mul(f, -1) : f;
    return { r, f: ff };
  }
  function nudge(dx, dy, big) {
    const pl = selPlace();
    if (!pl) return;
    atPanelStart();
    remember("nudge");
    const s = step * (big ? 3 : 1) * (dx && dy ? 0.7071 : 1);
    const { r, f } = floorDirs();
    pl.x += r[0] * dx * s;
    pl.z += r[2] * dx * s;
    if (upMeans === "air") pl.y = Math.max(0, pl.y + dy * s);
    else {
      pl.x += f[0] * dy * s;
      pl.z += f[2] * dy * s;
    }
    round(pl);
    changed(false);
  }
  function round(pl) {
    ["x", "y", "z"].forEach((k) => (pl[k] = Math.round(pl[k] * 1000) / 1000));
  }
  function faceCamera(id, offset) {
    film.sel = id || film.sel;
    const pl = selPlace();
    if (!pl) return;
    atPanelStart();
    draw();
    remember("face");
    const C = lastC;
    const toCam = Math.atan2(C.pos[0] - pl.x, C.pos[2] - pl.z) / DEG;
    pl.turn = Math.round(wrap180(toCam + (offset || 0)));
    changed(true);
  }
  function addThing(kind) {
    atPanelStart();
    remember("add");
    const k = KINDS[kind];
    const n = film.objects.filter((o) => o.kind === kind).length + 1;
    const id = kind + "-" + Date.now().toString(36);
    const name = k.label + (n > 1 ? " " + n : "");
    const o = { id, kind, name, color: k.color };
    if (kind === "building") Object.assign(o, { w: 5, h: 8, d: 4 });
    film.objects.push(o);
    const C = lastC;
    const tg = C ? C.target : [0, 0, 0];
    const { r } = floorDirs();
    const off = (film.objects.length % 3) - 1;
    const spot = { x: Math.round((tg[0] + r[0] * off * 0.9) * 100) / 100, y: 0, z: Math.round((tg[2] + r[2] * off * 0.9) * 100) / 100, turn: 0, size: 1, show: true, pose: "stand" };
    film.panels.forEach((p) => (p.place[id] = clone(spot)));
    film.sel = id;
    draw();
    const pl = selPlace();
    if (lastC) pl.turn = Math.round(Math.atan2(lastC.pos[0] - pl.x, lastC.pos[2] - pl.z) / DEG);
    film.panels.forEach((p) => (p.place[id].turn = pl.turn));
    tab = "move";
    thumbsDirty = true;
    changed(true);
  }
  const PRESETS = {
    normal: { lens: 35, fish: 0, height: 4, tilt: 0 },
    fisheye: { lens: 10, fish: 1, tilt: 0 },
    more: { lens: 14, fish: 0 },
    flat: { lens: 200, fish: 0 },
    worm: { height: -32, lens: 18 },
    bird: { height: 86, tilt: 0 },
    dutch: { tilt: 18 },
  };
  function playHooks() {
    HOOK.play.forEach((fn) => {
      try {
        fn(playing, T);
      } catch (e) {}
    });
  }
  function setPlaying(on) {
    if (on && T >= total() - 0.01) T = 0;
    const was = playing;
    playing = !!on;
    if (playing && !was) playFrom = T;
    if (was !== playing) playHooks();
    if (!playing) {
      const s = starts();
      const at = panelAt(T).i;
      if (Math.abs(T - s[at]) < 1e-6) cur = at;
    }
    if (root) drawBar();
    if (playing) {
      last = performance.now();
      requestAnimationFrame(tick);
    } else draw();
  }
  /* Play / Pause from the button or the space bar: pausing goes back to where Play was pressed unless
     "keep advancing" is chosen */
  function togglePlay() {
    if (!playing) return setPlaying(true);
    setPlaying(false);
    if (afterStop === "replay" && playFrom != null) {
      T = clamp(playFrom, 0, total());
      cur = panelAt(T).i;
      drawAll();
    }
  }
  let last = 0;
  function tick(now) {
    if (!playing || !root || root.hidden) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const before = panelAt(T).i;
    T += dt * speed;
    const st0 = film.panels[panelAt(Math.min(T, total() - 1e-6)).i];
    if (st0.rain === "fall") rainT += dt * speed;
    if (T >= total()) {
      if (loop) T = 0;
      else {
        T = total() - 1e-6;
        playing = false;
        drawBar();
        playHooks();
      }
    }
    const now2 = panelAt(T).i;
    if (now2 !== before) {
      if (root.classList.contains("cv-comic")) {
        /* the panel that just finished goes back to its still picture */
        const el = root.querySelector(`.cv-card[data-i="${before}"]`);
        if (el) el.dataset.drawn = "";
        thumbsDirty = false;
        drawStrip();
      }
      const el = root.querySelector(`.cv-card[data-i="${now2}"]`);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
    draw();
    if (playing) requestAnimationFrame(tick);
  }

  function onClick(e) {
    if (!e.target.closest(".cv-wmenu, .cv-wname")) root.querySelectorAll(".cv-wmenu").forEach((m) => (m.hidden = true));
    if (!e.target.closest(".cv-views")) viewsMenu(false);
    const b = e.target.closest("button, [data-thing]");
    if (!b || !root.contains(b)) return;
    const d = b.dataset;
    if (d.view && b.closest(".cv-views-menu")) return openView(d.view);
    if (d.tab) {
      tab = d.tab;
      drawDetails();
      return;
    }
    if (d.thing) {
      film.sel = d.thing;
      tab = "move";
      save();
      drawAll();
      return;
    }
    if (d.addkind) return addThing(d.addkind);
    if (d.wstep) {
      const i = +b.closest(".cv-win").dataset.w;
      return stepWin(i, +d.wstep);
    }
    if (d.wmenu) {
      if (b.closest(".cv-wtab").dataset.swiped === "1") return;
      return winMenu(+d.wmenu);
    }
    if (d.wpick) return setWin(+d.wpick, d.film, 0);
    if (d.wvideo) {
      videoFor = +d.wvideo;
      W_EL[videoFor].el.querySelector(".cv-wmenu").hidden = true;
      return root.querySelector(".cv-vfile").click();
    }
    if (d.wclose) return closeWin(+d.wclose);
    if (d.wuse) {
      const w = W_EL[+d.wuse];
      if (!w || !w.state) return;
      atPanelStart();
      remember("usecam");
      const c = w.state.cam;
      const mine = film.panels[cur].cam;
      ["shot", "lens", "fish", "height", "tilt"].forEach((k) => (mine[k] = Math.round(c[k] * 1000) / 1000));
      /* the side is measured from the subject's face, so it means the same thing in your scene */
      const theirAim = filmFor(wins[+d.wuse]).panels[w.state.i].place[c.aim || c.aimTo];
      const myAim = film.panels[cur].place[mine.aim];
      mine.around = Math.round(wrap180(c.around - (theirAim ? theirAim.turn : 0) + (myAim ? myAim.turn : 0)));
      tab = "camera";
      return changed(true);
    }
    if (d.mv) {
      const [x, y] = d.mv.split(",").map(Number);
      return nudge(x, y, e.shiftKey);
    }
    if (d.turn) {
      const pl = selPlace();
      if (!pl) return;
      atPanelStart();
      remember("turn");
      pl.turn = wrap180(pl.turn + +d.turn);
      return changed(false);
    }
    if (d.preset) {
      atPanelStart();
      remember("preset");
      Object.assign(film.panels[cur].cam, PRESETS[d.preset]);
      return changed(true);
    }
    if (d.delword) {
      remember("word");
      film.panels[cur].words.splice(+d.delword, 1);
      return changed(true);
    }
    if (b.classList.contains("cv-card")) return selectPanel(+d.i);
    const act = d.act;
    const p = film.panels[cur];
    switch (act) {
      case "play":
        return togglePlay();
      case "addwin":
        return addWin();
      case "unpan":
        atPanelStart();
        remember("unpan");
        p.cam.pan = [0, 0, 0];
        return changed(true);
      case "first":
        return selectPanel(0);
      case "prev":
        return selectPanel(Math.abs(T - starts()[cur]) > 0.05 && !playing ? cur : cur - 1);
      case "next":
        return selectPanel(panelAt(T).i + 1);
      case "close":
        return close();
      case "views":
        return viewsMenu();
      case "comic":
        root.classList.toggle("cv-comic");
        thumbsDirty = true;
        return drawAll();
      case "undo":
        return restore(undo, redo);
      case "redo":
        return restore(redo, undo);
      case "sample":
        if (b.dataset.armed !== "1") {
          b.dataset.armed = "1";
          b.textContent = "Press again to start over";
          setTimeout(() => {
            b.dataset.armed = "";
            b.textContent = "Start over";
          }, 3000);
          return;
        }
        remember("sample");
        film = sampleFilm();
        b.dataset.armed = "";
        b.textContent = "Start over";
        thumbsDirty = true;
        return selectPanel(0), changed(true);
      case "floor": {
        const pl = selPlace();
        if (!pl) return;
        atPanelStart();
        remember("floor");
        pl.y = 0;
        return changed(true);
      }
      case "face":
        return faceCamera();
      case "profile":
        return faceCamera(null, 90);
      case "away":
        return faceCamera(null, 180);
      case "spotnext":
      case "spotall": {
        const pl = selPlace();
        if (!pl) return;
        remember("spot");
        film.panels.forEach((q, i) => {
          if (act === "spotall" ? i !== cur : i === cur + 1) q.place[film.sel] = clone(pl);
        });
        thumbsDirty = true;
        return changed(true);
      }
      case "aimhere":
        atPanelStart();
        remember("aim");
        p.cam.aim = film.sel;
        p.cam.pan = [0, 0, 0];
        tab = "camera";
        return changed(true);
      case "delthing": {
        const o = objById(film.sel);
        if (!o) return;
        if (b.dataset.armed !== "1") {
          b.dataset.armed = "1";
          b.textContent = "Press again to remove " + o.name;
          return;
        }
        remember("del");
        film.objects = film.objects.filter((x) => x.id !== o.id);
        film.panels.forEach((q) => {
          delete q.place[o.id];
          if (q.cam.aim === o.id) q.cam.aim = film.objects[0] ? film.objects[0].id : null;
          q.words.forEach((w) => w.who === o.id && (w.who = ""));
        });
        film.sel = film.objects[0] ? film.objects[0].id : null;
        thumbsDirty = true;
        return changed(true);
      }
      case "addword":
        remember("word");
        p.words.push({ who: film.sel && objById(film.sel) && objById(film.sel).kind === "person" ? film.sel : (film.objects.find((o) => o.kind === "person") || {}).id || "", text: "Hello." });
        return changed(true);
      case "addpanel":
      case "addend": {
        remember("panel");
        const at = act === "addend" ? film.panels.length - 1 : cur;
        const q = clone(film.panels[at]);
        q.id = "p" + Date.now().toString(36);
        q.words = [];
        q.caption = "";
        q.note = "";
        film.panels.splice(at + 1, 0, q);
        cur = at + 1;
        T = starts()[cur];
        return changed(true);
      }
      case "delpanel":
        if (film.panels.length <= 1) return;
        remember("panel");
        film.panels.splice(cur, 1);
        cur = Math.min(cur, film.panels.length - 1);
        T = starts()[cur];
        return changed(true);
      case "left":
      case "right": {
        const j = cur + (act === "left" ? -1 : 1);
        if (j < 0 || j >= film.panels.length) return;
        remember("order");
        const [q] = film.panels.splice(cur, 1);
        film.panels.splice(j, 0, q);
        cur = j;
        T = starts()[cur];
        thumbsDirty = true;
        return changed(true);
      }
    }
  }

  function onInput(e) {
    const el = e.target;
    const k = el.dataset && el.dataset.k;
    if (!k) {
      if (el.classList.contains("cv-scrub")) {
        setPlaying(false);
        T = (+el.value / 1000) * total();
        const at = panelAt(T);
        if (at.i !== cur) {
          cur = at.i;
          drawThings();
          drawDetails();
          drawStrip();
        }
        draw();
      }
      return;
    }
    const p = film.panels[cur];
    const pl = selPlace();
    const o = objById(film.sel);
    const v = el.value;
    const live = e.type === "input";
    /* prefs, not part of the film */
    if (k === "speed") return (speed = +v);
    if (k === "winmode") return setWinMode(v);
    if (k === "loop") return (loop = el.checked);
    if (k === "afterstop") {
      afterStop = v === "advance" ? "advance" : "replay";
      try {
        localStorage.setItem(AFTERSTOP_KEY, afterStop);
      } catch (e) {}
      return;
    }
    if (k === "upMeans") return (upMeans = v);
    if (k === "step") return (step = +v);
    if (k === "look") {
      remember("look");
      film.look = v;
      thumbsDirty = true;
      return changed(false);
    }
    /* text: save as you type, keep the cursor where it is */
    if (["note", "caption", "text", "name"].includes(k) || (k === "who" && !live) || (k === "sec" && !live)) {
      if (live && (k === "who" || k === "sec")) return;
      remember(k + (el.dataset.w || ""));
      if (k === "note") p.note = v;
      if (k === "caption") p.caption = v;
      if (k === "text") p.words[+el.dataset.w].text = v;
      if (k === "who") p.words[+el.dataset.w].who = v;
      if (k === "name" && o) {
        o.name = v || KINDS[o.kind].label;
        drawThings();
      }
      if (k === "sec") {
        p.sec = clamp(+v || 2, 0.25, 30);
        T = starts()[cur];
      }
      return changed(false);
    }
    if (live && ["aim", "move", "rain", "pose"].includes(k)) return;
    atPanelStart();
    remember(k);
    switch (k) {
      case "color":
        if (o) o.color = v;
        thumbsDirty = true;
        drawThings();
        break;
      case "turn":
        if (pl) pl.turn = +v;
        break;
      case "size":
        if (pl) pl.size = +v;
        break;
      case "lift":
        if (pl) pl.y = +v;
        break;
      case "pose":
        if (pl) pl.pose = v;
        break;
      case "show":
        if (pl) pl.show = el.checked;
        drawThings();
        break;
      case "aim":
        p.cam.aim = v;
        p.cam.pan = [0, 0, 0];
        break;
      case "shot":
        p.cam.shot = Math.round(shotFromSlider(+v) * 1000) / 1000;
        break;
      case "fore":
        p.cam.lens = Math.round(lensFromSlider(+v) * 10) / 10;
        break;
      case "fish":
        p.cam.fish = +v / 100;
        break;
      case "height":
        p.cam.height = +v;
        break;
      case "around":
        p.cam.around = +v;
        break;
      case "tilt":
        p.cam.tilt = +v;
        break;
      case "filter":
        p.cam.filter = v;
        break;
      case "blur":
        p.cam.blur = +v / 100;
        break;
      case "move":
        p.cam.move = v;
        break;
      case "rain":
        p.rain = v;
        break;
    }
    changed(!live && ["aim", "move", "pose", "show", "rain"].includes(k));
  }

  /* ---------- the mouse in the picture ---------- */
  let drag = null;
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * canvas.width, ((e.clientY - r.top) / r.height) * canvas.height];
  }
  function inside(pt, s) {
    let c = false;
    for (let i = 0, j = s.length - 1; i < s.length; j = i++) {
      if (s[i][1] > pt[1] !== s[j][1] > pt[1] && pt[0] < ((s[j][0] - s[i][0]) * (pt[1] - s[i][1])) / (s[j][1] - s[i][1]) + s[i][0]) c = !c;
    }
    return c;
  }
  function pickAt(e) {
    const pt = canvasPoint(e);
    for (let i = picks.length - 1; i >= 0; i--) if (inside(pt, picks[i].s)) return picks[i].obj;
    return null;
  }
  /* Double-click a spot: the view glides there and zooms in, like a map (Shift or Alt zooms out). */
  let zoomAnim = 0;
  function zoomAt(e, factor) {
    atPanelStart();
    const st = stateAt(T);
    const C = makeCamera(st.cam, camTarget(st), canvas.width, canvas.height);
    const pt = canvasPoint(e);
    const hit = pickAt(e);
    let P;
    if (hit && st.place[hit]) {
      P = aimPoint(hit, st.place);
    } else {
      const dir = unproject(C, pt[0], pt[1]);
      P = dir[1] < -0.02 ? add(C.pos, mul(dir, -C.pos[1] / dir[1])) : add(C.pos, mul(dir, C.d));
      if (len(sub(P, C.pos)) > 60) P = add(C.pos, mul(dir, 60));
    }
    const c = film.panels[cur].cam;
    const base = aimPoint(c.aim, st.place);
    remember("zoom");
    const from = { pan: (c.pan || [0, 0, 0]).slice(), shot: c.shot };
    const to = { pan: factor < 1 ? sub(P, base) : from.pan, shot: clamp(c.shot * factor, 0.08, 15) };
    const t0 = performance.now();
    const id = ++zoomAnim;
    const stepZ = (now) => {
      if (id !== zoomAnim) return;
      const u = ease(clamp((now - t0) / 380, 0, 1));
      c.pan = from.pan.map((v, k) => Math.round(lerp(v, to.pan[k], u) * 1000) / 1000);
      c.shot = Math.round(Math.exp(lerp(Math.log(from.shot), Math.log(to.shot), u)) * 1000) / 1000;
      if (u < 1) {
        draw();
        requestAnimationFrame(stepZ);
      } else changed(tab === "camera");
    };
    requestAnimationFrame(stepZ);
  }
  function onDown(e) {
    if (e.button > 2) return;
    if (wins[activeWin] !== "mine") return;
    if (playing) setPlaying(false);
    const took = HOOK.tool && HOOK.tool.down ? HOOK.tool.down(e) : false;
    if (took === "orbit") {
      /* the tool picked a thing on this click; dragging swings the camera */
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("dragging");
      atPanelStart();
      remember("orbit");
      drag = { kind: "orbit", last: canvasPoint(e) };
      return;
    }
    if (took) {
      drag = { kind: "tool" };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.button === 1 || e.button === 2) {
      /* Control-drag (or right-drag, or middle-drag): slide yourself around the world */
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("dragging");
      atPanelStart();
      remember("pan");
      drag = { kind: "pan", last: canvasPoint(e) };
      return;
    }
    const hit = pickAt(e);
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    atPanelStart();
    if (hit && hit !== film.sel) {
      /* the first click picks it; a drag from there looks around. Drag it again to move it. */
      film.sel = hit;
      remember("orbit");
      drag = { kind: "orbit", last: canvasPoint(e) };
      drawThings();
      if (tab === "move") drawDetails();
    } else if (hit) {
      film.sel = hit;
      remember("drag");
      drag = { kind: "thing", last: canvasPoint(e), lift: e.shiftKey };
      drawThings();
      if (tab === "move") drawDetails();
    } else {
      remember("orbit");
      drag = { kind: "orbit", last: canvasPoint(e) };
    }
    draw();
  }
  function onMove(e) {
    if (HOOK.tool && HOOK.tool.hover && (!drag || drag.kind === "tool")) HOOK.tool.hover(e, !!drag);
    if (!drag) return;
    if (drag.kind === "tool") return HOOK.tool && HOOK.tool.move && HOOK.tool.move(e);
    const pt = canvasPoint(e);
    const dx = pt[0] - drag.last[0];
    const dy = pt[1] - drag.last[1];
    drag.last = pt;
    const p = film.panels[cur];
    if (drag.kind === "pan") {
      const C = lastC;
      if (!C) return;
      const mpp = (p.cam.shot || 2) / canvas.height;
      const { r, f } = floorDirs();
      const pitch = Math.max(0.25, Math.sin(Math.abs(clamp(p.cam.height, -70, 89)) * DEG));
      const pan = (p.cam.pan = (p.cam.pan || [0, 0, 0]).slice());
      const fx = (dy * mpp) / pitch;
      pan[0] += -r[0] * dx * mpp + f[0] * fx;
      pan[2] += -r[2] * dx * mpp + f[2] * fx;
      p.cam.pan = pan.map((v) => Math.round(v * 1000) / 1000);
      return changed(false);
    }
    if (drag.kind === "orbit") {
      p.cam.around = Math.round(wrap180(p.cam.around - (dx / canvas.width) * 220) * 10) / 10;
      p.cam.height = Math.round(clamp(p.cam.height + (dy / canvas.height) * 120, -89, 89) * 10) / 10;
    } else {
      const pl = selPlace();
      if (!pl || !lastC) return;
      const C = lastC;
      const base = [pl.x, pl.y, pl.z];
      const p0 = project(C, base);
      if (!p0) return;
      if (drag.lift || e.shiftKey) {
        const py = project(C, add(base, [0, 0.1, 0]));
        if (py) {
          const ly = py[1] - p0[1];
          if (Math.abs(ly) > 0.01) pl.y = Math.max(0, pl.y + (dy / ly) * 0.1);
        }
      } else {
        const { r, f } = floorDirs();
        const px = project(C, add(base, mul(r, 0.1)));
        const pz = project(C, add(base, mul(f, 0.1)));
        if (px && pz) {
          const a = [px[0] - p0[0], px[1] - p0[1]];
          const b = [pz[0] - p0[0], pz[1] - p0[1]];
          const det = a[0] * b[1] - a[1] * b[0];
          if (Math.abs(det) > 1e-6) {
            let u = (dx * b[1] - dy * b[0]) / det;
            let w = (a[0] * dy - a[1] * dx) / det;
            const lim = 30;
            u = clamp(u, -lim, lim);
            w = clamp(w, -lim, lim);
            pl.x += (r[0] * u + f[0] * w) * 0.1;
            pl.z += (r[2] * u + f[2] * w) * 0.1;
          }
        }
      }
      round(pl);
    }
    changed(false);
  }
  function onUp(e) {
    if (!drag) return;
    if (drag.kind === "tool") {
      drag = null;
      if (HOOK.tool && HOOK.tool.up) HOOK.tool.up(e);
      return;
    }
    drag = null;
    canvas.classList.remove("dragging");
    drawDetails();
    drawStrip();
  }
  function onWheel(e) {
    if (wins[activeWin] !== "mine") return;
    e.preventDefault();
    atPanelStart();
    remember("wheel");
    const c = film.panels[cur].cam;
    c.shot = Math.round(clamp(c.shot * Math.exp(e.deltaY * 0.0015), 0.08, 15) * 1000) / 1000;
    changed(false);
    if (tab === "camera") {
      const s = root.querySelector('[data-k="shot"]');
      if (s) s.value = sliderFromShot(c.shot).toFixed(1);
    }
  }
  function onKey(e) {
    if (!root || root.hidden) return;
    const t = e.target;
    /* the space bar plays and stops even after picking from a menu (Jeremy 2026-10-05): a menu or a slider keeps
       its own keys, but not the space bar */
    const spaceOk = e.key === " " && t && (t.tagName === "SELECT" || (t.tagName === "INPUT" && /^(range|checkbox|radio|button)$/.test(t.type)));
    if (spaceOk && t.blur) t.blur();
    const typing = !spaceOk && t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === "z" || e.key === "Z")) {
      if (typing && t.tagName !== "INPUT") return;
      if (typing && t.type !== "range") return;
      e.preventDefault();
      return e.shiftKey ? restore(redo, undo) : restore(undo, redo);
    }
    if (!typing && HOOK.keys.some((fn) => fn(e))) return;
    if (typing || mod || e.altKey) return;
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (arrows[e.key] && film.sel) {
      e.preventDefault();
      return nudge(arrows[e.key][0], arrows[e.key][1], e.shiftKey);
    }
    if (e.key === " ") {
      e.preventDefault();
      return togglePlay();
    }
    if (e.key === "q" || e.key === "e") {
      const pl = selPlace();
      if (!pl) return;
      atPanelStart();
      remember("turn");
      pl.turn = wrap180(pl.turn + (e.key === "q" ? -15 : 15));
      return changed(false);
    }
    if (e.key === "f") return faceCamera();
    if (e.key === "Escape" && root.classList.contains("cv-comic")) {
      root.classList.remove("cv-comic");
      thumbsDirty = true;
      drawAll();
    }
  }

  /* ---------- into the app ---------- */
  function open() {
    if (!root) build();
    root.hidden = false;
    document.documentElement.classList.add("cv-open");
    T = starts()[cur] || 0;
    drawAll();
    /* the layout settles after fonts and the first paint */
    requestAnimationFrame(() => draw());
  }
  /* Views ▾ (Jeremy 2026-10-05): the full editor showed every part at once and was too hard to read, so each of
     its parts opens on its own instead, big, with a way back here (CurioScreen.solo in screen/ui.js). */
  function viewsMenu(show) {
    const m = root && root.querySelector(".cv-views-menu");
    if (!m) return;
    const on = show === undefined ? m.hidden : !!show;
    m.hidden = !on;
    const b = root.querySelector('[data-act="views"]');
    if (b) b.setAttribute("aria-expanded", String(on));
  }
  function openView(part) {
    viewsMenu(false);
    const S = window.CurioScreen;
    if (!S || typeof S.solo !== "function") return;
    close();
    S.solo(part);
  }
  function close() {
    setPlaying(false);
    if (root) root.hidden = true;
    document.documentElement.classList.remove("cv-open");
    addReturnButtons();
  }
  function viewerButton(cls) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.viewer = "open";
    b.className = cls;
    b.title = "The Viewer: the picture of your film, the comic strip, and plain controls to move things and change the lens";
    b.textContent = "Viewer";
    b.addEventListener("click", open);
    return b;
  }
  function addReturnButtons() {
    const top = document.querySelector(".tabs-top");
    if (top && !top.querySelector(":scope > [data-viewer]")) top.insertBefore(viewerButton("cv-open-btn"), top.firstChild);
    const lm = document.getElementById("lib-menu");
    if (lm && !lm.querySelector("[data-viewer]")) {
      /* on a phone the top row has no room for Viewer, so Library carries it there */
      const b = viewerButton("phone-only");
      b.innerHTML = "Viewer<small>the picture of your film and the comic strip</small>";
      b.addEventListener("click", () => {
        lm.hidden = true;
        const lb = document.getElementById("lib-btn");
        if (lb) lb.setAttribute("aria-expanded", "false");
      });
      lm.insertBefore(b, lm.firstChild);
    }
    const bar = document.querySelector(".sc-page .sc-bar");
    if (bar && !bar.querySelector("[data-viewer]")) {
      const b = viewerButton("cv-open-btn");
      b.style.cssText = "background:#22d3ee;color:#062a31;font-weight:600";
      bar.insertBefore(b, bar.firstChild);
    }
  }
  function wire() {
    addReturnButtons();
    let skip = false;
    try {
      const q = location.search;
      skip = /[?&]viewer=0\b/.test(q) || (!!navigator.webdriver && !/[?&]viewer=1\b/.test(q));
    } catch (e) {}
    if (!skip) setTimeout(open, 0);
    /* the Screen builds its bar when it first opens: give it a Viewer button too */
    setTimeout(addReturnButtons, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioViewer = {
    open,
    close,
    isOpen: () => !!(root && !root.hidden),
    film: () => clone(film),
    setFilm: (f) => {
      remember("set");
      film = fixFilm(clone(f));
      cur = 0;
      T = 0;
      thumbsDirty = true;
      changed(true);
    },
    sample: sampleFilm,
    panel: () => cur,
    select: (i) => selectPanel(i),
    pick: (id) => {
      if (objById(id)) {
        film.sel = id;
        if (root) drawAll();
      }
    },
    nudge: (dx, dy) => nudge(dx, dy, false),
    faceCamera: () => faceCamera(),
    setCamera: (patch) => {
      atPanelStart();
      remember("api");
      Object.assign(film.panels[cur].cam, patch);
      changed(true);
    },
    play: (on) => setPlaying(on !== false),
    togglePlay: () => togglePlay(),
    time: (t) => {
      if (t !== undefined) {
        T = clamp(+t, 0, total());
        draw();
      }
      return T;
    },
    /* Draw any moment into your own canvas: render(canvas, seconds). */
    render: (cv, t) => drawFrame(cv.getContext("2d"), cv.width, cv.height, stateAt(clamp(t || 0, 0, total())), {}),
    project: (camera, target, W, H, p) => project(makeCamera(camera, target, W, H), p),
    words: { shot: shotWords, lens: lensWords, height: heightWords },
    undo: () => restore(undo, redo),
    key: KEY,
    /* ---- for add-ons (viewer/build.js) ---- */
    makers: MAKERS,
    /* limbs(pose, phase): the limb angles a pose gives at a moment (see limbsOf) */
    limbs: (pose, phase) => limbsOf(pose || "stand", phase || 0),
    kinds: KINDS,
    addTab: (t) => {
      if (!HOOK.tabs.some((x) => x.id === t.id)) HOOK.tabs.push(t);
      if (root) {
        const nav = root.querySelector(".cv-tabs");
        if (nav && !nav.querySelector(`[data-tab="${t.id}"]`)) nav.insertAdjacentHTML("beforeend", `<button type="button" data-tab="${t.id}">${t.label}</button>`);
      }
    },
    setTool: (tool) => {
      HOOK.tool = tool || null;
      W_EL.forEach((w) => w.canvas.classList.toggle("cv-tooling", !!tool));
    },
    onOverlay: (fn) => HOOK.over.push(fn),
    onThings: (fn) => HOOK.things.push(fn),
    onKey: (fn) => HOOK.keys.push(fn),
    /* onParts(fn(parts, def, place, phase) -> parts): change a thing's parts as it is drawn */
    onParts: (fn) => HOOK.parts.push(fn),
    /* addPose(id, label, fn(phase) -> {legA, legB, armA, armB, wave}, keep): a new pose for people; keep = it is
       not swapped for walking while the person moves (running, swimming) */
    addPose: (id, label, fn, keep) => {
      POSE_FX[id] = { fn, keep: !!keep };
      if (!POSES.some((p) => p[0] === id)) POSES.push([id, label]);
    },
    /* the strip under the picture (viewer/focus-lane.js): onDraw(fn(seconds, panel, total)) runs on every
       drawn frame, onChange(fn) after every edit; under() is the box under the picture; seek(seconds) */
    onDraw: (fn) => HOOK.draw.push(fn),
    /* onPose(fn(panel, u, place, cam) -> { pos, target, roll, lens } or null): fly the camera (viewer/flight.js) */
    onPose: (fn) => HOOK.pose.push(fn),
    aimPoint: (id, place) => aimPoint(id, place),
    stateAt: (t) => stateAt(clamp(+t || 0, 0, total())),
    starts: () => starts(),
    onChange: (fn) => HOOK.change.push(fn),
    /* onPlay(fn(on, seconds)): told when playing starts or stops; playing() says which */
    onPlay: (fn) => HOOK.play.push(fn),
    /* remember(tag): put the film as it is now on the undo list, without moving the playhead (for changes
       that aren't about a panel, like the Viewer's border sizes in film.view) */
    remember: (tag) => remember(tag),
    playing: () => playing,
    under: () => (root ? root.querySelector(".cv-under") : null),
    seek: (t) => selectPanel(panelAt(clamp(Number(t) || 0, 0, total())).i),
    /* the live film and helpers; change the film, then call changed() */
    live: () => ({
      film,
      cur,
      panel: film.panels[cur],
      C: lastC,
      canvas,
      picks,
      tab,
      state: stateAt(T),
    }),
    showTab: (id) => {
      tab = id;
      if (root) drawDetails();
    },
    edit: (tag) => {
      atPanelStart();
      remember(tag || "edit");
    },
    changed: (full) => {
      thumbsDirty = true;
      changed(full);
    },
    redraw: () => draw(),
    canvasPoint: (e) => canvasPoint(e),
    pickAt: (e) => {
      const pt = canvasPoint(e);
      for (let i = picks.length - 1; i >= 0; i--) if (inside(pt, picks[i].s)) return picks[i];
      return null;
    },
    ray: (e) => {
      const C = lastC;
      if (!C) return null;
      const pt = canvasPoint(e);
      return { from: C.pos, dir: unproject(C, pt[0], pt[1]), C };
    },
    projectNow: (p) => (lastC ? project(lastC, p) : null),
    floorDirs: () => floorDirs(),
    faces: (o, place) => thingFaces(o, place, 0),
    tool: () => HOOK.tool,
  };
})();
