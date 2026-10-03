/* Transitions: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("matchCut", {
    "bone to spaceship": { setting: "shape", leap: "another world", obvious: "a wow moment", meaning: "a big idea" },
    "match the movement": { setting: "movement", closeness: "close" },
    "match on the sound": { setting: "sound", obvious: "felt" },
    "jump years ahead": { leap: "years later", meaning: "a link" },
    "line them up perfectly": { closeness: "perfect overlay", lineUp: 100 },
    "make it subtle": { obvious: "hidden", closeness: "loose echo" },
    "show the contrast": { meaning: "a contrast" },
    "same word bridges it": { setting: "word", meaning: "a link" },
    "make it a wow moment": { obvious: "a wow moment", closeness: "perfect overlay", lineUp: 95 },
    "match the colors": { setting: "color", closeness: "close" },
  });
  W.say("transitionKind", {
    "straight cut": { setting: "cut", duration: 0 },
    "smash cut": { setting: "cut", duration: 0, soundOverlap: "hard cut" },
    "dissolve": { setting: "cross dissolve", duration: 1, ease: "eases in and out" },
    "fade out to black": { setting: "fade to black", duration: 1.5 },
    "star wars wipe": { setting: "wipe", direction: "right", duration: 0.7 },
    "whip it": { setting: "whip pan", duration: 0.3 },
    "glitch out": { setting: "glitch", duration: 0.4 },
    "j cut": { soundOverlap: "sound leads", soundOffset: -1 },
    "l cut": { soundOverlap: "sound lags", soundOffset: 1 },
    "hide the seam": { hideSeam: "seamless" },
    "cut on the beat": { onBeat: "right on the beat", beatOffset: 0 },
    "make it punchier": { setting: "flash zoom", duration: 0.3, grab: 90 },
  });
  W.say("fadeEdge", {
    "fade up from black": { setting: "fade in", color: "black", length: 2 },
    "fade to black": { setting: "fade out", color: "black", finality: "an ending" },
    "fade to white": { setting: "fade out", color: "white" },
    "gentle fade": { length: 3, curve: "slow both ends" },
    "quick dip to black": { setting: "both", length: 0.5, finality: "a breath" },
    "hold on black": { holdColor: 3, finality: "an ending" },
    "music fades last": { soundFade: "sound fades last", soundLead: 1 },
    "sound out first": { soundFade: "sound fades first", soundLead: -1 },
    "make it feel final": { finality: "an ending", holdColor: 2, length: 4 },
  });
  W.say("transitionFamily", {
    "keep it simple": { setting: "basic", energy: "calm", consistency: "always one" },
    "youtube energy": { setting: "movement", energy: "punchy", frequency: 15 },
    "old school transitions": { setting: "classic", energy: "calm" },
    "light leaks": { setting: "light", flash: "light leak" },
    "flash frames": { flash: "white flash", flashBright: 90 },
    "glitchy vibe": { setting: "glitch", energy: "punchy" },
    "make it cute": { setting: "whimsical", energy: "lively" },
    "go crazy with it": { energy: "explosive", consistency: "mixed", frequency: 30 },
    "build the energy": { build: "building" },
    "smooth blurry moves": { setting: "blur", motionBlur: 80 },
  });
  W.say("introOutro", {
    "cold open": { setting: "none", hook: "instant", hookTime: 0 },
    "big title card": { titleOn: "a big title", titleSize: 90, titleHold: 3 },
    "slam the title in": { setting: "slam in", mood: "explosive", titleOn: "a big title" },
    "slow opening": { hook: "slow build", mood: "calm", hookTime: 20 },
    "end credits": { setting: "end card", where: "film end" },
    "hook them fast": { hook: "instant", hookTime: 2 },
    "playful intro": { mood: "playful", setting: "swirl in" },
    "make it dramatic": { mood: "dramatic", setting: "light fall" },
  });
  W.say("clipAnimation", {
    "pop it in": { setting: "in", style: "zoom", overshoot: "springy", duration: 0.3 },
    "bounce in": { setting: "in", style: "bounce", overshoot: "springy" },
    "slide it in": { setting: "in", style: "slide", travel: 60 },
    "spin it out": { setting: "out", style: "spin", spinDeg: 360 },
    "keep it wiggling": { setting: "loop", style: "shake", repeat: 8 },
    "hit on the beat": { timing: "the beat", cueOffset: 0 },
    "make it subtle": { strength: 20, overshoot: "none" },
    "make it bouncier": { overshoot: "springy", strength: 80 },
    "grow from nothing": { style: "zoom", startSize: 0, setting: "in" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
