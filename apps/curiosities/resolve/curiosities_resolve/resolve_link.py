"""The Resolve side: talks to DaVinci Resolve's scripting API and to the Curiosities desktop app's bridge.

Every function takes the `resolve` object Resolve hands a script, so it can be tested with a stand-in.
Messages go to print(), which Resolve shows in Workspace > Console.
"""
import datetime
import json
import os
import time

from . import curio_resolve as cr
from .ws_client import Client

DEFAULT_URL = os.environ.get("CURIO_BRIDGE", "ws://127.0.0.1:7577")


class Problem(Exception):
    """Something the person can fix; the message says how."""


def find_resolve(scope=None):
    """The running Resolve, from a script's globals, or through DaVinciResolveScript."""
    scope = scope or {}
    if scope.get("resolve"):
        return scope["resolve"]
    app = scope.get("app")
    if app is not None and hasattr(app, "GetResolve"):
        return app.GetResolve()
    bmd = scope.get("bmd")
    if bmd is not None:
        return bmd.scriptapp("Resolve")
    try:
        import DaVinciResolveScript as dvr  # noqa: F401 (only there when Resolve's scripting is set up)
        return dvr.scriptapp("Resolve")
    except ImportError:
        raise Problem("Resolve's scripting module was not found. Run this from Workspace > Scripts inside Resolve.")


def current(resolve, make=False):
    """(project, timeline). With make=True and no timeline open, makes an empty one."""
    if resolve is None:
        raise Problem("Resolve is not answering. Is it open?")
    project = resolve.GetProjectManager().GetCurrentProject()
    if not project:
        raise Problem("Open a project in Resolve first.")
    timeline = project.GetCurrentTimeline()
    if not timeline and make:
        timeline = project.GetMediaPool().CreateEmptyTimeline("Curiosities storyboard")
        if timeline:
            project.SetCurrentTimeline(timeline)
    if not timeline:
        raise Problem("Open a timeline in Resolve first.")
    return project, timeline


def fps(timeline):
    try:
        return float(timeline.GetSetting("timelineFrameRate")) or 24.0
    except (TypeError, ValueError):
        return 24.0


def request(msg, want, url=None, timeout=5.0, client=None):
    """Send one message to the bridge and wait for the answer of type `want` (or an error)."""
    own = client is None
    try:
        client = client or Client(url or DEFAULT_URL).connect()
    except OSError:
        raise Problem("The Curiosities desktop app is not answering at %s. Open it, then try again." % (url or DEFAULT_URL))
    try:
        client.send(msg)
        end = time.time() + timeout
        while time.time() < end:
            for got in client.poll():
                if got.get("type") == want:
                    return got
                if got.get("type") == "error":
                    raise Problem("The app said: %s" % (got.get("error") or "an error"))
            if client.closed:
                break
            time.sleep(0.02)
        raise Problem("The Curiosities app did not answer in time.")
    finally:
        if own:
            client.close()


def film_panels(ids, url=None, client=None):
    """The whole film: the engine's timeline (every moment) when it has one, else My film's storyboard panels.
    Returns (panels, where) with where "engine" or "storyboard". An app without the engine answers with an error,
    and an engine with no film yet answers with no panels; both fall back to the storyboard."""
    try:
        reply = request({"type": "timeline"}, "timeline", url, client=client)
        if reply.get("panels"):
            return [{k: v for k, v in p.items() if k in ids} for p in reply["panels"]], "engine"
    except Problem as e:
        if not str(e).startswith("The app said"):
            raise
    return request({"type": "panels", "ids": list(ids)}, "panels", url, client=client).get("panels") or [], "storyboard"


def clear_ours(timeline):
    """Remove the markers this bridge made before (custom data starts with "curio:"); leave everyone else's."""
    n = 0
    for frame, m in list((timeline.GetMarkers() or {}).items()):
        if str(m.get("customData") or "").startswith(cr.CUSTOM):
            if timeline.DeleteMarkerAtFrame(frame):
                n += 1
    return n


def send_storyboard(resolve, url=None, client=None):
    """The film -> markers on the current timeline (an empty one is made if none is open): every moment of the
    engine's film when it has one, else the storyboard panels."""
    own = client is None
    if own:
        try:
            client = Client(url or DEFAULT_URL).connect()
        except OSError:
            raise Problem("The Curiosities desktop app is not answering at %s. Open it, then try again." % (url or DEFAULT_URL))
    try:
        panels, where = film_panels(cr.PANEL_IDS, url, client=client)
    finally:
        if own:
            client.close()
    if not panels:
        raise Problem("The storyboard has no panels.")
    _, timeline = current(resolve, make=True)
    rate = fps(timeline)
    cleared = clear_ours(timeline)
    made = 0
    for m in cr.storyboard_markers(panels, rate):
        if timeline.AddMarker(m["frame"], m["color"], m["name"], m["note"], m["duration"], m["customData"]):
            made += 1
    seconds = sum(cr.hold_frames(p, rate) for p in panels) / rate
    print("Curiosities: put %d of %d %s on \"%s\" as markers (%.0f seconds)%s." % (
        made, len(panels), "moments of the engine's film" if where == "engine" else "panels", timeline.GetName(), seconds, ", replacing %d old ones" % cleared if cleared else ""))
    if made < len(panels):
        print("Curiosities: some markers did not fit. Resolve only keeps markers inside the timeline; add clips or a"
              " generator as long as the storyboard and send it again.")
    return made


def read_shots(timeline, track=1):
    """Shots as offsets from the timeline start: from the clips on a video track, or the markers if there are none."""
    start = int(timeline.GetStartFrame() or 0)
    markers = {int(f): m for f, m in (timeline.GetMarkers() or {}).items()}
    items = timeline.GetItemListInTrack("video", track) or []
    shots = cr.shots_from_items([(i.GetStart() - start, i.GetEnd() - start) for i in items])
    if not shots:
        shots = cr.shots_from_markers(markers)
    return shots, markers


def read_edit(resolve, url=None, track=1, client=None):
    """The edit -> a strand on the board ("Resolve edit"), one shot per storyboard panel."""
    _, timeline = current(resolve)
    shots, markers = read_shots(timeline, track)
    if not shots:
        raise Problem("This timeline has no clips on video track %d and no markers." % track)
    per = cr.edit_values(shots, markers, fps(timeline))
    own = client is None
    try:
        client = client or Client(url or DEFAULT_URL).connect()
    except OSError:
        raise Problem("The Curiosities desktop app is not answering at %s. Open it, then try again." % (url or DEFAULT_URL))
    try:
        count = len(request({"type": "panels", "ids": ["shotSize"]}, "panels", client=client).get("panels") or [])
        if not count:
            raise Problem("The storyboard has no panels to put the edit on.")
        client.send({"type": "apply", "label": "Resolve edit", "values": cr.apply_values(per, count)})
        # apply has no answer of its own; asking for the panels again confirms it arrived.
        request({"type": "panels", "ids": ["shotDuration"]}, "panels", client=client)
    finally:
        if own:
            client.close()
    used = min(len(per), count)
    print("Curiosities: read %d shots; the first %d are on the board as \"Resolve edit\"." % (len(per), used))
    return per


def trace_edit(resolve, folder=None, traced_by="", track=1, kind="film"):
    """The edit -> a trace file (counts only) next to the project, for Library > Share a film. No app needed."""
    _, timeline = current(resolve)
    shots, markers = read_shots(timeline, track)
    if not shots:
        raise Problem("This timeline has no clips on video track %d and no markers." % track)
    rate = fps(timeline)
    title = timeline.GetName() or "Untitled film"
    data = cr.trace(title, shots, cr.edit_values(shots, markers, rate), rate, kind=kind, traced_by=traced_by,
                    created_at=datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z")
    folder = folder or os.path.join(os.path.expanduser("~"), "Desktop")
    if not os.path.isdir(folder):
        folder = os.path.expanduser("~")
    safe = "".join(c if c.isalnum() else "-" for c in title.lower()).strip("-")[:40] or "film"
    path = os.path.join(folder, safe + ".curiotrace.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=1)
    print("Curiosities: traced %d shot%s of \"%s\" into %s. Load it in the app: Library > Share a film." % (
        len(shots), "" if len(shots) == 1 else "s", title, path))
    return path


def run(action, scope=None, **kw):
    """What the Scripts menu entries call. Prints a plain message instead of a traceback for things to fix."""
    try:
        resolve = find_resolve(scope)
        return {"send": send_storyboard, "read": read_edit, "trace": trace_edit}[action](resolve, **kw)
    except Problem as e:
        print("Curiosities: " + str(e))
        return None
