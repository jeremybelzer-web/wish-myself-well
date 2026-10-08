# Paintings (paintings/)

The Paintings menu, ported from Jeremy's music app (spec: `painting-swatches-prompt.md`, 2026-10-06): 62 famous
paintings as five-colour swatches, so things in the film, and the app itself, can take colours a great painter
already chose.

- `paintings-data.js` (`window.CURIO_PAINTINGS`): the 62 in the spec's order (0-based here, so painting 7, The
  Great Wave Off Kanagawa, the default, is index 6), each with name, artist, category tags and five colours in
  the source's order. The credit line lives here and is not shown.
- `paintings.js` (`window.CurioPaintings`): **Paint ▾** in the Viewer's bar opens the Paintings window, the paint
  strip and Forget the colours. Control-click empty space in My film's picture opens or closes the strip
  (Control-click on a thing still opens what it can do; Control-drag still slides). Pick a swatch, then click
  things: each takes the colour, one undo step each, and the colour stays held.
- The window has two tabs and lists the paintings grouped by kind (Jeremy 2026-10-08): chips for All and each of
  the 14 kinds (Neon, Bright, Pastel, Neutral...). All files each painting once, under its most telling kind (its
  rarest tag); a kind's chip shows every painting with that tag. The chip is kept per device in
  `curio-paintings-kind-v1`.
- **Recolor project elements**: a click on a painting makes it the project's painting and gives every thing in
  My film one of its five, in turn (one undo step, with the choice). "Another random painting" does the same.
  The painting is `film.painting` in the Viewer's film (so Undo covers it and it saves with the project);
  "Another random painting" is `film.paintingNow`, cleared at every opening; the default is `localStorage`
  `curio-paintings-default-v1` (this device, outside the `curiosities-*` project keys). A painted thing keeps
  its own colour in `o.paintWas` for Forget the colours.
- **Recolor the app**: a painting for the app itself, per device in `curio-paintings-app-v2` (none = the app's
  own colours, the start). `theme.js` (`window.CurioPaintTheme`) ranks the five by lightness: a dark painting
  gives a dark app with light words, a light one (its middle colour 140 or lighter) a light app with dark words,
  always from the five, after the readability guard moves each 6 % at a time toward white or black (background
  luminance at most 0.025 or at least 0.6, text 7:1, dimmed text and accent 5.5:1, 4.5:1 on every panel layer).
  The colour tokens (`--c-*`, `--cc-*`, `--p-*`) take it first; then `recolor.js` (`window.CurioRecolor`) turns
  every other colour of the app into one of the painting's (`CurioPaintTheme.map`): every stylesheet rule,
  styles parts add later, inline styles, SVG fill and stroke, and lines and fills on 2D canvases (the lanes,
  their nodes, the storyboard's paper and cards). Greys follow the ramp from the background to the words;
  coloured ones take the painting colour nearest in hue. Left alone: the film's pictures (the Viewer's windows
  and panel cards), the film's own things' colours (that is the other tab), the swatches and colour pickers, and
  anything inside `[data-own-colors]`. The app's own colours puts every value back.
- Hooks only: four `<script>` tags in index.html. No change to the Viewer's files.

Tests: `node paintings/tests/run.js` (the data against `tests/expected.txt`, the spec's table, the readability
rules for all 62 and the colour mapping) and `node paintings/tests/browser.js` (in `tests/run-all.js --browser`).
