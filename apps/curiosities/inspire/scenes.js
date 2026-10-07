/* Scene inspiration: famous scenes from films, TV and video games, kept ONLY as their shared curiosities
   (shot size, light, music, feeling...) beat by beat, so you can see how fast each one changes. No footage,
   scripts, lines or shot lists are stored: a title, our own one-line description of the moment, the feeling it
   gives an audience, and a YouTube search (a search, not a link, so it never breaks). Values are first guesses
   from watching; anyone can correct them in the hub ("Log a clip"). Values use database ids, like the model
   scenes: "music" is its main slider, "music.mood" a named one. Each beat keeps the values of the beat before
   unless it changes them. */
(function (root) {
  /* Short names for the curiosities used most, so each scene fits on a few lines. */
  const K = {
    S: "shotSize", A: "angleHeight", M: "cameraMove", H: "cameraCarry", C: "cutRate", D: "shotDuration",
    L: "lensLength", T: "dutch", E: "emotion", X: "tensionCurve", U: "music", UM: "music.mood", W: "warmCool",
    K: "colorRange", LM: "lightingMood", Q: "timeOfDay", R: "weather", SI: "silence", P: "pace",
    J: "comedyDevice", LP: "laughsPerMinute", CH: "chaosInRoom", RO: "emoRoadCharacter", AR: "arcStage",
    EY: "eyeline", BL: "blocking", AC: "actingLens", CR: "crowdLens", PL: "setting.place", SP: "speedRamp",
    ST: "stakes",
  };
  const scenes = [];
  /* into(list) gives s(work, year, kind, moment, feelings, search, beats: [[at, {short: value}]], extra), which adds
     one source to that list; extra adds fields such as author or movements. The writing database
     (inspire/writing.js) uses it for its own list. */
  const into = (list) => function (work, year, kind, moment, feelings, search, beats, extra) {
    let carry = {};
    const id = (work + "-" + moment).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    list.push({
      id,
      work,
      year,
      kind,
      moment,
      feelings: feelings.split(/,\s*/),
      search,
      beats: beats.map(([at, v]) => {
        const values = {};
        Object.keys(v).forEach((k) => (values[K[k] || k] = v[k]));
        carry = Object.assign({}, carry, values);
        return { at, values: carry };
      }),
      ...(extra || {}),
    });
  };
  const s = into(scenes);

  /* ---------- dread and suspense ---------- */
  s("Jaws", 1975, "film", "A parent on a crowded beach scans the water", "dread, suspense", "Jaws beach scene dolly zoom", [
    [0, { S: "wide", A: "eye", M: "none", H: "locked", C: "medium", D: "medium", E: "anxious", X: 2, U: "none", W: "warm", K: "natural color", LM: "bright and warm", Q: "day", PL: "a beach", CR: "a crowd", SI: "short", ST: 5 }],
    [20, { S: "medium", C: "fast", D: "short", X: 3, EY: "glances" }],
    [45, { S: "close", M: "push in", L: "wide", X: 5, E: "fearful", SI: "long" }],
    [55, { S: "wide", C: "fast", CH: "all chaos", U: "featured", UM: "dark" }],
  ]);
  s("Psycho", 1960, "film", "A shower turns into an attack", "shock, dread", "Psycho shower scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "slow", D: "long", E: "loving", X: 0, U: "none", K: "black and white", LM: "soft", PL: "a bathroom", SI: "long" }],
    [30, { S: "close", X: 3, E: "anxious" }],
    [40, { C: "fast", D: "short", X: 5, E: "fearful", U: "wall of sound", UM: "dark", SI: "none" }],
    [75, { S: "insert", C: "slow", D: "long", M: "pull out", X: 2, E: "melancholy", U: "none", SI: "long" }],
  ]);
  s("Alien", 1979, "film", "Crew members search dark corridors with a tracker", "suspense, dread", "Alien air duct tracker scene", [
    [0, { S: "medium", A: "eye", M: "track", H: "handheld", C: "medium", D: "medium", E: "anxious", X: 3, U: "barely there", UM: "uneasy", W: "cool", K: "muted color", LM: "dark and harsh", Q: "night", SI: "short", ST: 5 }],
    [40, { S: "close", C: "fast", D: "short", X: 5, E: "fearful", SI: "none" }],
    [60, { S: "insert", M: "none", X: 5, U: "featured" }],
  ]);
  s("No Country for Old Men", 2007, "film", "A quiet gas-station coin toss", "dread, unease", "No Country for Old Men coin toss scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "slow", D: "long", E: "anxious", X: 2, U: "none", W: "neutral", K: "muted color", LM: "dim", PL: "a store", SI: "long", P: "slow", EY: "one holds the look", ST: 5 }],
    [60, { S: "close", C: "medium", X: 4 }],
    [120, { S: "insert", X: 5, SI: "long" }],
    [150, { S: "medium", X: 1, E: "melancholy" }],
  ]);
  s("The Last of Us", 2013, "game", "Sneaking past blind enemies in a dark building", "suspense, dread", "The Last of Us clicker stealth", [
    [0, { S: "medium", A: "eye", M: "track", H: "smooth", C: "slow", D: "long", E: "anxious", X: 3, U: "barely there", UM: "uneasy", W: "cool", K: "muted color", LM: "dim", SI: "long", ST: 5 }],
    [30, { S: "close", X: 5, E: "fearful", SI: "long" }],
    [50, { C: "fast", M: "pan", H: "handheld", U: "featured", CH: "mostly chaos" }],
  ]);
  s("Inglourious Basterds", 2009, "film", "A polite interrogation at a farmhouse table", "suspense, dread", "Inglourious Basterds opening farmhouse scene", [
    [0, { S: "wide", A: "eye", M: "none", H: "locked", C: "slow", D: "long", E: "anxious", X: 1, U: "none", W: "warm", K: "natural color", LM: "soft", Q: "day", PL: "a farm", P: "slow", SI: "short", BL: "one seated", ST: 5 }],
    [180, { S: "medium", X: 3, EY: "one holds the look" }],
    [400, { S: "close", C: "medium", X: 5, M: "push in", SI: "long" }],
    [560, { S: "wide", C: "fast", U: "featured", CH: "all chaos", E: "fearful" }],
  ]);

  /* ---------- awe and wonder ---------- */
  s("Jurassic Park", 1993, "film", "First sight of the giant dinosaurs in a field", "awe, joy", "Jurassic Park first dinosaur reveal", [
    [0, { S: "close", A: "eye", M: "none", H: "smooth", C: "medium", D: "medium", E: "curious", X: 1, U: "none", W: "warm", K: "natural color", LM: "bright and warm", Q: "day", PL: "outside" }],
    [15, { S: "close", AC: "double take", E: "absurd" }],
    [25, { S: "wide", A: "low", M: "crane", D: "long", E: "joyful", U: "featured", UM: "euphoric" }],
    [60, { S: "wide", M: "pan", CR: "a group" }],
  ]);
  s("2001: A Space Odyssey", 1968, "film", "A spaceship slowly docks to a waltz", "awe, calm", "2001 A Space Odyssey docking waltz", [
    [0, { S: "wide", A: "eye", M: "none", H: "smooth", C: "slow", D: "long", E: "dreamlike", X: 0, U: "featured", UM: "warm", W: "neutral", K: "natural color", LM: "neutral", SI: "none" }],
    [120, { S: "medium" }],
    [300, { S: "wide" }],
  ]);
  s("Shadow of the Colossus", 2005, "game", "Riding across empty land toward a giant", "awe, loneliness", "Shadow of the Colossus first colossus", [
    [0, { S: "wide", A: "eye", M: "track", H: "smooth", C: "slow", D: "long", E: "melancholy", X: 1, U: "none", W: "neutral", K: "muted color", LM: "soft", Q: "day", PL: "outside", SI: "long" }],
    [60, { A: "low", S: "wide", E: "fearful", X: 4, U: "wall of sound", UM: "dark" }],
    [90, { S: "close", H: "handheld", C: "medium", X: 5, E: "triumphant" }],
  ]);
  s("Spirited Away", 2001, "anime", "A train ride across a flooded world", "calm, wonder, melancholy", "Spirited Away train scene", [
    [0, { S: "wide", A: "eye", M: "none", H: "locked", C: "slow", D: "long", E: "melancholy", X: 0, U: "under the scene", UM: "sad", W: "cool", K: "muted color", LM: "soft", Q: "dusk", SI: "long" }],
    [60, { S: "medium", E: "dreamlike" }],
    [120, { S: "wide", Q: "night" }],
  ]);

  /* ---------- joy, romance, connection ---------- */
  s("La La Land", 2016, "film", "A tap duet on a hill at dusk", "romance, joy", "La La Land A Lovely Night dance", [
    [0, { S: "wide", A: "eye", M: "track", H: "smooth", C: "slow", D: "long", E: "curious", X: 1, U: "featured", UM: "warm", W: "cool", K: "vivid color", LM: "soft", Q: "dusk", PL: "a park", BL: "line", EY: "glances" }],
    [60, { E: "joyful", EY: "both hold", "blocking.together": "face to face" }],
    [180, { S: "medium", E: "loving", U: "none", SI: "short" }],
  ]);
  s("When Harry Met Sally", 1989, "film", "A loud fake moment in a busy deli", "laughter, embarrassment", "When Harry Met Sally deli scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "medium", D: "medium", E: "curious", X: 1, U: "none", W: "warm", K: "natural color", LM: "neutral", PL: "a diner", BL: "one seated", J: "banter", LP: 3 }],
    [40, { S: "close", J: "escalation", LP: 6, CH: "one chaos character" }],
    [90, { S: "wide", CR: "a crowd", J: "reversal", LP: 9, AC: "freeze in shock" }],
  ]);
  s("Up", 2009, "film", "A life together told in a wordless montage", "joy, heartbreak", "Up married life montage", [
    [0, { S: "wide", A: "eye", M: "none", H: "smooth", C: "medium", D: "medium", E: "joyful", X: 0, U: "featured", UM: "happy", W: "warm", K: "vivid color", LM: "bright and warm", RO: "rising", SI: "none" }],
    [120, { E: "melancholy", UM: "sad", RO: "lowest point", W: "neutral" }],
    [180, { E: "loving", RO: "steady", UM: "warm" }],
    [240, { S: "close", E: "melancholy", K: "muted color", RO: "lowest point", C: "slow", D: "long" }],
  ]);
  s("Titanic", 1997, "film", "Arms out at the bow of a ship at sunset", "romance, freedom", "Titanic flying scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "smooth", C: "slow", D: "long", E: "curious", U: "under the scene", UM: "warm", W: "very warm", K: "vivid color", LM: "bright and warm", Q: "dusk" }],
    [30, { S: "wide", M: "orbit", E: "loving", U: "featured", UM: "euphoric", EY: "both hold" }],
  ]);
  s("Journey", 2012, "game", "Sliding down glowing sand with a stranger", "joy, wonder", "Journey sand sliding scene", [
    [0, { S: "wide", A: "high", M: "track", H: "smooth", C: "slow", D: "long", E: "joyful", U: "featured", UM: "euphoric", W: "very warm", K: "vivid color", LM: "bright and warm", Q: "dusk", PL: "a desert", SP: "fast" }],
    [40, { S: "medium", A: "eye", E: "triumphant" }],
  ]);

  /* ---------- heartbreak and catharsis ---------- */
  s("The Lion King", 1994, "film", "A child tries to wake a fallen parent", "heartbreak", "The Lion King Mufasa death scene", [
    [0, { S: "wide", A: "high", M: "none", H: "locked", C: "medium", D: "medium", E: "anxious", X: 3, U: "featured", UM: "dark", W: "warm", K: "muted color", LM: "dim", PL: "outside", ST: 5 }],
    [30, { S: "close", A: "eye", E: "melancholy", U: "barely there", SI: "long", C: "slow", D: "long", RO: "lowest point" }],
    [60, { S: "wide", M: "pull out", U: "featured", UM: "sad" }],
  ]);
  s("Good Will Hunting", 1997, "film", "It's not your fault, said again and again", "catharsis, heartbreak", "Good Will Hunting it's not your fault scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "slow", D: "long", E: "melancholy", X: 2, U: "none", W: "warm", K: "natural color", LM: "soft", PL: "an office", P: "slow", "blocking.together": "face to face" }],
    [60, { S: "close", X: 4, EY: "one holds the look", AC: "shake no" }],
    [100, { E: "loving", X: 1, RO: "rising", U: "under the scene", UM: "sad" }],
  ]);
  s("Red Dead Redemption 2", 2018, "game", "A last ride toward a sunrise", "catharsis, melancholy", "Red Dead Redemption 2 final ride sunrise", [
    [0, { S: "wide", A: "eye", M: "track", H: "smooth", C: "slow", D: "long", E: "melancholy", X: 1, U: "featured", UM: "sad", W: "very warm", K: "muted color", LM: "soft", Q: "dawn", PL: "outside", RO: "falling" }],
    [60, { S: "close", RO: "lowest point", SI: "long", U: "barely there" }],
    [90, { S: "wide", M: "crane", E: "loving", RO: "rising", U: "featured" }],
  ]);
  s("Schindler's List", 1993, "film", "One red coat in a black-and-white crowd", "heartbreak, dread", "Schindler's List girl in red coat", [
    [0, { S: "wide", A: "high", M: "pan", H: "handheld", C: "medium", D: "medium", E: "fearful", X: 4, U: "barely there", UM: "sad", K: "one color", LM: "dark and harsh", PL: "a street", CR: "a sea", CH: "mostly chaos" }],
    [40, { M: "track", EY: "no one meets", U: "featured" }],
  ]);

  /* ---------- triumph and adrenaline ---------- */
  s("Rocky", 1976, "film", "A training run up the museum steps", "triumph, hope", "Rocky steps training montage", [
    [0, { S: "wide", A: "eye", M: "track", H: "smooth", C: "fast", D: "short", E: "curious", X: 1, U: "featured", UM: "happy", W: "cool", K: "natural color", LM: "neutral", Q: "dawn", PL: "a street", RO: "rising", AR: "choice" }],
    [90, { E: "triumphant", A: "low", S: "medium", RO: "highest point", AC: "jump for joy" }],
    [110, { S: "wide", M: "orbit", A: "high", AR: "change" }],
  ]);
  s("Mad Max: Fury Road", 2015, "film", "A desert chase into a sandstorm", "adrenaline, awe", "Mad Max Fury Road sandstorm scene", [
    [0, { S: "wide", A: "eye", M: "track", H: "handheld", C: "fast", D: "short", E: "angry", X: 4, U: "wall of sound", UM: "dark", W: "very warm", K: "vivid color", LM: "bright and warm", Q: "day", PL: "a desert", SP: "ramp", CH: "all chaos", ST: 5 }],
    [60, { R: "dust", K: "two or three colors", LM: "dark and harsh", X: 5, E: "triumphant" }],
    [100, { S: "close", E: "fearful", SP: "fast" }],
  ]);
  s("Top Gun: Maverick", 2022, "film", "A low, fast flight through a canyon", "adrenaline, triumph", "Top Gun Maverick canyon run", [
    [0, { S: "close", A: "eye", M: "track", H: "handheld", C: "fast", D: "short", E: "anxious", X: 4, U: "featured", UM: "uneasy", W: "warm", K: "natural color", LM: "bright and warm", Q: "day", ST: 5 }],
    [90, { S: "wide", A: "low", X: 5, E: "triumphant", UM: "euphoric" }],
  ]);
  s("Doom", 2016, "game", "An arena fight against waves of demons", "adrenaline, power", "Doom 2016 arena combat", [
    [0, { S: "medium", A: "eye", M: "track", H: "handheld", C: "fast", D: "short", E: "angry", X: 5, U: "wall of sound", UM: "dark", W: "very warm", K: "two or three colors", LM: "dark and harsh", CH: "all chaos", CR: "a group" }],
    [90, { E: "triumphant", U: "none", SI: "short", X: 1 }],
  ]);
  s("Whiplash", 2014, "film", "A drum solo that takes over the concert", "triumph, adrenaline", "Whiplash final drum solo", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "medium", D: "medium", E: "angry", X: 4, U: "featured", UM: "uneasy", W: "warm", K: "two or three colors", LM: "dark and harsh", PL: "a stage", EY: "one holds the look", ST: 5 }],
    [120, { S: "insert", C: "fast", D: "short", X: 5, M: "push in", E: "triumphant", U: "wall of sound" }],
    [240, { S: "close", EY: "both hold", AC: "nod yes" }],
  ]);
  s("Super Mario Bros.", 1985, "game", "The first screen: run, jump, first enemy", "joy, curiosity", "Super Mario Bros world 1-1", [
    [0, { S: "wide", A: "eye", M: "track", H: "locked", C: "slow", D: "long", E: "curious", X: 1, U: "featured", UM: "happy", W: "neutral", K: "vivid color", LM: "bright and warm", Q: "day", PL: "outside" }],
    [10, { E: "joyful", X: 2 }],
  ]);

  /* ---------- laughter ---------- */
  s("Monty Python and the Holy Grail", 1975, "film", "A knight refuses to lose, one limb at a time", "laughter, absurdity", "Monty Python Black Knight scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "slow", D: "long", E: "curious", X: 1, U: "none", W: "neutral", K: "muted color", LM: "neutral", PL: "a forest", J: "the straight one and the funny one", LP: 3 }],
    [60, { J: "escalation", LP: 6, E: "absurd" }],
    [150, { J: "rule of three", LP: 9, CH: "one chaos character" }],
  ]);
  s("The Office", 2005, "tv", "A staff meeting goes wrong while one person stares at the camera", "laughter, cringe", "The Office camera stare compilation", [
    [0, { S: "medium", A: "eye", M: "pan", H: "handheld", C: "medium", D: "medium", E: "curious", U: "none", W: "neutral", K: "natural color", LM: "neutral", PL: "an office", J: "cringe", LP: 4, CR: "a group" }],
    [30, { S: "close", M: "push in", J: "deadpan", LP: 7, SI: "short", EY: "one holds the look" }],
    [45, { S: "medium", J: "escalation", CH: "one chaos character" }],
  ]);
  s("Airplane!", 1980, "film", "Calm advice delivered straight while chaos fills the cabin", "laughter, absurdity", "Airplane! don't call me Shirley", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "medium", D: "medium", E: "anxious", U: "none", W: "neutral", K: "natural color", LM: "neutral", PL: "a room", J: "deadpan", LP: 8 }],
    [30, { J: "misunderstanding", CH: "mostly chaos", LP: 10 }],
  ]);
  s("Portal", 2007, "game", "A cheerful robot voice lies to you about cake", "laughter, unease", "Portal GLaDOS cake lines", [
    [0, { S: "wide", A: "eye", M: "track", H: "smooth", C: "slow", D: "long", E: "curious", X: 1, U: "barely there", UM: "neutral", W: "cool", K: "muted color", LM: "neutral", PL: "a room", J: "irony", LP: 3 }],
    [120, { J: "running gag", E: "anxious", X: 3 }],
  ]);
  s("The Grand Budapest Hotel", 2014, "film", "A tidy, symmetric escape down a ladder of chases", "laughter, delight", "Grand Budapest Hotel ski chase", [
    [0, { S: "wide", A: "eye", M: "track", H: "smooth", C: "fast", D: "short", E: "absurd", X: 3, U: "featured", UM: "happy", W: "warm", K: "vivid color", LM: "bright and warm", PL: "outside", J: "escalation", LP: 5 }],
    [40, { S: "medium", SP: "fast", J: "slapstick", LP: 7 }],
  ]);

  /* ---------- unease and dream ---------- */
  s("The Shining", 1980, "film", "A tricycle glides through long hotel halls", "unease, dread", "The Shining tricycle hallway", [
    [0, { S: "wide", A: "low", M: "track", H: "smooth", C: "slow", D: "long", E: "curious", X: 2, U: "none", W: "warm", K: "vivid color", LM: "neutral", PL: "a room", SI: "short" }],
    [40, { X: 4, E: "anxious" }],
    [60, { S: "wide", M: "none", X: 5, E: "fearful", U: "featured", UM: "dark" }],
  ]);
  s("Get Out", 2017, "film", "A spoon in a teacup sends someone sinking", "unease, dread", "Get Out sunken place teacup scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "slow", D: "long", E: "anxious", X: 2, U: "barely there", UM: "uneasy", W: "warm", K: "muted color", LM: "dim", Q: "night", PL: "a living room", BL: "one seated", P: "slow" }],
    [60, { S: "close", M: "push in", X: 4, E: "fearful", EY: "one holds the look" }],
    [120, { S: "wide", K: "black and white", LM: "dark and harsh", E: "dreamlike", X: 5, SI: "long" }],
  ]);
  s("Inception", 2010, "film", "A street folds up over the people walking on it", "awe, unease", "Inception Paris folding city scene", [
    [0, { S: "medium", A: "eye", M: "track", H: "smooth", C: "medium", D: "medium", E: "curious", X: 1, U: "under the scene", UM: "uneasy", W: "warm", K: "natural color", LM: "soft", PL: "a street", "blocking.together": "side by side" }],
    [60, { S: "wide", A: "low", M: "crane", E: "dreamlike", X: 3, U: "featured" }],
  ]);
  s("Silent Hill 2", 2001, "game", "Walking into fog with only a radio's static", "dread, loneliness", "Silent Hill 2 fog walk", [
    [0, { S: "wide", A: "high", M: "track", H: "smooth", C: "slow", D: "long", E: "melancholy", X: 2, U: "barely there", UM: "uneasy", W: "cool", K: "muted color", LM: "dim", PL: "a street", R: "dust", SI: "long" }],
    [60, { X: 4, E: "fearful", U: "featured", UM: "dark" }],
  ]);

  /* ---------- tension in talk ---------- */
  s("Pulp Fiction", 1994, "film", "A friendly chat over breakfast before a threat", "suspense, laughter", "Pulp Fiction apartment scene", [
    [0, { S: "medium", A: "eye", M: "none", H: "locked", C: "medium", D: "medium", E: "curious", X: 2, U: "none", W: "warm", K: "natural color", LM: "neutral", PL: "a room", P: "medium", J: "banter", LP: 2, BL: "one seated" }],
    [120, { S: "close", A: "low", X: 4, E: "angry", EY: "one holds the look", P: "fast" }],
    [200, { S: "medium", C: "fast", X: 5, CH: "all chaos" }],
  ]);
  s("The Godfather", 1972, "film", "A quiet favor asked in a dark office during a wedding", "power, unease", "The Godfather opening scene", [
    [0, { S: "close", A: "eye", M: "pull out", H: "smooth", C: "slow", D: "long", E: "melancholy", X: 2, U: "none", W: "very warm", K: "muted color", LM: "dim", PL: "an office", P: "slow", SI: "short" }],
    [180, { S: "medium", A: "low", X: 3, EY: "one holds the look", BL: "one seated" }],
    [300, { S: "wide", Q: "day", LM: "bright and warm", E: "joyful", CR: "a crowd", U: "featured", UM: "happy" }],
  ]);
  s("12 Angry Men", 1957, "film", "One vote against eleven in a hot room", "tension, hope", "12 Angry Men vote scene", [
    [0, { S: "wide", A: "high", M: "none", H: "locked", C: "slow", D: "long", E: "curious", X: 2, U: "none", K: "black and white", LM: "neutral", PL: "a room", CR: "a group", BL: "one seated", P: "medium" }],
    [300, { S: "medium", A: "eye", X: 3, E: "angry", P: "fast" }],
    [900, { S: "close", A: "low", L: "long", X: 5 }],
  ]);
  s("Mass Effect 2", 2010, "game", "Choosing who lives on a final mission", "tension, loyalty", "Mass Effect 2 suicide mission choices", [
    [0, { S: "medium", A: "eye", M: "none", H: "smooth", C: "medium", D: "medium", E: "anxious", X: 4, U: "featured", UM: "uneasy", W: "cool", K: "muted color", LM: "dim", CR: "a group", ST: 5, AR: "choice" }],
    [60, { S: "close", X: 5, EY: "both hold" }],
  ]);

  root.CurioInspireScenes = { scenes, SHORT: K, into };
  if (typeof module !== "undefined") module.exports = root.CurioInspireScenes;
})(typeof window !== "undefined" ? window : globalThis);
