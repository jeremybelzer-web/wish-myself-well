/* Transitions: a window for every curiosity whose home is Transitions on the Screen. */
(function (W) {
  W.add("matchCut", {
    sliders: [
      ["closeness", "How exact the match", ["loose echo", "close", "perfect overlay"], "How precisely the shared shape or movement lines up across the cut."],
      ["obvious", "Hidden or showy", ["hidden", "felt", "a wow moment"], "Whether the audience should notice the match or only feel it."],
      ["meaning", "What the match says", ["just flow", "a link", "a contrast", "a big idea"], "How much story the joined shots carry together."],
      ["frequency", "Match cuts per film", [0, 12, ""], "How many times the film uses a match cut."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "✂️", shape: "⭕", movement: "🏃", sound: "🔊", color: "🎨", word: "💬" } },
        { face: "ladder", slider: "leap" },
        { face: "pad", x: "closeness", y: "obvious", xLabel: "How exact", yLabel: "How showy" },
      ],
      groups: [
        { label: "The match", sliders: ["setting", "closeness", "obvious"] },
        { label: "The jump", sliders: ["leap", "meaning", "frequency"] },
      ],
      presets: [
        { label: "2001 bone to satellite", plain: "One thrown bone becomes a spaceship, millions of years later.", set: { setting: "shape", leap: "another world", closeness: "perfect overlay", obvious: "a wow moment", meaning: "a big idea" } },
        { label: "Lawrence of Arabia match", plain: "A blown-out match cuts to the desert sunrise.", set: { setting: "movement", leap: "days later", obvious: "a wow moment" } },
        { label: "Invisible flow", plain: "Quiet echoes that just keep the story moving.", set: { setting: "sound", closeness: "loose echo", obvious: "hidden", meaning: "just flow" } },
      ],
    },
  });

  W.add("transitionKind", {
    sliders: [
      ["onBeat", "Lands on the music", ["ignores it", "near the beat", "right on the beat"], "Whether the transition is timed to the music's beat."],
      ["hideSeam", "Hides the cut", ["shows it", "half hidden", "seamless"], "Whether the transition disguises that two clips were joined."],
      ["grab", "Wakes up the viewer", [0, 100, "%"], "How much the transition jolts the audience back to attention."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { cut: "✂️", "fade to black": "⬛", "fade to white": "⬜", "cross dissolve": "🌫️", wipe: "🧽", push: "👉", zoom: "🔎", spin: "🌀", "whip pan": "💨", flash: "⚡", glitch: "📺", morph: "🫠", "flash zoom": "💥", "slam merge": "🔨", "slice reveal": "🔪", "brush cuts": "🖌️", "phone swipe": "📱", smear: "🖍️" } },
        { face: "compass", slider: "direction", angles: { up: 0, right: 90, down: 180, left: 270, in: 45, out: 225 } },
        { face: "dial", slider: "duration" },
      ],
      groups: [
        { label: "The effect", sliders: ["setting", "direction", "ease"] },
        { label: "Timing", sliders: ["duration", "onBeat", "soundOverlap"] },
        { label: "Effect on the viewer", sliders: ["hideSeam", "grab"] },
      ],
      presets: [
        { label: "Star Wars wipe", plain: "A clean wipe across, side to side.", set: { setting: "wipe", direction: "right", duration: 0.8, ease: "steady" } },
        { label: "Edgar Wright whip pan", plain: "A fast blur pan that hides the cut, on the beat.", set: { setting: "whip pan", duration: 0.3, hideSeam: "seamless", onBeat: "right on the beat", grab: 80 } },
        { label: "TikTok flash zoom", plain: "A punchy zoom flash right on the drop.", set: { setting: "flash zoom", direction: "in", duration: 0.4, onBeat: "right on the beat", grab: 100 } },
        { label: "Gentle dissolve", plain: "A soft blend with the sound easing over.", set: { setting: "cross dissolve", duration: 2, soundOverlap: "crossfade", grab: 10 } },
      ],
    },
  });

  W.add("fadeEdge", {
    sliders: [
      ["holdColor", "Time on the plain color", [0, 5, "seconds"], "How long the screen rests on black or white before the next picture."],
      ["soundFade", "Sound fades too", ["sound stays", "sound fades with it", "sound fades first", "sound fades last"], "How the sound behaves while the picture fades.", { unordered: true }],
      ["curve", "Fade shape", ["even", "slow start", "slow end", "slow both ends"], "Whether the fade starts or ends gently.", { unordered: true }],
      ["finality", "How final it feels", ["a breath", "a pause", "an ending"], "Whether the fade feels like a short rest or the end of a chapter."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▶️", "fade in": "🌅", "fade out": "🌇", both: "🔁" } },
        { face: "swatches", slider: "color", colors: { black: "#000000", white: "#ffffff", "a color": "#c0392b" } },
        { face: "pad", x: "length", y: "holdColor", xLabel: "Fade length", yLabel: "Hold on color" },
      ],
      groups: [
        { label: "The fade", sliders: ["setting", "color", "curve"] },
        { label: "Timing", sliders: ["length", "holdColor", "finality"] },
        { label: "Sound", sliders: ["soundFade"] },
      ],
      presets: [
        { label: "End of act one", plain: "A slow fade to black that rests there.", set: { setting: "fade out", color: "black", length: 3, holdColor: 2, finality: "an ending" } },
        { label: "Heaven white-out", plain: "Fade up from white, sound arriving last.", set: { setting: "fade in", color: "white", soundFade: "sound fades last", curve: "slow start" } },
        { label: "Sopranos cut to black", plain: "No fade at all, just sudden black and silence.", set: { setting: "fade out", color: "black", length: 0, holdColor: 5, soundFade: "sound fades first", finality: "an ending" } },
      ],
    },
  });

  W.add("transitionFamily", {
    sliders: [
      ["consistency", "Same family every time", ["mixed", "mostly one", "always one"], "Whether the film sticks to one family of transitions or mixes them."],
      ["frequency", "Transitions per minute", [0, 30, "per minute"], "How often a styled transition replaces a plain cut."],
      ["build", "Getting bigger over time", ["calming", "steady", "building"], "Whether transitions grow wilder or calmer as the video goes on."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { basic: "✂️", slide: "➡️", movement: "🏃", blur: "🌫️", light: "💡", overlay: "🪟", mask: "🎭", "3D": "🧊", glitch: "📺", whimsical: "🦄", classic: "🎞️", "pixel bead": "🟦" } },
        { face: "ladder", slider: "energy" },
        { face: "mixer", sliders: ["motionBlur", "frequency"] },
      ],
      groups: [
        { label: "The family", sliders: ["setting", "consistency"] },
        { label: "Energy", sliders: ["energy", "flash", "motionBlur"] },
        { label: "Over time", sliders: ["frequency", "build"] },
      ],
      presets: [
        { label: "Travel vlog", plain: "Lively slides and light leaks that build to the end.", set: { setting: "slide", energy: "lively", flash: "light leak", build: "building" } },
        { label: "Hype edit", plain: "Explosive glitches, lots of them.", set: { setting: "glitch", energy: "explosive", frequency: 20, motionBlur: 80 } },
        { label: "Wedding film", plain: "Calm classic dissolves, one family all the way.", set: { setting: "classic", energy: "calm", consistency: "always one", frequency: 2 } },
      ],
    },
  });

  W.add("introOutro", {
    sliders: [
      ["titleOn", "A title rides with it", ["none", "a small title", "a big title"], "Whether the film or scene name appears as it opens or closes."],
      ["hook", "How fast it hooks", ["slow build", "quick", "instant"], "How quickly the opening grabs the audience."],
      ["mood", "Mood of the opening", ["calm", "playful", "dramatic", "explosive"], "The feeling the intro or outro sets."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▶️", "opening arc": "🌈", "swirl in": "🌀", "light fall": "✨", "slam in": "💥", "smooth scroll": "📜", "end card": "🪧" } },
        { face: "tiles", slider: "where", icons: { "film start": "🎬", "scene start": "🚪", "scene end": "🌇", "film end": "🏁" } },
        { face: "dial", slider: "length" },
      ],
      groups: [
        { label: "The effect", sliders: ["setting", "where", "length"] },
        { label: "Feel", sliders: ["mood", "hook", "titleOn"] },
      ],
      presets: [
        { label: "YouTube cold open", plain: "Slam straight in and hook in the first second.", set: { setting: "slam in", where: "film start", hook: "instant", mood: "explosive", length: 1 } },
        { label: "Star Wars crawl", plain: "Words scroll up into space before the story.", set: { setting: "smooth scroll", where: "film start", titleOn: "a big title", hook: "slow build", length: 5 } },
        { label: "Subscribe end card", plain: "A friendly card to close the video.", set: { setting: "end card", where: "film end", mood: "playful" } },
      ],
    },
  });

  W.add("clipAnimation", {
    sliders: [
      ["timing", "Starts on", ["the clip's start", "the beat", "a word"], "What moment the animation is timed to.", { unordered: true }],
      ["overshoot", "Bounce past and settle", ["none", "a little", "springy"], "Whether the clip overshoots its place and springs back."],
      ["repeat", "Repeats", [0, 8, "times"], "How many times a looping animation plays."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "style", icons: { fade: "🌫️", slide: "➡️", zoom: "🔎", bounce: "🏀", spin: "🌀", shake: "📳", swing: "🎐" } },
        { face: "pad", x: "duration", y: "strength", xLabel: "Length", yLabel: "Strength" },
        { face: "ladder", slider: "overshoot" },
      ],
      groups: [
        { label: "The animation", sliders: ["setting", "style", "overshoot"] },
        { label: "Timing", sliders: ["duration", "timing", "repeat", "strength"] },
      ],
      presets: [
        { label: "Instagram pop-in", plain: "A springy zoom in on the beat.", set: { setting: "in", style: "zoom", overshoot: "springy", timing: "the beat", duration: 0.4 } },
        { label: "Meme shake loop", plain: "A hard shake that loops a few times.", set: { setting: "loop", style: "shake", strength: 90, repeat: 3 } },
        { label: "Quiet slide out", plain: "A gentle slide away at the end.", set: { setting: "out", style: "slide", strength: 30, overshoot: "none", duration: 1 } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
