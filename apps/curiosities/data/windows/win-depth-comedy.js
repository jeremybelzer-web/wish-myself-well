/* win for the comedy and comedy-from-the-mix curiosities in data/db-depth-comedy.js (depth thread, comedy). Each
   one already has six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- comedy ---------- */

  W.add("wrongEar", {
    window: {
      faces: [
        { face: "dial", slider: "overheard" },
        { face: "tiles", slider: "how", icons: { "through a wall": "🧱", "behind a door": "🚪", "a phone left on": "📱", "a microphone left on": "🎙️", "standing right behind them": "👤" } },
        { face: "tiles", slider: "response", icons: { "says nothing and stews": "😶", "confronts them": "😠", "plays along to trap them": "🪤", "spreads it to everyone": "📣" } },
      ],
      groups: [
        { label: "What is heard", sliders: ["overheard", "what", "half"] },
        { label: "How it reaches them", sliders: ["how"] },
        { label: "What comes of it", sliders: ["speakerKnows", "response"] },
      ],
      presets: [
        { label: "Mother-in-law in the doorway", plain: "A complaint about her, heard in full from right behind, and the speaker turns around.", set: { overheard: 5, what: "a complaint about them", how: "standing right behind them", half: "all of it", speakerKnows: "the moment they turn around", response: "says nothing and stews" } },
        { label: "Half a confession", plain: "A confession of love heard through a wall, only half of it, and it spreads.", set: { overheard: 3, what: "a confession of love", how: "through a wall", half: "half of it, out of context", speakerKnows: "later", response: "spreads it to everyone" } },
        { label: "Hot mic", plain: "A joke about the boss goes out on a microphone left on, and the boss plays along.", set: { overheard: 4, what: "a joke at their expense", how: "a microphone left on", half: "all of it", speakerKnows: "later", response: "plays along to trap them" } },
      ],
    },
  });

  W.add("tryingTooHard", {
    window: {
      faces: [
        { face: "ladder", slider: "cracks" },
        { face: "tiles", slider: "move", icons: { "a casual lean": "🧍", sunglasses: "🕶️", "new slang": "🤙", "a smooth line": "💬", "describing their own moves": "🎙️", "a stunt": "🛹" } },
        { face: "pad", x: "effort", y: "cracks", xLabel: "How hard they try", yLabel: "How badly it breaks" },
      ],
      groups: [
        { label: "The act", sliders: ["effort", "move", "audience"] },
        { label: "When it breaks", sliders: ["cracks", "covers", "seen"] },
      ],
      presets: [
        { label: "The rolling car", plain: "A casual lean for a crush, a total collapse she sees, and he pretends it was on purpose.", set: { effort: 4, move: "a casual lean", audience: "a crush", cracks: "a total collapse", covers: "pretend it was on purpose", seen: "the one they wanted to impress" } },
        { label: "Cool dad", plain: "Ten-year-old slang for the kids, a small slip, and he doubles down.", set: { effort: 3, move: "new slang", audience: "kids", cracks: "a small slip", covers: "double down", seen: "everyone" } },
        { label: "Talking up his own moves", plain: "He describes his own smooth moves out loud with nobody watching but us.", set: { effort: 5, move: "describing their own moves", audience: "nobody, just themselves", cracks: "a loud fail", covers: "they don't notice", seen: "only us" } },
      ],
    },
  });

  W.add("literalMinded", {
    window: {
      faces: [
        { face: "dial", slider: "literal" },
        { face: "tiles", slider: "who", icons: { "a child": "🧒", "a robot or alien": "🤖", "someone new to the language": "🧳", "a very rigid person": "📏", "a dog": "🐕" } },
        { face: "ladder", slider: "acted" },
      ],
      groups: [
        { label: "The reading", sliders: ["literal", "words", "who"] },
        { label: "What they do", sliders: ["acted", "repeats"] },
        { label: "How it turns out", sliders: ["lesson"] },
      ],
      presets: [
        { label: "Robot butler", plain: "Every saying acted out in full by a polite robot, and it is just a mess.", set: { literal: 5, who: "a robot or alien", words: "a saying", acted: "act it out in full, at length", repeats: 5, lesson: "no, just a mess" } },
        { label: "Kid takes the order", plain: "A child follows an order to the letter, and by accident it helps.", set: { literal: 4, who: "a child", words: "an order", acted: "act it out", repeats: 2, lesson: "by accident it helps" } },
        { label: "Puzzled newcomer", plain: "Someone new to the language looks puzzled at a polite lie, and was right all along.", set: { literal: 2, who: "someone new to the language", words: "a polite lie", acted: "look puzzled", repeats: 3, lesson: "they were right all along" } },
      ],
    },
  });

  W.add("planFailsFirst", {
    window: {
      faces: [
        { face: "pad", x: "prep", y: "steps", xLabel: "How much preparation", yLabel: "Steps in the plan" },
        { face: "ladder", slider: "failsAt" },
        { face: "tiles", slider: "cause", icons: { "a locked door": "🔒", "a forgotten thing": "🎒", "one person's mistake": "🤦", "a tiny animal": "🐭", "plain bad luck": "🎲" } },
      ],
      groups: [
        { label: "The plan", sliders: ["prep", "shown", "steps"] },
        { label: "The failure", sliders: ["failsAt", "cause"] },
        { label: "After", sliders: ["after"] },
      ],
      presets: [
        { label: "Heist on a whiteboard", plain: "Twelve steps on a whiteboard, and the van door is locked.", set: { prep: 5, shown: "a whiteboard", steps: 12, failsAt: "at step one", cause: "a locked door", after: "improvise and make it worse" } },
        { label: "Before it even starts", plain: "A full rehearsal, then someone forgot the bag before step one.", set: { prep: 4, shown: "a full rehearsal", steps: 8, failsAt: "before step one", cause: "a forgotten thing", after: "start a new, longer plan" } },
        { label: "The voice-over plan", plain: "We hear the plan while we watch it, and a mouse ends it at step two.", set: { prep: 3, shown: "a voice-over while we watch it", steps: 5, failsAt: "at step two", cause: "a tiny animal", after: "improvise and win" } },
      ],
    },
  });

  W.add("walkOfShame", {
    window: {
      faces: [
        { face: "dial", slider: "length" },
        { face: "tiles", slider: "silence", icons: { "normal noise": "🔉", quiet: "🔈", "dead silence": "🔇", "one person clapping": "👏", "sad music": "🎻" } },
        { face: "tiles", slider: "shot", icons: { "a quick cut": "✂️", "follows behind": "🎥", "one long wide shot": "🖼️", "from their point of view": "👀" } },
      ],
      groups: [
        { label: "The walk", sliders: ["length", "where", "dignity"] },
        { label: "The watchers", sliders: ["watchers", "silence"] },
        { label: "The camera", sliders: ["shot"] },
      ],
      presets: [
        { label: "Boardroom slow clap", plain: "One long wide shot down the boardroom, and one person starts to clap.", set: { length: 5, where: "across a room", watchers: 12, silence: "one person clapping", dignity: "pretending it's fine", shot: "one long wide shot" } },
        { label: "Off the stage", plain: "Off the stage in dead silence in front of a full hall, running at the end.", set: { length: 4, where: "off a stage", watchers: 100, silence: "dead silence", dignity: "running at the end", shot: "follows behind" } },
        { label: "Head held high", plain: "Down the bus aisle with sad music and their head held high.", set: { length: 3, where: "down an aisle", watchers: 30, silence: "sad music", dignity: "head held high", shot: "from their point of view" } },
      ],
    },
  });

  W.add("cheapEffect", {
    window: {
      faces: [
        { face: "dial", slider: "cheap" },
        { face: "tiles", slider: "kind", icons: { "a prop": "🧰", "a monster": "👾", "a set": "🏚️", "a dummy or stand-in": "🪆", "a camera trick": "🎥", "a fake background": "🖼️" } },
        { face: "tiles", slider: "flaw", icons: { "a visible string": "🧵", wobbling: "〰️", "a badly matched cut": "✂️", "the wrong size": "📏", "a zip on the costume": "🤐" } },
      ],
      groups: [
        { label: "The fake", sliders: ["cheap", "kind", "flaw"] },
        { label: "How it's played", sliders: ["played", "homage"] },
        { label: "How often", sliders: ["repeats"] },
      ],
      presets: [
        { label: "Saucer on a string", plain: "A camera trick with a visible string, saluted with total respect.", set: { cheap: 5, kind: "a camera trick", flaw: "a visible string", played: "dead serious", homage: "a full copy of an old style", repeats: 3 } },
        { label: "Monster with a zip", plain: "A rubber monster with a zip up the back that nobody mentions.", set: { cheap: 4, kind: "a monster", flaw: "a zip on the costume", played: "they barely notice", homage: "a nod to old films", repeats: 2 } },
        { label: "Wobbly set, called out", plain: "The walls wobble, and a character points it out.", set: { cheap: 3, kind: "a set", flaw: "wobbling", played: "they point it out", homage: "no", repeats: 4 } },
      ],
    },
  });

  W.add("rewatchGag", {
    window: {
      faces: [
        { face: "dial", slider: "hidden" },
        { face: "tiles", slider: "kind", icons: { "a background detail": "🔍", "a line with a second meaning": "💬", "a name or a sign": "🪧", "a character already there": "🕵️", "a sound": "🔊" } },
        { face: "ladder", slider: "needs" },
      ],
      groups: [
        { label: "The hidden joke", sliders: ["hidden", "kind", "fair"] },
        { label: "What unlocks it", sliders: ["needs", "gap"] },
        { label: "How many", sliders: ["count"] },
      ],
      presets: [
        { label: "Killer in the background", plain: "The killer is already there in scene one, and you only see it once you know the ending.", set: { hidden: 4, kind: "a character already there", needs: "the ending", gap: 90, count: 3, fair: "possible with sharp eyes" } },
        { label: "Packed with eggs", plain: "Twenty background details hidden through the film for sharp eyes.", set: { hidden: 3, kind: "a background detail", needs: "nothing, just sharp eyes", gap: 0, count: 20, fair: "possible with sharp eyes" } },
        { label: "The line that changes", plain: "A line with a second meaning that needs the film's secret.", set: { hidden: 5, kind: "a line with a second meaning", needs: "the film's secret", gap: 60, count: 1, fair: "impossible" } },
      ],
    },
  });

  W.add("politeSurface", {
    window: {
      faces: [
        { face: "pad", x: "wrong", y: "polite", xLabel: "How bad it gets", yLabel: "How polite they stay" },
        { face: "tiles", slider: "event", icons: { "a dinner party": "🍽️", "a wedding": "💒", "meeting the parents": "👪", "a funeral": "⚱️", "a business lunch": "💼", "a royal visit": "👑" } },
        { face: "ladder", slider: "mask" },
      ],
      groups: [
        { label: "The occasion", sliders: ["event", "rules"] },
        { label: "The trouble", sliders: ["wrong"] },
        { label: "The manners", sliders: ["polite", "mask", "breaks"] },
      ],
      presets: [
        { label: "Smoke in the kitchen", plain: "A dinner party carries on with perfect manners while a fire grows.", set: { polite: 5, event: "a dinner party", wrong: "a fire", mask: "a twitch", rules: "strict", breaks: "everyone at the end" } },
        { label: "The royal visit", plain: "Ancient rules, an insult no one can answer, and a vein about to pop.", set: { polite: 5, event: "a royal visit", wrong: "an insult", mask: "a vein about to pop", rules: "ancient and absurd", breaks: "no one" } },
        { label: "The parents find out", plain: "Meeting the parents as a secret comes out, and one person cracks.", set: { polite: 3, event: "meeting the parents", wrong: "a secret coming out", mask: "a tight smile", rules: "normal", breaks: "one person" } },
      ],
    },
  });

  W.add("neverGetsIt", {
    window: {
      faces: [
        { face: "dial", slider: "lost" },
        { face: "tiles", slider: "shows", icons: { "a blank face": "😐", "asks what was funny": "❓", "laughs much too late": "⏰", "answers it seriously": "🧐", "explains why it's wrong": "☝️" } },
        { face: "tiles", slider: "finally", icons: { never: "🚫", "yes, much too late": "🐢", "they make the best joke at the end": "🏆" } },
      ],
      groups: [
        { label: "Missing it", sliders: ["lost", "shows", "times"] },
        { label: "How it feels", sliders: ["minds", "others"] },
        { label: "The end", sliders: ["finally"] },
      ],
      presets: [
        { label: "Grandpa laughs late", plain: "Laughs much too late at every joke, doesn't mind, and the family loves him for it.", set: { lost: 3, shows: "laughs much too late", minds: "not at all", others: "love them for it", times: 6, finally: "yes, much too late" } },
        { label: "The literal colleague", plain: "Answers every joke seriously, feels left out, and wins at the end.", set: { lost: 5, shows: "answers it seriously", minds: "feels left out", others: "tease them", times: 5, finally: "they make the best joke at the end" } },
        { label: "Quiet blank face", plain: "A blank face a few times, ignored by the room.", set: { lost: 2, shows: "a blank face", minds: "a little", others: "ignore them", times: 3, finally: "never" } },
      ],
    },
  });

  W.add("offscreenGag", {
    window: {
      faces: [
        { face: "dial", slider: "unseen" },
        { face: "tiles", slider: "sound", icons: { "a crash": "💥", "a long fall": "🪜", "a splash": "💦", "a scream": "😱", "an animal": "🐐", "a long chain of sounds": "🔗" } },
        { face: "mixer", sliders: ["unseen", "length"] },
      ],
      groups: [
        { label: "What we hear", sliders: ["unseen", "sound", "length"] },
        { label: "What we see", sliders: ["faces", "flinch"] },
        { label: "After", sliders: ["after"] },
      ],
      presets: [
        { label: "Bike down the stairs", plain: "A long chain of clangs out of sight, everyone wincing at each one.", set: { unseen: 5, sound: "a long chain of sounds", length: 6, faces: "everyone in the room", flinch: "a wince at each sound", after: "the result" } },
        { label: "Back in, calm", plain: "One crash, one face, and the person walks back in as if nothing happened.", set: { unseen: 4, sound: "a crash", length: 1.5, faces: "one person", flinch: "a wince", after: "the person walks back in calm" } },
        { label: "The empty doorway", plain: "A scream and a splash behind an empty doorway, and we never find out.", set: { unseen: 5, sound: "a splash", length: 3, faces: "nobody, an empty doorway", flinch: "no reaction", after: "we never find out" } },
      ],
    },
  });

  W.add("worstMoment", {
    window: {
      faces: [
        { face: "dial", slider: "timing" },
        { face: "tiles", slider: "by", icons: { "a phone": "📱", "a person walking in": "🚶", "a waiter": "🍷", "a sneeze": "🤧", "an alarm": "🚨", "an animal": "🐕" } },
        { face: "ladder", slider: "mood" },
      ],
      groups: [
        { label: "The moment", sliders: ["timing", "moment", "tries"] },
        { label: "The interruption", sliders: ["by", "blame"] },
        { label: "What is left", sliders: ["mood"] },
      ],
      presets: [
        { label: "The waiter again", plain: "Three tries at a proposal, a clueless waiter every time, and it ends better.", set: { timing: 5, moment: "a proposal", by: "a waiter", tries: 3, mood: "it turns into something better", blame: "has no idea" } },
        { label: "Saved by the phone", plain: "A confession cut off by a phone, and the moment is lost.", set: { timing: 4, moment: "a confession", by: "a phone", tries: 1, mood: "it is lost", blame: "realizes too late" } },
        { label: "The kid walks in", plain: "The kiss is cut off by a kid walking in on purpose, again and again.", set: { timing: 3, moment: "a kiss", by: "a person walking in", tries: 4, mood: "it is a little spoiled", blame: "did it on purpose" } },
      ],
    },
  });

  W.add("mistakenIdentity", {
    window: {
      faces: [
        { face: "dial", slider: "mixup" },
        { face: "tiles", slider: "takenFor", icons: { "a stranger": "🧑", "a famous person": "🌟", "the new boss": "💼", "a criminal or spy": "🕵️", "their own twin": "👯" } },
        { face: "ladder", slider: "plays" },
      ],
      groups: [
        { label: "The mix-up", sliders: ["mixup", "takenFor", "why"] },
        { label: "Living the part", sliders: ["plays", "howMany"] },
        { label: "The truth", sliders: ["truth"] },
      ],
      presets: [
        { label: "The wrong spy", plain: "In the wrong place, taken for a spy, gives up explaining until the real one turns up.", set: { mixup: 5, takenFor: "a criminal or spy", why: "in the wrong place", plays: "give up explaining", howMany: "a few", truth: "the real one turns up" } },
        { label: "Fake chef", plain: "A waiter in the wrong clothes is taken for the famous chef and loves it.", set: { mixup: 3, takenFor: "a famous person", why: "wearing the wrong thing", plays: "happily play along", howMany: "a whole town", truth: "they get caught" } },
        { label: "Swapped twins", plain: "Twins swap on purpose and confess at the end.", set: { mixup: 4, takenFor: "their own twin", why: "a look-alike", plays: "use it on purpose", howMany: "one person", truth: "they confess" } },
      ],
    },
  });

  W.add("sceneStealer", {
    window: {
      faces: [
        { face: "dial", slider: "steal" },
        { face: "tiles", slider: "animal", icons: { "a dog": "🐕", "a cat": "🐈", "a parrot": "🦜", "a goat": "🐐", "a duck": "🦆", "a horse": "🐎" } },
        { face: "tiles", slider: "does", icons: { stares: "👀", "makes a noise": "🔊", "eats something": "🍰", "sits in the wrong place": "🪑", "runs off with something": "🏃", "copies a person": "🪞" } },
      ],
      groups: [
        { label: "The animal", sliders: ["steal", "animal", "owner"] },
        { label: "The theft", sliders: ["does", "when"] },
        { label: "The humans", sliders: ["humans"] },
      ],
      presets: [
        { label: "Parrot in court", plain: "The witness's parrot repeats the lawyer's words during the speech while everyone pretends not to notice.", set: { steal: 4, animal: "a parrot", does: "copies a person", when: "in the middle of a speech", humans: "pretend not to notice", owner: "a stranger's" } },
        { label: "Dog eats the cake", plain: "The hero's dog eats the cake at the big kiss, and everyone gives up and watches.", set: { steal: 5, animal: "a dog", does: "eats something", when: "at the big kiss", humans: "give up and watch", owner: "the hero's" } },
        { label: "Cat on the papers", plain: "The villain's cat sits on the plans at a quiet moment.", set: { steal: 2, animal: "a cat", does: "sits in the wrong place", when: "at a quiet moment", humans: "try to stop it", owner: "the villain's" } },
      ],
    },
  });

  W.add("fumbledHello", {
    window: {
      faces: [
        { face: "pad", x: "rounds", y: "fumble", xLabel: "Rounds of trying", yLabel: "How bad the fumble" },
        { face: "tiles", slider: "first", icons: { "a handshake": "🤝", "a hug": "🤗", "a kiss on the cheek": "😘", "a high five": "✋", "a bow": "🙇", "a fist bump": "👊" } },
        { face: "tiles", slider: "second", icons: { "a handshake": "🤝", "a hug": "🤗", "a kiss on the cheek": "😘", "a high five": "✋", "a bow": "🙇", nothing: "🧍" } },
      ],
      groups: [
        { label: "The greeting", sliders: ["fumble", "first", "second"] },
        { label: "How long", sliders: ["rounds", "ending"] },
        { label: "Who they are", sliders: ["status"] },
      ],
      presets: [
        { label: "Boss hug, worker handshake", plain: "Handshake meets hug, two switches, and a stiff hug.", set: { fumble: 3, first: "a handshake", second: "a hug", rounds: 3, ending: "a stiff hug", status: "the boss and a worker" } },
        { label: "Cheek clash", plain: "Two exes go for a kiss on the cheek on the same side and bump heads.", set: { fumble: 4, first: "a kiss on the cheek", second: "a kiss on the cheek", rounds: 2, ending: "they bump heads", status: "ex-lovers" } },
        { label: "Left hanging", plain: "A high five meets nothing, and a friend steps in to save them.", set: { fumble: 2, first: "a high five", second: "nothing", rounds: 1, ending: "someone else saves them", status: "strangers" } },
      ],
    },
  });

  /* ---------- comedy from the mix ---------- */

  W.add("politeWar", {
    window: {
      faces: [
        { face: "balance", slider: "venom", left: "real kindness", right: "pure poison" },
        { face: "tiles", slider: "weapon", icons: { compliments: "💐", gifts: "🎁", "offers of help": "🤲", "being more generous": "💸", "being busier": "📅" } },
        { face: "dial", slider: "rounds" },
      ],
      groups: [
        { label: "The fight", sliders: ["venom", "weapon", "rounds"] },
        { label: "Who sees it", sliders: ["crowd"] },
        { label: "The end", sliders: ["winner", "snap"] },
      ],
      presets: [
        { label: "Bake sale rivals", plain: "Six rounds of sweet compliments that sting, seen only by one sharp friend.", set: { venom: 4, weapon: "compliments", rounds: 6, crowd: "one sharp friend", winner: "a tie", snap: "never" } },
        { label: "Gift war", plain: "Each gift bigger and more embarrassing, until it turns into a real fight.", set: { venom: 5, weapon: "gifts", rounds: 4, crowd: "the whole room", winner: "someone else entirely", snap: "it turns into a real fight" } },
        { label: "Busier than you", plain: "Two parents compete at being busier, and one snaps once at the end.", set: { venom: 3, weapon: "being busier", rounds: 3, crowd: "the audience only", winner: "the second one", snap: "once at the end" } },
      ],
    },
  });

  W.add("crossedTalk", {
    window: {
      faces: [
        { face: "dial", slider: "cross" },
        { face: "tiles", slider: "how", icons: { "two people in one room": "🛋️", "a phone call and the room": "📞", "cutting between two places": "✂️", "a wall between them": "🧱" } },
        { face: "ladder", slider: "pace" },
      ],
      groups: [
        { label: "The two talks", sliders: ["cross", "how", "topics"] },
        { label: "The switching", sliders: ["pace"] },
        { label: "What it does", sliders: ["aware", "land"] },
      ],
      presets: [
        { label: "Vet and dinner", plain: "Cutting line by line between two places, and one line comes out rude.", set: { cross: 5, how: "cutting between two places", topics: "different", pace: "line by line", aware: "no one notices", land: "makes one line rude" } },
        { label: "The phone that answers", plain: "A phone call seems to answer the room and gives a secret away.", set: { cross: 4, how: "a phone call and the room", topics: "opposites", pace: "every few lines", aware: "one person notices", land: "gives away a secret" } },
        { label: "Thin walls", plain: "A crisis next door through the wall makes a small fight worse.", set: { cross: 3, how: "a wall between them", topics: "one is a crisis", pace: "slowly", aware: "they meet at the end", land: "makes a fight worse" } },
      ],
    },
  });

  W.add("tooManyCooks", {
    window: {
      faces: [
        { face: "pad", x: "helpers", y: "worse", xLabel: "How many jump in", yLabel: "How much worse" },
        { face: "tiles", slider: "problem", icons: { "a spill": "💧", "a stuck door": "🚪", "a small fire": "🔥", "a broken machine": "⚙️", "a sick guest": "🤒", "a lost thing": "🔑" } },
        { face: "tiles", slider: "fixed", icons: { "it doesn't": "❌", "by accident": "🎲", "the quiet one fixes it in one move": "🤫", "it fixes itself": "✨" } },
      ],
      groups: [
        { label: "The problem", sliders: ["problem", "worse"] },
        { label: "The helpers", sliders: ["helpers", "clash", "leader"] },
        { label: "The fix", sliders: ["fixed"] },
      ],
      presets: [
        { label: "Smoking toaster", plain: "Four helpers, each breaking something new, until the quiet kid opens a window.", set: { worse: 4, helpers: 4, problem: "a small fire", clash: "they each break something new", leader: "no one", fixed: "the quiet one fixes it in one move" } },
        { label: "Stuck door committee", plain: "Seven people argue about how to open a stuck door, and it opens by accident.", set: { worse: 3, helpers: 7, problem: "a stuck door", clash: "they argue about how", leader: "everyone thinks it's them", fixed: "by accident" } },
        { label: "Undoing each other", plain: "Two helpers undo each other's work on a broken machine forever.", set: { worse: 5, helpers: 2, problem: "a broken machine", clash: "they undo each other", leader: "the one who caused it", fixed: "it doesn't" } },
      ],
    },
  });

  W.add("genreSwap", {
    window: {
      faces: [
        { face: "dial", slider: "swap" },
        { face: "tiles", slider: "genre", icons: { "horror film": "👻", western: "🤠", "war film": "🪖", "nature show": "🦁", "heist film": "💰", "courtroom drama": "⚖️", "sports film": "🏆" } },
        { face: "ladder", slider: "tools" },
      ],
      groups: [
        { label: "The swap", sliders: ["swap", "genre", "tools"] },
        { label: "The moment", sliders: ["moment", "length"] },
        { label: "Back to normal", sliders: ["snap"] },
      ],
      presets: [
        { label: "Remote control standoff", plain: "A small argument shot as a western, cut hard back to normal.", set: { swap: 5, genre: "western", moment: "a small argument", tools: "music, camera and lines", length: 40, snap: "a hard cut to normal" } },
        { label: "The sock horror", plain: "A chore shot like a horror film, with only the music and camera borrowed.", set: { swap: 3, genre: "horror film", moment: "a chore", tools: "music and camera", length: 20, snap: "someone points it out" } },
        { label: "Dinner as a nature show", plain: "A whole family meal narrated like a nature show, and it stays that way.", set: { swap: 4, genre: "nature show", moment: "a meal", tools: "everything, even a title card", length: 120, snap: "it stays that way" } },
      ],
    },
  });

  W.add("farceCollision", {
    window: {
      faces: [
        { face: "pad", x: "threads", y: "collide", xLabel: "How many problems", yLabel: "How hard they collide" },
        { face: "dial", slider: "doors" },
        { face: "ladder", slider: "blowUp" },
      ],
      groups: [
        { label: "The problems", sliders: ["collide", "threads"] },
        { label: "The room", sliders: ["place", "doors"] },
        { label: "Keeping it together", sliders: ["juggler", "blowUp"] },
      ],
      presets: [
        { label: "Hotel lobby finale", plain: "Five problems, three lifts, the hero juggling, and everything comes out at once.", set: { collide: 5, threads: 5, place: "a hotel lobby", doors: 6, juggler: "the hero", blowUp: "everything comes out at once" } },
        { label: "Small flat, many closets", plain: "Four problems in a small apartment, a servant juggling, and it ends in a chase.", set: { collide: 4, threads: 4, place: "a small apartment", doors: 8, juggler: "a servant", blowUp: "it ends in a chase" } },
        { label: "Wedding that holds", plain: "Three problems at a wedding, everyone takes turns, and somehow it holds.", set: { collide: 2, threads: 3, place: "a wedding", doors: 3, juggler: "everyone takes turns", blowUp: "it holds" } },
      ],
    },
  });

  W.add("copycat", {
    window: {
      faces: [
        { face: "dial", slider: "copy" },
        { face: "tiles", slider: "what", icons: { "the way they walk": "🚶", "the way they talk": "🗣️", "their clothes": "👕", "their order or taste": "☕", "their laugh": "😂", "their every move": "🪞" } },
        { face: "pad", x: "late", y: "accuracy", xLabel: "How far behind", yLabel: "How well they copy" },
      ],
      groups: [
        { label: "The copying", sliders: ["copy", "what", "why"] },
        { label: "How it looks", sliders: ["late", "accuracy"] },
        { label: "The other one", sliders: ["noticed"] },
      ],
      presets: [
        { label: "Lunch line shadow", plain: "Every move copied half a beat late to fit in, until the cool kid gets annoyed.", set: { copy: 5, what: "their every move", why: "to fit in", late: "half a beat late", accuracy: "roughly", noticed: "they get annoyed" } },
        { label: "Same coffee order", plain: "Ordering the same coffee to impress, the next day, very badly.", set: { copy: 2, what: "their order or taste", why: "to impress", late: "the next day", accuracy: "very badly", noticed: "never" } },
        { label: "Mirror match", plain: "One copies the other's walk to mock them, and they start copying back.", set: { copy: 4, what: "the way they walk", why: "to mock", late: "at the same time", accuracy: "perfectly", noticed: "they start copying back" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
