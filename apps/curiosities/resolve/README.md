# Curiosities for DaVinci Resolve

Three entries in Resolve's **Workspace > Scripts > Curiosities** menu:

| Entry | What it does | Needs the desktop app |
|---|---|---|
| **Send storyboard to this timeline** | Each storyboard panel becomes a marker on the open timeline, as long as the panel's hold (short, medium, long = 1, 2, 4 seconds). The marker's color is the panel's emotion, and its note lists the panel's curiosities ("shotSize: close"). Sending again replaces only the markers it made before. With no timeline open, it makes one called "Curiosities storyboard". | yes |
| **Read this edit onto the board** | The cuts on video track 1 become shots. Each shot gets a shot length (short, medium, long) and a cut rate (fast, medium, slow, from the shots around it). Markers inside a shot add what they say, in lines like `emotion: anxious`. The first shots go onto the storyboard panels as the strand "Resolve edit". A timeline with no clips is read from its markers, so a storyboard sent to Resolve reads back as it was. | yes |
| **Trace this edit into a shared film** | The same reading, saved as a trace file (`<timeline>.curiotrace.json`) on your Desktop. Load it in the app with Library > Share a film. Only counts go in (known curiosities with values on their scales), never marker text, lines or footage. | no |

So you can trace a film you are studying: put it on a timeline, cut at each shot (Resolve Studio can find the cuts for you with Scene Cut Detection), add a marker wherever you want to note a curiosity (`emotion: fearful`, `laughsPerMinute: 3`), then run **Trace this edit**.

## Install

1. Install and open the desktop app (`../desktop`), for the first two entries.
2. Run `python3 install.py` from this folder. It copies the scripts into your own Resolve scripts folder:
   - Mac: `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility`
   - Windows: `%APPDATA%\Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility`
   - Linux: `~/.local/share/DaVinciResolve/Fusion/Scripts/Utility`

   If your Resolve keeps scripts elsewhere, use `python3 install.py --scripts <that folder>`. To uninstall, run `python3 install.py --remove`.
3. Restart Resolve. Messages from the scripts show in **Workspace > Console**.

The scripts run inside Resolve from its own menu, which works in the free version. They talk to the desktop app over its local WebSocket (`ws://127.0.0.1:7577`, or set `CURIO_BRIDGE`) with a small client that needs nothing installed.

## Files

- `curiosities_resolve/curio_resolve.py`: the mapping, in plain Python (panels to markers, cuts to shot length and cut rate, marker text to curiosities, the trace file).
- `curiosities_resolve/resolve_link.py`: the Resolve and bridge side. Every function takes Resolve's `resolve` object.
- `curiosities_resolve/catalog.json`: every curiosity and its scale, made by `node resolve/make_catalog.js` (run from `apps/curiosities`) so the scripts can drop anything unknown even with the app closed. Run it again when the curiosity list changes.
- `curiosities_resolve/ws_client.py`: the same small WebSocket client as the Blender add-on.
- `install.py`, and `tests/test_resolve.py` (`python3 -m unittest discover -s apps/curiosities/resolve/tests`).

## What was and wasn't checked

- It has not been run inside Resolve; there is no Resolve here. The scripting calls (`GetCurrentTimeline`, `GetItemListInTrack`, `AddMarker`, `GetMarkers`, `DeleteMarkerAtFrame`, `CreateEmptyTimeline`, `GetSetting("timelineFrameRate")`) and the scripts folders are written from memory of Resolve's scripting documentation.
- Marker frames are taken as counted from the timeline's start, and clip frames as absolute. That is how I remember the API working, and it is the first thing to check in a real Resolve.
- The tests use a stand-in Resolve. The two bridge entries were also run against the real desktop app: the storyboard came out as markers, and an edit went back onto the board as "Resolve edit".
