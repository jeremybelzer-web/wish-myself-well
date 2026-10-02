/* Lenses: a curiosity is a filter, one way of looking at a scene. Watching someone walk into a bar
   you can look through the color lens (what is the light like, is it black and white), the clothes
   lens (what era, cheap or expensive, made for a job), the set lens (marble or wood, how much art on
   the walls), the emotion lens, the comedy lens. Each lens is a main curiosity plus graded
   sub-parameters, and every sub-parameter is automatable as a lane of the main one.
   A lens suite is a group of lenses you look through together; nothing in it has to "match".
   Options are in scale order (low to high, cheap to expensive, none to a lot), so a lane that runs
   "from" one setting "to" another passes through the ones between.
   Loaded after library.js and story-curiosities.js, before model.js and automation.js. */

(function () {
  const have = new Set(CURIOSITIES.map((c) => c.id));
  const add = (lens, c) => {
    if (have.has(c.id)) return;
    have.add(c.id);
    CURIOSITIES.push(Object.assign({ live: false, source: "lenses", lens }, c, { view: c.note }));
  };
  const pick = (lens, group, id, label, options, note) => add(lens, { id, group: "Lens: " + group, label, kind: "select", options, value: options[0], note });
  const range = (lens, group, id, label, min, max, note) => add(lens, { id, group: "Lens: " + group, label, kind: "range", min, max, value: min, note });

  /* ---- Color: what the light and color of the picture are like ---- */
  const C = (id, label, opts, note) => pick("color", "Color", id, label, opts, note);
  C("colorRange", "Black and white to full color", ["black and white", "one color", "two or three colors", "muted color", "natural color", "vivid color"], "How much color the picture has, from none at all to every color turned up.");
  C("colorFilter", "Color filter", ["none", "light", "strong", "the whole picture"], "Whether the crew tinted the picture with a colored glass or a color change afterwards, and how strongly.");
  C("filterHue", "Filter color", ["red", "orange", "yellow", "green", "teal", "blue", "purple"], "The color of that tint, going around the color wheel from red to purple.");
  range("color", "Color", "colorCount", "Number of main colors", 1, 6, "How many colors you would name if you described the frame: 1 means everything is shades of one color.");
  C("colorAccent", "One color that pops", ["none", "a small spot", "one clear thing", "one thing in a strong color"], "Whether one thing (a red coat, a yellow door) stands out in a color nothing else has.");
  C("warmCool", "Warm to cool", ["very warm", "warm", "neutral", "cool", "very cool"], "Whether the picture leans orange and golden like a fire, or blue like early morning.");
  C("colorDrift", "Color change in the scene", ["steady", "slow drift", "clear shift", "sudden change"], "Whether the color stays the same through the scene or changes, slowly or all at once.");
  C("skinColorTruth", "How true skin looks", ["far off", "tinted", "slightly tinted", "true to life"], "Whether faces look their real color or take on the tint of the scene.");

  /* ---- Clothes of the main character ---- */
  const ERA = ["ancient", "medieval", "1700s", "1800s", "old west", "1920s", "1950s", "1970s", "1990s", "today", "future"];
  const COST = ["rags", "cheap", "everyday", "smart", "expensive", "luxury"];
  const COVER = ["very little", "some", "about half", "most", "fully covered"];
  const UTIL = ["only for looks", "mostly looks", "half and half", "mostly function", "all function"];
  const FUNC = ["none", "comfort", "warmth", "work wear", "sport", "riding (chaps, boots)", "crash protection (bike jacket, helmet)", "flight or space suit", "armor"];
  const WEAR = ["brand new", "clean", "worn in", "worn out", "torn and dirty"];
  const FIT = ["skin tight", "fitted", "relaxed", "loose", "baggy"];
  const FORMAL = ["sleepwear", "casual", "neat casual", "business", "formal", "ceremony"];
  const MATCH = ["clashes", "stands out", "neutral", "blends in", "matches the set"];
  const M = (id, label, opts, note) => pick("wardrobeMain", "Main character's clothes", id, label, opts, note);
  M("mainEra", "Era of the clothes", ERA, "Which time the main character's clothes come from, oldest to newest.");
  M("mainCost", "Cheap to expensive", COST, "How much the main character's clothes would cost.");
  M("mainCoverage", "How much skin is covered", COVER, "How much of the body the clothes cover, from very little to everything but the face.");
  M("mainUtility", "Looks or function", UTIL, "Whether the clothes are there to look good or to do a job.");
  M("mainFunction", "The job the clothes do", FUNC, "What the clothes are for, from nothing in particular to full protection, like leather chaps that stop a rider's legs from rubbing raw or a motorcycle jacket for a fall.");
  M("mainWear", "Wear and tear", WEAR, "How used the clothes look, from brand new to torn and dirty.");
  M("mainFit", "Fit", FIT, "How close the clothes sit to the body.");
  M("mainFormality", "Casual to formal", FORMAL, "How dressed up the main character is.");
  M("mainSetMatch", "Clothes against the set", MATCH, "Whether the clothes stand out from the room or blend into it.");

  /* ---- Clothes of the background characters ---- */
  const B = (id, label, opts, note) => pick("wardrobeBack", "Background clothes", id, label, opts, note);
  B("backEra", "Era of the clothes", ERA, "Which time the background people's clothes come from, oldest to newest.");
  B("backCost", "Cheap to expensive", COST, "How much the background people's clothes would cost.");
  B("backCoverage", "How much skin is covered", COVER, "How much of the body the background people's clothes cover.");
  B("backUtility", "Looks or function", UTIL, "Whether the background people dress to look good or to do a job.");
  B("backFunction", "The job the clothes do", FUNC, "What the background clothes are for, like work wear in a factory or riding clothes in a western.");
  B("backWear", "Wear and tear", WEAR, "How used the background clothes look.");
  B("backSameness", "All different to all alike", ["all different", "mixed", "a common style", "nearly alike", "uniforms"], "Whether the background people dress like individuals or all the same, like soldiers or waiters.");
  B("backPeriodTruth", "True to the time", ["clearly wrong", "loose", "mostly right", "exact"], "How closely the background clothes match the time the story is set in.");
  B("backVsMain", "Background against the main character", ["main blends in", "slightly apart", "clearly apart", "main is the only one dressed that way"], "How much the main character's clothes stand apart from everyone else's.");

  /* ---- Set design: the place itself ---- */
  const S = (id, label, opts, note) => pick("set", "Set design", id, label, opts, note);
  S("setStyle", "Era and style of the place", ["ancient", "rustic", "old west", "victorian", "1920s glamour", "1950s", "industrial", "modern", "futuristic"], "The time and style the place is built in, oldest to newest.");
  S("setMaterial", "Main material", ["dirt and rough wood", "wood", "brick", "stone", "metal", "glass", "marble"], "What the room is mostly made of, from rough to polished.");
  S("setLines", "Soft curves to sharp clean lines", ["soft and curved", "mostly curved", "mixed", "mostly straight", "sharp and clean"], "Whether the shapes of the room are rounded and soft or straight and sharp.");
  range("set", "Set design", "wallArt", "Art on the walls", 0, 5, "How much art hangs on the walls: 0 bare walls, 5 covered edge to edge.");
  S("artArrangement", "How the art is arranged", ["no art", "scattered", "loose groups", "neat rows", "perfectly even"], "Whether the art is hung anyhow or lined up neatly.");
  range("set", "Set design", "clutter", "Clutter", 0, 5, "How many things lie around: 0 an empty, tidy room, 5 every surface full.");
  S("layoutOpen", "Cramped to open", ["cramped", "snug", "roomy", "open", "wide open"], "How much free floor there is to move through.");
  S("setUpkeep", "Run down to spotless", ["ruined", "shabby", "lived in", "kept", "spotless"], "How well the place is looked after.");
  S("setDepth", "Layers behind the people", ["flat wall", "one layer", "a few layers", "deep"], "How far you can see behind the characters, from a wall right behind them to rooms beyond rooms.");
  S("setBrightness", "Dark to bright colors", ["dark", "dull", "middle", "light", "bright"], "How dark or bright the walls, floor and furniture are.");
  S("setLayout", "How the room is laid out", ["one long bar", "booths along the walls", "tables in the middle", "islands", "levels and balconies"], "The plan of the room, from one simple line to many areas on different levels.");

  /* ---- Emotion: what the scene feels like, and every channel it shows through ---- */
  const E = (id, label, opts, note) => pick("emotion", "Emotion", id, label, opts, note);
  range("emotion", "Emotion", "emotionIntensity", "Strength of the feeling", 0, 5, "How strong the emotion is: 0 barely there, 5 overwhelming.");
  E("emoMove", "How they move", ["frozen", "held back", "natural", "restless", "wild"], "What the feeling does to the way a character moves.");
  E("emoVoice", "Feeling in the voice", ["hidden", "a hint", "clear", "strong", "overflowing"], "How much of the feeling you can hear in how they speak.");
  range("emotion", "Emotion", "movementAmount", "Amount of movement", 0, 5, "How much the people move in the scene: 0 nobody moves, 5 constant motion.");
  range("emotion", "Emotion", "wordsAmount", "Amount said", 0, 5, "How much is said: 0 silence, 5 nonstop talk.");
  range("emotion", "Emotion", "postureChanges", "Posture changes", 0, 8, "How many times a character shifts their body (sits, stands, turns away, folds arms) in the scene.");
  E("emoActions", "Size of the actions", ["none", "small", "clear", "big", "drastic"], "How big the things they do are, from a glance to throwing a chair.");
  E("settingMood", "Mood of the place", ["oppressive", "gloomy", "neutral", "cozy", "joyful"], "The feeling the place itself gives off, apart from the people.");
  E("lightingMood", "Mood of the light", ["dark and harsh", "dim", "neutral", "soft", "bright and warm"], "The feeling the light gives off.");
  E("emoContrastPrev", "Against the last scene", ["same feeling", "a little different", "very different", "the opposite"], "How much this scene's feeling differs from the scene right before it.");

  /* ---- Emotional road: the feeling across the whole story ---- */
  const R = (id, label, opts, note) => pick("emoRoad", "Emotional road", id, label, opts, note);
  R("emoRoadCharacter", "Where this character is on their road", ["lowest point", "falling", "steady", "rising", "highest point"], "Where this scene sits on this character's emotional road through the film.");
  R("emoRoadFilm", "Where the film is on its road", ["lowest point", "falling", "steady", "rising", "highest point"], "Where this scene sits on the emotional road of the whole film.");
  R("emoTurn", "Does the feeling turn", ["holds", "wobbles", "shifts", "flips"], "Whether the character's feeling stays put in this scene or turns into something else.");
  R("emoShown", "Hidden to shown", ["fully hidden", "mostly hidden", "leaks out", "mostly shown", "fully shown"], "How much the character lets others see what they feel.");
  R("emoSpread", "How far the feeling spreads", ["no one", "one other", "a few", "the whole room"], "Whether the feeling passes from this character to the people around them.");

  /* ---- Comedy: how the scene is funny ---- */
  const K = (id, label, opts, note) => pick("comedy", "Comedy", id, label, opts, note);
  K(
    "comedyDevice",
    "Kind of joke",
    ["understatement", "irony", "deadpan", "the straight one and the funny one", "banter", "misunderstanding", "status play", "fish out of water", "reversal", "callback", "running gag", "rule of three", "escalation", "cringe", "absurdity", "slapstick"],
    "The comic idea driving the moment, from the quietest kind of joke to the loudest."
  );
  K(
    "comedyTopic",
    "What the joke is about",
    ["manners", "rules", "work", "money", "status", "family", "love", "age", "the body", "food", "technology", "fear", "ego", "death"],
    "The subject being laughed at, from the safest to the touchiest."
  );
  range("comedy", "Comedy", "comicTiming", "Pause before the punchline", 0, 4, "How many beats of silence come before the funny line or action lands.");
  range("comedy", "Comedy", "comicEscalation", "Escalation", 0, 5, "How far things snowball: 0 stays small, 5 everything spirals out of control.");
  range("comedy", "Comedy", "absurdity", "Absurdity", 0, 5, "How far from real life the situation goes: 0 could happen to anyone, 5 makes no sense at all.");
  K("comicRegister", "Deadpan to broad", ["deadpan", "dry", "playful", "big", "cartoon"], "How big the performance is, from a straight face to cartoon-sized reactions.");
  range("comedy", "Comedy", "cringe", "Cringe", 0, 5, "How awkward it is to watch: 0 comfortable, 5 you want to look away.");
  K("comicBeat", "Setup and payoff", ["nothing", "setup planted", "building", "payoff lands"], "Whether this moment plants a joke, builds on it, or delivers the laugh.");
  range("comedy", "Comedy", "payoffDistance", "Scenes from setup to payoff", 0, 10, "How many scenes pass between planting a joke and paying it off: 0 means the same scene.");
  range("comedy", "Comedy", "laughsPerMinute", "Laughs per minute", 0, 10, "How often the audience should laugh.");
  K("jokeCarrier", "Who carries the joke", ["no one", "a background person", "the straight one", "the funny one", "both", "the whole room"], "Which character the laugh comes from.");
  K("comicReaction", "Reaction to the joke", ["none", "a look", "a slow burn", "a double take", "a spit take"], "How the other characters react on screen, from ignoring it to spraying their drink.");

  /* ---- Comedy from the mix: what putting these people together produces ---- */
  const X = (id, label, opts, note) => pick("comedyMix", "Comedy from the mix", id, label, opts, note);
  X("typeClash", "How different the personalities are", ["the same type", "close types", "different types", "opposite types"], "How far apart the characters' personality types (their Enneagram numbers) are; opposites rub against each other.");
  X("chaosInRoom", "Chaos in an orderly room", ["all orderly", "one loose person", "one chaos character", "mostly chaos", "all chaos"], "How much disorder the people bring into the room.");
  X("statusGap", "Gap in rank", ["equals", "slight gap", "big gap", "master and servant"], "How far apart the characters are in power or position; a big gap makes room for status jokes.");
  X("mixPlot", "What the mix does to the plot", ["nothing", "a snag", "a detour", "a turn", "a collapse"], "How much having these people together changes where the story goes.");
  X("mixArc", "What the mix does to the characters", ["no change", "a nudge", "a push", "a break"], "How much being together changes the characters themselves.");
  X("mixLaughs", "Laughs from the mix", ["none", "a few", "steady", "the main source"], "How much of the scene's comedy comes from who is in the room rather than from jokes.");

  /* Each lens: its main curiosity and the sub-parameters offered as lanes. */
  const LENSES = [
    { id: "color", label: "Color", question: "What is the color of this scene: black and white or full color, tinted, warm or cool?", main: "colorRange", subs: ["colorFilter", "filterHue", "saturation", "colorCount", "colorAccent", "warmCool", "colorTemp", "contrast", "valueKey", "lighting", "colorDrift", "skinColorTruth"], scope: "scene" },
    { id: "wardrobeMain", label: "Main character's clothes", question: "What is the main character wearing: from when, how expensive, how much skin, and does it do a job?", main: "mainEra", subs: ["mainCost", "mainCoverage", "mainUtility", "mainFunction", "mainWear", "mainFit", "mainFormality", "mainSetMatch"], scope: "scene" },
    { id: "wardrobeBack", label: "Background clothes", question: "What are the people in the background wearing, and does it fit the time?", main: "backEra", subs: ["backCost", "backCoverage", "backUtility", "backFunction", "backWear", "backSameness", "backPeriodTruth", "backVsMain"], scope: "scene" },
    { id: "set", label: "Set design", question: "What is the place like: old or modern, marble or wood, bare walls or covered, cramped or open?", main: "setStyle", subs: ["setMaterial", "setLines", "wallArt", "artArrangement", "clutter", "layoutOpen", "setLayout", "setUpkeep", "setDepth", "setBrightness", "scale", "setting"], scope: "scene" },
    { id: "emotion", label: "Emotion", question: "What does this scene feel like, and how does the feeling show: movement, voice, face, posture, words, actions, place and light?", main: "emotion", subs: ["emotionIntensity", "emoMove", "emoVoice", "faceIntensity", "posture", "movementAmount", "wordsAmount", "postureChanges", "emoActions", "settingMood", "lightingMood", "emoContrastPrev"], scope: "scene" },
    { id: "emoRoad", label: "Emotional road", question: "Where is each character, and the film itself, on its emotional road through the story?", main: "emoRoadCharacter", subs: ["emoRoadFilm", "emoTurn", "emoShown", "emoSpread", "emotion", "arcStage"], scope: "story" },
    { id: "comedy", label: "Comedy", question: "How is this scene funny: what kind of joke, about what, how big, how timed?", main: "comedyDevice", subs: ["comedyTopic", "comicTiming", "comicEscalation", "absurdity", "comicRegister", "cringe", "comicBeat", "payoffDistance", "laughsPerMinute", "jokeCarrier", "comicReaction"], scope: "scene" },
    { id: "comedyMix", label: "Comedy from the mix", question: "Who is in the room, and what does putting them together do for the laughs, the plot and the characters?", main: "typeClash", subs: ["enneagramType", "chaosInRoom", "statusGap", "herdMentality", "mixPlot", "mixArc", "mixLaughs"], scope: "scene" },
  ];
  /* Keep only ids that exist, so a missing older curiosity never breaks a lens. */
  LENSES.forEach((l) => (l.subs = l.subs.filter((id) => have.has(id) && id !== l.main)));
  window.CURIOSITY_LENSES = LENSES;

  /* Sub-parameters become lanes of the main curiosity (automation.js merges this). */
  const facets = window.CURIOSITY_FACETS || {};
  LENSES.forEach((l) => (facets[l.main] = (facets[l.main] || []).concat(l.subs.filter((x) => !(facets[l.main] || []).includes(x)))));
  window.CURIOSITY_FACETS = facets;

  /* Reused word curiosities whose stored order is not a scale. */
  window.CURIOSITY_ORDER = Object.assign(window.CURIOSITY_ORDER || {}, {
    colorTemp: ["warm practical", "mixed", "cold day"],
    posture: ["closed", "neutral", "open"],
  });

  /* Lens suites: lenses you look through together. Nothing in a suite has to match. */
  const all = (id) => {
    const l = LENSES.find((x) => x.id === id);
    return [l.main].concat(l.subs);
  };
  const suites = LENSES.map((l) => ({ id: "lens-" + l.id, label: l.label + " lens", kind: "lens", note: l.question, lenses: all(l.id), set: {} })).concat([
    { id: "lens-look", label: "The whole look", kind: "lens", note: "Color, clothes and set seen together.", lenses: ["colorRange", "mainEra", "backEra", "setStyle"], set: {} },
    { id: "lens-period", label: "Period truth", kind: "lens", note: "Whether clothes and set all belong to the same time.", lenses: ["mainEra", "backEra", "backPeriodTruth", "setStyle", "setMaterial"], set: {} },
    { id: "lens-feeling", label: "Feeling of the scene", kind: "lens", note: "The emotion with the color and the place that carry it.", lenses: ["emotion", "emotionIntensity", "lightingMood", "settingMood", "warmCool", "colorRange", "emoContrastPrev"], set: {} },
    { id: "lens-laugh", label: "Where the laugh comes from", kind: "lens", note: "The joke and the people who make it funny.", lenses: ["comedyDevice", "comicTiming", "jokeCarrier", "typeClash", "chaosInRoom", "statusGap", "cringe"], set: {} },
  ]);
  if (typeof SUITES !== "undefined") suites.forEach((s) => SUITES.find((x) => x.id === s.id) || SUITES.push(s));
  window.CURIOSITY_LENS_SUITES = suites;

  /* Lens proximities: when x, y follows within N beats (or scenes for story-scope ones). */
  window.CURIOSITY_LENS_PROXIMITIES = [
    { id: "setup-payoff", when: "a joke's setup is planted", then: "the payoff lands", within: 3, x: { curiosity: "comicBeat", is: "setup planted" }, y: { curiosity: "comicBeat", is: "payoff lands" } },
    { id: "escalation-absurdity", when: "the escalation rises", then: "the absurdity rises", within: 1, x: { curiosity: "comicEscalation", change: "rises" }, y: { curiosity: "absurdity", change: "rises" } },
    { id: "chaos-cringe", when: "a chaos character enters an orderly room", then: "the cringe rises", within: 1, x: { curiosity: "chaosInRoom", is: "one chaos character" }, y: { curiosity: "cringe", change: "rises" } },
    { id: "opposites-laugh", when: "opposite personality types share the room", then: "more of the laughs come from the mix", within: 2, x: { curiosity: "typeClash", is: "opposite types" }, y: { curiosity: "mixLaughs", change: "rises" } },
    { id: "status-plot", when: "the gap in rank grows", then: "the plot takes a turn", within: 3, x: { curiosity: "statusGap", change: "rises" }, y: { curiosity: "mixPlot", change: "rises" } },
    { id: "pause-laughs", when: "the pause before the punchline grows", then: "laughs per minute drop but each lands harder", within: 0, x: { curiosity: "comicTiming", change: "rises" }, y: { curiosity: "laughsPerMinute", change: "drops" } },
    { id: "light-mood-intensity", when: "the mood of the light drops", then: "the strength of the feeling rises", within: 1, x: { curiosity: "lightingMood", change: "drops" }, y: { curiosity: "emotionIntensity", change: "rises" } },
    { id: "intensity-moves", when: "the feeling grows stronger", then: "the posture changes more often", within: 1, x: { curiosity: "emotionIntensity", change: "rises" }, y: { curiosity: "postureChanges", change: "rises" } },
    { id: "contrast-prev-color", when: "a scene feels the opposite of the last one", then: "the color shifts too", within: 0, x: { curiosity: "emoContrastPrev", is: "the opposite" }, y: { curiosity: "colorDrift", change: "rises" } },
    { id: "lowpoint-turn", when: "a character reaches their lowest point", then: "their feeling turns", within: 2, x: { curiosity: "emoRoadCharacter", is: "lowest point" }, y: { curiosity: "emoTurn", is: "flips" } },
    { id: "filter-bw", when: "the color filter gets strong", then: "the number of main colors drops", within: 0, x: { curiosity: "colorFilter", change: "rises" }, y: { curiosity: "colorCount", change: "drops" } },
    { id: "clutter-cramped", when: "the clutter rises", then: "the room feels more cramped", within: 0, x: { curiosity: "clutter", change: "rises" }, y: { curiosity: "layoutOpen", change: "drops" } },
    { id: "upkeep-wear", when: "the place runs down", then: "the clothes wear out too", within: 2, x: { curiosity: "setUpkeep", change: "drops" }, y: { curiosity: "mainWear", change: "rises" } },
  ];
})();
