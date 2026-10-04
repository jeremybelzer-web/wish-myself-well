# The Viewer

The first thing Curiomatic shows: a big picture of the film, a comic strip of panels under it, and plain
controls to change what you see. Built because the metrics-first pages were hard to read (Jeremy, 2026-10-04).

- **The picture.** A small 3D drawer on a 2D canvas (no three.js): a street with floor tiles, people, a
  tuk-tuk, buildings with lit windows and signs, boxes, balls, trees, lamp posts, rain. Things glide from where
  they stand in one panel to where they stand in the next while the film plays; people walk when they move.
- **Windows.** **+ Window** (under the picture) opens another window beside your film, as many as you like
  (up to 8). Each window has a tab in its upper-left corner: swipe it left or right (or tap its ‹ ›) to switch
  which loaded film it shows, or tap the name for the list. Loaded films are My film, the built-in inspiration
  films (The chase, The double take) and any video you bring in from your computer (it stays on your
  computer and is not saved). All windows play together. **Use this camera in my panel** copies an inspiration
  film's shot size, lens, fisheye, height, side (measured from the subject's face) and lean onto your panel.
  Which films are open is kept in `curiosities-viewer-windows-v1`.
- **Move it.** Pick a thing (click it in the picture or its name on the left). The arrow pad moves it left,
  right, up, down and on the four diagonals ("up and down" means farther and nearer on the floor, or up in the
  air). Drag it in the picture (Shift lifts it). Turn it, Face the camera, Side on, Back to the camera, size,
  pose, shown in this panel, copy this spot to the next panel or every panel. Arrow keys, Q and E turn, F faces
  the camera, Space plays.
- **Camera & lens.** Looks at, how much we see (shot size), Foreshortening (a wider lens moved closer, so the
  subject keeps its size: a dolly zoom), Fisheye (bends straight lines; a full fisheye shows the round edge),
  camera height, side and lean, Cut or Glide into the next panel, presets (Normal, Fisheye, More
  foreshortening, Flat, Worm's eye, Bird's eye, Dutch angle) and a map from above. Every control says what it
  does in plain words. Dragging empty space swings the camera; the scroll wheel goes closer or farther.
- **Words.** What happens, a narrator box (yellow), speech balloons whose tails point at whoever speaks,
  seconds on screen, rain falling, frozen or none.
- **The strip.** Each panel is drawn with its balloons. Click to work on it, double-click to play from it,
  + New panel, Earlier, Later, Delete. **Read as a comic** shows every panel big, like a page; Play then
  animates each panel in its place.

The sample is Episode 1, scene 1 ("The napkin") from Wish Myself Well in 13 panels. Start over brings it back.

State: `localStorage` `curiosities-viewer-v1`. API: `window.CurioViewer` (open, close, film, setFilm, select,
pick, nudge, faceCamera, setCamera, play, time, render(canvas, seconds), project, undo).

It opens on start; `?viewer=0` skips it, and automated test runs skip it unless `?viewer=1`. The **Full
editor** button closes it (the Screen and the rest of the app are underneath); a **Viewer** button in the bar
and on the Screen brings it back.

Test: `node viewer/tests/browser.js` (in `tests/run-all.js --browser`).
