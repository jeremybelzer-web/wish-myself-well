/* win for the color, focus, titles and canvas curiosities in data/db-depth-frame.js (depth thread, frame). Each one
   already has six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- color ---------- */

  W.add("colorClash", {
    window: {
      faces: [
        { face: "dial", slider: "clash" },
        { face: "tiles", slider: "pair", icons: { "red and green": "🍉", "orange and blue": "🍊", "purple and yellow": "🍆", "pink and green": "🌸", "neon against grey": "💡" } },
        { face: "ladder", slider: "feel" },
      ],
      groups: [
        { label: "The colors", sliders: ["clash", "pair", "share"] },
        { label: "Where and when", sliders: ["where", "when"] },
        { label: "The feeling", sliders: ["feel"] },
      ],
      presets: [
        { label: "Green in the red kitchen", plain: "The angry daughter in bright green inside her mother's red kitchen.", set: { clash: 4, pair: "red and green", where: "in the clothes", when: "as the fight grows", share: 60, feel: "angry" } },
        { label: "Candy party", plain: "Pink and green balloons everywhere at a party that is a little too cheerful.", set: { clash: 2, pair: "pink and green", where: "everywhere", when: "the whole scene", share: 80, feel: "playful" } },
        { label: "Sick motel", plain: "A neon sign buzzes over a grey motel room while he waits for a call.", set: { clash: 5, pair: "neon against grey", where: "in the light", when: "only in one place", share: 30, feel: "sick" } },
      ],
    },
  });

  W.add("savedColor", {
    window: {
      faces: [
        { face: "dial", slider: "rarity" },
        { face: "tiles", slider: "hue", icons: { gold: "🟨", red: "🟥", blue: "🟦", green: "🟩", white: "⬜", pink: "🩷" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "The color", sliders: ["rarity", "hue", "size"] },
        { label: "The moments", sliders: ["times", "moments"] },
        { label: "The audience", sliders: ["noticed"] },
      ],
      presets: [
        { label: "The gold scarf", plain: "Gold appears only when they meet, when they fight, and when she leaves.", set: { rarity: 5, hue: "gold", times: 3, moments: "a first meeting", size: "an object", noticed: "by the third time" } },
        { label: "Red for every loss", plain: "A red light fills the room each time someone is lost.", set: { rarity: 4, hue: "red", times: 4, moments: "a loss", size: "a light", noticed: "right away" } },
        { label: "One blue ending", plain: "The whole film has no blue until the last shot of the sea.", set: { rarity: 5, hue: "blue", times: 1, moments: "the ending", size: "the whole frame", noticed: "only in the gut" } },
      ],
    },
  });

  W.add("splitColorLight", {
    window: {
      faces: [
        { face: "dial", slider: "split" },
        { face: "tiles", slider: "from", icons: { "a neon sign": "🪧", "a TV and a lamp": "📺", "police lights": "🚨", "a window and a fire": "🔥", "club lights": "🪩" } },
        { face: "ladder", slider: "edge" },
      ],
      groups: [
        { label: "The two colors", sliders: ["split", "pair", "from"] },
        { label: "On the face", sliders: ["edge", "moves"] },
        { label: "What it says", sliders: ["means"] },
      ],
      presets: [
        { label: "Cop car decision", plain: "Red and blue flashing on his face while he decides whether to lie.", set: { split: 5, pair: "red and blue", from: "police lights", edge: "hard line", moves: "flashing", means: "two pulls on them" } },
        { label: "TV at night", plain: "Cold TV light on one side, a warm lamp on the other, as she waits up.", set: { split: 2, pair: "warm and cool", from: "a TV and a lamp", edge: "blended", moves: "slow shift", means: "danger and safety" } },
        { label: "Neon bar", plain: "Pink and teal from a bar sign split his face down the middle.", set: { split: 4, pair: "pink and teal", from: "a neon sign", edge: "soft line", moves: "still", means: "a torn mind" } },
      ],
    },
  });

  W.add("matchesTheRoom", {
    window: {
      faces: [
        { face: "dial", slider: "match" },
        { face: "tiles", slider: "why", icons: { "they belong here": "🏠", "they are hiding": "🫥", "the room owns them": "🪑", "a joke": "😄" } },
        { face: "ladder", slider: "shown" },
      ],
      groups: [
        { label: "The match", sliders: ["match", "color", "why"] },
        { label: "Around them", sliders: ["others", "shown"] },
        { label: "Breaking out", sliders: ["breaks"] },
      ],
      presets: [
        { label: "Beige wife", plain: "She wears the same beige as the wall until the day she leaves in a red coat.", set: { match: 5, why: "the room owns them", color: "beige", others: "others stand out", breaks: "when they leave", shown: "wide, so they vanish" } },
        { label: "Flowered sofa", plain: "Grandpa in a flowered shirt on a flowered sofa, a quiet joke.", set: { match: 4, why: "a joke", color: "flowers", others: "no one else there", breaks: "never", shown: "close, so we see the match" } },
        { label: "The grey office", plain: "Everyone in grey in a grey office, until she speaks up in the meeting.", set: { match: 3, why: "they belong here", color: "grey", others: "everyone matches too", breaks: "when they speak up", shown: "medium" } },
      ],
    },
  });

  /* ---------- focus ---------- */

  W.add("stillInTheRush", {
    window: {
      faces: [
        { face: "dial", slider: "still" },
        { face: "tiles", slider: "rushKind", icons: { "a crowd": "👥", traffic: "🚗", "a party": "🎉", "a storm": "🌪️", "a fight": "🥊" } },
        { face: "ladder", slider: "blur" },
      ],
      groups: [
        { label: "The still one", sliders: ["still", "what", "lasts"] },
        { label: "The rush", sliders: ["rush", "rushKind", "blur"] },
      ],
      presets: [
        { label: "Station", plain: "Commuters stream past in streaks while she stands still under the board.", set: { still: 5, what: "a person", rush: 5, rushKind: "a crowd", blur: "streaked by speed", lasts: 8 } },
        { label: "The cat in the storm", plain: "Rain and wind whip everything, and the cat on the porch does not move.", set: { still: 4, what: "an animal", rush: 4, rushKind: "a storm", blur: "a little smeared", lasts: 4 } },
        { label: "The hand at the party", plain: "Dancers all around, and one hand resting on a glass, not moving.", set: { still: 3, what: "a hand", rush: 3, rushKind: "a party", blur: "sharp", lasts: 3 } },
      ],
    },
  });

  W.add("oneFaceInCrowd", {
    window: {
      faces: [
        { face: "dial", slider: "pick" },
        { face: "tiles", slider: "by", icons: { "sharp focus": "🔍", light: "💡", color: "🎨", "looking at the camera": "👁️", "not moving": "🧍" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "The face", sliders: ["pick", "by", "who"] },
        { label: "The crowd", sliders: ["size", "found"] },
        { label: "The look", sliders: ["look"] },
      ],
      presets: [
        { label: "Tenth row", plain: "At the concert every face is soft but one, looking straight back at him.", set: { pick: 5, by: "sharp focus", size: "a stadium", who: "the one they love", found: "right away", look: "looking back" } },
        { label: "The hunt", plain: "The detective scans a busy street until one man in a red hat stops moving.", set: { pick: 3, by: "not moving", size: "a street", who: "the one they hunt", found: "after a search", look: "looking away" } },
        { label: "Lost again", plain: "She sees her old self in a room full of strangers, then loses her.", set: { pick: 2, by: "light", size: "a room full", who: "themselves, years ago", found: "lost again", look: "not looking" } },
      ],
    },
  });

  W.add("misdirectedEye", {
    window: {
      faces: [
        { face: "dial", slider: "lure" },
        { face: "tiles", slider: "bait", icons: { "a loud sound": "🔊", "a bright light": "💡", "a face talking": "🗣️", "something moving": "🏃", "a joke": "😂" } },
        { face: "ladder", slider: "payoff" },
      ],
      groups: [
        { label: "The lure", sliders: ["lure", "bait"] },
        { label: "The real thing", sliders: ["real", "goal"] },
        { label: "The payoff", sliders: ["payoff", "fair"] },
      ],
      presets: [
        { label: "The poisoned toast", plain: "The host shouts a toast in the middle while a hand drops a pill in a glass at the edge.", set: { lure: 4, bait: "a face talking", real: "in a corner", payoff: "on a second watch", goal: "a clue", fair: "fair if you look" } },
        { label: "The jump scare", plain: "A kettle screams on the left, and the figure is already standing on the right.", set: { lure: 5, bait: "a loud sound", real: "in the shadow", payoff: "a moment later", goal: "a scare", fair: "fair and plain" } },
        { label: "The twist", plain: "We watch the funny uncle all film; the killer was in every scene behind him.", set: { lure: 3, bait: "a joke", real: "behind", payoff: "never", goal: "a twist", fair: "unfair" } },
      ],
    },
  });

  W.add("edgeOfFrame", {
    window: {
      faces: [
        { face: "dial", slider: "edge" },
        { face: "tiles", slider: "side", icons: { left: "⬅️", right: "➡️", top: "⬆️", bottom: "⬇️" } },
        { face: "ladder", slider: "cut" },
      ],
      groups: [
        { label: "At the edge", sliders: ["edge", "what", "side", "cut"] },
        { label: "The middle", sliders: ["center"] },
        { label: "Why", sliders: ["why"] },
      ],
      presets: [
        { label: "The patient", plain: "The therapist in the middle, the patient half cut off at the right edge.", set: { edge: 5, what: "a face", side: "right", center: "the wrong person", cut: "half out", why: "to feel cut off" } },
        { label: "The door left open", plain: "An empty hall fills the frame; a door at the left edge opens a crack.", set: { edge: 4, what: "a door", side: "left", center: "empty", cut: "part cut off", why: "to unsettle" } },
        { label: "Under the table", plain: "A hand at the bottom edge passes a note while the talk goes on above.", set: { edge: 3, what: "a hand", side: "bottom", center: "a wall", cut: "just a sliver", why: "to hide it" } },
      ],
    },
  });

  /* ---------- titles ---------- */

  W.add("wordsInTheWorld", {
    window: {
      faces: [
        { face: "dial", slider: "fit" },
        { face: "tiles", slider: "on", icons: { "a wall": "🧱", "the floor": "🟫", "the sky": "☁️", "a window": "🪟", "a person's body": "🧍" } },
        { face: "ladder", slider: "moves" },
      ],
      groups: [
        { label: "The words", sliders: ["fit", "what", "style"] },
        { label: "Where they sit", sliders: ["on", "moves"] },
        { label: "Time", sliders: ["stays"] },
      ],
      presets: [
        { label: "Town on the road", plain: "The town's name is painted across the road and the bus drives over it.", set: { fit: 5, on: "the floor", what: "a place name", moves: "people walk through them", style: "painted", stays: 4 } },
        { label: "Names in the clouds", plain: "The actors' names drift in the sky as the plane flies through them.", set: { fit: 3, on: "the sky", what: "the names", moves: "move with the camera", style: "clean type", stays: 6 } },
        { label: "Chalk warning", plain: "A warning appears in chalk on the wall just as she walks by.", set: { fit: 4, on: "a wall", what: "a warning", moves: "fixed in place", style: "chalk", stays: 2 } },
      ],
    },
  });

  W.add("playfulSubtitles", {
    window: {
      faces: [
        { face: "dial", slider: "play" },
        { face: "tiles", slider: "trick", icons: { "placed by the speaker": "📍", "they change size": "🔠", "they say more than the words": "💭", "they lie": "🤥", "someone reads them": "👓" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "The trick", sliders: ["play", "trick", "count"] },
        { label: "Whose words", sliders: ["language"] },
        { label: "The look", sliders: ["size", "color"] },
      ],
      presets: [
        { label: "The honest dog", plain: "The dog's subtitles say what everyone at the table is thinking.", set: { play: 4, trick: "they say more than the words", language: "an animal", size: "normal", color: "white", count: 5 } },
        { label: "Shouted alien", plain: "The alien's words grow huge when it shouts and tiny when it whispers.", set: { play: 3, trick: "they change size", language: "a made-up language", size: "huge", color: "the speaker's color", count: 8 } },
        { label: "Reading along", plain: "A character turns and reads the subtitle out loud, confused.", set: { play: 5, trick: "someone reads them", language: "a real one", size: "big", color: "a mood color", count: 1 } },
      ],
    },
  });

  W.add("openingCredits", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "tiles", slider: "over", icons: { black: "⬛", "the first scene": "🎬", "their own made images": "🎨", "one long shot": "🎞️" } },
        { face: "ladder", slider: "hint" },
      ],
      groups: [
        { label: "The credits", sliders: ["weight", "over", "length"] },
        { label: "What they hold", sliders: ["names", "hint"] },
        { label: "Sound", sliders: ["music"] },
      ],
      presets: [
        { label: "The dollhouse", plain: "Names over close-ups of a dollhouse being built, ending on a figure in the attic.", set: { weight: 5, over: "their own made images", length: 150, names: "everyone", hint: "the ending, hidden", music: "quiet" } },
        { label: "Just white on black", plain: "A few names in white on black, no music, then straight into the story.", set: { weight: 1, over: "black", length: 20, names: "a few", hint: "nothing", music: "silence" } },
        { label: "Drive in", plain: "Names over one long shot of a car crossing the desert, a song blasting.", set: { weight: 3, over: "one long shot", length: 90, names: "the main ones", hint: "the mood", music: "loud" } },
      ],
    },
  });

  W.add("thoughtsAsText", {
    window: {
      faces: [
        { face: "dial", slider: "show" },
        { face: "tiles", slider: "form", icons: { "a list": "📝", "labels on things": "🏷️", "a box to tick": "☑️", "numbers and scores": "🔢", "a word in the air": "💬" } },
        { face: "ladder", slider: "honest" },
      ],
      groups: [
        { label: "The thoughts", sliders: ["show", "form", "near"] },
        { label: "How they look", sliders: ["style"] },
        { label: "Can we trust them", sliders: ["honest", "changes"] },
      ],
      presets: [
        { label: "Party plan", plain: "Each guest gets a label of what he will say, all crossed out when she walks in.", set: { show: 4, form: "labels on things", near: "on the things", style: "handwritten", honest: "true", changes: "gets crossed out" } },
        { label: "Fight scores", plain: "Game-style numbers pop up over each punch she plans.", set: { show: 3, form: "numbers and scores", near: "floating", style: "a game screen", honest: "half true", changes: "changes as they think" } },
        { label: "The lying list", plain: "His list says 'calm' and 'over her' while he stares at her photo.", set: { show: 2, form: "a list", near: "by their head", style: "neat type", honest: "it lies", changes: "stays" } },
      ],
    },
  });

  /* ---------- canvas ---------- */

  W.add("splitScreen", {
    window: {
      faces: [
        { face: "dial", slider: "split" },
        { face: "tiles", slider: "layout", icons: { "side by side": "◫", "top and bottom": "⬒", "a grid": "▦", "boxes that come and go": "🔲" } },
        { face: "ladder", slider: "line" },
      ],
      groups: [
        { label: "The split", sliders: ["split", "panes", "layout", "line"] },
        { label: "What it shows", sliders: ["shows"] },
        { label: "The end", sliders: ["joins"] },
      ],
      presets: [
        { label: "Blind date", plain: "Two strangers get ready side by side, until they meet and it becomes one picture.", set: { split: 4, panes: 2, shows: "two places at once", line: "thin gap", layout: "side by side", joins: "they meet in one frame" } },
        { label: "The phone call", plain: "Both sides of a breakup call, top and bottom, and one half goes black.", set: { split: 3, panes: 2, shows: "two sides of a call", line: "hard line", layout: "top and bottom", joins: "one goes black" } },
        { label: "Six mornings", plain: "Six people wake up in a grid, each in a different city.", set: { split: 5, panes: 6, shows: "many lives", line: "hard line", layout: "a grid", joins: "never" } },
      ],
    },
  });

  W.add("pictureSize", {
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "tiles", slider: "way", icons: { shrinks: "↘️", grows: "↗️", "shrinks then grows": "↕️" } },
        { face: "ladder", slider: "speed" },
      ],
      groups: [
        { label: "The size", sliders: ["size", "way", "shape"] },
        { label: "How it changes", sliders: ["speed", "around"] },
        { label: "What it means", sliders: ["follows"] },
      ],
      presets: [
        { label: "Giving up", plain: "The picture shrinks a little each time he gives up a dream.", set: { size: 40, way: "shrinks", shape: "keeps its shape", speed: "over the film", around: "black", follows: "their world closing in" } },
        { label: "Out of the house", plain: "The square picture stretches wide the moment she drives away.", set: { size: 100, way: "grows", shape: "gets wide", speed: "in seconds", around: "a blur", follows: "freedom" } },
        { label: "Old photo", plain: "A memory plays small, in a frame, then grows to fill the screen.", set: { size: 60, way: "shrinks then grows", shape: "gets square", speed: "over a scene", around: "a frame", follows: "a memory" } },
      ],
    },
  });

  W.add("povMask", {
    window: {
      faces: [
        { face: "dial", slider: "cover" },
        { face: "tiles", slider: "shape", icons: { binoculars: "🔭", "a keyhole": "🗝️", "a telescope": "🔭", "a gun sight": "🎯", "a camera finder": "📷", "a peephole": "🚪" } },
        { face: "ladder", slider: "caught" },
      ],
      groups: [
        { label: "The shape", sliders: ["cover", "shape", "edge"] },
        { label: "The watcher", sliders: ["who", "wobble"] },
        { label: "Caught", sliders: ["caught"] },
      ],
      presets: [
        { label: "Through the keyhole", plain: "The neighbor's room through a keyhole, until the neighbor turns and stares into it.", set: { cover: 4, shape: "a keyhole", who: "a child", edge: "sharp", wobble: 1, caught: "they look right back" } },
        { label: "The stakeout", plain: "Binoculars from the car, steady, on a door across the street.", set: { cover: 3, shape: "binoculars", who: "a spy", edge: "soft", wobble: 1, caught: "never" } },
        { label: "The sniper", plain: "A shaking gun sight on the hero, who seems to sense it.", set: { cover: 5, shape: "a gun sight", who: "the villain", edge: "sharp", wobble: 4, caught: "they sense it" } },
      ],
    },
  });

  W.add("stillsInMotion", {
    window: {
      faces: [
        { face: "dial", slider: "count" },
        { face: "tiles", slider: "kind", icons: { "family photos": "👪", "news photos": "📰", "camera flashes": "📸", "a frozen story": "🧊" } },
        { face: "ladder", slider: "back" },
      ],
      groups: [
        { label: "The stills", sliders: ["count", "each", "kind"] },
        { label: "Over them", sliders: ["sound", "move"] },
        { label: "Moving again", sliders: ["back"] },
      ],
      presets: [
        { label: "Twenty years", plain: "Twelve family photos tell their marriage, and the last one starts to move.", set: { count: 12, each: 1.4, sound: "music", kind: "family photos", move: "slow push in", back: "at the end" } },
        { label: "Flash, flash", plain: "Camera flashes freeze the crash in five quick stills while the sound plays on.", set: { count: 5, each: 0.4, sound: "the sound keeps playing", kind: "camera flashes", move: "fixed", back: "in one blink" } },
        { label: "The whole story", plain: "The whole short film is still frames under a quiet voice.", set: { count: 40, each: 3, sound: "a voice over them", kind: "a frozen story", move: "slow drift", back: "never" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
