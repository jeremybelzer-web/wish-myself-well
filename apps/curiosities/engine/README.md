# Engine

The Curiosity Lane letter, built for Curiosities: one shared state for a film, a rewrite in a fixed order, your own edits kept apart, links between curiosities as data with chain reactions, undo for every change, saving checked by fingerprint, the clip-matrix cube, and analysis of scripts and shot lists.

Read `../docs/engine.md` for what it is, how to use it, the gap analysis against the letter, and what is not done yet.

- Add to the app: `<script src="engine/load.js"></script>` after every other script in `index.html`. Library gets an "Engine" item.
- On its own: open `engine/index.html` (a stand-in plays My film).
- Tests: `node engine/tests/run.js` (Node, seconds) and `node engine/tests/browser.js` (Playwright and Chromium; `--three <file>` serves three.js locally when the CDN is out of reach).
