# Curiosities for Unreal Engine

An editor plugin (Python only, nothing to compile) that adds a **Tools > Curiosities** menu:

| Entry | What it does |
|---|---|
| **Connect to the app** | Talks to the Curiosities desktop app (`../desktop`). While connected, a CineCamera called **CurioCam** follows the chosen storyboard panel as it changes, running automation included. |
| **Follow the next / previous panel** | Chooses which panel CurioCam follows. The Output Log says which one. |
| **Follow the board on or off** | Stops following so you can move CurioCam by hand. |
| **Key shots into CurioShots** | Every panel becomes one shot, back to back, in the Level Sequence `/Game/Curiosities/CurioShots`. CurioCam's position, angle, lens and aperture are keyed, there is a camera cut, and each shot gets a marked frame ("Curio shot 3"). Locked shots hold still, moving shots move (push in, crane, orbit and so on), and handheld shots wobble on their own frames. |
| **Read CurioCam onto the board** | CurioCam as you set it by hand becomes the followed panel's camera curiosities (shot size, lens, angle height, dutch, depth of field, motion blur), as the strand "Unreal camera". |
| **Read CurioShots onto the board** | Every keyed shot read back the same way, one per panel. |
| **Disconnect** | |

The subject is the actor you have selected (its pivot at the feet), or the world origin if nothing is selected. Eyes are 160 cm up. The camera mapping is the same one the Maya panel and the Blender add-on use (`../maya/scripts/curiosities_maya/curio_camera.py`), so a shot framed in one tool frames the same in the others.

## Install

1. Install and open the desktop app (`../desktop`).
2. Run `python3 install.py "/path/to/YourProject"`, giving the folder that holds the `.uproject`. It copies the plugin to `YourProject/Plugins/Curiosities`, with the camera mapping copied in.
3. Open the project. The plugin turns on Python Editor Script Plugin, Editor Scripting Utilities and Sequencer Scripting, which ship with Unreal; say yes if Unreal asks to restart. The menu is **Tools > Curiosities**.

The plugin talks to the app on `ws://127.0.0.1:7577`. To use another address, set `CURIO_BRIDGE` before starting Unreal. It uses the same small WebSocket client as the Blender add-on, so nothing extra needs installing.

## Directions

Unreal is Z up, in centimetres, looking down +X. The mapping is Y up, in metres, looking down -Z. Forward, right and up keep their meaning: Unreal X = -z, Y = x, Z = y (times 100), pitch = tilt, yaw = -pan, roll = -dutch.

## What was and wasn't checked

- It has not been run inside Unreal, because there is no Unreal here. The editor calls are written from memory of Unreal 5's Python API. They are: `EditorActorSubsystem`, `CineCameraActor`, `CameraFocusSettings`, `LevelSequence` with `add_possessable` and `add_track`, transform and float tracks with `add_key`, `MovieSceneCameraCutTrack`, `add_marked_frame`, `ToolMenus` and `register_slate_post_tick_callback`.
- `tests/fake_unreal.py` is a stand-in for Unreal's module, and 14 tests run against it: framing round trips, the camera always aiming at the eyes after every move, keyed shots, reading back, menus and the install.
- The plugin was also run against the real desktop app with the stand-in. It followed panel 1, keyed 4 shots (frames 0 to 191), and read them back onto the board as "Unreal camera".
- The things most likely to need a fix in a real editor: the camera cut track's binding call (it differs between 5.x versions; if it fails the shots still play from CurioCam), and whether marked frames count in ticks (assumed here, and converted).

## Whole films from the engine

The plugin asks the app for `{type: "timeline"}` first: when the engine (Library > Engine) has a film, every moment of it arrives, not just My film's 8 storyboard panels, so Key shots and markers cover the whole film. With no engine film yet, or an older app, it asks for `panels` as before. Reading a camera or an edit back still lands on My film as a named strand.
