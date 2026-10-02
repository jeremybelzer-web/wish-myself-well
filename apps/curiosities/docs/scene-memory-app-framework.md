# Scene Memory App Framework

October 2, 2026. Live, editable version: https://claude.ai/code/artifact/061f85c4-58c3-4c91-a74a-ea0365ff8719

## The idea

The app gives anyone the scene memory Tarantino has. You save a favorite scene as a list of curiosity lines, beat by beat, and later pull any one line into your own scene.

Tarantino borrows one slice at a time: a camera angle from one film, a barn on the left and a sign on the right from another, the tone of an actor's line from a third. Each of those slices is a curiosity. The app's job is to make that memory searchable and reusable, and to keep the borrowing to slices so nobody's scene is copied whole.

`filmmaking-curiosities-catalog.md` holds the full list. This doc covers how the app uses it.

## Three users

The same library and the same views serve all three. What changes is what they do with a curiosity line.

| User | What they do | Main screen | Example |
| --- | --- | --- | --- |
| Student | Watches a scene through one view at a time and learns why it works | Study | Views the diner scene through cutRate, then timePerCharacter, and sees the cuts speed up as the threat grows |
| Performer | Switches curiosities and suites live while a storyboard, animation or film plays | Stage | Bends a wrist strap to slide moveTemper from loving to aggressive during a live render |
| Filmmaker | Borrows lines from curated scenes and develops them in their own project | Board | Takes the angle-by-emotion line from one film and the vocal-tone line from another, then applies devAugment to slow both |

## Referencing a scene

A reference moves through six steps, from a favorite scene to a developed version of our own.

1. **Save the scene.** Name the work, the scene and a timecode range of 30 seconds or less. The app stores ids and counts only, never the footage or the script.
2. **Trace it.** For each beat, mark the value of every curiosity you care about. Start with the Tarantino set below; add more later.
3. **Look through one view.** Pick a curiosity and the app shows only that line, such as camera angle beat by beat. Switch tabs to see a suite or a proximity.
4. **Find it again.** Search the library by any line: "scenes where the camera goes low as anger rises" or "scenes with a barn on the left."
5. **Apply it.** Drag one line onto a scene in our project. Only that curiosity changes; everything else stays ours.
6. **Develop it.** Run a development move (augment, invert, fragment) on the borrowed line, or apply "A is to B as C is to D" from how the source film changed it later.

### The Tarantino set

These eight curiosities cover Jeremy's brief. Six are new to the catalog.

| Id | Curiosity | View | Values | New |
| --- | --- | --- | --- | --- |
| angleHeight with lensLength | Camera angle | Angle and lens per beat | eye, low, high, overhead, floor; mm | no |
| sceneShapes | Shapes in the scene | A simple map of big shapes by frame position | shape + left, center, right, near, far | yes |
| vocalTone | Tone of the line | What the voice does through the line | flat, rising, falling, breaking, whispered, shouted | yes |
| toneArc | Where the tone sits in the story | Vocal tone placed on the film's timeline, early, midpoint or climax | act and minute | yes |
| cutRate | Rate of switching cameras | Cuts per minute | cuts per minute | no |
| timePerCharacter | Time on each character | Share of screen time per person, as stacked bars | percent per person | yes |
| actionCutRate | Cut rate in action | Cuts per minute counted only during action beats | cuts per minute | yes |
| emotion | Emotion of the beat | The emotion label that drives the emotion map below | see emotion map | yes |

## Emotion map

Each emotion gets a default camera setting, which a curated film can confirm or break. These defaults are common film grammar, not counts yet; once we trace curated scenes, each row becomes a measured average per film.

| Emotion | Angle and size | Move | Cut rate | Lens and light |
| --- | --- | --- | --- | --- |
| Intimate, loving | Eye level, close | Slow push in, smooth | Slow, holds long | Long lens, soft warm key |
| Joyful | Eye level, medium to wide | Track or crane, smooth | Medium | Bright, high key |
| Curious | Slightly high, medium | Slow drift, follows the look | Medium, cuts on the look | Neutral |
| Melancholy | High, wide, figure small | Locked or slow pull out | Slow | Cool, low contrast |
| Anxious | Off-level, tight, empty space behind | Handheld, small | Rising | Wide lens close, hard light |
| Fearful | Low or very high, things hidden at frame edge | Creeping push or locked | Slow, then a burst | Low key, deep shadow |
| Angry | Low, close | Handheld or sharp push | Fast | Wide lens, hard contrast |
| Triumphant | Low, wide | Crane up, orbit | Fast into a long hold | Back light, rim |
| Absurd, comic | Flat eye level, centered, symmetrical | Locked, whip pans | Timed to the joke | Even, saturated |
| Dreamlike | Unusual height, slow dutch | Floating, slow | Slow, dissolves | Soft, haze, odd color |

The proximity that matters most here: when emotion changes, angleHeight and moveTemper change within 1 beat. Counting how often a film breaks that rule shows its style.

## Genre suites

A genre is a suite: the curiosities that tend to be on together, plus the proximities that keep firing. The rows below are starting guesses; tracing 5 to 10 curated scenes per genre turns them into counts.

### Surrealist against romantic comedy

| Curiosity | Surrealist | Romantic comedy |
| --- | --- | --- |
| psychOut | Shifts of place or logic that do not snap back | Rare; misunderstandings snap back within the scene |
| transition | Match cuts on shape, dream dissolves | Hard cuts, montage for time passing |
| sceneShapes | Objects out of scale or out of place | Ordinary rooms, cafes, streets |
| emotion | Dreamlike, anxious, absurd | Joyful, curious, intimate |
| speedRamp | Slow motion and reversals | Normal speed |
| angleHeight | Unusual heights, dutch | Eye level |
| colorTemp and palette | Saturated or strange color | Warm, bright, high key |
| vocalTone | Flat delivery of strange lines | Rising, playful, overlapping |
| timePerCharacter | Often one dreamer | Split close to evenly between two leads |
| proximity that keeps firing | When a mundane object appears, the logic shifts within 2 beats | When the leads part, a meet-again scene follows within 1 scene |

### Other genres

| Genre | Core suite |
| --- | --- |
| Crime, Tarantino style | Long dialogue holds, sudden actionCutRate spike, low trunk-style angles, music featured, reveal after the audience expects it |
| Horror | Fearful emotion map, emptySpace high, silence long, then a burst cut |
| Action | actionCutRate high, cameraShake, impacts, energyArc builds and drops |
| Western | Wide sceneShapes horizon, extreme close eyes, long silence before a fast cut |
| Musical | Moves on the music, cut on the beat, crane and track, saturated |
| Documentary | Handheld, natural light, operatorFeel high, interview angles |

## Live control

Every curiosity becomes a MIDI target, so a body, a keyboard or a pad can play the film. Continuous joints drive scales; taps and keys switch choices and suites.

| Input | MIDI | Best for | Default mapping |
| --- | --- | --- | --- |
| Wrist to hand strap | CC, 0 to 127 | A 1 to 5 scale | moveTemper, loving to aggressive |
| Forearm to bicep strap | CC | Speed | moveSpeed and cutRate together |
| Neck to shoulder strap | CC | Angle | angleHeight, low to high, and dutch on tilt |
| Calf to thigh strap | CC | Energy | energyArc, which pulls density and musicCue with it |
| Foot to ankle strap | CC, or a note when flexed past a threshold | Triggers | Cut now, or fire the next suite |
| Keyboard keys | Note on and off | Choices | Each key is one emotion, which loads that row of the emotion map |
| Keyboard knobs and mod wheel | CC | Fine control | colorTemp, contrast, depthOfField |
| Button pad, 4 by 4 | Notes | Suites and references | Each pad recalls a saved scene line or a genre suite |

Three rules keep a live render musical rather than random: a switch lands on the next beat, not mid-beat; a proximity can be armed so one move triggers its follower; and every performance is recorded as curiosity lines, so a good take becomes a reusable reference.

## What we borrow from Maya

Maya already has a working shape for curiosities, suites and proximities, and the app can copy it. Each Maya tool below maps to one part of our model.

| Maya tool | What it does in Maya | Our version |
| --- | --- | --- |
| Graph Editor | Shows one attribute as a curve over time, editable by keys | A curiosity view: one line, beat by beat |
| Time Editor clips | Saves animation as clips you can move, blend and reuse on other characters | A saved reference line you drag onto another scene |
| Character sets and attribute groups | Groups attributes so they are keyed together | A suite |
| Set Driven Keys and expressions | When attribute X moves, attribute Y follows | A proximity |
| Camera Sequencer | Lays shots from several cameras on one timeline | The cut and shot views, and automated cutting |
| Animation layers | Stacks changes over a base take without destroying it | A development move applied over a borrowed line |
| Device MIDI input (via plug-ins) | Drives attributes from hardware | The live control table above |

The last row is the least certain: Maya's MIDI input has historically come from plug-ins and scripting, not a built-in panel. Sharani can say what her teams used.

## The simple first version

The first version needs four screens and builds on the board already in apps/curiosities. It is the Study view the app's handoff file already names as the next step, plus a library, a stage and a board.

| Screen | What it does | Built from |
| --- | --- | --- |
| Library | Lists curated scenes with their saved lines; search by any curiosity, suite or genre | New |
| Study | Plays a scene's trace through one view, with Curiosity, Suite and Proximity tabs | The planned Study view |
| Board | Our own scene as a comic strip; drag a borrowed line onto it, then apply a development move | The existing board |
| Stage | Full-screen render of the board, with MIDI learn on every curiosity | New |

Build order: Study first, since it creates the data everything else needs; then Library; then dragging a line onto the Board; then Stage with MIDI last.
