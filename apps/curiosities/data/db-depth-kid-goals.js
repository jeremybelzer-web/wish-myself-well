/* data/db-depth-kid-goals.js: goals by age, friend groups, the moments a kid realizes something, attraction, and God
   (Jeremy, 2026-10-08: "Kid goals: The Curiosity. The way that kids, just like adults, who are really motivated by a
   goal they really want are willing to put their body and their health on the line like it's nothing when the goal is
   tangible for them."). 15 curiosities, kept per character per scene like the belonging ones. Ideas already in the
   database (what they want against what they need, closer to the goal, driven or at peace, Cautious to Reckless,
   the group's approval, earning a place in the group, a mentor's lesson, taking care of their own body and mind, how
   the belief shows) are linked to, not repeated. His stories are episode seeds in the project's
   show-ideas/kid-goals-curiosities.md. Loaded after db-depth-alone.js. */
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

  const PER = { per: "character per scene", also: ["arc"] };

  /* ---------- goals by life stage ---------- */

  c("kidGoal", "Kid goals: body on the line for a goal they can touch", "plot",
    "When a goal feels real and close, people of any age put their body and health on the line like it's nothing: three nights with no sleep before a test, a dad wiring a cabin from videos. How old they are colors the goal, and kids often don't see how easily they could get hurt. Not \"What they want, against what they need\": this is how much of themselves they spend on it.",
    [
      ["risk", "What they'll risk for it", [0, 100, "%"], "0 risks nothing; 100 puts body and health on the line like it's nothing."],
      ["tangible", "How close the goal feels", ["a far-off dream", "someday", "within reach", "right in front of me"], "How real and touchable the goal is to them right now."],
      ["aware", "How aware they are of the danger", ["no idea", "a little", "knows but ignores it", "fully knows"], "Whether they see how easily they could get hurt."],
      ["watched", "Who's watching out for them", ["alone", "another kid", "a grown-up nearby", "a grown-up right beside them"], "Whether anyone is there to keep them safe."],
      ["age", "Their age", ["little kid", "pre-teen", "teenager", "young adult", "adult", "older person"], "How old they are, which colors what they go after."],
      ["cost", "What it costs them after", [0, 5], "The price the body pays the next day: the sore stomach, the lost sleep."],
    ],
    [3, "A goal worth any cost pushes a character into danger the audience sees before they do.", "Shows how wanting something makes a person forget their own body.", "We watch them get closer and fear what it will cost.", "plot", "Let him climb the rope a third time while we see his hands are already raw."], PER);

  c("preteenGoal", "Pre-teen goals", "plot",
    "The goals of about 9 to 12: climb the rope to the top of the gym, earn the badge, win the candy, get the cute girl or boy to notice.",
    [
      ["dare", "How dangerous the dare", ["safe", "a little risky", "risky", "dangerous"], "How much could go wrong."],
      ["forWhom", "Who it's for", [0, 100, "%"], "0 just for themselves; 100 all about impressing the group."],
      ["prize", "The prize", ["candy and bragging rights", "a badge or a win", "a friend or a crush", "something that changes my life"], "What they get if they do it."],
      ["kind", "Kind of goal", ["a physical feat", "winning a game", "a skill to learn", "getting noticed", "a secret mission"], "What sort of goal it is.", U],
      ["secret", "Grown-ups know", ["they know", "half know", "no idea"], "Whether the grown-ups know what they're up to."],
    ],
    [2, "A small goal at this age feels like the whole world, so the stakes read big.", "Shows how big small things are when you're young.", "We root for the kid to make it.", "visual", "Let the whole class chant as he reaches for the top of the rope."], PER);

  c("teenGoal", "Teenage goals", "plot",
    "The goals of about 13 to 18: status, love, freedom, and pulling off something big, like a senior putting on a city-wide scavenger hunt.",
    [
      ["size", "Size of the goal", ["small", "for my friends", "for my school", "city-wide"], "How big a thing they're trying to pull off."],
      ["freedom", "Freedom from grown-ups", [0, 100, "%"], "0 kept on a leash; 100 no leash at all."],
      ["identity", "What it says about who I am", [0, 5], "0 just fun; 5 it is who I am."],
      ["kind", "Kind of goal", ["status", "love", "freedom", "a big project", "getting in somewhere", "rebellion"], "What sort of goal it is.", U],
      ["crew", "Who's with them", ["alone", "one friend", "a crew", "a whole chapter"], "How many people they pull into it."],
    ],
    [3, "A teenager's goal is about becoming someone, so failing feels like losing who they are.", "Shows the leap from kid to grown-up.", "We wait to see if they pull it off, and who they become.", "plot", "Let him run the whole scavenger hunt from one clipboard, then have it stolen."], PER);

  c("shyKidGoal", "Shy kid goals", "plot",
    "The goals of a kid who'd rather not be seen: getting through the day, one friend, one brave moment.",
    [
      ["seen", "How much they want to be seen", [0, 100, "%"], "0 wants to be invisible; 100 wants to finally be noticed."],
      ["brave", "Size of the brave moment", ["none", "tiny", "real", "huge"], "How big a step out they take."],
      ["helper", "Who helps them", ["no one", "a friend", "a sibling", "a teacher"], "Who gives them the push.", U],
      ["retreat", "How fast they hide again", [0, 5], "How quickly they shrink back after the brave moment."],
    ],
    [2, "One brave moment from someone who never speaks up can turn a whole scene.", "Shows courage at its smallest and truest.", "We hold our breath for the kid to speak.", "thought", "Keep her at the back of every shot, then let her be the one to raise her hand."], PER);

  c("sportsKidGoal", "Sports kid goals", "plot",
    "Goals measured in wins, times, heights and bodies: making the team, the fastest lap, the trophy.",
    [
      ["hurt", "Body cost they accept", ["none", "sore", "playing hurt", "anything to win"], "How much pain they'll take."],
      ["forWhom", "Who they're doing it for", [0, 100, "%"], "0 for themselves; 100 for a parent or coach."],
      ["level", "How high the level", ["the backyard", "school", "city", "state", "the big leagues"], "How far up the goal reaches."],
      ["winLose", "Last result", ["lost badly", "lost", "won", "won big"], "How the last game went."],
    ],
    [2, "A game gives a clear goal and a clock, so stakes are easy to feel.", "Shows what we'll give our bodies for.", "We watch the score and the limp at the same time.", "visual", "Let the coach's whistle go off just as we see her limp."], PER);

  c("lateLifeGoal", "Goals near the end of life", "plot",
    "What older people want as time runs short: making peace, leaving something behind, being grateful, getting right with God.",
    [
      ["timeLeft", "Time they feel they have", ["plenty", "some", "not much", "almost none"], "How short time feels to them."],
      ["looking", "Looking back or ahead", [0, 100, "%"], "0 full of regret; 100 full of gratitude."],
      ["forWhom", "Who the goal is for", ["me", "my family", "the people after me", "God"], "Who the last goal serves.", U],
      ["kind", "Kind of goal", ["make peace", "leave something behind", "one last adventure", "be grateful", "be ready"], "What sort of goal it is.", U],
    ],
    [2, "A goal with a clock that can't be wound back makes every scene count.", "Shows what matters when there is little time left.", "We wait for the peace to be made in time.", "thought", "Let the grandfather finish the birdhouse on the last afternoon of the visit."], PER);

  /* ---------- friend groups ---------- */

  c("friendGroup", "Which friend group you're in", "herd",
    "Status as which group of kids you belong to: the popular kids and jocks, the rebels and adventurers, the outcasts (sometimes a group of two), or the kids who fit nowhere. Not \"How much they need the group's approval\": this is which group, and where it sits on the ladder.",
    [
      ["status", "Status of the group", ["bottom", "low", "middle", "high", "top"], "Where the group sits in the school's pecking order."],
      ["group", "The group", ["fit nowhere", "the outcasts", "the quiet ones", "the rebels and adventurers", "the brains", "the popular kids and jocks"], "Which group they belong to.", U],
      ["tight", "How tight the group is", [0, 5], "0 loose; 5 inseparable."],
      ["wantOut", "How badly they want a different group", [0, 5], "0 happy here; 5 desperate to leave."],
      ["outsiders", "How the group treats outsiders", ["kind", "ignores them", "teases them", "cruel"], "What the group does to kids who aren't in it."],
    ],
    [2, "Who sits with whom decides who helps, who mocks and who is left alone when it counts.", "Shows how status shapes kids.", "We watch for someone to cross between groups.", "visual", "Open on the lunchroom as a map: every table one group, and one kid holding a tray with nowhere to sit."], { per: "character per scene", also: ["archetype"] });

  /* ---------- moments of realizing ---------- */

  c("siblingHero", "My older sibling is the coolest person on the planet", "arc",
    "The moment a younger kid sees their big brother or sister as a hero, like a brother flooring it over the parking lot medians to get a stolen clipboard back.",
    [
      ["lookUp", "How much the kid looks up to them", [0, 100, "%"], "0 sees them as an equal; 100 sees them as a god."],
      ["letIn", "How much the sibling lets them in", ["shuts them out", "puts up with them", "takes them along", "makes them a partner"], "Whether the big sibling brings them into the adventure."],
      ["pride", "Pride when others notice", [0, 5], "How proud the kid is when someone else sees it too."],
      ["moment", "What does it", ["a rescue", "a dare", "a kindness", "a stunt", "standing up for them"], "What the sibling did to become the hero.", U],
    ],
    [2, "A hero at home gives the younger kid someone to copy, chase and someday surpass.", "Shows how we learn who to be from the people closest to us.", "We wait to see the little one try the same thing.", "visual", "Shoot the brother from the passenger seat, low and close, as the car bucks over the medians."], PER);

  c("rulesBreakable", "You can always break the rules and do the impossible", "arc",
    "The moment a kid realizes the rules are a choice: you can drive straight over the medians, break into the camp's candy storehouse, do donuts on a frozen lot. Not \"A rule we learn early\": this is finding out a rule can be broken.",
    [
      ["size", "How big the rule broken", ["tiny", "real", "big", "huge"], "How much of a rule they break."],
      ["harm", "Who could get hurt", ["nobody", "themselves", "a few people", "everyone"], "Who pays if it goes wrong."],
      ["thrill", "Thrill", [0, 5], "0 nervous; 5 pure joy."],
      ["stays", "Does it stay with them", ["forgotten", "a fun memory", "changes how they see things", "changes who they are"], "Whether the lesson sticks."],
      ["caught", "Caught", ["never", "almost", "caught"], "Whether anyone finds out."],
    ],
    [3, "Once a character knows rules can be broken, every wall in the story becomes a door.", "Shows freedom, and its danger.", "We wait to see which rule they break next.", "plot", "Let the whole cabin stand frozen at the storehouse door, then one kid tries the handle."], PER);

  c("coolGrownup", "What cool looks like in a grown-up", "arc",
    "A kid meeting an adult who shows them what cool is, like a mountain bike teacher who loves Elvis, calls him \"Big E\", and teaches everyone bunny hops.",
    [
      ["cool", "How cool", [0, 100, "%"], "0 square; 100 a legend."],
      ["teaches", "What they teach", ["nothing", "a trick", "a skill", "how to live"], "How much the grown-up passes on."],
      ["hero", "Their own hero", ["none", "a musician", "an athlete", "a teacher of their own", "a movie star"], "Who the cool grown-up looks up to.", U],
      ["hangs", "Hangs out with the kids", [0, 5], "How much they treat the kids as their crew."],
    ],
    [2, "A cool grown-up gives the kids a picture of who they could become.", "Shows how kids learn from adults who aren't their parents.", "We watch the kids start to copy them.", "visual", "Let every kid in line try the same wheelie the teacher just did."], PER);

  /* ---------- attraction ---------- */

  c("rizz", "Rizz", "lines",
    "Being able to win over someone you're attracted to: the talk, the timing and the nerve. Known as rizz.",
    [
      ["rizz", "Rizz level", [0, 100, "%"], "0 none at all; 100 unstoppable."],
      ["lands", "How it lands", ["cringe", "awkward", "okay", "smooth"], "How the other person takes it."],
      ["nerve", "Nerve", [0, 5], "0 frozen; 5 fearless."],
      ["style", "Style", ["jokes", "compliments", "confidence", "mystery", "kindness"], "How they go about it.", U],
    ],
    [2, "Every try at winning someone over is a scene with a clear win or loss.", "Shows the nerve it takes to want someone out loud.", "We cringe or cheer with every line.", "thought", "Let him rehearse the line in the mirror, then say it all wrong."], { per: "character per scene", also: ["comedy"] });

  c("aura", "Aura", "focus",
    "How cool someone seems right now, in this moment. It can rise or crash within one scene: \"check out his aura\", or losing aura with one bad move.",
    [
      ["aura", "Aura", [-100, 100, ""], "-100 big aura loss (cringe); 100 off the charts."],
      ["seen", "Who sees it", ["nobody", "one person", "a few friends", "the whole room"], "How many people notice."],
      ["trend", "Which way it's going", ["crashing", "slipping", "steady", "rising", "soaring"], "Whether they're gaining or losing it."],
      ["effort", "Effortless or trying", [0, 5], "0 effortless; 5 trying too hard."],
    ],
    [2, "A character's aura rising or crashing changes how the room treats them.", "Shows how fast status can turn.", "We wait for the aura to crash, or to soar.", "visual", "Freeze on him mid-fall as the whole cafeteria turns."], { per: "character per scene", also: ["comedy"] });

  c("attractionTime", "Time and energy spent on attraction", "mindset",
    "How much of a character's day and mind goes to the people they're attracted to, whatever their orientation. A teacher's view: childhood is for learning, youth is taken up with desire, and only later do we turn to God and gratitude.",
    [
      ["share", "Share of their mind", [0, 100, "%"], "0 none; 100 everything."],
      ["stage", "Life stage", ["child", "teen", "young adult", "adult", "elder"], "Where they are in life."],
      ["pull", "Pull against other goals", [0, 5], "How often attraction wins over everything else."],
      ["toward", "Toward whom", ["not yet known", "the opposite sex", "the same sex", "any gender"], "Who they're drawn to.", U],
    ],
    [2, "When attraction takes the mind, other goals slip and the plot swerves.", "Shows how much of life desire can fill.", "We watch where their eyes go.", "thought", "Let the sailing race be lost because he was watching the girls' boat."], PER);

  /* ---------- God and meaning ---------- */

  c("godInLife", "How God is in your life", "mindset",
    "What a character thinks God is, what God expects of them, what part God plays for them and what part they play for God, including no God (atheist) and not knowing (agnostic). Kids and adults both make deals with God. Not \"How the belief shows\": this is the belief itself.",
    [
      ["belief", "Belief", ["atheist", "agnostic", "hopes so", "believes", "certain"], "How sure they are that God is there."],
      ["godIs", "What God is to them", ["a judge", "a parent", "a friend", "the whole world", "the Self within"], "Their picture of God.", U],
      ["deal", "Making a deal with God", [0, 5], "0 never; 5 every day (\"if you get me this, I'll...\")."],
      ["grateful", "Gratitude", [0, 5], "0 none; 5 thinks of God in all their work."],
      ["drives", "How much it drives them", [0, 5], "0 background; 5 the main force in their story."],
    ],
    [2, "A deal made with God, kept or broken, can drive a whole season.", "Shows what a person thinks they owe, and are owed.", "We wait to see if the deal is kept.", "thought", "Let the kid whisper a deal under the covers, and the next scene show what it was for."], PER);

  c("bornNature", "Born this way: karma and samskaras", "archetype",
    "Two kids from the same home can be completely different, because we come into this life with our karmas, our samskaras. Not \"The old wound\": this is what they brought with them, not what life did to them.",
    [
      ["different", "How different from their siblings", [0, 100, "%"], "0 just like them; 100 their opposite."],
      ["fixed", "How fixed their nature feels", [0, 5], "0 changes freely; 5 set from birth."],
      ["leaning", "Their leaning", ["bold", "careful", "dreamy", "practical", "devoted", "restless"], "The nature they came in with.", U],
      ["fights", "Fighting their nature", [0, 5], "How hard they push against what they are."],
    ],
    [1, "Two siblings who react opposite ways to the same moment make every scene a comparison.", "Shows we are not blank slates.", "We watch the two sisters choose differently.", "visual", "Cut between the two sisters getting the same news."], { per: "character", also: ["arc"] });

  /* ---------- suites ---------- */

  S("goals-by-age", "Goals by age", "plot",
    "The goal a character chases, seen through how old they are: pre-teen, teenage, shy kid, sports kid, near the end of life.",
    [{ curiosity: "kidGoal" }, { curiosity: "preteenGoal" }, { curiosity: "teenGoal" }, { curiosity: "shyKidGoal" }, { curiosity: "sportsKidGoal" }, { curiosity: "lateLifeGoal" }]);
  S("body-on-the-line", "Body on the line", "plot",
    "A goal right in front of them, everything risked, no idea of the danger, and nobody watching.",
    [
      { curiosity: "kidGoal", value: 90 },
      { curiosity: "kidGoal", slider: "tangible", value: "right in front of me" },
      { curiosity: "kidGoal", slider: "aware", value: "no idea" },
      { curiosity: "kidGoal", slider: "watched", value: "alone" },
      { curiosity: "cm-risk" },
    ]);
  S("growing-up-moments", "Growing-up moments", "arc",
    "The moments a kid realizes something big: the sibling hero, the rules that can be broken, the cool grown-up.",
    [{ curiosity: "siblingHero" }, { curiosity: "rulesBreakable" }, { curiosity: "coolGrownup" }, { curiosity: "mentorLesson" }]);
  S("the-lunch-table", "The lunch table", "herd",
    "Which friend group they're in, how much they need its approval, and the price of getting in.",
    [{ curiosity: "friendGroup" }, { curiosity: "needApproval" }, { curiosity: "initiation" }, { curiosity: "statusGap" }]);
  S("rizz-and-aura", "Rizz and aura", "lines",
    "Winning someone over and how cool you seem doing it, with the time spent wanting them.",
    [{ curiosity: "rizz" }, { curiosity: "aura" }, { curiosity: "attractionTime" }, { curiosity: "tryingTooHard" }]);
  S("god-and-nature", "God and what we're born with", "mindset",
    "Their picture of God, the deals they make, and the nature they came into life with.",
    [{ curiosity: "godInLife" }, { curiosity: "bornNature" }, { curiosity: "beliefShown" }, { curiosity: "lateLifeGoal" }]);

  /* ---------- proximities ---------- */

  P("goal-close-risk", "When the goal feels close, they risk more", "plot",
    "When the goal feels closer, what they'll risk rises within a beat.",
    { curiosity: "kidGoal", slider: "tangible", change: "rises" }, { curiosity: "kidGoal", change: "rises" }, 1);
  P("risk-body-cost", "When they risk everything, the body pays", "plot",
    "When what they risk rises, taking care of their own body drops within 2 beats.",
    { curiosity: "kidGoal", change: "rises" }, { curiosity: "selfCare", change: "drops" }, 2, { also: ["mindset"] });
  P("teen-goal-drive", "When a big teenage goal grows, they get more driven", "plot",
    "When the teenage goal grows, how driven they are rises within a beat.",
    { curiosity: "teenGoal", change: "rises" }, { curiosity: "driveOrPeace", change: "rises" }, 1);
  P("sibling-hero-rules", "When the sibling becomes a hero, the kid learns rules can break", "arc",
    "When the kid looks up to their sibling more, knowing rules can be broken rises within 2 beats.",
    { curiosity: "siblingHero", change: "rises" }, { curiosity: "rulesBreakable", change: "rises" }, 2);
  P("rules-reckless", "When rules feel breakable, they get reckless", "arc",
    "When the rules feel breakable, Cautious to Reckless moves toward reckless within 2 beats.",
    { curiosity: "rulesBreakable", change: "rises" }, { curiosity: "cm-risk", change: "rises" }, 2, { also: ["archetype"] });
  P("cool-grownup-lesson", "When a cool grown-up teaches, a lesson is passed on", "arc",
    "When the cool grown-up teaches more, a mentor's lesson rises within 2 beats.",
    { curiosity: "coolGrownup", slider: "teaches", change: "rises" }, { curiosity: "mentorLesson", change: "rises" }, 2);
  P("low-group-approval", "When their group's status drops, they hunger for approval", "herd",
    "When their friend group's status drops, how much they need approval rises within 2 beats.",
    { curiosity: "friendGroup", change: "drops" }, { curiosity: "needApproval", change: "rises" }, 2);
  P("want-out-initiation", "When they want into another group, they face a test", "herd",
    "When they want a different group more, earning a place in the group rises within 2 beats.",
    { curiosity: "friendGroup", slider: "wantOut", change: "rises" }, { curiosity: "initiation", change: "rises" }, 2);
  P("rizz-aura", "When their rizz lands, their aura rises", "lines",
    "When their rizz rises, their aura rises within a beat.",
    { curiosity: "rizz", change: "rises" }, { curiosity: "aura", change: "rises" }, 1, { also: ["focus"] });
  P("cringe-aura-loss", "When a line lands as cringe, their aura crashes", "lines",
    "When their line lands as cringe, their aura drops within a beat.",
    { curiosity: "rizz", slider: "lands", is: "cringe" }, { curiosity: "aura", change: "drops" }, 1, { also: ["comedy"] });
  P("attraction-crowds-goals", "When attraction fills their mind, other goals slip", "mindset",
    "When attraction takes more of their mind, being closer to the goal drops within 2 beats.",
    { curiosity: "attractionTime", change: "rises" }, { curiosity: "plotProgress", change: "drops" }, 2, { also: ["plot"] });
  P("deal-with-god-drive", "When they make a deal with God, they get driven", "mindset",
    "When they make a deal with God, how driven they are rises within 2 beats.",
    { curiosity: "godInLife", slider: "deal", change: "rises" }, { curiosity: "driveOrPeace", change: "rises" }, 2);
  P("late-life-gratitude", "When time feels short, gratitude grows", "mindset",
    "When time feels short, gratitude to God rises within 2 beats.",
    { curiosity: "lateLifeGoal", slider: "timeLeft", change: "rises" }, { curiosity: "godInLife", slider: "grateful", change: "rises" }, 2);
  P("shy-brave-aura", "When a shy kid is brave, their aura rises", "plot",
    "When the shy kid's brave moment grows, their aura rises within a beat.",
    { curiosity: "shyKidGoal", slider: "brave", change: "rises" }, { curiosity: "aura", change: "rises" }, 1, { also: ["focus"] });
  P("preteen-dare-risk", "When the dare gets dangerous, they risk more", "plot",
    "When the pre-teen dare gets more dangerous, what they'll risk rises within a beat.",
    { curiosity: "preteenGoal", change: "rises" }, { curiosity: "kidGoal", change: "rises" }, 1);
  P("sports-hurt-risk", "When they play hurt, they risk more", "plot",
    "When the sports kid accepts more pain, what they'll risk rises within a beat.",
    { curiosity: "sportsKidGoal", change: "rises" }, { curiosity: "kidGoal", change: "rises" }, 1);
  P("nature-differs-sibling", "When their nature differs from their siblings, they look up to them less", "archetype",
    "When a kid's nature differs more from their siblings, looking up to the older one drops within 2 beats.",
    { curiosity: "bornNature", change: "rises" }, { curiosity: "siblingHero", change: "drops" }, 2, { also: ["arc"] });

  /* ---------- proximity suites ---------- */

  PS("the-clipboard-chase", "The clipboard chase", "arc",
    "A teenage goal drives the big sibling, the little one watches the hero break every rule, and gets reckless too.",
    ["teen-goal-drive", "sibling-hero-rules", "rules-reckless"]);
  PS("the-rope-climb", "The rope climb", "plot",
    "A dare at the top of the gym, the goal so close they risk everything, and the body pays the next day.",
    ["preteen-dare-risk", "goal-close-risk", "risk-body-cost", "sports-hurt-risk"]);
  PS("where-you-sit", "Where you sit", "herd",
    "A low-status group makes them hungry for approval, they want out, and face a test to get in.",
    ["low-group-approval", "want-out-initiation", "shy-brave-aura"]);
  PS("rizz-rise-and-fall", "Rizz, rise and fall", "lines",
    "Rizz that lands lifts the aura, a cringe line crashes it, and the wanting crowds out every other goal.",
    ["rizz-aura", "cringe-aura-loss", "attraction-crowds-goals"]);
  PS("deals-with-god", "Deals with God", "mindset",
    "A deal with God drives them, near the end gratitude grows, and the nature they came with sets them apart.",
    ["deal-with-god-drive", "late-life-gratitude", "nature-differs-sibling", "cool-grownup-lesson"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
