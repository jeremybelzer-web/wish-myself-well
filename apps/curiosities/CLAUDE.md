# Claude — start here

Repository: https://github.com/jeremybelzer-web/wish-myself-well

Branch: `main`

App folder: https://github.com/jeremybelzer-web/wish-myself-well/tree/main/apps/curiosities

Clone that repo. Work only in `apps/curiosities/`. The rest of the repository is the Channel 2892 show. Leave `web/`, `bible/`, and `memos/` alone.

## What this product is

A live-action, animation, zine, comic-strip, and storyboard app. Every scene is made of three kinds of thing:

1. **Curiosities** — one measurable value in a beat. Shot size. A person crossing. A cup lifted. A camera that is locked, smooth, or handheld.
2. **Curiosity suites** — a named group of curiosities that fire together.
3. **Curiosity proximities** — when curiosity or suite X happens, curiosity or suite Y happens within a number of beats.

A model of a movie, a TV hour, or a video game is only those three. If a fact cannot be stated as a curiosity, a suite, or a proximity, it does not belong in the model.

## Read next

1. `HANDOFF.md` — the build brief and the study rules.
2. `CURIOSITIES-REVIEW.md` — every listed row is marked **keep**. Jeremy can change a row to **drop**. Honor a drop.
3. `catalog.js` — the curiosity list. `live: true` rows are the board controls.
4. `library.js` — the filmmaking catalog (`docs/filmmaking-curiosities-catalog.md`) as data, merged into the curiosity list. 157 curiosities.
5. `model.js` — suites (catalog, genre, and angle-by-emotion), the emotion map, and the proximities a study can count.
6. `app.js` — draws the strip, the paths, and which proximities are firing. The Catalog tab browses curiosities, suites, proximities and development moves.
7. `study.js` — the Study tab and the Shelf.
8. `play.js` — the Play tab: the Flip Book game.
9. `studio.js` and `studio-*.js` — the Studio tab: working tools taken from the Maya and Arnold for Maya manuals. Each file registers one sub-tab with `CuriosityStudio.register`. `maya-manual.js` is the topic inventory; `docs/maya-manual-review.md` is the keep or skip list.
10. `index.html` — open this in a browser. No build step.

State is `localStorage` key `curiosities-board-v2`.

## Already on the board

Thirty live controls. A comic strip. A stage on each panel: character dots, an object, and a camera path. Handheld is a wobble. Smooth is one line. Locked is a still frame. The Suite menu writes a suite into the controls. Seed proximities print under the strip when they match.

## The study view

The Study tab is built. A study is a trace: beat, which curiosities are on, which suites contain them, which proximities held. Counts and ids only. Do not paste scripts, lyrics, level dialogue, or a shot list that recreates a commercial film, episode, or game. Games mark whether the camera is authored or the player’s.

Tick a span of beats and keep one curiosity or one suite on the Shelf. Apply a strand and the board plays it panel by panel. Studies export and import as JSON. State is `localStorage` key `curiosities-studies-v1`. Read `STUDY-PLAN.md` for what comes next.

## Play

The Flip Book cuts each panel into three flaps: Camera, Bodies and Mood. Flipping one swaps in a slice from a study, a suite or the emotion map. Suites that fire and proximities that hold across panels score, and a goal card asks for one suite in one panel. Its best score is `localStorage` key `curiosities-flipbook-best-v1`.

## Automation (the core)

Every curiosity, suite, proximity and proximity suite is an automatable parameter (`automation.js`, `window.CurioAuto`). Its trigger (MIDI note, key, or button) turns it on and off. Inside, its main lane runs between two settings through the curiosity's scale (angle height: floor, low, eye, high, overhead), and its other lanes grade its other parts (a curiosity's other dimensions, a suite's members, a proximity's cause, delay, how often and effect size, a proximity suite's members). Each lane has a from, a to, a curve and its own modulator (follows the main one, LFO, knob, or MIDI CC). Each patch plays in a moment, a span of panels, and a lane can sweep across it. A performer can wear MIDI straps and make a parameter flick or glide between settings at a rate they set. Running parameters play on the Board as the applied strand "Automation" and can send their position out as MIDI CC for VCV Rack and other modular synths (and take CCs in). The Automate tab is the patch bay; the Cross-pollinate tab has one game per level, using studies as inspiration films. Patches and bindings are `localStorage` key `curiosities-automation-v1`.

**Prism** (`prism.js`, the Prism tab): a curated film (any study, or My board) is white light; the Prism splits it into four bands, the curiosities it uses with the range each went through, the suites that fully held, the proximities that held with the delays seen, and the proximity suites whose members held. Pick a moment of your own film (a span of board panels) and drop any row onto it: it becomes a CurioAuto patch built from the film's own ranges (a curiosity's lowest to highest, with lanes for the curiosities that moved with it; a proximity's delay and how often it held) and plays there. A Develop card then offers three next moves (push it further, answer it, turn it around). Its view is `localStorage` key `curiosities-prism-view-v1`.

## Studio

Camera (lens, film back, depth of field, motion blur), Shots (Camera Sequencer, frame rate, playblast, sound), Curves (Graph Editor, Set Driven Key, Time Warp, live MIDI record), Motion (spacing, stepping, anticipation, overshoot, ghosting), Face (blend shapes, pose library, lip sync), Rig & pose (FK, IK, constraints, live puppeteering), Light & look (Arnold lights, exposure, filters, toon), Crowd (MASH), Passes (render layers and AOVs as curiosity passes), Shading, Dynamics, Fur & hair, Bifrost, Chain (Sharani's six areas linked by proximities), Live, Remix, Print, Start here and Manual (every topic, filterable, with your keep or skip calls). Every tool sets curiosities and can send them to the Board. Each tool keeps its own `localStorage` key, `curiosities-studio-<tool>-v1`.

Keep the static files and the look of this folder. Do not add a second git repo inside `apps/`.
