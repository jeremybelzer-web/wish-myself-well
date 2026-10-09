/* data/writing/db-writing-movement.js: Jeremy's major categories of writing (2026-10-09): "movement as a major
   category, mainly filled by verbs and adverbs, and objects, which is a major category, mainly filled by living and
   inanimate objects. In transformative language like metaphors and similes and rhythmic language such as syllable
   count And sentence length. as well as similar word play, which has curiosities such as alliteration, rhyming, B
   rhymes, or partial rhymes, the way that Eminem uses, so that one word might equal to two words or three words. And
   also a subcategory of rhyming where they just produce the same sounds in many areas throughout the words. So not a
   strict type of rhyming, but more of a sympathetic echo. The way that sympathetic strings work on a sitar, but with
   language."
   Adds the Movement, Objects and Rhythm workspaces, files the language curiosities that already fit them there too
   (`also`), and adds what was missing: how much moves and how, objects living and not, syllables per line,
   multi-syllable rhymes, partial rhymes and the sympathetic echo. Then their suites, catalysts, elixirs and
   proximities. Loaded after db-writing-ladder.js, on ?writing=1 in Curiomatic and always in the writing app. */
(function (DB) {
  const { c, n, U, WA, M } = DB.writingHelpers;
  const WV = ["Writing"];

  DB.workspace({ id: "w-movement", label: "Movement", scope: "scene", plain: "How things move on the page, carried mainly by verbs and adverbs: how much, how fast, which way, how hard." });
  DB.workspace({ id: "w-objects", label: "Objects", scope: "scene", plain: "The things on the page, living and not: people, animals, plants, props, places, and what happens to them." });
  DB.workspace({ id: "w-rhythm", label: "Rhythm", scope: "scene", plain: "The beat of the language: syllables per line, sentence length, stresses, pauses." });
  M["w-movement"] = [2, "Movement is action, and action is plot happening.", "What moves and what stays still shows where the life of the piece is.", "The eye follows whatever moves; a sudden stop holds it.", "movement"];
  M["w-objects"] = [1, "Objects get picked up, passed on, broken and found: each one is a small plot.", "The things a piece keeps naming are what it cares about.", "A new object in the scene makes the reader ask why it is there.", "visual"];
  M["w-rhythm"] = [2, "Rhythm sets the speed the reader moves at.", "A steady beat feels safe; a broken one feels like trouble.", "When the beat changes, the reader feels it before they understand it.", "audio"];

  /* The language curiosities that already belong in these categories. */
  const also = (ws, ids) => ids.forEach((id) => { const r = DB.get("curiosity", id); if (!r) throw new Error("db-writing-movement: unknown curiosity " + id); if (!r.also.includes(ws)) r.also.push(ws); });
  also("w-movement", ["strongVerbs", "verbKind", "verbDensity", "verbPlacement", "phrasalVerbs", "ingOpeners", "beingVerbs", "adverbs", "verbVoice", "actionBeats"]);
  also("w-objects", ["nouns", "properNames", "adjectives", "colorWords", "numbers", "symbolMention", "personification", "nounPlacement", "senseWords"]);
  also("w-rhythm", ["sentenceLength", "sentenceRhythm", "meter", "syllablesPerBar", "lineBreaks", "caesura", "paragraphLength", "comma"]);

  /* ---------- Movement ---------- */
  c("motionAmount", "How much moves", "w-movement", "How much of the page is things in motion, from a still life to constant action, and how fast, which way and how hard they move.",
    [["setting", "Still to constant motion", [0, 100], "0 = nothing moves, 100 = something moves in every sentence."],
     ["speed", "Slow to fast", [0, 100], "How fast things move."],
     ["force", "Gentle to violent", [0, 100], "How hard things move: drift, push, slam."],
     ["direction", "Which way", ["toward us", "away", "across", "up", "down", "around", "scattering"], "The direction most moves take.", U],
     ["mover", "What moves", ["people", "animals", "things", "weather", "light", "the camera of the words"], "What does most of the moving.", U]],
    "Hold everything still for a paragraph, then let one thing move.", "set");
  c("motionPath", "The path of a move", "w-movement", "The shape a movement draws: straight, curving, falling, rising, spinning, scattering. On the tabletop it is the line an object's move draws.",
    [["setting", "Path", ["straight", "curving", "falling", "rising", "spinning", "zigzag", "scattering"], "The shape of the move.", U],
     ["oneOrMany", "One long move or many small", [0, 100], "0 = one long, unbroken move, 100 = many small ones."]],
    "Make the falling glass take a whole sentence to land.", "set");
  c("movementManner", "How it moves (manner)", "w-movement", "Whether the way something moves is carried by the verb itself (she staggered) or by an adverb (she walked unsteadily), and what kind of manner it is.",
    [["setting", "Verb or adverb carries it", [0, 100], "0 = the verb carries the manner, 100 = an adverb does."],
     ["manner", "Kind of manner", ["slow", "quick", "careful", "clumsy", "graceful", "heavy", "light", "sneaky"], "The manner used most.", U],
     ["adverbPlace", "Where the adverb sits", ["before the verb", "right after it", "at the end of the sentence", "opening the sentence"], "Where manner adverbs land.", U]],
    "Give every move in the scene its own exact verb and no adverbs.", "set");
  n("stillMoments", "Moments of stillness", "w-movement", "Sentences where nothing moves at all: a held breath on the page. (Curiomatic's stillness is one person's stillness in a shot.)", null,
    "Put one still sentence right before the explosion.");

  /* ---------- Objects ---------- */
  c("objectsOnPage", "Objects on the page", "w-objects", "How many things are named, living and not, and what they are like: big or small, near or far, ordinary or strange. On the tabletop every noun is an object.",
    [["setting", "Few to many", [0, 100], "0 = an empty page, 100 = crowded with things."],
     ["living", "Living or inanimate", [0, 100], "0 = all inanimate things, 100 = all living ones."],
     ["size", "Small to huge", [0, 100], "The size of the things named."],
     ["distance", "Close to far", [0, 100], "0 = in the hand, 100 = on the horizon."],
     ["strange", "Ordinary to strange", [0, 100], "0 = everyday things, 100 = things that don't belong."]],
    "Name one strange object among ten ordinary ones.", "set");
  n("livingThings", "Living things", "w-objects", "People, animals and plants on the page, and how alive they are shown to be: moving, breathing, speaking.",
    [["often", "How often", [0, 100], "How often a living thing is named."],
     ["kind", "Which kind", ["people", "animals", "plants", "crowds", "imagined creatures"], "The kind named most.", U],
     ["alive", "How alive", ["just named", "moving", "breathing", "making sounds", "speaking", "thinking"], "How much life they are given on the page."]],
    "Let an animal cross the scene and react before any person does.");
  n("inanimateThings", "Inanimate things", "w-objects", "Props, tools, furniture, buildings, landscape: the things that are not alive, and how they are kept.",
    [["often", "How often", [0, 100], "How often an inanimate thing is named."],
     ["kind", "Which kind", ["household things", "tools and machines", "clothes", "food and drink", "buildings", "landscape", "vehicles", "money and papers"], "The kind named most.", U],
     ["wear", "New to worn", [0, 100], "0 = new and shiny, 100 = worn, broken, old."],
     ["held", "Held or out of reach", [0, 100], "0 = always in someone's hand, 100 = always out of reach."]],
    "Describe a person only by the worn things they keep.");
  c("animacy", "How alive things seem", "w-objects", "Whether inanimate things act alive (the door refused) and living things are made thing-like (he was furniture to them). Personification is the figure of speech; this is how far it goes.",
    [["setting", "Dead objects to living ones", [0, 100], "0 = things are only things, 100 = things act like people."],
     ["thingified", "People made into things", [0, 100], "How often people are described as objects."]],
    "Let the house come alive while the people in it go flat.", "set");
  n("objectInteraction", "What happens to objects", "w-objects", "The verbs objects receive: held, given, dropped, broken, hidden, found, thrown. On the tabletop these are the moves.",
    [["often", "How often", [0, 100], "How often something is done to an object."],
     ["action", "What happens most", ["held", "given or passed on", "dropped", "broken", "hidden", "found", "thrown", "made"], "The thing done to objects most.", U],
     ["owner", "Changes hands", [0, 100], "How often an object passes from one person to another."]],
    "Pass one object through every character's hands in the story.");

  /* ---------- Rhythm ---------- */
  c("syllablesPerLine", "Syllables per line or sentence", "w-rhythm", "How many syllables each line (in verse or lyrics) or sentence carries, and how steady that count is. Sentence length counts words; this counts beats of sound.",
    [["setting", "Few to many", [0, 100], "0 = two or three syllables, 50 = about ten, 100 = twenty or more."],
     ["steady", "Steady or changing", [0, 100], "0 = every line the same count, 100 = every line different."],
     ["matched", "Matched across lines", [0, 100], "How closely paired lines match in count."]],
    "Keep every line at eight syllables, then give the last one four.", "set", { lanes: WA });

  /* ---------- Wordplay & sound ---------- */
  n("multiRhyme", "Multi-syllable rhymes", "w-sound", "Rhymes across two or more syllables, often spread over several words, so one word rhymes with two or three (orange / door hinge; Eminem's long chains). Rap calls them multis.",
    [["often", "How often", [0, 100], "How often a multi lands."],
     ["syllables", "Syllables matched", [0, 100], "0 = one syllable, 25 = two, 50 = three, 100 = five or more."],
     ["words", "One word to many", ["one word to one word", "one word to two words", "one word to three words", "phrase to phrase"], "How many words make each side of the rhyme."],
     ["chain", "How long the chain runs", [0, 100], "How many lines in a row carry the same multi."],
     ["place", "Where they land", ["line ends", "inside lines", "across line breaks", "everywhere"], "Where in the line the rhymes sit.", U]],
    "Rhyme one three-syllable word with three short words, and stack it four lines deep.", { lanes: WA });
  n("slantRhyme", "Partial rhymes", "w-sound", "Rhymes that are close but not exact: only the vowel matches (heart / farm), only the consonants (bill / bell), or a near sound (home / alone).",
    [["often", "How often", [0, 100], "How often a partial rhyme appears."],
     ["match", "What matches", ["vowel only", "consonants only", "near sound", "the stressed syllable only"], "Which part of the sound matches.", U],
     ["close", "How close", [0, 100], "0 = barely related, 100 = almost a true rhyme."]],
    "Use only partial rhymes in a sad verse, and one true rhyme at the end.", { lanes: WA });
  n("sympatheticEcho", "Sympathetic echo", "w-sound", "The same sounds ringing softly all through the words, not as strict rhyme but as an echo, the way a sitar's sympathetic strings ring when the played string sounds (Jeremy, 2026-10-09).",
    [["often", "How much echo", [0, 100], "0 = no echo, 100 = the same sounds ring all through."],
     ["sounds", "Which sounds echo", ["vowels", "consonants", "both", "a whole syllable"], "What kind of sound rings.", U],
     ["spread", "Near or far", [0, 100], "0 = echoes close together, 100 = spread across the whole piece."],
     ["inWord", "Where in the word", ["at the start", "inside", "at the end", "anywhere"], "Where in each word the echo sits.", U],
     ["keyWord", "Echoes one key word", [0, 100], "How much the echoes are all of one key word's sounds."],
     ["drone", "A held drone", [0, 100], "How much one sound is kept going underneath everything, like a drone."]],
    "Pick the key word of the verse and let its vowel sound turn up in every line.", { lanes: WA });

  /* ---------- Their ladder ---------- */
  const tag = { source: "writing", tags: ["writing-only"] };
  const m = (curiosity, value, slider) => (slider ? { curiosity, slider, value } : { curiosity, value });
  const S = (id, label, workspace, plain, members) => DB.suite(Object.assign({ id, label, plain, workspace, members }, tag));
  const P = (id, label, workspace, plain, when, then, within, often) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within, often }, tag));
  const E = (id, label, workspace, plain, members) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, tag));

  S("w-battle-multis", "Battle-rap multis", "w-sound", "Long multi-syllable rhymes stacked line after line, internal rhymes, packed syllables and sounds echoing through.",
    [m("multiRhyme", 80), m("multiRhyme", 75, "chain"), m("internalRhyme", 70), m("syllablesPerBar", 80), m("sympatheticEcho", 60)]);
  S("w-sitar-drone", "The sitar drone", "w-sound", "One sound held underneath, echoes everywhere, few strict rhymes, a gentle beat.",
    [m("sympatheticEcho", 85), m("sympatheticEcho", 70, "drone"), m("assonance", 60), m("endRhyme", 20), m("meter", 30)]);
  S("w-all-motion", "All motion", "w-movement", "Everything moving fast and hard, carried by strong verbs in short sentences.",
    [m("motionAmount", 90), m("motionAmount", 80, "speed"), m("strongVerbs", 85, "strength"), m("verbDensity", 70), m("sentenceLength", 20)]);
  S("w-still-life", "Still life", "w-objects", "Nothing moves; the page is full of things, looked at closely and described.",
    [m("motionAmount", 5), m("objectsOnPage", 70), m("objectsOnPage", 0, "living"), m("adjectives", 60), m("stillMoments", 70)]);
  S("w-tabletop-scene", "The tabletop", "w-objects", "A few objects, things done to them, each move drawn as a path: nouns as objects, verbs as moves.",
    [m("objectsOnPage", 30), m("objectInteraction", 70), m("objectInteraction", 50, "owner"), m("motionAmount", 50), m("movementManner", 0)]);

  P("w-multis-pack-bar", "When the multis stack up, the bars fill with syllables", "w-sound", "Long chains of multi-syllable rhymes need more syllables in every bar.",
    { curiosity: "multiRhyme", slider: "chain", change: "rises" }, { curiosity: "syllablesPerBar", change: "rises" }, 1, 70);
  P("w-echo-replaces-rhyme", "When the echo deepens, strict end rhyme falls away", "w-sound", "Once sounds ring all through the lines, the line ends no longer need to rhyme.",
    { curiosity: "sympatheticEcho", change: "rises" }, { curiosity: "endRhyme", change: "drops" }, 2, 60);
  P("w-echo-key-word", "When a key word lands, its sounds echo after it", "w-sound", "The key word's vowel or consonants turn up in the lines that follow.",
    { curiosity: "sympatheticEcho", slider: "keyWord", change: "rises" }, { curiosity: "assonance", change: "rises" }, 2, 60);
  P("w-speed-shortens", "When the motion speeds up, the sentences shorten", "w-movement", "Fast movement on the page wants short sentences.",
    { curiosity: "motionAmount", slider: "speed", change: "rises" }, { curiosity: "sentenceLength", change: "drops" }, 1, 70);
  P("w-still-describes", "When everything goes still, the describing words come in", "w-objects", "Stillness gives the reader time to look, so adjectives rise.",
    { curiosity: "motionAmount", change: "drops" }, { curiosity: "adjectives", change: "rises" }, 1, 60);
  P("w-things-wake", "When objects start acting alive, personification follows", "w-objects", "Things that refuse and wait and watch become figures of speech.",
    { curiosity: "animacy", change: "rises" }, { curiosity: "personification", change: "rises" }, 1, 80);
  P("w-steady-count-meter", "When the syllable count steadies, a meter appears", "w-rhythm", "Matched counts line after line become a beat.",
    { curiosity: "syllablesPerLine", slider: "steady", change: "drops" }, { curiosity: "meter", change: "rises" }, 2, 60);
  P("w-object-passed-plot", "When an object changes hands, the plot moves", "w-objects", "A thing given, taken or stolen is a turn in the story.",
    { curiosity: "objectInteraction", slider: "owner", change: "rises" }, { curiosity: "motionAmount", change: "rises" }, 1, 50);

  E("w-verse-ignites", "The verse that ignites", "w-sound", "Multis stack, the bars fill, the echo takes over from strict rhyme: all three, and the verse catches fire.",
    ["w-multis-pack-bar", "w-echo-replaces-rhyme", "w-echo-key-word"]);
  E("w-world-wakes", "The world wakes up", "w-objects", "Everything goes still, the things begin to act alive, and the house turns against us.",
    ["w-still-describes", "w-things-wake", "w-hostile-house-senses"]);
  E("w-chase-on-the-table", "The chase across the table", "w-movement", "An object changes hands, the motion speeds up, the sentences shorten, the action piles up.",
    ["w-object-passed-plot", "w-speed-shortens", "w-action-shortens"]);

  const near = (a, b, how, why) => ({ a, b, how, why });
  [
    near("multiRhyme", "internalRhyme", 80, "Multis often sit inside the line."),
    near("multiRhyme", "syllablesPerBar", 75, "Multis spend syllables."),
    near("slantRhyme", "endRhyme", 85, "A partial rhyme is a loosened end rhyme."),
    near("slantRhyme", "assonance", 80, "A vowel-only partial rhyme is assonance at the line end."),
    near("sympatheticEcho", "assonance", 85, "Echoed vowels are the echo's main string."),
    near("sympatheticEcho", "consonance", 80, "Echoed consonants are its other string."),
    near("sympatheticEcho", "alliteration", 60, "Alliteration is an echo at the start of words."),
    near("motionAmount", "strongVerbs", 80, "Strong verbs are how motion gets onto the page."),
    near("motionAmount", "stillMoments", 90, "Opposite ends of the same thing."),
    near("movementManner", "adverbs", 85, "Manner is the adverb's main job."),
    near("motionPath", "prepositions", 75, "Through, across, down: place words draw the path."),
    near("objectsOnPage", "nouns", 90, "Objects are nouns."),
    near("animacy", "personification", 90, "Personification is animacy as a figure of speech."),
    near("objectInteraction", "verbKind", 65, "What happens to objects is mostly physical verbs."),
    near("livingThings", "inanimateThings", 70, "The two halves of the objects on the page."),
    near("syllablesPerLine", "sentenceLength", 80, "Counting sounds against counting words."),
    near("syllablesPerLine", "meter", 75, "A steady count is the start of a meter."),
  ].forEach((p) => {
    ["a", "b"].forEach((k) => { if (!DB.get("curiosity", p[k])) throw new Error("db-writing-movement: unknown curiosity " + p[k]); });
    DB.writingProximities.push(p);
  });
})(typeof window !== "undefined" ? window.CuriosityDB : require("../curiosity-db.js"));
