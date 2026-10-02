"""The Curiosities app docked in Maya. The app runs in a web view (the same files as the web version), and
a small channel carries each storyboard panel's camera curiosities to a Maya camera.

    import curiosities_maya; curiosities_maya.show()

Follow board: the camera takes the chosen moment (the engine's whole film when it has one, else the storyboard panel)'s curiosities as they change (automation included).
Key shots: one shot per panel on curioCam, keyed, with a Camera Sequencer shot each.
Read camera: the camera at the start of each shot, read back onto the board as the strand "Maya camera".
Subject: the selected object (its pivot is the subject's feet); otherwise the origin."""
import json
import os

import maya.cmds as cmds
from maya.app.general.mayaMixin import MayaQWidgetDockableMixin

try:
    from PySide6 import QtCore, QtWidgets
    from PySide6.QtWebChannel import QWebChannel
    from PySide6.QtWebEngineCore import QWebEngineScript
    from PySide6.QtWebEngineWidgets import QWebEngineView
except ImportError:  # Maya 2022 to 2024
    from PySide2 import QtCore, QtWidgets
    from PySide2.QtWebChannel import QWebChannel
    from PySide2.QtWebEngineWidgets import QWebEngineScript, QWebEngineView

from . import maya_camera

HERE = os.path.dirname(os.path.abspath(__file__))
# The app's index.html: CURIOSITIES_APP if set, else the copy beside this module (apps/curiosities/).
APP = os.environ.get("CURIOSITIES_APP") or os.path.normpath(os.path.join(HERE, "..", "..", "..", "index.html"))
_panel = None


class Host(QtCore.QObject):
    """The object the page sees as channel.objects.curioHost."""

    changed = QtCore.Signal()

    def __init__(self, parent=None):
        super(Host, self).__init__(parent)
        self.values = []

    @QtCore.Slot(str)
    def panels(self, text):
        try:
            self.values = json.loads(text).get("panels") or []
        except ValueError:
            return
        self.changed.emit()


def _script(name, source):
    s = QWebEngineScript()
    s.setName(name)
    s.setSourceCode(source)
    s.setInjectionPoint(QWebEngineScript.DocumentReady)
    s.setWorldId(QWebEngineScript.MainWorld)
    s.setRunsOnSubFrames(False)
    return s


class CuriositiesPanel(MayaQWidgetDockableMixin, QtWidgets.QWidget):
    def __init__(self, parent=None):
        super(CuriositiesPanel, self).__init__(parent)
        self.setObjectName("curiositiesPanel")
        self.setWindowTitle("Curiosities")
        self.subject = (0.0, 0.0, 0.0)
        self.host = Host(self)
        self.host.changed.connect(self._follow)

        bar = QtWidgets.QHBoxLayout()
        self.follow = QtWidgets.QCheckBox("Follow board")
        self.follow.setChecked(True)
        self.which = QtWidgets.QSpinBox()
        self.which.setPrefix("Panel ")
        self.which.setRange(1, 8)
        self.which.valueChanged.connect(self._follow)
        self.eye = QtWidgets.QDoubleSpinBox()
        self.eye.setPrefix("Eyes ")
        self.eye.setSuffix(" m")
        self.eye.setRange(0.1, 10.0)
        self.eye.setValue(1.6)
        subject = QtWidgets.QPushButton("Subject = selection")
        subject.clicked.connect(self._pick_subject)
        key = QtWidgets.QPushButton("Key shots")
        key.clicked.connect(self._key)
        read = QtWidgets.QPushButton("Read camera")
        read.clicked.connect(self._read)
        for w in (self.follow, self.which, self.eye, subject, key, read):
            bar.addWidget(w)
        bar.addStretch(1)
        self.status = QtWidgets.QLabel("Loading the app")

        self.view = QWebEngineView(self)
        page = self.view.page()
        self.channel = QWebChannel(page)
        self.channel.registerObject("curioHost", self.host)
        page.setWebChannel(self.channel)
        qwc = QtCore.QFile(":/qtwebchannel/qwebchannel.js")
        if qwc.open(QtCore.QIODevice.ReadOnly):
            page.scripts().insert(_script("qwebchannel", qwc.readAll().data().decode("utf-8")))
            qwc.close()
        with open(os.path.join(HERE, "maya-link.js"), "r") as f:
            page.scripts().insert(_script("curio-maya-link", f.read()))
        self.view.load(QtCore.QUrl.fromLocalFile(APP))

        layout = QtWidgets.QVBoxLayout(self)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.addLayout(bar)
        layout.addWidget(self.status)
        layout.addWidget(self.view, 1)

    def _fps(self):
        rates = {"film": 24.0, "pal": 25.0, "ntsc": 30.0, "game": 15.0, "show": 48.0, "palf": 50.0, "ntscf": 60.0}
        unit = cmds.currentUnit(query=True, time=True)
        return rates.get(unit) or float("".join(c for c in unit if c.isdigit() or c == ".") or 24)

    def _pick_subject(self):
        sel = cmds.ls(selection=True, transforms=True) or []
        if sel:
            p = cmds.xform(sel[0], query=True, worldSpace=True, rotatePivot=True)
            k = maya_camera.scale(cmds)
            self.subject = (p[0] / k, p[1] / k, p[2] / k)
            self.status.setText("Subject: %s" % sel[0])
        else:
            self.subject = (0.0, 0.0, 0.0)
            self.status.setText("Subject: the origin")
        self._follow()

    def _follow(self):
        values = self.host.values
        if not values:
            return
        self.which.setMaximum(max(1, len(values)))
        if not self.follow.isChecked():
            return
        from . import curio_camera as cc
        v = values[min(self.which.value(), len(values)) - 1]
        cam = maya_camera.ensure_camera(cmds=cmds)
        maya_camera.apply_pose(cam, cc.camera_for(v, self.subject, self.eye.value()), cmds)
        self.status.setText("Panel %d on %s: %s" % (self.which.value(), cam, ", ".join("%s %s" % (k, v[k]) for k in sorted(v))))

    def _key(self):
        if not self.host.values:
            return
        cmds.undoInfo(openChunk=True, chunkName="Curiosities: key shots")
        try:
            plan = maya_camera.key_timeline(self.host.values, fps=self._fps(), subject=self.subject, eye=self.eye.value(), cmds=cmds)
        finally:
            cmds.undoInfo(closeChunk=True)
        self.status.setText("Keyed %d shots, frames %d to %d" % (len(plan), plan[0]["start"], plan[-1]["end"]))

    def _read(self):
        if not self.host.values or not cmds.objExists(maya_camera.CAMERA):
            self.status.setText("Key shots first, then move the camera and read it back")
            return
        per = maya_camera.read_timeline(self.host.values, fps=self._fps(), subject=self.subject, eye=self.eye.value(), cmds=cmds)
        self.view.page().runJavaScript("window.CurioMaya && window.CurioMaya.readBack(%s)" % json.dumps(per))
        self.status.setText("Read %d shots back onto the board as \"Maya camera\"" % len(per))


def show():
    """Open (or bring back) the docked panel."""
    global _panel
    if cmds.workspaceControl("curiositiesPanelWorkspaceControl", exists=True):
        cmds.deleteUI("curiositiesPanelWorkspaceControl")
    _panel = CuriositiesPanel()
    _panel.show(dockable=True, floating=True, width=900, height=700)
    return _panel
