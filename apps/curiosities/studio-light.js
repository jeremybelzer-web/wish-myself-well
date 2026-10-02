/* Studio: Light & look. A 2D lighting stage after Arnold for Maya lights: area, spot, point,
   directional, skydome and mesh (a practical lamp in frame). Each light has intensity and exposure
   in stops (effective = intensity x 2^exposure), a colour from Kelvin or a swatch, normalize, size
   (shadow softness), quadratic decay and light filters (barndoor, gobo, blocker). A small render
   shades a head and shoulders against a back wall, with haze, and a Toon or Ink look for panels.
   The setup reads back as curiosities (key, contrast, colorTemp, softness, rim, lightCount,
   practicalInFrame, lightShape, atmosphere, lighting). The live ones go to the board as a strand. */

(function () {
  if (!window.CuriosityStudio) return;

  const KEY = "curiosities-studio-light-v1";
  const W = 240;
  const H = 180;
  const PX = 4; /* render pixels per world unit */
  const M = 20; /* world units per metre */
  const WALL_Y = 24; /* plan y of the back wall */
  const CAM_Y = 190; /* plan y of the camera */
  const HEAD = { c: [0, (90 - 72) / PX, 0], r: [8, 8, 8] };
  const TORSO = { c: [0, (90 - 200) / PX, 0], r: [95 / PX, 80 / PX, 10] };
  const NECK_R = 13 / PX;
  const WALL_Z = WALL_Y - 100;

  const TYPES = {
    area: { label: "Area", glyph: "A", note: "A rectangle of light. Size is softness." },
    spot: { label: "Spot", glyph: "S", note: "A cone with a penumbra. Gobos and barndoors shape it." },
    point: { label: "Point", glyph: "P", note: "A bare bulb. Hard shadows unless you give it radius." },
    directional: { label: "Directional", glyph: "D", note: "The sun. Parallel rays, no falloff." },
    skydome: { label: "Skydome", glyph: "K", note: "Light from the whole sky. Ambient fill in one colour." },
    mesh: { label: "Mesh / practical", glyph: "M", note: "A lamp you can see in frame." },
  };
  const GOBOS = ["none", "blinds", "leaves", "window"];

  function light(type, o) {
    return Object.assign(
      {
        type,
        x: 60,
        y: 140,
        elev: 25,
        intensity: 1,
        exposure: 4,
        useK: true,
        kelvin: 5600,
        color: "#ffffff",
        sky: "#9fb6d6",
        size: type === "area" ? 1 : type === "mesh" ? 0.5 : 0.1,
        cone: 45,
        penumbra: 8,
        normalize: true,
        decay: true,
        barndoor: 0,
        gobo: "none",
        blocker: false,
      },
      o || {}
    );
  }

  const PRESETS = [
    {
      name: "Three-point classic",
      note: "A soft key three-quarters front, a dimmer fill on the other side, a hard spot from behind for the edge.",
      set: { camExp: 0, haze: 0, look: "realistic" },
      lights: [
        light("area", { x: 58, y: 145, elev: 30, exposure: 4.2, kelvin: 4300, size: 1.2 }),
        light("area", { x: 148, y: 150, elev: 10, exposure: 1.4, kelvin: 4800, size: 2 }),
        light("spot", { x: 135, y: 52, elev: 35, exposure: 4.6, kelvin: 5600, cone: 30, size: 0.1 }),
      ],
    },
    {
      name: "High-key sitcom",
      note: "Big soft sources near the camera and a bright sky fill. Low contrast, almost no shadow.",
      set: { camExp: 0.5, haze: 0, look: "realistic" },
      lights: [
        light("area", { x: 85, y: 165, elev: 25, exposure: 4, kelvin: 5200, size: 3 }),
        light("area", { x: 125, y: 165, elev: 20, exposure: 3.6, kelvin: 5200, size: 3 }),
        light("skydome", { x: 20, y: 180, exposure: 0.2, intensity: 1, sky: "#ffffff", useK: false }),
        light("area", { x: 100, y: 48, elev: 40, exposure: 3, kelvin: 5600, size: 1.5 }),
      ],
    },
    {
      name: "Low-key noir, blinds",
      note: "One hard spot from the side through a blinds gobo. The bars land on the face and the wall. Haze in the air.",
      set: { camExp: 0, haze: 0.35, look: "realistic" },
      lights: [
        light("spot", { x: 34, y: 92, elev: 22, exposure: 5.6, kelvin: 4500, cone: 40, penumbra: 4, size: 0.05, gobo: "blinds" }),
        light("skydome", { x: 20, y: 180, exposure: -3, sky: "#5d6f90", useK: false }),
      ],
    },
    {
      name: "Golden hour window",
      note: "A low warm sun through window panes, cool sky fill from the rest of the room, a little haze.",
      set: { camExp: 0, haze: 0.25, look: "realistic" },
      lights: [
        light("directional", { x: 28, y: 82, elev: 9, exposure: 1.4, kelvin: 2700, size: 0.2, gobo: "window" }),
        light("skydome", { x: 20, y: 180, exposure: -1.3, sky: "#9fb6d6", useK: false }),
      ],
    },
    {
      name: "Under-light horror",
      note: "A bare bulb below the chin. Shadows fall upward; the brow and the wall above go strange.",
      set: { camExp: 0, haze: 0.1, look: "realistic" },
      lights: [
        light("point", { x: 100, y: 120, elev: -50, exposure: 3, useK: false, color: "#c8ffb8", size: 0.05 }),
        light("skydome", { x: 20, y: 180, exposure: -4, sky: "#304030", useK: false }),
      ],
    },
    {
      name: "Silhouette backlight",
      note: "A large source between subject and wall lights the wall, not the face. The figure goes black with an edge.",
      set: { camExp: -0.5, haze: 0.15, look: "realistic" },
      lights: [
        light("area", { x: 100, y: 38, elev: 0, exposure: 5.6, kelvin: 6500, size: 3 }),
        light("spot", { x: 140, y: 58, elev: 30, exposure: 5, kelvin: 6500, cone: 25, size: 0.05 }),
      ],
    },
    {
      name: "Single practical lamp",
      note: "A table lamp in frame is the only source. Warm, falls off fast, the far side goes to black.",
      set: { camExp: 0.3, haze: 0.05, look: "realistic" },
      lights: [light("mesh", { x: 74, y: 86, elev: -8, exposure: 3.4, kelvin: 2700, size: 0.5 })],
    },
    {
      name: "Moonlight blue",
      note: "A cool, dim, high sun stands in for the moon, with a dark blue sky fill. Exposure pulled down.",
      set: { camExp: -0.5, haze: 0.2, look: "realistic" },
      lights: [
        light("directional", { x: 165, y: 62, elev: 35, exposure: 1.3, kelvin: 9500, size: 0.1 }),
        light("skydome", { x: 20, y: 180, exposure: -0.6, sky: "#1a2440", useK: false }),
      ],
    },
  ];

  const DEFAULTS = { camExp: 0, haze: 0, look: "realistic", bands: 3, sel: 0, lights: PRESETS[0].lights };

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  /* ---------- colour ---------- */

  /* Kelvin to RGB, Tanner Helland's fit to the blackbody curve, 1000 to 40000 K. Returned 0..1. */
  function kelvinRGB(k) {
    const t = Math.max(1500, Math.min(12000, k)) / 100;
    let r, g, b;
    if (t <= 66) {
      r = 255;
      g = 99.4708025861 * Math.log(t) - 161.1195681661;
      b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    } else {
      r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
      b = 255;
    }
    return [r, g, b].map((v) => Math.max(0, Math.min(255, v)) / 255);
  }
  function hexRGB(h) {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || "");
    if (!m) return [1, 1, 1];
    const n = parseInt(m[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function rgbHex(c) {
    return "#" + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
  }
  /* Display colour to linear, so shading adds up the way Arnold's does. */
  function lin(c) {
    return c.map((v) => Math.pow(v, 2.2));
  }
  function lightColor(L) {
    if (L.type === "skydome") return hexRGB(L.sky);
    return L.useK ? kelvinRGB(L.kelvin) : hexRGB(L.color);
  }
  /* The nearest Kelvin for a swatch colour, by red/blue balance. */
  function colorKelvin(L) {
    if (L.useK && L.type !== "skydome") return L.kelvin;
    const c = lightColor(L);
    let best = 6500,
      err = 1e9;
    for (let k = 1500; k <= 12000; k += 100) {
      const q = kelvinRGB(k);
      const e = Math.abs(q[2] / (q[0] + 1e-3) - c[2] / (c[0] + 1e-3));
      if (e < err) {
        err = e;
        best = k;
      }
    }
    return best;
  }

  /* ---------- vectors ---------- */

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = (a) => Math.sqrt(dot(a, a));
  const norm = (a) => {
    const l = len(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function smooth(a, b, x) {
    if (a === b) return x < a ? 0 : 1;
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /* ---------- lights prepared for shading ---------- */

  function effective(L) {
    return L.intensity * Math.pow(2, L.exposure);
  }

  function prep(st) {
    return st.lights.map((L) => {
      const col = lin(lightColor(L));
      let power = effective(L);
      /* Normalize off: an area or mesh light gets brighter as it grows, as in Arnold. */
      if (!L.normalize && (L.type === "area" || L.type === "mesh")) power *= Math.max(0.05, L.size * L.size);
      const dx = L.x - 100;
      const dz = L.y - 100;
      const horiz = Math.max(1, Math.hypot(dx, dz));
      const e = (clamp(L.elev, -85, 85) * Math.PI) / 180;
      let pos = [dx, HEAD.c[1] + horiz * Math.tan(e), dz];
      const dir = norm(sub(pos, HEAD.c));
      if (L.type === "directional") pos = [HEAD.c[0] + dir[0] * 300, HEAD.c[1] + dir[1] * 300, HEAD.c[2] + dir[2] * 300];
      const axis = norm(sub(HEAD.c, pos));
      let up = [0, 1, 0];
      if (Math.abs(axis[1]) > 0.95) up = [0, 0, 1];
      const R = norm(cross(axis, up));
      const U = cross(R, axis);
      const half = ((L.cone / 2) * Math.PI) / 180;
      const inner = Math.max(0, half - (L.penumbra * Math.PI) / 180);
      return {
        src: L,
        type: L.type,
        col: [col[0] * power, col[1] * power, col[2] * power],
        pos,
        dir,
        axis,
        R,
        U,
        size: L.size,
        cosOuter: Math.cos(half),
        cosInner: Math.cos(inner),
        gobo: L.gobo,
        barn: L.barndoor,
        blocker: L.blocker,
        decay: L.decay,
        shaped: L.type === "spot" || L.type === "directional" || L.type === "area",
      };
    });
  }

  /* Light filters in the light's own frame: u, v are tangents off its axis. */
  function filters(L, P) {
    let m = 1;
    const w = sub(P, L.pos);
    const z = dot(w, L.axis);
    if (z <= 0) return L.type === "spot" ? 0 : 1;
    /* A directional light is parallel: its pattern is projected flat, as if from 60 units away. */
    const zz = L.type === "directional" ? 60 : z;
    const u = dot(w, L.R) / zz;
    const v = dot(w, L.U) / zz;
    const soft = 0.004 + L.size * 0.02;
    if (L.type === "spot") {
      const c = z / len(w);
      m *= smooth(L.cosOuter, L.cosInner + 1e-4, c);
    }
    if (L.barn > 0) {
      const lim = 1.2 - L.barn * 1.08;
      m *= 1 - smooth(lim - soft * 4, lim + soft * 4, Math.abs(u));
      m *= 1 - smooth(lim * 0.8 - soft * 4, lim * 0.8 + soft * 4, Math.abs(v));
    }
    if (L.blocker) m *= 0.08 + 0.92 * smooth(-0.07 - soft * 3, -0.07 + soft * 3, v);
    if (L.gobo === "blinds") {
      const f = (v * 15) % 1;
      const g = f < 0 ? f + 1 : f;
      m *= smooth(0.45 - soft * 8, 0.45 + soft * 8, g) * (1 - smooth(0.95 - soft * 8, 0.95 + soft * 8, g)) * 1.2;
    } else if (L.gobo === "leaves") {
      const s = Math.sin(u * 23 + Math.sin(v * 17) * 2.2) * Math.sin(v * 19 + Math.sin(u * 13) * 1.7) + 0.5 * Math.sin(u * 41 - v * 37);
      m *= smooth(-0.05 - soft * 6, 0.05 + soft * 6, s);
    } else if (L.gobo === "window") {
      const wu = u - 0.07,
        wv = v - 0.05;
      const inside = (1 - smooth(0.2 - soft * 3, 0.2 + soft * 3, Math.abs(wu))) * (1 - smooth(0.26 - soft * 3, 0.26 + soft * 3, Math.abs(wv)));
      const mull = smooth(0.01, 0.01 + soft * 3, Math.abs(wu)) * smooth(0.01, 0.01 + soft * 3, Math.abs(wv));
      m *= inside * mull;
    }
    return m;
  }

  /* Soft occlusion by an ellipsoid between P and the light. */
  function occlude(P, dir, maxT, E, size) {
    const p = [(P[0] - E.c[0]) / E.r[0], (P[1] - E.c[1]) / E.r[1], (P[2] - E.c[2]) / E.r[2]];
    const d = [dir[0] / E.r[0], dir[1] / E.r[1], dir[2] / E.r[2]];
    const dl = len(d);
    const dn = [d[0] / dl, d[1] / dl, d[2] / dl];
    const t = -dot(p, dn);
    if (t <= 0) return 1;
    const tMax = maxT * dl;
    if (t > tMax) return 1;
    const q = [p[0] + dn[0] * t, p[1] + dn[1] * t, p[2] + dn[2] * t];
    const closest = len(q);
    const w = Math.min(1.2, 0.03 + (size * 1.4 * t) / Math.max(0.5, tMax - t));
    return smooth(1 - w, 1 + w, closest);
  }

  /* Light arriving at point P with normal n (null for air). obj: 0 wall, 1 head, 2 neck, 3 torso. */
  function arrive(L, P, n, obj, shadows) {
    if (L.type === "skydome") {
      if (!n) return 0;
      const s = 0.55 + 0.45 * n[1];
      return obj === 0 ? s * 0.8 : s;
    }
    let ldir, atten, dist;
    if (L.type === "directional") {
      ldir = L.dir;
      atten = 1;
      dist = 1e4;
    } else {
      const v = sub(L.pos, P);
      dist = len(v);
      ldir = [v[0] / dist, v[1] / dist, v[2] / dist];
      atten = L.decay ? 1 / Math.max(0.04, (dist / M) * (dist / M)) : 1;
    }
    let shade = 1;
    if (n) {
      const ndl = dot(n, ldir);
      const wrap = L.type === "directional" ? 0.03 : Math.min(0.5, L.size * (L.type === "area" || L.type === "mesh" ? 0.16 : 0.1));
      shade = Math.max(0, (ndl + wrap) / (1 + wrap));
      if (obj > 0 && ldir[2] < -0.05) {
        /* Rim: grazing light from behind catches the silhouette edge. */
        const edge = Math.pow(1 - Math.max(0, n[2]), 3);
        shade += edge * -ldir[2] * Math.max(0, n[0] * ldir[0] + n[1] * ldir[1] + 0.45) * 1.4;
      }
      if (shade <= 0) return 0;
    }
    let m = filters(L, P);
    if (m <= 0) return 0;
    if (shadows) {
      if (obj !== 1) m *= occlude(P, ldir, dist, HEAD, L.size);
      if (obj !== 3 && obj !== 2) m *= occlude(P, ldir, dist, TORSO, L.size);
    }
    return shade * atten * m;
  }

  /* ---------- render ---------- */

  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const octx = off.getContext("2d");
  const img = octx.createImageData(W, H);
  const ids = new Uint8Array(W * H);
  const lum = new Float32Array(W * H);
  const rgbBuf = new Float32Array(W * H * 3);
  const volBuf = new Float32Array((W / 2) * (H / 2) * 3);

  function surface(px, py) {
    const X = (px - 120) / PX;
    const Y = (90 - py) / PX;
    /* head */
    let dx = (X - HEAD.c[0]) / HEAD.r[0];
    let dy = (Y - HEAD.c[1]) / HEAD.r[1];
    let r2 = dx * dx + dy * dy;
    if (r2 < 1) {
      const nz = Math.sqrt(1 - r2);
      return { obj: 1, P: [X, Y, nz * HEAD.r[2]], n: [dx, dy, nz] };
    }
    /* neck */
    if (Math.abs(X) < NECK_R && Y < HEAD.c[1] - 5 && Y > -10) {
      const a = X / NECK_R;
      const nz = Math.sqrt(1 - a * a);
      return { obj: 2, P: [X, Y, nz * NECK_R], n: [a, 0, nz] };
    }
    /* torso */
    dx = (X - TORSO.c[0]) / TORSO.r[0];
    dy = (Y - TORSO.c[1]) / TORSO.r[1];
    r2 = dx * dx + dy * dy;
    if (r2 < 1) {
      const c = Math.sqrt(1 - r2);
      return { obj: 3, P: [X, Y, TORSO.c[2] + c * TORSO.r[2]], n: norm([dx / TORSO.r[0], dy / TORSO.r[1], c / TORSO.r[2]]) };
    }
    return { obj: 0, P: [X, Y, WALL_Z], n: [0, 0, 1] };
  }

  const ALBEDO = [lin([0.86, 0.66, 0.54]), lin([0.86, 0.66, 0.54]), lin([0.8, 0.6, 0.5]), lin([0.36, 0.42, 0.55])];
  ALBEDO[0] = lin([0.72, 0.7, 0.66]);

  function practicals(st) {
    return st.lights.filter((L) => L.type === "mesh").map((L) => {
      const dx = L.x - 100;
      const dz = L.y - 100;
      const horiz = Math.max(1, Math.hypot(dx, dz));
      const Y = HEAD.c[1] + horiz * Math.tan((clamp(L.elev, -85, 85) * Math.PI) / 180);
      return { sx: 120 + dx * PX, sy: 90 - Y * PX, z: dz, r: 5 + L.size * 8, col: lightColor(L), L };
    });
  }
  function inFrame(p) {
    return p.L.y < CAM_Y - 10 && p.sx > -p.r && p.sx < W + p.r && p.sy > -p.r && p.sy < H + p.r;
  }

  function render(st, canvas) {
    const Ls = prep(st);
    const scale = Math.pow(2, st.camExp) * 0.7;
    const haze = st.haze;
    const pr = practicals(st).filter(inFrame);
    /* Volume on a half-resolution grid: march the view ray toward the surface and gather in-scatter. */
    if (haze > 0.01) {
      const vw = W / 2;
      for (let by = 0; by < H / 2; by++) {
        for (let bx = 0; bx < vw; bx++) {
          const s = surface(bx * 2 + 1, by * 2 + 1);
          const z0 = 40;
          const z1 = s.P[2];
          const steps = 7;
          const dz = (z0 - z1) / steps;
          let r = 0,
            g = 0,
            b = 0;
          for (let i = 0; i < steps; i++) {
            const P = [s.P[0], s.P[1], z1 + dz * (i + 0.5)];
            for (const L of Ls) {
              if (L.type === "skydome") continue;
              const a = arrive(L, P, null, 0, true);
              if (a > 0) {
                r += L.col[0] * a;
                g += L.col[1] * a;
                b += L.col[2] * a;
              }
            }
          }
          const k = (haze * dz) / 260;
          const o = (by * vw + bx) * 3;
          volBuf[o] = r * k;
          volBuf[o + 1] = g * k;
          volBuf[o + 2] = b * k;
        }
      }
    }
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const s = surface(px, py);
        const i = py * W + px;
        ids[i] = s.obj;
        let r = 0,
          g = 0,
          b = 0;
        for (const L of Ls) {
          const a = arrive(L, s.P, s.n, s.obj, true);
          if (a > 0) {
            r += L.col[0] * a;
            g += L.col[1] * a;
            b += L.col[2] * a;
          }
        }
        const al = ALBEDO[s.obj];
        r *= al[0];
        g *= al[1];
        b *= al[2];
        /* practical lamp shade glows; drawn when it sits in front of what is behind it */
        for (const p of pr) {
          const dd = Math.hypot(px - p.sx, py - p.sy);
          if (dd < p.r * 2.2 && p.z > s.P[2] - 0.5) {
            const glow = dd < p.r ? 6 : 6 * Math.pow(1 - (dd - p.r) / (p.r * 1.2), 2) * 0.25;
            const lc = lin(p.col);
            const e = glow * Math.pow(2, p.L.exposure - 3);
            r += lc[0] * e;
            g += lc[1] * e;
            b += lc[2] * e;
            if (dd < p.r) ids[i] = 4;
          }
        }
        if (haze > 0.01) {
          const veil = Math.exp(-haze * 0.5 * (40 - s.P[2]) / 60);
          const o = ((py >> 1) * (W / 2) + (px >> 1)) * 3;
          r = r * veil + volBuf[o];
          g = g * veil + volBuf[o + 1];
          b = b * veil + volBuf[o + 2];
        }
        /* camera exposure, a filmic toe and shoulder (ACES fit), then display gamma */
        const t = (v) => {
          const x = v * scale;
          return Math.pow(clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1), 1 / 2.2);
        };
        r = t(r);
        g = t(g);
        b = t(b);
        rgbBuf[i * 3] = r;
        rgbBuf[i * 3 + 1] = g;
        rgbBuf[i * 3 + 2] = b;
        lum[i] = 0.3 * r + 0.59 * g + 0.11 * b;
      }
    }
    const d = img.data;
    const bands = clamp(st.bands || 3, 2, 4);
    /* Ink cuts at a level set by the brightest thing in frame, so a dim scene still reads. */
    let peak = 0;
    for (let i = 0; i < W * H; i++) if (lum[i] > peak) peak = lum[i];
    const cut = Math.max(0.06, peak * 0.45);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const i = py * W + px;
        let r = rgbBuf[i * 3],
          g = rgbBuf[i * 3 + 1],
          b = rgbBuf[i * 3 + 2];
        const l = lum[i];
        const edge = st.look !== "realistic" && ((px + 1 < W && ids[i + 1] !== ids[i]) || (py + 1 < H && ids[i + W] !== ids[i]) || (px > 0 && ids[i - 1] !== ids[i] && ids[i] !== 0));
        if (st.look === "toon") {
          const q = Math.min(1, (Math.floor(l * bands) + 0.35) / bands);
          const k = l > 0.004 ? q / l : 0;
          r = Math.min(1, r * k);
          g = Math.min(1, g * k);
          b = Math.min(1, b * k);
          if (edge) r = g = b = 0.07;
        } else if (st.look === "ink") {
          const on = l > cut && !edge;
          r = on ? 0.97 : 0.11;
          g = on ? 0.94 : 0.09;
          b = on ? 0.89 : 0.07;
        }
        d[i * 4] = r * 255;
        d[i * 4 + 1] = g * 255;
        d[i * 4 + 2] = b * 255;
        d[i * 4 + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = st.look === "realistic";
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }

  /* ---------- measurement ---------- */

  function measure(st) {
    const Ls = prep(st);
    const at = (n, only) => {
      const P = [HEAD.c[0] + n[0] * 8, HEAD.c[1] + n[1] * 8, HEAD.c[2] + n[2] * 8];
      let s = 0;
      Ls.forEach((L) => {
        if (only && L !== only) return;
        const a = arrive(Object.assign({}, L, { gobo: "none" }), P, n, 1, false);
        s += a * (0.3 * L.col[0] + 0.59 * L.col[1] + 0.11 * L.col[2]);
      });
      return s;
    };
    const nR = norm([0.8, 0.12, 0.6]);
    const nL = norm([-0.8, 0.12, 0.6]);
    const probes = [nR, nL, [0, 0.1, 1], norm([0, 0.6, 0.8]), norm([0, -0.6, 0.8])];
    let key = null,
      best = -1;
    Ls.forEach((L) => {
      if (L.type === "skydome" && Ls.some((o) => o.type !== "skydome")) return;
      const v = Math.max.apply(null, probes.map((n) => at(n, L)));
      if (v > best) {
        best = v;
        key = L;
      }
    });
    /* Lit side against the opposite side: left/right cheeks, and brow against chin for top or under light. */
    const pairs = [[nR, nL], [norm([0, 0.75, 0.66]), norm([0, -0.75, 0.66])]].map(([p, q]) => {
      const a = at(p),
        b = at(q);
      return [Math.max(a, b), Math.min(a, b)];
    });
    const pick = pairs[0][0] / Math.max(pairs[0][1], 1e-6) >= pairs[1][0] / Math.max(pairs[1][1], 1e-6) ? pairs[0] : pairs[1];
    const lit = pick[0],
      shadow = pick[1];
    const stops = lit > 0 ? Math.log2(lit / Math.max(shadow, lit / 128)) : 0;
    let dir = "none";
    if (key) {
      const l = key.type === "skydome" ? [0, 1, 0] : key.dir;
      const elev = (Math.asin(clamp(l[1], -1, 1)) * 180) / Math.PI;
      if (key.type === "skydome") dir = "top";
      else if (elev < -25) dir = "under";
      else if (elev > 62) dir = "top";
      else if (l[2] < -0.25 && -l[2] > Math.abs(l[0]) * 0.8) dir = "back";
      else if (Math.abs(l[0]) > Math.abs(l[2]) * 0.9) dir = "side";
      else dir = "front";
    }
    /* Rim: light from behind the subject relative to the key on the lit side. */
    let rimE = 0;
    Ls.forEach((L) => {
      if (L === key || L.type === "skydome" || L.dir[2] > -0.15) return;
      const n = norm([L.dir[0] * 0.9, L.dir[1] * 0.9 + 0.1, 0.05]);
      rimE += at(n, L) * -L.dir[2];
    });
    const rimRatio = lit > 0 ? rimE / lit : rimE > 0 ? 1 : 0;
    return { key, keyLight: key && key.src, lit, shadow, stops, dir, rimRatio };
  }

  /* The curiosities this setup produces, in the catalog's words. */
  function curiosities(st, m) {
    const working = st.lights.filter((L) => effective(L) > 0.02);
    const k = m.keyLight;
    const pr = practicals(st).filter(inFrame);
    const kelvin = k ? colorKelvin(k) : 5600;
    const shaped = st.lights.find((L) => L.gobo !== "none") || st.lights.find((L) => L.barndoor > 0.25);
    let shape = "open";
    if (shaped) shape = shaped.gobo === "leaves" ? "leaves" : shaped.gobo === "blinds" || shaped.gobo === "window" ? "blinds" : "barndoor";
    const beamy = st.lights.some((L) => L.type === "spot" || L.type === "directional" || L.gobo !== "none");
    const atmosphere = st.haze < 0.06 ? "clear" : st.haze > 0.3 && beamy ? "beams" : "haze";
    const soft = k ? (k.type === "skydome" ? true : (k.type === "area" || k.type === "mesh" ? k.size >= 0.6 : k.size >= 1.5)) : true;
    const rim = m.rimRatio < 0.08 ? "off" : m.rimRatio < 0.5 ? "thin" : "strong";
    const contrast = clamp(Math.round(m.stops), 0, 6);
    let lighting = "hard";
    if (pr.length && k && k.type === "mesh") lighting = "practical";
    else if (kelvin >= 7000) lighting = "moon";
    else if (kelvin <= 3500) lighting = "dusk";
    else if (m.stops < 1.5) lighting = "flat";
    else if (pr.length) lighting = "practical";
    return {
      key: m.dir === "top" ? "front" : m.dir,
      contrast: String(contrast),
      colorTemp: String(clamp(Math.round(kelvin / 100) * 100, 2700, 7500)),
      softness: soft ? "soft" : "hard",
      rim,
      lightCount: String(clamp(working.length, 1, 8)),
      practicalInFrame: pr.length ? "yes" : "no",
      lightShape: shape,
      atmosphere,
      lighting,
    };
  }

  /* Snap to live board rows only. */
  function boardValues(values) {
    const rows = typeof CURIOSITIES !== "undefined" ? CURIOSITIES : [];
    const out = {};
    Object.entries(values).forEach(([id, v]) => {
      const c = rows.find((r) => r.id === id && r.live);
      if (!c) return;
      let val = v;
      if (c.kind === "range") {
        const n = Number(v);
        val = String(clamp(Math.round(isNaN(n) ? c.value : n), c.min, c.max));
      } else if (c.options) {
        if (!c.options.includes(v)) val = c.options.includes(c.value) ? c.value : c.options[0];
      }
      out[id] = [val, val, val, val];
    });
    return out;
  }

  /* ---------- UI ---------- */

  const CSS = `
  .lt-stage { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 12px; align-items: start; }
  @media (max-width: 900px) { .lt-stage { grid-template-columns: 1fr; } }
  .lt-plan { touch-action: none; user-select: none; }
  .lt-plan .lt-light { cursor: grab; }
  .lt-plan .lt-light.on circle.body { stroke: var(--saffron); stroke-width: 2.4; }
  .lt-list { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 10px; }
  .lt-list button, .lt-add button { font-family: var(--mono); font-size: 10px; border: 1px solid var(--ink); background: var(--panel); padding: 3px 6px; cursor: pointer; }
  .lt-list button.on { background: var(--ink); color: var(--paper); }
  .lt-add { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 12px; }
  .lt-swatch { display: inline-block; width: 10px; height: 10px; border: 1px solid var(--ink); vertical-align: -1px; margin-right: 4px; }
  .lt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
  .lt-row label.field { margin-bottom: 8px; }
  .lt-check { display: flex; gap: 6px; align-items: center; font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px; }
  .lt-read { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px; margin: 10px 0; }
  .lt-read div { border: 1px solid var(--line); background: var(--panel); padding: 6px 8px; }
  .lt-read b { display: block; font-family: var(--mono); font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.06em; color: #6a5d4f; }
  .lt-read span { font-family: var(--serif); font-size: 18px; }
  .lt-box { border: 1px solid var(--line); background: var(--panel); padding: 10px; margin: 0 0 12px; }
  .lt-box h3 { margin: 0 0 8px; font-family: var(--serif); font-weight: 500; font-size: 16px; }
  .studio-body .lt-render canvas { image-rendering: auto; }
  .studio-body .lt-render.crisp canvas { image-rendering: pixelated; }
  `;
  function injectCss() {
    if (document.getElementById("studio-light")) return;
    const s = document.createElement("style");
    s.id = "studio-light";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function draw(el, api) {
    injectCss();
    const esc = api.esc;
    const db = api.store(KEY);
    let st = Object.assign(clone(DEFAULTS), db.get({}) || {});
    st.lights = (st.lights || []).map((L) => light(L.type in TYPES ? L.type : "point", L));
    if (st.sel >= st.lights.length) st.sel = st.lights.length - 1;
    let preset = "";
    const save = () => db.set(st);

    function rng(k, label, min, max, step, v, fmt) {
      return `<label class="field">${esc(label)} <output data-out="${k}">${esc(fmt ? fmt(v) : v)}</output><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
    }
    function check(k, label, v) {
      return `<label class="lt-check"><input type="checkbox" data-k="${k}" ${v ? "checked" : ""}> ${esc(label)}</label>`;
    }

    function lightEditor() {
      const L = st.lights[st.sel];
      if (!L) return `<p class="cap">No lights. Add one above.</p>`;
      const t = L.type;
      const point = t !== "skydome";
      const kelvinOk = t !== "skydome";
      return `<div class="lt-box"><h3>${esc(TYPES[t].label)} light</h3>
        <p class="cap" style="margin-bottom:8px">${esc(TYPES[t].note)}</p>
        <label class="field">Type<select data-k="type">${Object.keys(TYPES).map((k) => `<option value="${k}" ${k === t ? "selected" : ""}>${esc(TYPES[k].label)}</option>`).join("")}</select></label>
        <div class="lt-row">
          ${rng("intensity", "Intensity", 0, 10, 0.05, L.intensity)}
          ${rng("exposure", "Exposure (stops)", -6, 12, 0.1, L.exposure)}
        </div>
        <p class="cap mono" data-out="eff" style="margin:-2px 0 8px">effective ${effective(L).toFixed(2)} = ${L.intensity} × 2^${L.exposure}</p>
        ${
          kelvinOk
            ? `${check("useK", "Use color temperature", L.useK)}
               ${L.useK ? rng("kelvin", "Temperature (K)", 1500, 12000, 100, L.kelvin) : `<label class="field">Color<input type="color" data-k="color" value="${esc(L.color)}"></label>`}`
            : `<label class="field">Sky color<input type="color" data-k="sky" value="${esc(L.sky)}"></label>`
        }
        ${point ? rng("elev", "Height (elevation °)", -80, 85, 1, L.elev) : ""}
        ${t === "area" || t === "mesh" || t === "point" || t === "spot" || t === "directional" ? rng("size", t === "directional" ? "Angle / softness" : "Size / radius (softness)", 0.02, 4, 0.02, L.size) : ""}
        ${t === "spot" ? `<div class="lt-row">${rng("cone", "Cone angle", 5, 120, 1, L.cone)}${rng("penumbra", "Penumbra", 0, 30, 1, L.penumbra)}</div>` : ""}
        ${t === "area" || t === "mesh" ? check("normalize", "Normalize", L.normalize) : ""}
        ${t !== "directional" && point ? check("decay", "Quadratic decay", L.decay) : ""}
        ${
          point
            ? `<h3 style="margin-top:6px">Light filters</h3>
          ${rng("barndoor", "Barndoor", 0, 1, 0.05, L.barndoor)}
          <label class="field">Gobo<select data-k="gobo">${GOBOS.map((g) => `<option ${g === L.gobo ? "selected" : ""}>${g}</option>`).join("")}</select></label>
          ${check("blocker", "Blocker (cuts the lower beam)", L.blocker)}`
            : ""
        }
        <button type="button" data-act="remove">Remove light</button>
      </div>`;
    }

    function listHtml() {
      return st.lights
        .map((L, i) => `<button type="button" data-pick="${i}" class="${i === st.sel ? "on" : ""}"><span class="lt-swatch" style="background:${rgbHex(lightColor(L))}"></span>${esc(TYPES[L.type].glyph)}${i + 1} ${esc(TYPES[L.type].label.split(" ")[0])} ${effective(L).toFixed(1)}</button>`)
        .join("");
    }

    el.innerHTML = `<div class="studio-grid">
      <div>
        <label class="field">Preset<select data-g="preset"><option value="">Choose a setup</option>${PRESETS.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join("")}</select></label>
        <p class="cap" data-out="pnote" style="margin:-6px 0 10px"></p>
        <label class="field">Look<select data-g="look">${[["realistic", "Realistic"], ["toon", "Toon (comic, bands + outline)"], ["ink", "Ink (zine, black and white)"]].map(([v, l]) => `<option value="${v}" ${st.look === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <div data-out="bandsBox">${st.look === "toon" ? `<label class="field">Toon bands <output data-out="bands">${st.bands}</output><input type="range" data-g="bands" min="2" max="4" step="1" value="${st.bands}"></label>` : ""}</div>
        <label class="field">Camera exposure (stops) <output data-out="camExp">${st.camExp}</output><input type="range" data-g="camExp" min="-4" max="4" step="0.1" value="${st.camExp}"></label>
        <label class="field">Atmosphere / haze <output data-out="haze">${st.haze}</output><input type="range" data-g="haze" min="0" max="1" step="0.01" value="${st.haze}"></label>
        <p class="group-label">Lights</p>
        <div class="lt-list" data-out="list">${listHtml()}</div>
        <div class="lt-add">${Object.keys(TYPES).map((k) => `<button type="button" data-add="${k}">+ ${esc(TYPES[k].label.split(" ")[0])}</button>`).join("")}</div>
        <div data-out="editor">${lightEditor()}</div>
      </div>
      <div>
        <div class="lt-stage">
          <div><svg class="view lt-plan" viewBox="0 0 200 200" role="img" aria-label="Floor plan with lights"></svg><p class="cap">Floor plan from above. Drag a light. The camera sits at the bottom.</p></div>
          <div class="lt-render"><canvas width="480" height="360" aria-label="Render of the subject"></canvas><p class="cap">The render, head and shoulders against the back wall.</p></div>
        </div>
        <div class="lt-read" data-out="read"></div>
        <div data-out="chips"></div>
        <p><button type="button" data-act="board">Send to board</button> <span class="cap" data-out="boardNote"></span></p>
      </div>
    </div>`;

    const svg = el.querySelector("svg.lt-plan");
    const canvas = el.querySelector(".lt-render canvas");
    const out = (k) => el.querySelector(`[data-out="${k}"]`);

    function planHtml() {
      const camera = `<g><rect x="92" y="${CAM_Y - 6}" width="16" height="10" fill="#1c1712"/><path d="M96 ${CAM_Y - 6} L100 ${CAM_Y - 12} L104 ${CAM_Y - 6}Z" fill="#1c1712"/><text x="112" y="${CAM_Y + 2}" font-size="7" font-family="monospace" fill="#1c1712">camera</text></g>`;
      const frame = `<path d="M70 ${WALL_Y} L70 ${CAM_Y - 10} M130 ${WALL_Y} L130 ${CAM_Y - 10}" stroke="#1c1712" stroke-opacity="0.18" stroke-dasharray="2 3"/>`;
      const wall = `<rect x="0" y="${WALL_Y - 6}" width="200" height="6" fill="#d8ccb8"/><line x1="0" y1="${WALL_Y}" x2="200" y2="${WALL_Y}" stroke="#1c1712"/><text x="4" y="${WALL_Y - 9}" font-size="7" font-family="monospace" fill="#1c1712">back wall</text>`;
      const subject = `<ellipse cx="100" cy="100" rx="22" ry="9" fill="#5b6a86" opacity="0.6"/><circle cx="100" cy="100" r="8" fill="#e2b79b" stroke="#1c1712"/><line x1="100" y1="106" x2="100" y2="111" stroke="#1c1712" stroke-width="1.5"/>`;
      const lights = st.lights
        .map((L, i) => {
          const c = rgbHex(lightColor(L));
          const on = i === st.sel ? "on" : "";
          if (L.type === "skydome") {
            return `<g class="lt-light ${on}" data-i="${i}"><circle cx="100" cy="100" r="96" fill="none" stroke="${c}" stroke-width="3" stroke-opacity="0.5" stroke-dasharray="4 4"/><circle class="body" cx="${L.x}" cy="${L.y}" r="7" fill="${c}" stroke="#1c1712"/><text x="${L.x}" y="${L.y + 2.5}" font-size="7" text-anchor="middle" font-family="monospace">K</text></g>`;
          }
          const ang = Math.atan2(100 - L.y, 100 - L.x);
          let beam = "";
          if (L.type === "spot") {
            const h = ((L.cone / 2) * Math.PI) / 180;
            const d = Math.hypot(100 - L.x, 100 - L.y) + 30;
            const p1 = [L.x + Math.cos(ang - h) * d, L.y + Math.sin(ang - h) * d];
            const p2 = [L.x + Math.cos(ang + h) * d, L.y + Math.sin(ang + h) * d];
            beam = `<path d="M${L.x} ${L.y} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z" fill="${c}" fill-opacity="0.25" stroke="${c}" stroke-opacity="0.6"/>`;
          } else if (L.type === "directional") {
            beam = [-8, 0, 8]
              .map((o) => {
                const ox = -Math.sin(ang) * o,
                  oy = Math.cos(ang) * o;
                return `<line x1="${L.x + ox}" y1="${L.y + oy}" x2="${(L.x + ox + Math.cos(ang) * 22).toFixed(1)}" y2="${(L.y + oy + Math.sin(ang) * 22).toFixed(1)}" stroke="${c}" stroke-width="1.5" marker-end="url(#lt-arrow)"/>`;
              })
              .join("");
          } else {
            beam = `<line x1="${L.x}" y1="${L.y}" x2="100" y2="100" stroke="${c}" stroke-opacity="0.7" stroke-dasharray="2 2"/>`;
          }
          const deg = (ang * 180) / Math.PI;
          let body;
          if (L.type === "area") {
            const w = 6 + L.size * 5;
            body = `<rect class="body" x="${-w}" y="-3" width="${w * 2}" height="6" fill="${c}" stroke="#1c1712" transform="translate(${L.x} ${L.y}) rotate(${deg + 90})"/>`;
          } else if (L.type === "mesh") {
            body = `<path class="body" d="M${L.x - 6} ${L.y + 4} L${L.x - 3} ${L.y - 5} L${L.x + 3} ${L.y - 5} L${L.x + 6} ${L.y + 4}Z" fill="${c}" stroke="#1c1712"/><circle class="body" cx="${L.x}" cy="${L.y}" r="7" fill="transparent" stroke="none"/>`;
          } else body = `<circle class="body" cx="${L.x}" cy="${L.y}" r="6.5" fill="${c}" stroke="#1c1712"/>`;
          const filt = L.gobo !== "none" || L.barndoor > 0 || L.blocker ? `<rect x="${L.x - 2}" y="${L.y - 13}" width="4" height="4" fill="#1c1712"/>` : "";
          return `<g class="lt-light ${on}" data-i="${i}">${beam}${body}${filt}<text x="${L.x}" y="${L.y + 2.5}" font-size="6.5" text-anchor="middle" font-family="monospace" pointer-events="none">${TYPES[L.type].glyph}${i + 1}</text><text x="${L.x + 8}" y="${L.y - 7}" font-size="6" font-family="monospace" fill="#1c1712" pointer-events="none">${L.elev > 0 ? "↑" : L.elev < 0 ? "↓" : ""}${Math.round(L.elev)}°</text></g>`;
        })
        .join("");
      return `<defs><marker id="lt-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#1c1712"/></marker></defs>
        <rect x="0" y="0" width="200" height="200" fill="#fffaf2"/>${wall}${frame}${subject}${camera}${lights}`;
    }

    let pending = false;
    function update(full) {
      if (full) {
        out("editor").innerHTML = lightEditor();
      }
      out("list").innerHTML = listHtml();
      svg.innerHTML = planHtml();
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        render(st, canvas);
        canvas.parentNode.classList.toggle("crisp", st.look !== "realistic");
        const m = measure(st);
        const v = curiosities(st, m);
        const ratio = m.shadow > 0 ? (m.lit / m.shadow) : Infinity;
        const kl = m.keyLight;
        out("read").innerHTML = [
          ["Key", kl ? `${TYPES[kl.type].label.split(" ")[0]} ${st.lights.indexOf(kl) + 1}` : "none"],
          ["Key direction", m.dir],
          ["Key : fill", isFinite(ratio) && ratio < 999 ? `${ratio.toFixed(1)} : 1` : "no fill"],
          ["Contrast", `${m.stops.toFixed(1)} stops`],
          ["Key color", kl ? `${colorKelvin(kl)} K` : "—"],
          ["Camera", `${st.camExp >= 0 ? "+" : ""}${Number(st.camExp).toFixed(1)} EV`],
        ]
          .map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`)
          .join("");
        const bv = boardValues(v);
        out("chips").innerHTML = `<p class="group-label">Curiosities this setup produces</p><p>${Object.entries(v)
          .map(([k, val]) => `<span class="chip ${bv[k] ? "lit" : ""}" title="${bv[k] ? "Live on the board" : "Recorded in a study"}">${esc(k)}: ${esc(val)}${k === "colorTemp" ? " K" : k === "contrast" ? " stops" : ""}</span>`)
          .join("")}</p>`;
        out("boardNote").textContent = Object.keys(bv).length ? `Sends ${Object.keys(bv).join(", ")} to all four panels.` : "None of these are live on the board yet.";
      });
    }

    /* Global controls */
    el.querySelectorAll("[data-g]:not([data-g=\"preset\"])").forEach((inp) => inp.addEventListener("input", () => onGlobal(inp)));
    el.querySelector('[data-g="preset"]').addEventListener("change", (e) => onGlobal(e.target));
    function onGlobal(inp) {
      const k = inp.dataset.g;
      if (k === "preset") {
        if (inp.value === "") return;
        const p = PRESETS[Number(inp.value)];
        preset = p.name;
        st.lights = clone(p.lights);
        Object.assign(st, p.set);
        st.sel = 0;
        out("pnote").textContent = p.note;
        el.querySelector('[data-g="look"]').value = st.look;
        ["camExp", "haze"].forEach((g) => {
          el.querySelector(`[data-g="${g}"]`).value = st[g];
          out(g).textContent = st[g];
        });
        out("bandsBox").innerHTML = "";
      } else if (k === "look") {
        st.look = inp.value;
        out("bandsBox").innerHTML = st.look === "toon" ? `<label class="field">Toon bands <output data-out="bands">${st.bands}</output><input type="range" data-g="bands" min="2" max="4" step="1" value="${st.bands}"></label>` : "";
        const b = out("bandsBox").querySelector("input");
        if (b) b.addEventListener("input", () => onGlobal(b));
      } else {
        st[k] = Number(inp.value);
        const o = out(k);
        if (o) o.textContent = inp.value;
      }
      save();
      update(k === "preset");
    }

    /* Light list, add, editor */
    el.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-pick]");
      const add = e.target.closest("[data-add]");
      const act = e.target.closest("[data-act]");
      if (pick) {
        st.sel = Number(pick.dataset.pick);
        update(true);
      } else if (add) {
        const t = add.dataset.add;
        if (st.lights.length >= 8) return;
        const n = st.lights.length;
        st.lights.push(light(t, { x: 40 + ((n * 37) % 120), y: t === "mesh" ? 80 : 150 - ((n * 23) % 70), exposure: t === "skydome" ? 0 : t === "directional" ? 1 : 4, elev: t === "mesh" ? -5 : 25, useK: t !== "skydome" }));
        st.sel = st.lights.length - 1;
        save();
        update(true);
      } else if (act && act.dataset.act === "remove") {
        st.lights.splice(st.sel, 1);
        st.sel = Math.max(0, st.sel - 1);
        save();
        update(true);
      } else if (act && act.dataset.act === "board") {
        const v = curiosities(st, measure(st));
        api.toBoard(preset ? `Light: ${preset}` : "Light", boardValues(v));
      }
    });
    const editor = out("editor");
    function onEdit(e) {
      const inp = e.target.closest("[data-k]");
      if (!inp) return;
      const L = st.lights[st.sel];
      if (!L) return;
      const k = inp.dataset.k;
      let full = false;
      if (inp.type === "checkbox") {
        L[k] = inp.checked;
        full = k === "useK";
      } else if (inp.type === "range") {
        L[k] = Number(inp.value);
        const o = editor.querySelector(`[data-out="${k}"]`);
        if (o) o.textContent = inp.value;
      } else if (k === "type") {
        st.lights[st.sel] = light(inp.value, Object.assign({}, L, { type: inp.value }));
        full = true;
      } else L[k] = inp.value;
      const eff = editor.querySelector('[data-out="eff"]');
      if (eff && st.lights[st.sel]) {
        const c = st.lights[st.sel];
        eff.textContent = `effective ${effective(c).toFixed(2)} = ${c.intensity} × 2^${c.exposure}`;
      }
      save();
      update(full);
    }
    editor.addEventListener("input", onEdit);
    editor.addEventListener("change", (e) => {
      if (e.target.tagName === "SELECT" || e.target.type === "checkbox") onEdit(e);
    });

    /* Dragging lights on the plan */
    let drag = null;
    function planPoint(e) {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      return p.matrixTransform(ctm.inverse());
    }
    svg.addEventListener("pointerdown", (e) => {
      const g = e.target.closest(".lt-light");
      if (!g) return;
      const i = Number(g.dataset.i);
      drag = i;
      if (st.sel !== i) {
        st.sel = i;
        out("editor").innerHTML = lightEditor();
      }
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (err) {}
      e.preventDefault();
    });
    svg.addEventListener("pointermove", (e) => {
      if (drag == null) return;
      const p = planPoint(e);
      const L = st.lights[drag];
      if (!p || !L) return;
      L.x = Math.round(clamp(p.x, 6, 194));
      L.y = Math.round(clamp(p.y, WALL_Y + 4, 196));
      if (Math.hypot(L.x - 100, L.y - 100) < 12) {
        const a = Math.atan2(L.y - 100, L.x - 100);
        L.x = Math.round(100 + Math.cos(a) * 12);
        L.y = Math.round(100 + Math.sin(a) * 12);
      }
      update(false);
    });
    const end = () => {
      if (drag != null) save();
      drag = null;
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);

    update(false);
  }

  window.CuriosityStudio.register({
    id: "light",
    label: "Light & look",
    order: 40,
    maya: "Arnold lights (area, spot, point, skydome, mesh), exposure and color temperature, light filters (gobo, barndoor, blocker), atmosphere volume, Toon shader and outlines",
    draw,
  });
})();
