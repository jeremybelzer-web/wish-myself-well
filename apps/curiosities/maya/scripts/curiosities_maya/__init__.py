"""Curiosities inside Maya. `import curiosities_maya; curiosities_maya.show()` docks the app.
curio_camera has no Maya in it; maya_camera and panel do."""


def show():
    from . import panel

    return panel.show()
