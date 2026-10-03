"""python3 -m unittest discover -s apps/curiosities/maya/tests  (no Maya needed)"""
import itertools
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from curiosities_maya import curio_camera as cc  # noqa: E402


class RoundTrip(unittest.TestCase):
    def test_every_framing_reads_back(self):
        for size, lens, height, dutch, dof, blur in itertools.product(
            cc.FRAME, cc.LENS, cc.HEIGHT, ("level", "tilted"), cc.FSTOP, cc.SHUTTER
        ):
            v = {"shotSize": size, "lensLength": lens, "angleHeight": height, "dutch": dutch, "depthOfField": dof, "motionBlur": blur, "cameraShake": 3}
            back = cc.values_from_camera(cc.camera_for(v, subject=(2, 0, -1), eye=1.7), subject=(2, 0, -1), eye=1.7)
            for k in v:
                self.assertEqual(back[k], v[k], (k, v, back))

    def test_low_angle_looks_up_and_high_looks_down(self):
        self.assertGreater(cc.camera_for({"angleHeight": "low"})["rx"], 0)
        self.assertLess(cc.camera_for({"angleHeight": "high"})["rx"], 0)
        self.assertEqual(cc.camera_for({"angleHeight": "overhead"})["rx"], -90.0)

    def test_closer_shot_is_closer(self):
        d = {k: cc.camera_for({"shotSize": k})["tz"] for k in cc.FRAME}
        self.assertLess(d["insert"], d["close"])
        self.assertLess(d["close"], d["medium"])
        self.assertLess(d["medium"], d["wide"])

    def test_handheld_shakes(self):
        self.assertGreater(cc.camera_for({"cameraCarry": "handheld"})["shake"], 0)
        self.assertEqual(cc.camera_for({"cameraCarry": "smooth"})["shake"], 0)


class Moves(unittest.TestCase):
    def test_push_in_ends_closer(self):
        v = {"cameraMove": "push in", "moveSpeed": 3}
        a = cc.camera_for(v)
        self.assertLess(cc.end_pose(v, a)["tz"], a["tz"])

    def test_locked_does_not_move(self):
        v = {"cameraMove": "pan", "cameraCarry": "locked"}
        a = cc.camera_for(v)
        self.assertEqual(cc.end_pose(v, a), a)

    def test_every_move_changes_something(self):
        for move in ("pan", "tilt", "push in", "pull out", "track", "crane", "zoom", "orbit"):
            v = {"cameraMove": move}
            a = cc.camera_for(v)
            self.assertNotEqual(cc.end_pose(v, a), a, move)


class Timeline(unittest.TestCase):
    def test_shots_follow_each_other(self):
        shots = cc.timeline([{"shotDuration": "short"}, {"shotDuration": "long", "cameraMove": "zoom"}, {}], fps=24, start=1)
        self.assertEqual([(s["start"], s["end"]) for s in shots], [(1, 24), (25, 120), (121, 168)])
        self.assertEqual(len(shots[0]["keys"]), 1)
        self.assertEqual(len(shots[1]["keys"]), 2)
        self.assertEqual(shots[1]["keys"][1][0], 120)


if __name__ == "__main__":
    unittest.main()
