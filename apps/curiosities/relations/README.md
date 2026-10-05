# Relationship map

Every curiosity, feeling, movement, character trait and the people traits react to, and what each one is
directly tied to. Open `index.html` here on its own, or Library, Relationship map inside the app (which reads
the live `CuriosityDB`, so a person's own curiosities show up too).

- **Cube matrix** (opens first): every curiosity, feeling, movement and trait is one small 3D cube, and the cubes
  stand in slabs, one slab per column (the six groups, or a slab per workspace), stacked into one block like a
  Rubik's cube with many more cubes (longer than it is wide when it needs to be). Drag to turn it all the way
  round, click a cube to select it and lines run to every cube it is tied to, double-click to zoom in (each
  double-click goes further, like a map; inside, dragging looks around you). Show every proximity draws the whole web.
- **Corridors**: the gaps between two faces. Walk a corridor (or zoom and look around until you stand in one) and
  a "Slide the corridor" slider shows in the lower right: it moves you the way you are looking, kept inside the
  corridor, so you never go into a cube on either side.
- **Inside a cube**: double-click a cube you are right up against, or Go inside. Its curiosity and everything tied
  to it show as automation lanes stacked like Ableton Live (the open film's own values, else marked example), with
  a 3D graph tab, and a Curiosity proximity tab: what it is tied to and what those are tied to, so changing any
  outer one changes something that affects this cube. Leave the cube goes back out.
- **Cube slices**: the same block seen face on. Swipe right (or the right arrow) and the front slab goes to the
  back; swipe left and the back slab comes to the front. Click a slab's name to bring that face forward; each
  name counts the selection's ties on it. You can still turn it and double-click to zoom in.
- **Lanes in depth**: the film's automation lanes over time as ribbons in 3D, the curiosity that moves most at the
  back and the stiller ones in front. Turn it to any angle (Straight on, From the side, Spin). It reads the
  Screen's own lanes (`CurioEngine`) when a film is open, else shows an example film and says so.
- **Lanes, swipe**: the same lanes; swipe right or left to send the front lane back or bring the back one forward.
- **Flat list**: six columns, split by workspace, for reading names quickly.
- **Your own**: Add a curiosity (tied to whatever is selected), Tie to… then click anything to draw a line,
  × to remove one. Inside the app these go into the curiosity database as your own ("my-") curiosities and
  proximities through `CurioMine` (screen/mine.js), so they can be automated, are saved in project files and
  undo like everything else. Ties to archive items (movements, feelings, traits), everything on the standalone
  page stay on this device (`curio-relations-v1`).
- **Movement archive** (a pop-up): what a body does, or stops doing, for each feeling. Pick a feeling to see its
  movements, or pick movements and it says which feelings they read as. Show on the map, or Copy as a note.

## What a line means

| Line | From | Comes from |
| --- | --- | --- |
| Leads to | a proximity's cause to its effect | `data/` proximities |
| Together in a suite | two members of one suite (suites of 12 or fewer) | `data/` suites |
| Shows the feeling | a movement to a feeling | `archive.js` |
| Feels, Reacts to, Moves like this | a trait to a feeling, a figure, a movement | `archive.js` |
| Made on screen with | an archive item to the film curiosity that sets it | `archive.js` |
| A word on | a feeling to the database's Emotion curiosity | `archive.js` |
| Your tie | anything to anything | drawn on the map |

Feelings the database already has (shame, pride, grief...) are those curiosities, not copies.

## Files

- `archive.js` (`window.CurioArchive`): feelings (`em-*`), movements and stillness (`mv-*`), traits (`tr-*`), figures (`fig-*`).
- `graph.js` (`window.CurioGraph`): builds the nodes and ties from the database and the archive.
- `relations.js` (`window.CurioRelations`): `mount(el)`, `open()`. Picks and the last view are localStorage `curio-relations-v1`.
- `load.js`: the Library button; loads the rest on first use.
- `snapshot.js`: the database for the standalone page, made by `node tools/make-snapshot.js` (rerun after the database changes; the test fails when it is stale).

Tests: `node relations/tests/run.js`, `node relations/tests/browser.js --three three.min.js`.
