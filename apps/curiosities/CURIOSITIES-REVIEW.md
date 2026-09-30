# Curiosities to keep or drop

Mark each line **keep** or **drop**. Suites and proximities are at the bottom. They are not extra curiosities. They are how curiosities combine.

A curiosity is one measurable thing in a beat. If you cannot point at a frame, a second of play, or a panel and say the value, it is not a curiosity.

Starter rows are already in `catalog.js`. Proposed rows are not in the app yet.

## Camera — frame

- [ ] **keep / drop** — `shotSize` — Wide, medium, close, insert. How much of the body the frame keeps. *(starter)*
- [ ] **keep / drop** — `angleHeight` — Eye, low, high, overhead, floor. *(starter)*
- [ ] **keep / drop** — `lensLength` — Wide lens deepens the room. Long lens flattens people together. *(starter)*
- [ ] **keep / drop** — `dutch` — Horizon tilted or level. *(starter)*
- [ ] **keep / drop** — `pov` — Whose eyes, or nobody’s. *(starter)*
- [ ] **keep / drop** — `angleCount` — How many distinct setups the scene may use. *(starter, live control)*
- [ ] **keep / drop** — `angleFamily` — Coverage, oner, montage, or handheld as a cutting pattern. *(starter, live control)*
- [ ] **keep / drop** — `angleChange` — The cut lands on a line, on an action, on both, or the angle stays locked. *(starter, live control)*
- [ ] **keep / drop** — `angleToLine` — Which shot size is tied to which kind of line. *(starter)*
- [ ] **keep / drop** — `angleToAction` — Which shot size is tied to a hand, a crossing, a door. *(starter)*
- [ ] **keep / drop** — `cutRate` — How often the setup is allowed to change, per line or per beat. *(starter)*
- [ ] **keep / drop** — `shotDuration` — How long one angle is held. *(starter)*

## Camera — the camera itself moves

- [ ] **keep / drop** — `cameraCarry` — Locked, smooth, or handheld. Locked sits. Smooth is one continuous line. Handheld is unsteady. *(proposed)*
- [ ] **keep / drop** — `cameraMove` — None, pan, tilt, push in, pull out, track, crane, zoom, orbit. *(proposed)*
- [ ] **keep / drop** — `moveSpeed` — How fast that move travels. *(proposed)*
- [ ] **keep / drop** — `moveFollows` — The move follows a character, follows an object, or follows nothing. *(proposed)*
- [ ] **keep / drop** — `moveOn` — The move starts on a line, on an action, on a breath, or on no cue. *(proposed)*
- [ ] **keep / drop** — `cameraOwner` — Authored camera, or the player’s camera. Matters for games. *(proposed)*

## Light

- [ ] **keep / drop** — `key` — Side, front, back, under, or no key. *(starter)*
- [ ] **keep / drop** — `contrast` — How far the shadow sits from the face. *(starter)*
- [ ] **keep / drop** — `colorTemp` — Warm practical, cold day, or mixed. *(starter)*
- [ ] **keep / drop** — `lighting` — Dusk, flat, practical, hard, moon. One look for the whole panel. *(starter, live control)*
- [ ] **keep / drop** — `timeOfDay` — What the sun is doing, if it is in the scene. *(starter)*

## Place

- [ ] **keep / drop** — `setting` — Kitchen, lab, courtyard, path, orbit, courthouse. *(starter)*
- [ ] **keep / drop** — `intExt` — Interior or exterior. *(starter)*
- [ ] **keep / drop** — `envMotion` — The room while people talk: still, wind, crowd, water, transit. *(starter, live control)*
- [ ] **keep / drop** — `temperature` — Cold, mild, hot, and how bodies behave before speech. *(starter, live control)*
- [ ] **keep / drop** — `weather` — Rain, dust, or clear. *(starter)*
- [ ] **keep / drop** — `scale` — Closet, hall, or a city. *(starter)*

## People — where they are

- [ ] **keep / drop** — `peopleCount` — Bodies in the shot. *(starter, live control)*
- [ ] **keep / drop** — `blocking` — Line, triangle, depth, or one seated. *(starter)*
- [ ] **keep / drop** — `eyeline` — Who is allowed to look at whom. *(starter)*
- [ ] **keep / drop** — `focus` — What is sharp: face, hand, object, door. *(starter)*
- [ ] **keep / drop** — `look` — Wardrobe, face, the age the camera reads, how still the person is dressed to seem. *(starter)*
- [ ] **keep / drop** — `mains` — How many featured people this hour follows. The show’s hour is two to four. *(starter, live control)*
- [ ] **keep / drop** — `groups` — One company in the hour, or two mains sharing that company. *(starter, live control)*
- [ ] **keep / drop** — `exit` — Stay, leave alive, or die. *(starter, live control)*
- [ ] **keep / drop** — `featureRate` — How many hours in a season a main appears. A leave stops the count. A death stops the count. *(starter)*

## People — they move

- [ ] **keep / drop** — `characterPath` — Still, cross, approach, retreat, circle, sit, stand, fall. *(proposed)*
- [ ] **keep / drop** — `characterSpeed` — How fast the person travels. *(proposed)*
- [ ] **keep / drop** — `characterToLens` — Toward the camera, away, or across the frame. *(proposed)*
- [ ] **keep / drop** — `whoMoves` — Speaker, listener, both, or neither, during the line. *(proposed)*
- [ ] **keep / drop** — `bodyEnter` — A person enters the frame, leaves it, or is already there. *(proposed)*

## Objects — they move

- [ ] **keep / drop** — `objectKind` — Prop, door, screen, vehicle, weather, food. *(proposed)*
- [ ] **keep / drop** — `objectPath` — Still, lift, drop, slide, open, close, pass hand to hand. *(proposed)*
- [ ] **keep / drop** — `objectSpeed` — How fast the object travels. *(proposed)*
- [ ] **keep / drop** — `objectEnter` — The object enters the frame, leaves it, or stays. *(proposed)*

## Sound and body

- [ ] **keep / drop** — `volume` — How loud the line is. *(starter, live control)*
- [ ] **keep / drop** — `dynamicRange` — Narrow or wide gap between the quiet line and the loud line. *(starter, live control)*
- [ ] **keep / drop** — `rangeChanges` — Rare, every other line, or every line. *(starter, live control)*
- [ ] **keep / drop** — `pace` — Speed of the line against the hold of the shot. *(starter)*
- [ ] **keep / drop** — `silence` — How long a silence is held. *(starter)*
- [ ] **keep / drop** — `breath` — Breath then speak, speak on the breath, or ignore breath. *(starter, live control)*
- [ ] **keep / drop** — `eating` — No eating, eat then speak, or speak while eating. *(starter, live control)*
- [ ] **keep / drop** — `gesture` — A hand, the whole arm, or nothing. *(starter)*
- [ ] **keep / drop** — `stillness` — How much of the person is allowed to move. *(starter)*
- [ ] **keep / drop** — `blink` — Whether a blink is recorded as a beat. *(starter)*

## Comic strip

- [ ] **keep / drop** — `panelCount` — How many panels the strip has. *(starter)*
- [ ] **keep / drop** — `gutter` — The gap where time happens off-panel. *(starter)*
- [ ] **keep / drop** — `balloon` — Speech balloon, or a caption that knows more than the people. *(starter)*

## Suites to keep or drop

A suite is a name plus the curiosity ids inside it. Confirm the bundle, not a new single dial.

- [ ] **keep / drop** — **Coverage** — `angleFamily` coverage, `angleChange` on the line, `angleCount` above 1.
- [ ] **keep / drop** — **Oner** — `angleFamily` oner, `cameraCarry` smooth, `cameraMove` track.
- [ ] **keep / drop** — **Handheld hunt** — `cameraCarry` handheld, `gesture` large, `cutRate` high.
- [ ] **keep / drop** — **Smooth push** — `cameraCarry` smooth, `cameraMove` push in, `moveSpeed` slow.
- [ ] **keep / drop** — **Quiet confession** — `shotSize` close, `volume` low, `breath` breath then speak, `cameraCarry` smooth.
- [ ] **keep / drop** — **Object insert** — `shotSize` insert, `objectPath` not still, `focus` on the object.
- [ ] **keep / drop** — **Crossing** — `characterPath` cross, `characterToLens` across, `shotSize` wide.
- [ ] **keep / drop** — **Two-person hour** — `mains` 2, `groups` 1, `peopleCount` 2.

## Proximities to keep or drop

A proximity is “when X happens, Y happens within N beats.” These four are seeds. Later ones should be counted from a work you choose, not copied from a famous scene.

- [ ] **keep / drop** — When `cameraCarry` is handheld, `gesture` grows within 2 beats.
- [ ] **keep / drop** — When `shotSize` becomes close, `volume` drops within 1 beat.
- [ ] **keep / drop** — When `characterPath` is approach, `cameraMove` push in happens within 2 beats.
- [ ] **keep / drop** — When `objectEnter` is enters, `shotSize` becomes insert within 1 beat.

Reply in the app chat with keep or drop on any line. Unmarked lines stay proposed and out of the board.
