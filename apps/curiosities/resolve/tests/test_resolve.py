"""Tests for the Resolve bridge, with a stand-in for Resolve and for the desktop app's bridge.

    python3 -m unittest discover -s apps/curiosities/resolve/tests

The trace test also asks the app's own trace check (trace.js, through core/headless.js) whether the file
loads, when node is installed.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
APP = os.path.dirname(ROOT)
sys.path.insert(0, ROOT)

from curiosities_resolve import curio_resolve as cr  # noqa: E402
from curiosities_resolve import resolve_link as rl  # noqa: E402


class Item(object):
    def __init__(self, start, end):
        self.start, self.end = start, end

    def GetStart(self):
        return self.start

    def GetEnd(self):
        return self.end


class Timeline(object):
    def __init__(self, name="Cut 1", start=86400, rate="24", clips=(), end=None):
        self.name, self.start, self.rate = name, start, rate
        self.items = [Item(start + a, start + b) for a, b in clips]
        self.end = end if end is not None else (start + (clips[-1][1] if clips else 0))
        self.markers = {}

    def GetName(self):
        return self.name

    def GetSetting(self, key):
        return self.rate if key == "timelineFrameRate" else ""

    def GetStartFrame(self):
        return self.start

    def GetItemListInTrack(self, kind, track):
        return list(self.items) if kind == "video" and track == 1 else []

    def GetMarkers(self):
        return dict(self.markers)

    def AddMarker(self, frame, color, name, note, duration, custom):
        # Resolve keeps markers inside the timeline only, one per frame.
        if frame in self.markers or (self.end > self.start and frame >= self.end - self.start):
            return False
        self.markers[frame] = {"color": color, "name": name, "note": note, "duration": duration, "customData": custom}
        return True

    def DeleteMarkerAtFrame(self, frame):
        return self.markers.pop(frame, None) is not None


class Pool(object):
    def __init__(self, project):
        self.project = project

    def CreateEmptyTimeline(self, name):
        return Timeline(name, end=86400 + 24 * 600)


class Project(object):
    def __init__(self, timeline):
        self.timeline = timeline

    def GetCurrentTimeline(self):
        return self.timeline

    def SetCurrentTimeline(self, t):
        self.timeline = t
        return True

    def GetMediaPool(self):
        return Pool(self)


class Resolve(object):
    def __init__(self, timeline=None, project=True):
        self.project = Project(timeline) if project else None

    def GetProjectManager(self):
        me = self

        class PM(object):
            def GetCurrentProject(self):
                return me.project

        return PM()


class FakeBridge(object):
    """Answers like the desktop app: panels, apply (no answer), errors. timeline=None is an app without the engine
    (it answers "unknown type"); a list is the engine's film, every moment."""

    def __init__(self, panels, timeline=None):
        self.panels, self.sent, self.queue, self.closed, self.applied = panels, [], [], False, None
        self.timeline = timeline

    def send(self, msg):
        self.sent.append(msg)
        if msg["type"] == "panels":
            ids = msg.get("ids")
            self.queue.append({"type": "value", "key": "c:shotSize", "m": 0.5})  # streamed values are ignored
            self.queue.append({"type": "panels", "panels": [{k: v for k, v in p.items() if not ids or k in ids} for p in self.panels]})
        elif msg["type"] == "apply":
            self.applied = msg
        elif msg["type"] == "timeline" and self.timeline is not None:
            self.queue.append({"type": "timeline", "name": "Film", "rows": [{"id": "r%d" % i, "label": str(i)} for i in range(len(self.timeline))],
                               "tracks": [], "panels": self.timeline, "byTrack": {}})
        else:
            self.queue.append({"type": "error", "error": "unknown type " + msg["type"]})

    def poll(self):
        out, self.queue = self.queue, []
        return out

    def close(self):
        self.closed = True


PANELS = [
    {"shotSize": "wide", "angleHeight": "eye", "emotion": "curious", "shotDuration": "long"},
    {"shotSize": "close", "emotion": "anxious", "shotDuration": "short", "laughsPerMinute": 2},
    {"shotSize": "medium", "shotDuration": "medium"},
]


class Mapping(unittest.TestCase):
    def test_markers_follow_the_holds(self):
        ms = cr.storyboard_markers(PANELS, 24)
        self.assertEqual([m["frame"] for m in ms], [0, 96, 120])
        self.assertEqual([m["duration"] for m in ms], [96, 24, 48])
        self.assertEqual([m["color"] for m in ms], ["Cyan", "Lavender", "Cream"])
        self.assertIn("shotSize: close", ms[1]["note"])
        self.assertEqual(cr.marker_values(ms[1]), PANELS[1])

    def test_words_from_lengths(self):
        self.assertEqual([cr.shot_duration_word(s) for s in (0.5, 1.4, 1.5, 2.8, 3, 9)], ["short", "short", "medium", "medium", "long", "long"])
        self.assertEqual([cr.cut_rate_word(s) for s in (1, 2, 5, 6)], ["fast", "medium", "medium", "slow"])

    def test_marker_text_reads_only_id_value_lines(self):
        got = cr.parse_text("emotion: anxious\nShe says: get out of my house right now, all of you\nlaughsPerMinute = 3\nmusic.tempo: 120\n2bad: x")
        self.assertEqual(got, {"emotion": "anxious", "laughsPerMinute": 3, "music.tempo": 120})

    def test_clean_keeps_only_known_values_on_scale(self):
        got = cr.clean({"shotSize": "wide", "Line": "I never said that", "emotion": "furious", "laughsPerMinute": 99})
        self.assertEqual(set(got), {"shotSize", "laughsPerMinute"})
        self.assertGreater(len(cr.catalog()), 200)

    def test_edit_values(self):
        shots = [{"start": 0, "end": 24}, {"start": 24, "end": 48}, {"start": 48, "end": 300}]
        per = cr.edit_values(shots, {30: {"name": "emotion: angry", "note": "", "customData": ""}}, 24)
        self.assertEqual([p["shotDuration"] for p in per], ["short", "short", "long"])
        self.assertEqual(per[1]["emotion"], "angry")
        self.assertNotIn("emotion", per[0])
        self.assertEqual(cr.apply_values(per, 2)["shotDuration"], ["short", "short"])


class InResolve(unittest.TestCase):
    def test_send_storyboard_puts_markers_and_replaces_its_own(self):
        tl = Timeline(clips=[(0, 2400)])
        tl.markers[500] = {"name": "an editor's note", "note": "", "duration": 1, "customData": "", "color": "Red"}
        r = Resolve(tl)
        self.assertEqual(rl.send_storyboard(r, client=FakeBridge(PANELS)), 3)
        self.assertEqual(rl.send_storyboard(r, client=FakeBridge(PANELS[:1])), 1)
        ours = [f for f, m in tl.markers.items() if m["customData"].startswith("curio:")]
        self.assertEqual(ours, [0])
        self.assertIn(500, tl.markers, "other people's markers stay")

    def test_send_uses_the_engines_whole_film(self):
        tl = Timeline(clips=[(0, 24 * 600)])
        film = [{"shotSize": "wide", "shotDuration": "short", "laughsPerMinute": 1}] * 12
        bridge = FakeBridge(PANELS, timeline=film)
        self.assertEqual(rl.send_storyboard(Resolve(tl), client=bridge), 12)
        self.assertEqual([m["type"] for m in bridge.sent], ["timeline"])

    def test_send_falls_back_to_the_storyboard(self):
        for timeline in (None, []):  # an app without the engine, an engine with no film yet
            bridge = FakeBridge(PANELS, timeline=timeline)
            self.assertEqual(rl.send_storyboard(Resolve(Timeline(clips=[(0, 2400)])), client=bridge), 3)
            self.assertEqual([m["type"] for m in bridge.sent], ["timeline", "panels"])

    def test_send_makes_a_timeline_when_none_is_open(self):
        r = Resolve(None)
        rl.send_storyboard(r, client=FakeBridge(PANELS))
        self.assertEqual(r.project.timeline.GetName(), "Curiosities storyboard")
        self.assertEqual(len(r.project.timeline.markers), 3)

    def test_read_edit_applies_a_strand(self):
        tl = Timeline(clips=[(0, 24), (24, 48), (48, 300), (300, 330)])
        tl.markers[30] = {"name": "emotion: fearful", "note": "", "duration": 1, "customData": "", "color": "Blue"}
        bridge = FakeBridge(PANELS)
        per = rl.read_edit(Resolve(tl), client=bridge)
        self.assertEqual(len(per), 4)
        self.assertEqual(bridge.applied["label"], "Resolve edit")
        self.assertEqual(bridge.applied["values"]["shotDuration"], ["short", "short", "long"])
        self.assertEqual(bridge.applied["values"]["emotion"], [None, "fearful", None])

    def test_storyboard_markers_read_back_without_clips(self):
        tl = Timeline(clips=[], end=86400 + 24 * 600)
        r = Resolve(tl)
        rl.send_storyboard(r, client=FakeBridge(PANELS))
        shots, markers = rl.read_shots(tl)
        per = cr.edit_values(shots, markers, 24)
        self.assertEqual([p["shotSize"] for p in per], ["wide", "close", "medium"])
        self.assertEqual([p["shotDuration"] for p in per], ["long", "short", "medium"])

    def test_problems_are_plain(self):
        self.assertIsNone(rl.run("trace", {"resolve": Resolve(None)}))
        self.assertIsNone(rl.run("trace", {"resolve": Resolve(project=False)}))
        self.assertIsNone(rl.run("send", {"resolve": Resolve(Timeline())}, url="ws://127.0.0.1:9"))


class Trace(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_trace_file_loads_in_the_app(self):
        tl = Timeline(name="My Cut: Night", clips=[(0, 24), (24, 72), (72, 400)])
        tl.markers[10] = {"name": "Line: I never said that", "note": "emotion: angry\nnotACuriosity: 4", "duration": 1, "customData": "", "color": "Red"}
        path = rl.trace_edit(Resolve(tl), folder=self.tmp, traced_by="Sharani")
        with open(path) as f:
            data = json.load(f)
        self.assertEqual(os.path.basename(path), "my-cut--night.curiotrace.json")
        self.assertEqual(data["format"], "curiosities-trace")
        self.assertEqual([b["at"] for b in data["beats"]], ["0:00", "0:01", "0:03"])
        self.assertNotIn("I never said that", json.dumps(data))
        self.assertNotIn("notACuriosity", json.dumps(data))
        if not shutil.which("node"):
            self.skipTest("node is not installed")
        js = (
            "const c=require(%r).load({database:false});const r=c.CuriosityTrace.check(require('fs').readFileSync(%r,'utf8'));"
            "console.log(JSON.stringify({ok:r.ok,beats:r.trace&&r.trace.beats,dropped:r.dropped}))"
        ) % (os.path.join(APP, "core", "headless.js"), path)
        out = json.loads(subprocess.check_output(["node", "-e", js]).decode())
        self.assertTrue(out["ok"])
        self.assertEqual(out["beats"][0]["values"], {"emotion": "angry", "shotDuration": "short", "cutRate": "medium"})
        self.assertEqual(out["dropped"], {"ids": {}, "values": 0, "notes": 0}, "nothing for the app to drop")

    def test_install_and_run_a_menu_script(self):
        sys.path.insert(0, ROOT)
        import install

        scripts, lib = os.path.join(self.tmp, "Utility"), os.path.join(self.tmp, "lib")
        menu = install.install(scripts, lib)
        self.assertEqual(sorted(os.listdir(menu)), sorted(k + ".py" for k in install.MENU))
        tl = Timeline(name="Menu", clips=[(0, 48)])
        script = os.path.join(menu, "Trace this edit into a shared film.py")
        home = os.environ.get("HOME")
        os.environ["HOME"] = self.tmp
        try:
            with open(script) as f:
                code = f.read()
            exec(compile(code, script, "exec"), {"resolve": Resolve(tl), "__name__": "__main__"})
        finally:
            os.environ["HOME"] = home
        self.assertTrue(os.path.exists(os.path.join(self.tmp, "menu.curiotrace.json")))
        install.remove(scripts, lib)
        self.assertFalse(os.path.exists(menu))


if __name__ == "__main__":
    unittest.main()
