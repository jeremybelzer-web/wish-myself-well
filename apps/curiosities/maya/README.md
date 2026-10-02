# Curiosities in Maya

Phase 5 of `docs/platform-and-saving-plan.md`. The Curiosities app runs docked inside Maya. Each storyboard
panel's camera curiosities set a real Maya camera: shot size, lens, angle height, dutch, depth of field,
motion blur, shake, carry, the camera move and the hold. You can key the whole storyboard as shots, then
move the camera by hand and read it back onto the board.

## Install

1. Add this folder to Maya's module path. Either copy `curiosities.mod` into your `maya/modules` folder and
   change its `.` to the full path of this `maya/` folder, or set `MAYA_MODULE_PATH` to include this folder.
2. Restart Maya, then in the Script Editor (Python tab):

```python
import curiosities_maya
curiosities_maya.show()
```

Drag those two lines to a shelf for a button. The panel loads `../index.html` beside this folder, or the
file named by the environment variable `CURIOSITIES_APP`. It needs Maya 2022 or later: PySide2 (2022 to
2024) or PySide6 (2025 and later), both with Qt WebEngine.

## Use

| Control | What it does |
| --- | --- |
| Follow board | The camera `curioCam` takes the chosen panel's curiosities as they change, running automation included |
| Panel | Which storyboard panel the camera follows |
| Eyes | The subject's eye height in metres; angle height is measured from it |
| Subject = selection | The selected object's pivot is the subject's feet (otherwise the origin) |
| Key shots | One shot per panel, back to back on `curioCam`, with a Camera Sequencer shot for each (one undo) |
| Read camera | The camera at the start of each shot, back onto the board as the strand "Maya camera" |

## How curiosities become a camera

`scripts/curiosities_maya/curio_camera.py` holds the whole mapping as plain Python with no Maya, so a
Blender or Unreal bridge can reuse it. The film back is Maya's default (36 x 24 mm).

| Curiosity | Camera |
| --- | --- |
| Shot size: insert, close, medium, wide | Frame height at the subject of 0.25, 0.45, 1, 3 m, so the distance follows the lens |
| Lens length: wide, normal, long | 24, 35, 85 mm |
| Angle height: floor, low, eye, high, overhead | 0.15 m off the floor, 1 m below the eyes, at the eyes, 1 m above, straight down; always aimed at the eyes |
| Dutch: level, tilted | Roll 0 or 15 degrees |
| Depth of field: shallow, medium, deep | f/1.8, f/5.6 (depth of field on), f/16 (off) |
| Motion blur: none, light, heavy | Shutter angle 45, 180, 360 |
| Shake 0 to 5, carry handheld | Maya camera shake, at least level 2 when handheld |
| Carry locked | Stepped keys and no move |
| Camera move with move speed 1 to 5 | Over the shot: push in, pull out, pan, tilt, track, crane, zoom, or orbit |
| Hold: short, medium, long | 1, 2, 4 seconds at the scene's frame rate |

Reading back picks the nearest option of each, so a camera keyed from the board reads back the same.

## Checks without Maya

```
python3 -m unittest discover -s apps/curiosities/maya/tests
```

`tests/test_maya_camera.py` runs the keying and read-back against a stand-in for `maya.cmds`. The panel itself
(`panel.py`) needs Maya to run; it has not been opened in Maya yet.
