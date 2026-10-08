/* win for the kid goals curiosities in data/db-depth-kid-goals.js (2026-10-08): faces, groups and presets. */
(function (W) {
  W.add("kidGoal", {
    window: {
      faces: [
        { face: "dial", slider: "risk" },
        { face: "ladder", slider: "tangible" },
        { face: "ladder", slider: "aware" },
      ],
      groups: [
        { label: "The goal", sliders: ["risk", "tangible", "age"] },
        { label: "The danger", sliders: ["aware", "watched", "cost"] },
      ],
      presets: [
        { label: "Three nights, no sleep", plain: "The test is tomorrow and nothing else matters.", set: { risk: 85, tangible: "right in front of me", aware: "knows but ignores it", watched: "alone", age: "young adult", cost: 4 } },
        { label: "Waiting in the snow", plain: "A 13-year-old waits outside for a star, with a grown-up beside her.", set: { risk: 60, tangible: "within reach", aware: "no idea", watched: "a grown-up right beside them", age: "teenager", cost: 2 } },
        { label: "Dad wires the cabin", plain: "A dad learns a dangerous job from videos for his family.", set: { risk: 75, tangible: "within reach", aware: "knows but ignores it", watched: "alone", age: "adult", cost: 3 } },
      ],
    },
  });

  W.add("preteenGoal", {
    window: {
      faces: [
        { face: "ladder", slider: "dare" },
        { face: "tiles", slider: "kind", icons: { "a physical feat": "🧗", "winning a game": "🃏", "a skill to learn": "🔥", "getting noticed": "👀", "a secret mission": "🕵️" } },
      ],
      groups: [
        { label: "The goal", sliders: ["dare", "kind", "prize"] },
        { label: "Who knows", sliders: ["forWhom", "secret"] },
      ],
      presets: [
        { label: "The rope climb", plain: "Up the rope to the gym ceiling, with the class watching.", set: { dare: "risky", forWhom: 80, prize: "a badge or a win", kind: "a physical feat", secret: "they know" } },
        { label: "Poker in the tent", plain: "Winning everyone's candy after lights out.", set: { dare: "a little risky", forWhom: 50, prize: "candy and bragging rights", kind: "winning a game", secret: "no idea" } },
        { label: "Raid the storehouse", plain: "Breaking into camp's candy supply.", set: { dare: "dangerous", forWhom: 70, prize: "candy and bragging rights", kind: "a secret mission", secret: "no idea" } },
      ],
    },
  });

  W.add("teenGoal", {
    window: {
      faces: [
        { face: "ladder", slider: "size" },
        { face: "dial", slider: "freedom" },
        { face: "tiles", slider: "kind", icons: { status: "👑", love: "💘", freedom: "🗝️", "a big project": "📋", "getting in somewhere": "🚪", rebellion: "🤘" } },
      ],
      groups: [
        { label: "The goal", sliders: ["size", "kind", "identity"] },
        { label: "Freedom", sliders: ["freedom", "crew"] },
      ],
      presets: [
        { label: "The city-wide hunt", plain: "A senior runs a scavenger hunt for every chapter.", set: { size: "city-wide", freedom: 80, identity: 4, kind: "a big project", crew: "a whole chapter" } },
        { label: "No leash", plain: "An edgy friend nobody keeps track of.", set: { size: "for my friends", freedom: 100, identity: 3, kind: "rebellion", crew: "one friend" } },
        { label: "Getting noticed", plain: "Everything is about one person seeing them.", set: { size: "small", freedom: 40, identity: 5, kind: "love", crew: "alone" } },
      ],
    },
  });

  W.add("shyKidGoal", {
    window: {
      faces: [
        { face: "dial", slider: "seen" },
        { face: "ladder", slider: "brave" },
      ],
      groups: [
        { label: "Being seen", sliders: ["seen", "brave"] },
        { label: "After", sliders: ["helper", "retreat"] },
      ],
      presets: [
        { label: "Invisible", plain: "Just wants to get through the day.", set: { seen: 5, brave: "none", helper: "no one", retreat: 5 } },
        { label: "Raises a hand", plain: "One brave moment, then back into the shell.", set: { seen: 50, brave: "real", helper: "a teacher", retreat: 3 } },
        { label: "Steps out for good", plain: "Finally seen, and stays seen.", set: { seen: 95, brave: "huge", helper: "a sibling", retreat: 0 } },
      ],
    },
  });

  W.add("sportsKidGoal", {
    window: {
      faces: [
        { face: "ladder", slider: "hurt" },
        { face: "ladder", slider: "level" },
      ],
      groups: [
        { label: "The game", sliders: ["level", "winLose"] },
        { label: "The cost", sliders: ["hurt", "forWhom"] },
      ],
      presets: [
        { label: "Plays hurt", plain: "Limps back on for the coach.", set: { hurt: "playing hurt", forWhom: 80, level: "state", winLose: "lost" } },
        { label: "Backyard champ", plain: "Just loves to win.", set: { hurt: "sore", forWhom: 10, level: "the backyard", winLose: "won big" } },
      ],
    },
  });

  W.add("lateLifeGoal", {
    window: {
      faces: [
        { face: "ladder", slider: "timeLeft" },
        { face: "dial", slider: "looking" },
        { face: "tiles", slider: "kind", icons: { "make peace": "🕊️", "leave something behind": "🌳", "one last adventure": "🧭", "be grateful": "🙏", "be ready": "🌅" } },
      ],
      groups: [
        { label: "Time", sliders: ["timeLeft", "looking"] },
        { label: "The goal", sliders: ["kind", "forWhom"] },
      ],
      presets: [
        { label: "Making peace", plain: "One phone call left to make.", set: { timeLeft: "not much", looking: 30, forWhom: "my family", kind: "make peace" } },
        { label: "Grateful", plain: "Thanks God for every day.", set: { timeLeft: "almost none", looking: 100, forWhom: "God", kind: "be grateful" } },
      ],
    },
  });

  W.add("friendGroup", {
    window: {
      faces: [
        { face: "ladder", slider: "status" },
        { face: "tiles", slider: "group", icons: { "fit nowhere": "❔", "the outcasts": "🌑", "the quiet ones": "🤫", "the rebels and adventurers": "🛹", "the brains": "🧠", "the popular kids and jocks": "🏈" } },
      ],
      groups: [
        { label: "The group", sliders: ["group", "status", "tight"] },
        { label: "In and out", sliders: ["wantOut", "outsiders"] },
      ],
      presets: [
        { label: "Popular table", plain: "Top of the ladder, and cruel to everyone else.", set: { status: "top", group: "the popular kids and jocks", tight: 4, wantOut: 0, outsiders: "cruel" } },
        { label: "Outcasts of two", plain: "Two kids at the bottom, stuck together.", set: { status: "bottom", group: "the outcasts", tight: 5, wantOut: 3, outsiders: "teases them" } },
        { label: "Fits nowhere", plain: "Holding a tray with nowhere to sit.", set: { status: "low", group: "fit nowhere", tight: 0, wantOut: 5, outsiders: "ignores them" } },
      ],
    },
  });

  W.add("siblingHero", {
    window: {
      faces: [
        { face: "dial", slider: "lookUp" },
        { face: "ladder", slider: "letIn" },
        { face: "tiles", slider: "moment", icons: { "a rescue": "🛟", "a dare": "🎲", "a kindness": "💛", "a stunt": "🚗", "standing up for them": "🛡️" } },
      ],
      groups: [
        { label: "The hero", sliders: ["lookUp", "moment"] },
        { label: "Together", sliders: ["letIn", "pride"] },
      ],
      presets: [
        { label: "The clipboard chase", plain: "The big brother floors it over the medians and sends the little one to grab it back.", set: { lookUp: 100, letIn: "makes them a partner", pride: 5, moment: "a stunt" } },
        { label: "Tags along", plain: "Allowed to come, not to help.", set: { lookUp: 70, letIn: "puts up with them", pride: 2, moment: "a dare" } },
      ],
    },
  });

  W.add("rulesBreakable", {
    window: {
      faces: [
        { face: "ladder", slider: "size" },
        { face: "dial", slider: "thrill" },
      ],
      groups: [
        { label: "The rule", sliders: ["size", "harm", "caught"] },
        { label: "What it does to them", sliders: ["thrill", "stays"] },
      ],
      presets: [
        { label: "Donuts on the frozen lot", plain: "Driving circles at 14 with a brother on the roof.", set: { size: "big", harm: "a few people", thrill: 5, stays: "changes how they see things", caught: "never" } },
        { label: "Straight over the medians", plain: "The straightest path, whatever is in the way.", set: { size: "huge", harm: "themselves", thrill: 5, stays: "changes who they are", caught: "never" } },
        { label: "A tiny rule", plain: "A cookie before dinner.", set: { size: "tiny", harm: "nobody", thrill: 1, stays: "forgotten", caught: "almost" } },
      ],
    },
  });

  W.add("coolGrownup", {
    window: {
      faces: [
        { face: "dial", slider: "cool" },
        { face: "ladder", slider: "teaches" },
        { face: "tiles", slider: "hero", icons: { none: "❔", "a musician": "🎸", "an athlete": "🏅", "a teacher of their own": "📚", "a movie star": "🎬" } },
      ],
      groups: [
        { label: "Cool", sliders: ["cool", "hero"] },
        { label: "With the kids", sliders: ["teaches", "hangs"] },
      ],
      presets: [
        { label: "Big E", plain: "The bike teacher who loves Elvis and teaches wheelies.", set: { cool: 100, teaches: "how to live", hero: "a musician", hangs: 5 } },
        { label: "Square", plain: "Nothing to teach, nowhere to go.", set: { cool: 5, teaches: "nothing", hero: "none", hangs: 0 } },
      ],
    },
  });

  W.add("rizz", {
    window: {
      faces: [
        { face: "dial", slider: "rizz" },
        { face: "ladder", slider: "lands" },
        { face: "tiles", slider: "style", icons: { jokes: "😂", compliments: "💐", confidence: "😎", mystery: "🕶️", kindness: "💛" } },
      ],
      groups: [
        { label: "Rizz", sliders: ["rizz", "style"] },
        { label: "How it goes", sliders: ["lands", "nerve"] },
      ],
      presets: [
        { label: "Unstoppable", plain: "Says the right thing every time.", set: { rizz: 100, lands: "smooth", nerve: 5, style: "confidence" } },
        { label: "Mirror rehearsal", plain: "Practiced it all night, says it all wrong.", set: { rizz: 15, lands: "cringe", nerve: 2, style: "compliments" } },
      ],
    },
  });

  W.add("aura", {
    window: {
      faces: [
        { face: "dial", slider: "aura" },
        { face: "ladder", slider: "trend" },
      ],
      groups: [
        { label: "Aura", sliders: ["aura", "trend"] },
        { label: "Who sees it", sliders: ["seen", "effort"] },
      ],
      presets: [
        { label: "Off the charts", plain: "The whole room turns to look.", set: { aura: 100, seen: "the whole room", trend: "soaring", effort: 0 } },
        { label: "Aura loss", plain: "One bad move, in front of everyone.", set: { aura: -90, seen: "the whole room", trend: "crashing", effort: 4 } },
      ],
    },
  });

  W.add("attractionTime", {
    window: {
      faces: [
        { face: "dial", slider: "share" },
        { face: "ladder", slider: "stage" },
      ],
      groups: [
        { label: "How much", sliders: ["share", "pull"] },
        { label: "Who and when", sliders: ["stage", "toward"] },
      ],
      presets: [
        { label: "Summer camp", plain: "Sailing past the girls' boat and nothing else matters.", set: { share: 90, stage: "child", pull: 5, toward: "the opposite sex" } },
        { label: "Young and taken over", plain: "Desire fills every day.", set: { share: 85, stage: "young adult", pull: 4, toward: "any gender" } },
        { label: "Turned to God", plain: "Later in life, the mind turns elsewhere.", set: { share: 10, stage: "elder", pull: 0, toward: "not yet known" } },
      ],
    },
  });

  W.add("godInLife", {
    window: {
      faces: [
        { face: "ladder", slider: "belief" },
        { face: "tiles", slider: "godIs", icons: { "a judge": "⚖️", "a parent": "👪", "a friend": "🤝", "the whole world": "🌍", "the Self within": "🕉️" } },
        { face: "dial", slider: "deal" },
      ],
      groups: [
        { label: "Belief", sliders: ["belief", "godIs"] },
        { label: "With God", sliders: ["deal", "grateful", "drives"] },
      ],
      presets: [
        { label: "A kid's deal", plain: "\"If you get me this, I'll be good forever.\"", set: { belief: "believes", godIs: "a parent", deal: 5, grateful: 1, drives: 4 } },
        { label: "God in all work", plain: "Thinks of God in every action.", set: { belief: "certain", godIs: "the Self within", deal: 0, grateful: 5, drives: 5 } },
        { label: "Atheist", plain: "No God, and no deals.", set: { belief: "atheist", godIs: "the whole world", deal: 0, grateful: 2, drives: 1 } },
      ],
    },
  });

  W.add("bornNature", {
    window: {
      faces: [
        { face: "dial", slider: "different" },
        { face: "tiles", slider: "leaning", icons: { bold: "🦁", careful: "🐢", dreamy: "☁️", practical: "🔧", devoted: "🙏", restless: "🌪️" } },
      ],
      groups: [
        { label: "Their nature", sliders: ["leaning", "fixed"] },
        { label: "Against their siblings", sliders: ["different", "fights"] },
      ],
      presets: [
        { label: "Two different sisters", plain: "Same home, opposite people.", set: { different: 95, fixed: 4, leaning: "bold", fights: 0 } },
        { label: "Fighting it", plain: "Pushing hard against who they are.", set: { different: 40, fixed: 3, leaning: "careful", fights: 5 } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
