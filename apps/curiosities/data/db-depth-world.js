/* data/db-depth-world.js: the place and the page, deeper. 5 background curiosities (the people behind who react
   or carry on, a little story playing out behind the main one, danger behind someone's back, signs and screens in
   the background, the season), 6 set curiosities (a place that changes as the character changes, crossing a
   doorway, ways out of a room, a mirror in the room, the place the story keeps coming back to, a whole story in
   one place), 5 placement curiosities (who stands higher, who is closest to the camera, a line that splits two
   people, facing us or turned away, standing apart from the group) and 5 page curiosities (a full-page picture,
   the jump between panels, a panel with no words, the same panel again, the path the eye reads), each with its own
   graded sliders and a momentum note, tied into suites, proximities and proximity suites. Loaded after
   db-depth-sound.js. Written 2026-10-03 by the depth thread (world). */
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

  /* ---------- new background curiosities ---------- */

  c("crowdReacts", "The people behind react, or carry on", "background",
    "The people in the background (film crews call them extras) either react to what the main characters do, or carry on as if nothing happened. A fight nobody turns to look at feels lonely; a fight everyone stops to watch feels public.",
    [
      ["reaction", "How much the people behind react", ["carry on as normal", "a few glance", "some stop", "everyone stops and stares"], "From a world that does not care to a room that freezes and watches."],
      ["howMany", "People behind who could react", [0, 50, "people"], "How many people are in the background to see it."],
      ["delay", "How long before they react", [0, 5, "seconds", 0.5], "Seconds between the moment and the first head turning."],
      ["kind", "What they do", ["carry on", "glance and look away", "whisper", "film it on their phones", "cheer", "run"], "The way the people behind take it.", U],
      ["side", "Whose side they seem to take", ["the other person", "nobody", "the main character"], "Whether the looks and murmurs lean toward the main character or against them."],
      ["clash", "How much they clash with the moment", [0, 5], "From people who match the mood (0) to people dancing behind a breakup (5)."],
    ],
    [2, "When the people behind react, a private moment turns public and has to be dealt with.", "Shows whether the world cares about this person or not.", "We look past the main characters to read the room, and wait for someone to step in.", "visual", "Stage the proposal in a busy food court and let nobody look up until she says no."]);

  c("backStory", "A little story behind them", "background",
    "A small story plays out in the background while the main scene goes on: a man trying to park, a waiter falling for a customer, a child chasing a balloon. It rewards people who look closely.",
    [
      ["visible", "How easy it is to spot", [0, 5], "From hidden in a corner (0) to hard to miss (5)."],
      ["steps", "Steps it plays out over", [1, 8], "How many shots or scenes the little story takes to finish."],
      ["kind", "What kind of little story", ["a running joke", "a mirror of the main story", "a warning", "a sweet moment", "a clue"], "What the background story is there to do.", U],
      ["who", "Who it is about", ["one stranger", "a couple", "an animal", "a group"], "Who plays the little story.", U],
      ["during", "When we get to see it", ["while they talk", "in the pauses", "when the camera moves"], "Which moments of the main scene let us notice it.", U],
      ["ending", "How it ends", ["no ending", "a quiet ending", "a payoff we notice", "it crashes into the main story"], "Whether the little story finishes, and how loudly."],
    ],
    [1, "A background story can crash into the main one and change the plot.", "A small story that mirrors the big one says the same thing in a whisper.", "Once we spot it, we keep checking the background for the next step.", "visual", "Behind a tense business lunch, let a busboy try three times to carry a too-tall cake, and drop it on the worst line."]);

  c("behindTheirBack", "Danger behind their back", "background",
    "We see something in the background that the character cannot: a figure in a doorway, smoke under a door, a car slowing down. We know more than they do, so we worry for them.",
    [
      ["seen", "How clearly we see it", ["a blur", "a shape", "clear", "in sharp focus"], "How easy it is for us to make out the danger."],
      ["what", "What is behind them", ["a person watching", "a weapon", "a fire or flood", "a wild animal", "a clue they miss"], "The thing behind their back.", U],
      ["distance", "How far behind them", [1, 50, "meters"], "How far the danger is from the character."],
      ["closing", "Is it getting closer", ["moves away", "stays put", "creeps closer", "rushes in"], "Whether the danger is coming for them."],
      ["hold", "How long we watch it", [0, 30, "seconds"], "Seconds the scene lets us see the danger before anything happens."],
      ["turn", "Do they turn around", ["they knew all along", "just in time", "too late", "never"], "Whether, and when, the character finds out."],
    ],
    [3, "The danger behind them will reach them, or miss them, and the plot turns either way.", "Shows how little we see of what is coming for us.", "We want to shout at the screen; every second they do not turn pulls us tighter.", "visual", "Hold a long shot of her washing dishes while, far behind her through the window, a figure walks slowly up the garden."]);

  c("signsInBackground", "Signs and screens behind them", "background",
    "Words and pictures in the world behind the characters: a poster, a shop sign, a TV news report, graffiti, a headline. They can tell us news, set the place, or make a quiet joke about the scene.",
    [
      ["readable", "How easy to read", [0, 5], "From a blur of letters (0) to words we cannot miss (5)."],
      ["kind", "What kind of sign", ["a poster", "a shop sign", "a TV or radio report", "graffiti", "a newspaper", "a phone screen"], "Where the words or pictures are.", U],
      ["job", "What it does", ["just dresses the place", "tells us news", "jokes about the scene", "warns us", "sums up the theme"], "What the sign is there for.", U],
      ["count", "Signs in view", [0, 10], "How many signs or screens we can see at once."],
      ["readTime", "How long it stays readable", [0, 10, "seconds", 0.5], "Seconds we get to read it before the shot moves on."],
      ["noticed", "Do the characters notice it", ["no", "one glance", "they read it out", "it changes what they do"], "Whether the people in the story see it too."],
    ],
    [1, "A news report on a TV behind them can deliver a plot turn without anyone saying it.", "A sign that sums up the theme says the film's idea out loud, quietly.", "Sharp-eyed viewers read every sign for hidden jokes and clues.", "visual", "As the couple argue about money, let a shop sign behind them read EVERYTHING MUST GO."]);

  c("seasons", "The season", "background",
    "The time of year the story happens in: winter, spring, summer or autumn. Bare trees, blossom, heat or snow tell us when we are, and seasons passing tell us time is going by.",
    [
      ["shown", "How strongly the season shows", [0, 5], "From barely there (0) to the season filling every shot (5)."],
      ["season", "Which season", ["winter", "spring", "summer", "autumn"], "The time of year.", U],
      ["signs", "How we can tell", ["bare trees", "blossom", "snow", "falling leaves", "holiday lights", "heat haze"], "The main clue to the season.", U],
      ["passes", "Seasons that pass in the film", [0, 8], "How many times the season changes from start to end."],
      ["holiday", "A holiday in it", ["none", "hinted", "a holiday scene", "the holiday is the story"], "How much a holiday like a birthday, a new year or a festival is part of it."],
      ["meaning", "What the season stands for", ["nothing", "a new start", "life at its fullest", "things fading", "an ending"], "The feeling the time of year carries, from spring's new start to winter's ending."],
    ],
    [1, "Seasons passing show time moving, and a story can start in spring and end in winter.", "Seasons carry ready-made feelings: new life, full life, fading, ending.", "When the leaves start to fall, we sense the story turning toward its end.", "visual", "Open with the couple meeting in spring blossom, and let the last scene take place in the same park under snow."]);

  /* ---------- new set curiosities ---------- */

  c("roomMirrorsThem", "The place changes as they change", "set",
    "The place a character lives in changes as they do: dishes pile up as they fall apart, plants come back as they heal, the curtains open as they let people in. The room becomes a picture of their inside.",
    [
      ["follows", "How closely the place follows them", [0, 5], "From a room that never changes (0) to a room that shows every step of their journey (5)."],
      ["direction", "Which way it changes", ["falls apart with them", "stays the same", "comes back to life with them"], "Whether the place gets worse or better across the story."],
      ["shownBy", "What changes", ["mess", "light through the windows", "plants", "what is on the walls", "the furniture moved", "colors"], "The main thing in the room that shows the change.", U],
      ["visits", "Times we see the place", [2, 10], "How many times we come back to the same place."],
      ["lastLook", "The last time we see it", ["worse than ever", "as it began", "better than it began", "empty"], "How the place looks at the end.", U],
      ["seenBy", "Who notices the change", ["only us", "a visitor notices", "they notice it themselves"], "Whether anyone in the story sees what the room is saying."],
    ],
    [2, "Each return to the room shows us how far the character has come, or fallen, without a word.", "Says that who we are shows in where we live.", "We look around the room each time we come back, checking for what changed.", "visual", "Every time we visit his flat, add one more empty bottle, until the day the window is open and the bottles are gone."]);

  c("threshold", "Crossing the doorway", "set",
    "A doorway, gate or window can be a line between two worlds. Stopping at it, crossing it, or shutting it behind you becomes a choice we can see.",
    [
      ["weight", "How much the crossing matters", [0, 5], "From just walking through a door (0) to a crossing that changes everything (5)."],
      ["kind", "What they cross", ["a front door", "a bedroom door", "a gate", "a window", "a car door", "a curtain or tent flap"], "The doorway or opening.", U],
      ["pause", "How long they stop at the line", [0, 10, "seconds", 0.5], "Seconds they stand in the doorway before deciding."],
      ["way", "What they do", ["step back", "stay on the line", "step through"], "Whether they cross."],
      ["beyond", "What we see beyond", ["nothing, just dark", "a sliver", "part of it", "all of it"], "How much of the other side the doorway shows us."],
      ["behind", "The door behind them", ["left open", "swings shut", "they shut it", "it locks"], "What happens to the way back."],
    ],
    [3, "Crossing a doorway is often the moment a character commits and the story moves on.", "Shows a line between two lives: safe and unknown, inside and outside.", "A pause at the door makes us ask: will they go in?", "visual", "Let her stand at the open front door for five full seconds, the street bright behind her, before she steps out and pulls it shut."]);

  c("waysOut", "Ways out of the room", "set",
    "How easily people can leave a place: how many doors, whether they are blocked, where you could hide. A room with no way out squeezes everyone inside it.",
    [
      ["trapped", "How trapped it feels", [0, 5], "From free to come and go (0) to no way out at all (5)."],
      ["exits", "Ways out", [0, 6], "How many doors, windows or gaps someone could leave by."],
      ["blocked", "How many are blocked", ["all open", "one blocked", "most blocked", "all blocked"], "How many of the ways out cannot be used."],
      ["guard", "What stands in the way", ["nobody", "a locked door", "a person", "water or fire", "their own fear"], "What keeps them in.", U],
      ["hiding", "Places to hide", [0, 6], "How many spots someone could hide in: under a bed, behind a curtain, in a cupboard."],
      ["knows", "Do they know the way out", ["no", "they think so", "yes"], "Whether the people inside know how to leave."],
    ],
    [3, "A trapped room forces people to face each other, or the danger.", "Shows people stuck in a life, a family or a choice.", "We look for the way out with them, and every blocked door tightens the knot.", "visual", "Show all three doors early, then lock them one by one as the argument gets worse."]);

  c("mirrorInRoom", "A mirror in the room", "set",
    "A mirror, a dark window or a puddle that shows a reflection. It can show a person looking at themselves, someone behind them, or a second, different version of them.",
    [
      ["presence", "How much the mirror matters", [0, 5], "From a mirror hanging unnoticed (0) to a mirror that is the whole shot (5)."],
      ["kind", "What reflects", ["a wall mirror", "a bathroom mirror", "a shop window", "a dark screen", "a puddle", "a car mirror"], "The surface that shows the reflection.", U],
      ["shows", "What the reflection shows", ["just them", "them and someone behind", "something we could not see", "a different version of them"], "What we see in it.", U],
      ["state", "State of the mirror", ["clean", "fogged", "dirty", "cracked", "shattered"], "From a clear reflection to a broken one."],
      ["face", "Do they look at themselves", ["avoid it", "glance", "stare", "talk to it"], "How the character deals with their own reflection."],
      ["copies", "Reflections at once", [1, 12], "How many reflections we see at once, as in a hall of mirrors."],
    ],
    [2, "A reflection can reveal who is standing behind them before they turn.", "Shows a person split between who they are and who they see.", "We study the reflection for the thing the straight-on view hides.", "visual", "Let him rehearse his apology to the bathroom mirror, then wipe the fog away and stop."]);

  c("homeBase", "The place they keep coming back to", "set",
    "One place the story keeps returning to: a kitchen table, a bar, a car, a bench in the park. It becomes the story's home, and what happens to it matters.",
    [
      ["pull", "How much it is the story's home", [0, 5], "From one place among many (0) to the heart of the whole film (5)."],
      ["returns", "Times we come back", [2, 20], "How many scenes take place there."],
      ["kind", "What kind of place", ["a home", "a cafe or bar", "a workplace", "a car", "a spot outdoors", "a hideout"], "The place itself.", U],
      ["safety", "How safe it feels", ["dangerous", "uneasy", "safe", "the safest place in the world"], "Whether it is a shelter or a trap."],
      ["firstSeen", "When we first see it", ["the first scene", "early on", "halfway", "near the end"], "How soon the film shows the place."],
      ["lastVisit", "The last visit", ["it is lost", "it is left behind", "they come home", "new people arrive"], "What happens to the place at the end.", U],
    ],
    [2, "When the home place is lost or broken into, the story's safety goes with it.", "Says what home means to these people.", "We feel we know the place, so a change there hits us like a change at home.", "visual", "Put every big talk of the film at the same diner booth, then burn the diner in act three."]);

  c("oneLocation", "The whole story in one place", "set",
    "The film stays in one place from start to end: one room, one house, one train. It squeezes the characters together and makes every corner of the place count.",
    [
      ["share", "Share of the film in this place", [10, 100, "%"], "How much of the running time is spent in the one place."],
      ["size", "How big the place is", ["one small room", "a flat", "a building", "a ship or train", "a small town"], "The size of the place the story is held in."],
      ["rooms", "Rooms we see", [1, 10], "How many separate rooms or corners of the place we get to know."],
      ["leaving", "Tries to leave", [0, 10], "How many times someone tries to get out."],
      ["outside", "Do we see outside", ["never", "through windows", "in memories", "at the very end"], "Whether the film ever shows the world beyond.", U],
      ["squeeze", "How hard the place squeezes them", [0, 5], "How much being stuck together raises tempers."],
    ],
    [2, "Nobody can walk away, so every conflict has to play out right here.", "Shows people stuck with each other, and what that brings out.", "We wonder what will break first: the people or the place.", "visual", "Keep all of the film inside one lift stuck between floors, and only show the outside in the very last shot."]);

  /* ---------- new placement curiosities ---------- */

  c("heightGap", "Who stands higher", "placement",
    "Where people's heads are, higher or lower than each other: one sitting while the other stands, one on the stairs, one kneeling. Higher usually feels stronger, so moving people up and down shows who has the power.",
    [
      ["gap", "How big the height gap", [0, 5], "From eyes level (0) to one towering over the other (5)."],
      ["higher", "Who is higher", ["the one who is losing", "neither", "the one who is winning"], "Whether height goes with power, or against it for a twist."],
      ["how", "How the gap is made", ["one sits, one stands", "stairs", "a desk or stage", "one kneels", "one is much taller", "one is on a horse or car"], "What puts one higher.", U],
      ["meters", "Height difference", [0, 3, "meters", 0.1], "The gap between their eyes, in meters."],
      ["flips", "Does it flip", ["never", "once", "back and forth"], "Whether the lower one ends up higher during the scene."],
      ["camera", "Whose eye height the camera takes", ["the lower one's", "in between", "the higher one's"], "Whether we look up with the lower person or down with the higher one."],
    ],
    [2, "When the lower person stands up, the power in the scene flips, and the plot often does too.", "Shows who rules whom, and when that changes.", "We watch for the moment someone rises or falls.", "movement", "Seat the boss behind a desk, keep the worker standing, and in the last line let the worker sit down while the boss stands."]);

  c("nearestCamera", "Who is closest to the camera", "placement",
    "When people stand at different distances from the camera, the closest one looks biggest and grabs our attention. Putting the listener up front, or a stranger, changes whose scene it feels like.",
    [
      ["lead", "How much the near one fills the frame", [0, 5], "From everyone the same size (0) to one face filling half the frame (5)."],
      ["who", "Who is nearest", ["a stranger", "the one listening", "the one talking", "the main character"], "Who stands closest to us.", U],
      ["depthGap", "Distance between near and far", [0, 10, "meters"], "How far apart the nearest and the farthest person stand."],
      ["facing", "Which way the near one faces", ["away from us", "side on", "toward us"], "Whether we see the near person's face."],
      ["hides", "Does the near one hide the other", ["no", "a little", "half hidden", "almost hidden"], "How much the near person blocks our view of the far one."],
      ["swaps", "Times they swap places", [0, 4], "How many times the near and far people change places during the scene."],
    ],
    [2, "Whoever is nearest owns the moment, so swapping places can shift who the story is about.", "Shows whose view of things the film takes.", "Our eye goes to the near face first, then hunts for the far one.", "movement", "Keep the silent sister close to the camera, back to us, while the parents argue small in the background."]);

  c("dividingLine", "A line between them", "placement",
    "Something in the frame splits two people apart: a door frame, a pillar, a table edge, a shadow, a window bar. Even when they talk, the picture says they are on different sides.",
    [
      ["strength", "How strongly it splits them", [0, 5], "From a faint line (0) to a solid wall between them (5)."],
      ["what", "What splits them", ["a door frame", "a pillar or pole", "a wall edge", "a table", "a shadow", "a window frame", "a fence"], "The thing that cuts the frame in two.", U],
      ["where", "Where the line falls", ["off to one side", "near the middle", "dead center"], "Where the line sits across the frame."],
      ["crossed", "Does someone cross it", ["never", "reaches across", "steps across", "it is torn down"], "Whether the line is broken by the end."],
      ["when", "When it appears", ["the whole scene", "after a fight", "when a secret comes out"], "What brings the line into the picture.", U],
      ["sides", "Who is on each side", ["both on one side", "one alone on a side", "each alone"], "How the people sort onto the two sides."],
    ],
    [2, "A line that is finally crossed shows two people coming back together.", "Shows what divides people even when they share a room.", "We watch the line and wait for someone to cross it.", "movement", "Shoot the whole divorce talk with the kitchen door frame between them, and let one of them step through at the end."]);

  c("facingAway", "Facing us or turned away", "placement",
    "Whether a person faces the camera or turns away from it. A face hides nothing; a back hides everything. Turning away can hide tears, a lie, or shame, and turning back can be the big moment.",
    [
      ["turn", "How far turned away", ["facing us", "three-quarters", "side on", "back to us"], "From full face to the back of the head."],
      ["who", "Who turns away", ["the one speaking", "the one listening", "both", "the main character"], "Whose face we lose.", U],
      ["hold", "How long they stay turned", [0, 30, "seconds"], "Seconds we wait without seeing their face."],
      ["back", "Turning back to us", ["never turns", "turns slowly", "turns on a line", "spins round"], "Whether and how they turn to face us."],
      ["why", "Why they turn", ["hiding tears", "hiding a lie", "ignoring them", "shame", "thinking"], "What the turn is hiding.", U],
      ["others", "Who sees their face", ["no one", "the person they face", "everyone but us"], "Whether someone in the story sees what we cannot."],
    ],
    [2, "When they finally turn to face us, the truth they were hiding comes out.", "Shows what people keep from each other, and from us.", "Not seeing the face makes us lean in and guess what it shows.", "movement", "Play her whole confession with her back to the camera, and only turn her round for the last word."]);

  c("apartFromGroup", "Standing apart from the others", "placement",
    "One person stands away from a group: at the edge of the frame, behind them, across a gap. Before anyone says a word, we see who does not belong.",
    [
      ["apart", "How far apart", [0, 5], "From just at the edge (0) to far across an empty space (5)."],
      ["where", "Where they stand", ["at the edge of the frame", "behind the group", "in front, facing them", "across a gap"], "Where the lone person is placed.", U],
      ["groupSize", "People in the group", [2, 30, "people"], "How many stand together."],
      ["wants", "How they feel about it", ["wants to join", "doesn't care", "chose to leave", "was pushed out"], "Why they stand apart.", U],
      ["joins", "Do they join", ["never", "almost", "at the end", "the group comes to them"], "Whether the gap closes, and who closes it.", U],
      ["noticed", "Does the group notice", ["no", "one glances", "they all look"], "Whether the group sees the one left out."],
    ],
    [2, "Whether the lone person joins, or the group goes to them, is a turn in the story.", "Shows belonging and being left out.", "We watch the gap and hope, or fear, it will close.", "movement", "Line up the whole team for the photo and leave the new kid one step outside the frame, until the captain pulls her in."]);

  /* ---------- new page curiosities ---------- */

  c("splashPage", "A full-page picture", "page",
    "One picture that takes up a whole page, or two pages side by side (comic artists call it a splash). It stops the reader for the biggest moment: an arrival, a reveal, a huge fight.",
    [
      ["size", "How much of the page", ["half a page", "most of a page", "a full page", "two pages across"], "How big the one picture is."],
      ["when", "What it is for", ["the opening", "a reveal", "the biggest action", "the ending"], "The moment the splash shows.", U],
      ["words", "Words on it", [0, 40, "words"], "How many words sit on the big picture. Fewer lets it breathe."],
      ["leadIn", "Small panels before it", [0, 12], "How many small, quick panels lead up to it, to make it feel bigger."],
      ["detail", "How much there is to look at", [0, 5], "From one simple shape (0) to a picture packed with things to find (5)."],
      ["perBook", "Splashes in the whole book", [1, 10], "How many full-page pictures the whole book has. Fewer makes each one count."],
    ],
    [3, "A splash marks the turning point of the chapter.", "The picture the reader remembers often carries the book's idea.", "Readers stop, take it in, and are eager to see what comes after it.", "visual", "Use nine tiny panels of the hero climbing in the dark, then turn the page to a full spread of the city at dawn."]);

  c("panelJump", "The jump between panels", "page",
    "How far the story jumps from one panel to the next: a blink, the next move, a different person, a look around the place, or another place and time. The reader fills in the gap with their imagination.",
    [
      ["leap", "How big the jump", ["a blink", "the next move", "someone else", "a look around the place", "another place or time"], "From almost no change to a jump in place or time."],
      ["fillIn", "How much the reader fills in", [0, 5], "From everything shown (0) to the reader imagining most of it (5)."],
      ["angle", "Does the angle change", ["same angle", "small change", "new angle"], "Whether the next panel looks from the same place."],
      ["mix", "Mixes jump sizes", [0, 5], "From every jump the same size (0) to small and big jumps mixed together (5)."],
      ["glue", "What ties the panels together", ["nothing", "a sound across them", "a line of words", "a shape that matches"], "What carries the reader across the gap.", U],
    ],
    [2, "Big jumps race the story forward; tiny ones slow a moment down.", "What we skip says what the story thinks matters.", "Each gap is a little question the reader answers by turning to the next panel.", "visual", "Show a raised hand in one panel and only the scream in the next, and let the reader fill in the rest."]);

  c("silentPanel", "A panel with no words", "page",
    "A panel, or a row of them, with no speech at all. On a busy page, silence makes the reader slow down and feel the moment.",
    [
      ["silence", "How silent", ["a few words", "only a sound word", "no words at all", "a whole page of no words"], "From almost quiet to a whole silent page."],
      ["count", "Silent panels in a row", [1, 9], "How many wordless panels follow each other."],
      ["shows", "What it shows", ["a face", "a place", "an empty room", "a small object", "the same shot again"], "What the quiet panel looks at.", U],
      ["size", "Panel size", ["tiny", "normal", "wide", "full width"], "How big the silent panel is."],
      ["placed", "Where it falls", ["after a shout", "after a reveal", "before a big moment", "at the end"], "Where the silence sits in the page.", U],
      ["broken", "What breaks the silence", ["a line", "a loud sound word", "a page turn", "nothing"], "What comes after the quiet.", U],
    ],
    [2, "A silent beat lets a reveal sink in before the story moves on.", "Shows what words cannot say.", "The quiet makes the reader hold their breath for what comes next.", "visual", "After the big argument, give a whole row to her face, with no words, getting a little closer each time."]);

  c("repeatedPanel", "The same panel again", "page",
    "The same picture, drawn again and again in a row, with little or nothing changed. It stretches a pause for a joke, shows time dragging, or builds an awkward silence.",
    [
      ["repeats", "Times it repeats", [2, 9], "How many panels show the same picture."],
      ["changes", "How much changes each time", ["nothing", "one tiny thing", "a few things", "a lot"], "How much differs from one panel to the next."],
      ["what", "What it shows", ["a face", "a clock", "a room", "two people", "a phone"], "The picture that repeats.", U],
      ["purpose", "What it is for", ["a pause for a joke", "time passing", "awkward silence", "tension", "a mood"], "Why the picture repeats.", U],
      ["ending", "How it ends", ["just stops", "a small change lands", "a big change breaks it"], "What happens in the last panel."],
      ["shape", "Panel shape", ["shrinking", "all the same", "growing"], "Whether the panels get smaller, stay the same, or grow."],
    ],
    [1, "A big change in the last repeat lands a joke or a shock.", "Shows time dragging, or people stuck.", "We search each repeat for what changed, and wait for the break.", "visual", "Draw the two of them staring at the phone four times in a row, unchanged, and in the fifth the phone lights up."]);

  c("readingPath", "The path the eye reads", "page",
    "The order a reader's eye travels across a page: which panel, which speech balloon, which face first. Good balloon placement leads the eye so people read in the right order without thinking.",
    [
      ["clarity", "How clear the reading order", [0, 5], "From confusing (0) to the eye gliding without effort (5)."],
      ["order", "Which way it reads", ["left to right, top to bottom", "a zigzag", "a spiral", "right to left, like Japanese comics", "any order"], "The path the eye takes.", U],
      ["firstSpeaker", "First speaker's balloon placed first", ["no", "mostly", "always"], "Whether the person who speaks first is put on the left or top, so their balloon is read first."],
      ["tails", "Balloon tails", ["none", "short", "long and pointing"], "How clearly the little pointer on a balloon shows who is talking."],
      ["balloons", "Balloons on the page", [0, 12], "How many speech balloons the page has."],
      ["cover", "Balloons over the art", ["never", "a little", "a lot"], "How much the balloons cover the drawings."],
    ],
    [1, "A clear path makes sure the reader meets the clue or the punchline at the right moment.", "Where words sit tells us who leads the talk.", "A page that reads smoothly pulls the reader on to the next one.", "visual", "Put the question at the top left and the answer at the bottom right, so the reader's eye crosses the whole fight to get there."]);

  /* ---------- suites ---------- */

  S("nobody-looks-up", "Nobody looks up", "background",
    "Something huge happens to one person and the world behind them carries on as normal, while they stand apart and nobody notices.",
    [
      { curiosity: "crowdReacts", value: "carry on as normal" },
      { curiosity: "crowdReacts", slider: "howMany", value: 30, weight: 70 },
      { curiosity: "apartFromGroup", value: 3 },
      { curiosity: "apartFromGroup", slider: "noticed", value: "no" },
      { curiosity: "loneliness", slider: "among", value: "alone in a crowd", weight: 70 },
    ]);

  S("behind-you", "Behind you!", "background",
    "We see the danger creep closer in the background, in a mirror, near a hiding place, while the character keeps their back to it.",
    [
      { curiosity: "behindTheirBack", value: "clear" },
      { curiosity: "behindTheirBack", slider: "closing", value: "creeps closer" },
      { curiosity: "mirrorInRoom", slider: "shows", value: "them and someone behind", weight: 70 },
      { curiosity: "facingAway", value: "back to us", weight: 60 },
      { curiosity: "waysOut", slider: "hiding", value: 3, weight: 50 },
      { curiosity: "dread", value: 4, weight: 70 },
    ]);

  S("busy-world-behind", "A busy world behind them", "background",
    "The background is alive: a little story plays out, signs make quiet jokes, and the people behind go about their day.",
    [
      { curiosity: "backStory", value: 3 },
      { curiosity: "backStory", slider: "kind", value: "a running joke" },
      { curiosity: "signsInBackground", slider: "job", value: "jokes about the scene" },
      { curiosity: "signsInBackground", value: 3, weight: 70 },
      { curiosity: "crowdReacts", slider: "kind", value: "carry on", weight: 60 },
    ]);

  S("a-year-in-one-house", "A year in one house", "set",
    "We keep coming back to one home as the seasons change, and the place changes with the people in it.",
    [
      { curiosity: "homeBase", value: 5 },
      { curiosity: "seasons", slider: "passes", value: 4 },
      { curiosity: "seasons", value: 4, weight: 70 },
      { curiosity: "roomMirrorsThem", value: 4 },
      { curiosity: "roomMirrorsThem", slider: "visits", value: 8, weight: 60 },
    ]);

  S("locked-in", "Locked in", "set",
    "The whole story in one small place, the doors locked one by one, nowhere to go and tempers rising.",
    [
      { curiosity: "oneLocation", value: 100 },
      { curiosity: "oneLocation", slider: "size", value: "one small room" },
      { curiosity: "waysOut", value: 5 },
      { curiosity: "waysOut", slider: "blocked", value: "all blocked", weight: 80 },
      { curiosity: "threshold", slider: "behind", value: "it locks", weight: 70 },
      { curiosity: "layoutOpen", value: "cramped", weight: 60 },
    ]);

  S("leaving-home", "Leaving home", "set",
    "The home place is left behind: they pause at the door, step through, and the last look at the room shows it empty.",
    [
      { curiosity: "threshold", value: 5 },
      { curiosity: "threshold", slider: "way", value: "step through" },
      { curiosity: "threshold", slider: "pause", value: 5, weight: 70 },
      { curiosity: "homeBase", slider: "lastVisit", value: "it is left behind" },
      { curiosity: "roomMirrorsThem", slider: "lastLook", value: "empty", weight: 70 },
      { curiosity: "seasons", slider: "meaning", value: "a new start", weight: 50 },
    ]);

  S("look-in-the-mirror", "Look in the mirror", "set",
    "A character faces their own reflection in a cracked mirror, turned away from everyone else, in a room that shows how far they have fallen.",
    [
      { curiosity: "mirrorInRoom", value: 4 },
      { curiosity: "mirrorInRoom", slider: "face", value: "stare" },
      { curiosity: "mirrorInRoom", slider: "state", value: "cracked", weight: 70 },
      { curiosity: "roomMirrorsThem", slider: "direction", value: "falls apart with them", weight: 70 },
      { curiosity: "facingAway", slider: "why", value: "shame", weight: 60 },
    ]);

  S("looming-over", "Looming over them", "placement",
    "The one with power stands higher and closest to the camera, filling the frame, while the other sits small and far away.",
    [
      { curiosity: "heightGap", value: 4 },
      { curiosity: "heightGap", slider: "higher", value: "the one who is winning" },
      { curiosity: "heightGap", slider: "camera", value: "the lower one's", weight: 70 },
      { curiosity: "nearestCamera", value: 4 },
      { curiosity: "nearestCamera", slider: "facing", value: "toward us", weight: 60 },
      { curiosity: "statusGap", value: "big gap", weight: 70 },
    ]);

  S("growing-apart", "Growing apart", "placement",
    "A door frame splits the two of them, one turns away, and the space between them grows.",
    [
      { curiosity: "dividingLine", value: 4 },
      { curiosity: "dividingLine", slider: "what", value: "a door frame", weight: 70 },
      { curiosity: "dividingLine", slider: "crossed", value: "never" },
      { curiosity: "facingAway", value: "side on" },
      { curiosity: "personalSpace", value: "across the room", weight: 70 },
    ]);

  S("the-outsider", "The outsider", "placement",
    "One person at the edge of the frame, far from a big group that does not notice, until the group comes to them.",
    [
      { curiosity: "apartFromGroup", value: 4 },
      { curiosity: "apartFromGroup", slider: "where", value: "at the edge of the frame" },
      { curiosity: "apartFromGroup", slider: "joins", value: "the group comes to them", weight: 70 },
      { curiosity: "nearestCamera", slider: "who", value: "the main character", weight: 60 },
      { curiosity: "crowdReacts", value: "a few glance", weight: 50 },
    ]);

  S("big-reveal-page", "Big reveal page", "page",
    "Small quick panels, a silent beat, a page turn, and then the full-page picture.",
    [
      { curiosity: "splashPage", value: "a full page" },
      { curiosity: "splashPage", slider: "leadIn", value: 8 },
      { curiosity: "splashPage", slider: "words", value: 0, weight: 70 },
      { curiosity: "silentPanel", slider: "placed", value: "before a big moment" },
      { curiosity: "pageTurn", value: "reveal", weight: 80 },
      { curiosity: "panelJump", value: "another place or time", weight: 50 },
    ]);

  S("comic-pause-on-the-page", "The comic pause on the page", "page",
    "The same panel repeated with nothing changed, no words, tiny jumps between them, and a clear path to the last panel where the joke lands.",
    [
      { curiosity: "repeatedPanel", value: 4 },
      { curiosity: "repeatedPanel", slider: "purpose", value: "a pause for a joke" },
      { curiosity: "repeatedPanel", slider: "ending", value: "a small change lands" },
      { curiosity: "silentPanel", value: "no words at all", weight: 80 },
      { curiosity: "panelJump", value: "a blink", weight: 70 },
      { curiosity: "readingPath", value: 5, weight: 60 },
    ]);

  /* ---------- proximities ---------- */

  P("people-react-shame", "When the people behind stop and stare, shame rises", "background",
    "When the background freezes to watch, the person at the center feels more exposed within 2 beats.",
    { curiosity: "crowdReacts", change: "rises" }, { curiosity: "shame", change: "rises" }, 2, { also: ["emotion"] });
  P("people-carry-on-loneliness", "When the people behind carry on as normal, loneliness grows", "background",
    "When nobody behind notices the big moment, the character feels more alone within 2 beats.",
    { curiosity: "crowdReacts", is: "carry on as normal" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("people-cheer-pride", "When the people behind cheer, pride rises", "background",
    "When the background breaks into cheers, the character's pride rises within a beat.",
    { curiosity: "crowdReacts", slider: "kind", is: "cheer" }, { curiosity: "pride", change: "rises" }, 1, { also: ["emotion"] });
  P("back-story-crash-complication", "When the little story behind crashes into the main one, things get worse", "background",
    "When the background story bursts into the main scene, a new problem lands within 2 beats.",
    { curiosity: "backStory", slider: "ending", is: "it crashes into the main story" }, { curiosity: "complication", change: "rises" }, 2, { also: ["plot"] });
  P("back-story-laughs", "When the little story behind gets easier to spot, the laughs come more often", "background",
    "When a background story steps forward, small laughs come more often within 4 beats.",
    { curiosity: "backStory", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 4, { also: ["comedy"] });
  P("danger-behind-dread", "When the danger behind them shows more clearly, dread rises", "background",
    "When we see the danger behind their back more clearly, dread grows within 2 beats.",
    { curiosity: "behindTheirBack", change: "rises" }, { curiosity: "dread", change: "rises" }, 2, { also: ["emo-road"] });
  P("danger-behind-we-know-first", "When we see danger they cannot, we know before they do", "background",
    "When the danger is behind their back, the audience knows first within a beat.",
    { curiosity: "behindTheirBack", slider: "seen", is: "in sharp focus" }, { curiosity: "knowledgeGap", is: "audience first" }, 1, { also: ["plot"] });
  P("danger-rushes-tension", "When the danger behind them rushes in, the tension spikes", "background",
    "When the thing behind them suddenly charges, tension jumps within a beat.",
    { curiosity: "behindTheirBack", slider: "closing", is: "rushes in" }, { curiosity: "tensionCurve", change: "rises" }, 1);
  P("sign-joke-visual-gag", "When a sign behind them jokes about the scene, a visual gag lands", "background",
    "When a background sign comments on the moment, a quiet visual joke lands within a beat.",
    { curiosity: "signsInBackground", slider: "job", is: "jokes about the scene" }, { curiosity: "visualGag", change: "rises" }, 1, { also: ["comedy"] });
  P("sign-news-plants-clue", "When a screen behind them tells us news, a clue is planted", "background",
    "When a TV or headline in the background gives news, a clue is quietly planted for later within 2 beats.",
    { curiosity: "signsInBackground", slider: "job", is: "tells us news" }, { curiosity: "plantForgotten", change: "rises" }, 2, { also: ["plot"] });
  P("seasons-pass-time-skips", "When more seasons pass, the story skips further in time", "background",
    "When the seasons keep changing, the jumps in time get bigger within 4 beats.",
    { curiosity: "seasons", slider: "passes", change: "rises" }, { curiosity: "timeSkip", change: "rises" }, 4, { also: ["speed"] });
  P("autumn-nostalgia", "When the season stands for things fading, nostalgia comes", "background",
    "When the season carries a feeling of fading, a longing for the past rises within 3 beats.",
    { curiosity: "seasons", slider: "meaning", is: "things fading" }, { curiosity: "nostalgia", change: "rises" }, 3, { also: ["emo-road"] });
  P("room-follows-change-shows", "When the place follows the character closely, their change shows", "set",
    "When the room changes with the person, their inner change becomes easier to see within 3 beats.",
    { curiosity: "roomMirrorsThem", change: "rises" }, { curiosity: "changeShows", change: "rises" }, 3, { also: ["arc"] });
  P("room-comes-alive-hope", "When the place comes back to life with them, hope rises", "set",
    "When the plants return and the curtains open, hope climbs within 2 beats.",
    { curiosity: "roomMirrorsThem", slider: "direction", is: "comes back to life with them" }, { curiosity: "hope", change: "rises" }, 2, { also: ["emo-road"] });
  P("room-falls-apart-upkeep-drops", "When the place falls apart with them, it gets run down", "set",
    "When the room follows someone downhill, it gets shabbier within 3 beats.",
    { curiosity: "roomMirrorsThem", slider: "direction", is: "falls apart with them" }, { curiosity: "setUpkeep", change: "drops" }, 3);
  P("step-through-no-return", "When they step through the doorway, there is no going back", "set",
    "When the character crosses the threshold, the point of no return comes within a beat.",
    { curiosity: "threshold", slider: "way", is: "step through" }, { curiosity: "pointOfNoReturn", change: "rises" }, 1, { also: ["plot"] });
  P("door-pause-tension", "When they stop longer at the door, tension builds", "set",
    "When the pause in the doorway stretches, tension rises within 2 beats.",
    { curiosity: "threshold", slider: "pause", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2);
  P("doorway-frames-them", "When the doorway matters more, it frames them", "set",
    "When the crossing grows in weight, the door frame starts to box the person in within 2 beats.",
    { curiosity: "threshold", change: "rises" }, { curiosity: "frameInFrame", slider: "framer", is: "a doorway" }, 2, { also: ["canvas"] });
  P("trapped-dread", "When the room feels more trapped, dread rises", "set",
    "When the ways out close, dread grows within 2 beats.",
    { curiosity: "waysOut", change: "rises" }, { curiosity: "dread", change: "rises" }, 2, { also: ["emo-road"] });
  P("hiding-places-danger-behind", "When there are more places to hide, danger can wait behind them", "set",
    "When the room has more hiding spots, something can lurk behind the character within 4 beats.",
    { curiosity: "waysOut", slider: "hiding", change: "rises" }, { curiosity: "behindTheirBack", change: "rises" }, 4, { also: ["background"] });
  P("mirror-someone-behind", "When the mirror shows someone behind them, we see the danger first", "set",
    "When a reflection shows a figure behind the character, danger behind their back rises within a beat.",
    { curiosity: "mirrorInRoom", slider: "shows", is: "them and someone behind" }, { curiosity: "behindTheirBack", change: "rises" }, 1, { also: ["background"] });
  P("avoid-mirror-shame", "When they avoid their own reflection, shame shows", "set",
    "When the character will not look at themselves, their shame grows within 2 beats.",
    { curiosity: "mirrorInRoom", slider: "face", is: "avoid it" }, { curiosity: "shame", change: "rises" }, 2, { also: ["emotion"] });
  P("many-reflections-doubt", "When the reflections multiply, we start to doubt what we see", "set",
    "When the mirrors show many copies, the audience trusts the picture less within 2 beats.",
    { curiosity: "mirrorInRoom", slider: "copies", change: "rises" }, { curiosity: "unreliableView", change: "rises" }, 2, { also: ["focus"] });
  P("home-base-warmth", "When the home place matters more, warmth grows", "set",
    "When one place becomes the story's home, the warmth between the people there grows within 4 beats.",
    { curiosity: "homeBase", change: "rises" }, { curiosity: "warmth", change: "rises" }, 4, { also: ["emo-road"] });
  P("home-lost-grief", "When the home place is lost, grief follows", "set",
    "When the place they kept coming back to is gone, grief rises within 2 beats.",
    { curiosity: "homeBase", slider: "lastVisit", is: "it is lost" }, { curiosity: "grief", change: "rises" }, 2, { also: ["emo-road"] });
  P("one-place-trapped", "When more of the film stays in one place, it feels more trapped", "set",
    "When the story will not leave its one place, the room feels more like a trap within 4 beats.",
    { curiosity: "oneLocation", change: "rises" }, { curiosity: "waysOut", change: "rises" }, 4);
  P("one-place-squeeze-tension", "When the place squeezes them harder, tension rises", "set",
    "When being stuck together raises tempers, tension rises within 2 beats.",
    { curiosity: "oneLocation", slider: "squeeze", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2);
  P("height-gap-status", "When one stands higher, the gap in rank grows", "placement",
    "When the height gap grows, the difference in power between them grows within 2 beats.",
    { curiosity: "heightGap", change: "rises" }, { curiosity: "statusGap", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("height-flip-status-flip", "When the height gap flips, the power flips", "placement",
    "When the lower one ends up higher, rank turns around within a beat.",
    { curiosity: "heightGap", slider: "flips", is: "once" }, { curiosity: "statusGap", slider: "flip", is: "a full reversal" }, 1, { also: ["comedy-mix"] });
  P("nearest-pulls-eye", "When the near one fills more of the frame, the eye goes there first", "placement",
    "When the nearest person grows in the frame, our eye goes to them first within a beat.",
    { curiosity: "nearestCamera", change: "rises" }, { curiosity: "eyeFirst", change: "rises" }, 1, { also: ["focus"] });
  P("near-one-hides-other-offscreen", "When the near one hides the other, more is kept from us", "placement",
    "When the person in front almost hides the one behind, more of the scene is hidden from us within a beat.",
    { curiosity: "nearestCamera", slider: "hides", is: "almost hidden" }, { curiosity: "offscreen", change: "rises" }, 1, { also: ["focus"] });
  P("line-splits-feelings", "When the line between them grows stronger, their feelings drift apart", "placement",
    "When something in the frame splits two people harder, the gap in what they feel grows within 2 beats.",
    { curiosity: "dividingLine", change: "rises" }, { curiosity: "emotionGap", change: "rises" }, 2, { also: ["emotion"] });
  P("line-crossed-warmth", "When someone steps across the line, warmth returns", "placement",
    "When one of them crosses the dividing line, warmth between them grows within 2 beats.",
    { curiosity: "dividingLine", slider: "crossed", is: "steps across" }, { curiosity: "warmth", change: "rises" }, 2, { also: ["emo-road"] });
  P("turned-away-subtext", "When they turn further away, what they mean drifts from what they say", "placement",
    "When we lose their face, the gap between their words and their meaning grows within 2 beats.",
    { curiosity: "facingAway", change: "rises" }, { curiosity: "subtext", change: "rises" }, 2, { also: ["emotion"] });
  P("hiding-tears-empathy", "When they turn away to hide tears, we feel with them", "placement",
    "When a character turns their back to hide crying, the audience feels for them within 2 beats.",
    { curiosity: "facingAway", slider: "why", is: "hiding tears" }, { curiosity: "empathy", change: "rises" }, 2, { also: ["emotion"] });
  P("apart-loneliness", "When they stand further from the group, loneliness grows", "placement",
    "When the gap between one person and the group widens, they feel more alone within 2 beats.",
    { curiosity: "apartFromGroup", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("dissent-stands-apart", "When someone defies the group, they end up standing apart", "placement",
    "When one person speaks up against the group, they are placed apart from it within 2 beats.",
    { curiosity: "dissenter", change: "rises" }, { curiosity: "apartFromGroup", change: "rises" }, 2, { also: ["herd"] });
  P("group-comes-warmth", "When the group comes to the one apart, warmth grows", "placement",
    "When the group crosses the gap to the lone person, warmth rises within a beat.",
    { curiosity: "apartFromGroup", slider: "joins", is: "the group comes to them" }, { curiosity: "warmth", change: "rises" }, 1, { also: ["emo-road"] });
  P("reveal-turn-splash", "When the page turn is a reveal, a full-page picture follows", "page",
    "When the page turn hides a reveal, the next page opens on a big picture within a beat.",
    { curiosity: "pageTurn", is: "reveal" }, { curiosity: "splashPage", change: "rises" }, 1);
  P("splash-awe", "When the picture takes more of the page, awe rises", "page",
    "When one picture grows to fill the page, the reader feels small and amazed within a beat.",
    { curiosity: "splashPage", change: "rises" }, { curiosity: "awe", change: "rises" }, 1, { also: ["emotion"] });
  P("big-jump-scene-gutter", "When the jump is to another place or time, the gap between panels marks a new scene", "page",
    "When panels jump to another place or time, the gap between them becomes a scene change within a beat.",
    { curiosity: "panelJump", is: "another place or time" }, { curiosity: "gutter", is: "scene" }, 1);
  P("reader-fills-questions", "When the reader fills in more, the questions pile up", "page",
    "When the gaps between panels hide more, the reader holds more open questions within 2 beats.",
    { curiosity: "panelJump", slider: "fillIn", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 2, { also: ["plot"] });
  P("silence-fewer-words", "When the panels go silent, the words thin out", "page",
    "When the silence grows, the number of words per panel drops within a beat.",
    { curiosity: "silentPanel", change: "rises" }, { curiosity: "textDensity", change: "drops" }, 1);
  P("silent-empty-room-loneliness", "When a silent panel shows an empty room, loneliness grows", "page",
    "When the quiet panel looks at an empty room, the feeling of being alone grows within 2 beats.",
    { curiosity: "silentPanel", slider: "shows", is: "an empty room" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("repeat-comic-pause", "When the same panel repeats more, the comic pause gets longer", "page",
    "When the picture repeats more times, the wait before the punchline stretches within a beat.",
    { curiosity: "repeatedPanel", change: "rises" }, { curiosity: "comicTiming", change: "rises" }, 1, { also: ["comedy"] });
  P("repeat-awkward-cringe", "When the repeat is an awkward silence, the cringe grows", "page",
    "When unchanged panels hold an awkward silence, the cringe climbs within 2 beats.",
    { curiosity: "repeatedPanel", slider: "purpose", is: "awkward silence" }, { curiosity: "cringe", change: "rises" }, 2, { also: ["comedy"] });
  P("clear-path-eye-first", "When the reading path is clearer, the eye lands where it should", "page",
    "When the page leads the eye well, the reader looks at the right thing first within a beat.",
    { curiosity: "readingPath", change: "rises" }, { curiosity: "eyeFirst", change: "rises" }, 1, { also: ["focus"] });
  P("more-balloons-more-words", "When the page has more balloons, the words pile up", "page",
    "When more speech balloons crowd the page, words per panel rise within a beat.",
    { curiosity: "readingPath", slider: "balloons", change: "rises" }, { curiosity: "textDensity", change: "rises" }, 1);

  /* ---------- proximity suites ---------- */

  PS("nowhere-to-run", "Nowhere to run", "set",
    "The story stays in one place, the room feels more trapped, there are more places for danger to hide, and dread rises.",
    ["one-place-trapped", "trapped-dread", "hiding-places-danger-behind", "danger-behind-dread"], { also: ["background"] });
  PS("look-behind-you", "Look behind you", "background",
    "The mirror shows someone behind them, we know before they do, the danger rushes in and tension spikes.",
    ["mirror-someone-behind", "danger-behind-we-know-first", "danger-rushes-tension"], { also: ["set"] });
  PS("left-out-then-let-in", "Left out, then let in", "placement",
    "Someone defies the group and ends up standing apart, the people behind carry on without them, loneliness grows, and then the group comes to them.",
    ["dissent-stands-apart", "apart-loneliness", "people-carry-on-loneliness", "group-comes-warmth"], { also: ["background"] });
  PS("the-turn-of-power", "The turn of power", "placement",
    "One stands higher and the gap in rank grows, the near one fills the frame, and then the height flips and so does the power.",
    ["height-gap-status", "nearest-pulls-eye", "height-flip-status-flip"]);
  PS("turn-the-page", "Turn the page", "page",
    "The panels go silent, the reader fills in the gap, the page turn hides a reveal, and the full-page picture brings awe.",
    ["silence-fewer-words", "reader-fills-questions", "reveal-turn-splash", "splash-awe"]);
  PS("a-life-in-a-room", "A life in a room", "set",
    "The home place matters more, the room follows the character, their change shows, and in the end the place comes back to life with hope, or is lost to grief.",
    ["home-base-warmth", "room-follows-change-shows", "room-comes-alive-hope", "home-lost-grief"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
