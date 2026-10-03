"""Put a pose from curio_camera on a Blender camera, key a storyboard as shots, and read a camera back.
curio_camera works Y-up (Maya's frame, the camera looking down -Z at a subject); Blender is Z-up, so a pose
point (x, y, z) is Blender (x, -z, y) and the camera looks along +Y."""
import math

import bpy
from mathutils import Euler, Matrix, Vector

from . import curio_camera as cc

NAME = "CurioCam"
SHOT = "Curio shot %d"


def _scale(scene):
    """Metres per Blender unit."""
    return scene.unit_settings.scale_length or 1.0


def ensure_camera(scene):
    obj = bpy.data.objects.get(NAME)
    if obj is None or obj.type != "CAMERA":
        data = bpy.data.cameras.new(NAME)
        obj = bpy.data.objects.new(NAME, data)
        scene.collection.objects.link(obj)
    if obj.name not in scene.objects:
        scene.collection.objects.link(obj)
    # Frame by height, like curio_camera (a 36 x 24 mm film back).
    obj.data.sensor_fit = "VERTICAL"
    obj.data.sensor_height = cc.FILM_HEIGHT_MM
    obj.data.sensor_width = 36.0
    if scene.camera is None:
        scene.camera = obj
    return obj


def _rotation(rx, ry, rz):
    base = Euler((math.radians(90.0 + rx), 0.0, math.radians(ry)), "XYZ").to_matrix()
    return base @ Matrix.Rotation(math.radians(rz), 3, "Z")


def subject_of(obj, scene):
    """A Blender object's position as a curio_camera subject (metres, Y-up)."""
    if obj is None:
        return (0.0, 0.0, 0.0)
    p = obj.matrix_world.translation * _scale(scene)
    return (p.x, p.z, -p.y)


def apply_pose(obj, pose, scene):
    k = _scale(scene)
    obj.location = Vector((pose["tx"], -pose["tz"], pose["ty"])) / k
    obj.rotation_mode = "XYZ"
    obj.rotation_euler = _rotation(pose["rx"], pose["ry"], pose["rz"]).to_euler("XYZ")
    cam = obj.data
    cam.lens = pose["focal"]
    cam.dof.use_dof = bool(pose["dof"])
    cam.dof.aperture_fstop = pose["fstop"]
    cam.dof.focus_distance = pose["focus"] / k
    obj["curio_shake"] = pose["shake"]
    obj["curio_shutter"] = pose["shutter"]
    scene.render.motion_blur_shutter = pose["shutter"] / 360.0


def read_pose(obj, scene):
    k = _scale(scene)
    m = obj.matrix_world
    p = m.translation * k
    rot = m.to_3x3().normalized()
    fwd = rot @ Vector((0.0, 0.0, -1.0))
    rx = math.degrees(math.asin(max(-1.0, min(1.0, fwd.z))))
    ry = math.degrees(math.atan2(-fwd.x, fwd.y)) if abs(fwd.z) < 0.9999 else 0.0
    up0 = _rotation(rx, ry, 0.0) @ Vector((0.0, 1.0, 0.0))
    up = rot @ Vector((0.0, 1.0, 0.0))
    rz = math.degrees(math.atan2(up0.cross(up).dot(-fwd), up0.dot(up)))
    cam = obj.data
    return {
        "tx": p.x, "ty": p.z, "tz": -p.y, "rx": rx, "ry": ry, "rz": rz,
        "focal": cam.lens, "fstop": cam.dof.aperture_fstop, "focus": cam.dof.focus_distance * k, "dof": cam.dof.use_dof,
        "shutter": float(obj.get("curio_shutter", scene.render.motion_blur_shutter * 360.0)),
        "shake": float(obj.get("curio_shake", 0.0)),
    }


def _fcurves(idblock):
    """The F-curves animating a data-block (Blender 4.4+ slotted actions, or the older action.fcurves)."""
    ad = idblock.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, "fcurves") and not getattr(act, "layers", None):
        return list(act.fcurves)
    try:
        from bpy_extras import anim_utils

        bag = anim_utils.action_get_channelbag_for_slot(act, ad.action_slot)
        return list(bag.fcurves) if bag else []
    except (ImportError, AttributeError):
        return list(getattr(act, "fcurves", []))


def _key(obj, frame, stepped):
    obj.keyframe_insert("location", frame=frame)
    obj.keyframe_insert("rotation_euler", frame=frame)
    obj.keyframe_insert('["curio_shake"]', frame=frame)
    obj.keyframe_insert('["curio_shutter"]', frame=frame)
    obj.data.keyframe_insert("lens", frame=frame)
    obj.data.dof.keyframe_insert("focus_distance", frame=frame)
    obj.data.dof.keyframe_insert("aperture_fstop", frame=frame)
    for idb in (obj, obj.data):
        for fc in _fcurves(idb):
            for kp in fc.keyframe_points:
                if abs(kp.co.x - frame) < 0.5:
                    kp.interpolation = "CONSTANT" if stepped else "BEZIER"


def key_timeline(panels, scene, subject=(0.0, 0.0, 0.0), eye=1.6, start=None):
    """One shot per storyboard panel on CurioCam, back to back, each marked on the timeline (markers bound to
    the camera, Blender's shots). A shaky shot gets a noise modifier on the rotation for its frames only."""
    obj = ensure_camera(scene)
    fps = scene.render.fps / (scene.render.fps_base or 1.0)
    start = scene.frame_start if start is None else start
    plan = cc.timeline(panels, fps=fps, start=start, subject=subject, eye=eye)
    for idb in (obj, obj.data):
        if idb.animation_data:
            idb.animation_data_clear()
    for mk in [m for m in scene.timeline_markers if m.name.startswith("Curio shot ")]:
        scene.timeline_markers.remove(mk)
    for shot in plan:
        for frame, pose in shot["keys"]:
            apply_pose(obj, pose, scene)
            _key(obj, frame, shot["stepped"])
        mk = scene.timeline_markers.new(SHOT % (shot["panel"] + 1), frame=shot["start"])
        mk.camera = obj
    for shot in plan:
        shake = shot["keys"][0][1]["shake"]
        if shake <= 0:
            continue
        for fc in _fcurves(obj):
            if fc.data_path != "rotation_euler":
                continue
            mod = fc.modifiers.new("NOISE")
            mod.strength = math.radians(shake * 120.0)
            mod.scale = 4.0
            mod.phase = 7.0 * shot["panel"] + fc.array_index
            mod.use_restricted_range = True
            mod.frame_start, mod.frame_end = shot["start"], shot["end"]
    if plan:
        scene.frame_start, scene.frame_end = plan[0]["start"], plan[-1]["end"]
        scene.camera = obj
    return plan


def read_timeline(panels, scene, subject=(0.0, 0.0, 0.0), eye=1.6, start=None):
    obj = bpy.data.objects.get(NAME)
    if obj is None:
        return []
    fps = scene.render.fps / (scene.render.fps_base or 1.0)
    start = scene.frame_start if start is None else start
    plan = cc.timeline(panels, fps=fps, start=start, subject=subject, eye=eye)
    here = scene.frame_current
    out = []
    for shot in plan:
        scene.frame_set(shot["start"])
        out.append(cc.values_from_camera(read_pose(obj, scene), subject, eye))
    scene.frame_set(here)
    return out
