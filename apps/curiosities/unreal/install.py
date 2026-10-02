"""Install the Curiosities plugin into an Unreal project.

    python3 install.py "/path/to/MyProject"          (the folder with MyProject.uproject)
    python3 install.py "/path/to/MyProject" --remove

It copies Curiosities/ to MyProject/Plugins/Curiosities, with the camera mapping shared with Maya copied in
so the plugin stands alone. Open the project, say yes if Unreal asks to enable the plugin, and use
Tools > Curiosities.
"""
import argparse
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = os.path.join(os.path.dirname(HERE), "maya", "scripts", "curiosities_maya", "curio_camera.py")


def install(project):
    if not any(n.endswith(".uproject") for n in os.listdir(project)):
        raise SystemExit("No .uproject in %s. Give the folder of your Unreal project." % project)
    target = os.path.join(project, "Plugins", "Curiosities")
    if os.path.isdir(target):
        shutil.rmtree(target)
    shutil.copytree(os.path.join(HERE, "Curiosities"), target, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    shutil.copyfile(SHARED, os.path.join(target, "Content", "Python", "curiosities_unreal", "curio_camera.py"))
    return target


def remove(project):
    target = os.path.join(project, "Plugins", "Curiosities")
    if os.path.isdir(target):
        shutil.rmtree(target)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Install the Curiosities plugin into an Unreal project.")
    ap.add_argument("project", help="the folder that holds your .uproject")
    ap.add_argument("--remove", action="store_true")
    a = ap.parse_args()
    if a.remove:
        remove(a.project)
        print("Removed Curiosities from %s." % a.project)
    else:
        print("Installed into %s. Open the project; the menu is Tools > Curiosities." % install(a.project))
    sys.exit(0)
