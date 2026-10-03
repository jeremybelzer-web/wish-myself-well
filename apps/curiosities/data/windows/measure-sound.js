/* Audio, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z).
   Where a sound sits in 3D is soundPlace (win-space.js) and is not repeated here. */
(function (W) {
  /* Adds the new settings, a "Measured" group listing them, and at most one face and one preset. */
  const M = (id, sliders, w) => {
    w = w || {};
    W.add(id, {
      sliders,
      window: { faces: w.face ? [w.face] : [], groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }], presets: w.preset ? [w.preset] : [] },
    });
  };

  M("voiceover", [
    ["voLevel", "Loudness against the scene", [-30, 6, "dB"], "How much louder (plus) or quieter (minus) the voice-over is than the scene's own sound.", { from: -3, to: 3 }],
    ["voLead", "Seconds ahead of the picture", [-10, 10, "s", 0.5], "How many seconds before (plus) or after (minus) we see a thing the voice names it.", { from: 0, to: 2 }],
    ["wordsPerMinute", "Words per minute", [80, 220, ""], "How fast the voice speaks; most people talk at about 150.", { from: 130, to: 160 }],
    ["voShare", "Share of time speaking", [0, 100, "%"], "How much of the scene has the voice-over talking.", { from: 10, to: 40 }],
  ], {
    face: { face: "dial", slider: "voLead" },
    preset: { label: "Tells us first", plain: "The voice names things a couple of seconds before we see them.", set: { voLead: 3, voShare: 40 } },
  });

  M("musicCue", [
    ["cueOffset", "Starts before or after its moment", [-10, 10, "s", 0.5], "Seconds the music starts before (minus) or after (plus) the line, look or cut it answers.", { from: 0, to: 0 }],
    ["swellTime", "Seconds to swell", [0, 60, "s"], "How long the music takes to reach full strength.", { from: 2, to: 10 }],
    ["fadeOutTime", "Seconds to fade out", [0, 20, "s", 0.5], "How long the music takes to die away at the end.", { from: 1, to: 4 }],
  ]);

  M("music", [
    ["entryOffset", "Comes in before or after", [-10, 10, "s", 0.5], "Seconds the music arrives before (minus) or after (plus) the moment it belongs to.", { from: 0, to: 0 }],
    ["fadeIn", "Seconds to fade in", [0, 30, "s", 0.5], "How long the music takes to rise to its level.", { from: 0, to: 3 }],
    ["fadeOut", "Seconds to fade out", [0, 30, "s", 0.5], "How long the music takes to go away.", { from: 1, to: 4 }],
  ], { face: { face: "pad", x: "fadeIn", y: "fadeOut", xLabel: "Slower in", yLabel: "Slower out" } });

  M("noMusic", [
    ["quieterBy", "How much quieter", [0, 60, "dB"], "How many decibels the sound drops from the moment before.", { from: 6, to: 20 }],
    ["fillLevel", "Level of what fills it", [-80, -20, "dB"], "How loud the room tone or natural sounds are in the gap; -80 is near silence.", { from: -60, to: -40 }],
  ]);

  M("soundDesign", [
    ["eventsPerMinute", "Sounds per minute", [0, 120, ""], "How many separate sounds (a door, a step, a horn) we hear each minute.", { from: 5, to: 30 }],
    ["focusBoost", "Singled-out sound louder by", [0, 24, "dB"], "How many decibels the one sound we should notice is pushed above the rest.", { from: 0, to: 6 }],
    ["bridgeSeconds", "Seconds over the cut", [0, 4, "s", 0.1], "How long a sound starts early or carries on across a cut.", { from: 0, to: 1 }],
  ]);

  M("musicLevel", [
    ["musicDb", "Music level under speech", [-40, 0, "dB"], "How loud the music sits while someone talks; 0 is full level.", { from: -20, to: -10 }],
    ["duckAttack", "Seconds to dip", [0, 2, "s", 0.05], "How fast the music drops when a voice starts.", { from: 0.1, to: 0.5 }],
    ["duckRelease", "Seconds to come back", [0, 5, "s", 0.1], "How fast the music returns when the voice stops.", { from: 0.5, to: 2 }],
  ], { face: { face: "pad", x: "duckAttack", y: "duckRelease", xLabel: "Slower dip", yLabel: "Slower return" } });

  M("musicSting", [
    ["stingLength", "Length of the sting", [0.2, 10, "s", 0.1], "How many seconds the sting lasts.", { from: 0.5, to: 3 }],
    ["stingOffset", "Before or after the moment", [-2, 2, "s", 0.05], "Seconds the sting lands before (minus) or after (plus) the moment it marks.", { from: 0, to: 0 }],
    ["stingDb", "Sting level", [-30, 6, "dB"], "How much louder (plus) or quieter (minus) the sting is than the scene.", { from: -6, to: 0 }],
    ["stingsPerMinute", "Stings per minute", [0, 20, ""], "How many stings land each minute.", { from: 0, to: 2 }],
  ], {
    face: { face: "dial", slider: "stingOffset" },
    preset: { label: "Late beat", plain: "A short sting half a second after the joke lands.", set: { stingOffset: 0.5, stingLength: 1 } },
  });

  M("soundDensity", [
    ["gapLength", "Typical gap between sounds", [0, 10, "s", 0.1], "Seconds of space between one sound and the next.", { from: 0.2, to: 2 }],
  ]);

  M("audioFade", [
    ["fadeDepth", "Fades down to", [-60, 0, "dB"], "How low the sound goes at the quiet end of the fade; -60 is gone.", { from: -60, to: -60 }],
  ]);

  M("voiceEffect", [
    ["pitchShift", "Pitch shift", [-12, 12, "semitones"], "How far the voice is moved up (plus) or down (minus); 12 is a whole octave.", { from: 0, to: 0 }],
    ["effectSeconds", "How long it lasts", [0, 600, "s", 1], "Seconds the effect stays on the voice.", { from: 2, to: 30 }],
    ["wobbleRate", "Wobbles per second", [0, 10, "", 0.1], "How fast the voice wavers when the effect moves.", { from: 0, to: 2 }],
  ], { face: { face: "dial", slider: "pitchShift" } });

  M("sfxHits", [
    ["hitOffset", "Before or after the action", [-0.5, 0.5, "s", 0.01], "Seconds the hit lands before (minus) or after (plus) the action it marks.", { from: 0, to: 0 }],
    ["hitDb", "Hit level", [-30, 6, "dB"], "How much louder (plus) or quieter (minus) each hit is than the scene.", { from: -6, to: 0 }],
    ["hitLength", "Length of each hit", [0.05, 5, "s", 0.05], "How many seconds each sound hit lasts.", { from: 0.2, to: 1 }],
  ]);

  M("loudness", [
    ["averageLoud", "Average loudness", [-40, -5, "LUFS"], "How loud the whole mix sounds on average (LUFS, the meter streaming sites use; -14 is typical online).", { from: -24, to: -14 }],
    ["loudRange", "Quietest to loudest", [0, 30, "dB"], "How many decibels between the quiet parts and the loud parts.", { from: 6, to: 15 }],
  ]);

  M("translatedVoice", [
    ["lipOffset", "Lips off by", [0, 500, "ms", 10], "Thousandths of a second between the mouth moving and the translated word; under 50 looks right.", { from: 0, to: 80 }],
    ["originalDb", "Original voice level", [-60, 0, "dB"], "How loud the original voice stays underneath; -60 is gone.", { from: -60, to: -20 }],
  ]);

  M("voiceCleanup", [
    ["echoCut", "Echo taken out", [0, 100, "%"], "How much of the room's echo is removed from the voice.", { from: 0, to: 60 }],
    ["breathCut", "Breaths turned down by", [0, 30, "dB"], "How many decibels quieter the breaths between words are made.", { from: 0, to: 10 }],
  ]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
