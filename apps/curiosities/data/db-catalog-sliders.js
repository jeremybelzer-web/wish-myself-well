/* Extra sliders for the catalog's curiosities, so each one has at least three graded, automatable parts of
   its own (its setting, these, and Amount). Merged into the rows db-catalog.js made, by id. */
(function (DB) {
  const X = (id, ...sliders) => DB.curiosity({ id, sliders });
  const R = (id, label, min, max, plain, unit) => [id, label, [min, max, unit || ""], plain];
  const L = (id, label, scale, plain) => [id, label, scale, plain];
  const NOTICE = L("noticeable", "How noticeable", ["invisible", "subtle", "clear", "showy"], "Whether the audience should notice this choice or feel it without seeing it.");
  const CHANGE = (what) => L("change", "How it changes", ["holds", "drifts", "steps", "snaps"], `How ${what} moves to a new setting: holds still, drifts, steps, or snaps.`);
  const SPAN = (what) => R("span", "Hold length", 1, 16, `How many panels ${what} holds before it changes.`, "panels");

  /* Camera angle */
  X("shotSize", R("headroom", "Space above the head", 0, 5, "How much room is left above the head."), R("breathing", "Room to look into", 0, 5, "How much space is left in the direction the person faces."), CHANGE("the frame size"));
  X("angleHeight", R("degrees", "Steepness", 0, 90, "How steeply the camera looks up or down.", "degrees"), CHANGE("the height"), NOTICE);
  X("lensLength", R("mm", "Focal length", 14, 200, "The exact lens, in millimeters.", "mm"), L("distortion", "Distortion", ["none", "slight", "strong", "fisheye"], "How much a wide lens bends straight lines."));
  X("dutch", R("degrees", "Tilt", 0, 45, "How far the horizon tilts.", "degrees"), L("side", "Which way", ["left", "either", "right"], "Which way the frame leans."), CHANGE("the tilt"));
  X("pov", R("share", "Share of shots", 0, 100, "How many shots are seen through someone's eyes.", "%"), L("honesty", "Trust the eyes", ["true", "biased", "lying"], "Whether the point of view shows the truth or the person's bent version of it."));
  X("angleCount", L("reuse", "Return to setups", ["never", "sometimes", "always"], "How often the scene goes back to an angle it already used."), R("variety", "How different the setups are", 0, 5, "From near-identical angles to wildly different ones."));
  X("angleFamily", L("purity", "Strict or mixed", ["mixed", "mostly", "strict"], "Whether the scene keeps to one cutting pattern or mixes them."), NOTICE);
  X("angleChange", R("lead", "Cut early or late", -4, 4, "Beats the cut comes before (negative) or after (positive) the line or action.", "beats"), NOTICE);
  X("angleToLine", R("strength", "How strongly", 0, 5, "How strongly the shot follows or fights the line."), R("share", "Lines matched", 0, 100, "How many lines get a matched shot.", "%"));
  X("angleToAction", R("strength", "How strongly", 0, 5, "How strongly the shot follows or fights the action."), R("share", "Actions matched", 0, 100, "How many actions get a matched shot.", "%"));
  X("cutRate", R("perMinute", "Cuts per minute", 1, 60, "The exact rate.", "per minute"), L("trend", "Speeding or slowing", ["slowing", "steady", "speeding up"], "Whether the cutting accelerates through the scene."));
  X("shotDuration", R("seconds", "Seconds", 0.5, 60, "The exact hold.", "seconds"), L("variety", "Even or varied", ["all the same", "some variety", "wildly varied"], "Whether every shot lasts about as long, or lengths swing."));
  X("depthOfField", R("fstop", "F-stop", 1.4, 22, "The lens opening; low numbers blur the background.", "f"), L("subject", "What stays sharp", ["one eye", "a face", "two people", "the room"], "How much of the scene is in focus."));
  X("rackFocus", R("speed", "Pull speed", 0, 5, "How fast the focus moves."), R("count", "Pulls per scene", 0, 8, "How many times the focus moves."));
  X("motionBlur", R("shutter", "Shutter angle", 45, 360, "Low is crisp and choppy, high is smeary.", "degrees"), NOTICE);
  X("aspect", L("letterbox", "Bars", ["none", "thin", "thick"], "Black bars above and below or at the sides."), CHANGE("the frame shape"));
  X("composition", R("balance", "Balance", -5, 5, "Weight to the left (negative) or right (positive) of the frame."), L("leading", "Lines lead the eye", ["none", "some", "strong"], "Whether lines in the set point at the subject."), L("frameInFrame", "Frame within the frame", ["none", "partial", "full"], "A door or window that frames the subject again."));
  X("emptySpace", R("percent", "Share empty", 0, 100, "Exact share of the frame with nothing in it.", "%"), L("where", "Where the emptiness is", ["above", "beside", "behind", "all around"], "Which part of the frame is empty."));

  /* Camera motion */
  X("cameraCarry", R("wobble", "Wobble", 0, 5, "For handheld, how much the frame shakes."), R("drift", "Drift", 0, 5, "For locked or smooth, how much it creeps anyway."));
  X("cameraMove", R("distance", "Distance", 0, 5, "How far the move travels."), L("start", "Start", ["from rest", "already moving"], "Whether the move starts still or is under way when the shot begins."), L("end", "End", ["settles", "stops hard", "still moving"], "How the move ends."));
  X("moveSpeed", L("easing", "Easing", ["even", "eases in", "eases out", "eases both"], "Whether the move starts or ends gently."), CHANGE("the speed"));
  X("moveFollows", R("tightness", "How tightly", 0, 5, "From loosely keeping up to locked on."), R("lead", "Leads or lags", -3, 3, "Whether the camera arrives before the subject (positive) or trails it (negative).", "beats"));
  X("moveOn", R("delay", "Delay after the cue", 0, 4, "Beats between the cue and the move.", "beats"), NOTICE);
  X("cameraOwner", R("freedom", "Player freedom", 0, 5, "How much the player can steer the camera."), L("handoff", "Handing over", ["never", "sometimes", "often"], "How often control passes between player and author."));
  X("moveToVolume", R("strength", "How strongly", 0, 5, "How much the loudness moves the camera."), R("delay", "Delay", 0, 3, "Beats between the sound and the move.", "beats"));
  X("moveTemper", CHANGE("the temper"), NOTICE);
  X("cameraShake", R("frequency", "Shake speed", 0, 5, "A slow sway to a fast rattle."), L("cause", "Cause", ["the operator", "an impact", "an engine", "the ground"], "What the shake seems to come from."));
  X("speedRamp", R("factor", "Speed", 0.25, 4, "How fast time runs.", "x"), L("ramp", "Ramp shape", ["sudden", "eased", "long ramp"], "How quickly the speed changes."));

  /* Character motion and placement */
  X("characterPath", R("length", "Distance", 0, 5, "How far they travel."), L("purpose", "Purpose", ["wandering", "going somewhere", "fleeing", "chasing"], "Why they move."), L("smoothness", "Smooth or broken", ["smooth", "stops and starts", "erratic"], "Whether the path is one movement or many."));
  X("characterSpeed", L("easing", "Accelerates", ["steady", "speeds up", "slows down"], "How the speed changes along the path."), CHANGE("the speed"));
  X("characterToLens", R("distance", "How near they get", 0, 5, "From far away to filling the lens."), R("angle", "Angle of approach", 0, 90, "Straight at the lens (0) to fully across (90).", "degrees"));
  X("whoMoves", R("share", "Share of lines with movement", 0, 100, "How many lines have someone moving.", "%"), NOTICE);
  X("bodyEnter", L("side", "Which side", ["left", "right", "top", "bottom", "toward the lens"], "Where they come in or go out."), L("speed", "How", ["slips in", "walks in", "bursts in"], "How the entrance or exit is played."));
  X("objectKind", R("size", "Size", 0, 5, "From a coin to a truck."), R("importance", "Importance", 0, 5, "From set dressing to the center of the scene."));
  X("objectPath", R("distance", "Distance", 0, 5, "How far it travels."), L("control", "Who moves it", ["gravity", "a person", "a machine", "nobody knows"], "What moves the object."));
  X("objectSpeed", L("easing", "Accelerates", ["steady", "speeds up", "slows down"], "How the object's speed changes."), CHANGE("the speed"));
  X("objectEnter", L("side", "Which side", ["left", "right", "top", "bottom", "toward the lens"], "Where it comes in."), NOTICE);
  X("peopleCount", R("background", "Extras", 0, 50, "People in the background as well.", "people"), L("density", "Spread or packed", ["spread out", "normal", "packed"], "How close together they stand."));
  X("blocking", R("distance", "Distance between them", 0, 5, "From touching to across the room."), CHANGE("the arrangement"), L("power", "Who holds the center", ["no one", "the speaker", "the listener", "the one who wins"], "Who stands in the strongest place."));
  X("eyeline", R("hold", "How long a look lasts", 0, 5, "From a flick to a stare.", "seconds"), L("avoid", "Avoiding", ["nobody", "one avoids", "both avoid"], "Whether someone refuses to look."));
  /* Who is talking now, one lane per character track: the others turn to look at whoever is speaking (rig/staging.js). */
  X("eyeline", L("speaking", "Speaking now", ["listening", "speaking"], "Whether this character is the one talking at this moment. Everyone else looks at them."));
  /* The 3D staging on lanes (rig/staging.js follows them on the Screen; rig/scene.js keys them when a beat is put on
     the timeline). "The first character" is the top character track on the timeline, "the second" the next one. */
  const WHO = ["the first character", "the second character", "the third character", "the fourth character"];
  X("blocking", ["together", "How they stand together", ["face to face", "side by side", "one behind the other", "over the shoulder", "circle", "standoff", "huddle"], "Where everyone stands, all at once. The 3D view puts them on their marks when the playhead gets there.", { unordered: true }]);
  X("blocking", L("seated", "Sitting or standing", ["standing", "sitting"], "Whether this character sits down (on a seat of the set) or stands."));
  X("characterPath", ["to", "Walks to", ["stays put"].concat(WHO, ["the middle", "the front", "the back"]), "Where this character walks when the playhead gets here: to another character (stopping at talking distance, facing them), the middle, the front near the camera, or back. Characters count from the top character track.", { unordered: true }]);
  X("shotSize", ["who", "Who it frames", ["whoever is shown"].concat(WHO), "Whose face and body a close-up or medium shot is on. Characters count from the top character track; a wide shot keeps everyone.", { unordered: true }]);
  X("focus", R("speed", "How fast it moves", 0, 5, "How quickly attention passes between things."), NOTICE);
  X("look", R("care", "Care in the look", 0, 5, "How much attention went into hair, makeup and clothes."), CHANGE("the look"));
  X("foreshortening", R("distance", "How near the lens", 0, 5, "How close the near hand or object comes to the lens."), NOTICE);

  /* Lines & delivery */
  X("volume", L("trend", "Building or falling", ["falling", "steady", "building"], "Whether the lines get louder or quieter through the scene."), R("spread", "Gap between voices", 0, 5, "How different the loudness of the speakers is."));
  X("dynamicRange", R("db", "Range", 0, 30, "The gap from the quietest to the loudest line.", "dB"), NOTICE);
  X("rangeChanges", R("size", "Size of the change", 0, 5, "How big each change is."), NOTICE);
  X("pace", R("wpm", "Words per minute", 80, 220, "The exact speed of talk.", "words per minute"), L("overlap", "Overlap", ["clean turns", "some overlap", "talking over each other"], "Whether speakers wait their turn."));
  X("silence", R("seconds", "Seconds", 0, 20, "The exact length of the silence.", "seconds"), L("filled", "Filled with", ["nothing", "breath", "room sound", "action"], "What happens during the silence."));
  X("breath", R("audible", "How audible", 0, 5, "How loud the breaths are."), R("length", "Breath length", 0, 3, "How long the breath before the line is.", "seconds"));
  X("eating", R("messiness", "Messiness", 0, 5, "How tidy or messy the eating is."), R("share", "Lines while eating", 0, 100, "How many lines are said with food around.", "%"));
  X("vocalTone", R("strength", "How strongly", 0, 5, "How marked the tone is."), CHANGE("the tone"));
  X("toneArc", R("position", "Exact place", 0, 100, "How far through the story.", "%"), NOTICE);
  X("timePerCharacter", R("lead", "Lead character's share", 0, 100, "How much screen time the most-seen person gets.", "%"), CHANGE("the balance"));

  /* Movement with lines */
  X("gesture", L("type", "Kind", ["self-touch", "pointing", "illustrating", "beat on the words", "big sweep"], "The kind of gesture."), R("timing", "Before or on the word", -2, 2, "Gesture comes before (negative) or after (positive) the word it goes with.", "beats"));
  X("stillness", R("holdTime", "How long still", 0, 10, "Seconds the body stays still.", "seconds"), NOTICE);
  X("blink", R("rate", "Blink rate", 0, 40, "Blinks per minute.", "per minute"), L("meaning", "Blink on the thought", ["random", "sometimes", "on every thought"], "Whether blinks mark a change of thought."));
  X("gazeShift", R("size", "Size of the dart", 0, 5, "How far the eyes move."), L("target", "Where the eyes go", ["away", "down", "to another person", "to an object"], "What the eyes go to."));
  X("posture", R("lean", "Lean", -5, 5, "Leaning away (negative) or in (positive)."), R("tension", "Tension", 0, 5, "From slack to rigid."), CHANGE("the posture"));
  X("touch", R("pressure", "Pressure", 0, 5, "From a brush to a grip."), L("who", "Who starts it", ["the speaker", "the listener", "both"], "Who reaches first."));
  X("faceIntensity", L("region", "Where it shows", ["eyes", "mouth", "brow", "whole face"], "Which part of the face carries the expression."), CHANGE("the expression"));
  X("lipSync", R("accuracy", "Accuracy", 0, 5, "From loose to exact."), R("lead", "Mouth leads the sound", -3, 3, "Frames the mouth shape comes before (negative) or after the sound.", "frames"));
  X("leadPart", R("lead", "How far ahead", 0, 6, "Frames the leading part moves before the rest.", "frames"), NOTICE);
  X("anticipation", R("frames", "Length", 0, 12, "Frames of wind-up.", "frames"), R("size", "Size", 0, 5, "How big the wind-up is."));

  /* Animation */
  X("spacing", R("strength", "How strongly", 0, 5, "How marked the easing is."), NOTICE);
  X("stepping", L("mix", "Mixed", ["one rate", "mostly one", "mixed freely"], "Whether the drawing rate changes within a move."), NOTICE);
  X("overshoot", R("howMuch", "How much", 0, 5, "How far past the pose it goes."), R("settleFrames", "Settle frames", 0, 12, "Frames to settle back.", "frames"));
  X("overlap", R("lag", "Lag", 0, 8, "Frames the loose parts trail the body.", "frames"), R("howMuch", "How much", 0, 5, "How much the loose parts swing."));
  X("arcs", R("roundness", "Roundness", 0, 5, "How round the path is."), NOTICE);
  X("squash", L("parts", "Where", ["the whole body", "the face", "props"], "What squashes and stretches."), R("volume", "Keeps its volume", 0, 5, "How strictly the shape keeps its size while squashing."));
  X("poseRate", R("holdFrames", "Hold on each pose", 0, 24, "Frames each key pose is held.", "frames"), NOTICE);

  /* Background */
  X("setting", R("familiarity", "Familiar or strange", 0, 5, "How ordinary or unusual the place is for the audience."), CHANGE("the place"));
  /* Where it happens, as words a 3D set can be built from (rig/sets.js reads them; rig/scene.js keys them when a
     beat is put on the timeline). Not an order: "anywhere" means no set. */
  X("setting", ["place", "Where it happens", ["anywhere", "a room", "a kitchen", "a bedroom", "a living room", "an office", "a classroom", "a diner", "a bar", "a stage", "inside a car", "a bathroom", "a store", "a garage", "a road", "a street", "a park", "a forest", "a beach", "a desert", "a farm", "a backyard", "a parking lot", "outside"], "The place the scene happens in. The 3D view builds a simple set of it when the playhead gets there.", { unordered: true }]);
  X("intExt", R("view", "View outside", 0, 5, "How much of the outside we see from inside (or inside from outside)."), CHANGE("the location"));
  X("envMotion", R("howMuch", "How much", 0, 5, "How busy the background motion is."), R("speed", "Speed", 0, 5, "How fast it moves."));
  X("temperature", R("shown", "How it shows", 0, 5, "How much the heat or cold shows: breath, sweat, shivering."), CHANGE("the temperature"));
  X("weather", R("strength", "Strength", 0, 5, "From a drizzle to a storm."), CHANGE("the weather"));
  X("scale", R("people", "People in it", 0, 100, "How many people the place holds.", "people"), NOTICE);
  X("repeatInFrame", L("pattern", "Pattern", ["random", "rows", "grid", "spiral"], "How the repeated things are arranged."), CHANGE("the repetition"));

  /* Light & look (catalog rows) */
  X("key", R("height", "Height of the light", 0, 90, "From level with the face to straight overhead.", "degrees"), R("ratio", "Key to fill", 1, 16, "How much brighter the main light is than the fill.", ":1"));
  X("contrast", L("shadowFill", "Shadow fill", ["black", "dark", "readable"], "How much detail stays in the shadows."), CHANGE("the contrast"));
  X("colorTemp", R("kelvin", "Kelvin", 1800, 10000, "Warm candle (low) to blue sky (high).", "K"), CHANGE("the light color"));
  X("lighting", R("strength", "How strongly", 0, 5, "How marked the lighting style is."), CHANGE("the lighting"));
  X("timeOfDay", R("hour", "Hour", 0, 23, "The exact hour of the day.", "o'clock"), CHANGE("the time"));
  X("softness", R("size", "Size of the source", 0, 5, "Small (hard shadows) to huge (soft)."), CHANGE("the softness"));
  X("rim", R("intensity", "Brightness", 0, 5, "How bright the edge light is."), L("color", "Rim color", ["matches the key", "warmer", "cooler", "colored"], "The color of the edge light."));
  X("lightCount", R("motivated", "Seen sources", 0, 100, "How many of the lights have a visible reason.", "%"), NOTICE);
  X("practicalInFrame", R("count", "Lamps in frame", 0, 8, "How many lamps or screens are visible."), R("brightness", "How bright", 0, 5, "How bright the visible sources are."));
  X("lightShape", R("strength", "How strong", 0, 5, "How crisp the pattern is."), CHANGE("the pattern"));
  X("atmosphere", R("thickness", "Thickness", 0, 5, "How thick the haze is."), CHANGE("the air"));
  X("lightChange", R("size", "Size of the change", 0, 5, "How big the light change is."), R("speed", "Speed of the change", 0, 5, "From a slow shift to an instant switch."));
  X("valueKey", R("exposure", "Exposure", -3, 3, "Darker (negative) or brighter (positive) than normal.", "stops"), CHANGE("the brightness"));
  X("renderStyle", R("strength", "How far from real", 0, 5, "How stylized the picture is."), CHANGE("the style"));
  X("lineWeight", R("variation", "Line variation", 0, 5, "From even lines to thick-and-thin brush lines."), L("color", "Line color", ["black", "dark color", "light", "none"], "The ink's color."));
  X("gloss", R("howMuch", "How much", 0, 5, "How shiny the surfaces are."), NOTICE);
  X("wetness", R("drips", "Drips", 0, 5, "How much water is running or dripping."), CHANGE("the wetness"));
  X("skinLight", L("color", "Color under the skin", ["none", "warm", "pink", "cool"], "The tint of light glowing through skin."), NOTICE);
  X("glow", R("brightness", "Brightness", 0, 5, "How strong the glow is."), L("color", "Color", ["warm", "white", "cool", "colored"], "The glow's color."));
  X("wear", R("howMuch", "How much", 0, 5, "How worn the surfaces look."), L("kind", "Kind of wear", ["dust", "scratches", "rust", "stains"], "What the wear looks like."));
  X("saturation", L("trend", "Draining or filling", ["draining", "steady", "filling"], "Whether color drains or floods through the scene."), NOTICE);
  X("palette", L("harmony", "Harmony", ["one hue", "neighbors", "opposites", "anything goes"], "How the colors relate."), CHANGE("the palette"));

  /* Effects */
  X("windForce", L("gusts", "Gusts", ["steady", "gusty", "violent gusts"], "Whether the wind is steady or in bursts."), CHANGE("the wind"));
  X("turbulence", R("scale", "Size of the swirls", 0, 5, "From small eddies to huge swirls."), CHANGE("the chaos"));
  X("clothResponse", R("weight", "Cloth weight", 0, 5, "From silk to canvas."), R("howMuch", "Movement", 0, 5, "How much the cloth moves."));
  X("impacts", R("force", "Force", 0, 5, "How hard each impact hits."), L("rhythm", "Rhythm", ["single", "a run", "constant"], "How the impacts are spaced."));
  X("breakage", R("pieces", "Pieces", 0, 100, "How many pieces it breaks into.", "pieces"), R("speed", "Speed", 0, 5, "How slowly or violently it breaks."));
  X("settleTime", L("bounce", "Bounce", ["none", "small", "springy"], "How much it bounces before settling."), NOTICE);
  X("gravityFeel", R("scale", "Gravity", 0.1, 3, "Moon-light (low) to crushing (high).", "x"), CHANGE("the weight"));
  X("furLength", R("cm", "Length", 0, 50, "Exact length.", "cm"), R("density", "Thickness", 0, 5, "How thick the coat is."));
  X("clump", R("howMuch", "How much", 0, 5, "How strongly hairs stick together."), NOTICE);
  X("frizz", L("where", "Where", ["tips", "roots", "all over"], "Where the frizz is."), CHANGE("the frizz"));
  X("hairColor", R("gray", "Gray", 0, 100, "How much gray is in it.", "%"), R("variation", "Variation", 0, 5, "How varied the strands are."));
  X("hairShine", R("howMuch", "How much", 0, 5, "How strong the shine is."), NOTICE);
  X("furResponse", R("strength", "How strongly", 0, 5, "How much the fur moves."), CHANGE("the response"));
  X("furLag", R("springiness", "Springiness", 0, 5, "How much it bounces back."), NOTICE);
  X("element", R("howMuch", "How much", 0, 5, "How much of the element there is."), CHANGE("the element"));
  X("density", R("opacity", "See-through", 0, 100, "How much we can see through it.", "%"), CHANGE("the thickness"));
  X("growth", R("speed", "Speed", 0, 5, "How fast it grows or shrinks."), NOTICE);
  X("curl", R("size", "Size of the curls", 0, 5, "Small wisps to big rolls."), NOTICE);
  X("splash", R("height", "Height", 0, 5, "How high the splash goes."), R("droplets", "Droplets", 0, 5, "How many drops fly."));
  X("scatter", R("spread", "Spread", 0, 5, "How widely the things scatter."), R("size", "Size", 0, 5, "How big each piece is."));
  X("fireLight", R("brightness", "Brightness", 0, 5, "How bright the firelight is."), R("flicker", "Flicker", 0, 5, "How much it flickers."));

  /* Music & sound (catalog rows) */
  X("musicCue", R("level", "Level", -30, 6, "How loud against the voices.", "dB"), CHANGE("the score"));
  X("soundDensity", R("layers", "Layers", 1, 12, "How many sound layers play at once.", "layers"), CHANGE("the density"));
  X("soundToCut", R("lead", "Lead or lag", -4, 4, "Beats the sound leads (negative) or trails (positive) the cut.", "beats"), NOTICE);

  /* Editing & structure */
  X("sceneRate", R("perHour", "Scenes per hour", 5, 80, "How many scenes in an hour.", "per hour"), L("trend", "Speeding or slowing", ["slowing", "steady", "speeding up"], "Whether scenes get shorter toward the end."));
  X("phraseScheme", L("break", "Breaking the pattern", ["never", "once", "often"], "How often a run breaks the pattern."), NOTICE);
  X("sceneEntry", R("lateness", "Enter late", 0, 5, "How far into the action the scene starts."), CHANGE("the opening"));
  X("transition", R("length", "Length", 0, 4, "How long the transition takes.", "seconds"), NOTICE);
  X("callResponse", R("delay", "Delay", 0, 8, "Cuts between the call and the answer.", "cuts"), R("strength", "How clearly", 0, 5, "How obviously the answer matches the call."));
  X("repetition", R("variation", "Variation", 0, 5, "How much each repeat changes."), R("spacing", "Spacing", 1, 20, "Scenes between repeats.", "scenes"));
  X("hook", R("count", "Returns", 0, 10, "How many times the signature image returns."), R("variation", "Variation", 0, 5, "How much it changes each time."));
  X("contrastMap", R("strength", "Strength", 0, 5, "How sharp the contrasts are."), CHANGE("the contrasts"));
  X("tensionCurve", L("shape", "Shape", ["flat", "rising", "falling", "peaks and valleys"], "The shape of the tension through the scene."), CHANGE("the tension"));
  X("energyArc", L("shape", "Shape", ["flat", "rising", "falling", "peaks and valleys"], "The shape of the energy through the scene."), CHANGE("the energy"));
  X("visualDensity", L("trend", "Busier or emptier", ["emptying", "steady", "filling"], "Whether frames get busier through the scene."), NOTICE);
  X("pedal", R("length", "How long held", 1, 40, "How long the constant element is held.", "panels"), NOTICE);
  X("psychOut", R("length", "Length of the fake", 0, 8, "How long the fake goes on before we learn it.", "beats"), R("convincing", "How convincing", 0, 5, "How believable the fake is."));
  X("cutArticulation", L("style", "Style", ["invisible", "rhythmic", "jarring"], "How the cuts feel."), CHANGE("the cutting"));
  X("operatorFeel", R("mistakes", "Mistakes", 0, 5, "How often the operator misses and corrects."), NOTICE);
  X("motifShape", R("size", "Size", 0, 5, "How big the rise or fall is."), NOTICE);
  X("intercut", R("rhythm", "Rhythm", 0, 5, "How regular the switching is."), R("speedUp", "Speeds up", 0, 5, "How much the switching speeds up toward the end."));
  X("reveal", R("size", "Size", 0, 5, "How big the reveal is."), R("setup", "Setup", 0, 5, "How much the reveal was set up."));
  X("povSwitch", R("characters", "Whose stories", 1, 8, "How many people the story is told through.", "people"), NOTICE);
  X("sceneLength", R("minutes", "Minutes", 0.25, 15, "The exact length.", "minutes"), CHANGE("the length"));
  X("sceneShapes", R("size", "Size of the shapes", 0, 5, "How big the main shapes are."), CHANGE("the shapes"));
  X("actionCutRate", R("variation", "Variation", 0, 5, "How much the cut rate swings within the action."), NOTICE);
  X("mains", R("share", "Share of the hour", 0, 100, "How much of the hour the mains hold together.", "%"), CHANGE("the cast"));
  X("groups", R("crossings", "Crossings", 0, 5, "How often the groups meet."), NOTICE);
  X("exit", R("warning", "Warning", 0, 5, "How much the exit is foreshadowed."), R("weight", "Weight", 0, 5, "How much the exit matters to the others."));
  X("featureRate", R("spread", "Spread", 0, 5, "How evenly mains share the season."), NOTICE);

  /* Page & panel */
  X("panelCount", L("grid", "Grid", ["free", "loose grid", "strict grid"], "How the panels are arranged."), CHANGE("the count"));
  X("gutter", R("width", "Width", 0, 5, "How wide the white space between panels is."), NOTICE);
  X("balloon", R("size", "Size", 0, 5, "How much space the balloons take."), L("shape", "Shape", ["round", "square", "jagged", "wavy"], "The balloon shape."));
  X("panelSize", R("variation", "Variation", 0, 5, "How much the panel sizes vary on a page."), CHANGE("the size"));
  X("panelBreak", R("howMuch", "How much", 0, 5, "How far things spill out of the panel."), NOTICE);
  X("textDensity", R("words", "Words", 0, 80, "Words per panel.", "words"), CHANGE("the amount of text"));
  X("soundLettering", R("size", "Size", 0, 5, "How big the lettering is."), L("style", "Style", ["clean", "hand-drawn", "explosive"], "How the letters are drawn."));
  X("pageTurn", R("strength", "Strength", 0, 5, "How strong the surprise after the turn is."), NOTICE);

  /* Story workspaces */
  X("arcStage", R("progress", "Progress through the stage", 0, 100, "How far through this stage they are.", "%"), CHANGE("the stage"));
  X("dramaticRole", R("strength", "How strongly", 0, 5, "How fully they play the role."), CHANGE("the role"));
  X("plotWeight", L("trend", "Growing or shrinking", ["shrinking", "steady", "growing"], "Whether their own plot takes more of each scene."), NOTICE);
  X("plotTouch", R("pull", "Pull", 0, 5, "How much their own plot drags the main plot."), CHANGE("how the plots meet"));
  X("perspectiveWidth", R("strength", "How firmly", 0, 5, "How strongly they hold this view."), CHANGE("their view"));
  X("mindset", R("pressure", "Pressure to change", 0, 5, "How hard the scene pushes on their mind."), CHANGE("their mindset"));
  X("focusWidth", R("strength", "How firmly", 0, 5, "How locked their attention is."), NOTICE);
  X("focusShift", R("speed", "Speed", 0, 5, "How fast the focus moves."), NOTICE);
  X("enneagramType", R("wing", "Wing", -5, 5, "Leans toward the type before (negative) or after (positive) on the circle."), NOTICE);
  X("enneagramHealth", R("level", "Level", 1, 9, "1 most healthy to 9 least healthy, as in the character matrix."), CHANGE("their health"));
  X("herdMentality", R("pressure", "Peer pressure", 0, 5, "How much the group pushes."), CHANGE("the herd"));
  X("herdLeader", R("strength", "Leader's pull", 0, 5, "How strongly the leader pulls the herd."), CHANGE("who leads"));

})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
