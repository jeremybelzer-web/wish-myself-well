"""A stand-in for Unreal's `unreal` Python module: only what unreal_link.py uses, behaving like the editor
closely enough to catch wrong names, wrong arguments and wrong math. It is not Unreal."""
import enum

logs = []
dialogs = []
ticks = []


def log(text):
    logs.append(text)


def log_warning(text):
    logs.append("WARN " + text)


class AppMsgType(enum.Enum):
    OK = 0


class EditorDialog(object):
    @staticmethod
    def show_message(title, message, kind):
        dialogs.append(message)


class _Struct(object):
    _fields = {}

    def __init__(self, *args, **kw):
        vals = dict(self._fields)
        for k, v in zip(self._fields, args):
            vals[k] = v
        for k, v in kw.items():
            if k not in self._fields:
                raise TypeError("%s has no property %s" % (type(self).__name__, k))
            vals[k] = v
        self.__dict__.update(vals)

    def get_editor_property(self, name):
        if name not in self._fields:
            raise AttributeError(name)
        return getattr(self, name)

    def set_editor_property(self, name, value):
        if name not in self._fields:
            raise AttributeError(name)
        setattr(self, name, value)


class Vector(_Struct):
    _fields = {"x": 0.0, "y": 0.0, "z": 0.0}


class Rotator(_Struct):
    # Unreal's positional order is roll, pitch, yaw: the reason unreal_link.py uses keywords.
    _fields = {"roll": 0.0, "pitch": 0.0, "yaw": 0.0}


class CameraFilmbackSettings(_Struct):
    _fields = {"sensor_width": 23.76, "sensor_height": 13.365}


class CameraFocusMethod(enum.Enum):
    DO_NOT_OVERRIDE = 0
    MANUAL = 1
    TRACKING = 2
    DISABLE = 3


class CameraFocusSettings(_Struct):
    _fields = {"focus_method": CameraFocusMethod.MANUAL, "manual_focus_distance": 100000.0}


class PostProcessSettings(_Struct):
    _fields = {"override_motion_blur_amount": False, "motion_blur_amount": 0.5}


class CineCameraComponent(_Struct):
    _fields = {"filmback": None, "current_focal_length": 35.0, "current_aperture": 2.8, "focus_settings": None, "post_process_settings": None}

    def __init__(self):
        _Struct.__init__(self, filmback=CameraFilmbackSettings(), focus_settings=CameraFocusSettings(), post_process_settings=PostProcessSettings())


class Actor(object):
    def __init__(self, label="Actor", location=None):
        self.label, self.loc, self.rot = label, location or Vector(), Rotator()

    def get_actor_label(self):
        return self.label

    def set_actor_label(self, label):
        self.label = label

    def get_actor_location(self):
        return Vector(self.loc.x, self.loc.y, self.loc.z)

    def get_actor_rotation(self):
        return Rotator(roll=self.rot.roll, pitch=self.rot.pitch, yaw=self.rot.yaw)

    def set_actor_location(self, loc, sweep, teleport):
        assert isinstance(loc, Vector) and isinstance(sweep, bool) and isinstance(teleport, bool)
        self.loc = loc

    def set_actor_rotation(self, rot, teleport):
        assert isinstance(rot, Rotator) and isinstance(teleport, bool)
        self.rot = rot


class CineCameraActor(Actor):
    def __init__(self, *a, **kw):
        Actor.__init__(self, *a, **kw)
        self.comp = CineCameraComponent()

    def get_cine_camera_component(self):
        return self.comp


class EditorActorSubsystem(object):
    actors = []
    selected = []

    def get_all_level_actors(self):
        return list(self.actors)

    def get_selected_level_actors(self):
        return list(self.selected)

    def spawn_actor_from_class(self, cls, loc, rot):
        a = cls("CineCameraActor")
        a.loc, a.rot = loc, rot
        EditorActorSubsystem.actors.append(a)
        return a


def get_editor_subsystem(cls):
    return cls()


def register_slate_post_tick_callback(fn):
    ticks.append(fn)
    return len(ticks)


def unregister_slate_post_tick_callback(handle):
    ticks[handle - 1] = None


# ---------- sequencer ----------

class FrameNumber(object):
    def __init__(self, value=0):
        assert isinstance(value, int)
        self.value = value


class FrameTime(object):
    def __init__(self, frame):
        self.frame_number = FrameNumber(frame)


class FrameRate(object):
    def __init__(self, numerator=24, denominator=1):
        self.numerator, self.denominator = numerator, denominator


class MovieSceneKeyInterpolation(enum.Enum):
    AUTO = 0
    USER = 1
    BREAK = 2
    LINEAR = 3
    CONSTANT = 4


class SequenceTimeUnit(enum.Enum):
    DISPLAY_RATE = 0
    TICK_RESOLUTION = 1


class Key(object):
    def __init__(self, frame, value, interp):
        self.frame, self.value, self.interp = frame, value, interp

    def get_time(self, time_unit=SequenceTimeUnit.DISPLAY_RATE):
        return FrameTime(self.frame)

    def get_value(self):
        return self.value


class Channel(object):
    def __init__(self, name):
        self.name, self.keys = name, []

    def get_name(self):
        return self.name

    def add_key(self, time, new_value, sub_frame=0.0, time_unit=SequenceTimeUnit.DISPLAY_RATE, interpolation=MovieSceneKeyInterpolation.AUTO):
        assert isinstance(time, FrameNumber) and isinstance(new_value, float) and isinstance(interpolation, MovieSceneKeyInterpolation)
        self.keys = [k for k in self.keys if k.frame != time.value] + [Key(time.value, new_value, interpolation)]
        return self.keys[-1]

    def get_keys(self):
        return list(self.keys)


class Section(object):
    def __init__(self, names):
        self.channels = [Channel(n) for n in names]
        self.range = None
        self.camera = None

    def set_range(self, a, b):
        self.range = (a, b)

    def get_all_channels(self):
        return list(self.channels)

    def set_camera_binding_id(self, bid):
        self.camera = bid


class MovieSceneTrack(object):
    CHANNELS = []

    def __init__(self):
        self.sections, self.prop = [], None

    def add_section(self):
        s = Section(self.CHANNELS)
        self.sections.append(s)
        return s

    def get_sections(self):
        return list(self.sections)


class MovieScene3DTransformTrack(MovieSceneTrack):
    CHANNELS = ["Location.X", "Location.Y", "Location.Z", "Rotation.X", "Rotation.Y", "Rotation.Z", "Scale.X", "Scale.Y", "Scale.Z"]


class MovieSceneFloatTrack(MovieSceneTrack):
    CHANNELS = ["Value"]

    def set_property_name_and_path(self, name, path):
        self.prop = name

    def get_property_name(self):
        return self.prop


class MovieSceneCameraCutTrack(MovieSceneTrack):
    CHANNELS = []


class Binding(object):
    def __init__(self, obj):
        self.obj, self.tracks = obj, []

    def add_track(self, cls):
        t = cls()
        self.tracks.append(t)
        return t

    def find_tracks_by_type(self, cls):
        return [t for t in self.tracks if isinstance(t, cls)]

    def get_display_name(self):
        return self.obj.get_actor_label() if hasattr(self.obj, "get_actor_label") else type(self.obj).__name__

    def get_binding_id(self):
        return id(self)


class MovieSceneMarkedFrame(_Struct):
    _fields = {"frame_number": None, "label": ""}


class LevelSequence(object):
    def __init__(self, name):
        self.name, self.bindings, self.tracks, self.marks, self.meta = name, [], [], [], {}
        self.display, self.start, self.end = FrameRate(30, 1), 0, 0

    def set_display_rate(self, r):
        self.display = r

    def get_display_rate(self):
        return self.display

    def get_tick_resolution(self):
        return FrameRate(24000, 1)

    def set_playback_start(self, f):
        self.start = f

    def set_playback_end(self, f):
        self.end = f

    def add_possessable(self, obj):
        b = Binding(obj)
        self.bindings.append(b)
        return b

    def get_bindings(self):
        return list(self.bindings)

    def add_track(self, cls):
        t = cls()
        self.tracks.append(t)
        return t

    def add_marked_frame(self, m):
        assert isinstance(m.frame_number, FrameNumber)
        self.marks.append(m)

    def get_binding_id(self, binding):
        return binding.get_binding_id()


class LevelSequenceFactoryNew(object):
    pass


class _Assets(object):
    store = {}


class EditorAssetLibrary(object):
    @staticmethod
    def does_asset_exist(path):
        return path in _Assets.store

    @staticmethod
    def delete_asset(path):
        return _Assets.store.pop(path, None) is not None

    @staticmethod
    def set_metadata_tag(obj, tag, value):
        obj.meta[tag] = value

    @staticmethod
    def get_metadata_tag(obj, tag):
        return obj.meta.get(tag, "")

    @staticmethod
    def save_loaded_asset(obj):
        return True


def load_asset(path):
    return _Assets.store.get(path)


class _Tools(object):
    def create_asset(self, name, folder, cls, factory):
        a = cls(name)
        _Assets.store[folder + "/" + name] = a
        return a


class AssetToolsHelpers(object):
    @staticmethod
    def get_asset_tools():
        return _Tools()


class LevelSequenceEditorBlueprintLibrary(object):
    opened = []

    @staticmethod
    def open_level_sequence(seq):
        LevelSequenceEditorBlueprintLibrary.opened.append(seq)


# ---------- menus ----------

class MultiBlockType(enum.Enum):
    MENU_ENTRY = 1


class ToolMenuStringCommandType(enum.Enum):
    COMMAND = 0
    PYTHON = 1


class ToolMenuEntry(object):
    def __init__(self, name="", type=None):
        self.name, self.type, self.label, self.command = name, type, "", None

    def set_label(self, label):
        self.label = label

    def set_string_command(self, kind, custom_type, string):
        self.command = (kind, string)


class ToolMenu(object):
    def __init__(self, name):
        self.name, self.entries, self.subs = name, [], []

    def add_sub_menu(self, owner, section, name, label, tool_tip=""):
        m = ToolMenu(name)
        self.subs.append(m)
        return m

    def add_menu_entry(self, section, entry):
        self.entries.append(entry)


class ToolMenus(object):
    _menus = {"LevelEditor.MainMenu.Tools": ToolMenu("Tools")}

    @staticmethod
    def get():
        return ToolMenus()

    def find_menu(self, name):
        return self._menus.get(name)

    def refresh_all_widgets(self):
        pass
