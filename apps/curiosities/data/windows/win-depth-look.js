/* win for the filters and adjustments, camera angle, archetype and wardrobe curiosities in data/db-depth-look.js
   (depth thread, look). Each one already has six graded settings of its own, so these windows add faces, groups
   and presets only. */
(function (W) {
  /* ---------- filters and adjustments ---------- */

  W.add("highlightGlow", {
    window: {
      faces: [
        { face: "dial", slider: "glow" },
        { face: "swatches", slider: "tint", colors: { white: "#f4f4f4", "warm gold": "#ffd166", "red edge, like old film": "#e4572e", "cool blue": "#9fd3ff", pink: "#d9789b" } },
        { face: "pad", x: "spread", y: "glow", xLabel: "Spreads further", yLabel: "Glows more" },
      ],
      groups: [
        { label: "The glow", sliders: ["glow", "from", "spread"] },
        { label: "Its color and place", sliders: ["tint", "onWhat"] },
        { label: "When it comes", sliders: ["when"] },
      ],
      presets: [
        { label: "Golden memory", plain: "Warm glow on faces and hair, only in the memories.", set: { glow: 4, from: "bright things", spread: 6, tint: "warm gold", onWhat: "faces and hair", when: "only in memories" } },
        { label: "Old film edge", plain: "A red edge around every lamp and window, like a print from the 1970s.", set: { glow: 3, from: "only the brightest lights", spread: 3, tint: "red edge, like old film", onWhat: "lamps and windows", when: "the whole film" } },
        { label: "Falling for her", plain: "The glow grows around one person as the crush grows.", set: { glow: 3, from: "bright things", spread: 5, tint: "pink", onWhat: "faces and hair", when: "it grows as they fall in love" } },
      ],
    },
  });

  W.add("darkSwallows", {
    window: {
      faces: [
        { face: "dial", slider: "crush" },
        { face: "tiles", slider: "hides", icons: { nothing: "⬛", "the edges of the room": "🔲", "half a face": "🌗", "a person": "👤", "the thing we fear": "👁️" } },
        { face: "pad", x: "share", y: "glint", xLabel: "More black", yLabel: "More small lights" },
      ],
      groups: [
        { label: "The black", sliders: ["crush", "share", "edge"] },
        { label: "What it hides", sliders: ["hides", "glint"] },
        { label: "When it lifts", sliders: ["lifted"] },
      ],
      presets: [
        { label: "Detective's office", plain: "Half the frame in hard black, half a face lost in it.", set: { crush: 4, share: 50, hides: "half a face", edge: "hard edge", lifted: "at the reveal", glint: 2 } },
        { label: "Something out there", plain: "Nearly all black, with two eyes glinting where the fear waits.", set: { crush: 5, share: 85, hides: "the thing we fear", edge: "fades slowly", lifted: "never", glint: 2 } },
        { label: "Soft night", plain: "Deep but readable shadows that open up at the end.", set: { crush: 2, share: 30, hides: "the edges of the room", edge: "soft edge", lifted: "a little at the end", glint: 1 } },
      ],
    },
  });

  W.add("hardeningLook", {
    window: {
      faces: [
        { face: "dial", slider: "follows" },
        { face: "mixer", sliders: ["contrast", "drain"] },
        { face: "ladder", slider: "grit" },
      ],
      groups: [
        { label: "How it follows", sliders: ["follows", "steps"] },
        { label: "At the worst point", sliders: ["contrast", "drain", "grit"] },
        { label: "Warmth", sliders: ["temp"] },
      ],
      presets: [
        { label: "The long war", plain: "Color and warmth drain a little each battle, until the end is grey and gritty.", set: { follows: 4, contrast: 60, drain: 80, grit: "rough and dirty", temp: "gets colder", steps: "slowly over the film" } },
        { label: "Heatwave breakdown", plain: "The picture burns hotter and harsher scene by scene as tempers rise.", set: { follows: 4, contrast: 70, drain: 30, grit: "clear grain", temp: "gets hotter", steps: "scene by scene" } },
        { label: "One hard drop", plain: "The day the news comes, the whole look snaps hard and cold.", set: { follows: 5, contrast: 80, drain: 60, grit: "a little", temp: "gets colder", steps: "in one hard jump" } },
      ],
    },
  });

  W.add("tooPerfectLook", {
    window: {
      faces: [
        { face: "dial", slider: "polish" },
        { face: "ladder", slider: "crack" },
        { face: "tiles", slider: "why", icons: { "a lie": "🤥", "a dream": "💭", "a perfect family's secret": "🏡", "an advert or a show": "📺", "a trap": "🪤" } },
      ],
      groups: [
        { label: "The shine", sliders: ["polish", "bright", "candy"] },
        { label: "The faces", sliders: ["skin"] },
        { label: "What is wrong", sliders: ["crack", "why"] },
      ],
      presets: [
        { label: "Cereal advert suburb", plain: "Candy lawns and doll faces, with one dead lawn in the corner.", set: { polish: 5, bright: "very bright", candy: 85, skin: "like dolls", crack: "a small wrong thing", why: "a perfect family's secret" } },
        { label: "The dream", plain: "Too bright, too sweet, until it breaks apart.", set: { polish: 4, bright: "shining white", candy: 60, skin: "like a magazine", crack: "it breaks apart", why: "a dream" } },
        { label: "Just a little too nice", plain: "Barely too clean, enough to make us wonder.", set: { polish: 2, bright: "bright", candy: 30, skin: "a little smoothed", crack: "none", why: "a lie" } },
      ],
    },
  });

  W.add("wrongColors", {
    window: {
      faces: [
        { face: "dial", slider: "wrongness" },
        { face: "pad", x: "slide", y: "split", xLabel: "Colors slide further", yLabel: "Edges split more" },
        { face: "tiles", slider: "cause", icons: { fever: "🤒", "drink or drugs": "🍸", panic: "😱", grief: "😢", "a dream": "💭", madness: "🌀" } },
      ],
      groups: [
        { label: "How wrong", sliders: ["wrongness", "slide", "split"] },
        { label: "The pulse", sliders: ["pulse"] },
        { label: "Why and after", sliders: ["cause", "backTo"] },
      ],
      presets: [
        { label: "Fever room", plain: "Reds slide toward purple and the room throbs slowly, then snaps back.", set: { wrongness: 3, slide: 60, split: 3, pulse: "slow pulse", cause: "fever", backTo: "snaps back" } },
        { label: "Panic attack", plain: "Edges split and the picture flickers fast.", set: { wrongness: 4, slide: 30, split: 8, pulse: "flicker", cause: "panic", backTo: "fades back" } },
        { label: "Losing it", plain: "Colors drift far from real and never come back.", set: { wrongness: 5, slide: 160, split: 6, pulse: "fast pulse", cause: "madness", backTo: "never comes back" } },
      ],
    },
  });

  /* ---------- camera angle ---------- */

  W.add("overShoulder", {
    window: {
      faces: [
        { face: "dial", slider: "shoulder" },
        { face: "ladder", slider: "tight" },
        { face: "tiles", slider: "alone", icons: { nobody: "👥", "the one losing": "😞", "the one winning": "😏", "both by the end": "🚪" } },
      ],
      groups: [
        { label: "The shoulder", sliders: ["shoulder", "side"] },
        { label: "The far face", sliders: ["tight", "sharp"] },
        { label: "Between the shots", sliders: ["match", "alone"] },
      ],
      presets: [
        { label: "Equal talk", plain: "Mirror-image shots over each shoulder, both faces sharp.", set: { shoulder: 3, side: "swaps sides", tight: "shoulders up", sharp: "both", match: "mirror images", alone: "nobody" } },
        { label: "Interrogation", plain: "A big shoulder looms over a tight face; the one losing ends up alone.", set: { shoulder: 5, side: "left shoulder", tight: "the face", sharp: "the far face", match: "very different", alone: "the one losing" } },
        { label: "The breakup", plain: "Starts over the shoulder, ends with each of them alone in the frame.", set: { shoulder: 1, side: "swaps sides", tight: "the face", sharp: "the far face", match: "close", alone: "both by the end" } },
      ],
    },
  });

  W.add("sharedFrame", {
    window: {
      faces: [
        { face: "dial", slider: "together" },
        { face: "ladder", slider: "gap" },
        { face: "balance", slider: "bigger" },
      ],
      groups: [
        { label: "Sharing the frame", sliders: ["together", "shots", "when"] },
        { label: "In the shot", sliders: ["gap", "bigger", "shape"] },
      ],
      presets: [
        { label: "Always together", plain: "Every shot holds both, side by side and close.", set: { together: 5, shots: 90, gap: "close", bigger: "equal", when: "when they agree", shape: "side by side" } },
        { label: "Kept apart", plain: "Separate shots all scene, until the touch at the end.", set: { together: 1, shots: 10, gap: "far apart at the edges", bigger: "equal", when: "when they touch", shape: "face to face, side on" } },
        { label: "Back to back", plain: "In one frame but turned away, one bigger than the other.", set: { together: 3, shots: 50, gap: "a gap", bigger: "the first person", when: "never", shape: "back to back" } },
      ],
    },
  });

  W.add("childHeight", {
    window: {
      faces: [
        { face: "dial", slider: "height" },
        { face: "tiles", slider: "whose", icons: { "a small child": "🧒", "a pet": "🐕", "someone seated or in a wheelchair": "🦽", "someone lying down": "🛌", "a short adult": "🧍" } },
        { face: "ladder", slider: "faces" },
      ],
      groups: [
        { label: "The camera", sliders: ["height", "whose", "share"] },
        { label: "The grown-ups", sliders: ["faces", "kneels"] },
        { label: "The world", sliders: ["size"] },
      ],
      presets: [
        { label: "Six-year-old", plain: "Waist-high camera, parents cut off, the world towering, until a parent kneels.", set: { height: 70, whose: "a small child", faces: "cut off at the waist", share: 80, kneels: "a parent", size: "towering" } },
        { label: "Dog's day", plain: "Down at the floor, all legs and shoes.", set: { height: 30, whose: "a pet", faces: "cut off at the waist", share: 60, kneels: "a kind stranger", size: "huge" } },
        { label: "From the wheelchair", plain: "Seated height, faces bending into view.", set: { height: 120, whose: "someone seated or in a wheelchair", faces: "they bend into view", share: 50, kneels: "everyone in the end", size: "a bit big" } },
      ],
    },
  });

  W.add("closeOnThing", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "tiles", slider: "thing", icons: { "a hand": "✋", "a phone or a note": "📱", "a ring or jewelry": "💍", "a clock": "⏰", "a weapon": "🔫", "food or a drink": "🍷" } },
        { face: "pad", x: "hold", y: "times", xLabel: "Look longer", yLabel: "See it more often" },
      ],
      groups: [
        { label: "The thing", sliders: ["weight", "thing", "fill"] },
        { label: "How we see it", sliders: ["hold", "times"] },
        { label: "Who sees it", sliders: ["seenBy"] },
      ],
      presets: [
        { label: "The ring by the sink", plain: "A long close look at a ring only we notice.", set: { weight: 4, thing: "a ring or jewelry", hold: 3, seenBy: "only us", fill: "most of it", times: 1 } },
        { label: "The gun in the drawer", plain: "A weapon we see twice before it matters.", set: { weight: 5, thing: "a weapon", hold: 2, seenBy: "only us", fill: "fills it completely", times: 2 } },
        { label: "Ticking clock", plain: "A clock cut in again and again as time runs out.", set: { weight: 3, thing: "a clock", hold: 1, seenBy: "everyone", fill: "fills it completely", times: 5 } },
      ],
    },
  });

  W.add("glanceThenSee", {
    window: {
      faces: [
        { face: "dial", slider: "pull" },
        { face: "tiles", slider: "seen", icons: { "a person": "👤", "an object": "📦", "a danger": "⚠️", "a place": "🏞️", "something we don't get to see": "❓" } },
        { face: "ladder", slider: "reaction" },
      ],
      groups: [
        { label: "The look", sliders: ["pull", "through", "looks"] },
        { label: "What they see", sliders: ["seen"] },
        { label: "Back to the face", sliders: ["faceHold", "reaction"] },
      ],
      presets: [
        { label: "The empty swing", plain: "Through his eyes to the swing, then a long still face.", set: { pull: 4, seen: "an object", through: "exactly through their eyes", faceHold: 4, reaction: "nothing", looks: 1 } },
        { label: "What is in the box", plain: "She looks, we never see it, and her face says everything.", set: { pull: 3, seen: "something we don't get to see", through: "near their eyes", faceHold: 3, reaction: "a big reaction", looks: 1 } },
        { label: "Double take", plain: "Look, see, look away, look again.", set: { pull: 2, seen: "a person", through: "from the side", faceHold: 1, reaction: "a clear reaction", looks: 2 } },
      ],
    },
  });

  /* ---------- archetype ---------- */

  W.add("tricksterRole", {
    window: {
      faces: [
        { face: "dial", slider: "mischief" },
        { face: "tiles", slider: "tool", icons: { jokes: "😜", lies: "🤥", disguises: "🥸", "swaps and switches": "🔀", chaos: "🌪️", "bending the rules": "📜" } },
        { face: "ladder", slider: "side" },
      ],
      groups: [
        { label: "The tricks", sliders: ["mischief", "tool", "truth"] },
        { label: "Their side", sliders: ["side", "cost"] },
        { label: "Caught", sliders: ["caught"] },
      ],
      presets: [
        { label: "Name-card swap", plain: "A wedding guest swaps the seats for fun, and everyone pays.", set: { mischief: 4, tool: "swaps and switches", side: "their own", caught: "in the end", truth: 3, cost: "innocent people" } },
        { label: "The wise fool", plain: "Jokes that tell the king the truth nobody else dares to.", set: { mischief: 2, tool: "jokes", side: "the hero's", caught: "never", truth: 5, cost: "fools who deserve it" } },
        { label: "Chaos god", plain: "Lies and chaos against the hero, caught often, never stopped.", set: { mischief: 5, tool: "chaos", side: "against the hero", caught: "often", truth: 1, cost: "innocent people" } },
      ],
    },
  });

  W.add("caretaker", {
    window: {
      faces: [
        { face: "dial", slider: "care" },
        { face: "mixer", sliders: ["care", "self"] },
        { face: "tiles", slider: "breaks", icons: { never: "🧱", "they snap once": "💥", "they walk away": "🚪", "they fall ill": "🤒" } },
      ],
      groups: [
        { label: "The caring", sliders: ["care", "whom", "shows"] },
        { label: "What it costs them", sliders: ["self", "thanks", "breaks"] },
      ],
      presets: [
        { label: "Eldest sister", plain: "Makes everyone's lunch, nobody thanks her, and one day she leaves.", set: { care: 5, whom: "the whole group", self: 0, thanks: "none", breaks: "they walk away", shows: "cooking" } },
        { label: "The field medic", plain: "Patches every wound, gets real thanks, never breaks.", set: { care: 4, whom: "a stranger", self: 2, thanks: "truly thanked", breaks: "never", shows: "patching wounds" } },
        { label: "Looking after Dad", plain: "Quiet daily care for a sick parent, until it makes them ill.", set: { care: 5, whom: "a sick parent", self: 1, thanks: "taken for granted", breaks: "they fall ill", shows: "quiet small acts" } },
      ],
    },
  });

  W.add("rivalToFriend", {
    window: {
      faces: [
        { face: "ladder", slider: "closeness" },
        { face: "tiles", slider: "turn", icons: { "a shared enemy": "👹", "one saves the other": "🛟", "they see each other's pain": "💔", "they lose together": "🥈" } },
        { face: "pad", x: "scenes", y: "spark", xLabel: "Takes longer", yLabel: "More sharp words" },
      ],
      groups: [
        { label: "The rivalry", sliders: ["closeness", "over"] },
        { label: "The turn", sliders: ["turn", "scenes"] },
        { label: "After", sliders: ["spark", "backslide"] },
      ],
      presets: [
        { label: "Teammates at last", plain: "Rivals for a place on the team unite against a shared enemy.", set: { closeness: "true friends", over: "a place on the team", scenes: 12, turn: "a shared enemy", spark: 3, backslide: "once" } },
        { label: "The bus home", plain: "Two prodigies lose together and quietly respect each other.", set: { closeness: "grudging respect", over: "being the best", scenes: 8, turn: "they lose together", spark: 2, backslide: "never" } },
        { label: "Frenemies", plain: "Allies who keep falling out and keep the teasing sharp.", set: { closeness: "allies", over: "respect", scenes: 15, turn: "one saves the other", spark: 5, backslide: "often" } },
      ],
    },
  });

  W.add("comicSidekick", {
    window: {
      faces: [
        { face: "dial", slider: "funny" },
        { face: "tiles", slider: "kind", icons: { clumsy: "🤸", loudmouth: "📣", coward: "🐔", "know-it-all": "🤓", "odd and gentle": "🦄" } },
        { face: "pad", x: "screen", y: "heart", xLabel: "More time on screen", yLabel: "More heart" },
      ],
      groups: [
        { label: "The funny", sliders: ["funny", "kind", "says"] },
        { label: "The heart", sliders: ["heart", "brave"] },
        { label: "Screen time", sliders: ["screen"] },
      ],
      presets: [
        { label: "Brave coward", plain: "Runs away twice, then runs back in and saves the day.", set: { funny: 4, kind: "coward", says: "always", brave: "saves the day", screen: 30, heart: 4 } },
        { label: "Know-it-all friend", plain: "Says what we all think, with a small brave moment.", set: { funny: 3, kind: "know-it-all", says: "always", brave: "a small one", screen: 25, heart: 3 } },
        { label: "Pure comic relief", plain: "Clumsy laughs, little heart, no brave moment.", set: { funny: 5, kind: "clumsy", says: "sometimes", brave: "none", screen: 15, heart: 1 } },
      ],
    },
  });

  W.add("rightfulVillain", {
    window: {
      faces: [
        { face: "dial", slider: "belief" },
        { face: "ladder", slider: "point" },
        { face: "tiles", slider: "goal", icons: { "to save the world": "🌍", "to protect their family": "👨‍👩‍👧", justice: "⚖️", order: "🏛️", revenge: "🗡️" } },
      ],
      groups: [
        { label: "Their cause", sliders: ["belief", "goal", "point"] },
        { label: "Their way", sliders: ["line", "likeHero"] },
        { label: "Their end", sliders: ["end"] },
      ],
      presets: [
        { label: "The flood survivor", plain: "Mostly right, sure of it, and ready to do anything for revenge.", set: { belief: 5, goal: "revenge", point: "mostly", line: "anything", likeHero: 4, end: "destroyed" } },
        { label: "Order at any cost", plain: "Partly right, bends the rules, and wins.", set: { belief: 4, goal: "order", point: "partly", line: "bend the rules", likeHero: 2, end: "they win" } },
        { label: "The father", plain: "Protects his family by hurting others, then sees he was wrong.", set: { belief: 3, goal: "to protect their family", point: "partly", line: "hurt people", likeHero: 5, end: "they see they were wrong" } },
      ],
    },
  });

  /* ---------- wardrobe ---------- */

  W.add("costumeTurn", {
    window: {
      faces: [
        { face: "dial", slider: "shift" },
        { face: "balance", slider: "direction" },
        { face: "tiles", slider: "moment", icons: { "a quiet scene alone": "🪞", "a shopping scene": "🛍️", "after a loss": "🕯️", "before the big fight": "⚔️", "at the very end": "🏁" } },
      ],
      groups: [
        { label: "The change", sliders: ["shift", "direction", "kept"] },
        { label: "When and how", sliders: ["moment", "steps"] },
        { label: "Who notices", sliders: ["seen"] },
      ],
      presets: [
        { label: "Father's jacket", plain: "After the funeral, one piece from her father, worn to the end.", set: { shift: 2, direction: "dressed down", moment: "after a loss", kept: "most of it", seen: "one person", steps: 1 } },
        { label: "Suiting up", plain: "Before the big fight, the full armor goes on and everyone stares.", set: { shift: 5, direction: "dressed up", moment: "before the big fight", kept: "nothing", seen: "everyone stares", steps: 1 } },
        { label: "Bit by bit", plain: "The new look builds over several scenes, keeping the old color.", set: { shift: 4, direction: "sideways", moment: "a quiet scene alone", kept: "the color", seen: "nobody", steps: 5 } },
      ],
    },
  });

  W.add("groupDressed", {
    window: {
      faces: [
        { face: "dial", slider: "alike" },
        { face: "tiles", slider: "by", icons: { "a color": "🎨", "a jacket or uniform": "🧥", "a badge or patch": "📛", "a hairstyle": "💇", "a whole style": "🕶️" } },
        { face: "ladder", slider: "outOfStep" },
      ],
      groups: [
        { label: "The look", sliders: ["alike", "by", "chosen"] },
        { label: "The group", sliders: ["size", "outOfStep"] },
        { label: "Over time", sliders: ["drift"] },
      ],
      presets: [
        { label: "Five brothers", plain: "One leather jacket for all, until the youngest turns up in a suit.", set: { alike: 5, by: "a jacket or uniform", size: 5, outOfStep: "the hero breaks away", chosen: "chosen with pride", drift: "loosens" } },
        { label: "School gang", plain: "A shared color, expected not chosen, one slightly off.", set: { alike: 3, by: "a color", size: 4, outOfStep: "one is slightly off", chosen: "expected", drift: "stays tight" } },
        { label: "The split", plain: "A band in matching style that splits into two looks.", set: { alike: 4, by: "a whole style", size: 6, outOfStep: "one refuses", chosen: "chosen with pride", drift: "splits in two" } },
      ],
    },
  });

  W.add("clashingPiece", {
    window: {
      faces: [
        { face: "dial", slider: "clash" },
        { face: "tiles", slider: "piece", icons: { shoes: "👟", "a hat": "🎩", "a scarf or tie": "🧣", jewelry: "📿", "a bag": "👜", socks: "🧦" } },
        { face: "ladder", slider: "color" },
      ],
      groups: [
        { label: "The piece", sliders: ["clash", "piece", "color"] },
        { label: "Its story", sliders: ["meaning", "asked"] },
        { label: "Its end", sliders: ["fate"] },
      ],
      presets: [
        { label: "Headmaster's socks", plain: "Cartoon socks under a grey suit, explained only at the end.", set: { clash: 4, piece: "socks", color: "a shout", meaning: "a secret self", asked: "they tell the story behind it", fate: "kept to the end" } },
        { label: "Her bracelet", plain: "A child's bracelet on a soldier, given away in the last scene.", set: { clash: 3, piece: "jewelry", color: "a strong contrast", meaning: "a memory of someone", asked: "once", fate: "given away" } },
        { label: "The red hat", plain: "A loud hat worn as a quiet act of rebellion, then thrown away.", set: { clash: 5, piece: "a hat", color: "a shout", meaning: "rebellion", asked: "never", fate: "thrown away" } },
      ],
    },
  });

  W.add("notTheirClothes", {
    window: {
      faces: [
        { face: "dial", slider: "wrong" },
        { face: "balance", slider: "way" },
        { face: "tiles", slider: "whose", icons: { "handed down": "👕", borrowed: "🤝", stolen: "🦹", "from someone who died": "🕯️", "bought big to grow into": "📏" } },
      ],
      groups: [
        { label: "The fit", sliders: ["wrong", "way", "whose"] },
        { label: "The wearer", sliders: ["aware", "grows"] },
        { label: "Others", sliders: ["others"] },
      ],
      presets: [
        { label: "Late father's suit", plain: "Sleeves past his fingers at the interview, rolled up by a kind stranger.", set: { wrong: 4, way: "far too big", whose: "from someone who died", aware: "a bit shy about it", grows: "by the end they fit", others: "someone fixes it" } },
        { label: "Stolen uniform", plain: "A uniform a size too small, worn with a straight face.", set: { wrong: 3, way: "a bit small", whose: "stolen", aware: "no idea", grows: "never", others: "nobody notices" } },
        { label: "Big sister's coat", plain: "A handed-down coat, teased at school, worn proudly anyway.", set: { wrong: 3, way: "a bit big", whose: "handed down", aware: "proud anyway", grows: "slowly", others: "teasing" } },
      ],
    },
  });

  W.add("uniformOff", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "tiles", slider: "uniform", icons: { soldier: "🪖", police: "👮", "nurse or doctor": "🩺", "priest or nun": "⛪", "waiter or shop worker": "🍽️", "school uniform": "🎒" } },
        { face: "tiles", slider: "how", icons: { "slowly and carefully": "🫳", "pulled off in anger": "😠", "torn off": "✂️", "folded and left behind": "📦" } },
      ],
      groups: [
        { label: "The uniform", sliders: ["weight", "uniform", "first"] },
        { label: "Taking it off", sliders: ["how", "who"] },
        { label: "After", sliders: ["back"] },
      ],
      presets: [
        { label: "Badge on the seat", plain: "The cop unpins the badge first and leaves it behind, alone in the car.", set: { weight: 5, uniform: "police", how: "folded and left behind", first: "the badge", back: "never", who: "they are alone" } },
        { label: "After the shift", plain: "A nurse peels off her scrubs slowly, in front of the one person she trusts.", set: { weight: 2, uniform: "nurse or doctor", how: "slowly and carefully", first: "the shoes", back: "yes, every day", who: "one person they trust" } },
        { label: "Deserter", plain: "A soldier tears the jacket off in front of everyone.", set: { weight: 5, uniform: "soldier", how: "torn off", first: "the jacket", back: "never", who: "everyone" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
