/* Comedy: central to the app (Jeremy, 2026-10-02 12:36Z: "Comedy really needs to be central"), so it is many
   curiosities, not one. The app's lenses.js has the Comedy lens (main comedyDevice, with comicTiming,
   comicEscalation, absurdity, comicRegister, cringe, comicBeat, payoffDistance, laughsPerMinute, jokeCarrier,
   comicReaction) and Comedy from the mix (typeClash, chaosInRoom, statusGap, mixPlot, mixArc, mixLaughs),
   imported in db-catalog.js. This file adds the sliders those lack, one curiosity per comic device that has
   no row yet, and the comedy suites and proximities. */
(function (DB) {
  const W = "comedy";
  const ADD = (id, sliders) => DB.curiosity({ id, sliders });
  const C = (id, label, plain, sliders, extra) => DB.curiosity(Object.assign({ id, label, plain, workspace: W, group: "Comedy", sliders }, extra || {}));

  /* ---------- more sliders on the lens rows ---------- */
  ADD("comedyDevice", [
    ["darkness", "Light to dark", ["innocent", "cheeky", "edgy", "dark", "pitch black"], "How dark the subjects of the jokes are."],
    ["warmth", "Mean or kind", ["cruel", "biting", "teasing", "affectionate"], "Whether we laugh at the characters or with them."],
  ]);
  ADD("comicTiming", [
    ["pace", "Speed of the exchange", ["slow", "steady", "quick", "rapid fire", "overlapping"], "How fast the lines bounce back and forth."],
    ["holdAfter", "Hold after the laugh", [0, 5, "seconds"], "How long the camera stays on the result before cutting (the beat that lets the audience laugh)."],
    ["onCut", "Lands on the cut", ["inside the shot", "on the cut", "after the cut"], "Whether the joke lands within the shot, exactly on the cut, or in the next shot."],
  ]);
  ADD("comicEscalation", [
    ["steps", "Number of steps", [1, 10], "How many times the trouble grows before it tops out."],
    ["ceiling", "How far it goes", ["mild", "awkward", "chaos", "disaster", "apocalyptic"], "Where the escalation ends up."],
    ["speed", "How fast it climbs", ["slow burn", "steady", "snowball", "instant"], "How quickly the steps come."],
  ]);
  ADD("absurdity", [
    ["acceptance", "The characters accept it", ["everyone is shocked", "some notice", "nobody blinks"], "Whether the characters react to the absurd thing or treat it as normal (often funnier)."],
    ["detail", "Played with care", [0, 5], "How seriously and precisely the absurd thing is shown."],
  ]);
  ADD("cringe", [
    ["selfAware", "Does the character know", ["oblivious", "half aware", "painfully aware"], "Whether the person causing it realizes."],
    ["witnesses", "Who sees it", [0, 10, "people"], "How many people are there to watch it happen."],
    ["hold", "Camera stays on it", [0, 5], "How long the camera refuses to cut away."],
  ]);
  ADD("comicBeat", [
    ["visibility", "How obvious the setup", ["hidden", "background", "noticed", "underlined"], "Whether the audience notices the setup when it is planted."],
    ["twist", "Payoff twists it", ["exactly as set up", "a little different", "turned upside down"], "Whether the payoff delivers what was set up or flips it."],
  ]);
  ADD("comicReaction", [
    ["count", "Reactions shown", [0, 5], "How many faces we cut to."],
    ["toCamera", "Looks at the camera", ["no", "a glance", "a long look"], "Whether the character looks straight at us (as in mockumentaries)."],
    ["hold", "How long on the face", [0, 4, "seconds"], "How long we stay on the reaction."],
  ]);
  ADD("statusGap", [
    ["flip", "Status flip", ["no flip", "a wobble", "a full reversal"], "Whether the high and low swap places."],
    ["pretense", "Pretending to be higher", [0, 5], "How hard a character pretends to more status than they have."],
    ["fall", "Size of the fall", [0, 5], "How hard the high-status character falls."],
  ]);
  ADD("typeClash", [
    ["straightness", "Straight one plays it straight", [0, 5], "How completely the sensible one refuses to join in."],
    ["roleSwap", "Roles swap", ["never", "once", "often"], "Whether the straight one and the funny one trade places."],
    ["size", "Size of the group", ["two", "three", "an ensemble"], "Whether the comedy is a pair, a trio or a whole group."],
  ]);

  /* ---------- devices with no row yet ---------- */
  C("runningGag", "Running gag", "A joke that keeps coming back across the film, a little different each time.", [
    ["count", "Times it appears", [2, 12], "How many times we see it."],
    ["variation", "Change each time", [0, 5], "How much each return differs from the last."],
    ["spacing", "Space between returns", [1, 30, "scenes"], "How many scenes pass between appearances."],
    ["finale", "Final version", ["no finale", "a bigger version", "a reversal", "it finally pays off"], "How the gag ends."],
  ], { also: ["structure"] });
  C("callback", "Callback", "A later moment that refers back to an earlier line or image.", [
    ["distance", "How far back", [1, 60, "scenes"], "How long ago the original moment happened."],
    ["form", "Same or changed", ["exact repeat", "same words, new speaker", "same words, new meaning", "only hinted"], "How the callback echoes the original."],
    ["mood", "Mood shift", ["same mood", "funnier", "sadder", "sweeter"], "Whether the callback carries a new feeling (a joke line said again in a tender moment)."],
  ], { also: ["structure", "lines"] });
  C("ruleOfThree", "Rule of three", "Two things set a pattern and the third breaks it.", [
    ["pattern", "Pattern items", [2, 5], "How many items set the pattern before the break."],
    ["breakSize", "How hard the break", [0, 5], "How far the last item swerves."],
    ["speed", "Pace of the list", ["slow", "steady", "quick"], "How fast the items come."],
  ], { also: ["lines"] });
  C("physicalComedy", "Physical comedy", "Slapstick, pratfalls, bodies doing funny things.", [
    ["size", "Size of the action", ["a small fumble", "a stumble", "a fall", "a stunt", "destruction"], "How big the physical gag is."],
    ["pain", "Real hurt", [0, 5], "How much it looks like it hurts (cartoon to wince)."],
    ["buildUp", "Build up", [0, 5], "How long we see it coming (the banana peel in shot)."],
    ["framing", "Shown in a wide", ["close", "medium", "wide"], "Physical comedy usually plays best wide so we see the whole body."],
  ], { also: ["character-motion", "movement-lines"] });
  C("wordplay", "Wordplay", "Funny language: puns, misunderstandings, clever comebacks.", [
    ["kind", "Kind", ["pun", "misunderstanding", "comeback", "malapropism", "repetition"], "The type of verbal joke.", { unordered: true }],
    ["speed", "Speed", ["slow", "steady", "quick"], "How fast the words fly."],
    ["cleverness", "Groan to clever", ["groaner", "silly", "sharp", "brilliant"], "From a pun you groan at to a line you admire."],
  ], { also: ["lines"] });
  C("misdirection", "Misdirection", "The audience is led to expect one thing and gets another.", [
    ["strength", "How strongly we are led", [0, 5], "How firmly the film points us the wrong way."],
    ["reveal", "How the truth arrives", ["slowly", "on a cut", "a pull-back wide", "a line of dialogue"], "How we find out (a camera pull-back revealing the real situation is a classic)."],
    ["fairness", "Fair or cheat", ["fully fair", "mostly fair", "a cheat"], "Whether the clues were there all along."],
  ], { also: ["structure", "camera-motion"] });
  C("irony", "Irony", "The opposite of what is said or expected turns out true.", [
    ["kind", "Kind", ["said one thing, meant another", "the opposite happens", "the audience knows more"], "Verbal irony, situational irony, or dramatic irony.", { unordered: true }],
    ["obviousness", "How obvious", [0, 5], "From a quiet aside to underlined."],
    ["delay", "Delay before it bites", [0, 20, "scenes"], "How long before the irony becomes clear."],
  ], { also: ["structure"] });
  C("understatement", "Understatement", "A huge thing treated as tiny, or a tiny thing treated as huge.", [
    ["direction", "Which way", ["huge treated as tiny", "mixed", "tiny treated as huge"], "Downplaying a disaster, or overreacting to nothing."],
    ["gap", "Size of the mismatch", [0, 5], "How far the reaction is from what it should be."],
    ["delivery", "Delivery", ["mumbled", "matter of fact", "precise", "grand"], "How the understated or overblown line is said."],
  ], { also: ["lines", "emotion"] });
  C("fishOutOfWater", "Fish out of water", "A character in a world they do not fit.", [
    ["mismatch", "How out of place", [0, 5], "How badly the character fits the place."],
    ["adapts", "Learns to fit", ["never", "slowly", "too quickly"], "Whether and how they adapt."],
    ["visibility", "Everyone can tell", [0, 5], "How obvious the mismatch is to the others."],
  ], { also: ["wardrobe", "arc"] });
  C("visualGag", "Visual gag", "A joke in the picture: something in the background, a sign, a sight with no words.", [
    ["place", "Where in the frame", ["background", "edge of frame", "center"], "Where the gag sits in the picture."],
    ["subtlety", "How easy to spot", ["blink and miss it", "noticeable", "unmissable"], "Whether it rewards a second look."],
    ["count", "Gags in the frame", [0, 6], "How many visual jokes are in one picture."],
  ], { also: ["background", "set", "page"] });
  C("subversion", "Subversion", "A familiar movie moment or cliche set up and then broken.", [
    ["familiarity", "How familiar the setup", [0, 5], "How well the audience knows the cliche being set up."],
    ["break", "How it breaks", ["small twist", "deflated", "turned inside out"], "Whether the cliche is twisted, let down, or flipped."],
    ["selfAware", "Knows it is a movie", [0, 5], "How much the film winks at being a film."],
  ], { also: ["structure"] });
  C("comicEdit", "Comic edit", "How the cutting itself makes a joke: smash cuts, cutaways, hard contradiction.", [
    ["smashCut", "Smash cuts", [0, 5], "How often a hard cut contradicts what was just said (\"I'll never go\" cut to them going)."],
    ["cutaway", "Cutaways", [0, 5], "How often the film cuts away to a quick joke elsewhere and back."],
    ["tempo", "Cutting tempo", ["slow", "steady", "quick", "frantic"], "How fast comic scenes are cut."],
  ], { also: ["structure", "camera-motion"] });
  C("comicSound", "Comic sound", "Sound used for a laugh: a silly sound effect, a record scratch, a pointed silence.", [
    ["effects", "Funny sound effects", [0, 5], "How many cartoon-like sounds are used."],
    ["sting", "Musical sting", ["none", "soft", "obvious"], "A short burst of music that marks the joke."],
    ["silenceBeat", "Pointed silence", [0, 4, "seconds"], "A silence after a bad joke or awkward line, left to hang."],
  ], { also: ["music"] });

  /* ---------- suites ---------- */
  const S = (id, label, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace: W, members }, extra || {}));
  S("deadpan", "Deadpan", "Absurd things played completely straight: no reaction, locked camera, long holds.", [
    { curiosity: "comicRegister", value: "deadpan" },
    { curiosity: "absurdity", slider: "acceptance", value: "nobody blinks" },
    { curiosity: "comicReaction", value: "none", weight: 70 },
    { curiosity: "cameraCarry", value: "locked", weight: 70 },
    { curiosity: "comicTiming", slider: "holdAfter", value: 3, weight: 70 },
  ]);
  S("slapstick", "Slapstick", "Big physical gags, shown wide, with heightened sound and no real hurt.", [
    { curiosity: "comedyDevice", value: "slapstick" },
    { curiosity: "physicalComedy", slider: "size", value: "a fall" },
    { curiosity: "physicalComedy", slider: "pain", value: 1, weight: 70 },
    { curiosity: "physicalComedy", slider: "framing", value: "wide" },
    { curiosity: "comicSound", slider: "effects", value: 4, weight: 60 },
  ], { also: ["character-motion"] });
  S("mockumentary", "Mockumentary", "Handheld camera, characters glance at the lens, cringe and quick zooms onto reactions.", [
    { curiosity: "cameraCarry", value: "handheld" },
    { curiosity: "comicReaction", slider: "toCamera", value: "a glance" },
    { curiosity: "cringe", value: 3, weight: 70 },
    { curiosity: "cameraMove", value: "zoom", weight: 50 },
  ], { also: ["camera-motion"] });
  S("screwball", "Screwball", "Rapid overlapping talk, status battles and a farce that keeps escalating.", [
    { curiosity: "comicTiming", slider: "pace", value: "overlapping" },
    { curiosity: "statusGap", slider: "flip", value: "a full reversal", weight: 70 },
    { curiosity: "comicEscalation", slider: "speed", value: "snowball", weight: 70 },
    { curiosity: "wordplay", slider: "speed", value: "quick", weight: 60 },
  ], { also: ["lines", "comedy-mix"] });
  S("cringe-comedy", "Cringe comedy", "Someone oblivious keeps going while the camera refuses to look away.", [
    { curiosity: "comedyDevice", value: "cringe" },
    { curiosity: "cringe", value: 4 },
    { curiosity: "cringe", slider: "selfAware", value: "oblivious" },
    { curiosity: "cringe", slider: "hold", value: 4 },
    { curiosity: "comicSound", slider: "silenceBeat", value: 2, weight: 60 },
  ], { also: ["emotion"] });
  S("absurdist", "Absurdist", "A strange world everyone takes for granted, shown with careful detail.", [
    { curiosity: "absurdity", value: 5 },
    { curiosity: "absurdity", slider: "acceptance", value: "nobody blinks" },
    { curiosity: "absurdity", slider: "detail", value: 4 },
  ]);
  S("dark-comedy", "Dark comedy", "Laughs about death, crime or disaster, played light.", [
    { curiosity: "comedyDevice", slider: "darkness", value: "pitch black" },
    { curiosity: "comedyTopic", value: "death", weight: 60 },
    { curiosity: "understatement", slider: "direction", value: "huge treated as tiny" },
    { curiosity: "music", slider: "counterpoint", value: "opposite", weight: 50 },
  ], { also: ["emotion"] });
  S("rom-com-banter", "Rom-com banter", "Two opposites trading quick lines, affectionate teasing, a status seesaw.", [
    { curiosity: "comedyDevice", value: "banter" },
    { curiosity: "typeClash", value: "opposite types" },
    { curiosity: "comedyDevice", slider: "warmth", value: "affectionate" },
    { curiosity: "wordplay", slider: "kind", value: "comeback" },
    { curiosity: "comicTiming", slider: "pace", value: "quick" },
  ], { also: ["lines", "comedy-mix"] });
  S("straight-man-funny-man", "Straight one and funny one", "One character plays it completely straight while the other goes wild.", [
    { curiosity: "comedyDevice", value: "the straight one and the funny one" },
    { curiosity: "typeClash", slider: "straightness", value: 5 },
    { curiosity: "jokeCarrier", value: "both" },
    { curiosity: "emotionGap", slider: "gap", value: 4, weight: 60 },
  ], { workspace: "comedy-mix", also: ["arc"] });
  S("snowball-disaster", "Snowball disaster", "One small mistake leads to bigger and bigger trouble.", [
    { curiosity: "comedyDevice", value: "escalation" },
    { curiosity: "comicEscalation", slider: "steps", value: 6 },
    { curiosity: "comicEscalation", slider: "ceiling", value: "disaster" },
    { curiosity: "comicEscalation", slider: "speed", value: "snowball" },
  ], { also: ["structure"] });
  S("pull-back-reveal", "Pull-back reveal", "We think we know the situation, then the camera pulls back to show the truth.", [
    { curiosity: "misdirection", slider: "reveal", value: "a pull-back wide" },
    { curiosity: "cameraMove", value: "pull out" },
    { curiosity: "shotSize", value: "wide", weight: 70 },
  ], { also: ["camera-motion"] });
  S("smash-cut-contradiction", "Smash cut contradiction", "A character insists they won't do something; hard cut to them doing it.", [
    { curiosity: "comicEdit", slider: "smashCut", value: 4 },
    { curiosity: "irony", slider: "kind", value: "the opposite happens" },
    { curiosity: "comicTiming", slider: "onCut", value: "on the cut" },
  ], { also: ["structure"] });
  S("background-gags", "Background gags", "Small jokes hidden in the set and behind the actors for sharp-eyed viewers.", [
    { curiosity: "visualGag", slider: "place", value: "background" },
    { curiosity: "visualGag", slider: "subtlety", value: "blink and miss it" },
    { curiosity: "visualGag", slider: "count", value: 3 },
    { curiosity: "jokeCarrier", value: "a background person", weight: 60 },
  ], { also: ["background", "set"] });
  S("chaos-agent", "Chaos agent", "One wild character loose in an orderly room, everyone else trying to keep control.", [
    { curiosity: "chaosInRoom", value: "one chaos character" },
    { curiosity: "statusGap", value: "big gap", weight: 60 },
    { curiosity: "mixLaughs", value: "the main source", weight: 70 },
  ], { workspace: "comedy-mix" });

  /* ---------- proximities ---------- */
  const P = (id, label, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace: W, when, then, within }, extra || {}));
  P("joke-reaction", "After a big joke, cut to a reaction", "A joke is followed by a cut to someone's face within one beat.", { curiosity: "comicBeat", is: "payoff lands" }, { curiosity: "comicReaction", slider: "count", change: "rises" }, 1);
  P("two-then-break", "Two of a pattern, then the break", "Two matching items are followed by the swerve on the third beat.", { curiosity: "ruleOfThree", slider: "pattern", is: 2 }, { curiosity: "ruleOfThree", slider: "breakSize", change: "rises" }, 1);
  P("pride-fall", "Pride before a fall", "When a character pretends to more status, a fall follows within four beats.", { curiosity: "statusGap", slider: "pretense", change: "rises" }, { curiosity: "statusGap", slider: "fall", change: "rises" }, 4, { workspace: "comedy-mix" });
  P("insist-then-do", "\"I'll never\", then they do", "A firm refusal is followed by a smash cut to the opposite within one beat.", { curiosity: "irony", slider: "kind", is: "the opposite happens" }, { curiosity: "comicEdit", slider: "smashCut", change: "rises" }, 1);
  P("cringe-silence", "After a cringe, a pointed silence", "An awkward line is followed by silence left to hang within one beat.", { curiosity: "cringe", change: "rises" }, { curiosity: "comicSound", slider: "silenceBeat", change: "rises" }, 1);
  P("escalate-wide", "As trouble escalates, the frame widens", "As escalation grows, shots get wider so we see the whole mess within two beats.", { curiosity: "comicEscalation", change: "rises" }, { curiosity: "shotSize", is: "wide" }, 2, { also: ["camera-angle"] });
  P("gag-returns", "A running gag returns, bigger", "A running gag comes back within a few scenes, changed a little.", { curiosity: "runningGag", slider: "count", change: "rises" }, { curiosity: "runningGag", slider: "variation", change: "rises" }, 16, { also: ["structure"] });
  P("callback-tender", "A joke line returns in a tender moment", "A line that got a laugh early is said again later in a sweeter moment.", { curiosity: "callback", slider: "form", is: "same words, new meaning" }, { curiosity: "callback", slider: "mood", is: "sweeter" }, 40, { also: ["emotion"] });
  P("absurd-no-reaction", "Something absurd, nobody reacts", "An absurd event is followed by everyone carrying on as normal within one beat.", { curiosity: "absurdity", change: "rises" }, { curiosity: "absurdity", slider: "acceptance", is: "nobody blinks" }, 1);
  P("misdirect-pullback", "Misdirection pays off with a pull-back", "After strong misdirection, the camera pulls back to reveal the truth within two beats.", { curiosity: "misdirection", slider: "strength", change: "rises" }, { curiosity: "cameraMove", is: "pull out" }, 2, { also: ["camera-motion"] });
  P("tension-laugh", "After tension, a laugh breaks it", "A tense moment is broken by a joke within three beats.", { curiosity: "tensionCurve", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 3, { also: ["emotion"] });

  DB.proximitySuite({ id: "joke-machine", label: "Joke machine", workspace: W, plain: "The basic comic beat: a pause, the punchline, the reaction, and a silence after a miss.", members: ["pause-laughs", "joke-reaction", "cringe-silence"] });
  DB.proximitySuite({ id: "long-game-comedy", label: "Long-game comedy", workspace: W, also: ["structure"], plain: "Jokes that play across the whole film: setups that pay off, gags that return, lines that come back tender.", members: ["setup-payoff", "gag-returns", "callback-tender"] });
  DB.proximitySuite({ id: "comic-reversals", label: "Comic reversals", workspace: W, plain: "Comedy from things turning around: pride falls, refusals reverse, misdirection is revealed.", members: ["pride-fall", "insist-then-do", "misdirect-pullback"] });
  DB.proximitySuite({ id: "comedy-camera", label: "The camera sells the joke", workspace: W, also: ["camera-angle"], plain: "Where the camera goes for comedy: wider as trouble escalates, onto faces after the joke, back to reveal the truth.", members: ["escalate-wide", "joke-reaction", "misdirect-pullback"] });
  DB.proximitySuite({ id: "the-mix-makes-it-funny", label: "The mix makes it funny", workspace: "comedy-mix", plain: "Putting the wrong people together: opposites, a chaos character, a gap in rank, and what it does to the plot.", members: ["opposites-laugh", "chaos-cringe", "status-plot", "pride-fall"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
