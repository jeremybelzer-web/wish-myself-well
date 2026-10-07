# Performance and recording

`transport.js` (`window.CurioTransport`), loaded by `index.html` after the Viewer.

- **Transport**: a small window that floats over every page: ⏮ first, ◀ back, ▶ Play, ▶| advance, ● Record. It drives the Viewer when it is open, else the Screen's own play buttons. 🎹 Learn puts any button on a MIDI key or knob.
- **Record** keeps a take: panel jumps in the Viewer, Storyboard page turns, Play and Pause, every curiosity or suite change (engine commands) and every Catalyst move (the engine's performance layers: Sparks, Elixirs, master nodes, MIDI, words, camera), each with its time.
- **Play take** puts them back at the same times. Catalysts play as their own performance layers (`take:<name>`) and are put back when the take ends; curiosity changes are sent again (each an undo step).
- **Performance ▾** in the Viewer's top bar: Transport, Record, Live inputs (`screen/triggers.js`), Catalysts (`screen/catalyst.js`).

Saved in `curiosities-performances-v1` (takes) and `curiosities-transport-v1` (window place, open, MIDI map).

Not the same as `momentum/perform.js` (`window.CurioPerform`, the attention meter for performers).

Tests: `node perform/tests/run.js`, `node perform/tests/browser.js`.
