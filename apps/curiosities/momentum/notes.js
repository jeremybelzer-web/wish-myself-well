/* momentum/notes.js: the heart of the app (Jeremy, 2026-10-02): the feeling that a film is going somewhere
   important. Every curiosity, even the clothes or the landscape, gets a momentum note saying how it moves the
   plot and the themes forward and how it pulls the audience's attention on into what comes next.

   Part of the momentum core (no page): works in a browser and in Node.

   window.CurioMomentum
   - FAMILIES     the attention families the pie chart and timeline use (Camera, Movement, Lines & voice ...).
                  Each family groups some workspaces and has a usual cue.
   - CUES         the five kinds of cue that move attention from one thing to the next: visual, audio,
                  thought, movement, plot (Jeremy's list).
   - FIELD        the shape of a momentum note (below), for the curiosity database.
   - note(id)     the momentum note for any curiosity id ("mainEra", or "music.source" for a slider of one).
                  Every curiosity has one: a note written for that curiosity when there is one, otherwise its
                  workspace's note with the curiosity's own name in it. note.source says which.
   - familyOf(id) the family id a curiosity's attention belongs to.
   - all()        every curiosity the app knows, each with its note (for the Momentum window and checks).
   - mark(family) the one look of a family on every tab: { family, letter, color, ink, label } (COLORS, LETTERS, OTHER).
   - status(seconds, limit)  { key: "fresh", "long" or "over" ("none" for no hold), cls, icon, words }: ● Fresh,
                  ▲ Getting long, ■ Too long against the limit. Every momentum tab uses these two; none keeps a copy.

   A momentum note:
     {
       push:   0 to 5   how much this curiosity usually moves the story forward on its own
                        (5: the plot cannot go on without it; 0: it only colors the moment)
       plot:   text     how it moves the plot forward
       theme:  text     how it builds the film's themes
       pull:   text     how it pulls the audience's attention on, into what comes next
       cue:    one of CUES, the kind of cue it usually gives when it takes attention
       tryThis text     one concrete way to use it for momentum
       source: "written" (for this curiosity) or "workspace" (its workspace's note, with its name)
     }
   The pushes and texts are Claude's own film knowledge, not measured; the attention model
   (momentum/attention.js) can measure how often each curiosity takes attention in traced films. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;

  const CUES = [
    { id: "visual", label: "Visual cue", plain: "Something new to look at: a cut, a color, a face, a thing in the frame." },
    { id: "audio", label: "Audio cue", plain: "Something new to hear: a line, a sound, music starting or stopping, a silence." },
    { id: "thought", label: "Thought cue", plain: "Something new to think about: a joke landing, a question, an idea you work out." },
    { id: "movement", label: "Movement cue", plain: "Something moves: a person, a hand, an object, the camera following them." },
    { id: "plot", label: "Plot cue", plain: "The story turns: a goal, a secret, a choice, a stake raised or lost." },
  ];

  /* Attention families: few enough to read on a pie chart, each a group of workspaces. */
  const FAMILIES = [
    { id: "camera", label: "Camera", cue: "visual", workspaces: ["camera-angle", "camera-motion"] },
    { id: "movement", label: "Movement", cue: "movement", workspaces: ["character-motion", "movement-lines", "placement"] },
    { id: "voice", label: "Lines & voice", cue: "audio", workspaces: ["lines"] },
    { id: "feeling", label: "Feeling", cue: "visual", workspaces: ["emotion", "emo-road"] },
    { id: "comedy", label: "Comedy", cue: "thought", workspaces: ["comedy", "comedy-mix"] },
    { id: "wardrobe", label: "Wardrobe", cue: "visual", workspaces: ["wardrobe"] },
    { id: "place", label: "Set & landscape", cue: "visual", workspaces: ["set", "background"] },
    { id: "light", label: "Light & color", cue: "visual", workspaces: ["light", "color"] },
    { id: "music", label: "Music & sound", cue: "audio", workspaces: ["music"] },
    { id: "plot", label: "Plot & character", cue: "plot", workspaces: ["arc", "plot", "archetype", "herd"] },
    { id: "mind", label: "Thought & focus", cue: "thought", workspaces: ["mindset", "focus"] },
    { id: "effects", label: "Effects", cue: "visual", workspaces: ["effects"] },
    { id: "cut", label: "Cut & structure", cue: "visual", workspaces: ["structure", "page"] },
  ];
  const FAMILY_OF_WS = {};
  FAMILIES.forEach((f) => f.workspaces.forEach((w) => (FAMILY_OF_WS[w] = f.id)));
  /* Catalog groups, for curiosities the database does not know (the app without data/ loaded). */
  const FAMILY_OF_GROUP = {
    Camera: "camera", "Camera move": "camera", Motion: "movement", Light: "light", Place: "place", People: "movement", Sound: "music",
    Body: "movement", Comic: "comedy", Story: "plot", Animation: "movement", "Shading and color": "light", "Dynamics, fur and Bifrost": "effects",
    "Edit and structure": "cut", "Scene memory": "place", "Lens: Color": "light", "Lens: Main character's clothes": "wardrobe",
    "Lens: Background clothes": "wardrobe", "Lens: Set design": "place", "Lens: Emotion": "feeling", "Lens: Emotional road": "feeling",
    "Lens: Comedy": "comedy", "Lens: Comedy from the mix": "comedy",
  };

  /* One note per workspace. {name} becomes the curiosity's own name. */
  const W = {
    "camera-angle": [2, "Where the lens sits tells the audience whose scene it is right now. Moving closer or lower on someone hands them the plot.", "Who the camera stays close to and who it keeps far away says who matters, which is a theme in itself.", "A change of {name} is a visual promise: something here is worth a closer look, so look.", "Save your closest shot for the moment the story turns, so the change itself says 'this matters'."],
    "camera-motion": [2, "A camera that starts moving tells us the scene has started going somewhere; one that stops tells us to wait for what comes.", "Steady or shaky, slow or rushing, {name} says whether this world is under control.", "Motion leads the eye: the audience follows where the camera is going before they know why.", "Begin a move just before the reveal so the reveal arrives at the end of the move."],
    "character-motion": [3, "People moving toward something is the plot made visible: walking in, walking out, chasing, fleeing.", "How a character moves (rushing, dragging, hiding) shows who they are becoming.", "A body crossing the frame pulls every eye; where it goes, attention goes next.", "Let a character's path end on the thing the next scene is about."],
    placement: [2, "Who stands where, and what object sits in the frame, sets up what can happen next (Chekhov's gun).", "Distance between people on screen is the distance between them in the story.", "An object or empty space placed with care makes the audience wait for it to matter.", "Plant an object early in plain sight; pay it off later."],
    lines: [4, "Lines carry most of the plot: what people want, what they refuse, what they reveal.", "How a line is said (soft, loud, broken off) is where theme hides under the words.", "A question, an unfinished sentence or a sudden silence makes the audience lean in for the answer.", "End a scene on a line that asks a question the next scene answers."],
    "movement-lines": [2, "What the body does while talking shows whether the words are true, which tells us where the plot is really going.", "A gesture repeated across the film can carry a theme without a word.", "A hand reaching, a look away, a prop picked up: the eye goes there before the line lands.", "Give the listener one movement that contradicts what is being said."],
    background: [2, "The world behind the people (weather, crowds, the place itself) can block them, chase them, or open a way forward.", "The landscape is a picture of the inner state: storms, deserts, crowds, empty streets all say something about the theme.", "Something changing in the background quietly tells the audience the world is moving, even when the people are still.", "Let the weather or the place get worse as the stakes rise."],
    light: [2, "Light moving from day to night, or one lamp going out, marks time passing and the plot advancing.", "Light and dark are the oldest way to show hope and threat, truth and secrets.", "Whatever is brightest is where the eye goes first; changing the light moves attention.", "Light the thing that matters next a little brighter than everything else."],
    effects: [1, "Wind, fire, water and breaking things raise the stakes physically: something can now be lost.", "Forces of nature can stand for forces in the story (rage as fire, grief as rain).", "Movement of hair, cloth or particles keeps the frame alive and the eye busy between story beats.", "Let an effect grow in step with the tension, then stop dead at the turn."],
    arc: [5, "Where a character is on their arc is the engine of the film: every scene should move them a step toward or away from change.", "The arc is the theme acted out: what the character believes at the start and what they learn.", "The audience keeps watching to find out whether this person will change.", "Show the old belief failing once in every act."],
    plot: [5, "A character's own plot gives every scene a want, an obstacle and a step closer or further.", "What someone wants against what they need is often the theme of the whole film.", "Wanting something keeps the audience asking 'will they get it?'", "Give every character in the scene something they want from it."],
    mindset: [3, "A mind opening or closing decides the choices a character will make, and so the plot.", "Whose good a character can see is a theme about selfishness and care.", "Watching someone think pulls the audience into their head; they start guessing what happens next.", "Let the audience see a mind change one scene before the character admits it."],
    focus: [3, "What a character pays attention to, and what they miss, decides what they will run into.", "What we choose to look at is a theme (obsession, distraction, love).", "The character's focus becomes the audience's focus: we look where they look.", "Let a character be distracted at the exact moment something important happens."],
    archetype: [3, "A person's type predicts how they will act under pressure, which sets up the plot's collisions.", "Healthy and unhealthy versions of a type show the theme of growth and decay.", "Seeing a character act in or out of type makes the audience wonder what comes next.", "Push a character into their unhealthy side just before their biggest choice."],
    herd: [3, "A group moving as one, or one person breaking from it, turns the plot.", "Fitting in against standing out is a theme of most stories.", "A dissenter in a crowd pulls every eye.", "Let one person stop moving when the crowd moves."],
    wardrobe: [1, "Clothes change when people change: a new outfit marks a step in the story (a promotion, a disguise, a fall).", "What a character wears shows class, era, hopes and lies, so clothes carry the theme without a word.", "A costume change is a visual question: what happened to them? The audience wants to know.", "Change the main character's clothes at each turn of their arc, a little at a time."],
    color: [1, "Color shifting across the film marks where we are in the story (warm before the fall, cold after).", "A color tied to an idea (red for danger, green for hope) carries a theme through the whole film.", "One color that pops draws the eye straight to what matters next.", "Give one color to one idea and bring it back only when that idea returns."],
    set: [2, "The place decides what can happen: a cramped room forces a fight, an open field lets someone run.", "A room is a portrait of who lives in it, and the theme of the film often lives in the room.", "A detail in the set (a photo, a locked door) makes the audience curious about what it means.", "Put one thing in the room that the plot will need later."],
    emotion: [4, "Feelings drive choices, and choices drive the plot: a scene's feeling should push someone to act.", "The feelings a film keeps returning to are its themes felt rather than said.", "A face changing is the strongest pull in film: the audience needs to know why.", "Turn the feeling inside the scene, so it ends somewhere other than where it began."],
    "emo-road": [4, "The film's emotional road is its plot as felt: rising hope, false highs, the low point, the release.", "Where the road goes (from fear to courage, from pride to humility) is the theme.", "A rising or falling feeling builds pressure that the audience wants released.", "After every high, plant the next worry."],
    comedy: [2, "A good joke can move the plot: a misunderstanding grows, a lie gets bigger, a setup pays off later.", "What a film laughs at tells you what it believes.", "A setup leaves a promise in the air; the audience waits for the payoff and leans forward.", "Plant a setup in this scene whose payoff lands two scenes later."],
    "comedy-mix": [3, "Putting the wrong people in a room together creates the conflict that moves the plot.", "Who clashes with whom shows the film's ideas fighting each other.", "Clashing people make the audience wonder who will win, which keeps them watching.", "Add one person who wants the opposite of everyone else in the room."],
    music: [2, "Music starting, stopping or changing marks the turn of a scene and tells the audience the story has moved.", "A tune that returns brings back the theme it first played under.", "Sound leads the eye: a sound off screen makes the audience look for its source; silence makes them hold their breath.", "Cut the music out right before the most important line."],
    structure: [4, "How scenes are cut and ordered is the pace of the plot: when we learn things, and how fast.", "Repetitions and contrasts in the structure carry the theme from scene to scene.", "A cut at the right moment leaves a question open, so the audience follows into the next scene for the answer.", "Cut out of each scene a moment early, before it resolves."],
    page: [2, "On a page, panel size and order set the pace: a big panel stops time, a row of small ones rushes it.", "Repeating a layout for a moment that returns ties the two together.", "The page turn is a built-in reveal: the reader has to turn to find out.", "Put the question on the right-hand page and the answer after the turn."],
  };

  /* Workspaces whose usual cue differs from their family's. */
  const WS_CUE = { "emo-road": "thought", "movement-lines": "movement", placement: "visual", herd: "movement", archetype: "thought" };

  /* Notes written for one curiosity. [push, plot, theme, pull, cue, tryThis]; cue may be null (use the family's). */
  const C = {
    /* Wardrobe (Jeremy's example: how clothes lead to the themes and the forward momentum) */
    mainEra: [1, "Clothes from another time say the character belongs somewhere else, which sets up a fish-out-of-water plot or a return home.", "The era of the clothes can carry the film's argument about past and present.", "An out-of-time outfit makes the audience ask why they dress that way.", null, "Let the era of their clothes move toward today as they let go of the past."],
    mainCost: [2, "Money on someone's back says what they can do and what they stand to lose; a drop in cost marks a fall.", "Cheap against expensive is how a film shows class, greed or humility.", "A sudden change in what someone can afford is a plot question the audience wants answered.", null, "Dress them one step richer or poorer after each turn of fortune."],
    mainCoverage: [1, "Covering up or showing more marks someone opening up or closing off, which predicts what they will risk next.", "How much a character hides of themselves is a theme of trust and shame.", "A change in how much is shown draws the eye and makes the audience wonder what changed inside.", null, "Uncover a little each time the character lets someone in."],
    mainUtility: [2, "Clothes made for a job say what that person is about to do: armor before a fight, boots before a journey.", "Looks against function is a theme of appearance against substance.", "Seeing someone dress for a task tells the audience the task is coming, and they wait for it.", null, "Show the character putting on the clothes for the coming scene."],
    mainFunction: [2, "Clothes doing a job (disguise, uniform, armor) open doors in the plot that would otherwise be shut.", "A uniform or disguise asks who the person really is.", "A disguise makes the audience wait for it to be found out.", "plot", "Put a character in a disguise one scene before someone who could see through it arrives."],
    mainWear: [1, "Wear and tear on clothes keeps score of what the character has been through, so the audience feels the journey.", "Damage that builds up is the theme of cost and endurance.", "A new tear or stain makes the audience ask what just happened.", null, "Let the same outfit get a little more worn each act."],
    mainSetMatch: [1, "A character who clashes with the room is about to be thrown out of it or change it.", "Belonging against standing out is a theme in the frame.", "The one person who does not match the room pulls every eye.", null, "Dress the main character to clash with the room they are trying to win."],
    backVsMain: [1, "When the main character stands out from the crowd, the plot is about them against the group.", "Standing out against blending in is a theme of identity.", "The eye finds the one who is different.", null, "Make the crowd slowly start dressing like the main character as they win people over."],
    backSameness: [1, "A crowd dressed alike is one force the main character must face.", "Sameness speaks to conformity, order, control.", "One person dressed differently in a uniform crowd becomes the next thing we watch.", null, "Break the sameness with one person who will matter later."],

    /* Set and landscape (Jeremy's example: how the setting moves the plot and the audience's attention) */
    setting: [3, "The place decides what can happen: a desert means thirst, a city means strangers, a ship means no escape.", "The landscape is often the theme made physical (isolation, freedom, being trapped).", "A new place is a new set of possibilities, so the audience scans it for what will happen here.", "visual", "Move each act to a place with less room to escape."],
    intExt: [2, "Going outside opens the story to the world; coming inside closes it into a room where people must face each other.", "Inside against outside is safety against danger, private against public.", "Stepping out of a door is a visual promise that the story is going somewhere.", null, "Hold the characters inside until the turn, then send them out."],
    weather: [2, "Weather can block a road, force people together or clear the way, moving the plot without anyone deciding to.", "Weather mirrors the inner state, so it carries the feeling of the theme.", "A change in the sky makes the audience expect a change on the ground.", null, "Let the weather build as the tension builds, and break when it breaks."],
    scale: [2, "A huge place makes people small and the task big; a small place makes every person matter.", "Scale is a theme of power and helplessness.", "Cutting from a small place to a huge one tells the audience the stakes just grew.", null, "Open up the scale of the place when the stakes rise."],
    envMotion: [1, "A world in motion (traffic, crowds, waves) keeps the clock running even when the characters stop.", "A moving world against still people is a theme of being left behind.", "Motion in the background keeps the eye alive between lines.", "movement", "Let the background slow to stillness before the big line."],
    setStyle: [1, "Where and when the place comes from sets the rules of what can happen.", "The style of the room shows the values of the people in it.", "A room that does not fit its people makes the audience ask why.", null, "Show the room's style change after the person who owns it changes."],
    setLayout: [2, "Where the doors, windows and walls are decides who can enter, leave, hide or overhear.", "Layout is a map of power: who sits at the head, who stands at the door.", "A door left open or a corner out of sight makes the audience watch it.", null, "Show the exit early, then block it at the climax."],
    layoutOpen: [2, "A cramped room forces conflict; an open one lets people avoid each other.", "Cramped against open is trapped against free.", "When a space closes in, the audience feels the pressure build.", null, "Shrink the space a little in every scene of the second act."],
    wallArt: [1, "A picture on the wall can hold a clue, a memory or a secret the plot will use.", "Art on the walls shows what the owners love and fear.", "A photo or painting the camera lingers on becomes a question.", "thought", "Let the camera rest on one picture that comes back later."],
    clutter: [1, "Clutter hides things; clearing it out can uncover the one thing the plot needs.", "A cluttered or bare room shows a cluttered or empty life.", "In clutter, the eye hunts; in a bare room, the one object wins.", null, "Strip the room bare before the moment that matters."],
    setUpkeep: [1, "A place falling apart marks time passing and things getting worse.", "Upkeep is a theme of care and neglect.", "Damage that was not there before makes the audience ask what happened.", null, "Let the home decay as the family drifts apart."],
    props: [3, "A prop handed over, lost or broken can move the whole plot.", "A prop that keeps returning carries the theme each time.", "A prop the camera notices becomes a promise the audience waits on.", "movement", "Plant the prop in act one; use it in act three."],

    /* Camera */
    shotSize: [2, "Getting closer as a scene goes on tells the audience we are heading toward the heart of it.", "Who gets close-ups is who the film thinks matters.", "A cut in close forces the audience onto one face or thing: it now holds attention.", null, "Move one size closer each time the stakes rise in a scene."],
    pov: [3, "Seeing through someone's eyes puts us in their plot: we want what they want.", "Whose eyes we borrow is whose side we are on.", "A point-of-view shot makes the audience search the frame the way the character would.", "thought", "Switch to the villain's eyes once, just before they act."],
    rackFocus: [2, "Pulling focus from one thing to another is a sentence: this, and now that.", "What goes soft and what goes sharp shows what matters.", "A focus pull drags attention from one place to another in a single move.", null, "Pull focus from a face to the thing it is afraid of."],
    composition: [1, "Leaving room in the frame for something to arrive makes the audience expect it.", "Where people sit in the frame shows power and isolation.", "Empty space on one side makes the eye wait for it to be filled.", null, "Frame someone at the edge of the shot before they are left out."],
    cutRate: [3, "Cutting faster tells the audience the story is speeding toward something.", "Fast against slow cutting is chaos against calm.", "Every cut is a new thing to look at, so the cut rate is the rate attention is moved by the camera.", "visual", "Speed up the cutting as the scene nears its turn, then hold one long shot after it."],
    shotDuration: [2, "Holding a shot longer than expected makes the audience feel something is about to happen.", "Long holds give weight; short ones keep things light.", "A long hold stretches attention on one thing; past a point the audience starts looking for what is wrong.", null, "Hold just long enough to make them uneasy, then cut."],
    cameraMove: [2, "A push in says 'pay attention, this is important'; a pull back says 'look what this means'.", "Moving toward or away from someone is moving toward or away from understanding them.", "The move itself carries the eye to the end of it.", "movement", "Push in slowly through a whole speech that changes someone's mind."],
    speedRamp: [2, "Slowing time stretches the moment before an impact, so the audience feels the stakes.", "Slow motion makes a moment feel like memory or fate.", "A change in time speed grabs attention instantly.", null, "Ramp to slow motion on the last second before a choice."],

    /* Movement and placement */
    characterPath: [3, "Where someone walks is where the plot goes: toward a door, toward a person, away from home.", "Paths that cross or keep missing each other are the theme of meeting and parting.", "The eye follows a walking person to where they are going.", null, "End every walk on the thing the next beat is about."],
    whoMoves: [2, "The person who moves is taking action; the one who stays still is waiting for something to happen.", "Who acts and who waits is a theme of power.", "The one moving gets the attention; the still one gets it when they finally move.", null, "Keep the main character still until they decide, then move them."],
    objectKind: [2, "An object can be the thing everyone wants: the plot follows it.", "An object can stand for the theme (the ring, the letter, the key).", "A new object in the frame becomes a question.", "visual", "Introduce the object with a reaction shot, not on its own."],
    objectEnter: [2, "Something coming into the frame is something entering the story.", "What arrives in the frame and what leaves it tells you what the film gains and loses.", "Anything entering the frame takes the eye.", "movement", "Have the object enter just as the line about it ends."],
    emptySpace: [1, "Empty space waits to be filled, so the audience expects someone or something to arrive.", "Emptiness can be loneliness or freedom.", "The eye goes to empty space waiting for it to change.", null, "Leave a chair empty that someone will sit in later."],
    eyeline: [2, "Where people look tells the audience where the next thing is coming from.", "Who looks at whom, and who looks away, is the theme of the relationship.", "The audience looks where the characters look.", "thought", "Have everyone look off screen before cutting to what they see."],

    /* Lines and voice */
    silence: [3, "A silence after a line tells the audience something has just changed.", "What people cannot say is often the theme.", "Silence pulls attention to faces and waits for the next sound.", "audio", "Leave a beat of silence after the most important line in the scene."],
    pace: [2, "Speeding up the lines speeds up the scene toward its end.", "Fast against slow talk shows who is in control.", "A change in pace makes the audience listen differently.", null, "Speed up the talking as an argument nears its turn."],
    volume: [2, "A voice getting louder pushes a scene toward a breaking point.", "Who shouts and who whispers says who holds power.", "A sudden change in loudness grabs attention.", null, "Drop to a whisper for the line that matters most."],
    vocalTone: [2, "The tone under the words tells us what the person really wants, which is where the plot really goes.", "A tone that fights the words is where theme hides.", "A tone that does not fit the words makes the audience listen harder.", null, "Say the threat sweetly."],
    emotion: [4, "The feeling of the beat drives what the characters do next.", "The feelings a film keeps returning to are its themes.", "A new feeling on a face is the strongest pull on the audience.", "visual", "Change the feeling at least once inside every scene."],

    /* Feeling */
    audienceFeeling: [4, "What the audience feels decides whether they want the story to go on.", "A film's themes are what it makes you feel about its ideas.", "The audience leans in when they feel something they need resolved.", "thought", "Let the audience know something the character does not, so they feel dread or hope."],
    emoContrastPrev: [3, "A scene that feels the opposite of the last one makes the story feel like it is moving.", "Contrasts between scenes show the film's two sides.", "A change in feeling from one scene to the next restarts attention.", null, "Follow every heavy scene with a lighter one, and the other way round."],
    subtext: [3, "What people mean but do not say is often the real plot.", "The gap between words and meaning is a theme of honesty.", "Subtext makes the audience work out what is really happening, so they stay involved.", "thought", "Write the scene so nobody says what they want."],
    stakes: [5, "What someone stands to lose is why the plot matters.", "What a film puts at stake is what it believes is precious.", "Rising stakes are the main reason audiences keep watching.", "plot", "Raise what they could lose at the end of every act."],
    hope: [4, "Hope gives the character a reason to keep going, and the audience a reason to hope with them.", "Hope against despair is a theme in almost every story.", "Hope offered and taken away keeps the audience on the hook.", "plot", "Give them a reason to hope just before the worst happens."],
    dread: [4, "Dread is the plot pulling forward before it arrives: the audience knows something is coming.", "What a film makes us dread shows what it fears.", "Dread holds attention by making the audience wait for the blow.", "thought", "Show the danger to the audience, not the character."],
    breather: [2, "A quiet scene after a big one lets the audience catch up, so the next push hits harder.", "Breathers show what the characters are fighting for.", "A breather resets attention so it can be pulled again.", null, "Put a quiet moment of warmth right before the hardest scene."],
    falseHigh: [4, "A false high or low tricks the audience into thinking the story is over, so the real ending hits harder.", "Things seeming fine and then not is a theme about pride or hope.", "Surprise reversals snap attention back.", "plot", "Let the hero win too easily at the midpoint."],
    emotionalDebt: [3, "Feeling held in builds pressure that has to come out, which sets up a scene.", "What people hold back is a theme of repression.", "The audience waits for the held-in feeling to burst.", null, "Hold the feeling in for three scenes, then let it out."],
    catharsis: [4, "The release at the end pays off everything the plot built.", "Catharsis is where the theme lands in the body.", "Everything before it pulls toward it.", null, "Make the release come from the character's own choice."],

    /* Comedy */
    comicBeat: [3, "Setup and payoff are the film's own promise and delivery, in miniature.", "A payoff that lands on a theme makes the joke mean something.", "A setup hangs in the air; the audience waits for its payoff.", "thought", "Pay off a joke from act one in act three's climax."],
    payoffDistance: [3, "A long gap between setup and payoff ties distant scenes together so the whole film feels like it is going somewhere.", "A late payoff says nothing in this world is wasted.", "The audience remembers the setup and waits.", null, "Put at least one setup more than half the film before its payoff."],
    runningGag: [2, "A running gag changes a little each time, tracking how the story has changed.", "What keeps repeating is what the film keeps thinking about.", "The audience waits for the next time it comes back.", null, "Let the running gag stop being funny at the low point."],
    callback: [3, "A callback ties the present to the past and shows how far we have come.", "A callback with a new meaning shows the theme growing.", "Recognition is a strong pull: the audience loves to catch it.", "thought", "Bring back a line from the first scene with the opposite meaning."],
    escalatingLie: [4, "A lie that grows drives the plot by itself; each scene must make it bigger.", "Lies and honesty are the theme.", "The audience waits for the lie to come out.", "plot", "Make each scene force the liar to add one more detail."],
    misunderstanding: [4, "A misunderstanding sends people off in the wrong direction, which makes plot.", "Not listening to each other is a theme.", "The audience knows the truth and waits for the moment it clears up.", "plot", "Let the audience see the mistake happen."],
    comicEscalation: [3, "Each joke topping the last pushes the scene to a breaking point.", "How far things can go is a theme of excess.", "The audience wants to see how far it will go.", null, "Go one step further than feels safe on the third beat."],
    ruleOfThree: [2, "Two the same and one different is a tiny plot with a twist.", "The third beat shows what breaks the pattern.", "The pattern makes the audience expect, and the third breaks it.", "thought", "Set up two the same, then make the third the turn."],
    comedyDevice: [2, "The kind of joke sets how the scene moves: slapstick moves bodies, wordplay moves ideas.", "What kind of jokes a film tells shows its view of people.", "Changing the kind of joke keeps the laughs fresh.", "thought", "Change the kind of joke when the laughs start to fade."],
    misdirection: [3, "Pointing the audience one way and paying off another makes the plot feel alive.", "Misdirection is a theme of appearances.", "Surprise snaps attention.", "thought", "Lead the audience to expect the obvious punchline, then hit them with another."],

    /* Plot and character */
    arcStage: [5, "Where the character stands in their change decides what they can do in this scene.", "The arc is the theme acted out.", "Watching someone change is the main reason to keep watching.", "plot", "Make each scene move them one stage, forward or back."],
    plotWant: [5, "Want against need is the engine of the plot: chasing the want drives the action, finding the need ends it.", "The gap between want and need is usually the theme.", "The audience waits for the character to see what they need.", "plot", "Let them get what they want and find it is wrong."],
    plotSecret: [4, "A secret about to come out drives scene after scene.", "Secrets are a theme of trust and shame.", "The audience waits for the secret to come out.", "plot", "Let the secret almost come out once per act."],
    plotProgress: [5, "Closer or further from the goal is the plot's own clock.", "Progress and setbacks show what the theme costs.", "Every step forward or back keeps the audience counting.", "plot", "Knock them back right after their biggest step forward."],
    theLie: [4, "The lie a character believes makes the choices that cause their trouble.", "The lie is usually the opposite of the theme.", "The audience waits for the lie to break.", "thought", "Show the lie working once before it fails."],
    arcTest: [5, "The test forces the character to act on what they have learned, so the plot turns.", "The test proves the theme.", "Everything has been pointing at the test.", "plot", "Make the test something only the new them could pass."],
    reveal: [5, "When the audience learns things decides the shape of the whole plot.", "What a film hides and reveals is how it argues its theme.", "A held-back answer is the strongest pull a film has.", "plot", "Reveal the answer one scene after the audience starts to guess it."],
    tensionCurve: [5, "Tension rising and falling is the plot's heartbeat.", "Where the tension peaks is where the theme is tested.", "Rising tension holds attention; falling tension lets it rest.", "plot", "Never let tension fall all the way until the end."],
    hook: [3, "A signature image comes back at turning points, marking the road.", "The repeated image becomes the theme in one picture.", "Recognition pulls attention.", "visual", "Open and close the film on the same image, changed."],
    sceneEntry: [3, "Entering a scene late (in the middle of something) makes the plot feel like it is already running.", "How scenes begin sets the film's rhythm.", "Coming in late makes the audience work to catch up.", null, "Start each scene as late as you can."],
    transition: [2, "A transition can link two scenes so the second feels like an answer to the first.", "Matching cuts tie ideas together.", "A clever transition carries attention across the cut.", "visual", "Match a shape or sound from the end of one scene to the start of the next."],
    intercut: [4, "Cutting between two lines of action makes them race toward each other.", "Two stories side by side comment on each other.", "Cutting away at the peak makes the audience wait to come back.", "plot", "Cut away from each line at its most tense moment."],

    /* Music and sound */
    music: [2, "Music arriving tells the audience the scene has become important.", "A tune tied to a person or idea brings the theme back each time it plays.", "Music starting or stopping is one of the strongest audio cues there is.", "audio", "Start the music on the turn, not at the top of the scene."],
    noMusic: [2, "Pulling the music out makes the next moment feel exposed and real.", "Silence where music was is a theme of loss or truth.", "The sudden absence of music makes the audience hold their breath.", "audio", "Cut the music on the most important line."],
    musicCue: [2, "The score tells the audience how to feel about where the plot is going.", "A theme in the music follows the theme of the film.", "A score change moves attention to what it plays under.", "audio", "Bring the main tune back only at turning points."],
    soundDesign: [2, "A sound off screen (a knock, a siren) brings the next event into the scene before we see it.", "The sounds of a world say what kind of world it is.", "An off-screen sound makes the audience look for its source.", "audio", "Let the audience hear the danger before they see it."],
    soundToCut: [2, "Sound that leads into the next scene pulls the audience forward across the cut.", "Sound tying scenes together ties their ideas.", "Hearing the next scene first makes the audience want to see it.", "audio", "Start the next scene's sound a second before the cut."],

    /* Light and color */
    lightChange: [3, "The light changing (a lamp switched off, the sun going down) marks time and turns the scene.", "Light changing is hope or threat arriving.", "A change in light pulls every eye.", "visual", "Change the light at the moment the feeling turns."],
    timeOfDay: [2, "Time of day is the plot's clock: night brings danger, morning brings a new start.", "Day and night carry hope and fear.", "A jump in the time of day tells the audience time has passed and things have moved.", null, "Put the darkest choice at night and the answer at dawn."],
    colorAccent: [2, "One color that pops marks the thing the plot will need.", "A single color can carry the theme through the film.", "The eye goes straight to the one color.", "visual", "Give the accent color only to the thing that matters."],
    colorDrift: [2, "Color drifting through a scene shows the mood moving.", "Color moving from warm to cold is a theme of loss.", "A slow color change pulls attention without anyone noticing why.", null, "Drift colder through a scene that ends in a loss."],

    /* Focus, mind, herd */
    distraction: [3, "A distracted character misses what matters, which causes trouble.", "Distraction is a theme of what we let slip.", "The audience sees what the character misses and waits for it to hit.", "thought", "Let the audience see the danger while the character is distracted."],
    focusShift: [3, "When a character's attention shifts, the plot shifts with it.", "What someone stops caring about is a theme.", "The audience's attention follows theirs.", "thought", "Shift their focus away from their goal at the midpoint."],
    dissenter: [4, "One person refusing the group turns the plot.", "Dissent is a theme of courage and conscience.", "The one who says no pulls every eye.", "plot", "Make the dissenter someone the audience did not expect."],
  };

  const FIELD = {
    id: "momentum",
    plain: "How this curiosity moves the plot and themes forward, and how it pulls the audience's attention on into what comes next.",
    fields: {
      push: "0 to 5: how much this curiosity usually moves the story forward on its own",
      plot: "How it moves the plot forward",
      theme: "How it builds the film's themes",
      pull: "How it pulls the audience's attention onward",
      cue: "The usual kind of cue it gives: " + CUES.map((c) => c.id).join(", "),
      tryThis: "One concrete way to use it for momentum",
    },
    sliders: [
      { id: "push", label: "Pushes the story", range: [0, 5], plain: "How much this curiosity moves the story forward in this panel." },
      { id: "pointsAhead", label: "Points ahead", scale: ["closes a door", "holds", "hints at what's next", "demands what's next"], plain: "Whether it settles something or leaves a question the next moment must answer." },
      { id: "themeLink", label: "Tied to a theme", scale: ["not at all", "loosely", "clearly", "it is the theme"], plain: "How closely it carries one of the film's themes here." },
    ],
  };

  /* ---------- lookups ---------- */
  function db() {
    return root.CuriosityDB && root.CuriosityDB.data ? root.CuriosityDB : null;
  }
  function catalog() {
    return typeof CURIOSITIES !== "undefined" ? CURIOSITIES : root.CURIOSITIES || [];
  }
  /* "music.source" (a slider) and "emotion@t2" (one engine track's copy) both belong to their curiosity. */
  const baseId = (id) => String(id || "").split("@")[0].split(".")[0];
  /* The curiosity record: the database row when there is one, else the catalog row. */
  function find(id) {
    const b = baseId(id);
    const D = db();
    if (D) {
      const row = D.get ? D.get("curiosity", b) : null;
      if (row) return row;
    }
    return catalog().find((c) => c.id === b) || null;
  }
  function workspaceOf(id) {
    const c = find(id);
    if (!c) return null;
    if (c.workspace) return c.workspace;
    return null;
  }
  function familyOf(id) {
    const c = find(id);
    if (!c) return "cut";
    if (c.workspace && FAMILY_OF_WS[c.workspace]) return FAMILY_OF_WS[c.workspace];
    if (c.group && FAMILY_OF_GROUP[c.group]) return FAMILY_OF_GROUP[c.group];
    if (c.group && /^Story/.test(c.group)) return /Focus|Perspective/.test(c.group) ? "mind" : "plot";
    return "cut";
  }
  const family = (id) => FAMILIES.find((f) => f.id === id) || null;
  const lower = (s) => String(s || "").replace(/^[A-Z](?![A-Z])/, (m) => m.toLowerCase());

  function note(id) {
    const b = baseId(id);
    const c = find(b);
    const label = c ? c.label : b;
    const fam = family(familyOf(b));
    /* A database row that carries its own momentum field wins. */
    const m = c && c.momentum;
    if (m && m.plot) {
      return { id: b, label, family: fam ? fam.id : "cut", push: Number.isFinite(m.push) ? m.push : 2, plot: m.plot, theme: m.theme || "", pull: m.pull || "", cue: m.cue || (fam ? fam.cue : "visual"), tryThis: m.tryThis || "", source: "database" };
    }
    const own = C[b];
    if (own) {
      return { id: b, label, family: fam ? fam.id : "cut", push: own[0], plot: own[1], theme: own[2], pull: own[3], cue: own[4] || (c && WS_CUE[c.workspace]) || (fam ? fam.cue : "visual"), tryThis: own[5], source: "written" };
    }
    const ws = (c && c.workspace) || (fam ? fam.workspaces[0] : "structure");
    const w = W[ws] || W.structure;
    const fill = (s) => s.replace(/\{name\}/g, lower(label));
    return { id: b, label, family: fam ? fam.id : "cut", push: w[0], plot: fill(w[1]), theme: fill(w[2]), pull: fill(w[3]), cue: WS_CUE[ws] || (fam ? fam.cue : "visual"), tryThis: fill(w[4]), source: "workspace", workspace: ws };
  }
  /* all() is asked for on many tabs and on every draw (Cue lab asks for it once per idea), so the list is kept
     until the database or the catalog changes (a different list, or a row added). Callers get their own array. */
  let allMemo = null;
  function all() {
    const D = db();
    const rows = D ? D.data.curiosities : catalog();
    const cat = catalog();
    const key = [rows, rows.length, cat, cat.length, Object.keys(C).length];
    if (allMemo && allMemo.key.every((k, i) => k === key[i])) return allMemo.list.slice();
    allMemo = { key, list: build(rows) };
    return allMemo.list.slice();
  }
  function build(rows) {
    const seen = new Set();
    const out = [];
    rows.concat(catalog()).forEach((c) => {
      if (!c || !c.id || seen.has(c.id)) return;
      seen.add(c.id);
      out.push(Object.assign({ workspace: workspaceOf(c.id) }, note(c.id)));
    });
    return out;
  }

  /* How a family looks, the same on every tab: one color and one short letter mark (never color alone).
     Eight families have their own validated color; the other five share gray. The letters are unique; two
     letters where family names start the same (Camera, Comedy, Cut; Movement, Music; Light). */
  const COLORS = { feeling: "#2a78d6", plot: "#eb6834", voice: "#1baf7a", comedy: "#eda100", movement: "#e87ba4", music: "#008300", camera: "#4a3aa7", place: "#e34948" };
  const OTHER = "#a8a39a";
  const LETTERS = { camera: "Ca", movement: "Mo", voice: "V", feeling: "F", comedy: "Co", wardrobe: "W", place: "S", light: "Li", music: "Mu", plot: "P", mind: "T", effects: "E", cut: "Cu" };
  const DARK_INK = "#1c1712";
  const LIGHT_INK = "#ffffff";
  /* Relative luminance and contrast (WCAG), to pick the letter's ink on its swatch. */
  function lum(hex) {
    const n = parseInt(String(hex).slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  const contrast = (a, b) => {
    const x = lum(a);
    const y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const inkOn = (color) => (contrast(color, LIGHT_INK) >= contrast(color, DARK_INK) ? LIGHT_INK : DARK_INK);
  const colorOf = (id) => COLORS[id] || OTHER;
  /* mark(family) -> { family, letter, color, ink, label }: the swatch and letter for a family, on every tab. */
  function mark(id) {
    const f = family(id);
    const color = colorOf(id);
    return { family: id || null, letter: LETTERS[id] || (id ? "?" : ""), color, ink: inkOn(color), label: f ? f.label : id ? String(id) : "" };
  }
  /* status(seconds, limit) -> { key, cls, icon, words, text }: how long one family has held attention against
     the limit, in icon plus words (never color alone). Under three quarters of the limit is Fresh, up to the
     limit is Getting long, past it is Too long. No hold at all (null) is "Nothing yet". cls is the CSS name
     (good, warn, crit) the tabs already use; text repeats words for the tabs that read it. */
  const STATUS = {
    none: { key: "none", cls: "good", icon: "●", words: "Nothing yet" },
    fresh: { key: "fresh", cls: "good", icon: "●", words: "Fresh" },
    long: { key: "long", cls: "warn", icon: "▲", words: "Getting long" },
    over: { key: "over", cls: "crit", icon: "■", words: "Too long" },
  };
  function status(seconds, limit) {
    let s;
    if (seconds == null || !Number.isFinite(Number(seconds))) s = STATUS.none;
    else {
      const r = Number(seconds) / (limit || 20);
      s = r < 0.75 ? STATUS.fresh : r <= 1 ? STATUS.long : STATUS.over;
    }
    return Object.assign({ text: s.words }, s);
  }

  const api = root.CurioMomentum || (root.CurioMomentum = {});
  Object.assign(api, { CUES, FAMILIES, FIELD, WORKSPACE_NOTES: W, WRITTEN: C, note, familyOf, family, find, all, baseId, COLORS, OTHER, LETTERS, mark, colorOf, inkOn, contrast, status, STATUS });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
