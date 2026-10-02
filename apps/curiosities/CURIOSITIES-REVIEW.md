# Curiosities to keep or drop

Marked **keep** for the motion set: every starter row, every camera-move and body-move and object-move row, all eight suites, and all four seed proximities. Drop a line by changing **keep** back to **drop**. The board already plays the kept motion controls.

Suites and proximities are at the bottom. They are not extra curiosities. They are how curiosities combine.

A curiosity is one measurable thing in a beat. If you cannot point at a frame, a second of play, or a panel and say the value, it is not a curiosity.

Starter rows are already in `catalog.js`. Proposed rows are not in the app yet.

## Camera — frame

- [x] **keep** — `shotSize` — Wide, medium, close, insert. How much of the body the frame keeps. *(starter)*
- [x] **keep** — `angleHeight` — Eye, low, high, overhead, floor. *(starter)*
- [x] **keep** — `lensLength` — Wide lens deepens the room. Long lens flattens people together. *(starter)*
- [x] **keep** — `dutch` — Horizon tilted or level. *(starter)*
- [x] **keep** — `pov` — Whose eyes, or nobody’s. *(starter)*
- [x] **keep** — `angleCount` — How many distinct setups the scene may use. *(starter, live control)*
- [x] **keep** — `angleFamily` — Coverage, oner, montage, or handheld as a cutting pattern. *(starter, live control)*
- [x] **keep** — `angleChange` — The cut lands on a line, on an action, on both, or the angle stays locked. *(starter, live control)*
- [x] **keep** — `angleToLine` — Which shot size is tied to which kind of line. *(starter)*
- [x] **keep** — `angleToAction` — Which shot size is tied to a hand, a crossing, a door. *(starter)*
- [x] **keep** — `cutRate` — How often the setup is allowed to change, per line or per beat. *(starter)*
- [x] **keep** — `shotDuration` — How long one angle is held. *(starter)*

## Camera — the camera itself moves

- [x] **keep** — `cameraCarry` — Locked, smooth, or handheld. Locked sits. Smooth is one continuous line. Handheld is unsteady. *(proposed)*
- [x] **keep** — `cameraMove` — None, pan, tilt, push in, pull out, track, crane, zoom, orbit. *(proposed)*
- [x] **keep** — `moveSpeed` — How fast that move travels. *(proposed)*
- [x] **keep** — `moveFollows` — The move follows a character, follows an object, or follows nothing. *(proposed)*
- [x] **keep** — `moveOn` — The move starts on a line, on an action, on a breath, or on no cue. *(proposed)*
- [x] **keep** — `cameraOwner` — Authored camera, or the player’s camera. Matters for games. *(proposed)*

## Light

- [x] **keep** — `key` — Side, front, back, under, or no key. *(starter)*
- [x] **keep** — `contrast` — How far the shadow sits from the face. *(starter)*
- [x] **keep** — `colorTemp` — Warm practical, cold day, or mixed. *(starter)*
- [x] **keep** — `lighting` — Dusk, flat, practical, hard, moon. One look for the whole panel. *(starter, live control)*
- [x] **keep** — `timeOfDay` — What the sun is doing, if it is in the scene. *(starter)*

## Place

- [x] **keep** — `setting` — Kitchen, lab, courtyard, path, orbit, courthouse. *(starter)*
- [x] **keep** — `intExt` — Interior or exterior. *(starter)*
- [x] **keep** — `envMotion` — The room while people talk: still, wind, crowd, water, transit. *(starter, live control)*
- [x] **keep** — `temperature` — Cold, mild, hot, and how bodies behave before speech. *(starter, live control)*
- [x] **keep** — `weather` — Rain, dust, or clear. *(starter)*
- [x] **keep** — `scale` — Closet, hall, or a city. *(starter)*

## People — where they are

- [x] **keep** — `peopleCount` — Bodies in the shot. *(starter, live control)*
- [x] **keep** — `blocking` — Line, triangle, depth, or one seated. *(starter)*
- [x] **keep** — `eyeline` — Who is allowed to look at whom. *(starter)*
- [x] **keep** — `focus` — What is sharp: face, hand, object, door. *(starter)*
- [x] **keep** — `look` — Wardrobe, face, the age the camera reads, how still the person is dressed to seem. *(starter)*
- [x] **keep** — `mains` — How many featured people this hour follows. The show’s hour is two to four. *(starter, live control)*
- [x] **keep** — `groups` — One company in the hour, or two mains sharing that company. *(starter, live control)*
- [x] **keep** — `exit` — Stay, leave alive, or die. *(starter, live control)*
- [x] **keep** — `featureRate` — How many hours in a season a main appears. A leave stops the count. A death stops the count. *(starter)*

## People — they move

- [x] **keep** — `characterPath` — Still, cross, approach, retreat, circle, sit, stand, fall. *(proposed)*
- [x] **keep** — `characterSpeed` — How fast the person travels. *(proposed)*
- [x] **keep** — `characterToLens` — Toward the camera, away, or across the frame. *(proposed)*
- [x] **keep** — `whoMoves` — Speaker, listener, both, or neither, during the line. *(proposed)*
- [x] **keep** — `bodyEnter` — A person enters the frame, leaves it, or is already there. *(proposed)*

## Objects — they move

- [x] **keep** — `objectKind` — Prop, door, screen, vehicle, weather, food. *(proposed)*
- [x] **keep** — `objectPath` — Still, lift, drop, slide, open, close, pass hand to hand. *(proposed)*
- [x] **keep** — `objectSpeed` — How fast the object travels. *(proposed)*
- [x] **keep** — `objectEnter` — The object enters the frame, leaves it, or stays. *(proposed)*

## Sound and body

- [x] **keep** — `volume` — How loud the line is. *(starter, live control)*
- [x] **keep** — `dynamicRange` — Narrow or wide gap between the quiet line and the loud line. *(starter, live control)*
- [x] **keep** — `rangeChanges` — Rare, every other line, or every line. *(starter, live control)*
- [x] **keep** — `pace` — Speed of the line against the hold of the shot. *(starter)*
- [x] **keep** — `silence` — How long a silence is held. *(starter)*
- [x] **keep** — `breath` — Breath then speak, speak on the breath, or ignore breath. *(starter, live control)*
- [x] **keep** — `eating` — No eating, eat then speak, or speak while eating. *(starter, live control)*
- [x] **keep** — `gesture` — A hand, the whole arm, or nothing. *(starter)*
- [x] **keep** — `stillness` — How much of the person is allowed to move. *(starter)*
- [x] **keep** — `blink` — Whether a blink is recorded as a beat. *(starter)*

## Comic strip

- [x] **keep** — `panelCount` — How many panels the strip has. *(starter)*
- [x] **keep** — `gutter` — The gap where time happens off-panel. *(starter)*
- [x] **keep** — `balloon` — Speech balloon, or a caption that knows more than the people. *(starter)*

## Suites to keep or drop

A suite is a name plus the curiosity ids inside it. Confirm the bundle, not a new single dial.

- [x] **keep** — **Coverage** — `angleFamily` coverage, `angleChange` on the line, `angleCount` above 1.
- [x] **keep** — **Oner** — `angleFamily` oner, `cameraCarry` smooth, `cameraMove` track.
- [x] **keep** — **Handheld hunt** — `cameraCarry` handheld, `gesture` large, `cutRate` high.
- [x] **keep** — **Smooth push** — `cameraCarry` smooth, `cameraMove` push in, `moveSpeed` slow.
- [x] **keep** — **Quiet confession** — `shotSize` close, `volume` low, `breath` breath then speak, `cameraCarry` smooth.
- [x] **keep** — **Object insert** — `shotSize` insert, `objectPath` not still, `focus` on the object.
- [x] **keep** — **Crossing** — `characterPath` cross, `characterToLens` across, `shotSize` wide.
- [x] **keep** — **Two-person hour** — `mains` 2, `groups` 1, `peopleCount` 2.

## Proximities to keep or drop

A proximity is “when X happens, Y happens within N beats.” These four are seeds. Later ones should be counted from a work you choose, not copied from a famous scene.

- [x] **keep** — When `cameraCarry` is handheld, `gesture` grows within 2 beats.
- [x] **keep** — When `shotSize` becomes close, `volume` drops within 1 beat.
- [x] **keep** — When `characterPath` is approach, `cameraMove` push in happens within 2 beats.
- [x] **keep** — When `objectEnter` is enters, `shotSize` becomes insert within 1 beat.

Reply in the app chat with keep or drop on any line. Unmarked lines stay proposed and out of the board.
