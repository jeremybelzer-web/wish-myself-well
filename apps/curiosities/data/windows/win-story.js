/* Story: a window for every curiosity whose home is Story on the Screen. Story is closest to momentum (the
   feeling of going somewhere important), so most windows carry a setting for how it pulls the audience forward
   or where it steers their attention. */
(function (W) {
  /* ---------- Arc ---------- */

  W.add("arcStage", {
    sliders: [
      ["stageLength", "How long the stage lasts", ["a beat", "a scene", "a stretch", "most of the film"], "How much screen time the character spends in this stage before moving on."],
      ["tipPoint", "When they tip into the next", [0, 100, "%"], "How far into the scene the character crosses into the next stage."],
      ["seenComing", "Audience sees it coming", ["takes us by surprise", "we sense it", "we know before they do"], "Whether the audience feels the next stage arriving before the character does."],
      ["rootingFor", "How much we root for them", [0, 5, ""], "How badly the audience wants this character to get through it; the more we care, the more we lean forward."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "progress" },
        { face: "curve", slider: "setting", points: 5, title: "Their arc across my film" },
      ],
      groups: [
        { label: "Where they are", sliders: ["setting", "progress", "stageLength"] },
        { label: "The turn", sliders: ["tipPoint", "change"] },
        { label: "The audience", sliders: ["seenComing", "rootingFor"] },
      ],
      presets: [
        { label: "Rocky's long climb", plain: "A slow, earned crawl from doubt to change that we cheer the whole way.", set: { setting: "doubt", stageLength: "most of the film", seenComing: "we sense it", rootingFor: 5 } },
        { label: "Dark night of the soul", plain: "The crisis lands late in the scene and hits hard.", set: { setting: "crisis", tipPoint: 80, stageLength: "a scene", change: "snaps" } },
        { label: "Quiet change in the last shot", plain: "The change arrives in one beat at the very end.", set: { setting: "change", stageLength: "a beat", tipPoint: 95, seenComing: "takes us by surprise" } },
      ],
    },
  });

  W.add("arcTest", {
    sliders: [
      ["temptation", "What tempts them back", ["comfort", "money", "an old love", "safety", "pride", "revenge"], "The shape the old temptation takes when it comes back.", { unordered: true }],
      ["hesitation", "How long they hesitate", [0, 30, "s"], "How long the character hangs on the choice before making it; longer holds keep us on the edge of our seat."],
      ["witnessed", "Who sees them choose", ["no one", "one person", "the people who matter", "everyone"], "Who is there to see the choice; a witness raises the stakes."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "result", left: "fail", right: "pass" },
        { face: "dial", slider: "hesitation" },
        { face: "tiles", slider: "temptation", icons: { comfort: "🛋️", money: "💰", "an old love": "💔", safety: "🛡️", pride: "👑", revenge: "🗡️" } },
      ],
      groups: [
        { label: "The test", sliders: ["size", "temptation", "echo"] },
        { label: "The choice", sliders: ["result", "hesitation", "witnessed"] },
      ],
      presets: [
        { label: "Casablanca at the airport", plain: "He gives up the old love in front of the one who matters.", set: { size: 5, temptation: "an old love", result: "pass", witnessed: "the people who matter", echo: "loosely" } },
        { label: "Michael Corleone's slide", plain: "The old way wins, quietly, with no one to stop him.", set: { size: 4, temptation: "pride", result: "fail", witnessed: "no one" } },
        { label: "Mirror of the opening", plain: "The first scene's choice comes back and this time they pass.", set: { echo: "exactly", result: "pass", hesitation: 8 } },
      ],
    },
  });

  W.add("dramaticRole", {
    sliders: [
      ["target", "Who they play it on", ["no one in particular", "a side character", "the main character", "the whole group"], "Which character feels the effect of the role in this scene."],
      ["onScreen", "How present they are", ["off screen", "on the edge", "in the scene", "at the center"], "How much of the scene this character is physically in."],
      ["drawsEye", "Pulls our eye to them", [0, 5, ""], "How much the scene steers the audience's attention to this character."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { stabilizer: "⚓", catalyst: "⚡", challenger: "🥊", mediator: "🤝", mentor: "🦉", temptation: "🍎", mirror: "🪞", foil: "🎭", wildcard: "🃏", anchor: "🪨", trickster: "🦊", "moral center": "🧭", antagonist: "😈" } },
        { face: "mixer", sliders: ["strength", "drawsEye"] },
      ],
      groups: [
        { label: "The role", sliders: ["setting", "strength", "change"] },
        { label: "In the scene", sliders: ["target", "onScreen", "drawsEye"] },
      ],
      presets: [
        { label: "Obi-Wan the mentor", plain: "A guide who stands to one side and points the hero onward.", set: { setting: "mentor", target: "the main character", onScreen: "on the edge", strength: 4 } },
        { label: "The Joker walks in", plain: "A wildcard who takes over the room and every eye in it.", set: { setting: "wildcard", onScreen: "at the center", drawsEye: 5, strength: 5 } },
        { label: "Quiet anchor", plain: "Holds the group steady without drawing attention.", set: { setting: "anchor", drawsEye: 1, target: "the whole group", strength: 2 } },
      ],
    },
  });

  W.add("cm-role", {
    sliders: [
      ["target", "Who they play it on", ["no one in particular", "a side character", "the main character", "the whole group"], "Which character feels the effect of the role in this scene."],
      ["roleShift", "How the role changes", ["holds", "drifts", "steps", "snaps"], "Whether they keep the same role all scene or switch to another, slowly or at once."],
      ["drawsEye", "Pulls our eye to them", [0, 5, ""], "How much the scene steers the audience's attention to this character."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "role", icons: { stabilizer: "⚓", catalyst: "⚡", challenger: "🥊", mediator: "🤝", mentor: "🦉", temptation: "🍎", mirror: "🪞", foil: "🎭", wildcard: "🃏", anchor: "🪨", trickster: "🦊", "moral-center": "🧭", antagonist: "😈", ally: "🛡️" } },
        { face: "ladder", slider: "awareness" },
      ],
      groups: [
        { label: "The role", sliders: ["role", "strength", "awareness"] },
        { label: "In the scene", sliders: ["target", "drawsEye", "roleShift"] },
      ],
      presets: [
        { label: "Iago pulling strings", plain: "A deliberate tempter working on the hero in the shadows.", set: { role: "temptation", awareness: "deliberate", target: "the main character", drawsEye: 2 } },
        { label: "Sam carries Frodo", plain: "A loyal ally who steps forward when it counts.", set: { role: "ally", awareness: "unaware", strength: 5, roleShift: "steps" } },
        { label: "The turncoat", plain: "An ally who snaps into the enemy mid-scene.", set: { role: "antagonist", roleShift: "snaps", drawsEye: 5, awareness: "deliberate" } },
      ],
    },
  });

  W.add("arcDirection", {
    sliders: [
      ["pace", "How fast the change comes", ["barely moves", "slow", "steady", "fast", "all at once"], "How quickly the character moves along the arc in this stretch of the film."],
      ["certainty", "We know where it ends", ["no idea", "a hunch", "pretty sure", "certain"], "How clearly the audience can tell which way the character is heading."],
      ["hope", "How much we hope for them", [0, 5, ""], "How much the audience wants the arc to turn out well, which keeps them watching."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "direction", left: "falls", right: "grows" },
        { face: "pad", x: "size", y: "hope", xLabel: "How far", yLabel: "Hope" },
      ],
      groups: [
        { label: "The arc", sliders: ["direction", "size", "pace"] },
        { label: "Around them", sliders: ["flatChangesOthers"] },
        { label: "The audience", sliders: ["certainty", "hope"] },
      ],
      presets: [
        { label: "Breaking Bad fall", plain: "A long, steady slide into darkness we can't look away from.", set: { direction: "falls", size: 5, pace: "steady", certainty: "pretty sure" } },
        { label: "Forrest Gump stays put", plain: "He doesn't change; everyone around him does.", set: { direction: "stays the same", flatChangesOthers: "everyone around them", size: 0 } },
        { label: "Scrooge in one night", plain: "A huge turn for the better, fast, that we're rooting for.", set: { direction: "grows", size: 5, pace: "all at once", hope: 5 } },
      ],
    },
  });

  W.add("theLie", {
    sliders: [
      ["challenged", "How hard life pushes on it", [0, 5, ""], "How strongly the scene throws evidence against the lie at the character."],
      ["cracks", "Cracks showing", ["solid", "a hairline", "cracking", "breaking"], "How close the lie is to falling apart."],
      ["weSee", "We see through it", ["not yet", "suspect it", "clearly"], "Whether the audience sees the lie before the character does, which makes us lean in."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "grip" },
        { face: "ladder", slider: "cracks" },
      ],
      groups: [
        { label: "The lie", sliders: ["grip", "about", "shown"] },
        { label: "Under pressure", sliders: ["challenged", "cracks"] },
        { label: "The audience", sliders: ["weSee"] },
      ],
      presets: [
        { label: "Good Will Hunting: it's not your fault", plain: "The lie about himself finally breaks under pressure.", set: { about: "themselves", grip: 2, challenged: 5, cracks: "breaking", weSee: "clearly" } },
        { label: "Opening-act lie", plain: "Tight and hidden, though we already suspect it.", set: { grip: 5, shown: "hidden", cracks: "solid", weSee: "suspect it" } },
        { label: "Said out loud", plain: "They say the lie and we know it's wrong.", set: { shown: "said out loud", weSee: "clearly", cracks: "a hairline" } },
      ],
    },
  });

  W.add("wound", {
    sliders: [
      ["howShown", "How we learn it", ["a hint", "a reaction", "someone tells", "they confess", "a flashback"], "The way the old hurt reaches the audience."],
      ["rawness", "How raw it still is", ["scarred over", "tender", "open"], "Whether the old hurt is healed, sore, or still bleeding in this scene."],
      ["curiosity", "How much we want to know", [0, 5, ""], "How much the scene makes the audience wonder what happened to them."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "tiles", slider: "howShown", icons: { "a hint": "🤫", "a reaction": "😣", "someone tells": "🗣️", "they confess": "💬", "a flashback": "🎞️" } },
      ],
      groups: [
        { label: "The wound", sliders: ["weight", "rawness", "touched"] },
        { label: "Revealing it", sliders: ["revealed", "howShown", "curiosity"] },
      ],
      presets: [
        { label: "Jaws: the Indianapolis speech", plain: "A confession late in the film that explains everything.", set: { howShown: "they confess", revealed: "late", rawness: "tender", weight: 4 } },
        { label: "Slow-drip mystery", plain: "Hints only, keeping us curious about what happened.", set: { howShown: "a hint", revealed: "late", curiosity: 5 } },
        { label: "Flashback up front", plain: "We see it early so every scene after is coloured by it.", set: { howShown: "a flashback", revealed: "early", rawness: "open" } },
      ],
    },
  });

  W.add("relapse", {
    sliders: [
      ["duration", "How long they stay slipped", ["a moment", "a scene", "a stretch", "for good"], "How long the character stays in the old way before climbing out, if ever."],
      ["caught", "Who catches them", ["no one", "the audience only", "a friend", "everyone"], "Who sees them slip back."],
      ["dread", "How much we dread it", [0, 5, ""], "How strongly the scene lets us feel the slip coming, so we hold our breath."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "tiles", slider: "cause", icons: { fear: "😨", temptation: "🍷", "an old friend": "👋", "a setback": "📉", comfort: "🛋️" } },
      ],
      groups: [
        { label: "The slip", sliders: ["size", "cause", "duration"] },
        { label: "Seen", sliders: ["caught", "noticeable"] },
        { label: "Feel and timing", sliders: ["dread", "change"] },
      ],
      presets: [
        { label: "Trainspotting one last hit", plain: "An old friend drags them back for a long, dreaded slide.", set: { cause: "an old friend", size: 4, duration: "a stretch", dread: 5 } },
        { label: "A quick wobble", plain: "A small slip in a moment, caught only by us.", set: { size: 1, duration: "a moment", caught: "the audience only", change: "snaps" } },
      ],
    },
  });

  W.add("resistance", {
    sliders: [
      ["cracking", "Starting to give way", ["not at all", "a flicker", "wavering", "about to give"], "How close the character is to letting the change in."],
      ["whoPushes", "Who's pushing them", ["no one", "a friend", "a love", "an enemy", "life itself"], "Who or what is pushing the character to change.", { unordered: true }],
      ["giveWay", "When they give way", [0, 100, "%"], "How far into the scene the resistance breaks, if it does."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "tiles", slider: "how", icons: { denial: "🙈", jokes: "😜", anger: "😠", "running away": "🏃", "doubling down": "🧱" } },
        { face: "ladder", slider: "cracking" },
      ],
      groups: [
        { label: "Fighting it", sliders: ["level", "how", "whoPushes"] },
        { label: "Giving way", sliders: ["cracking", "giveWay", "change"] },
        { label: "Seen", sliders: ["noticeable"] },
      ],
      presets: [
        { label: "Groundhog Day denial", plain: "Jokes and denial against life itself, with no give yet.", set: { how: "jokes", whoPushes: "life itself", level: 5, cracking: "not at all" } },
        { label: "As Good as It Gets", plain: "A love pushes; he fights with anger but wavers.", set: { how: "anger", whoPushes: "a love", cracking: "wavering", giveWay: 85 } },
      ],
    },
  });

  W.add("changeShows", {
    sliders: [
      ["contrast", "Before and after side by side", ["not compared", "loosely echoed", "clear echo", "mirror image"], "How directly the film puts the new way next to the old one, often by echoing an early shot."],
      ["noticedBy", "Who notices the change", ["no one", "the audience", "one character", "everyone"], "Who in the story sees that they have changed."],
      ["landsAt", "When in the scene it shows", [0, 100, "%"], "How far into the scene the outward sign appears."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "through", icons: { clothes: "👔", posture: "🧍", speech: "🗣️", "a habit": "🚬", "a place": "🏠", "an object": "🔑" } },
        { face: "dial", slider: "visible" },
      ],
      groups: [
        { label: "The sign", sliders: ["visible", "through", "noticeable"] },
        { label: "Echo and witness", sliders: ["contrast", "noticedBy"] },
        { label: "Timing", sliders: ["landsAt", "change"] },
      ],
      presets: [
        { label: "Devil Wears Prada makeover", plain: "New clothes, showy, and everyone notices.", set: { through: "clothes", visible: 5, noticeable: "showy", noticedBy: "everyone" } },
        { label: "Final shot mirrors the first", plain: "The opening image comes back with one small difference.", set: { contrast: "mirror image", landsAt: 95, noticeable: "subtle", noticedBy: "the audience" } },
        { label: "Habit dropped", plain: "They quietly put down the thing they always did.", set: { through: "a habit", visible: 2, noticedBy: "one character" } },
      ],
    },
  });

  /* ---------- Plot ---------- */

  W.add("plotWant", {
    sliders: [
      ["wantShown", "How clear the want is", ["unclear", "hinted", "clear", "spelled out"], "How plainly the audience understands what the character is chasing; a clear goal gives the film direction."],
      ["needCost", "What the need asks of them", ["little", "a habit", "a belief", "who they are"], "How much the character must give up to get what they really need."],
      ["gapCloses", "Gap closing or widening", ["widening", "holding", "closing"], "Whether this scene moves the want and the need apart or together."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "gap", left: "the same", right: "opposite" },
        { face: "pad", x: "chase", y: "sees", xLabel: "Chase", yLabel: "Sees it" },
      ],
      groups: [
        { label: "The want", sliders: ["chase", "wantShown"] },
        { label: "The need", sliders: ["gap", "needCost"] },
        { label: "Seeing it", sliders: ["sees", "gapCloses"] },
      ],
      presets: [
        { label: "Citizen Kane", plain: "Chases power hard, blind to the love he needs.", set: { gap: "opposite", sees: "blind to it", chase: 5, wantShown: "spelled out" } },
        { label: "Moment of clarity", plain: "The gap closes as they finally see it.", set: { sees: "knows", gapCloses: "closing", gap: "close" } },
        { label: "Indie drift", plain: "A muddy want and a quiet need, slowly widening.", set: { wantShown: "hinted", chase: 1, gapCloses: "widening" } },
      ],
    },
  });

  W.add("plotProgress", {
    sliders: [
      ["surprise", "Expected or a surprise", ["expected", "a twist", "out of nowhere"], "Whether the audience sees the step or setback coming."],
      ["newProblem", "Opens a new problem", ["no", "a small one", "a big one"], "Whether this win or loss creates a fresh problem that pulls us into the next scene."],
      ["lands", "When it lands", [0, 100, "%"], "How far into the scene the move forward or back happens."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "move", left: "big setback", right: "big step forward" },
        { face: "dial", slider: "lands" },
      ],
      groups: [
        { label: "The move", sliders: ["move", "cause", "surprise"] },
        { label: "What it sets up", sliders: ["newProblem", "lands"] },
        { label: "Feel", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Yes, but...", plain: "A step forward that opens a bigger problem at the end of the scene.", set: { move: "step forward", newProblem: "a big one", lands: 90 } },
        { label: "Empire Strikes Back", plain: "A big setback from another character, out of nowhere.", set: { move: "big setback", cause: "another character", surprise: "out of nowhere" } },
        { label: "Own worst enemy", plain: "They knock themselves back, and we saw it coming.", set: { move: "setback", cause: "their own", surprise: "expected" } },
      ],
    },
  });

  W.add("openQuestions", {
    sliders: [
      ["raised", "New questions raised", [0, 3, "questions"], "How many fresh questions this scene opens."],
      ["urgency", "How badly we need to know", [0, 5, ""], "How much the biggest question nags at the audience and pulls them forward."],
      ["answerKind", "How answers land", ["no answers", "half answers", "clean answers", "answers that raise more"], "Whether answers close a question or open new ones."],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["setting", "raised", "answered"] },
        { face: "dial", slider: "urgency" },
        { face: "tiles", slider: "kind", icons: { "what happens next": "⏭️", "will they make it": "🏁", "who did it": "🕵️", why: "❓", "what is it": "📦" } },
      ],
      groups: [
        { label: "Open questions", sliders: ["setting", "kind", "urgency"] },
        { label: "Opened and closed here", sliders: ["raised", "answered", "answerKind"] },
      ],
      presets: [
        { label: "Mystery box (Lost)", plain: "Many open questions; each answer raises another.", set: { setting: 5, kind: "what is it", answerKind: "answers that raise more", raised: 2 } },
        { label: "Agatha Christie reveal", plain: "The big who-did-it is answered cleanly.", set: { kind: "who did it", answered: 3, answerKind: "clean answers", raised: 0 } },
        { label: "Cold open hook", plain: "One burning question, opened right away.", set: { setting: 1, raised: 1, urgency: 5, answered: 0 } },
      ],
    },
  });

  W.add("plotTouch", {
    sliders: [
      ["foreshadow", "Hinted before it meets", ["no hint", "a hint", "clearly set up"], "Whether earlier scenes let us see the two plots heading for each other."],
      ["impact", "What the meeting does", ["brushes past", "bends the main plot", "changes everything"], "How much the main plot is changed when the two meet."],
      ["anticipation", "We feel them converging", [0, 5, ""], "How strongly the audience senses the two plots are about to collide."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "pad", x: "pull", y: "anticipation", xLabel: "Pull", yLabel: "We feel it coming" },
      ],
      groups: [
        { label: "Meeting", sliders: ["setting", "who", "impact"] },
        { label: "Getting there", sliders: ["pull", "foreshadow", "anticipation", "change"] },
      ],
      presets: [
        { label: "Pulp Fiction collision", plain: "Separate stories crash into each other out of nowhere.", set: { setting: "joined", foreshadow: "no hint", impact: "changes everything" } },
        { label: "Love Actually crossing", plain: "Side stories brush past each other, lightly set up.", set: { setting: "crossing", who: "a side character", impact: "brushes past", foreshadow: "a hint" } },
        { label: "Slow converging threads", plain: "We feel them heading for each other for a long time.", set: { setting: "apart", anticipation: 5, foreshadow: "clearly set up", change: "drifts" } },
      ],
    },
  });

  W.add("plotSecret", {
    sliders: [
      ["nearMiss", "Close calls in the scene", [0, 5, ""], "How many times the secret nearly slips out; each one tightens the suspense."],
      ["hiding", "How hard they work to hide it", ["relaxed", "careful", "sweating", "frantic"], "How much effort the character spends keeping it hidden."],
      ["revealWay", "How it would come out", ["they confess", "found out", "blurted", "shown in public"], "The way the secret comes out, or is about to."],
      ["revealAt", "When it comes out", [0, 100, "%"], "How far into the scene the secret comes out, if it does."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "kept" },
        { face: "mixer", sliders: ["cost", "nearMiss"] },
      ],
      groups: [
        { label: "The secret", sliders: ["kept", "whoKnows", "cost"] },
        { label: "Keeping it", sliders: ["hiding", "nearMiss"] },
        { label: "The reveal", sliders: ["revealWay", "revealAt"] },
      ],
      presets: [
        { label: "Hitchcock bomb under the table", plain: "We know; they don't; the near misses keep coming.", set: { whoKnows: "the audience too", kept: "close call", nearMiss: 4, hiding: "sweating" } },
        { label: "Farce with a closet", plain: "Frantic hiding with secrets slipping everywhere.", set: { hiding: "frantic", nearMiss: 5, kept: "slipping", whoKnows: "the audience too" } },
        { label: "Public unmasking", plain: "The secret comes out in front of everyone at the end.", set: { kept: "out", revealWay: "shown in public", revealAt: 90, cost: 5 } },
      ],
    },
  });

  W.add("tickingClock", {
    sliders: [
      ["timeLeft", "Time left", [0, 120, "min"], "How much story time is left before the deadline."],
      ["reminders", "How often we're reminded", ["once", "now and then", "often", "constantly"], "How often the scene reminds us of the deadline."],
      ["consequence", "What happens if it runs out", ["embarrassment", "a loss", "a disaster", "a death"], "What the characters lose if the clock beats them."],
      ["acceleration", "How fast it closes in", ["steady", "speeding up", "racing"], "Whether time seems to run out evenly or faster and faster."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "timeLeft" },
      ],
      groups: [
        { label: "The clock", sliders: ["setting", "timeLeft", "acceleration"] },
        { label: "Seen and felt", sliders: ["shown", "reminders"] },
        { label: "Stakes", sliders: ["consequence"] },
      ],
      presets: [
        { label: "High Noon", plain: "Clocks on every wall, ticking toward a gunfight.", set: { setting: "tight", shown: "on screen", reminders: "constantly", consequence: "a death" } },
        { label: "Bomb with a red display", plain: "Seconds left, racing.", set: { setting: "seconds left", timeLeft: 1, acceleration: "racing", shown: "on screen" } },
        { label: "Parents are coming home", plain: "A loose comedy deadline, mentioned now and then.", set: { setting: "loose", consequence: "embarrassment", reminders: "now and then", shown: "only mentioned" } },
      ],
    },
  });

  W.add("knowledgeGap", {
    sliders: [
      ["howTold", "How the audience learns it", ["a cutaway", "overheard", "a clue", "told outright"], "The way the important fact reaches the audience.", { unordered: true }],
      ["revealAt", "When the gap closes", [0, 100, "%"], "How far into the scene the character (or audience) catches up."],
      ["tension", "How much we squirm", [0, 5, ""], "How tightly the gap holds the audience's attention while they wait for it to close."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "audience first": "👀", together: "🤝", "character first": "🤐", "nobody (surprise)": "💥" } },
        { face: "dial", slider: "tension" },
      ],
      groups: [
        { label: "Who knows", sliders: ["setting", "gap", "howTold"] },
        { label: "Closing the gap", sliders: ["revealAt", "tension"] },
      ],
      presets: [
        { label: "Hitchcock suspense", plain: "We see the bomb long before they do and squirm.", set: { setting: "audience first", gap: "a scene", howTold: "a cutaway", tension: 5 } },
        { label: "Sixth Sense twist", plain: "Nobody knows until it hits at the very end.", set: { setting: "nobody (surprise)", revealAt: 98 } },
        { label: "Detective's private hunch", plain: "The character knows; we follow the clues.", set: { setting: "character first", howTold: "a clue", gap: "most of the film" } },
      ],
    },
  });

  W.add("plotWeight", {
    sliders: [
      ["handoff", "Leads into their next scene", ["no", "loosely", "directly"], "Whether this scene hands off straight into the character's next story beat, carrying us forward."],
      ["spotlight", "Where the camera's eye rests", ["elsewhere", "shares them", "on them"], "Whether the scene steers the audience's attention to this character."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "mixer", sliders: ["setting", "screenShare"] },
        { face: "ladder", slider: "stakes" },
      ],
      groups: [
        { label: "Weight", sliders: ["setting", "trend", "screenShare"] },
        { label: "Stakes", sliders: ["stakes"] },
        { label: "Attention and flow", sliders: ["spotlight", "handoff", "noticeable"] },
      ],
      presets: [
        { label: "Their big scene", plain: "The whole scene is theirs and everything is on the line.", set: { setting: 5, screenShare: 90, spotlight: "on them", stakes: "a life" } },
        { label: "B-story check-in", plain: "A small slice that keeps their thread alive.", set: { setting: 1, screenShare: 15, spotlight: "shares them", handoff: "loosely" } },
      ],
    },
  });

  /* ---------- Mindset ---------- */

  W.add("perspectiveWidth", {
    sliders: [
      ["tested", "Tested by a choice", ["not tested", "a small choice", "a hard choice"], "Whether the scene forces the character to act on how wide their circle is."],
      ["triggeredBy", "What moves the circle", ["a person", "a loss", "a win", "a sight", "an argument"], "What makes the character care about more people, or fewer.", { unordered: true }],
      ["shownTo", "Shown to us by", ["what they say", "what they do", "what they give up"], "How the audience sees whose good they weigh."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "shift", left: "shrinking", right: "growing" },
      ],
      groups: [
        { label: "The circle", sliders: ["setting", "strength", "shift"] },
        { label: "What moves it", sliders: ["triggeredBy", "tested", "change"] },
        { label: "Shown", sliders: ["shownTo"] },
      ],
      presets: [
        { label: "Schindler's list", plain: "From self to the world, shown by what he gives up.", set: { setting: "world", shift: "growing", shownTo: "what they give up", tested: "a hard choice" } },
        { label: "Han Solo comes back", plain: "From self to the group in one turn.", set: { setting: "group", shift: "growing", change: "snaps", triggeredBy: "a person" } },
        { label: "Closing ranks", plain: "A loss shrinks their care to family only.", set: { setting: "family", shift: "shrinking", triggeredBy: "a loss" } },
      ],
    },
  });

  W.add("mindset", {
    sliders: [
      ["listening", "How well they listen", ["shuts out", "half hears", "listens", "takes it in"], "How much the character lets in what others tell them."],
      ["turningPoint", "When the mind shifts", [0, 100, "%"], "How far into the scene the change of mind happens, if it does."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "pad", x: "pressure", y: "challenge", xLabel: "Pressure", yLabel: "Belief challenged" },
      ],
      groups: [
        { label: "The mind", sliders: ["setting", "selfDeceit", "listening"] },
        { label: "Pressure", sliders: ["pressure", "challenge"] },
        { label: "Timing", sliders: ["turningPoint", "change"] },
      ],
      presets: [
        { label: "12 Angry Men holdout", plain: "Fixed, fooling themself, under huge pressure.", set: { setting: "fixed", pressure: 5, selfDeceit: "a lot", listening: "shuts out" } },
        { label: "Change of heart", plain: "Opens up late in the scene after real listening.", set: { setting: "open", listening: "takes it in", turningPoint: 80, change: "steps" } },
      ],
    },
  });

  W.add("cm-perspective", {
    sliders: [
      ["trigger", "What opens or closes them", ["a person", "an event", "a place", "an idea"], "What pushes their way of seeing open or shut.", { unordered: true }],
      ["resists", "How much they resist", [0, 5, ""], "How hard they push back against seeing things differently."],
      ["shiftAt", "When it shifts", [0, 100, "%"], "How far into the scene the outlook moves."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "position", left: "closed", right: "widening" },
        { face: "dial", slider: "swing" },
      ],
      groups: [
        { label: "Outlook", sliders: ["position", "swing", "shown"] },
        { label: "What moves it", sliders: ["trigger", "resists", "shiftAt"] },
      ],
      presets: [
        { label: "Travel opens their eyes", plain: "A new place widens them, plain to see.", set: { position: 80, trigger: "a place", shown: "plain to see", resists: 1 } },
        { label: "Stubborn and closed", plain: "Narrow and fighting it, hidden from others.", set: { position: 10, resists: 5, shown: "hidden", swing: 5 } },
      ],
    },
  });

  W.add("beliefShown", {
    sliders: [
      ["cost", "What showing it costs", [0, 5, ""], "How much the character risks by acting on the belief."],
      ["witness", "Who sees it", ["no one", "the audience", "one character", "everyone"], "Who is there when the belief shows."],
      ["shownAt", "When in the scene", [0, 100, "%"], "How far into the scene the belief comes out."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "how" },
        { face: "balance", slider: "against", left: "matches", right: "opposite" },
      ],
      groups: [
        { label: "How it shows", sliders: ["how", "against", "noticeable"] },
        { label: "Stakes", sliders: ["cost", "witness"] },
        { label: "Timing", sliders: ["shownAt", "change"] },
      ],
      presets: [
        { label: "Show, don't tell", plain: "A small act that speaks louder than words.", set: { how: "a small act", against: "matches", noticeable: "subtle" } },
        { label: "Hypocrite exposed", plain: "Their choice is the opposite of what they say, in front of everyone.", set: { how: "a big choice", against: "opposite", witness: "everyone", cost: 4 } },
        { label: "Courtroom speech", plain: "Said out loud, late, at great cost.", set: { how: "said out loud", shownAt: 85, cost: 5, witness: "everyone" } },
      ],
    },
  });

  /* ---------- Focus ---------- */

  W.add("focusShift", {
    sliders: [
      ["onto", "Closing in on", ["a thought", "a person", "an object", "a goal", "a threat"], "What the focus narrows onto, or opens away from.", { unordered: true }],
      ["cameraFollows", "Camera follows it", ["ignores it", "hints", "follows it"], "Whether the camera narrows or widens with the character's focus, steering our attention too."],
      ["shiftAt", "When it shifts", [0, 100, "%"], "How far into the scene the focus starts to move."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "narrowing", right: "widening" },
        { face: "dial", slider: "speed" },
      ],
      groups: [
        { label: "The shift", sliders: ["setting", "onto", "speed"] },
        { label: "Seen", sliders: ["cameraFollows", "noticeable"] },
        { label: "Timing", sliders: ["shiftAt"] },
      ],
      presets: [
        { label: "Tunnel vision", plain: "Focus slams onto a threat and the camera closes in with it.", set: { setting: "narrowing", onto: "a threat", speed: 5, cameraFollows: "follows it" } },
        { label: "Looking up from the work", plain: "They slowly open out to the room around them.", set: { setting: "widening", speed: 1, shiftAt: 60, cameraFollows: "hints" } },
      ],
    },
  });

  W.add("distraction", {
    sliders: [
      ["duration", "How long it holds them", ["a glance", "a moment", "a while", "the whole scene"], "How long the distraction keeps their attention."],
      ["audienceSees", "Audience sees what they miss", ["no", "partly", "clearly"], "Whether we can see the thing the character is missing, which pulls our eye and makes us want to shout."],
      ["snapBack", "How they snap back", ["drift back", "a nudge", "a jolt", "too late"], "How the character's attention returns to what matters."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "pull" },
        { face: "tiles", slider: "source", icons: { "a thought": "💭", "a person": "🧑", "an object": "🔮", "a sound": "🔔", "a screen": "📱" } },
        { face: "ladder", slider: "missed" },
      ],
      groups: [
        { label: "The pull", sliders: ["pull", "source", "duration"] },
        { label: "What it costs", sliders: ["missed", "audienceSees", "snapBack"] },
      ],
      presets: [
        { label: "Behind you!", plain: "We see the danger they miss while staring at their phone.", set: { source: "a screen", missed: "a warning", audienceSees: "clearly", snapBack: "too late" } },
        { label: "Daydream gag", plain: "A thought carries them off until a jolt brings them back.", set: { source: "a thought", duration: "a while", snapBack: "a jolt", missed: "the whole point" } },
      ],
    },
  });

  W.add("fixation", {
    sliders: [
      ["onWhat", "Fixed on", ["an object", "a person", "an idea", "a sound", "a memory"], "What the character cannot stop looking at or thinking about.", { unordered: true }],
      ["returns", "How often they go back to it", ["once", "now and then", "often", "constantly"], "How often the character's eyes or thoughts return to it in the scene."],
      ["weLook", "We look at it too", [0, 5, ""], "How strongly the film steers the audience's eye to the thing they are fixed on."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "grip" },
        { face: "tiles", slider: "onWhat", icons: { "an object": "💍", "a person": "🧑", "an idea": "💡", "a sound": "🔊", "a memory": "🕰️" } },
      ],
      groups: [
        { label: "The fixation", sliders: ["grip", "onWhat", "returns"] },
        { label: "Seen", sliders: ["shared", "weLook", "noticeable"] },
        { label: "Change", sliders: ["change"] },
      ],
      presets: [
        { label: "Gollum and the ring", plain: "An object they can't stop looking at, and neither can we.", set: { onWhat: "an object", grip: 5, returns: "constantly", weLook: 5 } },
        { label: "The Tell-Tale Heart", plain: "A sound only they hear, growing louder.", set: { onWhat: "a sound", shared: "no one", change: "drifts", grip: 4 } },
      ],
    },
  });

  W.add("focusWidth", {
    sliders: [
      ["misses", "What they miss", ["nothing", "a detail", "a warning", "the whole point"], "What slips past because their focus is so narrow or so wide."],
      ["steersUs", "Our focus matches theirs", ["we see more", "we see the same", "we see less"], "Whether the audience's attention is wider, the same, or narrower than the character's."],
      ["shiftAt", "When it changes", [0, 100, "%"], "How far into the scene the width of their focus moves."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "camera", icons: { "ignores it": "🎥", hints: "👉", "follows it": "🎯" } },
      ],
      groups: [
        { label: "Focus", sliders: ["setting", "strength", "misses"] },
        { label: "The audience", sliders: ["camera", "steersUs", "noticeable"] },
        { label: "Timing", sliders: ["shiftAt"] },
      ],
      presets: [
        { label: "Sherlock scanning the room", plain: "Wide, sharp attention that sees more than we do.", set: { setting: "the room", strength: 5, steersUs: "we see less", misses: "nothing" } },
        { label: "Lovestruck", plain: "Only one person exists; the camera agrees.", set: { setting: "one person", camera: "follows it", misses: "a warning" } },
      ],
    },
  });

  W.add("cm-focus", {
    sliders: [
      ["onWhat", "What holds their focus", ["a task", "a person", "a worry", "a goal", "everything"], "The thing their attention rests on.", { unordered: true }],
      ["cameraFollows", "Camera follows their focus", ["ignores it", "hints", "follows it"], "Whether the camera's framing narrows or widens with their attention."],
      ["shiftAt", "When it shifts", [0, 100, "%"], "How far into the scene the focus moves."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "position", left: "narrow", right: "wide" },
        { face: "dial", slider: "swing" },
      ],
      groups: [
        { label: "Focus", sliders: ["position", "onWhat", "swing"] },
        { label: "Seen", sliders: ["shown", "cameraFollows", "shiftAt"] },
      ],
      presets: [
        { label: "Whiplash practice room", plain: "Narrow on one task, the camera locked with them.", set: { position: 5, onWhat: "a task", cameraFollows: "follows it", shown: "plain to see" } },
        { label: "Taking it all in", plain: "Wide open, aware of everything around.", set: { position: 95, onWhat: "everything", cameraFollows: "hints" } },
      ],
    },
  });

  /* ---------- Herd ---------- */

  W.add("dissenter", {
    sliders: [
      ["firmness", "How firmly they hold out", ["gives in fast", "wavers", "holds", "won't budge"], "How long they stand against the group once they start."],
      ["isolation", "Shown alone in the frame", ["blends in", "a little apart", "set apart", "totally alone"], "How far the picture separates the dissenter from the group."],
      ["speakAt", "When they speak up", [0, 100, "%"], "How far into the scene the dissent breaks out."],
      ["rooting", "How much we side with them", [0, 5, ""], "How strongly the audience is on the dissenter's side, pulling us into the scene."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "against" },
        { face: "frame", x: "isolation" },
        { face: "mixer", sliders: ["cost", "rooting"] },
      ],
      groups: [
        { label: "Standing against", sliders: ["against", "firmness", "speakAt"] },
        { label: "Cost and followers", sliders: ["cost", "joined"] },
        { label: "Picture and audience", sliders: ["isolation", "rooting"] },
      ],
      presets: [
        { label: "12 Angry Men juror 8", plain: "Holds out alone and slowly turns the room.", set: { against: "speaks up", firmness: "won't budge", joined: "the whole group turns", isolation: "set apart" } },
        { label: "Lone voice crushed", plain: "Openly defies, pays dearly, and no one follows.", set: { against: "openly defies", cost: 5, joined: "no one", isolation: "totally alone" } },
        { label: "Quiet doubter", plain: "Doubts but goes along.", set: { against: "quiet doubts", firmness: "gives in fast", isolation: "a little apart" } },
      ],
    },
  });

  W.add("herdMentality", {
    sliders: [
      ["direction", "Where the herd is going", ["toward good", "nowhere in particular", "toward harm"], "Whether the group's one mind is heading somewhere good or bad."],
      ["inFrame", "How the group looks in frame", ["scattered", "loose clusters", "a pack", "one mass"], "How tightly the picture packs the group together."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "pressure", xLabel: "One mind", yLabel: "Peer pressure" },
        { face: "tiles", slider: "size", icons: { two: "👥", "a few": "👨‍👩‍👦", "a group": "👪", "a crowd": "🏟️" } },
      ],
      groups: [
        { label: "The herd", sliders: ["setting", "size", "direction"] },
        { label: "Spreading", sliders: ["pressure", "speed", "change"] },
        { label: "Picture", sliders: ["inFrame"] },
      ],
      presets: [
        { label: "Lord of the Flies", plain: "A pack that becomes one mind heading toward harm.", set: { setting: 5, direction: "toward harm", inFrame: "a pack", speed: 4 } },
        { label: "Stadium wave", plain: "A crowd catches one feeling fast, for good.", set: { size: "a crowd", speed: 5, direction: "toward good", inFrame: "one mass" } },
      ],
    },
  });

  W.add("herdLeader", {
    sliders: [
      ["leadsBy", "How they lead", ["example", "charm", "fear", "loudness", "reason"], "What makes the group follow this leader.", { unordered: true }],
      ["challenged", "Leader challenged", ["unchallenged", "doubted", "questioned openly", "overthrown"], "How much the group pushes back on who leads."],
      ["placement", "Leader's place in frame", [0, 100, "%"], "Where across the picture the leader stands, from the edge to the middle of the group."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "leadsBy", icons: { example: "🚶", charm: "😏", fear: "😱", loudness: "📣", reason: "🧠" } },
        { face: "frame", x: "placement" },
        { face: "ladder", slider: "challenged" },
      ],
      groups: [
        { label: "Who leads", sliders: ["setting", "leadsBy", "strength"] },
        { label: "Holding the lead", sliders: ["challenged", "change"] },
        { label: "Picture", sliders: ["placement"] },
      ],
      presets: [
        { label: "Braveheart speech", plain: "One voice leads by example from the middle of the crowd.", set: { setting: "one voice", leadsBy: "example", strength: 5, placement: 50 } },
        { label: "Mutiny", plain: "The leader is questioned and overthrown in one snap.", set: { challenged: "overthrown", change: "snaps", setting: "the crowd" } },
      ],
    },
  });

  W.add("groupPressure", {
    sliders: [
      ["outnumbered", "How many against one", ["one", "a few", "most", "everyone"], "How many people are leaning on the one person."],
      ["gives", "Does the person give in", ["holds firm", "wavers", "gives in"], "How the person under pressure answers it."],
      ["isolation", "Person alone in the frame", [0, 100, "%"], "How far across the picture the one person is set apart from the group."],
      ["build", "How the pressure builds", ["all at once", "in waves", "slowly mounting"], "Whether the group leans in suddenly or tightens bit by bit, pulling us in."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "press" },
        { face: "frame", x: "isolation" },
        { face: "balance", slider: "gives", left: "holds firm", right: "gives in" },
      ],
      groups: [
        { label: "The pressure", sliders: ["press", "outnumbered", "build", "change"] },
        { label: "Shown", sliders: ["shownBy", "isolation", "noticeable"] },
        { label: "The answer", sliders: ["gives"] },
      ],
      presets: [
        { label: "Asch conformity test", plain: "Everyone says the wrong answer; the one person gives in.", set: { outnumbered: "everyone", gives: "gives in", build: "slowly mounting", shownBy: "looks" } },
        { label: "Courtroom isolation", plain: "One figure alone on one side of the frame, holding firm.", set: { isolation: 90, shownBy: "placement", gives: "holds firm", press: 5 } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
