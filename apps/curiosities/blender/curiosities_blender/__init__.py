"""Curiosities for Blender: each storyboard panel's camera curiosities drive a Blender camera.

Blender has no web view, so the add-on talks to the Curiosities desktop app over its local bridge
(ws://127.0.0.1:7577, desktop/README.md). In the 3D Viewport sidebar (N), tab Curiosities:
Connect, Follow board (the camera takes the chosen panel's curiosities as they change, automation included),
Key shots (one shot per panel on CurioCam, with timeline markers), Read camera (back onto the board as the
strand "Blender camera")."""
import bpy

from . import blender_camera, curio_camera
from .ws_client import Client

bl_info = {
    "name": "Curiosities",
    "author": "Curiosities",
    "version": (0, 1, 0),
    "blender": (4, 2, 0),
    "location": "3D Viewport > Sidebar > Curiosities",
    "description": "Storyboard camera curiosities drive a Blender camera, through the Curiosities desktop app",
    "category": "Camera",
}

IDS = list(curio_camera.CURIOSITIES)
POLL_EVERY = 0.25
TICK = 0.1


class _State(object):
    client = None
    panels = []
    status = "Not connected"
    since_poll = 0.0
    timeline = True  # False once the app says it has no engine
    source = "panels"


S = _State()


def ask():
    """The film: the engine's whole timeline (every moment) when the app has it, else My film's panels."""
    S.client.send({"type": "timeline"} if S.timeline else {"type": "panels", "ids": IDS})


def _redraw():
    for win in getattr(bpy.context.window_manager, "windows", []):
        for area in win.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()


def _subject(scene):
    return blender_camera.subject_of(scene.curio_subject, scene)


def follow(scene):
    """Put the chosen panel's curiosities on CurioCam."""
    if not S.panels:
        return False
    i = max(1, min(scene.curio_panel, len(S.panels))) - 1
    cam = blender_camera.ensure_camera(scene)
    blender_camera.apply_pose(cam, curio_camera.camera_for(S.panels[i], _subject(scene), scene.curio_eye), scene)
    return True


def no_timeline(error):
    """True when the app cannot send a whole film: it says "unknown type timeline", or, before the engine,
    "unknown key ..." (older apps checked the key first)."""
    error = str(error or "")
    return error.startswith("unknown type timeline") or error.startswith("unknown key")


def tick():
    """Timer: read the bridge, ask for the panels a few times a second, follow the board."""
    if S.client is None:
        return None
    try:
        for msg in S.client.poll():
            kind = msg.get("type")
            if kind == "timeline" and not msg.get("panels"):
                S.client.send({"type": "panels", "ids": IDS})  # the engine has no film yet: My film's panels
            elif kind == "error" and no_timeline(msg.get("error")):
                S.timeline = False  # an app without the engine
                S.client.send({"type": "panels", "ids": IDS})
            elif kind in ("panels", "timeline"):
                got = [{k: v for k, v in p.items() if k in IDS} for p in (msg.get("panels") or [])]
                changed = got != S.panels
                S.panels, S.source = got, kind
                S.status = "Connected: %d %s" % (len(S.panels), "moments of the engine's film" if kind == "timeline" else "panels")
                scene = bpy.context.scene
                if changed and scene and scene.curio_follow:
                    follow(scene)
            elif msg.get("type") == "error":
                S.status = "Bridge: " + str(msg.get("error"))
        if S.client.closed:
            raise ConnectionError("the app closed the connection")
        S.since_poll += TICK
        if S.since_poll >= POLL_EVERY:
            S.since_poll = 0.0
            ask()
    except (OSError, ConnectionError) as e:
        S.client, S.status = None, "Disconnected: %s" % e
        _redraw()
        return None
    _redraw()
    return TICK


class CURIO_OT_connect(bpy.types.Operator):
    bl_idname = "curio.connect"
    bl_label = "Connect"
    bl_description = "Connect to the Curiosities desktop app's bridge, or disconnect"

    def execute(self, context):
        if S.client is not None:
            S.client.close()
            S.client, S.status = None, "Not connected"
            return {"FINISHED"}
        try:
            S.client = Client(context.scene.curio_url).connect()
        except (OSError, ValueError, ConnectionError) as e:
            S.client, S.status = None, "Could not connect: %s. Is the desktop app open?" % e
            self.report({"WARNING"}, S.status)
            return {"CANCELLED"}
        S.status, S.since_poll, S.timeline = "Connected", POLL_EVERY, True
        ask()
        if not bpy.app.timers.is_registered(tick):
            bpy.app.timers.register(tick, first_interval=TICK)
        return {"FINISHED"}


class CURIO_OT_key_shots(bpy.types.Operator):
    bl_idname = "curio.key_shots"
    bl_label = "Key shots"
    bl_description = "One shot per moment of the film (the engine's timeline, or the storyboard panels) on CurioCam, back to back, with timeline markers"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return bool(S.panels)

    def execute(self, context):
        sc = context.scene
        plan = blender_camera.key_timeline(S.panels, sc, _subject(sc), sc.curio_eye)
        self.report({"INFO"}, "Keyed %d shots, frames %d to %d" % (len(plan), plan[0]["start"], plan[-1]["end"]))
        return {"FINISHED"}


class CURIO_OT_read_camera(bpy.types.Operator):
    bl_idname = "curio.read_camera"
    bl_label = "Read camera"
    bl_description = "Read CurioCam at the start of each shot back onto the board as the strand \"Blender camera\""

    @classmethod
    def poll(cls, context):
        return bool(S.panels) and S.client is not None and bpy.data.objects.get(blender_camera.NAME) is not None

    def execute(self, context):
        sc = context.scene
        per = blender_camera.read_timeline(S.panels, sc, _subject(sc), sc.curio_eye)
        values = {}
        for cid in IDS:
            if any(cid in p for p in per):
                values[cid] = [p.get(cid, "") for p in per]
        S.client.send({"type": "apply", "label": "Blender camera", "values": values})
        self.report({"INFO"}, "Read %d shots back onto the board" % len(per))
        return {"FINISHED"}


class CURIO_PT_panel(bpy.types.Panel):
    bl_label = "Curiosities"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Curiosities"

    def draw(self, context):
        sc, col = context.scene, self.layout.column()
        col.prop(sc, "curio_url", text="")
        col.operator("curio.connect", text="Disconnect" if S.client else "Connect")
        col.label(text=S.status)
        col.separator()
        col.prop(sc, "curio_follow")
        col.prop(sc, "curio_panel")
        col.prop(sc, "curio_eye")
        col.prop(sc, "curio_subject")
        col.separator()
        col.operator("curio.key_shots")
        col.operator("curio.read_camera")


def _on_panel(self, context):
    if self.curio_follow:
        follow(self)


CLASSES = (CURIO_OT_connect, CURIO_OT_key_shots, CURIO_OT_read_camera, CURIO_PT_panel)
PROPS = {
    "curio_url": lambda: bpy.props.StringProperty(name="Bridge", default="ws://127.0.0.1:7577"),
    "curio_follow": lambda: bpy.props.BoolProperty(name="Follow board", default=True, update=_on_panel),
    "curio_panel": lambda: bpy.props.IntProperty(name="Panel", default=1, min=1, max=999, update=_on_panel),
    "curio_eye": lambda: bpy.props.FloatProperty(name="Eyes (m)", default=1.6, min=0.1, max=10.0, update=_on_panel),
    "curio_subject": lambda: bpy.props.PointerProperty(name="Subject", type=bpy.types.Object, update=_on_panel),
}


def register():
    for c in CLASSES:
        bpy.utils.register_class(c)
    for name, make in PROPS.items():
        setattr(bpy.types.Scene, name, make())


def unregister():
    if bpy.app.timers.is_registered(tick):
        bpy.app.timers.unregister(tick)
    if S.client:
        S.client.close()
        S.client = None
    for name in PROPS:
        if hasattr(bpy.types.Scene, name):
            delattr(bpy.types.Scene, name)
    for c in reversed(CLASSES):
        bpy.utils.unregister_class(c)
