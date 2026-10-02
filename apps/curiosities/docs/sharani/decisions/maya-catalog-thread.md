# Decisions: Maya map and Filmmaking Curiosities Catalog (2026-10-02)

One line each, with the reason. Change any of these in the morning.

1. Mapped Sharani's six Maya areas as plain-language decisions, not raw Maya attribute names. Reason: a curiosity has to be readable off a frame or a clip, and the same ids must work for live action and comics.
2. Kept the board's existing ids (shotSize, key, contrast, envMotion and the rest) and only added new ones. Reason: the app's catalog.js already uses them, so nothing has to be renamed.
3. Values are short choice lists or 0 to 5 scales. Reason: that matches the board's existing controls and keeps studies to counts and ids.
4. Wrote the catalog as a Claude Doc, not an HTML page. Reason: you asked for a document, and a doc can be edited and commented on in place.
5. Grouped the 151 curiosities into 14 groups, with Edit and structure as the home for the music-app essences. Reason: most music essences (harmonic rhythm, phrase lengths, transitions) map to editing, not to camera or light.
6. Translated harmonic rhythm to scene change rate, anacrusis to how a scene begins, and articulation to cut articulation. Reason: these were the closest film equivalents I could find, and you should check them.
7. Turned your psych-out vs real modulation idea into a curiosity (psychOut) and a development move (devPsychOut). Reason: it is a fake-out that snaps back against a change that stays, which works for place and tone in film.
8. Listed the Bach and Beethoven development moves as their own section of 10 techniques. Reason: your message treats them as curiosities, and they act on a motif rather than a single beat.
9. Put the camera's loving-to-aggressive attitude on a 1 to 5 scale (moveTemper). Reason: a number can be automated and driven by the joint sensors. I left a comment in the doc asking if you'd rather name the steps.
10. Marked every proximity as a guess until it is counted in curated works. Reason: the review file says proximities should be measured from works you pick, not copied.
11. Added 6 Maya topics beyond Sharani's six: camera depth of field and motion blur, Time Warp, blend shapes, MASH, toon outlines, Camera Sequencer. Reason: each one controls a decision that changes through a shot.
12. Used older static Autodesk pages and Maya knowledge where the current help viewer was blocked. Reason: the current viewer refuses automated reads. Sharani should check the terms.
13. Planned to commit both documents as markdown in apps/curiosities/ on a new branch and open a draft PR without merging. Reason: you asked to keep everything on GitHub, and a draft can be reviewed before it lands.
14. Did not push. Reason: your GitHub account is not linked to Claude, so the push is refused. Linking it at claude.ai/connect-github unblocks it.

## Overnight: Scene Memory App Framework

15. Wrote the Tarantino brief as a separate doc, the Scene Memory App Framework, and linked it to the catalog. Reason: the catalog is a reference list, and the framework is about how the app uses it.
16. Named the app idea "scene memory". Reason: it describes what Tarantino does and what the app gives the user. Rename freely.
17. Limited saved references to 30 seconds or less, stored as ids and counts only. Reason: Sharani's short-clip copyright point, and the app's existing rule against storing scripts or shot lists.
18. Added 6 curiosities to the catalog (sceneShapes, vocalTone, toneArc, timePerCharacter, actionCutRate, emotion), now 157 in 15 groups. Reason: these are the ones in your brief that the catalog lacked.
19. Used 10 emotion categories for the emotion map. Reason: enough to cover the range you described (intimate to anxious to angry) without becoming hard to play live. Easy to extend.
20. Filled the emotion map and genre suites with common film grammar, marked as defaults to be replaced by counts. Reason: nothing is traced yet, so these are starting guesses.
21. Compared surrealist and romantic comedy across 10 curiosities and added 6 more genres in brief. Reason: you named those two; the others show the pattern carries.
22. Mapped each body strap to one default curiosity (wrist to moveTemper, neck to angleHeight, and so on). Reason: one obvious mapping per joint is easier to learn, and every mapping can be changed.
23. Made live switches land on the next beat, not instantly. Reason: it keeps a live performance in time, the way a sampler quantizes.
24. Mapped Maya's own tools to our model: Graph Editor = a curiosity view, Time Editor clips = reusable lines, Set Driven Keys = proximities. Reason: Sharani already thinks in these tools, so it gives her a shared language.
25. Proposed 4 screens (Library, Study, Board, Stage), building Study first. Reason: Study is already the app's planned next step, and it creates the data the other screens need.
26. Kept this work light and inside this project only. Reason: the music-app bug thread has priority tonight.

## Repo change

27. Dropped the plan to push to wish-myself-well. Reason: you want this project in its own GitHub repository, separate from the music app.
28. The repo is named curiosities, shared with the app thread; my docs go in its docs/ folder. Reason: agreed across threads so the app and its docs live together.
29. Did not create the repository myself. Reason: this session can't create GitHub repositories, and your account isn't linked yet. Once you create an empty repo and add it to the project, I'll push the catalog, the Maya map and the framework there as markdown and open a draft PR.
30. Treat the TV show in wish-myself-well as read-only sample material for the app, not something to move. Reason: Jeremy's call; the app is built to sort through works like it.
31. Back to one repo: docs go to wish-myself-well under apps/curiosities/docs/, via a draft PR, no new repo. Reason: Jeremy's call, since the show is the app's sample material.
32. Pushed the four docs to apps/curiosities/docs/ on branch curiosities-docs and opened draft PR #2; also copied this log there. Reason: you asked to keep everything on GitHub. Not merged.

## Games

33. Wrote the games as a design doc only (Curiosity Games for Film) and added it to draft PR #2; no app code. Reason: the concept thread is building the app, so this keeps the two from colliding.
34. Gave every game one of three jobs: teach, collect or perform. Reason: collecting games grow the shared library, which you named as the moat.
35. Kept all five music games and gave them film versions: Fork in the Road, Emotion Planets, Film Galaxy, Flip Scene, Director's Road. Reason: you already designed them, and Sharani was asked to head the 3D side.
36. Turned Film Galaxy's copyright sensor into a check on how many curiosities match one film at once. Reason: borrowing one slice is referencing; matching many at once is copying.
37. Added five new games: Name That Film, Daily Scene, Proximity Detective, Genre Swap, Tarantino Mixtape. Reason: they cover teaching and data collection, which the music games mostly don't.
38. Made progression per curiosity, with suites unlocking when all their curiosities are mastered. Reason: it mirrors how the app models a film.
39. Ordered the build cheapest and most data-rich first: Daily Scene and Name That Film, then Flip Scene, then the scored games, then the 3D games, then Director's Road. Reason: early games fill the library the later ones score against.
