/* data/db-depth-belonging.js: where a character stands with other people (Jeremy, 2026-10-05: groupthink, how much
   they need the group's approval, the love of the group or of one person, a small or large circle, being in charge,
   relying or being relied on, struggling or thriving in the past, now and next). 6 curiosities, kept per character
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

  /* ---------- proximity suites ---------- */

  PS("losing-their-place", "Losing their place", "herd",
    "Life starts falling, the circle shrinks, loneliness grows, and emotional health slips toward the stress type.",
    ["falling-health", "circle-shrinks-loneliness", "love-unmet-loneliness", "approval-copying"]);
  PS("the-weight-of-the-crown", "The weight of the crown", "herd",
    "They rise to the top, everyone leans on them, and when the nod is withheld they turn on the group.",
    ["rank-leads-herd", "leaned-on-caretaker", "approval-withheld-turns"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
