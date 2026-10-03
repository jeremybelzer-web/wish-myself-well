/* Character, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z).
   A trait is measured against something too: compared with whom, how far it has moved since the start of the
   story, how often it shows in a scene, how fast they act on it, and how near they stand to the people it is about. */
(function (W) {
  const sinceStart = (what) => ["sinceStart", "Moved since the start", [-100, 100, "points"], `How far they have moved toward ${what} (plus) or away from it (minus) since the start of the story.`, { from: 0, to: 0 }];

  W.add("cm-agency", {
    sliders: [
      ["started", "Things they start this scene", [0, 10, "", 1], "How many events in the scene begin with their choice.", { from: 1, to: 1 }],
      ["actSeconds", "Seconds before they act", [0, 60, "s"], "How long after something happens they make a move.", { from: 5, to: 5 }],
      sinceStart("acting first"),
    ],
    window: { groups: [{ label: "Measured", sliders: ["started", "actSeconds", "sinceStart"] }] },
  });

  W.add("cm-openness", {
    sliders: [
      ["aboutSelf", "Lines about themselves", [0, 100, "%"], "What share of what they say is about their own life or feelings.", { from: 20, to: 20 }],
      ["eyeContact", "Time meeting eyes", [0, 100, "% of the scene"], "How much of the scene they look the other person in the eye.", { from: 40, to: 40 }],
      ["openWith", "Measured with", ["a stranger", "a friend", "family", "a lover", "the audience"], "Who they are being open or secretive with.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["aboutSelf", "eyeContact", "openWith"] }] },
  });

  W.add("cm-conflict", {
    sliders: [
      ["flareSeconds", "Seconds to flare up", [0, 60, "s"], "How long after the first jab they fight back.", { from: 10, to: 10 }],
      ["closeIn", "How close they get in a fight", [0, 5, "m", 0.1], "How many meters from the other person they stand when it heats up.", { from: 1.5, to: 1.5 }],
      ["foe", "Fighting with", ["a stranger", "a friend", "family", "someone in charge", "themselves"], "Who the conflict is with.", { unordered: true }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["flareSeconds", "closeIn", "foe"] }],
      presets: [{ label: "In their face", plain: "Flares at once and steps right up.", set: { flareSeconds: 1, closeIn: 0.3 } }],
    },
  });

  W.add("cm-truth", {
    sliders: [
      ["lies", "Lies this scene", [0, 10, "", 1], "How many times they lie in the scene.", { from: 0, to: 0 }],
      ["trueShare", "Share of what they say that's true", [0, 100, "%"], "How much of what they say is honest.", { from: 90, to: 90 }],
      ["liedTo", "Lying to", ["a stranger", "a friend", "family", "someone in charge", "themselves"], "Who they bend the truth for.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["lies", "trueShare", "liedTo"] }] },
  });

  W.add("enneagramType", {
    sliders: [
      ["purity", "How purely the type plays", [0, 100, "%"], "How much of what they do comes straight from their type, rather than from their wing or the moment.", { from: 70, to: 70 }],
      ["fearMoments", "Times the core fear shows", [0, 10, "", 1], "How many moments in the scene their deepest fear drives what they do.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["purity", "fearMoments"] }] },
  });

  W.add("enneagramHealth", {
    sliders: [
      ["levelsMoved", "Levels moved since the start", [-8, 8, "levels", 1], "How many health levels they have climbed (plus) or slid (minus) since the story began.", { from: 0, to: 0 }],
      ["scenesHere", "Scenes at this level", [0, 20, "scenes", 1], "How long they have stayed at this level of health.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["levelsMoved", "scenesHere"] }] },
  });

  W.add("cm-stability", {
    sliders: [
      ["changes", "Things they change this scene", [0, 10, "", 1], "How many things are different because of them by the end of the scene.", { from: 1, to: 1 }],
      ["affected", "People affected", [0, 100, "people"], "How many people feel the change they bring, or the calm they keep.", { from: 2, to: 2 }],
      ["roomSeconds", "Seconds until the room changes", [0, 60, "s"], "How long after they walk in the mood of the room shifts.", { from: 10, to: 10 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["changes", "affected", "roomSeconds"] }] },
  });

  W.add("cm-freedom", {
    sliders: [
      ["groupSize", "Size of the group", [1, 100, "people"], "How many people make up the group they go along with or break from.", { from: 5, to: 5 }],
      ["fromGroup", "Distance from the group", [0, 20, "m"], "How many meters they stand from the rest of the group.", { from: 1, to: 1 }],
      ["goAlong", "Time they go along", [0, 100, "%"], "How often they do what the group does.", { from: 60, to: 60 }],
      ["whichGroup", "Which group", ["family", "friends", "work", "the town", "society"], "The group they are measured against.", { unordered: true }],
    ],
    window: {
      faces: [{ face: "pad", x: "fromGroup", y: "goAlong", xLabel: "How far they stand", yLabel: "How often they go along" }],
      groups: [{ label: "Measured", sliders: ["groupSize", "fromGroup", "goAlong", "whichGroup"] }],
      presets: [{ label: "Odd one out", plain: "Stands apart and rarely follows.", set: { fromGroup: 6, goAlong: 10 } }],
    },
  });

  W.add("cm-morality", {
    sliders: [
      ["givenAway", "Share they give away", [0, 100, "%"], "How much of what they have (time, money, safety) goes to others in the scene.", { from: 20, to: 20 }],
      ["helped", "People they help", [0, 100, "people"], "How many people their choices help.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["givenAway", "helped"] }] },
  });

  W.add("cm-risk", {
    sliders: [
      ["odds", "Chance it goes wrong", [0, 100, "%"], "The real chance the risk they take turns out badly.", { from: 30, to: 30 }],
      ["thinkSeconds", "Seconds before they leap", [0, 60, "s"], "How long they think before taking the risk.", { from: 5, to: 5 }],
      ["toDanger", "How close to the danger", [0, 20, "m"], "How many meters from the drop, the fire or the threat they choose to stand.", { from: 5, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["odds", "thinkSeconds", "toDanger"] }] },
  });

  W.add("cm-control", {
    sliders: [
      ["orders", "Orders given this scene", [0, 20, "", 1], "How many times they tell someone what to do.", { from: 1, to: 1 }],
      ["talkShare", "Share of the talking", [0, 100, "%"], "How much of the conversation they hold.", { from: 40, to: 40 }],
      ["fromCenter", "Distance from the center of the room", [0, 10, "m"], "How far they stand from the middle of things; controllers often take the center.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["orders", "talkShare", "fromCenter"] }] },
  });

  W.add("cm-adaptability", {
    sliders: [
      ["plansChanged", "Plans changed this scene", [0, 10, "", 1], "How many times they change course when things don't go their way.", { from: 1, to: 1 }],
      ["adjustSeconds", "Seconds to adjust", [0, 120, "s"], "How long it takes them to accept a surprise and work with it.", { from: 10, to: 10 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["plansChanged", "adjustSeconds"] }] },
  });

  W.add("cm-competence", {
    sliders: [
      ["tries", "Tries this scene", [0, 20, "", 1], "How many times they attempt something that takes skill.", { from: 2, to: 2 }],
      ["successRate", "Tries that work", [0, 100, "%"], "What share of their attempts succeed.", { from: 50, to: 50 }],
      ["comparedWith", "Measured against", ["the task", "their rival", "an expert", "who they were"], "What their skill is compared with.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["tries", "successRate", "comparedWith"] }] },
  });

  W.add("cm-need", {
    sliders: [
      ["yearsTied", "Years tied down", [0, 50, "years"], "How long they have lived inside the thing that keeps them safe or stuck.", { from: 5, to: 5 }],
      ["doorGlances", "Looks toward the way out", [0, 10, "", 1], "How many times in the scene they look at a door, a road or a window.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["yearsTied", "doorGlances"] }] },
  });

  W.add("cm-motivation", {
    sliders: [
      ["checksWatchers", "Glances at who's watching", [0, 20, "", 1], "How many times they check whether someone sees what they do.", { from: 1, to: 1 }],
      ["watchers", "People watching", [0, 1000, "people"], "How many people are there to see them win or lose.", { from: 2, to: 2 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["checksWatchers", "watchers"] }] },
  });

  W.add("cm-health", {
    sliders: [
      ["levelsMoved", "Levels moved since the start", [-8, 8, "levels", 1], "How many health levels they have climbed (plus) or slid (minus) since the story began.", { from: 0, to: 0 }],
      ["recoverScenes", "Scenes to bounce back", [0, 20, "scenes", 1], "How many scenes it takes them to recover after a slide.", { from: 3, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["levelsMoved", "recoverScenes"] }] },
  });

  W.add("cm-worldview", {
    sliders: [
      ["worstShare", "Lines that expect the worst", [0, 100, "%"], "What share of what they say assumes things will go badly.", { from: 30, to: 30 }],
      sinceStart("cynicism"),
    ],
    window: { groups: [{ label: "Measured", sliders: ["worstShare", "sinceStart"] }] },
  });

  W.add("cm-emotion", {
    sliders: [
      ["decideSeconds", "Seconds to decide", [0, 120, "s"], "How long they take to make up their mind.", { from: 10, to: 10 }],
      ["byFeeling", "Choices made by feeling", [0, 100, "%"], "What share of their choices in the scene come from feeling rather than reasoning.", { from: 50, to: 50 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["decideSeconds", "byFeeling"] }] },
  });

  W.add("cm-temperament", {
    sliders: [
      ["minutesLate", "Minutes early or late", [-30, 60, "min"], "How early (minus) or late (plus) they turn up.", { from: 0, to: 0 }],
      ["outOfPlace", "Things out of place", [0, 50, "", 1], "How many things around them are not where they belong.", { from: 3, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["minutesLate", "outOfPlace"] }] },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
