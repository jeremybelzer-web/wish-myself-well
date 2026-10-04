/* data/db-depth-feeling.js: feeling over time, deeper (the finer tools a filmmaker or an actor reaches for to shape
   a feeling across a scene and across the whole film). 16 curiosities: going numb after a shock, the feeling that
   hits later, taking it out on the wrong thing, a thing that holds a feeling, playing the big moment small, a
   feeling that grows the whole film, the come-down after a high, out of step with the room, trading places in
   feeling, comfort taken or pushed away, the feeling nobody names, bracing for it, whose face carries it, keeping
   busy so as not to feel, love the other never sees, and the empty place. Each has its own graded sliders and a
   momentum note, tied into suites, proximities and proximity suites. Ideas already in the database (two
   characters' feelings apart or crossing, hidden to shown, said against meant and where it leaks, mixed feelings,
   what the audience feels against the character, the contrast with the last scene, how far the feeling spreads,
   feeling held in, does the feeling turn and how fast, earned tears, the object we keep seeing) are linked to, not
   repeated. Loaded after db-depth-attention.js. Written 2026-10-04 by the depth thread (feeling). */
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

  /* ---------- after the blow ---------- */

  c("shockNumb", "Numb after the shock", "emotion",
    "After terrible news, a person sometimes feels nothing at all. They go quiet and flat, keep doing something ordinary, or say something oddly calm. Showing this numbness can hit the audience harder than tears, because we feel what they cannot feel yet.",
    [
      ["numb", "How numb they go", [0, 5], "From a normal reaction (0) to completely shut down, nothing showing at all (5)."],
      ["shock", "What the shock was", ["bad news", "an accident", "a death", "a betrayal", "a violent moment"], "The blow that shut the feeling off.", U],
      ["lasts", "How long the numbness lasts", ["a few seconds", "the rest of the scene", "a few scenes", "most of the film"], "How long the film lets them stay flat."],
      ["sound", "What the sound does", ["stays normal", "goes muffled", "a high ringing", "total silence"], "How the sound of the world changes while they are numb, so we hear it the way they do."],
      ["doing", "What they do while numb", ["stand frozen", "keep doing a chore", "say something calm", "laugh oddly", "walk away"], "The odd, ordinary thing their body does while the feeling is switched off.", U],
      ["breaks", "What breaks the numbness", ["nothing yet", "a touch", "a small object", "a sound", "someone else's tears"], "The small thing that finally lets the feeling in.", U],
    ],
    [3, "The numb stretch holds the story still for a moment, and everyone waits for the feeling to break through.", "Shows that the biggest blows are often met with no reaction at all.", "We wait, holding our breath, for the moment the feeling arrives.", "audio", "After the doctor gives the news, let her ask calmly where she parked the car, and drop the hospital noise to a dull hum."]);

  c("delayedReaction", "The feeling hits later", "emo-road",
    "The character holds together through the big moment, and the feeling only hits later, somewhere ordinary: alone in the car, in the shower, at the supermarket. The delay makes the feeling land twice, once when we expect it and again when they finally break.",
    [
      ["delay", "How late it hits", [0, 5], "From the feeling comes right away (0) to it hits long after, when we have almost forgotten (5)."],
      ["gap", "Story time until it hits", ["minutes", "hours", "days", "weeks"], "How much time passes in the story before the feeling catches up."],
      ["where", "Where it finally hits", ["in the car", "in the shower", "at the shops", "at work", "in bed"], "The ordinary place where they finally break.", U],
      ["trigger", "What sets it off", ["nothing at all", "a song", "a small object", "a stranger's kindness", "an ordinary chore"], "The small thing that opens the door the big moment could not.", U],
      ["size", "How hard it hits", ["a single tear", "quiet crying", "sobbing", "a scream"], "How big the late feeling is when it comes."],
      ["seen", "Who sees it", ["nobody", "a stranger", "someone close"], "Whether anyone is there when it hits."],
    ],
    [3, "The late breakdown shows the cost of the earlier scene, so the story looks back and moves on at once.", "Big feelings do not keep to a schedule; they wait for an ordinary moment.", "We keep waiting for them to break, and the wait pulls us through the quiet scenes.", "visual", "Let him stay dry-eyed through the whole funeral, then break down two days later when the shop has run out of his wife's favorite bread."]);

  c("displacedFeeling", "Taking it out on the wrong thing", "emotion",
    "The character cannot aim the feeling at the person who caused it, so it comes out at something else: they slam a drawer, snap at a waiter, scrub a pan far too hard. The audience knows where the feeling really belongs.",
    [
      ["misplaced", "How far off target it lands", [0, 5], "From aimed at the right person (0) to landing on something that has nothing to do with it (5)."],
      ["feeling", "Which feeling", ["anger", "sadness", "fear", "shame"], "The feeling that gets pointed the wrong way.", U],
      ["target", "Where it lands", ["an object", "a stranger", "a pet", "a friend", "themselves"], "What or who takes the hit instead.", U],
      ["why", "Why they can't aim it right", ["the person is too powerful", "the person is gone", "they love the person", "they won't admit it"], "What stops them from facing the real cause.", U],
      ["size", "How big the outburst", ["a muttered word", "a slam", "a shout", "something breaks"], "How much of the feeling comes out sideways."],
      ["realize", "Do they see what they did", ["never", "later", "right away"], "Whether they notice they hit the wrong target."],
    ],
    [3, "The misplaced outburst hurts someone new, which starts a fresh problem the story must deal with.", "Shows how feelings we cannot face find another way out.", "We know the real target, and wait for the feeling to finally reach it.", "movement", "After his boss humiliates him, let him say nothing, then go home and yell at the washing machine for being loud."]);

  c("keepsake", "A thing that holds a feeling", "emo-road",
    "An object stands in for a person or a feeling: a dead father's watch, a sweater that still smells of someone, a child's drawing. How the character treats it tells us how they feel without a single word.",
    [
      ["charge", "How much feeling it holds", [0, 5], "From just a thing (0) to the whole feeling of the film packed into one object (5)."],
      ["thing", "What the thing is", ["a piece of clothing", "a watch", "a letter", "a photo", "a toy", "a song on a tape"], "The object that carries the feeling.", U],
      ["standsFor", "What it stands for", ["someone gone", "someone far away", "a happier time", "a promise", "a mistake"], "What the object means to them.", U],
      ["handling", "How they treat it", ["can't look at it", "hide it away", "touch it in secret", "keep it close", "use it every day"], "From pushing it away to keeping it near."],
      ["fate", "What happens to it in the end", ["kept", "given away", "lost", "destroyed", "buried"], "How the film lets go of the object, which is how the character lets go of the feeling.", U],
      ["seen", "Times we see it", [1, 8, "times", 1], "How often the film shows the object, so its meaning can build."],
    ],
    [2, "Each time the object comes back, it shows how far the character has moved since we last saw it.", "Feelings get stored in things we cannot throw away.", "We watch for the object, and feel a small jolt each time it appears.", "visual", "Let her keep wearing her brother's oversized jacket, and in the last scene hand it to the boy who reminds her of him."]);

  /* ---------- holding the big feeling ---------- */

  c("bigFeelingSmall", "Playing the big moment small", "emotion",
    "The film saves its biggest feeling for one quiet moment and lets it play small: a whisper instead of a scream, a hand on a shoulder, a long look. Holding back makes the audience lean in and fill the moment with their own feeling.",
    [
      ["restraint", "How small they play it", [0, 5], "From played as big as the feeling is (0) to almost nothing on the surface (5)."],
      ["bigness", "How big the feeling really is", ["mild", "strong", "huge", "life changing"], "The size of the feeling underneath the small surface."],
      ["form", "How it shows", ["a whisper", "a long look", "a single touch", "a tiny nod", "a turn away"], "The one small thing that carries all of it.", U],
      ["quietBefore", "Quiet before it", [0, 10, "seconds", 1], "How many seconds of stillness the film gives just before the moment."],
      ["music", "What the music does", ["full swell", "soft", "stops", "none at all"], "From the music doing the work to leaving the moment bare."],
      ["savedFor", "How long the film saves it", ["one scene", "half the film", "the whole film"], "How long the big feeling was held back before this moment."],
    ],
    [3, "The quiet moment is where the film cashes in everything it has built, and the story can turn on one look.", "Says that the deepest feelings are often the quietest.", "We lean in to catch what is barely there.", "visual", "When the father finally sees his son again after ten years, let him only say 'You got tall', and hold on his face."]);

  c("slowBurn", "A feeling that grows the whole film", "emo-road",
    "One feeling that starts as almost nothing and grows a little in each scene across the whole film: love between two strangers, a grudge, trust. Because it grows so slowly, the audience feels it before the characters admit it.",
    [
      ["growth", "How much it grows", [0, 5], "From barely changes (0) to grows from nothing into the biggest feeling in the film (5)."],
      ["feeling", "Which feeling grows", ["love", "trust", "fear", "anger", "friendship"], "The feeling that builds slowly.", U],
      ["steps", "Scenes where it grows", [2, 20, "scenes", 1], "How many scenes add a small step to it."],
      ["setback", "Setbacks along the way", ["none", "one", "a few", "many"], "How often it slips back before it grows again."],
      ["admitted", "When it is finally said", ["early", "in the middle", "near the end", "never"], "When a character finally says the feeling out loud."],
      ["firstSign", "The first small sign", ["a look held too long", "a small favor", "a shared joke", "a worried glance"], "The first tiny thing that shows it has started.", U],
    ],
    [3, "Each small step forward makes us want the next one, so the slow burn carries us across the whole film.", "Shows that the feelings that matter most are built, not struck.", "We are ahead of the characters, waiting for them to see what we see.", "thought", "Let the two rivals share one small joke in each of their scenes, each a little warmer, and keep the first real admission for the last ten minutes."]);

  c("comeDown", "The come-down after a high", "emo-road",
    "After a big win, a party or a moment of joy, the feeling wears off. The guests leave, the music stops, the confetti gets swept up. How fast the high drains away, and what is left behind, tells us what the win really meant.",
    [
      ["drop", "How far the feeling falls", [0, 5], "From the joy stays (0) to it falls all the way to empty (5)."],
      ["after", "What the high was", ["a win", "a party", "a first kiss", "a reunion", "a big laugh"], "The happy moment that is wearing off.", U],
      ["speed", "How fast it drains", ["slowly over days", "over a night", "in minutes", "all at once"], "How quickly the good feeling runs out."],
      ["leftover", "What is left", ["a warm glow", "quiet calm", "emptiness", "regret", "dread"], "The feeling that is still there when the high is gone.", U],
      ["sign", "What shows it", ["the empty room", "the mess left behind", "silence after the music", "being alone again"], "The picture that tells us the high is over.", U],
      ["alone", "Who is there for it", ["everyone", "a few", "just one other", "alone"], "How many people share the come-down."],
    ],
    [3, "The drop after the high shows what the win could not fix, and that sends the story onward.", "Shows that getting what you wanted is not the same as being happy.", "We feel the emptiness and want to know what will fill it.", "audio", "After the band's big show, hold on the singer alone in the empty hall while the cleaner sweeps up, the cheers still ringing faintly."]);

  /* ---------- between people ---------- */

  c("moodOutOfStep", "Out of step with the room", "emotion",
    "Everyone around them feels one thing and this one person feels another: grieving at a wedding, calm in a panic, happy at a funeral. The gap between the person and the room makes their feeling stand out.",
    [
      ["offStep", "How far out of step", [0, 5], "From feeling what the room feels (0) to feeling the opposite of everyone (5)."],
      ["roomMood", "What the room feels", ["joy", "calm", "panic", "grief", "excitement"], "The feeling of everyone else.", U],
      ["theirMood", "What they feel", ["sadness", "calm", "fear", "joy", "anger"], "The feeling of the one who is out of step.", U],
      ["hides", "Do they hide it", ["shows it plainly", "tries to fit in", "hides it well"], "Whether they let the room see the difference."],
      ["noticedBy", "Who notices", ["no one", "one person", "the whole room"], "How many people in the room see that they are different."],
      ["ends", "How it ends", ["they leave", "the room catches it", "they give in to the room", "it never ends"], "How the gap closes, or doesn't.", U],
    ],
    [2, "The one person out of step is a crack in the scene that the story can widen.", "Shows how lonely it is to feel differently from everyone around you.", "We watch the one face that does not fit, waiting for someone else to see it.", "visual", "At the loud birthday party, keep the camera finding the one guest who isn't smiling, until the host finally does too."]);

  c("emotionSeesaw", "Trading places in feeling", "emo-road",
    "Two characters swap feelings over a scene. The calm one starts to break, and the upset one becomes the one who comforts. Like a seesaw, as one goes down the other comes up.",
    [
      ["swap", "How fully they swap", [0, 5], "From each stays where they started (0) to they end in each other's place exactly (5)."],
      ["what", "What swaps", ["calm and panic", "hope and doubt", "anger and guilt", "strength and fear"], "The two feelings that change hands.", U],
      ["when", "Where in the scene it tips", ["early", "the middle", "near the end"], "The point where the seesaw crosses."],
      ["trigger", "What tips it", ["a confession", "bad news", "a joke", "a touch", "a mistake"], "What makes the strong one break and the weak one rise.", U],
      ["times", "How many times it tips", [1, 4, "times", 1], "How many times the feelings swap back and forth in the scene."],
      ["aware", "Do they notice the swap", ["neither", "one", "both say it"], "Whether the characters see that they have traded places."],
    ],
    [3, "The swap turns who leads the scene, so the next scene starts with the power on the other side.", "Shows that people hold each other up by taking turns being strong.", "We watch to see who will be the strong one next.", "plot", "In the waiting room, the panicking daughter ends up holding her father's hand once he finally admits he is scared."]);

  c("comfortOffered", "Comfort, taken or pushed away", "emotion",
    "One character tries to comfort another. Whether the comfort is taken, half taken or pushed away tells us about both of them and where they stand with each other.",
    [
      ["taken", "How much comfort is taken", [0, 5], "From pushed away hard (0) to fully taken in (5)."],
      ["way", "How it is offered", ["words", "a hand on the arm", "a hug", "sitting close in silence", "making food"], "What the comforter does.", U],
      ["giver", "Who offers it", ["a friend", "family", "a stranger", "an enemy"], "Who reaches out.", U],
      ["timing", "When it comes", ["too early", "at the right time", "too late"], "Whether the comfort arrives when it is needed."],
      ["first", "First reaction", ["pulls away", "freezes", "leans in"], "What their body does in the first second."],
      ["after", "What it leads to", ["a fight", "silence", "tears", "a laugh", "talking at last"], "What comes after the comfort is taken or refused.", U],
    ],
    [2, "Comfort taken brings two people closer; comfort refused opens a gap the story has to close.", "Shows that letting yourself be comforted can be harder than giving comfort.", "We hope they will let it in, and feel the sting when they don't.", "movement", "Let the brother sit beside her on the stairs without a word, and have her move one step down before slowly leaning back against him."]);

  c("unspokenFeeling", "The feeling nobody names", "emo-road",
    "Everyone in the family or group feels the same thing, but nobody says it out loud: the son who died, the divorce that is coming, the money that is gone. Scenes play around the hole where the words should be.",
    [
      ["unsaid", "How hard they avoid it", [0, 5], "From it comes up easily (0) to everyone works hard never to go near it (5)."],
      ["about", "What nobody says", ["a death", "a betrayal", "an illness", "money trouble", "a love"], "The thing that is never named.", U],
      ["howMany", "Who knows it", ["two people", "the family", "the whole town"], "How many people are keeping the silence."],
      ["signs", "How it shows", ["a changed subject", "a closed door", "an empty chair", "a look away", "too much small talk"], "The ways the silence shows itself.", U],
      ["scenes", "Scenes before it is said", [0, 30, "scenes", 1], "How many scenes go by before anyone names it."],
      ["said", "How it is finally said", ["never", "in a whisper", "in a shout", "by a child", "by an outsider"], "Who or what breaks the silence.", U],
    ],
    [3, "The silence presses on every scene until someone finally breaks it, and that is a turning point.", "Shows how families keep the peace by not saying the one thing that matters.", "We wait for someone to say it, and wince every time someone almost does.", "thought", "At every family dinner, let someone start a sentence about the brother and someone else pass the potatoes, until the little cousin asks where he is."]);

  /* ---------- the body and the camera ---------- */

  c("bracing", "Bracing for it", "emotion",
    "A character gets ready for a hard moment just before it: a deep breath at the door, fixing their hair, saying the words under their breath. The audience braces with them.",
    [
      ["brace", "How hard they brace", [0, 5], "From walking straight in (0) to a long, visible gathering of all their strength (5)."],
      ["how", "How they get ready", ["a deep breath", "fixing their clothes", "practicing the words", "a long look in the mirror", "a drink"], "The small ritual before the hard moment.", U],
      ["length", "How long we watch them", [1, 30, "seconds", 1], "How many seconds the film stays on the getting ready."],
      ["facing", "What they are about to face", ["bad news", "a fight", "a confession", "a crowd", "an old love"], "The hard moment on the other side of the door.", U],
      ["ready", "Was it enough", ["fully ready", "holds up", "cracks", "falls apart"], "Whether the bracing holds once the moment comes."],
      ["seen", "Who sees them brace", ["no one", "a friend", "the other person"], "Whether anyone catches them getting ready."],
    ],
    [3, "The bracing tells us something hard is about to happen, so the next scene starts with tension already in it.", "Shows the quiet courage it takes to walk into a hard moment.", "We take the breath with them and feel the door getting closer.", "movement", "Before he knocks on his ex-wife's door, let him take a breath, fix his collar, start to leave, then turn back and knock."]);

  c("reactionHolder", "Whose face carries it", "emotion",
    "When a big thing happens, the film picks whose face to show. Often it is not the person it happens to, but someone watching: the mother in the crowd, the friend at the door. Their face tells us how to feel.",
    [
      ["away", "How far from the center", [0, 5], "From the face of the person it happens to (0) to a stranger at the edge of the crowd (5)."],
      ["who", "Whose face", ["the one it happens to", "their partner", "a parent", "a friend", "a child", "a stranger"], "The face the film chooses.", U],
      ["hold", "How long we hold the face", [0, 10, "seconds", 0.5], "How many seconds the camera stays on the watching face."],
      ["size", "How close the shot is", ["far away", "the whole body", "the face", "just the eyes"], "How close the camera gets to the face."],
      ["event", "Do we see the event too", ["we see it", "we only hear it", "we only see the face"], "Whether the film shows the event itself or only the reaction."],
      ["shows", "What the face shows", ["pride", "horror", "heartbreak", "joy", "nothing yet"], "The feeling on the watching face.", U],
    ],
    [2, "Choosing whose face to show tells us whose story this moment belongs to.", "Shows that the people who love us feel our moments as much as we do.", "We look at the watching face to learn how much this matters.", "visual", "When the boy finally scores, stay on his dad in the stands, and only hear the crowd."]);

  c("keepingBusy", "Keeping busy so as not to feel", "emotion",
    "A person throws themselves into a task so the feeling cannot catch up: cleaning the whole house after a funeral, working all night, fixing a car that is not broken. The busier they get, the more we see how much it hurts.",
    [
      ["busy", "How busy they keep", [0, 5], "From a little tidying (0) to never stopping for a second (5)."],
      ["task", "What they do", ["cleaning", "cooking", "work", "fixing things", "exercise", "planning"], "The task they hide inside.", U],
      ["pace", "How fast they move", ["calm", "brisk", "frantic"], "How hard they push through the task."],
      ["stops", "What makes them stop", ["nothing", "someone stops their hands", "the task is done", "they break something"], "What finally ends the running.", U],
      ["scenes", "Scenes they keep it up", [1, 10, "scenes", 1], "How many scenes the busyness lasts."],
      ["cracks", "Does it crack", ["never", "for a moment", "fully"], "Whether the feeling breaks through in the end."],
    ],
    [2, "The busyness holds the feeling off, and the story waits for the moment it stops.", "Shows how people run from grief by staying in motion.", "Every task they finish, we wonder what happens when there is nothing left to do.", "movement", "After the funeral, let her scrub the kitchen floor while the relatives talk, until her sister kneels down and takes the brush."]);

  c("unseenCare", "Love the other never sees", "emo-road",
    "One character does a caring thing the other never finds out about: paying a debt in secret, leaving food at the door, taking the blame. Only the audience sees it, so we carry the feeling for both of them.",
    [
      ["care", "How big the hidden act is", [0, 5], "From a small favor (0) to giving up something huge in secret (5)."],
      ["act", "What they do", ["leave food", "pay a debt", "take the blame", "fix something", "keep a secret"], "The caring thing done out of sight.", U],
      ["forWhom", "Who it is for", ["a parent", "a child", "a partner", "a rival", "a stranger"], "Who gets the care without knowing.", U],
      ["found", "Is it found out", ["never", "by accident", "too late", "at the end"], "Whether the other person ever learns the truth.", U],
      ["times", "How many times", [1, 8, "times", 1], "How often the film shows the hidden act."],
      ["cost", "What it costs them", ["nothing", "time", "money", "their pride", "everything"], "What the giver pays for the care."],
    ],
    [3, "The hidden act builds a debt of feeling that the story will pay off when, or if, it comes out.", "Shows love as something you do, not something you say.", "We know what they did, and we long for the other person to find out.", "plot", "Let the grumpy neighbor shovel the widow's path every snowy morning before dawn, and never let her see him do it."]);

  c("emptyPlace", "The empty place", "emo-road",
    "The feeling of someone gone, shown by the space they left: the empty chair at dinner, the untouched bed, the extra cup poured by habit. The absence is felt every time the camera finds it.",
    [
      ["absence", "How strongly it is felt", [0, 5], "From barely noticed (0) to the empty place fills the whole scene (5)."],
      ["place", "What is empty", ["a chair", "a bed", "a coat hook", "a seat in the car", "a pair of shoes"], "The space they left behind.", U],
      ["gone", "Why they are gone", ["they died", "they left", "they are away", "they are lost"], "The reason the place is empty.", U],
      ["habit", "A habit that remembers them", ["none", "an extra plate set", "their cup poured", "a call to their phone"], "Something someone still does out of habit for the one who is gone.", U],
      ["shown", "Times we see it", [1, 8, "times", 1], "How often the camera comes back to the empty place."],
      ["filled", "Is the place filled again", ["never", "by someone new", "by them, back again", "by an object"], "How the film ends the absence, if it does.", U],
    ],
    [2, "Each return to the empty place reminds us what the story is really about.", "Shows that people stay with us in the spaces they leave.", "We look for the empty place in every scene, and feel it when it is there.", "visual", "Set four plates every night for a family of three, and on the last night let the mother set only three."]);

  /* ---------- suites ---------- */

  S("after-the-news", "After the news", "emotion",
    "The news lands and she goes numb, keeps scrubbing the kitchen, and only breaks days later in the car.",
    [
      { curiosity: "shockNumb", value: 4 },
      { curiosity: "shockNumb", slider: "sound", value: "goes muffled" },
      { curiosity: "shockNumb", slider: "doing", value: "keep doing a chore" },
      { curiosity: "keepingBusy", value: 4 },
      { curiosity: "keepingBusy", slider: "task", value: "cleaning" },
      { curiosity: "delayedReaction", value: 4 },
      { curiosity: "delayedReaction", slider: "where", value: "in the car" },
      { curiosity: "delayedReaction", slider: "size", value: "sobbing" },
      { curiosity: "grief", value: 4, weight: 60 },
    ]);

  S("the-quiet-reunion", "The quiet reunion", "emotion",
    "Years of waiting, a breath at the door, and the biggest feeling of the film played as one small line while we watch his mother's face.",
    [
      { curiosity: "bracing", value: 4 },
      { curiosity: "bracing", slider: "how", value: "a deep breath" },
      { curiosity: "bigFeelingSmall", value: 5 },
      { curiosity: "bigFeelingSmall", slider: "form", value: "a long look" },
      { curiosity: "bigFeelingSmall", slider: "music", value: "stops" },
      { curiosity: "reactionHolder", value: 3 },
      { curiosity: "reactionHolder", slider: "who", value: "a parent" },
      { curiosity: "earnedTears", value: 4, weight: 60 },
    ]);

  S("the-hole-in-the-family", "The hole in the family", "emo-road",
    "An empty chair nobody mentions, an extra plate set out of habit, and his jacket kept in the closet.",
    [
      { curiosity: "emptyPlace", value: 5 },
      { curiosity: "emptyPlace", slider: "place", value: "a chair" },
      { curiosity: "emptyPlace", slider: "habit", value: "an extra plate set" },
      { curiosity: "unspokenFeeling", value: 4 },
      { curiosity: "unspokenFeeling", slider: "about", value: "a death" },
      { curiosity: "unspokenFeeling", slider: "said", value: "by a child" },
      { curiosity: "keepsake", value: 4 },
      { curiosity: "keepsake", slider: "thing", value: "a piece of clothing" },
      { curiosity: "keepsake", slider: "standsFor", value: "someone gone" },
    ]);

  S("love-that-takes-its-time", "Love that takes its time", "emo-road",
    "A look held too long in the first scene, small secret kindnesses, and the words saved for the very end.",
    [
      { curiosity: "slowBurn", value: 5 },
      { curiosity: "slowBurn", slider: "feeling", value: "love" },
      { curiosity: "slowBurn", slider: "firstSign", value: "a look held too long" },
      { curiosity: "slowBurn", slider: "admitted", value: "near the end" },
      { curiosity: "unseenCare", value: 3 },
      { curiosity: "unseenCare", slider: "forWhom", value: "a partner" },
      { curiosity: "warmth", value: 3, weight: 60 },
      { curiosity: "warmth", slider: "trend", value: "warming", weight: 60 },
    ]);

  S("after-the-party", "After the party", "emo-road",
    "The cheering stops, the room empties, and the one guest who never joined in is the one left sitting with the host.",
    [
      { curiosity: "comeDown", value: 4 },
      { curiosity: "comeDown", slider: "after", value: "a party" },
      { curiosity: "comeDown", slider: "sign", value: "the empty room" },
      { curiosity: "comeDown", slider: "leftover", value: "emptiness" },
      { curiosity: "moodOutOfStep", value: 3 },
      { curiosity: "moodOutOfStep", slider: "roomMood", value: "joy" },
      { curiosity: "moodOutOfStep", slider: "theirMood", value: "sadness" },
      { curiosity: "loneliness", value: 3, weight: 60 },
    ]);

  S("holding-each-other-up", "Holding each other up", "emo-road",
    "The strong one finally breaks, the scared one steps up, and comfort that was pushed away earlier is taken at last.",
    [
      { curiosity: "emotionSeesaw", value: 5 },
      { curiosity: "emotionSeesaw", slider: "what", value: "strength and fear" },
      { curiosity: "emotionSeesaw", slider: "trigger", value: "a confession" },
      { curiosity: "comfortOffered", value: 4 },
      { curiosity: "comfortOffered", slider: "way", value: "sitting close in silence" },
      { curiosity: "comfortOffered", slider: "first", value: "leans in" },
      { curiosity: "twoRoads", value: "crossing", weight: 60 },
    ]);

  S("anger-with-nowhere-to-go", "Anger with nowhere to go", "emotion",
    "He cannot fight his boss, so he slams doors at home, refuses his wife's hand, and works all night instead of talking.",
    [
      { curiosity: "displacedFeeling", value: 4 },
      { curiosity: "displacedFeeling", slider: "feeling", value: "anger" },
      { curiosity: "displacedFeeling", slider: "why", value: "the person is too powerful" },
      { curiosity: "displacedFeeling", slider: "target", value: "an object" },
      { curiosity: "comfortOffered", value: 1 },
      { curiosity: "comfortOffered", slider: "first", value: "pulls away" },
      { curiosity: "keepingBusy", value: 3 },
      { curiosity: "keepingBusy", slider: "task", value: "work" },
      { curiosity: "emotionalDebt", value: 4, weight: 60 },
    ]);

  S("the-proud-face-in-the-crowd", "The proud face in the crowd", "emotion",
    "We never see the winning goal; we see his father in the stands, braced all game, and then the smallest nod.",
    [
      { curiosity: "reactionHolder", value: 4 },
      { curiosity: "reactionHolder", slider: "who", value: "a parent" },
      { curiosity: "reactionHolder", slider: "event", value: "we only hear it" },
      { curiosity: "reactionHolder", slider: "shows", value: "pride" },
      { curiosity: "bigFeelingSmall", value: 4 },
      { curiosity: "bigFeelingSmall", slider: "form", value: "a tiny nod" },
      { curiosity: "bracing", value: 2, weight: 70 },
      { curiosity: "pushInFace", value: 3, weight: 60 },
    ]);

  /* ---------- proximities ---------- */

  P("numb-holds-feeling-in", "When they go numb, the feeling is held in", "emotion",
    "When the numbness grows after a shock, the feeling held in rises within a beat.",
    { curiosity: "shockNumb", change: "rises" }, { curiosity: "emotionalDebt", change: "rises" }, 1, { also: ["emo-road"] });
  P("numb-hits-later", "When they go numb for long, the feeling hits later", "emotion",
    "When the numbness lasts most of the film, the late breakdown grows within 4 beats.",
    { curiosity: "shockNumb", slider: "lasts", is: "most of the film" }, { curiosity: "delayedReaction", change: "rises" }, 4, { also: ["emo-road"] });
  P("numb-quiet-sound", "When the sound goes silent in the numbness, the music drops out", "emotion",
    "When the world goes silent around the numb character, the stretch with no music grows within a beat.",
    { curiosity: "shockNumb", slider: "sound", is: "total silence" }, { curiosity: "noMusic", change: "rises" }, 1, { also: ["music"] });
  P("late-hit-release", "When the feeling hits later, the release is bigger", "emo-road",
    "When the breakdown comes later, the release when it comes grows within 2 beats.",
    { curiosity: "delayedReaction", change: "rises" }, { curiosity: "emoRelease", change: "rises" }, 2, { also: ["emotion"] });
  P("held-in-wrong-target", "When a feeling is held in too long, it lands on the wrong thing", "emotion",
    "When the feeling held in grows, taking it out on the wrong thing rises within 3 beats.",
    { curiosity: "emotionalDebt", change: "rises" }, { curiosity: "displacedFeeling", change: "rises" }, 3, { also: ["emo-road"] });
  P("wrong-target-friend-gap", "When it lands on a friend, the gap between them grows", "emotion",
    "When the misplaced feeling hits a friend, the feeling gap between the two rises within a beat.",
    { curiosity: "displacedFeeling", slider: "target", is: "a friend" }, { curiosity: "emotionGap", change: "rises" }, 1);
  P("keepsake-returns", "When a thing holds more feeling, we keep seeing it", "emo-road",
    "When the object carries more feeling, the times it comes back in the film rise within 3 beats.",
    { curiosity: "keepsake", change: "rises" }, { curiosity: "returningObject", change: "rises" }, 3, { also: ["focus"] });
  P("keepsake-given-release", "When the keepsake is given away, the feeling is let go", "emo-road",
    "When the character finally gives the object away, a release follows within a beat.",
    { curiosity: "keepsake", slider: "fate", is: "given away" }, { curiosity: "emoRelease", change: "rises" }, 1, { also: ["emotion"] });
  P("small-play-audience", "When the big moment is played smaller, the audience feels more", "emotion",
    "When the big feeling is held back on the surface, what the audience feels grows stronger within a beat.",
    { curiosity: "bigFeelingSmall", change: "rises" }, { curiosity: "audienceFeeling", is: "stronger" }, 1);
  P("small-play-earned", "When the big moment is saved for the whole film, the tears are earned", "emo-road",
    "When the film saves its big feeling for the whole film, earned tears rise within a beat.",
    { curiosity: "bigFeelingSmall", slider: "savedFor", is: "the whole film" }, { curiosity: "earnedTears", change: "rises" }, 1, { also: ["emotion"] });
  P("slow-burn-warmth", "When a feeling grows slowly, the warmth between them climbs", "emo-road",
    "When the slow burn grows, the warmth between the two rises within 3 beats.",
    { curiosity: "slowBurn", change: "rises" }, { curiosity: "warmth", change: "rises" }, 3);
  P("slow-burn-never-said-longing", "When the feeling is never said, longing builds", "emo-road",
    "When the slow-growing feeling is never said out loud, longing rises within 2 beats.",
    { curiosity: "slowBurn", slider: "admitted", is: "never" }, { curiosity: "longing", change: "rises" }, 2);
  P("come-down-contrast", "When a high falls further, the next scene feels the opposite", "emo-road",
    "When the come-down after a high is deeper, the contrast with the last scene rises within a beat.",
    { curiosity: "comeDown", change: "rises" }, { curiosity: "emoContrastPrev", change: "rises" }, 1, { also: ["emotion"] });
  P("come-down-alone-lonely", "When the come-down is faced alone, loneliness grows", "emo-road",
    "When nobody is left to share the come-down, loneliness rises within 2 beats.",
    { curiosity: "comeDown", slider: "alone", is: "alone" }, { curiosity: "loneliness", change: "rises" }, 2);
  P("out-of-step-apart", "When they are out of step with the room, they stand apart", "emotion",
    "When one person's feeling drifts further from the room's, standing apart from the group grows within a beat.",
    { curiosity: "moodOutOfStep", change: "rises" }, { curiosity: "apartFromGroup", change: "rises" }, 1, { also: ["placement"] });
  P("room-catches-spread", "When the room catches their feeling, it spreads", "emotion",
    "When the room catches the out-of-step feeling, how far the feeling spreads rises within a beat.",
    { curiosity: "moodOutOfStep", slider: "ends", is: "the room catches it" }, { curiosity: "emoSpread", change: "rises" }, 1, { also: ["herd"] });
  P("seesaw-roads-cross", "When two people trade places in feeling, their roads cross", "emo-road",
    "When the swap grows more complete, the two characters' roads cross within 2 beats.",
    { curiosity: "emotionSeesaw", change: "rises" }, { curiosity: "twoRoads", is: "crossing" }, 2);
  P("comfort-taken-warmth", "When comfort is taken, the warmth between them grows", "emotion",
    "When more of the comfort is taken in, the warmth between the two rises within a beat.",
    { curiosity: "comfortOffered", change: "rises" }, { curiosity: "warmth", change: "rises" }, 1, { also: ["emo-road"] });
  P("unspoken-dread", "When the feeling goes unnamed for longer, dread builds", "emo-road",
    "When the family works harder to avoid the subject, dread rises within 3 beats.",
    { curiosity: "unspokenFeeling", change: "rises" }, { curiosity: "dread", change: "rises" }, 3);
  P("unspoken-said-catharsis", "When the unspoken thing is finally shouted, catharsis comes", "emo-road",
    "When the silence is broken with a shout, catharsis rises within a beat.",
    { curiosity: "unspokenFeeling", slider: "said", is: "in a shout" }, { curiosity: "catharsis", change: "rises" }, 1);
  P("brace-falls-apart-release", "When the bracing falls apart, the feeling spills out", "emotion",
    "When the bracing fails and they fall apart, the release rises within a beat.",
    { curiosity: "bracing", slider: "ready", is: "falls apart" }, { curiosity: "emoRelease", change: "rises" }, 1);
  P("reaction-holder-empathy", "When we watch a loving face, we feel more", "emotion",
    "When the film holds on a watching face further from the center, feeling with the characters rises within a beat.",
    { curiosity: "reactionHolder", change: "rises" }, { curiosity: "empathy", change: "rises" }, 1);
  P("reaction-holder-push-in", "When the face is shown up to the eyes, the camera pushes in", "emotion",
    "When the reaction is shown as close as the eyes, the slow push in on the face grows within a beat.",
    { curiosity: "reactionHolder", slider: "size", is: "just the eyes" }, { curiosity: "pushInFace", change: "rises" }, 1, { also: ["camera-motion"] });
  P("busy-hands-strain", "When they keep busier, the hands show the strain", "emotion",
    "When they throw themselves harder into a task, the tension in their hands rises within a beat.",
    { curiosity: "keepingBusy", change: "rises" }, { curiosity: "emoHands", change: "rises" }, 1);
  P("busy-stopped-comfort", "When someone stops their hands, comfort comes in", "emotion",
    "When someone stops them from keeping busy, comfort is taken within a beat.",
    { curiosity: "keepingBusy", slider: "stops", is: "someone stops their hands" }, { curiosity: "comfortOffered", change: "rises" }, 1);
  P("unseen-care-audience", "When love goes unseen, the audience feels it for them", "emo-road",
    "When the hidden act of care grows, what the audience feels becomes stronger than what the characters feel within 2 beats.",
    { curiosity: "unseenCare", change: "rises" }, { curiosity: "audienceFeeling", is: "stronger" }, 2, { also: ["emotion"] });
  P("unseen-care-too-late-grief", "When the hidden care is found too late, grief deepens", "emo-road",
    "When the hidden act of love is found out too late, grief rises within a beat.",
    { curiosity: "unseenCare", slider: "found", is: "too late" }, { curiosity: "grief", change: "rises" }, 1);
  P("empty-place-grief", "When the empty place is felt more, grief grows", "emo-road",
    "When the absence fills more of the scene, grief rises within 2 beats.",
    { curiosity: "emptyPlace", change: "rises" }, { curiosity: "grief", change: "rises" }, 2);
  P("empty-place-unspoken", "When the empty place is shown often, nobody can name it", "emo-road",
    "When the empty place keeps coming back, the feeling nobody names grows within 2 beats.",
    { curiosity: "emptyPlace", change: "rises" }, { curiosity: "unspokenFeeling", change: "rises" }, 2);

  /* ---------- proximity suites ---------- */

  PS("the-feeling-that-waits", "The feeling that waits", "emotion",
    "Numbness holds the feeling in, it hits later somewhere ordinary, and the release is bigger for the wait.",
    ["numb-holds-feeling-in", "numb-hits-later", "late-hit-release", "held-in-wrong-target"], { also: ["emo-road"] });
  PS("the-gone-and-the-silent", "The gone and the silent", "emo-road",
    "The empty place keeps returning, nobody can name it, dread builds, and when it is finally shouted the room breaks open.",
    ["empty-place-grief", "empty-place-unspoken", "unspoken-dread", "unspoken-said-catharsis"]);
  PS("saved-and-small", "Saved and played small", "emotion",
    "The big feeling is saved and played small, the audience feels more than the character shows, and the tears are earned.",
    ["small-play-audience", "small-play-earned", "reaction-holder-empathy", "reaction-holder-push-in"], { also: ["emo-road"] });
  PS("leaning-on-each-other", "Leaning on each other", "emo-road",
    "Comfort taken warms them, the busy hands are stopped, the two trade places, and the slow-growing feeling warms them further.",
    ["comfort-taken-warmth", "busy-stopped-comfort", "seesaw-roads-cross", "slow-burn-warmth"], { also: ["emotion"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
