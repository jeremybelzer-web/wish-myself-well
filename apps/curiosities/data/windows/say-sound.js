/* Sound: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("voiceover", {
    "add narration": { setting: "running", voice: "a narrator" },
    "inner monologue": { voice: "a character", closeness: "in your ear", setting: "now and then" },
    "their thoughts out loud": { voice: "a character", closeness: "in your ear", voTiming: "over silence" },
    "unreliable narrator": { truth: "the picture says otherwise" },
    "the narrator is lying": { truth: "the picture says otherwise", voice: "a narrator" },
    "storybook narrator": { voice: "a narrator", closeness: "in the room", wordsPerMinute: 120 },
    "talk over the action": { voTiming: "over the action", voLevel: 0 },
    "fast-talking narration": { wordsPerMinute: 200, setting: "running" },
    "lose the voiceover": { setting: "none", voShare: 0 },
    "a voice from far away": { closeness: "far away", voLevel: -18 },
  });

  W.say("musicCue", {
    "bring in the music": { setting: "under", build: "swells" },
    "let the music swell": { build: "swells", swellTime: 10, setting: "featured" },
    "big emotional crescendo": { build: "crescendos", setting: "featured", tellsFeeling: "insists" },
    "music on the look": { cueStart: "on a look" },
    "hit the cut": { cueStart: "on a cut", cueOffset: 0 },
    "kill the music": { setting: "off", fadeOutTime: 0 },
    "let it fade out": { build: "fades", fadeOutTime: 8 },
    "don't tell us how to feel": { tellsFeeling: "holds back", setting: "under" },
    "make it more dramatic": { tellsFeeling: "insists", build: "crescendos", level: 0 },
    "keep it under the scene": { setting: "under", level: -18 },
  });

  W.say("soundToCut", {
    "sound leads the picture": { setting: "J-cut", overlap: 2 },
    "pre-lap the next scene": { setting: "J-cut", overlap: 2, carrier: "a voice" },
    "let the line hang over": { setting: "L-cut", overlap: 2, carrier: "a voice" },
    "sound lingers after the cut": { setting: "L-cut", overlap: 3 },
    "smash cut": { setting: "hard", jolt: "a jolt", overlap: 0 },
    "clean cut": { setting: "hard", jolt: "smooth" },
    "smooth the edit": { jolt: "smooth", overlap: 1, carrier: "room sound" },
    "bridge it with music": { carrier: "music", overlap: 3 },
  });

  W.say("music", {
    "needle drop": { familiarity: "famous", vocals: "lyrics we understand", entry: "starts on a cut", presence: "featured" },
    "make it scarier": { mood: "uneasy", key: "minor", tempo: 60 },
    "happier": { mood: "happy", key: "major", energy: 4 },
    "make it sad": { mood: "sad", key: "minor", tempo: 60, instrumentation: "one instrument" },
    "epic orchestral": { instrumentation: "orchestra", energy: 5, presence: "wall of sound" },
    "lonely piano": { instrumentation: "one instrument", energy: 1, mood: "sad" },
    "play against the scene": { counterpoint: "opposite" },
    "happy song over violence": { counterpoint: "opposite", mood: "happy", vocals: "lyrics we understand" },
    "radio in the room": { source: "only the characters", presence: "under the scene" },
    "bring back the theme": { repeatTheme: "the main theme" },
    "cut on the beat": { cutSync: "cuts on the beat" },
    "slam it in": { entry: "slams in", energy: 5 },
  });

  W.say("noMusic", {
    "dead silence": { fill: "true silence", cutoff: "cut dead", purpose: "shock" },
    "let it play dry": { fill: "natural sounds", cutoff: "was never there" },
    "just room tone": { fill: "room tone", purpose: "unease" },
    "silence before the storm": { purpose: "suspense", contrast: "much louder before", length: 10 },
    "the music drops out": { cutoff: "cut dead", contrast: "wall of sound before", quieterBy: 40 },
    "let it breathe": { purpose: "rest", fill: "natural sounds", length: 15 },
    "no score here": { cutoff: "was never there" },
    "raw and real": { fill: "loud real sounds", purpose: "truth" },
  });

  W.say("soundDesign", {
    "make it scarier": { density: "sparse", focusSound: "it takes over", offscreen: 4, realism: "heightened" },
    "bring the world to life": { density: "busy", surround: "all around", offscreen: 3 },
    "cartoon sound effects": { realism: "cartoon" },
    "documentary real": { realism: "true to life", density: "normal" },
    "sensory overload": { density: "overwhelming", eventsPerMinute: 100, surround: "all around" },
    "one sound takes over": { focusSound: "it takes over", focusBoost: 18 },
    "sounds from offscreen": { offscreen: 5 },
    "carry the sound over the cut": { bridge: "carries over the cut", bridgeSeconds: 1.5 },
    "eerie quiet": { density: "sparse", eventsPerMinute: 5 },
  });

  W.say("musicLevel", {
    "duck under the dialogue": { setting: "under", duckFor: "every voice", duck: 12 },
    "music up": { setting: "over", musicDb: -6 },
    "music down": { setting: "under", musicDb: -24 },
    "just the music": { setting: "music only", duck: 0 },
    "bed under the voices": { setting: "under", fillsGaps: "a little", musicDb: -20 },
    "fill the gaps": { fillsGaps: "fills every gap" },
    "fade it under slowly": { fade: "slow", duckRelease: 3 },
    "snap it under": { fade: "instant", duckAttack: 0 },
  });

  W.say("musicSting", {
    "dun dun dun": { setting: "hit", tone: "dramatic", level: "loud" },
    "sad trombone it": { setting: "sad trombone", tone: "silly" },
    "comedy sting": { tone: "silly", stingTiming: "on the moment" },
    "a big reveal hit": { setting: "hit", tone: "dead serious", level: "loud", stingTiming: "on the moment" },
    "angels sing": { setting: "choir" },
    "drumroll please": { setting: "drum roll", stingLength: 3 },
    "needle scratch": { setting: "record scratch", stingTiming: "on the moment" },
    "running gag": { howOften: "a running gag" },
    "build up to it": { setting: "rise", stingLength: 4, stingTiming: "early" },
  });

  W.say("soundRoles", {
    "dialogue first": { setting: "dialogue", dialogue: 80, music: 10 },
    "make the music carry it": { setting: "music", music: 80, dialogue: 10 },
    "action movie mix": { setting: "effects", effects: 70 },
    "let the room speak": { setting: "ambience", ambience: 70 },
    "i can't hear the lines": { dialogue: 90, music: 5, effects: 5 },
    "balanced mix": { dialogue: 40, music: 25, effects: 20, ambience: 15 },
  });

  W.say("soundPlace", {
    "behind you": { around: 180, height: 0, distance: 2, onScreen: "unseen" },
    "from the left": { around: -90 },
    "from the right": { around: 90 },
    "right in front": { around: 0, onScreen: "we see it" },
    "from above": { height: 60 },
    "from below": { height: -60 },
    "far off in the distance": { distance: 80, onScreen: "unseen" },
    "right in your ear": { distance: 0.3, around: 0 },
    "voice in your head": { around: 0, height: 0, distance: 0.3, onScreen: "unseen", moving: "still" },
    "it flies past": { moving: "passes by", around: -60, distance: 10 },
    "something circling": { moving: "circles us", onScreen: "unseen" },
    "just offscreen": { onScreen: "just off the edge", around: 50 },
  });

  W.say("soundDensity", {
    "thick wall of sound": { setting: 6, layers: 12, air: "none" },
    "strip it back": { setting: 1, layers: 2, air: "lots of air" },
    "give it room": { air: "lots of air", gapLength: 3 },
    "it's all mush": { clarity: "mush" },
    "crisp and clear": { clarity: "crystal", air: "some" },
    "low rumble underneath": { rumble: 4 },
    "make it heavier": { rumble: 5, layers: 9, setting: 5 },
    "sparse and lonely": { setting: 1, gapLength: 6, air: "lots of air" },
  });

  W.say("audioFade", {
    "fade in gently": { setting: "fade in", curve: "smooth", length: 2 },
    "fade to silence": { setting: "fade out", fadeDepth: -60, length: 3 },
    "cross it over": { setting: "crossfade", length: 1.5 },
    "hard cut the sound": { setting: "hard", length: 0 },
    "slow fade": { length: 5, curve: "smooth" },
    "drop it at the end": { curve: "sudden at the end" },
    "ease in and out": { setting: "both", curve: "smooth" },
  });

  W.say("voiceEffect", {
    "sounds like a robot": { setting: "robot", effectStrength: 80 },
    "chipmunk voice": { setting: "high", pitchShift: 8 },
    "demon voice": { setting: "deep", pitchShift: -10, wobble: "warps" },
    "voice of god": { setting: "echo", pitchShift: -3, who: "the narrator" },
    "over the phone": { setting: "radio", effectStrength: 70 },
    "walkie-talkie": { setting: "radio", effectStrength: 90 },
    "through a bullhorn": { setting: "megaphone" },
    "under the water": { setting: "underwater", wobble: "wavers" },
    "drugged and woozy": { wobble: "warps", wobbleRate: 1 },
    "just one line": { effectSpan: "one line" },
  });

  W.say("sfxHits", {
    "punch it up with hits": { setting: "busy", kind: "hit", sync: "the action" },
    "whooshes on the cuts": { kind: "whoosh", sync: "the cuts" },
    "trailer whooshes": { kind: "whoosh", hitSize: "huge", setting: "some" },
    "cartoony boings": { cartoony: "cartoony", kind: "pop" },
    "youtube editing": { setting: "wall to wall", cartoony: "cartoony", perMinute: 40 },
    "keep it real": { cartoony: "real", setting: "sparse" },
    "build with a riser": { kind: "riser", hitLength: 3 },
    "sell the hit": { hitSize: "big", hitDb: 0, kind: "hit" },
    "a little ding": { kind: "ding", hitSize: "small" },
  });

  W.say("loudness", {
    "turn it up": { setting: "loud", averageLoud: -12 },
    "keep it quiet": { setting: "quiet", averageLoud: -30 },
    "blow out the speakers": { setting: "peaking", peak: 0, punch: 5 },
    "loud and quiet moments": { swings: "huge", loudRange: 25 },
    "squash it flat": { swings: "flat", loudRange: 3 },
    "broadcast level": { setting: "normal", averageLoud: -23, peak: -2 },
    "streaming level": { setting: "normal", averageLoud: -14, peak: -1 },
    "more punch": { punch: 5 },
    "leave the grit in": { noise: 0 },
    "clean up the noise": { noise: 80 },
  });

  W.say("translatedVoice", {
    "dub it": { setting: "translated", originalUnder: "gone" },
    "dub it with lip sync": { setting: "translated with lip sync", lipOffset: 0 },
    "keep the original": { setting: "original", subtitles: "all" },
    "subtitles only": { setting: "original", subtitles: "all" },
    "news style voiceover": { setting: "translated", originalUnder: "faint", originalDb: -24 },
    "sound just like them": { soundsLike: "a clone" },
    "dub into spanish": { setting: "translated", language: "Spanish" },
    "dub into french": { setting: "translated", language: "French" },
  });

  W.say("voiceCleanup", {
    "clean up the dialogue": { setting: "both", hiss: 60, echoCut: 70 },
    "get rid of the echo": { setting: "echo reduced", echoCut: 90 },
    "too echoey": { setting: "echo reduced", echoCut: 80 },
    "kill the hiss": { hiss: 100 },
    "make the voice warmer": { warmth: "warm" },
    "radio voice": { warmth: "rich", setting: "voice enhanced" },
    "lose the breaths": { breaths: "removed", breathCut: 25 },
    "keep it natural": { setting: "none", breaths: "kept", room: "a little" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
