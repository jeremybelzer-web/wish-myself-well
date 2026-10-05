/* data/db-depth-minds.js: inner life and groups, deeper (the three thinnest story workspaces: mindset, herd and arc).
   18 curiosities: six for a character's mind (the role they cast themself in, all or nothing thinking, a parent's
   voice in their head, overthinking or acting on instinct, expecting the worst, replaying the moment), six for how
   groups act (the quiet majority, the group's inside joke, earning a place in the group, the leader's right hand,
   everyone watches and nobody helps, blaming one of their own) and six for how a character changes (the first small
   step, changing for show, others notice the change, chasing a new goal, a promise to themself, changed but too
   late). Each has its own graded sliders and a momentum note, tied into suites, proximities and proximity suites.
   Ideas already in the database (a belief tested: mindset and beliefShown; a grudge kept alive: resentment; hope
   against the odds: hope; a rumor: rumor; a crowd turning and who switches first: crowdTurns, dissenter and
   alliances; the outsider: oddOneOut and apartFromGroup; the old wound: wound; backsliding: relapse; the moment of
   choice: pointOfNoReturn and costlyChoice; what they give up: sacrifice; who they become: changeShows; the test
   that proves it: arcTest) are linked to, not repeated. Loaded after db-depth-feeling.js. Written 2026-10-04 by the
   depth thread (minds). */
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

  /* ---------- the mind ---------- */

  c("selfStory", "The role they cast themself in", "mindset",
    "Everyone tells themself a story about who they are: the victim, the hero, the screw-up, the one who holds it all together. The character retells what happens so it fits that role, even when the facts say otherwise. Different from the lie they believe: this is the part they play in their own life.",
    [
      ["grip", "How tightly they hold the role", [0, 5], "From a loose idea of themself (0) to a role they cannot step out of, whatever happens (5)."],
      ["role", "The role", ["the victim", "the hero", "the screw-up", "the one who holds it together", "the outsider"], "The part they have cast themself in.", U],
      ["fit", "How well it fits the facts", ["fits the facts", "a bit off", "far from the facts", "the opposite of the facts"], "How far the role is from what we actually see them do."],
      ["retells", "How often they retell it", ["never", "now and then", "every chance they get", "to anyone who listens"], "How often they tell others, or themself, the story of who they are."],
      ["others", "What others do with it", ["go along", "quietly doubt it", "argue", "laugh at it"], "How the people around them treat the role.", U],
      ["drops", "What happens to the role", ["never changes", "cracks", "rewrites it", "drops it"], "Whether the role survives the film."],
    ],
    [3, "The role decides how they read every event, so it bends their choices and starts fights with people who see them differently.", "Shows that the story we tell about ourselves can trap us, or carry us.", "We wait for the moment the facts and the role finally crash into each other.", "thought", "Let her call herself the one who always cleans up everyone's mess, then show a scene where she made the mess herself."]);

  c("allOrNothing", "All or nothing thinking", "mindset",
    "The character sees everything in two colors: a person is all good or all bad, a plan is perfect or a disaster, a day is a win or a total loss. One small mistake flips their whole view. Learning the middle ground is often what the film is about.",
    [
      ["extreme", "How black and white they think", [0, 5], "From seeing shades of grey (0) to only ever two choices, all or nothing (5)."],
      ["about", "What they judge this way", ["themselves", "other people", "a plan", "love", "right and wrong"], "Where the all or nothing thinking shows most.", U],
      ["words", "How their words show it", ["sometimes", "usually", "always or never", "everything or nothing"], "The words they reach for. The more extreme the words, the more extreme the thinking."],
      ["flip", "How fast good turns to bad", ["never flips", "flips slowly", "flips at one mistake"], "How quickly a person or plan goes from all good to all bad in their eyes."],
      ["cost", "What it costs them", ["nothing", "a missed chance", "a friendship", "everything"], "What the thinking breaks before the film is over."],
      ["grey", "Do they see the middle", ["never", "glimpses it", "learns it"], "Whether they find the grey by the end."],
    ],
    [3, "One small slip makes them drop a friend or a plan, which sends the story off in a new direction.", "Shows how a life gets smaller when everything must be perfect or worthless.", "We wait for the small mistake that will flip them, and hope they learn the middle.", "thought", "Let him call his best friend 'the only person I trust', then cut him off for being five minutes late."]);

  c("innerVoice", "A parent's voice in their head", "mindset",
    "The character still hears someone from their past: a parent, a coach, a teacher. The voice praises, warns or puts them down at the worst moments. The film can show it as a look, an echo on the soundtrack, or the person standing right there.",
    [
      ["loudness", "How loud the voice is", [0, 5], "From a faint memory (0) to a voice that drowns out everything else (5)."],
      ["whose", "Whose voice it is", ["a parent", "a teacher", "a coach", "an old friend", "an ex"], "The person they still hear.", U],
      ["says", "What it says", ["praise", "warnings", "put-downs", "orders"], "The kind of thing the voice tells them.", U],
      ["shown", "How the film shows it", ["only in their face", "an echo on the soundtrack", "the person appears", "a memory flash"], "How the audience gets to hear or see the voice.", U],
      ["when", "When it speaks up", ["rarely", "under pressure", "at every choice", "all the time"], "How often the voice gets in."],
      ["answers", "How they answer it", ["obeys", "argues", "ignores it", "talks back for good"], "How they deal with the voice, which often is the change of the film."],
    ],
    [2, "The voice stops them, or pushes them, right when a choice matters.", "Shows how the people who raised us keep talking long after they are gone.", "We wait for the moment they finally talk back.", "audio", "Every time she reaches for the microphone, let us hear her mother say 'nobody wants to hear you', softly, under the room noise."]);

  c("thinkOrLeap", "Overthinking or acting on instinct", "mindset",
    "Some characters think every choice to death and miss the moment. Others jump without looking. Where a character sits between the two, and whether they move, says a lot about them and makes a good pair with someone who is the opposite.",
    [
      ["lean", "Thinking or jumping", ["pure instinct", "leans instinct", "balanced", "leans thinking", "frozen by thinking"], "From acting at once without a thought to thinking so much they cannot move."],
      ["options", "Choices they weigh", [1, 8, "choices"], "How many options they turn over before acting."],
      ["time", "Time to decide", ["a blink", "a few seconds", "a whole scene", "days"], "How long the decision takes."],
      ["shown", "How we see them think", ["a still face", "pacing", "talking it through", "lists and notes", "we hear their thoughts"], "What the film shows while they decide.", U],
      ["result", "What happens", ["the chance passes", "a wrong move", "a lucky guess", "the right move"], "How the choice turns out.", U],
      ["partner", "Someone with the other habit", ["none", "an opposite who acts", "an opposite who thinks"], "Whether someone close has the opposite habit.", U],
    ],
    [3, "A quick jump starts trouble; a long think lets the chance slip away. Either way the story moves.", "Shows the price of thinking too much and the price of not thinking at all.", "We shout at the screen: just do it, or wait!", "thought", "Let her write a list of pros and cons about asking him to dance while her friend just walks over and asks him."]);

  c("expectWorst", "Expecting the worst", "mindset",
    "The character imagines the worst thing that could happen, then something worse. A late phone call means a car crash, a quiet boss means they are fired. The film can show the imagined disaster as if it were real, then snap back.",
    [
      ["dread", "How bad they imagine it", [0, 5], "From a small worry (0) to a full imagined disaster (5)."],
      ["shown", "How we see the worry", ["a worried look", "they say it out loud", "an imagined scene we see", "we can't tell it's imagined"], "How much of the imagined disaster the film shows, up to fooling us too."],
      ["about", "What they worry about", ["their health", "someone they love", "a mistake at work", "being found out", "being left"], "The fear behind the spiral.", U],
      ["spiral", "Steps in the spiral", [1, 6, "steps"], "How many worse and worse thoughts follow the first one."],
      ["reality", "How it really turns out", ["much better", "a little better", "as bad", "worse"], "What actually happens next to the thing they feared."],
      ["stops", "What stops the spiral", ["nothing", "a friend", "the real thing happening", "they stop it themselves"], "What breaks the worrying.", U],
    ],
    [2, "The worry makes them act early or hide, which can make the feared thing more likely.", "Shows how fear writes stories of its own.", "We get pulled into the worry with them and want to know the truth.", "visual", "When her son is late, show the police at the door, then cut back to her in the kitchen, and the son walking in eating chips."]);

  c("replaying", "Replaying the moment", "mindset",
    "The character cannot stop going over one moment: a mistake, an insult, a missed chance. The film can play the moment again, a little different each time, as they wish they had said or done something else.",
    [
      ["stuck", "How stuck they are", [0, 5], "From a passing thought (0) to the moment taking over their days (5)."],
      ["moment", "What they replay", ["a mistake", "an insult", "a loss", "a missed chance", "a goodbye"], "The moment they keep going back to.", U],
      ["shown", "How the film shows it", ["they go quiet", "a flash of the moment", "the moment played again", "the moment changed each time"], "How much of the replay we see."],
      ["times", "Times it is replayed", [1, 8, "times"], "How often the moment comes back in the film."],
      ["changes", "How the replay changes", ["exactly the same", "small changes", "what they wish they'd said", "a new truth appears"], "Whether each replay is the same or shows something new."],
      ["letsGo", "Do they let it go", ["never", "a little", "fully"], "Whether they stop replaying by the end."],
    ],
    [2, "Each replay can show a new detail that changes what we thought happened.", "Shows how one moment can hold a person still while life moves on.", "We watch each replay for the detail we missed.", "visual", "Replay the job interview three times, and in the third version let her finally say the clever answer she thought of on the bus."]);

  /* ---------- the group ---------- */

  c("quietMajority", "The quiet majority", "herd",
    "Most of the group disagree, but nobody says so. Each one thinks they are the only one. The camera can catch the small signs: a glance, an eye roll, a held breath. One voice is often all it takes for the silence to break.",
    [
      ["silent", "How much of the group keeps quiet", [0, 5], "From everyone speaking their mind (0) to almost all of them holding back (5)."],
      ["groupSize", "Size of the group", [3, 30, "people"], "How many people are in the room."],
      ["why", "Why they stay quiet", ["fear", "habit", "each thinks they're alone", "it's not their business"], "What keeps them silent.", U],
      ["signs", "Small signs of disagreement", ["none", "a glance", "an eye roll", "a whisper"], "How much leaks out of the silence."],
      ["breaks", "How the silence breaks", ["never", "one voice breaks it", "everyone at once"], "Whether, and how, the quiet ends."],
      ["shot", "How the camera shows them", ["one face", "a few faces", "a slow pan along all of them"], "How many silent faces the film lets us see."],
    ],
    [3, "The silence lets something bad go on; when it breaks, the group's power shifts at once.", "Shows how many people stay quiet because they think nobody else agrees.", "We wait for someone, anyone, to say it.", "visual", "At the meeting, pan slowly along the table: every face disagrees with the boss, and nobody says a word."],
    { also: ["mindset"] });

  c("insideJoke", "The group's inside joke", "herd",
    "A nickname, a phrase or a gesture only the group understands. It shows how close they are, and shuts out anyone who doesn't know it. When it is said for the last time, it can break your heart.",
    [
      ["bond", "How much it binds them", [0, 5], "From a passing laugh (0) to the thing that holds the group together (5)."],
      ["kind", "What the joke is", ["a nickname", "a phrase", "a gesture", "a song", "a story they all know"], "The shape the inside joke takes.", U],
      ["uses", "Times it comes up", [1, 8, "times"], "How often the joke appears in the film."],
      ["outsider", "What happens to an outsider", ["no outsider", "an outsider is lost", "an outsider is shut out", "an outsider is let in on it"], "How someone who doesn't know the joke is treated.", U],
      ["weight", "What it carries", ["just fun", "a shared memory", "a shared loss"], "How much history sits under the joke."],
      ["last", "The last time", ["it keeps going", "it changes", "said one last time", "no one says it again"], "How the film ends the joke.", U],
    ],
    [1, "Mostly marks who belongs, but letting someone in on it can be a turning point.", "Shows that belonging is built from small things only the group shares.", "We start to wait for the joke, and feel part of the group when it comes.", "audio", "Give the friends a silly whistle they use when one of them is in trouble, then let the new kid whistle it in the last scene."],
    { also: ["comedy"] });

  c("initiation", "Earning a place in the group", "herd",
    "To get in, the newcomer has to pass a test: a dare, a skill to prove, a secret kept, sometimes a cruel act. What they are willing to do to belong shows who they are.",
    [
      ["test", "How hard the way in is", [0, 5], "From a friendly hello (0) to a test that could cost them everything (5)."],
      ["kind", "What the test is", ["a dare", "a skill to prove", "a secret kept", "taking the blame", "a cruel act"], "What they must do to get in.", U],
      ["watched", "People watching", [0, 20, "people"], "How many people see them try."],
      ["gate", "Who decides", ["no one", "one gatekeeper", "a vote", "the leader"], "Who lets them in.", U],
      ["result", "How it ends", ["refused", "let in halfway", "let in fully", "they walk away"], "Whether they get in.", U],
      ["price", "What it costs them", ["nothing", "their pride", "an old friend", "their beliefs"], "What they give up to belong."],
    ],
    [3, "The test pushes the newcomer to act, and what they do often starts the main trouble.", "Shows how much of ourselves we trade to belong.", "We want to know if they will do it, and what it makes of them.", "plot", "To join the gang, he must steal from the shop owned by the old man who was kind to him."]);

  c("rightHand", "The leader's right hand", "herd",
    "The person who stands next to the leader and carries out the orders: the enforcer, the keeper of secrets, the one who speaks for the boss. Watch their face. When they start to doubt, the whole group is about to change.",
    [
      ["loyalty", "How loyal they are", [0, 5], "From already halfway out the door (0) to ready to do anything for the leader (5)."],
      ["job", "What they do", ["gives orders", "does the dirty work", "keeps the secrets", "speaks for the leader"], "Their job next to the leader.", U],
      ["shadow", "Where they stand", ["stays behind", "stands beside", "steps in front"], "Where they stand next to the leader, which shows their power."],
      ["doubts", "How their doubts show", ["none", "hidden", "shown in a look", "said out loud"], "How much of their doubt we see."],
      ["turn", "Do they turn", ["never", "quietly works against", "walks away", "takes over", "brings the leader down"], "What they do in the end.", U],
      ["known", "Who sees it coming", ["nobody", "the hero", "the leader"], "Who notices the right hand is changing.", U],
    ],
    [3, "When the right hand doubts or turns, the leader loses power and the plot swings.", "Shows that power rests on the people who carry it out.", "We watch their face for the first crack.", "movement", "Let the boss give the order, and hold on his right hand for a beat too long before she nods."]);

  c("bystanders", "Everyone watches, nobody helps", "herd",
    "Something bad happens in front of a crowd, and everyone watches. Each waits for someone else to step in. The longer it lasts, the harder it is to move, until one unlikely person does.",
    [
      ["frozen", "How frozen the watchers are", [0, 5], "From people rushing in at once (0) to nobody moving at all (5)."],
      ["watchers", "People watching", [2, 30, "people"], "How many people stand around. More people often means less help."],
      ["what", "What they watch", ["someone hurt", "someone bullied", "a theft", "an unfair act", "a fall"], "What happens in front of them.", U],
      ["looks", "Where they look", ["at the scene", "at each other", "at their phones", "away"], "Where the watchers' eyes go.", U],
      ["helper", "Who finally helps", ["no one", "a child", "the least likely person", "the hero"], "Who breaks the freeze.", U],
      ["time", "Time before anyone moves", [0, 30, "seconds"], "How long the freeze lasts."],
    ],
    [3, "The freeze sets up the moment one person finally steps in, which can change who they are.", "Shows how a crowd makes each person feel less responsible.", "We squirm and wait for someone to move.", "visual", "On the bus, let a man shout at a young woman while thirty passengers look at their phones, until an old lady stands up."]);

  c("scapegoat", "Blaming one of their own", "herd",
    "When something goes wrong, the group picks one member to blame: the newest, the weakest, the oddest, or the one who spoke up. Pushing them out lets everyone else feel clean.",
    [
      ["blame", "How much blame lands on them", [0, 5], "From a few looks (0) to the whole group turning on them (5)."],
      ["who", "Who gets blamed", ["the newest", "the weakest", "the oddest", "the one who spoke up"], "Who the group picks.", U],
      ["fault", "Was it their fault", ["their fault", "partly their fault", "not their fault at all"], "How fair the blame is."],
      ["howFast", "How fast it happens", ["slowly", "over a scene", "in one moment"], "How fast the group turns."],
      ["fate", "What happens to them", ["stays", "is pushed out", "leaves", "proved right"], "How it ends for the one blamed.", U],
      ["group", "How the group feels after", ["feels nothing", "feels relief", "feels shame later"], "What the group feels once it is done."],
    ],
    [4, "Pushing someone out changes the group, and the one blamed often comes back to set things right.", "Shows how groups protect themselves by sacrificing one of their own.", "We know they are innocent and wait for the truth to come out.", "plot", "When the money goes missing, let every head turn to the new girl, while we saw the captain take it."]);

  /* ---------- the change ---------- */

  c("firstStep", "The first small step", "arc",
    "Change rarely starts with a big speech. It starts small: saying hello, asking for help, saying no once. The first step shows the change is possible, and how hard it is for them.",
    [
      ["courage", "Courage it takes", [0, 5], "From easy (0) to the hardest thing they have ever done, even if it looks tiny to us (5)."],
      ["act", "What the step is", ["saying hello", "asking for help", "saying no", "telling the truth", "trying again"], "The small act that starts the change.", U],
      ["when", "When it comes", ["the first act", "early", "midway", "late"], "Where in the film the first step lands."],
      ["seen", "Who sees it", ["nobody", "one person", "everyone"], "How many people notice the step."],
      ["after", "What follows", ["they step back", "they hold", "another step follows"], "Whether the step leads anywhere."],
      ["shown", "How the film marks it", ["a hesitation", "a deep breath", "a pause at a door", "nothing at all"], "The small sign that this moment matters.", U],
    ],
    [3, "The first step opens the door to the rest of the change and to new trouble.", "Shows that big changes are made of small brave acts.", "We cheer quietly and want to see the next step.", "movement", "Let him stand at the door of the support group for a full ten seconds, then go in and say only 'hi'."]);

  c("falseChange", "Changing for show", "arc",
    "The character acts changed: kinder, sober, honest. But it is an act, to win someone back or to get out of trouble. Small slips give it away. Sometimes the act slowly becomes real.",
    [
      ["fake", "How much of it is an act", [0, 5], "From a real change (0) to a complete show (5)."],
      ["why", "Why they fake it", ["to win someone back", "to get out of trouble", "to fit in", "to fool themself"], "What they hope the act will get them.", U],
      ["signs", "Slips that give it away", [0, 6, "slips"], "How many small cracks we catch."],
      ["fooled", "Who is fooled", ["no one", "the audience", "the people around them", "themselves"], "Who believes the act.", U],
      ["caught", "How it is found out", ["never", "by a slip", "by a test", "by their own confession"], "How the act is exposed.", U],
      ["becomesReal", "Does it become real", ["no", "partly", "fully"], "Whether the act turns into the real thing."],
    ],
    [3, "The fake change buys time, and when it is exposed, the fall is worse.", "Shows the gap between acting changed and being changed.", "We look for the slip that gives them away.", "thought", "Let him tell his ex he quit drinking, then show the mint he chews before every visit."]);

  c("othersNotice", "Others notice the change", "arc",
    "We often see a character's change through someone else's eyes: an old friend who says 'you're different', a mother who looks twice, a rival who feels threatened. How others react can help the change or try to pull them back.",
    [
      ["noticed", "How much others notice", [0, 5], "From nobody seeing it (0) to everyone talking about it (5)."],
      ["first", "Who sees it first", ["a stranger", "a friend", "a rival", "a family member", "a child"], "The first person to notice.", U],
      ["reaction", "How they react", ["suspicious", "surprised", "proud", "threatened"], "What the change stirs in them.", U],
      ["said", "How it is said", ["never said", "a look", "a remark", "said out loud"], "How openly the change is named."],
      ["timing", "When they notice", ["too early", "just after the change", "long after"], "How soon others catch on."],
      ["pushback", "Do they push back", ["none", "teasing", "pulling them back", "a fight"], "Whether the people around them try to keep them as they were."],
    ],
    [2, "Other people's reactions test the change and can start new fights.", "Shows that changing means changing your place among the people who knew you.", "We wait for someone to say it out loud.", "visual", "When she comes home for the holidays, let her little brother stare at her a beat too long and say 'you don't laugh like that anymore'."]);

  c("goalSwap", "Chasing a new goal", "arc",
    "The character starts out chasing one thing (money, winning, revenge) and somewhere along the way realizes they want something else: a friend's safety, the truth, peace. Dropping the old goal is often the turn of the whole film.",
    [
      ["swap", "How fully the old goal is dropped", [0, 5], "From still chasing the old goal (0) to giving it up completely (5)."],
      ["old", "The old goal", ["money", "winning", "revenge", "being loved", "escape"], "What they chased at the start.", U],
      ["newGoal", "The new goal", ["someone's safety", "the truth", "a friendship", "peace", "staying"], "What they chase now.", U],
      ["when", "When it swaps", ["early", "midway", "late", "the final scene"], "Where in the film the goal changes."],
      ["trigger", "What makes them swap", ["a loss", "a lesson", "a person", "winning and finding it empty"], "What makes the old goal stop mattering.", U],
      ["shown", "How we see the swap", ["a thought", "a choice", "throwing the prize away"], "How plainly the film shows the old goal being dropped."],
    ],
    [5, "The new goal turns the story in a new direction, often against everything they built.", "Shows the difference between what we want and what we need.", "We wonder if they will really let go of the old goal.", "plot", "At the finish line of the race he trained all film for, let him stop to help the fallen rival up."]);

  c("selfVow", "A promise to themself", "arc",
    "Early on, the character makes a private promise: never again, never trust anyone, always protect my sister. The film then tests that promise again and again. Keeping it or breaking it shows who they have become.",
    [
      ["strength", "How strong the promise is", [0, 5], "From a passing thought (0) to the rule they live by (5)."],
      ["vow", "The promise", ["never again", "always protect", "never trust", "never go back", "never cry"], "What they promised themself.", U],
      ["made", "When it was made", ["before the film", "the first scene", "midway"], "Where the promise comes from."],
      ["said", "How we learn it", ["never said", "said once", "told to others", "written down"], "How clearly the film tells us the promise."],
      ["tested", "Times it is tested", [1, 6, "times"], "How often the story pushes against it."],
      ["ends", "How it ends", ["kept", "bent", "broken for good reason", "broken and regretted"], "What happens to the promise.", U],
    ],
    [3, "Each test of the promise creates a choice, and breaking it can be the big turn.", "Shows how the rules we make to protect ourselves can also hold us back.", "We wait to see if, and when, the promise breaks.", "thought", "Let her swear she'll never go back to her hometown in scene one, and end the film with her car pulling into its main street."]);

  c("tooLateChange", "Changed, but too late", "arc",
    "The character does change, but only after it can save what mattered most: the person is gone, the love has moved on, the chance has passed. The change is real, and it hurts all the more.",
    [
      ["lateness", "How late the change comes", [0, 5], "From just in time (0) to long after it could help (5)."],
      ["lost", "What is already lost", ["a person", "a love", "a job", "a chance", "their own life"], "What the change came too late for.", U],
      ["knows", "Who knows they changed", ["no one", "only them", "the audience", "everyone"], "Who sees the change at all."],
      ["shown", "How the film shows it", ["a look", "a last act", "an empty room", "a letter"], "How the late change is shown.", U],
      ["left", "What good it still does", ["nothing", "a small good", "passing it on"], "Whether the change still helps someone else."],
      ["mood", "How it leaves us", ["bitter", "sad but calm", "quietly hopeful"], "The feeling the film ends on."],
    ],
    [2, "The late change closes the story with a cost, and can pass the lesson to someone new.", "Shows that change has a deadline, and some things cannot wait.", "We hope against hope that it is not too late.", "plot", "Let him finally learn to cook his late wife's soup, and serve it to the neighbor's lonely kid."],
    { also: ["emo-road"] });

  /* ---------- suites ---------- */

  S("stuck-in-their-head", "Stuck in their head", "mindset",
    "He replays the mistake again and again, imagines the worst, and freezes every time he has to choose.",
    [
      { curiosity: "replaying", value: 4 },
      { curiosity: "replaying", slider: "moment", value: "a mistake" },
      { curiosity: "replaying", slider: "shown", value: "the moment changed each time" },
      { curiosity: "expectWorst", value: 4 },
      { curiosity: "expectWorst", slider: "shown", value: "an imagined scene we see" },
      { curiosity: "thinkOrLeap", value: "frozen by thinking" },
      { curiosity: "thinkOrLeap", slider: "result", value: "the chance passes" },
      { curiosity: "mindset", value: "fixed", weight: 60 },
    ]);

  S("the-critic-inside", "The critic inside", "mindset",
    "Her father's voice tells her she is not good enough, she casts herself as the screw-up, and one mistake proves it to her.",
    [
      { curiosity: "innerVoice", value: 4 },
      { curiosity: "innerVoice", slider: "whose", value: "a parent" },
      { curiosity: "innerVoice", slider: "says", value: "put-downs" },
      { curiosity: "innerVoice", slider: "shown", value: "an echo on the soundtrack" },
      { curiosity: "selfStory", value: 4 },
      { curiosity: "selfStory", slider: "role", value: "the screw-up" },
      { curiosity: "allOrNothing", value: 3 },
      { curiosity: "allOrNothing", slider: "about", value: "themselves" },
      { curiosity: "shame", value: 3, weight: 60 },
    ]);

  S("the-hero-of-their-own-story", "The hero of their own story", "mindset",
    "He tells everyone he is the hero, sees people as all good or all bad, and acts on instinct before anyone can argue.",
    [
      { curiosity: "selfStory", value: 5 },
      { curiosity: "selfStory", slider: "role", value: "the hero" },
      { curiosity: "selfStory", slider: "retells", value: "to anyone who listens" },
      { curiosity: "allOrNothing", value: 4 },
      { curiosity: "allOrNothing", slider: "about", value: "other people" },
      { curiosity: "thinkOrLeap", value: "pure instinct" },
      { curiosity: "theLie", value: 3, weight: 60 },
    ]);

  S("the-silent-room", "The silent room", "herd",
    "Everyone at the table disagrees with the boss, nobody says so, and his right hand stands just behind him, watching.",
    [
      { curiosity: "quietMajority", value: 5 },
      { curiosity: "quietMajority", slider: "why", value: "fear" },
      { curiosity: "quietMajority", slider: "shot", value: "a slow pan along all of them" },
      { curiosity: "rightHand", value: 4 },
      { curiosity: "rightHand", slider: "shadow", value: "stays behind" },
      { curiosity: "rightHand", slider: "doubts", value: "shown in a look" },
      { curiosity: "groupPressure", value: 4, weight: 60 },
    ]);

  S("getting-in", "Getting in", "herd",
    "The new kid takes the blame to pass the test, learns the inside joke, and is finally let in on it.",
    [
      { curiosity: "initiation", value: 4 },
      { curiosity: "initiation", slider: "kind", value: "taking the blame" },
      { curiosity: "initiation", slider: "result", value: "let in fully" },
      { curiosity: "insideJoke", value: 4 },
      { curiosity: "insideJoke", slider: "outsider", value: "an outsider is let in on it" },
      { curiosity: "insideJoke", slider: "kind", value: "a nickname" },
      { curiosity: "oddOneOut", value: 3, weight: 60 },
    ]);

  S("turning-on-one-of-their-own", "Turning on one of their own", "herd",
    "A rumor spreads, the group blames the one who spoke up, and everyone on the bus watches while nobody helps.",
    [
      { curiosity: "scapegoat", value: 5 },
      { curiosity: "scapegoat", slider: "who", value: "the one who spoke up" },
      { curiosity: "scapegoat", slider: "fault", value: "not their fault at all" },
      { curiosity: "bystanders", value: 4 },
      { curiosity: "bystanders", slider: "looks", value: "away" },
      { curiosity: "bystanders", slider: "helper", value: "the least likely person" },
      { curiosity: "rumor", value: 4, weight: 60 },
    ]);

  S("small-steps", "Small steps", "arc",
    "She asks for help for the first time, her brother notices she has changed, and she keeps the promise she made at the start.",
    [
      { curiosity: "firstStep", value: 4 },
      { curiosity: "firstStep", slider: "act", value: "asking for help" },
      { curiosity: "firstStep", slider: "after", value: "another step follows" },
      { curiosity: "othersNotice", value: 3 },
      { curiosity: "othersNotice", slider: "first", value: "a family member" },
      { curiosity: "othersNotice", slider: "reaction", value: "proud" },
      { curiosity: "selfVow", value: 3 },
      { curiosity: "selfVow", slider: "ends", value: "kept" },
      { curiosity: "changeShows", value: 3, weight: 60 },
    ]);

  S("the-act-that-became-real", "The act that became real", "arc",
    "He fakes being sober to win her back, the act slowly becomes real, and by the end he wants her happiness more than he wants her.",
    [
      { curiosity: "falseChange", value: 4 },
      { curiosity: "falseChange", slider: "why", value: "to win someone back" },
      { curiosity: "falseChange", slider: "becomesReal", value: "fully" },
      { curiosity: "goalSwap", value: 4 },
      { curiosity: "goalSwap", slider: "old", value: "being loved" },
      { curiosity: "goalSwap", slider: "newGoal", value: "someone's safety" },
      { curiosity: "othersNotice", value: 3 },
      { curiosity: "othersNotice", slider: "reaction", value: "suspicious" },
      { curiosity: "relapse", value: 2, weight: 60 },
    ]);

  S("the-lesson-passed-on", "The lesson passed on", "arc",
    "He breaks his promise never to go back, changes after it is too late to save his father, and passes the lesson to a child.",
    [
      { curiosity: "tooLateChange", value: 4 },
      { curiosity: "tooLateChange", slider: "lost", value: "a person" },
      { curiosity: "tooLateChange", slider: "left", value: "passing it on" },
      { curiosity: "tooLateChange", slider: "mood", value: "quietly hopeful" },
      { curiosity: "selfVow", value: 4 },
      { curiosity: "selfVow", slider: "vow", value: "never go back" },
      { curiosity: "selfVow", slider: "ends", value: "broken for good reason" },
      { curiosity: "wound", value: 3, weight: 60 },
    ], { also: ["emo-road"] });

  /* ---------- proximities ---------- */

  /* mind */
  P("self-story-feeds-lie", "When they cling to their role, the lie they believe grows", "mindset",
    "When the role they cast themself in grips tighter, the lie they believe grows within 2 beats.",
    { curiosity: "selfStory", change: "rises" }, { curiosity: "theLie", change: "rises" }, 2, { also: ["arc"] });
  P("victim-story-resentment", "When they cast themself as the victim, resentment grows", "mindset",
    "When the role they play is the victim, resentment rises within 3 beats.",
    { curiosity: "selfStory", slider: "role", is: "the victim" }, { curiosity: "resentment", change: "rises" }, 3, { also: ["emo-road"] });
  P("all-or-nothing-misreads", "When they think in black and white, they misread people", "mindset",
    "When the all or nothing thinking grows, misreading someone rises within 2 beats.",
    { curiosity: "allOrNothing", change: "rises" }, { curiosity: "misreading", change: "rises" }, 2);
  P("inner-putdowns-shame", "When the voice in their head puts them down, shame grows", "mindset",
    "When the voice from the past says put-downs, shame rises within a beat.",
    { curiosity: "innerVoice", slider: "says", is: "put-downs" }, { curiosity: "shame", change: "rises" }, 1, { also: ["emotion"] });
  P("talk-back-change-shows", "When they talk back to the voice for good, the change shows", "mindset",
    "When they finally talk back to the voice for good, how the change shows rises within 2 beats.",
    { curiosity: "innerVoice", slider: "answers", is: "talks back for good" }, { curiosity: "changeShows", change: "rises" }, 2, { also: ["arc"] });
  P("frozen-thinking-replays", "When they freeze by thinking, they replay it later", "mindset",
    "When they are frozen by thinking and the chance passes, replaying the moment rises within 3 beats.",
    { curiosity: "thinkOrLeap", is: "frozen by thinking" }, { curiosity: "replaying", change: "rises" }, 3);
  P("worst-case-dread", "When they imagine the worst, dread fills the scene", "mindset",
    "When the imagined disaster grows, dread rises within a beat.",
    { curiosity: "expectWorst", change: "rises" }, { curiosity: "dread", change: "rises" }, 1, { also: ["emo-road"] });
  P("worst-case-much-better-relief", "When it turns out much better, relief floods in", "mindset",
    "When the real thing turns out much better than they feared, relief rises within a beat.",
    { curiosity: "expectWorst", slider: "reality", is: "much better" }, { curiosity: "relief", change: "rises" }, 1, { also: ["emotion"] });
  P("replay-guilt", "When they keep replaying it, guilt grows", "mindset",
    "When they get more stuck replaying the moment, guilt rises within 2 beats.",
    { curiosity: "replaying", change: "rises" }, { curiosity: "guilt", change: "rises" }, 2, { also: ["emo-road"] });

  /* group */
  P("quiet-majority-pressure", "When most keep quiet, the pressure grows", "herd",
    "When more of the group stays silent, group pressure rises within a beat.",
    { curiosity: "quietMajority", change: "rises" }, { curiosity: "groupPressure", change: "rises" }, 1);
  P("one-voice-crowd-turns", "When one voice breaks the silence, the crowd turns", "herd",
    "When one voice breaks the quiet, the crowd turning rises within 2 beats.",
    { curiosity: "quietMajority", slider: "breaks", is: "one voice breaks it" }, { curiosity: "crowdTurns", change: "rises" }, 2);
  P("inside-joke-shuts-out", "When the joke shuts someone out, they stand out more", "herd",
    "When an outsider is shut out of the inside joke, how much they don't fit rises within a beat.",
    { curiosity: "insideJoke", slider: "outsider", is: "an outsider is shut out" }, { curiosity: "oddOneOut", change: "rises" }, 1, { also: ["comedy-mix"] });
  P("cruel-test-guilt", "When the way in is a cruel act, guilt follows", "herd",
    "When the test to get in is a cruel act, guilt rises within 2 beats.",
    { curiosity: "initiation", slider: "kind", is: "a cruel act" }, { curiosity: "guilt", change: "rises" }, 2, { also: ["emo-road"] });
  P("leader-strong-right-hand", "When the leader grows stronger, the right hand grows more loyal", "herd",
    "When one voice leads the herd, the right hand's loyalty rises within a beat.",
    { curiosity: "herdLeader", is: "one voice" }, { curiosity: "rightHand", change: "rises" }, 1);
  P("right-hand-doubts-leader-falls", "When the right hand doubts out loud, the leader weakens", "herd",
    "When the right hand says their doubts out loud, the hold of the one leader drops within 2 beats.",
    { curiosity: "rightHand", slider: "doubts", is: "said out loud" }, { curiosity: "herdLeader", change: "drops" }, 2);
  P("unlikely-helper-wins-them", "When the least likely person helps, the others follow", "herd",
    "When the least likely person breaks the freeze, the lone voice winning the others over rises within 2 beats.",
    { curiosity: "bystanders", slider: "helper", is: "the least likely person" }, { curiosity: "rallyingSpeech", change: "rises" }, 2);
  P("rumor-finds-scapegoat", "When a rumor spreads, the group finds someone to blame", "herd",
    "When the rumor spreads further, blaming one of their own rises within 2 beats.",
    { curiosity: "rumor", change: "rises" }, { curiosity: "scapegoat", change: "rises" }, 2);
  P("scapegoat-shame-later", "When the group feels shame later, guilt comes", "herd",
    "When the group feels shame later for the one it blamed, guilt rises within 3 beats.",
    { curiosity: "scapegoat", slider: "group", is: "feels shame later" }, { curiosity: "guilt", change: "rises" }, 3, { also: ["emo-road"] });
  P("bystander-shame", "When everyone just watches, shame follows", "herd",
    "When the watchers stay frozen, shame rises within 3 beats.",
    { curiosity: "bystanders", change: "rises" }, { curiosity: "shame", change: "rises" }, 3, { also: ["emotion"] });

  /* change */
  P("wound-makes-vow", "When the old wound is deeper, the promise to themself is stronger", "arc",
    "When the old wound weighs more, the promise they made to themself grows within 2 beats.",
    { curiosity: "wound", change: "rises" }, { curiosity: "selfVow", change: "rises" }, 2);
  P("first-step-hope", "When they take a brave first step, hope rises", "arc",
    "When the first small step takes more courage, hope rises within a beat.",
    { curiosity: "firstStep", change: "rises" }, { curiosity: "hope", change: "rises" }, 1, { also: ["emo-road"] });
  P("first-step-back-relapse", "When they step back after the first step, they slip", "arc",
    "When they step back after the first step, slipping back rises within a beat.",
    { curiosity: "firstStep", slider: "after", is: "they step back" }, { curiosity: "relapse", change: "rises" }, 1);
  P("fake-change-test", "When the change is only for show, a test comes", "arc",
    "When more of the change is an act, the test that exposes it grows within 3 beats.",
    { curiosity: "falseChange", change: "rises" }, { curiosity: "arcTest", change: "rises" }, 3);
  P("noticed-change-shows", "When others notice, the change shows more", "arc",
    "When more people notice the change, how the change shows rises within a beat.",
    { curiosity: "othersNotice", change: "rises" }, { curiosity: "changeShows", change: "rises" }, 1);
  P("pulled-back-relapse", "When others pull them back, they slip", "arc",
    "When the people around them pull them back to who they were, slipping back rises within 2 beats.",
    { curiosity: "othersNotice", slider: "pushback", is: "pulling them back" }, { curiosity: "relapse", change: "rises" }, 2, { also: ["herd"] });
  P("empty-win-realization", "When winning feels empty, they see it", "arc",
    "When they win the old goal and find it empty, the moment they see it rises within a beat.",
    { curiosity: "goalSwap", slider: "trigger", is: "winning and finding it empty" }, { curiosity: "realization", change: "rises" }, 1);
  P("vow-broken-no-return", "When they break the promise for good reason, there is no going back", "arc",
    "When the promise is broken for good reason, no going back rises within a beat.",
    { curiosity: "selfVow", slider: "ends", is: "broken for good reason" }, { curiosity: "pointOfNoReturn", change: "rises" }, 1, { also: ["plot"] });
  P("too-late-grief", "When the change comes too late, grief deepens", "arc",
    "When the change comes later and later, grief rises within 2 beats.",
    { curiosity: "tooLateChange", change: "rises" }, { curiosity: "grief", change: "rises" }, 2, { also: ["emo-road"] });

  /* ---------- proximity suites ---------- */

  PS("the-voice-in-the-head", "The voice in the head", "mindset",
    "The voice puts them down and shame grows, they freeze and replay the moment, guilt follows, until they talk back for good.",
    ["inner-putdowns-shame", "frozen-thinking-replays", "replay-guilt", "talk-back-change-shows"], { also: ["arc"] });
  PS("thinking-traps", "Thinking traps", "mindset",
    "The role they cling to feeds their lie, black and white thinking misreads people, and the worst they imagine fills the room with dread.",
    ["self-story-feeds-lie", "all-or-nothing-misreads", "worst-case-dread", "victim-story-resentment"]);
  PS("silence-in-the-crowd", "Silence in the crowd", "herd",
    "Most keep quiet and the pressure grows, a rumor finds someone to blame, then the least likely person helps and the crowd turns.",
    ["quiet-majority-pressure", "rumor-finds-scapegoat", "unlikely-helper-wins-them", "one-voice-crowd-turns"]);
  PS("changing-for-real", "Changing for real", "arc",
    "A brave first step brings hope, others notice, some pull them back, and a fake change gets tested until it is real.",
    ["first-step-hope", "noticed-change-shows", "pulled-back-relapse", "fake-change-test"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
