/* Performance, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z).
   Angles around a person: 0 = in front of them (or straight at the camera), 90 = to their right, 180 = behind.
   Up and down: positive is above, negative below. Timing: negative is before the line, positive after it. */
(function (W) {
  W.add("emotion", {
    sliders: [
      ["feltBy", "Whose feeling it is", ["the speaker", "the listener", "the whole room", "the audience"], "Who in the scene this feeling belongs to.", { unordered: true }],
      ["secondShare", "Share of the second feeling", [0, 50, "%"], "How much of the moment the other, mixed-in feeling takes up.", { from: 0, to: 20 }],
      ["landsAt", "Arrives before or after the line", [-5, 5, "s", 0.5], "Seconds from the line to the moment the feeling shows; below zero means it shows first.", { from: 0, to: 1 }],
      ["lastsFor", "How long it lasts", [0, 120, "s"], "Seconds the feeling stays before another one takes over.", { from: 5, to: 20 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["feltBy", "secondShare", "landsAt", "lastsFor"] }],
      presets: [{ label: "The listener feels it first", plain: "The listener's feeling shows a second before the line ends.", set: { feltBy: "the listener", landsAt: -1, lastsFor: 8 } }],
    },
  });

  W.add("characterPath", {
    sliders: [
      ["pathRelative", "Moving relative to", ["the camera", "the other character", "the room", "a door or object"], "What the path goes toward, away from or around.", { unordered: true }],
      ["pathMeters", "Meters walked", [0, 30, "m", 0.5], "How far they actually travel along the path.", { from: 0, to: 4 }],
      ["pathHeading", "Direction against the camera", [-180, 180, "°"], "Which way they head: 0 straight at the camera, 90 across to the right, -90 across to the left, 180 straight away.", { from: 90, to: 90 }],
      ["pathSeconds", "Seconds the walk takes", [0, 30, "s", 0.5], "From the first step to the stop.", { from: 0, to: 4 }],
      ["endGap", "Ends this far from them", [0, 10, "m", 0.1], "Meters between the walker and the thing the path is relative to when they stop.", { from: 2, to: 1 }],
    ],
    window: {
      faces: [{ face: "pad", x: "pathHeading", y: "pathMeters", xLabel: "across to toward/away", yLabel: "short to long walk" }],
      groups: [{ label: "Measured", sliders: ["pathRelative", "pathMeters", "pathHeading", "pathSeconds", "endGap"] }],
      presets: [{ label: "Walks right up to them", plain: "Four meters toward the other person, ending close.", set: { pathRelative: "the other character", pathMeters: 4, pathSeconds: 3, endGap: 0.5 } }],
    },
  });

  W.add("bodyEnter", {
    sliders: [
      ["throughWhat", "Comes in through", ["the frame edge", "a door", "from behind something", "out of the blur"], "What they enter or leave through.", { unordered: true }],
      ["entryDistance", "This far from the camera", [0.3, 30, "m", 0.1], "Meters between the camera and the person as they enter.", { from: 3, to: 3 }],
      ["entryHeight", "How tall when they enter", [5, 300, "%"], "Their height as a share of the frame's height; over 100 means they are cut off.", { from: 60, to: 60 }],
      ["crossSeconds", "Seconds to come fully in", [0, 5, "s", 0.1], "From the first bit of them showing to all of them in frame.", { from: 1, to: 1 }],
    ],
    window: {
      faces: [{ face: "frame", size: "entryHeight" }],
      groups: [{ label: "Measured", sliders: ["throughWhat", "entryDistance", "entryHeight", "crossSeconds"] }],
      presets: [{ label: "Looms into the lens", plain: "Steps in from the edge very close, too big for the frame.", set: { throughWhat: "the frame edge", entryDistance: 0.5, entryHeight: 200, crossSeconds: 0.5 } }],
    },
  });

  W.add("silence", {
    sliders: [
      ["silenceRate", "Silences per minute", [0, 10, "per minute", 0.5], "How often a real silence falls in the scene.", { from: 0, to: 2 }],
      ["silenceShare", "Share of the scene in silence", [0, 100, "%"], "How much of the scene's running time nobody speaks.", { from: 0, to: 20 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["silenceRate", "silenceShare"] }] },
  });

  W.add("faceLens", {
    sliders: [
      ["lookingAt", "Face is aimed at", ["the other person", "the camera", "an object", "nothing"], "What the face is turned toward.", { unordered: true }],
      ["faceTurn", "Face turned from the camera", [-90, 90, "°"], "0 looks straight down the lens; 90 is a full profile to their right, -90 to their left.", { from: 30, to: 30 }],
      ["faceTilt", "Chin up or down", [-45, 45, "°"], "Positive tips the chin up, negative tips it down.", { from: 0, to: 0 }],
      ["eyelineOff", "Eyeline away from the lens", [0, 90, "°"], "How many degrees the eyes look past the camera; 0 is straight into it.", { from: 15, to: 15 }],
      ["faceHeight", "Face size in frame", [3, 100, "%"], "How tall the face is as a share of the frame's height.", { from: 25, to: 25 }],
    ],
    window: {
      faces: [{ face: "pad", x: "faceTurn", y: "faceTilt", xLabel: "turned left to right", yLabel: "chin down to up" }],
      groups: [{ label: "Measured", sliders: ["lookingAt", "faceTurn", "faceTilt", "eyelineOff", "faceHeight"] }],
      presets: [{ label: "Classic close-up eyeline", plain: "Three-quarter face, eyes just past the lens.", set: { lookingAt: "the other person", faceTurn: 25, faceTilt: 0, eyelineOff: 10, faceHeight: 45 } }],
    },
  });

  W.add("characterSpeed", {
    sliders: [
      ["speedVs", "Speed compared with", ["the camera", "the other characters", "the crowd", "their usual pace"], "What the speed is judged against.", { unordered: true }],
      ["speedMps", "Meters per second", [0, 8, "m/s", 0.1], "Real travel speed: about 1.4 is a normal walk, 3 a jog, 7 a sprint.", { from: 1.4, to: 1.4 }],
      ["rampSeconds", "Seconds to reach full speed", [0, 5, "s", 0.1], "How long they take to get up to speed from standing.", { from: 0.5, to: 0.5 }],
      ["crossFrame", "Seconds to cross the frame", [0.5, 20, "s", 0.5], "How long they take to go from one side of the picture to the other.", { from: 4, to: 4 }],
    ],
    window: {
      faces: [{ face: "dial", slider: "speedMps" }],
      groups: [{ label: "Measured", sliders: ["speedVs", "speedMps", "rampSeconds", "crossFrame"] }],
      presets: [{ label: "Sprint past the crowd", plain: "Running hard while everyone else strolls.", set: { speedVs: "the crowd", speedMps: 6, rampSeconds: 1, crossFrame: 1 } }],
    },
  });

  W.add("characterToLens", {
    sliders: [
      ["startMeters", "Starts this far from the camera", [0.3, 50, "m", 0.1], "Meters between them and the lens when the move begins.", { from: 8, to: 8 }],
      ["endMeters", "Stops this far from the camera", [0.1, 50, "m", 0.1], "Meters between them and the lens when they stop.", { from: 2, to: 2 }],
      ["eyeHeight", "Eyes above or below the lens", [-1.5, 1.5, "m", 0.05], "How far their eyes sit above (positive) or below the camera.", { from: 0, to: 0 }],
      ["eyelineMiss", "Eyes miss the lens by", [0, 45, "°"], "Degrees their gaze passes beside the camera; 0 stares straight into it.", { from: 10, to: 10 }],
      ["moveSeconds", "Seconds for the move", [0, 30, "s", 0.5], "How long the walk toward or away from the lens takes.", { from: 4, to: 4 }],
    ],
    window: {
      faces: [{ face: "pad", x: "startMeters", y: "endMeters", xLabel: "starts near to far", yLabel: "stops near to far" }],
      groups: [{ label: "Measured", sliders: ["startMeters", "endMeters", "eyeHeight", "eyelineMiss", "moveSeconds"] }],
      presets: [{ label: "Walks into the lens", plain: "From far off right up to the camera, staring into it.", set: { startMeters: 15, endMeters: 0.4, eyeHeight: 0, eyelineMiss: 0, moveSeconds: 8 } }],
    },
  });

  W.add("whoMoves", {
    sliders: [
      ["moveMeters", "Meters the mover travels", [0, 20, "m", 0.5], "How far the moving person goes during the line.", { from: 0, to: 2 }],
      ["circleAround", "Ends this way around the other", [-180, 180, "°"], "Where the mover ends up around the still one: 0 in front of them, 90 to their right, 180 behind.", { from: 0, to: 45 }],
      ["endGap", "Ends this far from the other", [0, 10, "m", 0.1], "Meters between the two people when the move is done.", { from: 2, to: 1 }],
    ],
    window: {
      faces: [{ face: "orbit", around: "circleAround", distance: "endGap" }],
      groups: [{ label: "Measured", sliders: ["moveMeters", "circleAround", "endGap"] }],
      presets: [{ label: "Circles behind them", plain: "Walks around to stand close behind the still one.", set: { moveMeters: 3, circleAround: 180, endGap: 0.6 } }],
    },
  });

  W.add("volume", {
    sliders: [
      ["loudDb", "Loudness in decibels", [30, 110, "dB"], "How loud the voice is where the listener stands: about 60 is talk, 80 is a shout.", { from: 60, to: 60 }],
      ["overRoom", "Voice above the room sound", [-10, 40, "dB"], "How far the voice rises over the background noise.", { from: 20, to: 20 }],
      ["listenerMeters", "Speaking to someone this far", [0.2, 30, "m", 0.1], "Meters to the person they are talking to.", { from: 1.5, to: 1.5 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["loudDb", "overRoom", "listenerMeters"] }],
      presets: [{ label: "Shouting across a noisy room", plain: "Loud, barely over the noise, far away.", set: { loudDb: 85, overRoom: 5, listenerMeters: 10 } }],
    },
  });

  W.add("pace", {
    sliders: [
      ["overlapSecs", "Lines run over each other by", [0, 3, "s", 0.1], "Seconds one person keeps talking after the next has started.", { from: 0, to: 0 }],
      ["endChange", "Speed change near the end", [-50, 50, "%"], "How much faster (positive) or slower the last words go than the start.", { from: 0, to: 0 }],
      ["linesPerMin", "Lines per minute", [1, 40, "per minute"], "How many lines of dialogue fit in a minute.", { from: 8, to: 8 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["overlapSecs", "endChange", "linesPerMin"] }] },
  });

  W.add("faceIntensity", {
    sliders: [
      ["showsTo", "Shown to", ["the other person", "the camera", "nobody, alone", "a crowd"], "Who the expression is for.", { unordered: true }],
      ["riseSeconds", "Seconds to reach full strength", [0, 5, "s", 0.1], "How long the expression takes to build.", { from: 0.5, to: 0.5 }],
      ["fadeSeconds", "Seconds to fade", [0, 5, "s", 0.1], "How long it takes to leave the face.", { from: 1, to: 1 }],
      ["vsScene", "Compared with the rest of the scene", [0, 300, "%"], "Its strength against the scene's usual expression; 100 is the same.", { from: 100, to: 100 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["showsTo", "riseSeconds", "fadeSeconds", "vsScene"] }],
      presets: [{ label: "Crumbles when alone", plain: "Three times stronger than anywhere else, with nobody watching.", set: { showsTo: "nobody, alone", riseSeconds: 2, vsScene: 300 } }],
    },
  });

  W.add("touch", {
    sliders: [
      ["touchSeconds", "How long the touch lasts", [0, 30, "s", 0.5], "Seconds the hands stay in contact.", { from: 1, to: 1 }],
      ["fromAngle", "Comes from this side", [-180, 180, "°"], "Where the toucher is around the touched person: 0 in front, 90 their right, 180 behind.", { from: 0, to: 0 }],
      ["gapBefore", "Distance before the touch", [0, 3, "m", 0.05], "Meters between them just before they make contact.", { from: 1, to: 1 }],
      ["touchesPerMin", "Touches per minute", [0, 20, "per minute"], "How often they touch across the scene.", { from: 0, to: 2 }],
    ],
    window: {
      faces: [{ face: "orbit", around: "fromAngle", distance: "gapBefore" }],
      groups: [{ label: "Measured", sliders: ["touchSeconds", "fromAngle", "gapBefore", "touchesPerMin"] }],
      presets: [{ label: "Hand on the shoulder from behind", plain: "Comes up close behind and holds it.", set: { fromAngle: 180, gapBefore: 0.5, touchSeconds: 4 } }],
    },
  });

  W.add("vocalTone", {
    sliders: [
      ["aimedAt", "Spoken toward", ["the listener", "themself", "the room", "the camera"], "Who or where the voice is pointed.", { unordered: true }],
      ["pitchShift", "Pitch shift from normal", [-12, 12, "semitones"], "How far above or below their everyday voice they speak.", { from: 0, to: 0 }],
      ["pitchSwing", "Pitch rise or fall in the line", [-12, 12, "semitones"], "How far the pitch climbs (positive) or drops from first word to last.", { from: 0, to: 0 }],
      ["breathiness", "Breath in the voice", [0, 100, "%"], "How much air you hear around the words; 100 is a whisper.", { from: 10, to: 10 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["aimedAt", "pitchShift", "pitchSwing", "breathiness"] }],
      presets: [{ label: "Talking to themself", plain: "Low, breathy, trailing down.", set: { aimedAt: "themself", pitchShift: -3, pitchSwing: -5, breathiness: 60 } }],
    },
  });

  W.add("toneArc", {
    sliders: [
      ["turnSeconds", "Seconds for the tone to turn", [0, 300, "s"], "How long the change into this tone takes on screen.", { from: 30, to: 30 }],
      ["vsFilm", "Stronger than the rest of the film", [0, 300, "%"], "How intense this part's tone is against the film's usual level; 100 is the same.", { from: 100, to: 100 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["turnSeconds", "vsFilm"] }] },
  });

  W.add("timePerCharacter", {
    sliders: [
      ["countedOver", "Counted across", ["this scene", "this sequence", "the whole film"], "The stretch of film the shares are measured over.", { unordered: true }],
      ["avgShot", "Average shot on each person", [0.5, 30, "s", 0.5], "Seconds a shot usually stays on one person.", { from: 4, to: 4 }],
      ["longestAway", "Longest stretch off screen", [0, 600, "s"], "The most seconds the lead goes unseen.", { from: 0, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["countedOver", "avgShot", "longestAway"] }] },
  });

  W.add("actionCutRate", {
    sliders: [
      ["shortestShot", "Shortest shot", [2, 48, "frames"], "Frames in the briefest shot of the action (24 frames is one second).", { from: 12, to: 12 }],
      ["angleJump", "Camera jump per cut", [0, 180, "°"], "How many degrees around the action the camera moves from one shot to the next.", { from: 30, to: 30 }],
      ["vsTalk", "Faster than the talking scenes", [100, 800, "%"], "Cut rate here against the film's dialogue scenes; 200 is twice as many cuts.", { from: 200, to: 200 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["shortestShot", "angleJump", "vsTalk"] }] },
  });

  W.add("walkAndTalk", {
    sliders: [
      ["camAround", "Camera around the walkers", [-180, 180, "°"], "0 is in front walking backwards, 90 beside them on their right, 180 following behind.", { from: 0, to: 0 }],
      ["camDistance", "Camera this far from them", [0.5, 15, "m", 0.1], "Meters between the camera and the walkers.", { from: 2, to: 2 }],
      ["walkSpeed", "Walking speed", [0.3, 6, "m/s", 0.1], "Meters per second; about 1.4 is a normal walk.", { from: 1.4, to: 1.4 }],
      ["sideGap", "Gap between the walkers", [0.2, 3, "m", 0.05], "How far apart the people walking side by side are.", { from: 0.6, to: 0.6 }],
    ],
    window: {
      faces: [{ face: "orbit", around: "camAround", distance: "camDistance" }],
      groups: [{ label: "Measured", sliders: ["camAround", "camDistance", "walkSpeed", "sideGap"] }],
      presets: [{ label: "Leading the corridor talk", plain: "Camera backs up in front of two people walking close.", set: { camAround: 0, camDistance: 2.5, walkSpeed: 1.6, sideGap: 0.5 } }],
    },
  });

  W.add("listenerBody", {
    sliders: [
      ["listenGap", "Distance from the speaker", [0.2, 6, "m", 0.05], "Meters between the listener and the person talking.", { from: 1.2, to: 1.2 }],
      ["listenLean", "Leans in or away", [-30, 30, "°"], "Degrees the upper body tips toward (positive) or away from the speaker.", { from: 0, to: 0 }],
      ["turnedFrom", "Turned from the speaker", [0, 180, "°"], "0 faces them square on; 90 is side-on; 180 is back turned.", { from: 0, to: 0 }],
      ["listenerHeight", "Listener's size in frame", [0, 300, "%"], "Their height as a share of the frame's height; 0 means not in the shot.", { from: 50, to: 50 }],
    ],
    window: {
      faces: [{ face: "pad", x: "turnedFrom", y: "listenLean", xLabel: "facing to turned away", yLabel: "leaning away to in" }],
      groups: [{ label: "Measured", sliders: ["listenGap", "listenLean", "turnedFrom", "listenerHeight"] }],
      presets: [{ label: "Turns their back", plain: "Steps off and turns away while being spoken to.", set: { listenGap: 2.5, listenLean: -5, turnedFrom: 160 } }],
    },
  });

  W.add("animFeelLens", {
    sliders: [["pushPct", "Pushed past real life", [100, 300, "%"], "How much bigger the moves are than a real body would make; 100 is true to life.", { from: 100, to: 120 }]],
    window: { groups: [{ label: "Measured", sliders: ["pushPct"] }] },
  });

  W.add("poseRigLens", {
    sliders: [
      ["bodyTurn", "Body turned from the camera", [-180, 180, "°"], "0 faces the lens square on, 90 is a profile to their right, 180 their back.", { from: 30, to: 30 }],
      ["bodyBend", "Bend through the body", [0, 60, "°"], "Degrees of curve in the line from head to feet.", { from: 5, to: 15 }],
      ["hipTwist", "Shoulders twisted from hips", [0, 90, "°"], "How far the shoulders turn away from the direction the hips face.", { from: 0, to: 20 }],
      ["frontWeight", "Weight on the front foot", [0, 100, "%"], "How much of their weight sits on the forward foot; 50 is even.", { from: 50, to: 50 }],
      ["stanceWidth", "Feet apart", [0, 1.5, "m", 0.05], "Distance between the feet.", { from: 0.3, to: 0.3 }],
    ],
    window: {
      faces: [{ face: "pad", x: "bodyTurn", y: "bodyBend", xLabel: "turned left to right", yLabel: "straight to curved" }],
      groups: [{ label: "Measured", sliders: ["bodyTurn", "bodyBend", "hipTwist", "frontWeight", "stanceWidth"] }],
      presets: [{ label: "Hero stance", plain: "Three-quarter turn, feet wide, weight forward.", set: { bodyTurn: 30, bodyBend: 10, hipTwist: 15, frontWeight: 65, stanceWidth: 0.6 } }],
    },
  });

  W.add("dynamicRange", {
    sliders: [
      ["quietDb", "Quietest line level", [20, 70, "dB"], "How loud the softest line is where the listener stands; 30 is a whisper.", { from: 45, to: 45 }],
      ["loudDb", "Loudest line level", [50, 115, "dB"], "How loud the biggest line is; 85 is a shout.", { from: 70, to: 70 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["quietDb", "loudDb"] }] },
  });

  W.add("rangeChanges", {
    sliders: [
      ["jumpsPerMin", "Jumps per minute", [0, 20, "per minute", 0.5], "How many quiet-to-loud or loud-to-quiet changes happen in a minute.", { from: 1, to: 1 }],
      ["jumpDb", "Size of a jump", [0, 40, "dB"], "Decibels between the level before and after a change.", { from: 10, to: 10 }],
      ["jumpSeconds", "Seconds a jump takes", [0, 5, "s", 0.1], "From the old level to the new one.", { from: 0.5, to: 0.5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["jumpsPerMin", "jumpDb", "jumpSeconds"] }] },
  });

  W.add("breath", {
    sliders: [
      ["breathRate", "Breaths per minute", [4, 40, "per minute"], "About 12 is calm, 30 is panting.", { from: 12, to: 12 }],
      ["breathGap", "Gap from breath to word", [0, 2, "s", 0.05], "Seconds between the end of the breath and the first word.", { from: 0.2, to: 0.2 }],
      ["heldSeconds", "Breath held for", [0, 60, "s"], "Seconds they stop breathing when they hold it.", { from: 0, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["breathRate", "breathGap", "heldSeconds"] }] },
  });

  W.add("eating", {
    sliders: [
      ["bitesPerMin", "Bites per minute", [0, 20, "per minute"], "How often they take a bite or a sip.", { from: 3, to: 3 }],
      ["chewBefore", "Chewing before they can talk", [0, 10, "s", 0.5], "Seconds of chewing between a bite and the next word.", { from: 1, to: 1 }],
      ["mouthFull", "How full the mouth is", [0, 100, "%"], "How stuffed their mouth is while they talk.", { from: 0, to: 30 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["bitesPerMin", "chewBefore", "mouthFull"] }] },
  });

  W.add("gesture", {
    sliders: [
      ["reach", "Hand away from the body", [0, 1, "m", 0.05], "How far the hand travels out from the chest.", { from: 0.2, to: 0.2 }],
      ["pointAngle", "Gesture aims this way", [-180, 180, "°"], "Direction of the gesture: 0 at the listener, 90 to the speaker's right, 180 behind them.", { from: 0, to: 0 }],
      ["gesturesPerMin", "Gestures per minute", [0, 60, "per minute"], "How many gestures land in a minute of talk.", { from: 6, to: 6 }],
      ["gestureSeconds", "How long one gesture lasts", [0.2, 5, "s", 0.1], "From the hand leaving rest to returning.", { from: 1, to: 1 }],
    ],
    window: {
      faces: [{ face: "pad", x: "pointAngle", y: "reach", xLabel: "aimed left to right", yLabel: "close to full reach" }],
      groups: [{ label: "Measured", sliders: ["reach", "pointAngle", "gesturesPerMin", "gestureSeconds"] }],
      presets: [{ label: "Arm flung at the door", plain: "Full reach, pointing off to the side.", set: { reach: 0.8, pointAngle: 90, gestureSeconds: 2 } }],
    },
  });

  W.add("stillness", {
    sliders: [
      ["movePct", "Share of the body moving", [0, 100, "%"], "How much of the body is allowed any movement at all.", { from: 20, to: 20 }],
      ["sway", "Sway", [0, 10, "cm", 0.5], "How far the body drifts while standing still.", { from: 1, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["movePct", "sway"] }] },
  });

  W.add("blink", {
    sliders: [["blinkMs", "Length of one blink", [80, 500, "ms"], "Milliseconds from lid down to lid up; about 150 is normal.", { from: 150, to: 150 }]],
    window: { groups: [{ label: "Measured", sliders: ["blinkMs"] }] },
  });

  W.add("moveTemper", {
    sliders: [
      ["shakeSize", "Wobble size", [0, 20, "cm", 0.5], "How far the camera wanders when it wobbles.", { from: 0, to: 2 }],
      ["overshootPct", "Swings past the action", [0, 30, "%"], "How far the camera overshoots a move before settling, as a share of the move.", { from: 0, to: 5 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["shakeSize", "overshootPct"] }] },
  });

  W.add("spacing", {
    sliders: [["easePct", "Share of the move easing", [0, 100, "%"], "How much of each move is spent speeding up and slowing down.", { from: 30, to: 30 }]],
    window: { groups: [{ label: "Measured", sliders: ["easePct"] }] },
  });

  W.add("stepping", {
    sliders: [["boilPx", "Wobble size", [0, 6, "px", 0.5], "How far the drawn lines jitter from drawing to drawing.", { from: 0, to: 1 }]],
    window: { groups: [{ label: "Measured", sliders: ["boilPx"] }] },
  });

  W.add("overshoot", {
    sliders: [["pastPct", "Goes past the mark by", [0, 40, "%"], "How far past the stopping point it travels, as a share of the move.", { from: 5, to: 5 }]],
    window: { groups: [{ label: "Measured", sliders: ["pastPct"] }] },
  });

  W.add("overlap", {
    sliders: [["trailAngle", "Trails behind by", [0, 90, "°"], "How many degrees hair or cloth swings behind the body.", { from: 15, to: 15 }]],
    window: { groups: [{ label: "Measured", sliders: ["trailAngle"] }] },
  });

  W.add("arcs", {
    sliders: [["trailFrames", "Trail lasts", [0, 24, "frames"], "How many frames a visible motion trail hangs on screen.", { from: 0, to: 6 }]],
    window: { groups: [{ label: "Measured", sliders: ["trailFrames"] }] },
  });

  W.add("leadPart", {
    sliders: [["leadTurn", "How far the lead part turns", [0, 180, "°"], "Degrees the leading part (eyes, head, hips or hands) turns before the rest follows.", { from: 30, to: 30 }]],
    window: { groups: [{ label: "Measured", sliders: ["leadTurn"] }] },
  });

  W.add("squash", {
    sliders: [
      ["squashPct", "Squashed by", [0, 60, "%"], "How much shorter the shape gets on a squash.", { from: 0, to: 15 }],
      ["stretchPct", "Stretched by", [0, 100, "%"], "How much longer the shape gets on a stretch.", { from: 0, to: 20 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["squashPct", "stretchPct"] }] },
  });

  W.add("gazeShift", {
    sliders: [
      ["lookAround", "Eyes look this way", [-90, 90, "°"], "Degrees left (negative) or right of the other person's face; 0 is right at them.", { from: 0, to: 0 }],
      ["lookUpDown", "Eyes look up or down", [-60, 60, "°"], "Degrees above (positive) or below the other person's eyes.", { from: 0, to: 0 }],
      ["dartDeg", "Size of each dart", [0, 60, "°"], "How many degrees the eyes jump on each dart.", { from: 10, to: 10 }],
      ["firstDart", "Seconds before the first dart", [0, 10, "s", 0.1], "How long they hold eye contact before looking away.", { from: 1, to: 1 }],
    ],
    window: {
      faces: [{ face: "pad", x: "lookAround", y: "lookUpDown", xLabel: "left to right", yLabel: "down to up" }],
      groups: [{ label: "Measured", sliders: ["lookAround", "lookUpDown", "dartDeg", "firstDart"] }],
      presets: [{ label: "Can't meet their eyes", plain: "Looks down and to the side almost at once.", set: { lookAround: -25, lookUpDown: -30, firstDart: 0.3 } }],
    },
  });

  W.add("posture", {
    sliders: [
      ["leanDegrees", "Lean in degrees", [-30, 30, "°"], "How far the upper body tips toward (positive) or away from the other person.", { from: 0, to: 0 }],
      ["turnedDeg", "Turned from the other", [0, 180, "°"], "0 faces them square on, 90 is side-on, 180 is back turned.", { from: 0, to: 0 }],
      ["standGap", "Distance from the other", [0.2, 6, "m", 0.05], "Meters between them; under half a meter is intimate, over 1.2 is formal.", { from: 1.2, to: 1.2 }],
      ["chin", "Chin up or down", [-30, 30, "°"], "Positive lifts the chin, negative drops it.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [{ face: "pad", x: "turnedDeg", y: "leanDegrees", xLabel: "facing to turned away", yLabel: "leaning away to in" }],
      groups: [{ label: "Measured", sliders: ["leanDegrees", "turnedDeg", "standGap", "chin"] }],
      presets: [{ label: "Squaring up", plain: "Close, square on, chin up, leaning in.", set: { leanDegrees: 10, turnedDeg: 0, standGap: 0.4, chin: 10 } }],
    },
  });

  W.add("sceneShapes", {
    sliders: [
      ["shapeCount", "Number of big shapes", [0, 20, ""], "How many large shapes you could trace in the frame.", { from: 3, to: 3 }],
      ["shapeFill", "Share of frame filled", [0, 100, "%"], "How much of the picture the shapes cover.", { from: 40, to: 40 }],
      ["personAcross", "Person across the frame", [0, 100, "%"], "Where the person sits from left (0) to right (100) among the shapes.", { from: 50, to: 50 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["shapeCount", "shapeFill", "personAcross"] }] },
  });

  W.add("propBusiness", {
    sliders: [
      ["busyShare", "Share of the scene hands busy", [0, 100, "%"], "How much of the scene the hands are working on the prop.", { from: 60, to: 60 }],
      ["propReach", "Prop this far from them", [0, 2, "m", 0.05], "Distance from the body to the thing they work on.", { from: 0.4, to: 0.4 }],
      ["pauseSeconds", "Pause for the big line", [0, 10, "s", 0.5], "Seconds the hands stop when the line lands.", { from: 0, to: 1 }],
    ],
    window: { groups: [{ label: "Measured", sliders: ["busyShare", "propReach", "pauseSeconds"] }] },
  });

  W.add("moveOnLine", {
    sliders: [
      ["moveRel", "Move relative to", ["the other person", "the camera", "the room"], "What the toward, away or turn is measured against.", { unordered: true }],
      ["moveOffset", "Seconds from the key word", [-3, 3, "s", 0.1], "When the move starts; below zero is before the word.", { from: 0, to: 0 }],
      ["moveMeters", "How far the move goes", [0, 3, "m", 0.05], "Meters the body travels in the move.", { from: 0.5, to: 0.5 }],
      ["turnDegrees", "How far they turn", [0, 180, "°"], "Degrees of turn in the move; 180 turns their back.", { from: 0, to: 45 }],
      ["freezeSeconds", "Freeze length", [0, 10, "s", 0.1], "Seconds they hold still after the move.", { from: 0, to: 1 }],
    ],
    window: {
      groups: [{ label: "Measured", sliders: ["moveRel", "moveOffset", "moveMeters", "turnDegrees", "freezeSeconds"] }],
      presets: [{ label: "Turns away before the line", plain: "Half a second early, a full turn from them, then holds.", set: { moveRel: "the other person", moveOffset: -0.5, turnDegrees: 180, freezeSeconds: 2 } }],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
