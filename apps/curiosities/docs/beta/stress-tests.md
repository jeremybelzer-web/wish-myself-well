# Stress tests: how to rerun them

The Curiosity Lane letter's lesson is that most bugs are found by random tests, not by hand: random clicks, random
undo and reload chains, and bad data fed into every door. These are the runners for the whole beta app. Anyone can
rerun them, and each prints a seed so a failure can be repeated exactly.

## What you need

- Node 18 or newer.
- Playwright and its Chromium (`npm install playwright`, then `npx playwright install chromium`). If Playwright is
  installed globally, set `NODE_PATH` to the global modules folder, for example
  `NODE_PATH=$(npm root -g)`.
- three.js comes from the internet (cdnjs). Where that is blocked, download three.js r128 once
  (`npm pack three@0.128.0`, then unpack it) and pass `--three path/to/build/three.min.js`.

Run every command from the repository root.

## The whole app

    node apps/curiosities/engine/tests/app-fuzz.js --events 12000 --chains 6

This takes about half an hour. It runs four parts, and `--only monkey,chains,keys,bridge` picks some of them:

1. **monkey**: every page the app has gets its share of the random events. That covers My film, the
   storyboard, every workspace, every Library page, the engine and momentum. The events are clicks, key
   presses, wheel turns, hovers and changed values. Any page error or console error fails the run, reported
   with the page and the last action.
2. **chains**: random changes on random pages, then undo all the way back. Every saved part must come back
   exactly. Then redo, then two reloads, and neither reload may change anything.
3. **keys**: every saved part gets malformed values one at a time: not JSON, the wrong type, empty, huge,
   and a prototype trick. After each one the page reloads and every page opens. The app must ignore or
   repair what it cannot read, never break.
4. **bridge**: thousands of malformed bridge messages (the door VCV Rack, Maya, Blender, Resolve and Unreal
   use). Nothing may throw, and nothing odd may be kept.

Options:
- `--seed N` repeats a run.
- `--events N` sets the number of random events.
- `--chains N` sets the number of undo chains.
- `--out report.json` saves every failure with details.

The exit code is 1 when anything failed.

## The engine

    node apps/curiosities/engine/tests/run.js                 (no browser, seconds)
    node apps/curiosities/engine/tests/browser.js             (the engine inside the app, 3,000 random events)
    node apps/curiosities/engine/tests/bridge-fuzz.js         (the bridge with no page, 20,000 messages)

## The shared core

    node apps/curiosities/core/check.js

## When something fails

The line says which page or saved part, what happened, and the last random action before it. Rerun with the
same `--seed` to see it again. Fixes in a thread's own files go in that thread's PR. Fixes in another thread's
files go as a patch in `/mnt/project-files/engine-handoff/`, for the coordinator to pass on.
