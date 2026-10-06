/* data/db-depth-relations.js: relationship curiosities (Jeremy, 2026-10-05: "curiosities that depend on other objects
   or other people ... This character is untrustful when in the proximity of an authority figure"). Who and what is
   near a character becomes a curiosity of its own (whoIsNear, whatIsNear), so any "when near X, Y changes" is an
   ordinary proximity. Also the nine character curiosities the research list found missing: how they cope with
   shame, seeking relief from inner pain, attachment style, stance toward authority, stance toward groups, their
   kind of people, place in society, living situation, their craft, and a change in the world that helps or hurts
   them. All kept per character per scene. The list and research: /mnt/project-files/research/character-curiosities.md.
   Loaded after db-depth-belonging.js. Written 2026-10-05 by the writing app handoff thread. */
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

  const PER = { per: "character per scene", also: ["archetype"] };
  const PEOPLE = ["nobody, they are alone", "a parent", "a boss", "a teacher", "the police", "a doctor", "a priest or guru", "a partner", "an ex", "a best friend", "a sibling", "their child", "friends their age", "a party or crowd of peers", "a family gathering", "strangers", "a rival", "spiritual seekers", "artists", "rich people", "poor people", "famous people"];
  const PLACES = ["their own home", "their parents' house", "someone else's house", "a party", "a bar", "work", "school", "a hospital", "a place of worship", "an ashram", "a courtroom", "a police station", "the street", "nature", "a room alone"];
  const THINGS = ["nothing in particular", "a medicine cabinet", "alcohol", "drugs", "money", "a phone or screen", "a weapon", "food", "a car", "a mirror", "a photo", "a gift"];

  /* ---------- who and what is near ---------- */

  c("whoIsNear", "Who is near them", "herd",
    "Who is close to this character in this scene, and where they are. A relationship curiosity starts here: \"when an authority figure is near, trust drops\" is a proximity from this one.",
    [
      ["who", "Who is near", PEOPLE, "The kind of person, or group, close to them right now.", U],
      ["where", "Where they are", PLACES, "The kind of place they are in, which changes how they feel too.", U],
      ["close", "How close", ["across the room", "nearby", "side by side", "touching"], "How near the other person or group is."],
      ["many", "How many", ["one", "a few", "a crowd"], "How many people are near."],
      ["power", "Their power over this character", ["much less", "less", "equal", "more", "much more"], "Whether the people near them sit below, level with, or above them."],
      ["wanted", "Wanted or not", ["unwanted", "put up with", "welcome", "longed for"], "Whether the character wants them there."],
    ],
    [2, "Bringing the wrong person into the room changes everything the character does next.", "Shows that people are different people around different people.", "We watch to see how they change when someone walks in.", "visual", "Let him be loud and funny with his friends, then go silent the moment his father opens the door."], PER);

  c("whatIsNear", "What is near them", "herd",
    "An object or substance close to the character that pulls at them: a medicine cabinet, a bottle, money, a phone, a weapon, a photo.",
    [
      ["pull", "How hard it pulls", [0, 5], "How strongly the thing draws the character."],
      ["what", "What it is", THINGS, "The thing near them.", U],
      ["reach", "How easy to reach", ["out of reach", "takes effort", "within reach", "in their hand"], "How easy it would be to take or use it."],
      ["whose", "Whose it is", ["their own", "someone they know", "a stranger's", "nobody's"], "Who it belongs to."],
      ["watched", "Is anyone watching", ["no one", "maybe", "someone is"], "Whether anyone would see them take or use it."],
      ["means", "What it means to them", ["comfort", "danger", "temptation", "a memory", "power"], "What the thing stands for to this character.", U],
    ],
    [2, "An object in reach is a choice waiting to happen.", "Shows what a character reaches for when they hurt.", "We watch their eyes find the thing.", "visual", "Leave the bathroom cabinet open a crack while she washes her hands, and hold on it a beat too long."], PER);

  /* ---------- the inner engine ---------- */

  c("copingStyle", "How they cope with shame", "herd",
    "What a character does when shame hits. Nathanson's \"compass of shame\" has four ways: pull away, turn on themselves, numb or avoid it, or turn on someone else. Some learn a fifth: face it.",
    [
      ["style", "How they cope", ["face it", "pull away", "turn on themselves", "numb or avoid it", "turn on someone else"], "Their usual answer to shame.", U],
      ["strength", "How strong the habit is", [0, 5], "How automatic this way of coping is for them."],
      ["fast", "How fast it kicks in", ["slowly", "after a while", "at once"], "How quickly they reach for it."],
      ["seen", "Do others see it", ["hidden", "a few know", "everyone knows"], "Whether the people around them see the pattern."],
      ["since", "Since when", ["recently", "a few years", "since childhood"], "How long they have coped this way."],
      ["changing", "Is it changing", ["getting worse", "stuck", "learning to face it"], "Whether they are moving toward facing it."],
    ],
    [2, "The way they cope decides what they do in the worst moment of the story.", "Shows the hidden engine under a character's choices.", "We wait to see whether they face it this time.", "thought", "When she is laughed at, have her apologize to everyone, then go home and pick a fight with her sister."], PER);

  c("reliefSeeking", "Seeking relief from inner pain", "herd",
    "How hard the character is looking for relief from pain or conflict inside, and what they reach for: a substance, food, risk, work, a screen, faith, or helping someone else.",
    [
      ["urge", "How strong the urge is", [0, 100, "%"], "0 at peace; 100 nothing else matters but relief."],
      ["by", "What they reach for", ["a drink", "pills", "food", "sex", "risk", "work", "a screen", "faith", "helping others"], "The thing that gives relief.", U],
      ["act", "What they do to get it", ["nothing hidden", "sneak it", "lie about it", "steal it"], "How far they go to get the relief."],
      ["hidden", "How hidden it is", ["out in the open", "half hidden", "a deep secret"], "Whether anyone knows."],
      ["after", "How they feel after", ["better", "numb", "ashamed", "worse"], "What the relief leaves behind."],
      ["loop", "How fast it comes back", [0, 5], "How quickly the urge returns after relief (0 rarely, 5 again and again)."],
    ],
    [2, "The urge and the hiding put a ticking secret under every scene.", "Shows pain looking for a way out.", "We fear they'll be caught, and hope they'll stop.", "thought", "At the dinner party she excuses herself to the bathroom, and we hear the pill bottle rattle under the running tap."], PER);

  c("attachment", "How they attach to people", "herd",
    "Their attachment style: secure, anxious (fears being left, holds on tight), avoidant (fears closeness, needs control and space), or fearful (wants closeness and fears it).",
    [
      ["style", "Attachment style", ["secure", "anxious", "avoidant", "fearful"], "How they bond with the people close to them.", U],
      ["strength", "How strongly it shows", [0, 5], "How much the style drives them in this scene."],
      ["to", "With whom", ["a partner", "a parent", "a friend", "a child", "everyone"], "Who the attachment is about here.", U],
      ["stress", "Under stress they", ["reach out", "cling", "pull away", "freeze"], "What they do when closeness feels at risk."],
      ["trust", "How much they trust closeness", [0, 100, "%"], "0 closeness feels dangerous; 100 it feels safe."],
      ["healing", "Is it healing", ["getting worse", "the same", "slowly healing", "secure now"], "Whether a relationship in the story is changing their style."],
    ],
    [2, "Anxious meets avoidant, and the push and pull drives the whole relationship.", "Shows how early love shapes every later love.", "We wait to see if they can let someone close.", "movement", "Every time he steps closer, she finds a reason to leave the room; when he finally leaves, she runs after him."], PER);

  /* ---------- stances toward other people ---------- */

  c("authorityStance", "How they are with authority", "herd",
    "How the character behaves toward people with power over them (parents, bosses, teachers, police, doctors, gurus): relying on them, obeying, testing, defying or hiding.",
    [
      ["stance", "Stance", ["relies on it", "obeys", "respects", "tests it", "defies it", "hides from it"], "Their usual way with authority."],
      ["trust", "Trust in authority", [0, 100, "%"], "0 no trust at all; 100 complete trust."],
      ["which", "Which authority most", ["a parent", "a boss", "a teacher", "the police", "a doctor", "a priest or guru", "the government"], "The authority that brings it out most.", U],
      ["shows", "How it shows", ["goes quiet", "lies", "shows off", "argues", "jokes", "does what they're told"], "What they do when an authority figure is near.", U],
      ["why", "Where it comes from", ["a strict parent", "being let down", "being protected", "being punished unfairly", "their faith"], "The history behind the stance.", U],
      ["changing", "Is it changing", ["hardening", "the same", "softening"], "Whether their stance is moving."],
    ],
    [2, "A character who defies authority makes trouble; one who relies on it is lost when it fails them.", "Shows how people answer power.", "We wait for the clash, or the betrayal.", "thought", "Let the rule-follower lie to a police officer for the first time, and watch her hands."], PER);

  c("groupStance", "How they are with groups", "herd",
    "How comfortable the character is in groups: a party of peers, a family gathering, a crowd of strangers, a team. Some love a crowd, some tolerate it, some would rather be alone.",
    [
      ["comfort", "Comfort in a group", [0, 100, "%"], "0 can't stand it; 100 completely at ease."],
      ["kind", "Which group is hardest", ["a party of peers", "a family gathering", "strangers", "a team", "a congregation", "a gang"], "The kind of group that bothers them most.", U],
      ["prefers", "What they prefer", ["being alone", "one other person", "a few friends", "a crowd"], "The company they choose when they can."],
      ["strangers", "With strangers", ["can't bear them", "tolerates them", "warms up", "loves meeting them"], "How they handle people they don't know."],
      ["move", "What they do in a crowd", ["find the exit", "find a corner", "find one person", "work the room", "take the stage"], "Their move once inside a group."],
      ["after", "Afterwards", ["drained", "fine", "energized"], "How being with a group leaves them."],
    ],
    [1, "Putting a loner in a crowd, or a crowd-lover alone, makes a scene without a word.", "Shows how much of themselves people can give a group.", "We feel them looking for the door.", "movement", "At the party, let him spend the whole scene with the host's dog in the kitchen."], PER);

  c("kindredPeople", "Their kind of people", "herd",
    "The people a character is only truly comfortable with: spiritual seekers, artists, people from home, people who have suffered the same thing. With them they open up; elsewhere they hold back.",
    [
      ["who", "Their kind of people", ["spiritual seekers", "artists", "people from home", "people who've been through the same", "the outcasts", "the ambitious", "children", "animals rather than people"], "The people they feel at home with.", U],
      ["with", "Comfort with them", [0, 100, "%"], "How at ease they are among their own kind."],
      ["without", "Comfort everywhere else", [0, 100, "%"], "How at ease they are anywhere else."],
      ["where", "Where they find them", ["online", "a club", "a place of worship", "an ashram", "a meeting", "the street", "work"], "The place their kind of people gather.", U],
      ["opens", "How much they open up there", [0, 5], "How much of themselves they show among their own kind."],
      ["exclusive", "Closed to others", ["no", "a little", "completely"], "Whether they shut out people who aren't their kind."],
    ],
    [1, "Finding their kind of people, or losing them, is a turning point.", "Shows belonging as something you find, not something you're given.", "We hope they find their people.", "visual", "Let her be stiff all film, then laugh out loud at the ashram among strangers in orange."], PER);

  /* ---------- their place in the world ---------- */

  c("socialPlace", "Their place in society", "herd",
    "Where the character stands in the wider world: money, class, status, and whether they are an insider or an outsider.",
    [
      ["standing", "Standing", ["the bottom", "struggling", "the middle", "comfortable", "the top"], "Where they sit in the pecking order of the wider world."],
      ["money", "Money", [0, 100, "%"], "0 nothing; 100 more than they could spend."],
      ["insider", "Insider or outsider", ["outsider", "on the edge", "accepted", "insider"], "Whether the world they live in treats them as one of its own."],
      ["born", "Born into it", ["born lower", "born here", "born higher"], "Whether they rose, fell or stayed where they started."],
      ["feel", "How they feel about it", ["ashamed", "angry", "fine", "proud"], "Their feeling about their place."],
      ["moving", "Moving", ["falling", "stuck", "rising"], "Which way their place is moving."],
    ],
    [1, "A character moving up or down the ladder brings every scene a new room to walk into.", "Shows class and status as pressures people carry.", "We watch where they fit, and where they don't.", "visual", "Let him check the price on the menu twice while everyone else orders without looking."], PER);

  c("livingSituation", "Where and how they live", "herd",
    "Who the character lives with and how they feel about it: alone, with parents, with a partner, roommates, a group home, nowhere.",
    [
      ["with", "Lives with", ["alone", "their parents", "a partner", "roommates", "their children", "a group home", "nowhere fixed"], "Who shares their home.", U],
      ["feel", "How they feel about it", ["trapped", "uneasy", "fine", "happy"], "How their home feels to them."],
      ["free", "How independent they are", [0, 100, "%"], "0 fully dependent; 100 fully on their own."],
      ["leave", "Want to leave", ["want to stay", "not sure", "want out", "planning to leave"], "Whether they want to change it."],
      ["space", "Room of their own", ["none", "a corner", "a room", "a whole place"], "How much space is theirs."],
      ["shown", "How much we see of home", [0, 5], "How much of the story happens at home."],
    ],
    [1, "Home is either the place they need to escape or the place they fight to keep.", "Shows dependence and independence where people sleep.", "We want them to get out, or get home.", "visual", "Show the thirty-year-old's childhood bedroom: the trophies on the shelf, the laptop on the tiny desk."], PER);

  c("craft", "What they're learning or good at", "herd",
    "The work or skill the character is building: what it is, how good they are, how fast they're learning, and how much it matters to them.",
    [
      ["skill", "How good they are", [0, 100, "%"], "0 a beginner; 100 a master."],
      ["what", "What it is", ["a trade", "an art", "a sport", "fixing code", "caring for people", "a business", "a crime"], "The craft.", U],
      ["speed", "How fast they're learning", ["stuck", "slowly", "steadily", "fast"], "How quickly they are improving."],
      ["love", "How much it matters to them", [0, 5], "How much of themselves they put into it."],
      ["seen", "Recognized by others", ["nobody knows", "a few know", "known for it"], "Whether others see their skill."],
      ["tools", "Help they have", ["nothing", "a teacher", "a book or course", "AI tools", "a whole team"], "What is helping them learn.", U],
    ],
    [1, "A skill learned early is often the one that saves them, or tempts them, at the end.", "Shows a person becoming someone through what they do.", "We watch them get better, and wait for it to matter.", "movement", "Let him fix one line of code at 3 a.m. and smile for the first time in the film."], PER);

  c("worldShift", "A change in the world that helps or hurts them", "herd",
    "Something changes in the wider world (a new technology, a law, a war, an illness, the economy) and it makes this character's path easier or harder.",
    [
      ["effect", "Easier or harder", ["much harder", "harder", "no change", "easier", "much easier"], "What the change does to their path."],
      ["kind", "What changed", ["a new technology", "a law", "a war", "an illness", "the economy", "a disaster"], "The change in the world.", U],
      ["fast", "How fast it arrived", ["slowly", "over a year", "overnight"], "How suddenly the world changed."],
      ["adapt", "How they adapt", ["refuse it", "struggle", "adapt", "ride it"], "What they do with the change."],
      ["others", "Is it the same for others", ["only them", "people like them", "everyone"], "How widely the change is felt."],
      ["big", "How big it feels", [0, 5], "How much of the story the change takes up."],
    ],
    [2, "A change in the world can lift a struggling character or sink a thriving one, without anyone choosing it.", "Shows people carried by history.", "We wonder who the change will lift and who it will drown.", "plot", "Let her finish the course just as the AI tool arrives that does half her job, and watch her decide what to do."], PER);

  /* ---------- suites: whole characters ---------- */

  S("hidden-relief", "The hidden relief", "herd",
    "Shame, numbing as the way to cope, a secret urge for relief, and things that can be taken in other people's houses.",
    [
      { curiosity: "copingStyle", value: "numb or avoid it" },
      { curiosity: "reliefSeeking", value: 80 },
      { curiosity: "reliefSeeking", slider: "act", value: "steal it" },
      { curiosity: "reliefSeeking", slider: "hidden", value: "a deep secret" },
      { curiosity: "shame", value: 4 },
    ]);
  S("seeker-apart", "The seeker apart", "herd",
    "Only at ease among spiritual seekers, drained by parties, tolerates strangers, would rather be alone.",
    [
      { curiosity: "kindredPeople", value: "spiritual seekers" },
      { curiosity: "groupStance", value: 15 },
      { curiosity: "groupStance", slider: "prefers", value: "being alone" },
      { curiosity: "groupStance", slider: "strangers", value: "tolerates them" },
    ]);
  S("wary-of-power", "Wary of power", "herd",
    "Doesn't trust authority, goes quiet or lies around it, and learned it from being punished unfairly.",
    [
      { curiosity: "authorityStance", value: "hides from it" },
      { curiosity: "authorityStance", slider: "trust", value: 10 },
      { curiosity: "authorityStance", slider: "why", value: "being punished unfairly" },
    ]);
  S("back-at-home", "Back at home, starting over", "herd",
    "Living with their parents, learning a new craft with new tools, and the world changing in their favor.",
    [
      { curiosity: "livingSituation", value: "their parents" },
      { curiosity: "craft", slider: "what", value: "fixing code" },
      { curiosity: "craft", slider: "tools", value: "AI tools" },
      { curiosity: "worldShift", value: "easier" },
    ]);

  /* ---------- relationship proximities ---------- */

  P("near-authority-distrust", "When an authority figure is near, trust drops", "herd",
    "When someone with power over them comes near, their trust in authority drops within a beat.",
    { curiosity: "whoIsNear", slider: "power", is: "much more" }, { curiosity: "authorityStance", slider: "trust", change: "drops" }, 1);
  P("near-police-lie", "When the police are near, the lies start", "herd",
    "When the police come near, how willing they are to bend the truth rises within a beat.",
    { curiosity: "whoIsNear", is: "the police" }, { curiosity: "cm-truth", change: "rises" }, 1);
  P("near-parent-voice", "When a parent is near, the voice in their head gets louder", "herd",
    "When a parent is near, a parent's voice in their head rises within a beat.",
    { curiosity: "whoIsNear", is: "a parent" }, { curiosity: "innerVoice", change: "rises" }, 1, { also: ["mindset"] });
  P("near-party-uneasy", "When a party of peers is near, comfort drops", "herd",
    "When a party or crowd of peers is near, comfort in a group drops within a beat.",
    { curiosity: "whoIsNear", is: "a party or crowd of peers" }, { curiosity: "groupStance", change: "drops" }, 1);
  P("near-strangers-guarded", "When strangers are near, they close up", "herd",
    "When strangers are near, how secretive they are rises within 2 beats.",
    { curiosity: "whoIsNear", is: "strangers" }, { curiosity: "cm-openness", change: "rises" }, 2);
  P("alone-peace", "When they are alone, they settle", "herd",
    "When nobody is near, how driven they are drops within 2 beats.",
    { curiosity: "whoIsNear", is: "nobody, they are alone" }, { curiosity: "driveOrPeace", change: "drops" }, 2);
  P("near-seekers-open", "When spiritual seekers are near, they open up", "herd",
    "When spiritual seekers are near, how much they open up among their own kind rises within a beat.",
    { curiosity: "whoIsNear", is: "spiritual seekers" }, { curiosity: "kindredPeople", slider: "opens", change: "rises" }, 1);
  P("ashram-belonging", "When they are in the ashram, the need to belong is met", "herd",
    "When they are in an ashram, their need being met rises within 2 beats.",
    { curiosity: "whoIsNear", slider: "where", is: "an ashram" }, { curiosity: "needMet", change: "rises" }, 2);
  P("shame-relief", "When shame rises, the urge for relief rises", "herd",
    "When shame weighs more, the urge for relief rises within a beat.",
    { curiosity: "shame", change: "rises" }, { curiosity: "reliefSeeking", change: "rises" }, 1, { also: ["emotion"] });
  P("cabinet-steal", "When a medicine cabinet is near, they take the pills", "herd",
    "When a medicine cabinet is near, the urge for relief turns into stealing within 2 beats.",
    { curiosity: "whatIsNear", slider: "what", is: "a medicine cabinet" }, { curiosity: "reliefSeeking", slider: "act", is: "steal it" }, 2);
  P("someone-elses-house-temptation", "When they are in someone else's house, things pull harder", "herd",
    "When they are in someone else's house, how hard nearby things pull rises within a beat.",
    { curiosity: "whoIsNear", slider: "where", is: "someone else's house" }, { curiosity: "whatIsNear", change: "rises" }, 1);
  P("relief-shame-loop", "When the relief is stolen, the shame comes back", "herd",
    "When the urge for relief is fed by stealing, shame rises again within 3 beats.",
    { curiosity: "reliefSeeking", slider: "act", is: "steal it" }, { curiosity: "shame", change: "rises" }, 3, { also: ["emotion"] });
  P("anxious-cling", "When a partner pulls away, the anxious one clings", "herd",
    "When attachment shows more strongly, loneliness rises within 2 beats.",
    { curiosity: "attachment", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("world-easier-thrive", "When the world makes it easier, life starts climbing", "herd",
    "When a change in the world makes their path easier, how well they're doing rises within 3 beats.",
    { curiosity: "worldShift", change: "rises" }, { curiosity: "thriving", change: "rises" }, 3);
  P("craft-rank", "When the craft grows, so does their standing", "herd",
    "When they get better at their craft, their place in society rises within 4 beats.",
    { curiosity: "craft", change: "rises" }, { curiosity: "socialPlace", change: "rises" }, 4);
  P("home-trapped-drive", "When home feels like a trap, the drive to leave grows", "herd",
    "When living at home feels more like a trap, how driven they are rises within 2 beats.",
    { curiosity: "livingSituation", slider: "feel", change: "drops" }, { curiosity: "driveOrPeace", change: "rises" }, 2);
  P("shame-cope-attack", "When shame is turned outward, the group pressure rises", "herd",
    "When they turn their shame on someone else, group pressure rises within 2 beats.",
    { curiosity: "copingStyle", is: "turn on someone else" }, { curiosity: "groupPressure", change: "rises" }, 2);

  /* ---------- proximity suites ---------- */

  PS("the-shame-loop", "The shame loop", "herd",
    "Shame rises, the urge for relief rises, in someone else's house the cabinet pulls, the pills are taken, and the shame comes back.",
    ["shame-relief", "someone-elses-house-temptation", "cabinet-steal", "relief-shame-loop"]);
  PS("the-authority-chain", "The authority chain", "herd",
    "An authority figure comes near, trust drops, a parent's voice gets louder, and the lies start.",
    ["near-authority-distrust", "near-parent-voice", "near-police-lie"]);
  PS("safe-harbor", "Safe harbor", "herd",
    "Uneasy at parties and closed with strangers, but among spiritual seekers at the ashram they open up and belong.",
    ["near-party-uneasy", "near-strangers-guarded", "near-seekers-open", "ashram-belonging", "alone-peace"]);
  PS("starting-over", "Starting over", "herd",
    "Home feels like a trap, the drive to leave grows, the world makes the new craft easier, and their standing rises.",
    ["home-trapped-drive", "world-easier-thrive", "craft-rank"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
