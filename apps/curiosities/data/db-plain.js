/* data/db-plain.js: plain words for every label. Fixes labels and descriptions from the database audit of
   2026-10-03 (/mnt/project-files/database/audit-2026-10-03.md) so the app reads in everyday English, with any
   film word explained in a few words. Changes only labels and plain texts: no id, slider id or scale option
   value changes, since suites, proximities, model scenes, windows, the engine and saved projects use them.
   Nothing is merged or deleted; rows that overlap say so ("Close to <label>; this one is about ..."), and the
   owner decides on merges in his review.
   Order: part 2 (film words explained), part 1B (renames), part 1A (overlapping pairs), part 1C (repeated
   sliders), part 3 (suites, proximity suites and proximities that repeat an idea).
   Every helper looks the row up with DB.find and throws if the id or slider is gone, so a rename elsewhere fails
   check-db. Loaded after db-styles.js and before the model scenes. Written 2026-10-03 by the database thread. */
(function (DB) {
  const row = (id) => {
    const x = DB.find(id);
    if (!x) throw new Error(`db-plain.js: no curiosity, suite, spark or elixir "${id}" (renamed or removed?)`);
    return x;
  };
  const slider = (id, sliderId) => {
    const s = (row(id).sliders || []).find((x) => x.id === sliderId);
    if (!s) throw new Error(`db-plain.js: "${id}" has no slider "${sliderId}" (renamed or removed?)`);
    return s;
  };
  /* A curiosity's own setting slider often repeats its label; it follows the new label. */
  const label = (id, text) => {
    const x = row(id);
    const main = x.level === "curiosity" ? x.sliders.find((s) => s.id === x.main) : null;
    if (main && main.label === x.label) main.label = text;
    x.label = text;
    x.relabeled = true; /* install() then renames the app's own older row too, so timeline lanes match */
  };
  const plain = (id, text) => {
    const x = row(id);
    x.plain = text;
    x.replained = true;
  };
  const addPlain = (id, text) => {
    const x = row(id);
    x.plain = (x.plain || "").replace(/\s+$/, "").replace(/([^.!?])$/, "$1.") + " " + text;
    x.replained = true;
  };
  const sliderLabel = (id, sliderId, text) => (slider(id, sliderId).label = text);
  const sliderPlain = (id, sliderId, text) => (slider(id, sliderId).plain = text);
  const addSliderPlain = (id, sliderId, text) => {
    const s = slider(id, sliderId);
    s.plain = (s.plain || "").replace(/\s+$/, "").replace(/([^.!?])$/, "$1.") + " " + text;
  };
  /* The live label, so a note names the row the way the app shows it now. */
  const name = (id) => `"${row(id).label}"`;

  /* ================= Part 2. Film words explained ================= */

  /* --- the most cryptic first --- */
  plain("angleFamily", "How the shots of a scene are planned as a set. Coverage: the scene is filmed from several angles and the edit cuts between them, keeping the camera on one side of \"the line\" (an imaginary line between two people, so they keep facing each other on screen). A oner: one long shot with no cuts at all. Montage: many short shots stacked to show time passing. Handheld: a camera held in the hands that hunts for the action.");
  sliderPlain("angleFamily", "setting", "Coverage (cutting between several angles of the same moment), oner (one shot, no cuts), montage (short stacked shots of time passing) or handheld (a held camera searching for the action).");

  plain("sceneEntry", "How a scene begins: in the middle of the action, on a line of talk, on an establishing shot (a wide shot that shows where we are), or with its sound starting before its picture. Like the lead-in notes before a song's first full beat.");
  sliderPlain("sceneEntry", "setting", "In action, on a line, establishing (a wide shot of the place first) or sound first (we hear the scene before we see it).");

  plain("sceneRate", "How often the film moves on to a new scene, the way a song changes chords: slowly, at a medium rate, or fast.");

  label("cutArticulation", "Clipped or flowing cuts");
  plain("cutArticulation", "Whether the cuts are clipped, each shot stopping sharply like short separate notes, or flowing, with sound and picture overlapping across the cut like notes joined smoothly. 0 is clipped, 5 is fully overlapping.");

  plain("lightShape", "A pattern cut into the light by something put in front of it: open (no pattern), blinds (stripes, like light through window blinds), leaves (dappled shadow, like sun through a tree), or barndoor (a hard straight edge made by the metal flaps on the front of a film light). On set this is done with a gobo or a blocker, a cut-out or a board in front of the lamp.");

  label("key", "Where the main light comes from");
  plain("key", "Where the key light (the main, brightest light on a face) comes from: the side, the front, behind, below, or no main light at all.");
  sliderLabel("key", "ratio", "Main light against fill light");
  sliderPlain("key", "ratio", "How much brighter the main light is than the fill light (a softer second light that lightens the shadows). 1:1 is flat; 16:1 leaves one side of the face nearly black.");

  plain("colorTemp", "The color of the light on set: warm practical (the orange glow of lamps and candles that are part of the scene), cold day (the blue of daylight or an overcast sky), or a mix of both.");
  sliderLabel("colorTemp", "kelvin", "Color number (kelvin)");
  sliderPlain("colorTemp", "kelvin", "Light color measured in kelvin, a number for how warm or blue light is: low is orange candlelight (about 1800), high is blue sky (about 10000).");

  plain("squash", "How much a body, a face or a thing squishes and stretches as it moves, like a bouncing ball that flattens when it lands and stretches as it flies. A classic cartoon trick: 0 is stiff, 5 is very rubbery.");

  label("spacing", "Speed within a move");
  plain("spacing", "How a move speeds up and slows down along its path: even (the same speed all the way), ease in or ease out (gentle at one end), ease both (gentle at both ends) or snap (sudden). Animators call this spacing.");

  label("stepping", "Drawn on ones, twos or threes");
  plain("stepping", "How many film frames each drawing or pose is held for. On ones, a new pose every frame (smooth). On twos, every second frame (the snappy, classic hand-drawn look). On threes, every third frame (choppy, like stop-motion).");
  sliderPlain("stepping", "setting", "Ones (a new pose every frame, smooth), twos (every second frame, snappy) or threes (every third frame, choppy).");

  plain("skinLight", "How much light glows through skin, the soft reddish glow you see in ears or in fingers held up to a lamp. 3D software calls it subsurface scattering.");

  plain("density", "How thick the smoke, fog, mist or dust is: a wisp, a plume, or a wall you cannot see through.");

  plain("exit", "How a character leaves the story: stays, walks out, or dies. Many shows with a big shared cast only let their main characters leave by dying; here they can also simply walk out.");

  label("mains", "Number of main characters");
  plain("mains", "How many main characters the hour follows, from two to four, rather than a crowd of people whose eyes we see through.");

  plain("panelCount", "How many panels the strip has. When the board is set to coverage (cutting between several angles of the same moment), the number of panels follows the number of angles.");

  plain("angleCount", "How many camera setups the scene is allowed. A setup is one place for the camera with its own angle.");
  sliderLabel("angleCount", "reuse", "Back to an earlier angle");
  sliderPlain("angleCount", "reuse", "How often the scene goes back to a camera setup (place and angle) it already used.");
  sliderPlain("angleCount", "variety", "From near-identical camera setups to wildly different ones.");

  label("cutRate", "How often the shot changes");
  plain("cutRate", "How often the picture is allowed to change to a new camera setup (a new place and angle for the camera), per line or per beat.");

  plain("shotSize", "How much of the body the frame shows: wide (the whole body and the place), medium (from the waist up), close (the face), or insert (a very close shot of a small thing, like a hand or a key).");

  plain("angleToAction", "Whether each shot fits the action it shows: an insert (a very close shot of a small thing) for a hand at work, a wide shot for someone crossing the room. Or the shot can play against the action on purpose.");

  label("focus", "What is in sharp focus");
  plain("focus", "Which thing the lens keeps sharp while the rest goes soft: a face, a hand, an object, or a door.");

  plain("blink", "Whether, and how often, a character blinks. A blink is a tell (a small sign that gives a thought or a feeling away) and is easy to fake, so some performers hold their eyes still and never blink.");

  plain("repeatInFrame", "Rows or patterns of the same thing repeated across the picture: seats, windows, soldiers, lamps. In Maya this is done with MASH, a tool that copies one object many times.");

  label("operatorFeel", "Human touch in camera and cuts");
  plain("operatorFeel", "Small timing wobbles in the camera and the cuts, as if a person (the camera operator) were doing it by hand rather than a machine: a pan that starts a little late, a cut a little early.");

  plain("saturation", "How strong the colors are, from washed out and grayish (low) to rich and vivid (high).");

  label("valueKey", "Dark or bright overall (in the lighting)");
  plain("valueKey", "How dark or bright the lighting is overall, scene by scene: low key (mostly dark, with deep shadows), mid, or high key (bright and even, with few shadows).");
  sliderPlain("valueKey", "setting", "Low key (mostly dark, deep shadows), mid, or high key (bright and even).");
  sliderPlain("valueKey", "exposure", "Darker (below 0) or brighter (above 0) than normal, in stops (each stop doubles or halves the light).");

  plain("aspect", "The shape of the frame, written as its width against its height (the aspect ratio): 1.33 is almost square, like old TV; 1.85 is a common cinema shape; 2.39 is very wide widescreen.");
  sliderPlain("aspect", "setting", "1.33 (almost square, like old TV), 1.85 (common cinema), 2.39 (very wide) or a custom shape.");

  label("cameraCarry", "How the camera is held");
  plain("cameraCarry", "How the camera is held: locked (fixed on a stand, it does not move), smooth (it glides along one steady path, on a track or a steadying rig), or handheld (held in the hands, a little unsteady).");

  label("moveTemper", "The camera's attitude");
  plain("moveTemper", "How the camera feels about the action, from loving (1: gentle, patient, close) to aggressive (5: pushy, quick, rough).");

  plain("lightChange", "When the light changes against the edit: never, on the cut (the new shot has new light), on an action (someone flips a switch), or during a held shot (the light shifts while we watch).");

  plain("hairColor", "How light or dark the hair is (set by melanin, the natural pigment in hair), plus how much gray is in it and how varied the strands are.");

  plain("glow", "Something in the picture gives off its own light: an object (a lamp, a screen), a person, or the whole room.");

  /* --- partly explained: a short gloss --- */
  label("dutch", "Tilted or level frame");
  plain("dutch", "Whether the horizon is level or tilted. A tilted frame is called a Dutch angle; it makes a scene feel uneasy or off balance.");

  plain("depthOfField", "How deep the sharp zone is (the depth of field): shallow means only one thing is sharp and the rest is blurred; deep means near and far are both sharp.");
  sliderLabel("depthOfField", "fstop", "Lens opening (f-stop)");
  sliderPlain("depthOfField", "fstop", "The size of the lens opening, written as an f-stop number: low numbers (like 1.4) are a wide opening that blurs the background; high numbers (like 22) are a small opening that keeps everything sharp.");

  plain("transition", "How one scene hands over to the next: a plain cut; a match cut (the new shot echoes a shape or a move from the last one); a smash cut (a sudden hard cut to something very different); a dissolve (one picture melts into the next); or a sound bridge (the next scene's sound starts before its picture, or this scene's sound carries on over the next).");
  sliderPlain("transition", "setting", "Cut, match cut (the new shot echoes the last), smash cut (a sudden jump to something very different), dissolve (one picture melts into the next) or sound bridge (the sound crosses the cut early or late).");

  plain("sceneEnding", "The last beat of a scene: a button joke (one small last laugh that closes the scene), a cliffhanger, a quiet fade, an open question, a cut on action (cutting in the middle of a movement), a smash cut (a sudden hard cut to something opposite), or a callback (an earlier joke or line coming back).");

  plain("comicEdit", "How the cutting itself makes a joke: smash cuts (a sudden hard cut that contradicts what was just said), cutaways (a quick cut away to something else and back), and picture that flatly contradicts the words.");

  plain("soundToCut", "Whether the sound changes at the same moment as the picture. A J-cut: the next scene's sound starts before its picture. An L-cut: this scene's sound carries on over the next picture. Hard: sound and picture change together.");
  sliderPlain("soundToCut", "setting", "J-cut (the next scene's sound starts before its picture), L-cut (this scene's sound carries on over the next picture) or hard (both change at once).");

  plain("musicLevel", "How loud the music sits against the voices, and how much it ducks (dips down by itself) when someone talks.");

  plain("texture", "How soft, crisp or gritty the picture is: sharpening (crisper edges), clarity (more contrast in the middle tones, so detail pops), grain (a fine film-like speckle) and vignette (darkened corners).");

  plain("colorWheels", "Pushing a color into the shadows, the midtones (the in-between brightness, like most skin and walls) or the highlights separately, with Final Cut's color wheels.");
  sliderPlain("colorWheels", "setting", "Which part of the picture gets a color push: the shadows (dark parts), the midtones (middle brightness), the highlights (bright parts), or all three.");

  plain("colorCurves", "Bending the brightness, or one color channel (only the red, the green or the blue in the picture), with a curve: Final Cut's color curves and hue and saturation curves.");
  sliderPlain("colorCurves", "setting", "Flat (no change), gentle S or strong S (an S-shaped curve: darks darker and brights brighter, so more contrast), faded blacks (the darkest parts lifted to a soft gray), crushed blacks (dark detail pushed to solid black) or inverted (like a negative).");
  sliderPlain("colorCurves", "channel", "Which part of the color the curve bends: all of it, only the red, green or blue channel (one of the three colors every picture is mixed from), or how strong each hue is (hue vs saturation).");

  plain("maskShape", "A shape that limits where an effect or a layer shows: a vignette (an oval that keeps or darkens the edges), a circle, a rectangle, a gradient (a soft fade from one side), a drawn shape, or one that follows a person on its own (Final Cut's magnetic mask).");

  plain("layersLens", "The picture as layers you can turn up and down: foreground against background, contact shadows (the dark where things touch), fog that grows with distance, and one light group (a set of lights mixed together as one) louder than another.");
  sliderPlain("layersLens", "lightMix", "Which group of lights (a set of lights mixed together as one) is turned up when the layers are combined.");

  plain("lightEffect", "Light added over the picture in the edit: god rays (beams of light, like sun through clouds), a sun flare, a halo, a light leak (a soft colored glow bleeding in from the edge, like old film), a blaze burst, lightning, or a film burn (the frame looking as if it is scorching). These come from CapCut's Light effects.");

  plain("phraseScheme", "How long the runs of related shots are, like phrases in music: single shots, pairs, threes, fours or long runs, and patterns such as 4+4 (two runs of four shots) or 3+3+2 (two runs of three, then two).");

  plain("motifShape", "How a visual motif (an image or shape the film keeps bringing back) changes each time it returns: it rises (bigger, higher or brighter), falls, rises then falls (an arch), or stays the same.");

  plain("gutter", "The gutter is the white gap between comic panels, where time passes that we do not see. None: the panels touch. Beat: a moment passes in the gap. Scene: a whole scene jumps by.");

  plain("multicamSwitch", "Several cameras film the same moment at once (multicam), and the edit switches between them, choosing which camera we see at each moment (Final Cut's multicam clips).");

  plain("cameraOwner", "Who controls the camera: authored (the filmmaker chooses every shot) or the player (in a game, the player steers it). Games need both.");

  /* --- film words in slider options only (the option values stay; the slider explains them) --- */
  sliderLabel("motionBlur", "shutter", "Shutter angle (blur in each frame)");
  sliderPlain("motionBlur", "shutter", "Shutter angle: how long each frame's shutter stays open. Low (like 45) is crisp and choppy; high (like 360) is smeary.");
  plain("motionBlur", "How much moving things smear in each shot (motion blur).");
  sliderPlain("wordplay", "kind", "The type of verbal joke: a pun, a misunderstanding, a comeback, a malapropism (using a wrong word that sounds like the right one) or repetition.");
  sliderPlain("onScreenText", "setting", "What kind of text is on screen: a caption, a title card (a full screen of words), a lower third (a name and a title across the bottom part of the screen), a sign or label, a sound word (like BANG) or credits.");
  plain("lut", "A LUT (short for look-up table) is a saved color recipe applied in one go: a film stock look, teal and orange, bleach bypass, day for night. From CapCut's Adjustment tab (LUT) and Final Cut's Custom LUT effect.");
  sliderPlain("lut", "setting", "Film stock (the look of a real film), teal and orange, bleach bypass (low color, high contrast, a gritty silvery look), day for night (daytime footage darkened and tinted blue to pass as night), warm or cool print, or log to normal (turning the flat, grayish footage some cameras record into normal color).");
  sliderPlain("retimeQuality", "setting", "How slowed-down footage gets its extra frames: repeating frames (choppy), frame blending (two frames mixed into each new one, a little ghostly) or optical flow (the computer invents the in-between frames, the smoothest).");
  sliderPlain("transitionKind", "setting", "Which transition crosses this cut. A cross dissolve melts one shot into the next; a wipe slides a line across the screen; a whip pan is a camera turn so fast the picture blurs into the next shot; a morph bends one picture into the other.");
  sliderPlain("colorRange", "filterKind", "A finished look laid over the picture, beyond a plain color tint: soft diffusion (a gentle glow), sepia (old brown photo), bleach bypass (low color, high contrast, silvery), cross processed (odd, strong shifted colors, as if the film was developed the wrong way) or a heavy tint.");
  sliderPlain("soundDesign", "bridge", "A sound bridge: whether a sound from the next scene starts before the cut, or one from this scene carries on into the next.");
  sliderPlain("whiteBalance", "temperature", "The color temperature in kelvin, a number for how warm or blue the picture is: low is orange, high is blue.");
  sliderPlain("lightingLens", "valueKey", "How dark or bright the lighting is overall: low key (mostly dark, deep shadows), mid, or high key (bright and even).");

  /* ================= Part 1B. Renames, so the difference is clear ================= */

  /* 25. Three kinds of "Pace". */
  label("pace", "Speaking speed");
  plain("pace", "How fast the lines are spoken, against how long the shot holds.");
  label("pacingCurve", "Cutting speed across the scene");
  sliderLabel("pacingCurve", "setting", "Shape of the cutting speed");
  label("pacing", "Walking back and forth");
  addPlain("pace", `Not ${name("pacingCurve")}, which is about the edit, or ${name("pacing")}, which is a person walking.`);
  addPlain("pacingCurve", `Not ${name("pace")}, which is how fast people talk, or ${name("pacing")}, which is a person walking.`);
  addPlain("pacing", `Not ${name("pace")} (how fast people talk) or ${name("pacingCurve")} (how fast the edit cuts).`);

  /* 26. Two kinds of frame breaking. */
  label("frameBreak", "Bursting past the film frame");
  label("panelBreak", "Breaking the panel border");
  plain("panelBreak", `Figures or things crossing the border of a comic panel. Not ${name("frameBreak")}, which is the edge of a film picture.`);
  addPlain("frameBreak", `Not ${name("panelBreak")}, which is the border of a comic panel.`);

  /* 27. A camera cue against a body cue. */
  label("moveOn", "Camera move starts on");
  plain("moveOn", `The cue that starts the camera's move: a line, an action, a breath, or no cue. Not ${name("moveOnLine")}, which is a person's body moving with the words.`);
  addPlain("moveOnLine", `Not ${name("moveOn")}, which is the camera's move.`);

  /* 28. Whose eyes the shot sees through. */
  label("pov", "Whose eyes the shot sees through");
  plain("pov", `Whether the shot is seen through someone's eyes (a point of view shot), through an object, or through nobody's. Not ${name("povSwitch")}, which is whose story each scene tells.`);
  addSliderPlain("pov", "honesty", `(Same idea as ${name("unreliableView")}.)`);
  plain("povSwitch", `Whose story each scene tells, and whether that changes from scene to scene. Not ${name("pov")}, which is a single shot seen through someone's eyes.`);

  /* 29. Out of place in a world against out of place in a group. */
  label("fishOutOfWater", "Out of place in a strange world");
  label("oddOneOut", "Doesn't fit this group");
  plain("fishOutOfWater", `A character in a whole world they do not fit: a city person on a farm, a farmer at a palace. Close to ${name("oddOneOut")}, which is about one group of people rather than a whole world.`);
  addPlain("oddOneOut", `Close to ${name("fishOutOfWater")}, which is about a whole strange world rather than one group.`);

  /* 30. The mirror character against the mirror and foil roles. */
  label("foil", "The character they could become");
  label("cm-role", "Role in the scene"); /* named in the note below; part 1A item 1 */
  addPlain("foil", `Not the mirror or foil roles in ${name("cm-role")}, which are a job someone does in one scene; this one is a whole other character who shares the hero's start.`);

  /* 31. Whose good they see. */
  addPlain("perspectiveWidth", `Close to ${name("cm-morality")}, which is whether they serve others or themselves first; this one is how wide the circle of people they weigh is.`);
  addPlain("cm-morality", `Close to ${name("perspectiveWidth")}, which is how wide the circle of people they weigh is; this one is whether they put others or themselves first.`);

  /* 32. Cut rate and shot length are two sides of one thing. */
  label("shotDuration", "How long each shot lasts");
  plain("shotDuration", "How long a shot or panel stays before the picture changes to the next angle.");
  addPlain("cutRate", `The other side of ${name("shotDuration")}: many changes a minute means short shots. ${name("actionCutRate")} counts only during action, and ${name("attentionReset")} counts anything new, not only cuts.`);
  addPlain("shotDuration", `The other side of ${name("cutRate")}: long shots mean few changes.`);
  plain("actionCutRate", `How many cuts a minute during action beats only. A narrower version of ${name("cutRate")}.`);
  addPlain("attentionReset", `Wider than ${name("cutRate")}, which counts only cuts.`);

  /* 33. One person still against everyone moving. */
  label("stillness", "How still this person is");
  label("movementAmount", "How much everyone moves");
  plain("stillness", `How much of this one person is allowed to move. Not ${name("movementAmount")}, which is everyone in the scene.`);
  addPlain("movementAmount", `Not ${name("stillness")}, which is one person.`);

  /* 34. Five shake controls: shot that way, added in the edit, or removed in the edit. */
  label("cameraShake", "Camera shake while filming");
  label("cameraEffect", "Camera move added in the edit");
  label("stabilization", "Shake removed in the edit");
  plain("cameraShake", `How much the camera shakes as the shot is filmed, beat by beat. Not ${name("cameraEffect")}, which fakes a shake later, or ${name("stabilization")}, which smooths it out.`);
  plain("stabilization", `How much camera shake is smoothed out in the edit (Final Cut's stabilization and rolling shutter fix, which straightens the jelly-like wobble of fast moves). Not ${name("cameraShake")}, which is the shake as filmed.`);
  addSliderPlain("cameraCarry", "wobble", `(Shot that way; same as ${name("cameraShake")}.)`);
  addSliderPlain("cameraLensLens", "shake", `Shot that way: same as ${name("cameraShake")}. ${name("cameraEffect")} adds a shake in the edit, and ${name("stabilization")} removes it.`);

  /* 35. The canvas has its own shape. */
  sliderLabel("canvasFill", "ratio", "Canvas shape");
  addSliderPlain("canvasFill", "ratio", `Not ${name("aspect")}, which is the shape of each shot.`);

  /* 36. The eyes, for the feeling. */
  label("emoEyes", "The eyes, for the feeling");
  addPlain("emoEyes", `This one is about what the eyes show of the feeling. ${name("gazeShift")} counts quick eye moves, ${name("blink")} is blinking as a tell, and ${name("eyeline")} is who looks at whom.`);

  /* 37. The shape of the voice. */
  label("vocalTone", "Shape of the voice through the line");
  plain("vocalTone", `What the voice does through one line: flat, rising, falling, breaking, whispered, shouted. Not ${name("emoVoice")}, which is how much feeling you can hear.`);
  addPlain("emoVoice", `Not ${name("vocalTone")}, which is the shape of one line.`);

  /* 38. Screen time per person. */
  label("timePerCharacter", "Screen time per person in this scene");
  plain("timePerCharacter", "How the screen time in this scene is shared between the people in it.");
  addSliderPlain("mains", "share", `For the whole hour; ${name("timePerCharacter")} is one scene.`);
  addPlain("timePerCharacter", `Not the "Share of the hour" slider in ${name("mains")}, which is the whole hour.`);

  /* 39. A thing, a shot or line, and a prop's weight. */
  label("hook", "Signature image or line");
  plain("hook", `A memorable image or line that comes back again and again. Not ${name("returningObject")}, which is a thing the camera keeps finding, or the "Story weight" slider in ${name("props")}, which is how much the scene leans on an object.`);
  addPlain("returningObject", `Not ${name("hook")} (a memorable shot or line that comes back) or the "Story weight" slider in ${name("props")} (how much one scene leans on an object).`);
  addSliderPlain("props", "importance", `Not ${name("returningObject")}, which is an object that keeps coming back across scenes.`);

  /* 40. Two tools for one effect: keeping the hit out of sight. */
  addPlain("offscreen", `Close to ${name("cutBeforeHit")}, which hides the moment by cutting away; this one keeps it outside the frame.`);
  addPlain("cutBeforeHit", `Close to ${name("offscreen")}, which keeps the moment outside the frame; this one hides it by cutting away.`);

  /* 41. Slam zoom and punch-in, both made in the edit. */
  plain("cameraEffect", "A camera move added in the edit, not filmed: a slam zoom (a sudden fast zoom in), a zoom, a sway, a shake, a radial blur (a blur streaking out from the middle), a tracking move (CapCut's Motion effects).");
  label("reframe", "Punch-in made in the edit");
  addPlain("reframe", `Close to ${name("cameraEffect")}; this one is a still, steady push in or a slow drift, that one a moving, showy move.`);
  addPlain("cameraEffect", `Close to ${name("reframe")}, which is a still push in rather than a move.`);

  /* 42. Cutaways in four places. */
  addPlain("cutawayGag", `Cutaways also appear in ${name("overlay")} (a cutaway laid over the sound), ${name("sideStoryline")} (a run of cutaways above the story) and the "Cutaways" slider in ${name("comicEdit")} (how often the comic cutting uses them); this one is a single cutaway that makes a line funnier.`);
  addSliderPlain("comicEdit", "cutaway", `(Close to ${name("cutawayGag")}, which is one cutaway joke.)`);
  addPlain("overlay", `Its cutaway setting is close to ${name("cutawayGag")}, which is a cutaway made for a joke.`);
  addPlain("sideStoryline", `A run of cutaways here is close to ${name("cutawayGag")}, which is a single cutaway joke.`);

  /* 43. A sting is short; a big hit is built up to. */
  addPlain("musicSting", `A sting is short and comes without a build. Not ${name("bigHit")}, which the music builds up to, or ${name("sfxHits")}, which are sound effects rather than music.`);
  addSliderPlain("comicSound", "sting", `(Same idea as ${name("musicSting")}.)`);
  addPlain("bigHit", `Not ${name("musicSting")}, which is short and comes without a build.`);
  addPlain("sfxHits", `Not ${name("musicSting")}, which is a burst of music.`);

  /* 44. Wardrobe pairs: main character against the crowd behind. */
  [["mainEra", "backEra", "era of the clothes"], ["mainCost", "backCost", "cheap to expensive"], ["mainCoverage", "backCoverage", "how much skin is covered"], ["mainUtility", "backUtility", "looks or function"], ["mainFunction", "backFunction", "the job the clothes do"], ["mainWear", "backWear", "wear and tear"]].forEach(([m, b, t]) => {
    label(m, "Main: " + t);
    label(b, "Crowd: " + t);
  });

  /* 45. The placement focus row is not the Focus workspace. */
  addPlain("focus", "Not the Focus workspace, which is about what a character pays attention to.");

  /* ================= Part 1A. Rows that mean nearly the same thing (nothing merged) ================= */

  /* 1. */
  label("cm-role", "Role in the scene");
  label("dramaticRole", "Role in the scene (short list)");
  addPlain("dramaticRole", `Close to ${name("cm-role")}; this one is the story workspace's shorter list of 13 roles, without ally and without whether they know the role they play.`);
  /* 2. */
  label("focusWidth", "What they pay attention to");
  addPlain("focusWidth", `Close to ${name("cm-focus")}; this one names what they attend to (one thing up to the world) and whether the camera narrows with them.`);
  /* 3. */
  label("mindset", "Ready to change their mind");
  addPlain("mindset", `Close to ${name("cm-perspective")}; this one adds how hard the scene pushes, the belief being challenged, and how much they fool themself.`);
  addPlain("cm-adaptability", `Not ${name("cm-perspective")}: this one is bending to the situation, not changing what they believe.`);
  /* 4. */
  label("reveal", "When the audience learns it");
  plain("reveal", `When the audience learns a fact compared with the characters: before them, with them, or after them. Close to ${name("knowledgeGap")}; this one is about the timing and the size of one reveal.`);
  /* 5. */
  addPlain("lingeringShot", `Close to ${name("holdBeforeCut")}; this one is a hold that hints at something (a feeling, a warning, a clue), that one lets a moment sink in before the cut.`);
  sliderLabel("sceneEnding", "late", "How soon it leaves");
  addSliderPlain("sceneEnding", "late", `(Same idea as ${name("holdBeforeCut")}.)`);
  /* 6. */
  plain("callResponse", `Whether a shot or a line is answered by another a few cuts later, like a call and its reply in music. Close to ${name("bridgeLine")}; this one is how often answers echo across cuts through the scene, that one a single line answered across one cut.`);
  /* 7. */
  label("whoKnows", "Who is in on it, around the room");
  addPlain("whoKnows", `Close to ${name("plotSecret")}; this one is how many people in the room know, that one the secret itself and how well it is kept.`);
  /* 8. */
  label("musicCue", "Score (music only we hear)");
  plain("musicCue", `Where the score (music written for the film that only the audience hears) plays, and how loud. Close to ${name("music")}; this one is a simple off, under or featured switch with a loudness, that one holds every music choice.`);
  addPlain("musicLevel", `Close to the "Loudness against the voices" slider in ${name("music")}; this one adds how much the music dips when someone talks.`);
  addSliderPlain("soundRoles", "music", `(Same idea as ${name("musicLevel")}.)`);
  /* 9. */
  label("speedRamp", "Speed ramp (speed changing in the shot)");
  plain("speedRamp", `How fast the shot plays, and whether the speed ramps (changes inside the shot, like slowing down for the hit). Close to ${name("clipSpeed")}; this one adds the ramp, that one sets one speed for the whole clip.`);
  /* 10. */
  label("transition", "How scenes join (storytelling)");
  /* transitionKind keeps "Transition style": the Screen tests and the CapCut-style cards name it that way. */
  addPlain("transitionKind", `Close to ${name("transition")}, which is what the join means for the story; this one is the editing effect.`);
  addPlain("transitionFamily", `Close to ${name("transitionKind")}; this one picks the shelf of effects and how hard they hit, that one the exact effect.`);
  /* 11. */
  label("videoEffectFamily", "Video effect family");
  addPlain("videoEffectFamily", `Close to ${name("videoEffect")}; this one picks the shelf the effect comes from, that one the exact effect.`);
  addSliderPlain("videoEffect", "body", `(Same idea as ${name("bodyEffect")}.)`);
  /* 12. */
  addPlain("filterFamily", `Close to ${name("filterLook")}; this one is the shelf the filter sits on, that one the exact look.`);
  addPlain("lut", `Close to ${name("filterLook")}: a LUT is the exact color recipe, a filter a ready-made look you pick by name.`);
  label("colorFilter", "Color tint");
  addPlain("colorFilter", `Not ${name("filterLook")} (a ready-made look in the edit app); this one is a tint of one color.`);
  /* 13. */
  plain("sceneLength", "How long each scene runs, in minutes.");
  addPlain("sceneRate", `Close to ${name("sceneLength")}, seen from the other side: long scenes mean the scene changes rarely.`);
  /* 14. */
  addPlain("saturation", `Close to ${name("colorRange")}; this one is only how strong the colors are and whether they drain or fill, that one also picks the main hue and the overall look.`);
  /* 15. */
  label("palette", "Range of colors");
  plain("palette", `How many colors lead each shot, shown as a strip of color, and how they go together. Close to ${name("colorCount")}; this one adds the harmony (how the colors relate).`);
  /* 16. */
  addPlain("gutter", `Close to ${name("panelJump")}; this one is the gap itself and its width, that one how big the jump in the story is.`);
  /* 17. */
  addPlain("backTurned", `Close to ${name("facingAway")}; this one is turning away from the other person while talking, that one turning away from the camera.`);
  /* 18. */
  label("laughsToTears", "The turn from funny to sad");
  label("laughThroughGrief", "A laugh inside grief");
  addPlain("laughThroughGrief", `Close to ${name("laughsToTears")}; this one is a laugh that breaks into grief, that one a whole scene that switches mood.`);
  /* 19. */
  label("wear", "Surface wear");
  plain("wear", `Damage and dirt on the surfaces of the scene: dust, scratches, rust, stains. Close to ${name("setUpkeep")}; this one is the look of the surfaces, that one how well the place is looked after.`);
  /* 20. */
  label("soundDesign", "Sound effects around the scene");
  plain("soundDensity", "How many layers of sound play at once: voices, music, effects, the background.");
  addPlain("soundDesign", `Its "How busy" slider is close to ${name("soundDensity")}, which counts the layers of sound at once.`);
  /* 21. */
  label("whiteBalance", "Warmth set in the edit");
  addPlain("whiteBalance", `Close to ${name("warmCool")}; this one is set in the edit, with exact numbers and a green or magenta tint. ${name("colorTemp")} is the light on set.`);
  /* 22. */
  label("exposure", "Exposure (brightness set in the edit)");
  addPlain("exposure", `Close to ${name("valueKey")}, which sets it in the lighting; this one is set in the edit.`);
  addSliderPlain("colorRange", "brightness", `(Close to ${name("exposure")} and ${name("valueKey")}.)`);
  /* 23. */
  label("lighting", "Lighting preset");
  plain("lighting", `The look of the room as one ready-made choice the board can draw: dusk, flat, practical (lit by the lamps that are part of the scene), hard, or moon. Close to ${name("lightingLens")}, which breaks the light into its parts.`);
  addPlain("lightRigLens", `Close to ${name("lightingLens")}; this one is about the kinds of lights and how they work together, that one gathers direction, hardness, warmth and shape.`);
  /* 24. */
  label("scatter", "Scattered bits per area");
  plain("scatter", `How many leaves, bits of debris or people are scattered over each part of the picture. Close to ${name("scatterLens")}; this one is a quick amount, spread and size, that one names what is scattered and how it moves.`);

  /* ================= Part 1C. Repeated sliders ================= */

  /* 52. */
  sliderLabel("mixLaughs", "balance", "How the laughs are shared");
  /* 46 to 51. */
  addSliderPlain("plotWeight", "stakes", `(Same as ${name("stakes")}.)`);
  addSliderPlain("herdMentality", "pressure", `(Same as ${name("groupPressure")}.)`);
  addSliderPlain("composition", "frameInFrame", `(Same as ${name("frameInFrame")}.)`);
  addSliderPlain("emoRoadFilm", "tension", `(Same as ${name("tensionCurve")}.)`);
  addSliderPlain("emoRoadFilm", "relief", `(Same as ${name("emoRelease")}.)`);
  addSliderPlain("blocking", "distance", `(Same as ${name("personalSpace")}.)`);
  addSliderPlain("chemistry", "mirror", `(Same as ${name("mirroring")}.)`);

  /* ================= Part 3. Suites, proximity suites and proximities ================= */

  /* Clashing labels. */
  label("breakdown", "Glitch breakdown (the picture falls apart)");
  label("the-breakdown", "Breaking down in tears");
  addPlain("breakdown", `Not ${name("the-breakdown")}, which is a person crying; this one is the picture itself breaking up.`);
  addPlain("the-breakdown", `Not ${name("breakdown")}, which breaks up the picture.`);

  label("crossing-the-line", "Crossing the point of no return");
  label("passing-the-line", "A line carried across the cut");
  addPlain("crossing-the-line", `Not ${name("passing-the-line")}, which is about the edit.`);
  addPlain("passing-the-line", `Not ${name("crossing-the-line")}, which is about the story.`);

  label("the-topper", "Topping the joke, twice");
  addPlain("the-topper", `${name("topper")} is one extra joke; this suite stacks them and lands the payoff.`);

  label("room-to-breathe", "Rest after a big feeling");
  addPlain("breathing-room", `Not ${name("room-to-breathe")}, which is the rule that rest follows a big feeling; this one sets the quiet itself.`);
  addPlain("room-to-breathe", `Not ${name("breathing-room")}, which sets a quiet, empty, long-held moment.`);

  label("growth-arc", "Ends better than they began");
  label("growing-up", "Caring wider leads to change");
  addPlain("growing-up", `Close to ${name("growth-arc")}, which sets where the arc ends; this one is the chain of causes that gets them there.`);

  label("genre-documentary", "Documentary look (camera and light)");
  plain("genre-documentary", "A handheld camera, light from the lamps that are really there, and the small drift of a person operating the camera.");
  label("documentary-edit", "Documentary edit (interviews and captions)");
  plain("documentary-edit", `Cutaways over the interview, a running voice-over, captions, steadied footage and lower thirds (names across the bottom of the screen). Close to ${name("genre-documentary")}, which is how it is filmed; this one is how it is edited.`);

  label("comic-ink", "Cartoon look with heavy ink lines");
  plain("comic-ink", "A drawn cartoon look (toon render) with heavy ink lines and low color.");
  label("ink-comic", "Printed comic page look");
  addPlain("ink-comic", `Close to ${name("comic-ink")}; this one is a printed page, with crosshatching (shadows drawn as crossed lines) and paper grain.`);

  label("golden-hour", "Golden hour: warm light from behind");
  label("magic-hour", "Magic hour: the last golden minutes");
  addPlain("magic-hour", `The same time of day as ${name("golden-hour")}; that one sets warm light from behind with a bright edge, this one the light changing as you watch, glowing skin and a few warm colors.`);
  plain("golden-hour", "Warm light from behind the people and a strong rim (a bright edge of light around them), as at the end of the day.");

  label("candlelit", "Candlelight on faces");
  label("candlelit-room", "A room lit by a few flames");
  addPlain("candlelit-room", `Close to ${name("candlelit")}; that one is the light on the faces, this one the whole room's few colors and glowing skin.`);

  label("silent-film-edit", "Silent film look (in the edit)");
  label("silent-film-homage", "Silent film homage (closing circle)");
  addPlain("silent-film-homage", `Close to ${name("silent-film-edit")}; this one adds the iris (a circle that closes on the last face).`);

  label("oner", "One smooth following shot (a oner)");
  plain("oner", "One smooth shot that follows the action with no cuts (a oner).");
  label("one-unbroken-shot", "One shot with hidden cuts");
  addPlain("one-unbroken-shot", `Close to ${name("oner")}; this one may hide real cuts and is used to keep the tension.`);

  label("snappy-cartoon", "Snappy cartoon moves");
  plain("snappy-cartoon", "Drawn on twos (a new pose every second frame), a big wind-up before each move, and a bounce at the end.");
  label("cartoon-bounce", "Rubbery cartoon bodies");
  addPlain("cartoon-bounce", `Close to ${name("snappy-cartoon")}; this one is about rubbery bodies and bouncing things, that one about timing.`);
  label("old-cartoon-bounce", "1930s rubber-hose cartoon");
  addPlain("old-cartoon-bounce", `Close to ${name("cartoon-bounce")}; this one is the old style of loops and curves.`);

  label("grounded-realism", "Grounded realism (how they move)");
  plain("grounded-realism", "Drawn on ones (a new pose every frame), a small wind-up before each move, and moves that settle into place.");
  label("heavy-and-real", "Heavy and real (weight and landing)");
  addPlain("heavy-and-real", `Close to ${name("grounded-realism")}; that one is the timing of moves, this one the weight of bodies and things.`);

  addPlain("mob-rule", `Close to ${name("mob-forms")}; that one is a crowd becoming one mind behind one voice, this one the rumor and copying that turn it on someone.`);
  addPlain("one-against-many", `Close to ${name("lone-voice")}; that one frames one person alone against the group, this one follows them winning the room over.`);
  addPlain("narrowing-in", `Close to ${name("tunnel-vision")}; that one has the camera narrow with them, this one is about the mind shutting everything else out.`);

  label("dramatic-dread", "We see the danger, they don't");
  addPlain("dramatic-dread", `Close to ${name("dramatic-irony")}; that one is any secret we know, this one is danger and the fear we feel for them.`);

  addPlain("door-slamming-farce", `Close to ${name("farce")}; this one is the doors-and-disguises kind, people missing each other by seconds.`);

  label("viral-edit", "Phone-video editing tricks");
  label("viral-short", "Viral short: hook and loop");
  addPlain("viral-short", `Close to ${name("viral-edit")}; that one is the editing tricks, this one the shape of the whole short (grab at the start, loop at the end).`);

  addPlain("reaction-comedy-edit", `Close to ${name("comedy-punch-edit")}; this one is built around a reaction face, that one around the editor's own jokes.`);

  label("music-video-cut", "Music video cutting");
  addPlain("montage-song", `Close to ${name("music-video-cut")}; this one is a song carrying time passing in a story, that one flashy cutting on the beat.`);

  addPlain("laughing-at-the-funeral", `Close to ${name("laughing-through-tears")}; this one is grief, that one any mixed sad and happy moment.`);
  addPlain("sad-clown", `Close to ${name("laughing-through-tears")}; this one is a person who jokes until the joke turns to real tears.`);

  addPlain("dry-double-act", `Close to ${name("straight-man-funny-man")}; this one is the dry back-and-forth of the two.`);
  addPlain("calm-in-the-madness", `Close to ${name("straight-man-funny-man")}; this one is one calm person against a whole room of chaos.`);

  addPlain("rapid-fire-banter", `Close to ${name("banter")}; this one is about speed and the cutting.`);
  addPlain("rom-com-banter", `Close to ${name("banter")}; this one is two opposites who like each other.`);

  addPlain("stranger-in-a-strange-land", `Close to ${name("fish-in-the-group")}; that one is one group, this one a whole strange world.`);
  addPlain("the-outsider", `Close to ${name("fish-in-the-group")}; this one is how the outsider is placed in the frame.`);

  addPlain("power-low", `Close to ${name("power-staging")}; this one is only the camera looking up.`);
  addPlain("looming-over", `Close to ${name("power-staging")}; this one uses height and nearness to the camera.`);

  label("hearth", "Fire lighting the room");
  addPlain("campfire-night", `Close to ${name("hearth")}; that one is a steady fire indoors, this one a fire in the dark outdoors with sparks and black shadows.`);

  addPlain("let-it-sink-in", `Close to ${name("breathing-room")}; this one holds on one face in silence, then cuts away.`);
  addPlain("a-scene-that-lingers", `Close to ${name("breathing-room")} and ${name("let-it-sink-in")}; this one is about the end of a scene and the feeling it leaves.`);

  addPlain("earned-release", `Close to ${name("the-breakdown")}; this one is the big release at the end of a long road, tied to an old hurt.`);

  addPlain("rock-bottom", `Close to ${name("hope-dies")}; that one is hope running out, this one how the lowest scene looks.`);

  addPlain("hazy-memory", `Close to ${name("faded-memory")}; that one is the color, this one the sound, the blur and the frame shape.`);
  addPlain("rose-tinted-past", `Close to ${name("faded-memory")}; this one remembers fondly, with an old tune coming back.`);

  addPlain("bundle-of-nerves", `Close to ${name("psyching-up")}; that one is getting ready alone, this one nerves that never settle.`);

  addPlain("the-floor-drops", `Close to ${name("dawning-realization")}; this one is the camera's trick: the push in and the stretching room.`);

  label("coverage", "Coverage (shots from every side)");
  plain("coverage", "The scene filmed from several angles, cutting between them on the lines.");
  addPlain("cut-on-the-words", `Close to ${name("coverage")}; this one chooses each shot for a line and lets the next voice start before the cut.`);

  addPlain("lens-feeling", `Mostly inside ${name("lens-emotion")}, which adds the body, voice, face and actions.`);
  addPlain("lens-period", `Shares half its members with ${name("lens-look")}; this one checks that everything belongs to one time.`);

  label("style-mockumentary", "Mockumentary (full style)");
  addPlain("style-mockumentary", `A longer version of ${name("mockumentary")}.`);
  label("style-musical-number", "Musical number (full style)");
  addPlain("style-musical-number", `A longer version of ${name("musical-number")}, with the camera and the light.`);

  /* Proximity suites that repeat an idea. */
  label("music-leads-the-edit", "Featured music drives the edit");
  addPlain("music-leads-the-edit", `Close to ${name("music-steers-edit")}; that one starts from the tempo and builds to silence, this one starts from featured music and ends in a fade out.`);

  label("emotion-steers-lens", "Feeling sets the camera height");
  plain("emotion-steers-lens", "When the feeling changes, the camera's height changes, and so does its attitude (gentle or aggressive).");
  addPlain("camera-follows-feeling", `Close to ${name("emotion-steers-lens")}; this one moves closer at the peak, tilts with dread and looks up when status flips.`);

  addPlain("secret-in-the-room", `Close to ${name("secrets-and-lies")}; that one follows a secret slipping and the setbacks, this one the outsider getting close.`);

  plain("noir-squeeze", "Side light, rising contrast, a dark picture (low key: mostly dark with deep shadows) and characters hiding what they mean: the classic crime-film tightening, starting from the light.");
  addPlain("hard-edge-grade", `Close to ${name("noir-squeeze")}; same ending, but this one starts in the edit.`);
  addPlain("dark-room-secrets", `Close to ${name("noir-squeeze")}; same ending, but this one starts from the set.`);

  label("light-follows-feeling", "Light follows loss and reunion");
  label("color-follows-feeling", "Color follows anger, fear and joy");
  addPlain("color-follows-feeling", `Close to ${name("light-follows-feeling")}; both share joy warming the light.`);

  addPlain("the-truth-comes-out-sideways", `Close to ${name("what-isnt-said")}; that one is about the face and the camera, this one about the lines.`);
  addPlain("farce-at-the-doors", `Close to ${name("farce-engine")}; this one is the doors and disguises kind.`);
  addPlain("sitcom-scene-shape", `Shares the topper pair with ${name("laugh-stack")}; this one is the shape of a whole sitcom scene.`);

  label("body-tells-the-line", "The body moves with the words");
  addPlain("body-tells-the-line", `Close in name to ${name("body-tells-first")}, which is the feeling showing before the words; this one is the body moving with them.`);

  addPlain("weather-and-surface", "Its toon line and impact shake pairs are not about weather; they may belong elsewhere.");

  /* Proximity pairs that run in opposite directions: both on makes a loop. */
  const loop = (a, b) => addPlain(b, `Runs the other way from ${name(a)}; with both on, each sets off the other in a loop.`);
  loop("face-tells-the-feeling", "mood-moves-the-feeling");
  loop("nervous-blinks-more", "no-blink-unsettling");
  loop("faster-scenes-more-tension", "tension-shortens-scenes");
  loop("fast-cuts-plain", "punchy-transitions-fast-reset");
  loop("dissent-pressure", "herd-quiet-dissent");
  loop("warm-reunion", "cold-light-pulls-apart");
  loop("heavy-side-story-joins-main", "joined-plots-raise-stakes");

  /* Proximities that mean the same (labels unchanged, so their "When ..., ..." halves stay as they are). */
  const same = (a, b, how) => addPlain(b, `Close to ${name(a)}${how ? "; " + how : ""}.`);
  same("secret-slips-cringe", "secret-cringe", "this one is the outsider getting close");
  same("decay-mood", "ruined-surfaces-gloom", `the same rule, starting from ${name("wear")} instead of ${name("setUpkeep")}`);
  same("tempo-cuts", "tempo-up-faster-cuts");
  same("fear-color-drains", "drain-on-loss", "this one starts from a loss rather than fear");
  same("warm-lamps-cozy", "very-warm-cozy", "this one is the color in the edit, that one the lamps on set");
  same("impact-shake", "crash-shake");
  same("wind-frizzes-hair", "wind-hair", "this one is the hair streaming, that one the hair frizzing");
  same("music-party-beat", "featured-music-pulse", "this one is any effect pulsing, that one flashes");
  same("payoff-sting", "payoff-sound-hit", "this one is a sound effect, that one a burst of music");
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
