/* win for the light, effects, layers, editing and structure, and emotional road curiosities in data/db-depth-fx.js
   (depth thread, fx). Each one already has six graded settings of its own, so these windows add faces, groups
   and presets only. */
(function (W) {
  /* ---------- light ---------- */

  W.add("flickerWarning", {
    window: {
      faces: [
        { face: "dial", slider: "flicker" },
        { face: "tiles", slider: "source", icons: { "a ceiling bulb": "💡", "a strip light": "➖", "a candle": "🕯️", "a street lamp": "🏮", "a screen": "📺", "every light in the house": "🏠" } },
        { face: "tiles", slider: "warns", icons: { "nothing, just old wiring": "🔌", "someone is coming": "🚶", "the power is failing": "⚡", "something not human": "👁️", "their mind is slipping": "🌀" } },
      ],
      groups: [
        { label: "The flicker", sliders: ["flicker", "rhythm", "dark"] },
        { label: "The light", sliders: ["source"] },
        { label: "What it means", sliders: ["warns", "changed"] },
      ],
      presets: [
        { label: "Something in the hallway", plain: "A strip light stutters, and each time it comes back something has moved.", set: { flicker: 4, source: "a strip light", rhythm: "random stutters", warns: "something not human", dark: 1, changed: "something moved" } },
        { label: "Storm outage", plain: "Every light in the house pulses, then one long blackout.", set: { flicker: 3, source: "every light in the house", rhythm: "one long blackout", warns: "the power is failing", dark: 3, changed: "someone is there" } },
        { label: "Losing her grip", plain: "Only her desk screen flickers, and nobody else sees it.", set: { flicker: 2, source: "a screen", rhythm: "fast buzzing", warns: "their mind is slipping", dark: 0.5, changed: "nothing" } },
      ],
    },
  });

  W.add("shadowTells", {
    window: {
      faces: [
        { face: "dial", slider: "tells" },
        { face: "ladder", slider: "size" },
        { face: "tiles", slider: "shows", icons: { "someone coming": "🚶", "a fight": "🥊", "a kiss": "💋", "a monster": "👹", "who they really are": "🎭" } },
      ],
      groups: [
        { label: "The shadow", sliders: ["tells", "size", "sharp"] },
        { label: "Where and what", sliders: ["where", "shows"] },
        { label: "The real thing", sliders: ["meets"] },
      ],
      presets: [
        { label: "Climbing the stairs", plain: "A huge, sharp shadow climbs the stairs before we ever see who.", set: { tells: 5, size: "huge, towering", where: "up the stairs", shows: "someone coming", sharp: "razor sharp", meets: "much later" } },
        { label: "Fight on the wall", plain: "The whole fight plays as soft shadows on the kitchen wall.", set: { tells: 4, size: "bigger", where: "on a wall", shows: "a fight", sharp: "soft", meets: "a moment later" } },
        { label: "Just the cat", plain: "A monster's shadow on the curtain, and then a small cat.", set: { tells: 3, size: "huge, towering", where: "on a curtain", shows: "a monster", sharp: "clear", meets: "yes, and it is smaller" } },
      ],
    },
  });

  W.add("silhouetteShot", {
    window: {
      faces: [
        { face: "dial", slider: "dark" },
        { face: "tiles", slider: "behind", icons: { "a window": "🪟", "an open door": "🚪", "a sunset": "🌅", "car headlights": "🚗", "a fire": "🔥" } },
        { face: "ladder", slider: "faceShown" },
      ],
      groups: [
        { label: "The outline", sliders: ["dark", "behind", "faceShown"] },
        { label: "The shape", sliders: ["pose"] },
        { label: "Who it is", sliders: ["who", "stepsIn"] },
      ],
      presets: [
        { label: "Stranger in the door", plain: "A black shape in a bright doorway, nobody knows who, until they speak.", set: { dark: 5, behind: "an open door", faceShown: "none", pose: "standing still", who: "no idea", stepsIn: "when they speak" } },
        { label: "Riding into the sunset", plain: "The hero walks away into the sunset, an outline only.", set: { dark: 4, behind: "a sunset", faceShown: "an edge of light", pose: "walking away", who: "we know", stepsIn: "never" } },
        { label: "Headlights in the rain", plain: "A shape walks toward us against car lights, and we guess wrong.", set: { dark: 4, behind: "car headlights", faceShown: "the eyes", pose: "walking toward us", who: "we guess wrong", stepsIn: "at the end of the scene" } },
      ],
    },
  });

  W.add("lightPool", {
    window: {
      faces: [
        { face: "dial", slider: "pool" },
        { face: "tiles", slider: "lamp", icons: { "a desk lamp": "🛋️", "a candle": "🕯️", "a street lamp": "🏮", "a torch": "🔦", "a phone screen": "📱", "a single hanging bulb": "💡" } },
        { face: "ladder", slider: "outside" },
      ],
      groups: [
        { label: "The pool", sliders: ["pool", "lamp", "rim"] },
        { label: "In and out of it", sliders: ["inside", "outside"] },
        { label: "The light moves", sliders: ["moves"] },
      ],
      presets: [
        { label: "The interrogation", plain: "One bulb over the table, two people in it, sharp dark all round.", set: { pool: 5, lamp: "a single hanging bulb", rim: "sharp", inside: "two people", outside: "someone watching", moves: "swings" } },
        { label: "Last candle", plain: "One person and a candle that is going out.", set: { pool: 4, lamp: "a candle", rim: "fades slowly", inside: "one person", outside: "the thing we fear", moves: "is going out" } },
        { label: "Late at the desk", plain: "A soft desk lamp on a letter in a quiet room.", set: { pool: 2, lamp: "a desk lamp", rim: "soft", inside: "a thing on the table", outside: "the rest of the room", moves: "stays" } },
      ],
    },
  });

  /* ---------- effects ---------- */

  W.add("rainOnWindow", {
    window: {
      faces: [
        { face: "dial", slider: "rain" },
        { face: "ladder", slider: "drops" },
        { face: "pad", x: "blur", y: "rain", xLabel: "More blur behind", yLabel: "More rain" },
      ],
      groups: [
        { label: "The rain", sliders: ["rain", "drops"] },
        { label: "Through the glass", sliders: ["side", "blur", "glow"] },
        { label: "Like tears", sliders: ["tears"] },
      ],
      presets: [
        { label: "Bus window", plain: "Seen from outside, one streak right over her cheek.", set: { rain: 3, drops: "slow trickles", side: "outside looking in", blur: 30, glow: "car lights passing", tears: "right over the cheek" } },
        { label: "City in the rain", plain: "Looking out at a city melted into soft lights.", set: { rain: 4, drops: "streams", side: "inside looking out", blur: 80, glow: "city lights", tears: "no" } },
        { label: "A few drops", plain: "Still beads on the glass and one warm light behind.", set: { rain: 1, drops: "still drops", side: "inside looking out", blur: 10, glow: "one warm light", tears: "no" } },
      ],
    },
  });

  W.add("visibleBreath", {
    window: {
      faces: [
        { face: "dial", slider: "breath" },
        { face: "ladder", slider: "cold" },
        { face: "ladder", slider: "pace" },
      ],
      groups: [
        { label: "The cold", sliders: ["breath", "cold"] },
        { label: "The breathing", sliders: ["pace", "held"] },
        { label: "Whose breath", sliders: ["whose", "mix"] },
      ],
      presets: [
        { label: "Close in the cold", plain: "Two people so close their breath mixes in the bitter air.", set: { breath: 4, cold: "bitter", pace: "slow and calm", whose: "two people", mix: "they mix in the air", held: "never" } },
        { label: "Hiding in the closet", plain: "Fast breath that stops when the footsteps come.", set: { breath: 3, cold: "freezing", pace: "fast", whose: "one person", mix: "no", held: "to hide" } },
        { label: "After the run", plain: "Gasping clouds after the chase.", set: { breath: 5, cold: "cold", pace: "gasping", whose: "one person", mix: "no", held: "never" } },
      ],
    },
  });

  W.add("skyMatchesMood", {
    window: {
      faces: [
        { face: "dial", slider: "match" },
        { face: "tiles", slider: "sky", icons: { "sun breaking through": "🌤️", wind: "🌬️", rain: "🌧️", "thunder and lightning": "⛈️", snow: "❄️", fog: "🌫️" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "The weather", sliders: ["match", "sky", "size"] },
        { label: "With the feeling", sliders: ["way", "timing"] },
        { label: "The people", sliders: ["noticed"] },
      ],
      presets: [
        { label: "Storm during the fight", plain: "Thunder rolls in as a warning and the sky breaks with the fight.", set: { match: 5, sky: "thunder and lightning", way: "with it", timing: "before the feeling, as a warning", size: "the whole sky turns", noticed: "it soaks them" } },
        { label: "Sun at the funeral", plain: "A bright, cruel sun on the saddest day.", set: { match: 3, sky: "sun breaking through", way: "against it, like sun at a funeral", timing: "with the feeling", size: "a clear change", noticed: "they look up" } },
        { label: "Snow after the kiss", plain: "Snow starts to fall just after they make up.", set: { match: 4, sky: "snow", way: "with it", timing: "just after", size: "a small shift", noticed: "they say something about it" } },
      ],
    },
  });

  W.add("fogReveal", {
    window: {
      faces: [
        { face: "dial", slider: "fog" },
        { face: "ladder", slider: "hides" },
        { face: "tiles", slider: "first", icons: { "a shape": "👤", "a light": "💡", "a sound": "🔊", "all of it at once": "💥" } },
      ],
      groups: [
        { label: "The fog", sliders: ["fog", "air"] },
        { label: "What is in it", sliders: ["hides", "near"] },
        { label: "The reveal", sliders: ["first", "clears"] },
      ],
      presets: [
        { label: "The army on the hill", plain: "The fog lifts in a gust and the whole crowd is already there.", set: { fog: 5, air: "thick fog", hides: "a crowd", first: "a sound", clears: "in a gust", near: "halfway" } },
        { label: "Lantern on the moor", plain: "A light first, then a person walks out of the mist.", set: { fog: 4, air: "mist", hides: "a person", first: "a light", clears: "they walk out of it", near: "close" } },
        { label: "Right in front of us", plain: "Smoke so thick the monster is right in front of us before we see it.", set: { fog: 5, air: "smoke", hides: "a monster", first: "a shape", clears: "it never clears", near: "right in front of us" } },
      ],
    },
  });

  /* ---------- layers ---------- */

  W.add("memoryOverlay", {
    window: {
      faces: [
        { face: "dial", slider: "memory" },
        { face: "tiles", slider: "how", icons: { "faded over the whole picture": "👻", "in a small window": "🖼️", "in one part of the room": "🪑", "in a reflection": "🪞" } },
        { face: "dial", slider: "solid" },
      ],
      groups: [
        { label: "The memory", sliders: ["memory", "how", "solid"] },
        { label: "How it looks", sliders: ["pastLook", "lines"] },
        { label: "How it leaves", sliders: ["leaves"] },
      ],
      presets: [
        { label: "The empty kitchen", plain: "Warm, faded kids from long ago run through the kitchen now.", set: { memory: 4, how: "faded over the whole picture", solid: 35, pastLook: "warmer", lines: "the place", leaves: "fades out" } },
        { label: "The empty chair", plain: "Their late wife sits in her chair, solid, until he walks through her.", set: { memory: 5, how: "in one part of the room", solid: 80, pastLook: "same as now", lines: "the place", leaves: "someone walks through it" } },
        { label: "Old video in the corner", plain: "A grainy home video plays in a little window while she packs.", set: { memory: 2, how: "in a small window", solid: 100, pastLook: "grainy like old video", lines: "the same words", leaves: "snaps away" } },
      ],
    },
  });

  W.add("oneColorLeft", {
    window: {
      faces: [
        { face: "dial", slider: "kept" },
        { face: "swatches", slider: "hue", colors: { red: "#e4572e", yellow: "#ffd166", blue: "#6fa8dc", green: "#5fae78", gold: "#d4a017" } },
        { face: "tiles", slider: "what", icons: { "a piece of clothing": "🧥", "a flower": "🌹", "a light": "💡", eyes: "👁️", blood: "🩸", "a toy": "🎈" } },
      ],
      groups: [
        { label: "The colored thing", sliders: ["kept", "what", "hue", "size"] },
        { label: "The rest", sliders: ["rest"] },
        { label: "How long", sliders: ["lasts"] },
      ],
      presets: [
        { label: "The red coat", plain: "A small red coat in a black and white film, until it is gone.", set: { kept: 5, what: "a piece of clothing", hue: "red", rest: "black and white", size: 5, lasts: "until it is gone" } },
        { label: "Yellow balloon", plain: "A yellow balloon in a pale grey town, for one scene.", set: { kept: 4, what: "a toy", hue: "yellow", rest: "pale color", size: 8, lasts: "one scene" } },
        { label: "Her blue eyes", plain: "Only her eyes keep their color, the whole film long.", set: { kept: 3, what: "eyes", hue: "blue", rest: "full color, just faded", size: 2, lasts: "the whole film" } },
      ],
    },
  });

  W.add("scribblesOnTop", {
    window: {
      faces: [
        { face: "dial", slider: "drawn" },
        { face: "tiles", slider: "style", icons: { chalk: "🖍️", crayon: "🖍️", "neat pen": "🖊️", "felt tip marker": "🖌️", "glowing neon": "✨" } },
        { face: "ladder", slider: "moves" },
      ],
      groups: [
        { label: "The drawings", sliders: ["drawn", "shows", "moves"] },
        { label: "The pen", sliders: ["style", "ink"] },
        { label: "Whose mind", sliders: ["whose"] },
      ],
      presets: [
        { label: "Shy crush", plain: "Chalk hearts and arrows from the hero's head point at the girl.", set: { drawn: 2, style: "chalk", shows: "feelings, like hearts and clouds", moves: "draw themselves", whose: "the hero's thoughts", ink: "white" } },
        { label: "The heist plan", plain: "Neat pen arrows and labels sketch the plan over the street.", set: { drawn: 4, style: "neat pen", shows: "a plan", moves: "draw themselves", whose: "the narrator's", ink: "yellow" } },
        { label: "A child's world", plain: "Crayon monsters and castles wobble over the backyard.", set: { drawn: 5, style: "crayon", shows: "a made-up world", moves: "move with the person", whose: "a child's", ink: "many colors" } },
      ],
    },
  });

  W.add("journeyMap", {
    window: {
      faces: [
        { face: "dial", slider: "trip" },
        { face: "tiles", slider: "mapLook", icons: { "an old paper map": "🗺️", "a clean modern map": "📍", "a hand-drawn map": "✏️", "a phone map": "📱", "a globe": "🌍" } },
        { face: "pad", x: "seconds", y: "stops", xLabel: "Longer on screen", yLabel: "More stops" },
      ],
      groups: [
        { label: "The trip", sliders: ["trip", "stops", "seconds"] },
        { label: "The map", sliders: ["mapLook", "line"] },
        { label: "On the picture", sliders: ["over"] },
      ],
      presets: [
        { label: "Adventure across the world", plain: "A little plane crawls across an old paper map with three stops.", set: { trip: 5, mapLook: "an old paper map", line: "a little plane or car", seconds: 6, over: "the map fills the screen", stops: 3 } },
        { label: "Road trip diary", plain: "A dotted line on a hand-drawn map, faded over the car window.", set: { trip: 3, mapLook: "a hand-drawn map", line: "dotted", seconds: 4, over: "faded over the picture", stops: 2 } },
        { label: "Across town", plain: "A quick line on a phone map in the corner.", set: { trip: 0, mapLook: "a phone map", line: "solid", seconds: 1, over: "in a corner", stops: 0 } },
      ],
    },
  });

  /* ---------- editing and structure ---------- */

  W.add("toldBackwards", {
    window: {
      faces: [
        { face: "dial", slider: "backwards" },
        { face: "ladder", slider: "steps" },
        { face: "ladder", slider: "signs" },
      ],
      groups: [
        { label: "Going back", sliders: ["backwards", "steps", "forward"] },
        { label: "Where it starts and ends", sliders: ["startsAt", "endsOn"] },
        { label: "Helping us follow", sliders: ["signs"] },
      ],
      presets: [
        { label: "The breakup backwards", plain: "From the empty flat back, day by day, to the first happy move-in.", set: { backwards: 5, steps: "days", startsAt: "the very end", forward: "none", signs: "a date on screen", endsOn: "a happy moment" } },
        { label: "Memory puzzle", plain: "Short steps back, a few forward scenes in between, small clues only.", set: { backwards: 4, steps: "minutes", startsAt: "the worst moment", forward: "every other scene", signs: "small clues", endsOn: "the start of the lie" } },
        { label: "A life in reverse", plain: "Years at a time, from old age back to the first meeting.", set: { backwards: 3, steps: "years", startsAt: "an ordinary day", forward: "a few", signs: "a clear sign each time", endsOn: "the first meeting" } },
      ],
    },
  });

  W.add("flashForward", {
    window: {
      faces: [
        { face: "dial", slider: "glimpse" },
        { face: "tiles", slider: "shows", icons: { "a happy moment": "🎉", "a disaster": "💥", "a death": "⚰️", "a strange place": "🏝️", "the hero in trouble": "🆘" } },
        { face: "ladder", slider: "jump" },
      ],
      groups: [
        { label: "The glimpse", sliders: ["glimpse", "shows", "clear"] },
        { label: "How far", sliders: ["jump", "catchUp"] },
        { label: "Was it true", sliders: ["twist"] },
      ],
      presets: [
        { label: "How did I get here?", plain: "A clear shot of the hero in trouble, then back three days.", set: { glimpse: 2, shows: "the hero in trouble", jump: "days", clear: "perfectly clear", catchUp: "near the end", twist: "exactly as shown" } },
        { label: "Flash of a death", plain: "Pieces of a death years ahead, which turn out different.", set: { glimpse: 0, shows: "a death", jump: "years", clear: "pieces", catchUp: "near the end", twist: "a little different" } },
        { label: "The promise", plain: "A whole happy scene at the very end, shown early, that we never reach.", set: { glimpse: 5, shows: "a happy moment", jump: "the very end", clear: "clear but confusing", catchUp: "never", twist: "the opposite of what we thought" } },
      ],
    },
  });

  W.add("sameMomentAgain", {
    window: {
      faces: [
        { face: "dial", slider: "again" },
        { face: "tiles", slider: "fromWhere", icons: { "another person's eyes": "👀", "another place in the room": "📐", "a camera in the story": "📹", "much later, in memory": "💭" } },
        { face: "ladder", slider: "newSide" },
      ],
      groups: [
        { label: "Seen again", sliders: ["again", "times", "gap"] },
        { label: "From where", sliders: ["fromWhere", "newSide"] },
        { label: "The mark", sliders: ["marked"] },
      ],
      presets: [
        { label: "The crash, from the sidewalk", plain: "At the very end, the same crash from the street changes everything.", set: { again: 5, times: 2, fromWhere: "another place in the room", gap: "at the very end", newSide: "it changes everything", marked: "no mark" } },
        { label: "Three sides of the party", plain: "The same party three times, through three people's eyes.", set: { again: 3, times: 3, fromWhere: "another person's eyes", gap: "later in the film", newSide: "what someone else was doing", marked: "the same line of dialogue" } },
        { label: "Security tape", plain: "Right away, the scene again on a security camera, with one small detail.", set: { again: 2, times: 2, fromWhere: "a camera in the story", gap: "right away", newSide: "a small detail", marked: "a rewind sound" } },
      ],
    },
  });

  W.add("falseEnding", {
    window: {
      faces: [
        { face: "dial", slider: "fake" },
        { face: "ladder", slider: "signs" },
        { face: "tiles", slider: "comesBack", icons: { "the villain": "😈", "the danger": "⚠️", "a new problem": "❗", "a secret": "🤫", "the joke": "😂" } },
      ],
      groups: [
        { label: "The fake ending", sliders: ["fake", "signs", "wait"] },
        { label: "The restart", sliders: ["comesBack", "tone"] },
        { label: "After", sliders: ["after"] },
      ],
      presets: [
        { label: "Hand from the grave", plain: "Credits begin, then the villain's hand bursts out with a jump scare.", set: { fake: 5, signs: "the credits begin", wait: 60, comesBack: "the villain", tone: "a jump scare", after: "it ends on the shock" } },
        { label: "One more problem", plain: "The music swells, then a new problem with a slow dread.", set: { fake: 3, signs: "the music swells", wait: 20, comesBack: "a new problem", tone: "slow dread", after: "a real ending" } },
        { label: "One last laugh", plain: "A fade to black, then the joke comes back.", set: { fake: 2, signs: "a fade to black", wait: 5, comesBack: "the joke", tone: "a laugh", after: "a real ending" } },
      ],
    },
  });

  W.add("toldBySomeone", {
    window: {
      faces: [
        { face: "dial", slider: "teller" },
        { face: "tiles", slider: "who", icons: { "the hero, years later": "👵", "someone who watched": "👀", "a parent to a child": "👨‍👧", "a suspect to police": "🚓", "a stranger": "🧳" } },
        { face: "ladder", slider: "trust" },
      ],
      groups: [
        { label: "The teller", sliders: ["teller", "who", "trust"] },
        { label: "The listener", sliders: ["listener", "breaks"] },
        { label: "The end of the telling", sliders: ["endsWith"] },
      ],
      presets: [
        { label: "Grandpa's war story", plain: "A grandfather to his grandson, skipping a part, until the boy asks why.", set: { teller: 3, who: "a parent to a child", listener: "a child", trust: "they make it nicer", breaks: "they argue with the listener", endsWith: "the listener changes" } },
        { label: "The suspect's version", plain: "A suspect tells police what happened, and is lying.", set: { teller: 5, who: "a suspect to police", listener: "the police", trust: "lying", breaks: "they change details", endsWith: "we learn who they are" } },
        { label: "Old woman remembering", plain: "The hero, years later, a voice now and then over her young life.", set: { teller: 1, who: "the hero, years later", listener: "nobody, just us", trust: "they forget things", breaks: "a voice now and then", endsWith: "the teller dies" } },
      ],
    },
  });

  /* ---------- emotional road ---------- */

  W.add("allIsLost", {
    window: {
      faces: [
        { face: "dial", slider: "lost" },
        { face: "dial", slider: "when" },
        { face: "tiles", slider: "spark", icons: { "a memory": "💭", "a friend comes back": "🤝", "a small sign": "🌱", "they choose to go on": "🚶" } },
      ],
      groups: [
        { label: "The bottom", sliders: ["lost", "what", "alone"] },
        { label: "When and how long", sliders: ["when", "length"] },
        { label: "The way up", sliders: ["spark"] },
      ],
      presets: [
        { label: "Dark night of the soul", plain: "Everything gone, alone, three quarters of the way in.", set: { lost: 5, when: 75, what: "everything", alone: "alone", length: 4, spark: "they choose to go on" } },
        { label: "The mentor dies", plain: "The mentor dies, a friend stays, a memory lifts them.", set: { lost: 4, when: 70, what: "a mentor", alone: "with one person", length: 6, spark: "a memory" } },
        { label: "The plan fails", plain: "A short bottom with the team, until a friend comes back.", set: { lost: 3, when: 80, what: "the plan", alone: "with friends", length: 2, spark: "a friend comes back" } },
      ],
    },
  });

  W.add("calmBeforeStorm", {
    window: {
      faces: [
        { face: "dial", slider: "calm" },
        { face: "tiles", slider: "fills", icons: { "a meal together": "🍲", "a quiet talk": "💬", "a joke": "😄", sleep: "😴", "getting ready": "🎒", "a last look at home": "🏡" } },
        { face: "ladder", slider: "sign" },
      ],
      groups: [
        { label: "The calm", sliders: ["calm", "fills", "length"] },
        { label: "The storm coming", sliders: ["knows", "sign"] },
        { label: "The break", sliders: ["breaks"] },
      ],
      presets: [
        { label: "Night before the battle", plain: "A bad joke by the fire, cut by a far-off drum.", set: { calm: 4, fills: "a joke", length: 3, knows: "the characters", sign: "a distant sound", breaks: "with a sound" } },
        { label: "The last supper", plain: "A long, happy meal that only we know is the last.", set: { calm: 5, fills: "a meal together", length: 6, knows: "only the audience", sign: "none", breaks: "all at once" } },
        { label: "Packing up", plain: "Quiet packing as the sky darkens outside.", set: { calm: 2, fills: "getting ready", length: 2, knows: "everyone", sign: "the sky darkens", breaks: "slowly" } },
      ],
    },
  });

  W.add("smallWin", {
    window: {
      faces: [
        { face: "dial", slider: "win" },
        { face: "tiles", slider: "kind", icons: { "a kind word": "💬", "a skill learned": "🎯", "a small escape": "🚪", "something found": "🔍", "a stranger helps": "🤝" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "The win", sliders: ["win", "kind", "size"] },
        { label: "Its price", sliders: ["cost"] },
        { label: "Who and how long", sliders: ["shared", "lasting"] },
      ],
      presets: [
        { label: "Music in the yard", plain: "One song on the radio, and the whole yard stops to listen.", set: { win: 5, kind: "a small escape", size: "small", cost: "more than it seems", shared: "with the group", lasting: "until the end" } },
        { label: "A stranger's coat", plain: "A stranger gives her a coat, and it lasts one scene.", set: { win: 3, kind: "a stranger helps", size: "tiny", cost: "nothing", shared: "alone", lasting: "a scene" } },
        { label: "First time right", plain: "The kid finally lands the trick, with one friend watching.", set: { win: 4, kind: "a skill learned", size: "medium", cost: "a little", shared: "with one friend", lasting: "a moment" } },
      ],
    },
  });

  W.add("doomedFromStart", {
    window: {
      faces: [
        { face: "dial", slider: "doom" },
        { face: "tiles", slider: "told", icons: { "the title": "🔤", "an opening scene": "🎬", "a narrator says it": "🗣️", "we know the real story": "📰", "a glimpse of the future": "🔮" } },
        { face: "dial", slider: "joy" },
      ],
      groups: [
        { label: "Knowing the end", sliders: ["doom", "told", "whenTold"] },
        { label: "On the way", sliders: ["joy", "hopeLeft"] },
        { label: "The real ending", sliders: ["ending"] },
      ],
      presets: [
        { label: "The ship sinks", plain: "We know the real story, and the film gives us lots of joy anyway.", set: { doom: 5, told: "we know the real story", whenTold: "the first minute", joy: 8, hopeLeft: "a lot, then takes it", ending: "exactly as told" } },
        { label: "Gone by September", plain: "A narrator tells us early, and a perfect summer follows.", set: { doom: 4, told: "a narrator says it", whenTold: "the first minute", joy: 10, hopeLeft: "a little", ending: "a small surprise" } },
        { label: "The opening grave", plain: "An opening scene at the grave, and no hope after.", set: { doom: 5, told: "an opening scene", whenTold: "the first act", joy: 3, hopeLeft: "never", ending: "worse" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
