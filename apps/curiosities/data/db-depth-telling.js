/* data/db-depth-telling.js: the telling, borrowed from writing (Jeremy, 2026-10-05: research the curiosities of
   writing, keep the ones that apply most directly to film here, and send the writing-only ones to the separate
   writing app). 12 curiosities: seeing others through their own life, where the audience stands in the telling (the writing app's "listener's
   perspective"), the order the story is told in, a story told inside a story, a hint of
   what's to come, planted early and used later, how we learn what happened before, the moment that starts it all, a
   thing that stands for something bigger, talking like their personality type (Enneagram), and the theme said out
   loud, plus a glimpse of someone's whole life (like walking into a different book for a moment). Each has its own graded sliders and a momentum note, tied into suites, proximities and proximity suites.
   Ideas already in the database (a view we cannot trust, whose eyes the shot sees through, story point of view, who knows first, talking to
   the camera, voice-over, a glimpse of what is coming, said against meant, the promise of the opening, the same
   moment from another side, a memory laid over the present, reading words out loud, how they talk marks who they
   are) are linked to, not repeated. The writing-only list is in the project's writing app handoff. Loaded after
   db-depth-frame.js. Written 2026-10-05 by the writing app handoff thread. */
(function (DB) {
  const SHARED = (push) => [
    { id: "push", label: "Pushes the story", range: { min: 0, max: 5 }, from: push, to: Math.min(5, push + 2), plain: "How much this curiosity moves the story forward here." },
    { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], from: "holds", to: "demands what's next", plain: "Whether it settles something or leaves a question the next moment must answer." },
    { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], from: "loosely", to: "clearly", plain: "How closely it carries one of the film's themes here." },
  ];
  /* c(id, label, workspace, plain, sliders, momentum [push 0-5, plot, theme, pull, cue, tryThis], extra)
     sliders: [id, label, scale-or-range, plain, extra?]; the first slider is the main one. */
  function c(id, label, workspace, plain, sliders, m, extra) {
    const row = DB.curiosity(Object.assign({ id, label, plain, workspace, main: sliders[0][0], sliders: sliders.concat(SHARED(m[0])) }, extra || {}));
    if (row && !row.momentum) row.momentum = { push: m[0], plot: m[1], theme: m[2], pull: m[3], cue: m[4], tryThis: m[5] };
  }
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const U = { unordered: true };

  /* ---------- who is telling, and to whom ---------- */

  c("listenerPlace", "Where the audience stands in the telling", "structure",
    "Who the film makes us while we watch: someone spoken to directly, a friend let into one character's head, a witness who sees everything, or a stranger peeking in. In writing this is the listener's perspective (first person, second person, third person omniscient). Not \"Whose eyes the shot sees through\", which is one shot.",
    [
      ["closeness", "How close we sit", ["far off, seeing it all", "beside them", "inside one head", "spoken right into our ear"], "How far inside the story the film puts us, from a wide view of the world to a voice talking straight to us."],
      ["addressed", "Are we spoken to", ["never named", "we overhear", "now and then", "spoken to the whole time"], "Whether the telling talks to us as 'you', the way a narrator or a character looking at the lens does."],
      ["knows", "What we know against the hero", ["less than the hero", "the same as the hero", "more than the hero", "everything, even their thoughts"], "Whether we learn things before, with or after the main character."],
      ["role", "The part we play", ["a confidant", "an eavesdropper", "a juror", "a witness", "the film crew", "a player in the game"], "The role the telling quietly hands the audience.", U],
      ["side", "Whose side it puts us on", [0, 100, "%"], "0 is firmly with the main character; 100 is set against them."],
      ["steady", "Does it change", ["one place the whole film", "changes by section", "changes scene to scene"], "Whether the audience's place in the telling stays put or moves."],
    ],
    [2, "Decides what we may know and when, which sets up every surprise and every bit of suspense.", "Shows whose story this is and how much we are trusted with.", "We want to know what the telling is keeping from us, or what it trusts us with.", "thought", "Open on a voice that says 'You've seen this man before' over a crowd, then hold on one face."]);

  c("storyOrder", "The order the story is told in", "structure",
    "Whether the film tells events from start to finish, starts in the middle of the action, starts at the end and goes back, runs backwards, or jumps around in time.",
    [
      ["order", "How the order runs", ["start to finish", "starts in the middle", "starts at the end", "jumps around", "runs backwards"], "The overall shape of time in the telling."],
      ["jumps", "Jumps in time", [0, 20], "How many times the film leaves one time for another."],
      ["marked", "How clearly jumps are marked", ["not at all", "a hint", "a clear sign", "a title card every time"], "How easy it is to tell when we are."],
      ["marker", "What marks the time", ["a date on screen", "a different look", "a haircut or age", "a place", "a voice saying when"], "The sign that tells us which time we are in.", U],
      ["meet", "When the times meet", ["never", "halfway", "at the end", "in the very last shot"], "When the separate times finally catch up with each other."],
      ["why", "Why this order", ["to grab us early", "to hide the answer", "to build dread", "to show memory"], "What the order does for the audience.", U],
    ],
    [3, "Starting late or out of order hands us a question the rest of the film must answer.", "Shows how the past keeps pressing on the present.", "We want to see how it got from there to here.", "plot", "Open on him soaking wet in a police station, then cut to 'Three days earlier'."]);

  c("frameStory", "A story told inside a story", "structure",
    "Someone in the film tells the story we watch: an old woman to her grandson, a man to a police officer, a diary read years later. We keep coming back to the teller.",
    [
      ["frame", "How much the frame matters", [0, 5], "How much of the film belongs to the telling around the story."],
      ["teller", "Who tells it", ["an old version of the hero", "a stranger", "someone being questioned", "a diary or letter", "a parent at bedtime"], "Who is telling the story inside the story.", U],
      ["returns", "Returns to the teller", [0, 12], "How many times we go back to the person telling it."],
      ["layers", "Stories inside stories", [1, 3], "How many tellings sit one inside another."],
      ["trust", "Can we trust the teller", ["fully", "mostly", "not really"], "Whether the teller tells it straight."],
      ["ending", "What the frame does at the end", ["just closes", "adds a twist", "changes the teller", "turns out to be part of the story"], "How the outer story pays off."],
    ],
    [2, "The teller's own story can quietly become the real one, and the ending can turn on it.", "Shows that every story is told by someone, for a reason.", "We wonder why this teller is telling it, and to whom.", "audio", "Every time the war story reaches a death, cut back to the old soldier pausing over his coffee."]);

  c("projection", "Seeing others through their own life", "structure",
    "The point-of-view character's own struggle or thriving colors how they see everyone else. We think others are like us, so a struggling hero sees threats and a thriving one sees friends: through a mirror, darkly. The film shows other people the way the hero sees them, not as they are.",
    [
      ["tint", "How much it colors what we see", [0, 5], "0 shows people as they are; 5 shows them only as the hero sees them."],
      ["mood", "The hero's own state", ["struggling badly", "struggling", "getting by", "doing well", "thriving"], "How the point-of-view character's own life is going, which sets the tint."],
      ["sees", "What they see in others", ["threats", "judgment", "people just like them", "kindness", "potential"], "What the hero projects onto the people around them.", U],
      ["shownBy", "How the film shows it", ["the light and color", "the lens and framing", "how others act", "what they say", "the music"], "Which tool bends other people toward the hero's view.", U],
      ["gap", "The truth we glimpse", ["never", "a hint", "a clear moment", "a full reveal"], "Whether we ever see someone as they really are, apart from the hero's view."],
      ["changes", "Does the view change", ["stays the same", "darkens", "brightens", "flips"], "How the hero's view of others moves as their own life changes."],
    ],
    [2, "When the hero's own life turns, the same people suddenly look different, and the story turns with them.", "Shows that we see others through ourselves.", "We start to wonder what the other people are really like.", "visual", "Shoot the same neighbor twice: from below in harsh light while the hero is broke, and at eye level in warm light once he is back on his feet."]);

  /* ---------- seeds and payoffs ---------- */

  c("foreshadowHint", "A hint of what's to come", "plot",
    "A small sign early on (a line, an object, a picture, a sound) that quietly points to something that will happen later. Not \"A glimpse of what is coming\", which jumps ahead in time.",
    [
      ["strength", "How clear the hint is", [0, 5], "From hidden in plain sight to almost a warning."],
      ["form", "What the hint is", ["a line", "an object", "a picture on the wall", "a sound", "a dream", "the weather"], "What carries the hint.", U],
      ["scenes", "Scenes until it comes true", [1, 40], "How long before what it points to happens."],
      ["mood", "Good or bad sign", ["a good sign", "mixed", "a bad sign"], "Whether it points to something hopeful or something dark."],
      ["noticed", "When we notice it", ["only on a second watch", "when it comes true", "right away"], "When the audience realises it was a hint."],
      ["times", "Hints for the same thing", [1, 5], "How many hints point at the same event."],
    ],
    [2, "Prepares us so that what happens later feels meant, not random.", "Ties the beginning to the ending.", "We feel something coming without knowing what.", "visual", "On the drive to the lake, let the kid point out a crow on the guardrail while the radio talks about ice."]);

  c("plantedThing", "Planted early, used later", "plot",
    "Something shown early (a gun on the wall, a skill, a fact, a key) that must matter later. When it comes back, it pays off. Writers call it Chekhov's gun.",
    [
      ["plant", "How clearly it is shown", [0, 5], "How much attention the film gives the thing when it first appears."],
      ["what", "What is planted", ["an object", "a skill", "a fact", "a person", "a place", "a rule"], "The kind of thing that will come back.", U],
      ["between", "Scenes between plant and payoff", [1, 40], "How long the film waits before using it."],
      ["reminders", "Reminders on the way", [0, 4], "How many times we see it again before it pays off."],
      ["payoff", "Size of the payoff", [0, 5], "How much the story depends on it when it comes back."],
      ["surprise", "How surprising the payoff is", ["we saw it coming", "a small surprise", "a big surprise"], "Whether we expected it to come back this way."],
    ],
    [3, "A thing shown early saves the day, ruins it, or opens the last door.", "Shows that nothing in a well-told story is wasted.", "We keep watching the thing, waiting for it to matter.", "visual", "Show her learning to pick a lock in scene 2, and leave her locked in the basement in scene 30."]);

  c("backstoryDelivery", "How we learn what happened before", "structure",
    "How the film tells us the past and the rules of its world: shown in action, slipped into a fight, told in one long speech, read off a screen, or kept back until late. Writers call this exposition, and 'show, don't tell'.",
    [
      ["showing", "Shown or told", [0, 5], "0 is told outright in words; 5 is shown only through what people do."],
      ["how", "How it comes out", ["a long speech", "slipped into a fight", "a voice-over", "words on screen", "a flashback", "something we see in the room"], "The way the past reaches us.", U],
      ["amount", "How much past there is", ["a little", "some", "a lot", "a whole world"], "How much we need to know about what happened before."],
      ["when", "When it comes", ["all at the start", "a bit at a time", "saved for late"], "Whether the past is given up front or rationed."],
      ["clunk", "How natural it feels", ["clunky", "a little obvious", "natural", "invisible"], "Whether people say things they would never really say just so we learn them."],
      ["held", "What is held back", [0, 5], "How much of the past is kept secret for later."],
    ],
    [1, "Gives us just enough to follow, and keeps back the part that will hurt later.", "Shows that the past is still alive in the room.", "We piece the past together ourselves, and want the missing piece.", "thought", "Instead of telling us they divorced, let him hesitate at her door and knock instead of using his key."]);

  c("incitingMoment", "The moment that starts it all", "plot",
    "The event that knocks the main character out of normal life and starts the story: a stranger arrives, a letter comes, someone dies, a mistake is made.",
    [
      ["force", "How hard it hits", [0, 5], "How big the jolt to normal life is."],
      ["minutes", "When it comes", [0, 40, "minutes"], "How far into the film it happens."],
      ["kind", "What it is", ["an arrival", "a loss", "a message", "a mistake", "a discovery", "a chance meeting"], "The kind of event that starts it.", U],
      ["choice", "Chosen or forced", ["forced on them", "half chosen", "they choose it"], "Whether it happens to them or they make it happen."],
      ["seen", "How we see it", ["before the film starts", "told about", "on screen"], "Whether the film shows it or reports it."],
      ["refusal", "Do they say no at first", ["no", "for a moment", "for a long time"], "Whether the hero tries to ignore the call before giving in."],
    ],
    [3, "Starts the story moving and sets the question the ending must answer.", "Shows what the hero's normal life was hiding.", "We want to know what they will do about it.", "plot", "Let the phone ring during the birthday toast, and keep it ringing while nobody answers."]);

  c("symbolThing", "A thing that stands for something bigger", "plot",
    "An object, place, animal or kind of weather that comes to stand for a bigger idea (a bird for freedom, a ring for a promise) and changes as the story changes.",
    [
      ["weight", "How much it carries", [0, 5], "How much meaning the film loads onto it."],
      ["what", "What it is", ["an object", "a place", "an animal", "the weather", "a color", "a sound"], "The thing that carries the meaning.", U],
      ["standsFor", "What it stands for", ["love", "freedom", "guilt", "home", "death", "hope"], "The bigger idea it carries.", U],
      ["returns", "Times it comes back", [1, 10], "How often it appears across the film."],
      ["changes", "What happens to it", ["stays the same", "wears down", "is broken", "is passed on", "is set free"], "How the thing changes along with the story."],
      ["noticed", "How obvious it is", ["hidden", "felt", "noticed", "pointed at"], "How loudly the film tells us it means something."],
    ],
    [1, "When the thing breaks or is passed on, we feel the story turn without a word.", "Carries the theme in something we can see and hear.", "We watch the thing to know how the story is going.", "visual", "Let the cracked teapot from the wedding show up at each family dinner, and finally be glued back together."]);

  c("glimpseOfALife", "A glimpse of someone's whole life", "structure",
    "A minor character crosses the story for a moment, and we see their whole life: their own arc, their own troubles, the show they'd be the star of. Like stepping into a different book for a moment.",
    [
      ["depth", "How much of their life we see", [0, 5], "From a face in passing (0) to a whole life in one moment (5)."],
      ["seconds", "How long they're on screen", [1, 120, "seconds"], "How long the glimpse lasts."],
      ["how", "What shows us their life", ["a line they say", "something they carry", "a phone call", "a photo", "their home", "how they treat someone"], "The detail that opens their world.", U],
      ["ownShow", "The show they'd star in", ["a comedy", "a tragedy", "a romance", "a thriller", "a quiet drama"], "What kind of story their own life is.", U],
      ["arcPoint", "Where they are in their own arc", ["just starting out", "climbing", "at their crisis", "after the fall", "at the end"], "The point of their own story we catch them at."],
      ["echo", "How much it echoes the hero", [0, 5], "How much their life mirrors or answers the main character's."],
    ],
    [1, "A stranger's life can show the hero what they could become, or what they're about to lose.", "Shows that everyone is the hero of their own story.", "We want to follow the stranger, just for a minute.", "visual", "Let the cab driver's dashboard hold a baby photo and a hospital bracelet, and let him drive a little too fast."]);

  /* ---------- the words ---------- */

  c("typeTalk", "Talks like their personality type", "lines",
    "Each character's lines sound like their Enneagram type: what they push for, what they avoid saying, how they deflect. Under stress they slip toward another type's way of talking; when healthy they grow toward a better one.",
    [
      ["strength", "How strongly the type shows", [0, 5], "How clearly their lines sound like their type."],
      ["type", "Their type", ["1 the perfectionist", "2 the helper", "3 the achiever", "4 the individualist", "5 the investigator", "6 the loyalist", "7 the enthusiast", "8 the challenger", "9 the peacemaker"], "The character's Enneagram type.", U],
      ["health", "How healthy they are right now", ["at their worst", "under stress", "average", "doing well", "at their best"], "Their emotional health in this moment, which bends how they talk."],
      ["avoids", "What they won't say", ["that they are angry", "that they need help", "that they failed", "that they are ordinary", "that they don't know", "that they are scared", "that they are hurting", "that they are weak", "that they disagree"], "The thing their type works hardest not to say out loud.", U],
      ["deflect", "How they dodge", ["correct someone", "help someone", "change the subject to a win", "go quiet and deep", "ask for facts", "ask what could go wrong", "make a joke", "push harder", "agree to keep the peace"], "What they do with their words when the talk gets close.", U],
      ["words", "How much they say", ["very little", "some", "a lot", "they never stop"], "How many words their type tends to use."],
    ],
    [2, "When someone talks against their type, we feel something has changed in them.", "Shows character through how people speak, not what they announce.", "We wait for the line they would never say.", "audio", "Let the peacemaker agree to every plan all scene, then quietly say 'No' to the last one."]);

  c("themeAloud", "The theme said out loud", "lines",
    "Someone says the film's big idea in words, often early and often a side character, before the hero is ready to hear it.",
    [
      ["blunt", "How plainly it is said", [0, 5], "From a hint inside a joke to a speech about the meaning of the film."],
      ["who", "Who says it", ["a side character", "the hero", "the villain", "a stranger", "a sign or a song"], "Who speaks the idea.", U],
      ["when", "When it is said", ["in the first minutes", "in the middle", "near the end"], "Where in the film the line falls."],
      ["heard", "Does the hero hear it", ["ignores it", "laughs it off", "thinks about it", "lives by it"], "How the main character takes it at first."],
      ["again", "Times it comes back", [1, 4], "How many times the line or idea is heard again."],
      ["changed", "Said back changed at the end", ["no", "the same words", "new words, same idea"], "Whether the hero says it back in the end, and how."],
    ],
    [1, "Gives the ending something to answer: the hero finally understands the line.", "It is the theme, in someone's mouth.", "We wait for the hero to understand what we already heard.", "audio", "Let the bus driver say 'Nobody gets anywhere alone' in scene 1, and the hero say it to her kid in the last scene."]);

  /* ---------- suites ---------- */

  S("trust-me-telling", "Trust me (don't)", "structure",
    "A voice talks straight to us, starts at the end, and turns out to be bending the truth.",
    [
      { curiosity: "listenerPlace", value: "spoken right into our ear" },
      { curiosity: "listenerPlace", slider: "addressed", value: "spoken to the whole time" },
      { curiosity: "unreliableView", value: 4 },
      { curiosity: "storyOrder", value: "starts at the end" },
    ]);
  S("all-seeing-telling", "We know everything", "structure",
    "We stand far off, know more than the hero, and see the hints they miss.",
    [
      { curiosity: "listenerPlace", value: "far off, seeing it all" },
      { curiosity: "listenerPlace", slider: "knows", value: "more than the hero" },
      { curiosity: "foreshadowHint", value: 4 },
      { curiosity: "knowledgeGap" },
    ]);
  S("fireside-tale", "A tale by the fire", "structure",
    "An old teller, a story inside a story, the theme said early and a symbol that keeps coming back.",
    [
      { curiosity: "frameStory", value: 4 },
      { curiosity: "frameStory", slider: "teller", value: "an old version of the hero" },
      { curiosity: "themeAloud", value: 2 },
      { curiosity: "symbolThing", value: 3 },
    ]);
  S("well-made-plot", "The well-made plot", "plot",
    "A hard start, a thing planted early, hints along the way and the past shown, not told.",
    [
      { curiosity: "incitingMoment", value: 4 },
      { curiosity: "plantedThing", value: 3 },
      { curiosity: "foreshadowHint", value: 2 },
      { curiosity: "backstoryDelivery", value: 4 },
    ]);
  S("people-talking-true", "People talking true to type", "lines",
    "Every character sounds like their type, says the theme without meaning to, and hides what matters under the words.",
    [
      { curiosity: "typeTalk", value: 4 },
      { curiosity: "themeAloud", value: 1 },
      { curiosity: "subtext" },
      { curiosity: "wayOfTalking" },
    ]);

  /* ---------- proximities ---------- */

  P("closer-telling-voiceover", "When we are let into one head, the voice-over grows", "structure",
    "When the telling brings us closer inside one character, voice-over rises within a beat.",
    { curiosity: "listenerPlace", change: "rises" }, { curiosity: "voiceover", change: "rises" }, 1, { also: ["audio-mix"] });
  P("addressed-fourth-wall", "When the telling talks to us, the character looks at the lens", "structure",
    "When the audience is spoken to the whole time, talking to the camera rises within a beat.",
    { curiosity: "listenerPlace", slider: "addressed", is: "spoken to the whole time" }, { curiosity: "fourthWall", change: "rises" }, 1, { also: ["comedy"] });
  P("knows-more-suspense", "When we know more than the hero, suspense builds", "structure",
    "When we know more than the main character, the gap in who knows first rises within 2 beats.",
    { curiosity: "listenerPlace", slider: "knows", is: "more than the hero" }, { curiosity: "knowledgeGap", change: "rises" }, 2, { also: ["plot"] });
  P("doubt-same-moment", "When the telling can't be trusted, we see the moment again", "structure",
    "When the telling grows less trustworthy, the same moment from another side rises within 3 beats.",
    { curiosity: "unreliableView", change: "rises" }, { curiosity: "sameMomentAgain", change: "rises" }, 3);
  P("doubt-subtext", "When the teller is lying, said and meant pull apart", "structure",
    "When the telling grows less trustworthy, the gap between what is said and what is meant rises within a beat.",
    { curiosity: "unreliableView", change: "rises" }, { curiosity: "subtext", change: "rises" }, 1, { also: ["emotion"] });
  P("jumps-memory", "When time jumps more, memories lie over the present", "structure",
    "When the film jumps in time more often, a memory laid over the present rises within 2 beats.",
    { curiosity: "storyOrder", slider: "jumps", change: "rises" }, { curiosity: "memoryOverlay", change: "rises" }, 2, { also: ["layers"] });
  P("ends-first-flash-forward", "When the story starts at the end, glimpses of it return", "structure",
    "When the film starts at the end, a glimpse of what is coming rises within 3 beats.",
    { curiosity: "storyOrder", is: "starts at the end" }, { curiosity: "flashForward", change: "rises" }, 3);
  P("frame-read-aloud", "When the frame is a diary, words are read out loud", "structure",
    "When the teller is a diary or letter, reading words out loud rises within a beat.",
    { curiosity: "frameStory", slider: "teller", is: "a diary or letter" }, { curiosity: "readAloud", change: "rises" }, 1, { also: ["lines"] });
  P("hint-planted", "When the hints grow clearer, the planted thing matters more", "plot",
    "When the hint gets clearer, the size of the planted thing's payoff rises within 4 beats.",
    { curiosity: "foreshadowHint", change: "rises" }, { curiosity: "plantedThing", slider: "payoff", change: "rises" }, 4);
  P("inciting-open-questions", "When the start hits harder, our questions pile up", "plot",
    "When the moment that starts it all hits harder, the questions the audience is holding rise within a beat.",
    { curiosity: "incitingMoment", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 1);
  P("told-not-shown-flat", "When the past is shown, not told, we hold more back", "structure",
    "When the past is shown more and told less, how much of it is held back rises within 2 beats.",
    { curiosity: "backstoryDelivery", change: "rises" }, { curiosity: "backstoryDelivery", slider: "held", change: "rises" }, 2);
  P("symbol-broken-theme", "When the symbol is broken, the theme is said again", "plot",
    "When the thing that stands for something bigger is broken, the theme said out loud rises within 2 beats.",
    { curiosity: "symbolThing", slider: "changes", is: "is broken" }, { curiosity: "themeAloud", change: "rises" }, 2, { also: ["lines"] });
  P("stress-type-subtext", "When a character is under stress, what they won't say presses harder", "lines",
    "When their health drops toward their worst, the gap between said and meant rises within a beat.",
    { curiosity: "typeTalk", slider: "health", change: "drops" }, { curiosity: "subtext", change: "rises" }, 1, { also: ["emotion"] });
  P("type-voice-marks", "When the type shows strongly, their way of talking stands out", "lines",
    "When their type shows more strongly in their lines, how much their way of talking marks them rises within 2 beats.",
    { curiosity: "typeTalk", change: "rises" }, { curiosity: "wayOfTalking", change: "rises" }, 2);

  P("glimpse-echo-theme", "When a stranger's life echoes the hero's, the theme sharpens", "structure",
    "When a passing character's life echoes the hero's more, the theme said out loud rises within 2 beats.",
    { curiosity: "glimpseOfALife", slider: "echo", change: "rises" }, { curiosity: "themeAloud", change: "rises" }, 2, { also: ["lines"] });
  P("glimpse-foil", "When we glimpse a whole life, a road not taken appears", "structure",
    "When we see more of a passing character's life, the character they could become rises within 2 beats.",
    { curiosity: "glimpseOfALife", change: "rises" }, { curiosity: "foil", change: "rises" }, 2, { also: ["arc"] });

  P("struggle-projection", "When the hero's life falls, they see the worst in others", "structure",
    "When the point-of-view character's life starts falling, how much their view colors other people rises within 2 beats.",
    { curiosity: "thriving", change: "drops" }, { curiosity: "projection", change: "rises" }, 2, { also: ["herd"] });
  P("projection-unreliable", "When the view is colored more, the telling can't be trusted", "structure",
    "When the hero's view colors other people more, the telling we can't trust rises within 2 beats.",
    { curiosity: "projection", change: "rises" }, { curiosity: "unreliableView", change: "rises" }, 2);

  /* ---------- proximity suites ---------- */

  PS("the-telling-turns", "The telling turns", "structure",
    "A voice talks to us, then the teller is caught lying, we see the moment again, and what was said and meant come apart.",
    ["addressed-fourth-wall", "doubt-same-moment", "doubt-subtext", "closer-telling-voiceover", "projection-unreliable"]);
  PS("seeds-and-harvest", "Seeds and harvest", "plot",
    "A hard start raises questions, hints point ahead, the planted thing pays off, and the broken symbol says the theme.",
    ["inciting-open-questions", "hint-planted", "symbol-broken-theme", "knows-more-suspense", "glimpse-echo-theme", "glimpse-foil"]);
  PS("time-out-of-order", "Time out of order", "structure",
    "The story starts at the end, jumps around, lays memories over the present and reads an old diary aloud.",
    ["ends-first-flash-forward", "jumps-memory", "frame-read-aloud", "told-not-shown-flat"]);
  PS("talking-true", "Talking true to type", "lines",
    "Under stress each character hides more under their words, and their way of talking stands out.",
    ["stress-type-subtext", "type-voice-marks"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
