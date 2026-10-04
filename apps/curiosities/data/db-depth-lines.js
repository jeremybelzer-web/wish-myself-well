/* data/db-depth-lines.js: lines and delivery, deeper (the finer tools for how lines are written and spoken, and
   what the body does while they are said). 16 curiosities: said to one but meant for another, answering a question
   with a question, many words against few, the word they take back, how they talk marks who they are, fighting
   for the last word, a quiet word in a loud room, changing the subject, saying their name, switching languages,
   finishing each other's sentences, the practiced line, reading words out loud, talking side by side, the body
   says the opposite, and talking through a door. Each has its own graded sliders and a momentum note, tied into
   suites, proximities and proximity suites. Ideas already in the database (cut off mid-sentence and talking over
   each other, a line thrown away, a speech that builds, trailing off, talking to themselves, one side of a phone
   call, saying it back, said against meant and irony for a line that means the opposite, the pause before the
   punchline and silence length, business with a prop for a line said while the hands are busy, walking out and
   saying it with their back turned for walking away mid-line, the wrong person overhears, two talks that cross)
   are linked to, not repeated. Loaded after db-depth-feeling.js. Written 2026-10-04 by the depth thread (lines). */
(function (DB) {
  const SHARED = (push) => [
    { id: "push", label: "Pushes the story", range: { min: 0, max: 5 }, from: push, to: Math.min(5, push + 2), plain: "How much this curiosity moves the story forward here." },
    { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], from: "holds", to: "demands what's next", plain: "Whether it settles something or leaves a question the next moment must answer." },
    { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], from: "loosely", to: "clearly", plain: "How closely it carries one of the film's themes here." },
  ];
  /* c(id, label, workspace, plain, sliders, momentum [push 0-5, plot, theme, pull, cue, tryThis], extra)
     sliders: [id, label, scale-or-range, plain, extra?]; the first slider is the main one.
     scale = ["low", ..., "high"] in order; range = [min, max] or [min, max, "unit"] or [min, max, "unit", step]. */
  function c(id, label, workspace, plain, sliders, m, extra) {
    const row = DB.curiosity(Object.assign({ id, label, plain, workspace, main: sliders[0][0], sliders: sliders.concat(SHARED(m[0])) }, extra || {}));
    if (row && !row.momentum) row.momentum = { push: m[0], plot: m[1], theme: m[2], pull: m[3], cue: m[4], tryThis: m[5] };
  }
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const U = { unordered: true };

  /* ---------- who the line is for ---------- */

  c("meantForAnother", "Said to one, meant for another", "lines",
    "A line spoken to one person but really aimed at someone else in the room, who is meant to overhear it. Everyone usually knows who it is for.",
    [
      ["aim", "How clearly it is aimed at the other", [0, 5], "How obvious it is that the line is really for someone else."],
      ["realTarget", "Who it is really for", ["a partner", "a parent", "a boss", "a rival", "an ex", "the whole room"], "The person the line is truly aimed at.", U],
      ["through", "Who it is said to", ["a child", "a friend", "a stranger", "a pet", "a waiter", "nobody, just out loud"], "The person (or pet) the line is spoken to on the surface.", U],
      ["reacts", "How the real target takes it", ["pretends not to hear", "goes stiff", "answers back the same way", "speaks up directly"], "What the person it was meant for does about it."],
      ["glances", "Glances at the real target", [0, 5], "How many quick looks the speaker throws at the one it is really for."],
      ["middle", "The one in the middle", ["has no idea", "catches on", "feels used", "refuses to carry it"], "How the person spoken to feels about being used as a go-between."],
    ],
    [2, "Lets a fight start without anyone saying it out loud, and can push the real target into answering.", "Shows people who cannot talk to each other straight.", "We wait for the real target to answer, and wonder if they will.", "audio", "At dinner, have the mother tell her son how nice it is when people call their parents, while she looks at her daughter."]);

  c("questionBack", "Answering a question with a question", "lines",
    "Someone is asked something and answers with a question of their own. It can stall, tease, hide something or turn the tables on the one who asked.",
    [
      ["dodge", "How much it dodges", [0, 5], "How far the return question gets away from giving an answer."],
      ["why", "Why they do it", ["to stall", "to hide something", "to turn the tables", "to tease", "because the answer is obvious"], "What the question in return is for.", U],
      ["rounds", "Questions in a row", [1, 8], "How many questions go back and forth with no answer."],
      ["tone", "Tone", ["gentle", "playful", "sharp", "hostile"], "How the return question sounds."],
      ["asker", "How the asker takes it", ["gives up", "asks again", "answers it", "snaps"], "What the first person does when they get a question back."],
      ["finally", "Does the answer come", ["never", "with a look", "later", "right there"], "Whether a real answer ever arrives, and how."],
    ],
    [2, "Holds back an answer the story needs, which keeps the question alive.", "Shows who holds the power in a talk: the one asking or the one refusing.", "We want the real answer and lean in each time it slips away.", "thought", "When the detective asks where he was last night, have the suspect ask where the detective was."]);

  c("wordCountClash", "Many words against few", "lines",
    "One person talks in long, full speeches while the other answers in one or two words. The gap shows who wants something and who is holding back.",
    [
      ["gap", "Gap in how much they say", [0, 5], "How much more one person talks than the other."],
      ["talker", "Who talks the most", ["the one who wants something", "the nervous one", "the one in charge", "the one who is lying"], "Why the big talker keeps talking.", U],
      ["quiet", "The short answers", ["a few words", "one word", "just a sound", "silence"], "How little the quiet one gives back."],
      ["longest", "Longest speech", [5, 120, "seconds"], "How long the talker's longest run lasts."],
      ["flips", "Do they swap", ["never", "once, at the turn", "back and forth"], "Whether the quiet one ever becomes the talker."],
      ["power", "Who holds the power", ["the talker", "the quiet one", "it shifts"], "Who is really in control of the talk.", U],
    ],
    [2, "When the quiet one finally says a full sentence, the scene turns.", "Shows that the one who talks the most is often the one with the least power.", "We wait for the quiet one to break.", "audio", "Let the salesman talk for a full minute, and have the customer say only 'No.'"]);

  c("takenBackWord", "The word they take back", "lines",
    "Someone starts to say a word, stops, and swaps it for a safer one ('I lo... like you'). We hear what they almost said.",
    [
      ["caught", "How much of the word gets out", ["a breath", "the first sound", "half the word", "all of it, then fixed"], "How far into the word they get before they stop."],
      ["word", "What the word was", ["a feeling", "a name", "a secret", "an insult", "a promise"], "What the swallowed word would have given away.", U],
      ["swap", "What replaces it", ["nothing", "a safer word", "a cough", "a new topic"], "What they put in its place.", U],
      ["heard", "Did the other person catch it", ["no", "maybe", "yes, and lets it go", "yes, and calls it out"], "Whether the listener noticed the slip."],
      ["stall", "Stall after it", [0, 3, "seconds", 0.5], "How long the awkward pause lasts after the swap."],
      ["times", "Times it happens", [1, 5], "How often across the film they almost say it."],
    ],
    [2, "Leaks a feeling or a secret that the rest of the story has to deal with.", "Shows the gap between what people feel and what they let themselves say.", "We wait for the day they say the whole word.", "audio", "Have him start to say 'love', turn it into 'like' with a cough, and let her raise one eyebrow."]);

  c("wayOfTalking", "How they talk marks who they are", "lines",
    "The way a person talks tells us where they come from and who they are: an accent, a favorite word, very formal or very loose speech, slang, long words or short ones.",
    [
      ["strength", "How strongly it marks them", [0, 5], "How much their way of talking sets them apart."],
      ["marker", "What marks it", ["an accent", "a pet word or phrase", "formal speech", "slang", "fancy words", "plain short words"], "The thing in their speech we notice.", U],
      ["against", "Against the others", ["the same as everyone", "a little different", "stands out", "nobody else talks like that"], "How different they sound from the people around them."],
      ["shifts", "Changes with who they talk to", ["never", "a little", "a lot", "a completely different voice"], "Whether they talk one way to the boss and another way at home."],
      ["slips", "When the real voice slips out", ["never", "when angry", "when tired or drunk", "when back home"], "When their first way of talking comes back.", U],
      ["others", "How others react", ["don't notice", "tease them", "copy them", "look down on them"], "What the people around them make of it.", U],
    ],
    [1, "A slip in their voice can give away a lie about where they come from.", "Shows class, home and belonging through sound alone.", "We listen for the moment the real voice comes out.", "audio", "Let the polished lawyer slip back into her small-town accent the moment her brother calls."]);

  c("lastWordFight", "Fighting for the last word", "lines",
    "In an argument, each person keeps adding one more line so they can be the one who speaks last. Who gets it, and how, says who won.",
    [
      ["fight", "How hard they fight for it", [0, 5], "How badly both of them need to speak last."],
      ["rounds", "Extra lines traded", [1, 10], "How many 'one more thing' lines go back and forth."],
      ["who", "Who gets it", ["the one leaving", "the one left behind", "a third person", "nobody, a door slams"], "Who ends up speaking last.", U],
      ["form", "What the last word is", ["a word", "a full line", "a sound", "a look", "a slammed door"], "What closes the argument.", U],
      ["sizes", "How the lines change", ["get smaller", "stay the same", "get bigger"], "Whether each extra line shrinks to a single word or grows into a shout."],
      ["after", "Silence after", [0, 10, "seconds"], "How long the quiet lasts once someone has had the last word."],
    ],
    [2, "Ends a fight with a winner, or with a wound that carries into the next scene.", "Shows pride: people who would rather be right than be close.", "We want to see who cracks first.", "audio", "Have the couple trade 'Fine.' 'Fine.' 'Good.' 'Great.' until the kid at the table says 'Okay.'"]);

  c("whisperInNoise", "A quiet word in a loud room", "lines",
    "Two people share a private line, whispered or leaned in close, in the middle of a loud party, club or crowd. The noise makes the moment feel secret.",
    [
      ["loud", "How loud the room is", [0, 5], "How much noise surrounds the two of them."],
      ["closeness", "How close they lean", ["across the table", "side by side", "mouth to ear"], "How near they get to be heard."],
      ["room", "The loud place", ["a party", "a club", "a train", "a stadium", "a busy kitchen"], "Where the noise comes from.", U],
      ["heard", "How well we hear it", ["not at all", "a few words", "clearly"], "Whether the audience gets to hear the whispered line."],
      ["drop", "The room sound drops", ["no", "a little", "almost all the way"], "Whether the noise around them fades so we can hear."],
      ["what", "What is whispered", ["a joke", "a secret", "a warning", "a confession"], "What the private line is.", U],
    ],
    [2, "Passes a secret or a warning that changes what happens next.", "Shows two people in their own world inside a crowd.", "We lean in to hear what they say.", "audio", "At the wedding, with the band at full blast, let the bride lean to her sister's ear and say one word."]);

  c("dodgedQuestion", "Changing the subject", "lines",
    "Someone is asked something they do not want to answer, and they steer the talk somewhere else: a joke, a compliment, a sudden question about the weather.",
    [
      ["smooth", "How smooth the dodge is", ["clumsy", "obvious", "smooth", "we barely notice"], "How well they hide that they are dodging."],
      ["tool", "How they dodge", ["a joke", "a compliment", "a new topic", "an offer of food or drink", "an attack"], "What they use to change the subject.", U],
      ["tries", "Times the question comes back", [1, 6], "How many times the question is asked again."],
      ["asker", "The asker", ["lets it go", "tries again", "calls it out", "pins them down"], "How hard the person asking keeps pushing."],
      ["hiding", "What they are hiding", ["something small", "a feeling", "a mistake", "a crime"], "How big the thing behind the dodge is."],
      ["knows", "Does the audience know", ["no", "guesses", "knows"], "Whether we know what they are dodging."],
    ],
    [2, "Hides something the story will later drag into the open.", "Shows what people cannot face.", "We want the question to land at last.", "thought", "Each time his wife asks about the money, have him ask if she wants more coffee."]);

  c("sayingTheName", "Saying their name", "lines",
    "Using someone's name in a line, or a nickname, or their full name, changes how the line hits. A full name can mean trouble; the first use of a first name can mean love.",
    [
      ["weight", "Weight on the name", [0, 5], "How much the name carries in the line."],
      ["form", "Which name", ["a nickname", "the first name", "the full name", "a title like 'sir' or 'mom'", "their last name"], "Which version of their name is used.", U],
      ["where", "Where in the line", ["at the start", "in the middle", "at the end", "alone, as the whole line"], "Where the name sits in the line.", U],
      ["first", "How rare it is", ["used all the time", "rarely", "first time ever"], "Whether we often hear them call this person by name."],
      ["voice", "How it is said", ["soft", "plain", "sharp", "shouted"], "The voice the name is said in."],
      ["answer", "What the other does", ["nothing", "stops", "turns around", "says theirs back"], "How the person named reacts.", U],
    ],
    [1, "Marks a turn in a relationship: closer, colder, or caught.", "Shows how names carry love, respect or blame.", "We notice when the name changes, and wait for what it means.", "audio", "Let the boss who always says 'Miller' say 'Sam' once, quietly, at the hospital."]);

  c("languageSwitch", "Switching languages", "lines",
    "A character slips from one language into another mid-talk: to keep a secret, to swear, to say something tender, or because the feeling comes out in their first language.",
    [
      ["switch", "How much they switch", [0, 5], "How much of the talk moves into the other language."],
      ["why", "Why they switch", ["to keep a secret", "to swear", "to say something tender", "to show where they are from", "by accident when upset"], "What the switch is for.", U],
      ["leftOut", "Who is left out", ["no one", "one person", "most of the room"], "How many people in the scene cannot follow."],
      ["subtitles", "Subtitles", ["none", "only some", "all of it"], "How much of the other language the audience gets to read."],
      ["back", "Back to the first language", ["right away", "after a line", "stays switched"], "How long they stay in the other language."],
      ["understood", "Does someone secretly understand", ["no", "later", "right away"], "Whether someone who seemed left out followed every word."],
    ],
    [2, "A secret said in another language can be understood by the wrong person.", "Shows home, belonging and who is shut out.", "We wonder who in the room understands.", "audio", "Have the grandmother switch to her first language to warn her grandson, then let the guest answer her in it."],
    { also: ["audio-mix"] });

  c("finishSentence", "Finishing each other's sentences", "lines",
    "One person starts a line and the other finishes it. Done in step, it shows two people who are close; done wrong, it shows they are not as close as they think.",
    [
      ["sync", "How in step they are", [0, 5], "How smoothly one picks up where the other stops."],
      ["who", "Who finishes", ["one always", "they take turns", "both say it at once"], "Which of the two does the finishing.", U],
      ["right", "Is the ending right", ["wrong", "nearly", "exactly"], "Whether the finished line is what the first person meant."],
      ["times", "Times it happens", [1, 8], "How often they do it in the scene."],
      ["starter", "How the starter takes it", ["annoyed", "surprised", "pleased", "finishes again on top"], "How the one who began feels about being finished for.", U],
      ["watchers", "Others in the room", ["no one", "rolls their eyes", "feels left out"], "What anyone else in the scene makes of it.", U],
    ],
    [1, "A wrong ending can show a crack in a couple the story will widen.", "Shows how well two people know each other, or think they do.", "We watch to see if they stay in step.", "audio", "Let the old couple finish each other's lines all evening, then have him finish one wrong and her go quiet."]);

  c("rehearsedLine", "The practiced line", "lines",
    "A character practices what they will say (in the mirror, in the car, out loud), then the real moment comes and it goes differently.",
    [
      ["gap", "How far the real moment drifts", [0, 5], "How different the real moment is from the practice."],
      ["where", "Where they practice", ["in the mirror", "in the car", "to a pet", "in their head", "to a friend"], "Where we see them rehearse.", U],
      ["runs", "Practice runs we see", [1, 6], "How many times we watch them try it."],
      ["real", "What happens for real", ["word for word", "forgets half", "blurts something else", "never says it"], "How the real moment goes."],
      ["other", "The other person", ["lets them finish", "cuts in first", "says it first", "does not care"], "What the person they rehearsed for does.", U],
      ["shown", "How we see the practice", ["heard only", "shown before", "cut together with the real moment"], "How the film places the practice against the real thing.", U],
    ],
    [3, "Sets up a moment we know is coming, and then lets it go wrong.", "Shows the gap between the people we plan to be and the people we are.", "We wait for the real moment and dread it with them.", "plot", "Show her practicing the breakup speech in the car three times, then have him break up with her first."]);

  c("readAloud", "Reading words out loud", "lines",
    "A letter, note, diary or message is read out loud in a scene. Often the reader's voice gives way to the writer's, or the reader cannot finish.",
    [
      ["hold", "How much the words carry the scene", [0, 5], "How much of the scene rests on what is being read."],
      ["what", "What is read", ["a letter", "a diary", "a will", "a text message", "a speech on paper"], "The words being read.", U],
      ["voice", "Whose voice we hear", ["the reader", "the reader, then the writer", "the writer", "both together"], "Whose voice carries the words.", U],
      ["reader", "Who reads", ["the one it was written to", "someone else", "the writer", "a stranger"], "Who holds the page.", U],
      ["breaks", "Does the reader break", ["reads it flat", "voice shakes", "has to stop", "cannot go on"], "How much the words get to the reader."],
      ["shown", "What we see while it is read", ["the reader", "the writer, back then", "the page", "the one it is about"], "What the picture shows during the reading.", U],
    ],
    [2, "A letter or a will can bring news from the past that changes the plot.", "Lets someone who is gone or far away speak in their own words.", "We want to hear the last line of the letter.", "audio", "Let the son read his father's letter aloud, and have the father's voice take over halfway through."],
    { also: ["audio-mix"] });

  /* ---------- what the body does with the line ---------- */

  c("sideBySideTalk", "Talking side by side", "movement-lines",
    "A hard talk where the two face the same way, not each other: in a car, on a bench, at the sink. Not having to look makes it easier to say.",
    [
      ["sideBy", "How much they avoid facing", [0, 5], "How fully they face forward instead of each other."],
      ["where", "Where they are", ["in a car", "on a bench", "at a sink", "on a roof", "at a bar"], "The place that keeps them side by side.", U],
      ["doing", "What keeps their eyes busy", ["nothing", "driving", "a chore", "watching a view", "eating"], "What they look at instead of each other.", U],
      ["glances", "Glances across", [0, 8], "How many quick looks they steal at each other."],
      ["turn", "Does one turn to face the other", ["never", "once, on the key line", "both turn at the end"], "Whether they ever look straight at each other."],
      ["shot", "How it is shot", ["both from the front", "one at a time from the side", "from behind"], "Where the camera sits.", U],
    ],
    [2, "Lets a character finally say the hard thing the story has been holding back.", "Shows that some truths can only be said without eye contact.", "We wait for the one moment they turn and look.", "movement", "Put the father and daughter in the car at night, eyes on the road, and let her say it at a red light."]);

  c("bodySaysOpposite", "The body says the opposite", "movement-lines",
    "The words say one thing and the body says another: 'I'm fine' with shaking hands, a 'yes' with a little head shake, a smile with clenched fists.",
    [
      ["clash", "How strong the clash is", [0, 5], "How far apart the words and the body are."],
      ["part", "What gives it away", ["the head", "the hands", "the feet", "the shoulders", "the whole body"], "The part of the body that tells the truth.", U],
      ["words", "What the words say", ["yes", "I'm fine", "I don't care", "I'm not scared", "I love you"], "The line the body argues with.", U],
      ["aware", "Do they know", ["no idea", "half aware", "on purpose"], "Whether the speaker knows their body is giving them away."],
      ["caught", "Who catches it", ["no one", "only us", "the other person", "everyone"], "Who sees the body tell the truth."],
      ["camera", "How the camera shows it", ["wide on the whole body", "cuts down to it", "holds on the face only"], "How the film lets us see the clash.", U],
    ],
    [2, "Tells us a character is lying, which raises a question the story must answer.", "Shows that the body cannot keep a secret as well as the mouth.", "We watch the body instead of the face.", "movement", "Have her say 'I'm happy for you' while her foot taps faster and faster under the table."]);

  c("throughTheDoor", "Talking through a door", "movement-lines",
    "Two people talk through a closed door, a wall or a window. They cannot see each other, so the voice and the body work alone: a hand on the door, a forehead against it.",
    [
      ["barrier", "How closed off they are", ["a thin curtain", "a window", "a door left ajar", "a locked door", "a wall"], "What stands between them, from thin to solid."],
      ["inside", "Who is shut in", ["the hurt one", "the angry one", "the scared one", "a child"], "Who is on the inside.", U],
      ["touch", "Touching the barrier", ["none", "a hand on it", "a forehead on it", "both sides touching"], "How they reach toward each other through it."],
      ["sink", "How they sit or stand", ["standing", "leaning", "sliding down", "both sitting, back to back"], "How far the bodies sink against it."],
      ["opens", "Does it open", ["never", "just a crack", "at the end", "they break it down"], "Whether the barrier comes away."],
      ["shot", "Where the camera is", ["one side", "both sides in turn", "both in one frame"], "Which side of the door we see.", U],
    ],
    [2, "Whether the door opens marks whether the two will make up.", "Shows two people close enough to touch and still shut apart.", "We wait for the door to open.", "movement", "Have the mother sit against the bathroom door, hand flat on it, while her son talks from the other side."]);

  /* ---------- suites ---------- */

  S("the-dinner-of-digs", "The dinner of digs", "lines",
    "Nobody says it straight at the family dinner: digs aimed through the kids, questions met with questions, and a dodge every time money comes up.",
    [
      { curiosity: "meantForAnother", value: 4 },
      { curiosity: "meantForAnother", slider: "through", value: "a child" },
      { curiosity: "meantForAnother", slider: "reacts", value: "goes stiff" },
      { curiosity: "questionBack", value: 3 },
      { curiosity: "questionBack", slider: "tone", value: "sharp" },
      { curiosity: "dodgedQuestion", value: "smooth" },
      { curiosity: "dodgedQuestion", slider: "tool", value: "an offer of food or drink" },
      { curiosity: "sayingTheName", slider: "form", value: "the full name" },
      { curiosity: "subtext", value: "far apart", weight: 60 },
    ]);

  S("the-confession-in-the-car", "The confession in the car", "movement-lines",
    "She practiced it all week. In the car at night, eyes on the road, she starts the word, swallows it, and finally says it at a red light.",
    [
      { curiosity: "sideBySideTalk", value: 4 },
      { curiosity: "sideBySideTalk", slider: "where", value: "in a car" },
      { curiosity: "sideBySideTalk", slider: "turn", value: "once, on the key line" },
      { curiosity: "rehearsedLine", value: 3 },
      { curiosity: "rehearsedLine", slider: "where", value: "in the mirror" },
      { curiosity: "takenBackWord", value: "half the word" },
      { curiosity: "takenBackWord", slider: "heard", value: "maybe" },
      { curiosity: "silence", value: "long", weight: 60 },
    ], { also: ["lines"] });

  S("the-old-married-pair", "The old married pair", "lines",
    "Forty years together: they finish each other's lines, one does all the talking, and neither will let the other have the last word.",
    [
      { curiosity: "finishSentence", value: 5 },
      { curiosity: "finishSentence", slider: "who", value: "they take turns" },
      { curiosity: "wordCountClash", value: 3 },
      { curiosity: "wordCountClash", slider: "quiet", value: "one word" },
      { curiosity: "lastWordFight", value: 4 },
      { curiosity: "lastWordFight", slider: "sizes", value: "get smaller" },
      { curiosity: "doubleAct", value: "a couple", weight: 60 },
    ]);

  S("the-quiet-suspect", "The quiet suspect", "lines",
    "The detective talks and talks; the suspect answers in single words and turns every question back around.",
    [
      { curiosity: "wordCountClash", value: 5 },
      { curiosity: "wordCountClash", slider: "talker", value: "the one in charge" },
      { curiosity: "wordCountClash", slider: "power", value: "the quiet one" },
      { curiosity: "questionBack", value: 4 },
      { curiosity: "questionBack", slider: "why", value: "to turn the tables" },
      { curiosity: "dodgedQuestion", slider: "hiding", value: "a crime" },
      { curiosity: "statusGap", value: "big gap", weight: 60 },
    ]);

  S("home-in-their-voice", "Home in their voice", "lines",
    "Her polished voice at work, the old accent when her brother calls, her first language when she is upset, and his nickname for her that nobody else uses.",
    [
      { curiosity: "wayOfTalking", value: 4 },
      { curiosity: "wayOfTalking", slider: "marker", value: "an accent" },
      { curiosity: "wayOfTalking", slider: "shifts", value: "a lot" },
      { curiosity: "languageSwitch", value: 3 },
      { curiosity: "languageSwitch", slider: "why", value: "by accident when upset" },
      { curiosity: "sayingTheName", value: 3 },
      { curiosity: "sayingTheName", slider: "form", value: "a nickname" },
      { curiosity: "fishOutOfWater", value: 2, weight: 50 },
    ]);

  S("the-letter-scene", "The letter scene", "lines",
    "The son reads his father's letter aloud; the father's voice takes over, and the son has to stop before the last line.",
    [
      { curiosity: "readAloud", value: 5 },
      { curiosity: "readAloud", slider: "voice", value: "the reader, then the writer" },
      { curiosity: "readAloud", slider: "breaks", value: "has to stop" },
      { curiosity: "readAloud", slider: "shown", value: "the writer, back then" },
      { curiosity: "trailingOff", value: "the end of the line" },
      { curiosity: "voiceover", value: "now and then", weight: 60 },
    ]);

  S("the-locked-bathroom", "The locked bathroom", "movement-lines",
    "He is shut in the bathroom saying he is fine, voice steady and hands shaking; she sits against the door, hand flat on it.",
    [
      { curiosity: "throughTheDoor", value: "a locked door" },
      { curiosity: "throughTheDoor", slider: "touch", value: "a hand on it" },
      { curiosity: "throughTheDoor", slider: "sink", value: "sliding down" },
      { curiosity: "bodySaysOpposite", value: 4 },
      { curiosity: "bodySaysOpposite", slider: "words", value: "I'm fine" },
      { curiosity: "bodySaysOpposite", slider: "part", value: "the hands" },
      { curiosity: "emoHands", value: "clench", weight: 60 },
    ]);

  S("secrets-at-the-party", "Secrets at the party", "lines",
    "The music is loud, a warning passes mouth to ear, a pointed toast is aimed over the guests' heads, and a smile says yes while the fists say no.",
    [
      { curiosity: "whisperInNoise", value: 4 },
      { curiosity: "whisperInNoise", slider: "closeness", value: "mouth to ear" },
      { curiosity: "whisperInNoise", slider: "what", value: "a warning" },
      { curiosity: "meantForAnother", value: 3 },
      { curiosity: "meantForAnother", slider: "through", value: "nobody, just out loud" },
      { curiosity: "bodySaysOpposite", value: 3 },
      { curiosity: "bodySaysOpposite", slider: "words", value: "yes" },
      { curiosity: "ambienceBed", value: 4, weight: 50 },
    ]);

  /* ---------- proximities ---------- */

  P("meant-for-another-subtext", "When a line is aimed through someone else, said and meant pull apart", "lines",
    "When a line is more clearly aimed at someone other than the one it is said to, the gap between what is said and what is meant rises within a beat.",
    { curiosity: "meantForAnother", change: "rises" }, { curiosity: "subtext", change: "rises" }, 1, { also: ["emotion"] });
  P("meant-for-another-last-word", "When the target answers the same way, the fight for the last word starts", "lines",
    "When the real target answers back through someone else too, the fight for the last word rises within 2 beats.",
    { curiosity: "meantForAnother", slider: "reacts", is: "answers back the same way" }, { curiosity: "lastWordFight", change: "rises" }, 2);
  P("question-back-almost-answer", "When questions come back as questions, the answer keeps slipping away", "lines",
    "When the return questions dodge further, the answer almost given rises within 2 beats.",
    { curiosity: "questionBack", change: "rises" }, { curiosity: "almostAnswer", change: "rises" }, 2, { also: ["plot"] });
  P("word-clash-status", "When one talks and the other barely answers, the gap in rank shows", "lines",
    "When the gap in how much each one says grows, the gap in rank between them rises within 2 beats.",
    { curiosity: "wordCountClash", change: "rises" }, { curiosity: "statusGap", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("taken-back-unspoken", "When words keep being taken back, the feeling nobody names grows", "lines",
    "When more of the swallowed word gets out, the feeling nobody names rises within 3 beats.",
    { curiosity: "takenBackWord", change: "rises" }, { curiosity: "unspokenFeeling", change: "rises" }, 3, { also: ["emo-road"] });
  P("taken-back-called-out", "When the slip is called out, the secret starts slipping", "lines",
    "When the listener catches the swallowed word and calls it out, the secret slips within a beat.",
    { curiosity: "takenBackWord", slider: "heard", is: "yes, and calls it out" }, { curiosity: "plotSecret", is: "slipping" }, 1, { also: ["plot"] });
  P("way-of-talking-outsider", "When their way of talking stands out, they feel out of place", "lines",
    "When their way of talking marks them more strongly, being out of place rises within 2 beats.",
    { curiosity: "wayOfTalking", change: "rises" }, { curiosity: "fishOutOfWater", change: "rises" }, 2);
  P("voice-slips-language", "When the real voice slips out in anger, they switch languages", "lines",
    "When their first way of talking comes back in anger, switching into their first language rises within a beat.",
    { curiosity: "wayOfTalking", slider: "slips", is: "when angry" }, { curiosity: "languageSwitch", change: "rises" }, 1);
  P("language-switch-apart", "When they switch languages, someone is left standing apart", "lines",
    "When more of the talk moves into another language, someone standing apart from the group rises within a beat.",
    { curiosity: "languageSwitch", change: "rises" }, { curiosity: "apartFromGroup", change: "rises" }, 1, { also: ["emotion"] });
  P("last-word-walk-out", "When the fight for the last word grows, someone walks out", "lines",
    "When both fight harder to speak last, walking out rises within a beat.",
    { curiosity: "lastWordFight", change: "rises" }, { curiosity: "walkOut", change: "rises" }, 1, { also: ["character-motion"] });
  P("whisper-tenderness", "When the room is loud and they lean in, tenderness grows", "lines",
    "When the room around the whisper gets louder, tenderness between the two rises within a beat.",
    { curiosity: "whisperInNoise", change: "rises" }, { curiosity: "tenderness", change: "rises" }, 1, { also: ["emotion"] });
  P("whisper-room-drops", "When the whisper matters most, the room sound falls away", "lines",
    "When the room sound is pulled almost all the way down for the whisper, the background sound of the place drops within a beat.",
    { curiosity: "whisperInNoise", slider: "drop", is: "almost all the way" }, { curiosity: "ambienceBed", change: "drops" }, 1, { also: ["audio-mix"] });
  P("dodge-open-questions", "When the subject keeps changing, our questions pile up", "lines",
    "When the dodge gets smoother, the questions the audience is holding rise within 2 beats.",
    { curiosity: "dodgedQuestion", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 2, { also: ["plot"] });
  P("dodge-pinned-secret", "When they are pinned down, the secret has a close call", "lines",
    "When the asker pins them down, the secret comes to a close call within a beat.",
    { curiosity: "dodgedQuestion", slider: "asker", is: "pins them down" }, { curiosity: "plotSecret", is: "close call" }, 1, { also: ["plot"] });
  P("full-name-dread", "When the full name is used, dread comes in", "lines",
    "When someone is called by their full name, dread rises within a beat.",
    { curiosity: "sayingTheName", slider: "form", is: "the full name" }, { curiosity: "dread", change: "rises" }, 1, { also: ["emo-road"] });
  P("first-name-warmth", "When a name is used for the first time, warmth grows", "lines",
    "When someone finally says the other's name for the first time ever, the warmth between them rises within a beat.",
    { curiosity: "sayingTheName", slider: "first", is: "first time ever" }, { curiosity: "warmth", change: "rises" }, 1);
  P("finish-sentence-warmth", "When they finish each other's lines, warmth grows", "lines",
    "When they finish each other's lines more in step, the warmth between them rises within a beat.",
    { curiosity: "finishSentence", change: "rises" }, { curiosity: "warmth", change: "rises" }, 1);
  P("finish-wrong-misunderstanding", "When the line is finished wrong, a misunderstanding starts", "lines",
    "When one finishes the other's line wrong, misunderstanding rises within a beat.",
    { curiosity: "finishSentence", slider: "right", is: "wrong" }, { curiosity: "misunderstanding", change: "rises" }, 1, { also: ["comedy"] });
  P("rehearsed-trails-off", "When the real moment drifts from the practice, the line trails off", "lines",
    "When the real moment drifts further from the practiced line, trailing off rises within a beat.",
    { curiosity: "rehearsedLine", change: "rises" }, { curiosity: "trailingOff", change: "rises" }, 1);
  P("read-aloud-release", "When the reader cannot go on, the feeling spills out", "lines",
    "When the reader cannot finish the letter, the release of feeling rises within a beat.",
    { curiosity: "readAloud", slider: "breaks", is: "cannot go on" }, { curiosity: "emoRelease", change: "rises" }, 1, { also: ["emotion"] });
  P("side-by-side-says-more", "When they sit side by side, more gets said", "movement-lines",
    "When they face forward instead of each other, the amount said rises within 2 beats.",
    { curiosity: "sideBySideTalk", change: "rises" }, { curiosity: "wordsAmount", change: "rises" }, 2, { also: ["lines"] });
  P("body-opposite-subtext", "When the body says the opposite, said and meant pull apart", "movement-lines",
    "When the body clashes harder with the words, the gap between said and meant rises within a beat.",
    { curiosity: "bodySaysOpposite", change: "rises" }, { curiosity: "subtext", change: "rises" }, 1, { also: ["emotion"] });
  P("door-touch-tenderness", "When both touch the door, tenderness comes through it", "movement-lines",
    "When both sides touch the door at once, tenderness rises within a beat.",
    { curiosity: "throughTheDoor", slider: "touch", is: "both sides touching" }, { curiosity: "tenderness", change: "rises" }, 1, { also: ["emotion"] });
  P("door-shut-loneliness", "When the barrier is more solid, loneliness grows", "movement-lines",
    "When what stands between them is more closed off, loneliness rises within 2 beats.",
    { curiosity: "throughTheDoor", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });

  /* ---------- proximity suites ---------- */

  PS("pressure-under-the-words", "Pressure under the words", "lines",
    "A line aimed through someone else, a question turned back, a subject changed, and one person doing all the talking: the real fight happens under the words.",
    ["meant-for-another-subtext", "question-back-almost-answer", "dodge-open-questions", "word-clash-status"]);
  PS("what-slips-out", "What slips out", "lines",
    "A word taken back, a slip called out, the old voice coming back in anger, and a practiced line that falls apart.",
    ["taken-back-unspoken", "taken-back-called-out", "voice-slips-language", "rehearsed-trails-off"]);
  PS("close-without-looking", "Close without looking", "lines",
    "A whisper in a loud room, lines finished for each other, a name said for the first time, and a hard talk side by side.",
    ["whisper-tenderness", "finish-sentence-warmth", "first-name-warmth", "side-by-side-says-more"], { also: ["movement-lines"] });
  PS("doors-and-last-words", "Doors and last words", "movement-lines",
    "Digs answered with digs turn into a fight for the last word, someone walks out, and the door between them is shut until a hand touches it.",
    ["meant-for-another-last-word", "last-word-walk-out", "door-shut-loneliness", "door-touch-tenderness"], { also: ["lines"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
