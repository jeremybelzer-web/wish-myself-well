/* Shading: a material lab after Arnold's Standard Surface, the Toon shader, bump and color management.
   A shader ball (sphere, head or cloth) is computed per pixel on a small canvas and scaled up.
   Layers: base, diffuse roughness, metalness, specular (GGX), coat, sheen, subsurface, transmission,
   emission and thin film, plus procedural bump for wear. Looks: Photoreal, Toon, Flat, Painterly.
   Curiosities: renderStyle, lineWeight, gloss, wetness, skinLight, glow, wear, saturation
   (also softness, practicalInFrame, and the live board value lighting). */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-shading-v1";
  const MAT0 = { base: "#b8b0a4", baseW: 1, diffRough: 0.4, metal: 0, specW: 0.5, specRough: 0.4, coatW: 0, coatRough: 0.1, sheen: 0, sss: 0, sssColor: "#d0443a", trans: 0, emit: 0, emitColor: "#ffb347", film: 0, bump: 0 };
  const PRESETS = {
    skin: { base: "#e0ac8a", diffRough: 0.5, specW: 0.5, specRough: 0.45, sss: 0.85, sssColor: "#d0443a", sheen: 0.1 },
    "wet asphalt": { base: "#2b2b2e", diffRough: 0.9, specW: 0.5, specRough: 0.6, coatW: 1, coatRough: 0.04, bump: 0.5 },
    velvet: { base: "#6a1030", diffRough: 1, specW: 0.1, specRough: 0.8, sheen: 1 },
    chrome: { base: "#dcdfe4", metal: 1, specW: 1, specRough: 0.06 },
    glass: { base: "#e8f4ff", specW: 1, specRough: 0.03, trans: 1 },
    rubber: { base: "#26282c", diffRough: 0.8, specW: 0.4, specRough: 0.7 },
    ceramic: { base: "#f1ede4", specW: 0.5, specRough: 0.35, coatW: 0.35, coatRough: 0.12 },
    "soap bubble": { base: "#ffffff", specW: 1, specRough: 0.03, trans: 1, film: 1 },
    "rusty metal": { base: "#8a4a26", metal: 0.4, specW: 0.6, specRough: 0.7, diffRough: 0.9, bump: 0.85 },
    lantern: { base: "#ffcf7a", specW: 0.5, specRough: 0.3, trans: 0.2, emit: 0.9, emitColor: "#ffb347" },
    "comic ink": { base: "#e8402e", specW: 0.5, specRough: 0.3, look: { look: "toon", line: "heavy", bands: 2, sat: 2 } },
  };
  const SUITES = {
    "Comic ink": { look: "toon", line: "heavy", sat: 2, bands: 2 },
    "Wet night": { mat: { coatW: 1, coatRough: 0.03, specRough: 0.05, specW: 0.8, emit: 0.6, emitColor: "#ffb347", base: "#30343c" }, env: "#1b2540", glowScope: "object" },
    "Clean product": { mat: { specRough: 0.3, specW: 0.6, coatW: 0, bump: 0, metal: 0 }, keySize: 0.7, fillI: 0.6 },
  };
  const OPT = {
    shape: ["sphere", "head", "cloth"],
    shot: ["wide", "medium", "close"],
    look: ["photoreal", "toon", "flat", "painterly"],
    line: ["none", "thin", "heavy"],
    view: ["sRGB", "filmic"],
    weather: ["clear", "rain", "dust"],
    wetness: ["dry", "damp", "soaked"],
    wear: ["new", "used", "ruined"],
    glow: ["none", "object", "person", "room"],
  };
  const SLIDERS = [
    ["baseW", "Base weight"], ["diffRough", "Diffuse roughness"], ["metal", "Metalness"], ["specW", "Specular weight"], ["specRough", "Specular roughness"],
    ["coatW", "Coat weight"], ["coatRough", "Coat roughness"], ["sheen", "Sheen"], ["sss", "Subsurface weight"], ["trans", "Transmission"],
    ["emit", "Emission"], ["film", "Thin film"], ["bump", "Bump (scratches, wear)"],
  ];
  let anim = null;

  /* ---------- small math ---------- */
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const mix = (a, b, t) => a + (b - a) * t;
  function lin(hex) {
    const n = parseInt(String(hex).replace("#", ""), 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2));
  }
  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return mix(mix(hash(ix, iy), hash(ix + 1, iy), sx), mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), sx), sy);
  }
  function rainbow(t) {
    return [0.5 + 0.5 * Math.cos(6.283 * t), 0.5 + 0.5 * Math.cos(6.283 * (t - 0.33)), 0.5 + 0.5 * Math.cos(6.283 * (t - 0.67))];
  }
  function ggx(nh, r) {
    const a = Math.max(0.03, r);
    const a2 = a * a * a * a;
    const d = nh * nh * (a2 - 1) + 1;
    return Math.min(30, a2 / (Math.PI * d * d));
  }
  const SCALE = { wide: 0.55, medium: 0.8, close: 1.12 };
  const SSS_SHOT = { wide: 0.45, medium: 0.75, close: 1 };

  function height(shape, u, v, k) {
    u /= k;
    v /= k;
    let z = -1;
    if (shape === "sphere") {
      const d = 0.8 * 0.8 - u * u - v * v;
      if (d > 0) z = Math.sqrt(d);
    } else if (shape === "head") {
      let t = 1 - Math.pow(u / 0.46, 2) - Math.pow((v - 0.2) / 0.58, 2);
      if (t > 0) z = 0.46 * Math.sqrt(t);
      const dn = 0.012 - u * u - Math.pow(v - 0.12, 2) * 0.6;
      if (dn > 0) z = Math.max(z, 0.4 + Math.sqrt(dn) * 1.2);
      if (Math.abs(u) < 0.17 && v < -0.25 && v > -0.75) z = Math.max(z, 0.17 * Math.sqrt(1 - Math.pow(u / 0.17, 2)));
      t = 1 - Math.pow(u / 0.95, 2) - Math.pow((v + 1.02) / 0.36, 2);
      if (t > 0) z = Math.max(z, 0.35 * Math.sqrt(t));
    } else {
      if (Math.abs(u) < 0.85 && Math.abs(v + 0.05 * Math.sin(u * 4)) < 0.72) z = 0.3 + 0.1 * Math.sin(u * 7 + Math.sin(v * 3) * 1.6) * (0.6 + 0.4 * Math.cos(v * 2));
    }
    return z < 0 ? -1 : z * k;
  }

  /* Build every number the pixel loop needs from a parameter set. */
  function prep(P) {
    const m = P.mat;
    const kz = Math.sqrt(Math.max(0.08, 1 - P.kx * P.kx - P.ky * P.ky));
    const ln = Math.hypot(P.kx, P.ky, kz);
    const L = [P.kx / ln, P.ky / ln, kz / ln];
    const fl = Math.hypot(-L[0], 0.2, 0.7);
    const glowOn = m.emit > 0.05;
    const emitC = lin(m.emitColor);
    let env = lin(P.env);
    if (glowOn && P.glowScope === "room") env = env.map((c, i) => c + emitC[i] * m.emit * 0.35);
    return { m, L, F: [-L[0] / fl, 0.2 / fl, 0.7 / fl], base: lin(m.base).map((c) => c * m.baseW), sssC: lin(m.sssColor), emitC, env, k: SCALE[P.shot] || 0.8, sssF: SSS_SHOT[P.shot] || 0.75 };
  }

  function bg(Q, P, u, v) {
    const ch = (Math.floor(u * 4 + 8) + Math.floor(v * 4 + 8)) & 1 ? 1 : 0.72;
    const g = 0.35 + 0.45 * (v + 1) / 2;
    let c = Q.env.map((e) => e * g * ch + 0.02);
    if (P.weather === "rain" && hash(Math.floor((u + v * 0.25) * 40), 3) > 0.7 && noise(u * 9, v * 2 + u * 3) > 0.55) c = c.map((x) => x + 0.12);
    if (P.weather === "dust") c = [mix(c[0], 0.5, 0.25), mix(c[1], 0.36, 0.25), mix(c[2], 0.22, 0.25)];
    if (Q.m.emit > 0.05) {
      const d = Math.max(0, Math.hypot(u, v) - 0.75 * Q.k);
      const h = Q.m.emit * 0.9 * Math.exp(-d * 4);
      c = c.map((x, i) => x + Q.emitC[i] * h);
    }
    return c;
  }

  function shade(Q, P, u, v, N, look) {
    const m = Q.m, L = Q.L;
    const nv = clamp(N[2], 0, 1);
    const nl = N[0] * L[0] + N[1] * L[1] + N[2] * L[2];
    const lam = Math.max(0, nl);
    let base = Q.base;
    const dirt = m.bump * noise(u * 6 + 3, v * 6) * 0.55;
    base = base.map((c) => c * (1 - 0.4 * m.coatW) * (1 - dirt));
    const emitAdd = Q.emitC.map((c) => c * m.emit * 2);
    if (look === "flat") return base.map((c, i) => c * 0.9 + 0.03 + emitAdd[i]);
    if (look === "toon") {
      const q = P.bands;
      const idx = Math.min(q - 1, Math.floor(lam * q));
      const lv = 0.32 + 0.68 * idx / (q - 1);
      let c = base.map((x, i) => x * lv * P.keyI + Q.env[i] * 0.08);
      const hh = Math.hypot(L[0], L[1], L[2] + 1);
      const nh = (N[0] * L[0] + N[1] * L[1] + N[2] * (L[2] + 1)) / hh;
      if (m.specW > 0.2 && nh > 1 - 0.04 * (1 - m.specRough) - 0.002) c = c.map((x) => x + 0.8);
      if (m.trans > 0.3) { const b = bg(Q, P, u - N[0] * 0.25, v - N[1] * 0.25); c = c.map((x, i) => mix(x, b[i], m.trans * 0.8)); }
      return c.map((x, i) => x + emitAdd[i]);
    }
    const ks = P.keySize;
    let d = lam * (1 - 0.25 * m.diffRough) + 0.25 * m.diffRough * Math.max(0, (nl + 0.4) / 1.4);
    d = mix(d, Math.max(0, (nl + 0.5) / 1.5), ks * 0.5);
    const w = clamp(m.sss * Q.sssF, 0, 1);
    const wrap = Math.max(0, (nl + 0.6) / 1.6);
    const fd = Math.max(0, N[0] * Q.F[0] + N[1] * Q.F[1] + N[2] * Q.F[2]) * P.fillI;
    const amb = 0.15 * (0.7 + 0.3 * N[1]);
    let col = base.map((b, i) => {
      let x = b * d * (1 - w) + (wrap * b * 0.75 + Q.sssC[i] * Math.max(0, wrap - lam) * 1.3) * w;
      x = x * P.keyI + b * fd * [0.8, 0.9, 1][i] + b * Q.env[i] * amb * 2;
      return x * (1 - m.metal);
    });
    if (m.trans > 0) {
      const b = bg(Q, P, u - N[0] * 0.3, v - N[1] * 0.3);
      const tint = Q.base.map((c) => mix(1, c, 0.5));
      col = col.map((x, i) => mix(x, b[i] * tint[i], m.trans));
    }
    // specular and environment reflection
    const sr = Math.max(m.specRough, ks * 0.3);
    const F0 = Q.base.map((c) => mix(0.04, c, m.metal));
    const hl = Math.hypot(L[0], L[1], L[2] + 1);
    const nh = Math.max(0, (N[0] * L[0] + N[1] * L[1] + N[2] * (L[2] + 1)) / hl);
    const vh = Math.max(0, (L[2] + 1) / hl);
    const R = [2 * N[2] * N[0], 2 * N[2] * N[1], 2 * N[2] * N[2] - 1];
    const sky = (R[1] + 1) / 2;
    const win = Math.pow(Math.max(0, R[0] * L[0] + R[1] * L[1] + R[2] * L[2]), 1 / (sr * sr * 0.5 + 0.004)) * P.keyI * 3;
    const envAvg = (Q.env[0] + Q.env[1] + Q.env[2]) / 3;
    const film = m.film > 0 ? rainbow((1 - nv) * 2.2 + 0.15).map((c) => mix(1, c * 1.6, m.film)) : [1, 1, 1];
    const fnv = Math.pow(1 - nv, 5);
    const D = ggx(nh, sr) * lam * 0.25 * P.keyI;
    col = col.map((x, i) => {
      const fh = F0[i] + (1 - F0[i]) * Math.pow(1 - vh, 5);
      const fe = F0[i] + (1 - F0[i]) * fnv;
      const e = mix(mix(Q.env[i] * 0.3, Q.env[i] * 1.4, sky), envAvg, sr) + win;
      return x + m.specW * (D * fh + e * fe * (1 - sr * 0.8)) * film[i];
    });
    if (m.film > 0) { const rb = rainbow((1 - nv) * 2.5); col = col.map((x, i) => x + rb[i] * m.film * (0.08 + fnv * 0.5)); }
    if (m.sheen > 0) { const sh = m.sheen * Math.pow(1 - nv, 3) * (0.4 + lam) * P.keyI; col = col.map((x, i) => x + mix(Q.base[i], 1, 0.35) * sh); }
    if (m.coatW > 0) {
      const fc = 0.04 + 0.96 * fnv;
      const cw = Math.pow(Math.max(0, R[0] * L[0] + R[1] * L[1] + R[2] * L[2]), 1 / (m.coatRough * m.coatRough * 0.5 + 0.003)) * P.keyI * 3;
      const cd = ggx(nh, m.coatRough) * lam * 0.25 * P.keyI;
      col = col.map((x, i) => x + m.coatW * (cd * 0.04 + (mix(Q.env[i] * 0.3, Q.env[i] * 1.4, sky) + cw) * fc));
    }
    return col.map((x, i) => x + emitAdd[i]);
  }

  function tone(x, view) {
    if (view === "filmic") x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
    return Math.pow(clamp(x, 0, 1), 1 / 2.2);
  }

  function render(canvas, P) {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(W, H);
    const Q = prep(P);
    const e = 2 / W;
    const buf = new Float32Array(W * H * 3);
    const mask = new Uint8Array(W * H);
    const nzs = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = (x + 0.5) / W * 2 - 1, v = 1 - (y + 0.5) / H * 2;
        const h = height(P.shape, u, v, Q.k);
        const o = (y * W + x) * 3;
        let c;
        if (h < 0) c = bg(Q, P, u, v);
        else {
          const hx1 = Math.max(0, height(P.shape, u + e, v, Q.k)), hx0 = Math.max(0, height(P.shape, u - e, v, Q.k));
          const hy1 = Math.max(0, height(P.shape, u, v + e, Q.k)), hy0 = Math.max(0, height(P.shape, u, v - e, Q.k));
          let N = [-(hx1 - hx0) / (2 * e), -(hy1 - hy0) / (2 * e), 1];
          if (Q.m.bump > 0) {
            const b = Q.m.bump;
            const a = noise(u * 14, v * 14) - 0.5, bb = noise(u * 14 + 7, v * 14 + 3) - 0.5;
            let s = 0;
            for (let i = 0; i < 3; i++) { const ang = i * 1.9 + 0.4; const wv = u * Math.cos(ang) + v * Math.sin(ang); if (Math.abs(((wv * 7 + noise(u * 3 + i, v * 3) * 2) % 1 + 1) % 1 - 0.5) < 0.025 && noise(u * 4 + i * 5, v * 4) > 0.5) s = 1; }
            N[0] += b * (a * 1.2 + s * 0.6);
            N[1] += b * (bb * 1.2 + s * 0.4);
          }
          const n = Math.hypot(N[0], N[1], N[2]);
          N = [N[0] / n, N[1] / n, N[2] / n];
          c = shade(Q, P, u, v, N, P.look);
          mask[y * W + x] = 1;
          nzs[y * W + x] = N[2];
        }
        buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2];
      }
    }
    const satK = P.sat / 3;
    const r = P.line === "heavy" ? Math.max(2, Math.round(W / 60)) : P.line === "thin" ? 1 : 0;
    const nzT = P.line === "heavy" ? 0.38 : 0.22;
    const posterize = P.look === "painterly";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let sx = x, sy = y;
        if (posterize) {
          const a = noise(x * 0.15, y * 0.15) * 6.28;
          const len = Math.round((hash(Math.floor(x / 3), Math.floor(y / 3)) - 0.5) * 4);
          sx = clamp(Math.round(x + Math.cos(a) * len), 0, W - 1);
          sy = clamp(Math.round(y + Math.sin(a) * len), 0, H - 1);
        }
        const o = (sy * W + sx) * 3;
        let c = [tone(buf[o], P.view), tone(buf[o + 1], P.view), tone(buf[o + 2], P.view)];
        const g = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
        c = c.map((x) => clamp(g + (x - g) * satK, 0, 1));
        if (posterize) { const dn = (hash(x, y) - 0.5) * 0.08; c = c.map((x) => Math.round(clamp(x + dn, 0, 1) * 5) / 5); }
        let ink = false;
        if (r && mask[i]) {
          if (nzs[i] < nzT) ink = true;
          for (let dy = -r; dy <= r && !ink; dy++) for (let dx = -r; dx <= r; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= W || yy >= H || !mask[yy * W + xx]) { ink = true; break; }
          }
        }
        const p = i * 4;
        img.data[p] = ink ? 20 : c[0] * 255;
        img.data[p + 1] = ink ? 17 : c[1] * 255;
        img.data[p + 2] = ink ? 14 : c[2] * 255;
        img.data[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ---------- curiosities ---------- */
  function derive(P) {
    const m = P.mat;
    const rs = [];
    if (m.specW > 0.2 || m.metal > 0.5) rs.push(m.specRough);
    if (m.coatW > 0.3) rs.push(m.coatRough);
    const rough = rs.length ? Math.min(...rs) : 1;
    const wetv = m.coatW * (1 - m.coatRough * 2);
    const glow = m.emit > 0.05 ? P.glowScope : "none";
    const look = P.look;
    const out = {
      renderStyle: look,
      lineWeight: P.line,
      gloss: rough < 0.1 ? "mirror" : rough < 0.45 ? "satin" : "matte",
      wetness: wetv > 0.7 ? "soaked" : wetv > 0.3 ? "damp" : "dry",
      skinLight: Math.round(clamp(m.sss * 5 * (SSS_SHOT[P.shot] || 0.75), 0, 5)),
      glow,
      wear: m.bump < 0.2 ? "new" : m.bump < 0.6 ? "used" : "ruined",
      saturation: P.sat,
      softness: P.keySize >= 0.5 ? "soft" : "hard",
      practicalInFrame: m.emit >= 0.3 ? "yes" : "no",
    };
    out.lighting = glow !== "none" ? "practical" : look === "toon" || look === "flat" ? "flat" : P.weather === "rain" && out.wetness === "soaked" ? "moon" : P.keySize < 0.5 ? "hard" : "dusk";
    return out;
  }

  function beatParams(s, b) {
    const mat = Object.assign({}, s.mat);
    if (b.wetness === "damp") { mat.coatW = Math.max(mat.coatW, 0.6); mat.coatRough = Math.min(mat.coatRough, 0.15); }
    if (b.wetness === "soaked") { mat.coatW = 1; mat.coatRough = 0.03; }
    if (b.wetness === "dry" && mat.coatW * (1 - mat.coatRough * 2) > 0.3) mat.coatW = 0.1;
    mat.bump = { new: 0, used: 0.4, ruined: 0.85 }[b.wear];
    if (b.glow === "none") mat.emit = 0;
    else mat.emit = Math.max(mat.emit, 0.7);
    return Object.assign({}, s, { mat, shot: b.shotSize, look: b.look, weather: b.weather, glowScope: b.glow === "none" ? s.glowScope : b.glow });
  }

  function proximities(s) {
    const B = s.beats.map((b) => beatParams(s, b));
    const D = B.map(derive);
    const res = [];
    const rule = (text, triggers, test, hint) => {
      if (!triggers.length) return res.push({ text, state: "not triggered", hint: "" });
      const bad = triggers.filter((i) => !test(i));
      res.push({ text, state: bad.length ? "doesn't hold" : "holds", hint: bad.length ? `beat ${bad.map((i) => i + 1).join(", ")}: ${hint}` : `beats ${triggers.map((i) => i + 1).join(", ")}` });
    };
    const n = s.beats.length;
    rule("When weather is rain, surfaces go wet within 2 beats", s.beats.map((b, i) => (b.weather === "rain" ? i : -1)).filter((i) => i >= 0),
      (i) => D.slice(i, Math.min(n, i + 3)).some((d) => d.wetness !== "dry"), "set wetness to damp or soaked");
    rule("When glow turns on, it becomes the key (0 beats)", D.map((d, i) => (d.glow !== "none" && (i === 0 || D[i - 1].glow === "none") ? i : -1)).filter((i) => i >= 0),
      (i) => B[i].mat.emit * 1.5 >= s.keyI, `lower the key light (${s.keyI.toFixed(2)}) below the glow`);
    rule("When shot size becomes close, light in skin shows (0 beats)", s.beats.map((b, i) => (b.shotSize === "close" && (i === 0 || s.beats[i - 1].shotSize !== "close") ? i : -1)).filter((i) => i >= 0),
      (i) => D[i].skinLight >= 2, "raise subsurface (try the skin preset)");
    rule("When renderStyle becomes toon, lighting flattens to two bands and lineWeight rises (0 beats)", s.beats.map((b, i) => (b.look === "toon" && (i === 0 || s.beats[i - 1].look !== "toon") ? i : -1)).filter((i) => i >= 0),
      () => s.bands === 2 && s.line !== "none", "set toon bands to 2 and ink line to thin or heavy");
    return { res, D };
  }

  function css() {
    if (document.getElementById("studio-shading")) return;
    const st = document.createElement("style");
    st.id = "studio-shading";
    st.textContent = `
      .shd-view { width: 100%; max-width: 360px; aspect-ratio: 1; display: block; border: 1px solid var(--line); touch-action: none; cursor: crosshair; image-rendering: auto; }
      .shd-tool label.field { margin-bottom: 4px; }
      .shd-tool select, .shd-tool input[type=range] { max-width: 100%; }
      .shd-beats { display: grid; grid-template-columns: 64px repeat(4, minmax(0, 1fr)); gap: 4px; align-items: center; font-size: 12px; }
      .shd-beats select { width: 100%; min-width: 0; font-size: 11px; padding: 1px; }
      .shd-beats canvas { width: 100%; aspect-ratio: 1; display: block; border: 1px solid var(--line); }
      .shd-beats .on canvas { outline: 2px solid var(--saffron); }
      .shd-prox li { margin: 2px 0; font-size: 13px; }
      .shd-prox .holds { color: #2c7a3f; font-weight: 600; }
      .shd-prox .no { color: #b23a1f; font-weight: 600; }
      .shd-prox .idle { color: var(--muted, #777); }
      @media (max-width: 760px) { .shd-tool > div:last-child { order: -1; } }
      .shd-tool details { border-top: 1px solid var(--line); padding: 4px 0; }
      .shd-tool summary { cursor: pointer; font-weight: 600; }
    `;
    document.head.appendChild(st);
  }

  function defaults() {
    return {
      mat: Object.assign({}, MAT0), shape: "sphere", shot: "medium", look: "photoreal", line: "none", bands: 3, sat: 3, view: "filmic",
      kx: 0.55, ky: 0.45, keyI: 1, keySize: 0.3, fillI: 0.3, env: "#7d8ca3", weather: "clear", glowScope: "object", preset: "",
      beats: [
        { weather: "clear", shotSize: "wide", wetness: "dry", wear: "new", glow: "none", look: "photoreal" },
        { weather: "rain", shotSize: "medium", wetness: "dry", wear: "new", glow: "none", look: "photoreal" },
        { weather: "rain", shotSize: "medium", wetness: "soaked", wear: "used", glow: "object", look: "photoreal" },
        { weather: "rain", shotSize: "close", wetness: "soaked", wear: "used", glow: "object", look: "toon" },
      ],
    };
  }

  function draw(el, api) {
    css();
    const esc = api.esc;
    const st = api.store(KEY);
    const saved = st.get({});
    const s = Object.assign(defaults(), saved);
    s.mat = Object.assign({}, MAT0, saved.mat || {});
    if (!Array.isArray(s.beats) || s.beats.length !== 4) s.beats = defaults().beats;
    if (anim) cancelAnimationFrame(anim);
    anim = null;
    let playing = -1;
    const live = new Set((typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []).filter((c) => c.live).map((c) => c.id));
    if (!live.size) live.add("lighting");

    const opts = (list, v) => list.map((o) => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("");
    const sel = (k, label, list) => `<label class="field">${esc(label)}<select data-g="${k}">${opts(list, s[k])}</select></label>`;
    const rng = (k, label, v, attr, min, max, step) => `<label class="field"><span>${esc(label)} <b>${step >= 1 ? v : Number(v).toFixed(2)}</b></span><input type="range" min="${min}" max="${max}" step="${step}" ${attr}="${k}" value="${v}"></label>`;

    el.innerHTML = `<div class="studio-grid shd-tool">
      <div>
        <p class="cap">Material presets</p>
        <p>${Object.keys(PRESETS).map((p) => `<button type="button" data-preset="${esc(p)}" class="chip-btn ${s.preset === p ? "on" : ""}">${esc(p)}</button>`).join(" ")}</p>
        <details open><summary>Standard Surface layers</summary>
          <label class="field">Base color<input type="color" data-c="base" value="${esc(s.mat.base)}"></label>
          ${SLIDERS.slice(0, 9).map(([k, l]) => rng(k, l, s.mat[k], "data-m", 0, 1, 0.01)).join("")}
          <label class="field">Subsurface color<input type="color" data-c="sssColor" value="${esc(s.mat.sssColor)}"></label>
          ${SLIDERS.slice(9).map(([k, l]) => rng(k, l, s.mat[k], "data-m", 0, 1, 0.01)).join("")}
          <label class="field">Emission color<input type="color" data-c="emitColor" value="${esc(s.mat.emitColor)}"></label>
          ${sel("glowScope", "What glows", OPT.glow.slice(1))}
        </details>
        <details open><summary>Light</summary>
          <p class="cap">Drag on the ball to move the key light.</p>
          ${rng("keyI", "Key intensity", s.keyI, "data-n", 0, 2, 0.05)}
          ${rng("keySize", "Key size (soft when large)", s.keySize, "data-n", 0, 1, 0.05)}
          ${rng("fillI", "Fill", s.fillI, "data-n", 0, 1, 0.05)}
          <label class="field">Environment color<input type="color" data-g="env" value="${esc(s.env)}"></label>
        </details>
        <details open><summary>Look and color</summary>
          ${sel("look", "Look", OPT.look)}
          ${sel("line", "Ink line", OPT.line)}
          ${rng("bands", "Toon bands", s.bands, "data-n", 2, 4, 1)}
          ${rng("sat", "Saturation (3 is neutral)", s.sat, "data-n", 0, 5, 1)}
          ${sel("view", "View transform", OPT.view)}
        </details>
      </div>
      <div>
        <div class="bar-actions">${sel("shape", "Shape", OPT.shape)}${sel("shot", "Shot size", OPT.shot)}${sel("weather", "Weather", OPT.weather)}</div>
        <canvas class="shd-view" width="160" height="160" aria-label="Shader ball"></canvas>
        <p id="shd-chips"></p>
        <p class="cap">Suites</p>
        <p>${Object.keys(SUITES).map((k) => `<button type="button" class="chip suite" data-suite="${esc(k)}">${esc(k)}</button>`).join(" ")}</p>
        <h3>Through the scene</h3>
        <p class="cap">Four beats of one scene. Set the weather, shot, wetness, wear, glow and look per beat to watch the same surface change. Click a ball to show it large.</p>
        <div class="shd-beats" id="shd-beats"></div>
        <div class="bar-actions" style="margin-top:6px">
          <button type="button" data-act="play">Play the scene</button>
          <button type="button" data-act="shelf">Keep on Shelf</button>
          <button type="button" data-act="board">Send to board</button>
        </div>
        <h3>Proximities</h3>
        <ul class="shd-prox" id="shd-prox"></ul>
      </div></div>`;

    const canvas = el.querySelector(".shd-view");
    const save = () => st.set(s);
    let queued = false;
    const paint = (P) => render(canvas, P || (playing >= 0 ? beatParams(s, s.beats[playing]) : s));
    const repaint = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        paint();
        chips();
      });
    };

    function chips() {
      const P = playing >= 0 ? beatParams(s, s.beats[playing]) : s;
      const d = derive(P);
      el.querySelector("#shd-chips").innerHTML = Object.entries(d)
        .map(([k, v]) => `<span class="chip ${live.has(k) ? "lit" : ""}" title="${live.has(k) ? "live on the board" : ""}">${esc(k)} ${esc(v)}</span>`)
        .join("");
    }

    function beatsUI() {
      const g = el.querySelector("#shd-beats");
      const rows = [["weather", "Weather"], ["shotSize", "Shot", OPT.shot], ["wetness", "Wet"], ["wear", "Wear"], ["glow", "Glow"], ["look", "Look"]];
      let h = `<span></span>${s.beats.map((b, i) => `<div class="${playing === i ? "on" : ""}"><canvas width="56" height="56" data-show="${i}" aria-label="Beat ${i + 1}"></canvas></div>`).join("")}`;
      rows.forEach(([k, l, list]) => {
        list = list || OPT[k];
        h += `<span>${l}</span>${s.beats.map((b, i) => `<select data-b="${i}" data-k="${k}" aria-label="${l} beat ${i + 1}">${opts(list, b[k])}</select>`).join("")}`;
      });
      g.innerHTML = h;
      g.querySelectorAll("canvas[data-show]").forEach((c) => render(c, beatParams(s, s.beats[Number(c.dataset.show)])));
      g.querySelectorAll("select[data-b]").forEach((x) =>
        x.addEventListener("change", () => {
          s.beats[Number(x.dataset.b)][x.dataset.k] = x.value;
          save();
          beatsUI();
          prox();
          if (playing >= 0) repaint();
        })
      );
      g.querySelectorAll("canvas[data-show]").forEach((c) =>
        c.addEventListener("click", () => {
          const i = Number(c.dataset.show);
          playing = playing === i ? -1 : i;
          beatsUI();
          repaint();
        })
      );
    }

    function prox() {
      const { res } = proximities(s);
      el.querySelector("#shd-prox").innerHTML = res
        .map((r) => `<li><span class="${r.state === "holds" ? "holds" : r.state === "not triggered" ? "idle" : "no"}">${esc(r.state)}</span> ${esc(r.text)} <span class="cap">${esc(r.hint)}</span></li>`)
        .join("");
    }

    function rerenderAll() {
      save();
      repaint();
      beatsUI();
      prox();
    }

    el.querySelectorAll("[data-m]").forEach((x) =>
      x.addEventListener("input", () => {
        s.mat[x.dataset.m] = Number(x.value);
        s.preset = "";
        x.parentElement.querySelector("b").textContent = Number(x.value).toFixed(2);
        save();
        repaint();
      })
    );
    el.querySelectorAll("[data-m]").forEach((x) => x.addEventListener("change", () => (beatsUI(), prox())));
    el.querySelectorAll("[data-n]").forEach((x) =>
      x.addEventListener("input", () => {
        s[x.dataset.n] = Number(x.value);
        x.parentElement.querySelector("b").textContent = Number(x.step) >= 1 ? x.value : Number(x.value).toFixed(2);
        save();
        repaint();
      })
    );
    el.querySelectorAll("[data-n]").forEach((x) => x.addEventListener("change", () => (beatsUI(), prox())));
    el.querySelectorAll("[data-c]").forEach((x) =>
      x.addEventListener("input", () => {
        s.mat[x.dataset.c] = x.value;
        rerenderAll();
      })
    );
    el.querySelectorAll("[data-g]").forEach((x) =>
      x.addEventListener(x.type === "color" ? "input" : "change", () => {
        s[x.dataset.g] = x.value;
        rerenderAll();
      })
    );
    el.querySelectorAll("[data-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = PRESETS[b.dataset.preset];
        s.mat = Object.assign({}, MAT0, p);
        delete s.mat.look;
        if (p.look) Object.assign(s, p.look);
        s.preset = b.dataset.preset;
        save();
        draw(el, api);
      })
    );
    el.querySelectorAll("[data-suite]").forEach((b) =>
      b.addEventListener("click", () => {
        const su = SUITES[b.dataset.suite];
        Object.keys(su).forEach((k) => {
          if (k === "mat") Object.assign(s.mat, su.mat);
          else s[k] = su[k];
        });
        s.preset = "";
        save();
        draw(el, api);
      })
    );

    // drag the key light
    const setKey = (ev) => {
      const r = canvas.getBoundingClientRect();
      let x = ((ev.clientX - r.left) / r.width) * 2 - 1, y = 1 - ((ev.clientY - r.top) / r.height) * 2;
      const l = Math.hypot(x, y);
      if (l > 0.98) { x *= 0.98 / l; y *= 0.98 / l; }
      s.kx = x;
      s.ky = y;
      repaint();
    };
    canvas.addEventListener("pointerdown", (ev) => {
      canvas.setPointerCapture(ev.pointerId);
      setKey(ev);
      const move = (e2) => setKey(e2);
      const up = () => {
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        save();
        beatsUI();
        prox();
      };
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
    });

    el.querySelector('[data-act="play"]').addEventListener("click", () => {
      if (anim) cancelAnimationFrame(anim);
      const t0 = performance.now();
      const per = 1100;
      let last = -2;
      const step = (now) => {
        const studio = document.getElementById("studio");
        if (!canvas.isConnected || (studio && studio.classList.contains("hidden"))) { anim = null; return; }
        const i = Math.floor((now - t0) / per);
        if (i >= s.beats.length) {
          playing = -1;
          anim = null;
          beatsUI();
          repaint();
          return;
        }
        // the key light drifts a little while the scene plays
        const P = beatParams(s, s.beats[i]);
        const ph = (now - t0) / per;
        P.kx = clamp(s.kx + Math.sin(ph * 2) * 0.12, -0.95, 0.95);
        if (i !== last) {
          playing = i;
          last = i;
          beatsUI();
          chips();
        }
        render(canvas, P);
        anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });

    const perBeat = () => proximities(s).D;
    el.querySelector('[data-act="shelf"]').addEventListener("click", () => {
      const D = perBeat();
      const ids = ["renderStyle", "lineWeight", "gloss", "wetness", "skinLight", "glow", "wear", "saturation", "softness", "practicalInFrame", "lighting"];
      const out = {};
      ids.forEach((k) => (out[k] = D.map((d) => d[k])));
      api.toShelf("Surface through the scene", out);
    });
    el.querySelector('[data-act="board"]').addEventListener("click", () => {
      const D = perBeat();
      const out = {};
      Object.keys(D[0]).filter((k) => live.has(k)).forEach((k) => (out[k] = D.map((d) => d[k])));
      api.toBoard("Surface through the scene", out);
    });

    paint();
    chips();
    beatsUI();
    prox();
  }

  window.CuriosityStudio.register({
    id: "shading",
    label: "Shading",
    order: 42,
    maya: "Arnold Standard Surface (base, specular, transmission, subsurface, coat, sheen, emission, thin film), Toon shader, bump, color management",
    draw,
  });
})();
