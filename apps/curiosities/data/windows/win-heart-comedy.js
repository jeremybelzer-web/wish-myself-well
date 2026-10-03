/* win for the comedy curiosities in data/db-heart.js (database thread). Each one already has five or six graded
   settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  W.add("straightAnswer", {
    window: {
      faces: [
        { face: "ladder", slider: "seriousness" },
        { face: "pad", x: "silliness", y: "seriousness", xLabel: "How silly the question", yLabel: "How serious the answer" },
        { face: "tiles", slider: "asker", icons: { satisfied: "🙂", confused: "😕", annoyed: "😤", "pushes further": "👉" } },
      ],
      groups: [
        { label: "The question", sliders: ["silliness"] },
        { label: "The answer", sliders: ["seriousness", "detail", "beatBefore"] },
        { label: "The asker", sliders: ["asker"] },
      ],
      presets: [
        { label: "Airplane! deadpan", plain: "A silly question, a dead serious one-line answer, no pause at all.", set: { silliness: 5, seriousness: "dead serious", detail: "a sentence", beatBefore: 0, asker: "satisfied" } },
        { label: "Butler's lecture", plain: "The calm expert explains the absurd thing in full, and the asker gets lost.", set: { silliness: 4, seriousness: "painfully thorough", detail: "a lecture", beatBefore: 2, asker: "confused" } },
        { label: "Knowing sitcom reply", plain: "A small smirk, a short answer, and the asker keeps pushing.", set: { silliness: 2, seriousness: "a smirk", detail: "one word", asker: "pushes further", beatBefore: 1 } },
      ],
    },
  });

  W.add("catchphrase", {
    window: {
      faces: [
        { face: "dial", slider: "uses" },
        { face: "tiles", slider: "delivery", icons: { muttered: "🤫", "said plainly": "🗣️", shouted: "📢", sung: "🎵" } },
        { face: "ladder", slider: "setUp" },
      ],
      groups: [
        { label: "How often", sliders: ["uses", "spacing", "withheld"] },
        { label: "The line itself", sliders: ["delivery", "twist"] },
        { label: "The lead-in", sliders: ["setUp"] },
      ],
      presets: [
        { label: "Sitcom signature line", plain: "Said a lot, shouted, and everyone waits for it.", set: { uses: 8, spacing: 2, setUp: "everyone waits for it", delivery: "shouted", twist: "exact same" } },
        { label: "Held back, then paid off", plain: "The line is held back twice, then comes back with a new meaning at the end.", set: { uses: 4, withheld: 2, spacing: 8, twist: "new meaning", setUp: "a clear lead-in" } },
        { label: "Passed to another character", plain: "Someone else finally says it, quietly, for a warm laugh.", set: { twist: "said by someone else", delivery: "muttered", uses: 5, setUp: "a hint" } },
      ],
    },
  });

  W.add("sceneButton", {
    window: {
      faces: [
        { face: "ladder", slider: "size" },
        { face: "tiles", slider: "form", icons: { "a line": "💬", "a look": "👀", "an action": "🤸", "a sound": "🔔", "a cut": "✂️" } },
        { face: "mixer", sliders: ["length", "cutAfter"] },
      ],
      groups: [
        { label: "The last laugh", sliders: ["size", "form"] },
        { label: "Who gets it", sliders: ["who"] },
        { label: "Timing", sliders: ["length", "cutAfter"] },
      ],
      presets: [
        { label: "Sitcom act-out", plain: "The lead gets one more line, the biggest laugh, and we cut right away.", set: { size: "the biggest laugh of the scene", form: "a line", who: "the lead", cutAfter: 0, length: 1 } },
        { label: "Silent look to camera", plain: "A small look from a side character, held a beat before the cut.", set: { form: "a look", who: "the side character", size: "a small laugh", cutAfter: 2, length: 2 } },
        { label: "Prop gets the last word", plain: "An object falls or breaks after everyone leaves.", set: { who: "an object", form: "a sound", size: "a solid laugh", length: 1.5, cutAfter: 1 } },
      ],
    },
  });

  W.add("comicWant", {
    window: {
      faces: [
        { face: "pad", x: "effortGap", y: "obstacles", xLabel: "Effort past the want", yLabel: "Things in the way" },
        { face: "tiles", slider: "want", icons: { "a thing": "🍪", "a seat or a place": "🪑", "to win an argument": "🗯️", respect: "🏅", "to avoid something": "🙈" } },
        { face: "ladder", slider: "plan" },
      ],
      groups: [
        { label: "The want", sliders: ["want", "effortGap"] },
        { label: "The plan", sliders: ["plan", "obstacles"] },
        { label: "How it ends", sliders: ["getsIt"] },
      ],
      presets: [
        { label: "Heist for a parking spot", plain: "A military operation to get one parking place, and it's ruined at the end.", set: { want: "a seat or a place", plan: "a military operation", effortGap: 5, obstacles: 6, getsIt: "gets it and it's ruined" } },
        { label: "Last cookie standoff", plain: "A simple plan for the last cookie, a few things in the way, never gets it.", set: { want: "a thing", plan: "a simple plan", effortGap: 3, obstacles: 3, getsIt: "never gets it" } },
        { label: "Winning the argument at all costs", plain: "Huge effort to be right about nothing, won at a cost.", set: { want: "to win an argument", plan: "an elaborate plan", effortGap: 4, getsIt: "gets it at a cost" } },
      ],
    },
  });

  W.add("roast", {
    window: {
      faces: [
        { face: "dial", slider: "sting" },
        { face: "balance", slider: "affection", left: "contempt", right: "love" },
        { face: "tiles", slider: "target", icons: { themselves: "🪞", "a friend": "🤝", "a rival": "🥊", "someone powerful": "👑", "someone weaker": "🐣" } },
      ],
      groups: [
        { label: "The insult", sliders: ["sting", "affection", "target"] },
        { label: "The answer back", sliders: ["comeback"] },
        { label: "The crowd", sliders: ["crowd"] },
      ],
      presets: [
        { label: "Best friends ribbing", plain: "Sharp but loving, and the friend gives as good as they get.", set: { sting: 3, affection: "loving", target: "a friend", comeback: "an equal one", crowd: 3 } },
        { label: "Roast night on stage", plain: "Stinging jokes at the powerful one in front of a big crowd.", set: { sting: 5, affection: "teasing", target: "someone powerful", crowd: 20, comeback: "a better one" } },
        { label: "Cold rival put-down", plain: "Pure contempt for a rival, who has no answer.", set: { sting: 4, affection: "pure contempt", target: "a rival", comeback: "none", crowd: 6 } },
      ],
    },
  });

  W.add("parody", {
    window: {
      faces: [
        { face: "ladder", slider: "closeness" },
        { face: "tiles", slider: "target", icons: { "a genre": "🎞️", "one film": "🎬", "a famous person": "🌟", "an ad": "📺", "a kind of online video": "📱" } },
        { face: "balance", slider: "affection", left: "mocking", right: "tribute" },
      ],
      groups: [
        { label: "What is copied", sliders: ["target", "closeness", "knowNeeded"] },
        { label: "The spin on it", sliders: ["affection", "bend"] },
      ],
      presets: [
        { label: "Shot-for-shot spoof", plain: "One famous film copied frame by frame, then bent into nonsense.", set: { target: "one film", closeness: "shot for shot", bend: "fully absurd", knowNeeded: 4, affection: "teasing" } },
        { label: "Loving genre tribute", plain: "A nod to a whole genre made with love, easy to enjoy without knowing it.", set: { target: "a genre", closeness: "clearly borrowed", affection: "loving tribute", knowNeeded: 1, bend: "a twist" } },
        { label: "Fake ad break", plain: "A perfect imitation of a TV ad that mocks what it sells.", set: { target: "an ad", closeness: "perfect imitation", affection: "mocking", bend: "a twist", knowNeeded: 0 } },
      ],
    },
  });

  W.add("satire", {
    window: {
      faces: [
        { face: "dial", slider: "bite" },
        { face: "tiles", slider: "target", icons: { "everyday habits": "☕", "an industry": "🏭", "a group": "👥", politics: "🏛️", "the audience itself": "🪑" } },
        { face: "ladder", slider: "hidden" },
      ],
      groups: [
        { label: "The target", sliders: ["target", "bite"] },
        { label: "How it's told", sliders: ["hidden", "realism"] },
        { label: "The point", sliders: ["lesson"] },
      ],
      presets: [
        { label: "Deadpan office satire", plain: "Everyday habits mocked quietly, looking perfectly real.", set: { target: "everyday habits", bite: 2, hidden: "under the surface", realism: "realistic", lesson: "no answer" } },
        { label: "Political cartoon", plain: "Sharp, loud and cartoonish, with a clear message.", set: { target: "politics", bite: 5, hidden: "spelled out", realism: "cartoon", lesson: "a clear message" } },
        { label: "Mirror on the audience", plain: "The film turns on the people watching it, and the point is easy to miss.", set: { target: "the audience itself", bite: 4, hidden: "easy to miss", realism: "heightened", lesson: "a hint" } },
      ],
    },
  });

  W.add("metaJoke", {
    window: {
      faces: [
        { face: "dial", slider: "awareness" },
        { face: "tiles", slider: "about", icons: { "genre rules": "📏", "the budget": "💸", "the actors": "🎭", "the plot": "🧵", "the audience": "🍿" } },
        { face: "ladder", slider: "breaksWorld" },
      ],
      groups: [
        { label: "The joke", sliders: ["awareness", "about", "who"] },
        { label: "How far it goes", sliders: ["frequency", "breaksWorld"] },
      ],
      presets: [
        { label: "Wink at the genre", plain: "One character notices the genre rules once, and the story carries on.", set: { awareness: 2, about: "genre rules", who: "a character", frequency: "once", breaksWorld: "stays inside the story" } },
        { label: "Deadpool fourth wall", plain: "A constant stream of jokes about the budget that smash the story world.", set: { awareness: 5, about: "the budget", who: "a character", frequency: "constant", breaksWorld: "shatters it" } },
        { label: "Cheeky on-screen text", plain: "Captions now and then poke fun at the plot.", set: { who: "on-screen text", about: "the plot", frequency: "now and then", awareness: 3, breaksWorld: "bends it" } },
      ],
    },
  });

  W.add("jokeBombs", {
    window: {
      faces: [
        { face: "ladder", slider: "flatness" },
        { face: "pad", x: "confidence", y: "silence", xLabel: "Teller's confidence", yLabel: "Silence after" },
        { face: "tiles", slider: "recovery", icons: { "drops it": "🫳", "explains it": "🧑‍🏫", "tries again": "🔁", "doubles down": "⬇️" } },
      ],
      groups: [
        { label: "The joke", sliders: ["flatness", "confidence"] },
        { label: "The silence", sliders: ["silence"] },
        { label: "What happens next", sliders: ["recovery", "laterLands"] },
      ],
      presets: [
        { label: "Dad joke at dinner", plain: "Polite smiles, he explains it anyway.", set: { flatness: "polite smiles", confidence: 4, recovery: "explains it", silence: 2, laterLands: "never" } },
        { label: "Michael Scott crash", plain: "Total confidence, open disgust, a long silence and he doubles down.", set: { flatness: "open disgust", confidence: 5, silence: 6, recovery: "doubles down" } },
        { label: "Groaner that pays off", plain: "Falls flat now, but it lands big later in the film.", set: { flatness: "nothing", silence: 3, recovery: "drops it", laterLands: "it pays off later" } },
      ],
    },
  });

  W.add("roomStops", {
    window: {
      faces: [
        { face: "ladder", slider: "stop" },
        { face: "tiles", slider: "sound", icons: { "just quiet": "🤫", "music fades": "🔉", "music cut dead": "🔇", "record scratch": "💿" } },
        { face: "mixer", sliders: ["heads", "hold"] },
      ],
      groups: [
        { label: "The stop", sliders: ["stop", "sound"] },
        { label: "The room", sliders: ["heads", "hold"] },
        { label: "Getting going again", sliders: ["restart"] },
      ],
      presets: [
        { label: "Record scratch entrance", plain: "Someone walks in, the music scratches off and every head turns.", set: { stop: "dead silence and stares", sound: "record scratch", heads: 25, hold: 3, restart: "all at once" } },
        { label: "Wrong thing at the funeral", plain: "A few heads turn in the quiet, held long, and someone breaks it with a line.", set: { stop: "heads turn", sound: "just quiet", heads: 8, hold: 5, restart: "someone breaks it with a line" } },
        { label: "Saloon doors swing", plain: "The piano stops dead and the whole bar freezes.", set: { stop: "everything freezes", sound: "music cut dead", heads: 15, hold: 4, restart: "slowly" } },
      ],
    },
  });

  W.add("comicSuspense", {
    window: {
      faces: [
        { face: "dial", slider: "lead" },
        { face: "ladder", slider: "clarity" },
        { face: "tiles", slider: "payoff", icons: { "it happens as expected": "✅", "it happens worse": "💥", "it happens to someone else": "👉", "it never happens": "🚫" } },
      ],
      groups: [
        { label: "Seeing it coming", sliders: ["lead", "clarity", "framing"] },
        { label: "Near escapes", sliders: ["nearMisses"] },
        { label: "The payoff", sliders: ["payoff"] },
      ],
      presets: [
        { label: "Banana peel waiting", plain: "We see the peel early, wide on everything, and it happens as expected.", set: { lead: 6, clarity: "shown clearly", framing: "wide on everything", nearMisses: 1, payoff: "it happens as expected" } },
        { label: "Swerve to someone else", plain: "They dodge it again and again, and it gets the wrong person.", set: { lead: 8, nearMisses: 3, clarity: "we keep being reminded", payoff: "it happens to someone else", framing: "both in frame" } },
        { label: "Painted wall gag", plain: "A long build that ends worse than anyone feared.", set: { lead: 10, clarity: "we keep being reminded", nearMisses: 4, payoff: "it happens worse" } },
      ],
    },
  });

  W.add("improvFeel", {
    window: {
      faces: [
        { face: "dial", slider: "looseness" },
        { face: "mixer", sliders: ["tangents", "stumbles"] },
        { face: "ladder", slider: "overlap" },
      ],
      groups: [
        { label: "The feel", sliders: ["looseness", "overlap"] },
        { label: "Detours and slips", sliders: ["tangents", "stumbles"] },
        { label: "On the day", sliders: ["takes"] },
      ],
      presets: [
        { label: "Office mockumentary", plain: "Loose, a little overlap, small stumbles left in.", set: { looseness: 4, overlap: "a little", tangents: 2, stumbles: 3, takes: "a few versions" } },
        { label: "Apatow riff session", plain: "Everyone talks over each other with a pile of alternate jokes.", set: { looseness: 5, overlap: "a lot", tangents: 6, stumbles: 2, takes: "a pile of alternates" } },
        { label: "Tight scripted scene", plain: "Clean, one take, nobody steps on a line.", set: { looseness: 0, overlap: "none", tangents: 0, stumbles: 0, takes: "one take" } },
      ],
    },
  });

  W.add("cartoonLogic", {
    window: {
      faces: [
        { face: "dial", slider: "bend" },
        { face: "dial", slider: "delay" },
        { face: "ladder", slider: "recovery" },
      ],
      groups: [
        { label: "The physics", sliders: ["bend", "delay"] },
        { label: "The rules", sliders: ["consistency", "awareness"] },
        { label: "Getting hurt", sliders: ["recovery"] },
      ],
      presets: [
        { label: "Looney Tunes cliff", plain: "Run off the cliff, hang for a moment, fall, and be fine next shot.", set: { bend: 5, delay: 3, recovery: "next shot", consistency: "follows its own rules", awareness: "sometimes" } },
        { label: "Slapstick live action", plain: "Real-ish physics with a little bend, and the hurt fades a scene later.", set: { bend: 2, delay: 0, recovery: "a scene later", consistency: "loose", awareness: "no idea" } },
        { label: "They know the rules", plain: "Characters use the cartoon rules on purpose, strictly.", set: { bend: 4, consistency: "strict rules", awareness: "they use them", recovery: "instantly", delay: 2 } },
      ],
    },
  });

  W.add("comicMontage", {
    window: {
      faces: [
        { face: "pad", x: "shots", y: "shotLength", xLabel: "Number of shots", yLabel: "Shot length" },
        { face: "tiles", slider: "kind", icons: { "failed attempts": "🤦", training: "🏋️", "a makeover": "💇", "time passing": "⏳", "a spree": "🛍️" } },
        { face: "ladder", slider: "music" },
      ],
      groups: [
        { label: "The shots", sliders: ["shots", "shotLength", "escalates"] },
        { label: "What it shows", sliders: ["kind", "ending"] },
        { label: "The music", sliders: ["music"] },
      ],
      presets: [
        { label: "Failed attempts reel", plain: "Quick shots of trying and failing, getting worse each time.", set: { kind: "failed attempts", shots: 12, shotLength: 1, escalates: 5, music: "an upbeat song", ending: "worse than before" } },
        { label: "Rocky training parody", plain: "An over the top training montage with far too epic music.", set: { kind: "training", shots: 18, shotLength: 1.5, escalates: 4, music: "a far too epic song", ending: "it worked" } },
        { label: "Shopping spree", plain: "A bright spree cut to a happy tune, ending on a surprise.", set: { kind: "a spree", shots: 10, shotLength: 2, music: "a quiet tune", ending: "a surprise", escalates: 2 } },
      ],
    },
  });

  W.add("laughsToTears", {
    window: {
      faces: [
        { face: "tiles", slider: "direction", icons: { "laugh to tears": "😂➡️😢", "back and forth": "🔁", "tears to laugh": "😢➡️😂" } },
        { face: "ladder", slider: "speed" },
        { face: "dial", slider: "depth" },
      ],
      groups: [
        { label: "The turn", sliders: ["direction", "speed", "bridge"] },
        { label: "How sad", sliders: ["depth"] },
        { label: "The laugh again", sliders: ["returnLaugh"] },
      ],
      presets: [
        { label: "Pixar gut punch", plain: "A gentle slide from laughter into deep sadness on music, no laugh back for a while.", set: { direction: "laugh to tears", speed: "gentle", depth: 5, bridge: "music", returnLaugh: "much later" } },
        { label: "Funeral giggles", plain: "Tears turn to laughter in one line, and the laugh stays.", set: { direction: "tears to laugh", speed: "one line", depth: 3, bridge: "a line", returnLaugh: "right away" } },
        { label: "Dramedy seesaw", plain: "Back and forth on a look, with a laugh a beat after each sad turn.", set: { direction: "back and forth", speed: "a few beats", bridge: "a look", depth: 2, returnLaugh: "a beat later" } },
      ],
    },
  });

  W.add("selfMockery", {
    window: {
      faces: [
        { face: "pad", x: "harshness", y: "honesty", xLabel: "How harsh", yLabel: "Truth under it" },
        { face: "tiles", slider: "purpose", icons: { "to charm": "😊", "to get there first": "🏃", "to hide hurt": "🩹", "because it's true": "🎯" } },
        { face: "tiles", slider: "others", icons: { "laugh along": "😂", awkward: "😬", object: "✋", "agree too fast": "👍" } },
      ],
      groups: [
        { label: "The self-joke", sliders: ["harshness", "honesty", "purpose"] },
        { label: "The room", sliders: ["others"] },
        { label: "How often", sliders: ["frequency"] },
      ],
      presets: [
        { label: "Charming underdog", plain: "A gentle joke about themselves, everyone laughs along.", set: { harshness: 1, honesty: 2, purpose: "to charm", others: "laugh along", frequency: "now and then" } },
        { label: "Stand-up armor", plain: "Harsh and true, a habit that hides hurt.", set: { harshness: 5, honesty: 5, purpose: "to hide hurt", others: "awkward", frequency: "their habit" } },
        { label: "Friends agree too fast", plain: "They joke they're useless and their friends nod a little too quickly.", set: { harshness: 3, others: "agree too fast", purpose: "to get there first", frequency: "once", honesty: 3 } },
      ],
    },
  });

  W.add("punchingBag", {
    window: {
      faces: [
        { face: "dial", slider: "losses" },
        { face: "tiles", slider: "who", icons: { "the world": "🌍", "one bully": "😈", "the whole group": "👥" } },
        { face: "ladder", slider: "turn" },
      ],
      groups: [
        { label: "The beatings", sliders: ["losses", "who"] },
        { label: "Our side", sliders: ["sympathy", "aware"] },
        { label: "The payback", sliders: ["turn"] },
      ],
      presets: [
        { label: "Kenny always dies", plain: "Loses every time, the world piles on, no win ever.", set: { losses: 10, who: "the world", sympathy: 1, aware: "oblivious", turn: "never" } },
        { label: "Office scapegoat", plain: "The whole group piles on, he's resigned, and gets one small win.", set: { losses: 7, who: "the whole group", sympathy: 4, aware: "resigned", turn: "a small win" } },
        { label: "Underdog's big day", plain: "A bully knocks them down all film, then they fight back and win big.", set: { who: "one bully", losses: 6, sympathy: 5, aware: "fights back", turn: "a big win at the end" } },
      ],
    },
  });

  W.add("mockEpic", {
    window: {
      faces: [
        { face: "dial", slider: "gap" },
        { face: "tiles", slider: "tools", icons: { music: "🎻", "slow motion": "🐢", "low heroic angles": "📐", "a serious narrator": "🎙️", "all of them": "🏆" } },
        { face: "ladder", slider: "puncture" },
      ],
      groups: [
        { label: "The tiny thing, made huge", sliders: ["gap", "tools", "played"] },
        { label: "How long, and the drop", sliders: ["length", "puncture"] },
      ],
      presets: [
        { label: "Slow-mo cereal pour", plain: "Breakfast shot like the end of a war film, dead straight.", set: { gap: 5, tools: "slow motion", played: "dead straight", length: 12, puncture: "holds" } },
        { label: "Trailer voice for a chore", plain: "A serious narrator for taking out the bins, then a hard cut to reality.", set: { gap: 4, tools: "a serious narrator", played: "mostly straight", length: 20, puncture: "hard cut to reality" } },
        { label: "Full heroic walk", plain: "Every tool at once for walking into the office, with a small letdown.", set: { gap: 5, tools: "all of them", played: "dead straight", length: 30, puncture: "small letdown" } },
      ],
    },
  });

  W.add("badDisguise", {
    window: {
      faces: [
        { face: "pad", x: "badness", y: "slips", xLabel: "How bad the disguise", yLabel: "Slips" },
        { face: "ladder", slider: "fooled" },
        { face: "tiles", slider: "kind", icons: { costume: "🥸", "fake voice": "🗣️", "fake name": "📛", "pretending to have a job": "👷", "all of it": "🎭" } },
      ],
      groups: [
        { label: "The disguise", sliders: ["kind", "badness"] },
        { label: "Who falls for it", sliders: ["fooled", "slips"] },
        { label: "The reveal", sliders: ["unmasked"] },
      ],
      presets: [
        { label: "Groucho glasses", plain: "A terrible fake nose and moustache, and somehow everyone is fooled.", set: { kind: "costume", badness: 5, fooled: "everyone", slips: 2, unmasked: "never" } },
        { label: "Fake doctor at the party", plain: "Pretending to have a job, slipping more and more, unmasked in public.", set: { kind: "pretending to have a job", badness: 3, slips: 6, fooled: "almost everyone", unmasked: "in public" } },
        { label: "Nobody buys it", plain: "Fake voice, nobody fooled, and they take it off by choice.", set: { kind: "fake voice", badness: 4, fooled: "nobody", slips: 1, unmasked: "by choice" } },
      ],
    },
  });

  W.add("comicChase", {
    window: {
      faces: [
        { face: "dial", slider: "mishaps" },
        { face: "ladder", slider: "speed" },
        { face: "tiles", slider: "ending", icons: { caught: "🫳", escape: "🏃", "both fall": "🤕", "they forget why they ran": "🤔" } },
      ],
      groups: [
        { label: "The run", sliders: ["speed", "loops", "framing"] },
        { label: "On the way", sliders: ["mishaps", "obstacles"] },
        { label: "The ending", sliders: ["ending"] },
      ],
      presets: [
        { label: "Scooby-Doo hallway", plain: "Cartoon fast, running in circles through the same doors, framed wide.", set: { speed: "cartoon fast", loops: 5, framing: "wide", mishaps: 4, obstacles: "a few", ending: "escape" } },
        { label: "Market cart crash", plain: "A sprint through everything in the way, mishap after mishap, both fall.", set: { speed: "a sprint", obstacles: "everything in the way", mishaps: 9, framing: "medium", ending: "both fall" } },
        { label: "Slow-speed pursuit", plain: "A slow shuffle chase, framed close, and they forget why they ran.", set: { speed: "a slow shuffle", mishaps: 2, framing: "close", loops: 1, ending: "they forget why they ran" } },
      ],
    },
  });

  W.add("nearMiss", {
    window: {
      faces: [
        { face: "ladder", slider: "closeness" },
        { face: "mixer", sliders: ["count", "doors"] },
        { face: "tiles", slider: "caught", icons: { never: "🙈", finally: "😳", "in the worst moment": "💥" } },
      ],
      groups: [
        { label: "How close", sliders: ["closeness", "count"] },
        { label: "Places to hide", sliders: ["doors"] },
        { label: "What we see", sliders: ["audienceSees", "caught"] },
      ],
      presets: [
        { label: "Bedroom farce doors", plain: "Many doors, many near misses, and we see both sides every time.", set: { closeness: "one second apart", count: 6, doors: 8, audienceSees: "always", caught: "in the worst moment" } },
        { label: "Under the table", plain: "Hiding a hair's breadth away, one near miss, never caught.", set: { closeness: "a hair's breadth", count: 1, doors: 1, audienceSees: "always", caught: "never" } },
        { label: "Just missed each other", plain: "Two people who should meet keep missing, rooms apart, until they finally do.", set: { closeness: "rooms apart", count: 4, doors: 3, audienceSees: "sometimes", caught: "finally" } },
      ],
    },
  });

  W.add("tagScene", {
    window: {
      faces: [
        { face: "dial", slider: "length" },
        { face: "ladder", slider: "place" },
        { face: "tiles", slider: "who", icons: { "main characters": "⭐", "side characters": "🙋", "a forgotten character": "👻" } },
      ],
      groups: [
        { label: "Where and how long", sliders: ["place", "length"] },
        { label: "What is in it", sliders: ["who", "link"] },
        { label: "The laugh", sliders: ["size"] },
      ],
      presets: [
        { label: "Marvel after-credits", plain: "After the credits, setting up what's next, with the main cast.", set: { place: "after the credits", link: "sets up what's next", who: "main characters", length: 60, size: "a laugh" } },
        { label: "Forgotten character returns", plain: "End of the film, a character we forgot is still waiting, for a big laugh.", set: { place: "end of the film", who: "a forgotten character", link: "a callback", size: "a big laugh", length: 15 } },
        { label: "Sitcom cold tag", plain: "A short unrelated bit at the end of a scene with side characters.", set: { place: "end of a scene", link: "unrelated", who: "side characters", length: 20, size: "a smile" } },
      ],
    },
  });

  W.add("comicScore", {
    window: {
      faces: [
        { face: "dial", slider: "playfulness" },
        { face: "tiles", slider: "instruments", icons: { orchestra: "🎻", "small band": "🎷", "silly instruments": "🪗", "one kazoo": "🎺" } },
        { face: "balance", slider: "wrongness", left: "fits", right: "opposite" },
      ],
      groups: [
        { label: "The sound", sliders: ["playfulness", "instruments"] },
        { label: "Following the action", sliders: ["followsMoves", "stopsDead"] },
        { label: "Fit with the moment", sliders: ["wrongness"] },
      ],
      presets: [
        { label: "Cartoon mickey-mousing", plain: "Silly instruments copy every step, and stop dead for each laugh.", set: { playfulness: 5, followsMoves: "every step", instruments: "silly instruments", stopsDead: 4, wrongness: "fits" } },
        { label: "Epic music, tiny problem", plain: "A full orchestra playing the opposite of the moment.", set: { playfulness: 1, instruments: "orchestra", wrongness: "the opposite", followsMoves: "not at all", stopsDead: 1 } },
        { label: "Quirky indie plink", plain: "A small band, playful and a little off.", set: { playfulness: 3, instruments: "small band", wrongness: "a little off", followsMoves: "now and then", stopsDead: 2 } },
      ],
    },
  });

  W.add("comicRamble", {
    window: {
      faces: [
        { face: "pad", x: "length", y: "dig", xLabel: "How long", yLabel: "How deep the hole" },
        { face: "ladder", slider: "listener" },
        { face: "tiles", slider: "stop", icons: { "they trail off": "…", "someone cuts in": "✋", "a cut away": "✂️", never: "♾️" } },
      ],
      groups: [
        { label: "The ramble", sliders: ["length", "dig", "aware"] },
        { label: "The listener", sliders: ["listener"] },
        { label: "The way out", sliders: ["stop"] },
      ],
      presets: [
        { label: "Nervous first date", plain: "They know they should stop but can't, digging deeper while the date looks horrified.", set: { length: 45, dig: 5, aware: "knows but can't stop", listener: "horrified", stop: "someone cuts in" } },
        { label: "Grandpa's long story", plain: "Long, harmless and unaware, the listener drifts and it trails off.", set: { length: 90, dig: 1, aware: "no idea", listener: "patient", stop: "they trail off" } },
        { label: "Cut away mid-sentence", plain: "Realizes halfway, the listener walks off, and the film cuts away.", set: { length: 25, dig: 3, aware: "realizes halfway", listener: "walks off", stop: "a cut away" } },
      ],
    },
  });

  W.add("repeatBack", {
    window: {
      faces: [
        { face: "dial", slider: "flatness" },
        { face: "tiles", slider: "form", icons: { "exact words": "🔁", "as a question": "❓", "one key word": "🔑", slowly: "🐢" } },
        { face: "mixer", sliders: ["repeats", "pause"] },
      ],
      groups: [
        { label: "The repeat", sliders: ["form", "flatness", "repeats"] },
        { label: "Who and when", sliders: ["speaker", "pause"] },
      ],
      presets: [
        { label: "Flat 'you did what?'", plain: "The straight one repeats it as a question, flat, after a pause.", set: { form: "as a question", flatness: 5, speaker: "the straight one", pause: 2, repeats: 1 } },
        { label: "Hearing it out loud", plain: "The speaker says their own words back slowly and hears how bad they are.", set: { speaker: "the speaker themselves", form: "slowly", flatness: 3, pause: 3, repeats: 1 } },
        { label: "Key word echo", plain: "One key word bounced back again and again.", set: { form: "one key word", repeats: 4, flatness: 4, pause: 0, speaker: "the funny one" } },
      ],
    },
  });

  W.add("narratorGag", {
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { "picture says otherwise": "🙃", "freeze frame intro": "⏸️", "narrator comments": "🎙️", "narrator argues back": "🗯️" } },
        { face: "dial", slider: "contradiction" },
        { face: "tiles", slider: "tone", icons: { dry: "🏜️", warm: "☀️", smug: "😏", panicked: "😱" } },
      ],
      groups: [
        { label: "The joke", sliders: ["kind", "contradiction"] },
        { label: "The narrator", sliders: ["tone", "timing"] },
        { label: "How often", sliders: ["uses"] },
      ],
      presets: [
        { label: "Arrested Development 'he did not'", plain: "The narrator dryly says the opposite of what we just saw, right after.", set: { kind: "picture says otherwise", contradiction: 5, tone: "dry", timing: "right after", uses: 8 } },
        { label: "Freeze-frame 'that's me'", plain: "Freeze on a character for a warm intro, before the moment.", set: { kind: "freeze frame intro", tone: "warm", timing: "before the moment", contradiction: 1, uses: 2 } },
        { label: "Characters talk back", plain: "The character argues with a smug narrator during the scene.", set: { kind: "narrator argues back", tone: "smug", timing: "during it", contradiction: 3, uses: 4 } },
      ],
    },
  });

  W.add("yesAnd", {
    window: {
      faces: [
        { face: "pad", x: "joiners", y: "building", xLabel: "How many join", yLabel: "How much each adds" },
        { face: "dial", slider: "length" },
        { face: "tiles", slider: "end", icons: { fizzles: "💨", "someone breaks it": "🛑", "topped by a big final line": "🎤", "goes too far": "🚀" } },
      ],
      groups: [
        { label: "The pile-on", sliders: ["joiners", "building", "length"] },
        { label: "The holdout", sliders: ["holdout"] },
        { label: "The end", sliders: ["end"] },
      ],
      presets: [
        { label: "Group runs with the lie", plain: "Everyone joins in and adds more, until it goes too far.", set: { joiners: 7, building: 5, length: 6, holdout: "nobody", end: "goes too far" } },
        { label: "Boss shuts it down", plain: "A few join the bit until the one in charge breaks it.", set: { joiners: 3, building: 3, length: 4, holdout: "the one in charge", end: "someone breaks it" } },
        { label: "Topper ending", plain: "A quick build capped by one great final line.", set: { joiners: 4, building: 4, length: 3, end: "topped by a big final line", holdout: "one person" } },
      ],
    },
  });

  W.add("corpsing", {
    window: {
      faces: [
        { face: "ladder", slider: "crack" },
        { face: "dial", slider: "spreads" },
        { face: "tiles", slider: "kept", icons: { "cut out": "✂️", "kept in quietly": "🤫", "kept as a highlight": "⭐" } },
      ],
      groups: [
        { label: "The crack", sliders: ["crack", "who", "recover"] },
        { label: "It spreads", sliders: ["spreads"] },
        { label: "In the edit", sliders: ["kept"] },
      ],
      presets: [
        { label: "SNL break", plain: "Everyone loses it on live TV, kept as a highlight.", set: { crack: "laughing out loud", who: "everyone", spreads: 5, recover: 5, kept: "kept as a highlight" } },
        { label: "Hidden smirk kept in", plain: "The listener fights a smirk, left in quietly for those who notice.", set: { crack: "a smirk", who: "the listener", spreads: 0, recover: 1, kept: "kept in quietly" } },
        { label: "Blooper reel only", plain: "A twitch from the speaker, cut from the scene.", set: { crack: "a twitch", who: "the speaker", spreads: 1, recover: 2, kept: "cut out" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
