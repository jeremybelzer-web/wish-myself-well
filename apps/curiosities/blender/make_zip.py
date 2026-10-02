"""python3 apps/curiosities/blender/make_zip.py -> apps/curiosities/blender/dist/curiosities_blender.zip
The add-on with the shared camera mapping copied in, ready for Blender's Install from Disk."""
import os
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.join(HERE, "curiosities_blender")
SHARED = os.path.join(HERE, "..", "maya", "scripts", "curiosities_maya", "curio_camera.py")
OUT = os.path.join(HERE, "dist", "curiosities_blender.zip")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for name in sorted(os.listdir(PKG)):
        if name.endswith((".py", ".toml")) and name != "curio_camera.py":
            z.write(os.path.join(PKG, name), "curiosities_blender/" + name)
    z.write(SHARED, "curiosities_blender/curio_camera.py")
print(OUT)
