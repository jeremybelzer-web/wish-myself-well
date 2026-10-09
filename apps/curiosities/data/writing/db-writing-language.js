/* data/writing/db-writing-language.js: the elements of language, each as a curiosity (Jeremy, 2026-10-08: "create curiosities
   for verb structures and frequency. Verb tense ... Sentence structure. Placement of nouns, placement of adjectives,
   placement of similes, placement of metaphors, placement of personification, placement of alliteration, frequency
   of all of these things, frequency between different characters, frequency from the third person narrative or the
   narrative voice ... Every category we can think of that can be a curiosity, we should make one. And then I can
   review it later.").
   Writing-only: Curiomatic loads it only on ?writing=1; the writing app always does. It sits in Curiomatic's data/
   folder so both apps reach it online. Loads after Curiomatic's database. Ideas Curiomatic already has
   (typeTalk, unreliableView, listenerPlace, themeAloud, wordplay, wordsAmount, vocalTone, understatement) are linked to, not repeated.
   Every countable thing (a word class, a figure of speech, a punctuation mark) carries the same nine sliders, so the
   app can read them off a passage and automate them sentence by sentence:
     how often, where in the sentence, spacing, gap between two, what it is about,
     narration or dialogue, spread across characters, which narrative voice, change from sentence to sentence.
   Settings that are not counted (tense, person, sentence type) carry the last four of those.
   Every row is tagged Writing; the sound of the words is also Audio. Sliders run 0 to 100 unless they are a scale. */
(function (DB) {
  const U = { unordered: true };
  const W = ["Writing"], WA = ["Writing", "Audio"];

  DB.workspace({ id: "w-verbs", label: "Verbs & tense", scope: "scene", plain: "How the verbs work: tense, aspect, voice, mood, and what kind of action they carry." });
  DB.workspace({ id: "w-sentence", label: "Sentence & paragraph", scope: "scene", plain: "How sentences and paragraphs are built: length, type, word order, openings, endings, punctuation." });
  DB.workspace({ id: "w-words", label: "Words", scope: "scene", plain: "Which words get used: nouns, adjectives, adverbs, how fancy, how concrete, how fresh." });
  DB.workspace({ id: "w-figures", label: "Transforming language", scope: "scene", plain: "Language that turns one thing into another (figures of speech): similes, metaphors, personification and the other figures: how often, where, how spaced, and about what." });
  DB.workspace({ id: "w-sound", label: "Wordplay & sound", scope: "scene", plain: "How the words sound and play off each other: rhyme of every kind, alliteration, echoes, meter, line breaks." });
  DB.workspace({ id: "w-voice", label: "Voice & point of view", scope: "story", plain: "Who tells it, in which person, how close to a mind, and how each character's words differ." });
  DB.workspace({ id: "w-dialogue", label: "Dialogue on the page", scope: "scene", plain: "How speech is set on the page: tags, beats, length, interruptions, and each speaker's habits." });

  const SUBJECTS = ["nature", "the sea", "weather", "the body", "animals", "food", "machines", "the city", "home", "money", "war", "religion", "light and dark", "time", "the character's feelings", "anything"];
  const PLACES = ["opens the sentence", "early", "middle", "late", "ends the sentence"];
  const VOICES = ["first person (I)", "second person (you)", "first person plural (we)", "third person limited", "third person omniscient", "any voice"];

  /* The shared "who and where" sliders: Jeremy's frequency between characters and per narrative voice. */
  const SPREAD = [
    ["narration", "Narration or dialogue", [0, 100], "0 = only in characters' speech, 50 = both, 100 = only in the narration."],
    ["byCharacter", "Spread across characters", [0, 100], "0 = one character owns it, 100 = every speaker uses it the same amount."],
    ["byVoice", "Narrative voice it shows up in", VOICES, "Which narrative voice uses it most.", Object.assign({ from: "any voice", to: "any voice" }, U)],
    ["change", "Change from sentence to sentence", [0, 100], "0 = steady all the way through, 100 = lurches every sentence. Attention moves when something shifts."],
  ];
  /* The counted sliders: how often, where, how spaced, about what. */
  const COUNT = [
    ["often", "How often", [0, 100], "0 = never, 50 = now and then, 100 = in nearly every sentence (or line)."],
    ["place", "Where in the sentence", PLACES, "Where it tends to sit in the sentence or line."],
    ["spacing", "Spacing", ["evenly spread", "a steady pattern", "in clusters", "saved for big moments"], "How the uses are spread across the passage.", U],
    ["gap", "Gap between two", [0, 100], "0 = back to back, 100 = many sentences apart."],
    ["subject", "What it is about", SUBJECTS, "The subject it draws on or describes.", Object.assign({ from: "anything", to: "anything" }, U)],
  ];

  /* Momentum by workspace: [push, plot, theme, pull, cue]. tryThis is per row. */
  const M = {
    "w-verbs": [2, "Verbs carry the action, so their tense and strength set how fast the story seems to move.", "Which verbs a writer reaches for shows what the piece thinks matters: doing, feeling or thinking.", "A change in tense or a sudden strong verb tells the reader to look up.", "movement"],
    "w-sentence": [2, "Sentence shape sets the pace: short ones hurry the reader toward what happens next.", "How sentences are built is the voice's character made visible.", "A break in the pattern (one short line after long ones) pulls the eye to that spot.", "plot"],
    "w-words": [1, "Word choice decides what the reader can picture, and so what they expect to happen.", "The words a piece uses again and again are where its theme lives.", "A word from outside the usual vocabulary makes the reader stop on it.", "thought"],
    "w-figures": [1, "A figure of speech can hint at where things are going before the plot says so.", "The subjects a writer's metaphors keep returning to are a second theme running underneath.", "A striking image holds attention for a beat and makes the next line land harder.", "visual"],
    "w-sound": [1, "Sound patterns carry the reader forward line to line, like a beat under the words.", "Sound can agree with the meaning or fight it, which is where tone hides.", "A rhyme or a repeated sound makes the ear wait for the next one.", "audio"],
    "w-voice": [3, "Who tells it and how close we sit to a mind decides what the reader can know, and so what can surprise them.", "Point of view is where the piece says whose life matters.", "A shift in voice or distance makes the reader ask who is speaking now.", "thought"],
    "w-dialogue": [2, "What people say and how they are cut off moves the plot between them.", "How each person talks is who they are.", "A line left unsaid or cut off makes the reader lean in.", "audio"],
  };

  /* c(id, label, workspace, plain, sliders, tryThis, kind, extra)
     kind "count" adds COUNT + SPREAD after the row's own sliders; "set" adds SPREAD only. */
  function c(id, label, ws, plain, sliders, tryThis, kind, extra) {
    if (DB.get("curiosity", id)) throw new Error("db-writing-language: id already used by Curiomatic: " + id);
    const own = (sliders || []).slice();
    const all = kind === "count" ? (own.length ? own : []).concat(COUNT.filter((s) => !own.some((o) => o[0] === s[0]))) : own;
    const rows = all.concat(SPREAD.filter((s) => !all.some((o) => o[0] === s[0])));
    const m = M[ws];
    const row = DB.curiosity(Object.assign({ id, label, plain, workspace: ws, group: "Writing", kind: "measure", per: "sentence", main: rows[0][0], sliders: rows, source: "writing", tags: ["writing-only"] }, extra || {}));
    row.lanes = (extra && extra.lanes) || W;
    row.momentum = { push: (extra && extra.push) != null ? extra.push : m[0], plot: m[1], theme: m[2], pull: m[3], cue: m[4], tryThis };
    return row;
  }
  /* A counted element whose main slider is How often. */
  const n = (id, label, ws, plain, extra, tryThis, more) => c(id, label, ws, plain, extra || [], tryThis, "count", more);
  /* Later writing files (db-writing-movement.js) add rows the same way. */
  DB.writingHelpers = { c, n, U, W, WA, M };

  /* ---------- Verbs & tense ---------- */
  c("tense", "Tense", "w-verbs", "When the telling happens: past (he walked), present (he walks), future (he will walk), or shifting between them.",
    [["setting", "Tense", ["past", "present", "future", "shifting"], "The main tense of the narration.", U],
     ["shifts", "How often the tense shifts", [0, 100], "0 = one tense all the way through, 100 = it moves between tenses often."]],
    "Tell the memory in past tense, then snap into present for the moment it all goes wrong.", "set");
  c("verbAspect", "Aspect", "w-verbs", "Whether an action is a single event (looked), still going on (was looking), finished before (had looked), or ongoing up to a point (had been looking).",
    [["setting", "Aspect", ["simple", "ongoing", "finished", "finished and ongoing"], "The verb shape used most.", U]],
    "Hold a scene in 'was looking' and 'was waiting', then break it with one simple verb: 'He turned.'", "set");
  c("verbVoice", "Active or passive", "w-verbs", "Whether the doer comes first (the dog bit the man) or the thing done to does (the man was bitten).",
    [["setting", "Active to passive", [0, 100], "0 = always active, 100 = mostly passive."],
     ["hidesDoer", "Hides who did it", [0, 100], "How often the passive leaves out who did it ('mistakes were made')."]],
    "Let a guilty character slip into the passive whenever they describe what they did.", "set");
  c("grammarMood", "Statement, question, command or wish", "w-verbs", "The grammatical mood: saying what is (it is a window), asking (is it a window?), ordering (look through the window), or wishing (if only it were a window).",
    [["setting", "Mood", ["statement", "question", "command", "wish or what-if"], "The mood used most.", U]],
    "End a chapter of statements on a single question.", "set");
  c("verbKind", "Kind of verb", "w-verbs", "What sort of action the verbs carry: physical (slammed), seeing (watched), thinking (wondered), feeling (longed), speaking (whispered) or just being (was, seemed).",
    [["setting", "Kind", ["physical", "seeing and sensing", "thinking", "feeling", "speaking", "being"], "The kind used most.", U],
     ["physicalShare", "Share of physical verbs", [0, 100], "How much of the action is bodies moving through space."]],
    "Write a sad scene with only physical verbs and no feeling verbs at all.", "set");
  n("strongVerbs", "Verb strength", "w-verbs", "How vivid the verbs are: weak (went, got, was) to strong and exact (staggered, snatched, gleamed).",
    [["strength", "Weak to strong", [0, 100], "0 = plain, general verbs, 100 = vivid, exact ones."]],
    "Replace every 'went' in a chase with a different exact verb.");
  n("beingVerbs", "Being verbs", "w-verbs", "How often 'is', 'was', 'seemed' and 'had' carry the sentence instead of an action.", null,
    "Cut 'was' from a paragraph and see what verbs move in.");
  n("modalVerbs", "Can, could, must, might", "w-verbs", "How often the helping verbs of possibility and duty appear, and which way they lean.",
    [["often", "How often", [0, 100], "How often a modal verb appears."],
     ["leaning", "Possibility to duty", ["might, maybe", "could", "can", "should", "must"], "Whether the voice dwells on what might be or what must be."]],
    "Give the anxious character 'might' and 'could'; give the boss 'will' and 'must'.");
  n("phrasalVerbs", "Phrasal verbs", "w-verbs", "Two-word verbs like 'give up', 'run into', 'put off' that sound casual and spoken, against single formal verbs (abandon, encounter, postpone).", null,
    "Write the teenager in phrasal verbs and her lawyer in single formal ones.");
  n("ingOpeners", "-ing phrases", "w-verbs", "Phrases built on an -ing verb ('Turning, she saw...') that stack actions together.", null,
    "Use one -ing opener per page, no more, and save it for a turn of the body.");
  n("negation", "Not, never, no", "w-verbs", "How often actions are described by what did not happen.", null,
    "Describe the party only by what the guest of honor did not do.");
  c("certainty", "Certainty", "w-verbs", "How sure the telling is: flat fact (it was a window), doubt (he thought it was a window), or open guessing (maybe it was a window).",
    [["setting", "Sure to unsure", [0, 100], "0 = everything stated as fact, 100 = everything hedged or guessed."],
     ["hedges", "Hedge words", [0, 100], "How often words like 'maybe', 'perhaps', 'sort of', 'seemed' soften a line."]],
    "Let the narrator grow more certain as they get closer to the truth, or less.", "set");
  c("verbPlacement", "Where the verb comes", "w-verbs", "Whether the main verb arrives early in the sentence (she ran down the hill) or is held back to the end (down the hill, past the gate, she ran).",
    [["setting", "Early to late", PLACES, "Where the main verb lands."]],
    "Hold the verb back to the last word of the sentence where the character finally acts.", "set");
  n("verbDensity", "Verbs per sentence", "w-verbs", "How many actions are packed into each sentence: one, or a chain (she grabbed, spun, ran).",
    [["often", "Verbs per sentence", [0, 100], "0 = one verb, 100 = a long chain of actions."]],
    "Write the fight as one sentence with seven verbs.");

  /* ---------- Sentence & paragraph ---------- */
  c("sentenceLength", "Sentence length", "w-sentence", "How long the sentences are, in words.",
    [["setting", "Short to long", [0, 100], "0 = a few words, 50 = about 15 words, 100 = 40 words or more."],
     ["variety", "Variety", [0, 100], "0 = all about the same length, 100 = wildly different from one to the next."]],
    "Shorten every sentence as the climax gets closer.", "set");
  c("sentenceRhythm", "Sentence rhythm", "w-sentence", "The rhythm of long, short and medium sentences, drawn as one bar per sentence (Jeremy, 2026-10-05). The writing version of cut rhythm in film.",
    [["mix", "Mix of short, medium and long", ["mostly short", "short and medium", "even mix", "medium and long", "mostly long"], "The overall mix."],
     ["regular", "Steady beat or surprise", [0, 100], "0 = a regular pattern, 100 = every length a surprise."],
     ["run", "Run length", [0, 100], "How many sentences of a similar length come in a row before a change."],
     ["punch", "The punch", [0, 100], "How often a very short sentence lands right after long ones."]],
    "Three long, rolling sentences, then: 'He didn't.'", "set");
  c("sentenceType", "Sentence type", "w-sentence", "Simple (one clause), compound (two joined by and/but), complex (a clause inside), compound-complex, or a fragment ('A window.').",
    [["setting", "Type", ["fragment", "simple", "compound", "complex", "compound-complex"], "The type used most."],
     ["fragments", "Fragments", [0, 100], "How often a sentence is a fragment."]],
    "Write the panic in fragments and the calm after in complex sentences.", "set");
  c("sentenceFunction", "Statements, questions, commands, exclamations", "w-sentence", "The mix of sentences that tell, ask, order and exclaim.",
    [["setting", "Most common", ["statement", "question", "command", "exclamation"], "The kind used most.", U],
     ["questions", "Share of questions", [0, 100], "How much of the passage asks."],
     ["exclaims", "Share of exclamations", [0, 100], "How much of the passage exclaims."]],
    "Let a narrator who has only made statements suddenly ask the reader a question.", "set");
  c("wordOrder", "Word order", "w-sentence", "Subject first (Harry looked through the window), something put in front (Through the window, Harry looked), or turned around (Through the window looked Harry).",
    [["setting", "Order", ["subject first", "something fronted", "inverted", "scrambled for effect"], "The order used most."]],
    "Use one inverted sentence in the whole piece, at the most solemn moment.", "set");
  c("sentenceOpener", "How sentences begin", "w-sentence", "What comes first: the subject, a time or place phrase, an -ing phrase, a clause (When she left...), a conjunction (And...), or dialogue.",
    [["setting", "Opener", ["the subject", "time or place", "an -ing phrase", "a clause", "And or But", "dialogue"], "The opening used most.", U],
     ["sameOpener", "Same opener in a row", [0, 100], "How often several sentences in a row begin the same way."]],
    "Start five sentences in a row with 'And' to build a breathless list of what went wrong.", "set");
  c("sentenceEnding", "How sentences end", "w-sentence", "Whether the strongest word lands at the end of the sentence (the punch word), or the sentence trails off.",
    [["setting", "Trailing to punch", [0, 100], "0 = the sentence trails off, 100 = the strongest word is always last."]],
    "Rewrite each key sentence so its most important word is the last one.", "set");
  c("clauses", "Clauses per sentence", "w-sentence", "How many parts each sentence holds, and whether they are joined as equals (and, but) or one hangs off another (because, although, which).",
    [["setting", "One to many", [0, 100], "0 = one clause, 100 = many."],
     ["subordinate", "Equal or hanging", [0, 100], "0 = joined as equals, 100 = mostly hanging off a main clause."]],
    "Give the lawyer long chains of 'which' and 'although'; give the farmer 'and' and 'and'.", "set");
  c("mainPoint", "Main point first or last", "w-sentence", "Loose sentences give the main point first and add details after; periodic sentences hold the main point to the end.",
    [["setting", "First to last", [0, 100], "0 = main point first, 100 = held to the end."]],
    "Hold the main point back in the sentence that reveals the twist.", "set");
  n("parallelism", "Parallel structure", "w-sentence", "Matching shapes in a row: 'to laugh, to cry, to leave'; 'we came, we saw, we left'.", null,
    "Build the speech's last line in three matching parts.");
  n("listsOfThree", "Lists and threes", "w-sentence", "Lists, and especially lists of three, with the third item as the twist.",
    [["often", "How often", [0, 100], "How often a list appears."],
     ["items", "Items in a list", [0, 100], "0 = two, 30 = three, 100 = long piles."],
     ["joiners", "And, and, and or no and", ["no joiners (came, saw, left)", "one and", "and, and, and"], "How the items are joined."]],
    "Make the third thing in every list a little stranger than the first two.");
  c("nounPlacement", "Where the nouns sit", "w-sentence", "Whether the important nouns are the subject at the front, the object after the verb, or saved for the end of the sentence.",
    [["setting", "Front to end", PLACES, "Where the key noun tends to land."],
     ["subjectIsPerson", "Who is the subject", [0, 100], "0 = things and ideas are the subjects, 100 = people are."]],
    "Make objects the subject of every sentence in the haunted room: 'The door opened. The stairs waited.'", "set");
  c("adjectivePlacement", "Where the adjectives sit", "w-sentence", "Before the noun (the cold room), after it (the room, cold and bare), stacked (the cold, bare, silent room), or alone after a verb (the room was cold).",
    [["setting", "Placement", ["before the noun", "after the noun", "after a verb", "stacked"], "The placement used most.", U],
     ["stack", "How many stacked", [0, 100], "0 = one at a time, 100 = three or more in a pile."]],
    "Move one adjective after its noun ('the room, cold') and see it get louder.", "set");
  c("modifierDistance", "How far a describing word sits from its word", "w-sentence", "Whether describing words sit right beside what they describe, or are spread across the sentence.",
    [["setting", "Close to far", [0, 100], "0 = right beside, 100 = far across the sentence."]],
    "Keep descriptions tight beside their nouns in action scenes.", "set");
  n("comma", "Commas", "w-sentence", "How many commas: few (fast, plain), or many (pauses, layers, asides).", null,
    "Strip the commas from the chase and add them back in the aftermath.");
  n("dash", "Dashes", "w-sentence", "Dashes for interruptions, asides and sudden turns.", null,
    "Use a dash where a thought breaks off.");
  n("semicolon", "Semicolons and colons", "w-sentence", "Semicolons joining close thoughts, colons announcing what comes next.", null,
    "Let a careful, educated narrator use the semicolon; never let the teenager.");
  n("ellipsis", "Ellipses", "w-sentence", "Trailing dots for pauses, hesitation, and things left unsaid...", null,
    "Give the ellipsis only to the character who can't finish what they mean.");
  n("exclamation", "Exclamation marks", "w-sentence", "How often a sentence ends in an exclamation mark.", null,
    "Allow one exclamation mark in the whole story.");
  n("parentheses", "Asides in brackets", "w-sentence", "(Asides in brackets) that whisper something extra to the reader.", null,
    "Let the narrator's brackets slowly reveal what they really think.");
  c("italics", "Italics and emphasis", "w-sentence", "Italic or bold words for stress, thoughts, foreign words or titles.",
    [["setting", "Never to often", [0, 100], "How often words are set in italics."],
     ["use", "What italics mark", ["stress", "thoughts", "foreign words", "titles", "signs and messages"], "What the italics are used for most.", U]],
    "Put the character's thoughts in italics only when they disagree with what they say.", "set");
  c("paragraphLength", "Paragraph length", "w-sentence", "How long the paragraphs are, from one line to a full page.",
    [["setting", "One line to a page", [0, 100], "0 = one-line paragraphs, 100 = page-long blocks."],
     ["variety", "Variety", [0, 100], "How much paragraph lengths change."],
     ["oneLiners", "One-line paragraphs", [0, 100], "How often a paragraph is a single line set alone for weight."]],
    "Set the line that changes everything as its own paragraph.", "set");
  c("whiteSpace", "White space", "w-sentence", "How much empty page there is: breaks between sections, short lines, gaps that give the reader a breath.",
    [["setting", "Dense to airy", [0, 100], "0 = a solid wall of text, 100 = lots of air."],
     ["sceneBreaks", "Section breaks", [0, 100], "How often a blank line or mark breaks the text."]],
    "Use a blank line instead of writing the time jump.", "set");
  c("chapterEnding", "How chapters end", "w-sentence", "Whether a chapter ends on a question, a cliffhanger, a quiet image, a line of dialogue, or a resolution.",
    [["setting", "Ending", ["resolution", "quiet image", "line of dialogue", "question", "cliffhanger"], "The ending used most."],
     ["chapterLength", "Chapter length", [0, 100], "0 = a page or two, 100 = long chapters."]],
    "End on the first line of the next scene instead of the last line of this one.", "set");

  c("pieceShape", "What the piece builds", "w-sentence", "What the sentences add up to: a story, a single scene, a feeling, a list, advice, a plea, a vow, or a run of questions (from the country-lyrics study, 2026-10-08).",
    [["setting", "Shape", ["story", "scene", "feeling", "list", "advice", "plea", "vow", "questions"], "What the piece builds.", U],
     ["mix", "One shape or mixed", [0, 100], "0 = one shape all the way, 100 = it changes shape often."]],
    "Build a breakup song as a list of what's left in the house, then end it as a plea.", "set");

  /* ---------- Words ---------- */
  n("nouns", "Nouns", "w-words", "The names of things: how many, and what kind.",
    [["often", "How many", [0, 100], "How noun-heavy the sentences are."],
     ["concrete", "Concrete or abstract", [0, 100], "0 = things you can touch (ashtray, rain), 100 = ideas (loneliness, justice)."],
     ["fancy", "Plain or fancy", [0, 100], "0 = plain (window), 100 = fancy (casement)."],
     ["fresh", "Worn or fresh", [0, 100], "0 = worn and expected, 100 = surprising and fresh."]],
    "Replace every abstract noun in a paragraph with a thing you could hold.");
  n("properNames", "Names, brands and places", "w-words", "Specific names (Route 9, a Zippo, Mrs. Alvarez) against general ones (a road, a lighter, a neighbor).",
    [["often", "How often", [0, 100], "How often a specific name appears."],
     ["kind", "Kind of name", ["people", "places", "brands", "streets", "made-up names"], "Which kind of name appears most.", U]],
    "Give the setting three real street names and nothing else.");
  n("adjectives", "Adjectives", "w-words", "Describing words for things and people: how many and what kind.",
    [["often", "How many", [0, 100], "0 = almost none, 100 = several per noun."],
     ["kind", "Kind", ["color", "size and shape", "texture", "age and wear", "judgment (beautiful, awful)", "feeling (sad, eager)"], "The kind used most.", U],
     ["judging", "Describing or judging", [0, 100], "0 = describes what is there, 100 = tells us what to think of it."]],
    "Use only adjectives of color and texture; no judgment words.");
  n("adverbs", "Adverbs", "w-words", "Words that change a verb (quickly, sadly, really): how many, and whether they prop up weak verbs.",
    [["often", "How many", [0, 100], "How adverb-heavy the writing is."],
     ["lyWords", "-ly words", [0, 100], "Share of adverbs that end in -ly."],
     ["intensifiers", "Very, really, so", [0, 100], "How often intensifiers appear."]],
    "Swap 'walked slowly' for 'shuffled' everywhere.");
  n("pronouns", "Pronouns", "w-words", "He, she, they, it: how often people are pronouns instead of names, and how clear it is who is meant.",
    [["often", "Pronouns or names", [0, 100], "0 = always names, 100 = almost always pronouns."],
     ["clear", "Clear who is meant", [0, 100], "0 = often unclear, 100 = always clear."]],
    "Never name the stranger; only 'he', until the end.");
  n("conjunctions", "And, but, so, because", "w-words", "The joining words, and which ones lead: adding (and), turning (but), causing (so, because).",
    [["often", "How often", [0, 100], "How often joining words appear."],
     ["kind", "Which kind leads", ["and (adding)", "but (turning)", "so (result)", "because (cause)", "or (choice)"], "The joiner used most.", U]],
    "Write a character who can't stop saying 'but'.");
  n("prepositions", "Place words", "w-words", "On, under, beside, through: words that put things in space. On the tabletop they are where objects sit.",
    [["often", "How often", [0, 100], "How often place words appear."],
     ["kind", "Which kind", ["on and in", "under and above", "beside and between", "through and across", "toward and away"], "The kind used most.", U]],
    "Describe the room only by where things are in relation to the bed.");
  c("wordLevel", "Plain or fancy words", "w-words", "Everyday words against rare or learned ones.",
    [["setting", "Plain to fancy", [0, 100], "0 = everyday words, 100 = rare, learned words."],
     ["syllables", "Word length", [0, 100], "0 = short words, 100 = long ones."],
     ["oldOrLatin", "Old English or Latin", [0, 100], "0 = short Old English words (house, blood), 100 = long Latin ones (residence, sanguine)."]],
    "Drop into one-syllable words at the most honest moment.", "set");
  c("formality", "Formality", "w-words", "How formal the language is, from slang and swearing to ceremony.",
    [["setting", "Casual to formal", [0, 100], "0 = slang and street talk, 100 = ceremony and law."],
     ["contractions", "Contractions", [0, 100], "How often 'don't' and 'it's' instead of 'do not' and 'it is'."],
     ["slang", "Slang", [0, 100], "How much slang."],
     ["swearing", "Swearing", [0, 100], "How much swearing."]],
    "Make the formal character's first contraction the moment they let their guard down.", "set");
  n("jargon", "Jargon and special words", "w-words", "Words from a job, a hobby, a science or a made-up world.",
    [["often", "How often", [0, 100], "How often jargon appears."],
     ["explained", "Explained or not", [0, 100], "0 = never explained, 100 = always explained."]],
    "Let the surgeon's jargon pile up as the operation goes wrong.");
  c("dialect", "Dialect and accent on the page", "w-words", "How much of a region's or group's way of speaking shows in spelling, words and grammar.",
    [["setting", "None to strong", [0, 100], "0 = standard spelling, 100 = strong dialect throughout."],
     ["how", "How it shows", ["word choice only", "grammar", "spelling", "all three"], "Where the dialect shows."]],
    "Show the accent in word choice and rhythm, never in spelling.", "set");
  n("senseWords", "Sense words", "w-words", "Words for sight, sound, smell, taste, touch and the body's sense of itself.",
    [["often", "How often", [0, 100], "How often a sense is called on."],
     ["sense", "Which sense leads", ["sight", "sound", "smell", "taste", "touch", "the body (balance, heat, ache)"], "The sense used most.", U]],
    "Write the kitchen scene with no sight words, only smell and sound.");
  n("emotionWords", "Feelings named or shown", "w-words", "Whether feelings are named (she was angry) or shown through action and the body (she set the cup down too hard).",
    [["often", "How often a feeling is named", [0, 100], "0 = feelings only shown, 100 = feelings always named."]],
    "Take out every named feeling and show each one in the hands.");
  n("colorWords", "Color words", "w-words", "How often color is named, and how exactly (red, or oxblood).",
    [["often", "How often", [0, 100], "How often a color is named."],
     ["exact", "General or exact", [0, 100], "0 = red, 100 = oxblood."]],
    "Let one color return every time the lost person is remembered.");
  n("wordRepeat", "Repeating a word", "w-words", "The same word used again close by, on purpose (for weight) or by accident.",
    [["often", "How often", [0, 100], "How often a word comes back within a few lines."],
     ["onPurpose", "On purpose", [0, 100], "0 = accidental, 100 = clearly chosen for weight."]],
    "Repeat one plain word four times in a paragraph until it aches.");
  c("vocabularyRange", "Range of vocabulary", "w-words", "How many different words are used, against the same small set again and again.",
    [["setting", "Small to wide", [0, 100], "0 = a small, repeated set, 100 = rarely the same word twice."]],
    "Give the child narrator a small vocabulary that grows by the last chapter.", "set");
  c("freshness", "Fresh or worn phrases", "w-words", "Whether the phrases are new (a square of sky) or worn (crystal clear, heart of gold).",
    [["setting", "Worn to fresh", [0, 100], "0 = familiar phrases, 100 = all new."],
     ["cliches", "Clichés", [0, 100], "How often a cliché appears."],
     ["idioms", "Sayings", [0, 100], "How often a common saying appears."]],
    "Let the character who speaks only in clichés say one fresh thing.", "set");
  n("numbers", "Numbers and measures", "w-words", "Exact numbers, times, distances and prices (4:12 a.m., 37 steps) against vague ones (late, a few).",
    [["often", "How often", [0, 100], "How often an exact number appears."]],
    "Give the anxious narrator exact numbers for everything.");
  n("filterWords", "Filter words", "w-words", "Words that put a character between the reader and the thing: saw, heard, felt, noticed, thought, realized. 'She heard the door' against 'The door slammed.'", null,
    "Cut 'she saw' and 'she heard' from a scene and let the things happen straight to the reader.");

  c("pieceTopic", "What it is about", "w-words", "The topics the piece is about (several can be on at once): love, heartbreak, home, leaving, family, faith, work, money, drinking, the road, small towns, death, growing up, freedom, the past.",
    [["setting", "Main topic", ["love", "heartbreak", "home", "leaving", "family", "faith", "work", "money", "drinking", "the road", "small towns", "death", "growing up", "freedom", "the past", "something else"], "The topic that leads.", U],
     ["second", "Second topic", ["none", "love", "heartbreak", "home", "leaving", "family", "faith", "work", "money", "drinking", "the road", "small towns", "death", "growing up", "freedom", "the past", "something else"], "A topic running alongside.", Object.assign({ from: "none", to: "none" }, U)],
     ["howMany", "How many topics", [0, 100], "0 = one topic, 100 = many woven together."]],
    "Write about work, and let love show up only in the last line.", "set");

  /* ---------- Figures of speech ---------- */
  const fig = (id, label, plain, tryThis, more, lanes) => n(id, label, "w-figures", plain, more || null, tryThis, lanes ? { lanes } : undefined);
  fig("simile", "Simile", "A comparison with 'like' or 'as': 'like a cat on a hot roof'.", "Similes every few sentences, always about the sea.",
    [["often", "How often", [0, 100], "How often a simile appears."],
     ["stretch", "Close or far-fetched", [0, 100], "0 = an obvious likeness, 100 = a surprising leap."]]);
  fig("metaphor", "Metaphor", "Saying one thing is another: 'the city was a furnace'.", "Metaphors every three sentences, always about machines.",
    [["often", "How often", [0, 100], "How often a metaphor appears."],
     ["stretch", "Close or far-fetched", [0, 100], "0 = an obvious likeness, 100 = a surprising leap."],
     ["extended", "Extended", [0, 100], "0 = one-line metaphors, 100 = one metaphor carried through a whole passage."]]);
  fig("personification", "Personification", "Giving human life to things: 'the house held its breath'.", "Personify only the house, and only at night.",
    [["often", "How often", [0, 100], "How often a thing is given human life."],
     ["mood", "Friendly or threatening", [0, 100], "0 = the world seems kind, 100 = the world seems hostile."]]);
  fig("hyperbole", "Exaggeration", "Overstatement for effect: 'I've told you a million times'.", "Let the comic character exaggerate everything except the one thing that really matters.");
  fig("verbalIrony", "Saying the opposite", "Words that mean the opposite of what they say: 'Lovely weather' in a storm.", "Give the bitter character a line of sweet irony in every scene.");
  fig("oxymoron", "Opposites joined", "Two opposites pressed together: 'deafening silence', 'cruel kindness'.", "Use one oxymoron for the feeling the character can't name.");
  fig("paradox", "Paradox", "A statement that seems to contradict itself but is true: 'the more I know, the less I know'.", "End the essay on a paradox.");
  fig("rhetoricalQuestion", "Questions not meant to be answered", "A question asked for effect: 'Who could blame her?'", "Open the ad with a question the reader answers yes to in their head.");
  fig("apostrophe", "Talking to the absent", "Speaking to someone or something that is not there: 'O Death, where is thy sting?'", "Let the widow talk to her husband's chair.");
  fig("synecdoche", "A part for the whole", "Naming a part for the whole ('all hands on deck') or something near it ('the crown' for the king).", "Call the soldiers 'boots' all through the march.");
  fig("allusion", "Allusion", "A nod to another work, myth, event or person the reader may know.",
    "Plant one quiet allusion to a myth that predicts the ending.",
    [["often", "How often", [0, 100], "How often an allusion appears."],
     ["source", "Drawn from", ["myth", "religion", "history", "literature", "film and TV", "songs", "the news"], "Where the allusions come from.", U],
     ["obvious", "Hidden or obvious", [0, 100], "0 = only a few readers will catch it, 100 = everyone will."]]);
  fig("pun", "Puns and wordplay", "A word used for two meanings at once. (Curiomatic's wordplay covers trading lines; this is the word itself.)", "Give the one-liner a double meaning that pays off later.");
  fig("symbolMention", "A symbol named again", "How often the story's symbol (a ring, a bird, a color) is named on the page. Curiomatic's symbolThing holds what it stands for.",
    "Name the symbol three times: at the start, the turn and the end.");
  fig("imagery", "Imagery", "Pictures made in the reader's mind through the senses.",
    "Write one paragraph of pure image with no thought or feeling words.",
    [["often", "How often", [0, 100], "How much of the passage is image."],
     ["sense", "Which sense leads", ["sight", "sound", "smell", "taste", "touch", "motion"], "The sense the images call on most.", U],
     ["purple", "Plain or purple", [0, 100], "0 = spare and plain, 100 = lush and ornate."]]);

  /* ---------- Sound of the words (Audio tab when the apps join) ---------- */
  const snd = (id, label, plain, tryThis, more) => n(id, label, "w-sound", plain, more || null, tryThis, { lanes: WA });
  snd("alliteration", "Alliteration", "The same first sound in words close together: 'Peter Piper picked'.", "Alliterate only when the character is angry.",
    [["often", "How often", [0, 100], "How often alliteration appears."],
     ["sound", "Hard or soft sounds", [0, 100], "0 = soft sounds (s, l, m), 100 = hard ones (k, t, b)."]]);
  snd("assonance", "Assonance", "Repeated vowel sounds: 'the rain in Spain'.", "Use long 'o' sounds in the mourning scene.");
  snd("consonance", "Consonance", "Repeated consonant sounds inside and at the end of words: 'pitter-patter'.", "Pile up hard 'k' and 't' sounds as the fight starts.");
  snd("endRhyme", "Rhyme at line ends", "Rhyme at the end of lines, and how true it is.", "Break the rhyme on the line where the heart breaks.",
    [["often", "How often", [0, 100], "How often a line end rhymes."],
     ["scheme", "Rhyme scheme", ["none", "AABB", "ABAB", "ABBA", "ABCB", "free"], "The pattern of rhymes.", U],
     ["type", "Perfect or slant", [0, 100], "0 = perfect rhyme (cat, hat), 100 = slant rhyme (heart, hurt)."]]);
  snd("internalRhyme", "Rhyme inside lines", "Rhyme within a line, not only at the end: 'I bring fresh showers for the thirsting flowers'.", "Put internal rhymes in the chorus only.");
  snd("onomatopoeia", "Sound words", "Words that sound like what they name: buzz, crack, hiss.", "Let a sound word be its own sentence.");
  snd("anaphora", "Repeated openings", "The same words at the start of line after line: 'We shall fight... we shall fight...'.", "Open each verse with the same three words, changing what follows.");
  snd("epistrophe", "Repeated endings", "The same words at the end of line after line.", "End each stanza on the same word, meaning something new each time.");
  snd("refrain", "Refrain", "A line or phrase that comes back through the piece.", "Bring the refrain back once more, changed by one word.",
    [["often", "How often", [0, 100], "How often the refrain returns."],
     ["changes", "Same or changing", [0, 100], "0 = exactly the same each time, 100 = changed each time."]]);
  c("meter", "Meter and stressed syllables", "w-sound", "The beat of stressed and unstressed syllables, from free speech to strict meter.",
    [["setting", "Free to strict", [0, 100], "0 = the rhythm of speech, 100 = strict meter."],
     ["foot", "Beat pattern", ["da-DUM (iambic)", "DUM-da (trochaic)", "da-da-DUM (anapestic)", "DUM-da-da (dactylic)", "mixed"], "The beat used most.", U],
     ["beats", "Beats per line", [0, 100], "0 = two beats, 50 = five, 100 = seven or more."]],
    "Break the meter on the line that should stop the reader.", "set", { lanes: WA });
  c("lineBreaks", "Line breaks", "w-sound", "Where lines end in verse or lyrics: at the end of a thought (end-stopped) or in the middle of one, pulling the reader on (enjambment).",
    [["setting", "End-stopped to running on", [0, 100], "0 = every line ends a thought, 100 = lines break mid-thought."],
     ["lineLength", "Line length", [0, 100], "0 = one or two words, 100 = long lines."]],
    "Break the line right before the word that hurts.", "set", { lanes: WA });
  n("caesura", "Pause inside a line", "w-sound", "A break in the middle of a line, made by punctuation or sense.", null,
    "Put a full stop in the middle of the last line.", { lanes: WA });
  c("stanza", "Stanzas and sections", "w-sound", "How a poem or song is grouped: couplets, quatrains, verse and chorus, or free blocks.",
    [["setting", "Stanza shape", ["single lines", "couplets", "three-line", "four-line", "longer", "free blocks", "verse and chorus"], "How lines are grouped.", U],
     ["volta", "The turn", [0, 100], "Where the poem turns: 0 = at the start, 100 = at the very end."]],
    "Put the turn two lines before the end.", "set", { lanes: WA });
  c("syllablesPerBar", "Syllables per bar", "w-sound", "In lyrics, how many syllables fit each musical bar, and whether the words fit the melody's stresses.",
    [["setting", "Few to many", [0, 100], "0 = one long note per word, 100 = rapid, packed syllables."],
     ["fit", "Words fit the melody", [0, 100], "0 = stresses fight the tune, 100 = every stress lands on the beat."]],
    "Slow to one word per bar on the hook.", "set", { lanes: WA });

  /* ---------- Voice & point of view ---------- */
  c("grammaticalPerson", "Grammatical person", "w-voice", "Who the telling is in: I, you, we, he or she, they. Part of the listener's perspective (Curiomatic's listenerPlace).",
    [["setting", "Person", ["first (I)", "second (you)", "first plural (we)", "third (he, she, they)", "shifting"], "The person of the narration.", U],
     ["shifts", "Shifts", [0, 100], "How often the person changes."]],
    "Write a chapter from 'you' to make the reader the one who did it.", "set");
  c("psychicDistance", "Psychic distance", "w-voice", "John Gardner's five steps, from far outside ('It was winter of the year 1853. A large man stepped out of a doorway.') to deep inside ('Snow. Under your collar, inside your shoes, freezing and plugging up your miserable soul...').",
    [["setting", "Far to deep", [0, 100], "0 = a distant camera, 100 = inside the head."],
     ["moves", "How much it moves", [0, 100], "How often the distance zooms in or out."]],
    "Start a scene far off and zoom in one step each paragraph.", "set");
  n("freeIndirect", "Free indirect speech", "w-voice", "Third person that slips into a character's own words without quotation marks: 'He was going to be late. Brilliant. Just brilliant.'", null,
    "Let the narrator borrow one of the character's pet words.");
  c("streamOfConsciousness", "Stream of consciousness", "w-voice", "Thoughts set down as they come, jumping, without tidy grammar.",
    [["setting", "Ordered to streaming", [0, 100], "0 = tidy, ordered thought, 100 = a raw stream."]],
    "Let the stream run for one page when the character panics.", "set");
  c("narratingSelf", "Narrating I against experiencing I", "w-voice", "In memoir, the older self looking back against the younger self living it.",
    [["setting", "Then to now", [0, 100], "0 = all the younger self in the moment, 100 = all the older self looking back."],
     ["gap", "Years between", [0, 100], "How far the telling self is from the lived self."]],
    "Let the older self break in once with what the younger couldn't know.", "set");
  n("narratorComment", "The narrator comments", "w-voice", "How often the narrator steps out to judge, explain or talk to the reader.", null,
    "Have the narrator apologize to the reader once, mid-scene.");
  c("epistolary", "Told in documents", "w-voice", "Telling through letters, texts, emails, diary entries, logs, transcripts or system messages.",
    [["setting", "Kind", ["letters", "texts", "emails", "diary", "logs or reports", "transcripts", "system messages (LitRPG)", "mixed"], "The documents used.", U],
     ["share", "Share of the story", [0, 100], "How much of the story is told this way."]],
    "Tell the breakup only in the texts, with the time stamps doing the work.", "set");
  c("addressee", "Who it is spoken or sung to", "w-voice", "Who the words are addressed to: no one in particular, the reader, a lover, an ex, a rival, God, a child, someone gone, a crowd, or a thing (from the country-lyrics study, 2026-10-08). Talking to the absent is also its own figure (apostrophe).",
    [["setting", "Addressed to", ["no one in particular", "the reader", "a lover", "an ex", "a rival", "God", "a child", "someone gone", "a crowd", "a thing"], "Who the words are for.", U],
     ["present", "Can they hear it", [0, 100], "0 = they will never hear it, 100 = they are right there listening."],
     ["named", "Named or only 'you'", [0, 100], "0 = only 'you', 100 = named outright."]],
    "Sing the whole song to the ex, then turn the last line to God.", "set");
  c("narratorFingerprint", "The narrator's language fingerprint", "w-voice", "The narrator's own rates of every language curiosity here (sentence length, figures, word level...), so the voice can be read, kept steady or changed on purpose.",
    [["setting", "How distinct", [0, 100], "0 = a neutral voice, 100 = unmistakable."],
     ["drift", "Drift over the story", [0, 100], "How much the narrator's fingerprint changes from start to end."]],
    "Let the narrator's sentences lengthen as they heal.", "set");
  c("characterFingerprint", "A character's language fingerprint", "w-voice", "Each character's own rates of every language curiosity here, so the frequency of similes, questions or swearing can differ from one character to the next, and shift under stress (with Curiomatic's typeTalk).",
    [["setting", "How distinct", [0, 100], "0 = sounds like everyone, 100 = you know who's talking with no tag."],
     ["stressShift", "Changes under stress", [0, 100], "How much their language changes when they are unhealthy or afraid."],
     ["borrows", "Borrows from others", [0, 100], "How much they pick up other characters' words over time."]],
    "Give each character one figure of speech no one else uses.", "set");

  /* ---------- Dialogue on the page ---------- */
  c("dialogueShare", "How much is dialogue", "w-dialogue", "The share of the text that is people speaking.",
    [["setting", "None to all", [0, 100], "0 = no dialogue, 100 = all dialogue."]],
    "Let the scene that matters most have the least dialogue.", "set");
  n("dialogueTags", "Dialogue tags", "w-dialogue", "'She said' and other tags: how often, how plain (said, asked) or fancy (snarled, exclaimed), and where they sit.",
    [["often", "How often", [0, 100], "How often a line has a tag."],
     ["fancy", "Said or fancy", [0, 100], "0 = always said, 100 = always a showy tag."],
     ["place", "Where the tag sits", ["before the line", "in the middle", "after the line"], "Where the tag goes."]],
    "Use only 'said', and only when the reader could get lost.");
  n("actionBeats", "Action beats", "w-dialogue", "A small action instead of a tag: 'She put down the knife. \"Fine.\"'", null,
    "Replace every tag in an argument with what their hands are doing.");
  c("speechLength", "Length of each speech", "w-dialogue", "How long each person talks before the other speaks: one word, a line, or a speech.",
    [["setting", "One word to a speech", [0, 100], "0 = single words, 100 = long speeches."],
     ["balance", "Who talks most", [0, 100], "0 = one speaker does all the talking, 100 = evenly shared."]],
    "Let one person give a long speech and the other answer in one word.", "set");
  n("interruptions", "Interruptions", "w-dialogue", "Lines cut off by another speaker, or trailing away.", null,
    "Let the parent interrupt the child every time, until the child doesn't stop.");
  n("dialogueQuestions", "Questions in dialogue", "w-dialogue", "How often characters ask instead of tell, and whether questions get answered.",
    [["often", "How often", [0, 100], "How often a line is a question."],
     ["answered", "Answered", [0, 100], "0 = never answered, 100 = always answered."]],
    "Answer every question with another question.");
  n("talksAboutSelf", "Talks about themselves", "w-dialogue", "How often a speaker's lines are about themselves (I, me, my) against others.", null,
    "Count the 'I's in the narcissist's lines and halve them in the last scene.");
  n("subtextGap", "Says one thing, means another", "w-dialogue", "How far the words are from what is meant. Curiomatic's 'said against meant' holds the film version.",
    [["often", "How often", [0, 100], "How often a line hides its meaning."],
     ["gapSize", "Size of the gap", [0, 100], "0 = means exactly what they say, 100 = means the opposite."]],
    "Write a love scene where no one says anything about love.");
})(typeof window !== "undefined" ? window.CuriosityDB : require("../curiosity-db.js"));
