/* data/db-ties.js: every curiosity tied into the four levels. Before this file, 212 curiosities were the cause or
   effect of no proximity and 99 belonged to no suite, so they could be automated alone but never set anything else
   off and never came as part of a look. Here every one of them gets at least one proximity ("When ..., ...") and
   at least one suite, plus proximity suites for the chains those proximities make. Loaded last (after db-maya.js),
   since it links curiosities from every other file. Written 2026-10-03 by the database thread. */
(function (DB) {
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));

  // ---------- Proximities: whose eyes are these ----------
  P("player-takes-camera-view", "When the player takes the camera, the view becomes theirs", "camera-motion", "Hand the camera to the player and within a beat the shot stops being the director's view and becomes the player's own eyes.", { curiosity: "cameraOwner", is: "player" }, { curiosity: "pov", is: "a person" }, 1, { also: ["camera-angle"] });
  P("seen-through-eyes-shake", "When we see through someone's eyes, the picture starts to shake", "camera-angle", "Once the camera is a person's eyes, it picks up their breathing and footsteps, so the frame wobbles like a held camera.", { curiosity: "pov", is: "a person" }, { curiosity: "cameraShake", change: "rises" }, 1, { also: ["camera-motion"] });
  P("lying-eyes-lying-voice", "When the point of view is lying, the voice-over and the picture disagree", "camera-angle", "A narrator who bends the truth shows up as a gap: the voice says one thing while the picture quietly shows another.", { curiosity: "pov", slider: "honesty", is: "lying" }, { curiosity: "voiceover", slider: "truth", is: "the picture says otherwise" }, 3, { also: ["audio-mix"] });
  P("voiceover-caught-laugh", "When the voice-over is caught out by the picture, the scene turns funny", "audio-mix", "\"I stayed calm,\" says the voice, over a shot of them screaming. The clash between words and picture is a classic laugh.", { curiosity: "voiceover", slider: "truth", is: "the picture says otherwise" }, { curiosity: "emotion", is: "absurd" }, 1, { also: ["lines"] });

  // ---------- Choosing the angle ----------
  P("more-angles-faster-cuts", "When a scene has more angles, the cutting speeds up", "camera-angle", "Every extra angle is another place the editor can jump to, so scenes shot from many sides tend to cut more often.", { curiosity: "angleCount", change: "rises" }, { curiosity: "cutRate", change: "rises" }, 2, { also: ["camera-motion"] });
  P("angle-for-line-cuts-on-line", "When each angle is picked for a line, the cuts land on the lines", "camera-angle", "If every shot was chosen to show a certain line, the edit switches shots as each new line starts.", { curiosity: "angleToLine", is: "matches the line" }, { curiosity: "angleChange", is: "on the line" }, 1);
  P("angle-against-line-laugh", "When the angle plays against the line, the joke lands", "camera-angle", "A huge declaration shown in a tiny far-away shot, or a whisper in an extreme close-up: the mismatch makes the audience laugh.", { curiosity: "angleToLine", is: "plays against the line" }, { curiosity: "emotion", is: "absurd" }, 1, { also: ["lines"] });
  P("angle-for-action-cuts-on-action", "When each angle is picked for the action, the cuts land on the moves", "camera-angle", "Shots chosen to show a movement get cut in the middle of that movement, so the action seems to flow from one shot to the next.", { curiosity: "angleToAction", is: "matches the action" }, { curiosity: "angleChange", is: "on the action" }, 1);
  P("angle-against-action-unease", "When the angle fights the action, the audience feels uneasy", "camera-angle", "Hide the punch behind a doorframe or film a chase from a still, far-off spot and viewers strain to see, which makes them tense.", { curiosity: "angleToAction", is: "plays against the action" }, { curiosity: "emotion", is: "anxious" }, 2, { also: ["lines"] });

  // ---------- Camera moves with a reason ----------
  P("cross-starts-the-move", "When a character crosses the room, the camera move starts with them", "camera-motion", "A walk across the room gives the camera a reason to move, so the move begins on the first step and feels invisible.", { curiosity: "characterPath", is: "cross" }, { curiosity: "moveOn", is: "action" }, 1, { also: ["character-motion"] });
  P("follow-character-track", "When the camera follows a character, it tracks alongside them", "camera-motion", "Following a person means keeping pace with them, so the camera slides along beside or behind them.", { curiosity: "moveFollows", is: "character" }, { curiosity: "cameraMove", is: "track" }, 1);
  P("move-on-breath-pause", "When the camera moves on a breath, a small pause opens up", "camera-motion", "Starting a slow move on an in-breath stretches that moment, so a short silence settles in before the next line.", { curiosity: "moveOn", is: "breath" }, { curiosity: "silence", is: "short" }, 1, { also: ["lines"] });
  P("loud-jolts-camera", "When the camera jumps on loud moments, the shot gets shakier", "camera-motion", "A camera that reacts to bangs and shouts jolts each time, so the frame shakes more as the scene gets louder.", { curiosity: "moveToVolume", is: "moves on loud" }, { curiosity: "cameraShake", change: "rises" }, 1);

  // ---------- Coming at the lens ----------
  P("toward-lens-close-up", "When a character walks toward the lens, the shot becomes a close-up", "character-motion", "Walking up to the camera turns a wide shot into a close-up without a cut, so the audience feels the person arrive.", { curiosity: "characterToLens", is: "toward" }, { curiosity: "shotSize", is: "close" }, 1, { also: ["camera-angle"] });
  P("toward-lens-looms", "When a hand reaches toward the lens, it looms huge", "character-motion", "Anything pushed at the camera grows much bigger than the body behind it, like a fist or a pointing finger filling the frame.", { curiosity: "characterToLens", is: "toward" }, { curiosity: "foreshortening", is: "strong" }, 1, { also: ["placement"] });
  P("looming-makes-flinch", "When something looms at the lens, the audience flinches", "placement", "A blade, fist or claw stretched huge toward us feels like it is coming out of the screen, which scares the viewer.", { curiosity: "foreshortening", is: "strong" }, { curiosity: "emotion", is: "fearful" }, 1, { also: ["lines"] });
  P("listener-moves-gets-screen-time", "When the listener moves and the speaker stays still, the edit turns to the listener", "character-motion", "Movement pulls the eye, so if only the listener moves, the editor starts giving them more time on screen than the person talking.", { curiosity: "whoMoves", is: "listener" }, { curiosity: "timePerCharacter", is: "uneven" }, 2, { also: ["lines"] });

  // ---------- Cartoon physics ----------
  P("big-windup-big-stretch", "When the wind-up is big, the body stretches far on the release", "movement-lines", "A deep crouch before a jump stores up energy, so the body stretches out long when it lets go.", { curiosity: "anticipation", is: "big" }, { curiosity: "squash", change: "rises" }, 1, { also: ["character-motion"] });
  P("snap-move-bounces", "When a move snaps into place, it bounces past its mark", "character-motion", "A move with no slowing down at the end has nothing to stop it cleanly, so it overshoots and bounces back.", { curiosity: "spacing", is: "snap" }, { curiosity: "overshoot", is: "bounce" }, 1);
  P("bounce-feels-playful", "When moves bounce past their mark, the scene feels playful", "character-motion", "Springy little bounces at the end of every move give the whole scene a light, happy rhythm.", { curiosity: "overshoot", is: "bounce" }, { curiosity: "emotion", is: "joyful" }, 2, { also: ["lines"] });
  P("sudden-stop-hair-keeps-going", "When a character stops suddenly, the hair and clothes keep going", "character-motion", "The body stops but the loose parts do not, so hair, coat and hands swing on for a moment and then settle.", { curiosity: "characterSpeed", change: "drops" }, { curiosity: "overlap", is: "all" }, 1);

  // ---------- Smooth or stiff ----------
  P("fast-move-every-frame", "When a character moves fast, every frame gets its own drawing", "character-motion", "Quick moves look choppy when a drawing is held for two frames, so animators draw fast action fresh on every frame.", { curiosity: "characterSpeed", change: "rises" }, { curiosity: "stepping", is: "ones" }, 1);
  P("straight-paths-robotic", "When moves travel in straight lines, the character looks robotic", "character-motion", "Living things move in curves. Straight paths from pose to pose make a character feel stiff, like a machine.", { curiosity: "arcs", is: "straight" }, { curiosity: "animFeelLens", is: "stiff and robotic" }, 1);
  P("fast-talk-fewer-poses", "When the talk gets fast, each line gets fewer big poses", "lines", "Hitting a new pose on every word of a fast line looks twitchy, so quick dialogue gets fewer, simpler poses.", { curiosity: "pace", is: "fast" }, { curiosity: "poseRate", change: "drops" }, 1, { also: ["character-motion"] });

  // ---------- The eyes give it away ----------
  P("darting-eyes-nervous", "When the eyes keep darting, the character reads as nervous", "movement-lines", "Quick looks away and back tell the audience someone is uneasy or hiding something, even when their words sound calm.", { curiosity: "gazeShift", change: "rises" }, { curiosity: "emotion", is: "anxious" }, 1, { also: ["lines"] });
  P("nervous-blinks-more", "When a character gets nervous, they blink more", "lines", "Worry speeds up blinking, so an anxious beat shows up as a flutter of the eyelids.", { curiosity: "emotion", is: "anxious" }, { curiosity: "blink", slider: "rate", change: "rises" }, 1, { also: ["movement-lines"] });
  P("eyes-find-object-lead-turn", "When the eyes snap to something, the eyes lead the turn", "movement-lines", "Spotting something makes the eyes move first, then the head, then the body follows them round.", { curiosity: "gazeShift", slider: "target", is: "to an object" }, { curiosity: "leadPart", is: "eyes" }, 1);
  P("no-blink-unsettling", "When a character stops blinking, they become unsettling", "movement-lines", "A stare that never blinks feels cold or dangerous, and the audience starts to fear what this person will do.", { curiosity: "blink", is: "no" }, { curiosity: "emotion", is: "fearful" }, 2, { also: ["lines"] });
  P("held-touch-tender", "When a touch is held, the beat turns tender", "movement-lines", "A hand that stays on a shoulder instead of letting go says what the words cannot: this person cares.", { curiosity: "touch", is: "held" }, { curiosity: "emotion", is: "loving" }, 2, { also: ["lines"] });

  // ---------- Objects and doors ----------
  P("door-in-shot-someone-enters", "When a door is in the shot, someone comes through it", "placement", "An audience that can see a door starts waiting for it to open, and the scene usually pays that off with an entrance.", { curiosity: "objectKind", is: "door" }, { curiosity: "bodyEnter", is: "enters" }, 2, { also: ["character-motion"] });
  P("focus-on-door-entrance", "When the focus moves to a door, someone is about to come in", "placement", "Making the door the sharp thing in frame is a promise to the audience that it matters, and an entrance soon follows.", { curiosity: "focus", is: "door" }, { curiosity: "bodyEnter", is: "enters" }, 2, { also: ["character-motion"] });
  P("food-means-talking-while-eating", "When food is on the table, people talk with their mouths full", "placement", "Put a meal in the scene and the actors start speaking between and during bites, which makes the scene feel lived-in.", { curiosity: "objectKind", is: "food" }, { curiosity: "eating", is: "speak while eating" }, 2, { also: ["lines"] });
  P("mouth-full-needs-cleanup", "When someone talks with their mouth full, the voice needs cleaning up", "lines", "Chewing muddies the words, so the sound team has to lift the voice to keep the line clear.", { curiosity: "eating", is: "speak while eating" }, { curiosity: "voiceCleanup", is: "voice enhanced" }, 1, { also: ["audio-mix"] });
  P("chew-before-reply", "When a character eats before answering, the chew becomes a pause", "lines", "Finishing a bite before replying makes the other person wait, and that small silence is great for comic timing.", { curiosity: "eating", is: "eat then speak" }, { curiosity: "silence", is: "short" }, 1);

  // ---------- Speed and impact ----------
  P("fast-object-blurs", "When an object moves fast, it smears into a blur", "placement", "Something flying across the frame moves too far in each frame to stay sharp, so it streaks.", { curiosity: "objectSpeed", change: "rises" }, { curiosity: "motionBlur", is: "heavy" }, 1, { also: ["camera-angle"] });
  P("no-blur-jittery-fear", "When motion blur is taken away, action feels jittery and frightening", "camera-angle", "Without blur every frame is crisp, so movement looks choppy and harsh. War films use this to make battle feel raw.", { curiosity: "motionBlur", is: "none" }, { curiosity: "emotion", is: "anxious" }, 2, { also: ["lines"] });
  P("drop-gets-sound-hit", "When an object drops, a sound hit lands with it", "placement", "A thing hitting the floor gets an added thud or clang, which sells the weight and often gets the laugh.", { curiosity: "objectPath", is: "drop" }, { curiosity: "sfxHits", change: "rises" }, 1, { also: ["audio-mix"] });
  P("fast-action-cuts-more-hits", "When action cuts come faster, more sound hits glue them together", "lines", "Quick cuts in a fight or chase each get a whoosh or bang, so the sound stays as busy as the picture.", { curiosity: "actionCutRate", change: "rises" }, { curiosity: "sfxHits", change: "rises" }, 1, { also: ["audio-mix"] });

  // ---------- Where the eye goes ----------
  P("shallow-focus-on-face", "When the background goes soft, all eyes go to the face", "camera-angle", "With only a thin slice in focus, everything else melts into blur and the audience has nowhere to look but the face.", { curiosity: "depthOfField", is: "shallow" }, { curiosity: "focus", is: "face" }, 1, { also: ["placement"] });
  P("focus-pull-on-line", "When the focus shifts on a line, the speaker's face goes sharp", "camera-angle", "Moving the focus from one person to another as they start to talk tells the audience who to watch, without a cut.", { curiosity: "rackFocus", is: "on the line" }, { curiosity: "focus", is: "face" }, 1, { also: ["placement"] });
  P("striking-look-long-hold", "When an actor's look is striking, the camera holds on them longer", "placement", "A face, costume or hairstyle built to stop people gets time on screen so the audience can take it in.", { curiosity: "look", is: "striking" }, { curiosity: "shotDuration", is: "long" }, 1, { also: ["camera-motion"] });

  // ---------- Sound of the place ----------
  P("new-place-sound-first", "When the scene jumps to a new place, its sound arrives first", "background", "Hearing the next location a moment before you see it, like traffic before the street, carries the audience smoothly into the new scene.", { curiosity: "setting", slider: "change", is: "snaps" }, { curiosity: "soundToCut", is: "J-cut" }, 1, { also: ["music"] });
  P("outside-hear-the-world", "When the scene moves outside, we hear more of the world off screen", "background", "Outdoors there are dogs, cars and voices we cannot see, so more sound comes from beyond the edges of the frame.", { curiosity: "intExt", is: "exterior" }, { curiosity: "soundDesign", slider: "offscreen", change: "rises" }, 1, { also: ["music"] });
  P("more-people-busier-sound", "When more people fill the scene, the sound gets busy", "placement", "Every extra person adds footsteps, chatter and rustle, so a crowded room sounds busy even before anyone speaks.", { curiosity: "peopleCount", change: "rises" }, { curiosity: "soundDesign", is: "busy" }, 1, { also: ["music"] });
  P("more-people-more-angles", "When more people are in the scene, it needs more angles", "placement", "Each person who talks or reacts needs a shot of their own, so a big group gets covered from more places.", { curiosity: "peopleCount", change: "rises" }, { curiosity: "angleCount", change: "rises" }, 1, { also: ["camera-angle"] });
  P("heat-slows-talk", "When it is hot, people talk slower", "background", "Heat makes bodies heavy and lazy, so lines drift out slowly with long gaps, like a summer afternoon.", { curiosity: "temperature", is: "hot" }, { curiosity: "pace", is: "slow" }, 2, { also: ["lines"] });

  // ---------- Deadpan storybook ----------
  P("pattern-centers-subject", "When a pattern fills the frame, the subject goes dead center", "background", "Rows of matching things look best balanced, so the person gets placed right in the middle like a picture in a frame.", { curiosity: "repeatInFrame", change: "rises" }, { curiosity: "composition", is: "center" }, 1, { also: ["camera-angle"] });
  P("dead-center-deadpan", "When a character sits dead center, the scene plays as deadpan comedy", "camera-angle", "A perfectly centered, straight-on frame feels formal and stiff, so anything odd that happens inside it becomes funny.", { curiosity: "composition", is: "center" }, { curiosity: "emotion", is: "absurd" }, 2, { also: ["lines"] });
  P("busy-shapes-restless", "When the frame is crowded with shapes, the audience feels restless", "lines", "With lots of shapes fighting for attention the eye cannot rest, which makes a scene feel tense and cluttered.", { curiosity: "sceneShapes", is: "busy" }, { curiosity: "emotion", is: "anxious" }, 2);
  P("frame-opens-triumph", "When the frame suddenly widens, the moment feels like a victory", "camera-angle", "Snapping from a narrow frame to a wide one lets the picture breathe all at once, which plays as release and triumph.", { curiosity: "aspect", slider: "change", is: "snaps" }, { curiosity: "emotion", is: "triumphant" }, 1, { also: ["lines"] });

  // ---------- The story's volume curve ----------
  P("climax-gets-loud", "When the story reaches its climax, the sound gets loud", "lines", "The biggest moment of the story gets the fullest, loudest mix so the audience feels it in their chest.", { curiosity: "toneArc", is: "climax" }, { curiosity: "loudness", is: "loud" }, 1, { also: ["audio-mix"] });
  P("wide-range-peaks", "When a line swings from whisper to shout, the shout pushes the mix to its limit", "lines", "A big jump in loudness inside one line can crackle if nobody tames it, so the shout ends up at the very top of the mix.", { curiosity: "dynamicRange", is: "wide" }, { curiosity: "loudness", is: "peaking" }, 1, { also: ["audio-mix"] });
  P("ending-fades-out", "When the story reaches its ending, the sound fades out", "lines", "The last beat lets the sound slip away slowly instead of stopping, so the audience leaves gently.", { curiosity: "toneArc", is: "ending" }, { curiosity: "audioFade", is: "fade out" }, 2, { also: ["audio-mix"] });
  P("whisper-quiets-the-room", "When a line is whispered, the other sounds fall away", "lines", "To let a whisper be heard, the mix drops the background, so the whole scene seems to hold its breath.", { curiosity: "vocalTone", is: "whispered" }, { curiosity: "soundDensity", change: "drops" }, 1, { also: ["music"] });
  P("breaking-voice-sad", "When a voice breaks, the beat turns sad", "lines", "A crack in the voice shows a character can no longer hold it together, and the scene tips into sadness.", { curiosity: "vocalTone", is: "breaking" }, { curiosity: "emotion", is: "melancholy" }, 1);
  P("swinging-range-unsettled", "When every line swings to a new level, the character feels unstable", "lines", "Jumping from quiet to loud line after line makes someone seem out of control, which puts the audience on edge.", { curiosity: "rangeChanges", is: "every line" }, { curiosity: "emotion", is: "anxious" }, 2);

  // ---------- Talking fast ----------
  P("fast-talk-fast-cuts", "When the talk gets fast, the cutting speeds up to match", "lines", "Rapid back-and-forth needs a shot for each reply, so the edit quickens with the words.", { curiosity: "pace", is: "fast" }, { curiosity: "cutRate", is: "fast" }, 1, { also: ["camera-motion"] });
  P("talking-over-each-other-comedy", "When people talk over each other, the scene turns to comedy", "lines", "Overlapping, tangled dialogue is the engine of screwball comedy: nobody listens and the chaos becomes the joke.", { curiosity: "pace", slider: "overlap", is: "talking over each other" }, { curiosity: "emotion", is: "absurd" }, 2);

  // ---------- Voices ----------
  P("echo-voice-dreamy", "When a voice echoes, the moment feels like a dream or a memory", "audio-mix", "An echo lifts a voice out of the room it is in, so the audience hears it as a memory, a thought or a dream.", { curiosity: "voiceEffect", is: "echo" }, { curiosity: "emotion", is: "dreamlike" }, 1, { also: ["lines"] });
  P("dub-breaks-lip-match", "When a voice is translated, the mouths stop matching the words", "audio-mix", "A dubbed line rarely fits the lips that spoke the original, so the mouth shapes drift out of step with the sound.", { curiosity: "translatedVoice", is: "translated" }, { curiosity: "lipSync", slider: "accuracy", change: "drops" }, 1, { also: ["character-motion"] });

  // ---------- Proximity suites ----------
  PS("whose-eyes-are-these", "Whose eyes are these?", "camera-angle", "Handing over the camera makes the view personal, the view starts to shake, a lying narrator splits words from picture, and that split gets a laugh.", ["player-takes-camera-view", "seen-through-eyes-shake", "lying-eyes-lying-voice", "voiceover-caught-laugh"], { also: ["camera-motion", "audio-mix"] });
  PS("choosing-the-angle", "Choosing the angle", "camera-angle", "More angles mean more cuts; angles picked for lines or moves decide where cuts fall; angles that fight the scene make it funny or tense.", ["more-angles-faster-cuts", "angle-for-line-cuts-on-line", "angle-against-line-laugh", "angle-for-action-cuts-on-action", "angle-against-action-unease"]);
  PS("camera-moves-with-a-reason", "Camera moves with a reason", "camera-motion", "The camera moves because something gave it a reason: a walk, a person to follow, a breath, or a loud bang.", ["cross-starts-the-move", "follow-character-track", "move-on-breath-pause", "loud-jolts-camera"], { also: ["character-motion"] });
  PS("coming-at-the-lens", "Coming at the lens", "character-motion", "A character walks up to the camera, their reaching hand grows huge, and the audience flinches.", ["toward-lens-close-up", "toward-lens-looms", "looming-makes-flinch"], { also: ["placement"] });
  PS("cartoon-physics", "Cartoon physics", "character-motion", "A big wind-up, a snapping move, a bounce past the mark and hair that keeps swinging: the chain that makes cartoons feel alive and fun.", ["big-windup-big-stretch", "snap-move-bounces", "bounce-feels-playful", "sudden-stop-hair-keeps-going"], { also: ["movement-lines"] });
  PS("smooth-or-stiff", "Smooth or stiff", "character-motion", "How fast a character moves and talks decides how often they are drawn and posed, and straight paths make them robotic.", ["fast-move-every-frame", "straight-paths-robotic", "fast-talk-fewer-poses"], { also: ["lines"] });
  PS("the-eyes-give-it-away", "The eyes give it away", "movement-lines", "Darting eyes read as nerves, nerves bring fast blinking, and a glance at something pulls the whole body round.", ["darting-eyes-nervous", "nervous-blinks-more", "eyes-find-object-lead-turn"], { also: ["lines"] });
  PS("dinner-gets-messy", "Dinner gets messy", "placement", "Food on the table means talking with a full mouth, muddy words to clean up, and chewing pauses that time the jokes.", ["food-means-talking-while-eating", "mouth-full-needs-cleanup", "chew-before-reply"], { also: ["lines", "audio-mix"] });
  PS("speed-and-impact", "Speed and impact", "placement", "Fast things blur, crisp frames feel harsh, and every drop and quick cut gets a sound hit.", ["fast-object-blurs", "no-blur-jittery-fear", "drop-gets-sound-hit", "fast-action-cuts-more-hits"], { also: ["camera-angle", "audio-mix"] });
  PS("where-the-eye-goes", "Where the eye goes", "camera-angle", "Soft backgrounds and focus shifts steer the audience to a face, and a sharp door promises an entrance.", ["shallow-focus-on-face", "focus-pull-on-line", "focus-on-door-entrance"], { also: ["placement"] });
  PS("sound-of-the-place", "Sound of the place", "background", "The next place is heard before it is seen, outside brings the off-screen world in, and more people make it busier.", ["new-place-sound-first", "outside-hear-the-world", "more-people-busier-sound"], { also: ["music"] });
  PS("deadpan-storybook", "Deadpan storybook", "background", "Patterns push the subject to dead center, and dead center makes oddness funny.", ["pattern-centers-subject", "dead-center-deadpan"], { also: ["camera-angle"] });
  PS("the-volume-curve", "The volume curve", "lines", "Whispers empty the room, big swings hit the top of the mix, the climax is loudest, and the ending fades away.", ["whisper-quiets-the-room", "wide-range-peaks", "climax-gets-loud", "ending-fades-out"], { also: ["audio-mix"] });
  PS("talking-fast", "Talking fast", "lines", "Quick talk brings quick cuts and simpler poses, and once people talk over each other it becomes comedy.", ["fast-talk-fast-cuts", "fast-talk-fewer-poses", "talking-over-each-other-comedy"], { also: ["camera-motion"] });

  // ---------- Suites ----------
  S("found-footage-feel", "Found-footage feel", "camera-angle", "Looks like someone in the story filmed it themselves: we see through their eyes, the camera wobbles, and fast moves smear.", [
    { curiosity: "pov", value: "a person", weight: 90 },
    { curiosity: "cameraCarry", value: "handheld", weight: 80 },
    { curiosity: "cameraShake", value: 4, weight: 70 },
    { curiosity: "motionBlur", value: "heavy", weight: 50 },
    { curiosity: "lensLength", value: "wide", weight: 50 },
  ], { also: ["camera-motion"] });
  S("video-game-camera", "Video game camera", "camera-motion", "The player steers the view: one camera trails the hero, keeps them in the middle, and never cuts away.", [
    { curiosity: "cameraOwner", value: "player", weight: 90 },
    { curiosity: "moveFollows", value: "character", weight: 80 },
    { curiosity: "composition", value: "center", weight: 60 },
    { curiosity: "angleCount", value: 1, weight: 60 },
    { curiosity: "pov", value: "a person", weight: 40 },
  ], { also: ["camera-angle"] });
  S("cut-on-the-words", "Cut on the words", "camera-angle", "A talk-driven scene where every shot is chosen for a line, cuts fall on the lines, and the next voice often starts before the cut.", [
    { curiosity: "angleToLine", value: "matches the line", weight: 90 },
    { curiosity: "angleChange", value: "on the line", weight: 80 },
    { curiosity: "timePerCharacter", value: "even", weight: 50 },
    { curiosity: "soundToCut", value: "J-cut", weight: 60 },
    { curiosity: "pace", value: "medium", weight: 40 },
  ], { also: ["lines"] });
  S("cut-on-the-move", "Cut on the move", "camera-angle", "An action scene where every shot is picked for a movement and the cuts land mid-move, with sound hits stitching it together.", [
    { curiosity: "angleToAction", value: "matches the action", weight: 90 },
    { curiosity: "angleChange", value: "on the action", weight: 80 },
    { curiosity: "actionCutRate", value: 6, weight: 60 },
    { curiosity: "motionBlur", value: "light", weight: 40 },
    { curiosity: "sfxHits", value: "some", weight: 50 },
  ], { also: ["lines"] });
  S("dinner-table-scene", "Dinner table scene", "placement", "A family or friends around a meal: talking while eating, glances across the table, a pat on the arm.", [
    { curiosity: "objectKind", value: "food", weight: 90 },
    { curiosity: "eating", value: "speak while eating", weight: 80 },
    { curiosity: "eyeline", value: "glances", weight: 50 },
    { curiosity: "peopleCount", value: 4, weight: 60 },
    { curiosity: "touch", value: "brief", weight: 40 },
  ], { also: ["lines"] });
  S("glamour-close-up", "Glamour close-up", "placement", "The star shot: a striking look, a long lens, the face razor sharp and the background melted away.", [
    { curiosity: "look", value: "striking", weight: 90 },
    { curiosity: "focus", value: "face", weight: 80 },
    { curiosity: "depthOfField", value: "shallow", weight: 80 },
    { curiosity: "rackFocus", value: "none", weight: 40 },
    { curiosity: "lensLength", value: "long", weight: 60 },
  ], { also: ["camera-angle"] });
  S("focus-pull-reveal", "Focus pull reveal", "camera-angle", "Something blurry in the frame snaps into focus at the key moment, like a door behind a character, so the audience discovers it.", [
    { curiosity: "rackFocus", value: "on the action", weight: 90 },
    { curiosity: "focus", value: "door", weight: 70 },
    { curiosity: "depthOfField", value: "shallow", weight: 70 },
    { curiosity: "silence", value: "short", weight: 40 },
  ], { also: ["placement"] });
  S("old-cartoon-bounce", "Old cartoon bounce", "character-motion", "1930s cartoon style: everything moves in loops and curves, squashes and stretches, and springs past its mark.", [
    { curiosity: "arcs", value: "figure eight", weight: 70 },
    { curiosity: "spacing", value: "ease both", weight: 60 },
    { curiosity: "squash", value: 5, weight: 90 },
    { curiosity: "overshoot", value: "bounce", weight: 80 },
    { curiosity: "animFeelLens", value: "rubber-hose wild", weight: 70 },
  ]);
  S("budget-tv-animation", "Budget TV animation", "character-motion", "Saturday-morning cartoon on a tight budget: few poses, a handful of mouth shapes, drawings held for two frames, and blinks to keep faces alive.", [
    { curiosity: "poseRate", value: 2, weight: 80 },
    { curiosity: "lipSync", value: 3, weight: 70 },
    { curiosity: "stepping", value: "twos", weight: 70 },
    { curiosity: "arcs", value: "straight", weight: 50 },
    { curiosity: "blink", value: "yes", weight: 50 },
  ]);
  S("thinking-face", "Thinking face", "movement-lines", "Quiet, inward acting: the eyes move first, blinks fall on each new thought, hands stay still.", [
    { curiosity: "leadPart", value: "eyes", weight: 90 },
    { curiosity: "blink", slider: "meaning", value: "on every thought", weight: 70 },
    { curiosity: "gesture", value: 1, weight: 60 },
    { curiosity: "gazeShift", value: 3, weight: 50 },
    { curiosity: "stillness", value: 4, weight: 60 },
  ], { also: ["character-motion"] });
  S("stage-size-acting", "Stage-size acting", "movement-lines", "Acting for the back row: big sweeping gestures led by the hands, a new pose on every phrase, voices up and down.", [
    { curiosity: "gesture", value: 5, weight: 90 },
    { curiosity: "leadPart", value: "hands", weight: 70 },
    { curiosity: "poseRate", value: 6, weight: 70 },
    { curiosity: "rangeChanges", value: "every line", weight: 60 },
    { curiosity: "loudness", value: "loud", weight: 50 },
  ], { also: ["lines"] });
  S("hushed-two-hander", "Hushed two-hander", "placement", "Two people, close and quiet: they hold each other's gaze, a hand stays put, the room goes silent, and they share the time equally.", [
    { curiosity: "eyeline", value: "both hold", weight: 90 },
    { curiosity: "touch", value: "held", weight: 70 },
    { curiosity: "loudness", value: "quiet", weight: 60 },
    { curiosity: "soundDensity", value: 1, weight: 60 },
    { curiosity: "pace", value: "slow", weight: 50 },
    { curiosity: "timePerCharacter", value: "even", weight: 50 },
  ], { also: ["lines"] });
  S("rapid-fire-banter", "Rapid-fire banter", "lines", "Quick-witted comedy talk: fast lines, one person grabbing most of the floor, voices jumping around, hard cuts, quick glances.", [
    { curiosity: "pace", value: "fast", weight: 90 },
    { curiosity: "timePerCharacter", value: "uneven", weight: 50 },
    { curiosity: "rangeChanges", value: "every other", weight: 60 },
    { curiosity: "soundToCut", value: "hard", weight: 60 },
    { curiosity: "eyeline", value: "glances", weight: 40 },
  ], { also: ["camera-angle"] });
  S("widescreen-epic", "Widescreen epic", "camera-angle", "The big-movie finale: a very wide frame, wind across the landscape, people small against it, and a full, loud soundtrack.", [
    { curiosity: "aspect", value: "2.39", weight: 90 },
    { curiosity: "envMotion", value: "wind", weight: 60 },
    { curiosity: "foreshortening", value: "slight", weight: 30 },
    { curiosity: "soundDensity", value: 5, weight: 60 },
    { curiosity: "toneArc", value: "climax", weight: 70 },
    { curiosity: "loudness", value: "loud", weight: 60 },
  ], { also: ["lines", "audio-mix"] });
  S("hazy-memory", "Hazy memory", "audio-mix", "A flashback or dream: voices echo, sounds melt into each other, movement smears, and the frame is an old-fashioned square.", [
    { curiosity: "voiceEffect", value: "echo", weight: 90 },
    { curiosity: "audioFade", value: "crossfade", weight: 70 },
    { curiosity: "motionBlur", value: "light", weight: 50 },
    { curiosity: "aspect", value: "1.33", weight: 50 },
  ], { also: ["camera-angle"] });
  S("dubbed-foreign-film", "Dubbed foreign film", "audio-mix", "A film re-voiced in another language: clean studio voices, mouths that do not quite match, and nothing fancy on the voices.", [
    { curiosity: "translatedVoice", value: "translated", weight: 90 },
    { curiosity: "lipSync", slider: "accuracy", value: 1, weight: 60 },
    { curiosity: "voiceCleanup", value: "voice enhanced", weight: 60 },
    { curiosity: "voiceEffect", value: "natural", weight: 50 },
  ], { also: ["character-motion"] });
  S("clean-interview-sound", "Clean interview sound", "audio-mix", "A documentary sit-down: the room echo scrubbed away, steady normal level, almost nothing else in the mix, gentle fade in.", [
    { curiosity: "voiceCleanup", value: "both", weight: 90 },
    { curiosity: "loudness", value: "normal", weight: 70 },
    { curiosity: "soundDensity", value: 1, weight: 60 },
    { curiosity: "audioFade", value: "fade in", weight: 40 },
  ], { also: ["music"] });
  S("symmetrical-storybook", "Symmetrical storybook", "background", "A neat, picture-book world: repeating patterns, the character dead center, a few bold shapes, and nothing blowing in the wind.", [
    { curiosity: "repeatInFrame", value: 4, weight: 90 },
    { curiosity: "composition", value: "center", weight: 80 },
    { curiosity: "sceneShapes", value: "a few shapes", weight: 60 },
    { curiosity: "envMotion", value: "still", weight: 50 },
    { curiosity: "aspect", value: "1.85", weight: 30 },
  ], { also: ["camera-angle"] });
  S("busy-city-street", "Busy city street", "background", "Outside in a crowd: people streaming past, a frame full of shapes, and layers of sound piled on top of each other.", [
    { curiosity: "envMotion", value: "crowd", weight: 90 },
    { curiosity: "sceneShapes", value: "busy", weight: 70 },
    { curiosity: "soundDensity", value: 5, weight: 70 },
    { curiosity: "peopleCount", value: 8, weight: 60 },
    { curiosity: "intExt", value: "exterior", weight: 60 },
  ], { also: ["placement", "music"] });
  S("car-chase", "Car chase", "placement", "Vehicles at top speed: things blur past, objects lunge at the lens, cuts come fast, and sound hits land on every swerve.", [
    { curiosity: "objectKind", value: "vehicle", weight: 90 },
    { curiosity: "objectSpeed", value: 5, weight: 90 },
    { curiosity: "foreshortening", value: "strong", weight: 50 },
    { curiosity: "motionBlur", value: "heavy", weight: 60 },
    { curiosity: "actionCutRate", value: 7, weight: 60 },
    { curiosity: "envMotion", value: "transit", weight: 50 },
  ], { also: ["camera-angle"] });
  S("quiet-last-scene", "Quiet last scene", "lines", "The final beat of a story: slow talk, soft sound, and everything fading out together.", [
    { curiosity: "toneArc", value: "ending", weight: 90 },
    { curiosity: "audioFade", value: "fade out", weight: 70 },
    { curiosity: "pace", value: "slow", weight: 60 },
    { curiosity: "loudness", value: "quiet", weight: 60 },
  ], { also: ["audio-mix"] });
  // ---------- LIGHT: night comes down ----------
  P("night-brings-moonlight", "When night falls, the light turns to moonlight", "light", "Once the scene is set at night, the main light becomes a soft, cool moon instead of the sun.", { curiosity: "timeOfDay", is: "night" }, { curiosity: "lighting", is: "moon" }, 1);
  P("moonlight-goes-blue", "When moonlight takes over, the light turns blue", "light", "Film moonlight is usually played blue: the color of the light climbs toward the cold end.", { curiosity: "lighting", is: "moon" }, { curiosity: "colorTemp", slider: "kelvin", is: 7500 }, 1);
  P("cold-light-pulls-apart", "When the light goes cold, the characters drift apart", "light", "A cold, blue light makes people feel further from each other, and the gap between what they feel grows.", { curiosity: "colorTemp", is: "cold day" }, { curiosity: "emotionGap", change: "rises" }, 3, { also: ["emotion"] });
  PS("night-comes-down", "Night comes down", "light", "Night falls, the light turns to blue moonlight, and the people in it start to feel far apart.", ["night-brings-moonlight", "moonlight-goes-blue", "cold-light-pulls-apart"]);

  P("dusk-brings-dusk-light", "When the day reaches dusk, the light goes low and golden", "light", "At the end of the day the sun sits low, so the light comes in long, warm and soft.", { curiosity: "timeOfDay", is: "dusk" }, { curiosity: "lighting", is: "dusk" }, 1);
  P("dusk-light-shifts-in-hold", "When dusk light is used, the light changes while the shot holds", "light", "Golden light fades by the minute, so a long held shot shows the light slowly changing on the faces.", { curiosity: "lighting", is: "dusk" }, { curiosity: "lightChange", is: "during the hold" }, 2);
  P("light-shift-moves-feeling", "When the light shifts during a held shot, the feeling inside grows", "light", "If the light changes while the camera stays still, the audience reads it as a change happening inside the character.", { curiosity: "lightChange", is: "during the hold" }, { curiosity: "emotionIntensity", change: "rises" }, 2, { also: ["emotion"] });
  P("warm-skin-glow-feeling", "When light glows warm through the skin, the feeling gets stronger", "light", "Light that seems to sit inside the skin makes a face look alive and open, so we feel more with the person.", { curiosity: "skinLight", change: "rises" }, { curiosity: "emotionIntensity", change: "rises" }, 2, { also: ["emotion"] });
  PS("golden-hour-turn", "The golden hour turn", "light", "Dusk light arrives, changes while the camera holds, and the feeling in the face swells with it.", ["dusk-brings-dusk-light", "dusk-light-shifts-in-hold", "light-shift-moves-feeling"]);

  // ---------- LIGHT: lamps in the room ----------
  P("lamp-in-shot-motivates", "When a lamp is in the shot, the light seems to come from it", "light", "Showing the lamp gives the light a reason to be there, so the setup feels natural instead of staged.", { curiosity: "practicalInFrame", is: "yes" }, { curiosity: "lightCount", slider: "motivated", is: 90 }, 1);
  P("motivated-light-warm", "When the light comes from lamps, it turns warm", "light", "Light that plausibly comes from household lamps reads as warm orange, not daylight blue.", { curiosity: "lightCount", slider: "motivated", change: "rises" }, { curiosity: "colorTemp", is: "warm practical" }, 1);
  P("warm-lamps-cozy", "When the light is warm lamplight, the room feels cozy", "light", "Warm pools of lamplight make a place feel safe and lived in.", { curiosity: "colorTemp", is: "warm practical" }, { curiosity: "settingMood", is: "cozy" }, 2, { also: ["emotion"] });
  P("cozy-pulls-close", "When the room feels cozy, people sit closer", "emotion", "A safe, warm space lets the characters drop their guard and move into each other's space.", { curiosity: "settingMood", is: "cozy" }, { curiosity: "personalSpace", is: "close" }, 3, { also: ["light"] });
  PS("lamplit-closeness", "Lamplit closeness", "light", "A lamp in the shot, warm light from it, a cozy room, and people drawing close.", ["lamp-in-shot-motivates", "motivated-light-warm", "warm-lamps-cozy", "cozy-pulls-close"]);

  // ---------- LIGHT: noir squeeze ----------
  P("side-key-raises-contrast", "When the main light moves to the side, half the face falls into shadow", "light", "Light from the side lights one cheek and leaves the other dark, so the contrast jumps.", { curiosity: "key", is: "side" }, { curiosity: "contrast", change: "rises" }, 1);
  P("contrast-goes-low-key", "When the contrast climbs, the whole picture goes dark", "light", "As shadows deepen, the scene tips into a low key look: mostly dark with a few bright spots.", { curiosity: "contrast", change: "rises" }, { curiosity: "valueKey", is: "low key" }, 2);
  P("low-key-hides-meaning", "When the picture goes dark, people hide more than they say", "light", "Dark, shadowy scenes are where characters keep secrets: what they say and what they mean pull apart.", { curiosity: "valueKey", is: "low key" }, { curiosity: "subtext", is: "far apart" }, 3, { also: ["emotion"] });
  P("haze-reveals-beams", "When haze fills the air, the shaped light shows up as beams", "light", "Light through blinds or leaves is invisible in clean air; add haze and you see the stripes in the air itself.", { curiosity: "atmosphere", is: "haze" }, { curiosity: "lightShape", slider: "strength", change: "rises" }, 1);
  P("blind-stripes-trap", "When blind stripes fall across a face, the tension rises", "light", "Bars of shadow across a person read like a cage, so the audience feels them trapped.", { curiosity: "lightShape", is: "blinds" }, { curiosity: "emotionIntensity", change: "rises" }, 2, { also: ["emotion"] });
  PS("noir-squeeze", "Noir squeeze", "light", "Side light, rising contrast, a dark picture, and characters hiding what they mean: the classic crime-film tightening.", ["side-key-raises-contrast", "contrast-goes-low-key", "low-key-hides-meaning"]);
  PS("smoky-blinds", "Smoky blinds", "light", "Haze turns blind light into visible bars, and the bars make the person feel caged.", ["haze-reveals-beams", "blind-stripes-trap"]);

  // ---------- LIGHT: backlight and separation ----------
  P("backlight-brings-rim", "When the main light goes behind the actor, a strong edge of light appears", "light", "Light from behind draws a bright outline around the head and shoulders.", { curiosity: "key", is: "back" }, { curiosity: "rim", is: "strong" }, 1);
  P("rim-separates-layers", "When a strong edge light outlines the actor, they pop off the background", "light", "The bright edge splits the person from what is behind them, so the picture reads as clear layers.", { curiosity: "rim", is: "strong" }, { curiosity: "layersLens", is: "three layers" }, 1);
  P("rim-lights-hair", "When a strong edge light hits from behind, the hair shines", "effects", "Backlight turns hair into a bright halo and shows every strand's shine.", { curiosity: "rim", is: "strong" }, { curiosity: "hairShine", slider: "howMuch", change: "rises" }, 1, { also: ["light"] });
  P("pale-hair-thin-rim", "When the hair is pale, a thin edge light is enough", "light", "Light hair catches backlight easily, so the edge light can stay thin and still glow.", { curiosity: "hairColor", is: "light" }, { curiosity: "rim", is: "thin" }, 1, { also: ["effects"] });
  PS("halo-from-behind", "Halo from behind", "light", "Light moves behind the actor, an edge of light appears, the hair shines and the person lifts off the background.", ["backlight-brings-rim", "rim-lights-hair", "rim-separates-layers"]);

  // ---------- LIGHT: surfaces, color and eye ----------
  P("soaked-street-mirror", "When the street is soaked, every surface turns to a mirror", "light", "Wet ground reflects like glass; this is why night streets in films are hosed down.", { curiosity: "surfaceLens", slider: "wet", is: "soaked" }, { curiosity: "gloss", is: "mirror" }, 1);
  P("mirror-doubles-lamps", "When surfaces are mirror-shiny, every lamp appears twice", "light", "Shiny floors and glass reflect each light, so the number of bright spots in the shot doubles.", { curiosity: "gloss", is: "mirror" }, { curiosity: "practicalInFrame", slider: "count", change: "rises" }, 1);
  P("ruined-surfaces-gloom", "When everything looks worn and ruined, the place feels gloomy", "light", "Rust, dust and stains tell us this place has been forgotten, and the mood sinks.", { curiosity: "wear", is: "ruined" }, { curiosity: "settingMood", is: "gloomy" }, 2, { also: ["emotion"] });
  P("narrow-palette-one-pop", "When the colors narrow to one, any other color jumps out", "light", "In a mostly one-color picture, a single object in a different color grabs the eye.", { curiosity: "palette", is: "one color" }, { curiosity: "colorAccent", is: "one thing in a strong color" }, 2, { also: ["color"] });
  P("pop-color-grips-eye", "When one color pops, the audience's eye locks on it", "color", "A lone strong color becomes a signal: we watch that thing and wait for it to matter.", { curiosity: "colorAccent", is: "one thing in a strong color" }, { curiosity: "fixation", change: "rises" }, 1, { also: ["focus"] });
  P("glow-pulls-eye", "When an object glows, the eye goes straight to it", "light", "The brightest thing in the frame wins attention, so a glowing object becomes the center of the scene.", { curiosity: "glow", is: "object" }, { curiosity: "fixation", change: "rises" }, 1, { also: ["focus"] });
  P("window-soft-light", "When the light comes from a window, it falls soft across faces", "light", "A big window is a large source, so shadows on the face are soft and gentle.", { curiosity: "lightRigLens", is: "window" }, { curiosity: "softness", is: "soft" }, 1);
  P("drawn-look-cartoon-comedy", "When the picture looks drawn, the comedy can go cartoon-big", "light", "Once the image looks like a cartoon, the audience accepts bigger, sillier reactions.", { curiosity: "renderLookLens", is: "toon" }, { curiosity: "comicRegister", is: "cartoon" }, 2, { also: ["comedy"] });
  P("bright-even-plays-bigger", "When the picture goes bright and even, the comedy gets playful", "light", "Bright, flat light is the look of sitcoms: nothing hides in shadow, so the jokes can play out in the open.", { curiosity: "valueKey", is: "high key" }, { curiosity: "comicRegister", is: "playful" }, 2, { also: ["comedy"] });
  PS("one-red-thing", "One red thing", "color", "The colors narrow, one thing pops, and the audience can't stop watching it.", ["narrow-palette-one-pop", "pop-color-grips-eye"]);
  PS("wet-neon-street", "Wet neon street", "light", "A soaked street turns to a mirror and every sign and lamp shows up twice.", ["soaked-street-mirror", "mirror-doubles-lamps"]);

  // ---------- EFFECTS: smash and settle ----------
  P("destruction-shatters", "When the physical comedy turns destructive, things shatter", "comedy", "A gag that goes too far ends with something breaking into pieces.", { curiosity: "physicalComedy", is: "destruction" }, { curiosity: "breakage", is: "shatters" }, 1, { also: ["effects"] });
  P("shatter-scatters", "When something shatters, pieces scatter across the floor", "effects", "Glass or pottery that breaks leaves a spray of bits around the scene.", { curiosity: "breakage", is: "shatters" }, { curiosity: "scatter", change: "rises" }, 1);
  P("heavy-settles-fast", "When things feel heavy, they land and stop fast", "effects", "Heavy objects thud and stay put; light ones keep rocking. A short settle time sells the weight.", { curiosity: "gravityFeel", is: "heavy" }, { curiosity: "settleTime", is: 0 }, 1);
  P("springy-goes-cartoon", "When things bounce like rubber, the comedy turns cartoon", "effects", "Springy, bouncy landings are the physics of cartoons, so the scene reads as playful and unreal.", { curiosity: "settleTime", slider: "bounce", is: "springy" }, { curiosity: "comicRegister", is: "cartoon" }, 2, { also: ["comedy"] });
  PS("smash-and-scatter", "Smash and scatter", "comedy", "A gag goes too far, something shatters, and the pieces fly everywhere.", ["destruction-shatters", "shatter-scatters"], { also: ["effects"] });

  // ---------- EFFECTS: hair and fur ----------
  P("long-fur-lags", "When the fur is long, it trails behind the move", "effects", "Long fur swings after the body stops, so you see the motion carry on a beat later.", { curiosity: "furLength", is: "long" }, { curiosity: "furLag", change: "rises" }, 1);
  P("fur-lag-slow-settle", "When fur lags behind the body, the move takes longer to settle", "effects", "The body stops, but the fur keeps swaying, stretching how long the move lasts on screen.", { curiosity: "furLag", change: "rises" }, { curiosity: "settleTime", change: "rises" }, 1);
  P("soaked-fur-mats", "When fur gets soaked, it clumps flat", "effects", "Water pulls hair into heavy, matted clumps instead of a fluffy coat.", { curiosity: "wetness", is: "soaked" }, { curiosity: "clump", is: "matted" }, 1);
  P("matted-fur-humiliation", "When a pet's fur is soaked flat, it looks pitiful and funny", "effects", "A fluffy animal reduced to a wet, skinny shape is an instant comic come-down.", { curiosity: "clump", is: "matted" }, { curiosity: "humiliation", change: "rises" }, 2, { also: ["comedy"] });
  P("wind-frizzes-hair", "When the wind picks up, the hair frizzes", "effects", "Moving air lifts and separates the strands, so hair turns fly-away.", { curiosity: "windForce", change: "rises" }, { curiosity: "frizz", change: "rises" }, 1);
  PS("bath-time-disaster", "Bath time disaster", "effects", "The fur gets soaked, mats into clumps, and the proud animal looks ridiculous.", ["soaked-fur-mats", "matted-fur-humiliation"], { also: ["comedy"] });
  PS("long-coat-in-motion", "Long coat in motion", "effects", "Long fur trails behind each move and keeps swinging after the body stops.", ["long-fur-lags", "fur-lag-slow-settle"]);

  // ---------- EFFECTS: fire and smoke ----------
  P("fire-flickers-faces", "When fire is in the scene, it flickers light across faces", "effects", "Flames throw a moving, warm light on everything nearby.", { curiosity: "element", is: "fire" }, { curiosity: "fireLight", is: "flicker" }, 1, { also: ["light"] });
  P("firelight-warms", "When firelight floods the scene, the light turns warm", "effects", "Flames are orange, so the whole light of the scene swings to the warm end.", { curiosity: "fireLight", is: "floods" }, { curiosity: "colorTemp", is: "warm practical" }, 1, { also: ["light"] });
  P("smoke-builds-wall", "When the smoke keeps building, it becomes a wall", "effects", "Growing smoke thickens until you can no longer see through it.", { curiosity: "growth", is: "building" }, { curiosity: "density", is: "wall" }, 3);
  P("smoke-wall-narrows-world", "When smoke becomes a wall, the world shrinks to one person", "effects", "With the room hidden, the hero can only see whoever is right in front of them, and so can we.", { curiosity: "density", is: "wall" }, { curiosity: "focusWidth", is: "one person" }, 1, { also: ["focus"] });
  P("chaos-curls-smoke", "When the air turns chaotic, smoke breaks into curls", "effects", "Rough, swirling air twists smoke and steam into curls instead of straight plumes.", { curiosity: "turbulence", change: "rises" }, { curiosity: "curl", change: "rises" }, 1);
  PS("lost-in-the-smoke", "Lost in the smoke", "effects", "Smoke builds into a wall and the hero's world closes in to the one person they can still see.", ["smoke-builds-wall", "smoke-wall-narrows-world"], { also: ["focus"] });
  PS("fire-takes-the-room", "Fire takes the room", "effects", "Fire appears, flickers across faces, then floods the scene with orange light.", ["fire-flickers-faces", "firelight-warms"], { also: ["light"] });

  // ---------- EFFECTS: splash to slow motion ----------
  P("splash-to-slowmo", "When a splash bursts, the edit drops into slow motion", "effects", "A big splash is a classic slow motion moment: every drop gets time to hang.", { curiosity: "splash", is: "burst" }, { curiosity: "clipSpeed", is: "very slow" }, 1, { also: ["speed"] });
  P("slowmo-needs-smooth", "When a clip slows way down, it needs smooth in-between frames", "speed", "Very slow playback stutters unless the software invents new frames between the real ones.", { curiosity: "clipSpeed", is: "very slow" }, { curiosity: "retimeQuality", is: "optical flow" }, 1);
  P("wind-tumbles-leaves", "When the wind picks up, scattered leaves start to tumble", "set", "Still leaves on the ground lift and roll once the wind gets going, so the set comes alive.", { curiosity: "windForce", change: "rises" }, { curiosity: "scatterLens", slider: "moves", is: "tumbles" }, 1, { also: ["effects"] });
  PS("splash-hang-time", "Splash hang time", "effects", "A splash bursts, the edit slows right down, and smooth in-between frames keep every drop clean.", ["splash-to-slowmo", "slowmo-needs-smooth"], { also: ["speed"] });

  // ---------- COLOR ----------
  P("red-filter-danger", "When the filter turns red, the danger feels close", "color", "A red wash is the color of alarms and blood; the audience tenses up.", { curiosity: "filterHue", is: "red" }, { curiosity: "emotionIntensity", change: "rises" }, 1, { also: ["emotion"] });
  P("off-skin-uneasy", "When skin color looks far from real, the audience feels something is wrong", "color", "We know what skin should look like, so sickly or strange skin makes us uneasy even if we can't say why.", { curiosity: "skinColorTruth", is: "far off" }, { curiosity: "audienceFeeling", is: "different" }, 2, { also: ["emotion"] });

  // ---------- WARDROBE ----------
  P("crowd-rags-hero-alone", "When the crowd is in rags, the hero's clean clothes make them the only one", "wardrobe", "Dress the background poorly and anyone in decent clothes stands out at once.", { curiosity: "backCost", is: "rags" }, { curiosity: "backVsMain", is: "main is the only one dressed that way" }, 1);
  P("lone-outfit-finds-hero", "When the hero is the only one dressed that way, the eye finds them in the crowd", "wardrobe", "A unique outfit is a spotlight: the audience picks the main character out of any crowd shot.", { curiosity: "backVsMain", is: "main is the only one dressed that way" }, { curiosity: "focusWidth", is: "one person" }, 1, { also: ["focus"] });
  P("lone-outfit-fish-out", "When the hero dresses unlike everyone else, they feel out of place", "wardrobe", "Clothes that clash with the crowd set up the comedy of someone who doesn't belong.", { curiosity: "backVsMain", is: "clearly apart" }, { curiosity: "fishOutOfWater", change: "rises" }, 2, { also: ["comedy"] });
  P("luxury-stands-out", "When the hero's clothes are luxury, they stand out from the room", "wardrobe", "Expensive clothes in an ordinary room pull away from the set around them.", { curiosity: "mainCost", is: "luxury" }, { curiosity: "mainSetMatch", is: "stands out" }, 1);
  P("ceremony-stiffens", "When the clothes are very formal, people move stiffly", "wardrobe", "Suits, gowns and ceremony clothes hold the body in place, so movement becomes careful and held back.", { curiosity: "mainFormality", is: "ceremony" }, { curiosity: "emoMove", is: "held back" }, 1, { also: ["emotion"] });
  P("baggy-clothes-stumble", "When the clothes are baggy, a trip or a snag is waiting", "wardrobe", "Too-big trousers and long sleeves set up physical comedy: something will catch.", { curiosity: "mainFit", is: "baggy" }, { curiosity: "physicalComedy", is: "a stumble" }, 4, { also: ["comedy"] });
  P("layer-off-closer", "When a layer of clothing comes off, the characters get closer", "wardrobe", "Loosening a jacket or tie is a sign of trust; the space between people shrinks.", { curiosity: "mainCoverage", change: "drops" }, { curiosity: "personalSpace", is: "close" }, 3, { also: ["emotion"] });
  P("armor-up-action", "When the hero suits up in armor, big action follows", "wardrobe", "Putting on armor or protective gear is a promise: a fight or a stunt is coming.", { curiosity: "mainFunction", is: "armor" }, { curiosity: "emoActions", is: "big" }, 4, { also: ["emotion"] });
  P("show-clothes-wrong-job", "When the outfit is only for show, the hero is wrong for the job", "wardrobe", "Heels on a hike or a tux in a mud pit: pretty clothes in a practical place make the hero a fish out of water.", { curiosity: "mainUtility", is: "only for looks" }, { curiosity: "fishOutOfWater", change: "rises" }, 2, { also: ["comedy"] });
  P("crowd-era-sets-room", "When the crowd dresses in 1920s clothes, the room follows", "wardrobe", "The background costumes set the period, and the set must match their glamour.", { curiosity: "backEra", is: "1920s" }, { curiosity: "setStyle", is: "1920s glamour" }, 1, { also: ["set"] });
  P("wrong-period-absurd", "When the background clothes are clearly wrong for the time, the scene turns into a joke", "wardrobe", "A knight with a wristwatch is a gag; obvious mistakes in period dress make the scene absurd.", { curiosity: "backPeriodTruth", is: "clearly wrong" }, { curiosity: "absurdity", change: "rises" }, 1, { also: ["comedy"] });
  P("uniforms-oppress", "When everyone wears the same uniform, the place feels oppressive", "wardrobe", "A sea of identical clothes says rules and control; the mood closes in.", { curiosity: "backSameness", is: "uniforms" }, { curiosity: "settingMood", is: "oppressive" }, 2, { also: ["emotion"] });
  P("torn-crowd-shabby", "When the crowd's clothes are torn and dirty, the place reads as run down", "wardrobe", "Worn costumes on the extras tell us about the place before we see much of it.", { curiosity: "backWear", is: "torn and dirty" }, { curiosity: "setUpkeep", is: "shabby" }, 1, { also: ["set"] });
  P("bundled-crowd-cool-grade", "When the crowd is bundled up, the picture turns cool", "wardrobe", "Coats and scarves on everyone mean cold weather, and the color usually follows into blue.", { curiosity: "backCoverage", is: "fully covered" }, { curiosity: "warmCool", is: "cool" }, 1, { also: ["color"] });
  P("workwear-industrial", "When the crowd wears work clothes, the place reads as a working site", "wardrobe", "Overalls and hard hats in the background turn any room into a factory or a yard.", { curiosity: "backFunction", is: "work wear" }, { curiosity: "setStyle", is: "industrial" }, 1, { also: ["set"] });
  P("show-crowd-rich-room", "When the crowd dresses only for show, the room is rich", "wardrobe", "A background of people in clothes made only to be seen tells us we're somewhere wealthy.", { curiosity: "backUtility", is: "only for looks" }, { curiosity: "setStyle", slider: "wealth", is: "rich" }, 1, { also: ["set"] });
  PS("standout-hero", "The standout hero", "wardrobe", "Dress the crowd down, the hero becomes the only one dressed that way, and the eye finds them every time.", ["crowd-rags-hero-alone", "lone-outfit-finds-hero"], { also: ["focus"] });
  PS("dressed-wrong-for-it", "Dressed wrong for it", "wardrobe", "Pretty clothes for a practical job, then baggy clothes that snag: the outfit sets up the comedy.", ["show-clothes-wrong-job", "baggy-clothes-stumble"], { also: ["comedy"] });

  // ---------- SET ----------
  P("glass-set-mirror", "When the set is made of glass, surfaces turn mirror-shiny", "set", "Glass walls and tables throw back every light and reflection in the room.", { curiosity: "setMaterial", is: "glass" }, { curiosity: "gloss", is: "mirror" }, 1, { also: ["light"] });
  P("sharp-lines-oppress", "When the room is all sharp straight lines, people feel boxed in", "set", "Hard edges and grids make a space feel cold and controlling.", { curiosity: "setLines", is: "sharp and clean" }, { curiosity: "settingMood", is: "oppressive" }, 2, { also: ["emotion"] });
  P("art-wall-distracts", "When the walls are covered in art, the eye wanders off the actors", "set", "A busy wall competes with the faces; use it when you want the audience to look around.", { curiosity: "wallArt", is: 5 }, { curiosity: "distraction", change: "rises" }, 1, { also: ["focus"] });
  P("even-art-rigid-owner", "When the art hangs perfectly even, the owner reads as rigid", "set", "A room arranged with perfect order tells us its owner can't bend, a great flaw for comedy.", { curiosity: "artArrangement", is: "perfectly even" }, { curiosity: "comicFlaw", is: "rigidity" }, 2, { also: ["comedy"] });
  P("deep-set-background-gag", "When the set has deep layers, there's room for a joke in the background", "set", "Depth gives you a back of the room where something funny can happen behind the actors.", { curiosity: "setDepth", is: "deep" }, { curiosity: "visualGag", is: "background" }, 2, { also: ["comedy"] });
  P("dark-set-low-key", "When the set is painted dark, the picture goes low key", "set", "Dark walls swallow light, so the whole image sinks into shadow.", { curiosity: "setBrightness", is: "dark" }, { curiosity: "valueKey", is: "low key" }, 1, { also: ["light"] });
  P("booths-bring-close", "When the room is laid out in booths, people sit close and talk low", "set", "Booths along the walls make private corners, pulling characters into each other's space.", { curiosity: "setLayout", is: "booths along the walls" }, { curiosity: "personalSpace", is: "close" }, 2, { also: ["emotion"] });
  PS("rigid-room-gag", "The rigid room gag", "set", "A perfectly arranged room tells us the owner is rigid, and a deep set gives the joke a place to land behind them.", ["even-art-rigid-owner", "deep-set-background-gag"], { also: ["comedy"] });
  PS("dark-room-secrets", "Dark room secrets", "set", "Dark walls push the picture into low key, and in the dark people stop saying what they mean.", ["dark-set-low-key", "low-key-hides-meaning"], { also: ["light"] });

  // ---------- GRADE ----------
  P("night-filter-night", "When the night filter goes on, the scene plays as night", "grade", "Shooting in daylight and darkening it in the edit (day for night) makes the scene read as night.", { curiosity: "filterLook", is: "night" }, { curiosity: "timeOfDay", is: "night" }, 1, { also: ["light"] });
  P("blown-exposure-glow", "When the picture is blown out, the whole room seems to glow", "grade", "Overexposed highlights bleed into everything, which reads as dreamy or heavenly.", { curiosity: "exposure", is: "blown out" }, { curiosity: "glow", is: "room" }, 1, { also: ["light"] });
  P("very-warm-cozy", "When the color is pushed very warm, the place feels cozy", "grade", "Warm, orange color feels like firelight and home.", { curiosity: "whiteBalance", is: "very warm" }, { curiosity: "settingMood", is: "cozy" }, 1, { also: ["emotion"] });
  P("gritty-oppressive", "When the image turns gritty, the world feels harsh", "grade", "Heavy grain and hard sharpness make a place feel rough and threatening.", { curiosity: "texture", is: "gritty" }, { curiosity: "settingMood", is: "oppressive" }, 2, { also: ["emotion"] });
  P("mismatch-jolts-feeling", "When a shot is graded to clash on purpose, the feeling jumps", "grade", "A sudden change in color from shot to shot tells the audience that something has changed inside the story.", { curiosity: "colorMatch", is: "deliberately different" }, { curiosity: "emoContrastPrev", is: "very different" }, 1, { also: ["emotion"] });
  P("crushed-blacks-contrast", "When the blacks are crushed, the contrast jumps", "grade", "Pushing the darkest parts to solid black hides detail in the shadows and makes the picture punchier.", { curiosity: "colorCurves", is: "crushed blacks" }, { curiosity: "contrast", change: "rises" }, 1, { also: ["light"] });
  P("teal-orange-skin", "When the teal and orange recipe goes on, skin stays warm while the rest turns teal", "grade", "This popular color recipe keeps faces orange-ish and pushes everything else toward teal, so skin is only a little tinted.", { curiosity: "lut", is: "teal and orange" }, { curiosity: "skinColorTruth", is: "slightly tinted" }, 1, { also: ["color"] });
  P("movie-filter-bars", "When a movie filter goes on, black bars come with it", "grade", "Movie-style filters usually add a wide cinema shape with black bars top and bottom.", { curiosity: "filterFamily", is: "movies" }, { curiosity: "canvasFill", is: "black bars" }, 1, { also: ["canvas"] });
  P("polaroid-stacks", "When the picture gets a polaroid look, copies stack like photos on a table", "grade", "Once a shot looks like an instant photo, it's natural to pile several of them into a stack.", { curiosity: "textureEffect", is: "polaroid" }, { curiosity: "multiplyEffect", is: "polaroid stack" }, 2, { also: ["layers"] });
  P("home-video-bittersweet", "When it looks like old home video, the feeling turns bittersweet", "grade", "Home video texture feels like memory: happy and sad at once.", { curiosity: "retroEffect", is: "home video" }, { curiosity: "mixedFeelings", is: "even" }, 2, { also: ["emotion"] });
  PS("memory-box", "Memory box", "grade", "An old photo look, copies stacked like snapshots, and home video that feels happy and sad at once.", ["polaroid-stacks", "home-video-bittersweet"], { also: ["emotion"] });
  PS("hard-edge-grade", "Hard-edge grade", "grade", "Crushed blacks push the contrast up, the picture goes dark, and the characters start hiding things.", ["crushed-blacks-contrast", "contrast-goes-low-key", "low-key-hides-meaning"], { also: ["light"] });

  // ---------- TITLES / SPEED / TRANSITIONS ----------
  P("bounce-in-playful", "When clips bounce in, the video turns playful", "transitions", "Bouncy entrances say 'this is fun', so jokes land lighter.", { curiosity: "clipAnimation", slider: "style", is: "bounce" }, { curiosity: "comicRegister", is: "playful" }, 1, { also: ["comedy"] });
  P("punchy-transitions-fast-reset", "When transitions get explosive, something new arrives every second or two", "transitions", "Hard, flashy transitions push the edit to a fast rhythm.", { curiosity: "transitionFamily", slider: "energy", is: "explosive" }, { curiosity: "attentionReset", is: "every 1 to 2 seconds" }, 1, { also: ["speed"] });
  P("fast-reset-more-laughs", "When something new arrives every second or two, the jokes come faster", "speed", "A fast reset rate leaves no room for slow setups; laughs have to land quickly.", { curiosity: "attentionReset", is: "every 1 to 2 seconds" }, { curiosity: "laughsPerMinute", change: "rises" }, 2, { also: ["comedy"] });
  P("cube-spin-jolt", "When the frame spins like a cube, the pace jumps", "canvas", "A 3D cube spin is a jolt of energy; the edit around it speeds up to match.", { curiosity: "frameMove3D", is: "cube spin" }, { curiosity: "attentionReset", is: "every 1 to 2 seconds" }, 1, { also: ["speed"] });
  P("word-captions-grip", "When captions appear word by word, eyes stay glued to the screen", "titles", "Each new word is a small event, so viewers keep reading and keep watching.", { curiosity: "captions", is: "word by word" }, { curiosity: "fixation", change: "rises" }, 1, { also: ["focus"] });
  P("comic-text-cartoon", "When the text is in comic-book style, the comedy goes cartoon", "titles", "Comic lettering tells us the rules of a cartoon apply.", { curiosity: "textStyle", is: "comic" }, { curiosity: "comicRegister", is: "cartoon" }, 1, { also: ["comedy"] });
  P("many-stickers-laughs", "When stickers and emoji pile up, the laughs speed up", "titles", "Each emoji is a little reaction joke on top of the picture.", { curiosity: "stickers", is: "many" }, { curiosity: "laughsPerMinute", change: "rises" }, 1, { also: ["comedy"] });
  P("chapter-card-pause", "When a chapter card appears, the story stops and restarts", "titles", "A title card is a breath: the pace stops, then picks up fresh.", { curiosity: "chapterCard", is: "number and title" }, { curiosity: "pacingCurve", is: "stop and go" }, 1, { also: ["speed"] });
  P("meme-template-smash", "When the edit template is meme, the smash cuts pile up", "speed", "Meme edits live on sudden cuts to a reaction or a punchline.", { curiosity: "editTemplate", is: "meme" }, { curiosity: "comicEdit", change: "rises" }, 1, { also: ["comedy"] });
  PS("hyper-edit", "The hyper edit", "transitions", "Explosive transitions, something new every second or two, and jokes forced to land faster.", ["punchy-transitions-fast-reset", "fast-reset-more-laughs"], { also: ["speed", "comedy"] });

  // ---------- LAYERS / CANVAS ----------
  P("screen-blend-glow", "When a light layer is blended in screen mode, the room glows", "layers", "Screen mode only adds brightness, so light leaks and flares laid on top make the whole scene glow.", { curiosity: "blendMode", is: "screen" }, { curiosity: "glow", is: "room" }, 1, { also: ["light"] });
  P("cutout-new-place", "When the person is cut out, they get dropped into a new place", "layers", "Removing the background lets you put a stock clip behind them.", { curiosity: "cutout", is: "auto cutout" }, { curiosity: "stockClip", is: "background" }, 1);
  P("generated-needs-match", "When a generated shot drops into the edit, it has to be color matched", "layers", "Made-up shots never share the real footage's color, so they need grading to fit their neighbors.", { curiosity: "generatedShot", is: "video" }, { curiosity: "colorMatch", is: "matched" }, 2, { also: ["grade"] });
  P("stock-scenery-depth", "When a stock scenery clip fills the back, the frame gains depth", "layers", "A real landscape behind a cut-out person adds layers the original shot never had.", { curiosity: "stockClip", is: "scenery" }, { curiosity: "layersLens", is: "three layers" }, 1, { also: ["light"] });
  P("person-mask-narrows", "When a mask follows a person, the world shrinks to them", "layers", "Darkening or blurring everything outside the mask leaves only the one person to look at.", { curiosity: "maskShape", is: "follows a person" }, { curiosity: "focusWidth", is: "one person" }, 1, { also: ["focus"] });
  P("power-body-stakes", "When the hero's body lights up with power, the stakes rise", "layers", "A visible power-up tells the audience the big moment has arrived.", { curiosity: "bodyEffect", is: "superpower" }, { curiosity: "emotionIntensity", change: "rises" }, 1, { also: ["emotion"] });
  P("clone-burst-absurd", "When a person bursts into copies, the scene tips into absurd fun", "layers", "A sudden crowd of the same person is silly by nature.", { curiosity: "cloneEffect", is: "clone burst" }, { curiosity: "absurdity", change: "rises" }, 1, { also: ["comedy"] });
  P("aura-locks-eye", "When a person gets a glowing aura, the eye locks on them", "layers", "A bright outline around one figure marks them as the one that matters.", { curiosity: "outlineEffect", is: "aura" }, { curiosity: "fixation", change: "rises" }, 1, { also: ["focus"] });
  P("ripple-jumps-feeling", "When the picture ripples, we drop into a different feeling", "layers", "A ripple is the classic cue for a dream or memory, so the next moment can feel very different.", { curiosity: "distortionEffect", is: "ripple warp" }, { curiosity: "emoContrastPrev", is: "very different" }, 1, { also: ["emotion"] });
  P("tilted-frame-unease", "When the picture is tilted, the tension rises", "canvas", "A tilted frame tells us the world is off balance, so we feel uneasy.", { curiosity: "imageTransform", is: "tilted" }, { curiosity: "emotionIntensity", change: "rises" }, 1, { also: ["emotion"] });
  PS("put-me-somewhere-else", "Put me somewhere else", "layers", "Cut the person out, drop a scenery clip behind them, and the flat shot gains real depth.", ["cutout-new-place", "stock-scenery-depth"]);
  PS("power-up-moment", "The power-up moment", "layers", "The body lights up with power, an aura locks the eye on the hero, and the stakes climb.", ["power-body-stakes", "aura-locks-eye"], { also: ["emotion", "focus"] });

  // ---------- SUITES ----------
  S("magic-hour", "Magic hour", "light", "The short golden window at the end of the day: light that shifts as you watch, skin that glows, a few warm neighboring colors.", [
    { curiosity: "timeOfDay", value: "dusk", weight: 90 },
    { curiosity: "lightChange", value: "during the hold", weight: 70 },
    { curiosity: "skinLight", value: 4, weight: 80 },
    { curiosity: "glow", value: "person", weight: 60 },
    { curiosity: "palette", slider: "harmony", value: "neighbors", weight: 60 }]);
  S("candlelit-room", "Candlelit room", "light", "Low light from a few flames: faces glow warm, the colors stay few and close, and the light flickers on the action.", [
    { curiosity: "glow", value: "object", weight: 80 },
    { curiosity: "palette", value: "limited", weight: 60 },
    { curiosity: "skinLight", slider: "color", value: "warm", weight: 70 },
    { curiosity: "fireLight", value: "flicker", weight: 80 },
    { curiosity: "lightChange", value: "on the action", weight: 50 }]);
  S("shampoo-ad-hair", "Shampoo ad hair", "effects", "Long, glossy, dark hair lifted by a breeze and lit from behind so it shines.", [
    { curiosity: "furLength", value: "long", weight: 90 },
    { curiosity: "hairColor", value: "dark", weight: 60 },
    { curiosity: "hairShine", value: "glossy", weight: 90 },
    { curiosity: "windForce", value: 2, weight: 60 },
    { curiosity: "rim", value: "strong", weight: 70 }], { also: ["light"] });
  S("puddle-stomp", "Puddle stomp", "effects", "A boot hits a puddle in slow motion: a big splash, choppy water, everything soaked.", [
    { curiosity: "splash", value: "burst", weight: 90 },
    { curiosity: "liquidLens", slider: "surface", value: "choppy", weight: 70 },
    { curiosity: "wetness", value: "soaked", weight: 60 },
    { curiosity: "clipSpeed", value: "very slow", weight: 70 }], { also: ["speed"] });
  S("autumn-yard", "Autumn yard", "set", "Fallen leaves scattered across the ground, a light wind, a few leaves still drifting through the air.", [
    { curiosity: "scatterLens", value: 3, weight: 80 },
    { curiosity: "scatterLens", slider: "what", value: "leaves", weight: 80 },
    { curiosity: "scatter", value: 3, weight: 70 },
    { curiosity: "windForce", value: 2, weight: 50 },
    { curiosity: "bitsLens", value: "leaves", weight: 60 }], { also: ["effects"] });
  S("vlog-kit", "Vlog kit", "speed", "The everyday-life video recipe: clips that slide in and out, a date and place card, a blurred copy filling a vertical frame, a few stickers.", [
    { curiosity: "editTemplate", value: "daily life", weight: 90 },
    { curiosity: "clipAnimation", value: "in and out", weight: 60 },
    { curiosity: "chapterCard", value: "date and place", weight: 60 },
    { curiosity: "canvasFill", value: "blurred copy", weight: 70 },
    { curiosity: "stickers", value: "a few", weight: 50 }], { also: ["titles", "canvas", "transitions"] });
  S("true-to-life-grade", "True to life grade", "grade", "A clean, honest documentary color: normal brightness, neutral color, shots that match, and a recipe that just turns the camera's flat footage back to normal.", [
    { curiosity: "exposure", value: "normal", weight: 80 },
    { curiosity: "whiteBalance", value: "neutral", weight: 80 },
    { curiosity: "colorMatch", value: "matched", weight: 80 },
    { curiosity: "lut", value: "log to normal", weight: 70 },
    { curiosity: "filterFamily", value: "life", weight: 60 }]);
  S("summer-blockbuster-grade", "Summer blockbuster grade", "grade", "The big action-movie color: bright, warm skin against teal, black bars top and bottom.", [
    { curiosity: "lut", value: "teal and orange", weight: 90 },
    { curiosity: "whiteBalance", value: "warm", weight: 60 },
    { curiosity: "exposure", value: "bright", weight: 50 },
    { curiosity: "filterFamily", value: "movies", weight: 70 },
    { curiosity: "canvasFill", value: "black bars", weight: 70 }], { also: ["canvas"] });
  S("dance-video-fx", "Dance video effects", "layers", "Effects that follow a dancer: strobe flashes on the beat, glowing lines and a neon edge on the body, copies trailing behind each move.", [
    { curiosity: "partyEffect", value: "strobe pulse", weight: 80 },
    { curiosity: "bodyEffect", value: "glowing lines", weight: 70 },
    { curiosity: "outlineEffect", slider: "color", value: "neon", weight: 70 },
    { curiosity: "cloneEffect", value: "clone trail", weight: 70 },
    { curiosity: "beatSync", value: "on beats", weight: 80 }], { also: ["speed"] });
  S("green-screen-swap", "Green screen swap", "layers", "Pull the person off a green screen, put them in a new place from a stock or generated clip, and track the frame so it all moves together.", [
    { curiosity: "cutout", value: "green screen", weight: 90 },
    { curiosity: "stockClip", value: "background", weight: 70 },
    { curiosity: "generatedShot", value: "image", weight: 50 },
    { curiosity: "tracking", value: "frame follows", weight: 60 }]);
  S("light-leak-overlay", "Light leak overlay", "layers", "Warm light leaks and glows laid over the picture and blended so they only brighten it.", [
    { curiosity: "blendMode", value: "screen", weight: 90 },
    { curiosity: "lightEffect", value: "light leak", weight: 80 },
    { curiosity: "overlay", value: "full overlay", weight: 60 },
    { curiosity: "videoEffect", value: "glow", weight: 50 }]);
  S("instant-replay", "Instant replay", "speed", "The sports replay: rewind, play the moment again slower, freeze on the key frame, punch in and pull focus to the ball.", [
    { curiosity: "playDirection", value: "rewind and replay", weight: 90 },
    { curiosity: "clipSpeed", value: "slow", weight: 70 },
    { curiosity: "freezeFrame", value: "short freeze", weight: 60 },
    { curiosity: "reframe", value: "strong punch-in", weight: 50 },
    { curiosity: "editFocus", value: "pull to an object", weight: 50 }], { also: ["canvas"] });
  S("opening-titles", "Opening titles", "transitions", "A film's opening: fade up from black, an opening move on the frame, a title card, and a match cut from one shape to the next.", [
    { curiosity: "introOutro", value: "opening arc", weight: 80 },
    { curiosity: "fadeEdge", value: "fade in", weight: 60 },
    { curiosity: "chapterCard", value: "title", weight: 60 },
    { curiosity: "frameMove3D", value: "door opens", weight: 50 },
    { curiosity: "matchCut", value: "shape", weight: 60 }], { also: ["titles", "canvas"] });
  S("kaleidoscope", "Kaleidoscope", "canvas", "A mirrored picture repeated into a grid of copies that swing and rotate: trippy, dreamlike, often for music.", [
    { curiosity: "imageTransform", value: "mirrored", weight: 90 },
    { curiosity: "multiplyEffect", value: "grid", weight: 70 },
    { curiosity: "hallucinationEffect", value: "rotating swing", weight: 60 },
    { curiosity: "videoEffect", value: "mirror", weight: 60 }], { also: ["layers"] });
  S("music-video-two-stories", "Music video with a second story", "layers", "The band plays while a little second story runs in a montage, cut on the bars of the song, sometimes side by side.", [
    { curiosity: "sideStoryline", value: "a running montage", weight: 90 },
    { curiosity: "beatSync", value: "on bars", weight: 80 },
    { curiosity: "overlay", value: "split screen", weight: 50 },
    { curiosity: "jumpCut", value: "rhythmic", weight: 50 }], { also: ["speed"] });
  S("time-jump-match", "Time jump match cut", "transitions", "A cut that leaps years ahead by matching a shape or a move, with a date card to land it.", [
    { curiosity: "matchCut", value: "movement", weight: 90 },
    { curiosity: "matchCut", slider: "leap", value: "years later", weight: 80 },
    { curiosity: "chapterCard", value: "date and place", weight: 60 },
    { curiosity: "introOutro", slider: "where", value: "scene start", weight: 30 }], { also: ["titles"] });
  // ---------- Suites ----------
  S("breakneck-pace", "Breakneck pace", "structure", "Short scenes that start mid-action and cut hard, so the film never lets you catch your breath. Think chase films and fast comedies.", [
    { curiosity: "sceneRate", value: "fast", weight: 90 },
    { curiosity: "sceneLength", value: "short", weight: 80 },
    { curiosity: "sceneEntry", value: "in action", weight: 70 },
    { curiosity: "cutArticulation", value: 4, weight: 60 },
    { curiosity: "intercut", value: 6, weight: 50 }
  ]);
  S("slow-and-patient", "Slow and patient", "structure", "Long scenes that open on a wide view of the place and let one sound or image hang under everything. The audience settles in and watches closely.", [
    { curiosity: "sceneRate", value: "slow", weight: 90 },
    { curiosity: "sceneLength", value: "long", weight: 80 },
    { curiosity: "sceneEntry", value: "establishing", weight: 60 },
    { curiosity: "cutArticulation", value: 1, weight: 50 },
    { curiosity: "pedal", value: "one thing held", weight: 60 },
    { curiosity: "phraseScheme", value: "long runs", weight: 50 }
  ]);
  S("cut-like-music", "Cut like music", "structure", "Shots grouped in fours, each shot answering the last, a repeating image that rises and falls like a tune, and strong clashes between neighbours. The edit feels like a song.", [
    { curiosity: "phraseScheme", value: "fours", weight: 80 },
    { curiosity: "callResponse", value: "every cut", weight: 90 },
    { curiosity: "motifShape", value: "arch", weight: 60 },
    { curiosity: "contrastMap", value: 4, weight: 60 },
    { curiosity: "cutArticulation", slider: "style", value: "rhythmic", weight: 50 }
  ]);
  S("ensemble-patchwork", "Ensemble patchwork", "structure", "A big cast where the story hops between people, cuts between places, and shares the spotlight around the season. Think a large family drama or a workplace show.", [
    { curiosity: "povSwitch", value: "switches every scene", weight: 90 },
    { curiosity: "intercut", value: 5, weight: 70 },
    { curiosity: "featureRate", value: 5, weight: 70 },
    { curiosity: "mains", value: 4, weight: 60 }
  ]);
  S("losing-a-main", "Losing a main character", "structure", "Someone the audience has spent a lot of time with dies with little warning, and the story briefly sees the world through others. The shock lands because we knew them so well.", [
    { curiosity: "exit", value: "die", weight: 100 },
    { curiosity: "exit", slider: "warning", value: 1, weight: 60 },
    { curiosity: "featureRate", value: 8, weight: 70 },
    { curiosity: "povSwitch", value: "switches sometimes", weight: 40 },
    { curiosity: "catharsis", value: 4, weight: 60 }
  ], { also: ["emo-road"] });
  S("studio-sitcom", "Studio sitcom", "structure", "Shot with several cameras at once, cutting to whoever is talking, scenes that start on a line and a gag that keeps coming back every few scenes. The classic live-audience sitcom.", [
    { curiosity: "multicamSwitch", value: "switch on the speaker", weight: 90 },
    { curiosity: "sceneLength", value: "medium", weight: 60 },
    { curiosity: "sceneEntry", value: "on a line", weight: 70 },
    { curiosity: "callResponse", value: "sometimes", weight: 50 },
    { curiosity: "runningGag", value: 4, weight: 70 }
  ], { also: ["comedy"] });
  S("story-inside-the-story", "A story inside the story", "structure", "A play, dream or told tale runs inside the main scene, with one thing held steady across both layers and sharp contrast between them, so the inner story comments on the outer one.", [
    { curiosity: "nestedScene", value: "a scene inside a scene", weight: 100 },
    { curiosity: "povSwitch", value: "switches sometimes", weight: 50 },
    { curiosity: "contrastMap", value: 3, weight: 60 },
    { curiosity: "pedal", value: "one thing held", weight: 50 }
  ]);
  S("narrowing-in", "Narrowing in", "focus", "A character's attention shrinks until only one thing matters to them and nothing else gets through. Great for obsession, panic and heists.", [
    { curiosity: "focusShift", value: "narrowing", weight: 90 },
    { curiosity: "fixation", value: 5, weight: 80 },
    { curiosity: "distraction", value: 0, weight: 50 },
    { curiosity: "cm-focus", value: 10, weight: 60 }
  ]);
  S("slow-burn-gags", "Slow-burn gags", "comedy", "Jokes that are planted early and come back again and again, each return a little different, until the final one pays off scenes later. The audience feels clever for remembering.", [
    { curiosity: "runningGag", value: 5, weight: 90 },
    { curiosity: "callback", value: 30, weight: 80 },
    { curiosity: "payoffDistance", value: 6, weight: 70 },
    { curiosity: "comicBeat", value: "payoff lands", weight: 60 }
  ]);
  S("stranger-in-a-strange-land", "Stranger in a strange land", "comedy", "Someone badly out of place, a group that does not know what to make of them, and plenty of double takes. Think a city person on a farm or a kid at a board meeting.", [
    { curiosity: "fishOutOfWater", value: 5, weight: 100 },
    { curiosity: "oddOneOut", value: 4, weight: 70 },
    { curiosity: "comicReaction", value: "a double take", weight: 60 },
    { curiosity: "statusGap", value: "big gap", weight: 40 }
  ], { also: ["comedy-mix"] });
  S("twisting-the-familiar", "Twisting the familiar", "comedy", "Set up something the audience has seen a hundred times, lead them the wrong way, then turn it inside out. Parody and spoof live here.", [
    { curiosity: "subversion", value: 5, weight: 100 },
    { curiosity: "misdirection", value: 4, weight: 70 },
    { curiosity: "callback", slider: "form", value: "same words, new meaning", weight: 50 },
    { curiosity: "ruleOfThree", value: 3, weight: 60 }
  ]);
  S("coming-apart", "Coming apart", "archetype", "A character under stress slides toward their worst self: the old hurt gets pressed, they slip into old habits, and their goal moves further away.", [
    { curiosity: "cm-health", value: 7, weight: 90 },
    { curiosity: "relapse", value: 4, weight: 80 },
    { curiosity: "wound", value: 5, weight: 70 },
    { curiosity: "plotProgress", value: "setback", weight: 60 }
  ], { also: ["arc", "plot"] });
  S("mentor-at-their-best", "Mentor at their best", "arc", "A healthy, steady guide who cares about the bigger picture and knowingly helps the hero grow. Think the wise coach or the kind teacher.", [
    { curiosity: "cm-role", value: "mentor", weight: 100 },
    { curiosity: "cm-role", slider: "awareness", value: "deliberate", weight: 50 },
    { curiosity: "cm-health", value: 2, weight: 70 },
    { curiosity: "perspectiveWidth", value: "world", weight: 60 }
  ], { also: ["archetype", "mindset"] });
  S("trickster-stirs-the-pot", "Trickster stirs the pot", "comedy-mix", "One mischief-maker keeps changing who sides with whom, so loyalties flip and nobody knows the whole story.", [
    { curiosity: "cm-role", value: "trickster", weight: 90 },
    { curiosity: "alliances", value: 4, weight: 90 },
    { curiosity: "chaosInRoom", value: "one chaos character", weight: 60 },
    { curiosity: "whoKnows", value: "half the room", weight: 50 }
  ], { also: ["arc"] });
  S("shifting-loyalties", "Shifting loyalties", "comedy-mix", "Sides keep changing as people fight over who is right, and somebody always ends up standing alone. Farce and office comedy run on this.", [
    { curiosity: "alliances", value: 5, weight: 100 },
    { curiosity: "egoClash", value: 3, weight: 70 },
    { curiosity: "dissenter", value: "speaks up", weight: 50 },
    { curiosity: "whoKnows", value: "all but one", weight: 50 }
  ]);
  S("whodunit-hook", "Whodunit hook", "plot", "The audience is holding a 'who did it' question, the character learns things before we do, and every lead seems to fall apart. Mystery and detective stories.", [
    { curiosity: "openQuestions", value: 4, weight: 90 },
    { curiosity: "openQuestions", slider: "kind", value: "who did it", weight: 70 },
    { curiosity: "knowledgeGap", value: "character first", weight: 60 },
    { curiosity: "plotSecret", value: "safe", weight: 50 },
    { curiosity: "plotProgress", value: "setback", weight: 40 }
  ]);
  S("earned-release", "Earned release", "emo-road", "A feeling held in for a long time, tied to an old hurt that finally comes out, breaks free in tears or laughter. The big cry at the end of the film.", [
    { curiosity: "catharsis", value: 5, weight: 100 },
    { curiosity: "emotionalDebt", value: 5, weight: 80 },
    { curiosity: "emoRelease", value: "tears", weight: 70 },
    { curiosity: "wound", slider: "revealed", value: "late", weight: 60 }
  ], { also: ["arc", "emotion"] });
  S("two-steps-forward", "Two steps forward, one back", "plot", "Just as the character seems to make progress, they slip back into an old habit, then claw forward again. Keeps a growth story from feeling too easy.", [
    { curiosity: "plotProgress", value: "big setback", weight: 80 },
    { curiosity: "relapse", value: 3, weight: 80 },
    { curiosity: "arcStage", value: "doubt", weight: 60 },
    { curiosity: "openQuestions", value: 3, weight: 40 }
  ], { also: ["arc"] });

  // ---------- Proximities ----------
  P("faster-scenes-more-tension", "When scenes start changing faster, the tension climbs", "structure", "Quick scene changes give the audience less time to settle, so they lean in and feel the pressure rise.", { curiosity: "sceneRate", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 3);
  P("tension-shortens-scenes", "When tension climbs, scenes get shorter", "structure", "As things get tense, writers cut scenes down to just the important moment. Shorter scenes then make the tension feel even tighter.", { curiosity: "tensionCurve", change: "rises" }, { curiosity: "sceneLength", change: "drops" }, 2);
  P("clock-speeds-scenes", "When the clock gets tight, the scenes speed up", "plot", "A deadline makes every scene feel like it's stealing time, so the film jumps from place to place faster.", { curiosity: "tickingClock", is: "tight" }, { curiosity: "sceneRate", change: "rises" }, 2, { also: ["structure"] });
  P("two-groups-cross-cut", "When the hour splits into two groups, the film cuts back and forth between them", "structure", "Two groups doing different things at the same time invites cross-cutting, which lets each storyline comment on the other.", { curiosity: "groups", is: "2" }, { curiosity: "intercut", change: "rises" }, 2);
  P("cross-cutting-tightens-clock", "When the film cuts between two places faster and faster, the clock feels tighter", "structure", "Speeding up the back-and-forth between two places is the classic way to make a race against time feel urgent.", { curiosity: "intercut", change: "rises" }, { curiosity: "tickingClock", is: "tight" }, 3, { also: ["plot"] });
  P("in-action-raises-questions", "When a scene starts in the middle of the action, the audience starts asking questions", "structure", "Dropping in mid-action skips the setup, so viewers immediately wonder who these people are and how they got here. That curiosity pulls them forward.", { curiosity: "sceneEntry", is: "in action" }, { curiosity: "openQuestions", change: "rises" }, 1, { also: ["plot"] });
  P("answering-shots-faster-laughs", "When every shot answers the one before, laughs come faster", "structure", "Cutting like a back-and-forth conversation (a line, then the reaction, then the comeback) keeps the rhythm snappy, and snappy rhythm gets laughs.", { curiosity: "callResponse", is: "every cut" }, { curiosity: "laughsPerMinute", change: "rises" }, 2, { also: ["comedy"] });
  P("threes-land-the-joke", "When shots come in threes, the third one becomes the punchline", "structure", "Two shots set a pattern and the third breaks it. Audiences expect the break, so the third shot is the perfect place for the joke.", { curiosity: "phraseScheme", is: "threes" }, { curiosity: "comicBeat", is: "payoff lands" }, 1, { also: ["comedy"] });
  P("repeat-becomes-gag", "When the same moment keeps repeating, it turns into a running gag", "structure", "Show something once and it's a detail. Show it three or four times and the audience starts waiting for it, which makes it a joke.", { curiosity: "repetition", change: "rises" }, { curiosity: "runningGag", change: "rises" }, 4, { also: ["comedy"] });
  P("signature-image-brings-feeling", "When the film's signature image comes back, the old feeling comes back with it", "structure", "A strong image that the film keeps returning to carries the feeling from its first appearance, so each return hits harder.", { curiosity: "hook", is: "yes" }, { curiosity: "feelingEcho", change: "rises" }, 8, { also: ["emo-road"] });
  P("clash-flips-feeling", "When scenes are built to clash, the feeling flips at the cut", "structure", "Putting a loud scene next to a quiet one, or a happy one next to a sad one, makes the audience feel the switch in their gut.", { curiosity: "contrastMap", change: "rises" }, { curiosity: "emoContrastPrev", is: "the opposite" }, 1, { also: ["emotion"] });
  P("held-thing-builds-dread", "When one sound or image is held under everything, dread builds", "structure", "A hum that never stops, a light that never changes: something constant under the scene makes the audience wait for it to break.", { curiosity: "pedal", is: "one thing held" }, { curiosity: "dread", change: "rises" }, 4, { also: ["emo-road"] });
  P("fake-scare-relief-laugh", "When a scare turns out to be fake, the audience laughs with relief", "structure", "The cat jumps out of the cupboard instead of the monster. The built-up fear escapes as a laugh, which also lowers their guard for the real scare later.", { curiosity: "psychOut", is: "psych-out" }, { curiosity: "emoRoadFilm", slider: "relief", change: "rises" }, 1, { also: ["emo-road"] });
  P("sharp-cuts-jump-energy", "When the cuts get louder and sharper, the energy jumps", "structure", "Cuts the audience can feel, like a jolt on a loud sound, give the scene a kick of energy.", { curiosity: "cutArticulation", change: "rises" }, { curiosity: "energyArc", change: "rises" }, 1);
  P("nosy-camera-more-cringe", "When the camera feels like a nosy person in the room, awkward moments get more awkward", "structure", "A handheld camera that wobbles and zooms in on people like a documentary makes us feel we're intruding, so embarrassing moments become painfully funny. Think mockumentary sitcoms.", { curiosity: "operatorFeel", change: "rises" }, { curiosity: "cringe", change: "rises" }, 2, { also: ["comedy"] });
  P("rising-motif-lifts-hope", "When a repeating tune or image keeps climbing, hope climbs with it", "structure", "A motif that goes up each time it returns tells the audience, without words, that things are getting better.", { curiosity: "motifShape", is: "rises" }, { curiosity: "hope", change: "rises" }, 3, { also: ["emo-road"] });
  P("hopping-pov-audience-first", "When the story hops between characters, the audience learns things before they do", "structure", "Seeing several people's sides means we know what one character is hiding from another, which sets up both suspense and comedy.", { curiosity: "povSwitch", is: "switches every scene" }, { curiosity: "knowledgeGap", is: "audience first" }, 2, { also: ["plot"] });
  P("knowing-first-brings-dread", "When the audience knows first, every calm moment fills with dread", "plot", "If we know the bomb is under the table, a friendly chat becomes nerve-racking. Knowing more than the characters turns waiting into suspense.", { curiosity: "knowledgeGap", is: "audience first" }, { curiosity: "dread", change: "rises" }, 2, { also: ["emo-road"] });
  P("dread-narrows-focus", "When dread builds, a character's attention starts narrowing", "emo-road", "Fear shrinks the world. As dread grows, the character (and the camera) stops looking around and locks onto the danger.", { curiosity: "dread", change: "rises" }, { curiosity: "focusShift", is: "narrowing" }, 2, { also: ["focus"] });
  P("narrowing-to-fixation", "When attention starts narrowing, it hardens into a fixation", "focus", "Once the character's world shrinks, one thing grabs hold and won't let go. That fixation drives their next choices.", { curiosity: "focusShift", is: "narrowing" }, { curiosity: "fixation", change: "rises" }, 2);
  P("more-screen-time-heavier-plot", "When a main character shows up more often, their own story gets heavier", "structure", "The more episodes someone is in, the more the audience cares, so writers give them bigger personal stakes.", { curiosity: "featureRate", change: "rises" }, { curiosity: "plotWeight", change: "rises" }, 4, { also: ["plot"] });
  P("heavy-side-story-joins-main", "When a side story grows heavy enough, it gets pulled into the main plot", "plot", "A personal story that keeps growing eventually collides with the main story. That collision is often where the season's big turn lives.", { curiosity: "plotWeight", change: "rises" }, { curiosity: "plotTouch", is: "joined" }, 4);
  P("joined-plots-raise-stakes", "When a side story merges into the main plot, the stakes jump", "plot", "Once a character's personal problem is tied to the main problem, failing means losing both, so everything matters more.", { curiosity: "plotTouch", is: "joined" }, { curiosity: "stakes", change: "rises" }, 2, { also: ["emo-road"] });
  P("more-mains-stories-cross", "When more main characters share the spotlight, their stories start crossing", "structure", "With three or four leads, their separate stories naturally bump into each other, and those crossings make the best scenes.", { curiosity: "mains", change: "rises" }, { curiosity: "plotTouch", is: "crossing" }, 3, { also: ["plot"] });
  P("death-brings-tears", "When a main character dies, the tears come soon after", "structure", "A death gives the other characters (and the audience) permission to finally let out what they were holding in.", { curiosity: "exit", is: "die" }, { curiosity: "emoRelease", is: "tears" }, 3, { also: ["emotion"] });
  P("inner-scene-raises-doubt", "When a scene plays out inside another scene, the audience starts doubting what's real", "structure", "A dream inside a dream or a play inside the film makes viewers ask which layer they're watching, which keeps them alert.", { curiosity: "nestedScene", is: "a scene inside a scene" }, { curiosity: "openQuestions", change: "rises" }, 2, { also: ["plot"] });
  P("short-shots-more-energy", "When the shots get short, the energy climbs", "structure", "Quick shots mean the eye keeps working to catch up, which feels like speed and excitement.", { curiosity: "shotOrderLens", is: "short" }, { curiosity: "energyArc", change: "rises" }, 1);
  P("captions-show-inner-voice", "When words move from speech balloons into captions, we hear what the character is really thinking", "page", "Captions often carry a character's private thoughts, so the reader learns things the other characters don't know.", { curiosity: "balloon", is: "caption" }, { curiosity: "knowledgeGap", is: "audience first" }, 1, { also: ["plot"] });
  P("broken-frame-energy", "When a picture breaks out of its panel, the page bursts with energy", "page", "Art spilling past the panel border feels too big to be contained, so the moment reads as loud and exciting.", { curiosity: "panelBreak", is: "splash" }, { curiosity: "energyArc", change: "rises" }, 1, { also: ["structure"] });
  P("fewer-words-bigger-pictures", "When the words thin out, the pictures get bigger", "page", "Fewer words free up room on the page, and artists use it for big, quiet panels that let a moment breathe.", { curiosity: "textDensity", change: "drops" }, { curiosity: "panelSize", change: "rises" }, 1);
  P("splash-big-sound", "When a picture fills the whole page, the sound effects grow as big as the page", "page", "A full-page picture is the comic's big moment, and big moments get big sound lettering, like a giant BOOM.", { curiosity: "panelSize", is: "splash" }, { curiosity: "soundLettering", is: "page-sized" }, 1);
  P("big-sound-breaks-frame", "When a sound effect fills the page, the picture bursts out of its frame", "page", "A huge sound effect pushes past panel borders, and the art follows it out, so the noise feels physically big.", { curiosity: "soundLettering", is: "page-sized" }, { curiosity: "panelBreak", is: "edge" }, 1);
  P("spark-turns-plot", "When a character becomes the spark in a scene, the plot takes a turn", "arc", "A catalyst is someone who stirs things up. Once they start pushing, the story can't stay where it was.", { curiosity: "dramaticRole", is: "catalyst" }, { curiosity: "mixPlot", is: "a turn" }, 2, { also: ["comedy-mix"] });
  P("foil-shows-flaw", "When someone is set up as the lead's opposite, the lead's flaw becomes obvious", "arc", "A foil is a character who is everything the lead is not. Next to them, the lead's vanity or cowardice sticks out, which is great for comedy.", { curiosity: "cm-role", is: "foil" }, { curiosity: "comicFlaw", slider: "size", change: "rises" }, 3, { also: ["comedy"] });
  P("wider-care-want-meets-need", "When a character starts caring about the whole world, what they want lines up with what they need", "mindset", "Selfish wants often clash with what a person really needs. Seeing the bigger picture lets the two finally match.", { curiosity: "perspectiveWidth", is: "world" }, { curiosity: "plotWant", is: "close" }, 4, { also: ["plot"] });
  P("want-against-need-resists", "When what they want is the opposite of what they need, they fight the change", "plot", "A character chasing the wrong thing will push back hard against anything that tries to change them. That push-back creates both drama and laughs.", { curiosity: "plotWant", is: "opposite" }, { curiosity: "resistance", change: "rises" }, 3, { also: ["arc"] });
  P("aligned-want-big-choice", "When what they want finally lines up with what they need, they act on what they believe", "plot", "Once the inner fight settles, the character stops hinting and makes a real choice the audience can see.", { curiosity: "plotWant", is: "close" }, { curiosity: "beliefShown", is: "a big choice" }, 3, { also: ["mindset"] });
  P("big-choice-brings-change", "When a belief turns into a big choice, the character changes", "mindset", "Saying you believe something is cheap. Doing something big about it is the moment a character actually changes.", { curiosity: "beliefShown", is: "a big choice" }, { curiosity: "arcStage", is: "change" }, 2, { also: ["arc"] });
  P("growing-change-shows", "When a character is growing, the change starts to show on the outside", "arc", "Growth shows up in posture, clothes or a new habit, so the audience can see it without being told.", { curiosity: "arcDirection", is: "grows" }, { curiosity: "changeShows", change: "rises" }, 4);
  P("falling-slips-back", "When a character is falling, they slip back into old habits", "arc", "A downward arc is full of relapses: the drink, the lie, the old friend who's bad news.", { curiosity: "arcDirection", is: "falls" }, { curiosity: "relapse", change: "rises" }, 3);
  P("challenger-sparks-ego-clash", "When a Challenger personality is in the room, fights over who's in charge flare up", "archetype", "Enneagram type 8, the Challenger, needs to be in control, so anyone else who wants the lead will clash with them, often comically.", { curiosity: "enneagramType", is: "8 Challenger" }, { curiosity: "egoClash", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("one-voice-more-pressure", "When one loud voice leads the group, the pressure to agree builds", "herd", "Once a single person sets the tone, everyone else feels watched, and saying no gets harder.", { curiosity: "herdLeader", is: "one voice" }, { curiosity: "groupPressure", change: "rises" }, 2);
  P("tight-focus-misses-warning", "When a character's attention shrinks to one thing, they miss the warning", "focus", "Staring at one thing means not seeing the rest, which sets up a nasty surprise or a big comic fall.", { curiosity: "focusWidth", is: "one thing" }, { curiosity: "distraction", slider: "missed", is: "a warning" }, 2);
  P("breaking-voice-tears", "When the voice breaks, the tears come", "emotion", "A crack in the voice is the last thing holding back the feeling. Once it goes, the tears follow fast.", { curiosity: "emoVoice", slider: "crack", is: "breaks" }, { curiosity: "emoRelease", is: "tears" }, 1);
  P("clenched-hands-bigger-action", "When the hands clench, a bigger action follows", "emotion", "Clenched hands are anger or fear being held in. It's a warning to the audience that something is about to be thrown, grabbed or slammed.", { curiosity: "emoHands", is: "clench" }, { curiosity: "emoActions", change: "rises" }, 2);
  P("big-actions-voice-gives", "When the actions get bigger, the voice gives way", "emotion", "After slamming the door or throwing the cup, the body has nothing left to hide behind, and the voice starts to crack.", { curiosity: "emoActions", change: "rises" }, { curiosity: "emoVoice", slider: "crack", is: "breaks" }, 2);
  P("freeze-slow-burn", "When someone freezes, a slow-burn reaction follows", "emotion", "A character going completely still after bad news gives the audience time to anticipate, then their slowly building reaction gets the laugh.", { curiosity: "emoMove", is: "frozen" }, { curiosity: "comicReaction", is: "a slow burn" }, 1, { also: ["comedy"] });
  P("misunderstanding-deepens", "When the joke is built on a misunderstanding, the confusion keeps getting deeper", "comedy", "Each person acts on the wrong idea, and every action makes the mix-up harder to undo. That's the engine of farce.", { curiosity: "comedyDevice", is: "misunderstanding" }, { curiosity: "misunderstanding", change: "rises" }, 3);
  P("punching-up-bigger-laughs", "When the joke aims at the powerful, the audience laughs harder", "comedy", "Mocking the boss or the king feels fair and freeing. Mocking someone weak can make the audience go quiet instead.", { curiosity: "comedyTopic", slider: "punch", is: "the powerful" }, { curiosity: "laughsPerMinute", change: "rises" }, 1);
  P("cartoon-bigger-falls", "When the comedy goes cartoon-big, the falls get bigger", "comedy", "In a cartoon-style world people can crash through walls and get up again, so physical comedy grows from fumbles to stunts.", { curiosity: "comicRegister", is: "cartoon" }, { curiosity: "physicalComedy", change: "rises" }, 2);
  P("far-payoff-big-laugh", "When the payoff comes long after its setup, the laugh is bigger", "comedy", "If the audience has nearly forgotten the setup, the payoff feels like a surprise gift and gets a bigger laugh.", { curiosity: "payoffDistance", change: "rises" }, { curiosity: "laughsPerMinute", slider: "size", is: "big laughs" }, 8);
  P("straight-one-stays-calm", "When the joke rests on the straight one, they stay perfectly calm", "comedy", "The serious character gets laughs by not reacting to the madness around them. Their calm makes the silliness look even sillier.", { curiosity: "jokeCarrier", is: "the straight one" }, { curiosity: "straightMan", is: "unmoved" }, 1, { also: ["comedy-mix"] });
  P("calm-one-cracks-big-laugh", "When the calm one finally loses it, the biggest laugh lands", "comedy-mix", "After scenes of keeping it together, the straight one snapping is a release the audience has been waiting for.", { curiosity: "straightMan", is: "loses it" }, { curiosity: "laughsPerMinute", slider: "size", is: "big laughs" }, 1, { also: ["comedy"] });
  P("comeback-wobbles-rank", "When someone lands a sharp comeback, the pecking order wobbles", "comedy", "A good comeback from the underdog briefly knocks the top dog down a peg, and the audience loves it.", { curiosity: "wordplay", is: "comeback" }, { curiosity: "statusGap", slider: "flip", is: "a wobble" }, 1, { also: ["comedy-mix"] });
  P("shrugged-disaster-pause", "When a disaster is treated as no big deal, the laugh comes in the pause", "comedy", "Understatement works best with a beat of silence before or after the line, so the audience can feel the gap between the problem and the reaction.", { curiosity: "understatement", is: "huge treated as tiny" }, { curiosity: "comicTiming", change: "rises" }, 1);
  P("out-of-place-more-cringe", "When someone is badly out of place, the awkward moments pile up", "comedy", "A person who doesn't know the rules keeps breaking them, and each mistake makes the room more uncomfortable.", { curiosity: "fishOutOfWater", change: "rises" }, { curiosity: "cringe", change: "rises" }, 2);
  P("more-sight-gags-faster-laughs", "When more sight gags fill the frame, the laughs come faster", "comedy", "Jokes hidden in the background add laughs without slowing the story, and reward people for watching closely.", { curiosity: "visualGag", slider: "count", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 2);
  P("familiar-setup-flipped", "When the setup feels very familiar, the payoff gets turned upside down", "comedy", "The more the audience thinks they know what's coming, the more fun it is to give them the opposite.", { curiosity: "subversion", change: "rises" }, { curiosity: "comicBeat", slider: "twist", is: "turned upside down" }, 2);
  P("clear-premise-escalates", "When the comic idea is crystal clear, the scene can push it further and further", "comedy", "Once the audience gets the funny idea, every step bigger is easy to follow, so the writer can keep raising it.", { curiosity: "comicPremise", change: "rises" }, { curiosity: "comicEscalation", change: "rises" }, 3);
  P("escalation-exaggerates", "When the situation keeps escalating, everything gets exaggerated", "comedy", "As the mess grows, reactions, props and descriptions all get bigger to keep up.", { curiosity: "comicEscalation", change: "rises" }, { curiosity: "exaggeration", change: "rises" }, 2);
  P("exaggeration-to-absurd", "When things get exaggerated far enough, they tip into the absurd", "comedy", "Push a reaction or a problem big enough and it stops being realistic and becomes absurd, which is its own kind of funny.", { curiosity: "exaggeration", change: "rises" }, { curiosity: "absurdity", change: "rises" }, 2);
  P("cutaway-contradicts-on-cut", "When a cutaway shows the opposite of what was just said, the laugh lands on the cut", "comedy", "'I'm great at camping.' Cut to them tangled in a tent. The edit itself delivers the punchline.", { curiosity: "cutawayGag", slider: "kind", is: "a contradiction" }, { curiosity: "comicTiming", slider: "onCut", is: "on the cut" }, 1);
  P("faster-volley-more-spark", "When a comic pair trades lines faster, the spark between them grows", "comedy-mix", "Quick back-and-forth shows two people who are always in tune, and the audience feels their chemistry.", { curiosity: "doubleAct", slider: "volley", change: "rises" }, { curiosity: "chemistry", change: "rises" }, 2);

  // ---------- Proximity suites ----------
  PS("the-squeeze", "The squeeze", "structure", "Two groups, faster cross-cutting, a tighter clock, quicker scenes, rising tension and shorter scenes again. The classic way a finale speeds up.", ["two-groups-cross-cut", "cross-cutting-tightens-clock", "clock-speeds-scenes", "faster-scenes-more-tension", "tension-shortens-scenes"]);
  PS("loud-page", "The loud page", "page", "Fewer words make room for bigger pictures, a full-page picture gets a giant sound effect, and the sound bursts the frame.", ["fewer-words-bigger-pictures", "splash-big-sound", "big-sound-breaks-frame", "broken-frame-energy"]);
  PS("knowing-too-much", "Knowing too much", "plot", "Hopping between characters lets us know first, knowing first fills calm moments with dread, and dread narrows a character's attention into a fixation.", ["hopping-pov-audience-first", "knowing-first-brings-dread", "dread-narrows-focus", "narrowing-to-fixation"]);
  PS("cartoon-spiral", "The cartoon spiral", "comedy", "A clear comic idea gets pushed further, everything gets exaggerated, and it tips into the absurd.", ["clear-premise-escalates", "escalation-exaggerates", "exaggeration-to-absurd"]);
  PS("the-calm-one-cracks", "The calm one cracks", "comedy", "The straight one stays calm while disasters get shrugged off, until they finally lose it for the biggest laugh.", ["straight-one-stays-calm", "shrugged-disaster-pause", "calm-one-cracks-big-laugh"]);
  PS("growing-up", "Growing up", "mindset", "Caring wider lines up want and need, they act on their belief, the choice changes them, and the change shows.", ["wider-care-want-meets-need", "aligned-want-big-choice", "big-choice-brings-change", "growing-change-shows"]);
  PS("holding-it-in-until", "Holding it in, until", "emotion", "Clenched hands lead to bigger actions, the actions make the voice crack, and the crack brings the tears.", ["clenched-hands-bigger-action", "big-actions-voice-gives", "breaking-voice-tears"]);
  PS("side-story-takes-over", "The side story takes over", "plot", "More screen time makes a character's own story heavier, it gets pulled into the main plot, and the stakes jump.", ["more-screen-time-heavier-plot", "heavy-side-story-joins-main", "joined-plots-raise-stakes"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
