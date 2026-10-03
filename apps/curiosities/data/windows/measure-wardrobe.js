/* Wardrobe, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  /* Adds the new settings, a "Measured" group listing them, and at most one face and one preset. */
  const M = (id, sliders, w) => {
    w = w || {};
    W.add(id, {
      sliders,
      window: { faces: w.face ? [w.face] : [], groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }], presets: w.preset ? [w.preset] : [] },
    });
  };

  /* Main character */
  M("mainCost", [
    ["outfitPrice", "What the outfit cost", [0, 50000, "$", 10], "Roughly what everything they wear would cost to buy, in dollars.", { from: 80, to: 1500 }],
    ["vsRoomCost", "Pricier than the room by", [-100, 500, "%"], "How much more (plus) or less (minus) their clothes cost than what the people around them wear.", { from: 0, to: 50 }],
    ["costFrom", "Compared with", ["the people around them", "their own past", "their friends", "who they want to be"], "Whose clothes the price is held up against.", { unordered: true }],
  ], {
    face: { face: "dial", slider: "outfitPrice" },
    preset: { label: "Dressed above the room", plain: "Clothes that cost far more than anyone else's here.", set: { vsRoomCost: 300, costFrom: "the people around them" } },
  });

  M("mainUtility", [
    ["carried", "Weight carried", [0, 40, "kg", 0.5], "Kilograms of tools, bags and gear on them.", { from: 0, to: 5 }],
    ["fussRate", "Fusses per minute", [0, 20, ""], "How many times a minute they fix their hair, collar or sleeves.", { from: 0, to: 2 }],
  ]);

  M("mainFunction", [
    ["suitUpTime", "Time to suit up", [0, 600, "s", 1], "Seconds it takes to put all the gear on.", { from: 10, to: 90 }],
    ["protectedShare", "Body protected", [0, 100, "%"], "How much of the body the gear actually shields.", { from: 0, to: 40 }],
    ["gearWeight", "Weight of the gear", [0, 60, "kg", 0.5], "Kilograms of protective or working gear worn.", { from: 1, to: 10 }],
  ], { face: { face: "pad", x: "protectedShare", y: "gearWeight", xLabel: "More of the body shielded", yLabel: "Heavier" } });

  M("mainFormality", [
    ["dressedFor", "Dressed for whom", ["the room", "their boss", "a date", "the camera", "themselves"], "Who the level of dress is aimed at.", { unordered: true }],
    ["loosensAt", "Starts coming undone at", [0, 180, "min", 1], "Minutes into the film when the tie, collar or buttons start to give.", { from: 20, to: 90 }],
  ]);

  M("mainEra", [
    ["yearsBehind", "Years behind the times", [-50, 300, "years"], "How many years older (plus) or newer (minus) their clothes are than the time the story is set in.", { from: 0, to: 10 }],
    ["outfitChanges", "Outfit changes in the film", [0, 30, ""], "How many different outfits they wear over the whole film.", { from: 1, to: 6 }],
  ]);

  M("mainCoverage", [
    ["skinShown", "Skin showing", [0, 100, "%"], "How much of the body's skin we can see.", { from: 10, to: 40 }],
    ["layerOffTime", "Seconds to take a layer off", [0, 120, "s"], "How long it takes on screen to remove one layer.", { from: 2, to: 15 }],
  ]);

  M("mainWear", [
    ["clothesAge", "How old the clothes are", [0, 50, "years", 0.5], "Years since the clothes were new.", { from: 0.5, to: 5 }],
    ["tears", "Tears and holes", [0, 20, ""], "How many rips or holes we can see.", { from: 0, to: 2 }],
  ]);

  M("mainFit", [
    ["ease", "Room between cloth and body", [0, 30, "cm", 0.5], "Centimeters of slack between the clothes and the body; 0 is skin tight.", { from: 2, to: 8 }],
    ["sizeOff", "Sizes too big or small", [-3, 3, "sizes"], "How many sizes too big (plus) or too small (minus) the clothes are for them.", { from: 0, to: 0 }],
    ["settleTime", "Cloth settles after", [0, 3, "s", 0.1], "Seconds the cloth keeps swinging after they stop moving.", { from: 0.2, to: 0.8 }],
  ], { face: { face: "pad", x: "ease", y: "settleTime", xLabel: "Looser", yLabel: "Keeps moving longer" } });

  M("mainSetMatch", [
    ["vsRoomLight", "Brighter than the room", [-3, 3, "stops", 0.5], "How much brighter (plus) or darker (minus) the clothes are than the set behind them, in stops (each stop doubles the light).", { from: 0, to: 1 }],
    ["clothesInFrame", "Clothes' share of the frame", [0, 100, "%"], "How much of the picture their clothes fill.", { from: 5, to: 30 }],
  ]);

  /* Background people */
  M("backEra", [
    ["eraSpread", "Years from oldest to newest", [0, 200, "years", 1], "How many years separate the oldest-looking and newest-looking clothes in the crowd.", { from: 0, to: 20 }],
    ["vsHeroYears", "Years apart from the hero", [-100, 100, "years"], "How much older (minus) or newer (plus) the crowd's clothes are than the hero's.", { from: 0, to: 0 }],
  ]);

  M("backCost", [
    ["typicalPrice", "Typical outfit cost", [0, 20000, "$", 10], "What a typical background outfit would cost, in dollars.", { from: 50, to: 800 }],
    ["richShare", "Share dressed rich", [0, 100, "%"], "How many of the background people are dressed expensively.", { from: 0, to: 30 }],
  ]);

  M("backCoverage", [
    ["crowdSkin", "Skin showing", [0, 100, "%"], "On average, how much of the background people's skin we can see.", { from: 10, to: 40 }],
    ["vsHeroSkin", "More covered than the hero", [-100, 100, "%"], "How much more (plus) or less (minus) covered the crowd is than the main character.", { from: 0, to: 0 }],
  ]);

  M("backUtility", [
    ["workingShare", "Share at work", [0, 100, "%"], "How many of the background people are doing a job.", { from: 10, to: 60 }],
    ["workersDistance", "How far the workers are", [0, 50, "m", 0.5], "Meters from the main character to the nearest person at work.", { from: 1, to: 10 }],
  ]);

  M("backFunction", [
    ["geared", "Share in work or safety gear", [0, 100, "%"], "How many of the background people wear gear for a job or for protection.", { from: 0, to: 50 }],
    ["jobKinds", "Different jobs on show", [1, 10, ""], "How many different jobs you can count from the clothes.", { from: 1, to: 3 }],
  ]);

  M("backWear", [
    ["crowdClothesAge", "Typical age of their clothes", [0, 30, "years", 0.5], "Years since a typical background outfit was new.", { from: 1, to: 8 }],
    ["tearsEach", "Patches or tears each", [0, 10, ""], "How many patches or rips a typical background outfit shows.", { from: 0, to: 2 }],
  ]);

  M("backSameness", [
    ["alikeShare", "Share dressed alike", [0, 100, "%"], "How many of the background people wear the same look.", { from: 20, to: 80 }],
    ["ranks", "Ranks you can tell apart", [0, 8, ""], "How many levels of rank or role the clothes show.", { from: 0, to: 3 }],
  ]);

  M("backPeriodTruth", [
    ["wrongPieces", "Pieces from the wrong time", [0, 50, ""], "How many clothing pieces in view don't belong to the story's time.", { from: 0, to: 3 }],
    ["yearsOff", "Years off, at most", [0, 100, "years"], "How many years the most out-of-place piece is from the story's time.", { from: 0, to: 15 }],
  ]);

  M("backVsMain", [
    ["heroGap", "Space around the hero", [0, 20, "m", 0.1], "Meters between the main character and the nearest background person.", { from: 0.5, to: 3 }],
    ["heroColorGap", "Color gap from the crowd", [0, 100, "%"], "How different the hero's colors are from the crowd's: 0 the same, 100 opposite.", { from: 20, to: 70 }],
  ], {
    face: { face: "pad", x: "heroGap", y: "heroColorGap", xLabel: "More space around them", yLabel: "More different in color" },
    preset: { label: "Alone in the crowd", plain: "A clear ring of space and a color nobody else wears.", set: { heroGap: 3, heroColorGap: 90 } },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
