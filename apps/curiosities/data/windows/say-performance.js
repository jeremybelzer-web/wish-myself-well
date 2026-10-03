/* Performance: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("emotion", {
    "make it sadder": { setting: "melancholy", valence: -3, arousal: 1 },
    "make it scarier": { setting: "fearful", valence: -4, arousal: 4, audienceShare: "feels it with them" },
    "happier": { setting: "joyful", valence: 4, arousal: 3 },
    "they're seething": { setting: "angry", masking: "bottled up", arousal: 4 },
    "smiling through the pain": { masking: "covered with the opposite", mixed: "torn between two" },
    "let it land": { shiftSpeed: "slowly dawns", lastsFor: 20 },
    "make the audience cry": { setting: "melancholy", audienceShare: "feels it with them", feltBy: "the audience" },
    "victory moment": { setting: "triumphant", valence: 5, arousal: 5 },
    "keep it bittersweet": { mixed: "torn between two", secondShare: 45, valence: 0 },
    "wear it on their sleeve": { masking: "shown openly", audienceShare: "feels it with them" },
    "it hits them all at once": { shiftSpeed: "snaps", arousal: 5 },
    "more dreamy": { setting: "dreamlike", arousal: 1 },
  });
  W.say("characterPath", {
    "hit the mark": { setting: "approach", purpose: "going somewhere", smoothness: "smooth", pathTiming: "on the line" },
    "stay put": { setting: "still", length: 0, pathMeters: 0 },
    "pace the room": { pathRepeat: "pacing back and forth", purpose: "wandering" },
    "back away from them": { setting: "retreat", endMark: "further away", pathRelative: "the other character" },
    "move in on them": { setting: "approach", endMark: "nearer someone", pathRelative: "the other character" },
    "walk out of frame": { setting: "cross", endMark: "off screen" },
    "circle them like prey": { setting: "circle", purpose: "chasing", pullOfEye: "demands attention" },
    "run for it": { purpose: "fleeing", smoothness: "erratic", pathSeconds: 3 },
    "aimless wandering": { purpose: "wandering", smoothness: "stops and starts" },
    "head for the door": { purpose: "going somewhere", pathRelative: "a door or object", endMark: "off screen" },
  });
  W.say("bodyEnter", {
    "make an entrance": { setting: "enters", reveal: "a big entrance", speed: "walks in" },
    "burst through the door": { setting: "enters", speed: "bursts in", throughWhat: "a door", reveal: "a big entrance" },
    "sneak in": { setting: "enters", speed: "slips in", reveal: "slips by", announce: "no warning" },
    "already there": { setting: "already" },
    "make an exit": { setting: "leaves", speed: "walks in" },
    "storm out": { setting: "leaves", speed: "bursts in", throughWhat: "a door" },
    "hear them before we see them": { setting: "enters", announce: "a voice first", holdBefore: 2 },
    "step out of the shadows": { setting: "enters", throughWhat: "from behind something", speed: "slips in" },
    "walk into the lens": { setting: "enters", side: "toward the lens", entryDistance: 1 },
    "come in on cue": { setting: "enters", entryTiming: "on their own line" },
  });
  W.say("silence", {
    "let it breathe": { setting: "long", seconds: 4, filled: "breath", tension: "comfortable" },
    "awkward pause": { setting: "long", seconds: 5, tension: "awkward", filled: "room sound" },
    "pick up the cues": { setting: "none", seconds: 0 },
    "no dead air": { setting: "none", seconds: 0, silenceShare: 0 },
    "hold the beat": { setting: "short", seconds: 2, placement: "before the answer" },
    "make the silence unbearable": { setting: "long", seconds: 10, tension: "unbearable", filled: "nothing" },
    "let the joke land": { setting: "short", placement: "after the punchline", seconds: 2 },
    "break it with a shout": { breakWith: "a loud burst", breaker: "the speaker" },
    "pregnant pause": { setting: "long", seconds: 6, tension: "awkward", placement: "before the answer" },
  });
  W.say("faceLens", {
    "poker face": { expression: "blank", leak: "never", darts: "still" },
    "play it bigger": { expression: "big", brows: "up", eyes: "wide" },
    "bring it down": { expression: "subtle", brows: "neutral", eyes: "normal" },
    "mugging": { expression: "extreme", eyes: "popping", mouth: "wide open" },
    "look shocked": { expression: "big", brows: "way up", eyes: "wide", mouth: "open", changeSpeed: "snaps" },
    "look furious": { expression: "big", brows: "down hard", eyes: "narrowed", mouth: "pressed tight" },
    "a crack in the mask": { expression: "subtle", leak: "a flicker" },
    "look into the camera": { lookingAt: "the camera", eyelineOff: 0 },
    "smirk": { mouth: "smile", sided: "one-sided", expression: "subtle" },
    "shifty eyes": { darts: "many", eyes: "narrowed" },
    "less is more": { expression: "subtle", darts: "a few", blinks: 1 },
  });
  W.say("characterSpeed", {
    "move with purpose": { setting: 3, feelsLike: "purposeful", easing: "steady" },
    "pick up the pace": { setting: 4, easing: "speeds up" },
    "slow it down": { setting: 2, easing: "slows down" },
    "they're in a hurry": { setting: 4, feelsLike: "urgent", speedMps: 2.5 },
    "running for their life": { setting: 5, feelsLike: "panicked", speedMps: 6 },
    "lazy sunday stroll": { setting: 1, feelsLike: "lazy", speedMps: 0.8 },
    "slower than everyone else": { contrast: "much slower", speedVs: "the crowd" },
    "start and stop": { bursts: "often" },
  });
  W.say("characterToLens", {
    "walk into camera": { setting: "toward", arrival: "filling the lens", endMeters: 0.3 },
    "black out the lens": { setting: "toward", arrival: "filling the lens", endMeters: 0.1 },
    "walk away from us": { setting: "away", arrival: "far off" },
    "break the fourth wall": { eyeLine: "stares into it", eyelineMiss: 0, confront: "confronting" },
    "don't look at the lens": { eyeLine: "never", eyelineMiss: 20 },
    "make it menacing": { setting: "toward", approachSpeed: "creeping", confront: "confronting", eyeLine: "stares into it" },
    "charge the camera": { setting: "toward", approachSpeed: "rushing", moveSeconds: 2 },
    "pass through frame": { setting: "across", confront: "passing by" },
  });
  W.say("whoMoves", {
    "make them take control": { power: "mover takes control", setting: "speaker" },
    "the listener walks away": { setting: "listener", power: "mover is weaker" },
    "nobody moves": { setting: "neither", share: 0 },
    "both on the move": { setting: "both", share: 70, trades: "back and forth" },
    "move on the key word": { moveWhen: "on the key word" },
    "move between the lines": { moveWhen: "between lines" },
    "one still one moving": { stillContrast: "strongly" },
    "circle each other": { setting: "both", circleAround: 180, trades: "back and forth" },
  });
  W.say("volume", {
    "speak up": { setting: 4, loudDb: 75 },
    "bring it down": { setting: 2, loudDb: 50 },
    "build to a shout": { trend: "building", setting: 5, peakWord: "the last word" },
    "keep it intimate": { distanceFeel: "intimate", setting: 1, loudDb: 40 },
    "yell across the room": { distanceFeel: "shouting distance", setting: 5, loudDb: 95 },
    "punch the key word": { peakWord: "the key word", spread: 3 },
    "trail off": { trend: "falling" },
    "out of nowhere loud": { sudden: "often", spread: 5 },
    "talk over the noise": { overRoom: 15, setting: 4 },
  });
  W.say("pace", {
    "pick up the pace": { setting: "fast", wpm: 180, pauseBetween: 0.3 },
    "tighten it up": { setting: "fast", pauseBetween: 0.2, pickup: "on time" },
    "take your time": { setting: "slow", wpm: 110, pauseBetween: 1.5 },
    "screwball rapid fire": { setting: "fast", wpm: 210, overlap: "talking over each other", pickup: "jumping in early" },
    "step on each other's lines": { overlap: "talking over each other", overlapSecs: 1 },
    "pick up your cues": { pickup: "on time", pauseBetween: 0.2 },
    "let it drag": { setting: "slow", pickup: "lazy", pauseBetween: 2.5 },
    "speeding up toward the end": { rush: "speeds up", endChange: 30 },
    "more natural rhythm": { variation: "some changes", overlap: "some overlap" },
  });
  W.say("faceIntensity", {
    "dial it back": { setting: 1 },
    "give me more": { setting: 4 },
    "really feel it": { setting: 5, region: "whole face", hold: 3 },
    "all in the eyes": { region: "eyes", setting: 2 },
    "hold that look": { hold: 4, release: "lingers" },
    "hide it from them": { hidden: "hard", showsTo: "the camera" },
    "peak on the key word": { peakAt: "the key word" },
    "let it fade": { release: "fades", fadeSeconds: 3 },
    "when nobody's watching": { showsTo: "nobody, alone", setting: 4 },
  });
  W.say("touch", {
    "hold their hand": { setting: "held", where: "hand", welcome: "returned" },
    "a hand on the shoulder": { setting: "brief", where: "shoulder", pressure: 2 },
    "hug it out": { setting: "held", where: "embrace", welcome: "returned", touchSeconds: 5 },
    "they flinch away": { setting: "brief", welcome: "pulled away from" },
    "no touching": { setting: "none", touchesPerMin: 0 },
    "can't keep their hands off": { setting: "constant", touchesPerMin: 10, welcome: "welcomed" },
    "grab their arm": { setting: "brief", where: "arm", pressure: 5 },
    "a tender touch": { where: "face", pressure: 1, welcome: "welcomed" },
  });
  W.say("vocalTone", {
    "say it softer": { setting: "whispered", strength: 1, warmth: "warm" },
    "shout it": { setting: "shouted", strength: 5 },
    "deadpan": { setting: "flat", warmth: "neutral", subtext: "means it", strength: 1 },
    "sarcastic": { subtext: "the opposite", setting: "flat" },
    "voice cracks": { setting: "breaking", crack: "once" },
    "on the verge of tears": { setting: "breaking", crack: "keeps cracking", breathiness: 50 },
    "cold as ice": { warmth: "icy", setting: "flat" },
    "make it a question": { setting: "rising" },
    "lower your voice": { pitch: "low", pitchShift: -4 },
    "talking to themselves": { aimedAt: "themself", setting: "whispered" },
    "breathy and sexy": { breathiness: 80, warmth: "tender", pitch: "low" },
  });
  W.say("toneArc", {
    "the big finish": { setting: "climax", position: 90 },
    "set the tone early": { setting: "opening", position: 5 },
    "turn it dark": { toneColor: "grim", contrastPrev: "a sharp turn" },
    "lighter moment": { toneColor: "playful" },
    "hopeful ending": { setting: "ending", toneColor: "hopeful", position: 98 },
    "callback at the end": { returnLater: "returns at the end" },
    "rising tension": { setting: "rising", toneColor: "tense" },
    "bittersweet ending": { setting: "ending", toneColor: "bittersweet" },
  });
  W.say("timePerCharacter", {
    "it's their scene": { setting: "one person dominates", lead: 80 },
    "share the screen time": { setting: "even", lead: 50, secondShare: 50 },
    "stay on the listener": { listenerTime: 70 },
    "two-hander": { setting: "even", lead: 50, secondShare: 50 },
    "keep them a mystery": { withholds: "mostly hidden" },
    "shift the focus halfway": { shiftAt: "once" },
    "ensemble": { setting: "even", lead: 30, shiftAt: "several times" },
  });
  W.say("actionCutRate", {
    "shaky cam chaos": { setting: 8, clarity: "chaotic", shortestShot: 4 },
    "let the fight play": { setting: 2, clarity: "crystal clear", breather: "often" },
    "faster cutting": { setting: 6 },
    "slower cutting": { setting: 2 },
    "build to a frenzy": { buildUp: "explodes at the end" },
    "jackie chan style": { setting: 3, clarity: "crystal clear", angleJump: 30 },
    "give us a breather": { breather: "now and then", breatherLength: 3 },
    "more intense": { setting: 7, buildUp: "builds" },
  });
  W.say("walkAndTalk", {
    "sorkin walk and talk": { setting: 90, pace: "hurrying", camera: "ahead of them", routeLength: "a whole building" },
    "lead them down the hall": { camera: "ahead of them", routeLength: "a hallway" },
    "follow them": { camera: "behind them" },
    "leisurely stroll": { pace: "strolling", walkSpeed: 0.8 },
    "busy street": { passersby: "busy", obstacles: 3 },
    "stop for the big line": { stopForLine: "every key line" },
    "talk on the run": { pace: "running", walkSpeed: 4 },
    "mostly standing still": { setting: 10 },
  });
  W.say("listenerBody", {
    "react to that": { reaction: "small shifts", reactTiming: "on the key word" },
    "don't react": { reaction: "frozen", hands: "still" },
    "they're not buying it": { hands: "cross arms", agrees: "pulls away" },
    "lean in": { agrees: "leans in", listenLean: 15 },
    "nervous listener": { reaction: "fidgeting", hands: "fidget" },
    "stealing the scene": { stealsFocus: "steals it", reaction: "big reaction" },
    "the listener sells it": { reaction: "big reaction", seen: "in their own shot" },
    "give a beat before reacting": { reactTiming: "after a beat" },
    "keep them out of shot": { seen: "off screen" },
  });
  W.say("animFeelLens", {
    "pixar feel": { style: "lively", spacing: "ease both", anticipation: "small", overshoot: "settle" },
    "old cartoon": { style: "rubber-hose wild", squash: 5, exaggeration: "huge" },
    "looney tunes": { style: "cartoony", exaggeration: "huge", anticipation: "big", overshoot: "bounce" },
    "more realistic": { style: "realistic", exaggeration: "true to life", squash: 0 },
    "too stiff": { style: "lively", overlap: "all", arcs: "arc" },
    "snappier": { spacing: "snap", holds: "clear holds" },
    "push it": { exaggeration: "clearly pushed", pushPct: 180 },
    "anime feel": { holds: "long freezes", spacing: "snap", poseRate: 2 },
    "more bounce": { overshoot: "bounce", squash: 3 },
  });
  W.say("poseRigLens", {
    "stronger line of action": { lineOfAction: "strong curve" },
    "read it in silhouette": { silhouette: "crystal clear" },
    "plant your feet": { feet: "planted", balance: "planted" },
    "about to tip over": { balance: "off balance", frontWeight: 80 },
    "less twinning": { symmetry: "clearly uneven" },
    "cheat to camera": { twist: "slight twist", bodyTurn: 20 },
    "heroic pose": { lineOfAction: "S curve", balance: "planted", stanceWidth: 0.8, silhouette: "crystal clear" },
    "slumped and defeated": { lineOfAction: "slight curve", bodyBend: 40, frontWeight: 70 },
    "feet sliding": { feet: "sliding" },
  });
  W.say("dynamicRange", {
    "whisper to scream": { setting: "wide", quietest: "whisper", loudest: "scream", db: 30 },
    "keep it even": { setting: "narrow", db: 4 },
    "more dynamic": { setting: "wide", db: 20 },
    "all at one level": { setting: "narrow", db: 0, surprise: "never" },
    "explode out of nowhere": { jumpSpeed: "explodes", surprise: "once" },
    "jump scares": { surprise: "again and again", jumpSpeed: "explodes" },
    "swell slowly": { jumpSpeed: "slowly swells" },
  });
  W.say("rangeChanges", {
    "keep them guessing": { pattern: "unpredictable", setting: "every line" },
    "rarely raise the voice": { setting: "rare", size: 1 },
    "big swings": { size: 5, jumpDb: 30 },
    "build up then blow up": { direction: "quiet to loud" },
    "blow up then simmer": { direction: "loud to quiet", settle: 4 },
    "hit the punchline loud": { cueWord: "the punchline" },
    "steady rhythm": { pattern: "regular" },
  });
  W.say("breath", {
    "out of breath": { breathFeel: "gasp", audible: 5, breathRate: 35 },
    "take a breath first": { setting: "breath then speak", breathBefore: "on key lines" },
    "big sigh": { breathFeel: "sigh", audible: 4, length: 2 },
    "nervous breathing": { breathFeel: "shaky", audible: 3, breathRate: 25 },
    "calm and steady": { breathFeel: "calm", breathRate: 10 },
    "hold your breath": { held: "long held", heldSeconds: 15 },
    "no audible breaths": { audible: 0, setting: "ignore breath" },
    "say it all in one breath": { setting: "speak on the breath", breathGap: 0 },
  });
  W.say("eating", {
    "talk with your mouth full": { setting: "speak while eating", mouthFull: 80 },
    "messy eater": { messiness: 5, appetite: "wolfing it down", chewing: "loud" },
    "picking at their food": { appetite: "picking at it", messiness: 0, bitesPerMin: 2 },
    "dinner scene": { food: "a meal", setting: "eat then speak" },
    "bite before the punchline": { biteTiming: "before the punchline" },
    "sipping a drink": { food: "a drink", chewing: "silent" },
    "no eating": { setting: "none", share: 0 },
    "crunchy and loud": { food: "something crunchy", chewing: "loud" },
  });
  W.say("gesture", {
    "talk with your hands": { setting: 4, type: "illustrating", gesturesPerMin: 30 },
    "hands down": { setting: 0, gesturesPerMin: 0 },
    "bigger gestures": { setting: 4, height: "face", reach: 0.7 },
    "point at them": { type: "pointing", pointsEye: "at the speaker" },
    "italian hands": { setting: 5, type: "beat on the words", gesturesPerMin: 45 },
    "give them a signature move": { habit: "a signature move" },
    "throw your arms up": { type: "big sweep", height: "above the head", gestureSpeed: "sharp" },
    "nervous touching": { type: "self-touch", habit: "a habit" },
  });
  W.say("stillness", {
    "don't move a muscle": { setting: 5, whatMoves: "nothing", movePct: 0 },
    "less fidgeting": { setting: 4, movePct: 15 },
    "ready to pounce": { stillFeel: "coiled to strike", setting: 4 },
    "zen calm": { stillFeel: "calm", setting: 5, sway: 0 },
    "just the eyes": { whatMoves: "the eyes" },
    "break it suddenly": { breakWith: "a sudden move" },
    "more alive": { setting: 1, movePct: 60 },
  });
  W.say("blink", {
    "stare without blinking": { setting: "no", rate: 0, holdOff: 30 },
    "creepy stare": { setting: "no", rate: 0 },
    "blink on the thought": { meaning: "on every thought" },
    "batting the eyelashes": { blinkSpeed: "quick flutter", rate: 30 },
    "nervous blinking": { rate: 35, blinkSpeed: "quick flutter" },
    "natural blinking": { setting: "yes", rate: 15, blinkSpeed: "normal" },
    "blink on the cut": { onCut: "always" },
  });
  W.say("moveTemper", {
    "jumpy": { setting: 5, reactsTo: "every move", shake: 3 },
    "cool and collected": { setting: 1, reactsTo: "nothing", shake: 0 },
    "one step ahead": { leads: "anticipates", lag: 0 },
    "a beat behind": { leads: "follows", lag: 12 },
    "trembling": { shake: 4, shakeSize: 2 },
    "hot-headed": { setting: 5, overshootPct: 20 },
  });
  W.say("spacing", {
    "snappier": { setting: "snap", strength: 4 },
    "too floaty": { setting: "snap", weight: "heavy" },
    "give it weight": { weight: "heavy", setting: "ease in" },
    "light as a feather": { weight: "feather light", setting: "ease both" },
    "too robotic": { setting: "ease both", varies: "some variety" },
    "slow in slow out": { setting: "ease both", easePct: 70 },
    "mix it up": { varies: "each one different" },
  });
  W.say("stepping", {
    "smoother animation": { setting: "ones", actionRate: "ones" },
    "anime look": { setting: "threes", mix: "mixed freely", holdRate: "fours" },
    "classic hand-drawn": { setting: "twos", boil: "a little" },
    "spider-verse look": { setting: "twos", mix: "mixed freely" },
    "make the lines wiggle": { boil: "lively", boilPx: 3 },
    "ones for the fast stuff": { actionRate: "ones", switchFor: "always" },
  });
  W.say("anticipation", {
    "wind it up": { setting: "big", windupWay: "the opposite way", frames: 8 },
    "telegraph it": { setting: "big", warns: "clear warning" },
    "catch them off guard": { setting: "none", warns: "surprise" },
    "a tiny wind-up": { setting: "small", frames: 3 },
    "fake them out": { fakeOut: "once" },
    "cartoon wind-up": { setting: "big", windupWay: "a big loop", size: 5 },
    "running fake-out gag": { fakeOut: "a running gag" },
  });
  W.say("overshoot", {
    "springy stops": { setting: "bounce", wobbles: 3 },
    "dead stop": { setting: "none", pastPct: 0 },
    "settle into it": { setting: "settle", settleFrames: 8 },
    "jelly wobble": { setting: "bounce", wobbles: 5, pastPct: 30 },
    "only on the big hit": { emphasis: "only the big stop" },
    "the head bobbles": { whatOvershoots: "the head", setting: "bounce" },
  });
  W.say("overlap", {
    "hair keeps moving": { setting: "hair", followThrough: 12 },
    "flowing cape": { setting: "cloth", floppiness: "floppy", wind: "breeze" },
    "too stiff": { setting: "all", howMuch: 3 },
    "windy day": { wind: "strong wind", trailAngle: 45 },
    "drag behind more": { lag: 6, howMuch: 4 },
    "nothing follows through": { setting: "none", followThrough: 0 },
  });
  W.say("arcs", {
    "more organic": { setting: "arc", roundness: 4 },
    "robot moves": { setting: "straight", straightFor: "machines", roundness: 0 },
    "swoopy": { setting: "arc", arcSize: 5, roundness: 5 },
    "show the motion trail": { trail: "bold", trailFrames: 12 },
    "loop-de-loop": { setting: "figure eight" },
    "hands move in arcs": { whichPart: "the hands", setting: "arc" },
  });
  W.say("leadPart", {
    "lead with the eyes": { setting: "eyes", nextPart: "head" },
    "lead with the hips": { setting: "hips", nextPart: "hands" },
    "the look before the turn": { setting: "eyes", lead: 4 },
    "whip around": { chainSpeed: "whip", leadTurn: 180 },
    "slow wave through the body": { chainSpeed: "slow wave" },
    "reach for it": { setting: "hands" },
  });
  W.say("squash", {
    "more rubbery": { setting: 4, squashFeel: "rubbery" },
    "keep it real": { setting: 1, squashFeel: "subtle and real", squashPct: 5 },
    "bouncy ball": { setting: 4, squashFeel: "bouncy", onImpact: "on big moves" },
    "keep the volume": { volume: 5 },
    "squash on the landing": { onImpact: "only on impacts", squashPct: 30 },
    "stretchy face": { parts: "the face", stretchPct: 50 },
  });
  W.say("poseRate", {
    "more poses": { setting: 6, variety: "all different" },
    "fewer poses": { setting: 2, holdFrames: 12 },
    "pose to pose": { between: "snaps", holdFrames: 8 },
    "hit the key word": { strongOn: "the key word" },
    "smooth it out": { between: "smooth glide" },
    "build to the big pose": { buildUp: "builds up" },
    "stop repeating poses": { variety: "all different" },
  });
  W.say("lipSync", {
    "sloppy lip sync": { accuracy: 1 },
    "dead-on lip sync": { accuracy: 5, lead: 0 },
    "mouth leads the sound": { lead: -2 },
    "over-enunciate": { openness: "wide", setting: 10 },
    "mumble": { openness: "barely", setting: 3 },
    "cartoon mouth": { openness: "cartoon wide", teeth: "detailed" },
    "ventriloquist": { openness: "barely", setting: 1, teeth: "never" },
  });
  W.say("gazeShift", {
    "shifty eyes": { setting: 7, size: 3, givesAway: "nerves" },
    "lying eyes": { givesAway: "a lie", target: "away" },
    "can't look at them": { target: "down", holdLook: 3, lookUpDown: -30 },
    "steady gaze": { setting: 0, returnTo: "the other person" },
    "they're hiding something": { givesAway: "a secret", setting: 4 },
    "look at the thing": { target: "to an object", leadsUs: "always" },
    "glance at the camera": { returnTo: "the camera", setting: 1 },
  });
  W.say("posture", {
    "stand up straight": { stature: "upright", lean: 0, chin: 5 },
    "make them look powerful": { setting: "open", stature: "towering", chin: 15, facing: "square on" },
    "make them look small": { setting: "closed", stature: "shrunk", chin: -20 },
    "defeated slouch": { stature: "slumped", lean: -2, tension: 1 },
    "lean in": { lean: 3, leanDegrees: 15 },
    "turn away from them": { facing: "turned away", turnedDeg: 140 },
    "tense shoulders": { tension: 5 },
    "loosen up": { tension: 1, setting: "open" },
  });
  W.say("sceneShapes", {
    "simplify the frame": { setting: "one big shape", crowding: "lots of air" },
    "make it feel cramped": { crowding: "boxed in", setting: "busy" },
    "more threatening": { shapeKind: "sharp triangles" },
    "make it feel safe": { shapeKind: "round", arrangement: "balanced" },
    "cluttered": { setting: "busy", shapeCount: 15, arrangement: "scattered" },
    "lead the eye to them": { leadEye: "the speaker" },
    "rigid and orderly": { shapeKind: "square", arrangement: "stacked" },
  });
  W.say("propBusiness", {
    "give them something to do": { busyShare: 50, prop: "fiddling" },
    "cook while talking": { prop: "cooking", handPace: "steadily" },
    "stop to deliver the line": { stopsFor: "every key line" },
    "nervous fiddling": { prop: "fiddling", handPace: "frantically" },
    "it all goes wrong": { goesWrong: "a disaster" },
    "keep the focus on the face": { eyeOn: "on the face" },
    "busy hands angry heart": { fits: "fights it", handPace: "frantically" },
  });
  W.say("moveOnLine", {
    "button the scene": { timing: "after the line", freeze: "a long hold", size: 2 },
    "move on the key word": { timing: "on the key word", sharpness: "sharp" },
    "turn away on the line": { kind: "a turn", moveDir: "away", turnDegrees: 120 },
    "step toward them": { kind: "a step", moveDir: "toward them", moveMeters: 0.5 },
    "sit down on it": { kind: "sitting or standing" },
    "freeze": { freeze: "a beat", size: 0 },
    "move then speak": { timing: "before the line", moveOffset: -1 },
    "lean in on the line": { kind: "a lean", moveDir: "toward them", timing: "on the key word" },
  });

  W.say("rigRulesLens", {
    "drag their feet": { setting: "walking", pace: "dragging", slump: "slumped" },
    "make them hurry": { setting: "running", pace: "brisk" },
    "out of breath": { breath: "heaving", breathRate: 45 },
    "stand tall": { slump: "proud and upright" },
    "eyes down": { lookAt: "at the ground" },
    "looking over their shoulder": { setting: "looking around", lookAt: "all around", headTurn: 85 },
    "loosen up": { floppy: "loose", limits: "natural" },
    "make it cartoony": { limits: "like rubber", floppy: "floppy" },
    "stiff as a board": { floppy: "stiff", limits: "stiff" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
