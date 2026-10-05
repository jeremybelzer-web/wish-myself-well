# Scene inspiration: growing the database

Jeremy (2026-10-05): a research hub of every scene from every film and video game, kept only as their shared
curiosities, searchable by topic and filter columns, with clips played from YouTube by default.

## What is built (inspire/)

- `inspire/scenes.js` — 38 famous scenes (films, TV, anime, games) as beats of curiosity values: shot size,
  angle, camera move, cutting, color, light, music, emotion, tension, comedy, eyelines and more. Each has a title,
  a one-line moment in our own words, what the audience feels, and a YouTube **search** (not a link, so it never
  breaks). No footage, scripts, lines or shot lists.
- `inspire/search.js` — the search with no page: topics, curiosities, values, how fast each changes
  (holds, drifts, steps, snaps), suites a scene shows, feelings, kinds. Every filter narrows the list.
- `inspire/hub.js` — Library, Scene inspiration: topics on the left, filter columns, the shrinking list on the
  right. Watch opens the search on YouTube, Vimeo, Dailymotion or any site. Borrow makes the scene a curated film
  and opens the Prism, where any curiosity (with its own range and rate) drops onto a moment of your film.
  Log a clip keeps what you saw in a clip as curiosities; Watch counts views. Kept in `curiosities-inspire-v1`
  (so it is saved in the .curio project file).

- `inspire/writing.js` — books, short stories, essays and poems (public domain, described in our own words, no
  quotes), equal to films and games, starting with how characters move to show a feeling. Each lists `movements`
  that link to the emotion-movement archive. Read opens a Project Gutenberg search.
- `CurioInspire.openSearch(curiosityId, { anchor })` — the search pop-up a curiosity window's search button opens,
  beside that window, with six filter columns (Source, Topics, Curiosities, Values, How fast, Movements).

## Why bots cannot just watch every YouTube clip

YouTube's terms do not allow downloading videos or reading them with automated tools, and a browser cannot read
the pixels of an embedded YouTube player. So "store the curiosity data each time anyone views a clip" has to come
from people, not from reading the video:

1. **People log clips** (built): what they saw, as curiosities. Counts only, so no rights are needed.
2. **People measure their own copies** (built in Bring in a video): a film they own, measured on their device;
   Share a film saves the counts-only trace.
3. **A shared cloud library** (next, needs Cloudflare): every logged clip and shared trace goes to one database
   (Cloudflare D1, see `docs/shared-library-plan.md`), merged by title and moment, with the most common value
   winning. This is what makes it "every scene from every film" over time.
4. **Bots that read text, not video** (next): a bot drafts scenes from public scene lists and descriptions
   (titles, the moment, the feeling) and guesses values with the cheap lens path; people correct them by logging.

## Next steps

- Cloudflare account (Jeremy) → shared library endpoint → hub's Log a clip and Share a film post there.
- A bot that drafts 1,000 scenes a night from public scene lists, marked "draft" until someone logs a correction.
- The AI pop-up (another thread) can call `CurioInspire.hub().results(filters)` to find the scenes whose
  driving curiosities match the user's scene and suggest the top 4.
