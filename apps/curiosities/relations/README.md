# Relationship map

Every curiosity, feeling, movement, character trait and the people traits react to, and what each one is
directly tied to. Open `index.html` here on its own, or Library, Relationship map inside the app (which reads
the live `CuriosityDB`, so a person's own curiosities show up too).

- **Flat matrix**: six columns (Character, Feeling, Body & movement, Camera & look, Sound & words, Story & cut),
  split by workspace. Click anything and lines run to everything it is directly tied to.
- **3D cube**: the same six columns as six slabs of a cube. Drag to spin it all the way round, scroll or pinch to
  zoom, click to select. Double-click a curiosity to fly inside the cube to it; double-click empty space to fly
  to the middle, or back out.
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

Feelings the database already has (shame, pride, grief...) are those curiosities, not copies.

## Files

- `archive.js` (`window.CurioArchive`): feelings (`em-*`), movements and stillness (`mv-*`), traits (`tr-*`), figures (`fig-*`).
- `graph.js` (`window.CurioGraph`): builds the nodes and ties from the database and the archive.
- `relations.js` (`window.CurioRelations`): `mount(el)`, `open()`. Picks and the last view are localStorage `curio-relations-v1`.
- `load.js`: the Library button; loads the rest on first use.
- `snapshot.js`: the database for the standalone page, made by `node tools/make-snapshot.js` (rerun after the database changes; the test fails when it is stale).

Tests: `node relations/tests/run.js`, `node relations/tests/browser.js --three three.min.js`.
