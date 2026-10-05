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
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
