/* data/writing/db-writing-ladder.js: the language curiosities (db-writing-language.js) set into the full ladder (Jeremy,
   2026-10-08: "categorize them into curiosities, and then curiosity suites, which all go together, and then curiosity
   proximities, which are tangentially related, and then curiosity catalysts ... And then there are sort of harder to
   align events, which require an unlocking ... curiosity elixirs. It's like a key that has to move all of the
   tumblers into the right spot in the key lock.").
     Suites       DB.suite: curiosities that go together, each member set to a value.
     Proximities  window.WritingProximities: pairs that are tangentially related, 0 to 100, with why. They set nothing off.
     Catalysts    DB.proximity (the code's old name for a spark): when X happens, Y follows within some sentences.
     Elixirs      DB.proximitySuite: several sparks that must all line up, like tumblers in a lock. The app's Lock
                  switch (screen/catalyst.js) makes one fire only where every ingredient is in.
   Beats here are sentences (or lines, in verse). Loaded after db-writing-language.js. */
(function (DB, root) {
  const S = (id, label, workspace, plain, members) => DB.suite({ id, label, plain, workspace, members, source: "writing", tags: ["writing-only"] });
  const P = (id, label, workspace, plain, when, then, within, often) => DB.proximity({ id, label, plain, workspace, when, then, within, often, source: "writing", tags: ["writing-only"] });
  const E = (id, label, workspace, plain, members) => DB.proximitySuite({ id, label, plain, workspace, members, source: "writing", tags: ["writing-only"] });
  const m = (curiosity, value, slider) => (slider ? { curiosity, slider, value } : { curiosity, value });

  /* ---------- Suites: curiosities that go together ---------- */
  S("w-punchy-plain", "Punchy and plain", "w-sentence", "Short sentences, few commas, strong verbs, almost no adverbs, everyday words.",
    [m("sentenceLength", 20), m("comma", 20), m("strongVerbs", 80, "strength"), m("adverbs", 10), m("wordLevel", 15)]);
  S("w-lush-ornate", "Lush and ornate", "w-words", "Long sentences heavy with adjectives, similes and rich images in fancy words.",
    [m("sentenceLength", 80), m("adjectives", 80), m("imagery", 85, "purple"), m("simile", 60), m("wordLevel", 75)]);
  S("w-noir-voice", "Hard-boiled voice", "w-voice", "First person, short sentences, street and brand names, similes about the city that sting, a dry turn of irony.",
    [m("grammaticalPerson", "first (I)"), m("sentenceLength", 25), m("simile", 60), m("simile", "the city", "subject"), m("properNames", 60), m("verbalIrony", 50)]);
  S("w-inside-a-head", "Deep inside a head", "w-voice", "Zoomed all the way in: the narrator slips into the character's own words, no filter words, thoughts streaming.",
    [m("psychicDistance", 90), m("freeIndirect", 60), m("filterWords", 10), m("streamOfConsciousness", 50)]);
  S("w-far-teller", "The storyteller from far off", "w-voice", "Third person, past tense, a distant view, and a narrator who comments on it all.",
    [m("psychicDistance", 15), m("grammaticalPerson", "third (he, she, they)"), m("tense", "past"), m("narratorComment", 60)]);
  S("w-breathless-chase", "Breathless chase", "w-verbs", "Present tense, short sentences crammed with strong verbs, few commas, one-line paragraphs.",
    [m("tense", "present"), m("sentenceLength", 15), m("verbDensity", 70), m("strongVerbs", 90, "strength"), m("comma", 15), m("paragraphLength", 10)]);
  S("w-song-hook", "The song's hook", "w-sound", "A refrain that keeps coming back, rhymed, few syllables to the bar, repeated openings and a little alliteration.",
    [m("refrain", 80), m("endRhyme", 70), m("syllablesPerBar", 30), m("anaphora", 50), m("alliteration", 40)]);
  S("w-pulpit", "The pulpit", "w-sound", "Spoken-word and speeches: repeated openings, matching shapes, questions not meant to be answered, lists of three.",
    [m("anaphora", 80), m("parallelism", 80), m("rhetoricalQuestion", 60), m("listsOfThree", 70)]);
  S("w-ad-voice", "Talking to you (ads)", "w-voice", "Second person, commands, a question you answer yes to, short sentences, casual words.",
    [m("grammaticalPerson", "second (you)"), m("grammarMood", "command"), m("rhetoricalQuestion", 50), m("sentenceLength", 15), m("formality", 20)]);
  S("w-plain-memoir", "Plain-spoken memoir", "w-voice", "First person, past tense, the older self looking back, casual words, feelings shown more than named.",
    [m("grammaticalPerson", "first (I)"), m("tense", "past"), m("narratingSelf", 60), m("formality", 30), m("emotionWords", 20)]);
  S("w-tight-dialogue", "Tight dialogue", "w-dialogue", "Only 'said', action beats instead of tags, short speeches, interruptions, and meaning under the words.",
    [m("dialogueTags", 0, "fancy"), m("actionBeats", 50), m("speechLength", 20), m("interruptions", 40), m("subtextGap", 60)]);
  S("w-picture-book", "Picture book", "w-words", "Simple words, short sentences, words and lines that come back, and sounds that play.",
    [m("wordLevel", 5), m("sentenceLength", 20), m("wordRepeat", 60), m("refrain", 60), m("alliteration", 50)]);
  S("w-lyric-poem", "Lyric poem", "w-sound", "Lines broken mid-thought, dense images, metaphor, air on the page and a light beat.",
    [m("lineBreaks", 70), m("imagery", 80), m("metaphor", 60), m("whiteSpace", 70), m("meter", 40)]);
  S("w-haunted-room", "The haunted room", "w-figures", "Things are the subjects, the house comes alive and turns hostile, and every sound is named.",
    [m("nounPlacement", 10, "subjectIsPerson"), m("personification", 70), m("personification", 90, "mood"), m("senseWords", "sound", "sense")]);
  S("w-legal-voice", "The legal voice", "w-words", "Formal words, long sentences with clauses hanging off clauses, the passive, and every claim hedged.",
    [m("formality", 90), m("clauses", 80), m("verbVoice", 60), m("certainty", 70)]);
  S("w-cliffhanger", "The chapter that won't let go", "w-sentence", "Ends on a cliffhanger, the last lines set alone, the strongest word last.",
    [m("chapterEnding", "cliffhanger"), m("paragraphLength", 70, "oneLiners"), m("sentenceEnding", 90)]);

  /* ---------- Catalysts (sparks): when X happens, Y follows within N sentences ---------- */
  P("w-long-then-punch", "When the sentences grow long, a very short one lands", "w-sentence", "After a run of long sentences, the punch: a very short one.",
    { curiosity: "sentenceLength", change: "rises" }, { curiosity: "sentenceRhythm", slider: "punch", change: "rises" }, 3, 70);
  P("w-close-drops-filters", "When the telling zooms in, the filter words fall away", "w-voice", "Deep inside a head there is no 'she saw' or 'he felt'; the thing just happens.",
    { curiosity: "psychicDistance", change: "rises" }, { curiosity: "filterWords", change: "drops" }, 1, 80);
  P("w-action-shortens", "When the action piles up, the sentences shorten", "w-verbs", "More verbs per sentence means faster action, and the sentences tighten to keep up.",
    { curiosity: "verbDensity", change: "rises" }, { curiosity: "sentenceLength", change: "drops" }, 2, 70);
  P("w-present-pulls-close", "When the tense snaps to present, the telling moves closer", "w-verbs", "A switch into present tense pulls the reader into the moment and closer to the mind living it.",
    { curiosity: "tense", is: "present" }, { curiosity: "psychicDistance", change: "rises" }, 1, 60);
  P("w-interrupt-shortens", "When speakers interrupt, the speeches get shorter", "w-dialogue", "Cut someone off and nobody gets a whole speech out.",
    { curiosity: "interruptions", change: "rises" }, { curiosity: "speechLength", change: "drops" }, 1, 80);
  P("w-shown-feelings-beats", "When feelings stop being named, the hands start moving", "w-dialogue", "Take away 'she was angry' and action beats carry the feeling instead.",
    { curiosity: "emotionWords", change: "drops" }, { curiosity: "actionBeats", change: "rises" }, 1, 70);
  P("w-simile-rests", "When a simile lands, the next one waits", "w-figures", "A strong simile needs room; the gap before the next one grows.",
    { curiosity: "simile", change: "rises" }, { curiosity: "simile", slider: "gap", change: "rises" }, 2, 60);
  P("w-refrain-rhymes", "When the refrain returns, the rhyme tightens", "w-sound", "Around the hook the rhymes come thicker and truer.",
    { curiosity: "refrain", change: "rises" }, { curiosity: "endRhyme", change: "rises" }, 1, 70);
  P("w-oneliner-air", "When a line stands alone, the page opens up", "w-sentence", "A one-line paragraph brings white space with it.",
    { curiosity: "paragraphLength", slider: "oneLiners", change: "rises" }, { curiosity: "whiteSpace", change: "rises" }, 0, 90);
  P("w-questions-subtext", "When questions pile up in a conversation, the meaning goes under the words", "w-dialogue", "People who answer questions with questions are hiding something.",
    { curiosity: "dialogueQuestions", change: "rises" }, { curiosity: "subtextGap", change: "rises" }, 2, 60);
  P("w-swear-shortens", "When the swearing starts, the sentences shorten", "w-words", "Anger cuts sentences down.",
    { curiosity: "formality", slider: "swearing", change: "rises" }, { curiosity: "sentenceLength", change: "drops" }, 1, 60);
  P("w-comment-pulls-back", "When the narrator comments, the telling pulls back", "w-voice", "A narrator who steps out to judge takes us out of the character's head.",
    { curiosity: "narratorComment", change: "rises" }, { curiosity: "psychicDistance", change: "drops" }, 0, 80);
  P("w-hostile-house-senses", "When the house turns hostile, the senses sharpen", "w-figures", "Once things seem alive and against us, every sound and smell is noticed.",
    { curiosity: "personification", slider: "mood", change: "rises" }, { curiosity: "senseWords", change: "rises" }, 2, 60);
  P("w-meter-breaks-lands", "When the meter breaks, the line's last word hits hard", "w-sound", "A line that breaks the beat makes its ending land.",
    { curiosity: "meter", change: "drops" }, { curiosity: "sentenceEnding", change: "rises" }, 0, 60);
  P("w-anaphora-threes", "When openings repeat, lists of three follow", "w-sound", "Repetition builds a rhythm that wants a list of three to finish it.",
    { curiosity: "anaphora", change: "rises" }, { curiosity: "listsOfThree", change: "rises" }, 2, 60);
  P("w-cliffhanger-dialogue", "When a chapter ends on a cliffhanger, the next opens in dialogue", "w-sentence", "Pick the story up mid-voice so there is no breath between chapters.",
    { curiosity: "chapterEnding", is: "cliffhanger" }, { curiosity: "sentenceOpener", is: "dialogue" }, 1, 50);
  P("w-weak-verbs-adverbs", "When the verbs go weak, the adverbs move in", "w-verbs", "'Was' and 'went' need propping up with 'quickly' and 'really'.",
    { curiosity: "beingVerbs", change: "rises" }, { curiosity: "adverbs", change: "rises" }, 1, 70);
  P("w-you-commands", "When the telling turns to 'you', commands follow", "w-voice", "Once the reader is 'you', the voice starts telling them what to do.",
    { curiosity: "grammaticalPerson", is: "second (you)" }, { curiosity: "grammarMood", is: "command" }, 2, 50);
  P("w-stress-changes-words", "When a character is under stress, their way of talking changes", "w-voice", "Their language fingerprint shifts as their health drops (with Curiomatic's typeTalk).",
    { curiosity: "typeTalk", slider: "health", is: "under stress" }, { curiosity: "characterFingerprint", slider: "stressShift", change: "rises" }, 1, 80);
  P("w-free-indirect-no-italics", "When the narrator slips into the character's words, the italics fade", "w-voice", "Free indirect speech carries the thoughts, so they no longer need italics.",
    { curiosity: "freeIndirect", change: "rises" }, { curiosity: "italics", change: "drops" }, 1, 70);
  P("w-few-syllables-refrain", "When the syllables per bar thin out, the refrain comes in", "w-sound", "Slowing the words to a few long notes makes room for the hook.",
    { curiosity: "syllablesPerBar", change: "drops" }, { curiosity: "refrain", change: "rises" }, 1, 60);
  P("w-storm-inside-streams", "When the storm inside rises, thoughts start to stream", "w-voice", "Inner chaos (Curiomatic's innerWeather) breaks tidy thought into a stream.",
    { curiosity: "innerWeather", change: "rises" }, { curiosity: "streamOfConsciousness", change: "rises" }, 1, 70);

  /* ---------- Elixirs: every spark must line up, like tumblers in a lock ---------- */
  E("w-the-punch-lands", "The punch lands", "w-sentence", "Long sentences build, the action piles up, the meter breaks: only when all three line up does the short line hit.",
    ["w-long-then-punch", "w-action-shortens", "w-meter-breaks-lands"]);
  E("w-slipping-inside", "Slipping inside a head", "w-voice", "Present tense, filter words gone, italics gone: all three, and the reader is inside the character.",
    ["w-present-pulls-close", "w-close-drops-filters", "w-free-indirect-no-italics"]);
  E("w-the-hook", "The hook arrives", "w-sound", "Syllables thin out, the refrain returns, the rhymes tighten, the openings repeat: the chorus lands.",
    ["w-few-syllables-refrain", "w-refrain-rhymes", "w-anaphora-threes"]);
  E("w-breaking-point", "The breaking point in a conversation", "w-dialogue", "Stress changes how they talk, they start interrupting, the questions go unanswered: the fight breaks out.",
    ["w-stress-changes-words", "w-interrupt-shortens", "w-questions-subtext"]);
  E("w-page-turner", "The page-turner", "w-sentence", "A cliffhanger, the last line alone in white space, a punch at the end, the next chapter mid-voice.",
    ["w-cliffhanger-dialogue", "w-oneliner-air", "w-long-then-punch"]);
  E("w-panic-on-the-page", "Panic on the page", "w-voice", "The storm inside rises, thoughts stream, the action piles up, the swearing starts.",
    ["w-storm-inside-streams", "w-action-shortens", "w-swear-shortens"]);

  /* ---------- Proximities: tangentially related, 0 to 100. They set nothing off. ---------- */
  const near = (a, b, how, why) => ({ a, b, how, why });
  const NEAR = [
    near("sentenceLength", "sentenceRhythm", 90, "Rhythm is how the lengths follow each other."),
    near("sentenceLength", "comma", 70, "Long sentences need commas to breathe."),
    near("sentenceType", "clauses", 85, "The type is counted in clauses."),
    near("sentenceOpener", "wordOrder", 70, "What comes first is word order seen from the front."),
    near("sentenceEnding", "mainPoint", 80, "Both decide what the reader is left holding."),
    near("verbAspect", "tense", 85, "Tense says when; aspect says how long."),
    near("strongVerbs", "adverbs", 75, "Strong verbs do the adverb's job."),
    near("strongVerbs", "beingVerbs", 80, "Opposite ends of how much a verb does."),
    near("verbKind", "senseWords", 55, "Seeing verbs and sight words travel together."),
    near("verbVoice", "certainty", 45, "The passive and the hedge both soften blame."),
    near("nouns", "properNames", 70, "A proper name is the most specific noun."),
    near("nouns", "adjectives", 75, "Adjectives lean on nouns; strong nouns need fewer."),
    near("adjectivePlacement", "adjectives", 90, "Where they go and how many."),
    near("wordLevel", "formality", 85, "Fancy words and formal register rise together."),
    near("formality", "dialect", 60, "Both say where a voice comes from."),
    near("freshness", "simile", 60, "A worn simile is a cliché."),
    near("simile", "metaphor", 90, "Two ways to compare."),
    near("metaphor", "personification", 75, "Personification is a metaphor that makes a thing a person."),
    near("hyperbole", "understatement", 70, "Opposite ways to bend the size of the truth."),
    near("verbalIrony", "subtextGap", 80, "Both say one thing and mean another."),
    near("alliteration", "consonance", 85, "Repeated consonants at the start and inside words."),
    near("assonance", "internalRhyme", 70, "Matching vowels are half a rhyme."),
    near("endRhyme", "refrain", 60, "A refrain often rides on the rhyme."),
    near("anaphora", "parallelism", 85, "Repeated openings make matching shapes."),
    near("meter", "syllablesPerBar", 80, "Both count the beat of the words."),
    near("lineBreaks", "whiteSpace", 70, "Where a line ends makes the air on the page."),
    near("grammaticalPerson", "listenerPlace", 85, "Person is where the listener stands, in grammar."),
    near("psychicDistance", "freeIndirect", 85, "Free indirect speech lives at the close end."),
    near("psychicDistance", "filterWords", 80, "Filter words hold the reader at arm's length."),
    near("narratingSelf", "tense", 60, "Looking back is usually past tense."),
    near("characterFingerprint", "typeTalk", 90, "How a character talks comes from their type."),
    near("narratorFingerprint", "unreliableView", 50, "A narrator's habits can give away that they can't be trusted."),
    near("dialogueTags", "actionBeats", 85, "An action beat replaces a tag."),
    near("speechLength", "interruptions", 75, "Interruptions cut speeches short."),
    near("pun", "wordplay", 90, "A pun is the smallest piece of wordplay."),
    near("emotionWords", "subtextGap", 55, "Named feelings leave no room under the words."),
  ];
  NEAR.forEach((p) => ["a", "b"].forEach((k) => { if (!DB.get("curiosity", p[k])) throw new Error("db-writing-ladder: unknown curiosity " + p[k]); }));
  root.WritingProximities = NEAR;
  DB.writingProximities = NEAR;
})(typeof window !== "undefined" ? window.CuriosityDB : require("../curiosity-db.js"), typeof window !== "undefined" ? window : globalThis);
