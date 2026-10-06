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
- Hooks only: two `<script>` tags in index.html. No change to the Viewer's files.
- Left out for now: the spec's optional section 4 (the whole app wearing the five colours). The recolouring
  doesn't depend on it.

Tests: `node paintings/tests/run.js` (the data against `tests/expected.txt`, the spec's table) and
`node paintings/tests/browser.js` (in `tests/run-all.js --browser`).
