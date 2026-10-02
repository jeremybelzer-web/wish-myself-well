"""Curiosities to a camera, and a camera back to curiosities. Plain Python with no Maya, so it can be tested
anywhere and reused by a Blender or Unreal bridge.

A pose is a dict in metres and degrees, the subject's feet at `subject` and its eyes `eye` metres up:
    tx, ty, tz        camera position
    rx, ry, rz        tilt (down is negative), pan, roll (the dutch angle)
    focal             focal length in mm, on a 36 x 24 mm film back (Maya's default camera)
    fstop, focus, dof f-stop, focus distance in metres, depth of field on or off
    shutter           shutter angle in degrees (motion blur)
    shake             handheld shake amplitude (Maya's horizontal and vertical shake, in film inches)

The curiosities read (catalog.js ids and their options):
    shotSize       insert / close / medium / wide        how much of the subject fills the frame
    lensLength     wide / normal / long                  24, 35, 85 mm
    angleHeight    floor / low / eye / high / overhead   camera height against the subject's eyes
    dutch          level / tilted                        roll 0 or 15 degrees
    depthOfField   shallow / medium / deep               f/1.8, f/5.6, f/16
    motionBlur     none / light / heavy                  shutter 45, 180, 360 degrees
    cameraShake    0 to 5                                shake amplitude
    cameraCarry    locked / smooth / handheld            stepped keys, eased keys, shake
    cameraMove     none / pan / tilt / push in / pull out / track / crane / zoom / orbit   over the shot
    moveSpeed      1 to 5                                how far the move goes
    shotDuration   short / medium / long                 1, 2, 4 seconds
"""
import math

FILM_HEIGHT_MM = 24.0
LENS = {"wide": 24.0, "normal": 35.0, "long": 85.0}
FRAME = {"insert": 0.25, "close": 0.45, "medium": 1.0, "wide": 3.0}  # metres of subject the frame height covers
HEIGHT = {"floor": None, "low": -1.0, "eye": 0.0, "high": 1.0, "overhead": None}  # offset from the eyes
FLOOR_HEIGHT = 0.15
FSTOP = {"shallow": 1.8, "medium": 5.6, "deep": 16.0}
SHUTTER = {"none": 45.0, "light": 180.0, "heavy": 360.0}
SHAKE_STEP = 0.005
DUTCH_DEG = 15.0
HOLD_SECONDS = {"short": 1.0, "medium": 2.0, "long": 4.0}

CURIOSITIES = ("shotSize", "lensLength", "angleHeight", "dutch", "depthOfField", "motionBlur", "cameraShake",
               "cameraCarry", "cameraMove", "moveSpeed", "shotDuration")


def _num(v, default):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def _nearest(table, x, log=True):
    f = (lambda a: math.log(max(a, 1e-6))) if log else (lambda a: a)
    return min(table, key=lambda k: abs(f(table[k]) - f(x)))


def camera_for(values, subject=(0.0, 0.0, 0.0), eye=1.6):
    """The pose a panel's curiosities ask for, at the start of its shot."""
    v = values or {}
    focal = LENS.get(v.get("lensLength"), LENS["normal"])
    frame = FRAME.get(v.get("shotSize"), FRAME["medium"])
    dist = frame * focal / FILM_HEIGHT_MM
    sx, sy, sz = subject
    eye_y = sy + eye
    height = v.get("angleHeight", "eye")
    if height == "overhead":
        y, z, rx = eye_y + dist, sz + 0.001, -90.0
    else:
        y = sy + FLOOR_HEIGHT if height == "floor" else eye_y + HEIGHT.get(height, 0.0)
        z = sz + dist
        rx = math.degrees(math.atan2(eye_y - y, dist))
    carry = v.get("cameraCarry")
    shake_level = _num(v.get("cameraShake"), 0.0)
    if carry == "handheld" and shake_level < 2:
        shake_level = 2.0
    stop = FSTOP.get(v.get("depthOfField"))
    return {
        "tx": sx, "ty": y, "tz": z,
        "rx": rx, "ry": 0.0, "rz": DUTCH_DEG if v.get("dutch") == "tilted" else 0.0,
        "focal": focal,
        "fstop": stop or FSTOP["deep"],
        "focus": math.hypot(y - eye_y, z - sz),
        "dof": stop is not None and v.get("depthOfField") != "deep",
        "shutter": SHUTTER.get(v.get("motionBlur"), SHUTTER["light"]),
        "shake": max(0.0, min(5.0, shake_level)) * SHAKE_STEP,
    }


def _aim(pose, subject, eye):
    """Re-tilt toward the eyes after the camera moved (keeps any pan)."""
    sx, sy, sz = subject
    flat = math.hypot(pose["tx"] - sx, pose["tz"] - sz)
    pose["rx"] = -90.0 if flat < 0.01 else math.degrees(math.atan2(sy + eye - pose["ty"], flat))
    pose["focus"] = math.sqrt(flat * flat + (pose["ty"] - sy - eye) ** 2)
    return pose


def end_pose(values, start, subject=(0.0, 0.0, 0.0), eye=1.6):
    """Where the camera move takes the camera by the end of the shot. A locked camera does not move."""
    v = values or {}
    move = v.get("cameraMove", "none")
    p = dict(start)
    if v.get("cameraCarry") == "locked" or move in (None, "", "none"):
        return p
    s = max(1.0, min(5.0, _num(v.get("moveSpeed"), 3.0))) / 3.0
    sx, sy, sz = subject
    if move in ("push in", "pull out"):
        k = (1 - 0.3 * s) if move == "push in" else (1 + 0.4 * s)
        p["tx"], p["tz"] = sx + (p["tx"] - sx) * k, sz + (p["tz"] - sz) * k
        if start["rx"] <= -89:
            p["ty"] = sy + eye + (p["ty"] - sy - eye) * k
        return _aim(p, subject, eye)
    if move == "pan":
        p["ry"] += 10.0 * s
    elif move == "tilt":
        p["rx"] += 8.0 * s
    elif move == "track":
        p["tx"] += 0.8 * s
    elif move == "crane":
        p["ty"] += 0.8 * s
        return _aim(p, subject, eye)
    elif move == "zoom":
        p["focal"] *= 1 + 0.5 * s
    elif move == "orbit":
        a = math.radians(25.0 * s)
        dx, dz = p["tx"] - sx, p["tz"] - sz
        p["tx"], p["tz"] = sx + dx * math.cos(a) + dz * math.sin(a), sz - dx * math.sin(a) + dz * math.cos(a)
        p["ry"] += math.degrees(a)
    return p


def timeline(panels, fps=24.0, start=1, subject=(0.0, 0.0, 0.0), eye=1.6):
    """One shot per panel, back to back: [{panel, start, end, stepped, keys: [(frame, pose), ...]}]."""
    shots, frame = [], int(start)
    for i, values in enumerate(panels or []):
        v = values or {}
        length = max(1, int(round(HOLD_SECONDS.get(v.get("shotDuration"), HOLD_SECONDS["medium"]) * fps)))
        a = camera_for(v, subject, eye)
        b = end_pose(v, a, subject, eye)
        keys = [(frame, a)] if b == a else [(frame, a), (frame + length - 1, b)]
        shots.append({"panel": i, "start": frame, "end": frame + length - 1, "stepped": v.get("cameraCarry") == "locked", "keys": keys})
        frame += length
    return shots


def values_from_camera(pose, subject=(0.0, 0.0, 0.0), eye=1.6):
    """Read a camera you set by hand back as curiosities: the nearest option of each."""
    sx, sy, sz = subject
    eye_y = sy + eye
    flat = math.hypot(pose["tx"] - sx, pose["tz"] - sz)
    focal = _num(pose.get("focal"), 35.0)
    out = {"lensLength": _nearest(LENS, focal)}
    if pose.get("rx", 0.0) <= -85.0 or flat < 0.01:
        out["angleHeight"] = "overhead"
        dist = pose["ty"] - eye_y
    else:
        dist = flat
        y = pose["ty"]
        if y - sy <= FLOOR_HEIGHT + 0.2:
            out["angleHeight"] = "floor"
        else:
            out["angleHeight"] = min(("low", "eye", "high"), key=lambda k: abs(eye_y + HEIGHT[k] - y))
    out["shotSize"] = _nearest(FRAME, max(dist, 0.01) * FILM_HEIGHT_MM / focal)
    out["dutch"] = "tilted" if abs(_num(pose.get("rz"), 0.0)) > 5.0 else "level"
    out["depthOfField"] = _nearest(FSTOP, _num(pose.get("fstop"), 16.0)) if pose.get("dof") else "deep"
    out["motionBlur"] = _nearest(SHUTTER, _num(pose.get("shutter"), 180.0), log=False)
    out["cameraShake"] = int(max(0, min(5, round(_num(pose.get("shake"), 0.0) / SHAKE_STEP))))
    return out
