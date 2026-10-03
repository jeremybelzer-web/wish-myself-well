/* World: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("setting", {
    "establish the place": { placeFocus: "noticed", establishTime: 6, placeInFrame: 70 },
    "give me an establishing shot": { establishTime: 8, placeInFrame: 90 },
    "the place is a character": { placeFocus: "a character itself", themeLink: "it is the theme" },
    "it's only wallpaper": { placeFocus: "just a backdrop", placeInFrame: 15 },
    "their home turf": { homeTurf: "the hero's own", returns: "home base", familiarity: 5 },
    "somewhere they don't belong": { homeTurf: "a stranger's", familiarity: 0, seenThrough: "a newcomer" },
    "make it feel familiar": { familiarity: 5, returns: "often" },
    "fish out of water": { homeTurf: "a stranger's", familiarity: 0, seenThrough: "the main character" },
    "jump straight in": { establishTime: 0, leadIn: 0 },
    "let the place breathe": { establishTime: 10, placeFocus: "felt", timeHere: 80 },
  });

  W.say("temperature", {
    "freezing": { setting: "cold", degrees: -15, breathSweat: "dripping or fogging", bodyReaction: "suffering" },
    "you can see their breath": { setting: "cold", degrees: -2, breathSweat: "plenty" },
    "sweltering": { setting: "hot", degrees: 40, breathSweat: "dripping or fogging", bodyReaction: "fanning or hugging selves" },
    "heat wave": { setting: "hot", degrees: 38, whoFeels: "everyone", shown: 5 },
    "comfortable room": { setting: "mild", degrees: 21, bodyReaction: "at ease", breathSweat: "none" },
    "make them sweat": { setting: "hot", breathSweat: "plenty", tensionLink: "closely" },
    "the heat builds the tension": { setting: "hot", tensionLink: "closely", change: "drifts" },
    "a chill comes over the room": { setting: "cold", change: "drifts", whoFeels: "everyone", firstSign: 10 },
    "make it feel colder": { setting: "cold", shown: 4 },
  });

  W.say("props", {
    "the hero prop": { importance: "the key to the scene", propFocus: "close-up of it alone", propOwner: "the main character" },
    "chekhov's gun": { setupPayoff: "planted early", importance: "the key to the scene", plantedAhead: 30 },
    "plant it early": { setupPayoff: "planted early", plantedAhead: 20 },
    "plant and pay off": { setupPayoff: "planted and repeated", importance: "important" },
    "just set dressing": { importance: "dressing", handling: "ignored", propFocus: "never" },
    "something for their hands": { handling: "used", count: 2, propReach: 0.5 },
    "they fight over it": { handling: "fought over", importance: "the key to the scene", propOwner: "everyone" },
    "insert shot of the prop": { propFocus: "close-up of it alone", propInFrame: 80 },
    "make it look old": { condition: "worn" },
    "nothing on the table": { count: 0, importance: "dressing" },
  });

  W.say("intExt", {
    "inside": { setting: "interior" },
    "outside": { setting: "exterior" },
    "out in the open": { setting: "exterior", shelter: "exposed", insideShare: 0 },
    "safe indoors": { setting: "interior", shelter: "sealed off", outsideSound: 0 },
    "trapped inside": { setting: "interior", shelter: "sealed off", pullOutside: "longing", threshold: "stays put" },
    "staring out the window": { setting: "interior", threshold: "glimpses out", pullOutside: "longing", view: 4 },
    "step out the door": { threshold: "steps through", crossings: 1 },
    "in and out": { threshold: "back and forth", crossings: 4, insideShare: 50 },
    "hear the street": { outsideSound: 4, shelter: "thin walls" },
  });

  W.say("weather", {
    "nice day": { setting: "clear", strength: 0, wind: 1, moodMatch: "neutral" },
    "pouring rain": { setting: "rain", strength: 5, onPeople: "soaked or coated" },
    "light drizzle": { setting: "rain", strength: 1, onPeople: "a little" },
    "a storm is coming": { setting: "rain", buildUp: "gathers", pointsAhead: "hints at what's next", wind: 3 },
    "dust storm": { setting: "dust", strength: 5, wind: 5, visibility: 30, onPeople: "battered" },
    "pathetic fallacy": { moodMatch: "is the mood" },
    "the weather matches the mood": { moodMatch: "echoes the mood" },
    "sunny day at a funeral": { setting: "clear", moodMatch: "fights the mood" },
    "make it stormier": { setting: "rain", strength: 5, wind: 5, buildUp: "comes in waves" },
    "the sky opens up": { setting: "rain", buildUp: "breaks suddenly", strength: 5 },
  });

  W.say("scale", {
    "make it feel huge": { setting: "city", feelSize: "bigger than it is", personSize: "small in it" },
    "tiny little room": { setting: "closet", personSize: "fill it", width: 2 },
    "make them look small": { personSize: "small in it", feelSize: "bigger than it is" },
    "ants from up here": { setting: "city", personSize: "specks", width: 3000 },
    "epic scale": { setting: "city", people: 100, personSize: "specks", sizeReveal: "one big reveal" },
    "cathedral ceilings": { setting: "hall", tall: 40, personSize: "small in it" },
    "reveal how big it is": { sizeReveal: "one big reveal", revealAt: 30 },
    "intimate space": { setting: "closet", people: 2, personSize: "fill it" },
  });

  W.say("layoutOpen", {
    "claustrophobic": { setting: "cramped", closingIn: "closes in", obstacles: 4, personGap: 0.3 },
    "the walls close in": { closingIn: "closes in", setting: "cramped" },
    "room to move": { setting: "roomy", roaming: "walk through", paths: "many" },
    "wide open space": { setting: "wide open", freeFloor: 1500, roaming: "roam" },
    "nowhere to run": { paths: "one way", setting: "cramped", obstacles: 5 },
    "let them roam": { roaming: "roam", walked: 50 },
    "give them space": { setting: "open", personGap: 4 },
    "breathing room": { setting: "roomy", closingIn: "opens up" },
  });

  W.say("setLayout", {
    "dive bar": { setting: "one long bar", focalPoint: "a counter or bar" },
    "diner booths": { setting: "booths along the walls" },
    "restaurant floor": { setting: "tables in the middle", zones: 4 },
    "open plan office": { setting: "islands", zones: 6 },
    "grand staircase": { setting: "levels and balconies", heightLevels: "many levels", levelDrop: 5 },
    "a stage to play to": { focalPoint: "a stage or balcony", heightLevels: "raised areas" },
    "only one way in": { entrances: 1 },
    "doors everywhere": { entrances: 6 },
    "everything faces the center": { focalPoint: "the center", layoutFrom: "the room's center" },
  });

  W.say("crowdLens", {
    "empty streets": { count: "none" },
    "packed house": { count: "a crowd", crowdSpacing: 0.4, crowdInFrame: 80 },
    "cast of thousands": { count: "a sea", crowdFocus: "the star", crowdInFrame: 100 },
    "background extras": { count: "a group", crowdFocus: "background", sync: "each on their own" },
    "everyone moves as one": { sync: "perfect unison", follow: "all follow" },
    "a mexican wave": { sync: "in step", ripple: 4, follow: "all follow" },
    "people trickle in": { grow: "trickles in" },
    "the crowd swells": { grow: "swells", count: "a crowd" },
    "surrounded": { spread: "in a ring", crowdAround: "the main character", crowdDistance: 2 },
    "clone army": { variety: "clones", spread: "in rows", sync: "perfect unison" },
  });

  W.say("envMotion", {
    "dead still": { setting: "still", howMuch: 0, speed: 0 },
    "wind in the trees": { setting: "wind", howMuch: 3, rhythm: "gusty" },
    "make the world feel alive": { howMuch: 4, movingShare: 60, setting: "crowd" },
    "waves crashing": { setting: "water", rhythm: "pulsing", howMuch: 4, pulseEvery: 6 },
    "traffic going by": { setting: "transit", direction: "to the right", touches: "passes them by" },
    "life goes on around them": { setting: "crowd", touches: "passes them by", movingShare: 50 },
    "fighting the wind": { setting: "wind", touches: "they fight it", howMuch: 5, rhythm: "gusty" },
    "total chaos around them": { rhythm: "chaotic", howMuch: 5, speed: 5 },
  });

  W.say("repeatInFrame", {
    "endless corridor": { pattern: "rows", recede: "to a vanishing point", copies: 40 },
    "rows and rows": { pattern: "rows", setting: 4, recede: "a few deep" },
    "one doesn't fit": { oddOne: "stands out" },
    "spot the difference": { oddOne: "subtle" },
    "kubrick symmetry": { pattern: "grid", recede: "to a vanishing point", setting: 5 },
    "a sea of the same thing": { copies: 300, repeatShare: 90, setting: 5 },
    "one by one they appear": { builtUp: "one by one", appearGap: 0.5 },
    "no repetition": { setting: 0, copies: 0 },
  });

  W.say("setStyle", {
    "period piece": { realism: "dressed real", setting: "victorian" },
    "gatsby glamour": { setting: "1920s glamour", wealth: "rich", styleFamily: "maximal" },
    "spaceship": { setting: "futuristic", styleFamily: "futurist" },
    "make it look rich": { wealth: "palatial", ceiling: "high", styleFamily: "classical" },
    "make it look poor": { wealth: "poor", setting: "rustic", ceiling: "low" },
    "wes anderson": { symmetry: 5, colorFamily: "pastel", realism: "stylized" },
    "minimalist": { styleFamily: "minimal", personal: "anonymous" },
    "lived-in home": { personal: "full of the owner", realism: "dressed real" },
    "like a stage play": { realism: "theatrical" },
    "dreamlike set": { realism: "dreamlike", styleFamily: "fantasy" },
  });

  W.say("setMaterial", {
    "cold concrete and steel": { setting: "metal", texture: "rough", shine: 2 },
    "warm wood": { setting: "wood", texture: "grainy" },
    "old stone walls": { setting: "stone", ageMarks: "plenty", texture: "rough" },
    "polished and expensive": { setting: "marble", texture: "polished", shine: 5 },
    "glass box": { setting: "glass", shine: 5, texture: "polished" },
    "dirt floor": { setting: "dirt and rough wood", texture: "rough" },
    "crumbling walls": { ageMarks: "crumbling" },
    "they lean on everything": { touched: "lean and lay hands" },
  });

  W.say("setLines", {
    "soft and organic": { setting: "soft and curved", corners: 0 },
    "hard angles": { setting: "sharp and clean", corners: 5 },
    "lead the eye to them": { leadEye: "straight to the subject" },
    "leading lines": { leadEye: "toward the people", noticeable: "clear" },
    "dutch tilt the room": { lineTilt: 20 },
    "make it feel off": { lineTilt: 15, setting: "mixed", shapes: "triangles" },
    "stripes everywhere": { shapes: "stripes", noticeable: "showy" },
    "make it calmer": { setting: "mostly curved", corners: 1, shapes: "circles" },
  });

  W.say("wallArt", {
    "bare walls": { setting: 0, pieceCount: 0 },
    "salon wall": { setting: 5, pieceCount: 40, artSize: "mixed" },
    "family photos": { artKind: "photos", artMeaning: "fits the owner" },
    "mirrors everywhere": { artKind: "mirrors", pieceCount: 12 },
    "the painting means something": { artMeaning: "comments on the moment", noticeable: "clear" },
    "a clue on the wall": { artMeaning: "hints at the story", noticeable: "subtle" },
    "teenage bedroom posters": { artKind: "posters", setting: 4, artMeaning: "fits the owner" },
    "one big painting": { pieceCount: 1, artSize: "huge" },
  });

  W.say("artArrangement", {
    "gallery wall": { setting: "loose groups", spacing: "close" },
    "museum hang": { setting: "perfectly even", spacing: "even gaps", straightness: "laser level" },
    "something's off": { straightness: "crooked", noticeable: "subtle" },
    "crooked frames": { straightness: "crooked" },
    "frame the face": { framesFaces: "framing the face" },
    "neat and tidy": { setting: "neat rows", straightness: "straight" },
    "one centerpiece": { centerpiece: "a clear centerpiece" },
    "nothing on the walls": { setting: "no art" },
  });

  W.say("clutter", {
    "hoarder house": { setting: 5, order: "organized hoard", itemCount: 450, clearFloor: 10 },
    "messy room": { setting: 3, order: "messy" },
    "spotless and empty": { setting: 0, itemCount: 0, clearFloor: 100 },
    "papers everywhere": { mess: "papers", setting: 4, order: "chaos" },
    "they trip over stuff": { inTheWay: "they trip" },
    "the mess grows": { pilesUp: "piles up", change: "drifts" },
    "buried in junk": { pilesUp: "buries them", mess: "junk", setting: 5 },
    "a mad scientist's workshop": { mess: "tools", order: "chaos", setting: 4 },
  });

  W.say("setUpkeep", {
    "abandoned": { setting: "ruined", dust: 5, yearsSince: 50, decay: "falls apart" },
    "haunted house": { setting: "ruined", dust: 5, damagedShare: 70 },
    "falling apart": { decay: "falls apart", setting: "shabby" },
    "showroom clean": { setting: "spotless", dust: 0, repairs: "freshly redone" },
    "fixer-upper": { setting: "shabby", repairs: "half fixed" },
    "lived-in": { setting: "lived in", dust: 1 },
    "nobody's been here for years": { dust: 5, yearsSince: 20, setting: "shabby" },
    "patched together": { repairs: "patched" },
  });

  W.say("setDepth", {
    "deep staging": { setting: "deep", doorways: 3, seeDepth: 30 },
    "flat against the wall": { setting: "flat wall", seeDepth: 1 },
    "busy background": { backLife: "busy", backPeople: 30 },
    "empty background": { backLife: "empty", backPeople: 0 },
    "something in the background": { depthPull: "pulls focus", backLife: "some movement" },
    "rooms beyond rooms": { setting: "deep", doorways: 5 },
    "layer the frame": { setting: "a few layers", firstLayer: 1 },
  });

  W.say("setBrightness", {
    "dark and moody": { setting: "dark", contrast: 4, popOut: "jump out" },
    "light and airy": { setting: "bright", contrast: 1, wallReflect: 80 },
    "make them stand out": { popOut: "jump out", faceVsWall: 2 },
    "they blend into the walls": { popOut: "sink in", faceVsWall: -1 },
    "a pop of color": { accent: "one small" },
    "the room gets darker": { darkens: "darkens", change: "drifts" },
    "drab and gray": { setting: "dull", contrast: 1, accent: "none" },
  });

  W.say("scatterLens", {
    "autumn leaves": { what: "leaves", how: 3, moves: "tumbles" },
    "wildflower meadow": { what: "flowers", how: 4, spread: "natural" },
    "trash everywhere": { what: "trash", how: 4, spread: "clumped" },
    "rocky ground": { what: "rocks", how: 3, sizes: "wildly different" },
    "tall grass blowing": { what: "grass", moves: "sways", how: 5 },
    "a path through it": { clearPath: "a clear path", pathWidth: 1 },
    "kick through the leaves": { disturbed: "kick through", what: "leaves" },
    "bare ground": { how: 0, perSquareMeter: 0 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
