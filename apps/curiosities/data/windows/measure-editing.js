/* Editing, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  const U = { unordered: true };
  const d = (from, to) => ({ from, to: to == null ? from : to });
  const measured = (sliders, extra) => ({ sliders, window: Object.assign({ groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }] }, extra || {}) });
  const add = (id, sliders, extra) => W.add(id, measured(sliders, extra));

  add("tensionCurve", [
    ["buildTime", "How long it builds", [5, 600, "s"], "Seconds from calm to the tense high point.", d(60)],
    ["peakHold", "How long the peak lasts", [0, 60, "s"], "Seconds the tension stays at its highest before it breaks.", d(5)],
    ["tensionFrom", "Where the tension comes from", ["a threat", "a secret", "a ticking clock", "a person", "the unknown"], "What the audience is worried about.", U],
  ]);

  add("reveal", [
    ["aheadBy", "Audience ahead by", [-30, 30, "min"], "Minutes the audience knows before the characters (minus means after them).", d(0)],
    ["aheadOf", "Ahead or behind whom", ["the hero", "the villain", "everyone on screen", "a side character"], "Which character the audience's knowledge is compared with.", U],
    ["revealLength", "How long the reveal takes", [0, 60, "s"], "Seconds from the first sign of the truth to the full picture.", d(5)],
    ["reactionHold", "Time on the reaction", [0, 20, "s"], "Seconds we watch a face take in the news.", d(3)],
  ], { presets: [{ label: "Hitchcock's bomb", plain: "We see the bomb ten minutes before anyone on screen.", set: { setting: "before", aheadBy: 10, aheadOf: "everyone on screen" } }] });

  add("mains", [
    ["introducedBy", "All met by", [0, 20, "min"], "Minutes into the hour by which every featured main has appeared.", d(5)],
    ["longestAway", "Longest stretch without one", [0, 30, "min"], "The most minutes in a row a featured main is off screen.", d(10)],
  ]);

  add("exit", [
    ["firstHint", "First hint, before the exit", [0, 60, "min"], "Minutes between the first sign they might go and the going.", d(10)],
    ["seenBy", "Who sees them go", ["nobody", "one main", "the whole group", "only the audience"], "Who in the story witnesses the exit.", U],
    ["onScreen", "Seen or told", ["on screen", "just off screen", "told afterwards"], "Whether we watch the exit or only hear about it."],
  ]);

  add("intercut", [
    ["storylines", "Storylines cut between", [2, 6, "", 1], "How many separate storylines take turns.", d(2)],
    ["switchesPerMin", "Switches per minute", [0, 20, "per min"], "How often the edit jumps to another storyline.", d(2, 8)],
    ["finalDwell", "Time per storyline at the peak", [0.5, 30, "s"], "Seconds we stay with each storyline when the cutting is fastest.", d(3)],
    ["leadShare", "Time on the main storyline", [0, 100, "%"], "The main storyline's share of the cross-cut stretch.", d(50)],
  ], { faces: [{ face: "pad", x: "dwell", y: "finalDwell", xLabel: "Time with each, at first", yLabel: "Time with each, at the peak" }] });

  add("povSwitch", [
    ["mainShare", "Time with the main person", [0, 100, "%"], "How much of the story is told through the main person.", d(60)],
    ["switchesPerHour", "Switches per hour", [0, 60, "per hour"], "How many times the story changes whose eyes we follow.", d(6)],
    ["shortestStay", "Shortest stay with someone", [0.5, 20, "min"], "The fewest minutes we spend with one person before moving on.", d(3)],
  ]);

  add("sceneEnding", [
    ["lastShotLength", "Length of the last shot", [0.5, 30, "s"], "Seconds the scene's final shot runs.", d(3)],
    ["soundTail", "Sound carries over by", [0, 10, "s"], "Seconds the scene's sound keeps going into the next one.", d(0)],
    ["endsOn", "Ends on", ["a face", "an object", "the place", "black"], "What the last frame shows.", U],
  ]);

  add("openingGrab", [
    ["firstCutAt", "First cut at", [0, 30, "s"], "Seconds before the opening shot cuts to the next.", d(3)],
    ["questionAnswered", "Opening question answered by", [0, 120, "min"], "Minutes before the film answers what the opening made us ask.", d(30)],
    ["titleAt", "Title appears at", [0, 600, "s"], "Seconds into the film when the title shows.", d(60)],
  ]);

  add("groups", [
    ["groupSize", "People in each group", [2, 20, "people", 1], "How many people make up a group.", d(5)],
    ["bridge", "Who links the groups", ["nobody", "a main", "a side character", "a messenger"], "The person who carries news or trouble from one group to the other.", U],
  ]);

  add("featureRate", [
    ["seasonHours", "Hours in the season", [4, 26, "hours", 1], "How many hours (episodes) the season has, to count against.", d(10)],
    ["screenShare", "Screen time when present", [0, 100, "%"], "A main's share of an hour they are in.", d(30)],
  ]);

  add("sceneRate", [
    ["paceChangeTime", "Time to reach the new pace", [0, 30, "min"], "Minutes the film takes to move from one rate of scene changes to the next.", d(5)],
  ]);

  add("sceneEntry", [
    ["firstLineAt", "First line spoken at", [0, 60, "s"], "Seconds into the scene before anyone speaks.", d(2)],
    ["firstShotLength", "Length of the first shot", [0.5, 60, "s"], "Seconds the scene's opening shot runs.", d(4)],
  ]);

  add("hook", [
    ["secondsEach", "Seconds on screen each time", [0.5, 30, "s"], "How long the signature image or line lasts on each return.", d(3)],
    ["minutesBetween", "Minutes between returns", [1, 60, "min"], "Typical gap from one return to the next.", d(15)],
    ["frameShare", "How big in the frame", [5, 100, "%"], "How much of the frame's height the image fills when it returns.", d(50)],
  ]);

  add("energyArc", [
    ["peakCount", "High points", [1, 10, "", 1], "How many times the energy reaches a peak.", d(3)],
    ["climbTime", "Time to climb to a peak", [0, 20, "min"], "Minutes from a low point up to the next high.", d(5)],
  ]);

  add("psychOut", [
    ["firstClueAt", "First clue comes after", [0, 60, "s"], "Seconds into the fake before the first hint that it isn't real.", d(5)],
    ["whoseMind", "Whose fantasy it is", ["the hero", "a side character", "the audience only", "nobody, a trick of the edit"], "Whose imagination or fear the fake comes from.", U],
    ["snapTime", "Time to snap back", [0, 5, "s"], "Seconds the return to reality takes; zero is a hard cut.", d(0)],
  ]);

  add("shotOrderLens", [
    ["shortestShot", "Shortest shot", [0.2, 10, "s"], "Seconds the briefest shot in the stretch lasts.", d(1)],
    ["longestShot", "Longest shot", [1, 120, "s"], "Seconds the longest shot in the stretch lasts.", d(8)],
    ["leadBy", "Sound leads by", [-3, 3, "s"], "Seconds the sound arrives before the picture (minus means after it).", d(0)],
    ["eyeJump", "Eye jump between shots", [0, 100, "%"], "How far across the frame the important thing moves from one shot to the next.", d(10)],
  ], { faces: [{ face: "pad", x: "shortestShot", y: "longestShot", xLabel: "Shortest shot", yLabel: "Longest shot" }] });

  add("phraseScheme", [
    ["runLength", "Length of a run", [2, 60, "s"], "Seconds one run of related shots lasts.", d(8)],
    ["runsPerScene", "Runs per scene", [1, 20, "", 1], "How many runs of shots make up a scene.", d(4)],
  ]);

  add("transition", [
    ["soundEarly", "Sound arrives early by", [0, 5, "s"], "Seconds the next scene's sound starts before its picture.", d(0)],
    ["matchOffset", "Matched shapes sit apart", [0, 50, "%"], "How far apart, across the frame, the two matched shapes sit; zero is a perfect match.", d(5)],
  ]);

  add("callResponse", [
    ["answerGap", "Seconds before the answer", [0, 30, "s"], "Time between the call and the shot that answers it.", d(2)],
    ["exchanges", "Calls and answers in a row", [1, 20, "", 1], "How many back-and-forths run before the pattern stops.", d(3)],
    ["eyeline", "Looks across the cut", ["away from each other", "the same way", "toward each other"], "Which way the caller and answerer face on screen."],
  ]);

  add("repetition", [
    ["returnLength", "Seconds on screen each time", [0.5, 30, "s"], "How long the image lasts each time it returns.", d(3)],
  ]);

  add("contrastMap", [
    ["sideShare", "Time on the first side", [0, 100, "%"], "How the running time splits between the two sides of the pair, such as quiet against loud.", d(50)],
  ]);

  add("cutArticulation", [
    ["overlapWay", "Which way sound overlaps", ["next sound leads in", "last sound trails out", "both"], "Whether the overlap comes from the shot ahead or the shot behind."],
    ["clipFrames", "Frames cut off the action", [0, 24, "frames"], "How much of a movement is cut away when a shot ends early (24 frames make one second).", d(4)],
  ]);

  add("motifShape", [
    ["returnGap", "Minutes between returns", [1, 60, "min"], "Typical time from one appearance of the motif to the next.", d(10)],
  ]);

  add("sceneLength", [
    ["shortestMin", "Shortest scene", [0.1, 10, "min"], "Minutes the briefest scene runs.", d(0.5)],
    ["longestMin", "Longest scene", [1, 30, "min"], "Minutes the longest scene runs.", d(6)],
  ]);

  add("timeLens", [
    ["speedPct", "Playing speed", [0, 1000, "%"], "How fast the picture plays: 100 is real time, 50 half speed, 0 a freeze.", d(100)],
    ["rampTime", "Seconds to change speed", [0, 5, "s"], "How long it takes to ease from one speed to the other; zero is a jump.", d(0.5)],
  ], { presets: [{ label: "Bullet-time hit", plain: "Glide into a quarter speed for the impact.", set: { speedPct: 25, rampTime: 1, holdLength: 2 } }] });

  add("reframe", [
    ["faceAcross", "Face lands, across", [0, 100, "%"], "Where the face ends up across the new frame, from left edge to right.", d(50)],
    ["faceUp", "Face lands, up", [0, 100, "%"], "How high the face ends up in the new frame, from bottom to top.", d(66)],
  ], { faces: [{ face: "pad", x: "faceAcross", y: "faceUp", xLabel: "Across", yLabel: "Up" }] });

  add("cameraEffect", [
    ["perMinute", "Times per minute", [0, 30, "per min"], "How often the added move happens.", d(2)],
    ["hitOffset", "Before or after the hit", [-1, 1, "s", 0.05], "Seconds the move lands ahead of the moment it's timed to (minus means early).", d(0)],
  ]);

  add("frameMove3D", [
    ["turnAngle", "How far it turns", [0, 360, "°"], "Degrees the frame swings around as it moves.", d(90)],
    ["tiltAngle", "Tilt toward us", [-90, 90, "°"], "Degrees the frame leans toward the viewer (minus leans away).", d(0)],
  ]);

  add("multicamSwitch", [
    ["leadTime", "Switch ahead of the voice", [-2, 2, "s", 0.1], "Seconds the switch lands before the speaker starts (minus means after).", d(0)],
    ["cameraSpread", "Cameras spread around", [0, 360, "°"], "Degrees around the subject that the cameras cover between them.", d(90)],
    ["shortestHold", "Shortest time on an angle", [0.5, 10, "s"], "Fewest seconds any angle stays up.", d(2)],
  ]);

  add("nestedScene", [
    ["reuseGap", "Minutes between uses", [0, 60, "min"], "Time between one appearance of the packed piece and the next.", d(10)],
  ]);

  add("editFocus", [
    ["sharpDistance", "Distance to what's sharp", [0.3, 30, "m"], "Meters from the camera to the person or thing in focus.", d(2)],
  ]);

  add("pedal", [
    ["heldShare", "Held thing's share of attention", [0, 100, "%"], "How much of the scene's attention the unchanging element takes.", d(20)],
  ]);

  add("operatorFeel", [
    ["swayDegrees", "Frame sway", [0, 10, "°"], "Degrees the frame drifts left, right or tilts as a person holds it.", d(1)],
    ["breathsPerMin", "Breaths per minute", [6, 30, "per min"], "How quickly the camera's gentle rise and fall repeats.", d(12)],
    ["findLate", "Finds the subject late by", [0, 2, "s", 0.1], "Seconds the frame lags behind a person who moves.", d(0.3)],
  ]);

  add("loopEnding", [
    ["loopLength", "Length of the loop", [3, 600, "s"], "Seconds from the first moment to the last before it starts again.", d(15)],
    ["matchClose", "How closely the ends match", [0, 100, "%"], "How alike the last frame and the first frame are.", d(90)],
  ]);

  add("imageTransform", [
    ["pivotAcross", "Turns around, across", [0, 100, "%"], "Where across the frame the picture spins around, from left to right.", d(50)],
    ["pivotUp", "Turns around, up", [0, 100, "%"], "How high in the frame the picture spins around, from bottom to top.", d(50)],
  ]);

  add("stabilization", [
    ["smoothTime", "Smoothing window", [0, 5, "s", 0.1], "Seconds of camera movement averaged together; longer is smoother and floatier.", d(1)],
  ]);

  add("canvasFill", [
    ["clipAcross", "Clip sits, across", [0, 100, "%"], "Where the clip sits across the frame, from left to right.", d(50)],
    ["clipUp", "Clip sits, up", [0, 100, "%"], "How high the clip sits in the frame, from bottom to top.", d(50)],
  ], { faces: [{ face: "pad", x: "clipAcross", y: "clipUp", xLabel: "Across", yLabel: "Up" }] });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
