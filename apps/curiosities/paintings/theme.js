/* The app wearing a painting's five colours (window.CurioPaintTheme; section 4 of the Paintings spec). Loads with no
   page too, so the quick tests check all 62 paintings.

   Rank the five by lightness (0.299 r + 0.587 g + 0.114 b): rank 0 the darkest ... rank 4 the lightest.
   A dark painting (its middle colour darker than 140) gets a dark app: background = rank 0, panels = rank 1,
   dimmed text = rank 2, accent = rank 3, text = rank 4. A light painting gets a light app, the other way round:
   background = rank 4, panels = rank 3, dimmed text = rank 2, accent = rank 1, text = rank 0. So the words are
   light on a dark background and dark on a light one, always one of the five (Jeremy, 2026-10-08).
   Panels are the panel colour at 20 % over the background (raised 40 %, hover 60 %); lines are the text at 20 %.
   Text on the accent: the text or the background colour, whichever reads.

   First the five are made readable (the swatches in the menus are never changed): each moves 6 % at a time
   toward white or black, keeping its hue, until the background is dark enough (luminance at most 0.025) or light
   enough (at least 0.6), the text has 7:1 on it, dimmed text and the accent 5.5:1, and all three 4.5:1 on every
   panel layer.

   map(palette, colour) turns any colour the app uses into one of the painting's (paintings/recolor.js uses it for
   every colour in the app): greys go by how far they are from the app's own dark ground, along the ramp
   background, panel, raised, hover, line, dimmed text, text; coloured ones take the painting colour nearest in hue,
   readable on the background (a dark coloured one becomes a tinted panel). */
(function (G) {
  const hexRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const rgbHex = (c) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const light = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const contrast = (a, b) => {
    const x = lum(a);
    const y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);
  const WHITE = [255, 255, 255];
  const BLACK = [0, 0, 0];
  /* 6 % toward white or black: the hue stays, only lightness moves */
  const lighter = (c) => mix(c, WHITE, 0.06);
  const darker = (c) => mix(c, BLACK, 0.06);

  const isLight = (colors) => light(colors.map(hexRgb).sort((a, b) => light(a) - light(b))[2]) >= 140;

  function palette(colors) {
    const ranked = colors.map(hexRgb).sort((a, b) => light(a) - light(b));
    const lightMode = light(ranked[2]) >= 140;
    /* ground: the background's end; away: toward the words' end */
    const ground = lightMode ? lighter : darker;
    const away = lightMode ? darker : lighter;
    let [bg, r1, r2, r3, r4] = (lightMode ? ranked.slice().reverse() : ranked).map((c) => c.slice());
    /* 0.024 / 0.61, so the rounded hex stays at 0.025 or under / 0.6 or over */
    const deep = () => (lightMode ? lum(bg) < 0.61 : lum(bg) > 0.024);
    for (let n = 0; n < 200 && deep(); n++) bg = ground(bg);
    const layers = () => [mix(bg, r1, 0.2), mix(bg, r1, 0.4), mix(bg, r1, 0.6)];
    /* first the words against the background (a hair over each line, so the rounded hex still meets it) */
    for (let n = 0; n < 200 && contrast(r4, bg) < 7.05; n++) r4 = away(r4);
    for (let n = 0; n < 200 && contrast(r2, bg) < 5.55; n++) r2 = away(r2);
    for (let n = 0; n < 200 && contrast(r3, bg) < 5.55; n++) r3 = away(r3);
    /* then the panel layers: a layer too close to the words gets its colour pushed toward the ground */
    const fails = () => layers().some((p) => [r2, r3, r4].some((c) => contrast(c, p) < 4.55));
    for (let n = 0; n < 200 && fails(); n++) r1 = ground(r1);
    const L = layers();
    const ink = contrast(r4, r3) >= contrast(bg, r3) ? r4 : bg;
    return {
      mode: lightMode ? "light" : "dark",
      bg: rgbHex(bg),
      panel: rgbHex(L[0]),
      raised: rgbHex(L[1]),
      hover: rgbHex(L[2]),
      line: rgbHex(mix(bg, r4, 0.2)),
      text: rgbHex(r4),
      dim: rgbHex(r2),
      accent: rgbHex(r3),
      ink: rgbHex(ink),
      /* a second highlight, from the five too: the accent at 80 % over the text */
      warm: rgbHex(mix(r4, r3, 0.8)),
      /* the five, each made readable on the background (for coloured things: lane lines, marks, highlights) */
      five: colors.map((h) => {
        let c = hexRgb(h);
        for (let n = 0; n < 200 && contrast(c, bg) < 4.55; n++) c = away(c);
        return rgbHex(c);
      }),
    };
  }

  /* ---------- any colour of the app to one of the painting's ---------- */
  function parse(s) {
    s = String(s).trim().toLowerCase();
    let m = /^#([0-9a-f]{3,4})$/.exec(s);
    if (m) {
      const d = m[1].split("").map((x) => parseInt(x + x, 16));
      return [d[0], d[1], d[2], d.length > 3 ? d[3] / 255 : 1];
    }
    m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s);
    if (m) return [...hexRgb("#" + m[1]), m[2] ? parseInt(m[2], 16) / 255 : 1];
    m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
    if (m) {
      let a = m[4] == null ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return [+m[1], +m[2], +m[3], a];
    }
    if (s === "white") return [255, 255, 255, 1];
    if (s === "black") return [0, 0, 0, 1];
    return null;
  }
  function hsl(c) {
    const [r, g, b] = c.map((v) => v / 255);
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    const d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  }
  const out = (c, a) => (a >= 1 ? rgbHex(c) : `rgba(${c.map((v) => Math.round(v)).join(", ")}, ${+a.toFixed(3)})`);

  /* the ramp from the ground to the words, at the lightness the app's own dark colours sit at */
  const RAMP_AT = [0, 0.1, 0.16, 0.22, 0.3, 0.6, 0.88];
  function ramp(p) {
    if (!p._ramp) p._ramp = [p.bg, p.panel, p.raised, p.hover, p.line, p.dim, p.text].map(hexRgb);
    return p._ramp;
  }
  function hues(p) {
    if (!p._hues) p._hues = p.five.map((h) => ({ c: hexRgb(h), h: hsl(hexRgb(h)) }));
    return p._hues;
  }
  function map(p, colour) {
    const c = parse(colour);
    if (!c) return colour;
    const rgb = c.slice(0, 3);
    const [h, s, l] = hsl(rgb);
    const L = light(rgb) / 255;
    const R = ramp(p);
    /* greys (and near-white, near-black) along the ramp */
    if (s < 0.22 || l < 0.08 || l > 0.94) {
      let k = 0;
      while (k < RAMP_AT.length - 2 && L > RAMP_AT[k + 1]) k++;
      const t = Math.max(0, Math.min(1, (L - RAMP_AT[k]) / (RAMP_AT[k + 1] - RAMP_AT[k])));
      return out(mix(R[k], R[k + 1], t), c[3]);
    }
    /* coloured: the painting colour nearest in hue (the most coloured of them when the painting is all greys) */
    const H = hues(p);
    let best = H[0];
    let bd = Infinity;
    H.forEach((x) => {
      const dh = Math.min(Math.abs(x.h[0] - h), 360 - Math.abs(x.h[0] - h)) / 180;
      const d = dh + (x.h[1] < 0.15 ? 0.6 : 0);
      if (d < bd) {
        bd = d;
        best = x;
      }
    });
    /* a dark coloured one (a warning's background, a tinted panel) stays a surface: the colour over the ground */
    if (L < 0.32) return out(mix(R[0], best.c, 0.12 + L * 0.6), c[3]);
    return out(best.c, c[3]);
  }
  /* every colour in a piece of CSS text (a rule's value, an inline style) */
  const COLOUR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/gi;
  const mapText = (p, text) => String(text).replace(COLOUR, (m) => map(p, m));

  /* CSS for the parts of the app that run on colour tokens: the Viewer, the Screen and the Paintings menus */
  function css(p) {
    return `html .cv-root.cv-viewer { --c-ground:${p.bg}; --c-panel:${p.panel}; --c-raised:${p.raised}; --c-hover:${p.hover}; --c-line:${p.line}; --c-text:${p.text}; --c-dim:${p.dim}; --c-accent:${p.accent}; --c-ink:${p.ink}; --c-warm:${p.warm}; }
html .sc-page { --cc-ground:${p.bg}; --cc-panel:${p.panel}; --cc-raised:${p.raised}; --cc-hover:${p.hover}; --cc-line:${p.line}; --cc-text:${p.text}; --cc-dim:${p.dim}; --cc-accent:${p.accent}; --cc-accent-ink:${p.ink}; --cc-warm:${p.warm}; }
html .cvp-win, html .cvp-strip, html .cvp-menu { --p-bg:${p.bg}; --p-panel:${p.panel}; --p-line:${p.line}; --p-text:${p.text}; --p-dim:${p.dim}; --p-acc:${p.accent}; }
html .cvp-menu { background:${p.panel}; border-color:${p.line}; }
html .cvp-menu button:hover, html .cvp-menu button:focus-visible { background:${p.hover}; }
html body { background:${p.bg}; color:${p.text}; }`;
  }

  G.CurioPaintTheme = {
    palette,
    css,
    map,
    mapText,
    parse,
    isLight,
    contrast: (a, b) => contrast(hexRgb(a), hexRgb(b)),
    lum: (h) => lum(hexRgb(h)),
  };
})(typeof window !== "undefined" ? window : globalThis);
