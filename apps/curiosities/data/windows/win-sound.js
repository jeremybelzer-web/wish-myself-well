/* Audio: a window for every curiosity whose home is Audio on the Screen. */
(function (W) {
  W.add("voiceover", {
    sliders: [
      ["closeness", "How close the voice feels", ["far away", "in the room", "close", "in your ear"], "Whether the voice sounds distant or like it is whispering right to you."],
      ["voTiming", "When it speaks", ["over silence", "between lines", "over the action", "over the dialogue"], "What the voice-over talks on top of."],
      ["aheadOfPicture", "Says it before we see it", ["after", "with", "ahead"], "Whether the voice explains what we saw, what we see, or warns us of what is coming."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "voice", icons: { "a character": "🧑", "a narrator": "📖", "an AI voice": "🤖" } },
        { face: "ladder", slider: "closeness" },
        { face: "balance", slider: "truth", left: "true", right: "contradicted" },
      ],
      groups: [
        { label: "The voice", sliders: ["setting", "voice", "closeness"] },
        { label: "Timing", sliders: ["voTiming", "aheadOfPicture"] },
        { label: "Trust", sliders: ["truth"] },
      ],
      presets: [
        { label: "Goodfellas narration", plain: "A character talking in your ear the whole way.", set: { setting: "running", voice: "a character", closeness: "in your ear", voTiming: "over the action" } },
        { label: "Unreliable narrator", plain: "The picture quietly says the voice is lying.", set: { setting: "now and then", truth: "the picture says otherwise", aheadOfPicture: "with" } },
        { label: "Nature documentary", plain: "A narrator explaining ahead of what we see.", set: { setting: "running", voice: "a narrator", closeness: "in the room", aheadOfPicture: "ahead" } },
      ],
    },
  });

  W.add("musicCue", {
    sliders: [
      ["cueStart", "Where it starts", ["on a line", "on a look", "on a cut", "out of nowhere"], "The moment that sets the music off.", { unordered: true }],
      ["cueLength", "How long it plays", [0, 120, "s"], "How many seconds the cue lasts."],
      ["build", "Builds as it plays", ["fades", "holds", "swells", "crescendos"], "Whether the cue grows, holds or shrinks while it plays."],
      ["tellsFeeling", "Tells us what to feel", ["holds back", "hints", "guides", "insists"], "How hard the music steers the audience's emotion."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { off: "🔇", under: "🔉", featured: "🔊" } },
        { face: "dial", slider: "level" },
        { face: "ladder", slider: "build" },
      ],
      groups: [
        { label: "The cue", sliders: ["setting", "level", "cueStart", "cueLength"] },
        { label: "Steering the feeling", sliders: ["build", "tellsFeeling"] },
        { label: "Change over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Spielberg swell", plain: "Music comes in on a look and swells to a crescendo.", set: { setting: "featured", cueStart: "on a look", build: "crescendos", tellsFeeling: "insists", level: 0 } },
        { label: "Coen brothers restraint", plain: "Barely-there music that holds back.", set: { setting: "under", level: -24, build: "holds", tellsFeeling: "holds back" } },
      ],
    },
  });

  W.add("soundToCut", {
    sliders: [
      ["overlap", "Seconds of overlap", [0, 4, "s"], "How long the sound runs over the cut into the other shot."],
      ["carrier", "What carries over", ["room sound", "music", "a voice", "a sound effect"], "Which sound crosses the cut.", { unordered: true }],
      ["jolt", "Smooth or jolting", ["smooth", "noticeable", "a jolt"], "Whether the sound change glides by or startles the audience into the next scene."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "J-cut": "⏪", "L-cut": "⏩", hard: "✂️" } },
        { face: "balance", slider: "lead", left: "sound first", right: "picture first" },
        { face: "dial", slider: "overlap" },
      ],
      groups: [
        { label: "Across the cut", sliders: ["setting", "lead", "overlap"] },
        { label: "What and how", sliders: ["carrier", "jolt"] },
        { label: "How it shows", sliders: ["noticeable"] },
      ],
      presets: [
        { label: "Voice pulls us in", plain: "Hear the next scene's voice before we see it.", set: { setting: "J-cut", lead: -2, overlap: 2, carrier: "a voice", jolt: "smooth" } },
        { label: "Scream into a whistle", plain: "A sound effect that slams into the next scene.", set: { setting: "J-cut", lead: -1, overlap: 1, carrier: "a sound effect", jolt: "a jolt" } },
        { label: "Clean hard cut", plain: "Sound and picture change together.", set: { setting: "hard", lead: 0, overlap: 0 } },
      ],
    },
  });

  W.add("music", {
    sliders: [],
    window: {
      faces: [
        { face: "pad", x: "tempo", y: "energy", xLabel: "Tempo", yLabel: "Energy" },
        { face: "swatches", slider: "mood", colors: { dark: "#2b2238", sad: "#3f5a7a", uneasy: "#6f7a58", neutral: "#9a958c", warm: "#d99a5b", happy: "#f2c94c", euphoric: "#ff6fae" } },
        { face: "ladder", slider: "presence" },
      ],
      groups: [
        { label: "What plays", sliders: ["presence", "track", "level", "source", "instrumentation", "era", "familiarity"] },
        { label: "Its feel", sliders: ["tempo", "energy", "mood", "key", "counterpoint"] },
        { label: "Words and theme", sliders: ["vocals", "lyricFit", "repeatTheme"] },
        { label: "In and out, and the cut", sliders: ["entry", "exit", "cutSync"] },
      ],
      presets: [
        { label: "Tarantino needle drop", plain: "A famous old song slams in and the cuts ride its beat.", set: { presence: "featured", familiarity: "famous", entry: "slams in", cutSync: "cuts on the beat", vocals: "lyrics we understand" } },
        { label: "Kubrick against the scene", plain: "Cheerful music over something terrible.", set: { mood: "happy", counterpoint: "opposite", presence: "featured" } },
        { label: "Star Wars theme returns", plain: "The main theme swells back in with a full orchestra.", set: { repeatTheme: "the main theme", instrumentation: "orchestra", entry: "fades up", mood: "euphoric" } },
        { label: "Party in the room", plain: "Music the characters hear, playing under them.", set: { source: "only the characters", presence: "under the scene", entry: "already playing" } },
      ],
    },
  });

  W.add("noMusic", {
    sliders: [],
    window: {
      faces: [
        { face: "dial", slider: "length" },
        { face: "tiles", slider: "fill", icons: { "true silence": "🤫", "room tone": "🏠", "natural sounds": "🍃", "loud real sounds": "💥" } },
        { face: "ladder", slider: "purpose" },
      ],
      groups: [
        { label: "The gap", sliders: ["length", "fill"] },
        { label: "How it begins", sliders: ["cutoff", "contrast"] },
        { label: "Why", sliders: ["purpose"] },
      ],
      presets: [
        { label: "No Country for Old Men", plain: "No score at all, only real sounds building suspense.", set: { length: 60, fill: "natural sounds", cutoff: "was never there", purpose: "suspense" } },
        { label: "Gravity silence", plain: "A wall of sound cut dead into true silence.", set: { length: 8, fill: "true silence", cutoff: "cut dead", contrast: "wall of sound before", purpose: "shock" } },
      ],
    },
  });

  W.add("soundDesign", {
    sliders: [
      ["surround", "Sound around you", ["in front only", "wide", "all around"], "Whether the sounds come only from the screen or wrap around the audience."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "density" },
        { face: "dial", slider: "offscreen" },
        { face: "tiles", slider: "focusSound", icons: { none: "▫️", "a little": "🔈", clearly: "🔉", "it takes over": "🔊" } },
      ],
      groups: [
        { label: "How busy", sliders: ["density", "realism", "surround"] },
        { label: "Where the ear goes", sliders: ["focusSound", "offscreen"] },
        { label: "Across cuts", sliders: ["bridge"] },
      ],
      presets: [
        { label: "Ticking clock suspense", plain: "Sparse room, one clock takes over.", set: { density: "sparse", focusSound: "it takes over", realism: "heightened" } },
        { label: "Saving Private Ryan beach", plain: "Overwhelming, all around, sounds from everywhere.", set: { density: "overwhelming", surround: "all around", offscreen: 5, realism: "true to life" } },
        { label: "Cartoon world", plain: "Stylized boings and zips everywhere.", set: { realism: "cartoon", density: "busy" } },
      ],
    },
  });

  W.add("musicLevel", {
    sliders: [
      ["duckFor", "Ducks for", ["nobody", "main lines", "every voice", "any sound"], "Which sounds make the music dip out of the way."],
      ["fillsGaps", "Swells in the pauses", ["no", "a little", "fills every gap"], "Whether the music rises back up between lines."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "duck" },
        { face: "tiles", slider: "fade", icons: { instant: "⚡", quick: "🏃", slow: "🐢" } },
      ],
      groups: [
        { label: "Level", sliders: ["setting", "fillsGaps"] },
        { label: "Ducking under voices", sliders: ["duck", "duckFor", "fade"] },
      ],
      presets: [
        { label: "Podcast bed", plain: "Music under, ducks hard for every voice.", set: { setting: "under", duck: 18, duckFor: "every voice", fade: "quick" } },
        { label: "Montage, no talking", plain: "Music on top, nothing ducks it.", set: { setting: "music only", duck: 0, duckFor: "nobody" } },
        { label: "Romantic dinner", plain: "Even level that swells softly in the pauses.", set: { setting: "even", duck: 6, fade: "slow", fillsGaps: "fills every gap" } },
      ],
    },
  });

  W.add("musicSting", {
    sliders: [
      ["stingTiming", "Lands early or late", ["early", "on the moment", "late"], "Whether the sting lands before, on, or a beat after the moment, which changes the laugh or the shock."],
      ["howOften", "How often", ["once", "rarely", "every few beats", "a running gag"], "How many times the sting comes back."],
      ["tone", "Serious or jokey", ["dead serious", "dramatic", "wry", "silly"], "Whether the sting is meant to scare or to make you laugh."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", rise: "📈", hit: "💥", "record scratch": "💿", "sad trombone": "🎺", choir: "👼", "drum roll": "🥁" } },
        { face: "ladder", slider: "tone" },
        { face: "balance", slider: "stingTiming", left: "early", right: "late" },
      ],
      groups: [
        { label: "The sting", sliders: ["setting", "level", "tone"] },
        { label: "Timing", sliders: ["stingTiming", "howOften"] },
      ],
      presets: [
        { label: "Dun dun dun soap reveal", plain: "A loud dramatic hit right on the reveal.", set: { setting: "hit", level: "loud", tone: "dramatic", stingTiming: "on the moment" } },
        { label: "Sitcom fail", plain: "A sad trombone a beat late, every time.", set: { setting: "sad trombone", tone: "silly", stingTiming: "late", howOften: "a running gag" } },
        { label: "Freeze-frame scratch", plain: "Record scratch, then 'you're probably wondering'.", set: { setting: "record scratch", level: "clear", tone: "wry", howOften: "once" } },
      ],
    },
  });

  W.add("soundRoles", {
    sliders: [
      ["ambience", "Ambience level", [0, 100, "%"], "How loud the room and background sounds are in the mix."],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["dialogue", "music", "effects", "ambience"] },
        { face: "tiles", slider: "setting", icons: { dialogue: "🗣️", music: "🎵", effects: "💥", ambience: "🌬️" } },
      ],
      groups: [
        { label: "Who leads", sliders: ["setting"] },
        { label: "The balance", sliders: ["dialogue", "music", "effects", "ambience"] },
      ],
      presets: [
        { label: "Talky drama", plain: "Dialogue leads, everything else stays low.", set: { setting: "dialogue", dialogue: 100, music: 30, effects: 40, ambience: 35 } },
        { label: "Action set piece", plain: "Effects lead, music pumping under.", set: { setting: "effects", dialogue: 60, music: 70, effects: 100, ambience: 50 } },
        { label: "Music video", plain: "Music on top of everything.", set: { setting: "music", dialogue: 20, music: 100, effects: 30, ambience: 10 } },
      ],
    },
  });

  W.add("soundDensity", {
    sliders: [
      ["air", "Gaps between sounds", ["none", "few", "some", "lots of air"], "How much breathing room there is between sounds."],
      ["rumble", "Low rumble", [0, 5, ""], "How much deep bass you feel more than hear."],
      ["clarity", "Can you pick each one out", ["mush", "blurred", "clear", "crystal"], "Whether each sound is distinct or they melt together."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "pad", x: "layers", y: "rumble", xLabel: "Layers", yLabel: "Rumble" },
        { face: "ladder", slider: "clarity" },
      ],
      groups: [
        { label: "How thick", sliders: ["setting", "layers", "rumble"] },
        { label: "Space and clarity", sliders: ["air", "clarity"] },
        { label: "Change over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Dunkirk pressure", plain: "Layer on layer with a constant low rumble.", set: { setting: 6, layers: 12, rumble: 5, air: "none", clarity: "blurred" } },
        { label: "Quiet morning", plain: "A few clean sounds with lots of air.", set: { setting: 1, layers: 2, rumble: 0, air: "lots of air", clarity: "crystal" } },
      ],
    },
  });

  W.add("audioFade", {
    sliders: [
      ["offset", "Before or after the cut", [-2, 2, "s"], "Whether the fade starts before the picture cut or after it."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { hard: "✂️", "fade in": "🌅", "fade out": "🌇", both: "↔️", crossfade: "🔀" } },
        { face: "dial", slider: "length" },
        { face: "ladder", slider: "curve" },
      ],
      groups: [
        { label: "The fade", sliders: ["setting", "length"] },
        { label: "Its shape and timing", sliders: ["curve", "offset"] },
      ],
      presets: [
        { label: "Dreamy dissolve", plain: "A long smooth crossfade.", set: { setting: "crossfade", length: 3, curve: "smooth", offset: 0 } },
        { label: "Smash cut", plain: "No fade at all.", set: { setting: "hard", length: 0 } },
        { label: "Fade before the end", plain: "Sound fades out early, before the picture goes.", set: { setting: "fade out", length: 2, offset: -1 } },
      ],
    },
  });

  W.add("voiceEffect", {
    sliders: [
      ["effectStrength", "How strong the effect", [0, 100, "%"], "How much the effect changes the voice."],
      ["effectSpan", "How long it lasts", ["one line", "a moment", "a scene", "always"], "Whether the effect is a quick gag or how this voice always sounds."],
      ["wobble", "Moves while they speak", ["steady", "wavers", "warps"], "Whether the effect stays put or bends as they talk."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { natural: "🙂", robot: "🤖", high: "🐿️", deep: "🐻", echo: "⛰️", radio: "📻", megaphone: "📣", underwater: "🌊" } },
        { face: "dial", slider: "effectStrength" },
        { face: "tiles", slider: "who", icons: { "one character": "🧑", "the narrator": "📖", everyone: "👥" } },
      ],
      groups: [
        { label: "The effect", sliders: ["setting", "effectStrength", "wobble"] },
        { label: "On whom, for how long", sliders: ["who", "effectSpan"] },
      ],
      presets: [
        { label: "Phone call voice", plain: "A thin radio sound on one character for the scene.", set: { setting: "radio", effectStrength: 60, who: "one character", effectSpan: "a scene" } },
        { label: "Darth Vader", plain: "A deep voice, always.", set: { setting: "deep", effectStrength: 80, effectSpan: "always", wobble: "steady" } },
        { label: "Dream warp", plain: "An echo that warps for a moment.", set: { setting: "echo", effectStrength: 70, wobble: "warps", effectSpan: "a moment" } },
      ],
    },
  });

  W.add("sfxHits", {
    sliders: [
      ["hitSize", "Size of each hit", ["tiny", "small", "big", "huge"], "How big each added sound is."],
      ["cartoony", "Real or cartoony", ["real", "heightened", "cartoony"], "Whether the hits sound like the real world or a cartoon."],
      ["perMinute", "Hits per minute", [0, 60, ""], "How many hits land each minute."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { whoosh: "💨", hit: "💥", pop: "🎈", swish: "〰️", riser: "📈", ding: "🔔", "record scratch": "💿" } },
        { face: "dial", slider: "perMinute" },
        { face: "ladder", slider: "setting" },
      ],
      groups: [
        { label: "How many", sliders: ["setting", "perMinute"] },
        { label: "What they are", sliders: ["kind", "hitSize", "cartoony"] },
        { label: "Timing", sliders: ["sync"] },
      ],
      presets: [
        { label: "Edgar Wright montage", plain: "Busy whooshes and hits landing on every cut.", set: { setting: "busy", kind: "whoosh", sync: "the cuts", perMinute: 40, cartoony: "heightened" } },
        { label: "Short-form video pops", plain: "Wall-to-wall cartoony pops on the action.", set: { setting: "wall to wall", kind: "pop", sync: "the action", cartoony: "cartoony", perMinute: 60 } },
        { label: "One big hit", plain: "A single huge hit for the title.", set: { setting: "sparse", kind: "hit", hitSize: "huge", perMinute: 1 } },
      ],
    },
  });

  W.add("loudness", {
    sliders: [
      ["swings", "Quiet to loud swings", ["flat", "small", "wide", "huge"], "How far the mix jumps between quiet and loud moments."],
      ["punch", "Loud moments hit harder", [0, 5, ""], "How much the big moments jump out of the mix to grab the audience."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "peak" },
        { face: "pad", x: "noise", y: "punch", xLabel: "Noise reduction", yLabel: "Punch" },
      ],
      groups: [
        { label: "How loud", sliders: ["setting", "peak"] },
        { label: "Dynamics", sliders: ["swings", "punch"] },
        { label: "Clean up", sliders: ["noise"] },
      ],
      presets: [
        { label: "Blockbuster trailer", plain: "Loud, huge swings, big moments punch hard.", set: { setting: "loud", peak: -1, swings: "huge", punch: 5 } },
        { label: "Phone-friendly mix", plain: "Even and steady so nothing gets lost.", set: { setting: "normal", peak: -6, swings: "flat", punch: 1, noise: 50 } },
      ],
    },
  });

  W.add("translatedVoice", {
    sliders: [
      ["soundsLike", "Sounds like the original", ["a different voice", "similar", "a clone"], "Whether the translated voice sounds like the real actor."],
      ["subtitles", "Subtitles too", ["none", "key lines", "all"], "Whether words also appear on screen."],
      ["originalUnder", "Original voice underneath", ["gone", "faint", "audible"], "Whether you can still hear the original language under the translation."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "language", icons: { English: "🇬🇧", Spanish: "🇪🇸", French: "🇫🇷", Arabic: "🇸🇦", Hindi: "🇮🇳", Japanese: "🇯🇵", "another language": "🌐" } },
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "originalUnder", left: "gone", right: "audible" },
      ],
      groups: [
        { label: "The translation", sliders: ["setting", "language", "soundsLike"] },
        { label: "What else you get", sliders: ["subtitles", "originalUnder"] },
      ],
      presets: [
        { label: "Seamless dub", plain: "Translated with lip sync in a cloned voice.", set: { setting: "translated with lip sync", soundsLike: "a clone", originalUnder: "gone", subtitles: "none" } },
        { label: "Documentary interpreter", plain: "Original voice faint underneath a translator.", set: { setting: "translated", soundsLike: "a different voice", originalUnder: "faint" } },
      ],
    },
  });

  W.add("voiceCleanup", {
    sliders: [
      ["hiss", "Hiss taken out", [0, 100, "%"], "How much background hiss and hum is removed."],
      ["warmth", "Voice warmth", ["thin", "natural", "warm", "rich"], "Whether the voice sounds thin or full and close."],
      ["breaths", "Breaths kept", ["removed", "softened", "kept"], "Whether the speaker's breaths stay in, which keeps it human."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "hiss" },
        { face: "tiles", slider: "room", icons: { none: "🎙️", "a little": "🏠", "all of it": "⛪" } },
      ],
      groups: [
        { label: "Cleaning", sliders: ["setting", "hiss"] },
        { label: "What stays", sliders: ["room", "breaths", "warmth"] },
      ],
      presets: [
        { label: "Radio host polish", plain: "Fully cleaned, rich and close, no room.", set: { setting: "both", hiss: 90, room: "none", warmth: "rich", breaths: "softened" } },
        { label: "Raw documentary", plain: "Light cleanup, room and breaths kept.", set: { setting: "echo reduced", hiss: 30, room: "a little", breaths: "kept", warmth: "natural" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
