# The Screen

Curiomatic's main layout, modeled on Final Cut Pro (Jeremy, 2026-10-02, 17:18Z to 17:24Z).

- **Viewers on top.** One viewer per inspiration film (a curated film, played as a cheap animated storyboard) and one viewer for your own film. It starts with one inspiration film; **+ Inspiration film** adds as many as you like, and × removes one. The **1 / 2 / 3** buttons are quick layouts: your film alone, one inspiration film and yours, or two and yours. Each category in the inspector also suggests a layout (Use 3 windows for Light & color, Use 1 window for Story & character). **Side by side** or **Stacked**.
- **The inspector on the right**, like Final Cut Pro's. It shows the viewer you picked (click a viewer, or its Inspect button), grouped into twelve major filmmaking categories: Camera, Performance, Light & color, Set & background, Wardrobe, Music & sound, Feeling, Comedy, Effects, Story & character, Editing & structure, Page & panel. Each category shows its main curiosities first (the ones that push the story hardest), and **Show all** opens the rest. Each curiosity has its main control and a fold (▸ 6) with its fine controls: toggles, lists, stepped sliders, knobs, and a small chart of how it moves through the film.
  - On **your film**, every control writes a node at the playhead.
  - On an **inspiration film**, tick **Take into my film** on any curiosity and set an amount. Take the same curiosity from several films, or different ones from each, then **Blend**: each film pulls your film toward it by its amount (two films at 50% meet halfway). One undo step.
- **Looking through** (the bar): pick a curiosity, a suite, a proximity or a proximity suite. Every viewer lights up what it is about (**Highlight**), writes its values on the picture (**Overlay**), draws only it (**Lens only**), or shows the plain picture (**Off**). Yellow dots on each scrub bar mark where it happens in that film.
- **The timeline** under the viewers: film clip tracks on top (each inspiration film's beats, then your film's moments), then curiosity lanes running left to right, with nodes joined by lines.
  - Click an empty spot to add a node. Drag a node up or down to change it, sideways to move it. Hold Alt or Shift while dragging to copy. Double-click a node to remove it.
  - **Drop a node on a node in another lane** to join them: a proximity, drawn as an orange line. Joined nodes move and copy together; a group of several joins is a proximity suite.
  - **Copy proximity** takes the picked node and everything joined to it; move the playhead and **Paste** puts it in another scene.
- **Arrange** (the bar, or Library, Arrange): the timeline on its own, the viewers hidden unless you tick Show viewers. Every automated curiosity is a track with a dropdown to change which curiosity it is (its nodes keep their place on the new scale). **Show all potential curiosities** and **Show all potential curiosity suites** list everything by category; pick a category or a suite to lay its tracks out.

Play, step and scrub: Space plays, the arrow keys step, Ctrl+Z undoes, Ctrl+Shift+Z redoes.

## How it is built

- Nothing new is saved for your film: lanes, nodes and joins are the engine's (`engine/state.js`) automation points and links, so undo, saving and the fingerprint check cover them. A join is a link with `scope: { from, to }` naming its two moments, `from.is` the first node's value, `does: "set"` the second's, and `within` the gap.
- The Screen's own view (which films, layout, open categories, takes) is `localStorage` key `curiosities-screen-v1`; the proximity clipboard is `curiosities-screen-clip-v1`.
- `levels.js` (no page): the categories and the four levels (`window.CurioLevels`). `frame.js` (no page): the storyboard frame as SVG (`window.CurioFrame`). `lanes.js`: lanes, nodes, joins, copy and paste (`window.CurioLanes`). `ui.js`: the page (`window.CurioScreen`).
- `CurioScreen.mountViewer(el, { curiosities, category, film })` puts a small viewer on any other screen, so every screen of the app can have one (Jeremy: "a view window for every single screen of the app").

## Adding it to the app

One line in `index.html`, after `engine/load.js`:

```html
<script src="screen/load.js"></script>
```

It opens on start; `?screen=0` skips it (so do automated browser tests, unless the address has `?screen=1`), and Back to the app closes it (it then stays closed until you open it again).

## Tests

- `node apps/curiosities/screen/tests/run.js`: the core in Node (levels, categories, frame, joins, move, copy and paste, undo).
- `NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/screen/tests/browser.js [--shots dir]`: the Screen inside the real app in Chromium, adding the `index.html` line on the fly.
