/* The object catalog for the Viewer: things to put in a shot, sorted by world, place and type.
   window.CurioObjects = { WORLDS, PLACES, TYPES, items, find(id), search(text, {world, place, type}) }.
   Each item draws itself from parts in local metres (y up, stands on y=0, front faces +z); parts(d) uses
   d.color for its main color so a person can recolor it. People carry `person` instead of parts. */
(function () {
  "use strict";
  const WORLDS = ["Household", "City", "Country", "Water", "Sky"];
  const PLACES = {
    Household: ["Kitchen", "Living room", "Bedroom", "Bathroom", "Garage", "Yard", "Office"],
    City: ["Street", "Park", "Shops", "Building site", "Station", "Rooftops"],
    Country: ["Forest", "Farm", "Field", "Mountain", "Campsite", "Road"],
    Water: ["Lake", "River", "Sea", "Beach", "Harbor", "Underwater"],
    Sky: ["Low sky", "High sky", "Night sky"],
  };
  const TYPES = ["People", "Animals", "Vehicles", "Furniture", "Nature", "Buildings", "Things", "Signs & street"];
  const SHAPES = ["box", "ball", "cone", "cyl", "wedge", "quad", "flat"];

  /* ---------- colors ---------- */
  const DK = "#22252b", BK = "#16171a", WD = "#8a5a34", MT = "#9aa0a8", GL = "#9fc6d9", WH = "#f2f2ee";
  const LT = "#fff1b8", RD = "#c0302a", LEAF = "#3f8f4f", BARK = "#6b4a2f", EYE = "#15110e";
  function shade(hex, k) {
    const n = parseInt(String(hex || "#888888").slice(1, 7), 16) || 0;
    const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
  }

  /* ---------- part makers ---------- */
  const box = (w, h, d, x, y, z, color, o) => Object.assign({ box: [w, h, d], at: [x, y, z], color }, o);
  const ball = (r, x, y, z, color, o) => Object.assign({ ball: r, at: [x, y, z], color }, o);
  const cone = (r, h, x, y, z, color, o) => Object.assign({ cone: [r, h], at: [x, y, z], color }, o);
  const cyl = (r, h, x, y, z, color, o) => Object.assign({ cyl: [r, h], at: [x, y, z], color }, o);
  const wedge = (w, h, d, x, y, z, color, o) => Object.assign({ wedge: [w, h, d], at: [x, y, z], color }, o);
  const quad = (w, h, x, y, z, color, o) => Object.assign({ quad: [w, h], at: [x, y, z], color }, o);
  const flat = (w, d, x, y, z, color, o) => Object.assign({ flat: [w, d], at: [x, y, z], color }, o);
  /* lying cylinders centred at (x,y,z): along x (wheels, logs) and along z (planes, blimps) */
  const cylX = (r, len, x, y, z, color, o) => cyl(r, len, x, y - len / 2, z, color, Object.assign({ rz: 90, pivot: [x, y, z] }, o));
  const cylZ = (r, len, x, y, z, color, o) => cyl(r, len, x, y - len / 2, z, color, Object.assign({ rx: 90, pivot: [x, y, z] }, o));
  const wheel = (x, z, r, w) => cylX(r, w || 0.22, x, r, z, BK);
  const eyes = (sep, s, y, z) => [box(s, s, s * 0.4, -sep, y, z, EYE), box(s, s, s * 0.4, sep, y, z, EYE)];
  const corners = (w, d, fn) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => fn((a * w) / 2, (b * d) / 2));
  const legs = (w, d, h, t, c) => corners(w - t, d - t, (x, z) => box(t, h, t, x, h / 2, z, c));
  /* scale a whole part list (design at unit size, then size to the real thing) */
  function scale(P, k, lift) {
    return P.map((p) => {
      const q = Object.assign({}, p);
      SHAPES.forEach((s) => s in q && (q[s] = typeof q[s] === "number" ? q[s] * k : q[s].map((v) => v * k)));
      q.at = [q.at[0] * k, q.at[1] * k + (lift || 0), q.at[2] * k];
      if (q.pivot) q.pivot = [q.pivot[0] * k, q.pivot[1] * k + (lift || 0), q.pivot[2] * k];
      return q;
    });
  }
  const move = (P, x, y, z) => P.map((p) => Object.assign({}, p, { at: [p.at[0] + x, p.at[1] + y, p.at[2] + z] }, p.pivot ? { pivot: [p.pivot[0] + x, p.pivot[1] + y, p.pivot[2] + z] } : {}));

  /* ---------- builders ---------- */
  function table(w, d, h, c, top) {
    return [box(w, 0.04, d, 0, h - 0.02, 0, top || c), ...legs(w - 0.04, d - 0.04, h - 0.04, 0.05, c)];
  }
  function chair(c, h) {
    h = h || 0.45;
    return [box(0.44, 0.05, 0.44, 0, h, 0, c), ...legs(0.44, 0.44, h - 0.02, 0.04, shade(c, -0.2)), box(0.44, 0.46, 0.05, 0, h + 0.25, -0.2, c)];
  }
  function sofa(c, w) {
    const cu = shade(c, 0.15);
    const P = [box(w, 0.25, 0.85, 0, 0.2, 0, c), box(w, 0.5, 0.2, 0, 0.6, -0.33, c), box(0.18, 0.6, 0.85, -w / 2 + 0.09, 0.3, 0, c), box(0.18, 0.6, 0.85, w / 2 - 0.09, 0.3, 0, c)];
    const n = Math.max(1, Math.round((w - 0.36) / 0.6));
    for (let i = 0; i < n; i++) P.push(box((w - 0.38) / n - 0.02, 0.12, 0.6, -w / 2 + 0.19 + ((w - 0.38) / n) * (i + 0.5), 0.38, 0.08, cu));
    return P.concat(legs(w - 0.1, 0.75, 0.08, 0.05, DK));
  }
  function cabinet(w, h, d, c, doors, drawers) {
    const P = [box(w, h, d, 0, h / 2, 0, c)];
    const line = shade(c, -0.25);
    for (let i = 0; i < (doors || 0); i++) {
      const x = -w / 2 + (w / doors) * (i + 0.5);
      P.push(quad(w / doors - 0.04, h - 0.1, x, h / 2, d / 2 + 0.005, shade(c, 0.08)), box(0.02, 0.12, 0.03, x + (i % 2 ? -1 : 1) * (w / doors / 2 - 0.06), h / 2, d / 2 + 0.02, MT));
    }
    for (let i = 0; i < (drawers || 0); i++) {
      const y = (h / drawers) * (i + 0.5);
      P.push(quad(w - 0.06, h / drawers - 0.04, 0, y, d / 2 + 0.005, line), box(0.12, 0.02, 0.03, 0, y, d / 2 + 0.02, MT));
    }
    return P;
  }
  function bench(c, w) {
    w = w || 1.6;
    return [box(w, 0.05, 0.45, 0, 0.45, 0, c), box(w, 0.35, 0.04, 0, 0.7, -0.22, c, { rx: -10 }), ...[-1, 1].map((s) => box(0.06, 0.45, 0.45, s * (w / 2 - 0.1), 0.22, 0, DK)), ...[-1, 1].map((s) => box(0.05, 0.5, 0.05, s * (w / 2 - 0.1), 0.7, -0.22, DK))];
  }
  function car(c, o) {
    o = o || {};
    const L = o.L || 4.2, W = o.W || 1.8, r = o.r || 0.33, bh = o.bh || 0.6, ch = o.ch || 0.55, cl = o.cl || L * 0.5;
    const y0 = r * 0.9, top = y0 + bh, cz = o.cz != null ? o.cz : -L * 0.06;
    return [
      box(W, bh, L, 0, y0 + bh / 2, 0, c),
      box(W * 0.88, ch, cl, 0, top + ch / 2, cz, GL, { glass: true }),
      box(W * 0.9, 0.06, cl, 0, top + ch, cz, c),
      ...corners(W - 0.2, L * 0.62, (x, z) => wheel(x, z, r, 0.24)),
      ...[-1, 1].map((s) => box(0.3, 0.12, 0.03, s * (W / 2 - 0.25), y0 + bh * 0.65, L / 2 + 0.01, LT, { glow: true })),
      ...[-1, 1].map((s) => box(0.3, 0.12, 0.03, s * (W / 2 - 0.25), y0 + bh * 0.65, -L / 2 - 0.01, RD)),
      ...(o.extra || []),
    ];
  }
  function truck(c, cargo, o) {
    o = o || {};
    const L = o.L || 7, W = o.W || 2.4, r = 0.48, ch = o.ch || 2.4;
    return [
      box(W, 2.1, 2, 0, r + 1.0, L / 2 - 1, c),
      quad(W - 0.3, 0.8, 0, r + 1.5, L / 2 + 0.005, GL, { glass: true }),
      box(W, 0.3, L, 0, r + 0.1, 0, DK),
      box(W, ch, L - 2.2, 0, r + 0.25 + ch / 2, -1.1, cargo),
      ...[-1, 1].map((s) => box(0.3, 0.15, 0.03, s * (W / 2 - 0.3), r + 0.3, L / 2 + 0.01, LT, { glow: true })),
      ...corners(W - 0.25, L - 2.4, (x, z) => wheel(x, z, r, 0.3)),
      ...(o.extra || []),
    ];
  }
  function bike(c, motor) {
    const r = motor ? 0.32 : 0.34;
    const P = [cylX(r, 0.06, 0, r, 0.55, BK), cylX(r, 0.06, 0, r, -0.55, BK), box(0.05, 0.05, 1.0, 0, r + 0.25, 0, c, { rx: -8 }), box(0.04, 0.5, 0.04, 0, r + 0.15, 0.5, MT, { rx: 15 }), box(0.55, 0.03, 0.03, 0, r + 0.45, 0.45, DK), box(0.15, 0.05, 0.25, 0, r + 0.42, -0.2, DK)];
    if (motor) P.push(box(0.35, 0.3, 0.6, 0, r + 0.1, 0, shade(c, -0.3)), box(0.3, 0.25, 0.45, 0, r + 0.35, 0.15, c), box(0.12, 0.1, 0.03, 0, r + 0.5, 0.6, LT, { glow: true }));
    return P;
  }
  /* animals on four legs, facing +z */
  function animal(c, o) {
    const L = o.L, W = o.W || L * 0.4, T = o.T || W, leg = o.leg, hs = o.head || W * 0.8, lc = o.legc || c, hc = o.headc || c;
    const y = leg + T / 2, neck = o.neck || 0, hy = y + T * 0.3 + neck, hz = L / 2 + hs * 0.3 + (o.reach || 0);
    const P = [box(W, T, L, 0, y, 0, c), ...corners(W * 0.7, L - W * 0.4, (x, z) => box(W * 0.24, leg + T * 0.2, W * 0.24, x, (leg + T * 0.2) / 2, z, lc))];
    if (neck) P.push(box(hs * 0.6, neck + T * 0.4, hs * 0.6, 0, y + neck / 2 + T * 0.1, L / 2 - hs * 0.1, c, { rx: 20 }));
    P.push(box(hs, hs, hs * 1.1, 0, hy, hz, hc), ...eyes(hs * 0.28, hs * 0.14, hy + hs * 0.15, hz + hs * 0.56));
    if (o.snout) P.push(box(hs * 0.6, hs * 0.5, hs * 0.5, 0, hy - hs * 0.18, hz + hs * 0.75, o.snout));
    if (o.ears) P.push(...[-1, 1].map((s) => box(o.ears[0], o.ears[1], o.ears[0] * 0.5, s * hs * 0.32, hy + hs / 2 + o.ears[1] / 2, hz - hs * 0.2, o.earc || hc)));
    if (o.tail) P.push(box(o.tail[0], o.tail[0], o.tail[1], 0, y + T * 0.3 + (o.tail[2] || 0), -L / 2 - o.tail[1] / 2 + 0.02, o.tailc || c, { rx: o.tail[3] || 30, pivot: [0, y + T * 0.3, -L / 2] }));
    return P.concat(o.extra || []);
  }
  function bird(c, o) {
    o = o || {};
    const beak = o.beak || "#e8a33a", wing = o.wing || shade(c, -0.15);
    const P = [box(0.4, 0.36, 0.7, 0, 0.55, 0, c), ball(0.18, 0, 0.82, 0.3, o.head || c), cone(0.06, 0.2, 0, 0.8, 0.45, beak, { rx: 90 }), ...eyes(0.1, 0.05, 0.86, 0.43), box(0.26, 0.05, 0.32, 0, 0.62, -0.45, wing, { rx: 15 })];
    if (o.spread) P.push(box(0.75, 0.04, 0.34, -0.55, 0.66, 0, wing, { rz: -10 }), box(0.75, 0.04, 0.34, 0.55, 0.66, 0, wing, { rz: 10 }));
    else P.push(box(0.06, 0.26, 0.52, -0.22, 0.58, -0.04, wing), box(0.06, 0.26, 0.52, 0.22, 0.58, -0.04, wing));
    if (!o.nolegs) P.push(box(0.03, 0.38, 0.03, -0.08, 0.19, 0, beak), box(0.03, 0.38, 0.03, 0.08, 0.19, 0, beak));
    return P.concat(o.extra || []);
  }
  function fish(c, o) {
    o = o || {};
    const fin = o.fin || shade(c, -0.2);
    return [box(0.24, 0.4, 0.8, 0, 0.3, 0, c), box(0.2, 0.3, 0.2, 0, 0.3, 0.45, o.head || c), box(0.04, 0.4, 0.22, 0, 0.3, -0.5, fin), box(0.04, 0.14, 0.26, 0, 0.55, -0.05, fin), ...[-1, 1].map((s) => box(0.03, 0.06, 0.06, s * 0.1, 0.36, 0.52, EYE)), box(0.2, 0.03, 0.16, 0, 0.2, 0.2, o.belly || shade(c, 0.4))].concat(o.extra || []);
  }
  function insect(c, o) {
    o = o || {};
    const lc = o.legc || DK;
    const P = [ball(0.3, 0, 0.35, -0.25, c), ball(0.18, 0, 0.35, 0.15, o.thorax || c), ball(0.13, 0, 0.35, 0.38, o.headc || DK), ...[-0.05, 0.12, 0.28].map((z) => box(0.8, 0.03, 0.03, 0, 0.2, z, lc)), box(0.02, 0.02, 0.25, -0.07, 0.48, 0.52, lc, { rx: -30 }), box(0.02, 0.02, 0.25, 0.07, 0.48, 0.52, lc, { rx: -30 })];
    if (o.wings) P.push(box(0.7, 0.02, 0.35, -0.38, 0.55, 0.02, o.wings, { glass: !o.solid, rz: -8 }), box(0.7, 0.02, 0.35, 0.38, 0.55, 0.02, o.wings, { glass: !o.solid, rz: 8 }));
    return P.concat(o.extra || []);
  }
  function tree(kind, c, h) {
    h = h || 5;
    if (kind === "pine") return [cyl(0.15, h * 0.3, 0, 0, 0, BARK), cone(h * 0.24, h * 0.45, 0, h * 0.15, 0, c), cone(h * 0.19, h * 0.4, 0, h * 0.38, 0, c), cone(h * 0.13, h * 0.35, 0, h * 0.62, 0, c)];
    if (kind === "birch") return [cyl(0.12, h * 0.75, 0, 0, 0, "#ecebe4"), ...[0.2, 0.35, 0.5].map((y) => box(0.25, 0.04, 0.25, 0, h * y, 0, DK)), ball(h * 0.18, 0, h * 0.72, 0, c), ball(h * 0.14, h * 0.1, h * 0.86, 0.1, c), ball(h * 0.13, -h * 0.1, h * 0.6, -0.1, c)];
    if (kind === "palm") return [...[0, 1, 2, 3].map((i) => cyl(0.16 - i * 0.02, h * 0.25, i * 0.12, i * h * 0.24, 0, "#8d6b45")), ...[0, 60, 120, 180, 240, 300].map((a) => box(0.35, 0.04, h * 0.32, 0.48, h * 0.98, h * 0.15, c, { ry: a, rx: 25, pivot: [0.48, h * 0.98, 0] })), ball(0.15, 0.48, h * 0.95, 0.12, "#6b4a2f")];
    return [cyl(h * 0.05, h * 0.5, 0, 0, 0, BARK), ball(h * 0.28, 0, h * 0.68, 0, c), ball(h * 0.2, h * 0.2, h * 0.58, 0.1, shade(c, -0.1)), ball(h * 0.2, -h * 0.18, h * 0.6, -0.1, shade(c, 0.08)), ball(h * 0.18, 0, h * 0.82, 0.05, shade(c, 0.05))];
  }
  function house(w, h, d, c, roof, o) {
    o = o || {};
    const rh = o.rh || w * 0.3, door = o.door || shade(c, -0.35);
    const P = [box(w, h, d, 0, h / 2, 0, c), wedge(w + 0.3, rh, d / 2 + 0.2, 0, h + rh / 2, d / 4 + 0.1, roof), wedge(w + 0.3, rh, d / 2 + 0.2, 0, h + rh / 2, -d / 4 - 0.1, roof, { ry: 180 }), quad(Math.min(1, w * 0.25), Math.min(2.1, h * 0.7), o.doorx || 0, Math.min(1.05, h * 0.35), d / 2 + 0.01, door)];
    if (!o.nowin) [-1, 1].forEach((s) => P.push(quad(0.9, 0.9, s * w * 0.3, h * 0.6, d / 2 + 0.01, "#ffd98a", { glow: true })));
    return P.concat(o.extra || []);
  }
  function tower(w, h, d, c, o) {
    o = o || {};
    const P = [box(w, h, d, 0, h / 2, 0, c)];
    const rows = Math.min(o.rows || 12, Math.floor((h - 2) / 3));
    for (let i = 0; i < rows; i++) {
      const y = 3 + ((h - 3.5) / rows) * (i + 0.5);
      const lit = (i * 7 + w) % 3 !== 0;
      P.push(quad(w * 0.86, Math.min(1.3, ((h - 3.5) / rows) * 0.6), 0, y, d / 2 + 0.01, lit ? "#ffd98a" : "#1f2233", { glow: lit }));
    }
    P.push(quad(Math.min(2, w * 0.3), 2.4, 0, 1.2, d / 2 + 0.01, o.door || DK));
    return P.concat(o.extra || []);
  }
  function boat(c, L, W, H, o) {
    o = o || {};
    const bow = Math.min(W, L * 0.25);
    const P = [box(W, H, L - bow, 0, H / 2, -bow / 2, c), wedge(W, H, bow, 0, H / 2, L / 2 - bow / 2, c, { ry: 180, rx: 0 }), box(W + 0.02, H * 0.15, L - bow, 0, H * 0.92, -bow / 2, o.trim || WH)];
    if (o.deck !== false) P.push(flat(W - 0.1, L - bow - 0.1, 0, H * 0.7, -bow / 2, o.deck || "#b98a5a"));
    return P.concat(o.extra || []);
  }
  function fence(c, len, picket) {
    const P = [];
    for (let x = -len / 2; x <= len / 2 + 0.01; x += picket ? 0.2 : len / 2) P.push(box(picket ? 0.09 : 0.12, picket ? 1 : 1.2, picket ? 0.03 : 0.12, x, picket ? 0.5 : 0.6, 0, c));
    P.push(box(len, 0.08, 0.04, 0, 0.3, -0.04, c), box(len, 0.08, 0.04, 0, 0.8, -0.04, c));
    return P;
  }
  function flowers(c, w, d, n) {
    const P = [], cols = [c, "#f2d03b", "#ffffff", "#b85cd6", "#ff7f50"];
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + ((i * 0.618) % 1) * w, z = -d / 2 + ((i * 0.381 + 0.2) % 1) * d, hh = 0.25 + (i % 3) * 0.08;
      P.push(box(0.015, hh, 0.015, x, hh / 2, z, "#3c7d3a"), ball(0.05, x, hh, z, cols[i % cols.length]));
    }
    return P;
  }
  const bushP = (c, s) => [ball(0.5 * s, 0, 0.4 * s, 0, c), ball(0.38 * s, 0.4 * s, 0.32 * s, 0.1 * s, shade(c, -0.1)), ball(0.36 * s, -0.4 * s, 0.3 * s, -0.05 * s, shade(c, 0.08))];
  const pondP = (c, r) => [cyl(r + 0.25, 0.04, 0, 0, 0, "#7b6a55"), cyl(r, 0.05, 0, 0, 0, c, { glass: true }), ...[0, 1, 2, 3].map((i) => box(0.03, 0.7, 0.03, r * 0.8 + i * 0.07, 0.35, (i - 1.5) * 0.12, "#5c8a3a", { rz: (i - 1.5) * 8 }))];
  const rockP = (c, s) => [box(0.8 * s, 0.5 * s, 0.7 * s, 0, 0.22 * s, 0, c, { ry: 20, rx: 8 }), box(0.55 * s, 0.4 * s, 0.5 * s, 0.2 * s, 0.4 * s, 0.05 * s, shade(c, 0.1), { ry: 50, rz: 12 })];
  const lampPost = (c, h) => [box(0.12, h, 0.12, 0, h / 2, 0, c), box(0.08, 0.08, 0.6, 0, h, 0.25, c), box(0.3, 0.12, 0.3, 0, h - 0.08, 0.5, LT, { glow: true }), cyl(0.18, 0.1, 0, 0, 0, c)];
  const mailboxP = (c) => [box(0.08, 1, 0.08, 0, 0.5, 0, WD), box(0.25, 0.22, 0.5, 0, 1.1, 0, c), cylZ(0.125, 0.5, 0, 1.21, 0, c), box(0.03, 0.2, 0.06, 0.14, 1.25, -0.1, RD)];
  const binP = (c) => [cyl(0.25, 0.85, 0, 0, 0, c), cyl(0.27, 0.05, 0, 0.85, 0, shade(c, -0.25)), cyl(0.2, 0.01, 0, 0.9, 0, BK)];
  const slideP = (c) => [box(0.7, 0.06, 0.7, 0, 1.5, -1, MT), ...corners(0.66, 0.66, (x, z) => box(0.06, 1.5, 0.06, x, 0.75, z - 1, MT)), ...[0.3, 0.6, 0.9, 1.2].map((y) => box(0.6, 0.04, 0.04, 0, y, -1.38, MT)), box(0.6, 0.05, 2.2, 0, 0.8, 0.45, c, { rx: 38 }), box(0.04, 0.2, 2.2, -0.3, 0.9, 0.45, c, { rx: 38, pivot: [0, 0.8, 0.45] }), box(0.04, 0.2, 2.2, 0.3, 0.9, 0.45, c, { rx: 38, pivot: [0, 0.8, 0.45] })];
  const swingP = (c, n) => {
    const w = n * 0.9 + 0.4;
    const P = [cylX(0.05, w, 0, 2.2, 0, c)];
    [-1, 1].forEach((s) => P.push(box(0.08, 2.4, 0.08, s * w / 2, 1.1, 0.5, c, { rx: 22, pivot: [s * w / 2, 2.2, 0] }), box(0.08, 2.4, 0.08, s * w / 2, 1.1, -0.5, c, { rx: -22, pivot: [s * w / 2, 2.2, 0] })));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.65 + i * 0.9;
      P.push(box(0.02, 1.7, 0.02, x - 0.2, 1.35, 0, DK), box(0.02, 1.7, 0.02, x + 0.2, 1.35, 0, DK), box(0.46, 0.04, 0.2, x, 0.5, 0, RD));
    }
    return P;
  };
  const deskChairP = (c) => [...[0, 72, 144, 216, 288].map((a) => box(0.05, 0.04, 0.32, 0, 0.06, 0.16, DK, { ry: a, pivot: [0, 0.06, 0] })), cyl(0.03, 0.4, 0, 0.06, 0, MT), box(0.48, 0.08, 0.46, 0, 0.48, 0, c), box(0.46, 0.55, 0.07, 0, 0.82, -0.22, c, { rx: -6 })];
  const tableLampP = (c) => [cyl(0.07, 0.03, 0, 0, 0, DK), ball(0.08, 0, 0.12, 0, c), cyl(0.012, 0.12, 0, 0.18, 0, MT), cyl(0.14, 0.15, 0, 0.26, 0, "#f3e6c4", { glow: true })];
  const statueFig = (c) => [box(0.3, 0.8, 0.18, -0.09, 0.4, 0, c), box(0.3, 0.8, 0.18, 0.09, 0.4, 0, c), box(0.5, 0.7, 0.3, 0, 1.15, 0, c), box(0.12, 0.6, 0.12, 0.31, 1.5, 0, c, { rz: 160, pivot: [0.31, 1.45, 0] }), box(0.12, 0.6, 0.12, -0.31, 1.2, 0, c), box(0.3, 0.32, 0.3, 0, 1.68, 0, c)];

  /* ---------- the catalog ---------- */
  const items = [];
  function add(id, name, world, places, type, tags, color, look, ring, build, extra) {
    items.push(Object.assign({ id, name, world, places: places.split("|"), type, tags, color, look, ring, parts: (d) => build((d && d.color) || color, d || {}) }, extra));
  }
  function person(id, name, world, places, tags, shirt, pants, skin, hair) {
    items.push({ id, name, world, places: places.split("|"), type: "People", tags, color: shirt, look: 1.6, ring: 0.45, person: { color: shirt, pants, skin, hair } });
  }
  const H = "Household", C = "City", Co = "Country", Wa = "Water", S = "Sky";

  /* Household / Kitchen */
  add("fridge", "Fridge", H, "Kitchen", "Furniture", "refrigerator freezer icebox cold food appliance", "#e8e8e4", 1, 0.5, (c) => [box(0.7, 1.8, 0.65, 0, 0.9, 0, c), box(0.7, 0.02, 0.01, 0, 1.2, 0.33, shade(c, -0.3)), box(0.03, 0.4, 0.04, 0.28, 1.5, 0.35, MT), box(0.03, 0.6, 0.04, 0.28, 0.75, 0.35, MT)]);
  add("stove", "Stove", H, "Kitchen", "Furniture", "cooker range hob burners cook appliance", "#d8d8d4", 0.9, 0.45, (c) => [box(0.6, 0.9, 0.6, 0, 0.45, 0, c), ...corners(0.28, 0.28, (x, z) => cyl(0.08, 0.012, x, 0.9, z, DK)), quad(0.5, 0.4, 0, 0.42, 0.301, BK, { glass: true }), box(0.4, 0.03, 0.04, 0, 0.7, 0.32, MT), ...[-0.2, -0.07, 0.07, 0.2].map((x) => box(0.04, 0.04, 0.03, x, 0.82, 0.31, DK))]);
  add("oven", "Oven", H, "Kitchen", "Furniture", "wall oven bake roast appliance", "#3a3d42", 1, 0.45, (c) => [box(0.6, 1.6, 0.6, 0, 0.8, 0, c), quad(0.46, 0.35, 0, 1.15, 0.301, "#ff9b42", { glow: true, glass: true }), quad(0.46, 0.35, 0, 0.62, 0.301, BK), box(0.42, 0.03, 0.04, 0, 1.38, 0.32, MT), box(0.42, 0.03, 0.04, 0, 0.84, 0.32, MT), quad(0.2, 0.06, 0, 1.47, 0.301, "#7ae0a0", { glow: true })]);
  add("sink", "Kitchen sink", H, "Kitchen", "Furniture", "sink tap faucet wash dishes basin", "#d9cbb0", 0.9, 0.5, (c) => [...cabinet(0.8, 0.85, 0.6, c, 2), box(0.82, 0.04, 0.62, 0, 0.87, 0, "#e3e3e0"), flat(0.5, 0.35, 0, 0.893, 0.03, MT), box(0.04, 0.25, 0.04, 0, 1.0, -0.22, MT), box(0.04, 0.04, 0.15, 0, 1.12, -0.16, MT)]);
  add("counter", "Counter", H, "Kitchen", "Furniture", "worktop countertop kitchen unit bench", "#d9cbb0", 0.9, 0.7, (c) => [...cabinet(1.2, 0.86, 0.6, c, 2), box(1.22, 0.04, 0.62, 0, 0.88, 0, "#5b5d61")]);
  add("cabinet", "Cupboard", H, "Kitchen|Living room|Garage", "Furniture", "cabinet cupboard pantry storage closet", "#c7a77d", 1, 0.5, (c) => cabinet(0.8, 2, 0.45, c, 2));
  add("kitchen-table", "Kitchen table", H, "Kitchen", "Furniture", "dining table eat dinner", "#b07a48", 0.75, 0.8, (c) => table(1.4, 0.8, 0.75, c));
  add("chair", "Chair", H, "Kitchen|Living room|Office", "Furniture", "seat dining chair sit", "#a8703f", 0.5, 0.35, (c) => chair(c));
  add("stool", "Stool", H, "Kitchen|Garage", "Furniture", "bar stool seat sit", "#b07a48", 0.65, 0.25, (c) => [cyl(0.18, 0.05, 0, 0.65, 0, c), ...corners(0.22, 0.22, (x, z) => box(0.03, 0.66, 0.03, x, 0.33, z, MT)), box(0.25, 0.02, 0.02, 0, 0.25, 0.11, MT)]);
  add("kettle", "Kettle", H, "Kitchen", "Things", "tea water boil jug", "#c0392b", 0.12, 0.15, (c) => [cyl(0.09, 0.18, 0, 0, 0, c), cyl(0.05, 0.02, 0, 0.18, 0, shade(c, -0.3)), box(0.03, 0.03, 0.14, 0, 0.24, -0.02, DK), box(0.03, 0.06, 0.03, 0, 0.21, -0.08, DK), box(0.03, 0.06, 0.03, 0, 0.21, 0.04, DK), box(0.03, 0.03, 0.09, 0, 0.12, 0.11, c, { rx: -35 })]);
  add("mug", "Mug", H, "Kitchen|Office", "Things", "cup coffee tea drink", "#3f7fbf", 0.05, 0.08, (c) => [cyl(0.04, 0.1, 0, 0, 0, c), cyl(0.034, 0.002, 0, 0.098, 0, "#4b2e1e"), box(0.015, 0.06, 0.03, 0.05, 0.05, 0, c)]);
  add("plate", "Plate", H, "Kitchen", "Things", "dish dinner food", "#f4f1ea", 0.01, 0.14, (c) => [cyl(0.12, 0.015, 0, 0, 0, c), cyl(0.08, 0.002, 0, 0.015, 0, shade(c, -0.06))]);
  add("bowl", "Bowl", H, "Kitchen", "Things", "dish cereal soup", "#e9d8b5", 0.05, 0.1, (c) => [cyl(0.05, 0.02, 0, 0, 0, c), cyl(0.08, 0.05, 0, 0.02, 0, c), cyl(0.07, 0.002, 0, 0.07, 0, shade(c, -0.2))]);
  add("pot", "Cooking pot", H, "Kitchen", "Things", "saucepan stockpot soup cook", "#7d8590", 0.1, 0.18, (c) => [cyl(0.12, 0.16, 0, 0, 0, c), cyl(0.125, 0.015, 0, 0.16, 0, shade(c, 0.2)), cyl(0.02, 0.03, 0, 0.175, 0, DK), box(0.06, 0.02, 0.03, -0.15, 0.13, 0, DK), box(0.06, 0.02, 0.03, 0.15, 0.13, 0, DK)]);
  add("pan", "Frying pan", H, "Kitchen", "Things", "skillet fry pan cook", "#2e3136", 0.03, 0.2, (c) => [cyl(0.13, 0.04, 0, 0, 0, c), cyl(0.12, 0.002, 0, 0.04, 0, shade(c, 0.15)), box(0.03, 0.02, 0.22, 0, 0.035, 0.24, BK)]);
  add("toaster", "Toaster", H, "Kitchen", "Things", "toast bread appliance", "#c9ced4", 0.1, 0.18, (c) => [box(0.28, 0.18, 0.16, 0, 0.09, 0, c), flat(0.2, 0.025, 0, 0.181, -0.03, BK), flat(0.2, 0.025, 0, 0.181, 0.03, BK), box(0.02, 0.03, 0.04, 0.15, 0.13, 0, DK)]);
  add("microwave", "Microwave", H, "Kitchen", "Things", "microwave oven heat appliance", "#d8d8d4", 0.15, 0.3, (c) => [box(0.5, 0.3, 0.38, 0, 0.15, 0, c), quad(0.32, 0.22, -0.06, 0.15, 0.191, BK, { glass: true }), quad(0.1, 0.24, 0.17, 0.15, 0.191, "#30343a"), quad(0.07, 0.03, 0.17, 0.24, 0.192, "#7ae0a0", { glow: true })]);
  add("fruit-bowl", "Fruit bowl", H, "Kitchen|Living room", "Things", "fruit apple orange banana food", "#e9d8b5", 0.08, 0.15, (c) => [cyl(0.07, 0.02, 0, 0, 0, c), cyl(0.13, 0.06, 0, 0.02, 0, c), ball(0.04, -0.04, 0.09, 0, "#d1332e"), ball(0.04, 0.05, 0.09, 0.02, "#f39c12"), ball(0.035, 0, 0.1, -0.05, "#7cbf3a"), box(0.15, 0.03, 0.04, 0.01, 0.12, 0.04, "#f2d03b", { ry: 25 })]);
  add("bottle", "Bottle", H, "Kitchen", "Things", "drink water juice wine", "#3d8b5a", 0.15, 0.06, (c) => [cyl(0.04, 0.22, 0, 0, 0, c, { glass: true }), cyl(0.015, 0.08, 0, 0.22, 0, c, { glass: true }), cyl(0.017, 0.02, 0, 0.3, 0, DK), quad(0.06, 0.06, 0, 0.1, 0.041, "#f4f1ea")]);
  add("glass", "Drinking glass", H, "Kitchen", "Things", "glass tumbler cup water drink", "#cfe8f2", 0.06, 0.05, (c) => [cyl(0.035, 0.11, 0, 0, 0, c, { glass: true }), cyl(0.03, 0.07, 0, 0.005, 0, "#7fb8d8", { glass: true })]);
  add("knife-block", "Knife block", H, "Kitchen", "Things", "knives cutlery kitchen", "#8a5a34", 0.12, 0.12, (c) => [box(0.12, 0.2, 0.16, 0, 0.1, 0, c, { rx: -15 }), ...[-0.035, 0, 0.035].map((x) => box(0.025, 0.08, 0.03, x, 0.23, -0.04, BK, { rx: -15 }))]);
  add("kitchen-bin", "Kitchen bin", H, "Kitchen|Office", "Things", "trash can garbage rubbish waste bin pedal", "#b8bec5", 0.3, 0.2, (c) => [cyl(0.16, 0.45, 0, 0, 0, c), cyl(0.165, 0.04, 0, 0.45, 0, DK), box(0.1, 0.02, 0.06, 0, 0.02, 0.18, DK)]);

  /* Household / Living room */
  add("sofa", "Sofa", H, "Living room", "Furniture", "couch settee lounge seat", "#5a7d9a", 0.5, 1.2, (c) => sofa(c, 2.1));
  add("armchair", "Armchair", H, "Living room", "Furniture", "easy chair seat lounge", "#9a5a5a", 0.5, 0.6, (c) => sofa(c, 0.95));
  add("coffee-table", "Coffee table", H, "Living room", "Furniture", "low table living", "#8a5a34", 0.4, 0.6, (c) => table(1.0, 0.55, 0.42, c));
  add("tv", "TV", H, "Living room|Bedroom", "Things", "television telly screen", "#1c1d21", 0.5, 0.6, (c) => [box(1.2, 0.7, 0.05, 0, 0.55, 0, c), quad(1.12, 0.62, 0, 0.55, 0.026, "#2b4a6f", { glow: true }), box(0.3, 0.03, 0.2, 0, 0.015, 0, c), box(0.05, 0.2, 0.04, 0, 0.12, 0, c)]);
  add("tv-stand", "TV stand", H, "Living room", "Furniture", "media unit console cabinet", "#4a3b30", 0.3, 0.8, (c) => cabinet(1.6, 0.5, 0.45, c, 2));
  add("floor-lamp", "Floor lamp", H, "Living room|Bedroom|Office", "Things", "standard lamp light", "#2b2d31", 1.4, 0.25, (c) => [cyl(0.15, 0.03, 0, 0, 0, c), cyl(0.015, 1.4, 0, 0.03, 0, c), cyl(0.2, 0.25, 0, 1.35, 0, "#f3e6c4", { glow: true })]);
  add("table-lamp", "Table lamp", H, "Living room|Bedroom", "Things", "lamp light bedside", "#c9a36a", 0.25, 0.15, (c) => tableLampP(c));
  add("rug", "Rug", H, "Living room|Bedroom", "Furniture", "carpet mat floor", "#a6463f", 0, 1.2, (c) => [flat(2, 1.4, 0, 0.005, 0, c), flat(1.7, 1.1, 0, 0.007, 0, shade(c, 0.25)), flat(1.3, 0.7, 0, 0.009, 0, c)]);
  add("bookshelf", "Bookshelf", H, "Living room|Office|Bedroom", "Furniture", "bookcase shelves books library", "#8a5a34", 1, 0.5, (c) => {
    const P = [box(0.9, 1.8, 0.32, 0, 0.9, 0, c)], cols = ["#b03a2e", "#2e6db0", "#e0b23a", "#3f8f4f", "#6c4fa0"];
    for (let i = 0; i < 4; i++) P.push(box(0.82, 0.38, 0.2, 0, 0.25 + i * 0.43, 0.07, shade(c, -0.45)), box(0.36, 0.3, 0.2, -0.2, 0.22 + i * 0.43, 0.08, cols[i]), box(0.3, 0.28, 0.2, 0.2, 0.21 + i * 0.43, 0.08, cols[i + 1]));
    return P;
  });
  add("books", "Books", H, "Living room|Bedroom|Office", "Things", "book pile stack read novel", "#2e6db0", 0.08, 0.15, (c) => [box(0.22, 0.04, 0.16, 0, 0.02, 0, c), box(0.2, 0.035, 0.15, 0.01, 0.058, 0, "#b03a2e", { ry: 8 }), box(0.21, 0.04, 0.15, -0.01, 0.095, 0, "#e0b23a", { ry: -6 })]);
  add("potted-plant", "Potted plant", H, "Living room|Office|Kitchen", "Nature", "houseplant pot plant leaves green", "#3f8f4f", 0.4, 0.25, (c) => [cyl(0.15, 0.3, 0, 0, 0, "#b5653b"), cyl(0.13, 0.01, 0, 0.3, 0, "#3d2a1d"), ball(0.2, 0, 0.5, 0, c), ball(0.14, 0.12, 0.62, 0.05, shade(c, 0.1)), ball(0.13, -0.1, 0.66, -0.04, shade(c, -0.1))]);
  add("fireplace", "Fireplace", H, "Living room", "Furniture", "hearth fire chimney mantel warm", "#9a5a46", 0.6, 0.8, (c) => [box(1.4, 1.1, 0.4, 0, 0.55, 0, c), quad(0.7, 0.6, 0, 0.35, 0.201, BK), cone(0.15, 0.35, -0.08, 0.06, 0.1, "#ff8a2a", { glow: true }), cone(0.12, 0.25, 0.1, 0.06, 0.12, "#ffd04a", { glow: true }), box(1.6, 0.08, 0.5, 0, 1.14, 0, "#5a3e2b")]);
  add("grandfather-clock", "Clock", H, "Living room", "Furniture", "grandfather clock tall clock time pendulum", "#6b3f22", 1.5, 0.35, (c) => [box(0.5, 1.9, 0.35, 0, 0.95, 0, c), cylZ(0.18, 0.02, 0, 1.6, 0.18, "#f4f1ea"), box(0.02, 0.12, 0.01, 0, 1.65, 0.195, BK), box(0.09, 0.02, 0.01, 0.04, 1.6, 0.195, BK), quad(0.3, 0.7, 0, 0.8, 0.177, "#c9a227", { glass: true }), box(0.6, 0.1, 0.4, 0, 1.95, 0, c)]);
  add("picture-frame", "Picture frame", H, "Living room|Bedroom|Office", "Things", "photo painting picture frame art", "#c9a227", 0.22, 0.3, (c) => [box(0.6, 0.45, 0.03, 0, 0.225, 0, c, { rx: -10 }), quad(0.5, 0.35, 0, 0.23, 0.02, "#7fb0d0", { rx: -10, pivot: [0, 0.225, 0] }), quad(0.5, 0.12, 0, 0.11, 0.022, "#6aa84f", { rx: -10, pivot: [0, 0.225, 0] }), box(0.05, 0.35, 0.03, 0, 0.17, -0.08, c, { rx: 20 })]);
  add("cushion", "Cushion", H, "Living room|Bedroom", "Things", "pillow throw cushion soft", "#e0b23a", 0.07, 0.3, (c) => [box(0.45, 0.14, 0.45, 0, 0.07, 0, c), box(0.38, 0.16, 0.38, 0, 0.07, 0, shade(c, 0.1))]);
  add("piano", "Piano", H, "Living room", "Furniture", "upright piano music keys instrument", "#1b1b1f", 1, 0.8, (c) => [box(1.5, 1.25, 0.6, 0, 0.625, -0.1, c), box(1.4, 0.06, 0.28, 0, 0.75, 0.32, "#f4f4ee"), ...[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((x) => box(0.05, 0.03, 0.15, x, 0.79, 0.27, BK)), box(0.08, 0.72, 0.08, -0.66, 0.36, 0.38, c), box(0.08, 0.72, 0.08, 0.66, 0.36, 0.38, c), quad(0.5, 0.3, 0, 1.0, 0.205, "#f4f1ea")]);
  add("radio", "Radio", H, "Living room|Kitchen|Garage", "Things", "radio music speaker boombox", "#b5653b", 0.12, 0.2, (c) => [box(0.35, 0.2, 0.12, 0, 0.1, 0, c), cylZ(0.06, 0.02, -0.09, 0.1, 0.06, DK), quad(0.12, 0.05, 0.08, 0.13, 0.061, "#f3e6c4", { glow: true }), cylZ(0.015, 0.02, 0.08, 0.06, 0.06, DK), box(0.01, 0.3, 0.01, 0.15, 0.32, -0.04, MT, { rz: -20 })]);

  /* Household / Bedroom */
  add("bed", "Bed", H, "Bedroom", "Furniture", "double bed sleep mattress blanket", "#4a6fa5", 0.6, 1.3, (c) => [box(1.5, 0.3, 2.1, 0, 0.25, 0, WD), box(1.4, 0.2, 2.0, 0, 0.5, 0, WH), box(1.44, 0.06, 1.3, 0, 0.62, 0.35, c), box(0.55, 0.12, 0.35, -0.35, 0.65, -0.72, WH), box(0.55, 0.12, 0.35, 0.35, 0.65, -0.72, WH), box(1.5, 1.0, 0.08, 0, 0.5, -1.05, WD), ...legs(1.45, 2.05, 0.12, 0.08, WD)]);
  add("bunk-bed", "Bunk bed", H, "Bedroom", "Furniture", "bunk beds kids sleep double decker bed", "#4a6fa5", 1, 0.9, (c) => [...corners(0.95, 2.0, (x, z) => box(0.06, 1.8, 0.06, x, 0.9, z, WD)), box(0.9, 0.15, 1.95, 0, 0.35, 0, WH), box(0.92, 0.05, 1.3, 0, 0.45, 0.3, c), box(0.9, 0.15, 1.95, 0, 1.3, 0, WH), box(0.92, 0.05, 1.3, 0, 1.4, 0.3, shade(c, 0.2)), box(0.04, 0.25, 1.9, 0.47, 1.55, 0, WD), ...[0.6, 0.9, 1.2, 1.5].map((y) => box(0.04, 0.04, 0.3, 0.5, y, 0.75, WD))]);
  add("crib", "Crib", H, "Bedroom", "Furniture", "cot baby bed nursery", "#f4f1ea", 0.6, 0.75, (c) => [box(0.7, 0.12, 1.25, 0, 0.35, 0, c), box(0.66, 0.08, 1.2, 0, 0.45, 0, "#bfe0f2"), ...corners(0.7, 1.25, (x, z) => box(0.05, 1, 0.05, x, 0.5, z, c)), ...[-1, 1].map((s) => box(0.03, 0.04, 1.25, s * 0.35, 0.95, 0, c)), ...[-1, 1].map((s) => box(0.7, 0.04, 0.03, 0, 0.95, s * 0.62, c)), ...[-0.4, -0.2, 0, 0.2, 0.4].map((z) => box(0.02, 0.5, 0.02, 0.35, 0.7, z, c))]);
  add("nightstand", "Nightstand", H, "Bedroom", "Furniture", "bedside table night table drawer", "#8a5a34", 0.4, 0.3, (c) => cabinet(0.45, 0.55, 0.4, c, 0, 2));
  add("wardrobe", "Wardrobe", H, "Bedroom", "Furniture", "closet armoire clothes cupboard", "#a6794d", 1.2, 0.6, (c) => cabinet(1.0, 2.0, 0.6, c, 2));
  add("dresser", "Dresser", H, "Bedroom", "Furniture", "chest of drawers bureau drawers", "#a6794d", 0.6, 0.6, (c) => cabinet(1.2, 0.85, 0.5, c, 0, 3));
  add("desk", "Desk", H, "Bedroom|Office", "Furniture", "writing desk study table homework", "#b07a48", 0.75, 0.6, (c) => [...table(1.2, 0.6, 0.75, c), box(0.4, 0.15, 0.55, 0.35, 0.63, 0, c), box(0.12, 0.02, 0.02, 0.35, 0.63, 0.29, MT)]);
  add("desk-chair", "Desk chair", H, "Bedroom|Office", "Furniture", "swivel chair computer chair seat", "#2e6db0", 0.6, 0.35, (c) => deskChairP(c));
  add("mirror", "Mirror", H, "Bedroom", "Furniture", "standing mirror looking glass reflection", "#c9a227", 1, 0.35, (c) => [box(0.6, 1.6, 0.05, 0, 0.9, 0, c), quad(0.5, 1.5, 0, 0.9, 0.026, "#cfe3ee", { glow: true }), box(0.5, 0.05, 0.3, 0, 0.025, 0, c)]);
  add("teddy-bear", "Teddy bear", H, "Bedroom|Living room", "Things", "teddy toy bear plush stuffed animal soft", "#a8743f", 0.2, 0.15, (c) => [ball(0.12, 0, 0.13, 0, c), ball(0.09, 0, 0.3, 0.01, c), ball(0.035, -0.07, 0.38, 0, c), ball(0.035, 0.07, 0.38, 0, c), ball(0.04, 0, 0.28, 0.08, shade(c, 0.35)), ...eyes(0.035, 0.015, 0.33, 0.085), ball(0.045, -0.12, 0.17, 0.03, c), ball(0.045, 0.12, 0.17, 0.03, c), ball(0.05, -0.07, 0.04, 0.08, c), ball(0.05, 0.07, 0.04, 0.08, c)]);
  add("laundry-basket", "Laundry basket", H, "Bedroom|Bathroom", "Things", "hamper washing clothes basket", "#d9c49a", 0.3, 0.25, (c) => [cyl(0.22, 0.4, 0, 0, 0, c), ball(0.1, -0.06, 0.4, 0, "#5a7d9a"), ball(0.09, 0.08, 0.41, 0.04, "#d1332e"), ball(0.08, 0.02, 0.43, -0.08, WH)]);
  add("alarm-clock", "Alarm clock", H, "Bedroom", "Things", "clock time wake bedside", "#2b2d31", 0.05, 0.08, (c) => [box(0.12, 0.08, 0.06, 0, 0.04, 0, c), quad(0.1, 0.04, 0, 0.045, 0.031, "#ff4040", { glow: true })]);

  /* Household / Bathroom */
  add("bathtub", "Bathtub", H, "Bathroom", "Furniture", "bath tub wash soak", "#f4f4f0", 0.5, 1, (c) => [box(0.8, 0.55, 1.7, 0, 0.275, 0, c), flat(0.65, 1.5, 0, 0.5, 0, "#9fd0e8", { glass: true }), box(0.04, 0.2, 0.04, 0, 0.65, -0.78, MT), box(0.04, 0.04, 0.12, 0, 0.74, -0.74, MT)]);
  add("shower", "Shower", H, "Bathroom", "Furniture", "shower stall cubicle wash", "#cfe3ee", 1.2, 0.6, (c) => [box(0.9, 0.08, 0.9, 0, 0.04, 0, WH), box(0.9, 2, 0.02, 0, 1.08, -0.44, "#e8e8e4"), box(0.02, 2, 0.9, -0.44, 1.08, 0, c, { glass: true }), box(0.9, 2, 0.02, 0, 1.08, 0.44, c, { glass: true }), box(0.03, 0.03, 0.25, 0.2, 1.95, -0.32, MT), cyl(0.08, 0.02, 0.2, 1.9, -0.22, MT)]);
  add("toilet", "Toilet", H, "Bathroom", "Furniture", "loo wc lavatory potty", "#f4f4f0", 0.4, 0.35, (c) => [cyl(0.15, 0.38, 0, 0, 0.08, c), cyl(0.19, 0.04, 0, 0.38, 0.1, c), box(0.4, 0.4, 0.18, 0, 0.6, -0.15, c), box(0.42, 0.04, 0.2, 0, 0.82, -0.15, c), box(0.06, 0.02, 0.02, 0.12, 0.74, -0.05, MT)]);
  add("bathroom-sink", "Bathroom sink", H, "Bathroom", "Furniture", "wash basin sink tap faucet", "#f4f4f0", 0.8, 0.35, (c) => [cyl(0.1, 0.7, 0, 0, -0.05, c), box(0.55, 0.15, 0.42, 0, 0.78, 0, c), flat(0.38, 0.26, 0, 0.856, 0.03, "#dfe8ee"), box(0.03, 0.15, 0.03, 0, 0.92, -0.16, MT), box(0.03, 0.03, 0.1, 0, 0.98, -0.12, MT)]);
  add("towel-rack", "Towel rack", H, "Bathroom", "Furniture", "towel rail stand bath", "#9aa0a8", 0.7, 0.35, (c) => [box(0.04, 0.9, 0.3, -0.3, 0.45, 0, c), box(0.04, 0.9, 0.3, 0.3, 0.45, 0, c), box(0.6, 0.03, 0.03, 0, 0.85, 0, c), box(0.5, 0.5, 0.04, 0, 0.62, 0.01, "#5aa0b0")]);
  add("bathroom-mirror", "Bathroom mirror", H, "Bathroom", "Things", "mirror cabinet wall mirror", "#f4f4f0", 1.5, 0.35, (c) => [box(0.6, 0.75, 0.12, 0, 1.55, 0, c), quad(0.52, 0.66, 0, 1.55, 0.061, "#cfe3ee", { glow: true }), box(0.6, 0.04, 0.15, 0, 1.15, 0.02, c)]);
  add("rubber-duck", "Rubber duck", H, "Bathroom", "Things", "rubber duck ducky toy bath", "#f5d000", 0.05, 0.06, (c) => scale([box(0.6, 0.45, 0.8, 0, 0.25, 0, c), ball(0.25, 0, 0.62, 0.2, c), box(0.22, 0.08, 0.2, 0, 0.58, 0.48, "#f08a24"), ...eyes(0.1, 0.06, 0.7, 0.42), wedge(0.5, 0.3, 0.2, 0, 0.5, -0.45, c)], 0.1));

  /* Household / Garage */
  add("family-car", "Family car", H, "Garage|Yard", "Vehicles", "car auto automobile sedan parked", "#3a6ea5", 0.8, 2.3, (c) => car(c));
  add("garage-bicycle", "Bicycle", H, "Garage|Yard", "Vehicles", "bike bicycle cycle pedal", "#d1332e", 0.6, 0.9, (c) => bike(c));
  add("toolbox", "Toolbox", H, "Garage", "Things", "tools tool box kit repair", "#c0302a", 0.12, 0.3, (c) => [box(0.45, 0.2, 0.22, 0, 0.1, 0, c), box(0.46, 0.04, 0.23, 0, 0.2, 0, shade(c, -0.2)), box(0.25, 0.03, 0.03, 0, 0.26, 0, BK), box(0.03, 0.05, 0.03, -0.11, 0.23, 0, BK), box(0.03, 0.05, 0.03, 0.11, 0.23, 0, BK)]);
  add("shelves", "Shelves", H, "Garage", "Furniture", "shelving rack storage metal shelf", "#9aa0a8", 1, 0.6, (c) => [...corners(1.2, 0.45, (x, z) => box(0.04, 1.8, 0.04, x, 0.9, z, c)), ...[0.1, 0.6, 1.1, 1.6].map((y) => box(1.2, 0.03, 0.45, 0, y, 0, c)), box(0.4, 0.3, 0.35, -0.3, 0.27, 0, "#c9a36a"), box(0.35, 0.25, 0.3, 0.3, 0.75, 0, "#c9a36a"), box(0.3, 0.3, 0.3, -0.1, 1.27, 0, "#3a6ea5")]);
  add("ladder", "Ladder", H, "Garage|Yard", "Things", "step ladder steps climb", "#9aa0a8", 0.8, 0.5, (c) => [box(0.05, 1.7, 0.05, -0.22, 0.8, 0.2, c, { rx: 12 }), box(0.05, 1.7, 0.05, 0.22, 0.8, 0.2, c, { rx: 12 }), box(0.05, 1.7, 0.05, -0.22, 0.8, -0.2, c, { rx: -12 }), box(0.05, 1.7, 0.05, 0.22, 0.8, -0.2, c, { rx: -12 }), ...[0.3, 0.7, 1.1].map((y) => box(0.44, 0.04, 0.12, 0, y, 0.3 - y * 0.17, c)), box(0.5, 0.06, 0.2, 0, 1.6, 0, "#e0b23a")]);
  add("lawn-mower", "Lawn mower", H, "Garage|Yard", "Things", "mower grass cutter garden", "#3f8f4f", 0.4, 0.5, (c) => [box(0.5, 0.25, 0.6, 0, 0.22, 0, c), cyl(0.12, 0.15, 0, 0.35, 0, DK), wheel(-0.28, 0.2, 0.1, 0.05), wheel(0.28, 0.2, 0.1, 0.05), wheel(-0.28, -0.22, 0.12, 0.05), wheel(0.28, -0.22, 0.12, 0.05), box(0.03, 0.03, 0.9, -0.2, 0.6, -0.6, DK, { rx: -40 }), box(0.03, 0.03, 0.9, 0.2, 0.6, -0.6, DK, { rx: -40 }), box(0.43, 0.03, 0.03, 0, 0.88, -0.93, DK)]);
  add("workbench", "Workbench", H, "Garage", "Furniture", "work bench table tools diy", "#b07a48", 0.9, 0.9, (c) => [...table(1.8, 0.7, 0.9, c), box(1.7, 0.03, 0.6, 0, 0.25, 0, c), box(1.8, 0.9, 0.03, 0, 1.35, -0.34, "#c9a36a"), ...[-0.5, -0.2, 0.1, 0.4].map((x) => box(0.03, 0.25, 0.03, x, 1.35, -0.3, MT))]);
  add("paint-can", "Paint can", H, "Garage", "Things", "paint tin bucket pot diy", "#2e6db0", 0.1, 0.1, (c) => [cyl(0.09, 0.2, 0, 0, 0, MT), quad(0.15, 0.12, 0, 0.1, 0.09, c), cyl(0.085, 0.01, 0, 0.2, 0, c), box(0.18, 0.01, 0.01, 0, 0.26, 0, MT)]);

  /* Household / Yard */
  add("fence", "Picket fence", H, "Yard", "Signs & street", "fence picket garden wall boundary", "#f4f1ea", 0.5, 1.1, (c) => fence(c, 2, true));
  add("garden-bench", "Garden bench", H, "Yard", "Furniture", "bench seat garden wooden", "#8a5a34", 0.5, 0.9, (c) => bench(c, 1.4));
  add("grill", "Grill", H, "Yard", "Things", "barbecue bbq grill cook outdoor", "#1f1f22", 0.8, 0.4, (c) => [ball(0.3, 0, 0.85, 0, c), cyl(0.31, 0.02, 0, 0.85, 0, MT), box(0.05, 0.05, 0.05, 0, 1.17, 0, MT), ...[0, 120, 240].map((a) => box(0.03, 0.75, 0.03, 0, 0.37, 0.18, MT, { ry: a, rx: -12, pivot: [0, 0.6, 0] })), box(0.12, 0.02, 0.02, 0, 0.95, 0.3, MT)]);
  add("swing-set", "Swing set", H, "Yard", "Things", "swings playground garden play", "#3a6ea5", 1.5, 1.6, (c) => swingP(c, 2));
  add("mailbox", "Mailbox", H, "Yard", "Signs & street", "letterbox post box mail letters", "#3a3d42", 1.1, 0.3, (c) => mailboxP(c));
  add("doghouse", "Doghouse", H, "Yard", "Buildings", "kennel dog house pet", "#b5653b", 0.5, 0.7, (c) => house(0.9, 0.7, 1, c, "#7a3b30", { rh: 0.4, nowin: true, door: BK }));
  add("hose-reel", "Hose reel", H, "Yard|Garage", "Things", "garden hose water reel", "#3f8f4f", 0.35, 0.3, (c) => [box(0.04, 0.5, 0.3, -0.2, 0.25, 0, DK), box(0.04, 0.5, 0.3, 0.2, 0.25, 0, DK), cylX(0.18, 0.34, 0, 0.35, 0, c), cylX(0.08, 0.36, 0, 0.35, 0, shade(c, -0.3)), box(0.04, 0.04, 0.3, 0, 0.17, 0.25, c)]);
  add("flower-bed", "Flower bed", H, "Yard", "Nature", "flowers garden bed tulips roses", "#e8443a", 0.3, 0.9, (c) => [box(1.6, 0.15, 0.8, 0, 0.075, 0, "#8a5a34"), flat(1.5, 0.7, 0, 0.152, 0, "#4b3424"), ...move(flowers(c, 1.4, 0.6, 9), 0, 0.15, 0)]);
  add("shed", "Shed", H, "Yard", "Buildings", "garden shed hut tool shed outbuilding", "#7c9a6a", 1.4, 1.5, (c) => house(2.2, 2, 2, c, "#5a3e2b", { rh: 0.7, nowin: true }));
  add("wheelbarrow", "Wheelbarrow", H, "Yard|Garage", "Things", "wheelbarrow barrow cart garden", "#3a6ea5", 0.4, 0.7, (c) => [box(0.6, 0.3, 0.8, 0, 0.5, 0, c), cylX(0.18, 0.06, 0, 0.18, 0.55, BK), box(0.04, 0.04, 1.3, -0.25, 0.4, -0.2, DK, { rx: -10 }), box(0.04, 0.04, 1.3, 0.25, 0.4, -0.2, DK, { rx: -10 }), box(0.04, 0.35, 0.04, -0.22, 0.17, -0.25, DK), box(0.04, 0.35, 0.04, 0.22, 0.17, -0.25, DK)]);

  /* Household / Office */
  add("office-desk", "Office desk", H, "Office", "Furniture", "work desk table workstation", "#d8d2c4", 0.75, 0.9, (c) => [box(1.6, 0.04, 0.8, 0, 0.73, 0, c), box(0.04, 0.73, 0.75, -0.78, 0.365, 0, DK), cabinet(0.45, 0.71, 0.7, shade(c, -0.1), 0, 3).map((p) => Object.assign({}, p, { at: [p.at[0] + 0.55, p.at[1], p.at[2]] }))].flat());
  add("computer", "Computer", H, "Office|Bedroom", "Things", "pc monitor screen keyboard laptop desktop", "#1c1d21", 0.25, 0.35, (c) => [box(0.55, 0.33, 0.03, 0, 0.3, 0, c), quad(0.51, 0.29, 0, 0.3, 0.016, "#3f7fbf", { glow: true }), box(0.04, 0.14, 0.04, 0, 0.07, -0.01, c), box(0.2, 0.01, 0.15, 0, 0.005, -0.01, c), box(0.42, 0.015, 0.14, 0, 0.008, 0.2, "#3a3d42"), box(0.06, 0.02, 0.1, 0.32, 0.01, 0.2, "#3a3d42")]);
  add("office-chair", "Office chair", H, "Office", "Furniture", "swivel chair desk chair seat", "#2b2d31", 0.6, 0.35, (c) => deskChairP(c));
  add("filing-cabinet", "Filing cabinet", H, "Office", "Furniture", "file cabinet drawers files", "#9aa0a8", 0.7, 0.35, (c) => cabinet(0.45, 1.3, 0.6, c, 0, 4));
  add("printer", "Printer", H, "Office", "Things", "printer copier paper print", "#d8d8d4", 0.15, 0.3, (c) => [box(0.45, 0.22, 0.38, 0, 0.11, 0, c), box(0.3, 0.01, 0.15, 0, 0.225, -0.05, WH, { rx: -15 }), box(0.3, 0.02, 0.12, 0, 0.06, 0.24, WH), quad(0.08, 0.04, 0.15, 0.17, 0.191, "#7ae0a0", { glow: true })]);
  add("water-cooler", "Water cooler", H, "Office", "Things", "water dispenser cooler drink", "#f4f4f0", 1, 0.25, (c) => [box(0.32, 1, 0.32, 0, 0.5, 0, c), cyl(0.13, 0.4, 0, 1, 0, "#7fc4e8", { glass: true }), box(0.04, 0.04, 0.05, -0.06, 0.8, 0.18, "#2e6db0"), box(0.04, 0.04, 0.05, 0.06, 0.8, 0.18, RD)]);
  add("whiteboard", "Whiteboard", H, "Office", "Things", "white board marker board school", "#9aa0a8", 1.2, 0.7, (c) => [box(1.5, 0.9, 0.04, 0, 1.35, 0, c), quad(1.42, 0.82, 0, 1.35, 0.021, WH), box(0.04, 1.8, 0.04, -0.6, 0.9, -0.03, c), box(0.04, 1.8, 0.04, 0.6, 0.9, -0.03, c), box(1.3, 0.04, 0.5, 0, 0.02, 0, c), box(0.5, 0.02, 0.01, -0.2, 1.5, 0.025, "#2e6db0"), box(0.3, 0.02, 0.01, 0.3, 1.3, 0.025, RD)]);

  /* Household animals, bugs and people */
  add("house-cat", "Cat", H, "Living room|Bedroom|Kitchen|Yard", "Animals", "cat kitten kitty pet tabby", "#e09a4a", 0.25, 0.3, (c) => animal(c, { L: 0.45, W: 0.16, T: 0.16, leg: 0.15, head: 0.14, ears: [0.04, 0.05], tail: [0.03, 0.35, 0, -50] }));
  add("pet-dog", "Dog", H, "Living room|Yard|Kitchen", "Animals", "dog puppy pup pet hound doggy", "#c8964f", 0.45, 0.45, (c) => animal(c, { L: 0.7, W: 0.25, T: 0.25, leg: 0.3, head: 0.22, snout: shade(c, -0.2), ears: [0.07, 0.1], earc: shade(c, -0.3), tail: [0.05, 0.3, 0, -40] }));
  add("cockroach", "Cockroach", H, "Kitchen|Bathroom|Garage", "Animals", "roach bug insect pest", "#5a2e14", 0.01, 0.03, (c) => scale(insect(c, { wings: shade(c, 0.1), solid: true }), 0.045));
  add("spider", "Spider", H, "Garage|Bedroom|Bathroom", "Animals", "spider bug arachnid creepy", "#2a2420", 0.01, 0.04, (c) => scale([ball(0.3, 0, 0.35, -0.2, c), ball(0.18, 0, 0.32, 0.18, c), ...[-0.1, 0.05, 0.2, 0.35].map((z, i) => box(1.3, 0.03, 0.03, 0, 0.3, z, c, { ry: (i - 1.5) * 20 })), ...eyes(0.06, 0.05, 0.38, 0.33)], 0.035));
  person("parent", "Parent", H, "Living room|Kitchen|Bedroom|Yard|Garage", "mom dad mother father adult grown-up", "#8e5aa8", "#2d2f3a", "#c98d63", "#3b2416");
  person("kid", "Kid", H, "Living room|Bedroom|Yard|Kitchen", "kid child boy girl son daughter", "#e3a33a", "#3a5a8a", "#e0b48c", "#6b3f22");
  person("grandparent", "Grandparent", H, "Living room|Kitchen|Yard", "grandma grandpa granny old elderly", "#7a8a6a", "#4a4a52", "#e8c4a4", "#d8d8d8");
  person("office-worker", "Office worker", H, "Office", "worker clerk employee desk job", "#5a7d9a", "#2d2f3a", "#a86b45", "#1d1712");

  /* City / Street vehicles */
  add("car", "Car", C, "Street|Shops", "Vehicles", "car auto automobile sedan vehicle drive", "#3a6ea5", 0.8, 2.3, (c) => car(c));
  add("taxi", "Taxi", C, "Street|Station", "Vehicles", "taxi cab car hire auto", "#f2c418", 0.8, 2.3, (c) => car(c, { extra: [box(0.5, 0.18, 0.2, 0, 1.6, -0.25, "#fff6c8", { glow: true }), box(1.82, 0.12, 4.0, 0, 0.75, 0, BK)] }));
  add("police-car", "Police car", C, "Street", "Vehicles", "cop car patrol police auto siren", "#f4f4f0", 0.8, 2.3, (c) => car(c, { extra: [box(1.82, 0.3, 2.2, 0, 0.7, 0, "#1c2e5a"), box(0.35, 0.12, 0.2, -0.2, 1.62, -0.25, "#2e6dff", { glow: true }), box(0.35, 0.12, 0.2, 0.2, 1.62, -0.25, "#ff3030", { glow: true })] }));
  add("bus", "Bus", C, "Street|Station", "Vehicles", "bus coach public transport", "#d1332e", 1.5, 6, (c) => [box(2.5, 2.7, 11, 0, 1.75, 0, c), box(2.52, 0.9, 10, 0, 2.3, -0.2, GL, { glass: true }), quad(2.2, 1.3, 0, 2.2, 5.51, GL, { glass: true }), quad(1.4, 0.3, 0, 3.0, 5.52, "#ffb000", { glow: true }), ...[-1, 1].map((s) => box(0.3, 0.15, 0.03, s * 0.9, 0.8, 5.51, LT, { glow: true })), ...corners(2.2, 7, (x, z) => wheel(x, z, 0.5, 0.3))]);
  add("truck", "Truck", C, "Street|Building site", "Vehicles", "lorry truck delivery van hgv", "#3a6ea5", 1.5, 4, (c) => truck(c, "#e8e8e4"));
  add("garbage-truck", "Garbage truck", C, "Street", "Vehicles", "bin lorry trash truck refuse rubbish dustcart", "#3f8f4f", 1.5, 4, (c) => truck(c, shade(c, -0.15), { extra: [box(2.2, 0.1, 0.6, 0, 1.2, -3.4, "#f2c418")] }));
  add("ambulance", "Ambulance", C, "Street", "Vehicles", "ambulance emergency medic hospital van", "#f4f4f0", 1.3, 3.5, (c) => truck(c, c, { L: 6, ch: 2.2, extra: [box(2.42, 0.25, 4, 0, 1.6, -1.1, RD), box(0.6, 0.15, 0.25, -0.5, 3.0, 0, "#2e6dff", { glow: true }), box(0.6, 0.15, 0.25, 0.5, 3.0, 0, "#ff3030", { glow: true }), quad(0.6, 0.15, 0, 2.2, -4.11, RD), quad(0.15, 0.6, 0, 2.2, -4.12, RD)] }));
  add("fire-truck", "Fire truck", C, "Street", "Vehicles", "fire engine firetruck ladder emergency", "#c8201c", 1.6, 4.5, (c) => truck(c, c, { L: 8, ch: 1.8, extra: [box(0.15, 0.15, 6.5, -0.4, 2.85, -0.8, "#d8d8d4"), box(0.15, 0.15, 6.5, 0.4, 2.85, -0.8, "#d8d8d4"), ...[-3, -2, -1, 0, 1, 2].map((z) => box(0.8, 0.08, 0.08, 0, 2.85, z, "#d8d8d4")), box(1, 0.15, 0.3, 0, 2.7, 3.3, "#2e6dff", { glow: true }), box(2.42, 0.15, 5.8, 0, 1.4, -1.1, WH)] }));
  add("motorbike", "Motorbike", C, "Street", "Vehicles", "motorcycle motorbike bike moped", "#1f1f22", 0.7, 1.1, (c) => bike(c, true));
  add("scooter", "Scooter", C, "Street|Park", "Vehicles", "kick scooter push scooter e-scooter", "#2bb0a8", 0.5, 0.6, (c) => [box(0.15, 0.04, 0.7, 0, 0.1, 0, c), cylX(0.08, 0.04, 0, 0.08, 0.38, BK), cylX(0.08, 0.04, 0, 0.08, -0.35, BK), box(0.04, 0.95, 0.04, 0, 0.55, 0.38, c, { rx: 8 }), box(0.45, 0.03, 0.03, 0, 1.02, 0.44, DK)]);
  add("city-bicycle", "Bicycle", C, "Street|Park", "Vehicles", "bike bicycle cycle pedal", "#2e6db0", 0.6, 0.9, (c) => bike(c));
  add("tram", "Tram", C, "Street|Station", "Vehicles", "tram streetcar trolley light rail", "#e0b23a", 1.6, 7, (c) => [box(2.4, 2.8, 14, 0, 1.9, 0, c), box(2.42, 1, 13, 0, 2.4, 0, GL, { glass: true }), box(0.06, 1.2, 0.06, 0, 3.9, 0, DK, { rx: 30 }), box(1.2, 0.06, 0.1, 0, 4.4, -0.3, DK), box(2.2, 0.3, 14, 0, 0.35, 0, DK)]);

  /* City / Street signs and furniture */
  add("street-sign", "Street sign", C, "Street", "Signs & street", "street name sign road sign post", "#2e7d32", 2.4, 0.3, (c) => [box(0.07, 2.6, 0.07, 0, 1.3, 0, MT), box(0.9, 0.22, 0.03, 0.4, 2.45, 0, c), quad(0.82, 0.04, 0.4, 2.45, 0.016, WH)]);
  add("stop-sign", "Stop sign", C, "Street", "Signs & street", "stop sign road sign traffic halt", "#c8201c", 2, 0.3, (c) => [box(0.07, 2.2, 0.07, 0, 1.1, 0, MT), box(0.6, 0.6, 0.03, 0, 2.1, 0.04, WH), box(0.6, 0.6, 0.03, 0, 2.1, 0.04, WH, { rz: 45 }), box(0.54, 0.54, 0.03, 0, 2.1, 0.05, c), box(0.54, 0.54, 0.03, 0, 2.1, 0.05, c, { rz: 45 }), quad(0.36, 0.1, 0, 2.1, 0.07, WH)]);
  add("traffic-light", "Traffic light", C, "Street", "Signs & street", "traffic signal stoplight lights junction", "#2b2d31", 2.6, 0.3, (c) => [box(0.12, 2.6, 0.12, 0, 1.3, 0, c), box(0.35, 0.95, 0.3, 0, 3.05, 0, c), cylZ(0.1, 0.03, 0, 3.35, 0.15, "#ff3030", { glow: true }), cylZ(0.1, 0.03, 0, 3.05, 0.15, "#5a4a1a"), cylZ(0.1, 0.03, 0, 2.75, 0.15, "#1a4a2a")]);
  add("street-lamp", "Street lamp", C, "Street|Park", "Signs & street", "lamp post street light lamppost", "#3a3a40", 3.5, 0.4, (c) => lampPost(c, 4.5));
  add("fire-hydrant", "Fire hydrant", C, "Street", "Signs & street", "hydrant fireplug water pump", "#d12a20", 0.4, 0.25, (c) => [cyl(0.13, 0.55, 0, 0.05, 0, c), cyl(0.17, 0.05, 0, 0, 0, c), ball(0.13, 0, 0.6, 0, c), cyl(0.04, 0.06, 0, 0.7, 0, c), cylX(0.05, 0.4, 0, 0.42, 0, shade(c, -0.15)), cylZ(0.06, 0.1, 0, 0.42, 0.15, shade(c, -0.15))]);
  add("street-bin", "Trash can", C, "Street|Park|Station", "Signs & street", "bin trash can litter garbage rubbish waste", "#3a5a3a", 0.5, 0.3, (c) => binP(c));
  add("city-mailbox", "Mailbox", C, "Street", "Signs & street", "post box postbox letterbox mail letters", "#2a4a9a", 0.7, 0.35, (c) => [box(0.5, 0.95, 0.5, 0, 0.55, 0, c), cylZ(0.25, 0.5, 0, 1.02, 0, c), quad(0.3, 0.04, 0, 0.9, 0.255, BK), ...legs(0.5, 0.5, 0.08, 0.05, DK)]);
  add("bus-stop", "Bus stop", C, "Street", "Signs & street", "bus shelter stop wait", "#3a3a40", 1.5, 1.6, (c) => [box(2.6, 0.08, 1.3, 0, 2.4, 0, c), box(0.08, 2.4, 0.08, -1.25, 1.2, -0.55, c), box(0.08, 2.4, 0.08, 1.25, 1.2, -0.55, c), box(2.5, 1.9, 0.03, 0, 1.25, -0.6, GL, { glass: true }), box(1.8, 0.05, 0.35, 0, 0.45, -0.35, MT), box(0.06, 2.6, 0.06, 1.5, 1.3, 0.5, MT), cylZ(0.25, 0.03, 1.5, 2.7, 0.5, "#2e6db0")]);
  add("street-bench", "Bench", C, "Street|Station|Shops", "Signs & street", "bench seat sit public", "#7a5a3a", 0.5, 0.9, (c) => bench(c));
  add("crosswalk", "Crosswalk", C, "Street", "Signs & street", "zebra crossing pedestrian crossing road stripes", "#f4f4f0", 0, 3.5, (c) => [flat(4, 7, 0, 0.005, 0, "#3a3c40"), ...[-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7].map((x) => flat(0.5, 3, x, 0.008, 0, c))].map((p) => Object.assign(p, { ry: 90, pivot: [0, 0, 0] })));
  add("road", "Road piece", C, "Street", "Signs & street", "road street tarmac asphalt lane", "#3a3c40", 0, 5, (c) => [flat(7, 10, 0, 0.005, 0, c), ...[-4, -1.5, 1, 3.5].map((z) => flat(0.15, 1.5, 0, 0.008, z, "#f4f1ea")), flat(0.12, 10, -3.2, 0.008, 0, "#f4f1ea"), flat(0.12, 10, 3.2, 0.008, 0, "#f4f1ea")]);
  add("sidewalk", "Sidewalk piece", C, "Street|Shops", "Signs & street", "pavement sidewalk footpath kerb curb", "#b8b5ad", 0, 5, (c) => [box(3, 0.15, 10, 0, 0.075, 0, c), ...[-3, -1, 1, 3].map((z) => flat(3, 0.04, 0, 0.152, z, shade(c, -0.2))), box(0.2, 0.16, 10, 1.5, 0.08, 0, shade(c, -0.1))]);
  add("manhole", "Manhole", C, "Street", "Signs & street", "manhole cover drain sewer", "#45474b", 0, 0.4, (c) => [cyl(0.35, 0.02, 0, 0, 0, c), ...[-0.15, 0, 0.15].map((z) => flat(0.5, 0.03, 0, 0.022, z, shade(c, -0.3)))]);
  add("parking-meter", "Parking meter", C, "Street|Shops", "Signs & street", "parking meter pay park coin", "#7d8590", 1.2, 0.2, (c) => [box(0.08, 1.1, 0.08, 0, 0.55, 0, DK), box(0.22, 0.35, 0.15, 0, 1.25, 0, c), quad(0.14, 0.08, 0, 1.3, 0.076, "#7ae0a0", { glow: true }), box(0.03, 0.06, 0.01, 0, 1.18, 0.08, BK)]);
  add("newsstand", "Newsstand", C, "Street|Station|Shops", "Buildings", "kiosk news stand magazines newspaper", "#2e6b4a", 1.2, 1.2, (c) => [box(2, 2.2, 1.4, 0, 1.1, 0, c), wedge(2.2, 0.3, 0.6, 0, 2.35, 0.9, "#e0b23a"), quad(1.6, 0.9, 0, 1.3, 0.71, "#f4f1ea"), ...[-0.55, -0.15, 0.25, 0.6].map((x, i) => quad(0.3, 0.4, x, 1.35, 0.72, ["#d1332e", "#2e6db0", "#e0b23a", "#6c4fa0"][i])), box(2.1, 0.08, 0.4, 0, 0.9, 0.85, WD)]);
  add("phone-booth", "Phone booth", C, "Street", "Signs & street", "telephone box phone box call kiosk", "#c8201c", 1.2, 0.6, (c) => [box(0.9, 0.1, 0.9, 0, 0.05, 0, c), ...corners(0.85, 0.85, (x, z) => box(0.08, 2.2, 0.08, x, 1.15, z, c)), box(0.8, 2.0, 0.8, 0, 1.15, 0, GL, { glass: true }), box(0.95, 0.25, 0.95, 0, 2.35, 0, c), quad(0.6, 0.12, 0, 2.35, 0.48, "#f4f1ea", { glow: true }), box(0.2, 0.3, 0.1, 0, 1.4, -0.32, DK)]);

  /* City people */
  person("police-officer", "Police officer", C, "Street|Station|Shops|Park", "police officer cop policeman policewoman", "#23395b", "#1c2333", "#c98d63", "#1d1712");
  person("garbage-collector", "Garbage collector", C, "Street", "bin man refuse collector sanitation worker trash", "#ff8c1a", "#2f4a2f", "#8d5a3b", "#1d1712");
  person("pedestrian", "Pedestrian", C, "Street|Shops|Park|Station", "walker passer-by person man woman", "#4a7bd0", "#2d2f3a", "#e0b48c", "#5a3a22");
  person("child", "Child", C, "Street|Park|Shops", "child kid boy girl", "#e85a7a", "#3a5a8a", "#c98d63", "#2a1a10");
  person("driver", "Driver", C, "Street|Station", "driver chauffeur cabbie bus driver", "#6a7a8a", "#2d2f3a", "#a86b45", "#1d1712");
  person("construction-worker", "Construction worker", C, "Building site|Street", "builder construction worker hard hat labourer", "#f5c518", "#3a4a6a", "#c98d63", "#5a3a22");
  person("jogger", "Jogger", C, "Park|Street", "jogger runner running sport", "#2bb0a8", "#1f1f22", "#e0b48c", "#a8743f");
  person("businessperson", "Businessperson", C, "Street|Station|Shops", "business man woman suit office worker", "#2f3640", "#2f3640", "#c98d63", "#1d1712");
  person("delivery-person", "Delivery person", C, "Street|Shops", "courier delivery driver postman mail carrier", "#c0392b", "#2d2f3a", "#8d5a3b", "#1d1712");
  person("street-musician", "Street musician", C, "Street|Park|Station", "busker musician guitar player", "#7a4a9a", "#3a3a3a", "#e0b48c", "#a8743f");
  person("elderly-person", "Elderly person", C, "Street|Park|Shops", "old man old woman senior grandma grandpa elderly", "#8a7a6a", "#4a4a52", "#e8c4a4", "#e0e0e0");
  person("firefighter", "Firefighter", C, "Street", "firefighter fireman firewoman", "#c9a227", "#c9a227", "#c98d63", "#1d1712");
  person("chef", "Chef", C, "Shops", "chef cook baker kitchen", "#f5f5f0", "#2d2f3a", "#e0b48c", "#3b2416");
  person("doctor", "Doctor", C, "Street|Shops", "doctor nurse medic hospital", "#e8f1f2", "#4aa3a2", "#8d5a3b", "#1d1712");
  person("shopkeeper", "Shopkeeper", C, "Shops", "shopkeeper cashier clerk seller", "#3f8f4f", "#2d2f3a", "#c98d63", "#2a1a10");

  /* City animals */
  add("pigeon", "Pigeon", C, "Street|Park|Station|Rooftops", "Animals", "pigeon dove bird", "#8a8f9a", 0.15, 0.15, (c) => scale(bird(c, { head: "#5a6a7a", beak: "#e08a8a" }), 0.32));
  add("rat", "Rat", C, "Street|Station", "Animals", "rat mouse rodent vermin", "#6a5f55", 0.06, 0.12, (c) => animal(c, { L: 0.2, W: 0.08, T: 0.07, leg: 0.03, head: 0.06, ears: [0.03, 0.03], earc: "#e0a0a0", tail: [0.01, 0.2, 0, -5], tailc: "#e0a0a0" }));
  add("stray-cat", "Stray cat", C, "Street|Rooftops|Park", "Animals", "cat alley cat stray kitty", "#5a5a5a", 0.25, 0.3, (c) => animal(c, { L: 0.45, W: 0.16, T: 0.16, leg: 0.15, head: 0.14, ears: [0.04, 0.05], tail: [0.03, 0.35, 0, -50] }));
  add("dog", "Dog", C, "Street|Park", "Animals", "dog puppy pup hound doggy pet", "#8a6a4a", 0.45, 0.45, (c) => animal(c, { L: 0.7, W: 0.25, T: 0.25, leg: 0.3, head: 0.22, snout: shade(c, -0.2), ears: [0.07, 0.1], earc: shade(c, -0.3), tail: [0.05, 0.3, 0, -40] }));
  const squirrelP = (c) => animal(c, { L: 0.22, W: 0.1, T: 0.1, leg: 0.05, head: 0.08, ears: [0.025, 0.04], tail: [0.08, 0.25, 0.05, -70], tailc: shade(c, 0.1) });
  add("park-squirrel", "Squirrel", C, "Park", "Animals", "squirrel rodent nuts tree", "#a8643a", 0.12, 0.15, squirrelP);

  /* City buildings */
  add("apartment-block", "Apartment block", C, "Street|Shops", "Buildings", "flats apartments housing block building", "#b5826a", 6, 6, (c) => tower(10, 18, 9, c, { extra: [box(10.4, 0.4, 9.4, 0, 18.2, 0, shade(c, -0.3)), ...[6, 9, 12, 15].map((y) => box(2, 0.1, 0.8, -2.5, y - 0.6, 4.9, MT))] }));
  add("skyscraper", "Skyscraper", C, "Street|Rooftops", "Buildings", "skyscraper tower high rise building", "#5a7088", 20, 9, (c) => tower(16, 80, 16, c, { rows: 18, extra: [box(10, 6, 10, 0, 83, 0, shade(c, -0.2)), box(0.4, 10, 0.4, 0, 91, 0, MT), ball(0.4, 0, 96, 0, "#ff3030", { glow: true })] }));
  add("shop", "Shop", C, "Shops|Street", "Buildings", "store shop boutique market grocery", "#d8c8a8", 2.5, 4, (c) => [box(6, 4, 5, 0, 2, 0, c), quad(4, 2.2, -0.5, 1.3, 2.51, GL, { glass: true, glow: true }), quad(1, 2.2, 2.2, 1.1, 2.51, DK), wedge(6.2, 0.6, 1.2, 0, 2.9, 3.1, "#d1332e", { ry: 180 }), quad(4, 0.6, 0, 3.6, 2.52, "#ff8a3d", { glow: true }), box(6.2, 0.3, 5.2, 0, 4.1, 0, shade(c, -0.3))]);
  add("cafe", "Cafe", C, "Shops|Street", "Buildings", "cafe coffee shop restaurant bistro diner", "#a86b45", 2.5, 4.5, (c) => [box(6, 3.8, 5, 0, 1.9, -1, c), quad(3.6, 2, -0.6, 1.3, 1.51, GL, { glass: true, glow: true }), quad(1, 2.2, 2.2, 1.1, 1.51, DK), wedge(6.2, 0.5, 1.5, 0, 2.8, 2.2, "#3f8f4f", { ry: 180 }), quad(3, 0.5, 0, 3.4, 1.52, "#ffd24f", { glow: true }), ...[-1.5, 1].map((x) => [...table(0.6, 0.6, 0.72, DK).map((p) => Object.assign(p, { at: [p.at[0] + x, p.at[1], p.at[2] + 2.8] })), cyl(0.04, 1.8, x, 0, 2.8, MT), cone(0.9, 0.4, x, 1.8, 2.8, WH)]).flat()]);
  add("office-tower", "Office tower", C, "Street", "Buildings", "office building tower business glass", "#6f8fa8", 12, 7, (c) => tower(14, 40, 12, c, { rows: 12, extra: [box(14.2, 1, 12.2, 0, 40.5, 0, shade(c, -0.3)), box(3, 2, 3, 3, 42, 0, MT)] }));
  add("house-row", "Row of houses", C, "Street", "Buildings", "terraced houses townhouses row homes", "#b5826a", 4, 7, (c) => [-4.5, 0, 4.5].map((x, i) => house(4.4, 6, 7, i === 1 ? shade(c, 0.2) : c, "#5a3e2b", { rh: 2 }).map((p) => Object.assign(p, { at: [p.at[0] + x, p.at[1], p.at[2]] }))).flat());
  add("church", "Church", C, "Street", "Buildings", "church chapel steeple spire bell tower", "#c8c0b0", 6, 7, (c) => [...house(8, 7, 12, c, "#5a5a62", { rh: 3, nowin: true }).map((p) => Object.assign(p, { at: [p.at[0], p.at[1], p.at[2] - 3] })), box(3.5, 12, 3.5, 0, 6, 4.5, c), cone(2.4, 7, 0, 12, 4.5, "#5a5a62"), quad(1.4, 2.6, 0, 1.3, 6.26, "#5a3e2b"), cylZ(0.8, 0.05, 0, 9, 6.26, "#f4f1ea"), box(0.15, 1.2, 0.15, 0, 19.6, 4.5, "#c9a227"), box(0.7, 0.15, 0.15, 0, 19.8, 4.5, "#c9a227")]);
  add("warehouse", "Warehouse", C, "Street|Building site", "Buildings", "warehouse depot factory storage shed", "#8a9098", 5, 9, (c) => [box(16, 8, 12, 0, 4, 0, c), box(16.4, 0.5, 12.4, 0, 8.25, 0, shade(c, -0.3)), quad(5, 5, -3, 2.5, 6.01, shade(c, -0.2)), ...[0.6, 1.2, 1.8, 2.4, 3.0, 3.6, 4.2].map((y) => quad(5, 0.05, -3, y, 6.02, DK)), quad(1, 2.2, 4, 1.1, 6.01, DK), quad(12, 0.8, 0, 6.8, 6.01, GL, { glass: true })]);
  add("tall-apartment", "Tall apartments", C, "Street|Rooftops", "Buildings", "highrise flats apartment tower", "#9a8a7a", 12, 7, (c) => tower(12, 36, 12, c, { rows: 12, extra: [box(12.4, 0.5, 12.4, 0, 36.25, 0, shade(c, -0.3))] }));

  /* City / Park */
  add("park-tree", "Tree", C, "Park|Street", "Nature", "tree leafy shade park", "#3f8f4f", 2.5, 1.5, (c) => tree("oak", c, 6));
  add("park-bench", "Park bench", C, "Park", "Furniture", "bench seat park sit", "#3f6a3f", 0.5, 0.9, (c) => bench(c));
  add("fountain", "Fountain", C, "Park|Shops", "Things", "fountain water feature spray plaza", "#c8c0b0", 1.2, 2.2, (c) => [cyl(2, 0.5, 0, 0, 0, c), cyl(1.85, 0.05, 0, 0.42, 0, "#6fb6d8", { glass: true }), cyl(0.2, 1.4, 0, 0.4, 0, c), cyl(0.8, 0.15, 0, 1.5, 0, c), cone(0.3, 0.8, 0, 1.6, 0, "#a8daf0", { glass: true }), cone(0.75, 0.35, 0, 0.45, 0, "#a8daf0", { glass: true })]);
  add("park-pond", "Pond", C, "Park", "Nature", "pond pool water duck pond", "#4a9ac0", 0.1, 3, (c) => pondP(c, 2.8));
  add("slide", "Playground slide", C, "Park", "Things", "slide playground play kids", "#e0402a", 1, 1.5, (c) => slideP(c));
  add("swing", "Swing", C, "Park", "Things", "swing swings playground play", "#2e6db0", 1.5, 1.6, (c) => swingP(c, 1));
  add("picnic-table", "Picnic table", C, "Park", "Furniture", "picnic table bench outdoor table", "#8a5a34", 0.75, 1.2, (c) => [box(1.8, 0.05, 0.8, 0, 0.75, 0, c), box(1.8, 0.05, 0.3, 0, 0.45, 0.6, c), box(1.8, 0.05, 0.3, 0, 0.45, -0.6, c), ...[-0.7, 0.7].map((x) => [box(0.08, 0.95, 0.08, x, 0.4, 0.25, c, { rx: 30 }), box(0.08, 0.95, 0.08, x, 0.4, -0.25, c, { rx: -30 }), box(0.08, 0.06, 1.5, x, 0.42, 0, c)]).flat()]);
  add("statue", "Statue", C, "Park|Shops", "Things", "statue sculpture monument memorial", "#9aa49a", 2.2, 0.9, (c) => [box(1.4, 1.2, 1.4, 0, 0.6, 0, "#c8c0b0"), box(1.6, 0.1, 1.6, 0, 1.25, 0, "#c8c0b0"), ...move(statueFig(c), 0, 1.3, 0)]);
  add("park-bush", "Bush", C, "Park|Street", "Nature", "bush shrub hedge plant", "#3a7a3a", 0.5, 0.8, (c) => bushP(c, 1.2));
  add("park-flowers", "Flower bed", C, "Park", "Nature", "flowers flower bed garden tulips", "#e85a9a", 0.3, 1.2, (c) => [cyl(1.1, 0.2, 0, 0, 0, "#9a8a7a"), cyl(1.0, 0.03, 0, 0.2, 0, "#4b3424"), ...move(flowers(c, 1.3, 1.3, 12), 0, 0.2, 0)]);
  add("hedge", "Hedge", C, "Park|Street", "Nature", "hedge hedgerow bush wall green", "#2f6a34", 0.6, 1.2, (c) => [box(2.4, 1.1, 0.7, 0, 0.55, 0, c), box(2.3, 0.1, 0.6, 0, 1.15, 0, shade(c, 0.1))]);

  /* City / Building site */
  add("crane", "Crane", C, "Building site", "Vehicles", "tower crane construction lift", "#f2c418", 15, 3, (c) => [box(4, 1, 4, 0, 0.5, 0, "#8a9098"), box(1.4, 30, 1.4, 0, 16, 0, c), box(2.4, 2, 2.4, 0, 31, 0, c), box(2, 1.6, 1.6, 0.9, 30.6, 1.5, "#d8d8d4"), box(1.2, 1.2, 30, 0, 32.6, 10, c), box(1.2, 1.2, 9, 0, 32.6, -5.5, c), box(2, 2.5, 3, 0, 31.5, -8, "#8a9098"), box(0.05, 12, 0.05, 0, 26, 20, BK), box(0.6, 0.6, 0.6, 0, 20, 20, "#d12a20"), cone(1, 3, 0, 33.2, 0, c)]);
  add("traffic-cone", "Traffic cone", C, "Building site|Street", "Signs & street", "cone traffic cone pylon roadworks", "#ff6a1a", 0.35, 0.25, (c) => [box(0.4, 0.04, 0.4, 0, 0.02, 0, c), cone(0.16, 0.7, 0, 0.04, 0, c), cyl(0.105, 0.1, 0, 0.3, 0, WH)]);
  add("barrier", "Barrier", C, "Building site|Street", "Signs & street", "road barrier roadblock barricade works", "#e0402a", 0.7, 0.9, (c) => [...[-0.6, -0.2, 0.2, 0.6].map((x, i) => box(0.4, 0.22, 0.05, x, 0.9, 0, i % 2 ? WH : c)), ...[-0.75, 0.75].map((x) => [box(0.06, 1, 0.06, x, 0.5, 0, MT), box(0.06, 0.06, 0.5, x, 0.03, 0, MT)]).flat()]);
  add("scaffold", "Scaffold", C, "Building site", "Things", "scaffolding scaffold poles planks", "#9aa0a8", 3, 2, (c) => [...[-1.5, 0, 1.5].map((x) => [box(0.06, 6, 0.06, x, 3, 0.5, c), box(0.06, 6, 0.06, x, 3, -0.5, c)]).flat(), ...[2, 4].map((y) => box(3.1, 0.06, 1.1, 0, y, 0, "#b5895a")), ...[1, 3, 5].map((y) => box(3, 0.05, 0.05, 0, y, 0.5, c)), box(3.4, 0.05, 0.05, 0, 3, 0.52, c, { rz: 60 })]);
  add("digger", "Digger", C, "Building site", "Vehicles", "excavator digger backhoe construction", "#f2c418", 1.6, 3, (c) => [box(0.6, 0.8, 3.6, -1.1, 0.4, 0, DK), box(0.6, 0.8, 3.6, 1.1, 0.4, 0, DK), box(2.4, 0.9, 2.6, 0, 1.25, -0.2, c), box(1.2, 1.4, 1.2, -0.5, 2.3, 0.4, c), box(1.15, 1.2, 1.18, -0.5, 2.3, 0.42, GL, { glass: true }), box(0.4, 0.4, 3, 0.6, 2.6, 1.8, c, { rx: -30, pivot: [0.6, 1.8, 0.4] }), box(0.35, 0.35, 2.2, 0.6, 3.1, 3.6, c, { rx: 50, pivot: [0.6, 3.4, 2.8] }), box(0.9, 0.6, 0.6, 0.6, 0.6, 4.2, shade(c, -0.3))]);
  add("cement-mixer", "Cement mixer", C, "Building site", "Vehicles", "concrete mixer cement truck", "#e8e8e4", 1.6, 4, (c) => truck(c, c, { ch: 0.1, extra: [cylZ(1.1, 3.6, 0, 2.3, -1.2, "#e07a3f", { rx: 80 }), cone(1.0, 1.2, 0, 2.6, 0.6, "#e07a3f", { rx: 80, pivot: [0, 2.3, 0.6] })] }));
  add("bricks", "Pile of bricks", C, "Building site", "Things", "bricks brick pile pallet building materials", "#b5533a", 0.4, 0.7, (c) => [box(1.1, 0.12, 1.1, 0, 0.06, 0, WD), ...[0, 1, 2].map((r) => box(1, 0.2, 1, 0, 0.22 + r * 0.2, 0, r % 2 ? shade(c, -0.1) : c)), box(0.6, 0.2, 0.5, 0.1, 0.82, 0.1, c)]);
  add("dumpster", "Skip", C, "Building site|Street", "Signs & street", "skip dumpster rubble container waste", "#e0b23a", 0.7, 1.6, (c) => [box(1.8, 1.2, 3.2, 0, 0.6, 0, c), wedge(1.8, 1.2, 0.6, 0, 0.6, 1.9, c, { ry: 180 }), wedge(1.8, 1.2, 0.6, 0, 0.6, -1.9, c), flat(1.6, 3, 0, 1.0, 0, "#7a6a5a")]);

  /* City / Station and Rooftops */
  add("train", "Train", C, "Station", "Vehicles", "train locomotive railway carriage subway metro", "#2e6db0", 2, 8, (c) => [box(3, 3.6, 18, 0, 2.2, -1, c), wedge(3, 1.6, 2, 0, 3.2, 9, c, { ry: 180 }), box(3, 2, 2, 0, 1.4, 9, c), quad(2.4, 1, 0, 3.2, 10.05, GL, { glass: true, rx: -38 }), box(3.02, 1, 16, 0, 2.9, -1, GL, { glass: true }), box(3.02, 0.3, 18, 0, 1.6, -1, WH), ...[-1, 1].map((s) => box(0.35, 0.2, 0.05, s * 1, 1.2, 10.01, LT, { glow: true })), box(2.6, 0.5, 18, 0, 0.25, -1, DK)]);
  add("platform", "Platform", C, "Station", "Buildings", "railway platform station train", "#b8b5ad", 1, 6, (c) => [box(4, 1.1, 14, 0, 0.55, 0, c), flat(0.3, 14, 1.7, 1.102, 0, "#f2c418"), ...[-5, 0, 5].map((z) => box(0.15, 3, 0.15, -1, 2.6, z, DK)), box(3, 0.15, 14, -0.6, 4.1, 0, "#5a6a7a"), box(1.2, 0.3, 0.05, -1, 3.4, 0.1, "#1c2e5a"), quad(1, 0.15, -1, 3.4, 0.13, "#f2c418", { glow: true })]);
  add("ticket-machine", "Ticket machine", C, "Station", "Signs & street", "ticket machine kiosk vending pay", "#3a5a8a", 1.4, 0.4, (c) => [box(0.7, 1.7, 0.45, 0, 0.85, 0, c), quad(0.45, 0.35, 0, 1.3, 0.226, "#7fd0ff", { glow: true }), quad(0.3, 0.2, 0, 0.9, 0.226, "#2b2d31"), box(0.12, 0.04, 0.05, 0.15, 0.65, 0.24, BK)]);
  add("water-tower", "Water tower", C, "Rooftops", "Buildings", "water tower tank rooftop", "#8a5a34", 3.5, 1.6, (c) => [...corners(2, 2, (x, z) => box(0.12, 2.4, 0.12, x, 1.2, z, DK)), cyl(1.4, 2.4, 0, 2.4, 0, c), cone(1.5, 1, 0, 4.8, 0, shade(c, -0.25)), ...[2.8, 3.6, 4.4].map((y) => cyl(1.42, 0.06, 0, y, 0, MT))]);
  add("ac-unit", "AC unit", C, "Rooftops", "Things", "air conditioner aircon hvac vent fan", "#c8ccd0", 0.6, 0.8, (c) => [box(1.2, 0.8, 0.9, 0, 0.4, 0, c), cyl(0.35, 0.02, 0, 0.8, 0, DK), box(0.65, 0.03, 0.06, 0, 0.83, 0, MT, { ry: 30 }), box(0.65, 0.03, 0.06, 0, 0.83, 0, MT, { ry: 120 }), quad(1, 0.5, 0, 0.4, 0.451, shade(c, -0.2))]);
  add("antenna", "Antenna", C, "Rooftops", "Things", "aerial antenna tv aerial mast radio", "#9aa0a8", 1.5, 0.5, (c) => [box(0.06, 3, 0.06, 0, 1.5, 0, c), ...[2, 2.4, 2.8].map((y, i) => box(1 - i * 0.2, 0.04, 0.04, 0, y, 0, c)), box(0.5, 0.05, 0.5, 0, 0.025, 0, DK)]);
  add("satellite-dish", "Satellite dish", C, "Rooftops", "Things", "satellite dish tv receiver", "#e8e8e4", 0.8, 0.5, (c) => [box(0.08, 0.8, 0.08, 0, 0.4, 0, MT), cyl(0.4, 0.06, 0, 0.95, 0, c, { rx: 60, pivot: [0, 0.95, 0] }), box(0.03, 0.03, 0.4, 0, 1.05, 0.25, MT, { rx: 30 }), box(0.06, 0.06, 0.06, 0, 1.15, 0.42, DK)]);
  add("billboard", "Billboard", C, "Rooftops|Street", "Signs & street", "billboard advert poster hoarding sign", "#2b2d31", 5, 3, (c) => [box(0.3, 4, 0.3, -2, 2, 0, c), box(0.3, 4, 0.3, 2, 2, 0, c), box(6.2, 3.2, 0.2, 0, 5.6, 0, c), quad(6, 3, 0, 5.6, 0.11, "#ff8a3d", { glow: true }), quad(3, 0.6, -1, 6, 0.12, WH), ball(0.6, 1.6, 5.4, 0.12, "#ffd24f")]);

  /* Country / Nature */
  add("oak-tree", "Oak tree", Co, "Forest|Farm|Field|Road", "Nature", "oak tree leafy deciduous", "#3f8f4f", 3, 2.5, (c) => tree("oak", c, 8));
  add("pine-tree", "Pine tree", Co, "Forest|Mountain|Campsite", "Nature", "pine fir spruce conifer evergreen christmas tree", "#2f6a3f", 3, 2, (c) => tree("pine", c, 9));
  add("birch-tree", "Birch tree", Co, "Forest|Field", "Nature", "birch silver birch tree white bark", "#6aa84f", 3, 1.5, (c) => tree("birch", c, 7));
  add("bush", "Bush", Co, "Forest|Field|Farm|Road", "Nature", "bush shrub plant scrub", "#3f8f4f", 0.5, 0.9, (c) => bushP(c, 1.2));
  add("rock", "Rock", Co, "Forest|Field|Mountain|Road", "Nature", "rock stone pebble", "#8a8a88", 0.2, 0.5, (c) => rockP(c, 1));
  add("boulder", "Boulder", Co, "Mountain|Forest|Field", "Nature", "boulder big rock stone crag", "#7a7a78", 1, 2, (c) => rockP(c, 3.5));
  add("log", "Log", Co, "Forest|Campsite", "Nature", "log fallen tree trunk timber wood", "#7a5232", 0.25, 1.6, (c) => [cylX(0.25, 3, 0, 0.25, 0, c), cylX(0.2, 3.02, 0, 0.25, 0, "#c9a36a"), box(0.1, 0.4, 0.06, 0.6, 0.45, 0, c, { rz: -40 })]);
  add("stump", "Tree stump", Co, "Forest", "Nature", "stump tree stump chopped", "#7a5232", 0.3, 0.4, (c) => [cyl(0.32, 0.45, 0, 0, 0, c), cyl(0.28, 0.01, 0, 0.45, 0, "#d9b98a"), ...[0, 120, 240].map((a) => box(0.12, 0.15, 0.25, 0, 0.06, 0.38, c, { ry: a, pivot: [0, 0, 0] }))]);
  add("mushroom", "Mushroom", Co, "Forest", "Nature", "mushroom toadstool fungus", "#d12a20", 0.1, 0.1, (c) => [cyl(0.025, 0.1, 0, 0, 0, "#f4f1ea"), cone(0.09, 0.07, 0, 0.09, 0, c), ball(0.012, 0.03, 0.12, 0.03, WH), ball(0.012, -0.03, 0.12, -0.02, WH), ball(0.01, 0.0, 0.14, -0.04, WH)]);
  add("tall-grass", "Tall grass", Co, "Field|Farm|Road", "Nature", "grass reeds meadow weeds", "#6aa84f", 0.4, 0.4, (c) => [-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((x, i) => box(0.03, 0.6 + (i % 3) * 0.15, 0.02, x, 0.3 + (i % 3) * 0.07, (i % 2) * 0.1 - 0.05, i % 2 ? c : shade(c, -0.15), { rz: (i - 2.5) * 6 })));
  add("wildflowers", "Flowers", Co, "Field|Farm|Forest", "Nature", "flowers wildflowers meadow daisies poppies", "#e8443a", 0.3, 0.6, (c) => flowers(c, 1, 1, 12));
  add("hill", "Hill", Co, "Field|Farm|Mountain", "Nature", "hill mound slope grassy knoll", "#6aa84f", 2, 9, (c) => [ball(10, 0, -7, 0, c)]);
  add("mountain", "Mountain", Co, "Mountain", "Nature", "mountain peak summit alps snow", "#6a6a72", 15, 30, (c) => [cone(30, 40, 0, 0, 0, c), cone(10, 13.4, 0, 26.6, 0, WH), cone(18, 22, 15, 0, -8, shade(c, -0.1))]);
  /* Country / Farm */
  add("barn", "Barn", Co, "Farm", "Buildings", "barn farm building stable", "#a8322a", 4, 7, (c) => house(9, 6, 12, c, "#4a4a52", { rh: 3.5, nowin: true, door: "#7a2420", extra: [quad(3.2, 4, 0, 2, 6.02, shade(c, -0.25)), quad(4.4, 0.25, 0, 2, 6.03, WH, { rz: 51 }), quad(4.4, 0.25, 0, 2, 6.03, WH, { rz: -51 }), quad(1.4, 1, 0, 7.3, 6.02, WH)] }));
  add("farmhouse", "Farmhouse", Co, "Farm", "Buildings", "farmhouse house home cottage", "#e8dcc4", 3, 6, (c) => house(8, 5, 7, c, "#7a3b30", { rh: 2.5, extra: [box(0.8, 3, 0.8, 2.5, 6.5, -1, "#9a5a46"), box(8, 0.15, 2, 0, 2.8, 4.5, "#5a3e2b"), box(0.15, 2.8, 0.15, -3.8, 1.4, 5.3, WH), box(0.15, 2.8, 0.15, 3.8, 1.4, 5.3, WH), box(8, 0.2, 2, 0, 0.1, 4.5, "#b5895a")] }));
  add("silo", "Silo", Co, "Farm", "Buildings", "silo grain tower storage", "#c8ccd0", 5, 2.5, (c) => [cyl(2, 10, 0, 0, 0, c), ball(2, 0, 10, 0, shade(c, -0.15)), ...[2.5, 5, 7.5].map((y) => cyl(2.03, 0.08, 0, y, 0, MT)), box(0.4, 9, 0.1, 0, 4.5, 2.02, MT)]);
  add("windmill", "Windmill", Co, "Farm|Field", "Buildings", "windmill mill sails", "#e8dcc4", 6, 3, (c) => [cone(3, 13, 0, 0, 0, c), box(2.4, 2, 2.6, 0, 9.5, 0, "#5a3e2b"), cylZ(0.3, 0.6, 0, 10, 1.5, DK), ...[0, 90, 180, 270].map((a) => box(0.9, 5, 0.1, 0, 12.6, 1.8, "#f4f1ea", { rz: a + 15, pivot: [0, 10, 1.8] })), quad(1, 1.8, 0, 0.9, 1.68, "#5a3e2b", { rx: -12 })]);
  add("tractor", "Tractor", Co, "Farm|Field|Road", "Vehicles", "tractor farm vehicle plough", "#2f8a3a", 1.4, 2.4, (c) => [box(1.1, 0.9, 2.2, 0, 1.05, 0.5, c), box(1.6, 0.4, 1.4, 0, 1.1, -0.8, c), box(1.4, 1.5, 1.2, 0, 2.05, -0.8, GL, { glass: true }), box(1.5, 0.1, 1.4, 0, 2.85, -0.8, c), cylX(0.8, 0.45, -0.95, 0.8, -0.9, BK), cylX(0.8, 0.45, 0.95, 0.8, -0.9, BK), cylX(0.45, 0.3, -0.7, 0.45, 1.3, BK), cylX(0.45, 0.3, 0.7, 0.45, 1.3, BK), cylX(0.35, 0.47, -0.95, 0.8, -0.9, "#f2c418"), cylX(0.35, 0.47, 0.95, 0.8, -0.9, "#f2c418"), cyl(0.06, 1, 0.35, 1.5, 1.2, DK), box(0.3, 0.15, 0.03, 0, 1.2, 1.61, LT, { glow: true })]);
  add("hay-bale", "Hay bale", Co, "Farm|Field", "Things", "hay bale straw round bale", "#d9b45a", 0.6, 0.9, (c) => [cylX(0.6, 1.2, 0, 0.6, 0, c), cylX(0.45, 1.22, 0, 0.6, 0, shade(c, -0.12))]);
  add("farm-fence", "Wooden fence", Co, "Farm|Field|Road", "Signs & street", "fence rail fence paddock wooden", "#8a6a4a", 0.6, 1.3, (c) => fence(c, 2.4, false));
  add("scarecrow", "Scarecrow", Co, "Farm|Field", "Things", "scarecrow crows field straw man", "#5a7d9a", 1.4, 0.6, (c) => [box(0.08, 1.9, 0.08, 0, 0.95, -0.05, WD), box(1.4, 0.08, 0.08, 0, 1.4, -0.05, WD), box(0.5, 0.6, 0.25, 0, 1.25, 0, c), box(1.2, 0.18, 0.2, 0, 1.4, 0, c), ball(0.18, 0, 1.78, 0, "#d9b98a"), cyl(0.3, 0.02, 0, 1.9, 0, "#7a5232"), cone(0.17, 0.3, 0, 1.92, 0, "#7a5232"), box(0.06, 0.15, 0.06, -0.62, 1.32, 0, "#d9b45a"), box(0.06, 0.15, 0.06, 0.62, 1.32, 0, "#d9b45a")]);
  add("cow", "Cow", Co, "Farm|Field", "Animals", "cow cattle bull calf moo dairy", "#f4f1ea", 1.2, 1.3, (c) => animal(c, { L: 2.1, W: 0.75, T: 0.8, leg: 0.75, head: 0.45, snout: "#e0a0a0", ears: [0.15, 0.08], tail: [0.06, 0.7, -0.2, 20], extra: [box(0.77, 0.4, 0.6, 0, 1.25, 0.3, "#1f1f22"), box(0.77, 0.35, 0.4, 0, 1.1, -0.6, "#1f1f22"), box(0.06, 0.12, 0.06, -0.15, 1.75, 1.12, "#e8dcc4"), box(0.06, 0.12, 0.06, 0.15, 1.75, 1.12, "#e8dcc4")] }));
  add("horse", "Horse", Co, "Farm|Field|Road", "Animals", "horse pony stallion mare foal ride", "#8a5232", 1.6, 1.3, (c) => animal(c, { L: 2, W: 0.6, T: 0.7, leg: 0.95, head: 0.35, neck: 0.6, reach: 0.15, snout: shade(c, -0.2), ears: [0.07, 0.15], tail: [0.12, 0.7, -0.1, 30], tailc: "#2a1a10", extra: [box(0.08, 0.7, 0.4, 0, 2.0, 0.85, "#2a1a10", { rx: 20 })] }));
  add("sheep", "Sheep", Co, "Farm|Field|Mountain", "Animals", "sheep lamb ewe wool baa", "#f4f1ea", 0.7, 0.8, (c) => [ball(0.36, 0, 0.68, -0.25, c), ball(0.38, 0, 0.7, 0.1, c), ball(0.3, 0, 0.78, -0.05, shade(c, 0.05)), ...corners(0.3, 0.6, (x, z) => box(0.08, 0.45, 0.08, x, 0.22, z - 0.05, "#2a2a2a")), box(0.24, 0.26, 0.3, 0, 0.82, 0.55, "#2a2a2a"), box(0.1, 0.05, 0.05, -0.16, 0.86, 0.5, "#2a2a2a"), box(0.1, 0.05, 0.05, 0.16, 0.86, 0.5, "#2a2a2a")]);
  add("pig", "Pig", Co, "Farm", "Animals", "pig piglet hog swine oink", "#f0a8a8", 0.5, 0.8, (c) => animal(c, { L: 1.1, W: 0.5, T: 0.5, leg: 0.25, head: 0.4, snout: shade(c, -0.15), ears: [0.12, 0.1], tail: [0.03, 0.15, 0.05, -30] }));
  add("chicken", "Chicken", Co, "Farm", "Animals", "chicken hen rooster chick cockerel poultry", "#f4f1ea", 0.25, 0.25, (c) => scale(bird(c, { beak: "#f2c418", extra: [box(0.05, 0.12, 0.15, 0, 1.0, 0.3, RD), box(0.04, 0.1, 0.06, 0, 0.7, 0.42, RD), box(0.3, 0.3, 0.1, 0, 0.75, -0.42, c, { rx: -30 })] }), 0.45));
  add("goat", "Goat", Co, "Farm|Mountain", "Animals", "goat kid billy nanny", "#d8c8a8", 0.8, 0.8, (c) => animal(c, { L: 1, W: 0.35, T: 0.4, leg: 0.5, head: 0.24, neck: 0.15, ears: [0.08, 0.04], tail: [0.05, 0.12, 0.05, -40], extra: [box(0.04, 0.22, 0.04, -0.06, 1.25, 0.58, "#5a4a3a", { rx: -30 }), box(0.04, 0.22, 0.04, 0.06, 1.25, 0.58, "#5a4a3a", { rx: -30 }), box(0.06, 0.12, 0.05, 0, 0.88, 0.8, "#f4f1ea")] }));
  add("deer", "Deer", Co, "Forest|Field", "Animals", "deer doe stag fawn reindeer antlers", "#a8743f", 1.2, 1, (c) => animal(c, { L: 1.3, W: 0.4, T: 0.45, leg: 0.8, head: 0.25, neck: 0.4, snout: shade(c, -0.25), ears: [0.07, 0.12], tail: [0.06, 0.12, 0.05, -60], tailc: WH, extra: [...[-1, 1].map((s) => box(0.03, 0.4, 0.03, s * 0.1, 1.95, 0.75, "#d9c4a0", { rz: s * -25 })), ...[-1, 1].map((s) => box(0.2, 0.03, 0.03, s * 0.2, 2.0, 0.75, "#d9c4a0"))] }));
  add("fox", "Fox", Co, "Forest|Field|Farm", "Animals", "fox vixen cub red fox", "#d86a2a", 0.35, 0.5, (c) => animal(c, { L: 0.65, W: 0.2, T: 0.2, leg: 0.25, head: 0.17, snout: WH, ears: [0.06, 0.08], earc: "#2a1a10", tail: [0.1, 0.45, 0, 15], extra: [box(0.06, 0.06, 0.1, 0, 0.36, -0.82, WH)] }));
  add("rabbit", "Rabbit", Co, "Field|Forest|Farm", "Animals", "rabbit bunny hare", "#a89a88", 0.15, 0.2, (c) => animal(c, { L: 0.3, W: 0.17, T: 0.17, leg: 0.05, head: 0.13, ears: [0.035, 0.14], tail: [0.06, 0.05, 0.02, 0], tailc: WH }));
  add("squirrel", "Squirrel", Co, "Forest", "Animals", "squirrel rodent nuts acorn", "#a8643a", 0.12, 0.15, squirrelP);
  add("owl", "Owl", Co, "Forest|Farm", "Animals", "owl hoot night bird", "#8a6a4a", 0.25, 0.2, (c) => scale([box(0.6, 0.8, 0.5, 0, 0.5, 0, c), box(0.6, 0.45, 0.5, 0, 1.1, 0, c), box(0.45, 0.6, 0.05, 0, 0.5, 0.26, shade(c, 0.35)), ...[-1, 1].map((s) => cylZ(0.12, 0.04, s * 0.14, 1.12, 0.26, "#f2c418")), ...eyes(0.14, 0.08, 1.12, 0.29), cone(0.05, 0.12, 0, 1.0, 0.25, "#3a3a3a", { rx: 160 }), ...[-1, 1].map((s) => box(0.1, 0.15, 0.1, s * 0.22, 1.36, 0, c)), box(0.08, 0.6, 0.4, -0.33, 0.6, -0.02, shade(c, -0.15)), box(0.08, 0.6, 0.4, 0.33, 0.6, -0.02, shade(c, -0.15))], 0.3));
  add("bear", "Bear", Co, "Forest|Mountain", "Animals", "bear grizzly brown bear black bear cub", "#5a3a22", 1, 1.3, (c) => animal(c, { L: 1.8, W: 0.9, T: 0.9, leg: 0.5, head: 0.55, snout: shade(c, 0.25), ears: [0.15, 0.12], tail: [0.12, 0.1, 0.1, 0] }));
  /* Country / Campsite and Road */
  add("tent", "Tent", Co, "Campsite|Forest", "Things", "tent camping shelter", "#e07a3f", 0.7, 1.4, (c) => [wedge(2.2, 1.3, 1.1, 0.55, 0.65, 0, c, { ry: 90 }), wedge(2.2, 1.3, 1.1, -0.55, 0.65, 0, c, { ry: -90 }), quad(0.6, 0.9, 0, 0.45, 1.101, "#5a2e14"), box(0.05, 1.4, 0.05, 0, 0.7, 1.12, DK)]);
  add("campfire", "Campfire", Co, "Campsite|Forest", "Things", "campfire fire bonfire flames logs", "#ff8a2a", 0.3, 0.6, (c) => [...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => ball(0.12, 0, 0.08, 0.5, "#7a7a78", { ry: a, pivot: [0, 0.08, 0] })), cylX(0.06, 0.8, 0, 0.12, 0, "#5a3a22", { ry: 40 }), cylX(0.06, 0.8, 0, 0.12, 0, "#5a3a22", { ry: -40 }), cone(0.25, 0.6, 0, 0.1, 0, c, { glow: true }), cone(0.15, 0.4, 0.08, 0.1, 0.05, "#ffd04a", { glow: true })]);
  add("picnic-blanket", "Picnic blanket", Co, "Campsite|Field|Forest", "Things", "picnic blanket rug checked cloth", "#d1332e", 0, 1, (c) => [flat(1.6, 1.6, 0, 0.005, 0, WH), ...corners(0.8, 0.8, (x, z) => (x * z > 0 ? flat(0.8, 0.8, x, 0.007, z, c) : null)).filter(Boolean), box(0.4, 0.25, 0.3, 0.3, 0.13, -0.3, "#a8743f")]);
  add("dirt-road", "Dirt road", Co, "Road|Farm|Field", "Signs & street", "dirt road track lane path gravel", "#9a7a55", 0, 5, (c) => [flat(4, 10, 0, 0.005, 0, c), flat(0.5, 10, -0.9, 0.007, 0, shade(c, -0.15)), flat(0.5, 10, 0.9, 0.007, 0, shade(c, -0.15)), flat(0.6, 10, 0, 0.008, 0, "#6aa84f")]);
  add("signpost", "Signpost", Co, "Road|Field|Mountain|Forest", "Signs & street", "signpost fingerpost direction sign way", "#8a6a4a", 1.6, 0.5, (c) => [box(0.1, 2.2, 0.1, 0, 1.1, 0, c), box(0.8, 0.18, 0.04, 0.35, 1.9, 0, "#f4f1ea", { ry: 20, pivot: [0, 1.9, 0] }), box(0.8, 0.18, 0.04, -0.35, 1.6, 0, "#f4f1ea", { ry: -30, pivot: [0, 1.6, 0] }), cone(0.12, 0.15, 0, 2.2, 0, c)]);
  add("country-road", "Country road", Co, "Road", "Signs & street", "road paved road lane highway", "#4a4c50", 0, 5, (c) => [flat(6, 10, 0, 0.005, 0, c), ...[-4, -1.5, 1, 3.5].map((z) => flat(0.12, 1.5, 0, 0.008, z, WH)), flat(1, 10, -3.5, 0.006, 0, "#7a9a5a"), flat(1, 10, 3.5, 0.006, 0, "#7a9a5a")]);
  /* Country bugs */
  add("ant", "Ant", Co, "Forest|Field|Farm|Campsite", "Animals", "ant bug insect", "#2a1a10", 0.005, 0.01, (c) => scale(insect(c, { thorax: c, headc: c }), 0.015));
  add("beetle", "Beetle", Co, "Forest|Field|Farm", "Animals", "beetle bug insect", "#2f4a2f", 0.01, 0.02, (c) => scale(insect(c, { wings: shade(c, 0.1), solid: true }), 0.035));
  add("ladybug", "Ladybug", Co, "Field|Forest|Farm", "Animals", "ladybird ladybug bug insect", "#d12a20", 0.005, 0.01, (c) => scale([ball(0.38, 0, 0.3, -0.05, c), ball(0.2, 0, 0.3, 0.33, BK), box(0.02, 0.05, 0.7, 0, 0.66, -0.05, BK), ...[[-0.18, 0.1], [0.18, 0.1], [-0.15, -0.25], [0.15, -0.25]].map(([x, z]) => ball(0.07, x, 0.6, z, BK)), ...[-0.05, 0.12, 0.28].map((z) => box(0.9, 0.03, 0.03, 0, 0.12, z, BK))], 0.012));
  add("caterpillar", "Caterpillar", Co, "Forest|Field|Farm", "Animals", "caterpillar grub larva crawling", "#6aa84f", 0.01, 0.03, (c) => scale([0, 1, 2, 3, 4, 5].map((i) => ball(0.12, 0, 0.12, -0.5 + i * 0.2, i === 5 ? shade(c, -0.25) : i % 2 ? c : shade(c, 0.15))).concat(eyes(0.05, 0.03, 0.17, 0.58)), 0.05));
  add("snail", "Snail", Co, "Forest|Field|Farm", "Animals", "snail slug shell slow", "#b5895a", 0.01, 0.03, (c) => scale([box(0.25, 0.12, 1.0, 0, 0.06, 0.1, "#c9b9a0"), ball(0.35, 0, 0.42, -0.1, c), cylZ(0.2, 0.72, 0, 0.42, -0.1, shade(c, -0.25)), box(0.03, 0.25, 0.03, -0.06, 0.25, 0.55, "#c9b9a0", { rx: 20 }), box(0.03, 0.25, 0.03, 0.06, 0.25, 0.55, "#c9b9a0", { rx: 20 })], 0.04));
  add("worm", "Worm", Co, "Field|Farm|Forest", "Animals", "worm earthworm wriggly", "#d68a7a", 0.005, 0.06, (c) => [0, 1, 2, 3, 4, 5, 6].map((i) => ball(0.006, Math.sin(i) * 0.01, 0.006, -0.045 + i * 0.015, c)));
  /* Country people */
  person("farmer", "Farmer", Co, "Farm|Field|Road", "farmer farmhand rancher", "#5a7d9a", "#3a4a6a", "#c98d63", "#5a3a22");
  person("hiker", "Hiker", Co, "Mountain|Forest|Road|Campsite", "hiker walker rambler backpacker climber", "#d1332e", "#4a4a3a", "#e0b48c", "#a8743f");
  person("camper", "Camper", Co, "Campsite|Forest", "camper scout camping", "#3f8f4f", "#6a5a3a", "#8d5a3b", "#1d1712");

  /* Water / places */
  add("lake", "Lake", Wa, "Lake", "Nature", "lake water loch mere", "#3f84b5", 0, 10, (c) => [flat(22, 16, 0, 0.003, 0, "#6a8a4a"), flat(20, 14, 0, 0.006, 0, c, { glass: true })]);
  add("river", "River piece", Wa, "River", "Nature", "river stream creek water", "#3f84b5", 0, 6, (c) => [flat(10, 20, 0, 0.003, 0, "#6a8a4a"), flat(1, 20, -3.4, 0.005, 0, "#a8906a"), flat(1, 20, 3.4, 0.005, 0, "#a8906a"), flat(6, 20, 0, 0.007, 0, c, { glass: true })]);
  add("pond", "Pond", Wa, "Lake|River", "Nature", "pond pool water small lake", "#4a9ac0", 0.1, 3, (c) => pondP(c, 2.5));
  add("waves", "Waves", Wa, "Sea|Beach", "Nature", "waves surf sea ocean swell", "#3a7ab0", 0.4, 4, (c) => [flat(8, 8, 0, 0.005, 0, shade(c, -0.15), { glass: true }), ...[-3, -1, 1, 3].map((z, i) => wedge(8, 0.5 + (i % 2) * 0.2, 1.2, 0, 0.25, z, c, { glass: true })), ...[-3, -1, 1, 3].map((z) => box(8, 0.06, 0.15, 0, 0.55, z - 0.5, WH))]);
  /* Water / boats */
  add("rowboat", "Rowboat", Wa, "Lake|River|Harbor", "Vehicles", "rowboat rowing boat dinghy oars", "#b5653b", 0.4, 1.8, (c) => boat(c, 3, 1.2, 0.45, { extra: [box(1.2, 0.05, 0.25, 0, 0.35, 0.2, WD), box(1.2, 0.05, 0.25, 0, 0.35, -0.8, WD), box(2.2, 0.04, 0.06, 0, 0.45, 0.2, "#c9a36a", { ry: 15 }), box(0.25, 0.02, 0.3, -1.1, 0.4, 0.5, "#c9a36a")] }));
  add("canoe", "Canoe", Wa, "Lake|River", "Vehicles", "canoe kayak paddle", "#d84a2a", 0.3, 2.3, (c) => [box(0.8, 0.35, 3, 0, 0.175, 0, c), wedge(0.8, 0.35, 0.8, 0, 0.175, 1.9, c, { ry: 180 }), wedge(0.8, 0.35, 0.8, 0, 0.175, -1.9, c), flat(0.7, 2.9, 0, 0.3, 0, "#7a3a1a"), box(0.7, 0.04, 0.1, 0, 0.3, 0.6, WD), box(0.06, 0.03, 1.4, 0.3, 0.38, -0.2, "#c9a36a", { ry: 10 })]);
  add("sailboat", "Sailboat", Wa, "Lake|Sea|Harbor", "Vehicles", "sailboat sailing boat yacht sail dinghy", "#f4f1ea", 3, 3, (c) => boat(c, 6, 2, 0.8, { trim: "#2e6db0", extra: [box(0.12, 8, 0.12, 0, 4.6, 0.5, MT), wedge(0.03, 7, 3, 0, 4.6, -1, WH, { ry: 0 }), wedge(0.03, 5.5, 1.8, 0, 3.6, 1.5, "#e8e2d0", { ry: 180 }), box(0.08, 0.08, 3.2, 0, 1.2, -1, MT), box(1.2, 0.6, 1.6, 0, 1.0, -0.5, WH)] }));
  add("motorboat", "Motorboat", Wa, "Lake|Sea|Harbor|River", "Vehicles", "motorboat speedboat powerboat launch", "#f4f1ea", 0.9, 2.8, (c) => boat(c, 5.5, 2, 0.8, { trim: RD, extra: [wedge(1.8, 0.6, 0.6, 0, 1.1, 0.6, GL, { glass: true, ry: 180 }), box(0.4, 0.6, 0.4, 0, 0.9, -2.6, DK), box(1.4, 0.3, 0.5, 0, 0.75, -0.6, "#3a3d42")] }));
  add("ferry", "Ferry", Wa, "Sea|Harbor|River", "Vehicles", "ferry passenger boat ship car ferry", "#f4f1ea", 4, 12, (c) => boat(c, 30, 9, 3, { trim: "#1c2e5a", extra: [box(8, 2.5, 18, 0, 4.25, -2, c), box(8.02, 0.8, 17, 0, 4.4, -2, GL, { glass: true }), box(6, 2.2, 10, 0, 6.6, -3, c), box(6.02, 0.7, 9, 0, 6.8, -3, GL, { glass: true }), box(1.6, 3, 1.6, 0, 9, -6, "#d1332e")] }));
  add("barge", "Barge", Wa, "River|Harbor", "Vehicles", "barge narrowboat canal boat freight", "#2a4a3a", 1.5, 9, (c) => [box(5, 1.8, 26, 0, 0.9, 0, c), wedge(5, 1.8, 2, 0, 0.9, 14, c, { ry: 180 }), box(5.02, 0.3, 26, 0, 1.7, 0, RD), box(4.4, 1, 18, 0, 2.2, 1, "#5a4a3a"), box(3.5, 2.5, 3.5, 0, 3, -11, WH), quad(3, 0.7, 0, 3.6, -9.24, GL, { glass: true })]);
  add("cargo-ship", "Cargo ship", Wa, "Sea|Harbor", "Vehicles", "cargo ship container ship freighter vessel", "#2a3a5a", 8, 30, (c) => {
    const P = boat(c, 90, 16, 8, { trim: RD, deck: "#5a5a62" }), cols = ["#d1332e", "#2e6db0", "#e0b23a", "#3f8f4f", "#e07a3f"];
    for (let i = 0; i < 10; i++) P.push(box(14, 5, 5.5, 0, 8 + 2.5 + (i % 3 === 0 ? 2.5 : 0), 25 - i * 6.2, cols[i % 5]));
    P.push(box(14, 12, 8, 0, 14, -38, WH), quad(12, 1.2, 0, 18, -33.99, GL, { glass: true }), cyl(1.5, 6, 0, 20, -40, DK));
    return P;
  });
  add("fishing-boat", "Fishing boat", Wa, "Sea|Harbor", "Vehicles", "fishing boat trawler fisherman", "#3a6ea5", 2.5, 5, (c) => boat(c, 10, 3.5, 1.4, { trim: WH, extra: [box(2.6, 2, 2.6, 0, 2.4, 1.2, WH), quad(2.2, 0.7, 0, 2.9, 2.51, GL, { glass: true }), box(0.15, 6, 0.15, 0, 4, -1, MT), box(0.1, 0.1, 4, 0, 5.5, -2.5, MT, { rx: -25, pivot: [0, 6.5, -1] }), box(1.8, 0.6, 2, 0, 1.3, -3, "#d9b45a"), box(0.4, 0.4, 0.4, 0, 3.6, 1.2, "#f2c418", { glow: true })] }));
  add("pedal-boat", "Pedal boat", Wa, "Lake", "Vehicles", "pedalo pedal boat swan boat", "#f4f1ea", 0.6, 1.4, (c) => [box(1.4, 0.4, 2.2, 0, 0.2, 0, c), box(1.2, 0.05, 1.1, 0, 0.5, -0.3, "#2e6db0"), box(1.2, 0.5, 0.08, 0, 0.75, -0.8, "#2e6db0"), box(0.6, 0.06, 0.06, 0, 0.6, 0.6, MT), box(1.44, 0.15, 2.24, 0, 0.42, 0, "#2e6db0")]);
  /* Water / structures */
  add("dock", "Dock", Wa, "Harbor|Lake|River", "Buildings", "dock jetty landing wharf mooring", "#8a6a4a", 0.6, 3, (c) => [box(3, 0.15, 6, 0, 0.75, 0, c), ...[-1, 0, 1].map((x) => flat(0.03, 6, x, 0.83, 0, shade(c, -0.3))), ...corners(2.8, 5.8, (x, z) => cyl(0.12, 1.1, x, 0, z, shade(c, -0.2))), cyl(0.12, 0.25, 1.2, 0.83, 2.5, DK)]);
  add("pier", "Pier", Wa, "Sea|Beach|Harbor", "Buildings", "pier boardwalk promenade jetty", "#9a7a55", 2, 8, (c) => [box(4, 0.2, 20, 0, 3, 0, c), ...[-8, -3, 2, 7].map((z) => [cyl(0.2, 3, -1.8, 0, z, shade(c, -0.3)), cyl(0.2, 3, 1.8, 0, z, shade(c, -0.3))]).flat(), box(0.08, 0.9, 20, -1.95, 3.55, 0, WH), box(0.08, 0.9, 20, 1.95, 3.55, 0, WH), ...lampPost("#3a3a40", 3).map((p) => Object.assign(p, { at: [p.at[0] + 1.8, p.at[1] + 3.1, p.at[2] + 6] }))]);
  add("bridge", "Bridge", Wa, "River|Lake|Harbor", "Buildings", "bridge crossing span viaduct", "#9a8a7a", 4, 12, (c) => [box(5, 0.6, 24, 0, 4, 0, c), box(0.2, 1, 24, -2.4, 4.8, 0, c), box(0.2, 1, 24, 2.4, 4.8, 0, c), ...[-6, 6].map((z) => box(4, 4, 1.4, 0, 2, z, shade(c, -0.15))), flat(3.6, 24, 0, 4.31, 0, "#3a3c40")]);
  add("lighthouse", "Lighthouse", Wa, "Sea|Beach|Harbor", "Buildings", "lighthouse beacon lamp tower coast", "#f4f1ea", 8, 3, (c) => [cyl(2.6, 1, 0, 0, 0, "#7a7a78"), ...[0, 1, 2, 3].map((i) => cyl(1.9 - i * 0.2, 3, 0, 1 + i * 3, 0, i % 2 ? RD : c)), cyl(1.6, 0.3, 0, 13, 0, DK), cyl(1, 1.5, 0, 13.3, 0, "#fff1b8", { glow: true, glass: true }), cone(1.3, 1.2, 0, 14.8, 0, RD), quad(0.8, 1.6, 0, 1.8, 1.9, "#5a3e2b")]);
  add("buoy", "Buoy", Wa, "Sea|Harbor|Lake", "Signs & street", "buoy marker float", "#e0402a", 0.8, 0.6, (c) => [cyl(0.55, 0.5, 0, 0, 0, c), cone(0.45, 1.2, 0, 0.5, 0, c), cyl(0.38, 0.25, 0, 0.75, 0, WH), ball(0.12, 0, 1.75, 0, "#fff1b8", { glow: true })]);
  add("lifeguard-tower", "Lifeguard tower", Wa, "Beach", "Buildings", "lifeguard tower hut lookout", "#f2c418", 2.5, 1.8, (c) => [...corners(1.8, 1.8, (x, z) => box(0.12, 2.2, 0.12, x, 1.1, z, WH)), box(2.2, 0.15, 2.2, 0, 2.25, 0, WH), box(2, 1.6, 2, 0, 3.1, 0, c), quad(1.6, 0.8, 0, 3.3, 1.01, GL, { glass: true }), wedge(2.4, 0.5, 2.4, 0, 4.15, 0, RD), box(0.9, 0.06, 2.8, 0, 1.1, 2.0, WH, { rx: 50 }), box(0.06, 0.06, 1.2, 0, 4.6, 0, RD)]);
  /* Water / beach */
  add("beach-umbrella", "Beach umbrella", Wa, "Beach", "Things", "parasol sunshade umbrella beach", "#e0402a", 1.8, 1.2, (c) => [cyl(0.03, 2.2, 0, 0, 0, WH), cone(1.2, 0.5, 0, 1.8, 0, c), ...[0, 60, 120].map((a) => box(2.38, 0.02, 0.3, 0, 1.81, 0, WH, { ry: a }))]);
  add("beach-towel", "Beach towel", Wa, "Beach", "Things", "towel beach mat sunbathe", "#2bb0a8", 0, 0.9, (c) => [0, 1, 2, 3, 4].map((i) => flat(0.9, 0.36, 0, 0.005, -0.72 + i * 0.36, i % 2 ? WH : c)));
  add("sandcastle", "Sandcastle", Wa, "Beach", "Things", "sandcastle sand castle bucket spade", "#e0c088", 0.25, 0.4, (c) => [box(0.5, 0.15, 0.5, 0, 0.075, 0, c), ...corners(0.4, 0.4, (x, z) => cyl(0.07, 0.3, x, 0, z, c)), ...corners(0.4, 0.4, (x, z) => cone(0.08, 0.1, x, 0.3, z, shade(c, -0.1))), box(0.22, 0.25, 0.22, 0, 0.25, 0, c), box(0.01, 0.12, 0.01, 0, 0.42, 0, DK), quad(0.07, 0.05, 0.035, 0.51, 0, RD)]);
  add("palm-tree", "Palm tree", Wa, "Beach", "Nature", "palm tree coconut tropical", "#3a9a4a", 4, 2, (c) => tree("palm", c, 7));
  add("beach-chair", "Deck chair", Wa, "Beach", "Furniture", "deck chair sun lounger beach chair deckchair", "#2e6db0", 0.4, 0.6, (c) => [box(0.55, 0.04, 0.9, 0, 0.3, 0.1, c, { rx: 0 }), box(0.55, 0.04, 0.8, 0, 0.6, -0.5, c, { rx: -55 }), ...corners(0.5, 0.8, (x, z) => box(0.04, 0.3, 0.04, x, 0.15, z + 0.1, WD))]);
  /* Water / animals */
  add("fish", "Fish", Wa, "Underwater|Lake|River|Sea", "Animals", "fish goldfish trout fishy", "#f08a24", 0.1, 0.15, (c) => scale(fish(c), 0.3));
  add("tropical-fish", "Tropical fish", Wa, "Underwater|Sea", "Animals", "tropical fish clownfish reef fish", "#2bb0d8", 0.06, 0.1, (c) => scale(fish(c, { fin: "#f2c418", extra: [box(0.25, 0.42, 0.08, 0, 0.3, 0.1, WH), box(0.25, 0.42, 0.08, 0, 0.3, -0.25, WH)] }), 0.15));
  add("duck", "Duck", Wa, "Lake|River", "Animals", "duck mallard duckling quack", "#8a6a4a", 0.25, 0.25, (c) => scale(bird(c, { head: "#2f6a3f", beak: "#f2c418", nolegs: true, extra: [box(0.42, 0.2, 0.75, 0, 0.42, 0, c)] }), 0.5, -0.15));
  add("swan", "Swan", Wa, "Lake|River", "Animals", "swan cygnet white bird", "#f4f1ea", 0.6, 0.5, (c) => scale([box(0.5, 0.35, 1, 0, 0.3, 0, c), wedge(0.5, 0.35, 0.3, 0, 0.45, -0.55, c, { ry: 0 }), box(0.08, 0.7, 0.08, 0, 0.75, 0.42, c, { rx: -8 }), box(0.12, 0.12, 0.2, 0, 1.1, 0.5, c), cone(0.04, 0.15, 0, 1.08, 0.6, "#f08a24", { rx: 90 }), ...eyes(0.06, 0.03, 1.13, 0.55), box(0.06, 0.25, 0.7, -0.27, 0.42, -0.05, shade(c, -0.05)), box(0.06, 0.25, 0.7, 0.27, 0.42, -0.05, shade(c, -0.05))], 1));
  add("frog", "Frog", Wa, "Lake|River", "Animals", "frog toad ribbit amphibian", "#4a9a3a", 0.04, 0.06, (c) => scale([box(0.6, 0.35, 0.7, 0, 0.25, 0, c, { rx: -15 }), ball(0.12, -0.18, 0.5, 0.25, c), ball(0.12, 0.18, 0.5, 0.25, c), ...eyes(0.18, 0.08, 0.55, 0.33), ...[-1, 1].map((s) => box(0.2, 0.15, 0.5, s * 0.35, 0.1, -0.15, c)), ...[-1, 1].map((s) => box(0.1, 0.25, 0.1, s * 0.22, 0.1, 0.3, c)), box(0.4, 0.03, 0.02, 0, 0.3, 0.36, shade(c, -0.4))], 0.1));
  add("turtle", "Turtle", Wa, "Beach|Sea|Underwater|Lake", "Animals", "turtle tortoise terrapin shell", "#4a7a3a", 0.15, 0.4, (c) => [box(0.5, 0.12, 0.6, 0, 0.12, 0, shade(c, -0.25)), box(0.4, 0.12, 0.5, 0, 0.2, 0, c), box(0.12, 0.1, 0.15, 0, 0.12, 0.36, "#8aa86a"), ...corners(0.5, 0.45, (x, z) => box(0.15, 0.05, 0.12, x, 0.05, z, "#8aa86a")), ...eyes(0.04, 0.02, 0.15, 0.44)]);
  add("crab", "Crab", Wa, "Beach|Underwater|Sea", "Animals", "crab crustacean claws pincers", "#d84a2a", 0.05, 0.15, (c) => scale([box(0.6, 0.2, 0.45, 0, 0.3, 0, c), ...[-0.12, 0, 0.12].map((z) => box(1.0, 0.04, 0.04, 0, 0.18, z, c, { rz: 0 })), ...[-1, 1].map((s) => box(0.18, 0.12, 0.25, s * 0.38, 0.32, 0.35, c)), ...[-1, 1].map((s) => box(0.04, 0.15, 0.04, s * 0.1, 0.45, 0.18, c)), ...eyes(0.1, 0.06, 0.53, 0.18)], 0.2));
  add("seagull", "Seagull", Wa, "Beach|Harbor|Sea", "Animals", "seagull gull sea bird", "#f4f1ea", 0.2, 0.2, (c) => scale(bird(c, { wing: "#9aa0a8", beak: "#f2c418" }), 0.45));
  add("whale", "Whale", Wa, "Sea|Underwater", "Animals", "whale humpback blue whale orca", "#3a5a7a", 2, 6, (c) => scale(fish(c, { belly: "#c8ccd0", extra: [box(1.1, 0.04, 0.3, 0, 0.12, -0.52, shade(c, -0.2)), box(0.5, 0.04, 0.2, -0.2, 0.18, 0.2, c, { rz: 30 }), box(0.5, 0.04, 0.2, 0.2, 0.18, 0.2, c, { rz: -30 })] }).map((p, i) => (i === 2 ? Object.assign({}, p, { box: [0.6, 0.04, 0.22] }) : p)), 13));
  add("shark", "Shark", Wa, "Sea|Underwater", "Animals", "shark great white jaws predator fish", "#7a8a98", 0.8, 2, (c) => scale(fish(c, { belly: WH, extra: [wedge(0.04, 0.35, 0.3, 0, 0.65, 0, c), box(0.4, 0.03, 0.15, -0.2, 0.2, 0.15, c, { rz: 20 }), box(0.4, 0.03, 0.15, 0.2, 0.2, 0.15, c, { rz: -20 })] }), 3.5));
  add("octopus", "Octopus", Wa, "Underwater|Sea", "Animals", "octopus squid tentacles", "#c0508a", 0.4, 0.6, (c) => [ball(0.3, 0, 0.6, 0, c), ...eyes(0.12, 0.06, 0.6, 0.28), ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => box(0.08, 0.06, 0.7, 0, 0.12, 0.38, shade(c, -0.1), { ry: a, rx: 15, pivot: [0, 0.3, 0] }))]);
  add("jellyfish", "Jellyfish", Wa, "Underwater|Sea", "Animals", "jellyfish jelly medusa sting", "#d8a8f0", 0.4, 0.3, (c) => [ball(0.25, 0, 0.7, 0, c, { glass: true, glow: true }), ...[0, 60, 120, 180, 240, 300].map((a) => box(0.02, 0.6, 0.02, 0.12, 0.4, 0, c, { ry: a, pivot: [0, 0.4, 0], glass: true }))]);
  add("seaweed", "Seaweed", Wa, "Underwater|Beach", "Nature", "seaweed kelp algae weed", "#3a7a3a", 0.6, 0.4, (c) => [-0.15, 0, 0.15].map((x, i) => box(0.08, 1 + i * 0.3, 0.02, x, 0.5 + i * 0.15, (i - 1) * 0.08, i % 2 ? c : shade(c, 0.15), { rz: (i - 1) * 10 })));
  add("coral", "Coral", Wa, "Underwater|Sea", "Nature", "coral reef", "#f07a8a", 0.3, 0.5, (c) => [cyl(0.08, 0.4, 0, 0, 0, c), cyl(0.05, 0.4, 0.05, 0.2, 0, c, { rz: -35 }), cyl(0.05, 0.35, -0.05, 0.2, 0, c, { rz: 35 }), cyl(0.04, 0.3, 0, 0.25, 0.05, c, { rx: 35 }), ball(0.07, 0.3, 0.52, 0, shade(c, 0.2)), ball(0.07, -0.26, 0.48, 0, shade(c, 0.2)), ball(0.06, 0, 0.42, 0.22, shade(c, 0.2)), ball(0.12, 0.25, 0.05, 0.2, "#f2c418")]);
  add("starfish", "Starfish", Wa, "Beach|Underwater", "Animals", "starfish sea star", "#f08a24", 0.02, 0.12, (c) => [0, 72, 144, 216, 288].map((a) => box(0.04, 0.025, 0.1, 0, 0.012, 0.05, c, { ry: a, pivot: [0, 0.012, 0] })));
  /* Water people */
  person("swimmer", "Swimmer", Wa, "Beach|Lake|Sea", "swimmer bather swimming", "#2bb0d8", "#2bb0d8", "#e0b48c", "#a8743f");
  person("lifeguard", "Lifeguard", Wa, "Beach", "lifeguard rescue beach guard", "#d1332e", "#d1332e", "#c98d63", "#e0c088");
  person("fisher", "Fisher", Wa, "Lake|River|Harbor", "fisherman angler fishing", "#5a6a3a", "#3a4a6a", "#c98d63", "#5a3a22");
  person("sailor", "Sailor", Wa, "Harbor|Sea", "sailor seaman captain deckhand", "#f4f1ea", "#1c2e5a", "#8d5a3b", "#1d1712");

  /* Sky */
  add("bird", "Bird", S, "Low sky", "Animals", "bird sparrow songbird robin flying", "#7a5a3a", 0.1, 0.15, (c) => scale(bird(c, { spread: true, nolegs: true, belly: "#d86a2a" }), 0.18), { fly: 4 });
  add("flock", "Flock of birds", S, "Low sky|High sky", "Animals", "flock birds group migration", "#3a3a3a", 0.2, 2, (c) => [[0, 0, 0.8], [-0.7, 0.2, 0], [0.7, 0.15, 0], [-1.4, 0.4, -0.8], [1.4, 0.3, -0.8]].map(([x, y, z]) => [box(0.1, 0.09, 0.2, x, y + 0.15, z, c), box(0.45, 0.02, 0.1, x, y + 0.17, z, c), ball(0.05, x, y + 0.19, z + 0.1, c)]).flat(), { fly: 12 });
  add("crow", "Crow", S, "Low sky", "Animals", "crow raven blackbird", "#1f1f22", 0.2, 0.3, (c) => scale(bird(c, { spread: true, nolegs: true, beak: "#3a3a3a" }), 0.45), { fly: 5 });
  add("eagle", "Eagle", S, "Low sky|High sky", "Animals", "eagle hawk bird of prey falcon", "#5a3a22", 0.4, 1, (c) => scale(bird(c, { spread: true, nolegs: true, head: WH, beak: "#f2c418" }), 1), { fly: 15 });
  add("airplane", "Airplane", S, "High sky", "Vehicles", "airplane aeroplane jet airliner plane", "#f4f1ea", 2, 18, (c) => [cylZ(1.8, 30, 0, 2, 0, c), ball(1.8, 0, 2, 15, c), cone(1.8, 4, 0, 2, -15, c, { rx: -90, pivot: [0, 2, -15] }), box(32, 0.3, 4, 0, 1.6, 1, c), box(10, 0.2, 2.2, 0, 2.4, -16, c), wedge(0.3, 5, 3.5, 0, 5, -16, "#2e6db0"), cylZ(0.8, 3, -6, 0.9, 2, MT), cylZ(0.8, 3, 6, 0.9, 2, MT), box(3.62, 0.35, 26, 0, 2.6, 0, "#2e6db0"), quad(1.6, 0.6, 0, 2.6, 16.6, GL, { glass: true })], { fly: 40 });
  add("small-plane", "Small plane", S, "Low sky", "Vehicles", "small plane propeller plane light aircraft cessna-like", "#f2c418", 1, 5, (c) => [box(1.2, 1.3, 7, 0, 1, 0, c), box(11, 0.15, 1.6, 0, 1.75, 0.6, c), box(1.15, 0.6, 1.2, 0, 1.6, 1.4, GL, { glass: true }), box(3.6, 0.12, 1, 0, 1.2, -3.2, c), wedge(0.12, 1.4, 1.2, 0, 2.1, -3.2, RD), cylZ(0.2, 0.3, 0, 1, 3.6, DK), box(0.15, 2, 0.06, 0, 1, 3.8, DK, { rz: 20 }), box(0.1, 0.8, 0.1, -0.7, 0.4, 1, DK), box(0.1, 0.8, 0.1, 0.7, 0.4, 1, DK)], { fly: 20 });
  add("helicopter", "Helicopter", S, "Low sky", "Vehicles", "helicopter chopper heli rotor", "#d1332e", 1.4, 5, (c) => [ball(1.3, 0, 1.6, 0.4, c), ball(1.1, 0, 1.75, 1.1, GL, { glass: true }), box(0.4, 0.5, 5, 0, 1.9, -2.8, c), box(0.1, 1.1, 0.6, 0, 2.3, -5.2, c), box(0.04, 1.4, 0.2, 0.15, 2.3, -5.3, DK), box(0.15, 0.4, 0.15, 0, 3, 0.3, DK), box(9, 0.05, 0.3, 0, 3.2, 0.3, DK), box(9, 0.05, 0.3, 0, 3.2, 0.3, DK, { ry: 90 }), box(0.1, 0.1, 3, -0.9, 0.1, 0.3, DK), box(0.1, 0.1, 3, 0.9, 0.1, 0.3, DK), box(0.06, 0.4, 0.06, -0.9, 0.3, 0.3, DK), box(0.06, 0.4, 0.06, 0.9, 0.3, 0.3, DK)], { fly: 15 });
  add("drone", "Drone", S, "Low sky", "Vehicles", "drone quadcopter uav", "#2b2d31", 0.1, 0.4, (c) => [box(0.18, 0.06, 0.18, 0, 0.08, 0, c), box(0.6, 0.02, 0.03, 0, 0.09, 0, c, { ry: 45 }), box(0.6, 0.02, 0.03, 0, 0.09, 0, c, { ry: -45 }), ...corners(0.42, 0.42, (x, z) => cyl(0.1, 0.01, x, 0.11, z, "#c8ccd0", { glass: true })), box(0.06, 0.05, 0.05, 0, 0.04, 0.09, BK), box(0.03, 0.02, 0.01, 0, 0.09, 0.095, "#ff3030", { glow: true })], { fly: 6 });
  add("hot-air-balloon", "Hot-air balloon", S, "Low sky|High sky", "Vehicles", "hot air balloon balloon flight", "#e0402a", 6, 4, (c) => [box(1.4, 1, 1.4, 0, 0.5, 0, "#a8743f"), ...corners(1.2, 1.2, (x, z) => box(0.03, 3, 0.03, x * 1.3, 2.5, z * 1.3, DK)), cone(2.2, 1.6, 0, 4, 0, c, { rx: 180, pivot: [0, 4.8, 0] }), ball(4, 0, 8.6, 0, c), ...[0, 60, 120].map((a) => box(0.4, 7, 8.04, 0, 8.6, 0, "#f2c418", { ry: a })), cone(0.4, 0.8, 0, 1.2, 0, "#ff8a2a", { glow: true })], { fly: 30 });
  add("kite", "Kite", S, "Low sky", "Things", "kite flying kite string", "#e0402a", 0.5, 0.6, (c) => [box(0.6, 0.6, 0.02, 0, 0.85, 0, c, { rz: 45 }), box(0.04, 0.85, 0.03, 0, 0.85, 0.01, DK), box(0.85, 0.03, 0.03, 0, 0.85, 0.01, DK), ...[0, 1, 2, 3].map((i) => box(0.1, 0.06, 0.02, (i % 2) * 0.06, 0.3 - i * 0.12, 0, ["#f2c418", "#2e6db0", "#3f8f4f", RD][i])), box(0.01, 0.4, 0.01, 0, 0.25, 0, DK)], { fly: 10 });
  add("butterfly", "Butterfly", S, "Low sky", "Animals", "butterfly moth wings", "#f08a24", 0.03, 0.06, (c) => scale([box(0.05, 0.05, 0.4, 0, 0.3, 0, DK), box(0.4, 0.02, 0.3, -0.22, 0.32, 0.08, c, { rz: -20 }), box(0.4, 0.02, 0.3, 0.22, 0.32, 0.08, c, { rz: 20 }), box(0.3, 0.02, 0.22, -0.17, 0.31, -0.15, shade(c, -0.2), { rz: -20 }), box(0.3, 0.02, 0.22, 0.17, 0.31, -0.15, shade(c, -0.2), { rz: 20 }), box(0.01, 0.01, 0.15, -0.03, 0.35, 0.25, DK, { rx: -30 }), box(0.01, 0.01, 0.15, 0.03, 0.35, 0.25, DK, { rx: -30 })], 0.12), { fly: 1.2 });
  add("bee", "Bee", S, "Low sky", "Animals", "bee honeybee bumblebee buzz wasp", "#f2c418", 0.01, 0.02, (c) => scale(insect(c, { wings: "#e6f2ff", thorax: "#2a2a2a", extra: [box(0.62, 0.15, 0.1, 0, 0.35, -0.25, BK)] }), 0.018), { fly: 1 });
  add("dragonfly", "Dragonfly", S, "Low sky", "Animals", "dragonfly damselfly", "#2bb0a8", 0.02, 0.06, (c) => scale([box(0.05, 0.05, 0.8, 0, 0.3, -0.2, c), ball(0.08, 0, 0.3, 0.25, c), ...eyes(0.05, 0.05, 0.33, 0.3), ...[0.1, -0.05].map((z) => box(1.1, 0.01, 0.12, 0, 0.32, z, "#e6f2ff", { glass: true }))], 0.09), { fly: 1.5 });
  add("fly", "Fly", S, "Low sky", "Animals", "fly housefly bluebottle insect", "#2a2a2a", 0.005, 0.01, (c) => scale(insect(c, { wings: "#e6f2ff", headc: "#8a2a1a" }), 0.01), { fly: 1 });
  add("mosquito", "Mosquito", S, "Low sky", "Animals", "mosquito gnat midge bite", "#5a4a3a", 0.005, 0.01, (c) => scale(insect(c, { wings: "#e6f2ff", extra: [box(0.02, 0.02, 0.3, 0, 0.3, 0.6, DK)] }), 0.008), { fly: 1 });
  add("moth", "Moth", S, "Low sky|Night sky", "Animals", "moth night insect", "#b5a58a", 0.01, 0.03, (c) => scale(insect(c, { wings: c, solid: true }), 0.04), { fly: 2 });
  add("cloud", "Cloud", S, "Low sky|High sky", "Nature", "cloud fluffy cumulus weather", "#f4f6f8", 2, 6, (c) => [ball(3, 0, 3, 0, c), ball(2.4, 3, 2.4, 0.3, c), ball(2.2, -3.2, 2.2, -0.2, c), ball(2, 1.4, 4.6, -0.5, c), ball(1.8, -1.6, 4, 0.5, c)], { fly: 40 });
  add("rain-cloud", "Rain cloud", S, "Low sky", "Nature", "rain cloud storm grey cloud weather", "#7a8088", 2, 6, (c) => [ball(3, 0, 5, 0, c), ball(2.4, 3, 4.6, 0.3, c), ball(2.2, -3.2, 4.4, -0.2, c), ...[-3, -1.5, 0, 1.5, 3].map((x, i) => box(0.05, 2, 0.05, x, 1.5 + (i % 2) * 0.5, (i % 3) - 1, "#9fc6d9", { glass: true }))], { fly: 30 });
  add("moon", "Moon", S, "Night sky", "Nature", "moon full moon lunar night", "#e8e4d0", 3, 3, (c) => [ball(3, 0, 3, 0, c, { glow: true }), ball(0.6, 1, 3.8, 2.6, shade(c, -0.15)), ball(0.4, -1.2, 2.4, 2.7, shade(c, -0.15))], { fly: 80 });
  add("sun", "Sun", S, "High sky", "Nature", "sun sunshine daylight", "#ffd24f", 6, 6, (c) => [ball(6, 0, 6, 0, c, { glow: true })], { fly: 120 });
  add("stars", "Stars", S, "Night sky", "Nature", "stars starry night twinkle constellation", "#fff6c8", 1, 6, (c) => [[0, 0, 0], [2, 1, -1], [-2.5, 0.5, 0.5], [1, 2.5, 1], [-1, 3, -1], [3.5, 2.8, 0], [-3.8, 2.2, -0.5], [0.4, 4.2, 0.3]].map(([x, y, z], i) => ball(0.12 + (i % 3) * 0.06, x, y + 0.3, z, c, { glow: true })), { fly: 60 });
  add("blimp", "Blimp", S, "Low sky|High sky", "Vehicles", "blimp airship zeppelin dirigible", "#c8ccd0", 3, 9, (c) => [cylZ(3, 14, 0, 6, 0, c), ball(3, 0, 6, 7, c), ball(3, 0, 6, -7, c), wedge(0.2, 3, 3, 0, 10, -8.5, shade(c, -0.2)), box(5, 0.2, 2.5, 0, 6, -8.5, shade(c, -0.2)), box(1.5, 1.2, 4, 0, 2.6, 1, "#5a5a62"), quad(1.2, 0.5, 0, 2.7, 3.01, GL, { glass: true })], { fly: 50 });
  add("paper-plane", "Paper plane", S, "Low sky", "Things", "paper plane paper airplane dart", "#f4f1ea", 0.05, 0.2, (c) => [wedge(0.12, 0.05, 0.3, -0.06, 0.03, 0, c, { ry: 180, rz: 10 }), wedge(0.12, 0.05, 0.3, 0.06, 0.03, 0, c, { ry: 180, rz: -10 }), box(0.01, 0.04, 0.3, 0, 0.02, 0, shade(c, -0.1))], { fly: 1.5 });

  /* ---------- lookup ---------- */
  const byId = {};
  items.forEach((it) => (byId[it.id] = it));
  function find(id) {
    return byId[id] || null;
  }
  function search(text, f) {
    f = f || {};
    const words = String(text || "").toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((it) => {
      if (f.world && it.world !== f.world) return false;
      if (f.place && it.places.indexOf(f.place) < 0) return false;
      if (f.type && it.type !== f.type) return false;
      const hay = [it.id, it.name, it.tags, it.places.join(" "), it.world, it.type].join(" ").toLowerCase();
      return words.every((w) => hay.indexOf(w) >= 0);
    });
  }
  window.CurioObjects = { WORLDS, PLACES, TYPES, items, find, search };
})();
