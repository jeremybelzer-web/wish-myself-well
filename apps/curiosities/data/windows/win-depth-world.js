/* win for the background, set, placement and page curiosities in data/db-depth-world.js (depth thread, world).
   Each one already has five or six graded settings of its own, so these windows add faces, groups and presets
   only. */
(function (W) {
  W.add("crowdReacts", {
    window: {
      faces: [
        { face: "ladder", slider: "reaction" },
        { face: "tiles", slider: "kind", icons: { "carry on": "🚶", "glance and look away": "👀", whisper: "🤫", "film it on their phones": "📱", cheer: "🙌", run: "🏃" } },
        { face: "pad", x: "howMany", y: "clash", xLabel: "More people", yLabel: "Clashes more" },
      ],
      groups: [
        { label: "The reaction", sliders: ["reaction", "kind", "delay"] },
        { label: "The people", sliders: ["howMany", "side"] },
        { label: "Against the moment", sliders: ["clash"] },
      ],
      presets: [
        { label: "Nobody cares", plain: "A busy station carries on while one person falls apart.", set: { reaction: "carry on as normal", howMany: 40, delay: 0, kind: "carry on", side: "nobody", clash: 3 } },
        { label: "Whole room freezes", plain: "Everyone stops and stares, and the murmurs turn against them.", set: { reaction: "everyone stops and stares", howMany: 25, delay: 0.5, kind: "whisper", side: "the other person", clash: 0 } },
        { label: "The crowd cheers", plain: "The people behind burst into cheers for the main character.", set: { reaction: "everyone stops and stares", howMany: 30, delay: 1, kind: "cheer", side: "the main character", clash: 0 } },
      ],
    },
  });

  W.add("backStory", {
    window: {
      faces: [
        { face: "dial", slider: "visible" },
        { face: "tiles", slider: "kind", icons: { "a running joke": "😄", "a mirror of the main story": "🪞", "a warning": "⚠️", "a sweet moment": "💕", "a clue": "🔍" } },
        { face: "ladder", slider: "ending" },
      ],
      groups: [
        { label: "The little story", sliders: ["visible", "kind", "who"] },
        { label: "How it plays", sliders: ["steps", "during"] },
        { label: "How it ends", sliders: ["ending"] },
      ],
      presets: [
        { label: "The parking man", plain: "One stranger tries to park in the background for the whole scene, and finally does.", set: { visible: 3, steps: 5, kind: "a running joke", who: "one stranger", during: "in the pauses", ending: "a payoff we notice" } },
        { label: "A quiet mirror", plain: "A couple behind them are falling in love while the leads fall out.", set: { visible: 2, steps: 3, kind: "a mirror of the main story", who: "a couple", during: "while they talk", ending: "a quiet ending" } },
        { label: "The cake crash", plain: "A waiter's struggle with a tall cake ends by crashing into the main scene.", set: { visible: 4, steps: 4, kind: "a running joke", who: "one stranger", during: "when the camera moves", ending: "it crashes into the main story" } },
      ],
    },
  });

  W.add("behindTheirBack", {
    window: {
      faces: [
        { face: "ladder", slider: "seen" },
        { face: "tiles", slider: "what", icons: { "a person watching": "👤", "a weapon": "🔪", "a fire or flood": "🔥", "a wild animal": "🐺", "a clue they miss": "🔍" } },
        { face: "pad", x: "distance", y: "hold", xLabel: "Further away", yLabel: "Watch it longer" },
      ],
      groups: [
        { label: "The danger", sliders: ["seen", "what", "distance"] },
        { label: "The wait", sliders: ["closing", "hold"] },
        { label: "Do they turn", sliders: ["turn"] },
      ],
      presets: [
        { label: "Figure in the garden", plain: "A blurred figure creeps up the garden for a long time behind her.", set: { seen: "a shape", what: "a person watching", distance: 30, closing: "creeps closer", hold: 20, turn: "just in time" } },
        { label: "Fire under the door", plain: "Smoke curls under the door behind them, and they turn too late.", set: { seen: "clear", what: "a fire or flood", distance: 5, closing: "creeps closer", hold: 10, turn: "too late" } },
        { label: "The missed clue", plain: "The answer sits in sharp focus behind them, and they never see it.", set: { seen: "in sharp focus", what: "a clue they miss", distance: 2, closing: "stays put", hold: 6, turn: "never" } },
      ],
    },
  });

  W.add("signsInBackground", {
    window: {
      faces: [
        { face: "dial", slider: "readable" },
        { face: "tiles", slider: "kind", icons: { "a poster": "🖼️", "a shop sign": "🪧", "a TV or radio report": "📺", graffiti: "🎨", "a newspaper": "📰", "a phone screen": "📱" } },
        { face: "tiles", slider: "job", icons: { "just dresses the place": "🏙️", "tells us news": "🗞️", "jokes about the scene": "😏", "warns us": "⚠️", "sums up the theme": "💡" } },
      ],
      groups: [
        { label: "The sign", sliders: ["kind", "count", "readable"] },
        { label: "What it does", sliders: ["job", "readTime", "noticed"] },
      ],
      presets: [
        { label: "Sign that comments", plain: "A shop sign behind the arguing couple says exactly what is happening.", set: { readable: 5, kind: "a shop sign", job: "jokes about the scene", count: 1, readTime: 3, noticed: "no" } },
        { label: "News on the TV", plain: "A TV in the corner reports the crime the hero just got away with.", set: { readable: 4, kind: "a TV or radio report", job: "tells us news", count: 1, readTime: 6, noticed: "it changes what they do" } },
        { label: "Busy street", plain: "Lots of signs, barely readable, just making the city feel real.", set: { readable: 1, kind: "a shop sign", job: "just dresses the place", count: 9, readTime: 1, noticed: "no" } },
      ],
    },
  });

  W.add("seasons", {
    window: {
      faces: [
        { face: "tiles", slider: "season", icons: { winter: "❄️", spring: "🌸", summer: "☀️", autumn: "🍂" } },
        { face: "dial", slider: "shown" },
        { face: "tiles", slider: "signs", icons: { "bare trees": "🌳", blossom: "🌸", snow: "☃️", "falling leaves": "🍁", "holiday lights": "✨", "heat haze": "🌡️" } },
      ],
      groups: [
        { label: "The season", sliders: ["season", "shown", "signs"] },
        { label: "Across the film", sliders: ["passes", "holiday"] },
        { label: "What it means", sliders: ["meaning"] },
      ],
      presets: [
        { label: "Spring to winter", plain: "A love story that starts in blossom and ends in snow.", set: { season: "spring", shown: 4, signs: "blossom", passes: 4, holiday: "none", meaning: "a new start" } },
        { label: "One hot summer", plain: "Heat haze in every shot, one long summer that changes everything.", set: { season: "summer", shown: 5, signs: "heat haze", passes: 0, holiday: "hinted", meaning: "life at its fullest" } },
        { label: "Holiday story", plain: "A winter holiday is the story itself.", set: { season: "winter", shown: 5, signs: "holiday lights", passes: 0, holiday: "the holiday is the story", meaning: "nothing" } },
      ],
    },
  });

  W.add("roomMirrorsThem", {
    window: {
      faces: [
        { face: "dial", slider: "follows" },
        { face: "balance", slider: "direction", left: "Falls apart", right: "Comes alive" },
        { face: "tiles", slider: "shownBy", icons: { mess: "🗑️", "light through the windows": "🪟", plants: "🪴", "what is on the walls": "🖼️", "the furniture moved": "🛋️", colors: "🎨" } },
      ],
      groups: [
        { label: "How the place changes", sliders: ["follows", "direction", "shownBy"] },
        { label: "Coming back", sliders: ["visits", "seenBy"] },
        { label: "The last look", sliders: ["lastLook"] },
      ],
      presets: [
        { label: "Falling apart", plain: "Every visit, more mess, until the flat is worse than ever.", set: { follows: 5, direction: "falls apart with them", shownBy: "mess", visits: 6, lastLook: "worse than ever", seenBy: "a visitor notices" } },
        { label: "Healing", plain: "The plants come back as they do, and the place ends better than it began.", set: { follows: 4, direction: "comes back to life with them", shownBy: "plants", visits: 5, lastLook: "better than it began", seenBy: "they notice it themselves" } },
        { label: "Moving out", plain: "The walls are stripped bit by bit, and the last look is an empty room.", set: { follows: 3, direction: "stays the same", shownBy: "what is on the walls", visits: 4, lastLook: "empty", seenBy: "only us" } },
      ],
    },
  });

  W.add("threshold", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "ladder", slider: "way" },
        { face: "tiles", slider: "kind", icons: { "a front door": "🚪", "a bedroom door": "🛏️", "a gate": "⛩️", "a window": "🪟", "a car door": "🚗", "a curtain or tent flap": "⛺" } },
      ],
      groups: [
        { label: "The crossing", sliders: ["weight", "kind", "way"] },
        { label: "At the line", sliders: ["pause", "beyond"] },
        { label: "The way back", sliders: ["behind"] },
      ],
      presets: [
        { label: "Leaving home", plain: "A long pause at the front door, then a step out and the door pulled shut.", set: { weight: 5, kind: "a front door", pause: 5, way: "step through", beyond: "all of it", behind: "they shut it" } },
        { label: "Can't go in", plain: "They stop at the bedroom door, see only a sliver, and step back.", set: { weight: 4, kind: "a bedroom door", pause: 8, way: "step back", beyond: "a sliver", behind: "left open" } },
        { label: "Into the dark", plain: "Through the gate into darkness, and it locks behind them.", set: { weight: 5, kind: "a gate", pause: 2, way: "step through", beyond: "nothing, just dark", behind: "it locks" } },
      ],
    },
  });

  W.add("waysOut", {
    window: {
      faces: [
        { face: "dial", slider: "trapped" },
        { face: "pad", x: "exits", y: "hiding", xLabel: "More ways out", yLabel: "More hiding places" },
        { face: "tiles", slider: "guard", icons: { nobody: "🙂", "a locked door": "🔒", "a person": "🧍", "water or fire": "🔥", "their own fear": "😨" } },
      ],
      groups: [
        { label: "Trapped or free", sliders: ["trapped", "exits", "blocked"] },
        { label: "What keeps them in", sliders: ["guard", "knows"] },
        { label: "Hiding", sliders: ["hiding"] },
      ],
      presets: [
        { label: "Locked in", plain: "Every way out blocked by locked doors, and nowhere to hide.", set: { trapped: 5, exits: 3, blocked: "all blocked", guard: "a locked door", hiding: 0, knows: "no" } },
        { label: "Hide and seek", plain: "Plenty of places to hide, one door guarded by a person.", set: { trapped: 3, exits: 2, blocked: "one blocked", guard: "a person", hiding: 6, knows: "they think so" } },
        { label: "Free to go, but not", plain: "Every door is open, but their own fear keeps them inside.", set: { trapped: 4, exits: 4, blocked: "all open", guard: "their own fear", hiding: 1, knows: "yes" } },
      ],
    },
  });

  W.add("mirrorInRoom", {
    window: {
      faces: [
        { face: "dial", slider: "presence" },
        { face: "tiles", slider: "shows", icons: { "just them": "🧍", "them and someone behind": "👥", "something we could not see": "👁️", "a different version of them": "🎭" } },
        { face: "ladder", slider: "state" },
      ],
      groups: [
        { label: "The mirror", sliders: ["presence", "kind", "state"] },
        { label: "What it shows", sliders: ["shows", "copies"] },
        { label: "Facing themselves", sliders: ["face"] },
      ],
      presets: [
        { label: "Someone behind", plain: "A bathroom mirror shows a figure behind them as they look up.", set: { presence: 4, kind: "a bathroom mirror", shows: "them and someone behind", state: "fogged", face: "glance", copies: 1 } },
        { label: "Cracked self", plain: "They stare into a cracked mirror at a different version of themselves.", set: { presence: 5, kind: "a wall mirror", shows: "a different version of them", state: "cracked", face: "stare", copies: 2 } },
        { label: "Hall of mirrors", plain: "A dozen reflections, and no way to tell which one is real.", set: { presence: 5, kind: "a wall mirror", shows: "something we could not see", state: "clean", face: "talk to it", copies: 12 } },
      ],
    },
  });

  W.add("homeBase", {
    window: {
      faces: [
        { face: "dial", slider: "pull" },
        { face: "tiles", slider: "kind", icons: { "a home": "🏠", "a cafe or bar": "☕", "a workplace": "🏢", "a car": "🚗", "a spot outdoors": "🌳", "a hideout": "🏚️" } },
        { face: "ladder", slider: "safety" },
      ],
      groups: [
        { label: "The place", sliders: ["pull", "kind", "safety"] },
        { label: "Coming back", sliders: ["returns", "firstSeen"] },
        { label: "At the end", sliders: ["lastVisit"] },
      ],
      presets: [
        { label: "The diner booth", plain: "Every big talk happens in the same diner, the safest place they know, until it is lost.", set: { pull: 5, returns: 12, kind: "a cafe or bar", safety: "the safest place in the world", firstSeen: "the first scene", lastVisit: "it is lost" } },
        { label: "The family kitchen", plain: "The kitchen table we come back to, and come home to at the end.", set: { pull: 4, returns: 8, kind: "a home", safety: "safe", firstSeen: "the first scene", lastVisit: "they come home" } },
        { label: "The gang's hideout", plain: "A shaky hideout found halfway, left behind at the end.", set: { pull: 3, returns: 5, kind: "a hideout", safety: "uneasy", firstSeen: "halfway", lastVisit: "it is left behind" } },
      ],
    },
  });

  W.add("oneLocation", {
    window: {
      faces: [
        { face: "dial", slider: "share" },
        { face: "ladder", slider: "size" },
        { face: "pad", x: "leaving", y: "squeeze", xLabel: "More tries to leave", yLabel: "Squeezes harder" },
      ],
      groups: [
        { label: "The one place", sliders: ["share", "size", "rooms"] },
        { label: "Getting out", sliders: ["leaving", "outside"] },
        { label: "The pressure", sliders: ["squeeze"] },
      ],
      presets: [
        { label: "Stuck in a lift", plain: "The whole film in one small room, and we only see outside at the very end.", set: { share: 100, size: "one small room", rooms: 1, leaving: 4, outside: "at the very end", squeeze: 5 } },
        { label: "One night in the house", plain: "A whole house over one night, with memories of the world outside.", set: { share: 90, size: "a building", rooms: 6, leaving: 2, outside: "in memories", squeeze: 3 } },
        { label: "On the train", plain: "One train, many carriages, the world rushing past the windows.", set: { share: 80, size: "a ship or train", rooms: 5, leaving: 1, outside: "through windows", squeeze: 2 } },
      ],
    },
  });

  W.add("heightGap", {
    window: {
      faces: [
        { face: "dial", slider: "gap" },
        { face: "balance", slider: "higher", left: "Losing one higher", right: "Winning one higher" },
        { face: "tiles", slider: "how", icons: { "one sits, one stands": "🪑", stairs: "🪜", "a desk or stage": "🎭", "one kneels": "🧎", "one is much taller": "📏", "one is on a horse or car": "🐎" } },
      ],
      groups: [
        { label: "The gap", sliders: ["gap", "meters", "how"] },
        { label: "Who has the power", sliders: ["higher", "flips"] },
        { label: "Where we look from", sliders: ["camera"] },
      ],
      presets: [
        { label: "The boss's desk", plain: "The boss sits up high behind a desk, the worker standing small below.", set: { gap: 3, higher: "the one who is winning", how: "a desk or stage", meters: 0.6, flips: "never", camera: "the lower one's" } },
        { label: "Power flips", plain: "One sits, one stands, and then the sitting one rises.", set: { gap: 3, higher: "the one who is winning", how: "one sits, one stands", meters: 0.5, flips: "once", camera: "in between" } },
        { label: "Kneeling proposal", plain: "One kneels, looking up; the camera takes the higher one's view.", set: { gap: 4, higher: "neither", how: "one kneels", meters: 0.8, flips: "never", camera: "the higher one's" } },
      ],
    },
  });

  W.add("nearestCamera", {
    window: {
      faces: [
        { face: "dial", slider: "lead" },
        { face: "tiles", slider: "who", icons: { "a stranger": "👤", "the one listening": "👂", "the one talking": "🗣️", "the main character": "⭐" } },
        { face: "pad", x: "depthGap", y: "lead", xLabel: "Further apart", yLabel: "Near one bigger" },
      ],
      groups: [
        { label: "The near one", sliders: ["lead", "who", "facing"] },
        { label: "Near and far", sliders: ["depthGap", "hides"] },
        { label: "Changing places", sliders: ["swaps"] },
      ],
      presets: [
        { label: "Silent sister up front", plain: "The listener close to us, back turned, while the parents argue small behind.", set: { lead: 4, who: "the one listening", depthGap: 6, facing: "away from us", hides: "a little", swaps: 0 } },
        { label: "Stranger in the way", plain: "A stranger in front half hides the people we care about.", set: { lead: 3, who: "a stranger", depthGap: 4, facing: "side on", hides: "half hidden", swaps: 0 } },
        { label: "Trading places", plain: "Two people take turns stepping close to us as the power moves.", set: { lead: 3, who: "the one talking", depthGap: 3, facing: "toward us", hides: "no", swaps: 3 } },
      ],
    },
  });

  W.add("dividingLine", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "tiles", slider: "what", icons: { "a door frame": "🚪", "a pillar or pole": "🏛️", "a wall edge": "🧱", "a table": "🪵", "a shadow": "🌑", "a window frame": "🪟", "a fence": "🚧" } },
        { face: "ladder", slider: "crossed" },
      ],
      groups: [
        { label: "The line", sliders: ["strength", "what", "where"] },
        { label: "The two sides", sliders: ["sides", "when"] },
        { label: "Crossing it", sliders: ["crossed"] },
      ],
      presets: [
        { label: "Divorce in the kitchen", plain: "The door frame splits them dead center, and one finally steps across.", set: { strength: 5, what: "a door frame", where: "dead center", crossed: "steps across", when: "the whole scene", sides: "each alone" } },
        { label: "The secret comes out", plain: "A shadow falls between them the moment the secret is said.", set: { strength: 3, what: "a shadow", where: "near the middle", crossed: "never", when: "when a secret comes out", sides: "each alone" } },
        { label: "Through the fence", plain: "A fence between two kids who reach across it.", set: { strength: 4, what: "a fence", where: "near the middle", crossed: "reaches across", when: "the whole scene", sides: "each alone" } },
      ],
    },
  });

  W.add("facingAway", {
    window: {
      faces: [
        { face: "ladder", slider: "turn" },
        { face: "tiles", slider: "why", icons: { "hiding tears": "😢", "hiding a lie": "🤥", "ignoring them": "🙄", shame: "😳", thinking: "🤔" } },
        { face: "tiles", slider: "back", icons: { "never turns": "🚫", "turns slowly": "🐢", "turns on a line": "💬", "spins round": "🌀" } },
      ],
      groups: [
        { label: "The turn", sliders: ["turn", "who", "why"] },
        { label: "The wait", sliders: ["hold", "others"] },
        { label: "Turning back", sliders: ["back"] },
      ],
      presets: [
        { label: "Back-turned confession", plain: "She confesses with her back to us, and turns on the last word.", set: { turn: "back to us", who: "the one speaking", hold: 25, back: "turns on a line", why: "shame", others: "the person they face" } },
        { label: "Hiding tears", plain: "He turns side on so no one sees him cry, and never turns back.", set: { turn: "side on", who: "the one listening", hold: 8, back: "never turns", why: "hiding tears", others: "no one" } },
        { label: "The cold shoulder", plain: "Both turn three-quarters away, ignoring each other.", set: { turn: "three-quarters", who: "both", hold: 12, back: "turns slowly", why: "ignoring them", others: "no one" } },
      ],
    },
  });

  W.add("apartFromGroup", {
    window: {
      faces: [
        { face: "dial", slider: "apart" },
        { face: "tiles", slider: "wants", icons: { "wants to join": "🥺", "doesn't care": "😐", "chose to leave": "🚶", "was pushed out": "🫸" } },
        { face: "tiles", slider: "joins", icons: { never: "🚫", almost: "🤏", "at the end": "🤝", "the group comes to them": "🫂" } },
      ],
      groups: [
        { label: "Standing apart", sliders: ["apart", "where", "wants"] },
        { label: "The group", sliders: ["groupSize", "noticed"] },
        { label: "Closing the gap", sliders: ["joins"] },
      ],
      presets: [
        { label: "New kid", plain: "One step outside the team photo, until the captain pulls her in.", set: { apart: 2, where: "at the edge of the frame", groupSize: 12, wants: "wants to join", joins: "the group comes to them", noticed: "one glances" } },
        { label: "Pushed out", plain: "Far across an empty space from a group that all look at him.", set: { apart: 5, where: "across a gap", groupSize: 8, wants: "was pushed out", joins: "never", noticed: "they all look" } },
        { label: "Lone wolf", plain: "Behind the group by choice, and joins only at the very end.", set: { apart: 3, where: "behind the group", groupSize: 5, wants: "chose to leave", joins: "at the end", noticed: "no" } },
      ],
    },
  });

  W.add("splashPage", {
    window: {
      faces: [
        { face: "ladder", slider: "size" },
        { face: "tiles", slider: "when", icons: { "the opening": "📖", "a reveal": "🎭", "the biggest action": "💥", "the ending": "🌅" } },
        { face: "pad", x: "leadIn", y: "detail", xLabel: "More small panels first", yLabel: "More to look at" },
      ],
      groups: [
        { label: "The big picture", sliders: ["size", "when", "detail"] },
        { label: "Around it", sliders: ["leadIn", "words"] },
        { label: "In the whole book", sliders: ["perBook"] },
      ],
      presets: [
        { label: "City at dawn", plain: "Nine tiny dark panels, a page turn, then a two-page spread with no words.", set: { size: "two pages across", when: "a reveal", words: 0, leadIn: 9, detail: 5, perBook: 2 } },
        { label: "Opening page", plain: "The book opens on a full-page picture of the world with a short caption.", set: { size: "a full page", when: "the opening", words: 12, leadIn: 0, detail: 4, perBook: 4 } },
        { label: "The big punch", plain: "Half a page for the biggest hit, with one sound word.", set: { size: "half a page", when: "the biggest action", words: 1, leadIn: 4, detail: 2, perBook: 6 } },
      ],
    },
  });

  W.add("panelJump", {
    window: {
      faces: [
        { face: "ladder", slider: "leap" },
        { face: "dial", slider: "fillIn" },
        { face: "tiles", slider: "glue", icons: { nothing: "⬜", "a sound across them": "🔊", "a line of words": "💬", "a shape that matches": "⭕" } },
      ],
      groups: [
        { label: "The jump", sliders: ["leap", "fillIn", "angle"] },
        { label: "Across the page", sliders: ["mix", "glue"] },
      ],
      presets: [
        { label: "Slow moment", plain: "Tiny jumps from the same angle, so a single second stretches across the page.", set: { leap: "a blink", fillIn: 0, angle: "same angle", mix: 0, glue: "nothing" } },
        { label: "Action page", plain: "Each panel is the next move, from a new angle, tied together by a sound.", set: { leap: "the next move", fillIn: 2, angle: "new angle", mix: 2, glue: "a sound across them" } },
        { label: "Leap in time", plain: "A jump to another place and time, joined by a matching shape.", set: { leap: "another place or time", fillIn: 5, angle: "new angle", mix: 4, glue: "a shape that matches" } },
      ],
    },
  });

  W.add("silentPanel", {
    window: {
      faces: [
        { face: "ladder", slider: "silence" },
        { face: "tiles", slider: "shows", icons: { "a face": "🙂", "a place": "🏞️", "an empty room": "🚪", "a small object": "🔑", "the same shot again": "🔁" } },
        { face: "dial", slider: "count" },
      ],
      groups: [
        { label: "The silence", sliders: ["silence", "count", "size"] },
        { label: "What we see", sliders: ["shows", "placed"] },
        { label: "Breaking it", sliders: ["broken"] },
      ],
      presets: [
        { label: "After the fight", plain: "Three quiet panels of a face after a shouting match, then a single line.", set: { silence: "no words at all", count: 3, shows: "a face", size: "normal", placed: "after a shout", broken: "a line" } },
        { label: "Before the storm", plain: "A wide quiet panel of the place, then a page turn to the big moment.", set: { silence: "no words at all", count: 1, shows: "a place", size: "full width", placed: "before a big moment", broken: "a page turn" } },
        { label: "Silent ending", plain: "A whole page of no words ending in an empty room.", set: { silence: "a whole page of no words", count: 6, shows: "an empty room", size: "wide", placed: "at the end", broken: "nothing" } },
      ],
    },
  });

  W.add("repeatedPanel", {
    window: {
      faces: [
        { face: "dial", slider: "repeats" },
        { face: "ladder", slider: "changes" },
        { face: "tiles", slider: "purpose", icons: { "a pause for a joke": "😄", "time passing": "⏳", "awkward silence": "😬", tension: "😰", "a mood": "🌫️" } },
      ],
      groups: [
        { label: "The repeat", sliders: ["repeats", "what", "changes"] },
        { label: "What for", sliders: ["purpose", "shape"] },
        { label: "The last panel", sliders: ["ending"] },
      ],
      presets: [
        { label: "Waiting for the call", plain: "Four identical panels of a phone, and in the fifth it lights up.", set: { repeats: 5, changes: "nothing", what: "a phone", purpose: "tension", ending: "a big change breaks it", shape: "all the same" } },
        { label: "Awkward stare", plain: "Two people stare at each other, panel after panel, one blink changing.", set: { repeats: 4, changes: "one tiny thing", what: "two people", purpose: "awkward silence", ending: "a small change lands", shape: "all the same" } },
        { label: "Clock creeping", plain: "The same clock, smaller each time, as the night drags.", set: { repeats: 6, changes: "a few things", what: "a clock", purpose: "time passing", ending: "just stops", shape: "shrinking" } },
      ],
    },
  });

  W.add("readingPath", {
    window: {
      faces: [
        { face: "dial", slider: "clarity" },
        { face: "tiles", slider: "order", icons: { "left to right, top to bottom": "➡️", "a zigzag": "↩️", "a spiral": "🌀", "right to left, like Japanese comics": "⬅️", "any order": "🔀" } },
        { face: "pad", x: "balloons", y: "clarity", xLabel: "More balloons", yLabel: "Clearer path" },
      ],
      groups: [
        { label: "The path", sliders: ["clarity", "order"] },
        { label: "The balloons", sliders: ["balloons", "firstSpeaker", "tails", "cover"] },
      ],
      presets: [
        { label: "Easy read", plain: "A clean left-to-right page, first speaker always first, short tails.", set: { clarity: 5, order: "left to right, top to bottom", firstSpeaker: "always", tails: "short", balloons: 6, cover: "never" } },
        { label: "Manga page", plain: "Read right to left, with long pointing tails.", set: { clarity: 4, order: "right to left, like Japanese comics", firstSpeaker: "always", tails: "long and pointing", balloons: 8, cover: "a little" } },
        { label: "Dream page", plain: "A spiral of balloons with no tails, read in any order.", set: { clarity: 1, order: "a spiral", firstSpeaker: "no", tails: "none", balloons: 10, cover: "a lot" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
