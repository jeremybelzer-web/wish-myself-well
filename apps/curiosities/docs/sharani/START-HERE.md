# Sharani: start here

This branch, `curiosities-sharani`, is yours. Jeremy wants you to be able to change anything in it, including any choice Claude made. Nothing here goes into the main app until you and Jeremy agree.

The app is called **Curiomatic**. It breaks a scene into **curiosities**: single things you can look at and turn up or down, such as shot size, the clothes, the set, the feeling, or the joke. Every curiosity can be set by hand, moved automatically over time, or played live from a music keyboard. Its heart is **momentum**, the feeling that the film is going somewhere.

## How to run it

- **Fastest:** open the link Jeremy sends you (the Curiomatic app link). It is the whole app in one page and works on a phone or a computer.
- **From this branch:** download the branch (GitHub's green **Code** button, then **Download ZIP**). Open `apps/curiosities/index.html` in Chrome or Edge. Nothing to install.
- **Desktop app** (music keyboards everywhere, and the link to Maya, Blender, Resolve and Unreal): see `apps/curiosities/desktop/README.md`.
- **Inside Maya:** see `apps/curiosities/maya/README.md`.

A guided 15-minute tour is in `apps/curiosities/docs/beta/beta-tester-guide.md`.

## Where each window's code lives

All the app's code is in `apps/curiosities/`. Each file is plain JavaScript that runs in the browser, with no build step, so you can edit a file and reload the page.

| What you see | File |
| --- | --- |
| My film (the controls and the comic strip) | `app.js` |
| Storyboard (the flip book) | `storyboard.js` |
| The workspaces (Camera angle, Wardrobe, Emotion, Comedy…) and the bar | `workspaces.js` |
| Automate modules (Hold to play, MIDI learn) | `automate.js`, with the automation engine in `automation.js` |
| Cross-pollinate and Library > Prism | `prism.js` |
| Library > Curated films and the Shelf | `study.js` |
| Library > Share a film | `trace.js` |
| Library > Save project, Open, History | `project.js` |
| Library > Engine (timeline, links, cube) | `engine/` (guide: `docs/engine.md`) |
| Library > Momentum | `momentum/` |
| Archetype's 3D character map | `character-matrix/` |
| Tools inside workspaces (Camera, Light, Curves…) | `studio-*.js` |
| Library > Words | `glossary.js` |
| The list of curiosities | `catalog.js`, `library.js`, `story-curiosities.js`, `lenses.js`, and the curiosity database in `data/` |
| Look and colours | `styles.css` |
| VCV Rack and music keyboards | `vcv/` and `bridge.js` |
| Maya, Blender, DaVinci Resolve, Unreal | `maya/`, `blender/`, `resolve/`, `unreal/` |

For a fuller map, read `apps/curiosities/CLAUDE.md` (written for Claude, but plain).

## Every decision, so you can change it

Each part of the project was built by its own Claude thread, and each thread logged every choice it made, with the reason.

- Copies as of 2 October 2026 are in `docs/sharani/decisions/` on this branch, one file per thread. Jeremy's own words are in `jeremys-words.md`.
- The live logs keep growing in the project's shared files, under `decisions/`.

To overrule a choice, edit the line in the log (or add your own line under it), change the code it points to, and tell Jeremy. Claude will follow your version.

## Questions for you

Jeremy and Claude collected questions only you can answer, about how animators and film teams really work. They are in `docs/sharani/questions.md` here, and the live copy is in the project's shared files at `sharani/questions.md`. Short answers are fine, and so are "skip" and "wrong question".

## Things to know

- This is an early beta: things will break, and telling Jeremy where is the most useful thing you can do.
- The practice scenes are made up. Studies of real films keep only counts and ids, never scripts or dialogue.
- You can't push to GitHub until Jeremy adds you as a collaborator on the repository.
