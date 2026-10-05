/* say for the belonging curiosities in data/db-depth-belonging.js: plain words for "Say what you want". */
(function (W) {
  W.say("needApproval", {
    "a people pleaser": { need: 90, swayed: "always" },
    "doesn't care what anyone thinks": { need: 5, source: 5 },
    "easily swayed by the group": { swayed: "always" },
    "groupthink": { swayed: "often" },
    "needs their parents' approval": { whose: "a parent" },
    "pretends not to care": { hides: "acts like they don't care" },
    "turns on the group": { withheld: "turns on the group" },
  });
  W.say("loveOrientation", {
    "wants everyone to love them": { toward: 5 },
    "wants one person's love": { toward: 95 },
    "a hopeless romantic": { toward: 90, want: 5 },
    "starved for love": { want: 5, have: 0 },
    "feels loved": { have: 5 },
    "jealous": { jealous: 5 },
    "a performer for love": { shows: "performs and entertains" },
  });
  W.say("circleSize", {
    "a loner": { size: "on their own" },
    "just the two of them": { size: "a couple" },
    "a tight group of friends": { size: "a few close friends" },
    "part of a big community": { size: "a whole community" },
    "losing friends": { changes: "shrinking" },
    "making friends": { changes: "growing" },
    "on the outside": { center: "at the edge" },
    "the center of the group": { center: "at the very center" },
  });
  W.say("inCharge", {
    "the boss": { rank: "in charge" },
    "a follower": { rank: "follows orders" },
    "second in command": { rank: "second in command" },
    "wants to be in charge": { wants: "in charge" },
    "rules by fear": { style: "by fear" },
    "about to lose control": { grip: 0 },
    "the weight of leadership": { weight: 5 },
  });
  W.say("reliance", {
    "everyone relies on them": { lean: 95 },
    "relies on everyone": { lean: 5 },
    "can't ask for help": { admits: "never" },
    "asks for help easily": { admits: "easily" },
    "resentful": { resent: 5 },
    "the tables have turned": { flip: "fully flipped" },
    "the town depends on them": { who: "a whole town" },
  });
  W.say("thriving", {
    "thriving": { now: 95 },
    "struggling": { now: 15 },
    "on the way up": { heading: "climbing" },
    "on the way down": { heading: "slipping" },
    "used to be great": { past: "thrived" },
    "had a hard past": { past: "struggled badly" },
    "money trouble": { area: "money" },
    "hiding how bad it is": { shows: "hidden" },
  });
  W.say("driveOrPeace", {
    "driven": { drive: 90 },
    "at peace": { drive: 5, peace: "having enough" },
    "can't sit still": { restless: 5 },
    "driven by revenge": { by: "revenge" },
    "driven by fear": { by: "fear" },
    "calming down": { turns: "settling down" },
    "winding up": { turns: "winding up" },
  });
  W.say("needMet", {
    "the need is met": { met: 95, shift: "fulfills it" },
    "the need is frustrated": { met: 10, shift: "starves it" },
    "needs to belong": { need: "belonging" },
    "needs respect": { need: "respect" },
    "needs to feel safe": { need: "safety" },
    "doesn't know what they need": { aware: "no idea" },
    "lashes out": { reacts: "lash out" },
  });
  W.say("wantMet", {
    "they get what they want": { met: 100, shift: "hands it to them" },
    "the want is blocked": { met: 15, shift: "blocks it" },
    "wants money": { want: "money" },
    "wants to win": { want: "a win" },
    "in their own way": { blocker: "themselves" },
    "not worth having": { worth: "empty" },
    "chasing it hard": { chase: 5 },
  });
  W.say("influence", {
    "changes everyone around them": { gives: 95, whom: "the whole room" },
    "easily influenced": { takes: 90 },
    "nothing gets to them": { takes: 0 },
    "a bad influence": { kind: "for the worse" },
    "a good influence": { kind: "for the better" },
    "their absence is felt": { how: "being missing" },
    "changes them for life": { lasts: "a lifetime" },
  });
  W.say("plotPull", {
    "drives the plot": { pull: 5, way: "push it forward" },
    "holds the story back": { way: "hold it back" },
    "raises the tension": { tension: "raise it" },
    "resolves the tension": { tension: "resolve it" },
    "brings chaos": { chaos: "bring chaos" },
    "brings order": { chaos: "bring order" },
    "by accident": { meant: "by accident" },
  });

})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
