# Curiosities app: roadmap

A checklist for building the app, one item at a time. Tick a box (`[x]`) when the item is done.
Items are in the order we plan to build them. Anything marked **(beta)** is needed for the first version people can try.

The "Roadmap and curiosity database" thread keeps this file up to date. Other threads send their updates to it.
A copy lives in the project files at `roadmap.md`.

## The idea in one paragraph

You pick a finished film you love. The app splits it apart, the way a prism splits white light into colors, into
**curiosities**: one aspect of a scene you can look at on its own, like the lighting, the clothes, the music, or how
the camera moves. Each curiosity has sliders that go from one setting to another (from dark to bright, from cheap
clothes to expensive). Every curiosity and every slider can be **automated**: switched on and off by a button, a key
or a MIDI pad, and moved over time by a knob, a wave (an LFO, like on a synthesizer) or a modular synth such as
VCV Rack. You then drop any of those pieces onto a moment of **your own** film. The first version is a
**storyboard**: lots of drawn panels you flip through like a flip book.

**The four levels**

| Level | Plain meaning | Example |
| --- | --- | --- |
| Curiosity | One way of looking at one aspect of a scene, with its own sliders | Music: how loud, how fast, heard by the characters or only by us |
| Curiosity suite | A few curiosities you look through together | "Needle drop": a famous song, loud, with cuts on the beat |
| Curiosity proximity | When one thing happens, another tends to follow within a few beats | When the music stops, a big line lands within one beat |
| Proximity suite | A few of those cause-and-effect pairs that work together | "Music steers the edit" |

## Already built

- [x] Storyboard strip that redraws panels from controls, with character paths, object paths and camera moves (PR #1 to #3)
- [x] Study tab: trace a film as curiosities only, keep pieces on a Shelf (PR #1)
- [x] The filmmaking catalog loaded: 157 curiosities, 49 suites, 15 proximities (PR #3)
- [x] Every curiosity, suite, proximity and proximity suite can be automated: on/off trigger, sliders with from, to and a curve, knob, LFO or MIDI (PR #4)
- [x] Prism: split a curated film into its curiosities and drop any of them onto a moment of your film (PR #4)
- [x] Workspaces instead of tabs, each with "In my film", "Automate", "Cross-pollinate" and "Tools" (PR #4)
- [x] Maya and Arnold tools in the workspaces (PR #4)
- [x] Story workspaces: character arc, personal plot, perspective, focus, archetype, herd mentality (PR #4)
- [x] Lens workspaces with graded sliders: color, wardrobe, set design, emotion, emotional road, comedy, comedy from the mix (PR #4)
- [x] Suites graded by how much of them matches, instead of all or nothing (PR #4)
- [x] Storyboard page that keeps many scenes and flips through them like a flip book (PR #4)
- [x] 3D character matrix: 18 personality axes, nine Enneagram types, health 1 to 9, dramatic roles (PR #6)
- [x] Plan for saving and for web, desktop, Maya and VCV versions (PR #5, plan only)

## 1. The curiosity database **(beta)**

One list of everything the app knows how to look at, so every workspace reads from the same place.
Lives in `apps/curiosities/data/` (in the test version since PR #47). Today: 591 curiosities, 367 suites,
733 proximities, 148 proximity suites and 11,894 sliders, across 32 workspaces, plus 24 model scenes.

- [x] Set up the database: the four levels, sliders with a from, a to and a curve, plain descriptions, workspace for each item
- [x] Bring in every existing curiosity, suite and proximity from the catalog
- [x] Music for the scene, and no music, as curiosities with their own sliders
- [x] Emotion, with its channels (movement, voice, face, posture, how much is said, contrast with the last scene)
- [x] Comedy as a central set of curiosities (timing, escalation, deadpan to broad, callbacks, running gags, rule of three...)
- [x] Wardrobe for main and background characters (era, cost, skin coverage, usefulness, wear...)
- [x] Set design (style, materials, sharp or soft lines, art on the walls and how it is hung, clutter, layout)
- [x] Color (palette, filters, black and white, saturation, warm to cool)
- [x] Lighting as a lens with sliders
- [x] Character matrix axes, health and role as curiosities
- [x] Suites, proximities and proximity suites for all of the above
- [x] A checker that makes sure every item is complete and every link points somewhere real
- [x] A JSON copy of the database for other tools (Maya, the desktop app)
- [x] Give every older catalog curiosity at least three sliders of its own
- [x] Merge with the app's own lens list (lenses.js) so nothing is listed twice
- [x] Switch the database on in the app: one block of script lines in index.html (PR #7, tested: all 25 workspaces open with no errors)
- [x] Workspaces read their curiosity lists from the database (app thread, PR #4)
- [x] Fill the thin workspaces: Personal plot, Perspective & mindset, Focus, Herd mentality and Page & panel now have their own suites and proximities (data/db-story.js)
- [x] Deeper comedy and emotion: comic flaw, premise, topper, oddly specific, talking to camera, exaggeration, humiliation, the lie that grows, misunderstanding, cutaways; mixed feelings, said against meant, eyes, hands, personal space, release, what the audience feels, catharsis, feeling held in; real sliders on every comedy and emotion row (data/db-feeling-comedy.js)
- [x] Deeper Comedy from the mix and Emotional road: the double act, the straight man, the odd one out, clash of egos, who knows what, the unwanted guest, chemistry; hope, what they stand to lose, breathers, false highs, two roads, a feeling that comes back, warmth, dread (data/db-mix-road.js)
- [x] Deeper Character arc and Movement with lines: which way they change, the lie they believe, the old wound, fighting the change, the test, slipping back, how the change shows; walk and talk, business with a prop, move on the line, the listener's body; plus suites and proximities for Camera angle and Character motion (data/db-arc-body.js)
- [x] Every curiosity carries a momentum note: how it moves the plot and the themes forward, how it pulls the audience's attention onward, its usual cue, how hard it pushes the story (0 to 5) and one thing to try; plus three sliders every curiosity shares (pushes the story, points ahead, tied to a theme) so momentum can be automated (data/db-momentum.js)
- [x] Editing curiosities from Final Cut Pro and CapCut: transitions, filters and adjustments, text and captions, speed and timing, the audio mix, layers and masks, the frame, CapCut's transition and effect families, and mood stickers that feed the emotion curiosities (Main layout thread, moved into data/db-editing.js)
- [x] Character tab on the Screen: each character track has its own matrix lanes (18 axes, health, role); the 3D matrix opens over the Screen linked to the film, every edit a timeline node (draft PR #31)
- [x] Every curiosity tied into the four levels: each is the cause or effect of at least one proximity and in at least one suite (data/db-ties.js: 223 proximities, 55 suites, 45 proximity suites)
- [x] Comedy and emotion, deeper: 28 comedy curiosities (the button, the joke that falls flat, cartoon rules, cracking up, the record scratch ...) and 23 emotion curiosities (empathy, awe, shame, guilt, pride, jealousy, grief, betrayal, forgiveness, the feeling left when the film ends ...), each with its own window, phrases and live picture (data/db-heart.js)
- [x] Thin workspaces, deeper: 22 music and sound curiosities (tempo and key changes, a character's own tune, someone humming, repeating notes that build tension, music that warns us early, handmade sounds, the sound of the place, hearing through their ears ...), 25 story and attention curiosities (what starts it all, the reversal, a choice with a cost, no going back, the forgotten plant, where the eye goes first, what we do not see, blind spot, the crowd turns, a rumor spreads ...) and 22 cut, speed, text, frame and color curiosities (holding before the cut, a hidden cut, time-lapse, stretching a moment, texts on screen, the title drop, frame within a frame, a color for each character ...), each with its own window and tied into the four levels
- [x] Acting, camera, place and page, deeper: 20 curiosities for line delivery, movement and camera moves (cut off mid-sentence, a speech that builds, one side of a phone call, a habit of their own, making an entrance, squaring off, a slow push in on a face, the stretching background shot ...) and 21 for background, set, placement and comic pages (danger behind their back, the season, crossing the doorway, a mirror in the room, who stands higher, a line between them, a full-page picture, a panel with no words ...), each with its own window
- [x] Momentum: attention meter, pie, timeline, cues, momentum notes, film rates, the Prism Compass, attention lanes on the engine and a performable meter (PRs #18, #20, #21); the meter beside the Screen's Player (draft PR, Momentum thread)
- [ ] Jeremy and Sharani review the database and mark rows to keep, rename or drop. The review page is ready: https://claude.ai/artifact/MRmTHSusCBtFhkXgkBXoY8 (share it with Sharani from its Share menu)
- [x] The three new workspaces (Music & sound, Editing & structure, Page & panel) show as tabs: Music under a new Sound group, Page under Look, Editing under Story (app thread). Jeremy can still say no.

## 2. Storyboard beta **(beta)**

- [x] Many panels per scene (up to 24 per take, tested at 768 panels in a scene) (PR #4)
- [x] Flip-book playback: flick through panels at a speed you choose (PR #4)
- [x] Each panel shows the curiosities that are on, in plain words, under the drawing, like a comic caption (PR #4)
- [x] Draw wardrobe, set and color changes on the panel, simply (not full renders) (PR #4: wardrobe, set, color, emotion and comedy marks)
- [x] Music and silence shown on the strip as a band under the panels (PR #4)
- [x] Emotion shown as a line across the panels, per character (PR #4)
- [x] Comedy beats marked on the strip (setup, payoff, callback) (PR #4)
- [x] Print or export the storyboard as images or a PDF, zine and comic layouts included (PR #4)

## 3. Prism and cross-pollinating **(beta)**

- [x] Eight made-up model scenes (diner standoff, meet-cute, dinner party, dark hallway, montage, deadpan office, quiet goodbye, kitchen disaster) so the Prism has something to split on first open (PR #7)
- [ ] Jeremy picks three to five real films or scenes to trace for the Prism (counts only, never scripts)
- [x] Show the model scenes as curated films in the app, marked "made up for practice" (app thread)
- [x] Eight more model scenes built on the new comedy and emotion curiosities (funeral giggles, toast that bombs, car betrayal, cartoon chase, canyon awe, sisters forgive, talent show, jealous party) in data/db-model-scenes-2.js
- [x] Eight more model scenes built on the new music, story and cut curiosities (a heist plan, a town rumor, a first day seen through a phone, a band's first gig, a rooftop chase, a crossroads choice, a station reunion, a night shift) in data/db-model-scenes-3.js
- [x] Prism splits by the new lenses too: music, wardrobe, set, color, emotion, emotional road, comedy and comedy from the mix (grouping in PR #4; every model scene now has values through every lens, tested)
- [x] "A is to B as C is to D": take one slice of a film and fit it to a different moment of yours ("Make it an analogy" on every Prism row, PR #4)
- [x] Emotional roadmap: the feeling of each character and the whole film, scene by scene, that you can borrow from a curated film ("Borrow this film's emotional road", PR #4)

## 4. Automation and performance

- [x] Trigger any item on and off from a key, a button or a MIDI note
- [x] Move any slider with a knob, an LFO or a MIDI control, and send it out to VCV Rack
- [x] Every database item shows up as automation lanes: all 393 curiosities, 204 suites, 190 proximities and 51 proximity suites (tested). Suites have Blend and a Weight lane per member, with the database's weights
- [x] Wearable MIDI (straps, gloves) presets for performers: Dancer, Actor and Comedian, with step-by-step learn and undo (PR #4)
- [x] Pads and keyboards: a ready layout of the most used curiosities (16 pads, 25 keys, 8 knobs, printable cheat sheets, PR #4)

## 5. Saving and platforms

- [x] Safe saving: one project file (`.curio`), Save and Open, autosave history (Phase 0 of the plan, PR #4)
- [ ] Split the core from the screens so web, desktop and Maya share it (Phase 1)
- [ ] Web app online, free to open, works offline (Phase 2)
- [ ] Logins and cloud sync, optional (Phase 3)
- [ ] Desktop app (Phase 4)
- [ ] Panel inside Maya, with curiosities driving the camera and keys (Phase 5)
- [ ] VCV Rack module with a jack per curiosity (Phase 6). Built (PR #9, in the test version): a jack for each of the 1,839 items through VCV's own CV-CC modules, ready-made Rack files and a VCV badge in the app, plus a generated plugin (named jacks, OSC to the desktop app, a gate per item, and a Return module for values coming back). The extra jacks past the first 105 modules now go on a second MIDI cable, so the database can keep growing. Next: someone with VCV Rack opens the files and builds the plugin
- [ ] Other tools: Unreal, Blender, Resolve (Phase 7)

## 6. Checks with people

- [ ] Sharani checks the Maya topics written from memory and the lighting, shading and effects curiosities
- [ ] Jeremy or Sharani checks the nine Enneagram patterns in the character matrix (they were estimated)
- [ ] Jeremy answers the open questions in the platform plan (cloud cost, clips, which tool after Maya, pricing)
- [ ] Try the beta with a few filmmakers, film students and performers

## 7. Later

- [ ] Finished-film output and AI video, after the storyboard beta
- [ ] Heavier simulation (cloth, fur, water) beyond what is there now
- [ ] A shared library where users add their own curated films (counts only)
- [ ] Short clips for study, within copyright limits

## 8. Last: games

Jeremy asked that games come last, once the curiosity model is filled out.

- [ ] Flip Book game (built earlier, now hidden) brought back
- [ ] One cross-pollinating game per level (built earlier, now hidden) brought back
- [ ] Games for film students
