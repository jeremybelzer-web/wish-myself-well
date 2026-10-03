/* Editing: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("tensionCurve", {
    "make it scarier": { setting: 4, audienceGrip: "gripping", tensionFrom: "the unknown" },
    "edge of their seat": { setting: 5, audienceGrip: "breathless", peakHold: 20 },
    "let it breathe": { setting: 1, releaseKind: "slow exhale", releaseLength: 60 },
    "slow burn": { shape: "rising", change: "drifts", buildTime: 480 },
    "ratchet it up": { shape: "rising", change: "steps", setting: 4 },
    "the clock is ticking": { tensionFrom: "a ticking clock", shape: "rising", audienceGrip: "gripping" },
    "break the tension with a laugh": { releaseKind: "a laugh", releaseLength: 10 },
    "rollercoaster": { shape: "peaks and valleys", change: "snaps", peakSpacing: 4 },
    "calmer": { setting: 1, audienceGrip: "loose", change: "drifts" },
    "keep them guessing": { tensionFrom: "a secret", pointsAhead: "demands what's next" },
  });

  W.say("reveal", {
    "dramatic irony": { setting: "before", aheadOf: "the hero", aheadBy: 15 },
    "hitchcock's bomb under the table": { setting: "before", aheadOf: "everyone on screen", aheadBy: 10, size: 4 },
    "find out with the hero": { setting: "with", aheadOf: "the hero", aheadBy: 0 },
    "pull the rug out": { setting: "after", revealSpeed: "all at once", size: 5 },
    "big twist": { setting: "after", size: 5, setup: 4, clueCount: 6 },
    "let it slowly sink in": { revealSpeed: "slow dawning", reactionHold: 12 },
    "plant and pay off": { setup: 5, clueCount: 5 },
    "stay on their face": { reactionFocus: "the one who learns", reactionHold: 8 },
    "the audience knows first": { setting: "before", aheadOf: "everyone on screen" },
    "drip-feed the clues": { revealSpeed: "in pieces", clueCount: 8, holdBack: 30 },
  });

  W.say("mains", {
    "a two-hander": { setting: 2, focusPull: "even", crossPaths: "constantly" },
    "ensemble piece": { setting: 4, focusPull: "even", handoffSpeed: "quick" },
    "it's their story": { focusPull: "all about one", share: 80 },
    "one lead and support": { setting: 3, focusPull: "favoring one", share: 60 },
    "keep them apart": { crossPaths: "never", longestAway: 20 },
    "bring them together more": { crossPaths: "constantly", longestAway: 5 },
    "meet everyone early": { introducedBy: 5 },
    "pass the baton quickly": { handoffSpeed: "rapid" },
  });

  W.say("exit", {
    "kill them off": { setting: "die", weight: 4 },
    "they walk away": { setting: "leave", goodbyeScene: "a short scene" },
    "nobody leaves": { setting: "stay" },
    "out of nowhere": { surprise: "shocking", warning: 0, firstHint: 0 },
    "see it coming": { surprise: "expected", warning: 5, firstHint: 40 },
    "a proper goodbye": { goodbyeScene: "a full farewell", afterglow: 5 },
    "die off screen": { setting: "die", onScreen: "told afterwards" },
    "make it hurt": { weight: 5, seenBy: "the whole group", afterglow: 8 },
    "gone in the last minutes": { exitTiming: "last minutes" },
    "quietly slip away": { setting: "leave", goodbyeScene: "a glance", weight: 1 },
  });

  W.say("intercut", {
    "cut back and forth": { setting: 5, rhythm: 3 },
    "griffith-style race to the rescue": { setting: 7, speedUp: 5, climaxSync: "exactly", converge: "meet" },
    "the stories collide": { converge: "meet", climaxSync: "exactly" },
    "build to the climax": { speedUp: 5, switchesPerMin: 12, finalDwell: 1 },
    "stay with each longer": { setting: 2, dwell: 120 },
    "baptism sequence": { setting: 6, climaxSync: "exactly", cutOnMatch: "matching action" },
    "rhyme the storylines": { converge: "echo each other", cutOnMatch: "similar shapes" },
    "keep them separate": { converge: "stay apart", setting: 1 },
    "more frantic": { switchesPerMin: 16, speedUp: 4, dwell: 10 },
  });

  W.say("povSwitch", {
    "stay with one character": { setting: "one person throughout", characters: 1, mainShare: 100 },
    "inside their head": { povDepth: "their thoughts" },
    "see through their eyes": { povDepth: "through their eyes" },
    "rashomon": { setting: "switches every scene", characters: 4, returnTo: "every few scenes" },
    "hand off on a look": { handoff: "a look" },
    "pass it through an object": { handoff: "a shared object" },
    "keep it objective": { povDepth: "from outside", noticeable: "invisible" },
    "a few points of view": { setting: "switches sometimes", characters: 3 },
    "more intimate": { povDepth: "through their eyes", shortestStay: 10 },
  });

  W.say("sceneEnding", {
    "button the scene": { setting: "button joke", late: "right after the point" },
    "end on a cliffhanger": { setting: "cliffhanger", pullForward: "can't look away" },
    "get out early": { late: "right after the point", holdAfter: 0, soundOut: "cuts dead" },
    "let it linger": { late: "lingers", holdAfter: 6, soundOut: "rings on" },
    "fade to black": { setting: "quiet fade", endsOn: "black", soundOut: "fades" },
    "leave them wondering": { setting: "open question", pullForward: "strong" },
    "smash to the next scene": { setting: "smash cut", soundOut: "cuts dead" },
    "end on the face": { endsOn: "a face", lastShotLength: 4 },
    "the music carries over": { soundOut: "carries over", soundTail: 4 },
    "bring back the earlier line": { setting: "callback" },
  });

  W.say("openingGrab", {
    "cold open": { setting: "mid-action", seconds: 1, firstCutAt: 2 },
    "start in the middle": { setting: "mid-action" },
    "hook them fast": { seconds: 1, grabHold: "unmissable" },
    "start with a bang": { setting: "a shock", firstSound: "a big sound", grabHold: "unmissable" },
    "open on a mystery": { setting: "a question", mystery: "a lot" },
    "stop the scroll": { seconds: 1, grabHold: "unmissable", firstCutAt: 1 },
    "ease them in": { grabHold: "gentle", firstSound: "music", seconds: 8 },
    "start with a laugh": { setting: "a joke" },
    "tease what's coming": { setting: "a promise", stakesShown: "a hint" },
    "open in silence": { firstSound: "silence" },
  });

  W.say("groups", {
    "one big family": { setting: "1", friction: "friendly" },
    "two camps": { setting: "2", friction: "rivals" },
    "us against them": { setting: "2", friction: "at war", groupBalance: 50 },
    "worlds collide at the end": { setting: "2", mergePoint: "only at the end" },
    "come together halfway": { mergePoint: "midway", crossings: 3 },
    "a go-between": { bridge: "a side character", crossings: 4 },
    "small tight crew": { groupSize: 4 },
    "a big crowd": { groupSize: 18 },
  });

  W.say("featureRate", {
    "in every episode": { setting: 10, restLength: 0, spread: 0 },
    "guest star": { setting: 2, screenShare: 10 },
    "give them a break": { restLength: 3 },
    "a big comeback": { returnFanfare: "celebrated", restLength: 4 },
    "their own episode": { spotlightHour: "one" },
    "spread them evenly": { spread: 0 },
    "short season": { seasonHours: 6 },
    "full network season": { seasonHours: 22 },
  });

  W.say("sceneRate", {
    "keep it moving": { setting: "fast", pacingPull: "pushing", perHour: 50 },
    "take our time": { setting: "slow", pacingPull: "relaxed", perHour: 15 },
    "pick up the pace": { trend: "speeding up", pacingPull: "pushing" },
    "make it relentless": { setting: "fast", pacingPull: "relentless", breather: "never" },
    "give us a breather": { breather: "always" },
    "slow it down toward the end": { trend: "slowing" },
    "a montage burst": { burstLength: 8, perHour: 70 },
    "more breathing room": { setting: "slow", breather: "sometimes" },
  });

  W.say("sceneEntry", {
    "come in late": { lateness: 5, setting: "in action", orientTime: 2 },
    "start on the line": { setting: "on a line", firstLineAt: 0 },
    "establishing shot first": { setting: "establishing", firstImage: "a wide view", firstShotLength: 5 },
    "hear it before we see it": { setting: "sound first", firstImage: "darkness" },
    "drop us right in": { startPull: "instant", lateness: 4, orientTime: 1 },
    "ease into the scene": { startPull: "eases in", lateness: 0, orientTime: 15 },
    "open on a detail": { firstImage: "a detail" },
    "open on a face": { firstImage: "a face" },
  });

  W.say("hook", {
    "a signature shot": { setting: "yes", spotlight: "held on" },
    "keep coming back to it": { setting: "yes", count: 6, minutesBetween: 15 },
    "bookend it": { setting: "yes", firstShown: "opening", lastShown: "final shot" },
    "make it iconic": { spotlight: "center stage", frameShare: 80, secondsEach: 5 },
    "it means more each time": { payoff: "transforms", variation: 4 },
    "just in passing": { spotlight: "in passing", secondsEach: 1 },
    "no recurring image": { setting: "no", count: 0 },
  });

  W.say("energyArc", {
    "build and build": { shape: "rising", setting: 4, peakPlace: 90 },
    "more energy": { setting: 4, dropDepth: 1 },
    "bring it down": { setting: 1, shape: "falling" },
    "highs and lows": { shape: "peaks and valleys", peakCount: 4, dropDepth: 4 },
    "start big end quiet": { shape: "falling", peakPlace: 10 },
    "one big peak": { peakCount: 1, peakPlace: 75 },
    "never let up": { setting: 5, dropDepth: 0, carryOver: "fully kept" },
    "even keel": { shape: "flat", change: "holds", setting: 2 },
  });

  W.say("psychOut", {
    "fake them out": { setting: "psych-out", convincing: 4 },
    "it was only a dream": { setting: "psych-out", whoseMind: "the hero", snapBack: "jolting" },
    "jump scare then relief": { setting: "psych-out", payoffTone: "relief", snapBack: "jolting" },
    "gag fake-out": { setting: "psych-out", payoffTone: "a laugh", snapBack: "quick" },
    "it's real this time": { setting: "real" },
    "fool everyone": { convincing: 5, tipOff: "none" },
    "drop a hint it's fake": { tipOff: "one", firstClueAt: 5 },
    "leave a bad feeling": { payoffTone: "dread" },
  });

  W.say("shotOrderLens", {
    "cut faster": { rate: "fast", length: "short", shortestShot: 0.5 },
    "let shots play": { rate: "slow", length: "long", longestShot: 60 },
    "oner": { coverage: "one shot", length: "long", longestShot: 120 },
    "cut on the action": { joins: "cut on action" },
    "j-cut": { leads: "sound leads", leadBy: 1.5 },
    "l-cut": { leads: "picture leads", leadBy: -1.5 },
    "invisible editing": { joins: "cut on action", eyeTrace: "carefully", eyeJump: 10 },
    "build to a frenzy": { accelerate: "strongly", rate: "fast" },
    "cover it from every angle": { coverage: "many angles" },
    "more dramatic": { accelerate: "slightly", joins: "match cuts" },
  });

  W.say("phraseScheme", {
    "in pairs": { setting: "pairs", break: "never" },
    "rule of three": { setting: "threes" },
    "four plus four": { setting: "fours", break: "never" },
    "three three two": { setting: "threes", break: "once", breakAt: "end" },
    "one long run": { setting: "long runs", runsPerScene: 1, runLength: 45 },
    "break the pattern": { break: "often" },
    "speed up each run": { runPace: "quickening" },
    "rest between runs": { pausesBetween: 2 },
  });

  W.say("transition", {
    "straight cut": { setting: "cut", length: 0, jolt: "smooth" },
    "slow dissolve": { setting: "dissolve", length: 3 },
    "smash to": { setting: "smash cut", jolt: "shocking" },
    "match the shapes": { setting: "match cut", carries: "a shape", matchOffset: 5 },
    "bone to spaceship": { setting: "match cut", carries: "a shape", leap: "years later" },
    "lead with the sound": { setting: "sound bridge", carries: "a sound", soundEarly: 2 },
    "jump ahead years": { leap: "years later" },
    "make it seamless": { noticeable: "invisible", jolt: "smooth" },
    "make it jarring": { jolt: "jarring", noticeable: "showy" },
  });

  W.say("callResponse", {
    "they answer each other": { setting: "every cut", answerer: "another person" },
    "ping-pong dialogue": { setting: "every cut", tempo: "rapid-fire", answerGap: 1 },
    "shot reverse shot": { setting: "every cut", eyeline: "toward each other", answerer: "another person" },
    "the room answers": { answerer: "the place" },
    "contradict with the cut": { answerKind: "contradicts", strength: 4 },
    "ironic cut": { answerKind: "mocks", strength: 4 },
    "echo it back": { answerKind: "echoes" },
    "slow back and forth": { tempo: "slow", answerGap: 8 },
  });

  W.say("repetition", {
    "keep coming back": { setting: 5, spacing: 4 },
    "same shot each time": { variation: 0, landing: "same" },
    "change it up each time": { variation: 5, changeWhat: "context" },
    "twist on the last one": { landing: "a twist" },
    "pay it off at the end": { landing: "a payoff" },
    "closer each time": { changeWhat: "size", timingShift: "speeding up" },
    "rule of three": { setting: 3, landing: "a twist" },
    "just once or twice": { setting: 2 },
  });

  W.say("contrastMap", {
    "quiet then loud": { mainPair: "quiet:loud", strength: 4 },
    "stillness against chaos": { mainPair: "still:moving", strength: 5 },
    "light and shadow": { mainPair: "dark:bright" },
    "lonely then crowded": { mainPair: "empty:crowded" },
    "smash the contrasts": { edgeSharp: "smash", strength: 5 },
    "blend them softly": { edgeSharp: "blended", strength: 1 },
    "more contrast": { setting: 4, strength: 4 },
    "keep flipping": { flipsPerHour: 20, change: "snaps" },
  });

  W.say("cutArticulation", {
    "staccato": { setting: 5, style: "jarring", clipEarly: "always", overlap: 0 },
    "legato": { setting: 0, style: "invisible", overlap: 2 },
    "choppy": { setting: 4, clipEarly: "often", clipFrames: 6 },
    "smooth it out": { setting: 1, overlap: 1.5, overlapWay: "both" },
    "cut on the beat": { style: "rhythmic" },
    "let the sound trail out": { overlapWay: "last sound trails out", overlap: 1 },
    "tight cuts": { breathFrames: 0, clipEarly: "often" },
    "give the cuts air": { breathFrames: 12 },
  });

  W.say("motifShape", {
    "bigger each time": { setting: "rises", trait: "size" },
    "it fades away": { setting: "falls", trait: "brightness" },
    "rise then fall": { setting: "arch", peakAt: 50 },
    "creep closer": { setting: "rises", trait: "closeness" },
    "keep it the same": { setting: "flat", size: 0 },
    "peak at the climax": { setting: "arch", peakAt: 80, size: 4 },
    "make it obvious": { noticeable: "showy", size: 5 },
  });

  W.say("sceneLength", {
    "quick scenes": { setting: "short", minutes: 1 },
    "long takes and long scenes": { setting: "long", minutes: 8 },
    "trim the fat": { trim: "tight" },
    "strip it to the bone": { trim: "bare bones", setting: "short" },
    "let it play out": { trim: "roomy", setting: "long" },
    "mix it up": { lengthSpread: "very mixed" },
    "longest scene at the climax": { longestAt: "climax" },
    "every scene the same length": { lengthSpread: "all alike" },
  });

  W.say("timeLens", {
    "slo-mo": { warp: "slow motion", speedPct: 50 },
    "bullet time": { warp: "very slow motion", speedPct: 10, slowOn: "the impact" },
    "freeze it": { warp: "freeze frame", holdLength: 3 },
    "speed it up": { warp: "sped up", speedPct: 200 },
    "timelapse": { warp: "fast forward", speedPct: 1000 },
    "speed ramp": { ramp: "ramp", rampTime: 1 },
    "play it backwards": { direction: "rewinds" },
    "stop-motion look": { drawnOn: "twos" },
    "on a loop": { repeat: "loops" },
    "slow down on the face": { warp: "slow motion", slowOn: "a face" },
    "more dramatic": { warp: "slow motion", slowOn: "the reveal" },
  });

  W.say("reframe", {
    "punch in": { setting: "strong punch-in", zoom: 150, punchOn: "at a feeling" },
    "little punch-in": { setting: "slight punch-in", zoom: 115 },
    "punch in on the joke": { setting: "strong punch-in", punchOn: "at the joke" },
    "ken burns it": { setting: "slow drift", moveTime: 8 },
    "drift to the face": { setting: "slow drift", drift: "the face" },
    "punch on the beat": { punchOn: "on the beat", setting: "slight punch-in" },
    "no zoom": { setting: "full frame", zoom: 100 },
    "keep the face in frame": { keepFace: "always" },
  });

  W.say("cameraEffect", {
    "crash zoom": { setting: "slam zoom", speed: "fast", ease: "sudden" },
    "shake it on the hit": { setting: "subtle shake", timedTo: "a hit", strength: 60 },
    "handheld feel": { setting: "gentle sway", strength: 25 },
    "earthquake": { setting: "subtle shake", strength: 100, speed: "fast" },
    "drunk camera": { setting: "wobble", speed: "slow" },
    "hit the beat": { timedTo: "the music beat", ease: "sudden" },
    "barrel roll": { setting: "camera roll" },
    "zoom blur": { setting: "radial blur" },
    "clean no effect": { setting: "none", strength: 0 },
  });

  W.say("frameMove3D", {
    "spin like a cube": { setting: "cube spin" },
    "smash the glass": { setting: "shatter mirror" },
    "zoom from space": { setting: "earth zoom", speed: "slow" },
    "open a door to the next": { setting: "door opens", revealsNext: "fully" },
    "show it on a phone": { setting: "phone showcase" },
    "photo carousel": { setting: "wheel gallery" },
    "flashy transition": { speed: "fast", depth: 80 },
    "keep it flat": { setting: "none", depth: 0 },
  });

  W.say("multicamSwitch", {
    "cut to whoever's talking": { setting: "switch on the speaker", cutLead: "as they speak" },
    "show the reactions": { setting: "switch on reactions", reactionHold: 2 },
    "cut on the music": { setting: "switch on the beat" },
    "live tv feel": { setting: "switch freely", rate: 12 },
    "podcast style": { setting: "switch on the speaker", angles: 3, soundFrom: "a separate recorder" },
    "stay on the wide": { setting: "one angle", rate: 0 },
    "cut ahead of the line": { cutLead: "before they speak", leadTime: -0.5 },
    "calmer": { rate: 3, shortestHold: 5 },
  });

  W.say("nestedScene", {
    "group these shots": { setting: "a group of shots" },
    "reuse the sequence": { setting: "a whole sequence", reuse: "twice" },
    "a story within a story": { setting: "a scene inside a scene" },
    "make it a motif": { reuse: "as a motif", changeEachTime: "small changes" },
    "re-cut it the second time": { reuse: "twice", changeEachTime: "re-cut" },
    "replay it exactly": { changeEachTime: "identical" },
    "transform it each time": { changeEachTime: "transformed" },
  });

  W.say("editFocus", {
    "rack focus": { setting: "rack back and forth", pullSpeed: "slow" },
    "pull to whoever's talking": { setting: "pull to the speaker", pullTiming: "on the line" },
    "focus on the listener": { setting: "pull to the listener" },
    "snap focus to the clue": { setting: "pull to an object", pullSpeed: "snap", guideEye: "forceful" },
    "blur the background more": { blur: 80 },
    "dreamy shallow focus": { blur: 70, pullSpeed: "slow" },
    "leave focus alone": { setting: "as filmed" },
    "subtle nudge": { guideEye: "a nudge", pullSpeed: "slow" },
  });

  W.say("visualDensity", {
    "busier": { setting: 8, trend: "filling" },
    "clean it up": { setting: 2, emptySpace: 60, focusPoint: "one clear" },
    "minimalist": { setting: 1, focusPoint: "only one", emptySpace: 85 },
    "where's waldo": { setting: 10, focusPoint: "many competing", clutterWhere: "everywhere" },
    "lonely empty frame": { setting: 1, emptySpace: 90 },
    "chaos": { setting: 9, motionLoad: 9 },
    "frame through clutter": { clutterWhere: "foreground" },
    "calmer": { setting: 3, motionLoad: 2 },
  });

  W.say("pedal", {
    "hold one thing steady": { setting: "one thing held" },
    "a drone under everything": { setting: "one thing held", heldWhat: "a sound", pressure: "uneasy" },
    "same camera spot": { heldWhat: "a camera position", setting: "one thing held" },
    "keep the same color": { heldWhat: "a color" },
    "build unbearable pressure": { pressure: "unbearable", breakAt: "at the climax" },
    "break it at the end": { breakAt: "at the end" },
    "let everything change": { setting: "nothing held" },
  });

  W.say("operatorFeel", {
    "documentary feel": { setting: 3, searching: "often", urgency: "present" },
    "found footage": { setting: 5, mistakes: 4, urgency: "frantic", searching: "often" },
    "handheld but calm": { setting: 2, breathing: 3, urgency: "detached" },
    "more human": { setting: 3, cutDrift: 4, breathing: 2 },
    "too perfect": { setting: 3, mistakes: 1 },
    "robotic precision": { setting: 0, mistakes: 0, cutDrift: 0, swayDegrees: 0 },
    "panic in the camera": { urgency: "frantic", breathsPerMin: 28, swayDegrees: 6 },
    "find the subject late": { findLate: 1, searching: "often" },
  });

  W.say("loopEnding", {
    "make it loop": { setting: "seamless loop", match: "everything", seamLength: 0 },
    "perfect loop for socials": { setting: "seamless loop", signal: "hidden", matchClose: 100 },
    "come full circle": { setting: "full circle", meaningShift: "completely" },
    "end where we began": { setting: "full circle", match: "the picture" },
    "bookend it": { setting: "full circle", match: "the line" },
    "loop back softly": { setting: "soft loop", seamLength: 1 },
    "no loop": { setting: "none" },
  });

  W.say("imageTransform", {
    "flip it": { setting: "mirrored" },
    "upside down": { setting: "flipped", angle: 180 },
    "dutch it": { setting: "tilted", angle: 15, unease: "noticeable" },
    "make it unsettling": { setting: "tilted", angle: 25, unease: "disorienting" },
    "turn it sideways": { setting: "rotated", angle: 90 },
    "leave it as shot": { setting: "as shot", angle: 0 },
    "slowly rotate": { turnWhen: "throughout", turnTime: 8 },
    "spin on the hit": { turnWhen: "on a hit", turnTime: 0.3 },
  });

  W.say("stabilization", {
    "steady it": { setting: "smooth", keepShake: 20 },
    "lock it off": { setting: "locked", keepShake: 0 },
    "keep it raw": { setting: "shaky as shot", keepShake: 100 },
    "smooth but keep some life": { setting: "a little steadier", keepShake: 40 },
    "fix the jello": { rollingShutter: "on" },
    "don't crop too much": { edgeCrop: 5 },
    "shakier as it gets tense": { shakeRise: "strongly" },
  });

  W.say("canvasFill", {
    "letterbox it": { setting: "black bars", ratio: "cinema 2.39" },
    "make it vertical": { ratio: "vertical 9:16" },
    "for tiktok": { ratio: "vertical 9:16", setting: "blurred copy" },
    "for instagram": { ratio: "square 1:1" },
    "blur the sides": { setting: "blurred copy", blur: 70 },
    "widescreen": { ratio: "wide 16:9" },
    "cinematic bars": { setting: "black bars", ratio: "cinema 2.39", fillColor: "black" },
    "fill with our brand color": { setting: "a color", fillColor: "brand color" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
