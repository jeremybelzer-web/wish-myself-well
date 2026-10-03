/* data/db-depth-story.js: story momentum, deeper. 25 curiosities across personal plot (what starts it all, things
   get worse, the reversal, a choice with a cost, no going back, the other side's move, the forgotten plant,
   showing the plan), character arc (a mentor's lesson, the mirror character, the moment they see it, giving it up),
   focus (where the eye goes first, the object we keep seeing, a view we cannot trust, what we do not see, the
   camera staying too long), mindset (blind spot, talking themselves into it, misreading someone, seeing signs) and
   the herd (the crowd turns, the lone voice wins them over, copying the others, a rumor spreads). Each has its own
   graded sliders and a momentum note, and each is tied into at least one proximity and one suite. Loaded after
   db-heart.js. Written 2026-10-03 by the depth thread. */
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

  /* ---------- Personal plot ---------- */

  c("incitingEvent", "What starts it all", "plot",
    "The event that knocks the character's normal life off balance and starts the story moving: a message, a death, a meeting, an offer.",
    [
      ["jolt", "How hard it hits", [0, 5], "How strongly the event shakes up their normal life."],
      ["when", "When it happens", [0, 30, "minutes"], "How many minutes into the film the event lands. Most films land it in the first fifteen."],
      ["kind", "What happens", ["a message", "a death", "a meeting", "a loss", "a discovery", "an offer"], "What kind of event starts it all.", U],
      ["refused", "Their first answer", ["jumps in", "hesitates", "refuses at first", "refuses twice"], "How the character first reacts to the call. Saying no at first makes the yes mean more."],
      ["seenBy", "Who knows about it", ["only them", "a few", "everyone"], "How many people in the story know the event happened."],
    ],
    [5, "Starts the main chase of the film: everything after it is an answer to it.", "Shows what the character's normal life was missing.", "We want to know what they will do about it.", "plot", "Have the letter arrive in the first five minutes, and have your lead tear it up unread."]);

  c("complication", "Things get worse", "plot",
    "A new problem lands on top of the old one and makes the goal harder to reach. Each one raises the stakes a little more.",
    [
      ["weight", "How much harder it gets", [0, 5], "How much the new problem makes the goal harder to reach."],
      ["source", "Where it comes from", ["bad luck", "their own mistake", "an enemy", "a friend", "the world"], "Who or what causes the new problem.", U],
      ["pileUp", "Problems at once", [1, 6], "How many problems they are juggling at the same time."],
      ["timing", "When it lands", ["at the start", "in the middle", "just when it was going well", "at the worst moment"], "When in the scene the new problem lands. Right after a win hurts the most."],
      ["solvable", "Can it be fixed", ["easily fixed", "fixable at a cost", "barely", "not at all"], "How hard the new problem is to solve."],
    ],
    [4, "Pushes the goal further away, so the character has to try harder.", "Tests how badly they want it.", "We lean in to see how they get out of this one.", "plot", "Just as your lead solves the first problem, have the car keys snap off in the lock."]);

  c("reversal", "The reversal", "plot",
    "The situation suddenly flips: winning turns to losing, the friend turns out to be the enemy, the plan works against them.",
    [
      ["flip", "How big the flip", [0, 5], "How completely the situation turns around."],
      ["direction", "Which way it flips", ["good to bad", "both ways", "bad to good"], "Whether things get worse, better, or swing both ways.", U],
      ["seenComing", "Could we see it coming", ["totally sudden", "a faint hint", "clearly hinted", "expected"], "How much the film hinted at the flip before it happened."],
      ["cause", "What causes it", ["their own act", "another person", "bad luck", "a discovery"], "What turns things around.", U],
      ["lasting", "Scenes it changes", [0, 20, "scenes"], "How many scenes after it play differently because of the flip."],
    ],
    [5, "Turns the story in a new direction, so the old plan no longer works.", "Shows that what looked true was not the whole truth.", "We need to see how they deal with the new world.", "plot", "Let the hero win the argument, then reveal in the next shot that winning was exactly what the rival wanted."]);

  c("costlyChoice", "A choice with a cost", "plot",
    "The character has to choose, and either way they lose something. The harder the choice, the more it shows who they are.",
    [
      ["cost", "What it costs", [0, 5], "How much they lose whichever way they choose."],
      ["kind", "Kind of choice", ["two good things", "two bad things", "what they want against what is right", "themselves against others"], "What the two sides of the choice are.", U],
      ["time", "Time to decide", ["no time", "minutes", "days", "all the time they want"], "How long they have to make up their mind."],
      ["shown", "How we see them decide", ["off screen", "in a moment", "a long struggle"], "How much of the deciding the film lets us watch."],
      ["undo", "Can it be undone", ["easily undone", "hard to undo", "can never undo"], "Whether they can take the choice back later."],
    ],
    [5, "The choice sends the story down one road and closes the other.", "What they give up tells us what they value most.", "We want to see if they will live with it.", "thought", "Make your lead choose between catching the train and helping a stranger, and let the train leave."]);

  c("pointOfNoReturn", "No going back", "plot",
    "The character crosses a line and cannot return to their old life: a door shuts, a secret is told, a crime is done.",
    [
      ["finality", "How final it is", [0, 5], "How completely the old life is closed off."],
      ["line", "What line they cross", ["a door shut", "a secret told", "a crime", "a promise", "leaving home"], "What the crossing is.", U],
      ["willing", "How willingly", ["pushed", "tricked", "unsure", "chose it freely"], "Whether they were forced over the line or stepped over it themselves."],
      ["witnesses", "People who see it", [0, 20], "How many people watch them cross it."],
      ["place", "When in the film", [0, 100, "%"], "How far into the film they cross the line. Often near the middle."],
    ],
    [5, "Locks the character into the story: from here they have to see it through.", "Shows that some choices change us for good.", "We know they cannot turn back, so we have to follow.", "plot", "Show the door locking behind your lead, and have them throw the key away."]);

  c("opponentMove", "The other side makes a move", "plot",
    "The rival, the villain or the system pushes their own plan forward, so the hero is no longer the only one acting.",
    [
      ["threat", "How dangerous the move", [0, 5], "How much harm the move can do to the hero."],
      ["seen", "Who sees the move", ["unseen", "hinted", "shown to us", "shown to the hero"], "Whether we, the hero, or nobody gets to see it happen."],
      ["smart", "How clever", ["clumsy", "fair", "clever", "one step ahead"], "How smart the move is next to the hero's plan."],
      ["distance", "How close they get", ["far away", "closing in", "at the door", "in the room"], "How close the other side gets to the hero."],
      ["who", "Who is on the other side", ["a villain", "a rival", "a system", "nature", "a friend"], "Who makes the move.", U],
    ],
    [4, "Keeps pressure on the hero from outside, so the plot never stands still.", "Shows the two sides of the film's argument.", "We fear what the other side will do next.", "plot", "Cut away from the hero's plan to show the rival quietly reading the same map."]);

  c("plantForgotten", "The forgotten plant", "plot",
    "A small detail shown early (an object, a line, a skill) that the audience forgets until it suddenly matters. A plant is the setup; the payoff is when it comes back.",
    [
      ["buried", "How well hidden", [0, 5], "How hard it is to notice the detail the first time."],
      ["kind", "What is planted", ["an object", "a line", "a skill", "a place", "a habit"], "What the early detail is.", U],
      ["showings", "Times shown before the payoff", [1, 5], "How often we see the detail before it pays off. Once is easiest to forget."],
      ["gap", "Minutes until it pays off", [1, 90, "minutes"], "How long between the plant and the payoff."],
      ["disguise", "How it is disguised", ["shown plainly", "hidden in a joke", "hidden in action", "hidden in the background"], "What draws our eye away from the plant.", U],
      ["payoffSize", "How big the payoff", [0, 5], "How much the detail changes things when it returns."],
    ],
    [3, "Gives a later turn a hidden reason, so it feels earned and not lucky.", "Shows that small things matter.", "When it comes back we want to rewind and watch again.", "visual", "Have your lead fiddle with a lighter in a joke early on, then let that lighter save them at the end."]);

  c("planShown", "Showing the plan", "plot",
    "The characters lay out their plan before they do it. An old rule: the more of the plan we hear, the more likely it goes wrong.",
    [
      ["shown", "How much of the plan we hear", [0, 5], "How much of the plan is explained to us beforehand."],
      ["works", "How it goes", ["goes perfectly", "small hiccups", "goes wrong", "falls apart"], "How closely the real thing follows the plan."],
      ["told", "How it is told", ["a quick line", "a talk", "a drawing on a table", "a montage"], "How the plan is shared with us. A montage is a quick string of short shots.", U],
      ["hidden", "Part kept from us", ["nothing hidden", "a small trick", "a secret part", "the real plan is hidden"], "How much of the plan the film keeps secret until it happens."],
      ["steps", "Steps in the plan", [1, 10], "How many steps the plan has."],
    ],
    [4, "Sets up what should happen, so every change from it feels like news.", "Shows the gap between what we plan and what life does.", "We watch to see which step breaks first.", "plot", "Have the team explain the plan over a map, then cut straight to the first step going wrong."]);

  /* ---------- Character arc ---------- */

  c("mentorLesson", "A mentor's lesson", "arc",
    "An older or wiser character teaches the hero something. The hero may ignore it at first, but it comes back when it matters most.",
    [
      ["weight", "How much the lesson matters", [0, 5], "How important the lesson is to the hero's journey."],
      ["heard", "How it is taken at first", ["ignored", "half heard", "understood", "lived by"], "How well the hero takes the lesson when it is first given."],
      ["returns", "When it comes back", ["never", "once", "at the key moment", "again and again"], "When the lesson returns in the hero's mind or actions."],
      ["form", "How it is taught", ["told", "shown", "a story", "a test"], "How the mentor passes the lesson on.", U],
      ["mentorFate", "What happens to the mentor", ["stays", "leaves", "fails them", "dies"], "What becomes of the mentor after the lesson.", U],
    ],
    [3, "Gives the hero the tool they will need at the end.", "Often says the theme out loud, early.", "We wait for the moment the lesson will be needed.", "audio", "Let the mentor say one simple line early, then have the hero whisper it at the worst moment."]);

  c("foil", "The mirror character", "arc",
    "A character who shows the hero who they could become: someone with the same start who took a different road.",
    [
      ["likeness", "How alike they are", [0, 5], "How much the two share: past, skills, wants."],
      ["path", "Road they took", ["the dark road", "the easy road", "the brave road", "stayed stuck"], "Which road the mirror character took.", U],
      ["scenes", "Scenes together", [0, 20], "How many scenes the two share."],
      ["seen", "When the hero sees it", ["never", "slowly", "in one moment"], "How the hero comes to see themself in the other."],
      ["clash", "How much they clash", [0, 5], "How hard the two push against each other."],
    ],
    [3, "Shows the hero a future to run toward or away from.", "Two people, one question, two answers: the theme in two bodies.", "We watch to see which road the hero will take.", "visual", "Put the hero and the mirror character in the same pose in the same doorway, scenes apart."]);

  c("realization", "The moment they see it", "arc",
    "The moment a character finally understands something about themselves or their life that they could not see before.",
    [
      ["clarity", "How clearly they see it", [0, 5], "How fully they understand once it hits."],
      ["trigger", "What sets it off", ["a word", "an object", "a memory", "a mistake", "another's pain"], "What makes them see it.", U],
      ["speed", "How fast it comes", ["slow dawning", "a few beats", "all at once"], "Whether understanding creeps in or hits like a wave."],
      ["shown", "How we see it", ["only a look", "a small act", "said out loud"], "How the film shows us they understand."],
      ["late", "How late in the film", [0, 100, "%"], "How far into the film the moment comes."],
    ],
    [4, "Turns the hero around, so their next choices are different.", "This is often where the theme lands for the character.", "We want to see what they will do now that they know.", "thought", "Hold on your lead's face for a full beat after someone says the one word that changes everything."]);

  c("sacrifice", "Giving it up", "arc",
    "The character gives up something they wanted, to prove they have changed or to save someone else.",
    [
      ["size", "How much they give up", [0, 5], "How much the thing they give up meant to them."],
      ["what", "What they give up", ["a prize", "a dream", "a love", "their safety", "their pride"], "What the sacrifice is.", U],
      ["forWhom", "For whom", ["themselves", "a friend", "a stranger", "everyone"], "Who the sacrifice helps.", U],
      ["known", "Who knows", ["nobody knows", "the one they help", "everyone"], "Who learns about the sacrifice."],
      ["regret", "Regret after", ["none", "a pang", "a lasting ache"], "How much it hurts them afterwards."],
    ],
    [4, "Proves the change is real, so the ending feels earned.", "Shows what the character now values above themselves.", "We hold our breath to see if they will really let it go.", "movement", "Have your lead slide the prize across the table to their rival without a word."]);

  /* ---------- Focus ---------- */

  c("eyeFirst", "Where the eye goes first", "focus",
    "The first place the audience looks when a shot appears. Brightness, movement, faces and sharp focus pull the eye.",
    [
      ["pull", "How strong the pull", [0, 5], "How hard the shot steers the eye to one place."],
      ["by", "What pulls the eye", ["brightness", "movement", "a face", "color", "lines that point", "sharp focus"], "What draws the audience's eye first.", U],
      ["place", "Where in the frame", ["left", "center", "right"], "Where the thing that pulls the eye sits in the picture.", U],
      ["rivals", "Things competing", [0, 4], "How many other things fight for the eye."],
      ["holdTime", "Time before the eye moves on", [0.5, 5, "seconds", 0.5], "How long the eye stays there before it wanders."],
    ],
    [2, "Makes sure the audience sees the one thing the story needs them to see.", "What the film shows first is what it thinks matters.", "We follow where the film leads us to look.", "visual", "Put the only bright thing in a dark shot on the letter your lead has not opened."]);

  c("returningObject", "The object we keep seeing", "focus",
    "An object the camera keeps coming back to, so we feel it matters before we know why.",
    [
      ["returns", "Times we come back to it", [1, 10], "How many times the camera returns to the object."],
      ["object", "What it is", ["a photo", "a gun", "a key", "a letter", "a toy", "a ring"], "The object itself.", U],
      ["meaning", "What it means", ["just a thing", "a hint", "a symbol", "the key to the story"], "How much the object stands for."],
      ["size", "How big in the frame", ["in the background", "in a corner", "center of the frame", "fills the screen"], "How much of the picture the object takes up."],
      ["shifts", "How it changes", ["stays the same", "moves", "gets damaged", "is gone"], "Whether the object changes between visits. A change tells us the story moved."],
    ],
    [3, "Ties scenes together and promises the object will matter.", "An object can carry a memory or an idea through the whole film.", "Each return makes us ask: why does the film keep showing us this?", "visual", "Show the same photo on the fridge in three scenes; in the fourth, have it gone."]);

  c("unreliableView", "A view we cannot trust", "focus",
    "The story is told through someone, or something, that gets it wrong: they lie, forget, or are confused, and we believe them at first.",
    [
      ["doubt", "How untrustworthy", [0, 5], "How far the view is from what really happened."],
      ["why", "Why it is wrong", ["they lie", "they forget", "they are confused", "they are dreaming", "they are unwell"], "The reason the view cannot be trusted.", U],
      ["clues", "Clues that something is off", [0, 8], "How many small signs hint we are being misled."],
      ["caught", "When we find out", ["never", "near the end", "midway", "early"], "When the audience learns the view was wrong."],
      ["who", "Whose view", ["a narrator", "the camera itself", "the main character", "a witness"], "Who or what tells us the story.", U],
    ],
    [3, "Hides the real story under a false one, ready to be uncovered.", "Shows how memory and belief bend the truth.", "We start to doubt everything and watch closer.", "thought", "Let the narrator say the room was empty while a figure stands clearly in the corner."]);

  c("offscreen", "What we do not see", "focus",
    "The camera keeps something out of the picture, so we have to imagine it. What we imagine is often stronger than what could be shown.",
    [
      ["hidden", "How much is kept out", [0, 5], "How much of the important thing stays out of sight."],
      ["hint", "What hints at it", ["nothing", "a sound", "a shadow", "a reaction", "a glimpse"], "How the film lets us know something is there."],
      ["shownLater", "When it is shown", ["never", "at the end", "later", "soon"], "When, if ever, the film finally shows it."],
      ["reactionTime", "Time on the faces watching", [0, 10, "seconds"], "How long the camera stays on the people looking at it instead."],
      ["what", "What is hidden", ["violence", "a monster", "a person", "a gift", "a face"], "What the camera keeps out.", U],
    ],
    [2, "Builds a question the film can answer later.", "Shows that fear and wonder live in what we cannot see.", "We want to see it, so we keep watching.", "audio", "Keep the camera on the lead's face as they open the box, and only play the sound of what is inside."]);

  c("lingeringShot", "The camera stays too long", "focus",
    "The shot holds after the action is done. The extra seconds tell us something here matters, even if we cannot say what.",
    [
      ["overstay", "Extra seconds held", [0, 10, "seconds"], "How long the shot stays after the action ends."],
      ["on", "What it stays on", ["an empty room", "a face", "an object", "a door", "a window"], "What the camera keeps looking at.", U],
      ["sound", "Sound under it", ["silence", "room sound", "a sound we cannot place", "music swells"], "What we hear while the shot holds."],
      ["moves", "Camera move", ["still", "slow drift", "slow push in"], "Whether the camera stays still or creeps."],
      ["meaning", "What it hints", ["none yet", "a feeling", "a warning", "a clue"], "What the extra time is telling us."],
    ],
    [2, "Plants a feeling or a clue that later scenes can use.", "Lets the film think out loud for a moment.", "The extra seconds make us uneasy and curious.", "visual", "After everyone leaves the room, hold on the empty chair for five more seconds."]);

  /* ---------- Perspective and mindset ---------- */

  c("blindSpot", "Blind spot", "mindset",
    "Something everyone around the character can see, except them: their own flaw, a danger, someone's love.",
    [
      ["size", "How big the blind spot", [0, 5], "How much the thing they cannot see matters."],
      ["about", "What they cannot see", ["their flaw", "a danger", "someone's love", "a betrayal", "their own talent"], "What the blind spot hides from them.", U],
      ["seers", "People who can see it", [0, 10], "How many other characters see what they cannot."],
      ["hints", "Times others try to tell them", [0, 8], "How often someone tries to point it out."],
      ["opens", "How it opens", ["never", "slowly", "in one blow"], "How they finally see it, if they ever do."],
    ],
    [3, "Sets up a fall or a surprise that the audience sees coming.", "Shows how we miss what is closest to us.", "We want to shout at the screen and wait for them to see.", "thought", "Have three friends try to warn your lead, and have your lead change the subject each time."]);

  c("excuses", "Talking themselves into it", "mindset",
    "A character builds reasons to do what they already want to do, one small excuse at a time.",
    [
      ["excuseStrength", "How strong the excuse", [0, 5], "How convincing the reasons sound, even to us."],
      ["doing", "What they talk themselves into", ["something small", "something wrong", "something dangerous", "something cruel"], "How bad the thing is that they talk themselves into."],
      ["voice", "Where we hear it", ["in their head", "to a friend", "out loud alone", "to us"], "How we hear the excuses.", U],
      ["believe", "Do they believe it", ["not at all", "half", "fully"], "How much they believe their own excuse."],
      ["steps", "Little steps to get there", [1, 6], "How many small excuses it takes."],
    ],
    [3, "Moves the character toward a bad choice step by step.", "Shows how good people do wrong things.", "We see the trap and want to know if they will stop.", "audio", "Let your lead list three reasons out loud, each one shakier than the last, then do it anyway."]);

  c("misreading", "Misreading someone", "mindset",
    "A character jumps to the wrong idea about another person: they take kindness as a trick, or a joke as an insult.",
    [
      ["wrongness", "How wrong they are", [0, 5], "How far their idea is from the truth."],
      ["reads", "What they get wrong", ["kindness as a trick", "love as pity", "a joke as an insult", "fear as anger", "a friend as an enemy"], "The mistake they make about the other person.", U],
      ["clues", "Clues they miss", [0, 6], "How many signs of the truth they walk past."],
      ["acts", "What they do about it", ["does nothing", "pulls away", "says something hurtful", "strikes back"], "How they act on the wrong idea."],
      ["cleared", "When it is cleared up", ["never", "late", "soon"], "When they learn they were wrong."],
    ],
    [3, "Creates conflict that did not need to happen, so the plot grows from a mistake.", "Shows how fear shapes what we see in others.", "We know the truth and wait for them to catch up.", "thought", "Have your lead overhear half a sentence and walk away before the kind half is said."]);

  c("readingSigns", "Seeing signs everywhere", "mindset",
    "A character sees meaning in chance things (a number, an animal, the weather) and lets them steer their choices.",
    [
      ["belief", "How much they believe the signs", [0, 5], "How seriously they take the signs."],
      ["sign", "What the sign is", ["a number", "an animal", "the weather", "a song", "a stranger"], "What they read meaning into.", U],
      ["count", "Signs in the film", [0, 10], "How many signs show up across the story."],
      ["right", "Are the signs right", ["always wrong", "mixed", "sometimes right", "always right"], "Whether the signs turn out to mean anything."],
      ["acts", "What they do with them", ["ignores them", "notes them", "changes plans", "lives by them"], "How much the signs change what they do."],
    ],
    [2, "Lets chance steer the story through the character's belief.", "Asks whether life has a plan or we make one up.", "We watch for the next sign along with them.", "visual", "Have a crow land on the fence each time your lead is about to make a choice."]);

  /* ---------- Herd mentality ---------- */

  c("crowdTurns", "The crowd turns", "herd",
    "The moment a group switches sides all at once: cheers become boos, friends become a mob.",
    [
      ["turn", "How hard it turns", [0, 5], "How completely the crowd switches sides."],
      ["trigger", "What turns them", ["a speech", "a lie", "a rumor", "a shock", "one brave act"], "What makes the crowd change its mind.", U],
      ["first", "Who turns first", ["one person", "a few", "a leader", "all at once"], "Who starts the switch.", U],
      ["speed", "How fast it spreads", [0, 30, "seconds"], "How long it takes the switch to run through the crowd."],
      ["against", "Who they turn on", ["the hero", "the villain", "an outsider", "their own leader"], "Who the crowd turns against.", U],
    ],
    [4, "Changes who has power in the story in one moment.", "Shows how quickly a group can change its mind.", "We fear what the crowd will do next.", "audio", "Let one person stop clapping, then another, until the whole room is silent and staring."]);

  c("rallyingSpeech", "The lone voice wins them over", "herd",
    "One person stands against the group and, with words, proof or a brave act, wins them over.",
    [
      ["win", "How well it works", [0, 5], "How completely the group comes around."],
      ["tool", "What wins them", ["a speech", "proof", "a brave act", "a joke", "a sacrifice"], "What the lone voice uses to change minds.", U],
      ["start", "How the room starts", ["everyone against", "most against", "split"], "How much of the group is against them at first."],
      ["converts", "People won over", [0, 30], "How many people come around."],
      ["holdout", "Who still refuses", ["no one", "one", "a few", "the leader"], "Who stays against them to the end."],
    ],
    [4, "Turns the group from a wall into a team.", "Shows that one voice can change many.", "We hope the room will come around.", "audio", "Start the speech to a room of folded arms, and cut to one pair of arms unfolding."]);

  c("copying", "Copying the others", "herd",
    "People copy what the people around them do: a laugh, a choice, a cruelty. One does it, then the rest follow.",
    [
      ["copy", "How closely they copy", [0, 5], "How exactly people copy the first person."],
      ["what", "What gets copied", ["clothes", "words", "a laugh", "a choice", "a cruelty"], "What spreads from person to person.", U],
      ["who", "How many copy", ["one person", "a few", "most", "everyone"], "How far the copying spreads."],
      ["delay", "Time before they copy", [0, 5, "seconds"], "How long each person waits, glancing around, before they copy."],
      ["aware", "Do they know they copy", ["unaware", "half aware", "fully aware"], "Whether people notice they are following."],
    ],
    [2, "Shows how a group moves, so one act can set off many.", "Shows how easily we follow the crowd.", "We watch for who will copy next, and who will not.", "movement", "Have one person at the table put down their fork, then let everyone else do it a beat later."]);

  c("rumor", "A rumor spreads", "herd",
    "A story passes from person to person, changing as it goes, until it reaches the person it is about.",
    [
      ["spread", "How far it spreads", [0, 5], "How much of the group hears the rumor."],
      ["truth", "How true it is", ["completely false", "a twisted truth", "mostly true", "true"], "How close the rumor is to what really happened."],
      ["hops", "People it passes through", [1, 20], "How many people pass it on."],
      ["growth", "How it changes on the way", ["shrinks", "stays the same", "grows", "becomes a monster"], "Whether the story gets bigger as it travels."],
      ["reaches", "When the subject hears it", ["never", "late", "soon", "first"], "When the person the rumor is about finds out."],
    ],
    [3, "Spreads trouble the hero has to deal with, often before they know it exists.", "Shows how stories shape what people believe.", "We dread the moment it reaches the wrong ears.", "audio", "Show the rumor in five whispers, each one a little bigger, ending in the ear of the person it is about."]);

  /* ---------- suites ---------- */

  S("plan-goes-wrong", "The plan goes wrong", "plot",
    "The plan is laid out in full, then things pile up, it falls apart, and everything flips while the clock runs down.",
    [
      { curiosity: "planShown", value: 4 },
      { curiosity: "planShown", slider: "works", value: "falls apart" },
      { curiosity: "complication", value: 4 },
      { curiosity: "reversal", value: 4, weight: 80 },
      { curiosity: "tickingClock", value: "tight", weight: 70 },
    ]);

  S("crossing-the-line", "Crossing the line", "plot",
    "Something starts it all, the character makes a choice that costs them, and there is no going back once the stakes are clear.",
    [
      { curiosity: "incitingEvent", value: 4 },
      { curiosity: "costlyChoice", value: 4 },
      { curiosity: "pointOfNoReturn", value: 4 },
      { curiosity: "stakes", slider: "clear", value: "spelled out", weight: 70 },
    ]);

  S("enemy-closing-in", "Enemy closing in", "plot",
    "The other side moves closer while new problems land at the worst time, and the dread grows as the clock runs out.",
    [
      { curiosity: "opponentMove", value: 4 },
      { curiosity: "opponentMove", slider: "distance", value: "at the door" },
      { curiosity: "complication", slider: "timing", value: "at the worst moment" },
      { curiosity: "dread", value: 4, weight: 80 },
      { curiosity: "tickingClock", value: "seconds left", weight: 60 },
    ]);

  S("hidden-in-plain-sight", "Hidden in plain sight", "focus",
    "A detail is planted in the background, the camera keeps returning to it and lingers a little too long, and the audience is left holding a question.",
    [
      { curiosity: "plantForgotten", value: 4 },
      { curiosity: "returningObject", value: 4 },
      { curiosity: "lingeringShot", value: 4, weight: 80 },
      { curiosity: "openQuestions", value: 3, weight: 70 },
    ], { also: ["plot"] });

  S("guide-the-eye", "Guide the eye", "focus",
    "Every shot tells you where to look first: one bright, sharp thing, a frame built around it, and the same object coming back.",
    [
      { curiosity: "eyeFirst", value: 4 },
      { curiosity: "eyeFirst", slider: "rivals", value: 0 },
      { curiosity: "returningObject", slider: "size", value: "center of the frame", weight: 70 },
      { curiosity: "composition", slider: "leading", value: "strong", weight: 70 },
      { curiosity: "focusWidth", value: "one thing", weight: 60 },
    ]);

  S("trust-no-one", "Trust no one", "focus",
    "The story is told by someone who gets it wrong, the important thing stays out of sight, and the twist only lands near the end.",
    [
      { curiosity: "unreliableView", value: 4 },
      { curiosity: "unreliableView", slider: "caught", value: "near the end" },
      { curiosity: "offscreen", value: 3 },
      { curiosity: "misdirection", value: 4, weight: 80 },
      { curiosity: "knowledgeGap", value: "nobody (surprise)", weight: 60 },
    ]);

  S("mentor-road", "The mentor's road", "arc",
    "A lesson is ignored, the mentor is lost, and when the moment comes the hero sees it and gives something up.",
    [
      { curiosity: "mentorLesson", value: 4 },
      { curiosity: "mentorLesson", slider: "returns", value: "at the key moment" },
      { curiosity: "realization", value: 4 },
      { curiosity: "sacrifice", value: 4, weight: 80 },
      { curiosity: "arcTest", slider: "result", value: "pass", weight: 70 },
    ]);

  S("dark-mirror", "Dark mirror", "arc",
    "The hero meets someone just like them who took the dark road, fights them, and finally sees their own future in that face.",
    [
      { curiosity: "foil", value: 4 },
      { curiosity: "foil", slider: "path", value: "the dark road" },
      { curiosity: "realization", value: 3, weight: 80 },
      { curiosity: "resistance", value: 3, weight: 70 },
    ]);

  S("cannot-see-it", "Cannot see it", "mindset",
    "Everyone sees it but them: they misread the people who love them, believe an old lie, and the audience knows long before they do.",
    [
      { curiosity: "blindSpot", value: 4 },
      { curiosity: "misreading", value: 3 },
      { curiosity: "theLie", value: 3, weight: 70 },
      { curiosity: "knowledgeGap", value: "audience first", weight: 70 },
    ]);

  S("slippery-slope", "Slippery slope", "mindset",
    "One small excuse leads to the next, a costly choice gets made, and they cross a line they cannot come back from.",
    [
      { curiosity: "excuses", value: 4 },
      { curiosity: "excuses", slider: "steps", value: 5 },
      { curiosity: "costlyChoice", slider: "undo", value: "can never undo", weight: 80 },
      { curiosity: "pointOfNoReturn", value: 3, weight: 70 },
      { curiosity: "relapse", value: 3, weight: 60 },
    ], { also: ["arc"] });

  S("omens", "Omens", "mindset",
    "The character sees signs everywhere, the same object keeps turning up, and dread builds whether the signs are right or not.",
    [
      { curiosity: "readingSigns", value: 4 },
      { curiosity: "returningObject", slider: "meaning", value: "a symbol", weight: 70 },
      { curiosity: "dread", value: 3, weight: 70 },
    ]);

  S("mob-rule", "Mob rule", "herd",
    "A rumor spreads, people copy each other, the pressure builds, and the crowd turns on someone.",
    [
      { curiosity: "rumor", value: 4 },
      { curiosity: "copying", value: 4 },
      { curiosity: "crowdTurns", value: 4 },
      { curiosity: "groupPressure", value: 4, weight: 80 },
    ]);

  S("one-against-many", "One against many", "herd",
    "One person speaks up against the whole group, pays for it, and slowly wins the room over.",
    [
      { curiosity: "rallyingSpeech", value: 4 },
      { curiosity: "rallyingSpeech", slider: "start", value: "everyone against" },
      { curiosity: "dissenter", value: "openly defies" },
      { curiosity: "crowdTurns", slider: "trigger", value: "one brave act", weight: 70 },
    ]);

  /* ---------- proximities ---------- */

  P("inciting-raises-questions", "When something starts it all, the audience starts asking questions", "plot",
    "When the event that starts the story hits harder, the questions the audience is holding rise within 2 beats.",
    { curiosity: "incitingEvent", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 2);
  P("refused-call-stakes-rise", "When they refuse the call twice, the stakes rise", "plot",
    "When the character keeps saying no to what starts it all, the story raises what they stand to lose within 6 beats.",
    { curiosity: "incitingEvent", slider: "refused", is: "refuses twice" }, { curiosity: "stakes", change: "rises" }, 6);
  P("complication-tension", "When things get worse, tension climbs", "plot",
    "When a new problem makes the goal harder, tension rises within 2 beats.",
    { curiosity: "complication", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2);
  P("bad-timing-hope-drops", "When trouble lands just as it was going well, hope drops", "plot",
    "When a new problem lands right after a win, hope drops within 1 beat.",
    { curiosity: "complication", slider: "timing", is: "just when it was going well" }, { curiosity: "hope", change: "drops" }, 1);
  P("plan-told-falls-apart", "When the whole plan is told, it falls apart", "plot",
    "When we hear every step of the plan beforehand, it falls apart within 6 beats.",
    { curiosity: "planShown", is: 5 }, { curiosity: "planShown", slider: "works", is: "falls apart" }, 6);
  P("hidden-plan-reversal", "When the real plan is hidden, a reversal follows", "plot",
    "When part of the plan is kept from us, the situation flips when it is revealed within 6 beats.",
    { curiosity: "planShown", slider: "hidden", is: "the real plan is hidden" }, { curiosity: "reversal", change: "rises" }, 6);
  P("reversal-setback", "When things flip for the worse, the goal slips away", "plot",
    "When the reversal goes from good to bad, the character suffers a big setback within 1 beat.",
    { curiosity: "reversal", slider: "direction", is: "good to bad" }, { curiosity: "plotProgress", is: "big setback" }, 1);
  P("choice-cost-held-in", "When a choice costs a lot, the feeling is held in", "plot",
    "When the choice costs more, the feeling the character holds in rises within 4 beats.",
    { curiosity: "costlyChoice", change: "rises" }, { curiosity: "emotionalDebt", change: "rises" }, 4, { also: ["emo-road"] });
  P("choice-no-return", "When a choice can never be undone, there is no going back", "plot",
    "When the choice cannot be taken back, the line is crossed for good within 2 beats.",
    { curiosity: "costlyChoice", slider: "undo", is: "can never undo" }, { curiosity: "pointOfNoReturn", change: "rises" }, 2);
  P("no-return-stakes", "When there is no going back, the stakes rise", "plot",
    "When the character crosses a line for good, what they stand to lose rises within 2 beats.",
    { curiosity: "pointOfNoReturn", change: "rises" }, { curiosity: "stakes", change: "rises" }, 2);
  P("opponent-dread", "When the other side moves, dread grows", "plot",
    "When the other side's move gets more dangerous, dread rises within 2 beats.",
    { curiosity: "opponentMove", change: "rises" }, { curiosity: "dread", change: "rises" }, 2);
  P("opponent-shown-to-us", "When we see the other side's move, we know first", "plot",
    "When the film shows us the other side's move but not the hero, the audience knows first within 1 beat.",
    { curiosity: "opponentMove", slider: "seen", is: "shown to us" }, { curiosity: "knowledgeGap", is: "audience first" }, 1, { also: ["focus"] });
  P("opponent-at-door", "When the other side is at the door, things get worse", "plot",
    "When the other side gets close, new problems rise within 3 beats.",
    { curiosity: "opponentMove", slider: "distance", is: "at the door" }, { curiosity: "complication", change: "rises" }, 3);
  P("plant-big-reveal", "When a plant is well hidden, the reveal is bigger", "plot",
    "When the early detail is better hidden, the reveal it sets up is bigger within 6 beats.",
    { curiosity: "plantForgotten", change: "rises" }, { curiosity: "reveal", slider: "size", change: "rises" }, 6);
  P("planted-object-returns", "When an object is planted, the camera comes back to it", "focus",
    "When the planted detail is an object, the camera keeps returning to it within 8 beats.",
    { curiosity: "plantForgotten", slider: "kind", is: "an object" }, { curiosity: "returningObject", change: "rises" }, 8, { also: ["plot"] });

  P("lesson-passes-test", "When the lesson comes back at the key moment, the test is passed", "arc",
    "When the mentor's lesson returns just when it is needed, the hero passes the test within 2 beats.",
    { curiosity: "mentorLesson", slider: "returns", is: "at the key moment" }, { curiosity: "arcTest", slider: "result", is: "pass" }, 2);
  P("mentor-dies-grief", "When the mentor dies, grief follows", "arc",
    "When the mentor dies, grief rises within 2 beats.",
    { curiosity: "mentorLesson", slider: "mentorFate", is: "dies" }, { curiosity: "grief", change: "rises" }, 2, { also: ["emo-road"] });
  P("mirror-realization", "When the hero sees themself in the mirror character, they understand", "arc",
    "When the hero sees the likeness in one moment, the realization rises within 1 beat.",
    { curiosity: "foil", slider: "seen", is: "in one moment" }, { curiosity: "realization", change: "rises" }, 1);
  P("mirror-clash-resistance", "When the mirror character clashes harder, the hero fights the change", "arc",
    "When the two clash more, the hero's fight against changing rises within 3 beats.",
    { curiosity: "foil", slider: "clash", change: "rises" }, { curiosity: "resistance", change: "rises" }, 3);
  P("realization-sacrifice", "When they see it, they give something up", "arc",
    "When the realization is clearer, the sacrifice that follows is bigger within 4 beats.",
    { curiosity: "realization", change: "rises" }, { curiosity: "sacrifice", change: "rises" }, 4);
  P("sacrifice-change-shows", "When they give it up, the change shows", "arc",
    "When the sacrifice is bigger, the change in them shows more within 2 beats.",
    { curiosity: "sacrifice", change: "rises" }, { curiosity: "changeShows", change: "rises" }, 2);
  P("lie-blocks-realization", "When the lie grips harder, they cannot see the truth", "arc",
    "When the lie they believe grips harder, the moment of seeing it slips further away within 4 beats.",
    { curiosity: "theLie", change: "rises" }, { curiosity: "realization", change: "drops" }, 4, { also: ["mindset"] });

  P("sharp-focus-narrows", "When sharp focus pulls the eye, attention narrows to one thing", "focus",
    "When sharp focus is what pulls the eye, the film's attention narrows to one thing within 1 beat.",
    { curiosity: "eyeFirst", slider: "by", is: "sharp focus" }, { curiosity: "focusWidth", is: "one thing" }, 1);
  P("rivals-distract", "When too many things compete for the eye, distraction grows", "focus",
    "When more things fight for attention, the pull of distraction rises within 2 beats.",
    { curiosity: "eyeFirst", slider: "rivals", change: "rises" }, { curiosity: "distraction", change: "rises" }, 2);
  P("object-returns-questions", "When the camera keeps returning to an object, questions grow", "focus",
    "When the camera comes back to the same object more, the questions the audience holds rise within 4 beats.",
    { curiosity: "returningObject", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 4);
  P("linger-dread", "When the camera stays too long, dread creeps in", "focus",
    "When a shot holds longer after the action, dread rises within 2 beats.",
    { curiosity: "lingeringShot", change: "rises" }, { curiosity: "dread", change: "rises" }, 2);
  P("linger-uncovers-plant", "When the lingering shot hints at a clue, the plant is less hidden", "focus",
    "When the extra seconds point at a clue, the planted detail is easier to spot within 1 beat.",
    { curiosity: "lingeringShot", slider: "meaning", is: "a clue" }, { curiosity: "plantForgotten", change: "drops" }, 1);
  P("offscreen-dread", "When more is kept out of sight, dread grows", "focus",
    "When the camera keeps more of the important thing out of the picture, dread rises within 2 beats.",
    { curiosity: "offscreen", change: "rises" }, { curiosity: "dread", change: "rises" }, 2);
  P("unreliable-caught-reversal", "When we catch the false view near the end, everything flips", "focus",
    "When we learn near the end that the view was wrong, a reversal hits within 1 beat.",
    { curiosity: "unreliableView", slider: "caught", is: "near the end" }, { curiosity: "reversal", change: "rises" }, 1, { also: ["plot"] });
  P("unreliable-misdirects", "When the view gets less trustworthy, the misdirection grows", "focus",
    "When the view we follow drifts further from the truth, misdirection rises within 3 beats.",
    { curiosity: "unreliableView", change: "rises" }, { curiosity: "misdirection", change: "rises" }, 3);

  P("blind-spot-misreads", "When the blind spot grows, they misread people", "mindset",
    "When what they cannot see grows bigger, they misread the people around them within 3 beats.",
    { curiosity: "blindSpot", change: "rises" }, { curiosity: "misreading", change: "rises" }, 3);
  P("blind-spot-opens", "When the blind spot opens in one blow, they see it all", "mindset",
    "When the blind spot opens all at once, the realization rises within 1 beat.",
    { curiosity: "blindSpot", slider: "opens", is: "in one blow" }, { curiosity: "realization", change: "rises" }, 1, { also: ["arc"] });
  P("misread-strikes-back", "When they strike back at a misread friend, things get worse", "mindset",
    "When they strike back at someone they misread, new problems rise within 2 beats.",
    { curiosity: "misreading", slider: "acts", is: "strikes back" }, { curiosity: "complication", change: "rises" }, 2, { also: ["plot"] });
  P("excuses-slip-back", "When the excuses grow stronger, they slip back", "mindset",
    "When their excuses sound more convincing, slipping back into old ways rises within 4 beats.",
    { curiosity: "excuses", change: "rises" }, { curiosity: "relapse", change: "rises" }, 4, { also: ["arc"] });
  P("excuses-cross-line", "When they talk themselves into cruelty, there is no going back", "mindset",
    "When the excuses lead to something cruel, the line is crossed for good within 3 beats.",
    { curiosity: "excuses", slider: "doing", is: "something cruel" }, { curiosity: "pointOfNoReturn", change: "rises" }, 3);
  P("signs-dread", "When they believe the signs more, dread grows", "mindset",
    "When the character believes the signs more, dread rises within 3 beats.",
    { curiosity: "readingSigns", change: "rises" }, { curiosity: "dread", change: "rises" }, 3);
  P("signs-close-mind", "When they live by the signs, their mind closes", "mindset",
    "When the character lives by the signs, their mindset turns fixed within 4 beats.",
    { curiosity: "readingSigns", slider: "acts", is: "lives by them" }, { curiosity: "mindset", is: "fixed" }, 4);

  P("rumor-turns-crowd", "When a rumor spreads further, the crowd turns", "herd",
    "When the rumor reaches more people, the crowd turning rises within 4 beats.",
    { curiosity: "rumor", change: "rises" }, { curiosity: "crowdTurns", change: "rises" }, 4);
  P("rumor-monster-pressure", "When the rumor becomes a monster, the pressure builds", "herd",
    "When the rumor grows out of all proportion, group pressure rises within 3 beats.",
    { curiosity: "rumor", slider: "growth", is: "becomes a monster" }, { curiosity: "groupPressure", change: "rises" }, 3);
  P("copying-herd", "When people copy each other more, the herd moves as one", "herd",
    "When people copy each other more closely, herd mentality rises within 2 beats.",
    { curiosity: "copying", change: "rises" }, { curiosity: "herdMentality", change: "rises" }, 2);
  P("crowd-turns-dissenter", "When the crowd turns, someone speaks up", "herd",
    "When the crowd turns harder, one person speaks up against it within 3 beats.",
    { curiosity: "crowdTurns", change: "rises" }, { curiosity: "dissenter", is: "speaks up" }, 3);
  P("defiance-rallies", "When someone openly defies the group, they start to win them over", "herd",
    "When one person openly defies the group, their power to win the room rises within 4 beats.",
    { curiosity: "dissenter", is: "openly defies" }, { curiosity: "rallyingSpeech", change: "rises" }, 4);
  P("lone-voice-turns-crowd", "When the lone voice wins them over, the crowd turns", "herd",
    "When the lone voice works better, the crowd turns within 2 beats.",
    { curiosity: "rallyingSpeech", change: "rises" }, { curiosity: "crowdTurns", change: "rises" }, 2);

  /* ---------- proximity suites ---------- */

  PS("plan-to-pieces", "Plan to pieces", "plot",
    "The whole plan is told, it falls apart, the hidden part flips everything, and the goal slips away.",
    ["plan-told-falls-apart", "hidden-plan-reversal", "reversal-setback"]);
  PS("the-line-crossed", "The line crossed", "plot",
    "A costly choice is made, the feeling is held in, there is no going back, and the stakes rise.",
    ["choice-cost-held-in", "choice-no-return", "no-return-stakes"]);
  PS("enemy-at-the-door", "Enemy at the door", "plot",
    "The other side moves, dread grows, they reach the door, things get worse, tension climbs and hope drops.",
    ["opponent-dread", "opponent-at-door", "complication-tension", "bad-timing-hope-drops"]);
  PS("clue-in-plain-sight", "Clue in plain sight", "focus",
    "An object is planted, the camera keeps coming back to it, questions grow, a lingering shot gives it away, and the reveal lands.",
    ["planted-object-returns", "object-returns-questions", "linger-uncovers-plant", "plant-big-reveal"], { also: ["plot"] });
  PS("finally-seeing", "Finally seeing", "arc",
    "The blind spot opens, they understand, they give something up, and the change shows.",
    ["blind-spot-opens", "realization-sacrifice", "sacrifice-change-shows"], { also: ["mindset"] });
  PS("talked-into-it", "Talked into it", "mindset",
    "Excuses pile up, they slip back into old ways, and they talk themselves over a line they cannot uncross.",
    ["excuses-slip-back", "excuses-cross-line", "no-return-stakes"]);
  PS("rumor-to-rally", "From rumor to rally", "herd",
    "A rumor turns the crowd, one person speaks up, openly defies them, and wins the room back.",
    ["rumor-turns-crowd", "crowd-turns-dissenter", "defiance-rallies", "lone-voice-turns-crowd"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
