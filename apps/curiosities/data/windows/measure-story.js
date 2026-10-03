/* Story, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). Story is mostly
   judgment, so what gets measured here is time (when, how long, how long ago, how fast), counts (how many times,
   how many people), share of the scene, and the real distances between a character and the person or thing the
   story is about in that moment. */
(function (W) {
  /* ---------- Arc ---------- */

  W.add("arcStage", {
    sliders: [
      ["arcOf", "Whose arc", ["the main character", "a side character", "the villain", "the couple", "the group"], "Which character's journey this stage belongs to.", { unordered: true }],
      ["turnSeconds", "How long the turn takes", [0, 120, "s"], "How many seconds it takes to move from this stage into the next once it starts.", { from: 10, to: 10 }],
      ["stageMoments", "Moments that show the stage", [0, 10, "moments"], "How many moments in the scene show us where they are on their arc."],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["arcOf", "turnSeconds", "stageMoments"] }],
    },
  });

  W.add("arcTest", {
    sliders: [
      ["testAt", "When the test comes", [0, 100, "%"], "How far into the scene the old temptation shows up.", { from: 70, to: 70 }],
      ["temptNear", "How near the temptation is", [0, 20, "m", 0.1], "How many meters from the character the tempting person or thing stands; closer is harder to refuse.", { from: 2, to: 2 }],
      ["echoGap", "Time since the moment it echoes", [0, 180, "min"], "How many minutes of film ago we saw the earlier moment this test calls back to."],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["testAt", "temptNear", "echoGap"] }],
      presets: [{ label: "Within arm's reach", plain: "The temptation is right there, late in the scene, calling back to the opening.", set: { testAt: 85, temptNear: 0.5, echoGap: 90 } }],
    },
  });

  W.add("arcDirection", {
    sliders: [
      ["comparedWith", "Compared with", ["who they were at the start", "who they were last scene", "who they need to be", "another character"], "What the change is measured against.", { unordered: true }],
      ["arcSpan", "Scenes the change takes", [1, 60, "scenes"], "How many scenes it takes to get from where they start to where they end.", { from: 20, to: 20 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["comparedWith", "arcSpan"] }],
    },
  });

  W.add("theLie", {
    sliders: [
      ["blows", "Blows against it", [0, 10, "times"], "How many times in the scene something proves the lie wrong."],
      ["heldFor", "Believed it for", [0, 80, "years", 0.5], "How many years the character has believed the lie.", { from: 10, to: 10 }],
      ["learnedFrom", "Where the lie came from", ["a parent", "a lover", "a teacher", "a failure", "themselves"], "Who or what first taught them the wrong idea.", { unordered: true }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["blows", "heldFor", "learnedFrom"] }],
    },
  });

  W.add("wound", {
    sliders: [
      ["yearsAgo", "How long ago it happened", [0, 80, "years", 0.5], "How many years before the story the old hurt happened.", { from: 15, to: 15 }],
      ["woundBy", "Who caused it", ["a parent", "a lover", "a friend", "a stranger", "themselves", "the world"], "Who or what did the hurting.", { unordered: true }],
      ["revealLength", "How long the reveal lasts", [0, 300, "s"], "How many seconds the film spends on the moment we learn about the wound.", { from: 30, to: 30 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["yearsAgo", "woundBy", "revealLength"] }],
    },
  });

  W.add("relapse", {
    sliders: [
      ["slipAt", "When they slip", [0, 100, "%"], "How far into the scene the character slides back.", { from: 60, to: 60 }],
      ["slideSeconds", "How quick the slide is", [0, 120, "s"], "How many seconds it takes to go from the new way back to the old one.", { from: 10, to: 10 }],
      ["sinceChange", "Time since they began to change", [0, 120, "min"], "How many minutes of film since we first saw them start to change.", { from: 30, to: 30 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["slipAt", "slideSeconds", "sinceChange"] }],
    },
  });

  W.add("resistance", {
    sliders: [
      ["pushBacks", "Times they push back", [0, 20, "times"], "How many times in the scene they refuse, argue or dodge."],
      ["stepsAway", "Distance from who's pushing", [0, 20, "m", 0.1], "How many meters the character keeps between themselves and whoever is pushing them to change.", { from: 2, to: 2 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["pushBacks", "stepsAway"] }],
    },
  });

  W.add("changeShows", {
    sliders: [
      ["signs", "Signs of the change", [0, 10, "signs"], "How many outward signs of the change appear in the scene."],
      ["showSeconds", "How long it's on screen", [0, 60, "s"], "How many seconds the sign of change stays where we can see it.", { from: 5, to: 5 }],
      ["sinceOldWay", "Time since the old way", [0, 180, "min"], "How many minutes of film ago we last saw the old way it now replaces.", { from: 40, to: 40 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["signs", "showSeconds", "sinceOldWay"] }],
    },
  });

  /* ---------- Plot ---------- */

  W.add("plotWant", {
    sliders: [
      ["wantMentions", "Times the want comes up", [0, 20, "times"], "How many times the scene shows or mentions what they are chasing."],
      ["needShownAt", "When the need shows", [0, 100, "%"], "How far into the scene we glimpse what they really need.", { from: 70, to: 70 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["wantMentions", "needShownAt"] }],
    },
  });

  W.add("plotProgress", {
    sliders: [
      ["wayLeft", "Way to the goal, after", [0, 100, "%"], "How much of the road to the goal is still ahead when the scene ends; 0 means they got it.", { from: 50, to: 50 }],
      ["beats", "Wins and losses in the scene", [0, 10, "times"], "How many separate steps forward or back happen in the scene."],
      ["landSeconds", "How long it takes to land", [0, 60, "s"], "How many seconds the win or loss takes to play out once it starts.", { from: 5, to: 5 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["wayLeft", "beats", "landSeconds"] }],
    },
  });

  W.add("openQuestions", {
    sliders: [
      ["oldestOpen", "Oldest question's age", [0, 180, "min"], "How many minutes of film the longest-waiting question has been open."],
      ["nextAnswer", "Until the next answer", [0, 180, "min"], "How many minutes of film until the audience gets its next answer.", { from: 10, to: 10 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["oldestOpen", "nextAnswer"] }],
    },
  });

  W.add("plotTouch", {
    sliders: [
      ["meetAt", "When they meet", [0, 100, "%"], "How far into the scene their plot and the main plot touch.", { from: 50, to: 50 }],
      ["sharedShare", "Scene shared with main plot", [0, 100, "%"], "How much of the scene both plots are on screen together."],
      ["crossings", "Times they cross", [0, 10, "times"], "How many times in the scene the two plots touch."],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["meetAt", "sharedShare", "crossings"] }],
    },
  });

  W.add("plotSecret", {
    sliders: [
      ["keptFrom", "Hidden from", ["a partner", "a parent", "a friend", "the boss", "the police", "everyone"], "Who the secret is being kept from.", { unordered: true }],
      ["keptFor", "Kept for", [0, 50, "years", 0.5], "How many years the secret has been kept.", { from: 1, to: 1 }],
      ["proofNear", "How near the proof is", [0, 20, "m", 0.1], "How many meters the evidence sits from the person who must not find it.", { from: 3, to: 3 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["keptFrom", "keptFor", "proofNear"] }],
      presets: [{ label: "The letter on the table", plain: "Proof an arm's length from the one person it's hidden from.", set: { keptFrom: "a partner", proofNear: 0.5 } }],
    },
  });

  W.add("tickingClock", {
    sliders: [
      ["clockOf", "Whose clock", ["the hero", "the villain", "everyone", "the audience only"], "Whose deadline it is.", { unordered: true }],
      ["clockSpeed", "Clock against real time", [10, 500, "%"], "How fast story time runs compared with screen time; 100 is real time, as in a countdown we watch tick.", { from: 100, to: 100 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["clockOf", "clockSpeed"] }],
    },
  });

  W.add("knowledgeGap", {
    sliders: [
      ["inTheDark", "Who's in the dark", ["the main character", "a side character", "the villain", "the audience"], "Who is the one who doesn't know yet.", { unordered: true }],
      ["truthNear", "How near they are to it", [0, 20, "m", 0.1], "How many meters the one in the dark is from the thing they don't know about, like the bomb under the table.", { from: 2, to: 2 }],
      ["catchUpSeconds", "How long the catch-up takes", [0, 60, "s"], "How many seconds it takes for the one in the dark to understand once it starts.", { from: 3, to: 3 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["inTheDark", "truthNear", "catchUpSeconds"] }],
      presets: [{ label: "Bomb under the table", plain: "We know; they sit right on top of it.", set: { inTheDark: "the main character", truthNear: 0.5 } }],
    },
  });

  W.add("plotWeight", {
    sliders: [
      ["lineShare", "Share of the lines", [0, 100, "%"], "How much of the scene's dialogue is theirs.", { from: 30, to: 30 }],
      ["closeUps", "Close-ups on them", [0, 30, "shots"], "How many close shots of this character the scene uses."],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["lineShare", "closeUps"] }],
    },
  });

  W.add("dissenter", {
    sliders: [
      ["dissentsFrom", "Goes against", ["the leader", "the whole group", "a friend", "the rules"], "Who or what they stand against.", { unordered: true }],
      ["apartBy", "Distance from the group", [0, 20, "m", 0.1], "How many meters the dissenter stands from the nearest person in the group.", { from: 2, to: 2 }],
      ["speakSeconds", "How long they speak up", [0, 300, "s"], "How many seconds the dissent lasts once it breaks out.", { from: 20, to: 20 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["dissentsFrom", "apartBy", "speakSeconds"] }],
    },
  });

  /* ---------- Character ---------- */

  W.add("dramaticRole", {
    sliders: [
      ["targetDistance", "How close to who they work on", [0, 20, "m", 0.1], "How many meters this character stands from the one their role acts on.", { from: 1.5, to: 1.5 }],
      ["roleMoments", "Times the role bites", [0, 20, "times"], "How many moments in the scene they actually do their role's job."],
      ["roleStartsAt", "When the role kicks in", [0, 100, "%"], "How far into the scene they start playing the role."],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["targetDistance", "roleMoments", "roleStartsAt"] }],
    },
  });

  W.add("cm-role", {
    sliders: [
      ["targetDistance", "How close to who they work on", [0, 20, "m", 0.1], "How many meters this character stands from the one their role acts on.", { from: 1.5, to: 1.5 }],
      ["roleMoments", "Times the role bites", [0, 20, "times"], "How many moments in the scene they actually do their role's job."],
      ["switchSeconds", "How long a role switch takes", [0, 60, "s"], "How many seconds it takes to move from one role to the next, if they switch.", { from: 5, to: 5 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["targetDistance", "roleMoments", "switchSeconds"] }],
    },
  });

  W.add("perspectiveWidth", {
    sliders: [
      ["peopleWeighed", "How many people they weigh", [1, 1000, "people"], "Roughly how many people's good the character keeps in mind.", { from: 3, to: 3 }],
      ["shiftAt", "When the circle moves", [0, 100, "%"], "How far into the scene the circle starts to grow or shrink.", { from: 60, to: 60 }],
      ["shiftSeconds", "How long the shift takes", [0, 600, "s"], "How many seconds it takes for the circle to settle at its new size.", { from: 30, to: 30 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["peopleWeighed", "shiftAt", "shiftSeconds"] }],
    },
  });

  W.add("mindset", {
    sliders: [
      ["challenges", "Times the belief is hit", [0, 20, "times"], "How many times in the scene something argues against what they think."],
      ["challengedBy", "Challenged by", ["a friend", "an enemy", "a stranger", "the facts", "themselves"], "Who or what pushes against their way of thinking.", { unordered: true }],
      ["holdOut", "How long they hold out", [0, 600, "s"], "How many seconds pass between the first challenge and the moment their mind moves.", { from: 60, to: 60 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["challenges", "challengedBy", "holdOut"] }],
    },
  });

  W.add("cm-perspective", {
    sliders: [
      ["comparedWith", "Compared with", ["the last scene", "the start of the film", "another character", "who they need to be"], "What their way of seeing is measured against.", { unordered: true }],
      ["shiftSeconds", "How long the shift takes", [0, 600, "s"], "How many seconds it takes for their outlook to settle at its new place.", { from: 30, to: 30 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["comparedWith", "shiftSeconds"] }],
    },
  });

  W.add("beliefShown", {
    sliders: [
      ["showings", "Times it shows", [0, 10, "times"], "How many times in the scene the belief comes out."],
      ["showSeconds", "How long it shows", [0, 120, "s"], "How many seconds the moment that shows the belief lasts.", { from: 5, to: 5 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["showings", "showSeconds"] }],
    },
  });

  /* ---------- Attention ---------- */

  W.add("focusShift", {
    sliders: [
      ["focusDistance", "How far the thing is", [0, 50, "m", 0.1], "How many meters from the character the thing they are closing in on sits.", { from: 2, to: 2 }],
      ["eyesOnIt", "Share of time eyes on it", [0, 100, "%"], "How much of the scene they spend looking at what they focus on.", { from: 40, to: 40 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["focusDistance", "eyesOnIt"] }],
    },
  });

  W.add("distraction", {
    sliders: [
      ["pullAngle", "Which way it pulls them", [-180, 180, "°"], "How far they turn away from what matters to face the distraction: 0 is straight ahead, minus their left, plus their right, 180 right behind.", { from: 60, to: 60 }],
      ["pullDistance", "How far the distraction is", [0, 50, "m", 0.1], "How many meters from the character the distraction is.", { from: 3, to: 3 }],
      ["missedNear", "How near what they miss is", [0, 20, "m", 0.1], "How many meters from the character the important thing they are missing is.", { from: 1, to: 1 }],
    ],
    window: {
      faces: [{ face: "pad", x: "pullAngle", y: "pullDistance", xLabel: "which way", yLabel: "how far" }],
      groups: [{ label: "Measured", sliders: ["pullAngle", "pullDistance", "missedNear"] }],
      presets: [{ label: "Looking the wrong way", plain: "They turn right round to the distraction while the danger is a step away.", set: { pullAngle: 170, pullDistance: 5, missedNear: 1 } }],
    },
  });

  W.add("fixation", {
    sliders: [
      ["longestLook", "Longest look", [0, 60, "s"], "How many seconds their longest stare at it lasts.", { from: 3, to: 3 }],
      ["lookShare", "Share of the scene on it", [0, 100, "%"], "How much of the scene their eyes or thoughts are on it.", { from: 30, to: 30 }],
      ["thingDistance", "How far it is from them", [0, 50, "m", 0.1], "How many meters away the thing they are fixed on is.", { from: 2, to: 2 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["longestLook", "lookShare", "thingDistance"] }],
    },
  });

  W.add("focusWidth", {
    sliders: [
      ["viewAngle", "How wide they take in", [5, 360, "°"], "How wide a slice of the world around them they pay attention to; 360 is all the way round.", { from: 60, to: 60 }],
      ["reach", "How far their attention reaches", [0, 100, "m"], "How many meters out from them they are still noticing things.", { from: 5, to: 5 }],
    ],
    window: {
      faces: [{ face: "pad", x: "viewAngle", y: "reach", xLabel: "how wide", yLabel: "how far" }],
      groups: [{ label: "Measured", sliders: ["viewAngle", "reach"] }],
      presets: [{ label: "Tunnel vision", plain: "Only what is straight ahead and close.", set: { viewAngle: 10, reach: 1 } }],
    },
  });

  W.add("cm-focus", {
    sliders: [
      ["reach", "How far their attention reaches", [0, 100, "m"], "How many meters out from them they are still noticing things.", { from: 5, to: 5 }],
      ["shiftSeconds", "How long the shift takes", [0, 300, "s"], "How many seconds it takes for their focus to settle at its new width.", { from: 10, to: 10 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["reach", "shiftSeconds"] }],
    },
  });

  /* ---------- Group ---------- */

  W.add("herdMentality", {
    sliders: [
      ["spacing", "Space between people", [0, 5, "m", 0.1], "How many meters apart people in the group stand on average; tighter looks like one mind.", { from: 1, to: 1 }],
      ["holdouts", "People who don't join", [0, 50, "people"], "How many people in the group keep their own mind."],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["spacing", "holdouts"] }],
    },
  });

  W.add("herdLeader", {
    sliders: [
      ["leaderAbove", "Leader above the group", [-2, 5, "m", 0.1], "How many meters higher the leader stands than the group, as on a table or a stage; minus is lower.", { from: 0, to: 0 }],
      ["leaderAhead", "Leader out in front", [0, 20, "m", 0.1], "How many meters in front of the group the leader stands.", { from: 1, to: 1 }],
      ["followers", "How many follow", [0, 500, "people"], "How many people in the scene go along with the leader.", { from: 10, to: 10 }],
    ],
    window: {
      faces: [{ face: "pad", x: "placement", y: "leaderAbove", xLabel: "where across", yLabel: "how high" }],
      groups: [{ label: "Measured", sliders: ["leaderAbove", "leaderAhead", "followers"] }],
      presets: [{ label: "On the table", plain: "The leader climbs up above the crowd, front and center.", set: { placement: 50, leaderAbove: 1, leaderAhead: 2 } }],
    },
  });

  W.add("groupPressure", {
    sliders: [
      ["groupNear", "How close the group stands", [0, 10, "m", 0.1], "How many meters between the person under pressure and the nearest of the group pressing them.", { from: 1, to: 1 }],
      ["pressSeconds", "How long it lasts", [0, 600, "s"], "How many seconds the group keeps leaning on them.", { from: 60, to: 60 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["groupNear", "pressSeconds"] }],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
