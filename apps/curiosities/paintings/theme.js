/* The app wearing a painting's five colours (window.CurioPaintTheme; section 4 of the Paintings spec). Loads with no
   page too, so the quick tests check all 62 paintings.

   Rank the five by lightness (0.299 r + 0.587 g + 0.114 b): rank 0 the darkest ... rank 4 the lightest.
   Background = rank 0. Panels = rank 1 at 20 % over the background (raised 40 %, hover 60 %). Lines = rank 4 at
   20 %. Text = rank 4. Dimmed text = rank 2. Accent = rank 3. Text on the accent: the lightest or the darkest
   of the five, whichever reads. Extra shades come from the five, never new colours.

   First the five are made readable (the swatches in the menus are never changed): each moves 6 % at a time
   toward white or black, keeping its hue, until the background's luminance is at most 0.025, the text has 7:1
   on it, dimmed text and the accent have 5.5:1 on it and 4.5:1 on every panel layer, and the text 4.5:1 on
   every panel layer. */
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

  function palette(colors) {
    const ranked = colors.map(hexRgb).sort((a, b) => light(a) - light(b));
    let [bg, r1, r2, r3, r4] = ranked.map((c) => c.slice());
    for (let n = 0; n < 200 && lum(bg) > 0.024; n++) bg = darker(bg); /* 0.024, so the rounded hex stays at 0.025 or under */
    const layers = () => [mix(bg, r1, 0.2), mix(bg, r1, 0.4), mix(bg, r1, 0.6)];
    /* first the words against the background (a hair over each line, so the rounded hex still meets it) */
    for (let n = 0; n < 200 && contrast(r4, bg) < 7.05; n++) r4 = lighter(r4);
    for (let n = 0; n < 200 && contrast(r2, bg) < 5.55; n++) r2 = lighter(r2);
    for (let n = 0; n < 200 && contrast(r3, bg) < 5.55; n++) r3 = lighter(r3);
    /* then the panel layers: a layer too light for the words gets its colour darkened, so the accent keeps its own */
    const fails = () => layers().some((p) => [r2, r3, r4].some((c) => contrast(c, p) < 4.55));
    for (let n = 0; n < 200 && fails(); n++) r1 = darker(r1);
    const L = layers();
    const ink = contrast(r4, r3) >= contrast(bg, r3) ? r4 : bg;
    return {
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
    };
  }

  /* CSS for the parts of the app that run on colour tokens: the Viewer, the Screen and the Paintings menus */
  function css(p) {
    return `html .cv-root.cv-viewer { --c-ground:${p.bg}; --c-panel:${p.panel}; --c-raised:${p.raised}; --c-hover:${p.hover}; --c-line:${p.line}; --c-text:${p.text}; --c-dim:${p.dim}; --c-accent:${p.accent}; --c-ink:${p.ink}; --c-warm:${p.warm}; }
html .sc-page { --cc-ground:${p.bg}; --cc-panel:${p.panel}; --cc-raised:${p.raised}; --cc-hover:${p.hover}; --cc-line:${p.line}; --cc-text:${p.text}; --cc-dim:${p.dim}; --cc-accent:${p.accent}; --cc-accent-ink:${p.ink}; --cc-warm:${p.warm}; }
html .cvp-win, html .cvp-strip, html .cvp-menu { --p-bg:${p.bg}; --p-panel:${p.panel}; --p-line:${p.line}; --p-text:${p.text}; --p-dim:${p.dim}; --p-acc:${p.accent}; }
html .cvp-menu { background:${p.panel}; border-color:${p.line}; }
html .cvp-menu button:hover, html .cvp-menu button:focus-visible { background:${p.hover}; }`;
  }

  G.CurioPaintTheme = { palette, css, contrast: (a, b) => contrast(hexRgb(a), hexRgb(b)), lum: (h) => lum(hexRgb(h)) };
})(typeof window !== "undefined" ? window : globalThis);
