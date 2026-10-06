/* Feeling, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z).
   A feeling is measured against something too: toward whom, how far from where it started, how fast it changes,
   how far apart two people's feelings are, and how near they stand while they feel it. */
(function (W) {
  W.add("stakes", {
    sliders: [
      ["timeLeft", "Time left before it's lost", [0, 120, "min"], "How many minutes of story time remain before the loss happens.", { from: 60, to: 60 }],
      ["atRisk", "People who could lose", [1, 100, "people"], "How many people get hurt if this goes wrong.", { from: 1, to: 1 }],
      ["learnedAt", "When we learn what's at risk", [0, 100, "% of the scene"], "How far into the scene the stakes become clear to us.", { from: 10, to: 10 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["timeLeft", "atRisk", "learnedAt"] }],
      presets: [{ label: "Ticking clock", plain: "Minutes left, and we know it from the start.", set: { timeLeft: 5, learnedAt: 0 } }],
    },
  });

  W.add("emoRoadCharacter", {
    sliders: [
      ["sinceLast", "Change since the last scene", [-5, 5, "steps", 1], "How far up or down their feeling has moved since we last saw them.", { from: 0, to: 0 }],
      ["fromFilm", "Above or below the film's road", [-10, 10, "steps", 1], "How far this character sits above or below the mood of the whole film right now.", { from: 0, to: 0 }],
      ["scenesSinceTurn", "Scenes since their last turn", [0, 40, "scenes", 1], "How many scenes since their road last changed direction.", { from: 3, to: 3 }],
    ],
    window: {
      faces: [{ face: "pad", x: "sinceLast", y: "fromFilm", xLabel: "Since last scene", yLabel: "Against the film" }],
      groups: [{ label: "Measured", sliders: ["sinceLast", "fromFilm", "scenesSinceTurn"] }],
    },
  });

  W.add("emoRoadFilm", {
    sliders: [
      ["changeHere", "Change across this scene", [-5, 5, "steps", 1], "How far the film's mood rises or falls from the start of this scene to its end.", { from: 0, to: 0 }],
      ["sinceLastPeak", "Minutes since the last peak", [0, 60, "min", 1], "How long ago the film last hit a high or low point.", { from: 10, to: 10 }],
      ["peakLength", "How long the peak lasts", [0, 600, "s", 5], "How many seconds the film stays at its highest or lowest point.", { from: 30, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["changeHere", "sinceLastPeak", "peakLength"] }] },
  });

  W.add("emoTurn", {
    sliders: [
      ["turnSeconds", "Seconds the turn takes", [0, 60, "s"], "How long it takes from the first flicker to the new feeling.", { from: 3, to: 3 }],
      ["turnSize", "How far it turns", [0, 100, "%"], "How much of the old feeling is replaced; 100 means none of it is left.", { from: 50, to: 50 }],
      ["hintBefore", "Hint comes before by", [0, 120, "s"], "How many seconds before the turn we get the first sign of it.", { from: 0, to: 0 }],
      ["turnedBy", "Turned by", ["themselves", "the other person", "someone offscreen", "an event"], "Who or what the turn comes from.", { unordered: true }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["turnSeconds", "turnSize", "hintBefore", "turnedBy"] }],
      presets: [{ label: "A snap", plain: "A full turn in a second, with no warning.", set: { turnSeconds: 1, turnSize: 100, hintBefore: 0 } }],
    },
  });

  W.add("emoRelease", {
    sliders: [
      ["releaseAt", "When it comes", [0, 100, "% of the scene"], "How far into the scene the held feeling breaks out.", { from: 75, to: 75 }],
      ["nearest", "Nearest person", [0, 20, "m"], "How many meters away the closest person is when it happens.", { from: 2, to: 2 }],
      ["backToCalm", "Back to calm after", [0, 300, "s"], "How many seconds until they are composed again.", { from: 20, to: 20 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["releaseAt", "nearest", "backToCalm"] }] },
  });

  W.add("audienceFeeling", {
    sliders: [
      ["leadLag", "Ahead of or behind them", [-30, 30, "s"], "How many seconds before (minus) or after (plus) the character we feel it.", { from: 0, to: 0 }],
      ["vsCharacter", "Stronger or weaker than theirs", [-100, 100, "%"], "How much stronger (plus) or weaker (minus) our feeling is than the character's.", { from: 0, to: 0 }],
      ["weKnow", "Things we know they don't", [0, 5, "", 1], "How many facts the audience holds that the character doesn't.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [{ face: "pad", x: "leadLag", y: "vsCharacter", xLabel: "Before / after them", yLabel: "Weaker / stronger" }],
      groups: [{ label: "Measured", sliders: ["leadLag", "vsCharacter", "weKnow"] }],
    },
  });

  W.add("catharsis", {
    sliders: [
      ["placed", "Where it falls in the film", [0, 100, "% through the film"], "How far through the film the big release comes.", { from: 85, to: 85 }],
      ["lasts", "How long it lasts", [0, 300, "s", 5], "How many seconds the release itself plays on screen.", { from: 60, to: 60 }],
      ["howMany", "People letting go", [1, 50, "people"], "How many characters let go together.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["placed", "lasts", "howMany"] }] },
  });

  W.add("hope", {
    sliders: [
      ["odds", "Real odds it works out", [0, 100, "%"], "The true chance things work out, next to how much they hope.", { from: 50, to: 50 }],
      ["dropBy", "How much is taken away", [0, 100, "%"], "How much of the hope is lost when the blow lands.", { from: 0, to: 0 }],
      ["dropSeconds", "Seconds to take it away", [0, 60, "s"], "How quickly the hope is taken, from a slow drain to one blow.", { from: 5, to: 5 }],
    ],
    window: {
      faces: [{ face: "pad", x: "odds", y: "level", xLabel: "Real odds", yLabel: "How much hope" }],
      groups: [{ label: "Measured", sliders: ["odds", "dropBy", "dropSeconds"] }],
    },
  });

  W.add("falseHigh", {
    sliders: [
      ["fallSize", "Distance from high to low", [0, 10, "steps", 1], "How far the feeling drops (or climbs) when the truth comes out.", { from: 5, to: 5 }],
      ["fallSeconds", "Seconds from high to crash", [0, 120, "s"], "How long the turn takes once it starts.", { from: 10, to: 10 }],
      ["believedBy", "Believed by", ["the character", "the audience", "everyone", "no one"], "Who is fooled by the false moment.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fallSize", "fallSeconds", "believedBy"] }] },
  });

  W.add("twoRoads", {
    sliders: [
      ["gapChange", "Gap change this scene", [-10, 10, "steps", 1], "How much the two roads move apart (plus) or together (minus) in this scene.", { from: 0, to: 0 }],
      ["lag", "One follows the other by", [0, 20, "scenes", 1], "How many scenes one character's feeling trails the other's.", { from: 0, to: 0 }],
      ["whichTwo", "Which two", ["the leads", "hero and villain", "friends", "family", "lovers"], "Whose two roads are being compared.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["gapChange", "lag", "whichTwo"] }] },
  });

  W.add("dread", {
    sliders: [
      ["threatDistance", "How close the threat is", [0, 100, "m"], "How many meters away the feared thing is right now.", { from: 30, to: 30 }],
      ["threatSeen", "How much of it we see", [0, 100, "%"], "How much of the feared thing is shown on screen.", { from: 10, to: 10 }],
      ["quietBefore", "Quiet before it hits", [0, 60, "s"], "How many seconds of stillness come just before the feared moment.", { from: 5, to: 5 }],
    ],
    window: {
      faces: [{ face: "pad", x: "threatDistance", y: "threatSeen", xLabel: "How far", yLabel: "How much we see" }],
      groups: [{ label: "Measured", sliders: ["threatDistance", "threatSeen", "quietBefore"] }],
      presets: [{ label: "Unseen and near", plain: "Very close, but we hardly see it.", set: { threatDistance: 3, threatSeen: 5 } }],
    },
  });

  W.add("emotionIntensity", {
    sliders: [
      ["riseSeconds", "Seconds to reach the peak", [0, 60, "s"], "How long the feeling takes to climb to its strongest.", { from: 10, to: 10 }],
      ["vsScene", "Against the rest of the scene", [-100, 100, "%"], "How much stronger (plus) or weaker (minus) this moment is than the scene around it.", { from: 0, to: 0 }],
      ["sinceLast", "Change since the last scene", [-5, 5, "steps", 1], "How much stronger or weaker than in the scene before.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["riseSeconds", "vsScene", "sinceLast"] }] },
  });

  W.add("emoActions", {
    sliders: [
      ["count", "Actions this scene", [0, 10, "", 1], "How many feeling-driven actions they make in the scene.", { from: 1, to: 1 }],
      ["reach", "How far the action reaches", [0, 10, "m"], "How many meters across the room the action carries, from their own lap to the far wall.", { from: 0.5, to: 0.5 }],
      ["afterTrigger", "Seconds after the spark", [0, 10, "s"], "How long after the thing that sets them off they act.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["count", "reach", "afterTrigger"] }] },
  });

  W.add("emoContrastPrev", {
    sliders: [
      ["against", "Measured against", ["the last scene", "the last big scene", "the opening", "the same place earlier"], "Which earlier scene this feeling is compared with.", { unordered: true }],
      ["switchSeconds", "Seconds to switch", [0, 30, "s"], "How long the change from the old feeling to the new one takes.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["against", "switchSeconds"] }] },
  });

  W.add("emoShown", {
    sliders: [
      ["maskOff", "Seconds the mask stays off", [0, 60, "s"], "How long the real feeling shows before they hide it again.", { from: 2, to: 2 }],
      ["nearest", "Distance to who sees it", [0, 10, "m"], "How many meters from them the person they show it to is standing.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["maskOff", "nearest"] }] },
  });

  W.add("emotionGap", {
    sliders: [
      ["firstFeels", "First person's feeling", [-5, 5, "", 1], "Where the first character's feeling sits, from very low to very high.", { from: 0, to: 0 }],
      ["secondFeels", "Second person's feeling", [-5, 5, "", 1], "Where the second character's feeling sits, from very low to very high.", { from: 0, to: 0 }],
      ["apart", "Distance between them", [0, 10, "m"], "How many meters apart the two stand while feeling so differently.", { from: 1.5, to: 1.5 }],
    ],
    window: {
      faces: [{ face: "pad", x: "firstFeels", y: "secondFeels", xLabel: "First person", yLabel: "Second person" }],
      groups: [{ label: "Measured", sliders: ["firstFeels", "secondFeels", "apart"] }],
      presets: [{ label: "Calm next to panic", plain: "One steady, one losing it, side by side.", set: { firstFeels: 0, secondFeels: 5, apart: 1 } }],
    },
  });

  W.add("subtext", {
    sliders: [
      ["pauseBefore", "Pause before the line", [0, 5, "s", 0.1], "How long they hesitate before saying the thing they don't mean.", { from: 0.5, to: 0.5 }],
      ["hiddenShare", "Lines with a hidden meaning", [0, 100, "%"], "What share of their lines mean something other than what they say.", { from: 30, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["pauseBefore", "hiddenShare"] }] },
  });

  W.add("emotionalDebt", {
    sliders: [
      ["addedHere", "Added this scene", [0, 5, "", 1], "How much more feeling gets swallowed in this scene.", { from: 1, to: 1 }],
      ["sinceLeak", "Scenes since the last leak", [0, 20, "scenes", 1], "How long since a little of it last slipped out.", { from: 2, to: 2 }],
      ["owedTo", "Held in toward", ["themselves", "a parent", "a partner", "a friend", "an enemy"], "Who the swallowed feeling is really aimed at.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["addedHere", "sinceLeak", "owedTo"] }] },
  });

  W.add("feelingEcho", {
    sliders: [
      ["minutesSince", "Minutes since the first time", [0, 180, "min"], "How many minutes of film since the feeling first appeared.", { from: 30, to: 30 }],
      ["lasts", "How long the echo lasts", [0, 60, "s"], "How many seconds the returning music, place or image stays with us.", { from: 5, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["minutesSince", "lasts"] }] },
  });

  W.add("warmth", {
    sliders: [
      ["sinceLast", "Change since the last scene", [-5, 5, "steps", 1], "How much warmer (plus) or cooler (minus) they are than last time we saw them together.", { from: 0, to: 0 }],
      ["lookShare", "Time looking at each other", [0, 100, "% of the scene"], "How much of the scene they spend meeting each other's eyes.", { from: 30, to: 30 }],
      ["touchCount", "Touches this scene", [0, 10, "", 1], "How many times they touch.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["sinceLast", "lookShare", "touchCount"] }] },
  });

  W.add("emoVoice", {
    sliders: [
      ["wordsPerMinute", "Words a minute", [60, 240, "words a minute", 5], "How fast they speak; most people talk at about 140.", { from: 140, to: 140 }],
      ["louder", "Louder or quieter than usual", [-100, 100, "%"], "How much louder (plus) or quieter (minus) than their normal voice.", { from: 0, to: 0 }],
      ["longestPause", "Longest pause", [0, 10, "s", 0.5], "The longest gap in the middle of what they say.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["wordsPerMinute", "louder", "longestPause"] }] },
  });

  W.add("wordsAmount", {
    sliders: [
      ["wordCount", "Words in the scene", [0, 2000, "words", 10], "Roughly how many words are spoken in the whole scene.", { from: 300, to: 300 }],
      ["mainShare", "Main character's share", [0, 100, "%"], "How much of the talking the main character does.", { from: 50, to: 50 }],
      ["longestSpeech", "Longest speech", [0, 120, "s"], "How long the longest stretch of one person talking runs.", { from: 15, to: 15 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["wordCount", "mainShare", "longestSpeech"] }] },
  });

  W.add("emoSpread", {
    sliders: [
      ["spreadSeconds", "Seconds to reach everyone", [0, 120, "s"], "How long the feeling takes to pass to the last person it reaches.", { from: 10, to: 10 }],
      ["reached", "People it reaches", [0, 50, "people"], "How many people catch the feeling.", { from: 1, to: 1 }],
      ["radius", "How far it travels", [0, 30, "m"], "How many meters across the room the feeling carries.", { from: 3, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["spreadSeconds", "reached", "radius"] }] },
  });

  W.add("mixedFeelings", {
    sliders: [
      ["secondShare", "Share of the second feeling", [0, 100, "%"], "How much of the mix is the second feeling; 50 is an even split.", { from: 30, to: 30 }],
      ["secondAt", "When the second appears", [0, 100, "% of the scene"], "How far into the scene the second feeling first shows.", { from: 30, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["secondShare", "secondAt"] }] },
  });

  W.add("personalSpace", {
    sliders: [
      ["meters", "Distance between them", [0, 10, "m"], "How many meters apart they actually stand; a normal chat is about 1.2.", { from: 1.2, to: 1.2 }],
      ["wantMeters", "Distance they'd like", [0, 10, "m"], "How far apart the one who minds would like to be.", { from: 1.2, to: 1.2 }],
      ["facing", "Turned toward each other", [0, 180, "°"], "How far their bodies are turned from facing each other; 0 is face to face, 180 back to back.", { from: 0, to: 0 }],
      ["heightGap", "One above the other", [-2, 2, "m", 0.1], "How much higher one's head is than the other's, from sitting, standing or stairs.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [{ face: "pad", x: "meters", y: "wantMeters", xLabel: "Actual distance", yLabel: "Wanted distance" }],
      groups: [{ label: "Measured", sliders: ["meters", "wantMeters", "facing", "heightGap"] }],
      presets: [{ label: "Too close", plain: "Inside arm's reach when one wants a room's width.", set: { meters: 0.4, wantMeters: 3, facing: 0 } }],
    },
  });

  W.add("breather", {
    sliders: [
      ["quieter", "Quieter than the scene before", [0, 100, "%"], "How much calmer, in sound and motion, than the big moment it follows.", { from: 50, to: 50 }],
      ["untilNext", "Minutes until the next big moment", [0, 20, "min"], "How long the rest lasts before the story hits hard again.", { from: 3, to: 3 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["quieter", "untilNext"] }] },
  });

  W.add("emoMove", {
    sliders: [
      ["metersCovered", "Distance covered", [0, 30, "m"], "How many meters they move in the scene, from staying put to pacing the room.", { from: 2, to: 2 }],
      ["closerBy", "Closer or farther", [-10, 10, "m"], "How many meters nearer (plus) or farther (minus) they end up from what they move toward.", { from: 0, to: 0 }],
      ["towardWhat", "Moving toward", ["the other person", "the door", "the camera", "the group", "a window"], "What their movement is measured against.", { unordered: true }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["metersCovered", "closerBy", "towardWhat"] }] },
  });

  W.add("movementAmount", {
    sliders: [
      ["movingShare", "Share of the scene in motion", [0, 100, "%"], "How much of the scene someone on screen is moving.", { from: 40, to: 40 }],
      ["peopleMoving", "People moving", [0, 50, "people"], "How many people are moving at the busiest moment.", { from: 1, to: 1 }],
      ["longestFreeze", "Longest freeze", [0, 30, "s"], "How long the longest moment of complete stillness runs.", { from: 0, to: 0 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["movingShare", "peopleMoving", "longestFreeze"] }] },
  });

  W.add("postureChanges", {
    sliders: [
      ["lean", "Leaning in or away", [-45, 45, "°"], "How many degrees they lean toward (plus) or away from (minus) the other person.", { from: 0, to: 0 }],
      ["turnedAway", "Turned away", [0, 180, "°"], "How far their body is turned from the other person; 0 faces them.", { from: 0, to: 0 }],
      ["reactSeconds", "Seconds after the other's line", [0, 5, "s", 0.1], "How long after the other person speaks they shift.", { from: 1, to: 1 }],
    ],
    window: {
      faces: [{ face: "pad", x: "turnedAway", y: "lean", xLabel: "Turned away", yLabel: "Leaning in" }],
      groups: [{ label: "Measured", sliders: ["lean", "turnedAway", "reactSeconds"] }],
    },
  });

  W.add("settingMood", {
    sliders: [
      ["people", "People in the place", [0, 500, "people"], "How many people are there besides the characters.", { from: 0, to: 0 }],
      ["loudness", "How loud the place is", [20, 100, "dB"], "The background noise in decibels: 30 is a quiet room, 70 a busy street, 90 a club.", { from: 40, to: 40 }],
      ["placeInFrame", "How much of the frame is the place", [0, 100, "%"], "How much of the picture shows the place rather than the people.", { from: 50, to: 50 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["people", "loudness", "placeInFrame"] }] },
  });

  W.add("lightingMood", {
    sliders: [
      ["contrast", "Bright to dark difference", [1, 16, "stops", 0.5], "How far apart the brightest and darkest parts are; each stop is twice as bright.", { from: 4, to: 4 }],
      ["shadowShare", "Share of the frame in shadow", [0, 100, "%"], "How much of the picture is dark.", { from: 30, to: 30 }],
      ["shiftSeconds", "Seconds the change takes", [0, 60, "s"], "How long the light takes to move to its new mood.", { from: 5, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["contrast", "shadowShare", "shiftSeconds"] }] },
  });

  W.add("emoEyes", {
    sliders: [
      ["offAngle", "How far off the other's eyes", [0, 90, "°"], "How many degrees to the side of the other person's eyes they look; 0 is right at them.", { from: 0, to: 0 }],
      ["upDown", "Looking up or down", [-45, 45, "°"], "How many degrees above (plus) or below (minus) level their gaze sits.", { from: 0, to: 0 }],
      ["blinkRate", "Blinks a minute", [0, 60, "per minute"], "How often they blink; about 15 a minute is normal, fewer is a stare.", { from: 15, to: 15 }],
    ],
    window: {
      faces: [{ face: "pad", x: "offAngle", y: "upDown", xLabel: "Off to the side", yLabel: "Up or down" }],
      groups: [{ label: "Measured", sliders: ["offAngle", "upDown", "blinkRate"] }],
      presets: [{ label: "Can't meet their eyes", plain: "Gaze dropped and to the side.", set: { offAngle: 35, upDown: -25 } }],
    },
  });

  W.add("emoHands", {
    sliders: [
      ["fromFace", "Distance from the face", [0, 80, "cm"], "How close the hands come to the face.", { from: 50, to: 50 }],
      ["gestures", "Gestures a minute", [0, 40, "per minute"], "How many hand movements they make each minute.", { from: 6, to: 6 }],
      ["inFrame", "Time the hands are seen", [0, 100, "% of the scene"], "How much of the scene the hands are in the picture.", { from: 50, to: 50 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["fromFace", "gestures", "inFrame"] }] },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
