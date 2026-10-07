/* win for the story curiosities in data/db-depth-story.js (depth thread). Each one already has five or six graded
   settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- Personal plot ---------- */

  W.add("incitingEvent", {
    window: {
      faces: [
        { face: "dial", slider: "jolt" },
        { face: "tiles", slider: "kind", icons: { "a message": "✉️", "a death": "🕯️", "a meeting": "🤝", "a loss": "💔", "a discovery": "🔍", "an offer": "🎁" } },
        { face: "ladder", slider: "refused" },
      ],
      groups: [
        { label: "The event", sliders: ["kind", "jolt", "when"] },
        { label: "Their answer", sliders: ["refused"] },
        { label: "Who knows", sliders: ["seenBy"] },
      ],
      presets: [
        { label: "The letter arrives", plain: "A message lands early, hits hard, and they say no at first.", set: { kind: "a message", jolt: 4, when: 8, refused: "refuses at first", seenBy: "only them" } },
        { label: "A death in the family", plain: "A loss everyone knows about, in the first minutes, and they jump in.", set: { kind: "a death", jolt: 5, when: 3, refused: "jumps in", seenBy: "everyone" } },
        { label: "The tempting offer", plain: "A quiet offer a little later, refused twice before they give in.", set: { kind: "an offer", jolt: 2, when: 15, refused: "refuses twice", seenBy: "a few" } },
      ],
    },
  });

  W.add("complication", {
    window: {
      faces: [
        { face: "pad", x: "pileUp", y: "weight", xLabel: "Problems at once", yLabel: "How much harder" },
        { face: "tiles", slider: "source", icons: { "bad luck": "🎲", "their own mistake": "🤦", "an enemy": "🗡️", "a friend": "🫂", "the world": "🌍" } },
        { face: "ladder", slider: "timing" },
      ],
      groups: [
        { label: "The new problem", sliders: ["weight", "source", "solvable"] },
        { label: "How many", sliders: ["pileUp"] },
        { label: "When it lands", sliders: ["timing"] },
      ],
      presets: [
        { label: "Worst possible moment", plain: "A heavy problem from an enemy, just when it was going well.", set: { weight: 4, source: "an enemy", timing: "just when it was going well", pileUp: 2, solvable: "barely" } },
        { label: "Everything at once", plain: "Problems pile up from every side and none can be fixed easily.", set: { pileUp: 6, weight: 5, source: "the world", timing: "at the worst moment", solvable: "not at all" } },
        { label: "Their own fault", plain: "A small mistake of their own that can be fixed at a cost.", set: { source: "their own mistake", weight: 2, pileUp: 1, timing: "in the middle", solvable: "fixable at a cost" } },
      ],
    },
  });

  W.add("reversal", {
    window: {
      faces: [
        { face: "dial", slider: "flip" },
        { face: "tiles", slider: "direction", icons: { "good to bad": "📉", "both ways": "🔄", "bad to good": "📈" } },
        { face: "ladder", slider: "seenComing" },
      ],
      groups: [
        { label: "The flip", sliders: ["flip", "direction", "cause"] },
        { label: "The setup", sliders: ["seenComing"] },
        { label: "What it changes", sliders: ["lasting"] },
      ],
      presets: [
        { label: "Out of nowhere", plain: "A huge flip for the worse with no warning at all.", set: { flip: 5, direction: "good to bad", seenComing: "totally sudden", cause: "another person", lasting: 15 } },
        { label: "Saved by a discovery", plain: "A find turns losing into winning, faintly hinted before.", set: { flip: 4, direction: "bad to good", seenComing: "a faint hint", cause: "a discovery", lasting: 8 } },
        { label: "Their own trap", plain: "Their own act turns on them, and we saw it coming.", set: { cause: "their own act", direction: "good to bad", seenComing: "clearly hinted", flip: 3, lasting: 5 } },
      ],
    },
  });

  W.add("costlyChoice", {
    window: {
      faces: [
        { face: "dial", slider: "cost" },
        { face: "tiles", slider: "kind", icons: { "two good things": "🍰", "two bad things": "⚡", "what they want against what is right": "⚖️", "themselves against others": "🫵" } },
        { face: "ladder", slider: "undo" },
      ],
      groups: [
        { label: "The choice", sliders: ["kind", "cost"] },
        { label: "Deciding", sliders: ["time", "shown"] },
        { label: "Afterwards", sliders: ["undo"] },
      ],
      presets: [
        { label: "No time to think", plain: "Two bad options, no time, and it can never be undone.", set: { kind: "two bad things", time: "no time", shown: "in a moment", undo: "can never undo", cost: 5 } },
        { label: "The long night", plain: "Want against right, days to decide, and we watch every minute.", set: { kind: "what they want against what is right", time: "days", shown: "a long struggle", undo: "hard to undo", cost: 4 } },
        { label: "Quiet choice off screen", plain: "We only see what they chose afterwards.", set: { shown: "off screen", kind: "themselves against others", cost: 3, time: "minutes" } },
      ],
    },
  });

  W.add("pointOfNoReturn", {
    window: {
      faces: [
        { face: "dial", slider: "finality" },
        { face: "tiles", slider: "line", icons: { "a door shut": "🚪", "a secret told": "🤫", "a crime": "🚨", "a promise": "🤞", "leaving home": "🧳" } },
        { face: "ladder", slider: "willing" },
      ],
      groups: [
        { label: "The line", sliders: ["line", "finality"] },
        { label: "How they cross", sliders: ["willing", "witnesses"] },
        { label: "When", sliders: ["place"] },
      ],
      presets: [
        { label: "Burning the boats", plain: "They choose freely, in the middle of the film, and it is final.", set: { finality: 5, willing: "chose it freely", place: 50, line: "leaving home", witnesses: 2 } },
        { label: "Tricked into a crime", plain: "Tricked over the line in front of a crowd.", set: { line: "a crime", willing: "tricked", witnesses: 15, finality: 4, place: 40 } },
        { label: "The secret is out", plain: "A secret told on purpose, late in the film.", set: { line: "a secret told", willing: "unsure", place: 75, finality: 4, witnesses: 5 } },
      ],
    },
  });

  W.add("opponentMove", {
    window: {
      faces: [
        { face: "dial", slider: "threat" },
        { face: "ladder", slider: "distance" },
        { face: "tiles", slider: "who", icons: { "a villain": "🦹", "a rival": "🥊", "a system": "🏛️", nature: "🌪️", "a friend": "🫂" } },
      ],
      groups: [
        { label: "The other side", sliders: ["who", "smart"] },
        { label: "The move", sliders: ["threat", "distance"] },
        { label: "Who sees it", sliders: ["seen"] },
      ],
      presets: [
        { label: "One step ahead", plain: "A clever villain closing in, and only we see it.", set: { who: "a villain", smart: "one step ahead", seen: "shown to us", distance: "closing in", threat: 4 } },
        { label: "Storm at the door", plain: "Nature itself arrives, seen by everyone.", set: { who: "nature", distance: "at the door", seen: "shown to the hero", threat: 5, smart: "fair" } },
        { label: "Quiet rival", plain: "A rival makes a small, unseen move from far away.", set: { who: "a rival", seen: "unseen", distance: "far away", threat: 2, smart: "clever" } },
      ],
    },
  });

  W.add("plantForgotten", {
    window: {
      faces: [
        { face: "pad", x: "gap", y: "buried", xLabel: "Minutes to the payoff", yLabel: "How well hidden" },
        { face: "tiles", slider: "kind", icons: { "an object": "🔑", "a line": "💬", "a skill": "🎯", "a place": "📍", "a habit": "🔁" } },
        { face: "mixer", sliders: ["showings", "payoffSize"] },
      ],
      groups: [
        { label: "The plant", sliders: ["kind", "buried", "disguise", "showings"] },
        { label: "The payoff", sliders: ["gap", "payoffSize"] },
      ],
      presets: [
        { label: "The lighter in the joke", plain: "An object shown once inside a joke, paying off big an hour later.", set: { kind: "an object", disguise: "hidden in a joke", showings: 1, buried: 4, gap: 60, payoffSize: 5 } },
        { label: "A skill we forgot", plain: "A skill shown plainly twice, paying off near the end.", set: { kind: "a skill", disguise: "shown plainly", showings: 2, buried: 2, gap: 80, payoffSize: 4 } },
        { label: "In the background", plain: "A place glimpsed behind the action, paying off soon.", set: { kind: "a place", disguise: "hidden in the background", showings: 1, buried: 5, gap: 15, payoffSize: 3 } },
      ],
    },
  });

  W.add("planShown", {
    window: {
      faces: [
        { face: "dial", slider: "shown" },
        { face: "ladder", slider: "works" },
        { face: "tiles", slider: "told", icons: { "a quick line": "💬", "a talk": "🗣️", "a drawing on a table": "🗺️", "a montage": "🎞️" } },
      ],
      groups: [
        { label: "Telling the plan", sliders: ["shown", "told", "steps"] },
        { label: "Secrets", sliders: ["hidden"] },
        { label: "How it goes", sliders: ["works"] },
      ],
      presets: [
        { label: "Heist briefing", plain: "Every step drawn on the table, and it all falls apart.", set: { shown: 5, told: "a drawing on a table", steps: 8, works: "falls apart", hidden: "nothing hidden" } },
        { label: "The real plan was hidden", plain: "We hear a little; the real plan was secret all along.", set: { shown: 2, hidden: "the real plan is hidden", works: "goes perfectly", told: "a talk", steps: 5 } },
        { label: "No time to explain", plain: "One quick line, then it just about works.", set: { shown: 0, told: "a quick line", steps: 2, works: "small hiccups", hidden: "a small trick" } },
      ],
    },
  });

  /* ---------- Character arc ---------- */

  W.add("mentorLesson", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "ladder", slider: "returns" },
        { face: "tiles", slider: "mentorFate", icons: { stays: "🏠", leaves: "🚶", "fails them": "💔", dies: "🕯️" } },
      ],
      groups: [
        { label: "The lesson", sliders: ["weight", "form"] },
        { label: "The hero", sliders: ["heard", "returns"] },
        { label: "The mentor", sliders: ["mentorFate"] },
      ],
      presets: [
        { label: "Remember what I told you", plain: "A big lesson, ignored at first, back at the key moment after the mentor dies.", set: { weight: 5, heard: "ignored", returns: "at the key moment", mentorFate: "dies", form: "told" } },
        { label: "Wax on, wax off", plain: "Taught through a test the hero does not understand, then lived by.", set: { form: "a test", heard: "half heard", returns: "again and again", mentorFate: "stays", weight: 4 } },
        { label: "The flawed teacher", plain: "A story from a mentor who later fails them.", set: { form: "a story", mentorFate: "fails them", heard: "understood", returns: "once", weight: 3 } },
      ],
    },
  });

  W.add("foil", {
    window: {
      faces: [
        { face: "pad", x: "likeness", y: "clash", xLabel: "How alike", yLabel: "How much they clash" },
        { face: "tiles", slider: "path", icons: { "the dark road": "🌑", "the easy road": "🛋️", "the brave road": "🦁", "stayed stuck": "🪨" } },
        { face: "ladder", slider: "seen" },
      ],
      groups: [
        { label: "The mirror", sliders: ["likeness", "path"] },
        { label: "Together", sliders: ["scenes", "clash"] },
        { label: "Seeing it", sliders: ["seen"] },
      ],
      presets: [
        { label: "Dark twin", plain: "Almost the same person, took the dark road, clashes hard, and the hero sees it in one moment.", set: { likeness: 5, path: "the dark road", clash: 5, seen: "in one moment", scenes: 8 } },
        { label: "The one who stayed", plain: "An old friend who never left town, a gentle warning.", set: { path: "stayed stuck", likeness: 3, clash: 1, seen: "slowly", scenes: 4 } },
        { label: "Braver than me", plain: "Someone who took the brave road, showing what the hero could be.", set: { path: "the brave road", likeness: 4, clash: 2, seen: "slowly", scenes: 10 } },
      ],
    },
  });

  W.add("realization", {
    window: {
      faces: [
        { face: "dial", slider: "clarity" },
        { face: "tiles", slider: "trigger", icons: { "a word": "💬", "an object": "🔑", "a memory": "💭", "a mistake": "❌", "another's pain": "😢" } },
        { face: "ladder", slider: "speed" },
      ],
      groups: [
        { label: "The moment", sliders: ["clarity", "trigger", "speed"] },
        { label: "Showing it", sliders: ["shown"] },
        { label: "When", sliders: ["late"] },
      ],
      presets: [
        { label: "It hits like a wave", plain: "One word, all at once, seen only in their face, late in the film.", set: { trigger: "a word", speed: "all at once", shown: "only a look", clarity: 5, late: 80 } },
        { label: "Slow dawning", plain: "A memory slowly makes sense, shown by a small act.", set: { trigger: "a memory", speed: "slow dawning", shown: "a small act", clarity: 3, late: 60 } },
        { label: "Saying it out loud", plain: "Someone else's pain makes them see, and they say it.", set: { trigger: "another's pain", shown: "said out loud", speed: "a few beats", clarity: 4, late: 70 } },
      ],
    },
  });

  W.add("sacrifice", {
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "tiles", slider: "what", icons: { "a prize": "🏆", "a dream": "🌠", "a love": "❤️", "their safety": "🛡️", "their pride": "👑" } },
        { face: "ladder", slider: "regret" },
      ],
      groups: [
        { label: "What they give", sliders: ["size", "what"] },
        { label: "For whom", sliders: ["forWhom", "known"] },
        { label: "After", sliders: ["regret"] },
      ],
      presets: [
        { label: "Secret gift", plain: "They give up their dream for a friend, and nobody ever knows.", set: { what: "a dream", forWhom: "a friend", known: "nobody knows", size: 5, regret: "a pang" } },
        { label: "For everyone", plain: "They give up their safety for everyone, and it costs them for good.", set: { what: "their safety", forWhom: "everyone", known: "everyone", size: 5, regret: "a lasting ache" } },
        { label: "Swallowing pride", plain: "A small sacrifice of pride, no regret at all.", set: { what: "their pride", forWhom: "a stranger", size: 2, regret: "none", known: "the one they help" } },
      ],
    },
  });

  /* ---------- Focus ---------- */

  W.add("eyeFirst", {
    window: {
      faces: [
        { face: "dial", slider: "pull" },
        { face: "tiles", slider: "by", icons: { brightness: "💡", movement: "🏃", "a face": "🙂", color: "🎨", "lines that point": "📐", "sharp focus": "🔎" } },
        { face: "tiles", slider: "place", icons: { left: "⬅️", center: "⏺️", right: "➡️" } },
      ],
      groups: [
        { label: "The pull", sliders: ["pull", "by"] },
        { label: "The frame", sliders: ["place", "rivals"] },
        { label: "Time", sliders: ["holdTime"] },
      ],
      presets: [
        { label: "One light in the dark", plain: "Brightness pulls hard to the center, nothing competes.", set: { by: "brightness", pull: 5, place: "center", rivals: 0, holdTime: 3 } },
        { label: "Busy street", plain: "Movement on the left fights three other things for a second.", set: { by: "movement", pull: 2, place: "left", rivals: 3, holdTime: 1 } },
        { label: "Rack to the clue", plain: "Sharp focus pulls to the right and holds.", set: { by: "sharp focus", pull: 4, place: "right", rivals: 1, holdTime: 4 } },
      ],
    },
  });

  W.add("returningObject", {
    window: {
      faces: [
        { face: "dial", slider: "returns" },
        { face: "tiles", slider: "object", icons: { "a photo": "🖼️", "a gun": "🔫", "a key": "🔑", "a letter": "✉️", "a toy": "🧸", "a ring": "💍" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "The object", sliders: ["object", "meaning"] },
        { label: "On screen", sliders: ["returns", "size"] },
        { label: "Changes", sliders: ["shifts"] },
      ],
      presets: [
        { label: "The photo on the fridge", plain: "A photo seen often in the background, gone in the last visit.", set: { object: "a photo", returns: 5, size: "in the background", shifts: "is gone", meaning: "a symbol" } },
        { label: "The gun in the drawer", plain: "A gun we keep seeing, center of the frame, the key to the story.", set: { object: "a gun", returns: 3, size: "center of the frame", meaning: "the key to the story", shifts: "moves" } },
        { label: "A child's toy", plain: "A toy that gets more and more damaged each time.", set: { object: "a toy", returns: 6, shifts: "gets damaged", size: "in a corner", meaning: "a hint" } },
      ],
    },
  });

  W.add("unreliableView", {
    window: {
      faces: [
        { face: "dial", slider: "doubt" },
        { face: "tiles", slider: "why", icons: { "they lie": "🤥", "they forget": "🌫️", "they are confused": "😵", "they are dreaming": "💤", "they are unwell": "🤒" } },
        { face: "ladder", slider: "caught" },
      ],
      groups: [
        { label: "The view", sliders: ["who", "why", "doubt"] },
        { label: "Clues", sliders: ["clues"] },
        { label: "Finding out", sliders: ["caught"] },
      ],
      presets: [
        { label: "The narrator lied", plain: "A narrator lies all film; we only learn near the end.", set: { who: "a narrator", why: "they lie", doubt: 5, clues: 3, caught: "near the end" } },
        { label: "Fading memory", plain: "The main character forgets, and clues pile up from early on.", set: { who: "the main character", why: "they forget", doubt: 3, clues: 7, caught: "midway" } },
        { label: "Just a dream", plain: "The camera itself shows a dream, caught early.", set: { who: "the camera itself", why: "they are dreaming", caught: "early", clues: 2, doubt: 2 } },
      ],
    },
  });

  W.add("offscreen", {
    window: {
      faces: [
        { face: "dial", slider: "hidden" },
        { face: "tiles", slider: "hint", icons: { nothing: "⬛", "a sound": "🔊", "a shadow": "👤", "a reaction": "😱", "a glimpse": "👁️" } },
        { face: "ladder", slider: "shownLater" },
      ],
      groups: [
        { label: "What is hidden", sliders: ["what", "hidden"] },
        { label: "Hints", sliders: ["hint", "reactionTime"] },
        { label: "Showing it", sliders: ["shownLater"] },
      ],
      presets: [
        { label: "The box", plain: "We only see faces and hear a sound; never shown.", set: { what: "a gift", hidden: 5, hint: "a reaction", reactionTime: 6, shownLater: "never" } },
        { label: "Unseen monster", plain: "A shadow and a sound, the monster shown only at the end.", set: { what: "a monster", hint: "a shadow", hidden: 4, shownLater: "at the end", reactionTime: 3 } },
        { label: "Violence off screen", plain: "We hear it and look away, shown never.", set: { what: "violence", hint: "a sound", hidden: 5, reactionTime: 2, shownLater: "never" } },
      ],
    },
  });

  W.add("lingeringShot", {
    window: {
      faces: [
        { face: "dial", slider: "overstay" },
        { face: "tiles", slider: "on", icons: { "an empty room": "🏚️", "a face": "🙂", "an object": "🔑", "a door": "🚪", "a window": "🪟" } },
        { face: "ladder", slider: "meaning" },
      ],
      groups: [
        { label: "The hold", sliders: ["overstay", "on", "moves"] },
        { label: "Sound", sliders: ["sound"] },
        { label: "What it says", sliders: ["meaning"] },
      ],
      presets: [
        { label: "The empty chair", plain: "Five extra seconds on an empty room, in silence.", set: { on: "an empty room", overstay: 5, sound: "silence", moves: "still", meaning: "a feeling" } },
        { label: "The door left open", plain: "A slow push in on a door with a sound we cannot place.", set: { on: "a door", moves: "slow push in", sound: "a sound we cannot place", overstay: 7, meaning: "a warning" } },
        { label: "Clue on the shelf", plain: "A short hold on an object, room sound only.", set: { on: "an object", overstay: 3, sound: "room sound", moves: "slow drift", meaning: "a clue" } },
      ],
    },
  });

  /* ---------- Mindset ---------- */

  W.add("blindSpot", {
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "tiles", slider: "about", icons: { "their flaw": "🪞", "a danger": "⚠️", "someone's love": "❤️", "a betrayal": "🗡️", "their own talent": "⭐" } },
        { face: "mixer", sliders: ["seers", "hints"] },
      ],
      groups: [
        { label: "The blind spot", sliders: ["size", "about"] },
        { label: "Everyone else", sliders: ["seers", "hints"] },
        { label: "Opening", sliders: ["opens"] },
      ],
      presets: [
        { label: "Everyone sees the love", plain: "The whole town sees they are loved; it opens slowly.", set: { about: "someone's love", seers: 8, hints: 4, size: 4, opens: "slowly" } },
        { label: "The knife in the back", plain: "A betrayal everyone else spots, opened in one blow.", set: { about: "a betrayal", seers: 3, hints: 2, size: 5, opens: "in one blow" } },
        { label: "Never sees it", plain: "Their flaw, pointed out again and again, never seen.", set: { about: "their flaw", hints: 8, seers: 6, opens: "never", size: 3 } },
      ],
    },
  });

  W.add("excuses", {
    window: {
      faces: [
        { face: "dial", slider: "excuseStrength" },
        { face: "ladder", slider: "doing" },
        { face: "tiles", slider: "voice", icons: { "in their head": "💭", "to a friend": "🗣️", "out loud alone": "🪞", "to us": "🎥" } },
      ],
      groups: [
        { label: "The excuses", sliders: ["excuseStrength", "steps", "voice"] },
        { label: "What it leads to", sliders: ["doing"] },
        { label: "Belief", sliders: ["believe"] },
      ],
      presets: [
        { label: "Just this once", plain: "One weak excuse for something small, said to a friend.", set: { steps: 1, excuseStrength: 1, doing: "something small", voice: "to a friend", believe: "half" } },
        { label: "The slow slide", plain: "Six small excuses, in their head, to something cruel they fully believe in.", set: { steps: 6, excuseStrength: 4, doing: "something cruel", voice: "in their head", believe: "fully" } },
        { label: "Talking to the mirror", plain: "Out loud, alone, for something dangerous they do not believe.", set: { voice: "out loud alone", doing: "something dangerous", believe: "not at all", steps: 3, excuseStrength: 2 } },
      ],
    },
  });

  W.add("misreading", {
    window: {
      faces: [
        { face: "dial", slider: "wrongness" },
        { face: "tiles", slider: "reads", icons: { "kindness as a trick": "🎭", "love as pity": "💔", "a joke as an insult": "😠", "fear as anger": "😨", "a friend as an enemy": "🗡️" } },
        { face: "ladder", slider: "acts" },
      ],
      groups: [
        { label: "The mistake", sliders: ["reads", "wrongness", "clues"] },
        { label: "What they do", sliders: ["acts"] },
        { label: "Cleared up", sliders: ["cleared"] },
      ],
      presets: [
        { label: "Overheard half", plain: "A friend taken for an enemy; they strike back, and learn too late.", set: { reads: "a friend as an enemy", wrongness: 5, acts: "strikes back", clues: 4, cleared: "late" } },
        { label: "Too proud for help", plain: "Love taken as pity; they pull away.", set: { reads: "love as pity", acts: "pulls away", wrongness: 3, clues: 2, cleared: "soon" } },
        { label: "Lost joke", plain: "A joke heard as an insult, cleared up right away.", set: { reads: "a joke as an insult", wrongness: 2, acts: "says something hurtful", cleared: "soon", clues: 1 } },
      ],
    },
  });

  W.add("readingSigns", {
    window: {
      faces: [
        { face: "dial", slider: "belief" },
        { face: "tiles", slider: "sign", icons: { "a number": "🔢", "an animal": "🐦‍⬛", "the weather": "⛈️", "a song": "🎵", "a stranger": "🧥" } },
        { face: "ladder", slider: "acts" },
      ],
      groups: [
        { label: "The signs", sliders: ["sign", "count"] },
        { label: "Their belief", sliders: ["belief", "acts"] },
        { label: "The truth", sliders: ["right"] },
      ],
      presets: [
        { label: "The crow on the fence", plain: "An animal shows up again and again, and they live by it.", set: { sign: "an animal", count: 6, belief: 5, acts: "lives by them", right: "mixed" } },
        { label: "Lucky number", plain: "A number they half believe in, always wrong.", set: { sign: "a number", belief: 2, acts: "notes them", right: "always wrong", count: 4 } },
        { label: "The song on the radio", plain: "A song that turns out to be right, changing their plans.", set: { sign: "a song", acts: "changes plans", right: "always right", belief: 4, count: 3 } },
      ],
    },
  });

  /* ---------- Herd ---------- */

  W.add("crowdTurns", {
    window: {
      faces: [
        { face: "dial", slider: "turn" },
        { face: "tiles", slider: "trigger", icons: { "a speech": "🎤", "a lie": "🤥", "a rumor": "🗣️", "a shock": "⚡", "one brave act": "🦁" } },
        { face: "tiles", slider: "against", icons: { "the hero": "🦸", "the villain": "🦹", "an outsider": "🧳", "their own leader": "👑" } },
      ],
      groups: [
        { label: "The turn", sliders: ["turn", "trigger", "against"] },
        { label: "How it spreads", sliders: ["first", "speed"] },
      ],
      presets: [
        { label: "Cheers to boos", plain: "A lie turns the whole crowd on the hero in seconds.", set: { trigger: "a lie", against: "the hero", turn: 5, first: "a few", speed: 5 } },
        { label: "Turning on the boss", plain: "One brave act, and slowly the crowd turns on its own leader.", set: { trigger: "one brave act", against: "their own leader", first: "one person", speed: 20, turn: 4 } },
        { label: "Blame the stranger", plain: "A rumor and a leader turn everyone on an outsider.", set: { trigger: "a rumor", against: "an outsider", first: "a leader", speed: 10, turn: 4 } },
      ],
    },
  });

  W.add("rallyingSpeech", {
    window: {
      faces: [
        { face: "dial", slider: "converts" },
        { face: "tiles", slider: "tool", icons: { "a speech": "🎤", proof: "📄", "a brave act": "🦁", "a joke": "😄", "a sacrifice": "🕯️" } },
        { face: "ladder", slider: "start" },
      ],
      groups: [
        { label: "The room", sliders: ["start", "holdout"] },
        { label: "The lone voice", sliders: ["tool", "win"] },
        { label: "Result", sliders: ["converts"] },
      ],
      presets: [
        { label: "Twelve angry jurors", plain: "Everyone against, proof one by one, until only the leader holds out.", set: { start: "everyone against", tool: "proof", win: 4, converts: 11, holdout: "the leader" } },
        { label: "Rousing speech", plain: "A split room, a speech, and everyone comes around.", set: { start: "split", tool: "a speech", win: 5, converts: 30, holdout: "no one" } },
        { label: "Winning with a laugh", plain: "A joke wins some of them, but a few still refuse.", set: { tool: "a joke", start: "most against", win: 2, converts: 8, holdout: "a few" } },
      ],
    },
  });

  W.add("copying", {
    window: {
      faces: [
        { face: "dial", slider: "copy" },
        { face: "tiles", slider: "what", icons: { clothes: "👕", words: "💬", "a laugh": "😂", "a choice": "✋", "a cruelty": "👊" } },
        { face: "ladder", slider: "who" },
      ],
      groups: [
        { label: "What spreads", sliders: ["what", "copy"] },
        { label: "Who follows", sliders: ["who", "delay"] },
        { label: "Awareness", sliders: ["aware"] },
      ],
      presets: [
        { label: "Forks down", plain: "One person puts down a fork, everyone else does a beat later.", set: { what: "a choice", who: "everyone", copy: 5, delay: 1, aware: "unaware" } },
        { label: "Joining the cruelty", plain: "A few join a cruel act, glancing around first, fully aware.", set: { what: "a cruelty", who: "a few", delay: 3, aware: "fully aware", copy: 3 } },
        { label: "Same laugh", plain: "Most of the room copies the boss's laugh at once.", set: { what: "a laugh", who: "most", delay: 0, copy: 4, aware: "half aware" } },
      ],
    },
  });

  W.add("rumor", {
    window: {
      faces: [
        { face: "pad", x: "hops", y: "spread", xLabel: "People it passes through", yLabel: "How far it spreads" },
        { face: "ladder", slider: "growth" },
        { face: "ladder", slider: "truth" },
      ],
      groups: [
        { label: "The rumor", sliders: ["truth", "growth"] },
        { label: "Spreading", sliders: ["spread", "hops"] },
        { label: "The subject", sliders: ["reaches"] },
      ],
      presets: [
        { label: "Whisper chain", plain: "A twisted truth passes through many and becomes a monster.", set: { truth: "a twisted truth", growth: "becomes a monster", hops: 15, spread: 5, reaches: "late" } },
        { label: "Small-town gossip", plain: "A true story everyone hears, unchanged, and the subject hears first.", set: { truth: "true", growth: "stays the same", hops: 6, spread: 4, reaches: "first" } },
        { label: "Fizzles out", plain: "A false story that shrinks and never reaches its subject.", set: { truth: "completely false", growth: "shrinks", hops: 2, spread: 1, reaches: "never" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
