/* Grade: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("filterLook", {
    "make it look like film": { setting: "warm film", strength: 60, scope: "the whole film" },
    "mad max look": { setting: "teal and orange", strength: 80, punch: 30 },
    "home movie memory": { setting: "vintage", strength: 60, keepSkin: "a little" },
    "noir it": { setting: "black and white", punch: 30 },
    "make it dreamier": { setting: "dreamy", strength: 60, fadeIn: 2 },
    "make it scarier": { setting: "cool film", punch: 20, followsMood: "closely" },
    "make it sadder": { setting: "faded", strength: 60 },
    "just this shot": { scope: "this clip" },
    "subtle look": { strength: 25, punch: 0 },
    "keep the skin tones": { keepSkin: "fully" },
  });

  W.say("retroEffect", {
    "found footage": { setting: "VHS tape", era: "1990s", jitter: "slight", wear: 50 },
    "old timey": { setting: "projector", era: "1920s", choppy: "old-projector choppy", jitter: "jumpy" },
    "eighties vibe": { setting: "VHS tape", era: "1980s", colorFade: "a little faded" },
    "childhood flashback": { setting: "home video", showsUp: "memories only", colorFade: "washed out" },
    "silent movie": { setting: "projector", era: "1920s", flicker: 60, flickerRate: 16 },
    "memory flashes": { showsUp: "sudden flashes", flashRate: 6, flashLength: 0.5 },
    "seventies film": { setting: "retro film", era: "1970s", colorFade: "a little faded" },
    "make it look older": { wear: 80, colorFade: "washed out" },
    "clean it up": { setting: "none", wear: 0, flicker: 0, jitter: "steady" },
  });

  W.say("exposure", {
    "brighten it up": { setting: "bright", brightness: 20, stops: 1 },
    "darken it down": { setting: "dark", brightness: -20, stops: -1 },
    "stepping into sunlight": { setting: "blown out", adjust: "slow", adjustTime: 3 },
    "pitch black basement": { setting: "very dark", stops: -3, faceReadable: "a little" },
    "pull down the highlights": { highlights: -30 },
    "lift the shadows": { shadows: 30 },
    "make it scarier": { setting: "dark", shadows: -30, faceReadable: "no" },
    "always see their face": { faceReadable: "always" },
    "eyes adjust slowly": { adjust: "very slow", adjustTime: 8 },
  });

  W.say("whiteBalance", {
    "warm it up": { setting: "warm", temperature: 4000 },
    "cool it down": { setting: "cool", temperature: 7000 },
    "golden nostalgia": { setting: "very warm", temperature: 3200, skinNeutral: "a little" },
    "cold thriller": { setting: "very cool", temperature: 8500, tint: "green", tintAmount: -10 },
    "sunset split tone": { splitTone: "strong", splitAmount: 70 },
    "fix the color": { setting: "neutral", tint: "neutral", tintAmount: 0, matchTo: "the camera's guess" },
    "too green": { tint: "magenta", tintAmount: 15 },
    "make it feel cozy": { setting: "warm", matchTo: "the lamps" },
    "keep faces natural": { skinNeutral: "fully" },
  });

  W.say("texture", {
    "16mm look": { setting: "gritty", grain: 60, grainSize: "coarse", halation: 30 },
    "add film grain": { grain: 40, grainSize: "medium" },
    "crisp commercial": { setting: "crisp", sharpen: 50, grain: 0, clarity: 20 },
    "dreamy soft focus": { setting: "soft", sharpen: 0, clarity: -40, halation: 60 },
    "add a vignette": { vignette: 50, vignetteReach: 50 },
    "glowing highlights": { halation: 70 },
    "make it grittier": { setting: "gritty", grain: 70, clarity: 30 },
    "vignette follows them": { vignetteMove: "the subject" },
    "clean digital": { grain: 0, halation: 0, vignette: 0 },
  });

  W.say("colorMatch", {
    "make the shots match": { setting: "matched", matchWhat: "everything", closeness: 90 },
    "invisible continuity": { setting: "matched", reference: "the scene's key shot", smoothJumps: "full" },
    "the dream looks different": { setting: "deliberately different", breakOn: "a dream" },
    "borrow a film's look": { reference: "an inspiration film", setting: "close" },
    "match the shot before": { reference: "the shot before" },
    "flattering skin": { skin: "flattering" },
    "break it on the time jump": { breakOn: "a time jump", setting: "deliberately different" },
    "smooth over the cuts": { smoothJumps: "gentle", smoothTime: 1 },
  });

  W.say("textureEffect", {
    "scrapbook memory": { setting: "torn paper", edges: "torn", paperTint: "cream", showsUp: "flashbacks" },
    "pop-art": { setting: "silkscreen dots", blend: "on top", strength: 70 },
    "burned old reel": { setting: "old film", edges: "burned", motion: "flickers" },
    "polaroid snapshot": { setting: "polaroid", paperTint: "cream", edges: "clean" },
    "crumpled paper": { setting: "wrinkled paper", motion: "still" },
    "make it look handmade": { setting: "torn paper", motion: "boils", changeRate: 8 },
    "yellowed with age": { paperTint: "yellowed", setting: "old film" },
    "just for the titles": { showsUp: "title moments" },
  });

  W.say("filterFamily", {
    "movie night look": { setting: "movies", strength: 70, sameAcross: "exactly" },
    "travel vlog": { setting: "landscape", strength: 50, sameAcross: "mostly" },
    "flattering portrait": { setting: "portrait", keepSkin: "fully" },
    "black and white family": { setting: "mono" },
    "throwback filter": { setting: "retro", strength: 60 },
    "make it cozy": { setting: "warm" },
    "everyday look": { setting: "life", strength: 40 },
    "same look every shot": { sameAcross: "exactly" },
  });

  W.say("lut", {
    "shoot day make it night": { setting: "day for night", strength: 90 },
    "bleach bypass look": { setting: "bleach bypass", contrastTrim: 20, colorTrim: -30 },
    "fincher look": { setting: "bleach bypass", colorTrim: -40, contrastTrim: 15 },
    "kodak film look": { setting: "film stock", strength: 70, keepSkin: "a little" },
    "blockbuster look": { setting: "teal and orange", strength: 70 },
    "convert the log footage": { setting: "log to normal", strength: 100 },
    "make it night": { setting: "day for night", contrastTrim: 10 },
    "dial it back": { strength: 40 },
    "warm print look": { setting: "warm print" },
  });

  W.say("colorWheels", {
    "teal shadows warm highlights": { setting: "all three", shadowHue: "teal", highlightHue: "warm orange", strength: 50 },
    "sickly green": { setting: "midtones", midHue: "green", strength: 50 },
    "blue shadows": { setting: "shadows", shadowHue: "cool blue", shadowReach: 50 },
    "warm the highlights": { setting: "highlights", highlightHue: "warm orange" },
    "magenta glow": { highlightHue: "magenta", setting: "highlights" },
    "lift the shadows": { shadowLevel: 25 },
    "crush the shadows": { shadowLevel: -30 },
    "make it feel uneasy": { setting: "midtones", midHue: "green", strength: 40 },
    "clean neutral grade": { setting: "none", shadowHue: "neutral", highlightHue: "neutral", midHue: "neutral" },
  });

  W.say("colorCurves", {
    "faded indie film": { setting: "faded blacks", blackLift: 20, curveStrength: 50 },
    "punchy music video": { setting: "strong S", curveStrength: 80 },
    "add some contrast": { setting: "gentle S", curveStrength: 40 },
    "crush it": { setting: "crushed blacks", blackLift: 0 },
    "milky blacks": { setting: "faded blacks", blackLift: 30 },
    "tame the whites": { whiteCap: 15 },
    "negative image": { setting: "inverted" },
    "brighter mids": { midPoint: 20 },
    "just the reds": { channel: "red" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
