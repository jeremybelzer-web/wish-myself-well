# Video: take a clip apart, apply it to another

Bring in two video clips. The first (the inspiration) is taken apart into curiosities: each one becomes a lane across the clip with a node wherever it changes. Put those lanes on My film, or apply them to your clip, one by one or all at once, at the same rate as the inspiration. Then check that the change really happened, play it, and save it.

Open it from **Library, Take a clip apart**, or **Import a video** on the Screen's bar. Clips are read on your own computer; nothing is uploaded or saved.

## What it measures (22 curiosities, and three looks)

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

And three looks of the picture itself (`looks.js`), measured about one and a half times a second:

- **Palette**: where each color's darks, mids and lights sit (red, green and blue, nine points each).
- **Grain and softness**: how much grain is in the flat parts, and how crisp the strongest edges are.
- **Frame shape**: black bars and the picture's shape (wide, tall or square), and how much darker the edges are than the middle (vignette).

## What it applies (one switch and amount each)

Light and dark, contrast, color strength, warm and cool, camera shake (adds the inspiration's wobble and steadies your own), camera moves, how close the shot is (zooms in only), cuts (jump cuts), movement speed (a speed ramp), loudness, dialogue tempo (new lines on your clip's title, timed to the inspiration's sentences), and, off unless turned on, **Lay its graphics over** (the inspiration's picture on top with its pale background taken out).

Three looks, each its own switch and amount:

- **Borrowed palette**: your clip takes on the inspiration's color grade, moment by moment. Each color is remapped so its darks, mids and lights land where the inspiration's are; the brightness moves half way (turn on Light and dark for the rest). Skin keeps most of its own color, so faces don't turn blue or green.
- **Grain and softness**: your clip is softened or sharpened until it is as crisp as the inspiration, then gets the same amount of film grain (none in pure black).
- **Frame shape** (off unless turned on): your clip gets the inspiration's picture shape (black bars for a wide film look, or side bars for a tall phone frame), with the picture kept on your people, and its edges darkened as much as the inspiration's.

Rhythm, three switches, all off unless turned on (`rhythm.js`):

- **Rhythm (beat and accents)**: finds the beat in the inspiration's sound (where the sound suddenly gets louder in any pitch, how far apart those moments repeat, then the beats themselves) and its accents (the hardest hits). Then your clip is cut to it: on every beat a jump cut (a little ahead) and a punch-in (close, then wide, then close, with a small bump), and a quick white flash on the strongest hits. Very fast beats are taken every other one. When the inspiration has no clear beat (talking, a crowd), its cuts are the beat; with no cuts either, its loudest sounds (claps, shouts) are.
- **Hold and burst on the beat**: your clip freezes on each beat, then rushes forward to catch up before the next one.
- **Its music under yours**: the inspiration's sound plays under your clip (yours turned down), in time with its beat, in Play and in a saved video.

Timing: **Same speed as the inspiration** (its curves play in real seconds, repeating) or **Stretch over the whole clip**.

**Check that it worked** draws the changed clip frame by frame, measures it again and shows, per curiosity, how in step your clip is with the inspiration before and after (1.00 = rises and falls together).

## AI cut-outs (elements)

When a clip comes in, a free AI that runs in your browser (Google's MediaPipe, the "selfie multiclass" model) finds the people in every frame and splits them into hair, face, skin and clothes, with the rest as the set. Each element gets its own lanes: how much of the frame the people fill, where they stand, the color of their clothes and hair, the set's color. Then one element can change on its own, following the inspiration:

- **Clothes color** and **Hair color**: only the clothes or hair are recolored to the inspiration's (its most vivid color, so a teal stripe counts more than the average brown), keeping their folds and shadows.
- **Person size and place**: the people are cut out and made as big, and as far left or right, as the inspiration's people. The gap is filled from the background around it (rough; a server AI does this properly).
- **The set (background)**: your people stay, and the background becomes the inspiration's, moving as it moves.
- **Camera angle (high or low)**: a guess at how high the inspiration's camera is (more hair against faces, and people lower in the frame, means seen from above), then your clip is redrawn from a camera moved up or down, by how far away each spot is. A free depth AI in your browser (FastDepth, about 6 MB, loaded the first time) says how far the set is; the cut-out says where the people are, and each person stands where their feet touch the floor. From higher up, near things slide down the frame more than far ones, the picture turns to look down at the people (who stay where they were), and the edges are zoomed off; what a person uncovers is filled softly from the set around it. Without the depth AI (offline) a made-up depth is used: the floor nearer toward the bottom, the walls far, the people in front. Small changes only; a real angle change needs a 3D rebuild (see the project's `video-import/roadmap-to-full-transfer.md`, section 9). Off unless you turn it on.

- **Shot framing**: where the inspiration's main person sits in the frame, moment by moment: their eyes on the left or right third or in the middle, the room above their head, how much of the frame their head fills (closer or wider), and the room left in front of them in the way they face or walk. Then a virtual camera reframes your clip the same way: it zooms in and pans across your picture to follow your own person and put their eyes where the inspiration's are. If your person faces the other way, the framing is mirrored so they still have room in front. It moves like a camera operator: it waits through small wobbles, then eases into each new framing (no jitter, no lag), and jumps only at a cut. It can only zoom in (up to 2.5 times at full amount), so the edges never go black; a person on the left third needs about a 2x zoom to reach the right third. **Dutch tilt too** (a tick under it) also rolls the frame like the inspiration's horizon, measured from its strong straight lines (walls, doors, horizons); when its lines don't agree, no roll is added. Off unless you turn it on.

- **Sharper zooms** (`detail.js`, on unless you untick it): when your clip is zoomed in (a closer shot, the virtual camera, up to 2.5 times), each pixel of a small clip becomes a soft blob and the video's compression tiles show. So the zoomed part is first cleaned at its own size: a flat 8x8 tile becomes a gentle slope into its neighbours (tiles with texture, and real edges, are kept), and small steps at tile edges are softened. Then it is sharpened, more the more it is zoomed: only brightness, not faint grain or noise, less where edges are already hard, and never lighter or darker than the pixels around it, so there are no halos. Then it is drawn up with the browser's smoothest scaling. At no zoom nothing changes. No AI: there was no small, free, clearly licensed super-resolution model in ONNX form to load (UpscalerJS's ESRGAN models are MIT but for TensorFlow.js, and too slow for every frame of a video on a laptop's processor).

- **Key light** (`relight.js`): where the inspiration's main light comes from. On the people's skin (faces count most) it finds which side is brighter (left, right, from above), how much darker the shadow side is (key to fill: 1.2 is flat, 3 is a hard side light), the light's color, and a bright rim on the shadow side's edge when there is one. Then your people are lit again the same way: each spot of them gets a direction it faces (a soft cushion shape blown up from the cut-out, rounder for faces), brightness follows how much it faces the light, the lit side gets brighter and the shadow side darker by the measured contrast, with a little of the light's color (skin keeps its own), a soft rim on the far edges when the inspiration has one, and a gentle matching slope on the set. Your clip's own light is partly taken off first, so a face lit from the left can turn to the right. The change fades in just inside the people's edge, so the set around them never glows. The depth AI is too coarse for faces, so the shape comes from the cut-out. Off unless you turn it on; the check says where the light comes from, before and after.

"Show what it found" tints the AI's cut-out on your clip's frame. "Make a puppet" (shown when Maya's rig, `CurioRig.fromCutout`, is in the app) cuts the people out of the frame showing now and opens them as a rigged flat puppet. The AI loads the first time it is needed (about 16 MB from the web), and you can turn it off. Nothing is uploaded.

**Stronger AI, your own key.** `ai.js` (`window.CurioAI`) gives every curiosity family (cut-outs, picture, depth, motion, face, voice, dialogue, music, generate) one plug-in slot, so any company's AI can do that family's job. The browser AI is the default. SAM 2 on fal.ai is wired in for cut-outs that follow a clicked person or object through a whole clip: paste your own fal.ai key in the window. It is kept in your browser under `curiomatic-ai-keys` (never in a `.curio` project file) and sent only to fal.ai. For a paid app, `CurioAI.setProxy("fal", url)` points at your own server, which holds the key. The fal.ai path has not been run end to end yet (it needs a key). Licenses and costs: the project's `video-import/ai-licenses.md`.

## Files

- `measure.js` (`window.CurioVideo`, no page): frame and sound measures, the dissection, nodes, engine commands, the apply plan, pixel changes, keying, dialogue fitting, scores.
- `clip.js` (`window.CurioClip`): reads frames by seeking and sound by decoding, draws applied frames, the frame-exact steadier, check, real-time render and recording.
- `looks.js` (`window.CurioLooks`, no page except `scan` and `draw`): the palette, grain and softness, and frame shape: measured, applied, checked.
- `rhythm.js` (`window.CurioRhythm`, no page except `draw`): the beat, tempo and accents of a clip's sound (kept as `dissection.rhythm`), and the jump cuts, punch-ins, flashes, holds and music that put it on another clip.
- `relight.js` (`window.CurioRelight`, no page except `scan` and `draw`): the key light: measured on the people's skin (kept as `dissection.light`), and your people shaded again from the inspiration's side.
- `detail.js` (`window.CurioDetail`, no page except `source` and `finish`): sharper zooms. `deblock` smooths the 8x8 compression tiles, `sharpen` is the edge-aware sharpen; `clip.js` draws every zoomed crop through it. `CurioDetail.configure({ on: false })` turns it off (the Sharper zooms tick does the same).
- `ai.js` (`window.CurioAI`): one plug-in slot per curiosity family; your own keys, kept in this browser.
- `mask.js` (`window.CurioMask`): the AI cut-outs (MediaPipe in the browser), each clip's elements over time, and drawing one element's change.
- `framing.js` (`window.CurioFraming`, no page): shot framing. The main person in each cut-out (one joined patch, followed from look to look), their eyes, head size and which way they face; the horizon's roll from straight lines; the virtual camera's crop and its smoothed path.
- `depth.js` (`window.CurioDepth`): how far away each spot is (FastDepth in the browser through onnxruntime-web, or a made-up depth from the cut-out) and the camera-height warp. `CurioDepth.configure({ ort, wasm, model: { url, kind, size } })` points it elsewhere, for example Depth Anything V2 small (`kind: "depth-anything", size: 518`, Apache-2.0), which is stronger. FastDepth: MIT, from the npm package `com.bonjour-lab.monoculardepth`.
- `ui.js` (`window.CurioVideoUI`), `video.css`, `load.js` (one line in `index.html`), `files.json`.
- `CurioVideo.toMedia(dissection, step)` hands a dissection to the media window (`media/media.js`, `CurioMedia`) in its own sample shape, so the app has one analyzer: its beats, highlights and studies can come from these measures.
- Settings: `localStorage` `curiosities-video-v1`.

## Tests

- `node apps/curiosities/video/tests/run.js`: made-up frames and sound, so every answer is known (Node, about a minute).
- `NODE_PATH=/opt/node22/lib/node_modules node apps/curiosities/video/tests/browser.js [--mediapipe DIR]`: the real app in Chromium (with `--mediapipe`, a local copy of `@mediapipe/tasks-vision` plus the selfie multiclass model, the AI cut-out checks run too); the page records its own two clips, then brings them in, puts lanes on My film, checks light follows, saves a video, swaps, and opens from the Screen.

## Limits

- Browsers can't record their own speaking voice: Play speaks the new lines, a saved video keeps them as subtitles.
- Steadying a phone clip full of moving faces only partly works (the faces move with the camera).
- A clip can be zoomed in, never made wider. Face replacement is not done: it needs a server AI and the consent of everyone shown.
- Cut-outs are 320 pixels wide, so edges are soft. People who are far away or blurred by motion are sometimes missed. While a clip plays, each frame's cut-out is steadied against the one before (a cut or a jump starts fresh), specks are dropped and small holes in people are filled, so a new set or color flickers less; `CurioMask.configure({ steady: false })` turns this off.
- Very long or very large files take a while: up to 900 looks at the picture, and the sound is decoded whole.
