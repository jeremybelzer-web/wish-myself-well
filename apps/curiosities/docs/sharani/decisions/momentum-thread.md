# Momentum thread: decisions

Thread "Momentum" (started 2026-10-02 16:47 UTC from Jeremy's message, Jeremy's words #14 to #17). Code: `apps/curiosities/momentum/`, branch `curiosities-momentum`, draft PR against `curiosities-beta`. Every choice below was made by Claude without asking. Mark any you want changed.

## The momentum note on every curiosity

1. **Every curiosity has a momentum note**, covering how it moves the plot forward, how it builds the themes, how it pulls attention onward, the cue it usually gives, and one thing to try. It also has a "pushes the story" score from 0 to 5. Reason: Jeremy's words #14, "each curiosity should have a reference to that element in them."
2. **84 notes were written one by one** (clothes, set and landscape, camera, lines, feeling, comedy, plot, music, light). The other 249 use their workspace's note with their own name in it, and are marked "From its workspace's note". Reason: all 333 get a real note today, and hand-written ones went first to Jeremy's examples (clothes, setting) and to what pushes plot hardest.
3. **Pushes the story, 0 to 5**: arc, want and need, stakes, the test and reveals are 5; clothes, color and effects are 1. Reason: plot curiosities move the story on their own, while look curiosities mostly color the moment unless they are used on purpose. This is Claude's judgment.
4. **The notes live in `momentum/notes.js`, not in the database rows**, because the database thread owns `data/`. The proposed database field (`CurioMomentum.FIELD`: push, plot, theme, pull, cue, tryThis, plus three sliders: "Pushes the story", "Points ahead", "Tied to a theme") was sent to the database thread through the coordinator.

## Attention

5. **13 attention families** group the 25 workspaces: Camera, Movement, Lines & voice, Feeling, Comedy, Wardrobe, Set & landscape, Light & color, Music & sound, Plot & character, Thought & focus, Effects, Cut & structure. Reason: 333 curiosities or 25 workspaces are too many slices for a pie chart, and these are the things an audience notices as different from each other.
6. **The five cues are Jeremy's list**: visual, audio, thought, movement, plot. Each family has a usual cue (Camera: visual, Lines & voice: audio, Comedy: thought, Plot & character: plot...), and a written note can override it (Setting: visual; Secret: plot).
7. **Quiet cues** count Jeremy's "non-action": a change down to nothing (music stops, a silence, someone goes still) is marked quiet. It still counts as one of the five kinds.
8. **How attention moves**: at each beat, the curiosity with the biggest change wins attention, weighted by how strongly its family draws the eye (faces 1.25, plot 1.2, voice and comedy 1.1, movement and music 1.0, down to light, wardrobe and effects at 0.7). Changes too small to notice (below 0.12) leave attention where it was. Reason: a change is what makes people look; faces and voices are known to pull hardest. The weights are guesses kept in one place (`FAMILY_PULL`) so they can be tuned or measured.
9. **The same curiosity changing again keeps attention where it is.** Reason: the audience is still looking at the same thing.
10. **The "too long" warning is per family, not per curiosity.** Two camera changes in a row still count as attention resting on the camera. Reason: Jeremy's thesis is about variety between kinds of curiosity.
11. **The default limit is 2.5 times the usual family stretch** in the films you compare with (about 23 seconds against Pulp Fiction). You can type your own. Reason: it adapts to the films you love instead of using one fixed number.
12. **Momentum reading (0 to 5)**: the "pushes the story" score of whatever holds attention, averaged over time, worn down once a family stays past the limit. It is labelled as a thesis.
13. **Panels have no clock**, so storyboards use "Seconds per panel" (3 by default). Curated films use their own beat times.
14. **Live mode follows My film**: each change to the board (by hand, automation or MIDI) is a beat at the real time it happened, and the meter climbs while nothing changes. Reason: Jeremy's words #17 about performing live.

## The charts

15. **A ring (donut) is used for the pie chart, with 8 colored families and gray for "Other"**. Colors stay fixed to the family, never to its rank. The palette was checked for color blindness against the app's paper color. Reason: past eight colors, people cannot tell them apart. The other families are named under the ring and in the table.
16. **The meter uses green, yellow and red with a symbol and a word** (● Fresh, ▲ Getting long, ■ Too long), never color alone.
17. **The timeline has a colored band (who held attention), cue letters, and a climbing line against the limit**, and pointing at it moves the meter to that moment. There is also a table of every stretch.
18. **Momentum opens from the Library menu, at the top.** Reason: it is the heart of the app. It is a window over the app, like Share a film, so it can be beside My film while you play.

## Film rates

19. **The default curated list is 12 films**: Pulp Fiction, Jaws, Mad Max: Fury Road, Paddington 2, Spirited Away, Parasite, The Grand Budapest Hotel, Get Out, Toy Story, Whiplash, Before Sunrise, Hot Fuzz. Reason: a spread of paces (very fast to very slow), genres (comedy, horror, animation, talk), and Tarantino for the north star. Jeremy's own favorites replace it when he sends them.
20. **Every number in that list is Claude's estimate, marked "estimate" everywhere it shows.** Only counts and shares are stored, never scenes, lines or shots.
21. **Any curated film can be measured** (Film rates, Measure). It joins the list marked "measured" with the same fields, so real numbers can replace guesses. Pulp Fiction is the default comparison.

## Working with the other threads

22. **Only one line of another thread's file was changed**: `index.html` loads `momentum/load.js` after the engine, inside PR #18, because the app thread prefers that a PR adding a folder also adds its own script tag. Other requests went through the coordinator (`/mnt/project-files/momentum/requests.md`): the app thread may add a momentum note at the top of each workspace; the database thread takes the momentum field; the platform thread adds the momentum core to `core/files.json`.
23. **Jeremy's words #14 to #17** were added to `/mnt/project-files/decisions/jeremys-words.md`.

## Sharani

24. **Questions for Sharani**: `/mnt/project-files/sharani/questions.md` (a copy is in the repo at `docs/sharani-questions.md`). 33 questions in plain language, with the most important marked ★: how animators really work, students, momentum and attention, performing live, our decisions to check, and working together.
25. **Her branch waits for the first build she can click through**, as Jeremy asked. It needs her GitHub username and Jeremy adding her as a collaborator.

## Round two (2026-10-02, from the coordinator's next items)

26. **Attention and cue lanes on the engine's timeline, without touching the engine's files.** `momentum/engine-lanes.js` reads the engine's result as a film, one beat per moment (row), and gives an attention lane (which family, how many seconds, past the limit or not) and a cue lane. They show in Momentum, under "On the engine". A `band()` shaped for the engine's own timeline is ready, and a hook to draw it there (`CurioEngineUI.addBand`) was requested from the engine thread.
27. **Each moment of the engine lasts "seconds per panel"** (3 by default), the same as storyboard panels. Reason: the engine's rows have no clock.
28. **A too-long stretch is answered with an engine link, never a hidden change.** The suggestion makes a curiosity of another family "move with" the one holding attention, scoped to that stretch only, on the same track when possible, and picks the follower that pushes the story hardest. You press "Add this link to the engine". It is one engine command, so Undo takes it back. Reason: links are the engine's way to say "when X, then Y", and you stay in charge.
29. **The Prism Compass scores each family on four things**: how often your films move from the current family to it (1.2), how much more time your films give it than yours (1.0), how long since it last held attention (0.7), and how hard it pushes the story (0.4). The current family is never the answer. Reason: what your favorite films do next is the strongest signal, then balance, then variety, then plot. The weights live in `CurioCompass.WEIGHTS`.
30. **"Which family follows which" is learned only from measured films.** Claude's estimated films don't have it, so the compass says when it is using shares only. Reason: inventing transition counts would be a second layer of guessing.
31. **"Make this move on My film" steps one live control of that family by one notch.** Reason: the smallest real change that moves attention, and easy to undo by hand.
32. **The meter goes out on its own MIDI output** (Web MIDI in `perform.js`), not through automation.js's MIDI. CCs: attention 20, momentum 21, family 22, compass 23, all changeable. Notes 60 to 64 mark the cue each time attention moves, and note 72 marks going past the limit. Reason: automation.js belongs to another thread, and a performer may want the meter on a different device than their patches.
33. **Bridge values use a new key prefix, `m:`** (m:attention, m:over, m:momentum, m:family, m:compass, each 0 to 1), so OSC reads `/curio/value/m/attention`. `perform.js` extends `CurioBridge.values()` at load, or uses `CurioBridge.addSource` if the platform thread adds it (requested). Reason: the desktop bridge already sends whatever `values()` returns, so VCV Rack and TouchOSC get the meter with no change to the bridge server.
34. **"Feel it" means a phone buzz plus a stage meter.** The phone buzzes when a family goes past the limit. The stage meter is a full-screen bar with the family name, the seconds and the compass's next family, readable from across a room, and it pulses red past the limit (still red without the pulse when reduced motion is on). Reason: a performer on stage can't read a chart.
35. **Perform follows My film's first panel**, the same as live mode in the Attention tab. It keeps running when the Momentum window is closed, until you press Stop.
