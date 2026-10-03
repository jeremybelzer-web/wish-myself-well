/* Text, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z).
   Places in the frame are % across (0 = left edge, 100 = right) and % up (0 = bottom, 100 = top);
   sizes are % of the frame's height. */
(function (W) {
  W.add("onScreenText", {
    sliders: [
      ["anchoredTo", "Placed against", ["the frame", "a person", "an object", "the horizon"], "What the words are pinned to: the picture itself, or something in it that moves.", { unordered: true }],
      ["textHeight", "Letter height", [1, 40, "%"], "How tall the capital letters are as a share of the frame's height.", { from: 6, to: 6 }],
      ["textAcross", "Where across", [0, 100, "%"], "The middle of the words, from the left edge (0) to the right (100).", { from: 50, to: 50 }],
      ["textUp", "Where up", [0, 100, "%"], "The middle of the words, from the bottom (0) to the top (100).", { from: 15, to: 15 }],
      ["animIn", "Seconds to animate in", [0, 3, "s", 0.1], "How long the entrance animation runs.", { from: 0.3, to: 0.3 }],
    ],
    window: {
      faces: [{ face: "pad", x: "textAcross", y: "textUp", xLabel: "left to right", yLabel: "bottom to top" }],
      groups: [{ label: "Measured", sliders: ["anchoredTo", "textHeight", "textAcross", "textUp", "animIn"] }],
      presets: [{ label: "Name tag beside a person", plain: "Small words pinned next to someone, lower left.", set: { anchoredTo: "a person", textHeight: 4, textAcross: 25, textUp: 25, animIn: 0.4 } }],
    },
  });

  W.add("moodEffect", {
    sliders: [
      ["sizeVsFace", "Size against the face", [10, 300, "%"], "How big the sticker is compared with the face it sits on; 100 is face-sized.", { from: 50, to: 50 }],
      ["sideOffset", "Left or right of the face", [-150, 150, "%"], "How far the sticker sits beside the face, in face widths; 0 is centered.", { from: 0, to: 0 }],
      ["heightOffset", "Above or below the face", [-150, 150, "%"], "How far above (positive) or below the face it sits, in face heights.", { from: 60, to: 60 }],
      ["landsAt", "Arrives before or after the line", [-3, 3, "s", 0.1], "Seconds from the line to the sticker appearing; below zero is before it.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [{ face: "pad", x: "sideOffset", y: "heightOffset", xLabel: "left to right of the face", yLabel: "below to above" }],
      groups: [{ label: "Measured", sliders: ["sizeVsFace", "sideOffset", "heightOffset", "landsAt"] }],
      presets: [{ label: "Light bulb over the head", plain: "Small, just above the head, the instant the idea lands.", set: { sizeVsFace: 40, sideOffset: 0, heightOffset: 90, landsAt: 0 } }],
    },
  });

  W.add("endCard", {
    sliders: [
      ["fadeSeconds", "Seconds to fade in", [0, 5, "s", 0.1], "How long the card takes to appear.", { from: 1, to: 1 }],
      ["cardTextHeight", "Letter height", [2, 40, "%"], "How tall the words are as a share of the frame's height.", { from: 10, to: 10 }],
      ["stingerAfter", "Wait before the extra moment", [0, 60, "s"], "Seconds between the card and any last scene after it.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fadeSeconds", "cardTextHeight", "stingerAfter"] }] },
  });

  W.add("chapterCard", {
    sliders: [
      ["fadeSeconds", "Seconds to fade in", [0, 5, "s", 0.1], "How long the card takes to appear.", { from: 0.5, to: 0.5 }],
      ["cardTextHeight", "Letter height", [2, 40, "%"], "How tall the words are as a share of the frame's height.", { from: 10, to: 10 }],
      ["minutesApart", "Minutes between chapters", [0.5, 60, "min", 0.5], "Running time from one chapter card to the next.", { from: 10, to: 10 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fadeSeconds", "cardTextHeight", "minutesApart"] }] },
  });

  W.add("captions", {
    sliders: [
      ["capHeight", "Letter height", [2, 15, "%", 0.5], "How tall the caption letters are as a share of the frame's height.", { from: 5, to: 5 }],
      ["capUp", "Height from the bottom", [0, 100, "%"], "Where the caption line sits, from the bottom edge (0) to the top (100).", { from: 10, to: 10 }],
      ["capLead", "Ahead of or behind the voice", [-1, 1, "s", 0.05], "Seconds the words appear before (negative) or after the voice says them.", { from: 0, to: 0 }],
      ["maxLines", "Lines at once", [1, 3, "lines"], "How many lines of caption can be on screen together.", { from: 2, to: 2 }],
      ["readSpeed", "Reading speed", [5, 25, "characters per second"], "How fast viewers must read to keep up; about 15 is comfortable.", { from: 15, to: 15 }],
    ],
    window: {
      faces: [{ face: "dial", slider: "readSpeed" }],
      groups: [{ label: "Measured", sliders: ["capHeight", "capUp", "capLead", "maxLines", "readSpeed"] }],
      presets: [{ label: "Short-form punch captions", plain: "Big, one line, middle of the frame, fast.", set: { capHeight: 9, capUp: 45, capLead: 0, maxLines: 1, readSpeed: 20 } }],
    },
  });

  W.add("stickers", {
    sliders: [
      ["stickerHeight", "Sticker size in frame", [2, 60, "%"], "How tall the sticker is as a share of the frame's height.", { from: 12, to: 12 }],
      ["stickerAcross", "Where across", [0, 100, "%"], "From the left edge (0) to the right (100).", { from: 70, to: 70 }],
      ["stickerUp", "Where up", [0, 100, "%"], "From the bottom (0) to the top (100).", { from: 70, to: 70 }],
      ["tilt", "Tilt", [-45, 45, "°"], "How far the sticker leans; 0 is level.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [{ face: "frame", x: "stickerAcross", y: "stickerUp", size: "stickerHeight" }],
      groups: [{ label: "Measured", sliders: ["stickerHeight", "stickerAcross", "stickerUp", "tilt"] }],
    },
  });

  W.add("textStyle", {
    sliders: [
      ["shadowAngle", "Shadow direction", [0, 360, "°"], "Which way the shadow falls: 0 up, 90 right, 180 down, 270 left.", { from: 135, to: 135 }],
      ["shadowOffset", "Shadow distance", [0, 20, "px"], "How far the shadow sits from the letters.", { from: 3, to: 3 }],
      ["boxOpacity", "How solid the box is", [0, 100, "%"], "How solid the background box is; 0 is invisible.", { from: 0, to: 60 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["shadowAngle", "shadowOffset", "boxOpacity"] }] },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
