# Paintings (paintings/)

The Paintings menu, ported from Jeremy's music app (spec: `painting-swatches-prompt.md`, 2026-10-06): 62 famous
paintings as five-colour swatches, so things in the film can take colours a great painter already chose.

- `paintings-data.js` (`window.CURIO_PAINTINGS`): the 62 in the spec's order (0-based here, so painting 7, The
  Great Wave Off Kanagawa, the default, is index 6), each with name, artist, category tags (the first is where it
  is filed) and five colours in the source's order. The credit line lives here and is not shown.
- `paintings.js` (`window.CurioPaintings`): **Paint ▾** in the Viewer's bar opens the Paintings window, the paint
  strip and Forget the colours. Control-click empty space in My film's picture opens or closes the strip
  (Control-click on a thing still opens what it can do; Control-drag still slides). Pick a swatch, then click
  things: each takes the colour, one undo step each, and the colour stays held.
- Where it is kept: the project's painting is `film.painting` in the Viewer's film (so the Viewer's Undo covers
  it and it saves with the project); "Another random painting" is `film.paintingNow`, cleared at every opening;
  the default is `localStorage` `curio-paintings-default-v1` (this device's preference, outside the
  `curiosities-*` project keys). A painted thing keeps its own colour in `o.paintWas` for Forget the colours.
- Hooks only: three `<script>` tags in index.html. No change to the Viewer's files.
- `theme.js` (`window.CurioPaintTheme`): the app wears the painting in force (section 4 of the spec). The Viewer,
  the Screen and these menus take the five as their colour tokens (`--c-*`, `--cc-*`), ranked by lightness, after
  the readability guard moves each 6 % at a time toward white or black (background luminance at most 0.025, text
  7:1, dimmed text and accent 5.5:1, 4.5:1 on every panel layer). The menus' swatches are never changed. "The app
  wears it: on/off" in the window and the strip, per device in `curio-paintings-app-v1` (on unless turned off).
  The older full-editor pages (styles.css, a light paper look with fixed colours) keep their own colours.

Tests: `node paintings/tests/run.js` (the data against `tests/expected.txt`, the spec's table, and the readability rules for all 62) and
`node paintings/tests/browser.js` (in `tests/run-all.js --browser`).
