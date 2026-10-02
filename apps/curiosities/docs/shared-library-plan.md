# A shared library of curated films

Status: the local side is built (`trace.js`, Library: Share a film). The cloud side below is a plan only. Hosting and logins wait on Jeremy.

## The idea in plain words

When you trace a film, you write down, beat by beat, which curiosities are on and how much: the shot is wide, the camera is handheld, the feeling is curious, two laughs a minute. That trace is the film split into colored light (the Prism). Nothing in it is the film itself.

A shared library lets anyone add the films they traced, so everyone's Prism has more films to borrow from. The more people trace, the better the library gets, and nobody else has it. That is the moat.

## What a shared film is (built now)

A **trace file** (`<title>.curiotrace.json`, usually a few KB):

```
{
  "format": "curiosities-trace", "version": 1,
  "id": "<fingerprint of the beats>",
  "title": "…", "kind": "film | episode | short | game | music video | ad | scene | other",
  "camera": "authored | player",
  "year": 1994, "tracedBy": "Sharani", "createdAt": "2026-10-02T…",
  "curiosities": 1074,
  "beats": [ { "at": "0:06", "values": { "shotSize": "wide", "cameraCarry": "handheld", "music.tempo": 120 } } ],
  "moments": [ { "name": "the bar entrance", "from": 3, "to": 7 } ]
}
```

Rules, enforced in code on the way out and again on the way in:

- **Counts and ids only.** Every value must belong to a known curiosity and sit on its own scale (one of its options, or a number inside its range). Anything else is left out and counted, never guessed.
- **No notes.** Beat notes can quote a line, so they never go in a trace.
- **Short text only.** Title 80 characters, moment names and "traced by" 40, tag values 24.
- **Same content, same id.** The id is a fingerprint of the title, kind, camera and beats, so the same trace loaded twice is not added twice, whoever sent it.
- **Older and newer apps.** A trace from a newer version is refused with a plain message. A trace that uses curiosities this app doesn't have yet loads with those values left out, and says how many.

In the app: Library, Share a film. "Save as a trace file" on any curated film; "Choose trace files…" to load one. A loaded film joins Curated films (marked "shared by …") and shows in the Prism and in every workspace's Cross-pollinate section like any other film. A studies export (`curiosities-studies.json`) also loads; its first study is read.

## Why counts are safe to share (and where the line is)

A trace records choices (how wide, how fast, how warm), not expression (lines, images, music, the shot list in order with descriptions). The app already refuses notes and free text, so a trace can't carry a script. Two things still need a human eye in a public library:

1. **Titles.** A title names a real film. That is fine for pointing at it, as a review does. The library should not show posters, stills or clips.
2. **Long, very detailed traces.** A beat-by-beat trace of a whole film with hundreds of curiosities is still only numbers, but the library should cap its size (for example 5,000 beats) and never pair it with timecoded dialogue.

This is a plain-language reading, not legal advice. Before the library opens to the public, a lawyer should look at it once.

## The cloud library (plan only, nothing built)

It reuses the plan in [platform-and-saving-plan.md](platform-and-saving-plan.md): Cloudflare Pages for the site, Supabase for logins and storage.

### What it stores

One row per trace. The trace file is small (a few KB), so 10,000 shared films is about 50 MB: free on Supabase's free tier.

| Column | What it holds |
|---|---|
| id | the trace fingerprint (so duplicates are caught for free) |
| trace | the trace file itself (JSON) |
| title, kind, year | copied out of it for search |
| curiosity_ids | the ids it uses, for "films that use handheld" searches |
| owner | the user who shared it (a login) |
| status | pending, listed, hidden |
| created_at, likes, loads | counts for sorting |

### How it flows

1. **Share.** In the app, "Share to the library" on a curated film sends the trace (the same file as today) to the server. A login is needed, so every shared film has an owner who can take it down.
2. **Check on the server.** The server runs the same `CuriosityTrace.check` as the app (it is in the shared core and runs in Node), so nothing the app would refuse can get in through the back door. Then it sets status pending.
3. **List.** A trace goes live after a light review: automatic for people with a few accepted traces, a person's look for new accounts. Anyone can report a trace; a report hides it until looked at.
4. **Browse and load.** The library page lists films by title, kind and the curiosities they use. "Load into my Prism" downloads the trace and runs the same import as Share a film. No login needed to browse or load.
5. **Take down.** The owner can delete; an admin can hide. A takedown request from a rights holder hides it at once.

### What it costs

Storage and reads at this size are free on both services up to roughly 1,000 active users, and about $25 a month after that (Supabase Pro), the same as the saving plan. Review time is the real cost.

### What it needs from Jeremy

- A yes on hosting (Cloudflare Pages or GitHub Pages) and on Supabase for logins.
- Who reviews new traces at first (Jeremy, Sharani, or both).
- Whether shared traces are public to everyone or only to signed-in users at first. Recommended: signed-in only, during the beta.
- A name for "traced by": real name, handle, or nothing.

### Order to build it in, once approved

1. A read-only library: a static list of traces Jeremy and Sharani made, served with the web app. No logins. (Cheapest; proves the browse and load flow.)
2. Logins and "Share to the library", with every new trace pending until a person approves it.
3. Search by curiosity, likes, and reports.
4. Automatic listing for trusted tracers.

## Shapes shared with the curiosity database (PR #7)

- A trace's `values` use the same ids as the database's model scenes, including slider ids written `curiosity.slider` (for example `music.tempo`).
- The database's model scenes trace cleanly. `node core/check.js` names any scene value whose id is not a curiosity; at the time of writing it names five slider ids used in six places (`noMusic.length` twice, `ruleOfThree.pattern`, `physicalComedy.size`, `comicSound.effects`, `understatement.direction`). They are not sliders in the database yet, so they are left out of their traces.
- A model scene is shareable like any study; it is made up, not a real film.
