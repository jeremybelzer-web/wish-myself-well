/* Comedy from the mix and the emotional road, deeper. These were the two thinnest comedy and emotion workspaces
   (6 and 7 curiosities). Comedy from the mix is the comedy that comes from who is in the room: double acts, the
   straight man, the odd one out, who knows what. The emotional road is the feeling over the whole story, per
   character and for the film: hope, stakes, breathers, false highs, two roads crossing. */
(function (DB) {
  const C = (o) => DB.curiosity(o);
  const add = (id, sliders) => DB.curiosity({ id, sliders });
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const M = "comedy-mix";
  const R = "emo-road";

  /* ---------- comedy from the mix: real sliders on the lens rows ---------- */
  add("typeClash", [
    ["friction", "How much they rub", [0, 5], "From getting along to every line a fight."],
    ["need", "Need each other", ["not at all", "a little", "can't do it alone"], "Whether the plot forces the opposites to stay together."],
  ]);
  add("chaosInRoom", [
    ["order", "How orderly the room was", ["already a mess", "relaxed", "formal", "solemn"], "The more solemn the room, the funnier the chaos (a funeral, a job interview)."],
  ]);
  add("statusGap", [
    ["playing", "Playing high or low", ["both play to rank", "the low one plays high", "the high one plays low", "both play against rank"], "Whether people act their rank or against it."],
  ]);
  add("mixPlot", [["who", "Who causes it", ["the pair", "the newcomer", "the group", "everyone"], "Which part of the mix changes the plot."]]);
  add("mixArc", [["direction", "Better or worse", ["worse", "no better", "a little better", "much better"], "Whether being together brings out their best or worst."]]);
  add("mixLaughs", [["balance", "Who gets the laughs", ["one of them", "mostly one", "shared", "the whole room"], "How the laughs are spread across the people."]]);

  /* ---------- comedy from the mix: new curiosities ---------- */
  C({
    id: "doubleAct",
    label: "The double act",
    workspace: M,
    also: ["comedy", "lines"],
    group: "Comedy",
    plain: "Two characters who are funnier together than apart. What they are to each other and how they trade lines.",
    main: "bond",
    sliders: [
      ["bond", "What they are", ["strangers", "coworkers", "friends", "rivals", "a couple", "family"], "The relationship the comedy comes out of.", { unordered: true }],
      ["volley", "How fast they trade lines", [0, 5], "From slow, measured replies to rapid back and forth."],
      ["overlap", "Talking over each other", ["one at a time", "a little", "constantly"], "Whether lines overlap."],
      ["lead", "Who leads", ["the clever one", "the fool", "it swaps"], "Who drives the scene."],
    ],
  });
  C({
    id: "straightMan",
    label: "The straight man",
    workspace: M,
    also: ["comedy", "lines"],
    group: "Comedy",
    plain: "The one who plays it straight while the madness happens around them. Their calm makes the madness funnier.",
    main: "calm",
    sliders: [
      ["calm", "How calm they stay", ["loses it", "rattled", "patient", "unmoved"], "From cracking to not reacting at all."],
      ["who", "Who plays it", ["the lead", "the friend", "a stranger", "the whole room"], "Who is the straight one.", { unordered: true }],
      ["sees", "Sees how strange it is", ["has no idea", "notices", "fully sees"], "Whether they know they're in a mad scene."],
    ],
  });
  C({
    id: "oddOneOut",
    label: "The odd one out",
    workspace: M,
    also: ["comedy", "herd", "emotion"],
    group: "Comedy",
    plain: "One person who doesn't fit the group: the vegan at the barbecue, the adult at the kids' party.",
    main: "gap",
    sliders: [
      ["gap", "How badly they fit", [0, 5], "From a little out of place to from another world."],
      ["tries", "Tries to fit in", ["doesn't care", "a little", "desperately"], "How hard they try to blend in. Trying hard is usually the funny part."],
      ["group", "How the group treats them", ["ignores them", "teases them", "welcomes them", "follows them"], "The group's reaction."],
    ],
  });
  C({
    id: "egoClash",
    label: "Clash of egos",
    workspace: M,
    also: ["comedy", "plot"],
    group: "Comedy",
    plain: "Two people who both need to be in charge, or right, or the center of attention.",
    main: "size",
    sliders: [
      ["size", "How big", [0, 5], "From polite one-upping to open war."],
      ["over", "Over what", ["who's in charge", "who's right", "who's loved", "who's best"], "What they're fighting for.", { unordered: true }],
      ["petty", "How petty the cause", ["it matters", "a bit silly", "absurdly petty"], "The smaller the thing they fight over, the funnier."],
    ],
  });
  C({
    id: "whoKnows",
    label: "Who knows what",
    workspace: M,
    also: ["comedy", "plot", "emotion"],
    group: "Comedy",
    plain: "Some people in the room know a secret and some don't. The comedy and tension come from the gap.",
    main: "gap",
    sliders: [
      ["gap", "How many are in on it", ["no one", "one", "half the room", "all but one"], "From nobody knowing to everyone except one poor person."],
      ["audience", "The audience knows", ["no", "partly", "everything"], "Whether we're in on it too."],
      ["hiding", "Effort to hide it", [0, 5], "How hard the ones who know work to keep it hidden."],
    ],
  });
  C({
    id: "alliances",
    label: "Who sides with whom",
    workspace: M,
    also: ["herd", "plot"],
    group: "Comedy",
    plain: "In a group, people take sides, and the sides keep switching.",
    main: "shifts",
    sliders: [
      ["shifts", "How often sides switch", [0, 5], "From fixed teams to everyone betraying everyone."],
      ["sides", "Number of sides", [1, 4, "sides"], "How many camps the room splits into."],
    ],
  });
  C({
    id: "unwantedGuest",
    label: "The unwanted guest",
    workspace: M,
    also: ["comedy", "placement"],
    group: "Comedy",
    plain: "Someone who shouldn't be here: the ex at the wedding, the boss at the party, the parent on the date.",
    main: "wrong",
    sliders: [
      ["wrong", "How wrong it is", [0, 5], "From a little awkward to the worst person possible."],
      ["knows", "Knows they're unwanted", ["no idea", "suspects", "knows and stays"], "Whether they realize it."],
      ["leaves", "Do they leave", ["stays all scene", "is pushed out", "leaves on their own"], "How it ends."],
    ],
  });
  C({
    id: "chemistry",
    label: "Chemistry",
    workspace: M,
    also: ["emotion", "comedy"],
    group: "Comedy",
    plain: "The spark between two people, comic or romantic. You can see it in timing, looks and how they mirror each other.",
    main: "spark",
    sliders: [
      ["spark", "How strong", [0, 5], "From nothing between them to electric."],
      ["kind", "Kind of spark", ["comic", "romantic", "rivalry", "family"], "What kind of connection it is.", { unordered: true }],
      ["mirror", "Mirroring", ["none", "some", "in sync"], "Whether they copy each other's moves and words without noticing."],
    ],
  });

  /* comedy from the mix: suites */
  S("odd-couple", "The odd couple", M, "Two opposites stuck together who need each other.", [
    { curiosity: "typeClash", value: "opposite types" },
    { curiosity: "typeClash", slider: "need", value: "can't do it alone", weight: 70 },
    { curiosity: "doubleAct", slider: "volley", value: 4, weight: 50 },
  ], { also: ["comedy"] });
  S("calm-in-the-madness", "Calm in the madness", M, "One person stays calm while everything around them falls apart.", [
    { curiosity: "straightMan", value: "unmoved" },
    { curiosity: "chaosInRoom", value: "mostly chaos", weight: 70 },
    { curiosity: "comicReaction", value: "a slow burn", weight: 50 },
  ], { also: ["comedy"] });
  S("fish-in-the-group", "Doesn't belong here", M, "One person desperately trying to fit into a group they clearly don't belong to.", [
    { curiosity: "oddOneOut", value: 4 },
    { curiosity: "oddOneOut", slider: "tries", value: "desperately", weight: 70 },
    { curiosity: "cringe", value: 3, weight: 50 },
  ], { also: ["herd", "comedy"] });
  S("petty-war", "The petty war", M, "Two big egos at war over something tiny.", [
    { curiosity: "egoClash", value: 4 },
    { curiosity: "egoClash", slider: "petty", value: "absurdly petty", weight: 70 },
    { curiosity: "comicEscalation", value: 3, weight: 50 },
  ], { also: ["comedy"] });
  S("everyone-knows-but-one", "Everyone knows but one", M, "The whole room is in on a secret except one person.", [
    { curiosity: "whoKnows", value: "all but one" },
    { curiosity: "whoKnows", slider: "hiding", value: 4, weight: 60 },
    { curiosity: "whoKnows", slider: "audience", value: "everything", weight: 50 },
  ], { also: ["comedy", "plot"] });
  S("status-swap", "Status swap", M, "The servant ends up in charge and the boss ends up fetching coffee.", [
    { curiosity: "statusGap", value: "master and servant" },
    { curiosity: "statusGap", slider: "flip", value: "a full reversal", weight: 70 },
    { curiosity: "mixPlot", value: "a turn", weight: 40 },
  ], { also: ["comedy", "plot"] });
  S("worst-guest", "The worst possible guest", M, "The one person who shouldn't be here, refusing to leave a formal room.", [
    { curiosity: "unwantedGuest", value: 5 },
    { curiosity: "unwantedGuest", slider: "leaves", value: "stays all scene", weight: 60 },
    { curiosity: "chaosInRoom", slider: "order", value: "solemn", weight: 50 },
  ], { also: ["comedy"] });
  S("banter", "Banter", M, "Two people with chemistry trading quick lines, talking over each other.", [
    { curiosity: "chemistry", value: 4 },
    { curiosity: "doubleAct", slider: "volley", value: 5, weight: 70 },
    { curiosity: "doubleAct", slider: "overlap", value: "constantly", weight: 50 },
  ], { also: ["lines", "comedy"] });

  /* comedy from the mix: proximities */
  P("guest-chaos", "When the unwanted guest arrives, the room falls into chaos", M, "An unwanted guest brings chaos within two beats.", { curiosity: "unwantedGuest", change: "rises" }, { curiosity: "chaosInRoom", change: "rises" }, 2, { also: ["comedy"] });
  P("ego-plot", "When the egos clash, the plot takes a detour", M, "A clash of egos knocks the plot off course within a few beats.", { curiosity: "egoClash", change: "rises" }, { curiosity: "mixPlot", change: "rises" }, 3, { also: ["plot"] });
  P("secret-cringe", "When the one who doesn't know gets close to the secret, the cringe rises", M, "As the outsider gets near the truth, the room squirms within a beat.", { curiosity: "whoKnows", slider: "hiding", change: "rises" }, { curiosity: "cringe", change: "rises" }, 1, { also: ["comedy"] });
  P("straight-sells-it", "When the chaos grows, the straight man's calm sells the laugh", M, "More chaos makes the straight man's stillness funnier within a beat.", { curiosity: "chaosInRoom", change: "rises" }, { curiosity: "mixLaughs", change: "rises" }, 1, { also: ["comedy"] });
  P("oddone-group", "When the odd one out tries harder, the group pulls away", M, "The harder they try to fit in, the more the group teases them within two beats.", { curiosity: "oddOneOut", slider: "tries", change: "rises" }, { curiosity: "groupPressure", change: "rises" }, 2, { also: ["herd"] });
  P("sides-switch", "When the sides switch, the status flips", M, "A switch in alliances flips who is on top within two beats.", { curiosity: "alliances", change: "rises" }, { curiosity: "statusGap", slider: "flip", change: "rises" }, 2, { also: ["herd", "plot"] });
  P("chemistry-arc", "When the chemistry grows, the characters change", M, "Real chemistry pushes both characters to change within a few scenes.", { curiosity: "chemistry", change: "rises" }, { curiosity: "mixArc", change: "rises" }, 6, { also: ["arc"] });

  /* comedy from the mix: proximity suites */
  PS("house-party", "The house party engine", M, "An unwanted guest brings chaos, the calm one sells the laugh, and sides switch until someone is on top.", ["guest-chaos", "straight-sells-it", "sides-switch"], { also: ["comedy"] });
  PS("secret-in-the-room", "The secret in the room", M, "The outsider nears the truth, the room squirms, and the group closes ranks.", ["secret-cringe", "oddone-group"], { also: ["comedy", "herd"] });
  PS("pair-grows", "The pair that grows", M, "Egos clash, the plot detours, and the chemistry changes them both.", ["ego-plot", "chemistry-arc"], { also: ["arc"] });

  /* ---------- emotional road: real sliders on the road rows ---------- */
  add("emoRoadFilm", [
    ["height", "How high or low", [-5, 5], "From the film's darkest moment to its brightest."],
    ["steep", "How steep the change", [0, 5], "How fast the film's feeling is climbing or falling."],
    ["shape", "Shape of the whole road", ["rags to riches", "riches to rags", "fall then rise", "rise then fall", "rise, fall, rise", "fall, rise, fall"], "The overall path the film's feeling takes.", { unordered: true }],
  ]);
  add("emoRoadCharacter", [["withFilm", "Against the film's road", ["opposite", "lagging", "with it", "ahead"], "Whether this character feels what the film feels, or goes the other way."]]);
  add("emoShown", [["cost", "What showing it costs", ["nothing", "a little pride", "a lot", "everything"], "What the character risks by letting the feeling show."]]);
  add("catharsis", [["through", "Released through", ["tears", "laughter", "a fight", "a confession", "music"], "What finally lets the feeling out.", { unordered: true }]]);

  /* ---------- emotional road: new curiosities ---------- */
  C({
    id: "hope",
    label: "Hope",
    workspace: R,
    also: ["emotion", "arc"],
    group: "Emotion",
    plain: "How much the character (or the audience) believes things will work out. Hope taken away is one of the strongest feelings in a story.",
    main: "level",
    sliders: [
      ["level", "How much hope", [0, 5], "From despair to sure it will work out."],
      ["whose", "Whose hope", ["the character's", "the audience's", "both"], "Who is hoping."],
      ["fragile", "How fragile", ["solid", "shaky", "hanging by a thread"], "How easily it could break."],
    ],
  });
  C({
    id: "stakes",
    label: "What they stand to lose",
    workspace: R,
    also: ["plot", "emotion"],
    group: "Emotion",
    plain: "What happens if they fail. Higher stakes make every feeling bigger, comedy included.",
    main: "size",
    sliders: [
      ["size", "How much", [0, 5], "From a little pride to a life."],
      ["kind", "Kind of loss", ["pride", "money", "a job", "a person", "a dream", "a life"], "What is on the line.", { unordered: true }],
      ["clear", "How clear to us", ["hidden", "hinted", "spelled out"], "Whether the audience knows what's at risk."],
    ],
  });
  C({
    id: "breather",
    label: "Breather",
    workspace: R,
    also: ["structure", "emotion", "comedy"],
    group: "Emotion",
    plain: "A quiet or light scene after a big one, so the audience can rest and feel the next big moment fully.",
    main: "rest",
    sliders: [
      ["rest", "How restful", [0, 5], "From barely a pause to a full calm scene."],
      ["kind", "Kind of rest", ["quiet", "a joke", "something beautiful", "everyday life"], "What fills the breather.", { unordered: true }],
      ["length", "How long", [0, 5, "minutes"], "Length of the breather."],
    ],
  });
  C({
    id: "falseHigh",
    label: "False high, false low",
    workspace: R,
    also: ["arc", "plot"],
    group: "Emotion",
    plain: "A moment that feels like winning (or losing) but isn't. Often in the middle of a film: the hero seems to get what they want, then it turns.",
    main: "kind",
    sliders: [
      ["kind", "Which", ["none", "false low", "false high"], "Whether the moment feels like a win or a loss that won't last."],
      ["size", "How convincing", [0, 5], "How much the audience believes it."],
      ["undone", "Undone within", [0, 20, "scenes"], "How soon the truth arrives."],
    ],
  });
  C({
    id: "twoRoads",
    label: "Two roads",
    workspace: R,
    also: ["emotion", "arc", "comedy-mix"],
    group: "Emotion",
    plain: "Two characters' feelings over the story against each other: one rising while the other falls, or both falling together.",
    main: "relation",
    sliders: [
      ["relation", "How the roads move", ["opposite", "crossing", "apart", "parallel", "together"], "One up while the other goes down, through to both moving the same way."],
      ["gap", "How far apart", [0, 10], "How different their feelings are right now."],
    ],
  });
  C({
    id: "feelingEcho",
    label: "A feeling comes back",
    workspace: R,
    also: ["emotion", "structure", "music"],
    group: "Emotion",
    plain: "A feeling from earlier returns, often with the same music, place or image, and means something new now.",
    main: "strength",
    sliders: [
      ["strength", "How strong the echo", [0, 5], "From a faint reminder to the same moment again."],
      ["through", "Brought back by", ["music", "a place", "an object", "a line", "a shot"], "What carries the old feeling back.", { unordered: true }],
      ["changed", "What it means now", ["the same", "deeper", "the opposite"], "Whether it means more, or the reverse, this time."],
      ["gap", "Scenes since", [0, 40, "scenes"], "How long since the first time."],
    ],
  });
  C({
    id: "warmth",
    label: "Warmth between two",
    workspace: R,
    also: ["emotion", "comedy-mix"],
    group: "Emotion",
    plain: "How warm a relationship is, followed over the story: strangers to friends, friends to enemies.",
    main: "level",
    sliders: [
      ["level", "How warm", [-5, 5], "From hatred to love."],
      ["trend", "Going", ["cooling fast", "cooling", "steady", "warming", "warming fast"], "Which way it's heading."],
    ],
  });
  C({
    id: "dread",
    label: "Dread",
    workspace: R,
    also: ["emotion", "music", "light"],
    group: "Emotion",
    plain: "A bad feeling about what's coming, built over scenes. Comedy can use it too: we dread the moment the lie comes out.",
    main: "level",
    sliders: [
      ["level", "How much", [0, 5], "From a slight unease to sure something terrible is coming."],
      ["known", "We know what's coming", ["no idea", "a guess", "exactly"], "Knowing exactly is suspense; not knowing is mystery."],
      ["scenes", "Built over", [0, 20, "scenes"], "How long it has been building."],
    ],
  });

  /* emotional road: suites */
  S("hope-dies", "Hope dies", R, "Hope at its most fragile, then gone, at the lowest point of the road.", [
    { curiosity: "hope", value: 0 },
    { curiosity: "emoRoadCharacter", value: "lowest point", weight: 70 },
    { curiosity: "stakes", value: 5, weight: 60 },
  ], { also: ["arc", "emotion"] });
  S("the-midpoint-win", "The midpoint win", R, "Halfway through the film, it feels like they won. It won't last.", [
    { curiosity: "falseHigh", value: "false high" },
    { curiosity: "emoRoadCharacter", value: "highest point", weight: 60 },
    { curiosity: "dread", slider: "known", value: "a guess", weight: 40 },
  ], { also: ["arc", "plot"] });
  S("rest-stop", "A rest stop", R, "A gentle, funny or beautiful scene right after a big one.", [
    { curiosity: "breather", value: 4 },
    { curiosity: "emotionIntensity", value: 1, weight: 60 },
    { curiosity: "music", value: "under the scene", weight: 40 },
  ], { also: ["structure", "comedy"] });
  S("crossed-roads", "Crossed roads", R, "One character rises as the other falls.", [
    { curiosity: "twoRoads", value: "opposite" },
    { curiosity: "twoRoads", slider: "gap", value: 8, weight: 60 },
    { curiosity: "warmth", slider: "trend", value: "cooling", weight: 40 },
  ], { also: ["arc", "comedy-mix"] });
  S("the-old-song", "The old song", R, "The music from an early scene plays again, and now it means something else.", [
    { curiosity: "feelingEcho", value: 4 },
    { curiosity: "feelingEcho", slider: "through", value: "music" },
    { curiosity: "feelingEcho", slider: "changed", value: "deeper", weight: 60 },
  ], { also: ["music"] });
  S("slow-dread", "Slow dread", R, "We know exactly what's coming, and it builds over many scenes.", [
    { curiosity: "dread", value: 4 },
    { curiosity: "dread", slider: "known", value: "exactly", weight: 70 },
    { curiosity: "dread", slider: "scenes", value: 10, weight: 40 },
  ], { also: ["emotion", "music"] });
  S("everything-to-lose", "Everything to lose", R, "The stakes are a life or a dream, spelled out, and hope hangs by a thread.", [
    { curiosity: "stakes", value: 5 },
    { curiosity: "stakes", slider: "clear", value: "spelled out", weight: 60 },
    { curiosity: "hope", slider: "fragile", value: "hanging by a thread", weight: 60 },
  ], { also: ["plot"] });

  /* emotional road: proximities */
  P("false-high-falls", "When a false high peaks, the fall follows", R, "A win that won't last turns into a loss within a few scenes.", { curiosity: "falseHigh", is: "false high" }, { curiosity: "emoRoadCharacter", change: "drops" }, 8, { also: ["arc"] });
  P("big-then-breather", "When a big feeling peaks, a breather follows", R, "After a peak of feeling, a quieter or funnier scene follows within a scene or two.", { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "breather", change: "rises" }, 2, { also: ["structure", "comedy"] });
  P("stakes-hope", "When the stakes rise, hope gets fragile", R, "Higher stakes make hope shakier within a scene.", { curiosity: "stakes", change: "rises" }, { curiosity: "hope", slider: "fragile", change: "rises" }, 1, { also: ["plot"] });
  P("hope-gone-catharsis", "When hope is lost, the release comes later", R, "Hope at its lowest is paid back by a release later in the film.", { curiosity: "hope", change: "drops" }, { curiosity: "catharsis", change: "rises" }, 15, { also: ["arc"] });
  P("echo-catharsis", "When an old feeling comes back changed, the release arrives", R, "A feeling that returns with a new meaning brings the release within a scene.", { curiosity: "feelingEcho", slider: "changed", change: "rises" }, { curiosity: "catharsis", change: "rises" }, 1, { also: ["music"] });
  P("dread-silence", "When dread builds, the music thins out", R, "Growing dread makes the music pull back within two beats.", { curiosity: "dread", change: "rises" }, { curiosity: "music", change: "drops" }, 2, { also: ["music"] });
  P("warmth-roads", "When the warmth cools, the two roads part", R, "As two people grow apart, their feelings over the story start going different ways within a few scenes.", { curiosity: "warmth", change: "drops" }, { curiosity: "twoRoads", slider: "gap", change: "rises" }, 4, { also: ["comedy-mix"] });
  P("relief-laugh", "When the dread is lifted, a laugh comes", R, "The moment dread is lifted, a laugh follows within a beat. Relief is one of comedy's oldest tools.", { curiosity: "dread", change: "drops" }, { curiosity: "mixLaughs", change: "rises" }, 1, { also: ["comedy", "comedy-mix"] });

  /* emotional road: proximity suites */
  PS("the-fall-and-rise", "The fall and the rise", R, "A false high falls, hope is lost, and the release comes later.", ["false-high-falls", "hope-gone-catharsis", "echo-catharsis"], { also: ["arc"] });
  PS("room-to-breathe", "Breathing room", R, "A big feeling is followed by rest, and lifted dread by a laugh.", ["big-then-breather", "relief-laugh"], { also: ["structure", "comedy"] });
  PS("pressure-cooker", "The pressure cooker", R, "Stakes rise, hope gets fragile, dread builds and the music thins out.", ["stakes-hope", "dread-silence"], { also: ["plot", "music"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
