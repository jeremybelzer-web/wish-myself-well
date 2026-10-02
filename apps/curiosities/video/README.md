# Video: take a clip apart, apply it to another

Bring in two video clips. The first (the inspiration) is taken apart into curiosities: each one becomes a lane across the clip with a node wherever it changes. Put those lanes on My film, or apply them to your clip, one by one or all at once, at the same rate as the inspiration. Then check that the change really happened, play it, and save it.

Open it from **Library, Take a clip apart**, or **Import a video** on the Screen's bar. Clips are read on your own computer; nothing is uploaded or saved.

## What it measures (22 curiosities)

| Group | Curiosities | How |
| --- | --- | --- |
| Light and color | valueKey, setBrightness, contrast, saturation, colorRange, colorCount, warmCool, colorTemp | measured from the pixels |
| | lightingLens | a guess from brightness, contrast and warmth |
| Camera | cameraShake, cameraCarry, cameraMove, moveSpeed | measured from how the whole picture slides and grows |
| | shotSize | a guess from how much of the frame skin fills |
| Cutting | cutRate | measured (a cut is one jump between two steadier frames whose shapes don't match) |
| People and sound | movementAmount, volume | measured |
| | wordsAmount, pace, emoVoice | guesses from loud stretches and the bumps of syllables |
| Feeling | emotionIntensity, emotion | guesses from all the others |

## What it applies (one switch and amount each)

Light and dark, contrast, color strength, warm and cool, camera shake (adds the inspiration's wobble and steadies your own), camera moves, how close the shot is (zooms in only), cuts (jump cuts), movement speed (a speed ramp), loudness, dialogue tempo (new lines on your clip's title, timed to the inspiration's sentences), and, off unless turned on, **Lay its graphics over** (the inspiration's picture on top with its pale background taken out).

Timing: **Same speed as the inspiration** (its curves play in real seconds, repeating) or **Stretch over the whole clip**.

**Check that it worked** draws the changed clip frame by frame, measures it again and shows, per curiosity, how in step your clip is with the inspiration before and after (1.00 = rises and falls together).

## Files

- `measure.js` (`window.CurioVideo`, no page): frame and sound measures, the dissection, nodes, engine commands, the apply plan, pixel changes, keying, dialogue fitting, scores.
- `clip.js` (`window.CurioClip`): reads frames by seeking and sound by decoding, draws applied frames, the frame-exact steadier, check, real-time render and recording.
- `ui.js` (`window.CurioVideoUI`), `video.css`, `load.js` (one line in `index.html`), `files.json`.
- Settings: `localStorage` `curiosities-video-v1`.

## Tests

- `node apps/curiosities/video/tests/run.js`: made-up frames and sound, so every answer is known (Node, about a minute).
- `NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/video/tests/browser.js`: the real app in Chromium; the page records its own two clips, then brings them in, puts lanes on My film, checks light follows, saves a video, swaps, and opens from the Screen.

## Limits

- Browsers can't record their own speaking voice: Play speaks the new lines, a saved video keeps them as subtitles.
- Steadying a phone clip full of moving faces only partly works (the faces move with the camera).
- A clip can be zoomed in, never made wider. Moving a person's face onto other people is not done.
- Very long or very large files take a while: up to 900 looks at the picture, and the sound is decoded whole.
