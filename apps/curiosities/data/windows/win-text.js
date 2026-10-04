/* Text: a window for every curiosity whose home is Text on the Screen. */
(function (W) {
  W.add("onScreenText", {
    sliders: [
      ["inDelay", "Comes in after the cut", [0, 5, "s"], "How long after the shot starts the words appear."],
      ["readTime", "Time to read it", ["just a flash", "quick read", "comfortable", "lingering"], "Whether the audience can read it all or only catch a glimpse."],
      ["grabsEye", "Grabs the eye", ["quiet", "noticed", "pops out"], "How strongly the words pull attention from the picture."],
      ["exitStyle", "Leaves by", ["cut", "fade", "pop", "slide"], "How the words disappear.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⬜", caption: "💬", "title card": "🎬", "lower third": "🪪", "sign or label": "🪧", "sound word": "💥", credits: "📜" } },
        { face: "frame", y: "position", size: "size" },
        { face: "dial", slider: "duration" },
      ],
      groups: [
        { label: "The words", sliders: ["setting", "size", "position", "grabsEye"] },
        { label: "Coming and going", sliders: ["animation", "exitStyle", "inDelay"] },
        { label: "How long", sliders: ["duration", "readTime"] },
      ],
      presets: [
        { label: "Documentary name tag", plain: "A calm lower third that stays long enough to read.", set: { setting: "lower third", size: "small", position: "bottom", animation: "fade", duration: 4, readTime: "comfortable", grabsEye: "quiet" } },
        { label: "Comic-book sound word", plain: "A big word bursts on the hit and vanishes.", set: { setting: "sound word", size: "large", position: "middle", animation: "pop", duration: 1, readTime: "just a flash", grabsEye: "pops out" } },
        { label: "Silent-film title card", plain: "Full-screen words, held for a slow read.", set: { setting: "title card", size: "full screen", animation: "fade", exitStyle: "fade", duration: 5, readTime: "lingering" } },
        { label: "Sherlock text messages", plain: "Words float beside the person who types them.", set: { setting: "caption", position: "follows a person", animation: "typewriter", grabsEye: "noticed" } },
      ],
    },
  });

  W.add("moodEffect", {
    sliders: [
      ["holdTime", "Stays for", [0, 5, "s"], "How long the sticker sits on the face."],
      ["popIn", "How it appears", ["fades in", "pops", "bursts with a sound"], "How loudly the sticker arrives."],
      ["wobble", "Moves on the face", ["still", "bobs", "shakes"], "Whether the sticker sits still or jiggles."],
      ["howOften", "How often", ["once in the film", "now and then", "every reaction"], "How often mood stickers show up across the film."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⬜", sunny: "☀️", loved: "😍", struck: "⚡", "bright idea": "💡", "red face": "😳", "sad tears": "😢", shy: "🙈", confused: "😵‍💫", "departing soul": "👻", cool: "😎", "angry steam": "😤", "laughing till crying": "😂", "mallet bonk": "🔨", crackling: "✨" } },
        { face: "ladder", slider: "size" },
        { face: "dial", slider: "holdTime" },
      ],
      groups: [
        { label: "The sticker", sliders: ["setting", "size", "wobble"] },
        { label: "Timing", sliders: ["timing", "holdTime", "popIn"] },
        { label: "Across the film", sliders: ["howOften"] },
      ],
      presets: [
        { label: "Anime embarrassment", plain: "Red cheeks pop on just after the line.", set: { setting: "red face", size: "medium", timing: "after the line", popIn: "pops", wobble: "bobs" } },
        { label: "Bonk! slapstick", plain: "A mallet hits on the line with a sound.", set: { setting: "mallet bonk", size: "big", timing: "on the line", popIn: "bursts with a sound", holdTime: 1, wobble: "shakes" } },
        { label: "Light-bulb moment", plain: "A bulb appears just before they speak the idea.", set: { setting: "bright idea", timing: "before the line", holdTime: 2, howOften: "now and then" } },
      ],
    },
  });

  W.add("endCard", {
    sliders: [
      ["blackBefore", "Black before it", [0, 5, "s"], "How long the screen stays dark before the card."],
      ["holdFor", "On screen for", [1, 15, "s"], "How long the card stays up."],
      ["music", "Music under it", ["silence", "music fades", "music swells"], "What the sound does while the card is up."],
      ["stinger", "A last moment after it", ["none", "a hint", "a full extra scene"], "Whether a final surprise plays after the card to keep the audience watching."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⬜", "thank you for watching": "🙏", "to be continued": "➡️", "the end": "🎬", subscribe: "🔔", thanks: "💛" } },
        { face: "dial", slider: "holdFor" },
        { face: "ladder", slider: "stinger" },
      ],
      groups: [
        { label: "The card", sliders: ["setting", "style"] },
        { label: "Timing", sliders: ["blackBefore", "holdFor"] },
        { label: "Sound and after", sliders: ["music", "stinger"] },
      ],
      presets: [
        { label: "Classic The End", plain: "Black, then an old-film card while the music swells.", set: { setting: "the end", style: "old film", blackBefore: 2, music: "music swells" } },
        { label: "Cliffhanger", plain: "Cut straight to To Be Continued in silence.", set: { setting: "to be continued", blackBefore: 0, music: "silence", holdFor: 3 } },
        { label: "Marvel stinger", plain: "A card, then one more scene after it.", set: { setting: "the end", stinger: "a full extra scene", music: "music fades" } },
        { label: "YouTube outro", plain: "An animated subscribe card that stays up.", set: { setting: "subscribe", style: "animated", holdFor: 10 } },
      ],
    },
  });

  W.add("chapterCard", {
    sliders: [
      ["holdFor", "On screen for", [1, 10, "s"], "How long each chapter card stays up."],
      ["backdrop", "Behind it", ["black", "still picture", "moving picture"], "What sits behind the words."],
      ["howMany", "How many chapters", [2, 12, ""], "How many parts the film is split into."],
      ["tease", "Title hints what's next", ["plain", "a hint", "a riddle"], "How much the title makes us curious about the next part."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⬜", number: "🔢", title: "🔤", "number and title": "📖", "date and place": "📅" } },
        { face: "dial", slider: "howMany" },
        { face: "ladder", slider: "tease" },
      ],
      groups: [
        { label: "The card", sliders: ["setting", "style", "backdrop"] },
        { label: "Timing", sliders: ["holdFor", "howMany"] },
        { label: "Curiosity", sliders: ["tease"] },
      ],
      presets: [
        { label: "Tarantino chapters", plain: "Bold numbered titles on black.", set: { setting: "number and title", style: "bold", backdrop: "black", howMany: 6, tease: "a hint" } },
        { label: "Storybook chapters", plain: "Handwritten titles over a still picture, like a book.", set: { setting: "title", style: "handwritten", backdrop: "still picture", tease: "a riddle" } },
        { label: "Spy thriller dateline", plain: "Typewriter date and place over the moving picture.", set: { setting: "date and place", style: "typewriter", backdrop: "moving picture", holdFor: 3 } },
      ],
    },
  });

  W.add("captions", {
    sliders: [
      ["size", "Size", ["small", "medium", "large", "huge"], "How big the captions are."],
      ["position", "Where", ["bottom", "middle", "top"], "Where on the picture the captions sit.", { unordered: true }],
      ["highlight", "Highlights the key word", ["no", "color", "color and bounce"], "Whether important words jump out to grab the eye."],
      ["emoji", "Emoji in captions", ["none", "a few", "lots"], "Whether little emoji are mixed into the words."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { off: "🚫", "key words": "🔑", "every line": "💬", "word by word": "🔤" } },
        { face: "frame", y: "position", size: "size" },
        { face: "dial", slider: "wordsPerLine" },
      ],
      groups: [
        { label: "What shows", sliders: ["setting", "wordsPerLine"] },
        { label: "Look and place", sliders: ["size", "position", "speakerColor"] },
        { label: "Grabbing attention", sliders: ["highlight", "emoji"] },
      ],
      presets: [
        { label: "Cinema subtitles", plain: "Quiet, every line, small at the bottom.", set: { setting: "every line", size: "small", position: "bottom", highlight: "no", emoji: "none", wordsPerLine: 8 } },
        { label: "TikTok punchy captions", plain: "Huge words, one at a time, key words bouncing.", set: { setting: "word by word", size: "huge", position: "middle", highlight: "color and bounce", wordsPerLine: 2, emoji: "a few" } },
        { label: "Reality show speakers", plain: "A color for each person, key words only.", set: { setting: "key words", speakerColor: "a color per speaker", highlight: "color" } },
      ],
    },
  });

  W.add("stickers", {
    sliders: [
      ["size", "Size", ["small", "medium", "large"], "How big the stickers are."],
      ["stayFor", "Stays for", [0, 10, "s"], "How long each sticker stays on screen."],
      ["landsOn", "Lands on", ["anywhere", "the line", "the beat of the music"], "What the sticker's arrival is timed to.", { unordered: true }],
      ["pointsAt", "Points the eye", ["just decoration", "near the subject", "right at the thing"], "Whether the sticker steers the audience's attention."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { emoji: "😀", arrow: "➡️", sparkle: "✨", "speech bubble": "💬", reaction: "😮", shape: "⭐" } },
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "stayFor" },
      ],
      groups: [
        { label: "The stickers", sliders: ["setting", "kind", "size"] },
        { label: "Movement and timing", sliders: ["motion", "stayFor", "landsOn"] },
        { label: "Attention", sliders: ["pointsAt"] },
      ],
      presets: [
        { label: "Look here arrow", plain: "One big arrow right at the thing that matters.", set: { setting: "one", kind: "arrow", size: "large", pointsAt: "right at the thing", stayFor: 2 } },
        { label: "Vlog sparkle party", plain: "Lots of sparkles bouncing on the beat.", set: { setting: "many", kind: "sparkle", motion: "bounces", landsOn: "the beat of the music" } },
        { label: "Reaction pop", plain: "A reaction sticker follows the person on their line.", set: { setting: "one", kind: "reaction", motion: "follows a person", landsOn: "the line", stayFor: 1 } },
      ],
    },
  });

  W.add("textStyle", {
    sliders: [
      ["color", "Text color", ["white", "yellow", "black", "red", "pastel"], "The color of the letters.", { unordered: true }],
      ["weight", "Thickness", ["thin", "regular", "bold", "heavy"], "How thick the letters are."],
      ["spread", "Letter spacing", ["tight", "normal", "wide", "very wide"], "How much room sits between letters."],
      ["glow", "Glow", [0, 100, "%"], "How much the letters shine on the picture."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "color", colors: { white: "#ffffff", yellow: "#ffd23f", black: "#111111", red: "#e63946", pastel: "#f4b6c2" } },
        { face: "mixer", sliders: ["stroke", "shadow", "glow"] },
        { face: "tiles", slider: "setting", icons: { clean: "🔤", serif: "📰", handwritten: "✍️", "bold display": "🅱️", retro: "📼", comic: "💥" } },
      ],
      groups: [
        { label: "Letters", sliders: ["setting", "weight", "spread", "color"] },
        { label: "Edges and glow", sliders: ["stroke", "shadow", "glow"] },
        { label: "Box", sliders: ["box"] },
      ],
      presets: [
        { label: "Classic subtitle", plain: "Clean white letters with a soft shadow.", set: { setting: "clean", color: "white", weight: "regular", shadow: 60, stroke: 0, box: "none" } },
        { label: "YouTube thumbnail punch", plain: "Heavy yellow letters with a thick outline.", set: { setting: "bold display", color: "yellow", weight: "heavy", stroke: 8, shadow: 40 } },
        { label: "Stranger Things retro", plain: "Red retro letters, wide apart and glowing.", set: { setting: "retro", color: "red", spread: "wide", glow: 70, stroke: 2 } },
        { label: "Cozy handwritten note", plain: "Handwritten pastel letters on a soft box.", set: { setting: "handwritten", color: "pastel", weight: "thin", box: "soft" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
