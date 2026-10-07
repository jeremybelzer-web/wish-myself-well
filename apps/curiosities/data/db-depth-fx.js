/* data/db-depth-fx.js: light, effects, layers, the order of the story and the emotional road, deeper. 4 light
   curiosities (a light that flickers when something is wrong, shadows that tell the story, only an outline against
   the light, a pool of light in the dark), 4 effects curiosities (rain on the window, breath you can see, the sky
   matching the mood, fog that hides and then shows), 4 layers curiosities (a memory laid over the present, one
   thing keeping its color, drawings on top of the picture, a map that shows the journey), 5 editing and structure
   curiosities (the story told backwards, a glimpse of what is coming, the same moment from another side, an ending
   that is not the end, someone telling the story) and 4 emotional road curiosities (all seems lost, the calm
   before the storm, a small win to hold on to, knowing it ends badly), each with its own graded sliders and a
   momentum note, tied into suites, proximities and proximity suites. Loaded after db-depth-look.js. Written
   2026-10-04 by the depth thread (fx). */
(function (DB) {
  const SHARED = (push) => [
    { id: "push", label: "Pushes the story", range: { min: 0, max: 5 }, from: push, to: Math.min(5, push + 2), plain: "How much this curiosity moves the story forward here." },
    { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], from: "holds", to: "demands what's next", plain: "Whether it settles something or leaves a question the next moment must answer." },
    { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], from: "loosely", to: "clearly", plain: "How closely it carries one of the film's themes here." },
  ];
  /* c(id, label, workspace, plain, sliders, momentum [push 0-5, plot, theme, pull, cue, tryThis], extra)
     sliders: [id, label, scale-or-range, plain, extra?]; the first slider is the main one.
     scale = ["low", ..., "high"] in order; range = [min, max] or [min, max, "unit"] or [min, max, "unit", step]. */
  function c(id, label, workspace, plain, sliders, m, extra) {
    const row = DB.curiosity(Object.assign({ id, label, plain, workspace, main: sliders[0][0], sliders: sliders.concat(SHARED(m[0])) }, extra || {}));
    if (row && !row.momentum) row.momentum = { push: m[0], plot: m[1], theme: m[2], pull: m[3], cue: m[4], tryThis: m[5] };
  }
  const S = (id, label, workspace, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const P = (id, label, workspace, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace, when, then, within }, extra || {}));
  const PS = (id, label, workspace, plain, members, extra) => DB.proximitySuite(Object.assign({ id, label, plain, workspace, members }, extra || {}));
  const U = { unordered: true };

  /* ---------- new light curiosities ---------- */

  c("flickerWarning", "A light that flickers when something is wrong", "light",
    "A bulb, a strip light or a screen stutters off and on just before, or while, something goes wrong: someone is coming, the power is failing, a mind is slipping. The flicker tells us to worry before anyone says a word.",
    [
      ["flicker", "How much it flickers", [0, 5], "From a steady light (0) to a light that keeps cutting out (5)."],
      ["source", "What flickers", ["a ceiling bulb", "a strip light", "a candle", "a street lamp", "a screen", "every light in the house"], "Which light starts to fail.", U],
      ["rhythm", "How it flickers", ["a slow pulse", "random stutters", "fast buzzing", "one long blackout"], "The pattern of the dark moments.", U],
      ["warns", "What it warns of", ["nothing, just old wiring", "someone is coming", "the power is failing", "something not human", "their mind is slipping"], "What the flicker is really telling us.", U],
      ["dark", "How long each dark moment lasts", [0, 3, "seconds", 0.5], "How long the light stays off before it comes back."],
      ["changed", "What changed when it comes back", ["nothing", "something moved", "someone is there", "someone is gone"], "What is different in the room when the light returns."],
    ],
    [3, "Each dark moment can hide a change in the room, so when the light comes back the scene has moved on.", "Shows how thin the line is between safe and not safe.", "We hold our breath in every dark moment, waiting for the light.", "visual", "Make the hallway bulb flicker twice, and the third time it comes back, let the door at the end be open."]);

  c("shadowTells", "Shadows that tell the story", "light",
    "We see the shadow instead of the thing: a shadow on the wall shows a fight, a figure climbing the stairs, a hand reaching for a door. The shadow can show what happens out of sight, or make a person look bigger and scarier than they are.",
    [
      ["tells", "How much the shadow tells", [0, 5], "From a shadow that is just there (0) to a shadow that carries the whole moment (5)."],
      ["size", "Size against the real thing", ["smaller", "the same", "bigger", "huge, towering"], "How big the shadow looks next to what makes it."],
      ["where", "Where it falls", ["on a wall", "on a floor", "on a curtain", "across a face", "up the stairs"], "The surface that catches the shadow.", U],
      ["shows", "What it shows", ["someone coming", "a fight", "a kiss", "a monster", "who they really are"], "What the shadow lets us see.", U],
      ["sharp", "How sharp the shadow is", ["blurry", "soft", "clear", "razor sharp"], "Whether the edges are soft and unclear or crisp and hard."],
      ["meets", "Do we see the real thing after", ["never", "a moment later", "much later", "yes, and it is smaller"], "Whether the camera ever shows what made the shadow.", U],
    ],
    [3, "A shadow lets the danger or the deed happen out of sight, so the scene can turn without showing it.", "Shows how what we imagine can be bigger than what is real.", "We watch the wall instead of the room, filling in what we cannot see.", "visual", "Show the fight only as two shadows on the kitchen wall, and cut to the real room only when it is over."]);

  c("silhouetteShot", "Only an outline against the light", "light",
    "A person stands in front of a bright window, a doorway or a sunset, so we see only the dark shape of them and not their face (a silhouette). It hides who they are or what they feel, and turns them into a shape: a hero, a stranger or a threat.",
    [
      ["dark", "How dark the person goes", [0, 5], "From a face we can read (0) to a solid black shape (5)."],
      ["behind", "What is bright behind them", ["a window", "an open door", "a sunset", "car headlights", "a fire"], "The light that turns them into an outline.", U],
      ["faceShown", "How much of the face we see", ["none", "an edge of light", "the eyes", "half the face"], "How much of their face escapes the dark."],
      ["pose", "Their shape", ["standing still", "arms out", "walking toward us", "walking away"], "The shape their body makes against the light.", U],
      ["who", "Do we know who it is", ["we know", "we guess", "no idea", "we guess wrong"], "Whether the outline gives their name away.", U],
      ["stepsIn", "When they step into the light", ["never", "right away", "when they speak", "at the end of the scene"], "When the shape turns back into a person.", U],
    ],
    [2, "A stranger in the doorway is a question the scene must answer when they step forward.", "Shows a person as a role or a myth instead of a face.", "We squint at the shape, trying to guess who it is.", "visual", "Put the long-lost brother in the doorway against the afternoon sun, and only let him step into the light when he says her name."]);

  c("lightPool", "A pool of light in the dark", "light",
    "One lamp, one candle or one street light makes a small circle of light, and everything around it is black. People step in and out of it, and the dark around it feels huge. Close to \"Sources\", which counts the lights; this one is about the island of light and the dark around it.",
    [
      ["pool", "How small the pool of light", [0, 5], "From a softly lit room (0) to one tiny circle in total darkness (5)."],
      ["lamp", "What makes the light", ["a desk lamp", "a candle", "a street lamp", "a torch", "a phone screen", "a single hanging bulb"], "The one source in the dark.", U],
      ["rim", "Edge of the pool", ["fades slowly", "soft", "sharp"], "Whether the light melts into the dark or stops in a hard line."],
      ["inside", "Who is in the light", ["nobody", "a thing on the table", "one person", "two people"], "What the circle of light holds.", U],
      ["outside", "What waits in the dark", ["nothing", "the rest of the room", "someone watching", "the thing we fear"], "What could be just outside the light."],
      ["moves", "Does the light move", ["stays", "swings", "is carried", "is going out"], "Whether the pool stays put, sways, travels or dies.", U],
    ],
    [2, "Anyone who steps into the light changes the scene, and the light going out ends it.", "Shows how small and alone a person can be against a big dark world.", "We watch the edge of the circle, waiting for something to step in.", "visual", "Light the interrogation with one bulb over the table, and let the detective walk out of the light every time he lies."]);

  /* ---------- new effects curiosities ---------- */

  c("rainOnWindow", "Rain on the window", "effects",
    "Rain runs down a window between us and a person, or the person stares out through it. The drops blur and break up the world behind. It is an old, strong way to show sadness, waiting or being shut in, and the streaks can look like tears.",
    [
      ["rain", "How much rain on the glass", [0, 5], "From a dry window (0) to water pouring down the glass (5)."],
      ["drops", "How the water moves", ["still drops", "slow trickles", "streams", "a sheet of water"], "Whether the water sits in beads or runs down."],
      ["side", "Which side we are on", ["inside looking out", "outside looking in"], "Whether we look out through the rain with them, or in at them through it.", U],
      ["blur", "How blurred the world behind", [0, 100, "%"], "How much the rain smears what is on the other side of the glass."],
      ["glow", "Lights through the water", ["none", "one warm light", "city lights", "car lights passing"], "Lights behind the glass that the drops break into soft dots.", U],
      ["tears", "Do the streaks line up with a face", ["no", "near the face", "right over the cheek"], "Whether a streak of rain runs where a tear would."],
    ],
    [1, "A person watching the rain is a person waiting for something, and the scene asks what.", "Shows sadness or being trapped without a word or a tear.", "We feel the cold glass and the wait, and want them to go outside.", "visual", "Shoot her through the bus window from outside, and line one rain streak up with her cheek as she reads the text."]);

  c("visibleBreath", "Breath you can see", "effects",
    "In the cold, every breath comes out as a little white cloud. It tells us how cold it is without a word, and it shows feeling too: quick puffs for fear or running, one long cloud for a sigh, two breaths mixing when two people stand close.",
    [
      ["breath", "How much breath shows", [0, 5], "From no breath at all (0) to big clouds with every word (5)."],
      ["cold", "How cold it is", ["cool", "cold", "freezing", "bitter"], "How cold the air is, which sets how thick the clouds are."],
      ["pace", "How fast they breathe", ["slow and calm", "normal", "fast", "gasping"], "The speed of the clouds, which shows how calm or scared they are."],
      ["whose", "Whose breath we see", ["one person", "two people", "a crowd", "an animal"], "Who is breathing out the clouds.", U],
      ["mix", "Do two breaths meet", ["no", "close", "they mix in the air"], "Whether two people's breath touches between them."],
      ["held", "Do they hold their breath", ["never", "for a moment", "to hide", "it stops for good"], "When the clouds stop coming, and why."],
    ],
    [1, "When the breath stops, someone is hiding or someone is gone, and the scene turns on it.", "Shows the body, and life itself, in a cold world.", "We watch the little clouds and read the feeling in them.", "visual", "In the hiding scene, let the kid's breath show in the cold closet, then have her hold it as the footsteps pass."]);

  c("skyMatchesMood", "The sky matches the mood", "effects",
    "The weather turns with the feeling: a storm breaks during the fight, the sun comes out when they make up, rain falls at the funeral. Writers call it pathetic fallacy. Used openly it feels big and old-fashioned; turned against the mood, like sunshine at a funeral, it feels cruel or strange.",
    [
      ["match", "How closely the weather follows the feeling", [0, 5], "From weather that ignores the people (0) to a sky that acts out every feeling (5)."],
      ["sky", "The weather it brings", ["sun breaking through", "wind", "rain", "thunder and lightning", "snow", "fog"], "What the sky does.", U],
      ["way", "With or against the feeling", ["with it", "against it, like sun at a funeral", "it flips halfway"], "Whether the weather agrees with the feeling or mocks it.", U],
      ["timing", "When it turns", ["before the feeling, as a warning", "with the feeling", "just after"], "Whether the sky warns us, joins in, or answers.", U],
      ["size", "How big the change", ["a small shift", "a clear change", "the whole sky turns"], "How much the weather changes."],
      ["noticed", "Do the characters notice", ["no", "they look up", "they say something about it", "it soaks them"], "How much the people in the story feel the weather."],
    ],
    [2, "A storm that starts as a warning tells us the next scene will break something.", "Shows the world feeling with the characters, or not caring at all.", "We read the sky as a promise of what the people are about to feel.", "visual", "Keep the wedding sunny all day, then let one cloud cross the sun the moment the best man hesitates."]);

  c("fogReveal", "Fog that hides, then shows", "effects",
    "Fog, mist, smoke or dust hides what is ahead, then thins to show it: a figure walks out of the mist, a ship appears, the fog lifts and the army is right there. It builds a question (what is in there?) and then answers it.",
    [
      ["fog", "How thick the fog", [0, 5], "From clear air (0) to a wall of white we cannot see into (5)."],
      ["air", "What hides it", ["mist", "thick fog", "smoke", "dust", "steam"], "What fills the air.", U],
      ["hides", "What hides inside", ["nothing", "a path", "a person", "a crowd", "a monster"], "What is waiting in the fog."],
      ["first", "What comes out first", ["a shape", "a light", "a sound", "all of it at once"], "How the hidden thing starts to show.", U],
      ["clears", "How the fog clears", ["it never clears", "slowly", "in a gust", "they walk out of it"], "How the hidden thing is finally shown.", U],
      ["near", "How close before we see it", ["far away", "halfway", "close", "right in front of us"], "How near the thing is when we can finally see it."],
    ],
    [3, "What steps out of the fog is a new player in the story, and the scene turns on it.", "Shows how much is unknown just a few steps away.", "We stare into the white, waiting for a shape.", "visual", "Let the search party call his name into the fog, and have the dog come out of it first, alone."]);

  /* ---------- new layers curiosities ---------- */

  c("memoryOverlay", "A memory laid over the present", "layers",
    "A memory plays on top of the present scene: faded over it like a ghost, in a small window in the corner (picture in picture), or filling an empty chair. We see what the character remembers while they stand in the now. Close to \"Overlay\", which is the editing tool; this one is about using it for a memory.",
    [
      ["memory", "How strongly the memory shows", [0, 5], "From no memory at all (0) to the past nearly covering the present (5)."],
      ["how", "How the memory is laid in", ["faded over the whole picture", "in a small window", "in one part of the room", "in a reflection"], "Where the memory sits in the frame.", U],
      ["solid", "How solid the memory looks", [0, 100, "%"], "From a faint ghost (0%) to as solid as the present (100%)."],
      ["pastLook", "Look of the memory", ["same as now", "warmer", "black and white", "grainy like old video"], "How the past is colored so we can tell it apart.", U],
      ["lines", "What lines up with the present", ["nothing", "the place", "the person's pose", "the same words"], "What the memory and the now have in common.", U],
      ["leaves", "How it leaves", ["fades out", "snaps away", "stays and follows them", "someone walks through it"], "How the past lets go of the present.", U],
    ],
    [2, "A memory that floats over the present shows what drives the character right now.", "Shows how the past lives inside the present.", "We watch two times at once and feel what has been lost.", "visual", "Lay the old birthday party faintly over the empty kitchen, so the kids from back then run through the father standing there now."]);

  c("oneColorLeft", "One thing keeps its color", "layers",
    "The whole picture goes black and white except one thing: a red coat, a yellow balloon, a pair of blue eyes. Our eye goes straight to it, and the color carries the meaning. Editors make it with a mask, a cut-out shape that keeps the color only inside it.",
    [
      ["kept", "How strongly only that thing keeps color", [0, 5], "From a full-color picture (0) to everything grey except the one thing (5)."],
      ["what", "What keeps its color", ["a piece of clothing", "a flower", "a light", "eyes", "blood", "a toy"], "The one thing that stays in color.", U],
      ["hue", "Its color", ["red", "yellow", "blue", "green", "gold"], "The color that survives.", U],
      ["rest", "The rest of the picture", ["full color, just faded", "pale color", "black and white"], "How much color the rest of the picture loses."],
      ["size", "How big it is in the frame", [0, 50, "%"], "How much of the frame the colored thing takes up."],
      ["lasts", "How long it lasts", ["one shot", "one scene", "the whole film", "until it is gone"], "How long the color trick stays.", U],
    ],
    [2, "When the colored thing turns up again, or is gone, the story tells us something without words.", "Shows one life, one hope or one loss standing out in a grey world.", "Our eye hunts for the color in every shot.", "visual", "Keep only the girl's red scarf in color through the grey city, and let it appear again, much later, on a stranger."]);

  c("scribblesOnTop", "Drawings on top of the picture", "layers",
    "Hand-drawn lines, doodles, arrows or little cartoons are drawn over the filmed picture: a heart over a crush, a plan sketched on the street, a rain cloud over someone's head. It shows what a character is thinking or makes the film feel like a diary.",
    [
      ["drawn", "How much is drawn on", [0, 5], "From a clean picture (0) to drawings all over it (5)."],
      ["style", "Drawing style", ["chalk", "crayon", "neat pen", "felt tip marker", "glowing neon"], "What the lines look like they were drawn with.", U],
      ["shows", "What the drawings show", ["arrows and labels", "a plan", "feelings, like hearts and clouds", "a made-up world", "notes and sums"], "What the drawings are about.", U],
      ["moves", "Do they move", ["still", "wobble", "draw themselves", "move with the person"], "Whether the drawings sit still or come alive."],
      ["whose", "Whose drawing it is", ["nobody's", "the hero's thoughts", "a child's", "the narrator's"], "Whose mind the drawings come from.", U],
      ["ink", "Line color", ["white", "black", "yellow", "many colors"], "The color of the lines.", U],
    ],
    [1, "A drawn plan or a drawn wish tells us what the character will try next.", "Shows the inside of a mind laid over the outside world.", "We read the drawings to know what they are really thinking.", "visual", "As he walks to school, let a scribbled chalk arrow and a little heart point at the girl he is too shy to talk to."]);

  c("journeyMap", "A map that shows the journey", "layers",
    "The film cuts to a map, or lays one over the picture, and a line crawls across it from one place to the next. It tells us how far they went in a few seconds, and makes a trip feel like an adventure.",
    [
      ["trip", "How far the line travels", [0, 5], "From a short hop across town (0) to across the world (5)."],
      ["mapLook", "Look of the map", ["an old paper map", "a clean modern map", "a hand-drawn map", "a phone map", "a globe"], "The kind of map we see.", U],
      ["line", "The line", ["dotted", "solid", "dashed", "a little plane or car"], "What draws the path across the map.", U],
      ["seconds", "How long the line takes", [1, 10, "seconds"], "How long the map stays on screen while the line moves."],
      ["over", "Map over the picture", ["the map fills the screen", "faded over the picture", "in a corner"], "Whether the map takes over or sits on top of the scene.", U],
      ["stops", "Stops along the way", [0, 6], "How many places the line pauses at."],
    ],
    [2, "The line moves the story to a new place in seconds, so the next scene starts somewhere new.", "Shows a life as a journey with a start and an end.", "We follow the line and wonder what waits where it stops.", "visual", "Draw a dotted line from the village to the city on an old paper map, and stop it once halfway, where something will go wrong."]);

  /* ---------- new editing and structure curiosities ---------- */

  c("toldBackwards", "The story told backwards", "structure",
    "The film starts at the end and steps back, scene by scene, to how it all began. We stop asking \"what will happen?\" and start asking \"how did it come to this?\".",
    [
      ["backwards", "How much of the story runs backwards", [0, 5], "From a normal forward story (0) to every scene stepping back in time (5)."],
      ["steps", "How big each step back", ["minutes", "hours", "days", "years"], "How far back each new scene jumps."],
      ["startsAt", "Where it starts", ["the very end", "just after the turn", "the worst moment", "an ordinary day"], "The first scene we see.", U],
      ["forward", "Forward scenes woven in", ["none", "a few", "every other scene"], "Whether some scenes still move forward in between."],
      ["signs", "How we know we moved back", ["no help", "small clues", "a date on screen", "a clear sign each time"], "How much the film helps us keep track."],
      ["endsOn", "What it ends on", ["the first meeting", "the cause of it all", "a happy moment", "the start of the lie"], "The last scene, which is the earliest moment.", U],
    ],
    [3, "Each step back answers why the last scene happened and opens a new question about the one before.", "Shows how every ending grows out of small moments.", "We want to reach the start and see the first wrong step.", "thought", "Open on the empty apartment after the breakup, and end the film on the day they first carried the couch in, laughing."]);

  c("flashForward", "A glimpse of what is coming", "structure",
    "The film jumps ahead for a moment to show something that has not happened yet, then goes back. It can tease (how did they end up here?), warn, or promise. A freeze frame with a voice saying \"you're probably wondering how I got here\" is one kind.",
    [
      ["glimpse", "How much of the future it shows", [0, 5], "From a split-second flash (0) to a whole scene (5)."],
      ["shows", "What it shows", ["a happy moment", "a disaster", "a death", "a strange place", "the hero in trouble"], "What the glimpse of the future holds.", U],
      ["jump", "How far ahead", ["minutes", "days", "years", "the very end"], "How far the film jumps forward."],
      ["clear", "How clear it is", ["a blur", "pieces", "clear but confusing", "perfectly clear"], "How much of the future we can make out."],
      ["catchUp", "When the story catches up to it", ["early", "the middle", "near the end", "never"], "When the film reaches the moment it showed us."],
      ["twist", "Is it what it seemed", ["exactly as shown", "a little different", "the opposite of what we thought"], "Whether the glimpse fooled us."],
    ],
    [4, "The glimpse becomes a place the story must reach, and every scene moves toward it.", "Shows fate, or how a life can be read from its ending.", "We wait for the story to catch up and explain the glimpse.", "plot", "Open on the hero hanging upside down in a freezer with a voice saying 'Let me back up', then jump back three days."]);

  c("sameMomentAgain", "The same moment from another side", "structure",
    "We see a scene, then later see the same moment again from someone else's point of view, or from another place in the room. The second time shows something we missed, and the meaning of the scene changes.",
    [
      ["again", "How much the second look changes things", [0, 5], "From the same scene shown again (0) to a scene that means the opposite (5)."],
      ["times", "Times we see it", [2, 6], "How many times the moment is shown."],
      ["fromWhere", "Seen again from", ["another person's eyes", "another place in the room", "a camera in the story", "much later, in memory"], "Where the second look comes from.", U],
      ["gap", "When it comes back", ["right away", "later in the scene", "later in the film", "at the very end"], "How long we wait before seeing it again."],
      ["newSide", "What the new side shows", ["a small detail", "what someone else was doing", "why it happened", "it changes everything"], "What we learn the second time."],
      ["marked", "How the repeat is marked", ["no mark", "a rewind sound", "a title card", "the same line of dialogue"], "How the film tells us we are seeing it again.", U],
    ],
    [3, "The new side shows what was really going on, which turns the story.", "Shows that the truth depends on where you stand.", "We watch the second time for the thing we missed.", "thought", "Show the car crash from the driver's seat, then at the end from the sidewalk, where we see the other driver was on the phone with the hero's wife."]);

  c("falseEnding", "It seems to end, but doesn't", "structure",
    "The story looks finished: the villain falls, the music swells, maybe the credits even start. Then it starts again with one more twist or danger. Horror loves it (the hand reaching out of the grave).",
    [
      ["fake", "How convincing the fake ending", [0, 5], "From a small pause (0) to an ending we fully believe (5)."],
      ["signs", "Signs that it's over", ["a quiet moment", "the music swells", "a fade to black", "the credits begin"], "How far the film goes in pretending to end."],
      ["wait", "How long before it starts again", [0, 120, "seconds"], "How long we believe it is over."],
      ["comesBack", "What comes back", ["the villain", "the danger", "a new problem", "a secret", "the joke"], "What breaks the false ending.", U],
      ["tone", "How it starts again", ["a jump scare", "slow dread", "a laugh", "a sad turn"], "The feeling of the restart.", U],
      ["after", "After the restart", ["a real ending", "another fake", "it ends on the shock"], "What happens once the story starts again.", U],
    ],
    [4, "Breaking the false ending throws the story into one more round.", "Shows that danger, or the past, never really ends.", "We let our breath out, then are pulled right back in.", "plot", "Let the family drive away from the burning house as the music swells, then hold on the back seat a little too long."]);

  c("toldBySomeone", "Someone telling the story", "structure",
    "The film is a story told by someone inside it: an old woman remembering, a grandfather reading to a child, a suspect telling police what happened. We keep coming back to the teller, and we can ask whether they tell it straight.",
    [
      ["teller", "How much we see the teller", [0, 5], "From a voice only at the start (0) to cutting back to the teller often (5)."],
      ["who", "Who tells it", ["the hero, years later", "someone who watched", "a parent to a child", "a suspect to police", "a stranger"], "Whose story it is to tell.", U],
      ["listener", "Who listens", ["nobody, just us", "a child", "a friend", "the police", "a crowd"], "Who the story is told to.", U],
      ["trust", "How much we can trust them", ["fully", "they forget things", "they make it nicer", "lying"], "Whether the teller tells it straight."],
      ["breaks", "Do they break into the story", ["never", "a voice now and then", "they argue with the listener", "they change details"], "How often the teller interrupts the story they are telling."],
      ["endsWith", "How the telling ends", ["the story just ends", "we learn who they are", "the listener changes", "the teller dies"], "What happens to the teller and the listener at the end.", U],
    ],
    [2, "Coming back to the teller gives the story a second line: what the telling does to the people in the room.", "Shows how stories are shaped by who tells them and why.", "We listen to the teller and watch for the gap between what they say and what we see.", "audio", "Have the grandfather skip a part of the war story, and let the grandson ask why, at the very end."]);

  /* ---------- new emotional road curiosities ---------- */

  c("allIsLost", "All seems lost", "emo-road",
    "Near the end, everything falls apart: the plan fails, a friend leaves or dies, the hero gives up. It is the lowest point, and it has to come at the right time, about three quarters of the way in, so the climb back feels earned. Screenwriters call it the dark night of the soul.",
    [
      ["lost", "How lost it all seems", [0, 5], "From a bad day (0) to nothing left at all (5)."],
      ["when", "Where it falls in the film", [50, 95, "% through the film"], "How far into the film the lowest point comes."],
      ["what", "What is lost", ["the plan", "a friend", "a mentor", "their belief", "their love", "everything"], "What the hero loses.", U],
      ["alone", "Are they alone", ["with friends", "with one person", "alone"], "Who is with the hero at the bottom."],
      ["length", "How long it lasts", [0, 10, "minutes"], "How long the film stays at the bottom."],
      ["spark", "What lifts them", ["a memory", "a friend comes back", "a small sign", "they choose to go on"], "What starts the climb back.", U],
    ],
    [4, "Hitting the bottom forces the last choice that sends the hero into the final push.", "Shows what a person is made of when everything is gone.", "We sit in the dark with them and wait for the spark.", "plot", "After the team quits, leave her alone in the rain-soaked gym for a full minute before the old coach's whistle falls out of her bag."]);

  c("calmBeforeStorm", "The calm before the storm", "emo-road",
    "Just before the big fight, the escape or the climax, everything goes quiet: a shared meal, a joke, a night by the fire, a last look. It is different from \"Breather\", which rests us after a big scene. This calm comes before, and makes us care about what we are about to lose.",
    [
      ["calm", "How calm it gets", [0, 5], "From a short pause (0) to a long, peaceful stillness (5)."],
      ["fills", "What fills the calm", ["a meal together", "a quiet talk", "a joke", "sleep", "getting ready", "a last look at home"], "What the characters do in the quiet.", U],
      ["length", "How long it lasts", [0, 10, "minutes"], "How long the calm holds."],
      ["knows", "Who knows the storm is coming", ["nobody", "the characters", "only the audience", "everyone"], "Who can feel what is about to happen.", U],
      ["sign", "Signs of the storm", ["none", "a distant sound", "the sky darkens", "a clock ticking"], "Small hints that the calm will break."],
      ["breaks", "How it breaks", ["slowly", "with a sound", "all at once"], "How the calm ends."],
    ],
    [2, "The quiet sets up the climax so it hits harder.", "Shows what the characters are fighting for.", "We enjoy the peace and dread its end at the same time.", "audio", "The night before the battle, let the soldiers share one bad joke around the fire, and cut the laugh with a single far-off drum."]);

  c("smallWin", "A small win to hold on to", "emo-road",
    "In the middle of losses, the hero gets one small good thing: a door opens, a stranger helps, a plant grows, a test is passed. It keeps us going and gives hope a place to stand, without solving the big problem.",
    [
      ["win", "How much it matters", [0, 5], "From a passing nice moment (0) to the thing that keeps them going (5)."],
      ["kind", "What the small win is", ["a kind word", "a skill learned", "a small escape", "something found", "a stranger helps"], "What goes right.", U],
      ["size", "How big the win really is", ["tiny", "small", "medium"], "How much it changes their situation."],
      ["cost", "What it costs", ["nothing", "a little", "more than it seems"], "Whether the win has a price."],
      ["shared", "Who shares it", ["alone", "with one friend", "with the group"], "Who gets to feel it with them."],
      ["lasting", "How long the good feeling lasts", ["a moment", "a scene", "until the end"], "Whether the next blow comes right away."],
    ],
    [2, "A small win shows the hero can win, which sets up the big one.", "Shows that hope is built from small things.", "We cheer the little thing and want the next one.", "plot", "In the prison film, let him finally get the radio to play one song, and let the whole yard stop to listen."]);

  c("doomedFromStart", "We already know it ends badly", "emo-road",
    "The film tells us early how it ends (the ship sinks, the hero dies, the town is gone), so every happy moment hurts a little. We watch not for what happens but for how, and we wish the ending could change.",
    [
      ["doom", "How sure the bad end is", [0, 5], "From a faint hint (0) to an ending we know for certain (5)."],
      ["told", "How we know", ["the title", "an opening scene", "a narrator says it", "we know the real story", "a glimpse of the future"], "Where the knowledge of the ending comes from.", U],
      ["whenTold", "When we learn it", ["the first minute", "the first act", "halfway"], "How early the film tells us."],
      ["joy", "Happy moments before the end", [0, 10], "How many happy scenes the film gives us anyway."],
      ["hopeLeft", "Does the film let us hope", ["never", "a little", "a lot, then takes it"], "Whether we are allowed to think it might be different."],
      ["ending", "How it really ends", ["exactly as told", "worse", "a small surprise", "not as bad"], "Whether the ending matches what we were told.", U],
    ],
    [2, "Knowing the end turns every scene into a step toward it.", "Shows how precious ordinary moments are when they cannot last.", "We watch the happy scenes with a lump in our throat.", "thought", "Start the summer romance with the narrator saying she will be gone by September, then give them a perfect first week."]);

  /* ---------- suites ---------- */

  S("the-failing-hallway", "The failing hallway", "light",
    "A strip light buzzing and cutting out, a small pool of light at the end of the corridor, and a shadow climbing the wall.",
    [
      { curiosity: "flickerWarning", value: 4 },
      { curiosity: "flickerWarning", slider: "source", value: "a strip light" },
      { curiosity: "flickerWarning", slider: "rhythm", value: "random stutters" },
      { curiosity: "flickerWarning", slider: "changed", value: "something moved", weight: 70 },
      { curiosity: "lightPool", value: 3, weight: 70 },
      { curiosity: "shadowTells", value: 3, weight: 60 },
      { curiosity: "dread", value: 4, weight: 60 },
    ], { also: ["emo-road"] });

  S("figure-in-the-doorway", "The figure in the doorway", "light",
    "A dark outline against a bright doorway, a long shadow across the floor ahead of them, and no idea who it is.",
    [
      { curiosity: "silhouetteShot", value: 5 },
      { curiosity: "silhouetteShot", slider: "behind", value: "an open door" },
      { curiosity: "silhouetteShot", slider: "who", value: "no idea" },
      { curiosity: "silhouetteShot", slider: "stepsIn", value: "when they speak", weight: 70 },
      { curiosity: "shadowTells", value: 3, weight: 70 },
      { curiosity: "shadowTells", slider: "where", value: "on a floor", weight: 60 },
    ]);

  S("one-lamp-one-night", "One lamp, one night", "light",
    "A single hanging bulb over a table, a sharp edge to the light, and someone watching from the dark.",
    [
      { curiosity: "lightPool", value: 5 },
      { curiosity: "lightPool", slider: "lamp", value: "a single hanging bulb" },
      { curiosity: "lightPool", slider: "rim", value: "sharp" },
      { curiosity: "lightPool", slider: "inside", value: "two people" },
      { curiosity: "lightPool", slider: "outside", value: "someone watching", weight: 70 },
      { curiosity: "loneliness", value: 3, weight: 50 },
    ]);

  S("waiting-by-the-window", "Waiting by the window", "effects",
    "Rain streaming down the glass, seen from outside, city lights blurred behind, and a longing that will not let go.",
    [
      { curiosity: "rainOnWindow", value: 4 },
      { curiosity: "rainOnWindow", slider: "drops", value: "streams" },
      { curiosity: "rainOnWindow", slider: "side", value: "outside looking in" },
      { curiosity: "rainOnWindow", slider: "glow", value: "city lights", weight: 70 },
      { curiosity: "longing", value: 4, weight: 70 },
      { curiosity: "loneliness", value: 3, weight: 50 },
    ], { also: ["emo-road"] });

  S("frozen-night-out", "A frozen night out", "effects",
    "Bitter cold, two people's breath mixing in the air between them, and one pool of street light.",
    [
      { curiosity: "visibleBreath", value: 4 },
      { curiosity: "visibleBreath", slider: "cold", value: "bitter" },
      { curiosity: "visibleBreath", slider: "whose", value: "two people" },
      { curiosity: "visibleBreath", slider: "mix", value: "they mix in the air" },
      { curiosity: "lightPool", value: 3, weight: 60 },
      { curiosity: "lightPool", slider: "lamp", value: "a street lamp", weight: 60 },
      { curiosity: "tenderness", value: 3, weight: 60 },
    ], { also: ["emo-road"] });

  S("storm-in-the-heart", "Storm in the heart", "effects",
    "A quiet evening before the storm breaks, thunder rolling in as a warning, and the whole sky turning with the fight.",
    [
      { curiosity: "skyMatchesMood", value: 5 },
      { curiosity: "skyMatchesMood", slider: "sky", value: "thunder and lightning" },
      { curiosity: "skyMatchesMood", slider: "timing", value: "before the feeling, as a warning" },
      { curiosity: "skyMatchesMood", slider: "size", value: "the whole sky turns" },
      { curiosity: "calmBeforeStorm", value: 3, weight: 70 },
      { curiosity: "calmBeforeStorm", slider: "sign", value: "the sky darkens", weight: 60 },
    ], { also: ["emo-road"] });

  S("out-of-the-mist", "Out of the mist", "effects",
    "Thick fog, a dark shape coming out of it before anything else, and the whole of it close before we can see it.",
    [
      { curiosity: "fogReveal", value: 5 },
      { curiosity: "fogReveal", slider: "air", value: "thick fog" },
      { curiosity: "fogReveal", slider: "first", value: "a shape" },
      { curiosity: "fogReveal", slider: "near", value: "close" },
      { curiosity: "silhouetteShot", value: 4, weight: 60 },
      { curiosity: "openQuestions", value: 3, weight: 60 },
    ], { also: ["light"] });

  S("ghosts-of-the-old-house", "Ghosts of the old house", "layers",
    "Warm, faded memories of a family laid over the empty rooms, lined up with the same place, staying after the person walks on.",
    [
      { curiosity: "memoryOverlay", value: 4 },
      { curiosity: "memoryOverlay", slider: "how", value: "faded over the whole picture" },
      { curiosity: "memoryOverlay", slider: "pastLook", value: "warmer" },
      { curiosity: "memoryOverlay", slider: "lines", value: "the place" },
      { curiosity: "memoryOverlay", slider: "solid", value: 35, weight: 70 },
      { curiosity: "nostalgia", value: 4, weight: 70 },
    ], { also: ["emo-road"] });

  S("the-red-coat", "The red coat", "layers",
    "Black and white all through, except one small red coat that we follow, until it is gone.",
    [
      { curiosity: "oneColorLeft", value: 5 },
      { curiosity: "oneColorLeft", slider: "what", value: "a piece of clothing" },
      { curiosity: "oneColorLeft", slider: "hue", value: "red" },
      { curiosity: "oneColorLeft", slider: "rest", value: "black and white" },
      { curiosity: "oneColorLeft", slider: "lasts", value: "until it is gone" },
      { curiosity: "oneColorLeft", slider: "size", value: 5, weight: 70 },
    ]);

  S("a-diary-on-the-move", "A diary on the move", "layers",
    "Felt-tip doodles of the hero's thoughts over the picture, and a hand-drawn map with a dotted line for every trip.",
    [
      { curiosity: "scribblesOnTop", value: 3 },
      { curiosity: "scribblesOnTop", slider: "style", value: "felt tip marker" },
      { curiosity: "scribblesOnTop", slider: "whose", value: "the hero's thoughts" },
      { curiosity: "scribblesOnTop", slider: "moves", value: "draw themselves" },
      { curiosity: "journeyMap", value: 3, weight: 80 },
      { curiosity: "journeyMap", slider: "mapLook", value: "a hand-drawn map", weight: 80 },
      { curiosity: "journeyMap", slider: "line", value: "dotted", weight: 70 },
    ]);

  S("from-the-end-back", "From the end, back", "structure",
    "The film opens at the very end, steps back by days with a date on screen each time, and we know from the start it ends badly.",
    [
      { curiosity: "toldBackwards", value: 5 },
      { curiosity: "toldBackwards", slider: "startsAt", value: "the very end" },
      { curiosity: "toldBackwards", slider: "steps", value: "days" },
      { curiosity: "toldBackwards", slider: "signs", value: "a date on screen" },
      { curiosity: "doomedFromStart", value: 4, weight: 70 },
      { curiosity: "doomedFromStart", slider: "told", value: "an opening scene", weight: 60 },
    ], { also: ["emo-road"] });

  S("how-did-i-get-here", "How did I get here?", "structure",
    "A short, clear glimpse of the hero in trouble at the start, then the hero, years later, telling us how it came to this.",
    [
      { curiosity: "flashForward", value: 2 },
      { curiosity: "flashForward", slider: "shows", value: "the hero in trouble" },
      { curiosity: "flashForward", slider: "clear", value: "perfectly clear" },
      { curiosity: "flashForward", slider: "catchUp", value: "near the end" },
      { curiosity: "toldBySomeone", value: 2, weight: 70 },
      { curiosity: "toldBySomeone", slider: "who", value: "the hero, years later", weight: 70 },
    ]);

  S("the-same-night-twice", "The same night, twice", "structure",
    "The party is shown again later in the film through another person's eyes, and this time we see why it happened.",
    [
      { curiosity: "sameMomentAgain", value: 4 },
      { curiosity: "sameMomentAgain", slider: "fromWhere", value: "another person's eyes" },
      { curiosity: "sameMomentAgain", slider: "gap", value: "later in the film" },
      { curiosity: "sameMomentAgain", slider: "newSide", value: "why it happened" },
      { curiosity: "sameMomentAgain", slider: "marked", value: "the same line of dialogue", weight: 60 },
    ]);

  S("it-is-not-over", "It is not over", "structure",
    "A quiet moment that feels like the end, a long wait in the calm, then the villain is back with a jump scare.",
    [
      { curiosity: "falseEnding", value: 4 },
      { curiosity: "falseEnding", slider: "signs", value: "a quiet moment" },
      { curiosity: "falseEnding", slider: "comesBack", value: "the villain" },
      { curiosity: "falseEnding", slider: "tone", value: "a jump scare" },
      { curiosity: "falseEnding", slider: "wait", value: 40, weight: 70 },
      { curiosity: "calmBeforeStorm", value: 2, weight: 50 },
    ]);

  S("back-from-the-bottom", "Back from the bottom", "emo-road",
    "Everything is lost three quarters of the way in, the hero is alone, then a small sign lifts them and a small win gives hope a place to stand.",
    [
      { curiosity: "allIsLost", value: 5 },
      { curiosity: "allIsLost", slider: "when", value: 75 },
      { curiosity: "allIsLost", slider: "alone", value: "alone" },
      { curiosity: "allIsLost", slider: "spark", value: "a small sign" },
      { curiosity: "smallWin", value: 4, weight: 70 },
      { curiosity: "smallWin", slider: "shared", value: "with one friend", weight: 60 },
      { curiosity: "hope", value: 3, weight: 60 },
    ], { also: ["structure"] });

  /* ---------- proximities ---------- */

  P("flicker-brings-dread", "When the light flickers more, dread rises", "light",
    "When a light stutters and cuts out more, dread rises within a beat.",
    { curiosity: "flickerWarning", change: "rises" }, { curiosity: "dread", change: "rises" }, 1, { also: ["emo-road"] });
  P("light-back-someone-gone-questions", "When the light comes back and someone is gone, the questions pile up", "light",
    "When the light returns to a room with one person missing, the open questions grow within a beat.",
    { curiosity: "flickerWarning", slider: "changed", is: "someone is gone" }, { curiosity: "openQuestions", change: "rises" }, 1, { also: ["plot"] });
  P("clock-runs-lights-fail", "When the clock is running out, the lights start to fail", "light",
    "When the deadline gets close, a light starts to flicker within 2 beats.",
    { curiosity: "tickingClock", change: "rises" }, { curiosity: "flickerWarning", change: "rises" }, 2, { also: ["plot"] });
  P("towering-shadow-dread", "When the shadow towers over the room, dread rises", "light",
    "When a shadow grows far bigger than the thing that makes it, dread rises within a beat.",
    { curiosity: "shadowTells", slider: "size", is: "huge, towering" }, { curiosity: "dread", change: "rises" }, 1, { also: ["emo-road"] });
  P("shadow-tells-out-of-sight", "When the shadow tells more, more happens out of sight", "light",
    "When the shadow carries the moment, more of the action is kept out of the frame within a beat.",
    { curiosity: "shadowTells", change: "rises" }, { curiosity: "offscreen", change: "rises" }, 1, { also: ["focus"] });
  P("shadow-smaller-relief", "When the real thing turns out smaller than its shadow, relief comes", "light",
    "When the camera finally shows a small cat where the monster's shadow was, relief rises within a beat.",
    { curiosity: "shadowTells", slider: "meets", is: "yes, and it is smaller" }, { curiosity: "relief", change: "rises" }, 1, { also: ["emotion"] });
  P("unknown-outline-questions", "When we have no idea who the outline is, the questions pile up", "light",
    "When the dark shape in the doorway could be anyone, the open questions grow within a beat.",
    { curiosity: "silhouetteShot", slider: "who", is: "no idea" }, { curiosity: "openQuestions", change: "rises" }, 1, { also: ["plot"] });
  P("steps-into-light-reveal", "When they step into the light as they speak, the reveal lands", "light",
    "When the outline steps forward and speaks, the audience learns who it is within a beat.",
    { curiosity: "silhouetteShot", slider: "stepsIn", is: "when they speak" }, { curiosity: "reveal", change: "rises" }, 1, { also: ["structure"] });
  P("small-pool-loneliness", "When the pool of light gets smaller, loneliness grows", "light",
    "When the light shrinks to one small circle in the dark, loneliness grows within 2 beats.",
    { curiosity: "lightPool", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("light-going-out-clock", "When the only light is going out, the clock starts running", "light",
    "When the one candle or torch starts to die, a deadline is felt within a beat.",
    { curiosity: "lightPool", slider: "moves", is: "is going out" }, { curiosity: "tickingClock", change: "rises" }, 1, { also: ["plot"] });

  P("rain-on-glass-longing", "When more rain runs down the glass, longing grows", "effects",
    "When the window streams with rain between a person and the world, longing grows within 2 beats.",
    { curiosity: "rainOnWindow", change: "rises" }, { curiosity: "longing", change: "rises" }, 2, { also: ["emo-road"] });
  P("rain-streak-cheek-empathy", "When a rain streak runs over the cheek, we feel with them", "effects",
    "When a streak of rain on the glass lines up with a cheek like a tear, the audience feels with them within a beat.",
    { curiosity: "rainOnWindow", slider: "tears", is: "right over the cheek" }, { curiosity: "empathy", change: "rises" }, 1, { also: ["emotion"] });
  P("grief-brings-rain-on-glass", "When grief gets heavier, the rain comes to the window", "emo-road",
    "When grief deepens, rain on the window follows within 3 beats.",
    { curiosity: "grief", change: "rises" }, { curiosity: "rainOnWindow", change: "rises" }, 3, { also: ["effects"] });
  P("breath-mixes-tenderness", "When their breath mixes in the cold air, tenderness grows", "effects",
    "When two people stand so close their breath meets, tenderness rises within a beat.",
    { curiosity: "visibleBreath", slider: "mix", is: "they mix in the air" }, { curiosity: "tenderness", change: "rises" }, 1, { also: ["emotion"] });
  P("gasping-breath-tension", "When the breath comes in gasps, tension rises", "effects",
    "When the clouds of breath come fast and ragged, tension rises within a beat.",
    { curiosity: "visibleBreath", slider: "pace", is: "gasping" }, { curiosity: "tensionCurve", change: "rises" }, 1, { also: ["structure"] });
  P("held-breath-hiding-dread", "When they hold their breath to hide, dread rises", "effects",
    "When the little clouds stop because someone is hiding, dread rises within a beat.",
    { curiosity: "visibleBreath", slider: "held", is: "to hide" }, { curiosity: "dread", change: "rises" }, 1, { also: ["emo-road"] });
  P("sun-at-funeral-mixed", "When the sky goes against the feeling, our feelings get mixed", "effects",
    "When the sun shines on a sad day, or rain falls on a happy one, mixed feelings rise within 2 beats.",
    { curiosity: "skyMatchesMood", slider: "way", is: "against it, like sun at a funeral" }, { curiosity: "mixedFeelings", change: "rises" }, 2, { also: ["emotion"] });
  P("warning-sky-dread", "When the sky turns before the feeling, dread rises", "effects",
    "When the weather darkens as a warning, dread rises within 2 beats.",
    { curiosity: "skyMatchesMood", slider: "timing", is: "before the feeling, as a warning" }, { curiosity: "dread", change: "rises" }, 2, { also: ["emo-road"] });
  P("calm-ends-in-storm", "When the calm before the storm lasts longer, the sky turns harder", "emo-road",
    "When the quiet before the climax goes on, the weather breaks with the feeling within 4 beats.",
    { curiosity: "calmBeforeStorm", change: "rises" }, { curiosity: "skyMatchesMood", change: "rises" }, 4, { also: ["effects"] });
  P("thick-fog-questions", "When the fog gets thicker, the questions pile up", "effects",
    "When the fog hides more of what is ahead, the open questions grow within a beat.",
    { curiosity: "fogReveal", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 1, { also: ["plot"] });
  P("shape-in-fog-outline", "When a shape comes out of the fog first, we see only its outline", "effects",
    "When the hidden thing shows as a shape before anything else, an outline against the light follows within a beat.",
    { curiosity: "fogReveal", slider: "first", is: "a shape" }, { curiosity: "silhouetteShot", change: "rises" }, 1, { also: ["light"] });
  P("crowd-from-fog-awe", "When a crowd comes out of the fog, awe rises", "effects",
    "When the fog lifts on an army or a whole crowd, awe rises within a beat.",
    { curiosity: "fogReveal", slider: "hides", is: "a crowd" }, { curiosity: "awe", change: "rises" }, 1, { also: ["emotion"] });

  P("memory-over-now-nostalgia", "When the memory shows more strongly over the present, nostalgia comes", "layers",
    "When the past is laid more strongly over the now, a longing for the past rises within 2 beats.",
    { curiosity: "memoryOverlay", change: "rises" }, { curiosity: "nostalgia", change: "rises" }, 2, { also: ["emo-road"] });
  P("memory-follows-grief", "When the memory stays and follows them, grief gets heavier", "layers",
    "When the memory will not let go of the present, grief deepens within 2 beats.",
    { curiosity: "memoryOverlay", slider: "leaves", is: "stays and follows them" }, { curiosity: "grief", change: "rises" }, 2, { also: ["emo-road"] });
  P("feeling-echo-brings-memory", "When a feeling comes back, the memory shows over the present", "emo-road",
    "When an old feeling returns, the memory behind it is laid over the scene within 2 beats.",
    { curiosity: "feelingEcho", change: "rises" }, { curiosity: "memoryOverlay", change: "rises" }, 2, { also: ["layers"] });
  P("kept-color-eye-first", "When only one thing keeps its color, the eye goes there first", "layers",
    "When the rest of the picture goes grey, our eye lands on the colored thing first within a beat.",
    { curiosity: "oneColorLeft", change: "rises" }, { curiosity: "eyeFirst", change: "rises" }, 1, { also: ["focus"] });
  P("kept-color-gone-grief", "When the one colored thing is gone, grief comes", "layers",
    "When the last bit of color disappears from the film, grief rises within 2 beats.",
    { curiosity: "oneColorLeft", slider: "lasts", is: "until it is gone" }, { curiosity: "grief", change: "rises" }, 2, { also: ["emo-road"] });
  P("drawn-thoughts-empathy", "When the drawings show the hero's thoughts, we feel with them", "layers",
    "When the doodles come from the hero's own head, the audience feels with them within 2 beats.",
    { curiosity: "scribblesOnTop", slider: "whose", is: "the hero's thoughts" }, { curiosity: "empathy", change: "rises" }, 2, { also: ["emotion"] });
  P("drawn-plan-shown", "When the drawings sketch a plan, the plan is shown", "layers",
    "When the lines on the picture draw out a plan, the plan is laid out for us within a beat.",
    { curiosity: "scribblesOnTop", slider: "shows", is: "a plan" }, { curiosity: "planShown", change: "rises" }, 1, { also: ["plot"] });
  P("map-line-skips-time", "When the map line travels further, more time is skipped", "layers",
    "When the line crosses more of the map, the film skips ahead in time within a beat.",
    { curiosity: "journeyMap", change: "rises" }, { curiosity: "timeSkip", change: "rises" }, 1, { also: ["structure"] });

  P("backwards-knows-ending", "When the story runs backwards, we already know how it ends", "structure",
    "When the film steps back from the end, the sense of a known ending grows within 2 beats.",
    { curiosity: "toldBackwards", change: "rises" }, { curiosity: "doomedFromStart", change: "rises" }, 2, { also: ["emo-road"] });
  P("backwards-asks-why", "When the story runs backwards, we ask why", "structure",
    "When each scene steps further back, the questions about how it came to this grow within 2 beats.",
    { curiosity: "toldBackwards", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 2, { also: ["plot"] });
  P("glimpse-of-death-dread", "When the glimpse of the future shows a death, dread rises", "structure",
    "When the flash ahead shows someone dying, dread rises within a beat and stays.",
    { curiosity: "flashForward", slider: "shows", is: "a death" }, { curiosity: "dread", change: "rises" }, 1, { also: ["emo-road"] });
  P("glimpse-feels-fated", "When the glimpse of the future is clearer, the ending feels fixed", "structure",
    "When the flash ahead is clear, the audience feels the ending is set within 2 beats.",
    { curiosity: "flashForward", change: "rises" }, { curiosity: "doomedFromStart", change: "rises" }, 2, { also: ["emo-road"] });
  P("second-look-who-knows", "When the second look changes more, we know more than they do", "structure",
    "When the repeat shows what one person missed, the audience gets ahead of that character within a beat.",
    { curiosity: "sameMomentAgain", change: "rises" }, { curiosity: "knowledgeGap", change: "rises" }, 1, { also: ["plot"] });
  P("second-look-flips-all", "When the second look changes everything, the story flips", "structure",
    "When the scene seen again means the opposite, a reversal follows within a beat.",
    { curiosity: "sameMomentAgain", slider: "newSide", is: "it changes everything" }, { curiosity: "reversal", change: "rises" }, 1, { also: ["plot"] });
  P("fake-ending-relief", "When the fake ending is more convincing, we let our breath out", "structure",
    "When the false ending is believable, relief rises within a beat, before the restart.",
    { curiosity: "falseEnding", change: "rises" }, { curiosity: "relief", change: "rises" }, 1, { also: ["emotion"] });
  P("villain-back-things-worse", "When the villain comes back after the ending, things get worse", "structure",
    "When the villain returns after we thought it was over, a new complication follows within a beat.",
    { curiosity: "falseEnding", slider: "comesBack", is: "the villain" }, { curiosity: "complication", change: "rises" }, 1, { also: ["plot"] });
  P("lying-teller-untrusted", "When the teller is lying, we cannot trust what we see", "structure",
    "When the person telling the story lies, what we are shown becomes untrustworthy within 2 beats.",
    { curiosity: "toldBySomeone", slider: "trust", is: "lying" }, { curiosity: "unreliableView", change: "rises" }, 2, { also: ["focus"] });
  P("told-to-a-child-warmth", "When the story is told to a child, tenderness grows", "structure",
    "When the teller is speaking to a child, tenderness rises within 2 beats each time we go back to them.",
    { curiosity: "toldBySomeone", slider: "listener", is: "a child" }, { curiosity: "tenderness", change: "rises" }, 2, { also: ["emotion"] });

  P("all-lost-hope-drops", "When all seems lost, hope drops", "emo-road",
    "When everything falls apart, hope drops within a beat.",
    { curiosity: "allIsLost", change: "rises" }, { curiosity: "hope", change: "drops" }, 1);
  P("bottom-then-small-win", "When they hit the bottom, a small win comes next", "emo-road",
    "When all seems lost, a small win follows within 4 beats to start the climb back.",
    { curiosity: "allIsLost", change: "rises" }, { curiosity: "smallWin", change: "rises" }, 4, { also: ["structure"] });
  P("small-win-hope-rises", "When the small win matters more, hope rises", "emo-road",
    "When the small good thing means more, hope rises within a beat.",
    { curiosity: "smallWin", change: "rises" }, { curiosity: "hope", change: "rises" }, 1);
  P("audience-knows-storm-dread", "When only the audience knows the storm is coming, dread rises", "emo-road",
    "When we know the calm will break and the characters do not, dread rises within 2 beats.",
    { curiosity: "calmBeforeStorm", slider: "knows", is: "only the audience" }, { curiosity: "dread", change: "rises" }, 2);
  P("long-calm-tenderness", "When the calm lasts longer, tenderness grows", "emo-road",
    "When the quiet before the storm holds, tenderness between the characters grows within 2 beats.",
    { curiosity: "calmBeforeStorm", change: "rises" }, { curiosity: "tenderness", change: "rises" }, 2, { also: ["emotion"] });
  P("known-end-earned-tears", "When we are surer it ends badly, the tears are earned", "emo-road",
    "When the bad ending is certain, the tears at the end feel earned within 4 beats.",
    { curiosity: "doomedFromStart", change: "rises" }, { curiosity: "earnedTears", change: "rises" }, 4);
  P("known-end-happy-mixed", "When the happy moments come before a known bad end, our feelings get mixed", "emo-road",
    "When the film gives us many happy scenes on the way to the end we know, mixed feelings rise within 2 beats.",
    { curiosity: "doomedFromStart", slider: "joy", is: 10 }, { curiosity: "mixedFeelings", change: "rises" }, 2, { also: ["emotion"] });

  /* ---------- proximity suites ---------- */

  PS("the-light-turns-on-us", "The light turns on us", "light",
    "The clock runs and the lights start to fail, the flicker brings dread, a shadow towers over the room, and when the light comes back someone is gone.",
    ["clock-runs-lights-fail", "flicker-brings-dread", "towering-shadow-dread", "light-back-someone-gone-questions"], { also: ["emo-road"] });
  PS("weather-of-the-heart", "The weather of the heart", "effects",
    "Grief brings the rain to the window, the rain on the glass makes longing grow, a streak runs over the cheek and we feel with them, and a sun that shines anyway mixes our feelings.",
    ["grief-brings-rain-on-glass", "rain-on-glass-longing", "rain-streak-cheek-empathy", "sun-at-funeral-mixed"], { also: ["emo-road"] });
  PS("something-in-the-fog", "Something in the fog", "effects",
    "The fog thickens and the questions pile up, a shape comes out first as an outline, and it steps into the light to show who it is.",
    ["thick-fog-questions", "shape-in-fog-outline", "steps-into-light-reveal"], { also: ["light"] });
  PS("the-past-lays-over-us", "The past lays over us", "layers",
    "An old feeling brings a memory over the present, the memory brings nostalgia, it stays and follows them, and the last bit of color fades into grief.",
    ["feeling-echo-brings-memory", "memory-over-now-nostalgia", "memory-follows-grief", "kept-color-gone-grief"], { also: ["emo-road"] });
  PS("we-know-how-it-ends", "We know how it ends", "structure",
    "The story runs backwards or flashes ahead, the ending feels fixed, the happy moments turn bittersweet, and the tears at the end are earned.",
    ["backwards-knows-ending", "glimpse-feels-fated", "known-end-happy-mixed", "known-end-earned-tears"], { also: ["emo-road"] });
  PS("the-climb-back", "The climb back", "emo-road",
    "All seems lost and hope drops, then a small win comes, and with it hope rises again.",
    ["all-lost-hope-drops", "bottom-then-small-win", "small-win-hope-rises"], { also: ["structure"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
