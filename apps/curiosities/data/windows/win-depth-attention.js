/* win for the attention and momentum curiosities in data/db-depth-attention.js (depth thread, attention). Each one
   already has six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- where the eye goes ---------- */

  W.add("eyeTrace", {
    window: {
      faces: [
        { face: "dial", slider: "match" },
        { face: "tiles", slider: "leadBy", icons: { nothing: "▫️", "a movement": "🏃", "a look": "👀", "a bright spot": "💡", "a pointing hand": "👉" } },
        { face: "ladder", slider: "jump" },
      ],
      groups: [
        { label: "The match", sliders: ["match", "where", "jump"] },
        { label: "Guiding the eye", sliders: ["leadBy", "findTime"] },
        { label: "Breaking it on purpose", sliders: ["breaks"] },
      ],
      presets: [
        { label: "Smooth chase", plain: "The runner stays on the right third from shot to shot, so the eye never has to search.", set: { match: 5, where: "the right third", leadBy: "a movement", jump: "no jump", findTime: 0.1, breaks: "never" } },
        { label: "The jolt", plain: "A calm match all scene, broken with a jolt at the scary moment.", set: { match: 3, where: "the center", leadBy: "a look", jump: "a deliberate jolt", findTime: 0.8, breaks: "at the scary moment" } },
        { label: "Chaos fight", plain: "Every cut in the fight throws the eye across the frame.", set: { match: 1, where: "the left third", leadBy: "nothing", jump: "across the frame", findTime: 1.2, breaks: "at every cut in the fight" } },
      ],
    },
  });

  W.add("allEyesTurn", {
    window: {
      faces: [
        { face: "dial", slider: "turn" },
        { face: "tiles", slider: "at", icons: { "a door": "🚪", "a sound off screen": "🔊", "one person": "🧍", "the sky": "🌌", "the camera": "🎥" } },
        { face: "ladder", slider: "shown" },
      ],
      groups: [
        { label: "The turn", sliders: ["turn", "count", "timing"] },
        { label: "What they see", sliders: ["at", "shown"] },
        { label: "The one who doesn't", sliders: ["holdout"] },
      ],
      presets: [
        { label: "Diner door", plain: "Every head in the diner snaps to the door, and we wait a beat to see who it is.", set: { turn: 5, count: 14, timing: "in one sudden snap", at: "a door", shown: "after a beat", holdout: "everyone looks" } },
        { label: "Something in the sky", plain: "A crowd turns one by one to the sky, and we wait a long time to see why.", set: { turn: 4, count: 50, timing: "slowly, one by one", at: "the sky", shown: "after a long wait", holdout: "one person keeps eating" } },
        { label: "The stranger stands up", plain: "A few people turn to one person, and one looks away.", set: { turn: 2, count: 5, timing: "all together", at: "one person", shown: "right away", holdout: "one person looks away" } },
      ],
    },
  });

  W.add("oddDetail", {
    window: {
      faces: [
        { face: "dial", slider: "odd" },
        { face: "tiles", slider: "kind", icons: { "a stain": "🩸", "something missing": "⬜", "a wrong time on a clock": "🕰️", "a stranger in the back": "🕴️", "an object out of place": "🥾", "a wound": "🩹" } },
        { face: "ladder", slider: "noticed" },
      ],
      groups: [
        { label: "The detail", sliders: ["odd", "kind", "size"] },
        { label: "Who sees it", sliders: ["noticed", "shownTimes"] },
        { label: "The answer", sliders: ["explained"] },
      ],
      presets: [
        { label: "Muddy boot print", plain: "One muddy print on a white carpet, only we see it, explained at the end.", set: { odd: 3, kind: "an object out of place", size: "small", noticed: "only us", explained: "at the end", shownTimes: 3 } },
        { label: "The stopped clock", plain: "Every clock in the house shows the wrong time and nobody notices.", set: { odd: 4, kind: "a wrong time on a clock", size: "tiny", noticed: "nobody", explained: "later", shownTimes: 4 } },
        { label: "The face in the crowd", plain: "The same stranger in the back of every crowd, and one character finally sees him.", set: { odd: 5, kind: "a stranger in the back", size: "easy to see", noticed: "one character", explained: "never", shownTimes: 5 } },
      ],
    },
  });

  /* ---------- the shape of attention across the film ---------- */

  W.add("surpriseSpacing", {
    window: {
      faces: [
        { face: "dial", slider: "surprise" },
        { face: "tiles", slider: "pattern", icons: { "steady, like a clock": "⏱️", "speeding up": "⏩", "slowing down": "🐢", "bunched together": "🧺", "at random": "🎲" } },
        { face: "pad", x: "gap", y: "growth", xLabel: "Time between surprises", yLabel: "How they grow" },
      ],
      groups: [
        { label: "How many", sliders: ["surprise", "gap", "pattern"] },
        { label: "How big", sliders: ["growth", "lastOne"] },
        { label: "Fair play", sliders: ["fair"] },
      ],
      presets: [
        { label: "Thriller climb", plain: "Gaps get shorter and each surprise is bigger, saving the biggest for last.", set: { surprise: 4, gap: 10, pattern: "speeding up", growth: "each bigger than the last", lastOne: "the biggest of all", fair: "a hint or two" } },
        { label: "Slow mystery", plain: "Few, steady surprises, all set up so we could have guessed.", set: { surprise: 2, gap: 25, pattern: "steady, like a clock", growth: "all the same size", lastOne: "medium", fair: "fully set up, we could have guessed" } },
        { label: "Rollercoaster", plain: "Surprises bunched together, coming out of nowhere.", set: { surprise: 5, gap: 3, pattern: "bunched together", growth: "all the same size", lastOne: "small", fair: "out of nowhere" } },
      ],
    },
  });

  W.add("openingPromise", {
    window: {
      faces: [
        { face: "dial", slider: "promise" },
        { face: "tiles", slider: "kind", icons: { laughs: "😂", fear: "😱", "a mystery": "🔍", romance: "💞", action: "💥", tears: "😢" } },
        { face: "ladder", slider: "kept" },
      ],
      groups: [
        { label: "The promise", sliders: ["promise", "kind", "how"] },
        { label: "How long", sliders: ["minutes", "reminders"] },
        { label: "Kept or broken", sliders: ["kept"] },
      ],
      presets: [
        { label: "Horror cold open", plain: "A short scene before the titles promises fear in two minutes, and the film tops it.", set: { promise: 5, kind: "fear", how: "a short scene before the titles", minutes: 2, reminders: 4, kept: "kept and topped" } },
        { label: "Narrated mystery", plain: "A voice tells us someone will be dead by Sunday, and the film keeps the promise.", set: { promise: 4, kind: "a mystery", how: "a voice telling us", minutes: 3, reminders: 3, kept: "kept" } },
        { label: "The bait and switch", plain: "A romantic opening that the film bends into something else.", set: { promise: 3, kind: "romance", how: "the music", minutes: 8, reminders: 1, kept: "bent" } },
      ],
    },
  });

  W.add("lullStretch", {
    window: {
      faces: [
        { face: "dial", slider: "lull" },
        { face: "tiles", slider: "fix", icons: { "left as it is": "🛋️", "add a clock": "⏰", "open a question": "❓", "cut it shorter": "✂️", "add a surprise": "🎁" } },
        { face: "ladder", slider: "planned" },
      ],
      groups: [
        { label: "The flat stretch", sliders: ["lull", "minutes", "where"] },
        { label: "Why and how to fix it", sliders: ["why", "fix"] },
        { label: "On purpose or not", sliders: ["planned"] },
      ],
      presets: [
        { label: "Saggy middle", plain: "Five minutes of talk in the middle, fixed by opening a question.", set: { lull: 4, minutes: 5, where: "the middle", why: "too much talk", fix: "open a question", planned: "an accident" } },
        { label: "Breather before the end", plain: "A short planned rest just before the end, left as it is.", set: { lull: 1, minutes: 2, where: "just before the end", why: "no goal", fix: "left as it is", planned: "on purpose, a rest" } },
        { label: "Waiting for the plan", plain: "The team waits around for the plan, so a clock is added.", set: { lull: 3, minutes: 3.5, where: "the early middle", why: "waiting for a plan", fix: "add a clock", planned: "half planned" } },
      ],
    },
  });

  W.add("cutAwayAtPeak", {
    window: {
      faces: [
        { face: "dial", slider: "peak" },
        { face: "ladder", slider: "leaves" },
        { face: "pad", x: "away", y: "threads", xLabel: "How long we stay away", yLabel: "Stories at once" },
      ],
      groups: [
        { label: "Leaving", sliders: ["peak", "leaves", "threads"] },
        { label: "Away", sliders: ["away", "other"] },
        { label: "Coming back", sliders: ["back"] },
      ],
      presets: [
        { label: "Hanging from the ledge", plain: "Leave one second before the answer, go to something calm, come back where we left.", set: { peak: 5, threads: 2, leaves: "one second before the answer", away: 3, other: "something calm", back: "where we left" } },
        { label: "Four-story finale", plain: "Four stories all at their peaks, each cut to something even more tense.", set: { peak: 4, threads: 4, leaves: "at the peak", away: 1, other: "something even more tense", back: "where we left" } },
        { label: "Already over", plain: "Leave as trouble starts and come back after it is settled.", set: { peak: 2, threads: 2, leaves: "as trouble starts", away: 8, other: "something as tense", back: "after it's over" } },
      ],
    },
  });

  /* ---------- questions the audience holds ---------- */

  W.add("almostAnswer", {
    window: {
      faces: [
        { face: "dial", slider: "almost" },
        { face: "tiles", slider: "stoppedBy", icons: { "someone walks in": "🚪", "a phone rings": "📞", "they change their mind": "🤐", "they faint or die": "💀", "the scene cuts away": "✂️" } },
        { face: "ladder", slider: "given" },
      ],
      groups: [
        { label: "The near answer", sliders: ["almost", "what", "stoppedBy"] },
        { label: "How often", sliders: ["times"] },
        { label: "The real answer", sliders: ["given", "worth"] },
      ],
      presets: [
        { label: "The dying word", plain: "One word away from the killer's name, and they die. We learn it at the very end.", set: { almost: 5, what: "who did it", stoppedBy: "they faint or die", times: 1, given: "at the very end", worth: "bigger than we hoped" } },
        { label: "Not now", plain: "Three times she almost says how she feels, and someone walks in each time.", set: { almost: 4, what: "how they feel", stoppedBy: "someone walks in", times: 3, given: "much later", worth: "as big as we hoped" } },
        { label: "Saved by the bell", plain: "A phone rings just as he starts to say where it is, and we never find out.", set: { almost: 3, what: "where it is", stoppedBy: "a phone rings", times: 2, given: "never", worth: "a letdown" } },
      ],
    },
  });

  W.add("lockedBox", {
    window: {
      faces: [
        { face: "dial", slider: "pull" },
        { face: "tiles", slider: "thing", icons: { "a box": "📦", "a letter": "✉️", "a locked door": "🚪", "a briefcase": "💼", "a phone": "📱", "a bag": "👜" } },
        { face: "ladder", slider: "opened" },
      ],
      groups: [
        { label: "The closed thing", sliders: ["pull", "thing", "guarded"] },
        { label: "Almost looking", sliders: ["glimpses"] },
        { label: "Opening it", sliders: ["opened", "inside"] },
      ],
      presets: [
        { label: "The briefcase", plain: "A locked briefcase in every scene, opened at the end with something we never guessed.", set: { pull: 5, thing: "a briefcase", glimpses: 2, guarded: "locked", opened: "at the end", inside: "something we never guessed" } },
        { label: "The unread letter", plain: "A letter on the table, opened halfway, holding what we guessed.", set: { pull: 3, thing: "a letter", glimpses: 1, guarded: "just lying there", opened: "halfway", inside: "what we guessed" } },
        { label: "The door upstairs", plain: "A guarded door that is never opened.", set: { pull: 4, thing: "a locked door", glimpses: 4, guarded: "guarded by someone", opened: "never", inside: "we never see inside" } },
      ],
    },
  });

  W.add("questionRelay", {
    window: {
      faces: [
        { face: "dial", slider: "relay" },
        { face: "ladder", slider: "bigger" },
        { face: "tiles", slider: "kind", icons: { who: "🕵️", why: "❔", "what happens next": "⏭️", "what is real": "🌀", "whose side they are on": "⚖️" } },
      ],
      groups: [
        { label: "The chain", sliders: ["relay", "links", "soon"] },
        { label: "The new question", sliders: ["bigger", "kind"] },
        { label: "The end of the chain", sliders: ["ends"] },
      ],
      presets: [
        { label: "Down the rabbit hole", plain: "Every answer opens a much bigger question right away, and the biggest is left open.", set: { relay: 5, bigger: "much bigger", soon: "right away", links: 8, kind: "what is real", ends: "the biggest left open" } },
        { label: "Whodunit chain", plain: "Each who leads to a why, and everything is answered at the end.", set: { relay: 3, bigger: "bigger", soon: "within the scene", links: 4, kind: "why", ends: "all answered" } },
        { label: "Season finale", plain: "A bigger question by the next scene, and one left open for next season.", set: { relay: 4, bigger: "bigger", soon: "by the next scene", links: 5, kind: "whose side they are on", ends: "one left open" } },
      ],
    },
  });

  W.add("redHerring", {
    window: {
      faces: [
        { face: "dial", slider: "mislead" },
        { face: "tiles", slider: "at", icons: { "a person": "🕴️", "an object": "🔪", "a place": "🏚️", "a time": "🕰️", "a reason": "💰" } },
        { face: "ladder", slider: "fair" },
      ],
      groups: [
        { label: "The false clue", sliders: ["mislead", "at", "planted"] },
        { label: "How many", sliders: ["count"] },
        { label: "When it falls apart", sliders: ["cleared", "fair"] },
      ],
      presets: [
        { label: "The shifty gardener", plain: "Everyone suspects the gardener until the very end, and it is fair.", set: { mislead: 5, at: "a person", planted: "the storyteller", count: 1, cleared: "at the very end", fair: "fair, and it means something" } },
        { label: "Framed", plain: "The real culprit plants a weapon, and it is cleared in the middle.", set: { mislead: 4, at: "an object", planted: "the real culprit", count: 2, cleared: "in the middle", fair: "just fair" } },
        { label: "Trail of crumbs", plain: "Many small false clues by chance, cleared quickly.", set: { mislead: 2, at: "a place", planted: "nobody, by chance", count: 5, cleared: "quickly", fair: "cheating" } },
      ],
    },
  });

  W.add("sceneGoalClear", {
    window: {
      faces: [
        { face: "dial", slider: "clear" },
        { face: "tiles", slider: "want", icons: { "to get something": "🔑", "to get away": "🏃", "to learn something": "🔍", "to win someone over": "💐", "to hide something": "🙈" } },
        { face: "ladder", slider: "when" },
      ],
      groups: [
        { label: "The goal", sliders: ["clear", "want", "toldBy", "when"] },
        { label: "The obstacle", sliders: ["blocked"] },
        { label: "The result", sliders: ["got"] },
      ],
      presets: [
        { label: "Car keys at dinner", plain: "She says in the first moment that she needs the keys, and time runs out.", set: { clear: 5, want: "to get something", toldBy: "they say it", when: "the first moment", blocked: "time runs out", got: "yes, but at a cost" } },
        { label: "Quiet escape", plain: "We see he wants to get away, early on, and someone says no.", set: { clear: 4, want: "to get away", toldBy: "we see it", when: "early on", blocked: "someone says no", got: "no" } },
        { label: "What is she after", plain: "We have to guess what she wants, and only learn it at the end.", set: { clear: 1, want: "to hide something", toldBy: "we have to guess", when: "at the end", blocked: "nothing", got: "partly" } },
      ],
    },
  });

  W.add("ruleSetEarly", {
    window: {
      faces: [
        { face: "dial", slider: "rule" },
        { face: "ladder", slider: "told" },
        { face: "ladder", slider: "price" },
      ],
      groups: [
        { label: "The rule", sliders: ["rule", "kind", "told"] },
        { label: "The wait", sliders: ["gap"] },
        { label: "Breaking it", sliders: ["broken", "price"] },
      ],
      presets: [
        { label: "Never after midnight", plain: "A danger shown with a price paid, broken by accident an hour later, costing a lot.", set: { rule: 5, kind: "a danger to avoid", told: "shown with a price paid", gap: 60, broken: "broken by accident", price: "a lot" } },
        { label: "The magic deal", plain: "A deal said out loud, broken on purpose at the end, costing everything.", set: { rule: 4, kind: "a deal made", told: "said out loud", gap: 85, broken: "broken on purpose", price: "everything" } },
        { label: "Kept to the end", plain: "A law of this world shown twice and kept, so the tension never breaks.", set: { rule: 3, kind: "a law of this world", told: "shown twice", gap: 30, broken: "kept", price: "nothing" } },
      ],
    },
  });

  W.add("voicedQuestion", {
    window: {
      faces: [
        { face: "dial", slider: "voiced" },
        { face: "tiles", slider: "who", icons: { "the hero": "🦸", "a friend": "🧑‍🤝‍🧑", "a child": "🧒", "the villain": "🦹", "a stranger": "🕴️" } },
        { face: "ladder", slider: "answered" },
      ],
      groups: [
        { label: "Asking it", sliders: ["voiced", "who", "how"] },
        { label: "How often", sliders: ["times", "lands"] },
        { label: "The answer", sliders: ["answered"] },
      ],
      presets: [
        { label: "The kid says it", plain: "A child asks straight out what everyone is thinking, and it is answered later.", set: { voiced: 5, who: "a child", how: "asked straight out", answered: "later", times: 1, lands: "funny" } },
        { label: "The whisper", plain: "A friend whispers the question twice, worried, and nobody ever answers.", set: { voiced: 4, who: "a friend", how: "whispered", answered: "never", times: 2, lands: "worried" } },
        { label: "The villain knows", plain: "The villain jokes about the question, and answers it right away.", set: { voiced: 3, who: "the villain", how: "joked about", answered: "right away", times: 1, lands: "serious" } },
      ],
    },
  });

  /* ---------- time and waiting ---------- */

  W.add("readTime", {
    window: {
      faces: [
        { face: "dial", slider: "read" },
        { face: "ladder", slider: "when" },
        { face: "pad", x: "seconds", y: "busy", xLabel: "How long the shot stays", yLabel: "How much to take in" },
      ],
      groups: [
        { label: "Taking it in", sliders: ["read", "busy", "seen"] },
        { label: "The cut", sliders: ["seconds", "when"] },
        { label: "The aim", sliders: ["aim"] },
      ],
      presets: [
        { label: "Just in time", plain: "A few things to see, cut just as we get it, to keep pace.", set: { read: 3, busy: "a few things", seconds: 2, when: "just as we get it", seen: "once", aim: "to keep pace" } },
        { label: "Too fast to read", plain: "A crowded frame cut too soon on purpose, to confuse.", set: { read: 0, busy: "a crowded frame", seconds: 0.5, when: "too soon, on purpose", seen: "never", aim: "to confuse" } },
        { label: "Let it sink in", plain: "One thing in the frame held long after, so it sinks in.", set: { read: 5, busy: "one thing", seconds: 7, when: "long after", seen: "many times", aim: "to let it sink in" } },
      ],
    },
  });

  W.add("longAwaited", {
    window: {
      faces: [
        { face: "dial", slider: "wait" },
        { face: "tiles", slider: "what", icons: { "two people meet": "🤝", "a kiss": "💋", "a fight": "🥊", "the truth comes out": "🗣️", "the hero comes back": "🦸", "the big game": "🏟️" } },
        { face: "ladder", slider: "sure" },
      ],
      groups: [
        { label: "The wait", sliders: ["wait", "what", "sure"] },
        { label: "Near misses", sliders: ["delays"] },
        { label: "When it comes", sliders: ["lands", "shown"] },
      ],
      presets: [
        { label: "Pen pals at the station", plain: "Two people meet after three near misses, better than hoped, slowed down.", set: { wait: 5, what: "two people meet", sure: "we guess it", delays: 3, lands: "better than hoped", shown: "slowed down" } },
        { label: "The rematch", plain: "Everyone talks about the fight, and it comes in full, as hoped.", set: { wait: 4, what: "a fight", sure: "the characters talk about it", delays: 2, lands: "as hoped", shown: "in full" } },
        { label: "The twist kiss", plain: "The kiss the film told us about comes quickly and is turned on its head.", set: { wait: 3, what: "a kiss", sure: "the film tells us", delays: 1, lands: "turned on its head", shown: "quickly" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
