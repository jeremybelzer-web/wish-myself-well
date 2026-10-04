/* Set: a window for every curiosity whose home is Set on the Screen. */
(function (W) {
  W.add("setting", {
    sliders: [
      ["placeFocus", "How much the place pulls focus", ["just a backdrop", "felt", "noticed", "a character itself"], "Whether the audience barely registers the place or watches it like a person in the scene."],
      ["homeTurf", "Whose place it is", ["nobody's", "a stranger's", "shared", "the hero's own"], "Whose ground the characters stand on, which changes who feels in charge."],
      ["returns", "How often we come back", ["only once", "now and then", "often", "home base"], "Whether this place is a one-off stop or the room the film keeps returning to."],
      ["establishTime", "Time spent showing the place", [0, 10, "s"], "How many seconds the film lingers on the place before people take over."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { kitchen: "🍳", lab: "🧪", courtyard: "🌳", wall: "🧱", commute: "🚇" } },
        { face: "ladder", slider: "placeFocus" },
        { face: "dial", slider: "establishTime" },
      ],
      groups: [
        { label: "The place", sliders: ["setting", "familiarity", "homeTurf"] },
        { label: "Its pull on us", sliders: ["placeFocus", "establishTime", "returns"] },
        { label: "Change over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Sitcom home base", plain: "The same familiar kitchen we keep coming back to.", set: { setting: "kitchen", familiarity: 0, returns: "home base", placeFocus: "felt", establishTime: 2 } },
        { label: "Strange new world", plain: "Linger on an unfamiliar place until it feels alive.", set: { familiarity: 5, homeTurf: "a stranger's", placeFocus: "a character itself", establishTime: 8 } },
      ],
    },
  });

  W.add("temperature", {
    sliders: [
      ["bodyReaction", "How bodies react", ["at ease", "fidgeting", "fanning or hugging selves", "suffering"], "What the heat or cold makes people do with their bodies."],
      ["breathSweat", "Sweat or breath you can see", ["none", "a little", "plenty", "dripping or fogging"], "Visible signs on skin and air: beads of sweat or clouds of breath."],
      ["whoFeels", "Who feels it", ["nobody", "one person", "some", "everyone"], "Whether one person suffers alone or the whole room shares it."],
      ["tensionLink", "Heat follows the tension", ["no link", "loosely", "closely"], "Whether the room gets hotter or colder as the scene gets tense."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "cold", right: "hot" },
        { face: "ladder", slider: "bodyReaction" },
        { face: "dial", slider: "shown" },
      ],
      groups: [
        { label: "The temperature", sliders: ["setting", "shown", "tensionLink"] },
        { label: "On the bodies", sliders: ["bodyReaction", "breathSweat", "whoFeels"] },
        { label: "Change over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Do the Right Thing heatwave", plain: "Everyone sweating, tempers rising with the heat.", set: { setting: "hot", shown: 5, breathSweat: "dripping or fogging", whoFeels: "everyone", tensionLink: "closely" } },
        { label: "Fargo winter", plain: "Cold breath in every shot, nobody comments on it.", set: { setting: "cold", shown: 3, breathSweat: "plenty", bodyReaction: "fanning or hugging selves" } },
        { label: "Comfortable room", plain: "Nobody notices the air at all.", set: { setting: "mild", shown: 0, bodyReaction: "at ease", whoFeels: "nobody" } },
      ],
    },
  });

  W.add("props", {
    sliders: [
      ["propFocus", "Camera singles it out", ["never", "in passing", "lingers", "close-up of it alone"], "How much the camera steers our eye to the object."],
      ["setupPayoff", "Shown before it matters", ["no setup", "shown once", "planted early", "planted and repeated"], "Whether the object is planted early so it pays off later, like a gun on the wall."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "count" },
        { face: "ladder", slider: "importance" },
        { face: "tiles", slider: "handling", icons: { ignored: "🙈", touched: "✋", used: "🔧", "fought over": "🤼" } },
      ],
      groups: [
        { label: "The objects", sliders: ["count", "era", "condition"] },
        { label: "How the story uses them", sliders: ["importance", "handling", "setupPayoff"] },
        { label: "Where the eye goes", sliders: ["propFocus"] },
      ],
      presets: [
        { label: "Chekhov's gun", plain: "One object planted early that the scene turns on.", set: { count: 1, importance: "the key to the scene", setupPayoff: "planted and repeated", propFocus: "close-up of it alone" } },
        { label: "Lived-in background", plain: "Plenty of things around, nobody pays them mind.", set: { count: 8, importance: "dressing", handling: "touched", propFocus: "in passing" } },
        { label: "Tug of war", plain: "Everyone wants the same thing.", set: { count: 1, importance: "important", handling: "fought over", propFocus: "lingers" } },
      ],
    },
  });

  W.add("intExt", {
    sliders: [
      ["outsideSound", "Outside sound leaking in", [0, 5, ""], "How much traffic, birds or rain you hear through the walls."],
      ["threshold", "Crossing in and out", ["stays put", "glimpses out", "steps through", "back and forth"], "How much the characters move across the door between inside and outside."],
      ["shelter", "How safe inside feels", ["exposed", "thin walls", "sheltered", "sealed off"], "Whether the inside feels like protection or barely keeps the world out."],
      ["pullOutside", "Eye pulled to the outside", ["ignored", "noticed", "drawn to it", "longing"], "How strongly the audience is made to look out through windows and doors."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { interior: "🏠", exterior: "🌄" } },
        { face: "mixer", sliders: ["view", "outsideSound"] },
        { face: "ladder", slider: "shelter" },
      ],
      groups: [
        { label: "Inside or out", sliders: ["setting", "threshold", "shelter"] },
        { label: "The world beyond", sliders: ["view", "outsideSound", "pullOutside"] },
        { label: "Change over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Rear Window", plain: "Stuck inside, eyes always on the world outside.", set: { setting: "interior", view: 5, pullOutside: "longing", threshold: "stays put" } },
        { label: "Siege at the door", plain: "Sealed inside while the outside presses in.", set: { setting: "interior", shelter: "sealed off", outsideSound: 5, view: 1 } },
        { label: "Open road", plain: "Out in the open with nothing to hide behind.", set: { setting: "exterior", shelter: "exposed", threshold: "steps through" } },
      ],
    },
  });

  W.add("weather", {
    sliders: [
      ["wind", "Wind", [0, 5, ""], "How hard the wind blows hair, clothes and things around."],
      ["onPeople", "How it marks the people", ["untouched", "a little", "soaked or coated", "battered"], "How wet, dusty or beaten the characters get."],
      ["moodMatch", "Weather and feeling", ["fights the mood", "neutral", "echoes the mood", "is the mood"], "Whether the sky agrees with what the characters feel or goes against it."],
      ["buildUp", "How it builds", ["steady", "gathers", "comes in waves", "breaks suddenly"], "How the weather grows over the scene, from steady to a sudden downpour."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { clear: "☀️", rain: "🌧️", dust: "🌪️" } },
        { face: "pad", x: "strength", y: "wind", xLabel: "Strength", yLabel: "Wind" },
        { face: "ladder", slider: "onPeople" },
      ],
      groups: [
        { label: "The sky", sliders: ["setting", "strength", "wind"] },
        { label: "On the people", sliders: ["onPeople", "moodMatch"] },
        { label: "Change over time", sliders: ["buildUp", "change"] },
      ],
      presets: [
        { label: "Rain-soaked confession", plain: "Heavy rain that matches the heartbreak.", set: { setting: "rain", strength: 5, onPeople: "soaked or coated", moodMatch: "is the mood" } },
        { label: "Mad Max dust storm", plain: "Dust gathers and then hits all at once.", set: { setting: "dust", strength: 5, wind: 5, buildUp: "breaks suddenly", onPeople: "battered" } },
        { label: "Sunny day, bad news", plain: "A bright clear sky that fights the sad moment.", set: { setting: "clear", strength: 0, wind: 1, moodMatch: "fights the mood" } },
      ],
    },
  });

  W.add("scale", {
    sliders: [
      ["personSize", "People against the place", ["fill it", "comfortable", "small in it", "specks"], "How big the people look inside the space around them."],
      ["feelSize", "Feels bigger or smaller", ["smaller than it is", "true size", "bigger than it is"], "Whether the place is made to feel tighter or vaster than it really is."],
      ["sizeReveal", "How its size is revealed", ["known from the start", "bit by bit", "one big reveal"], "Whether we learn the full size at once or get a big reveal later."],
    ],
    window: {
      faces: [
        { face: "frame", size: "personSize" },
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "people" },
      ],
      groups: [
        { label: "The size", sliders: ["setting", "feelSize", "people"] },
        { label: "People in it", sliders: ["personSize", "noticeable"] },
        { label: "Over time", sliders: ["sizeReveal"] },
      ],
      presets: [
        { label: "Lawrence of Arabia vastness", plain: "Tiny figures in an endless place, revealed in one shot.", set: { setting: "city", personSize: "specks", feelSize: "bigger than it is", sizeReveal: "one big reveal" } },
        { label: "Phone booth pressure", plain: "A tiny space the person fills completely.", set: { setting: "closet", personSize: "fill it", feelSize: "smaller than it is", people: 1 } },
      ],
    },
  });

  W.add("layoutOpen", {
    sliders: [
      ["obstacles", "Things in the way", [0, 5, ""], "How much furniture and stuff people must step around."],
      ["paths", "Ways through", ["one way", "a couple", "many"], "How many routes there are across the space."],
      ["roaming", "How much people move", ["stand still", "shift", "walk through", "roam"], "How freely the actors move around in the space."],
      ["closingIn", "Space grows or shrinks", ["opens up", "holds", "closes in"], "Whether the space seems to open up or press in as the scene goes on."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "closingIn", left: "opens up", right: "closes in" },
        { face: "dial", slider: "obstacles" },
      ],
      groups: [
        { label: "The floor", sliders: ["setting", "obstacles", "paths"] },
        { label: "Moving through it", sliders: ["roaming", "closingIn"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Submarine claustrophobia", plain: "Cramped, one way through, walls closing in.", set: { setting: "cramped", paths: "one way", obstacles: 4, closingIn: "closes in" } },
        { label: "Musical dance floor", plain: "Wide open space for people to roam.", set: { setting: "wide open", obstacles: 0, paths: "many", roaming: "roam" } },
      ],
    },
  });

  W.add("setLayout", {
    sliders: [
      ["zones", "Areas in the room", [1, 8, ""], "How many separate areas the room splits into."],
      ["entrances", "Ways in and out", [1, 6, ""], "How many doors and openings people can come through."],
      ["heightLevels", "Steps and levels", ["flat", "a step or two", "raised areas", "many levels"], "How much the floor rises and falls, giving people higher and lower ground."],
      ["focalPoint", "What the room points to", ["nowhere", "a counter or bar", "the center", "a stage or balcony"], "The spot the layout steers the eye and the people toward.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "one long bar": "🍸", "booths along the walls": "🛋️", "tables in the middle": "🍽️", islands: "🏝️", "levels and balconies": "🏛️" } },
        { face: "mixer", sliders: ["zones", "entrances"] },
        { face: "ladder", slider: "heightLevels" },
      ],
      groups: [
        { label: "The plan", sliders: ["setting", "zones", "entrances"] },
        { label: "Height and focus", sliders: ["heightLevels", "focalPoint"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Casablanca nightclub", plain: "Tables, a bar and a stage, many doors for entrances.", set: { setting: "tables in the middle", zones: 4, entrances: 3, focalPoint: "a stage or balcony" } },
        { label: "Diner booth talk", plain: "Simple booths along a counter, all on one level.", set: { setting: "booths along the walls", zones: 2, heightLevels: "flat", focalPoint: "a counter or bar" } },
        { label: "Grand staircase entrance", plain: "Levels and balconies made for a big entrance.", set: { setting: "levels and balconies", heightLevels: "many levels", focalPoint: "a stage or balcony" } },
      ],
    },
  });

  W.add("crowdLens", {
    sliders: [
      ["crowdFocus", "Crowd pulls the eye", ["background", "noticed", "shares the frame", "the star"], "How much the crowd steals attention from the main people."],
      ["grow", "How the crowd builds", ["holds", "trickles in", "swells", "floods"], "Whether the crowd stays the same or grows over the scene."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "count" },
        { face: "tiles", slider: "spread", icons: { clustered: "🫂", scattered: "🎲", "in rows": "🪖", "in a ring": "⭕" } },
        { face: "dial", slider: "ripple" },
      ],
      groups: [
        { label: "The crowd", sliders: ["count", "variety", "spread"] },
        { label: "Moving together", sliders: ["sync", "follow", "ripple"] },
        { label: "Attention and time", sliders: ["crowdFocus", "grow"] },
      ],
      presets: [
        { label: "Busby Berkeley unison", plain: "Identical dancers in rows moving perfectly together.", set: { count: "a crowd", variety: "clones", sync: "perfect unison", spread: "in rows", crowdFocus: "the star" } },
        { label: "Stadium wave", plain: "A huge crowd following one leader with a rippling delay.", set: { count: "a sea", follow: "all follow", ripple: 4, sync: "loosely together" } },
        { label: "Busy street extras", plain: "Different people going their own ways behind the scene.", set: { count: "a group", variety: "everyone different", sync: "each on their own", crowdFocus: "background" } },
      ],
    },
  });

  W.add("envMotion", {
    sliders: [
      ["direction", "Which way it moves", ["toward us", "to the right", "away", "to the left"], "The main direction the wind, water or crowd travels in the frame.", { unordered: true }],
      ["rhythm", "Steady or gusty", ["steady", "pulsing", "gusty", "chaotic"], "Whether the motion is even or comes in bursts."],
      ["touches", "How it affects the people", ["passes them by", "brushes them", "they react", "they fight it"], "Whether the moving world leaves the characters alone or pushes them around."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { still: "🪨", wind: "🍃", crowd: "👥", water: "🌊", transit: "🚆" } },
        { face: "pad", x: "howMuch", y: "speed", xLabel: "How much", yLabel: "Speed" },
        { face: "compass", slider: "direction", angles: { "toward us": 180, "to the right": 90, away: 0, "to the left": 270 } },
      ],
      groups: [
        { label: "What moves", sliders: ["setting", "howMuch", "speed"] },
        { label: "How it moves", sliders: ["direction", "rhythm"] },
        { label: "On the people", sliders: ["touches"] },
      ],
      presets: [
        { label: "Train platform goodbye", plain: "Trains rush past steadily while two people talk.", set: { setting: "transit", howMuch: 4, speed: 5, rhythm: "pulsing", touches: "brushes them" } },
        { label: "Calm lakeside", plain: "Water barely moving, nothing disturbing anyone.", set: { setting: "water", howMuch: 1, speed: 1, rhythm: "steady", touches: "passes them by" } },
        { label: "Storm-blown chase", plain: "Gusty wind the characters have to fight.", set: { setting: "wind", howMuch: 5, speed: 4, rhythm: "gusty", touches: "they fight it" } },
      ],
    },
  });

  W.add("repeatInFrame", {
    sliders: [
      ["oddOne", "One that breaks the pattern", ["none", "subtle", "clear", "stands out"], "Whether a single thing breaks the repeating pattern and catches the eye."],
      ["recede", "Repeats into the distance", ["flat", "a few deep", "to a vanishing point"], "Whether the copies line up toward the horizon, pulling the eye deep."],
      ["builtUp", "How the copies appear", ["all at once", "one by one", "in waves"], "Whether the repeats are there from the start or appear over time."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "pattern", icons: { random: "🎲", rows: "📏", grid: "🔲", spiral: "🌀" } },
        { face: "ladder", slider: "oddOne" },
      ],
      groups: [
        { label: "The repeats", sliders: ["setting", "pattern", "recede"] },
        { label: "Catching the eye", sliders: ["oddOne"] },
        { label: "Change over time", sliders: ["builtUp", "change"] },
      ],
      presets: [
        { label: "The Apartment desk rows", plain: "Endless identical desks receding to a point.", set: { setting: 5, pattern: "rows", recede: "to a vanishing point", oddOne: "none" } },
        { label: "One red umbrella", plain: "A grid of sameness with one that breaks it.", set: { setting: 4, pattern: "grid", oddOne: "stands out" } },
      ],
    },
  });

  W.add("setStyle", {
    sliders: [
      ["styleSteal", "Place pulls focus", ["blends back", "noticed", "admired", "steals the scene"], "How much the look of the place draws the audience's eye away from the people."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { ancient: "🏺", rustic: "🪵", "old west": "🤠", victorian: "🕰️", "1920s glamour": "🍸", "1950s": "📻", industrial: "🏭", modern: "🪑", futuristic: "🚀" } },
        { face: "swatches", slider: "colorFamily", colors: { neutral: "#b8b2a7", warm: "#d98a4e", cool: "#5f8fb4", earthy: "#8a6a45", pastel: "#f2c4d6", saturated: "#e0322f" } },
        { face: "mixer", sliders: ["symmetry", "windows"] },
      ],
      groups: [
        { label: "Era and style", sliders: ["setting", "styleFamily", "realism"] },
        { label: "The room itself", sliders: ["ceiling", "windows", "symmetry", "colorFamily"] },
        { label: "Who it belongs to", sliders: ["wealth", "personal", "styleSteal"] },
      ],
      presets: [
        { label: "Wes Anderson dollhouse", plain: "Pastel, perfectly symmetrical, stylized and full of the owner.", set: { colorFamily: "pastel", symmetry: 5, realism: "stylized", personal: "full of the owner", styleSteal: "admired" } },
        { label: "Blade Runner future", plain: "Futuristic industrial space under a high ceiling.", set: { setting: "futuristic", styleFamily: "futurist", ceiling: "cathedral", colorFamily: "cool", styleSteal: "steals the scene" } },
        { label: "Great Gatsby party", plain: "Rich 1920s glamour, maximal and showy.", set: { setting: "1920s glamour", styleFamily: "maximal", wealth: "palatial", colorFamily: "warm" } },
      ],
    },
  });

  W.add("setMaterial", {
    sliders: [
      ["texture", "Rough or smooth", ["rough", "grainy", "even", "polished"], "How the surfaces would feel under a hand."],
      ["shine", "How much it shines", [0, 5, ""], "How much the surfaces reflect light back at the camera."],
      ["ageMarks", "Marks of age", ["none", "a few", "plenty", "crumbling"], "Cracks, rust and scratches that tell how old the place is."],
      ["touched", "People touch it", ["never", "in passing", "lean and lay hands", "the scene uses it"], "How much the characters physically use the walls, tables and floor."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "setting", colors: { "dirt and rough wood": "#6b4a2b", wood: "#a0703f", brick: "#a5452f", stone: "#8c8a84", metal: "#7d8a93", glass: "#bcdfe8", marble: "#eeebe4" } },
        { face: "pad", x: "texture", y: "shine", xLabel: "Rough to polished", yLabel: "Shine" },
      ],
      groups: [
        { label: "The material", sliders: ["setting", "texture", "shine"] },
        { label: "Its history", sliders: ["ageMarks", "touched"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Cold corporate glass", plain: "Glass and polish everywhere, untouched.", set: { setting: "glass", texture: "polished", shine: 5, ageMarks: "none", touched: "never" } },
        { label: "Old castle stone", plain: "Rough crumbling stone people lean against.", set: { setting: "stone", texture: "rough", shine: 0, ageMarks: "crumbling", touched: "lean and lay hands" } },
      ],
    },
  });

  W.add("setLines", {
    sliders: [
      ["corners", "Sharp corners in frame", [0, 5, ""], "How many hard corners and edges cut through the picture."],
      ["leadEye", "Lines lead the eye", ["nowhere", "loosely", "toward the people", "straight to the subject"], "Whether the room's lines point the audience straight at what matters."],
      ["shapes", "Repeated shapes", ["none", "circles", "squares", "triangles", "stripes"], "A shape the room keeps repeating.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "soft", right: "sharp" },
        { face: "tiles", slider: "shapes", icons: { none: "▫️", circles: "⚪", squares: "⬛", triangles: "🔺", stripes: "🦓" } },
        { face: "ladder", slider: "leadEye" },
      ],
      groups: [
        { label: "The shapes", sliders: ["setting", "corners", "shapes"] },
        { label: "Guiding the eye", sliders: ["leadEye"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Kubrick corridor", plain: "Hard straight lines driving to one point.", set: { setting: "sharp and clean", corners: 5, leadEye: "straight to the subject", shapes: "squares" } },
        { label: "Cozy hobbit hole", plain: "Round doors and soft curves everywhere.", set: { setting: "soft and curved", corners: 0, shapes: "circles", leadEye: "loosely" } },
      ],
    },
  });

  W.add("wallArt", {
    sliders: [
      ["artKind", "Kind of art", ["paintings", "photos", "posters", "mirrors", "objects"], "What hangs on the walls.", { unordered: true }],
      ["artSize", "Size of the pieces", ["tiny", "small", "mixed", "large", "huge"], "How big the pieces are, from postcards to whole-wall murals."],
      ["artMeaning", "Art comments on the scene", ["just decor", "fits the owner", "hints at the story", "comments on the moment"], "Whether the art is just decoration or quietly says something about the scene."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "artKind", icons: { paintings: "🖼️", photos: "📷", posters: "📜", mirrors: "🪞", objects: "🗿" } },
        { face: "ladder", slider: "artMeaning" },
      ],
      groups: [
        { label: "The walls", sliders: ["setting", "artKind", "artSize"] },
        { label: "What it says", sliders: ["artMeaning"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Family photo wall", plain: "Many small photos that tell the family's story.", set: { setting: 4, artKind: "photos", artSize: "small", artMeaning: "hints at the story" } },
        { label: "Villain's portrait", plain: "One huge painting looming over the moment.", set: { setting: 1, artKind: "paintings", artSize: "huge", artMeaning: "comments on the moment" } },
      ],
    },
  });

  W.add("artArrangement", {
    sliders: [
      ["straightness", "Straight or crooked", ["crooked", "slightly off", "straight", "laser level"], "Whether the frames hang straight or tilt."],
      ["spacing", "Gaps between pieces", ["touching", "close", "even gaps", "wide apart"], "How much wall shows between the pieces."],
      ["centerpiece", "One piece in the middle", ["none", "a hint", "a clear centerpiece"], "Whether one piece is the obvious center of the wall."],
      ["framesFaces", "Art frames the faces", ["never", "by chance", "framing the face"], "Whether the art is placed so it frames a character's head and draws the eye there."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "pad", x: "straightness", y: "spacing", xLabel: "Straight", yLabel: "Spacing" },
        { face: "tiles", slider: "framesFaces", icons: { never: "🚫", "by chance": "🎲", "framing the face": "🖼️" } },
      ],
      groups: [
        { label: "The arrangement", sliders: ["setting", "straightness", "spacing"] },
        { label: "Focus", sliders: ["centerpiece", "framesFaces"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Gallery perfection", plain: "Even, level, one clear centerpiece.", set: { setting: "perfectly even", straightness: "laser level", spacing: "even gaps", centerpiece: "a clear centerpiece" } },
        { label: "Something's off", plain: "Crooked frames hint the world is tilting.", set: { setting: "scattered", straightness: "crooked", centerpiece: "none" } },
      ],
    },
  });

  W.add("clutter", {
    sliders: [
      ["mess", "What the mess is", ["papers", "dishes", "clothes", "tools", "junk", "collections"], "The kind of things lying around.", { unordered: true }],
      ["order", "Messy or organized", ["chaos", "messy", "piled", "organized hoard"], "Whether the stuff is strewn anywhere or kept in neat piles."],
      ["inTheWay", "Gets in people's way", ["never", "sometimes", "often", "they trip"], "How much the clutter blocks or trips the characters."],
      ["pilesUp", "Over the film", ["cleared away", "stays", "piles up", "buries them"], "Whether the mess grows as things fall apart or gets cleaned up."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "mess", icons: { papers: "📄", dishes: "🍽️", clothes: "👕", tools: "🔧", junk: "📦", collections: "🧸" } },
        { face: "ladder", slider: "pilesUp" },
      ],
      groups: [
        { label: "The stuff", sliders: ["setting", "mess", "order"] },
        { label: "In the way", sliders: ["inTheWay"] },
        { label: "Change over time", sliders: ["pilesUp", "noticeable", "change"] },
      ],
      presets: [
        { label: "Breakdown apartment", plain: "Dishes and junk piling up as the character falls apart.", set: { setting: 5, mess: "dishes", order: "chaos", pilesUp: "buries them" } },
        { label: "Mad scientist lab", plain: "Tools everywhere, but they know where everything is.", set: { setting: 4, mess: "tools", order: "organized hoard", inTheWay: "often" } },
      ],
    },
  });

  W.add("setUpkeep", {
    sliders: [
      ["dust", "Dust and grime", [0, 5, ""], "How much dust and dirt coats the surfaces."],
      ["repairs", "Signs of repair", ["none", "patched", "half fixed", "freshly redone"], "Whether someone has tried to fix the place."],
      ["decay", "Over the film", ["gets fixed up", "stays", "slips", "falls apart"], "Whether the place improves or falls apart as the story goes."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "dust" },
        { face: "balance", slider: "decay", left: "fixed up", right: "falls apart" },
      ],
      groups: [
        { label: "The care", sliders: ["setting", "dust", "repairs"] },
        { label: "Change over time", sliders: ["decay", "change"] },
        { label: "How it shows", sliders: ["noticeable"] },
      ],
      presets: [
        { label: "Grey Gardens decay", plain: "A once-grand house falling apart.", set: { setting: "ruined", dust: 5, repairs: "none", decay: "falls apart" } },
        { label: "Fixer-upper montage", plain: "Shabby at first, fixed up over the film.", set: { setting: "shabby", repairs: "half fixed", decay: "gets fixed up" } },
      ],
    },
  });

  W.add("setDepth", {
    sliders: [
      ["backLife", "Life in the background", ["empty", "still people", "some movement", "busy"], "How much is happening in the deep parts of the frame."],
      ["doorways", "Frames within frames", [0, 5, ""], "How many doorways and arches stack up behind the people."],
      ["depthPull", "Background draws the eye", ["never", "now and then", "shares focus", "pulls focus"], "Whether something deep in the frame steals attention from the front."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "doorways" },
        { face: "tiles", slider: "backLife", icons: { empty: "▫️", "still people": "🧍", "some movement": "🚶", busy: "🏃" } },
      ],
      groups: [
        { label: "The depth", sliders: ["setting", "doorways"] },
        { label: "What lives back there", sliders: ["backLife", "depthPull"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Citizen Kane depth", plain: "Rooms beyond rooms with action in the back.", set: { setting: "deep", doorways: 4, backLife: "some movement", depthPull: "shares focus" } },
        { label: "Interview against a wall", plain: "Flat background, nothing behind them.", set: { setting: "flat wall", doorways: 0, backLife: "empty", depthPull: "never" } },
      ],
    },
  });

  W.add("setBrightness", {
    sliders: [
      ["contrast", "Light and dark side by side", [0, 5, ""], "How strongly light and dark surfaces sit next to each other."],
      ["popOut", "People pop against it", ["sink in", "blend", "stand clear", "jump out"], "Whether the background makes the characters stand out or swallows them."],
      ["accent", "Bright accents", ["none", "one small", "a few", "many"], "Spots of bright color that catch the eye."],
      ["darkens", "Over the film", ["lightens", "holds", "darkens"], "Whether the set's colors get darker or lighter as the story goes."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "setting", colors: { dark: "#222222", dull: "#55524d", middle: "#8a8680", light: "#c9c4bb", bright: "#f5f1e8" } },
        { face: "dial", slider: "contrast" },
        { face: "balance", slider: "darkens", left: "lightens", right: "darkens" },
      ],
      groups: [
        { label: "The colors", sliders: ["setting", "contrast", "accent"] },
        { label: "People against it", sliders: ["popOut"] },
        { label: "Change over time", sliders: ["darkens", "noticeable", "change"] },
      ],
      presets: [
        { label: "Film noir office", plain: "Dark walls, people jumping out of the shadows.", set: { setting: "dark", contrast: 5, popOut: "jump out", accent: "none" } },
        { label: "Bright sitcom set", plain: "Light even colors with a few cheerful accents.", set: { setting: "bright", contrast: 1, accent: "a few", popOut: "stand clear" } },
      ],
    },
  });

  W.add("scatterLens", {
    sliders: [
      ["clearPath", "Clear path through it", ["none", "faint", "a clear path"], "Whether there is a path through the scattered things, leading the eye."],
      ["disturbed", "People disturb it", ["never", "stir it", "kick through", "destroy it"], "How much the characters disturb the scattered things as they move."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "what", icons: { grass: "🌱", rocks: "🪨", leaves: "🍂", trash: "🗑️", flowers: "🌸", trees: "🌲" } },
        { face: "dial", slider: "how" },
        { face: "ladder", slider: "spread" },
      ],
      groups: [
        { label: "What is scattered", sliders: ["how", "what", "sizes"] },
        { label: "How it lies", sliders: ["spread", "clearPath"] },
        { label: "Movement", sliders: ["moves", "disturbed"] },
      ],
      presets: [
        { label: "Autumn walk", plain: "Leaves everywhere, swaying, kicked up underfoot.", set: { what: "leaves", how: 4, moves: "sways", disturbed: "kick through", clearPath: "faint" } },
        { label: "Days of Heaven field", plain: "Grass as far as the eye can see, swaying in the wind.", set: { what: "grass", how: 5, spread: "natural", moves: "sways", disturbed: "stir it" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
