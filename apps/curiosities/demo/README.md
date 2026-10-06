# Show me: demonstrations that drive the app

Jeremy, 2026-10-06: show the 3D curiosity map by actually zooming in, sliding along a corridor, stopping in front of
a cube, swivelling round 360, double-clicking into the cube and its Jarvis screens and clicking things there; and do
the same for every window: moving the sliders, the nodes, and bending the lines between nodes.

- **▶ Show me** on every window's title bar plays the window demonstration on that window. The 3D map has one in
  its top bar, and **Help ▾** lists all three.
- A yellow-outlined pointer moves by itself and presses, drags, double-clicks, right-clicks, scrolls and types. A
  caption says what is happening in plain words. **■ Stop** (or Esc) ends it at once.
- Everything is a real event sent to whatever is under the pointer, so the app answers exactly as it does for a
  person. Changes are real too: ⌘Z (Ctrl+Z) undoes them.

| Demonstration | What it does |
| --- | --- |
| `map` | Opens the map, turns the whole block 360°, zooms in, walks a corridor and slides along it, clicks a cube (its ties light up), swivels a full circle where it stands, double-clicks into the cube, opens the Jarvis screens one by one (Connected to this, Connected to those, Lanes, Pie, 3D graph, All curiosities with a filter), flies into another cube by its name and leaves. Needs `relations/` (PR #143). |
| `window` | Any window: its live picture, then its choices, a knob, two sliders, a preset and Shape over my film; closes it and goes on to the lanes. |
| `lanes` | Makes the lanes taller (Alt + scroll), adds nodes, drags a node, clicks a line to add a node, drags a line, Alt-drags a line into a curve, right-click ▸ Curves… (Smooth, more bend, Apply), double-clicks a node away. |

Files: `player.js` (`window.CurioDemo`: the pointer, caption and steps; `CurioDemo.add(id, { label, about, run })`
registers a new demonstration), `tours.js` (the three above and the Show me buttons).

Clips: `node demo/tools/record.js --out <dir> [--three three.min.js] [--win <curiosity id>,...]` records each one
as .webm (and .mp4 with ffmpeg). Test: `node demo/tests/browser.js [--three three.min.js]` (in run-all `--browser`).
