/* Wardrobe: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("mainCost", {
    "make them look rich": { setting: "luxury", labelsShow: "quiet", outfitPrice: 20000 },
    "make them look broke": { setting: "cheap", outfitPrice: 40 },
    "old money": { setting: "luxury", labelsShow: "none", affordIt: "below their means" },
    "new money": { setting: "expensive", labelsShow: "logos everywhere", othersNotice: "comments" },
    "faking it till they make it": { setting: "expensive", affordIt: "faking it", costFrom: "who they want to be" },
    "dressed in rags": { setting: "rags", outfitPrice: 0 },
    "thrift store": { setting: "cheap", labelsShow: "none", outfitPrice: 60 },
    "rags to riches": { costArc: "rises", change: "steps" },
    "they lose everything": { costArc: "falls" },
    "too rich for the room": { vsRoomCost: 300, othersNotice: "it's the point" },
  });

  W.say("mainUtility", {
    "ready for anything": { setting: "all function", readyFor: "built for it", pockets: 5 },
    "all style no substance": { setting: "only for looks", readyFor: "not at all" },
    "cargo pants": { pockets: 5, setting: "mostly function" },
    "tactical gear": { setting: "all function", carried: 15, readyFor: "built for it" },
    "the outfit saves the day": { savesDay: "a key moment" },
    "keeps fussing with it": { fussing: "constantly", fussRate: 8 },
    "dressed for the wrong job": { readyFor: "not at all", setting: "mostly looks" },
    "pack mule": { carried: 30, setting: "all function" },
  });

  W.say("mainFunction", {
    "suit up": { suitUp: "a suiting-up beat", wornRight: "strapped tight" },
    "suiting-up montage": { suitUp: "a full montage", suitUpTime: 60 },
    "knight in armor": { setting: "armor", gearWeight: 25, protectedShare: 90 },
    "astronaut": { setting: "flight or space suit", protectedShare: 100 },
    "biker": { setting: "crash protection (bike jacket, helmet)" },
    "cowboy": { setting: "riding (chaps, boots)" },
    "gym clothes": { setting: "sport" },
    "bundled up for winter": { setting: "warmth", gearCount: 4 },
    "battle-damaged armor": { setting: "armor", gearDamage: "damaged" },
    "helmet half on": { wornRight: "half on" },
  });

  W.say("mainFormality", {
    "dressed to the nines": { setting: "formal", undone: "crisp", stance: "upright" },
    "black tie": { setting: "formal", undone: "crisp" },
    "in their pajamas": { setting: "sleepwear", stance: "slouch" },
    "smart casual": { setting: "neat casual" },
    "suit and tie": { setting: "business" },
    "overdressed for the party": { rightForRoom: "overdressed", setting: "formal" },
    "too casual for this": { rightForRoom: "underdressed", setting: "casual" },
    "loosen the tie": { undone: "loosened", loosensAt: 30 },
    "the night falls apart": { undone: "coming apart", change: "drifts" },
    "wedding day": { setting: "ceremony", dressedFor: "the camera" },
    "dressed to impress a date": { dressedFor: "a date", setting: "neat casual" },
  });

  W.say("mainEra", {
    "period costume": { setting: "1800s", truth: "their own style", eraMix: "pure" },
    "roaring twenties": { setting: "1920s", hairMakeup: "styled", accessories: 4 },
    "seventies flair": { setting: "1970s", loudness: 4 },
    "nineties grunge": { setting: "1990s", hairMakeup: "undone", layers: 3 },
    "modern day": { setting: "today" },
    "sci-fi future": { setting: "future" },
    "stuck in the past": { yearsBehind: 30, eraMix: "a touch from another time" },
    "makeover": { outfitChange: "transformation", outfitChanges: 1 },
    "in disguise": { truth: "disguise", outfitChange: "new outfit" },
    "costume change": { outfitChange: "new outfit" },
    "big dramatic makeup": { hairMakeup: "theatrical" },
  });

  W.say("mainCoverage", {
    "show some skin": { setting: "some", skinShown: 40 },
    "buttoned up": { setting: "fully covered", skinShown: 5 },
    "covered head to toe": { setting: "fully covered", skinShown: 0 },
    "hiding a scar": { hides: "a scar or mark", setting: "most" },
    "concealed weapon": { hides: "a weapon or object" },
    "they peel off layers": { revealArc: "reveals", layersOff: 3, layerOffTime: 30 },
    "comfortable in their skin": { atEase: "proud" },
    "self-conscious": { atEase: "exposed and awkward" },
    "hiding who they are": { hides: "who they are", setting: "fully covered" },
  });

  W.say("mainWear", {
    "fresh off the rack": { setting: "brand new", stains: 0, tears: 0 },
    "beat-up clothes": { setting: "worn out", stains: 3, tears: 4 },
    "after the fight": { setting: "torn and dirty", wearArc: "falls apart", damageTells: "it tells the story" },
    "they've been through hell": { setting: "torn and dirty", damageTells: "it tells the story", stains: 5 },
    "lovingly patched": { mending: "lovingly mended", setting: "worn in" },
    "broken in": { setting: "worn in", clothesAge: 5 },
    "gets dirtier as it goes": { wearArc: "wears down", change: "drifts" },
    "cleaned up": { wearArc: "gets cleaned up", setting: "clean" },
    "make it look lived in": { setting: "worn in", stains: 1 },
  });

  W.say("mainFit", {
    "tailored": { setting: "fitted", madeFor: "made for them", ease: 2 },
    "drowning in it": { setting: "baggy", sizeOff: 3, madeFor: "someone else's" },
    "wearing their dad's suit": { madeFor: "someone else's", sizeOff: 2, setting: "loose" },
    "hand-me-downs": { madeFor: "hand-me-down", sizeOff: 1 },
    "too tight": { setting: "skin tight", sizeOff: -2, comfort: "squirming" },
    "power shoulders": { outline: "broad shoulders", setting: "fitted" },
    "flowing gown": { movesWith: "billows", outline: "wide skirt or coat" },
    "the coat billows": { movesWith: "billows", settleTime: 2 },
    "stiff and uncomfortable": { movesWith: "stiff", comfort: "squirming" },
  });

  W.say("mainSetMatch", {
    "make them pop": { setting: "stands out", colorGap: 80, pullsEye: "grabs it" },
    "blend into the background": { setting: "blends in", colorGap: 10, pullsEye: "hides them" },
    "camouflaged": { setting: "matches the set", colorGap: 0, pullsEye: "hides them" },
    "sore thumb": { setting: "clashes", colorGap: 100 },
    "they start to belong": { matchArc: "fits in more" },
    "they stand out more and more": { matchArc: "stands out more" },
    "glowing white dress": { catchLight: "glows", vsRoomLight: 2 },
    "dark clothes in a dark room": { catchLight: "absorbs it", vsRoomLight: -2 },
  });

  W.say("backEra", {
    "period extras": { setting: "1800s", crowdPull: "texture", eraSpread: 10 },
    "a mix of eras": { eraSpread: 150 },
    "everyone's from the future": { setting: "future" },
    "the crowd's from another time": { vsHeroYears: -50 },
    "costume party": { crowdPull: "a spectacle", eraSpread: 200, loudness: 5 },
    "matching color code": { colorCode: "strict" },
    "black tie crowd": { formality: "formal" },
    "dressed down extras": { formality: "casual", hairMakeup: "natural" },
  });

  W.say("backCost", {
    "high society": { setting: "luxury", flaunting: "many", richShare: 90 },
    "working class crowd": { setting: "everyday", richShare: 5, typicalPrice: 100 },
    "the poor side of town": { setting: "cheap", vsHero: "much poorer" },
    "rich and poor side by side": { richPoorMix: "side by side", richShare: 50 },
    "hero is the poorest there": { vsHero: "much richer" },
    "everyone's dressed the same price": { richPoorMix: "all the same" },
    "street beggars": { setting: "rags", typicalPrice: 0 },
  });

  W.say("backCoverage", {
    "beach crowd": { setting: "very little", norms: "free", rightForWeather: "right for it", crowdSkin: 80 },
    "bundled-up crowd": { setting: "fully covered", crowdSkin: 5 },
    "conservative town": { norms: "strict", setting: "fully covered" },
    "dressed wrong for the weather": { rightForWeather: "wrong for it" },
    "all kinds of people": { coverageRange: "wide range" },
    "hero shows more than anyone": { vsHeroSkin: -50 },
    "everyone covered alike": { coverageRange: "all alike" },
  });

  W.say("backUtility", {
    "busy workplace": { atWork: "all busy", workingShare: 90, jobsRead: "obvious" },
    "people at work": { atWork: "most working", toolsInHand: 2 },
    "idle crowd": { atWork: "idle", workingShare: 0 },
    "you can tell their jobs": { jobsRead: "obvious" },
    "mysterious strangers": { jobsRead: "unclear", setting: "only for looks" },
    "workers in the distance": { workersDistance: 30, atWork: "some working" },
    "tools in every hand": { toolsInHand: 5 },
  });

  W.say("backFunction", {
    "construction site": { setting: "work wear", danger: "dangerous", sharedJob: "one shared job" },
    "an army": { setting: "armor", sharedJob: "one shared job", geared: 100 },
    "hazmat crew": { setting: "work wear", gearAmount: 5, danger: "deadly" },
    "gym crowd": { setting: "sport" },
    "biker gang": { setting: "crash protection (bike jacket, helmet)", sharedJob: "one shared job" },
    "ranch hands": { setting: "riding (chaps, boots)" },
    "everyone has a different job": { sharedJob: "all different", jobKinds: 8 },
  });

  W.say("backWear", {
    "post-apocalyptic crowd": { setting: "torn and dirty", hardTimes: "desperate", grimeShare: "everyone" },
    "everyone's struggling": { hardTimes: "hard times", setting: "worn out" },
    "dust bowl": { hardTimes: "desperate", grimeShare: "most", setting: "worn out" },
    "spotless suburbs": { setting: "clean", hardTimes: "easy life" },
    "hero is the dirtiest": { vsHeroWear: "much cleaner" },
    "the crowd's filthier than the hero": { vsHeroWear: "much dirtier" },
    "scraping by": { hardTimes: "getting by", setting: "worn in" },
  });

  W.say("backSameness", {
    "school uniforms": { setting: "uniforms", ranks: 0 },
    "military ranks": { setting: "uniforms", rankMarks: "clear ranks", ranks: 5 },
    "a sea of suits": { setting: "nearly alike", alikeShare: 90 },
    "everyone's an individual": { setting: "all different", alikeShare: 0 },
    "one rebel in the crowd": { ruleBreakers: 1 },
    "two teams": { colorGroups: 2, setting: "a common style" },
    "cult robes": { setting: "uniforms", alikeShare: 100, colorGroups: 1 },
  });

  W.say("backPeriodTruth", {
    "historically accurate": { setting: "exact", reimagined: "museum real", yearsOff: 0 },
    "hold up in close-up": { detail: "ready for close-ups" },
    "modern twist on the period": { reimagined: "modern twist", setting: "loose" },
    "a wristwatch in rome": { oddOneOut: "a joke", wrongPieces: 1 },
    "anachronism on purpose": { oddOneOut: "noticeable", setting: "clearly wrong" },
    "good enough for the back row": { detail: "broad strokes", setting: "loose" },
    "lived-in history": { reimagined: "lived-in real", setting: "mostly right" },
  });

  W.say("backVsMain", {
    "the hero stands alone": { setting: "main is the only one dressed that way", ownColor: "only color in frame" },
    "one of the crowd": { setting: "main blends in", ownColor: "same palette", heroColorGap: 0 },
    "red coat in a gray crowd": { ownColor: "only color in frame", heroColorGap: 100 },
    "they finally fit in": { apartArc: "joins them" },
    "they drift away from everyone": { apartArc: "drifts apart" },
    "the crowd frames the hero": { framesHero: "clearly", heroGap: 2 },
    "make them stand apart": { setting: "clearly apart", ownColor: "own color" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
