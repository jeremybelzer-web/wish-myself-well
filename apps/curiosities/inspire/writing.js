/* The writing database: its own database, apart from films and games (Jeremy, 2026-10-05), with subcategories
   novels, short stories, essays and poems. Equal sources of inspiration to films and games, starting with how characters move to show what they feel. Only public-domain works, described in our
   own words: no quotes. Each passage is a few beats of curiosity values ("at" is how far through the passage,
   0 to 100), plus `movements`, the movement words it shows. Those words link to the emotion-movement archive
   (owned by the "Curiosity relationship map in 3D" work) once it exists: an id there with the same words wins.
   `search` finds the full text on Project Gutenberg. Loads after inspire/scenes.js. */
(function (root) {
  const S = root.CurioInspireScenes;
  if (!S) return;
  const works = [];
  const add = S.into(works);
  const G = (q) => q; // the search words; the hub turns them into a Gutenberg (or other) search
  /* w(work, author, year, kind, moment, feelings, movements, beats) */
  function w(work, author, year, kind, moment, feelings, movements, beats) {
    add(work, year, kind, moment, feelings, G(work + " " + author), beats, { author, movements, unit: "percent", written: true });
  }

  /* ---------- novels ---------- */
  w("Pride and Prejudice", "Jane Austen", 1813, "novel", "A proud man paces the parlor before a proposal that goes badly", "tension, anger", ["pacing", "stops still", "turns away", "face colors"], [
    [0, { pacing: "steady", stillness: 1, posture: "closed", E: "anxious", X: 2, PL: "a living room", "blocking.together": "face to face" }],
    [40, { pacing: "slow", stillness: 4, faceOff: "a few steps", E: "angry", X: 4, faceIntensity: 3 }],
    [80, { walkOut: "storms off", E: "angry", X: 5, standSit: "shoots to their feet" }],
  ]);
  w("Moby-Dick", "Herman Melville", 1851, "novel", "A captain paces the deck at night, his bone leg striking the boards", "dread, obsession", ["pacing", "heavy tread", "stares out", "stops still"], [
    [0, { pacing: "steady", characterSpeed: 2, stillness: 1, ownHabit: 4, E: "anxious", X: 3, Q: "night", PL: "outside" }],
    [60, { stillness: 5, EY: "one holds the look", E: "angry", X: 4 }],
  ]);
  w("Frankenstein", "Mary Shelley", 1818, "novel", "A maker wakes to his creation reaching toward the bed, and runs", "horror, dread", ["reaches out", "freeze in shock", "flees"], [
    [0, { stillness: 5, E: "melancholy", X: 2, Q: "night", PL: "a bedroom" }],
    [40, { characterPath: "approach", gesture: 3, X: 4, E: "fearful", AC: "freeze in shock" }],
    [70, { characterPath: "retreat", characterSpeed: 5, walkOut: "leaves for good", X: 5 }],
  ]);
  w("Jane Eyre", "Charlotte Brontë", 1847, "novel", "A child locked in a red room panics and beats at the door", "panic, dread", ["trembles", "rushes the door", "collapses"], [
    [0, { stillness: 4, posture: "closed", E: "anxious", X: 3, PL: "a room", Q: "dusk" }],
    [50, { characterSpeed: 5, gesture: 5, E: "fearful", X: 5, throughTheDoor: "a locked door" }],
    [90, { standSit: "sinks down hard", stillness: 5, E: "melancholy", X: 2 }],
  ]);
  w("Great Expectations", "Charles Dickens", 1861, "novel", "A jilted bride sits motionless among stopped clocks", "melancholy, unease", ["sits frozen", "slow turn of the head"], [
    [0, { stillness: 5, characterSpeed: 1, posture: "closed", E: "melancholy", X: 2, LM: "dim", PL: "a room" }],
    [60, { gesture: 1, leadPart: "head", EY: "one holds the look", X: 3 }],
  ]);
  w("Crime and Punishment", "Fyodor Dostoevsky", 1866, "novel", "A man creeps down a stairwell, freezing at every sound", "dread, guilt", ["creeps", "freezes", "holds breath"], [
    [0, { characterSpeed: 2, stillness: 2, posture: "closed", E: "anxious", X: 4, SI: "long" }],
    [50, { stillness: 5, AC: "freeze in shock", X: 5, E: "fearful", gazeShift: 6 }],
    [80, { characterSpeed: 4, characterPath: "retreat", X: 3 }],
  ]);
  w("Alice's Adventures in Wonderland", "Lewis Carroll", 1865, "novel", "A girl grows too big for the room and folds herself up", "absurdity, laughter", ["stretches", "shrinks", "squeezes in"], [
    [0, { squash: 2, E: "curious", J: "absurdity", LP: 3, PL: "a room" }],
    [50, { squash: 5, gesture: 4, E: "absurd", LP: 6, CH: "one chaos character" }],
  ]);
  w("The Adventures of Tom Sawyer", "Mark Twain", 1876, "novel", "A boy paints a fence slowly, pretending it is the best job in the world", "laughter, mischief", ["slow careful strokes", "steps back to admire", "pretends not to notice"], [
    [0, { characterSpeed: 1, propBusiness: 5, bodySaysOpposite: 4, E: "melancholy", J: "irony", LP: 2, PL: "outside", Q: "day" }],
    [50, { bodySaysOpposite: 5, E: "joyful", J: "reversal", LP: 5, EY: "glances" }],
  ]);
  w("Don Quixote", "Miguel de Cervantes", 1605, "novel", "A knight charges a windmill and is flung off", "laughter, absurdity", ["charges", "pratfall", "lies still"], [
    [0, { bigEntrance: 4, characterSpeed: 5, posture: "open", E: "triumphant", J: "fish out of water", LP: 4, PL: "outside" }],
    [60, { AC: "pratfall", squash: 4, E: "absurd", J: "slapstick", LP: 8 }],
    [90, { stillness: 5, standSit: "sinks down hard", LP: 5 }],
  ]);

  /* ---------- short stories ---------- */
  w("The Tell-Tale Heart", "Edgar Allan Poe", 1843, "short story", "A man takes an hour to ease his head through a door at midnight", "dread, suspense", ["inches forward", "holds still", "listens"], [
    [0, { characterSpeed: 1, stillness: 4, E: "anxious", X: 3, Q: "night", SI: "long", throughTheDoor: "a door left ajar" }],
    [60, { stillness: 5, X: 5, E: "fearful", gazeShift: 1 }],
    [90, { characterSpeed: 5, gesture: 5, X: 5, E: "angry" }],
  ]);
  w("The Gift of the Magi", "O. Henry", 1905, "short story", "A young wife lets down her hair before the mirror, then whirls to sell it", "love, heartbreak", ["lets hair down", "whirls", "stands still at the mirror"], [
    [0, { stillness: 4, gesture: 1, E: "melancholy", PL: "a room", overlap: "hair" }],
    [50, { characterSpeed: 4, arcs: "arc", E: "loving", RO: "rising" }],
  ]);
  w("The Necklace", "Guy de Maupassant", 1884, "short story", "A woman searches her dress and the floor, again and again, for a lost necklace", "panic, despair", ["searches", "frantic hands", "slumps"], [
    [0, { gesture: 4, characterSpeed: 4, gazeShift: 7, E: "anxious", X: 4, PL: "a room", Q: "night" }],
    [70, { standSit: "sinks down hard", stillness: 5, E: "melancholy", RO: "lowest point" }],
  ]);
  w("The Yellow Wallpaper", "Charlotte Perkins Gilman", 1892, "short story", "A woman creeps along the walls of her room, circling", "unease, dread", ["creeps", "circles", "crawls"], [
    [0, { characterPath: "circle", characterSpeed: 2, stillness: 2, E: "curious", X: 2, PL: "a bedroom" }],
    [70, { characterPath: "circle", ownHabit: 5, E: "dreamlike", X: 5 }],
  ]);
  w("Rip Van Winkle", "Washington Irving", 1819, "short story", "A man wakes stiff after twenty years and hobbles into a town he does not know", "absurdity, melancholy", ["stiff stretch", "hobbles", "looks around"], [
    [0, { characterSpeed: 1, poseRigLens: "straight and stiff", AC: "look around", E: "curious", PL: "a forest" }],
    [60, { characterPath: "approach", gazeShift: 6, E: "absurd", J: "fish out of water", LP: 3, PL: "a street" }],
  ]);

  /* ---------- essays ---------- */
  w("Walking", "Henry David Thoreau", 1862, "essay", "The art of sauntering: walking with no errand, open to whatever comes", "calm, wonder", ["saunters", "pauses to look"], [
    [0, { characterSpeed: 2, posture: "open", stillness: 1, E: "curious", X: 0, PL: "a forest", Q: "day" }],
    [60, { stillness: 3, E: "dreamlike" }],
  ]);
  w("On Going a Journey", "William Hazlitt", 1822, "essay", "Walking alone on a road, free to laugh, run, leap and sing", "joy, freedom", ["strides", "leaps", "sings while walking"], [
    [0, { characterSpeed: 3, posture: "open", E: "joyful", PL: "a road", Q: "day" }],
    [50, { AC: "jump for joy", gesture: 4, E: "triumphant" }],
  ]);
  w("Walking Tours", "Robert Louis Stevenson", 1876, "essay", "A walker alone on a long road falls into a happy daze, the body moving on by itself", "joy, calm", ["strides", "loose easy walk", "rests by the road"], [
    [0, { characterSpeed: 3, posture: "open", stillness: 1, E: "joyful", PL: "a road", Q: "day" }],
    [60, { characterSpeed: 2, E: "dreamlike" }],
    [90, { standSit: "sits down", stillness: 4, E: "loving", Q: "dusk" }],
  ]);

  /* ---------- poems ---------- */
  w("The Raven", "Edgar Allan Poe", 1845, "poem", "A grieving man sinks into a cushioned seat facing a bird that will not move", "dread, grief", ["sinks into a chair", "leans forward", "frozen bird"], [
    [0, { standSit: "sits down", stillness: 3, E: "melancholy", X: 2, Q: "night", PL: "a room" }],
    [50, { gesture: 3, faceOff: "across the room", EY: "both hold", X: 4, E: "anxious" }],
    [95, { stillness: 5, RO: "lowest point", X: 3 }],
  ]);
  w("Ozymandias", "Percy Bysshe Shelley", 1818, "poem", "A broken statue's sneer lies still in an empty desert", "awe, irony", ["shattered stillness"], [
    [0, { stillness: 5, faceIntensity: 4, E: "melancholy", PL: "a desert", Q: "day", S: "wide", J: "irony" }],
  ]);
  w("The Highwayman", "Alfred Noyes", 1906, "poem", "A rider gallops up a moonlit road while a girl, tied, strains to warn him", "suspense, love", ["gallops", "strains against ropes", "one finger moves"], [
    [0, { characterSpeed: 5, bigEntrance: 5, E: "loving", Q: "night", PL: "a road", X: 2 }],
    [50, { stillness: 4, gesture: 1, E: "fearful", X: 5 }],
    [90, { characterSpeed: 5, E: "angry", X: 5, RO: "lowest point" }],
  ]);
  w("Casey at the Bat", "Ernest Thayer", 1888, "poem", "A star hitter swaggers to the plate, lets two strikes go by, then swings and misses", "laughter, letdown", ["swaggers", "waves it off", "mighty swing"], [
    [0, { bigEntrance: 5, posture: "open", characterSpeed: 2, E: "triumphant", CR: "a crowd", J: "escalation", LP: 2 }],
    [50, { bodySaysOpposite: 3, AC: "wave", E: "curious", LP: 4 }],
    [95, { gesture: 5, AC: "freeze in shock", E: "absurd", J: "reversal", LP: 8 }],
  ]);
  w("I Wandered Lonely as a Cloud", "William Wordsworth", 1807, "poem", "A lonely walker comes on a field of daffodils tossing in the wind", "joy, calm", ["drifts", "stops to look", "heart dances"], [
    [0, { characterSpeed: 2, stillness: 2, E: "melancholy", PL: "outside", Q: "day" }],
    [50, { stillness: 4, E: "joyful", CR: "a sea" }],
    [90, { standSit: "sits down", E: "loving" }],
  ]);
  w("The Charge of the Light Brigade", "Alfred Tennyson", 1854, "poem", "Six hundred riders charge straight down a valley into the guns", "dread, triumph", ["charge", "ride on"], [
    [0, { characterSpeed: 5, characterPath: "approach", E: "fearful", X: 4, CR: "a sea", PL: "outside" }],
    [60, { E: "triumphant", X: 5 }],
    [90, { characterPath: "retreat", E: "melancholy", X: 2 }],
  ]);

  /* The subcategories, in the order the Source column shows them. */
  root.CurioInspireWriting = { works, KINDS: ["novel", "short story", "essay", "poem"] };
  if (typeof module !== "undefined") module.exports = root.CurioInspireWriting;
})(typeof window !== "undefined" ? window : globalThis);
