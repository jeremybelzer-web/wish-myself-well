/* Character arc and Movement with lines, deeper, plus suites and proximities for Camera angle and Character
   motion. Character arc had 3 curiosities and Movement with lines had no suites or proximities, though both are
   pervasive: every scene moves a character along their arc, and every line is said by a moving body. */
(function (DB) {
  const C = (o) => DB.curiosity(o);
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const A = "arc";
  const L = "movement-lines";
  const CAM = "camera-angle";
  const MOV = "character-motion";

  /* ---------- character arc: new curiosities ---------- */
  C({
    id: "arcDirection",
    label: "Which way they change",
    workspace: A,
    also: ["emo-road", "plot"],
    group: "Story",
    plain: "Whether the character grows, falls, or stays the same and changes the people around them instead.",
    main: "direction",
    sliders: [
      ["direction", "Direction", ["falls", "stays the same", "grows"], "From a fall (they get worse) to growth (they get better)."],
      ["flatChangesOthers", "Changes others instead", ["no", "a little", "everyone around them"], "A character who doesn't change can still change the world around them."],
      ["size", "How far", [0, 5], "How big the change is by the end."],
    ],
  });
  C({
    id: "theLie",
    label: "The lie they believe",
    workspace: A,
    also: ["mindset", "emotion"],
    group: "Story",
    plain: "The wrong idea about themselves or the world that holds the character back ('nobody could love me', 'I don't need anyone').",
    main: "grip",
    sliders: [
      ["grip", "How tight its grip", [0, 5], "From a passing doubt to the center of who they are."],
      ["about", "About", ["themselves", "other people", "the world", "love", "success"], "What the lie is about.", { unordered: true }],
      ["shown", "Shown to us", ["hidden", "hinted", "said out loud"], "Whether the audience can see the lie."],
    ],
  });
  C({
    id: "wound",
    label: "The old wound",
    workspace: A,
    also: ["emotion", "mindset"],
    group: "Story",
    plain: "Something that hurt the character before the story began and still drives them.",
    main: "weight",
    sliders: [
      ["weight", "How much it drives them", [0, 5], "From a faint scar to the reason for everything they do."],
      ["revealed", "When we learn it", ["never", "late", "midway", "early"], "When the audience finds out."],
      ["touched", "How often it's touched", [0, 5], "How often the story presses on it."],
    ],
  });
  C({
    id: "resistance",
    label: "Fighting the change",
    workspace: A,
    also: ["emotion", "comedy"],
    group: "Story",
    plain: "How hard the character fights becoming who they need to be. Much comedy comes from someone refusing to change.",
    main: "level",
    sliders: [
      ["level", "How hard", [0, 5], "From open to change to digging in."],
      ["how", "How they fight it", ["denial", "jokes", "anger", "running away", "doubling down"], "The way they resist.", { unordered: true }],
    ],
  });
  C({
    id: "arcTest",
    label: "The test",
    workspace: A,
    also: ["plot", "emo-road"],
    group: "Story",
    plain: "A moment that proves whether the character has really changed: the old temptation comes back and they choose.",
    main: "size",
    sliders: [
      ["size", "How hard the test", [0, 5], "From a small choice to everything on the line."],
      ["result", "They", ["fail", "nearly fail", "pass"], "Whether they pass."],
      ["echo", "Echoes an earlier moment", ["no", "loosely", "exactly"], "Whether it mirrors a scene from the start, so we see the change."],
    ],
  });
  C({
    id: "relapse",
    label: "Slipping back",
    workspace: A,
    also: ["emo-road", "comedy"],
    group: "Story",
    plain: "The character slides back into the old way after starting to change.",
    main: "size",
    sliders: [
      ["size", "How far back", [0, 5], "From a small slip to all the way back."],
      ["cause", "Caused by", ["fear", "temptation", "an old friend", "a setback", "comfort"], "What pulls them back.", { unordered: true }],
    ],
  });
  C({
    id: "changeShows",
    label: "How the change shows",
    workspace: A,
    also: ["wardrobe", "movement-lines", "lines"],
    group: "Story",
    plain: "How we see the inside change from the outside: new clothes, a different walk, a new way of talking, a habit dropped.",
    main: "visible",
    sliders: [
      ["visible", "How visible", [0, 5], "From a hint only a careful viewer catches to impossible to miss."],
      ["through", "Shown through", ["clothes", "posture", "speech", "a habit", "a place", "an object"], "What carries the change.", { unordered: true }],
    ],
  });

  /* ---------- movement with lines: new curiosities ---------- */
  C({
    id: "walkAndTalk",
    label: "Walk and talk",
    workspace: L,
    also: ["camera-motion", "character-motion"],
    group: "People",
    plain: "Characters talk while moving through a place, usually with the camera moving with them.",
    main: "share",
    sliders: [
      ["share", "How much of the talk is walking", [0, 100, "%"], "Share of the scene's lines said on the move."],
      ["pace", "Walking pace", ["strolling", "walking", "hurrying", "running"], "How fast they go."],
      ["obstacles", "Things in the way", [0, 5], "How much they dodge or pass on the way (people, doors, stairs)."],
    ],
  });
  C({
    id: "propBusiness",
    label: "Business with a prop",
    workspace: L,
    also: ["comedy", "emotion", "set"],
    group: "People",
    plain: "Something the character does with their hands while talking: cooking, folding laundry, fixing a car. It shows feeling without saying it.",
    main: "amount",
    sliders: [
      ["amount", "How busy", [0, 5], "From a cup held to a whole task in progress."],
      ["fits", "Fits the line", ["fights it", "unrelated", "fits it"], "Whether the action agrees with what's said (chopping harder when angry)."],
      ["goesWrong", "It goes wrong", ["no", "a little", "a disaster"], "Whether the task falls apart, often for a laugh."],
    ],
  });
  C({
    id: "moveOnLine",
    label: "Move on the line",
    workspace: L,
    also: ["lines", "comedy"],
    group: "People",
    plain: "When the body moves against the words: a step on the key word, a turn before the line, freezing after it.",
    main: "timing",
    sliders: [
      ["timing", "When", ["before the line", "on the key word", "after the line", "between lines"], "Where the movement sits against the words."],
      ["size", "How big", [0, 5], "From a head tilt to crossing the room."],
      ["freeze", "Freezes after", ["no", "a beat", "a long hold"], "Whether they stop dead after the line."],
    ],
  });
  C({
    id: "listenerBody",
    label: "The listener's body",
    workspace: L,
    also: ["emotion", "comedy", "background"],
    group: "People",
    plain: "What the person not speaking does with their body. Often where the real feeling or the laugh is.",
    main: "amount",
    sliders: [
      ["amount", "How much they react", [0, 5], "From stone still to their whole body answering."],
      ["agrees", "Agrees with the speaker", ["pulls away", "holds still", "leans in"], "Whether their body accepts or rejects what they hear."],
      ["seen", "We see it", ["off screen", "in the edge of frame", "in their own shot"], "Whether the camera shows it."],
    ],
  });

  /* ---------- character arc: suites ---------- */
  S("growth-arc", "Growing up", A, "The character lets go of the lie, passes the test and ends better than they began.", [
    { curiosity: "arcDirection", value: "grows" },
    { curiosity: "arcTest", slider: "result", value: "pass", weight: 70 },
    { curiosity: "theLie", value: 1, weight: 50 },
  ], { also: ["emo-road"] });
  S("tragic-fall", "The fall", A, "The lie wins: the character fails the test and ends worse.", [
    { curiosity: "arcDirection", value: "falls" },
    { curiosity: "arcTest", slider: "result", value: "fail", weight: 70 },
    { curiosity: "theLie", value: 5, weight: 60 },
  ], { also: ["emo-road"] });
  S("steady-changes-world", "The steady one", A, "A character who doesn't change, and changes everyone around them.", [
    { curiosity: "arcDirection", value: "stays the same" },
    { curiosity: "arcDirection", slider: "flatChangesOthers", value: "everyone around them", weight: 70 },
    { curiosity: "dramaticRole", value: "catalyst", weight: 50 },
  ], { also: ["comedy-mix"] });
  S("stubborn-comedy", "Refuses to change", A, "Comedy from a character fighting the obvious lesson with jokes and denial.", [
    { curiosity: "resistance", value: 5 },
    { curiosity: "resistance", slider: "how", value: "denial", weight: 50 },
    { curiosity: "comicFlaw", value: "rigidity", weight: 50 },
  ], { also: ["comedy"] });
  S("mirror-ending", "The mirror ending", A, "The last test echoes the first scene exactly, so we see how far they came.", [
    { curiosity: "arcTest", slider: "echo", value: "exactly" },
    { curiosity: "changeShows", value: 4, weight: 60 },
    { curiosity: "feelingEcho", value: 4, weight: 50 },
  ], { also: ["structure", "emo-road"] });

  /* ---------- movement with lines: suites ---------- */
  S("walk-and-talk", "The walk and talk", L, "Fast talk on the move, the camera gliding ahead, people dodged on the way.", [
    { curiosity: "walkAndTalk", value: 80 },
    { curiosity: "walkAndTalk", slider: "pace", value: "hurrying", weight: 60 },
    { curiosity: "angleFamily", value: "oner", weight: 50 },
  ], { also: ["camera-motion"] });
  S("busy-hands", "Busy hands", L, "Saying something hard while doing a task, and the task shows the feeling.", [
    { curiosity: "propBusiness", value: 4 },
    { curiosity: "propBusiness", slider: "fits", value: "fits it", weight: 60 },
    { curiosity: "subtext", value: "far apart", weight: 50 },
  ], { also: ["emotion"] });
  S("task-disaster", "The task falls apart", L, "The cooking burns and the shelf collapses while they keep talking.", [
    { curiosity: "propBusiness", slider: "goesWrong", value: "a disaster" },
    { curiosity: "physicalComedy", value: "a stumble", weight: 50 },
    { curiosity: "straightMan", value: "patient", weight: 40 },
  ], { also: ["comedy"] });
  S("freeze-on-the-line", "Freeze on the line", L, "A big line, then nobody moves.", [
    { curiosity: "moveOnLine", slider: "freeze", value: "a long hold" },
    { curiosity: "stillness", value: 4, weight: 60 },
    { curiosity: "silence", value: "long", weight: 50 },
  ], { also: ["comedy", "emotion"] });
  S("the-real-reaction", "The real reaction", L, "The speaker talks, but the scene is the listener's face and body.", [
    { curiosity: "listenerBody", value: 4 },
    { curiosity: "listenerBody", slider: "seen", value: "in their own shot", weight: 70 },
    { curiosity: "whoMoves", value: "listener", weight: 50 },
  ], { also: ["emotion", "camera-angle"] });

  /* ---------- camera angle and character motion: suites ---------- */
  S("power-low", "Looking up at power", CAM, "A low angle on a wide lens makes a character loom.", [
    { curiosity: "angleHeight", value: "low" },
    { curiosity: "lensLength", value: "wide", weight: 50 },
    { curiosity: "statusGap", value: "big gap", weight: 40 },
  ], { also: ["comedy-mix"] });
  S("small-from-above", "Small from above", CAM, "A high angle on a wide shot makes a character small and alone.", [
    { curiosity: "angleHeight", value: "high" },
    { curiosity: "shotSize", value: "wide", weight: 60 },
    { curiosity: "hope", value: 1, weight: 40 },
  ], { also: ["emo-road"] });
  S("intimate-close", "Close and private", CAM, "A long lens, shallow focus and a close shot shut out the world.", [
    { curiosity: "shotSize", value: "close" },
    { curiosity: "depthOfField", value: "shallow", weight: 60 },
    { curiosity: "lensLength", value: "long", weight: 50 },
  ], { also: ["emotion"] });
  S("world-off-balance", "World off balance", CAM, "A tilted frame and a wide lens for a world gone wrong.", [
    { curiosity: "dutch", value: "tilted" },
    { curiosity: "lensLength", slider: "distortion", value: "strong", weight: 50 },
    { curiosity: "dread", value: 3, weight: 40 },
  ], { also: ["emo-road"] });
  S("chase", "The chase", MOV, "One flees, one follows, both fast, the path erratic.", [
    { curiosity: "characterPath", slider: "purpose", value: "fleeing" },
    { curiosity: "characterSpeed", value: 4, weight: 60 },
    { curiosity: "characterPath", slider: "smoothness", value: "erratic", weight: 40 },
  ], { also: ["camera-motion"] });
  S("burst-in", "Bursting in", MOV, "A character bursts into the frame and the room.", [
    { curiosity: "bodyEnter", value: "enters" },
    { curiosity: "bodyEnter", slider: "speed", value: "bursts in", weight: 70 },
    { curiosity: "chaosInRoom", value: "one chaos character", weight: 40 },
  ], { also: ["comedy-mix"] });

  /* ---------- proximities ---------- */
  P("lie-crisis", "When the lie is exposed, the crisis comes", A, "Once the lie's grip breaks, the arc reaches its crisis within a few scenes.", { curiosity: "theLie", change: "drops" }, { curiosity: "arcStage", is: "crisis" }, 4, { also: ["emo-road"] });
  P("wound-resist", "When the old wound is touched, they fight the change harder", A, "Pressing on the wound makes the character dig in within a scene.", { curiosity: "wound", slider: "touched", change: "rises" }, { curiosity: "resistance", change: "rises" }, 1, { also: ["emotion"] });
  P("test-change", "When the test is passed, the change shows", A, "Passing the test shows on the outside within a scene: new clothes, a new walk.", { curiosity: "arcTest", slider: "result", is: "pass" }, { curiosity: "changeShows", change: "rises" }, 1, { also: ["wardrobe"] });
  P("relapse-road", "When they slip back, their road drops", A, "A relapse brings the character's feeling down within a scene.", { curiosity: "relapse", change: "rises" }, { curiosity: "emoRoadCharacter", change: "drops" }, 1, { also: ["emo-road"] });
  P("resist-laugh", "When they fight the change with jokes, the laughs rise", A, "Resisting with jokes brings laughs within a beat.", { curiosity: "resistance", slider: "how", is: "jokes" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, { also: ["comedy"] });
  P("change-posture", "When the change comes, the posture opens", A, "A character who has changed stands differently within a scene.", { curiosity: "arcStage", is: "change" }, { curiosity: "posture", is: "open" }, 1, { also: ["movement-lines"] });
  P("line-freeze", "When a big line lands, the body freezes", L, "After the key line, the body goes still within a beat.", { curiosity: "moveOnLine", slider: "timing", is: "on the key word" }, { curiosity: "stillness", change: "rises" }, 1, { also: ["comedy"] });
  P("listener-leans", "When the speaker gets closer to the truth, the listener leans in", L, "As subtext narrows, the listener's body agrees within a beat.", { curiosity: "subtext", change: "drops" }, { curiosity: "listenerBody", slider: "agrees", change: "rises" }, 1, { also: ["emotion"] });
  P("task-angry", "When the anger rises, the task gets rougher", L, "Rising anger goes into the prop within a beat: chopping harder, slamming the drawer.", { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "propBusiness", change: "rises" }, 1, { also: ["emotion"] });
  P("task-laugh", "When the task falls apart, a laugh comes", L, "A task that goes wrong mid-talk brings a laugh within a beat.", { curiosity: "propBusiness", slider: "goesWrong", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, { also: ["comedy"] });
  P("walk-long-take", "When they walk and talk, the shots get longer", L, "A walk and talk stretches the shot within a beat.", { curiosity: "walkAndTalk", change: "rises" }, { curiosity: "cutRate", change: "drops" }, 1, { also: ["camera-motion"] });
  P("approach-space", "When a character approaches, personal space shrinks", MOV, "An approach closes the distance within a beat.", { curiosity: "characterPath", is: "approach" }, { curiosity: "personalSpace", change: "drops" }, 1, { also: ["emotion"] });
  P("speed-cuts", "When characters speed up, the cutting speeds up", MOV, "Faster movement brings faster cutting within a beat.", { curiosity: "characterSpeed", change: "rises" }, { curiosity: "cutRate", change: "rises" }, 1, { also: ["camera-motion"] });
  P("dread-tilt", "When dread builds, the frame tilts", CAM, "Rising dread tilts the camera within two beats.", { curiosity: "dread", change: "rises" }, { curiosity: "dutch", is: "tilted" }, 2, { also: ["emo-road"] });
  P("feeling-closer", "When the feeling peaks, the shot gets closer", CAM, "At the height of a feeling, the camera moves in within a beat.", { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "shotSize", change: "drops" }, 1, { also: ["emotion"] });
  P("status-angle", "When the status flips, the camera angle flips", CAM, "When the lower one ends on top, the camera looks up at them within a beat.", { curiosity: "statusGap", slider: "flip", change: "rises" }, { curiosity: "angleHeight", change: "drops" }, 1, { also: ["comedy-mix"] });

  /* ---------- proximity suites ---------- */
  PS("arc-engine", "The arc engine", A, "The wound is pressed, they resist, the lie is exposed, the crisis comes, and the change shows.", ["wound-resist", "lie-crisis", "test-change", "change-posture"], { also: ["emo-road"] });
  PS("body-tells-the-line", "The body tells the line", L, "The body freezes on the key word, the listener leans in, and anger goes into the task.", ["line-freeze", "listener-leans", "task-angry"], { also: ["emotion"] });
  PS("comic-business", "Comic business", L, "Jokes against change and a task that falls apart.", ["resist-laugh", "task-laugh"], { also: ["comedy"] });
  PS("camera-follows-feeling", "The camera follows the feeling", CAM, "The camera moves in at the peak, tilts with dread, and looks up when status flips.", ["feeling-closer", "dread-tilt", "status-angle"], { also: ["emotion"] });
  PS("motion-drives-cutting", "Movement drives the cutting", MOV, "Speed brings fast cuts, walking talk brings long takes, and an approach closes the space.", ["speed-cuts", "walk-long-take", "approach-space"], { also: ["camera-motion"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
