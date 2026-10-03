"""The shared camera pose (curio_camera.py: Y up, metres, the camera looking down -Z at rest) in Unreal's world
(Z up, centimetres, X forward, Y right), and back. Plain Python, so it can be tested without Unreal.

    Unreal X = -pose z     Unreal Y = pose x     Unreal Z = pose y      (times 100: metres to centimetres)
    pitch = tilt (up is positive in both)        yaw = -pan              roll = -dutch

Forward, right and up keep their meaning, so a shot framed in Maya or Blender frames the same in Unreal.
"""
import math

from . import curio_camera as cc

UNIT = 100.0  # centimetres per metre
SHAKE_DEG = 0.15  # degrees of handheld wobble per shake level (cameraShake 0 to 5)


def to_ue(pose, unit=UNIT):
    return {
        "x": -pose["tz"] * unit, "y": pose["tx"] * unit, "z": pose["ty"] * unit,
        "pitch": pose["rx"], "yaw": -pose["ry"], "roll": -pose["rz"],
        "focal": pose["focal"],
        "aperture": pose["fstop"],
        "focus": pose["focus"] * unit,
        "dof": bool(pose["dof"]),
        "blur": max(0.0, min(1.0, pose["shutter"] / 360.0)),
        "shake": pose["shake"],
    }


def from_ue(ue, unit=UNIT):
    return {
        "tx": ue["y"] / unit, "ty": ue["z"] / unit, "tz": -ue["x"] / unit,
        "rx": ue["pitch"], "ry": -ue["yaw"], "rz": -ue["roll"],
        "focal": ue.get("focal", 35.0),
        "fstop": ue.get("aperture", 16.0),
        "focus": ue.get("focus", 0.0) / unit,
        "dof": bool(ue.get("dof")),
        "shutter": ue.get("blur", 0.5) * 360.0,
        "shake": ue.get("shake", 0.0),
    }


def subject_from_ue(location, unit=UNIT):
    """An Unreal location (cm, Z up) as the mapping's subject (m, Y up)."""
    x, y, z = location
    return (y / unit, z / unit, -x / unit)


def wobble(frame, shake):
    """A small, repeatable handheld wobble (pitch, yaw) in degrees for one frame. Two out-of-step waves."""
    level = shake / cc.SHAKE_STEP if cc.SHAKE_STEP else 0.0
    a = level * SHAKE_DEG
    return (a * (0.6 * math.sin(frame * 0.91) + 0.4 * math.sin(frame * 2.33 + 1.0)),
            a * (0.6 * math.sin(frame * 0.67 + 2.0) + 0.4 * math.sin(frame * 1.79)))


def shots(panels, fps=24.0, start=0, subject=(0.0, 0.0, 0.0), eye=1.6, wobble_every=2):
    """curio_camera.timeline() in Unreal terms. Each shot: {panel, start, end, stepped, keys: [(frame, ue)],
    wobble: [(frame, dpitch, dyaw)]} with wobble only for shaky shots."""
    out = []
    for s in cc.timeline(panels, fps, start, subject, eye):
        keys = [(f, to_ue(p)) for f, p in s["keys"]]
        shake = keys[0][1]["shake"]
        w = []
        if shake > 0:
            w = [(f,) + wobble(f, shake) for f in range(s["start"], s["end"] + 1, max(1, int(wobble_every)))]
        out.append({"panel": s["panel"], "start": s["start"], "end": s["end"], "stepped": s["stepped"], "keys": keys, "wobble": w})
    return out


def values_from_ue(ue, subject=(0.0, 0.0, 0.0), eye=1.6):
    return cc.values_from_camera(from_ue(ue), subject, eye)


def at(keys, frame):
    """The pose between a shot's keys at a frame (straight line; a shot has one or two keys)."""
    if len(keys) == 1 or frame <= keys[0][0]:
        return dict(keys[0][1])
    (f0, a), (f1, b) = keys[0], keys[-1]
    if frame >= f1:
        return dict(b)
    t = (frame - f0) / float(f1 - f0)
    return {k: (a[k] + (b[k] - a[k]) * t) if isinstance(a[k], float) else a[k] for k in a}
