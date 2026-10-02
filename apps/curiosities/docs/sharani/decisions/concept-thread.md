# Decisions from the Curiosities concept thread (2026-10-02, overnight)

Jeremy said to run without him and review these in the morning. One line each, with the reason.

## Saving to GitHub
1. Work lives on branch `curiosities-study-plan` in wish-myself-well, inside apps/curiosities/ only. Reason: CLAUDE.md says to touch nothing else.
2. Committed the decoded music-app docs to apps/curiosities/reference/, but left out the chat with Sharani. Reason: the repo is public and the chat is personal (travel, the choir contract).
3. Push and PR are waiting: GitHub isn't linked to Claude yet, so the branch is committed but not pushed. Reason: the push was refused for lack of access.

## What the study view is
4. Built the Study as a new top tab beside Board, Catalog and Ensembles. Reason: it keeps the board untouched and matches the existing tab look.
5. Inside Study there are five sub-tabs: Trace, Curiosity, Suite, Proximity, Shelf. Reason: Curiosity/Suite/Proximity mirror the music app's search windows; Trace is where beats get entered; Shelf is the music app's Essence Shelf.
6. A beat stores only curiosity ids and values, a timecode (24 characters max) and a note (120 characters max). Reason: HANDOFF's ids-and-counts rule; the cap keeps people from pasting scripts.
7. Unrecorded curiosities stay blank, not defaulted. Reason: a study measures what was observed, not what the board assumes.
8. Gave 8 non-live curiosities options so studies can record them (shot size, angle height, dutch, POV, key direction, light color, interior/exterior, gesture size 0–5). Reason: the seed proximities need shot size and gesture, and these are the easiest to read off a frame.
9. A suite "fires" in a beat only when every curiosity in it matches. Partial matches show as 2/3 in the Suite lanes. Reason: a suite means things that fire together.
10. Proximity counting: when X holds at beat i, Y counts if it holds at beat i through i+N; "rises/drops" compares against beat i. Shown as held/times-X-happened per study. Reason: HANDOFF says proximities are measured counts that can be wrong for the next work.
11. Added structured x/y conditions to the four seed proximities in model.js, kept their old board test. Reason: the board's line under the strip still works the same.
12. You can add your own proximities (curiosity value, rises/drops, or a whole suite on either side). Seeds can't be deleted; yours can. Reason: matches "When X suite happens, then Y suite happens."
13. Shipped one example study: our own board scene "The crystal is quiet", 8 hand-traced beats. Reason: empty views teach nothing, and it isn't a commercial work.

## The Shelf
14. Keep = tick a span of beats, pick one curiosity or one suite. A suite keeps every curiosity in it across the span. Reason: the music app's per-strand keep.
15. Apply = the board takes the strand's values panel by panel, cycling if the strip is longer. Reason: the music app cycles DNA the same way.
16. Any control touched by hand wins back from an applied strand, and a Clear button removes it. Reason: otherwise the controls would look broken.
17. Shot size can now be set per panel by a strand, even though it isn't a board control. Reason: it's the most common curiosity in any study.

## Catalog
18. The Catalog is now a table with Jeremy's six columns. Extract/Apply/Expand/Automate are measured from the code; Game and Gizmo are blank text boxes. Reason: his test, his and Sharani's design cells.
19. Game/Gizmo notes save only in the browser. Reason: no backend; worth moving into a file once they have content.

## Other
20. Studies, Shelf and custom proximities save in localStorage key curiosities-studies-v1, with Export/Import as JSON. Reason: static files, no build, and an export is a file you can commit or send to Sharani.
21. Fixed the board's existing sideways scroll (the page was 1590px wide on a 1280px screen). One CSS line. Reason: it broke phone layout for every tab.
22. Not built yet: automation lanes, MIDI/body control, variations ("A is to B as C is to D"), games, Arnold terms. Reason: listed as Later in STUDY-PLAN.md.

## Moving to its own repository (after Jeremy asked for a separate project)
23. Nothing was pushed to wish-myself-well. Reason: Jeremy wants this app separate.
24. Prepared a standalone repo with the app files at the root, keeping the folder's history (3 earlier commits + 1 move commit). Saved as curiosities-standalone.bundle. Reason: ready to push the moment the empty repo exists.
25. Suggested name: jeremybelzer-web/curiosities. Docs already point there. Reason: matches the app's name; easy to change.
26. Removed the "Back to Book 05" link, since the show site isn't in the new repo. Kept the Channel 2892 example scenes and Ensembles tab as sample material. Reason: they're the board's only scenes today.
27. Claude can't create GitHub repositories from this session, so Jeremy creates the empty repo. Reason: session restriction.
28. (Jeremy's call) New repo is named "curiosities"; the TV show stays in wish-myself-well. Only app files move. The show repo is read-only sample material the app can study, not copied over. The two example scenes already in the app stay as demo data.
29. (Jeremy's call, reversing 23–28) No new repo. The app stays in wish-myself-well under apps/curiosities/. The standalone copy is dropped; the original branch (with the Book 05 link intact) is what gets pushed.
30. Push still refused: the Claude GitHub App isn't installed on wish-myself-well. Branch curiosities-study-plan is ready to push the moment it is.
31. Pushed branch curiosities-study-plan and opened draft PR #1 on wish-myself-well (not merged): https://github.com/jeremybelzer-web/wish-myself-well/pull/1

## Tarantino-style curiosities and the first game (PR #3)
32. Stacked PR #3 on PR #1's branch, not on main. Reason: it builds on the Study tab, and the diff stays readable.
33. Converted the catalog doc (PR #2) into library.js data instead of reading the markdown at runtime. Reason: static files, no build, and PR #2 isn't merged; regenerate if the doc changes.
34. Renamed the Edit group's "density" to visualDensity. Reason: the doc uses "density" twice (Bifrost thickness and visual density).
35. Values given in units become coarse choices a beat can show (lens wide/normal/long, depth of field shallow/medium/deep, cut rate slow/medium/fast, and 20 more). 14 rows like scene shapes and time per character are a short free word. Reason: a study reads one frame at a time.
36. Time per character is recorded as "who is on screen" per beat; the Curiosity view's percentages give the share. Reason: shares come from counting beats.
37. Genre suites (8) and angle-by-emotion suites (10) live in the Suite menu next to the catalog suites. Reason: a genre is a suite, per the framework doc, so it can be played and counted the same way.
38. Where the doc names a direction ("cutRate rising"), the suite uses the nearest single-beat value (fast). Reason: a suite fires on one beat's values.
39. Did not trace any real Tarantino film. Reason: I can't watch the films, and invented traces would be fake data. The Tarantino style lives as the Crime genre suite until you trace scenes.
40. 11 of the catalog's 22 proximities are countable now; the rest stay as text in the Catalog. Reason: they need condition types (order, "snaps back") that don't exist yet.
41. "Rises / drops / changes" now compare a beat with the beat before it. Reason: one rule for every change, and it's what "becomes" means. The seed counts shifted slightly.
42. The example study gained emotion, vocal tone, time on character, move temper and cut rate. Reason: so the new views show something; it's our own board scene, not a commercial work.
43. First game is the Flip Book. Reason: simplest of the five, and comic panels already are a flip book.
44. Flip Book scoring: 10 per suite firing in a panel, 15 per proximity holding across panels, 50 per goal. Goals only pick suites the decks can reach. Reason: rewards building combinations, not random flipping.
45. Flaps carry slices only (one flap's curiosities from one beat or suite). Reason: Tarantino-style borrowing, never a whole beat.
46. Board panels now show angle height (a horizon line), dutch (a tilt) and emotion (in the header). Reason: otherwise flipping the camera flap changed nothing visible.
47. Removed the browser's default margin on board panels. Reason: it spread panels out so the 4th was off-screen.
48. Did not include PR #2's docs in this PR. Reason: the docs thread owns them.
