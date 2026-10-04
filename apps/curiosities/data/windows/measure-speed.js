/* Speed, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  W.add("freezeFrame", {
    sliders: [
      ["slowInto", "Slows before freezing", [0, 2, "seconds", 0.05], "How many seconds the clip slows down before it stops; 0 stops dead.", { from: 0, to: 0.3 }],
      ["freezes", "Freezes per scene", [0, 10, "times", 1], "How many times the picture freezes in the scene.", { from: 0, to: 1 }],
      ["zoomX", "Zooms toward, across", [0, 100, "%"], "How far across the frame the zoom heads, from the left.", { from: 50, to: 50 }],
      ["zoomY", "Zooms toward, up", [0, 100, "%"], "How high in the frame the zoom heads, from the bottom.", { from: 60, to: 60 }],
    ],
    window: {
      faces: [{ face: "frame", x: "zoomX", y: "zoomY" }],
      groups: [{ label: "Measured", sliders: ["slowInto", "freezes", "zoomX", "zoomY"] }],
    },
  });

  W.add("pacingCurve", {
    sliders: [
      ["startCuts", "Cuts per minute at the start", [1, 120, "per minute", 1], "How many cuts a minute when the scene begins.", { from: 8, to: 8 }],
      ["peakCuts", "Cuts per minute at the peak", [1, 120, "per minute", 1], "How many cuts a minute at the fastest moment.", { from: 30, to: 30 }],
      ["pauseLength", "Length of each pause", [0, 10, "seconds", 0.5], "How many seconds each breathing pause lasts.", { from: 1, to: 2 }],
    ],
    window: {
      faces: [{ face: "pad", x: "startCuts", y: "peakCuts", xLabel: "start", yLabel: "peak" }],
      groups: [{ label: "Measured", sliders: ["startCuts", "peakCuts", "pauseLength"] }],
    },
  });

  W.add("attentionReset", {
    sliders: [
      ["everySec", "Seconds between new things", [0.5, 60, "seconds", 0.5], "How many seconds, on average, before something new appears.", { from: 3, to: 5 }],
      ["longestGap", "Longest gap allowed", [1, 120, "seconds", 1], "The most seconds the film may go with nothing new.", { from: 8, to: 15 }],
      ["jolt", "How big each new thing is", [0, 100, "%"], "How strong each new thing is, compared with the rest of the scene.", { from: 20, to: 50 }],
    ],
    window: {
      faces: [{ face: "dial", slider: "everySec" }],
      groups: [{ label: "Measured", sliders: ["everySec", "longestGap", "jolt"] }],
    },
  });

  W.add("clipSpeed", {
    sliders: [
      ["changeTime", "Time to change speed", [0, 5, "seconds", 0.05], "How many seconds the speed takes to slide to its new value; 0 jumps.", { from: 0, to: 0.5 }],
      ["pitchShift", "Voice pitch shift", [-12, 12, "semitones", 1], "How many musical steps the voice goes up (plus) or down (minus).", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["changeTime", "pitchShift"] }] },
  });

  W.add("playDirection", {
    sliders: [
      ["rewindPct", "Rewind speed", [100, 1600, "%", 10], "How fast the rewind runs compared with normal speed.", { from: 400, to: 400 }],
      ["replayPct", "Replay speed", [10, 400, "%", 5], "How fast the replay plays compared with normal speed.", { from: 50, to: 50 }],
      ["replayGap", "Pause before the replay", [0, 3, "seconds", 0.1], "How many seconds of stillness before the replay starts.", { from: 0.2, to: 0.5 }],
      ["replayTurn", "New angle turns by", [0, 180, "°"], "How many degrees around the action the replay's camera moves.", { from: 0, to: 45 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["rewindPct", "replayPct", "replayGap", "replayTurn"] }] },
  });

  W.add("beatSync", {
    sliders: [
      ["onBeatShare", "Cuts on the beat", [0, 100, "%"], "Share of cuts that land on a beat.", { from: 50, to: 90 }],
      ["jitter", "How loose, in frames", [0, 6, "frames", 1], "How many frames each cut may wander from the beat.", { from: 0, to: 2 }],
      ["dropSpeedup", "Cutting before the drop", [100, 400, "%", 10], "How much faster the cutting gets just before the drop; 100 is no change.", { from: 100, to: 200 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["onBeatShare", "jitter", "dropSpeedup"] }] },
  });

  W.add("jumpCut", {
    sliders: [
      ["punchIn", "Punch-in size", [0, 50, "%"], "How much bigger the picture gets on each jump.", { from: 0, to: 10 }],
      ["sideShift", "Sideways shift", [0, 30, "%"], "How far the framing slides sideways on each jump, as a share of the frame's width.", { from: 0, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["punchIn", "sideShift"] }] },
  });

  W.add("editTemplate", {
    sliders: [
      ["totalLength", "Whole edit length", [3, 180, "seconds", 1], "How many seconds the finished edit runs.", { from: 15, to: 30 }],
      ["bestAt", "Best clip arrives at", [0, 10, "seconds", 0.5], "How many seconds in the strongest clip appears.", { from: 0, to: 0.5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["totalLength", "bestAt"] }] },
  });

  W.add("retimeQuality", {
    sliders: [
      ["slowFactor", "How much slower", [1, 20, "times", 0.5], "How many times slower than real life the clip plays.", { from: 2, to: 4 }],
      ["madeShare", "Frames invented", [0, 95, "%"], "Share of the frames on screen that were made up between real ones.", { from: 0, to: 50 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["slowFactor", "madeShare"] }] },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
