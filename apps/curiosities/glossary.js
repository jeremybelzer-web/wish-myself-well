/* Words: a plain-language glossary for people who have never opened Maya, animated in 3D or worked on a film set.
   - window.CuriosityGlossary.terms: [{id, term, aka, cat, text, app}] (aka: other spellings that also match).
   - The first time a term shows up in each section of the page (a workspace part, a tool, a page) it gets a dotted
     underline. Hover it (mouse), tap it (phone) or focus it and press Enter: a small popover explains it.
     It closes on a tap outside, on Escape, or on a second tap.
   - A MutationObserver (throttled) marks newly drawn workspaces. It never marks inside inputs, selects, buttons,
     links, summaries, SVG, canvas or code, and it skips text that keeps changing (meters, "now playing" readouts).
   - window.CuriosityGlossary.mountList(el) draws the searchable Words page (with the hints switch).
   - Hints on or off is remembered in localStorage key curiosities-glossary-v1 ({hints: true|false}). */
(function () {
  "use strict";
  const KEY = "curiosities-glossary-v1";

  /* [term, other spellings ("|" separated), group, plain explanation, what it does in this app] */
  const RAW = [
    /* ---------- This app ---------- */
    ["curiosity", "curiosities", "This app", "One thing about a scene you can notice and measure: how close the camera is, whether someone crosses the room, whether music plays or the scene is silent.", "Everything here is built from curiosities. Each one has a scale of settings, from one end to the other, that you can set by hand or automate."],
    ["curiosity suite", "suite|suites", "This app", "A named group of curiosities that tend to show up together, like the ingredients of a recipe.", "A suite is graded: a panel can match 0% to 100% of it. It counts as present when at least half of it matches."],
    ["proximity", "proximities|curiosity proximity", "This app", "How closely curiosities are related, like branches and roots of one tree.", "The relationship map draws proximity as the web of lines around the curiosity you are inside. A proximity never sets anything off; a catalyst does."],
    ["catalyst", "catalysts", "This app", "In alchemy, the thing that makes a change happen. Here, anything that sets other curiosities off.", "A catalyst comes in two kinds: a spark (one thing sets things off) and an elixir (several ingredients must all line up)."],
    ["spark", "sparks", "This app", "A single catalyst: one thing sets everything off, like a crash cymbal, a word someone says or a MIDI note.", "A spark is \"when this happens, that happens soon after\", for example: someone lifts a cup, then the camera cuts closer within one beat. Each has a cause, a delay in beats, how often it holds and an effect, and all of these can be automated."],
    ["elixir", "elixirs", "This app", "A key catalyst: it only works once every ingredient is in, like a key whose ridges all fit the lock. Blue Steel is one: pursed lips, eyes to the camera, cheeks in.", "Each ingredient is a spark. Switch on Lock and the elixir fires only on panels where every ingredient is there."],
    ["beat", "beats", "This app", "The smallest piece of story time: one moment in which something changes. A scene is a string of beats.", "Spark delays are counted in beats, and a curated film is stored as a list of beats."],
    ["panel", "panels", "This app", "One box of a comic strip or one drawing of a storyboard: a single frozen moment of the scene.", "My film draws your scene as a row of panels; the workspace grids have one column per panel."],
    ["strand", "strands", "This app", "A run of values for one curiosity, one per panel or beat, like a single thread pulled out of a film.", "Keep a strand on the Shelf, then apply it to My film and the panels take its values in order."],
    ["Shelf", "", "This app", "A place to keep things you pulled out of films so you can use them later.", "The Shelf (in Curated films) holds strands you ticked in a study; apply one and the board plays it panel by panel."],
    ["Prism", "", "This app", "Like a glass prism that splits white light into colors, this splits a whole film into its separate parts.", "Pick a curated film and the Prism lists its curiosities, suites, sparks and elixirs. Drop any of them onto a moment of your own film."],
    ["cross-pollinate", "cross-pollinating|cross-pollination", "This app", "Borrowing a pattern from one film and planting it in your own, the way bees carry pollen from flower to flower.", "Every workspace has a Cross-pollinate part: pick a row from a film and it plays on the panels you choose."],
    ["lens", "lenses", "This app", "Two meanings. On a camera, the lens is the glass in front that gathers the light and decides how wide the view is. Here it also means a way of looking at a scene: through its color, its clothes, its comedy.", "A lens workspace asks one question at the top, has a main curiosity, and has sliders under it for the finer parts."],
    ["slider", "sliders", "This app", "A control you drag along a line to pick a value between two ends.", "In a lens, the sliders are the finer parts of its main curiosity, and each one can be automated as its own lane."],
    ["workspace", "workspaces", "This app", "A page set up for one kind of job, with the tools for that job in one place.", "Each workspace (Camera angle, Light & look, Effects…) has four parts: In my film, Automate, Cross-pollinate from a film, and Tools."],
    ["storyboard", "storyboards", "This app", "A series of simple drawings, one per shot, that shows how a film will look before anyone films it.", "The Storyboard tab keeps many scenes of My film and flips through them."],
    ["flip book", "flipbook", "This app", "A little book of drawings that seem to move when you flip the pages fast.", ""],
    ["comic strip", "", "This app", "A row of drawn panels that tells a moment in order.", "My film draws your scene as a comic strip."],
    ["zine", "zines", "This app", "A small, cheaply printed, self-made magazine, often photocopied and folded by hand.", "The Print tool lays your panels out as zine pages."],
    ["balloon", "balloons|speech balloon", "This app", "The bubble in a comic that holds what a character says.", ""],
    ["gutter", "gutters", "This app", "The empty gap between two comic panels. The reader's mind fills in what happens there.", ""],
    ["halftone", "", "This app", "A printing trick that makes shades out of dots of one ink: big dots look dark, small dots look light.", ""],

    /* ---------- Automation, sound and MIDI ---------- */
    ["automation", "automate|automated|automating", "Automation & MIDI", "Letting a setting change by itself over time, following a pattern, instead of turning it by hand each time.", "Every curiosity, suite, spark and elixir can be automated. Its switch turns it on and off; inside, lanes move its parts."],
    ["lane", "lanes", "Automation & MIDI", "In music software, one row that controls one setting over time.", "A lane moves one part of a curiosity between a \"from\" and a \"to\" setting, with its own curve and its own mover."],
    ["patch", "patches", "Automation & MIDI", "On a synthesizer, a patch is one saved setup: which parts are connected and how they are set.", "One automation setup for one curiosity, suite or spark: its two settings, its mover, its lanes and the panels it plays on."],
    ["patch bay", "", "Automation & MIDI", "A panel where all the cables of a studio meet so you can see and change every connection in one place.", "The Automation patch bay (Library) shows every automation at once."],
    ["modulator", "modulators|mover", "Automation & MIDI", "Anything that moves a setting automatically, like an invisible hand turning a knob.", "A lane can follow the main mover, run its own LFO, take a knob you turn by hand, or listen to MIDI CC."],
    ["switch", "switches", "Automation & MIDI", "A signal that starts something, like pressing a doorbell.", "A MIDI note, a key or a button turns an automation on or off. When it sets other curiosities off, it is a spark."],
    ["gate", "gates", "Automation & MIDI", "Two meanings. On a synthesizer, a gate is on only while you hold a key down, like a doorbell that rings while pressed. On a camera, the gate is the opening that sets the shape of the picture.", "Gate mode plays an automation only while you hold its switch; toggle mode flips it on and off with each press."],
    ["toggle", "toggles", "Automation & MIDI", "A switch that flips: press once for on, press again for off.", ""],
    ["MIDI", "", "Automation & MIDI", "The common language electronic instruments use to talk to each other: which note was played, how hard, and where each knob sits.", "Plug in a MIDI keyboard or controller and its notes can spark curiosities and its knobs can move them."],
    ["MIDI CC", "CC|CCs|out CC|control change", "Automation & MIDI", "A MIDI message that reports a knob or slider's position as a number from 0 to 127.", "A lane can follow an incoming CC, and can send its own position out as a CC to synths."],
    ["LFO", "LFOs|low-frequency oscillator", "Automation & MIDI", "Short for low-frequency oscillator: a slow, repeating wave that pushes a setting up and down by itself, like a tide coming in and out.", "The usual mover for automation. Set its shape (smooth, ramp, square, random), its rate (how fast) and its depth (how far)."],
    ["sine", "sine wave", "Automation & MIDI", "The smoothest wave there is: it glides up, slows at the top, glides down, slows at the bottom, over and over.", "An LFO shape that sweeps a curiosity gently back and forth."],
    ["BPM", "", "Automation & MIDI", "Beats per minute: how fast the music's pulse is. 60 BPM is one beat a second.", ""],
    ["Hz", "hertz", "Automation & MIDI", "Hertz: how many times something repeats each second. 2 Hz means twice a second.", ""],
    ["amplitude", "", "Automation & MIDI", "How big a wave is: how far it swings from the middle.", ""],
    ["frequency", "", "Automation & MIDI", "How often something repeats in a given time.", ""],
    ["phase", "", "Automation & MIDI", "Where a repeating wave is in its cycle right now: at the start, the top, halfway down…", ""],
    ["dB", "decibel|decibels", "Automation & MIDI", "Decibels: the unit for loudness. Every 6 dB more is roughly twice the signal strength.", ""],
    ["modular synth", "modular|modular synths", "Automation & MIDI", "A synthesizer built from separate boxes (modules) that you connect with cables in any order you like.", ""],
    ["VCV Rack", "VCV", "Automation & MIDI", "Free software that imitates a wall of modular synthesizer modules on your computer.", "Running automation can send its position out as MIDI CC, so VCV Rack can make sound follow your scene."],
    ["playhead", "", "Automation & MIDI", "The line that marks \"now\" on a timeline and moves as things play.", ""],
    ["scrub", "scrubbing", "Automation & MIDI", "Dragging the playhead back and forth by hand to look at a moment closely.", ""],
    ["loop", "loops|looping", "Automation & MIDI", "Playing a piece over and over from the start, without a gap.", ""],
    ["curve", "curves", "Automation & MIDI", "A line on a graph that shows how a value changes over time. Its shape decides whether the change is even, gentle or sudden.", "Each lane picks a curve between its from and to: linear, ease, in, out or steps."],
    ["linear", "", "Automation & MIDI", "Changing at one steady speed, with no speeding up or slowing down.", ""],
    ["ease", "ease in|ease out|ease-in|ease-out|slow in|slow out", "Automation & MIDI", "Starting slowly and/or finishing slowly, the way a car pulls away and pulls up, instead of jumping to full speed.", ""],
    ["stepped", "steps|stepping|stepped keys", "Animation", "Jumping from one value to the next with nothing in between, like a slideshow instead of a movie.", "In animation, animators often work stepped first to judge the main poses before smoothing them."],

    /* ---------- Camera and shots ---------- */
    ["shot", "shots", "Camera & shots", "One unbroken run of the camera, from when it starts to when the film cuts away.", ""],
    ["shot size", "", "Camera & shots", "How much of the person fills the picture, from a tiny figure in a landscape to just their eyes.", "Shot size runs from wide to close to insert, and you can automate a slide between them."],
    ["close-up", "closeup|close-ups|extreme close-up", "Camera & shots", "A shot where a face (or an object) fills most of the picture, so we read every small feeling.", ""],
    ["medium shot", "medium shots", "Camera & shots", "A shot that shows a person from about the waist up: close enough for faces, wide enough for hands.", ""],
    ["wide shot", "wide shots|long shot|establishing shot", "Camera & shots", "A shot that shows whole bodies and the place around them, so we know where we are.", ""],
    ["insert", "inserts|insert shot", "Camera & shots", "A very close shot of a detail: a hand on a doorknob, a text on a phone.", "Insert is the closest step of the shot size scale."],
    ["over-the-shoulder", "over-shoulder|over the shoulder", "Camera & shots", "A shot from behind one person's shoulder looking at the person they talk to.", ""],
    ["cowboy shot", "cowboy", "Camera & shots", "A shot cut off around mid-thigh, named after westerns where it showed the gun on the hip.", ""],
    ["coverage", "", "Camera & shots", "Filming the same scene from several angles and sizes so the editor has choices later.", "Coverage patterns (wide, medium, close, insert…) are curiosities you can set and automate."],
    ["camera angle", "angle height", "Camera & shots", "Where the camera sits compared with the subject: below looking up, level, or above looking down. It changes how powerful someone seems.", "The Camera angle workspace grades height from floor, low, eye, high, to overhead."],
    ["low angle", "low-angle", "Camera & shots", "The camera looks up at someone. They tend to seem bigger, stronger or more threatening.", ""],
    ["high angle", "high-angle", "Camera & shots", "The camera looks down on someone. They tend to seem smaller or weaker.", ""],
    ["eye level", "eye-level", "Camera & shots", "The camera is at the height of the person's eyes: the most neutral view.", ""],
    ["overhead", "bird's eye|top-down", "Camera & shots", "The camera looks straight down from above, like a map.", ""],
    ["dutch angle", "dutch|dutch tilt|canted", "Camera & shots", "The camera is tilted so the horizon is slanted. It makes a scene feel uneasy or off balance.", ""],
    ["POV", "point of view|point-of-view", "Camera & shots", "A point-of-view shot: we see exactly what a character sees, through their eyes.", ""],
    ["180-degree line", "180-degree rule|180 degree line|180 degree rule|axis of action|crossing the line", "Camera & shots", "An invisible line between two people talking. Keep the camera on one side of it, and they stay on their own sides of the picture from shot to shot.", "In the 3D view, More than one actor draws the line on the floor and turns it red when the camera crosses it."],
    ["eyeline", "eyelines", "Camera & shots", "The direction a character is looking. Matching eyelines across cuts makes two people seem to look at each other.", ""],
    ["blocking", "", "Camera & shots", "Two meanings. On set, it is planning where actors stand and move. In animation, it is the first rough pass with only the main poses.", ""],
    ["staging", "", "Camera & shots", "Arranging people, objects and camera so the audience notices the one thing that matters.", ""],
    ["handheld", "hand-held", "Camera & shots", "The camera is held by a person instead of resting on a stand, so it moves and shakes a little, like a witness.", "On the board, handheld draws a wobbly camera path."],
    ["locked", "locked-off|locked off", "Camera & shots", "The camera is fixed on a tripod and does not move at all.", "On the board, a locked camera is a still frame."],
    ["dolly", "dollies|dolly in|dolly out", "Camera & shots", "A small cart on wheels or rails that carries the camera smoothly toward, away from, or alongside the action.", ""],
    ["dolly zoom", "vertigo effect", "Camera & shots", "Moving the camera in while zooming out (or the reverse), so the person stays the same size but the background stretches or squeezes. It feels dizzying.", ""],
    ["push in", "push-in|pull out|pull-out", "Camera & shots", "Moving the camera slowly closer to (push in) or farther from (pull out) a subject, to build or release tension.", ""],
    ["pan", "pans|panning", "Camera & shots", "Turning the camera left or right while it stays in one place, like turning your head.", ""],
    ["tilt", "tilts|tilting", "Camera & shots", "Pointing the camera up or down while it stays in one place, like nodding.", ""],
    ["crane", "jib|crane shot", "Camera & shots", "A long arm that lifts the camera high and swings it through the air.", ""],
    ["zoom", "zooms|zooming", "Camera & shots", "Changing the lens's focal length so the picture gets closer or wider without moving the camera.", ""],
    ["tracking", "tracking shot", "Camera & shots", "The camera travels along with a moving person, keeping pace beside, ahead or behind.", ""],
    ["rack focus", "focus pull", "Camera & shots", "Shifting sharp focus from one thing to another during a shot, to move the audience's attention.", ""],
    ["montage", "montages", "Camera & shots", "A run of short shots cut together to squeeze time or build a feeling, like a training sequence.", ""],
    ["jump cut", "jump cuts", "Camera & shots", "A cut that skips ahead inside the same shot, so the person seems to jump. It feels abrupt or restless.", ""],
    ["match cut", "match cuts|smash cut", "Camera & shots", "A cut that links two shots by a shared shape or motion (a match cut), or that slams from one mood to another (a smash cut).", ""],
    ["transition", "transitions", "Camera & shots", "How one shot turns into the next: a plain cut, a fade, a dissolve, a wipe.", ""],
    ["dissolve", "dissolves|crossfade", "Camera & shots", "One shot slowly fades out while the next fades in on top of it.", ""],
    ["fade", "fades|fade out|fade in", "Camera & shots", "The picture slowly goes to black (or comes up from black).", ""],
    ["silhouette", "silhouettes", "Camera & shots", "A dark shape against a bright background, with no detail inside. A clear pose still reads in silhouette.", ""],
    ["foreground", "", "Camera & shots", "Whatever is closest to the camera, in front of the main action.", ""],
    ["parallax", "", "Camera & shots", "When the camera moves, near things slide past faster than far things. It is what makes a flat picture feel deep.", ""],
    ["foreshortening", "", "Camera & shots", "When something points at the camera it looks squashed and its near end looks huge, like a fist punching toward the lens.", ""],
    ["orthographic", "ortho", "Camera & shots", "A view with no perspective: far things are the same size as near things, like a blueprint.", ""],
    ["slow motion", "slow-motion|slow-mo", "Camera & shots", "Action shown slower than real life, by filming more pictures per second than are played back.", ""],
    ["frame", "frames", "Camera & shots", "One single still picture. A film is many frames shown quickly, one after another.", ""],
    ["frame rate", "fps|frames per second", "Camera & shots", "How many pictures are shown each second. Cinema uses 24; video often 25 or 30.", ""],
    ["aspect ratio", "", "Camera & shots", "The shape of the picture, width compared with height: square, TV-wide, cinema-wide.", ""],
    ["overscan", "", "Camera & shots", "Extra room shown around the picture's edge in the viewport so you can see what is just outside the frame.", ""],
    ["extras", "", "Camera & shots", "People in the background of a scene who do not have lines, like the diners in a restaurant.", "Background action is a workspace of its own."],
    ["wardrobe", "", "Camera & shots", "The clothes the characters wear, and the team that chooses them.", "The Wardrobe workspace looks at the main character's clothes and the background's clothes."],
    ["set dressing", "set design", "Camera & shots", "Everything placed on a set to make it feel real and say something: furniture, posters, clutter.", ""],

    /* ---------- Lens and camera body ---------- */
    ["focal length", "focal lengths", "Lens", "A lens's number in millimetres. Small numbers (18 mm) see wide and push the background away; big numbers (85 mm and up) see narrow and pull the background close.", "Change it in the Camera tool and watch the view widen or narrow."],
    ["telephoto", "long lens", "Lens", "A lens with a long focal length that magnifies far things and flattens depth.", ""],
    ["angle of view", "field of view", "Lens", "How wide a slice of the world the camera sees, measured as an angle.", ""],
    ["film back", "sensor|camera back", "Lens", "The size of the camera's sensor (or film). With the same lens, a bigger back sees more.", "The Camera tool offers real sizes (35 mm film, full frame…)."],
    ["film gate", "resolution gate|gate mask", "Lens", "The outline of the area the camera actually records. The gate mask darkens everything outside it.", ""],
    ["depth of field", "DOF", "Lens", "How much of the picture, from near to far, is sharp. Shallow means only a thin slice is sharp and the rest is soft.", "Turn it on in the Camera tool and set the focus distance and f-stop."],
    ["f-stop", "f-stops|f-number|aperture", "Lens", "The size of the lens opening, written as a number like f/2 or f/16. A small number lets in more light and blurs the background more.", ""],
    ["bokeh", "", "Lens", "The soft, blurry look of out-of-focus areas, especially the round blobs of light in the background.", ""],
    ["shutter", "shutter angle|shutter speed", "Lens", "How long each picture is exposed to light. Longer gives more motion blur; shorter freezes motion crisply.", ""],
    ["motion blur", "", "Lens", "The smear moving things leave in a single picture because they moved while it was taken. It makes motion feel smooth.", ""],
    ["exposure", "EV", "Lens", "How bright the picture comes out overall. Each step up (one stop, or EV) doubles the light.", ""],
    ["lens flare", "flare|flares", "Lens", "Streaks, rings or haze that appear when a bright light shines into the lens.", ""],
    ["near clip", "far clip|clipping plane|clipping planes", "Lens", "The closest and farthest distances a 3D camera can see. Anything outside them simply disappears.", ""],
    ["crop", "cropping", "Lens", "Cutting away the edges of a picture to change its shape or what is in it.", ""],

    /* ---------- Light and color ---------- */
    ["key light", "key lights", "Light & color", "The main light on a subject, the one that does most of the work and sets the mood.", ""],
    ["fill light", "fill lights", "Light & color", "A softer light that brightens the shadows the key light leaves, so they are not pitch black.", ""],
    ["rim light", "rim|rim lights|backlight|back light", "Light & color", "A light from behind that draws a bright edge around a person, separating them from the background.", ""],
    ["three-point lighting", "three-point", "Light & color", "The classic setup of key, fill and rim light together.", ""],
    ["high key", "high-key", "Light & color", "Bright, even lighting with few shadows: cheerful, open, like a sitcom.", ""],
    ["low key", "low-key", "Light & color", "Dark lighting with deep shadows and pools of light: mysterious, tense, like film noir.", ""],
    ["hard light", "soft light", "Light & color", "Hard light (a bare bulb, the noon sun) makes crisp, sharp shadows; soft light (a cloudy sky, a big diffuser) makes gentle ones.", ""],
    ["practical", "practicals|practical light", "Light & color", "A lamp you can see in the shot that also really lights the scene, like a desk lamp.", ""],
    ["color temperature", "colour temperature|Kelvin|K", "Light & color", "How warm (orange) or cool (blue) a light is, measured in Kelvin. Candles are about 1900 K, daylight about 5600 K, blue sky above 8000 K.", ""],
    ["saturation", "saturated|desaturated", "Light & color", "How strong a color is: from gray (none) to vivid (full).", ""],
    ["hue", "hues", "Light & color", "Which color it is (red, orange, green…), separate from how bright or how strong it is.", ""],
    ["contrast", "", "Light & color", "How far apart the darkest and brightest parts are. High contrast is punchy; low contrast is soft and flat.", ""],
    ["palette", "palettes", "Light & color", "The small set of colors a scene or film keeps choosing.", ""],
    ["color grade", "color grading|colour grade|LUT", "Light & color", "Adjusting the colors and brightness of finished footage to set its mood. A LUT is a saved color recipe.", ""],
    ["vignette", "vignetting", "Light & color", "Darkening toward the corners of the picture, which pulls the eye to the middle.", ""],
    ["film grain", "grain", "Light & color", "The fine, speckled texture of real film, sometimes added on purpose for character.", ""],
    ["haze", "fog|atmosphere|atmospheric", "Light & color", "Thin smoke or mist in the air that makes light beams visible and softens distance.", ""],
    ["bounce", "bounce light", "Light & color", "Light that hits a surface and reflects onto something else, picking up that surface's color. In a simulation, bounce is how springy a collision is.", ""],
    ["skydome", "skydome light|Physical Sky", "Light & color", "A light shaped like a giant dome around the whole scene that lights it like the sky does.", ""],
    ["area light", "area lights", "Light & color", "A light shaped like a flat panel, like a window or a softbox. Bigger panels give softer shadows.", ""],
    ["spot light", "spotlight|spot lights", "Light & color", "A light that shines in a cone, like a stage spotlight.", ""],
    ["point light", "point lights", "Light & color", "A light that shines out in every direction from one tiny point, like a bare bulb.", ""],
    ["directional light", "directional", "Light & color", "Light that comes in parallel from one direction, like the sun: same strength everywhere.", ""],
    ["mesh light", "", "Light & color", "Any 3D shape turned into a light, like a neon sign.", ""],
    ["light group", "light groups", "Light & color", "A set of lights saved into its own picture during rendering, so each group's brightness can be changed afterward.", ""],
    ["toon", "toon shader|cel|cel shading|cel-shaded", "Light & color", "A look that makes 3D render like a cartoon: flat bands of color and drawn outlines.", ""],
    ["outline", "outlines|contour", "Light & color", "The drawn ink line around a shape in a cartoon look.", ""],
    ["posterize", "posterized", "Light & color", "Reducing an image to a few flat steps of color, like a screen-printed poster.", ""],

    /* ---------- Animation ---------- */
    ["keyframe", "keyframes|key frame|key frames|keyed", "Animation", "A moment where the animator sets a value by hand. The computer fills in the frames between keyframes.", ""],
    ["in-between", "in-betweens|inbetween|inbetweens|tween", "Animation", "The frames that sit between two key poses and carry the motion from one to the other.", ""],
    ["breakdown", "breakdowns", "Animation", "A key pose between two main poses that decides how the motion gets from one to the other.", ""],
    ["tangent", "tangents", "Animation", "The handle on a keyframe that decides how the motion enters and leaves it: smooth, straight, flat or stepped.", "The Curves and Motion tools let you pick the tangent and see the motion change."],
    ["spacing", "", "Animation", "How far something moves from one frame to the next. Close spacing looks slow; wide spacing looks fast.", ""],
    ["timing", "", "Animation", "How many frames an action takes. The same move in 6 frames feels snappy and in 24 feels lazy.", ""],
    ["anticipation", "", "Animation", "A small move the opposite way before the main action, like crouching before a jump. It tells the audience what is coming.", ""],
    ["overshoot", "overshoots", "Animation", "Going a little past the final position and settling back, like a door that swings past and returns.", ""],
    ["squash and stretch", "squash|stretch", "Animation", "Things flatten when they hit and lengthen when they speed, like a bouncing ball. It makes motion feel alive and springy.", ""],
    ["follow-through", "follow through|overlap|overlapping action", "Animation", "Parts keep moving after the body stops (hair, coat tails), and different parts move at different times.", ""],
    ["arc", "arcs", "Animation", "Living things move along curved paths, not straight lines. In story, an arc is how a character changes.", ""],
    ["smear", "smears", "Animation", "A stretched, blurred drawing used for one frame of a very fast move.", ""],
    ["ghosting", "ghost|ghosts|onion skin|onion skinning", "Animation", "Showing faint copies of the frames before and after the current one so you can see the motion's shape.", ""],
    ["pose", "poses|posing", "Animation", "The position of a whole body at one moment. Strong animation is built from clear poses.", ""],
    ["pose to pose", "straight ahead", "Animation", "Two ways to animate: set the main poses first and fill in between (pose to pose), or animate frame after frame from the start (straight ahead).", ""],
    ["Motion Trail", "motion path|motion trails", "Animation", "A line drawn in the scene that shows the path an object travels over time.", ""],
    ["cycle", "cycles|walk cycle", "Animation", "An animation that ends where it began so it can repeat forever, like a walk.", ""],
    ["retime", "retiming|Time Warp", "Animation", "Changing the speed of an animation after it is made: speeding parts up, slowing parts down. Time Warp is Maya's tool for it.", ""],
    ["blend shape", "blend shapes|Shape Editor", "Animation", "A saved alternate version of a face or object (a smile, a blink) that you can dial in from 0 to 100%.", "The Face tool mixes blend shapes for each beat."],
    ["lip sync", "lip-sync|lipsync", "Animation", "Making a character's mouth move to match the words being spoken.", ""],
    ["phoneme", "phonemes|viseme|visemes", "Animation", "The basic sounds of speech, and the mouth shapes that go with them (visemes).", ""],
    ["pose library", "", "Animation", "A saved collection of poses (hands, faces, stances) you can apply with one click.", ""],
    ["rig", "rigs|rigging|rigged", "Animation", "The hidden skeleton and controls inside a 3D character that let an animator pose it, like strings on a puppet.", ""],
    ["skeleton", "skeletons|bone|bones", "Animation", "The chain of invisible bones inside a 3D character. Move a bone and the body around it moves, like a puppet on a frame.", "In the 3D view, Show the skeleton draws it; made-from-words characters hang their shapes on it."],
    ["joint", "joints", "Animation", "A bone pivot in a rig, like a shoulder or knee, that parts of the body rotate around.", ""],
    ["FK", "forward kinematics", "Animation", "Forward kinematics: posing a limb by rotating each joint in turn from the body outward: shoulder, then elbow, then wrist.", ""],
    ["IK", "inverse kinematics|HumanIK", "Animation", "Inverse kinematics: you drag the hand or foot to where it should go and the computer bends the joints to reach it.", ""],
    ["pole vector", "pole vectors", "Animation", "A control that says which way a bent knee or elbow points.", ""],
    ["constraint", "constraints|constrained", "Animation", "A rule that makes one object follow another, like a hand gripping a cup or eyes aiming at a target.", ""],
    ["pivot", "pivots", "Animation", "The point an object turns and scales around, like the hinge of a door.", ""],
    ["puppeteering", "puppeteer|puppet|puppets", "Animation", "Moving a character live with a controller or mouse, the way a puppeteer works a puppet, and recording it.", ""],
    ["motion capture", "mocap", "Animation", "Recording a real actor's movement with sensors and putting it on a digital character.", ""],
    ["Set Driven Key", "driven key|driven keys|driver|drivers", "Maya", "A Maya way to link settings: when one control (the driver) moves, others follow in the ways you set, like a dimmer that also tints the light.", "The Curves tool links curiosities this way: one drives the others."],

    /* ---------- Maya ---------- */
    ["Maya", "Autodesk Maya", "Maya", "Professional software for making 3D animation, used for films, TV and games.", "The Studio tools are small working versions of Maya features, explained in plain words."],
    ["Graph Editor", "", "Maya", "Maya's window that draws each animated value as a curve over time, so you can reshape the motion by moving the curve.", "The Curves tool is a small Graph Editor."],
    ["Dope Sheet", "dopesheet", "Maya", "Maya's window that shows keyframes as blocks on a grid of time, good for sliding timing around without looking at curves.", ""],
    ["time slider", "timeline", "Maya", "The strip at the bottom of Maya with frame numbers that you drag to move through time.", ""],
    ["playblast", "playblasts", "Maya", "A quick, rough video of your animation straight from the work view, to check timing before a full render.", ""],
    ["Camera Sequencer", "sequencer", "Maya", "Maya's tool for lining up shots from different cameras in order, like a simple editing timeline.", "The Shots tool works like it."],
    ["Time Editor", "", "Maya", "Maya's tool for treating animation as clips you can loop, blend, speed up and rearrange.", ""],
    ["viewport", "viewports|Viewport 2.0", "Maya", "The window in Maya where you look at and move around your 3D scene while you work.", ""],
    ["Look Through", "look through", "Maya", "A Maya command that shows the scene through a chosen camera or light.", ""],
    ["node", "nodes", "Maya", "A box of settings in Maya. Scenes are networks of nodes wired to each other.", ""],
    ["attribute", "attributes", "Maya", "One setting on a node, like height, color or speed.", ""],
    ["Hypershade", "", "Maya", "Maya's window for building materials by wiring nodes together.", ""],
    ["Outliner", "", "Maya", "Maya's list of everything in the scene, in a tree.", ""],
    ["channel box", "", "Maya", "Maya's side panel that lists the numbers of the selected object (move, rotate, scale) so you can type them.", ""],
    ["hierarchy", "hierarchies", "Maya", "A family tree of objects: move the parent and its children come along.", ""],
    ["transform", "transforms|translate|rotate", "Maya", "Moving (translate), turning (rotate) or resizing (scale) an object.", ""],
    ["MASH", "", "Maya", "A Maya toolkit for making and animating many copies of something at once: crowds, swarms, patterns.", "The Crowd tool uses MASH ideas (distribute, random, offset)."],
    ["XGen", "", "Maya", "Maya's system for growing hair, fur and grass on surfaces.", ""],
    ["groom", "grooms|grooming", "Maya", "Combing and styling digital hair or fur: its length, clumps, curl and frizz.", ""],
    ["clump", "clumps|clumping", "Maya", "Hairs gathering into bunches, the way wet hair does.", ""],
    ["frizz", "", "Maya", "Small random kinks that make hair look flyaway or messy.", ""],
    ["nHair", "", "Maya", "Maya's tool that makes hair move by itself with gravity, wind and collisions.", ""],
    ["nCloth", "", "Maya", "Maya's cloth simulator: fabric that drapes, folds and flutters by itself.", ""],
    ["nParticle", "nParticles|particle|particles", "Maya", "Tiny points that fly by physics rules, used for sparks, rain, dust and splashes.", ""],
    ["Nucleus", "", "Maya", "Maya's shared physics engine that moves nCloth, nHair and nParticles together.", ""],
    ["Bifrost", "Bifrost graph", "Maya", "Maya's toolkit for big effects like water, smoke, fire and sand, built by wiring nodes together.", "The Bifrost tool turns its effects into curiosities."],
    ["simulation", "simulations|simulate|simulated", "Maya", "Letting the computer work out motion with physics instead of animating it by hand.", ""],
    ["solver", "solvers", "Maya", "The part of the software that does the physics math, step by step.", ""],
    ["cache", "caches|cached", "Maya", "A saved recording of a simulation so it plays back instantly instead of being calculated again.", ""],
    ["emitter", "emitters", "Maya", "The source that spits out particles, smoke or liquid.", ""],
    ["collider", "colliders|collision", "Maya", "An object that simulated things bump into and bounce off.", ""],
    ["turbulence", "", "Maya", "Random swirling forces, like gusty air.", ""],
    ["voxel", "voxels", "Maya", "A tiny 3D box, like a pixel with depth. Smoke and liquids are calculated on a grid of voxels.", ""],
    ["rigid body", "rigid bodies", "Maya", "A simulated solid object that does not bend, like a brick or a billiard ball.", ""],
    ["damping", "", "Maya", "How quickly motion dies down, like a shock absorber.", ""],
    ["stiffness", "", "Maya", "How much something resists bending: silk bends easily, leather does not.", ""],
    ["friction", "", "Maya", "How much surfaces grip each other instead of sliding.", ""],

    /* ---------- Rendering (Arnold) ---------- */
    ["render", "renders|rendering|rendered", "Rendering", "Turning a 3D scene into final pictures, working out how every bit of light behaves.", ""],
    ["Arnold", "", "Rendering", "The renderer built into Maya: the program that calculates the final, realistic pictures.", "The Light & look, Shading and Passes tools use Arnold's names."],
    ["render layer", "render layers|Render Setup", "Rendering", "A version of the scene rendered separately, like only the characters or only the background, so they can be adjusted apart.", ""],
    ["AOV", "AOVs", "Rendering", "Short for arbitrary output variable: one ingredient of the final picture saved on its own, like just the shadows or just the shine.", "The Passes tool treats each one as a curiosity pass."],
    ["beauty", "beauty pass", "Rendering", "The full, finished picture with every ingredient together.", ""],
    ["composite", "compositing|comp", "Rendering", "Stacking separate layers and passes into one final picture, adjusting each.", ""],
    ["matte", "mattes|holdout", "Rendering", "A black-and-white mask that marks which area to keep or cut out.", ""],
    ["Cryptomatte", "", "Rendering", "A special pass that makes it easy to select any object by clicking it later.", ""],
    ["alpha", "alpha channel", "Rendering", "The invisible part of an image that stores how see-through each pixel is.", ""],
    ["EXR", "OpenEXR", "Rendering", "An image file type that holds many passes and very bright and dark values in one file.", ""],
    ["shader", "shaders|shading|material|materials|Standard Surface", "Rendering", "The recipe for what a surface is made of: its color, shine, roughness, see-through-ness.", ""],
    ["diffuse", "", "Rendering", "The soft, matte color of a surface when light scatters off it evenly.", ""],
    ["specular", "", "Rendering", "The shiny highlight, the glint of light reflecting off a surface.", ""],
    ["roughness", "", "Rendering", "How blurry a surface's reflections are: a mirror is 0, chalk is near 1.", ""],
    ["subsurface", "subsurface scattering|SSS", "Rendering", "Light that sinks into a material and glows out nearby, like skin, wax or a grape held to the light.", ""],
    ["transmission", "", "Rendering", "Light passing through a material, like glass or water.", ""],
    ["clearcoat", "clear coat|coat weight", "Rendering", "A thin glossy layer on top of a surface, like varnish on wood or lacquer on a car.", ""],
    ["emission", "emissive", "Rendering", "A surface that gives off its own light, like a screen or a glowing sign.", ""],
    ["metalness", "metallic", "Rendering", "How much a surface behaves like metal, which reflects in its own color.", ""],
    ["IOR", "index of refraction", "Rendering", "Index of refraction: how much a clear material bends light. Water is about 1.33, glass about 1.5.", ""],
    ["bump", "bump map|bumps", "Rendering", "A trick that makes a smooth surface look bumpy by changing its shading, without changing its shape.", ""],
    ["displacement", "", "Rendering", "Actually pushing a surface in and out using a picture, so its shape changes.", ""],
    ["UV", "UVs", "Rendering", "The flat map that says how a 2D picture wraps onto a 3D shape, like a gift wrapper unfolded.", ""],
    ["texture", "textures", "Rendering", "A picture laid onto a 3D surface to give it detail: wood grain, freckles, rust.", ""],
    ["albedo", "", "Rendering", "The plain base color of a surface, without any light or shadow.", ""],
    ["noise", "", "Rendering", "Random grainy speckles. In a render, it shows the picture needs more samples; in hair or motion, it adds natural irregularity.", ""],
    ["AA", "camera AA|anti-aliasing|samples|sampling", "Rendering", "How many tries the renderer takes per pixel. More samples give smoother, cleaner pictures and take longer.", ""],
    ["melanin", "", "Rendering", "The pigment in real hair. In Arnold's hair shader, more melanin makes hair darker, from blond to black.", ""],

    /* ---------- Story and comedy ---------- */
    ["character arc", "", "Story & comedy", "How a character changes from the start of the story to the end.", "The Character arc workspace tracks each character's arc stage scene by scene."],
    ["arc stage", "arc stages", "Story & comedy", "Where a character is along their change right now: before, starting, struggling, changed.", ""],
    ["archetype", "archetypes", "Story & comedy", "A familiar character type everyone recognizes: the mentor, the trickster, the hero.", ""],
    ["Enneagram", "", "Story & comedy", "A system describing nine personality types, each with its own fears and wants. Writers use it to keep characters consistent.", "The Archetype workspace lets you set each character's type and how healthy they are."],
    ["herd mentality", "", "Story & comedy", "People going along with a group instead of thinking for themselves.", ""],
    ["mentor", "mentors", "Story & comedy", "An older or wiser character who guides the hero.", ""],
    ["foil", "foils", "Story & comedy", "A character whose opposite traits make another character stand out more clearly.", ""],
    ["antagonist", "antagonists", "Story & comedy", "The person or force working against the main character.", ""],
    ["deadpan", "", "Story & comedy", "Saying something funny with a perfectly straight, blank face.", ""],
    ["escalation", "escalate|escalating", "Story & comedy", "Each step of a joke or problem getting bigger than the last.", ""],
    ["callback", "callbacks", "Story & comedy", "A joke that refers back to something from earlier, rewarding people who remember.", ""],
    ["double take", "spit take", "Story & comedy", "A delayed second look of surprise (double take), or spraying out a drink in shock (spit take).", ""],
    ["slapstick", "pratfall|pratfalls", "Story & comedy", "Physical comedy: falls, bumps, chases, pies in the face.", ""],
    ["absurd", "absurdity", "Story & comedy", "Comedy from things that make no sense, played as if they were normal.", ""],
    ["irony", "ironic", "Story & comedy", "When what happens is the opposite of what was expected or said.", ""],
    ["gag", "gags", "Story & comedy", "A single joke or bit of comic business.", ""]
  ];

  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const terms = RAW.map(([term, aka, cat, text, app]) => ({ id: slug(term), term, aka: aka ? aka.split("|") : [], cat, text, app }));
  const byId = new Map(terms.map((t) => [t.id, t]));

  /* ---------- Settings ---------- */
  function readPrefs() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
  }
  function writePrefs(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private window: keep in memory */ } }
  let prefs = Object.assign({ hints: true }, readPrefs());

  /* ---------- Matching ---------- */
  /* Short all-capital words (IK, FK, AOV, MIDI, CC, EV, K…) match only in capitals so "cc" in a word or "k" never match. */
  const patterns = new Map(); /* lowercased pattern -> {id, exact|null} */
  terms.forEach((t) => {
    [t.term].concat(t.aka).forEach((p) => {
      const lower = p.toLowerCase();
      if (patterns.has(lower)) return;
      const caps = p === p.toUpperCase() && /[A-Z]/.test(p) && p.length <= 6;
      patterns.set(lower, { id: t.id, exact: caps ? p : null });
    });
  });
  /* Drop a lone "K" (Kelvin): too risky in running text. */
  patterns.delete("k");
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alts = Array.from(patterns.keys()).sort((a, b) => b.length - a.length).map(esc).join("|");
  const RE = new RegExp("(?<![\\w-])(" + alts + ")(?:s|es)?(?![\\w-])", "gi");
  const QUICK = /[A-Za-z]{2}/;

  /* ---------- Styles ---------- */
  function injectStyle() {
    if (document.getElementById("glossary-style")) return;
    const st = document.createElement("style");
    st.id = "glossary-style";
    st.textContent = `
      .gl-term { text-decoration: underline dotted; text-decoration-color: var(--saffron, #c45c26); text-decoration-thickness: 1.5px; text-underline-offset: 3px; cursor: help; border-radius: 2px; }
      .gl-term:hover, .gl-term[aria-expanded="true"] { background: rgba(196, 92, 38, 0.12); }
      .gl-term:focus-visible { outline: 2px solid var(--saffron, #c45c26); outline-offset: 1px; }
      .gl-pop { position: fixed; z-index: 60; width: max-content; max-width: min(320px, calc(100vw - 24px)); background: var(--panel, #fffaf2); color: var(--ink, #1c1712); border: 2px solid var(--ink, #1c1712); box-shadow: 4px 4px 0 rgba(28, 23, 18, 0.25); padding: 9px 11px 8px; font-family: var(--sans, sans-serif); font-size: 14px; line-height: 1.4; text-transform: none; letter-spacing: 0; text-align: left; }
      .gl-pop[hidden] { display: none; }
      .gl-pop .gl-h { display: flex; gap: 8px; align-items: baseline; justify-content: space-between; margin: 0 0 3px; }
      .gl-pop .gl-h b { font-family: var(--serif, serif); font-weight: 500; font-size: 16px; }
      .gl-pop .gl-cat { font-family: var(--mono, monospace); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--saffron, #c45c26); white-space: nowrap; }
      .gl-pop p { margin: 0 0 5px; }
      .gl-pop .gl-app { border-left: 3px solid var(--saffron, #c45c26); padding-left: 7px; font-size: 13px; }
      .gl-pop .gl-foot { display: flex; justify-content: flex-end; margin-top: 4px; }
      .gl-pop .gl-foot button { font-family: var(--mono, monospace); font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; background: none; border: 1px solid var(--line, #ccc); padding: 2px 6px; cursor: pointer; color: inherit; }
      .gl-list { min-width: 0; }
      .gl-list h3 { font-family: var(--serif, serif); font-weight: 500; font-size: 20px; margin: 0 0 6px; }
      .gl-list .gl-intro { margin: 0 0 10px; max-width: 62ch; }
      .gl-list .gl-bar { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; margin: 0 0 10px; }
      .gl-list .gl-bar input[type=search] { flex: 1 1 220px; min-width: 0; max-width: 360px; font: inherit; padding: 6px 8px; border: 2px solid var(--ink, #1c1712); background: #fff; }
      .gl-list .gl-bar select { width: auto; max-width: 100%; font: inherit; padding: 5px; }
      .gl-list .gl-bar label { display: inline-flex; gap: 6px; align-items: center; font-family: var(--mono, monospace); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      .gl-list .gl-count { font-family: var(--mono, monospace); font-size: 11px; color: #7a6f63; }
      .gl-list .gl-sec { font-family: var(--mono, monospace); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--saffron, #c45c26); margin: 14px 0 4px; border-bottom: 1px solid var(--line, #ddd); padding-bottom: 2px; }
      .gl-list dl { margin: 0; display: grid; grid-template-columns: minmax(0, 180px) minmax(0, 1fr); gap: 6px 14px; }
      .gl-list dt { font-weight: 500; overflow-wrap: anywhere; }
      .gl-list dt small { display: block; font-family: var(--mono, monospace); font-size: 10px; color: #7a6f63; font-weight: 400; }
      .gl-list dd { margin: 0; overflow-wrap: anywhere; }
      .gl-list dd .gl-app { display: block; font-size: 13px; color: #3a3229; margin-top: 2px; }
      .gl-list mark { background: rgba(196, 92, 38, 0.2); color: inherit; }
      @media (max-width: 600px) { .gl-list dl { grid-template-columns: minmax(0, 1fr); gap: 2px; } .gl-list dd { margin-bottom: 8px; } }
    `;
    document.head.appendChild(st);
  }

  /* ---------- Marking ---------- */
  /* Never inside these. Interactive parents ([role=button], [tabindex], [draggable]) are skipped too so a hint
     never steals a click that belongs to the control around it. */
  const SKIP = "input,select,textarea,option,button,a,summary,label > select,svg,canvas,code,pre,kbd,samp,script,style,noscript,output,meter,progress,[contenteditable],[role=button],[role=tab],[role=slider],[tabindex],[draggable=true],[data-gl-skip],[data-gl-hot],.gl-term,.gl-pop,.ws-now,.ws-tag,nav,header,h1";
  const HOT_MS = 1500; /* an element changed in this many separate bursts within this window is "live" */
  const HOT_HITS = 4;
  const hot = new Map(); /* element -> [timestamps of mutation bursts] */
  const stats = { runs: 0, last: 0, max: 0, marked: 0 };

  /* Very common app words get one hint per page (the open view), the rest one per section. */
  const PAGE_ONCE = new Set(["lens", "curve", "panel", "workspace", "beat", "curiosity", "curiosity-suite", "proximity", "catalyst", "spark", "elixir", "lane", "automation", "patch", "slider", "strand", "frame", "shot", "render", "pose", "midi", "midi-cc", "lfo", "hz", "loop", "linear", "ease", "switch", "toggle", "gate", "maya", "arnold", "storyboard", "shelf", "prism", "comic-strip"]);
  function sectionOf(el) {
    return el.closest(".ws-part, .ws-lens, .ws-tool, main > section, .gl-sec-root") || document.body;
  }
  function pageOf(el) {
    return el.closest("main > section") || document.body;
  }

  /* Clickable: never put a hint inside something you click, so a hint can never swallow that click.
     Cached per element (cursor is inherited, so a child of a pointer element is pointer too). */
  const CLICK_ROLES = /^(button|tab|option|link|menuitem|menuitemradio|menuitemcheckbox|checkbox|radio|switch|treeitem|gridcell|row)$/;
  const SMALL_TAGS = /^(SPAN|B|I|EM|STRONG|SMALL|LI|TR|TD|TH|DT|DD|IMG|FIGURE|MARK|U|S|SUP|SUB)$/;
  let clickCache = new WeakMap();
  function hasDataTarget(el) {
    for (const k in el.dataset) if (!/^gl/.test(k)) return true;
    return false;
  }
  /* Structure (label, click roles, small elements carrying data-* targets) is checked up the ancestors;
     the cursor only on the text's own parent, since cursor is inherited from any pointer ancestor. */
  function structClickable(el, stop) {
    if (!el || el === stop || el === document.body || el.nodeType !== 1) return false;
    const c = clickCache.get(el);
    if (c !== undefined) return c;
    const role = el.getAttribute("role");
    const v = el.tagName === "LABEL" || (role && CLICK_ROLES.test(role)) || !!el.onclick || el.hasAttribute("onclick") ||
      (SMALL_TAGS.test(el.tagName) && hasDataTarget(el)) || structClickable(el.parentElement, stop);
    clickCache.set(el, v);
    return v;
  }
  let cursorCache = new WeakMap();
  function isClickable(el, stop) {
    if (structClickable(el, stop)) return true;
    let cur = cursorCache.get(el);
    if (cur === undefined) { cur = getComputedStyle(el).cursor; cursorCache.set(el, cur); }
    return cur === "pointer" || cur === "grab" || cur === "move";
  }

  function markRoot(root, doneMap) {
    const stop = pageOf(root);
    const doneFor = (box) => {
      let d = doneMap.get(box);
      if (!d) {
        d = new Set();
        box.querySelectorAll(".gl-term").forEach((s) => d.add(s.dataset.gl));
        doneMap.set(box, d);
      }
      return d;
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const v = n.nodeValue;
        if (!v || v.length < 2 || !QUICK.test(v)) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || p.closest(SKIP) || isClickable(p, stop)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const jobs = [];
    let n, lastParent = null, secDone = null, pageDone = null;
    while ((n = walker.nextNode())) {
      const v = n.nodeValue;
      if (n.parentElement !== lastParent) {
        lastParent = n.parentElement;
        secDone = doneFor(sectionOf(lastParent));
        pageDone = doneFor(pageOf(lastParent));
      }
      RE.lastIndex = 0;
      let m, hits = null;
      while ((m = RE.exec(v))) {
        const info = patterns.get(m[1].toLowerCase());
        if (!info || (info.exact && m[1] !== info.exact)) continue;
        const once = PAGE_ONCE.has(info.id);
        if (once ? pageDone.has(info.id) : secDone.has(info.id)) continue;
        /* a hidden element (display:none tab) is still marked: it is shown later, and it keeps the first-use rule simple */
        secDone.add(info.id);
        pageDone.add(info.id);
        (hits || (hits = [])).push([m.index, m[0].length, info.id]);
      }
      if (hits) jobs.push([n, hits]);
    }
    jobs.forEach(([node, hits]) => {
      const v = node.nodeValue;
      const frag = document.createDocumentFragment();
      let at = 0;
      hits.forEach(([i, len, id]) => {
        if (i > at) frag.appendChild(document.createTextNode(v.slice(at, i)));
        const s = document.createElement("span");
        s.className = "gl-term";
        s.dataset.gl = id;
        s.tabIndex = 0;
        s.setAttribute("role", "button");
        s.setAttribute("aria-expanded", "false");
        s.setAttribute("aria-label", v.slice(i, i + len) + ": what does this mean?");
        s.textContent = v.slice(i, i + len);
        frag.appendChild(s);
        at = i + len;
        stats.marked++;
      });
      if (at < v.length) frag.appendChild(document.createTextNode(v.slice(at)));
      if (node.parentNode) node.parentNode.replaceChild(frag, node);
    });
  }

  let observer = null, pending = new Set(), timer = 0, timerDue = 0, lastRun = 0;
  const THROTTLE = 250;

  function scope() { return document.querySelector("main") || document.body; }

  function isHot(el, now) {
    const t = hot.get(el);
    return !!t && t.length >= HOT_HITS && now - t[t.length - 1] < HOT_MS;
  }

  function run() {
    timer = 0;
    if (!prefs.hints) { pending.clear(); return; }
    const t0 = performance.now();
    const now = Date.now();
    lastRun = now;
    /* Cool down: a live element that has been quiet for HOT_MS loses its mark and is scanned again. */
    let retry = false;
    hot.forEach((times, el) => {
      if (!el.isConnected) { hot.delete(el); return; }
      if (now - times[times.length - 1] >= HOT_MS) {
        if (el.hasAttribute("data-gl-hot")) { el.removeAttribute("data-gl-hot"); pending.add(el); }
        hot.delete(el);
      } else retry = true;
    });
    const roots = Array.from(pending).filter((el) => el.isConnected && el.nodeType === 1);
    pending.clear();
    const keep = roots.filter((el) => !roots.some((o) => o !== el && o.contains(el)));
    const sectionDone = new Map();
    clickCache = new WeakMap(); cursorCache = new WeakMap(); /* styles can change between redraws; one cache per pass */
    if (observer) observer.disconnect();
    try {
      keep.forEach((el) => {
        if (el.closest("[data-gl-hot]") || isHot(el, now)) { retry = true; return; }
        markRoot(el, sectionDone);
      });
    } catch (e) { /* never break the page over a hint */ }
    connect();
    const dt = performance.now() - t0;
    stats.runs++; stats.last = Math.round(dt * 10) / 10; stats.max = Math.max(stats.max, stats.last);
    if (retry) schedule(null, HOT_MS + 50);
  }

  function schedule(el, wait) {
    if (el) pending.add(el);
    const gap = wait != null ? wait : Math.max(0, THROTTLE - (Date.now() - lastRun));
    const due = Date.now() + gap;
    /* keep the earliest run: a slow cool-down retry never holds back a fresh redraw */
    if (timer && due >= timerDue) return;
    if (timer) clearTimeout(timer);
    timerDue = due;
    timer = setTimeout(run, gap);
  }

  function onMutations(records) {
    const now = Date.now();
    const seen = new Set();
    records.forEach((r) => {
      let el = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      if (!el || (pop && pop.contains(el))) return;
      /* Our own spans being removed by the app's redraw are not "live" text. */
      if (r.type === "childList" && r.addedNodes.length === 0) {
        const onlyOurs = Array.from(r.removedNodes).every((x) => x.nodeType === 1 && x.classList && x.classList.contains("gl-term"));
        if (onlyOurs) return;
      }
      if (!seen.has(el)) {
        seen.add(el);
        let t = hot.get(el);
        if (!t) { t = []; hot.set(el, t); }
        t.push(now);
        while (t.length && now - t[0] > HOT_MS) t.shift();
        if (t.length >= HOT_HITS && !el.hasAttribute("data-gl-hot")) {
          el.setAttribute("data-gl-hot", "");
          /* a pinned popover on a term that is about to be redrawn away closes cleanly */
          if (openTerm && el.contains(openTerm)) close(false);
        }
      }
      if (el.closest("[data-gl-hot]")) return; /* live text: picked up again once it has been quiet for a while */
      if (r.type === "childList") r.addedNodes.forEach((x) => { if (x.nodeType === 1) pending.add(x); else if (x.parentElement) pending.add(x.parentElement); });
      else pending.add(el);
    });
    if (hot.size > 2000) hot.forEach((v, k) => { if (!k.isConnected) hot.delete(k); });
    if (pending.size) schedule();
  }

  function connect() {
    if (!observer) observer = new MutationObserver(onMutations);
    observer.observe(scope(), { childList: true, subtree: true, characterData: true });
  }

  function unmarkAll() {
    document.querySelectorAll(".gl-term").forEach((s) => {
      const p = s.parentNode;
      if (!p) return;
      p.replaceChild(document.createTextNode(s.textContent), s);
      p.normalize();
    });
    document.querySelectorAll("[data-gl-hot]").forEach((el) => el.removeAttribute("data-gl-hot"));
  }

  function start() {
    if (!prefs.hints) return;
    pending.add(scope());
    schedule(null, 0);
    connect();
  }
  function stop() {
    if (observer) observer.disconnect();
    if (timer) { clearTimeout(timer); timer = 0; }
    pending.clear();
    close(false);
    unmarkAll();
  }

  function setHints(on) {
    prefs.hints = !!on;
    writePrefs(prefs);
    if (on) start(); else stop();
    document.querySelectorAll("[data-gl-hints]").forEach((c) => { c.checked = prefs.hints; });
  }

  /* ---------- Popover ---------- */
  let pop = null, openTerm = null, pinned = false, hoverTimer = 0, leaveTimer = 0;

  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.className = "gl-pop";
    pop.id = "gl-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-live", "polite");
    pop.hidden = true;
    pop.addEventListener("pointerenter", () => clearTimeout(leaveTimer));
    pop.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !pinned) leaveTimer = setTimeout(() => close(false), 200); });
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("[data-gl-off]");
      if (b) { setHints(false); }
    });
    document.body.appendChild(pop);
    return pop;
  }

  const h = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function place() {
    if (!pop || !openTerm || pop.hidden) return;
    const r = openTerm.getBoundingClientRect();
    if (!openTerm.isConnected || (r.width === 0 && r.height === 0)) { close(false); return; }
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = Math.min(Math.max(12, r.left), vw - pw - 12);
    let top = r.bottom + 6;
    if (top + ph > vh - 8 && r.top - ph - 6 > 8) top = r.top - ph - 6;
    pop.style.left = Math.max(8, left) + "px";
    pop.style.top = Math.max(8, top) + "px";
  }

  function open(term, pin) {
    const t = byId.get(term.dataset.gl);
    if (!t) return;
    ensurePop();
    if (openTerm && openTerm !== term) openTerm.setAttribute("aria-expanded", "false");
    openTerm = term;
    pinned = !!pin;
    pop.innerHTML = `<div class="gl-h"><b>${h(t.term)}</b><span class="gl-cat">${h(t.cat)}</span></div>
      <p>${h(t.text)}</p>${t.app ? `<p class="gl-app"><b>In this app:</b> ${h(t.app)}</p>` : ""}
      <div class="gl-foot"><button type="button" data-gl-off title="You can turn them back on in the Words page">Hide word hints</button></div>`;
    pop.setAttribute("aria-label", t.term);
    pop.hidden = false;
    term.setAttribute("aria-expanded", "true");
    term.setAttribute("aria-controls", "gl-pop");
    place();
  }

  function close(refocus) {
    clearTimeout(hoverTimer); clearTimeout(leaveTimer);
    if (!pop || pop.hidden) { openTerm = null; return; }
    pop.hidden = true;
    const t = openTerm;
    openTerm = null; pinned = false;
    if (t) { t.setAttribute("aria-expanded", "false"); if (refocus && t.isConnected) t.focus(); }
  }

  function bindEvents() {
    /* Capture phase so the click on a term opens the hint and goes no further (a row's own click handler stays untouched). */
    document.addEventListener("click", (e) => {
      const term = e.target.closest && e.target.closest(".gl-term");
      if (term) {
        e.preventDefault(); e.stopPropagation();
        if (openTerm === term && pinned) close(false); else open(term, true);
        return;
      }
      /* A click anywhere else (also from the keyboard, which sends no pointerdown) closes the hint. */
      if (pop && !pop.hidden && !pop.contains(e.target)) close(false);
    }, true);
    document.addEventListener("pointerdown", (e) => {
      if (!pop || pop.hidden) return;
      if (pop.contains(e.target) || (e.target.closest && e.target.closest(".gl-term"))) return;
      close(false);
    }, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && pop && !pop.hidden) { close(true); return; }
      const term = e.target.closest && e.target.closest(".gl-term");
      if (term && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault(); e.stopPropagation();
        if (openTerm === term && !pop.hidden) close(true); else open(term, true);
      }
    }, true);
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      const term = e.target.closest && e.target.closest(".gl-term");
      if (!term) return;
      clearTimeout(leaveTimer);
      if (pinned && openTerm !== term) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => open(term, false), 220);
    });
    document.addEventListener("pointerout", (e) => {
      if (e.pointerType !== "mouse") return;
      const term = e.target.closest && e.target.closest(".gl-term");
      if (!term) return;
      clearTimeout(hoverTimer);
      if (!pinned && openTerm === term) leaveTimer = setTimeout(() => close(false), 250);
    });
    document.addEventListener("focusout", (e) => {
      /* tabbing away from a hover-opened hint closes it */
      if (!pinned && openTerm && e.target === openTerm) close(false);
    });
    window.addEventListener("scroll", place, { passive: true, capture: true });
    window.addEventListener("resize", place);
  }

  /* ---------- The Words page ---------- */
  function mountList(el) {
    if (!el) return;
    injectStyle();
    el.setAttribute("data-gl-skip", "");
    const cats = Array.from(new Set(terms.map((t) => t.cat)));
    el.innerHTML = `<div class="gl-list">
      <h3>Words</h3>
      <p class="gl-intro">Every film, animation and Maya word this app uses, in plain language. In the app, a word with a dotted underline is one of these: hover it or tap it to read what it means.</p>
      <div class="gl-bar">
        <input type="search" placeholder="Find a word" aria-label="Find a word" data-gl-q>
        <select aria-label="Group" data-gl-cat><option value="">All groups</option>${cats.map((c) => `<option>${h(c)}</option>`).join("")}</select>
        <label><input type="checkbox" data-gl-hints ${prefs.hints ? "checked" : ""}> Word hints in the app</label>
        <span class="gl-count" data-gl-count></span>
      </div>
      <div data-gl-body></div>
    </div>`;
    const q = el.querySelector("[data-gl-q]"), cat = el.querySelector("[data-gl-cat]"), body = el.querySelector("[data-gl-body]"), count = el.querySelector("[data-gl-count]");
    const hl = (s, needle) => {
      const safe = h(s);
      if (!needle) return safe;
      const re = new RegExp("(" + esc(h(needle)) + ")", "ig");
      return safe.replace(re, "<mark>$1</mark>");
    };
    function draw() {
      const needle = q.value.trim().toLowerCase();
      const c = cat.value;
      const list = terms.filter((t) => (!c || t.cat === c) && (!needle || (t.term + " " + t.aka.join(" ") + " " + t.text + " " + t.app).toLowerCase().includes(needle)));
      list.sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));
      count.textContent = `${list.length} of ${terms.length} words`;
      if (!list.length) { body.innerHTML = `<p>No word matches “${h(q.value)}”.</p>`; return; }
      const groups = (c ? [c] : cats).map((g) => [g, list.filter((t) => t.cat === g)]).filter(([, l]) => l.length);
      body.innerHTML = groups.map(([g, l]) => `<div class="gl-sec">${h(g)}</div><dl>${l.map((t) => `
        <dt id="gl-${t.id}">${hl(t.term, needle)}${t.aka.length ? `<small>also: ${hl(t.aka.join(", "), needle)}</small>` : ""}</dt>
        <dd>${hl(t.text, needle)}${t.app ? `<span class="gl-app"><b>In this app:</b> ${hl(t.app, needle)}</span>` : ""}</dd>`).join("")}</dl>`).join("");
    }
    q.addEventListener("input", draw);
    cat.addEventListener("change", draw);
    el.querySelector("[data-gl-hints]").addEventListener("change", (e) => setHints(e.target.checked));
    draw();
  }

  window.CuriosityGlossary = {
    terms,
    mountList,
    get hints() { return prefs.hints; },
    setHints,
    refresh() { if (prefs.hints) { pending.add(scope()); schedule(null, 0); } },
    stats
  };

  function boot() {
    injectStyle();
    bindEvents();
    start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
