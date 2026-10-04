/* Page: a window for every curiosity whose home is Page on the Screen. */
(function (W) {
  const U = { unordered: true };

  W.add("pageTurn", {
    sliders: [
      ["turnUrge", "Urge to turn the page", ["none", "curious", "eager", "must turn"], "How badly the reader needs to see the next page."],
      ["lastPanel", "Last panel before the turn", ["calm", "a question", "a look off-panel", "a scream"], "What the bottom-corner panel leaves hanging."],
      ["turnsBetween", "Pages between big turns", [1, 10, "pages"], "How many pages pass between one big page-turn moment and the next."],
      ["hookSide", "Which page holds the hook", ["left page", "right page"], "Whether the setup sits on the right page so the payoff hides behind the turn.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "📄", reveal: "🎁", cliffhanger: "🧗" } },
        { face: "ladder", slider: "turnUrge" },
        { face: "dial", slider: "turnsBetween" },
      ],
      groups: [
        { label: "What waits overleaf", sliders: ["setting", "strength", "noticeable"] },
        { label: "Setting up the turn", sliders: ["lastPanel", "hookSide", "turnUrge"] },
        { label: "Over the book", sliders: ["turnsBetween"] },
      ],
      presets: [
        { label: "Tintin page-end cliffhanger", plain: "Every page ends on a danger so you must turn.", set: { setting: "cliffhanger", turnsBetween: 1, turnUrge: "must turn", lastPanel: "a scream", hookSide: "right page" } },
        { label: "Big reveal splash", plain: "A quiet setup, then a full-page surprise overleaf.", set: { setting: "reveal", strength: 5, lastPanel: "a look off-panel", turnsBetween: 8 } },
        { label: "Gentle storybook", plain: "Calm pages that turn without pressure.", set: { setting: "none", turnUrge: "curious", lastPanel: "calm" } },
      ],
    },
  });

  W.add("panelCount", {
    sliders: [
      ["rowCount", "Rows per page", [1, 5, ""], "How many strips of panels stack down the page."],
      ["readFlow", "Reading order", ["left to right", "right to left", "top to bottom"], "Which way the eye travels through the panels.", U],
      ["countSwing", "Panel count from page to page", ["same each page", "a little", "a lot"], "How much the number of panels changes between pages."],
      ["readPace", "Reading speed it gives", ["lingering", "steady", "brisk", "racing"], "How fast the panel count makes the reader move."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "grid", icons: { free: "🌀", "loose grid": "🔲", "strict grid": "▦" } },
        { face: "ladder", slider: "readPace" },
      ],
      groups: [
        { label: "How many", sliders: ["setting", "rowCount", "readPace"] },
        { label: "Layout", sliders: ["grid", "readFlow"] },
        { label: "Over the book", sliders: ["countSwing", "change"] },
      ],
      presets: [
        { label: "Strict grid (Watchmen)", plain: "Many even panels in a tight, steady grid.", set: { setting: 8, grid: "strict grid", rowCount: 3, countSwing: "same each page", readPace: "steady" } },
        { label: "Newspaper strip", plain: "One row, a handful of panels, read left to right.", set: { setting: 4, rowCount: 1, grid: "strict grid", readFlow: "left to right" } },
        { label: "Manga action rush", plain: "Free layout, read right to left, racing along.", set: { setting: 6, grid: "free", readFlow: "right to left", readPace: "racing", countSwing: "a lot" } },
      ],
    },
  });

  W.add("gutter", {
    sliders: [
      ["timeSkip", "Time skipped in the gap", ["none", "a moment", "minutes", "hours", "years"], "How much time passes between one panel and the next."],
      ["closure", "What the reader fills in", ["nothing", "a small step", "a big leap"], "How much the reader must imagine to join the two panels."],
      ["gutterColor", "Gutter color", ["white", "black", "a color"], "The color of the gap between panels; black often means the past or the night.", U],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "timeSkip" },
        { face: "swatches", slider: "gutterColor", colors: { white: "#ffffff", black: "#000000", "a color": "#4a90d9" } },
        { face: "dial", slider: "width" },
      ],
      groups: [
        { label: "Time in the gap", sliders: ["setting", "timeSkip", "closure"] },
        { label: "How the gap looks", sliders: ["width", "gutterColor", "noticeable"] },
      ],
      presets: [
        { label: "Moment to moment", plain: "Thin gaps, almost no time lost.", set: { setting: "beat", timeSkip: "a moment", closure: "nothing", width: 1 } },
        { label: "Scene jump", plain: "A wide gap the reader leaps across.", set: { setting: "scene", timeSkip: "hours", closure: "a big leap", width: 4 } },
        { label: "Black-gutter flashback", plain: "Dark gaps that say we are in the past.", set: { gutterColor: "black", timeSkip: "years", closure: "a big leap" } },
      ],
    },
  });

  W.add("balloon", {
    sliders: [
      ["captionKnows", "How much the caption knows", ["same as the people", "a bit more", "everything"], "How far ahead of the characters the narrating box is."],
      ["placement", "Where on the panel", ["top", "middle", "bottom"], "Where the balloon or caption sits in the picture."],
      ["innerVoice", "Inner thoughts shown as", ["not shown", "thought bubble", "caption box"], "How a character's private thoughts appear.", U],
      ["tailTo", "Tail points to", ["the speaker", "off-panel", "no tail"], "Where the little pointer of the balloon leads the eye.", U],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "Speech balloon", right: "Narrating caption" },
        { face: "tiles", slider: "shape", icons: { round: "💬", square: "🔲", jagged: "💥", wavy: "〰️" } },
        { face: "frame", y: "placement", size: "size" },
      ],
      groups: [
        { label: "Who speaks", sliders: ["setting", "captionKnows", "innerVoice"] },
        { label: "How it looks", sliders: ["shape", "size", "placement", "tailTo"] },
      ],
      presets: [
        { label: "Classic newspaper strip", plain: "Round balloons at the top, no narrator.", set: { setting: "balloon", shape: "round", placement: "top", captionKnows: "same as the people" } },
        { label: "Noir narration (Sin City)", plain: "Square boxes from a voice that knows too much.", set: { setting: "caption", shape: "square", captionKnows: "everything", innerVoice: "caption box" } },
        { label: "Shout from off-panel", plain: "A jagged cry from someone we cannot see yet.", set: { setting: "balloon", shape: "jagged", tailTo: "off-panel", size: 5 } },
      ],
    },
  });

  W.add("panelSize", {
    sliders: [
      ["eyePull", "How hard size grabs the eye", ["even", "noticed", "strong", "overwhelming"], "How much the biggest panel dominates the reader's attention."],
      ["panelShape", "Panel shape", ["tall", "square", "wide"], "Whether panels stand up, sit square or stretch across the page.", U],
      ["biggestFor", "Biggest panel goes to", ["the action", "a face", "the place", "the reveal"], "What earns the most room on the page.", U],
      ["splashEvery", "Pages between splash panels", [0, 20, "pages"], "How often a single panel takes the whole page."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "panelShape", icons: { tall: "▯", square: "◻️", wide: "▭" } },
        { face: "dial", slider: "splashEvery" },
      ],
      groups: [
        { label: "How big", sliders: ["setting", "panelShape", "variation"] },
        { label: "What gets the space", sliders: ["biggestFor", "eyePull"] },
        { label: "Over the book", sliders: ["splashEvery", "change"] },
      ],
      presets: [
        { label: "Jack Kirby splash", plain: "Huge action panels that knock you back.", set: { setting: "splash", biggestFor: "the action", eyePull: "overwhelming", splashEvery: 4 } },
        { label: "Widescreen comics (The Authority)", plain: "Long, wide panels like a movie screen.", set: { setting: "large", panelShape: "wide", variation: 1, eyePull: "strong" } },
        { label: "Quiet even page", plain: "Small, even panels that share the page.", set: { setting: "small", variation: 0, eyePull: "even", splashEvery: 0 } },
      ],
    },
  });

  W.add("panelBreak", {
    sliders: [
      ["breakDir", "Breaks out toward", ["up", "right", "down", "left"], "Which side of the panel the figure bursts through.", U],
      ["whatBreaks", "What crosses the border", ["a hand", "a weapon", "a whole figure", "an effect"], "Which part of the picture spills over the line.", U],
      ["savedFor", "Saved for", ["anytime", "action beats", "the climax"], "How special the moment must be to break the frame."],
    ],
    window: {
      faces: [
        { face: "compass", slider: "breakDir", angles: { up: 0, right: 90, down: 180, left: 270 } },
        { face: "tiles", slider: "whatBreaks", icons: { "a hand": "✋", "a weapon": "🗡️", "a whole figure": "🧍", "an effect": "💥" } },
        { face: "dial", slider: "howMuch" },
      ],
      groups: [
        { label: "Breaking out", sliders: ["setting", "howMuch", "noticeable"] },
        { label: "What and where", sliders: ["whatBreaks", "breakDir", "savedFor"] },
      ],
      presets: [
        { label: "Superhero leaps out", plain: "The whole hero bursts upward out of the panel.", set: { setting: "splash", whatBreaks: "a whole figure", breakDir: "up", savedFor: "the climax", howMuch: 5 } },
        { label: "A reaching hand", plain: "Just a hand slips over the edge toward the next panel.", set: { setting: "edge", whatBreaks: "a hand", breakDir: "right", howMuch: 1 } },
        { label: "Explosion spills over", plain: "The blast's light pours across the borders.", set: { setting: "edge", whatBreaks: "an effect", savedFor: "action beats", howMuch: 3 } },
      ],
    },
  });

  W.add("textDensity", {
    sliders: [
      ["balloonsPerPanel", "Balloons per panel", [0, 6, ""], "How many speech balloons crowd a single panel."],
      ["silentRun", "Silent panels in a row", [0, 10, "panels"], "How many wordless panels can follow each other."],
      ["readTime", "Time to read a page", ["a glance", "quick", "steady", "slow"], "How long the words hold the reader on each page."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["words", "balloonsPerPanel", "silentRun"] },
      ],
      groups: [
        { label: "How many words", sliders: ["setting", "words", "balloonsPerPanel"] },
        { label: "Pace of reading", sliders: ["silentRun", "readTime", "change"] },
      ],
      presets: [
        { label: "Silent action (Akira)", plain: "Pages of pure picture that fly by.", set: { setting: "none", words: 0, silentRun: 8, readTime: "a glance" } },
        { label: "Talky drama page", plain: "Lots of balloons, people talking it through.", set: { setting: "many", words: 60, balloonsPerPanel: 4, readTime: "slow" } },
        { label: "Peanuts strip", plain: "A few short lines and a quiet last panel.", set: { setting: "few", words: 15, balloonsPerPanel: 1, silentRun: 1 } },
      ],
    },
  });

  W.add("soundLettering", {
    sliders: [
      ["soundColor", "Color", ["black", "red", "yellow", "blue"], "The color of the drawn sound word.", U],
      ["inPicture", "Part of the picture", ["in a box", "over the art", "woven into the art"], "How much the sound word melts into the drawing."],
      ["spread", "Spread across panels", ["one panel", "two panels", "a whole page"], "How far one sound reaches over the page."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "swatches", slider: "soundColor", colors: { black: "#111111", red: "#d62828", yellow: "#f7c600", blue: "#1d6fd1" } },
        { face: "tiles", slider: "style", icons: { clean: "🔤", "hand-drawn": "✍️", explosive: "💥" } },
      ],
      groups: [
        { label: "How loud on the page", sliders: ["setting", "size", "spread"] },
        { label: "How it looks", sliders: ["style", "soundColor", "inPicture"] },
      ],
      presets: [
        { label: "Batman '66 POW", plain: "Big bright bursts over every punch.", set: { setting: "page-sized", style: "explosive", soundColor: "yellow", inPicture: "over the art", size: 5 } },
        { label: "Manga woven sound", plain: "Hand-drawn sounds that are part of the drawing.", set: { setting: "small", style: "hand-drawn", inPicture: "woven into the art", soundColor: "black" } },
        { label: "Quiet indie lettering", plain: "Tiny clean sound words, barely there.", set: { setting: "small", style: "clean", size: 1, spread: "one panel" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
