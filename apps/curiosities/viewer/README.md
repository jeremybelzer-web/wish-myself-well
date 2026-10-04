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

A fourth tab, **Draw & build**. The "In the scene" list scrolls, with a + (add another like it), an eye and a
lock on every row; Object search, Setting search and Character search sit at its top, and Add a shape is a list
with a + on each (the Viewer's shapes, every part, a drawing, words). Everything made here is a thing of kind `made` in the film (`o.make` names its maker), so it moves,
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
- **Setting search** (World, Place): a place from the object library becomes the scene's setting: its things in
  a U around the middle (the middle stays free for the characters), walls and a floor indoors. A new setting
  replaces the old one (things carry `o.setting`). **Character search**: people and animals only, with who is
  in the scene on top (pick to change them, ⋯ for what they can do, ✕ to take them out).
- **Control+click** (`viewer/actions.js`, `window.CurioActions`): Control+drag a thing spins it (left and right
  turns, up and down tips it; Shift for steps); Control+click or right-click opens what it can do. People: stand,
  get up, lie down, fall over, sit, walk, run, climb, swim, jumping jacks, push-ups, eat, wave, reach, dance,
  cheer, shrug, sleep, catch fire. Animals: walk, run, jump, sit, lie down, sleep, eat, chase its tail, shake
  off, swim, fly away, land, roll over, get trampled. Things: back to normal, crumble, catch fire, smoke, get
  trampled, break apart, fall over, upside down, melt, float away, drop, spin, shake, grow, shrink. An action
  starts in the panel you are on and stays for the rest of the film (or only that panel); it is kept on the
  panel's spot as `tilt`, `roll`, `lift`, `pose`, `fx`, `fxAmt` and `act`. viewer.js draws `tilt` and `roll`,
  glides any number on a spot, and takes new poses (`addPose`) and part changes (`onParts`).
- **Build windows** (`viewer/build-windows.js`, `window.CurioBuildWindows`, "Windows" at the top of the tab):
  Roblox Studio's Properties (filter, Data, Appearance, Transform, Behavior, Action), The Sims' Build Mode (Hand,
  Wall, Room, Sledgehammer, Design, 45° turns; catalog by function and by room; Design swatches; wall height)
  and Fortnite Creative (Prefabs & Galleries, Building with materials, Phone; a quick bar). Their arrangement and
  control names, drawn in this app's style. Each has a Curiosity menu: All of this window, the curiosities its
  settings belong to, or any of the others by typing. A picked curiosity shows its own value per panel
  (`panel.v`, which Front and center reads) with a lane, then the settings that belong to it, then the rest.
  ⧉ opens another copy for another curiosity. Every per-panel setting has a ◇: hollow is the same in every
  panel; ◆ (`o.auto[setting]`) keeps one value per panel with a lane (drag a dot, click to go to that panel,
  double-click for the panel before's value). Open windows: localStorage `curiosities-build-windows-v1`.
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
Settings: `localStorage` `curiosities-build-v1`. API: `window.CurioBuild`. Tests: `node viewer/tests/build.js`, `node viewer/tests/build-windows.js`
(browser) and `node viewer/tests/objects.js`.

The sample is Episode 1, scene 1 ("The napkin") from Wish Myself Well in 13 panels. Start over brings it back.

State: `localStorage` `curiosities-viewer-v1`. API: `window.CurioViewer` (open, close, film, setFilm, select,
pick, nudge, faceCamera, setCamera, play, time, render(canvas, seconds), project, undo).

It opens on start; `?viewer=0` skips it, and automated test runs skip it unless `?viewer=1`. The **Full
editor** button closes it (the Screen and the rest of the app are underneath); a **Viewer** button in the bar
and on the Screen brings it back.

Test: `node viewer/tests/browser.js` (in `tests/run-all.js --browser`).

## App Walkthrough

`viewer/walkthrough.js` (`window.CurioWalkthrough`) is a guided tour in thought bubbles: a cream comic-style
bubble with a little trail of circles points at each part while the rest of the page dims. 24 steps cover the
Viewer, then the Screen (the tour opens it), then the rest of the app (My film, Storyboard, workspaces,
Library). Next or the → key goes on, Back or ← goes back, Escape or × stops; at the end the Viewer is back on
top. A step whose part isn't on the page is skipped, so the tour keeps working as parts move.

It starts by itself the first time someone opens the app on a device (remembered in `localStorage`
`curio-walkthrough-seen-v1`, outside the `curiosities-*` saves on purpose). Afterward it lives under
**Help ▾ ▸ App Walkthrough** at the top of the Viewer, the Screen and the app; the Help button is added by the
tour itself and put back if a bar redraws, so those files need no change. `?walkthrough=0` skips the first-run
start; automated test runs skip it unless `?walkthrough=1`. Adding a step: one entry in `STEPS` with `part`,
`title`, `text`, `sel` (the part to light up) and `go` (what to open first).

Test: `node viewer/tests/walkthrough.js` (in `tests/run-all.js --browser`).

## Front and center

`viewer/focus-lane.js` (`window.CurioFocusLane`) is the lane right under the picture (Jeremy, 2026-10-04):
usually only one or two curiosities at a time move the story forward and hold the audience's attention, so
the lane always shows which. **Leading** is who holds attention, read by the app's own attention model
(`CurioAttention.read`, the one behind the Screen's Attention band); it holds until something else takes it.
**With it** is the strongest other curiosity changing in that panel (the one that pushes the story hardest).
**Suite** shows the suite the leading one or the one with it belongs to, when most of its lenses are on.
A **⚡** marks a proximity: the one in front was set off by something else a moment before (a rule from
`PROXIMITIES`, such as "an object enters" setting off a cut to an insert), and the line above the rows says by
what. Click a block to jump there.

Each panel is read as curiosity values: from the picture (shot size, camera height, lens and fisheye, the
camera pushing in, pulling out or circling, people moving toward or away from the camera, people and things
coming in or going out, rain, balloons and captions) plus the story values a panel carries in `panel.v`
(emotion, plot progress, a reveal, a comic beat, tension, volume...). The sample has them; a saved copy of the
sample borrows them. Hooks it uses in viewer.js: `onDraw`, `onChange`, `under`, `seek`.

Test: `node viewer/tests/focus-lane.js` (in `tests/run-all.js --browser`).

## Round 6 (Jeremy's notes, 2026-10-04 20:16Z)

- **Looking around.** A plain drag anywhere in the picture swings the camera, including over a thing that
  isn't picked yet (that click picks it). Drag a thing that is already picked to move it. The camera swings all
  the way round, and under the subject too: from underneath, the floor is see-through like glass.
- **Nothing disappears up close.** A face partly behind the camera is cut at the camera instead of dropped
  (`clipNear`, `projectFace`), so buildings stay when you zoom or slide right up to them or past them.
- **Fisheye** now goes from a straight-line lens through an equidistant fisheye (50%) to an equisolid one
  (100%, like an 8mm circular fisheye), widening as it bends (`lensR`, `lensTh`). **Haze** starts past the
  subject, so the least foreshortening (a long lens far away) is no longer grey.
- **Windows.** A + in every window's corner tab adds a window. Under the picture: *Fit all windows on screen*
  or *Keep size, swipe the top edge* (one big window; drag along its top edge, or click its dots, to see the
  others; key `curiosities-viewer-winmode-v1`).
- **Front and center** has an attention pie (right now), a graph (the whole film) and a list of every
  curiosity on, by share; click the pie or the graph to see it bigger. Pointing at a shortened name shows it in
  full at the top right.

Test: `node viewer/tests/camera.js`.

### Camera flight path (`viewer/flight.js`)

Drone-style, modelled on how DJI waypoint missions and Litchi plan a flight: each waypoint has a place and
height, where the camera looks, a lens turn (roll) and a lens length; the drone flies smoothly through them
without stopping (DJI's "curve size", here *Smooth corners*), and looks either where you pointed it
(interpolated between waypoints), at one point of interest the whole way, or ahead along the path.

- **Flight path tab.** ● Record plays the panel for its seconds while you fly: drag to swing round,
  Control-drag to slide, wheel for distance, W/A/S/D fly, R/F up and down, Q/E turn the lens, Esc throws the
  take away. A point is kept every quarter second.
- **The 3D graph** shows the path from outside with the floor grid, every thing as a labelled dot and the
  camera's look line. Drag it to turn it, wheel to zoom, drag a numbered waypoint to move it across the floor,
  Shift-drag to raise or lower it. + Waypoint here adds the current camera at the playhead; ✕ takes one out.
- **Spin the lens while flying** adds up to two full turns over the panel.
- Data: `panel.flight = {on, look: "recorded"|"poi"|"path", poi, curve, spin, pts: [{t, p, l, roll, lens}]}`
  (`t` 0..1 through the panel). The Viewer asks every `CurioViewer.onPose(fn)` for the camera; the flight
  path answers with `{pos, target, roll, lens}`.
- **Camera & lens** also gained *Lean* all the way round (-180° to 180°), a *Color filter* (warm, cool, noir,
  sepia, neon, faded, dream) and *Background blur* (everything farther than the thing the camera looks at goes
  soft; it stays sharp).

Test: `node viewer/tests/flight.js`.

### People (`viewer/people.js`)

A People tab for every person in the scene, set panel by panel (a value set in a panel is a ◆ key and holds
until the next one, like CapCut keyframes):

- **Emotion wheel**: Plutchik's eight feelings (joy, trust, fear, surprise, sadness, disgust, anger,
  anticipation), mild in the middle, strongest at the rim, with the blends between neighbours named (love,
  awe, remorse ...). *Tilt into 3D* lays it back into Plutchik's cone and draws the character's path through
  the film over it.
- **Enneagram type and emotional health** (1 liberated .. 9 collapsed), from `character-matrix/data.js`.
  Changing a character's type partway through the film first shows Jeremy's warning ("The audience will
  experience this user as having undergone a massive change in personality ...").
- **Chaos matrix**: orderly to chaotic, keeps things as they are to a force for change, with a *why*. It starts
  where the type and health put it.
- **Emotional roadmap**: every character's feeling in every panel, and the film's (the strongest feeling in
  each panel). Click a square to go there.

Data: `panel.people[objectId] = {emo: {a, r}, type, health, chaos, change, why}`. Test: `node viewer/tests/people.js`.

### Rate of speech (`viewer/speech.js`)

Every speech balloon has a Speed in syllables a second (slow drawl to auctioneer), set with the slider, by
tapping once per syllable (*Tap it*, or the space bar), or by saying the line into the microphone (*Say it*:
the app times the voice from when it starts to when it stops). The note says how long the line takes and
warns when it runs past the panel. Playing, the words appear at that speed, balloon after balloon.
Data: `panel.words[k].rate`. Test: `node viewer/tests/speech.js`.
