# The Screen

Curiomatic's main layout. It was first modeled on Final Cut Pro (Jeremy, 2026-10-02, 17:18Z to 17:24Z). Now it is laid out and colored like **CapCut** (18:00Z: "I'm leaning towards mainly using CapCut... I think their user interface is great"). It is dark, with four panels:

- **The library, top left** (CapCut's Media panel). The sixteen categories are a row of icon tabs: Camera, Performance, Light & color, Filters, Set, Wardrobe, Audio, Text, Effects, Transitions, Speed, Editing, Feeling, Comedy, Story, Page. A sidebar of pills holds the category's groups: its workspaces, then its suites, proximities and proximity suites. The cards are in a grid. Click a card to look through it. Its cyan **+** puts it on the timeline: a curiosity becomes a track, a suite puts all its curiosities on, and a proximity is added to your film. **Search every curiosity** looks across all categories.
- **The Player, in the center.** One viewer for each inspiration film (a curated film, played as a cheap animated storyboard) and one for your own film. It starts with one inspiration film; **+ Inspiration film** adds as many as you like, and × removes one. Under the viewers sit the timecode (one moment is one second), Play, the speed, and the window layouts: **1 / 2 / 3** (your film alone, one inspiration film and yours, or two and yours), plus **Side by side** or **Stacked**. The lens buttons (Highlight, Overlay, Lens only, Off) are in the Player's header.
- **Details, on the right** (CapCut's Details panel). It shows the category picked in the icon row for the viewer you picked (click a viewer, or its Inspect button). Main curiosities come first (the ones that push the story hardest), and **Show all** opens the rest. Each curiosity has its main control and a fold (▸ 6) with its fine controls: toggles, lists, stepped sliders, knobs, and a small chart of how it moves through the film. Each category also suggests a layout (Use 3 windows for Light & color).
  - On **your film**, every control writes a node at the playhead.
  - On an **inspiration film**, tick **Take into my film** on any curiosity and set an amount. Take the same curiosity from several films, or different ones from each, then **Blend**. Each film pulls your film toward it by its amount, so two films at 50% meet halfway. A blend is one undo step.
- **Looking through** (the bar): pick a curiosity, a suite, a proximity or a proximity suite. Every viewer lights up what it is about (**Highlight**), writes its values on the picture (**Overlay**), draws only it (**Lens only**), or shows the plain picture (**Off**). Yellow dots on each scrub bar mark where it happens in that film.
- **The timeline**, full width along the bottom: film clip tracks on top (each inspiration film's beats, then your film's moments), then curiosity lanes running left to right, with nodes joined by lines.
  - Click an empty spot to add a node. Drag a node up or down to change it, sideways to move it. Hold Alt or Shift while dragging to copy. Double-click a node to remove it.
  - **Drop a node on a node in another lane** to join them: a proximity, drawn as an orange line. Joined nodes move and copy together; a group of several joins is a proximity suite.
  - **Copy proximity** takes the picked node and everything joined to it; move the playhead and **Paste** puts it in another scene.
- **Arrange** (the bar, or Library, Arrange): the timeline on its own beside Details, the library and Player hidden unless you tick Show the player. Every automated curiosity is a track with a dropdown to change which curiosity it is (its nodes keep their place on the new scale). **Show all potential curiosities** and **Show all potential curiosity suites** list everything by category; pick a category or a suite to lay its tracks out.

Play, step and scrub: Space plays, the arrow keys step, Ctrl+Z undoes, Ctrl+Shift+Z redoes.

## How it is built

- Nothing new is saved for your film: lanes, nodes and joins are the engine's (`engine/state.js`) automation points and links, so undo, saving and the fingerprint check cover them. A join is a link with `scope: { from, to }` naming its two moments, `from.is` the first node's value, `does: "set"` the second's, and `within` the gap.
- The Screen's own view (which films, layout, open categories, takes) is `localStorage` key `curiosities-screen-v1`; the proximity clipboard is `curiosities-screen-clip-v1`.
- `edit-curiosities.js` (no page): 34 editing curiosities, 8 suites, 14 proximities and 3 proximity suites taken from the Final Cut Pro User Guide and CapCut. They cover transitions, filters and adjustments, text and captions, speed and timing, the audio mix, layers and masks, and the frame. They use the curiosity database's own format and are proposed for `data/`. Until then, `index.html` loads the file right after `data/db-momentum.js` (before `CuriosityDB.install`), and `load.js` lists it too for pages without that line.
- `levels.js` (no page): the categories and the four levels (`window.CurioLevels`). `frame.js` (no page): the storyboard frame as SVG (`window.CurioFrame`). `lanes.js`: lanes, nodes, joins, copy and paste (`window.CurioLanes`). `ui.js`: the page (`window.CurioScreen`).
- `CurioScreen.mountViewer(el, { curiosities, category, film })` puts a small viewer on any other screen, so every screen of the app can have one (Jeremy: "a view window for every single screen of the app").

## Adding it to the app

Two lines in `index.html`: `screen/load.js` after `engine/load.js`, and the editing curiosities after `data/db-momentum.js`:

```html
<script src="screen/edit-curiosities.js"></script>
<script src="screen/load.js"></script>
```

It opens on start; `?screen=0` skips it (so do automated browser tests, unless the address has `?screen=1`), and Back to the app closes it (it then stays closed until you open it again).

## Tests

- `node apps/curiosities/screen/tests/run.js`: the core in Node (levels, categories, the editing curiosities, frame, joins, move, copy and paste, undo).
- `NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/screen/tests/browser.js [--shots dir]`: the Screen inside the real app in Chromium, adding the `index.html` line on the fly.
