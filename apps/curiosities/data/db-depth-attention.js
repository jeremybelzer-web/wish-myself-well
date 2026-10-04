/* data/db-depth-attention.js: audience attention and momentum, deeper (the feeling of going somewhere important).
   16 curiosities a filmmaker uses to steer where the audience looks and what they wonder about: keeping the eye
   in place across the cut, everyone looking the same way, something in the frame that does not belong, how far
   apart the surprises come, the promise of the opening, a stretch where nothing pulls, leaving at the best part,
   the answer almost given, the closed box we want opened, one answer opening a bigger question, the clue that
   points the wrong way, knowing what they want in this scene, a rule we learn early, a character asking our
   question for us, time to take in the shot, and the moment we are all waiting for. Each has its own graded
   sliders and a momentum note, tied into suites, proximities and proximity suites. Ideas already in the database
   (questions the audience is holding, a clock running out, who knows first, where the eye goes first, the
   opening grab, how the scene ends, scenes from setup to payoff, something new every few seconds) are linked to,
   not repeated. Loaded after db-depth-comedy.js. Written 2026-10-04 by the depth thread (attention). */
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

  /* ---------- where the eye goes ---------- */

  c("eyeTrace", "Keeping the eye in place across the cut", "transitions",
    "When one shot ends, the audience is looking at one spot. If the next shot puts the important thing in that same spot, the eye never has to search and a fast run of shots feels smooth. If the next shot puts it somewhere else, the eye has to jump, which can feel like a jolt. Editors call this eye trace.",
    [
      ["match", "How well the spot matches", [0, 5], "From the eye has to hunt all over the new shot (0) to the subject is exactly where the eye already was (5)."],
      ["where", "Where the eye sits at the cut", ["the center", "the left third", "the right third", "near the top", "near the bottom"], "The part of the frame the eye is resting on as we cut.", U],
      ["leadBy", "What carries the eye into the cut", ["nothing", "a movement", "a look", "a bright spot", "a pointing hand"], "What guides the eye to that spot just before the cut.", U],
      ["jump", "How far the eye must jump", ["no jump", "a small step", "across the frame", "a deliberate jolt"], "How far the eye has to travel to find the subject in the new shot."],
      ["findTime", "Time to find the subject", [0, 2, "seconds", 0.1], "How long the eye takes to find what matters after the cut."],
      ["breaks", "When the match is broken on purpose", ["never", "at the scary moment", "at the big turn", "at every cut in the fight"], "Where the film throws the eye off on purpose to shake us.", U],
    ],
    [3, "Smooth eye paths let a fast run of shots feel like one push forward, so the story can race.", "A broken eye path can make us feel the character's shock with them.", "The eye never has to search, so it flows straight into the next shot.", "visual", "In a chase, end each shot with the runner on the right third and start the next shot with them there too."]);

  c("allEyesTurn", "Everyone looks the same way", "focus",
    "A whole room, or a whole crowd, turns to look at the same thing: a door that opens, a sound, one person standing up. The audience's eyes follow theirs, and we badly want to see what they see. Filmmakers use it to announce that something new has arrived.",
    [
      ["turn", "How much of the frame turns", [0, 5], "From one or two heads turning (0) to every single person in the frame turning at once (5)."],
      ["count", "How many people look", [1, 50, "people", 1], "How many people in the shot turn their heads."],
      ["timing", "How they turn", ["slowly, one by one", "all together", "in one sudden snap"], "Whether the turn spreads through the room or happens all at once."],
      ["at", "What they look at", ["a door", "a sound off screen", "one person", "the sky", "the camera"], "What pulls all the eyes.", U],
      ["shown", "When we see what they see", ["right away", "after a beat", "after a long wait", "never"], "How long the film makes us wait before showing what they are looking at."],
      ["holdout", "Is there one who does not look", ["everyone looks", "one person looks away", "one person keeps eating"], "Whether one person ignores it, which can be funny or suspicious.", U],
    ],
    [3, "When a room turns its head, something new has arrived and the scene has to deal with it.", "Shows how a group pays attention together, and who stands outside it.", "Our eyes follow theirs, and we need to see what they see.", "movement", "In the busy diner, let every head turn to the door at once, and hold on their faces before we see who walked in."]);

  c("oddDetail", "Something that doesn't belong", "focus",
    "A small thing in the frame that is wrong: a wet footprint on a dry floor, a clock showing the wrong time, a bandage nobody mentions, a stranger standing in the back. The audience notices it and starts to wonder, which keeps them watching closely.",
    [
      ["odd", "How strange it is", [0, 5], "From barely odd (0) to clearly impossible (5)."],
      ["kind", "What the odd thing is", ["a stain", "something missing", "a wrong time on a clock", "a stranger in the back", "an object out of place", "a wound"], "The kind of detail that does not belong.", U],
      ["size", "How big it is in the frame", ["tiny", "small", "easy to see", "huge"], "How much of the picture the detail takes up."],
      ["noticed", "Who notices it", ["nobody", "only us", "one character", "everyone"], "Whether the people in the story see it, or only the audience does."],
      ["explained", "When it is explained", ["right away", "later", "at the end", "never"], "How long the film lets us wonder."],
      ["shownTimes", "Times it is shown", [1, 5, "times", 1], "How often the film lets us see it again."],
    ],
    [3, "The odd detail is a small promise that the story will explain itself later.", "Shows that a calm surface can hide something wrong.", "We scan every new shot for the next thing that does not fit.", "visual", "Put one muddy boot print on the white carpet of the perfect house, and let nobody in the scene look at it."]);

  /* ---------- the shape of attention across the film ---------- */

  c("surpriseSpacing", "How far apart the surprises come", "structure",
    "The rhythm of surprise across the film: how many there are, how far apart, and whether they grow. Surprises too close together wear the audience out; too far apart and they drift. Many films space them so the gaps get shorter toward the end.",
    [
      ["surprise", "How surprising the story is", [0, 5], "From you can see everything coming (0) to a surprise around every corner (5)."],
      ["gap", "Usual time between surprises", [1, 30, "minutes", 1], "How long the film usually runs between one surprise and the next."],
      ["pattern", "The rhythm of the surprises", ["steady, like a clock", "speeding up", "slowing down", "bunched together", "at random"], "How the surprises are spaced out across the film.", U],
      ["growth", "How their size changes", ["each smaller", "all the same size", "each bigger than the last"], "Whether each surprise is bigger than the one before."],
      ["lastOne", "How big the last surprise is", ["small", "medium", "the biggest of all"], "How much the film saves for the end."],
      ["fair", "Were they set up", ["out of nowhere", "a hint or two", "fully set up, we could have guessed"], "Whether a careful viewer could have seen the surprise coming."],
    ],
    [3, "Each surprise turns the story in a new direction just as it starts to feel settled.", "How often the world surprises the characters says how safe their world is.", "Once surprised, the audience watches closely, waiting for the next one.", "plot", "Space the surprises so the gaps get shorter toward the end, and keep the biggest one for last."]);

  c("openingPromise", "The promise of the opening", "structure",
    "The first minutes of a film tell the audience what kind of ride this will be: laughs, fear, a mystery, a love story. That promise is why people keep watching. A film that keeps its promise, and then gives more than it promised, feels like it is going somewhere.",
    [
      ["promise", "How clear the promise is", [0, 5], "From the opening could lead anywhere (0) to we know exactly what kind of film this is (5)."],
      ["kind", "What it promises", ["laughs", "fear", "a mystery", "romance", "action", "tears"], "The kind of film the opening says this is.", U],
      ["how", "How the promise is made", ["a short scene before the titles", "the first image", "the music", "a voice telling us", "the title"], "What in the opening makes the promise.", U],
      ["minutes", "How long it takes to make", [1, 15, "minutes", 1], "How many minutes the film takes to make its promise clear."],
      ["reminders", "Times it reminds us", [0, 8, "reminders", 1], "How often later scenes remind us of what was promised."],
      ["kept", "Does the film keep it", ["broken", "bent", "kept", "kept and topped"], "Whether the rest of the film gives what the opening promised."],
    ],
    [3, "The promise tells the audience what to wait for, so every scene is measured against it.", "What a film promises first is what it believes matters most.", "We keep watching to get what we were promised.", "thought", "Open the horror film with a short scene before the titles where something is taken in the dark, then go back to sunny daytime."]);

  c("lullStretch", "A stretch where nothing pulls", "structure",
    "A part of the film where nothing is pulling the audience forward: no question open, no goal in sight, no clock. Attention drifts and people reach for their phones. Sometimes a rest is planned; often it is an accident that needs a fix.",
    [
      ["lull", "How flat the stretch feels", [0, 5], "From still pulling us along (0) to attention drifting right away (5)."],
      ["minutes", "How long it lasts", [0, 10, "minutes", 0.5], "How many minutes go by with nothing pulling."],
      ["where", "Where in the film it falls", ["the opening", "the early middle", "the middle", "just before the end"], "Where the flat stretch sits.", U],
      ["why", "Why nothing pulls", ["no open question", "no goal", "too much talk", "the same beat again", "waiting for a plan"], "What is missing.", U],
      ["fix", "How it is fixed", ["left as it is", "add a clock", "open a question", "cut it shorter", "add a surprise"], "What the filmmaker does about it.", U],
      ["planned", "Was it planned", ["an accident", "half planned", "on purpose, a rest"], "Whether the quiet stretch is a chosen rest or a sag."],
    ],
    [1, "A planned rest lets the next push hit harder; an accidental one stalls the story.", "Quiet stretches can show what the characters are like when nothing is happening.", "When nothing pulls, the audience waits for a reason to lean in again.", "thought", "If the middle sags, give the hero a deadline, or let someone ask the question the audience stopped asking."]);

  c("cutAwayAtPeak", "Leaving at the best part", "structure",
    "When a film follows two or more stories, it can leave one at its most exciting moment and cut to the other: the hero is hanging from the ledge, and we go to a calm kitchen across town. The audience is pulled through the other story to get back. Old writers called it streaky bacon: layers of fat and lean.",
    [
      ["peak", "How close to the peak we leave", [0, 5], "From leaving once the trouble is over (0) to leaving one second before the answer (5)."],
      ["threads", "Stories we cut between", [2, 5, "stories", 1], "How many different stories the film keeps going at once."],
      ["leaves", "Where we leave", ["after it's over", "as trouble starts", "at the peak", "one second before the answer"], "At what point in the moment we cut away."],
      ["away", "How long we stay away", [0.5, 20, "minutes", 0.5], "How long until we come back to the story we left."],
      ["back", "Where we come back in", ["where we left", "a little later", "after it's over"], "Whether we come back to the same second, or find it already settled."],
      ["other", "What we cut to", ["something calm", "something as tense", "something even more tense"], "How tense the other story is when we arrive there."],
    ],
    [4, "Leaving one story at its peak makes us carry its question through the next scene.", "Cutting between stories shows how lives run side by side.", "We sit through one story leaning toward the one we left.", "plot", "Cut away just as the door handle turns, play a whole calm scene elsewhere, and come back to the door already open."]);

  /* ---------- questions the audience holds ---------- */

  c("almostAnswer", "The answer almost given", "plot",
    "A character is about to say the thing we most want to know (who did it, where it is hidden, how they really feel) and something stops them. The answer slips away, and we want it twice as much.",
    [
      ["almost", "How close it gets", [0, 5], "From barely hinted (0) to one word away from the answer (5)."],
      ["what", "What the answer is about", ["who did it", "where it is", "what happened that night", "how they feel", "who they really are"], "The question that nearly gets answered.", U],
      ["stoppedBy", "What stops the answer", ["someone walks in", "a phone rings", "they change their mind", "they faint or die", "the scene cuts away"], "What cuts the answer off.", U],
      ["times", "Times it slips away", [1, 5, "times", 1], "How many times the film nearly gives the answer."],
      ["given", "When we finally get it", ["later that scene", "much later", "at the very end", "never"], "How long the film holds the answer back."],
      ["worth", "Is it worth the wait", ["a letdown", "as big as we hoped", "bigger than we hoped"], "Whether the answer, when it comes, pays off the waiting."],
    ],
    [4, "The answer that slips away becomes the thing the next scenes chase.", "Shows how hard it is for people to say what matters most.", "We lean in for the word, and keep leaning when it does not come.", "thought", "Have the dying man start to say the killer's name, and let the train whistle drown out the last word."]);

  c("lockedBox", "The closed box we want opened", "plot",
    "A thing the audience can see but not see inside: a locked briefcase, a sealed letter, a door no one opens, a phone with one unread message. It sits in the story asking a question all by itself.",
    [
      ["pull", "How much we want it opened", [0, 5], "From we hardly care (0) to it is all we think about (5)."],
      ["thing", "What is closed", ["a box", "a letter", "a locked door", "a briefcase", "a phone", "a bag"], "The thing that hides what is inside.", U],
      ["glimpses", "Times we nearly see inside", [0, 6, "times", 1], "How often the film almost lets us look."],
      ["guarded", "How well it is guarded", ["just lying there", "hidden away", "locked", "guarded by someone"], "How hard it is to get to."],
      ["opened", "When it is opened", ["early", "halfway", "at the end", "never"], "How long the film keeps it shut."],
      ["inside", "What is inside", ["less than we hoped", "what we guessed", "something we never guessed", "we never see inside"], "What the opening gives us.", U],
    ],
    [3, "The closed thing sits in every scene it is in, quietly asking to be opened.", "What people lock away shows what they fear or treasure.", "We keep checking on it, waiting for someone to open it.", "visual", "Let the briefcase sit in every scene, never opened, and have someone glance at it whenever the talk turns to money."]);

  c("questionRelay", "One answer opens a bigger question", "plot",
    "Each time the film answers a question, the answer brings a new and bigger one: we learn who sent the letter, and now we must know why. The audience never runs out of questions, so the story feels like it keeps going deeper.",
    [
      ["relay", "How often answers bring new questions", [0, 5], "From answers that just close things (0) to every answer opening a new door (5)."],
      ["bigger", "How the new question compares", ["smaller", "the same size", "bigger", "much bigger"], "Whether each new question is bigger than the one it replaced."],
      ["soon", "How soon the new question comes", ["right away", "within the scene", "by the next scene"], "How fast the next question follows the answer."],
      ["links", "Questions in the chain", [1, 10, "questions", 1], "How many questions lead into each other."],
      ["kind", "What the new question asks", ["who", "why", "what happens next", "what is real", "whose side they are on"], "The kind of question the answer opens.", U],
      ["ends", "How the chain ends", ["all answered", "one left open", "the biggest left open"], "Whether the last question is answered."],
    ],
    [5, "Every answer hands the story a new question, so it never stands still.", "Shows that every truth leads to a deeper one.", "The moment we get an answer, we are already hungry for the next.", "thought", "Reveal who sent the letter halfway through, and in the same scene show they have been dead for ten years."]);

  c("redHerring", "The clue that points the wrong way", "plot",
    "A clue that leads the audience, and often the hero, to the wrong answer: the suspicious neighbor who turns out to be innocent, the weapon that was never used. Mystery writers call it a red herring. A good one is fair: it makes sense once the truth comes out.",
    [
      ["mislead", "How strongly it points the wrong way", [0, 5], "From a faint false hint (0) to everyone sure of the wrong answer (5)."],
      ["at", "What it points at", ["a person", "an object", "a place", "a time", "a reason"], "What the false clue makes us suspect.", U],
      ["planted", "Who planted it", ["nobody, by chance", "the real culprit", "the storyteller"], "Whether someone in the story set the false trail, or the film itself did.", U],
      ["count", "How many false clues", [1, 6, "clues", 1], "How many wrong trails the film lays."],
      ["cleared", "When it is shown to be wrong", ["quickly", "in the middle", "at the very end"], "How long the false trail lasts."],
      ["fair", "Is it fair to the audience", ["cheating", "just fair", "fair, and it means something"], "Whether the false clue still makes sense once we know the truth."],
    ],
    [3, "The false trail sends the story down a road, and turning back is a twist of its own.", "Shows how easily we see what we expect to see.", "We chase the clue with the hero, and the turn makes us look harder at everything.", "thought", "Give the gardener muddy hands and a shifty look in every scene, and reveal the mud is from burying the family dog."]);

  c("sceneGoalClear", "Knowing what they want in this scene", "plot",
    "In every scene, someone wants something: to get the keys, to leave, to hear the truth. When the audience knows what that is, they can root for it and feel each step closer or further. When nobody knows, the scene drifts, however pretty it looks.",
    [
      ["clear", "How clearly we know what they want", [0, 5], "From no idea what anyone is after (0) to perfectly clear (5)."],
      ["want", "What they want", ["to get something", "to get away", "to learn something", "to win someone over", "to hide something"], "The kind of goal in this scene.", U],
      ["toldBy", "How we learn it", ["they say it", "we see it", "someone else says it", "we have to guess"], "How the film makes the goal known.", U],
      ["when", "When we learn it", ["the first moment", "early on", "halfway", "at the end"], "How soon in the scene the goal is clear."],
      ["blocked", "What stands in the way", ["nothing", "someone says no", "something in the way", "time runs out"], "What makes the goal hard to reach.", U],
      ["got", "Do they get it", ["yes", "partly", "no", "yes, but at a cost"], "How the scene ends for the goal.", U],
    ],
    [4, "A clear goal gives every moment of the scene a direction: closer or further.", "What a character chases in small scenes adds up to what they want from life.", "We track each step toward the goal and feel every setback.", "plot", "Have her say in the first line that she needs the car keys from his jacket, then play the whole dinner around that jacket."]);

  c("ruleSetEarly", "A rule we learn early", "plot",
    "Early on, the film tells us a rule of its world: never feed them after midnight, the door only opens once, if you say the name it comes. From then on the audience watches for that rule to be broken, and every near miss feels dangerous.",
    [
      ["rule", "How firmly the rule is set", [0, 5], "From mentioned in passing (0) to drilled in so nobody can forget (5)."],
      ["kind", "What kind of rule", ["never do this", "it only works if", "a danger to avoid", "a law of this world", "a deal made"], "The kind of rule the film sets.", U],
      ["told", "How it is set up", ["said out loud", "shown once", "shown twice", "shown with a price paid"], "How strongly the film proves the rule is real."],
      ["gap", "Time until it matters", [0, 90, "minutes", 5], "How long from learning the rule to the moment it counts."],
      ["broken", "Is the rule broken", ["kept", "bent", "broken by accident", "broken on purpose"], "What happens to the rule."],
      ["price", "What breaking it costs", ["nothing", "a little", "a lot", "everything"], "How much the story makes someone pay."],
    ],
    [3, "The rule plants a trap the story will one day spring.", "What a world forbids shows what it fears.", "Every time someone gets close to the rule, we tense up.", "thought", "In the first scene, have the old woman warn that the bell must never ring twice, then have a child find the bell in act two."]);

  c("voicedQuestion", "Asking our question for us", "plot",
    "A character says out loud exactly what the audience is wondering: \"Wait, why did he lie?\" It tells us the film knows, that we are not confused but curious, and it sharpens the question so we carry it forward.",
    [
      ["voiced", "How directly they ask it", [0, 5], "From a vague hint at the question (0) to asking it word for word (5)."],
      ["who", "Who asks it", ["the hero", "a friend", "a child", "the villain", "a stranger"], "The character who speaks for the audience.", U],
      ["how", "How it is asked", ["asked straight out", "joked about", "shouted", "whispered"], "The way the question comes out.", U],
      ["answered", "When it is answered", ["right away", "later", "never"], "How long until someone answers it."],
      ["times", "Times it is asked", [1, 6, "times", 1], "How often the question comes up again."],
      ["lands", "How it lands", ["serious", "worried", "funny"], "The feeling the question carries.", U],
    ],
    [3, "Saying the question out loud turns a vague doubt into the thing the next scenes must answer.", "Shows that the characters wonder about the same things we do.", "We nod along: yes, that is exactly what we want to know.", "thought", "After the strange phone call, have the kid ask what everyone is thinking: \"Who calls at three in the morning and says nothing?\""]);

  /* ---------- time and waiting ---------- */

  c("readTime", "Time to take in the shot", "speed",
    "Every shot needs a moment for the audience to take it in. A busy frame needs longer, a face we know needs less. Cut before we have read it and we feel rushed or confused; cut just as we get it and the film flows; hold long after and it starts to drag, or turns uneasy.",
    [
      ["read", "How fully we take each shot in", [0, 5], "From cut before we can read it (0) to held long after we have it (5)."],
      ["busy", "How much there is to take in", ["one thing", "a few things", "a crowded frame", "words to read"], "How much is in the shot for the eye to read."],
      ["seconds", "How long the shot stays up", [0.5, 8, "seconds", 0.5], "How long the shot is on screen."],
      ["when", "When the cut comes", ["too soon, on purpose", "just as we get it", "a beat after", "long after"], "When the cut comes, against the moment we understand the shot."],
      ["seen", "Seen this view before", ["never", "once", "twice", "many times"], "How familiar the view is. Views we know are read faster."],
      ["aim", "What the timing is for", ["to confuse", "to keep pace", "to let it sink in", "to make us uneasy"], "What the filmmaker wants the timing to do.", U],
    ],
    [2, "Cutting as soon as we understand keeps the story moving at the speed of thought.", "How long a film lets us look shows how much it trusts us.", "We never wait, and never get left behind, so we stay with it.", "visual", "Hold the crowded market shot for four seconds the first time, then just one second when we come back to it."]);

  c("longAwaited", "The moment we're all waiting for", "emo-road",
    "The audience knows something big is coming (the two leads finally meet, the kiss, the fight, the truth told to the one person who needs it) and the film keeps holding it back. The wait is part of the pleasure, as long as the moment is worth it.",
    [
      ["wait", "How long it is held back", [0, 5], "From it comes right away (0) to held back almost to the end (5)."],
      ["what", "What we are waiting for", ["two people meet", "a kiss", "a fight", "the truth comes out", "the hero comes back", "the big game"], "The moment the film builds toward.", U],
      ["delays", "Times it almost happens", [0, 8, "times", 1], "How many near misses before it finally happens."],
      ["sure", "How sure we are it's coming", ["we guess it", "the film tells us", "the characters talk about it"], "How strongly the film tells us the moment is on its way."],
      ["lands", "How it lands", ["a letdown", "as hoped", "better than hoped", "turned on its head"], "What the moment is like when it comes.", U],
      ["shown", "How long the moment lasts", ["quickly", "in full", "slowed down"], "How much screen time the moment itself gets."],
    ],
    [4, "The whole film leans toward the moment, so every delay pushes the pressure higher.", "What we wait for shows what the film thinks matters most.", "We sit through every near miss hoping this is the time.", "plot", "Let the two pen pals pass each other in the station three times without knowing, before they finally sit at the same table."]);

  /* ---------- suites ---------- */

  S("mystery-that-keeps-you-guessing", "The mystery that keeps you guessing", "plot",
    "A locked briefcase nobody opens, a false trail to the neighbor, a witness who almost says the name, and every answer opening a bigger question.",
    [
      { curiosity: "lockedBox", value: 5 },
      { curiosity: "lockedBox", slider: "thing", value: "a briefcase" },
      { curiosity: "lockedBox", slider: "opened", value: "at the end" },
      { curiosity: "redHerring", value: 4 },
      { curiosity: "redHerring", slider: "at", value: "a person" },
      { curiosity: "redHerring", slider: "fair", value: "fair, and it means something" },
      { curiosity: "almostAnswer", value: 4, weight: 70 },
      { curiosity: "almostAnswer", slider: "what", value: "who did it", weight: 70 },
      { curiosity: "questionRelay", value: 4, weight: 70 },
      { curiosity: "openQuestions", value: 4, weight: 50 },
    ]);

  S("the-long-awaited-meeting", "The long-awaited meeting", "emo-road",
    "Two people we know belong together keep missing each other, the film keeps leaving at the best part, and when they finally meet it is better than we hoped.",
    [
      { curiosity: "longAwaited", value: 5 },
      { curiosity: "longAwaited", slider: "what", value: "two people meet" },
      { curiosity: "longAwaited", slider: "delays", value: 3 },
      { curiosity: "longAwaited", slider: "lands", value: "better than hoped" },
      { curiosity: "cutAwayAtPeak", value: 3, weight: 70 },
      { curiosity: "cutAwayAtPeak", slider: "threads", value: 2, weight: 70 },
      { curiosity: "hope", value: 4, weight: 50 },
    ]);

  S("leading-the-eye", "Leading the eye", "focus",
    "Every shot ends where the next one begins, a room full of heads turns to the door, and each shot is cut just as we have taken it in.",
    [
      { curiosity: "eyeTrace", value: 5 },
      { curiosity: "eyeTrace", slider: "leadBy", value: "a look" },
      { curiosity: "allEyesTurn", value: 4 },
      { curiosity: "allEyesTurn", slider: "at", value: "a door" },
      { curiosity: "allEyesTurn", slider: "shown", value: "after a beat" },
      { curiosity: "readTime", value: 3 },
      { curiosity: "readTime", slider: "when", value: "just as we get it" },
      { curiosity: "eyeFirst", value: 4, weight: 60 },
    ]);

  S("something-is-wrong-here", "Something is wrong here", "focus",
    "A muddy footprint nobody mentions, a rule we learned in the first scene, and dread creeping in as the story gets closer to breaking it.",
    [
      { curiosity: "oddDetail", value: 4 },
      { curiosity: "oddDetail", slider: "noticed", value: "only us" },
      { curiosity: "oddDetail", slider: "explained", value: "at the end" },
      { curiosity: "ruleSetEarly", value: 4 },
      { curiosity: "ruleSetEarly", slider: "kind", value: "a danger to avoid" },
      { curiosity: "ruleSetEarly", slider: "broken", value: "broken by accident", weight: 70 },
      { curiosity: "dread", value: 4, weight: 60 },
    ]);

  S("one-more-episode", "Just one more episode", "structure",
    "Two stories cut at their peaks, every answer opening a bigger question, and each episode ending on a cliffhanger so you press play again.",
    [
      { curiosity: "cutAwayAtPeak", value: 5 },
      { curiosity: "cutAwayAtPeak", slider: "leaves", value: "one second before the answer" },
      { curiosity: "cutAwayAtPeak", slider: "other", value: "something as tense" },
      { curiosity: "questionRelay", value: 5 },
      { curiosity: "questionRelay", slider: "ends", value: "the biggest left open" },
      { curiosity: "sceneEnding", value: "cliffhanger", weight: 70 },
      { curiosity: "surpriseSpacing", value: 4, weight: 60 },
      { curiosity: "surpriseSpacing", slider: "pattern", value: "speeding up", weight: 60 },
    ]);

  S("we-know-what-they-want", "We know what they want", "plot",
    "She says what she needs in the first line, a friend asks what we are all thinking, and the clock is running before she can get it.",
    [
      { curiosity: "sceneGoalClear", value: 5 },
      { curiosity: "sceneGoalClear", slider: "toldBy", value: "they say it" },
      { curiosity: "sceneGoalClear", slider: "blocked", value: "time runs out" },
      { curiosity: "voicedQuestion", value: 3 },
      { curiosity: "voicedQuestion", slider: "who", value: "a friend" },
      { curiosity: "tickingClock", value: "tight", weight: 70 },
    ]);

  S("a-promise-kept", "A promise kept", "structure",
    "The opening promises fear, a rule sets the trap, and the surprises grow until the biggest one comes last.",
    [
      { curiosity: "openingPromise", value: 5 },
      { curiosity: "openingPromise", slider: "kind", value: "fear" },
      { curiosity: "openingPromise", slider: "kept", value: "kept and topped" },
      { curiosity: "surpriseSpacing", value: 3 },
      { curiosity: "surpriseSpacing", slider: "growth", value: "each bigger than the last" },
      { curiosity: "surpriseSpacing", slider: "lastOne", value: "the biggest of all" },
      { curiosity: "ruleSetEarly", value: 3, weight: 60 },
      { curiosity: "openingGrab", value: "a promise", weight: 60 },
    ]);

  S("waking-a-flat-middle", "Waking up a flat middle", "structure",
    "The middle of the film sags with too much talk, so a character asks the question out loud and a surprise lands before the audience drifts.",
    [
      { curiosity: "lullStretch", value: 2 },
      { curiosity: "lullStretch", slider: "where", value: "the middle" },
      { curiosity: "lullStretch", slider: "why", value: "too much talk" },
      { curiosity: "lullStretch", slider: "fix", value: "open a question" },
      { curiosity: "voicedQuestion", value: 4 },
      { curiosity: "voicedQuestion", slider: "answered", value: "later" },
      { curiosity: "surpriseSpacing", value: 3, weight: 60 },
      { curiosity: "attentionReset", value: "every 10 seconds", weight: 50 },
    ]);

  /* ---------- proximities ---------- */

  P("eye-trace-faster-cuts", "When the eye path is smoother, the cutting can speed up", "transitions",
    "When each shot puts the subject where the eye already is, the cutting can get faster within 2 beats without losing anyone.",
    { curiosity: "eyeTrace", change: "rises" }, { curiosity: "cutRate", change: "rises" }, 2, { also: ["camera-motion"] });
  P("eyes-turn-eye-first", "When everyone turns to look, our eye goes there first", "focus",
    "When more of the room turns its head, the pull on where our eye goes first grows within a beat.",
    { curiosity: "allEyesTurn", change: "rises" }, { curiosity: "eyeFirst", change: "rises" }, 1);
  P("eyes-turn-long-wait-questions", "When we wait long to see what they see, the question grows", "focus",
    "When the film holds back what everyone is staring at, the audience's open questions rise within a beat.",
    { curiosity: "allEyesTurn", slider: "shown", is: "after a long wait" }, { curiosity: "openQuestions", change: "rises" }, 1, { also: ["plot"] });
  P("odd-detail-questions", "When something in the frame doesn't belong, we start wondering", "focus",
    "When the odd detail gets stranger, the questions the audience is holding rise within 2 beats.",
    { curiosity: "oddDetail", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 2, { also: ["plot"] });
  P("odd-detail-late-plant", "When the odd detail is explained only at the end, it becomes a hidden plant", "focus",
    "When the strange detail waits until the end for its answer, the forgotten plant grows within 3 beats.",
    { curiosity: "oddDetail", slider: "explained", is: "at the end" }, { curiosity: "plantForgotten", change: "rises" }, 3, { also: ["plot"] });
  P("surprises-closer-tension", "When surprises come more often, tension rises", "structure",
    "When the story is more full of surprises, the tension across the film rises within 3 beats.",
    { curiosity: "surpriseSpacing", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 3);
  P("grab-promise", "When the opening grabs with a promise, the promise gets clearer", "structure",
    "When the opening grab is a promise, the promise of what kind of film this is grows within a beat.",
    { curiosity: "openingGrab", is: "a promise" }, { curiosity: "openingPromise", change: "rises" }, 1);
  P("promise-broken-subversion", "When the opening's promise is broken, the film turns on us", "structure",
    "When the film breaks the promise its opening made, the sense of expectations turned upside down rises within 2 beats.",
    { curiosity: "openingPromise", slider: "kept", is: "broken" }, { curiosity: "subversion", change: "rises" }, 2, { also: ["comedy"] });
  P("lull-distraction", "When nothing pulls, the audience drifts", "structure",
    "When a flat stretch goes on, the audience's distraction grows within 2 beats.",
    { curiosity: "lullStretch", change: "rises" }, { curiosity: "distraction", change: "rises" }, 2, { also: ["focus"] });
  P("lull-fix-clock", "When a flat stretch is fixed with a clock, the clock starts running", "structure",
    "When the fix for a sagging stretch is a deadline, a clock running out appears within a beat.",
    { curiosity: "lullStretch", slider: "fix", is: "add a clock" }, { curiosity: "tickingClock", change: "rises" }, 1, { also: ["plot"] });
  P("lull-fix-voiced-question", "When a flat stretch is fixed with a question, someone asks it out loud", "structure",
    "When the fix is to open a question, a character asks our question for us within a beat.",
    { curiosity: "lullStretch", slider: "fix", is: "open a question" }, { curiosity: "voicedQuestion", change: "rises" }, 1, { also: ["plot"] });
  P("cliffhanger-cut-away", "When a scene ends on a cliffhanger, we leave at the best part", "structure",
    "When a scene ends on a cliffhanger, leaving the story at its peak rises within a beat.",
    { curiosity: "sceneEnding", is: "cliffhanger" }, { curiosity: "cutAwayAtPeak", change: "rises" }, 1);
  P("cross-cutting-leave-peak", "When the film cuts between stories more, it leaves each nearer its peak", "structure",
    "When cross-cutting grows, leaving each story at its best part grows within 2 beats.",
    { curiosity: "intercut", change: "rises" }, { curiosity: "cutAwayAtPeak", change: "rises" }, 2);
  P("leave-peak-questions", "When we leave a story at its peak, its question rides along", "structure",
    "When we cut away closer to the peak, the questions the audience is holding rise within a beat.",
    { curiosity: "cutAwayAtPeak", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 1, { also: ["plot"] });
  P("almost-answer-questions", "When the answer almost comes, the question gets sharper", "plot",
    "When the answer gets closer before slipping away, the questions the audience is holding rise within a beat.",
    { curiosity: "almostAnswer", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 1);
  P("closed-box-questions", "When we want the box opened more, the question grows", "plot",
    "When the pull of the closed thing grows, the audience's open questions rise within 2 beats.",
    { curiosity: "lockedBox", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 2);
  P("relay-bigger-stakes", "When each answer opens a much bigger question, the stakes climb", "plot",
    "When the new questions are much bigger than the old ones, what the characters stand to lose grows within 2 beats.",
    { curiosity: "questionRelay", slider: "bigger", is: "much bigger" }, { curiosity: "stakes", change: "rises" }, 2, { also: ["emo-road"] });
  P("red-herring-misdirection", "When the false clue points harder, we are misled", "plot",
    "When the clue points more strongly the wrong way, misdirection grows within a beat.",
    { curiosity: "redHerring", change: "rises" }, { curiosity: "misdirection", change: "rises" }, 1, { also: ["comedy"] });
  P("red-herring-late-reversal", "When the false trail is cleared only at the end, the story flips", "plot",
    "When the wrong clue is shown false at the very end, a reversal lands within a beat.",
    { curiosity: "redHerring", slider: "cleared", is: "at the very end" }, { curiosity: "reversal", change: "rises" }, 1);
  P("clear-goal-empathy", "When we know what they want, we feel with them", "plot",
    "When the scene's goal is clearer, the audience feels with the one chasing it within 2 beats.",
    { curiosity: "sceneGoalClear", change: "rises" }, { curiosity: "empathy", change: "rises" }, 2, { also: ["emotion"] });
  P("goal-blocked-by-time-clock", "When time is what stands in the way, a clock starts running", "plot",
    "When the goal is blocked by time running out, a clock running out rises within a beat.",
    { curiosity: "sceneGoalClear", slider: "blocked", is: "time runs out" }, { curiosity: "tickingClock", change: "rises" }, 1);
  P("rule-set-dread", "When the rule is set more firmly, dread builds", "plot",
    "When the film drills its rule in harder, the audience's dread grows within 3 beats.",
    { curiosity: "ruleSetEarly", change: "rises" }, { curiosity: "dread", change: "rises" }, 3, { also: ["emo-road"] });
  P("rule-broken-complication", "When the rule is broken by accident, things get worse", "plot",
    "When someone breaks the rule without meaning to, a complication follows within a beat.",
    { curiosity: "ruleSetEarly", slider: "broken", is: "broken by accident" }, { curiosity: "complication", change: "rises" }, 1);
  P("voiced-never-answered", "When the question asked out loud is never answered, it stays open", "plot",
    "When the question a character asks for us is never answered, the audience's open questions rise within 2 beats.",
    { curiosity: "voicedQuestion", slider: "answered", is: "never" }, { curiosity: "openQuestions", change: "rises" }, 2);
  P("long-read-lingers", "When shots are held long after we have read them, the camera lingers", "speed",
    "When each shot is held well past the moment we take it in, the sense of the camera staying too long grows within 2 beats.",
    { curiosity: "readTime", change: "rises" }, { curiosity: "lingeringShot", change: "rises" }, 2, { also: ["focus"] });
  P("long-wait-hope", "When the moment is held back longer, hope builds", "emo-road",
    "When the moment we are waiting for keeps being held back, hope grows within 3 beats.",
    { curiosity: "longAwaited", change: "rises" }, { curiosity: "hope", change: "rises" }, 3);
  P("long-wait-pays-relief", "When the moment finally comes and beats our hopes, relief floods in", "emo-road",
    "When the long-awaited moment lands better than hoped, relief rises within a beat.",
    { curiosity: "longAwaited", slider: "lands", is: "better than hoped" }, { curiosity: "relief", change: "rises" }, 1, { also: ["emotion"] });

  /* ---------- proximity suites ---------- */

  PS("questions-that-keep-us", "Questions that keep us watching", "plot",
    "The answer almost comes, the closed box waits, the question is asked out loud and left open, and our questions pile up.",
    ["almost-answer-questions", "closed-box-questions", "voiced-never-answered", "odd-detail-questions"], { also: ["focus"] });
  PS("leaving-at-the-peak", "Leaving at the peak", "structure",
    "A cliffhanger and more cross-cutting make the film leave each story at its peak, and the question rides along into the next scene.",
    ["cliffhanger-cut-away", "cross-cutting-leave-peak", "leave-peak-questions"], { also: ["plot"] });
  PS("waking-the-middle", "Waking the middle", "structure",
    "Nothing pulls and the audience drifts, so the fix opens a question or starts a clock, and a clear goal blocked by time gets us leaning in again.",
    ["lull-distraction", "lull-fix-voiced-question", "lull-fix-clock", "goal-blocked-by-time-clock"], { also: ["plot"] });
  PS("rules-and-false-trails", "Rules and false trails", "plot",
    "A firm rule builds dread and is broken by accident, while a false clue misleads us until the story flips at the end.",
    ["rule-set-dread", "rule-broken-complication", "red-herring-misdirection", "red-herring-late-reversal"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
