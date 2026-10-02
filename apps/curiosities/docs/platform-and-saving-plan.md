# Curiosities: Platform and Saving Plan

2026-10-02 · for Jeremy. Living version: https://claude.ai/code/artifact/02840e65-a3d2-4ede-9da0-3c6982dd755a

## Summary

Build one Curiosities core (the curiosity catalog, the project file and the automation engine) and wrap it in thin shells: the web app, a desktop app, and a panel inside Maya and other tools. Every shell saves the same project file and accepts the same plugins, so the work is done once.

The cheapest order is: a real project file with Save and Open now ($0), the web app as an installable page ($0), optional accounts and cloud sync on a free tier ($0 until roughly 10,000 users, then about $25 a month), a desktop app, then a Maya panel, then a VCV Rack module and the other tools. Per Jeremy's note on games, the bigger phases wait until the core curiosities are settled; only the safe-saving step is worth doing now.

This is a plan only. No app code changed. Prices are from memory, not looked up on 2026-10-02, so treat them as approximate.

## Where the app is today

The app is a set of static files in `apps/curiosities/` (about 1.3 MB of plain JavaScript on the `curiosities-maya-studio` branch, no build step) that runs by opening `index.html`. That is a strong starting point: the same files can run in a browser, a desktop window, or a web panel inside Maya.

- **Saving.** Everything lives in the browser's `localStorage`, spread over 28 separate keys (`curiosities-board-v2`, `curiosities-studies-v1`, `curiosities-automation-v1`, one per Studio tool, and so on). Only studies can be exported, as JSON. Clearing browser data, switching browsers or switching computers loses the rest.
- **Size limit.** Browsers cap `localStorage` at about 5 MB per site, which a few large studies and automation patches could reach.
- **MIDI.** Draft PR #4 already reads and sends MIDI through the browser's Web MIDI (`automation.js`, `studio-live.js`, `studio-rig.js`, `studio-curves.js`). That works in Chrome and Edge, not in Safari, and it is how VCV Rack can talk to the app today.
- **No server.** There are no accounts, no cloud, and no plugin system yet.

## One shared core

The app's working parts are pulled out of the screens into one core that every version loads: the curiosity catalog, the automation engine (CurioAuto, already in draft PR #4) and the project file. The shells only decide where the app appears; the connections below the core decide how it saves, what can modulate it, and which scene it drives.

```
   Web app               Desktop app            Tool panels
   browser, logins       Electron: files,       Maya, Unreal,
                         OSC, bridge            Houdini, more
        |                     |                      |
        v                     v                      v
 +---------------------------------------------------------------+
 | Shared core (plain JavaScript, no build step)                 |
 |  Curiosity catalog    Automation engine     Project file      |
 |  curiosities, suites, on/off trigger,       (.curio) every    |
 |  proximities,         graded lanes, LFO,    tab, study and    |
 |  proximity suites     knob, MIDI            patch, versioned  |
 +---------------------------------------------------------------+
        ^                     ^                      ^
        v                     |                      v
   Saving                Plugin slot            Host bridge
   Save/Open, autosave,  MIDI, OSC, VCV Rack    curiosities to camera,
   optional cloud sync   module, JS plugins     keys in Maya, Unreal,
                                                Blender
```

Plugins push values into the core; saving and the host bridge go both ways, so a scene built by hand in Maya can be read back as curiosities.

In practice this means two short written contracts that every version honors: the `.curio` file format, and one message format for modulation and host bridges ("set curiosity X to 0.42", "trigger suite Y on"). MIDI, OSC, WebSocket and the Maya bridge all carry that same message.

## Saving progress

The safe answer is local-first: your project is always a file you own, and the cloud is an optional copy. That costs nothing to run and nothing is lost if a server or account goes away.

### Step 1: one project file (do now, $0)

1. **One `.curio` project file.** Gather all 28 `localStorage` keys into one versioned JSON file: board, studies, Shelf, automation patches, Prism view, every Studio tool. It carries a `format` version so old files always open.
2. **Save, Save As, Open.** Save downloads the file (works in every browser). In Chrome and Edge, the File System Access API lets the app keep writing to the same file on disk, like a normal app.
3. **Autosave with history.** Move storage from `localStorage` to IndexedDB (no 5 MB cap) and ask the browser to mark it persistent (`navigator.storage.persist()`), so it is not cleared automatically. Keep the last 20 autosaves so you can roll back.
4. **A reminder.** If the project has changed since the last saved file, the app says so and offers Save.

A free trick for cloud backup with no cost to us: save the `.curio` file into a Dropbox, Google Drive or iCloud folder on your computer. Their own apps sync it.

### Step 2: accounts and cloud sync (optional, later)

Log in with email link or Google, and your projects sync between computers. The cloud keeps the same `.curio` file plus its recent versions. Download is always one click, and an account can be deleted with its files.

The cheapest well-known services for this are Supabase (login, database and file storage in one, with a free tier) and Cloudflare (Pages for hosting, R2 for files with no download fees). Firebase is the other common choice. Recommendation: Supabase for logins and Cloudflare Pages for hosting.

Project files are small because studies store ids and counts, not video or scripts. Assumed about 1 MB per user including saved versions; storing video clips would change this a lot.

| Active users | Storage | Rough monthly cost | What it runs on |
| --- | --- | --- | --- |
| 100 | 0.1 GB | $0 | Supabase free tier, Cloudflare Pages free |
| 1,000 | 1 GB | $0 | Same free tiers (about at the free storage limit) |
| 10,000 | 10 GB | about $25 | Supabase Pro |
| 100,000 | 100 GB | about $25 to $75 | Supabase Pro plus usage, or files moved to Cloudflare R2 at about $0.015 per GB |

All prices are approximate, from memory, and should be checked before signing up. Free tiers pause inactive projects after about a week, which is fine for testing but not for real users.

Short film clips for the curated films (an idea from earlier) are the one thing that would make storage expensive. The plan keeps clips on the user's own computer, or links to them, and never uploads them by default.

## Plugins inside Maya and other tools

Yes, this is feasible, and Maya is the easiest place to start. Maya, Houdini and Nuke can show a web page inside a docked panel, so the existing app can run there almost unchanged. A small Python bridge then turns curiosity values into real scene changes: camera angle moves the camera, distance changes the focal length or dolly, an automation lane becomes keyframes.

Each tool plugin has two halves:

1. **The panel.** The same Curiosities app, loaded inside the tool's own window.
2. **The host bridge.** A short script that maps curiosities to the tool's controls, both ways: set a curiosity and the scene moves; move the camera in the scene and the curiosity reads it back. That second direction is how the Prism can measure a scene you built by hand.

| Tool | How the panel runs | How it talks to the scene | Feasibility |
| --- | --- | --- | --- |
| Maya | Web view in a dockable Qt panel (PySide2 or PySide6, built in) | Python `maya.cmds`: cameras, keys, attributes | High. First choice, since Sharani works in Maya |
| Unreal Engine | Built-in Web Browser widget in an editor tab | Remote Control API over HTTP or WebSocket, and Python | High. Remote Control lets the web app drive Unreal with no compiled plugin |
| Houdini | Python panel with a Qt web view | Python `hou`; OSC into CHOPs | High |
| Blender | No built-in web view, so the app runs in the browser or desktop app beside Blender | Python add-on that listens on a local WebSocket and sets cameras, keys and properties | Medium-high. Works well, just in two windows |
| DaVinci Resolve | Workflow Integration panel (HTML, Studio version) | Resolve scripting API: timeline, markers, clips | Medium. Good for editing curiosities (cut rhythm, shot length); the free version limits scripting |
| Premiere Pro, After Effects | UXP or CEP panel (HTML and JavaScript, the same as our app) | Adobe scripting | Medium-high |
| Cinema 4D, Nuke, Toon Boom Harmony, Storyboard Pro | Python or JavaScript scripting panels | Each tool's scripting | Medium. Later, on request |

Distribution is cheap: Maya plugins ship as a module folder (a `.mod` file), and Blender add-ons as a zip. The Autodesk App Store and Blender Market are optional storefronts.

The one real cost is upkeep. Each tool changes its scripting every year or two, so build Maya first, then Unreal or Blender, and only add others when someone asks.

## Desktop version

Recommendation: Electron. It wraps the same app in a desktop window with Chrome's engine inside, so Web MIDI works the same on Mac and Windows. It also adds what a browser cannot do: real files and folders, OSC over the local network for VCV Rack and other tools, and a local bridge the Maya and Blender plugins can connect to.

| Option | Download size | MIDI | OSC and local bridge | Notes |
| --- | --- | --- | --- | --- |
| Installable web app (PWA) | None, installs from the site | Chrome and Edge only | No | Free first step: an app icon and offline use |
| Electron | About 100 MB | Yes, everywhere | Yes | Recommended. Same engine as Chrome, so the app behaves the same |
| Tauri | About 10 MB | Needs extra native code on Mac, because Safari's engine has no Web MIDI | Yes | Smaller, but more work for MIDI |

The costs are signing certificates, so Mac and Windows don't warn users that the app is unsafe: about $99 a year for Apple, and about $100 to $300 a year for Windows (approximate). Updates can ship free through GitHub Releases.

## Plugins in every version (VCV Rack and others)

Every version gets the same plugin slot, so anything that can move a knob can move a curiosity, suite, proximity or proximity suite. There are four ways in, from simplest to deepest:

1. **MIDI (works today).** VCV Rack sends MIDI CC and notes through a virtual MIDI port (IAC on Mac, loopMIDI on Windows), and the app's automation lanes already follow CCs and send them back out. Limits: 128 steps per knob, and Safari has no Web MIDI.
2. **OSC (desktop and tool plugins).** OSC carries smooth, named values such as `/curio/camera-angle 0.42`, with no 128-step limit. VCV Rack has free OSC modules, and TouchOSC, Max and Ableton speak it too. Browsers cannot send OSC directly, so it arrives with the desktop app, or through a tiny bridge program for the web version.
3. **A Curiosities module for VCV Rack.** A small module written with VCV's free plugin SDK (C++), listed in the free VCV Library. It shows the app's curiosities as jacks: patch an LFO into "camera angle" and it moves. It connects to the app over the local network, so it works with the web, desktop and Maya versions alike.
4. **JavaScript plugins inside the app.** A plugin is a small file with a short description of what it adds: a new modulator (a random walk, a heartbeat, a music-reactive source), a new curiosity or suite, or a new host bridge. Plugins run in a sandbox and can only touch curiosity values through the app's plugin API, so a bad plugin cannot damage a project.

Running VCV Rack itself inside the app (as a VST or CLAP instrument) is possible in the desktop version but heavy, and VCV Rack Pro already runs inside music software. Recommendation: connect to VCV Rack rather than host it, and revisit hosting only if users ask.

## Phased order, cheapest first

Phase 0 is the only one worth doing before the core curiosities are settled. The rest follow once the tabs and curiosities Jeremy described are in place.

| Phase | What you get | Running cost | When |
| --- | --- | --- | --- |
| 0. Safe saving | `.curio` project file, Save and Open, autosave history, IndexedDB | $0 | Now |
| 1. Shared core | Core split from the screens; plugin API and bridge message format written down | $0 | With the tab redesign |
| 2. Web app online | Hosted on Cloudflare Pages or GitHub Pages, installable, works offline | $0 (a domain is about $12 a year) | When others should use it |
| 3. Accounts and cloud | Login, sync between computers, version history | $0 to about $25 a month | After phase 2 |
| 4. Desktop app | Electron app with OSC and the local bridge | About $200 to $400 a year for signing | After phase 3, or sooner if OSC matters |
| 5. Maya panel | The app docked in Maya, curiosities driving the camera and keys | $0 | After phase 1; can run beside 3 and 4 |
| 6. VCV Rack module | Curiosity jacks inside VCV Rack | $0 | After phase 4 |
| 7. More tools | Unreal, Blender, Houdini, Resolve, Adobe | $0 each, plus upkeep | On request |

## Open questions

- [ ] Should Phase 0 (the `.curio` project file and Save and Open) be built now, before the tab redesign? Recommended: yes, since it protects work already being done.
- [ ] Is cloud sync worth about $25 a month once there are thousands of users, or should the app stay file-only (save to your Dropbox or Drive folder) until it earns money?
- [ ] Should users be able to store short film clips in the cloud? That is the one choice that would raise storage costs a lot.
- [ ] After Maya, which tool comes next: Unreal, Blender, or DaVinci Resolve?
- [ ] Will the app be free, paid, or free with proceeds to Amma? It changes whether store fees and signing costs matter.
