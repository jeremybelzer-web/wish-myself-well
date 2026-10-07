/* win for the belonging curiosities in data/db-depth-belonging.js (2026-10-05). Each one already has six graded
   settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  W.add("needApproval", {
    window: {
      faces: [
        { face: "dial", slider: "need" },
        { face: "tiles", slider: "whose", icons: { "a parent": "👪", "a partner": "💑", "a few friends": "🧑‍🤝‍🧑", "the whole group": "👥", strangers: "🌐", "a boss or leader": "👔" } },
        { face: "ladder", slider: "swayed" },
      ],
      groups: [
        { label: "The need", sliders: ["need", "whose", "source"] },
        { label: "Groupthink", sliders: ["swayed", "hides", "withheld"] },
      ],
      presets: [
        { label: "Needs every nod", plain: "Checks the room before every word.", set: { need: 90, whose: "the whole group", swayed: "always", hides: "shows it openly", withheld: "tries harder", source: 0 } },
        { label: "Acts like they don't care", plain: "Says they don't care what anyone thinks, and watches everyone.", set: { need: 70, whose: "a few friends", swayed: "often", hides: "acts like they don't care", withheld: "sulks", source: 1 } },
        { label: "Their own judge", plain: "Doesn't need the nod at all.", set: { need: 5, whose: "a parent", swayed: "never", hides: "shows it openly", withheld: "shrugs", source: 5 } },
      ],
    },
  });

  W.add("loveOrientation", {
    window: {
      faces: [
        { face: "dial", slider: "toward" },
        { face: "tiles", slider: "one", icons: { "no one yet": "❔", "a partner": "💑", "a crush": "💘", "a best friend": "🤝", "a parent": "👪", "a child": "🧒" } },
        { face: "ladder", slider: "shows" },
      ],
      groups: [
        { label: "Whose love", sliders: ["toward", "one"] },
        { label: "Want and have", sliders: ["want", "have", "jealous"] },
        { label: "Reaching for it", sliders: ["shows"] },
      ],
      presets: [
        { label: "Loved by the room", plain: "The entertainer who needs the whole crowd's love.", set: { toward: 10, want: 5, have: 3, one: "no one yet", shows: "performs and entertains", jealous: 2 } },
        { label: "Only you", plain: "Wants one person, and nobody else counts.", set: { toward: 95, want: 5, have: 1, one: "a partner", shows: "waits to be chosen", jealous: 5 } },
        { label: "Content", plain: "Has the love they want.", set: { toward: 60, want: 2, have: 5, one: "a best friend", shows: "gives gifts and help", jealous: 0 } },
      ],
    },
  });

  W.add("circleSize", {
    window: {
      faces: [
        { face: "ladder", slider: "size" },
        { face: "ladder", slider: "wants" },
        { face: "ladder", slider: "changes" },
      ],
      groups: [
        { label: "The circle", sliders: ["size", "wants", "changes"] },
        { label: "Inside it", sliders: ["center", "outsider", "cost"] },
      ],
      presets: [
        { label: "Small-town heart", plain: "At the center of a whole community that tests every newcomer.", set: { size: "a whole community", wants: "a whole community", center: "at the very center", changes: "steady", outsider: "test them", cost: 3 } },
        { label: "Two against the world", plain: "A couple who shut everyone else out.", set: { size: "a couple", wants: "a couple", center: "at the very center", changes: "steady", outsider: "shut them out", cost: 2 } },
        { label: "Emptying table", plain: "A big group, shrinking around them.", set: { size: "a big group", wants: "a big group", center: "at the edge", changes: "shrinking fast", outsider: "ignore them", cost: 4 } },
      ],
    },
  });

  W.add("inCharge", {
    window: {
      faces: [
        { face: "ladder", slider: "rank" },
        { face: "dial", slider: "grip" },
        { face: "tiles", slider: "style", icons: { quietly: "🤫", "by example": "🏃", "by charm": "😊", "by fear": "😠", "by the rules": "📜" } },
      ],
      groups: [
        { label: "Rank", sliders: ["rank", "wants", "earned"] },
        { label: "Holding it", sliders: ["grip", "style", "weight"] },
      ],
      presets: [
        { label: "The climber", plain: "Trusted with a job, wants the top, and is working for it.", set: { rank: "trusted with a job", wants: "in charge", grip: 3, style: "by charm", earned: "earned it", weight: 1 } },
        { label: "Uneasy crown", plain: "In charge, took it by force, and holding on by fear.", set: { rank: "in charge", wants: "in charge", grip: 1, style: "by fear", earned: "took it", weight: 5 } },
        { label: "Happy follower", plain: "Follows orders and likes it that way.", set: { rank: "follows orders", wants: "follows orders", grip: 4, style: "quietly", earned: "given it", weight: 0 } },
      ],
    },
  });

  W.add("reliance", {
    window: {
      faces: [
        { face: "dial", slider: "lean" },
        { face: "tiles", slider: "who", icons: { family: "👪", "a partner": "💑", friends: "🧑‍🤝‍🧑", "co-workers": "💼", "a whole town": "🏘️" } },
        { face: "ladder", slider: "admits" },
      ],
      groups: [
        { label: "Who leans", sliders: ["lean", "who", "weight"] },
        { label: "Under the surface", sliders: ["admits", "resent", "flip"] },
      ],
      presets: [
        { label: "The family's rock", plain: "Everyone leans on her, and she never asks for help.", set: { lean: 95, who: "family", weight: 5, admits: "never", resent: 3, flip: "no" } },
        { label: "Needs looking after", plain: "Leans on a partner for almost everything.", set: { lean: 10, who: "a partner", weight: 3, admits: "easily", resent: 1, flip: "no" } },
        { label: "The tables turn", plain: "The strong one now needs the help.", set: { lean: 50, who: "family", weight: 4, admits: "only when desperate", resent: 2, flip: "fully flipped" } },
      ],
    },
  });

  W.add("thriving", {
    window: {
      faces: [
        { face: "dial", slider: "now" },
        { face: "ladder", slider: "past" },
        { face: "ladder", slider: "heading" },
      ],
      groups: [
        { label: "Past, now and next", sliders: ["past", "now", "heading"] },
        { label: "Where it shows", sliders: ["area", "shows", "knows"] },
      ],
      presets: [
        { label: "Glory days gone", plain: "Thrived before, struggling now, still falling.", set: { now: 25, past: "thrived", heading: "slipping", area: "work", shows: "a crack shows", knows: "half knows" } },
        { label: "Rags to riches", plain: "Struggled badly, getting by, and climbing fast.", set: { now: 45, past: "struggled badly", heading: "rising fast", area: "money", shows: "plain to see", knows: "sees it clearly" } },
        { label: "Perfect on the outside", plain: "Looks fine, falling apart inside, and doesn't see it.", set: { now: 30, past: "did well", heading: "falling fast", area: "the mind", shows: "hidden", knows: "no idea" } },
      ],
    },
  });
  W.add("driveOrPeace", {
    window: {
      faces: [
        { face: "dial", slider: "drive" },
        { face: "tiles", slider: "by", icons: { "a need": "🫀", "a want": "🎯", fear: "😨", love: "❤️", duty: "📜", revenge: "🗡️" } },
        { face: "ladder", slider: "turns" },
      ],
      groups: [
        { label: "The drive", sliders: ["drive", "by", "restless"] },
        { label: "Peace and cost", sliders: ["peace", "cost", "turns"] },
      ],
      presets: [
        { label: "Can't rest", plain: "Driven by fear, pacing, running over everyone.", set: { drive: 95, by: "fear", restless: 5, peace: "nowhere yet", cost: 4, turns: "winding up" } },
        { label: "Enough", plain: "Content, relaxed, at peace with what they have.", set: { drive: 5, by: "a need", restless: 0, peace: "having enough", cost: 0, turns: "steady" } },
        { label: "Letting go", plain: "Was driven, now settling down.", set: { drive: 40, by: "revenge", restless: 2, peace: "letting go", cost: 1, turns: "settling down" } },
      ],
    },
  });

  W.add("needMet", {
    window: {
      faces: [
        { face: "dial", slider: "met" },
        { face: "tiles", slider: "need", icons: { safety: "🛡️", belonging: "🏠", respect: "🙇", love: "❤️", freedom: "🕊️", meaning: "✨" } },
        { face: "ladder", slider: "shift" },
      ],
      groups: [
        { label: "The need", sliders: ["met", "need", "shift"] },
        { label: "The person", sliders: ["by", "aware", "reacts"] },
      ],
      presets: [
        { label: "Starved for respect", plain: "A rival blocks the respect he needs, and he lashes out.", set: { met: 10, need: "respect", shift: "starves it", by: "a rival", aware: "half knows", reacts: "lash out" } },
        { label: "Finally belongs", plain: "The group takes her in at last.", set: { met: 90, need: "belonging", shift: "fulfills it", by: "the group", aware: "knows it well", reacts: "give thanks" } },
        { label: "Unknown hunger", plain: "Needs love, doesn't know it, and hides it.", set: { met: 30, need: "love", shift: "leaves it", by: "themselves", aware: "no idea", reacts: "hide it" } },
      ],
    },
  });

  W.add("wantMet", {
    window: {
      faces: [
        { face: "dial", slider: "met" },
        { face: "tiles", slider: "want", icons: { "a person": "💑", money: "💰", "a win": "🏆", "a place": "📍", "a job": "💼", "to be left alone": "🚪" } },
        { face: "ladder", slider: "shift" },
      ],
      groups: [
        { label: "The want", sliders: ["met", "want", "shift"] },
        { label: "The chase", sliders: ["blocker", "chase", "worth"] },
      ],
      presets: [
        { label: "So close", plain: "The win is almost theirs, and a rival steps in.", set: { met: 70, want: "a win", shift: "snatches it away", blocker: "a rival", worth: "fine", chase: 5 } },
        { label: "Empty prize", plain: "Handed the money, and it's not what they needed.", set: { met: 100, want: "money", shift: "hands it to them", blocker: "nobody", worth: "empty", chase: 2 } },
        { label: "Their own worst enemy", plain: "The only thing in the way is themselves.", set: { met: 30, want: "a person", shift: "blocks it", blocker: "themselves", worth: "everything", chase: 3 } },
      ],
    },
  });

  W.add("influence", {
    window: {
      faces: [
        { face: "pad", x: "gives", y: "takes" },
        { face: "tiles", slider: "how", icons: { words: "💬", actions: "✋", "just being there": "🧍", "being missing": "🪑", "a look": "👀" } },
        { face: "ladder", slider: "kind" },
      ],
      groups: [
        { label: "Give and take", sliders: ["gives", "takes"] },
        { label: "How and whom", sliders: ["how", "whom", "kind", "lasts"] },
      ],
      presets: [
        { label: "Changes the room", plain: "One sentence from her changes everyone, for good.", set: { gives: 90, takes: 20, how: "words", whom: "the whole room", kind: "for the better", lasts: "the story" } },
        { label: "Sponge", plain: "Moves no one, moved by everyone.", set: { gives: 10, takes: 90, how: "just being there", whom: "one person", kind: "mixed", lasts: "a moment" } },
        { label: "The empty chair", plain: "Their absence changes everyone, for the worse.", set: { gives: 80, takes: 0, how: "being missing", whom: "a few", kind: "for the worse", lasts: "a lifetime" } },
      ],
    },
  });

  W.add("plotPull", {
    window: {
      faces: [
        { face: "dial", slider: "pull" },
        { face: "ladder", slider: "tension" },
        { face: "ladder", slider: "chaos" },
      ],
      groups: [
        { label: "The plot", sliders: ["pull", "way", "meant"] },
        { label: "Tension and chaos", sliders: ["tension", "chaos", "seen"] },
      ],
      presets: [
        { label: "The spark", plain: "Pushes the story forward on purpose and explodes the tension.", set: { pull: 5, way: "push it forward", tension: "explode it", chaos: "bring chaos", meant: "on purpose", seen: "everyone" } },
        { label: "The peacemaker", plain: "Holds the story back by calming everything down.", set: { pull: 3, way: "hold it back", tension: "resolve it", chaos: "bring order", meant: "on purpose", seen: "one person" } },
        { label: "The accident", plain: "Turns the whole plot without meaning to.", set: { pull: 4, way: "turn it", tension: "raise it", chaos: "stir things", meant: "by accident", seen: "no one" } },
      ],
    },
  });

})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
