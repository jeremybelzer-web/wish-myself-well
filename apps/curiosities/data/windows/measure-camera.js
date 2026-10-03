/* Camera, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  W.add("pov", {
    sliders: [
      ["whoseEyes", "Whose eyes", ["the main character", "the villain", "the victim", "a bystander", "an animal", "an object"], "Who or what we are seeing through.", { unordered: true }],
      ["eyeHeight", "Height of their eyes", [0.1, 3, "m", 0.05], "How high off the floor their eyes are, so the camera sits there.", { from: 1.6, to: 1.6 }],
      ["stayLength", "How long we stay inside", [1, 120, "seconds", 1], "How many seconds each stretch through their eyes lasts.", { from: 3, to: 10 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["whoseEyes", "eyeHeight", "stayLength"] }] },
  });

  W.add("angleToLine", {
    sliders: [
      ["sizeJump", "Change in their size", [-90, 300, "%"], "How much bigger (plus) or smaller (minus) the speaker gets in the frame when the angle answers the line.", { from: 0, to: 50 }],
      ["turnAround", "Turn around them", [0, 180, "°"], "How many degrees the camera moves around the speaker for the matched line.", { from: 0, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["sizeJump", "turnAround"] }] },
  });

  W.add("cutRate", {
    sliders: [
      ["linesPerAngle", "Lines per angle", [0.5, 10, "lines", 0.5], "How many spoken lines play before the angle changes.", { from: 1, to: 2 }],
      ["rampTime", "Time to reach the new pace", [0, 60, "seconds", 1], "How many seconds the cutting takes to settle into a new speed.", { from: 5, to: 15 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["linesPerAngle", "rampTime"] }] },
  });

  W.add("cameraOwner", {
    sliders: [
      ["leash", "Camera's distance from them", [0.5, 20, "m", 0.5], "How many meters behind the player's character the camera stays.", { from: 3, to: 5 }],
      ["turnLimit", "How far the player can turn", [0, 360, "°"], "How many degrees around the character the player may swing the camera.", { from: 90, to: 360 }],
      ["tiltLimit", "How far up or down", [0, 90, "°"], "How many degrees the player may tilt the camera up or down.", { from: 30, to: 60 }],
      ["blendTime", "Handover takes", [0, 5, "seconds", 0.1], "How many seconds the camera takes to pass between the story and the player.", { from: 0.5, to: 1.5 }],
    ],
    window: {
      faces: [{ face: "pad", x: "turnLimit", y: "leash", xLabel: "turns", yLabel: "distance" }],
      groups: [{ label: "Measured", sliders: ["leash", "turnLimit", "tiltLimit", "blendTime"] }],
    },
  });

  W.add("objectPath", {
    sliders: [
      ["travel", "How far it travels", [0, 50, "m", 0.1], "How many meters the object moves along its path.", { from: 0.5, to: 2 }],
      ["rise", "Rise or fall", [-5, 5, "m", 0.1], "How many meters it goes up (plus) or down (minus) on the way.", { from: 0, to: 0 }],
      ["heading", "Which way across the frame", [0, 360, "°"], "The direction it moves on screen: 0 up, 90 right, 180 down, 270 left.", { from: 90, to: 90 }],
      ["moveTime", "How long the trip takes", [0, 20, "seconds", 0.1], "How many seconds from start to stop.", { from: 0.5, to: 2 }],
    ],
    window: {
      faces: [{ face: "dial", slider: "travel" }],
      groups: [{ label: "Measured", sliders: ["travel", "rise", "heading", "moveTime"] }],
    },
  });

  W.add("blocking", {
    sliders: [
      ["gapMeters", "Space between them", [0, 20, "m", 0.1], "How many meters apart the two closest people stand.", { from: 1, to: 2 }],
      ["facing", "How they face each other", [0, 180, "°"], "0 is face to face, 90 side by side, 180 back to back.", { from: 30, to: 60 }],
      ["heightGap", "Difference in height", [0, 3, "m", 0.05], "How many meters higher one head is than the other.", { from: 0, to: 0.3 }],
      ["depthGap", "One behind the other", [0, 20, "m", 0.1], "How many meters farther from the camera one stands than the other.", { from: 0, to: 1 }],
      ["placedFrom", "Measured from", ["each other", "the camera", "the door", "the table", "the room's center"], "What their places are measured against.", { unordered: true }],
    ],
    window: {
      faces: [{ face: "pad", x: "gapMeters", y: "facing", xLabel: "apart", yLabel: "turned away" }],
      groups: [{ label: "Measured", sliders: ["gapMeters", "facing", "heightGap", "depthGap", "placedFrom"] }],
      presets: [{ label: "Standoff", plain: "Face to face, two meters apart, level.", set: { gapMeters: 2, facing: 0, heightGap: 0 } }],
    },
  });

  W.add("shotSize", {
    sliders: [
      ["subjectHeight", "How tall they are in frame", [5, 300, "%"], "The subject's height as a share of the frame's height; over 100 means part of them is cut off.", { from: 40, to: 80 }],
      ["measuredFrom", "Measured against", ["the main character", "the speaker", "an object", "the whole group"], "Whose size in the frame this measures.", { unordered: true }],
      ["topGap", "Gap above the head", [-20, 40, "%"], "Space between the top of the head and the frame's top, as a share of frame height; minus crops the head.", { from: 5, to: 10 }],
      ["sizeTime", "Time to change size", [0, 30, "seconds", 0.1], "How many seconds a change of size takes; 0 is a cut.", { from: 0, to: 2 }],
    ],
    window: {
      faces: [{ face: "dial", slider: "subjectHeight" }],
      groups: [{ label: "Measured", sliders: ["subjectHeight", "measuredFrom", "topGap", "sizeTime"] }],
      presets: [{ label: "Face fills the frame", plain: "A tight close-up on the speaker.", set: { subjectHeight: 160, measuredFrom: "the speaker" } }],
    },
  });

  W.add("angleHeight", {
    sliders: [
      ["lensHeight", "Camera height off the floor", [0, 15, "m", 0.05], "How many meters above the floor the lens is.", { from: 1.6, to: 1.6 }],
      ["eyeGap", "Above or below their eyes", [-3, 5, "m", 0.05], "How many meters above (plus) or below (minus) the subject's eyes the lens sits.", { from: 0, to: 0 }],
      ["climbTime", "Time to rise or sink", [0, 60, "seconds", 1], "How many seconds a change of height takes.", { from: 0, to: 10 }],
    ],
    window: {
      faces: [{ face: "pad", x: "eyeGap", y: "lensHeight", xLabel: "above their eyes", yLabel: "off the floor" }],
      groups: [{ label: "Measured", sliders: ["lensHeight", "eyeGap", "climbTime"] }],
    },
  });

  W.add("angleFamily", {
    sliders: [["longestTake", "Longest unbroken take", [1, 600, "seconds"], "How many seconds the longest shot runs without a cut.", { from: 5, to: 30 }]],
    window: { groups: [{ label: "Measured", sliders: ["longestTake"] }] },
  });

  W.add("angleChange", {
    sliders: [
      ["cutsPerLine", "Cuts per line", [0, 4, "cuts", 0.5], "How many times the angle changes during one spoken line.", { from: 0.5, to: 1 }],
      ["reactionHold", "Time on the listener", [0, 10, "seconds", 0.1], "How many seconds a cut to the listener stays before cutting back.", { from: 1, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["cutsPerLine", "reactionHold"] }] },
  });

  W.add("angleToAction", {
    sliders: [
      ["actionSize", "Action's size in frame", [5, 300, "%"], "How much of the frame's height the hand, thing or body doing the action fills.", { from: 30, to: 80 }],
      ["actionLead", "Early or late on the action", [-3, 3, "seconds", 0.1], "Seconds the matching angle arrives before (minus) or after (plus) the action.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["actionSize", "actionLead"] }] },
  });

  W.add("shotDuration", {
    sliders: [
      ["pastLine", "Hold after the last word", [0, 10, "seconds", 0.1], "How many seconds the shot stays after the line ends.", { from: 0.5, to: 1.5 }],
      ["holdChange", "Holds grow per minute", [-50, 50, "%"], "How much longer (plus) or shorter (minus) shots get each minute.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["pastLine", "holdChange"] }] },
  });

  W.add("cameraMove", {
    sliders: [
      ["travelM", "How far it travels", [0, 50, "m", 0.1], "How many meters the camera moves through space (for a push, pull, track or crane).", { from: 0.5, to: 2 }],
      ["turnDeg", "How far it turns", [0, 360, "°"], "How many degrees the camera swings (for a pan, tilt or orbit).", { from: 0, to: 30 }],
      ["riseM", "Rise or drop", [-10, 10, "m", 0.1], "How many meters the camera goes up (plus) or down (minus) during the move.", { from: 0, to: 0 }],
      ["moveTime", "How long the move lasts", [0.5, 60, "seconds", 0.5], "How many seconds from the start of the move to the end.", { from: 2, to: 6 }],
    ],
    window: {
      faces: [{ face: "pad", x: "turnDeg", y: "travelM", xLabel: "turns", yLabel: "travels" }],
      groups: [{ label: "Measured", sliders: ["travelM", "turnDeg", "riseM", "moveTime"] }],
      presets: [{ label: "Slow push in", plain: "One meter toward them over eight seconds.", set: { travelM: 1, turnDeg: 0, riseM: 0, moveTime: 8 } }],
    },
  });

  W.add("moveFollows", {
    sliders: [
      ["gap", "Distance kept", [0.3, 30, "m", 0.1], "How many meters the camera keeps from what it follows.", { from: 1.5, to: 3 }],
      ["sideAngle", "Angle around them", [-180, 180, "°"], "Where around them it follows from: 0 in front, 90 beside, 180 behind.", { from: 150, to: 180 }],
      ["frameSize", "Their size in frame", [5, 200, "%"], "How much of the frame's height they fill while followed.", { from: 50, to: 50 }],
    ],
    window: {
      faces: [{ face: "orbit", around: "sideAngle", distance: "gap" }],
      groups: [{ label: "Measured", sliders: ["gap", "sideAngle", "frameSize"] }],
    },
  });

  W.add("objectKind", {
    sliders: [
      ["realSize", "Real size", [1, 2000, "cm"], "How big the thing really is, in centimeters across.", { from: 10, to: 30 }],
      ["screenShare", "Time on screen", [0, 100, "%"], "Share of the scene the thing is in view.", { from: 10, to: 30 }],
      ["appearances", "Times it appears", [0, 30, "times", 1], "How many separate times it shows up.", { from: 1, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["realSize", "screenShare", "appearances"] }] },
  });

  W.add("objectEnter", {
    sliders: [
      ["crossTime", "Time to come in", [0.1, 10, "seconds", 0.1], "How many seconds it takes to enter or leave the frame.", { from: 0.5, to: 1.5 }],
      ["warnTime", "Warning before it arrives", [0, 10, "seconds", 0.1], "How many seconds the hint (a sound, a shadow) comes before the object.", { from: 0, to: 1 }],
      ["landX", "Where it stops, across", [0, 100, "%"], "How far across the frame it ends up, from the left edge.", { from: 50, to: 50 }],
      ["landY", "Where it stops, up", [0, 100, "%"], "How high in the frame it ends up, from the bottom.", { from: 50, to: 50 }],
    ],
    window: {
      faces: [{ face: "frame", x: "landX", y: "landY" }],
      groups: [{ label: "Measured", sliders: ["crossTime", "warnTime", "landX", "landY"] }],
    },
  });

  W.add("peopleCount", {
    sliders: [
      ["spacing", "Space between people", [0.2, 10, "m", 0.1], "How many meters apart people stand, on average.", { from: 0.8, to: 1.5 }],
      ["depthSpread", "Front to back spread", [0, 50, "m", 0.5], "How many meters from the nearest person to the farthest.", { from: 1, to: 5 }],
      ["turnover", "In or out per minute", [0, 30, "per minute", 1], "How many people enter or leave the shot each minute.", { from: 0, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["spacing", "depthSpread", "turnover"] }] },
  });

  W.add("eyeline", {
    sliders: [
      ["lookTarget", "Looking at", ["the other person", "the lens", "an object", "the floor", "nothing"], "What the eyes are aimed at.", { unordered: true }],
      ["offLens", "How far from the lens", [0, 90, "°"], "How many degrees to the side of the lens the eyes look; 0 is straight into it.", { from: 10, to: 20 }],
      ["lookTilt", "Looking up or down", [-45, 45, "°"], "How far the eyes aim up (plus) or down (minus).", { from: 0, to: 0 }],
      ["looksPerMin", "Looks per minute", [0, 30, "per minute", 1], "How many times a minute someone looks at the other.", { from: 2, to: 4 }],
    ],
    window: {
      faces: [{ face: "pad", x: "offLens", y: "lookTilt", xLabel: "to the side", yLabel: "up" }],
      groups: [{ label: "Measured", sliders: ["lookTarget", "offLens", "lookTilt", "looksPerMin"] }],
    },
  });

  W.add("focus", {
    sliders: [
      ["focusM", "Focus distance", [0.2, 50, "m", 0.05], "How many meters from the lens the sharpest point is.", { from: 1, to: 2 }],
      ["shiftTime", "Time to shift focus", [0, 10, "seconds", 0.1], "How many seconds focus takes to move to the new thing.", { from: 0.5, to: 1.5 }],
      ["sharpX", "Sharp spot, across", [0, 100, "%"], "How far across the frame the sharp thing sits, from the left.", { from: 50, to: 50 }],
      ["sharpY", "Sharp spot, up", [0, 100, "%"], "How high in the frame the sharp thing sits, from the bottom.", { from: 60, to: 60 }],
    ],
    window: {
      faces: [{ face: "frame", x: "sharpX", y: "sharpY" }],
      groups: [{ label: "Measured", sliders: ["focusM", "shiftTime", "sharpX", "sharpY"] }],
    },
  });

  W.add("rackFocus", {
    sliders: [
      ["pullTime", "Pull lasts", [0.1, 10, "seconds", 0.1], "How many seconds the focus takes to travel.", { from: 0.5, to: 1.5 }],
      ["nearM", "Near subject's distance", [0.2, 20, "m", 0.05], "How many meters from the lens the nearer thing is.", { from: 0.8, to: 1.2 }],
      ["farM", "Far subject's distance", [0.5, 100, "m", 0.5], "How many meters from the lens the farther thing is.", { from: 3, to: 6 }],
      ["cueLead", "Before or after the cue", [-3, 3, "seconds", 0.1], "Seconds the pull starts before (minus) or after (plus) the line or action.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [{ face: "pad", x: "nearM", y: "farM", xLabel: "near", yLabel: "far" }],
      groups: [{ label: "Measured", sliders: ["pullTime", "nearM", "farM", "cueLead"] }],
    },
  });

  W.add("cameraShake", {
    sliders: [
      ["shakeCm", "How far it shakes", [0, 30, "cm", 0.5], "How many centimeters the camera jolts each way.", { from: 0, to: 2 }],
      ["shakeHz", "Shakes per second", [0, 30, "per second", 0.5], "How many back-and-forths each second.", { from: 1, to: 4 }],
      ["shakeDeg", "Wobble in angle", [0, 10, "°", 0.5], "How many degrees the picture twists as it shakes.", { from: 0, to: 1 }],
      ["settleTime", "Time to settle", [0, 10, "seconds", 0.1], "How many seconds a jolt takes to die away.", { from: 0.5, to: 2 }],
    ],
    window: {
      faces: [{ face: "pad", x: "shakeHz", y: "shakeCm", xLabel: "faster", yLabel: "bigger" }],
      groups: [{ label: "Measured", sliders: ["shakeCm", "shakeHz", "shakeDeg", "settleTime"] }],
      presets: [{ label: "Big impact", plain: "A hard hit that rattles and settles in a second and a half.", set: { shakeCm: 10, shakeHz: 12, shakeDeg: 3, settleTime: 1.5 } }],
    },
  });

  W.add("speedRamp", {
    sliders: [
      ["rampTime", "Time to change speed", [0, 5, "seconds", 0.05], "How many seconds the speed takes to slide to its new value.", { from: 0.2, to: 0.8 }],
      ["rampLead", "Starts before the peak", [-3, 3, "seconds", 0.1], "Seconds before (minus) or after (plus) the big moment the ramp begins.", { from: -0.5, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["rampTime", "rampLead"] }] },
  });

  W.add("cameraLensLens", {
    sliders: [
      ["mm", "Focal length", [8, 300, "mm", 1], "The lens's length in millimeters: small is wide, big is long.", { from: 24, to: 50 }],
      ["fstop", "F-stop", [1.2, 22, "f", 0.1], "The lens opening: a low number gives a thin sharp zone, a high number keeps more sharp.", { from: 2.8, to: 5.6 }],
      ["focusM", "Focus distance", [0.2, 50, "m", 0.05], "How many meters from the lens the sharpest point is.", { from: 1.5, to: 3 }],
    ],
    window: {
      faces: [{ face: "pad", x: "mm", y: "fstop", xLabel: "longer", yLabel: "deeper focus" }],
      groups: [{ label: "Measured", sliders: ["mm", "fstop", "focusM"] }],
    },
  });

  W.add("lensLength", {
    sliders: [
      ["subjectDist", "Distance to the subject", [0.3, 100, "m", 0.1], "How many meters from the lens the subject stands; with the lens, this sets how flat the picture feels.", { from: 1.5, to: 4 }],
      ["zoomTime", "Time to change lens length", [0, 60, "seconds", 1], "How many seconds a change of focal length takes; 0 is a cut.", { from: 0, to: 10 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["subjectDist", "zoomTime"] }] },
  });

  W.add("dutch", {
    sliders: [
      ["tipTime", "Time to tip over", [0, 20, "seconds", 0.1], "How many seconds the tilt takes to arrive; 0 is a cut.", { from: 0, to: 2 }],
      ["rockSize", "Size of each rock", [0, 20, "°"], "How many degrees each rock side to side swings.", { from: 0, to: 3 }],
      ["rockRate", "Rocks per minute", [0, 60, "per minute", 1], "How many times a minute it rocks back and forth.", { from: 0, to: 6 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["tipTime", "rockSize", "rockRate"] }] },
  });

  W.add("angleCount", {
    sliders: [
      ["spreadDeg", "Spread around the room", [0, 360, "°"], "How many degrees around the action the setups are spread.", { from: 90, to: 180 }],
      ["nearestM", "Closest setup", [0.3, 10, "m", 0.1], "How many meters from the subject the nearest camera stands.", { from: 1, to: 1 }],
      ["farthestM", "Farthest setup", [1, 100, "m", 0.5], "How many meters from the subject the farthest camera stands.", { from: 5, to: 10 }],
      ["returnShare", "Cuts back to a used setup", [0, 100, "%"], "Share of cuts that go back to an angle already seen.", { from: 30, to: 60 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["spreadDeg", "nearestM", "farthestM", "returnShare"] }] },
  });

  W.add("cameraCarry", {
    sliders: [
      ["wobbleCm", "Wobble size", [0, 20, "cm", 0.5], "How many centimeters the camera wanders as it is held.", { from: 0, to: 2 }],
      ["wobbleDeg", "Wobble in angle", [0, 10, "°", 0.5], "How many degrees the picture sways.", { from: 0, to: 1 }],
      ["driftSpeed", "Drift speed", [0, 50, "cm per second", 1], "How many centimeters a second the frame slowly slides off its mark.", { from: 0, to: 5 }],
      ["breathRate", "Breaths per minute", [0, 30, "per minute", 1], "How often the operator's breathing lifts the camera.", { from: 0, to: 12 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["wobbleCm", "wobbleDeg", "driftSpeed", "breathRate"] }] },
  });

  W.add("moveSpeed", {
    sliders: [
      ["metersPerSec", "Travel speed", [0, 10, "m per second", 0.05], "How many meters a second the camera moves.", { from: 0.2, to: 0.5 }],
      ["degPerSec", "Turning speed", [0, 360, "° per second", 1], "How many degrees a second the camera swings.", { from: 5, to: 15 }],
      ["easeTime", "Time to get up to speed", [0, 10, "seconds", 0.1], "How many seconds it takes to speed up from rest, or slow to a stop.", { from: 0.5, to: 1 }],
      ["vsSubject", "Compared with the subject", [25, 400, "%", 5], "The camera's speed as a share of the subject's; 100 keeps pace.", { from: 100, to: 100 }],
    ],
    window: {
      faces: [{ face: "pad", x: "metersPerSec", y: "degPerSec", xLabel: "travels", yLabel: "turns" }],
      groups: [{ label: "Measured", sliders: ["metersPerSec", "degPerSec", "easeTime", "vsSubject"] }],
    },
  });

  W.add("moveOn", {
    sliders: [
      ["restTime", "Rest between moves", [0, 60, "seconds", 1], "The fewest seconds the camera stays still before it may move again.", { from: 3, to: 8 }],
      ["cueStrength", "How big a cue it needs", [0, 100, "%"], "How strong the line or action must be, compared with the rest of the scene, to start a move.", { from: 30, to: 60 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["restTime", "cueStrength"] }] },
  });

  W.add("objectSpeed", {
    sliders: [
      ["metersPerSec", "Travel speed", [0, 50, "m per second", 0.1], "How many meters a second the object moves.", { from: 0.5, to: 2 }],
      ["crossTime", "Time to cross the frame", [0.1, 20, "seconds", 0.1], "How many seconds it takes to go from one edge of the frame to the other.", { from: 1, to: 3 }],
      ["stopTime", "Time to stop", [0, 5, "seconds", 0.05], "How many seconds it takes to come to rest.", { from: 0.2, to: 0.5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["metersPerSec", "crossTime", "stopTime"] }] },
  });

  W.add("depthOfField", {
    sliders: [
      ["sharpDepth", "Depth of the sharp zone", [0.01, 50, "m", 0.01], "How many meters deep the zone of sharpness is, front to back.", { from: 0.2, to: 1 }],
      ["focusM", "Focus distance", [0.2, 50, "m", 0.05], "How many meters from the lens the sharp zone is centered.", { from: 1.5, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["sharpDepth", "focusM"] }] },
  });

  W.add("motionBlur", {
    sliders: [
      ["smearLength", "Length of the smear", [0, 50, "%"], "How long a moving thing's blur trail is, as a share of the frame's width.", { from: 0, to: 5 }],
      ["frameRate", "Frames per second", [12, 120, "fps", 1], "How many pictures a second; fewer feels choppier.", { from: 24, to: 24 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["smearLength", "frameRate"] }] },
  });

  W.add("aspect", {
    sliders: [
      ["barSize", "Bar thickness", [0, 30, "%"], "How much of the frame's height each black bar covers.", { from: 0, to: 12 }],
      ["openTime", "Time to open up", [0, 20, "seconds", 0.1], "How many seconds the frame takes to change shape; 0 is a cut.", { from: 0, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["barSize", "openTime"] }] },
  });

  W.add("composition", {
    sliders: [
      ["placedPart", "Placing", ["their eyes", "their face", "their whole body", "an object"], "Which point of the subject is put on the spot.", { unordered: true }],
      ["xPct", "Across the frame", [0, 100, "%"], "How far across the frame it sits, from the left edge.", { from: 33, to: 33 }],
      ["yPct", "Up the frame", [0, 100, "%"], "How high in the frame it sits, from the bottom.", { from: 67, to: 67 }],
      ["lookRoom", "Room in front of the face", [0, 80, "%"], "Share of the frame's width left open in the direction they look.", { from: 10, to: 30 }],
      ["moveTime", "Time to move across", [0, 30, "seconds", 0.5], "How many seconds a change of place in frame takes; 0 is a cut.", { from: 0, to: 5 }],
    ],
    window: {
      faces: [{ face: "frame", x: "xPct", y: "yPct" }],
      groups: [{ label: "Measured", sliders: ["placedPart", "xPct", "yPct", "lookRoom", "moveTime"] }],
      presets: [{ label: "Eyes on the top third", plain: "Eyes a third in from the left and two thirds up.", set: { placedPart: "their eyes", xPct: 33, yPct: 67 } }],
    },
  });

  W.add("emptySpace", {
    sliders: [
      ["emptyX", "Emptiness, across", [0, 100, "%"], "How far across the frame the middle of the empty space is, from the left.", { from: 70, to: 70 }],
      ["emptyY", "Emptiness, up", [0, 100, "%"], "How high in the frame the middle of the empty space is, from the bottom.", { from: 60, to: 60 }],
      ["fillTime", "Time until it fills", [0, 60, "seconds", 1], "How many seconds the space stays empty before something enters it.", { from: 10, to: 20 }],
    ],
    window: {
      faces: [{ face: "pad", x: "emptyX", y: "emptyY", xLabel: "across", yLabel: "up" }],
      groups: [{ label: "Measured", sliders: ["emptyX", "emptyY", "fillTime"] }],
    },
  });

  W.add("moveToVolume", {
    sliders: [
      ["thresholdDb", "Loudness that starts it", [-40, 0, "dB", 1], "How loud a voice must get, in decibels below the loudest, before the camera moves.", { from: -12, to: -12 }],
      ["moveSize", "Size change per loud moment", [0, 100, "%"], "How much bigger or smaller the subject gets in frame on each loud moment.", { from: 5, to: 15 }],
      ["settleTime", "Time to settle", [0, 20, "seconds", 0.1], "How many seconds the camera takes to come to rest after the noise.", { from: 1, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["thresholdDb", "moveSize", "settleTime"] }] },
  });

  W.add("foreshortening", {
    sliders: [
      ["nearM", "Near thing from the lens", [0.05, 3, "m", 0.05], "How many meters from the lens the reaching hand or object is.", { from: 0.5, to: 0.3 }],
      ["nearSize", "Near thing's size in frame", [5, 300, "%"], "How much of the frame's height the near thing fills.", { from: 30, to: 60 }],
      ["sizeRatio", "Bigger than the face by", [1, 20, "times", 0.5], "How many times bigger the near thing looks than the face behind it.", { from: 1.5, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["nearM", "nearSize", "sizeRatio"] }] },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
