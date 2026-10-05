/* data/db-depth-belonging.js: where a character stands with other people (Jeremy, 2026-10-05: groupthink, how much
   they need the group's approval, the love of the group or of one person, a small or large circle, being in charge,
   relying or being relied on, struggling or thriving in the past, now and next; then: driven or at peace, needs and wants met or frustrated in each scene, moving others and being moved, and their pull on the plot, tension and chaos). 11 curiosities, kept per character
   per scene like the Character matrix's axes. Ideas already in the database (Conformist to Individualist, Stabilizer
   to Catalyst, Orderly to Chaotic, Surrender to Controlling, External to Internal motivation, Enneagram type and
   health, herd mentality, loneliness, the caretaker) are linked to, not repeated. Loaded after db-depth-telling.js.
   Written 2026-10-05 by the writing app handoff thread. */
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

  /* ---------- where they stand with the group ---------- */

  c("needApproval", "How much they need the group's approval", "herd",
    "How badly this character needs the people around them to approve. Not \"Conformist to Individualist\" (whether they go along) or \"Herd mentality\" (the whole group): this is the hunger inside one person.",
    [
      ["need", "How much they need it", [0, 100, "%"], "0 never thinks about what others think; 100 can't act without a nod."],
      ["whose", "Whose approval", ["a parent", "a partner", "a few friends", "the whole group", "strangers", "a boss or leader"], "Whose yes matters most to them.", U],
      ["swayed", "How easily the group changes their mind", ["never", "a little", "often", "always"], "How much the group's opinion bends their own (groupthink in one person)."],
      ["hides", "Hides the need", ["shows it openly", "half hides it", "acts like they don't care"], "Whether they show how much they need it."],
      ["withheld", "When approval is withheld", ["shrugs", "tries harder", "sulks", "turns on the group"], "What they do when the nod doesn't come."],
      ["source", "Approval from inside", [0, 5], "How much they can approve of themselves without anyone else."],
    ],
    [2, "A character who needs a yes will bend the plot to get it, and break when it is refused.", "Shows how much of a person is shaped by who is watching.", "We wait for the moment they act without asking for the nod.", "thought", "Let her glance at her friends before every answer, until the one answer she gives without looking."], PER);

  c("loveOrientation", "The love they want: the group's or one person's", "herd",
    "Some people want to be loved by the whole group; others want one person, a partner or best friend. This is where a character sits between the two, and how much they want it.",
    [
      ["toward", "Group or one", [0, 100, "%"], "0 wants the love of the whole group; 100 wants one person only."],
      ["want", "How much they want it", [0, 5], "How strong the wish to be loved is right now."],
      ["have", "How much they have it", [0, 5], "How much of that love they actually get."],
      ["one", "The one they want", ["no one yet", "a partner", "a crush", "a best friend", "a parent", "a child"], "Who the one person is, for those turned toward one.", U],
      ["shows", "How they reach for it", ["waits to be chosen", "gives gifts and help", "performs and entertains", "pushes and demands"], "What they do to get the love."],
      ["jealous", "Jealousy", [0, 5], "How much it hurts when the love goes to someone else."],
    ],
    [2, "The gap between how much love they want and how much they get drives choices, rivals and heartbreak.", "Shows what kind of belonging a person is built for.", "We want to see if they get the love they're reaching for.", "thought", "Let the class clown win the whole room's laugh, then look at the one person who didn't laugh."], PER);

  c("circleSize", "The size of their circle", "herd",
    "How big a world the character belongs to: on their own, a couple, a small group of friends, a big group, or a whole community.",
    [
      ["size", "Circle size", ["on their own", "a couple", "a few close friends", "a big group", "a whole community"], "How many people the character truly belongs with."],
      ["wants", "The size they want", ["on their own", "a couple", "a few close friends", "a big group", "a whole community"], "The circle they wish they had."],
      ["center", "Where they sit in it", ["at the edge", "inside", "near the middle", "at the very center"], "How central they are to their circle."],
      ["changes", "Is it growing or shrinking", ["shrinking fast", "shrinking", "steady", "growing", "growing fast"], "Which way their circle is going."],
      ["outsider", "How they treat outsiders", ["welcome them", "test them", "ignore them", "shut them out"], "What their circle does with someone new."],
      ["cost", "What belonging costs them", [0, 5], "How much of themselves they give up to stay in."],
    ],
    [1, "A circle shrinking or growing changes who will help the hero when it counts.", "Shows how big a world a person can carry.", "We watch the circle grow or empty around them.", "visual", "Open on him at a long table of cousins, and end on him at a table for two."], PER);

  c("inCharge", "Being in charge, or not", "herd",
    "Where the character stands in the pecking order: following, one of the crowd, trusted with something, or running the show. Not \"Surrender to Controlling\", which is how much they want control.",
    [
      ["rank", "Rank", ["follows orders", "one of the crowd", "trusted with a job", "second in command", "in charge"], "Where they stand in who decides."],
      ["wants", "Rank they want", ["follows orders", "one of the crowd", "trusted with a job", "second in command", "in charge"], "Where they wish they stood."],
      ["grip", "How firmly they hold it", [0, 5], "How safe their place is: 0 about to lose it, 5 nobody would dare."],
      ["style", "How they lead or follow", ["quietly", "by example", "by charm", "by fear", "by the rules"], "How they use, or live under, the rank.", U],
      ["earned", "Earned or given", ["born into it", "given it", "took it", "earned it"], "How they got where they are."],
      ["weight", "How heavy it feels", [0, 5], "How much the rank weighs on them."],
    ],
    [2, "A gap between the rank they have and the rank they want pushes them to climb, plot or quit.", "Shows power, and what it costs to hold it.", "We wait for the climb or the fall.", "plot", "Let the new manager sit at the head of the table while the old one still gets every glance."], PER);

  c("reliance", "Relied on, or relying on others", "herd",
    "Whether people lean on this character, or this character leans on others. Many stories turn on the moment it flips.",
    [
      ["lean", "Who leans on whom", [0, 100, "%"], "0 relies on others for everything; 100 everyone relies on them."],
      ["who", "Who it is", ["family", "a partner", "friends", "co-workers", "a whole town"], "Who is leaning, or being leaned on.", U],
      ["weight", "How heavy it is", [0, 5], "How much the leaning costs the one being leaned on."],
      ["admits", "Can they ask for help", ["never", "only when desperate", "sometimes", "easily"], "Whether this character can say they need someone."],
      ["resent", "Resentment", [0, 5], "How much the leaning breeds quiet anger."],
      ["flip", "Has it flipped", ["no", "starting to", "fully flipped"], "Whether the one who was leaned on now needs help, or the other way round."],
    ],
    [2, "When the one everyone leans on finally falls, everyone else must change.", "Shows care and burden in the same move.", "We wait for the strong one to crack, or the weak one to stand.", "thought", "Let the eldest sister run the family all film, then be the one in the hospital bed."], PER);

  c("thriving", "Struggling or thriving, past, now and next", "herd",
    "How the character's life is going: how it went before the story, how it is going now, and which way it is heading.",
    [
      ["now", "Now", [0, 100, "%"], "0 is barely surviving; 100 is thriving."],
      ["past", "Before the story", ["struggled badly", "struggled", "got by", "did well", "thrived"], "How life went for them before we met them."],
      ["heading", "Where it is heading", ["falling fast", "slipping", "holding", "climbing", "rising fast"], "The direction their life is moving."],
      ["area", "What part of life", ["money", "love", "health", "work", "family", "the mind"], "Which part of life is struggling or thriving most.", U],
      ["shows", "How much it shows", ["hidden", "a crack shows", "plain to see"], "Whether others can tell how they are really doing."],
      ["knows", "Do they see it", ["no idea", "half knows", "sees it clearly"], "Whether the character knows which way they are heading."],
    ],
    [2, "A life heading the wrong way sets a clock: something must change before it hits bottom.", "Shows fortune as a road, not a place.", "We want to know if they'll climb back or keep falling.", "plot", "Show the trophy shelf from his glory years, then the unpaid bills under it."], PER);

  /* ---------- what each character does to the scene (Jeremy, 2026-10-05: needs and wants, driven or at peace,
     affecting and affected by others, pull on the plot, making or resolving tension and chaos) ---------- */

  c("driveOrPeace", "Driven or at peace", "herd",
    "How hard this character is pushing to get what they need and want in this scene, or how content, relaxed and at peace they are.",
    [
      ["drive", "Driven or at peace", [0, 100, "%"], "0 is content and relaxed; 100 is driven and can't rest."],
      ["by", "What drives them", ["a need", "a want", "fear", "love", "duty", "revenge"], "The engine under the push.", U],
      ["restless", "How restless the body is", [0, 5], "How much the drive shows in fidgeting, pacing, never sitting."],
      ["peace", "Where peace comes from", ["nowhere yet", "having enough", "letting go", "being loved", "being done"], "What makes them settle, when they can."],
      ["cost", "What the drive costs others", [0, 5], "How much their push runs over the people around them."],
      ["turns", "Which way it is moving", ["settling down", "steady", "winding up"], "Whether they are calming or getting more driven this scene."],
    ],
    [3, "A driven character makes things happen; a content one has to be pushed out of peace, which is a story too.", "Shows the price of wanting and the gift of enough.", "We watch to see whether they get it, or let it go.", "movement", "Let her pace the kitchen the whole scene, and sit down only when the phone finally rings."], PER);

  c("needMet", "A need met or frustrated", "herd",
    "In each scene, one of the character's deep needs (safety, belonging, respect, love, freedom, meaning) is fed or starved.",
    [
      ["met", "Met or frustrated", [0, 100, "%"], "0 the need is badly frustrated; 100 it is fully met."],
      ["need", "Which need", ["safety", "belonging", "respect", "love", "freedom", "meaning"], "The deep need at stake.", U],
      ["shift", "What this scene does to it", ["starves it", "blocks it", "leaves it", "feeds it", "fulfills it"], "Which way the scene moves the need."],
      ["by", "Who or what decides it", ["themselves", "a loved one", "a rival", "the group", "chance"], "Who feeds or blocks the need here.", U],
      ["aware", "Do they know the need", ["no idea", "half knows", "knows it well"], "Whether the character can name what they are missing."],
      ["reacts", "How they take it", ["hide it", "lash out", "withdraw", "try harder", "give thanks"], "What they do when the need is fed or starved."],
    ],
    [3, "A starved need pushes a character into the choices that make the plot; a met one releases the tension.", "Shows what people really need under what they say they want.", "We ache for the need to be met.", "thought", "Let him be thanked by a stranger, the respect his father never gave, and watch him not know what to do with it."], PER);

  c("wantMet", "A want met or frustrated", "herd",
    "In each scene, the thing the character says they want (a job, a person, money, a win) gets closer or further away. Not \"What they want, against what they need\", which is the gap between the two.",
    [
      ["met", "Met or frustrated", [0, 100, "%"], "0 the want is badly blocked; 100 they have it."],
      ["want", "What they want", ["a person", "money", "a win", "a place", "a job", "to be left alone"], "The goal they are chasing.", U],
      ["shift", "What this scene does to it", ["snatches it away", "blocks it", "leaves it", "brings it closer", "hands it to them"], "Which way the scene moves the want."],
      ["blocker", "What stands in the way", ["nobody", "themselves", "a rival", "the rules", "bad luck"], "The obstacle in this scene.", U],
      ["worth", "Is it worth having", ["poison", "empty", "fine", "everything"], "Whether getting it would really help them."],
      ["chase", "How hard they chase it here", [0, 5], "How much effort they spend on it in this scene."],
    ],
    [3, "Each scene that moves the want closer or further is a step in the plot.", "Shows the difference between getting what you want and being happy.", "We want to see if they get it, and fear what it costs.", "plot", "Hand her the promotion she wanted, on the day her marriage ends."], PER);

  c("influence", "Moving others, and being moved", "herd",
    "How much this character changes the people around them in a scene, and how much the others change them.",
    [
      ["gives", "How much they move others", [0, 100, "%"], "0 nobody is changed by them; 100 everyone in the scene is."],
      ["takes", "How much others move them", [0, 100, "%"], "0 nothing reaches them; 100 every word changes them."],
      ["how", "How they move people", ["words", "actions", "just being there", "being missing", "a look"], "The way their effect reaches others.", U],
      ["whom", "Who they move most", ["one person", "a few", "the whole room", "the audience"], "How widely their effect spreads."],
      ["kind", "For better or worse", ["for the worse", "mixed", "for the better"], "Whether they leave people better or worse off."],
      ["lasts", "How long it lasts", ["a moment", "the scene", "the story", "a lifetime"], "How long the change stays with the people they touched."],
    ],
    [2, "Who changes whom decides where the story goes next.", "Shows how people make and remake each other.", "We wait to see who changes whom.", "movement", "Let the quiet grandmother say one sentence that changes the whole table, then go back to her soup."], PER);

  c("plotPull", "This character's pull on the plot", "herd",
    "How much this character moves the story in a scene: driving it forward, holding it back, turning it, and stirring up or settling tension and chaos.",
    [
      ["pull", "Pull on the plot", [0, 5], "How much the story moves because of them in this scene."],
      ["way", "Which way they move it", ["stall it", "hold it back", "turn it", "push it forward"], "What they do to the plot."],
      ["tension", "Tension", ["resolve it", "ease it", "leave it", "raise it", "explode it"], "Whether they build or settle tension."],
      ["chaos", "Chaos", ["bring order", "calm things", "leave it", "stir things", "bring chaos"], "Whether they stir up or settle the chaos."],
      ["meant", "On purpose", ["by accident", "half meaning to", "on purpose"], "Whether they mean to move the story."],
      ["seen", "Do the others notice", ["no one", "one person", "everyone"], "Whether the other characters see what they did."],
    ],
    [3, "Every scene has someone moving the story; this shows who, which way, and what it does to the tension.", "Shows that every character, even a small one, can turn a story.", "We watch the one who is about to change everything.", "plot", "Let the kid who has said nothing knock over the candle, and the argument stops."], PER);

  /* ---------- suites ---------- */

  S("people-pleaser", "The people pleaser", "herd",
    "Needs every nod, wants the whole group's love, never asks for help, and leans the room on themselves.",
    [
      { curiosity: "needApproval", value: 90 },
      { curiosity: "loveOrientation", value: 15 },
      { curiosity: "reliance", value: 85 },
      { curiosity: "reliance", slider: "admits", value: "never" },
    ]);
  S("lone-wolf", "The lone wolf", "herd",
    "On their own, needs no approval, relies on no one, and is in charge of nothing but themselves.",
    [
      { curiosity: "circleSize", value: "on their own" },
      { curiosity: "needApproval", value: 5 },
      { curiosity: "reliance", value: 40 },
      { curiosity: "inCharge", value: "one of the crowd" },
    ]);
  S("fallen-king", "The fallen king", "herd",
    "Thrived before the story, is in charge but losing grip, and the circle is shrinking.",
    [
      { curiosity: "thriving", slider: "past", value: "thrived" },
      { curiosity: "thriving", slider: "heading", value: "falling fast" },
      { curiosity: "inCharge", value: "in charge" },
      { curiosity: "inCharge", slider: "grip", value: 1 },
      { curiosity: "circleSize", slider: "changes", value: "shrinking fast" },
    ]);

  S("restless-striver", "The restless striver", "herd",
    "Driven, chasing a want hard, a need starving underneath, pushing the plot and raising the tension.",
    [
      { curiosity: "driveOrPeace", value: 90 },
      { curiosity: "wantMet", slider: "chase", value: 5 },
      { curiosity: "needMet", value: 15 },
      { curiosity: "plotPull", slider: "tension", value: "raise it" },
    ]);
  S("at-peace", "At peace", "herd",
    "Content, needs met, moving others for the better and settling the chaos around them.",
    [
      { curiosity: "driveOrPeace", value: 10 },
      { curiosity: "needMet", value: 90 },
      { curiosity: "influence", slider: "kind", value: "for the better" },
      { curiosity: "plotPull", slider: "chaos", value: "calm things" },
    ]);

  /* ---------- proximities ---------- */

  P("approval-copying", "When the need for approval grows, they copy the others", "herd",
    "When the need for the group's approval rises, copying the others rises within a beat.",
    { curiosity: "needApproval", change: "rises" }, { curiosity: "copying", change: "rises" }, 1);
  P("approval-withheld-turns", "When approval is withheld and they turn, the group pressure rises", "herd",
    "When they turn on the group after approval is withheld, group pressure rises within 2 beats.",
    { curiosity: "needApproval", slider: "withheld", is: "turns on the group" }, { curiosity: "groupPressure", change: "rises" }, 2);
  P("love-unmet-loneliness", "When they want love but don't get it, loneliness grows", "herd",
    "When how much love they have drops, loneliness rises within 2 beats.",
    { curiosity: "loveOrientation", slider: "have", change: "drops" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("circle-shrinks-loneliness", "When the circle shrinks, loneliness grows", "herd",
    "When the circle starts shrinking, loneliness rises within 2 beats.",
    { curiosity: "circleSize", slider: "changes", is: "shrinking" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("rank-leads-herd", "When they rise to the top, they lead the herd", "herd",
    "When they become the one in charge, who leads the herd rises within 2 beats.",
    { curiosity: "inCharge", is: "in charge" }, { curiosity: "herdLeader", change: "rises" }, 2);
  P("leaned-on-caretaker", "When everyone leans on them, they become the caretaker", "herd",
    "When more people rely on them, the caretaker rises within 2 beats.",
    { curiosity: "reliance", change: "rises" }, { curiosity: "caretaker", change: "rises" }, 2);
  P("falling-health", "When life starts falling, emotional health drops", "herd",
    "When how well they are doing falls, Enneagram health moves toward unhealthy within 2 beats.",
    { curiosity: "thriving", change: "drops" }, { curiosity: "cm-health", change: "rises" }, 2, { also: ["archetype"] });

  P("need-starved-drive", "When a need is starved, the drive grows", "herd",
    "When a need is more frustrated, how driven the character is rises within a beat.",
    { curiosity: "needMet", change: "drops" }, { curiosity: "driveOrPeace", change: "rises" }, 1);
  P("want-blocked-tension", "When the want is blocked, the tension rises", "herd",
    "When the want is pushed further away, tension rises within a beat.",
    { curiosity: "wantMet", change: "drops" }, { curiosity: "tensionCurve", change: "rises" }, 1, { also: ["structure"] });
  P("need-met-peace", "When a need is met, they find peace", "herd",
    "When the need is fully met, how driven they are drops within 2 beats.",
    { curiosity: "needMet", slider: "shift", is: "fulfills it" }, { curiosity: "driveOrPeace", change: "drops" }, 2);
  P("drive-pulls-plot", "When the drive grows, they pull the plot", "herd",
    "When they become more driven, their pull on the plot rises within a beat.",
    { curiosity: "driveOrPeace", change: "rises" }, { curiosity: "plotPull", change: "rises" }, 1);
  P("influence-chaos", "When someone moves the room for the worse, chaos follows", "herd",
    "When a character moves others for the worse, chaos in the scene rises within 2 beats.",
    { curiosity: "influence", slider: "kind", is: "for the worse" }, { curiosity: "plotPull", slider: "chaos", change: "rises" }, 2);

  /* ---------- proximity suites ---------- */

  PS("losing-their-place", "Losing their place", "herd",
    "Life starts falling, the circle shrinks, loneliness grows, and emotional health slips toward the stress type.",
    ["falling-health", "circle-shrinks-loneliness", "love-unmet-loneliness", "approval-copying"]);
  PS("the-weight-of-the-crown", "The weight of the crown", "herd",
    "They rise to the top, everyone leans on them, and when the nod is withheld they turn on the group.",
    ["rank-leads-herd", "leaned-on-caretaker", "approval-withheld-turns"]);
  PS("needs-wants-and-drive", "Needs, wants and drive", "herd",
    "A starved need drives them, the blocked want raises the tension, the drive pulls the plot, and a met need finally brings peace.",
    ["need-starved-drive", "want-blocked-tension", "drive-pulls-plot", "need-met-peace", "influence-chaos"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
