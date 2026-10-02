# Platform and saving plan: decisions (2026-10-02)

Thread: "Planning how to save work and ship the app as a Maya plugin, a web app with logins, and a desktop app". Plan doc: https://claude.ai/code/artifact/02840e65-a3d2-4ede-9da0-3c6982dd755a . Repo copy: apps/curiosities/docs/platform-and-saving-plan.md, draft PR #5 (branch curiosities-platform-plan, based on main). Not merged.

1. Docs only. No app code changed.
2. Local-first saving: the project is always a `.curio` file the user owns; cloud is an optional copy.
3. Phase 0 (one `.curio` file gathering all 28 localStorage keys, Save/Open, IndexedDB + persist, 20 autosaves) recommended now, before the tab redesign. Everything else waits until core curiosities are settled, per Jeremy's item 3.
4. Cloud: Supabase for logins/storage, Cloudflare Pages for hosting. Assumed ~1 MB per user. Costs (approximate, from memory, no web lookups): $0 at 100 and 1,000 users, ~$25/mo at 10,000, ~$25 to $75/mo at 100,000.
5. Film clips stay on the user's computer by default; the only thing that would make storage expensive.
6. Desktop: Electron over Tauri, because Safari's engine (Tauri on Mac) has no Web MIDI. Signing ~$99/yr Apple, ~$100 to $300/yr Windows.
7. Tool plugins: Maya first (Qt web view panel + maya.cmds bridge, since Sharani uses Maya); then Unreal (Remote Control API) or Blender (add-on + local WebSocket); others on request.
8. Plugin slot in every version: MIDI (exists), OSC (desktop/bridge), a VCV Rack module via its SDK, sandboxed JS plugins. Connect to VCV Rack rather than host it as VST/CLAP.
9. Two shared contracts: the `.curio` format and one modulation/bridge message format.
10. PR #5 based on main (docs only), not stacked on #4.

## Phase 1 and 2 (2026-10-02, after the coordinator's handoff) — draft PR #8, branch curiosities-core-split, stacked on #4

11. Phase 0 was already built by the Maya thread in #4 (project.js, .curio files, autosave history), so I started at Phase 1.
12. Kept it mechanical and low-conflict with #4: no files moved or renamed. The core is defined by a list (core/files.json), not a folder, so the Maya thread's paths don't change.
13. The one move: window.CuriositySuites (top 130 lines of app.js) went unchanged into suites.js, loaded right before app.js, because automation and the Prism need it without the Board. Its style injection is now skipped when there is no page.
14. core/headless.js loads the core in Node (vm context, in-memory localStorage, automation frames on tick()). core/check.js is the test: 240 curiosities, 61 suites, 28 proximities, 453 parameters.
15. Bridge format written as code, not only docs: bridge.js (window.CurioBridge) with set/trigger/stopAll/list/value and /curio/<verb>/<level>/<id> OSC addresses. "set" switches the main lane to manual and starts the parameter.
16. Offline: network-first service worker with runtime caching (no precache list to maintain while #4 keeps adding files). Only over http(s); file:// opening unchanged. SVG icon only.
17. Not done: switching on GitHub Pages or Cloudflare Pages hosting. That is a repo setting and a public step, so it waits for Jeremy.
18. Tested in headless Chromium against the #4 branch: identical globals and tab count, no page errors, offline reload works, file:// still works.

## Phase 5 Maya panel (draft PR #10, branch curiosities-maya-panel) and Phase 4 desktop (draft PR #11, branch curiosities-desktop), both stacked on #8

19. Maya panel lives in apps/curiosities/maya/ as a Maya module (curiosities.mod, scripts/curiosities_maya). show() docks the same index.html in a Qt web view; PySide6 first, PySide2 fallback (Maya 2022+).
20. The page link (maya-link.js) is injected by the panel with QWebChannel, so index.html is unchanged.
21. The mapping is pure Python (curio_camera.py) so Blender or Unreal can reuse it: shot size = frame height at subject (0.25/0.45/1/3 m) so distance follows lens; lens 24/35/85 mm; angle height relative to the subject's eyes (floor 0.15 m, low -1 m, eye, high +1 m, overhead straight down), always aimed at the eyes; dutch 15 degrees; DOF f/1.8, 5.6, 16; shutter 45/180/360; shake 0.005 per level, handheld at least 2; locked = stepped keys, no move; 9 camera moves scaled by move speed; hold 1/2/4 s.
22. Key shots: one camera (curioCam), shots back to back, Camera Sequencer shot per panel, one undo chunk. Read camera: nearest option per curiosity at each shot's start, applied to the board as the strand "Maya camera" (replaces any other applied strand).
23. Subject = selection pivot, otherwise the origin; eye height default 1.6 m.
24. Not run inside Maya (none here); 10 Python tests with a stand-in maya.cmds, plus the link script in Chromium with a stand-in channel.
25. Desktop: Electron 44 (chosen in the plan for Web MIDI). Loads ../index.html unchanged. Chromium asks for MIDI as "midiSysex" even without sysex, so both are allowed.
26. Bridge ports on 127.0.0.1 only: WebSocket 7577, OSC in 7000, OSC out 7001. OSC addresses come from ../bridge.js itself. The bridge also runs headless (npm run bridge) for VCV module development.
27. Only runtime dependency is ws; no package-lock committed. Builds unsigned until Jeremy decides on signing.
28. Tested: npm run check (bridge end to end), and Electron under Xvfb (app loads, menus, WebSocket set moves the board, values stream back). The native Save dialog is untested.

## Database over the bridge, OSC ports, Blender (2026-10-02 ~15:00-15:20)

29. core/headless.js installs the curiosity database (data/files.json from #7) right after model.js when data/ exists, then CuriosityDB.install, as index.html does. With #7 merged into #8 locally: all 614 database items are bridge keys (1,445 parameters). #7 and #8 merge cleanly. Merged into #10 and #11.
30. bridge.js gained {type:"panels", ids} and {type:"apply", label, values} for tool bridges (needs the board, so not headless).
31. VCV "Curio Return" owns UDP 7001; Maya (QWebChannel) and Blender (WebSocket) never listen there. Desktop bridge now sends values to a list of targets (CURIO_OSC_OUT=7001,7002 or host:port), plus CURIO_WS_PORT and CURIO_OSC_IN. Documented in desktop/README.md; tested with two listeners.
32. Blender add-on = draft PR #12 (branch curiosities-blender, stacked on #10 to share curio_camera.py; needs #11's desktop app to run). Blender has no web view, so it is a WebSocket client of the desktop bridge (own tiny client, no deps), polled from a Blender timer.
33. Blender mapping: Y-up pose (x,y,z) -> Blender (x,-z,y); camera looks +Y; sensor_fit VERTICAL 24 mm; scene unit scale honoured; markers bound to CurioCam stand in for shots; shake = noise modifiers restricted to each shaky shot's frames; shutter goes to the scene's motion_blur_shutter; slotted-action F-curves handled for Blender 4.4+/5.
34. In the repo, the add-on's curio_camera.py is a shim that loads Maya's; make_zip.py copies the real file into the zip.
35. Tested with pip bpy 5.0.1, including end to end against Electron under Xvfb.

## Shared film library groundwork (draft PR #13, branch curiosities-shared-library, stacked on #8)

36. A shared film is a trace file (format "curiosities-trace", version 1, `.curiotrace.json`): title, kind, camera, optional year and traced-by, beats of {at, values}, moments by beat number. Counts and ids only: notes are never included, unknown ids and off-scale values are dropped and counted, text is capped (title 80, names 40, tags 24), at most 5,000 beats.
37. The id is a fingerprint of the content (title, kind, camera, beats), so the same trace isn't added twice, whoever shares it.
38. trace.js is in the shared core so a future server can run the same check as the app.
39. I didn't edit study.js (owned by #4). Loading uses CuriosityStudy.add if #4 adds it; otherwise it writes the studies key and reloads, like opening a project.
40. The UI is a "Share a film" entry in the Library menu, which trace.js adds itself. That leaves workspaces.js untouched.
41. The cloud library is a plan only (docs/shared-library-plan.md): Supabase rows of trace JSON, logins to share but not to browse, server-side check, pending review, reports, takedowns. The first step is a read-only list of traces by Jeremy and Sharani. Waits on Jeremy.
42. Found 5 slider ids used in #7's model scenes that the database doesn't define. They're left out of traces and reported to the coordinator for the database thread.
43. #4 now has CuriosityStudy.add (coordinator, 15:17Z). Tested with #4 merged in: a trace loads with no page reload. I kept the reload fallback until #4 is merged.

## DaVinci Resolve bridge (draft PR #14, branch curiosities-resolve, stacked on #13)

44. It uses Resolve scripts run from Workspace > Scripts, which works in the free version. There are no external scripts (those need Studio) and no Fusion UI. Messages go to the Resolve Console.
45. A storyboard panel becomes a timeline marker: its length is the hold (1, 2 or 4 s, the same as Maya and Blender), its color is the emotion, its note has "id: value" lines, and its custom data starts with "curio:" plus JSON for an exact read back. Re-sending replaces only markers that start with "curio:".
46. Reading an edit: each clip on video track 1 is a shot (or each marker, when there are no clips). shotDuration comes from the shot's length on a log scale (1/2/4 s). cutRate comes from the middle length of the 5 shots around it (<2 s fast, >5 s slow). I picked these thresholds; they are not from a source. Marker "id: value" lines add curiosities. The first N shots go onto N panels as the "Resolve edit" strand.
47. "Trace this edit" writes a .curiotrace.json to the Desktop with no app needed. Python keeps only known ids with on-scale values, using catalog.json (made from the core, with #7's database, 1,074 ids), so marker text never travels.
48. install.py copies the package to ~/.curiosities/resolve and writes 3 menu scripts into the per-user Scripts/Utility/Curiosities folder. The folder paths are from memory.
49. Not run inside Resolve. Tested with a stand-in Resolve, and end to end against Electron.

## Unreal Engine plugin (draft PR #15, branch curiosities-unreal, stacked on #10)

50. The plugin is Python only (Python Editor Script Plugin, Editor Scripting Utilities, Sequencer Scripting), with no C++ module to compile. It is an Unreal plugin folder; install.py copies it into a project's Plugins folder.
51. I chose WebSocket over Unreal's Remote Control API. It is the same model as Blender: the plugin is a client of the desktop bridge, polled from a Slate post-tick callback every 0.25 s. Remote Control would need the app to call into Unreal and a port opened on Unreal's side.
52. The mapping is the shared curio_camera.py (Y up, metres, looking down -Z), converted to Unreal: X=-z, Y=x, Z=y (cm), pitch=tilt, yaw=-pan, roll=-dutch. Forward, right and up are kept.
53. Key shots recreates /Game/Curiosities/CurioShots each time. It keys CurioCam's transform (CONSTANT when locked), focal length and aperture on the component binding, adds a camera cut, and adds marked frames "Curio shot N" (converted to ticks). Handheld uses repeatable sine wobble keys every 2 frames (0.15 degrees per shake level) instead of a Camera Shake asset. Shot ranges are stored in asset metadata ("curio_shots") for reading back.
54. The subject is the selected actor's pivot (else the origin), with eyes 160 cm up. The followed panel is chosen with next/previous menu entries, because there is no custom UI.
55. Not run inside Unreal. Tested with a stand-in unreal module (14 tests) and end to end against Electron.
56. Found while testing: the board's Automation layer stays after every patch stops (automation.js only writes the layer while something runs), so stale automation values override applied strands until "clear" is pressed. That is #4's code; I reported it to the coordinator.

## Beta integration (draft PR #16, branch curiosities-beta, base #4; never merge)

57. I merged #7 through #15 in stack order onto #4. I also merged #6 (character matrix), because the Archetype workspace expects it, and copied in #5's plan doc (unrelated history). #1 to #3 are already ancestors of #4. I left out #2, because it is an old, separate history.
58. The conflicts were all "both added a line" (index.html script tags; CLAUDE.md read-next entries), and I kept both sides. #10, #11 and #12, plus #13 and #9, will conflict the same way when merged in turn.
59. Beta-only wiring: index.html loads character-matrix/ (three.js from cdnjs). It is for the owning threads to adopt.
60. QA in headless Chromium at 1366 and 390 px. Every workspace and Library page opened with no page errors and no sideways scrolling. The main flows work and the app reloads offline. Project Save could not be checked headless, because Chrome opens a file picker.
61. Beta guide and feedback form are in apps/curiosities/docs/beta/ (copies in /mnt/project-files/beta/). Testers are assumed to open index.html in Chrome or Edge, since hosting waits on Jeremy.
62. The engine (#17) is merged into beta. Its 6 core files (catalog, state, host, fake-host, seeds, analyze) are in core/files.json, and check.js asserts they load headless. QA was re-run: 38 pages clean on desktop and phone. The engine's own browser test fails only on the WebGL cube here, because three.js can't be reached from the sandbox.
63. Working title Film Curio (Jeremy, 16:49Z). The name is set in one place each: manifest.webmanifest name and short_name (#8), and desktop package.json productName plus build.productName (#11), which main.js reads for the window title and app name. The page's <title> no longer overrides the window title. Desktop userData is pinned to the Curiosities folder, so renames never lose saved work. The desktop installer now also packages data/, vcv/, engine/, character-matrix/ and reference/. Both changes are carried into beta. The page <title> and the on-page heading are in index.html (#4), so they are left to that thread.
64. The latest #4 is merged into beta (fixes: the automation layer clears on stop and after a reload, Archetype loads the matrix on demand, a one-row phone bar with a workspace sheet, and the Film Curio title). I removed my beta-only static matrix tags. QA re-run: 38 pages clean on desktop and phone. All three bugs are verified fixed. The VCV chip (#9) still sits in the bottom-left corner on phones.
65. Name changed to Curiomatic (Jeremy, 16:58Z) in the manifest (#8) and desktop productName (#11). Desktop userData stays pinned to Curiosities. Checked in Electron (the window title and app name read Curiomatic). Merged into beta. index.html's <title> and <h1> still say Film Curio; that file is #4's.

66. (17:10Z) The app as one link. Jeremy only saw "a paper", so curiosities-beta (with the latest #4, #7, #9 and #18 momentum) is packed into one page and published as an artifact: https://claude.ai/artifact/PuJnwT2C9mdVpiQ8nBqKa4. Bundler: apps/curiosities/docs/beta/one-page/ (bundle.js, shim.js). Inside the link, Save project and other file saves go through the viewer's save permission (.curio saves as .curio.json, which Open project reads); confirm asks you to press the button again; MIDI/VCV, Print and offline don't work there. Momentum core files added to core/files.json. Copy of the page: /mnt/project-files/beta/curiomatic.html.

67. (17:25Z) Engine round two in beta. Merged #19 (curiosities-engine-2) and #20 (momentum test accepts database notes) into curiosities-beta. Applied the engine handoff patch 03, so bridge.js answers {type:"timeline"} itself. engine/store.js goes in core/files.json before engine/catalog.js. Patches 01 and 02 (app.js, index.html, storyboard.js) were left for the app thread, which owns those files.
68. (17:25Z) The plugins ask for the whole film. Maya (maya-link.js), Blender, Resolve and Unreal now ask for "timeline" first. When the engine has a film, every moment is sent, not just 8 panels. With no engine film yet (empty panels) or an older app ("unknown type timeline"), they ask for "panels" as before. Reading a camera or an edit back still goes onto My film through "apply". Blender's panel number now goes up to 999. Committed on beta and on #10, #12, #14 and #15. The tests cover the engine film and both fallbacks: Resolve 14, Unreal 16, Blender against the real desktop app, and the Maya link with an engine film of 8 moments. The app link was refreshed (version 5).
