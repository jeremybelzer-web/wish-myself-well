/* Wardrobe: a window for every curiosity whose home is Wardrobe on the Screen. */
(function (W) {
  W.add("mainCost", {
    sliders: [
      ["labelsShow", "Labels on show", ["none", "quiet", "visible", "logos everywhere"], "How openly the brand names show on the clothes."],
      ["affordIt", "Can they afford it", ["below their means", "matches their means", "stretching", "faking it"], "Whether the price of the clothes fits the character's real money."],
      ["othersNotice", "Others notice the price", ["nobody", "a glance", "comments", "it's the point"], "How much other characters react to what the outfit cost."],
      ["costArc", "Richer or poorer over time", ["falls", "holds", "rises"], "Whether the clothes get cheaper or pricier as the story goes."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "costArc", left: "falls", right: "rises" },
        { face: "tiles", slider: "labelsShow", icons: { none: "👕", quiet: "🤫", visible: "🏷️", "logos everywhere": "💸" } },
      ],
      groups: [
        { label: "The price", sliders: ["setting", "labelsShow", "affordIt"] },
        { label: "What it tells others", sliders: ["othersNotice", "noticeable"] },
        { label: "Change over time", sliders: ["costArc", "change"] },
      ],
      presets: [
        { label: "Pretty Woman makeover", plain: "Cheap clothes become luxury and everyone notices.", set: { setting: "luxury", costArc: "rises", othersNotice: "it's the point", change: "snaps" } },
        { label: "Talented Mr. Ripley", plain: "Expensive clothes the character can't really afford.", set: { setting: "expensive", affordIt: "faking it", labelsShow: "quiet" } },
        { label: "Quiet old money", plain: "Very expensive, no labels, nobody mentions it.", set: { setting: "luxury", labelsShow: "none", othersNotice: "a glance", affordIt: "below their means" } },
      ],
    },
  });

  W.add("mainUtility", {
    sliders: [
      ["pockets", "Pockets and gear", [0, 5, ""], "How many pockets, straps and tools the outfit carries."],
      ["readyFor", "Ready for action", ["not at all", "could manage", "ready", "built for it"], "Whether they could run, climb or fight in these clothes."],
      ["fussing", "Fusses with how they look", ["never", "now and then", "constantly"], "How often the character straightens, checks or fixes the outfit."],
      ["savesDay", "Clothes save the day", ["never", "a small help", "a key moment"], "Whether a piece of clothing turns out to matter in the plot."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "looks", right: "function" },
        { face: "dial", slider: "pockets" },
        { face: "ladder", slider: "readyFor" },
      ],
      groups: [
        { label: "Looks or function", sliders: ["setting", "pockets", "readyFor"] },
        { label: "In the story", sliders: ["fussing", "savesDay"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Indiana Jones", plain: "All function, ready for anything, the hat matters.", set: { setting: "mostly function", pockets: 4, readyFor: "built for it", savesDay: "a key moment" } },
        { label: "Red carpet vanity", plain: "Only for looks, constantly checked.", set: { setting: "only for looks", pockets: 0, readyFor: "not at all", fussing: "constantly" } },
      ],
    },
  });

  W.add("mainFunction", {
    sliders: [
      ["gearCount", "Pieces of gear", [0, 8, ""], "How many separate protective or working pieces they wear."],
      ["wornRight", "Worn properly", ["half on", "loosely", "properly", "strapped tight"], "Whether the gear is fastened right or thrown on carelessly."],
      ["suitUp", "Suiting up on screen", ["already dressed", "a glimpse", "a suiting-up beat", "a full montage"], "How much screen time goes to putting the gear on, which builds anticipation."],
      ["gearDamage", "Gear takes damage", ["untouched", "scuffed", "damaged", "destroyed"], "How much the gear gets hurt as it does its job."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "👕", comfort: "🧸", warmth: "🧣", "work wear": "🦺", sport: "🏃", "riding (chaps, boots)": "🤠", "crash protection (bike jacket, helmet)": "🏍️", "flight or space suit": "🚀", armor: "🛡️" } },
        { face: "ladder", slider: "suitUp" },
        { face: "dial", slider: "gearCount" },
      ],
      groups: [
        { label: "The job", sliders: ["setting", "gearCount", "wornRight"] },
        { label: "In action", sliders: ["suitUp", "gearDamage"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Iron Man suit-up", plain: "Armor goes on piece by piece in a full montage.", set: { setting: "armor", gearCount: 8, suitUp: "a full montage", wornRight: "strapped tight" } },
        { label: "The Right Stuff walk", plain: "Space suits on, walking out ready.", set: { setting: "flight or space suit", suitUp: "a suiting-up beat", gearDamage: "untouched" } },
        { label: "Battered after the fight", plain: "Protective gear wrecked by the end.", set: { setting: "crash protection (bike jacket, helmet)", gearDamage: "destroyed", wornRight: "half on" } },
      ],
    },
  });

  W.add("mainFormality", {
    sliders: [
      ["rightForRoom", "Dressed for the room", ["underdressed", "right for it", "overdressed"], "Whether they are dressed below, at, or above what the place expects."],
      ["undone", "Crisp or coming undone", ["crisp", "neat", "loosened", "coming apart"], "Whether the tie, buttons and hair stay perfect or slowly come loose."],
      ["stance", "How the clothes make them stand", ["slouch", "easy", "upright", "stiff"], "How the outfit changes the way the body holds itself."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "rightForRoom", left: "underdressed", right: "overdressed" },
        { face: "tiles", slider: "undone", icons: { crisp: "👔", neat: "🙂", loosened: "😮‍💨", "coming apart": "🥴" } },
      ],
      groups: [
        { label: "How dressed up", sliders: ["setting", "rightForRoom"] },
        { label: "On the body", sliders: ["undone", "stance"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Bond in a tuxedo", plain: "Formal and crisp no matter what happens.", set: { setting: "formal", undone: "crisp", stance: "upright", rightForRoom: "right for it" } },
        { label: "Wedding crasher", plain: "Underdressed for a ceremony, everyone notices.", set: { setting: "casual", rightForRoom: "underdressed", noticeable: "showy" } },
        { label: "The long night unravels", plain: "Starts sharp, ends loosened and slouching.", set: { setting: "business", undone: "coming apart", stance: "slouch", change: "drifts" } },
      ],
    },
  });

  W.add("mainEra", {
    sliders: [
      ["eraMix", "Mix of eras", ["pure", "a touch from another time", "mixed", "anything goes"], "Whether the outfit is all one period or mixes pieces from different times."],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["loudness", "layers", "accessories"] },
        { face: "ladder", slider: "outfitChange" },
        { face: "tiles", slider: "truth", icons: { "their own style": "🙂", borrowed: "🤝", uniform: "🎖️", disguise: "🥸" } },
      ],
      groups: [
        { label: "The era", sliders: ["setting", "eraMix"] },
        { label: "The outfit", sliders: ["loudness", "layers", "accessories", "hairMakeup"] },
        { label: "Who they are in it", sliders: ["truth", "outfitChange"] },
      ],
      presets: [
        { label: "Mad Men office", plain: "Pure 1950s, styled, their own look.", set: { setting: "1950s", eraMix: "pure", hairMakeup: "styled", truth: "their own style" } },
        { label: "Marie Antoinette remix", plain: "1700s gowns with modern touches, loud and theatrical.", set: { setting: "1700s", eraMix: "mixed", loudness: 5, hairMakeup: "theatrical" } },
        { label: "Spy in disguise", plain: "A whole new outfit to become someone else.", set: { truth: "disguise", outfitChange: "transformation", loudness: 1 } },
      ],
    },
  });

  W.add("mainCoverage", {
    sliders: [
      ["revealArc", "Covers up or reveals", ["covers up", "holds", "reveals"], "Whether the character shows more or less skin as the story goes."],
      ["atEase", "At ease in it", ["exposed and awkward", "a bit aware", "at ease", "proud"], "How comfortable the character is with how much they show."],
      ["layersOff", "Layers taken off", [0, 5, ""], "How many layers come off during the scene, like a jacket, then a tie."],
      ["hides", "Hides something", ["nothing", "a scar or mark", "a weapon or object", "who they are"], "What the covering is really there to hide.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "revealArc", left: "covers up", right: "reveals" },
        { face: "tiles", slider: "hides", icons: { nothing: "🙂", "a scar or mark": "🩹", "a weapon or object": "🔪", "who they are": "🎭" } },
      ],
      groups: [
        { label: "How covered", sliders: ["setting", "layersOff"] },
        { label: "What it means", sliders: ["atEase", "hides"] },
        { label: "Change over time", sliders: ["revealArc", "noticeable", "change"] },
      ],
      presets: [
        { label: "Beach day confidence", plain: "Very little covered and proud of it.", set: { setting: "very little", atEase: "proud", hides: "nothing" } },
        { label: "The hidden scar", plain: "Fully covered until the reveal.", set: { setting: "fully covered", hides: "a scar or mark", revealArc: "reveals", change: "snaps" } },
      ],
    },
  });

  W.add("mainWear", {
    sliders: [
      ["stains", "Stains and marks", [0, 5, ""], "How many visible stains, blood or mud marks there are."],
      ["damageTells", "Damage tells what happened", ["none", "a hint", "clear", "it tells the story"], "Whether the rips and dirt let the audience read what the character went through."],
      ["wearArc", "Over the film", ["gets cleaned up", "stays", "wears down", "falls apart"], "Whether the clothes get more ruined or cleaner as the story goes."],
      ["mending", "Mended", ["never", "a patch", "lovingly mended"], "Whether someone has repaired the clothes, which says someone cares."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "stains" },
        { face: "balance", slider: "wearArc", left: "cleaned up", right: "falls apart" },
      ],
      groups: [
        { label: "The wear", sliders: ["setting", "stains", "mending"] },
        { label: "What it tells", sliders: ["damageTells", "noticeable"] },
        { label: "Change over time", sliders: ["wearArc", "change"] },
      ],
      presets: [
        { label: "Die Hard vest", plain: "Starts clean, ends torn and bloody, telling the whole fight.", set: { setting: "torn and dirty", stains: 5, damageTells: "it tells the story", wearArc: "falls apart" } },
        { label: "Cinderella's patched dress", plain: "Worn out but lovingly mended.", set: { setting: "worn out", mending: "lovingly mended", stains: 1 } },
      ],
    },
  });

  W.add("mainFit", {
    sliders: [
      ["madeFor", "Made for them", ["made for them", "off the rack", "hand-me-down", "someone else's"], "Whether the clothes were made to their body or belong to somebody else."],
      ["movesWith", "How the cloth moves", ["stiff", "holds shape", "flows", "billows"], "How the fabric moves when they walk, turn or the wind catches it."],
      ["outline", "Shape of the outline", ["slim", "straight", "broad shoulders", "wide skirt or coat"], "The shape the body makes against the background.", { unordered: true }],
      ["comfort", "Comfort in it", ["squirming", "bearable", "comfortable"], "Whether they squirm in the clothes or forget they are wearing them."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "skin tight": "🩱", fitted: "👔", relaxed: "👕", loose: "🧥", baggy: "🛍️" } },
        { face: "ladder", slider: "movesWith" },
        { face: "tiles", slider: "outline", icons: { slim: "🕴️", straight: "🧍", "broad shoulders": "🏋️", "wide skirt or coat": "👗" } },
      ],
      groups: [
        { label: "The fit", sliders: ["setting", "madeFor", "outline"] },
        { label: "Movement and comfort", sliders: ["movesWith", "comfort"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Big (kid in a grown-up suit)", plain: "Someone else's baggy clothes, squirming in them.", set: { setting: "baggy", madeFor: "someone else's", comfort: "squirming" } },
        { label: "Matrix long coat", plain: "Fitted, a long coat that billows in motion.", set: { setting: "fitted", movesWith: "billows", outline: "wide skirt or coat", madeFor: "made for them" } },
      ],
    },
  });

  W.add("mainSetMatch", {
    sliders: [
      ["colorGap", "Color gap from the room", [0, 100, "%"], "How far the clothes' colors are from the set's colors."],
      ["catchLight", "Catches the light", ["absorbs it", "matte", "catches some", "glows"], "Whether the fabric soaks up light or shines out of the frame."],
      ["pullsEye", "Draws the eye to them", ["hides them", "neutral", "guides the eye", "grabs it"], "How much the clothes steer the audience's eye to this character."],
      ["matchArc", "Fits in more over time", ["stands out more", "holds", "fits in more"], "Whether the character blends in or stands out more as the story goes."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "clashes", right: "matches" },
        { face: "dial", slider: "colorGap" },
        { face: "ladder", slider: "pullsEye" },
      ],
      groups: [
        { label: "Against the set", sliders: ["setting", "colorGap", "catchLight"] },
        { label: "Where the eye goes", sliders: ["pullsEye", "noticeable"] },
        { label: "Change over time", sliders: ["matchArc", "change"] },
      ],
      presets: [
        { label: "Schindler's List red coat", plain: "One figure that grabs the eye against everything.", set: { setting: "clashes", colorGap: 100, pullsEye: "grabs it" } },
        { label: "Camouflage", plain: "Clothes that melt into the room.", set: { setting: "matches the set", colorGap: 5, catchLight: "absorbs it", pullsEye: "hides them" } },
        { label: "Slowly belongs", plain: "An outsider who fits in more and more.", set: { setting: "stands out", matchArc: "fits in more", change: "drifts" } },
      ],
    },
  });

  W.add("backEra", {
    sliders: [
      ["crowdPull", "Background pulls focus", ["invisible", "texture", "noticed", "a spectacle"], "How much the background people's clothes draw the eye from the main action."],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["loudness", "layers", "accessories"] },
        { face: "ladder", slider: "formality" },
        { face: "tiles", slider: "colorCode", icons: { none: "🎨", loose: "🟨", strict: "🟥" } },
      ],
      groups: [
        { label: "The era", sliders: ["setting", "formality"] },
        { label: "The outfits", sliders: ["loudness", "layers", "accessories", "hairMakeup"] },
        { label: "How they read", sliders: ["colorCode", "crowdPull"] },
      ],
      presets: [
        { label: "Period ballroom", plain: "1800s formal crowd, a spectacle of gowns.", set: { setting: "1800s", formality: "ceremony", loudness: 4, crowdPull: "a spectacle" } },
        { label: "Today's street", plain: "Everyday modern people as quiet texture.", set: { setting: "today", formality: "casual", loudness: 1, crowdPull: "texture" } },
      ],
    },
  });

  W.add("backCost", {
    sliders: [
      ["richPoorMix", "Rich and poor mixed", ["all the same", "a little mixed", "side by side"], "Whether everyone dresses at one price or rich and poor stand together."],
      ["vsHero", "Richer or poorer than the hero", ["much poorer", "about the same", "much richer"], "Whether the crowd's clothes cost more or less than the main character's."],
      ["flaunting", "Showing off wealth", ["none", "a few", "many"], "How many background people flaunt expensive things."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "vsHero", left: "poorer", right: "richer" },
        { face: "tiles", slider: "richPoorMix", icons: { "all the same": "👥", "a little mixed": "🔀", "side by side": "⚖️" } },
      ],
      groups: [
        { label: "The price", sliders: ["setting", "richPoorMix", "flaunting"] },
        { label: "Against the hero", sliders: ["vsHero"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Titanic decks", plain: "Rich and poor side by side.", set: { richPoorMix: "side by side", flaunting: "a few" } },
        { label: "Poor kid at the gala", plain: "A luxurious crowd far richer than the hero.", set: { setting: "luxury", vsHero: "much richer", flaunting: "many" } },
      ],
    },
  });

  W.add("backCoverage", {
    sliders: [
      ["rightForWeather", "Fits the weather", ["wrong for it", "loosely", "right for it"], "Whether the crowd is dressed sensibly for the heat or cold."],
      ["coverageRange", "Coverage varies", ["all alike", "some range", "wide range"], "Whether everyone covers the same amount or it varies a lot."],
      ["norms", "Customs of the place", ["strict", "modest", "relaxed", "free"], "How strict the place's rules about dress are."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "norms", icons: { strict: "🕌", modest: "🧕", relaxed: "👕", free: "🏖️" } },
        { face: "balance", slider: "rightForWeather", left: "wrong", right: "right" },
      ],
      groups: [
        { label: "How covered", sliders: ["setting", "coverageRange"] },
        { label: "The place's rules", sliders: ["norms", "rightForWeather"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Beach crowd", plain: "Very little covered, relaxed customs.", set: { setting: "very little", norms: "free", rightForWeather: "right for it" } },
        { label: "Winter funeral", plain: "Everyone fully covered and strict.", set: { setting: "fully covered", norms: "strict", coverageRange: "all alike" } },
      ],
    },
  });

  W.add("backUtility", {
    sliders: [
      ["atWork", "Background at work", ["idle", "some working", "most working", "all busy"], "How many background people are visibly doing a job."],
      ["toolsInHand", "Tools in hand", [0, 5, ""], "How many tools, trays and bags the background people carry."],
      ["jobsRead", "Jobs read at a glance", ["unclear", "guessable", "obvious"], "Whether you can tell what each person does just from their clothes."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "looks", right: "function" },
        { face: "dial", slider: "toolsInHand" },
        { face: "ladder", slider: "atWork" },
      ],
      groups: [
        { label: "Looks or function", sliders: ["setting", "jobsRead"] },
        { label: "At work", sliders: ["atWork", "toolsInHand"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Busy restaurant kitchen", plain: "Everyone in whites, all busy, tools in hand.", set: { setting: "all function", atWork: "all busy", toolsInHand: 4, jobsRead: "obvious" } },
        { label: "Cocktail party", plain: "Dressed for looks, nobody working.", set: { setting: "only for looks", atWork: "idle", toolsInHand: 0 } },
      ],
    },
  });

  W.add("backFunction", {
    sliders: [
      ["gearAmount", "Gear on the crowd", [0, 5, ""], "How much protective or working gear the background people wear."],
      ["danger", "How dangerous the world looks", ["safe", "some risk", "dangerous", "deadly"], "What the crowd's gear tells us about how risky this world is."],
      ["sharedJob", "Same job for everyone", ["all different", "a few groups", "one shared job"], "Whether the background clothes say everyone does the same work."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "👕", comfort: "🧸", warmth: "🧣", "work wear": "🦺", sport: "🏃", "riding (chaps, boots)": "🤠", "crash protection (bike jacket, helmet)": "🏍️", "flight or space suit": "🚀", armor: "🛡️" } },
        { face: "ladder", slider: "danger" },
        { face: "dial", slider: "gearAmount" },
      ],
      groups: [
        { label: "The job", sliders: ["setting", "sharedJob"] },
        { label: "The world it shows", sliders: ["gearAmount", "danger"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Western saloon", plain: "Riding clothes all around, a rough world.", set: { setting: "riding (chaps, boots)", danger: "some risk", sharedJob: "a few groups" } },
        { label: "Medieval army", plain: "Everyone in armor, a deadly world.", set: { setting: "armor", gearAmount: 5, danger: "deadly", sharedJob: "one shared job" } },
      ],
    },
  });

  W.add("backWear", {
    sliders: [
      ["grimeShare", "How many look worn", ["a few", "some", "most", "everyone"], "How much of the crowd shows the wear."],
      ["hardTimes", "Shows hard times", ["easy life", "getting by", "hard times", "desperate"], "What the crowd's worn clothes tell us about life in this place."],
      ["vsHeroWear", "Dirtier or cleaner than hero", ["much cleaner", "about the same", "much dirtier"], "Whether the crowd looks more or less worn than the main character."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "vsHeroWear", left: "cleaner", right: "dirtier" },
        { face: "tiles", slider: "hardTimes", icons: { "easy life": "😌", "getting by": "😐", "hard times": "😟", desperate: "😫" } },
      ],
      groups: [
        { label: "The wear", sliders: ["setting", "grimeShare"] },
        { label: "What it tells", sliders: ["hardTimes", "vsHeroWear"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Les Misérables streets", plain: "Everyone ragged, desperate times.", set: { setting: "torn and dirty", grimeShare: "everyone", hardTimes: "desperate" } },
        { label: "Clean suburb", plain: "Brand new clothes, easy lives.", set: { setting: "brand new", grimeShare: "a few", hardTimes: "easy life" } },
      ],
    },
  });

  W.add("backSameness", {
    sliders: [
      ["rankMarks", "Badges and marks of rank", ["none", "a few", "clear ranks"], "Whether the matching clothes show who is in charge."],
      ["ruleBreakers", "People who break the look", [0, 5, ""], "How many background people stand out against the shared style."],
      ["colorGroups", "Groups by color", [1, 6, ""], "How many color-coded groups the crowd splits into."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["colorGroups", "ruleBreakers"] },
        { face: "tiles", slider: "rankMarks", icons: { none: "▫️", "a few": "🎖️", "clear ranks": "⭐" } },
      ],
      groups: [
        { label: "How alike", sliders: ["setting", "colorGroups"] },
        { label: "Order and breaks", sliders: ["rankMarks", "ruleBreakers"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Star Wars stormtroopers", plain: "Identical uniforms with clear ranks.", set: { setting: "uniforms", rankMarks: "clear ranks", ruleBreakers: 0, colorGroups: 1 } },
        { label: "Hunger Games districts", plain: "A crowd split into color groups.", set: { setting: "a common style", colorGroups: 5, ruleBreakers: 1 } },
      ],
    },
  });

  W.add("backPeriodTruth", {
    sliders: [
      ["oddOneOut", "A deliberate odd one out", ["none", "hidden", "noticeable", "a joke"], "A piece from the wrong time placed on purpose, from a hidden nod to a gag."],
      ["detail", "Level of detail", ["broad strokes", "good enough", "ready for close-ups"], "How carefully the period details hold up when the camera gets close."],
      ["reimagined", "Real or reimagined", ["museum real", "lived-in real", "modern twist", "reimagined"], "Whether the period is copied faithfully or reinvented for today."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "oddOneOut", icons: { none: "▫️", hidden: "🙈", noticeable: "👀", "a joke": "😂" } },
        { face: "balance", slider: "reimagined", left: "real", right: "reimagined" },
      ],
      groups: [
        { label: "True to the time", sliders: ["setting", "detail"] },
        { label: "Playing with it", sliders: ["reimagined", "oddOneOut"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Barry Lyndon accuracy", plain: "Exact, museum-real, ready for close-ups.", set: { setting: "exact", detail: "ready for close-ups", reimagined: "museum real" } },
        { label: "A Knight's Tale", plain: "Medieval with a modern twist and winking jokes.", set: { setting: "loose", reimagined: "modern twist", oddOneOut: "a joke" } },
      ],
    },
  });

  W.add("backVsMain", {
    sliders: [
      ["ownColor", "Color sets the hero apart", ["same palette", "a touch", "own color", "only color in frame"], "Whether the main character wears a color nobody else does."],
      ["framesHero", "Crowd frames the hero", ["no", "a little", "clearly"], "Whether the background is dressed to point the eye at the hero."],
      ["apartArc", "Over the film", ["joins them", "holds", "drifts apart"], "Whether the hero's look becomes more like everyone else's or less."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "ownColor", icons: { "same palette": "🩶", "a touch": "🩷", "own color": "❤️", "only color in frame": "🔴" } },
        { face: "balance", slider: "apartArc", left: "joins", right: "apart" },
      ],
      groups: [
        { label: "Standing apart", sliders: ["setting", "ownColor"] },
        { label: "Where the eye goes", sliders: ["framesHero", "noticeable"] },
        { label: "Change over time", sliders: ["apartArc", "change"] },
      ],
      presets: [
        { label: "The Devil Wears Prada", plain: "Starts apart, then joins the fashion crowd.", set: { setting: "clearly apart", apartArc: "joins them", ownColor: "own color" } },
        { label: "Pleasantville color", plain: "The only color in a gray crowd.", set: { setting: "main is the only one dressed that way", ownColor: "only color in frame", framesHero: "clearly" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
