/* data/db-depth-cut.js: transitions, speed, text, frame and color, deeper. 22 curiosities a CapCut or Final Cut
   user reaches for (holding before the cut, a line that jumps the cut, cutting away before the hit, a hidden cut,
   a sudden black screen, time-lapse, slowing down for the detail, a frozen moment the camera circles, skipping
   ahead in time, stretching a moment, words that act out their meaning, texts on screen, name cards, the title
   drop, a frame within a frame, seen through a screen, breaking out of the frame, the closing circle, a color for
   each character, color across the film, a color for each place or time, a color that warns), each with its own
   graded sliders and a momentum note, and each tied into at least one proximity and one suite. Loaded after
   db-heart.js. Written 2026-10-03 by the depth thread (cut). */
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

  /* ---------- Transitions ---------- */

  c("holdBeforeCut", "Holding before the cut", "transitions",
    "After the line or the action is over, the shot stays on a little longer before the cut, so a face or a silence can sink in.",
    [
      ["holdLength", "How long it holds", [0, 8, "seconds", 0.5], "How many seconds the shot stays after the moment is over."],
      ["onWhat", "What we hold on", ["an empty room", "a face", "an object", "a wide view"], "What the camera stays on while we wait.", { unordered: true }],
      ["stillness", "How still it is", ["something keeps moving", "a little drift", "almost still", "frozen still"], "How much moves in the shot while it holds."],
      ["sound", "Sound during the hold", ["the scene carries on", "room tone (the quiet hum of the place)", "music swells", "dead silence"], "What we hear while the picture waits.", { unordered: true }],
      ["exit", "How it finally leaves", ["hard cut", "slow fade", "the next scene's sound comes first"], "How the shot ends once the hold is over.", { unordered: true }],
    ],
    [2, "Gives the last moment time to land before the story moves on.", "Lets a feeling sit long enough to mean something.", "We wait in the quiet, wondering what the person will do now.", "visual", "After the last line, keep the camera on the listener's face for four seconds before you cut."]);

  c("bridgeLine", "A line that jumps the cut", "transitions",
    "A question or line at the end of one scene is answered by the first line of the next, often by someone else in another place.",
    [
      ["fit", "How neatly it answers", [0, 5], "How well the second line fits the first, as if one person said both."],
      ["kind", "How the two lines connect", ["answers the question", "finishes the sentence", "says the opposite", "echoes the same words"], "What the second line does with the first.", { unordered: true }],
      ["leap", "How far apart the two scenes are", ["the next room", "across town", "days later", "years later"], "How far the cut jumps in place or time."],
      ["speaker", "Who says the second half", ["the same person", "the person they mean", "a stranger", "a voice on a radio or TV"], "Who picks up the line on the other side of the cut.", { unordered: true }],
      ["sting", "How much it stings", ["a plain link", "a little wink", "a joke", "a gut punch"], "How much the second line twists or hurts the first."],
    ],
    [3, "Moves us to a new place without losing the thread.", "Shows that two places or two people are tied together.", "We want to know if the answer is true.", "audio", "End one scene on 'Where is he?' and open the next on someone else saying 'Right here.'"]);

  c("cutBeforeHit", "Cutting away before the hit", "transitions",
    "The film cuts away just before the punch, the crash or the kiss lands, and lets us hear it or imagine it.",
    [
      ["early", "How early it cuts", ["right on the hit", "a frame before", "a beat before", "long before"], "How soon before the moment lands the cut comes."],
      ["cutTo", "What we cut to", ["black", "the next scene", "a face watching", "something calm"], "What fills the screen instead of the hit.", { unordered: true }],
      ["heard", "Do we hear it", ["the full sound", "a muffled sound", "just a hint", "nothing at all"], "How much of the hit we still hear."],
      ["hurt", "How bad the thing we miss is", [0, 5], "How big or painful the moment we do not see is."],
      ["shownLater", "Do we see it later", ["never", "only what's left after", "in a flashback", "in full later"], "Whether the film ever shows us what happened."],
    ],
    [3, "Skips to the result, so the story keeps moving.", "What we don't see can feel worse, or kinder, than what we do.", "We lean in to find out what really happened.", "thought", "Cut from the raised fist straight to a cook cracking an egg in the next scene."]);

  c("hiddenCut", "Hidden cut", "transitions",
    "A cut hidden inside the picture (a dark coat passing the lens, a fast swing of the camera) so two shots look like one long unbroken shot.",
    [
      ["hidden", "How well it is hidden", [0, 5], "How hard it is to spot the join."],
      ["hiddenBy", "What hides it", ["something dark crosses the lens", "a fast swing of the camera", "a wall or a door", "a flash of light", "a body passing close"], "What covers the join for a split second.", { unordered: true }],
      ["takeLength", "Length of the 'one shot'", [10, 600, "seconds", 10], "How long the shot seems to run without a cut."],
      ["joins", "Cuts hidden inside it", [1, 20], "How many real cuts are hidden in the 'one shot'."],
      ["why", "Why hide it", ["to show off", "to keep us in real time", "to join two places", "to hide a trick"], "What hiding the cut is for.", { unordered: true }],
    ],
    [2, "Keeps the action rolling without a break, so the tension cannot leak out.", "Makes the world feel like it never lets up.", "We can't look away because nothing ever cuts.", "movement", "Follow your lead through a door; as the door fills the frame, cut to the next room."]);

  c("cutToBlack", "Sudden black screen", "transitions",
    "The picture cuts straight to black, with no fade, at a big moment. The empty screen does the talking.",
    [
      ["blackLength", "How long the black stays", [0, 10, "seconds", 0.5], "How many seconds of black before anything comes back."],
      ["when", "When it hits", ["mid-sentence", "at the shock", "right after the choice", "at the very end"], "Which moment the black cuts into.", { unordered: true }],
      ["sound", "Sound in the black", ["silence", "the scene's sound goes on", "one single noise", "music starts"], "What we hear while the screen is black.", { unordered: true }],
      ["comeBack", "What comes after", ["the same moment", "later the same day", "much later", "the credits"], "Where the film picks up after the black."],
      ["jolt", "How sudden it feels", ["expected", "a jolt", "a shock"], "How much the black catches us off guard."],
    ],
    [4, "Ends a beat so hard that the next one must answer it.", "Shows a life or a moment cut short.", "We sit in the dark, needing to know what happened.", "visual", "At the moment the door opens, cut to black and hold it two seconds before the next scene."]);

  /* ---------- Speed & timing ---------- */

  c("timeLapse", "Time-lapse", "speed",
    "Hours or days squeezed into seconds: clouds race, a city's lights blink on, a plant grows. The camera takes one picture every few seconds, then it is played fast.",
    [
      ["squeeze", "How much time is squeezed", ["minutes", "hours", "a day", "weeks", "seasons"], "How much real time passes in the time-lapse."],
      ["screenTime", "Seconds on screen", [1, 20, "seconds"], "How long the time-lapse lasts in the film."],
      ["subject", "What changes", ["sky and light", "a crowd", "a city", "a person waiting", "something growing"], "What we watch change.", { unordered: true }],
      ["camMove", "Camera during it", ["locked still", "a slow slide", "moves through the place"], "Whether the camera stays still or travels while time races."],
      ["streaks", "Light streaks and blur", [0, 5], "How much moving lights and people smear into streaks."],
    ],
    [3, "Moves the clock forward fast, so the story can jump to later.", "Shows how small one person is next to time passing.", "We feel time running and wonder what it will bring.", "visual", "Show your character on a bench as the sun sets in five seconds and the crowd blurs past."]);

  c("slowReveal", "Slowing down for the detail", "speed",
    "At the key moment the picture slows down so we can see the one detail that matters: the ring, the hand, the look.",
    [
      ["slowdown", "How slow it gets", ["a bit slow", "half speed", "very slow", "nearly frozen"], "How far the picture slows down."],
      ["detail", "What is revealed", ["an object", "a face", "a hand", "a wound", "what someone sees"], "The one thing the slow motion shows us.", { unordered: true }],
      ["rampIn", "How it slows", ["slow from the start", "eases in", "snaps slow"], "How quickly normal speed turns into slow motion."],
      ["slowLength", "How long the slow part lasts", [0.5, 8, "seconds", 0.5], "How many seconds we stay in slow motion."],
      ["soundDrops", "What the sound does", ["stays normal", "stretches low", "drops to a heartbeat", "goes silent"], "How the sound changes while the picture slows."],
    ],
    [4, "Shows the one thing that changes everything.", "Asks us to notice what the characters miss.", "We know something big has been shown and want to see what it does.", "visual", "As the bag falls, slow down and let us see the badge inside it."]);

  c("frozenOrbit", "Frozen moment, camera circles", "speed",
    "Time stops, but the camera keeps moving around the frozen moment, like the bullet scenes in The Matrix.",
    [
      ["frozen", "How frozen time is", ["slowed a lot", "nearly stopped", "fully frozen"], "How still the people and things are."],
      ["sweep", "How far the camera goes around", [30, 360, "degrees", 30], "How far around the moment the camera travels. 360 is a full circle."],
      ["orbitLength", "Length", [1, 10, "seconds"], "How long the frozen moment lasts on screen."],
      ["inAir", "Things hanging in the air", [0, 30], "How many bits (glass, water, dust) hang frozen around the moment."],
      ["restart", "How time starts again", ["snaps back", "speeds back up", "cut away"], "How the film leaves the frozen moment.", { unordered: true }],
    ],
    [2, "Stretches a turning point so we can see all of it.", "Shows a moment that will matter forever.", "We wait for time to snap back and the hit to land.", "movement", "At the jump, freeze the hero in mid-air and swing the camera halfway around."]);

  c("timeSkip", "Skipping ahead in time", "speed",
    "The film jumps past the boring or painful part (the drive, the years in prison) and lets small clues tell us how much time went by.",
    [
      ["skip", "How much time is skipped", ["minutes", "hours", "days", "years"], "How far the story jumps ahead."],
      ["clue", "How we know", ["no clue", "a clock or the light changes", "new hair or clothes", "a card on screen"], "What tells us that time has passed."],
      ["smooth", "How smooth the jump feels", ["jolting", "plain", "smooth"], "Whether the jump shakes us or slides by."],
      ["skipped", "What is skipped", ["travel", "waiting", "a fight", "healing", "growing up"], "What part of the story we never see.", { unordered: true }],
      ["catchUp", "Catching up later", ["never", "a line explains", "a flashback fills it in"], "Whether we ever learn what happened in the gap."],
    ],
    [4, "Jumps the story to where the next thing happens.", "What a film skips says what it thinks matters.", "We hunt for clues about what changed.", "plot", "Cut from your lead packing a suitcase to the same lead, sunburnt, unpacking it."]);

  c("stretchedMoment", "Stretching a moment", "speed",
    "One moment is shown for longer than it really took, by cutting between many angles or showing it more than once, so one second feels like a minute.",
    [
      ["stretch", "How much longer than real", [1, 10, "times"], "How many times longer the moment lasts on screen than in real life."],
      ["angles", "Angles cut between", [1, 12], "How many different camera views show the same moment."],
      ["repeats", "Times it is shown again", [0, 4], "How often the same bit of action is shown a second time from a new angle."],
      ["pieces", "What we cut to", ["only the action", "faces watching", "small details", "all of it"], "What the extra shots show."],
      ["weight", "Weight of the moment", ["small", "a big step", "life or death"], "How much hangs on this one moment."],
    ],
    [3, "Turns one instant into a whole scene, so the stakes swell.", "Shows how a single second can hold a life.", "We are stuck in the moment, desperate for it to finish.", "visual", "Show the door slamming three times from three angles before it finally shuts."]);

  /* ---------- Text & captions ---------- */

  c("kineticWords", "Words that act out their meaning", "titles",
    "Words on screen move the way they sound: a shout shakes and grows, a whisper shrinks, the word 'falling' drops down the screen.",
    [
      ["motion", "How much the words move", [0, 5], "How lively the words are on screen."],
      ["rule", "How they move", ["pop on the beat", "follow the voice", "act out the word", "fly around the person"], "What decides the movement of each word.", { unordered: true }],
      ["chunk", "Words at a time", ["one word", "a few words", "a whole line"], "How many words appear together."],
      ["size", "How big they get", ["small", "medium", "large", "full screen"], "How much of the screen the words take."],
      ["sync", "Timed to", ["loosely", "the voice", "each syllable"], "How tightly the words follow the sound."],
    ],
    [1, "Points us at the line that matters most.", "Makes how something is said as loud as what is said.", "We read along and feel the beat of the talk.", "audio", "When your lead shouts 'NO', make the word fill the screen and shake."]);

  c("screenMessages", "Texts on screen", "titles",
    "Phone texts, chats or searches float right in the picture next to the person reading them, so we read along with them.",
    [
      ["shown", "How the message is shown", ["we see the phone screen", "floats near the phone", "floats near the face", "fills the frame"], "Where the words sit in the picture."],
      ["typing", "Typing shown", ["only the sent text", "typing dots", "typed and deleted"], "How much of the writing we watch happen."],
      ["count", "Messages shown", [1, 12], "How many messages appear in the scene."],
      ["style", "Look", ["phone bubbles", "plain text", "handwritten", "glowing"], "How the messages look.", { unordered: true }],
      ["reply", "Waiting for the reply", [0, 10, "seconds"], "How long the screen waits before the answer comes."],
    ],
    [3, "Lets the plot move by phone without a phone call scene.", "Shows what people say when they hide behind a screen.", "We wait for the reply as much as they do.", "plot", "Show your lead typing 'I love you', deleting it, and sending 'ok'."]);

  c("nameCard", "Name card for a new face", "titles",
    "When a character first appears, the picture freezes or slows and their name pops up, often with a short, funny label.",
    [
      ["cheek", "How cheeky the label is", ["just the name", "name and job", "name and a joke", "a whole list"], "How much the card says about the person, and how funny it is."],
      ["freeze", "What the picture does", ["keeps playing", "slows", "freezes"], "Whether the picture stops while the card shows."],
      ["style", "Style", ["plain type", "bold and big", "handwritten", "like an ID card"], "How the card looks.", { unordered: true }],
      ["howMany", "Characters who get one", [1, 12], "How many people in the film get a name card."],
      ["onScreen", "How long it stays", [0.5, 5, "seconds", 0.5], "How many seconds the card stays up."],
    ],
    [2, "Tells us fast who matters, so the story can get going.", "Tells us how the film sees each person.", "We wait for the next face to get its card.", "visual", "Freeze on the getaway driver and pop up 'Dave. Has never once been on time.'"]);

  c("titleDrop", "When the title appears", "titles",
    "The moment the film's own name shows up on screen: right at the start, or after a long opening, at the perfect beat.",
    [
      ["lateness", "How late it comes", [0, 30, "minutes"], "How many minutes into the film the title appears."],
      ["landing", "What it lands on", ["a quiet image", "a shock", "a music hit", "a line of dialogue"], "Which moment the title arrives with.", { unordered: true }],
      ["size", "How big", ["small and quiet", "full screen", "huge and loud"], "How much the title fills the screen and the moment."],
      ["arrives", "How it arrives", ["just there", "fades up", "builds letter by letter", "slams in"], "How the title comes onto the screen."],
      ["spoken", "Said in the film", ["never", "hinted", "someone says it"], "Whether a character says the title out loud."],
    ],
    [3, "Marks the end of the opening and the start of the real story.", "Tells us what to call what we are watching, and what it is about.", "Once the title lands we feel the story has truly begun.", "visual", "Hold the title back until the first big shock, then slam it on screen in silence."]);

  /* ---------- Frame & canvas ---------- */

  c("frameInFrame", "Frame within a frame", "canvas",
    "A person is framed by something in the shot (a doorway, a window, a mirror, a car window), like a picture inside the picture.",
    [
      ["tightness", "How tightly framed", ["loosely", "clearly framed", "boxed in", "trapped"], "How closely the inner frame closes around the person."],
      ["framer", "What makes the frame", ["a doorway", "a window", "a mirror", "a car window", "a gap between people"], "The thing in the shot that makes the inner frame.", { unordered: true }],
      ["layers", "Frames inside frames", [1, 4], "How many frames nest inside each other."],
      ["share", "How much of the shot it takes", [10, 90, "%"], "How big the inner frame is in the whole picture."],
      ["watcher", "Who looks through it", ["nobody", "us", "someone in the story"], "Whether someone is watching through the frame.", { unordered: true }],
    ],
    [2, "Shows who is stuck, watched or shut out.", "Shows a person caught by their life or their home.", "We wonder if they will step out of the frame.", "visual", "Shoot your lead small, through the kitchen doorway, while the family talks in front."]);

  c("screenLook", "Seen through a screen", "canvas",
    "The picture looks like it comes from a screen in the story: a security camera, a phone video, a video call, the news.",
    [
      ["realness", "How real the screen looks", [0, 5], "How much it looks like real footage from that screen."],
      ["source", "Which screen", ["security camera", "phone video", "video call", "news report", "old home video"], "What kind of screen we seem to be watching.", { unordered: true }],
      ["marks", "Screen marks", ["none", "a time stamp", "a red record dot", "full buttons and labels"], "How much of the screen's own writing and buttons show."],
      ["quality", "Picture quality", ["sharp", "a bit soft", "grainy", "breaking up"], "How clean or rough the picture is."],
      ["share", "How much of the film", [0, 100, "%"], "How much of the film is seen this way."],
    ],
    [3, "Turns a scene into evidence, or proof.", "Shows how we watch each other through screens.", "We feel like we are spying and want to see more.", "visual", "Show the break-in only on the shop's security camera, with the time stamp ticking."]);

  c("frameBreak", "Breaking out of the frame", "canvas",
    "Something bursts past the edge of the picture: a hand reaches over the black bars, a ball flies out of the box, the frame itself cracks.",
    [
      ["bigness", "How far it breaks out", [0, 5], "How much of the thing gets past the edge."],
      ["what", "What breaks out", ["a hand", "an object", "a whole person", "words", "the frame cracks"], "What crosses the edge.", { unordered: true }],
      ["edge", "Which edge", ["top", "bottom", "side", "toward us"], "Where it breaks out.", { unordered: true }],
      ["howOften", "How often", ["once", "at big moments", "a running habit"], "How often the film breaks its frame."],
      ["bars", "Black bars to break", ["none", "thin bars", "thick bars"], "How thick the black bars at the top and bottom are."],
    ],
    [2, "Marks a moment too big to stay in the box.", "Shows something breaking free.", "We feel it coming at us and sit up.", "movement", "Put black bars on the scene, then let the hero's fist punch up through the top bar."]);

  c("irisShot", "The closing circle", "canvas",
    "The picture shrinks to a circle that closes on one thing, like old silent films, or opens out from it. Film people call it an iris.",
    [
      ["size", "How small the circle gets", ["nearly full", "half", "small", "a pinhole"], "How tight the circle closes."],
      ["way", "Which way", ["closes in", "opens out", "closes, then opens"], "Whether the circle closes, opens, or both.", { unordered: true }],
      ["softness", "How soft the edge is", [0, 100, "%"], "How blurry the edge of the circle is. 0 is a sharp line."],
      ["speed", "How long it takes", [0.5, 5, "seconds", 0.5], "How many seconds the circle takes to move."],
      ["target", "What it lands on", ["a face", "an object", "a small detail", "off to one side"], "What sits in the circle at the end.", { unordered: true }],
    ],
    [2, "Points us at the one thing that matters before the scene ends.", "A wink to old films and their simple endings.", "We know a chapter is closing and wonder what is next.", "visual", "Close the circle on the dog's face as it steals the sandwich, then cut."]);

  /* ---------- Color ---------- */

  c("characterColor", "A color for each character", "color",
    "Each main character has their own color (in their clothes, their room, their light) so we can follow them and see when it spreads or fades.",
    [
      ["strength", "How clear the color tie is", [0, 5], "How strongly each person is tied to their color."],
      ["reach", "Where the color shows", ["clothes", "clothes and things", "their room", "everything around them"], "How far the color goes beyond the person."],
      ["howMany", "Characters with a color", [1, 6], "How many people get their own color."],
      ["spreads", "What the color does", ["stays theirs", "rubs off on a friend", "takes over the scene", "fades away"], "How a person's color moves through the film.", { unordered: true }],
      ["meet", "How the colors meet", ["blend", "sit side by side", "fight"], "What happens when two people's colors share a shot."],
    ],
    [2, "Lets us see who is winning by whose color fills the frame.", "Shows how people mark and change each other.", "We watch for whose color shows up next.", "visual", "Give your two leads blue and orange, then slowly dress the blue one in orange by the end."]);

  c("colorArc", "Color across the whole film", "color",
    "The film's color slowly changes from start to end, like grey to bright, or warm to cold, following the story.",
    [
      ["distance", "How far the color travels", [0, 5], "How different the last scene's color is from the first."],
      ["path", "Which way", ["grey to color", "color to grey", "warm to cold", "cold to warm", "there and back"], "Where the color starts and ends.", { unordered: true }],
      ["shape", "How it moves", ["slow and even", "in steps", "all at the turning point"], "Whether the change creeps, steps or happens at once."],
      ["noticed", "Will people notice", ["only in the gut", "if they look", "clearly"], "How easy the change is to spot."],
      ["follows", "What it follows", ["the hero's mood", "the seasons", "a relationship", "the danger"], "What the color change tracks.", { unordered: true }],
    ],
    [3, "Shows at a glance how far the story has come.", "Shows change without saying a word.", "We feel the world shifting and wonder where it ends.", "visual", "Start your film washed out and grey, and let the first warm color arrive with the first kiss."]);

  c("worldColors", "A color for each place or time", "color",
    "Each place, time or storyline has its own color look (the past is golden, the city is blue), so we always know where we are.",
    [
      ["difference", "How different the looks are", [0, 5], "How far apart the color looks are."],
      ["splitBy", "What gets its own color", ["places", "times", "storylines", "dreams and real life"], "What the color tells apart.", { unordered: true }],
      ["worlds", "Number of looks", [2, 5], "How many different color looks the film uses."],
      ["crossings", "Colors that leak across", ["never", "once at the key moment", "more and more"], "Whether one world's color shows up in another."],
      ["madeBy", "How the color is made", ["light", "the set and clothes", "color fixing in the edit"], "Where the color comes from.", { unordered: true }],
    ],
    [3, "Lets us jump between places or times without getting lost.", "Shows how different two worlds are, and when they start to touch.", "We notice the moment one world's color leaks into another.", "visual", "Make the past golden and the present cold blue, then let one gold light shine in the present."]);

  c("warningColor", "A color that warns", "color",
    "One color shows up just before something bad happens, again and again, until we dread seeing it.",
    [
      ["dread", "How strong the warning is", [0, 5], "How much the color has come to mean trouble."],
      ["hue", "Which color", ["red", "green", "yellow", "blue", "purple"], "The color that warns.", { unordered: true }],
      ["times", "Times it shows up", [1, 15], "How often the color appears before trouble."],
      ["hidden", "How hidden", ["in plain view", "in a corner", "easy to miss"], "How hard the color is to spot in the frame."],
      ["warnsOf", "What it warns of", ["danger", "a death", "a lie", "a ghost or something strange"], "What usually follows the color.", { unordered: true }],
    ],
    [3, "Plants a warning, so every scene with the color feels dangerous.", "Teaches us to read the world like a detective.", "We scan every frame for the color.", "visual", "Every time the killer is near, put one red thing in the frame: a cup, a scarf, a door."]);

  /* ---------- suites ---------- */

  S("let-it-sink-in", "Let it sink in", "transitions",
    "The shot stays on a face in dead silence long after the line, then cuts hard to black or fades away.",
    [
      { curiosity: "holdBeforeCut", value: 5 },
      { curiosity: "holdBeforeCut", slider: "sound", value: "dead silence" },
      { curiosity: "cutToBlack", slider: "when", value: "right after the choice", weight: 60 },
      { curiosity: "fadeEdge", value: "fade out", weight: 60 },
    ]);

  S("thriller-cutting", "Thriller cutting", "transitions",
    "We cut away a beat before every hit, the cuts hide inside the action, two storylines race, and the screen snaps to black.",
    [
      { curiosity: "cutBeforeHit", value: "a beat before" },
      { curiosity: "hiddenCut", value: 4 },
      { curiosity: "cutToBlack", value: 2, weight: 70 },
      { curiosity: "intercut", value: 5, weight: 70 },
      { curiosity: "tensionCurve", value: 4, weight: 60 },
    ]);

  S("passing-the-line", "Passing the line", "transitions",
    "A line starts in one place and ends in another, sounds carry across the cut, and two storylines talk to each other.",
    [
      { curiosity: "bridgeLine", value: 4 },
      { curiosity: "bridgeLine", slider: "leap", value: "across town" },
      { curiosity: "matchCut", value: "sound", weight: 70 },
      { curiosity: "intercut", value: 4, weight: 60 },
    ]);

  S("one-unbroken-shot", "One unbroken shot", "transitions",
    "The whole scene seems to run in one long shot, with every cut hidden, and nothing lets us breathe.",
    [
      { curiosity: "hiddenCut", value: 5 },
      { curiosity: "hiddenCut", slider: "takeLength", value: 300 },
      { curiosity: "hiddenCut", slider: "why", value: "to keep us in real time" },
      { curiosity: "tensionCurve", value: 4, weight: 60 },
    ]);

  S("action-showcase", "Action showcase", "speed",
    "The big moment slows to show the detail, freezes while the camera circles it, is shown again from many angles, and bursts out of the frame.",
    [
      { curiosity: "slowReveal", value: "very slow" },
      { curiosity: "frozenOrbit", value: "fully frozen" },
      { curiosity: "stretchedMoment", value: 4 },
      { curiosity: "frameBreak", value: 3, weight: 60 },
      { curiosity: "clipSpeed", value: "slow", weight: 60 },
    ]);

  S("time-flies", "Time flies", "speed",
    "Clouds race by, years are skipped with a single cut, and the color of the film slowly changes as life goes on.",
    [
      { curiosity: "timeLapse", value: "a day" },
      { curiosity: "timeSkip", value: "years" },
      { curiosity: "colorArc", value: 3, weight: 60 },
      { curiosity: "comicMontage", slider: "kind", value: "time passing", weight: 50 },
    ]);

  S("life-on-screens", "Life on screens", "titles",
    "Texts float beside faces, scenes are seen through phones and security cameras, and the words dance with the voice.",
    [
      { curiosity: "screenMessages", value: "floats near the face" },
      { curiosity: "screenLook", value: 4 },
      { curiosity: "kineticWords", value: 2, weight: 60 },
      { curiosity: "captions", value: "word by word", weight: 50 },
    ]);

  S("meet-the-crew", "Meet the crew", "titles",
    "Each new face freezes with a cheeky name card, the words jump around, and the title slams in once the gang is together.",
    [
      { curiosity: "nameCard", value: "name and a joke" },
      { curiosity: "nameCard", slider: "freeze", value: "freezes" },
      { curiosity: "freezeFrame", value: "freeze with a title", weight: 70 },
      { curiosity: "titleDrop", slider: "arrives", value: "slams in", weight: 70 },
      { curiosity: "kineticWords", value: 3, weight: 50 },
    ]);

  S("boxed-in", "Boxed in", "canvas",
    "A person trapped inside doorways and windows, thick black bars squeezing the picture, and long holds on them alone.",
    [
      { curiosity: "frameInFrame", value: "trapped" },
      { curiosity: "frameInFrame", slider: "layers", value: 3 },
      { curiosity: "aspect", slider: "letterbox", value: "thick", weight: 70 },
      { curiosity: "holdBeforeCut", value: 4, weight: 50 },
    ]);

  S("silent-film-homage", "Silent film homage", "canvas",
    "Like a film from the 1920s: black and white, sped-up action, title cards, and a circle closing on the last face.",
    [
      { curiosity: "irisShot", value: "small" },
      { curiosity: "colorRange", value: "black and white" },
      { curiosity: "chapterCard", value: "title", weight: 70 },
      { curiosity: "clipSpeed", value: "fast", weight: 60 },
    ]);

  S("comic-book-frame", "Comic book frame", "canvas",
    "Fists punch out of the frame, sound words like POW act out their meaning, and the letters look drawn.",
    [
      { curiosity: "frameBreak", value: 4 },
      { curiosity: "kineticWords", slider: "rule", value: "act out the word" },
      { curiosity: "onScreenText", value: "sound word", weight: 70 },
      { curiosity: "textStyle", value: "comic", weight: 60 },
    ]);

  S("color-coded-worlds", "Color-coded worlds", "color",
    "Every place and every main person has their own color, and the colors shift across the film as the worlds meet.",
    [
      { curiosity: "worldColors", value: 4 },
      { curiosity: "characterColor", value: 3 },
      { curiosity: "colorArc", value: 2, weight: 60 },
      { curiosity: "worldColors", slider: "crossings", value: "more and more", weight: 70 },
    ]);

  S("red-means-danger", "Red means danger", "color",
    "One red thing in the frame warns us every time, the color pops against the rest, and the film cuts away before the worst.",
    [
      { curiosity: "warningColor", value: 4 },
      { curiosity: "warningColor", slider: "hue", value: "red" },
      { curiosity: "colorAccent", value: "one thing in a strong color", weight: 70 },
      { curiosity: "cutBeforeHit", value: "a beat before", weight: 50 },
    ]);

  /* ---------- proximities ---------- */

  P("long-hold-feeling-deepens", "When the hold runs long, the feeling deepens", "transitions",
    "When the shot holds longer after the moment, the feeling grows stronger within 2 beats.",
    { curiosity: "holdBeforeCut", change: "rises" }, { curiosity: "emotionIntensity", change: "rises" }, 2);
  P("hold-goes-silent", "When the hold goes dead silent, the silence stretches", "transitions",
    "When the sound drops away during the hold, the silence grows within 1 beat.",
    { curiosity: "holdBeforeCut", slider: "sound", is: "dead silence" }, { curiosity: "silence", change: "rises" }, 1);
  P("held-face-then-black", "When the hold stays on a face, a cut to black follows", "transitions",
    "When the shot holds on a face, a sudden black screen is more likely within 3 beats.",
    { curiosity: "holdBeforeCut", slider: "onWhat", is: "a face" }, { curiosity: "cutToBlack", change: "rises" }, 3);
  P("bridge-line-cross-cut", "When a line jumps the cut, the cross-cutting picks up", "transitions",
    "When lines start carrying across cuts, the film switches between storylines more within 4 beats.",
    { curiosity: "bridgeLine", change: "rises" }, { curiosity: "intercut", change: "rises" }, 4);
  P("bridge-line-irony", "When the answer across the cut is a gut punch, the irony bites", "transitions",
    "When the second half of the line hurts the first, irony rises within 1 beat.",
    { curiosity: "bridgeLine", slider: "sting", is: "a gut punch" }, { curiosity: "irony", change: "rises" }, 1);
  P("cut-before-hit-dread", "When the film cuts away before the hit, the dread grows", "transitions",
    "When the film cuts away before the blow lands, dread rises within 2 beats.",
    { curiosity: "cutBeforeHit", change: "rises" }, { curiosity: "dread", change: "rises" }, 2);
  P("missed-hit-revealed-slowly", "When the hit we missed was terrible, a slow reveal follows", "transitions",
    "When the moment we did not see was the worst, the film slows down later to show what was left within 6 beats.",
    { curiosity: "cutBeforeHit", slider: "hurt", is: 5 }, { curiosity: "slowReveal", change: "rises" }, 6);
  P("cut-away-to-black", "When the film cuts away to black, the black screen holds", "transitions",
    "When the cut before the hit goes to black, the black stays longer within 1 beat.",
    { curiosity: "cutBeforeHit", slider: "cutTo", is: "black" }, { curiosity: "cutToBlack", change: "rises" }, 1);
  P("hidden-cuts-tension", "When the cuts are hidden, the tension keeps building", "transitions",
    "When cuts hide inside one long shot, tension rises within 4 beats.",
    { curiosity: "hiddenCut", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 4);
  P("black-then-time-skip", "When the screen cuts to black, time skips ahead", "transitions",
    "When the black stays longer, the next scene jumps further in time within 1 beat.",
    { curiosity: "cutToBlack", change: "rises" }, { curiosity: "timeSkip", change: "rises" }, 1);
  P("black-at-shock-silence", "When the black hits at the shock, everything goes silent", "transitions",
    "When the screen goes black right at the shock, silence follows within 1 beat.",
    { curiosity: "cutToBlack", slider: "when", is: "at the shock" }, { curiosity: "silence", change: "rises" }, 1);

  P("time-lapse-skip", "When a time-lapse squeezes the day, the story skips ahead", "speed",
    "When more time is squeezed into the time-lapse, the story jumps further ahead within 2 beats.",
    { curiosity: "timeLapse", change: "rises" }, { curiosity: "timeSkip", change: "rises" }, 2);
  P("time-lapse-waiting-lonely", "When a person waits through a time-lapse, loneliness grows", "speed",
    "When the world races past someone who sits still, loneliness rises within 3 beats.",
    { curiosity: "timeLapse", slider: "subject", is: "a person waiting" }, { curiosity: "loneliness", change: "rises" }, 3);
  P("slow-reveal-heartbeat", "When the picture slows for the detail, the sound drops to a heartbeat", "speed",
    "When the picture slows down further, the sound falls away to a heartbeat within 1 beat.",
    { curiosity: "slowReveal", change: "rises" }, { curiosity: "slowReveal", slider: "soundDrops", is: "drops to a heartbeat" }, 1);
  P("slow-detail-turns-story", "When the slow detail is shown, the story turns", "speed",
    "When the slow motion shows the key detail, a reveal lands within 2 beats.",
    { curiosity: "slowReveal", change: "rises" }, { curiosity: "reveal", change: "rises" }, 2);
  P("frozen-orbit-impact", "When time freezes and the camera circles, the hit lands harder", "speed",
    "When the frozen moment lasts, the impact that ends it hits harder within 2 beats.",
    { curiosity: "frozenOrbit", change: "rises" }, { curiosity: "impacts", change: "rises" }, 2);
  P("years-skipped-card", "When years are skipped, a card says so", "speed",
    "When the story jumps years, a date and place card appears within 1 beat.",
    { curiosity: "timeSkip", is: "years" }, { curiosity: "chapterCard", is: "date and place" }, 1);
  P("stretched-moment-tension", "When a moment is stretched, the tension rises", "speed",
    "When one moment is stretched across more shots, tension rises within 2 beats.",
    { curiosity: "stretchedMoment", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2);
  P("life-or-death-faces", "When the moment is life or death, we cut to the faces watching", "speed",
    "When everything hangs on the moment, the stretched shots turn to the faces watching within 1 beat.",
    { curiosity: "stretchedMoment", slider: "weight", is: "life or death" }, { curiosity: "stretchedMoment", slider: "pieces", is: "faces watching" }, 1);

  P("shout-words-shake", "When someone shouts, the words act it out", "titles",
    "When a voice gets louder, the words on screen move more within 1 beat.",
    { curiosity: "volume", change: "rises" }, { curiosity: "kineticWords", change: "rises" }, 1);
  P("typed-and-deleted-wait", "When a text is typed and deleted, the wait for a reply grows", "titles",
    "When we watch someone type and delete, the wait for the answer stretches within 2 beats.",
    { curiosity: "screenMessages", slider: "typing", is: "typed and deleted" }, { curiosity: "screenMessages", slider: "reply", change: "rises" }, 2);
  P("messages-spill-secret", "When the messages pile up, a secret slips out", "titles",
    "When more messages fill the screen, a secret starts slipping within 4 beats.",
    { curiosity: "screenMessages", slider: "count", change: "rises" }, { curiosity: "plotSecret", change: "rises" }, 4);
  P("cheeky-cards-laughs", "When the name cards get cheeky, the laughs come faster", "titles",
    "When the name cards add jokes, the laughs per minute rise within 2 beats.",
    { curiosity: "nameCard", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 2);
  P("late-title-on-shock", "When the title comes late, it lands on a shock", "titles",
    "When the title is held back longer, it arrives with a shock within 1 beat.",
    { curiosity: "titleDrop", change: "rises" }, { curiosity: "titleDrop", slider: "landing", is: "a shock" }, 1);
  P("grab-then-title-slams", "When the opening grabs hard, the title slams in", "titles",
    "When the opening starts with a shock, the title slams onto the screen within 3 beats.",
    { curiosity: "openingGrab", is: "a shock" }, { curiosity: "titleDrop", slider: "arrives", is: "slams in" }, 3);

  P("framed-alone", "When someone is boxed in by a frame, loneliness grows", "canvas",
    "When the inner frame closes around a person, loneliness rises within 3 beats.",
    { curiosity: "frameInFrame", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 3);
  P("security-camera-dread", "When we watch through a security camera, dread rises", "canvas",
    "When the scene is seen through a security camera, dread rises within 2 beats.",
    { curiosity: "screenLook", slider: "source", is: "security camera" }, { curiosity: "dread", change: "rises" }, 2);
  P("thick-bars-break", "When the black bars are thick, something breaks out of them", "canvas",
    "When the bars squeeze the picture, a moment bursts past them within 4 beats.",
    { curiosity: "aspect", slider: "letterbox", is: "thick" }, { curiosity: "frameBreak", change: "rises" }, 4);
  P("circle-closes-scene", "When the circle closes in, the scene ends", "canvas",
    "When the iris closes on a face, the scene's ending changes within 1 beat.",
    { curiosity: "irisShot", slider: "way", is: "closes in" }, { curiosity: "sceneEnding", change: "changes" }, 1);

  P("color-rubs-off-warmth", "When one person's color rubs off on a friend, the warmth grows", "color",
    "When a character's color starts showing up on someone else, warmth between them rises within 4 beats.",
    { curiosity: "characterColor", slider: "spreads", is: "rubs off on a friend" }, { curiosity: "warmth", change: "rises" }, 4);
  P("colors-fight-egos-clash", "When two people's colors fight, their egos clash", "color",
    "When character colors fight in the frame, the clash of egos grows within 3 beats.",
    { curiosity: "characterColor", slider: "meet", is: "fight" }, { curiosity: "egoClash", change: "rises" }, 3);
  P("color-arc-shows-change", "When the color travels far, the hero's change shows", "color",
    "When the film's color moves further from where it began, the character's change becomes easier to see within 6 beats.",
    { curiosity: "colorArc", change: "rises" }, { curiosity: "changeShows", change: "rises" }, 6);
  P("world-colors-leak", "When colors leak between worlds, the storylines cross", "color",
    "When one world's color shows up in another, the film switches between storylines more within 4 beats.",
    { curiosity: "worldColors", slider: "crossings", is: "more and more" }, { curiosity: "intercut", change: "rises" }, 4);
  P("warning-color-dread", "When the warning color shows up, dread rises", "color",
    "When the color that means trouble appears, dread rises within 1 beat.",
    { curiosity: "warningColor", change: "rises" }, { curiosity: "dread", change: "rises" }, 1);
  P("pop-color-becomes-warning", "When one color keeps popping, it becomes a warning", "color",
    "When one bright color keeps standing out, it starts to mean trouble within 6 beats.",
    { curiosity: "colorAccent", change: "rises" }, { curiosity: "warningColor", change: "rises" }, 6);

  /* ---------- proximity suites ---------- */

  PS("the-hit-we-never-see", "The hit we never see", "transitions",
    "The film cuts away before the blow, the screen goes black and silent, time jumps ahead, and later a slow reveal shows what was left.",
    ["cut-away-to-black", "black-at-shock-silence", "black-then-time-skip", "missed-hit-revealed-slowly"]);
  PS("time-gets-away", "Time gets away", "speed",
    "The world races past someone sitting still, the story skips ahead, and a card tells us how many years went by.",
    ["time-lapse-waiting-lonely", "time-lapse-skip", "years-skipped-card"]);
  PS("one-second-forever", "One second, forever", "speed",
    "A life or death moment is stretched across the faces watching, the tension climbs, time freezes, and the hit lands hard.",
    ["life-or-death-faces", "stretched-moment-tension", "frozen-orbit-impact"]);
  PS("red-means-run", "Red means run", "color",
    "A bright color keeps popping until it means trouble, every time it shows up dread rises, and the film cuts away before the worst.",
    ["pop-color-becomes-warning", "warning-color-dread", "cut-before-hit-dread"]);
  PS("worlds-collide", "Worlds collide", "color",
    "Colors leak from one world to another, the storylines cross, and lines start jumping the cuts between them.",
    ["world-colors-leak", "bridge-line-cross-cut", "color-rubs-off-warmth"]);
  PS("unsent-message", "The unsent message", "titles",
    "A text is typed and deleted, the wait for a reply stretches, and the messages pile up until a secret slips out.",
    ["typed-and-deleted-wait", "messages-spill-secret"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
