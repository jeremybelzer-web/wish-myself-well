# Claude — start here (the writing app)

The Curiosities writing app: the same framework as Curiomatic (`apps/curiosities/`), for the written word
(lyrics, poems, stories, essays, ads, blogs, video scripts, long fiction and nonfiction), with a special focus on
dialogue driven by each character's Enneagram type. Jeremy's full handoff is the first message of the
"Curiosity Writing App" project thread; read it before big changes.

## Rules

- Separate app for now, built to join Curiomatic later: same curiosity ids, same database format.
- It does not copy Curiomatic's database. `index.html` loads `../curiosities/data/` in the order of
  `data/files.json`; `node tools/sync-scripts.js` rewrites that block when the list changes.
- Writing-only curiosities (grammar, sentence structure, chapters, verse forms) belong here. Anything that also
  works for film goes into Curiomatic's database instead, and this app picks it up by id.
- Every curiosity carries `lanes`: one or more of Visual (what is seen), Writing (the words on the page) and Audio
  (anything heard or spoken). `lanes.js` sets them from the workspace, a sound-word rule and per-id overrides.
- The words: curiosity, suite, proximity, catalyst (spark, elixir), style (a suite of suites). Never "trigger".
- Sliders run 0 to 100. Every change is one undo step. Studies of real works keep ids and counts, never the text.
- Jeremy's drafts and private material never go into this repo (it is public).
- Static HTML, CSS and JS. No build step. Branch off `curiosities-beta`; Jeremy merges by hand.

## Files

| File | Job |
| --- | --- |
| `index.html` | The first screen: every curiosity, with All / Visual / Writing / Audio tabs and Find |
| `lanes.js` | `window.WritingLanes`: `tag(row)`, `tagAll(DB)`, the workspace table and overrides |
| `app.js` | Draws the first screen |
| `data/db-writing-language.js` | The writing-only language curiosities (verbs, sentences, words, figures, sound, voice, dialogue), each with frequency, placement, spacing, and spread by character and narrative voice. Seven `w-` workspaces |
| `data/db-writing-ladder.js` | The language curiosities set into the ladder: suites, proximities (`window.WritingProximities`, related pairs 0 to 100 that set nothing off), catalysts (sparks, `DB.proximity`) and elixirs (`DB.proximitySuite`, every spark must line up). Beats are sentences |
| `LANGUAGE-REVIEW.md` | Jeremy's keep / drop list for those, made by `node tools/review-list.js`. Honor a drop |
| `tools/sync-scripts.js` | Keeps the database script tags in step with Curiomatic's `data/files.json` |
| `tests/check.js` | `node apps/curiosities-writing/tests/check.js`: every curiosity tagged, shared ids present, scripts in step |

## Next (Jeremy's handoff, section 12)

1. Done: import Curiomatic's database and tag every curiosity Visual / Writing / Audio.
2. The listener's perspective curiosity with its fine-tune window and presets.
3. Started: the language curiosities (`data/db-writing-language.js`). Still to come from handoff section 8: forms, persuasion, genre machinery, nonfiction, and more Enneagram dialogue curiosities.
4. The Outline view as the main view, with the beat board and the Viewer one click away.
5. Later, when the apps join: the Visual / Writing / Audio lane tabs in Curiomatic.
