/* The Maya User Guide and the Arnold for Maya User Guide, topic by topic, as curiosities.
   Built from research notes; see docs/maya-manual-review.md. weight: major or minor.
   fit: build (working tool), partial, curiosity (measured only), skip. keep: our call for review.
   sources: pages actually read; topics marked source "knowledge" were not read from a page. */

window.MAYA_MANUAL = {
 "sources": [
  "https://download.autodesk.com/global/docs/maya2014/en_US/files/GUID-E1BB9406-F1BC-4784-B89C-E289D07A3C31.htm",
  "https://download.autodesk.com/us/maya/2009help/files/Toon_shading_Types_of_toon_lines.htm",
  "https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/shot.html",
  "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-32296732-723B-457F-88EB-681A2965ED3E.htm",
  "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-9D37DF95-4AC6-4FBE-960A-66531104D758.htm",
  "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-C85B12D5-EB38-45D4-BA21-5E5A63330B7D.htm",
  "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-F976E7C0-394C-4797-85DF-C0F8D0CCB800.htm",
  "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-FDCA1426-D7FE-41A5-9563-5628C736BCCC.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-10701398-2AE0-4A3A-8C9F-F26C4EB4D4CE.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-19B154DE-58F2-46AF-B2EF-7D00B2E46476.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-1EC3357B-62DD-424F-9595-277C373D133C.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-22BF637E-5F92-4D2E-91E6-2FF1CA392270.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-2D865271-2873-4EDB-82C4-7FB9D7B311E7.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-2DFBE283-1A1E-4194-B6C5-B4E0F72D61CA.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3C92402C-B24E-4874-AC8D-EADF976A19DC.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-43A4FE2C-4863-4EA6-B6AE-6D2B6757F6C7.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-4D653DC9-57AA-4D8B-987A-5B7A9735CAF0.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-62FA61B5-4A76-4525-83BC-550EEF245936.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-65271F97-19E4-4E3E-A541-F89F7247B6BF.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-92112B70-161B-4D89-A1E5-BC3D58274EFB.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-A8D2F488-8215-46F2-8D96-9503E2D0669A.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-A9CA3572-FAFA-440D-92EB-37566A2DFE0B.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-ACC3EC75-5564-49FB-9571-CF43ACCA001A.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-B1BBD05B-0172-4626-A85C-35943A67E8BE.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-B718F1FE-8688-4A57-95DD-5B22C4D40F1A.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-BBCA0BC3-7608-4E86-8E9F-B4099C316156.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D2B1C7EF-F177-4B0E-9E41-B479CFF2AFD4.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D4FECFDC-F91A-4BDC-A1B0-A24EB087B2DD.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-E43621EC-5810-47FF-90FE-168ADFA63C4E.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-E4B5DB7D-7351-4561-BD8B-60AC9D48DDF6.htm",
  "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-F7BE47E6-76D5-47F0-8159-9F39FF0C4215.htm",
  "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm",
  "https://help.autodesk.com/cloudhelp/2023/ENU/Maya-Animation/files/GUID-2656574F-FBC6-457B-B0C1-5C1249DA89EF.htm",
  "https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/getting-started/am-Hyperspace_Madness_Production/arnold_for_maya_getting_started_am_Hyperspace_Effect_using_a_Gobo_and_Atmosphere_Volume_html.html",
  "https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/arnold_for_maya_shading_am_Using_Barndoor_Filter_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/ac-light-filters/arnold_user_guide_ac_light_filters_ac_light_blocker_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/arnold_user_guide_ac_lights_ac_light_filters_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-output-aovs/arnold_user_guide_ac_output_aovs_ac_aovs_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-render-settings/arnold_user_guide_ac_render_settings_ac_sampling_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_render_settings_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/arnold_for_maya_am_Getting_Started_with_Arnold_GPU_html.html",
  "https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/am-Toon_Tutorials/arnold_for_maya_toon_am_Toon_Shading_with_the_Facing_Ratio_shader_html.html",
  "https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html",
  "https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
 ],
 "gaps": [],
 "topics": [
  {
   "id": "camera-animation",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Animating cameras (shake, follow, turntable)",
   "granularity": [
    "keyed camera",
    "camera shake attribute",
    "aim follow",
    "turntable",
    "crane on path"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Camera carry, move and shake exist; Maya's shake attribute maps to cameraShake.",
   "curiosities": [
    "cameraMove",
    "cameraCarry",
    "cameraShake",
    "moveSpeed"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Handheld chase",
     "set": {
      "cameraCarry": "handheld",
      "cameraShake": "3",
      "moveSpeed": "5"
     }
    }
   ],
   "proximities": [
    "When an impact fires, cameraShake spikes within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Most-used camera tooling.",
   "source": "knowledge"
  },
  {
   "id": "animation-layers",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Animation layers (additive, override)",
   "granularity": [
    "additive",
    "override",
    "override passthrough",
    "weight 0 to 1",
    "mute/solo",
    "merge"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Stack a remix layer over a study: additive nudges values, override replaces them, weight blends.",
   "curiosities": [
    "devAugment",
    "devSwap"
   ],
   "newCuriosities": [
    {
     "id": "layerWeight",
     "label": "Remix layer weight",
     "values": "0 to 1",
     "view": "A fader under the strip"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "remixer",
    "performer"
   ],
   "keep": "keep",
   "reason": "Non-destructive remix layers fit remixers and live performers.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-BBCA0BC3-7608-4E86-8E9F-B4099C316156.htm"
  },
  {
   "id": "animation-principles-maya",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Animation principles in Maya tutorials",
   "granularity": [
    "anticipation",
    "follow-through",
    "overlap",
    "arcs",
    "slow in/out",
    "squash"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Existing principle rows are the model.",
   "curiosities": [
    "anticipation",
    "overshoot",
    "overlap",
    "arcs",
    "squash",
    "spacing"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Cartoon snap",
     "set": {
      "anticipation": "big",
      "spacing": "snap",
      "overshoot": "bounce",
      "squash": "4"
     }
    }
   ],
   "proximities": [
    "When anticipation is big, the move follows within 1 to 2 beats",
    "When a body stops, overlap follows within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "The core of the Animation group.",
   "source": "knowledge"
  },
  {
   "id": "audio-lipsync",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Audio for animation and lip sync",
   "granularity": [
    "waveform in time slider",
    "scrub audio",
    "phoneme keying"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Mouth shapes per second and scrub sync already exist.",
   "curiosities": [
    "lipSync",
    "breath"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When a line starts, lipSync rises within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Dialogue scenes depend on it.",
   "source": "knowledge"
  },
  {
   "id": "auto-key",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Auto Key and live recording",
   "granularity": [
    "auto key toggle",
    "record while scrubbing"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Record mode: any board control changed during playback writes a key at that beat.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "performer",
    "beginner",
    "intermediate"
   ],
   "keep": "keep",
   "reason": "Live performers record by playing.",
   "source": "knowledge"
  },
  {
   "id": "cycles-walks",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Cycles and walk cycles",
   "granularity": [
    "cycle with offset",
    "contact, down, passing, up",
    "stride",
    "in place vs travel"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Walk timing is a curiosity (steps per second, gait).",
   "curiosities": [
    "characterSpeed"
   ],
   "newCuriosities": [
    {
     "id": "gait",
     "label": "Gait",
     "values": "shuffle, walk, march, run, sneak",
     "view": "Footfall ticks on the strip"
    }
   ],
   "suites": [],
   "proximities": [
    "When gait is run, cutRate rises within 2 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Gait reads character instantly.",
   "source": "knowledge"
  },
  {
   "id": "dope-sheet",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Dope Sheet",
   "granularity": [
    "keys per object",
    "summary row",
    "scale and move keys",
    "sound in dope sheet",
    "hierarchy"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "The study trace view is a dope sheet: rows per curiosity, ticks per beat.",
   "curiosities": [
    "poseRate"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Grid of ticks is how studies are read.",
   "source": "knowledge"
  },
  {
   "id": "motion-trails",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Editable motion trails",
   "granularity": [
    "trail over time range",
    "pre/post frames",
    "increment",
    "frame markers",
    "show frame numbers",
    "anchor transform",
    "edit keys on trail"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Show a dotted trail per character with spacing dots; drag dots to retime.",
   "curiosities": [
    "arcs",
    "spacing"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Spacing dots make ease visible.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-2DFBE283-1A1E-4194-B6C5-B4E0F72D61CA.htm"
  },
  {
   "id": "ghosting",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Ghosting (onion skin)",
   "granularity": [
    "ghost before",
    "after",
    "before and after",
    "custom frames",
    "key frames only",
    "frame step",
    "pre/post color",
    "near/far opacity"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Onion skin the previous and next panels faintly on the current one.",
   "curiosities": [
    "arcs",
    "stepping"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Onion skin is the oldest animator check.",
   "source": "https://help.autodesk.com/cloudhelp/2023/ENU/Maya-Animation/files/GUID-2656574F-FBC6-457B-B0C1-5C1249DA89EF.htm"
  },
  {
   "id": "graph-editor-curves",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Graph Editor curves",
   "granularity": [
    "value over time",
    "normalized view",
    "stacked view",
    "pre/post infinity: constant, linear, cycle, cycle with offset, oscillate"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draw any curiosity as a curve through beats and allow cycle and oscillate past the last key.",
   "curiosities": [
    "spacing",
    "moveSpeed"
   ],
   "newCuriosities": [
    {
     "id": "afterLast",
     "label": "After the last key",
     "values": "hold, continue, repeat, repeat and add, back and forth",
     "view": "A ghosted curve continuing past the end"
    }
   ],
   "suites": [],
   "proximities": [
    "When a move cycles, a musicCue repeat follows within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Curves over beats are the app's main drawing.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-43A4FE2C-4863-4EA6-B6AE-6D2B6757F6C7.htm"
  },
  {
   "id": "graph-editor-tangents",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Graph Editor tangent types",
   "granularity": [
    "auto",
    "spline",
    "linear",
    "clamped",
    "stepped",
    "stepped next",
    "flat",
    "fixed",
    "plateau",
    "break/unify tangents",
    "weighted tangents"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Every curve segment gets an ease type; stepped gives pose-to-pose holds, flat gives a stop, linear a mechanical move.",
   "curiosities": [
    "spacing",
    "stepping"
   ],
   "newCuriosities": [
    {
     "id": "easeType",
     "label": "Ease type",
     "values": "stepped, linear, smooth, flat stop, no overshoot",
     "view": "Curve shape between two beats"
    }
   ],
   "suites": [
    {
     "label": "Pose to pose blocking",
     "set": {
      "easeType": "stepped",
      "stepping": "twos"
     }
    },
    {
     "label": "Robot move",
     "set": {
      "easeType": "linear",
      "overlap": "none"
     }
    }
   ],
   "proximities": [
    "When easeType is stepped, poseRate rises within 2 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Tangent type is the plainest measurable motion feel.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-43A4FE2C-4863-4EA6-B6AE-6D2B6757F6C7.htm"
  },
  {
   "id": "motion-paths",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Motion paths",
   "granularity": [
    "attach to curve",
    "follow",
    "front and up axis",
    "bank",
    "time range",
    "path markers"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draw a path on the floor plan; a character, object or camera rides it with optional follow and bank.",
   "curiosities": [
    "characterPath",
    "objectPath",
    "cameraMove"
   ],
   "newCuriosities": [
    {
     "id": "bank",
     "label": "Lean into the turn",
     "values": "0 to 5",
     "view": "Tilt on the dot at each turn"
    }
   ],
   "suites": [],
   "proximities": [
    "When a path turns tightly, bank rises within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Floor plan paths are already drawn; markers make timing editable.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-A8D2F488-8215-46F2-8D96-9503E2D0669A.htm"
  },
  {
   "id": "pose-library",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Pose library and saved poses",
   "granularity": [
    "save pose",
    "apply pose",
    "mirror pose",
    "blend pose"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Save a panel's body values as a named pose and drop it onto other beats.",
   "curiosities": [
    "posture",
    "gesture",
    "faceIntensity"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Defeated",
     "set": {
      "posture": "closed",
      "gesture": "none",
      "stillness": "4"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Pose reuse is fast for beginners and live pads.",
   "source": "knowledge"
  },
  {
   "id": "retime-tool",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Retime tool",
   "granularity": [
    "retime markers",
    "drag span to speed up or slow down",
    "move span in time"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Drag markers on the strip to squeeze or stretch a span of beats.",
   "curiosities": [
    "speedRamp",
    "pace"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Direct timing control everyone uses.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-65271F97-19E4-4E3E-A541-F89F7247B6BF.htm"
  },
  {
   "id": "time-warp",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Scene time warp",
   "granularity": [
    "warp curve maps scene time",
    "slow motion",
    "speed ramp",
    "per-clip warp in Time Editor/Trax"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A curve over the strip that speeds and slows playback without changing keys.",
   "curiosities": [
    "speedRamp"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Bullet time",
     "set": {
      "speedRamp": "0.25",
      "cameraMove": "orbit",
      "motionBlur": "low"
     }
    }
   ],
   "proximities": [
    "When speedRamp drops to 0.25, an impact follows within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Speed ramps are a filmmaker staple.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-32296732-723B-457F-88EB-681A2965ED3E.htm"
  },
  {
   "id": "set-key",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Setting keyframes",
   "granularity": [
    "set key",
    "key selected",
    "auto key",
    "key all vs key changed",
    "breakdown keys"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Mark beats as key poses and let in-betweens fill; auto key while performing live.",
   "curiosities": [
    "poseRate"
   ],
   "newCuriosities": [
    {
     "id": "keyKind",
     "label": "Key or in-between",
     "values": "key, breakdown, in-between",
     "view": "Tall tick for key, short tick for breakdown"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Keys versus in-betweens is the first thing an animator learns.",
   "source": "knowledge"
  },
  {
   "id": "timing-charts",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Spacing and timing (ones, twos, holds)",
   "granularity": [
    "on ones",
    "on twos",
    "holds",
    "moving holds",
    "favor charts"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Drawn on ones/twos and hold length are curiosities.",
   "curiosities": [
    "stepping",
    "spacing",
    "settleTime"
   ],
   "newCuriosities": [
    {
     "id": "holdLength",
     "label": "Hold length",
     "values": "0 to 12 frames",
     "view": "A flat run on the curve"
    }
   ],
   "suites": [
    {
     "label": "Anime limited",
     "set": {
      "stepping": "threes",
      "holdLength": "8"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Core timing vocabulary.",
   "source": "knowledge"
  },
  {
   "id": "time-editor",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Time Editor clips",
   "granularity": [
    "clips on tracks",
    "crossfade by overlap",
    "transitions",
    "speed and length",
    "loop and hold",
    "audio tracks",
    "mute/solo",
    "group",
    "bake"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Strands from studies become clips that loop, hold, crossfade and stack on tracks; the remixer's main tool.",
   "curiosities": [
    "transition",
    "repetition"
   ],
   "newCuriosities": [
    {
     "id": "clipLoop",
     "label": "Clip repeats",
     "values": "1 to 8",
     "view": "A clip block with tick marks per repeat"
    }
   ],
   "suites": [
    {
     "label": "Loop the groove",
     "set": {
      "clipLoop": "4",
      "repetition": "high"
     }
    }
   ],
   "proximities": [
    "When a clip crossfades, transition becomes dissolve within 0 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "remixer",
    "performer"
   ],
   "keep": "keep",
   "reason": "Clip mixing is the remixer and live-set workflow.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-E4B5DB7D-7351-4561-BD8B-60AC9D48DDF6.htm"
  },
  {
   "id": "bake-simulation",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Bake simulation / bake keys",
   "granularity": [
    "bake to keys",
    "sample rate",
    "smart bake"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Turn a live performance or noise into fixed beat values in a study.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "performer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Lets a live take become an editable study.",
   "source": "knowledge"
  },
  {
   "id": "breakdowns",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Breakdown keys",
   "granularity": [
    "breakdown key",
    "favoring",
    "tween machine idea"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "A breakdown favors one pose; record which way it leans.",
   "curiosities": [
    "poseRate"
   ],
   "newCuriosities": [
    {
     "id": "favor",
     "label": "Breakdown favors",
     "values": "start, middle, end",
     "view": "A dot sliding between two key ticks"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Favoring is a timing choice students study.",
   "source": "knowledge"
  },
  {
   "id": "graph-editor-buffer",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Buffer curves and curve snapshots",
   "granularity": [
    "buffer curve snapshot",
    "swap buffer",
    "compare before/after"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Keep a faded copy of a curve before an edit to compare.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Remixers compare original vs remixed curve.",
   "source": "knowledge"
  },
  {
   "id": "character-sets",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Character sets and quick select sets",
   "granularity": [
    "character set",
    "subcharacter",
    "key all in set"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "A suite already is a set of values keyed together.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Same idea as suites.",
   "source": "knowledge"
  },
  {
   "id": "time-slider-key-editing",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Editing keys in the time slider",
   "granularity": [
    "move keys",
    "scale keys",
    "copy/paste keys",
    "ripple"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Shift-drag to move or scale keys over beats on the strip.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Basic editing.",
   "source": "knowledge"
  },
  {
   "id": "expressions",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Expressions",
   "granularity": [
    "time and frame variables",
    "sin/noise/rand",
    "per-frame evaluation"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Allow a value to follow a wave or noise instead of keys.",
   "curiosities": [
    "cameraShake"
   ],
   "newCuriosities": [
    {
     "id": "valueWave",
     "label": "Wave pattern",
     "values": "none, sine, noise, random",
     "view": "A repeating curve over beats"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "performer"
   ],
   "keep": "keep",
   "reason": "Noise and sine drive shake and idle motion.",
   "source": "knowledge"
  },
  {
   "id": "ghost-layers",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Ghosting for animation layers",
   "granularity": [
    "ghost up to a layer",
    "auto ghost selected",
    "custom frame steps"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Ghost the board before a remix layer was applied.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "remixer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Shows what a remix layer changed.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-9D37DF95-4AC6-4FBE-960A-66531104D758.htm"
  },
  {
   "id": "graph-editor-tools",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Graph Editor curve tools",
   "granularity": [
    "simplify curve",
    "euler filter",
    "bake channel",
    "scale keys",
    "snap",
    "region tool",
    "lattice deform keys"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Simplify and scale over a span of beats; no euler filter.",
   "curiosities": [
    "spacing"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Scale and simplify help editing studies.",
   "source": "knowledge"
  },
  {
   "id": "mocap",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Motion capture and live devices",
   "granularity": [
    "mocap import",
    "device inputs",
    "retarget"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "MIDI straps and pads write values into curiosities live, then bake.",
   "curiosities": [
    "gesture"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "performer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Performer audience.",
   "source": "knowledge"
  },
  {
   "id": "trax-editor",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Trax Editor (legacy clips and poses)",
   "granularity": [
    "character set clips",
    "poses",
    "blend",
    "clip scale",
    "cycle"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Same as Time Editor; poses saved as reusable slices.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Legacy, covered by the Time Editor row.",
   "source": "knowledge"
  },
  {
   "id": "visibility-keys",
   "manual": "Maya",
   "area": "Animation",
   "topic": "Visibility keys (pop on, pop off)",
   "granularity": [
    "keyed visibility",
    "stepped"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Entrances and exits already measured.",
   "curiosities": [
    "bodyEnter",
    "objectEnter",
    "reveal"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Pop-on reveals.",
   "source": "knowledge"
  },
  {
   "id": "audio-import",
   "manual": "Maya",
   "area": "Audio",
   "topic": "Import sound file",
   "granularity": [
    "import audio",
    "offset",
    "multiple sounds"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Load a song or dialogue file under the strip so beats can be placed on it.",
   "curiosities": [
    "musicCue",
    "volume"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Sound drives timing.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-22BF637E-5F92-4D2E-91E6-2FF1CA392270.htm"
  },
  {
   "id": "audio-waveform",
   "manual": "Maya",
   "area": "Audio",
   "topic": "Waveform on the time slider",
   "granularity": [
    "waveform display",
    "sound color",
    "Trax sounds mode"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draw the waveform under the strip; loud peaks become candidates for cuts.",
   "curiosities": [
    "volume",
    "silence",
    "soundToCut"
   ],
   "newCuriosities": [
    {
     "id": "loudPeak",
     "label": "Loud hit",
     "values": "yes, no",
     "view": "Marker on the waveform"
    }
   ],
   "suites": [
    {
     "label": "Cut on the beat",
     "set": {
      "soundToCut": "on",
      "musicCue": "in",
      "cutRate": "high"
     }
    }
   ],
   "proximities": [
    "When loudPeak fires, a cut follows within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Waveform is the bridge to performers and editors.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-22BF637E-5F92-4D2E-91E6-2FF1CA392270.htm"
  },
  {
   "id": "audio-scrub",
   "manual": "Maya",
   "area": "Audio",
   "topic": "Audio scrubbing and playback sync",
   "granularity": [
    "scrub",
    "play every frame vs real-time"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Hear sound while dragging the playhead.",
   "curiosities": [
    "breath",
    "silence"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Small but expected.",
   "source": "knowledge"
  },
  {
   "id": "camera-sequencer",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Camera Sequencer (shots on a track)",
   "granularity": [
    "shots as rectangles on tracks",
    "active camera per shot",
    "ubercam",
    "shot scale/speed",
    "mute, solo, lock",
    "audio track",
    "AAF/FCP import"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "The app's strip is a shot sequencer; add shot blocks with length, per-shot camera, mute/solo and an audio lane.",
   "curiosities": [
    "cutRate",
    "shotDuration",
    "angleCount",
    "transition"
   ],
   "newCuriosities": [
    {
     "id": "shotScale",
     "label": "Shot speed",
     "values": "0.25x to 4x",
     "view": "A number on each shot block"
    }
   ],
   "suites": [
    {
     "label": "Rapid-fire coverage",
     "set": {
      "cutRate": "high",
      "shotDuration": "short",
      "angleFamily": "coverage"
     }
    }
   ],
   "proximities": [
    "When shotScale drops below 1, musicCue changes within 2 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Closest Maya feature to the app itself: shots, cameras, cuts, audio.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-FDCA1426-D7FE-41A5-9563-5628C736BCCC.htm"
  },
  {
   "id": "camera-attributes",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Camera attributes",
   "granularity": [
    "focal length",
    "film back / sensor",
    "angle of view",
    "near/far clip",
    "film gate and resolution gate",
    "overscan"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Lens length and frame shape are already curiosities; film gate becomes the panel border.",
   "curiosities": [
    "lensLength",
    "aspect"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Long lens squeeze",
     "set": {
      "lensLength": "135",
      "shotSize": "close",
      "depthOfField": "1.4"
     }
    },
    {
     "label": "Wide and deep",
     "set": {
      "lensLength": "18",
      "shotSize": "wide",
      "depthOfField": "11"
     }
    }
   ],
   "proximities": [
    "When lensLength goes long, depthOfField goes shallow within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Lens is the most-used camera measure.",
   "source": "knowledge"
  },
  {
   "id": "playback-speed-fps",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Playback rate and frame rate",
   "granularity": [
    "24 fps film",
    "25 PAL",
    "30 NTSC",
    "12 on twos",
    "real-time vs every frame",
    "loop, once, oscillate"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Play the board at a chosen beats-per-second with loop, once and ping-pong modes.",
   "curiosities": [
    "stepping",
    "speedRamp"
   ],
   "newCuriosities": [
    {
     "id": "loopMode",
     "label": "Loop style",
     "values": "once, loop, back and forth",
     "view": "An icon on the playhead per pass"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Live performers need loop and ping-pong; students need fps vs drawn-on-twos.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-1EC3357B-62DD-424F-9595-277C373D133C.htm"
  },
  {
   "id": "playblast",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Playblast (quick preview movie)",
   "granularity": [
    "time range",
    "sequence time",
    "format/encoding",
    "quality",
    "display size and scale",
    "ornaments",
    "offscreen"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Export the board as a flipbook GIF/WebM or PNG strip straight from the browser.",
   "curiosities": [
    "shotDuration"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Everyone needs to share a quick motion preview; canvas recording makes it doable.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-2D865271-2873-4EDB-82C4-7FB9D7B311E7.htm"
  },
  {
   "id": "audio-scene",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Sound in the scene (waveform on time slider)",
   "granularity": [
    "import wav/aiff",
    "offset",
    "waveform display",
    "scrub audio"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Load an audio file and draw its waveform under the strip so beats line up with sound.",
   "curiosities": [
    "volume",
    "musicCue",
    "soundToCut"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When volume peaks, a cut follows within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Lip sync, music video and live performance all key off audio.",
   "source": "knowledge"
  },
  {
   "id": "time-slider",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Time slider and range slider",
   "granularity": [
    "current frame",
    "playback range",
    "keys shown as ticks",
    "sound waveform on slider",
    "bookmarks"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "The strip already is a time slider; add a scrubbable beat bar with key ticks and named bookmarks over spans.",
   "curiosities": [
    "shotDuration",
    "sceneLength"
   ],
   "newCuriosities": [
    {
     "id": "beatBookmark",
     "label": "Named span",
     "values": "a name over a run of beats",
     "view": "A colored band laid over the strip"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "The beat strip is the app's spine; bookmarks name sections for students and remixers.",
   "source": "knowledge"
  },
  {
   "id": "viewports-cameras",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Viewports and camera views",
   "granularity": [
    "perspective",
    "top/front/side",
    "look through camera",
    "four-pane layout",
    "isolate select"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Each panel shows the camera view plus a small top-down floor plan; no full 3D viewport.",
   "curiosities": [
    "shotSize",
    "angleHeight",
    "characterPath"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Floor plan plus camera view is how filmmakers block; full 3D is out of scope.",
   "source": "knowledge"
  },
  {
   "id": "camera-dof-blur",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Camera depth of field and motion blur",
   "granularity": [
    "f-stop",
    "focus distance",
    "focus region scale",
    "shutter angle"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Already modeled as depthOfField, rackFocus and motionBlur; draw the focus plane on the floor plan.",
   "curiosities": [
    "depthOfField",
    "rackFocus",
    "motionBlur"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When rackFocus fires, a line or a look follows within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Existing Maya-sourced rows; keeps them tied to the manual.",
   "source": "knowledge"
  },
  {
   "id": "camera-rigs",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Camera rigs (camera and aim, camera aim and up)",
   "granularity": [
    "one-node camera",
    "two-node aim",
    "three-node aim and up",
    "look-at target"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "A camera move can lock its aim to a character dot so pans follow the subject.",
   "curiosities": [
    "moveFollows",
    "cameraMove"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Aim-at-subject is how a follow pan is built.",
   "source": "knowledge"
  },
  {
   "id": "display-layers",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Display layers",
   "granularity": [
    "visible",
    "template",
    "reference (unselectable)",
    "color",
    "playback visibility"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Toggle panel layers (characters, objects, camera path, light) on and off.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Layer toggles reduce clutter on busy panels.",
   "source": "knowledge"
  },
  {
   "id": "references-assets",
   "manual": "Maya",
   "area": "Basics",
   "topic": "File referencing and assets",
   "granularity": [
    "reference a file",
    "namespaces",
    "proxy",
    "reload",
    "asset containers"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Studies can import suites or strands from another study by reference rather than copying.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Remixers reuse other people's strands; maps to Shelf import.",
   "source": "knowledge"
  },
  {
   "id": "hud",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Heads-up display (frame counter, camera name)",
   "granularity": [
    "frame number",
    "camera name",
    "focal length",
    "frame rate",
    "subject count"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Overlay beat number, camera name and lens on each panel like a slate.",
   "curiosities": [
    "lensLength"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Cheap, helps students read a panel.",
   "source": "knowledge"
  },
  {
   "id": "image-planes",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Image planes (reference images behind the camera)",
   "granularity": [
    "image plane per camera",
    "image sequence",
    "depth",
    "fit to gate"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Let a user drop a reference still or storyboard image under a panel.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Storyboarders and remixers trace over reference.",
   "source": "knowledge"
  },
  {
   "id": "outliner",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Outliner (scene list)",
   "granularity": [
    "hierarchy",
    "groups",
    "sets",
    "rename",
    "parenting"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "A side list of characters and objects in the scene with names and who is parented to whom.",
   "curiosities": [
    "peopleCount"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Students need a roster of what is on stage.",
   "source": "knowledge"
  },
  {
   "id": "scene-units-project",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Project folders, scene units and preferences",
   "granularity": [
    "project workspace",
    "linear units",
    "time units",
    "autosave"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled; the app keeps one localStorage store.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "File management, nothing to measure.",
   "source": "knowledge"
  },
  {
   "id": "sequencer-shot-sync",
   "manual": "Maya",
   "area": "Basics",
   "topic": "Sequencer shot sync markers",
   "granularity": [
    "green 1:1 synced",
    "orange scaled",
    "red out of sync",
    "re-playblast needed"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Mark a shot block when its board content changed since its preview strip was saved.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Useful stale-preview flag for edited studies.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-C85B12D5-EB38-45D4-BA21-5E5A63330B7D.htm"
  },
  {
   "id": "seq-playblast",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Playblast (quick preview movie)",
   "granularity": [
    "playblast shot",
    "playblast sequence",
    "post to image plane",
    "no alpha"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Export the strip as a quick animatic video (canvas recording) at the chosen frame rate.",
   "curiosities": [
    "shotDuration"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Students and performers need a shareable animatic.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-F976E7C0-394C-4797-85DF-C0F8D0CCB800.htm"
  },
  {
   "id": "seq-hold-transitions",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Pre/post hold and transitions in/out",
   "granularity": [
    "pre hold",
    "post hold",
    "transition in length",
    "transition out length"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Mark holds before and after a shot and a fade or dissolve length between panels.",
   "curiosities": [
    "transition",
    "shotDuration"
   ],
   "newCuriosities": [
    {
     "id": "holdFrames",
     "label": "Hold on first/last frame",
     "values": "0 to 48 frames",
     "view": "Small grey caps on each panel bar"
    }
   ],
   "suites": [
    {
     "label": "Slow dissolve",
     "set": {
      "transition": "dissolve",
      "shotDuration": "long",
      "musicCue": "in"
     }
    }
   ],
   "proximities": [
    "When transition is dissolve, timeOfDay or setting changes within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Transitions are core to editing study.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/shot.html"
  },
  {
   "id": "seq-time",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Sequence time versus scene time",
   "granularity": [
    "sequence start/end",
    "scene start/end",
    "scale",
    "retime"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Separate the edit order of beats from story order, so flashbacks and replays show up.",
   "curiosities": [
    "speedRamp",
    "sceneRate"
   ],
   "newCuriosities": [
    {
     "id": "timeOrder",
     "label": "Story order",
     "values": "linear, flashback, replay, flash forward",
     "view": "A second line beneath the strip showing story time"
    }
   ],
   "suites": [],
   "proximities": [
    "When timeOrder is replay, speedRamp slows within 0 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Edit time vs story time is a key remix lens.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/shot.html"
  },
  {
   "id": "seq-shot-audio",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Shot audio (audio linked to shots)",
   "granularity": [
    "import shot audio",
    "link audio",
    "mute audio"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Attach a sound file to a shot so cuts and sound line up; feeds sound-to-cut.",
   "curiosities": [
    "soundToCut",
    "musicCue"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When musicCue hits, a cut follows within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Cutting on sound is basic editing craft.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/shot.html"
  },
  {
   "id": "seq-shots",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Shots on tracks (camera, start, end)",
   "granularity": [
    "shot name",
    "camera",
    "start/end",
    "track",
    "mute",
    "lock"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "The strip is a sequencer: each panel is a shot with its camera and length; muting a shot drops it from playback.",
   "curiosities": [
    "shotDuration",
    "angleCount",
    "cutRate"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Core edit model maps directly to beats.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-FDCA1426-D7FE-41A5-9563-5628C736BCCC.htm"
  },
  {
   "id": "seq-editorial",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Editorial import/export (FCP XML, AAF)",
   "granularity": [
    "export XML",
    "import XML",
    "AAF"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Export cut points as a simple EDL/XML so a study can open in an editor; import gives a remixer a cut list.",
   "curiosities": [
    "cutRate",
    "shotDuration"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "remixer",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Bridges to editing software.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-FDCA1426-D7FE-41A5-9563-5628C736BCCC.htm"
  },
  {
   "id": "seq-favorite",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Shot favorites and names",
   "granularity": [
    "shot name",
    "favorite flag",
    "color"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Star key panels and name shots, already near the app's panel labels.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Small organizing win.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya-Tech-Docs/Commands/shot.html"
  },
  {
   "id": "seq-ubercam",
   "manual": "Maya",
   "area": "Camera Sequencer",
   "topic": "Ubercam / ubershot (one camera playing the whole cut)",
   "granularity": [
    "create ubercam",
    "bake shots"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Play all panels through one viewer in order, which the board already does panel by panel.",
   "curiosities": [
    "cutRate"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Same as the app's play mode.",
   "source": "https://help.autodesk.com/cloudhelp/2016/ENU/Maya/files/GUID-FDCA1426-D7FE-41A5-9563-5628C736BCCC.htm"
  },
  {
   "id": "focus-pull",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Animated focus distance (rack focus)",
   "granularity": [
    "keyed focus distance",
    "pull speed"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Animate the sharp plane from one dot to another across beats; fires the existing focus pull curiosity.",
   "curiosities": [
    "rackFocus",
    "focus"
   ],
   "newCuriosities": [
    {
     "id": "pullSpeed",
     "label": "Focus pull speed",
     "values": "snap, 1 to 5",
     "view": "Slope of the focus line between two subjects"
    }
   ],
   "suites": [],
   "proximities": [
    "When a line passes to the listener, rackFocus fires within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Focus pulls are a direct storytelling tool.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "camera-shake",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Camera shake attribute (2D filmback shake)",
   "granularity": [
    "shake enabled",
    "horizontal/vertical shake",
    "shake overscan"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Drive panel wobble from the existing shake value, also from a body strap's motion in live mode.",
   "curiosities": [
    "cameraShake",
    "cameraCarry"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Impact jolt",
     "set": {
      "cameraShake": "5",
      "impacts": "yes",
      "soundDensity": "high"
     }
    }
   ],
   "proximities": [
    "When impacts fires, cameraShake rises within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Shake on impact is common and performer friendly.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "depth-of-field",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Depth of field (f-stop, focus distance, focus region scale)",
   "granularity": [
    "depth of field on/off",
    "f-stop",
    "focus distance",
    "focus region scale"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Blur the stage background dots by f-stop and mark the focused subject; depthOfField already exists.",
   "curiosities": [
    "depthOfField",
    "focus",
    "rackFocus"
   ],
   "newCuriosities": [
    {
     "id": "focusDistance",
     "label": "Focus distance",
     "values": "near, subject, far, infinity",
     "view": "A dot on the floor plan line marking the sharp plane"
    }
   ],
   "suites": [
    {
     "label": "Shallow isolation",
     "set": {
      "depthOfField": "1.4",
      "shotSize": "close",
      "emptySpace": "high"
     }
    },
    {
     "label": "Deep staging",
     "set": {
      "depthOfField": "16",
      "lensLength": "25",
      "peopleCount": "3+"
     }
    }
   ],
   "proximities": [
    "When rackFocus fires, eyeline shifts to the new subject within 1 beat",
    "When depthOfField drops under 2.8, shotSize is close within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Shallow focus is a core visual signature filmmakers talk about.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "focal-length",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Focal length and angle of view",
   "granularity": [
    "focal length mm",
    "angle of view degrees",
    "zoom vs dolly"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Lens slider per beat already exists; add the matching angle-of-view wedge on the stage so beginners see what 35 vs 85 mm frames.",
   "curiosities": [
    "lensLength",
    "shotSize"
   ],
   "newCuriosities": [
    {
     "id": "angleOfView",
     "label": "Angle of view",
     "values": "5 to 120 degrees",
     "view": "A wedge on the floor plan that widens and narrows each beat"
    }
   ],
   "suites": [
    {
     "label": "Portrait lens",
     "set": {
      "lensLength": "85",
      "shotSize": "close",
      "depthOfField": "2"
     }
    },
    {
     "label": "Wide establish",
     "set": {
      "lensLength": "18",
      "shotSize": "wide",
      "depthOfField": "11"
     }
    }
   ],
   "proximities": [
    "When lensLength jumps over 50 mm, shotSize tightens within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Lens choice is the most used camera value after shot size.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "image-plane",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Image planes (reference footage behind the camera)",
   "granularity": [
    "image or movie file",
    "attach to camera",
    "depth",
    "alpha gain",
    "frame offset"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Let a remixer load a still or clip behind a panel to trace shot size, lens and placement against real footage.",
   "curiosities": [
    "shotSize",
    "composition"
   ],
   "newCuriosities": [
    {
     "id": "referenceUsed",
     "label": "Reference under the panel",
     "values": "none, still, clip",
     "view": "A small film icon on panels traced from footage"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "remixer",
    "student",
    "intermediate"
   ],
   "keep": "keep",
   "reason": "Tracing reference is the remixer workflow.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "look-through",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Look through selected / panel camera switching",
   "granularity": [
    "look through",
    "tear-off",
    "switch camera"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Each panel is a look-through of one camera; switching cameras is a cut and counts toward angle count.",
   "curiosities": [
    "angleCount",
    "cutRate"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Maps to cut and setup counting.",
   "source": "knowledge"
  },
  {
   "id": "shutter-angle",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Shutter angle and motion blur",
   "granularity": [
    "shutter angle 1 to 360",
    "motion blur on/off",
    "blur by frame"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Smear moving dots by shutter angle so a 45-degree action look reads differently from 180; value already stored.",
   "curiosities": [
    "motionBlur",
    "moveSpeed"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Staccato battle",
     "set": {
      "motionBlur": "45",
      "cameraCarry": "handheld",
      "cutRate": "high"
     }
    }
   ],
   "proximities": [
    "When motionBlur drops under 90 degrees, cutRate climbs within 2 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Shutter look is a known genre cue (war films, action).",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "lens-zoom-vs-dolly",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Zoom versus dolly (focal length animated vs camera translated)",
   "granularity": [
    "animated focal length",
    "camera translate",
    "dolly zoom"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Mark a move as optical zoom, physical push, or both opposite (dolly zoom) and draw it as a lens line versus a path line.",
   "curiosities": [
    "cameraMove",
    "lensLength",
    "moveSpeed"
   ],
   "newCuriosities": [
    {
     "id": "dollyZoom",
     "label": "Dolly zoom",
     "values": "none, push+zoom out, pull+zoom in",
     "view": "A red bracket over beats where lens and distance fight"
    }
   ],
   "suites": [
    {
     "label": "Vertigo",
     "set": {
      "cameraMove": "push in",
      "lensLength": "falling",
      "dollyZoom": "push+zoom out"
     }
    }
   ],
   "proximities": [
    "When dollyZoom fires, emotion turns to dread within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Classic filmmaker trick that is easy to explain in a timeline.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "2d-pan-zoom",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "2D pan/zoom (punch-in without moving camera)",
   "granularity": [
    "horizontal/vertical pan",
    "zoom",
    "pan/zoom enabled"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "A digital punch-in inside the frame, like a reframe in the edit.",
   "curiosities": [
    "shotSize",
    "cameraMove"
   ],
   "newCuriosities": [
    {
     "id": "punchIn",
     "label": "Digital punch-in",
     "values": "none, 1.1x, 1.5x, 2x",
     "view": "Inner frame inside the panel"
    }
   ],
   "suites": [],
   "proximities": [
    "When a joke lands, punchIn fires within 1 beat"
   ],
   "audience": [
    "remixer",
    "intermediate",
    "performer"
   ],
   "keep": "keep",
   "reason": "Edit-room punch-ins are common in comedy and online video.",
   "source": "knowledge"
  },
  {
   "id": "camera-bookmarks",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Camera bookmarks (saved views)",
   "granularity": [
    "create bookmark",
    "recall",
    "2D pan/zoom bookmark"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Save a framing as a named setup and reuse it; repeated setups give coverage patterns.",
   "curiosities": [
    "angleCount",
    "angleFamily"
   ],
   "newCuriosities": [
    {
     "id": "setupReturn",
     "label": "Returns to a setup",
     "values": "new, return",
     "view": "Ticks where a saved setup comes back"
    }
   ],
   "suites": [],
   "proximities": [
    "When setupReturn is return, angleFamily reads coverage within 0 beats"
   ],
   "audience": [
    "intermediate",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Performers can fire saved setups from pads.",
   "source": "knowledge"
  },
  {
   "id": "camera-output",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Camera outputs: renderable, mask, depth",
   "granularity": [
    "renderable",
    "image",
    "mask",
    "depth"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Pipeline output flags without story meaning.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Technical.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "camera-types",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Camera types (one node, aim, aim and up)",
   "granularity": [
    "Camera",
    "Camera and Aim",
    "Camera, Aim, and Up"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Records whether the camera points freely or is locked onto a target, as a per-shot tag.",
   "curiosities": [
    "moveFollows"
   ],
   "newCuriosities": [
    {
     "id": "cameraAim",
     "label": "Camera aims at",
     "values": "free, subject, point in space",
     "view": "A band colored by what the lens is locked onto"
    }
   ],
   "suites": [],
   "proximities": [
    "When cameraAim is subject, moveFollows is character within 0 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Aim-locked cameras explain why a move tracks a person.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "thirds-guides",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Composition guides (thirds, golden, center)",
   "granularity": [
    "rule of thirds",
    "golden ratio",
    "center lines"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Draw thirds lines on the panel; the subject dot snaps and records composition.",
   "curiosities": [
    "composition"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Feeds the existing composition curiosity directly.",
   "source": "knowledge"
  },
  {
   "id": "film-back-gate",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Film back and film gate presets",
   "granularity": [
    "16mm",
    "35mm academy",
    "35mm full",
    "70mm",
    "user aperture",
    "lens squeeze"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Stores the sensor or gauge per project so lens numbers read correctly; not animated per beat.",
   "curiosities": [
    "aspect",
    "lensLength"
   ],
   "newCuriosities": [
    {
     "id": "filmGauge",
     "label": "Film gauge",
     "values": "16mm, Super 35, 35 full, 65/70mm, phone",
     "view": "A label at the head of the strip, changes only at a format switch"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Explains why the same mm looks different across formats.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "film-fit",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Film fit (fill, horizontal, vertical, overscan)",
   "granularity": [
    "Fill",
    "Horizontal",
    "Vertical",
    "Overscan",
    "film fit offset"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "When the panel frame shape changes, choose crop or letterbox so the stage keeps the subject; useful for reframing a 16:9 board to 9:16.",
   "curiosities": [
    "aspect",
    "composition"
   ],
   "newCuriosities": [
    {
     "id": "reframeFit",
     "label": "Reframe fit",
     "values": "fill, fit width, fit height, letterbox",
     "view": "Ghost frame drawn over the panel"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Vertical reframes of films are a common remix task.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "film-offset-roll",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Film offset and film roll",
   "granularity": [
    "horizontal/vertical film offset",
    "film roll value",
    "roll pivot"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Film roll is the same as Dutch tilt for the app; film offset is lens shift, kept as a note.",
   "curiosities": [
    "dutch",
    "composition"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Maps cleanly onto existing Dutch value.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "anamorphic-squeeze",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Lens squeeze ratio (anamorphic)",
   "granularity": [
    "squeeze 1.0",
    "1.33",
    "2.0"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "A per-shot tag for anamorphic look, which pairs with 2.39 frame shape.",
   "curiosities": [
    "aspect"
   ],
   "newCuriosities": [
    {
     "id": "lensSqueeze",
     "label": "Anamorphic squeeze",
     "values": "1, 1.33, 1.5, 2",
     "view": "Tag on shots, stretched frame icon"
    }
   ],
   "suites": [
    {
     "label": "Scope look",
     "set": {
      "aspect": "2.39",
      "lensSqueeze": "2"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Remixers spot anamorphic flares and ovals.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "clipping-planes",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Near and far clipping planes",
   "granularity": [
    "near clip",
    "far clip",
    "auto render clip"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "A technical render limit with no story meaning; the app does not model it.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Technical, invisible to the audience.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "orthographic",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Orthographic versus perspective view",
   "granularity": [
    "orthographic width",
    "front/side/top"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Flat ortho views read as diagram or game look; a tag on the render style.",
   "curiosities": [
    "renderStyle"
   ],
   "newCuriosities": [
    {
     "id": "projection",
     "label": "Projection",
     "values": "perspective, flat",
     "view": "Tag"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Distinguishes isometric and side-scroller looks.",
   "source": "knowledge"
  },
  {
   "id": "resolution-gate",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Resolution gate, gate mask, overscan display",
   "granularity": [
    "display resolution",
    "gate mask opacity",
    "overscan"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Dim the area outside the frame on the stage so students see what is cut off.",
   "curiosities": [
    "aspect",
    "emptySpace"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Visual aid for frame edges.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "safe-frames",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Safe action and safe title",
   "granularity": [
    "safe action 90%",
    "safe title 80%",
    "field chart"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Overlay safe-action and safe-title boxes on each panel so titles and faces stay inside.",
   "curiosities": [
    "composition"
   ],
   "newCuriosities": [
    {
     "id": "insideSafe",
     "label": "Inside title safe",
     "values": "yes, no",
     "view": "Red tick when text or face crosses the safe line"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Cheap overlay, teaches framing basics.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-C3EBB008-7DBE-4B9D-B9AC-1DA974CEFE15.htm"
  },
  {
   "id": "stereo-interaxial",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Stereo camera: interaxial separation",
   "granularity": [
    "interaxial distance",
    "rig type"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Measure how strong the 3D depth is per shot for 3D films.",
   "curiosities": [],
   "newCuriosities": [
    {
     "id": "stereoDepth",
     "label": "3D depth",
     "values": "0 to 5",
     "view": "A depth bar per shot"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Only for 3D releases but measurable.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-ACC3EC75-5564-49FB-9571-CF43ACCA001A.htm"
  },
  {
   "id": "stereo-zero-parallax",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Stereo camera: zero parallax plane (screen plane)",
   "granularity": [
    "zero parallax distance",
    "in front / behind screen"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Records whether the subject pops out of or sits behind the screen.",
   "curiosities": [
    "focus"
   ],
   "newCuriosities": [
    {
     "id": "screenPlane",
     "label": "Subject vs screen",
     "values": "behind, on, in front",
     "view": "Dot above or below a screen line"
    }
   ],
   "suites": [],
   "proximities": [
    "When screenPlane is in front, impacts fires within 1 beat"
   ],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Pop-out moments are timed beats in 3D films.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-ACC3EC75-5564-49FB-9571-CF43ACCA001A.htm"
  },
  {
   "id": "stereo-view-modes",
   "manual": "Maya",
   "area": "Cameras",
   "topic": "Stereo viewing modes (anaglyph, interlace)",
   "granularity": [
    "anaglyph",
    "horizontal interlace",
    "side by side"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Display modes only; not part of the story model.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Viewer setting, not a beat value.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-ACC3EC75-5564-49FB-9571-CF43ACCA001A.htm"
  },
  {
   "id": "comp-depth-fog",
   "manual": "Maya",
   "area": "Compositing",
   "topic": "Depth pass for fog and DOF in compositing",
   "granularity": [
    "Z depth",
    "fog by depth"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Covered by atmosphere and depthOfField.",
   "curiosities": [
    "atmosphere",
    "depthOfField"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Links depth to mood.",
   "source": "knowledge"
  },
  {
   "id": "comp-alpha-mask",
   "manual": "Maya",
   "area": "Compositing",
   "topic": "Mask/alpha output and matte layers",
   "granularity": [
    "alpha",
    "matte opacity",
    "holdout"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Layer people dots over a background panel for collage-style comics.",
   "curiosities": [
    "visualDensity"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "remixer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Collage remix use.",
   "source": "knowledge"
  },
  {
   "id": "mocap-live-stream",
   "manual": "Maya",
   "area": "Devices",
   "topic": "Live character streaming from MotionBuilder (motion capture)",
   "granularity": [
    "live connection",
    "stream to HumanIK",
    "bake",
    "reconnect"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Body-strap sensors stream into the stage dots' speed and gesture size live.",
   "curiosities": [
    "gesture",
    "characterSpeed",
    "stillness"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When gesture goes whole body, cameraShake rises within 1 beat"
   ],
   "audience": [
    "performer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Body straps are named audience hardware.",
   "source": "https://download.autodesk.com/global/docs/maya2014/en_US/files/GUID-E1BB9406-F1BC-4784-B89C-E289D07A3C31.htm"
  },
  {
   "id": "device-midi",
   "manual": "Maya",
   "area": "Devices",
   "topic": "MIDI and input devices (MPxMidiInputDevice, device editor)",
   "granularity": [
    "MIDI device",
    "channels to attributes",
    "attach device"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Map Web MIDI pads and knobs to curiosities so a performer fires suites and moves values live.",
   "curiosities": [
    "pedal",
    "operatorFeel"
   ],
   "newCuriosities": [
    {
     "id": "liveInput",
     "label": "Live input",
     "values": "pad, knob, strap, none",
     "view": "Small dot on beats set live"
    }
   ],
   "suites": [
    {
     "label": "Pad scene",
     "set": {
      "liveInput": "pad"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "performer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Performer audience needs this.",
   "source": "knowledge"
  },
  {
   "id": "device-record",
   "manual": "Maya",
   "area": "Devices",
   "topic": "Record device input to keys",
   "granularity": [
    "record",
    "bake to keys",
    "step"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Record a live pass of pad and strap input into the strip as beats.",
   "curiosities": [
    "operatorFeel",
    "cameraShake"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "performer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Turns performance into a study.",
   "source": "knowledge"
  },
  {
   "id": "humanik-retarget",
   "manual": "Maya",
   "area": "Devices",
   "topic": "HumanIK retargeting (one motion onto another body)",
   "granularity": [
    "character definition",
    "source",
    "retarget",
    "control rig"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Map one performer's motion onto any character dot; same idea as Shelf strands moving between studies.",
   "curiosities": [
    "gesture",
    "posture"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "performer",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Retarget idea fits strand reuse.",
   "source": "knowledge"
  },
  {
   "id": "mocap-cleanup",
   "manual": "Maya",
   "area": "Devices",
   "topic": "Motion capture cleanup and filters",
   "granularity": [
    "euler filter",
    "smooth",
    "key reduction"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Curve cleanup is not a beat value.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Technical.",
   "source": "knowledge"
  },
  {
   "id": "ncloth-presets",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "nCloth and cloth presets",
   "granularity": [
    "silk",
    "chiffon",
    "t-shirt cotton",
    "thick knit",
    "heavy denim",
    "burlap",
    "thick leather",
    "chain mail",
    "rubber",
    "sheet metal",
    "water balloon",
    "honey",
    "lava"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Cloth weight is a curiosity: light silk floats and lags, heavy denim drops.",
   "curiosities": [
    "clothResponse",
    "overlap",
    "settleTime"
   ],
   "newCuriosities": [
    {
     "id": "clothWeight",
     "label": "Cloth weight",
     "values": "silk, cotton, denim, leather, chain mail",
     "view": "Lag of the cloth tail behind the body"
    }
   ],
   "suites": [
    {
     "label": "Silk in wind",
     "set": {
      "clothWeight": "silk",
      "windForce": "3",
      "settleTime": "long"
     }
    }
   ],
   "proximities": [
    "When a character stops, cloth settles within 2 to 4 beats depending on weight"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Costume weight changes how a move reads.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-10701398-2AE0-4A3A-8C9F-F26C4EB4D4CE.htm"
  },
  {
   "id": "bifrost-fluids",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "Bifrost and fluid effects (liquid, smoke, fire)",
   "granularity": [
    "liquid",
    "aero smoke",
    "fire",
    "foam",
    "splash",
    "viscosity"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Splash and fire light are curiosities, not a sim.",
   "curiosities": [
    "splash",
    "fireLight",
    "atmosphere",
    "element"
   ],
   "newCuriosities": [
    {
     "id": "viscosity",
     "label": "Thickness of liquid",
     "values": "water, oil, honey, lava",
     "view": "How long a splash takes to settle"
    }
   ],
   "suites": [],
   "proximities": [
    "When splash fires, settleTime grows with viscosity within 3 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Liquid feel is visible on screen.",
   "source": "knowledge"
  },
  {
   "id": "fields",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "Fields (gravity, wind, turbulence, vortex, drag, radial, uniform, newton, volume axis)",
   "granularity": [
    "air",
    "drag",
    "gravity",
    "newton",
    "radial",
    "turbulence",
    "uniform",
    "vortex",
    "volume axis"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Wind, turbulence and swirl are environmental values per beat.",
   "curiosities": [
    "windForce",
    "turbulence",
    "envMotion"
   ],
   "newCuriosities": [
    {
     "id": "swirl",
     "label": "Swirl",
     "values": "0 to 5",
     "view": "A spiral icon sized by value"
    }
   ],
   "suites": [
    {
     "label": "Storm front",
     "set": {
      "windForce": "5",
      "turbulence": "4",
      "clothResponse": "high"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Weather moods.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-F7BE47E6-76D5-47F0-8159-9F39FF0C4215.htm"
  },
  {
   "id": "nucleus",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "Nucleus solver",
   "granularity": [
    "gravity",
    "air density",
    "wind speed/direction",
    "substeps",
    "ground plane",
    "initial state",
    "interactive playback"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Gravity feel and wind already exist as curiosities.",
   "curiosities": [
    "gravityFeel",
    "windForce"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Kept as the source of gravity and wind values.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-F7BE47E6-76D5-47F0-8159-9F39FF0C4215.htm"
  },
  {
   "id": "paint-effects",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "Paint Effects (strokes, grass, trees)",
   "granularity": [
    "brush presets",
    "growth",
    "wind on strokes"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Growth of plants per beat.",
   "curiosities": [
    "growth"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Growth already exists.",
   "source": "knowledge"
  },
  {
   "id": "rigid-bodies",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "Rigid bodies and Bullet",
   "granularity": [
    "active/passive",
    "bounciness",
    "friction",
    "shatter"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Impacts, bounces and breaks per beat.",
   "curiosities": [
    "impacts",
    "breakage",
    "overshoot"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Collision beats.",
   "source": "knowledge"
  },
  {
   "id": "dynamics-cache",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "Simulation caching and initial state",
   "granularity": [
    "create cache",
    "initial state",
    "playback from cache"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not relevant.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "Pipeline internals.",
   "source": "knowledge"
  },
  {
   "id": "soft-bodies",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "Soft bodies and jiggle",
   "granularity": [
    "soft body goal weight",
    "jiggle deformer"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Jiggle as wobble value.",
   "curiosities": [
    "squash"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Covered by wobble.",
   "source": "knowledge"
  },
  {
   "id": "xgen-fur",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "XGen and fur grooming",
   "granularity": [
    "density",
    "length",
    "clumping",
    "frizz",
    "noise",
    "interactive groom"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Length, clump and frizz already exist as curiosities.",
   "curiosities": [
    "furLength",
    "clump",
    "frizz",
    "hairColor"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Existing Maya-sourced rows.",
   "source": "knowledge"
  },
  {
   "id": "ncloth-constraints",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "nCloth constraints and tearing",
   "granularity": [
    "transform",
    "point to surface",
    "tearable surface",
    "weld"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Tearing as a breakage event.",
   "curiosities": [
    "breakage"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Breakage already exists.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-E43621EC-5810-47FF-90FE-168ADFA63C4E.htm"
  },
  {
   "id": "nhair",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "nHair and dynamic curves",
   "granularity": [
    "hair system",
    "stiffness",
    "damp",
    "start curve attract",
    "follicles"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Hair lag and bounce map to existing fur rows.",
   "curiosities": [
    "furLag",
    "furResponse"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Hair follow-through is overlap.",
   "source": "knowledge"
  },
  {
   "id": "nparticles",
   "manual": "Maya",
   "area": "Dynamics",
   "topic": "nParticles (points, balls, liquids)",
   "granularity": [
    "emitters",
    "rate",
    "lifespan",
    "collisions",
    "particle types"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Emission amount per beat: sparks, dust, rain.",
   "curiosities": [
    "scatter",
    "element",
    "density"
   ],
   "newCuriosities": [
    {
     "id": "emitRate",
     "label": "Bits in the air",
     "values": "0 to 5",
     "view": "Dot spray density per beat"
    }
   ],
   "suites": [],
   "proximities": [
    "When an impact fires, emitRate spikes within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Debris and dust punctuate hits.",
   "source": "knowledge"
  },
  {
   "id": "light-animation",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Animated lights (flicker, switch on, sweep)",
   "granularity": [
    "keyed intensity",
    "flicker expression",
    "moving source"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Mark beats where light changes (a lamp turned on, lightning, passing car) and let a pad trigger it.",
   "curiosities": [
    "lightChange",
    "fireLight"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Lightning flash",
     "set": {
      "lightChange": "flash",
      "weather": "storm",
      "soundDensity": "high"
     }
    }
   ],
   "proximities": [
    "When lightChange flashes, a sound hit follows within 0 beats"
   ],
   "audience": [
    "performer",
    "intermediate",
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Live light cues suit performers.",
   "source": "knowledge"
  },
  {
   "id": "light-area",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Area light (window, softbox)",
   "granularity": [
    "size",
    "intensity",
    "normalize"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Size of the source sets softness; a window rectangle on the stage.",
   "curiosities": [
    "softness",
    "lightShape"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Window soft key",
     "set": {
      "softness": "soft",
      "keyDirection": "side",
      "lightShape": "window"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Soft vs hard light is basic.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "light-directional",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Directional light (sun or moon)",
   "granularity": [
    "direction",
    "intensity",
    "parallel shadows"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A sun arrow on the stage that sets key direction and time of day.",
   "curiosities": [
    "key",
    "timeOfDay",
    "lighting"
   ],
   "newCuriosities": [
    {
     "id": "keyDirection",
     "label": "Key light direction",
     "values": "front, 3/4, side, back, top, under",
     "view": "Clock arrow around the subject dot"
    }
   ],
   "suites": [
    {
     "label": "Golden hour",
     "set": {
      "timeOfDay": "dusk",
      "colorTemp": "warm",
      "keyDirection": "side",
      "rim": "on"
     }
    }
   ],
   "proximities": [
    "When keyDirection turns to under, emotion turns to fear within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Key direction is a major lighting value the user asked for.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "light-fog",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Light fog (visible beam)",
   "granularity": [
    "fog spread",
    "fog intensity",
    "fog type/radius"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draw a visible beam through haze; fires atmosphere.",
   "curiosities": [
    "atmosphere",
    "lightShape"
   ],
   "newCuriosities": [
    {
     "id": "visibleBeam",
     "label": "Visible beam",
     "values": "none, faint, strong",
     "view": "Beam drawn through the panel"
    }
   ],
   "suites": [
    {
     "label": "Cathedral haze",
     "set": {
      "visibleBeam": "strong",
      "atmosphere": "haze",
      "keyDirection": "top"
     }
    }
   ],
   "proximities": [
    "When visibleBeam fires, a reveal follows within 2 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "performer",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Haze beams are a strong look.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-62FA61B5-4A76-4525-83BC-550EEF245936.htm"
  },
  {
   "id": "light-intensity-color",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Light intensity and color",
   "granularity": [
    "intensity",
    "color",
    "temperature"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Key strength and warm/cool color per beat already exist; tint the panel.",
   "curiosities": [
    "key",
    "colorTemp"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When emotion turns sad, colorTemp cools within 2 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Already central.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "light-point",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Point light (bulb, practical)",
   "granularity": [
    "intensity",
    "decay rate",
    "color"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Place a practical lamp dot in the set; light falls off around it.",
   "curiosities": [
    "practicalInFrame",
    "lightCount"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Lamp-lit room",
     "set": {
      "practicalInFrame": "yes",
      "key": "low",
      "colorTemp": "warm"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Practicals are a common look.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "shadows-depth-raytrace",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Shadows: depth map vs raytraced, shadow color, softness",
   "granularity": [
    "depth map shadows",
    "raytrace shadows",
    "light radius",
    "shadow color",
    "shadow rays"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Draw hard or soft shadows from each light dot; shadow edge equals softness.",
   "curiosities": [
    "softness",
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "shadowShape",
     "label": "Shadows",
     "values": "none, soft, hard, long, cast pattern",
     "view": "Shadow shape drawn from each dot"
    }
   ],
   "suites": [
    {
     "label": "Hard noon",
     "set": {
      "shadowShape": "hard",
      "timeOfDay": "noon"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Shadows are visible story cues.",
   "source": "knowledge"
  },
  {
   "id": "light-spot",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Spot light (cone, penumbra, dropoff)",
   "granularity": [
    "cone angle",
    "penumbra angle",
    "dropoff",
    "barn doors"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A cone on the floor plan whose edge softness is the penumbra; a stage pool of light.",
   "curiosities": [
    "lightShape",
    "softness"
   ],
   "newCuriosities": [
    {
     "id": "lightPool",
     "label": "Pool of light",
     "values": "none, tight, wide",
     "view": "Circle drawn under the subject"
    }
   ],
   "suites": [
    {
     "label": "Stage spotlight",
     "set": {
      "lightPool": "tight",
      "key": "low",
      "contrast": "high"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Performers and theater-style scenes use pools.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "light-count-rig",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Three-point lighting setup (key, fill, rim)",
   "granularity": [
    "key",
    "fill",
    "back/rim",
    "ratio"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A starter suite for beginners; key-to-fill ratio as a number.",
   "curiosities": [
    "lightCount",
    "rim",
    "key"
   ],
   "newCuriosities": [
    {
     "id": "keyFillRatio",
     "label": "Key to fill ratio",
     "values": "1:1, 2:1, 4:1, 8:1",
     "view": "Two bars side by side per beat"
    }
   ],
   "suites": [
    {
     "label": "Three-point interview",
     "set": {
      "lightCount": "3",
      "rim": "on",
      "keyFillRatio": "2:1"
     }
    },
    {
     "label": "Noir",
     "set": {
      "keyFillRatio": "8:1",
      "contrast": "high",
      "lightShape": "slats"
     }
    }
   ],
   "proximities": [
    "When keyFillRatio goes above 4:1, emotion turns to tension within 2 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Most taught lighting concept.",
   "source": "knowledge"
  },
  {
   "id": "light-ambient",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Ambient light",
   "granularity": [
    "intensity",
    "ambient shade"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Fill level that lifts shadows; records as low-key versus flat.",
   "curiosities": [
    "key",
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "fillLevel",
     "label": "Fill level",
     "values": "0 to 5",
     "view": "Grey band height per beat"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Fill amount sets mood.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "barn-doors-decay-regions",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Barn doors and decay regions (spot)",
   "granularity": [
    "left/right/top/bottom barn door",
    "decay regions"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Records a light cut into slats or a hard square, covered by lightShape.",
   "curiosities": [
    "lightShape"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Shapes light like a set flag.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-62FA61B5-4A76-4525-83BC-550EEF245936.htm"
  },
  {
   "id": "light-decay",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Decay rate (falloff)",
   "granularity": [
    "no decay",
    "linear",
    "quadratic",
    "cubic"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "How fast light dies with distance; shows as dark edges of the room.",
   "curiosities": [
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "falloff",
     "label": "Light falloff",
     "values": "none, gentle, steep",
     "view": "Gradient on the floor plan"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Explains pools of dark.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "light-glow",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Light glow, halo, lens flare (optical FX)",
   "granularity": [
    "glow type",
    "halo type",
    "lens flare",
    "star points"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Flare and halo per beat already live under glow.",
   "curiosities": [
    "glow"
   ],
   "newCuriosities": [
    {
     "id": "lensFlare",
     "label": "Lens flare",
     "values": "none, small, big",
     "view": "Starburst icon over beats"
    }
   ],
   "suites": [],
   "proximities": [
    "When lensFlare fires, cameraMove crosses the sun within 0 beats"
   ],
   "audience": [
    "intermediate",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Flares are a signature some directors are known for.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-62FA61B5-4A76-4525-83BC-550EEF245936.htm"
  },
  {
   "id": "light-linking",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Light linking (light only some objects)",
   "granularity": [
    "light-centric",
    "object-centric",
    "break link"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Mark a light that hits only one person, like an eye light or a hero kicker.",
   "curiosities": [
    "skinLight",
    "rim"
   ],
   "newCuriosities": [
    {
     "id": "heroLight",
     "label": "Light only on the hero",
     "values": "yes, no",
     "view": "Glow ring on one dot"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Hero lighting is a readable choice.",
   "source": "knowledge"
  },
  {
   "id": "gobo-projection",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Projected image (spot light color map, gobo)",
   "granularity": [
    "color texture on spot",
    "window pattern",
    "leaf pattern"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Pattern cast by the light (blinds, leaves).",
   "curiosities": [
    "lightShape"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Venetian blinds",
     "set": {
      "lightShape": "slats",
      "contrast": "high",
      "key": "low"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Classic noir signature.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "light-volume",
   "manual": "Maya",
   "area": "Lighting",
   "topic": "Volume light (bounded region, negative light)",
   "granularity": [
    "shape",
    "color ramp falloff",
    "inward/down axis",
    "emit negative"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Negative light equals flagging; record areas deliberately darkened.",
   "curiosities": [
    "key",
    "valueKey"
   ],
   "newCuriosities": [
    {
     "id": "negativeFill",
     "label": "Negative fill",
     "values": "none, one side, both",
     "view": "Dark wedge beside the subject"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Negative fill is a cinematographer term.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3B4D131E-D001-4415-8BF9-250612C3A81D.htm"
  },
  {
   "id": "nurbs",
   "manual": "Maya",
   "area": "Modeling",
   "topic": "NURBS curves and surfaces",
   "granularity": [
    "CV curve",
    "EP curve",
    "loft",
    "revolve",
    "curve degree"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Only curves matter: a drawn CV curve is how a camera or character path is shaped on the floor plan.",
   "curiosities": [
    "characterPath",
    "arcs"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Path drawing uses the same curve idea; surfaces skipped.",
   "source": "knowledge"
  },
  {
   "id": "modeling-scale-proportion",
   "manual": "Maya",
   "area": "Modeling",
   "topic": "Object scale and proportion",
   "granularity": [
    "real-world units",
    "scale relative to a person"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Scale is a curiosity: how big a thing reads against a person in frame.",
   "curiosities": [
    "scale"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Scale shifts are a storytelling choice (giant/tiny).",
   "source": "knowledge"
  },
  {
   "id": "poly-primitives",
   "manual": "Maya",
   "area": "Modeling",
   "topic": "Polygon primitives and basic modeling",
   "granularity": [
    "cube, sphere, cylinder, plane",
    "extrude",
    "bevel",
    "bridge",
    "multi-cut"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not built; the app uses dots and icons, not meshes.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "Mesh building is not a filmmaker measure.",
   "source": "knowledge"
  },
  {
   "id": "retopo-cleanup",
   "manual": "Maya",
   "area": "Modeling",
   "topic": "Retopology, cleanup and mesh display",
   "granularity": [
    "quad draw",
    "cleanup",
    "normals",
    "backface culling"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not relevant.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "Technical modeling.",
   "source": "knowledge"
  },
  {
   "id": "sculpting",
   "manual": "Maya",
   "area": "Modeling",
   "topic": "Sculpting tools",
   "granularity": [
    "grab",
    "smooth",
    "relax",
    "freeze",
    "sculpt layers"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not built.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "Asset creation only.",
   "source": "knowledge"
  },
  {
   "id": "smooth-preview",
   "manual": "Maya",
   "area": "Modeling",
   "topic": "Smooth mesh preview and subdivision",
   "granularity": [
    "proxy vs smooth",
    "divisions",
    "crease"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not relevant to beats.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "Modeling internals.",
   "source": "knowledge"
  },
  {
   "id": "uv-mapping",
   "manual": "Maya",
   "area": "Modeling",
   "topic": "UV mapping and unwrapping",
   "granularity": [
    "UV editor",
    "planar/cylindrical/automatic",
    "unfold",
    "layout"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not relevant.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "Texture layout, no on-screen meaning per beat.",
   "source": "knowledge"
  },
  {
   "id": "mash-audio",
   "manual": "Maya",
   "area": "Motion graphics",
   "topic": "MASH Audio node",
   "granularity": [
    "drive by audio",
    "frequency bands",
    "strength"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Drive a curiosity from the loaded audio's loudness or band, the browser can do this with WebAudio.",
   "curiosities": [
    "volume"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When volume spikes, repeatInFrame jumps within 0 beats"
   ],
   "audience": [
    "remixer",
    "performer",
    "intermediate"
   ],
   "keep": "keep",
   "reason": "Audio-reactive visuals are the performer's core.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D4FECFDC-F91A-4BDC-A1B0-A24EB087B2DD.htm"
  },
  {
   "id": "mash-delay-time",
   "manual": "Maya",
   "area": "Motion graphics",
   "topic": "MASH Delay and Time (ripple offsets)",
   "granularity": [
    "delay per copy",
    "time offset",
    "wave through copies"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "A ripple through a row of copies is a domino curiosity.",
   "curiosities": [
    "callResponse"
   ],
   "newCuriosities": [
    {
     "id": "ripple",
     "label": "Ripple across copies",
     "values": "none, left to right, center out, random",
     "view": "Arrows on the strip"
    }
   ],
   "suites": [],
   "proximities": [
    "When a hit lands, ripple follows within 1 beat"
   ],
   "audience": [
    "intermediate",
    "remixer",
    "performer"
   ],
   "keep": "keep",
   "reason": "Ripples on the beat are a live-visual staple.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D4FECFDC-F91A-4BDC-A1B0-A24EB087B2DD.htm"
  },
  {
   "id": "mash-distribute",
   "manual": "Maya",
   "area": "Motion graphics",
   "topic": "MASH Distribute",
   "granularity": [
    "linear",
    "radial",
    "spherical",
    "grid",
    "mesh scatter",
    "point count",
    "spacing"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "How many copies fill a frame and in what pattern is a curiosity.",
   "curiosities": [
    "repeatInFrame",
    "visualDensity"
   ],
   "newCuriosities": [
    {
     "id": "arrayShape",
     "label": "Repeat pattern",
     "values": "line, ring, grid, scatter",
     "view": "Small icon of the pattern per beat"
    }
   ],
   "suites": [
    {
     "label": "Busby grid",
     "set": {
      "arrayShape": "grid",
      "repeatInFrame": "high",
      "dutch": "0"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Repetition patterns are a music-video staple.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-B718F1FE-8688-4A57-95DD-5B22C4D40F1A.htm"
  },
  {
   "id": "type-tool",
   "manual": "Maya",
   "area": "Motion graphics",
   "topic": "Type tool and animated text",
   "granularity": [
    "font, extrude, bevel",
    "animate by character/word/line",
    "delay frames",
    "reverse order",
    "randomize delay",
    "generators: frame number, scene time"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Title cards and captions that type on per letter, word or line with delay and order.",
   "curiosities": [
    "textDensity",
    "soundLettering"
   ],
   "newCuriosities": [
    {
     "id": "typeOn",
     "label": "Text arrives",
     "values": "all at once, by letter, by word, by line",
     "view": "Letters appearing along the strip"
    }
   ],
   "suites": [],
   "proximities": [
    "When soundLettering fires, typeOn by letter follows within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Titles, captions, comic SFX lettering.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-92112B70-161B-4D89-A1E5-BC3D58274EFB.htm"
  },
  {
   "id": "mash-other",
   "manual": "Maya",
   "area": "Motion graphics",
   "topic": "MASH Curve, Flight, Spring, Orient, World, Visibility, Color",
   "granularity": [
    "curve follow",
    "flocking",
    "spring",
    "orient to travel",
    "world clusters",
    "visibility",
    "color per copy"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Flocking and spring become crowd and overshoot values.",
   "curiosities": [
    "overshoot",
    "peopleCount"
   ],
   "newCuriosities": [
    {
     "id": "flocking",
     "label": "Moves as a flock",
     "values": "0 to 5",
     "view": "How tightly the dots move together"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Crowd cohesion is a staging value.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D4FECFDC-F91A-4BDC-A1B0-A24EB087B2DD.htm"
  },
  {
   "id": "mash-signal",
   "manual": "Maya",
   "area": "Motion graphics",
   "topic": "MASH Signal and Random",
   "granularity": [
    "noise",
    "sine",
    "random per copy",
    "seed",
    "strength"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Wiggle amount across copies.",
   "curiosities": [
    "turbulence"
   ],
   "newCuriosities": [
    {
     "id": "copyJitter",
     "label": "Copies out of step",
     "values": "0 to 5",
     "view": "Spread of dots around the line"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Order vs chaos is measurable.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D4FECFDC-F91A-4BDC-A1B0-A24EB087B2DD.htm"
  },
  {
   "id": "render-resolution",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Image size, resolution presets, pixel aspect",
   "granularity": [
    "HD 1080",
    "4K",
    "width/height",
    "device aspect",
    "pixel aspect"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Choose canvas size and frame shape for export; the shape is the aspect curiosity.",
   "curiosities": [
    "aspect"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Needed for any export.",
   "source": "knowledge"
  },
  {
   "id": "render-layers",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Render Setup layers, collections, overrides",
   "granularity": [
    "render layer",
    "collection",
    "absolute/relative override",
    "AOV override"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "A Suite is like a render layer override: a named set of values applied over the base; the app can show this parallel to students.",
   "curiosities": [
    "renderStyle"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Teaches the suite idea through a known tool.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-B1BBD05B-0172-4626-A85C-35943A67E8BE.htm"
  },
  {
   "id": "toon-profile-lines",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Toon outlines: profile lines",
   "granularity": [
    "profile line width",
    "line width map",
    "depth-based width"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Outline the silhouette; line weight per beat already exists.",
   "curiosities": [
    "lineWeight"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When shotSize goes close, lineWeight thickens within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Outline weight is a comic signature.",
   "source": "https://download.autodesk.com/us/maya/2009help/files/Toon_shading_Types_of_toon_lines.htm"
  },
  {
   "id": "toon-fill",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Toon shading: fill (solid, light angle, shaded brightness)",
   "granularity": [
    "solid",
    "light angle",
    "shaded brightness 2/3 tone",
    "ramp"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draw the stage in flat cel bands with 2 or 3 tones; fits comic and storyboard output.",
   "curiosities": [
    "renderStyle",
    "valueKey"
   ],
   "newCuriosities": [
    {
     "id": "toneSteps",
     "label": "Shading steps",
     "values": "1, 2, 3, smooth",
     "view": "Number of bands in the subject dot"
    }
   ],
   "suites": [
    {
     "label": "Cel look",
     "set": {
      "renderStyle": "toon",
      "toneSteps": "2",
      "lineWeight": "bold"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Comic and animation users want cel look.",
   "source": "https://download.autodesk.com/us/maya/2009help/files/Toon_shading_Types_of_toon_lines.htm"
  },
  {
   "id": "render-aovs",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "AOVs / render passes (beauty, diffuse, specular, depth, mask)",
   "granularity": [
    "beauty",
    "diffuse",
    "specular",
    "Z depth",
    "ID/mask"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Show a panel as passes: color, depth (dots by distance), and person masks, as teaching views.",
   "curiosities": [
    "depthOfField"
   ],
   "newCuriosities": [
    {
     "id": "passView",
     "label": "Pass shown",
     "values": "beauty, depth, light only, mask",
     "view": "Toggle that redraws the panel"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Depth view helps blocking study.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-B1BBD05B-0172-4626-A85C-35943A67E8BE.htm"
  },
  {
   "id": "render-batch",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Batch render",
   "granularity": [
    "batch render",
    "render sequence",
    "command line"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Background rendering is not a feature the app needs.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Pipeline only.",
   "source": "knowledge"
  },
  {
   "id": "render-frame-range",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Frame range, by-frame, file name padding",
   "granularity": [
    "start/end frame",
    "by frame",
    "renumber"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Batch file naming has no story use in the app.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Pipeline only.",
   "source": "knowledge"
  },
  {
   "id": "render-image-formats",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Image formats (PNG, EXR, TIFF, movie)",
   "granularity": [
    "png",
    "jpg",
    "exr",
    "tif",
    "avi/mov"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Export panels as PNG and the strip as a video; EXR and others skipped.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Export only PNG/WebM in browser.",
   "source": "knowledge"
  },
  {
   "id": "render-software-vs-path",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Renderer choice (Maya Software, Hardware, Arnold)",
   "granularity": [
    "Maya Software",
    "Maya Hardware 2.0",
    "Arnold"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Renderer engines are out of scope for a beat model.",
   "curiosities": [
    "renderStyle"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Engine choice is not a story value.",
   "source": "knowledge"
  },
  {
   "id": "toon-line-modifiers",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Toon line modifiers and line color/opacity",
   "granularity": [
    "line modifier",
    "width scale",
    "line color",
    "line opacity"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Lines that thin or vanish in some zones, like a fade on distance.",
   "curiosities": [
    "lineWeight"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Expressive line variation.",
   "source": "knowledge"
  },
  {
   "id": "toon-crease-border-intersection",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Toon outlines: crease, border and intersection lines",
   "granularity": [
    "crease angle min/max",
    "border lines",
    "intersection lines"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "How much interior detail is inked.",
   "curiosities": [
    "lineWeight",
    "visualDensity"
   ],
   "newCuriosities": [
    {
     "id": "inkDetail",
     "label": "Ink detail",
     "values": "outline only, some creases, full detail",
     "view": "Band of line density"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Line detail varies by style and mood.",
   "source": "https://download.autodesk.com/us/maya/2009help/files/Toon_shading_Types_of_toon_lines.htm"
  },
  {
   "id": "render-viewport2",
   "manual": "Maya",
   "area": "Rendering",
   "topic": "Viewport 2.0 / Hardware 2.0 (real-time look)",
   "granularity": [
    "ambient occlusion",
    "screen-space AO",
    "antialiasing",
    "viewport motion blur",
    "depth of field in viewport"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "The board is a real-time viewport; borrow its blur and DOF preview ideas.",
   "curiosities": [
    "depthOfField",
    "motionBlur"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Live preview is what a browser app can do.",
   "source": "knowledge"
  },
  {
   "id": "blend-shapes",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "Blend shapes and Shape Editor",
   "granularity": [
    "targets",
    "weights 0 to 1",
    "in-betweens",
    "combination targets",
    "groups",
    "keyed weights"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Facial expression strength per beat already maps to blend weights; mouth shapes too.",
   "curiosities": [
    "faceIntensity",
    "lipSync"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Big take",
     "set": {
      "faceIntensity": "5",
      "anticipation": "big",
      "stillness": "0"
     }
    }
   ],
   "proximities": [
    "When faceIntensity jumps by 3, a cut to close follows within 1 beat"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student",
    "performer"
   ],
   "keep": "keep",
   "reason": "Facial weights are a core acting value; pad performers can drive weights live.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-3C92402C-B24E-4874-AC8D-EADF976A19DC.htm"
  },
  {
   "id": "driven-keys",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "Set Driven Key",
   "granularity": [
    "driver attribute",
    "driven attribute",
    "value pairs",
    "curve between pairs"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "This is the app's mapping engine: one curiosity drives another (MIDI pad or strap value drives shot size, etc.).",
   "curiosities": [
    "shotSize",
    "cameraShake"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When volume rises, cameraShake rises within 0 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "performer"
   ],
   "keep": "keep",
   "reason": "Driver to driven is exactly how a live performer's controller maps to curiosities.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-D2B1C7EF-F177-4B0E-9E41-B479CFF2AFD4.htm"
  },
  {
   "id": "constraints",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "Constraints (point, orient, parent, aim)",
   "granularity": [
    "point",
    "orient",
    "parent",
    "aim",
    "pole vector",
    "weight blend",
    "switch over time"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "An object can be parented to a character for a span (a cup carried), and an aim makes heads or cameras look at something.",
   "curiosities": [
    "objectPath",
    "eyeline",
    "moveFollows"
   ],
   "newCuriosities": [
    {
     "id": "carriedBy",
     "label": "Carried by",
     "values": "nobody, a person",
     "view": "A line tying the object dot to a character dot"
    }
   ],
   "suites": [],
   "proximities": [
    "When carriedBy switches from nobody to a person, objectPath becomes lift within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Handing props off is a staple staging beat.",
   "source": "knowledge"
  },
  {
   "id": "rig-controls",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "Control curves and character pickers",
   "granularity": [
    "NURBS controls",
    "attributes on controls",
    "channel box",
    "lock/hide"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "The live board controls already act as a rig's channel box; group them per character.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "UI idea only.",
   "source": "knowledge"
  },
  {
   "id": "humanik",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "HumanIK full-body rig",
   "granularity": [
    "character definition",
    "control rig",
    "full body vs body part keying",
    "pinning translate/rotate",
    "retargeting",
    "mocap on the fly"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Retargeting idea is used: a body-strap MIDI performer drives a whole stick figure from a few points.",
   "curiosities": [
    "gesture",
    "posture"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "performer"
   ],
   "keep": "keep",
   "reason": "Performers with body straps map onto a few effectors like HumanIK.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-19B154DE-58F2-46AF-B2EF-7D00B2E46476.htm"
  },
  {
   "id": "ik-fk",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "IK and FK (posing limbs)",
   "granularity": [
    "FK rotate chain",
    "IK handle",
    "rotate plane solver",
    "spline IK",
    "IK/FK switch",
    "pole vector"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Not a tool; a curiosity marks whether a limb is planted (hand on table) or swinging free.",
   "curiosities": [
    "touch"
   ],
   "newCuriosities": [
    {
     "id": "limbPlanted",
     "label": "Planted or free",
     "values": "planted, free, switches",
     "view": "A pin icon on the hand or foot per beat"
    }
   ],
   "suites": [],
   "proximities": [
    "When limbPlanted switches to planted, an impact or a touch follows within 0 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Planted contact is a readable acting beat.",
   "source": "knowledge"
  },
  {
   "id": "deformers",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "Nonlinear and other deformers",
   "granularity": [
    "bend",
    "flare",
    "sine",
    "squash",
    "twist",
    "wave",
    "lattice",
    "wrap",
    "jiggle",
    "wire"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Squash and jiggle become values on a dot; bend and wave as a cartoon wobble on an object.",
   "curiosities": [
    "squash",
    "overlap"
   ],
   "newCuriosities": [
    {
     "id": "wobble",
     "label": "Jelly wobble",
     "values": "0 to 5",
     "view": "Wave amplitude drawn on the object outline"
    }
   ],
   "suites": [],
   "proximities": [
    "When an impact fires, wobble follows within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Squash/jiggle are cartoon staples.",
   "source": "knowledge"
  },
  {
   "id": "skeleton-joints",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "Skeletons and joints",
   "granularity": [
    "joint tool",
    "joint orient",
    "mirror joints",
    "hierarchy"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Characters stay dots, but a simple stick figure (head, hands, hips) lets leadPart and gesture show.",
   "curiosities": [
    "leadPart",
    "gesture"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "A minimal stick body makes body curiosities visible.",
   "source": "knowledge"
  },
  {
   "id": "skinning",
   "manual": "Maya",
   "area": "Rigging",
   "topic": "Skinning and paint weights",
   "granularity": [
    "smooth bind",
    "rigid bind",
    "paint skin weights",
    "dual quaternion"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not relevant.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "skip",
   "reason": "Mesh-to-bone binding has no beat value.",
   "source": "knowledge"
  },
  {
   "id": "mel-python",
   "manual": "Maya",
   "area": "Scripting",
   "topic": "MEL and Python scripting",
   "granularity": [
    "script editor",
    "echo all commands",
    "shelf buttons",
    "Python maya.cmds",
    "PyMEL"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "The app's JSON study import/export is its scripting; a shelf of saved actions is enough.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Advanced users batch-edit studies.",
   "source": "knowledge"
  },
  {
   "id": "scripted-anim-nodes",
   "manual": "Maya",
   "area": "Scripting",
   "topic": "Node Editor and connections",
   "granularity": [
    "node editor",
    "connect attributes",
    "utility nodes"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Show which curiosity drives which as a small graph.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Visualizes proximities and drivers.",
   "source": "knowledge"
  },
  {
   "id": "shelves-hotkeys",
   "manual": "Maya",
   "area": "Scripting",
   "topic": "Shelves, marking menus and hotkeys",
   "granularity": [
    "custom shelf",
    "marking menu",
    "hotkey editor"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Hotkeys and pad mapping for board controls, for live use.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "performer",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Performers need key/pad mappings.",
   "source": "knowledge"
  },
  {
   "id": "color-management",
   "manual": "Maya",
   "area": "Shading",
   "topic": "Color management: rendering space and view transform (sRGB, ACES, log)",
   "granularity": [
    "rendering space",
    "view transform",
    "sRGB gamma",
    "ACES RRT",
    "LUT"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Apply a look (neutral, ACES-like filmic, log flat) to the whole board so grading is a per-scene curiosity.",
   "curiosities": [
    "saturation",
    "contrast",
    "palette"
   ],
   "newCuriosities": [
    {
     "id": "gradeLook",
     "label": "Grade look",
     "values": "neutral, filmic, flat log, teal-orange, bleach bypass",
     "view": "A colored band under the strip"
    }
   ],
   "suites": [
    {
     "label": "Teal and orange",
     "set": {
      "gradeLook": "teal-orange",
      "saturation": "high",
      "colorTemp": "warm skin"
     }
    }
   ],
   "proximities": [
    "When the story turns to memory, gradeLook shifts within 1 beat"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Grade is a major remix signature.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-A9CA3572-FAFA-440D-92EB-37566A2DFE0B.htm"
  },
  {
   "id": "textures",
   "manual": "Maya",
   "area": "Shading",
   "topic": "2D/3D textures and file textures",
   "granularity": [
    "file texture",
    "noise",
    "ramp",
    "checker"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Texturing detail does not map to beats.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Asset work.",
   "source": "knowledge"
  },
  {
   "id": "hypershade",
   "manual": "Maya",
   "area": "Shading",
   "topic": "Hypershade (material network editor)",
   "granularity": [
    "materials",
    "utilities",
    "graph"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Node graph editing is out of scope.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Tool UI, not a beat value.",
   "source": "knowledge"
  },
  {
   "id": "ramp-shader",
   "manual": "Maya",
   "area": "Shading",
   "topic": "Ramp shader (color by light angle)",
   "granularity": [
    "color ramp",
    "incandescence ramp",
    "specular ramp"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Ties to toon tone steps and stylized color.",
   "curiosities": [
    "palette",
    "renderStyle"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Stylized color lever.",
   "source": "knowledge"
  },
  {
   "id": "subsurface-skin",
   "manual": "Maya",
   "area": "Shading",
   "topic": "Subsurface (skin) shading",
   "granularity": [
    "subsurface weight",
    "radius"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Skin glow already lives in skinLight.",
   "curiosities": [
    "skinLight"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Maps to existing value.",
   "source": "knowledge"
  },
  {
   "id": "materials-surface",
   "manual": "Maya",
   "area": "Shading",
   "topic": "Surface materials (Lambert, Blinn, Phong, Standard Surface)",
   "granularity": [
    "diffuse",
    "specular",
    "roughness",
    "metalness"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Matte versus glossy surfaces, already in gloss.",
   "curiosities": [
    "gloss",
    "wetness"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Gloss is readable on screen.",
   "source": "knowledge"
  },
  {
   "id": "time-fps",
   "manual": "Maya",
   "area": "Time",
   "topic": "Frame rate (working units: 24 film, 25 PAL, 29.97, 30, 48, 60)",
   "granularity": [
    "24",
    "25",
    "29.97",
    "30",
    "48",
    "60",
    "12 (on twos)"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Project frame rate converts beats to seconds and sets animation on ones or twos.",
   "curiosities": [
    "stepping",
    "shotDuration"
   ],
   "newCuriosities": [
    {
     "id": "frameRate",
     "label": "Frame rate",
     "values": "12, 24, 25, 30, 48, 60",
     "view": "Label on the strip head"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Needed to turn beats into time.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-4D653DC9-57AA-4D8B-987A-5B7A9735CAF0.htm"
  },
  {
   "id": "time-playback-speed",
   "manual": "Maya",
   "area": "Time",
   "topic": "Playback speed and looping (real-time, half, every frame)",
   "granularity": [
    "real-time",
    "0.5x",
    "2x",
    "loop/once/oscillate"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Play the strip at chosen speed and loop a span for practice or live sets.",
   "curiosities": [
    "speedRamp"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "performer",
    "beginner",
    "student"
   ],
   "keep": "keep",
   "reason": "Live loops suit performers.",
   "source": "knowledge"
  },
  {
   "id": "time-warp-2",
   "manual": "Maya",
   "area": "Time",
   "topic": "Time warp (retime animation curve)",
   "granularity": [
    "time warp curve",
    "scene time remap"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Slow motion and ramps live in speedRamp.",
   "curiosities": [
    "speedRamp"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Slow-mo hero moment",
     "set": {
      "speedRamp": "0.25x",
      "musicCue": "swell",
      "cameraMove": "orbit"
     }
    }
   ],
   "proximities": [
    "When speedRamp drops under 0.5x, silence or musicCue swell follows within 1 beat"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Speed ramps are an action signature.",
   "source": "knowledge"
  },
  {
   "id": "time-timecode",
   "manual": "Maya",
   "area": "Time",
   "topic": "Timecode display and drop frame",
   "granularity": [
    "frames",
    "timecode",
    "drop frame 29.97 df"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "Show beat time as HH:MM:SS:FF so studies match an editor's timeline.",
   "curiosities": [
    "shotDuration"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "remixer",
    "student",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Lines up studies with real cuts.",
   "source": "https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-4D653DC9-57AA-4D8B-987A-5B7A9735CAF0.htm"
  },
  {
   "id": "arnold-aov-beauty-components",
   "manual": "Arnold for Maya",
   "area": "AOVs",
   "topic": "Beauty and component AOVs",
   "granularity": [
    "RGBA",
    "direct/indirect",
    "diffuse",
    "specular",
    "coat",
    "transmission",
    "emission",
    "sss",
    "Z",
    "N",
    "P",
    "motion vector",
    "shadow matte",
    "albedo"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "A breakdown view that splits a panel's light into direct, bounce and highlight layers.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Seeing light layers teaches lighting.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-output-aovs/arnold_user_guide_ac_output_aovs_ac_aovs_html.html"
  },
  {
   "id": "arnold-cryptomatte",
   "manual": "Arnold for Maya",
   "area": "AOVs",
   "topic": "Cryptomatte",
   "granularity": [
    "object, material, asset IDs"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Compositing mask tool.",
   "source": "knowledge"
  },
  {
   "id": "arnold-depth-aov",
   "manual": "Arnold for Maya",
   "area": "AOVs",
   "topic": "Depth (Z) AOV",
   "granularity": [
    "distance from camera"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Feeds the depth fade and focus views.",
   "curiosities": [
    "depthOfField"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Supports depth-based looks.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-output-aovs/arnold_user_guide_ac_output_aovs_ac_aovs_html.html"
  },
  {
   "id": "arnold-light-groups-lpe",
   "manual": "Arnold for Maya",
   "area": "AOVs",
   "topic": "Light groups and light path expressions",
   "granularity": [
    "per-light AOV",
    "LPE syntax"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Ties to soloing lights in the preview; LPE syntax is not shown.",
   "curiosities": [
    "lightCount"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Relighting in comp is advanced but useful to see.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html ; https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-output-aovs/arnold_user_guide_ac_output_aovs_ac_aovs_html.html"
  },
  {
   "id": "arnold-camera-exposure",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Camera exposure",
   "granularity": [
    "exposure in stops"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A global stops slider on the preview that brightens or darkens every light.",
   "curiosities": [
    "valueKey"
   ],
   "newCuriosities": [
    {
     "id": "exposure",
     "label": "Camera exposure",
     "values": "-3 to +3 stops",
     "view": "A line over the strip"
    }
   ],
   "suites": [],
   "proximities": [
    "When the hero walks outside, exposure drops within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Exposure shifts sell bright/dark transitions.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-camera-dof",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Depth of field",
   "granularity": [
    "enable DOF",
    "focus distance",
    "aperture size"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Blurs dots off the focus plane in the panel; focus distance can be keyed per beat.",
   "curiosities": [
    "depthOfField",
    "rackFocus"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Shallow portrait",
     "set": {
      "depthOfField": "1.4",
      "shotSize": "close",
      "lensLength": "85"
     }
    }
   ],
   "proximities": [
    "When a line passes to the listener, focus pull follows within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Focus is a primary storytelling tool.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-perspective-camera",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Perspective camera",
   "granularity": [
    "focal length",
    "film back",
    "near/far clip"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Already modeled by lens length and shot size.",
   "curiosities": [
    "lensLength",
    "shotSize"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Base camera; covered by existing ids.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-shutter-curve",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Shutter angle and shutter curve",
   "granularity": [
    "shutter start/end",
    "shutter type box/triangle/curve"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Extends motion blur with streak shape: crisp end, soft tail.",
   "curiosities": [
    "motionBlur"
   ],
   "newCuriosities": [
    {
     "id": "blurTrail",
     "label": "Blur trail shape",
     "values": "even, fading tail, staccato",
     "view": "Streak drawn behind moving dots"
    }
   ],
   "suites": [
    {
     "label": "Action staccato",
     "set": {
      "motionBlur": "45",
      "blurTrail": "staccato",
      "cutRate": "high"
     }
    }
   ],
   "proximities": [
    "When the fight starts, shutter narrows within 1 beat"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Narrow shutter equals jittery action; known since Saving Private Ryan.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-aperture-blades",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Aperture blades and bokeh shape",
   "granularity": [
    "blade count (0 = circle)",
    "blade curvature",
    "rotation",
    "aspect ratio (anamorphic)"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as bokeh shape on background lights.",
   "curiosities": [
    "depthOfField"
   ],
   "newCuriosities": [
    {
     "id": "bokehShape",
     "label": "Out-of-focus shape",
     "values": "round, hexagon, oval",
     "view": "A small shape icon on background points"
    }
   ],
   "suites": [
    {
     "label": "Anamorphic night",
     "set": {
      "bokehShape": "oval",
      "aspect": "2.39",
      "timeOfDay": "night"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Oval bokeh is a signature anamorphic tell.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-cylindrical-camera",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Cylindrical camera",
   "granularity": [
    "horizontal and vertical FOV",
    "panoramic"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Folded into projection value panoramic.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Rare in narrative work.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-fisheye-camera",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Fisheye camera",
   "granularity": [
    "field of view",
    "circular or full frame"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Uses the projection curiosity value fisheye.",
   "curiosities": [
    "lensLength"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Skate video",
     "set": {
      "projection": "fisheye",
      "cameraCarry": "handheld",
      "moveSpeed": "5"
     }
    }
   ],
   "proximities": [
    "When projection goes fisheye, carry goes handheld within 0 beats"
   ],
   "audience": [
    "intermediate",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Music videos and skate films.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-orthographic-camera",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Orthographic camera",
   "granularity": [
    "no perspective",
    "flat side view"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as a flat, diagram-like view style common in games and title cards.",
   "curiosities": [
    "renderStyle"
   ],
   "newCuriosities": [
    {
     "id": "projection",
     "label": "Projection",
     "values": "perspective, flat, fisheye, 360, panoramic",
     "view": "A tag under each panel"
    }
   ],
   "suites": [
    {
     "label": "Dollhouse cutaway",
     "set": {
      "projection": "flat",
      "angleHeight": "eye",
      "shotSize": "wide"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Wes-Anderson-like flat staging and side-scrollers.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-rolling-shutter",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Rolling shutter",
   "granularity": [
    "top/bottom/left/right",
    "duration 0 to 1"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as wobble/skew on fast pans, a phone-video tell.",
   "curiosities": [
    "cameraCarry"
   ],
   "newCuriosities": [
    {
     "id": "skew",
     "label": "Jello skew",
     "values": "none, slight, strong",
     "view": "Vertical lines lean in the panel"
    }
   ],
   "suites": [],
   "proximities": [
    "When a whip pan happens, skew follows within 0 beats"
   ],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Found-footage realism.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-spherical-vr-camera",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "Spherical and VR cameras",
   "granularity": [
    "360 equirect",
    "stereo eye separation"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled beyond projection value 360.",
   "curiosities": [
    "aspect"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "VR output is outside the strip-based app.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-uv-remap-filtermap",
   "manual": "Arnold for Maya",
   "area": "Cameras",
   "topic": "UV remap, filtermap and vignetting",
   "granularity": [
    "lens distortion map",
    "filtermap vignette"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as vignette strength and lens warp.",
   "curiosities": [
    "composition"
   ],
   "newCuriosities": [
    {
     "id": "vignette",
     "label": "Dark corners",
     "values": "0 to 5",
     "view": "Darkened panel corners"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Vignettes steer the eye; cheap to draw.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-barndoor-filter",
   "manual": "Arnold for Maya",
   "area": "Light filters",
   "topic": "Barndoor",
   "granularity": [
    "top/bottom/left/right flaps",
    "edge softness"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Four draggable flaps clip a preview light into a slash or box.",
   "curiosities": [
    "lightShape"
   ],
   "newCuriosities": [
    {
     "id": "lightCut",
     "label": "Light cut",
     "values": "open, slash, box, eye strip",
     "view": "The clipped beam shape on the stage"
    }
   ],
   "suites": [
    {
     "label": "Eye light strip",
     "set": {
      "lightCut": "eye strip",
      "valueKey": "low key"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student",
    "performer"
   ],
   "keep": "keep",
   "reason": "Shaping light into a slash is classic thriller lighting.",
   "source": "https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/arnold_for_maya_shading_am_Using_Barndoor_Filter_html.html ; https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/arnold_user_guide_ac_lights_ac_light_filters_html.html"
  },
  {
   "id": "arnold-gobo-filter",
   "manual": "Arnold for Maya",
   "area": "Light filters",
   "topic": "Gobo",
   "granularity": [
    "slide map",
    "density",
    "filter mode",
    "scale",
    "rotate",
    "offset"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Casts a pattern (blinds, leaves, window) through a preview light; pattern can drift over beats.",
   "curiosities": [
    "lightShape",
    "atmosphere"
   ],
   "newCuriosities": [
    {
     "id": "patternMotion",
     "label": "Pattern moves",
     "values": "still, drifting, flicker",
     "view": "The pattern in the panel slides or flickers"
    }
   ],
   "suites": [
    {
     "label": "Venetian noir",
     "set": {
      "lightShape": "blinds",
      "valueKey": "low key",
      "contrast": "5"
     }
    },
    {
     "label": "Forest dapple",
     "set": {
      "lightShape": "leaves",
      "patternMotion": "drifting",
      "timeOfDay": "day"
     }
    }
   ],
   "proximities": [
    "When a character crosses the window, blinds pattern falls across them within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Patterned light is the cheapest strong look and already a curiosity.",
   "source": "https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/getting-started/am-Hyperspace_Madness_Production/arnold_for_maya_getting_started_am_Hyperspace_Effect_using_a_Gobo_and_Atmosphere_Volume_html.html ; https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/arnold_user_guide_ac_lights_ac_light_filters_html.html"
  },
  {
   "id": "arnold-light-blocker",
   "manual": "Arnold for Maya",
   "area": "Light filters",
   "topic": "Light blocker",
   "granularity": [
    "box",
    "cylinder",
    "sphere",
    "plane",
    "density -1 to 1",
    "ramp",
    "height edge",
    "width edge",
    "roundness"
   ],
   "weight": "minor",
   "fit": "build",
   "appDoes": "A dark card drawn in the preview that cuts or adds light in an area.",
   "curiosities": [
    "lightShape",
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "flag",
     "label": "Flagged off",
     "values": "none, wall, floor, face",
     "view": "A gray shape over the area kept dark"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Flagging light off walls is how pros add contrast.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/ac-light-filters/arnold_user_guide_ac_light_filters_ac_light_blocker_html.html"
  },
  {
   "id": "arnold-light-decay",
   "manual": "Arnold for Maya",
   "area": "Light filters",
   "topic": "Light decay",
   "granularity": [
    "near start/end",
    "far start/end",
    "attenuation"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as how fast light falls off with distance.",
   "curiosities": [
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "falloff",
     "label": "Falloff",
     "values": "none, gentle, steep",
     "view": "Brightness gradient across the floor plan"
    }
   ],
   "suites": [
    {
     "label": "Pool of light",
     "set": {
      "falloff": "steep",
      "valueKey": "low key",
      "practicalInFrame": "yes"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Steep falloff makes isolated pools of light.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-lights/arnold_user_guide_ac_lights_ac_light_filters_html.html"
  },
  {
   "id": "arnold-light-animation",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Animated and flickering lights",
   "granularity": [
    "keyframed intensity",
    "color change",
    "flicker"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Lights can flicker or fade across beats on the preview.",
   "curiosities": [
    "lightChange",
    "fireLight"
   ],
   "newCuriosities": [
    {
     "id": "flicker",
     "label": "Flicker",
     "values": "steady, gentle, strobe, failing",
     "view": "A jagged brightness line per light"
    }
   ],
   "suites": [
    {
     "label": "Horror hallway",
     "set": {
      "flicker": "failing",
      "valueKey": "low key",
      "practicalInFrame": "yes"
     }
    },
    {
     "label": "Rave",
     "set": {
      "flicker": "strobe",
      "hazeLevel": "4",
      "saturation": "5"
     }
    }
   ],
   "proximities": [
    "When the threat appears, the light flickers within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Light that changes in time is the most filmic of lighting acts.",
   "source": "https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/getting-started/am-Hyperspace_Madness_Production/arnold_for_maya_getting_started_am_Hyperspace_Effect_using_a_Gobo_and_Atmosphere_Volume_html.html ; knowledge"
  },
  {
   "id": "arnold-area-light",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Area light",
   "granularity": [
    "quad",
    "disk",
    "cylinder",
    "spread",
    "roundness",
    "soft edge",
    "normalize"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draws a soft rectangle or disk source on the 2D lighting preview whose size and spread set how wide and soft the falloff on the subject looks.",
   "curiosities": [
    "key",
    "softness",
    "contrast",
    "lightShape"
   ],
   "newCuriosities": [
    {
     "id": "sourceSize",
     "label": "Size of the light",
     "values": "tiny, small, medium, large, huge",
     "view": "A box beside the key arrow that grows and shrinks per beat"
    },
    {
     "id": "lightSpread",
     "label": "Beam spread",
     "values": "0 to 5 (0 tight beam, 5 wide wash)",
     "view": "A cone drawn from the source, narrow or wide, per beat"
    }
   ],
   "suites": [
    {
     "label": "Soft window key",
     "set": {
      "key": "side",
      "softness": "soft",
      "sourceSize": "large",
      "lightSpread": "4"
     }
    }
   ],
   "proximities": [
    "When the source grows, contrast drops within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "The main film light; size and spread map straight to soft versus hard light.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html ; https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html ; https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-light-color-temperature",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Color and color temperature",
   "granularity": [
    "color",
    "use temperature",
    "kelvin"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Sets each preview light's color by kelvin.",
   "curiosities": [
    "colorTemp",
    "palette"
   ],
   "newCuriosities": [
    {
     "id": "warmCoolSplit",
     "label": "Warm and cool split",
     "values": "none, warm key cool fill, cool key warm fill",
     "view": "Two swatches side by side per beat"
    }
   ],
   "suites": [
    {
     "label": "Teal and orange",
     "set": {
      "warmCoolSplit": "warm key cool fill",
      "saturation": "4"
     }
    }
   ],
   "proximities": [
    "When a practical turns on, warm-cool split appears within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Color of light is one of the strongest mood levers.",
   "source": "knowledge"
  },
  {
   "id": "arnold-directional-light",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Directional light (sun)",
   "granularity": [
    "angle",
    "direction",
    "parallel shadows"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Sets sun direction on the preview and casts long or short parallel shadows by time of day.",
   "curiosities": [
    "timeOfDay",
    "key",
    "softness"
   ],
   "newCuriosities": [
    {
     "id": "shadowLength",
     "label": "Shadow length",
     "values": "none, short, long, very long",
     "view": "Shadow streaks on the floor plan per beat"
    }
   ],
   "suites": [
    {
     "label": "Golden hour",
     "set": {
      "timeOfDay": "dusk",
      "colorTemp": "3200",
      "shadowLength": "long",
      "rim": "strong"
     }
    }
   ],
   "proximities": [
    "When the sun drops, shadows lengthen within 2 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Sun angle is the base of every exterior.",
   "source": "https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html"
  },
  {
   "id": "arnold-light-intensity-exposure",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Intensity and exposure",
   "granularity": [
    "intensity",
    "exposure in stops",
    "color * intensity * 2^exposure"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Each preview light has a stops slider; doubling is +1 stop, the same unit as the contrast curiosity.",
   "curiosities": [
    "contrast",
    "valueKey"
   ],
   "newCuriosities": [
    {
     "id": "keyStops",
     "label": "Key level",
     "values": "-3 to +3 stops",
     "view": "A line per light showing its level each beat"
    }
   ],
   "suites": [
    {
     "label": "Low-key noir",
     "set": {
      "contrast": "5",
      "valueKey": "low key",
      "keyStops": "+1"
     }
    }
   ],
   "proximities": [
    "When key stops rise by 2, fill follows within 1 beat or contrast jumps"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Stops are how cinematographers talk; the manual uses the same math.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html ; https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-physical-sky",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Physical sky",
   "granularity": [
    "sun elevation",
    "azimuth",
    "turbidity",
    "sun size",
    "sky tint"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A sun-height slider that sets sky color, sun color and shadow length together on the preview.",
   "curiosities": [
    "timeOfDay",
    "colorTemp"
   ],
   "newCuriosities": [
    {
     "id": "sunHeight",
     "label": "Sun height",
     "values": "0 to 90 degrees",
     "view": "A sun dot rising and falling over the strip"
    },
    {
     "id": "haziness",
     "label": "Sky haze",
     "values": "clear, light, heavy",
     "view": "Sky band goes from crisp to milky"
    }
   ],
   "suites": [
    {
     "label": "High noon",
     "set": {
      "sunHeight": "80",
      "shadowLength": "short",
      "contrast": "5"
     }
    }
   ],
   "proximities": [
    "When the sun height falls under 10, color of the light warms within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "One knob that explains why sunlight changes through a day.",
   "source": "knowledge"
  },
  {
   "id": "arnold-shadow-density-color",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Shadow density and color",
   "granularity": [
    "cast shadows",
    "shadow density 0 to 1",
    "shadow color"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Preview shadows can be thinned or tinted.",
   "curiosities": [
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "shadowTone",
     "label": "Shadow depth",
     "values": "0 to 5 (0 none, 5 black)",
     "view": "Shadow shapes on the stage get darker or lighter"
    },
    {
     "id": "shadowTint",
     "label": "Shadow color",
     "values": "neutral, blue, purple, warm",
     "view": "A swatch inside the shadow per beat"
    }
   ],
   "suites": [
    {
     "label": "Moonlit",
     "set": {
      "timeOfDay": "night",
      "colorTemp": "7500",
      "shadowTint": "blue",
      "shadowTone": "4"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Shadow depth and tint are easy to read and to remix.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html ; https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-skydome-light",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Skydome light",
   "granularity": [
    "color",
    "HDRI texture",
    "resolution",
    "camera visibility",
    "samples",
    "cast volumetric shadow"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draws a sky band behind the stage and tints ambient fill from a chosen sky color or picked HDRI swatch.",
   "curiosities": [
    "timeOfDay",
    "colorTemp",
    "lighting"
   ],
   "newCuriosities": [
    {
     "id": "ambientFill",
     "label": "Sky fill",
     "values": "0 to 5",
     "view": "A wash under the strip whose brightness is the fill level"
    }
   ],
   "suites": [
    {
     "label": "Overcast day",
     "set": {
      "timeOfDay": "day",
      "softness": "soft",
      "ambientFill": "4",
      "contrast": "1"
     }
    }
   ],
   "proximities": [
    "When the time of day changes, sky fill changes within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Environment light is how most 3D scenes start; plain fill level is measurable.",
   "source": "https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html ; https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html"
  },
  {
   "id": "arnold-spot-light",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Spot light",
   "granularity": [
    "cone angle",
    "penumbra",
    "lens radius",
    "aspect ratio",
    "roundness"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draws a cone with a soft or hard edge on the 2D stage that can follow a character dot.",
   "curiosities": [
    "key",
    "lightShape",
    "softness"
   ],
   "newCuriosities": [
    {
     "id": "spotFollow",
     "label": "Follow spot",
     "values": "off, fixed, follows a person",
     "view": "A circle on the stage that tracks a dot or stays put"
    }
   ],
   "suites": [
    {
     "label": "Stage spotlight",
     "set": {
      "spotFollow": "follows a person",
      "valueKey": "low key",
      "contrast": "5"
     }
    }
   ],
   "proximities": [
    "When a performer enters, the follow spot picks them up within 1 beat"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Live performers and theatre-style staging use spots constantly.",
   "source": "https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html"
  },
  {
   "id": "arnold-light-aov-group",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Light AOV group",
   "granularity": [
    "per-light output",
    "light groups"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Lets a viewer solo each light in the preview, like relighting in comp.",
   "curiosities": [
    "lightCount"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Soloing lights is a strong teaching view.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html"
  },
  {
   "id": "arnold-light-linking",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Light linking and shadow linking",
   "granularity": [
    "illuminate by default",
    "per-object links"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as which person a light belongs to.",
   "curiosities": [
    "lightCount"
   ],
   "newCuriosities": [
    {
     "id": "lightOwner",
     "label": "Light belongs to",
     "values": "everyone, hero only, background only",
     "view": "A colored ring on the lit dot"
    }
   ],
   "suites": [
    {
     "label": "Hero glow",
     "set": {
      "lightOwner": "hero only",
      "rim": "strong"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "advanced",
    "performer"
   ],
   "keep": "keep",
   "reason": "Lighting only the hero is a common cheat.",
   "source": "knowledge"
  },
  {
   "id": "arnold-light-portal",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Light portal",
   "granularity": [
    "window opening",
    "guides skydome samples"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled; it is a noise-reduction helper for interiors lit through windows.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "A render-efficiency tool with no visible effect of its own.",
   "source": "https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html"
  },
  {
   "id": "arnold-light-samples",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Light samples",
   "granularity": [
    "samples",
    "noise in shadows",
    "0 disables"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled; a render quality setting.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Render cost, not a visible choice.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html ; https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-light-max-bounces",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Max bounces and per-light diffuse/specular",
   "granularity": [
    "diffuse weight",
    "specular weight",
    "indirect",
    "max bounces"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as whether a light makes highlights only, fill only, or both.",
   "curiosities": [
    "gloss"
   ],
   "newCuriosities": [
    {
     "id": "lightJob",
     "label": "What the light does",
     "values": "highlight only, fill only, both",
     "view": "A small tag on each light"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Pros cheat lights to hit only eyes or only fill.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html ; https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/getting-started/am-Hyperspace_Madness_Production/arnold_for_maya_getting_started_am_Hyperspace_Effect_using_a_Gobo_and_Atmosphere_Volume_html.html"
  },
  {
   "id": "arnold-mesh-light",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Mesh light",
   "granularity": [
    "any shape glows",
    "light visible",
    "intensity",
    "color"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Counts as a glowing object in frame; no separate preview tool.",
   "curiosities": [
    "glow",
    "practicalInFrame"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Neon sign",
     "set": {
      "glow": "object",
      "practicalInFrame": "yes",
      "colorTemp": "7500"
     }
    }
   ],
   "proximities": [
    "When a sign switches on, the key color shifts within 1 beat"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Neon, screens and lamp shades are practicals the board already tracks.",
   "source": "https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html"
  },
  {
   "id": "arnold-light-normalize",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Normalize",
   "granularity": [
    "size changes softness not brightness"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "The preview keeps brightness fixed when a light is resized, so only softness changes.",
   "curiosities": [
    "softness"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Teaches that size equals softness without confounding brightness.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html"
  },
  {
   "id": "arnold-photometric-light",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Photometric light",
   "granularity": [
    "IES profile",
    "real fixture shape"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as the shape of a practical's throw on the wall (pool, scallop, beam).",
   "curiosities": [
    "practicalInFrame",
    "lightShape"
   ],
   "newCuriosities": [
    {
     "id": "throwPattern",
     "label": "Wall throw",
     "values": "none, pool, scallop, beam",
     "view": "An icon on the wall in the panel"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Scalloped wall light is a recognizable practical look.",
   "source": "https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html ; https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html"
  },
  {
   "id": "arnold-point-light",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Point and sphere light",
   "granularity": [
    "radius",
    "decay",
    "bare bulb"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Reads as a bare bulb practical with hard shadows when small.",
   "curiosities": [
    "practicalInFrame",
    "softness"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Bare bulb",
     "set": {
      "practicalInFrame": "yes",
      "softness": "hard",
      "valueKey": "low key"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Classic interrogation-room bulb.",
   "source": "https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_am_Lights_html"
  },
  {
   "id": "arnold-light-volume-contribution",
   "manual": "Arnold for Maya",
   "area": "Lights",
   "topic": "Volume contribution",
   "granularity": [
    "volume",
    "volume samples",
    "per-light specular and diffuse"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Lets each preview light switch on beams when the air curiosity is haze.",
   "curiosities": [
    "atmosphere"
   ],
   "newCuriosities": [
    {
     "id": "beamFromLight",
     "label": "Which light makes beams",
     "values": "none, key, back, practical",
     "view": "A shaft drawn from that light"
    }
   ],
   "suites": [
    {
     "label": "Church shafts",
     "set": {
      "atmosphere": "beams",
      "beamFromLight": "key",
      "valueKey": "low key"
     }
    }
   ],
   "proximities": [
    "When haze rises, a light beam appears within 0 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Beams through haze are a common cinematic look.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_lights_html.html ; https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/getting-started/am-Hyperspace_Madness_Production/arnold_for_maya_getting_started_am_Hyperspace_Effect_using_a_Gobo_and_Atmosphere_Volume_html.html"
  },
  {
   "id": "arnold-operators",
   "manual": "Arnold for Maya",
   "area": "Operators/procedurals",
   "topic": "Operators (set parameter, merge, override)",
   "granularity": [
    "set parameter",
    "material override",
    "switch"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Mirrors the Suite menu: one rule changes many values at once.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "performer"
   ],
   "keep": "keep",
   "reason": "Same idea as a suite; useful for performers switching looks live.",
   "source": "knowledge"
  },
  {
   "id": "arnold-procedurals-standins",
   "manual": "Arnold for Maya",
   "area": "Operators/procedurals",
   "topic": "Stand-ins and procedurals (.ass)",
   "granularity": [
    "stand-in",
    "instances"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Scene management.",
   "source": "knowledge"
  },
  {
   "id": "arnold-motion-blur-settings",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Motion blur settings",
   "granularity": [
    "enable",
    "keys",
    "length",
    "position start/center/end",
    "deformation",
    "camera blur"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Uses the existing motion blur curiosity in shutter degrees.",
   "curiosities": [
    "motionBlur"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Dreamy smear",
     "set": {
      "motionBlur": "360",
      "speedRamp": "0.5"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Already modeled.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_render_settings_html.html ; https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_cameras_html.html"
  },
  {
   "id": "arnold-snapshots-ab",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "RenderView snapshots and A/B compare",
   "granularity": [
    "store snapshot",
    "compare"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Lets a user snapshot a panel's light and wipe between two versions.",
   "curiosities": [
    "lightChange"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "A/B compare is how people learn what one change does.",
   "source": "knowledge"
  },
  {
   "id": "arnold-adaptive-sampling",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Adaptive sampling and noise",
   "granularity": [
    "AA max",
    "adaptive threshold"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Technical.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/arnold_for_maya_am_Getting_Started_with_Arnold_GPU_html.html ; https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_render_settings_html.html"
  },
  {
   "id": "arnold-camera-aa-samples",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Camera (AA) and ray-type samples",
   "granularity": [
    "camera AA (squared)",
    "diffuse",
    "specular",
    "transmission",
    "SSS",
    "volume"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled; quality knobs.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Render cost, not storytelling.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-render-settings/arnold_user_guide_ac_render_settings_ac_sampling_html.html ; https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-color-management",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Color management and view transform",
   "granularity": [
    "ACES",
    "sRGB",
    "raw",
    "rendering space",
    "view transform"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as film-look transform per section.",
   "curiosities": [
    "saturation"
   ],
   "newCuriosities": [
    {
     "id": "filmLook",
     "label": "Film look",
     "values": "neutral, filmic, punchy, bleach",
     "view": "A tint strip above the panel"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "A look transform defines a show's color.",
   "source": "https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-denoisers",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Denoisers (OptiX, Noice, OIDN)",
   "granularity": [
    "OptiX GPU",
    "Noice",
    "Intel OIDN",
    "IPR denoise"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Pipeline tool.",
   "source": "knowledge"
  },
  {
   "id": "arnold-gpu-rendering",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "GPU rendering",
   "granularity": [
    "CPU/GPU switch",
    "adaptive AA settings"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Hardware choice.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/arnold_for_maya_am_Getting_Started_with_Arnold_GPU_html.html"
  },
  {
   "id": "arnold-ipr-renderview",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "IPR and Arnold RenderView",
   "granularity": [
    "interactive render",
    "region",
    "crop",
    "debug shading"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "The board already redraws live; IPR is the analog of the live preview.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student"
   ],
   "keep": "keep",
   "reason": "Model for instant feedback in the preview.",
   "source": "knowledge"
  },
  {
   "id": "arnold-pixel-filter",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Pixel filter",
   "granularity": [
    "gaussian",
    "blackman-harris",
    "box",
    "width"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Sharpness tweak.",
   "source": "https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-ray-depth",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Ray depth",
   "granularity": [
    "total",
    "diffuse",
    "specular",
    "transmission",
    "volume",
    "transparency"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged loosely as how much bounced light fills the room.",
   "curiosities": [
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "bounce",
     "label": "Bounce light",
     "values": "none, some, lots",
     "view": "Fill wash brightness under the stage"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Bounce changes contrast in interiors.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/arnold_user_guide_ac_render_settings_html.html ; https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-film-grain-noise",
   "manual": "Arnold for Maya",
   "area": "Render settings",
   "topic": "Visible noise and grain",
   "granularity": [
    "noise as style",
    "grain"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as intentional grain amount per section.",
   "curiosities": [],
   "newCuriosities": [
    {
     "id": "grain",
     "label": "Grain",
     "values": "0 to 5",
     "view": "Speckle intensity in the panel"
    }
   ],
   "suites": [
    {
     "label": "16mm docu",
     "set": {
      "grain": "4",
      "cameraCarry": "handheld",
      "aspect": "1.33"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "remixer",
    "intermediate"
   ],
   "keep": "keep",
   "reason": "Grain is a style choice even if render noise is not.",
   "source": "knowledge"
  },
  {
   "id": "arnold-standard-surface-base",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: base and diffuse",
   "granularity": [
    "base color",
    "weight",
    "diffuse roughness",
    "metalness"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Logged as surface material type for key props.",
   "curiosities": [
    "palette"
   ],
   "newCuriosities": [
    {
     "id": "material",
     "label": "Material",
     "values": "cloth, skin, wood, metal, glass, plastic, stone",
     "view": "A material swatch on the object"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Material reads matter for props.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-standard-surface-emission",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: emission",
   "granularity": [
    "weight",
    "color"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Uses the something-glows curiosity.",
   "curiosities": [
    "glow",
    "practicalInFrame"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Screen glow face",
     "set": {
      "glow": "object",
      "colorTemp": "7500",
      "valueKey": "low key"
     }
    }
   ],
   "proximities": [
    "When a screen lights up, the face gets cool light within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Glowing screens and signs drive night scenes.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-standard-surface-specular",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: specular",
   "granularity": [
    "weight",
    "color",
    "roughness",
    "IOR",
    "anisotropy"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Uses the existing gloss curiosity.",
   "curiosities": [
    "gloss"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Rain-slicked street",
     "set": {
      "gloss": "mirror",
      "wetness": "soaked",
      "timeOfDay": "night"
     }
    }
   ],
   "proximities": [
    "When rain starts, gloss rises within 2 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Shine reads instantly on screen.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-standard-surface-subsurface",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: subsurface",
   "granularity": [
    "weight",
    "radius",
    "scale",
    "type"
   ],
   "weight": "major",
   "fit": "curiosity",
   "appDoes": "Uses the existing light-in-skin curiosity.",
   "curiosities": [
    "skinLight"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Backlit ears",
     "set": {
      "skinLight": "4",
      "key": "back",
      "rim": "strong"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Skin glow is key to flattering faces.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-toon-outlines",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Toon outlines and edges",
   "granularity": [
    "edge color",
    "edge width",
    "silhouette",
    "angle threshold",
    "edge tonemap",
    "enable edges by ID"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "Draws ink outlines on figures with a width slider that can change per beat.",
   "curiosities": [
    "lineWeight"
   ],
   "newCuriosities": [
    {
     "id": "lineVaries",
     "label": "Line changes",
     "values": "constant, thick on action, thin on calm",
     "view": "Line thickness graph per beat"
    }
   ],
   "suites": [
    {
     "label": "Comic ink",
     "set": {
      "lineWeight": "heavy",
      "renderStyle": "toon",
      "toneBands": "2"
     }
    }
   ],
   "proximities": [
    "When an impact lands, ink line thickens within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "remixer",
    "student"
   ],
   "keep": "keep",
   "reason": "Comic and zine panels depend on line weight.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/am-Toon_Tutorials/arnold_for_maya_toon_am_Toon_Shading_with_the_Facing_Ratio_shader_html.html"
  },
  {
   "id": "arnold-toon-shader",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Toon shader",
   "granularity": [
    "base tonemap",
    "shade bands",
    "specular tonemap",
    "rim light",
    "lights for toon"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A toon preview mode: two or three flat tone bands and a hard rim on the stage dots.",
   "curiosities": [
    "renderStyle",
    "rim"
   ],
   "newCuriosities": [
    {
     "id": "toneBands",
     "label": "Shade bands",
     "values": "1, 2, 3, 4, smooth",
     "view": "Stepped bars beside each figure"
    }
   ],
   "suites": [
    {
     "label": "Anime cel",
     "set": {
      "renderStyle": "toon",
      "toneBands": "2",
      "lineWeight": "thin",
      "rim": "strong"
     }
    }
   ],
   "proximities": [
    "When style flips to toon, ink line turns on within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Animation and comic users want cel looks.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/am-Toon_Tutorials/arnold_for_maya_toon_am_Toon_Shading_with_the_Facing_Ratio_shader_html.html"
  },
  {
   "id": "arnold-ambient-occlusion",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Ambient occlusion",
   "granularity": [
    "falloff",
    "spread",
    "samples",
    "near/far"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as contact-shadow strength in corners.",
   "curiosities": [
    "contrast"
   ],
   "newCuriosities": [
    {
     "id": "contactShadow",
     "label": "Contact shadow",
     "values": "0 to 5",
     "view": "Darkened creases on the stage"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "AO grounds objects; useful style knob.",
   "source": "knowledge"
  },
  {
   "id": "arnold-curvature-shader",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Curvature shader",
   "granularity": [
    "convex/concave",
    "radius"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Texturing helper.",
   "source": "knowledge"
  },
  {
   "id": "arnold-facing-ratio-toon",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Facing ratio toon setup",
   "granularity": [
    "facing ratio",
    "ramp",
    "bias",
    "gain",
    "color correct"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "A gradient-on-edge look option in the toon preview.",
   "curiosities": [
    "renderStyle"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Teaches how edge falloff makes cartoon shading.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Shading/am-Toon_Tutorials/arnold_for_maya_toon_am_Toon_Shading_with_the_Facing_Ratio_shader_html.html"
  },
  {
   "id": "arnold-layer-shader",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Layer shader and mix",
   "granularity": [
    "layer mix",
    "mask"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Technical node graph.",
   "source": "knowledge"
  },
  {
   "id": "arnold-matte-shadow-matte",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Matte and shadow matte",
   "granularity": [
    "holdout",
    "catch shadows on plate",
    "background"
   ],
   "weight": "minor",
   "fit": "partial",
   "appDoes": "Supports a mixed shot: drawn figures over a photo plate with shadows.",
   "curiosities": [
    "renderStyle"
   ],
   "newCuriosities": [
    {
     "id": "liveMix",
     "label": "Mixed media",
     "values": "none, figure on photo, photo on drawing",
     "view": "A tag per panel"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Remixers composite drawn things into footage.",
   "source": "https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-output-aovs/arnold_user_guide_ac_output_aovs_ac_aovs_html.html ; knowledge"
  },
  {
   "id": "arnold-standard-surface-opacity",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Opacity and cutout",
   "granularity": [
    "opacity",
    "thin walled"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Technical, not a story choice.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-hair-shader",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Hair",
   "granularity": [
    "melanin",
    "melanin redness",
    "roughness",
    "specular shifts"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Uses existing hair color and shine curiosities.",
   "curiosities": [
    "hairColor",
    "hairShine"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Already modeled.",
   "source": "knowledge"
  },
  {
   "id": "arnold-standard-surface-coat",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: coat",
   "granularity": [
    "weight",
    "roughness",
    "color",
    "IOR"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Folds into gloss (lacquer, car paint).",
   "curiosities": [
    "gloss"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Covered by gloss.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-standard-surface-sheen",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: sheen",
   "granularity": [
    "weight",
    "color",
    "roughness"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as velvet or cloth sheen under the material curiosity.",
   "curiosities": [
    "clothResponse"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "keep",
   "reason": "Minor read on costume.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-standard-surface-thin-film",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: thin film",
   "granularity": [
    "thickness",
    "IOR",
    "iridescence"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as an iridescent glow value.",
   "curiosities": [
    "glow"
   ],
   "newCuriosities": [
    {
     "id": "iridescence",
     "label": "Rainbow sheen",
     "values": "none, soap bubble, oil, beetle",
     "view": "A rainbow edge on the object"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Sci-fi and dream sequences use it.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-standard-surface-transmission",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Standard Surface: transmission",
   "granularity": [
    "glass",
    "depth",
    "scatter",
    "dispersion",
    "thin walled"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as see-through surfaces in frame.",
   "curiosities": [],
   "newCuriosities": [
    {
     "id": "seeThrough",
     "label": "See-through surfaces",
     "values": "none, glass, water, ice",
     "view": "An outline with a sheen on the object"
    }
   ],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Shooting through glass is a framing device.",
   "source": "https://help.autodesk.com/cloudhelp/2022/ENU/Maya-LightingShading/files/GUID-0944E219-0FAB-499F-B5E3-6E53C2B27826.htm"
  },
  {
   "id": "arnold-utility-shader",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Utility shader",
   "granularity": [
    "shade mode flat/lambert/ndoteye",
    "color mode"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled; a debug view.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Debug tool.",
   "source": "knowledge"
  },
  {
   "id": "arnold-wireframe-shader",
   "manual": "Arnold for Maya",
   "area": "Shaders",
   "topic": "Wireframe shader",
   "granularity": [
    "line width",
    "edge type"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Feeds the render style value wireframe for tech or hologram looks.",
   "curiosities": [
    "renderStyle"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Hologram",
     "set": {
      "renderStyle": "wireframe",
      "glow": "object",
      "colorTemp": "7500"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "remixer",
    "intermediate"
   ],
   "keep": "keep",
   "reason": "Hologram/HUD looks.",
   "source": "knowledge"
  },
  {
   "id": "arnold-texture-pattern-scale",
   "manual": "Arnold for Maya",
   "area": "Textures",
   "topic": "Pattern and texture scale",
   "granularity": [
    "triplanar",
    "noise",
    "cell",
    "ramp"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as busy versus plain surfaces.",
   "curiosities": [
    "visualDensity"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Busy backgrounds change readability.",
   "source": "knowledge"
  },
  {
   "id": "arnold-tx-textures",
   "manual": "Arnold for Maya",
   "area": "Textures",
   "topic": "TX texture conversion and tiling",
   "granularity": [
    "maketx",
    "mipmaps",
    "UDIM",
    "tiling"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "Pipeline optimization.",
   "source": "knowledge"
  },
  {
   "id": "arnold-aiimage-texture",
   "manual": "Arnold for Maya",
   "area": "Textures",
   "topic": "aiImage texture",
   "granularity": [
    "filename",
    "color space",
    "UV",
    "tokens"
   ],
   "weight": "minor",
   "fit": "skip",
   "appDoes": "Not modeled.",
   "curiosities": [],
   "newCuriosities": [],
   "suites": [],
   "proximities": [],
   "audience": [
    "advanced"
   ],
   "keep": "skip",
   "reason": "File plumbing.",
   "source": "knowledge"
  },
  {
   "id": "arnold-hdri-lighting",
   "manual": "Arnold for Maya",
   "area": "Tutorials",
   "topic": "HDRI lighting",
   "granularity": [
    "HDR image on skydome",
    "rotation",
    "exposure",
    "background visibility"
   ],
   "weight": "major",
   "fit": "partial",
   "appDoes": "Offers a few sky swatches whose rotation turns the sun direction around the subject.",
   "curiosities": [
    "key",
    "timeOfDay",
    "colorTemp"
   ],
   "newCuriosities": [
    {
     "id": "envTurn",
     "label": "Sky turned",
     "values": "0 to 360 degrees",
     "view": "A compass under the panel"
    }
   ],
   "suites": [],
   "proximities": [
    "When the environment turns, key direction changes within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "student",
    "advanced"
   ],
   "keep": "keep",
   "reason": "Most beginners light with an HDRI first.",
   "source": "https://users.dma.ucla.edu/~cariesta/MayaCourseNotes/html/arnold_maya_raw.html"
  },
  {
   "id": "arnold-three-point-lighting",
   "manual": "Arnold for Maya",
   "area": "Tutorials",
   "topic": "Three-point lighting",
   "granularity": [
    "key",
    "fill",
    "back/rim",
    "ratios"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A starter preset that places key, fill and rim on the 2D preview with a ratio slider.",
   "curiosities": [
    "key",
    "contrast",
    "rim",
    "lightCount"
   ],
   "newCuriosities": [
    {
     "id": "fillRatio",
     "label": "Key to fill ratio",
     "values": "1:1, 2:1, 4:1, 8:1",
     "view": "Two bars per beat"
    }
   ],
   "suites": [
    {
     "label": "Interview",
     "set": {
      "key": "side",
      "fillRatio": "2:1",
      "rim": "thin",
      "softness": "soft"
     }
    },
    {
     "label": "Thriller",
     "set": {
      "key": "side",
      "fillRatio": "8:1",
      "rim": "strong",
      "valueKey": "low key"
     }
    }
   ],
   "proximities": [
    "When the fill ratio jumps to 8:1, mood darkens within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "The first lighting lesson for every beginner.",
   "source": "knowledge"
  },
  {
   "id": "arnold-natural-history-museum",
   "manual": "Arnold for Maya",
   "area": "Tutorials",
   "topic": "Interior lighting tutorial (museum)",
   "granularity": [
    "skylight",
    "portals",
    "bounce",
    "practicals"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Logged as daylight interior mix of window and practicals.",
   "curiosities": [
    "intExt",
    "practicalInFrame",
    "lightCount"
   ],
   "newCuriosities": [],
   "suites": [
    {
     "label": "Daylight interior",
     "set": {
      "intExt": "int",
      "timeOfDay": "day",
      "practicalInFrame": "yes",
      "ambientFill": "3"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Interior day mix is a frequent setup.",
   "source": "knowledge"
  },
  {
   "id": "arnold-atmosphere-volume",
   "manual": "Arnold for Maya",
   "area": "Volumes",
   "topic": "Atmosphere volume",
   "granularity": [
    "density",
    "attenuation",
    "anisotropy",
    "samples"
   ],
   "weight": "major",
   "fit": "build",
   "appDoes": "A haze slider on the preview that turns light cones into visible beams.",
   "curiosities": [
    "atmosphere"
   ],
   "newCuriosities": [
    {
     "id": "hazeLevel",
     "label": "Haze amount",
     "values": "0 to 5",
     "view": "A milky wash with beams"
    }
   ],
   "suites": [
    {
     "label": "Smoky club",
     "set": {
      "hazeLevel": "4",
      "atmosphere": "beams",
      "valueKey": "low key",
      "colorTemp": "3200"
     }
    }
   ],
   "proximities": [
    "When haze rises above 3, a light beam appears within 0 beats"
   ],
   "audience": [
    "beginner",
    "intermediate",
    "advanced",
    "remixer",
    "performer",
    "student"
   ],
   "keep": "keep",
   "reason": "Haze is a defining cinematic look.",
   "source": "https://help.autodesk.com/cloudhelp/2024/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/getting-started/am-Hyperspace_Madness_Production/arnold_for_maya_getting_started_am_Hyperspace_Effect_using_a_Gobo_and_Atmosphere_Volume_html.html"
  },
  {
   "id": "arnold-fog",
   "manual": "Arnold for Maya",
   "area": "Volumes",
   "topic": "Fog",
   "granularity": [
    "distance",
    "height",
    "color"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Uses weather and air curiosities with a depth-fade value.",
   "curiosities": [
    "weather",
    "atmosphere"
   ],
   "newCuriosities": [
    {
     "id": "depthFade",
     "label": "Depth fade",
     "values": "none, light, heavy",
     "view": "Far layers grow paler"
    }
   ],
   "suites": [
    {
     "label": "Foggy morning",
     "set": {
      "weather": "fog",
      "depthFade": "heavy",
      "timeOfDay": "dawn"
     }
    }
   ],
   "proximities": [],
   "audience": [
    "beginner",
    "intermediate",
    "student",
    "remixer"
   ],
   "keep": "keep",
   "reason": "Depth fade separates planes.",
   "source": "knowledge"
  },
  {
   "id": "arnold-vdb-volume",
   "manual": "Arnold for Maya",
   "area": "Volumes",
   "topic": "VDB volumes (smoke, fire, clouds)",
   "granularity": [
    "density",
    "scatter",
    "emission",
    "temperature"
   ],
   "weight": "minor",
   "fit": "curiosity",
   "appDoes": "Uses element and fire light curiosities.",
   "curiosities": [
    "element",
    "fireLight"
   ],
   "newCuriosities": [],
   "suites": [],
   "proximities": [
    "When fire flares, warm light hits faces within 0 beats"
   ],
   "audience": [
    "intermediate",
    "advanced",
    "student"
   ],
   "keep": "keep",
   "reason": "Already covered by element curiosities.",
   "source": "knowledge"
  }
 ]
};
