/* say for the comedy curiosities in data/db-heart.js (database thread): plain words for "Say what you want". */
(function (W) {
  W.say("straightAnswer", {
    "answer it totally straight": { seriousness: "dead serious", beatBefore: 0 },
    "play it like it's normal": { seriousness: "dead serious", asker: "satisfied" },
    "give a full lecture on it": { detail: "a lecture", seriousness: "painfully thorough" },
    "just one word": { detail: "one word" },
    "a really dumb question": { silliness: 5 },
    "with a little smirk": { seriousness: "a smirk" },
    "leave them confused": { asker: "confused" },
    "they keep pushing": { asker: "pushes further" },
    "take a beat before answering": { beatBefore: 2 },
  });

  W.say("catchphrase", {
    "say it again": { uses: 6 },
    "use it all the time": { uses: 10, spacing: 1 },
    "save it for later": { spacing: 12, withheld: 2 },
    "everyone waits for it": { setUp: "everyone waits for it" },
    "out of nowhere": { setUp: "out of nowhere" },
    "shout it": { delivery: "shouted" },
    "sing it": { delivery: "sung" },
    "mutter it under their breath": { delivery: "muttered" },
    "someone else says it": { twist: "said by someone else" },
    "give it a new meaning": { twist: "new meaning" },
  });

  W.say("sceneButton", {
    "end on a big laugh": { size: "the biggest laugh of the scene" },
    "just a little smile at the end": { size: "a smile" },
    "end on a look": { form: "a look" },
    "end with a sound": { form: "a sound" },
    "cut right away": { cutAfter: 0 },
    "hold it before the cut": { cutAfter: 3, length: 3 },
    "give it to the side character": { who: "the side character" },
    "let the prop have the last word": { who: "an object", form: "an action" },
  });

  W.say("comicWant", {
    "way too much effort": { effortGap: 5, plan: "a military operation" },
    "they just want a snack": { want: "a thing" },
    "fight over a seat": { want: "a seat or a place" },
    "they need to win this argument": { want: "to win an argument" },
    "no plan at all": { plan: "no plan" },
    "a crazy elaborate plan": { plan: "an elaborate plan", effortGap: 4 },
    "everything gets in the way": { obstacles: 8 },
    "they never get it": { getsIt: "never gets it" },
    "they get it but it's ruined": { getsIt: "gets it and it's ruined" },
  });

  W.say("roast", {
    "make it sting": { sting: 5 },
    "keep it friendly": { affection: "loving", sting: 2 },
    "really mean": { affection: "pure contempt", sting: 5 },
    "roast the boss": { target: "someone powerful" },
    "they make fun of themselves": { target: "themselves" },
    "they fire back": { comeback: "a better one" },
    "no comeback": { comeback: "none" },
    "in front of everyone": { crowd: 20 },
    "just the two of them": { crowd: 0 },
  });

  W.say("parody", {
    "spoof a famous movie": { target: "one film", closeness: "shot for shot" },
    "make fun of the genre": { target: "a genre" },
    "do an impression": { target: "a famous person", closeness: "perfect imitation" },
    "a fake commercial": { target: "an ad" },
    "a loving tribute": { affection: "loving tribute" },
    "make fun of it": { affection: "mocking" },
    "just a little nod": { closeness: "a passing nod", knowNeeded: 0 },
    "totally over the top": { bend: "fully absurd" },
    "only fans will get it": { knowNeeded: 5 },
  });

  W.say("satire", {
    "make it sharper": { bite: 5 },
    "go easy on it": { bite: 1 },
    "poke fun at politics": { target: "politics" },
    "make fun of the audience": { target: "the audience itself" },
    "keep the point hidden": { hidden: "easy to miss" },
    "spell it out": { hidden: "spelled out", lesson: "a clear message" },
    "make it look real": { realism: "realistic" },
    "make it cartoonish": { realism: "cartoon" },
    "no easy answers": { lesson: "no answer" },
  });

  W.say("metaJoke", {
    "break the fourth wall": { breaksWorld: "shatters it", awareness: 5 },
    "a little wink": { awareness: 1, breaksWorld: "stays inside the story" },
    "joke about the budget": { about: "the budget" },
    "talk to the audience": { about: "the audience" },
    "let the narrator say it": { who: "the narrator" },
    "put it in text on screen": { who: "on-screen text" },
    "just once": { frequency: "once" },
    "keep doing it": { frequency: "constant" },
  });

  W.say("jokeBombs", {
    "the joke dies": { flatness: "nothing", silence: 4 },
    "nobody laughs": { flatness: "nothing" },
    "they hate it": { flatness: "open disgust" },
    "awkward silence": { silence: 6 },
    "he's so sure of himself": { confidence: 5 },
    "explain the joke": { recovery: "explains it" },
    "double down on it": { recovery: "doubles down" },
    "someone laughs late": { laterLands: "someone laughs late" },
    "it pays off later": { laterLands: "it pays off later" },
  });

  W.say("roomStops", {
    "record scratch": { sound: "record scratch", stop: "dead silence and stares" },
    "everyone turns to look": { stop: "heads turn", heads: 20 },
    "everything freezes": { stop: "everything freezes" },
    "the music cuts out": { sound: "music cut dead" },
    "just a quiet pause": { stop: "a pause", sound: "just quiet" },
    "hold the silence": { hold: 6 },
    "someone breaks the silence": { restart: "someone breaks it with a line" },
    "everyone goes back to normal": { restart: "all at once" },
  });

  W.say("comicSuspense", {
    "let us see it coming": { lead: 8, clarity: "shown clearly" },
    "keep reminding us": { clarity: "we keep being reminded" },
    "make them almost dodge it": { nearMisses: 3 },
    "it happens to someone else": { payoff: "it happens to someone else" },
    "make it worse": { payoff: "it happens worse" },
    "it never happens": { payoff: "it never happens" },
    "show it wide": { framing: "wide on everything" },
    "close on their face": { framing: "close on the person" },
    "barely a hint": { clarity: "hinted", lead: 1 },
  });

  W.say("improvFeel", {
    "make it feel made up": { looseness: 5 },
    "keep it tight": { looseness: 0, overlap: "none", stumbles: 0 },
    "let them talk over each other": { overlap: "a lot" },
    "let them go off on tangents": { tangents: 5 },
    "leave the stumbles in": { stumbles: 4 },
    "try a bunch of versions": { takes: "a pile of alternates" },
    "just one take": { takes: "one take" },
    "like a documentary": { looseness: 4, overlap: "a little", stumbles: 2 },
  });

  W.say("cartoonLogic", {
    "like a cartoon": { bend: 5, recovery: "instantly" },
    "keep it real": { bend: 0, recovery: "real time" },
    "hang in the air before falling": { delay: 3 },
    "they're fine next shot": { recovery: "next shot" },
    "the rules make sense": { consistency: "strict rules" },
    "anything can happen": { consistency: "random" },
    "they know it's a cartoon": { awareness: "they use them" },
    "they have no idea": { awareness: "no idea" },
  });

  W.say("comicMontage", {
    "a quick montage": { shotLength: 0.5, shots: 15 },
    "lots of shots": { shots: 30 },
    "a training montage": { kind: "training" },
    "a makeover montage": { kind: "a makeover" },
    "fail over and over": { kind: "failed attempts", escalates: 4 },
    "make each one bigger": { escalates: 5 },
    "with epic music": { music: "a far too epic song" },
    "no music": { music: "none" },
    "and it doesn't work": { ending: "it didn't" },
  });

  W.say("laughsToTears", {
    "go from funny to sad": { direction: "laugh to tears" },
    "go from sad to funny": { direction: "tears to laugh" },
    "flip back and forth": { direction: "back and forth" },
    "make it sudden": { speed: "instant" },
    "ease into it": { speed: "gentle" },
    "make it really sad": { depth: 5 },
    "let the music do it": { bridge: "music" },
    "just a look": { bridge: "a look" },
    "bring the laugh right back": { returnLaugh: "right away" },
    "no laughs after": { returnLaugh: "never" },
  });

  W.say("selfMockery", {
    "make fun of themselves": { harshness: 2, frequency: "once" },
    "really hard on themselves": { harshness: 5 },
    "it's true and it hurts": { honesty: 5, purpose: "because it's true" },
    "to hide the pain": { purpose: "to hide hurt" },
    "beat them to it": { purpose: "to get there first" },
    "everyone laughs along": { others: "laugh along" },
    "make it awkward": { others: "awkward" },
    "friends agree too fast": { others: "agree too fast" },
    "they always do it": { frequency: "their habit" },
  });

  W.say("punchingBag", {
    "they always lose": { losses: 10 },
    "poor guy": { sympathy: 5 },
    "we don't feel bad for them": { sympathy: 0 },
    "the whole world is against them": { who: "the world" },
    "one bully": { who: "one bully" },
    "they have no clue": { aware: "oblivious" },
    "they fight back": { aware: "fights back" },
    "give them a win at the end": { turn: "a big win at the end" },
    "never let them win": { turn: "never" },
  });

  W.say("mockEpic", {
    "make it epic": { gap: 5, tools: "all of them" },
    "in slow motion": { tools: "slow motion" },
    "with a movie trailer voice": { tools: "a serious narrator" },
    "heroic music": { tools: "music" },
    "play it dead straight": { played: "dead straight" },
    "with a wink": { played: "winking" },
    "drag it out": { length: 45 },
    "cut back to reality": { puncture: "hard cut to reality" },
  });

  W.say("badDisguise", {
    "the worst disguise ever": { badness: 5 },
    "a pretty good disguise": { badness: 1 },
    "somehow everyone falls for it": { fooled: "everyone" },
    "nobody is fooled": { fooled: "nobody" },
    "a fake mustache": { kind: "costume" },
    "a fake accent": { kind: "fake voice" },
    "keep slipping up": { slips: 6 },
    "caught in front of everyone": { unmasked: "in public" },
    "they never get caught": { unmasked: "never" },
  });

  W.say("comicChase", {
    "a crazy chase": { speed: "cartoon fast", mishaps: 8 },
    "a slow chase": { speed: "a slow shuffle" },
    "crash into everything": { obstacles: "everything in the way", mishaps: 10 },
    "run in circles": { loops: 5 },
    "show it wide": { framing: "wide" },
    "they get caught": { ending: "caught" },
    "they get away": { ending: "escape" },
    "both fall over": { ending: "both fall" },
    "forget why they're running": { ending: "they forget why they ran" },
  });

  W.say("nearMiss", {
    "they almost see each other": { closeness: "a hair's breadth" },
    "just missed": { closeness: "one second apart" },
    "lots of close calls": { count: 6 },
    "lots of doors": { doors: 8 },
    "hide under the bed": { doors: 1, closeness: "same room, unseen" },
    "we see both of them": { audienceSees: "always" },
    "they finally run into each other": { caught: "finally" },
    "caught at the worst time": { caught: "in the worst moment" },
    "they never meet": { caught: "never" },
  });

  W.say("tagScene", {
    "after the credits": { place: "after the credits" },
    "at the end of the scene": { place: "end of a scene" },
    "a quick tag": { length: 8 },
    "a longer tag": { length: 60 },
    "bring back a joke from earlier": { link: "a callback" },
    "tease the next one": { link: "sets up what's next" },
    "end on a big laugh": { size: "a big laugh" },
    "bring back a forgotten character": { who: "a forgotten character" },
  });

  W.say("comicScore", {
    "make the music silly": { playfulness: 5, instruments: "silly instruments" },
    "a kazoo": { instruments: "one kazoo" },
    "a big orchestra": { instruments: "orchestra" },
    "music that copies every move": { followsMoves: "every step" },
    "stop the music for the joke": { stopsDead: 4 },
    "totally wrong music": { wrongness: "the opposite" },
    "music that fits": { wrongness: "fits" },
    "keep it serious": { playfulness: 0 },
  });

  W.say("comicRamble", {
    "they won't stop talking": { length: 90, stop: "never" },
    "keep it short": { length: 10 },
    "dig themselves a hole": { dig: 5 },
    "they know they should stop": { aware: "knows but can't stop" },
    "they have no idea": { aware: "no idea" },
    "the other person is horrified": { listener: "horrified" },
    "they just walk away": { listener: "walks off" },
    "someone cuts them off": { stop: "someone cuts in" },
    "let it trail off": { stop: "they trail off" },
  });

  W.say("repeatBack", {
    "say it right back": { form: "exact words" },
    "say it back as a question": { form: "as a question" },
    "repeat just one word": { form: "one key word" },
    "say it back slowly": { form: "slowly" },
    "totally flat": { flatness: 5 },
    "say it again and again": { repeats: 4 },
    "pause before saying it": { pause: 3 },
    "they hear themselves say it": { speaker: "the speaker themselves" },
  });

  W.say("narratorGag", {
    "the narrator lies": { kind: "picture says otherwise", contradiction: 5 },
    "freeze frame and introduce them": { kind: "freeze frame intro" },
    "the narrator argues with them": { kind: "narrator argues back" },
    "a dry narrator": { tone: "dry" },
    "a smug narrator": { tone: "smug" },
    "the narrator panics": { tone: "panicked" },
    "say it right after": { timing: "right after" },
    "do it a lot": { uses: 10 },
    "just once": { uses: 1 },
  });

  W.say("yesAnd", {
    "everyone plays along": { joiners: 8, building: 4 },
    "nobody joins in": { joiners: 0 },
    "keep building on it": { building: 5, length: 6 },
    "one person refuses": { holdout: "one person" },
    "the boss shuts it down": { holdout: "the one in charge", end: "someone breaks it" },
    "it goes too far": { end: "goes too far" },
    "end with a big line": { end: "topped by a big final line" },
    "let it fizzle out": { end: "fizzles" },
    "keep it going longer": { length: 8 },
  });

  W.say("corpsing", {
    "they crack up": { crack: "laughing out loud" },
    "keep a straight face": { crack: "held perfectly" },
    "a tiny smirk": { crack: "a smirk" },
    "everyone loses it": { who: "everyone", spreads: 5 },
    "it's contagious": { spreads: 4 },
    "keep it in the movie": { kept: "kept as a highlight" },
    "cut it out": { kept: "cut out" },
    "they can't get it together": { recover: 5 },
    "they pull it together fast": { recover: 0 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
