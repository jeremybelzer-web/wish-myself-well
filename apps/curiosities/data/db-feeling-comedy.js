/* Comedy and emotion, deeper (Jeremy, 2026-10-02: comedy is central and needs many curiosities; emotion shows
   in movement, speech, face, posture, amounts of action and dialogue, setting, lighting, and against the scene
   before). Adds real sliders to the comedy and emotion rows that had only generic ones, new curiosities for the
   tools comedy writers and actors name, and the suites, proximities and proximity suites that tie them together. */
(function (DB) {
  const C = (o) => DB.curiosity(o);
  const add = (id, sliders) => DB.curiosity({ id, sliders });
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));

  /* ---------- emotion: real sliders where there were only generic ones ---------- */
  add("emotionIntensity", [
    ["build", "How it builds", ["all at once", "quickly", "steadily", "slowly"], "Whether the feeling arrives in a flash or creeps up."],
    ["peakHold", "How long the peak lasts", [0, 10, "seconds"], "How long the strongest moment is held before it eases."],
  ]);
  add("emoMove", [
    ["where", "Where it shows in the body", ["hands", "shoulders", "feet", "whole body"], "The part of the body that gives the feeling away."],
    ["rhythm", "Rhythm of movement", ["smooth", "uneven", "jerky", "stop and start"], "How steady the moving is."],
  ]);
  add("emoVoice", [
    ["pitch", "Pitch", ["low", "lower than usual", "normal", "higher than usual", "breaking"], "Where the voice sits, from low and heavy to cracking."],
    ["pace", "Speed of speech", [0, 5], "From slow and deliberate to rushed."],
    ["crack", "Voice breaks", ["steady", "wavers", "catches", "breaks"], "Whether the voice gives way."],
  ]);
  add("movementAmount", [["purpose", "Moving with purpose", ["aimless", "fidgeting", "busy", "purposeful"], "Whether the moving has a goal or leaks nerves."]]);
  add("wordsAmount", [
    ["onTopic", "Saying what they feel", ["talks around it", "hints", "says it plainly"], "Whether the words touch the feeling or avoid it."],
    ["interrupt", "Interruptions", [0, 5], "How often people cut each other off."],
  ]);
  add("postureChanges", [["direction", "Opening or closing", ["closing up", "shifting", "opening up"], "Whether the posture closes or opens over the scene."]]);
  add("emoActions", [["object", "Done to an object", ["no object", "touches it", "grips it", "throws or breaks it"], "Whether the feeling goes into a prop: a cup gripped, a door slammed."]]);
  add("settingMood", [["agrees", "Place agrees with the feeling", ["fights it", "neutral", "agrees"], "A cheerful party for a grieving character fights the feeling; rain agrees with it."]]);
  add("lightingMood", [["shift", "Light changes with the feeling", ["stays put", "drifts", "shifts on the turn"], "Whether the light moves when the feeling turns."]]);
  add("emoContrastPrev", [["bridge", "How the change is bridged", ["hard cut", "a sound carries over", "a slow fade", "a matching image"], "How we get from the last scene's feeling to this one."]]);
  add("emoTurn", [
    ["trigger", "What turns it", ["a line", "a look", "an object", "news", "a memory"], "What sets off the turn."],
    ["speed", "How fast it turns", [0, 5], "From a slow change of heart to an instant flip."],
  ]);
  add("emoShown", [["toWhom", "Shown to whom", ["no one", "the audience only", "one person", "everyone"], "Who gets to see the feeling."]]);
  add("emoSpread", [["speed", "How fast it spreads", [0, 5], "How quickly others catch the feeling."]]);

  /* ---------- emotion: new curiosities ---------- */
  C({
    id: "mixedFeelings",
    label: "Mixed feelings",
    workspace: "emotion",
    also: ["comedy", "lines"],
    group: "Emotion",
    plain: "Two feelings at once (happy and sad at a wedding, scared and thrilled on a ride). How strong the second one is and which wins.",
    main: "balance",
    sliders: [
      ["balance", "Balance of the two", ["one feeling", "mostly the first", "even", "mostly the second"], "From one clear feeling to the second one taking over."],
      ["second", "The second feeling", ["loving", "joyful", "curious", "melancholy", "anxious", "fearful", "angry", "triumphant", "absurd"], "Which feeling sits under the first.", { unordered: true }],
      ["shown", "Both shown", ["only the first", "a flicker of the second", "both clearly"], "Whether we see both feelings or only feel the second."],
    ],
  });
  C({
    id: "subtext",
    label: "Said against meant",
    workspace: "emotion",
    also: ["lines", "comedy"],
    group: "Emotion",
    plain: "The gap between what a character says and what they mean. 'I'm fine' said through tears.",
    main: "gap",
    sliders: [
      ["gap", "How far apart", ["says what they mean", "a little off", "far apart", "the opposite"], "From plain speech to saying the opposite of the feeling."],
      ["caught", "Who catches it", ["no one", "the audience", "the other character", "everyone"], "Who understands the real meaning."],
      ["leak", "Where it leaks", ["the eyes", "the hands", "a pause", "the voice"], "Where the true feeling slips out."],
    ],
  });
  C({
    id: "emoEyes",
    label: "The eyes",
    workspace: "emotion",
    also: ["character-motion", "camera-angle"],
    group: "Emotion",
    plain: "What the eyes do: where they look, how wet, how wide, how often they blink.",
    main: "look",
    sliders: [
      ["look", "Where they look", ["down", "away", "at the other", "through the other", "at the camera"], "The direction of the gaze.", { unordered: true }],
      ["wet", "Tears", ["dry", "glassy", "welling", "falling"], "From dry eyes to tears falling."],
      ["wide", "Open or narrowed", ["narrowed", "relaxed", "wide"], "Narrowed in anger or suspicion, wide in fear or surprise."],
      ["blinks", "Blinking", [0, 5], "From a fixed stare to rapid blinking."],
    ],
  });
  C({
    id: "emoHands",
    label: "The hands",
    workspace: "emotion",
    also: ["character-motion", "movement-lines"],
    group: "Emotion",
    plain: "Hands give feelings away: fidgeting, clenched, hidden, touching the face.",
    main: "doing",
    sliders: [
      ["doing", "What they do", ["still", "fidget", "clench", "hide", "touch the face", "reach out"], "The main thing the hands are doing.", { unordered: true }],
      ["tension", "Tension", [0, 5], "From loose to white-knuckled."],
    ],
  });
  C({
    id: "personalSpace",
    label: "Personal space",
    workspace: "emotion",
    also: ["placement", "comedy-mix"],
    group: "Emotion",
    plain: "How close two characters stand, against how close they would like to be. Too close is tension or comedy; too far is hurt.",
    main: "distance",
    sliders: [
      ["distance", "How close", ["touching", "close", "conversation", "apart", "across the room"], "The distance between them."],
      ["comfort", "Comfortable with it", ["very uncomfortable", "uneasy", "fine", "wants closer"], "How the distance feels to them."],
      ["who", "Who closes it", ["no one", "one of them", "both"], "Who moves in."],
    ],
  });
  C({
    id: "emoRelease",
    label: "Release",
    workspace: "emotion",
    also: ["emo-road", "comedy"],
    group: "Emotion",
    plain: "How a held feeling finally comes out: tears, a laugh, a shout, a long breath, or not at all.",
    main: "how",
    sliders: [
      ["how", "Comes out as", ["it doesn't", "a sigh", "tears", "a laugh", "a shout", "an action"], "The form the release takes.", { unordered: true }],
      ["size", "How big", [0, 5], "From a small sigh to a full breakdown."],
      ["after", "After it", ["worse", "the same", "lighter", "changed"], "How the character is once it is out."],
    ],
  });
  C({
    id: "audienceFeeling",
    label: "What the audience feels",
    workspace: "emotion",
    also: ["emo-road", "comedy"],
    group: "Emotion",
    plain: "The audience's feeling, which can differ from the character's: we laugh while they panic, or dread what they can't see.",
    main: "match",
    sliders: [
      ["match", "Against the character", ["the same", "stronger", "weaker", "different", "the opposite"], "How the audience's feeling compares with the character's."],
      ["why", "Because", ["we feel with them", "we know more", "we know less", "we see the funny side"], "Why the audience feels it."],
    ],
  });
  C({
    id: "catharsis",
    label: "Catharsis",
    workspace: "emo-road",
    also: ["structure", "emotion"],
    group: "Emotion",
    plain: "The release the whole film has been building to: how much is let go, and how long the film made us wait for it.",
    main: "size",
    sliders: [
      ["size", "How much is let go", [0, 5], "From a small easing to a flood."],
      ["wait", "How long it was held", [0, 100, "% of the film"], "How much of the film built up to it."],
      ["shared", "Shared by", ["one character", "two", "everyone", "the audience alone"], "Who has the release."],
    ],
  });
  C({
    id: "emotionalDebt",
    label: "Feeling held in",
    workspace: "emo-road",
    also: ["emotion", "arc"],
    group: "Emotion",
    plain: "How much feeling a character has swallowed so far without letting it out. The more held in, the bigger the release when it comes.",
    main: "held",
    sliders: [
      ["held", "How much held in", [0, 5], "From nothing held back to bursting."],
      ["scenes", "For how long", [0, 20, "scenes"], "How many scenes it has been held."],
    ],
  });

  /* emotion suites */
  const E = "emotion";
  S("laughing-through-tears", "Laughing through tears", E, "Sad and happy at once: wet eyes, a laugh, warm light.", [
    { curiosity: "mixedFeelings", value: "even" },
    { curiosity: "emotion", value: "melancholy", weight: 60 },
    { curiosity: "emoEyes", slider: "wet", value: "welling", weight: 70 },
    { curiosity: "emoRelease", value: "a laugh", weight: 70 },
  ], { also: ["comedy"] });
  S("brave-face", "Brave face", E, "Saying 'I'm fine' while the hands and eyes say otherwise.", [
    { curiosity: "subtext", value: "the opposite" },
    { curiosity: "emoShown", value: "mostly hidden", weight: 70 },
    { curiosity: "emoHands", value: "clench", weight: 50 },
    { curiosity: "emoVoice", slider: "crack", value: "wavers", weight: 50 },
  ], { also: ["lines"] });
  S("dawning-realization", "Dawning realization", E, "Understanding arrives slowly: the face goes still, the eyes widen, the camera creeps in.", [
    { curiosity: "emotionIntensity", slider: "build", value: "slowly" },
    { curiosity: "emoEyes", slider: "wide", value: "wide", weight: 70 },
    { curiosity: "stillness", value: 4, weight: 60 },
    { curiosity: "cameraMove", value: "push in", weight: 50 },
  ], { also: ["camera-motion"] });
  S("the-breakdown", "The breakdown", E, "Everything held in comes out at once.", [
    { curiosity: "emoRelease", value: "tears" },
    { curiosity: "emoRelease", slider: "size", value: 5 },
    { curiosity: "emotionalDebt", value: 5, weight: 60 },
    { curiosity: "emoVoice", slider: "crack", value: "breaks", weight: 70 },
  ], { also: ["emo-road"] });
  S("cold-fury", "Cold fury", E, "Anger held perfectly still: quiet voice, narrowed eyes, no movement.", [
    { curiosity: "emotion", value: "angry" },
    { curiosity: "volume", value: 1, weight: 70 },
    { curiosity: "emoEyes", slider: "wide", value: "narrowed", weight: 70 },
    { curiosity: "stillness", value: 5, weight: 70 },
    { curiosity: "emoShown", value: "mostly hidden", weight: 50 },
  ]);
  S("giddy-relief", "Giddy relief", E, "The danger has passed and everyone laughs too hard.", [
    { curiosity: "emoRelease", value: "a laugh" },
    { curiosity: "emoSpread", value: "the whole room", weight: 70 },
    { curiosity: "emotion", value: "joyful", weight: 60 },
    { curiosity: "tensionCurve", value: 0, weight: 50 },
  ], { also: ["comedy"] });
  S("numb-shock", "Numb shock", E, "Too much to take in: no feeling shows at all, sound drops away.", [
    { curiosity: "emoShown", value: "fully hidden" },
    { curiosity: "emoMove", value: "frozen", weight: 70 },
    { curiosity: "emoEyes", slider: "look", value: "through the other", weight: 60 },
    { curiosity: "soundDesign", slider: "density", value: "silent", weight: 50 },
  ], { also: ["music"] });
  S("awkward-tenderness", "Awkward tenderness", E, "Two people who care and can't say it: too much space, hands that almost reach.", [
    { curiosity: "personalSpace", value: "apart" },
    { curiosity: "personalSpace", slider: "comfort", value: "wants closer", weight: 70 },
    { curiosity: "emoHands", value: "reach out", weight: 50 },
    { curiosity: "subtext", value: "far apart", weight: 60 },
  ], { also: ["comedy-mix"] });
  S("dramatic-dread", "Dread: we know, they don't", E, "The audience knows the danger; the character is cheerful. We feel the fear for them.", [
    { curiosity: "audienceFeeling", value: "the opposite" },
    { curiosity: "audienceFeeling", slider: "why", value: "we know more" },
    { curiosity: "tensionCurve", value: 4, weight: 60 },
  ], { also: ["structure"] });

  /* emotion proximities */
  P("trigger-turns", "When a trigger appears, the feeling turns", E, "An object, a line or news sets off a turn in the feeling within a beat.", { curiosity: "emoTurn", slider: "trigger", change: "changes" }, { curiosity: "emoTurn", change: "rises" }, 1);
  P("held-in-release", "When enough feeling is held in, it comes out", E, "Feeling held in for long enough bursts out within a scene or two.", { curiosity: "emotionalDebt", change: "rises" }, { curiosity: "emoRelease", slider: "size", change: "rises" }, 8, { workspace: "emo-road" });
  P("release-lighter", "After a release, the character is lighter", E, "Once the feeling is out, the character is lighter within a few beats.", { curiosity: "emoRelease", slider: "size", change: "rises" }, { curiosity: "emoRelease", slider: "after", change: "rises" }, 3, { whenText: "a feeling is let out", thenText: "the character is lighter" });
  P("subtext-pause", "When said and meant pull apart, the pauses grow", E, "A widening gap between words and meaning brings longer pauses within a beat.", { curiosity: "subtext", change: "rises" }, { curiosity: "silence", change: "rises" }, 1, { also: ["lines"] });
  P("space-closes-intensity", "When people move closer, the feeling grows", E, "Closing the distance raises the strength of the feeling within a beat.", { curiosity: "personalSpace", change: "drops" }, { curiosity: "emotionIntensity", change: "rises" }, 1, { also: ["placement"] });
  P("tears-close-up", "When tears well, the shot gets closer", E, "Welling eyes pull the camera in within a beat.", { curiosity: "emoEyes", slider: "wet", change: "rises" }, { curiosity: "shotSize", change: "drops" }, 1, { also: ["camera-angle"] });
  P("we-know-tension", "When we know more than they do, tension rises", E, "Knowing what the character doesn't raises the tension within a beat.", { curiosity: "audienceFeeling", slider: "why", is: "we know more" }, { curiosity: "tensionCurve", change: "rises" }, 1, { also: ["structure"] });
  P("mixed-face-flicker", "When feelings mix, the face flickers", E, "Mixed feelings show as a face that changes more often within a beat.", { curiosity: "mixedFeelings", change: "rises" }, { curiosity: "faceIntensity", change: "changes" }, 1);

  PS("the-dam-breaks", "The dam breaks", "emo-road", "A trigger turns the feeling, what was held in comes out, and the character is lighter after.", ["trigger-turns", "held-in-release", "release-lighter", "hidden-then-burst"], { also: ["emotion", "arc"] });
  PS("what-isnt-said", "What isn't said", E, "Words and meaning pull apart, pauses grow, the face flickers and the camera moves in on the eyes.", ["subtext-pause", "mixed-face-flicker", "tears-close-up"], { also: ["lines"] });
  PS("closeness-and-dread", "Closeness and dread", E, "People move closer and feel more while we, knowing more, dread what is coming.", ["space-closes-intensity", "we-know-tension"], { also: ["placement", "structure"] });

  /* ---------- comedy: real sliders where there were only generic ones ---------- */
  add("comedyTopic", [
    ["punch", "Who it punches", ["the self", "an equal", "the powerful", "the powerless"], "Who the joke is at the expense of. Punching up at the powerful usually plays better than punching down."],
    ["relatable", "How relatable", [0, 5], "How many people in the audience have lived it."],
  ]);
  add("comicRegister", [["consistency", "Holds the register", ["breaks it often", "now and then", "never breaks"], "Whether the scene keeps one style of funny or jumps between them."]]);
  add("payoffDistance", [["reminder", "Reminders on the way", ["none", "one", "several"], "How often the setup is brushed against before it pays off."]]);
  add("laughsPerMinute", [
    ["size", "Size of the laughs", ["smiles", "chuckles", "laughs", "big laughs"], "How hard the laughs land, separate from how many."],
    ["breather", "Breathers between", [0, 5], "How much quiet room is left between laughs."],
  ]);
  add("jokeCarrier", [["aware", "Knows it's funny", ["has no idea", "half knows", "knows"], "Whether the one being funny knows it. Comedy often plays best when they don't."]]);
  add("chaosInRoom", [["source", "Source of chaos", ["a person", "an animal", "an object", "the weather", "a misunderstanding"], "Where the chaos comes from.", { unordered: true }]]);
  add("mixPlot", [["blame", "Who gets blamed", ["no one", "the wrong one", "the right one", "everyone"], "Whom the mess is pinned on."]]);
  add("mixArc", [["learns", "Someone learns", ["no one", "the funny one", "the straight one", "both"], "Who changes because of the mix."]]);
  add("mixLaughs", [["who", "Who gets the laughs", ["the straight one", "the funny one", "both", "the room"], "Whose reactions carry the laughs."]]);

  /* ---------- comedy: new curiosities ---------- */
  const K = "comedy";
  C({
    id: "comicFlaw",
    label: "Comic flaw",
    workspace: K,
    also: ["arc", "archetype"],
    group: "Comedy",
    plain: "The flaw that makes a character funny: vanity, greed, cowardice, pride, cluelessness. The more blind they are to it, the funnier.",
    main: "flaw",
    sliders: [
      ["flaw", "Which flaw", ["vanity", "greed", "cowardice", "pride", "cluelessness", "laziness", "neediness", "rigidity"], "The flaw driving the comedy.", { unordered: true }],
      ["blind", "Blind to it", ["sees it", "half sees it", "completely blind"], "Whether the character knows about their flaw."],
      ["size", "How big", [0, 5], "From a quirk to the whole personality."],
    ],
  });
  C({
    id: "comicPremise",
    label: "Comic premise",
    workspace: K,
    also: ["structure"],
    group: "Comedy",
    plain: "The funny 'what if' of the scene (what if the hitman is afraid of dogs). How clear it is and how grounded the world around it stays.",
    main: "clarity",
    sliders: [
      ["clarity", "How clear", [0, 5], "How quickly the audience gets the joke of the situation."],
      ["grounded", "Grounded world", ["cartoon", "heightened", "real"], "How real everything around the premise feels."],
      ["mined", "How far it is taken", [0, 5], "How many jokes the scene gets out of the premise."],
    ],
  });
  C({
    id: "topper",
    label: "The topper",
    workspace: K,
    group: "Comedy",
    plain: "The joke after the joke: just when the laugh fades, one more line or image tops it.",
    main: "count",
    sliders: [
      ["count", "Toppers", [0, 4], "How many extra jokes stack on the first."],
      ["bigger", "Each one bigger", ["smaller", "the same", "bigger"], "Whether each topper beats the last."],
      ["from", "Comes from", ["the same character", "another character", "the background", "the edit"], "Who or what delivers it."],
    ],
  });
  C({
    id: "specificity",
    label: "Oddly specific",
    workspace: K,
    also: ["lines", "set"],
    group: "Comedy",
    plain: "A detail too precise to be ordinary ('a 2007 Honda Odyssey with one working door'). Specific details are funnier than general ones.",
    main: "level",
    sliders: [
      ["level", "How specific", ["general", "specific", "oddly specific", "absurdly specific"], "From vague to weirdly exact."],
      ["where", "Where", ["a line", "a prop", "the set", "a costume"], "Where the specific detail lives."],
    ],
  });
  C({
    id: "fourthWall",
    label: "Talking to the camera",
    workspace: K,
    also: ["camera-angle", "lines"],
    group: "Comedy",
    plain: "A character who knows we're watching: a glance at the lens, an aside, a whole speech to us.",
    main: "break",
    sliders: [
      ["break", "How far", ["never", "a glance", "an aside", "talks to us"], "From ignoring the camera to addressing us."],
      ["others", "Others notice", ["no", "one does", "everyone"], "Whether other characters see them do it."],
    ],
  });
  C({
    id: "exaggeration",
    label: "Exaggeration",
    workspace: K,
    also: ["lines", "character-motion"],
    group: "Comedy",
    plain: "Making something bigger than life: a reaction, a description, a problem.",
    main: "size",
    sliders: [
      ["size", "How much", [0, 5], "From true to life to wildly overblown."],
      ["what", "What is blown up", ["a reaction", "a description", "a problem", "a body", "a prop"], "The thing exaggerated.", { unordered: true }],
    ],
  });
  C({
    id: "humiliation",
    label: "Humiliation",
    workspace: K,
    also: ["comedy-mix", "emotion"],
    group: "Comedy",
    plain: "A character loses face. Funny when they earned it, painful when they didn't.",
    main: "size",
    sliders: [
      ["size", "How bad", [0, 5], "From a small embarrassment to public disgrace."],
      ["earned", "Did they earn it", ["not at all", "a little", "completely"], "Whether their own flaw caused it."],
      ["witnesses", "Witnesses", ["no one", "one", "a few", "everyone"], "Who sees it."],
    ],
  });
  C({
    id: "escalatingLie",
    label: "The lie that grows",
    workspace: K,
    also: ["plot"],
    group: "Comedy",
    plain: "A small lie that needs a bigger lie to cover it, then a bigger one, until it collapses.",
    main: "size",
    sliders: [
      ["size", "How big the lie is now", [0, 5], "From a white lie to a whole false life."],
      ["layers", "Lies on lies", [0, 6], "How many cover-ups are stacked."],
      ["near", "How close to collapse", ["safe", "wobbling", "about to fall", "collapsed"], "How near it is to being found out."],
    ],
  });
  C({
    id: "misunderstanding",
    label: "Misunderstanding",
    workspace: K,
    also: ["comedy-mix", "plot"],
    group: "Comedy",
    plain: "Two characters think they are talking about the same thing and are not. The engine of farce.",
    main: "depth",
    sliders: [
      ["depth", "How deep", [0, 5], "From a small mix-up to everyone acting on a wrong idea."],
      ["who", "Who sees it", ["no one", "the audience", "one character", "everyone at the end"], "Who understands what is really happening."],
      ["lasts", "How long it lasts", [0, 10, "scenes"], "How many scenes before it clears up."],
    ],
  });
  C({
    id: "cutawayGag",
    label: "Cutaway gag",
    workspace: K,
    also: ["structure"],
    group: "Comedy",
    plain: "A quick cut away to something else (a memory, an imagined moment, what someone else is doing) that makes the line funnier.",
    main: "length",
    sliders: [
      ["length", "How long", [0, 10, "seconds"], "Length of the cutaway."],
      ["kind", "Cuts to", ["a memory", "an imagined moment", "somewhere else", "a contradiction"], "What the cutaway shows.", { unordered: true }],
    ],
  });

  /* comedy suites */
  S("farce", "Farce", K, "Misunderstandings, lies on lies, doors slamming, everything speeding up until it collapses.", [
    { curiosity: "misunderstanding", value: 4 },
    { curiosity: "escalatingLie", slider: "layers", value: 4, weight: 70 },
    { curiosity: "comicEscalation", value: 4, weight: 70 },
    { curiosity: "cutRate", value: "fast", weight: 50 },
  ], { also: ["comedy-mix"] });
  S("the-topper", "The topper", K, "A joke lands, then another tops it, then one more.", [
    { curiosity: "topper", value: 2 },
    { curiosity: "topper", slider: "bigger", value: "bigger", weight: 70 },
    { curiosity: "comicBeat", value: "payoff lands", weight: 60 },
  ]);
  S("punching-up", "Punching up", K, "The joke is on the powerful: the boss slips, the snob is exposed.", [
    { curiosity: "comedyTopic", slider: "punch", value: "the powerful" },
    { curiosity: "humiliation", value: 3, weight: 60 },
    { curiosity: "humiliation", slider: "earned", value: "completely", weight: 70 },
    { curiosity: "statusGap", slider: "fall", value: 4, weight: 50 },
  ], { also: ["comedy-mix"] });
  S("aside-to-camera", "The aside", K, "Mid-scene, a character turns and tells us what they really think.", [
    { curiosity: "fourthWall", value: "an aside" },
    { curiosity: "subtext", value: "the opposite", weight: 50 },
    { curiosity: "shotSize", value: "close", weight: 40 },
  ], { also: ["camera-angle", "lines"] });
  S("oddly-specific-world", "Oddly specific world", K, "Every detail is weirdly exact, in the lines, props and set, while everyone acts normal.", [
    { curiosity: "specificity", value: "absurdly specific" },
    { curiosity: "comicRegister", value: "deadpan", weight: 60 },
    { curiosity: "comicPremise", slider: "grounded", value: "real", weight: 50 },
  ], { also: ["set", "lines"] });
  S("blind-flaw", "Blind to their flaw", K, "A vain, greedy or clueless character who can't see it while everyone else can.", [
    { curiosity: "comicFlaw", slider: "blind", value: "completely blind" },
    { curiosity: "comicFlaw", slider: "size", value: 4, weight: 70 },
    { curiosity: "jokeCarrier", slider: "aware", value: "has no idea", weight: 70 },
  ], { also: ["arc"] });
  S("cutaway-contradiction", "The cutaway that contradicts", K, "'I've never been happier', cut to them crying in a car.", [
    { curiosity: "cutawayGag", slider: "kind", value: "a contradiction" },
    { curiosity: "cutawayGag", value: 3, weight: 50 },
    { curiosity: "subtext", value: "the opposite", weight: 60 },
  ], { also: ["structure"] });
  S("big-reaction", "Bigger than life", K, "Reactions and descriptions blown up far past real.", [
    { curiosity: "exaggeration", value: 5 },
    { curiosity: "comicRegister", value: "cartoon", weight: 70 },
    { curiosity: "comicReaction", value: "a spit take", weight: 50 },
  ]);

  /* comedy proximities */
  P("laugh-topper", "When a joke lands, a topper follows", K, "A payoff is topped by one more joke within two beats.", { curiosity: "comicBeat", is: "payoff lands" }, { curiosity: "topper", change: "rises" }, 2);
  P("lie-grows", "When a lie wobbles, a bigger lie covers it", K, "A lie close to being found out is covered with a bigger one within a beat.", { curiosity: "escalatingLie", slider: "near", change: "rises" }, { curiosity: "escalatingLie", change: "rises" }, 1);
  P("lie-collapse-humiliation", "When the lie collapses, someone is humiliated", K, "A lie that falls apart brings humiliation within a beat.", { curiosity: "escalatingLie", slider: "near", is: "collapsed" }, { curiosity: "humiliation", change: "rises" }, 1);
  P("misunderstanding-chaos", "When a misunderstanding deepens, the chaos grows", K, "A deeper misunderstanding brings more chaos in the room within two beats.", { curiosity: "misunderstanding", change: "rises" }, { curiosity: "chaosInRoom", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("humiliation-cringe", "When someone is humiliated in front of others, the cringe rises", K, "Public humiliation raises the cringe within a beat.", { curiosity: "humiliation", slider: "witnesses", change: "rises" }, { curiosity: "cringe", change: "rises" }, 1);
  P("blind-flaw-setback", "When a blind flaw grows, the character is set back", K, "A flaw the character can't see trips them up within a few beats.", { curiosity: "comicFlaw", slider: "size", change: "rises" }, { curiosity: "plotProgress", change: "drops" }, 4, { also: ["plot"] });
  P("aside-reaction", "When a character talks to us, the others react a beat late", K, "After an aside, the other characters' reactions come a beat late.", { curiosity: "fourthWall", change: "rises" }, { curiosity: "comicReaction", change: "rises" }, 1);
  P("specific-callback", "An oddly specific detail comes back later", K, "A weirdly exact detail planted early pays off a few scenes later.", { curiosity: "specificity", is: "absurdly specific" }, { curiosity: "callback", change: "rises" }, 12, { also: ["structure"], whenText: "an oddly specific detail is planted", thenText: "it comes back as a callback" });

  PS("farce-engine", "The farce engine", K, "A misunderstanding grows the chaos, a lie needs a bigger lie, the lie collapses and someone is humiliated.", ["misunderstanding-chaos", "lie-grows", "lie-collapse-humiliation", "humiliation-cringe"], { also: ["comedy-mix"] });
  PS("laugh-stack", "Stacking laughs", K, "A joke lands, a topper follows, and the specific detail comes back later as a callback.", ["laugh-topper", "specific-callback", "setup-payoff"]);
  PS("flaw-comedy", "Comedy of a flaw", K, "A blind flaw trips the character up, they're humiliated, and the room cringes.", ["blind-flaw-setback", "humiliation-cringe", "pride-fall"], { also: ["arc", "comedy-mix"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
