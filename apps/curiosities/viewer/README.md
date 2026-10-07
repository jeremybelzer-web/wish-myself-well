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
- **People's looks and stuck drawings** (`viewer/wear.js`, `window.CurioWear`; Jeremy 2026-10-04 22:06Z: 3D
  characters "selectable and draw-able and tweak-able modifiable"). Character search has Make someone from words
  ("Ida: spiky red hair, overalls, boots": the name before the colon, the rest is the look). Each panel's spot
  of a person can carry `look` (the words, read by the 3D characters' own reader `CurioRig.maker.read`, loaded
  with `CurioRig.load()` the first time a look is seen), `lookParts` (hair, hairColor, hat, hatColor, top,
  topColor, bottom, bottomColor, feet, shoesColor, skin, build, height: maker's names, colors as `#rrggbb`,
  winning over the words) and `rig: true` (draw as a full 3D character; the Viewer thread's
  `viewer/rig-actors.js` draws those). The Properties window has a Character section with all of them, each
  automatable with ◇; The Sims' Build Mode has Create a Sim, Looks (ready-made looks in words). The block
  figure wears the look (colors, hair shapes, hats, skirts, build and height). A drawing made with the pencil
  "on things" on a thing sticks to it (`o.pin = { id, lx, ly, lz, dt, ds }`, its spot in the thing's own turn
  and size), and goes where it goes, turns when it turns and grows when it grows, in every panel; Properties'
  Stuck to sticks or unsticks anything. A stuck thing dragged by hand stays where it is put, stuck there.
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
Settings: `localStorage` `curiosities-build-v1`. API: `window.CurioBuild`. Tests: `node viewer/tests/build.js`, `node viewer/tests/build-windows.js`, `node viewer/tests/wear.js [--three three.min.js]`
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
A **⚡** marks a spark: the one in front was set off by something else a moment before (a rule from
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

- **Acts like right now** (Jeremy, 22:06Z): health moves them along the usual Enneagram lines. At health 1-2
  they act like their growth number, 3 leans that way, 4-6 is themselves, 7 leans toward their stress number,
  and 8-9 they act like it (a Loyalist 6 at their best acts like a 9, at their worst like a 3). The tab says how
  that looks and what the other type wants and fears. It can be set by hand per panel (`acts`, a ◆ key).
  `CurioPeople.actsLike(type, health)`.
- **What they want right now**: their motivation in this panel (`motive`, a ◆ key), beside their type's core
  desire and fear.
- **Their normal amount of chaos**: a yellow ring on the chaos matrix (`object.normal = { chaos, change }`, set
  with the slider or Make this their normal), so you can see how far this panel's dot is from their usual self.
  When a panel doesn't set a place, the dot sits at their normal.

### Rate of speech (`viewer/speech.js`)

Every speech balloon has a Speed in syllables a second (slow drawl to auctioneer), set with the slider, by
tapping once per syllable (*Tap it*, or the space bar), or by saying the line into the microphone (*Say it*:
the app times the voice from when it starts to when it stops). The note says how long the line takes and
warns when it runs past the panel. Playing, the words appear at that speed, balloon after balloon.
Data: `panel.words[k].rate`. Test: `node viewer/tests/speech.js`.

### Comic strip playhead and comic layouts (`viewer/comic.js`)

- An orange playhead (line and ▼) on the storyboard strip, over a ruler with half-second ticks. Drag along
  the ruler to scrub (the strip scrolls along at its edges); click inside a panel to jump to that moment.
- Sound while scrubbing and playing (Web Audio, no files): a blip for every syllable of a balloon at its rate
  of speech, each speaker with their own pitch; a hiss over falling rain. Crossing into a new panel makes no sound. 🔊 Sound
  in the strip head turns it off (key `curiosities-viewer-sound-v1`).
- Scrubbing (Jeremy 2026-10-06): holding the playhead (the ruler's ▼ or the slider under the picture) and
  moving it plays the sound at the hand's speed: right plays forwards, as fast as the drag (pitch rises with
  speed); left plays backwards (last word first, each blip reversed) and the picture, rain included, runs
  backwards. Your own videos in a window are scrubbed with their real sound (read once, kept forwards and
  backwards) and play with sound. Jumps (a click, Stop going back) are silent. The space bar or ❚❚ stops
  every sound at once (`CurioComic.hush`, `sounding()`, `scrubbed()`).
- Pause goes back to where Play was pressed (default) or stays where it stopped, picked under the picture
  (key `curiosities-viewer-afterstop-v1`; `CurioViewer.onPlay`, `playing()`, `togglePlay()`).
- Read as a comic → Layout: Simple grid, **Modern comic** (frame by shot and story: establishing = full tier,
  big beats = splash, tiny inserts = small oval inset, high or low angles = tall, close = narrow, short panels
  smaller, tilted or fisheye = slanted; tiers read left to right, in order) or **Zine** (borderless photocopied
  cut-outs, a little turned, on paper). Pictures are drawn to each frame's shape. Key `curiosities-viewer-comiclayout-v1`.

Test: `node viewer/tests/comic.js`.

### Hover help (`viewer/hoverhelp.js`)

Rest the pointer on anything (Viewer, Screen, the rest of the app) and a bubble says what it is: the control's
own description (title, aria-label, data-help), a slider's name and its two ends, a menu's choices, the thing
in the picture under the pointer, and the part of the app it belongs to in the walkthrough's words (the
walkthrough's `steps()` now carry their text and tab). The browser's own tooltip is held back while the
bubble shows. Help ▸ Hover help turns it on or off (key `curio-hoverhelp-v1`, on to start with; automated
browsers start with it off unless `?hoverhelp=1`). Test: `node viewer/tests/hoverhelp.js`.

### Borders (`viewer/borders.js`, `window.CurioBorders`)

Every border between the Viewer's panels can be dragged, using the Screen's own border tool (`CurioScreen.splitter`, screen/ui.js) so they look and work the same: In the scene | the picture, the picture | Details, the picture | Front and center, and everything above | the storyboard. Hovering shows a cyan line and triangles pointing the ways it can go. The arrow keys move a focused border, double-click gives the usual size, and «, Enter or a drag past the smallest size folds a panel away completely; click or drag the thin edge left behind to bring it back. Sizes are kept with the film in `film.view.borders` ({ left, right, lane, strip, fold }), so Undo and Redo take a border move back like any other change (`CurioViewer.remember(tag)` adds an undo step without moving the playhead), and they come back after a reload. Only wider than 1100px and not in Read as a comic; phones keep their one column. Test: `viewer/tests/borders.js`.

### 3D characters (`viewer/rig-actors.js`, `window.CurioRigActors`)

Jeremy, 22:06Z: "we want 3D characters both selectable and draw-able and tweak-able modifiable". The **3D** button next to a person in In the scene (`object.rig`, the whole film, one undo step) or `place.rig` per panel (true or false, written by Draw & build) plays that person with a 3D character: the Plain figure's skeleton from rig/ dressed by Make a character from words (`CurioRig.maker.make(ctx, plan)`). The Viewer draws it itself, face by face (soft faces, no lines between them), so it is in the same world as the block shapes: hidden behind things, bent by the fisheye, filtered, blurred, in the comic strip, and clicking it picks it (`pickAt`).

- Look: `place.look` (words) or `object.look`, else words from the person's own colors (with their exact colors); `place.lookParts` / `object.lookParts` change single parts of `CurioRig.maker.read(words)` using the maker's names (hair, hairColor, top, topColor, bottom, bottomColor, feet, shoesColor, hat, hatColor, skin, build, height, kid, old...). A color can be a number or a word.
- Pose: `CurioViewer.limbs(pose, phase)` (the block figure's own limb angles, every pose in POSE_FX too) turns the skeleton's arms and legs; sitting bends the hips and knees and lowers the body.
- Face: the mouth follows the People tab's feeling (smile, grumpy, surprised, serious).
- Loads on first use (`CurioRig.load()`, three.js from cdnjs, `rig/GLTFLoader.js`, the Plain figure). Each look is built once; surfaces are simplified (points closer than 4.5 cm merged, small pieces less, at most about 44 faces a piece and 110 for the head) so a scene still plays.

Test: `viewer/tests/rig-actors.js [--three three.min.js]`.

## Bring the scene into focus (`viewer/scene-focus.js`)

After you change a curiosity, a suite or a proximity (in the Viewer or in My film's lanes), a pop-up asks
whether to change the curiosities around it so the scene's focus comes through stronger (Jeremy,
2026-10-05). A box at the top to type what you want, a menu of curiosities with the 4 that help most picked
to start (+ More curiosities adds others), and a scrollable list of options to tick: plain picture phrases
("Bright blue sky (Setting)", "From below shot (Camera angle)", "“Great to see you again” (Extra
character)") and the values that scenes like yours used, each saying which scene it is like. The ideas come
from the scenes in the curiosity database (`CuriosityDB.data.scenes`), worked out on the device with no paid
AI; as the scene library grows, the ideas grow with it. Change applies the ticked options as one undo step;
Not now leaves a ✨ button; "Ask me after changes" turns it off (`curiosities-scene-focus-v1`). API:
`window.CurioSceneFocus`. Test: `node viewer/tests/scene-focus.js`.
