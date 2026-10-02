# Curiosities in Blender

Phase 7 of `docs/platform-and-saving-plan.md`. Each storyboard panel's camera curiosities drive a Blender camera,
with the same mapping as the Maya panel (`../maya/scripts/curiosities_maya/curio_camera.py`).

Blender cannot show a web page inside it, so the app runs beside Blender in the desktop app (`../desktop`), and
the add-on talks to it over the local bridge (`ws://127.0.0.1:7577`).

## Install

```
python3 apps/curiosities/blender/make_zip.py
```

That writes `blender/dist/curiosities_blender.zip`, with the shared camera mapping copied in. In Blender 4.2 or
later: Edit > Preferences > Add-ons > Install from Disk, pick the zip, and turn on **Curiosities**. Then open the
desktop app (`cd apps/curiosities/desktop && npm start`).

## Use

In the 3D Viewport, press N and open the **Curiosities** tab.

| Control | What it does |
| --- | --- |
| Connect | Connects to the desktop app's bridge (the address above the button) |
| Follow board | `CurioCam` takes the chosen panel's curiosities as they change, running automation included |
| Panel | Which storyboard panel the camera follows |
| Eyes (m) | The subject's eye height; angle height is measured from it |
| Subject | An object whose origin is the subject's feet (otherwise the world origin) |
| Key shots | One shot per panel on `CurioCam`, back to back from the scene's start frame, each with a timeline marker bound to the camera. Locked shots get stepped keys, and shaky shots get a noise modifier on their own frames |
| Read camera | `CurioCam` at the start of each shot, read back onto the board as the strand "Blender camera" |

Blender is Z-up, so the mapping's Y-up pose `(x, y, z)` becomes Blender `(x, -z, y)`. The camera looks along +Y
at the subject, frames by height on a 36 x 24 mm sensor, and follows the scene's unit scale. Motion blur sets the
scene's shutter.

## Checks

```
blender -b --python apps/curiosities/blender/tests/test_blender.py
```

`pip install bpy` also works with Python 3.11. Part 1 needs nothing else. It sends every framing through a Blender
camera and reads it back, in metres and centimetres, then keys a storyboard and reads it back. Part 2 runs when
`CURIO_BRIDGE=ws://127.0.0.1:7577` and the desktop app is open: it connects, follows the board while automation
moves it, keys shots, changes the lens by hand, reads it back, and checks that the board shows it.

## Whole films from the engine

The plugin asks the app for `{type: "timeline"}` first: when the engine (Library > Engine) has a film, every moment of it arrives, not just My film's 8 storyboard panels, so Key shots and markers cover the whole film. With no engine film yet, or an older app, it asks for `panels` as before. Reading a camera or an edit back still lands on My film as a named strand.
