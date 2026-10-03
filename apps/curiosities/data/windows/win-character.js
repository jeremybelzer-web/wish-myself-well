/* Character: a window for every curiosity whose home is Character on the Screen.
   The cm-* rows are the character matrix axes (position 0 to 100, swing, shown); Enneagram health runs 1 (most
   healthy) to 9 (least healthy), and stress and growth follow the matrix's arrows. */
(function (W) {
  const TRIGGERS = ["pressure", "loss", "failure", "praise", "love"];
  const SEEN = ["no one", "the audience", "close friends", "everyone"];
  /* Every matrix axis shows the same way: the see-saw between its two ends, plus faces of its own. */
  const axis = (left, right, more) => [{ face: "balance", slider: "position", left, right }].concat(more);

  W.add("cm-agency", {
    sliders: [
      ["trigger", "What makes them act", ["being forced", "a threat", "an opportunity", "their own idea"], "What finally gets them moving, from pushed to self-started."],
      ["delay", "How long they wait to act", ["at once", "a beat", "a scene", "many scenes"], "The gap between something happening and them doing something about it."],
      ["steers", "How much they steer the scene", [0, 5, ""], "How much the scene, and our attention, follows what they choose to do."],
    ],
    window: {
      faces: axis("Reactive", "Proactive", [
        { face: "tiles", slider: "trigger", icons: { "being forced": "🫸", "a threat": "⚠️", "an opportunity": "🚪", "their own idea": "💡" } },
        { face: "ladder", slider: "delay" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "What moves them", sliders: ["trigger", "delay"] },
        { label: "On screen", sliders: ["steers", "shown"] },
      ],
      presets: [
        { label: "Hamlet hesitates", plain: "Knows what to do, waits and waits.", set: { position: 15, delay: "many scenes", trigger: "being forced", steers: 2 } },
        { label: "Indiana Jones charges in", plain: "Acts at once on their own idea and drives the scene.", set: { position: 90, delay: "at once", trigger: "their own idea", steers: 5 } },
        { label: "Reluctant hero wakes up", plain: "Pushed at first, then starting to take charge.", set: { position: 55, swing: 30, trigger: "a threat", delay: "a scene" } },
      ],
    },
  });

  W.add("cm-openness", {
    sliders: [
      ["secret", "What they keep secret", ["small things", "feelings", "the past", "who they really are"], "How deep the hidden part goes."],
      ["reveals", "Things revealed this scene", [0, 5, ""], "How many new truths about them come out in this scene."],
      ["trusts", "Who they open up to", ["no one", "one person", "a few", "everyone"], "How wide their circle of trust is."],
    ],
    window: {
      faces: axis("Open", "Secretive", [
        { face: "ladder", slider: "secret" },
        { face: "dial", slider: "reveals" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "What's hidden", sliders: ["secret", "trusts"] },
        { label: "Reveals", sliders: ["reveals", "shown"] },
      ],
      presets: [
        { label: "Don Draper's past", plain: "A whole hidden self, trusted to no one.", set: { position: 90, secret: "who they really are", trusts: "no one", reveals: 0 } },
        { label: "Open book", plain: "Says everything to everyone.", set: { position: 5, secret: "small things", trusts: "everyone", shown: "plain to see" } },
        { label: "The slow reveal", plain: "One truth at a time, to one person.", set: { position: 60, trusts: "one person", reveals: 1, swing: 20 } },
      ],
    },
  });

  W.add("cm-conflict", {
    sliders: [
      ["style", "How they fight", ["passive digs", "cold silence", "words", "shouting", "fists"], "What a fight looks like when they're in one."],
      ["fuse", "How quickly they flare", ["long fuse", "medium", "short fuse", "hair trigger"], "How little it takes to set them off."],
      ["backDown", "How readily they back down", ["never", "rarely", "when losing", "quickly"], "Whether they stay in a fight once it starts."],
    ],
    window: {
      faces: axis("Avoids it", "Confronts it", [
        { face: "ladder", slider: "style" },
        { face: "tiles", slider: "fuse", icons: { "long fuse": "🕯️", medium: "🧨", "short fuse": "💣", "hair trigger": "💥" } },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "The fight", sliders: ["style", "fuse", "backDown"] },
        { label: "On screen", sliders: ["shown"] },
      ],
      presets: [
        { label: "Office shrug", plain: "Avoids fights, gets back with a little dig.", set: { position: 15, style: "passive digs", backDown: "quickly", fuse: "long fuse" } },
        { label: "Kitchen-nightmare chef", plain: "Hair trigger, shouts, never backs down.", set: { position: 95, style: "shouting", fuse: "hair trigger", backDown: "never" } },
        { label: "Slow boil", plain: "Long fuse that finally blows.", set: { position: 40, swing: 45, fuse: "long fuse", style: "fists" } },
      ],
    },
  });

  W.add("cm-truth", {
    sliders: [
      ["lieSize", "Size of the lies", ["white lies", "half-truths", "big lies", "a whole false life"], "How much of the truth they bend."],
      ["skill", "How good a liar", [0, 5, ""], "Whether people believe them."],
      ["reason", "Why they lie", ["to be kind", "to avoid trouble", "to win", "for fun"], "What the lie is for.", { unordered: true }],
      ["caughtRisk", "How close to being caught", ["safe", "risky", "about to be caught", "caught"], "How near the lie is to falling apart, which keeps us watching."],
    ],
    window: {
      faces: axis("Honest", "Deceptive", [
        { face: "ladder", slider: "lieSize" },
        { face: "dial", slider: "skill" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "The lies", sliders: ["lieSize", "reason", "skill"] },
        { label: "Getting caught", sliders: ["caughtRisk", "shown"] },
      ],
      presets: [
        { label: "Liar Liar comedy", plain: "Lies all the time, badly, always about to be caught.", set: { position: 80, lieSize: "big lies", skill: 1, caughtRisk: "about to be caught", reason: "to avoid trouble" } },
        { label: "Talented Mr Ripley", plain: "A whole false life, told brilliantly.", set: { position: 100, lieSize: "a whole false life", skill: 5, reason: "to win", caughtRisk: "risky" } },
        { label: "Honest to a fault", plain: "Won't even tell a kind lie.", set: { position: 0, lieSize: "white lies", skill: 0, caughtRisk: "safe" } },
      ],
    },
  });

  W.add("enneagramType", {
    sliders: [
      ["instinct", "What they guard first", ["self-preservation", "social", "one-to-one"], "Their own safety, their place in the group, or one close bond.", { unordered: true }],
      ["fearShown", "Core fear on show", [0, 5, ""], "How much the type's deepest fear drives what we see."],
      ["desireShown", "Core desire on show", [0, 5, ""], "How much the type's deepest wish drives what we see."],
      ["arrow", "Leaning toward", ["their stress type", "their own type", "their growth type"], "Whether they look like the type they slide to under stress, themselves, or the type they grow toward."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "1 Reformer": "⚖️", "2 Helper": "🤝", "3 Achiever": "🏆", "4 Individualist": "🎭", "5 Investigator": "🔬", "6 Loyalist": "🛡️", "7 Enthusiast": "🎉", "8 Challenger": "🦁", "9 Peacemaker": "🕊️" } },
        { face: "balance", slider: "wing", left: "Type before", right: "Type after" },
        { face: "mixer", sliders: ["fearShown", "desireShown"] },
      ],
      groups: [
        { label: "The type", sliders: ["setting", "wing", "instinct"] },
        { label: "What drives them", sliders: ["fearShown", "desireShown"] },
        { label: "Which way they lean", sliders: ["arrow", "noticeable"] },
      ],
      presets: [
        { label: "Perfectionist under pressure", plain: "A Reformer sliding toward their stress type, fear in front.", set: { setting: "1 Reformer", arrow: "their stress type", fearShown: 4, desireShown: 2 } },
        { label: "Thrill-seeker", plain: "An Enthusiast chasing the next good time.", set: { setting: "7 Enthusiast", desireShown: 5, fearShown: 1, instinct: "social" } },
        { label: "Protective boss", plain: "A Challenger guarding one person, at their best.", set: { setting: "8 Challenger", instinct: "one-to-one", arrow: "their growth type" } },
      ],
    },
  });

  W.add("enneagramHealth", {
    sliders: [
      ["pull", "Stress or growth pull", ["toward growth", "neither", "toward stress"], "Which way their health is heading, along the matrix's arrows."],
      ["trigger", "What tips them", TRIGGERS, "What pushes their health up or down in this scene.", { unordered: true }],
      ["drift", "Drift per scene", [0, 3, ""], "How many levels the health can move in one scene."],
      ["seenBy", "Who notices the change", SEEN, "Who in the story can see them slipping or growing."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "level" },
        { face: "balance", slider: "pull", left: "Growth", right: "Stress" },
      ],
      groups: [
        { label: "How healthy", sliders: ["setting", "level"] },
        { label: "Which way", sliders: ["pull", "trigger", "drift", "change"] },
        { label: "Who sees it", sliders: ["seenBy"] },
      ],
      presets: [
        { label: "Breaking Bad slide", plain: "Unhealthy and heading further into stress.", set: { setting: "unhealthy", level: 8, pull: "toward stress", trigger: "pressure", seenBy: "the audience" } },
        { label: "Redemption arc", plain: "Climbing toward their best, sparked by love.", set: { setting: "average", level: 5, pull: "toward growth", trigger: "love", drift: 1 } },
        { label: "At their best", plain: "Healthy and steady.", set: { setting: "healthy", level: 2, pull: "neither", drift: 0 } },
      ],
    },
  });

  W.add("cm-stability", {
    sliders: [
      ["ripple", "How far their changes reach", ["themselves", "one person", "the group", "the whole world"], "How much of the story shifts because of them."],
      ["anchor", "What they hold steady", ["a routine", "a family", "a team", "a place"], "The thing they keep in place.", { unordered: true }],
      ["arrival", "When they walk in", ["things calm down", "nothing changes", "things stir up"], "What happens to a scene when they enter, a pull on our attention."],
    ],
    window: {
      faces: axis("Stabilizer", "Catalyst", [
        { face: "ladder", slider: "ripple" },
        { face: "tiles", slider: "arrival", icons: { "things calm down": "🌊", "nothing changes": "➖", "things stir up": "🌪️" } },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Their effect", sliders: ["ripple", "arrival", "anchor"] },
        { label: "On screen", sliders: ["shown"] },
      ],
      presets: [
        { label: "Mary Poppins arrives", plain: "Walks in and the whole family starts to change.", set: { position: 85, ripple: "the group", arrival: "things stir up" } },
        { label: "The loyal rock", plain: "Holds everyone steady.", set: { position: 10, anchor: "a team", arrival: "things calm down", ripple: "one person" } },
        { label: "Agent of chaos", plain: "Changes everything they touch.", set: { position: 100, ripple: "the whole world", arrival: "things stir up", swing: 5 } },
      ],
    },
  });

  W.add("cm-freedom", {
    sliders: [
      ["pressure", "Pressure from the group", [0, 5, ""], "How hard the people around them push to fit in."],
      ["standsOut", "How much they stand out", ["blends in", "a little different", "stands out", "a sore thumb"], "How different they look and act from the group."],
      ["breakAt", "Breaks from the group at", [0, 100, "% through the story"], "When they finally go their own way."],
    ],
    window: {
      faces: axis("Conformist", "Individualist", [
        { face: "dial", slider: "pressure" },
        { face: "ladder", slider: "standsOut" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Against the group", sliders: ["pressure", "standsOut"] },
        { label: "Over the story", sliders: ["breakAt", "shown"] },
      ],
      presets: [
        { label: "Dead Poets stand-up", plain: "Goes along, then breaks away near the end.", set: { position: 35, swing: 40, pressure: 5, breakAt: 95 } },
        { label: "Company man", plain: "Blends in completely.", set: { position: 5, standsOut: "blends in", pressure: 2 } },
        { label: "Rebel from the start", plain: "Sticks out and doesn't care.", set: { position: 95, standsOut: "a sore thumb", breakAt: 5 } },
      ],
    },
  });

  W.add("cm-morality", {
    sliders: [
      ["sacrifice", "What they'd give up for others", ["nothing", "time", "comfort", "safety", "their life"], "The most they'd pay for someone else."],
      ["circle", "Whose good they care about", ["themselves", "their family", "their friends", "strangers"], "How wide the circle of people they look after is."],
      ["tested", "Tested this scene", ["not tested", "a small test", "a hard choice"], "Whether the scene forces them to choose between themselves and others."],
    ],
    window: {
      faces: axis("Altruistic", "Self-serving", [
        { face: "ladder", slider: "sacrifice" },
        { face: "tiles", slider: "tested", icons: { "not tested": "😌", "a small test": "🤔", "a hard choice": "⚖️" } },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Who they serve", sliders: ["circle", "sacrifice"] },
        { label: "The test", sliders: ["tested", "shown"] },
      ],
      presets: [
        { label: "Han Solo comes back", plain: "Self-serving, until the hard choice.", set: { position: 70, swing: 45, tested: "a hard choice", sacrifice: "safety" } },
        { label: "Greed is good", plain: "Only looks after themselves.", set: { position: 100, circle: "themselves", sacrifice: "nothing" } },
        { label: "George Bailey", plain: "Gives up everything for the town.", set: { position: 5, circle: "strangers", sacrifice: "their life" } },
      ],
    },
  });

  W.add("cm-risk", {
    sliders: [
      ["stake", "What they put on the line", ["nothing", "money", "their job", "their safety", "their life"], "The biggest thing they gamble in this scene."],
      ["planning", "Plans before acting", ["no plan", "a rough idea", "a plan", "a backup plan"], "How much thinking comes before the leap."],
      ["thrill", "Enjoys the danger", [0, 5, ""], "How much they get a kick out of risk."],
    ],
    window: {
      faces: axis("Cautious", "Reckless", [
        { face: "ladder", slider: "stake" },
        { face: "pad", x: "position", y: "thrill", xLabel: "How reckless", yLabel: "How much they enjoy it" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "The gamble", sliders: ["stake", "planning", "thrill"] },
        { label: "On screen", sliders: ["shown"] },
      ],
      presets: [
        { label: "Top Gun maverick", plain: "No plan, loves the danger, life on the line.", set: { position: 95, planning: "no plan", thrill: 5, stake: "their life" } },
        { label: "Nervous worrier", plain: "Won't risk a thing and hates every second.", set: { position: 5, thrill: 0, stake: "nothing", planning: "a backup plan" } },
        { label: "Heist planner", plain: "Big risk, carefully planned.", set: { position: 70, planning: "a backup plan", stake: "money", thrill: 3 } },
      ],
    },
  });

  W.add("cm-control", {
    sliders: [
      ["target", "What they try to steer", ["themselves", "plans", "one person", "everyone"], "How far their need for control reaches."],
      ["method", "How they steer", ["charm", "rules", "guilt", "orders", "threats"], "The tool they use to get their way.", { unordered: true }],
      ["grip", "Grip over the scene", ["letting go", "steady", "tightening"], "Whether their hold loosens or tightens as the scene goes on."],
    ],
    window: {
      faces: axis("Surrender", "Controlling", [
        { face: "tiles", slider: "method", icons: { charm: "😊", rules: "📏", guilt: "🥺", orders: "📢", threats: "😠" } },
        { face: "ladder", slider: "grip" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "How they steer", sliders: ["target", "method"] },
        { label: "Over the scene", sliders: ["grip", "shown"] },
      ],
      presets: [
        { label: "Perfect host", plain: "Has to control the whole party, nicely.", set: { position: 85, target: "everyone", method: "rules", grip: "tightening" } },
        { label: "Nurse Ratched", plain: "Cold total control.", set: { position: 100, target: "everyone", method: "orders", grip: "steady" } },
        { label: "Go with the flow", plain: "Lets the world happen to them.", set: { position: 5, target: "themselves", grip: "letting go" } },
      ],
    },
  });

  W.add("cm-adaptability", {
    sliders: [
      ["rules", "Lives by", ["whatever works", "loose habits", "firm habits", "strict rules"], "How fixed their way of doing things is."],
      ["improvise", "Thinks on their feet", [0, 5, ""], "How well they handle the unexpected."],
      ["underPressure", "Under pressure they", ["bend easily", "bend slowly", "crack", "snap"], "What happens when the world won't fit their way."],
    ],
    window: {
      faces: axis("Flexible", "Rigid", [
        { face: "ladder", slider: "rules" },
        { face: "dial", slider: "improvise" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Their way", sliders: ["rules", "improvise"] },
        { label: "Under pressure", sliders: ["underPressure", "shown"] },
      ],
      presets: [
        { label: "MacGyver", plain: "Makes do with whatever is at hand.", set: { position: 5, rules: "whatever works", improvise: 5, underPressure: "bend easily" } },
        { label: "Captain's whistle", plain: "Strict rules that slowly soften.", set: { position: 90, rules: "strict rules", improvise: 1, swing: 30 } },
        { label: "Breaking point", plain: "Rigid, and cracks when pushed.", set: { position: 80, underPressure: "snap", improvise: 0 } },
      ],
    },
  });

  W.add("cm-competence", {
    sliders: [
      ["selfBelief", "How capable they think they are", [0, 100, ""], "Their own idea of their skill; the gap with the real thing is drama or comedy."],
      ["mistakes", "Mistakes this scene", [0, 5, ""], "How many times they get it wrong."],
      ["learning", "Getting better", ["getting worse", "stuck", "learning", "mastering"], "Which way their skill is moving over the story."],
    ],
    window: {
      faces: axis("Ineffective", "Highly capable", [
        { face: "pad", x: "position", y: "selfBelief", xLabel: "Real skill", yLabel: "Self-belief" },
        { face: "ladder", slider: "learning" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Skill against belief", sliders: ["selfBelief", "mistakes"] },
        { label: "Over the story", sliders: ["learning", "shown"] },
      ],
      presets: [
        { label: "Inspector Clouseau", plain: "Hopeless and completely sure of himself.", set: { position: 5, selfBelief: 100, mistakes: 5, learning: "stuck" } },
        { label: "Training montage", plain: "Starts weak and keeps getting better.", set: { position: 30, learning: "learning", swing: 20, selfBelief: 30 } },
        { label: "Quiet expert", plain: "Brilliant, says little about it.", set: { position: 95, selfBelief: 70, mistakes: 0, learning: "mastering" } },
      ],
    },
  });

  W.add("cm-need", {
    sliders: [
      ["tiedBy", "What ties them down", ["nothing", "a habit", "a job", "a family"], "What keeps them where they are."],
      ["urge", "Urge to run", [0, 5, ""], "How strongly they want out right now."],
      ["trade", "Would trade one for the other", ["never", "maybe", "if pushed", "gladly"], "How ready they are to give up safety for freedom, or the reverse."],
    ],
    window: {
      faces: axis("Security", "Freedom", [
        { face: "dial", slider: "urge" },
        { face: "ladder", slider: "tiedBy" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Held or free", sliders: ["tiedBy", "urge", "trade"] },
        { label: "On screen", sliders: ["shown"] },
      ],
      presets: [
        { label: "Road-trip escape", plain: "Nothing will hold them now.", set: { position: 95, urge: 5, trade: "gladly", tiedBy: "nothing" } },
        { label: "Homebody", plain: "Safe at home and staying there.", set: { position: 5, urge: 0, trade: "never", tiedBy: "a family" } },
        { label: "Settling down", plain: "A free spirit slowly choosing to stay.", set: { position: 60, swing: 30, trade: "if pushed", tiedBy: "a family" } },
      ],
    },
  });

  W.add("cm-motivation", {
    sliders: [
      ["prize", "What they're after", ["money", "praise", "status", "peace", "meaning"], "The reward they want most.", { unordered: true }],
      ["audience", "Who they perform for", ["no one", "themselves", "one person", "a crowd", "the world"], "Whose eyes they feel on them."],
      ["aware", "Knows their real motive", ["fooled", "half aware", "fully aware"], "Whether they understand what really drives them."],
    ],
    window: {
      faces: axis("External", "Internal", [
        { face: "tiles", slider: "prize", icons: { money: "💰", praise: "👏", status: "👑", peace: "☮️", meaning: "🧭" } },
        { face: "ladder", slider: "aware" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "What they want", sliders: ["prize", "audience"] },
        { label: "Self-knowledge", sliders: ["aware", "shown"] },
      ],
      presets: [
        { label: "Social climber", plain: "All for status, in front of a crowd.", set: { position: 5, prize: "status", audience: "a crowd", aware: "fooled" } },
        { label: "Quiet craftsman", plain: "Works for meaning, for no one but themselves.", set: { position: 95, prize: "meaning", audience: "themselves", aware: "fully aware" } },
        { label: "Scrooge learns", plain: "From money to meaning over one night.", set: { position: 40, swing: 50, prize: "money", aware: "half aware" } },
      ],
    },
  });

  W.add("cm-health", {
    sliders: [
      ["trigger", "What tips them", TRIGGERS, "What pushes their health up or down in this scene.", { unordered: true }],
      ["seenBy", "Who notices the change", SEEN, "Who in the story can see them slipping or growing."],
      ["recover", "How fast they bounce back", ["stays down", "slow", "steady", "quick"], "How quickly they return to their usual level after a slide."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "balance", slider: "pull", left: "Growth", right: "Stress" },
        { face: "tiles", slider: "trigger", icons: { pressure: "🗜️", loss: "🥀", failure: "📉", praise: "👏", love: "❤️" } },
      ],
      groups: [
        { label: "How healthy", sliders: ["level", "pull"] },
        { label: "Moving over scenes", sliders: ["drift", "trigger", "recover"] },
        { label: "Who sees it", sliders: ["seenBy"] },
      ],
      presets: [
        { label: "Downward spiral", plain: "Falling into stress after a loss, slow to recover.", set: { level: 8, pull: "toward stress", trigger: "loss", recover: "stays down", drift: 2 } },
        { label: "Growth arc", plain: "Love pulls them toward their best.", set: { level: 4, pull: "toward growth", trigger: "love", drift: 1, recover: "quick" } },
        { label: "Holding steady", plain: "Average health, no pull either way.", set: { level: 5, pull: "neither", drift: 0, seenBy: "no one" } },
      ],
    },
  });

  W.add("cm-worldview", {
    sliders: [
      ["shapedBy", "Shaped by", ["a loss", "a betrayal", "a mentor", "faith", "experience"], "What made them see the world this way.", { unordered: true }],
      ["voiced", "Says it out loud", ["never", "in jokes", "sometimes", "often"], "How often they put their view into words."],
      ["proved", "Proved right this scene", ["proved wrong", "unsure", "proved right"], "Whether the scene backs up or knocks down their view."],
    ],
    window: {
      faces: axis("Idealist", "Cynic", [
        { face: "tiles", slider: "shapedBy", icons: { "a loss": "🥀", "a betrayal": "🗡️", "a mentor": "🧓", faith: "🙏", experience: "📚" } },
        { face: "ladder", slider: "voiced" },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Where it comes from", sliders: ["shapedBy", "voiced"] },
        { label: "Tested", sliders: ["proved", "shown"] },
      ],
      presets: [
        { label: "Casablanca's Rick", plain: "A betrayed cynic who turns idealist at the end.", set: { position: 85, swing: 40, shapedBy: "a betrayal", proved: "proved wrong" } },
        { label: "Relentless optimist", plain: "Believes in everyone and says so.", set: { position: 5, voiced: "often", shapedBy: "faith", proved: "proved right" } },
        { label: "Sarcastic doctor", plain: "A cynic who says it in jokes.", set: { position: 95, voiced: "in jokes", shapedBy: "experience" } },
      ],
    },
  });

  W.add("cm-emotion", {
    sliders: [
      ["breaksThrough", "The other side breaks through", ["never", "once", "now and then", "often"], "How often the hidden side (heart or head) takes over."],
      ["decideSpeed", "How fast they decide", ["on the spot", "a beat", "after thinking", "after long thought"], "How long they take to choose."],
      ["showsIn", "Where it shows", ["the face", "the voice", "the body", "what they do"], "Where we see feeling or reason at work.", { unordered: true }],
    ],
    window: {
      faces: axis("Emotional", "Rational", [
        { face: "ladder", slider: "decideSpeed" },
        { face: "tiles", slider: "showsIn", icons: { "the face": "🙂", "the voice": "🗣️", "the body": "🧍", "what they do": "🛠️" } },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Deciding", sliders: ["decideSpeed", "breaksThrough"] },
        { label: "On screen", sliders: ["showsIn", "shown"] },
      ],
      presets: [
        { label: "Spock logic", plain: "Pure reason, with a rare crack of feeling.", set: { position: 95, decideSpeed: "after thinking", breaksThrough: "once" } },
        { label: "Hothead", plain: "Feels first, decides on the spot.", set: { position: 5, decideSpeed: "on the spot", showsIn: "what they do" } },
        { label: "Head against heart", plain: "Torn, swinging between the two.", set: { position: 50, swing: 45, breaksThrough: "often" } },
      ],
    },
  });

  W.add("cm-temperament", {
    sliders: [
      ["mess", "Their space", ["spotless", "tidy", "lived-in", "messy", "a disaster"], "What their room, desk or car looks like."],
      ["routine", "Daily routine", ["exact to the minute", "set", "loose", "none"], "How fixed their days are, from clockwork to none."],
      ["onTime", "On time", ["early", "on time", "a bit late", "very late"], "Whether they turn up when they should, a timing gag waiting to happen."],
    ],
    window: {
      faces: axis("Orderly", "Chaotic", [
        { face: "ladder", slider: "mess" },
        { face: "tiles", slider: "onTime", icons: { early: "⏰", "on time": "✅", "a bit late": "🏃", "very late": "🐌" } },
      ]),
      groups: [
        { label: "Where they sit", sliders: ["position", "swing"] },
        { label: "Their life", sliders: ["mess", "routine", "onTime"] },
        { label: "On screen", sliders: ["shown"] },
      ],
      presets: [
        { label: "Odd Couple: the neat one", plain: "Spotless, early, clockwork.", set: { position: 5, mess: "spotless", routine: "exact to the minute", onTime: "early" } },
        { label: "Odd Couple: the slob", plain: "A disaster, always late.", set: { position: 95, mess: "a disaster", routine: "none", onTime: "very late" } },
        { label: "Wes Anderson precision", plain: "Everything in its place, shown plainly.", set: { position: 10, mess: "tidy", routine: "set", shown: "plain to see" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
