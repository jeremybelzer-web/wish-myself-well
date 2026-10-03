/* Performance: a window for every curiosity whose home is Performance on the Screen. */
(function (W) {
  W.add("emotion", {
    sliders: [
      ["mixed", "Mixed feelings", ["pure", "a hint of another", "torn between two"], "Whether one clean feeling plays, or a second one creeps in."],
      ["masking", "Hidden or shown", ["shown openly", "partly hidden", "bottled up", "covered with the opposite"], "How hard the character works to hide what they feel."],
      ["audienceShare", "The audience feels it too", ["watches from outside", "understands it", "feels it with them"], "How much the audience is pulled into the feeling instead of watching it."],
      ["shiftSpeed", "How fast the feeling turns", ["slowly dawns", "shifts", "snaps"], "Whether a new feeling creeps in or arrives all at once."],
    ],
    window: {
      faces: [
        { face: "pad", x: "valence", y: "arousal", xLabel: "unhappy to happy", yLabel: "calm to wound up" },
        { face: "tiles", slider: "setting", icons: { loving: "🥰", joyful: "😄", curious: "🤔", melancholy: "😔", anxious: "😬", fearful: "😨", angry: "😠", triumphant: "🏆", absurd: "🤪", dreamlike: "💭" } },
      ],
      groups: [
        { label: "The feeling", sliders: ["setting", "valence", "arousal", "mixed"] },
        { label: "Showing it", sliders: ["masking", "audienceShare"] },
        { label: "Over time", sliders: ["shiftSpeed"] },
      ],
      presets: [
        { label: "Stiff upper lip", plain: "Deep sadness held behind a calm face.", set: { setting: "melancholy", valence: -3, arousal: 1, masking: "bottled up" } },
        { label: "Horror dread creeping in", plain: "Fear that grows slowly until we share it.", set: { setting: "fearful", arousal: 4, shiftSpeed: "slowly dawns", audienceShare: "feels it with them" } },
        { label: "Triumphant finale", plain: "Pure joy at full volume, everyone cheering along.", set: { setting: "triumphant", valence: 5, arousal: 5, mixed: "pure", audienceShare: "feels it with them" } },
        { label: "Bittersweet goodbye", plain: "Happy and sad at once, smiling through it.", set: { setting: "loving", valence: 1, mixed: "torn between two", masking: "covered with the opposite" } },
      ],
    },
  });

  W.add("characterPath", {
    sliders: [
      ["endMark", "Where they end up", ["same place", "nearer someone", "further away", "off screen"], "Where the walk leaves them when it is over.", { unordered: true }],
      ["pathRepeat", "Repeats the path", ["once", "twice", "pacing back and forth"], "Whether they cover the ground once or keep going over it."],
      ["pathTiming", "When they set off", ["before the line", "on the line", "after the line"], "Whether the move starts before, with, or after the words."],
      ["pullOfEye", "How much it pulls our eye", ["blends in", "noticed", "demands attention"], "How strongly the move drags the audience's eye along with it."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { still: "🧍", cross: "↔️", approach: "⬆️", retreat: "⬇️", circle: "🔄" } },
        { face: "dial", slider: "length" },
        { face: "ladder", slider: "pullOfEye" },
      ],
      groups: [
        { label: "The path", sliders: ["setting", "length", "endMark", "pathRepeat"] },
        { label: "Why and how", sliders: ["purpose", "smoothness"] },
        { label: "Timing and attention", sliders: ["pathTiming", "pullOfEye"] },
      ],
      presets: [
        { label: "Nervous pacing", plain: "Back and forth across the room, stopping and starting.", set: { setting: "cross", pathRepeat: "pacing back and forth", smoothness: "stops and starts", purpose: "wandering" } },
        { label: "Western showdown walk", plain: "A slow, smooth approach that starts before anyone speaks.", set: { setting: "approach", length: 5, smoothness: "smooth", pathTiming: "before the line", endMark: "nearer someone" } },
        { label: "Chase through the scene", plain: "Erratic running that grabs every eye.", set: { purpose: "chasing", smoothness: "erratic", pullOfEye: "demands attention", endMark: "off screen" } },
      ],
    },
  });

  W.add("bodyEnter", {
    sliders: [
      ["entryTiming", "When they arrive", ["before the line", "on their own line", "mid-line", "after the line"], "Where in the talk the entrance or exit lands."],
      ["holdBefore", "Empty frame before they enter", [0, 5, "s"], "How long we stare at the empty space before someone fills it."],
      ["announce", "Heard before seen", ["no warning", "footsteps", "a voice first"], "Whether a sound warns us before the body appears."],
      ["reveal", "How big a moment it is", ["slips by", "noticed", "a big entrance"], "How much the entrance grabs the audience's attention."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { already: "🧍", enters: "🚪", leaves: "🏃" } },
        { face: "compass", slider: "side", angles: { left: 270, right: 90, top: 0, bottom: 180 } },
        { face: "ladder", slider: "reveal" },
      ],
      groups: [
        { label: "In or out", sliders: ["setting", "side", "speed"] },
        { label: "Timing", sliders: ["entryTiming", "holdBefore", "announce"] },
        { label: "The moment", sliders: ["reveal"] },
      ],
      presets: [
        { label: "Sitcom neighbor burst-in", plain: "The door flies open and the scene belongs to them.", set: { setting: "enters", side: "left", speed: "bursts in", reveal: "a big entrance", announce: "no warning" } },
        { label: "Horror slow reveal", plain: "Footsteps, an empty doorway, then someone slips in.", set: { setting: "enters", speed: "slips in", holdBefore: 4, announce: "footsteps", reveal: "noticed" } },
        { label: "Quiet exit", plain: "They leave after the line and nobody notices.", set: { setting: "leaves", speed: "slips in", entryTiming: "after the line", reveal: "slips by" } },
      ],
    },
  });

  W.add("silence", {
    sliders: [
      ["placement", "Where it falls", ["before the answer", "mid-line", "after the punchline"], "The spot in the talk where the quiet sits.", { unordered: true }],
      ["tension", "How heavy it feels", ["comfortable", "awkward", "unbearable"], "Whether the quiet is easy, uncomfortable, or nearly painful."],
      ["breaker", "Who breaks it", ["the speaker", "the listener", "something else"], "Who or what ends the silence.", { unordered: true }],
      ["breakWith", "Broken by", ["a soft word", "a normal line", "a loud burst"], "How gently or suddenly the silence ends."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "seconds" },
        { face: "ladder", slider: "tension" },
        { face: "tiles", slider: "filled", icons: { nothing: "⬜", breath: "💨", "room sound": "🔈", action: "✋" } },
      ],
      groups: [
        { label: "The quiet", sliders: ["setting", "seconds", "filled", "placement"] },
        { label: "How it feels", sliders: ["tension"] },
        { label: "How it ends", sliders: ["breaker", "breakWith"] },
      ],
      presets: [
        { label: "Pinter pause", plain: "A long, loaded silence where nothing fills the air.", set: { setting: "long", seconds: 6, filled: "nothing", tension: "unbearable" } },
        { label: "Office-style awkward beat", plain: "A short, cringing quiet after the joke dies.", set: { setting: "short", seconds: 3, filled: "room sound", tension: "awkward", placement: "after the punchline" } },
        { label: "Comfortable old couple", plain: "An easy quiet that nobody needs to fill.", set: { setting: "long", seconds: 8, filled: "breath", tension: "comfortable", breakWith: "a soft word" } },
        { label: "Silence then explosion", plain: "Everyone waits, and then someone bursts.", set: { setting: "long", seconds: 5, tension: "unbearable", breakWith: "a loud burst" } },
      ],
    },
  });

  W.add("faceLens", {
    sliders: [
      ["leak", "A true feeling leaks through", ["never", "a flicker", "clearly"], "Whether a hidden feeling slips out behind the expression."],
      ["faceTiming", "When the reaction lands", ["before the line", "on the line", "after the line"], "Whether the face moves before, with, or after the words."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "expression" },
        { face: "pad", x: "brows", y: "eyes", xLabel: "eyebrows", yLabel: "eyes" },
        { face: "tiles", slider: "mouth", icons: { "pressed tight": "😬", neutral: "😐", smile: "🙂", open: "😮", "wide open": "😱" } },
      ],
      groups: [
        { label: "How big", sliders: ["expression", "sided", "leak"] },
        { label: "The parts", sliders: ["brows", "eyes", "mouth"] },
        { label: "Little movements", sliders: ["darts", "blinks", "lipSync"] },
        { label: "Timing", sliders: ["changeSpeed", "faceTiming"] },
      ],
      presets: [
        { label: "Buster Keaton stone face", plain: "Nothing moves, whatever happens.", set: { expression: "blank", brows: "neutral", eyes: "normal", mouth: "neutral", blinks: 0, leak: "never" } },
        { label: "Rubber-faced clown", plain: "Every feeling huge and instant.", set: { expression: "extreme", brows: "way up", eyes: "popping", mouth: "wide open", changeSpeed: "snaps" } },
        { label: "Poker face with a tell", plain: "Almost still, but one side gives the game away.", set: { expression: "subtle", sided: "slightly lopsided", leak: "a flicker", changeSpeed: "melts slowly" } },
      ],
    },
  });

  W.add("characterSpeed", {
    sliders: [
      ["contrast", "Faster or slower than others", ["much slower", "slower", "same", "faster", "much faster"], "How their speed stands out against the people around them."],
      ["bursts", "Sudden bursts", ["never", "now and then", "often"], "Whether they suddenly break into a quick move."],
      ["feelsLike", "How the speed reads", ["lazy", "relaxed", "purposeful", "urgent", "panicked"], "What the speed tells the audience about their state."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "contrast", left: "slower than others", right: "faster than others" },
      ],
      groups: [
        { label: "Speed", sliders: ["setting", "easing", "contrast"] },
        { label: "What it says", sliders: ["feelsLike", "bursts"] },
        { label: "Over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Lazy Sunday stroll", plain: "Slow, steady and in no hurry at all.", set: { setting: 1, easing: "steady", feelsLike: "lazy", bursts: "never" } },
        { label: "Late for the train", plain: "Fast and speeding up, faster than everyone.", set: { setting: 5, easing: "speeds up", feelsLike: "urgent", contrast: "much faster" } },
        { label: "Calm in the chaos", plain: "Everyone runs; they walk with purpose.", set: { setting: 2, contrast: "much slower", feelsLike: "purposeful" } },
      ],
    },
  });

  W.add("characterToLens", {
    sliders: [
      ["arrival", "Where they stop", ["far off", "mid shot", "close", "filling the lens"], "How close to the camera the move ends."],
      ["eyeLine", "Looks into the lens", ["never", "glances", "stares into it"], "Whether they look straight at the audience as they come."],
      ["approachSpeed", "How fast they come", ["creeping", "steady", "rushing"], "The speed of the move toward or away from us."],
      ["confront", "How confronting it feels", ["passing by", "engaging", "confronting"], "How much the move pushes on the audience."],
    ],
    window: {
      faces: [
        { face: "compass", slider: "setting", angles: { toward: 180, away: 0, across: 90 } },
        { face: "pad", x: "angle", y: "distance", xLabel: "angle of approach", yLabel: "how near" },
        { face: "ladder", slider: "confront" },
      ],
      groups: [
        { label: "The move", sliders: ["setting", "angle", "approachSpeed"] },
        { label: "How close", sliders: ["distance", "arrival"] },
        { label: "Facing us", sliders: ["eyeLine", "confront"] },
      ],
      presets: [
        { label: "Kubrick stare walk-in", plain: "A slow march into the lens, eyes locked on us.", set: { setting: "toward", approachSpeed: "creeping", eyeLine: "stares into it", arrival: "filling the lens", confront: "confronting" } },
        { label: "Walking into the sunset", plain: "They walk away from us and keep going.", set: { setting: "away", approachSpeed: "steady", distance: 0, arrival: "far off", eyeLine: "never" } },
        { label: "Passing parade", plain: "People cross the frame without a glance.", set: { setting: "across", angle: 90, confront: "passing by", eyeLine: "never" } },
      ],
    },
  });

  W.add("whoMoves", {
    sliders: [
      ["moveWhen", "When they move", ["between lines", "on the key word", "through the whole line"], "Which part of the talk carries the movement."],
      ["power", "Moving shows who's in charge", ["mover is weaker", "no meaning", "mover takes control"], "Whether moving reads as nerves or as power."],
      ["stillContrast", "The still one stands out", ["no", "a little", "strongly"], "How much the one who stays still draws our eye."],
      ["trades", "Swaps who moves", ["never", "once", "back and forth"], "Whether the moving role passes between people."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { speaker: "🗣️", listener: "👂", both: "👥", neither: "🧍" } },
        { face: "dial", slider: "share" },
        { face: "balance", slider: "power", left: "weaker", right: "in control" },
        { face: "stage", title: "Where the mover ends up", tokens: [{ who: "person", label: "Still one" }, { who: "person", label: "Mover", about: 0, around: "circleAround", distance: "endGap" }, { who: "camera" }] },
      ],
      groups: [
        { label: "Who and how much", sliders: ["setting", "share", "moveWhen"] },
        { label: "What it says", sliders: ["power", "stillContrast", "noticeable"] },
        { label: "Over time", sliders: ["trades"] },
      ],
      presets: [
        { label: "Sorkin walk and talk", plain: "Both move through nearly every line.", set: { setting: "both", share: 90, moveWhen: "through the whole line" } },
        { label: "Power stand-off", plain: "One prowls, the other holds dead still.", set: { setting: "speaker", power: "mover takes control", stillContrast: "strongly" } },
        { label: "Tables turn", plain: "The moving role swaps when the power shifts.", set: { setting: "both", trades: "once", power: "mover takes control" } },
      ],
    },
  });

  W.add("volume", {
    sliders: [
      ["peakWord", "Loudest on", ["no word", "the key word", "the last word"], "Which word the voice leans on hardest.", { unordered: true }],
      ["sudden", "Sudden jumps", ["never", "rarely", "often"], "How often the voice jumps in loudness without warning."],
      ["distanceFeel", "Sounds like", ["intimate", "across the table", "across the room", "shouting distance"], "How far apart the voices feel."],
      ["buildTime", "Time to build", [0, 30, "s"], "How long a rise or fall in loudness takes."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "distanceFeel" },
        { face: "tiles", slider: "trend", icons: { falling: "📉", steady: "➖", building: "📈" } },
      ],
      groups: [
        { label: "How loud", sliders: ["setting", "spread", "distanceFeel"] },
        { label: "Over time", sliders: ["trend", "buildTime", "sudden"] },
        { label: "Emphasis", sliders: ["peakWord"] },
      ],
      presets: [
        { label: "Whispered intimacy", plain: "Soft voices, very close together.", set: { setting: 1, distanceFeel: "intimate", trend: "steady", sudden: "never" } },
        { label: "Argument boiling over", plain: "Voices climb for twenty seconds, then crack loud.", set: { trend: "building", buildTime: 20, sudden: "often", spread: 4 } },
        { label: "Calm after the storm", plain: "The shouting slowly dies away.", set: { setting: 2, trend: "falling", buildTime: 15 } },
      ],
    },
  });

  W.add("pace", {
    sliders: [
      ["pauseBetween", "Gap between lines", [0, 3, "s"], "How long the air stays empty between one line and the next."],
      ["pickup", "Cues picked up", ["lazy", "on time", "jumping in early"], "How fast each person answers the last line."],
      ["rush", "Speed near the end", ["slows down", "steady", "speeds up"], "Whether the talk tightens or loosens as the scene ends."],
      ["variation", "Pace varies", ["even", "some changes", "wild swings"], "Whether the speed stays put or swings around."],
    ],
    window: {
      faces: [
        { face: "pad", x: "wpm", y: "pauseBetween", xLabel: "words per minute", yLabel: "gap between lines" },
        { face: "tiles", slider: "overlap", icons: { "clean turns": "🔁", "some overlap": "🔀", "talking over each other": "🗯️" } },
      ],
      groups: [
        { label: "Speed", sliders: ["setting", "wpm", "variation"] },
        { label: "Between the lines", sliders: ["pauseBetween", "pickup", "overlap"] },
        { label: "Over the scene", sliders: ["rush"] },
      ],
      presets: [
        { label: "Screwball comedy", plain: "Rapid fire, no gaps, everyone talking at once.", set: { setting: "fast", wpm: 210, pauseBetween: 0, pickup: "jumping in early", overlap: "talking over each other" } },
        { label: "Slow Western drawl", plain: "Few words, long gaps, all the time in the world.", set: { setting: "slow", wpm: 90, pauseBetween: 2.5, pickup: "lazy", overlap: "clean turns" } },
        { label: "Thriller countdown", plain: "Normal talk that speeds up as time runs out.", set: { setting: "medium", rush: "speeds up", variation: "some changes" } },
      ],
    },
  });

  W.add("faceIntensity", {
    sliders: [
      ["peakAt", "Peaks on", ["early in the beat", "the key word", "the end of the beat"], "When the expression is at its strongest.", { unordered: true }],
      ["hold", "How long it holds", [0, 5, "s"], "How long the strongest look stays before it eases."],
      ["release", "How it fades", ["snaps off", "fades", "lingers"], "How the expression leaves the face."],
      ["hidden", "Fights to hide it", ["no", "a little", "hard"], "Whether the person tries to keep the expression down."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "region", icons: { eyes: "👀", mouth: "👄", brow: "🤨", "whole face": "😮" } },
      ],
      groups: [
        { label: "Strength and place", sliders: ["setting", "region", "hidden"] },
        { label: "Timing", sliders: ["peakAt", "hold", "release", "change"] },
      ],
      presets: [
        { label: "Reaction shot that lands", plain: "A big, whole-face reaction held on the key word.", set: { setting: 5, region: "whole face", peakAt: "the key word", hold: 2 } },
        { label: "Holding back tears", plain: "Strong feeling in the eyes, fought down hard.", set: { setting: 3, region: "eyes", hidden: "hard", release: "lingers" } },
        { label: "Flash of anger", plain: "A quick flare that snaps away.", set: { setting: 4, region: "brow", hold: 0.5, release: "snaps off" } },
      ],
    },
  });

  W.add("touch", {
    sliders: [
      ["where", "Where they touch", ["hand", "arm", "shoulder", "face", "embrace"], "The part of the body the touch lands on.", { unordered: true }],
      ["touchTiming", "On which moment", ["before the line", "on the key word", "after the line"], "Whether the touch comes before, with, or after the words."],
      ["welcome", "Welcome or not", ["pulled away from", "tolerated", "welcomed", "returned"], "How the other person takes the touch."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "where", icons: { hand: "🤝", arm: "💪", shoulder: "🫲", face: "🫳", embrace: "🫂" } },
        { face: "dial", slider: "pressure" },
        { face: "ladder", slider: "welcome" },
        { face: "stage", title: "Where the touch comes from", tokens: [{ who: "person" }, { who: "person", about: 0, around: "fromAngle", distance: "gapBefore" }, { who: "camera" }] },
      ],
      groups: [
        { label: "The touch", sliders: ["setting", "where", "pressure"] },
        { label: "Between them", sliders: ["who", "welcome"] },
        { label: "Timing", sliders: ["touchTiming"] },
      ],
      presets: [
        { label: "First-date brush of hands", plain: "A light, brief touch that is quietly welcomed.", set: { setting: "brief", where: "hand", pressure: 1, welcome: "welcomed" } },
        { label: "Comforting hug", plain: "A long embrace, held and given back.", set: { setting: "held", where: "embrace", pressure: 3, welcome: "returned" } },
        { label: "Unwanted grab", plain: "A firm grip on the arm that is pulled away from.", set: { setting: "brief", where: "arm", pressure: 4, welcome: "pulled away from", touchTiming: "on the key word" } },
      ],
    },
  });

  W.add("vocalTone", {
    sliders: [
      ["warmth", "Warm or cold", ["icy", "cool", "neutral", "warm", "tender"], "How much warmth the voice carries."],
      ["pitch", "Pitch", ["low", "natural", "high"], "How high or low the voice sits."],
      ["crack", "Voice cracks", ["never", "once", "keeps cracking"], "Whether feeling breaks through the voice."],
      ["subtext", "Says one thing, means another", ["means it", "a hint of something else", "the opposite"], "How far the tone pulls against the words."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { flat: "➖", rising: "↗️", falling: "↘️", breaking: "💔", whispered: "🤫", shouted: "📢" } },
        { face: "pad", x: "warmth", y: "strength", xLabel: "icy to tender", yLabel: "how strongly" },
      ],
      groups: [
        { label: "The tone", sliders: ["setting", "strength", "pitch"] },
        { label: "Feeling in it", sliders: ["warmth", "crack", "subtext"] },
        { label: "Over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Icy villain", plain: "Low, flat and cold, meaning more than it says.", set: { setting: "flat", warmth: "icy", pitch: "low", subtext: "a hint of something else" } },
        { label: "Breaking confession", plain: "A tender voice that keeps cracking.", set: { setting: "breaking", warmth: "tender", crack: "keeps cracking", strength: 4 } },
        { label: "Sarcastic comeback", plain: "Nice words, the opposite meaning.", set: { setting: "rising", subtext: "the opposite", warmth: "cool" } },
      ],
    },
  });

  W.add("toneArc", {
    sliders: [
      ["toneColor", "Main tone here", ["hopeful", "playful", "tense", "grim", "bittersweet"], "The flavor of the voice at this point in the story.", { unordered: true }],
      ["contrastPrev", "Change from the last part", ["same tone", "a shade different", "a sharp turn"], "How far this tone moves from the one before it."],
      ["stretch", "How much of the film", [0, 100, "%"], "How long this tone lasts across the film."],
      ["returnLater", "Comes back later", ["never", "echoed once", "returns at the end"], "Whether this tone comes back to tie the story together."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "position" },
        { face: "tiles", slider: "toneColor", icons: { hopeful: "🌅", playful: "🎈", tense: "😬", grim: "🌑", bittersweet: "🍋" } },
      ],
      groups: [
        { label: "Where in the story", sliders: ["setting", "position", "stretch"] },
        { label: "The tone", sliders: ["toneColor", "contrastPrev"] },
        { label: "Echoes", sliders: ["returnLater", "noticeable"] },
      ],
      presets: [
        { label: "Pixar opening gut-punch", plain: "Playful early, then a sharp turn to grief.", set: { setting: "opening", position: 10, toneColor: "bittersweet", contrastPrev: "a sharp turn" } },
        { label: "Grim climax", plain: "The darkest tone sits right at the climax.", set: { setting: "climax", position: 85, toneColor: "grim", contrastPrev: "a sharp turn" } },
        { label: "Full circle ending", plain: "The opening's hopeful tone returns at the end.", set: { setting: "ending", position: 95, toneColor: "hopeful", returnLater: "returns at the end" } },
      ],
    },
  });

  W.add("timePerCharacter", {
    sliders: [
      ["secondShare", "Second person's share", [0, 100, "%"], "How much screen time the next most-seen person gets."],
      ["listenerTime", "Time on the listener", [0, 100, "%"], "How much we watch the person who is not talking."],
      ["shiftAt", "Shifts to a new lead", ["never", "once", "several times"], "Whether the story hands the spotlight to someone else."],
      ["withholds", "Keeps someone off screen", ["no", "a little", "mostly hidden"], "Whether an important person is kept from view to make us curious."],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["lead", "secondShare", "listenerTime"] },
        { face: "ladder", slider: "setting" },
      ],
      groups: [
        { label: "Who gets the screen", sliders: ["setting", "lead", "secondShare", "listenerTime"] },
        { label: "Hiding and handing over", sliders: ["withholds", "shiftAt", "change"] },
      ],
      presets: [
        { label: "One-hero film", plain: "The lead is in nearly every shot.", set: { setting: "one person dominates", lead: 85, secondShare: 10, shiftAt: "never" } },
        { label: "Ensemble cast", plain: "Time shared evenly around the group.", set: { setting: "even", lead: 25, secondShare: 25, shiftAt: "several times" } },
        { label: "Jaws: hide the monster", plain: "The threat stays mostly off screen.", set: { setting: "uneven", withholds: "mostly hidden" } },
        { label: "Psycho hand-off", plain: "The story drops its lead and picks up someone new.", set: { setting: "uneven", shiftAt: "once", lead: 50 } },
      ],
    },
  });

  W.add("actionCutRate", {
    sliders: [
      ["clarity", "Easy to follow", ["chaotic", "choppy", "clear", "crystal clear"], "Whether the audience can tell who hits whom."],
      ["buildUp", "Speeds up toward the hit", ["steady", "builds", "explodes at the end"], "Whether the cutting quickens toward the big moment."],
      ["breather", "Calm shots between", ["none", "now and then", "often"], "How often a longer shot lets the audience catch its breath."],
      ["breatherLength", "Length of a calm shot", [1, 10, "s"], "How long those calmer shots last."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "clarity" },
        { face: "tiles", slider: "buildUp", icons: { steady: "➖", builds: "📈", "explodes at the end": "💥" } },
      ],
      groups: [
        { label: "How fast", sliders: ["setting", "variation", "buildUp"] },
        { label: "Following the action", sliders: ["clarity", "noticeable"] },
        { label: "Breathing room", sliders: ["breather", "breatherLength"] },
      ],
      presets: [
        { label: "Shaky spy-thriller fight", plain: "Very fast, choppy cutting that feels frantic.", set: { setting: 8, clarity: "chaotic", breather: "none", variation: 4 } },
        { label: "Clear chaos chase", plain: "Fast cutting, but always easy to follow.", set: { setting: 7, clarity: "crystal clear", buildUp: "builds" } },
        { label: "Long-take brawl", plain: "Few cuts, so every hit plays out whole.", set: { setting: 2, clarity: "crystal clear", breather: "often", breatherLength: 8 } },
      ],
    },
  });

  W.add("walkAndTalk", {
    sliders: [
      ["camera", "Camera", ["ahead of them", "beside them", "behind them"], "Where the camera travels as they walk.", { unordered: true }],
      ["passersby", "People passing", ["empty", "a few", "busy"], "How crowded the route is around them."],
      ["routeLength", "How far they go", ["a hallway", "a few rooms", "a whole building"], "The length of the journey during the talk."],
      ["stopForLine", "Stops for the big line", ["never", "once", "every key line"], "Whether they halt to land an important line."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "share" },
        { face: "tiles", slider: "pace", icons: { strolling: "🚶", walking: "🚶‍♂️", hurrying: "🏃", running: "💨" } },
        { face: "ladder", slider: "stopForLine" },
        { face: "stage", title: "Walkers and camera, from above", walk: true, tokens: [{ who: "person" }, { who: "person", about: 0, distance: "sideGap" }, { who: "camera", about: 0, around: "camAround", distance: "camDistance" }] },
      ],
      groups: [
        { label: "The walk", sliders: ["share", "pace", "routeLength"] },
        { label: "Around them", sliders: ["obstacles", "passersby", "camera"] },
        { label: "Landing lines", sliders: ["stopForLine"] },
      ],
      presets: [
        { label: "West Wing corridor", plain: "Hurrying through a busy building, stopping once for the big line.", set: { share: 90, pace: "hurrying", camera: "ahead of them", passersby: "busy", routeLength: "a whole building", stopForLine: "once" } },
        { label: "Before Sunrise stroll", plain: "A slow, easy walk side by side through the town.", set: { share: 80, pace: "strolling", camera: "beside them", passersby: "a few", stopForLine: "never" } },
        { label: "Hallway quick chat", plain: "A short hurried exchange on the way somewhere.", set: { share: 50, pace: "walking", routeLength: "a hallway", camera: "behind them" } },
      ],
    },
  });

  W.add("listenerBody", {
    sliders: [
      ["reaction", "Kind of reaction", ["frozen", "small shifts", "fidgeting", "big reaction"], "How much the listener's body moves while listening."],
      ["hands", "What the hands do", ["still", "fidget", "cross arms", "touch face"], "Where the listener's hands go.", { unordered: true }],
      ["reactTiming", "When they react", ["before the speaker finishes", "on the key word", "after a beat"], "Whether the body answers early, on the word, or late."],
      ["stealsFocus", "Steals the scene", ["stays back", "shares it", "steals it"], "How much the listener pulls our eye from the speaker."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "agrees", left: "pulls away", right: "leans in" },
        { face: "tiles", slider: "seen", icons: { "off screen": "🙈", "in the edge of frame": "◧", "in their own shot": "🎯" } },
        { face: "ladder", slider: "stealsFocus" },
      ],
      groups: [
        { label: "The body", sliders: ["reaction", "hands", "agrees"] },
        { label: "On screen", sliders: ["seen", "stealsFocus", "noticeable"] },
        { label: "Timing", sliders: ["reactTiming", "change"] },
      ],
      presets: [
        { label: "Look to the camera", plain: "A tiny, late reaction in their own shot that gets the laugh.", set: { reaction: "small shifts", reactTiming: "after a beat", seen: "in their own shot", stealsFocus: "steals it" } },
        { label: "Silent judgment", plain: "Arms crossed, frozen, pulling away.", set: { reaction: "frozen", hands: "cross arms", agrees: "pulls away", stealsFocus: "shares it" } },
        { label: "Hanging on every word", plain: "Leaning in, reacting on each key word.", set: { agrees: "leans in", reaction: "small shifts", reactTiming: "on the key word" } },
      ],
    },
  });

  W.add("animFeelLens", {
    sliders: [
      ["staging", "One clear action at a time", ["busy", "mostly clear", "one at a time"], "Whether the audience sees one clear action or many at once."],
      ["feelShift", "How the feel changes", ["holds", "shifts per scene", "snaps on a beat"], "Whether the movement style stays put or changes through the film."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "style" },
        { face: "tiles", slider: "spacing", icons: { even: "➖", "ease in": "↗️", "ease out": "↘️", "ease both": "〰️", snap: "⚡" } },
        { face: "mixer", sliders: ["squash", "poseRate"] },
      ],
      groups: [
        { label: "Overall feel", sliders: ["style", "exaggeration", "staging", "feelShift"] },
        { label: "Timing of moves", sliders: ["spacing", "anticipation", "overshoot", "holds", "poseRate"] },
        { label: "Shape and paths", sliders: ["squash", "arcs"] },
        { label: "Extra motion", sliders: ["overlap", "secondary"] },
      ],
      presets: [
        { label: "Classic Disney", plain: "Lively, smooth arcs, big wind-ups and soft settles.", set: { style: "lively", spacing: "ease both", anticipation: "big", overshoot: "settle", squash: 3, arcs: "arc", staging: "one at a time" } },
        { label: "1930s rubber hose", plain: "Wild, bouncy, everything flopping and stretching.", set: { style: "rubber-hose wild", squash: 5, exaggeration: "huge", overlap: "all", overshoot: "bounce" } },
        { label: "Limited anime", plain: "Long held poses, few drawings, sudden snaps.", set: { style: "realistic", holds: "long freezes", poseRate: 2, spacing: "snap", secondary: "a little" } },
        { label: "Stiff robot", plain: "Even, straight, no give at all.", set: { style: "stiff and robotic", spacing: "even", arcs: "straight", squash: 0, overlap: "none" } },
      ],
    },
  });

  W.add("poseRigLens", {
    sliders: [
      ["poseHold", "How long poses hold", [0, 48, "frames"], "How long each strong pose is held before the next."],
      ["weightShift", "Weight shifts", ["never", "now and then", "constantly"], "How often the body moves its weight from foot to foot."],
      ["focusPose", "The pose points our eye", ["nowhere", "toward someone", "at the key thing"], "Whether the pose leads the audience's eye somewhere."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "lineOfAction" },
        { face: "tiles", slider: "hands", icons: { empty: "🖐️", "a prop": "☕", "a surface": "🪵", "another person": "🤝" } },
        { face: "ladder", slider: "balance" },
      ],
      groups: [
        { label: "The pose", sliders: ["lineOfAction", "silhouette", "twist", "symmetry"] },
        { label: "Weight and feet", sliders: ["balance", "feet", "weightShift"] },
        { label: "Hands and eye", sliders: ["hands", "focusPose"] },
        { label: "Timing", sliders: ["poseHold"] },
      ],
      presets: [
        { label: "Superhero landing", plain: "A strong S-curve, planted feet, crystal clear outline.", set: { lineOfAction: "S curve", silhouette: "crystal clear", balance: "planted", feet: "planted", poseHold: 24 } },
        { label: "Nervous wallflower", plain: "Stiff, square, and always shifting weight.", set: { lineOfAction: "straight and stiff", twist: "square to the camera", weightShift: "constantly", symmetry: "mirror twins" } },
        { label: "Pointing at the clue", plain: "The whole body leads our eye to the key thing.", set: { lineOfAction: "strong curve", focusPose: "at the key thing", twist: "strong twist" } },
      ],
    },
  });

  W.add("dynamicRange", {
    sliders: [
      ["quietest", "Quietest line", ["breath", "whisper", "soft talk", "normal"], "How quiet the softest line gets."],
      ["loudest", "Loudest line", ["normal", "raised", "shout", "scream"], "How loud the biggest line gets."],
      ["jumpSpeed", "Quiet to loud", ["slowly swells", "jumps", "explodes"], "How quickly the voice moves between soft and loud."],
      ["surprise", "Startles the audience", ["never", "once", "again and again"], "Whether a sudden loud line makes people jump."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "db" },
        { face: "pad", x: "quietest", y: "loudest", xLabel: "quietest line", yLabel: "loudest line" },
        { face: "balance", slider: "setting", left: "narrow", right: "wide" },
      ],
      groups: [
        { label: "The range", sliders: ["setting", "db", "quietest", "loudest"] },
        { label: "Jumps", sliders: ["jumpSpeed", "surprise", "noticeable"] },
      ],
      presets: [
        { label: "Even sitcom talk", plain: "Everyone speaks at about the same level.", set: { setting: "narrow", db: 6, quietest: "soft talk", loudest: "raised", surprise: "never" } },
        { label: "Whisper then scream", plain: "Very quiet lines that explode into shouts.", set: { setting: "wide", db: 28, quietest: "whisper", loudest: "scream", jumpSpeed: "explodes", surprise: "once" } },
        { label: "Slow-burn drama", plain: "A wide range that swells rather than jumps.", set: { setting: "wide", db: 20, jumpSpeed: "slowly swells" } },
      ],
    },
  });

  W.add("rangeChanges", {
    sliders: [
      ["direction", "Mostly goes", ["quiet to loud", "both ways", "loud to quiet"], "Whether the jumps mostly climb, drop, or both.", { unordered: true }],
      ["pattern", "Pattern", ["regular", "loosely regular", "unpredictable"], "Whether the audience can guess when the next jump comes."],
      ["cueWord", "Jump lands on", ["any word", "the key word", "the punchline"], "Which word the change hits.", { unordered: true }],
      ["settle", "Time to settle back", [0, 10, "s"], "How long until the voices return to normal."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "size" },
        { face: "tiles", slider: "direction", icons: { "quiet to loud": "📈", "both ways": "↕️", "loud to quiet": "📉" } },
      ],
      groups: [
        { label: "How often", sliders: ["setting", "pattern"] },
        { label: "The jump", sliders: ["size", "direction", "cueWord", "noticeable"] },
        { label: "After", sliders: ["settle"] },
      ],
      presets: [
        { label: "Punchline shout", plain: "Calm talk, then a loud burst on the joke.", set: { setting: "rare", cueWord: "the punchline", direction: "quiet to loud", size: 4, settle: 2 } },
        { label: "Unpredictable menace", plain: "You never know when the voice will rise.", set: { setting: "every other", pattern: "unpredictable", size: 5 } },
        { label: "Seesaw argument", plain: "Every line jumps one way or the other.", set: { setting: "every line", direction: "both ways", pattern: "regular" } },
      ],
    },
  });

  W.add("breath", {
    sliders: [
      ["breathFeel", "Kind of breath", ["calm", "sigh", "gasp", "shaky"], "What the breath sounds and feels like.", { unordered: true }],
      ["breathBefore", "Breath before big lines", ["never", "on key lines", "every line"], "Whether a breath sets up the important line."],
      ["held", "Holding the breath", ["never", "briefly", "long held"], "Whether the character stops breathing to build tension."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "audible" },
        { face: "tiles", slider: "breathFeel", icons: { calm: "😌", sigh: "😮‍💨", gasp: "😲", shaky: "😰" } },
      ],
      groups: [
        { label: "Breath and words", sliders: ["setting", "breathBefore"] },
        { label: "The breath", sliders: ["breathFeel", "audible", "length"] },
        { label: "Tension", sliders: ["held"] },
      ],
      presets: [
        { label: "Before the confession", plain: "A long, audible breath before the big line.", set: { setting: "breath then speak", breathFeel: "shaky", audible: 4, length: 2, breathBefore: "on key lines" } },
        { label: "Hiding from the monster", plain: "Breath held long, then a gasp.", set: { held: "long held", breathFeel: "gasp", audible: 3 } },
        { label: "Clean studio voice", plain: "Breath hidden, the lines just flow.", set: { setting: "ignore breath", audible: 0, breathBefore: "never" } },
      ],
    },
  });

  W.add("eating", {
    sliders: [
      ["food", "What they eat", ["a snack", "a meal", "something crunchy", "a drink"], "What is in their hands and mouth.", { unordered: true }],
      ["appetite", "How they eat", ["picking at it", "normal", "wolfing it down"], "How hungrily they go at the food."],
      ["biteTiming", "Bites land", ["between lines", "before the punchline", "mid-sentence"], "When a bite or sip interrupts the talk.", { unordered: true }],
      ["chewing", "Chewing you can hear", ["silent", "soft", "loud"], "How loud the eating is in the mix."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "food", icons: { "a snack": "🍪", "a meal": "🍝", "something crunchy": "🥕", "a drink": "🥤" } },
        { face: "dial", slider: "share" },
        { face: "ladder", slider: "appetite" },
      ],
      groups: [
        { label: "Eating and talking", sliders: ["setting", "share", "biteTiming"] },
        { label: "The food", sliders: ["food", "appetite"] },
        { label: "Mess and sound", sliders: ["messiness", "chewing"] },
      ],
      presets: [
        { label: "Always snacking heist man", plain: "Eating something in almost every scene, casually.", set: { setting: "speak while eating", share: 80, food: "a snack", appetite: "normal", messiness: 1 } },
        { label: "Diner table talk", plain: "A real meal between lines, talk going around it.", set: { setting: "eat then speak", food: "a meal", biteTiming: "between lines", chewing: "soft" } },
        { label: "Mouth-full comedy", plain: "A big bite right before the punchline.", set: { setting: "speak while eating", messiness: 5, biteTiming: "before the punchline", chewing: "loud", appetite: "wolfing it down" } },
      ],
    },
  });

  W.add("gesture", {
    sliders: [
      ["height", "How high", ["by the waist", "chest", "face", "above the head"], "How high the hands rise when they move."],
      ["gestureSpeed", "Speed of the gesture", ["slow", "natural", "sharp"], "How fast the hands move."],
      ["habit", "Same gesture repeats", ["never", "a habit", "a signature move"], "Whether one gesture becomes the character's trademark."],
      ["pointsEye", "Points our eye", ["nowhere", "at the speaker", "at the thing that matters"], "Whether the gesture steers the audience's attention."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "type", icons: { "self-touch": "🤲", pointing: "👉", illustrating: "🙌", "beat on the words": "✊", "big sweep": "🌊" } },
        { face: "balance", slider: "timing", left: "before the word", right: "after the word" },
      ],
      groups: [
        { label: "The gesture", sliders: ["setting", "type", "height", "gestureSpeed"] },
        { label: "Timing", sliders: ["timing", "habit"] },
        { label: "Attention", sliders: ["pointsEye"] },
      ],
      presets: [
        { label: "Italian dinner table", plain: "Big, high, illustrating every sentence.", set: { setting: 5, type: "illustrating", height: "face", gestureSpeed: "natural" } },
        { label: "Detective names the culprit", plain: "One sharp point at the person who did it.", set: { setting: 3, type: "pointing", gestureSpeed: "sharp", pointsEye: "at the thing that matters", timing: 0 } },
        { label: "Nervous self-soothing", plain: "Small touches to the face and arms, again and again.", set: { setting: 1, type: "self-touch", height: "chest", habit: "a habit" } },
      ],
    },
  });

  W.add("stillness", {
    sliders: [
      ["whatMoves", "Only this moves", ["nothing", "the eyes", "the hands", "the breath"], "The one part allowed to move while the rest is still.", { unordered: true }],
      ["stillFeel", "Feels like", ["calm", "waiting", "coiled to strike"], "What the stillness says about what comes next."],
      ["breakWith", "Broken by", ["a tiny shift", "a normal move", "a sudden move"], "How the stillness ends."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "holdTime" },
        { face: "ladder", slider: "stillFeel" },
        { face: "tiles", slider: "whatMoves", icons: { nothing: "🗿", "the eyes": "👀", "the hands": "✋", "the breath": "💨" } },
      ],
      groups: [
        { label: "How still", sliders: ["setting", "holdTime", "whatMoves"] },
        { label: "What it means", sliders: ["stillFeel", "noticeable"] },
        { label: "How it ends", sliders: ["breakWith"] },
      ],
      presets: [
        { label: "Calm menace", plain: "Completely still except the eyes, ready to strike.", set: { setting: 5, holdTime: 8, whatMoves: "the eyes", stillFeel: "coiled to strike", breakWith: "a sudden move" } },
        { label: "Quiet grief", plain: "Still and calm, only the breath moving.", set: { setting: 4, whatMoves: "the breath", stillFeel: "calm", breakWith: "a tiny shift" } },
        { label: "Waiting for news", plain: "Frozen in place, hands the only thing moving.", set: { setting: 3, whatMoves: "the hands", stillFeel: "waiting" } },
      ],
    },
  });

  W.add("blink", {
    sliders: [
      ["holdOff", "Holds a stare", [0, 30, "s"], "How long they go without blinking at all."],
      ["blinkSpeed", "Blink speed", ["slow", "normal", "quick flutter"], "How quickly the eyes close and open."],
      ["onCut", "Blink lands on the cut", ["never", "sometimes", "always"], "Whether the editor cuts where a blink falls, like a thought ending."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "rate" },
        { face: "balance", slider: "setting", left: "yes", right: "no" },
        { face: "ladder", slider: "meaning" },
      ],
      groups: [
        { label: "Blinking", sliders: ["setting", "rate", "blinkSpeed"] },
        { label: "Meaning", sliders: ["meaning", "holdOff"] },
        { label: "With the edit", sliders: ["onCut"] },
      ],
      presets: [
        { label: "Unblinking killer", plain: "A long, cold stare with no blinks at all.", set: { setting: "no", rate: 0, holdOff: 30 } },
        { label: "Cut on the blink", plain: "Blinks mark each new thought, and the cuts follow them.", set: { setting: "yes", rate: 15, meaning: "on every thought", onCut: "always" } },
        { label: "Flustered liar", plain: "Fast, fluttery blinking that gives them away.", set: { setting: "yes", rate: 35, blinkSpeed: "quick flutter", meaning: "sometimes" } },
      ],
    },
  });

  W.add("moveTemper", {
    sliders: [
      ["reactsTo", "Camera reacts to", ["nothing", "big moves", "every move"], "How much of the action the camera answers."],
      ["lag", "Lag behind the action", [0, 24, "frames"], "How late the camera follows a move."],
      ["leads", "Gets there first", ["follows", "keeps pace", "anticipates"], "Whether the camera trails the action or arrives before it."],
      ["shake", "Nervous wobble", [0, 5, ""], "How much the camera shivers with the moment."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "pad", x: "lag", y: "shake", xLabel: "lag", yLabel: "wobble" },
        { face: "ladder", slider: "leads" },
      ],
      groups: [
        { label: "Temper", sliders: ["setting", "reactsTo", "shake"] },
        { label: "Timing", sliders: ["lag", "leads", "change"] },
        { label: "Seen", sliders: ["noticeable"] },
      ],
      presets: [
        { label: "Calm observer", plain: "A cool camera that barely reacts.", set: { setting: 1, reactsTo: "nothing", shake: 0, leads: "follows" } },
        { label: "Documentary catch-up", plain: "Late, shaky, chasing every move.", set: { setting: 4, reactsTo: "every move", lag: 12, shake: 3, leads: "follows" } },
        { label: "Knowing camera", plain: "Gets there before the action, like it knows.", set: { setting: 3, leads: "anticipates", lag: 0, reactsTo: "big moves" } },
      ],
    },
  });

  W.add("spacing", {
    sliders: [
      ["restEnds", "Rest at each end", [0, 12, "frames"], "How long a move pauses at its start and finish."],
      ["weight", "Feels heavy or light", ["feather light", "light", "normal", "heavy", "very heavy"], "How much weight the moves seem to carry."],
      ["varies", "Varies between moves", ["every move the same", "some variety", "each one different"], "Whether each move has its own curve."],
      ["drift", "Changes over the film", ["gets smoother", "holds", "gets snappier"], "Whether moves soften or sharpen as the story goes on."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { even: "➖", "ease in": "↗️", "ease out": "↘️", "ease both": "〰️", snap: "⚡" } },
        { face: "dial", slider: "strength" },
        { face: "ladder", slider: "weight" },
      ],
      groups: [
        { label: "The curve", sliders: ["setting", "strength", "restEnds"] },
        { label: "Feel", sliders: ["weight", "varies", "noticeable"] },
        { label: "Over time", sliders: ["drift"] },
      ],
      presets: [
        { label: "Heavy and grand", plain: "Slow to start, slow to stop, very heavy.", set: { setting: "ease both", strength: 5, weight: "very heavy", restEnds: 8 } },
        { label: "Snappy cartoon", plain: "Quick snaps between poses, light as air.", set: { setting: "snap", weight: "feather light", restEnds: 2 } },
        { label: "Robot to human", plain: "Even moves that soften as the character warms up.", set: { setting: "even", drift: "gets smoother", varies: "some variety" } },
      ],
    },
  });

  W.add("stepping", {
    sliders: [
      ["actionRate", "Fast action drawn on", ["ones", "twos", "threes"], "How many frames each drawing holds when things move fast."],
      ["holdRate", "Quiet moments drawn on", ["ones", "twos", "threes", "fours"], "How many frames each drawing holds when things are calm."],
      ["boil", "Hand-drawn wobble", ["none", "a little", "lively"], "How much the lines shimmer even when nothing moves."],
      ["switchFor", "Switches for big moments", ["never", "sometimes", "always"], "Whether the drawing rate changes to make a moment stand out."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "boil", icons: { none: "▫️", "a little": "〰️", lively: "✏️" } },
      ],
      groups: [
        { label: "Drawing rate", sliders: ["setting", "actionRate", "holdRate"] },
        { label: "Mixing", sliders: ["mix", "switchFor", "noticeable"] },
        { label: "Texture", sliders: ["boil"] },
      ],
      presets: [
        { label: "Spider-Verse look", plain: "Mostly on twos, with ones for the big hits.", set: { setting: "twos", mix: "mixed freely", actionRate: "ones", switchFor: "always" } },
        { label: "Classic feature, silky smooth", plain: "Everything on ones, one steady rate.", set: { setting: "ones", mix: "one rate", actionRate: "ones", holdRate: "ones", boil: "none" } },
        { label: "TV anime", plain: "Threes and long holds to save drawings.", set: { setting: "threes", holdRate: "fours", mix: "mostly one" } },
      ],
    },
  });

  W.add("anticipation", {
    sliders: [
      ["windupWay", "Wind-up goes", ["straight back", "the opposite way", "a big loop"], "Which way the body pulls before it moves.", { unordered: true }],
      ["usedOn", "Wind-up on", ["small moves too", "bigger moves", "only the big one"], "Which moves get a wind-up."],
      ["warns", "Warns the audience", ["surprise", "a hint", "clear warning"], "How much the wind-up tells us what is coming."],
      ["fakeOut", "Fake-out", ["never", "once", "a running gag"], "Whether a wind-up leads to nothing, for a laugh."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "frames" },
        { face: "balance", slider: "warns", left: "surprise", right: "clear warning" },
      ],
      groups: [
        { label: "The wind-up", sliders: ["setting", "frames", "size", "windupWay"] },
        { label: "Where it's used", sliders: ["usedOn"] },
        { label: "Playing the audience", sliders: ["warns", "fakeOut"] },
      ],
      presets: [
        { label: "Looney Tunes zip-off", plain: "A huge, long wind-up, then gone in a flash.", set: { setting: "big", frames: 12, size: 5, warns: "clear warning", usedOn: "small moves too" } },
        { label: "Sudden attack", plain: "No warning at all before the move.", set: { setting: "none", frames: 0, warns: "surprise" } },
        { label: "Fake-out gag", plain: "Big wind-up that leads nowhere, again and again.", set: { setting: "big", fakeOut: "a running gag", warns: "clear warning" } },
      ],
    },
  });

  W.add("overshoot", {
    sliders: [
      ["wobbles", "Wobbles before rest", [0, 5, ""], "How many little bounces before it stops."],
      ["whatOvershoots", "What overshoots", ["the whole body", "the head", "the hands", "props"], "Which part goes past and comes back.", { unordered: true }],
      ["emphasis", "Used on", ["every stop", "key stops", "only the big stop"], "Which stops get the overshoot."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⏹️", settle: "〰️", bounce: "🏀" } },
        { face: "pad", x: "howMuch", y: "settleFrames", xLabel: "how far past", yLabel: "settle time" },
      ],
      groups: [
        { label: "The overshoot", sliders: ["setting", "howMuch", "whatOvershoots"] },
        { label: "Settling", sliders: ["settleFrames", "wobbles", "emphasis"] },
      ],
      presets: [
        { label: "Jelly bounce", plain: "Big bounce with lots of wobble on every stop.", set: { setting: "bounce", howMuch: 5, wobbles: 4, emphasis: "every stop" } },
        { label: "Natural settle", plain: "A small soft settle on the key stops.", set: { setting: "settle", howMuch: 1, settleFrames: 4, emphasis: "key stops" } },
        { label: "Dead stop", plain: "Moves end exactly where they land.", set: { setting: "none", howMuch: 0, wobbles: 0 } },
      ],
    },
  });

  W.add("overlap", {
    sliders: [
      ["followThrough", "Keeps going after the stop", [0, 24, "frames"], "How long loose parts carry on after the body halts."],
      ["floppiness", "Floppy or stiff", ["stiff", "springy", "floppy"], "How loose the trailing parts are."],
      ["wind", "Wind on hair and cloth", ["still air", "breeze", "strong wind"], "Whether air keeps the loose parts moving."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", hair: "💇", cloth: "👗", hands: "✋", all: "🌀" } },
        { face: "mixer", sliders: ["lag", "howMuch", "followThrough"] },
      ],
      groups: [
        { label: "What trails", sliders: ["setting", "floppiness"] },
        { label: "How much and how long", sliders: ["lag", "howMuch", "followThrough"] },
        { label: "Air", sliders: ["wind"] },
      ],
      presets: [
        { label: "Superhero cape", plain: "Cloth that flows long after the landing, in the wind.", set: { setting: "cloth", followThrough: 20, floppiness: "floppy", wind: "strong wind" } },
        { label: "Bouncy ponytail", plain: "Springy hair that swings a beat behind.", set: { setting: "hair", lag: 4, howMuch: 3, floppiness: "springy" } },
        { label: "Rigid puppet", plain: "Nothing trails; everything stops at once.", set: { setting: "none", lag: 0, howMuch: 0, followThrough: 0 } },
      ],
    },
  });

  W.add("arcs", {
    sliders: [
      ["whichPart", "Arcs on", ["the head", "the hands", "the whole body"], "Which part carries the curved path.", { unordered: true }],
      ["arcSize", "Size of the arc", [0, 5, ""], "How wide the curve swings."],
      ["straightFor", "Straight lines kept for", ["nothing", "machines", "sudden shocks"], "What still moves in straight lines on purpose.", { unordered: true }],
      ["trail", "Show a motion trail", ["none", "faint", "bold"], "Whether a streak shows the path the move took."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { straight: "📏", arc: "🌈", "figure eight": "♾️" } },
        { face: "pad", x: "roundness", y: "arcSize", xLabel: "roundness", yLabel: "size" },
      ],
      groups: [
        { label: "The path", sliders: ["setting", "roundness", "arcSize", "whichPart"] },
        { label: "Exceptions", sliders: ["straightFor"] },
        { label: "Showing it", sliders: ["trail", "noticeable"] },
      ],
      presets: [
        { label: "Graceful dancer", plain: "Big, round arcs through the whole body.", set: { setting: "arc", roundness: 5, arcSize: 4, whichPart: "the whole body" } },
        { label: "Robot sidekick", plain: "Straight paths for the machine.", set: { setting: "straight", roundness: 0, straightFor: "machines" } },
        { label: "Anime speed trails", plain: "Bold streaks showing every swing.", set: { setting: "arc", trail: "bold", whichPart: "the hands" } },
      ],
    },
  });

  W.add("leadPart", {
    sliders: [
      ["nextPart", "Then follows", ["eyes", "head", "hips", "hands"], "Which part follows the lead.", { unordered: true }],
      ["chainSpeed", "How fast the rest follows", ["slow wave", "normal", "whip"], "Whether the body follows like a slow wave or a snap."],
      ["pullsAudience", "We look where they look", ["no", "sometimes", "always"], "Whether a leading glance steers the audience's eye first."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { eyes: "👀", head: "🙂", hips: "🕺", hands: "✋" } },
        { face: "dial", slider: "lead" },
      ],
      groups: [
        { label: "Who leads", sliders: ["setting", "lead", "nextPart"] },
        { label: "The follow", sliders: ["chainSpeed", "noticeable"] },
        { label: "Attention", sliders: ["pullsAudience"] },
      ],
      presets: [
        { label: "Thinking character", plain: "Eyes go first, the head follows after a beat.", set: { setting: "eyes", lead: 4, nextPart: "head", pullsAudience: "always" } },
        { label: "Swagger walk", plain: "Hips lead in a slow wave.", set: { setting: "hips", chainSpeed: "slow wave", lead: 3 } },
        { label: "Grab and go", plain: "Hands lead with a whip-fast follow.", set: { setting: "hands", chainSpeed: "whip", lead: 2 } },
      ],
    },
  });

  W.add("squash", {
    sliders: [
      ["onImpact", "When it squashes", ["only on impacts", "on big moves", "all the time"], "Which moments bend the shape."],
      ["recover", "Snap back time", [0, 12, "frames"], "How long the shape takes to return to normal."],
      ["squashFeel", "Feel", ["subtle and real", "bouncy", "rubbery"], "Whether the bending feels lifelike or cartoon."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "parts", icons: { "the whole body": "🧍", "the face": "😮", props: "🏀" } },
        { face: "ladder", slider: "squashFeel" },
      ],
      groups: [
        { label: "How much", sliders: ["setting", "volume", "squashFeel"] },
        { label: "Where and when", sliders: ["parts", "onImpact"] },
        { label: "Recovery", sliders: ["recover"] },
      ],
      presets: [
        { label: "Bouncing ball", plain: "Big squash on impact, stretch in the air.", set: { setting: 4, parts: "props", onImpact: "only on impacts", squashFeel: "bouncy", recover: 3 } },
        { label: "Subtle lifelike", plain: "A touch of give in the face, barely noticed.", set: { setting: 1, parts: "the face", squashFeel: "subtle and real" } },
        { label: "Cartoon rubber", plain: "Everything stretches all the time.", set: { setting: 5, parts: "the whole body", onImpact: "all the time", squashFeel: "rubbery", volume: 2 } },
      ],
    },
  });

  W.add("poseRate", {
    sliders: [
      ["between", "Between poses", ["snaps", "quick move", "smooth glide"], "How the body travels from one pose to the next."],
      ["strongOn", "Strongest pose on", ["the first word", "the key word", "the last word"], "Where in the line the biggest pose lands.", { unordered: true }],
      ["variety", "Pose variety", ["repeats", "some variety", "all different"], "Whether poses repeat or keep changing."],
      ["buildUp", "Over the scene", ["calms down", "steady", "builds up"], "Whether poses get busier or calmer as the scene goes on."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "holdFrames", xLabel: "poses per line", yLabel: "hold on each" },
        { face: "tiles", slider: "between", icons: { snaps: "⚡", "quick move": "➡️", "smooth glide": "〰️" } },
      ],
      groups: [
        { label: "How many", sliders: ["setting", "variety"] },
        { label: "Holding and moving", sliders: ["holdFrames", "between", "noticeable"] },
        { label: "Timing", sliders: ["strongOn", "buildUp"] },
      ],
      presets: [
        { label: "Stage actor", plain: "Few strong poses, held, the big one on the key word.", set: { setting: 2, holdFrames: 18, strongOn: "the key word", between: "smooth glide" } },
        { label: "Hyper cartoon", plain: "Many snappy poses, all different.", set: { setting: 7, holdFrames: 4, between: "snaps", variety: "all different" } },
        { label: "Rising panic", plain: "Poses multiply as the scene builds.", set: { setting: 4, buildUp: "builds up", between: "quick move" } },
      ],
    },
  });

  W.add("lipSync", {
    sliders: [
      ["openness", "How wide the mouth opens", ["barely", "normal", "wide", "cartoon wide"], "How big the mouth shapes are."],
      ["vowelHold", "Holds on long sounds", ["no", "short", "long"], "Whether the mouth stays open on drawn-out sounds."],
      ["teeth", "Shows teeth and tongue", ["never", "sometimes", "detailed"], "How much detail is inside the mouth."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "lead", left: "mouth late", right: "mouth early" },
        { face: "ladder", slider: "openness" },
      ],
      groups: [
        { label: "Shapes", sliders: ["setting", "openness", "teeth"] },
        { label: "Sync", sliders: ["accuracy", "lead", "vowelHold"] },
      ],
      presets: [
        { label: "Flapping cut-out", plain: "Few shapes, mouth just opens and shuts.", set: { setting: 2, accuracy: 1, openness: "normal", teeth: "never" } },
        { label: "Feature-film detail", plain: "Many accurate shapes, slightly early, full detail.", set: { setting: 12, accuracy: 5, lead: 1, teeth: "detailed" } },
        { label: "Singing big", plain: "Wide open, holding the long notes.", set: { setting: 8, openness: "cartoon wide", vowelHold: "long" } },
      ],
    },
  });

  W.add("gazeShift", {
    sliders: [
      ["holdLook", "Holds the look", [0, 5, "s"], "How long the eyes stay where they land."],
      ["givesAway", "Eyes give away", ["nothing", "nerves", "a lie", "a secret"], "What the darting eyes reveal.", { unordered: true }],
      ["leadsUs", "We look where they look", ["no", "sometimes", "always"], "Whether the audience's eye follows the glance."],
      ["returnTo", "Eyes come back to", ["nobody", "the other person", "the camera"], "Where the gaze settles after the dart.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "compass", slider: "target", angles: { away: 270, down: 180, "to another person": 90, "to an object": 45 } },
        { face: "ladder", slider: "leadsUs" },
      ],
      groups: [
        { label: "The darts", sliders: ["setting", "size", "holdLook"] },
        { label: "Where", sliders: ["target", "returnTo"] },
        { label: "What it tells us", sliders: ["givesAway", "leadsUs"] },
      ],
      presets: [
        { label: "Hitchcock glance at the clue", plain: "One look at an object, and we look too.", set: { setting: 1, target: "to an object", holdLook: 2, leadsUs: "always", givesAway: "a secret" } },
        { label: "Shifty liar", plain: "Many small darts down and away.", set: { setting: 6, size: 2, target: "down", givesAway: "a lie" } },
        { label: "Breaking the fourth wall", plain: "A glance back at the camera.", set: { setting: 2, returnTo: "the camera", leadsUs: "sometimes" } },
      ],
    },
  });

  W.add("posture", {
    sliders: [
      ["stature", "Stands tall or shrinks", ["shrunk", "slumped", "upright", "towering"], "How much space the body claims upward."],
      ["facing", "Facing the other", ["turned away", "angled", "square on"], "How directly they face the person they talk to."],
      ["shiftOnLine", "Shifts on the key line", ["no", "a little", "a big change"], "Whether the posture changes when the important line lands."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "lean", left: "leans back", right: "leans in" },
        { face: "tiles", slider: "setting", icons: { closed: "🙅", neutral: "🧍", open: "🙆" } },
        { face: "ladder", slider: "stature" },
      ],
      groups: [
        { label: "Shape", sliders: ["setting", "stature", "lean"] },
        { label: "Toward the other", sliders: ["facing", "tension"] },
        { label: "Over time", sliders: ["shiftOnLine", "change"] },
      ],
      presets: [
        { label: "Defeated hero", plain: "Closed, slumped, turned away.", set: { setting: "closed", stature: "slumped", facing: "turned away", lean: -2 } },
        { label: "Boss in charge", plain: "Open, towering and square on, leaning in.", set: { setting: "open", stature: "towering", facing: "square on", lean: 3, tension: 2 } },
        { label: "The turn", plain: "Posture transforms on the key line.", set: { shiftOnLine: "a big change", change: "snaps" } },
      ],
    },
  });

  W.add("sceneShapes", {
    sliders: [
      ["shapeKind", "Mostly", ["round", "square", "sharp triangles"], "The kind of shape: round feels friendly, square steady, sharp dangerous.", { unordered: true }],
      ["arrangement", "How the shapes sit", ["balanced", "off to one side", "stacked", "scattered"], "How the big shapes are placed in the frame.", { unordered: true }],
      ["crowding", "Space around the person", ["lots of air", "some", "boxed in"], "How much the shapes close in on the character."],
      ["leadEye", "Shapes lead the eye to", ["nowhere", "the speaker", "the key object"], "Where the lines of the shapes point the audience.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "shapeKind", icons: { round: "⚪", square: "⬛", "sharp triangles": "🔺" } },
        { face: "ladder", slider: "setting" },
        { face: "ladder", slider: "crowding" },
      ],
      groups: [
        { label: "The shapes", sliders: ["setting", "size", "shapeKind"] },
        { label: "Placement", sliders: ["arrangement", "crowding"] },
        { label: "Attention and time", sliders: ["leadEye", "change"] },
      ],
      presets: [
        { label: "Friendly cartoon world", plain: "A few round shapes, balanced, lots of air.", set: { setting: "a few shapes", shapeKind: "round", arrangement: "balanced", crowding: "lots of air" } },
        { label: "Trapped in the villain's lair", plain: "Busy sharp shapes boxing the hero in.", set: { setting: "busy", shapeKind: "sharp triangles", crowding: "boxed in", arrangement: "scattered" } },
        { label: "Spotlight on the clue", plain: "One big shape whose lines point at the key object.", set: { setting: "one big shape", leadEye: "the key object", size: 4 } },
      ],
    },
  });

  W.add("propBusiness", {
    sliders: [
      ["prop", "The business", ["cooking", "cleaning", "fixing something", "eating or drinking", "fiddling"], "What the hands are busy with.", { unordered: true }],
      ["handPace", "Hands move", ["slowly", "steadily", "frantically"], "How fast the hands work, often showing the feeling inside."],
      ["stopsFor", "Stops for the big line", ["never", "once", "every key line"], "Whether the hands freeze when something important is said."],
      ["eyeOn", "Where the eye goes", ["on the face", "shared", "on the hands"], "Whether the audience watches the face or the busy hands."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "prop", icons: { cooking: "🍳", cleaning: "🧽", "fixing something": "🔧", "eating or drinking": "☕", fiddling: "🪙" } },
        { face: "balance", slider: "fits", left: "fights the line", right: "fits the line" },
        { face: "ladder", slider: "goesWrong" },
      ],
      groups: [
        { label: "The business", sliders: ["prop", "handPace", "fits"] },
        { label: "Things go wrong", sliders: ["goesWrong"] },
        { label: "Attention and timing", sliders: ["eyeOn", "stopsFor", "noticeable", "change"] },
      ],
      presets: [
        { label: "Angry dishwashing", plain: "Scrubbing harder and harder while saying it's fine.", set: { prop: "cleaning", handPace: "frantically", fits: "fights it", eyeOn: "shared" } },
        { label: "Kitchen disaster comedy", plain: "Cooking goes badly wrong during the talk.", set: { prop: "cooking", goesWrong: "a disaster", eyeOn: "on the hands" } },
        { label: "The hands stop", plain: "Fixing something steadily until the big line freezes them.", set: { prop: "fixing something", handPace: "steadily", stopsFor: "once" } },
      ],
    },
  });

  W.add("moveOnLine", {
    sliders: [
      ["kind", "The move", ["a turn", "a step", "sitting or standing", "a lean"], "What the body does on the line.", { unordered: true }],
      ["moveDir", "Toward or away", ["away", "sideways", "toward them"], "Whether the move closes or opens the gap."],
      ["sharpness", "How sharp", ["melting", "smooth", "sharp"], "How sudden the move is."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "timing", icons: { "before the line": "⏮️", "on the key word": "🎯", "after the line": "⏭️", "between lines": "⏸️" } },
        { face: "dial", slider: "size" },
        { face: "balance", slider: "moveDir", left: "away", right: "toward" },
      ],
      groups: [
        { label: "When", sliders: ["timing", "freeze"] },
        { label: "The move", sliders: ["kind", "size", "moveDir", "sharpness"] },
      ],
      presets: [
        { label: "Turn away on the last word", plain: "They turn their back after the line and hold.", set: { timing: "after the line", kind: "a turn", moveDir: "away", freeze: "a long hold" } },
        { label: "Step in on the threat", plain: "A sharp step toward them on the key word.", set: { timing: "on the key word", kind: "a step", moveDir: "toward them", sharpness: "sharp", size: 4 } },
        { label: "Sinking into the chair", plain: "A slow sit before the bad news.", set: { timing: "before the line", kind: "sitting or standing", sharpness: "melting" } },
      ],
    },
  });

  /* Movement rules (rigRulesLens, the 3D character's rules). It arrives with the 3D characters work; until then
     W.add skips it. */
  W.add("rigRulesLens", {
    sliders: [
      ["walkSpeed", "Walking speed", [0, 6, "m/s", 0.1], "How many meters the body covers each second when it walks or runs. About 1.4 is an ordinary walk, 5 a sprint.", { from: 1, to: 2 }],
      ["headTurn", "How far the head may turn", [0, 90, "°", 5], "The most the head turns left or right to look at something before the body has to turn too.", { from: 45, to: 80 }],
      ["lag", "How long loose parts lag", [0, 1, "s", 0.05], "Seconds an arm, head or tail keeps moving after the body stops.", { from: 0.1, to: 0.4 }],
      ["breathRate", "Breaths a minute", [4, 60, "", 1], "Calm is about 12; after a run it is 40 or more.", { from: 10, to: 20 }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "standing still": "🧍", "looking around": "👀", walking: "🚶", running: "🏃" } },
        { face: "ladder", slider: "slump" },
        { face: "mixer", sliders: ["pace", "floppy", "breath", "limits"] },
      ],
      groups: [
        { label: "The move", sliders: ["setting", "pace", "walkSpeed"] },
        { label: "The body", sliders: ["slump", "breath", "breathRate", "limits"] },
        { label: "Where it looks", sliders: ["lookAt", "headTurn"] },
        { label: "Loose parts", sliders: ["floppy", "lag"] },
      ],
      presets: [
        { label: "Tired trudge", plain: "A slow, slumped walk, eyes on the ground.", set: { setting: "walking", pace: "dragging", slump: "slumped", lookAt: "at the ground", breath: "heavy", walkSpeed: 0.8 } },
        { label: "Late and running", plain: "A frantic run, breathing hard, arms loose.", set: { setting: "running", pace: "frantic", floppy: "loose", breath: "heaving", walkSpeed: 5 } },
        { label: "Proud entrance", plain: "Upright and brisk, looking straight at us.", set: { setting: "walking", pace: "brisk", slump: "proud and upright", lookAt: "at the camera" } },
        { label: "Nervous lookout", plain: "Still, holding breath, the head checking everywhere.", set: { setting: "looking around", breath: "held", lookAt: "all around", headTurn: 85 } },
        { label: "Cartoon rubber", plain: "Joints bend any way and everything flops.", set: { limits: "like rubber", floppy: "floppy", lag: 0.6 } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
