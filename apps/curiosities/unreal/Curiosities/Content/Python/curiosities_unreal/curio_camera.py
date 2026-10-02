"""In the repository this loads the one mapping shared with Maya (maya/scripts/curiosities_maya/curio_camera.py).
install.py puts the real file here in the installed plugin, so it stands alone."""
import importlib.util
import os

_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "maya", "scripts", "curiosities_maya", "curio_camera.py"))
_spec = importlib.util.spec_from_file_location("curio_camera_shared", _path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
globals().update({k: v for k, v in vars(_mod).items() if not k.startswith("__")})
