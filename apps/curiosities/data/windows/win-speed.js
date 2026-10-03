/* Speed: a window for every curiosity whose home is Speed on the Screen. */
(function (W) {
  W.add("freezeFrame", {
    sliders: [
      ["onWhat", "Freezes on", ["a face", "an action peak", "a mid-air jump", "a reaction"], "The moment caught in the freeze.", { unordered: true }],
      ["soundWhile", "Sound while frozen", ["silence", "keeps going", "a sting", "narration"], "What the audience hears while the picture holds still.", { unordered: true }],
      ["lookChange", "Picture changes on freeze", ["none", "color drains", "goes black and white", "turns to a drawing"], "Whether the frozen frame takes on a different look."],
      ["timing", "Where it lands", ["the opening", "the middle", "the ending"], "Where in the scene the freeze falls, to stop attention cold."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▶️", "short freeze": "⏸️", "long freeze": "🧊", "freeze with a title": "🪧" } },
        { face: "pad", x: "length", y: "zoom", xLabel: "Length", yLabel: "Zoom while frozen" },
        { face: "ladder", slider: "lookChange" },
      ],
      groups: [
        { label: "The freeze", sliders: ["setting", "onWhat", "length", "timing"] },
        { label: "Look and sound", sliders: ["zoom", "lookChange", "soundWhile"] },
      ],
      presets: [
        { label: "Record scratch intro", plain: "Freeze on the reaction: 'Yep, that's me.'", set: { setting: "freeze with a title", onWhat: "a reaction", soundWhile: "narration", timing: "the opening" } },
        { label: "Butch Cassidy ending", plain: "Freeze mid-charge, color drains away.", set: { setting: "long freeze", onWhat: "an action peak", lookChange: "goes black and white", timing: "the ending", length: 5 } },
        { label: "Character intro card", plain: "A quick freeze and zoom with their name.", set: { setting: "freeze with a title", onWhat: "a face", zoom: 40, length: 1.5, soundWhile: "a sting" } },
      ],
    },
  });

  W.add("pacingCurve", {
    sliders: [
      ["longest", "Longest shot", [1, 30, "seconds"], "How long the slowest moment of the scene holds."],
      ["peakAt", "Fastest moment at", [0, 100, "%"], "Where in the scene the cutting is quickest."],
      ["afterPeak", "After the peak", ["keeps racing", "eases off", "dead stop"], "What the pace does once it hits its fastest point."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "slows down": "📉", steady: "➖", "speeds up": "📈", "speeds up then stops": "🛑", "stop and go": "🚦" } },
        { face: "pad", x: "shortest", y: "longest", xLabel: "Shortest shot", yLabel: "Longest shot" },
        { face: "dial", slider: "peakAt" },
      ],
      groups: [
        { label: "The shape", sliders: ["setting", "peakAt", "afterPeak"] },
        { label: "Shot lengths", sliders: ["shortest", "longest", "pauses"] },
      ],
      presets: [
        { label: "Heist countdown", plain: "Faster and faster until a dead stop.", set: { setting: "speeds up then stops", peakAt: 90, afterPeak: "dead stop", shortest: 6 } },
        { label: "Mad Max relentless", plain: "Fast throughout with barely a breath.", set: { setting: "speeds up", shortest: 2, pauses: 0, afterPeak: "keeps racing" } },
        { label: "Sitcom rhythm", plain: "Stop and go around the jokes.", set: { setting: "stop and go", pauses: 3, longest: 8 } },
      ],
    },
  });

  W.add("attentionReset", {
    sliders: [
      ["surprise", "How surprising each one", ["expected", "a little fresh", "a real jolt"], "How unexpected each new thing is."],
      ["drift", "Resets getting closer", ["further apart", "steady", "closer together"], "Whether the gaps between new things shrink or grow over the video."],
      ["opening", "First hook arrives in", [0, 10, "seconds"], "How soon the very first grab happens."],
      ["variety", "Mix of kinds", ["always the same", "a few kinds", "anything goes"], "Whether the new thing is always the same kind or keeps changing."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "kind", icons: { "a cut": "✂️", "a sound": "🔔", "a joke": "😂", "a new face": "🙂", "a new place": "🗺️" } },
        { face: "dial", slider: "opening" },
      ],
      groups: [
        { label: "How often", sliders: ["setting", "drift", "opening"] },
        { label: "What it is", sliders: ["kind", "variety", "surprise"] },
      ],
      presets: [
        { label: "MrBeast retention", plain: "A hook in the first second, something new every two.", set: { setting: "every 1 to 2 seconds", opening: 0, variety: "anything goes", surprise: "a real jolt" } },
        { label: "Slow-burn documentary", plain: "New faces and places, given room to breathe.", set: { setting: "every 10 seconds", kind: "a new place", surprise: "a little fresh", opening: 8 } },
        { label: "Sitcom joke rhythm", plain: "A joke every few seconds.", set: { setting: "every 3 to 5 seconds", kind: "a joke", variety: "a few kinds" } },
      ],
    },
  });

  W.add("clipSpeed", {
    sliders: [
      ["smoothChange", "How speed changes", ["jumps", "quick ease", "slow glide"], "Whether a new speed snaps in or blends in."],
      ["feel", "What the speed says", ["dreamy", "heavy", "comic", "urgent"], "The feeling the speed change is meant to give.", { unordered: true }],
      ["soundBend", "Sound follows speed", ["sound stays normal", "sound slows too", "sound replaced"], "What happens to the background sound when the picture speed changes.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "percent" },
        { face: "tiles", slider: "feel", icons: { dreamy: "☁️", heavy: "🪨", comic: "🤡", urgent: "🚨" } },
      ],
      groups: [
        { label: "Speed", sliders: ["setting", "percent", "smoothChange"] },
        { label: "Feel and sound", sliders: ["feel", "pitch", "soundBend"] },
      ],
      presets: [
        { label: "Benny Hill chase", plain: "Very fast, silly sped-up running.", set: { setting: "very fast", percent: 300, feel: "comic", pitch: "follows the speed" } },
        { label: "Wong Kar-wai dream", plain: "Slow, dreamy, with music instead of sound.", set: { setting: "slow", percent: 50, feel: "dreamy", soundBend: "sound replaced" } },
        { label: "Impact slow motion", plain: "A heavy slowdown on the hit.", set: { setting: "very slow", percent: 20, feel: "heavy", smoothChange: "quick ease", soundBend: "sound slows too" } },
      ],
    },
  });

  W.add("playDirection", {
    sliders: [
      ["rewindLook", "Rewind look", ["clean", "tape lines", "blurry streaks"], "How the picture looks while it runs backward."],
      ["rewindSound", "Rewind sound", ["silent", "reversed sound", "tape squeal"], "What the audience hears during the rewind.", { unordered: true }],
      ["replayAngle", "Replay from a new angle", ["same angle", "closer", "a new side"], "Whether the replay shows the moment from somewhere else."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { forward: "▶️", reversed: "◀️", "rewind and replay": "🔁" } },
        { face: "dial", slider: "replays" },
        { face: "balance", slider: "replaySpeed", left: "slower", right: "faster" },
      ],
      groups: [
        { label: "Direction", sliders: ["setting", "rewindLook", "rewindSound"] },
        { label: "Replays", sliders: ["replays", "replaySpeed", "replayAngle"] },
      ],
      presets: [
        { label: "Sports instant replay", plain: "Rewind and see it again, slower and closer.", set: { setting: "rewind and replay", replays: 2, replaySpeed: "slower", replayAngle: "closer" } },
        { label: "Memento backward", plain: "The scene simply runs in reverse.", set: { setting: "reversed", rewindLook: "clean", rewindSound: "reversed sound" } },
        { label: "VHS 'wait, what?'", plain: "A squealing tape rewind for a comic double take.", set: { setting: "rewind and replay", rewindLook: "tape lines", rewindSound: "tape squeal", replays: 1, replaySpeed: "same" } },
      ],
    },
  });

  W.add("beatSync", {
    sliders: [
      ["accents", "Big moments on", ["any beat", "strong beats", "the drop"], "Which beats get the biggest cuts or hits."],
      ["looseness", "Tight or human", ["machine tight", "a bit loose", "feels played"], "Whether the cuts land exactly or feel hand-played."],
      ["buildToDrop", "Cuts speed up before the drop", ["no", "a little", "a lot"], "Whether the cutting quickens as the music builds, to pull the audience into the drop."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "pad", x: "every", y: "offset", xLabel: "Cut every", yLabel: "Early or late" },
      ],
      groups: [
        { label: "Following the music", sliders: ["setting", "every", "accents"] },
        { label: "Feel", sliders: ["offset", "looseness", "buildToDrop"] },
      ],
      presets: [
        { label: "Edgar Wright Baby Driver", plain: "Every cut and action locked to the beat.", set: { setting: "on beats", every: 1, offset: 0, looseness: "machine tight" } },
        { label: "Festival aftermovie", plain: "Cuts speed up into the drop.", set: { setting: "on bars", accents: "the drop", buildToDrop: "a lot" } },
        { label: "Loose documentary", plain: "Cuts sit near the music without chasing it.", set: { setting: "near the beat", every: 8, looseness: "feels played" } },
      ],
    },
  });

  W.add("jumpCut", {
    sliders: [
      ["soundCarry", "Sound across the jump", ["jumps too", "smoothed over", "music covers it"], "Whether the sound skips with the picture or hides the jump."],
      ["purpose", "Why it jumps", ["save time", "restless energy", "comedy", "time passing"], "What the jump cuts are doing for the story.", { unordered: true }],
      ["density", "Jumps per minute", [0, 40, "per minute"], "How many jumps land in a minute."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "reframe", icons: { no: "⏹️", "slight punch-in": "🔎", alternating: "↔️" } },
        { face: "dial", slider: "density" },
      ],
      groups: [
        { label: "The jumps", sliders: ["setting", "gap", "density"] },
        { label: "Look, sound and purpose", sliders: ["reframe", "soundCarry", "purpose"] },
      ],
      presets: [
        { label: "Breathless Godard", plain: "Restless jumps right inside the same shot.", set: { setting: "constant", reframe: "no", purpose: "restless energy", soundCarry: "jumps too" } },
        { label: "YouTube talking head", plain: "Cut the pauses, punch in on every jump.", set: { setting: "rhythmic", gap: 12, reframe: "alternating", purpose: "save time", density: 20 } },
        { label: "Waiting montage", plain: "A few jumps show the hours dragging by.", set: { setting: "a few", gap: 48, purpose: "time passing", soundCarry: "music covers it" } },
      ],
    },
  });

  W.add("editTemplate", {
    sliders: [
      ["clipLength", "Each clip lasts", [0.3, 5, "seconds"], "How long each of your clips stays on screen."],
      ["textAmount", "Words on screen", ["none", "a few", "lots"], "How much text the template lays over the clips."],
      ["effectsLevel", "Effects and filters", ["clean", "some", "loaded"], "How heavily the template dresses up your clips."],
      ["hookFirst", "Best clip first", ["never", "sometimes", "always"], "Whether the strongest clip is pulled to the front to hook viewers."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", cinematic: "🎬", "daily life": "☕", selfie: "🤳", velocity: "⚡", lyrics: "🎵", meme: "😂", travel: "✈️", relationship: "💞", friendship: "🤝", family: "👪", "school life": "🎒", business: "💼" } },
        { face: "pad", x: "clips", y: "clipLength", xLabel: "Clips", yLabel: "Each clip lasts" },
        { face: "mixer", sliders: ["textAmount", "effectsLevel"] },
      ],
      groups: [
        { label: "The template", sliders: ["setting", "clips", "clipLength"] },
        { label: "Dressing", sliders: ["textAmount", "effectsLevel", "hookFirst"] },
      ],
      presets: [
        { label: "Velocity edit", plain: "Many short clips, loaded with speed effects.", set: { setting: "velocity", clips: 12, clipLength: 0.5, effectsLevel: "loaded", hookFirst: "always" } },
        { label: "Travel recap", plain: "Cinematic clips with a few words.", set: { setting: "travel", clips: 8, clipLength: 2, textAmount: "a few" } },
        { label: "Lyric video", plain: "Words on every clip, clean look.", set: { setting: "lyrics", textAmount: "lots", effectsLevel: "clean" } },
      ],
    },
  });

  W.add("retimeQuality", {
    sliders: [
      ["artifacts", "Allow glitches", ["none allowed", "a few", "embrace them"], "Whether the warping and smearing of made-up frames is hidden or used as a look."],
      ["sourceRate", "Filmed at", ["24 frames", "60 frames", "120 frames", "240 frames"], "How many pictures per second the clip was filmed with; more gives cleaner slow motion."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "repeating frames": "🔁", "frame blending": "🌫️", "optical flow": "🧠" } },
        { face: "dial", slider: "smoothness" },
        { face: "ladder", slider: "sourceRate" },
      ],
      groups: [
        { label: "How frames are made", sliders: ["setting", "sourceRate"] },
        { label: "Result", sliders: ["smoothness", "artifacts"] },
      ],
      presets: [
        { label: "Crisp sports slow-mo", plain: "Filmed fast, made smooth with no glitches.", set: { setting: "optical flow", sourceRate: "240 frames", smoothness: 5, artifacts: "none allowed" } },
        { label: "Choppy music video", plain: "Repeated frames for a stuttery step look.", set: { setting: "repeating frames", sourceRate: "24 frames", smoothness: 0, artifacts: "embrace them" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
