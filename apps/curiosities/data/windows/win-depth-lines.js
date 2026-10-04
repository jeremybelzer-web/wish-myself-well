/* win for the lines-and-delivery curiosities in data/db-depth-lines.js (depth thread, lines). Each one already has
   six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- who the line is for ---------- */

  W.add("meantForAnother", {
    window: {
      faces: [
        { face: "dial", slider: "aim" },
        { face: "tiles", slider: "through", icons: { "a child": "🧒", "a friend": "🧑", "a stranger": "🕴️", "a pet": "🐕", "a waiter": "🍽️", "nobody, just out loud": "💬" } },
        { face: "ladder", slider: "reacts" },
      ],
      groups: [
        { label: "The aim", sliders: ["aim", "realTarget", "glances"] },
        { label: "The go-between", sliders: ["through", "middle"] },
        { label: "The answer", sliders: ["reacts"] },
      ],
      presets: [
        { label: "Through the kids", plain: "Mom tells her son how nice it is when people call home, looking at her daughter the whole time.", set: { aim: 4, realTarget: "a parent", through: "a child", reacts: "goes stiff", glances: 3, middle: "has no idea" } },
        { label: "Talking to the dog", plain: "He tells the dog someone forgot to buy milk again, and she answers the dog right back.", set: { aim: 5, realTarget: "a partner", through: "a pet", reacts: "answers back the same way", glances: 1, middle: "has no idea" } },
        { label: "The office toast", plain: "A toast to people who keep their promises, raised toward the boss.", set: { aim: 3, realTarget: "a boss", through: "nobody, just out loud", reacts: "pretends not to hear", glances: 2, middle: "catches on" } },
      ],
    },
  });

  W.add("questionBack", {
    window: {
      faces: [
        { face: "dial", slider: "dodge" },
        { face: "tiles", slider: "why", icons: { "to stall": "⏳", "to hide something": "🙈", "to turn the tables": "🔄", "to tease": "😏", "because the answer is obvious": "🙄" } },
        { face: "ladder", slider: "tone" },
      ],
      groups: [
        { label: "The dodge", sliders: ["dodge", "why", "rounds"] },
        { label: "How it sounds", sliders: ["tone", "asker"] },
        { label: "The answer", sliders: ["finally"] },
      ],
      presets: [
        { label: "The suspect", plain: "Asked where he was, he asks where the detective was, three times over.", set: { dodge: 5, why: "to turn the tables", rounds: 3, tone: "hostile", asker: "snaps", finally: "never" } },
        { label: "Flirting", plain: "'Do you like me?' 'Do you want me to?' and a smile for an answer.", set: { dodge: 3, why: "to tease", rounds: 2, tone: "playful", asker: "asks again", finally: "with a look" } },
        { label: "Is the sky blue?", plain: "'Are you coming?' 'Have I ever missed one?'", set: { dodge: 1, why: "because the answer is obvious", rounds: 1, tone: "gentle", asker: "gives up", finally: "right there" } },
      ],
    },
  });

  W.add("wordCountClash", {
    window: {
      faces: [
        { face: "dial", slider: "gap" },
        { face: "ladder", slider: "quiet" },
        { face: "tiles", slider: "power", icons: { "the talker": "🗣️", "the quiet one": "🤐", "it shifts": "🔄" } },
      ],
      groups: [
        { label: "The gap", sliders: ["gap", "talker", "longest"] },
        { label: "The quiet one", sliders: ["quiet", "power"] },
        { label: "The swap", sliders: ["flips"] },
      ],
      presets: [
        { label: "The salesman", plain: "He talks for a full minute; the customer says 'No.'", set: { gap: 5, talker: "the one who wants something", quiet: "one word", longest: 60, flips: "never", power: "the quiet one" } },
        { label: "Nervous date", plain: "She fills every silence; he gives a few words, then opens up at the end.", set: { gap: 3, talker: "the nervous one", quiet: "a few words", longest: 25, flips: "once, at the turn", power: "it shifts" } },
        { label: "The boss", plain: "The boss lectures, the worker only nods.", set: { gap: 4, talker: "the one in charge", quiet: "just a sound", longest: 90, flips: "never", power: "the talker" } },
      ],
    },
  });

  W.add("takenBackWord", {
    window: {
      faces: [
        { face: "ladder", slider: "caught" },
        { face: "tiles", slider: "word", icons: { "a feeling": "❤️", "a name": "🏷️", "a secret": "🤫", "an insult": "💢", "a promise": "🤝" } },
        { face: "dial", slider: "stall" },
      ],
      groups: [
        { label: "The slip", sliders: ["caught", "word", "swap"] },
        { label: "After it", sliders: ["heard", "stall"] },
        { label: "Across the film", sliders: ["times"] },
      ],
      presets: [
        { label: "I lo... like you", plain: "He gets half of 'love' out, turns it into 'like', and she raises an eyebrow.", set: { caught: "half the word", word: "a feeling", swap: "a safer word", heard: "yes, and lets it go", stall: 1.5, times: 3 } },
        { label: "The wrong name", plain: "She almost says her ex's name, coughs, and nobody notices.", set: { caught: "the first sound", word: "a name", swap: "a cough", heard: "no", stall: 0.5, times: 1 } },
        { label: "Almost a confession", plain: "He says the whole word, takes it back, and his sister calls him on it.", set: { caught: "all of it, then fixed", word: "a secret", swap: "a new topic", heard: "yes, and calls it out", stall: 2.5, times: 2 } },
      ],
    },
  });

  W.add("wayOfTalking", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "tiles", slider: "marker", icons: { "an accent": "🗺️", "a pet word or phrase": "🔁", "formal speech": "🎩", slang: "🧢", "fancy words": "📚", "plain short words": "🔨" } },
        { face: "ladder", slider: "shifts" },
      ],
      groups: [
        { label: "The voice", sliders: ["strength", "marker", "against"] },
        { label: "When it moves", sliders: ["shifts", "slips"] },
        { label: "The others", sliders: ["others"] },
      ],
      presets: [
        { label: "Back home", plain: "The polished lawyer's small-town accent comes back the moment her brother calls.", set: { strength: 4, marker: "an accent", against: "stands out", shifts: "a lot", slips: "when back home", others: "don't notice" } },
        { label: "The professor", plain: "Fancy words to everyone, the bus driver included, and the class copies him.", set: { strength: 3, marker: "fancy words", against: "nobody else talks like that", shifts: "never", slips: "never", others: "copy them" } },
        { label: "One word", plain: "He ends every sentence with 'right?', and it gets worse when he's tired.", set: { strength: 2, marker: "a pet word or phrase", against: "a little different", shifts: "a little", slips: "when tired or drunk", others: "tease them" } },
      ],
    },
  });

  W.add("lastWordFight", {
    window: {
      faces: [
        { face: "dial", slider: "fight" },
        { face: "tiles", slider: "form", icons: { "a word": "💬", "a full line": "🗯️", "a sound": "😤", "a look": "👀", "a slammed door": "🚪" } },
        { face: "ladder", slider: "sizes" },
      ],
      groups: [
        { label: "The fight", sliders: ["fight", "rounds", "sizes"] },
        { label: "The last word", sliders: ["who", "form"] },
        { label: "After it", sliders: ["after"] },
      ],
      presets: [
        { label: "Fine. Fine. Good.", plain: "The couple trade single words until the kid at the table says 'Okay.'", set: { fight: 4, rounds: 6, who: "a third person", form: "a word", sizes: "get smaller", after: 3 } },
        { label: "The slammed door", plain: "Each line louder, and the door has the last word.", set: { fight: 5, rounds: 4, who: "nobody, a door slams", form: "a slammed door", sizes: "get bigger", after: 8 } },
        { label: "The look", plain: "She lets him think he won, then gives him one look on the way out.", set: { fight: 2, rounds: 2, who: "the one leaving", form: "a look", sizes: "stay the same", after: 4 } },
      ],
    },
  });

  W.add("whisperInNoise", {
    window: {
      faces: [
        { face: "dial", slider: "loud" },
        { face: "tiles", slider: "room", icons: { "a party": "🎉", "a club": "🪩", "a train": "🚆", "a stadium": "🏟️", "a busy kitchen": "🍳" } },
        { face: "ladder", slider: "closeness" },
      ],
      groups: [
        { label: "The noise", sliders: ["loud", "room", "drop"] },
        { label: "The two of them", sliders: ["closeness", "what"] },
        { label: "What we hear", sliders: ["heard"] },
      ],
      presets: [
        { label: "At the wedding", plain: "Band at full blast, the bride leans to her sister's ear, and the room falls away.", set: { loud: 5, closeness: "mouth to ear", room: "a party", heard: "clearly", drop: "almost all the way", what: "a confession" } },
        { label: "The tip-off", plain: "On a loud train, a stranger leans over and warns him, and we catch only a few words.", set: { loud: 4, closeness: "side by side", room: "a train", heard: "a few words", drop: "a little", what: "a warning" } },
        { label: "Kitchen joke", plain: "In the roaring kitchen two cooks share a joke we never hear.", set: { loud: 3, closeness: "across the table", room: "a busy kitchen", heard: "not at all", drop: "no", what: "a joke" } },
      ],
    },
  });

  W.add("dodgedQuestion", {
    window: {
      faces: [
        { face: "ladder", slider: "smooth" },
        { face: "tiles", slider: "tool", icons: { "a joke": "😄", "a compliment": "🌹", "a new topic": "🔀", "an offer of food or drink": "☕", "an attack": "⚔️" } },
        { face: "dial", slider: "tries" },
      ],
      groups: [
        { label: "The dodge", sliders: ["smooth", "tool"] },
        { label: "The question", sliders: ["tries", "asker"] },
        { label: "What is behind it", sliders: ["hiding", "knows"] },
      ],
      presets: [
        { label: "More coffee?", plain: "Every time she asks about the money, he offers more coffee.", set: { smooth: "obvious", tool: "an offer of food or drink", tries: 4, asker: "pins them down", hiding: "a mistake", knows: "guesses" } },
        { label: "The charmer", plain: "Asked where she was, she compliments his tie and he forgets the question.", set: { smooth: "we barely notice", tool: "a compliment", tries: 1, asker: "lets it go", hiding: "a crime", knows: "knows" } },
        { label: "The joker", plain: "Each question about his health gets a joke until his friend calls it out.", set: { smooth: "clumsy", tool: "a joke", tries: 3, asker: "calls it out", hiding: "a feeling", knows: "no" } },
      ],
    },
  });

  W.add("sayingTheName", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "tiles", slider: "form", icons: { "a nickname": "🐣", "the first name": "🙂", "the full name": "📛", "a title like 'sir' or 'mom'": "🎖️", "their last name": "🏷️" } },
        { face: "ladder", slider: "voice" },
      ],
      groups: [
        { label: "The name", sliders: ["weight", "form", "first"] },
        { label: "How it is said", sliders: ["where", "voice"] },
        { label: "The answer", sliders: ["answer"] },
      ],
      presets: [
        { label: "Sam, not Miller", plain: "The boss who always says 'Miller' says 'Sam' once, softly, at the hospital.", set: { weight: 5, form: "the first name", where: "alone, as the whole line", first: "first time ever", voice: "soft", answer: "turns around" } },
        { label: "Full name trouble", plain: "'James Robert Carter!' from the kitchen, and the boy stops dead.", set: { weight: 4, form: "the full name", where: "alone, as the whole line", first: "rarely", voice: "shouted", answer: "stops" } },
        { label: "Old nickname", plain: "She calls him by his childhood nickname at the end of a line, and he says hers back.", set: { weight: 3, form: "a nickname", where: "at the end", first: "rarely", voice: "plain", answer: "says theirs back" } },
      ],
    },
  });

  W.add("languageSwitch", {
    window: {
      faces: [
        { face: "dial", slider: "switch" },
        { face: "tiles", slider: "why", icons: { "to keep a secret": "🤫", "to swear": "🤬", "to say something tender": "💗", "to show where they are from": "🏠", "by accident when upset": "😣" } },
        { face: "ladder", slider: "subtitles" },
      ],
      groups: [
        { label: "The switch", sliders: ["switch", "why", "back"] },
        { label: "Who follows", sliders: ["leftOut", "understood"] },
        { label: "For us", sliders: ["subtitles"] },
      ],
      presets: [
        { label: "Grandma's warning", plain: "She warns her grandson in her first language, and the guest answers her in it.", set: { switch: 3, why: "to keep a secret", leftOut: "one person", subtitles: "all of it", back: "after a line", understood: "right away" } },
        { label: "Under his breath", plain: "He swears in his first language, and nobody gets subtitles.", set: { switch: 1, why: "to swear", leftOut: "most of the room", subtitles: "none", back: "right away", understood: "no" } },
        { label: "The tender word", plain: "She drops into her first language to say goodnight to her son, and stays there.", set: { switch: 4, why: "to say something tender", leftOut: "no one", subtitles: "only some", back: "stays switched", understood: "no" } },
      ],
    },
  });

  W.add("finishSentence", {
    window: {
      faces: [
        { face: "dial", slider: "sync" },
        { face: "ladder", slider: "right" },
        { face: "tiles", slider: "who", icons: { "one always": "👉", "they take turns": "🔁", "both say it at once": "👯" } },
      ],
      groups: [
        { label: "In step", sliders: ["sync", "who", "times"] },
        { label: "The ending", sliders: ["right", "starter"] },
        { label: "The room", sliders: ["watchers"] },
      ],
      presets: [
        { label: "Forty years", plain: "The old couple finish each other's lines all evening and the guests roll their eyes.", set: { sync: 5, who: "they take turns", right: "exactly", times: 6, starter: "pleased", watchers: "rolls their eyes" } },
        { label: "The crack", plain: "He finishes her line wrong, and she goes quiet.", set: { sync: 2, who: "one always", right: "wrong", times: 2, starter: "annoyed", watchers: "no one" } },
        { label: "The twins", plain: "They say the punchline together and the new friend feels left out.", set: { sync: 4, who: "both say it at once", right: "exactly", times: 3, starter: "surprised", watchers: "feels left out" } },
      ],
    },
  });

  W.add("rehearsedLine", {
    window: {
      faces: [
        { face: "dial", slider: "gap" },
        { face: "tiles", slider: "where", icons: { "in the mirror": "🪞", "in the car": "🚗", "to a pet": "🐈", "in their head": "💭", "to a friend": "🧑" } },
        { face: "ladder", slider: "real" },
      ],
      groups: [
        { label: "The practice", sliders: ["where", "runs", "shown"] },
        { label: "The real moment", sliders: ["gap", "real"] },
        { label: "The other person", sliders: ["other"] },
      ],
      presets: [
        { label: "Beaten to it", plain: "She practices the breakup in the car three times; he breaks up with her first.", set: { gap: 5, where: "in the car", runs: 3, real: "never says it", other: "says it first", shown: "shown before" } },
        { label: "The proposal", plain: "He rehearses to the cat, then blurts something else entirely.", set: { gap: 4, where: "to a pet", runs: 2, real: "blurts something else", other: "lets them finish", shown: "cut together with the real moment" } },
        { label: "Word for word", plain: "She practices in the mirror and says it perfectly, and he does not care.", set: { gap: 1, where: "in the mirror", runs: 1, real: "word for word", other: "does not care", shown: "shown before" } },
      ],
    },
  });

  W.add("readAloud", {
    window: {
      faces: [
        { face: "dial", slider: "hold" },
        { face: "tiles", slider: "what", icons: { "a letter": "✉️", "a diary": "📔", "a will": "📜", "a text message": "📱", "a speech on paper": "📄" } },
        { face: "ladder", slider: "breaks" },
      ],
      groups: [
        { label: "The words", sliders: ["hold", "what", "voice"] },
        { label: "The reader", sliders: ["reader", "breaks"] },
        { label: "The picture", sliders: ["shown"] },
      ],
      presets: [
        { label: "Dad's letter", plain: "The son reads his father's letter, the father's voice takes over, and the son has to stop.", set: { hold: 5, what: "a letter", voice: "the reader, then the writer", reader: "the one it was written to", breaks: "has to stop", shown: "the writer, back then" } },
        { label: "The will", plain: "A lawyer reads the will flat while we watch the family's faces.", set: { hold: 4, what: "a will", voice: "the reader", reader: "a stranger", breaks: "reads it flat", shown: "the one it is about" } },
        { label: "The diary", plain: "Her sister reads her diary aloud to tease her and cannot go on.", set: { hold: 3, what: "a diary", voice: "the reader", reader: "someone else", breaks: "cannot go on", shown: "the page" } },
      ],
    },
  });

  /* ---------- what the body does with the line ---------- */

  W.add("sideBySideTalk", {
    window: {
      faces: [
        { face: "dial", slider: "sideBy" },
        { face: "tiles", slider: "where", icons: { "in a car": "🚗", "on a bench": "🪑", "at a sink": "🚰", "on a roof": "🏠", "at a bar": "🍺" } },
        { face: "ladder", slider: "turn" },
      ],
      groups: [
        { label: "Side by side", sliders: ["sideBy", "where", "doing"] },
        { label: "Looking", sliders: ["glances", "turn"] },
        { label: "The camera", sliders: ["shot"] },
      ],
      presets: [
        { label: "Red light", plain: "Father and daughter in the car at night; she says it at a red light and he turns.", set: { sideBy: 5, where: "in a car", doing: "driving", glances: 2, turn: "once, on the key line", shot: "both from the front" } },
        { label: "The dishes", plain: "Two brothers at the sink, washing and drying, never looking up.", set: { sideBy: 4, where: "at a sink", doing: "a chore", glances: 0, turn: "never", shot: "from behind" } },
        { label: "The view", plain: "Old friends on a roof, watching the city, both turning at the end.", set: { sideBy: 3, where: "on a roof", doing: "watching a view", glances: 4, turn: "both turn at the end", shot: "one at a time from the side" } },
      ],
    },
  });

  W.add("bodySaysOpposite", {
    window: {
      faces: [
        { face: "dial", slider: "clash" },
        { face: "tiles", slider: "part", icons: { "the head": "🙂", "the hands": "✋", "the feet": "🦶", "the shoulders": "🤷", "the whole body": "🧍" } },
        { face: "ladder", slider: "caught" },
      ],
      groups: [
        { label: "The clash", sliders: ["clash", "words", "part"] },
        { label: "Who knows", sliders: ["aware", "caught"] },
        { label: "The camera", sliders: ["camera"] },
      ],
      presets: [
        { label: "The tapping foot", plain: "'I'm fine', she says, while her foot taps faster and faster under the table.", set: { clash: 4, part: "the feet", words: "I'm fine", aware: "no idea", caught: "only us", camera: "cuts down to it" } },
        { label: "Yes, shaking her head", plain: "She says yes to the job while her head gives a tiny shake, and he sees it.", set: { clash: 3, part: "the head", words: "yes", aware: "half aware", caught: "the other person", camera: "holds on the face only" } },
        { label: "Not scared", plain: "'I'm not scared', with the whole body backing toward the door.", set: { clash: 5, part: "the whole body", words: "I'm not scared", aware: "no idea", caught: "everyone", camera: "wide on the whole body" } },
      ],
    },
  });

  W.add("throughTheDoor", {
    window: {
      faces: [
        { face: "ladder", slider: "barrier" },
        { face: "tiles", slider: "touch", icons: { none: "▫️", "a hand on it": "✋", "a forehead on it": "🙇", "both sides touching": "🤝" } },
        { face: "ladder", slider: "opens" },
      ],
      groups: [
        { label: "Between them", sliders: ["barrier", "inside"] },
        { label: "Their bodies", sliders: ["touch", "sink"] },
        { label: "Opening", sliders: ["opens", "shot"] },
      ],
      presets: [
        { label: "The bathroom door", plain: "Mom sits against the locked bathroom door, hand flat on it, until it opens a crack.", set: { barrier: "a locked door", inside: "the hurt one", touch: "a hand on it", sink: "sliding down", opens: "just a crack", shot: "both sides in turn" } },
        { label: "Back to back", plain: "Two sisters sit back to back on either side of a door, both hands on it.", set: { barrier: "a locked door", inside: "the angry one", touch: "both sides touching", sink: "both sitting, back to back", opens: "at the end", shot: "both in one frame" } },
        { label: "Through the glass", plain: "A visitor and a prisoner talk through the window, foreheads almost touching it.", set: { barrier: "a window", inside: "the scared one", touch: "a forehead on it", sink: "leaning", opens: "never", shot: "one side" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
