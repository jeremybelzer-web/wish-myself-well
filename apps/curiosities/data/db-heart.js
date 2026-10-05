/* data/db-heart.js: comedy and emotion, deeper. 28 comedy curiosities (the serious answer to a silly question, the
   button, the joke that falls flat, cartoon rules, corpsing, the record scratch, the comic chase ...) and 23 emotion
   curiosities (empathy, awe, nostalgia, shame, guilt, pride, jealousy, relief, earned tears, grief, betrayal,
   forgiveness, the feeling left when the film ends ...), each with its own graded sliders and a momentum note, and
   each tied into at least one proximity and one suite. Loaded after db-ties.js. Written 2026-10-03 by the database thread. */
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

  /* ---------- Comedy ---------- */
  /* ---------- new comedy curiosities ---------- */

  c("straightAnswer", "Serious answer to a silly question", "comedy",
    "Someone answers a ridiculous question, or a ridiculous situation, with total seriousness, as if it were perfectly normal. The calm answer is the joke.",
    [
      ["seriousness", "How serious the answer is", ["a smirk", "mostly straight", "dead serious", "painfully thorough"], "How straight the answer is played, from a knowing smirk to a careful, earnest reply."],
      ["silliness", "How silly the question is", [0, 5], "How ridiculous the question or situation is to begin with. The bigger the gap, the bigger the laugh."],
      ["detail", "Detail in the answer", ["one word", "a sentence", "a full explanation", "a lecture"], "How much the answer goes on. A long, careful answer to a dumb question is funnier."],
      ["asker", "How the asker takes it", ["satisfied", "confused", "annoyed", "pushes further"], "What the person who asked does with the answer."],
      ["beatBefore", "Pause before answering", [0, 4, "beats"], "How long the answerer waits before replying, as if giving it real thought."],
    ],
    [2, "The answer can slip in real facts or plans while it gets a laugh.", "Shows who takes the world seriously and who does not.", "We lean in to see if the asker will push back.", "thought", "Have the most serious character answer the silliest question in full, without a smile."]);

  c("catchphrase", "Catchphrase", "comedy",
    "A line one character says again and again until the audience starts waiting for it.",
    [
      ["uses", "Times it is said", [1, 10], "How many times the line comes up across the film."],
      ["setUp", "How much the scene sets it up", ["out of nowhere", "a hint", "a clear lead-in", "everyone waits for it"], "How obviously the moment leads up to the line, so we know it is coming."],
      ["twist", "How it changes", ["exact same", "new delivery", "new meaning", "said by someone else"], "Whether each use is the same or changes a little to stay fresh."],
      ["spacing", "Scenes between uses", [1, 20, "scenes"], "How far apart the uses are. Too close wears it out."],
      ["withheld", "Held back when expected", [0, 5], "How often the line is set up and then not said, which can be its own joke."],
      ["delivery", "How it is said", ["muttered", "said plainly", "shouted", "sung"], "How big the delivery is each time."],
    ],
    [1, "Mostly marks the character, but a changed use can signal they have changed.", "Shows a character's habit, and what it means when they finally drop it.", "We wait for the line, which pulls us to the next scene with them.", "audio", "Set up the catchphrase clearly, then have the character stop and not say it."]);

  c("sceneButton", "The button", "comedy",
    "A small final laugh that closes a scene, like a button closing a coat. Usually one short line, look or action right before the cut.",
    [
      ["size", "How big the last laugh is", ["a smile", "a small laugh", "a solid laugh", "the biggest laugh of the scene"], "How big the closing laugh is next to the rest of the scene."],
      ["form", "What the button is", ["a line", "a look", "an action", "a sound", "a cut"], "What carries the last laugh.", { unordered: true }],
      ["length", "Length", [0.5, 4, "seconds", 0.5], "How long the button lasts. Shorter is usually better."],
      ["who", "Who gets it", ["the lead", "the side character", "someone in the background", "an object"], "Who or what lands the final laugh.", { unordered: true }],
      ["cutAfter", "Time before the cut", [0, 3, "beats"], "How quickly the scene cuts away after the button lands."],
    ],
    [1, "Closes the scene cleanly so the next one can start fresh.", "A last small comment on what the scene was about.", "Leaves us smiling and ready for the next scene.", "plot", "End your scene on one short line from the quietest person in the room, then cut at once."]);

  c("comicWant", "Tiny want, huge effort", "comedy",
    "A character wants something small (a parking spot, the last cookie) and chases it with far too much effort, as if their life depended on it.",
    [
      ["effortGap", "Gap between the want and the effort", [0, 5], "How much bigger the effort is than the thing they want."],
      ["want", "What they want", ["a thing", "a seat or a place", "to win an argument", "respect", "to avoid something"], "The small goal they are chasing.", { unordered: true }],
      ["plan", "How much planning", ["no plan", "a simple plan", "an elaborate plan", "a military operation"], "How over-planned the chase is."],
      ["obstacles", "Things in the way", [0, 8], "How many problems block them."],
      ["getsIt", "Do they get it", ["gets it easily", "gets it at a cost", "gets it and it's ruined", "never gets it"], "How the chase ends."],
    ],
    [3, "Gives the scene a clear, simple goal to chase.", "Shows what the character truly cares about, often something bigger hiding behind the small thing.", "We want to see if they get it and what it costs.", "plot", "Give your lead a tiny goal in the scene and let them plan for it like a bank heist."]);

  c("roast", "Insults and roasts", "comedy",
    "Jokes made by mocking someone. A roast is a skilled, funny insult, often traded between friends.",
    [
      ["sting", "How much it stings", [0, 5], "How hurtful the insult is."],
      ["affection", "Love under it", ["pure contempt", "cold", "teasing", "loving"], "How much fondness sits under the mockery."],
      ["target", "Who is mocked", ["themselves", "a friend", "a rival", "someone powerful", "someone weaker"], "Who the insult is aimed at.", { unordered: true }],
      ["comeback", "The comeback", ["none", "a weak one", "an equal one", "a better one"], "How the target answers."],
      ["crowd", "People watching", [0, 20], "How many people see it. More watchers raise the stakes."],
    ],
    [2, "Can start a feud or show who holds power in a group.", "Shows how people show love, or hate, through mockery.", "We wait for the comeback.", "audio", "Have two friends trade insults, then let the quiet one end it with the cruelest, kindest line."]);

  c("parody", "Parody", "comedy",
    "Copying the style of a known film, genre or person closely, then bending it to laugh at it.",
    [
      ["closeness", "How close the copy is", ["a passing nod", "clearly borrowed", "shot for shot", "perfect imitation"], "How exactly the original is copied."],
      ["target", "What is copied", ["a genre", "one film", "a famous person", "an ad", "a kind of online video"], "What the parody aims at.", { unordered: true }],
      ["affection", "Love for the original", ["mocking", "teasing", "loving tribute"], "Whether it sneers at the original or celebrates it."],
      ["knowNeeded", "Need to know the original", [0, 5], "How much the audience must know the original to get the joke."],
      ["bend", "How far it bends", ["barely", "a twist", "fully absurd"], "How far the copy drifts from the original into nonsense."],
    ],
    [1, "Usually stops the plot for a bit, unless the story itself is the parody.", "Comments on the original and what it gets wrong or right.", "We look for the next borrowed detail.", "visual", "Shoot one ordinary moment exactly like a famous action scene, same angles, same music."]);

  c("satire", "Satire", "comedy",
    "Mocking something real in the world, like a company, a habit or people in power, to make a point about it.",
    [
      ["bite", "How sharp it is", [0, 5], "How hard it hits its target."],
      ["target", "What it mocks", ["everyday habits", "an industry", "a group", "politics", "the audience itself"], "The real thing being made fun of.", { unordered: true }],
      ["hidden", "How hidden the point is", ["spelled out", "clear", "under the surface", "easy to miss"], "How openly the film states its point."],
      ["realism", "How real it looks", ["realistic", "heightened", "cartoon"], "How close to the real world the satire is staged."],
      ["lesson", "Whether it offers a fix", ["no answer", "a hint", "a clear message"], "Whether the film suggests what should change."],
    ],
    [3, "The world being mocked often drives the plot and its problems.", "This is the theme, said through laughs.", "We want to see how far the film dares to go.", "thought", "Pick one silly rule from real life and have everyone in the scene follow it with total devotion."]);

  c("metaJoke", "Joke about the film itself", "comedy",
    "The film jokes about being a film: its budget, its genre rules, its own cliches (worn-out habits) or how a story is supposed to go.",
    [
      ["awareness", "How self-aware it is", [0, 5], "How openly the film knows it is a film."],
      ["about", "What it jokes about", ["genre rules", "the budget", "the actors", "the plot", "the audience"], "What part of filmmaking the joke points at.", { unordered: true }],
      ["who", "Who makes the joke", ["a character", "the narrator", "on-screen text", "the edit"], "Who or what delivers it.", { unordered: true }],
      ["frequency", "How often", ["once", "now and then", "a running thread", "constant"], "How often the film winks at itself."],
      ["breaksWorld", "Damage to the story world", ["stays inside the story", "bends it", "shatters it"], "How much the joke breaks the story's spell."],
    ],
    [1, "Usually pauses the plot, but can skip boring parts with a wink.", "Comments on stories and how we watch them.", "We wonder what rule it will break next.", "thought", "Have a character complain that this is exactly where the hero always gets a phone call, then the phone rings."]);

  c("jokeBombs", "The joke that falls flat", "comedy",
    "A character tells a joke in the story and nobody laughs. The silence is the real joke for us.",
    [
      ["flatness", "How flat it falls", ["a weak chuckle", "polite smiles", "nothing", "open disgust"], "How badly the room takes it."],
      ["confidence", "Teller's confidence", [0, 5], "How sure the teller was that it would kill. Higher is funnier."],
      ["recovery", "What the teller does next", ["drops it", "explains it", "tries again", "doubles down"], "How the teller handles the failure."],
      ["silence", "Silence after", [0, 6, "seconds"], "How long the quiet lasts after the joke dies."],
      ["laterLands", "Does it land later", ["never", "someone laughs late", "it pays off later"], "Whether the joke gets a second life."],
    ],
    [1, "Can show a character trying too hard to fit in.", "Shows the gap between how we see ourselves and how others see us.", "We squirm and wait to see how they get out of it.", "audio", "Let the boss tell a terrible joke, then hold on the silent room for three full seconds."]);

  c("roomStops", "Everything stops", "comedy-mix",
    "After a shocking line or act, the whole room stops: the music cuts out (sometimes with a record-scratch sound), people freeze and turn to look.",
    [
      ["stop", "How hard it stops", ["a pause", "heads turn", "everything freezes", "dead silence and stares"], "How completely the room stops."],
      ["sound", "What the sound does", ["just quiet", "music fades", "music cut dead", "record scratch"], "How the sound marks the stop."],
      ["heads", "People who turn", [0, 30], "How many people turn to stare."],
      ["hold", "How long it holds", [0, 6, "seconds"], "How long everyone stays frozen."],
      ["restart", "How it restarts", ["slowly", "all at once", "someone breaks it with a line"], "How the room comes back to life.", { unordered: true }],
    ],
    [2, "Marks a moment the story cannot take back.", "Shows the rules of a group by showing what breaks them.", "We hold our breath with the room.", "audio", "When the wrong thing is said at the party, cut the music dead and let every head turn."],
    { also: ["audio-mix"] });

  c("comicSuspense", "Seeing the gag coming", "comedy",
    "The audience sees the trouble before the character does (the open manhole, the wet paint), and the laugh builds while we wait for it.",
    [
      ["lead", "How long we see it coming", [0, 10, "beats"], "How early we spot the trap before it springs."],
      ["clarity", "How clearly it is shown", ["hinted", "shown once", "shown clearly", "we keep being reminded"], "How obvious the trap is to us."],
      ["nearMisses", "Near escapes first", [0, 4], "How many times the character almost hits it before they do."],
      ["payoff", "How it pays off", ["it happens as expected", "it happens worse", "it happens to someone else", "it never happens"], "What finally happens.", { unordered: true }],
      ["framing", "How it is framed", ["close on the person", "both in frame", "wide on everything"], "Whether we see the person and the trap together."],
    ],
    [2, "Builds a small bit of suspense inside a scene.", "Shows a character's blindness to what is right in front of them.", "We cannot look away until it happens.", "visual", "Show the banana peel early, then let the character walk past it twice before the fall."]);

  c("improvFeel", "Made up on the spot", "comedy",
    "The talk feels improvised (made up by the actors as they go): loose, overlapping, with stumbles and little side jokes.",
    [
      ["looseness", "How loose it feels", [0, 5], "How unscripted the scene feels."],
      ["overlap", "Talking over each other", ["none", "a little", "a lot", "constant"], "How much the lines run over each other."],
      ["tangents", "Side jokes", [0, 6], "How many little jokes wander off the point."],
      ["stumbles", "Stumbles and restarts", [0, 5], "How often lines trip and start again, like real speech."],
      ["takes", "Versions tried", ["one take", "a few versions", "a pile of alternates"], "How many different versions of a joke line were tried and then picked from in the edit."],
    ],
    [0, "Usually adds texture more than plot.", "Makes the people feel real and close.", "We feel we are eavesdropping on real people.", "audio", "Let the actors run one extra minute after the scripted lines end and keep the best of it."]);

  c("cartoonLogic", "Cartoon rules", "comedy",
    "The world follows cartoon rules: you hang in the air until you look down, you bounce back from a crash, a painted tunnel actually works.",
    [
      ["bend", "How far real physics bends", [0, 5], "How far the world breaks normal rules."],
      ["recovery", "How fast hurts heal", ["real time", "a scene later", "next shot", "instantly"], "How quickly characters are fine after a crash."],
      ["consistency", "How steady the rules are", ["random", "loose", "follows its own rules", "strict rules"], "Whether the cartoon rules stay the same all film."],
      ["awareness", "Characters know the rules", ["no idea", "sometimes", "they use them"], "Whether characters can use the rules on purpose."],
      ["delay", "Gravity delay", [0, 4, "seconds"], "How long someone hangs in the air before falling."],
    ],
    [1, "Lets anything happen without real harm, so the story can stay light.", "Shows a world where pain does not stick.", "We wonder which rule will bend next.", "movement", "Let a character run off a ledge and keep running until they look down."],
    { also: ["character-motion"] });

  c("comicMontage", "Comic montage", "comedy-mix",
    "A quick string of short shots, often set to music, played for laughs: failed attempts, a makeover, training that keeps going wrong.",
    [
      ["shots", "Number of shots", [3, 30], "How many short shots make up the montage."],
      ["kind", "What it shows", ["failed attempts", "training", "a makeover", "time passing", "a spree"], "What the montage is about.", { unordered: true }],
      ["escalates", "Builds from shot to shot", [0, 5], "How much each shot tops the last."],
      ["music", "Music under it", ["none", "a quiet tune", "an upbeat song", "a far too epic song"], "How the music plays it."],
      ["shotLength", "Shot length", [0.5, 4, "seconds", 0.5], "How long each shot stays on screen."],
      ["ending", "How it ends", ["it worked", "it didn't", "worse than before", "a surprise"], "Where the montage lands.", { unordered: true }],
    ],
    [3, "Squeezes a lot of story time into a minute.", "Shows effort, failure and change in one quick sweep.", "We want to see the last shot.", "visual", "Cut together six failed tries at the same thing, each one worse, and end on the one that works by accident."],
    { also: ["speed"] });

  c("laughsToTears", "Funny to sad switch", "comedy",
    "A scene shifts from laughs to real sadness, or back, so the joke suddenly hurts or the tears get a laugh.",
    [
      ["direction", "Which way it turns", ["laugh to tears", "back and forth", "tears to laugh"], "Which way the mood turns.", { unordered: true }],
      ["speed", "How sudden", ["gentle", "a few beats", "one line", "instant"], "How fast the switch happens."],
      ["depth", "How sad it gets", [0, 5], "How deep the sad part goes."],
      ["bridge", "What carries the switch", ["a line", "a look", "an object", "music", "silence"], "What turns the mood.", { unordered: true }],
      ["returnLaugh", "When the laugh comes back", ["never", "much later", "a beat later", "right away"], "Whether and when the funny returns."],
    ],
    [3, "Often marks a turning point where the real problem shows.", "Shows that the funny and the painful sit side by side.", "We feel caught off guard and want to know what comes next.", "thought", "Let a running joke land one last time, then have the person laughing go quiet in the middle of it."]);

  c("selfMockery", "Making fun of yourself", "comedy",
    "A character jokes about their own flaws, looks or failures, to cope, to charm, or to hide pain.",
    [
      ["harshness", "How harsh", [0, 5], "How hard they go on themselves."],
      ["purpose", "Why they do it", ["to charm", "to get there first", "to hide hurt", "because it's true"], "What the self-mockery is for.", { unordered: true }],
      ["others", "How others react", ["laugh along", "awkward", "object", "agree too fast"], "What the people around them do.", { unordered: true }],
      ["honesty", "Truth under it", [0, 5], "How much real truth hides in the joke."],
      ["frequency", "How often", ["once", "now and then", "their habit"], "Whether this is a one-off or how they always talk."],
    ],
    [1, "Can hint at a wound the story will open later.", "Shows how people protect themselves with humor.", "We sense something real under the joke and want to know it.", "thought", "Have your lead make fun of themselves, and have their friend agree a little too fast."]);

  c("punchingBag", "The punching bag", "comedy-mix",
    "One character keeps getting the worst of every joke: hit, mocked, left out. The others, and the world, keep piling on.",
    [
      ["losses", "How often they lose", [0, 10], "How many times they get the worst of it."],
      ["sympathy", "How much we feel for them", [0, 5], "How much the audience sides with them."],
      ["who", "Who piles on", ["the world", "one bully", "the whole group"], "Where the punishment comes from.", { unordered: true }],
      ["aware", "How they take it", ["oblivious", "resigned", "fights back"], "Whether they notice and how they respond."],
      ["turn", "Do they get a win", ["never", "a small win", "a big win at the end"], "Whether they finally come out on top."],
    ],
    [2, "Their eventual win, or failure, can become a story of its own.", "Shows how groups pick on the weakest member.", "We root for them to finally win.", "plot", "Let the same character get hit by the door three times, then let them be the one who saves the day."]);

  c("mockEpic", "Making something tiny epic", "comedy-mix",
    "A small thing (a board game, a lost sock) is shot and scored like a grand battle: slow motion, huge music, heroic camera angles.",
    [
      ["gap", "Gap between subject and style", [0, 5], "How tiny the subject is next to how grand the style is."],
      ["tools", "Main tool", ["music", "slow motion", "low heroic angles", "a serious narrator", "all of them"], "What makes it feel epic.", { unordered: true }],
      ["played", "How straight it is played", ["winking", "mostly straight", "dead straight"], "Whether the film lets on that it knows it is silly."],
      ["length", "How long it runs", [1, 60, "seconds"], "How long the epic treatment lasts."],
      ["puncture", "How it ends", ["holds", "small letdown", "hard cut to reality"], "How the bubble pops."],
    ],
    [1, "Usually a set piece more than a plot step.", "Shows how big small things feel to the people inside them.", "We wait for the bubble to burst.", "visual", "Shoot the last slice of pizza being grabbed in slow motion with a choir, then cut to it falling on the floor."],
    { also: ["music"] });

  c("badDisguise", "The bad disguise", "comedy",
    "A character hides who they are with a disguise or act that is obviously fake, and yet it somehow works, or nearly does.",
    [
      ["badness", "How bad the disguise is", [0, 5], "How obviously fake it looks to us."],
      ["fooled", "Who is fooled", ["nobody", "a few", "almost everyone", "everyone"], "How many people fall for it."],
      ["kind", "Kind of disguise", ["costume", "fake voice", "fake name", "pretending to have a job", "all of it"], "What the disguise is.", { unordered: true }],
      ["slips", "Slips", [0, 6], "How many times the act nearly falls apart."],
      ["unmasked", "How it is unmasked", ["never", "by accident", "by choice", "in public"], "How the truth comes out.", { unordered: true }],
    ],
    [3, "Lets a character into a place they should not be, which drives the plot.", "Shows how little people really look at each other.", "We wait for the moment the mustache falls off.", "visual", "Give the disguise one detail that keeps slipping, like a mustache that slides a little more each scene."]);

  c("comicChase", "Chase played for laughs", "comedy-mix",
    "A chase where the fun is in the mishaps along the way: obstacles, wrong turns, people and things knocked over.",
    [
      ["mishaps", "Mishaps along the way", [0, 10], "How many things go wrong during the chase."],
      ["speed", "How fast", ["a slow shuffle", "a jog", "a sprint", "cartoon fast"], "How fast the chase moves."],
      ["obstacles", "Things in the way", ["none", "a few", "everything in the way"], "How cluttered the path is."],
      ["framing", "How it is framed", ["close", "medium", "wide"], "How much of the chase we see at once. Wide shows the mishaps best."],
      ["loops", "Running in circles", [0, 5], "How often the chase loops back on itself."],
      ["ending", "How it ends", ["caught", "escape", "both fall", "they forget why they ran"], "How the chase finishes.", { unordered: true }],
    ],
    [3, "Moves people from one place to the next with energy.", "Shows desperation, made silly.", "We want to see what gets knocked over next.", "movement", "Put a fruit stand, a wedding and a wet floor on the chase route and let them hit all three."],
    { also: ["character-motion"] });

  c("nearMiss", "The near miss", "comedy-mix",
    "Two people who must not meet keep just missing each other: one leaves by one door as the other comes in by another.",
    [
      ["closeness", "How close they come", ["rooms apart", "same room, unseen", "one second apart", "a hair's breadth"], "How near they get to bumping into each other."],
      ["count", "Number of near misses", [1, 8], "How many times they almost meet."],
      ["doors", "Doors and hiding places", [0, 8], "How many ways in, out and to hide there are."],
      ["audienceSees", "We see both sides", ["no", "sometimes", "always"], "Whether we see both people at once, so we know how close it is."],
      ["caught", "Do they finally meet", ["never", "finally", "in the worst moment"], "How the near misses end."],
    ],
    [3, "Keeps a secret alive, which keeps the plot running.", "Shows how close disaster always is.", "We hold our breath at every door.", "movement", "Give the set three doors and let one person leave as the other enters, three times in a row."],
    { also: ["placement"] });

  c("tagScene", "The tag scene", "comedy",
    "A short extra scene after the main action or story ends (sometimes after the credits) that gives one last joke.",
    [
      ["length", "Length", [5, 90, "seconds"], "How long the tag runs."],
      ["link", "Link to the story", ["unrelated", "a side joke", "a callback", "sets up what's next"], "How it connects to what came before."],
      ["place", "Where it sits", ["end of a scene", "end of an act", "end of the film", "after the credits"], "Where in the film it appears."],
      ["size", "How big the laugh", ["a smile", "a laugh", "a big laugh"], "How big the last laugh is."],
      ["who", "Who is in it", ["main characters", "side characters", "a forgotten character"], "Who gets the last moment.", { unordered: true }],
    ],
    [1, "Can hint at a sequel or tie off a loose end.", "A last wink about what the story meant.", "Rewards those who stayed, and keeps them talking.", "plot", "After the credits, cut back to the side character still stuck where everyone forgot them."]);

  c("comicScore", "Funny music", "comedy-mix",
    "Music made or picked to make things funnier: bouncy tunes, music that copies every move (called mickey-mousing), or a far too serious song on a silly moment.",
    [
      ["playfulness", "How playful", [0, 5], "How bouncy and light the music is."],
      ["followsMoves", "Music copies the action", ["not at all", "now and then", "every step"], "How closely the music hits each movement, like old cartoons."],
      ["wrongness", "How wrong for the moment", ["fits", "a little off", "the opposite"], "How much the music clashes with what we see, on purpose."],
      ["stopsDead", "Stops for a laugh", [0, 5], "How often the music stops suddenly to let a moment land."],
      ["instruments", "Instruments", ["orchestra", "small band", "silly instruments", "one kazoo"], "What plays it.", { unordered: true }],
    ],
    [0, "Colors the scene more than moving it.", "Tells us how seriously to take what we see.", "We hear what is coming before we see it.", "audio", "Play a bouncy tuba under the sneaking-in scene, and have it stop dead when the floor creaks."],
    { also: ["music"] });

  c("comicRamble", "Talking past the point", "comedy",
    "A character keeps talking after they should have stopped: over-explaining, adding details, digging the hole deeper.",
    [
      ["length", "How long they go on", [5, 90, "seconds"], "How long the ramble runs."],
      ["dig", "How deep the hole gets", [0, 5], "How much worse each sentence makes it."],
      ["aware", "Do they know", ["no idea", "realizes halfway", "knows but can't stop"], "Whether they notice they should stop."],
      ["listener", "The listener", ["patient", "confused", "horrified", "walks off"], "How the listener reacts as it goes on."],
      ["stop", "How it stops", ["they trail off", "someone cuts in", "a cut away", "never"], "What finally ends it.", { unordered: true }],
    ],
    [1, "Can spill a secret the character meant to keep.", "Shows nerves and the need to be liked.", "We dread and enjoy each new sentence.", "audio", "Let your character apologize, then keep explaining until the apology becomes an insult."]);

  c("repeatBack", "Saying it back", "comedy",
    "A character repeats an odd line back, flatly or as a question, to show how strange it sounded.",
    [
      ["flatness", "How flat", [0, 5], "How flat and unimpressed the repeat is."],
      ["form", "How it is repeated", ["exact words", "as a question", "one key word", "slowly"], "The shape of the repeat.", { unordered: true }],
      ["repeats", "Times repeated", [1, 4], "How many times the line comes back."],
      ["speaker", "Who says it back", ["the straight one", "the funny one", "a bystander", "the speaker themselves"], "Who does the repeating.", { unordered: true }],
      ["pause", "Pause before", [0, 3, "beats"], "How long they wait before saying it back."],
    ],
    [0, "Holds the scene still for a moment.", "Shows one character judging another's world.", "We wait for the first speaker to defend it.", "audio", "When someone says something strange, have the other person repeat just the oddest word, slowly."]);

  c("narratorGag", "The narrator joke", "comedy-mix",
    "Narration (a voice telling the story) gets laughs: the picture contradicts it, the frame freezes for a 'yes, that's me' introduction, or the narrator argues with a character.",
    [
      ["kind", "Kind of joke", ["picture says otherwise", "freeze frame intro", "narrator comments", "narrator argues back"], "How the narration makes the laugh.", { unordered: true }],
      ["contradiction", "How hard the picture contradicts", [0, 5], "How far what we see is from what the voice says."],
      ["timing", "When it speaks", ["before the moment", "during it", "right after"], "Where the narration falls next to the moment.", { unordered: true }],
      ["tone", "Narrator's tone", ["dry", "warm", "smug", "panicked"], "How the narrator sounds.", { unordered: true }],
      ["uses", "Times it happens", [1, 12], "How many narrator jokes the film has."],
    ],
    [2, "Can skip or squeeze time, or tease what comes later.", "Shows the gap between the story someone tells and what really happened.", "We wonder what else the narrator is lying about.", "audio", "Have the narrator say 'I stayed calm', then cut to them screaming."],
    { also: ["audio-mix"] });

  c("yesAnd", "Everyone plays along", "comedy-mix",
    "One person starts a silly bit and the others join in and build on it instead of stopping it, the way improvisers say 'yes, and'.",
    [
      ["joiners", "How many join", [0, 8], "How many people jump into the bit."],
      ["building", "How much each adds", [0, 5], "How much each person piles on."],
      ["holdout", "Who refuses", ["nobody", "one person", "the one in charge"], "Who stays out of the game."],
      ["length", "How long it runs", [1, 8, "beats"], "How many beats the bit lasts."],
      ["end", "How it ends", ["fizzles", "someone breaks it", "topped by a big final line", "goes too far"], "How the bit stops.", { unordered: true }],
    ],
    [1, "Bonds a group, which can matter later.", "Shows a group that plays together.", "We wait to see how far they will take it.", "audio", "Have one friend start a fake accent at dinner, and let every person at the table join in except the host."]);

  c("corpsing", "Cracking up", "comedy",
    "A performer nearly laughs, or does laugh, mid-scene, breaking the act. Kept in on purpose, it feels loose and warm.",
    [
      ["crack", "How much they crack", ["held perfectly", "a twitch", "a smirk", "laughing out loud"], "How much the performer breaks."],
      ["kept", "Kept in the film", ["cut out", "kept in quietly", "kept as a highlight"], "Whether the edit keeps the crack."],
      ["spreads", "Spreads to others", [0, 5], "How much the laugh spreads to the others in the scene."],
      ["who", "Who cracks", ["the speaker", "the listener", "everyone"], "Who breaks first."],
      ["recover", "Time to recover", [0, 5, "seconds"], "How long before they get back in character."],
    ],
    [0, "Stops the story for a moment of shared fun.", "Shows warmth between the people making the film.", "We feel let in on something private.", "visual", "Keep the take where the listener almost laughs and has to look away."]);

  /* ---------- suites ---------- */

  S("spoof-movie", "Spoof movie", "comedy",
    "Copies a famous style closely, winks at itself, makes small things grand, and uses music that is too big for the moment.",
    [
      { curiosity: "parody", value: "shot for shot" },
      { curiosity: "metaJoke", value: 3 },
      { curiosity: "mockEpic", value: 4 },
      { curiosity: "comicScore", slider: "wrongness", value: "the opposite", weight: 80 },
      { curiosity: "exaggeration", value: 4, weight: 70 },
    ]);

  S("roast-battle", "Roast battle", "comedy",
    "Friends trade skilled insults in front of a crowd, the room freezes at the worst ones, and the best roasters mock themselves first.",
    [
      { curiosity: "roast", value: 4 },
      { curiosity: "roast", slider: "affection", value: "teasing" },
      { curiosity: "roomStops", value: "heads turn", weight: 70 },
      { curiosity: "comicReaction", value: "a look", weight: 60 },
      { curiosity: "selfMockery", value: 3, weight: 60 },
    ]);

  S("door-slamming-farce", "Door-slamming farce", "comedy-mix",
    "People who must not meet keep missing each other by seconds, in bad disguises, telling bigger and bigger lies.",
    [
      { curiosity: "nearMiss", value: "one second apart" },
      { curiosity: "badDisguise", value: 3 },
      { curiosity: "escalatingLie", value: 4 },
      { curiosity: "comicEscalation", value: 4, weight: 80 },
      { curiosity: "chaosInRoom", value: "mostly chaos", weight: 70 },
    ]);

  S("slapstick-chase", "Slapstick chase", "comedy-mix",
    "A chase full of crashes, cartoon rules and music that hits every step, with the trap shown to us before the fall.",
    [
      { curiosity: "comicChase", value: 6 },
      { curiosity: "cartoonLogic", value: 4 },
      { curiosity: "physicalComedy", value: "a fall" },
      { curiosity: "comicScore", slider: "followsMoves", value: "every step", weight: 80 },
      { curiosity: "comicSuspense", value: 5, weight: 70 },
    ]);

  S("the-flop", "The flop", "comedy",
    "A joke dies in the room, everything stops, and the teller makes it worse by explaining.",
    [
      { curiosity: "jokeBombs", value: "nothing" },
      { curiosity: "roomStops", value: "dead silence and stares" },
      { curiosity: "comicRamble", value: 30 },
      { curiosity: "cringe", value: 4 },
      { curiosity: "silence", value: "long", weight: 70 },
    ]);

  S("loose-and-improvised", "Loose and improvised", "comedy",
    "Talk that feels made up on the spot: people talk over each other, everyone joins the bit, and someone almost laughs.",
    [
      { curiosity: "improvFeel", value: 4 },
      { curiosity: "yesAnd", value: 4 },
      { curiosity: "corpsing", value: "a smirk", weight: 70 },
      { curiosity: "comicTiming", slider: "pace", value: "overlapping", weight: 80 },
    ]);

  S("sad-clown", "Sad clown", "comedy",
    "Someone who jokes about themselves and always loses, until the laugh turns into real tears.",
    [
      { curiosity: "laughsToTears", value: "laugh to tears" },
      { curiosity: "selfMockery", value: 4 },
      { curiosity: "punchingBag", slider: "sympathy", value: 4 },
      { curiosity: "mixedFeelings", value: "even", weight: 70 },
      { curiosity: "emoRelease", value: "tears", weight: 60 },
    ]);

  S("sharp-satire", "Sharp satire", "comedy",
    "Mocks something real, played dead straight, with people saying the opposite of what they mean.",
    [
      { curiosity: "satire", value: 4 },
      { curiosity: "straightAnswer", value: "dead serious" },
      { curiosity: "irony", value: "said one thing, meant another" },
      { curiosity: "comedyDevice", slider: "darkness", value: "edgy", weight: 60 },
    ]);

  S("sitcom-habits", "Sitcom habits", "comedy",
    "The shape of a TV sitcom (a show built on a few people and lots of laughs): catchphrases, running gags, a button on every scene and a tag at the end.",
    [
      { curiosity: "catchphrase", value: 4 },
      { curiosity: "sceneButton", value: "a solid laugh" },
      { curiosity: "tagScene", value: 30 },
      { curiosity: "runningGag", value: 4, weight: 80 },
      { curiosity: "laughsPerMinute", value: 6, weight: 70 },
    ]);

  S("petty-quest", "Petty quest", "comedy",
    "A tiny goal chased with huge effort, shown in a montage of failures that keeps getting worse.",
    [
      { curiosity: "comicWant", value: 4 },
      { curiosity: "comicMontage", slider: "kind", value: "failed attempts" },
      { curiosity: "comicEscalation", value: 4 },
      { curiosity: "humiliation", value: 2, weight: 60 },
    ]);

  S("wry-narrator", "Wry narrator", "comedy-mix",
    "A dry voice tells the story while the picture proves it wrong, with freeze frames and quick cuts.",
    [
      { curiosity: "narratorGag", value: "picture says otherwise" },
      { curiosity: "voiceover", value: "running" },
      { curiosity: "freezeFrame", value: "short freeze", weight: 70 },
      { curiosity: "comicEdit", value: 4, weight: 70 },
    ]);

  S("dry-double-act", "Dry double act", "comedy-mix",
    "Two people, one says something silly, the other answers seriously or says it back flat.",
    [
      { curiosity: "repeatBack", value: 4 },
      { curiosity: "straightAnswer", value: "dead serious" },
      { curiosity: "straightMan", value: "unmoved" },
      { curiosity: "doubleAct", slider: "volley", value: 3, weight: 70 },
    ]);

  /* ---------- proximities ---------- */

  P("straight-answer-reaction", "When a silly question gets a dead serious answer, the reactions grow", "comedy",
    "When a silly question gets a dead serious answer, the people around it react more within 2 beats.",
    { curiosity: "straightAnswer", is: "dead serious" }, { curiosity: "comicReaction", change: "rises" }, 2);
  P("lecture-said-back", "When a silly answer turns into a lecture, someone says it back", "comedy",
    "When a silly answer runs long, someone repeats the oddest bit back within 2 beats.",
    { curiosity: "straightAnswer", slider: "detail", is: "a lecture" }, { curiosity: "repeatBack", change: "rises" }, 2);
  P("catchphrase-held-back", "When everyone waits for the catchphrase, holding it back gets the laugh", "comedy",
    "When the scene sets up a catchphrase, not saying it becomes the joke within 2 beats.",
    { curiosity: "catchphrase", slider: "setUp", is: "everyone waits for it" }, { curiosity: "catchphrase", slider: "withheld", change: "rises" }, 2);
  P("catchphrase-sweet-callback", "When the catchphrase comes back with a new meaning, the callback turns sweet", "comedy",
    "When a catchphrase returns meaning something new, it lands as a tender callback within 3 beats.",
    { curiosity: "catchphrase", slider: "twist", is: "new meaning" }, { curiosity: "callback", slider: "mood", is: "sweeter" }, 3);
  P("topper-then-button", "When the topper lands, a button closes the scene", "comedy",
    "When a topper lands, a small final laugh closes the scene within 2 beats.",
    { curiosity: "topper", change: "rises" }, { curiosity: "sceneButton", is: "a small laugh" }, 2);
  P("button-then-cut", "When the button lands, the scene ends on it", "comedy",
    "When a solid button laugh lands, the scene ends on a button joke within 1 beat.",
    { curiosity: "sceneButton", is: "a solid laugh" }, { curiosity: "sceneEnding", is: "button joke" }, 1);
  P("tiny-want-escalates", "When a tiny want meets a huge effort, the trouble escalates", "comedy",
    "When the effort for a small goal grows, the escalation rises within 4 beats.",
    { curiosity: "comicWant", change: "rises" }, { curiosity: "comicEscalation", change: "rises" }, 4);
  P("tiny-want-ruined", "When the tiny want is won and ruined, someone is humiliated", "comedy",
    "When the small prize is won and then ruined, humiliation rises within 2 beats.",
    { curiosity: "comicWant", slider: "getsIt", is: "gets it and it's ruined" }, { curiosity: "humiliation", change: "rises" }, 2);
  P("roast-comeback", "When a roast stings, a better comeback follows", "comedy",
    "When an insult stings more, the target fires back with a better one within 2 beats.",
    { curiosity: "roast", change: "rises" }, { curiosity: "roast", slider: "comeback", is: "a better one" }, 2);
  P("loving-roast-warmth", "When a roast is loving, the warmth between them grows", "comedy",
    "When the insults are full of love, warmth between the two rises within 3 beats.",
    { curiosity: "roast", slider: "affection", is: "loving" }, { curiosity: "warmth", change: "rises" }, 3);
  P("roast-room-stops", "When a roast goes too far, everything stops", "comedy",
    "When an insult stings too much, the room freezes within 1 beat.",
    { curiosity: "roast", slider: "sting", is: 5 }, { curiosity: "roomStops", change: "rises" }, 1);
  P("close-parody-twist", "When a parody copies shot for shot, the twist gets the laugh", "comedy",
    "When a copy is very close, the moment it bends lands harder within 3 beats.",
    { curiosity: "parody", is: "shot for shot" }, { curiosity: "subversion", change: "rises" }, 3);
  P("satire-darkens", "When the satire bites harder, the jokes get darker", "comedy",
    "When the satire sharpens, the darkness of the jokes rises within 4 beats.",
    { curiosity: "satire", change: "rises" }, { curiosity: "comedyDevice", slider: "darkness", change: "rises" }, 4);
  P("meta-talks-to-us", "When the film jokes about itself, a character talks to us", "comedy",
    "When the film winks at being a film, a character turns to the camera within 3 beats.",
    { curiosity: "metaJoke", change: "rises" }, { curiosity: "fourthWall", change: "rises" }, 3);
  P("flop-silence", "When a joke falls flat, the silence stretches", "comedy",
    "When nobody laughs at a joke, a long silence follows within 1 beat.",
    { curiosity: "jokeBombs", is: "nothing" }, { curiosity: "silence", is: "long" }, 1);
  P("flop-explained", "When the teller explains the failed joke, they talk past the point", "comedy",
    "When the teller starts explaining a dead joke, the ramble grows within 2 beats.",
    { curiosity: "jokeBombs", slider: "recovery", is: "explains it" }, { curiosity: "comicRamble", change: "rises" }, 2);
  P("room-stops-scratch", "When the room stops dead, the record scratches", "comedy-mix",
    "When everything freezes and stares, a record-scratch sound marks it within 1 beat.",
    { curiosity: "roomStops", is: "dead silence and stares" }, { curiosity: "musicSting", is: "record scratch" }, 1);
  P("room-stops-cringe", "When the room stops, the cringe rises", "comedy-mix",
    "When the whole room freezes, the awkwardness rises within 2 beats.",
    { curiosity: "roomStops", change: "rises" }, { curiosity: "cringe", change: "rises" }, 2);
  P("seen-coming-bigger-laugh", "When we see the gag coming, the payoff gets a bigger laugh", "comedy",
    "When the trap is shown early, the laugh it gets is bigger within 4 beats.",
    { curiosity: "comicSuspense", change: "rises" }, { curiosity: "laughsPerMinute", slider: "size", is: "big laughs" }, 4);
  P("trap-shown-fall", "When the trap is shown clearly, the fall comes", "comedy",
    "When we have clearly seen the trap, someone falls into it within 6 beats.",
    { curiosity: "comicSuspense", slider: "clarity", is: "shown clearly" }, { curiosity: "physicalComedy", is: "a fall" }, 6);
  P("loose-overlap", "When the scene loosens up, the lines start to overlap", "comedy",
    "When the talk feels more made up on the spot, people talk over each other within 2 beats.",
    { curiosity: "improvFeel", change: "rises" }, { curiosity: "comicTiming", slider: "pace", is: "overlapping" }, 2);
  P("loose-crack-up", "When the scene feels improvised, someone cracks up", "comedy",
    "When the scene gets loose, a performer starts to break within 3 beats.",
    { curiosity: "improvFeel", change: "rises" }, { curiosity: "corpsing", change: "rises" }, 3);
  P("cartoon-no-pain", "When cartoon rules take over, the falls stop hurting", "comedy",
    "When physics bends like a cartoon, the pain of each fall drops within 2 beats.",
    { curiosity: "cartoonLogic", change: "rises" }, { curiosity: "physicalComedy", slider: "pain", change: "drops" }, 2);
  P("montage-on-beat", "When the comic montage starts, the cuts land on the beat", "comedy-mix",
    "When a comic montage begins, the cuts lock to the music within 1 beat.",
    { curiosity: "comicMontage", change: "rises" }, { curiosity: "beatSync", is: "on beats" }, 1);
  P("failure-montage-escalates", "When the montage shows failed attempts, the disaster escalates", "comedy-mix",
    "When the montage is a string of failures, each one bigger, the escalation rises within 4 beats.",
    { curiosity: "comicMontage", slider: "kind", is: "failed attempts" }, { curiosity: "comicEscalation", change: "rises" }, 4);
  P("sad-turn-music-drops", "When a joke turns sad on one line, the music drops away", "comedy",
    "When the mood flips on a single line, the music cuts out within 2 beats.",
    { curiosity: "laughsToTears", slider: "speed", is: "one line" }, { curiosity: "noMusic", change: "rises" }, 2);
  P("tears-to-laugh-release", "When tears turn into a laugh, the release comes through laughing", "comedy",
    "When sadness tips back into a laugh, the built-up feeling is let out as laughter within 3 beats.",
    { curiosity: "laughsToTears", is: "tears to laugh" }, { curiosity: "emoRelease", is: "a laugh" }, 3);
  P("self-mock-hurt", "When self-mockery hides hurt, mixed feelings show", "comedy",
    "When someone jokes about themselves to cover pain, mixed feelings rise within 4 beats.",
    { curiosity: "selfMockery", slider: "purpose", is: "to hide hurt" }, { curiosity: "mixedFeelings", change: "rises" }, 4);
  P("bag-loses-sympathy", "When the punching bag keeps losing, our sympathy grows", "comedy-mix",
    "When the same person keeps getting the worst of it, the audience sides with them more within 6 beats.",
    { curiosity: "punchingBag", change: "rises" }, { curiosity: "punchingBag", slider: "sympathy", change: "rises" }, 6);
  P("bag-wins-release", "When the punching bag finally wins big, the release floods in", "comedy-mix",
    "When the underdog finally wins, a big release of feeling follows within 2 beats.",
    { curiosity: "punchingBag", slider: "turn", is: "a big win at the end" }, { curiosity: "catharsis", change: "rises" }, 2);
  P("epic-slow-motion", "When something tiny is made epic, the picture slows down", "comedy-mix",
    "When a small thing gets the grand treatment, slow motion kicks in within 1 beat.",
    { curiosity: "mockEpic", change: "rises" }, { curiosity: "clipSpeed", is: "very slow" }, 1);
  P("epic-popped", "When the epic fuss cuts hard to reality, a smash cut pops it", "comedy-mix",
    "When the grand moment ends with a hard cut back to reality, smash cuts rise within 1 beat.",
    { curiosity: "mockEpic", slider: "puncture", is: "hard cut to reality" }, { curiosity: "comicEdit", change: "rises" }, 1);
  P("disguise-slips-lie-grows", "When the disguise slips, the lie grows bigger", "comedy",
    "When the bad disguise nearly falls apart, the cover story grows within 2 beats.",
    { curiosity: "badDisguise", slider: "slips", change: "rises" }, { curiosity: "escalatingLie", change: "rises" }, 2);
  P("chase-crashes", "When a comic chase picks up, things crash", "comedy-mix",
    "When the chase gets more mishaps, crashes and hits rise within 2 beats.",
    { curiosity: "comicChase", change: "rises" }, { curiosity: "impacts", change: "rises" }, 2);
  P("near-misses-chaos", "When the near misses pile up, the room falls into chaos", "comedy-mix",
    "When people keep just missing each other, the chaos in the room rises within 4 beats.",
    { curiosity: "nearMiss", slider: "count", change: "rises" }, { curiosity: "chaosInRoom", change: "rises" }, 4);
  P("near-miss-tension", "When two people miss each other by a second, the tension jumps", "comedy-mix",
    "When the near miss is one second apart, tension rises within 1 beat.",
    { curiosity: "nearMiss", is: "one second apart" }, { curiosity: "tensionCurve", change: "rises" }, 1);
  P("tag-brings-callback", "When a tag scene ties back, an old joke returns", "comedy",
    "When the tag scene links to the story, a callback plays within 1 beat.",
    { curiosity: "tagScene", slider: "link", is: "a callback" }, { curiosity: "callback", change: "rises" }, 1);
  P("music-stops-silence-laugh", "When the funny music stops dead, the silence gets the laugh", "comedy-mix",
    "When the music cuts out suddenly, a silent beat lands the joke within 1 beat.",
    { curiosity: "comicScore", slider: "stopsDead", change: "rises" }, { curiosity: "comicSound", slider: "silenceBeat", change: "rises" }, 1);
  P("music-every-step-bigger", "When the music copies every step, the physical comedy gets bigger", "comedy-mix",
    "When the music hits every movement, the physical gags grow within 2 beats.",
    { curiosity: "comicScore", slider: "followsMoves", is: "every step" }, { curiosity: "physicalComedy", change: "rises" }, 2);
  P("ramble-cringe", "When someone talks past the point, the cringe rises", "comedy",
    "When the ramble digs deeper, the awkwardness rises within 2 beats.",
    { curiosity: "comicRamble", change: "rises" }, { curiosity: "cringe", change: "rises" }, 2);
  P("absurd-said-back", "When something absurd is said, someone says it back", "comedy",
    "When the absurdity rises, another character repeats it back flatly within 1 beat.",
    { curiosity: "absurdity", change: "rises" }, { curiosity: "repeatBack", change: "rises" }, 1);
  P("narrator-freeze", "When the narrator jumps in with an intro, the frame freezes", "comedy-mix",
    "When the narrator does a 'yes, that's me' intro, the picture freezes with a title within 1 beat.",
    { curiosity: "narratorGag", is: "freeze frame intro" }, { curiosity: "freezeFrame", is: "freeze with a title" }, 1);
  P("narration-contradicted", "When the voice-over says one thing and the picture shows another, the narrator joke lands", "comedy-mix",
    "When the narration is proven false by the picture, the contradiction joke grows within 1 beat.",
    { curiosity: "voiceover", slider: "truth", is: "the picture says otherwise" }, { curiosity: "narratorGag", slider: "contradiction", change: "rises" }, 1);
  P("bit-grows-absurd", "When everyone plays along, the absurdity grows", "comedy-mix",
    "When more people join the bit, the absurdity rises within 3 beats.",
    { curiosity: "yesAnd", change: "rises" }, { curiosity: "absurdity", change: "rises" }, 3);
  P("crack-up-warmth", "When the performers laugh out loud, the warmth grows", "comedy",
    "When the actors break into real laughter, warmth between them rises within 2 beats.",
    { curiosity: "corpsing", is: "laughing out loud" }, { curiosity: "warmth", change: "rises" }, 2);

  /* ---------- proximity suites ---------- */

  PS("flop-spiral", "The flop spiral", "comedy",
    "A joke dies, the silence stretches, the teller explains it, the ramble makes it worse, and the cringe peaks.",
    ["flop-silence", "flop-explained", "ramble-cringe", "cringe-silence"]);

  PS("petty-quest-chain", "Petty quest to ruin", "comedy",
    "A tiny want meets huge effort, a montage of failures escalates it, the prize is won and ruined, and the humiliation makes everyone cringe.",
    ["tiny-want-escalates", "failure-montage-escalates", "tiny-want-ruined", "humiliation-cringe"]);

  PS("epic-then-popped", "Epic fuss, then popped", "comedy-mix",
    "Something tiny gets the slow-motion hero treatment, a smash cut pops it, a topper follows and a button closes the scene.",
    ["epic-slow-motion", "epic-popped", "laugh-topper", "topper-then-button"]);

  PS("chase-to-crash", "Chase to crash", "comedy-mix",
    "The trap is shown, the music copies every step, the chase picks up, things crash, and cartoon rules mean nobody really gets hurt.",
    ["trap-shown-fall", "music-every-step-bigger", "chase-crashes", "cartoon-no-pain"]);

  PS("roast-night", "Roast night", "comedy",
    "An insult stings, a better comeback answers, one goes too far and the room stops dead, then the love underneath warms things back up.",
    ["roast-comeback", "roast-room-stops", "room-stops-scratch", "loving-roast-warmth"]);

  PS("laugh-then-cry", "Laugh, then cry", "comedy",
    "Self-mockery hides hurt, the joke turns sad on one line, the music drops away, and the tears finally tip back into a laugh.",
    ["self-mock-hurt", "sad-turn-music-drops", "tears-to-laugh-release"]);

  PS("sitcom-scene-shape", "Sitcom scene shape", "comedy",
    "Set up the catchphrase, a joke lands, a topper follows, a button closes the scene, and the tag brings back an old joke.",
    ["catchphrase-held-back", "laugh-topper", "topper-then-button", "button-then-cut", "tag-brings-callback"]);

  PS("farce-at-the-doors", "Farce at the doors", "comedy-mix",
    "Two people just miss each other, tension jumps, the disguise slips and the lie grows, until the near misses tip the room into chaos.",
    ["near-miss-tension", "disguise-slips-lie-grows", "lie-grows", "near-misses-chaos"]);

  /* ---------- Emotion ---------- */
  // ---------- New emotion curiosities ----------
  const U = { unordered: true };

  c("empathy", "Feeling with them", "emotion",
    "How much the audience feels what a character feels, as if standing in their shoes. Close faces, private moments and small struggles we recognise all pull us in.",
    [
      ["level", "How much we feel with them", [0, 5], "0 means we watch from outside; 5 means we feel it in our own chest."],
      ["doorway", "What lets us in", ["their face up close", "hearing their thoughts", "a small kind act", "a struggle we know", "seeing what they lost"], "The thing that opens the door to their feelings.", U],
      ["whose", "Whose shoes we stand in", ["no one", "a side character", "one of the leads", "the main character"], "Which character the scene asks us to feel with."],
      ["timeWithThem", "Time alone with them", [0, 10, "minutes"], "Minutes we spend with them when no one else is around. Private time builds closeness."],
      ["flaw", "Flaws shown", ["none", "a small one", "a real one", "a big one"], "A flaw we recognise makes a character more human and easier to feel for."],
    ],
    [3, "When we feel with a character, every setback to their goal hits harder.", "Shows that understanding someone is the first step to caring about them.", "We keep watching because we need to know they will be all right.", "visual", "Give the lead one quiet moment alone early on, doing something small and kind that nobody sees."]);

  c("sideTaking", "On their side, or against them", "emo-road",
    "Whether the audience likes a character and roots for them, or dislikes them and wants them to fail. It can flip across the story.",
    [
      ["lean", "Where we stand", ["we hate them", "we dislike them", "unsure", "we like them", "we root for them"], "How the audience feels about this character right now."],
      ["reason", "Why we feel that way", ["they are kind", "they are funny", "they are wronged", "they are good at something", "they are cruel", "they are selfish"], "The main reason the audience leans the way it does.", U],
      ["flipped", "Times our side flips", ["never", "once", "more than once"], "How often the audience changes its mind about them over the story."],
      ["flipPoint", "When our mind changes", [0, 100, "% through the story"], "How far through the story the audience switches sides, if it does."],
      ["cost", "Liking them costs us", ["nothing", "a little unease", "real discomfort"], "When we root for someone who does bad things, it can make us uneasy about ourselves."],
    ],
    [3, "Who we root for decides which outcome feels like a win.", "Asks whether good people can do bad things and still deserve our care.", "We watch to see if they will prove us right or wrong.", "plot", "Let a disliked character do one generous thing in secret, then watch how the next scene plays."],
    { also: ["emotion"] });

  c("awe", "Awe", "emotion",
    "The feeling of being small in front of something huge, beautiful or powerful: a mountain, a storm, a cathedral, a genius at work.",
    [
      ["size", "How strong the awe is", [0, 5], "0 is a mild 'oh'; 5 is jaw dropped, unable to speak."],
      ["source", "What causes it", ["nature", "a crowd", "a building or machine", "a person's skill", "something unexplained"], "The thing that inspires the awe.", U],
      ["smallness", "How small they look", ["the same size", "a bit smaller", "tiny", "a speck"], "How small the character looks in the frame next to the awesome thing."],
      ["holdTime", "How long we look", [0, 30, "seconds"], "Seconds the film lets us just look before anyone speaks or cuts."],
      ["sound", "What we hear", ["silence", "a low hum", "rising music", "a full choir or orchestra"], "The sound under the moment of wonder."],
      ["fearMix", "Fear mixed in", [0, 5], "Awe often has a little fear in it. 0 is pure wonder; 5 is wonder that terrifies."],
    ],
    [2, "A moment of awe often shows the size of the world the characters must face.", "Reminds us how small we are, and how big what we care about can be.", "Wonder makes us lean forward to see more of this world.", "visual", "Hold a wide shot of the place for five full seconds with no dialogue before the character reacts."]);

  c("nostalgia", "Nostalgia", "emo-road",
    "A warm ache for the past, often set off by a song, smell, place or old photo. It can belong to the character, the audience, or both.",
    [
      ["strength", "How strong the pull of the past is", [0, 5], "0 is a passing memory; 5 is being swept back in time."],
      ["trigger", "What sets it off", ["a song", "a smell or taste", "a place", "a photo or object", "an old friend"], "The thing that sends them back.", U],
      ["whose", "Whose nostalgia", ["the character's", "the audience's", "both"], "Whether the character remembers, or the film is reminding the audience of their own past."],
      ["sweetness", "Sweet to sad", ["all sweet", "mostly sweet", "bittersweet", "mostly sad"], "How much sadness is mixed into the happy memory."],
      ["look", "How the past looks", ["just like now", "a little softer", "faded and warm", "grainy home video"], "How the memory looks on screen when we see it."],
      ["distance", "How long ago", [0, 60, "years"], "How far back the memory goes."],
    ],
    [2, "Remembering what was lost can push a character to win it back.", "Asks whether the past was really better, or only feels that way now.", "We want to know what happened between then and now.", "audio", "Bring back a song from the opening scene, slightly slower, when the character finds an old photo."],
    { also: ["emotion"] });

  c("longing", "Longing", "emo-road",
    "Wanting something or someone you cannot have, at least not yet. It stretches across scenes and keeps the audience hoping.",
    [
      ["strength", "How strong the longing is", [0, 5], "0 is a mild wish; 5 is an ache that shapes everything they do."],
      ["target", "What they long for", ["a person", "home", "a past self", "a future", "a thing they can't have"], "The object of the longing.", U],
      ["farAway", "How far away it is", ["in the same room", "nearby", "far away", "gone for good"], "How close the thing they want actually is."],
      ["shown", "How it shows", ["hidden", "in the eyes", "in a gesture", "said out loud"], "How openly the longing is shown."],
      ["scenes", "How long it lasts", [0, 30, "scenes"], "How many scenes the longing has been running."],
      ["fulfilled", "Do they get it", ["never", "a taste of it", "partly", "fully"], "Whether the longing is ever answered."],
    ],
    [3, "Longing gives a character a want that can drive the whole plot.", "Wanting can shape a life as much as having.", "We keep watching to see if they will finally get it.", "thought", "Have the character look at the thing they want for one beat too long, then look away when someone notices."]);

  c("shame", "Shame", "emotion",
    "The hot feeling of wanting to disappear because of who you are or what you did, especially when others are watching.",
    [
      ["weight", "How heavy the shame is", [0, 5], "0 is a flush of embarrassment; 5 is wanting the floor to swallow them."],
      ["about", "What it is about", ["their body", "something they did", "where they come from", "a failure", "a secret"], "The source of the shame.", U],
      ["witnesses", "Who sees it", ["no one", "one person", "a few", "everyone"], "How many people are watching when it hits."],
      ["hiding", "How they hide it", ["they don't", "look away", "joke it off", "lash out", "run away"], "What they do to cover the shame.", U],
      ["lingers", "How long it lingers", [0, 10, "scenes"], "How many scenes the shame keeps showing in their behavior."],
      ["shared", "Do we feel it too", ["we pity them", "we wince with them", "we feel it too"], "How much of the shame reaches the audience."],
    ],
    [2, "Shame makes characters hide, lie or run, which twists the plot.", "Explores how much we let others' eyes decide our worth.", "We wait to see if they will face it or keep hiding.", "visual", "Let the character try to laugh it off, then cut to their hands gripping their sleeve."]);

  c("guilt", "Guilt", "emo-road",
    "The weight of having done something wrong. It grows quietly across scenes until it is confessed, punished or made right.",
    [
      ["weight", "How heavy the guilt is", [0, 5], "0 is a twinge; 5 is a weight they carry everywhere."],
      ["deserved", "Is it their fault", ["not their fault", "partly", "fully their fault"], "Whether they really caused the harm."],
      ["known", "Who knows what they did", ["only them", "the audience", "the person they hurt", "everyone"], "How far the truth has spread."],
      ["leaks", "How it leaks out", ["can't sleep", "overly kind", "snaps at others", "avoids someone", "confesses"], "The way the hidden guilt shows in behavior.", U],
      ["scenes", "How long they carry it", [0, 30, "scenes"], "Scenes since the wrong was done."],
      ["amends", "Making it right", ["no attempt", "tries and fails", "partly", "fully"], "How far they get in repairing the harm."],
    ],
    [3, "A guilty secret is a ticking clock: it will come out sooner or later.", "Asks whether we can ever undo what we did.", "We watch for the moment the truth comes out.", "thought", "Have them be strangely generous to the person they wronged, so the audience notices before the other character does."],
    { also: ["emotion"] });

  c("pride", "Pride", "emotion",
    "A glow of satisfaction in yourself or someone you love. Healthy pride warms us; too much can set up a fall.",
    [
      ["level", "How proud", [0, 5], "0 is no pride; 5 is chest out, glowing."],
      ["kind", "What kind of pride", ["quiet pride", "glowing", "showing off", "arrogance"], "From private satisfaction to looking down on others."],
      ["inWhom", "Proud of what", ["in themselves", "in a child", "in a team", "in their work", "in where they come from"], "What the pride is about.", U],
      ["seenBy", "Who sees it", ["no one", "one person", "a crowd"], "How many people witness the proud moment."],
      ["earned", "Is it earned", ["not earned", "half earned", "fully earned"], "Whether they really did something to deserve it."],
      ["fallComing", "A fall is coming", [0, 5], "How strongly the film hints that this pride is about to be punished."],
    ],
    [3, "Pride can reward a win or set up the next loss.", "Shows the thin line between self-respect and arrogance.", "Too much pride makes us brace for the fall.", "movement", "Let a parent watch their child succeed from the back of the room and say nothing, just straighten up."]);

  c("jealousy", "Jealousy", "emotion",
    "The sting of seeing someone else have what you want, or fearing they will take what you have.",
    [
      ["heat", "How hot the jealousy is", [0, 5], "0 is a flicker; 5 is consumed by it."],
      ["of", "Jealous of what", ["a rival in love", "a friend's success", "a sibling", "a newcomer"], "Who or what sets it off.", U],
      ["shown", "How it shows", ["hidden", "a tight smile", "a sharp word", "open anger"], "How openly the jealousy comes out."],
      ["justified", "Is it justified", ["imagined", "a little", "fully"], "Whether there is a real reason for it."],
      ["target", "Who pays for it", ["no one", "themselves", "the rival", "the one they love"], "Who gets hurt by what the jealousy makes them do."],
      ["turns", "Where it goes", ["stays", "fades", "grows into spite"], "Whether the jealousy passes or hardens."],
    ],
    [3, "Jealousy pushes characters into choices that damage their relationships.", "Explores how comparing ourselves to others can poison love.", "We wait for the jealousy to make them do something they regret.", "visual", "Cut to the jealous one's tight smile in the background while their friend is being congratulated."],
    { also: ["emo-road"] });

  c("relief", "Relief", "emotion",
    "The release of worry when the danger passes or the news is good. The bigger the worry, the bigger the relief.",
    [
      ["size", "How big the relief is", [0, 5], "0 is a small 'phew'; 5 is collapsing with relief."],
      ["after", "After how much worry", [0, 5], "How much worry or fear came before. Relief is only as big as the fear that built it."],
      ["body", "How it shows", ["nothing shows", "a breath out", "a laugh", "sinking down", "tears"], "What their body does when the worry lets go."],
      ["speed", "How fast it arrives", ["slow dawning", "quick", "instant"], "Whether it dawns slowly or hits all at once."],
      ["lasts", "Does it last", ["only a second", "a scene", "for good"], "Whether a new problem arrives right away."],
      ["shared", "Who feels it", ["one person", "two", "the whole room", "the audience too"], "How far the relief spreads."],
    ],
    [2, "Relief closes one danger, often just before the next one opens.", "Shows what the characters were really afraid to lose.", "A short relief that might not last keeps us on edge.", "audio", "Let the character exhale loudly, then hold on them in silence before anything else happens."]);

  c("earnedTears", "Earned tears", "emo-road",
    "Tears that feel deserved because the film built up to them over many scenes, rather than demanding them with music and slow motion.",
    [
      ["earned", "How earned the tears are", [0, 5], "0 is cheap, out of nowhere; 5 is built so carefully the audience cries without being asked."],
      ["setup", "Scenes of setup", [0, 40, "scenes"], "How many scenes the film spent building the feeling before the tears."],
      ["restraint", "How the character cries", ["sobbing openly", "crying", "eyes wet", "fighting it", "dry-eyed"], "A character who holds back often makes the audience cry more."],
      ["trigger", "What sets the tears off", ["a small object", "a simple line", "a reunion", "a goodbye", "a kindness"], "The final small thing that breaks the dam.", U],
      ["musicHelp", "How much the music helps", ["none", "quiet", "swelling", "full swell"], "Earned tears need less help from the music."],
      ["quietBefore", "Quiet before the tears", [0, 10, "seconds"], "Seconds of stillness just before the moment lands."],
    ],
    [3, "The tears mark the moment the story pays off its biggest feeling.", "Shows that love and loss are worth the slow build.", "We have waited many scenes for this, and we will not look away.", "plot", "Plant a small object in act one and have it appear, with no music, in the final goodbye."],
    { also: ["emotion"] });

  c("sentimentality", "Too sweet", "emotion",
    "When a scene pushes the feeling too hard: swelling music, slow motion, speeches that explain the feeling. Too much sugar makes an audience pull back.",
    [
      ["sugar", "How sugary it is", [0, 5], "0 is honest and plain; 5 is syrupy."],
      ["pushers", "What pushes it", ["swelling music", "slow motion", "a speech that explains the feeling", "a cute child or pet", "everyone crying"], "The tool doing the most pushing.", U],
      ["explained", "Feeling said out loud", ["never", "once", "again and again"], "How often characters tell us what to feel."],
      ["undercut", "Something rough to balance it", ["none", "a joke", "a sharp line", "a real flaw"], "A touch of grit that stops it going sticky."],
      ["linger", "How long it lingers", [0, 60, "seconds"], "Seconds the sweet moment is held. Longer holds feel sweeter."],
      ["trust", "Trust in the audience", ["spells it out", "leans in", "lets it be"], "Whether the film trusts us to feel it without help."],
    ],
    [1, "Too much sweetness can stall the plot while the film wallows.", "Real feeling is honest; forced feeling feels like a sales pitch.", "Viewers who feel pushed start looking at their phones.", "audio", "Cut the music under the big hug and keep only the room sound."]);

  c("storyTemperature", "Cool or warm telling", "emo-road",
    "How close the film lets us get to the characters' feelings. Cool storytelling watches from a distance; warm storytelling pulls us right in.",
    [
      ["setting", "Temperature of the telling", ["ice cold", "cool", "even", "warm", "hot"], "Overall closeness to feeling, from detached to fully immersed."],
      ["camera", "How close the camera stays", ["far and still", "watching", "near", "right in their face"], "Camera distance and how much it follows the feeling."],
      ["music", "Music that tells us how to feel", ["none", "sparse", "present", "swelling"], "How much the score leans into feeling."],
      ["access", "Into their heads", ["never", "rarely", "often", "always"], "How often we hear thoughts or see from inside."],
      ["performance", "Acting style", ["held in", "natural", "open", "big"], "How much the actors show on the surface."],
      ["consistency", "Does it change", ["changes a lot", "now and then", "stays the same"], "Whether the film keeps one temperature or shifts."],
    ],
    [1, "The temperature decides how the audience takes each plot turn: as a puzzle or a heartbreak.", "Distance can make us think; closeness makes us feel.", "Warm telling pulls us in; cool telling makes us lean forward to read faces.", "visual", "Shoot one key scene in a single still wide shot, then cut to a tight close-up only at the turn."],
    { also: ["emotion"] });

  c("bodyFeeling", "Feeling in the body", "emotion",
    "How a feeling shows in the body beyond the face: breath, shaking, flushed or pale skin, a lump in the throat, tears.",
    [
      ["strength", "How much the body shows", [0, 5], "0 is calm; 5 is the body taken over by the feeling."],
      ["breath", "Breath", ["calm", "quick", "held", "ragged", "gasping"], "How they are breathing."],
      ["shaking", "Shaking", ["still", "a tremor", "hands shaking", "whole body shaking"], "How much they tremble."],
      ["skin", "Skin", ["normal", "pale", "flushed", "red"], "Color changes in the face from fear, shame or anger."],
      ["tears", "Tears", ["none", "glassy", "one tear", "crying", "sobbing"], "How far the tears go."],
      ["throat", "Throat", ["easy", "a swallow", "a lump", "can't speak"], "Whether the feeling closes the throat."],
    ],
    [2, "The body tells us how close a character is to breaking before they say it.", "Feelings live in the body, not just the mind.", "A trembling hand or held breath makes us lean in.", "movement", "Have the actor hold their breath through the bad news and only breathe out on the cut."],
    { also: ["movement-lines"] });

  c("sceneAftertaste", "Feeling left at the end of the scene", "emotion",
    "The feeling still hanging in the air after the last line, and whether it carries into the next scene or gets cut off.",
    [
      ["strength", "How strong the aftertaste is", [0, 5], "0 is gone the moment the scene ends; 5 stays with us well into the next scene."],
      ["kind", "What the aftertaste is", ["warm", "uneasy", "sad", "giddy", "hollow", "hopeful"], "The feeling left behind.", U],
      ["held", "Seconds held after the last line", [0, 15, "seconds"], "How long the camera stays after the last word."],
      ["carried", "Carries into the next scene", ["cut off", "fades", "carries over", "colors the next scene"], "Whether the next scene picks the feeling up."],
      ["settled", "Is it settled", ["resolved", "partly", "unresolved"], "Whether the scene closes the feeling or leaves it open."],
      ["lastImage", "Last image", ["a face", "an empty room", "a closing door", "an object", "a wide view"], "What we see as the scene ends.", U],
    ],
    [2, "An unsettled ending makes the audience carry a question into the next scene.", "What lingers is often what the scene was really about.", "A feeling left hanging pulls us forward into the next scene.", "visual", "After the last line, hold on the empty doorway for three seconds before cutting."]);

  c("filmAftertaste", "Feeling left when the film ends", "emo-road",
    "The feeling the audience walks out with: uplifted, heartbroken, bittersweet, haunted. Everything in the last minutes shapes it.",
    [
      ["strength", "How strong it is", [0, 5], "0 forgotten by the parking lot; 5 still felt days later."],
      ["kind", "What we walk out with", ["uplifted", "heartbroken", "bittersweet", "haunted", "at peace", "angry"], "The main feeling the film leaves.", U],
      ["resolved", "Loose ends", ["many open", "a few open", "all tied up"], "How much is left for the audience to wonder about."],
      ["lastShotHold", "Last shot held", [0, 60, "seconds"], "How long the final image stays on screen."],
      ["credits", "Over the credits", ["silence", "quiet music", "the main theme", "an upbeat song"], "What plays as the credits roll."],
      ["echo", "Echo of the opening", ["none", "a hint", "a clear mirror"], "Whether the ending mirrors the start so we feel how far we came."],
    ],
    [1, "The ending's feeling decides what the whole plot meant.", "The last feeling is the film's final word on its theme.", "A strong aftertaste makes people talk about the film afterwards.", "audio", "End on a quiet wide shot and let the main theme play softly into the credits."],
    { also: ["emotion"] });

  c("laughThroughGrief", "Laughing through sadness", "emotion",
    "A laugh that breaks into a sad moment: a funny memory at a funeral, a silly mistake during a goodbye. It lightens grief without erasing it.",
    [
      ["mix", "Laughter against grief", ["all grief", "mostly grief", "even", "mostly laughter"], "How much of the moment is laughter and how much is sadness."],
      ["source", "Where the laugh comes from", ["a memory of the person", "a silly mistake", "gallows humor", "a child's honesty", "a ritual gone wrong"], "What sparks the laugh. Gallows humor means joking about death or disaster.", U],
      ["who", "Who laughs", ["one person", "two", "the whole room"], "How far the laughter spreads."],
      ["landing", "What the laugh does", ["breaks the sadness", "pauses it", "deepens it"], "Whether it lifts the grief or makes it hit harder."],
      ["afterward", "After the laugh", ["laugh turns to tears", "both together", "lighter"], "Where the feeling goes next."],
      ["timing", "How soon after the loss", [0, 10, "scenes"], "Scenes between the loss and the first laugh."],
    ],
    [2, "A shared laugh in grief often brings characters back together.", "Shows that joy and sorrow live side by side.", "The surprise of laughing when we expected to cry keeps us alert.", "audio", "At the funeral, let someone mispronounce the dead man's favorite word, the way he always did."],
    { also: ["comedy"] });

  c("grief", "Grief", "emo-road",
    "The long, heavy sadness after a loss. It moves through stages, comes back without warning, and changes the person who carries it.",
    [
      ["weight", "How heavy the grief is", [0, 5], "0 is no loss felt; 5 is crushing."],
      ["stage", "Where they are with it", ["numb", "denial", "anger", "bargaining", "sadness", "acceptance"], "The rough stage of grief, from shock to making peace."],
      ["loss", "What was lost", ["a person", "a pet", "a home", "a future", "a friendship"], "What the grief is for.", U],
      ["shown", "How it shows", ["hidden", "in small things", "in outbursts", "openly"], "How openly the grief comes out."],
      ["scenes", "How long it lasts", [0, 40, "scenes"], "How many scenes the grief has been running."],
      ["reminders", "Things that bring it back", [0, 5], "How many objects, places or songs in the story bring the loss back."],
    ],
    [3, "Grief can freeze a character or drive them to act.", "Explores how we carry those we lose.", "We watch to see if they will find a way through.", "thought", "Leave the dead person's mug on the counter for three scenes before anyone moves it."]);

  c("loneliness", "Loneliness", "emo-road",
    "Feeling cut off from others, whether alone in a room, alone in a crowd, or alone beside someone who does not understand.",
    [
      ["level", "How lonely", [0, 5], "0 is connected; 5 is completely cut off."],
      ["among", "Alone where", ["alone in a room", "alone in a crowd", "alone with someone"], "The kind of loneliness."],
      ["framing", "How the frame shows it", ["no hint", "extra space around them", "tiny in the frame", "seen through glass or doorways"], "Camera choices that make them look alone."],
      ["sound", "What we hear", ["busy", "quiet", "one small sound", "silence"], "Lonely scenes often have one small sound, like a clock or a fridge."],
      ["reachOut", "Reaching out", ["never", "tries and fails", "tries and connects"], "Whether they try to connect with someone."],
      ["scenes", "How long it lasts", [0, 30, "scenes"], "Scenes they have been alone."],
    ],
    [2, "A lonely character's need for connection drives them toward new people.", "Asks what it takes to really be seen.", "We hope someone will finally reach them.", "visual", "Shoot them eating dinner through the kitchen doorway, with an empty chair in the frame."]);

  c("tenderness", "Tenderness", "emotion",
    "Gentle care between people: a soft touch, a fixed collar, a whispered word. Small acts that show love without saying it.",
    [
      ["level", "How tender", [0, 5], "0 is none; 5 is a moment full of gentle care."],
      ["touch", "Touch", ["none", "a hand near", "a light touch", "a held hand", "an embrace"], "How much touch carries the tenderness."],
      ["voice", "Voice", ["normal", "softer", "whispered"], "How the voice drops for the moment."],
      ["act", "The small act", ["fixing a collar", "tucking in", "feeding", "cleaning a wound", "a small gift"], "The everyday action that shows care.", U],
      ["who", "Who gives it", ["one gives", "both give"], "Whether the care flows one way or both."],
      ["interrupted", "Is it interrupted", ["never", "by a joke", "by a sound", "by someone entering"], "What breaks the tender moment, if anything."],
    ],
    [2, "A tender moment shows what is worth protecting, raising the stakes.", "Love lives in small acts more than big words.", "Tender moments make us fear for what might break them.", "movement", "Have one character silently fix the other's collar before they walk into the hard meeting."]);

  c("betrayal", "Betrayal", "emo-road",
    "The shock of being let down by someone you trusted. The closer the betrayer, the deeper the wound.",
    [
      ["blow", "How hard the blow lands", [0, 5], "0 is a small letdown; 5 shatters their world."],
      ["closeness", "How close the betrayer was", ["a stranger", "a coworker", "a friend", "family or a lover"], "The closer they were, the more it hurts."],
      ["reveal", "How it comes out", ["told", "overheard", "caught in the act", "seen on a screen"], "How the betrayal is discovered.", U],
      ["known", "Who knows first", ["the audience", "the betrayed", "both at once"], "If the audience knows first, we dread the moment the character finds out."],
      ["reaction", "Their reaction", ["frozen", "quiet", "cold", "explosive"], "How the betrayed one responds in the moment."],
      ["lasting", "How long it echoes", [0, 40, "scenes"], "Scenes the betrayal keeps shaping their choices."],
    ],
    [4, "A betrayal flips alliances and sends the plot in a new direction.", "Asks who we can trust, and what trust costs.", "We need to know if they will get even or forgive.", "plot", "Let the audience see the betrayal one scene before the character does, then show their happy morning."]);

  c("forgiveness", "Forgiveness", "emo-road",
    "Letting go of a wrong done to you. It can be grudging, partial or full, and it often costs something.",
    [
      ["fullness", "How full the forgiveness is", ["none", "grudging", "partial", "full"], "How completely they let it go."],
      ["wait", "How long it took", [0, 40, "scenes"], "Scenes between the wrong and the forgiveness."],
      ["asked", "Was it asked for", ["never asked", "asked badly", "asked well"], "Whether the wrongdoer apologised, and how well."],
      ["shown", "How it shows", ["a word", "a touch", "an invitation", "a returned object", "a shared joke"], "The sign that forgiveness has happened.", U],
      ["cost", "What it costs", ["nothing", "pride", "a loss", "a lot"], "What the forgiver gives up to forgive."],
      ["after", "The relationship after", ["broken", "cooler", "the same", "closer"], "Where the two stand afterwards."],
    ],
    [3, "Forgiveness reunites characters for the final push.", "Shows that letting go can free the one who forgives.", "We wait and hope for the moment they make peace.", "movement", "Let the forgiveness be shown, not said: one character slides the other's old mug back across the table."],
    { also: ["emotion"] });

  c("resentment", "Resentment", "emo-road",
    "A grudge that simmers for a long time. It leaks out in small jabs and cold silences until it boils over.",
    [
      ["heat", "How hot the grudge is", [0, 5], "0 is no grudge; 5 is ready to explode."],
      ["age", "How old the grudge is", [0, 30, "years"], "How long it has been building."],
      ["shown", "How it shows", ["hidden", "digs and jabs", "cold silences", "open fights"], "How the grudge comes out day to day."],
      ["target", "Who it is aimed at", ["a parent", "a sibling", "a partner", "a boss", "the world"], "Who they hold the grudge against.", U],
      ["fair", "Is it fair", ["no", "partly", "yes"], "Whether the grudge has a real reason."],
      ["boilsOver", "Close to boiling over", [0, 5], "How near they are to finally saying it all."],
    ],
    [3, "A simmering grudge is a bomb under the table that will go off at the worst time.", "Explores how old hurts shape new choices.", "We wait for the moment it all comes out.", "thought", "Give the character one small, bitter line at a family dinner that nobody answers."]);

  // ---------- Suites ----------
  S("tearjerker-finale", "Tearjerker finale", "emo-road",
    "An ending built to make the audience cry, the honest way: long setup, a small trigger, and a release we have waited for.",
    [
      { curiosity: "earnedTears", value: 5 },
      { curiosity: "catharsis", value: 4 },
      { curiosity: "bodyFeeling", slider: "tears", value: "crying" },
      { curiosity: "music", slider: "mood", value: "sad" },
      { curiosity: "filmAftertaste", slider: "kind", value: "heartbroken" },
    ], { also: ["emotion", "music"] });

  S("slow-burn-grudge", "Slow-burn grudge", "emo-road",
    "An old resentment simmering under polite words, with clenched hands and too much held in.",
    [
      { curiosity: "resentment", value: 4 },
      { curiosity: "emotionalDebt", value: 4 },
      { curiosity: "subtext", value: "far apart" },
      { curiosity: "emoHands", value: "clench" },
    ]);

  S("bittersweet-ending", "Bittersweet ending", "emo-road",
    "An ending that is happy and sad at once: something won, something lost, and a warm ache for what was.",
    [
      { curiosity: "filmAftertaste", slider: "kind", value: "bittersweet" },
      { curiosity: "mixedFeelings", value: "even" },
      { curiosity: "nostalgia", slider: "sweetness", value: "bittersweet" },
      { curiosity: "hope", value: 3 },
    ], { also: ["emotion"] });

  S("cold-and-distant", "Cold and distant", "emo-road",
    "Storytelling that keeps feelings at arm's length: wide shots, cool color, little music, feelings mostly hidden.",
    [
      { curiosity: "storyTemperature", value: "cool" },
      { curiosity: "shotSize", value: "wide" },
      { curiosity: "warmCool", value: "cool" },
      { curiosity: "music", value: "barely there" },
      { curiosity: "emoShown", value: "mostly hidden" },
    ], { also: ["camera-angle", "color"] });

  S("laying-it-on-thick", "Laying it on thick", "emotion",
    "Too much sugar: a wall of music, overflowing voices, and tears that have not been earned.",
    [
      { curiosity: "sentimentality", value: 5 },
      { curiosity: "music", value: "wall of sound" },
      { curiosity: "emoVoice", value: "overflowing" },
      { curiosity: "earnedTears", value: 1 },
    ], { also: ["music"] });

  S("struck-with-awe", "Struck with awe", "emotion",
    "A character dwarfed by something vast: a huge place, lots of empty frame, a full orchestra, light from behind.",
    [
      { curiosity: "awe", value: 5 },
      { curiosity: "scale", value: "city" },
      { curiosity: "emptySpace", value: "most" },
      { curiosity: "music", slider: "instrumentation", value: "orchestra" },
      { curiosity: "lightingLens", slider: "key", value: "back" },
    ], { also: ["light", "music"] });

  S("laughing-at-the-funeral", "Laughing at the funeral", "emotion",
    "Grief broken by a laugh that makes the sadness bearable, and sometimes deeper.",
    [
      { curiosity: "laughThroughGrief", value: "even" },
      { curiosity: "grief", value: 4 },
      { curiosity: "mixedFeelings", value: "even" },
      { curiosity: "emoRelease", value: "a laugh" },
    ], { also: ["comedy"] });

  S("lonely-heart", "Lonely heart", "emo-road",
    "Someone alone and wanting: empty space around them, long silences, a longing that will not go away.",
    [
      { curiosity: "loneliness", value: 4 },
      { curiosity: "longing", value: 4 },
      { curiosity: "emptySpace", value: "most" },
      { curiosity: "silence", value: "long" },
    ], { also: ["placement"] });

  S("wanting-to-disappear", "Wanting to disappear", "emotion",
    "Shame in public: eyes down, a squirming room, a closed body.",
    [
      { curiosity: "shame", value: 4 },
      { curiosity: "humiliation", value: 3 },
      { curiosity: "emoEyes", value: "down" },
      { curiosity: "cringe", value: 3 },
      { curiosity: "posture", value: "closed" },
    ], { also: ["comedy"] });

  S("guilty-conscience", "A guilty conscience", "emo-road",
    "Someone carrying a wrong they have not confessed: saying one thing, meaning another, a lump in the throat.",
    [
      { curiosity: "guilt", value: 4 },
      { curiosity: "subtext", value: "far apart" },
      { curiosity: "emotionalDebt", value: 3 },
      { curiosity: "bodyFeeling", slider: "throat", value: "a lump" },
    ]);

  S("green-with-envy", "Green with envy", "emotion",
    "Jealousy behind a tight smile, opening a gap between two people that can sour into a grudge.",
    [
      { curiosity: "jealousy", value: 4 },
      { curiosity: "jealousy", slider: "shown", value: "a tight smile" },
      { curiosity: "emotionGap", value: 3 },
      { curiosity: "resentment", value: 2 },
    ]);

  S("stab-in-the-back", "Stab in the back", "emo-road",
    "A trusted person betrays them: warmth goes cold, anger rises, and the feeling flips.",
    [
      { curiosity: "betrayal", value: 5 },
      { curiosity: "warmth", value: -3 },
      { curiosity: "emotion", value: "angry" },
      { curiosity: "emoTurn", value: "flips" },
    ], { also: ["emotion"] });

  S("making-peace", "Making peace", "emo-road",
    "Forgiveness that warms a relationship again, with tender care and relief on both sides.",
    [
      { curiosity: "forgiveness", value: "full" },
      { curiosity: "warmth", value: 3 },
      { curiosity: "tenderness", value: 3 },
      { curiosity: "relief", value: 3 },
    ], { also: ["emotion"] });

  S("proud-moment", "Proud moment", "emotion",
    "A character at their high point, glowing with earned pride as the room shares it and the music comes forward.",
    [
      { curiosity: "pride", value: 4 },
      { curiosity: "pride", slider: "earned", value: "fully earned" },
      { curiosity: "emoRoadCharacter", value: "highest point" },
      { curiosity: "emoSpread", value: "the whole room" },
      { curiosity: "music", value: "featured" },
    ], { also: ["music"] });

  S("right-there-with-them", "Right there with them", "emotion",
    "The audience fully inside a character's feelings: close faces, warm telling, and rooting for them all the way.",
    [
      { curiosity: "empathy", value: 5 },
      { curiosity: "sideTaking", value: "we root for them" },
      { curiosity: "shotSize", value: "close" },
      { curiosity: "storyTemperature", value: "warm" },
      { curiosity: "audienceFeeling", value: "the same" },
    ], { also: ["camera-angle"] });

  S("a-scene-that-lingers", "A scene that lingers", "emotion",
    "A scene that ends but does not let go: a held shot, a fade out, a silence the feeling hangs in.",
    [
      { curiosity: "sceneAftertaste", value: 4 },
      { curiosity: "fadeEdge", value: "fade out" },
      { curiosity: "silence", value: "long" },
      { curiosity: "sceneEnding", value: "quiet fade" },
    ], { also: ["structure"] });

  S("gentle-care", "Gentle care", "emotion",
    "A tender moment: a held hand, soft light, a voice that barely shows the feeling.",
    [
      { curiosity: "tenderness", value: 4 },
      { curiosity: "touch", value: "held" },
      { curiosity: "lightingMood", value: "soft" },
      { curiosity: "emoVoice", value: "a hint" },
    ], { also: ["light"] });

  S("shaking-with-it", "Shaking with it", "emotion",
    "A feeling that takes over the body: shaking, wet eyes, clenched hands, ragged breath.",
    [
      { curiosity: "bodyFeeling", value: 4 },
      { curiosity: "bodyFeeling", slider: "breath", value: "ragged" },
      { curiosity: "emoEyes", slider: "wet", value: "welling" },
      { curiosity: "emoHands", value: "clench" },
    ], { also: ["movement-lines"] });

  S("rose-tinted-past", "Rose-tinted past", "emo-road",
    "A warm, golden look back: warm color, an old theme returning, a feeling from long ago coming back.",
    [
      { curiosity: "nostalgia", value: 4 },
      { curiosity: "warmCool", value: "warm" },
      { curiosity: "music", slider: "repeatTheme", value: "a theme returns" },
      { curiosity: "feelingEcho", value: 3 },
    ], { also: ["color", "music"] });

  S("phew", "Phew", "emotion",
    "The danger passes: dread drops away, a breather follows, and a little laughter slips out.",
    [
      { curiosity: "relief", value: 4 },
      { curiosity: "dread", value: 0 },
      { curiosity: "breather", value: 3 },
      { curiosity: "mixLaughs", value: "a few" },
    ], { also: ["comedy-mix"] });

  S("on-the-wrong-side", "Rooting for the wrong one", "emo-road",
    "Liking a character we know we should not: uneasy, but still on their side.",
    [
      { curiosity: "sideTaking", value: "we like them" },
      { curiosity: "sideTaking", slider: "cost", value: "real discomfort" },
      { curiosity: "empathy", value: 3 },
      { curiosity: "guilt", value: 2 },
    ]);

  // ---------- Proximities ----------
  P("close-face-pulls-us-in", "When we see their face up close, we feel with them more", "emotion",
    "A close shot of a face makes the audience feel with that character within two beats.",
    { curiosity: "shotSize", is: "close" }, { curiosity: "empathy", change: "rises" }, 2, { also: ["camera-angle"] });
  P("felt-with-tears-earned", "When we feel with them, their tears feel earned", "emo-road",
    "The more we have felt with a character, the more their tears land as earned within a few scenes.",
    { curiosity: "empathy", change: "rises" }, { curiosity: "earnedTears", change: "rises" }, 6);
  P("turning-against-them", "When we turn against them, we stop feeling with them", "emo-road",
    "Once the audience changes sides, it stops feeling with that character within two beats.",
    { curiosity: "sideTaking", change: "drops" }, { curiosity: "empathy", change: "drops" }, 2);
  P("kindness-wins-us-over", "When they show gentle care, we take their side", "emo-road",
    "A tender act wins the audience over within two beats.",
    { curiosity: "tenderness", change: "rises" }, { curiosity: "sideTaking", change: "rises" }, 2);
  P("vast-place-brings-awe", "When the place is huge, awe arrives", "emotion",
    "A vast place brings a feeling of awe within a beat.",
    { curiosity: "scale", is: "city" }, { curiosity: "awe", change: "rises" }, 1, { also: ["background"] });
  P("awe-hushes-voices", "When awe hits, the talking stops", "emotion",
    "Awe makes characters fall quiet within a beat.",
    { curiosity: "awe", change: "rises" }, { curiosity: "wordsAmount", change: "drops" }, 1, { also: ["lines"] });
  P("awe-backlight", "When awe hits, light pours in from behind", "emotion",
    "A moment of awe is often lit from behind, so shapes glow at the edges, within a beat.",
    { curiosity: "awe", change: "rises" }, { curiosity: "lightingLens", slider: "key", is: "back" }, 1, { also: ["light"] });
  P("old-theme-nostalgia", "When an old tune returns, nostalgia comes with it", "emo-road",
    "A theme from earlier in the film brings back a warm ache for the past within a beat.",
    { curiosity: "music", slider: "repeatTheme", is: "a theme returns" }, { curiosity: "nostalgia", change: "rises" }, 1, { also: ["music"] });
  P("nostalgia-warms-color", "When nostalgia rises, the color warms", "emo-road",
    "Memories of the past tend to be shown in warmer color within a beat.",
    { curiosity: "nostalgia", change: "rises" }, { curiosity: "warmCool", is: "warm" }, 1, { also: ["color"] });
  P("nostalgia-to-longing", "When the past calls, longing grows", "emo-road",
    "Remembering what was makes a character long for it within a few scenes.",
    { curiosity: "nostalgia", change: "rises" }, { curiosity: "longing", change: "rises" }, 3);
  P("longing-to-lonely", "When longing grows, loneliness follows", "emo-road",
    "Wanting what is out of reach leaves a character feeling alone within a few scenes.",
    { curiosity: "longing", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 4);
  P("lonely-empty-frame", "When loneliness grows, the frame empties around them", "emo-road",
    "A lonely character is framed with more empty space within a beat.",
    { curiosity: "loneliness", change: "rises" }, { curiosity: "emptySpace", is: "most" }, 1, { also: ["placement"] });
  P("lonely-music-falls-away", "When loneliness grows, the music falls away", "emo-road",
    "Loneliness is often played with no music at all within two beats.",
    { curiosity: "loneliness", change: "rises" }, { curiosity: "noMusic", change: "rises" }, 2, { also: ["music"] });
  P("humiliation-to-shame", "When they are humiliated, shame sets in", "emotion",
    "Public embarrassment turns into shame within a beat.",
    { curiosity: "humiliation", change: "rises" }, { curiosity: "shame", change: "rises" }, 1, { also: ["comedy"] });
  P("wound-touched-shame", "When the old wound is touched, shame comes back", "emotion",
    "Poking an old hurt brings shame back within a beat.",
    { curiosity: "wound", slider: "touched", change: "rises" }, { curiosity: "shame", change: "rises" }, 1, { also: ["arc"] });
  P("shame-eyes-drop", "When shame rises, the eyes drop", "emotion",
    "Shame pulls the eyes to the floor within a beat.",
    { curiosity: "shame", change: "rises" }, { curiosity: "emoEyes", is: "down" }, 1);
  P("shame-room-squirms", "When shame rises, the room squirms", "emotion",
    "Someone else's shame makes the people around them, and the audience, squirm within a beat.",
    { curiosity: "shame", change: "rises" }, { curiosity: "cringe", change: "rises" }, 1, { also: ["comedy"] });
  P("guilt-held-in", "When guilt grows, they hold more in", "emo-road",
    "Unconfessed guilt piles up as feeling held in within a few scenes.",
    { curiosity: "guilt", change: "rises" }, { curiosity: "emotionalDebt", change: "rises" }, 3);
  P("guilt-under-words", "When guilt grows, words stop matching meaning", "emo-road",
    "A guilty character says one thing and means another within two beats.",
    { curiosity: "guilt", change: "rises" }, { curiosity: "subtext", change: "rises" }, 2);
  P("amends-bring-relief", "When they make it right, relief follows", "emotion",
    "Making amends for a wrong brings relief within a beat.",
    { curiosity: "guilt", slider: "amends", change: "rises" }, { curiosity: "relief", change: "rises" }, 1);
  P("pride-swells-setback", "When pride swells, a setback follows", "emotion",
    "Too much pride is often followed by a setback within a few scenes.",
    { curiosity: "pride", change: "rises" }, { curiosity: "plotProgress", change: "drops" }, 5, { also: ["plot"] });
  P("jealousy-opens-gap", "When jealousy flares, the two drift apart", "emotion",
    "Jealousy widens the gap between two characters' feelings within two beats.",
    { curiosity: "jealousy", change: "rises" }, { curiosity: "emotionGap", change: "rises" }, 2);
  P("jealousy-hardens", "When jealousy lingers, it hardens into a grudge", "emo-road",
    "Jealousy left alone turns into resentment within several scenes.",
    { curiosity: "jealousy", change: "rises" }, { curiosity: "resentment", change: "rises" }, 8);
  P("dread-lifts-relief", "When the dread lifts, relief floods in", "emotion",
    "The moment dread drops, relief rises within a beat.",
    { curiosity: "dread", change: "drops" }, { curiosity: "relief", change: "rises" }, 1, { also: ["emo-road"] });
  P("relief-breath-out", "When relief comes, the breath slows", "emotion",
    "Relief shows first in the breath, which calms within a beat.",
    { curiosity: "relief", change: "rises" }, { curiosity: "bodyFeeling", slider: "breath", is: "calm" }, 1);
  P("earned-tears-release", "When the tears are earned, the release arrives", "emo-road",
    "Tears the film has truly built up to bring the big release within a beat.",
    { curiosity: "earnedTears", change: "rises" }, { curiosity: "catharsis", change: "rises" }, 1);
  P("loud-music-too-sweet", "When the music swells into a wall of sound, it turns too sweet", "emotion",
    "Music turned all the way up over a feeling tips it into sugar within a beat.",
    { curiosity: "music", is: "wall of sound" }, { curiosity: "sentimentality", change: "rises" }, 1, { also: ["music"] });
  P("sugar-pushes-away", "When it gets too sweet, the audience pulls back", "emotion",
    "Forced sweetness makes the audience feel less for the character within two beats.",
    { curiosity: "sentimentality", change: "rises" }, { curiosity: "empathy", change: "drops" }, 2);
  P("cold-telling-distance", "When the telling turns ice cold, we feel less with them", "emo-road",
    "Very cool storytelling keeps the audience from feeling with characters within a few scenes.",
    { curiosity: "storyTemperature", is: "ice cold" }, { curiosity: "empathy", change: "drops" }, 3);
  P("warm-telling-moves-closer", "When the telling warms, the camera moves closer", "emo-road",
    "Warmer storytelling brings the camera in close within two beats.",
    { curiosity: "storyTemperature", change: "rises" }, { curiosity: "shotSize", is: "close" }, 2, { also: ["camera-angle"] });
  P("strong-feeling-in-body", "When the feeling grows strong, the body shows it", "emotion",
    "A strong feeling shows in breath and shaking within a beat.",
    { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "bodyFeeling", change: "rises" }, 1);
  P("lump-breaks-voice", "When their throat closes, the voice breaks", "emotion",
    "A lump in the throat makes the voice break within a beat.",
    { curiosity: "bodyFeeling", slider: "throat", is: "can't speak" }, { curiosity: "emoVoice", slider: "crack", is: "breaks" }, 1, { also: ["lines"] });
  P("fade-leaves-aftertaste", "When the scene fades out, the feeling lingers", "emotion",
    "A fade out at the end of a scene leaves the feeling hanging within a beat.",
    { curiosity: "fadeEdge", is: "fade out" }, { curiosity: "sceneAftertaste", change: "rises" }, 1, { also: ["transitions"] });
  P("aftertaste-colors-next", "When the feeling lingers, the next scene feels the same", "emotion",
    "A strong aftertaste carries into the next scene, which then feels less different, within a beat.",
    { curiosity: "sceneAftertaste", change: "rises" }, { curiosity: "emoContrastPrev", change: "drops" }, 1);
  P("release-shapes-ending", "When the big release comes, the ending stays with us", "emo-road",
    "A strong release late in the film deepens the feeling we walk out with within a few scenes.",
    { curiosity: "catharsis", change: "rises" }, { curiosity: "filmAftertaste", change: "rises" }, 8);
  P("echo-shapes-ending", "When an old feeling comes back, the ending lingers longer", "emo-road",
    "A feeling that returns near the end makes the final aftertaste stronger within a few scenes.",
    { curiosity: "feelingEcho", change: "rises" }, { curiosity: "filmAftertaste", change: "rises" }, 5);
  P("loss-brings-grief", "When hope is lost, grief sets in", "emo-road",
    "When hope drops away, grief follows within two scenes.",
    { curiosity: "hope", change: "drops" }, { curiosity: "grief", change: "rises" }, 2);
  P("grief-lets-a-laugh-in", "When grief is heavy, a laugh slips in", "emo-road",
    "Deep grief often makes room for a laugh within a few scenes.",
    { curiosity: "grief", change: "rises" }, { curiosity: "laughThroughGrief", change: "rises" }, 3, { also: ["comedy"] });
  P("laugh-into-tears", "When they laugh through sadness, the tears come", "emotion",
    "A laugh in grief often opens the way to tears within a beat.",
    { curiosity: "laughThroughGrief", change: "rises" }, { curiosity: "emoRelease", is: "tears" }, 1);
  P("laugh-and-sorrow-mix", "When they laugh through sadness, the feelings blend", "emotion",
    "Laughing in grief makes two feelings sit side by side within a beat.",
    { curiosity: "laughThroughGrief", change: "rises" }, { curiosity: "mixedFeelings", is: "even" }, 1);
  P("betrayal-chills", "When they are betrayed, the warmth goes cold", "emo-road",
    "A betrayal cools the warmth between two people within a beat.",
    { curiosity: "betrayal", change: "rises" }, { curiosity: "warmth", change: "drops" }, 1);
  P("betrayal-breeds-grudge", "When they are betrayed, a grudge takes root", "emo-road",
    "Betrayal grows into resentment within several scenes.",
    { curiosity: "betrayal", change: "rises" }, { curiosity: "resentment", change: "rises" }, 6);
  P("grudge-boils-over", "When the grudge nears boiling, anger breaks out", "emo-road",
    "A grudge close to boiling over turns into open anger within two beats.",
    { curiosity: "resentment", slider: "boilsOver", change: "rises" }, { curiosity: "emotion", is: "angry" }, 2, { also: ["emotion"] });
  P("forgiveness-rewarms", "When they forgive, the warmth comes back", "emo-road",
    "Forgiveness brings warmth back between two people within two scenes.",
    { curiosity: "forgiveness", change: "rises" }, { curiosity: "warmth", change: "rises" }, 2);
  P("forgiveness-releases", "When they forgive, the big release comes", "emo-road",
    "Forgiveness unlocks the release of everything held in within a beat.",
    { curiosity: "forgiveness", change: "rises" }, { curiosity: "catharsis", change: "rises" }, 1);
  P("tenderness-holds-hands", "When tenderness grows, hands are held", "emotion",
    "Tender feeling turns into a held touch within a beat.",
    { curiosity: "tenderness", change: "rises" }, { curiosity: "touch", is: "held" }, 1, { also: ["movement-lines"] });

  // ---------- Proximity suites ----------
  PS("from-loss-to-letting-go", "From loss to letting go", "emo-road",
    "Hope dies, grief sets in, a laugh slips through, the tears come, and the release arrives.",
    ["loss-brings-grief", "grief-lets-a-laugh-in", "laugh-into-tears", "earned-tears-release"]);
  PS("betrayed-then-forgiven", "Betrayed, then forgiven", "emo-road",
    "Trust breaks, warmth cools, a grudge grows and boils over, until forgiveness warms things again and brings release.",
    ["betrayal-chills", "betrayal-breeds-grudge", "grudge-boils-over", "forgiveness-rewarms", "forgiveness-releases"]);
  PS("shame-spiral", "Shame spiral", "emotion",
    "An old wound or a public humiliation brings shame, the eyes drop and the whole room squirms.",
    ["wound-touched-shame", "humiliation-to-shame", "shame-eyes-drop", "shame-room-squirms"]);
  PS("getting-it-off-their-chest", "Getting it off their chest", "emo-road",
    "Guilt piles up and twists their words until they make it right, relief floods in and the breath slows.",
    ["guilt-held-in", "guilt-under-words", "amends-bring-relief", "relief-breath-out"]);
  PS("the-ache-of-missing", "The ache of missing", "emo-road",
    "An old tune brings back the past, the past turns into longing, longing into loneliness, and the frame and music empty out.",
    ["old-theme-nostalgia", "nostalgia-to-longing", "longing-to-lonely", "lonely-empty-frame", "lonely-music-falls-away"]);
  PS("earning-the-tears", "Earning the tears", "emo-road",
    "Close faces and small kindnesses win us over, so the tears feel earned, the release lands, and the ending stays with us.",
    ["close-face-pulls-us-in", "kindness-wins-us-over", "felt-with-tears-earned", "earned-tears-release", "release-shapes-ending"]);
  PS("sugar-backfires", "Too much sugar backfires", "emotion",
    "Music turned up too high makes a scene syrupy, and the audience pulls back instead of leaning in.",
    ["loud-music-too-sweet", "sugar-pushes-away"], { also: ["music"] });
  PS("envy-turns-sour", "Envy turns sour", "emotion",
    "Jealousy opens a gap, hardens into a grudge, and finally boils over into anger.",
    ["jealousy-opens-gap", "jealousy-hardens", "grudge-boils-over"], { also: ["emo-road"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
