/* Wardrobe & sets: what people wear and the world they stand in.
   Jeremy, 2026-10-02 12:36Z: wardrobe for main and background characters (era, cost, skin coverage, utility),
   set design (style, materials, line sharpness, amount and arrangement of wall art, layout). */
(function (DB) {
  const W = "design";
  const ERA = ["ancient", "medieval", "1700s to 1800s", "1900s to 1940s", "1950s to 1970s", "1980s to 1990s", "2000s", "today", "near future", "far future"];

  const wardrobe = (id, label, who, plain) =>
    DB.curiosity({
      id,
      label,
      workspace: W,
      also: who === "main" ? ["arc"] : ["background"],
      group: "Wardrobe",
      per: who === "main" ? "character per panel" : "panel",
      plain,
      main: "era",
      sliders: [
        ["era", "Era", ERA, "What time the clothes come from, whatever time the scene is set in."],
        ["cost", "Cost", ["rags", "cheap", "ordinary", "expensive", "couture"], "How much the clothes look like they cost."],
        ["coverage", "Skin coverage", [0, 100, "% covered"], "How much of the body the clothes cover."],
        ["utility", "Made for use or show", ["pure show", "mostly show", "both", "mostly use", "pure work gear"], "Whether the clothes are for looking good or for doing a job (a ball gown to overalls)."],
        ["formality", "Formality", ["sleepwear", "casual", "smart casual", "business", "formal", "ceremonial"], "How dressed up."],
        ["fit", "Fit", ["swamped", "loose", "fitted", "tight"], "How the clothes sit on the body."],
        ["wear", "Wear", ["brand new", "clean", "worn", "stained", "in shreds"], "How used and damaged the clothes are."],
        ["loudness", "Quiet or loud", [0, 5], "How much the clothes demand attention: muted to loud colors and patterns."],
        ["layers", "Layers", [1, 6], "How many layers they have on."],
        ["blend", "Blends with the set", ["melts into it", "matches", "stands apart", "clashes"], "Whether the clothes match the room or pop out of it."],
        ["truth", "True to them", ["their own style", "borrowed", "uniform", "disguise"], "Whether the clothes are who the character is, or something they put on."],
        ["change", "Change since last scene", ["same outfit", "one piece changed", "new outfit", "transformation"], "How much the look changed from the previous scene."],
        ["accessories", "Accessories", [0, 5], "Jewelry, hats, bags, glasses: none to many."],
        ["hairMakeup", "Hair and makeup", ["undone", "natural", "styled", "dramatic", "theatrical"], "How done-up hair and face are."],
      ],
    });
  wardrobe("wardrobeMain", "Wardrobe: main characters", "main", "What the main characters wear, and what it says about them in this scene.");
  wardrobe("wardrobeBackground", "Wardrobe: background characters", "background", "What the extras and minor characters wear, which sets the world around the mains.");

  DB.curiosity({
    id: "wardrobeVariety",
    label: "Wardrobe variety in the crowd",
    workspace: W,
    also: ["background", "herd"],
    group: "Wardrobe",
    plain: "How alike or different everyone in the frame is dressed. All alike reads as a uniform, a cult or a period; all different reads as a city.",
    main: "variety",
    sliders: [
      ["variety", "Alike to varied", [0, 5], "From everyone dressed the same to nobody matching."],
      ["mainStandsOut", "Main stands out", [0, 5], "How much the main character's clothes separate them from the crowd."],
      ["colorCode", "Color coding", ["none", "loose", "strict"], "Whether groups are told apart by color (one team in red, the other in blue)."],
    ],
  });

  DB.curiosity({
    id: "setDesign",
    label: "Set design",
    workspace: W,
    also: ["background", "light"],
    group: "Sets",
    per: "scene",
    plain: "The room or place the scene happens in, as it was designed: its style, materials, lines, art, clutter and layout.",
    main: "style",
    sliders: [
      ["style", "Style era", ERA, "What time the design looks like it comes from."],
      ["styleFamily", "Style family", ["rustic", "classical", "industrial", "mid-century", "minimal", "maximal", "futurist", "fantasy"], "The broad design family.", { unordered: true }],
      ["materials", "Main material", ["raw earth and stone", "wood", "brick", "plaster and paint", "metal", "glass", "plastic", "screens"], "What the place is mostly made of, rough to slick."],
      ["lines", "Soft or sharp lines", ["round and soft", "mostly curved", "mixed", "mostly straight", "hard sharp angles"], "Whether shapes in the set are curved or angular."],
      ["wallArt", "Art on the walls", [0, 5], "How much art, posters or photos hang on the walls."],
      ["artArrangement", "How the art is hung", ["scattered", "loose cluster", "tidy row", "strict grid", "one centerpiece"], "How the wall art is arranged."],
      ["clutter", "Clutter", ["bare", "sparse", "lived in", "crowded", "hoarder"], "How many things fill the space."],
      ["layout", "Layout", ["open", "divided", "corridors", "cramped", "maze"], "How the space is laid out for people to move through."],
      ["size", "Size of the space", ["closet", "room", "hall", "warehouse", "landscape"], "How big the place is."],
      ["ceiling", "Ceiling height", ["low", "normal", "high", "cathedral", "open sky"], "How high the space goes."],
      ["wealth", "Wealth", ["poor", "modest", "comfortable", "rich", "palatial"], "How much money the place shows."],
      ["upkeep", "Upkeep", ["pristine", "clean", "worn", "neglected", "ruin"], "How cared for the place is."],
      ["symmetry", "Symmetry", [0, 5], "How balanced and mirrored the set is, from random to perfectly symmetrical."],
      ["depth", "Depth", ["flat", "some depth", "deep", "endless"], "How far back the space goes behind the actors."],
      ["windows", "Windows and openings", [0, 5], "How many windows, doors and openings let light and views in."],
      ["colorFamily", "Main color", ["neutral", "warm", "cool", "earthy", "pastel", "saturated"], "The main color family of walls and furniture.", { unordered: true }],
      ["personal", "Personal or anonymous", ["anonymous", "a little personal", "full of the owner"], "How much the place tells us about who lives there."],
      ["realism", "Real or stylized", ["real location", "dressed real", "stylized", "theatrical", "dreamlike"], "Whether the set looks like a real place or a designed one."],
    ],
  });

  DB.curiosity({
    id: "props",
    label: "Props",
    workspace: W,
    also: ["placement", "movement-lines"],
    group: "Sets",
    plain: "The objects characters touch and use, and how much the story leans on them.",
    main: "count",
    sliders: [
      ["count", "Props in use", [0, 10], "How many objects the characters handle in the scene."],
      ["importance", "Story weight", ["dressing", "useful", "important", "the key to the scene"], "From set dressing to the object the scene turns on."],
      ["era", "Era", ERA, "When the props come from."],
      ["condition", "Condition", ["brand new", "clean", "worn", "broken"], "How used the objects are."],
      ["handling", "How handled", ["ignored", "touched", "used", "fought over"], "What happens to the props."],
    ],
  });

  /* ---------- suites ---------- */
  const S = (id, label, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace: W, members }, extra || {}));
  S("dive-bar", "Dive bar", "Dark wood, worn surfaces, clutter, posters stuck up anywhere, cheap worn clothes on the crowd.", [
    { curiosity: "setDesign", slider: "materials", value: "wood" },
    { curiosity: "setDesign", slider: "upkeep", value: "worn" },
    { curiosity: "setDesign", slider: "clutter", value: "crowded" },
    { curiosity: "setDesign", slider: "artArrangement", value: "scattered" },
    { curiosity: "wardrobeBackground", slider: "cost", value: "cheap", weight: 70 },
  ], { also: ["background"] });
  S("upscale-lounge", "Upscale lounge", "Glass and metal, sharp lines, a few framed pieces in a row, expensive formal clothes.", [
    { curiosity: "setDesign", slider: "materials", value: "glass" },
    { curiosity: "setDesign", slider: "lines", value: "mostly straight" },
    { curiosity: "setDesign", slider: "artArrangement", value: "tidy row" },
    { curiosity: "setDesign", slider: "wealth", value: "rich" },
    { curiosity: "wardrobeBackground", slider: "formality", value: "formal", weight: 70 },
  ], { also: ["background"] });
  S("period-piece", "Period piece", "Everything from one earlier time: clothes, sets and props agree.", [
    { curiosity: "wardrobeMain", slider: "era", value: "1950s to 1970s" },
    { curiosity: "wardrobeBackground", slider: "era", value: "1950s to 1970s" },
    { curiosity: "setDesign", slider: "style", value: "1950s to 1970s" },
    { curiosity: "props", slider: "era", value: "1950s to 1970s" },
  ], { also: ["structure"] });
  S("anachronism", "Deliberate anachronism", "One thing from the wrong time on purpose: modern clothes in an old palace.", [
    { curiosity: "wardrobeMain", slider: "era", value: "today" },
    { curiosity: "setDesign", slider: "style", value: "1700s to 1800s" },
    { curiosity: "wardrobeMain", slider: "blend", value: "clashes" },
  ], { also: ["comedy"] });
  S("minimalist-cold", "Cold minimalism", "Bare rooms, hard lines, perfect symmetry, people in plain fitted clothes.", [
    { curiosity: "setDesign", slider: "clutter", value: "bare" },
    { curiosity: "setDesign", slider: "lines", value: "hard sharp angles" },
    { curiosity: "setDesign", slider: "symmetry", value: 5 },
    { curiosity: "wardrobeMain", slider: "loudness", value: 0, weight: 70 },
  ]);
  S("maximalist-warm", "Warm maximalism", "Rooms stuffed with color, art and objects; layered, loud clothes.", [
    { curiosity: "setDesign", slider: "clutter", value: "crowded" },
    { curiosity: "setDesign", slider: "wallArt", value: 5 },
    { curiosity: "setDesign", slider: "colorFamily", value: "warm" },
    { curiosity: "wardrobeMain", slider: "layers", value: 4, weight: 70 },
    { curiosity: "wardrobeMain", slider: "loudness", value: 4, weight: 70 },
  ]);
  S("working-uniform", "Working uniform", "Everyone in the same practical gear, the main character marked only by small details.", [
    { curiosity: "wardrobeBackground", slider: "utility", value: "pure work gear" },
    { curiosity: "wardrobeVariety", slider: "variety", value: 0 },
    { curiosity: "wardrobeVariety", slider: "mainStandsOut", value: 1 },
  ], { also: ["herd"] });
  S("dressed-to-impress", "Dressed to impress", "The main character overdressed for the place, standing out from everyone.", [
    { curiosity: "wardrobeMain", slider: "formality", value: "formal" },
    { curiosity: "wardrobeMain", slider: "blend", value: "stands apart" },
    { curiosity: "wardrobeVariety", slider: "mainStandsOut", value: 5 },
  ], { also: ["comedy", "arc"] });
  S("falling-apart", "Falling apart", "A character's clothes and room decaying together as their life does.", [
    { curiosity: "wardrobeMain", slider: "wear", value: "stained" },
    { curiosity: "setDesign", slider: "upkeep", value: "neglected" },
    { curiosity: "setDesign", slider: "clutter", value: "hoarder" },
  ], { also: ["arc", "emotion"] });
  S("lived-in-home", "Lived-in home", "A personal, cluttered, warm home with photos on the walls and comfortable clothes.", [
    { curiosity: "setDesign", slider: "personal", value: "full of the owner" },
    { curiosity: "setDesign", slider: "clutter", value: "lived in" },
    { curiosity: "setDesign", slider: "artArrangement", value: "loose cluster" },
    { curiosity: "wardrobeMain", slider: "formality", value: "casual" },
  ]);

  /* ---------- proximities ---------- */
  const P = (id, label, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace: W, when, then, within }, extra || {}));
  P("change-outfit-change-self", "A new outfit marks a change in the character", "When a main character's look transforms, their arc moves on within one scene (about eight beats).", { curiosity: "wardrobeMain", slider: "change", is: "transformation" }, { curiosity: "arcStage", change: "rises" }, 8, { also: ["arc"] });
  P("disguise-reveal", "A disguise is followed by its unmasking", "A character in disguise is unmasked within a few scenes.", { curiosity: "wardrobeMain", slider: "truth", is: "disguise" }, { curiosity: "reveal", change: "changes" }, 24, { also: ["structure", "comedy"] });
  P("clutter-close", "In a cluttered room, the shots get closer", "Cluttered sets are followed by closer shots within two beats, to find people among the things.", { curiosity: "setDesign", slider: "clutter", change: "rises" }, { curiosity: "shotSize", is: "close" }, 2, { also: ["camera-angle"] });
  P("big-space-wide", "In a huge space, the frame goes wide", "Big spaces are shown in wide shots within one beat, to make people small.", { curiosity: "setDesign", slider: "size", is: "warehouse" }, { curiosity: "shotSize", is: "wide" }, 1, { also: ["camera-angle"] });
  P("clash-noticed", "Clashing clothes get noticed", "When a character's clothes clash with the place, someone reacts within two beats.", { curiosity: "wardrobeMain", slider: "blend", is: "clashes" }, { curiosity: "reactionShot", slider: "count", change: "rises" }, 2, { also: ["comedy"] });
  P("prop-key-insert", "A key prop gets its close-up", "When a prop becomes the key to the scene, an insert shot of it follows within one beat.", { curiosity: "props", slider: "importance", is: "the key to the scene" }, { curiosity: "shotSize", is: "insert" }, 1, { also: ["camera-angle"] });
  P("decay-mood", "A neglected room darkens the mood", "Neglected sets are followed by a lower feeling within two beats.", { curiosity: "setDesign", slider: "upkeep", is: "neglected" }, { curiosity: "emotion", slider: "valence", change: "drops" }, 2, { also: ["emotion"] });

  DB.proximitySuite({ id: "clothes-tell-the-story", label: "Clothes tell the story", workspace: W, also: ["arc"], plain: "What people wear changes when they change, gives them away, and gets noticed.", members: ["change-outfit-change-self", "disguise-reveal", "clash-noticed"] });
  DB.proximitySuite({ id: "set-steers-the-camera", label: "The set steers the camera", workspace: W, also: ["camera-angle"], plain: "The size, clutter and props of a set decide how close the camera gets.", members: ["clutter-close", "big-space-wide", "prop-key-insert"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
