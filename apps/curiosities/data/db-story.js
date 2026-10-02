/* Story workspaces that had only a few rows: Personal plot, Perspective & mindset, Focus, Herd mentality.
   Plus the Page & panel workspace (comic, zine and storyboard pages), and a few suites and proximities for
   Placement, Background and Color, which had almost none. Story rows are set per character per scene. */
(function (DB) {
  const C = (o) => DB.curiosity(o);
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));

  /* ---------- Personal plot ---------- */
  C({
    id: "plotWeight",
    sliders: [
      ["stakes", "What they stand to lose", ["nothing much", "pride", "a relationship", "a livelihood", "a life"], "How much rides on this character's own plot."],
      ["screenShare", "Share of the scene", [0, 100, "%"], "How much of the scene's time goes to this character's own plot."],
    ],
  });
  C({
    id: "plotTouch",
    sliders: [["who", "Who it meets", ["no one", "a side character", "the main character", "everyone"], "Whose plot this character's own plot runs into."]],
  });
  C({
    id: "plotWant",
    label: "What they want, against what they need",
    workspace: "plot",
    also: ["arc"],
    group: "Story",
    per: "character per scene",
    plain: "Every character chases something they want; often what they really need is different. How far apart the two are, and whether the character sees it.",
    main: "gap",
    sliders: [
      ["gap", "Want and need apart", ["the same", "close", "different", "opposite"], "From wanting exactly what they need to wanting the very thing that hurts them."],
      ["sees", "Sees the gap", ["blind to it", "suspects", "knows"], "Whether the character knows their want is wrong for them."],
      ["chase", "How hard they chase", [0, 5], "How much effort they put into the want in this scene."],
    ],
  });
  C({
    id: "plotSecret",
    label: "Secret",
    workspace: "plot",
    also: ["lines", "comedy"],
    group: "Story",
    per: "character per scene",
    plain: "Something the character hides, and who knows it. Secrets drive both suspense and comedy (the audience knows, the room doesn't).",
    main: "kept",
    sliders: [
      ["kept", "How well kept", ["out", "slipping", "close call", "safe"], "From the secret being out to safely hidden."],
      ["whoKnows", "Who knows", ["only them", "the audience too", "one other", "most of the room"], "Who is in on it."],
      ["cost", "Cost if it comes out", [0, 5], "How bad it would be if the secret came out."],
    ],
  });
  C({
    id: "plotProgress",
    label: "Closer to or further from the goal",
    workspace: "plot",
    also: ["arc", "emo-road"],
    group: "Story",
    per: "character per scene",
    plain: "Whether this scene moves the character toward what they want or knocks them back.",
    main: "move",
    sliders: [
      ["move", "Which way", ["big setback", "setback", "no change", "step forward", "big step forward"], "How the scene leaves them, against how it found them."],
      ["cause", "Whose doing", ["their own", "another character", "luck", "the world"], "What moved them."],
    ],
  });

  /* ---------- Perspective & mindset ---------- */
  C({
    id: "mindset",
    sliders: [
      ["challenge", "Belief challenged", [0, 5], "How hard the scene pushes against what the character believes."],
      ["selfDeceit", "Fooling themself", ["honest with themself", "a little", "a lot", "completely"], "How much the character lies to themself about what is going on."],
    ],
  });
  C({
    id: "perspectiveWidth",
    sliders: [["shift", "Circle growing or shrinking", ["shrinking", "holding", "growing"], "Whether the character starts caring about more people, or fewer."]],
  });
  C({
    id: "beliefShown",
    label: "How the belief shows",
    workspace: "mindset",
    also: ["lines", "character-motion"],
    group: "Story",
    per: "character per scene",
    plain: "How we learn what a character believes: said out loud, shown in a choice, or only hinted.",
    main: "how",
    sliders: [
      ["how", "Shown by", ["hinted", "a small act", "a big choice", "said out loud"], "From a hint to the character stating it."],
      ["against", "Against their words", ["matches", "slightly off", "opposite"], "Whether what they do matches what they say they believe."],
    ],
  });

  /* ---------- Focus ---------- */
  C({
    id: "focusWidth",
    sliders: [["camera", "Camera agrees", ["ignores it", "hints", "follows it"], "Whether the shots narrow or widen with the character's attention (close shots for one thing, wide for the room)."]],
  });
  C({
    id: "distraction",
    label: "Distraction",
    workspace: "focus",
    also: ["comedy", "background"],
    group: "Story",
    per: "character per scene",
    plain: "What pulls the character's attention off what matters, and how much. A big comedy and suspense tool.",
    main: "pull",
    sliders: [
      ["pull", "How strong", [0, 5], "From nothing distracting to completely pulled away."],
      ["source", "Pulled by", ["a thought", "a person", "an object", "a sound", "a screen"], "What does the pulling."],
      ["missed", "What they miss", ["nothing", "a detail", "a warning", "the whole point"], "What slips past them while distracted."],
    ],
  });
  C({
    id: "fixation",
    label: "Fixation",
    workspace: "focus",
    also: ["comedy", "emotion"],
    group: "Story",
    per: "character per scene",
    plain: "One thing the character cannot stop looking at or thinking about.",
    main: "grip",
    sliders: [
      ["grip", "How tight", [0, 5], "From a passing interest to an obsession."],
      ["shared", "Others notice", ["no one", "one person", "everyone"], "Whether the others see the fixation."],
    ],
  });

  /* ---------- Herd mentality ---------- */
  C({
    id: "herdMentality",
    sliders: [
      ["size", "Size of the herd", ["two", "a few", "a group", "a crowd"], "How many people think as one."],
      ["speed", "How fast it spreads", [0, 5], "How quickly a view goes round the group."],
    ],
  });
  C({
    id: "dissenter",
    label: "Dissenter",
    workspace: "herd",
    also: ["comedy-mix", "arc"],
    group: "Story",
    per: "character per scene",
    plain: "One character who goes against the group, and what it costs them.",
    main: "against",
    sliders: [
      ["against", "How openly", ["goes along", "quiet doubts", "speaks up", "openly defies"], "From going along to open defiance."],
      ["cost", "What it costs", [0, 5], "How much the group punishes the dissent."],
      ["joined", "Others join", ["no one", "one", "a few", "the whole group turns"], "Whether anyone follows the dissenter."],
    ],
  });
  C({
    id: "groupPressure",
    label: "Group pressure",
    workspace: "herd",
    also: ["placement", "comedy-mix"],
    group: "Story",
    per: "character per scene",
    plain: "How hard the group leans on one person to agree, and how it shows in the frame (the group on one side, the person alone).",
    main: "press",
    sliders: [
      ["press", "How hard", [0, 5], "From no pressure to everyone leaning in."],
      ["shownBy", "Shown by", ["words", "looks", "placement", "all three"], "How we see the pressure."],
    ],
  });

  /* Story suites */
  S("hidden-agenda", "Hidden agenda", "plot", "A character pushes their own plot in secret while seeming to help the main one.", [
    { curiosity: "plotSecret", slider: "kept", value: "safe" },
    { curiosity: "plotWeight", value: 4, weight: 70 },
    { curiosity: "plotTouch", value: "crossing", weight: 60 },
  ], { also: ["lines"] });
  S("wrong-goal", "Chasing the wrong thing", "plot", "The character runs hard after a want that is the opposite of what they need.", [
    { curiosity: "plotWant", slider: "gap", value: "opposite" },
    { curiosity: "plotWant", slider: "sees", value: "blind to it", weight: 70 },
    { curiosity: "plotWant", slider: "chase", value: 5, weight: 70 },
  ], { also: ["arc"] });
  S("dramatic-irony", "We know, they don't", "plot", "The audience is in on a secret the people in the room are not. Suspense or comedy.", [
    { curiosity: "plotSecret", slider: "whoKnows", value: "the audience too" },
    { curiosity: "plotSecret", slider: "kept", value: "close call", weight: 70 },
  ], { also: ["comedy"] });
  S("closed-mind", "Closed mind", "mindset", "A character who won't hear it: fixed mindset, small circle, fooling themself.", [
    { curiosity: "mindset", value: "fixed" },
    { curiosity: "perspectiveWidth", value: "self", weight: 70 },
    { curiosity: "mindset", slider: "selfDeceit", value: "a lot", weight: 60 },
  ]);
  S("widening-circle", "The circle widens", "mindset", "A character starts to care about more than themself.", [
    { curiosity: "mindset", value: "questioning" },
    { curiosity: "perspectiveWidth", slider: "shift", value: "growing" },
    { curiosity: "beliefShown", value: "a big choice", weight: 60 },
  ], { also: ["arc"] });
  S("tunnel-vision", "Tunnel vision", "focus", "The character sees only one thing and misses everything else, and the camera narrows with them.", [
    { curiosity: "focusWidth", value: "one thing" },
    { curiosity: "fixation", value: 5, weight: 80 },
    { curiosity: "focusWidth", slider: "camera", value: "follows it", weight: 60 },
    { curiosity: "shotSize", value: "close", weight: 40 },
  ], { also: ["camera-angle"] });
  S("distracted-miss", "Looks away at the wrong moment", "focus", "The important thing happens while the character is distracted.", [
    { curiosity: "distraction", value: 4 },
    { curiosity: "distraction", slider: "missed", value: "the whole point" },
  ], { also: ["comedy"] });
  S("mob-forms", "A mob forms", "herd", "A crowd turns into one mind with one loud voice.", [
    { curiosity: "herdMentality", value: 5 },
    { curiosity: "herdLeader", value: "one voice", weight: 80 },
    { curiosity: "herdMentality", slider: "size", value: "a crowd", weight: 60 },
    { curiosity: "groupPressure", value: 4, weight: 60 },
  ]);
  S("lone-voice", "The lone voice", "herd", "One person stands against the group, framed alone.", [
    { curiosity: "dissenter", value: "openly defies" },
    { curiosity: "groupPressure", value: 5, weight: 70 },
    { curiosity: "groupPressure", slider: "shownBy", value: "placement", weight: 50 },
    { curiosity: "emptySpace", value: "some", weight: 40 },
  ], { also: ["placement"] });

  /* Story proximities */
  P("secret-slips-cringe", "When a secret starts slipping, cringe rises", "plot", "A secret that starts to slip makes the room more uncomfortable within two beats.", { curiosity: "plotSecret", is: "slipping" }, { curiosity: "cringe", change: "rises" }, 2, { also: ["comedy"] });
  P("setback-feeling-drops", "When the character is set back, their emotional road drops", "plot", "A setback in their own plot pulls the character's emotional road down within a beat.", { curiosity: "plotProgress", is: "setback" }, { curiosity: "emoRoadCharacter", change: "drops" }, 1, { also: ["emo-road"] });
  P("challenge-questioning", "When a belief is challenged hard, the mindset opens", "mindset", "A hard push on what a character believes moves them toward questioning within a scene or two.", { curiosity: "mindset", slider: "challenge", change: "rises" }, { curiosity: "mindset", change: "rises" }, 8, { also: ["arc"] });
  P("fixation-close", "When a fixation tightens, the shots get closer", "focus", "The camera tightens with the character's fixation within a beat.", { curiosity: "fixation", change: "rises" }, { curiosity: "shotSize", change: "drops" }, 1, { also: ["camera-angle"] });
  P("distraction-miss", "When a distraction pulls hard, something is missed", "focus", "A strong distraction is followed by a missed warning within two beats.", { curiosity: "distraction", change: "rises" }, { curiosity: "distraction", slider: "missed", change: "rises" }, 2, { also: ["comedy"] });
  P("dissent-pressure", "When someone defies the group, the pressure rises", "herd", "Open dissent brings more group pressure within a beat.", { curiosity: "dissenter", is: "openly defies" }, { curiosity: "groupPressure", change: "rises" }, 1);
  P("herd-quiet-dissent", "When the herd grows, doubts go quiet", "herd", "As the herd mentality grows, a dissenter drops back toward going along within a few beats.", { curiosity: "herdMentality", change: "rises" }, { curiosity: "dissenter", change: "drops" }, 3);

  PS("secrets-and-lies", "Secrets and lies", "plot", "A slipping secret makes the room cringe, the setbacks pile up, and the feeling drops.", ["secret-slips-cringe", "setback-feeling-drops"], { also: ["comedy", "emo-road"] });
  PS("eyes-on-one-thing", "Eyes on one thing", "focus", "Fixation narrows the frame while a distraction lets the important thing slip by.", ["fixation-close", "distraction-miss"], { also: ["camera-angle"] });
  PS("group-closes-ranks", "The group closes ranks", "herd", "Someone defies the group, the pressure rises, and the doubts go quiet.", ["dissent-pressure", "herd-quiet-dissent"], { also: ["comedy-mix"] });

  /* ---------- Page & panel ---------- */
  const PG = "page";
  S("six-panel-grid", "Steady six-panel grid", PG, "A calm, even page: six panels of the same size, small gutters, a few words each.", [
    { curiosity: "panelCount", value: 6 },
    { curiosity: "panelSize", value: "medium" },
    { curiosity: "gutter", value: "beat", weight: 60 },
    { curiosity: "textDensity", value: "few", weight: 50 },
  ]);
  S("splash-reveal", "Splash-page reveal", PG, "Turn the page to one huge panel that breaks the frame: the big reveal.", [
    { curiosity: "panelCount", value: 1 },
    { curiosity: "panelSize", value: "splash" },
    { curiosity: "panelBreak", value: "splash", weight: 70 },
    { curiosity: "pageTurn", value: "reveal" },
    { curiosity: "textDensity", value: "none", weight: 60 },
  ]);
  S("silent-page", "Silent page", PG, "No words at all: the pictures carry it, often for a sad or tense moment.", [
    { curiosity: "textDensity", value: "none" },
    { curiosity: "balloon", value: "caption", weight: 30 },
    { curiosity: "soundLettering", value: "none", weight: 60 },
  ], { also: ["emotion"] });
  S("talky-page", "Talky page", PG, "Many small panels full of balloons: a fast conversation.", [
    { curiosity: "panelCount", value: 8 },
    { curiosity: "panelSize", value: "small" },
    { curiosity: "textDensity", value: "many" },
    { curiosity: "balloon", value: "balloon", weight: 60 },
  ], { also: ["lines"] });
  S("strip-gag", "Three-panel strip gag", PG, "A newspaper-strip joke: setup, beat, punchline, in three panels.", [
    { curiosity: "panelCount", value: 3 },
    { curiosity: "comicBeat", value: "payoff lands", weight: 70 },
    { curiosity: "ruleOfThree", value: 3, weight: 50 },
  ], { also: ["comedy"] });
  S("action-page", "Action page", PG, "Slanted, uneven panels, big sound effects, panels breaking their borders.", [
    { curiosity: "panelSize", slider: "variation", value: 5 },
    { curiosity: "soundLettering", value: "page-sized" },
    { curiosity: "panelBreak", value: "edge", weight: 70 },
    { curiosity: "textDensity", value: "few", weight: 50 },
  ], { also: ["effects"] });
  P("cliffhanger-turn", "When a page ends on a cliffhanger, the next page opens big", PG, "A cliffhanger at the bottom of a page is followed by a large panel at the top of the next.", { curiosity: "pageTurn", is: "cliffhanger" }, { curiosity: "panelSize", change: "rises" }, 1);
  P("peak-big-panel", "When the feeling peaks, the panel grows", PG, "At the most intense moment, panels get bigger within a beat.", { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "panelSize", change: "rises" }, 1, { also: ["emotion"] });
  P("fast-talk-small-panels", "When the talk speeds up, panels shrink and multiply", PG, "Quick dialogue brings more, smaller panels within a beat.", { curiosity: "wordsAmount", change: "rises" }, { curiosity: "panelCount", change: "rises" }, 1, { also: ["lines"] });
  P("quiet-wide-gutter", "When a scene ends, the gutter widens", PG, "A wide gutter (a scene break) follows the last beat of a scene.", { curiosity: "tensionCurve", change: "drops" }, { curiosity: "gutter", is: "scene" }, 1, { also: ["structure"] });
  PS("page-breathes", "The page breathes with the story", PG, "Panels grow at the peaks, shrink when talk speeds up, and the page turns on a cliffhanger.", ["peak-big-panel", "fast-talk-small-panels", "cliffhanger-turn", "quiet-wide-gutter"], { also: ["structure"] });

  /* ---------- Placement, Background, Color: proximity suites they lacked ---------- */
  S("power-staging", "Power staging", "placement", "The one in charge stands high and central; the others are lower, to the side, looking up.", [
    { curiosity: "blocking", value: "one seated", weight: 60 },
    { curiosity: "composition", value: "center" },
    { curiosity: "angleHeight", value: "low", weight: 60 },
    { curiosity: "statusGap", value: "big gap", weight: 60 },
  ], { also: ["comedy-mix", "camera-angle"] });
  S("isolated-in-frame", "Alone in the frame", "placement", "A small figure in a big empty frame: loneliness.", [
    { curiosity: "emptySpace", value: "most" },
    { curiosity: "peopleCount", value: 1 },
    { curiosity: "shotSize", value: "wide", weight: 70 },
  ], { also: ["emotion"] });
  P("approach-eyeline", "When people get closer, they hold each other's look", "placement", "As characters move closer, the eyelines lock within two beats.", { curiosity: "blocking", slider: "distance", change: "drops" }, { curiosity: "eyeline", change: "rises" }, 2, { also: ["character-motion"] });
  PS("closing-in", "Closing in", "placement", "People move closer, look at each other, and the camera pushes in.", ["approach-eyeline", "approach-push"], { also: ["camera-motion"] });

  S("pathetic-fallacy", "The weather feels it too", "background", "Rain and cold for sadness, sun for joy: the place mirrors the feeling.", [
    { curiosity: "weather", value: "rain" },
    { curiosity: "temperature", value: "cold", weight: 60 },
    { curiosity: "emotion", value: "melancholy", weight: 60 },
  ], { also: ["emotion"] });
  P("sad-rain", "When sadness rises, the rain starts", "background", "A sad turn is followed by rain or grey weather within a few beats.", { curiosity: "emotion", is: "melancholy" }, { curiosity: "weather", is: "rain" }, 3, { also: ["emotion"] });
  P("tension-crowd-still", "When tension rises, the background goes still", "background", "As tension rises, the moving background (crowd, traffic) stops within a beat.", { curiosity: "tensionCurve", change: "rises" }, { curiosity: "envMotion", change: "drops" }, 1, { also: ["structure"] });
  PS("world-mirrors-feeling", "The world mirrors the feeling", "background", "The weather and the background follow the characters' feelings.", ["sad-rain", "tension-crowd-still"], { also: ["emotion"] });

  P("anger-warm-red", "When anger rises, the color runs warm", "color", "Anger is followed by warmer color within two beats.", { curiosity: "emotion", is: "angry" }, { curiosity: "warmCool", change: "drops" }, 2, { also: ["emotion"] });
  P("fear-color-drains", "When fear rises, the color drains", "color", "Fear is followed by fewer, more muted colors within two beats.", { curiosity: "emotion", is: "fearful" }, { curiosity: "colorRange", change: "drops" }, 2, { also: ["emotion"] });
  PS("color-follows-feeling", "Color follows the feeling", "color", "Anger warms the picture, fear drains it, joy warms the light.", ["anger-warm-red", "fear-color-drains", "joy-light-warms"], { also: ["emotion", "light"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
