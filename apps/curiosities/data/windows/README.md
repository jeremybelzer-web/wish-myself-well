# A window for every curiosity

Jeremy, 2026-10-03 14:59Z: "What would help you create individual automation windows for each curiosity? by
defining the parameters that are automatable for each one."

Every curiosity on the Screen opens its own floating window (⧉ on a lane or in Details). This folder says what
goes in each one:

- **Its own settings.** Each curiosity gets the settings a director, actor, editor, colorist, sound mixer or
  comedy writer would really turn for that one thing, so every curiosity has at least four of its own (on top of
  the shared ones every row has: how hard it pushes the story, whether it points ahead, its tie to a theme, and
  Amount). Every setting is graded (a word scale in order, or a number range), so every one can be automated: a
  lane on the timeline, a knob, an LFO, a MIDI control.
- **Faces.** One to three visual controls at the top of the window, picked to fit the curiosity: tiles with
  pictures, a big dial, a pad you drag across (two settings at once), color swatches, a person in the frame, a
  direction compass, a mixer of upright faders, a ladder of rungs for something that builds, a see-saw between
  two ends.
- **Groups.** Its settings under two to four headings, like Final Cut Pro's and CapCut's inspectors.
- **Presets.** Two to four one-click looks, named after a kind of film moment ("Hitchcock suspense hold").
  A preset sets several settings at the playhead as one undo step.

Every window also has, from `screen/windows.js`:

- **Shape over my film**: pick a setting and draw a whole movement across every moment of the film (or the
  play range): Rise, Fall, Swell, Pulse, Back and forth, Surprise. One undo step. It is an LFO drawn onto the lane.
- **Surprise me**: every setting of its own picks something at random at the playhead.

- **Say what you want** (Jeremy, 15:02Z): type or speak a request ("45 degrees to the right, 3 meters away", "a bit closer", a preset's name, a word from a list). It is matched on the device against the settings, presets, numbers with units and "more" or "less" of a setting, and lands as nodes at the playhead, one undo step.
- **Plain-words phrases** (`say-<category>.js`, `W.say(id, {"phrase": {sliderId: value}})`): 3,778 phrases a person might actually say about each curiosity (set talk like "punch in", beginner words like "make it scarier", feeling words like "make them look powerful"). One phrase can set several settings; phrases are matched first, longest first. `check-windows.js --say` checks them and lists curiosities with fewer than 3.
- **🎹 MIDI learn** on every setting: click it, then move a knob or hit a pad. A knob writes a node at the playhead when it settles; a pad steps to the next value. Saved as `curiosities-window-midi-v1`.
- **Shape over my film** takes "How many times" and "How much" (how far it swings from the middle).
- **Fine-tune** (Jeremy, 15:02Z: "All these parameters can be hidden under the word fine-tune"): in Details, each curiosity shows its main control and a Fine-tune button that opens this window; the inline fold is off.

Counts after both passes: 434 curiosities, 2,590 new settings (1,794 of them measured in units), 1,303 presets.

The hand-made parts some windows already had (Emotion's feeling pad, Shot size's frames, Angle height, Camera
move, Color, Comedy's joke timing) stay, above the faces.

## Files

| File | What is in it |
| --- | --- |
| `windows.js` | `CuriosityWindows.add(id, { sliders, window })` and `check()`. The format is in its top comment |
| `win-<category>.js` | One per Screen category (camera, performance, light, grade, world, wardrobe, sound, text, effects, transitions, speed, editing, feeling, comedy, character, story, page): every curiosity whose home is that category |
| `win-space.js` | Camera angle, Main light and Where a sound comes from, in 3D around the subject (meters and degrees), with the orbit face. Jeremy, 15:01Z: a camera angle "has a three-dimensional relationship to that scene or subject" |
| `measure-<category>.js` | The second pass (Jeremy, 15:01Z): each curiosity broken into its measurable parts: meters, degrees, % of frame, seconds, counts, and what it is measured against. Added with a second `CuriosityWindows.add`, which merges into the window (faces and presets appended, groups joined by label) |
| `files.json` | Load order. `index.html` loads them right after `data/db-maya.js`, before `CuriosityDB.install` |
| `check-windows.js` | `node apps/curiosities/data/windows/check-windows.js [category] [--gaps] [--strict]` checks every slider, face, group and preset, and lists curiosities with no window or fewer than four settings of their own |

`screen/windows.js` (`window.CurioWindowFaces`) draws the faces, presets and shapes inside the window
`screen/ui.js` opens. Browser test: `screen/tests/windows-browser.js` opens all of them.

New settings are added to the database rows when the page loads, with stable ids (`shotSize.lookRoom`).
They are not in `data/files.json` or `curiosity-db.json` yet: the database thread can fold this folder in.
