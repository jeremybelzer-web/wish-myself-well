/* Character: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("cm-agency", {
    "take charge": { position: 90, steers: 5, trigger: "their own idea" },
    "charge in": { position: 95, delay: "at once", actSeconds: 0 },
    "more passive": { position: 15, steers: 1 },
    "dragged along": { position: 10, trigger: "being forced", steers: 0 },
    "they hesitate": { delay: "many scenes", actSeconds: 40 },
    "reluctant hero": { position: 55, swing: 30, trigger: "a threat" },
    "make them look powerful": { position: 90, steers: 5, shown: "plain to see" },
    "jump at the chance": { trigger: "an opportunity", delay: "at once" },
    "drives the plot": { started: 8, steers: 5 },
  });
  W.say("cm-openness", {
    "open book": { position: 5, trusts: "everyone", shown: "plain to see" },
    "keeps to themselves": { position: 80, trusts: "no one" },
    "dark secret": { position: 95, secret: "the past", reveals: 0 },
    "not who they say": { position: 100, secret: "who they really are" },
    "let them in slowly": { position: 60, reveals: 1, trusts: "one person" },
    "heart on their sleeve": { position: 10, secret: "feelings", aboutSelf: 90 },
    "can't look you in the eye": { eyeContact: 10 },
    "confides in us": { openWith: "the audience" },
    "more mysterious": { position: 85, shown: "glimpsed" },
  });
  W.say("cm-conflict", {
    "picks fights": { position: 90, fuse: "short fuse" },
    "hothead": { position: 95, fuse: "hair trigger", style: "shouting" },
    "doormat": { position: 5, backDown: "quickly", style: "passive digs" },
    "passive aggressive": { position: 25, style: "passive digs" },
    "silent treatment": { style: "cold silence", position: 30 },
    "slow boil": { fuse: "long fuse", swing: 45 },
    "never backs down": { backDown: "never" },
    "throws punches": { style: "fists", position: 100 },
    "in their face": { closeIn: 0.3, position: 95 },
    "at war with themselves": { foe: "themselves" },
  });
  W.say("cm-truth", {
    "honest to a fault": { position: 0, lieSize: "white lies", skill: 0 },
    "smooth liar": { position: 85, skill: 5 },
    "con artist": { position: 100, lieSize: "a whole false life", reason: "to win", skill: 5 },
    "terrible liar": { skill: 0, caughtRisk: "about to be caught" },
    "white lies only": { lieSize: "white lies", reason: "to be kind", position: 25 },
    "about to get caught": { caughtRisk: "about to be caught" },
    "lying to themselves": { liedTo: "themselves" },
    "lies for fun": { reason: "for fun" },
    "more shady": { position: 75, trueShare: 30 },
  });
  W.say("enneagramType", {
    "perfectionist": { setting: "1 Reformer" },
    "people pleaser": { setting: "2 Helper" },
    "go-getter": { setting: "3 Achiever" },
    "tortured artist": { setting: "4 Individualist" },
    "the brain": { setting: "5 Investigator" },
    "worrier": { setting: "6 Loyalist" },
    "thrill-seeker": { setting: "7 Enthusiast" },
    "the boss": { setting: "8 Challenger" },
    "peacekeeper": { setting: "9 Peacemaker" },
    "under stress": { arrow: "their stress type" },
    "at their best": { arrow: "their growth type" },
    "show what they fear": { fearShown: 5, fearMoments: 6 },
  });
  W.say("cm-stability", {
    "agent of chaos": { position: 100, arrival: "things stir up", ripple: "the whole world" },
    "the rock": { position: 5, arrival: "things calm down" },
    "shake things up": { position: 85, arrival: "things stir up", changes: 6 },
    "calming presence": { position: 15, arrival: "things calm down", roomSeconds: 10 },
    "changes everyone around them": { ripple: "the group", affected: 30 },
    "the family glue": { anchor: "a family", position: 10 },
    "walks in and everything shifts": { arrival: "things stir up", roomSeconds: 2 },
  });
  W.say("cm-freedom", {
    "rebel": { position: 95, standsOut: "a sore thumb" },
    "company man": { position: 5, standsOut: "blends in", goAlong: 95 },
    "sheep": { position: 0, goAlong: 100 },
    "fish out of water": { standsOut: "a sore thumb", fromGroup: 10 },
    "breaks from the pack": { breakAt: 60, fromGroup: 15 },
    "fits in": { standsOut: "blends in" },
    "peer pressure": { pressure: 5 },
    "family expectations": { whichGroup: "family", pressure: 4 },
    "march to their own drum": { position: 85, goAlong: 10 },
  });
  W.say("cm-morality", {
    "selfless": { position: 5, sacrifice: "their life", circle: "strangers" },
    "greedy": { position: 95, sacrifice: "nothing", givenAway: 0 },
    "looks out for number one": { position: 90, circle: "themselves" },
    "comes back for them": { position: 30, tested: "a hard choice", sacrifice: "safety" },
    "make them a hero": { position: 10, helped: 80, sacrifice: "safety" },
    "make them a villain": { position: 100, givenAway: 0, helped: 0 },
    "family first": { circle: "their family" },
    "put them to the test": { tested: "a hard choice" },
  });
  W.say("cm-risk", {
    "reckless": { position: 95, planning: "no plan", thinkSeconds: 0 },
    "maverick": { position: 90, thrill: 5 },
    "play it safe": { position: 10, planning: "a backup plan" },
    "nervous worrier": { position: 5, thinkSeconds: 50, thrill: 0 },
    "heist planner": { planning: "a backup plan", position: 50 },
    "bet it all": { stake: "their life", odds: 10 },
    "adrenaline junkie": { thrill: 5, toDanger: 0 },
    "think before they leap": { thinkSeconds: 30, planning: "a plan" },
  });
  W.say("cm-control", {
    "control freak": { position: 95, grip: "tightening", target: "everyone" },
    "go with the flow": { position: 5, grip: "letting go" },
    "bossy": { method: "orders", orders: 15, position: 85 },
    "guilt trip": { method: "guilt" },
    "charm them": { method: "charm" },
    "rules with fear": { method: "threats", position: 100 },
    "holds court": { fromCenter: 0, talkShare: 70 },
    "loosen up": { grip: "letting go", position: 35 },
    "make them look powerful": { position: 90, fromCenter: 0, talkShare: 60 },
  });
  W.say("cm-adaptability", {
    "roll with the punches": { position: 5, underPressure: "bend easily" },
    "by the book": { position: 90, rules: "strict rules" },
    "set in their ways": { position: 80, rules: "firm habits", adjustSeconds: 120 },
    "macgyver it": { improvise: 5, rules: "whatever works" },
    "breaking point": { underPressure: "snap" },
    "think on their feet": { improvise: 5, adjustSeconds: 5 },
    "stubborn": { position: 85, plansChanged: 0 },
  });
  W.say("cm-competence", {
    "bumbling": { position: 5, mistakes: 5, successRate: 10 },
    "the best at what they do": { position: 100, mistakes: 0, successRate: 95 },
    "training montage": { learning: "learning", swing: 40 },
    "quiet expert": { position: 90, shown: "glimpsed" },
    "out of their depth": { position: 20, comparedWith: "the task", selfBelief: 20 },
    "cocky but useless": { position: 15, selfBelief: 95 },
    "impostor syndrome": { position: 85, selfBelief: 15 },
    "losing their touch": { learning: "getting worse" },
    "make them look capable": { position: 85, successRate: 85 },
  });
  W.say("cm-need", {
    "itchy feet": { position: 85, urge: 5, doorGlances: 6 },
    "homebody": { position: 5, urge: 0 },
    "settle down": { position: 20, trade: "never" },
    "hit the road": { position: 100, trade: "gladly" },
    "trapped by the job": { tiedBy: "a job", urge: 4 },
    "stuck for years": { yearsTied: 20, tiedBy: "a habit" },
    "keeps looking at the door": { doorGlances: 8 },
  });
  W.say("cm-motivation", {
    "in it for the money": { position: 5, prize: "money" },
    "social climber": { position: 10, prize: "status", audience: "a crowd" },
    "craftsman": { position: 95, prize: "meaning", audience: "themselves" },
    "needs approval": { prize: "praise", checksWatchers: 12 },
    "plays to the crowd": { audience: "a crowd", watchers: 200 },
    "doesn't know why they do it": { aware: "fooled" },
    "does it for one person": { audience: "one person" },
    "finds what matters": { position: 90, prize: "peace", aware: "fully aware" },
  });
  W.say("cm-health", {
    "downward spiral": { level: 8, pull: "toward stress", recover: "stays down" },
    "growth arc": { pull: "toward growth", levelsMoved: -4 },
    "rock bottom": { level: 9, recover: "stays down" },
    "bounces back": { recover: "quick", recoverScenes: 1 },
    "at their best": { level: 1 },
    "holding steady": { pull: "neither", drift: 0 },
    "knocked down by loss": { trigger: "loss", pull: "toward stress" },
    "friends notice": { seenBy: "close friends" },
  });
  W.say("cm-worldview", {
    "jaded": { position: 85, voiced: "often" },
    "starry-eyed": { position: 5, worstShare: 0 },
    "relentless optimist": { position: 0, proved: "proved right" },
    "sarcastic": { position: 80, voiced: "in jokes" },
    "burned before": { shapedBy: "a betrayal", position: 75 },
    "loses their faith": { sinceStart: 60, proved: "proved wrong" },
    "softens up": { sinceStart: -50 },
    "more cynical": { position: 90, worstShare: 80 },
  });
  W.say("cm-emotion", {
    "spock logic": { position: 100, breaksThrough: "never", byFeeling: 0 },
    "hothead": { position: 5, decideSpeed: "on the spot", byFeeling: 95 },
    "heart over head": { position: 20, byFeeling: 80 },
    "head over heart": { position: 80, byFeeling: 20 },
    "cool customer": { position: 85, decideSpeed: "after thinking" },
    "sleep on it": { decideSpeed: "after long thought", decideSeconds: 120 },
    "feeling breaks through": { breaksThrough: "once", shown: "glimpsed" },
    "it's all in the voice": { showsIn: "the voice" },
  });
  W.say("cm-temperament", {
    "neat freak": { position: 0, mess: "spotless", routine: "exact to the minute" },
    "slob": { position: 95, mess: "a disaster" },
    "always late": { onTime: "very late", minutesLate: 30 },
    "always early": { onTime: "early", minutesLate: -10 },
    "wes anderson precise": { position: 5, routine: "exact to the minute", outOfPlace: 0 },
    "hot mess": { position: 100, mess: "a disaster", routine: "none", outOfPlace: 40 },
    "lived-in place": { mess: "lived-in" },
    "creature of habit": { routine: "set", position: 30 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
