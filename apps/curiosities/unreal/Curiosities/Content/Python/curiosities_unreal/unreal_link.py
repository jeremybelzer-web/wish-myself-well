"""The Unreal side: a CineCameraActor called CurioCam, a Level Sequence called CurioShots, and the desktop app's
bridge. Runs in the Unreal Editor's Python (the Python Editor Script Plugin). Menus: Tools > Curiosities.

- connect() / disconnect(): talk to the desktop app (ws://127.0.0.1:7577, or CURIO_BRIDGE). While connected,
  CurioCam follows the chosen storyboard panel (follow on, panel 1 to start), running automation included.
- next_panel() / previous_panel(): choose the panel to follow.
- key_shots(): every panel as one shot, back to back, in /Game/Curiosities/CurioShots: CurioCam's transform,
  focal length, aperture and focus keyed, a camera cut, and a marked frame per shot ("Curio shot 3").
  Locked shots hold still; handheld shots wobble on their own frames.
- read_camera(): CurioCam as you set it by hand -> the panel's camera curiosities, as the strand "Unreal camera".
- read_shots(): every shot of CurioShots read back the same way.
The subject is the selected actor (its pivot at the feet), otherwise the world origin; eyes 160 cm up.
"""
import json
import os

import unreal

from . import curio_camera as cc
from . import ue_map
from .ws_client import Client

URL = os.environ.get("CURIO_BRIDGE", "ws://127.0.0.1:7577")
CAMERA_LABEL = "CurioCam"
SEQ_DIR, SEQ_NAME = "/Game/Curiosities", "CurioShots"
SEQ_PATH = SEQ_DIR + "/" + SEQ_NAME
EYE = 1.6
POLL = 0.25
FPS = 24

state = {"client": None, "tick": None, "since": 0.0, "panel": 0, "follow": True, "panels": [], "waiting": None}


def say(text):
    unreal.log("Curiosities: " + text)


def problem(text):
    unreal.log_warning("Curiosities: " + text)
    try:
        unreal.EditorDialog.show_message("Curiosities", text, unreal.AppMsgType.OK)
    except Exception:  # a dialog is only a courtesy; the log has it
        pass


# ---------- the camera ----------

def _actors():
    return unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def camera(create=True):
    for a in _actors().get_all_level_actors():
        if isinstance(a, unreal.CineCameraActor) and a.get_actor_label() == CAMERA_LABEL:
            return a
    if not create:
        return None
    a = _actors().spawn_actor_from_class(unreal.CineCameraActor, unreal.Vector(0, 0, 0), unreal.Rotator())
    a.set_actor_label(CAMERA_LABEL)
    comp = a.get_cine_camera_component()
    comp.set_editor_property("filmback", unreal.CameraFilmbackSettings(sensor_width=36.0, sensor_height=cc.FILM_HEIGHT_MM))
    return a


def subject():
    """(subject in the mapping's metres, Y up) from the selected actor, or the origin."""
    for a in _actors().get_selected_level_actors():
        if a.get_actor_label() != CAMERA_LABEL:
            loc = a.get_actor_location()
            return ue_map.subject_from_ue((loc.x, loc.y, loc.z))
    return (0.0, 0.0, 0.0)


def _rot(ue):
    return unreal.Rotator(roll=ue["roll"], pitch=ue["pitch"], yaw=ue["yaw"])


def apply_pose(actor, ue):
    actor.set_actor_location(unreal.Vector(ue["x"], ue["y"], ue["z"]), False, False)
    actor.set_actor_rotation(_rot(ue), False)
    comp = actor.get_cine_camera_component()
    comp.set_editor_property("current_focal_length", ue["focal"])
    comp.set_editor_property("current_aperture", ue["aperture"])
    method = unreal.CameraFocusMethod.MANUAL if ue["dof"] else unreal.CameraFocusMethod.DISABLE
    comp.set_editor_property("focus_settings", unreal.CameraFocusSettings(focus_method=method, manual_focus_distance=ue["focus"]))
    pp = comp.get_editor_property("post_process_settings")
    pp.set_editor_property("override_motion_blur_amount", True)
    pp.set_editor_property("motion_blur_amount", ue["blur"])
    comp.set_editor_property("post_process_settings", pp)


def read_pose(actor):
    loc, rot = actor.get_actor_location(), actor.get_actor_rotation()
    comp = actor.get_cine_camera_component()
    focus = comp.get_editor_property("focus_settings")
    pp = comp.get_editor_property("post_process_settings")
    return {
        "x": loc.x, "y": loc.y, "z": loc.z, "pitch": rot.pitch, "yaw": rot.yaw, "roll": rot.roll,
        "focal": comp.get_editor_property("current_focal_length"),
        "aperture": comp.get_editor_property("current_aperture"),
        "focus": focus.get_editor_property("manual_focus_distance"),
        "dof": focus.get_editor_property("focus_method") != unreal.CameraFocusMethod.DISABLE,
        "blur": pp.get_editor_property("motion_blur_amount") if pp.get_editor_property("override_motion_blur_amount") else 0.5,
        "shake": 0.0,
    }


# ---------- the bridge ----------

def _send(msg):
    c = state["client"]
    if not c or c.closed:
        raise RuntimeError("not connected")
    c.send(msg)


def connect(url=None):
    if state["client"] and not state["client"].closed:
        say("already connected.")
        return True
    try:
        state["client"] = Client(url or URL).connect()
    except OSError:
        problem("The Curiosities desktop app is not answering at %s. Open it, then try again." % (url or URL))
        return False
    if state["tick"] is None:
        state["tick"] = unreal.register_slate_post_tick_callback(_tick)
    say("connected to %s. CurioCam follows panel %d." % (url or URL, state["panel"] + 1))
    return True


def disconnect():
    if state["tick"] is not None:
        unreal.unregister_slate_post_tick_callback(state["tick"])
        state["tick"] = None
    if state["client"]:
        state["client"].close()
    state["client"] = None
    say("disconnected.")


def _tick(dt):
    c = state["client"]
    if not c:
        return
    for msg in c.poll():
        if msg.get("type") == "panels":
            state["panels"] = msg.get("panels") or []
            done = state["waiting"]
            state["waiting"] = None
            if done:
                done(state["panels"])
            elif state["follow"] and state["panels"]:
                follow(state["panels"])
        elif msg.get("type") == "error":
            say("the app said: %s" % msg.get("error"))
    if c.closed:
        disconnect()
        problem("The desktop app closed the connection.")
        return
    state["since"] += dt
    if state["since"] >= POLL and state["waiting"] is None:
        state["since"] = 0.0
        _send({"type": "panels", "ids": list(cc.CURIOSITIES)})


def follow(panels):
    i = max(0, min(len(panels) - 1, state["panel"]))
    cam = camera()
    apply_pose(cam, ue_map.to_ue(cc.camera_for(panels[i], subject(), EYE)))


def _choose(step):
    n = len(state["panels"]) or 1
    state["panel"] = (state["panel"] + step) % n
    say("following panel %d of %d." % (state["panel"] + 1, n))
    if state["panels"]:
        follow(state["panels"])


def next_panel():
    _choose(1)


def previous_panel():
    _choose(-1)


def toggle_follow():
    state["follow"] = not state["follow"]
    say("follow the board: %s." % ("on" if state["follow"] else "off"))


def _with_panels(fn):
    """Run fn(panels) with fresh panels: now if connected and known, else after the next answer."""
    if not state["client"] and not connect():
        return
    state["waiting"] = fn
    _send({"type": "panels", "ids": list(cc.CURIOSITIES)})


def _apply(label, values_per_panel):
    ids = sorted({k for v in values_per_panel for k in v})
    _send({"type": "apply", "label": label, "values": {k: [v.get(k) for v in values_per_panel] for k in ids}})


# ---------- the Level Sequence ----------

def _sequence(fresh):
    lib = unreal.EditorAssetLibrary
    if fresh and lib.does_asset_exist(SEQ_PATH):
        lib.delete_asset(SEQ_PATH)
    if lib.does_asset_exist(SEQ_PATH):
        return unreal.load_asset(SEQ_PATH)
    if fresh:
        tools = unreal.AssetToolsHelpers.get_asset_tools()
        return tools.create_asset(SEQ_NAME, SEQ_DIR, unreal.LevelSequence, unreal.LevelSequenceFactoryNew())
    return None


def _channels(section):
    """{"Location.X": channel, ...} for a transform section; falls back to Unreal's usual order."""
    chans = list(section.get_all_channels())
    names = ["Location.X", "Location.Y", "Location.Z", "Rotation.X", "Rotation.Y", "Rotation.Z", "Scale.X", "Scale.Y", "Scale.Z"]
    out = {}
    for i, ch in enumerate(chans):
        name = str(ch.get_name())
        out[name if name in names else (names[i] if i < len(names) else name)] = ch
    return out


def _float_track(seq, binding, prop):
    track = binding.add_track(unreal.MovieSceneFloatTrack)
    track.set_property_name_and_path(prop, prop)
    section = track.add_section()
    section.set_range(0, 1 << 30)
    return section.get_all_channels()[0]


def _key(ch, frame, value, stepped):
    interp = unreal.MovieSceneKeyInterpolation.CONSTANT if stepped else unreal.MovieSceneKeyInterpolation.AUTO
    ch.add_key(unreal.FrameNumber(int(frame)), float(value), 0.0, unreal.SequenceTimeUnit.DISPLAY_RATE, interp)


def key_shots():
    _with_panels(_key_shots)


def _key_shots(panels, fps=FPS):
    if not panels:
        problem("The storyboard has no panels.")
        return None
    subj = subject()
    shots = ue_map.shots(panels, fps, 0, subj, EYE)
    end = shots[-1]["end"] + 1
    cam = camera()
    seq = _sequence(fresh=True)
    seq.set_display_rate(unreal.FrameRate(int(fps), 1))
    seq.set_playback_start(0)
    seq.set_playback_end(end)
    binding = seq.add_possessable(cam)
    transform = binding.add_track(unreal.MovieScene3DTransformTrack).add_section()
    transform.set_range(0, end)
    ch = _channels(transform)
    comp_binding = seq.add_possessable(cam.get_cine_camera_component())
    focal = _float_track(seq, comp_binding, "CurrentFocalLength")
    aperture = _float_track(seq, comp_binding, "CurrentAperture")
    for s in shots:
        stepped = s["stepped"]
        frames = [(f, ue) for f, ue in s["keys"]]
        for f, dp, dy in s["wobble"]:
            base = ue_map.at(s["keys"], f)
            base["pitch"] += dp
            base["yaw"] += dy
            frames.append((f, base))
        frames.sort(key=lambda x: x[0])
        for f, ue in frames:
            for name, k in (("Location.X", "x"), ("Location.Y", "y"), ("Location.Z", "z"),
                            ("Rotation.X", "roll"), ("Rotation.Y", "pitch"), ("Rotation.Z", "yaw")):
                _key(ch[name], f, ue[k], stepped)
        first = s["keys"][0][1]
        _key(focal, s["start"], first["focal"], True)
        if len(s["keys"]) > 1 and s["keys"][-1][1]["focal"] != first["focal"]:
            _key(focal, s["end"], s["keys"][-1][1]["focal"], False)
        _key(aperture, s["start"], first["aperture"], True)
        try:
            seq.add_marked_frame(unreal.MovieSceneMarkedFrame(frame_number=unreal.FrameNumber(_ticks(seq, s["start"])), label="Curio shot %d" % (s["panel"] + 1)))
        except Exception:
            pass
    _camera_cut(seq, binding, end)
    unreal.EditorAssetLibrary.set_metadata_tag(seq, "curio_shots", json.dumps(
        {"fps": fps, "subject": subj, "shots": [[s["start"], s["end"], s["stepped"]] for s in shots]}))
    unreal.EditorAssetLibrary.save_loaded_asset(seq)
    apply_pose(cam, shots[0]["keys"][0][1])
    try:
        unreal.LevelSequenceEditorBlueprintLibrary.open_level_sequence(seq)
    except Exception:
        pass
    say("keyed %d shots into %s (frames 0 to %d at %d fps)." % (len(shots), SEQ_PATH, end - 1, fps))
    return seq


def _ticks(seq, frame):
    """Marked frames are counted in the sequence's tick resolution, keys in its display rate."""
    try:
        tick, disp = seq.get_tick_resolution(), seq.get_display_rate()
        return int(round(frame * (tick.numerator / float(tick.denominator)) / (disp.numerator / float(disp.denominator))))
    except Exception:
        return int(frame)


def _camera_cut(seq, binding, end):
    try:
        add = getattr(seq, "add_track", None) or seq.add_master_track
        track = add(unreal.MovieSceneCameraCutTrack)
        section = track.add_section()
        section.set_range(0, end)
        section.set_camera_binding_id(seq.get_binding_id(binding) if hasattr(seq, "get_binding_id") else binding.get_binding_id())
    except Exception as e:  # the shots still play from CurioCam in the viewport's camera lock
        say("no camera cut track (%s); pilot CurioCam to watch the shots." % e)


# ---------- reading back ----------

def _value(ch, frame):
    best, best_f = None, None
    for k in ch.get_keys():
        f = k.get_time(unreal.SequenceTimeUnit.DISPLAY_RATE).frame_number.value
        if f <= frame and (best_f is None or f >= best_f):
            best, best_f = k.get_value(), f
    return best


def read_camera():
    _with_panels(_read_camera)


def _read_camera(panels):
    cam = camera(create=False)
    if not cam:
        problem("There is no CurioCam in this level yet. Connect, or Key shots, first.")
        return None
    values = ue_map.values_from_ue(read_pose(cam), subject(), EYE)
    n = max(1, len(panels))
    i = max(0, min(n - 1, state["panel"]))
    per = [{} for _ in range(n)]
    per[i] = values
    _apply("Unreal camera", per)
    say("read CurioCam onto panel %d: %s." % (i + 1, ", ".join("%s %s" % kv for kv in sorted(values.items()))))
    return values


def read_shots():
    _with_panels(_read_shots)


def _read_shots(panels):
    seq = _sequence(fresh=False)
    cam = camera(create=False)
    if not seq or not cam:
        problem("Key shots first: there is no %s with CurioCam in it." % SEQ_PATH)
        return None
    meta = json.loads(unreal.EditorAssetLibrary.get_metadata_tag(seq, "curio_shots") or "{}")
    binding = next((b for b in seq.get_bindings() if str(b.get_display_name()) == CAMERA_LABEL), None)
    if not meta.get("shots") or binding is None:
        problem("%s was not made by Key shots, so its shots can't be read." % SEQ_PATH)
        return None
    section = binding.find_tracks_by_type(unreal.MovieScene3DTransformTrack)[0].get_sections()[0]
    ch = _channels(section)
    # The lens and aperture are keyed on the camera component's own binding.
    props = {}
    for b in seq.get_bindings():
        for t in b.find_tracks_by_type(unreal.MovieSceneFloatTrack):
            name = str(getattr(t, "get_property_name", lambda: t.prop)())
            if name in ("CurrentFocalLength", "CurrentAperture") and t.get_sections():
                props[name] = t.get_sections()[0].get_all_channels()[0]
    subj = tuple(meta.get("subject") or (0.0, 0.0, 0.0))
    now = read_pose(cam)
    per = []
    for start, _end, _stepped in meta["shots"]:
        ue = dict(now)
        for name, k in (("Location.X", "x"), ("Location.Y", "y"), ("Location.Z", "z"),
                        ("Rotation.X", "roll"), ("Rotation.Y", "pitch"), ("Rotation.Z", "yaw")):
            v = _value(ch[name], start)
            if v is not None:
                ue[k] = v
        for name, k in (("CurrentFocalLength", "focal"), ("CurrentAperture", "aperture")):
            v = _value(props[name], start) if name in props else None
            if v is not None:
                ue[k] = v
        per.append(ue_map.values_from_ue(ue, subj, EYE))
    _apply("Unreal camera", per[: max(1, len(panels))])
    say("read %d shots of %s onto the board as \"Unreal camera\"." % (len(per), SEQ_PATH))
    return per


# ---------- menus ----------

MENU = [
    ("connect", "Connect to the app", "connect()"),
    ("follow", "Follow the board on or off", "toggle_follow()"),
    ("next", "Follow the next panel", "next_panel()"),
    ("previous", "Follow the previous panel", "previous_panel()"),
    ("key", "Key shots into CurioShots", "key_shots()"),
    ("read", "Read CurioCam onto the board", "read_camera()"),
    ("readshots", "Read CurioShots onto the board", "read_shots()"),
    ("disconnect", "Disconnect", "disconnect()"),
]


def register_menus():
    menus = unreal.ToolMenus.get()
    tools = menus.find_menu("LevelEditor.MainMenu.Tools")
    if not tools:
        return False
    sub = tools.add_sub_menu("Curiosities", "Curiosities", "Curiosities", "Curiosities")
    for name, label, call in MENU:
        e = unreal.ToolMenuEntry(name="Curio_" + name, type=unreal.MultiBlockType.MENU_ENTRY)
        e.set_label(label)
        e.set_string_command(unreal.ToolMenuStringCommandType.PYTHON, "",
                             "import curiosities_unreal.unreal_link as curio; curio.%s" % call)
        sub.add_menu_entry("Curiosities", e)
    menus.refresh_all_widgets()
    return True
