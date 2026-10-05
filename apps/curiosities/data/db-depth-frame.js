/* data/db-depth-frame.js: color, where the eye goes, words on screen and the shape of the picture, deeper. 4 color
   curiosities (colors that clash on purpose, a color saved for big moments, two colors of light on one face,
   dressed in the colors of the room), 4 focus curiosities (the one still thing in a busy frame, finding one face in
   the crowd, looking the wrong way on purpose, the thing that matters at the edge), 4 titles curiosities (words
   placed into the world, subtitles that play along, the opening credits, their thoughts written on screen) and 4
   canvas curiosities (splitting the screen, the picture shrinking or growing, seeing through a keyhole or
   binoculars, a run of still photos). Each has its own graded sliders and a momentum note, tied into suites,
   proximities and proximity suites. Ideas already in the database are linked to, not repeated: one color for each
   character, a color that warns, how true skin looks, color across the whole film, one color that pops, depth of
   field and focus pulls, a lone bright spot (where the eye goes first), danger behind their back, signs and screens
   behind them, texts on screen, when the title appears, chapter cards, words that act out their meaning, frame
   shape and black bars that change (frame shape), and a frame within a frame. Loaded after db-depth-lines.js.
   Written 2026-10-04 by the depth thread (frame). */
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

  /* ---------- color ---------- */

  c("colorClash", "Colors that clash on purpose", "color",
    "Two colors that fight each other are put in the same frame on purpose, like bright green against red. The picture feels uneasy before anything happens. Not \"The one piece that clashes\", which is one thing a person wears.",
    [
      ["clash", "How hard the colors fight", [0, 5], "How strongly the two colors pull against each other."],
      ["pair", "The two colors", ["red and green", "orange and blue", "purple and yellow", "pink and green", "neon against grey"], "Which two colors are set against each other.", U],
      ["where", "Where the clash is", ["in the clothes", "in the room", "in the light", "everywhere"], "What carries the clashing colors.", U],
      ["when", "When it shows", ["the whole scene", "as the fight grows", "at one moment", "only in one place"], "When the clash is in the picture.", U],
      ["share", "How much of the frame", [10, 90, "%", 10], "How much of the picture the two colors cover together."],
      ["feel", "How it feels", ["playful", "uneasy", "angry", "sick"], "The feeling the clash leaves."],
    ],
    [2, "Marks a scene where two people or two sides cannot sit together, so a fight or a break is coming.", "Shows people or worlds that do not fit.", "We feel something is wrong before anyone says it.", "visual", "Put the angry daughter in bright green inside her mother's red kitchen."]);

  c("savedColor", "A color saved for big moments", "color",
    "One color is kept out of the film almost all the time and only shows up at the few moments that matter most. After the second time, we start to feel it coming. Not \"A color that warns\", which signals danger.",
    [
      ["rarity", "How strictly it is kept back", [0, 5], "How rarely the color is allowed into the picture."],
      ["hue", "The saved color", ["gold", "red", "blue", "green", "white", "pink"], "Which color is kept for the big moments.", U],
      ["times", "How many moments get it", [1, 8], "How many times in the film the color appears."],
      ["moments", "What moments get it", ["a first meeting", "a choice", "a loss", "a win", "the ending"], "The kind of moment that earns the color.", U],
      ["size", "How big it is", ["a speck", "an object", "a light", "the whole frame"], "How much of the picture the color takes when it comes."],
      ["noticed", "When we notice", ["only in the gut", "on a second watch", "by the third time", "right away"], "How soon the audience catches the pattern."],
    ],
    [2, "Tells us, without words, that this moment is one of the few that change everything.", "Ties the big moments of the film together like beads on a string.", "Once we know the color, we wait for it.", "visual", "Keep gold out of the whole film, then let a gold scarf appear when they first meet, and again when she leaves."]);

  c("splitColorLight", "Two colors of light on one face", "color",
    "One side of a face is lit one color and the other side another, like red from a sign and blue from a TV. The face looks pulled two ways.",
    [
      ["split", "How strong the two colors are", [0, 5], "How bold the two colored lights are on the face."],
      ["pair", "The two colors", ["warm and cool", "red and blue", "pink and teal", "green and purple"], "Which two colors light the face.", U],
      ["from", "Where the light comes from", ["a neon sign", "a TV and a lamp", "police lights", "a window and a fire", "club lights"], "What in the place gives off the two colors.", U],
      ["edge", "Where the colors meet", ["blended", "soft line", "hard line"], "How sharply the two colors meet down the face."],
      ["moves", "Does the light move", ["still", "slow shift", "flashing"], "Whether the colors stay put or move across the face."],
      ["means", "What it says", ["just the place", "a torn mind", "two pulls on them", "danger and safety"], "What the two colors stand for here.", U],
    ],
    [2, "Shows a person caught between two choices right before they make one.", "Shows a split inside a person.", "We wonder which side will win.", "visual", "Light the cop's face red on one side and blue on the other from the car lights while he decides whether to lie."]);

  c("matchesTheRoom", "Dressed in the colors of the room", "color",
    "A person's clothes match the walls, the sofa or the curtains so closely that they almost melt into the room. They belong there, or they are hiding, or the room has swallowed them. Not \"Background against the main character\", which is clothes against other people.",
    [
      ["match", "How closely they match the room", [0, 5], "0 they stand out, 5 they almost disappear into the room."],
      ["why", "Why they match", ["they belong here", "they are hiding", "the room owns them", "a joke"], "What the match is saying.", U],
      ["color", "The shared color", ["beige", "grey", "flowers", "the room's bright color"], "The color or pattern the person and the room share.", U],
      ["others", "Anyone else", ["no one else there", "others stand out", "everyone matches too"], "Whether other people in the room match too.", U],
      ["breaks", "When the match breaks", ["never", "when they speak up", "when they leave", "at the turn"], "The moment they stop blending in.", U],
      ["shown", "How the camera shows it", ["wide, so they vanish", "medium", "close, so we see the match"], "How far the camera stands to show the match."],
    ],
    [2, "When they finally step out of the room's colors, we know they have changed.", "Shows a person swallowed by a home, a job or a life.", "We wait for them to stand out.", "visual", "Dress the quiet wife in the same beige as the living room wall, and give her a red coat the day she leaves."]);

  /* ---------- focus ---------- */

  c("stillInTheRush", "The one still thing in a busy frame", "focus",
    "Everything in the picture rushes and moves (a crowd, traffic, a party) except one person or thing that stays completely still. The eye goes straight to it.",
    [
      ["still", "How still the one thing is", [0, 5], "How completely the one thing stays still."],
      ["what", "What stays still", ["a person", "a face", "a hand", "an object", "an animal"], "The thing that does not move.", U],
      ["rush", "How busy the rest is", [0, 5], "How much everything else moves around it."],
      ["rushKind", "What rushes", ["a crowd", "traffic", "a party", "a storm", "a fight"], "What is moving around the still thing.", U],
      ["blur", "How the rush looks", ["sharp", "a little smeared", "streaked by speed"], "Whether the moving things blur into streaks, like a sped-up shot."],
      ["lasts", "How long it holds", [1, 20, "seconds"], "How long the still moment lasts."],
    ],
    [2, "Picks out the one person who matters, often right before they act.", "Shows someone outside the flow of everyone else.", "We stare at the still one and wait for them to move.", "visual", "In a busy station, let everyone blur past while she stands still, looking at the departure board."]);

  c("oneFaceInCrowd", "Finding one face in the crowd", "focus",
    "In a crowd of many people, the film picks out one face: it is the only sharp one, or the only one lit, or the only one looking back at us.",
    [
      ["pick", "How clearly it is picked out", [0, 5], "How strongly the one face stands apart from the crowd."],
      ["by", "Picked out by", ["sharp focus", "light", "color", "looking at the camera", "not moving"], "What makes that one face stand out.", U],
      ["size", "How big the crowd is", ["a few people", "a room full", "a street", "a stadium"], "How many faces there are to search."],
      ["who", "Whose face it is", ["the one they love", "the one they hunt", "a stranger", "themselves, years ago"], "Who the face belongs to.", U],
      ["found", "How it is found", ["right away", "after a search", "only by us", "lost again"], "Whether the face is found, and by whom."],
      ["look", "Where the face looks", ["not looking", "looking away", "looking back"], "Whether the face looks back at the one searching."],
    ],
    [2, "Finds the person the story needs, or loses them again in the crowd.", "Shows how one person can matter more than a thousand others.", "We search the crowd with the hero.", "visual", "At the concert, keep every face soft except one in the tenth row, looking straight back at him."]);

  c("misdirectedEye", "Looking the wrong way on purpose", "focus",
    "The shot pulls our eye to one thing (a loud sound, a bright light, a talking face) while the thing that really matters happens somewhere else in the frame, the way a magician works. Not \"Misdirection\" in comedy, which is about what we expect to happen.",
    [
      ["lure", "How hard it pulls the eye away", [0, 5], "How strongly the shot sends our eye to the wrong place."],
      ["bait", "What pulls the eye", ["a loud sound", "a bright light", "a face talking", "something moving", "a joke"], "What grabs our attention.", U],
      ["real", "Where the real thing is", ["in a corner", "behind", "in the shadow", "in plain view"], "Where the thing that matters is hiding."],
      ["payoff", "When we find out", ["never", "on a second watch", "a moment later", "right away"], "When the audience learns what they missed."],
      ["goal", "What it is for", ["a scare", "a joke", "a clue", "a twist"], "What the trick sets up.", U],
      ["fair", "Was it fair", ["unfair", "fair if you look", "fair and plain"], "Whether the real thing was there to see all along."],
    ],
    [2, "Hides a clue in plain sight that pays off later, so the twist feels earned.", "Shows how easily we see only what we are shown.", "We feel fooled, and want to watch again.", "visual", "While the host makes a loud toast in the middle of the frame, let a hand slip a pill into a glass at the edge."]);

  c("edgeOfFrame", "The thing that matters, at the edge", "focus",
    "The important person or thing is pushed to the edge of the picture, even half cut off, while the middle is empty or holds something unimportant. It makes us search and feel uneasy.",
    [
      ["edge", "How far to the edge", [0, 5], "How far from the middle the important thing sits."],
      ["what", "What is at the edge", ["a person", "a face", "a hand", "an object", "a door"], "The thing pushed to the side.", U],
      ["side", "Which edge", ["left", "right", "top", "bottom"], "Which side of the picture it sits on.", U],
      ["center", "What fills the middle", ["empty", "a wall", "the wrong person", "sky"], "What takes the middle of the frame instead.", U],
      ["cut", "How much is cut off", ["fully in", "part cut off", "half out", "just a sliver"], "How much of it the frame cuts off."],
      ["why", "Why it is there", ["to make us search", "to feel cut off", "to unsettle", "to hide it"], "What the odd placement does to us.", U],
    ],
    [2, "Makes the audience hunt for what matters, so they notice it the moment it moves.", "Shows a person pushed to the margins of their own life.", "We keep checking the edge of the screen.", "visual", "Put the therapist in the middle and the patient's face half cut off at the right edge for the whole session."]);

  /* ---------- titles ---------- */

  c("wordsInTheWorld", "Words placed into the world", "titles",
    "Titles or names that look like part of the place: painted on a wall, lying on the floor, floating in the sky, so people walk past or through them. Not \"Signs and screens behind them\", which are real signs in the set.",
    [
      ["fit", "How much they belong to the place", [0, 5], "How real the words look in the world around them."],
      ["on", "Where the words sit", ["a wall", "the floor", "the sky", "a window", "a person's body"], "The surface the words are placed on.", U],
      ["what", "What the words are", ["the title", "the names", "a place name", "a thought", "a warning"], "What the words say.", U],
      ["moves", "How they move", ["fixed in place", "move with the camera", "people walk through them", "they react to touch"], "How the words behave as the shot moves."],
      ["style", "How they look", ["clean type", "painted", "chalk", "neon", "shadow"], "The kind of lettering.", U],
      ["stays", "How long they stay", [1, 10, "seconds"], "How long the words are on screen."],
    ],
    [2, "Makes words part of the story's world, so a place name or a warning feels found, not told.", "Shows a world where words and things mix.", "We look for the next words hidden in the place.", "visual", "Paint the town's name across the road so the bus drives over it as the film starts."]);

  c("playfulSubtitles", "Subtitles that play along", "titles",
    "Subtitles that do more than translate: they sit next to the speaker, grow when someone shouts, say what the person really means, or get read by a character. Not \"Captions\", which simply show what is said.",
    [
      ["play", "How much they play", [0, 5], "How far the subtitles go beyond plain translation."],
      ["trick", "The trick", ["placed by the speaker", "they change size", "they say more than the words", "they lie", "someone reads them"], "What the subtitles do that plain ones would not.", U],
      ["language", "What is being translated", ["a made-up language", "a real one", "baby talk", "an animal"], "Whose words get the subtitles.", U],
      ["size", "Text size", ["small", "normal", "big", "huge"], "How big the subtitle text is."],
      ["color", "Text color", ["white", "the speaker's color", "a mood color"], "What color the words are.", U],
      ["count", "How many lines", [1, 10], "How many subtitle lines play this way."],
    ],
    [2, "Lets the audience know what someone really means, even when the other characters cannot.", "Shows the gap between what is said and what is meant.", "We read closely, waiting for the next joke or slip.", "visual", "Give the dog subtitles, and let them say what everyone at the table is thinking."]);

  c("openingCredits", "The opening credits", "titles",
    "The names at the start of the film and how they play: over black, over the first scene, or as their own little film of images and music that sets the mood. Not \"When the title appears\", which is only the film's name.",
    [
      ["weight", "How big a part they are", [0, 5], "How much the opening credits do for the film."],
      ["over", "What they play over", ["black", "the first scene", "their own made images", "one long shot"], "What we see behind the names.", U],
      ["length", "How long they run", [10, 240, "seconds", 10], "How long the opening credits last."],
      ["names", "How many names", ["a few", "the main ones", "everyone"], "How many people get named at the start."],
      ["hint", "What they hint at", ["nothing", "the mood", "the theme", "the ending, hidden"], "How much of the film the credits slip in."],
      ["music", "The sound under them", ["silence", "quiet", "a song", "loud"], "How loud the sound under the credits is."],
    ],
    [2, "Sets the mood and can hide a clue about the ending in plain sight.", "States the film's theme in pictures before the story starts.", "We settle in and start guessing what kind of film this is.", "visual", "Run the names over close-ups of a dollhouse being built, and end on a tiny figure placed in the attic."]);

  c("thoughtsAsText", "Their thoughts written on screen", "titles",
    "What a character is thinking shows up as words on screen: a list of choices, labels on things, a score, a word hanging in the air. Not \"Texts on screen\", which are messages they send.",
    [
      ["show", "How much of their thinking we read", [0, 5], "How much of the character's mind is written out."],
      ["form", "What form it takes", ["a list", "labels on things", "a box to tick", "numbers and scores", "a word in the air"], "The shape the thoughts take on screen.", U],
      ["near", "Where it sits", ["by their head", "on the things", "floating", "full screen"], "Where the words appear.", U],
      ["style", "How it looks", ["neat type", "handwritten", "a game screen", "a doodle"], "The look of the writing.", U],
      ["honest", "Is it true", ["it lies", "half true", "true"], "Whether the written thoughts can be trusted."],
      ["changes", "Does it change", ["stays", "changes as they think", "gets crossed out"], "Whether the words update as they think."],
    ],
    [2, "Shows a choice being made in real time, so we see the decision before the action.", "Shows how a person sizes up their world.", "We read their mind and wait to see if they follow it.", "thought", "As he walks into the party, label each guest with what he plans to say, then cross out every one when she walks in."]);

  /* ---------- canvas ---------- */

  c("splitScreen", "Splitting the screen", "canvas",
    "The screen is cut into two or more pictures at once: both sides of a phone call, two places at the same moment, the before and after. Not \"Overlay\", which is the edit tool; this is about what the split tells.",
    [
      ["split", "How much of the scene is split", [0, 5], "How much of the scene plays with the screen divided."],
      ["panes", "How many pictures", [2, 6], "How many pictures share the screen."],
      ["shows", "What the split shows", ["two places at once", "two sides of a call", "before and after", "the same moment twice", "many lives"], "What the pictures side by side are showing.", U],
      ["line", "The dividing line", ["hard line", "thin gap", "soft blend", "a moving line"], "How the pictures are separated."],
      ["layout", "How they are laid out", ["side by side", "top and bottom", "a grid", "boxes that come and go"], "How the pictures are arranged.", U],
      ["joins", "Do they come together", ["never", "they meet in one frame", "one goes black", "they merge"], "How the split ends.", U],
    ],
    [2, "Lets us watch two things race toward each other at the same time.", "Shows two lives running side by side.", "We watch both halves and wait for them to meet.", "visual", "Split the screen as two strangers get ready for the same blind date, until they meet and it becomes one picture."]);

  c("pictureSize", "The picture shrinks or grows", "canvas",
    "The picture itself gets smaller on the screen, with more and more black around it, or grows to fill the screen when a character feels free. Not \"Frame shape\", which is how wide or square the picture is.",
    [
      ["size", "How much of the screen it fills", [10, 100, "%", 5], "How big the picture is inside the screen."],
      ["way", "Which way it goes", ["shrinks", "grows", "shrinks then grows"], "Whether the picture gets smaller, bigger or both.", U],
      ["shape", "Its shape as it changes", ["keeps its shape", "gets narrow", "gets square", "gets wide"], "Whether its shape changes too."],
      ["speed", "How fast", ["over the film", "over a scene", "in seconds", "at once"], "How quickly the size changes."],
      ["around", "What fills the rest", ["black", "a blur", "a color", "a frame"], "What sits around the smaller picture.", U],
      ["follows", "What it follows", ["their world closing in", "freedom", "a memory", "going home"], "What the size change stands for.", U],
    ],
    [2, "Shows a life closing in, or opening up, at the exact moment it happens.", "Shows how big or small a person's world feels.", "We feel squeezed with them, and wait for the picture to open.", "visual", "Shrink the picture a little every time he gives up a dream, and let it fill the screen when he quits his job."]);

  c("povMask", "Seeing through a keyhole or binoculars", "canvas",
    "The picture is cut to the shape of what someone looks through: two circles for binoculars, a keyhole, a gun sight, a peephole. We see only what they see.",
    [
      ["cover", "How much the shape hides", [0, 5], "How much of the screen is blacked out around the shape."],
      ["shape", "The shape", ["binoculars", "a keyhole", "a telescope", "a gun sight", "a camera finder", "a peephole"], "What they are looking through.", U],
      ["who", "Who is looking", ["the hero", "the villain", "a spy", "a child", "nobody yet"], "Whose eye the shape belongs to.", U],
      ["edge", "The edge of the shape", ["sharp", "soft", "blurred"], "How sharp the edge of the shape is."],
      ["wobble", "How much the view shakes", [0, 5], "How much the hand holding it shakes."],
      ["caught", "Are they caught", ["never", "they sense it", "they look right back"], "Whether the person being watched notices."],
    ],
    [2, "Puts us in the watcher's place, so we feel guilty or scared with them.", "Shows watching, spying and being watched.", "We wait for the person watched to look back.", "visual", "Show the neighbor's window through a keyhole shape, and let the neighbor turn and stare straight into it."]);

  c("stillsInMotion", "A run of still photos", "canvas",
    "Instead of moving pictures, the film shows a string of still photos, one after another, while sound or a voice carries on. Time jumps between each one.",
    [
      ["count", "How many stills", [2, 40], "How many still photos come in a row."],
      ["each", "Time on each", [0.2, 4, "seconds", 0.2], "How long each photo stays on screen."],
      ["sound", "The sound over them", ["silence", "a voice over them", "music", "the sound keeps playing"], "What we hear while the stills play.", U],
      ["move", "Do the photos move", ["fixed", "slow push in", "slow drift"], "Whether the camera moves over each still."],
      ["kind", "What kind of photos", ["family photos", "news photos", "camera flashes", "a frozen story"], "What the stills look like.", U],
      ["back", "Back to moving", ["never", "at the end", "in one blink"], "Whether and how the film goes back to moving pictures."],
    ],
    [2, "Skips years or an event in seconds, landing us where the story picks up.", "Shows how memory keeps only a few frozen moments.", "We fill in the gaps between the photos ourselves.", "visual", "Tell their twenty years of marriage in twelve photos, then let the last one start to move."]);

  /* ---------- suites ---------- */

  S("neon-night-fight", "A fight under neon", "color",
    "Red and blue sign light split his face, her green jacket fights the red bar, and the clash grows with the argument.",
    [
      { curiosity: "splitColorLight", value: 4 },
      { curiosity: "splitColorLight", slider: "pair", value: "red and blue" },
      { curiosity: "splitColorLight", slider: "from", value: "a neon sign" },
      { curiosity: "splitColorLight", slider: "means", value: "two pulls on them" },
      { curiosity: "colorClash", value: 4 },
      { curiosity: "colorClash", slider: "pair", value: "red and green" },
      { curiosity: "colorClash", slider: "when", value: "as the fight grows" },
      { curiosity: "clashingPiece", value: 3, weight: 60 },
    ]);

  S("the-gold-moments", "The gold moments", "color",
    "Gold is kept out of the film until they meet, comes back when she leaves, and the rest of the picture drains slowly between.",
    [
      { curiosity: "savedColor", value: 5 },
      { curiosity: "savedColor", slider: "hue", value: "gold" },
      { curiosity: "savedColor", slider: "times", value: 3 },
      { curiosity: "savedColor", slider: "noticed", value: "by the third time" },
      { curiosity: "colorAccent", value: "one clear thing" },
      { curiosity: "colorArc", value: 3, weight: 60 },
    ]);

  S("lost-in-the-crowd", "Lost in the crowd", "focus",
    "The station rushes past in streaks, she stands still, every face is soft but one, and he searches until he finds it.",
    [
      { curiosity: "stillInTheRush", value: 5 },
      { curiosity: "stillInTheRush", slider: "rushKind", value: "a crowd" },
      { curiosity: "stillInTheRush", slider: "blur", value: "streaked by speed" },
      { curiosity: "oneFaceInCrowd", value: 4 },
      { curiosity: "oneFaceInCrowd", slider: "by", value: "sharp focus" },
      { curiosity: "oneFaceInCrowd", slider: "found", value: "after a search" },
      { curiosity: "depthOfField", value: "shallow" },
      { curiosity: "apartFromGroup", value: 3, weight: 60 },
    ]);

  S("the-magicians-shot", "The magician's shot", "focus",
    "A loud toast in the middle, a hand at the edge of the frame doing the real thing, and a shape behind them we only see on the second watch.",
    [
      { curiosity: "misdirectedEye", value: 4 },
      { curiosity: "misdirectedEye", slider: "bait", value: "a face talking" },
      { curiosity: "misdirectedEye", slider: "payoff", value: "on a second watch" },
      { curiosity: "misdirectedEye", slider: "fair", value: "fair if you look" },
      { curiosity: "edgeOfFrame", value: 4 },
      { curiosity: "edgeOfFrame", slider: "what", value: "a hand" },
      { curiosity: "behindTheirBack", value: "a shape", weight: 60 },
      { curiosity: "rewatchGag", value: 3, weight: 50 },
    ]);

  S("words-on-the-walls", "Words on the walls", "titles",
    "The names are painted on the town's walls as the bus drives past, the title arrives late, and the real signs in the street keep talking.",
    [
      { curiosity: "wordsInTheWorld", value: 4 },
      { curiosity: "wordsInTheWorld", slider: "on", value: "a wall" },
      { curiosity: "wordsInTheWorld", slider: "what", value: "the names" },
      { curiosity: "openingCredits", value: 4 },
      { curiosity: "openingCredits", slider: "over", value: "the first scene" },
      { curiosity: "titleDrop", value: 10 },
      { curiosity: "signsInBackground", value: 3, weight: 60 },
    ]);

  S("inside-her-head", "Inside her head, on screen", "titles",
    "Her plans float as a list by her head and get crossed out, her mother's voice nags, and the cat's subtitles say what nobody will.",
    [
      { curiosity: "thoughtsAsText", value: 4 },
      { curiosity: "thoughtsAsText", slider: "form", value: "a list" },
      { curiosity: "thoughtsAsText", slider: "changes", value: "gets crossed out" },
      { curiosity: "playfulSubtitles", value: 3 },
      { curiosity: "playfulSubtitles", slider: "language", value: "an animal" },
      { curiosity: "playfulSubtitles", slider: "trick", value: "they say more than the words" },
      { curiosity: "innerVoice", value: 3, weight: 60 },
      { curiosity: "screenMessages", value: "floats near the face", weight: 50 },
    ]);

  S("two-lives-one-screen", "Two lives on one screen", "canvas",
    "Two strangers get ready for the same date side by side, his half shrinks as the night goes wrong, and the two halves finally meet.",
    [
      { curiosity: "splitScreen", value: 4 },
      { curiosity: "splitScreen", slider: "shows", value: "two places at once" },
      { curiosity: "splitScreen", slider: "joins", value: "they meet in one frame" },
      { curiosity: "pictureSize", value: 70 },
      { curiosity: "pictureSize", slider: "way", value: "shrinks then grows" },
      { curiosity: "intercut", value: 4, weight: 60 },
      { curiosity: "sharedFrame", value: 4, weight: 50 },
    ]);

  S("the-watcher-next-door", "The watcher next door", "canvas",
    "A woman dressed as beige as her wall watches through binoculars, her days pass in still photos, and the neighbor finally looks back.",
    [
      { curiosity: "povMask", value: 4 },
      { curiosity: "povMask", slider: "shape", value: "binoculars" },
      { curiosity: "povMask", slider: "caught", value: "they look right back" },
      { curiosity: "stillsInMotion", value: 12 },
      { curiosity: "stillsInMotion", slider: "kind", value: "a frozen story" },
      { curiosity: "matchesTheRoom", value: 4 },
      { curiosity: "matchesTheRoom", slider: "why", value: "they are hiding" },
      { curiosity: "frameInFrame", value: "boxed in", weight: 60 },
    ], { also: ["color"] });

  /* ---------- proximities ---------- */

  P("color-clash-tension", "When the colors clash harder, the tension climbs", "color",
    "When the clashing colors fight harder, the tension of the scene rises within 2 beats.",
    { curiosity: "colorClash", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2, { also: ["structure"] });
  P("clashing-piece-color-clash", "When one piece clashes, the whole frame starts to clash", "color",
    "When one thing a person wears clashes more, the clashing colors in the whole frame rise within 2 beats.",
    { curiosity: "clashingPiece", change: "rises" }, { curiosity: "colorClash", change: "rises" }, 2, { also: ["wardrobe"] });
  P("saved-color-echo", "When the saved color comes back, the old feeling comes with it", "color",
    "When the saved color is kept back more strictly, a feeling coming back from earlier rises within 2 beats.",
    { curiosity: "savedColor", change: "rises" }, { curiosity: "feelingEcho", change: "rises" }, 2, { also: ["emo-road"] });
  P("saved-color-pops", "When a color is saved for big moments, it pops when it comes", "color",
    "When the saved color is kept back more strictly, the one color that pops stands out more within a beat.",
    { curiosity: "savedColor", change: "rises" }, { curiosity: "colorAccent", change: "rises" }, 1);
  P("split-light-wrong-colors", "When the two colors mean a torn mind, the colors start to go wrong", "color",
    "When the two colors on the face stand for a torn mind, colors going wrong rises within 2 beats.",
    { curiosity: "splitColorLight", slider: "means", is: "a torn mind" }, { curiosity: "wrongColors", change: "rises" }, 2, { also: ["grade"] });
  P("matches-room-loneliness", "When they melt into the room, loneliness grows", "color",
    "When their clothes match the room more closely, loneliness rises within 3 beats.",
    { curiosity: "matchesTheRoom", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 3, { also: ["emo-road"] });
  P("stands-apart-unmatches", "When they dress apart from the crowd, they stop melting into the room", "color",
    "When the main character's clothes stand further apart from everyone else's, matching the room drops within a beat.",
    { curiosity: "backVsMain", change: "rises" }, { curiosity: "matchesTheRoom", change: "drops" }, 1, { also: ["wardrobe"] });
  P("still-rush-eye", "When one thing stays still in the rush, the eye goes straight to it", "focus",
    "When the one thing stays more completely still, how hard it pulls the eye first rises within a beat.",
    { curiosity: "stillInTheRush", change: "rises" }, { curiosity: "eyeFirst", change: "rises" }, 1);
  P("one-face-shallow", "When one face is picked out by focus, the rest goes soft", "focus",
    "When the one face is picked out by sharp focus, the depth of field drops toward shallow within a beat.",
    { curiosity: "oneFaceInCrowd", slider: "by", is: "sharp focus" }, { curiosity: "depthOfField", change: "drops" }, 1, { also: ["camera-angle"] });
  P("one-face-tenderness", "When the face in the crowd is the one they love, tenderness grows", "focus",
    "When the face picked out of the crowd is the one they love, tenderness rises within 2 beats.",
    { curiosity: "oneFaceInCrowd", slider: "who", is: "the one they love" }, { curiosity: "tenderness", change: "rises" }, 2, { also: ["emotion"] });
  P("misdirect-behind", "When the eye is pulled away, danger slips in behind them", "focus",
    "When the shot pulls the eye away harder, danger behind their back rises within 2 beats.",
    { curiosity: "misdirectedEye", change: "rises" }, { curiosity: "behindTheirBack", change: "rises" }, 2, { also: ["background"] });
  P("misdirect-twist-herring", "When the trick sets up a twist, a clue points the wrong way", "focus",
    "When looking the wrong way is set up for a twist, the clue that points the wrong way rises within 2 beats.",
    { curiosity: "misdirectedEye", slider: "goal", is: "a twist" }, { curiosity: "redHerring", change: "rises" }, 2, { also: ["plot"] });
  P("edge-frame-apart", "When they are pushed to the edge of the frame, they stand apart", "focus",
    "When the person sits further toward the edge of the frame, standing apart from the others rises within a beat.",
    { curiosity: "edgeOfFrame", change: "rises" }, { curiosity: "apartFromGroup", change: "rises" }, 1, { also: ["placement"] });
  P("signs-words-world", "When the signs behind them can be read, the titles move into the world too", "titles",
    "When the signs and screens behind them get easier to read, words placed into the world rise within 2 beats.",
    { curiosity: "signsInBackground", change: "rises" }, { curiosity: "wordsInTheWorld", change: "rises" }, 2, { also: ["background"] });
  P("no-credits-late-title", "When the opening credits shrink, the title comes later", "titles",
    "When the opening credits do less, how late the title appears rises within 2 beats.",
    { curiosity: "openingCredits", change: "drops" }, { curiosity: "titleDrop", change: "rises" }, 2);
  P("credits-title-music", "When the opening credits grow, the title music grows with them", "titles",
    "When the opening credits do more, the weight of the title music rises within a beat.",
    { curiosity: "openingCredits", change: "rises" }, { curiosity: "titleMusic", change: "rises" }, 1, { also: ["music"] });
  P("inner-voice-thoughts-text", "When the voice in their head gets louder, their thoughts appear on screen", "titles",
    "When the parent's voice in their head gets louder, their thoughts written on screen rise within 2 beats.",
    { curiosity: "innerVoice", change: "rises" }, { curiosity: "thoughtsAsText", change: "rises" }, 2, { also: ["mindset"] });
  P("thoughts-lie-unreliable", "When the written thoughts lie, we stop trusting the view", "titles",
    "When the thoughts written on screen lie, a view we cannot trust rises within 2 beats.",
    { curiosity: "thoughtsAsText", slider: "honest", is: "it lies" }, { curiosity: "unreliableView", change: "rises" }, 2, { also: ["focus"] });
  P("subtitles-lie-misdirection", "When the subtitles lie, the joke comes from the other side", "titles",
    "When the subtitles lie about what is said, misdirection rises within a beat.",
    { curiosity: "playfulSubtitles", slider: "trick", is: "they lie" }, { curiosity: "misdirection", change: "rises" }, 1, { also: ["comedy"] });
  P("split-screen-tension", "When the screen splits, the tension climbs", "canvas",
    "When more of the scene plays with the screen split, the tension rises within 2 beats.",
    { curiosity: "splitScreen", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2, { also: ["structure"] });
  P("split-joins-shared-frame", "When the two halves meet, they share one frame", "canvas",
    "When the split ends with both meeting in one frame, being in one frame together rises within a beat.",
    { curiosity: "splitScreen", slider: "joins", is: "they meet in one frame" }, { curiosity: "sharedFrame", change: "rises" }, 1, { also: ["camera-angle"] });
  P("picture-shrinks-loneliness", "When the picture shrinks, loneliness grows", "canvas",
    "When the picture fills less of the screen, loneliness rises within 2 beats.",
    { curiosity: "pictureSize", change: "drops" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("pov-mask-dread", "When we watch through the keyhole, dread grows", "canvas",
    "When the keyhole or binocular shape hides more of the screen, dread rises within 2 beats.",
    { curiosity: "povMask", change: "rises" }, { curiosity: "dread", change: "rises" }, 2, { also: ["emo-road"] });
  P("stills-nostalgia", "When the film turns to still photos, nostalgia comes in", "canvas",
    "When more still photos come in a row, nostalgia rises within 2 beats.",
    { curiosity: "stillsInMotion", change: "rises" }, { curiosity: "nostalgia", change: "rises" }, 2, { also: ["emo-road"] });

  /* ---------- proximity suites ---------- */

  PS("colors-that-speak", "Colors that speak", "color",
    "Clashing colors raise the tension, one clashing piece spreads to the whole frame, a saved color brings back an old feeling, and two colored lights on a face turn into colors going wrong.",
    ["color-clash-tension", "clashing-piece-color-clash", "saved-color-echo", "split-light-wrong-colors"]);
  PS("where-the-eye-lands", "Where the eye lands", "focus",
    "The still one in the rush pulls the eye, a face in the crowd sharpens while the rest goes soft, a pulled-away eye lets danger in behind, and a person at the edge stands apart.",
    ["still-rush-eye", "one-face-shallow", "misdirect-behind", "edge-frame-apart"]);
  PS("words-that-live-in-the-world", "Words that live in the world", "titles",
    "Signs in the street pull the titles into the place, a short opening pushes the title later, a loud inner voice turns into words on screen, and lying words make us doubt the whole view.",
    ["signs-words-world", "no-credits-late-title", "inner-voice-thoughts-text", "thoughts-lie-unreliable"]);
  PS("the-frame-tells-it", "The frame tells it", "canvas",
    "A split screen raises the tension, a shrinking picture feels lonely, a keyhole view brings dread, and a run of still photos brings back the past.",
    ["split-screen-tension", "picture-shrinks-loneliness", "pov-mask-dread", "stills-nostalgia"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
