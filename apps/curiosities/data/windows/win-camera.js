/* Camera: a window for every curiosity whose home is Camera on the Screen. */
(function (W) {
  W.add("pov", {
    sliders: [
      ["closeness", "How close to their eyes", ["over the shoulder", "beside them", "through their eyes"], "Whether we stand near the person or see exactly what they see."],
      ["reveal", "When we learn whose eyes", ["right away", "after a moment", "at the end", "never"], "How long the audience waits to find out who is looking."],
      ["pull", "How much it pulls us in", [0, 100, "%"], "How strongly seeing through their eyes makes the audience take their side."],
      ["switchRate", "Switching between viewers", ["stays with one", "now and then", "often"], "How often the film hands the point of view to someone else."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { nobody: "🎥", "a person": "👁️", "an object": "📦" } },
        { face: "ladder", slider: "closeness" },
        { face: "dial", slider: "pull" },
      ],
      groups: [
        { label: "Whose eyes", sliders: ["setting", "closeness", "honesty"] },
        { label: "How much and how often", sliders: ["share", "switchRate", "pull"] },
        { label: "Over time", sliders: ["reveal"] },
      ],
      presets: [
        { label: "Horror stalker eyes", plain: "We watch the victim through someone we never see.", set: { setting: "a person", closeness: "through their eyes", reveal: "never", pull: 80 } },
        { label: "Unreliable narrator", plain: "We trust a person's view until it turns out to be lying.", set: { setting: "a person", honesty: "lying", reveal: "at the end", closeness: "over the shoulder" } },
        { label: "Neutral observer", plain: "Nobody's eyes; the camera simply watches.", set: { setting: "nobody", share: 0, switchRate: "stays with one" } },
      ],
    },
  });

  W.add("angleToLine", {
    sliders: [
      ["distanceSwing", "How far the angle swings", ["a nudge", "a step", "a leap"], "How big the jump in framing is when a line earns it."],
      ["whichLines", "Which lines earn it", ["any line", "turning points", "only the big one"], "Which spoken lines get a matching angle."],
      ["timing", "Arrives before or after", [-2, 2, "beats"], "Whether the new angle lands before, on, or after the line."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "matches", right: "plays against" },
        { face: "pad", x: "strength", y: "share", xLabel: "How strongly", yLabel: "Lines matched" },
      ],
      groups: [
        { label: "The match", sliders: ["setting", "strength", "distanceSwing"] },
        { label: "Which lines and when", sliders: ["share", "whichLines", "timing"] },
      ],
      presets: [
        { label: "Courtroom confession push", plain: "The angle closes in exactly on the big admission.", set: { setting: "matches the line", whichLines: "only the big one", distanceSwing: "a leap", strength: 5 } },
        { label: "Deadpan irony", plain: "A wide, flat angle under the most dramatic line.", set: { setting: "plays against the line", strength: 3, timing: 0 } },
      ],
    },
  });

  W.add("cutRate", {
    sliders: [
      ["peakAt", "Fastest cutting at", [0, 100, "%"], "Where in the scene the angle changes come fastest."],
      ["unevenness", "Steady or bursty", ["metronome", "loose", "bursts and lulls"], "Whether the changes come evenly or in clumps."],
      ["followsTension", "Follows the tension", ["ignores it", "loosely", "tightly"], "How closely the speed of angle changes rides the scene's tension, to steer attention."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "perMinute" },
        { face: "balance", slider: "trend", left: "slowing", right: "speeding up" },
      ],
      groups: [
        { label: "How often", sliders: ["setting", "perMinute", "unevenness"] },
        { label: "Across the scene", sliders: ["trend", "peakAt", "followsTension"] },
      ],
      presets: [
        { label: "Action climax", plain: "Cuts pile up as the fight peaks.", set: { setting: "fast", perMinute: 40, trend: "speeding up", followsTension: "tightly" } },
        { label: "Slow cinema", plain: "Angles barely change; the scene breathes.", set: { setting: "slow", perMinute: 2, unevenness: "metronome" } },
        { label: "Thriller bursts", plain: "Calm stretches broken by flurries of cuts.", set: { setting: "medium", unevenness: "bursts and lulls", followsTension: "tightly" } },
      ],
    },
  });

  W.add("cameraOwner", {
    sliders: [
      ["guidance", "Nudging the player's eye", ["none", "gentle hints", "firm pull", "takes over"], "How much an authored camera steers the player toward what matters."],
      ["handoffSpeed", "How smooth the handover", ["instant", "quick blend", "slow glide"], "How the camera passes between the author and the player."],
      ["cinematicShare", "Share of authored moments", [0, 100, "%"], "How much of the time the story holds the camera."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "authored", right: "player" },
        { face: "dial", slider: "freedom" },
        { face: "ladder", slider: "guidance" },
      ],
      groups: [
        { label: "Who holds it", sliders: ["setting", "freedom", "cinematicShare"] },
        { label: "Passing it over", sliders: ["handoff", "handoffSpeed", "guidance"] },
      ],
      presets: [
        { label: "Story game cutscenes", plain: "Players roam, but big moments take the camera.", set: { setting: "player", handoff: "often", handoffSpeed: "slow glide", cinematicShare: 30 } },
        { label: "Fixed horror angles", plain: "Authored angles throughout, old survival-horror style.", set: { setting: "authored", freedom: 0, guidance: "takes over", cinematicShare: 100 } },
      ],
    },
  });

  W.add("objectPath", {
    sliders: [
      ["arc", "Straight or curved", ["straight", "gentle arc", "big arc", "wobbly"], "The shape of the path the object follows."],
      ["landing", "How it ends", ["stops softly", "lands hard", "bounces", "never lands"], "What happens when the object reaches the end of its path."],
      ["eyeCatch", "How much it draws the eye", [0, 100, "%"], "How strongly the object's movement pulls attention away from the faces."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { still: "🪨", lift: "⬆️", drop: "⬇️", slide: "➡️", open: "📂", pass: "🤝" } },
        { face: "pad", x: "distance", y: "eyeCatch", xLabel: "Distance", yLabel: "Draws the eye" },
      ],
      groups: [
        { label: "The path", sliders: ["setting", "distance", "arc"] },
        { label: "Cause and ending", sliders: ["control", "landing", "eyeCatch"] },
      ],
      presets: [
        { label: "Slow-motion glass drop", plain: "A glass falls and shatters as everyone stares.", set: { setting: "drop", landing: "lands hard", eyeCatch: 100, control: "gravity" } },
        { label: "Heist handoff", plain: "A small thing passes quietly from hand to hand.", set: { setting: "pass", control: "a person", arc: "straight", eyeCatch: 30 } },
      ],
    },
  });

  W.add("blocking", {
    sliders: [
      ["gapClosing", "Closing or opening the gap", ["moving apart", "holding", "closing in"], "Whether the people drift toward or away from each other over the scene."],
      ["levels", "Heights of bodies", ["all level", "some higher", "big differences"], "How much some people stand, sit, or tower over others."],
      ["stillness", "How still they are", ["restless", "some movement", "frozen"], "How much the bodies move around the room."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { line: "➖", triangle: "🔺", depth: "🧍", "one seated": "🪑" } },
        { face: "balance", slider: "gapClosing", left: "apart", right: "closing in" },
        { face: "dial", slider: "distance" },
      ],
      groups: [
        { label: "The shape", sliders: ["setting", "distance", "levels"] },
        { label: "Power", sliders: ["power"] },
        { label: "Movement over time", sliders: ["change", "gapClosing", "stillness"] },
      ],
      presets: [
        { label: "Interrogation", plain: "One sits, one looms and slowly closes in.", set: { setting: "one seated", power: "the speaker", gapClosing: "closing in", levels: "big differences" } },
        { label: "Western standoff", plain: "A frozen line, wide apart.", set: { setting: "line", distance: 5, stillness: "frozen" } },
        { label: "Breakup drift", plain: "Two people slowly move apart through the scene.", set: { setting: "depth", gapClosing: "moving apart", change: "drifts" } },
      ],
    },
  });

  W.add("shotSize", {
    sliders: [
      ["changeSpeed", "How fast it changes size", ["cut", "quick zoom", "slow push", "drift"], "Whether the frame jumps to its new size or slides into it."],
      ["subjectCount", "How many people in frame", ["one", "two", "a few", "a crowd"], "How many people the frame holds."],
      ["tightenOnTension", "Closer as tension rises", ["never", "a little", "strongly"], "How much the frame closes in as the scene heats up, to grip attention."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { insert: "🔍", close: "🙂", medium: "🧍", wide: "🏞️" } },
        { face: "frame", size: "setting" },
        { face: "pad", x: "breathing", y: "headroom", xLabel: "Room to look into", yLabel: "Space above" },
      ],
      groups: [
        { label: "The frame", sliders: ["setting", "headroom", "breathing", "subjectCount"] },
        { label: "Change over time", sliders: ["changeSpeed", "change", "tightenOnTension"] },
      ],
      presets: [
        { label: "Slow push to a close-up", plain: "Start wide and creep in as the tension builds.", set: { setting: "close", changeSpeed: "slow push", tightenOnTension: "strongly" } },
        { label: "Sitcom coverage", plain: "Medium shots that cut cleanly between speakers.", set: { setting: "medium", changeSpeed: "cut", subjectCount: "two" } },
        { label: "Sergio Leone eyes", plain: "Extreme close-ups that snap in on the stare.", set: { setting: "close", changeSpeed: "cut", headroom: 0, change: "snaps" } },
      ],
    },
  });

  W.add("angleHeight", {
    sliders: [
      ["powerRead", "Who seems powerful", ["the viewer", "equal", "the subject"], "Whether the angle makes the person look small or mighty."],
      ["subjectHeight", "Matched to whose eyes", ["a child", "seated adult", "standing adult", "a giant"], "Whose height the camera sits at."],
      ["climb", "Rising or sinking over time", ["sinking", "steady", "rising"], "Whether the camera slowly goes up or down across the scene."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "degrees" },
        { face: "balance", slider: "powerRead", left: "viewer", right: "subject" },
      ],
      groups: [
        { label: "Height", sliders: ["setting", "degrees", "subjectHeight"] },
        { label: "What it says", sliders: ["powerRead", "noticeable"] },
        { label: "Over time", sliders: ["change", "climb"] },
      ],
      presets: [
        { label: "Citizen Kane looming", plain: "A low angle makes the man a giant.", set: { setting: "low", degrees: 35, powerRead: "the subject" } },
        { label: "Spielberg kid's eye", plain: "The world seen from a child's height.", set: { setting: "low", subjectHeight: "a child", noticeable: "subtle" } },
        { label: "God's-eye overhead", plain: "Straight down on tiny figures.", set: { setting: "overhead", degrees: 90, powerRead: "the viewer" } },
      ],
    },
  });

  W.add("angleFamily", {
    sliders: [
      ["mixRatio", "Share of the main style", [0, 100, "%"], "How much of the scene sticks to the chosen way of grouping angles."],
      ["switchPoint", "Switching style at", ["never", "a turning point", "the climax"], "When the scene breaks into a different way of shooting."],
      ["restlessness", "How restless the camera feels", ["calm", "alert", "hunting"], "How much the shooting style makes the audience search the frame."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { coverage: "🎬", oner: "➰", montage: "🧩", handheld: "🤳" } },
        { face: "ladder", slider: "restlessness" },
      ],
      groups: [
        { label: "The style", sliders: ["setting", "purity", "mixRatio"] },
        { label: "Feel and change", sliders: ["restlessness", "switchPoint", "noticeable"] },
      ],
      presets: [
        { label: "Birdman oner", plain: "One unbroken take, never cutting away.", set: { setting: "oner", purity: "strict", mixRatio: 100, noticeable: "showy" } },
        { label: "Bourne handheld", plain: "The camera hunts the action in shaky bursts.", set: { setting: "handheld", restlessness: "hunting" } },
        { label: "Training montage", plain: "Stacked shots that switch style for the climax.", set: { setting: "montage", switchPoint: "the climax" } },
      ],
    },
  });

  W.add("angleChange", {
    sliders: [
      ["onReaction", "Cut to the listener", ["never", "sometimes", "often"], "How often the angle moves to the person reacting rather than speaking."],
      ["midWord", "Cut inside a sentence", ["never", "rarely", "freely"], "Whether cuts may land in the middle of a spoken line."],
      ["tighten", "Cutting tighter over time", ["looser", "steady", "tighter"], "Whether the cuts creep closer to the words as the scene goes on."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "on the line": "💬", "on the action": "✋", both: "🔀", locked: "🔒" } },
        { face: "dial", slider: "lead" },
      ],
      groups: [
        { label: "The trigger", sliders: ["setting", "onReaction", "midWord"] },
        { label: "Timing", sliders: ["lead", "tighten", "noticeable"] },
      ],
      presets: [
        { label: "Sorkin walk-and-talk", plain: "Cuts ride the line, early and snappy.", set: { setting: "on the line", lead: -1, midWord: "freely" } },
        { label: "Reaction comedy", plain: "Cut to the face hearing the joke.", set: { setting: "on the line", onReaction: "often", lead: 1 } },
      ],
    },
  });

  W.add("angleToAction", {
    sliders: [
      ["insertShare", "Close-ups of hands and things", [0, 100, "%"], "How often an action gets a tight shot of the hands or the object."],
      ["anticipate", "Shows it before or after", ["before it happens", "as it happens", "after it happens"], "Whether the angle arrives ahead of the action or catches up."],
      ["bigActions", "Which actions earn it", ["every small one", "important ones", "only the biggest"], "How big an action must be to get its own angle."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "matches", right: "plays against" },
        { face: "mixer", sliders: ["strength", "share", "insertShare"] },
      ],
      groups: [
        { label: "The match", sliders: ["setting", "strength", "bigActions"] },
        { label: "How much and when", sliders: ["share", "insertShare", "anticipate"] },
      ],
      presets: [
        { label: "Edgar Wright inserts", plain: "Every small action gets a punchy close-up.", set: { setting: "matches the action", insertShare: 90, bigActions: "every small one", strength: 5 } },
        { label: "Hitchcock suspense insert", plain: "We see the bomb before anyone acts.", set: { setting: "matches the action", anticipate: "before it happens", bigActions: "only the biggest" } },
      ],
    },
  });

  W.add("shotDuration", {
    sliders: [
      ["holdPast", "Holding past comfort", ["cuts early", "just right", "lingers", "uncomfortably long"], "Whether shots end before or after the moment feels finished."],
      ["growth", "Holds lengthen or shorten", ["shorter over time", "steady", "longer over time"], "How the hold changes across the scene."],
      ["longestAt", "Longest hold lands on", ["the opening", "the turning point", "the ending"], "Which part of the scene gets the longest look, to make the audience stay there."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "seconds" },
        { face: "ladder", slider: "holdPast" },
      ],
      groups: [
        { label: "How long", sliders: ["setting", "seconds", "variety"] },
        { label: "Across the scene", sliders: ["holdPast", "growth", "longestAt"] },
      ],
      presets: [
        { label: "Michael Haneke stare", plain: "Long, still holds well past comfort.", set: { setting: "long", seconds: 45, holdPast: "uncomfortably long" } },
        { label: "Music video snap", plain: "Short holds that get shorter still.", set: { setting: "short", seconds: 1, growth: "shorter over time" } },
        { label: "Final shot linger", plain: "Normal pace, then one long goodbye look.", set: { setting: "medium", longestAt: "the ending", holdPast: "lingers" } },
      ],
    },
  });

  W.add("cameraMove", {
    sliders: [
      ["direction", "Which way it travels", ["left", "right", "up", "down", "toward them", "away"], "The direction the camera heads during the shot.", { unordered: true }],
      ["reveal", "What the move reveals", ["nothing new", "a detail", "a person", "the whole place"], "How much the move uncovers by the time it ends."],
      ["motivated", "Reason for moving", ["follows the story", "follows a feeling", "pure style"], "Whether the move has a clear reason in the scene or is there for its own sake."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⏸️", pan: "↔️", tilt: "↕️", "push in": "⏩", "pull out": "⏪", track: "🛤️", crane: "🏗️", zoom: "🔎", orbit: "🔄" } },
        { face: "compass", slider: "direction", angles: { up: 0, right: 90, down: 180, left: 270, "toward them": 45, away: 225 } },
        { face: "dial", slider: "distance" },
      ],
      groups: [
        { label: "The move", sliders: ["setting", "direction", "distance"] },
        { label: "Start and end", sliders: ["start", "end"] },
        { label: "Purpose", sliders: ["reveal", "motivated"] },
      ],
      presets: [
        { label: "Spielberg reveal crane", plain: "Rise up to show the whole place at once.", set: { setting: "crane", direction: "up", reveal: "the whole place", end: "settles" } },
        { label: "Scorsese push in", plain: "Glide toward a face as a thought lands.", set: { setting: "push in", direction: "toward them", motivated: "follows a feeling", start: "from rest" } },
        { label: "Hero orbit", plain: "Circle the hero in a showy move.", set: { setting: "orbit", motivated: "pure style", start: "already moving", end: "still moving" } },
      ],
    },
  });

  W.add("moveFollows", {
    sliders: [
      ["keepSize", "Keeps them the same size", ["lets them shrink", "roughly", "exactly"], "Whether the subject stays the same size in frame while followed."],
      ["side", "Following from", ["behind", "beside", "in front"], "Where the camera rides relative to the person it follows.", { unordered: true }],
      ["loseThem", "Lets them slip away", ["never", "briefly", "on purpose"], "Whether the subject is allowed to escape the frame to build tension."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { character: "🚶", object: "⚽", neither: "🌫️" } },
        { face: "pad", x: "lead", y: "tightness", xLabel: "Leads or lags", yLabel: "How tightly" },
        { face: "tiles", slider: "side", icons: { behind: "🔙", beside: "↔️", "in front": "🔜" } },
      ],
      groups: [
        { label: "What it follows", sliders: ["setting", "side"] },
        { label: "How closely", sliders: ["tightness", "lead", "keepSize", "loseThem"] },
      ],
      presets: [
        { label: "Goodfellas Copacabana", plain: "Tight behind them through the kitchen.", set: { setting: "character", side: "behind", tightness: 5, keepSize: "exactly" } },
        { label: "Chase that loses them", plain: "The camera can't keep up and they slip out.", set: { setting: "character", lead: -2, loseThem: "on purpose" } },
      ],
    },
  });

  W.add("objectKind", {
    sliders: [
      ["familiar", "Ordinary or strange", ["everyday", "unusual", "uncanny"], "How strange the object feels to the audience."],
      ["meaning", "What it stands for", ["just a thing", "a clue", "a memory", "a threat"], "How much story the object carries."],
      ["returns", "How often it comes back", ["once", "a few times", "throughout"], "How often the same object reappears across the film."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { prop: "🔑", door: "🚪", screen: "📱", vehicle: "🚗", food: "🍎" } },
        { face: "mixer", sliders: ["size", "importance"] },
        { face: "ladder", slider: "meaning" },
      ],
      groups: [
        { label: "The thing", sliders: ["setting", "size", "familiar"] },
        { label: "Its weight in the story", sliders: ["importance", "meaning", "returns"] },
      ],
      presets: [
        { label: "Chekhov's gun", plain: "Shown early, returns when it matters.", set: { setting: "prop", meaning: "a threat", returns: "a few times", importance: 5 } },
        { label: "Rosebud keepsake", plain: "An everyday thing that turns out to be a memory.", set: { familiar: "everyday", meaning: "a memory", returns: "throughout" } },
      ],
    },
  });

  W.add("objectEnter", {
    sliders: [
      ["speed", "How fast it crosses in", ["creeps", "steady", "flies in"], "How quickly the object comes into or out of the picture."],
      ["warning", "Hinted before it arrives", ["no warning", "a sound first", "a shadow first"], "Whether the audience gets a clue before the object appears."],
      ["landsWhere", "Where it ends up", ["edge of frame", "near the person", "center of frame"], "How close to the center of attention the object settles."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { stays: "📌", enters: "📥", leaves: "📤" } },
        { face: "compass", slider: "side", angles: { top: 0, right: 90, bottom: 180, left: 270, "toward the lens": 45 } },
      ],
      groups: [
        { label: "In or out", sliders: ["setting", "side", "speed"] },
        { label: "Getting noticed", sliders: ["warning", "landsWhere", "noticeable"] },
      ],
      presets: [
        { label: "Jaws fin", plain: "A sound warns us, then it slides in slowly.", set: { setting: "enters", warning: "a sound first", speed: "creeps" } },
        { label: "3D throw at the lens", plain: "Something flies straight at the audience.", set: { setting: "enters", side: "toward the lens", speed: "flies in", noticeable: "showy" } },
      ],
    },
  });

  W.add("peopleCount", {
    sliders: [
      ["extrasMotion", "Background busy or still", ["frozen", "calm", "busy", "chaotic"], "How much the people behind the action move around."],
      ["arrivals", "People arriving or leaving", ["emptying", "steady", "filling up"], "Whether the shot gains or loses people over the scene."],
      ["focusOnOne", "One face stands out", ["no", "slightly", "clearly"], "Whether the crowd is arranged so the eye finds one person."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "background", xLabel: "People in shot", yLabel: "Extras" },
        { face: "ladder", slider: "extrasMotion" },
      ],
      groups: [
        { label: "How many", sliders: ["setting", "background", "density"] },
        { label: "Movement and focus", sliders: ["extrasMotion", "arrivals", "focusOnOne"] },
      ],
      presets: [
        { label: "Lonely diner", plain: "One person, a near-empty room.", set: { setting: 1, background: 2, density: "spread out", extrasMotion: "calm" } },
        { label: "Party filling up", plain: "The room crowds in around our hero.", set: { setting: 3, background: 40, arrivals: "filling up", focusOnOne: "clearly" } },
      ],
    },
  });

  W.add("eyeline", {
    sliders: [
      ["toLens", "Looking into the lens", ["never", "once", "often"], "Whether someone looks straight at the audience."],
      ["breakFirst", "Who looks away first", ["the speaker", "the listener", "neither"], "Which person breaks the look.", { unordered: true }],
      ["warming", "Looks growing or fading", ["fading", "steady", "growing"], "Whether people look at each other more or less as the scene goes on."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "hold" },
        { face: "balance", slider: "warming", left: "fading", right: "growing" },
      ],
      groups: [
        { label: "The look", sliders: ["setting", "hold", "toLens"] },
        { label: "Who breaks it", sliders: ["avoid", "breakFirst", "warming"] },
      ],
      presets: [
        { label: "Falling in love", plain: "Glances grow into long held looks.", set: { setting: "both hold", warming: "growing", hold: 4 } },
        { label: "Fleabag aside", plain: "She glances straight at us.", set: { toLens: "often", setting: "glances" } },
        { label: "Guilty silence", plain: "One person can't meet the other's eye.", set: { setting: "no one meets", avoid: "one avoids", breakFirst: "the listener" } },
      ],
    },
  });

  W.add("focus", {
    sliders: [
      ["distance", "Near or far from the lens", ["very near", "near", "middle", "far"], "How far away the sharp thing is."],
      ["blurAround", "How soft the rest is", ["barely soft", "soft", "melted"], "How blurry everything outside the sharp thing becomes."],
      ["guideEye", "Steering where we look", ["not at all", "gently", "firmly"], "How strongly the sharp spot tells the audience where to look."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { face: "🙂", hand: "✋", object: "💎", door: "🚪" } },
        { face: "pad", x: "speed", y: "guideEye", xLabel: "How fast it moves", yLabel: "Steering the eye" },
      ],
      groups: [
        { label: "What is sharp", sliders: ["setting", "distance", "blurAround"] },
        { label: "Moving the eye", sliders: ["speed", "guideEye", "noticeable"] },
      ],
      presets: [
        { label: "Portrait dream", plain: "One face crisp, the world melted away.", set: { setting: "face", blurAround: "melted", guideEye: "firmly" } },
        { label: "The clue in the hand", plain: "Focus finds the hand holding the evidence.", set: { setting: "hand", distance: "near", guideEye: "firmly", noticeable: "clear" } },
      ],
    },
  });

  W.add("look", {
    sliders: [
      ["wear", "Fresh or worn down", ["fresh", "lived in", "worn out", "wrecked"], "How much the day has marked the actor's face and clothes."],
      ["stillness", "How still they hold", ["fidgety", "natural", "statue still"], "How much the actor moves their face and body for the camera."],
      ["beauty", "Flattering or raw", ["raw", "honest", "flattering", "glamorous"], "How kindly the look treats the actor."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { plain: "👕", styled: "👔", striking: "💃" } },
        { face: "ladder", slider: "wear" },
        { face: "dial", slider: "care" },
      ],
      groups: [
        { label: "The look", sliders: ["setting", "care", "beauty"] },
        { label: "Over the film", sliders: ["wear", "stillness", "change"] },
      ],
      presets: [
        { label: "Die Hard wear-down", plain: "Starts fresh, ends wrecked.", set: { wear: "wrecked", change: "drifts", beauty: "raw" } },
        { label: "Golden age glamour", plain: "Striking, flattering, perfectly still.", set: { setting: "striking", beauty: "glamorous", stillness: "statue still", care: 5 } },
      ],
    },
  });

  W.add("rackFocus", {
    sliders: [
      ["direction", "Near to far or far to near", ["far to near", "either", "near to far"], "Which way the focus travels."],
      ["revealsWhat", "What the pull reveals", ["a reaction", "a detail", "a threat", "a person arriving"], "What the audience discovers when focus lands.", { unordered: true }],
      ["hesitate", "Hunting before it lands", ["lands cleanly", "small search", "searches"], "Whether focus wavers before finding its target."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "⏸️", "on the line": "💬", "on the action": "✋" } },
        { face: "balance", slider: "direction", left: "far to near", right: "near to far" },
        { face: "pad", x: "speed", y: "count", xLabel: "Pull speed", yLabel: "Pulls per scene" },
      ],
      groups: [
        { label: "When", sliders: ["setting", "count"] },
        { label: "The pull", sliders: ["speed", "direction", "hesitate", "revealsWhat"] },
      ],
      presets: [
        { label: "Threat in the background", plain: "Focus slides off the hero to the danger behind.", set: { setting: "on the action", direction: "near to far", revealsWhat: "a threat", speed: 2 } },
        { label: "Documentary search", plain: "Focus hunts a little, like a real operator.", set: { hesitate: "searches", speed: 4, count: 6 } },
      ],
    },
  });

  W.add("cameraShake", {
    sliders: [
      ["direction", "Which way it shakes", ["side to side", "up and down", "all over"], "The main direction of the shaking.", { unordered: true }],
      ["decay", "How fast it settles", ["instantly", "quickly", "slowly", "never"], "How long the shake takes to die away after it starts."],
      ["onHits", "Spikes on impacts", ["never", "on big hits", "on every hit"], "Whether the shake jolts on punches, crashes, and bangs."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "frequency", xLabel: "Shake", yLabel: "Shake speed" },
        { face: "tiles", slider: "cause", icons: { "the operator": "🤳", "an impact": "💥", "an engine": "🚂", "the ground": "🌋" } },
      ],
      groups: [
        { label: "The shake", sliders: ["setting", "frequency", "direction"] },
        { label: "Cause and timing", sliders: ["cause", "onHits", "decay"] },
      ],
      presets: [
        { label: "Saving Private Ryan beach", plain: "Hard, constant jolts from nearby blasts.", set: { setting: 5, cause: "an impact", onHits: "on every hit", decay: "slowly" } },
        { label: "Star Trek bridge hit", plain: "A single jolt that settles right away.", set: { setting: 3, onHits: "on big hits", decay: "quickly" } },
        { label: "Train ride hum", plain: "A soft, steady rattle.", set: { setting: 1, frequency: 4, cause: "an engine", decay: "never" } },
      ],
    },
  });

  W.add("speedRamp", {
    sliders: [
      ["rampOn", "Ramp lands on", ["the action peak", "an impact", "a look", "the beat"], "The moment the speed change is timed to.", { unordered: true }],
      ["holdSlow", "Time spent slowed", [0, 5, "seconds"], "How long the slow part lasts before speeding back up."],
      ["returns", "Comes back to normal", ["snaps back", "eases back", "stays changed"], "How the shot returns to regular speed."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { slow: "🐢", normal: "🚶", fast: "🐇", ramp: "📈" } },
        { face: "dial", slider: "factor" },
      ],
      groups: [
        { label: "Speed", sliders: ["setting", "factor"] },
        { label: "The ramp", sliders: ["ramp", "rampOn", "holdSlow", "returns"] },
      ],
      presets: [
        { label: "300 battle ramp", plain: "Slam into slow motion on the hit, then snap back.", set: { setting: "ramp", factor: 0.25, ramp: "sudden", rampOn: "an impact", returns: "snaps back" } },
        { label: "Dreamy slow walk", plain: "A gentle glide into slow motion that stays.", set: { setting: "slow", factor: 0.5, ramp: "long ramp", returns: "stays changed" } },
      ],
    },
  });

  W.add("cameraLensLens", {
    sliders: [
      ["character", "Clean or vintage glass", ["clean modern", "a little soft", "vintage", "toy lens"], "How perfect or flawed the lens's picture feels."],
      ["breathing", "Lens changes over time", ["holds", "drifts", "steps"], "Whether the lens choices shift slowly across the film."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "length", icons: { wide: "🌐", normal: "👁️", long: "🔭" } },
        { face: "mixer", sliders: ["blur", "bend", "flare", "vignette"] },
        { face: "dial", slider: "shake" },
      ],
      groups: [
        { label: "The glass", sliders: ["length", "character", "bend"] },
        { label: "Focus", sliders: ["focusDepth", "focusPull"] },
        { label: "Flaws and texture", sliders: ["blur", "shake", "flare", "vignette"] },
        { label: "Over time", sliders: ["breathing"] },
      ],
      presets: [
        { label: "J.J. Abrams flares", plain: "Clean glass streaked with blue flares.", set: { character: "clean modern", flare: "streaks", length: "wide" } },
        { label: "1970s New Hollywood", plain: "Long, soft vintage glass with dark corners.", set: { length: "long", character: "vintage", vignette: "subtle", focusDepth: "shallow" } },
        { label: "Skate video fisheye", plain: "A wide, bending lens right up close.", set: { length: "wide", bend: "fisheye", shake: 3, character: "toy lens" } },
      ],
    },
  });

  W.add("lensLength", {
    sliders: [
      ["roomFeel", "Room feels deep or flat", ["very deep", "natural", "flat", "squashed"], "How much space seems to stretch between near and far."],
      ["faceShape", "What it does to faces", ["stretches", "true", "flatters"], "How the lens changes the shape of a face up close."],
      ["drift", "Lens creeping over time", ["shortening", "steady", "lengthening"], "Whether the lens gets wider or longer as the story goes on."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "wide", right: "long" },
        { face: "dial", slider: "mm" },
        { face: "ladder", slider: "roomFeel" },
      ],
      groups: [
        { label: "The lens", sliders: ["setting", "mm", "distortion"] },
        { label: "What it does", sliders: ["roomFeel", "faceShape", "drift"] },
      ],
      presets: [
        { label: "Coen brothers wide", plain: "A wide lens close in, faces a little stretched.", set: { setting: "wide", mm: 18, faceShape: "stretches", roomFeel: "very deep" } },
        { label: "Michael Mann long lens", plain: "Long glass that squashes the city behind them.", set: { setting: "long", mm: 150, roomFeel: "squashed", faceShape: "flatters" } },
      ],
    },
  });

  W.add("dutch", {
    sliders: [
      ["motivation", "Why it tilts", ["unease", "madness", "drunkenness", "pure style"], "The feeling the tilt stands for.", { unordered: true }],
      ["rockBack", "Rocking side to side", ["never", "slowly", "constantly"], "Whether the tilt swings back and forth during the shot."],
      ["growth", "Tilt grows over the scene", ["straightening", "steady", "growing"], "Whether the horizon leans more or less as things go wrong."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "degrees" },
        { face: "balance", slider: "side", left: "left", right: "right" },
        { face: "tiles", slider: "motivation", icons: { unease: "😰", madness: "🌀", drunkenness: "🍺", "pure style": "✨" } },
      ],
      groups: [
        { label: "The tilt", sliders: ["setting", "degrees", "side"] },
        { label: "Meaning", sliders: ["motivation"] },
        { label: "Over time", sliders: ["change", "growth", "rockBack"] },
      ],
      presets: [
        { label: "The Third Man unease", plain: "Steep tilts that never let the city settle.", set: { setting: "tilted", degrees: 25, motivation: "unease", side: "either" } },
        { label: "Slipping into madness", plain: "Starts level, leans more and more.", set: { setting: "tilted", growth: "growing", motivation: "madness", change: "drifts" } },
        { label: "Drunk sway", plain: "The horizon rocks gently side to side.", set: { setting: "tilted", degrees: 8, rockBack: "slowly", motivation: "drunkenness" } },
      ],
    },
  });

  W.add("angleCount", {
    sliders: [
      ["saveBest", "Best angle saved for", ["shown early", "the middle", "the climax"], "When the most striking setup is first used, to hold attention."],
      ["adding", "Setups added or dropped", ["dropping", "steady", "adding"], "Whether the scene opens up to new setups or narrows down as it goes."],
      ["sides", "Sides of the room used", ["one side", "both sides", "all around"], "How much of the room the camera is allowed to shoot from."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "sides", icons: { "one side": "◀️", "both sides": "↔️", "all around": "🔄" } },
      ],
      groups: [
        { label: "How many", sliders: ["setting", "variety", "sides"] },
        { label: "Using them", sliders: ["reuse", "adding", "saveBest"] },
      ],
      presets: [
        { label: "Ozu stage set", plain: "Few setups, one side, used again and again.", set: { setting: 3, sides: "one side", reuse: "always", variety: 1 } },
        { label: "Heist finale coverage", plain: "Many setups, saving the best angle for the climax.", set: { setting: 8, sides: "all around", saveBest: "the climax", adding: "adding" } },
      ],
    },
  });

  W.add("cameraCarry", {
    sliders: [
      ["breath", "Breathing with the operator", ["none", "faint", "clear"], "Whether you can feel a person breathing behind the camera."],
      ["looseningAt", "Steadiness over the scene", ["steadying", "steady", "loosening"], "Whether the camera grows calmer or shakier as the scene goes on."],
      ["closeness", "Feels like you are there", [0, 100, "%"], "How much the carry makes the audience feel inside the scene."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { locked: "🗿", smooth: "🛼", handheld: "🤳" } },
        { face: "mixer", sliders: ["wobble", "drift"] },
        { face: "dial", slider: "closeness" },
      ],
      groups: [
        { label: "How it is carried", sliders: ["setting", "wobble", "drift", "breath"] },
        { label: "Feel and change", sliders: ["closeness", "looseningAt"] },
      ],
      presets: [
        { label: "Kubrick tripod", plain: "Locked, still, watching from outside.", set: { setting: "locked", wobble: 0, drift: 0, closeness: 10 } },
        { label: "Dardenne brothers handheld", plain: "Right on the shoulder, breathing with them.", set: { setting: "handheld", breath: "clear", closeness: 90, wobble: 3 } },
        { label: "Losing control", plain: "Starts smooth and falls apart.", set: { setting: "smooth", looseningAt: "loosening" } },
      ],
    },
  });

  W.add("moveSpeed", {
    sliders: [
      ["matchesSubject", "Matched to the subject", ["slower", "same", "faster"], "Whether the camera moves slower, alongside, or ahead of what it films."],
      ["feelsUrgent", "How urgent it feels", ["lazy", "calm", "urgent", "frantic"], "The pressure the speed puts on the audience."],
      ["peak", "Fastest at", [0, 100, "%"], "Where in the move the camera is going fastest."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "easing", icons: { even: "➖", "eases in": "📈", "eases out": "📉", "eases both": "〰️" } },
        { face: "ladder", slider: "feelsUrgent" },
      ],
      groups: [
        { label: "Speed", sliders: ["setting", "matchesSubject", "feelsUrgent"] },
        { label: "Shape over time", sliders: ["easing", "peak", "change"] },
      ],
      presets: [
        { label: "Kubrick hallway glide", plain: "A slow, even glide that never hurries.", set: { setting: 1, easing: "even", feelsUrgent: "calm" } },
        { label: "Car chase rush", plain: "Fast, urgent, pulling ahead of the car.", set: { setting: 5, matchesSubject: "faster", feelsUrgent: "frantic" } },
      ],
    },
  });

  W.add("moveOn", {
    sliders: [
      ["cueOwner", "Whose cue", ["the speaker", "the listener", "anyone"], "Which person's line or action starts the move.", { unordered: true }],
      ["anticipation", "Early or late", ["ahead of the cue", "on the cue", "after the cue"], "Whether the camera starts before, on, or after the cue."],
      ["cuesUsed", "Share of cues that move it", [0, 100, "%"], "How many of the cues actually trigger a move."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { line: "💬", action: "✋", breath: "🌬️", none: "⏸️" } },
        { face: "pad", x: "delay", y: "cuesUsed", xLabel: "Delay", yLabel: "Cues used" },
      ],
      groups: [
        { label: "The cue", sliders: ["setting", "cueOwner", "cuesUsed"] },
        { label: "Timing", sliders: ["delay", "anticipation", "noticeable"] },
      ],
      presets: [
        { label: "Fincher precise", plain: "Moves start exactly on the action, unseen.", set: { setting: "action", anticipation: "on the cue", delay: 0, noticeable: "invisible" } },
        { label: "Reaction drift", plain: "The camera drifts after the listener's breath.", set: { setting: "breath", cueOwner: "the listener", anticipation: "after the cue" } },
      ],
    },
  });

  W.add("objectSpeed", {
    sliders: [
      ["blurTrail", "Blur behind it", ["sharp", "slight smear", "streak"], "How much the object smears as it moves."],
      ["versusCamera", "Against the camera", ["camera keeps up", "slips ahead", "outruns it"], "Whether the camera keeps pace with the object."],
      ["impact", "How hard it stops", ["glides to rest", "firm", "crashes"], "How abruptly the object's travel ends."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "easing", left: "slows down", right: "speeds up" },
      ],
      groups: [
        { label: "Speed", sliders: ["setting", "easing", "change"] },
        { label: "How it reads", sliders: ["blurTrail", "versusCamera", "impact"] },
      ],
      presets: [
        { label: "Rolling boulder", plain: "Speeds up, outruns the camera, crashes.", set: { setting: 5, easing: "speeds up", versusCamera: "outruns it", impact: "crashes" } },
        { label: "Drifting feather", plain: "Slow, sharp, glides to rest.", set: { setting: 1, easing: "slows down", blurTrail: "sharp", impact: "glides to rest" } },
      ],
    },
  });

  W.add("depthOfField", {
    sliders: [
      ["softness", "How creamy the blur", ["busy", "smooth", "creamy"], "How soft and pleasant the out-of-focus parts look."],
      ["isolation", "Cuts them off from the world", [0, 100, "%"], "How strongly the shallow focus separates the person from the room, to hold attention on them."],
      ["deepening", "Opening up over time", ["narrowing", "steady", "widening"], "Whether more or less of the scene becomes sharp as the story goes on."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "fstop" },
        { face: "tiles", slider: "subject", icons: { "one eye": "👁️", "a face": "🙂", "two people": "👥", "the room": "🏠" } },
      ],
      groups: [
        { label: "How deep", sliders: ["setting", "fstop", "subject"] },
        { label: "Feel and change", sliders: ["softness", "isolation", "deepening"] },
      ],
      presets: [
        { label: "Citizen Kane deep focus", plain: "Everyone sharp, near and far.", set: { setting: "deep", fstop: 16, subject: "the room", isolation: 0 } },
        { label: "Indie close-up dream", plain: "One eye sharp, everything else melted.", set: { setting: "shallow", fstop: 1.4, subject: "one eye", softness: "creamy", isolation: 100 } },
      ],
    },
  });

  W.add("motionBlur", {
    sliders: [
      ["choppy", "Smooth or choppy", ["silky", "natural", "choppy", "stuttering"], "Whether fast motion looks smooth or jerky and sharp."],
      ["onAction", "Changes in action", ["stays the same", "choppier in action", "smoother in action"], "Whether the blur switches when the action kicks off.", { unordered: true }],
      ["direction", "Smear follows", ["the subject", "the camera", "both"], "Whether the smear comes from the subject moving or the camera moving.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "dial", slider: "shutter" },
        { face: "ladder", slider: "choppy" },
      ],
      groups: [
        { label: "Blur", sliders: ["setting", "shutter", "direction"] },
        { label: "Feel and change", sliders: ["choppy", "onAction", "noticeable"] },
      ],
      presets: [
        { label: "Saving Private Ryan stutter", plain: "Sharp, choppy frames in the chaos.", set: { setting: "none", shutter: 45, choppy: "stuttering", onAction: "choppier in action" } },
        { label: "Dreamlike smear", plain: "Heavy, silky blur on everything that moves.", set: { setting: "heavy", shutter: 360, choppy: "silky" } },
      ],
    },
  });

  W.add("aspect", {
    sliders: [
      ["opensUp", "Frame opens up at", ["never", "a turning point", "the climax"], "When the frame widens to give a big moment more room."],
      ["barColor", "Color of the bars", ["black", "white", "a color"], "What fills the space outside the picture.", { unordered: true }],
      ["width", "Picture width", [1.0, 2.76, ":1"], "How wide the picture is compared with its height."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "1.33": "⬜", "1.85": "▭", "2.39": "🎞️", custom: "✂️" } },
        { face: "dial", slider: "width" },
      ],
      groups: [
        { label: "The shape", sliders: ["setting", "width"] },
        { label: "The bars", sliders: ["letterbox", "barColor"] },
        { label: "Over time", sliders: ["change", "opensUp"] },
      ],
      presets: [
        { label: "The Dark Knight IMAX", plain: "Wide frame that opens taller for big set pieces.", set: { setting: "2.39", opensUp: "the climax", change: "snaps" } },
        { label: "Grand Budapest boxy", plain: "A square old-movie frame.", set: { setting: "1.33", width: 1.33, letterbox: "thick", barColor: "black" } },
        { label: "Mommy widening", plain: "A narrow frame pushed open at the turning point.", set: { setting: "custom", width: 1.0, opensUp: "a turning point", change: "drifts" } },
      ],
    },
  });

  W.add("composition", {
    sliders: [
      ["height", "How high in frame", ["low", "middle", "high"], "How high up the picture the subject sits."],
      ["symmetry", "Symmetry", ["loose", "balanced", "perfectly mirrored"], "How evenly the two sides of the picture match."],
      ["shift", "Moving across over time", ["holds", "drifts", "jumps"], "Whether the subject's place in frame shifts through the scene."],
    ],
    window: {
      faces: [
        { face: "frame", x: "setting", y: "height" },
        { face: "balance", slider: "balance", left: "left heavy", right: "right heavy" },
        { face: "ladder", slider: "symmetry" },
      ],
      groups: [
        { label: "Placement", sliders: ["setting", "height", "balance"] },
        { label: "Guiding the eye", sliders: ["leading", "frameInFrame", "symmetry"] },
        { label: "Over time", sliders: ["shift"] },
      ],
      presets: [
        { label: "Wes Anderson symmetry", plain: "Dead center, perfectly mirrored.", set: { setting: "center", symmetry: "perfectly mirrored", balance: 0 } },
        { label: "Mr. Robot short-siding", plain: "Pushed into a low corner, the frame feels wrong.", set: { setting: "left third", height: "low", balance: -5, symmetry: "loose" } },
        { label: "John Ford doorway", plain: "Framed inside a doorway, lines leading to them.", set: { frameInFrame: "full", leading: "strong", setting: "center" } },
      ],
    },
  });

  W.add("emptySpace", {
    sliders: [
      ["emptyFeel", "What the empty space says", ["calm", "lonely", "threatening"], "The feeling the empty part of the picture gives."],
      ["filled", "Something enters the space", ["never", "late", "suddenly"], "Whether the empty space is later filled, to snap attention there."],
      ["growth", "Space growing or shrinking", ["shrinking", "steady", "growing"], "Whether the emptiness widens or closes in across the scene."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "percent" },
        { face: "compass", slider: "where", angles: { above: 0, beside: 90, behind: 180, "all around": 270 } },
        { face: "tiles", slider: "emptyFeel", icons: { calm: "🌅", lonely: "🌫️", threatening: "🌑" } },
      ],
      groups: [
        { label: "How much", sliders: ["setting", "percent", "where"] },
        { label: "Meaning and change", sliders: ["emptyFeel", "filled", "growth"] },
      ],
      presets: [
        { label: "Horror empty doorway", plain: "Lots of space behind them... then something fills it.", set: { setting: "most", where: "behind", emptyFeel: "threatening", filled: "suddenly" } },
        { label: "Lost in Translation loneliness", plain: "A small figure in wide empty space.", set: { setting: "most", percent: 80, emptyFeel: "lonely", growth: "growing" } },
      ],
    },
  });

  W.add("moveToVolume", {
    sliders: [
      ["direction", "Loud pushes in or pulls out", ["pulls out", "either", "pushes in"], "Which way the camera moves when the voices rise."],
      ["threshold", "How loud before it moves", ["a raised voice", "a shout", "only a scream"], "How loud the dialogue must get to move the camera."],
      ["settleAfter", "Settles after the noise", ["at once", "slowly", "stays"], "What the camera does once the loudness drops."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "moves on loud": "📢", "moves on soft": "🤫", ignores: "🙉" } },
        { face: "balance", slider: "direction", left: "pulls out", right: "pushes in" },
        { face: "pad", x: "strength", y: "delay", xLabel: "How strongly", yLabel: "Delay" },
      ],
      groups: [
        { label: "The link", sliders: ["setting", "strength", "threshold"] },
        { label: "The move", sliders: ["direction", "delay", "settleAfter"] },
      ],
      presets: [
        { label: "Whiplash outburst", plain: "The camera lunges in on every shout.", set: { setting: "moves on loud", direction: "pushes in", threshold: "a shout", strength: 5, delay: 0 } },
        { label: "Whisper lean-in", plain: "The camera creeps closer as voices drop.", set: { setting: "moves on soft", direction: "pushes in", settleAfter: "stays" } },
      ],
    },
  });

  W.add("foreshortening", {
    sliders: [
      ["nearThing", "What reaches toward us", ["a hand", "a foot", "a weapon", "an object"], "The near thing that gets stretched big.", { unordered: true }],
      ["threat", "Menacing or playful", ["playful", "neutral", "menacing"], "Whether the stretched near thing feels fun or threatening."],
      ["reach", "Reaching in over time", ["pulling back", "steady", "reaching in"], "Whether the near thing comes closer to the lens as the shot goes on."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "nearThing", icons: { "a hand": "✋", "a foot": "🦶", "a weapon": "🔫", "an object": "📦" } },
        { face: "dial", slider: "distance" },
      ],
      groups: [
        { label: "The stretch", sliders: ["setting", "distance", "nearThing"] },
        { label: "Feel and change", sliders: ["threat", "reach", "noticeable"] },
      ],
      presets: [
        { label: "Tarantino trunk shot", plain: "Looking up past a reaching hand, menacing.", set: { setting: "strong", nearThing: "a hand", threat: "menacing", distance: 5 } },
        { label: "Anime action pose", plain: "A fist flies huge at the lens.", set: { setting: "strong", nearThing: "a hand", reach: "reaching in", noticeable: "showy" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
