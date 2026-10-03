/* Text on screen: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("onScreenText", {
    "put their name up": { setting: "lower third", position: "bottom", readTime: "comfortable" },
    "add a title": { setting: "title card", size: "full screen", position: "middle" },
    "type it out": { animation: "typewriter" },
    "label the place": { setting: "sign or label", anchoredTo: "the horizon" },
    "comic book sound effect": { setting: "sound word", animation: "pop", grabsEye: "pops out" },
    "keep it subtle": { size: "small", grabsEye: "quiet", animation: "fade", exitStyle: "fade" },
    "make it pop": { animation: "pop", grabsEye: "pops out", size: "large" },
    "leave it up longer": { readTime: "lingering", duration: 6 },
    "flash it up": { readTime: "just a flash", duration: 0.5, exitStyle: "cut" },
    "stick it to the person": { position: "follows a person", anchoredTo: "a person" },
    "roll the credits": { setting: "credits" },
    "no text": { setting: "none" },
  });
  W.say("moodEffect", {
    "make them blush": { setting: "red face", popIn: "fades in" },
    "lightbulb moment": { setting: "bright idea", popIn: "pops", timing: "on the line" },
    "steam out of the ears": { setting: "angry steam", wobble: "shakes" },
    "heart eyes": { setting: "loved", popIn: "pops" },
    "anime sweat drop": { setting: "shy", wobble: "bobs" },
    "soul leaves the body": { setting: "departing soul", holdTime: 3 },
    "crying laughing": { setting: "laughing till crying", wobble: "bobs" },
    "head bonk": { setting: "mallet bonk", popIn: "bursts with a sound" },
    "seeing stars": { setting: "struck", wobble: "shakes" },
    "don't overdo it": { howOften: "once in the film", size: "small" },
    "on every reaction": { howOften: "every reaction" },
    "make it huge": { size: "big", sizeVsFace: 200 },
  });
  W.say("endCard", {
    "fade to black": { blackBefore: 2, fadeSeconds: 2, setting: "the end" },
    "post-credits scene": { stinger: "a full extra scene", stingerAfter: 30 },
    "tease the sequel": { setting: "to be continued", stinger: "a hint" },
    "ask them to subscribe": { setting: "subscribe", style: "animated" },
    "old-timey ending": { setting: "the end", style: "old film", music: "music swells" },
    "end on silence": { music: "silence", blackBefore: 3 },
    "big finish": { music: "music swells", holdFor: 6 },
    "no end card": { setting: "none" },
    "handwritten thanks": { setting: "thanks", style: "handwritten" },
  });
  W.say("chapterCard", {
    "split it into chapters": { setting: "number and title", howMany: 5 },
    "tarantino chapters": { setting: "number and title", style: "bold", backdrop: "black" },
    "say where and when": { setting: "date and place", style: "typewriter" },
    "make the titles cryptic": { tease: "a riddle" },
    "over the picture": { backdrop: "moving picture" },
    "quick chapter cards": { holdFor: 1, fadeSeconds: 0 },
    "let the card sit": { holdFor: 5, fadeSeconds: 1 },
    "no chapters": { setting: "none" },
  });
  W.say("captions", {
    "tiktok captions": { setting: "word by word", highlight: "color and bounce", size: "large", position: "middle", wordsPerLine: 2 },
    "subtitles": { setting: "every line", position: "bottom", size: "small", highlight: "no" },
    "bigger captions": { size: "large", capHeight: 8 },
    "only the key words": { setting: "key words" },
    "color by who's speaking": { speakerColor: "a color per speaker" },
    "add some emoji": { emoji: "a few" },
    "turn captions off": { setting: "off" },
    "easier to read": { readSpeed: 12, wordsPerLine: 5, maxLines: 2 },
    "one line at a time": { maxLines: 1 },
    "hormozi style": { setting: "word by word", size: "huge", highlight: "color and bounce", emoji: "a few" },
  });
  W.say("stickers", {
    "point at it": { kind: "arrow", pointsAt: "right at the thing" },
    "make it sparkle": { kind: "sparkle", setting: "a few" },
    "add a speech bubble": { kind: "speech bubble", setting: "one", motion: "follows a person" },
    "go wild with emoji": { setting: "many", kind: "emoji", motion: "bounces" },
    "clean no stickers": { setting: "none" },
    "pop on the beat": { landsOn: "the beat of the music", motion: "bounces" },
    "follow them around": { motion: "follows a person", pointsAt: "near the subject" },
    "tilt it a little": { tilt: 15 },
  });
  W.say("textStyle", {
    "make it readable": { stroke: 3, shadow: 60, box: "soft", weight: "bold" },
    "classic meme text": { setting: "bold display", color: "white", stroke: 6, weight: "heavy" },
    "elegant": { setting: "serif", weight: "thin", spread: "wide" },
    "vintage look": { setting: "retro", color: "pastel" },
    "comic book": { setting: "comic", stroke: 4, color: "yellow" },
    "neon glow": { glow: 80, color: "pastel" },
    "warning label": { color: "red", weight: "heavy", box: "solid" },
    "space it out": { spread: "very wide" },
    "handwritten note": { setting: "handwritten", box: "none" },
    "drop shadow": { shadow: 80, shadowOffset: 6, shadowAngle: 135 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
