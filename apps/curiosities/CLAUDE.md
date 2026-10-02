# Claude — start here

Repository: https://github.com/jeremybelzer-web/wish-myself-well

Branch: `main`

App folder: https://github.com/jeremybelzer-web/wish-myself-well/tree/main/apps/curiosities

Clone that repo. Work only in `apps/curiosities/`. The rest of the repository is the Channel 2892 show. Leave `web/`, `bible/`, and `memos/` alone.

## What this product is

A live-action, animation, zine, comic-strip, and storyboard app. Every scene is made of three kinds of thing:

1. **Curiosities** — one measurable value in a beat. Shot size. A person crossing. A cup lifted. A camera that is locked, smooth, or handheld.
2. **Curiosity suites** — a named group of curiosities that fire together.
3. **Curiosity proximities** — when curiosity or suite X happens, curiosity or suite Y happens within a number of beats.

A model of a movie, a TV hour, or a video game is only those three. If a fact cannot be stated as a curiosity, a suite, or a proximity, it does not belong in the model.

## Read next

1. `HANDOFF.md` — the build brief and the study rules.
2. `CURIOSITIES-REVIEW.md` — every listed row is marked **keep**. Jeremy can change a row to **drop**. Honor a drop.
3. `catalog.js` — the curiosity list. `live: true` rows are the board controls.
4. `model.js` — eight suites and four seed proximities.
5. `app.js` — draws the strip, the paths, and which proximities are firing.
6. `study.js` — the Study tab and the Shelf.
7. `index.html` — open this in a browser. No build step.

State is `localStorage` key `curiosities-board-v2`.

## Already on the board

Thirty live controls. A comic strip. A stage on each panel: character dots, an object, and a camera path. Handheld is a wobble. Smooth is one line. Locked is a still frame. The Suite menu writes a suite into the controls. Seed proximities print under the strip when they match.

## The study view

The Study tab is built. A study is a trace: beat, which curiosities are on, which suites contain them, which proximities held. Counts and ids only. Do not paste scripts, lyrics, level dialogue, or a shot list that recreates a commercial film, episode, or game. Games mark whether the camera is authored or the player’s.

Tick a span of beats and keep one curiosity or one suite on the Shelf. Apply a strand and the board plays it panel by panel. Studies export and import as JSON. State is `localStorage` key `curiosities-studies-v1`. Read `STUDY-PLAN.md` for what comes next.

Keep the static files and the look of this folder. Do not add a second git repo inside `apps/`.
