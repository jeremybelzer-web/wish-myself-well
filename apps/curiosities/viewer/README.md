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
  does in plain words. Dragging empty space swings the camera; the scroll wheel goes closer or farther. **Control-drag** (or right-drag, or middle-drag) slides you through the world, grab-style; **double-click** a spot and the view glides there and zooms in, like Google Maps (Shift or Alt with the double-click zooms out). The slide is kept per panel as `cam.pan` (metres added to what the camera looks at); Back to the subject clears it, and choosing a new subject clears it too.
- **Words.** What happens, a narrator box (yellow), speech balloons whose tails point at whoever speaks,
  seconds on screen, rain falling, frozen or none.
- **The strip.** Each panel is drawn with its balloons. Click to work on it, double-click to play from it,
  + New panel, Earlier, Later, Delete. **Read as a comic** shows every panel big, like a page; Play then
  animates each panel in its place.

## Draw & build (`viewer/build.js`, `viewer/objects.js`)

A fourth tab, **Draw & build**, and quick buttons under "In the scene" (✏ Draw, T Words, ◼ Parts, 🔍 Search
objects). Everything made here is a thing of kind `made` in the film (`o.make` names its maker), so it moves,
turns, glides between panels, saves and undoes like the people and the tuk-tuk. Simple shapes the app draws
itself: no downloads, no paid assets, no AI.

- **Building works like Roblox Studio** (Jeremy chose Roblox as the main model, 2026-10-04): Select (1), Move
  (2: drag a red, green or blue arrow to slide one way only), Scale (3: drag a side's dot to stretch that side,
  Shift grows it evenly; kept as `sx`, `sy`, `sz` on the panel's spot), Rotate (4: drag the yellow ring).
  Moves jump in steps (25 cm to start) and turns in steps (15°); Alt (Option) places freely for one move.
  Dragging a thing along the floor lands it on whatever is under it (a mug on a table). ⌘D duplicates,
  Delete removes. Parts: Block, Ball, Wedge, Corner wedge, Cylinder (Roblox's five), Cone, Pyramid, Dome,
  Ring, Arch, Stairs, Plank, Disc.
- **From Fortnite Creative**: build pieces on a 3 m grid (Wall, Floor, Stairs, Roof, Door wall, Window wall) in
  wood, brick, metal, stone or white paint, and ready-made sets (Kitchen corner, Living room, Street corner,
  Park, Campsite, Harbor).
- **From The Sims**: Wall (W) drags a wall along the floor, Room (R) drags out four walls and a floor (half-metre
  grid, Shift keeps lines straight), and Copy color (C) picks up one thing's color and paints others.
- **The pencil** (P): draws on a sheet standing up facing you (through what the camera looks at), on the floor,
  or on whatever you start on (a wall, a table top). Steady hand smooths wobbles, Shift draws a straight line,
  Mirror copies every line flipped. Shapes menu: free hand, line, rectangle, circle, triangle, star, heart,
  arrow, cloud, speech balloon. Lines join one drawing until Enter or New drawing. Then **Keep it a drawing**
  (pencil lines in the air, seen from every side) or make it 3D: **Puff it up** (a pillow or balloon),
  **Push it out** (a cookie-cutter slab), **Make it a tube** (bent wire), **Spin it round** (a potter's wheel:
  draw half a vase, get a vase).
- **Words** (T): click the picture to place them. Twelve fonts every computer already has (Clean, Book,
  Typewriter, Comic, Poster, Handwriting, Rounded, Elegant, Marker, Old sign, Wide, Narrow), color, bold,
  slanted, outline, letter height, 3D thickness (solid letters), always face the camera, or lay flat on the floor.
- **Search objects**: a window with Omnisphere-style columns (World: Household, City, Country, Water, Sky;
  Place: Kitchen, Street, Forest, Harbor...; Type: People, Animals, Vehicles, Furniture, Nature, Buildings,
  Things, Signs & street). Each column narrows the next and shows how many are left; the search box needs
  every word to match (and knows "puppy" is a dog). Click an object to drop it in the middle of the picture,
  double-click to drop it and close. About 290 low-detail objects in `viewer/objects.js`
  (`window.CurioObjects`); people are the Viewer's own people, so they walk.

Hooks in viewer.js for add-ons: `CurioViewer.makers` (a maker per `o.make`), `addTab`, `setTool` (takes the
pointer), `onOverlay` (draw over the picture), `onThings`, `onKey`, and `live()`, `edit()`, `changed()`,
`pickAt()`, `ray()`, `projectNow()`, `faces()`. Parts can now also be `cyl`, `wedge`, `flat`, `poly` (with
`two` for both sides), `line` (a pencil line, `w` metres wide) and `text`, with `rx`, `ry`, `rz` turns.
Settings: `localStorage` `curiosities-build-v1`. API: `window.CurioBuild`. Tests: `node viewer/tests/build.js`
(browser) and `node viewer/tests/objects.js`.

The sample is Episode 1, scene 1 ("The napkin") from Wish Myself Well in 13 panels. Start over brings it back.

State: `localStorage` `curiosities-viewer-v1`. API: `window.CurioViewer` (open, close, film, setFilm, select,
pick, nudge, faceCamera, setCamera, play, time, render(canvas, seconds), project, undo).

It opens on start; `?viewer=0` skips it, and automated test runs skip it unless `?viewer=1`. The **Full
editor** button closes it (the Screen and the rest of the app are underneath); a **Viewer** button in the bar
and on the Screen brings it back.

Test: `node viewer/tests/browser.js` (in `tests/run-all.js --browser`).
