"""Install Curiosities into DaVinci Resolve's Scripts menu.

    python3 install.py                 # into your own Resolve scripts folder
    python3 install.py --scripts DIR   # into another Scripts/Utility folder
    python3 install.py --remove

It copies the curiosities_resolve package to ~/.curiosities/resolve and puts three small scripts in
Resolve's Scripts/Utility/Curiosities folder, which Resolve shows as Workspace > Scripts > Curiosities.
Restart Resolve (or reopen the menu) to see them.
"""
import argparse
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(os.path.expanduser("~"), ".curiosities", "resolve")
MENU = {
    "Send storyboard to this timeline": "send",
    "Read this edit onto the board": "read",
    "Trace this edit into a shared film": "trace",
}
TEMPLATE = '''# Curiosities for DaVinci Resolve: {label}. Made by install.py; see apps/curiosities/resolve/README.md.
import sys
sys.path.insert(0, {lib!r})
from curiosities_resolve import resolve_link
resolve_link.run({action!r}, globals())
'''


def user_scripts_dir():
    """Resolve's per-user Scripts/Utility folder on this computer."""
    home = os.path.expanduser("~")
    if sys.platform == "darwin":
        base = os.path.join(home, "Library", "Application Support", "Blackmagic Design", "DaVinci Resolve", "Fusion")
    elif sys.platform.startswith("win"):
        base = os.path.join(os.environ.get("APPDATA", home), "Blackmagic Design", "DaVinci Resolve", "Support", "Fusion")
    else:
        base = os.path.join(home, ".local", "share", "DaVinciResolve", "Fusion")
    return os.path.join(base, "Scripts", "Utility")


def install(scripts_dir, lib=LIB):
    os.makedirs(lib, exist_ok=True)
    target = os.path.join(lib, "curiosities_resolve")
    if os.path.isdir(target):
        shutil.rmtree(target)
    shutil.copytree(os.path.join(HERE, "curiosities_resolve"), target, ignore=shutil.ignore_patterns("__pycache__"))
    menu = os.path.join(scripts_dir, "Curiosities")
    os.makedirs(menu, exist_ok=True)
    for label, action in MENU.items():
        with open(os.path.join(menu, label + ".py"), "w") as f:
            f.write(TEMPLATE.format(label=label.lower(), lib=lib, action=action))
    return menu


def remove(scripts_dir, lib=LIB):
    for path in (os.path.join(scripts_dir, "Curiosities"), os.path.join(lib, "curiosities_resolve")):
        if os.path.isdir(path):
            shutil.rmtree(path)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Install Curiosities into DaVinci Resolve's Scripts menu.")
    ap.add_argument("--scripts", default=user_scripts_dir(), help="Resolve's Scripts/Utility folder")
    ap.add_argument("--remove", action="store_true")
    a = ap.parse_args()
    if a.remove:
        remove(a.scripts)
        print("Removed Curiosities from %s." % a.scripts)
    else:
        print("Installed. In Resolve: Workspace > Scripts > Curiosities. (%s)" % install(a.scripts))
