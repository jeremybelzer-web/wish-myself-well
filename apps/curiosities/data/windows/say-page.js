/* Page: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("pageTurn", {
    "make them turn the page": { setting: "cliffhanger", turnUrge: "must turn", hookSide: "right page" },
    "end the page on a cliffhanger": { setting: "cliffhanger", lastPanel: "a scream", strength: 5 },
    "big reveal on the turn": { setting: "reveal", hookSide: "right page", revealSize: 100 },
    "splash after the turn": { setting: "reveal", revealSize: 100, strength: 4 },
    "they look off panel": { lastPanel: "a look off-panel", turnUrge: "eager" },
    "end on a question": { lastPanel: "a question", turnUrge: "curious" },
    "let the page rest": { setting: "none", lastPanel: "calm", turnUrge: "none" },
    "hook every page": { turnsBetween: 1, turnUrge: "eager" },
  });

  W.say("panelCount", {
    "nine-panel grid": { setting: 8, grid: "strict grid", rowCount: 3 },
    "classic four-panel strip": { setting: 4, rowCount: 1, grid: "strict grid" },
    "one big panel": { setting: 1, rowCount: 1 },
    "manga style": { readFlow: "right to left", grid: "free" },
    "slow the read down": { setting: 2, readPace: "lingering" },
    "rapid fire panels": { setting: 8, readPace: "racing", timePerPanel: 1 },
    "break the grid": { grid: "free", countSwing: "a lot" },
    "same layout every page": { countSwing: "same each page", grid: "strict grid" },
  });

  W.say("gutter", {
    "moment to moment": { setting: "beat", timeSkip: "a moment", closure: "nothing" },
    "jump in time": { setting: "scene", timeSkip: "hours", closure: "a big leap" },
    "years pass between panels": { setting: "scene", timeSkip: "years", closure: "a big leap" },
    "panels touch": { setting: "none", width: 0 },
    "wide gutters": { width: 5 },
    "black gutters for a dark mood": { gutterColor: "black" },
    "slanted panels for action": { gutterSlant: 15, noticeable: "showy" },
    "let the reader fill the gap": { closure: "a big leap", width: 3 },
  });

  W.say("balloon", {
    "a narrator box": { setting: "caption", captionKnows: "everything" },
    "show their thoughts": { innerVoice: "thought bubble" },
    "inner voice in captions": { innerVoice: "caption box", setting: "both" },
    "make them shout": { shape: "jagged", size: 5 },
    "a whisper": { shape: "wavy", size: 1 },
    "robot or radio voice": { shape: "square" },
    "voice from off panel": { tailTo: "off-panel" },
    "let the pictures talk": { setting: "balloon", size: 1, captionKnows: "same as the people" },
  });

  W.say("panelSize", {
    "full-page splash": { setting: "splash", biggestShare: 100 },
    "make the reveal huge": { biggestFor: "the reveal", eyePull: "overwhelming", biggestShare: 80 },
    "widescreen panels": { panelShape: "wide" },
    "tall skinny panels": { panelShape: "tall" },
    "big face close-up": { biggestFor: "a face", setting: "large" },
    "show off the place": { biggestFor: "the place", setting: "large", panelShape: "wide" },
    "mix big and small": { variation: 5, smallestShare: 5 },
    "more dramatic": { variation: 4, eyePull: "strong" },
    "all the same size": { variation: 0, eyePull: "even" },
  });

  W.say("panelBreak", {
    "pop out of the panel": { setting: "edge", howMuch: 3, whatBreaks: "a whole figure" },
    "fist through the border": { setting: "edge", whatBreaks: "a hand", howMuch: 4 },
    "save it for the climax": { savedFor: "the climax" },
    "break the frame for action": { savedFor: "action beats", breaksPerPage: 2 },
    "explode out of the page": { setting: "splash", whatBreaks: "an effect", howMuch: 5 },
    "stay inside the lines": { setting: "none", howMuch: 0, breaksPerPage: 0 },
    "more energy": { howMuch: 4, breaksPerPage: 3, noticeable: "showy" },
  });

  W.say("textDensity", {
    "let the art speak": { setting: "none", words: 0, silentRun: 6 },
    "a silent page": { setting: "none", silentRun: 6, balloonsPerPanel: 0 },
    "talky": { setting: "many", words: 60, balloonsPerPanel: 4 },
    "trim the dialogue": { setting: "few", words: 15 },
    "a quick read": { readTime: "quick", words: 12 },
    "slow dense read": { readTime: "slow", words: 70 },
    "one line per panel": { setting: "few", balloonsPerPanel: 1 },
    "less text more picture": { textShare: 10, setting: "few" },
  });

  W.say("soundLettering", {
    "big kaboom": { setting: "page-sized", style: "explosive", size: 5, soundColor: "red" },
    "make it louder": { size: 5, style: "explosive" },
    "quiet little sounds": { setting: "small", size: 1, style: "clean" },
    "hand-lettered": { style: "hand-drawn" },
    "sound in the drawing": { inPicture: "woven into the art" },
    "sound in a box": { inPicture: "in a box" },
    "across the whole page": { spread: "a whole page", setting: "page-sized" },
    "no sound effects": { setting: "none", soundsPerPage: 0 },
    "pow pow pow": { soundsPerPage: 6, style: "explosive", letterTilt: 20 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
