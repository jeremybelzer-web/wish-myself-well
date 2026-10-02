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
4. `library.js` — the filmmaking catalog (`docs/filmmaking-curiosities-catalog.md`) as data, merged into the curiosity list.
5. `story-curiosities.js` — the story curiosities (arc stage, role in the scene, own plot weight, perspective, mindset, focus, Enneagram type and health, herd mentality and who leads it), plus foreshortening. Options are in scale order.
6. `lenses.js` — lenses. A curiosity is a filter, one way of looking at a scene (someone walks into a bar: look at its color, at the clothes, at the set, at the feeling, at the comedy). `window.CURIOSITY_LENSES` lists each lens as `{id, label, question, main, subs, scope}`: a main curiosity and its sliders (graded sub-parameters, options in scale order). The sliders are also lanes of the main curiosity in automation (`CURIOSITY_FACETS`). Lenses: color, main character's clothes, background clothes, set design, emotion, emotional road (story scope), comedy, comedy from the mix. Comedy is central and has the most sliders. Also lens suites and lens proximities.
7. `model.js` — suites (catalog, genre, and angle-by-emotion), the emotion map, and the proximities a study can count.
8. `suites.js` — `window.CuriositySuites` (suites graded by share, see below). `app.js` — My film: draws the strip, the paths, and which proximities are firing; switches the bar's tabs; draws All curiosities and Show structure. `window.CuriosityBoard` is how everything else reads and writes the board.
9. `workspaces.js` — the workspaces (see below). `story.js` — the story store: values per character per scene. `storyboard.js` — the Storyboard (`window.CuriosityStoryboard.mount(el)`).
10. `automation.js` and `automate.js` — the automation engine and its modules (see Automation).
11. `prism.js` — the Prism. `study.js` — Curated films and the Shelf.
12. `studio.js` and `studio-*.js` — working tools taken from the Maya and Arnold for Maya manuals. Each file registers one tool with `CuriosityStudio.register`; workspaces show them as their Tools. `maya-manual.js` is the topic inventory; `docs/maya-manual-review.md` is the keep or skip list.
13. `core/README.md` — the shared core: the files every version loads (web, desktop, a Maya panel), which never touch the page. `bridge.js` (`window.CurioBridge`) is the one message format for VCV Rack, OSC and tool bridges. `node core/check.js` loads the core with no page. `sw.js`, `offline.js` and `manifest.webmanifest` make the app installable and offline when served from a web address.
14. `maya/` — the Maya panel (`maya/README.md`): the app docked in Maya, each panel's camera curiosities driving `curioCam`, Key shots and Read camera. `maya/scripts/curiosities_maya/curio_camera.py` is the curiosity-to-camera mapping with no Maya in it.
15. `desktop/` — the desktop app (`desktop/README.md`): Electron around the same files, MIDI everywhere, a File menu, and the local bridge (`bridge-server.js`: WebSocket on 7577, OSC in 7000 and out 7001). `npm run check` there tests the bridge.
16. `blender/` — the Blender add-on (`blender/README.md`): connects to the desktop app's bridge and drives `CurioCam` with the same camera mapping as Maya. `make_zip.py` builds the installable zip; `tests/test_blender.py` runs with bpy.
17. `index.html` — open this in a browser. No build step.

State is `localStorage` key `curiosities-board-v2`.

## The bar: My film, Storyboard, the workspaces, and the Library

**My film** is the Board: the controls and the strip, the whole scene. It works as it always has. Its **Save into the storyboard** button keeps the panels as a new scene and opens the Storyboard.

**Storyboard** (`storyboard.js`, `localStorage` key `curiosities-storyboard-v1`) keeps many scenes of My film and flips through them like a flip book; Make many takes snapshots of running automation. It is a page of its own (`CuriosityWorkspaces.open("storyboard")`).

**Workspaces** are the general, most pervasive curiosities and the lenses, each a tab. Automating and cross-pollinating are not tabs of their own: every workspace does both. The bar groups them into labelled sections that wrap onto more rows on a phone:

- Camera: Camera angle, Camera motion, Placement.
- People: Character motion, Lines & delivery, Movement with lines, Background action, Wardrobe.
- Look: Color, Light & look, Set design, Effects.
- Feeling: Emotion, Emotional road.
- Comedy (marked, because comedy is central): Comedy, Comedy from the mix.
- Story: Character arc, Personal plot, Perspective & mindset, Focus, Archetype, Herd mentality.

Scene workspaces hold values per panel of My film; story workspaces (the Story section and Emotional road) hold values per character per scene of the whole story. Archetype keeps a slot for the 3D character matrix (`window.CharacterMatrix.mount(slot)` when it exists).

**Lens workspaces** (Wardrobe, Color, Set design, Emotion, Emotional road, Comedy, Comedy from the mix) are built from `CURIOSITY_LENSES`. They show the lens's question at the top in plain words, then the same four parts with the lens's main curiosity first and its sliders under it (in the grid, and as one automation module each). Wardrobe joins two lenses as two sections: Main character and Background.

Every workspace page has four parts, in this order:

1. **In my film** — a grid of the workspace's curiosities by panel (scene) or by scene for one character (story), showing what plays now, running automation included. A scene cell writes to the board as an applied strand (`CuriosityBoard.apply`); running automation plays on top of it as its own layer, so stopping automation hands the panels back. A story cell writes to `CuriosityStory` (`localStorage` key `curiosities-story-v1`; 8 scenes and the scene's speakers to start, add characters there).
2. **Automate** — one compact module per curiosity (`CuriosityAutomate.mount(el, key, {compact: true})`), then the suites, proximities and proximity suites that involve them.
3. **Cross-pollinate from a film** — the Prism filtered to these curiosities (`CuriosityPrism.mount(el, {curiosities, title})`).
4. **Tools** — the Studio tools for the workspace as small sub-tabs (`CuriosityStudio.mount(el, toolId)`).

If one of those three mount functions is missing, the page shows a plain line in its place. `window.CuriosityWorkspaces` has `open(id)`, `openFor("c:<curiosity>")` (a lens's main curiosity opens its lens) and `list()` (with each workspace's bar section, question and lens sections). The last open tab is `localStorage` key `curiosities-workspace-v1`.

**Library** (the menu at the right end of the bar): Curated films (studies and the Shelf), Prism (the whole-film Prism), All curiosities (curiosities, suites, proximities, development moves), Maya manual (every topic, and Start here), Print, Show structure (companies and exits), Automation patch bay (every automation at once).

## Suites are graded

A suite is a group of lenses you look through together, so it is never all-or-nothing. `window.CuriositySuites` (top of `app.js`) measures a beat or panel by the share of a suite's members that match (0 to 100%), `across` averages it over many panels with the best one, and `present` counts a suite as there when at least `CAUSE_SHARE` (half) of it matches: that is what a suite as a proximity's cause uses, in automation, the Prism, Chain and Dynamics alike. A lens suite (no fixed values, `set: {}`) has nothing to match and shows its lenses side by side. The Prism's suites band lists the top 6 by best share, with Show all.

## Already on the board

Thirty live controls. A comic strip. A stage on each panel: character dots, an object, and a camera path. Handheld is a wobble. Smooth is one line. Locked is a still frame. The Suite menu writes a suite into the controls. Seed proximities print under the strip when they match.

## Curated films

A study is a trace: beat, which curiosities are on, which suites contain them, which proximities held. Counts and ids only. Do not paste scripts, lyrics, level dialogue, or a shot list that recreates a commercial film, episode, or game. Games mark whether the camera is authored or the player’s.

Tick a span of beats and keep one curiosity or one suite on the Shelf. Apply a strand and the board plays it panel by panel. Studies export and import as JSON. State is `localStorage` key `curiosities-studies-v1`. Read `STUDY-PLAN.md` for what comes next.

Share a film (Library menu, `trace.js`, `window.CuriosityTrace`) saves any curated film as a counts-only trace file (`.curiotrace.json`: known curiosity ids and values on their scales, no notes) and loads other people's into Curated films and the Prism. The cloud library is a plan: `docs/shared-library-plan.md`.

DaVinci Resolve (`resolve/`, Workspace > Scripts > Curiosities): storyboard panels as timeline markers, an edit read back onto the board, and any edit traced into a shared-film file. See `resolve/README.md`.

Unreal Engine (`unreal/`, an editor plugin, Tools > Curiosities): a CineCamera that follows the storyboard, shots keyed into a Level Sequence, and a hand-set camera read back onto the board, using the same camera mapping as Maya and Blender. See `unreal/README.md`.

## Games are paused

Games wait until the curiosity model is fleshed out; they will be the last thing built. `play.js` (the Flip Book) and `games.js` (the Cross-pollinate games) stay in the folder but are not loaded or shown.

## Automation (the core)

Every curiosity, suite, proximity and proximity suite is an automatable parameter (`automation.js`, `window.CurioAuto`). Its trigger (MIDI note, key, or button) turns it on and off. Inside, its main lane runs between two settings through the curiosity's scale (angle height: floor, low, eye, high, overhead), and its other lanes grade its other parts (a curiosity's other dimensions, a suite's members, a proximity's cause, delay, how often and effect size, a proximity suite's members). Each lane has a from, a to, a curve and its own modulator (follows the main one, LFO, knob, or MIDI CC). Each patch plays in a moment, a span of panels, and a lane can sweep across it. A performer can wear MIDI straps and make a parameter flick or glide between settings at a rate they set. Running parameters play on the Board as an "Automation" layer over any applied strand and can send their position out as MIDI CC for VCV Rack and other modular synths (and take CCs in). Each workspace shows the modules for its own curiosities; the Library's Automation patch bay shows them all. Patches and bindings are `localStorage` key `curiosities-automation-v1`.

**Prism** (`prism.js`, in the Library and, filtered, in every workspace): a curated film (any study, or My board) is white light; the Prism splits it into four bands, the curiosities it uses with the range each went through, the suites it shows and how much of each (top 6 by best share, Show all for the rest), the proximities that held with the delays seen, and the proximity suites whose members held. Pick a moment of your own film (a span of board panels) and drop any row onto it: it becomes a CurioAuto patch built from the film's own ranges (a curiosity's lowest to highest, with lanes for the curiosities that moved with it; a proximity's delay and how often it held) and plays there. Each row offers "Copy it" (the film's own values) or "Make it an analogy" (A is to B as C is to D: the same move, by its place on the scale, starting from where your moment is). A "Borrow this film's emotional road" card stretches a film's feeling over your story's scenes into a character or The film row, with a preview and undo. A Develop card then offers three next moves (push it further, answer it, turn it around). Its view is `localStorage` key `curiosities-prism-view-v1`.

## Studio tools

There is no Studio tab: each tool opens as a Tool in its workspaces (Camera in Camera angle and Placement, Light in Light & look, and so on), and the Maya manual and Print are in the Library. The tools: Camera (lens, film back, depth of field, motion blur), Shots (Camera Sequencer, frame rate, playblast, sound), Curves (Graph Editor, Set Driven Key, Time Warp, live MIDI record), Motion (spacing, stepping, anticipation, overshoot, ghosting), Face (blend shapes, pose library, lip sync), Rig & pose (FK, IK, constraints, live puppeteering), Light & look (Arnold lights, exposure, filters, toon), Crowd (MASH), Passes (render layers and AOVs as curiosity passes), Shading, Dynamics, Fur & hair, Bifrost, Chain (Sharani's six areas linked by proximities), Live, Remix, Print, Start here and Manual (every topic, filterable, with your keep or skip calls). Every tool sets curiosities and can send them to the Board. Each tool keeps its own `localStorage` key, `curiosities-studio-<tool>-v1`.

Keep the static files and the look of this folder. Do not add a second git repo inside `apps/`.

## Saving

`project.js` (`window.CuriosityProject`) bundles every `curiosities-*` localStorage key into one `.curio` file (JSON, format `curiosities-project`, version 1): Save, Save as, Open and New project from the Library menu, with a save indicator in the bar. Autosave history keeps the last 20 snapshots in IndexedDB; any snapshot can be restored and the restore undone.
