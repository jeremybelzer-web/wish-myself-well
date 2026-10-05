/* data/db-depth-look.js: the look of the picture, the camera, the people and their clothes, deeper. 5 filters and
   adjustments curiosities (a glow around bright things, blacks that swallow the detail, the picture hardening as
   things get worse, a look too perfect to trust, colors going wrong when the mind does), 5 camera angle
   curiosities (over the shoulder, both in one frame or apart, the camera at their height, a close look at a small
   thing, their look and then what they see), 5 archetype curiosities (the trickster, the caretaker, the rival who
   becomes a friend, the comic sidekick, the villain who thinks they are right) and 5 wardrobe curiosities (a change
   of clothes that marks the turn, the group dressing as one, the one piece that clashes, clothes that are not
   theirs, taking off the uniform), each with its own graded sliders and a momentum note, tied into suites,
   proximities and proximity suites. Loaded after db-depth-world.js. Written 2026-10-03 by the depth thread (look). */
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

  /* ---------- new filters and adjustments curiosities ---------- */

  c("highlightGlow", "A glow around bright things", "grade",
    "Bright spots in the picture spill a soft glow into the dark around them: a lamp, a window, sun on hair. Colorists call it bloom, or halation when the glow has a red edge like old film. It makes a moment feel dreamy, warm or like a memory.",
    [
      ["glow", "How much the bright parts glow", [0, 5], "From a clean, sharp picture (0) to bright spots melting into soft haze (5)."],
      ["from", "How bright before it glows", ["only the brightest lights", "bright things", "most light parts", "everything light"], "Which parts of the picture are bright enough to start glowing."],
      ["spread", "How far the glow spreads", [0, 10], "From a tight halo around the light (0) to glow that washes over half the frame (10)."],
      ["tint", "Color of the glow", ["white", "warm gold", "red edge, like old film", "cool blue", "pink"], "The color the glow takes on.", U],
      ["onWhat", "Where it shows most", ["lamps and windows", "faces and hair", "the sky", "water and metal", "everywhere"], "The part of the picture that glows the most.", U],
      ["when", "When it comes", ["the whole film", "only in memories", "only around one person", "it grows as they fall in love"], "Which moments get the glow.", U],
    ],
    [1, "A glow that only comes around one person tells us someone is falling for them before anyone says it.", "Light that softens and spills says this moment is precious, or not quite real.", "When the picture starts to glow, we lean in toward the memory or the crush it marks.", "visual", "Let every shot of her get a little more glow, and take it all away the day he learns she lied."]);

  c("darkSwallows", "Blacks that swallow the detail", "grade",
    "The darkest parts of the picture are pushed all the way to pure black, so we cannot see into them (colorists call it crushing the blacks). Whatever hides in that black becomes a question, and the mystery grows.",
    [
      ["crush", "How much of the dark goes to pure black", [0, 5], "From shadows we can see into (0) to shadows that are solid black (5)."],
      ["share", "Share of the frame in black", [0, 90, "%"], "How much of the picture is lost to black."],
      ["hides", "What the black hides", ["nothing", "the edges of the room", "half a face", "a person", "the thing we fear"], "What could be in the dark parts.", U],
      ["edge", "Edge of the dark", ["hard edge", "soft edge", "fades slowly"], "Whether the light stops sharply or melts into the black."],
      ["lifted", "When the dark lifts", ["never", "a little at the end", "at the reveal", "it gets darker"], "Whether the black ever gives up what it hides.", U],
      ["glint", "Small lights left in the dark", [0, 5], "Eyes, a cigarette tip, a ring catching the light: tiny bright points that survive in the black."],
    ],
    [2, "What hides in the black can step out and turn the scene.", "Shows how much of a person, or a world, stays unknown.", "We stare into the dark parts of the frame, trying to see.", "visual", "Grade the boss's office so half his face sinks into black, and only lift it in the scene where he tells the truth."]);

  c("hardeningLook", "The picture hardens as things get worse", "grade",
    "Across a scene or the whole film, the look gets harsher as the trouble grows: more contrast, less color, more grit. When things get better, it softens back. The picture itself tells us how bad it is.",
    [
      ["follows", "How closely the look follows the trouble", [0, 5], "From a look that never changes (0) to a look that hardens with every new problem (5)."],
      ["contrast", "Contrast added at the worst point", [0, 100, "%"], "How much harder the gap between light and dark gets at the worst moment."],
      ["drain", "Color drained at the worst point", [0, 100, "%"], "How much color is gone at the worst moment, toward grey."],
      ["grit", "Grit added", ["none", "a little", "clear grain", "rough and dirty"], "How much speckle and roughness creeps into the picture."],
      ["temp", "Which way the warmth goes", ["gets hotter", "stays", "gets colder"], "Whether the trouble turns the picture burning hot or icy."],
      ["steps", "How it changes", ["slowly over the film", "scene by scene", "in one hard jump"], "The pace of the hardening."],
    ],
    [2, "Each harder step of the look tells us the stakes went up, without a word.", "Shows a world losing its softness as people lose hope.", "We feel the picture tighten and brace for whatever made it so.", "visual", "Start the war film in warm full color and let each battle take a little color and add a little grit, until the last one is nearly grey."]);

  c("tooPerfectLook", "A look too perfect to trust", "grade",
    "Everything is too bright, too clean and too colorful, like a toothpaste advert. It tells us something is fake: a perfect town hiding a secret, a dream, a life put on for show.",
    [
      ["polish", "How perfect it looks", [0, 5], "From an ordinary picture (0) to a world that looks like a shop window (5)."],
      ["bright", "How bright and clean", ["normal", "bright", "very bright", "shining white"], "How much light and whiteness fills the picture."],
      ["candy", "How sweet the colors", [0, 100, "%"], "How much the colors are pushed toward candy pinks, mint greens and sky blues."],
      ["skin", "How smooth the faces", ["real skin", "a little smoothed", "like a magazine", "like dolls"], "How much the faces are smoothed and cleaned up."],
      ["crack", "A crack in the look", ["none", "a small wrong thing", "one dark corner", "it breaks apart"], "Whether something spoils the perfect picture, and how much."],
      ["why", "What it hides", ["a lie", "a dream", "a perfect family's secret", "an advert or a show", "a trap"], "What the perfect look is covering.", U],
    ],
    [2, "The first crack in the perfect look starts the unravelling.", "Shows how a perfect surface can hide something rotten.", "We search the too-clean picture for the thing that is wrong.", "visual", "Grade the suburb like a cereal advert, then let one lawn in the corner be dead and brown."]);

  c("wrongColors", "Colors go wrong when the mind does", "grade",
    "When a character is feverish, drunk, panicking or losing their grip, the colors stop behaving: they slide to the wrong shades, split apart at the edges, and the picture seems to breathe. We see the world the way their mind does.",
    [
      ["wrongness", "How wrong the colors go", [0, 5], "From true colors (0) to a world that looks nothing like real life (5)."],
      ["slide", "How far the colors slide", [0, 180, "degrees"], "How far each color moves around the color wheel: a little (small) or reds turning green (180)."],
      ["split", "Colors split at the edges", [0, 10], "Red and blue outlines pulling away from things, like a badly printed picture."],
      ["pulse", "The picture breathes", ["still", "slow pulse", "fast pulse", "flicker"], "Whether the brightness and color throb."],
      ["cause", "What causes it", ["fever", "drink or drugs", "panic", "grief", "a dream", "madness"], "Why their mind is bending the colors.", U],
      ["backTo", "Coming back", ["snaps back", "fades back", "stays a little wrong", "never comes back"], "How the colors return to normal, if they do."],
    ],
    [2, "When the colors go wrong, we cannot trust what we see, and the plot can trick us.", "Shows a mind coming apart from the world around it.", "We wait for the colors to settle, and worry when they don't.", "visual", "As the fever climbs, let the reds in the room slide toward purple, and snap them back when the nurse touches her hand."]);

  /* ---------- new camera angle curiosities ---------- */

  c("overShoulder", "Over the shoulder", "camera-angle",
    "The camera looks past one person's shoulder at the face of the other, so we stand in the conversation just behind one of them. How much shoulder we see, and who later gets a shot with nobody else in it, says who is close and who is on their own.",
    [
      ["shoulder", "How much of the near person we see", [0, 5], "From no shoulder at all, a clean shot of the face (0), to the near person filling half the frame (5)."],
      ["side", "Which shoulder we look past", ["left shoulder", "right shoulder", "swaps sides"], "Which side of the near person the camera sits.", U],
      ["tight", "How tight on the far face", ["whole body", "waist up", "shoulders up", "the face"], "How much of the far person we see."],
      ["sharp", "Who is sharp", ["the near shoulder", "both", "the far face"], "Which person is in focus."],
      ["match", "The two shots match", ["very different", "close", "mirror images"], "Whether each person's shot is framed the same way, which makes them feel equal."],
      ["alone", "Who gets a shot alone", ["nobody", "the one losing", "the one winning", "both by the end"], "Who ends up in a shot with no shoulder of the other person in it.", U],
    ],
    [2, "When the shoulder drops out and they each get a shot alone, the conversation has split them apart.", "Shows how close two people are by how much of one stays in the other's frame.", "We feel we are standing in the room, and notice when we are moved away.", "visual", "Shoot the first half of the breakup over each shoulder, then cut to clean shots of each of them alone once he says it is over."]);

  c("sharedFrame", "Both in one frame, or apart", "camera-angle",
    "Two people can share one shot (crews call it a two-shot) or each get their own shot and be cut between. Sharing the frame says they are together; splitting them says something stands between them, even when they sit side by side.",
    [
      ["together", "How much they share the frame", [0, 5], "From never in the same shot (0) to every shot holding both of them (5)."],
      ["shots", "Shots with both in them", [0, 100, "%"], "The share of the scene's shots that hold both people."],
      ["gap", "Space between them in the shot", ["touching", "close", "a gap", "far apart at the edges"], "How far apart they stand when they do share the frame."],
      ["bigger", "Who is bigger in the frame", ["the first person", "equal", "the second person"], "Whether one of them takes up more of the shot."],
      ["when", "When they come together", ["never", "in the end", "when they agree", "when they touch"], "The moment the two finally share a shot.", U],
      ["shape", "How they stand in the shot", ["side by side", "one behind the other", "face to face, side on", "back to back"], "The shape the two of them make in the frame.", U],
    ],
    [2, "The moment they finally share a shot, the relationship has turned.", "Shows closeness and distance in the shape of the frame itself.", "We feel, without knowing why, when they keep getting split apart.", "visual", "Keep the two sisters in separate shots the whole dinner, and only put them in one frame when one passes the other the salt."]);

  c("childHeight", "The camera at their height", "camera-angle",
    "Instead of sitting at a grown-up's eye level, the camera sits at the height of the person whose story it is: a small child, a dog, someone in a wheelchair, someone on the floor. Adults become legs and voices, and the world looks big.",
    [
      ["height", "How low the camera sits", [20, 170, "cm", 10], "The height of the camera from the floor; a standing adult's eyes are around 160 cm."],
      ["whose", "Whose height", ["a small child", "a pet", "someone seated or in a wheelchair", "someone lying down", "a short adult"], "The person the camera stays level with.", U],
      ["faces", "Faces of the tall people", ["cut off at the waist", "cut off at the neck", "they bend into view", "we see them fully"], "How much of the grown-ups' faces we get to see."],
      ["share", "Share of the film at their height", [0, 100, "%"], "How much of the film keeps the camera down at their level."],
      ["kneels", "Who comes down to their height", ["nobody", "a kind stranger", "a parent", "everyone in the end"], "Who kneels or sits so their face comes into the low frame.", U],
      ["size", "How big things look", ["normal", "a bit big", "huge", "towering"], "How large tables, doors and people look from down here."],
    ],
    [2, "When an adult kneels into the frame, they enter the small one's world and the story can change.", "Shows the world from the side of those who are usually overlooked.", "We feel small and see what the grown-ups miss.", "visual", "Shoot the whole divorce from the six-year-old's height, so we only see the parents' hands and shoes, until his father kneels down."]);

  c("closeOnThing", "A close look at a small thing", "camera-angle",
    "The camera cuts in close to a small thing: a hand on a doorknob, a ring taken off, a text on a phone, a ticking clock (crews call this an insert shot). It makes us look at exactly what matters.",
    [
      ["weight", "How much it matters", [0, 5], "From a detail that just sets the place (0) to the thing the whole plot turns on (5)."],
      ["thing", "What we see up close", ["a hand", "a phone or a note", "a ring or jewelry", "a clock", "a weapon", "food or a drink"], "The small thing in the shot.", U],
      ["hold", "How long we look", [0.5, 6, "seconds", 0.5], "Seconds the close shot stays on screen."],
      ["seenBy", "Does a character see it", ["only us", "one of them", "everyone"], "Whether anyone in the story notices the thing."],
      ["fill", "How much it fills the frame", ["part of the frame", "most of it", "fills it completely"], "How close the camera gets."],
      ["times", "Times we see it", [1, 5], "How many times the film cuts in close on it."],
    ],
    [3, "One close look at a small thing can carry the whole plot: the gun in the drawer, the missed call.", "Small things seen up close say what people will not.", "We hold on to the thing we were shown and wait for it to matter.", "visual", "Before the dinner party, cut in close on her wedding ring left beside the sink, and say nothing about it."]);

  c("glanceThenSee", "Their look, then what they see", "camera-angle",
    "A pattern of three shots: someone looks, we cut to what they see, then back to their face. It puts us inside their head and lets us read their reaction. Change the middle shot and the same face seems to feel something else (filmmakers call this the Kuleshov effect, after the man who tested it).",
    [
      ["pull", "How strongly it puts us in their head", [0, 5], "From a plain cut to a thing (0) to seeing the world through their eyes (5)."],
      ["seen", "What they see", ["a person", "an object", "a danger", "a place", "something we don't get to see"], "The middle shot.", U],
      ["through", "How close to their eyes", ["from the side", "near their eyes", "exactly through their eyes"], "Whether the middle shot is seen from where they stand."],
      ["faceHold", "How long we watch their face after", [0, 6, "seconds", 0.5], "Seconds we stay on their face once we cut back."],
      ["reaction", "What their face shows", ["nothing", "a small change", "a clear reaction", "a big reaction"], "How much their face moves when we come back to it."],
      ["looks", "Times they look again", [1, 4], "How many times the pattern repeats: look, see, look."],
    ],
    [2, "What they see decides what they do next, and we see it with them.", "Shows that what we feel depends on what we look at.", "We read their face to learn what the thing means to them.", "visual", "Cut from his face to the empty swing, then back to his face holding still for four seconds."]);

  /* ---------- new archetype curiosities ---------- */

  c("tricksterRole", "The trickster", "archetype",
    "A character who breaks the rules for fun or for gain: they lie, joke, swap things and cheat. They shake things loose so the story can move. Think of Loki, Bugs Bunny or Jack Sparrow.",
    [
      ["mischief", "How much trouble they stir", [0, 5], "From a small prank (0) to turning the whole story upside down (5)."],
      ["tool", "Their main trick", ["jokes", "lies", "disguises", "swaps and switches", "chaos", "bending the rules"], "How they make their mischief.", U],
      ["side", "Whose side they are on", ["against the hero", "nobody's", "their own", "the hero's"], "Who the tricks help."],
      ["caught", "Do they get caught", ["never", "once", "often", "in the end"], "Whether the tricks catch up with them."],
      ["truth", "Truth hidden in the tricks", [0, 5], "How often their tricks show everyone something true."],
      ["cost", "Who pays for the tricks", ["nobody", "fools who deserve it", "innocent people", "the trickster"], "Who ends up hurt or fooled.", U],
    ],
    [3, "The trickster's tricks knock the plot sideways and open doors nobody else would.", "Shows that breaking rules can reveal what the rules hide.", "We never know what they will do next, so we watch them closely.", "plot", "Let the cousin swap the name cards at the wedding dinner and seat the bride's two exes side by side."]);

  c("caretaker", "The caretaker", "archetype",
    "A character who looks after everyone else: feeds them, worries, patches them up. Their story is often about what they never get for themselves.",
    [
      ["care", "How much they look after others", [0, 5], "From a little help now and then (0) to their whole life spent on others (5)."],
      ["whom", "Who they look after", ["a child", "a sick parent", "the whole group", "a stranger", "someone who does not deserve it"], "The person or people they care for.", U],
      ["self", "How much they look after themselves", [0, 5], "From never (0) to keeping some care for themselves (5)."],
      ["thanks", "Thanks they get", ["none", "taken for granted", "some", "truly thanked"], "Whether anyone notices what they do."],
      ["breaks", "Do they break", ["never", "they snap once", "they walk away", "they fall ill"], "Whether the caring wears them down.", U],
      ["shows", "How we see the caring", ["cooking", "cleaning up", "worrying out loud", "patching wounds", "quiet small acts"], "What we watch them do for others.", U],
    ],
    [2, "The day the caretaker stops caring for everyone, the group falls apart and has to change.", "Asks who looks after the one who looks after everyone.", "We wait for someone to finally care for them back.", "thought", "Show the eldest sister make five lunches every morning, and on the day she leaves, let nobody know where the bread is."]);

  c("rivalToFriend", "The rival who becomes a friend", "archetype",
    "Two people start as rivals: the same goal, the same prize, sharp words. Step by step they come to respect each other, and end up on the same side.",
    [
      ["closeness", "How far they have come", ["sworn rivals", "grudging respect", "allies", "true friends"], "Where the two of them stand with each other now."],
      ["over", "What they compete for", ["a prize", "a person", "a place on the team", "respect", "being the best"], "The thing they both want.", U],
      ["scenes", "Scenes it takes", [1, 20], "How many scenes the road from rivals to friends takes."],
      ["turn", "What turns them", ["a shared enemy", "one saves the other", "they see each other's pain", "they lose together"], "The moment that starts the change.", U],
      ["spark", "Sharp words left", [0, 5], "How much teasing stays even once they are friends."],
      ["backslide", "Do they fall out again", ["never", "once", "often"], "Whether the friendship breaks before it holds."],
    ],
    [3, "When rivals team up, the plot gets a new force and the real enemy gets a real fight.", "Shows how respect can grow out of a fight.", "We wait for the moment they finally have each other's back.", "thought", "Let the two chess prodigies sneer through the tournament, then sit in silence together on the bus home after both lose."]);

  c("comicSidekick", "The comic sidekick", "archetype",
    "The hero's funny friend: they lighten the mood, say what we are all thinking and get into trouble. The best ones also have a heart and one brave moment of their own.",
    [
      ["funny", "How funny they are", [0, 5], "From a light touch (0) to a laugh in every line (5)."],
      ["kind", "Their kind of funny", ["clumsy", "loudmouth", "coward", "know-it-all", "odd and gentle"], "The way they make us laugh.", U],
      ["says", "Says what we are thinking", ["never", "sometimes", "always"], "How often they speak the audience's thoughts out loud."],
      ["brave", "Their brave moment", ["none", "a small one", "saves the day"], "Whether they step up when it counts."],
      ["screen", "Time on screen", [0, 50, "%"], "How much of the film they are in."],
      ["heart", "How much heart they show", [0, 5], "How much we see that they care, under the jokes."],
    ],
    [2, "The sidekick's mistakes cause trouble, and their one brave moment can turn the ending.", "Shows that the small and silly can be brave too.", "We relax when they are on screen and cheer when they step up.", "thought", "Let the cowardly best friend run away twice, and the third time run back in with a fire extinguisher."]);

  c("rightfulVillain", "The villain who thinks they are right", "archetype",
    "An enemy who believes they are the hero of their own story. Their reasons make sense, and their goal might even be good; only the way they go about it is wrong. They are scarier, and sadder, than a villain who is just evil.",
    [
      ["belief", "How sure they are they are right", [0, 5], "From a doubt they push down (0) to total certainty (5)."],
      ["goal", "What they want", ["to save the world", "to protect their family", "justice", "order", "revenge"], "The goal they are fighting for.", U],
      ["point", "How right they are", ["not at all", "a little", "partly", "mostly"], "How much of their argument holds up."],
      ["line", "How far they will go", ["bend the rules", "lie", "hurt people", "anything"], "What they are willing to do for it."],
      ["likeHero", "How alike they are to the hero", [0, 5], "From nothing in common (0) to the hero's own shadow (5)."],
      ["end", "How it ends for them", ["destroyed", "defeated", "they see they were wrong", "they win"], "Where their story finishes.", U],
    ],
    [3, "Because their reasons make sense, the hero has to answer them, not just beat them.", "Asks where doing good turns into doing harm.", "We half agree with them, and that worries us.", "thought", "Give the villain a speech about the flood that killed his family, and let the hero have no answer."]);

  /* ---------- new wardrobe curiosities ---------- */

  c("costumeTurn", "A change of clothes marks the turn", "wardrobe",
    "When a character changes inside, their clothes change too: the girl who puts on her mother's coat, the hero who finally wears the armor, the crook who buys his first good suit. The new clothes are the turn we can see.",
    [
      ["shift", "How big the change", [0, 5], "From one new piece (0) to a whole new person (5)."],
      ["direction", "Which way they change", ["dressed down", "sideways", "dressed up"], "Plainer, different, or smarter than before."],
      ["moment", "When it happens", ["a quiet scene alone", "a shopping scene", "after a loss", "before the big fight", "at the very end"], "The moment the new clothes go on.", U],
      ["kept", "What they keep from before", ["nothing", "one piece", "the color", "most of it"], "What carries over from the old look."],
      ["seen", "Who notices", ["nobody", "one person", "everyone stares"], "Whether the people around them see the change."],
      ["steps", "Steps to the new look", [1, 6], "All at once (1) or bit by bit over several scenes."],
    ],
    [3, "The new clothes show the character has crossed into a new part of the story.", "Shows that who we are shows in what we choose to wear.", "When they walk in looking new, we sit up: something has changed.", "visual", "After the funeral, let her put on her father's old work jacket and wear it for the rest of the film."]);

  c("groupDressed", "The group dresses as one", "wardrobe",
    "A gang, a band, a family or a team dresses alike: the same colors, the same jackets, the same hats. It says they belong together, and makes it easy to see who is out of step.",
    [
      ["alike", "How alike they dress", [0, 5], "From a loose likeness (0) to looking like one person copied (5)."],
      ["by", "What ties them together", ["a color", "a jacket or uniform", "a badge or patch", "a hairstyle", "a whole style"], "The thing they all wear.", U],
      ["size", "People in the group", [2, 12], "How many people dress the same."],
      ["outOfStep", "Who is out of step", ["nobody", "one is slightly off", "one refuses", "the hero breaks away"], "Whether someone does not match."],
      ["chosen", "Why they dress alike", ["forced on them", "expected", "chosen with pride"], "Whether the look is a rule or a choice."],
      ["drift", "Does the look fall apart", ["stays tight", "loosens", "splits in two", "they drop it"], "What happens to the shared look over the story."],
    ],
    [2, "When one member drops the group's look, we know the group is splitting before anyone says it.", "Shows belonging, and the price of it.", "We count who is still wearing the jacket.", "visual", "Give the five brothers the same leather jacket, and in the last act let the youngest turn up in a suit."]);

  c("clashingPiece", "The one piece that clashes", "wardrobe",
    "One thing a character wears that does not go with the rest: red shoes with a grey suit, a child's bracelet on a soldier. It says there is more to them, and gives the eye something to catch on.",
    [
      ["clash", "How much it clashes", [0, 5], "From a small odd touch (0) to a piece nobody can stop looking at (5)."],
      ["piece", "What it is", ["shoes", "a hat", "a scarf or tie", "jewelry", "a bag", "socks"], "The piece that does not match.", U],
      ["color", "Its color against the rest", ["the same family", "a bit brighter", "a strong contrast", "a shout"], "How far its color sits from the rest of the outfit."],
      ["meaning", "What it means", ["nothing", "a memory of someone", "a secret self", "a joke", "rebellion"], "The story behind the piece.", U],
      ["asked", "Does someone ask about it", ["never", "once", "they tell the story behind it"], "Whether the piece gets explained."],
      ["fate", "What happens to it", ["kept to the end", "lost", "given away", "thrown away"], "Where the piece ends up.", U],
    ],
    [2, "When the piece is lost, given away or thrown away, the character has let go of something.", "Shows the part of a person that does not fit what is expected of them.", "We wonder why they wear it, and wait for the story behind it.", "visual", "Dress the strict headmaster all in grey except for his cartoon socks, and never explain them until the end."]);

  c("notTheirClothes", "Clothes that are not theirs", "wardrobe",
    "Clothes that are too big, too small, borrowed or handed down: a boy in his late father's suit, a woman in a stolen uniform. Clothes that do not fit say the person does not fit their life yet, or is pretending.",
    [
      ["wrong", "How badly they fit", [0, 5], "From nearly right (0) to swimming in them, or bursting out (5)."],
      ["way", "Which way they fit wrong", ["far too small", "a bit small", "a bit big", "far too big"], "Too small or too big."],
      ["whose", "Whose clothes they are", ["handed down", "borrowed", "stolen", "from someone who died", "bought big to grow into"], "Where the clothes came from.", U],
      ["aware", "Do they know it shows", ["no idea", "a bit shy about it", "proud anyway"], "How the wearer feels about the bad fit."],
      ["grows", "Do they grow into them", ["never", "slowly", "by the end they fit"], "Whether the clothes come to fit."],
      ["others", "How others react", ["nobody notices", "a kind smile", "teasing", "someone fixes it"], "What the people around them do about it.", U],
    ],
    [2, "When the clothes start to fit, the character has grown into the role the story gave them.", "Shows a person not yet sure of the life they are in.", "We feel for them, and watch for the day the clothes finally fit.", "visual", "Send the boy to his first job interview in his late father's suit, sleeves past his fingers, and let the interviewer quietly roll them up."]);

  c("uniformOff", "Taking off the uniform", "wardrobe",
    "A soldier, police officer, nurse, priest or waiter takes off the uniform and becomes just a person. Or puts one on and becomes the job. The moment the uniform comes off often shows who they really are.",
    [
      ["weight", "How much it matters", [0, 5], "From changing after work (0) to giving up who they were (5)."],
      ["uniform", "Which uniform", ["soldier", "police", "nurse or doctor", "priest or nun", "waiter or shop worker", "school uniform"], "The job the uniform belongs to.", U],
      ["how", "How it comes off", ["slowly and carefully", "pulled off in anger", "torn off", "folded and left behind"], "The way they take it off.", U],
      ["first", "What comes off first", ["the hat", "the badge", "the jacket", "the shoes", "all at once"], "The first piece to go.", U],
      ["back", "Do they put it back on", ["never", "once more", "yes, every day"], "Whether the uniform returns."],
      ["who", "Who sees it", ["they are alone", "one person they trust", "everyone"], "Who is there when it comes off."],
    ],
    [3, "Taking off the uniform often means quitting, running or choosing a side, and the plot turns on it.", "Shows the person under the role.", "When the badge goes on the table, we know there is no going back.", "visual", "Let the cop unpin his badge in the car, look at it for a long beat, and leave it on the seat."]);

  /* ---------- suites ---------- */

  S("soft-glow-of-memory", "The soft glow of memory", "grade",
    "Warm gold glow on lamps and hair, only in the memories, so the past looks softer than the present.",
    [
      { curiosity: "highlightGlow", value: 4 },
      { curiosity: "highlightGlow", slider: "tint", value: "warm gold" },
      { curiosity: "highlightGlow", slider: "when", value: "only in memories" },
      { curiosity: "highlightGlow", slider: "onWhat", value: "faces and hair", weight: 70 },
      { curiosity: "nostalgia", value: 4, weight: 70 },
      { curiosity: "nostalgia", slider: "look", value: "faded and warm", weight: 60 },
    ], { also: ["emo-road"] });

  S("into-the-dark", "Into the dark", "grade",
    "Most of the frame sinks to pure black with a hard edge, a few glints survive, and a person waits in it.",
    [
      { curiosity: "darkSwallows", value: 5 },
      { curiosity: "darkSwallows", slider: "share", value: 60 },
      { curiosity: "darkSwallows", slider: "hides", value: "a person" },
      { curiosity: "darkSwallows", slider: "glint", value: 2, weight: 70 },
      { curiosity: "darkSwallows", slider: "edge", value: "hard edge", weight: 60 },
      { curiosity: "offscreen", value: 4, weight: 60 },
    ]);

  S("the-perfect-town", "The perfect town", "grade",
    "Shining bright, candy colors, faces like dolls, a perfect family's secret, and one small wrong thing in the corner.",
    [
      { curiosity: "tooPerfectLook", value: 5 },
      { curiosity: "tooPerfectLook", slider: "bright", value: "very bright" },
      { curiosity: "tooPerfectLook", slider: "candy", value: 80 },
      { curiosity: "tooPerfectLook", slider: "skin", value: "like dolls", weight: 70 },
      { curiosity: "tooPerfectLook", slider: "crack", value: "a small wrong thing" },
      { curiosity: "tooPerfectLook", slider: "why", value: "a perfect family's secret", weight: 60 },
      { curiosity: "highlightGlow", value: 2, weight: 50 },
    ]);

  S("picture-falls-apart", "The picture falls apart", "grade",
    "The look hardens scene by scene, color drains, grit creeps in, and finally the colors themselves go wrong.",
    [
      { curiosity: "hardeningLook", value: 4 },
      { curiosity: "hardeningLook", slider: "steps", value: "scene by scene" },
      { curiosity: "hardeningLook", slider: "drain", value: 70 },
      { curiosity: "hardeningLook", slider: "grit", value: "clear grain", weight: 70 },
      { curiosity: "wrongColors", value: 3 },
      { curiosity: "wrongColors", slider: "cause", value: "panic", weight: 60 },
      { curiosity: "wrongColors", slider: "backTo", value: "stays a little wrong", weight: 60 },
    ]);

  S("the-close-conversation", "The close conversation", "camera-angle",
    "Matching shots over each shoulder, both faces sharp, the two sharing the frame, and every look answered by what they see.",
    [
      { curiosity: "overShoulder", value: 3 },
      { curiosity: "overShoulder", slider: "match", value: "mirror images" },
      { curiosity: "overShoulder", slider: "sharp", value: "both", weight: 70 },
      { curiosity: "sharedFrame", value: 3 },
      { curiosity: "sharedFrame", slider: "gap", value: "close", weight: 70 },
      { curiosity: "glanceThenSee", value: 3, weight: 60 },
    ]);

  S("pulled-apart-by-the-frame", "Pulled apart by the frame", "camera-angle",
    "They never share a shot, the shoulders drop out, each ends up alone, and the gap between what they feel grows.",
    [
      { curiosity: "sharedFrame", value: 0 },
      { curiosity: "sharedFrame", slider: "when", value: "never" },
      { curiosity: "overShoulder", value: 0 },
      { curiosity: "overShoulder", slider: "alone", value: "both by the end" },
      { curiosity: "emotionGap", value: 4, weight: 70 },
      { curiosity: "personalSpace", value: "across the room", weight: 50 },
    ], { also: ["emotion"] });

  S("a-childs-eye-world", "A child's-eye world", "camera-angle",
    "The camera at a small child's height, grown-ups cut off at the waist, everything towering, until a parent kneels into the frame.",
    [
      { curiosity: "childHeight", value: 60 },
      { curiosity: "childHeight", slider: "whose", value: "a small child" },
      { curiosity: "childHeight", slider: "faces", value: "cut off at the waist" },
      { curiosity: "childHeight", slider: "size", value: "towering", weight: 70 },
      { curiosity: "childHeight", slider: "kneels", value: "a parent", weight: 70 },
      { curiosity: "closeOnThing", slider: "thing", value: "a hand", weight: 50 },
    ]);

  S("the-planted-detail", "The planted detail", "camera-angle",
    "A close look at a small thing that only we see, a glance that lands on it, and a clue quietly planted for later.",
    [
      { curiosity: "closeOnThing", value: 4 },
      { curiosity: "closeOnThing", slider: "seenBy", value: "only us" },
      { curiosity: "closeOnThing", slider: "hold", value: 2 },
      { curiosity: "glanceThenSee", slider: "seen", value: "an object" },
      { curiosity: "glanceThenSee", slider: "reaction", value: "a small change", weight: 70 },
      { curiosity: "plantForgotten", value: 3, weight: 60 },
    ], { also: ["plot"] });

  S("from-rivals-to-friends", "From rivals to friends", "archetype",
    "Sworn rivals over the same prize meet a shared enemy, keep their sharp words, and end up true friends.",
    [
      { curiosity: "rivalToFriend", value: "true friends" },
      { curiosity: "rivalToFriend", slider: "turn", value: "a shared enemy" },
      { curiosity: "rivalToFriend", slider: "spark", value: 3, weight: 70 },
      { curiosity: "rivalToFriend", slider: "scenes", value: 10, weight: 60 },
      { curiosity: "chemistry", slider: "kind", value: "rivalry", weight: 70 },
    ], { also: ["comedy-mix"] });

  S("the-heros-circle", "The hero's circle", "archetype",
    "Around the hero: a comic sidekick with one brave moment, a caretaker nobody thanks, and a trickster who is secretly on their side.",
    [
      { curiosity: "comicSidekick", value: 4 },
      { curiosity: "comicSidekick", slider: "brave", value: "saves the day" },
      { curiosity: "caretaker", value: 4 },
      { curiosity: "caretaker", slider: "thanks", value: "taken for granted", weight: 70 },
      { curiosity: "tricksterRole", slider: "side", value: "the hero's" },
      { curiosity: "tricksterRole", value: 3, weight: 60 },
    ]);

  S("the-worthy-enemy", "The worthy enemy", "archetype",
    "A villain who is mostly right, sure of it, much like the hero, and ready to hurt people for a good goal.",
    [
      { curiosity: "rightfulVillain", value: 5 },
      { curiosity: "rightfulVillain", slider: "point", value: "mostly" },
      { curiosity: "rightfulVillain", slider: "likeHero", value: 4 },
      { curiosity: "rightfulVillain", slider: "line", value: "hurt people", weight: 70 },
      { curiosity: "foil", value: 4, weight: 60 },
    ], { also: ["arc"] });

  S("the-gang-look", "The gang look", "wardrobe",
    "Six people in the same jacket, worn with pride, and one who refuses, marked by a piece that clashes.",
    [
      { curiosity: "groupDressed", value: 5 },
      { curiosity: "groupDressed", slider: "by", value: "a jacket or uniform" },
      { curiosity: "groupDressed", slider: "size", value: 6 },
      { curiosity: "groupDressed", slider: "chosen", value: "chosen with pride", weight: 70 },
      { curiosity: "groupDressed", slider: "outOfStep", value: "one refuses" },
      { curiosity: "clashingPiece", value: 3, weight: 60 },
    ]);

  S("growing-into-it", "Growing into it", "wardrobe",
    "Handed-down clothes far too big, worn shyly at first, a kind smile, and bit by bit a new look that finally fits.",
    [
      { curiosity: "notTheirClothes", value: 4 },
      { curiosity: "notTheirClothes", slider: "way", value: "far too big" },
      { curiosity: "notTheirClothes", slider: "whose", value: "handed down" },
      { curiosity: "notTheirClothes", slider: "grows", value: "by the end they fit" },
      { curiosity: "notTheirClothes", slider: "others", value: "a kind smile", weight: 60 },
      { curiosity: "costumeTurn", slider: "steps", value: 4, weight: 70 },
    ]);

  S("laying-down-the-badge", "Laying down the badge", "wardrobe",
    "The uniform comes off for good, folded and left behind, the badge first, in front of one person they trust.",
    [
      { curiosity: "uniformOff", value: 5 },
      { curiosity: "uniformOff", slider: "how", value: "folded and left behind" },
      { curiosity: "uniformOff", slider: "first", value: "the badge" },
      { curiosity: "uniformOff", slider: "back", value: "never" },
      { curiosity: "uniformOff", slider: "who", value: "one person they trust", weight: 70 },
      { curiosity: "costumeTurn", slider: "direction", value: "dressed down", weight: 60 },
    ]);

  /* ---------- proximities ---------- */

  P("glow-nostalgia", "When the bright parts glow more, nostalgia comes", "grade",
    "When the highlights melt into soft glow, a longing for the past rises within 2 beats.",
    { curiosity: "highlightGlow", change: "rises" }, { curiosity: "nostalgia", change: "rises" }, 2, { also: ["emo-road"] });
  P("glow-red-edge-old-film", "When the glow has a red edge, the picture looks like old film", "grade",
    "When the glow takes the red edge of old film, the old film look follows within a beat.",
    { curiosity: "highlightGlow", slider: "tint", is: "red edge, like old film" }, { curiosity: "retroEffect", is: "old film" }, 1);
  P("glow-around-one-tenderness", "When the glow only comes around one person, tenderness grows", "grade",
    "When only one person glows, the tenderness toward them grows within 3 beats.",
    { curiosity: "highlightGlow", slider: "when", is: "only around one person" }, { curiosity: "tenderness", change: "rises" }, 3, { also: ["emotion"] });
  P("dark-swallows-dread", "When the blacks swallow more, dread rises", "grade",
    "When more of the dark goes to solid black, dread grows within 2 beats.",
    { curiosity: "darkSwallows", change: "rises" }, { curiosity: "dread", change: "rises" }, 2, { also: ["emo-road"] });
  P("dark-hides-person", "When the black hides a person, more is kept from us", "grade",
    "When someone waits in the black, what we cannot see grows within a beat.",
    { curiosity: "darkSwallows", slider: "hides", is: "a person" }, { curiosity: "offscreen", change: "rises" }, 1, { also: ["focus"] });
  P("more-black-more-questions", "When more of the frame is black, the questions pile up", "grade",
    "When the dark takes more of the picture, the audience holds more open questions within 3 beats.",
    { curiosity: "darkSwallows", slider: "share", change: "rises" }, { curiosity: "openQuestions", change: "rises" }, 3, { also: ["plot"] });
  P("dark-lifts-answers", "When the dark lifts at the reveal, a question is answered", "grade",
    "When the black finally gives up what it hid, the open questions drop within a beat.",
    { curiosity: "darkSwallows", slider: "lifted", is: "at the reveal" }, { curiosity: "openQuestions", change: "drops" }, 1, { also: ["plot"] });
  P("hardening-tension", "When the look follows the trouble closely, tension rises", "grade",
    "When the picture hardens with every new problem, tension climbs within 3 beats.",
    { curiosity: "hardeningLook", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 3, { also: ["structure"] });
  P("drained-hope-drops", "When the color drains away, hope fades", "grade",
    "When the worst moment takes the color with it, hope drops within 3 beats.",
    { curiosity: "hardeningLook", slider: "drain", change: "rises" }, { curiosity: "hope", change: "drops" }, 3, { also: ["emo-road"] });
  P("hope-softens-look", "When hope comes back, the picture softens", "emo-road",
    "When hope rises, the hardened look eases back within 3 beats.",
    { curiosity: "hope", change: "rises" }, { curiosity: "hardeningLook", change: "drops" }, 3, { also: ["grade"] });
  P("perfect-look-doubt", "When the look gets more perfect, we trust it less", "grade",
    "When the picture gets too clean to be real, the audience doubts it within 3 beats.",
    { curiosity: "tooPerfectLook", change: "rises" }, { curiosity: "unreliableView", change: "rises" }, 3, { also: ["focus"] });
  P("perfect-breaks-reversal", "When the perfect look breaks apart, everything flips", "grade",
    "When the perfect picture cracks wide open, a reversal lands within a beat.",
    { curiosity: "tooPerfectLook", slider: "crack", is: "it breaks apart" }, { curiosity: "reversal", change: "rises" }, 1, { also: ["plot"] });
  P("wrong-colors-doubt", "When the colors go wrong, we cannot trust what we see", "grade",
    "When the colors slide away from real life, the audience doubts the picture within a beat.",
    { curiosity: "wrongColors", change: "rises" }, { curiosity: "unreliableView", change: "rises" }, 1, { also: ["focus"] });
  P("dread-bends-colors", "When dread runs high, the colors start to go wrong", "emo-road",
    "When fear grips the character, the colors begin to slip within 2 beats.",
    { curiosity: "dread", change: "rises" }, { curiosity: "wrongColors", change: "rises" }, 2, { also: ["grade"] });
  P("shot-alone-loneliness", "When the one losing gets a shot alone, loneliness grows", "camera-angle",
    "When the shoulder drops out and the losing one stands alone in the frame, loneliness rises within 2 beats.",
    { curiosity: "overShoulder", slider: "alone", is: "the one losing" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("more-shoulder-closer", "When more of the near person fills the frame, they feel closer", "camera-angle",
    "When the shoulder takes more of the shot, the two feel close together within 2 beats.",
    { curiosity: "overShoulder", change: "rises" }, { curiosity: "personalSpace", is: "close" }, 2, { also: ["emotion"] });
  P("shared-frame-warmth", "When they share the frame more, warmth grows", "camera-angle",
    "When the two keep ending up in the same shot, warmth between them rises within 2 beats.",
    { curiosity: "sharedFrame", change: "rises" }, { curiosity: "warmth", change: "rises" }, 2, { also: ["emo-road"] });
  P("feeling-gap-splits-frame", "When their feelings drift apart, the frame splits them", "emotion",
    "When the gap in what they feel grows, they share fewer shots within 2 beats.",
    { curiosity: "emotionGap", change: "rises" }, { curiosity: "sharedFrame", change: "drops" }, 2, { also: ["camera-angle"] });
  P("together-on-touch-tenderness", "When they come together in the frame on a touch, tenderness grows", "camera-angle",
    "When a touch finally puts them in one shot, tenderness rises within a beat.",
    { curiosity: "sharedFrame", slider: "when", is: "when they touch" }, { curiosity: "tenderness", change: "rises" }, 1, { also: ["emotion"] });
  P("towering-awe", "When everything towers over them, awe rises", "camera-angle",
    "When the low camera makes the world huge, awe grows within 2 beats.",
    { curiosity: "childHeight", slider: "size", is: "towering" }, { curiosity: "awe", change: "rises" }, 2, { also: ["emotion"] });
  P("at-their-height-empathy", "When more of the film stays at their height, we feel with them", "camera-angle",
    "When the camera keeps to the small one's level, the audience feels with them within 4 beats.",
    { curiosity: "childHeight", slider: "share", change: "rises" }, { curiosity: "empathy", change: "rises" }, 4, { also: ["emotion"] });
  P("parent-kneels-warmth", "When a parent kneels down to their height, warmth returns", "camera-angle",
    "When a parent comes down into the low frame, warmth rises within a beat.",
    { curiosity: "childHeight", slider: "kneels", is: "a parent" }, { curiosity: "warmth", change: "rises" }, 1, { also: ["emo-road"] });
  P("close-look-unburies-plant", "When the close look matters more, the planted clue is less hidden", "camera-angle",
    "When the camera cuts in close on a small thing, the clue it plants is less buried within a beat.",
    { curiosity: "closeOnThing", change: "rises" }, { curiosity: "plantForgotten", change: "drops" }, 1, { also: ["plot"] });
  P("close-look-we-know-first", "When only we see the small thing, we know before they do", "camera-angle",
    "When the close shot shows something no character notices, the audience knows first within a beat.",
    { curiosity: "closeOnThing", slider: "seenBy", is: "only us" }, { curiosity: "knowledgeGap", is: "audience first" }, 1, { also: ["plot"] });
  P("glance-empathy", "When their look puts us in their head, we feel with them", "camera-angle",
    "When we see through their eyes and back to their face, empathy grows within 2 beats.",
    { curiosity: "glanceThenSee", change: "rises" }, { curiosity: "empathy", change: "rises" }, 2, { also: ["emotion"] });
  P("glance-unseen-offscreen", "When we don't get to see what they see, more is kept from us", "camera-angle",
    "When the middle shot is held back, what we cannot see grows within a beat.",
    { curiosity: "glanceThenSee", slider: "seen", is: "something we don't get to see" }, { curiosity: "offscreen", change: "rises" }, 1, { also: ["focus"] });
  P("face-hold-realization", "When we stay on their face longer, we watch them understand", "camera-angle",
    "When the camera holds on the face after the look, the moment they see it grows within 2 beats.",
    { curiosity: "glanceThenSee", slider: "faceHold", change: "rises" }, { curiosity: "realization", change: "rises" }, 2, { also: ["arc"] });
  P("trickster-complication", "When the trickster stirs more trouble, things get worse", "archetype",
    "When the trickster's mischief grows, a new problem lands within 2 beats.",
    { curiosity: "tricksterRole", change: "rises" }, { curiosity: "complication", change: "rises" }, 2, { also: ["plot"] });
  P("trickster-truth-realization", "When the tricks hide more truth, someone sees it", "archetype",
    "When the trickster's games show something true, the moment someone understands comes within 3 beats.",
    { curiosity: "tricksterRole", slider: "truth", change: "rises" }, { curiosity: "realization", change: "rises" }, 3, { also: ["arc"] });
  P("trickster-swaps-laughs", "When the trickster swaps and switches, the laughs come", "archetype",
    "When the tricks are swaps and switches, laughs come more often within 2 beats.",
    { curiosity: "tricksterRole", slider: "tool", is: "swaps and switches" }, { curiosity: "laughsPerMinute", change: "rises" }, 2, { also: ["comedy"] });
  P("caretaker-tenderness", "When the caretaker looks after others more, tenderness grows", "archetype",
    "When the caring grows, tenderness in the scene rises within 2 beats.",
    { curiosity: "caretaker", change: "rises" }, { curiosity: "tenderness", change: "rises" }, 2, { also: ["emotion"] });
  P("caretaker-unthanked-empathy", "When nobody thanks the caretaker, we feel for them", "archetype",
    "When the care gets no thanks at all, the audience feels for them within 3 beats.",
    { curiosity: "caretaker", slider: "thanks", is: "none" }, { curiosity: "empathy", change: "rises" }, 3, { also: ["emotion"] });
  P("caretaker-walks-complication", "When the caretaker walks away, everything falls apart", "archetype",
    "When the one who held everyone together leaves, a new problem lands within 2 beats.",
    { curiosity: "caretaker", slider: "breaks", is: "they walk away" }, { curiosity: "complication", change: "rises" }, 2, { also: ["plot"] });
  P("rivals-closer-warmth", "When the rivals come closer, warmth grows", "archetype",
    "When the rivals move toward friendship, warmth between them rises within 2 beats.",
    { curiosity: "rivalToFriend", change: "rises" }, { curiosity: "warmth", change: "rises" }, 2, { also: ["emo-road"] });
  P("rivals-spark-chemistry", "When the rivals keep their sharp words, the spark grows", "archetype",
    "When the teasing stays, the chemistry between them grows within 2 beats.",
    { curiosity: "rivalToFriend", slider: "spark", change: "rises" }, { curiosity: "chemistry", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("shared-enemy-sides", "When a shared enemy turns them, the sides shift", "archetype",
    "When a common enemy appears, who sides with whom shifts within a beat.",
    { curiosity: "rivalToFriend", slider: "turn", is: "a shared enemy" }, { curiosity: "alliances", change: "rises" }, 1, { also: ["comedy-mix"] });
  P("sidekick-laughs", "When the sidekick gets funnier, the laughs come more often", "archetype",
    "When the sidekick's jokes grow, laughs come more often within 2 beats.",
    { curiosity: "comicSidekick", change: "rises" }, { curiosity: "laughsPerMinute", change: "rises" }, 2, { also: ["comedy"] });
  P("sidekick-saves-pride", "When the sidekick saves the day, pride rises", "archetype",
    "When the funny friend steps up and wins it, pride rises within a beat.",
    { curiosity: "comicSidekick", slider: "brave", is: "saves the day" }, { curiosity: "pride", change: "rises" }, 1, { also: ["emotion"] });
  P("villain-like-hero-mirror", "When the villain is more like the hero, the mirror grows", "archetype",
    "When the villain shares more with the hero, they become the hero's mirror character within 3 beats.",
    { curiosity: "rightfulVillain", slider: "likeHero", change: "rises" }, { curiosity: "foil", change: "rises" }, 3, { also: ["arc"] });
  P("villain-mostly-right-mixed", "When the villain is mostly right, our feelings get mixed", "archetype",
    "When the enemy's argument holds up, the audience feels two things at once within 2 beats.",
    { curiosity: "rightfulVillain", slider: "point", is: "mostly" }, { curiosity: "mixedFeelings", change: "rises" }, 2, { also: ["emotion"] });
  P("costume-turn-change-shows", "When the change of clothes is bigger, the inner change shows", "wardrobe",
    "When the new look grows, the character's change is easier to see within a beat.",
    { curiosity: "costumeTurn", change: "rises" }, { curiosity: "changeShows", change: "rises" }, 1, { also: ["arc"] });
  P("realization-new-clothes", "When they finally see it, the clothes change", "arc",
    "When the moment of understanding lands, a change of clothes follows within 3 beats.",
    { curiosity: "realization", change: "rises" }, { curiosity: "costumeTurn", change: "rises" }, 3, { also: ["wardrobe"] });
  P("everyone-stares-pride", "When everyone stares at the new look, pride rises", "wardrobe",
    "When the room turns to see the new clothes, pride rises within a beat.",
    { curiosity: "costumeTurn", slider: "seen", is: "everyone stares" }, { curiosity: "pride", change: "rises" }, 1, { also: ["emotion"] });
  P("breaks-from-look-apart", "When the hero breaks from the group's look, they stand apart", "wardrobe",
    "When the hero stops dressing like the group, they end up apart from it within 2 beats.",
    { curiosity: "groupDressed", slider: "outOfStep", is: "the hero breaks away" }, { curiosity: "apartFromGroup", change: "rises" }, 2, { also: ["placement"] });
  P("group-look-splits-sides", "When the group's look splits in two, so do the sides", "wardrobe",
    "When half the group drops the shared look, the alliances shift within 2 beats.",
    { curiosity: "groupDressed", slider: "drift", is: "splits in two" }, { curiosity: "alliances", change: "rises" }, 2, { also: ["comedy-mix"] });
  P("clash-eye-first", "When the piece clashes more, the eye goes there first", "wardrobe",
    "When the odd piece clashes harder, our eye lands on it first within a beat.",
    { curiosity: "clashingPiece", change: "rises" }, { curiosity: "eyeFirst", change: "rises" }, 1, { also: ["focus"] });
  P("piece-memory-nostalgia", "When the odd piece is a memory of someone, nostalgia comes", "wardrobe",
    "When the clashing piece stands for someone gone, a longing for the past rises within 3 beats.",
    { curiosity: "clashingPiece", slider: "meaning", is: "a memory of someone" }, { curiosity: "nostalgia", change: "rises" }, 3, { also: ["emo-road"] });
  P("bad-fit-empathy", "When the clothes fit worse, we feel for them", "wardrobe",
    "When the clothes swamp or squeeze them, the audience feels for the wearer within 2 beats.",
    { curiosity: "notTheirClothes", change: "rises" }, { curiosity: "empathy", change: "rises" }, 2, { also: ["emotion"] });
  P("bad-fit-teased-shame", "When they are teased for the bad fit, shame rises", "wardrobe",
    "When others mock the clothes, the wearer's shame grows within a beat.",
    { curiosity: "notTheirClothes", slider: "others", is: "teasing" }, { curiosity: "shame", change: "rises" }, 1, { also: ["emotion"] });
  P("clothes-fit-change-shows", "When the clothes finally fit, the change shows", "wardrobe",
    "When they have grown into the clothes, their inner change shows within 2 beats.",
    { curiosity: "notTheirClothes", slider: "grows", is: "by the end they fit" }, { curiosity: "changeShows", change: "rises" }, 2, { also: ["arc"] });
  P("uniform-left-no-return", "When the uniform is folded and left behind, there is no going back", "wardrobe",
    "When the uniform is left for good, the point of no return comes within a beat.",
    { curiosity: "uniformOff", slider: "how", is: "folded and left behind" }, { curiosity: "pointOfNoReturn", change: "rises" }, 1, { also: ["plot"] });
  P("uniform-off-costume-turn", "When taking off the uniform matters more, the look turns", "wardrobe",
    "When the uniform comes off with weight, a change of clothes marks the turn within a beat.",
    { curiosity: "uniformOff", change: "rises" }, { curiosity: "costumeTurn", change: "rises" }, 1);
  P("uniform-off-trust-tenderness", "When the uniform comes off in front of someone they trust, tenderness grows", "wardrobe",
    "When they become just a person in front of one other, tenderness rises within 2 beats.",
    { curiosity: "uniformOff", slider: "who", is: "one person they trust" }, { curiosity: "tenderness", change: "rises" }, 2, { also: ["emotion"] });

  /* ---------- proximity suites ---------- */

  PS("the-look-darkens", "The look darkens", "grade",
    "The picture hardens as the trouble grows, tension climbs, the color drains and hope fades, the blacks swallow more and dread rises.",
    ["hardening-tension", "drained-hope-drops", "dark-swallows-dread", "more-black-more-questions"], { also: ["emo-road"] });
  PS("the-lie-in-the-picture", "The lie in the picture", "grade",
    "The look gets too perfect and we trust it less, the colors go wrong and we doubt what we see, and then the perfect look breaks apart and everything flips.",
    ["perfect-look-doubt", "wrong-colors-doubt", "perfect-breaks-reversal"], { also: ["focus"] });
  PS("apart-then-together", "Apart, then together", "camera-angle",
    "Their feelings drift and the frame splits them, the one losing stands alone, then a touch puts them back in one shot and warmth returns.",
    ["feeling-gap-splits-frame", "shot-alone-loneliness", "together-on-touch-tenderness", "shared-frame-warmth"], { also: ["emotion"] });
  PS("the-small-ones-view", "The small one's view", "camera-angle",
    "The camera stays at their height and we feel with them, the world towers and awe rises, and a parent kneels down and warmth returns.",
    ["at-their-height-empathy", "towering-awe", "parent-kneels-warmth"]);
  PS("enemy-to-ally", "Enemy to ally", "archetype",
    "A shared enemy shifts the sides, the rivals come closer and warmth grows, and their sharp words keep the spark alive.",
    ["shared-enemy-sides", "rivals-closer-warmth", "rivals-spark-chemistry"], { also: ["comedy-mix"] });
  PS("the-change-you-can-wear", "The change you can wear", "wardrobe",
    "They finally see it and the clothes change, the new look shows the inner change, the clothes that were not theirs now fit, and the uniform comes off for good.",
    ["realization-new-clothes", "costume-turn-change-shows", "clothes-fit-change-shows", "uniform-left-no-return"], { also: ["arc"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
