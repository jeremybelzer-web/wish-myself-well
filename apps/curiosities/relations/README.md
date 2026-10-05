# Relationship map

Every curiosity, feeling, movement, character trait and the people traits react to, and what each one is
directly tied to. Open `index.html` here on its own, or Library, Relationship map inside the app (which reads
the live `CuriosityDB`, so a person's own curiosities show up too).

- **Flat matrix**: six columns (Character, Feeling, Body & movement, Camera & look, Sound & words, Story & cut),
  split by workspace. Click anything and lines run to everything it is directly tied to.
- **Layers**: flat grids stacked like the slices of a cube (6 layers, or one per workspace). Swipe right, the
  right arrow or a sideways trackpad swipe sends the front layer to the back; left brings the back one forward.
  A picked curiosity draws lines on the front layer and each tab counts its ties on that layer.
- **3D cube**: the same six columns as six slabs of a cube. Drag to spin it all the way round, scroll or pinch to
  zoom, click to select. Double-click flies closer to what you clicked (or to the curiosity nearest that spot),
  and each double-click goes further in, like a map. Once you are inside, dragging looks around you. Show every
  proximity draws the whole web of cause and effect; Move curiosities lets you drag them somewhere else.
- **Your own**: Add a curiosity (tied to whatever is selected), Tie to… then click anything to draw a line,
  × to remove one. Inside the app these go into the curiosity database as your own ("my-") curiosities and
  proximities through `CurioMine` (screen/mine.js), so they can be automated, are saved in project files and
  undo like everything else. Ties to archive items (movements, feelings, traits), everything on the standalone
  page, and where you moved things stay on this device (`curio-relations-v1`).
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
