/* data/db-depth-comedy.js: comedy, deeper. 14 comedy curiosities (the wrong person overhears, trying too hard to
   be cool, taking it literally, the plan that fails at step one, the long walk of shame, the deliberately cheap
   effect, the joke you catch the second time, keeping up polite appearances, the one who never gets the joke, the
   joke we only hear, interrupted at the worst moment, mistaken for someone else, the animal that steals the scene,
   the fumbled hello) and 6 comedy-from-the-mix curiosities (a war fought politely, two talks that cross, everyone
   fixing it at once, shot like the wrong kind of film, every problem in one room, copying someone badly), each with
   its own graded sliders and a momentum note, tied into suites, proximities and proximity suites. Loaded after
   db-depth-fx.js. Written 2026-10-04 by the depth thread (comedy). */
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

  /* ---------- new comedy curiosities ---------- */

  c("wrongEar", "The wrong person overhears", "comedy",
    "Someone says something private (a complaint, a secret, a confession) and the one person who should not hear it is right there: behind the door, on a phone left on, in the next booth. The laugh is in their face, and in what they do with what they heard, which is often only half of it.",
    [
      ["overheard", "How bad it is that they heard", [0, 5], "From a harmless slip (0) to the worst person hearing the worst possible thing (5)."],
      ["what", "What they overhear", ["a complaint about them", "a secret", "a confession of love", "a plan", "a joke at their expense"], "What the words were about.", U],
      ["how", "How they hear it", ["through a wall", "behind a door", "a phone left on", "a microphone left on", "standing right behind them"], "How the words reach the wrong ears.", U],
      ["half", "How much they hear", ["only a few words", "half of it, out of context", "all of it"], "Whether they hear all of it or only the worst part, without what came before."],
      ["speakerKnows", "Does the speaker find out", ["never", "later", "the moment they turn around"], "Whether the speaker learns they were heard, and when.", U],
      ["response", "What the listener does", ["says nothing and stews", "confronts them", "plays along to trap them", "spreads it to everyone"], "What the one who overheard does with it.", U],
    ],
    [4, "What they overheard, often only half of it, sets off a mix-up the next scenes must untangle.", "Shows how words change when they reach the wrong ears.", "We wince, waiting for the speaker to turn around.", "audio", "Let the groom complain about his mother-in-law's cooking on the phone, then turn him around to find her in the doorway holding the cake."]);

  c("tryingTooHard", "Trying too hard to be cool", "comedy",
    "A character works hard to look relaxed, cool or in charge: sunglasses at night, a lean on a wall that is not there, slang that is ten years old, even describing their own cool moves out loud. The effort shows, and the harder they try, the less cool they look.",
    [
      ["effort", "How hard they try", [0, 5], "From quite relaxed (0) to every move a performance (5)."],
      ["move", "The cool move", ["a casual lean", "sunglasses", "new slang", "a smooth line", "describing their own moves", "a stunt"], "What they do to look cool.", U],
      ["audience", "Who they want to impress", ["a crush", "the boss", "kids", "a rival", "nobody, just themselves"], "Who the show is for.", U],
      ["cracks", "How it goes wrong", ["it doesn't", "a small slip", "a loud fail", "a total collapse"], "How badly the cool act breaks."],
      ["covers", "How they cover it", ["they don't notice", "pretend it was on purpose", "double down", "admit it"], "What they do when the act slips.", U],
      ["seen", "Who sees the fail", ["no one", "only us", "the one they wanted to impress", "everyone"], "How many people catch the cool act failing."],
    ],
    [2, "Every failed attempt raises the stakes for the next one, so they have to try even harder.", "Shows that being yourself beats any performance.", "We cringe and still hope the next move works.", "movement", "Have him lean casually on the car to talk to her, and let the car roll slowly away in the middle of his sentence."]);

  c("literalMinded", "Taking it literally", "comedy",
    "Someone takes words at their exact meaning: told to \"break a leg\" they look worried, told to \"keep an eye on him\" they stare without blinking. The joke is the gap between what was meant and what was done. It can come from a robot, a child, someone new to the language or just a very literal person.",
    [
      ["literal", "How literally they take it", [0, 5], "From getting the hint (0) to doing exactly what the words say, no matter what (5)."],
      ["words", "What they take literally", ["a saying", "an order", "a polite lie", "a joke", "a sign"], "The kind of words that get misread.", U],
      ["who", "Who takes it literally", ["a child", "a robot or alien", "someone new to the language", "a very rigid person", "a dog"], "Who reads the words too exactly.", U],
      ["acted", "Do they act on it", ["just say it back", "look puzzled", "act it out", "act it out in full, at length"], "How far they go with the literal meaning."],
      ["repeats", "Times it happens", [0, 6, "times", 1], "How many times in the film someone takes words this way."],
      ["lesson", "Does it turn out right", ["no, just a mess", "by accident it helps", "they were right all along"], "Whether the literal reading ends in a mess or, oddly, in the right answer.", U],
    ],
    [2, "An order followed to the letter makes a mess the story has to clean up.", "Shows how much we say that we do not mean.", "We wait to see which saying they will trip over next.", "thought", "Tell the new robot butler to \"hit the lights\", and cut to him politely punching the lamp."]);

  c("planFailsFirst", "The plan that fails at step one", "comedy",
    "A careful plan is laid out with maps, timings and code names, and then it fails at the very first step: the door is locked, the van will not start, someone forgot the bag. Close to \"Tiny want, huge effort\", which is about wanting something small; this one is about the gap between careful planning and the instant collapse.",
    [
      ["prep", "How much preparation", [0, 5], "From a rough idea (0) to charts, models and rehearsals (5)."],
      ["shown", "How the plan is shown", ["just talked about", "a whiteboard", "a model of the place", "a full rehearsal", "a voice-over while we watch it"], "How we learn the plan before it breaks.", U],
      ["steps", "Steps in the plan", [1, 12, "steps", 1], "How many steps the plan has, all for nothing."],
      ["failsAt", "Where it fails", ["before step one", "at step one", "at step two", "at the last step"], "How early the plan falls apart."],
      ["cause", "What breaks it", ["a locked door", "a forgotten thing", "one person's mistake", "a tiny animal", "plain bad luck"], "The small thing that ruins it.", U],
      ["after", "What they do next", ["give up", "improvise and win", "improvise and make it worse", "start a new, longer plan"], "What happens once the plan is dead.", U],
    ],
    [3, "When the plan breaks at once, the characters must make it up as they go, and the story heads where no plan expected.", "Shows that life does not follow plans.", "We watch the plan unfold, guessing where it will break, and it breaks sooner than we thought.", "plot", "Show the twelve-step plan on a whiteboard, then cut to step one: none of them can open the van door."]);

  c("walkOfShame", "The long walk of shame", "comedy",
    "After a humiliation a character has to leave, and the way out is long: across a silent office, down the aisle of a full bus, back to their seat in front of the whole class. The camera often holds on the walk, and every second of it is the joke.",
    [
      ["length", "How long the walk feels", [0, 5], "From a quick exit (0) to a walk that never seems to end (5)."],
      ["where", "Where they walk", ["across a room", "down a long hall", "down an aisle", "off a stage", "across a parking lot"], "The path out.", U],
      ["watchers", "How many watch", [0, 100, "people", 1], "How many eyes follow them out."],
      ["silence", "What we hear", ["normal noise", "quiet", "dead silence", "one person clapping", "sad music"], "The sound under the walk.", U],
      ["dignity", "How they carry it", ["head held high", "pretending it's fine", "shrinking", "running at the end"], "How they hold themselves on the way out.", U],
      ["shot", "How the camera holds it", ["a quick cut", "follows behind", "one long wide shot", "from their point of view"], "How the walk is filmed.", U],
    ],
    [1, "The walk out closes the humiliation and leaves the character with something to win back.", "Shows how heavy other people's eyes can be.", "We walk every step with them and want it to end.", "movement", "After her pitch flops, hold one wide shot as she walks the whole length of the boardroom, and let one person start a slow clap."]);

  c("cheapEffect", "The deliberately cheap effect", "comedy",
    "An effect made to look cheap on purpose: a visible string on the spaceship, a cardboard rock that bounces, a fake beard half off, a dummy that is clearly a dummy. It laughs at old low-budget films, and with the audience, who are in on it.",
    [
      ["cheap", "How cheap it looks", [0, 5], "From a convincing effect (0) to obviously cardboard and string (5)."],
      ["kind", "What is faked", ["a prop", "a monster", "a set", "a dummy or stand-in", "a camera trick", "a fake background"], "The thing made to look homemade.", U],
      ["flaw", "What gives it away", ["a visible string", "wobbling", "a badly matched cut", "the wrong size", "a zip on the costume"], "The detail that shows it is fake.", U],
      ["played", "How the actors treat it", ["dead serious", "they barely notice", "they point it out"], "Whether the people in the film act as if it is real.", U],
      ["homage", "Copying an old style", ["no", "a nod to old films", "a full copy of an old style"], "How much it imitates the cheap films of the past."],
      ["repeats", "Times it shows", [1, 6, "times", 1], "How often the cheap effect appears."],
    ],
    [1, "A cheap effect played straight keeps the plot going while we laugh at how it looks.", "Shows love for old, homemade films.", "We wait for the next wobble.", "visual", "Lower the alien ship on a fishing line we can clearly see, and have the general salute it with total respect."]);

  c("rewatchGag", "The joke you catch the second time", "comedy",
    "A joke hidden so it only lands when you watch again: a line that means something else once you know the ending, a background detail that pays off later, a character already wearing the disguise in scene one. The first time, nothing; the second time, a laugh and a nod.",
    [
      ["hidden", "How well hidden", [0, 5], "From spotted at once (0) to almost nobody sees it the first time (5)."],
      ["kind", "What kind of hidden joke", ["a background detail", "a line with a second meaning", "a name or a sign", "a character already there", "a sound"], "What the hidden joke is made of.", U],
      ["needs", "What you need to know", ["nothing, just sharp eyes", "a later scene", "the ending", "the film's secret"], "What you must know before the joke works."],
      ["gap", "Time to what explains it", [0, 120, "minutes", 5], "How far apart the hidden joke and the moment that explains it are."],
      ["count", "Hidden jokes in the film", [1, 20, "jokes", 1], "How many jokes like this are planted."],
      ["fair", "Can a first-timer catch it", ["impossible", "very hard", "possible with sharp eyes"], "Whether a careful first-time viewer has a chance."],
    ],
    [1, "A hidden detail plants something the ending will use, so the story pays it back later.", "Shows that the film was planned down to the last detail.", "On a second watch we hunt for every clue.", "thought", "In the first party scene, put the killer in the background, already holding the knife wrapped as a present."]);

  c("politeSurface", "Keeping up polite appearances", "comedy",
    "At a formal dinner, a wedding or a first meeting with the in-laws, everyone follows the rules of good manners while something goes badly wrong. The comedy is people staying polite when they want to scream: the forced smile, the small talk over the disaster, the toast that must go on. Writers call it comedy of manners.",
    [
      ["polite", "How polite they stay", [0, 5], "From dropping the act at once (0) to perfect manners no matter what (5)."],
      ["event", "The occasion", ["a dinner party", "a wedding", "meeting the parents", "a funeral", "a business lunch", "a royal visit"], "The formal event with its rules.", U],
      ["wrong", "What is going wrong", ["a small mess", "an insult", "a secret coming out", "a fire", "a death"], "The trouble everyone is being polite about, from small to huge."],
      ["mask", "How the strain shows", ["it doesn't", "a tight smile", "a twitch", "a vein about to pop"], "How much of the effort leaks onto their faces."],
      ["rules", "How strict the rules", ["relaxed", "normal", "strict", "ancient and absurd"], "How many rules of manners the occasion has."],
      ["breaks", "Does someone crack", ["no one", "one person", "everyone at the end"], "Whether the polite surface finally breaks."],
    ],
    [2, "Every rule they keep makes the hidden trouble grow until it bursts out.", "Shows how good manners can hide what people really feel.", "We wait for the moment someone finally says what they think.", "thought", "Have the dinner guests keep passing the potatoes and making small talk while the kitchen behind them fills with smoke."]);

  c("neverGetsIt", "The one who never gets the joke", "comedy",
    "Everyone in the room laughs and one person does not get it, every time: they ask what was funny, laugh much too late, or answer the joke as if it were a real question. Their confusion becomes a joke of its own.",
    [
      ["lost", "How lost they are", [0, 5], "From getting it a beat late (0) to never getting any joke at all (5)."],
      ["shows", "How they show it", ["a blank face", "asks what was funny", "laughs much too late", "answers it seriously", "explains why it's wrong"], "What they do when the joke goes past them.", U],
      ["minds", "Do they mind", ["not at all", "a little", "feels left out"], "How much it bothers them."],
      ["others", "How the others react", ["ignore them", "explain it", "tease them", "love them for it"], "What the rest of the room does about it.", U],
      ["times", "Times it happens", [1, 8, "times", 1], "How many jokes go past them in the film."],
      ["finally", "Do they finally get one", ["never", "yes, much too late", "they make the best joke at the end"], "Whether they ever catch up.", U],
    ],
    [1, "When they finally get it, or make the best joke, it closes their small story.", "Shows the loneliness of being outside the joke.", "We check their face after every laugh.", "thought", "After every laugh at the table, cut to Grandpa, who laughs alone ten seconds later."]);

  c("offscreenGag", "The joke we only hear", "comedy",
    "The funny thing happens out of sight and we only hear it: a crash in the next room, a long fall down the stairs, a yelp and a splash. Our minds draw something funnier than anything shown. Close to \"Comic sound\", which counts the funny sound effects; this one keeps the whole gag off screen.",
    [
      ["unseen", "How much stays unseen", [0, 5], "From mostly shown (0) to only sound, nothing seen (5)."],
      ["sound", "What we hear", ["a crash", "a long fall", "a splash", "a scream", "an animal", "a long chain of sounds"], "The noise that tells the joke.", U],
      ["length", "How long the sound goes on", [0, 10, "seconds", 0.5], "How long the noise runs while we watch the faces."],
      ["faces", "Whose faces we watch", ["nobody, an empty doorway", "one person", "everyone in the room"], "What the camera shows while we listen."],
      ["after", "What we see after", ["nothing", "the result", "the person walks back in calm", "we never find out"], "Whether the film ever shows what happened.", U],
      ["flinch", "How the listeners react", ["no reaction", "a wince", "a wince at each sound", "they cover their ears"], "How much the people on screen react to each noise."],
    ],
    [1, "The noise off screen leaves a mess the next shot must show, or a mystery it never does.", "Shows how much the mind can picture from a sound.", "We lean in, picturing what is happening out of sight.", "audio", "Keep the camera on the parents in the living room as the teenager's bike goes crashing down the garage stairs, one clang at a time."]);

  c("worstMoment", "Interrupted at the worst moment", "comedy",
    "Just as the big moment arrives (the kiss, the proposal, the confession, the speech) something cuts in: a phone rings, a kid walks in, the waiter arrives, someone sneezes. The joke is the timing, and how many times it can happen.",
    [
      ["timing", "How bad the timing", [0, 5], "From a small pause (0) to the very last word cut off (5)."],
      ["moment", "What gets interrupted", ["a kiss", "a proposal", "a confession", "a speech", "a big fight", "a secret being told"], "The big moment that never quite happens.", U],
      ["by", "What cuts in", ["a phone", "a person walking in", "a waiter", "a sneeze", "an alarm", "an animal"], "The thing that breaks the moment.", U],
      ["tries", "Times they try again", [0, 6, "times", 1], "How many times the moment is tried and cut off."],
      ["mood", "Does the moment survive", ["it carries on", "it is a little spoiled", "it is lost", "it turns into something better"], "What is left of the moment after the interruption."],
      ["blame", "Does the interrupter know", ["has no idea", "realizes too late", "did it on purpose"], "Whether the one who cuts in knows what they broke.", U],
    ],
    [3, "An unfinished confession or proposal leaves the big question hanging for later scenes.", "Shows how rarely life gives us the perfect moment.", "We want to shout at the phone to stop ringing.", "plot", "Each time he kneels to propose, have the waiter arrive with another course, until he gives up and shouts the question across the restaurant."]);

  c("mistakenIdentity", "Mistaken for someone else", "comedy",
    "A character is taken for someone else: a new boss, a famous guest, a spy, a twin. They play along, or cannot get a word in, and the mix-up grows. Close to \"Misunderstanding\", which is two people meaning different things; this one is about who someone is.",
    [
      ["mixup", "How big the mix-up", [0, 5], "From a moment of confusion (0) to a whole life lived as someone else (5)."],
      ["takenFor", "Taken for", ["a stranger", "a famous person", "the new boss", "a criminal or spy", "their own twin"], "Who they are mistaken for.", U],
      ["why", "Why the mix-up", ["a look-alike", "the same name", "wearing the wrong thing", "in the wrong place", "they lied once"], "What starts the confusion.", U],
      ["plays", "Do they play along", ["try to explain", "give up explaining", "happily play along", "use it on purpose"], "How much they lean into being someone else."],
      ["howMany", "Who is fooled", ["one person", "a few", "a whole town"], "How many people believe it."],
      ["truth", "How it comes out", ["it doesn't", "the real one turns up", "they confess", "they get caught"], "How the mix-up ends.", U],
    ],
    [4, "Living as someone else drives the plot: every scene asks how long it can last.", "Shows how much we treat people by the role we think they have.", "We wait for the real one to walk through the door.", "plot", "Have the waiter mistaken for the visiting chef, and make him give a speech about cooking he has never done."]);

  c("sceneStealer", "The animal that steals the scene", "comedy",
    "A dog, a cat, a goat or a parrot does something at the wrong moment and pulls every eye away from the people: eats the cake, sits on the papers, repeats the rude word. The humans try to carry on. Close to \"Distraction\", which is any pull on attention; this one is a creature upstaging the humans.",
    [
      ["steal", "How much it steals", [0, 5], "From a quiet animal in the corner (0) to the animal is all anyone watches (5)."],
      ["animal", "The animal", ["a dog", "a cat", "a parrot", "a goat", "a duck", "a horse"], "Which creature takes over.", U],
      ["does", "What it does", ["stares", "makes a noise", "eats something", "sits in the wrong place", "runs off with something", "copies a person"], "What the animal gets up to.", U],
      ["when", "When it strikes", ["at a quiet moment", "in the middle of a speech", "at the big kiss", "at the very end"], "The moment it picks to steal the scene.", U],
      ["humans", "How the humans cope", ["don't notice", "pretend not to notice", "try to stop it", "give up and watch"], "How the people react to being upstaged."],
      ["owner", "Whose animal it is", ["the hero's", "the villain's", "a stranger's", "nobody's"], "Who the animal belongs to.", U],
    ],
    [1, "Whatever the animal grabs or ruins can push the scene somewhere new.", "Shows that life does not wait for people to finish being serious.", "We cannot stop watching the animal.", "movement", "During the lawyer's closing speech, let the witness's parrot repeat the last word of every sentence, and have everyone keep a straight face."]);

  c("fumbledHello", "The fumbled hello", "comedy",
    "Two people meet and get the greeting wrong: one goes for a hug, the other for a handshake; a kiss on one cheek meets a kiss on the other; a high five is left hanging. Social rules meet two bodies that do not agree.",
    [
      ["fumble", "How bad the fumble", [0, 5], "From a tiny hitch (0) to a tangle of arms that will not end (5)."],
      ["first", "What one tries", ["a handshake", "a hug", "a kiss on the cheek", "a high five", "a bow", "a fist bump"], "The greeting the first person goes for.", U],
      ["second", "What the other tries", ["a handshake", "a hug", "a kiss on the cheek", "a high five", "a bow", "nothing"], "The greeting the second person goes for.", U],
      ["rounds", "Rounds of trying", [1, 5, "rounds", 1], "How many times they switch before it ends."],
      ["ending", "How it ends", ["they give up", "a stiff hug", "they bump heads", "someone else saves them"], "How the tangle finally stops.", U],
      ["status", "Who they are to each other", ["strangers", "old friends", "the boss and a worker", "ex-lovers"], "What makes the greeting matter.", U],
    ],
    [1, "An awkward start sets the tone of the meeting and how the two will get on.", "Shows how unsure we are about how close to stand to someone.", "We cringe and laugh with them.", "movement", "Have the new worker go for a handshake while the boss goes for a hug, switch twice, and settle on a stiff pat on the shoulder."]);

  /* ---------- new comedy-from-the-mix curiosities ---------- */

  c("politeWar", "A war fought politely", "comedy-mix",
    "Two rivals fight without ever raising their voices: sweet compliments with a sting, gifts meant to embarrass, offers of help that are really insults. Close to \"Clash of egos\" and \"Keeping up polite appearances\"; this one is the fight itself, carried out entirely in good manners.",
    [
      ["venom", "How much poison under the sweetness", [0, 5], "From real kindness (0) to pure poison in a smile (5)."],
      ["weapon", "Their weapon", ["compliments", "gifts", "offers of help", "being more generous", "being busier"], "What they fight with.", U],
      ["rounds", "Rounds of the fight", [1, 10, "rounds", 1], "How many times they trade polite blows."],
      ["crowd", "Does anyone notice", ["no one", "the audience only", "one sharp friend", "the whole room"], "How many people see the fight under the smiles."],
      ["winner", "Who wins", ["the first one", "the second one", "a tie", "someone else entirely"], "Who comes out on top.", U],
      ["snap", "Does the politeness snap", ["never", "once at the end", "it turns into a real fight"], "Whether the good manners finally give way."],
    ],
    [3, "Each polite blow demands a reply, so the fight builds until it breaks or someone wins.", "Shows how good manners can be a weapon.", "We score every round and wait for the next.", "thought", "Have the two mothers at the school bake sale each praise the other's cake more sweetly, each line a little crueler."]);

  c("crossedTalk", "Two talks that cross", "comedy-mix",
    "Two conversations happen side by side, and the lines from one seem to answer the other: a doctor's news next to a wedding plan, a phone call that seems to reply to the room. The editing or the staging braids them together so every line lands twice.",
    [
      ["cross", "How much they cross", [0, 5], "From two separate talks (0) to every line answering the other (5)."],
      ["how", "How we get both", ["two people in one room", "a phone call and the room", "cutting between two places", "a wall between them"], "How the two talks reach us at once.", U],
      ["topics", "How different the topics", ["close", "different", "opposites", "one is a crisis"], "How far apart the two subjects are."],
      ["pace", "How fast they switch", ["slowly", "every few lines", "line by line", "word by word"], "How quickly we jump from one talk to the other."],
      ["aware", "Do the talkers notice", ["no one notices", "one person notices", "they meet at the end"], "Whether the people talking ever see the crossing.", U],
      ["land", "What the crossing does", ["just funny", "makes one line rude", "gives away a secret", "makes a fight worse"], "What the crossed lines do to the story.", U],
    ],
    [2, "When one talk spills into the other, a secret comes out or a fight gets worse.", "Shows how people talk past each other all day.", "We listen to both and wait for the line that fits too well.", "audio", "Cut line by line between the vet telling an owner his dog must lose weight and a wife telling her husband the same thing at dinner."]);

  c("tooManyCooks", "Everyone fixing it at once", "comedy-mix",
    "Something small goes wrong and every person in the room tries to fix it their own way, at the same time: one fetches water, one turns off the power, one reads the instructions out loud, and together they make it much worse.",
    [
      ["worse", "How much worse they make it", [0, 5], "From fixed in a moment (0) to a small problem turned into a disaster (5)."],
      ["helpers", "How many jump in", [2, 10, "people", 1], "How many people try to fix it at once."],
      ["problem", "What went wrong", ["a spill", "a stuck door", "a small fire", "a broken machine", "a sick guest", "a lost thing"], "The small problem at the start.", U],
      ["clash", "How their fixes clash", ["they get in each other's way", "they undo each other", "they argue about how", "they each break something new"], "How the helpers make things worse.", U],
      ["leader", "Is anyone in charge", ["no one", "everyone thinks it's them", "one quiet person", "the one who caused it"], "Who, if anyone, is giving orders.", U],
      ["fixed", "How it gets fixed", ["it doesn't", "by accident", "the quiet one fixes it in one move", "it fixes itself"], "How the problem finally ends.", U],
    ],
    [3, "The bigger mess they make becomes the next problem the story has to deal with.", "Shows how good intentions can pile up into a disaster.", "We watch each new helper and wait for the next thing to break.", "movement", "When the toaster smokes, have four family members rush in with water, a fan and the wrong plug, until the quiet kid just opens a window."]);

  c("genreSwap", "Shot like the wrong kind of film", "comedy-mix",
    "An everyday moment is filmed like a different kind of film: a lost sock like a horror film, a cooking class like a war film, a fight over a parking spot like a western. Close to \"Making something tiny epic\", which blows small things up into grand ones; this one borrows the tools of one exact kind of film (a genre).",
    [
      ["swap", "How fully it copies the other film", [0, 5], "From a hint (0) to every shot, sound and line borrowed (5)."],
      ["genre", "Shot like a", ["horror film", "western", "war film", "nature show", "heist film", "courtroom drama", "sports film"], "The kind of film it borrows from.", U],
      ["moment", "The everyday moment", ["a chore", "a meal", "a small argument", "a game", "a trip to the shop"], "The ordinary thing being filmed so grandly.", U],
      ["tools", "What is borrowed", ["just the music", "music and camera", "music, camera and lines", "everything, even a title card"], "How many of the other film's tools are used."],
      ["length", "How long it lasts", [2, 120, "seconds", 2], "How long the swap runs before we come back to normal."],
      ["snap", "How we come back", ["it just ends", "a hard cut to normal", "someone points it out", "it stays that way"], "How the film returns to its own style.", U],
    ],
    [1, "The swap usually snaps back to normal, so the story picks up where it was.", "Shows how the same moment can feel huge or tiny depending on how it is told.", "We enjoy guessing the next borrowed move.", "visual", "Shoot two kids fighting over the TV remote as a western standoff, with a close-up of each pair of eyes and a whistled tune."]);

  c("farceCollision", "Every problem in one room", "comedy-mix",
    "All the lies, secrets and running problems of the story end up in the same room at the same time: the wife, the lover, the boss and the police all arrive for dinner. Close to \"Chaos in an orderly room\", which measures the disorder; this one is every story thread meeting at once, the big finish of a farce (a comedy of lies, doors and bad timing).",
    [
      ["collide", "How hard the threads collide", [0, 5], "From two problems that brush past (0) to everything crashing together at once (5)."],
      ["threads", "How many problems meet", [2, 8, "problems", 1], "How many separate lies and troubles end up in one room."],
      ["place", "Where they meet", ["a dinner party", "a hotel lobby", "a wedding", "a hospital", "a small apartment"], "The room where it all comes together.", U],
      ["doors", "Ways in and out", [1, 8, "doors", 1], "How many doors, windows and closets the people can use to hide or escape."],
      ["juggler", "Who keeps it from blowing up", ["no one", "the hero", "a servant", "everyone takes turns"], "Who is running around keeping the wrong people apart.", U],
      ["blowUp", "How it ends", ["it holds", "one thing comes out", "everything comes out at once", "it ends in a chase"], "What happens when the juggling stops."],
    ],
    [5, "Every thread pulled into one room forces the story's big reckoning.", "Shows that lies always meet in the end.", "We count the doors and wait for the wrong two people to meet.", "plot", "Bring the ex, the new fiancee and her father to the same hotel lobby, and give the hero three lifts to juggle them in."]);

  c("copycat", "Copying someone, badly", "comedy-mix",
    "One character copies another to fit in or to impress: the same walk, the same order at the cafe, the same laugh, but always a little wrong or a beat late. Close to \"Copying each other's body\", which is two people falling into the same moves without thinking; this one is copying on purpose, and getting it wrong.",
    [
      ["copy", "How much they copy", [0, 5], "From one borrowed habit (0) to a full imitation (5)."],
      ["what", "What they copy", ["the way they walk", "the way they talk", "their clothes", "their order or taste", "their laugh", "their every move"], "Which part of the other person they borrow.", U],
      ["why", "Why they copy", ["to fit in", "to impress", "to mock", "out of love", "without meaning to"], "What makes them do it.", U],
      ["late", "How far behind", ["at the same time", "half a beat late", "a whole beat late", "the next day"], "How long after the other person they do it."],
      ["accuracy", "How well they copy", ["very badly", "roughly", "closely", "perfectly"], "How close the copy gets to the real thing."],
      ["noticed", "Does the other notice", ["never", "they get annoyed", "they start copying back"], "What the copied person does about it.", U],
    ],
    [2, "When the copied one notices, the two are pushed to face each other.", "Shows how much we want to belong.", "We watch both and spot every small difference.", "movement", "Let the new kid copy the cool kid's every move in the lunch line, half a beat late, until the cool kid stops and the new kid walks into him."]);

  /* ---------- suites ---------- */

  S("heard-through-the-wall", "Heard through the wall", "comedy",
    "The wrong person hears half of a private complaint through a thin wall, and plays along to catch the speaker out.",
    [
      { curiosity: "wrongEar", value: 4 },
      { curiosity: "wrongEar", slider: "how", value: "through a wall" },
      { curiosity: "wrongEar", slider: "half", value: "half of it, out of context" },
      { curiosity: "wrongEar", slider: "response", value: "plays along to trap them" },
      { curiosity: "misunderstanding", value: 3, weight: 70 },
    ]);

  S("dinner-with-the-in-laws", "Dinner with the in-laws", "comedy",
    "Meeting the parents: a fumbled hug and handshake at the door, perfect manners at the table while the strain shows, and the family dog eats the main course.",
    [
      { curiosity: "politeSurface", value: 4 },
      { curiosity: "politeSurface", slider: "event", value: "meeting the parents" },
      { curiosity: "politeSurface", slider: "mask", value: "a tight smile" },
      { curiosity: "fumbledHello", value: 3, weight: 80 },
      { curiosity: "fumbledHello", slider: "first", value: "a hug", weight: 80 },
      { curiosity: "fumbledHello", slider: "second", value: "a handshake", weight: 80 },
      { curiosity: "sceneStealer", value: 3, weight: 70 },
      { curiosity: "sceneStealer", slider: "animal", value: "a dog", weight: 70 },
      { curiosity: "sceneStealer", slider: "does", value: "eats something", weight: 70 },
    ]);

  S("cool-act-collapse", "The cool act collapses", "comedy",
    "Sunglasses, a lean and a smooth line for a crush, a loud fail in front of her, and a long walk away.",
    [
      { curiosity: "tryingTooHard", value: 5 },
      { curiosity: "tryingTooHard", slider: "move", value: "sunglasses" },
      { curiosity: "tryingTooHard", slider: "audience", value: "a crush" },
      { curiosity: "tryingTooHard", slider: "cracks", value: "a loud fail" },
      { curiosity: "tryingTooHard", slider: "seen", value: "the one they wanted to impress" },
      { curiosity: "walkOfShame", value: 3, weight: 70 },
      { curiosity: "walkOfShame", slider: "silence", value: "dead silence", weight: 60 },
    ]);

  S("best-laid-plans", "Best laid plans", "comedy",
    "A whiteboard plan with every step, a collapse at step one, a new longer plan, and everyone fixing it at once.",
    [
      { curiosity: "planFailsFirst", value: 5 },
      { curiosity: "planFailsFirst", slider: "shown", value: "a whiteboard" },
      { curiosity: "planFailsFirst", slider: "steps", value: 10 },
      { curiosity: "planFailsFirst", slider: "failsAt", value: "at step one" },
      { curiosity: "planFailsFirst", slider: "after", value: "start a new, longer plan" },
      { curiosity: "tooManyCooks", value: 3, weight: 60 },
    ], { also: ["comedy-mix"] });

  S("cardboard-and-string", "Cardboard and string", "comedy",
    "A full copy of an old low-budget film: the ship hangs on a string, the actors take it dead seriously, and the music copies the old horror films.",
    [
      { curiosity: "cheapEffect", value: 5 },
      { curiosity: "cheapEffect", slider: "flaw", value: "a visible string" },
      { curiosity: "cheapEffect", slider: "played", value: "dead serious" },
      { curiosity: "cheapEffect", slider: "homage", value: "a full copy of an old style" },
      { curiosity: "parody", value: "perfect imitation", weight: 60 },
    ]);

  S("one-for-the-fans", "One for the second watch", "comedy",
    "Jokes hidden in the background that only make sense once you know the ending, with sharp-eyed sight gags you can blink and miss.",
    [
      { curiosity: "rewatchGag", value: 4 },
      { curiosity: "rewatchGag", slider: "kind", value: "a background detail" },
      { curiosity: "rewatchGag", slider: "needs", value: "the ending" },
      { curiosity: "rewatchGag", slider: "count", value: 8 },
      { curiosity: "visualGag", value: "background", weight: 70 },
      { curiosity: "visualGag", slider: "subtlety", value: "blink and miss it", weight: 70 },
    ]);

  S("the-proposal-that-keeps-failing", "The proposal that keeps failing", "comedy",
    "He kneels to propose three times and a waiter cuts in every time, without a clue, until the moment turns into something better.",
    [
      { curiosity: "worstMoment", value: 5 },
      { curiosity: "worstMoment", slider: "moment", value: "a proposal" },
      { curiosity: "worstMoment", slider: "by", value: "a waiter" },
      { curiosity: "worstMoment", slider: "tries", value: 3 },
      { curiosity: "worstMoment", slider: "blame", value: "has no idea" },
      { curiosity: "worstMoment", slider: "mood", value: "it turns into something better", weight: 70 },
      { curiosity: "runningGag", value: 3, weight: 50 },
    ]);

  S("crash-in-the-next-room", "The crash in the next room", "comedy",
    "A long chain of crashes out of sight, everyone in the room wincing at each one, and the person walking back in perfectly calm.",
    [
      { curiosity: "offscreenGag", value: 5 },
      { curiosity: "offscreenGag", slider: "sound", value: "a long chain of sounds" },
      { curiosity: "offscreenGag", slider: "faces", value: "everyone in the room" },
      { curiosity: "offscreenGag", slider: "flinch", value: "a wince at each sound" },
      { curiosity: "offscreenGag", slider: "after", value: "the person walks back in calm" },
      { curiosity: "understatement", value: "huge treated as tiny", weight: 60 },
    ]);

  S("always-a-beat-behind", "Always a beat behind", "comedy",
    "One very literal person who laughs much too late at every joke, and finally makes the best joke at the end.",
    [
      { curiosity: "neverGetsIt", value: 4 },
      { curiosity: "neverGetsIt", slider: "shows", value: "laughs much too late" },
      { curiosity: "neverGetsIt", slider: "finally", value: "they make the best joke at the end" },
      { curiosity: "literalMinded", value: 3, weight: 70 },
      { curiosity: "literalMinded", slider: "who", value: "a very rigid person", weight: 70 },
    ]);

  S("the-wrong-man", "The wrong man", "comedy-mix",
    "An ordinary man is taken for a spy, gives up explaining, and every problem he picks up meets in one hotel lobby until the real spy walks in.",
    [
      { curiosity: "mistakenIdentity", value: 5 },
      { curiosity: "mistakenIdentity", slider: "takenFor", value: "a criminal or spy" },
      { curiosity: "mistakenIdentity", slider: "plays", value: "give up explaining" },
      { curiosity: "mistakenIdentity", slider: "truth", value: "the real one turns up" },
      { curiosity: "farceCollision", value: 4, weight: 80 },
      { curiosity: "farceCollision", slider: "place", value: "a hotel lobby", weight: 80 },
      { curiosity: "nearMiss", value: "one second apart", weight: 60 },
    ], { also: ["comedy"] });

  S("sweet-poison", "Sweet poison", "comedy-mix",
    "Two rivals at a dinner party trade compliments that sting, round after round, while everyone keeps perfect manners.",
    [
      { curiosity: "politeWar", value: 5 },
      { curiosity: "politeWar", slider: "weapon", value: "compliments" },
      { curiosity: "politeWar", slider: "rounds", value: 6 },
      { curiosity: "politeWar", slider: "crowd", value: "one sharp friend" },
      { curiosity: "politeSurface", value: 4, weight: 70 },
      { curiosity: "politeSurface", slider: "event", value: "a dinner party", weight: 70 },
    ]);

  S("too-many-hands", "Too many hands", "comedy-mix",
    "A small kitchen fire, six helpers who each break something new, and the quiet one who fixes it in one move.",
    [
      { curiosity: "tooManyCooks", value: 5 },
      { curiosity: "tooManyCooks", slider: "problem", value: "a small fire" },
      { curiosity: "tooManyCooks", slider: "helpers", value: 6 },
      { curiosity: "tooManyCooks", slider: "clash", value: "they each break something new" },
      { curiosity: "tooManyCooks", slider: "fixed", value: "the quiet one fixes it in one move" },
      { curiosity: "chaosInRoom", value: "mostly chaos", weight: 60 },
    ]);

  S("living-room-western", "A western in the living room", "comedy-mix",
    "Two kids fight over the remote shot like a western, music, close-ups and all, and someone copies the hero's swagger half a beat late.",
    [
      { curiosity: "genreSwap", value: 5 },
      { curiosity: "genreSwap", slider: "genre", value: "western" },
      { curiosity: "genreSwap", slider: "moment", value: "a small argument" },
      { curiosity: "genreSwap", slider: "tools", value: "music, camera and lines" },
      { curiosity: "genreSwap", slider: "snap", value: "a hard cut to normal" },
      { curiosity: "copycat", value: 2, weight: 60 },
      { curiosity: "copycat", slider: "late", value: "half a beat late", weight: 60 },
    ]);

  S("crossed-lines-dinner", "Two tables, one conversation", "comedy-mix",
    "We cut line by line between two tables, and each answer seems to reply to the other table, until one crossed line gives away a secret.",
    [
      { curiosity: "crossedTalk", value: 5 },
      { curiosity: "crossedTalk", slider: "how", value: "cutting between two places" },
      { curiosity: "crossedTalk", slider: "pace", value: "line by line" },
      { curiosity: "crossedTalk", slider: "land", value: "gives away a secret" },
      { curiosity: "misunderstanding", value: 2, weight: 50 },
    ]);

  /* ---------- proximities ---------- */

  P("overheard-mix-up", "When the wrong person overhears more, the mix-up grows", "comedy",
    "When the wrong person hears something worse, a misunderstanding grows within 2 beats.",
    { curiosity: "wrongEar", change: "rises" }, { curiosity: "misunderstanding", change: "rises" }, 2);
  P("overheard-spread", "When the one who overheard tells everyone, more of the room is in on it", "comedy",
    "When the listener spreads what they heard, more people in the room know the secret within 2 beats.",
    { curiosity: "wrongEar", slider: "response", is: "spreads it to everyone" }, { curiosity: "whoKnows", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("speaker-turns-around-cringe", "When the speaker turns around and sees who heard, the cringe rises", "comedy",
    "When the speaker finds the wrong person standing right there, the cringe rises within a beat.",
    { curiosity: "wrongEar", slider: "speakerKnows", is: "the moment they turn around" }, { curiosity: "cringe", change: "rises" }, 1);
  P("cool-act-collapse-humiliation", "When the cool act collapses completely, someone is humiliated", "comedy",
    "When the effort to look cool ends in a total collapse, humiliation rises within a beat.",
    { curiosity: "tryingTooHard", slider: "cracks", is: "a total collapse" }, { curiosity: "humiliation", change: "rises" }, 1);
  P("trying-hard-copies", "When someone tries harder to be cool, they start copying the cool one", "comedy",
    "When the effort to look cool grows, copying someone who really is cool follows within 3 beats.",
    { curiosity: "tryingTooHard", change: "rises" }, { curiosity: "copycat", change: "rises" }, 3, { also: ["comedy-mix"] });
  P("humiliation-long-walk", "When the humiliation is bigger, the walk out gets longer", "comedy",
    "When someone is humiliated more, the walk away from it stretches within 2 beats.",
    { curiosity: "humiliation", change: "rises" }, { curiosity: "walkOfShame", change: "rises" }, 2);
  P("long-walk-shame", "When the walk of shame gets longer, shame gets heavier", "comedy",
    "When the walk out lasts longer, the character's shame grows within a beat.",
    { curiosity: "walkOfShame", change: "rises" }, { curiosity: "shame", change: "rises" }, 1, { also: ["emotion"] });
  P("slow-clap-cringe", "When one person claps during the walk out, the cringe rises", "comedy",
    "When a single slow clap follows the walk of shame, the cringe rises within a beat.",
    { curiosity: "walkOfShame", slider: "silence", is: "one person clapping" }, { curiosity: "cringe", change: "rises" }, 1);
  P("literal-acted-out-slapstick", "When the words are acted out in full, the slapstick gets bigger", "comedy",
    "When someone acts out a saying exactly as worded, the physical comedy grows within a beat.",
    { curiosity: "literalMinded", slider: "acted", is: "act it out in full, at length" }, { curiosity: "physicalComedy", change: "rises" }, 1);
  P("literal-newcomer-out-of-place", "When the literal one is new to the language, they feel out of place", "comedy",
    "When someone new to the language takes words literally, being out of place in a strange world grows within 2 beats.",
    { curiosity: "literalMinded", slider: "who", is: "someone new to the language" }, { curiosity: "fishOutOfWater", change: "rises" }, 2);
  P("plan-fails-complication", "When the careful plan fails at once, things get worse", "comedy",
    "When more preparation ends in an instant failure, a new complication follows within a beat.",
    { curiosity: "planFailsFirst", change: "rises" }, { curiosity: "complication", change: "rises" }, 1, { also: ["plot"] });
  P("new-plan-running-gag", "When every failed plan brings a longer one, it becomes a running gag", "comedy",
    "When each broken plan is replaced by a new and longer one, a running gag builds within 4 beats.",
    { curiosity: "planFailsFirst", slider: "after", is: "start a new, longer plan" }, { curiosity: "runningGag", change: "rises" }, 4);
  P("improvised-worse-everyone-helps", "When they make it up and make it worse, everyone jumps in to fix it", "comedy",
    "When the improvised rescue goes wrong, everyone tries to fix it at once within 2 beats.",
    { curiosity: "planFailsFirst", slider: "after", is: "improvise and make it worse" }, { curiosity: "tooManyCooks", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("cheap-effect-absurd", "When the effect looks cheaper, the absurdity grows", "comedy",
    "When the fake thing looks more obviously fake, the absurdity grows within 2 beats.",
    { curiosity: "cheapEffect", change: "rises" }, { curiosity: "absurdity", change: "rises" }, 2);
  P("old-style-copy-parody", "When the cheap effect copies an old style in full, the parody shows", "comedy",
    "When the effects copy an old low-budget style all the way, a parody of those films grows within 2 beats.",
    { curiosity: "cheapEffect", slider: "homage", is: "a full copy of an old style" }, { curiosity: "parody", change: "rises" }, 2);
  P("hidden-joke-long-payoff", "When the joke is hidden deeper, the payoff comes from further away", "comedy",
    "When a joke is hidden for the second viewing, the distance to its payoff grows within 3 beats.",
    { curiosity: "rewatchGag", change: "rises" }, { curiosity: "payoffDistance", change: "rises" }, 3);
  P("polite-mask-subtext", "When they stay more polite, what they mean slips under the words", "comedy",
    "When the manners hold harder, the gap between what is said and what is meant grows within a beat.",
    { curiosity: "politeSurface", change: "rises" }, { curiosity: "subtext", change: "rises" }, 1, { also: ["emotion"] });
  P("manners-crack-room-stops", "When everyone's manners crack at the end, the room stops dead", "comedy",
    "When the polite surface finally breaks for everyone, everything stops within a beat.",
    { curiosity: "politeSurface", slider: "breaks", is: "everyone at the end" }, { curiosity: "roomStops", change: "rises" }, 1, { also: ["comedy-mix"] });
  P("formal-rules-polite-war", "When the manners must hold, the fight goes polite", "comedy-mix",
    "When the occasion forces everyone to stay polite, rivals fight with good manners instead within 3 beats.",
    { curiosity: "politeSurface", change: "rises" }, { curiosity: "politeWar", change: "rises" }, 3, { also: ["comedy"] });
  P("egos-clash-politely", "When egos clash at a formal table, the war goes polite", "comedy-mix",
    "When two egos clash where manners matter, a war fought politely follows within 2 beats.",
    { curiosity: "egoClash", change: "rises" }, { curiosity: "politeWar", change: "rises" }, 2);
  P("polite-war-real-fight", "When the polite war turns into a real fight, chaos fills the room", "comedy-mix",
    "When the sweet words give way to a real fight, chaos in the room rises within a beat.",
    { curiosity: "politeWar", slider: "snap", is: "it turns into a real fight" }, { curiosity: "chaosInRoom", change: "rises" }, 1);
  P("never-gets-it-odd-one-out", "When one person never gets the joke, they stop fitting the group", "comedy",
    "When someone keeps missing every joke, the sense that they do not fit the group grows within 2 beats.",
    { curiosity: "neverGetsIt", change: "rises" }, { curiosity: "oddOneOut", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("late-joke-topper", "When the one who never got it makes the best joke, it tops them all", "comedy",
    "When the person who missed every joke makes the best one at the end, a topper lands within a beat.",
    { curiosity: "neverGetsIt", slider: "finally", is: "they make the best joke at the end" }, { curiosity: "topper", change: "rises" }, 1);
  P("unseen-crash-reactions", "When the crash stays out of sight, the faces carry the joke", "comedy",
    "When we only hear the gag, the reactions on screen grow within a beat.",
    { curiosity: "offscreenGag", change: "rises" }, { curiosity: "comicReaction", change: "rises" }, 1);
  P("calm-return-understatement", "When they walk back in calm after the crash, the understatement lands", "comedy",
    "When the person who caused the noise walks back in as if nothing happened, understatement rises within a beat.",
    { curiosity: "offscreenGag", slider: "after", is: "the person walks back in calm" }, { curiosity: "understatement", change: "rises" }, 1);
  P("interruptions-running-gag", "When the big moment keeps getting cut off, it becomes a running gag", "comedy",
    "When the interruptions come at worse and worse times, a running gag builds within 3 beats.",
    { curiosity: "worstMoment", change: "rises" }, { curiosity: "runningGag", change: "rises" }, 3);
  P("moment-lost-questions", "When the big moment is lost, the question stays open", "comedy",
    "When the interrupted confession or proposal never finishes, the open questions grow within 2 beats.",
    { curiosity: "worstMoment", slider: "mood", is: "it is lost" }, { curiosity: "openQuestions", change: "rises" }, 2, { also: ["plot"] });
  P("playing-along-lie-grows", "When they happily play the wrong person, the lie grows", "comedy",
    "When the one mistaken for someone else plays along, the lie grows within 2 beats.",
    { curiosity: "mistakenIdentity", slider: "plays", is: "happily play along" }, { curiosity: "escalatingLie", change: "rises" }, 2);
  P("mix-up-near-miss", "When the mix-up grows, the real one keeps nearly turning up", "comedy",
    "When the mistaken identity grows, near misses with the real person follow within 3 beats.",
    { curiosity: "mistakenIdentity", change: "rises" }, { curiosity: "nearMiss", change: "rises" }, 3, { also: ["comedy-mix"] });
  P("real-one-arrives-collision", "When the real one turns up, every problem meets in one room", "comedy",
    "When the real person walks in on the impostor, all the threads collide within 2 beats.",
    { curiosity: "mistakenIdentity", slider: "truth", is: "the real one turns up" }, { curiosity: "farceCollision", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("animal-pulls-the-eye", "When the animal steals more of the scene, the eye leaves the people", "comedy",
    "When the animal does more, distraction from the people grows within a beat.",
    { curiosity: "sceneStealer", change: "rises" }, { curiosity: "distraction", change: "rises" }, 1, { also: ["focus"] });
  P("ignore-the-goat-polite", "When the humans pretend not to see the animal, the polite act strains", "comedy",
    "When everyone pretends the animal is not there, keeping up polite appearances grows within a beat.",
    { curiosity: "sceneStealer", slider: "humans", is: "pretend not to notice" }, { curiosity: "politeSurface", change: "rises" }, 1);
  P("fumbled-hello-cringe", "When the greeting fumbles longer, the cringe rises", "comedy",
    "When the hug and the handshake keep missing, the cringe rises within a beat.",
    { curiosity: "fumbledHello", change: "rises" }, { curiosity: "cringe", change: "rises" }, 1);
  P("bumped-heads-slapstick", "When the greeting ends in bumped heads, the slapstick lands", "comedy",
    "When the fumbled hello ends with two heads knocking together, physical comedy rises within a beat.",
    { curiosity: "fumbledHello", slider: "ending", is: "they bump heads" }, { curiosity: "physicalComedy", change: "rises" }, 1);
  P("crossed-talk-mix-up", "When the two talks cross more, misunderstandings grow", "comedy-mix",
    "When lines from one conversation seem to answer the other, a misunderstanding grows within 2 beats.",
    { curiosity: "crossedTalk", change: "rises" }, { curiosity: "misunderstanding", change: "rises" }, 2, { also: ["comedy"] });
  P("crossed-line-secret-out", "When a crossed line gives away a secret, more people know it", "comedy-mix",
    "When one talk spills a secret into the other, more of the room is in on it within a beat.",
    { curiosity: "crossedTalk", slider: "land", is: "gives away a secret" }, { curiosity: "whoKnows", change: "rises" }, 1);
  P("helpers-escalate", "When more helpers make it worse, the trouble escalates", "comedy-mix",
    "When the helpers make the problem worse, the comic escalation climbs within a beat.",
    { curiosity: "tooManyCooks", change: "rises" }, { curiosity: "comicEscalation", change: "rises" }, 1, { also: ["comedy"] });
  P("helpers-break-things-chaos", "When every helper breaks something new, chaos fills the room", "comedy-mix",
    "When each fix breaks something else, chaos in the room rises within a beat.",
    { curiosity: "tooManyCooks", slider: "clash", is: "they each break something new" }, { curiosity: "chaosInRoom", change: "rises" }, 1);
  P("genre-swap-parody", "When the scene copies another kind of film more fully, it becomes a parody", "comedy-mix",
    "When more of another genre's tools are borrowed, parody grows within 2 beats.",
    { curiosity: "genreSwap", change: "rises" }, { curiosity: "parody", change: "rises" }, 2, { also: ["comedy"] });
  P("genre-swap-hard-cut", "When the borrowed style snaps back to normal, a hard comic cut pops it", "comedy-mix",
    "When the swap ends on a hard cut to normal life, the comic edit rises within a beat.",
    { curiosity: "genreSwap", slider: "snap", is: "a hard cut to normal" }, { curiosity: "comicEdit", change: "rises" }, 1, { also: ["comedy"] });
  P("lie-grows-threads-collide", "When the lie keeps growing, every problem heads for one room", "comedy-mix",
    "When the lie grows big enough, all the threads collide in one place within 4 beats.",
    { curiosity: "escalatingLie", change: "rises" }, { curiosity: "farceCollision", change: "rises" }, 4, { also: ["comedy"] });
  P("collision-near-misses", "When more problems meet in one room, the near misses pile up", "comedy-mix",
    "When the threads collide harder, the wrong people nearly meet more often within a beat.",
    { curiosity: "farceCollision", change: "rises" }, { curiosity: "nearMiss", change: "rises" }, 1);
  P("collision-ends-in-chase", "When the farce blows up into a chase, the comic chase begins", "comedy-mix",
    "When the room finally bursts and everyone runs, a chase played for laughs follows within a beat.",
    { curiosity: "farceCollision", slider: "blowUp", is: "it ends in a chase" }, { curiosity: "comicChase", change: "rises" }, 1);
  P("copying-cringe", "When the copying goes further, the cringe rises", "comedy-mix",
    "When one person copies another more and more, the cringe rises within 2 beats.",
    { curiosity: "copycat", change: "rises" }, { curiosity: "cringe", change: "rises" }, 2, { also: ["comedy"] });
  P("copied-back-double-act", "When the copied one starts copying back, a double act is born", "comedy-mix",
    "When the copied person copies the copier back, the two turn into a double act within 2 beats.",
    { curiosity: "copycat", slider: "noticed", is: "they start copying back" }, { curiosity: "doubleAct", change: "rises" }, 2);

  /* ---------- proximity suites ---------- */

  PS("one-overheard-line", "From one overheard line", "comedy",
    "The wrong person overhears, the mix-up grows, they tell the whole room, and the speaker turns around to find them there.",
    ["overheard-mix-up", "overheard-spread", "speaker-turns-around-cringe"], { also: ["comedy-mix"] });
  PS("from-cool-to-the-door", "From cool to the door", "comedy",
    "The effort to look cool turns into copying, the act collapses into humiliation, and the long walk out brings shame and a slow clap.",
    ["trying-hard-copies", "cool-act-collapse-humiliation", "humiliation-long-walk", "long-walk-shame", "slow-clap-cringe"]);
  PS("plan-to-pandemonium", "Plan to pandemonium", "comedy",
    "The careful plan fails at once, the improvised fix makes it worse, everyone jumps in, and every helper breaks something new.",
    ["plan-fails-complication", "improvised-worse-everyone-helps", "helpers-escalate", "helpers-break-things-chaos"], { also: ["comedy-mix"] });
  PS("manners-at-war", "Manners at war", "comedy-mix",
    "Strict manners push the fight underground, the rivals fight politely, the war turns real, and the room stops dead.",
    ["formal-rules-polite-war", "polite-mask-subtext", "polite-war-real-fight", "manners-crack-room-stops"], { also: ["comedy"] });
  PS("wrong-man-to-farce", "From the wrong man to a farce", "comedy-mix",
    "The wrong man plays along, the lie grows, the real one turns up, every problem meets in one room, and it ends in a chase.",
    ["playing-along-lie-grows", "lie-grows-threads-collide", "real-one-arrives-collision", "collision-near-misses", "collision-ends-in-chase"], { also: ["comedy"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
