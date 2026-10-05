"""Tests for the Unreal plugin, with a stand-in `unreal` module (fake_unreal.py) and a stand-in bridge.

    python3 -m unittest discover -s apps/curiosities/unreal/tests
"""
import itertools
import json
import math
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "Curiosities", "Content", "Python"))

import fake_unreal  # noqa: E402

sys.modules["unreal"] = fake_unreal

from curiosities_unreal import curio_camera as cc  # noqa: E402
from curiosities_unreal import ue_map  # noqa: E402
from curiosities_unreal import unreal_link as link  # noqa: E402


class Bridge(object):
    """timeline=None is an app without the engine ("unknown type"); a list is the engine's film."""

    def __init__(self, panels, timeline=None, old=False):
        self.panels, self.sent, self.queue, self.closed, self.timeline, self.old = panels, [], [], False, timeline, old

    def send(self, msg):
        self.sent.append(msg)
        if msg["type"] == "panels":
            self.queue.append({"type": "panels", "panels": self.panels})
        elif msg["type"] == "timeline":
            if self.old:
                self.queue.append({"type": "error", "error": "unknown key undefined"})  # apps before the engine
            elif self.timeline is None:
                self.queue.append({"type": "error", "error": "unknown type timeline"})
            else:
                self.queue.append({"type": "timeline", "panels": self.timeline, "rows": [], "tracks": [], "byTrack": {}})

    def poll(self):
        out, self.queue = self.queue, []
        return out

    def close(self):
        self.closed = True


def forward(ue):
    """Unreal's forward vector for a pitch and yaw (X forward, Y right, Z up)."""
    p, y = math.radians(ue["pitch"]), math.radians(ue["yaw"])
    return (math.cos(p) * math.cos(y), math.cos(p) * math.sin(y), math.sin(p))


class Mapping(unittest.TestCase):
    def test_round_trip_every_framing(self):
        for size, lens, height in itertools.product(cc.FRAME, cc.LENS, ("floor", "low", "eye", "high", "overhead")):
            v = {"shotSize": size, "lensLength": lens, "angleHeight": height}
            back = ue_map.values_from_ue(ue_map.to_ue(cc.camera_for(v)))
            self.assertEqual((back["shotSize"], back["lensLength"], back["angleHeight"]), (size, lens, height), v)

    def test_camera_looks_at_the_eyes_in_unreal(self):
        for move in ("none", "orbit", "push in", "crane"):
            v = {"shotSize": "medium", "angleHeight": "high", "cameraMove": move, "cameraCarry": "smooth"}
            a = cc.camera_for(v)
            for pose in (a, cc.end_pose(v, a)):
                ue = ue_map.to_ue(pose)
                to_eyes = (0 - ue["x"], 0 - ue["y"], 160 - ue["z"])
                n = math.sqrt(sum(c * c for c in to_eyes))
                f = forward(ue)
                self.assertGreater(sum(a_ * b_ / n for a_, b_ in zip(f, to_eyes)), 0.999, move)

    def test_units_and_up(self):
        ue = ue_map.to_ue(cc.camera_for({"shotSize": "wide", "lensLength": "normal", "angleHeight": "eye"}))
        self.assertAlmostEqual(ue["z"], 160.0)
        self.assertLess(ue["x"], 0)  # in front of the subject, looking down +X
        self.assertAlmostEqual(ue["y"], 0.0)

    def test_subject_from_unreal(self):
        self.assertEqual(ue_map.subject_from_ue((-200.0, 50.0, 10.0)), (0.5, 0.1, 2.0))

    def test_wobble_only_when_shaky(self):
        s = ue_map.shots([{"cameraCarry": "locked"}, {"cameraCarry": "handheld", "shotDuration": "short"}], 24)
        self.assertEqual(s[0]["wobble"], [])
        self.assertEqual(len(s[1]["wobble"]), 12)
        self.assertTrue(all(abs(dp) < 1 and abs(dy) < 1 for _, dp, dy in s[1]["wobble"]))


PANELS = [
    {"shotSize": "wide", "lensLength": "wide", "angleHeight": "eye", "cameraCarry": "locked", "shotDuration": "medium"},
    {"shotSize": "close", "lensLength": "long", "angleHeight": "low", "cameraCarry": "smooth", "cameraMove": "push in", "shotDuration": "long"},
    {"shotSize": "medium", "lensLength": "normal", "angleHeight": "high", "cameraCarry": "handheld", "shotDuration": "short", "dutch": "tilted"},
]


class InUnreal(unittest.TestCase):
    def setUp(self):
        fake_unreal.EditorActorSubsystem.actors = []
        fake_unreal.EditorActorSubsystem.selected = []
        fake_unreal._Assets.store = {}
        link.state.update({"client": None, "tick": None, "panel": 0, "follow": True, "panels": [], "waiting": None, "since": 0.0,
                           "timeline": True})

    def test_camera_is_made_once_with_a_full_frame_back(self):
        a = link.camera()
        self.assertIs(link.camera(), a)
        self.assertEqual(a.get_actor_label(), "CurioCam")
        self.assertEqual(a.comp.filmback.sensor_height, 24.0)

    def test_follow_the_board_through_the_tick(self):
        bridge = Bridge(PANELS)
        link.state["client"] = bridge
        link.state["panel"] = 1
        link._tick(0.3)  # asks for the timeline
        link._tick(0.01)  # no engine here: asks for panels
        link._tick(0.01)  # gets them and moves the camera
        cam = link.camera(create=False)
        self.assertEqual(cam.comp.current_focal_length, 85.0)
        self.assertLess(cam.loc.z, 160.0)  # low angle
        self.assertEqual(ue_map.values_from_ue(link.read_pose(cam))["shotSize"], "close")

    def test_key_the_engines_whole_film(self):
        film = PANELS * 4  # 12 moments, more than My film's 8 panels
        bridge = Bridge(PANELS[:1], timeline=film + [{"notACameraCuriosity": 1}])
        link.state["client"] = bridge
        got = []
        link._with_panels(got.append)
        link._tick(0.01)
        self.assertEqual(len(got[0]), 13)
        self.assertNotIn("notACameraCuriosity", got[0][-1])
        self.assertEqual([m["type"] for m in bridge.sent], ["timeline"])

    def test_empty_engine_film_falls_back_to_panels(self):
        bridge = Bridge(PANELS, timeline=[])
        link.state["client"] = bridge
        got = []
        link._with_panels(got.append)
        link._tick(0.01)
        link._tick(0.01)
        self.assertEqual(len(got[0]), 3)
        self.assertTrue(link.state["timeline"], "still asks the engine next time")

    def test_app_from_before_the_engine_falls_back_to_panels(self):
        bridge = Bridge(PANELS, old=True)  # it answers "unknown key undefined" to a timeline ask
        link.state["client"] = bridge
        link.state["timeline"] = True
        got = []
        link._with_panels(got.append)
        link._tick(0.01)
        link._tick(0.01)
        self.assertEqual(len(got[0]), 3)
        self.assertFalse(link.state["timeline"], "asks for panels from now on")
        self.assertTrue(link.no_timeline("unknown type timeline"))
        self.assertFalse(link.no_timeline("unknown type panels"))
        self.assertFalse(link.no_timeline(None))

    def test_key_shots(self):
        seq = link._key_shots(PANELS)
        self.assertEqual(seq.end, 48 + 96 + 24)
        b = seq.bindings[0]
        ch = link._channels(b.tracks[0].sections[0])
        x = ch["Location.X"].keys
        locked = [k for k in x if k.frame < 48]
        self.assertEqual([k.interp for k in locked], [fake_unreal.MovieSceneKeyInterpolation.CONSTANT])
        moving = [k.frame for k in x if 48 <= k.frame < 144]
        self.assertEqual(moving, [48, 143])
        shaky = [k for k in ch["Rotation.Y"].keys if k.frame >= 144]
        self.assertEqual(len(shaky), 12)
        self.assertTrue(all(abs(k.value) < 60 for k in shaky))
        self.assertEqual(ch["Rotation.X"].keys[-1].value, -15.0)  # dutch
        self.assertEqual([m.label for m in seq.marks], ["Curio shot 1", "Curio shot 2", "Curio shot 3"])
        self.assertEqual(seq.marks[1].frame_number.value, 48 * 1000)  # 24000 ticks a second at 24 fps
        focal = seq.bindings[1].tracks[0]
        self.assertEqual(focal.prop, "CurrentFocalLength")
        self.assertEqual([k.value for k in focal.sections[0].channels[0].keys], [24.0, 85.0, 35.0])
        self.assertIsNotNone(seq.tracks[0].sections[0].camera)
        self.assertEqual(json.loads(seq.meta["curio_shots"])["shots"][1], [48, 143, False])

    def test_read_shots_back_onto_the_board(self):
        link._key_shots(PANELS)
        bridge = Bridge(PANELS)
        link.state["client"] = bridge
        per = link._read_shots(PANELS)
        self.assertEqual([p["shotSize"] for p in per], ["wide", "close", "medium"])
        self.assertEqual([p["angleHeight"] for p in per], ["eye", "low", "high"])
        self.assertEqual([p["lensLength"] for p in per], ["wide", "long", "normal"])
        applied = [m for m in bridge.sent if m["type"] == "apply"][0]
        self.assertEqual(applied["label"], "Unreal camera")
        self.assertEqual(applied["values"]["shotSize"], ["wide", "close", "medium"])

    def test_read_camera_onto_the_chosen_panel(self):
        cam = link.camera()
        link.apply_pose(cam, ue_map.to_ue(cc.camera_for({"shotSize": "insert", "lensLength": "long", "angleHeight": "overhead"})))
        bridge = Bridge(PANELS)
        link.state.update({"client": bridge, "panel": 2})
        link._read_camera(PANELS)
        values = [m for m in bridge.sent if m["type"] == "apply"][0]["values"]
        self.assertEqual(values["shotSize"], [None, None, "insert"])
        self.assertEqual(values["angleHeight"], [None, None, "overhead"])

    def test_subject_is_the_selected_actor(self):
        fake_unreal.EditorActorSubsystem.selected = [fake_unreal.Actor("Hero", fake_unreal.Vector(x=-100.0, y=300.0, z=0.0))]
        link.state["panel"] = 0
        link.follow(PANELS)
        cam = link.camera(create=False)
        self.assertAlmostEqual(cam.loc.y, 300.0)

    def test_plain_problems(self):
        self.assertFalse(link.connect("ws://127.0.0.1:9"))
        self.assertIn("not answering", fake_unreal.dialogs[-1])
        self.assertIsNone(link._read_shots(PANELS))
        self.assertIn("Key shots first", fake_unreal.dialogs[-1])

    def test_menus(self):
        self.assertTrue(link.register_menus())
        sub = fake_unreal.ToolMenus._menus["LevelEditor.MainMenu.Tools"].subs[-1]
        self.assertEqual(len(sub.entries), len(link.MENU))
        for e in sub.entries:
            code = e.command[1]
            self.assertTrue(code.startswith("import curiosities_unreal.unreal_link as curio; curio."))
            self.assertTrue(hasattr(link, code.split("curio.")[1].split("(")[0]))


class Install(unittest.TestCase):
    def test_installed_plugin_stands_alone(self):
        import shutil
        import subprocess
        import tempfile

        sys.path.insert(0, os.path.dirname(HERE))
        import install

        tmp = tempfile.mkdtemp()
        try:
            open(os.path.join(tmp, "Film.uproject"), "w").write("{}")
            target = install.install(tmp)
            self.assertTrue(os.path.exists(os.path.join(target, "Curiosities.uplugin")))
            json.load(open(os.path.join(target, "Curiosities.uplugin")))
            py = os.path.join(target, "Content", "Python")
            # The copied mapping is the real file, not the repository shim, and it loads with no repo around it.
            out = subprocess.check_output([sys.executable, "-c", "import sys; sys.path.insert(0, %r); "
                                           "from curiosities_unreal import curio_camera as c; print(c.LENS['long'], c.__file__)" % py]).decode()
            self.assertTrue(out.startswith("85.0 " + py))
            self.assertNotIn("spec_from_file_location", open(os.path.join(py, "curiosities_unreal", "curio_camera.py")).read())
            install.remove(tmp)
            self.assertFalse(os.path.exists(target))
        finally:
            shutil.rmtree(tmp)


if __name__ == "__main__":
    unittest.main()
