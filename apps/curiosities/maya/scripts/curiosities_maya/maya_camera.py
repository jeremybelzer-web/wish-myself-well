"""Put a pose from curio_camera on a Maya camera, key a whole storyboard as shots, and read a camera back.
Every function takes `cmds` (maya.cmds) so it can be tested with a stand-in."""
from . import curio_camera as cc

# Metres to Maya's scene unit.
UNIT = {"mm": 1000.0, "cm": 100.0, "m": 1.0, "in": 39.3701, "ft": 3.28084, "yd": 1.09361}
CAMERA = "curioCam"
KEYED = ("translateX", "translateY", "translateZ", "rotateX", "rotateY", "rotateZ")
KEYED_SHAPE = ("focalLength", "fStop", "focusDistance", "horizontalShake", "verticalShake")


def _cmds(cmds):
    if cmds is None:
        import maya.cmds as cmds  # noqa: F811
    return cmds


def scale(cmds=None):
    cmds = _cmds(cmds)
    return UNIT.get(cmds.currentUnit(query=True, linear=True), 100.0)


def ensure_camera(name=CAMERA, cmds=None):
    """The camera the panel drives: made once, then reused."""
    cmds = _cmds(cmds)
    if not cmds.objExists(name):
        transform, _ = cmds.camera()
        cmds.rename(transform, name)
    return name


def shape_of(cam, cmds=None):
    cmds = _cmds(cmds)
    shapes = cmds.listRelatives(cam, shapes=True, type="camera") or []
    return shapes[0] if shapes else cam


def apply_pose(cam, pose, cmds=None):
    cmds = _cmds(cmds)
    k = scale(cmds)
    shape = shape_of(cam, cmds)
    cmds.setAttr(cam + ".translate", pose["tx"] * k, pose["ty"] * k, pose["tz"] * k, type="double3")
    cmds.setAttr(cam + ".rotate", pose["rx"], pose["ry"], pose["rz"], type="double3")
    cmds.setAttr(shape + ".focalLength", pose["focal"])
    cmds.setAttr(shape + ".fStop", pose["fstop"])
    cmds.setAttr(shape + ".focusDistance", pose["focus"] * k)
    cmds.setAttr(shape + ".depthOfField", bool(pose["dof"]))
    cmds.setAttr(shape + ".shutterAngle", pose["shutter"])
    cmds.setAttr(shape + ".shakeEnabled", pose["shake"] > 0)
    cmds.setAttr(shape + ".horizontalShake", pose["shake"])
    cmds.setAttr(shape + ".verticalShake", pose["shake"] * 0.6)


def key_pose(cam, frame, pose, stepped=False, cmds=None):
    cmds = _cmds(cmds)
    apply_pose(cam, pose, cmds)
    shape = shape_of(cam, cmds)
    plugs = [cam + "." + a for a in KEYED] + [shape + "." + a for a in KEYED_SHAPE]
    for plug in plugs:
        cmds.setKeyframe(plug, time=frame)
        if stepped:
            cmds.keyTangent(plug, time=(frame, frame), outTangentType="step")
        else:
            cmds.keyTangent(plug, time=(frame, frame), inTangentType="auto", outTangentType="auto")


def key_timeline(panels, cam=CAMERA, fps=24.0, start=1, subject=(0.0, 0.0, 0.0), eye=1.6, shots=True, cmds=None):
    """Key one shot per storyboard panel on one camera, and (optionally) a Camera Sequencer shot for each.
    Returns the shots from curio_camera.timeline."""
    cmds = _cmds(cmds)
    cam = ensure_camera(cam, cmds)
    plan = cc.timeline(panels, fps=fps, start=start, subject=subject, eye=eye)
    for shot in plan:
        for frame, pose in shot["keys"]:
            key_pose(cam, frame, pose, shot["stepped"], cmds)
        if shots:
            name = "curioShot%d" % (shot["panel"] + 1)
            if cmds.objExists(name):
                cmds.delete(name)
            cmds.shot(name, startTime=shot["start"], endTime=shot["end"], currentCamera=cam)
    if plan:
        cmds.playbackOptions(minTime=plan[0]["start"], maxTime=plan[-1]["end"])
    return plan


def read_pose(cam=CAMERA, time=None, cmds=None):
    """The camera as a pose (metres and degrees), at a frame or now."""
    cmds = _cmds(cmds)
    k = scale(cmds)
    shape = shape_of(cam, cmds)
    kw = {} if time is None else {"time": time}
    g = lambda plug: cmds.getAttr(plug, **kw)  # noqa: E731
    return {
        "tx": g(cam + ".translateX") / k, "ty": g(cam + ".translateY") / k, "tz": g(cam + ".translateZ") / k,
        "rx": g(cam + ".rotateX"), "ry": g(cam + ".rotateY"), "rz": g(cam + ".rotateZ"),
        "focal": g(shape + ".focalLength"), "fstop": g(shape + ".fStop"), "focus": g(shape + ".focusDistance") / k,
        "dof": bool(g(shape + ".depthOfField")), "shutter": g(shape + ".shutterAngle"),
        "shake": g(shape + ".horizontalShake") if g(shape + ".shakeEnabled") else 0.0,
    }


def read_timeline(panels, cam=CAMERA, fps=24.0, start=1, subject=(0.0, 0.0, 0.0), eye=1.6, cmds=None):
    """Read the camera at the start of each panel's shot back as curiosities, one dict per panel."""
    cmds = _cmds(cmds)
    plan = cc.timeline(panels, fps=fps, start=start, subject=subject, eye=eye)
    return [cc.values_from_camera(read_pose(cam, shot["start"], cmds), subject, eye) for shot in plan]
