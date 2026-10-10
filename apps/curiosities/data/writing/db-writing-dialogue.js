/* data/writing/db-writing-dialogue.js: dialogue from the Enneagram (Jeremy's handoff, sections 9 and 9c). Curiomatic's
   typeTalk already holds each character's type, health, what they won't say and how they dodge; this file adds what
   only the page needs: how each type jokes, the words each type reaches for, how talk changes under stress, how two
   types talk together, inner monologue on the page, the healer conversation and picturing outcomes as prose. Then a
   voice suite per type, sparks for how types talk ("when the 8 pushes, the 9 goes quiet"), elixirs and proximities.
   The type fingerprints are Claude's estimates, to be checked by Sharani. Loaded after db-writing-forms.js. */
(function (DB) {
  const { c, n, U, WA, W } = DB.writingHelpers;

  const TYPES = ["1 the perfectionist", "2 the helper", "3 the achiever", "4 the individualist", "5 the investigator", "6 the loyalist", "7 the enthusiast", "8 the challenger", "9 the peacemaker"];

  /* ---------- Curiosities ---------- */
  n("typeHumor", "How they joke", "w-dialogue", "The kind of humor a character reaches for, which follows their Enneagram type: a 1 corrects with dry wit, a 7 riffs, an 8 roasts, a 9 makes gentle fun of themselves.",
    [["often", "How often", [0, 100], "How often their lines are jokes."],
     ["kind", "Kind of humor", ["dry correction", "warm teasing", "winning wit", "dark irony", "deadpan facts", "nervous jokes", "wild riffs", "roasting", "gentle self-mockery"], "The humor used, in type order 1 to 9.", U],
     ["deflects", "Jokes to dodge", [0, 100], "How often a joke is used to get out of a hard moment."]],
    "Give the 7 a joke every time the talk gets close to the loss.", { lanes: WA });
  n("typeWords", "The words their type reaches for", "w-dialogue", "Each type's favorite words: a 1 says should and right, a 2 says you and need, a 3 says win and best, a 4 says feel and missing, a 5 says actually and think, a 6 says what if and safe, a 7 says fun and next, an 8 says now and do it, a 9 says fine and whatever.",
    [["often", "How often", [0, 100], "How often their type's words show up."],
     ["type", "Whose words", TYPES, "Which type's words.", U]],
    "Cut every 'should' from the 1's lines until the scene where they break.", { lanes: WA });
  c("stressSpeech", "How their talk changes under stress", "w-dialogue", "As a character gets less healthy, their lines slip toward their stress type's way of talking; as they grow healthier, toward their growth type's. A calm 9 who agrees with everyone starts snapping like a 6 under stress.",
    [["setting", "How much it changes", [0, 100], "0 = they sound the same under stress, 100 = they sound like someone else."],
     ["direction", "Toward stress or growth", ["toward their stress type", "steady", "toward their growth type"], "Which way their talk is moving."],
     ["shows", "Where it shows", ["shorter lines", "more questions", "more about themselves", "more jokes", "going silent", "louder words", "colder words"], "The first sign on the page.", U]],
    "Let the helper's lines get shorter and colder each scene she isn't thanked.", "set", { lanes: WA });
  c("typePair", "How two types talk together", "w-dialogue", "Two characters' types together make a pattern of talk: they clash, mirror each other, complete each other, one leads and the other follows, or they avoid each other.",
    [["setting", "Pattern", ["clash", "mirror", "complete each other", "one leads, one follows", "avoid each other"], "How the pair talks.", U],
     ["tension", "Calm to charged", [0, 100], "How much tension runs under their talk."],
     ["leader", "Who leads the talk", [0, 100], "0 = the first character always leads, 100 = the second does."]],
    "Pair the 8 and the 9: every time the 8 pushes, let the 9 agree a little less.", "set", { lanes: WA });
  c("innerMonologue", "Inner monologue on the page", "w-voice", "How a character's self-talk shows in the writing: italic thoughts, free indirect speech (the narrator slips into their voice), second person ('you always do this'), or not at all. Curiomatic's selfTalk holds what they say to themselves; this is how it looks on the page.",
    [["setting", "Form", ["none", "italic thoughts", "free indirect", "second person you", "a remembered voice"], "How the thoughts appear.", U],
     ["often", "How often", [0, 100], "How much of the page is their inner voice."],
     ["tone", "Kind to cruel", [0, 100], "0 = kind to themselves, 100 = cruel."]],
    "Write his self-talk in second person and soften the 'you' as he heals.", "set");
  c("sessionScene", "The healer conversation", "w-dialogue", "A scene between a healer (therapist, friend, guru, grandparent) and a character: the healer's questions, the long pauses, the character's dodges by type, and the moment they stay with the feeling.",
    [["setting", "Dodging to staying with it", [0, 100], "0 = the character dodges every question, 100 = they stay with the feeling."],
     ["pauses", "Pauses", [0, 100], "How much silence the scene holds."],
     ["questions", "Healer's questions", [0, 100], "How much of the healer's talk is questions."],
     ["breakthrough", "Where the breakthrough comes", [0, 100], "0 = early, 100 = the last line."]],
    "Give the healer one question, asked three times, and let the third answer be true.", "set", { lanes: WA });
  c("pictureAhead", "Picturing outcomes as prose", "w-voice", "The best and worst futures written as short flash-forwards inside a scene, then back to now (Curiomatic's picturingOutcomes is the habit and its flashForward is the film cut; this is how it is written).",
    [["setting", "How often", [0, 100], "How often a scene jumps ahead into a pictured future."],
     ["bestWorst", "Best to worst", [0, 100], "0 = always the best outcome, 100 = always the worst."],
     ["length", "A line to a page", [0, 100], "How long each flash-forward runs."],
     ["tense", "Tense used", ["future", "present", "conditional (would)"], "How the future is written.", U]],
    "Let her picture the worst in three sentences of present tense, then cut back mid-word.", "set");

  /* ---------- Their ladder ---------- */
  const tag = { source: "writing", tags: ["writing-only"] };
  const m = (curiosity, value, slider) => (slider ? { curiosity, slider, value } : { curiosity, value });
  const S = (id, label, plain, members) => DB.suite(Object.assign({ id, label, plain, workspace: "w-dialogue", members }, tag));
  const P = (id, label, plain, when, then, within, often) => DB.proximity(Object.assign({ id, label, plain, workspace: "w-dialogue", when, then, within, often }, tag));
  const E = (id, label, plain, members) => DB.proximitySuite(Object.assign({ id, label, plain, workspace: "w-dialogue", members }, tag));

  /* One voice suite per type: Claude's estimates of each type's talk. */
  const HUMOR = ["dry correction", "warm teasing", "winning wit", "dark irony", "deadpan facts", "nervous jokes", "wild riffs", "roasting", "gentle self-mockery"];
  const VOICE = [
    ["The perfectionist's voice", "Corrects, says should, keeps anger out of the words.", [m("speechLength", 40), m("interruptions", 50), m("talksAboutSelf", 30)]],
    ["The helper's voice", "Asks about you, never says what they need.", [m("dialogueQuestions", 70), m("talksAboutSelf", 15), m("emotionWords", 60)]],
    ["The achiever's voice", "Talks up the win, changes the subject from a failure.", [m("talksAboutSelf", 75), m("speechLength", 60), m("subtextGap", 50)]],
    ["The individualist's voice", "Names feelings, talks about what is missing.", [m("emotionWords", 85), m("talksAboutSelf", 70), m("speechLength", 65)]],
    ["The investigator's voice", "Says little, asks for facts, goes quiet and deep.", [m("speechLength", 15), m("dialogueQuestions", 55), m("emotionWords", 10)]],
    ["The loyalist's voice", "Asks what could go wrong, checks who to trust.", [m("dialogueQuestions", 85), m("dialogueQuestions", 40, "answered"), m("interruptions", 40)]],
    ["The enthusiast's voice", "Talks fast and long, jokes, jumps to what's next.", [m("speechLength", 80), m("interruptions", 60), m("subtextGap", 40)]],
    ["The challenger's voice", "Short commands, pushes harder, never says they are weak.", [m("speechLength", 25), m("grammarMood", "command"), m("interruptions", 70)]],
    ["The peacemaker's voice", "Agrees to keep the peace, says fine, hides disagreement.", [m("speechLength", 35), m("subtextGap", 70), m("talksAboutSelf", 10)]],
  ];
  VOICE.forEach(([label, plain, more], i) => S("w-voice-type-" + (i + 1), label, plain,
    [m("typeTalk", TYPES[i], "type"), m("typeHumor", HUMOR[i], "kind"), m("typeWords", TYPES[i], "type")].concat(more)));
  S("w-healer-session", "The session", "A healer's questions, long pauses, dodges that slowly give way, and a feeling stayed with.",
    [m("sessionScene", 70), m("sessionScene", 80, "pauses"), m("dialogueQuestions", 70), m("ellipsis", 50), m("innerMonologue", "free indirect")]);
  S("w-spiral-alone", "The spiral on the page", "Cruel self-talk in second person, the worst futures pictured, short broken lines.",
    [m("innerMonologue", "second person you"), m("innerMonologue", 85, "tone"), m("pictureAhead", 60), m("pictureAhead", 90, "bestWorst"), m("sentenceLength", 15)]);

  const is = (curiosity, slider, value) => ({ curiosity, slider, is: value });
  const rise = (curiosity, slider) => (slider ? { curiosity, slider, change: "rises" } : { curiosity, change: "rises" });
  const drop = (curiosity, slider) => (slider ? { curiosity, slider, change: "drops" } : { curiosity, change: "drops" });
  P("w-8-pushes-9-quiet", "When the 8 pushes, the 9 goes quiet", "The challenger's push makes the peacemaker's lines shorter and more agreeable.",
    is("typeTalk", "type", "8 the challenger"), drop("speechLength"), 1, 75);
  P("w-1-corrects", "When the perfectionist speaks, someone gets corrected", "A 1 interrupts to set things right.",
    is("typeTalk", "type", "1 the perfectionist"), rise("interruptions"), 1, 60);
  P("w-2-asks-about-you", "When the helper speaks, the talk turns to you", "A 2's lines move off themselves and onto the other person.",
    is("typeTalk", "type", "2 the helper"), drop("talksAboutSelf"), 1, 70);
  P("w-3-talks-wins", "When the achiever is asked about a failure, the talk turns to a win", "A 3 changes the subject to what went well.",
    is("typeTalk", "type", "3 the achiever"), rise("talksAboutSelf"), 1, 65);
  P("w-4-names-feelings", "When the individualist speaks, feelings get named", "A 4 says what they feel, and what is missing.",
    is("typeTalk", "type", "4 the individualist"), rise("emotionWords"), 1, 70);
  P("w-5-goes-short", "When the investigator is pressed, the answers get shorter", "A 5 pulls back into few words.",
    is("typeTalk", "type", "5 the investigator"), drop("speechLength"), 1, 70);
  P("w-6-asks-what-if", "When the loyalist speaks, the questions come", "A 6 asks what could go wrong.",
    is("typeTalk", "type", "6 the loyalist"), rise("dialogueQuestions"), 1, 75);
  P("w-7-jokes-away", "When the talk gets heavy, the enthusiast makes a joke", "A 7 dodges pain with a riff.",
    is("typeTalk", "type", "7 the enthusiast"), rise("typeHumor", "deflects"), 2, 70);
  P("w-9-says-fine", "When the peacemaker disagrees, they say 'fine'", "A 9 hides disagreement, so the gap between words and meaning grows.",
    is("typeTalk", "type", "9 the peacemaker"), rise("subtextGap"), 1, 70);
  P("w-stress-slips", "When a character's health drops, their talk slips toward their stress type", "Less healthy, they start to sound like someone else.",
    drop("typeTalk", "health"), rise("stressSpeech"), 2, 70);
  P("w-pause-then-truth", "When the healer lets the silence hold, the character stops dodging", "A long pause in a session is followed by a true answer.",
    rise("sessionScene", "pauses"), rise("sessionScene"), 2, 60);
  P("w-worst-then-cruel", "When the worst future is pictured, the self-talk turns cruel", "Picturing the worst feeds the inner critic.",
    rise("pictureAhead", "bestWorst"), rise("innerMonologue", "tone"), 2, 65);

  E("w-the-standoff", "The standoff", "The 8 pushes, the 9 goes quiet and says 'fine', and the gap between words and meaning grows until it breaks.",
    ["w-8-pushes-9-quiet", "w-9-says-fine", "w-stress-slips"]);
  E("w-the-breakthrough", "The breakthrough", "The silence holds, the dodging stops, and the cruel voice inside goes quiet.",
    ["w-pause-then-truth", "w-stress-slips"]);
  E("w-the-spiral", "The spiral", "Health drops, the worst future is pictured, and the self-talk turns cruel.",
    ["w-stress-slips", "w-worst-then-cruel"]);

  const near = (a, b, how, why) => ({ a, b, how, why });
  [
    near("typeHumor", "typeTalk", 85, "How they joke follows their type."),
    near("typeWords", "typeTalk", 90, "Their words follow their type."),
    near("typeWords", "characterFingerprint", 80, "Type words are part of a character's fingerprint."),
    near("stressSpeech", "characterFingerprint", 80, "The fingerprint's stress shift, by type."),
    near("typePair", "interruptions", 65, "A clashing pair interrupts."),
    near("typePair", "speechLength", 60, "Who leads talks longest."),
    near("innerMonologue", "freeIndirect", 85, "Free indirect speech is one way inner talk reaches the page."),
    near("innerMonologue", "selfTalk", 90, "What they say to themselves, and how it looks on the page."),
    near("sessionScene", "healerType", 85, "The healer in the conversation."),
    near("sessionScene", "dialogueQuestions", 70, "A session runs on questions."),
    near("pictureAhead", "picturingOutcomes", 90, "The habit and how it is written."),
    near("pictureAhead", "tense", 60, "A pictured future shifts the tense."),
    near("typeHumor", "subtextGap", 60, "A joke that dodges hides what is meant."),
  ].forEach((p) => {
    ["a", "b"].forEach((k) => { if (!DB.get("curiosity", p[k])) throw new Error("db-writing-dialogue: unknown curiosity " + p[k]); });
    DB.writingProximities.push(p);
  });
})(typeof window !== "undefined" ? window.CuriosityDB : require("../curiosity-db.js"));
