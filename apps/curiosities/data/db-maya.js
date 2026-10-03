/* Maya's big topics as curiosities (the "Bring Maya into the app" thread, 2026-10-02).

   Jeremy, 18:02Z: bring Maya's ideas into the Screen, "all curiosity-centric and automation-centric", and keep it
   accessible. Sharani's topics come first: animation, lighting, shading, dynamics, fur and Bifrost; then the rest
   of what the Studio tools cover (poses and rigs, the face, crowds, the camera lens, render looks and layers,
   shot order and time).

   Each Maya topic is one lens: a curiosity whose sliders are that topic's graded parts, in plain words. Many
   sliders gather catalog rows that already exist (ref), so the flat Maya rows (wind, fur length, gloss...) become
   the fine controls of one lens instead of a long loose list. Every slider can be automated like any other.

   Extra fields, kept on each row for the Screen and other tools:
   - maya: what the topic is called in Maya, for people who know it (never needed to use the app)
   - tool: the Studio tool (studio-*.js) that works on it in depth; screen-maya.js offers it in the inspector
   - tags: "maya" and "tool:<id>", the same facts in the JSON export

   The lenses sit in the Screen's existing filmmaking categories (Performance, Light & color, Effects, Camera,
   Editing, Set & background, Page) rather than a "Maya" category: the app is organized by filmmaking, and the
   software's name is a footnote. Loaded after db-momentum.js, so it adds its own momentum notes and the three
   shared momentum sliders the same way. */
(function (DB) {
  const rows = [];
  /* A lens row: c(id, label, workspace, also, tool, maya, plain, main, sliders, momentum). */
  function c(id, label, workspace, also, tool, maya, plain, main, sliders, m) {
    const row = DB.curiosity({ id, label, workspace, also, group: "Maya: " + label, kind: "lens", plain, main, sliders, source: "Maya", tags: ["maya", "tool:" + tool] });
    row.maya = maya;
    row.tool = tool;
    rows.push([row, m]);
    return row;
  }
  /* A slider that gathers an existing catalog row, with its own plain words. */
  const ref = (id, label, refId, plain) => ({ id, label, ref: refId, plain });

  /* ================= Animation (Performance) ================= */

  c("animFeelLens", "Animation feel", "character-motion", ["movement-lines", "comedy"], "motion",
    "Graph Editor, Dope Sheet, tangents, the twelve principles of animation",
    "How the movement itself feels: stiff or rubbery, snappy or smooth, real or cartoon. The twelve old rules of animation, as sliders.",
    "style",
    [
      ["style", "Kind of movement", ["stiff and robotic", "realistic", "lively", "cartoony", "rubber-hose wild"], "From movement that looks like a machine, through real life, to cartoon bodies that bend like rubber hoses."],
      ref("spacing", "Slow into and out of poses", "spacing", "Whether moves start and stop gently (ease in and out) or at full speed. In Maya this is the shape of the curve between keys."),
      ref("anticipation", "Wind-up before a move", "anticipation", "The small move the other way before the big one: crouch before a jump, pull back before a punch."),
      ref("overshoot", "Overshoot and settle", "overshoot", "Going a little past the end pose and settling back, like a hand that stops and wobbles."),
      ref("overlap", "Parts that keep moving", "overlap", "Hair, ears, coats and bellies that keep going after the body stops (follow-through and overlapping action)."),
      ref("arcs", "Curved paths", "arcs", "Whether hands and heads travel in curves (alive) or straight lines (mechanical)."),
      ref("squash", "Squash and stretch", "squash", "How much bodies squash on impact and stretch in speed. Zero is solid; five is a bouncing ball."),
      ["exaggeration", "Exaggeration", ["true to life", "a little more", "clearly pushed", "huge"], "How far poses and timing are pushed past real life to make a point read."],
      ["holds", "Stillness", ["never still", "short holds", "clear holds", "long freezes"], "How long a character stays in a pose before the next move. Long freezes are a comedy tool."],
      ["secondary", "Little extra actions", ["none", "a little", "busy"], "Small actions on top of the main one: tapping a foot while waiting, fiddling with a pen while talking."],
      ref("poseRate", "Poses per beat", "poseRate", "How many clear poses a move goes through. More poses read as busier, fewer as bolder."),
    ],
    [2, "How a character moves tells the audience what they want before they say it: a rushed, stiff walk is heading somewhere it dreads.", "Stiff against loose movement is a theme of control against freedom.", "A change in how someone moves (the stiff one suddenly loose) is a change the eye catches at once.", "movement", "Animate the uptight character stiffly, then give them one cartoony move the moment they let go."]
  );

  c("timeLens", "Time and speed", "structure", ["character-motion", "camera-motion"], "remix",
    "Time Editor, Retime tool, Time Warp, frame rate on the Time Slider, stepped keys",
    "How time runs in the shot: real time, slow motion, sped up, frozen, played backwards, smooth or choppy like stop-motion.",
    "warp",
    [
      ["warp", "Speed of time", ["freeze frame", "very slow motion", "slow motion", "real time", "sped up", "fast forward"], "How fast time runs in this moment, from stopped to racing."],
      ref("ramp", "Speed change", "speedRamp", "Whether the speed changes inside the shot, like an action shot that slows down for the hit and speeds up again."),
      ref("drawnOn", "Smooth or choppy", "stepping", "Drawn on ones is smooth; twos is snappy (classic hand-drawn); threes is choppy, like stop-motion."),
      ["direction", "Forward or back", ["forward", "pauses", "rewinds"], "Whether time plays forward, stops, or runs backwards for a moment."],
      ["repeat", "Repeats", ["plays once", "repeats once", "loops"], "Whether a bit of action plays again: a replay for a joke, or a loop that traps a character."],
    ],
    [2, "Slowing or freezing time tells the audience: this moment decides everything that follows.", "Stretched time shows a moment someone will remember forever; sped-up time shows a stretch that does not matter.", "When time slows, the audience leans in and waits for the thing that is about to happen.", "visual", "Freeze the frame on the worst possible moment, then hold it one beat longer than is comfortable."]
  );

  c("poseRigLens", "Poses and body control", "character-motion", ["placement", "movement-lines"], "rig",
    "Skeletons and joints, IK and FK, constraints, HumanIK",
    "How strong and clear a pose is: the line through the body, the outline, balance, where the feet are planted, what the hands hold.",
    "lineOfAction",
    [
      ["lineOfAction", "Line through the body", ["straight and stiff", "slight curve", "strong curve", "S curve"], "Imagine one line from head to foot. A strong curve reads as energy and intent; straight reads as stiff or formal."],
      ["silhouette", "Clear outline", ["muddy", "readable", "crystal clear"], "Whether you could tell what the character is doing from a black shadow of them alone."],
      ["balance", "Balance", ["falling", "off balance", "shifting", "settled", "planted"], "Where the weight sits: tipping over, moving from foot to foot, or rooted to the spot."],
      ["feet", "Feet on the ground", ["sliding", "planted", "lifted", "in the air"], "Whether the feet stay fixed where they land (what IK is for in Maya) or leave the ground."],
      ["twist", "Twist in the body", ["square to the camera", "slight twist", "strong twist"], "How much the shoulders turn against the hips. Twist makes a pose look alive."],
      ["hands", "What the hands hold", ["empty", "a prop", "a surface", "another person"], "Whether the hands are free or locked to something (a constraint in Maya).", { unordered: true }],
      ["symmetry", "Even or uneven", ["mirror twins", "slightly uneven", "clearly uneven"], "Both sides of the body doing the same thing looks stiff; uneven poses look natural."],
    ],
    [2, "A strong pose shows what a character is about to do, so the audience is a step ahead of the plot.", "How someone holds their body says how they feel about their place in the world.", "The eye reads a clear outline before a word is said, so a strong pose grabs attention first.", "movement", "Hold the strongest pose of the scene for the line that turns it."]
  );

  c("faceLens", "Face acting", "character-motion", ["emotion", "lines"], "face",
    "Blend Shapes and the Shape Editor, Pose Library, eye darts and blinks, lip sync",
    "What the face does: how big the expression is, brows, eyes, mouth, blinks, which side moves, and how fast it changes.",
    "expression",
    [
      ["expression", "Size of the expression", ["blank", "subtle", "clear", "big", "extreme"], "How much the face shows, from a poker face to a cartoon take."],
      ["brows", "Eyebrows", ["down hard", "down", "neutral", "up", "way up"], "Brows down read as anger or focus; up reads as surprise, worry or hope."],
      ["eyes", "Eyes", ["closed", "narrowed", "normal", "wide", "popping"], "How open the eyes are."],
      ["mouth", "Mouth", ["pressed tight", "neutral", "smile", "open", "wide open"], "The shape of the mouth, from holding it in to letting it all out."],
      ["darts", "Eyes darting", ["still", "a few", "many"], "Quick small eye movements: a thinking, nervous or lying face darts; a calm or certain face holds still."],
      ["blinks", "Blinks", [0, 5], "Blinks per beat. A blink often marks a new thought."],
      ["sided", "One side or both", ["even", "slightly lopsided", "one-sided"], "Whether both sides of the face move the same. A one-sided smile is a smirk or a sneer."],
      ref("lipSync", "Lip sync", "lipSync", "How closely the mouth matches the words."),
      ["changeSpeed", "How fast it changes", ["melts slowly", "shifts", "snaps"], "Whether a feeling spreads across the face slowly or snaps on."],
    ],
    [3, "A face changing tells the audience a decision has been made before the character acts on it.", "What the face hides against what it shows is where the theme of honesty lives.", "Close on a face, the audience watches for the smallest change and reads it as the next turn.", "visual", "Let the face change a beat before the line, so the audience knows what is coming and dreads it."]
  );

  c("crowdLens", "Crowds and repeats", "background", ["herd", "placement"], "crowd",
    "MASH networks (Distribute, Random, Offset, Signal, Replicator), crowd tools",
    "Many copies of people or things: how many, how different from each other, how in step, how they are spread, and whether they follow a leader.",
    "count",
    [
      ["count", "How many", ["none", "a few", "a group", "a crowd", "a sea"], "How many people or things fill the space."],
      ["variety", "How alike", ["clones", "slight differences", "everyone different"], "Whether they look like copies (funny or creepy) or each one is their own person."],
      ["sync", "In step", ["each on their own", "loosely together", "in step", "perfect unison"], "Whether they move separately or as one, like a marching band."],
      ["spread", "How they are spread", ["clustered", "scattered", "in rows", "in a ring"], "How the crowd is laid out in the space.", { unordered: true }],
      ["follow", "Follow the leader", ["ignore them", "some follow", "all follow"], "Whether the crowd copies one person."],
      ["ripple", "Ripple delay", [0, 8, "beats"], "How long it takes a move to pass through the crowd, like a stadium wave."],
    ],
    [2, "A crowd turning from scattered to in step shows a group becoming a force the hero must face.", "A crowd moving as one is the theme of the herd against the person.", "One figure out of step in a perfect crowd is where the eye goes.", "visual", "Put one person out of step in a perfect crowd, and make that person matter later."]
  );

  /* ================= Lighting and shading (Light & color) ================= */

  c("lightRigLens", "Light setup", "light", ["set", "emotion"], "light",
    "Arnold lights (area, spot, directional, skydome, mesh), exposure, decay, light linking",
    "What kind of lights light the scene and how they work together: the sun, the sky, a window, a spotlight, a bare bulb; how bright the dark side is; light bouncing off walls.",
    "lightType",
    [
      ["lightType", "Main light", ["sun", "open sky", "window", "spotlight", "bare bulb", "glowing object"], "The kind of light doing most of the work.", { unordered: true }],
      ["ratio", "Bright side to dark side", ["flat and even", "gentle", "dramatic", "one side black"], "How much darker the shadow side of a face is than the lit side."],
      ["bounce", "Light bouncing around", ["none", "a little", "rich bounce"], "Light bouncing off walls and floors and filling the room with soft color (global illumination)."],
      ["falloff", "How far the light reaches", ["reaches far", "fades across the room", "drops off fast"], "Whether the light fills the whole space or falls into darkness a few steps away."],
      ["linking", "Who the light touches", ["everyone", "only the hero", "only the background"], "Lights that touch only some things, a trick for making one person glow.", { unordered: true }],
      ref("softness", "Hard or soft", "softness", "Hard light makes sharp shadows; soft light wraps around faces."),
      ref("rim", "Rim light", "rim", "A light from behind that draws a bright edge around a person."),
      ref("haze", "Haze and beams", "atmosphere", "Haze in the air that makes beams of light visible."),
      ref("shape", "Shaped light", "lightShape", "Light cut into shapes: blinds, leaves, a window frame."),
      ref("practical", "Lamps in the shot", "practicalInFrame", "Whether the lights themselves (lamps, candles, screens) are visible in the picture."),
    ],
    [2, "A change in the lights (a door opening, a lamp going out) marks a turn without a word.", "Light against dark is the oldest picture of hope against fear.", "The eye goes to the brightest thing in the frame, so light steers attention.", "visual", "Light only the person who is lying, and let everyone else fall into shadow."]
  );

  c("surfaceLens", "Surfaces and materials", "light", ["set", "wardrobe"], "shading",
    "Arnold Standard Surface (base, specular, roughness, metalness, transmission, coat, sheen, thin film), bump maps",
    "What things are made of, as the light shows it: matte or shiny, metal or glass, smooth or bumpy, worn or new.",
    "material",
    [
      ["material", "Kind of surface", ["matte", "satin", "glossy", "mirror", "metal", "glass"], "What the surface looks like it is made of, by how it takes the light.", { unordered: true }],
      ref("shine", "Shine", "gloss", "How much the surface reflects, from chalk to a polished car."),
      ["seeThrough", "See-through", ["solid", "cloudy", "clear"], "Whether light passes through: a wall, frosted glass, a clean window."],
      ["bumps", "Texture", ["smooth", "fine grain", "textured", "rough and bumpy"], "How bumpy the surface looks up close."],
      ["coat", "Clear coat", ["none", "thin varnish", "thick lacquer"], "A shiny layer on top, like varnish on wood or the paint on a car."],
      ["sheen", "Soft fuzz", ["none", "soft fuzz", "velvet"], "The soft glow at the edges of fabrics like velvet and peach skin."],
      ["rainbow", "Rainbow film", ["none", "oil slick", "soap bubble"], "Rainbow colors on a surface, like oil on a puddle."],
      ref("wet", "Wet", "wetness", "How wet surfaces look, from dry to dripping."),
      ref("glow", "Glows", "glow", "Whether the surface gives off its own light."),
      ref("wear", "Wear", "wear", "Scratches, dust and rust: how much life the surface has seen."),
    ],
    [1, "Materials getting worse (gold to rust, glossy to dusty) show a place or person falling.", "What things are made of says what a world values: marble and gold, or plywood and tape.", "A shiny thing in a matte room catches the eye and becomes important.", "visual", "Make the one object that matters the only shiny thing in the room."]
  );

  c("skinLens", "Skin", "light", ["character-motion", "wardrobe"], "shading",
    "Arnold Standard Surface subsurface scattering, skin shading",
    "How skin looks in the light: plastic or alive, dry or sweaty, pale or flushed, airbrushed or every pore.",
    "glowThrough",
    [
      ["glowThrough", "Light through the skin", ["plastic", "waxy", "soft glow", "ears glow red"], "Real skin lets light in and glows a little, like ears lit from behind (subsurface scattering)."],
      ref("skinLight", "Skin in the light", "skinLight", "How the light sits on the skin."),
      ["oil", "Dry to sweaty", ["dry", "natural", "dewy", "sweaty"], "How much shine sweat and oil put on the face. Sweat is a tension tool."],
      ["flush", "Color in the face", ["pale", "natural", "flushed", "bright red"], "Blood in the face: fear drains it; anger, shame and love bring it."],
      ["detail", "Detail", ["airbrushed", "natural", "every pore"], "How smooth or real the skin looks up close."],
    ],
    [2, "A face going pale or red shows a feeling the character is trying to hide, before they act on it.", "Airbrushed against real skin is a theme of the polished image against the true person.", "Sweat on a forehead makes the audience feel the pressure and wait for the crack.", "visual", "Add a bead of sweat in the close-up just before the lie."]
  );

  c("renderLookLens", "Drawn or real look", "light", ["color", "page"], "print",
    "Toon shader, outlines, render layers, render settings",
    "Whether the picture looks like a photo, a painting, a cartoon or a comic: outlines, flat color bands, hatching and paper.",
    "look",
    [
      ref("look", "Look", "renderStyle", "Photo-real, painted, cartoon or flat graphic."),
      ref("outline", "Outline weight", "lineWeight", "How thick the drawn lines around things are."),
      ["bands", "Shading", ["smooth", "three bands", "two bands", "flat color"], "Smooth shading looks rounded and real; two flat bands look like a cartoon (cel shading)."],
      ["hatching", "Hatching", ["none", "light hatching", "heavy crosshatch"], "Shadows drawn with lines, like an ink comic or an old engraving."],
      ["wobble", "Line wobble", ["steady", "slight wobble", "sketchy"], "Lines that shake a little from drawing to drawing look hand-made and alive."],
      ["paper", "Paper", ["none", "subtle", "paper grain", "watercolor"], "The texture of paper under the picture."],
    ],
    [1, "Switching the look (photo to cartoon) can mark a dream, a memory or a story inside the story.", "A drawn look says the film is a told story; a real look says it is happening.", "A sudden change of look makes the audience ask why, and watch for the answer.", "visual", "Switch to a sketchy, hand-drawn look when the character starts to imagine."]
  );

  c("layersLens", "Layers of the picture", "light", ["structure", "background"], "passes",
    "Render Setup layers, AOVs (beauty, diffuse, specular, light groups), ambient occlusion, depth, cryptomatte",
    "The picture as layers you can turn up and down: foreground against background, contact shadows, fog with depth, one light group louder than another.",
    "separation",
    [
      ["separation", "Foreground against background", ["one flat layer", "two layers", "three layers", "deep stack"], "How clearly the picture splits into near, middle and far."],
      ["depthFog", "Fog with distance", ["none", "light", "thick"], "Things far away fade into haze, which makes space feel deep."],
      ["contact", "Contact shadows", ["none", "soft", "strong"], "The dark where things touch (a cup on a table, feet on a floor) that makes them sit in the world (ambient occlusion)."],
      ["lightMix", "Light mix", ["the main light", "even", "the background lights"], "Which group of lights is turned up when the layers are mixed."],
      ["isolate", "One thing on its own", ["nothing", "a little", "only that thing"], "Pulling one object out on its own layer, to brighten, blur or color it alone."],
    ],
    [1, "Pulling one thing forward from the background tells the audience it will matter.", "Deep layered space feels like a full world; one flat layer feels like a stage or a memory.", "The layer that is brightest and sharpest is the one the eye goes to.", "visual", "Fade the background into fog as the character shuts the world out."]
  );

  /* ================= Camera ================= */

  c("cameraLensLens", "The camera lens", "camera-angle", ["camera-motion", "placement"], "camera",
    "Camera Attribute Editor: focal length, film back, depth of field, motion blur, camera shake",
    "The glass in front of the camera: wide or long, how much is in focus, focus moving from one thing to another, motion blur, shake, bending at the edges, flares.",
    "length",
    [
      ref("length", "Wide or long", "lensLength", "A wide lens shows a lot and stretches space; a long lens shows a little and squashes it flat."),
      ref("focusDepth", "How much is sharp", "depthOfField", "Everything sharp, or just one thing sharp with the rest soft."),
      ref("focusPull", "Focus moves", "rackFocus", "Focus moving from one thing to another during the shot."),
      ref("blur", "Motion blur", "motionBlur", "How much fast things smear."),
      ref("shake", "Shake", "cameraShake", "How much the camera shakes."),
      ["bend", "Bending at the edges", ["none", "slight", "fisheye"], "How much the lens bends straight lines at the edges of the picture."],
      ["flare", "Flares", ["none", "a glint", "streaks"], "Light catching in the lens: a glint or long streaks."],
      ["vignette", "Dark corners", ["none", "subtle", "heavy"], "Darkening at the corners that pulls the eye to the middle."],
    ],
    [2, "Moving the focus from one face to another passes the scene to the second person.", "Wide lenses make people small in a big world; long lenses press them together.", "Whatever is sharp is what the audience looks at.", "visual", "Keep the hero soft in the background and pull focus onto them at the moment they matter."]
  );

  c("shotOrderLens", "Shots in order", "structure", ["camera-motion"], "sequencer",
    "Camera Sequencer (shots, sequence time), Time Slider, Playblast, sound on the timeline",
    "How shots follow each other: how long they last, how cuts are hidden or felt, and whether sound or picture leads.",
    "length",
    [
      ref("length", "Shot length", "shotDuration", "How long each shot lasts before the cut."),
      ref("rate", "Cut rate", "cutRate", "How often the picture cuts."),
      ["joins", "How shots join", ["hard cuts", "cut on action", "match cuts", "overlapping"], "Whether you feel the cut, or a movement or shape carries you across it.", { unordered: true }],
      ["leads", "Sound or picture first", ["picture leads", "together", "sound leads"], "Whether the next shot's sound starts before its picture (pulling you forward) or after."],
      ["coverage", "Shots of the same moment", ["one shot", "two angles", "many angles"], "How many camera positions cover one moment."],
    ],
    [3, "Cutting faster pushes a scene to its peak; holding long makes the audience wait for the turn.", "Long unbroken shots feel honest; quick cuts feel like a racing mind.", "Sound arriving before its picture pulls the audience into the next shot.", "audio", "Bring in the next scene's sound a beat early to pull the audience out of a scene that is done."]
  );

  /* ================= Dynamics, fur and Bifrost (Effects) ================= */

  c("forcesLens", "Forces in the air", "effects", ["set", "emotion"], "dynamics",
    "Nucleus solver and fields: gravity, air (wind), turbulence, drag, vortex",
    "The invisible forces that move everything loose: wind, gusts, chaos, weight and how thick the air feels.",
    "wind",
    [
      ref("wind", "Wind", "windForce", "How strong the wind is, from still air to a gale."),
      ["gusts", "Gusts", ["steady", "gusty", "sudden blasts"], "Whether the wind is even or comes in bursts."],
      ["direction", "Wind direction", ["from the left", "from the right", "toward the camera", "from behind", "swirling"], "Where the wind comes from.", { unordered: true }],
      ref("chaos", "Chaos", "turbulence", "Calm drift against wild swirls."),
      ref("weight", "Weight", "gravityFeel", "How heavy the world feels: floaty like the moon, real, or heavy."),
      ["drag", "Thickness of the air", ["thin air", "normal", "like water"], "How much the air slows things down. Underwater, everything drifts."],
      ["whirl", "Whirlwind", ["none", "eddies", "a whirlwind"], "Air spinning in a circle, from leaves turning in a corner to a tornado."],
    ],
    [2, "Wind building is a storm coming, out in the world or inside a character.", "Forces bigger than the people show them up against what they cannot control.", "Things moving in the wind keep the frame alive, and a sudden still feels like a held breath.", "movement", "Kill the wind completely at the moment of the confession."]
  );

  c("clothLens", "Cloth", "effects", ["wardrobe"], "dynamics",
    "nCloth: stretch, bend, weight, friction, tearable surfaces",
    "How clothes, flags and curtains move: heavy or light, stretchy, wrinkly, clinging or flowing, holding or tearing.",
    "fabric",
    [
      ["fabric", "Weight of the fabric", ["silk", "cotton", "denim", "leather", "chain mail"], "From light cloth that floats to heavy cloth that swings and thuds."],
      ref("reacts", "How it moves", "clothResponse", "Stiff, loose or fluttering."),
      ["stretch", "Stretch", ["none", "a little", "rubbery"], "How much the cloth stretches when pulled."],
      ["wrinkles", "Wrinkles", ["smooth", "soft folds", "crumpled"], "How much it folds and creases."],
      ["cling", "Clings or flows", ["floats away", "drapes", "clings"], "Whether it flies out behind, hangs, or sticks to the body (like when soaked)."],
      ["tears", "Tears", ["holds", "snags", "rips"], "Whether the cloth holds together or tears."],
    ],
    [1, "A cape flaring or a dress ripping marks the moment a character changes.", "Clothes clinging or flowing show a person held in or set free.", "Moving cloth draws the eye, so a flowing cape keeps attention on the hero.", "movement", "Let the hero's coat snag and rip at the worst possible moment."]
  );

  c("crashLens", "Things that crash and break", "effects", ["comedy", "set"], "dynamics",
    "Rigid bodies (Bullet), collisions, shatter",
    "Solid things hitting, bouncing and breaking: how bouncy, how slippery, whether one thing knocks over the next, and the mess left behind.",
    "hits",
    [
      ref("hits", "Hits per beat", "impacts", "How many crashes and collisions the audience notices."),
      ref("breaks", "Breaks", "breakage", "Whether things hold, crack or shatter."),
      ["bounce", "Bounce", ["dead thud", "small bounce", "bouncy", "super ball"], "How much things bounce when they land."],
      ["slide", "Slippery", ["grippy", "smooth", "ice"], "Whether things stop where they land or slide away."],
      ["chain", "Knock-on", ["one thing", "a few knock on", "domino chain"], "Whether one crash sets off another. Chains are a comedy staple."],
      ["mess", "Mess left behind", ["clean", "some bits", "pieces everywhere"], "How much broken stuff and dust is left."],
      ref("settle", "Settle time", "settleTime", "Beats until everything is still after a hit."),
    ],
    [2, "Something breaking is a point of no return: what is smashed cannot go back.", "Fragile against tough things shows what in this world can last.", "A chain of crashes keeps the audience waiting for the last thing to fall.", "movement", "Let the chain of falling things stop one short, hold, then knock over the last one."]
  );

  c("bitsLens", "Bits in the air", "effects", ["set", "emotion"], "dynamics",
    "nParticles, emitters, particle lifespan and color",
    "Small things floating or falling through the frame: dust, sparks, snow, rain, leaves, confetti, bubbles.",
    "kind",
    [
      ["kind", "What is in the air", ["dust", "sparks", "snow", "rain", "leaves", "ash", "confetti", "bubbles"], "The kind of small things filling the air.", { unordered: true }],
      ["amount", "How much", ["none", "a few", "plenty", "a storm"], "How many there are."],
      ["size", "Size", ["specks", "flakes", "chunks"], "How big each bit is."],
      ["life", "How long they last", ["a blink", "drift a while", "linger"], "Whether bits vanish quickly (sparks) or hang in the air (dust in a sunbeam)."],
      ["shine", "Catch the light", ["none", "catch the light", "glow"], "Whether the bits sparkle or glow."],
    ],
    [1, "Snow starting or ash falling tells the audience the world has changed without a word.", "Dust in a sunbeam feels like memory; ash feels like loss; confetti like a celebration that may be hollow.", "Bits drifting across the frame give the eye something to follow toward the subject.", "visual", "Let confetti keep falling on a character after the good news turns bad."]
  );

  c("furLens", "Hair and fur", "effects", ["wardrobe", "character-motion"], "fur",
    "XGen interactive grooming: length, density, clumping, noise (frizz), curl, melanin, shine, hair dynamics",
    "How hair and fur look and move: long or short, thick, clumped, frizzy, curly, wet, neat or wild, and how it trails the body and the wind.",
    "length",
    [
      ref("length", "Length", "furLength", "Short, medium or long."),
      ["thick", "Thickness", ["sparse", "normal", "thick"], "How dense the hair or fur is."],
      ref("clumps", "Clumps", "clump", "Fine and fluffy, tufted, or matted together."),
      ref("frizz", "Frizz", "frizz", "Stray hairs sticking out."),
      ["curls", "Curls", ["straight", "wavy", "curly", "coiled"], "The shape of each hair."],
      ref("color", "Color", "hairColor", "Light to dark."),
      ref("shine", "Shine", "hairShine", "Dull, sheen or glossy."),
      ["wet", "Wet", ["dry", "damp", "soaked and stringy"], "Wet hair clumps into strings and goes darker."],
      ["groom", "Neat or wild", ["neat", "swept one way", "messy", "standing on end"], "How tidy it is."],
      ref("reacts", "What moves it", "furResponse", "Nothing, the wind, the body, or both."),
      ref("lag", "Trails behind", "furLag", "Beats the hair trails behind the body when it moves."),
    ],
    [1, "Hair going from neat to wild tracks a character coming apart over the story.", "How someone keeps their hair shows how much control they want over how they look.", "Hair standing on end or streaming in the wind is a quick, funny or scary picture the eye catches.", "visual", "Make the hair stand on end a beat after the fright, as its own little joke."]
  );

  c("liquidLens", "Water and liquids", "effects", ["set"], "bifrost",
    "Bifrost liquids: emitters, viscosity, foam, meshing",
    "Water and other liquids: how much, how thick, calm or churning, splashes, foam and drips.",
    "amount",
    [
      ["amount", "How much", ["a drip", "a puddle", "a pool", "a flood", "an ocean"], "How much liquid is in the scene."],
      ["thickness", "Thickness", ["water", "milk", "syrup", "honey", "mud"], "How thick the liquid is. Thick liquids move slowly and fold over themselves."],
      ["surface", "Surface", ["glass calm", "ripples", "choppy", "churning"], "How still the surface is."],
      ref("splash", "Splash", "splash", "What happens when something hits it: nothing, a drip, a burst."),
      ["foam", "Foam", ["none", "some bubbles", "white water"], "Bubbles and foam on top."],
      ["drips", "Drips", ["none", "a few", "streaming"], "Liquid dripping off things and people."],
    ],
    [2, "Water rising is a clock running out.", "Calm water feels like peace or a held secret; churning water feels like chaos and danger.", "A splash or a drip on a quiet soundtrack pulls every eye and ear.", "audio", "Keep a slow drip going through a tense silence."]
  );

  c("smokeFireLens", "Smoke and fire", "effects", ["light", "set"], "bifrost",
    "Bifrost Aero (smoke, fire, explosions), volumes",
    "Smoke, steam and fire: how hot, how thick, how fast it rises, how it swirls and how long it hangs.",
    "heat",
    [
      ["heat", "Heat", ["none", "smoulder", "flames", "inferno"], "From no fire to a smoulder, flames or a blaze."],
      ref("thick", "Thickness", "density", "A wisp, a plume or a wall."),
      ref("grows", "Growing", "growth", "Shrinking, steady or building."),
      ref("swirl", "Swirl", "curl", "How much the smoke curls and swirls."),
      ["rise", "Rise", ["hangs", "drifts up", "shoots up"], "How fast it climbs."],
      ["fade", "Fade", ["lingers", "thins out", "vanishes fast"], "How long it stays in the air."],
      ["smokeColor", "Color of the smoke", ["white steam", "gray", "black", "colored"], "Steam is white; burning things make black smoke.", { unordered: true }],
      ref("fireGlow", "Fire lights the scene", "fireLight", "How much the fire's light falls on everything around it."),
    ],
    [3, "Smoke rising before the fire is seen tells the audience danger is coming.", "Fire destroys and warms at once: the same flames can be a hearth or a disaster.", "Flickering firelight makes the frame breathe and holds the eye.", "visual", "Show the smoke first, far off, and keep the characters too busy to see it."]
  );

  c("scatterLens", "Scattered things", "set", ["background", "effects"], "bifrost",
    "Bifrost scatter and instancing, MASH Distribute",
    "Many small things spread over the ground or a set: grass, rocks, leaves, trash, flowers, trees.",
    "how",
    [
      ref("how", "How much is scattered", "scatter", "How many small things cover the ground."),
      ["what", "What is scattered", ["grass", "rocks", "leaves", "trash", "flowers", "trees"], "The kind of things spread around.", { unordered: true }],
      ["spread", "How it is spread", ["clumped", "natural", "even"], "In clumps, the way nature does it, or in a tidy even pattern."],
      ["sizes", "Sizes", ["all alike", "some variety", "wildly different"], "How much the pieces differ in size."],
      ["moves", "Moves", ["still", "sways", "tumbles"], "Whether the scattered things move in the wind."],
    ],
    [1, "The ground filling with trash or flowers shows a place going downhill or coming to life.", "Wild clumps feel like nature; even rows feel controlled and made by people.", "A clear path through scattered things leads the eye to where it goes.", "visual", "Clear a path through the leaves exactly where the character will walk."]
  );

  /* ---------- momentum notes and the shared momentum sliders (same shape as db-momentum.js) ---------- */
  rows.forEach(([row, n]) => {
    row.momentum = { push: n[0], plot: n[1], theme: n[2], pull: n[3], cue: n[4], tryThis: n[5] };
    DB.curiosity({
      id: row.id,
      sliders: [
        { id: "push", label: "Pushes the story", range: { min: 0, max: 5 }, from: n[0], to: Math.min(5, n[0] + 2), plain: "How much this curiosity moves the story forward here." },
        { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], from: "holds", to: "demands what's next", plain: "Whether it settles something or leaves the audience needing what comes next." },
        { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], from: "loosely", to: "clearly", plain: "How closely it carries one of the film's themes here." },
      ],
    });
  });

  /* ================= Suites: several Maya lenses looked through together ================= */
  const S = (id, label, workspace, also, plain, members) => DB.suite({ id, label, workspace, also, plain, members, source: "Maya", tags: ["maya"] });
  const m = (curiosity, slider, value, weight) => (weight == null ? { curiosity, slider, value } : { curiosity, slider, value, weight });

  S("cartoon-bounce", "Cartoon bounce", "character-motion", ["comedy"], "Rubbery cartoon bodies: pushed poses, squash and stretch, big wind-ups, things that bounce like super balls.", [
    m("animFeelLens", "style", "cartoony"), m("animFeelLens", "exaggeration", "huge"), m("crashLens", "bounce", "super ball"), m("faceLens", "expression", "extreme"), m("renderLookLens", "bands", "two bands", 60),
  ]);
  S("heavy-and-real", "Heavy and real", "character-motion", ["effects"], "Real weight: realistic movement, things land with a thud, heavy fabric, nothing floats.", [
    m("animFeelLens", "style", "realistic"), m("crashLens", "bounce", "dead thud"), m("clothLens", "fabric", "denim"), m("poseRigLens", "balance", "planted"), m("forcesLens", "drag", "normal"),
  ]);
  S("stop-motion-feel", "Stop-motion feel", "structure", ["character-motion", "light"], "The handmade look of puppets shot a frame at a time: choppy timing, clear holds, matte surfaces you could touch.", [
    m("timeLens", "warp", "real time", 40), m("animFeelLens", "holds", "clear holds"), m("surfaceLens", "material", "matte"), m("surfaceLens", "bumps", "textured"), m("layersLens", "contact", "strong"),
  ]);
  S("storm", "Storm", "effects", ["emotion", "set"], "Weather at its worst: blasts of wind, rain everywhere, soaked hair and clinging clothes, churning water.", [
    m("forcesLens", "gusts", "sudden blasts"), m("bitsLens", "kind", "rain"), m("bitsLens", "amount", "a storm"), m("clothLens", "cling", "clings"), m("furLens", "wet", "soaked and stringy"), m("liquidLens", "surface", "churning"),
  ]);
  S("campfire-night", "Campfire night", "light", ["effects", "emotion"], "A fire in the dark: flames lighting faces, sparks rising, flushed skin, one side of every face black.", [
    m("lightRigLens", "lightType", "glowing object"), m("smokeFireLens", "heat", "flames"), m("bitsLens", "kind", "sparks"), m("skinLens", "flush", "flushed"), m("lightRigLens", "ratio", "one side black"),
  ]);
  S("warm-animated-feature", "Warm animated feature", "light", ["color"], "The soft, glowing look of a big animated film: skin that glows, light bouncing everywhere, smooth satin surfaces.", [
    m("skinLens", "glowThrough", "soft glow"), m("lightRigLens", "bounce", "rich bounce"), m("surfaceLens", "material", "satin"), m("renderLookLens", "bands", "smooth"), m("animFeelLens", "style", "lively"),
  ]);
  S("ink-comic", "Ink comic", "page", ["light", "color"], "A printed comic look: flat color in two bands, heavy crosshatched shadows, paper grain.", [
    m("renderLookLens", "bands", "two bands"), m("renderLookLens", "hatching", "heavy crosshatch"), m("renderLookLens", "paper", "paper grain"), m("renderLookLens", "wobble", "slight wobble"),
  ]);
  S("underwater", "Underwater", "effects", ["light"], "Everything drifts: thick water for air, bubbles rising, hair and cloth floating up, light falling off fast.", [
    m("forcesLens", "drag", "like water"), m("bitsLens", "kind", "bubbles"), m("clothLens", "cling", "floats away"), m("furLens", "groom", "standing on end", 50), m("lightRigLens", "falloff", "drops off fast"), m("layersLens", "depthFog", "thick"),
  ]);
  S("sea-of-people", "Sea of people", "background", ["herd"], "A huge crowd that moves like one animal: all slightly different, in step, a wave rolling through.", [
    m("crowdLens", "count", "a sea"), m("crowdLens", "variety", "slight differences"), m("crowdLens", "sync", "in step"), m("crowdLens", "follow", "all follow"),
  ]);
  S("the-big-moment", "The big moment", "structure", ["camera-angle", "emotion"], "Time stretches for the moment that matters: slow motion, everything soft but one face, bits hanging in the air.", [
    m("timeLens", "warp", "slow motion"), m("cameraLensLens", "flare", "a glint", 40), m("bitsLens", "life", "linger"), m("faceLens", "changeSpeed", "melts slowly"), m("shotOrderLens", "leads", "sound leads", 50),
  ]);
  S("poker-face", "Poker face", "character-motion", ["comedy", "emotion"], "Giving nothing away: a still, even face, eyes that do not dart, a settled body. Deadpan comedy lives here.", [
    m("faceLens", "expression", "blank"), m("faceLens", "darts", "still"), m("faceLens", "sided", "even"), m("poseRigLens", "balance", "settled"), m("animFeelLens", "holds", "long freezes"),
  ]);

  /* ================= Proximities: when one thing happens, another follows ================= */
  const P = (id, label, workspace, also, plain, when, then, within, often) => DB.proximity({ id, label, workspace, also, plain, when, then, within, often, source: "Maya", tags: ["maya"] });
  P("crash-shake", "When something crashes, the camera shakes", "effects", ["camera-motion"], "A crash makes the camera jolt, as if it felt the hit too.", { curiosity: "crashLens", slider: "mess", change: "rises" }, { curiosity: "cameraLensLens", slider: "shake", change: "rises" }, 0, 60);
  P("landing-settle", "When something heavy lands, hair and cloth settle a beat later", "effects", ["character-motion"], "Follow-through: the body stops, the loose parts keep going and settle after.", { curiosity: "crashLens", slider: "bounce", is: "dead thud" }, { curiosity: "clothLens", slider: "wrinkles", change: "rises" }, 1, 80);
  P("wind-cloth", "When the wind picks up, cloth flies out", "effects", ["wardrobe"], "Gusts lift capes, skirts, flags and curtains.", { curiosity: "forcesLens", slider: "gusts", change: "rises" }, { curiosity: "clothLens", slider: "cling", is: "floats away" }, 1, 85);
  P("wind-hair", "When the wind picks up, hair streams one way", "effects", ["character-motion"], "Hair follows the wind a moment after it arrives.", { curiosity: "forcesLens", slider: "gusts", change: "rises" }, { curiosity: "furLens", slider: "groom", is: "swept one way" }, 1, 85);
  P("rain-hair", "When it rains, hair goes stringy", "effects", ["wardrobe"], "A few beats of rain and hair goes dark and clumps into strings.", { curiosity: "bitsLens", slider: "kind", is: "rain" }, { curiosity: "furLens", slider: "wet", change: "rises" }, 3, 75);
  P("windup-hit", "When the wind-up grows, the move lands bigger", "character-motion", ["comedy"], "The bigger the anticipation, the bigger the action it promises (or the funnier when it fizzles).", { curiosity: "animFeelLens", slider: "anticipation", change: "rises" }, { curiosity: "animFeelLens", slider: "exaggeration", change: "rises" }, 1, 70);
  P("fire-flush", "When the fire grows, faces go warm and red", "light", ["effects", "emotion"], "Firelight and heat bring color into faces.", { curiosity: "smokeFireLens", slider: "heat", change: "rises" }, { curiosity: "skinLens", slider: "flush", change: "rises" }, 1, 70);
  P("churn-foam", "When the water churns, foam builds", "effects", [], "Rough water whips up white water.", { curiosity: "liquidLens", slider: "surface", change: "rises" }, { curiosity: "liquidLens", slider: "foam", change: "rises" }, 1, 90);
  P("leader-ripple", "When the leader moves, the crowd follows in a ripple", "background", ["herd"], "One person moves and the move passes through the crowd like a wave.", { curiosity: "crowdLens", slider: "follow", is: "all follow" }, { curiosity: "crowdLens", slider: "sync", change: "rises" }, 2, 65);
  P("big-face-big-body", "When the face goes big, the body follows", "character-motion", ["emotion"], "A big feeling starts in the face and spreads into a stronger pose.", { curiosity: "faceLens", slider: "expression", change: "rises" }, { curiosity: "poseRigLens", slider: "lineOfAction", change: "rises" }, 1, 70);
  P("eyes-lead", "When the eyes dart, the expression changes next", "character-motion", ["emotion", "lines"], "The eyes move first, then the face: the thought comes before the feeling shows.", { curiosity: "faceLens", slider: "darts", change: "rises" }, { curiosity: "faceLens", slider: "expression", change: "changes" }, 1, 75);
  P("slowmo-linger", "When time slows, the bits in the air hang", "structure", ["effects"], "In slow motion, sparks, dust and drops hang in the air.", { curiosity: "timeLens", slider: "warp", is: "slow motion" }, { curiosity: "bitsLens", slider: "life", is: "linger" }, 0, 80);
  P("break-mess", "When things break, the mess spreads", "effects", ["set", "comedy"], "Breakage leaves pieces everywhere, and the pieces become part of the set.", { curiosity: "crashLens", slider: "chain", is: "domino chain" }, { curiosity: "crashLens", slider: "mess", change: "rises" }, 2, 80);

  const PS = (id, label, workspace, also, plain, members) => DB.proximitySuite({ id, label, workspace, also, plain, members, source: "Maya", tags: ["maya"] });
  PS("weather-hits-everyone", "Weather hits everyone", "effects", ["set"], "Wind and rain reach everything loose: cloth flies out, hair streams, then goes stringy.", ["wind-cloth", "wind-hair", "rain-hair"]);
  PS("impact-chain", "The impact chain", "effects", ["comedy"], "A crash shakes the camera, loose parts settle a beat later, and the mess spreads.", ["crash-shake", "landing-settle", "break-mess"]);
  PS("acting-from-the-inside", "Acting from the inside out", "character-motion", ["emotion"], "The eyes move first, then the face, then the whole body.", ["eyes-lead", "big-face-big-body"]);
  PS("elements-build", "The elements build", "effects", ["light"], "Fire warms faces and churning water foams: the world reacts to its elements.", ["fire-flush", "churn-foam"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
