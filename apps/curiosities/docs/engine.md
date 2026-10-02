# The engine

The Curiosity Lane letter (Jeremy passed it on from the Claude that builds his music app, 2026-10-02) explains how a curiosity app is built: one shared state, a rewrite in a fixed order, the user's own edits kept apart, undo for everything, saving that is checked, links between curiosities kept as plain data, a fake host for testing, randomized tests, the clip matrix and its cube, and pulling curiosities out of reference works. This folder, `engine/`, is all of that for Curiosities.

Open it from **Library, Engine** in the app (once `engine/load.js` is on the page), or open `engine/index.html` on its own, where a stand-in plays the part of My film.

## In plain words

Think of your film as a spreadsheet you can play.

- **Rows are moments** of your film, top to bottom (a panel of My film, or a scene).
- **Tracks are columns**: Master (things that belong to the whole moment, like its feeling, the setting, how often the camera cuts), Camera, and one track per character.
- Each track has **lanes**, one per curiosity: the Camera track has shot size, angle height, camera move; a character track has how loud they speak, how big they move, where they walk.
- A **cell** is one curiosity of one track at one moment, like "Nessa's volume in moment 3".

You change cells in four ways, and the engine always applies them in the same order:

1. **Your material**: the value you typed. It ripples through your links.
2. **Automation**: a lane with points ("loud here, quiet there"); between points it ramps or holds.
3. **Links**: rules between two lanes. "When the feeling changes, the cutting rate follows it." A change in one lane runs through the links into the others, a chain reaction.
4. **Pins**: a value you fix by hand. It is laid on last, so no rule can move it. You can also switch a cell off.

Everything you do is one **undo** step. The film is saved after every change and checked: it is written, read back and compared by a fingerprint (a short code computed from every part of the film), so if anything would be lost on a reload you are told instead of finding out later.

## The windows

- **Timeline** (the letter's "master"): every track with its lanes stacked under it, moments across. Colour shows where each value came from: plain is your material, blue is automation (a dot marks a point), amber is a link, purple is a pin, grey is switched off. Click a cell to change it, pin it, add an automation point or start a link from it. Click a moment's name to rename, move, add or remove it. "Edit" on a track adds lanes (any curiosity in the app) or renames it.
- **Links**: every link as one line you can switch off, change (how much, how many moments later) or remove, and a form to add one. "Add the letter's links" adds the rules from the letter's table; "Add the app's proximities" turns the app's own proximities (model.js and the database) into links where both of their curiosities are on your tracks. Under the list, **what fired** shows each chain reaction in words.
- **Cube**: the clip matrix (tracks across, moments down, each cell the whole clip). Step back a layer (the arrows, a sideways swipe, or the Left and Right keys) and each cell shows one curiosity of its clip, coloured from low (cool) to high (warm). Turn the cube to see every clip's curiosities lined up behind it (drag to turn, wheel to zoom). Double-click to go inside: each clip is a block with a dot (a node) per curiosity, and lines show the links that fired. Click one node, then another, to link them.
- **Analyze**: paste a screenplay or a shot list from a work you love. The engine reads it once and keeps only numbers and labels (no lines, names or descriptions): per scene, how charged it is, how loud, how much is said and done, how many people speak, how often the speaker changes, interior or exterior, time of day; per shot, the size, angle, move, rig, lens and how long it holds. Keep it as a reference, then **carry** any of those lanes onto a track of your film; it becomes an automation lane stretched over your moments.
- **History**: this film's undo list, the saving check, how many calls the engine made to My film, the **self-check**, and **everything else in the app** (see below).

**Send to My film** plays the result on the board's panels as one strand called "Engine" (the Storyboard, Maya, Blender and the others follow the board). "Send every change" does it after each change. **Take back from My film** puts back what the board showed before.

## The gap analysis: the letter against the app

| The letter | What the app had | What the engine adds |
| --- | --- | --- |
| The four words: curiosity, suite, proximity, proximity suite | All four, as a catalog and as automation parameters | Proximities you can make yourself, as links between lanes, and proximity suites as chains of them |
| Build around a host, not inside it | The app is its own host; bridges to Maya, Blender, Unreal, Resolve, VCV | The engine treats My film as its host: it reads the board's panels and sends the result back as one strand (`host.js`) |
| One shared state, many views | About twenty separate saved parts, each part of the page keeping its own copy while open | One state for the film; every engine window is a view of it and changes it only by sending messages. The rest of the app is not moved onto it yet (below) |
| A rewrite from source to destination in a fixed order | The board layered controls, then a strand, then automation | Your material, then automation lanes, then links, then pins, every time (`state.js`, `rewrite`) |
| The user's hand edits kept apart and replayed last | Hand changes overwrote values | Pins and switched-off cells are stored apart and laid on last |
| A partial rewrite must equal a full rewrite | Nothing partial | The engine always rewrites the whole film (it takes milliseconds); only sending to My film is partial, and a test checks it leaves the board exactly as a full send would |
| A window per curiosity, speaking only in messages | Workspaces per curiosity, calling functions directly | The engine's windows speak only in messages (`send({ type, ... })`), so they can be tested without a page |
| Curiosity lanes over time; a master track | Automation patches in a patch bay | Automation lanes per track, with points that ramp or hold, on one timeline |
| Find out what the host lets code write; plan a print step | Not looked at | Measured: My film has one strand at a time, at most 8 panels, and no per-character values. Whatever it cannot show stays in the engine and is listed in History |
| Links as plain data: from, to, within, every, does, amount | Proximities in code, with a test function | Links as data with exactly those fields, plus a condition ("only when the leader is angry") and a span of moments, listed, switchable and undoable |
| Every change one undo step | No undo at all | Undo and redo for the film, and an app-wide history for everything else |
| Saved state must come back identical; fingerprint before and after reload | Project files and autosave, no check | Fingerprint written with every save and compared on every load; Check now; the self-check |
| The clip matrix and the cube | None (the character matrix is a different cube) | The cube, built after the links, as the letter advises |
| A fake host, measured against the real one | None | `fake-host.js`, and a browser test that runs the same script on both and fails when they differ |
| Tests per module; randomized undo, reload, clicks, malformed messages | One load check | 24 module and randomized checks in Node; a browser walkthrough with 3,000 random clicks and keys |
| One script that checks the user's real project and leaves nothing behind | None | The self-check in History |
| Measure speed in host calls | Not measured | The engine counts its calls to My film and skips a send when the board already shows the result |
| Analysis: extract curiosities from reference works | Curated films by hand, and the Prism | Analyze reads scripts and shot lists automatically, keeping values only |
| Record Jeremy's words verbatim and numbered | Decision logs | `docs/jeremys-words.md` (and the shared copy in the project files), cited in the code |
| A decision page with Keep / Reverse / Ask me | Decision logs in markdown | The decision log for this work, presented to Jeremy as a review page |

## Everything else in the app

The letter's rule is that every change is one undo step, everywhere. The rest of the app (My film, workspaces, the storyboard, curated films, automations, tools) does not yet live in the engine's one state; each part keeps its own copy while the page is open. So `app-undo.js` records every change any part saves, and "Undo back to before this" in History puts the old values back and reloads the page, so every part starts again from them. It refuses if something newer has changed the same part (an opened project, another tab), so it can never overwrite newer work. Changes less than 1.5 seconds apart to the same part count as one step.

## What is not done yet

- **The rest of the app on one shared state.** Moving My film, the workspaces and the storyboard onto the engine's state means changing files the "Bring Maya into the app" thread owns, so it is proposed to that thread rather than done here. Until then, the app-wide history covers undo.
- **The storyboard as a host.** The engine reads and sends to My film. Reading the storyboard's scenes as rows (a longer film than 8 panels) is the next host to add.
- **Printing to Maya, Blender and Unreal directly.** They follow My film today; a direct print would let rows past 8 panels reach them.
- **Comics, live-action AI.** Their hosts (a page layout tool, a generation pipeline) are not chosen yet.
- **Analysis of finished films.** Reading a video file needs shot detection, which a browser cannot do quickly; scripts and shot lists come first.

## For developers

- `engine/files.json` lists the files in load order; `engine/load.js` adds them to the app's page and must list the same ones (a test checks).
- Core (no page): `catalog.js` (each curiosity's scale), `state.js` (the state, commands, rewrite, undo, saving), `host.js` (My film as the host), `fake-host.js`, `seeds.js` (starting film and links), `analyze.js`.
- Screens: `app-undo.js`, `selfcheck.js`, `ui.js`, `cube.js`, `engine.css`.
- Saved under `curiosities-engine-v1` (so project files and autosave include it); the open tab under `curiosities-engine-view-v1`.
- Tests: `node apps/curiosities/engine/tests/run.js [--seed N] [--rounds N]` (Node only, a few seconds) and `node apps/curiosities/engine/tests/browser.js [--events N] [--three path/to/three.min.js]` (Playwright and Chromium). `tests/bridge-fuzz.js` feeds the app's bridge bad messages and reports what breaks.
- Messages (`CurioEngine.send`): `setSource`, `clearSource`, `edit` (`off: true` to switch off), `clearEdit`, `addRow`, `removeRow`, `renameRow`, `moveRow`, `addTrack`, `removeTrack`, `renameTrack`, `addCuriosity`, `removeCuriosity`, `setPoint`, `removePoint`, `laneMode`, `clearLane`, `addLink`, `updateLink`, `removeLink`, `toggleLink`, `addRef`, `removeRef`, `carry`, `rename`, `printAuto`, `importFilm`, `batch`.
