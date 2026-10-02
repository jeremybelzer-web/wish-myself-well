"""Curiosities and a DaVinci Resolve timeline, in plain Python (no Resolve needed, so it can be tested anywhere).

Three directions:
- Storyboard to markers: each storyboard panel becomes one timeline marker, as long as the panel's hold
  (shotDuration short / medium / long = 1, 2, 4 seconds, as in the Maya and Blender bridges). The marker's
  color follows the panel's emotion, its note lists the panel's curiosities one per line ("shotSize: wide"),
  and its custom data keeps them as JSON, so reading back is exact.
- Edit to curiosities: the cuts on a video track become shots. Each shot gets shotDuration from its length and
  cutRate from the middle length of the shots around it (5 shots: under 2 s fast, over 5 s slow). Markers
  inside a shot add their curiosities: from our own custom data, or from any marker whose name or note has
  lines like "emotion: anxious". Only known curiosities with a value on their own scale are kept (catalog.json,
  made from the app's list by make_catalog.js); anything else in a marker is ignored, so a line of dialogue in a
  note never travels.
- Edit to a trace: the same values, written as a shared-film trace file (format "curiosities-trace", see
  trace.js). The app checks it again when it is loaded and keeps only known curiosities with values on their
  scales, so a trace never carries notes, lines or anything but counts.
"""
import json
import os
import re

HOLD_SECONDS = {"short": 1.0, "medium": 2.0, "long": 4.0}
CUSTOM = "curio:"
# What the storyboard sends to Resolve: the camera, the cut, and the feeling.
PANEL_IDS = (
    "shotSize", "angleHeight", "angleFamily", "lensLength", "cameraCarry", "cameraMove", "moveSpeed",
    "shotDuration", "cutRate", "transition", "emotion", "emotionIntensity", "lightingMood", "warmCool",
    "timeOfDay", "music", "comedyDevice", "laughsPerMinute",
)
# Resolve's marker colors, one per emotion; anything else is Cream.
EMOTION_COLORS = {
    "loving": "Rose", "joyful": "Yellow", "curious": "Cyan", "melancholy": "Blue", "anxious": "Lavender",
    "fearful": "Purple", "angry": "Red", "triumphant": "Green", "absurd": "Fuchsia", "dreamlike": "Sky",
}
DEFAULT_COLOR = "Cream"
WINDOW = 5
FAST_UNDER, SLOW_OVER = 2.0, 5.0
ID_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)?$")
LINE_RE = re.compile(r"^\s*([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)?)\s*[:=]\s*(.+?)\s*$")
TAG_MAX = 24
TITLE_MAX = 80


_CATALOG = None


def catalog():
    """{id: {kind, options | min, max}} for every curiosity the app knew when catalog.json was made."""
    global _CATALOG
    if _CATALOG is None:
        try:
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "catalog.json")) as f:
                _CATALOG = json.load(f).get("curiosities") or {}
        except (IOError, OSError, ValueError):
            _CATALOG = {}
    return _CATALOG


def clean(values, known=None):
    """Keep only known curiosity ids with values on their own scales (the same rule as trace.js)."""
    known = catalog() if known is None else known
    out = {}
    for k, v in (values or {}).items():
        c = known.get(k)
        if not c or v is None or v == "":
            continue
        if c["kind"] == "select":
            if v in c.get("options", []):
                out[k] = v
        elif c["kind"] == "range":
            try:
                n = float(v)
            except (TypeError, ValueError):
                continue
            lo, hi = c.get("min"), c.get("max")
            n = max(lo, n) if lo is not None else n
            n = min(hi, n) if hi is not None else n
            out[k] = int(n) if float(n).is_integer() else n
        elif c["kind"] == "tag" and isinstance(v, (str, int, float)):
            out[k] = str(v).strip()[:TAG_MAX]
    return out


def hold_frames(values, fps):
    return max(1, int(round(HOLD_SECONDS.get((values or {}).get("shotDuration"), HOLD_SECONDS["medium"]) * fps)))


def _word(v):
    return ("%g" % v) if isinstance(v, float) else str(v)


def storyboard_markers(panels, fps=24.0):
    """One marker per panel, back to back from frame 0 (an offset from the timeline's start)."""
    out, at = [], 0
    for i, values in enumerate(panels or []):
        values = {k: v for k, v in (values or {}).items() if v is not None and v != ""}
        length = hold_frames(values, fps)
        bits = [_word(values[k]) for k in ("shotSize", "angleHeight", "emotion") if k in values]
        out.append({
            "frame": at,
            "color": EMOTION_COLORS.get(values.get("emotion"), DEFAULT_COLOR),
            "name": "Panel %d" % (i + 1) + (" · " + ", ".join(bits) if bits else ""),
            "note": "\n".join("%s: %s" % (k, _word(values[k])) for k in sorted(values)),
            "duration": length,
            "customData": CUSTOM + json.dumps({"panel": i, "values": values}, separators=(",", ":"), sort_keys=True),
        })
        at += length
    return out


def parse_text(text):
    """{id: value} from lines like "emotion: anxious" or "laughsPerMinute = 2". Other lines are skipped."""
    out = {}
    for line in str(text or "").splitlines():
        m = LINE_RE.match(line)
        if not m or not ID_RE.match(m.group(1)):
            continue
        raw = m.group(2)
        if len(raw) > TAG_MAX:
            continue
        try:
            value = float(raw) if re.match(r"^-?\d+(\.\d+)?$", raw) else raw
            if isinstance(value, float) and value.is_integer():
                value = int(value)
        except ValueError:
            value = raw
        out[m.group(1)] = value
    return out


def marker_values(marker):
    """What one marker says: our custom data first, otherwise its name and note."""
    data = (marker or {}).get("customData") or ""
    if data.startswith(CUSTOM):
        try:
            values = json.loads(data[len(CUSTOM):]).get("values") or {}
            return {k: v for k, v in values.items() if ID_RE.match(str(k))}
        except (ValueError, AttributeError):
            pass
    values = parse_text(marker.get("name"))
    values.update(parse_text(marker.get("note")))
    return values


def shot_duration_word(seconds):
    # Nearest of 1, 2 and 4 seconds on a log scale: the borders are the square roots of 2 and 8.
    return "short" if seconds < 2 ** 0.5 else "medium" if seconds < 8 ** 0.5 else "long"


def cut_rate_word(avg_seconds):
    return "fast" if avg_seconds < FAST_UNDER else "slow" if avg_seconds > SLOW_OVER else "medium"


def shots_from_items(items):
    """[(start, end)] in timeline frames (any order, overlaps kept as they are) -> [{"start", "end"}], sorted."""
    shots = [{"start": int(s), "end": int(e)} for s, e in items if e is not None and s is not None and int(e) > int(s)]
    return sorted(shots, key=lambda x: x["start"])


def shots_from_markers(markers):
    """With no clips (a storyboard timeline), each marker that lasts is a shot. markers: {offset: info}."""
    return [{"start": int(f), "end": int(f) + int(m.get("duration") or 1)} for f, m in sorted(markers.items(), key=lambda x: int(x[0]))]


def edit_values(shots, markers, fps=24.0):
    """One {id: value} per shot. shots are offsets from the timeline start; markers is {offset: info}."""
    fps = float(fps) or 24.0
    lengths = [(s["end"] - s["start"]) / fps for s in shots]
    out = []
    for i, s in enumerate(shots):
        values = {}
        for f, m in sorted(markers.items(), key=lambda x: int(x[0])):
            if s["start"] <= int(f) < s["end"]:
                values.update(marker_values(m))
        values = clean(values)
        near = sorted(lengths[max(0, i - WINDOW // 2): i + WINDOW // 2 + 1])
        values["shotDuration"] = shot_duration_word(lengths[i])
        # The middle length around this shot, so one long shot doesn't make a quick run read as slow.
        values["cutRate"] = cut_rate_word(near[len(near) // 2])
        out.append(values)
    return out


def apply_values(per_shot, panel_count=None):
    """The board's apply format, {id: [one value per panel]}, from the first panels' worth of shots."""
    rows = per_shot[:panel_count] if panel_count else per_shot
    ids = sorted({k for v in rows for k in v})
    return {k: [v.get(k) for v in rows] for k in ids}


def timecode(frame, fps):
    sec = int(frame // (float(fps) or 24.0))
    h, m, s = sec // 3600, (sec // 60) % 60, sec % 60
    return "%d:%02d:%02d" % (h, m, s) if h else "%d:%02d" % (m, s)


def trace(title, shots, per_shot, fps=24.0, kind="film", traced_by="", created_at=None, year=None):
    """A trace file (dict) for trace.js. The app gives it its fingerprint id and checks every value on load."""
    out = {
        "format": "curiosities-trace",
        "version": 1,
        "id": "",
        "title": str(title or "Untitled film")[:TITLE_MAX],
        "kind": kind,
        "camera": "authored",
    }
    if year:
        out["year"] = int(year)
    if traced_by:
        out["tracedBy"] = str(traced_by)[:40]
    if created_at:
        out["createdAt"] = created_at
    out["beats"] = [{"at": timecode(s["start"], fps), "values": v} for s, v in zip(shots, per_shot)][:5000]
    out["moments"] = []
    return out
