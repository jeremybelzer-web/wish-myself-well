"""maya_camera against a stand-in for maya.cmds that keeps attributes and keys in dicts."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from curiosities_maya import curio_camera as cc  # noqa: E402
from curiosities_maya import maya_camera as mc  # noqa: E402


class FakeCmds(object):
    def __init__(self, unit="cm"):
        self.unit, self.attrs, self.keys, self.tangents, self.shots, self.nodes = unit, {}, {}, {}, {}, set()
        self.playback = None

    def currentUnit(self, query=True, linear=False, time=False):
        return self.unit

    def objExists(self, name):
        return name in self.nodes or name in self.shots

    def camera(self):
        self.nodes.update(["camera1", "camera1Shape"])
        return ["camera1", "camera1Shape"]

    def rename(self, old, new):
        self.nodes.discard(old)
        self.nodes.update([new, new + "Shape"])
        self.renamed = new

    def listRelatives(self, node, shapes=True, type=None):
        return [node + "Shape"]

    def setAttr(self, plug, *vals, **kw):
        node, attr = plug.split(".", 1)
        if attr in ("translate", "rotate"):
            for axis, v in zip("XYZ", vals):
                self.attrs["%s.%s%s" % (node, attr, axis)] = v
        else:
            self.attrs[plug] = vals[0]

    def setKeyframe(self, plug, time):
        self.keys.setdefault(plug, {})[time] = self.attrs[plug]

    def keyTangent(self, plug, time, **kw):
        self.tangents[(plug, time[0])] = kw.get("outTangentType")

    def getAttr(self, plug, time=None):
        if time is not None and plug in self.keys:
            ks = self.keys[plug]
            return ks[max(t for t in ks if t <= time)]
        return self.attrs[plug]

    def shot(self, name, startTime, endTime, currentCamera):
        self.shots[name] = (startTime, endTime, currentCamera)

    def delete(self, name):
        self.shots.pop(name, None)

    def playbackOptions(self, minTime, maxTime):
        self.playback = (minTime, maxTime)


PANELS = [
    {"shotSize": "wide", "angleHeight": "high", "lensLength": "wide", "shotDuration": "short", "cameraCarry": "locked"},
    {"shotSize": "close", "angleHeight": "low", "lensLength": "long", "cameraMove": "push in", "depthOfField": "shallow"},
    {"shotSize": "insert", "angleHeight": "overhead", "dutch": "tilted", "cameraCarry": "handheld"},
]


class KeyAndRead(unittest.TestCase):
    def test_key_then_read_back(self):
        cmds = FakeCmds("cm")
        plan = mc.key_timeline(PANELS, fps=24, start=1, cmds=cmds)
        self.assertEqual(sorted(cmds.shots), ["curioShot1", "curioShot2", "curioShot3"])
        self.assertEqual(cmds.playback, (1, plan[-1]["end"]))
        self.assertEqual(cmds.tangents[("curioCam.translateX", 1)], "step")
        back = mc.read_timeline(PANELS, fps=24, start=1, cmds=cmds)
        for want, got in zip(PANELS, back):
            for k in ("shotSize", "angleHeight", "lensLength", "dutch"):
                if k in want:
                    self.assertEqual(got[k], want[k], (k, want, got))
        self.assertGreater(back[2]["cameraShake"], 0)

    def test_scene_units(self):
        for unit, k in (("cm", 100.0), ("m", 1.0), ("mm", 1000.0)):
            cmds = FakeCmds(unit)
            cam = mc.ensure_camera(cmds=cmds)
            pose = cc.camera_for({"shotSize": "medium"})
            mc.apply_pose(cam, pose, cmds)
            self.assertAlmostEqual(cmds.attrs["curioCam.translateZ"], pose["tz"] * k)
            self.assertAlmostEqual(mc.read_pose(cam, cmds=cmds)["tz"], pose["tz"])


if __name__ == "__main__":
    unittest.main()
