# Filmmaking Curiosities Catalog

October 2, 2026. Live, editable version: https://claude.ai/code/artifact/71eabd18-914d-4c56-9f6c-b2203e76a685

## How to read this

Every curiosity below is a view: pick it, and the app shows a film, show or comic through that one aspect only, as a single line of values beat by beat. The same line can be tracked, compared with another work, edited, automated, and applied to our own project.

- **Curiosity**: one measurable value per beat. The **View** column says what the app draws when you look through it. **Values** are what gets stored, as counts and ids only.
- **Suite**: a named group of curiosities that change together. Viewed as a suite, the app overlays their lines.
- **Proximity**: when curiosity or suite X happens, Y follows within N beats. Viewed as a proximity, the app marks every X and shows where Y landed, so we can count how often and how fast it follows.
- **Source** says where a row came from: *board* (already in the app), *chat* (named in this project), *music* (borrowed from the music app), *Maya* (from the Maya and Arnold manuals), or *new*.

A row qualifies when it passes Jeremy's test: it can be extracted from a work, applied to ours, expanded, and automated.

## Curiosities

The catalog holds 157 curiosities in 15 groups. Ids match the app's `catalog.js` where a row already exists.

### Camera: the frame

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| shotSize | Shot size | A strip of frame sizes, one per beat | wide, medium, close, insert | board |
| angleHeight | Angle height | A line that rises and falls with the lens height | eye, low, high, overhead, floor | board |
| lensLength | Lens length | Focal length per shot | 14 to 200 mm | board, Maya |
| dutch | Dutch / level | Horizon tilt per shot | 0 to 45 degrees | board |
| pov | Point of view | Whose eyes, colored by person | a person, or nobody | board |
| angleCount | Angles per scene | Count of distinct setups | 1 to 8 | board |
| angleFamily | Angles grouped | A band naming the cutting pattern | coverage, oner, montage, handheld | board |
| angleChange | When the angle changes | Cut ticks set against lines and actions | on the line, on the action, both, locked | board, chat |
| angleToLine | Angle matched to the line | Shot size beside each kind of line | pairs | board |
| angleToAction | Angle matched to the action | Shot size beside each kind of action | pairs | board |
| cutRate | Frequency of angle changes | Cuts per minute as a curve | cuts per minute | board, chat |
| shotDuration | Hold | Bar length per shot | seconds | board |
| depthOfField | Depth of field | How deep the sharp zone is | f-stop 1.4 to 22 | Maya |
| rackFocus | Focus pull | When focus moves from one subject to another | none, on the line, on the action | Maya |
| motionBlur | Motion blur | Blur amount per shot | shutter 45 to 360 degrees | Maya |
| aspect | Frame shape | Aspect ratio per shot or panel | 1.33, 1.85, 2.39, custom | new |
| composition | Where the subject sits | A dot for the subject's place in frame | left third, center, right third | new |
| emptySpace | Empty frame | Share of frame with nothing in it | 0 to 100 percent | new |

### Camera: the camera moves

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| cameraCarry | Camera carry | Still frame, smooth line or wobble | locked, smooth, handheld | board |
| cameraMove | Camera move | The move named per shot | none, pan, tilt, push in, pull out, track, crane, zoom, orbit | board |
| moveSpeed | Move speed | Speed curve of the camera | 1 to 5 | board |
| moveFollows | Move follows | What the move is tied to | character, object, neither | board, chat |
| moveOn | Move starts on | The cue that starts each move | line, action, breath, none | board |
| cameraOwner | Camera owner | Authored or player camera | authored, player | board |
| moveToVolume | Move against loudness | Camera speed laid over dialogue loudness | moves on loud, moves on soft, ignores | chat |
| moveTemper | Move temper | The camera's attitude to the action | 1 loving to 5 aggressive | chat |
| cameraShake | Shake | Shake amplitude per beat | 0 to 5 | new |
| speedRamp | Time speed | Playback speed of the shot | 0.25x to 4x, ramps | Maya |

### Motion: people and objects

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| characterPath | Character path | Each person's path drawn on a floor plan | still, cross, approach, retreat, circle | board |
| characterSpeed | Character speed | Speed curve per person | 1 to 5 | board |
| characterToLens | Toward the lens | Direction against the camera | toward, away, across | board |
| whoMoves | Who moves | Who travels during each line | speaker, listener, both, neither | board |
| bodyEnter | Body in frame | Entrances and exits | already, enters, leaves | board |
| objectKind | Object | What the moving thing is | prop, door, screen, vehicle, food | board |
| objectPath | Object path | The object's path | still, lift, drop, slide, open, pass | board |
| objectSpeed | Object speed | Speed curve of the object | 1 to 5 | board |
| objectEnter | Object in frame | Object entrances and exits | stays, enters, leaves | board |

### Animation

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| spacing | Spacing | The shape of each move's curve | even, ease in, ease out, ease both, snap | Maya |
| stepping | Drawn on | Frames each pose holds | ones, twos, threes | Maya |
| anticipation | Anticipation | Wind-up before each move | none, small, big | Maya |
| overshoot | Overshoot | What happens after each stop | none, settle, bounce | Maya |
| overlap | Overlap | Parts still moving after the body stops | none, hair, cloth, hands, all | Maya |
| arcs | Path shape | Motion trails of head and hands | straight, arc, figure eight | Maya |
| leadPart | Leads the move | Which part starts first | eyes, head, hips, hands | Maya |
| squash | Squash and stretch | Deformation amount | 0 to 5 | Maya |
| poseRate | Key poses per line | Held poses per line of dialogue | 1 to 8 | Maya |
| faceIntensity | Facial expression | Expression and its strength per beat | expression name, 0 to 5 | Maya |
| lipSync | Mouth shapes | Mouth shapes per second of speech | 0 to 12 | Maya |

### Body

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| gesture | Size of gesture | Gesture size per beat | none, hand, arm, whole body | board |
| stillness | Stillness | How much of the person moves | 0 to 5 | board |
| blink | Blink | Blinks marked as beats | yes, no | board |
| gazeShift | Eye darts | Eye movements per beat | 0 to 8 | new |
| posture | Posture | Open or closed body | open, neutral, closed | new |
| touch | Touch | Who touches whom, and when | pairs | new |

### Light

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| key | Key direction | Where the main light comes from | side, front, back, under, none | board, chat |
| contrast | Contrast | Stops between key and fill | 0 to 6 stops | board, Maya |
| colorTemp | Color of the light | Light color per shot | 2700 to 7500 K | board, Maya |
| lighting | Lighting | One look per panel | dusk, flat, practical, hard, moon | board |
| timeOfDay | Time of day | The sun's job | dawn, day, dusk, night | board |
| softness | Softness | Hard or soft shadows | hard, soft | Maya |
| rim | Rim light | Edge light on figures | off, thin, strong | Maya |
| lightCount | Sources | Lights doing work in the shot | 1 to 8 | Maya |
| practicalInFrame | Source in frame | Visible lamps, screens, fires | yes, no | Maya |
| lightShape | Shaped light | Patterns cast by gobo, blocker, barndoor | open, blinds, leaves, barndoor | Maya |
| atmosphere | Air | Haze in the light | clear, haze, beams | Maya |
| lightChange | When the light changes | Light-change ticks against cuts and actions | never, on the cut, on the action, during the hold | Maya |
| valueKey | Brightness key | Overall brightness by section | low key, mid, high key | music |

### Shading and color

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| renderStyle | Render style | The look of the frame | photoreal, painterly, toon, flat | Maya |
| lineWeight | Ink line | Outline thickness | none, thin, heavy | Maya |
| gloss | Gloss | Surface shine | matte, satin, mirror | Maya |
| wetness | Wetness | How wet surfaces read | dry, damp, soaked | Maya |
| skinLight | Light in skin | Subsurface glow in skin | 0 to 5 | Maya |
| glow | Something glows | Emitting things in frame | none, object, person, room | Maya |
| wear | Wear | Damage and dirt over the scene | new, used, ruined | Maya |
| saturation | Color saturation | Saturation of the frame | 0 to 5 | Maya |
| palette | Dominant color | The main hue per shot as a color strip | hue | new |

### Dynamics, fur and Bifrost

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| windForce | Wind | Wind strength | 0 to 5 | Maya |
| turbulence | Chaos | Calm drift against gusts | 0 to 5 | Maya |
| clothResponse | Cloth reacts | How cloth moves | stiff, loose, flutter | Maya |
| impacts | Impacts per beat | Collisions the audience notices | 0 to 8 | Maya |
| breakage | Breaks | Objects that fail | holds, cracks, shatters | Maya |
| settleTime | Settle time | Beats until things are still after a hit | beats | Maya |
| gravityFeel | Weight | How heavy the world feels | floaty, real, heavy | Maya |
| furLength | Fur length | Hair or fur length | short, medium, long | Maya |
| clump | Clumping | Fine or matted fur | fine, tufted, matted | Maya |
| frizz | Frizz | Stray hairs | 0 to 5 | Maya |
| hairColor | Hair color | Melanin value | 0 to 1 | Maya |
| hairShine | Shine | Hair sheen | dull, sheen, glossy | Maya |
| furResponse | Fur reacts to | What moves the fur | nothing, wind, the body, both | Maya |
| furLag | Fur lag | Beats the fur trails the body | beats | Maya |
| element | Element | Which simulated element is present | water, smoke, fire, sand, snow | Maya |
| density | Thickness | Volume density | wisp, plume, wall | Maya |
| growth | Growth | Whether the element is growing | shrinking, steady, building | Maya |
| curl | Curl | Swirl in smoke or water | 0 to 5 | Maya |
| splash | Splash | Liquid response to an object | none, drip, burst | Maya |
| scatter | Scattered things | Leaves, debris or crowd per area | 0 to 5 | Maya |
| fireLight | Fire lights the scene | Fire or glow feeding the lighting | no, flicker, floods | Maya |
| repeatInFrame | Repetition in frame | Rows of the same thing (MASH arrays) | 0 to 5 | Maya |

### Place

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| setting | Setting | Location per scene | kitchen, lab, courtyard, wall, commute | board, chat |
| intExt | Interior or exterior | Inside or outside | int, ext | board |
| envMotion | Motion of the environment | What the room does | still, wind, crowd, water, transit | board |
| temperature | Temperature | How hot the place feels | cold, mild, hot | board |
| weather | Weather | Weather per scene | clear, rain, dust | board |
| scale | Scale of the place | Size of the space | closet, hall, city | board |

### People

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| peopleCount | Number of people | Bodies in frame | 1 to 8 | board |
| blocking | Where they stand | Floor-plan shape | line, triangle, depth, one seated | board |
| eyeline | Eyelines | Who looks at whom | pairs | board |
| focus | Who is sharp | The sharp subject | face, hand, object, door | board |
| look | Look of the actor | Wardrobe and face as the camera reads them | notes as tags | board |

### Sound

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| volume | Volume of the lines | Loudness curve of speech | 1 to 5 | board, chat |
| dynamicRange | Dynamic range of the lines | Gap between quiet and loud lines | narrow, wide | board |
| rangeChanges | How often the range changes | Frequency of loud to soft swings | rare, every other, every line | board |
| pace | Pace | Speed of speech against the hold | words per second | board |
| silence | Silence length | Gaps nobody fills | seconds | board, music |
| breath | Breathing and speaking | Breath placement | breath then speak, speak on the breath, ignore | board |
| eating | Eating and speaking | The mouth's job | none, eat then speak, speak while eating | board |
| musicCue | Score | Where music plays and how loud | off, under, featured | new |
| soundDensity | Sound density | Layers of sound at once | 1 to 6 | music |
| soundToCut | Sound against the cut | Sound leading or trailing the picture cut | J-cut, L-cut, hard | new |

### Edit and structure

Most of these are the music app's essences translated to film.

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| sceneRate | Scene change rate | How often the scene changes, the film's harmonic rhythm | scenes per 10 minutes | music |
| phraseScheme | Sequence lengths | Lengths of runs of related shots, like 4+4 or 3+3+2 | shots per phrase | music |
| sceneEntry | How a scene begins | The film's anacrusis | in action, on a line, establishing, sound first | music |
| transition | Transition | How each boundary is crossed | cut, match cut, smash cut, dissolve, sound bridge | music |
| callResponse | Call and response | Who answers whom across cuts | pairs and lag in beats | music |
| repetition | Repetition scheme | How many times an image returns before it varies | count | music |
| hook | Signature image | Where the memorable image or line recurs | beat positions | music |
| contrastMap | Contrast map | A:B pairs the film keeps, like quiet:loud or sparse:dense | pairs | music |
| tensionCurve | Tension | Rising and released tension | 0 to 5 | music |
| energyArc | Energy | Build, drop and plateau across the work | 0 to 5 | music |
| density | Visual density | Elements on screen at once | 1 to 10 | music |
| pedal | Constant | One element held steady while everything else changes | which element, how long | music |
| psychOut | Psych-out shift | A shift of place or tone that snaps back within a beat, against a real shift that stays | psych-out, real | chat |
| cutArticulation | Cut articulation | Clipped cuts against long overlaps, staccato against legato | 0 clipped to 5 overlapping | music |
| operatorFeel | Operator feel | Small timing drift in camera and cuts, the humanized feel | 0 to 5 | music |
| motifShape | Motif shape | The rise and fall of a visual motif, such as size, height or brightness, across its returns | contour | music |

### Comic, zine and storyboard

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| panelCount | Panels | Panels per strip or page | count | board |
| gutter | Gutter | Time skipped between panels | none, beat, scene | board |
| balloon | Balloon against caption | Speech or narration | balloon, caption, both | board |
| panelSize | Panel size | Share of the page each panel takes | 0 to 100 percent | new |
| panelBreak | Breaking the frame | Figures crossing panel borders | none, edge, splash | new |
| textDensity | Words per panel | Lettering load | words | new |
| soundLettering | Sound effects | Drawn sound words | none, small, page-sized | new |
| pageTurn | Page-turn reveal | What waits on the next page | none, reveal, cliffhanger | new |

### Story

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| mains | Featured mains | Mains followed this hour | 2 to 4 | board |
| groups | Groups in the hour | Companies of people | 1, 2 | board |
| exit | Exit | How a main leaves | stay, leave, die | board |
| featureRate | How often a main is in the season | Hours per main | count | board |
| intercut | Cross-cutting | Switches between storylines | switches per scene | new |
| reveal | Reveal timing | When the audience learns a fact relative to the characters | before, with, after | new |
| povSwitch | Story point of view | Whose story each scene tells | person | new |
| sceneLength | Scene length | Minutes per scene | minutes | new |

### Scene memory

Added for the Scene Memory App Framework (`scene-memory-app-framework.md`), from Jeremy's Tarantino brief.

| Id | Curiosity | View: what the app shows | Values | Source |
| --- | --- | --- | --- | --- |
| sceneShapes | Shapes in the scene | A simple map of big shapes by frame position | shape + left, center, right, near, far | chat |
| vocalTone | Tone of the line | What the voice does through the line | flat, rising, falling, breaking, whispered, shouted | chat |
| toneArc | Where the tone sits in the story | Vocal tone placed on the film's timeline | act and minute | chat |
| timePerCharacter | Time on each character | Share of screen time per person | percent per person | chat |
| actionCutRate | Cut rate in action | Cuts per minute during action beats only | cuts per minute | chat |
| emotion | Emotion of the beat | The emotion label that drives the emotion map | loving, joyful, curious, melancholy, anxious, fearful, angry, triumphant, absurd, dreamlike | chat |

## Development techniques

These are the Bach and Beethoven moves, treated as curiosities too: the view marks every beat where a motif comes back and names the move that changed it. Run through "A is to B as C is to D", the app reads the move from a curated work (A to B) and applies it to our motif (C) to make D.

| Id | Move | What it does to a film motif | Source |
| --- | --- | --- | --- |
| devAugment | Augmentation | The same action or image, held longer or slowed | music |
| devDiminish | Diminution | The same action, faster or cut shorter | music |
| devInvert | Inversion | Flipped: high angle becomes low, approach becomes retreat, warm becomes cold | music |
| devRetrograde | Retrograde | The shots of a sequence in reverse order | music |
| devFragment | Fragmentation | Only one piece of the motif returns, such as just the hand or just the sound | music |
| devSequence | Sequence | The same pattern repeated in a new place or with a new person | music |
| devAddSpace | Add space | Silence or empty frame inserted inside the motif | music |
| devModulate | Modulation | The motif moves to a new place, light or tone and stays there | music, chat |
| devPsychOut | Psych-out | The motif shifts away for a beat and snaps back | chat |
| devSwap | Slice swap | One curiosity taken from another work while the rest stays ours | chat |

## Suites

There are 24 suites: the board's 8, plus 16 drawn from the chat, Maya and the music app. Viewed as a suite, the app overlays each member's line, so you can see them move together.

| Suite | Curiosities it sets | Source |
| --- | --- | --- |
| Coverage | angleFamily coverage, angleChange on the line, angleCount 4 | board |
| Oner | angleFamily oner, cameraCarry smooth, cameraMove track, angleChange locked | board |
| Handheld hunt | cameraCarry handheld, angleFamily handheld, angleCount 6, moveSpeed 4 | board |
| Smooth push | cameraCarry smooth, cameraMove push in, moveSpeed 1 | board |
| Quiet confession | volume 1, breath then speak, cameraCarry smooth, cameraMove push in | board |
| Object insert | objectPath lift, objectEnter enters, moveFollows object, cameraMove push in | board |
| Crossing | characterPath cross, characterToLens across, cameraCarry locked | board |
| Two-person hour | mains 2, groups 1, peopleCount 2 | board |
| Loving camera | moveTemper 1, cameraCarry smooth, moveSpeed 1, softness soft, depthOfField shallow | chat |
| Aggressive camera | moveTemper 5, cameraCarry handheld, cutRate high, lensLength wide, softness hard | chat |
| Follows the voice | moveToVolume moves on loud, moveOn line, dynamicRange wide | chat |
| Snappy cartoon | stepping twos, anticipation big, overshoot bounce, squash 4 | Maya |
| Grounded realism | stepping ones, anticipation small, overshoot settle, overlap hair | Maya |
| Noir | softness hard, contrast 4, lightShape blinds, atmosphere haze, valueKey low | Maya |
| Golden hour | colorTemp 3200, key back, rim strong, softness soft | Maya |
| Comic ink | renderStyle toon, lineWeight heavy, saturation 2 | Maya |
| Wet night | wetness soaked, gloss mirror, practicalInFrame yes, weather rain | Maya |
| Storm | windForce 5, turbulence 4, clothResponse flutter, furResponse wind | Maya |
| Hearth | element fire, growth steady, fireLight flicker, colorTemp 2700 | Maya |
| Brawl | impacts 6, breakage shatters, cameraCarry handheld, cutRate high | Maya |
| Build | energyArc rising, cutRate rising, density rising, musicCue featured | music |
| Drop | energyArc falls to 1, silence long, density 1, cameraCarry locked | music |
| Breathing room | silence long, emptySpace high, shotDuration long, devAddSpace | music |
| Signature return | hook, repetition, motifShape, devFragment | music |

## Proximities

There are 22 proximities, all of them guesses until we count them in works we curate. Viewed as a proximity, the app marks each time X happens and shows where Y followed, so each row becomes a count and an average lag. Rows marked *suite* work at the suite level.

| When X happens | Y follows | Within (beats) | Source |
| --- | --- | --- | --- |
| cameraCarry is handheld | gesture grows | 2 | board |
| shotSize becomes close | volume drops | 1 | board |
| characterPath is approach | cameraMove push in | 2 | board |
| objectEnter is enters | shotSize becomes insert | 1 | board |
| volume rises | moveSpeed rises | 0 | chat |
| the action turns aggressive | moveTemper rises and cameraCarry goes handheld | 1 | chat |
| a line ends | the angle changes | 0 | chat |
| leadPart is eyes | head turns, then the body | 1 | Maya |
| the character stops | overlap, furLag and clothResponse settle, in that order | 2 | Maya |
| a practical switches on | key moves to it | 0 | Maya |
| weather turns to rain | wetness soaked, clump matted, gloss mirror | 2 | Maya |
| growth is building on fire | colorTemp warms and contrast rises | 0 | Maya |
| an impact lands | overshoot bounces and cameraShake rises | 0 | Maya |
| renderStyle becomes toon | lighting flattens and lineWeight rises | 0 | Maya |
| a scene boundary | transition marks it with a sound bridge or match cut | 0 | music |
| a motif has returned 3 times | the next return varies (devFragment or devInvert) | 0 | music |
| tensionCurve peaks | silence follows | 1 | music |
| a psych-out shift | the scene snaps back to its home place or tone | 1 | chat |
| energyArc drops | shotDuration lengthens | 2 | music |
| suite Build | suite Drop | 4 | suite |
| suite Aggressive camera | suite Quiet confession | 6 | suite |
| suite Storm | suite Breathing room | 8 | suite |

## Other Maya topics and sources

Besides Sharani's six areas, these parts of Maya matter for the project, and their curiosities are already in the catalog above:

- **Camera attributes**: focal length, depth of field (f-stop, focus distance) and motion blur. These became lensLength, depthOfField, rackFocus and motionBlur.
- **Time Warp and the Time Editor**: retiming a shot. This became speedRamp.
- **Blend shapes and facial rigs**: expression and mouth shapes. These became faceIntensity and lipSync.
- **MASH motion graphics**: arrays and repeated objects. This became repeatInFrame.
- **Toon shading and outlines**: the bridge to comic and zine. These became renderStyle and lineWeight.
- **Camera Sequencer**: cutting between cameras inside Maya. It is how the cut curiosities could be automated in a 3D scene.

Autodesk's current help viewer, including the Arnold for Maya guide Jeremy shared, blocks automated reads. Older static pages of the same manuals did load. Names from the Arnold and Maya tools that could not be opened directly are from working knowledge, so Sharani should check them.

**Sources opened**

- [Adjust depth of field](https://help.autodesk.com/cloudhelp/2023/ENU/Maya-Rendering/files/GUID-3FCD5E9C-98AF-4BA9-99A1-381B036724E3.htm), Maya 2023 rendering help
- [Arnold lights](https://help.autodesk.com/cloudhelp/2026/ENU/AR-3DSMax/files/arnold-3dsmax/arnold_for_3ds_max_ax_lights_html.html), Arnold 2026 help (3ds Max edition, same light types and filters as Maya)
- The app's `catalog.js`, `model.js` and `CURIOSITIES-REVIEW.md`, and the music app's essence candidates and inventory
- `maya-curiosities-map.md`, the first pass on Sharani's six areas
