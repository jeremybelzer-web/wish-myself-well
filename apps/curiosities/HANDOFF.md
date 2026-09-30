# Handoff — Curiosities storyboard app

Read this file first. Work only in `apps/curiosities/`. Leave `web/`, `bible/`, and `memos/` alone unless Jeremy points at a show rule you must match.

Jeremy wants a new chat for this app. This folder is that chat’s whole job.

## What he asked for

A storyboard app that builds a scene, shows how things move, and can study a movie, a TV hour, or a video game until the study is nothing but three kinds of object:

1. **Curiosities** — one measurable thing that can be on or off, or set to a value, in a beat. Camera height is a curiosity. A character crossing left to right is a curiosity. A cup lifted off a table is a curiosity.
2. **Curiosity suites** — a named group of curiosities that fire together. “Quiet confession” might be close shot + low volume + breath then speak + a smooth push in.
3. **Curiosity proximities** — when curiosity or suite X happens, curiosity or suite Y happens, within some number of beats. Proximities are measured from a work, not invented as morals. “When the camera goes handheld, gesture size tends to rise within two beats” is a proximity. It can be wrong for the next work. The model stores the count.

A finished model of a film, an episode, or a game level is a list of those three. No separate “plot summary” layer. If a fact cannot be stated as a curiosity, a suite, or a proximity, it does not go in the model.

## What the board must show

The current board redraws comic panels from a few live controls. The next board also shows motion:

- **Characters** move: path, speed, and whether they travel toward the lens, away, or across.
- **Objects** move: prop, door, screen, vehicle, weather. Same idea: path and speed, and whether the thing enters or leaves the frame.
- **Camera angles** stay (size, height, whose eyes).
- **Camera moves** are their own curiosities. A move is either **handheld** or **smooth**, or the camera is locked and does not move. A move can follow a person, follow an object, or search. Speed is its own value.

Show the path on the scene, not only as a word in a caption. A handheld move should look unsteady. A smooth move should look like one continuous line. A locked camera should sit still while people and objects travel through the frame.

## What already exists

Vanilla HTML, CSS, and JS. No build. Open `index.html`. State is `localStorage` key `curiosities-board-v1`.

| File | Job |
| --- | --- |
| `index.html` | Board, Catalog, Ensembles |
| `catalog.js` | `CURIOSITIES` array. `live: true` items are the controls |
| `app.js` | Draws the strip from those controls |
| `reference.js` | Hour-shape notes. Structural counts only. Not episode recaps |
| `styles.css` | Paper and ink, same family as the show site |
| `CURIOSITIES-REVIEW.md` | The list Jeremy will mark keep or drop |

Fifteen controls are live. The catalog is a starter, not the full list. Do not treat the Catalog tab as finished.

Parent repo: `https://github.com/jeremybelzer-web/wish-myself-well` on branch `main`. This folder ships inside that repo. Do not create a second git repo inside `apps/`. Do not commit `memos/`. The repo is public.

## Show rules that touch the Story curiosities

These changed in the show after the first catalog was written. Match them when you touch `mains`, `groups`, and `exit`. Do not rewrite the show to match the old catalog.

- An hour follows two to four people in one place.
- The series has many mains. Most of them never share a scene.
- The world shows up in the relationships inside that place, and in a few crossings: a seva shift, a shipment, one shared question.
- A main may stay, leave alive, or die.

## How to study a work

Input is a scene Jeremy names, a timecode he gives, or notes he types. Output is a trace: beat → which curiosities are on → which suites contain them → which proximities fired.

Store counts and curiosity ids. Do not paste scripts, lyrics, level dialogue, or a shot list that recreates a commercial film, episode, or game. The other show in `reference.js` is a shape (how many companies, how people exit), not a retelling. Keep that rule for every title he asks you to model.

Games use the same three objects. Mark whether the camera is the player’s or an authored camera. A played minute is a scene.

## Build order

1. Wait for Jeremy’s marks on `CURIOSITIES-REVIEW.md`. Add only the rows he keeps. Drop the rows he excludes, including starter rows if he says so.
2. Add suites as data, then proximities as data. A suite references curiosity ids. A proximity references two ids (curiosity or suite), a direction (X then Y), and a window in beats.
3. Teach the board to draw character paths, object paths, and camera moves (handheld or smooth).
4. Add a study view: load a trace, show the suites, show the proximities. A control that plays one suite should light the curiosities inside it.
5. Keep it static files. Keep the look of this folder.

## Out of scope

The Channel 2892 comic, the landlord letter, the voice memos, and new show episodes. If a task needs the show bible, stop and say so.
