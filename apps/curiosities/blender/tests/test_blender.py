"""Run with Blender's Python (bpy), for example: blender -b --python tests/test_blender.py
or a Python with the bpy module. Part 1 needs nothing else. Part 2 runs when CURIO_BRIDGE is set to a running
desktop app's bridge (ws://127.0.0.1:7577): it follows the board, keys shots and reads the camera back."""
import itertools
import os
import sys
import time

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import curiosities_blender as cb  # noqa: E402
from curiosities_blender import blender_camera as bc  # noqa: E402
from curiosities_blender import curio_camera as cc  # noqa: E402

cb.register()
scene = bpy.context.scene
fails = []


def check(ok, what):
    if not ok:
        fails.append(what)


# Part 1: every framing goes onto a Blender camera and reads back the same, in metres and in centimetres.
for scale in (1.0, 0.01):
    scene.unit_settings.scale_length = scale
    cam = bc.ensure_camera(scene)
    subject = (2.0, 0.0, -1.0)
    for size, lens, height, dutch, dof in itertools.product(cc.FRAME, cc.LENS, cc.HEIGHT, ("level", "tilted"), cc.FSTOP):
        v = {"shotSize": size, "lensLength": lens, "angleHeight": height, "dutch": dutch, "depthOfField": dof, "motionBlur": "light", "cameraShake": 2}
        bc.apply_pose(cam, cc.camera_for(v, subject, 1.7), scene)
        bpy.context.view_layer.update()
        back = cc.values_from_camera(bc.read_pose(cam, scene), subject, 1.7)
        bad = [k for k in v if back[k] != v[k]]
        check(not bad, "round trip %s at scale %s: %s" % (v, scale, {k: back[k] for k in bad}))
scene.unit_settings.scale_length = 1.0

# A low angle looks up, a high one down (the camera's view direction in Blender's Z-up world).
from mathutils import Vector  # noqa: E402

for height, sign in (("low", 1), ("high", -1)):
    bc.apply_pose(cam, cc.camera_for({"angleHeight": height}), scene)
    bpy.context.view_layer.update()
    fwd = cam.matrix_world.to_3x3() @ Vector((0, 0, -1))
    check(fwd.z * sign > 0 and fwd.y > 0, "%s angle points the right way: %s" % (height, tuple(fwd)))

# Keying a storyboard: shots back to back, markers bound to the camera, stepped keys when locked, read back.
panels = [
    {"shotSize": "wide", "angleHeight": "high", "lensLength": "wide", "shotDuration": "short", "cameraCarry": "locked"},
    {"shotSize": "close", "angleHeight": "low", "lensLength": "long", "cameraMove": "push in", "depthOfField": "shallow"},
    {"shotSize": "insert", "angleHeight": "overhead", "dutch": "tilted", "cameraCarry": "handheld"},
]
scene.render.fps, scene.render.fps_base, scene.frame_start = 24, 1.0, 1
plan = bc.key_timeline(panels, scene)
markers = sorted((m.frame, m.name, m.camera.name if m.camera else None) for m in scene.timeline_markers)
check(markers == [(1, "Curio shot 1", "CurioCam"), (25, "Curio shot 2", "CurioCam"), (73, "Curio shot 3", "CurioCam")], "markers: %s" % markers)
check((scene.frame_start, scene.frame_end) == (1, plan[-1]["end"]), "frame range")
loc = [fc for fc in bc._fcurves(cam) if fc.data_path == "location"]
check(loc and loc[0].keyframe_points[0].interpolation == "CONSTANT", "locked shot is stepped")
rot = [fc for fc in bc._fcurves(cam) if fc.data_path == "rotation_euler"]
check(rot and any(m.type == "NOISE" for m in rot[0].modifiers), "handheld shot shakes")
back = bc.read_timeline(panels, scene)
for want, got in zip(panels, back):
    for k in ("shotSize", "angleHeight", "lensLength", "dutch"):
        if k in want:
            check(got[k] == want[k], "keyed %s read back as %s" % (want, got))
check(back[2]["cameraShake"] >= 2, "shake reads back")
print("part 1: %d checks failed" % len(fails))

# Part 2: against the running desktop app.
url = os.environ.get("CURIO_BRIDGE")
if url:
    scene.curio_url = url
    check(bpy.ops.curio.connect() == {"FINISHED"}, "connect")

    def pump(seconds):
        end = time.time() + seconds
        while time.time() < end:
            cb.tick()
            time.sleep(cb.TICK)

    pump(1.0)
    check(len(cb.S.panels) >= 1, "panels arrive: %s" % cb.S.status)
    scene.curio_follow, scene.curio_panel = True, 1
    cb.S.client.send({"type": "set", "key": "c:shotSize", "m": 0.0})  # automation moves the board
    pump(1.0)
    first = cb.S.panels[0].get("shotSize")
    want = cc.camera_for(cb.S.panels[0], (0, 0, 0), scene.curio_eye)
    check(abs(bc.read_pose(cam, scene)["focal"] - want["focal"]) < 1e-3 and first, "camera follows the board (%s)" % first)
    check(bpy.ops.curio.key_shots() == {"FINISHED"}, "key shots")
    # Move the camera by hand on shot 1 (a long lens), then read it back onto the board.
    scene.frame_set(1)
    cam.data.lens = 85.0
    cam.data.keyframe_insert("lens", frame=1)
    check(bpy.ops.curio.read_camera() == {"FINISHED"}, "read camera")
    cb.S.client.send({"type": "trigger", "key": "c:shotSize", "on": False})
    pump(1.0)
    check(cb.S.panels[0].get("lensLength") == "long", "the board shows the hand-set lens: %s" % cb.S.panels[0])
    bpy.ops.curio.connect()
    print("part 2 (bridge %s): done" % url)

cb.unregister()
if fails:
    print("FAILED:\n  " + "\n  ".join(fails[:20]))
    sys.exit(1)
print("blender ok")
