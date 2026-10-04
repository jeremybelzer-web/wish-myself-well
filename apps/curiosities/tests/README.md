# Testing Curiomatic

One command runs every test the app has. From the repository root:

    node apps/curiosities/tests/run-all.js              # quick, no browser (about a minute)
    node apps/curiosities/tests/run-all.js --browser    # also every browser test
    node apps/curiosities/tests/run-all.js --full       # also the long random-click stress run

Or, inside `apps/curiosities/`: `npm test`, `npm run test:browser`, `npm run test:all`.

The summary lists each suite as **pass**, **FAIL** or **skip** (a tool it needs is not installed, such as
Blender). The exit code is 1 when anything failed. GitHub runs the quick and browser tests on every push to a
`curiosities-*` branch and every pull request that touches `apps/curiosities/`
(`.github/workflows/curiomatic-tests.yml`). It runs them as three parts side by side, so a run fits the job time
limit: `--shard 1/3` (and `2/3`, `3/3`) runs one part. Part 1 has all the quick checks; the browser and long
suites are dealt out longest first, using the rough `secs` each suite lists in `run-all.js` (give a new slow
suite a `secs`). The two every-control runs are each split in half by page (`every-control.js --part 1/2`).
On GitHub a failing suite's FAIL lines also appear as notes on the check's page, so you rarely need the log.

## Setting up the browser tests

    cd apps/curiosities && npm install && npx playwright install chromium

`npm install` also brings three.js r128, which the 3D pages need when the internet copy (cdnjs) is blocked;
`run-all.js` finds it in `node_modules/three` by itself. Elsewhere, pass `--three path/to/three.min.js` or set
`CURIO_THREE`. If Playwright is installed globally instead, set `NODE_PATH` to the global modules folder.

## What each suite covers

| Suite | File | What it proves |
|---|---|---|
| core | `core/check.js` | the shared files load with no page; database, traces, engine and bridge agree |
| database | `data/check-db.js` | every curiosity, suite and proximity is valid; the generated JSON files are up to date |
| engine | `engine/tests/run.js` | the engine's model, undo/redo of every command kind, saves, speed |
| engine bridge fuzz | `engine/tests/bridge-fuzz.js` | 20,000 malformed bridge messages: nothing throws, nothing odd is saved |
| screen | `screen/tests/run.js` | the Screen's levels, lanes, nodes, proximities, copy, paste and undo |
| momentum | `momentum/tests/run.js` | film profiles, the compass, attention and cue lanes |
| video | `video/tests/run.js`, `video/tests/browser.js` | taking a clip apart into lanes and applying it, with and without a browser |
| cloud saving | `sync/tests/run.js` | the (still switched off) cloud saving merges a project part by part |
| site files | `core/site-check.js` | every file the page loads is committed, so it works when hosted |
| desktop bridge | `desktop/check.js` | OSC and WebSocket messages for the desktop app |
| maya, resolve, unreal, blender | `*/tests/test_*.py` | the camera mapping and each add-on (Blender needs Blender) |
| screen / engine / momentum in a browser | `*/tests/browser.js` | each piece inside the real app, as a person uses it |
| flip book | `tests/flipbook.js` | the Storyboard: next, previous, wrap, Play and Pause, arrow keys, jump, duplicate and delete a scene, reload |
| save and open | `tests/save-open.js` | Save project to a file, New project, Open the file: everything comes back; a broken file is refused; History restores |
| every control | `tests/every-control.js` | every button, dropdown and checkbox on every page, on a laptop and a phone |
| whole-app stress run | `engine/tests/app-fuzz.js` | thousands of random clicks, undo chains, broken saved data |

## Writing a new test

- A folder's tests live in its own `tests/` folder: `run.js` with no browser, `browser.js` with one.
- A test is a plain Node program: print `ok <what>` for each check, and exit with 1 when any check failed.
  No test framework is needed.
- Add the new file to the list in `tests/run-all.js` so the one command runs it.
- When you fix a bug, first add a check that fails because of it, then fix it, so it can never come back
  unnoticed.
- `tests/every-control.js` finds new buttons and pages by itself. If a new control opens a system window
  (print, file picker), add its words to `SKIP` there.
