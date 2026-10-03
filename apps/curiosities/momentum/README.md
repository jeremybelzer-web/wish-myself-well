# Momentum

The heart of the app (Jeremy's words #14 to #16): the feeling that a film is going somewhere important. An audience can pay attention to only one thing at a time, and when what holds it keeps moving between different curiosities, the film stays rich and engaging. Momentum shows how long attention rests on each kind of curiosity, warns when one runs too long, and records the cue that moved it on.

Open it from **Library, Momentum** (once `<script src="momentum/load.js"></script>` is in `index.html`), or on its own page: `momentum/index.html`.

## What you see

- **The meter**: how long one family of curiosities has held attention, against a limit. Green means fresh, yellow means getting long, red means too long. With "My film, live" it follows what you play or perform, and it keeps climbing while nothing changes. For any other film, point at the timeline to see the meter at that moment.
- **Four numbers**: the momentum reading (how hard whatever holds attention pushes the story, worn down when it stays too long), how many times a minute attention moves, the usual rest, and the longest rest.
- **The ring (pie chart)**: what share of the time each family held attention. Eight families have their own color; the other five are gray and listed under "Other".
- **What moved it on**: the share of each cue (visual, audio, thought, movement, plot), plus quiet cues, where something stops: the music cuts out, a silence falls, someone goes still.
- **The timeline**: who held attention when, a letter for the cue at each move, and a line that climbs while one family holds attention and drops when attention moves. The red part is past the limit.
- **How attention moves**: every move from one family to another, counted: how many times, the cue that made it most often, how often it came from something stopping (a quiet cue), which curiosities took attention, and the cue the films you compare with use for the same move (measured films only). This is Jeremy's question of which action or non-action moves attention, and to where. The Compass uses the same counts: when your measured films make a move mostly on one cue, it suggests that cue. Beside the Screen's Player each meter also says where attention came from and on which cue.
- **Held too long**: every stretch past the limit, with a different kind of cue to try.
- **Compared with**: your film against a film you love, or the average of several, in plain sentences.
- **Film rates**: the default curated list (Claude's estimates, marked as estimates) and any traced film you measure.
- **Momentum notes**: every curiosity's note on how it moves the plot forward, how it builds the themes, how it pulls attention onward, and one thing to try. This covers clothes and landscape too.

- **Compass** (the Prism Compass): where attention should go next. A needle points at the family to move to, chosen from how often your films move from the current family to each other one (once you have measured a traced film), how much more time your films give each family, how long since it last held attention, and how hard it pushes the story. The top three come with reasons, a curiosity to try, and **Make this move on My film**, which steps one live control of that family by one notch.
- **On the engine**: the engine's timeline (Library, Engine) as the audience would watch it, with an attention lane and a cue lane, one cell per moment. Every stretch past the limit gets a suggested engine link: the curiosity holding attention leads one from another family, so its next change moves attention on. **Add this link to the engine** is an ordinary engine command, one undo step.
- **Perform**: follow My film live and send the meter out while you perform. MIDI control changes go out (attention CC 20, momentum CC 21, family CC 22, compass CC 23; the channel and numbers can be changed), with a note each time attention moves (60 visual, 61 audio, 62 thought, 63 movement, 64 plot) and note 72 past the limit. The desktop app's bridge sends the same values (OSC `/curio/value/m/attention`, `m/over`, `m/momentum`, `m/family`, `m/compass`, 0 to 1, and the same over WebSocket). A phone buzzes past the limit, and a full-screen **stage meter** can be read from across a room.
- **Beside the Player** (the Screen, CapCut layout): a Momentum panel docks at the right edge of the Player and follows its playhead. It shows a meter for My film and one for each inspiration film in the Player: the family holding attention at that moment, how long it has held it against the limit (● Fresh, ▲ Getting long, ■ Too long), and a ribbon of the whole film colored by family. Click a ribbon to move the playhead. Under them the Compass says where to move attention next, compared with the films on screen (untick to use the Momentum window's list), and **Make this move here** writes a node at the playhead: one curiosity of that family one notch along its scale, one undo step. **›** folds it to a slim meter; **Open** opens the whole Momentum window. In the "Player on the right" layout and on a phone it sits under the Player. It reads My film the way the Player does (one value per curiosity: Master, then Camera, then the characters), so it agrees with the Player's "Attention:" label.
- **Momentum curve**: a graph of momentum over the whole film, one value from 0 (stalled) to 5 (surging) for every moment: how hard the curiosity holding attention pushes the story, worn down while one kind of curiosity stays past the limit, smoothed over 15 seconds (8, 30 or 60 to choose). ▲ marks where the film surges, shaded stretches are sags (momentum under 2 for at least 8 seconds), and the film is split into a beginning, a middle and an end, each a third of its length. One curated film can be laid over it as a gray dashed line, stretched to the same length so the shapes compare. Point at or tap the line to see the moment, its value and what held attention. Under the chart every sag says when it happens, how long it lasts, what held attention and one thing to try (from the Compass at that moment); on the engine's film, **Go to moment N on the Screen** moves the Screen's playhead there.
- **On the Storyboard** (where you flip through panels): under each scene's panels (All scenes) and under the flip book's small pictures (Flip through) an attention strip has one cell per panel, colored by the family holding attention there. A letter marks where attention moved to a new family and the cue that moved it (V visual, A audio, T thought, M movement, P plot; a dot first means a quiet cue). ▲ marks a family getting long and ■ one past the limit (point at a cell for the words). Click a cell to see that panel in the flip book. Under the flip book's buttons a small meter follows the panel on show, also while it plays: the family, how long it has held attention against the limit, and where it came from. Each panel lasts the **Seconds per panel** set here.

- **Who we watch**: attention by character, for the engine's film (the only film with a track for each character). Whose change took attention at each moment, so you see the share of the time each character holds attention (a bar each, with seconds), the longest time each one goes unwatched (● Fresh, ▲ Getting long, ■ Too long), who never takes attention, a strip of who holds attention moment by moment (click a moment to move the Screen's playhead there), the families each one pulls attention with, and plain warnings such as "Ida has not held attention for 40 seconds". Master and Camera count as the film itself. By default a character may go twice the limit (at least 30 seconds) unwatched.

## Films it can read

My film live, My film's panels, the engine's timeline, any storyboard scene, the whole storyboard, and every curated film (your studies, shared traces, and the made-up practice scenes). Panels have no clock, so **Seconds per panel** sets how long each one lasts (3 by default).

## How attention is worked out

1. At each beat, every curiosity whose value changed could take the audience's attention.
2. Its pull is the size of the change (steps along its scale), times how strongly its family draws the eye (faces, voices and plot pull hardest), nudged up by how much it pushes the story.
3. The strongest one takes attention if its pull is big enough. Otherwise attention stays where it was. The same curiosity changing again keeps attention where it is.
4. Attention stays until something else takes it. A family that holds attention past the limit gets a warning. By default the limit is 2.5 times the usual family stretch in the films you compare with. You can set your own.

These are guesses about how people watch, kept as plain numbers (`FAMILY_PULL`, `SHIFT_MIN` in `attention.js`) so they can be tuned or replaced by measurement.

## Files

| File | What it does |
| --- | --- |
| `notes.js` | `window.CurioMomentum`: the 13 attention families, the 5 cues, and a momentum note for every curiosity (84 written one by one, the rest from their workspace's note). `FIELD` is the proposed database field. |
| `attention.js` | `window.CurioAttention`: reads a film into attention stretches, statistics and warnings; `live()` records a performance. |
| `rates.js` | `window.CurioRates`: the default curated list (estimates), `measure()` for traced films, `compare()`, `average()`. |
| `compass.js` | `window.CurioCompass`: `point(reading, profiles)` gives the needle and the options; `move(option, board)` gives one notch on a live control. |
| `engine-lanes.js` | `window.CurioMomentumEngine`: the engine's film read as attention, `lanes()`, `suggestions()`, `addSuggestion()`, `band()` in the shape an engine timeline band could draw, `flatBeats()` (the Player's view of My film), and `moveAt(option, row)` / `applyMove()` (a Compass move as a node on the engine). |
| `perform.js` | `window.CurioPerform`: follows My film live and sends the meter to MIDI, the bridge (`CurioBridge.values()`), a phone buzz and the stage meter. Settings: `curiosities-momentum-perform-v1`. |
| `screen-panel.js` | `window.CurioMomentumScreen`: the panel beside the Screen's Player (`attach`, `detach`, `mount(el, { row, setRow })`, `read()`). Docks through the Screen's own hooks (`CurioScreen.addPanel` with `place: "player"`, `row()`, `setRow()`, `on()`); with an older Screen that lacks them it puts itself in the Player and reads the playhead from its text. Its own setting: `curiosities-momentum-screen-v1`. |
| `curve.js` | `window.CurioCurve`: `curve(beats, opts)` gives `{ points, peaks, sags, thirds }` (pure, works in Node), `stretch(points, seconds)` lays one film over another's length, and the **Momentum curve** tab. Its own setting: `curiosities-momentum-curve-v1`. Tests: `node momentum/tests/curve.js` and `momentum/tests/curve-browser.js`. |
| `storyboard-strip.js` | `window.CurioMomentumStoryboard`: the attention strip under the Storyboard's panels and the flip book's meter. `model(scene, { secondsPerPanel, limit })` gives one cell per panel (works in Node); `attach()`, `detach()`, `refresh()`. It watches the Storyboard's page for its reels and its current panel, so `storyboard.js` is unchanged. Test: `node momentum/tests/storyboard-strip.js [--browser]`. |
| `characters.js` | `window.CurioWatch`: `watch(film, opts)` (film: `{ rows, tracks, value(row, track, curiosity) }`) gives each character's time holding attention, longest stretch unwatched and families, a strip of who holds attention per moment, and warnings; `fromEngine(opts)`. Adds the "Who we watch" tab. |
| `ui.js`, `momentum.css` | The Momentum window and the Library menu item. `CurioMomentumUI.mountNote(el, id)` puts one curiosity's note anywhere, for example in a workspace. |
| `load.js` | Adds everything to the app's page with one script line. |
| `files.json` | The load order: `core` (no page) and `screens`. |
| `tests/run.js` | `node momentum/tests/run.js`: checks with no page. |
| `tests/browser.js` | `NODE_PATH=/opt/node22/lib/node_modules node momentum/tests/browser.js --three <three.min.js>`: the window in a real browser, live mode, phone width, and the panel beside the Screen's Player. |

Saved choices: `localStorage` key `curiosities-momentum-v1`.
