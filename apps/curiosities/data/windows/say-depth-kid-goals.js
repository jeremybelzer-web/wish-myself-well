/* say for the kid goals curiosities in data/db-depth-kid-goals.js: plain words for "Say what you want". */
(function (W) {
  W.say("kidGoal", {
    "puts their body on the line": { risk: 90 },
    "would do anything for it": { risk: 100, tangible: "right in front of me" },
    "has no idea how dangerous it is": { aware: "no idea" },
    "nobody watching out for them": { watched: "alone" },
    "a grown-up goes with them": { watched: "a grown-up right beside them" },
    "pays for it the next day": { cost: 5 },
    "plays it safe": { risk: 5 },
  });
  W.say("preteenGoal", {
    "a dangerous dare": { dare: "dangerous" },
    "to impress the other kids": { forWhom: 90 },
    "just for themselves": { forWhom: 5 },
    "for candy": { prize: "candy and bragging rights" },
    "a secret mission": { kind: "a secret mission", secret: "no idea" },
    "climb the rope": { kind: "a physical feat", dare: "risky" },
  });
  W.say("teenGoal", {
    "city-wide": { size: "city-wide" },
    "no leash": { freedom: 100 },
    "kept on a leash": { freedom: 5 },
    "it's who they are": { identity: 5 },
    "a big project": { kind: "a big project" },
    "rebellious": { kind: "rebellion", freedom: 90 },
    "with the whole chapter": { crew: "a whole chapter" },
  });
  W.say("shyKidGoal", {
    "wants to be invisible": { seen: 0 },
    "wants to be noticed": { seen: 95 },
    "one brave moment": { brave: "real" },
    "hides right away": { retreat: 5 },
    "a teacher helps": { helper: "a teacher" },
  });
  W.say("sportsKidGoal", {
    "plays hurt": { hurt: "playing hurt" },
    "anything to win": { hurt: "anything to win" },
    "for the coach": { forWhom: 90 },
    "the big leagues": { level: "the big leagues" },
    "just lost": { winLose: "lost badly" },
  });
  W.say("lateLifeGoal", {
    "running out of time": { timeLeft: "almost none" },
    "full of regret": { looking: 5 },
    "grateful": { looking: 100, kind: "be grateful" },
    "making peace": { kind: "make peace" },
    "leave a legacy": { kind: "leave something behind", forWhom: "the people after me" },
  });
  W.say("friendGroup", {
    "the popular kids": { group: "the popular kids and jocks", status: "top" },
    "the outcasts": { group: "the outcasts", status: "bottom" },
    "fits nowhere": { group: "fit nowhere" },
    "the rebels": { group: "the rebels and adventurers" },
    "wants to switch groups": { wantOut: 5 },
    "mean to outsiders": { outsiders: "cruel" },
    "a tight group": { tight: 5 },
  });
  W.say("siblingHero", {
    "worships their big brother": { lookUp: 100 },
    "the coolest brother ever": { lookUp: 100, letIn: "makes them a partner" },
    "the big sister shuts them out": { letIn: "shuts them out" },
    "so proud of them": { pride: 5 },
    "a rescue": { moment: "a rescue" },
  });
  W.say("rulesBreakable", {
    "break all the rules": { size: "huge", thrill: 5 },
    "a tiny rule": { size: "tiny" },
    "nobody gets hurt": { harm: "nobody" },
    "changes who they are": { stays: "changes who they are" },
    "gets caught": { caught: "caught" },
    "never got caught": { caught: "never" },
  });
  W.say("coolGrownup", {
    "the coolest grown-up": { cool: 100 },
    "a square": { cool: 5 },
    "teaches them how to live": { teaches: "how to live" },
    "loves elvis": { hero: "a musician" },
    "hangs out with the kids": { hangs: 5 },
  });
  W.say("rizz", {
    "unspoken rizz": { rizz: 100, lands: "smooth" },
    "no rizz": { rizz: 0 },
    "cringe": { lands: "cringe" },
    "smooth": { lands: "smooth" },
    "fearless": { nerve: 5 },
    "frozen": { nerve: 0 },
    "makes her laugh": { style: "jokes" },
  });
  W.say("aura", {
    "aura off the charts": { aura: 100 },
    "aura loss": { aura: -80, trend: "crashing" },
    "minus aura": { aura: -100 },
    "the whole room sees it": { seen: "the whole room" },
    "effortless": { effort: 0 },
    "trying too hard": { effort: 5 },
  });
  W.say("attractionTime", {
    "boy crazy": { share: 90, toward: "the opposite sex" },
    "girl crazy": { share: 90, toward: "the opposite sex" },
    "all they think about": { share: 100, pull: 5 },
    "not interested yet": { share: 0, toward: "not yet known" },
    "a teenager": { stage: "teen" },
  });
  W.say("godInLife", {
    "an atheist": { belief: "atheist" },
    "agnostic": { belief: "agnostic" },
    "deeply religious": { belief: "certain", drives: 5 },
    "makes a deal with god": { deal: 5 },
    "thinks of god in everything": { grateful: 5 },
    "god is a judge": { godIs: "a judge" },
  });
  W.say("bornNature", {
    "nothing like her sister": { different: 100 },
    "just like their brother": { different: 0 },
    "born this way": { fixed: 5 },
    "a dreamer": { leaning: "dreamy" },
    "fights their nature": { fights: 5 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
