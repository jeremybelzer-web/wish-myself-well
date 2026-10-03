# Episodes: show episodes as one-second storyboards

A story file in `stories/` is plain text: every line that starts with "- " is one panel, and one panel is one second of film. The top of each story file explains the words it uses (WIDE, MEDIUM, CLOSE, TINY, BLACK, camera words, feelings in brackets, spoken words after a dash, holds like `(3s)`).

Build after editing a story:

    node apps/curiosities/episodes/build.js

That writes, for each story, `<name>.json` (a storyboard file: Storyboard, Open a storyboard file) and `<name>.js` (loaded by `index.html`, so the Storyboard shows it under **Show episodes**). A storyboard scene holds at most 24 panels, so a longer story scene becomes even pages ("Scene 1. The napkin (1 of 2)"). Opening an episode again replaces its own scenes and keeps the rest of the storyboard.

Stories so far:

- `stories/wish-myself-well-1.md`: Wish Myself Well, Season 1, Episode 1, "Crazy Loser (kidding)", from the show's comic (`web/data.js`, `episode1`). The working copy Jeremy edits is `/mnt/project-files/wish-myself-well/episode-1.md` in the project; copy it here and build.

Tests: `node episodes/tests/run.js` (the converter, and that every built file matches its story) and `node episodes/tests/browser.js` (Show episodes in the Storyboard).
