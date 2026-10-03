/* Wardrobe and set design. The app's lenses.js already has these lenses (main character's clothes, background
   clothes, set design) with their sliders as curiosities (mainEra, mainCost, setStyle, wallArt...), imported in
   db-catalog.js. This file adds the sliders those lenses lack, on each lens's main curiosity, plus props, and the
   suites and proximities for wardrobe and sets.
   Jeremy, 2026-10-02 12:36Z: wardrobe for main and background characters (era, cost, skin coverage, utility),
   set design (style, materials, line sharpness, amount and arrangement of wall art, layout). */
(function (DB) {
  const MORE_CLOTHES = (who) => [
    ["loudness", "Quiet or loud", [0, 5], `How much the ${who} clothes demand attention: muted to loud colors and patterns.`],
    ["layers", "Layers", [1, 6], "How many layers are worn."],
    ["accessories", "Accessories", [0, 5], "Jewelry, hats, bags, glasses: none to many."],
    ["hairMakeup", "Hair and makeup", ["undone", "natural", "styled", "dramatic", "theatrical"], "How done-up hair and face are."],
  ];

  DB.curiosity({
    id: "mainEra",
    sliders: MORE_CLOTHES("main character's").concat([
      ["truth", "True to them", ["their own style", "borrowed", "uniform", "disguise"], "Whether the clothes are who the character is, or something they put on."],
      ["outfitChange", "Change since last scene", ["same outfit", "one piece changed", "new outfit", "transformation"], "How much the look changed from the previous scene."],
    ]),
  });
  DB.curiosity({
    id: "backEra",
    sliders: MORE_CLOTHES("background").concat([
      ["formality", "Casual to formal", ["sleepwear", "casual", "neat casual", "business", "formal", "ceremony"], "How dressed up the background people are."],
      ["colorCode", "Color coding", ["none", "loose", "strict"], "Whether groups are told apart by color (one team in red, the other in blue)."],
    ]),
  });
  DB.curiosity({
    id: "setStyle",
    sliders: [
      ["styleFamily", "Style family", ["rustic", "classical", "industrial", "mid-century", "minimal", "maximal", "futurist", "fantasy"], "The broad design family.", { unordered: true }],
      ["ceiling", "Ceiling height", ["low", "normal", "high", "cathedral", "open sky"], "How high the space goes."],
      ["wealth", "Wealth", ["poor", "modest", "comfortable", "rich", "palatial"], "How much money the place shows."],
      ["symmetry", "Symmetry", [0, 5], "How balanced and mirrored the set is, from random to perfectly symmetrical."],
      ["windows", "Windows and openings", [0, 5], "How many windows, doors and openings let light and views in."],
      ["colorFamily", "Main color", ["neutral", "warm", "cool", "earthy", "pastel", "saturated"], "The main color family of walls and furniture.", { unordered: true }],
      ["personal", "Personal or anonymous", ["anonymous", "a little personal", "full of the owner"], "How much the place tells us about who lives there."],
      ["realism", "Real or stylized", ["real location", "dressed real", "stylized", "theatrical", "dreamlike"], "Whether the set looks like a real place or a designed one."],
    ],
  });

  DB.curiosity({
    id: "props",
    label: "Props",
    workspace: "set",
    also: ["placement", "movement-lines"],
    group: "Sets",
    plain: "The objects characters touch and use, and how much the story leans on them.",
    main: "count",
    sliders: [
      ["count", "Props in use", [0, 10], "How many objects the characters handle in the scene."],
      ["importance", "Story weight", ["dressing", "useful", "important", "the key to the scene"], "From set dressing to the object the scene turns on."],
      ["era", "Era", ["ancient", "medieval", "1700s", "1800s", "old west", "1920s", "1950s", "1970s", "1990s", "today", "future"], "When the props come from."],
      ["condition", "Condition", ["brand new", "clean", "worn", "broken"], "How used the objects are."],
      ["handling", "How handled", ["ignored", "touched", "used", "fought over"], "What happens to the props."],
    ],
  });

  /* ---------- suites ---------- */
  const S = (id, label, plain, workspace, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  S("dive-bar", "Dive bar", "Rough wood, a shabby room, clutter, posters stuck up anywhere, cheap worn clothes on the crowd.", "set", [
    { curiosity: "setMaterial", value: "wood" },
    { curiosity: "setUpkeep", value: "shabby" },
    { curiosity: "clutter", value: 4 },
    { curiosity: "artArrangement", value: "scattered" },
    { curiosity: "backCost", value: "cheap", weight: 70 },
  ], { also: ["wardrobe", "background"] });
  S("upscale-lounge", "Upscale lounge", "Marble and glass, sharp clean lines, a few pieces of art in neat rows, formal expensive clothes.", "set", [
    { curiosity: "setMaterial", value: "marble" },
    { curiosity: "setLines", value: "sharp and clean" },
    { curiosity: "artArrangement", value: "neat rows" },
    { curiosity: "setStyle", slider: "wealth", value: "rich" },
    { curiosity: "backEra", slider: "formality", value: "formal", weight: 70 },
  ], { also: ["wardrobe"] });
  S("period-piece", "Period piece", "Everything from one earlier time: clothes, sets and props agree.", "set", [
    { curiosity: "mainEra", value: "1950s" },
    { curiosity: "backEra", value: "1950s" },
    { curiosity: "setStyle", value: "1950s" },
    { curiosity: "backPeriodTruth", value: "exact" },
    { curiosity: "props", slider: "era", value: "1950s" },
  ], { also: ["wardrobe", "structure"] });
  S("anachronism", "Deliberate anachronism", "One thing from the wrong time on purpose: today's clothes in a Victorian room.", "wardrobe", [
    { curiosity: "mainEra", value: "today" },
    { curiosity: "setStyle", value: "victorian" },
    { curiosity: "mainSetMatch", value: "clashes" },
  ], { also: ["set", "comedy"] });
  S("minimalist-cold", "Cold minimalism", "Bare rooms, sharp lines, perfect symmetry, people in plain fitted clothes.", "set", [
    { curiosity: "clutter", value: 0 },
    { curiosity: "wallArt", value: 0 },
    { curiosity: "setLines", value: "sharp and clean" },
    { curiosity: "setStyle", slider: "symmetry", value: 5 },
    { curiosity: "mainEra", slider: "loudness", value: 0, weight: 70 },
  ]);
  S("maximalist-warm", "Warm maximalism", "Rooms stuffed with color, art and objects; layered, loud clothes.", "set", [
    { curiosity: "clutter", value: 5 },
    { curiosity: "wallArt", value: 5 },
    { curiosity: "setStyle", slider: "colorFamily", value: "warm" },
    { curiosity: "mainEra", slider: "layers", value: 4, weight: 70 },
    { curiosity: "mainEra", slider: "loudness", value: 4, weight: 70 },
  ], { also: ["wardrobe"] });
  S("working-uniform", "Working uniform", "Everyone in the same practical gear, the main character marked only by small details.", "wardrobe", [
    { curiosity: "backUtility", value: "all function" },
    { curiosity: "backFunction", value: "work wear" },
    { curiosity: "backSameness", value: "uniforms" },
    { curiosity: "backVsMain", value: "main blends in" },
  ], { also: ["herd"] });
  S("dressed-to-impress", "Dressed to impress", "The main character overdressed for the place, standing out from everyone.", "wardrobe", [
    { curiosity: "mainFormality", value: "formal" },
    { curiosity: "mainSetMatch", value: "stands out" },
    { curiosity: "backVsMain", value: "main is the only one dressed that way" },
  ], { also: ["comedy", "arc"] });
  S("falling-apart", "Falling apart", "A character's clothes and room decaying together as their life does.", "wardrobe", [
    { curiosity: "mainWear", value: "torn and dirty" },
    { curiosity: "setUpkeep", value: "ruined" },
    { curiosity: "clutter", value: 5 },
  ], { also: ["set", "arc", "emotion"] });
  S("lived-in-home", "Lived-in home", "A personal, cluttered, warm home with photos on the walls and comfortable clothes.", "set", [
    { curiosity: "setStyle", slider: "personal", value: "full of the owner" },
    { curiosity: "setUpkeep", value: "lived in" },
    { curiosity: "artArrangement", value: "loose groups" },
    { curiosity: "mainFormality", value: "casual" },
  ]);
  S("frontier", "Frontier", "Old west clothes made for riding and work, rough wood rooms, everything worn.", "wardrobe", [
    { curiosity: "mainEra", value: "old west" },
    { curiosity: "mainFunction", value: "riding (chaps, boots)" },
    { curiosity: "setStyle", value: "old west" },
    { curiosity: "setMaterial", value: "dirt and rough wood" },
    { curiosity: "mainWear", value: "worn in" },
  ], { also: ["set"] });

  /* ---------- proximities ---------- */
  const P = (id, label, plain, workspace, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  P("change-outfit-change-self", "A new outfit marks a change in the character", "When a main character's look transforms, their arc moves on within one scene (about eight beats).", "wardrobe", { curiosity: "mainEra", slider: "outfitChange", is: "transformation" }, { curiosity: "arcStage", change: "rises" }, 8, { also: ["arc"] });
  P("disguise-reveal", "A disguise is followed by its unmasking", "A character in disguise is unmasked within a few scenes.", "wardrobe", { curiosity: "mainEra", slider: "truth", is: "disguise" }, { curiosity: "reveal", change: "changes" }, 24, { also: ["structure", "comedy"] });
  P("clutter-close", "In a cluttered room, the shots get closer", "Cluttered sets are followed by closer shots within two beats, to find people among the things.", "set", { curiosity: "clutter", change: "rises" }, { curiosity: "shotSize", is: "close" }, 2, { also: ["camera-angle"] });
  P("big-space-wide", "In a huge space, the frame goes wide", "Big spaces are shown in wide shots within one beat, to make people small.", "set", { curiosity: "scale", is: "city" }, { curiosity: "shotSize", is: "wide" }, 1, { also: ["camera-angle"] });
  P("clash-noticed", "Clashing clothes get noticed", "When a character's clothes clash with the place, someone reacts within two beats.", "wardrobe", { curiosity: "mainSetMatch", is: "clashes" }, { curiosity: "comicReaction", change: "rises" }, 2, { also: ["comedy"] });
  P("prop-key-insert", "A key prop gets its close-up", "When a prop becomes the key to the scene, an insert shot of it follows within one beat.", "set", { curiosity: "props", slider: "importance", is: "the key to the scene" }, { curiosity: "shotSize", is: "insert" }, 1, { also: ["camera-angle"] });
  P("decay-mood", "A run-down room darkens the mood", "Run-down sets are followed by a gloomier place mood within two beats.", "set", { curiosity: "setUpkeep", change: "drops" }, { curiosity: "settingMood", change: "drops" }, 2, { also: ["emotion"] });

  DB.proximitySuite({ id: "clothes-tell-the-story", label: "Clothes tell the story", workspace: "wardrobe", also: ["arc"], plain: "What people wear changes when they change, gives them away, and gets noticed.", members: ["change-outfit-change-self", "disguise-reveal", "clash-noticed", "upkeep-wear"] });
  DB.proximitySuite({ id: "set-steers-the-camera", label: "The set steers the camera", workspace: "set", also: ["camera-angle"], plain: "The size, clutter and props of a set decide how close the camera gets.", members: ["clutter-close", "big-space-wide", "prop-key-insert"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
