/* data/writing/db-writing-blocks.js: what the writing building-blocks study found (87 works in 6 forms: poems,
   stories, essays, ads, film lines and lyrics; ids and counts only, in
   /mnt/project-files/writing-research/writing-curiosities.json). Its proposals were mapped onto the curiosities the
   app already has; this file adds only what was new: the kind of motion, the kind of object, mosaic rhymes, rhyme
   chains and opposites side by side, then the suites, sparks and elixirs found in 5 or more works (the building-block
   rule) that the app did not have yet, and the study's proximities. Loaded after db-writing-movement.js. */
(function (DB) {
  const { c, n, U, WA } = DB.writingHelpers;

  /* ---------- New curiosities ---------- */
  const MOTION = ["walking and running", "driving and riding", "leaving and arriving", "rising", "falling", "turning", "holding and carrying", "hitting and breaking", "pouring and flowing", "dancing", "stillness"];
  c("motionKind", "Kind of motion", "w-movement", "The kind of movement the verbs carry most: walking, driving, leaving, rising, falling, turning, holding, hitting, pouring, dancing, or holding still. Hitting and breaking was the most shared (21 of 87 works).",
    [["setting", "Main motion", MOTION, "The motion that leads.", U],
     ["second", "Second motion", ["none"].concat(MOTION), "A motion running alongside.", Object.assign({ from: "none", to: "none" }, U)]],
    "Let only one kind of motion into the piece, then break it once at the end.", "set");
  const OBJECTS = ["body parts", "family", "a lover", "a crowd or a people", "animals and birds", "plants", "God and church", "house and rooms", "road and street", "car, train, ship", "water", "sky and light", "night and dark", "fire", "weather and seasons", "food and drink", "money", "weapons", "letters and books", "clothes", "tools and machines", "city"];
  c("namedThings", "Kind of object", "w-objects", "The kind of thing the piece keeps naming: body parts, family, a lover, animals, plants, the house, the road, water, the sky, food, money, weapons, letters, clothes, machines. Body parts and food were the most shared (26 of 87 works each).",
    [["setting", "Main kind", OBJECTS, "The kind of thing named most.", U],
     ["second", "Second kind", ["none"].concat(OBJECTS), "A kind running alongside.", Object.assign({ from: "none", to: "none" }, U)]],
    "Name only things you could hold in one hand.", "set");
  n("mosaicRhyme", "Mosaic rhyme", "w-sound", "One word rhymes with two or three words together: orange and door hinge. A kind of multi-syllable rhyme (found in 5 of 87 works, all rap or comic verse).",
    [["often", "How often", [0, 100], "How often a mosaic rhyme lands."],
     ["split", "Words on the split side", ["2", "3", "4 or more"], "How many words make up the other side of the rhyme."]],
    "Rhyme one long word with three short ones.", { lanes: WA });
  n("rhymeChain", "Rhyme chain", "w-sound", "One rhyme sound held for many lines in a row (found in 11 of 87 works).",
    [["often", "How often", [0, 100], "How often a held rhyme sound runs."],
     ["length", "How long it holds", [0, 100], "0 = two lines, 100 = the whole verse on one sound."]],
    "Hold one rhyme sound for eight lines, then change it on the turn.", { lanes: WA });
  n("antithesis", "Opposites side by side", "w-figures", "Two opposite ideas set next to each other in matching words: 'It was the best of times, it was the worst of times' (found in 17 of 87 works). Opposites joined is two words; this is two halves of a sentence.",
    null, "Put the two choices in matching halves of one sentence.");

  /* ---------- Their ladder ---------- */
  const tag = { source: "writing", tags: ["writing-only"] };
  const m = (curiosity, value, slider) => (slider ? { curiosity, slider, value } : { curiosity, value });
  const S = (id, label, workspace, plain, members) => DB.suite(Object.assign({ id, label, plain, workspace, members }, tag));
  const P = (id, label, workspace, plain, when, then, within, often) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within, often }, tag));
  const E = (id, label, workspace, plain, members) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, tag));

  /* The study's echo bed is Movement's sitar drone, and its long-then-punch, refrain-rhymes and repeat-then-three
     sparks are already here (w-long-then-punch, w-refrain-rhymes, w-anaphora-threes), so they are not repeated. */
  S("w-rap-avalanche", "The rap avalanche", "w-sound", "End rhyme, rhyme inside the line, many syllables rhyming at once, all held on one sound for a long run (7 of 87 works).",
    [m("endRhyme", 80), m("internalRhyme", 80), m("multiRhyme", 80), m("rhymeChain", 80), m("rhymeChain", 75, "length")]);
  S("w-strict-song", "The strict song", "w-rhythm", "A steady beat, a steady syllable count, and rhymes at the line ends (7 of 87 works).",
    [m("meter", 85), m("syllablesPerLine", 20, "steady"), m("endRhyme", 85)]);
  S("w-slogan-snap", "The slogan snap", "w-rhythm", "Short lines with few syllables, about wanting something (6 of 87 works, mostly ads).",
    [m("sentenceLength", 10), m("syllablesPerLine", 15), m("pieceTopic", "wanting")]);
  S("w-sermon-build", "The sermon build", "w-sound", "The same opening again and again, a big metaphor, and a line that keeps coming back (6 of 87 works).",
    [m("anaphora", 85), m("metaphor", 70), m("metaphor", 70, "extended"), m("refrain", 75)]);
  S("w-still-symbol", "The still symbol", "w-objects", "Everything stops, the object in view becomes a symbol, and the piece is about death (8 of 87 works).",
    [m("stillMoments", 80), m("motionKind", "stillness"), m("symbolMention", 70), m("pieceTopic", "death")]);
  S("w-violence-kit", "The violence kit", "w-movement", "Hitting and breaking, weapons, and a piece about war or crime (6 of 87 works).",
    [m("motionKind", "hitting and breaking"), m("namedThings", "weapons"), m("pieceTopic", "war and violence")]);
  S("w-love-refrain", "The love refrain", "w-sound", "A lover named, a piece about love, and a line that keeps coming back (9 of 87 works).",
    [m("namedThings", "a lover"), m("pieceTopic", "love"), m("refrain", 80)]);
  S("w-body-blow", "The body blow", "w-movement", "Body parts, something hitting them, in short sentences (5 of 87 works).",
    [m("namedThings", "body parts"), m("motionKind", "hitting and breaking"), m("sentenceLength", 15)]);
  S("w-boast", "The boast", "w-words", "Who I am and how much power I have (8 of 87 works).",
    [m("pieceTopic", "who I am"), m("pieceTopic", "power", "second")]);
  S("w-twist-object", "The twist object", "w-figures", "An object that becomes a symbol, and an ironic twist on it (7 of 87 works).",
    [m("symbolMention", 70), m("verbalIrony", 70)]);

  const rise = (curiosity, slider) => (slider ? { curiosity, slider, change: "rises" } : { curiosity, change: "rises" });
  const is = (curiosity, value) => ({ curiosity, is: value });
  P("w-chain-goes-multi", "When a rhyme sound is held, the rhymes grow to more syllables", "w-sound", "A long rhyme chain pushes the rhymes from one syllable to two and three (8 of 87 works).",
    rise("rhymeChain", "length"), rise("multiRhyme", "syllables"), 2, 70);
  P("w-multi-goes-mosaic", "When rhymes grow to several syllables, one word gets split across two or three", "w-sound", "Once the multis are long, mosaic rhymes follow (5 of 87 works).",
    rise("multiRhyme", "syllables"), rise("mosaicRhyme"), 4, 60);
  P("w-rhyme-wakes-echo", "When an end rhyme lands, its sound rings on inside the next line", "w-sound", "The rhyme's vowel keeps sounding inside the following line (11 of 87 works).",
    rise("endRhyme"), rise("sympatheticEcho"), 1, 70);
  P("w-question-then-refrain", "When a question is asked, the refrain answers it", "w-sound", "The hook comes back as the answer (8 of 87 works).",
    rise("rhetoricalQuestion"), rise("refrain"), 4, 60);
  P("w-still-makes-symbol", "When motion stops, the object in view becomes a symbol", "w-objects", "Stillness makes the reader look, and what they look at starts to mean something (12 of 87 works).",
    rise("stillMoments"), rise("symbolMention"), 3, 70);
  P("w-strike-then-death", "When something strikes, death follows", "w-movement", "A blow on the page, and a death within a few sentences (9 of 87 works).",
    is("motionKind", "hitting and breaking"), is("pieceTopic", "death"), 3, 60);
  P("w-command-then-refrain", "When a command is given, it becomes the line that comes back", "w-sound", "An order (go, rise, do it) turns into the refrain (13 of 87 works, the most shared spark).",
    is("grammarMood", "command"), rise("refrain"), 2, 70);
  P("w-simile-grows-metaphor", "When a simile is used, it grows into a metaphor", "w-figures", "'Like a furnace' becomes 'the furnace' a few sentences on (6 of 87 works).",
    rise("simile"), rise("metaphor"), 4, 60);
  P("w-contrast-in-parallel", "When opposites are set side by side, they share the same opening", "w-figures", "'Ask not what… ask what…': the two halves start the same way (9 of 87 works).",
    rise("antithesis"), rise("anaphora"), 1, 70);
  P("w-repeat-then-command", "When openings repeat, a command comes", "w-sound", "The repeated openings build until they turn into an order (9 of 87 works).",
    rise("anaphora"), is("grammarMood", "command"), 2, 60);

  E("w-rap-avalanche-lock", "The rap avalanche", "w-sound", "A rhyme sound is held, the rhymes grow longer, and the sound rings on inside the lines: all of it, and the verse avalanches. Add the mosaic spark for the full Big Pun version.",
    ["w-chain-goes-multi", "w-rhyme-wakes-echo"]);
  E("w-sermon", "The sermon", "w-sound", "The same opening again and again turns into a command, and the command comes back as the refrain.",
    ["w-repeat-then-command", "w-command-then-refrain"]);
  E("w-quiet-ending", "The quiet ending", "w-objects", "Something strikes, someone dies, everything goes still, and the object left in view becomes the symbol.",
    ["w-strike-then-death", "w-still-makes-symbol"]);
  E("w-asked-and-answered", "Asked and answered", "w-sound", "A question, answered by the refrain, and the refrain lands on a rhyme.",
    ["w-question-then-refrain", "w-refrain-rhymes"]);

  /* The study's proximities: tags mapped onto curiosities, pairs that land on one curiosity or are already here dropped. */
  const near = (a, b, how, why) => ({ a, b, how, why });
  const have = new Set(DB.writingProximities.map((p) => [p.a, p.b].sort().join("|")));
  [
    near("meter", "endRhyme", 100, "Steady beat (meter) and end rhyme: both in 12 of the 87 works studied."),
    near("namedThings", "pieceTopic", 100, "Family members and family: both in 12 of the 87 works studied."),
    near("endRhyme", "multiRhyme", 100, "End rhyme and multi-syllable rhyme: both in 12 of the 87 works studied."),
    near("rhymeChain", "endRhyme", 100, "Rhyme chain and end rhyme: both in 11 of the 87 works studied."),
    near("sentenceType", "sentenceLength", 100, "Fragments and short lines or sentences carry it: both in 7 of the 87 works studied."),
    near("stillMoments", "symbolMention", 92, "Stillness and an object becomes a symbol: both in 12 of the 87 works studied."),
    near("endRhyme", "internalRhyme", 88, "End rhyme and rhyme inside lines: both in 14 of the 87 works studied."),
    near("motionKind", "namedThings", 88, "Pouring and body parts: both in 7 of the 87 works studied."),
    near("sentenceLength", "listsOfThree", 86, "Short lines or sentences carry it and groups of three: both in 6 of the 87 works studied."),
    near("sympatheticEcho", "endRhyme", 85, "Sympathetic echo and end rhyme: both in 11 of the 87 works studied."),
    near("internalRhyme", "multiRhyme", 83, "Rhyme inside lines and multi-syllable rhyme: both in 10 of the 87 works studied."),
    near("sentenceLength", "pieceTopic", 82, "Short lines or sentences carry it and wanting: both in 14 of the 87 works studied."),
    near("namedThings", "properNames", 80, "City and streets and a real place name: both in 8 of the 87 works studied."),
    near("sympatheticEcho", "internalRhyme", 77, "Sympathetic echo and rhyme inside lines: both in 10 of the 87 works studied."),
    near("rhymeChain", "sympatheticEcho", 73, "Rhyme chain and sympathetic echo: both in 8 of the 87 works studied."),
    near("namedThings", "endRhyme", 73, "Sky and end rhyme: both in 8 of the 87 works studied."),
    near("rhymeChain", "internalRhyme", 73, "Rhyme chain and rhyme inside lines: both in 8 of the 87 works studied."),
    near("pieceTopic", "metaphor", 73, "Freedom and metaphor: both in 8 of the 87 works studied."),
    near("rhymeChain", "multiRhyme", 73, "Rhyme chain and multi-syllable rhyme: both in 8 of the 87 works studied."),
    near("namedThings", "sentenceLength", 69, "Car and short lines or sentences carry it: both in 9 of the 87 works studied."),
    near("grammarMood", "refrain", 68, "Commands to act (go and a line that keeps coming back: both in 13 of the 87 works studied."),
    near("properNames", "sentenceLength", 67, "A real place name and long piled-up sentences: both in 10 of the 87 works studied."),
    near("motionKind", "pieceTopic", 67, "Hitting and fear: both in 8 of the 87 works studied."),
    near("refrain", "pieceTopic", 67, "A line that keeps coming back and fear: both in 8 of the 87 works studied."),
    near("multiRhyme", "pieceTopic", 67, "Multi-syllable rhyme and who I am: both in 8 of the 87 works studied."),
    near("motionKind", "metaphor", 67, "Rising and metaphor: both in 6 of the 87 works studied."),
    near("sentenceLength", "hyperbole", 67, "Short lines or sentences carry it and exaggeration: both in 6 of the 87 works studied."),
    near("antithesis", "metaphor", 65, "Opposites side by side and metaphor: both in 11 of the 87 works studied."),
    near("stillMoments", "namedThings", 64, "Stillness and plants: both in 7 of the 87 works studied."),
    near("namedThings", "symbolMention", 64, "Plants and an object becomes a symbol: both in 7 of the 87 works studied."),
    near("motionKind", "symbolMention", 64, "Driving and an object becomes a symbol: both in 7 of the 87 works studied."),
    near("refrain", "rhymeChain", 64, "A line that keeps coming back and rhyme chain: both in 7 of the 87 works studied."),
    near("namedThings", "metaphor", 64, "Sky and metaphor: both in 7 of the 87 works studied."),
    near("rhetoricalQuestion", "sentenceLength", 62, "Questions and short lines or sentences carry it: both in 10 of the 87 works studied."),
    near("stillMoments", "pieceTopic", 62, "Stillness and death: both in 8 of the 87 works studied."),
    near("anaphora", "sentenceLength", 61, "Repeated openings and short lines or sentences carry it: both in 14 of the 87 works studied."),
    near("refrain", "endRhyme", 60, "A line that keeps coming back and end rhyme: both in 18 of the 87 works studied."),
    near("namedThings", "refrain", 60, "Night and a line that keeps coming back: both in 6 of the 87 works studied."),
    near("namedThings", "simile", 60, "Night and simile: both in 6 of the 87 works studied."),
    near("endRhyme", "allusion", 60, "End rhyme and allusion: both in 6 of the 87 works studied."),
    near("listsOfThree", "pieceTopic", 60, "Lists and catalogs and money: both in 6 of the 87 works studied."),
  ].forEach((p) => {
    ["a", "b"].forEach((k) => { if (!DB.get("curiosity", p[k])) throw new Error("db-writing-blocks: unknown curiosity " + p[k]); });
    const key = [p.a, p.b].sort().join("|");
    if (!have.has(key)) { have.add(key); DB.writingProximities.push(p); }
  });
})(typeof window !== "undefined" ? window.CuriosityDB : require("../curiosity-db.js"));
