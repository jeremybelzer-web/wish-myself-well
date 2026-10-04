/* Transitions, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  W.add("matchCut", {
    sliders: [
      ["lineUp", "How much the shapes line up", [0, 100, "%"], "How much of the matched shape or movement sits on the same spot in both shots.", { from: 60, to: 90 }],
      ["matchX", "Where the match sits, across", [0, 100, "%"], "How far across the frame the shared thing sits, from the left.", { from: 50, to: 50 }],
      ["matchY", "Where the match sits, up", [0, 100, "%"], "How high in the frame the shared thing sits, from the bottom.", { from: 50, to: 50 }],
    ],
    window: {
      faces: [{ face: "pad", x: "matchX", y: "matchY", xLabel: "across", yLabel: "up" }],
      groups: [{ label: "Measured", sliders: ["lineUp", "matchX", "matchY"] }],
    },
  });

  W.add("transitionKind", {
    sliders: [
      ["exactDirection", "Exact direction", [0, 360, "°"], "Which way the wipe, push or whip travels: 0 up, 90 right, 180 down, 270 left.", { from: 90, to: 90 }],
      ["beatOffset", "Early or late on the beat", [-12, 12, "frames", 1], "How many frames before (minus) or after (plus) the music's beat the transition lands.", { from: 0, to: 0 }],
      ["soundOffset", "Sound ahead or behind", [-2, 2, "seconds", 0.05], "Seconds the next shot's sound starts before (minus) or after (plus) its picture.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["exactDirection", "beatOffset", "soundOffset"] }] },
  });

  W.add("fadeEdge", {
    sliders: [
      ["fadeDepth", "How far it fades", [0, 100, "%"], "How much of the picture is lost; 100 is all the way to the color.", { from: 100, to: 100 }],
      ["soundLead", "Sound before or after the picture", [-3, 3, "seconds", 0.1], "Seconds the sound fades before (minus) or after (plus) the picture.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fadeDepth", "soundLead"] }] },
  });

  W.add("transitionFamily", {
    sliders: [
      ["typicalLength", "Typical length", [0, 3, "seconds", 0.05], "How many seconds a transition in this family usually lasts.", { from: 0.3, to: 0.6 }],
      ["flashBright", "Flash brightness", [0, 100, "%"], "How bright the flash or light leak gets, compared with the shot around it.", { from: 0, to: 40 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["typicalLength", "flashBright"] }] },
  });

  W.add("introOutro", {
    sliders: [
      ["hookTime", "Time to the first hook", [0, 30, "seconds", 0.5], "How many seconds before something grabs the viewer.", { from: 1, to: 3 }],
      ["titleSize", "Title size", [0, 100, "%"], "How much of the frame's height the title's letters fill.", { from: 10, to: 20 }],
      ["titleHold", "Title stays", [0, 10, "seconds", 0.5], "How many seconds the title stays on screen.", { from: 1.5, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["hookTime", "titleSize", "titleHold"] }] },
  });

  W.add("clipAnimation", {
    sliders: [
      ["travel", "How far it moves", [0, 100, "%"], "How far the clip slides in or out, as a share of the frame's width.", { from: 0, to: 20 }],
      ["spinDeg", "How far it turns", [0, 720, "°"], "How many degrees the clip spins as it comes or goes.", { from: 0, to: 0 }],
      ["startSize", "Starting size", [0, 300, "%"], "How big the clip starts compared with full size; 100 is full size.", { from: 80, to: 100 }],
      ["cueOffset", "Early or late on its cue", [-12, 12, "frames", 1], "How many frames before (minus) or after (plus) the beat or word it starts.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [{ face: "pad", x: "travel", y: "startSize", xLabel: "slides", yLabel: "size" }],
      groups: [{ label: "Measured", sliders: ["travel", "spinDeg", "startSize", "cueOffset"] }],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
