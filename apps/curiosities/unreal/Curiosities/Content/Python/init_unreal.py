"""Unreal runs this when the editor starts (any init_unreal.py in a plugin's Content/Python). It adds the
Tools > Curiosities menu."""
import unreal

try:
    import curiosities_unreal.unreal_link as curio

    curio.register_menus()
except Exception as e:  # never stop the editor from starting
    unreal.log_warning("Curiosities: the menu was not added: %s" % e)
