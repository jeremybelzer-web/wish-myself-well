/* data/db-depth-sound.js: music and sound, deeper. 18 music curiosities (the music speeding up or slowing down,
   a turn from sad-sounding to bright, the lead instrument, the style of music, music crossing from the room into
   the soundtrack, a character's own tune, someone humming, a song performed in the story, repeating notes that
   build tension, music landing on the moment, clashing notes, bent or broken music, where the music goes across
   the film, whose feeling the music plays, music that warns us early, music from another time, title music,
   everyday sounds turning into music) and 4 audio-mix curiosities (handmade sounds, the background sound of the
   place, hearing through their ears, the echo of the place), each with its own graded sliders and a momentum
   note, tied into suites, proximities and proximity suites. Loaded after db-heart.js. Written 2026-10-03 by the
   depth thread (sound). */
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

  /* ---------- new music curiosities ---------- */

  c("tempoShift", "Music speeds up or slows down", "music",
    "The music changes speed during the scene. Tempo just means how fast the beat goes: speeding up builds excitement or panic, slowing down lets things settle, or drag.",
    [
      ["shift", "Which way the speed goes", ["slows a lot", "slows a little", "steady", "speeds a little", "speeds a lot"], "Whether the beat gets slower or faster across the scene."],
      ["startBpm", "Starting speed", [40, 200, "beats per minute", 5], "How many beats a minute the music has when the scene starts. A resting heartbeat is about 70."],
      ["howQuick", "How quickly it changes", ["over the whole scene", "over a minute", "over a few seconds", "all at once"], "Whether the speed creeps or jumps."],
      ["tiedTo", "What the speed follows", ["nothing", "a heartbeat", "footsteps", "a clock", "the chase"], "What in the scene the beat seems to copy.", U],
      ["feel", "Feel of the beat", ["stiff and even", "steady", "bouncy", "loose and swinging"], "Whether the beat feels like a machine or loose like jazz."],
      ["landing", "Where it ends up", ["stops dead", "drops back to normal", "holds the new speed", "runs on into the next scene"], "What the speed does when the scene ends.", U],
    ],
    [3, "Speeding music tells us time is running out and the plot is racing to a point.", "Shows a world spinning out of control, or finally calming down.", "Our own pulse follows the beat and we need to know where it ends.", "audio", "Start the chase music slow and add five beats a minute with every shot until the catch."]);

  c("keyShift", "Music turns sad or bright", "music",
    "The music changes color partway through: from a sad, dark sound (musicians call it minor) to a bright, hopeful one (major), or the other way. Often the same tune, with a new feeling.",
    [
      ["direction", "Which way it turns", ["bright turns dark", "bright turns uneasy", "no turn", "dark turns uneasy", "dark turns bright"], "From darker endings to brighter ones: which way the music's color turns."],
      ["trigger", "What turns it", ["a line", "a look", "a touch", "a reveal", "nothing we see"], "What in the scene sets off the turn.", U],
      ["suddenness", "How sudden", ["over a minute", "over a few seconds", "on one note", "on the cut"], "How fast the color changes."],
      ["sameTune", "Same tune or a new one", ["a new tune", "part of the old tune", "the same tune, new color"], "Whether we hear a tune we know, turned, or something new."],
      ["climb", "Climbs higher", [0, 5], "How many times the music steps up in pitch to feel bigger and brighter, like the last chorus of a pop song."],
      ["settled", "How settled it ends", ["left hanging", "mostly settled", "fully settled"], "Whether the last notes sound finished or leave a question."],
    ],
    [3, "Marks the exact moment the story turns, for better or worse.", "Shows that the same thing, the same tune, can mean hope or loss.", "We feel the turn before anyone says it and wait to learn why.", "audio", "Play the love theme bright, then play it again dark on the moment she finds the letter."]);

  c("leadInstrument", "The lead instrument", "music",
    "The one instrument that carries the tune and gives the scene its voice: a lonely piano, a big brass section, a guitar, a synthesizer, a human voice.",
    [
      ["prominence", "How far forward it plays", [0, 5], "How much the lead instrument stands out from everything else."],
      ["instrument", "Which instrument leads", ["piano", "strings", "brass", "guitar", "woodwind", "synthesizer", "voice", "drums"], "The instrument that carries the tune.", U],
      ["touch", "How it is played", ["barely touched", "gentle", "firm", "hammered"], "How softly or hard the player plays."],
      ["closeness", "How close it sounds", ["far off", "across the room", "near", "right in your ear"], "Whether it sounds distant or close enough to hear the fingers and breath."],
      ["solo", "Alone or joined", ["alone", "joined later", "with others throughout"], "Whether it plays by itself or other instruments join."],
      ["register", "High or low notes", ["very low", "low", "middle", "high", "very high"], "Low notes feel heavy and dark; high notes feel light or fragile."],
    ],
    [1, "Gives each part of the story a voice we can recognise.", "One lonely instrument can carry a theme of loneliness; a big section carries power.", "The sound of one instrument makes us lean in to listen.", "audio", "Strip the score down to a single piano for the hardest scene in the film."]);

  c("musicStyle", "Style of music", "music",
    "The kind of music: orchestra, jazz, rock, electronic, folk, hip hop. Each style brings its own world, its own era and its own crowd.",
    [
      ["fit", "How well the style fits the world", ["clashes on purpose", "unexpected", "fits", "exactly what you'd expect"], "Whether the style is what the story's world would play, or a surprise."],
      ["style", "Which style", ["orchestral", "jazz", "rock", "electronic", "folk", "hip hop", "pop", "solo piano", "music from one place on earth"], "The kind of music.", U],
      ["era", "Old or new sound", ["old-fashioned", "classic", "current", "futuristic"], "How old or new the style sounds."],
      ["polish", "Rough or polished", ["raw and rough", "homemade", "clean", "glossy"], "Whether it sounds made in a garage or a big studio."],
      ["blendStyles", "Mixing styles", [0, 5], "How much it blends two styles, like an orchestra with a dance beat under it."],
      ["catchy", "How catchy", [0, 5], "How much the tune sticks in your head after the scene."],
    ],
    [1, "Tells us what kind of film this is from the first notes.", "The style says whose world we are in and what they value.", "A surprising style makes us wonder what kind of film this really is.", "audio", "Score your cowboy film with electronic music and see what the film becomes."]);

  c("sourceToScore", "Music crosses over", "music",
    "Music that starts inside the story (a radio, a band, someone singing) slides into being the film's own soundtrack, or the soundtrack turns out to be playing in the room. It blurs who can hear it.",
    [
      ["crossing", "Which way it crosses", ["from the soundtrack into the room", "no crossing", "from the room into the soundtrack"], "Whether music we thought only we heard turns up in the story, or music in the story grows into the soundtrack."],
      ["source", "Where it plays in the story", ["a radio or speaker", "a phone or headphones", "a live band", "someone singing", "a music box"], "What makes the music inside the story.", U],
      ["crossTime", "How long the crossing takes", [0, 20, "seconds"], "Seconds from the first hint of the change to the full change."],
      ["fullness", "Sound grows fuller", [0, 5], "How much bigger and cleaner it gets as it becomes the soundtrack, like a tinny radio blooming into the full song."],
      ["noticed", "Does a character notice", ["nobody notices", "we notice", "a character notices", "a character turns it off"], "Whether anyone in the story reacts to the music being there."],
      ["backAgain", "Crosses back", ["no", "once", "back and forth"], "Whether it crosses back the other way."],
    ],
    [2, "Carries us from a small moment in a room to a bigger feeling over a whole sequence.", "Blurs the line between what the characters feel and what we feel.", "We realise a character might hear what we hear, which pulls us closer.", "audio", "Let the car radio song swell into the full soundtrack as the car pulls away."]);

  c("characterTheme", "A character's own tune", "music",
    "A short tune that belongs to one character, place or idea and comes back whenever they matter. Musicians call it a leitmotif (say LITE-mo-teef): a calling card made of notes.",
    [
      ["recognizable", "How easy to recognise", [0, 5], "How quickly we know the tune and who it belongs to."],
      ["belongsTo", "Who or what it belongs to", ["the hero", "the villain", "a couple", "a place", "an object", "an idea"], "Who the tune stands for.", U],
      ["version", "How it is played this time", ["tender", "sad", "dark", "heroic", "playful"], "The mood this return of the tune is played in.", U],
      ["returns", "Times it returns", [1, 15], "How many times the tune comes back across the film."],
      ["trigger", "When it plays", ["they appear", "they are mentioned", "they are missed", "they are about to arrive"], "What calls the tune up.", U],
      ["fragment", "Whole or a piece", ["two notes", "a piece", "most of it", "the whole tune"], "How much of the tune we hear this time."],
    ],
    [2, "Tells us who matters in a scene even before they show up.", "Each new version of the tune tracks how that character or idea has changed.", "When we hear a few notes we wait for the person they belong to.", "audio", "Play the villain's two notes softly in a happy scene, and never explain it."]);

  c("humming", "Someone hums or sings", "music",
    "A character hums, whistles or sings to themselves inside the story. It shows a private mood and can carry a tune from one scene to the next.",
    [
      ["openness", "How loud and open", ["under the breath", "quiet humming", "singing softly", "singing out loud"], "How much of themselves they let out."],
      ["form", "What they do", ["humming", "whistling", "singing words", "singing along to a song"], "How the tune comes out.", U],
      ["skill", "How well they sing", ["off-key", "rough", "decent", "beautiful"], "How good it sounds."],
      ["known", "Which tune", ["made up", "a lullaby or folk tune", "a well-known song", "the film's own theme"], "Where the tune comes from.", U],
      ["caught", "Does someone hear them", ["alone", "overheard", "caught and stops", "others join in"], "Whether anyone else is part of it.", U],
      ["moodMatch", "Matches how they really feel", ["hides the opposite", "a little off", "matches"], "Whether the tune fits their real mood or covers it."],
    ],
    [1, "Can carry a tune into the next scene, or let slip a hidden mood.", "Shows what a character holds on to when nobody is watching.", "We want to know why they chose that song.", "audio", "Have the killer hum a children's song while tidying up."]);

  c("onScreenPerformance", "A song performed in the story", "music",
    "Someone in the story performs music for others: a band at a wedding, karaoke, a concert, a school show, or characters bursting into song as in a musical.",
    [
      ["spotlight", "How much the scene stops for it", ["in the background", "shares the scene", "takes over the scene", "the whole film stops"], "How much of the scene's attention the performance takes."],
      ["kind", "What kind of performance", ["a gig or concert", "karaoke", "a party", "a school show", "bursting into song"], "Where and how the music is performed.", U],
      ["performers", "How many perform", [1, 40], "How many people are singing or playing."],
      ["quality", "How good it is", ["a disaster", "shaky", "good", "stunning"], "How well the performance goes."],
      ["audience", "How the crowd takes it", ["ignores it", "polite", "into it", "going wild"], "How the people watching react."],
      ["liveSound", "Rough or polished sound", ["rough live sound", "live but clean", "studio polished"], "Whether it sounds recorded in the room or cleaned up in a studio."],
    ],
    [2, "A performance is often a test: the character risks being seen.", "Shows who a character is when they are brave enough to perform.", "We hold our breath to see if they pull it off.", "audio", "Make the shy character sing at karaoke, badly, then let the crowd join in."]);

  c("tensionLoop", "Repeating notes that build tension", "music",
    "A short pattern of notes or a rhythm repeats over and over under a scene, so the tension climbs even when nothing happens. Musicians call it an ostinato (a stubborn repeat).",
    [
      ["insistence", "How insistent", [0, 5], "How hard the repeat pushes on us."],
      ["madeOf", "What it is made of", ["a few notes", "a low pulse", "a ticking", "a drum", "a heartbeat"], "What sound the pattern is built from.", U],
      ["repeats", "Times it repeats", [2, 64], "How many times the pattern goes round."],
      ["grows", "How it grows", ["stays the same", "adds layers", "gets louder", "gets faster", "all of these"], "How the repeat builds as it goes."],
      ["pitch", "High or low", ["very low", "low", "middle", "high"], "Low feels like a threat in your stomach; high feels like nerves."],
      ["breaks", "How it ends", ["stops dead", "settles", "crashes into a hit", "just keeps going"], "What happens when the pattern finally ends.", U],
    ],
    [3, "Holds a scene under pressure until the plot breaks it open.", "Shows something that cannot be stopped: time, a hunter, a deadline.", "We wait, tense, for the pattern to break.", "audio", "Put a four-note repeat under the bomb defusing and add one instrument every time the wire is touched."]);

  c("bigHit", "Music lands on the moment", "music",
    "The music builds and lands its biggest note exactly on one moment: a cut, a punch, a kiss, a reveal. A crescendo (music getting louder and fuller) aimed at a single frame.",
    [
      ["impact", "How big the landing", [0, 5], "How hard the biggest note hits."],
      ["target", "What it lands on", ["a cut", "an action", "a line", "a reveal", "a title"], "The moment the music is aimed at.", U],
      ["buildTime", "How long it builds", [0, 60, "seconds"], "Seconds of build before the hit."],
      ["accuracy", "How exact the timing", ["roughly", "near", "on the moment", "to the frame"], "How precisely the hit lines up with the moment."],
      ["after", "What follows the hit", ["silence", "it holds", "it falls away", "it keeps going"], "What the music does right after it lands.", U],
      ["fakeOuts", "Fake landings first", [0, 3], "How many times it seems about to land and then does not."],
    ],
    [4, "Turns one moment into the turning point of the scene.", "Tells us this exact instant is what the scene was about.", "The build makes us lean toward the moment; the hit drops us into what follows.", "audio", "Build the score for 20 seconds and land the biggest chord on the cut to the reveal."]);

  c("clashingNotes", "Sweet or clashing notes", "music",
    "Whether the notes sit sweetly together or rub against each other. Clashing notes (musicians say dissonant) sound tense, wrong or scary; sweet ones sound calm and settled.",
    [
      ["clash", "How much the notes clash", [0, 5], "From sweet and calm (0) to harsh and grinding (5)."],
      ["resolves", "Does it settle", ["never settles", "settles late", "settles soon", "always settled"], "Whether the clash turns sweet again, and when."],
      ["where", "Where the clash sits", ["deep and low", "in the middle", "high and thin", "everywhere"], "Which part of the sound the clash lives in.", U],
      ["grows", "How the clash grows", ["fades", "holds", "creeps up", "jumps"], "Whether it eases off or gets worse."],
      ["sweetOnTop", "Sweet tune on top", ["none", "a hint", "clear"], "Whether a sweet tune still plays over the clash, so beauty and wrongness sit together."],
      ["timing", "When it clashes", ["the whole scene", "under one line", "only at the turn"], "How much of the scene carries the clash."],
    ],
    [2, "Clashing notes warn us something is wrong before the story says so.", "Shows a world out of tune with itself.", "The clash makes us wait, uneasy, for it to settle.", "audio", "Let the warm family tune slip one note out of place when the stranger arrives."]);

  c("warpedMusic", "Bent or broken music", "music",
    "Music that sounds damaged: slowed down, wobbling like an old tape, out of tune like a forgotten piano, a music box winding down. It makes the familiar feel wrong, dreamy or creepy.",
    [
      ["warp", "How warped", [0, 5], "How damaged the music sounds."],
      ["damage", "What is wrong with it", ["slowed down", "wobbling like old tape", "out of tune", "skipping", "winding down", "played backwards"], "The kind of damage.", U],
      ["source", "What is being warped", ["a lullaby", "a pop song", "the film's theme", "a music box", "a hymn"], "The music that gets bent.", U],
      ["speed", "Slower or faster", [-50, 50, "%"], "How much slower (minus) or faster (plus) than normal it plays."],
      ["crackle", "Hiss and crackle", [0, 5], "How much old-record crackle and tape hiss sits on it."],
      ["why", "Why it is warped", ["a dream", "a memory", "someone losing their grip", "something evil", "no reason given"], "What the damage stands for.", U],
    ],
    [2, "Signals that we have slipped into a dream, a memory or a mind coming apart.", "Shows how a sweet past can turn sour.", "We want to know what broke the music.", "audio", "Take the happy song from the start of the film and play it 30% slower in the hospital scene."]);

  c("musicSpotting", "Where the music goes", "music",
    "The plan for which scenes get music and which do not, across the whole film. Some films play music almost all the time; others save it for a few big moments.",
    [
      ["share", "Share of the film with music", [0, 100, "%"], "How much of the running time has music."],
      ["cues", "Number of music pieces", [0, 80], "How many separate pieces of music the film uses."],
      ["saved", "Saved for the big moments", [0, 5], "How much the music is held back for the moments that matter most."],
      ["firstIn", "When the music first comes in", ["at the first frame", "in the first scene", "after a while", "only near the end"], "How long the film waits before its first music."],
      ["longestGap", "Longest stretch without music", [0, 30, "minutes"], "The longest time the film goes with no music."],
      ["spread", "How it is spread", ["evenly", "in bursts", "building toward the end", "fading toward the end"], "The shape of the music across the film.", U],
    ],
    [2, "Holding music back makes the moments that get it feel like turning points.", "How much music a film uses says how much it tells us what to feel.", "When the music finally comes, we know something matters.", "audio", "Use no music for the first 20 minutes, then bring it in on the first real turn."]);

  c("musicPointOfView", "Whose feeling the music plays", "music",
    "Music can play what one person feels inside, not what the scene looks like. A calm dinner can carry panicked music because the hero is panicking.",
    [
      ["inside", "How far inside one person", [0, 5], "From the mood of the room (0) to one person's private feeling (5)."],
      ["whose", "Whose feeling", ["the hero", "the villain", "a side character", "the crowd", "nobody, the scene itself"], "Whose inner world the music plays.", U],
      ["gap", "Gap from what we see", ["matches what we see", "a little different", "very different", "the opposite"], "How far the music's feeling is from what the picture shows."],
      ["switches", "Jumps between people", [0, 6], "How many times the music jumps from one person's feeling to another's."],
      ["shared", "Others feel it too", ["no one", "one person", "everyone"], "Whether the feeling spreads to others in the scene."],
      ["revealed", "When we learn whose it is", ["right away", "partway in", "at the end"], "How soon we know whose feeling we are hearing."],
    ],
    [2, "Lets us know what a character feels without them saying it, which sets up their next move.", "Shows the gap between the inside and the outside of a person.", "We feel what they feel and wait for it to show on their face.", "audio", "Play racing music over the polite job interview so we hear the hero's panic."]);

  c("musicWarning", "Music warns us early", "music",
    "The music tells us danger, love or a twist is coming before the characters know. Think of two low notes before the shark appears.",
    [
      ["lead", "How far ahead it warns", [0, 60, "seconds"], "Seconds between the warning and the thing it warns of."],
      ["clarity", "How clear the warning", ["a faint hint", "noticeable", "obvious", "unmistakable"], "How easy the warning is to read."],
      ["what", "What it warns of", ["danger", "a death", "love", "a twist", "a joke"], "What the music says is on its way.", U],
      ["payoff", "Does it come true", ["false alarm", "comes true later", "comes true right away", "worse than warned"], "What happens after the warning.", U],
      ["warnings", "Warnings before it comes", [1, 8], "How many times the warning sounds before the thing arrives."],
      ["heard", "Do the characters hear it", ["no", "maybe", "yes, in the story"], "Whether the warning is in their world too."],
    ],
    [3, "Plants a promise that the story must keep or break.", "Shows fate: what is coming is already on its way.", "We know more than the characters and dread, or long for, the moment it comes.", "audio", "Bring in the danger notes twice with nothing happening, then a third time with the attack."]);

  c("wrongEraMusic", "Music from another time", "music",
    "Music that does not belong to the story's time: a rock song in a tale of knights, old jazz in a space film. It makes an old story feel fresh, or a new one feel timeless.",
    [
      ["gap", "How far off the time", [0, 5], "How far the music's era is from the story's."],
      ["direction", "Older or newer", ["much older", "older", "newer", "much newer"], "Whether the music comes from before or after the story's time."],
      ["use", "How it is used", ["the soundtrack", "played in the story", "the characters sing it", "a cover in the old style"], "Where the out-of-time music lives.", U],
      ["dressedUp", "Dressed up for the period", ["played as is", "slightly dressed up", "fully rearranged"], "Whether a modern song is replayed on old instruments so it half fits."],
      ["normal", "Characters act like it's normal", ["no, they notice", "they barely notice", "totally normal"], "Whether anyone in the story finds it strange."],
      ["howOften", "How often", ["once", "now and then", "the whole film"], "How much of the film does this."],
    ],
    [1, "Mostly sets the tone, but can mark a character as ahead of their time.", "Says the old story is really about now.", "We smile at the surprise and wonder what else the film will bend.", "audio", "Put a punk song under the royal ball and let the court dance to it."]);

  c("titleMusic", "Title music", "music",
    "The music over the opening titles and the end credits. It sets the tone in the first minute and leaves the last feeling as we walk out.",
    [
      ["weight", "How big the title music is", [0, 5], "How much the title music announces itself."],
      ["where", "Where it plays", ["opening only", "closing only", "both", "both, the same tune"], "Whether it opens the film, closes it, or both.", U],
      ["length", "Length", [10, 300, "seconds"], "How long the title music runs."],
      ["tone", "Tone it sets", ["dark", "uneasy", "calm", "warm", "playful", "grand"], "The mood it promises.", U],
      ["words", "Words or no words", ["no words", "a wordless voice", "a song with words"], "Whether someone sings, and whether we hear words."],
      ["tieIn", "Comes back in the film", ["never", "hinted", "the main theme"], "Whether the title tune returns inside the story."],
    ],
    [1, "Makes the film's promise before the story starts.", "Often carries the main theme in its purest form.", "A strong opening tune makes us settle in for the ride.", "audio", "Play your main theme over the opening title, then hold it back until the last scene."]);

  c("soundsBecomeMusic", "Everyday sounds turn into music", "music",
    "Real sounds in the scene (typing, a dripping tap, footsteps, a train) fall into a rhythm and become part of the music.",
    [
      ["blend", "How musical the sounds get", [0, 5], "From plain sounds (0) to sounds that are the music (5)."],
      ["sounds", "Which sounds", ["footsteps", "machines", "kitchen sounds", "nature", "voices", "a clock"], "The everyday sounds that turn musical.", U],
      ["onBeat", "Locked to the beat", ["loose", "near the beat", "on the beat"], "How tightly the sounds line up with a beat."],
      ["count", "Different sounds used", [1, 10], "How many different everyday sounds join in."],
      ["handoff", "Music takes over", ["sounds stay alone", "music joins them", "music takes over"], "Whether real music joins or replaces them."],
      ["moveWith", "Characters move to it", ["no", "a little", "they move with it"], "Whether the people in the scene fall into the rhythm too."],
    ],
    [1, "Turns a routine or a job into a rhythm that carries a montage.", "Shows a world where everything has a pulse, or a habit taking over a life.", "We start listening for the next sound to land on the beat.", "audio", "Let the coffee shop sounds (grinder, steam, cups) fall into a beat before the song starts."]);

  /* ---------- new audio-mix curiosities ---------- */

  c("foley", "Handmade sounds", "audio-mix",
    "Everyday sounds of people and things (footsteps, clothes rustling, a cup set down) recorded by hand after filming and laid in to match the picture. Film crews call it foley, after Jack Foley, who started it.",
    [
      ["detail", "How much is heard", [0, 5], "How many of the small sounds of bodies and things we hear."],
      ["focus", "What gets the sound", ["footsteps", "clothes", "hands and props", "bodies and hits", "everything"], "Which small sounds are singled out.", U],
      ["loud", "Loudness next to life", ["quieter than life", "true to life", "heightened", "exaggerated"], "Whether the sounds are real-sized or pushed bigger."],
      ["surface", "What they walk on", ["carpet", "wood", "stone", "gravel", "snow", "wet street"], "The ground the footsteps sound like.", U],
      ["sync", "How exactly it matches", ["loose", "close", "to the frame"], "How tightly each sound lands on what we see."],
      ["texture", "Clean or gritty", ["clean", "natural", "gritty", "squelchy"], "The grain of the sounds."],
    ],
    [1, "Footsteps and small sounds tell us where people are and what they handle, even off screen.", "Close, heightened sounds make a world feel physical and near.", "A footstep we hear but cannot see pulls our eyes around the frame.", "audio", "Turn up the footsteps in the empty corridor until each one sounds like a knock."],
    { also: ["music"] });

  c("ambienceBed", "Background sound of the place", "audio-mix",
    "The steady sound of a place that sits under everything: traffic outside, birds, a fridge hum, the quiet buzz every room has (sound crews call it room tone). It tells us where we are without a word.",
    [
      ["presence", "How present it is", [0, 5], "How much we notice the background sound."],
      ["place", "What kind of place", ["a city", "nature", "indoors", "a crowd", "machines", "the sea"], "What the background sounds like.", U],
      ["alive", "How much is happening in it", ["one steady hum", "a few sounds", "lively", "teeming"], "How many separate things we can hear in it."],
      ["reacts", "Reacts to the mood", ["never", "a little", "goes quiet when tense", "follows every mood"], "Whether the background changes with the feeling of the scene."],
      ["timeOfDay", "Tells the time of day", ["no", "a hint", "clearly"], "Whether it tells us morning (birds) or night (crickets)."],
      ["steady", "Holds across cuts", ["changes with every shot", "mostly steady", "perfectly steady"], "Whether it stays the same when the picture cuts, so the place feels whole."],
    ],
    [1, "A sudden change in the background warns that something has arrived.", "The sound of a place says what kind of world the characters live in.", "When the birds stop, we look for why.", "audio", "Let the crickets stop one beat before the stranger steps out of the dark."],
    { also: ["music"] });

  c("subjectiveSound", "Hearing through their ears", "audio-mix",
    "The sound changes to match what one character hears: muffled after an explosion, a ringing in the ears, voices fading as they faint, one voice clear in a noisy room.",
    [
      ["how", "How much we hear like them", [0, 5], "From the normal mix (0) to fully inside their ears (5)."],
      ["kind", "What happens to the sound", ["muffled", "ringing ears", "underwater", "one sound in focus", "heartbeat and breath", "fading out"], "How the sound is bent.", U],
      ["cause", "What causes it", ["a blast", "shock", "falling for someone", "a drug or drink", "fainting", "daydreaming"], "Why they hear the world this way.", U],
      ["lasts", "How long it lasts", [0, 60, "seconds"], "Seconds before the normal sound returns."],
      ["comeBack", "How the world comes back", ["snaps back", "floods back", "creeps back", "never fully"], "How the normal sound returns."],
      ["leftOver", "Outside sound left", ["none", "faint", "half", "most"], "How much of the real world's sound still gets through."],
    ],
    [2, "Puts us inside a character at the moment the story hits them hardest.", "Shows how shock, or love, shuts the world out.", "We strain to hear, as they do, and wait for the world to come back.", "audio", "After the blast, cut all sound to a high ring and muffled voices for ten seconds."],
    { also: ["music"] });

  c("placeEcho", "Echo of the place", "audio-mix",
    "How much a place echoes: a church or a stairwell rings on, a small car sounds dry and close. Echo (sound crews call it reverb) tells us the size of a place and can make a moment feel huge, empty or dreamlike.",
    [
      ["echo", "How much echo", [0, 5], "From dry and close (0) to ringing on and on (5)."],
      ["size", "Size of the place it suggests", ["a closet", "a room", "a hall", "a cathedral", "a canyon"], "How big the echo makes the place sound."],
      ["on", "What echoes", ["voices", "footsteps", "music", "everything"], "Which sounds get the echo.", U],
      ["tail", "How long the echo rings", [0, 8, "seconds", 0.5], "Seconds a sound keeps ringing after it stops."],
      ["truth", "True to the place", ["true to what we see", "a little bigger", "far bigger than the place"], "Whether the echo matches the room we see, or is bent for feeling."],
      ["surfaces", "Hard or soft surfaces", ["soft and padded", "mixed", "hard stone and glass"], "Soft rooms sound warm and dull; hard rooms sound bright and sharp."],
    ],
    [1, "A change in echo can move us from the real room into a memory or a dream.", "Big echo can make someone feel small and alone; dry sound feels close and honest.", "A voice ringing in an empty hall makes us feel the space around it.", "audio", "Give the lonely character's footsteps a long echo in a room that should be small."],
    { also: ["music"] });

  /* ---------- suites ---------- */

  S("hero-theme-returns", "The hero's theme returns", "music",
    "The hero's tune comes back played big on brass, the music turns from dark to bright, speeds up, and lands its biggest note on the moment.",
    [
      { curiosity: "characterTheme", value: 5 },
      { curiosity: "characterTheme", slider: "version", value: "heroic" },
      { curiosity: "keyShift", value: "dark turns bright" },
      { curiosity: "leadInstrument", slider: "instrument", value: "brass", weight: 70 },
      { curiosity: "bigHit", value: 4 },
      { curiosity: "tempoShift", value: "speeds a little", weight: 60 },
    ]);

  S("horror-score", "Horror score", "music",
    "A stubborn repeat under the scene, clashing notes that never settle, a warning that comes too clearly, broken music, and fake landings before the real scare.",
    [
      { curiosity: "tensionLoop", value: 4 },
      { curiosity: "clashingNotes", value: 4 },
      { curiosity: "clashingNotes", slider: "resolves", value: "never settles", weight: 70 },
      { curiosity: "musicWarning", slider: "clarity", value: "obvious" },
      { curiosity: "warpedMusic", value: 3, weight: 70 },
      { curiosity: "bigHit", slider: "fakeOuts", value: 2, weight: 80 },
    ]);

  S("creepy-lullaby", "Creepy lullaby", "music",
    "A child's tune hummed under the breath, then played back slow and out of tune, with the notes rubbing against each other.",
    [
      { curiosity: "humming", value: "quiet humming" },
      { curiosity: "humming", slider: "known", value: "a lullaby or folk tune" },
      { curiosity: "warpedMusic", slider: "source", value: "a lullaby" },
      { curiosity: "warpedMusic", value: 3 },
      { curiosity: "clashingNotes", value: 3, weight: 70 },
    ]);

  S("old-story-new-songs", "Old story, new songs", "music",
    "A period story full of much newer music that starts on a radio or a stage and swells into the soundtrack, in a style nobody expected.",
    [
      { curiosity: "wrongEraMusic", value: 4 },
      { curiosity: "wrongEraMusic", slider: "direction", value: "much newer" },
      { curiosity: "musicStyle", value: "unexpected" },
      { curiosity: "sourceToScore", value: "from the room into the soundtrack", weight: 70 },
      { curiosity: "music", slider: "familiarity", value: "famous", weight: 70 },
    ]);

  S("musical-number", "Musical number", "music",
    "Characters burst into song, the song grows from the room into the full soundtrack, everyday sounds join the beat and every step lands on it.",
    [
      { curiosity: "onScreenPerformance", value: "takes over the scene" },
      { curiosity: "onScreenPerformance", slider: "kind", value: "bursting into song" },
      { curiosity: "sourceToScore", value: "from the room into the soundtrack" },
      { curiosity: "soundsBecomeMusic", value: 3, weight: 80 },
      { curiosity: "foley", slider: "sync", value: "to the frame", weight: 60 },
    ]);

  S("race-against-the-clock", "Race against the clock", "music",
    "A ticking repeat under everything, the music speeding up shot by shot, the clock's tick turning into the beat, and one huge note on the last second.",
    [
      { curiosity: "tensionLoop", slider: "madeOf", value: "a ticking" },
      { curiosity: "tensionLoop", value: 5 },
      { curiosity: "tempoShift", value: "speeds a lot" },
      { curiosity: "soundsBecomeMusic", slider: "sounds", value: "a clock", weight: 60 },
      { curiosity: "bigHit", value: 5 },
    ]);

  S("inside-their-head", "Inside their head", "audio-mix",
    "The music plays one person's private feeling, the sound bends to what they hear, rooms echo bigger than they are, and familiar music warps.",
    [
      { curiosity: "musicPointOfView", value: 4 },
      { curiosity: "subjectiveSound", value: 4 },
      { curiosity: "placeEcho", value: 3, weight: 80 },
      { curiosity: "placeEcho", slider: "truth", value: "far bigger than the place", weight: 60 },
      { curiosity: "warpedMusic", value: 2, weight: 60 },
    ], { also: ["music"] });

  S("spare-and-honest", "Spare and honest", "music",
    "Very little music, saved for the biggest moments and played on one piano; the rest is the real sound of the place and of people's hands and feet.",
    [
      { curiosity: "musicSpotting", value: 15 },
      { curiosity: "musicSpotting", slider: "saved", value: 5 },
      { curiosity: "leadInstrument", slider: "instrument", value: "piano", weight: 70 },
      { curiosity: "leadInstrument", slider: "solo", value: "alone", weight: 70 },
      { curiosity: "ambienceBed", value: 3 },
      { curiosity: "foley", value: 3, weight: 70 },
    ]);

  S("grand-overture", "Grand opening", "music",
    "Big orchestral title music that plays the main theme in full, with strings in front, so the theme is ours before the story starts.",
    [
      { curiosity: "titleMusic", value: 5 },
      { curiosity: "titleMusic", slider: "tieIn", value: "the main theme" },
      { curiosity: "musicStyle", slider: "style", value: "orchestral" },
      { curiosity: "characterTheme", value: 4, weight: 80 },
      { curiosity: "leadInstrument", slider: "instrument", value: "strings", weight: 60 },
    ]);

  S("love-theme", "Love theme", "music",
    "A tune that belongs to the couple, played tenderly on a close, gentle instrument, playing what one of them feels inside.",
    [
      { curiosity: "characterTheme", slider: "belongsTo", value: "a couple" },
      { curiosity: "characterTheme", slider: "version", value: "tender" },
      { curiosity: "leadInstrument", slider: "closeness", value: "right in your ear" },
      { curiosity: "leadInstrument", slider: "touch", value: "gentle", weight: 70 },
      { curiosity: "musicPointOfView", value: 3, weight: 70 },
    ]);

  S("handmade-sound-world", "Handmade sound world", "audio-mix",
    "Every footstep and cup is there, the place hums and chirps around the people, rooms echo as they should, and now and then the sounds fall into a beat.",
    [
      { curiosity: "foley", value: 4 },
      { curiosity: "ambienceBed", value: 4 },
      { curiosity: "ambienceBed", slider: "alive", value: "lively", weight: 70 },
      { curiosity: "placeEcho", slider: "truth", value: "true to what we see", weight: 70 },
      { curiosity: "soundDesign", value: "busy", weight: 60 },
      { curiosity: "soundsBecomeMusic", value: 2, weight: 50 },
    ], { also: ["music"] });

  S("shell-shocked", "Shell-shocked", "audio-mix",
    "After the blast the world turns to a high ring, the background falls silent, the echo swallows what is left, and the sound creeps back slowly.",
    [
      { curiosity: "subjectiveSound", slider: "kind", value: "ringing ears" },
      { curiosity: "subjectiveSound", value: 5 },
      { curiosity: "subjectiveSound", slider: "comeBack", value: "creeps back", weight: 70 },
      { curiosity: "ambienceBed", slider: "reacts", value: "goes quiet when tense" },
      { curiosity: "noMusic", slider: "fill", value: "true silence", weight: 70 },
      { curiosity: "placeEcho", value: 4, weight: 50 },
    ]);

  /* ---------- proximities ---------- */

  P("loop-speeds-up", "When the repeating notes grow insistent, the music speeds up", "music",
    "When a repeating pattern pushes harder, the beat starts to quicken within 4 beats.",
    { curiosity: "tensionLoop", change: "rises" }, { curiosity: "tempoShift", change: "rises" }, 4);
  P("loop-breaks-into-hit", "When the repeating notes crash to an end, the music lands on the moment", "music",
    "When the stubborn repeat breaks by crashing, a big hit lands within a beat.",
    { curiosity: "tensionLoop", slider: "breaks", is: "crashes into a hit" }, { curiosity: "bigHit", change: "rises" }, 1);
  P("tempo-up-faster-cuts", "When the music speeds up a lot, the cuts come faster", "music",
    "When the music races, the edit changes angle more often within 2 beats.",
    { curiosity: "tempoShift", is: "speeds a lot" }, { curiosity: "cutRate", change: "rises" }, 2);
  P("tempo-down-longer-holds", "When the music slows right down, the shots hold longer", "music",
    "When the music slows a lot, each shot stays on screen longer within 2 beats.",
    { curiosity: "tempoShift", is: "slows a lot" }, { curiosity: "shotDuration", change: "rises" }, 2);
  P("dark-to-bright-hope", "When the music turns from dark to bright, hope rises", "music",
    "When the sad-sounding music turns bright, the characters' hope climbs within 2 beats.",
    { curiosity: "keyShift", is: "dark turns bright" }, { curiosity: "hope", change: "rises" }, 2, { also: ["emo-road"] });
  P("bright-to-dark-dread", "When the music turns from bright to dark, dread creeps in", "music",
    "When bright music turns dark, a sense that something bad is coming grows within 3 beats.",
    { curiosity: "keyShift", is: "bright turns dark" }, { curiosity: "dread", change: "rises" }, 3, { also: ["emo-road"] });
  P("heroic-theme-pride", "When the character's tune is played heroic, pride swells", "music",
    "When a character's own tune comes back in its heroic version, pride rises within 2 beats.",
    { curiosity: "characterTheme", slider: "version", is: "heroic" }, { curiosity: "pride", change: "rises" }, 2);
  P("missed-theme-grief", "When a tune plays for someone who is missed, grief rises", "music",
    "When a character's tune plays because they are gone, grief grows within 3 beats.",
    { curiosity: "characterTheme", slider: "trigger", is: "they are missed" }, { curiosity: "grief", change: "rises" }, 3, { also: ["emo-road"] });
  P("theme-warns-arrival", "When a tune plays just before its owner arrives, the music is warning us", "music",
    "When a character's tune starts before they enter, the music's early warning grows within 2 beats.",
    { curiosity: "characterTheme", slider: "trigger", is: "they are about to arrive" }, { curiosity: "musicWarning", change: "rises" }, 2);
  P("warning-brings-dread", "When the music warns us early, dread builds", "music",
    "When the music warns of something further ahead, dread rises within 3 beats.",
    { curiosity: "musicWarning", change: "rises" }, { curiosity: "dread", change: "rises" }, 3);
  P("false-alarm-release", "When the music's warning is a false alarm, the release comes", "music",
    "When the warned-of danger never comes, the audience lets out a breath within 2 beats.",
    { curiosity: "musicWarning", slider: "payoff", is: "false alarm" }, { curiosity: "emoRelease", slider: "size", change: "rises" }, 2);
  P("clash-raises-tension", "When the notes clash more, the tension rises", "music",
    "When the notes rub harder against each other, the scene's tension rises within 2 beats.",
    { curiosity: "clashingNotes", change: "rises" }, { curiosity: "tensionCurve", change: "rises" }, 2);
  P("clash-settles-release", "When the clashing notes settle, the release comes", "music",
    "When the clash eases into sweet notes, the audience relaxes within 2 beats.",
    { curiosity: "clashingNotes", change: "drops" }, { curiosity: "emoRelease", slider: "size", change: "rises" }, 2);
  P("warped-memory-nostalgia", "When the music warps into a memory, nostalgia comes with it", "music",
    "When bent, crackling music stands for a memory, longing for the past rises within 2 beats.",
    { curiosity: "warpedMusic", slider: "why", is: "a memory" }, { curiosity: "nostalgia", change: "rises" }, 2);
  P("warped-music-echoes", "When the music warps, the place starts to echo", "music",
    "When the music bends out of shape, the sound of the place rings on more within 2 beats.",
    { curiosity: "warpedMusic", change: "rises" }, { curiosity: "placeEcho", change: "rises" }, 2, { also: ["audio-mix"] });
  P("humming-others-join-warmth", "When others join the humming, warmth grows", "music",
    "When someone's private tune is picked up by the others, warmth between them grows within 2 beats.",
    { curiosity: "humming", slider: "caught", is: "others join in" }, { curiosity: "warmth", change: "rises" }, 2);
  P("hummed-theme-returns", "When a character hums the film's own theme, the theme comes back", "music",
    "When the tune someone hums is the film's theme, the soundtrack picks it up within 3 beats.",
    { curiosity: "humming", slider: "known", is: "the film's own theme" }, { curiosity: "characterTheme", change: "rises" }, 3);
  P("performance-crowd-pride", "When the crowd goes wild for a performance, pride rises", "music",
    "When the audience in the story loves the performance, the performer's pride climbs within a beat.",
    { curiosity: "onScreenPerformance", slider: "audience", is: "going wild" }, { curiosity: "pride", change: "rises" }, 1);
  P("performance-grows-into-score", "When a performance takes over the scene, the music crosses into the soundtrack", "music",
    "When a song in the story takes the spotlight, it swells into the film's own soundtrack within 3 beats.",
    { curiosity: "onScreenPerformance", is: "takes over the scene" }, { curiosity: "sourceToScore", is: "from the room into the soundtrack" }, 3);
  P("crossover-music-rises", "When room music crosses into the soundtrack, the music comes forward", "music",
    "When music from inside the story becomes the soundtrack, it grows louder and fuller within 2 beats.",
    { curiosity: "sourceToScore", is: "from the room into the soundtrack" }, { curiosity: "music", change: "rises" }, 2);
  P("saved-music-hits-harder", "When the music is saved for the big moments, it lands harder", "music",
    "When a film holds its music back, the moment it finally arrives hits harder within 8 beats.",
    { curiosity: "musicSpotting", slider: "saved", change: "rises" }, { curiosity: "bigHit", change: "rises" }, 8);
  P("less-music-more-silence", "When less of the film has music, the silences grow", "music",
    "When the share of the film with music drops, the stretches with no music get longer within 4 beats.",
    { curiosity: "musicSpotting", change: "drops" }, { curiosity: "noMusic", change: "rises" }, 4);
  P("inner-music-empathy", "When the music plays one person's inner feeling, we feel with them", "music",
    "When the music moves inside one character, the audience feels what they feel within 2 beats.",
    { curiosity: "musicPointOfView", change: "rises" }, { curiosity: "empathy", change: "rises" }, 2, { also: ["emotion"] });
  P("inner-music-their-ears", "When the music moves inside a character, we start to hear through their ears", "music",
    "When the music plays one person's feeling, the sound itself bends to what they hear within 2 beats.",
    { curiosity: "musicPointOfView", change: "rises" }, { curiosity: "subjectiveSound", change: "rises" }, 2, { also: ["audio-mix"] });
  P("ringing-ears-world-hushes", "When the ears ring, the background falls away", "audio-mix",
    "When we hear a character's ringing ears, the background sound of the place drops within a beat.",
    { curiosity: "subjectiveSound", slider: "kind", is: "ringing ears" }, { curiosity: "ambienceBed", change: "drops" }, 1);
  P("dread-hushes-the-place", "When dread builds, the background sound goes quiet", "audio-mix",
    "When something bad feels near, the birds and traffic fall quiet within 2 beats.",
    { curiosity: "dread", change: "rises" }, { curiosity: "ambienceBed", change: "drops" }, 2, { also: ["emo-road"] });
  P("exaggerated-foley-cartoon", "When the handmade sounds are exaggerated, the sound turns cartoony", "audio-mix",
    "When footsteps and hits are pushed far past real life, the whole sound world turns cartoon within 2 beats.",
    { curiosity: "foley", slider: "loud", is: "exaggerated" }, { curiosity: "soundDesign", slider: "realism", is: "cartoon" }, 2, { also: ["music"] });
  P("footsteps-pull-off-screen", "When the footsteps are singled out, we listen beyond the frame", "audio-mix",
    "When footsteps get the sound, more of what we hear comes from outside the frame within 2 beats.",
    { curiosity: "foley", slider: "focus", is: "footsteps" }, { curiosity: "soundDesign", slider: "offscreen", change: "rises" }, 2, { also: ["music"] });
  P("echo-brings-loneliness", "When the place echoes more, loneliness grows", "audio-mix",
    "When a voice or step rings on in an empty space, the character feels more alone within 2 beats.",
    { curiosity: "placeEcho", change: "rises" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("cathedral-echo-awe", "When the echo sounds like a cathedral, awe rises", "audio-mix",
    "When the echo suggests a huge space, the audience feels small and amazed within 2 beats.",
    { curiosity: "placeEcho", slider: "size", is: "a cathedral" }, { curiosity: "awe", change: "rises" }, 2, { also: ["emotion"] });
  P("style-clash-fights-scene", "When the style of music clashes on purpose, the music fights the scene", "music",
    "When the music's style is chosen to clash with the world, it plays against the scene within a beat.",
    { curiosity: "musicStyle", is: "clashes on purpose" }, { curiosity: "music", slider: "counterpoint", is: "opposite" }, 1);
  P("wrong-era-sung-on-stage", "When characters sing music from another time, a performance takes over", "music",
    "When the out-of-time song is sung by the characters, a performance in the story rises within 2 beats.",
    { curiosity: "wrongEraMusic", slider: "use", is: "the characters sing it" }, { curiosity: "onScreenPerformance", change: "rises" }, 2);
  P("title-theme-comes-back", "When the title music carries the main theme, the theme becomes easy to recognise", "music",
    "When the opening music is the main theme, later returns of the theme are recognised at once within 8 beats.",
    { curiosity: "titleMusic", slider: "tieIn", is: "the main theme" }, { curiosity: "characterTheme", change: "rises" }, 8);
  P("end-music-aftertaste", "When the closing music is big, the feeling stays after the film", "music",
    "When the end credits music grows, the feeling we leave with grows stronger within 4 beats.",
    { curiosity: "titleMusic", change: "rises" }, { curiosity: "filmAftertaste", change: "rises" }, 4, { also: ["emo-road"] });
  P("lone-instrument-loneliness", "When one instrument plays alone, loneliness grows", "music",
    "When the lead instrument plays with nobody joining, the scene feels lonelier within 2 beats.",
    { curiosity: "leadInstrument", slider: "solo", is: "alone" }, { curiosity: "loneliness", change: "rises" }, 2, { also: ["emo-road"] });
  P("close-instrument-tenderness", "When the instrument sounds right in your ear, tenderness grows", "music",
    "When the lead instrument sounds close enough to hear the fingers, the scene turns tender within 2 beats.",
    { curiosity: "leadInstrument", slider: "closeness", is: "right in your ear" }, { curiosity: "tenderness", change: "rises" }, 2, { also: ["emotion"] });
  P("sounds-into-beat-cuts", "When everyday sounds fall into a beat, the cuts land on it", "music",
    "When the scene's real sounds become music, the edit starts cutting to that beat within 2 beats.",
    { curiosity: "soundsBecomeMusic", change: "rises" }, { curiosity: "beatSync", change: "rises" }, 2);
  P("hit-feeling-peaks", "When the music lands big on the moment, the feeling peaks", "music",
    "When the music's biggest note hits, the feeling of the scene peaks within a beat.",
    { curiosity: "bigHit", change: "rises" }, { curiosity: "emotionIntensity", change: "rises" }, 1, { also: ["emotion"] });
  P("hit-then-silence", "When the big hit is followed by silence, the music drops out", "music",
    "When the music lands and then stops, a stretch with no music follows within a beat.",
    { curiosity: "bigHit", slider: "after", is: "silence" }, { curiosity: "noMusic", change: "rises" }, 1);

  /* ---------- proximity suites ---------- */

  PS("the-clock-runs-out", "The clock runs out", "music",
    "The repeating notes push harder, the music speeds up, the cuts come faster, the pattern crashes into a big hit, and then silence.",
    ["loop-speeds-up", "tempo-up-faster-cuts", "loop-breaks-into-hit", "hit-then-silence"]);
  PS("something-is-coming", "Something is coming", "music",
    "The music warns us early, the bright tune turns dark, the notes start to clash, dread builds and the place itself goes quiet.",
    ["warning-brings-dread", "bright-to-dark-dread", "clash-raises-tension", "dread-hushes-the-place"]);
  PS("the-world-goes-quiet", "The world goes quiet", "audio-mix",
    "The music moves inside one person, we start to hear through their ears, the background falls away, and the echo leaves them alone.",
    ["inner-music-empathy", "inner-music-their-ears", "ringing-ears-world-hushes", "echo-brings-loneliness"], { also: ["music"] });
  PS("from-the-room-to-the-soundtrack", "From the room to the soundtrack", "music",
    "Someone hums the theme, a performance takes over, the song crosses into the soundtrack and comes forward, and the crowd's joy becomes pride.",
    ["hummed-theme-returns", "performance-grows-into-score", "crossover-music-rises", "performance-crowd-pride"]);
  PS("the-theme-comes-home", "The theme comes home", "music",
    "The title music plants the theme, it plays for someone missed, the music turns from dark to bright, and the theme comes back heroic.",
    ["title-theme-comes-back", "missed-theme-grief", "dark-to-bright-hope", "heroic-theme-pride"]);
  PS("saving-it-for-the-end", "Saving it for the end", "music",
    "Less music means longer silences, so when the saved music finally lands on the moment, the feeling peaks and stays after the film.",
    ["less-music-more-silence", "saved-music-hits-harder", "hit-feeling-peaks", "end-music-aftertaste"]);
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
