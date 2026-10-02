# Curiosity Games for Film

October 2, 2026. Live, editable version: https://claude.ai/code/artifact/74c95c16-983d-43d7-9a1f-6e7c4d3d94e3

## The point

Every game does at least one of three jobs: it teaches a curiosity, it collects curiosity data from real scenes, or it performs curiosities live. Games that collect data matter most early, because each trace a player makes grows the shared library, which is the app's moat.

There are 10 games: the music app's five, adapted to film, and five new ones. Each names the curiosity, suite or proximity it plays with, using ids from `filmmaking-curiosities-catalog.md`.

## The five music games, adapted

| Game | Music version | Film version | Plays with | Job |
| --- | --- | --- | --- | --- |
| Fork in the Road | Decision Tree: tunnels fork where an inspiration song modulates | You ride through your own scene. Where a curated film makes a move on a chosen curiosity, a tunnel splits off, labeled with the film and the move, such as "cut rate doubles" or "psych-out." Pick a tunnel and that move lands in your storyboard. Other trees out the window hold other films and curiosities | psychOut, cutRate, any curiosity | Create |
| Emotion Planets | Key Planets: a key is a planet, its chords are moons | Each planet is an emotion. Its moons are the camera setups that serve it, from the emotion map. Grayed moons are pivot shots that lead to another emotion; hover to see the dotted path, click to fly there, and the transition is added to your scene | emotion, angleHeight, moveTemper, transition | Teach, create |
| Film Galaxy | Song Galaxy: shows how close your song is to copyrighted songs | Genres are solar systems and curated films are planets. As your scene plays, you fly closer to films that share your lines. Borrowing one slice keeps the sensors green; matching one film on many curiosities at once turns them red, because that is copying, not referencing | all curiosities, genre suites | Teach, protect |
| Flip Scene | Flip Book: swap one part of a boring section | A flip book of your scene, split into strips for camera, light, voice and motion. Each flip swaps that strip for the same curiosity from a favorite film, while the figure keeps moving | any one curiosity per strip | Create |
| Director's Road | Guitar play-along on a 3D road | Cues for cuts, moves and suite changes come down a road in time with the scene. The performer hits pads, keys or strap thresholds on the beat. Scored on timing, and every take is saved as curiosity lines | cutRate, cameraMove, suites | Perform |

## New games for film

| Game | How it plays | Plays with | Job |
| --- | --- | --- | --- |
| Name That Film | You see only one curiosity line from a 30-second scene, such as the cut rate or the angle heights, with no picture. Guess the film or the genre. Each wrong guess reveals one more line | any curiosity, genre suites | Teach |
| Daily Scene | One curated scene a day. Trace a single curiosity beat by beat, then see how your trace compares with everyone else's. Agreement earns points, and the consensus trace goes into the library | any curiosity | Collect |
| Proximity Detective | The scene pauses right after X happens. Predict what follows and how many beats later, then watch. Points for the right Y and the right lag | proximities | Teach, collect |
| Genre Swap | Start with a scene from one genre, such as a romantic comedy. Turn it surrealist by changing as few curiosities as possible. The fewer changes, the higher the score, and the winning sets become genre suites | genre suites | Teach, create |
| Tarantino Mixtape | Build one scene from slices of three films, one curiosity per film. Other players vote on whether it feels inevitable or stitched together | any curiosity, devSwap | Create |

## Scoring and progression

Players level up one curiosity at a time, which mirrors how the app models a film.

- **Points** come from beats traced, guesses right and timing hits. A trace that matches the consensus within one value earns full points.
- **Mastery** is per curiosity. Trace 20 scenes on cutRate and it is mastered; its view unlocks for your own projects in Board.
- **Suites unlock** when you master all of their curiosities, so Noir opens after softness, contrast, lightShape and atmosphere.
- **Proximities unlock** when you call one right in Proximity Detective five times.
- **Genre badges** come from Genre Swap wins, one per genre.
- **Takes**: every Director's Road performance is saved, and a high-scoring take can be published as a reference line others can borrow.

## Who plays what, and the build order

| Game | Student | Performer | Filmmaker |
| --- | --- | --- | --- |
| Name That Film | Main | | |
| Daily Scene | Main | | Sometimes |
| Proximity Detective | Main | | Sometimes |
| Emotion Planets | Main | | Main |
| Film Galaxy | Sometimes | | Main |
| Genre Swap | Main | | Main |
| Flip Scene | | | Main |
| Fork in the Road | | Sometimes | Main |
| Tarantino Mixtape | | | Main |
| Director's Road | | Main | Sometimes |

Build order, cheapest and most data-rich first:

1. Daily Scene and Name That Film, since they need only the Study view and fill the library.
2. Flip Scene, since the existing board already swaps one curiosity at a time.
3. Proximity Detective and Genre Swap, once the library has enough traces to score against.
4. Emotion Planets, Fork in the Road and Film Galaxy, the 3D games, where Sharani's work fits.
5. Director's Road last, once MIDI input works.
