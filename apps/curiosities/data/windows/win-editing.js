/* Editing: a window for every curiosity whose home is Editing on the Screen. */
(function (W) {
  const U = { unordered: true };

  W.add("tensionCurve", {
    sliders: [
      ["audienceGrip", "How tightly it holds us", ["loose", "steady", "gripping", "breathless"], "How hard the tension keeps the audience leaning forward."],
      ["peakSpacing", "Time between peaks", [1, 20, "min"], "How many minutes pass from one tense high point to the next."],
      ["releaseKind", "How it lets go", ["slow exhale", "a laugh", "a shock", "a cut away"], "What breaks the tension when it finally breaks.", U],
      ["releaseLength", "How long the calm lasts", [0, 120, "s"], "How long the audience gets to breathe before it tightens again."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "curve", slider: "setting", points: 5 },
        { face: "ladder", slider: "audienceGrip" },
        { face: "tiles", slider: "shape", icons: { flat: "➖", rising: "📈", falling: "📉", "peaks and valleys": "〰️" } },
      ],
      groups: [
        { label: "How tense", sliders: ["setting", "audienceGrip"] },
        { label: "Its shape over time", sliders: ["shape", "peakSpacing", "change"] },
        { label: "Letting go", sliders: ["releaseKind", "releaseLength"] },
      ],
      presets: [
        { label: "Hitchcock slow burn", plain: "Tension creeps up and is only released by a shock.", set: { setting: 4, shape: "rising", change: "drifts", releaseKind: "a shock", releaseLength: 5 } },
        { label: "Thriller rollercoaster", plain: "Peak after peak, with short breaths in between.", set: { shape: "peaks and valleys", peakSpacing: 4, releaseLength: 20, audienceGrip: "gripping" } },
        { label: "Gentle family drama", plain: "Low, even unease that eases with a laugh.", set: { setting: 1, shape: "flat", releaseKind: "a laugh", audienceGrip: "loose" } },
      ],
    },
  });

  W.add("reveal", {
    sliders: [
      ["clueCount", "Clues planted beforehand", [0, 10, ""], "How many hints the audience could have spotted before the reveal."],
      ["revealSpeed", "How the truth comes out", ["all at once", "in two steps", "in pieces", "slow dawning"], "Whether the fact lands in one blow or sinks in gradually."],
      ["holdBack", "How long it's held back", [0, 60, "min"], "Minutes between the first hint and the full reveal."],
      ["reactionFocus", "Whose face we watch", ["the one who learns", "the one who knew", "a bystander", "nobody"], "Whose reaction the edit shows when the truth lands.", U],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "Audience knows first", right: "Characters know first" },
        { face: "pad", x: "setup", y: "size", xLabel: "Setup", yLabel: "Size of the reveal" },
      ],
      groups: [
        { label: "Who knows when", sliders: ["setting", "holdBack"] },
        { label: "Building to it", sliders: ["setup", "clueCount"] },
        { label: "The moment itself", sliders: ["size", "revealSpeed", "reactionFocus"] },
      ],
      presets: [
        { label: "Hitchcock bomb under the table", plain: "Show the audience the danger early and make them wait.", set: { setting: "before", setup: 5, holdBack: 20, reactionFocus: "the one who learns" } },
        { label: "Sixth Sense twist", plain: "A big late surprise that clues quietly prepared.", set: { setting: "after", size: 5, clueCount: 8, revealSpeed: "all at once" } },
        { label: "Mystery drip-feed", plain: "We learn alongside the detective, piece by piece.", set: { setting: "with", revealSpeed: "in pieces", clueCount: 5, size: 3 } },
      ],
    },
  });

  W.add("mains", {
    sliders: [
      ["focusPull", "Pull toward one lead", ["even", "leaning", "favoring one", "all about one"], "How strongly the hour steers our attention to one main person."],
      ["crossPaths", "How often they meet", ["never", "once", "a few times", "constantly"], "How often the featured people share a scene."],
      ["handoffSpeed", "How fast focus passes on", ["slow", "steady", "quick", "rapid"], "How quickly the story moves its attention from one main to another."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "focusPull", left: "Shared evenly", right: "One star" },
        { face: "ladder", slider: "crossPaths" },
      ],
      groups: [
        { label: "Who we follow", sliders: ["setting", "share", "focusPull"] },
        { label: "How they share the hour", sliders: ["crossPaths", "handoffSpeed", "change"] },
      ],
      presets: [
        { label: "Two-hander", plain: "Two people, always in each other's way.", set: { setting: 2, crossPaths: "constantly", focusPull: "even", share: 50 } },
        { label: "Hospital ensemble (ER)", plain: "Four mains, one of them a little more central.", set: { setting: 4, focusPull: "leaning", handoffSpeed: "quick", crossPaths: "a few times" } },
        { label: "A star and a sidekick", plain: "One clear lead with a partner along for the ride.", set: { setting: 2, focusPull: "favoring one", share: 70 } },
      ],
    },
  });

  W.add("exit", {
    sliders: [
      ["exitTiming", "When in the hour", ["opening", "middle", "last minutes"], "Where in the hour the person leaves the story."],
      ["surprise", "How surprising", ["expected", "hinted", "sudden", "shocking"], "How much the exit catches the audience off guard."],
      ["goodbyeScene", "A proper goodbye", ["none", "a glance", "a short scene", "a full farewell"], "How much screen time the parting gets."],
      ["afterglow", "How long they're missed", [0, 10, "scenes"], "How many scenes afterwards still feel their absence."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { stay: "🏠", leave: "🚪", die: "🕯️" } },
        { face: "mixer", sliders: ["warning", "weight", "afterglow"] },
      ],
      groups: [
        { label: "The exit", sliders: ["setting", "exitTiming", "surprise"] },
        { label: "Before and after", sliders: ["warning", "goodbyeScene", "weight", "afterglow"] },
      ],
      presets: [
        { label: "Game of Thrones shock death", plain: "No warning, mid-hour, and it hurts for a long time.", set: { setting: "die", warning: 0, surprise: "shocking", exitTiming: "middle", afterglow: 8 } },
        { label: "Quiet walk out the door", plain: "They simply leave, with only a look to mark it.", set: { setting: "leave", goodbyeScene: "a glance", surprise: "hinted", weight: 2 } },
        { label: "Season-finale farewell", plain: "A long goodbye in the final minutes.", set: { setting: "leave", goodbyeScene: "a full farewell", exitTiming: "last minutes", weight: 5, warning: 4 } },
      ],
    },
  });

  W.add("intercut", {
    sliders: [
      ["dwell", "Time with each storyline", [5, 180, "s"], "How long we stay with one storyline before cutting to the other."],
      ["converge", "Storylines come together", ["stay apart", "echo each other", "near miss", "meet"], "How close the separate storylines get by the end."],
      ["cutOnMatch", "Cut on matching moments", ["anywhere", "similar shapes", "matching words", "matching action"], "Whether the switch happens on a moment that rhymes across both stories."],
      ["climaxSync", "Builds to one moment", ["no", "loosely", "exactly"], "Whether all storylines hit their peak at the same instant."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "pad", x: "dwell", y: "speedUp", xLabel: "Time with each", yLabel: "Speeds up" },
        { face: "ladder", slider: "converge" },
      ],
      groups: [
        { label: "How often we switch", sliders: ["setting", "dwell", "rhythm"] },
        { label: "Building speed", sliders: ["speedUp", "climaxSync"] },
        { label: "How the stories touch", sliders: ["converge", "cutOnMatch"] },
      ],
      presets: [
        { label: "Godfather baptism", plain: "Prayer and killings cut together, tighter and tighter.", set: { setting: 6, speedUp: 4, cutOnMatch: "matching action", climaxSync: "exactly", dwell: 15 } },
        { label: "Last-minute rescue", plain: "The chase and the victim, faster until they meet.", set: { setting: 8, speedUp: 5, dwell: 8, converge: "meet" } },
        { label: "Parallel lives (Babel)", plain: "Distant stories that echo each other slowly.", set: { setting: 3, dwell: 150, converge: "echo each other", speedUp: 0 } },
      ],
    },
  });

  W.add("povSwitch", {
    sliders: [
      ["povDepth", "How deep inside them", ["from outside", "over the shoulder", "through their eyes", "their thoughts"], "How close we get to the person whose scene it is."],
      ["handoff", "How it passes on", ["hard cut", "a shared object", "a look", "a sound"], "What carries the story from one person's view to the next.", U],
      ["returnTo", "Back to the main person", ["never", "now and then", "every few scenes", "always"], "How often the story comes home to its central character."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "one person throughout": "👤", "switches sometimes": "👥", "switches every scene": "🔄" } },
        { face: "ladder", slider: "povDepth" },
        { face: "dial", slider: "characters" },
      ],
      groups: [
        { label: "Whose story", sliders: ["setting", "characters", "returnTo"] },
        { label: "How close and how it moves", sliders: ["povDepth", "handoff", "noticeable"] },
      ],
      presets: [
        { label: "Rashomon", plain: "The same event told by one witness after another.", set: { setting: "switches every scene", characters: 4, povDepth: "through their eyes", returnTo: "never" } },
        { label: "Single hero (Bourne)", plain: "Glued to one person the whole way.", set: { setting: "one person throughout", characters: 1, povDepth: "over the shoulder" } },
        { label: "Pulp Fiction chapters", plain: "Blocks for each person, joined by hard cuts.", set: { setting: "switches sometimes", characters: 3, handoff: "hard cut", returnTo: "now and then" } },
      ],
    },
  });

  W.add("sceneEnding", {
    sliders: [
      ["holdAfter", "Hold after the last line", [0, 10, "s"], "How many seconds the picture stays after the final beat."],
      ["pullForward", "Pull into the next scene", ["none", "a little", "strong", "can't look away"], "How much the ending makes the audience need what comes next."],
      ["soundOut", "How the sound ends", ["cuts dead", "rings on", "fades", "carries over"], "What the sound does as the scene closes.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "button joke": "😄", cliffhanger: "🧗", "quiet fade": "🌙", "open question": "❓", "cut on action": "🏃", "smash cut": "💥", callback: "🔁" } },
        { face: "ladder", slider: "pullForward" },
        { face: "dial", slider: "holdAfter" },
      ],
      groups: [
        { label: "The last beat", sliders: ["setting", "pullForward"] },
        { label: "Getting out", sliders: ["late", "holdAfter", "soundOut"] },
      ],
      presets: [
        { label: "Sitcom button", plain: "One last joke and straight out.", set: { setting: "button joke", late: "right after the point", holdAfter: 1, soundOut: "cuts dead" } },
        { label: "Breaking Bad cliffhanger", plain: "Cut to black at the worst possible moment.", set: { setting: "cliffhanger", pullForward: "can't look away", soundOut: "cuts dead", holdAfter: 0 } },
        { label: "Ozu quiet fade", plain: "Let the empty room sit before moving on.", set: { setting: "quiet fade", late: "lingers", holdAfter: 8, soundOut: "fades", pullForward: "a little" } },
      ],
    },
  });

  W.add("openingGrab", {
    sliders: [
      ["grabHold", "How hard it grabs", ["gentle", "firm", "hard", "unmissable"], "How forcefully the opening seizes the audience's attention."],
      ["stakesShown", "What's at stake shown", ["nothing", "a hint", "clear", "everything"], "How much the opening tells us about what could be lost."],
      ["mystery", "Left unexplained", ["all explained", "a little", "a lot", "a total puzzle"], "How many questions the opening leaves hanging to keep us watching."],
      ["firstSound", "First thing heard", ["silence", "a voice", "music", "a big sound"], "The very first sound of the film.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⬜", "mid-action": "🏃", "a question": "❓", "a shock": "⚡", "a joke": "😄", "a promise": "🤝" } },
        { face: "dial", slider: "seconds" },
        { face: "ladder", slider: "grabHold" },
      ],
      groups: [
        { label: "The grab", sliders: ["setting", "seconds", "grabHold"] },
        { label: "What it tells us", sliders: ["stakesShown", "mystery", "firstSound"] },
      ],
      presets: [
        { label: "Bond cold open", plain: "Drop us into a chase before a word is said.", set: { setting: "mid-action", seconds: 2, grabHold: "hard", firstSound: "a big sound", stakesShown: "clear" } },
        { label: "Social video hook", plain: "A question in the first second, before anyone scrolls.", set: { setting: "a question", seconds: 1, grabHold: "unmissable", firstSound: "a voice" } },
        { label: "Slow art-house start", plain: "Let the audience settle in silence.", set: { setting: "none", seconds: 10, grabHold: "gentle", firstSound: "silence", mystery: "a lot" } },
      ],
    },
  });

  W.add("groups", {
    sliders: [
      ["groupBalance", "Time given to the first group", [0, 100, "%"], "How the hour's screen time splits between the two groups."],
      ["friction", "Friction between groups", ["friendly", "wary", "rivals", "at war"], "How much the groups rub against each other."],
      ["mergePoint", "When they come together", ["never", "midway", "near the end", "only at the end"], "Where in the hour the groups finally share the screen."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { 1: "👪", 2: "👪👪" } },
        { face: "balance", slider: "groupBalance", left: "Second group", right: "First group" },
        { face: "ladder", slider: "friction" },
      ],
      groups: [
        { label: "The companies", sliders: ["setting", "groupBalance"] },
        { label: "How they meet", sliders: ["crossings", "friction", "mergePoint", "noticeable"] },
      ],
      presets: [
        { label: "One family (Parenthood)", plain: "One company of people, all in it together.", set: { setting: "1", friction: "friendly" } },
        { label: "Upstairs, Downstairs", plain: "Two worlds in one house, crossing now and then.", set: { setting: "2", crossings: 3, groupBalance: 50, friction: "wary", mergePoint: "midway" } },
        { label: "Rival gangs (West Side Story)", plain: "Two sides headed for a clash.", set: { setting: "2", friction: "at war", mergePoint: "near the end", crossings: 2 } },
      ],
    },
  });

  W.add("featureRate", {
    sliders: [
      ["restLength", "Longest time away", [0, 10, "hours"], "The most hours in a row a main can sit out."],
      ["spotlightHour", "Hours built around them", ["none", "one", "several"], "How many hours put this main at the center."],
      ["returnFanfare", "How a return is marked", ["quietly", "noticed", "celebrated"], "How much the story makes of a main coming back."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "pad", x: "spread", y: "restLength", xLabel: "Spread", yLabel: "Longest time away" },
        { face: "tiles", slider: "spotlightHour", icons: { none: "▫️", one: "🔦", several: "🎇" } },
      ],
      groups: [
        { label: "How often", sliders: ["setting", "spread", "restLength", "noticeable"] },
        { label: "Their moments", sliders: ["spotlightHour", "returnFanfare"] },
      ],
      presets: [
        { label: "Every-week regular", plain: "In nearly every hour, never away for long.", set: { setting: 10, spread: 0, restLength: 0 } },
        { label: "Rotating spotlight (Lost)", plain: "Everyone gets their own hours in turn.", set: { setting: 6, spotlightHour: "several", spread: 3 } },
        { label: "Guest star arc", plain: "Here for a few hours, celebrated on return.", set: { setting: 2, restLength: 6, returnFanfare: "celebrated" } },
      ],
    },
  });

  W.add("sceneRate", {
    sliders: [
      ["pacingPull", "How hard the pace drives", ["relaxed", "steady", "pushing", "relentless"], "How much the speed of scene changes pushes the audience forward."],
      ["burstLength", "Length of a fast run", [1, 20, "scenes"], "How many quick scenes come in a row before things slow."],
      ["breather", "Long scene after a rush", ["never", "sometimes", "always"], "Whether a fast run is followed by one long, calm scene."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "perHour" },
        { face: "balance", slider: "trend", left: "Slowing", right: "Speeding up" },
        { face: "ladder", slider: "pacingPull" },
      ],
      groups: [
        { label: "How often scenes change", sliders: ["setting", "perHour", "pacingPull"] },
        { label: "Over time", sliders: ["trend", "burstLength", "breather"] },
      ],
      presets: [
        { label: "Mad Max relentless", plain: "Scene after scene with no time to breathe.", set: { setting: "fast", perHour: 70, pacingPull: "relentless", breather: "never" } },
        { label: "Slow cinema (Tarkovsky)", plain: "Few, long scenes that take their time.", set: { setting: "slow", perHour: 8, pacingPull: "relaxed", trend: "steady" } },
        { label: "Heist acceleration", plain: "Calm planning, then faster and faster.", set: { setting: "medium", trend: "speeding up", burstLength: 10, breather: "sometimes" } },
      ],
    },
  });

  W.add("sceneEntry", {
    sliders: [
      ["orientTime", "Seconds before we know where", [0, 30, "s"], "How long the audience is kept guessing where and when we are."],
      ["firstImage", "First image", ["a wide view", "a face", "a detail", "darkness"], "What the scene opens on.", U],
      ["startPull", "How fast it pulls us in", ["eases in", "steady", "quick", "instant"], "How quickly the opening of a scene captures attention."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "in action": "🏃", "on a line": "💬", establishing: "🏙️", "sound first": "🔊" } },
        { face: "pad", x: "lateness", y: "orientTime", xLabel: "Enter late", yLabel: "Time to get our bearings" },
        { face: "ladder", slider: "startPull" },
      ],
      groups: [
        { label: "The first moment", sliders: ["setting", "firstImage", "startPull"] },
        { label: "Arriving late", sliders: ["lateness", "orientTime", "change"] },
      ],
      presets: [
        { label: "Enter late, leave early", plain: "Start the scene as late as it can possibly start.", set: { setting: "in action", lateness: 5, startPull: "instant", orientTime: 3 } },
        { label: "Western establishing shot", plain: "Show the land first, then the people.", set: { setting: "establishing", firstImage: "a wide view", startPull: "eases in", lateness: 0 } },
        { label: "Sound leads us in", plain: "Hear the next place before we see it.", set: { setting: "sound first", firstImage: "darkness", orientTime: 6 } },
      ],
    },
  });

  W.add("hook", {
    sliders: [
      ["firstShown", "First seen", ["opening", "early", "middle", "late"], "When the signature image or line first appears."],
      ["lastShown", "Last return", ["middle", "near the end", "final shot"], "When it comes back for the final time."],
      ["payoff", "Meaning grows each time", ["same each time", "grows a little", "transforms"], "Whether its meaning deepens as it returns."],
      ["spotlight", "How much it's spotlighted", ["in passing", "noticed", "held on", "center stage"], "How strongly the edit points our eyes at it."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { no: "▫️", yes: "⭐" } },
        { face: "dial", slider: "count" },
        { face: "ladder", slider: "payoff" },
      ],
      groups: [
        { label: "The image", sliders: ["setting", "spotlight"] },
        { label: "Its returns", sliders: ["count", "firstShown", "lastShown"] },
        { label: "How it grows", sliders: ["variation", "payoff"] },
      ],
      presets: [
        { label: "Rosebud", plain: "Seen at the start, explained only in the last shot.", set: { setting: "yes", count: 3, firstShown: "opening", lastShown: "final shot", payoff: "transforms" } },
        { label: "The spinning top", plain: "A small object held on at the very end.", set: { setting: "yes", count: 4, spotlight: "held on", lastShown: "final shot" } },
        { label: "Running visual gag", plain: "Comes back often, a little different each time.", set: { setting: "yes", count: 8, variation: 3, spotlight: "noticed", payoff: "grows a little" } },
      ],
    },
  });

  W.add("energyArc", {
    sliders: [
      ["peakPlace", "Where the peak sits", [0, 100, "%"], "How far through the work the highest energy comes."],
      ["dropDepth", "How low the dips go", [0, 5, ""], "How far the energy falls between the high points."],
      ["plateauLength", "Longest steady stretch", [0, 20, "min"], "How long the energy can stay level before it moves."],
      ["carryOver", "Energy across cuts", ["resets", "partly kept", "fully kept"], "Whether the next scene picks up the energy where the last one left it."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "curve", slider: "setting", points: 5 },
        { face: "pad", x: "peakPlace", y: "dropDepth", xLabel: "Where the peak sits", yLabel: "How low the dips go" },
        { face: "tiles", slider: "shape", icons: { flat: "➖", rising: "📈", falling: "📉", "peaks and valleys": "〰️" } },
      ],
      groups: [
        { label: "How much energy", sliders: ["setting", "carryOver"] },
        { label: "Its shape", sliders: ["shape", "peakPlace", "dropDepth", "plateauLength", "change"] },
      ],
      presets: [
        { label: "Blockbuster third-act climb", plain: "Steady build to a huge finish near the end.", set: { shape: "rising", peakPlace: 90, dropDepth: 1, carryOver: "fully kept" } },
        { label: "Music-video peaks", plain: "Big highs and deep drops, over and over.", set: { shape: "peaks and valleys", dropDepth: 4, plateauLength: 1, setting: 4 } },
        { label: "Slow-burn indie", plain: "Low, level energy that barely moves.", set: { setting: 1, shape: "flat", plateauLength: 15, carryOver: "partly kept" } },
      ],
    },
  });

  W.add("psychOut", {
    sliders: [
      ["snapBack", "How it snaps back", ["gentle", "quick", "jolting"], "How hard the return to reality hits."],
      ["tipOff", "Clues it's fake", ["none", "one", "several", "obvious"], "How many hints tell the audience it isn't real."],
      ["frequency", "How often it's used", [0, 10, "per film"], "How many fake-outs the film plays in total."],
      ["payoffTone", "Feeling of the snap-back", ["relief", "a laugh", "dread"], "What the audience feels when the fake is revealed.", U],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "Fake that snaps back", right: "Real shift that stays" },
        { face: "pad", x: "length", y: "convincing", xLabel: "Length of the fake", yLabel: "How convincing" },
        { face: "tiles", slider: "payoffTone", icons: { relief: "😮‍💨", "a laugh": "😂", dread: "😱" } },
      ],
      groups: [
        { label: "Fake or real", sliders: ["setting", "frequency"] },
        { label: "Selling the fake", sliders: ["length", "convincing", "tipOff"] },
        { label: "The snap-back", sliders: ["snapBack", "payoffTone"] },
      ],
      presets: [
        { label: "Scrubs daydream", plain: "A silly fantasy that pops back for the laugh.", set: { setting: "psych-out", length: 3, payoffTone: "a laugh", snapBack: "quick", tipOff: "obvious" } },
        { label: "Dream jump scare (Carrie)", plain: "Calm, then the dream turns and wakes you hard.", set: { setting: "psych-out", length: 6, convincing: 5, payoffTone: "dread", snapBack: "jolting", tipOff: "none" } },
        { label: "Real turn that stays", plain: "It looks like a fake-out, but it holds.", set: { setting: "real", convincing: 5 } },
      ],
    },
  });

  W.add("shotOrderLens", {
    sliders: [
      ["accelerate", "Cuts speed up to the end", ["no", "slightly", "strongly"], "Whether shots get shorter as the scene builds."],
      ["eyeTrace", "Keep where the eye looks", ["ignore", "loosely", "carefully"], "Whether each new shot puts the important thing where the eye already was."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "rate" },
        { face: "balance", slider: "leads", left: "Picture leads", right: "Sound leads" },
        { face: "tiles", slider: "joins", icons: { "hard cuts": "✂️", "cut on action": "🏃", "match cuts": "🔗", overlapping: "🌫️" } },
      ],
      groups: [
        { label: "How long and how often", sliders: ["length", "rate", "accelerate"] },
        { label: "How shots join", sliders: ["joins", "leads", "eyeTrace"] },
        { label: "Angles", sliders: ["coverage"] },
      ],
      presets: [
        { label: "Edgar Wright rapid montage", plain: "Tiny shots snapped together on matching shapes.", set: { length: "short", rate: "fast", joins: "match cuts", accelerate: "strongly" } },
        { label: "Long take (Children of Men)", plain: "One unbroken shot that never cuts.", set: { length: "long", rate: "slow", coverage: "one shot", joins: "overlapping" } },
        { label: "Classic dialogue coverage", plain: "Many angles, sound leading into each cut.", set: { length: "medium", joins: "cut on action", coverage: "many angles", leads: "sound leads", eyeTrace: "carefully" } },
      ],
    },
  });

  W.add("phraseScheme", {
    sliders: [
      ["runPace", "Speed within a run", ["slowing", "even", "quickening"], "Whether the shots inside a run get longer or shorter."],
      ["breakAt", "Where the pattern breaks", ["start", "middle", "end"], "Which part of a run is allowed to break the pattern, like the punchline at the end."],
      ["pausesBetween", "Pause between runs", [0, 4, "s"], "A breath of stillness after each run of shots."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "break", icons: { never: "🧱", once: "⚡", often: "🎲" } },
        { face: "dial", slider: "pausesBetween" },
      ],
      groups: [
        { label: "The pattern", sliders: ["setting", "runPace", "pausesBetween"] },
        { label: "Breaking it", sliders: ["break", "breakAt", "noticeable"] },
      ],
      presets: [
        { label: "Rule of three gag", plain: "Two alike, and the third breaks for the laugh.", set: { setting: "threes", break: "once", breakAt: "end" } },
        { label: "Music-video fours", plain: "Even runs of four that ride the beat.", set: { setting: "fours", break: "never", runPace: "even", pausesBetween: 0 } },
        { label: "Restless pattern", plain: "Runs that keep tripping over themselves.", set: { setting: "pairs", break: "often", runPace: "quickening" } },
      ],
    },
  });

  W.add("transition", {
    sliders: [
      ["carries", "What carries across", ["nothing", "a shape", "a sound", "a movement", "a word"], "What links the last shot of one scene to the first of the next.", U],
      ["leap", "How far it jumps", ["same place", "next room", "new place", "years later"], "How much place or time is skipped at the boundary."],
      ["jolt", "How much it jolts", ["smooth", "felt", "jarring", "shocking"], "How strongly the change wakes the audience up."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { cut: "✂️", "match cut": "🔗", "smash cut": "💥", dissolve: "🌫️", "sound bridge": "🔊" } },
        { face: "dial", slider: "length" },
        { face: "ladder", slider: "jolt" },
      ],
      groups: [
        { label: "The crossing", sliders: ["setting", "length", "carries"] },
        { label: "How it feels", sliders: ["leap", "jolt", "noticeable"] },
      ],
      presets: [
        { label: "Lawrence of Arabia match cut", plain: "A blown-out match becomes the desert sunrise.", set: { setting: "match cut", carries: "a shape", leap: "new place", jolt: "felt" } },
        { label: "Smash cut to silence", plain: "Loud chaos cut hard to a quiet room.", set: { setting: "smash cut", length: 0, jolt: "shocking", carries: "nothing" } },
        { label: "Slow memory dissolve", plain: "One time melts into another.", set: { setting: "dissolve", length: 3, leap: "years later", jolt: "smooth" } },
      ],
    },
  });

  W.add("callResponse", {
    sliders: [
      ["answerKind", "How it answers", ["echoes", "agrees", "contradicts", "mocks"], "What the answering shot does to the shot before it.", U],
      ["answerer", "Who answers", ["the same person", "another person", "the place", "an object"], "What in the next shot replies.", U],
      ["tempo", "Back-and-forth speed", ["slow", "steady", "quick", "rapid-fire"], "How fast the calls and answers trade."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "answerKind", icons: { echoes: "🔁", agrees: "👍", contradicts: "🙅", mocks: "😜" } },
        { face: "pad", x: "delay", y: "strength", xLabel: "Delay", yLabel: "How clearly" },
        { face: "ladder", slider: "tempo" },
      ],
      groups: [
        { label: "How often", sliders: ["setting", "tempo"] },
        { label: "The answer", sliders: ["answerKind", "answerer", "delay", "strength"] },
      ],
      presets: [
        { label: "Leone stare-down", plain: "Slow looks answered by slower looks.", set: { setting: "every cut", tempo: "slow", answerer: "another person", answerKind: "echoes", strength: 5 } },
        { label: "Edit-room gag (Hot Fuzz)", plain: "A line is instantly contradicted by the next shot.", set: { setting: "sometimes", answerKind: "contradicts", delay: 0, tempo: "quick" } },
        { label: "The town answers", plain: "A person's cry answered by the empty street.", set: { setting: "sometimes", answerer: "the place", answerKind: "echoes", delay: 1 } },
      ],
    },
  });

  W.add("repetition", {
    sliders: [
      ["changeWhat", "What varies", ["size", "angle", "color", "context"], "Which part of the image changes when it comes back.", U],
      ["timingShift", "Returns come", ["slowing down", "evenly", "speeding up"], "Whether the gaps between returns grow, stay or shrink."],
      ["landing", "Last return lands as", ["same", "a twist", "a payoff"], "What the final return does for the audience."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "pad", x: "spacing", y: "variation", xLabel: "Spacing", yLabel: "Variation" },
        { face: "tiles", slider: "changeWhat", icons: { size: "🔍", angle: "📐", color: "🎨", context: "🖼️" } },
      ],
      groups: [
        { label: "How many and how far apart", sliders: ["setting", "spacing", "timingShift"] },
        { label: "How it changes", sliders: ["variation", "changeWhat", "landing"] },
      ],
      presets: [
        { label: "Groundhog Day loop", plain: "The same moment again and again, close together.", set: { setting: 8, spacing: 1, variation: 2, timingShift: "speeding up" } },
        { label: "Three-beat callback", plain: "Seen three times, the last one pays it off.", set: { setting: 3, spacing: 10, landing: "a payoff", changeWhat: "context" } },
        { label: "Shifting viewpoint", plain: "The same image from a new angle each time.", set: { setting: 4, changeWhat: "angle", variation: 4, landing: "a twist" } },
      ],
    },
  });

  W.add("contrastMap", {
    sliders: [
      ["mainPair", "Main pair", ["quiet:loud", "still:moving", "dark:bright", "empty:crowded", "slow:fast"], "The contrast the film leans on most.", U],
      ["flipsPerHour", "Flips per hour", [0, 30, ""], "How often the film swings from one side of the pair to the other."],
      ["edgeSharp", "How sharp the switch", ["blended", "quick", "hard cut", "smash"], "How abruptly one side gives way to the other."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "mainPair", icons: { "quiet:loud": "🔇🔊", "still:moving": "🧘🏃", "dark:bright": "🌑☀️", "empty:crowded": "⬜👥", "slow:fast": "🐢🐇" } },
        { face: "dial", slider: "flipsPerHour" },
        { face: "ladder", slider: "edgeSharp" },
      ],
      groups: [
        { label: "The pairs", sliders: ["setting", "mainPair", "strength"] },
        { label: "Switching sides", sliders: ["flipsPerHour", "edgeSharp", "change"] },
      ],
      presets: [
        { label: "Horror quiet-then-loud", plain: "Long silences broken by sudden noise.", set: { mainPair: "quiet:loud", edgeSharp: "smash", strength: 5, flipsPerHour: 8 } },
        { label: "Kubrick stillness", plain: "Frozen calm against sudden motion.", set: { mainPair: "still:moving", edgeSharp: "hard cut", flipsPerHour: 3, strength: 4 } },
        { label: "Crowd and solitude", plain: "Busy streets traded for empty rooms.", set: { mainPair: "empty:crowded", edgeSharp: "blended", flipsPerHour: 5 } },
      ],
    },
  });

  W.add("cutArticulation", {
    sliders: [
      ["overlap", "Sound overlaps the cut", [0, 3, "s"], "How long sound from one shot spills into the next."],
      ["clipEarly", "Cut before the moment ends", ["never", "sometimes", "often", "always"], "How often a shot is cut off before its action finishes."],
      ["breathFrames", "Breath between cuts", [0, 24, "frames"], "Tiny pause left at the end of each shot (24 frames make one second)."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "Long and flowing", right: "Short and clipped" },
        { face: "tiles", slider: "style", icons: { invisible: "👻", rhythmic: "🥁", jarring: "⚡" } },
        { face: "dial", slider: "overlap" },
      ],
      groups: [
        { label: "Clipped or flowing", sliders: ["setting", "style", "change"] },
        { label: "At each cut", sliders: ["overlap", "clipEarly", "breathFrames"] },
      ],
      presets: [
        { label: "Godard jump cuts", plain: "Shots chopped mid-move, the cut thrown in your face.", set: { setting: 5, style: "jarring", clipEarly: "always", overlap: 0, breathFrames: 0 } },
        { label: "Malick flowing", plain: "Shots melt into each other with sound running over.", set: { setting: 0, style: "invisible", overlap: 3, breathFrames: 12 } },
        { label: "Drumbeat cutting", plain: "Crisp cuts that land like percussion.", set: { setting: 3, style: "rhythmic", clipEarly: "sometimes", breathFrames: 2 } },
      ],
    },
  });

  W.add("motifShape", {
    sliders: [
      ["trait", "What rises and falls", ["size", "height", "brightness", "closeness"], "Which part of the motif changes across its returns.", U],
      ["peakAt", "Where it peaks", [0, 100, "%"], "How far through the film the motif is at its biggest."],
      ["returns", "Times it returns", [2, 12, ""], "How many times the motif shows up."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { rises: "📈", falls: "📉", arch: "🌈", flat: "➖" } },
        { face: "dial", slider: "peakAt" },
        { face: "tiles", slider: "trait", icons: { size: "🔍", height: "⬆️", brightness: "💡", closeness: "🤏" } },
      ],
      groups: [
        { label: "The shape", sliders: ["setting", "peakAt", "size"] },
        { label: "The motif", sliders: ["trait", "returns", "noticeable"] },
      ],
      presets: [
        { label: "Growing threat (Jaws fin)", plain: "Each return bigger and closer than the last.", set: { setting: "rises", trait: "closeness", peakAt: 90, returns: 5 } },
        { label: "Fading hope", plain: "A light that dims every time we see it.", set: { setting: "falls", trait: "brightness", returns: 4 } },
        { label: "Rise and fall", plain: "Grows to the middle, then shrinks away.", set: { setting: "arch", trait: "size", peakAt: 50, returns: 6 } },
      ],
    },
  });

  W.add("sceneLength", {
    sliders: [
      ["lengthSpread", "Mix of short and long", ["all alike", "a little mixed", "very mixed"], "Whether scenes are similar in length or vary a lot."],
      ["longestAt", "Longest scene sits", ["opening", "middle", "climax", "ending"], "Where in the film the biggest scene is placed."],
      ["trim", "How tightly trimmed", ["roomy", "comfortable", "tight", "bare bones"], "How much air is cut out of each scene."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "minutes" },
        { face: "ladder", slider: "trim" },
        { face: "tiles", slider: "longestAt", icons: { opening: "🚪", middle: "⚖️", climax: "🔥", ending: "🏁" } },
      ],
      groups: [
        { label: "How long", sliders: ["setting", "minutes", "trim"] },
        { label: "Across the film", sliders: ["lengthSpread", "longestAt", "change"] },
      ],
      presets: [
        { label: "Tarantino long table scene", plain: "One very long scene at the heart of it.", set: { setting: "long", minutes: 12, longestAt: "middle", lengthSpread: "very mixed" } },
        { label: "Tight TV drama", plain: "Short, trimmed scenes that keep moving.", set: { setting: "short", minutes: 1.5, trim: "tight", lengthSpread: "a little mixed" } },
        { label: "Stage-play feel", plain: "Roomy scenes of a similar size.", set: { setting: "medium", minutes: 6, trim: "roomy", lengthSpread: "all alike" } },
      ],
    },
  });

  W.add("timeLens", {
    sliders: [
      ["slowOn", "What gets slowed", ["nothing", "the impact", "a face", "the reveal"], "Which moment the time change is saved for.", U],
      ["holdLength", "How long the odd speed lasts", [0, 10, "s"], "How many seconds time stays bent before it returns to normal."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "warp" },
        { face: "compass", slider: "direction", angles: { forward: 90, pauses: 0, rewinds: 270 } },
        { face: "tiles", slider: "drawnOn", icons: { ones: "🎞️", twos: "🖍️", threes: "🧱" } },
      ],
      groups: [
        { label: "Speed of time", sliders: ["warp", "ramp", "holdLength", "slowOn"] },
        { label: "Direction and repeats", sliders: ["direction", "repeat"] },
        { label: "Smooth or choppy", sliders: ["drawnOn"] },
      ],
      presets: [
        { label: "Matrix bullet time", plain: "Time almost stops right on the impact.", set: { warp: "very slow motion", ramp: "ramp", slowOn: "the impact", holdLength: 4 } },
        { label: "Spider-Verse choppy", plain: "Real speed, but drawn on twos for a comic feel.", set: { warp: "real time", drawnOn: "twos" } },
        { label: "Rewind gag", plain: "Stop, rewind and replay the moment.", set: { direction: "rewinds", repeat: "repeats once", warp: "fast forward" } },
      ],
    },
  });

  W.add("reframe", {
    sliders: [
      ["moveTime", "How long the move takes", [0, 20, "s"], "Seconds the zoom or drift takes; zero is an instant punch-in."],
      ["punchOn", "When to punch in", ["at the joke", "at the reveal", "at a feeling", "on the beat"], "The moment the tighter frame is saved for.", U],
      ["keepFace", "Keep the face in view", ["loosely", "mostly", "always"], "How carefully the new frame keeps the person's face."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "full frame": "🖼️", "slight punch-in": "🔎", "strong punch-in": "🔍", "slow drift": "🌊" } },
        { face: "dial", slider: "zoom" },
        { face: "compass", slider: "drift", angles: { up: 0, right: 90, down: 180, left: 270 } },
      ],
      groups: [
        { label: "How tight", sliders: ["setting", "zoom", "keepFace"] },
        { label: "Movement and timing", sliders: ["drift", "moveTime", "punchOn"] },
      ],
      presets: [
        { label: "Ken Burns documentary", plain: "A slow drift across a still photo.", set: { setting: "slow drift", zoom: 120, moveTime: 15, drift: "the face" } },
        { label: "Punch-in on the joke", plain: "Snap closer the instant the joke lands.", set: { setting: "strong punch-in", zoom: 150, moveTime: 0, punchOn: "at the joke" } },
        { label: "Mockumentary reaction", plain: "A slight push onto someone's awkward face.", set: { setting: "slight punch-in", zoom: 115, punchOn: "at a feeling", keepFace: "always" } },
      ],
    },
  });

  W.add("cameraEffect", {
    sliders: [
      ["timedTo", "What it's timed to", ["anywhere", "a hit", "the music beat", "a line"], "The moment that sparks the move.", U],
      ["ease", "How it starts and stops", ["sudden", "quick ease", "smooth ease"], "Whether the move kicks in hard or glides."],
      ["effectLength", "How long it lasts", [0, 10, "s"], "Seconds the added move runs."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", "slam zoom": "💥", "zoom lens": "🔭", "gentle sway": "🍃", "subtle shake": "📳", wobble: "🌀", "radial blur": "💫", "tracking shot": "🛤️", "camera roll": "🔄" } },
        { face: "pad", x: "effectLength", y: "strength", xLabel: "How long", yLabel: "Strength" },
      ],
      groups: [
        { label: "The move", sliders: ["setting", "strength"] },
        { label: "Timing", sliders: ["speed", "ease", "effectLength", "timedTo"] },
      ],
      presets: [
        { label: "Edgar Wright slam zoom", plain: "A sudden zoom that hits like a punch.", set: { setting: "slam zoom", strength: 90, speed: "fast", ease: "sudden", effectLength: 1 } },
        { label: "Found-footage shake", plain: "Nervous handheld wobble on every hit.", set: { setting: "subtle shake", strength: 40, timedTo: "a hit", effectLength: 2 } },
        { label: "Dreamy sway", plain: "A slow drift that makes the shot float.", set: { setting: "gentle sway", strength: 20, speed: "slow", ease: "smooth ease", effectLength: 8 } },
      ],
    },
  });

  W.add("frameMove3D", {
    sliders: [
      ["spinDir", "Direction it turns", ["up", "right", "down", "left"], "Which way the frame swings away.", U],
      ["depth", "How far it moves in depth", [0, 100, "%"], "How deep into the screen the frame travels."],
      ["moveLength", "How long it takes", [0, 5, "s"], "Seconds the 3D move runs."],
      ["revealsNext", "Shows the next shot", ["no", "partly", "fully"], "Whether the move uncovers the next picture behind it."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", "cube spin": "🧊", "shatter mirror": "🪞", "earth zoom": "🌍", unfurl: "📜", "phone showcase": "📱", "wheel gallery": "🎡", "floating widgets": "🎈", "door opens": "🚪", "mosaic zoom": "🧩" } },
        { face: "compass", slider: "spinDir", angles: { up: 0, right: 90, down: 180, left: 270 } },
        { face: "dial", slider: "depth" },
      ],
      groups: [
        { label: "The move", sliders: ["setting", "spinDir", "depth"] },
        { label: "Timing", sliders: ["speed", "moveLength", "revealsNext"] },
      ],
      presets: [
        { label: "Cube spin to the next scene", plain: "The frame turns like a box side to reveal what's next.", set: { setting: "cube spin", spinDir: "left", revealsNext: "fully", moveLength: 1 } },
        { label: "Earth zoom intro", plain: "Dive in from space down to the street.", set: { setting: "earth zoom", depth: 100, speed: "slow", moveLength: 4 } },
        { label: "Shatter for a shock", plain: "The picture breaks apart on a hard moment.", set: { setting: "shatter mirror", speed: "fast", moveLength: 1, revealsNext: "partly" } },
      ],
    },
  });

  W.add("multicamSwitch", {
    sliders: [
      ["cutLead", "Cut on the speaker", ["before they speak", "as they speak", "after they start"], "Whether the switch lands ahead of, on, or just after the new voice."],
      ["reactionHold", "Hold on a reaction", [0, 5, "s"], "How long a listener's face stays up before switching back."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "one angle": "🎥", "switch on the speaker": "🗣️", "switch on reactions": "😮", "switch on the beat": "🥁", "switch freely": "🔀" } },
        { face: "dial", slider: "rate" },
        { face: "ladder", slider: "cutLead" },
      ],
      groups: [
        { label: "Switching", sliders: ["setting", "rate", "cutLead", "reactionHold"] },
        { label: "Cameras and sound", sliders: ["angles", "soundFrom"] },
      ],
      presets: [
        { label: "Talk show", plain: "Follow whoever is speaking, with quick reaction shots.", set: { setting: "switch on the speaker", angles: 4, rate: 8, reactionHold: 1, soundFrom: "a separate recorder" } },
        { label: "Live concert", plain: "Cut freely on the beat across many cameras.", set: { setting: "switch on the beat", angles: 12, rate: 25, soundFrom: "a separate recorder" } },
        { label: "Multi-cam sitcom", plain: "Three cameras, cutting to catch the reactions.", set: { setting: "switch on reactions", angles: 3, rate: 10, reactionHold: 2, cutLead: "as they speak" } },
      ],
    },
  });

  W.add("nestedScene", {
    sliders: [
      ["pieceLength", "Length of the piece", [1, 120, "s"], "How long the packed group of shots runs."],
      ["pieceCount", "Shots inside", [2, 20, ""], "How many shots are packed into the piece."],
      ["changeEachTime", "Changes when reused", ["identical", "small changes", "re-cut", "transformed"], "How different the piece looks each time it comes back."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "pieceLength" },
        { face: "tiles", slider: "reuse", icons: { once: "1️⃣", twice: "2️⃣", "as a motif": "🔁" } },
      ],
      groups: [
        { label: "What's packed", sliders: ["setting", "pieceLength", "pieceCount"] },
        { label: "Using it again", sliders: ["reuse", "changeEachTime"] },
      ],
      presets: [
        { label: "Montage block reused", plain: "The same training montage returns, re-cut each time.", set: { setting: "a group of shots", reuse: "as a motif", changeEachTime: "re-cut", pieceLength: 30 } },
        { label: "Opening titles package", plain: "One packed sequence used at the top of each episode.", set: { setting: "a whole sequence", reuse: "as a motif", changeEachTime: "identical", pieceLength: 60 } },
        { label: "Play within a play", plain: "A scene staged inside another scene.", set: { setting: "a scene inside a scene", reuse: "once", pieceCount: 12 } },
      ],
    },
  });

  W.add("editFocus", {
    sliders: [
      ["guideEye", "How strongly it steers the eye", ["a hint", "a nudge", "clear", "forceful"], "How firmly the focus change tells the audience where to look."],
      ["pullTiming", "When focus moves", ["before the line", "on the line", "after the line"], "Whether focus arrives ahead of, with, or after the spoken moment."],
      ["gap", "Distance between the two", ["close together", "a few steps", "across the room"], "How far apart the two things focus moves between are."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "as filmed": "🎥", "pull to the speaker": "🗣️", "pull to the listener": "👂", "pull to an object": "🔑", "rack back and forth": "↔️" } },
        { face: "dial", slider: "blur" },
        { face: "ladder", slider: "guideEye" },
      ],
      groups: [
        { label: "Where focus goes", sliders: ["setting", "guideEye", "gap"] },
        { label: "How it moves", sliders: ["pullSpeed", "pullTiming", "blur"] },
      ],
      presets: [
        { label: "Spielberg reveal pull", plain: "Focus slides from the face to what they see.", set: { setting: "pull to an object", pullSpeed: "slow", guideEye: "clear", pullTiming: "after the line" } },
        { label: "Soft dialogue pulls", plain: "Gentle shifts to whoever is talking.", set: { setting: "pull to the speaker", pullSpeed: "quick", guideEye: "a nudge", blur: 40 } },
        { label: "Thriller snap focus", plain: "Focus snaps to the threat in the background.", set: { setting: "pull to an object", pullSpeed: "snap", guideEye: "forceful", gap: "across the room", blur: 80 } },
      ],
    },
  });

  W.add("visualDensity", {
    sliders: [
      ["focusPoint", "One clear thing to look at", ["many competing", "a few", "one clear", "only one"], "How clearly the picture tells the eye where to land."],
      ["motionLoad", "Moving things at once", [0, 10, ""], "How many things move in the frame at the same time."],
      ["emptySpace", "Empty space", [0, 100, "%"], "How much of the frame is left bare."],
      ["clutterWhere", "Where the busy part sits", ["background", "edges", "foreground", "everywhere"], "Which part of the frame holds the clutter.", U],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["setting", "motionLoad", "emptySpace"] },
        { face: "balance", slider: "trend", left: "Emptying", right: "Filling" },
        { face: "ladder", slider: "focusPoint" },
      ],
      groups: [
        { label: "How full", sliders: ["setting", "emptySpace", "motionLoad"] },
        { label: "Guiding the eye", sliders: ["focusPoint", "clutterWhere"] },
        { label: "Over time", sliders: ["trend", "noticeable"] },
      ],
      presets: [
        { label: "Wes Anderson busy tableau", plain: "Packed with details, but one clear center.", set: { setting: 8, focusPoint: "one clear", motionLoad: 2, emptySpace: 10 } },
        { label: "Minimalist corridor", plain: "Almost nothing in frame but the person.", set: { setting: 2, emptySpace: 80, focusPoint: "only one", motionLoad: 1 } },
        { label: "Battle chaos", plain: "Everything moving everywhere at once.", set: { setting: 10, motionLoad: 10, focusPoint: "many competing", clutterWhere: "everywhere" } },
      ],
    },
  });

  W.add("pedal", {
    sliders: [
      ["heldWhat", "What stays the same", ["a sound", "a color", "a place", "a camera position", "a pose"], "The one element that does not change.", U],
      ["breakAt", "When it finally changes", ["never", "at the turn", "at the climax", "at the end"], "The moment the held element is released."],
      ["pressure", "Pressure it builds", ["calm", "uneasy", "pressing", "unbearable"], "How much the unchanging element tightens the audience's nerves."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "heldWhat", icons: { "a sound": "🔊", "a color": "🎨", "a place": "📍", "a camera position": "🎥", "a pose": "🧍" } },
        { face: "dial", slider: "length" },
        { face: "ladder", slider: "pressure" },
      ],
      groups: [
        { label: "What is held", sliders: ["setting", "heldWhat", "noticeable"] },
        { label: "How long and why", sliders: ["length", "breakAt", "pressure"] },
      ],
      presets: [
        { label: "Ticking clock (Dunkirk)", plain: "One sound never stops as everything else changes.", set: { setting: "one thing held", heldWhat: "a sound", pressure: "unbearable", breakAt: "at the end" } },
        { label: "Fixed camera (Jeanne Dielman)", plain: "The camera never moves while life goes on.", set: { setting: "one thing held", heldWhat: "a camera position", length: 40, pressure: "uneasy" } },
        { label: "Color thread", plain: "One color carried through every change.", set: { setting: "one thing held", heldWhat: "a color", breakAt: "at the turn", pressure: "calm" } },
      ],
    },
  });

  W.add("operatorFeel", {
    sliders: [
      ["urgency", "Feeling of being there", ["detached", "present", "urgent", "frantic"], "How much the human feel puts the audience in the room."],
      ["searching", "Camera hunts for the subject", ["never", "rarely", "often"], "How often the frame seems to find its subject late."],
      ["cutDrift", "Cut timing drift", [0, 12, "frames"], "How far cuts land early or late of the perfect moment (24 frames make one second)."],
      ["breathing", "Camera breathes", [0, 5, ""], "The gentle rise and fall of a camera held by a person."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "mistakes", xLabel: "Human drift", yLabel: "Mistakes" },
        { face: "ladder", slider: "urgency" },
        { face: "dial", slider: "cutDrift" },
      ],
      groups: [
        { label: "Human touch", sliders: ["setting", "breathing", "searching"] },
        { label: "Imperfection", sliders: ["mistakes", "cutDrift", "noticeable"] },
        { label: "Effect on us", sliders: ["urgency"] },
      ],
      presets: [
        { label: "Bourne handheld", plain: "A camera that chases and almost loses the action.", set: { setting: 5, mistakes: 3, searching: "often", urgency: "frantic", breathing: 4 } },
        { label: "Office mockumentary", plain: "A curious operator who finds jokes a beat late.", set: { setting: 3, searching: "rarely", urgency: "present", cutDrift: 4 } },
        { label: "Kubrick precision", plain: "Machine-perfect, with no human wobble.", set: { setting: 0, mistakes: 0, breathing: 0, cutDrift: 0, urgency: "detached" } },
      ],
    },
  });

  W.add("loopEnding", {
    sliders: [
      ["signal", "How clearly it signals the loop", ["hidden", "a hint", "clear", "obvious"], "How much the ending tells the audience it's circling back."],
      ["seamLength", "Seam length", [0, 3, "s"], "How long the join between last and first moment takes."],
      ["meaningShift", "Start feels new the second time", ["same", "a little", "completely"], "How much the opening means something different once you've seen the end."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➡️", "full circle": "⭕", "soft loop": "🔄", "seamless loop": "♾️" } },
        { face: "ladder", slider: "signal" },
        { face: "dial", slider: "seamLength" },
      ],
      groups: [
        { label: "The loop", sliders: ["setting", "match", "seamLength"] },
        { label: "What the audience gets", sliders: ["signal", "meaningShift"] },
      ],
      presets: [
        { label: "Seamless social loop", plain: "The end flows straight into the start, no join to see.", set: { setting: "seamless loop", match: "everything", seamLength: 0, signal: "hidden" } },
        { label: "Pulp Fiction full circle", plain: "Back to the diner, now it means more.", set: { setting: "full circle", match: "the picture", signal: "clear", meaningShift: "completely" } },
        { label: "Echoing last line", plain: "The final line repeats the first.", set: { setting: "soft loop", match: "the line", signal: "a hint", meaningShift: "a little" } },
      ],
    },
  });

  W.add("imageTransform", {
    sliders: [
      ["turnTime", "How fast it turns", [0, 10, "s"], "Seconds the rotation or tilt takes; zero is instant."],
      ["unease", "Unease it adds", ["none", "a little", "noticeable", "disorienting"], "How off-balance the change makes the audience feel."],
      ["turnWhen", "When it turns", ["at the start", "mid-shot", "on a hit", "throughout"], "The moment the picture flips or tilts.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "as shot": "🖼️", mirrored: "🪞", flipped: "🙃", rotated: "🔄", tilted: "📐" } },
        { face: "dial", slider: "angle" },
        { face: "ladder", slider: "unease" },
      ],
      groups: [
        { label: "The change", sliders: ["setting", "angle", "crop"] },
        { label: "Timing and feeling", sliders: ["turnTime", "turnWhen", "unease"] },
      ],
      presets: [
        { label: "Dutch angle (The Third Man)", plain: "A tilted world that feels wrong.", set: { setting: "tilted", angle: 25, unease: "noticeable", turnWhen: "at the start" } },
        { label: "Mirror to fix direction", plain: "Flip a shot so people face the right way.", set: { setting: "mirrored", angle: 0, unease: "none" } },
        { label: "Inception rotating hallway", plain: "The picture slowly turns all the way round.", set: { setting: "rotated", angle: 180, turnTime: 8, turnWhen: "throughout", unease: "disorienting" } },
      ],
    },
  });

  W.add("stabilization", {
    sliders: [
      ["keepShake", "Keep a little life", [0, 100, "%"], "How much of the natural camera movement to leave in."],
      ["edgeCrop", "Zoom to hide edges", [0, 30, "%"], "How much the picture is enlarged to hide the steadied edges."],
      ["shakeRise", "Shake rises with tension", ["no", "a little", "strongly"], "Whether the shake is let back in as things get tense."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "pad", x: "keepShake", y: "edgeCrop", xLabel: "Life kept", yLabel: "Zoom to hide edges" },
        { face: "tiles", slider: "rollingShutter", icons: { off: "〰️", on: "📏" } },
      ],
      groups: [
        { label: "How steady", sliders: ["setting", "keepShake", "shakeRise"] },
        { label: "Clean-up", sliders: ["rollingShutter", "edgeCrop"] },
      ],
      presets: [
        { label: "Gimbal-smooth vlog", plain: "Glides as if on a rail.", set: { setting: "smooth", keepShake: 10, rollingShutter: "on", edgeCrop: 10 } },
        { label: "Saving Private Ryan raw", plain: "Leave every jolt in, more as it gets worse.", set: { setting: "shaky as shot", keepShake: 100, shakeRise: "strongly" } },
        { label: "Tripod lock-off", plain: "Rock steady, as if it never moved.", set: { setting: "locked", keepShake: 0, edgeCrop: 15, rollingShutter: "on" } },
      ],
    },
  });

  W.add("canvasFill", {
    sliders: [
      ["fillColor", "Fill color", ["black", "white", "matched to the shot", "brand color"], "The color used around the clip when the edges are a color.", U],
      ["clipSize", "Clip size in the frame", [50, 100, "%"], "How much of the frame the clip itself takes up."],
      ["bgDim", "Darken the background", [0, 100, "%"], "How much the fill behind the clip is darkened so the clip stands out."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "ratio", icons: { "wide 16:9": "🖥️", "vertical 9:16": "📱", "square 1:1": "⬛", "cinema 2.39": "🎬" } },
        { face: "swatches", slider: "fillColor", colors: { black: "#000000", white: "#ffffff", "brand color": "#e4572e" } },
        { face: "dial", slider: "blur" },
      ],
      groups: [
        { label: "Frame shape", sliders: ["ratio", "clipSize"] },
        { label: "What fills the edges", sliders: ["setting", "fillColor", "blur", "bgDim"] },
      ],
      presets: [
        { label: "Phone video on a wide screen", plain: "A blurred copy fills the sides.", set: { ratio: "wide 16:9", setting: "blurred copy", blur: 70, bgDim: 30 } },
        { label: "Square social post", plain: "A clean square with a brand color around it.", set: { ratio: "square 1:1", setting: "a color", fillColor: "brand color", clipSize: 85 } },
        { label: "Cinema letterbox", plain: "Classic black bars for the widescreen look.", set: { ratio: "cinema 2.39", setting: "black bars", fillColor: "black", clipSize: 100 } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
