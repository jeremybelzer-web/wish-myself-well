/* Speed: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("freezeFrame", {
    "record scratch": { setting: "short freeze", soundWhile: "a sting", onWhat: "a reaction" },
    "yep that's me": { setting: "freeze with a title", soundWhile: "narration", onWhat: "a face" },
    "freeze mid-air": { onWhat: "a mid-air jump", setting: "long freeze" },
    "end on a freeze": { timing: "the ending", setting: "long freeze", length: 4 },
    "introduce the character": { setting: "freeze with a title", onWhat: "a face", lookChange: "color drains" },
    "drain the color": { lookChange: "goes black and white" },
    "punch in on the freeze": { zoom: 50 },
    "glide into the freeze": { slowInto: 1 },
    "make it funny": { setting: "short freeze", soundWhile: "a sting", onWhat: "a reaction", length: 1 },
  });
  W.say("pacingCurve", {
    "build to a climax": { setting: "speeds up", peakAt: 85, peakCuts: 80 },
    "slam to a stop": { setting: "speeds up then stops", afterPeak: "dead stop" },
    "wind it down": { setting: "slows down", afterPeak: "eases off" },
    "let it breathe": { pauses: 3, pauseLength: 4 },
    "relentless": { setting: "speeds up", afterPeak: "keeps racing", pauses: 0 },
    "stop and start": { setting: "stop and go", pauses: 4 },
    "make it more exciting": { setting: "speeds up", peakCuts: 100, shortest: 4 },
    "calmer": { setting: "slows down", startCuts: 6, pauses: 2 },
  });
  W.say("attentionReset", {
    "tiktok pace": { setting: "every 1 to 2 seconds", everySec: 1.5, opening: 1 },
    "keep them hooked": { setting: "every 3 to 5 seconds", surprise: "a little fresh" },
    "let it sit": { setting: "rarely", everySec: 30 },
    "hit them with a jolt": { surprise: "a real jolt", jolt: 90 },
    "throw in a joke": { kind: "a joke" },
    "keep it fresh": { variety: "anything goes", surprise: "a little fresh" },
    "faster as it goes": { drift: "closer together" },
    "slow it down": { setting: "every 10 seconds", drift: "further apart" },
    "new faces keep coming": { kind: "a new face" },
  });
  W.say("clipSpeed", {
    "slow-mo": { setting: "slow", percent: 50 },
    "super slow-mo": { setting: "very slow", percent: 10 },
    "speed it up": { setting: "fast", percent: 200 },
    "benny hill speed": { setting: "very fast", percent: 400, feel: "comic", pitch: "follows the speed" },
    "chipmunk voices": { pitch: "follows the speed", pitchShift: 12, setting: "fast" },
    "keep the voice normal": { pitch: "kept", soundBend: "sound stays normal" },
    "make it dreamy": { setting: "slow", feel: "dreamy", smoothChange: "slow glide" },
    "make it heavy": { setting: "slow", feel: "heavy", pitchShift: -7 },
    "make it urgent": { setting: "fast", feel: "urgent" },
  });
  W.say("playDirection", {
    "rewind it": { setting: "rewind and replay", rewindLook: "tape lines", rewindSound: "tape squeal" },
    "play it backwards": { setting: "reversed", rewindSound: "reversed sound" },
    "instant replay": { setting: "rewind and replay", replays: 1, replaySpeed: "slower" },
    "replay from another angle": { replayAngle: "a new side", replayTurn: 90 },
    "see it again closer": { replayAngle: "closer" },
    "sports replay": { setting: "rewind and replay", replaySpeed: "slower", replayPct: 40 },
    "vhs rewind": { rewindLook: "tape lines", rewindSound: "tape squeal", rewindPct: 800 },
    "play it straight": { setting: "forward", replays: 0 },
  });
  W.say("beatSync", {
    "cut to the music": { setting: "on beats", accents: "strong beats" },
    "hit the drop": { accents: "the drop", buildToDrop: "a lot", dropSpeedup: 300 },
    "music video style": { setting: "on beats", looseness: "machine tight", onBeatShare: 90 },
    "loosen it up": { looseness: "feels played", jitter: 3 },
    "every bar": { setting: "on bars", every: 4 },
    "ignore the music": { setting: "ignores the beat", onBeatShare: 0 },
    "cut a frame early": { offset: -1 },
    "build to the drop": { buildToDrop: "a lot" },
  });
  W.say("jumpCut", {
    "vlog style": { setting: "rhythmic", purpose: "restless energy", reframe: "alternating", punchIn: 15 },
    "cut out the ums": { setting: "a few", purpose: "save time", soundCarry: "smoothed over" },
    "godard it": { setting: "constant", purpose: "restless energy", soundCarry: "jumps too" },
    "time is passing": { purpose: "time passing", soundCarry: "music covers it" },
    "punch in for the joke": { purpose: "comedy", reframe: "slight punch-in", punchIn: 25 },
    "lots of jump cuts": { setting: "constant", density: 30 },
    "smooth them out": { soundCarry: "smoothed over", gap: 4 },
    "no jump cuts": { setting: "none", density: 0 },
  });
  W.say("editTemplate", {
    "movie trailer feel": { setting: "cinematic", effectsLevel: "some", hookFirst: "always" },
    "day in my life": { setting: "daily life", clips: 10, clipLength: 1.5 },
    "trip recap": { setting: "travel", clips: 12, textAmount: "a few" },
    "make it a meme": { setting: "meme", textAmount: "lots", clips: 2 },
    "lyric video": { setting: "lyrics", textAmount: "lots" },
    "speed edit": { setting: "velocity", effectsLevel: "loaded", clipLength: 0.5 },
    "short and snappy": { totalLength: 15, clipLength: 0.8 },
    "best bit first": { hookFirst: "always", bestAt: 0 },
    "keep it clean": { effectsLevel: "clean", textAmount: "none" },
  });
  W.say("retimeQuality", {
    "buttery smooth slow-mo": { setting: "optical flow", smoothness: 5, sourceRate: "240 frames" },
    "real high speed": { sourceRate: "240 frames", madeShare: 0 },
    "stuttery slow-mo": { setting: "repeating frames", smoothness: 0 },
    "soft blend": { setting: "frame blending", smoothness: 3 },
    "no warping": { artifacts: "none allowed" },
    "embrace the glitches": { artifacts: "embrace them", setting: "optical flow" },
    "super slow": { slowFactor: 10 },
    "shot at sixty": { sourceRate: "60 frames" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
