/* Comedy, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  W.add("mixPlot", {
    sliders: [
      ["peopleCaught", "People pulled into the trouble", [1, 20, "people"], "How many characters end up tangled in what the mix sets off.", { from: 2, to: 2 }],
      ["scenesChanged", "Later scenes it changes", [0, 20, "scenes"], "How many scenes after this one play out differently because of it.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["peopleCaught", "scenesChanged"] }] },
  });

  W.add("comicFlaw", {
    sliders: [
      ["showsPerScene", "Times it shows per scene", [0, 10, ""], "How many times in a scene the flaw trips them up.", { from: 1, to: 1 }],
      ["kickIn", "Seconds for the flaw to kick in", [0, 10, "s", 0.5], "How quickly the flaw takes over once something sets it off.", { from: 1, to: 1 }],
      ["whoPays", "Who pays for it", ["themselves", "a friend", "a stranger", "the whole group"], "Who suffers when the flaw takes over.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["showsPerScene", "kickIn", "whoPays"] }] },
  });

  W.add("comicPremise", {
    sliders: [
      ["screenShare", "Share of the scene on it", [0, 100, "%", 5], "How much of the scene's running time is spent playing the premise.", { from: 70, to: 70 }],
      ["premiseJokes", "Premise jokes per minute", [0, 6, "", 0.5], "How many laughs a minute come straight out of the 'what if'.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["screenShare", "premiseJokes"] }] },
  });

  W.add("escalatingLie", {
    sliders: [
      ["newLieGap", "Time between new lies", [5, 600, "s", 5], "How long the liar gets before they have to invent the next lie.", { from: 60, to: 60 }],
      ["coverPause", "Pause before each cover lie", [0, 10, "s", 0.5], "The awkward silence while the liar thinks up the next one.", { from: 1, to: 1 }],
      ["toldTo", "Who it's told to", ["a boss", "a partner", "a parent", "a stranger", "a crowd"], "The person the lie is mostly aimed at.", { unordered: true }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["newLieGap", "coverPause", "toldTo"] }],
      presets: [{ label: "Panicked liar", plain: "New lies every half minute, each after a long, sweaty pause.", set: { newLieGap: 30, coverPause: 3 } }],
    },
  });

  W.add("misunderstanding", {
    sliders: [
      ["between", "Between whom", ["two friends", "a couple", "boss and worker", "strangers", "a whole room"], "Who is talking past each other.", { unordered: true }],
      ["peopleIn", "People caught in it", [2, 12, "people"], "How many people believe the wrong thing.", { from: 2, to: 2 }],
      ["dawnSilence", "Silence when it clears", [0, 10, "s", 0.5], "The beat of silence once they finally realize what the other meant.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["between", "peopleIn", "dawnSilence"] }] },
  });

  W.add("whoKnows", {
    sliders: [
      ["inOn", "People in on it", [0, 20, "people"], "How many people in the scene know the secret.", { from: 2, to: 2 }],
      ["roomSize", "People in the room", [2, 30, "people"], "How many people are there in all, knowing or not.", { from: 5, to: 5 }],
      ["closeCalls", "Close calls per scene", [0, 10, ""], "How many times the secret nearly slips out.", { from: 2, to: 2 }],
      ["lookLength", "Length of insider looks", [0, 4, "s", 0.5], "How long the people in on it hold a knowing look.", { from: 1, to: 1 }],
    ],
    window: {
      faces: [{ face: "pad", x: "roomSize", y: "inOn", xLabel: "People in the room", yLabel: "People in on it" }],
      groups: [{ label: "Measured", sliders: ["inOn", "roomSize", "closeCalls", "lookLength"] }],
    },
  });

  W.add("comicEscalation", {
    sliders: [
      ["stepJump", "Each step bigger by", [0, 200, "%", 5], "How much bigger each step is than the one before it.", { from: 50, to: 50 }],
      ["calmLength", "Length of the calm", [0, 30, "s", 0.5], "How long the quiet lasts before things spiral.", { from: 3, to: 3 }],
      ["peopleAtEnd", "People caught up by the end", [1, 50, "people"], "How many people the mess has swallowed at its peak.", { from: 5, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["stepJump", "calmLength", "peopleAtEnd"] }] },
  });

  W.add("comicBeat", {
    sliders: [
      ["plantToPayoff", "Minutes from setup to payoff", [0, 90, "min", 0.5], "How much screen time passes between planting the joke and the laugh.", { from: 5, to: 5 }],
      ["setupSeen", "How long the setup is seen", [0, 30, "s", 0.5], "How many seconds the setup stays on screen or in the air.", { from: 3, to: 3 }],
      ["payoffPause", "Beat before the payoff", [0, 3, "s", 0.25], "The tiny pause just before the payoff lands.", { from: 0.5, to: 0.5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["plantToPayoff", "setupSeen", "payoffPause"] }] },
  });

  W.add("payoffDistance", {
    sliders: [
      ["minutes", "Minutes from setup to payoff", [0, 120, "min", 1], "The same gap counted in screen minutes instead of scenes.", { from: 10, to: 10 }],
      ["plantedIn", "Setup planted in", ["a line", "a prop", "an action", "a sound", "a background detail"], "What carries the setup we will be paid back for.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["minutes", "plantedIn"] }] },
  });

  W.add("typeClash", {
    sliders: [
      ["clashesPerScene", "Clashes per scene", [0, 10, ""], "How many times in a scene their differences spark.", { from: 2, to: 2 }],
      ["apart", "Space between them", [0, 10, "m", 0.5], "How far apart they stand; opposites often keep their distance.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["clashesPerScene", "apart"] }] },
  });

  W.add("chaosInRoom", {
    sliders: [
      ["roomPeople", "People in the room", [2, 100, "people"], "How many people the chaos has to work on.", { from: 10, to: 10 }],
      ["arrivesAt", "When chaos arrives", [0, 100, "%"], "How far through the scene the disorder first shows up.", { from: 20, to: 20 }],
      ["frameShare", "Chaos fills the frame", [0, 100, "%", 5], "How much of the picture the chaos takes up.", { from: 30, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["roomPeople", "arrivesAt", "frameShare"] }] },
  });

  W.add("statusGap", {
    sliders: [
      ["heightGap", "Higher in frame by", [-50, 50, "%"], "How much higher in the picture the higher-ranked one sits, as a share of the frame; below zero the low one is higher.", { from: 10, to: 10 }],
      ["lookUp", "Looks up at them by", [-45, 45, "°"], "The angle the lower-ranked one looks up at the higher one; below zero they look down.", { from: 10, to: 10 }],
      ["rankAgainst", "Rank measured against", ["the boss", "the family", "the room", "society"], "What ladder the rank is on.", { unordered: true }],
    ],
    window: {
      faces: [{ face: "pad", x: "lookUp", y: "heightGap", xLabel: "Looks up by", yLabel: "Higher in frame by" }],
      groups: [{ label: "Measured", sliders: ["heightGap", "lookUp", "rankAgainst"] }],
    },
  });

  W.add("mixArc", {
    sliders: [
      ["changeAt", "When the change shows", [0, 100, "%"], "How far through the story the change becomes visible.", { from: 75, to: 75 }],
      ["scenesTogether", "Scenes they share", [1, 40, "scenes"], "How many scenes the characters spend together to be changed.", { from: 8, to: 8 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["changeAt", "scenesTogether"] }] },
  });

  W.add("callback", {
    sliders: [
      ["minutesBack", "Minutes since the original", [0, 120, "min", 1], "How much screen time has passed since the moment being called back.", { from: 20, to: 20 }],
      ["callPause", "Pause before the callback", [0, 3, "s", 0.25], "The beat that lets us remember just before it lands.", { from: 0.5, to: 0.5 }],
      ["echoes", "What is called back", ["a line", "an image", "a sound", "a gesture", "a prop"], "Which earlier thing comes round again.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["minutesBack", "callPause", "echoes"] }] },
  });

  W.add("misdirection", {
    sliders: [
      ["hiddenShare", "How much of the truth is hidden", [0, 100, "%", 5], "How much of what is really happening is kept out of sight.", { from: 80, to: 80 }],
      ["revealBeat", "Beat before the reveal", [0, 5, "s", 0.25], "The pause just before the truth is shown.", { from: 1, to: 1 }],
      ["revealTakes", "Seconds the reveal takes", [0, 10, "s", 0.5], "How long the truth takes to come into view, from a cut (0) to a slow pull-back.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["hiddenShare", "revealBeat", "revealTakes"] }] },
  });

  W.add("irony", {
    sliders: [
      ["feltBeat", "Beat before it's felt", [0, 5, "s", 0.5], "The pause that lets the audience catch the irony.", { from: 1, to: 1 }],
      ["holdOnIt", "Hold on the ironic image", [0, 10, "s", 0.5], "How long the camera stays on the moment that proves it.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["feltBeat", "holdOnIt"] }] },
  });

  W.add("fishOutOfWater", {
    sliders: [
      ["fromOthers", "Space from everyone else", [0, 10, "m", 0.5], "How far they stand from the people who belong.", { from: 1, to: 1 }],
      ["fitAt", "When they finally fit", [0, 100, "%"], "How far through the story they stop sticking out.", { from: 80, to: 80 }],
      ["comparedTo", "Out of place next to", ["the locals", "the boss", "their partner", "the whole world"], "Who makes them look out of place.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fromOthers", "fitAt", "comparedTo"] }] },
  });

  W.add("humiliation", {
    sliders: [
      ["recoverSec", "Seconds to recover", [0, 30, "s", 0.5], "How long until they pull themselves together.", { from: 3, to: 3 }],
      ["frameSize", "How big they are in frame", [5, 200, "%"], "Their height as a share of the frame; small looks lonely, huge feels exposed.", { from: 60, to: 60 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["recoverSec", "frameSize"] }] },
  });

  W.add("egoClash", {
    sliders: [
      ["comebackGap", "Seconds between comebacks", [0, 10, "s", 0.5], "How fast each one answers the other.", { from: 1, to: 1 }],
      ["standOff", "Distance between them", [0.2, 5, "m", 0.1], "How close they stand while they fight.", { from: 1, to: 1 }],
      ["louderBy", "Each round louder by", [0, 100, "%", 5], "How much bigger each round gets than the last.", { from: 15, to: 15 }],
    ],
    window: {
      faces: [{ face: "pad", x: "standOff", y: "comebackGap", xLabel: "Distance between them", yLabel: "Seconds between comebacks" }],
      groups: [{ label: "Measured", sliders: ["comebackGap", "standOff", "louderBy"] }],
      presets: [{ label: "Nose to nose", plain: "Half a meter apart, firing back instantly.", set: { standOff: 0.5, comebackGap: 0, louderBy: 25 } }],
    },
  });

  W.add("alliances", {
    sliders: [
      ["groupSize", "People choosing sides", [2, 20, "people"], "How many people are taking sides.", { from: 4, to: 4 }],
      ["sideGap", "Space between the sides", [0, 10, "m", 0.5], "How far apart the sides stand in the room.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["groupSize", "sideGap"] }] },
  });

  W.add("unwantedGuest", {
    sliders: [
      ["arrivesAt", "When they show up", [0, 100, "%"], "How far through the scene the guest appears.", { from: 20, to: 20 }],
      ["fromHost", "Distance from the host", [0, 20, "m", 0.5], "How close the guest gets to the person who wants them gone.", { from: 3, to: 3 }],
      ["toHost", "Who they are to the host", ["an ex", "a boss", "a parent", "a rival", "a stranger"], "What the guest is to the person whose event it is.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["arrivesAt", "fromHost", "toHost"] }] },
  });

  W.add("comedyDevice", {
    sliders: [["jokeLength", "Length of the joke", [1, 120, "s", 1], "Seconds from the start of the joke to the laugh.", { from: 10, to: 10 }]],
    window: { groups: [{ label: "Measured", sliders: ["jokeLength"] }] },
  });

  W.add("absurdity", {
    sliders: [
      ["normalFirst", "Normal time before it turns", [0, 300, "s", 5], "How long things look ordinary before the strangeness shows.", { from: 30, to: 30 }],
      ["frameShare", "Share of frame that's absurd", [0, 100, "%", 5], "How much of the picture is taken up by the strange thing.", { from: 30, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["normalFirst", "frameShare"] }] },
  });

  W.add("cringe", {
    sliders: [
      ["faceSize", "How big the face is in frame", [5, 200, "%"], "The face's height as a share of the frame; closer feels more awkward.", { from: 50, to: 50 }],
      ["blunders", "Blunders in a row", [1, 8, ""], "How many awkward mistakes pile up before it stops.", { from: 1, to: 1 }],
      ["inFrontOf", "Awkward in front of", ["a date", "the boss", "family", "strangers", "a crowd"], "Whose eyes make it so painful.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["faceSize", "blunders", "inFrontOf"] }] },
  });

  W.add("jokeCarrier", {
    sliders: [
      ["across", "Where they are across the frame", [0, 100, "%"], "Left (0) to right (100) in the picture.", { from: 50, to: 50 }],
      ["frameSize", "How big they are in frame", [5, 200, "%"], "Their height as a share of the frame.", { from: 50, to: 50 }],
      ["lineShare", "Share of the funny lines", [0, 100, "%", 5], "How many of the scene's laughs come from this one person.", { from: 60, to: 60 }],
    ],
    window: {
      faces: [{ face: "frame", x: "across", size: "frameSize" }],
      groups: [{ label: "Measured", sliders: ["across", "frameSize", "lineShare"] }],
    },
  });

  W.add("comicReaction", {
    sliders: [
      ["faceSize", "Face size in the reaction", [5, 200, "%"], "How big the reacting face is in the frame.", { from: 70, to: 70 }],
      ["buildTime", "Seconds for it to build", [0, 5, "s", 0.25], "How long the reaction takes to grow to full size; a slow burn takes longer.", { from: 0.5, to: 0.5 }],
      ["reactsTo", "Reacting to", ["the joke-teller", "the target", "the thing that happened", "the audience"], "What the reactor is responding to.", { unordered: true }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["faceSize", "buildTime", "reactsTo"] }],
      presets: [{ label: "Slow burn close-up", plain: "A big face, a long build.", set: { faceSize: 120, buildTime: 3, setting: "a slow burn" } }],
    },
  });

  W.add("runningGag", {
    sliders: [
      ["minutesApart", "Minutes between returns", [1, 60, "min", 1], "Screen time between one appearance and the next.", { from: 12, to: 12 }],
      ["lastAt", "Last time we see it", [0, 100, "%"], "How far through the film the gag makes its final appearance.", { from: 95, to: 95 }],
      ["eachLength", "Seconds each time", [1, 60, "s", 1], "How long each return of the gag lasts.", { from: 5, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["minutesApart", "lastAt", "eachLength"] }] },
  });

  W.add("ruleOfThree", {
    sliders: [
      ["itemLength", "Seconds per item", [0.5, 20, "s", 0.5], "How long each item in the list takes.", { from: 2, to: 2 }],
      ["thirdLonger", "Third one longer by", [-50, 300, "%", 5], "How much longer the breaking item runs than the first two; below zero it is shorter.", { from: 0, to: 0 }],
      ["holdAfterBreak", "Hold after the break", [0, 5, "s", 0.5], "How long we wait after the third item before moving on.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["itemLength", "thirdLonger", "holdAfterBreak"] }] },
  });

  W.add("physicalComedy", {
    sliders: [
      ["fallHeight", "Height of the fall", [0, 5, "m", 0.1], "How far the body drops.", { from: 1, to: 1 }],
      ["warning", "Warning before it happens", [0, 10, "s", 0.5], "How long we can see it coming before it hits.", { from: 1, to: 1 }],
      ["downFor", "Seconds before they get up", [0, 20, "s", 0.5], "How long they lie there after it happens.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fallHeight", "warning", "downFor"] }] },
  });

  W.add("subversion", {
    sliders: [
      ["breakBeat", "Beat before the break", [0, 3, "s", 0.25], "The pause just before the cliche is broken.", { from: 0.5, to: 0.5 }],
      ["afterHold", "Hold after the break", [0, 10, "s", 0.5], "How long we stay on the broken moment.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["breakBeat", "afterHold"] }] },
  });

  W.add("comicEdit", {
    sliders: [
      ["shotLength", "Average shot length", [0.3, 15, "s", 0.1], "How long a shot lasts on average before the next cut.", { from: 3, to: 3 }],
      ["smashGap", "Line to smash cut", [0, 2, "s", 0.1], "How soon after the line the hard, sudden cut (a smash cut) hits.", { from: 0.2, to: 0.2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["shotLength", "smashGap"] }] },
  });

  W.add("fourthWall", {
    sliders: [
      ["offLens", "Eyes off the lens by", [0, 45, "°"], "How far the eyes are from looking straight down the lens; 0 is dead on.", { from: 0, to: 0 }],
      ["faceSize", "Face size in frame", [10, 200, "%"], "The face's height as a share of the frame when they look at us.", { from: 60, to: 60 }],
      ["asideLength", "Length of the aside", [0, 60, "s", 1], "How many seconds they talk to us.", { from: 5, to: 5 }],
    ],
    window: {
      faces: [{ face: "pad", x: "offLens", y: "faceSize", xLabel: "Eyes off the lens", yLabel: "Face size" }],
      groups: [{ label: "Measured", sliders: ["offLens", "faceSize", "asideLength"] }],
    },
  });

  W.add("doubleAct", {
    sliders: [
      ["lineGap", "Gap between their lines", [-1, 3, "s", 0.1], "Seconds between one line ending and the next starting; below zero they talk over each other.", { from: 0.3, to: 0.3 }],
      ["apart", "Distance between them", [0, 5, "m", 0.1], "How far apart the two stand.", { from: 1, to: 1 }],
      ["twoShot", "Time in one shot together", [0, 100, "%", 5], "How much of the scene shows both of them in the same frame.", { from: 70, to: 70 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["lineGap", "apart", "twoShot"] }] },
  });

  W.add("oddOneOut", {
    sliders: [
      ["fromGroup", "Distance from the group", [0, 15, "m", 0.5], "How far they stand from everyone else.", { from: 2, to: 2 }],
      ["groupSize", "Size of the group", [2, 50, "people"], "How many people they don't fit in with.", { from: 6, to: 6 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fromGroup", "groupSize"] }] },
  });

  W.add("chemistry", {
    sliders: [
      ["lookHold", "Length of their looks", [0, 6, "s", 0.25], "How long they hold each other's eyes.", { from: 1, to: 1 }],
      ["meters", "Meters between them", [0, 3, "m", 0.05], "The exact space between them.", { from: 0.8, to: 0.8 }],
      ["answerGap", "Gap between their lines", [-0.5, 3, "s", 0.1], "How fast one answers the other; below zero they overlap.", { from: 0.3, to: 0.3 }],
    ],
    window: {
      faces: [{ face: "pad", x: "meters", y: "lookHold", xLabel: "Meters apart", yLabel: "Length of looks" }],
      groups: [{ label: "Measured", sliders: ["lookHold", "meters", "answerGap"] }],
    },
  });

  W.add("comedyTopic", {
    sliders: [["sceneShare", "Share of the scene on it", [0, 100, "%", 5], "How much of the scene's time the jokes stay on this subject.", { from: 50, to: 50 }]],
    window: { groups: [{ label: "Measured", sliders: ["sceneShare"] }] },
  });

  W.add("comicTiming", {
    sliders: [
      ["beatLength", "Length of one beat", [0.2, 2, "s", 0.05], "How many seconds one beat of the pause lasts; beats times this is the whole pause.", { from: 0.5, to: 0.5 }],
      ["linesPerMin", "Lines per minute", [5, 60, ""], "How many lines are spoken in a minute.", { from: 20, to: 20 }],
      ["setupLength", "Setup length", [1, 60, "s", 1], "Seconds from the start of the setup to the punchline.", { from: 8, to: 8 }],
    ],
    window: {
      faces: [{ face: "pad", x: "setting", y: "beatLength", xLabel: "Beats of pause", yLabel: "Seconds per beat" }],
      groups: [{ label: "Measured", sliders: ["beatLength", "linesPerMin", "setupLength"] }],
      presets: [{ label: "Classic sitcom", plain: "A quick setup, one half-second beat, then the line.", set: { setting: 1, beatLength: 0.5, setupLength: 6, linesPerMin: 25 } }],
    },
  });

  W.add("comicRegister", {
    sliders: [["gestureReach", "Gesture reach", [0, 2, "m", 0.05], "How far from the body the hands go.", { from: 0.3, to: 0.3 }]],
    window: { groups: [{ label: "Measured", sliders: ["gestureReach"] }] },
  });

  W.add("laughsPerMinute", {
    sliders: [
      ["firstLaughAt", "First laugh after", [0, 120, "s", 1], "Seconds into the scene before the first laugh.", { from: 15, to: 15 }],
      ["longestGap", "Longest stretch without a laugh", [0, 300, "s", 5], "The longest time the scene goes without one.", { from: 60, to: 60 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["firstLaughAt", "longestGap"] }] },
  });

  W.add("mixLaughs", {
    sliders: [["inFrame", "People in frame together", [1, 12, "people"], "How many of the mix are seen in one picture.", { from: 2, to: 2 }]],
    window: { groups: [{ label: "Measured", sliders: ["inFrame"] }] },
  });

  W.add("wordplay", {
    sliders: [
      ["topsWithin", "Seconds to top it", [0, 5, "s", 0.25], "How fast someone answers with a better one.", { from: 1, to: 1 }],
      ["lineWords", "Words in the line", [1, 40, "words"], "How long the wordplay line is; shorter is usually punchier.", { from: 8, to: 8 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["topsWithin", "lineWords"] }] },
  });

  W.add("understatement", {
    sliders: [
      ["faceSize", "Face size in frame", [10, 200, "%"], "How big the calm face is in the picture.", { from: 50, to: 50 }],
      ["holdAfter", "Hold after the line", [0, 5, "s", 0.25], "How long we sit with the line before anything else happens.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["faceSize", "holdAfter"] }] },
  });

  W.add("visualGag", {
    sliders: [
      ["across", "Across the frame", [0, 100, "%"], "Where the gag sits, left (0) to right (100).", { from: 80, to: 80 }],
      ["up", "Up the frame", [0, 100, "%"], "Where the gag sits, bottom (0) to top (100).", { from: 40, to: 40 }],
      ["gagSize", "Size in frame", [1, 100, "%"], "How much of the frame's height the gag takes up.", { from: 10, to: 10 }],
    ],
    window: {
      faces: [{ face: "frame", x: "across", y: "up", size: "gagSize" }],
      groups: [{ label: "Measured", sliders: ["across", "up", "gagSize"] }],
    },
  });

  W.add("comicSound", {
    sliders: [["soundLength", "Length of the funny sound", [0.1, 5, "s", 0.1], "How long the sound effect or sting lasts.", { from: 0.5, to: 0.5 }]],
    window: { groups: [{ label: "Measured", sliders: ["soundLength"] }] },
  });

  W.add("topper", {
    sliders: [
      ["gapBetween", "Gap between toppers", [0, 10, "s", 0.25], "Seconds between one topper and the next.", { from: 1.5, to: 1.5 }],
      ["holdAfter", "Hold after the last one", [0, 5, "s", 0.25], "How long we stay after the final topper.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["gapBetween", "holdAfter"] }] },
  });

  W.add("specificity", {
    sliders: [
      ["detailWords", "Words in the detail", [1, 40, "words"], "How many words the oddly exact detail takes.", { from: 8, to: 8 }],
      ["numbers", "Exact numbers in it", [0, 5, ""], "How many precise figures (years, counts, sizes) it includes.", { from: 1, to: 1 }],
      ["afterPause", "Pause after it", [0, 3, "s", 0.25], "The beat that lets the detail sink in.", { from: 0.5, to: 0.5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["detailWords", "numbers", "afterPause"] }] },
  });

  W.add("exaggeration", {
    sliders: [
      ["timesReal", "Times bigger than real", [1, 100, "x"], "How many times bigger than life it is made.", { from: 3, to: 3 }],
      ["growSec", "Seconds to reach full size", [0, 30, "s", 0.5], "How long it takes to blow up to its biggest.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["timesReal", "growSec"] }] },
  });

  W.add("cutawayGag", {
    sliders: [
      ["triggerGap", "Line to cutaway", [0, 2, "s", 0.1], "How soon after the trigger the cut away happens.", { from: 0.2, to: 0.2 }],
      ["backBeat", "Beat back in the scene", [0, 5, "s", 0.25], "The silence after we cut back, before anyone speaks.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["triggerGap", "backBeat"] }] },
  });

  W.add("straightMan", {
    sliders: [
      ["reactBeat", "Pause before their reaction", [0, 5, "s", 0.25], "How long they hold still before reacting to the madness.", { from: 1, to: 1 }],
      ["frameSize", "How big they are in frame", [10, 200, "%"], "Their height as a share of the frame.", { from: 50, to: 50 }],
      ["stillShare", "Time spent still", [0, 100, "%", 5], "How much of the scene they don't move at all.", { from: 80, to: 80 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["reactBeat", "frameSize", "stillShare"] }] },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
