# Study view plan

Status: plan only. Not built. Jeremy says go before any code changes.

This is step 4 in `HANDOFF.md`. It borrows the working parts of Jeremy's music app, where curiosities are called essences. The two music-app notes are in `reference/`.

## What the music app teaches

The music app's engine is the **Essence Shelf**. You lift one strand out of a moment (melody contour, rhythm, note order, chords), keep it, and drop it onto your own material. That is the "swap in one slice" idea behind the name Curiosities.

Jeremy tests every curiosity with six questions:

1. Can it be extracted from a work?
2. Can it be applied to your own scene?
3. Can it be expanded (varied, developed)?
4. Can it be automated (a lane, a MIDI device, a body sensor)?
5. What game makes changing it fun?
6. Would that game want a gizmo (MIDI joint sensors, VR, a guitar neck)?

The goal is "A is to B as C is to D". A is a moment in a work, B is how the work developed it, C is your moment, and D is what you get by applying the same curiosities. You model the choices, not the work.

## The study view

- **A study.** You name a film, an episode or a game. Games mark whether the camera is authored or the player's. You add beats by timecode or by a short note.
- **A trace per beat.** Each beat stores curiosity ids and values only. The view shows which suites match and which proximities fired.
- **The Shelf.** You select a span of beats and keep one curiosity (camera carry across 8 beats) or a whole suite. You can then apply it to the board's beats.
- **Three tabs, like the music app's search windows.** Curiosity, Suite and Proximity, over all saved studies.
- **Counted proximities.** Each trace tallies how often "when X, Y within N beats" held. The four seed proximities in `model.js` get real counts.
- **Play a suite.** A control that lights the curiosities inside a suite on the board.
- **Six columns on the Catalog.** Each curiosity gets the six answers above. The game and gizmo cells are for Jeremy and Sharani to fill in.

Static files, same look, state in `localStorage` beside `curiosities-board-v2`.

## Rules that stay

Counts and ids only. No scripts, lyrics, level dialogue, or shot lists that recreate a commercial work. Short clips only if clips ever enter the app, because of copyright.

## Later

- Automation lanes and live control (MIDI body-joint sensors, a played instrument triggering a suite).
- Lighting and camera terms from 3D tools such as Arnold for Maya, with Sharani.
- Games. The music app plans five, and each maps here:
  - **Decision Tree**: your scene runs down a tunnel, and an inspiration work forks off where it changes a curiosity.
  - **Planets**: a shot size is a planet, its moons are the moves that can follow, and grayed moons lead to other setups.
  - **Galaxy**: how close a scene's suite pattern sits to known works.
  - **Flip Book**: each flip swaps one curiosity in a comic panel.
  - **Play-along**: a played note triggers a curiosity or suite live.

Every game draws from the Shelf, which is why the Shelf comes first.
