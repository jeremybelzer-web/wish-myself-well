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
  two ends, and three hand-made ones (below): a color wheel, a curve over the film and a floor plan from above.
- **Groups.** Its settings under two to four headings, like Final Cut Pro's and CapCut's inspectors.
- **Presets.** Two to four one-click looks, named after a kind of film moment ("Hitchcock suspense hold").
  A preset sets several settings at the playhead as one undo step.

Every window also has, from `screen/windows.js`:

- **Shape over my film**: pick a setting and draw a whole movement across every moment of the film (or the
  play range): Rise, Fall, Swell, Pulse, Back and forth, Surprise. One undo step. It is an LFO drawn onto the lane.
- **Surprise me**: every setting of its own picks something at random at the playhead.

- **Say what you want** (Jeremy, 15:02Z): type or speak a request ("45 degrees to the right, 3 meters away", "a bit closer", a preset's name, a word from a list). It is matched on the device against the settings, presets, numbers with units and "more" or "less" of a setting, and lands as nodes at the playhead, one undo step.
- **Plain-words phrases** (`say-<category>.js`, `W.say(id, {"phrase": {sliderId: value}})`): 3,778 phrases a person might actually say about each curiosity (set talk like "punch in", beginner words like "make it scarier", feeling words like "make them look powerful"). One phrase can set several settings; phrases are matched first, longest first. `check-windows.js --say` checks them and lists curiosities with fewer than 3.
- **How Say what you want reads a request** (`interpret` in `screen/windows.js`): it tidies the text first (contractions, "pls", "its to dark", decades like "the 80s", and typos fixed toward words the app knows: "brigher", "sader", "captons"), then reads each part ("darker, and from the side" is two parts) in this order: a preset's name, a written phrase, "no X" / "turn off X", words on a list (also a beginner's word for one: "sunset" is dusk, "tux" is formal, "a little shake" is "subtle shake"), numbers with units ("half a second", "3 in the afternoon", "2x", "4 copies", "a meter and a half"), then more or less of something ("brighter", "too loud", "not so close", "tone it down", "stronger wind", "dress him down"), and last a feeling or genre word ("spooky", "like a thriller"). The beginner's words are in `CONCEPTS` (a word, the words that mean it, and its opposites), `SAYS` (words for a word on a list), `VERBS` and `PHRASAL` near the top of that part of the file: add there when a common word is not understood. Words a person might say about one curiosity only belong in `say-<category>.js`.
- **The Say what you want test** (`say-eval.json`, run by `say-eval.js`): 704 requests a beginner might type (vague words, feelings, comparisons, numbers with units, two requests in one sentence, typos, "a bit more", "not so", genre words), spread over all 17 categories and 272 curiosities, each with what it should do. `node apps/curiosities/data/windows/say-eval.js [category] [--fail] [--min 90]` prints the score per category; `--fail` lists every miss with what it set and where that setting started. It runs in `tests/run-all.js` with `--min 90`. Every setting starts where a new window puts it (or the middle of its scale or range when that is an end), and a request can give other starting values (`"with"`), so "up" and "down" mean something. Its source lines read `id | request | expect @ slider=start`.
- **🎹 MIDI learn** on every setting: click it, then move a knob or hit a pad. A knob writes a node at the playhead when it settles; a pad steps to the next value. Saved as `curiosities-window-midi-v1`.
- **Live picture** (Jeremy, 17:44Z: "see the results on the screen"): every window opens with a picture of its curiosity (`look-<category>.js`, drawn with `look-kit.js`), pinned at the top, redrawn while any slider, knob, dot grid or orbit moves. `CuriosityWindows.look(id, (v, k) => svg)`. `check-windows.js --look` draws each own setting at its lowest and highest and fails if the picture does not change, or if a path is broken. `check-windows.js --fit` draws every picture (at its start, all own settings lowest, middle and highest, and two mixes) in a headless browser and lists words that run off the frame or sit on top of other words (the same words over themselves, such as a shadow or a ghost copy, are left out); it only warns, never fails, and takes about 5 s for all categories (needs Playwright). Words that must fit a space use `k.fitText({x, y, text, size, w, min, ...})` from `look-kit.js`: it shrinks the words to fit `w` pixels, down to `min` (6 by default), and cuts with "…" only as a last resort.
- Lists with no order are tappable chips in a window (the Details panel keeps its menu).
- **Shape over my film** takes "How many times" and "How much" (how far it swings from the middle).
- **Fine-tune** (Jeremy, 15:02Z: "All these parameters can be hidden under the word fine-tune"): in Details, each curiosity shows its main control and a Fine-tune button that opens this window; the inline fold is off.

Counts after both passes: 434 curiosities, 2,590 new settings (1,794 of them measured in units), 1,303 presets.

- **Hand-made faces** (wheel, curve, stage): where a knob or pad fit the subject poorly, three controls made for it.
  - **Wheel** (`{ face: "wheel", hue, strength, colors? }`): a color wheel with one dot. Around the wheel is the color
    (a word on the setting's list, placed by its `colors`, or degrees); out from the middle is how strong. The middle
    is no color (a "neutral", "white" or "none" word when the list has one). Used by Filter color, One color that
    pops, Dominant color, Black and white to full color, Light in skin, Color wheels and Superpower effect.
  - **Curve** (`{ face: "curve", slider, points? }`): 3 to 5 points over my film (or the play range). Drag them up or
    down; letting go writes a node on every moment, one undo step (the same writer as Shape over my film). Faint dots
    show the lane as it is; a dashed line marks the playhead. Used by Tension, Energy, Stakes, Strength of the
    feeling, both emotional roads (character and film), Arc stage and Escalation.
  - **Stage** (`{ face: "stage", walk?, tokens }`): the floor from above with one or two people and the camera. A
    token with `about` (an earlier token's index) is dragged around it: `around` in degrees (0 = in front, toward
    the bottom; 90 = its right) or an ordered scale, and `distance` nearer or farther. Used by Where they stand,
    Personal space, Who moves, Walk and talk, Touch and Move follows.
  - Each works with the mouse, a finger (pointer events) and the arrow keys (wheel: left/right turn the color,
    up/down the strength; curve: left/right pick a point, up/down move it; stage: left/right around, up/down
    farther or nearer), each is a labeled `role="slider"`, redraws the live picture while it moves, and shows the
    ◇ key and 🎹 MIDI learn buttons for every setting it moves.
  - **Fallback**: a hand-made face may name a `fallback` face (the swatches, dial, ladder or orbit it replaced).
    When a setting it needs is missing, or my film has only one moment (curve), the fallback is drawn instead, or
    else a plain control for its first setting.
  - A later add's pad, orbit or dial whose settings a wheel or stage already moves is left out and becomes that
    face's fallback, so the look files' generic pads (filterHue, walkAndTalk) and the measure files' orbits (Who
    moves, Walk and talk, Touch, Move follows) do not repeat it. `W.check` checks every new face and fallback.

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
| `say-eval.json`, `say-eval.js` | The Say what you want test: 704 requests and what each should do, and its runner (score per category, `--fail` for the misses, `--min N` to fail under N%) |
| `check-windows.js` | `node apps/curiosities/data/windows/check-windows.js [category] [--measure] [--say] [--look] [--fit] [--gaps] [--strict]` checks every slider, face, group and preset, and lists curiosities with no window or fewer than four settings of their own. `--fit` warns about words off the live picture's frame or overlapping (never fails) |

`screen/windows.js` (`window.CurioWindowFaces`) draws the faces, presets and shapes inside the window
`screen/ui.js` opens. Browser test: `screen/tests/windows-browser.js` opens all of them.

New settings are added to the database rows when the page loads, with stable ids (`shotSize.lookRoom`).
They are not in `data/files.json` or `curiosity-db.json` yet: the database thread can fold this folder in.
