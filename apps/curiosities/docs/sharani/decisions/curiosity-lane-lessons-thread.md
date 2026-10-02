# Curiosity Lane lessons thread: decisions

Thread: "Apply the Curiosity Lane lessons". Jeremy's ask (his words #13 in `jeremys-words.md`): integrate every idea from the Curiosity Lane letter, keep building, decide alone, record each decision for review. Code in `apps/curiosities/engine/`, guide in `apps/curiosities/docs/engine.md`, branch `curiosities-engine` stacked on the beta branch (#16's contents). Started 2026-10-02.

Each decision says what was chosen and why. Any of them can be reversed.

## Where it lives

1. **A folder of its own, `engine/`.** Other threads own `app.js`, `workspaces.js`, `index.html` and the rest, so nothing of theirs is edited. The engine joins the app with one line in `index.html` (`<script src="engine/load.js"></script>`), added in this PR at the app thread's request (its PR has no `engine/` folder). `engine/index.html` also runs the engine on its own page.
2. **It opens from the Library menu** as "Engine", a full-page window over the app, rather than as a new tab in the bar. The bar is already full of workspaces, and the engine is a view of the whole film rather than one curiosity.
3. **Branch stacked on the beta branch.** The draft PR targets `curiosities-beta`, so its diff shows only the engine. It must not be merged (Jeremy merges, and #16 is never merged).

## The film model

4. **The host is My film** (the board), not Blender or Unreal. The letter says to build around a host whose clips code can read and write; the board is the one every other tool (Storyboard, Maya, Blender, Unreal, Resolve) already follows, so writing to it reaches them all.
5. **Rows are moments** (a panel of My film when read from it). "Read My film" makes one row per panel.
6. **Tracks are Master, Camera, and one per character** (two to start, from the scene's first speakers). This is the letter's clip matrix: tracks across, moments down.
7. **Starting lanes, from the letter's table**, using the app's own curiosities: Master has the feeling of the beat, strength of the feeling, setting, how often the angle changes, angles per scene, lighting and props; Camera has shot size, angle height, camera move, camera carry, move speed and lens length; each character has volume of the lines, size of gesture, character path, where they stand, and the era of the clothes (standing in for wardrobe). "Who is on screen" has no curiosity in the app yet, so it is not a lane yet.
8. **Feelings as a scale of energy**, for links that follow them: dreamlike, melancholy, loving, curious, absurd, joyful, anxious, fearful, triumphant, angry. My order; easy to change in `catalog.js`.
9. **Limits:** 64 moments, 16 tracks, 24 lanes per track, 200 links, 12 references. Big enough for a storyboard; small enough to stay instant.

## The rewrite and your edits

10. **Fixed order: your material, then automation lanes, then links, then pins.** The letter's rule: anything the engine can recompute is never stored; anything you did by hand is stored apart and laid on last.
11. **A change goes where the value came from.** Changing a cell that shows your material changes your material (and ripples through links); one that shows automation moves the automation point; one set by a link becomes a pin (so the link cannot undo it). "Pin it" always pins.
12. **The whole film is rewritten on every change.** It takes about 40 ms for the largest film (64 x 16 x 9 cells, 120 links), so a partial rewrite is not needed. The letter's rule (a partial rewrite must equal a full one) is applied where it matters, to sending: only what changed is sent to My film, and a test checks the board ends exactly as a full send would leave it.

## Links (proximities as data)

13. **A link stores exactly the letter's fields**: from (leader), to (follower), within (moments later), every (how often), does (the rule) and amount, plus an optional condition ("only when the leader is angry", "only when it rises") and an optional span of moments.
14. **Six rules:** follows (moves to the same place on its scale), opposes, steps up, steps down, moves the way the leader moved, becomes a value.
15. **A link fires when its leader changes.** At the first moment, the rules that describe a state (follows, opposes, becomes) fire too, so a follower follows from the start.
16. **A follower keeps its new value** in the moments after, until its own material changes or another link sets it there. Without this, "the cutting rate follows the feeling" snapped back one moment later.
17. **"Every N" is a pulse:** the link fires every N moments whether or not the leader changed (the letter's "every 2 bars").
18. **Chain reactions run up to 8 links deep**, and a link never fires twice into the same moment, so loops stop.
19. **The letter's starting links** are added to a new film: the cutting rate follows the feeling; the number of angles follows the feeling (75%); each character's movement while speaking follows their volume; the shot widens as the first character's movement grows (50%). The letter's point that "camera angle while movement is large" is a proximity, not a curiosity, is this last link.
20. **The app's own proximities can become links** (one button) where both of their curiosities are on your tracks, at 25% strength, as steps up, steps down or becomes.
21. **Picking two nodes in the cube opens the link form with both filled in**, instead of making a link at once, so you choose the rule.

## Undo and saving

22. **Every change is one undo step** (Jeremy's words #12), kept as a snapshot of the film per step, up to 300 steps. Undo history lasts while the page is open; it is not saved.
23. **Saved after every change** under `curiosities-engine-v1`, in a fixed key order with a fingerprint. Project files and autosave pick it up with everything else.
24. **Every change must survive a reload unchanged.** After each command the engine checks that saving and reloading would give back the same film; if not, it records it, and the tests fail on it. A first test version missed one kind of loss; this check caught it.
25. **Undo for everything else in the app** (My film, workspaces, storyboard, curated films, automations, tools) records each saved change and undoes by restoring the old value and reloading the page, because those parts each keep their own copy. Changes to the same part within 1.5 seconds are one step. Which tab is open and view choices are not recorded. It refuses if something newer changed the same part.
26. **Moving the whole app onto one shared state is proposed, not done**, because it means rewriting files other threads own. Sent to the app thread through the coordinator.

## Sending to My film

27. **Sending is a button, not automatic** ("send every change" is off at first), because My film holds one strand at a time and a send replaces a strand from the Shelf.
28. **"Take back from My film"** restores the strand that was there before the engine's first send.
29. **A curiosity is sent from the first track that holds it.** My film has no per-character values, so character lanes that are not board controls stay in the engine and are listed in History.
30. **The engine counts its calls to My film** and skips a send when the board already shows the result (the letter: measure speed in host calls).

## Analysis

31. **Scripts and shot lists first**, not video. A browser cannot find cuts in a video quickly; text can be read at once.
32. **Only values are kept.** The pasted text is read once and dropped (the app's rule: counts and ids only, never a script or a shot list that recreates a film). Rows are labelled "Scene 3 (exterior, night)" or "Shot 4".
33. **What a script gives, per scene:** interior or exterior, time of day, how much is said, how much is done, loudness (from ! marks, capitals, "shouting", "whispering"), the feeling (from a small word list I wrote), its strength (from punctuation), how many speak, how often the speaker changes (as a cutting rate) and how many angles to cover them. When a script has fewer than three scene headings, each row is two speeches instead.
34. **Carrying a lane** stretches the reference over your moments as an automation lane that holds between points. Carrying into a different curiosity maps by place on the scale (an analogy: the loudest moment there becomes the biggest gesture here).

## The cube

35. **Layers are every curiosity on any track**, in track order; a cell is empty where its track does not have that curiosity.
36. **Colour runs cool (low) to warm (high)** on each curiosity's own scale; the front face prints the values.
37. **Layers sit closer together when there are many**, so the cube reads as a cube rather than a long bar.
38. **Inside, lines show only the links that fired**, plus every link of the node you picked; drawing every link at every moment was unreadable.
39. **three.js r128**, already loaded by the app. Without it, the layers show as a flat grid.

## Testing

40. **The fake host enforces six rules measured on the real board** (panel count from Angles per scene, 1 to 8; only live controls can be set; setting a control takes it out of the strand; one strand plus an automation layer; strands repeat when short; reading the strand gives a copy). A browser test runs the same script on both; all six matched.
41. **Randomized tests**: random chains over all 27 kinds of change, undone to the start and redone to the end; random changes then a reload in a second copy of the app; 1,200 malformed messages per run; sending only what changed versus sending everything. Seeds are printed so any failure can be repeated.
42. **A browser walkthrough** reads My film, changes and pins cells, adds a link, analyzes a script, carries a lane, opens the cube, undoes, sends and takes back, runs the self-check, then makes 3,000 random clicks, key presses, wheel turns and hovers, reloads, and tests the app-wide undo.
43. **The self-check** (History) runs inside your real project: forty test changes, undone, then every saved part of the app and My film are compared with how they were. Nothing is left behind, including in Redo.
44. **The app's bridge was fed 20,000 bad messages** (`tests/bridge-fuzz.js`); nothing threw and nothing odd was saved, so there was nothing to send to the platform thread.

## Working with Jeremy

45. **His words are recorded verbatim and numbered** in `decisions/jeremys-words.md` (13 so far), and cited in the code by number. It is a shared file: every thread can add to it.
46. **Plain language** in every label and note in the engine's windows (his words #7).
47. **No games** (games come last).

## Round two (2026-10-02, after #17 was merged into the beta branch)

Asked by the coordinator: lift My film's 8-moment limit, load the curiosity database's links, write the shared-state move for My film as a patch, and print to the tool bridges. Branch `curiosities-engine-2`.

### Longer than 8 moments

48. **My film shows a window of the film**, as many moments as it has panels, rather than changing how many panels My film has. Its panel count is the Angles per scene control (1 to 8) in `app.js`, which another thread owns, and 8 angles is a real limit of one scene there. "Earlier moments" and "Later moments" move the window and send it.
49. **The storyboard is the host for a whole film.** It already keeps scenes of up to 24 panels. "Send the whole film to the storyboard" keeps the film there as scenes of 24 panels, named after the film and marked as the engine's, so sending again replaces them and your scenes are kept. "Read it as the film" turns storyboard scenes into moments (up to 64).
50. **Without the storyboard's own door, the engine writes its saved key and reloads the page**, then opens the engine again on the same tab. The door (`putScenes`) is a small patch for `storyboard.js` (handoff 02); with it there is no reload.
51. **A storyboard panel gets one value per curiosity**, from the first track that has it, as My film does. Each panel's caption line is the moment's name.

### The database's links

52. **The engine reads the database's export as it is** (`curiosities-links`: links with track hints, and groups), rather than asking for a second format. The database thread built it to the engine's link shape, so only the track ids were missing.
53. **An end goes on the track that already has its curiosity**, and a character curiosity goes on the first character's track, as the database thread asked. When no track has it, a suite brings the lane in (on the first track of the hinted kind, else Master); "Add every proximity that fits" never adds lanes.
54. **Suites come in one at a time.** There are 255 links and a film holds 200, and a suite is the unit the database groups by. A suite's links switch on and off together and can be removed together.
55. **Importing again updates in place** and keeps whether you switched a link off.
56. **"How often" becomes a link's chance**, decided by a fixed roll per link and moment, so the same film always comes out the same (undo, reload and tests agree). When the database's own export has no chance, links always fire.
57. **The database's effect size sets a link's amount** when the engine converts an older database itself, using the slider's starting value. With the database's own export, its amounts are used as they are.
58. **A link can stay inside one lane** ("within 2 moments of the feeling being angry, it becomes joyful": a setup and its payoff), when it looks at least one moment ahead and names the leader's value. This takes the database's 3 same-lane links.
59. **A lens's sliders are curiosities too** ("shotSize.headroom", "music.tempo"), with their scale from the database, so links and lanes can use them.
60. **The film's saved format is now version 2** (suites, a link's chance, the window). A version 1 film loads without a false "came back different" warning.

### Printing to the tools

61. **Every print goes through the bridge's "apply" message**, the door Maya, Blender, Resolve and Unreal already use. There is one way in for everyone.
62. **A new bridge message, "timeline", gives a tool the whole film**: every moment, every track, every curiosity. My film's panels stop at 8, and the tools key their cameras from what they read. The engine adds it to the bridge when it loads; a patch for `bridge.js` (handoff 03) makes it native.
63. **The plugins are not changed here.** Switching each plugin from "panels" to "timeline" is a small change in files the platform thread owns, so it is proposed rather than done.

### One shared state for the app

64. **A store the app moves onto one part at a time** (`engine/store.js`), rather than one big rewrite. Each part keeps its own saved key, so project files, autosave and old saves are unchanged.
65. **My film moves first**, as a patch for `app.js` (handoff 01), because the engine already treats it as the host. Its six direct changes become five commands; everything that reads `state` is untouched, because the store keeps one live object up to date.
66. **Undo is in place, without a reload**, for parts on the store, with Ctrl+Z on the page. The app-wide history (which reloads) stays for parts not moved yet and leaves the store's parts alone.
67. **A dragged slider is one undo step, and running automation is never one.** Automation rewrites its layer about eight times a second, so recording it would bury every real change.
68. **The patches were tested applied and not applied.** The engine works either way.
