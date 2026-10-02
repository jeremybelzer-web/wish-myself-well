/* Model scenes: eight made-up scenes, one per familiar kind of moment, written as traces (beat by beat, which
   curiosities are set to what). They are not any real film: no titles, characters, lines or shot lists are
   copied. They exist so the Prism and the Study views have something to split on first open, and so a new
   user can see what a curated film looks like as curiosities. Each beat keeps the values of the beat before
   unless it changes them. Values use database ids ("music" is its main slider, "music.tempo" a named one). */
(function (DB) {
  function scene(id, title, genre, plain, beats) {
    let carry = {};
    DB.modelScene({
      id: "model-" + id,
      title: "Model scene: " + title,
      genre,
      plain,
      beats: beats.map(([at, values, note]) => {
        carry = Object.assign({}, carry, values);
        return { at, note: note || "", values: carry };
      }),
    });
  }

  scene("diner-standoff", "Talk in a diner turns into a standoff", "crime", "Long, funny talk over coffee, a famous song on the jukebox, then the music is cut dead and guns come out. The crime-film pattern of a long hold followed by a sudden spike.", [
    ["0:00", { shotSize: "wide", angleHeight: "eye", cameraCarry: "locked", cameraMove: "none", cutRate: "slow", shotDuration: "long", setStyle: "1950s", setMaterial: "metal", clutter: 2, music: "under the scene", "music.source": "only the characters", "music.familiarity": "famous", "music.mood": "warm", emotion: "joyful", comedyDevice: "banter", laughsPerMinute: 4, volume: 3, wordsAmount: 5, warmCool: "warm", colorRange: "vivid color" }, "establishing the room"],
    ["0:20", { shotSize: "medium", cameraMove: "orbit", cameraCarry: "smooth", moveSpeed: 1, comicTiming: 1, jokeCarrier: "both" }, "the camera circles the table while they argue about nothing"],
    ["0:45", { shotSize: "close", comicBeat: "setup planted", comedyTopic: "manners" }],
    ["1:10", { comicBeat: "payoff lands", comicReaction: "a slow burn", laughsPerMinute: 6 }],
    ["1:30", { emotion: "anxious", shotSize: "insert", objectEnter: "enters", objectKind: "prop", "music.exit": "cut dead mid-phrase", music: "none", "noMusic.cutoff": "cut dead", "noMusic.fill": "room tone", "noMusic.purpose": "suspense", laughsPerMinute: 0, comicBeat: "nothing" }, "a gun on the table; the jukebox stops"],
    ["1:34", { shotSize: "close", angleHeight: "low", volume: 5, emotion: "angry", emotionIntensity: 4, cameraCarry: "locked", cameraMove: "none", cutRate: "fast", shotDuration: "short" }, "a shouted line into the silence"],
    ["1:40", { shotSize: "close", angleHeight: "low", tensionCurve: 5, silence: "long", gazeShift: 6 }],
    ["1:55", { shotSize: "wide", angleHeight: "high", emotion: "absurd", comedyDevice: "understatement", laughsPerMinute: 3, "comedyDevice.darkness": "dark", tensionCurve: 2 }, "a deadpan line breaks the tension"],
    ["2:10", { music: "featured", "music.entry": "slams in", "music.counterpoint": "opposite", "music.mood": "happy", speedRamp: "slow", impacts: 3 }, "cheerful music over the violence"],
    ["2:25", { music: "under the scene", shotSize: "wide", cameraMove: "pull out", speedRamp: "normal", emotion: "melancholy", impacts: 0 }],
  ]);

  scene("bookshop-meet-cute", "Two strangers meet over the same book", "romantic comedy", "Opposites reach for the same book, trade quick lines, and the light warms as they warm to each other.", [
    ["0:00", { shotSize: "wide", setStyle: "victorian", setMaterial: "wood", clutter: 4, wallArt: 3, artArrangement: "loose groups", lightingMood: "soft", warmCool: "warm", music: "under the scene", "music.mood": "warm", "music.instrumentation": "small group", emotion: "curious" }],
    ["0:12", { shotSize: "insert", objectEnter: "enters", objectPath: "lift", moveFollows: "object", comicBeat: "setup planted" }, "two hands on one book"],
    ["0:15", { shotSize: "medium", angleChange: "on the line", comedyDevice: "banter", typeClash: "opposite types", comicTiming: 1, "comicTiming.pace": "quick", laughsPerMinute: 5, jokeCarrier: "both" }],
    ["0:40", { shotSize: "close", statusGap: "slight gap", "statusGap.flip": "a wobble", comicReaction: "a look", mainFormality: "business", "mainEra.hairMakeup": "styled" }],
    ["1:05", { comicBeat: "payoff lands", comicReaction: "a double take", laughsPerMinute: 7, emotion: "joyful" }],
    ["1:20", { emotionGap: 2, "emotionGap.closing": "closing", warmCool: "very warm", lightingMood: "bright and warm", cameraMove: "push in", cameraCarry: "smooth", moveSpeed: 1, music: "equal to the voices" }, "they start to like each other"],
    ["1:40", { shotSize: "wide", characterPath: "retreat", bodyEnter: "leaves", emotion: "melancholy", music: "barely there", comicBeat: "setup planted" }, "one leaves without a name"],
    ["1:50", { shotSize: "insert", objectKind: "prop", "props.importance": "the key to the scene", comicBeat: "payoff lands", emotion: "joyful", music: "featured", "music.entry": "fades up" }, "a note left in the book"],
  ]);

  scene("dinner-party", "A dinner party goes wrong", "cringe comedy", "A guest who can't read the room keeps talking; the camera refuses to cut away and the silences get longer.", [
    ["0:00", { shotSize: "wide", blocking: "line", peopleCount: 6, setStyle: "modern", setMaterial: "glass", "setStyle.wealth": "rich", mainFormality: "formal", backEra: "today", "backEra.formality": "formal", music: "barely there", "music.source": "only the characters", emotion: "joyful", comedyDevice: "cringe", cringe: 1 }],
    ["0:20", { shotSize: "medium", cameraCarry: "handheld", "cameraCarry.wobble": 1, chaosInRoom: "one chaos character", cringe: 2, "cringe.selfAware": "oblivious", jokeCarrier: "the funny one", comedyTopic: "money" }],
    ["0:45", { cringe: 3, "cringe.witnesses": 5, comicReaction: "a look", "comicReaction.count": 3, silence: "short", music: "none", "noMusic.fill": "room tone" }, "the first wrong remark"],
    ["1:05", { shotSize: "close", "cringe.hold": 4, comicTiming: 3, "comicSound.silenceBeat": 3, emotion: "anxious", laughsPerMinute: 5, statusGap: "big gap", "statusGap.pretense": 4 }],
    ["1:30", { cringe: 5, comicEscalation: 3, "comicEscalation.steps": 4, emotionGap: 4, "emotionGap.awareness": "one notices", comicReaction: "a slow burn" }, "it gets worse"],
    ["1:50", { shotSize: "wide", cameraCarry: "locked", "statusGap.fall": 4, "statusGap.flip": "a full reversal", comicBeat: "payoff lands", laughsPerMinute: 8, silence: "long" }, "the guest finally hears themself"],
  ]);

  scene("night-hallway", "Someone walks down a dark hallway", "horror", "Silence instead of music, one sound pushed forward, empty frame, then a burst.", [
    ["0:00", { shotSize: "wide", emptySpace: "most", timeOfDay: "night", valueKey: "low key", lightingMood: "dark and harsh", "lightingLens.shadows": "deep", colorRange: "muted color", warmCool: "cool", music: "none", "noMusic.length": 40, "noMusic.fill": "natural sounds", "noMusic.purpose": "suspense", emotion: "fearful", setUpkeep: "shabby", characterPath: "approach", characterSpeed: 1 }],
    ["0:15", { cameraCarry: "smooth", cameraMove: "track", moveFollows: "character", moveSpeed: 1, "soundDesign.focusSound": "clearly", tensionCurve: 2, shotDuration: "long" }, "a drip, louder than it should be"],
    ["0:35", { shotSize: "close", emoMove: "held back", gazeShift: 5, tensionCurve: 3, "lightingLens.faceLight": "half lit" }],
    ["0:50", { shotSize: "wide", emptySpace: "most", composition: "left third", tensionCurve: 4, silence: "long" }, "the empty doorway"],
    ["1:05", { misdirection: 3, comicBeat: "nothing", shotSize: "close", tensionCurve: 5, emoMove: "frozen", wordsAmount: 0 }, "a false alarm"],
    ["1:10", { shotSize: "medium", cameraCarry: "handheld", cameraShake: 4, impacts: 2, music: "wall of sound", "music.entry": "slams in", "music.mood": "dark", volume: 5, cutRate: "fast", tensionCurve: 5, emotion: "fearful", emotionIntensity: 5 }, "the burst"],
    ["1:14", { music: "none", "noMusic.cutoff": "cut dead", shotSize: "wide", cameraCarry: "locked", tensionCurve: 1, emoRoadFilm: "falling" }],
  ]);

  scene("getting-good-montage", "Practicing until they get good", "sports drama", "One song carries many short shots of days passing, cuts on the beat, the light warming as the skill grows.", [
    ["0:00", { angleFamily: "montage", music: "featured", "music.cutSync": "cuts on the beat", "music.tempo": 120, "music.energy": 3, "music.vocals": "lyrics we understand", cutRate: "fast", shotDuration: "short", emotion: "anxious", emoRoadCharacter: "falling", lightingMood: "dim", warmCool: "cool", mainWear: "worn out" }, "early failures"],
    ["0:08", { shotSize: "insert", objectKind: "prop", impacts: 2, physicalComedy: "a stumble", laughsPerMinute: 2 }, "a small fall played light"],
    ["0:16", { shotSize: "close", emotion: "curious", emoRoadCharacter: "steady", "music.energy": 4, timeOfDay: "dawn" }],
    ["0:24", { shotSize: "medium", speedRamp: "fast", emotion: "joyful", emoRoadCharacter: "rising", warmCool: "neutral", lightingMood: "soft", "music.tempo": 128 }],
    ["0:32", { shotSize: "wide", cameraMove: "crane", cameraCarry: "smooth", emotion: "triumphant", emoRoadCharacter: "highest point", warmCool: "warm", lightingMood: "bright and warm", "music.energy": 5, music: "wall of sound", speedRamp: "slow" }, "the first success, in slow motion"],
    ["0:40", { "music.exit": "plays out", shotSize: "close", speedRamp: "normal", emotion: "loving" }],
  ]);

  scene("deadpan-office", "A boring office meeting, filmed like a documentary", "mockumentary", "Handheld camera, people glancing at the lens, a manager who thinks they are funny.", [
    ["0:00", { cameraCarry: "handheld", "cameraCarry.wobble": 2, operatorFeel: 4, shotSize: "medium", setStyle: "modern", setMaterial: "metal", clutter: 3, lightingMood: "neutral", "colorRange.brightness": "bright", music: "none", "noMusic.fill": "room tone", comedyDevice: "deadpan", comicRegister: "deadpan", mainFormality: "business", backSameness: "a common style" }],
    ["0:15", { jokeCarrier: "the funny one", statusGap: "big gap", "statusGap.pretense": 4, comedyTopic: "work", laughsPerMinute: 4 }, "the manager tells a joke"],
    ["0:22", { cameraMove: "zoom", shotSize: "close", comicReaction: "a look", "comicReaction.toCamera": "a glance", "comicReaction.hold": 2, silence: "short" }, "someone looks at the lens"],
    ["0:35", { cringe: 3, comicTiming: 2, "comicSound.silenceBeat": 2, "statusGap.fall": 2 }],
    ["0:50", { comedyDevice: "rule of three", "ruleOfThree.pattern": 2, "ruleOfThree.breakSize": 4, laughsPerMinute: 6 }],
    ["1:05", { "comicReaction.toCamera": "a long look", "comicReaction.hold": 3, "comicTiming.holdAfter": 3, comicBeat: "payoff lands" }],
  ]);

  scene("quiet-goodbye", "A quiet goodbye at a doorway", "drama", "No music at all, a held-back feeling, a long hold on a face, a hand that almost reaches.", [
    ["0:00", { shotSize: "wide", music: "none", "noMusic.length": 60, "noMusic.fill": "room tone", "noMusic.purpose": "truth", setStyle: "1950s", setUpkeep: "lived in", "setStyle.personal": "full of the owner", lightingMood: "soft", warmCool: "neutral", timeOfDay: "dusk", emotion: "melancholy", emotionIntensity: 2, emoShown: "mostly hidden", cutRate: "slow", shotDuration: "long", cameraCarry: "locked" }],
    ["0:25", { shotSize: "medium", wordsAmount: 1, volume: 1, breath: "breath then speak", pace: "slow" }],
    ["0:50", { shotSize: "close", emotionIntensity: 4, emoShown: "leaks out", emoVoice: "a hint", faceIntensity: 2, stillness: 4, "lightingLens.faceLight": "half lit" }, "the feeling leaks out"],
    ["1:20", { shotSize: "insert", touch: "brief", "touch.pressure": 1, objectKind: "door", emoActions: "small" }, "a hand almost reaches"],
    ["1:30", { shotSize: "wide", characterPath: "retreat", bodyEnter: "leaves", emptySpace: "most", emoShown: "fully shown", emotionIntensity: 5, emoRoadCharacter: "lowest point", silence: "long" }],
    ["1:50", { shotSize: "close", emoTurn: "shifts", emotion: "loving", warmCool: "warm", emoRoadCharacter: "steady" }, "a small smile alone"],
  ]);

  scene("kitchen-disaster", "One small mistake wrecks a kitchen", "slapstick", "A dropped spoon starts a chain of bigger and bigger accidents, shown wide, with heightened sound and no real hurt.", [
    ["0:00", { shotSize: "wide", setStyle: "1950s", setMaterial: "metal", clutter: 3, setUpkeep: "kept", "colorRange.paletteHue": "yellow", colorRange: "vivid color", lightingMood: "bright and warm", music: "under the scene", "music.tempo": 140, "music.mood": "happy", comedyDevice: "slapstick", comicRegister: "big", emotion: "joyful", laughsPerMinute: 2 }],
    ["0:10", { shotSize: "insert", objectPath: "drop", objectKind: "prop", "physicalComedy.size": "a small fumble", comicBeat: "setup planted", comicEscalation: 1 }, "the spoon"],
    ["0:15", { shotSize: "wide", "physicalComedy.size": "a stumble", "comicEscalation.steps": 3, comicEscalation: 2, "soundDesign.realism": "stylized", "comicSound.effects": 3, impacts: 2 }],
    ["0:25", { "physicalComedy.size": "a fall", "physicalComedy.pain": 1, comicEscalation: 4, impacts: 5, breakage: "shatters", "comicEscalation.speed": "snowball", laughsPerMinute: 8, cutRate: "fast", "music.energy": 5 }],
    ["0:35", { "physicalComedy.size": "destruction", comicEscalation: 5, "comicEscalation.ceiling": "disaster", setUpkeep: "ruined", clutter: 5, comicReaction: "a double take" }],
    ["0:40", { music: "none", "music.exit": "cut dead mid-phrase", "noMusic.purpose": "shock", silence: "short", comicBeat: "payoff lands", comedyDevice: "understatement", "understatement.direction": "huge treated as tiny", volume: 1, cutRate: "slow", shotSize: "medium" }, "a calm line amid the wreck"],
  ]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
