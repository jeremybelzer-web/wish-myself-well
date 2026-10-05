/* Feeling: a window for every curiosity whose home is Feeling on the Screen. */
(function (W) {
  const PLAYED = ["drama", "both", "comedy"];

  W.add("stakes", {
    sliders: [
      ["clock", "How much time is left", ["no clock", "a loose deadline", "a firm deadline", "seconds left"], "Whether a ticking clock squeezes the stakes."],
      ["whoLoses", "Who loses if they fail", ["only them", "someone they love", "many people", "everyone"], "How far the damage reaches beyond the hero."],
      ["raised", "Raised during the scene", ["lowered", "steady", "raised", "doubled"], "Whether the scene makes the danger bigger before it ends."],
      ["care", "How much we care", [0, 5, ""], "How invested the audience is in the outcome, the hook that keeps them watching."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "curve", slider: "size", points: 4, title: "Stakes across my film" },
        { face: "tiles", slider: "kind", icons: { pride: "😳", money: "💰", "a job": "💼", "a person": "❤️", "a dream": "🌠", "a life": "⚰️" } },
        { face: "ladder", slider: "clock" },
      ],
      groups: [
        { label: "What's at risk", sliders: ["size", "kind", "whoLoses"] },
        { label: "The clock", sliders: ["clock", "raised"] },
        { label: "The audience", sliders: ["clear", "care"] },
      ],
      presets: [
        { label: "Ticking-bomb thriller", plain: "Life or death, spelled out, with seconds to spare.", set: { size: 5, kind: "a life", clock: "seconds left", clear: "spelled out", care: 5 } },
        { label: "Sitcom pride on the line", plain: "Small stakes treated as if the world depends on them.", set: { size: 2, kind: "pride", whoLoses: "only them", raised: "doubled" } },
        { label: "Quiet indie dream", plain: "A private dream, hinted at, slowly slipping away.", set: { size: 3, kind: "a dream", clear: "hinted", clock: "no clock" } },
      ],
    },
  });

  W.add("emoRoadCharacter", {
    sliders: [
      ["roadPace", "How fast they travel it", ["stalled", "slow", "steady", "fast", "rushing"], "How quickly this character moves along their emotional road right now."],
      ["pull", "How much their road pulls us", [0, 5, ""], "How strongly the audience follows this character's ups and downs."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "lowest point": "🕳️", falling: "📉", steady: "➖", rising: "📈", "highest point": "⛰️" } },
        { face: "pad", x: "lowPoint", y: "highPoint", xLabel: "Lowest point", yLabel: "Highest point" },
        { face: "curve", slider: "height", points: 5, title: "Their road across my film", fallback: { face: "dial", slider: "height" } },
      ],
      groups: [
        { label: "Right now", sliders: ["setting", "height", "roadPace"] },
        { label: "Shape of the road", sliders: ["swing", "turns", "lowPoint", "highPoint", "endsAbove"] },
        { label: "Against the film", sliders: ["withFilm", "pull"] },
      ],
      presets: [
        { label: "Rocky comeback", plain: "Bottom out late, then climb to the top.", set: { setting: "rising", lowPoint: 70, highPoint: 95, endsAbove: "much higher" } },
        { label: "Godfather fall", plain: "Starts decent and ends far lower inside.", set: { setting: "falling", endsAbove: "much lower", withFilm: "opposite" } },
        { label: "Pixar all-is-lost", plain: "The deepest low about three quarters in.", set: { setting: "lowest point", height: -5, lowPoint: 75 } },
      ],
    },
  });

  W.add("emoRoadFilm", {
    sliders: [
      ["grip", "How tightly it holds us", [0, 5, ""], "How firmly the film has the audience's attention at this point."],
      ["breathers", "Rests between big moments", ["none", "few", "regular", "many"], "How often the film lets the audience catch their breath."],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["tension", "laughter", "relief"] },
        { face: "tiles", slider: "shape", icons: { "rags to riches": "📈", "riches to rags": "📉", "fall then rise": "↘️", "rise then fall": "↗️", "rise, fall, rise": "〰️", "fall, rise, fall": "🌊" } },
        { face: "curve", slider: "height", points: 5, title: "The film's road, high or low" },
        { face: "dial", slider: "peakPlace" },
      ],
      groups: [
        { label: "Right now", sliders: ["setting", "height", "steep", "grip"] },
        { label: "The mix", sliders: ["tension", "laughter", "relief", "alternation"] },
        { label: "Shape of the film", sliders: ["shape", "peakPlace", "breathers"] },
      ],
      presets: [
        { label: "Die Hard rollercoaster", plain: "Up, down, up again, swapping light and dark every scene.", set: { shape: "rise, fall, rise", alternation: "every scene", tension: 5, grip: 5 } },
        { label: "Feel-good comedy", plain: "Falls for a while, then rises to a warm finish.", set: { shape: "fall then rise", laughter: 4, relief: 4, breathers: "regular" } },
        { label: "Slow-burn tragedy", plain: "A steady slide with little relief.", set: { shape: "riches to rags", alternation: "steady", laughter: 0, breathers: "few" } },
      ],
    },
  });

  W.add("emoTurn", {
    sliders: [
      ["when", "When in the scene it turns", [0, 100, "%"], "How far into the scene the feeling changes."],
      ["direction", "Which way it turns", ["darker", "sideways", "lighter"], "Whether the new feeling is heavier, different, or brighter."],
      ["warned", "Seen coming", ["out of nowhere", "a hint first", "we see it coming"], "How much the audience is prepared for the turn."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "when" },
        { face: "balance", slider: "direction", left: "Darker", right: "Lighter" },
      ],
      groups: [
        { label: "The turn", sliders: ["setting", "direction", "trigger"] },
        { label: "Timing", sliders: ["when", "speed", "warned"] },
      ],
      presets: [
        { label: "Rug-pull reveal", plain: "News flips the feeling in an instant, out of nowhere.", set: { setting: "flips", trigger: "news", speed: 5, warned: "out of nowhere", when: 85 } },
        { label: "Slow thaw", plain: "A look slowly softens them over the scene.", set: { setting: "shifts", trigger: "a look", speed: 1, direction: "lighter", warned: "a hint first" } },
        { label: "Hold the line", plain: "The feeling stays put no matter what.", set: { setting: "holds", speed: 0 } },
      ],
    },
  });

  W.add("emoRelease", {
    sliders: [
      ["heldBefore", "Fought back for", [0, 60, "s"], "How long they hold it in before it finally comes out."],
      ["fightsIt", "Fights it or lets go", ["fights it hard", "fights it", "gives in", "lets it all go"], "How much they struggle against the release."],
      ["witnessed", "Who sees it", ["no one", "the audience only", "one person", "everyone"], "Whether the release happens alone or in front of others."],
      ["lasts", "How long it lasts", [0, 30, "s"], "How long the release goes on once it starts."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "how", icons: { "it doesn't": "😶", "a sigh": "😮‍💨", tears: "😢", "a laugh": "😂", "a shout": "😡", "an action": "💥" } },
        { face: "dial", slider: "size" },
        { face: "balance", slider: "fightsIt", left: "Fights it", right: "Lets go" },
      ],
      groups: [
        { label: "The release", sliders: ["how", "size", "after"] },
        { label: "Before and during", sliders: ["heldBefore", "fightsIt", "lasts"] },
        { label: "Witnesses", sliders: ["witnessed"] },
      ],
      presets: [
        { label: "Good Will Hunting breakdown", plain: "Held for a long time, then tears in front of one person.", set: { how: "tears", size: 5, heldBefore: 50, fightsIt: "lets it all go", witnessed: "one person", after: "changed" } },
        { label: "Stiff upper lip", plain: "Just a sigh, fought hard, seen by no one.", set: { how: "a sigh", size: 1, fightsIt: "fights it hard", witnessed: "no one", after: "the same" } },
        { label: "Laughing through tears", plain: "The pressure comes out as a laugh, and things feel lighter.", set: { how: "a laugh", size: 3, after: "lighter", witnessed: "everyone" } },
      ],
    },
  });

  W.add("audienceFeeling", {
    sliders: [
      ["strength", "How strongly we feel it", [0, 5, ""], "How hard the feeling hits the audience."],
      ["lean", "Lean in or pull back", ["pulling back", "watching", "leaning in", "on the edge of the seat"], "How much the scene grabs the audience's attention."],
      ["lands", "When it lands for us", ["before them", "with them", "after them"], "Whether we feel it before the character does, at the same time, or later."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "why", icons: { "we feel with them": "🤝", "we know more": "🔭", "we know less": "❓", "we see the funny side": "😄" } },
        { face: "ladder", slider: "lean" },
        { face: "dial", slider: "strength" },
      ],
      groups: [
        { label: "Our feeling", sliders: ["match", "strength", "why"] },
        { label: "Holding us", sliders: ["lean", "lands"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Hitchcock bomb under the table", plain: "We know what they don't, and squirm before they do.", set: { match: "different", why: "we know more", lean: "on the edge of the seat", lands: "before them", strength: 5 } },
        { label: "Cringe comedy", plain: "They're mortified, we laugh.", set: { match: "the opposite", why: "we see the funny side", lean: "leaning in" } },
        { label: "Cry with them", plain: "We feel exactly what they feel, at the same moment.", set: { match: "the same", why: "we feel with them", lands: "with them" } },
      ],
    },
  });

  W.add("catharsis", {
    sliders: [
      ["earned", "How earned it feels", ["unearned", "partly", "fully earned"], "Whether the story has paid for this release."],
      ["surprise", "Expected or sudden", ["long expected", "half expected", "sudden"], "Whether we see the release coming."],
      ["settle", "Quiet after it", [0, 120, "s"], "How long the film lets the release sink in before moving on."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "tiles", slider: "through", icons: { tears: "😭", laughter: "😂", "a fight": "🥊", "a confession": "💬", music: "🎵" } },
        { face: "ladder", slider: "earned" },
      ],
      groups: [
        { label: "The release", sliders: ["size", "through", "shared"] },
        { label: "The wait", sliders: ["wait", "earned", "surprise"] },
        { label: "After", sliders: ["settle"] },
      ],
      presets: [
        { label: "Shawshank rain", plain: "A huge release, held almost the whole film, carried by music.", set: { size: 5, wait: 90, shared: "one character", through: "music", earned: "fully earned", settle: 60 } },
        { label: "Rom-com airport confession", plain: "Two people finally say it.", set: { size: 4, shared: "two", through: "a confession", surprise: "long expected" } },
        { label: "Final whistle", plain: "Everyone lets go at once.", set: { size: 5, shared: "everyone", through: "tears", surprise: "half expected" } },
      ],
    },
  });

  W.add("hope", {
    sliders: [
      ["rests", "What the hope rests on", ["luck", "a plan", "a person", "faith", "nothing at all"], "What they're counting on to make it work.", { unordered: true }],
      ["dashed", "How hard it's taken away", ["kept", "dented", "dashed", "crushed"], "How badly the scene damages the hope."],
      ["returns", "Comes back after", [0, 20, "scenes"], "How many scenes until hope returns after a blow."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "ladder", slider: "fragile" },
        { face: "tiles", slider: "rests", icons: { luck: "🍀", "a plan": "🗺️", "a person": "🧑", faith: "🙏", "nothing at all": "🌫️" } },
      ],
      groups: [
        { label: "The hope", sliders: ["level", "whose", "rests"] },
        { label: "How safe it is", sliders: ["fragile", "dashed", "returns"] },
      ],
      presets: [
        { label: "Shawshank hope", plain: "Shaky but alive, resting on faith.", set: { level: 4, fragile: "shaky", rests: "faith", dashed: "kept" } },
        { label: "Empire Strikes Back low", plain: "Hope crushed, and it won't come back soon.", set: { level: 0, dashed: "crushed", returns: 15 } },
        { label: "Underdog with a plan", plain: "A team that thinks it might just work.", set: { level: 3, rests: "a plan", fragile: "hanging by a thread", whose: "both" } },
      ],
    },
  });

  W.add("falseHigh", {
    sliders: [
      ["turnBy", "What turns it", ["a reveal", "a betrayal", "a mistake", "bad luck"], "What shows the win (or loss) wasn't real.", { unordered: true }],
      ["placed", "Where in the film", [0, 100, "% through the film"], "When the false high or low happens."],
      ["clues", "Clues it's false", ["none", "one hint", "several hints"], "How much the film warns us that it won't last."],
      ["crash", "How hard the fall", [0, 5, ""], "How big the turn is when it comes."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "kind", left: "False low", right: "False high" },
        { face: "dial", slider: "placed" },
        { face: "tiles", slider: "turnBy", icons: { "a reveal": "🎭", "a betrayal": "🗡️", "a mistake": "🤦", "bad luck": "🎲" } },
      ],
      groups: [
        { label: "The false moment", sliders: ["kind", "size", "placed"] },
        { label: "The turn", sliders: ["turnBy", "undone", "crash", "clues"] },
      ],
      presets: [
        { label: "Midpoint victory", plain: "They seem to win halfway through, then it turns.", set: { kind: "false high", placed: 50, undone: 5, crash: 4, clues: "one hint" } },
        { label: "All is lost, but not really", plain: "A false low near the end before the comeback.", set: { kind: "false low", placed: 75, size: 5 } },
        { label: "Betrayal at the party", plain: "Everything looks perfect until a friend turns.", set: { kind: "false high", turnBy: "a betrayal", clues: "several hints", crash: 5 } },
      ],
    },
  });

  W.add("twoRoads", {
    sliders: [
      ["crossAt", "Where the roads cross", [0, 100, "% through the film"], "When the two characters' fortunes meet or swap."],
      ["ahead", "Who's higher now", ["the first", "even", "the second"], "Which of the two is better off in this scene."],
      ["linked", "One causes the other", ["unrelated", "loosely", "directly"], "Whether one rising is what makes the other fall."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "ahead", left: "First", right: "Second" },
        { face: "tiles", slider: "relation", icons: { opposite: "↕️", crossing: "❌", apart: "↔️", parallel: "⏸️", together: "🤝" } },
        { face: "dial", slider: "crossAt" },
      ],
      groups: [
        { label: "The two roads", sliders: ["relation", "gap", "ahead"] },
        { label: "Over the film", sliders: ["crossAt", "linked"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Trading Places swap", plain: "One rises as the other falls, crossing halfway.", set: { relation: "crossing", crossAt: 50, linked: "directly" } },
        { label: "Thelma and Louise", plain: "Two friends on the same road, side by side.", set: { relation: "together", gap: 1, ahead: "even" } },
        { label: "Bitter rivals", plain: "When one is up, the other is down.", set: { relation: "opposite", gap: 8, linked: "directly" } },
      ],
    },
  });

  W.add("dread", {
    sliders: [
      ["of", "Dread of what", ["a person", "a secret coming out", "a place", "time running out", "the unknown"], "What the bad feeling is about.", { unordered: true }],
      ["payoff", "Does it come", ["never comes", "smaller than feared", "as feared", "worse than feared"], "How the dreaded thing pays off when it arrives."],
      ["reminders", "Reminders of it", [0, 10, ""], "How many times the film nudges us about what's coming."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "ladder", slider: "known" },
        { face: "tiles", slider: "of", icons: { "a person": "👤", "a secret coming out": "🤫", "a place": "🏚️", "time running out": "⏳", "the unknown": "🌑" } },
      ],
      groups: [
        { label: "The dread", sliders: ["level", "of", "known"] },
        { label: "Building it", sliders: ["scenes", "reminders"] },
        { label: "The payoff", sliders: ["payoff"] },
      ],
      presets: [
        { label: "Jaws: the shark unseen", plain: "We guess what's out there and are reminded often.", set: { known: "a guess", of: "the unknown", scenes: 12, reminders: 6, level: 4 } },
        { label: "Hitchcock clock", plain: "We know exactly when it goes off.", set: { known: "exactly", of: "time running out", level: 5 } },
        { label: "The lie is coming out", plain: "Comedy dread: the truth will surface, and it'll be worse.", set: { of: "a secret coming out", payoff: "worse than feared", level: 3, known: "exactly" } },
      ],
    },
  });

  W.add("emotionIntensity", {
    sliders: [
      ["fade", "How it fades", ["snaps off", "drops quickly", "fades slowly", "lingers"], "What the feeling does after its peak."],
      ["peakAt", "Where the peak falls", [0, 100, "% of the scene"], "When in the scene the feeling is strongest."],
      ["contain", "Held in or let out", ["held in", "barely contained", "let out"], "Whether the strength shows on the surface."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "curve", slider: "setting", points: 4 },
        { face: "pad", x: "peakAt", y: "peakHold", xLabel: "When it peaks", yLabel: "How long it holds" },
        { face: "ladder", slider: "build" },
      ],
      groups: [
        { label: "Strength", sliders: ["setting", "contain"] },
        { label: "Shape over time", sliders: ["build", "peakAt", "peakHold", "fade"] },
      ],
      presets: [
        { label: "Slow burn", plain: "Builds slowly to an overwhelming peak at the end.", set: { setting: 5, build: "slowly", peakAt: 90, fade: "lingers" } },
        { label: "Jump-scare spike", plain: "All at once, then gone.", set: { setting: 5, build: "all at once", fade: "snaps off", peakHold: 1 } },
        { label: "Quiet ache", plain: "A low feeling held in the whole time.", set: { setting: 2, build: "steadily", contain: "held in", fade: "lingers" } },
      ],
    },
  });

  W.add("emoActions", {
    sliders: [
      ["aimedAt", "Aimed at", ["themselves", "an object", "the other person", "the room"], "Where the action is directed, from inward to outward."],
      ["regret", "How they feel after", ["proud of it", "stands by it", "embarrassed", "takes it back"], "Whether they own the action or wish they hadn't."],
      ["escalate", "Builds through the scene", ["shrinks", "steady", "grows", "explodes"], "Whether the actions get bigger as the scene goes on."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "object", icons: { "no object": "🫥", "touches it": "👆", "grips it": "✊", "throws or breaks it": "💥" } },
      ],
      groups: [
        { label: "The action", sliders: ["setting", "object", "aimedAt"] },
        { label: "Over the scene", sliders: ["escalate", "regret"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Slapstick blow-up", plain: "Small fidgets grow until something breaks.", set: { setting: "drastic", object: "throws or breaks it", escalate: "explodes", regret: "embarrassed" } },
        { label: "Ozu stillness", plain: "Tiny gestures carry everything.", set: { setting: "small", object: "touches it", escalate: "steady" } },
        { label: "Plate-smashing fight", plain: "Big actions aimed at the whole room.", set: { setting: "big", aimedAt: "the room", object: "throws or breaks it", regret: "stands by it" } },
      ],
    },
  });

  W.add("emoContrastPrev", {
    sliders: [
      ["darker", "Darker or lighter", ["much darker", "darker", "same", "lighter", "much lighter"], "Which way the feeling moves from the scene before."],
      ["jolt", "Jolt to the audience", [0, 5, ""], "How hard the change wakes the audience up."],
      ["linger", "Old feeling lingers for", [0, 30, "s"], "How long the last scene's feeling hangs on into this one."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "darker", left: "Darker", right: "Lighter" },
        { face: "dial", slider: "jolt" },
        { face: "tiles", slider: "bridge", icons: { "hard cut": "✂️", "a sound carries over": "🔊", "a slow fade": "🌫️", "a matching image": "🪞" } },
      ],
      groups: [
        { label: "The contrast", sliders: ["setting", "darker", "jolt"] },
        { label: "The bridge", sliders: ["bridge", "linger"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Smash cut to comedy", plain: "From grim to silly with a hard cut.", set: { setting: "the opposite", bridge: "hard cut", darker: "much lighter", jolt: 5, linger: 0 } },
        { label: "Gentle dissolve", plain: "A small shift, eased in slowly.", set: { setting: "a little different", bridge: "a slow fade", jolt: 1, linger: 10 } },
        { label: "Party to funeral", plain: "Joy cut straight into grief.", set: { setting: "the opposite", darker: "much darker", bridge: "hard cut", jolt: 5 } },
      ],
    },
  });

  W.add("emoShown", {
    sliders: [
      ["mask", "What they show instead", ["nothing", "a smile", "calm", "anger", "jokes"], "The face they put on over the real feeling.", { unordered: true }],
      ["slips", "Moments it slips out", [0, 8, ""], "How many times the real feeling flickers through."],
      ["dropAt", "When the mask drops", [0, 100, "% of the scene"], "How far into the scene they stop hiding it."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "mask", icons: { nothing: "😐", "a smile": "🙂", calm: "😌", anger: "😠", jokes: "🤡" } },
        { face: "dial", slider: "dropAt" },
      ],
      groups: [
        { label: "How much shows", sliders: ["setting", "mask", "slips"] },
        { label: "To whom, at what cost", sliders: ["toWhom", "cost"] },
        { label: "Timing", sliders: ["dropAt"] },
      ],
      presets: [
        { label: "Remains of the Day", plain: "Everything hidden behind perfect calm.", set: { setting: "fully hidden", mask: "calm", slips: 1, toWhom: "the audience only" } },
        { label: "Sad clown", plain: "Jokes cover the hurt, and it keeps leaking.", set: { setting: "leaks out", mask: "jokes", slips: 5 } },
        { label: "Big confession", plain: "The mask drops late and everyone sees.", set: { setting: "fully shown", toWhom: "everyone", cost: "everything", dropAt: 80 } },
      ],
    },
  });

  W.add("emotionGap", {
    sliders: [
      ["louder", "Who feels it more", ["the first", "even", "the second"], "Which of the two carries the bigger feeling."],
      ["playedFor", "Played for", PLAYED, "Whether the gap makes drama, comedy, or both."],
      ["closeAt", "When it closes", [0, 100, "% of the scene"], "When the two finally meet in the same feeling."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "gap" },
        { face: "balance", slider: "louder", left: "First", right: "Second" },
        { face: "ladder", slider: "closing" },
      ],
      groups: [
        { label: "The gap", sliders: ["gap", "louder", "playedFor"] },
        { label: "Over the scene", sliders: ["closing", "closeAt", "awareness"] },
      ],
      presets: [
        { label: "Odd couple", plain: "One calm, one panicking, for laughs.", set: { gap: 5, playedFor: "comedy", awareness: "one notices", closing: "holding" } },
        { label: "Breakup scene", plain: "The gap widens until it can't be crossed.", set: { gap: 4, playedFor: "drama", closing: "widening", awareness: "both notice" } },
        { label: "Making up", plain: "They find each other by the end.", set: { closing: "closing", closeAt: 85, awareness: "both notice" } },
      ],
    },
  });

  W.add("subtext", {
    sliders: [
      ["tells", "Little giveaways", [0, 8, ""], "How many small slips hint at what they really mean."],
      ["truthOut", "When the truth comes out", ["never", "at the very end", "partway", "early on"], "Whether the real meaning is ever said out loud, and how soon."],
      ["playedFor", "Played for", PLAYED, "Whether the gap is painful, funny, or both."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "gap" },
        { face: "tiles", slider: "leak", icons: { "the eyes": "👀", "the hands": "✋", "a pause": "⏸️", "the voice": "🗣️" } },
        { face: "balance", slider: "playedFor", left: "Drama", right: "Comedy" },
      ],
      groups: [
        { label: "Said against meant", sliders: ["gap", "playedFor"] },
        { label: "Giving it away", sliders: ["leak", "tells", "caught"] },
        { label: "Timing", sliders: ["truthOut"] },
      ],
      presets: [
        { label: "'I'm fine' through tears", plain: "Says the opposite, and the eyes betray it.", set: { gap: "the opposite", leak: "the eyes", caught: "the other character", playedFor: "drama" } },
        { label: "Pinter pause", plain: "Menace lives in the silences, never spoken.", set: { gap: "far apart", leak: "a pause", truthOut: "never", tells: 4 } },
        { label: "Jane Austen manners", plain: "Polite words, sharp meaning, only we catch it.", set: { gap: "far apart", caught: "the audience", playedFor: "both", leak: "the voice" } },
      ],
    },
  });

  W.add("emotionalDebt", {
    sliders: [
      ["what", "What is held in", ["grief", "anger", "love", "fear", "shame"], "The feeling they keep swallowing.", { unordered: true }],
      ["leaks", "Small leaks", [0, 5, ""], "How often a little of it escapes before the big release."],
      ["breaking", "How close to breaking", ["far off", "building", "close", "about to burst"], "How near they are to letting it all out."],
      ["dueAt", "When it comes due", [0, 100, "% through the film"], "When the held-in feeling finally has to come out."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "held" },
        { face: "tiles", slider: "what", icons: { grief: "🖤", anger: "🔥", love: "❤️", fear: "😨", shame: "🙈" } },
        { face: "ladder", slider: "breaking" },
      ],
      groups: [
        { label: "What's held", sliders: ["held", "what", "leaks"] },
        { label: "Over time", sliders: ["scenes", "breaking", "dueAt"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Manchester by the Sea grief", plain: "Huge grief, almost never let out.", set: { what: "grief", held: 5, leaks: 1, breaking: "building" } },
        { label: "Basil Fawlty pressure cooker", plain: "Anger leaks constantly and is about to blow.", set: { what: "anger", held: 4, leaks: 4, breaking: "about to burst" } },
        { label: "Unspoken love", plain: "Love held in until late in the film.", set: { what: "love", held: 4, dueAt: 90, leaks: 2 } },
      ],
    },
  });

  W.add("feelingEcho", {
    sliders: [
      ["likeness", "How exact the repeat", ["a loose nod", "close", "shot for shot"], "How closely the echo copies the original moment."],
      ["seeded", "How strongly it was planted", [0, 5, ""], "How firmly the first moment was fixed in our memory."],
      ["landsOn", "Lands on", ["a quiet beat", "the turn", "the final image"], "Which kind of moment the echo is saved for."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "tiles", slider: "through", icons: { music: "🎵", "a place": "📍", "an object": "🧸", "a line": "💬", "a shot": "🎬" } },
        { face: "ladder", slider: "changed" },
      ],
      groups: [
        { label: "The echo", sliders: ["strength", "through", "likeness"] },
        { label: "Setup and payoff", sliders: ["seeded", "gap", "landsOn"] },
        { label: "Meaning", sliders: ["changed"] },
      ],
      presets: [
        { label: "Up's married-life theme", plain: "The same music returns, meaning more.", set: { through: "music", changed: "deeper", gap: 30, strength: 5 } },
        { label: "Bookend shot", plain: "The opening image repeats as the last one.", set: { through: "a shot", likeness: "shot for shot", landsOn: "the final image" } },
        { label: "Callback line", plain: "An old line comes back and means the opposite.", set: { through: "a line", changed: "the opposite", likeness: "close", landsOn: "the turn" } },
      ],
    },
  });

  W.add("warmth", {
    sliders: [
      ["touch", "Touch between them", ["none", "accidental", "a hand", "a hug"], "How much physical warmth they share."],
      ["teasing", "How they tease", ["none", "barbed", "playful", "in-jokes"], "The kind of ribbing between them.", { unordered: true }],
      ["trust", "Trust", [0, 5, ""], "How much they rely on each other."],
      ["turnAt", "Turning point", [0, 100, "% through the story"], "When the relationship changes direction."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "level", left: "Cold", right: "Warm" },
        { face: "ladder", slider: "trend" },
        { face: "pad", x: "level", y: "trust", xLabel: "Warmth", yLabel: "Trust" },
      ],
      groups: [
        { label: "How warm", sliders: ["level", "trust", "touch", "teasing"] },
        { label: "Over the story", sliders: ["trend", "turnAt"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Enemies to lovers", plain: "Cold and barbed, then warming fast past the middle.", set: { level: -4, trend: "warming fast", teasing: "barbed", turnAt: 60 } },
        { label: "Lost in Translation", plain: "Strangers slowly warming, barely touching.", set: { level: 1, trend: "warming", touch: "a hand", teasing: "playful" } },
        { label: "Marriage Story", plain: "Once close, now cooling.", set: { level: 2, trend: "cooling", trust: 1, touch: "accidental" } },
      ],
    },
  });

  W.add("emoVoice", {
    sliders: [
      ["volume", "Loudness", ["whisper", "quiet", "normal", "raised", "shouting"], "How loud the feeling makes them."],
      ["pauses", "Pauses", [0, 5, ""], "How often they stop mid-thought."],
      ["breath", "Breathing", ["steady", "shallow", "catching", "ragged"], "What the feeling does to their breath."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["pace", "pauses"] },
        { face: "tiles", slider: "volume", icons: { whisper: "🤫", quiet: "🔈", normal: "🔉", raised: "🔊", shouting: "📢" } },
      ],
      groups: [
        { label: "How much shows", sliders: ["setting", "crack", "breath"] },
        { label: "Sound of it", sliders: ["pitch", "volume"] },
        { label: "Rhythm", sliders: ["pace", "pauses"] },
      ],
      presets: [
        { label: "Holding it together", plain: "Quiet, steady, with a catch now and then.", set: { setting: "a hint", crack: "catches", volume: "quiet", breath: "shallow" } },
        { label: "Breaking down", plain: "The voice cracks and the breath goes ragged.", set: { setting: "overflowing", crack: "breaks", pitch: "breaking", breath: "ragged" } },
        { label: "Cold fury", plain: "Low, slow, and dangerously calm.", set: { setting: "clear", pitch: "low", pace: 1, volume: "quiet", breath: "steady" } },
      ],
    },
  });

  W.add("wordsAmount", {
    sliders: [
      ["silence", "Longest silence", [0, 30, "s"], "The longest stretch where no one speaks."],
      ["whoTalks", "Who does the talking", ["one person", "mostly one", "shared", "everyone at once"], "How the words are spread between people."],
      ["trend", "Over the scene", ["drying up", "steady", "picking up", "torrent"], "Whether the talk thins out or speeds up."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "trend" },
        { face: "balance", slider: "onTopic", left: "Talks around it", right: "Says it plainly" },
      ],
      groups: [
        { label: "How much", sliders: ["setting", "silence", "whoTalks"] },
        { label: "What's said", sliders: ["onTopic", "interrupt"] },
        { label: "Over the scene", sliders: ["trend"] },
      ],
      presets: [
        { label: "Sorkin walk-and-talk", plain: "Nonstop rapid talk, cutting each other off.", set: { setting: 5, interrupt: 4, whoTalks: "shared", silence: 0 } },
        { label: "Malick quiet", plain: "Almost nothing said, long silences.", set: { setting: 0, silence: 30, trend: "drying up" } },
        { label: "Altman overlap", plain: "Everyone talking at once.", set: { setting: 5, whoTalks: "everyone at once", interrupt: 5 } },
      ],
    },
  });

  W.add("emoSpread", {
    sliders: [
      ["passes", "How it passes", ["a look", "a laugh", "words", "touch", "a shout"], "What carries the feeling from one person to the next.", { unordered: true }],
      ["grows", "Grows as it spreads", ["fades", "stays", "grows"], "Whether the feeling weakens or swells as it travels."],
      ["reachesUs", "Reaches the audience", ["no", "a little", "fully"], "Whether the feeling spreads out of the screen to us too."],
      ["holdout", "Someone holds out", ["no one", "one person", "many"], "Whether anyone resists catching it."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "speed" },
        { face: "tiles", slider: "passes", icons: { "a look": "👀", "a laugh": "😂", words: "💬", touch: "🤝", "a shout": "📢" } },
      ],
      groups: [
        { label: "How far", sliders: ["setting", "speed", "grows"] },
        { label: "How it passes", sliders: ["passes", "holdout", "reachesUs"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Contagious laughter", plain: "One giggle takes over the whole room, and us.", set: { setting: "the whole room", passes: "a laugh", grows: "grows", reachesUs: "fully" } },
        { label: "Panic on the beach", plain: "A shout spreads fear fast.", set: { setting: "the whole room", passes: "a shout", speed: 5, grows: "grows" } },
        { label: "The one calm person", plain: "Everyone catches it except one.", set: { setting: "a few", holdout: "one person", grows: "stays" } },
      ],
    },
  });

  W.add("mixedFeelings", {
    sliders: [
      ["first", "The first feeling", ["joyful", "loving", "curious", "melancholy", "anxious", "fearful", "angry"], "The feeling that comes first.", { unordered: true }],
      ["switches", "Back-and-forth", [0, 8, ""], "How many times the two trade places in the scene."],
      ["wins", "Which wins by the end", ["the first", "neither", "the second"], "Which feeling is left standing when the scene ends."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "balance", left: "First", right: "Second" },
        { face: "tiles", slider: "first", icons: { joyful: "😄", loving: "🥰", curious: "🤔", melancholy: "🥲", anxious: "😬", fearful: "😨", angry: "😠" } },
        { face: "dial", slider: "switches" },
      ],
      groups: [
        { label: "The two feelings", sliders: ["first", "second", "balance"] },
        { label: "On screen", sliders: ["shown", "switches", "wins"] },
      ],
      presets: [
        { label: "Wedding tears", plain: "Happy and sad in equal measure.", set: { first: "joyful", second: "melancholy", balance: "even", shown: "both clearly" } },
        { label: "Rollercoaster", plain: "Scared and thrilled, flipping back and forth.", set: { first: "fearful", second: "joyful", switches: 6, wins: "the second" } },
        { label: "Inside Out ending", plain: "Joy with a flicker of sadness that stays.", set: { first: "joyful", second: "melancholy", balance: "mostly the first", shown: "a flicker of the second", wins: "neither" } },
      ],
    },
  });

  W.add("personalSpace", {
    sliders: [
      ["movement", "Over the scene", ["pulling apart", "holding", "drifting closer", "closing in"], "Whether the distance grows or shrinks as the scene goes on."],
      ["barrier", "Something between them", ["nothing", "a small thing", "a table", "a wall or door"], "An object that keeps them apart."],
      ["holdTime", "How long they hold it", [0, 30, "s"], "How long they stay at this distance before someone moves."],
    ],
    window: {
      faces: [
        { face: "stage", title: "How close, from above", tokens: [{ who: "person" }, { who: "person", about: 0, distance: "setting" }, { who: "camera" }], fallback: { face: "ladder", slider: "distance" } },
        { face: "balance", slider: "comfort", left: "Uncomfortable", right: "Wants closer" },
        { face: "tiles", slider: "barrier", icons: { nothing: "⬜", "a small thing": "☕", "a table": "🪑", "a wall or door": "🚪" } },
      ],
      groups: [
        { label: "The distance", sliders: ["distance", "barrier", "comfort"] },
        { label: "Over the scene", sliders: ["movement", "who", "holdTime"] },
      ],
      presets: [
        { label: "Elevator awkwardness", plain: "Too close, and both hate it.", set: { distance: "close", comfort: "very uncomfortable", movement: "holding", who: "no one" } },
        { label: "The almost-kiss", plain: "Close and drifting closer, holding the moment.", set: { distance: "close", comfort: "wants closer", movement: "closing in", holdTime: 10 } },
        { label: "Across the dinner table", plain: "A table keeps them apart.", set: { distance: "apart", barrier: "a table", comfort: "uneasy" } },
      ],
    },
  });

  W.add("breather", {
    sliders: [
      ["soonAfter", "How soon after the big moment", ["right away", "a beat later", "a scene later"], "How quickly the rest follows the big scene."],
      ["calmBefore", "Calm before the storm", ["just a rest", "a hint of what's coming", "a clear calm before"], "Whether the rest also warns us something bigger is near."],
      ["grip", "Still holds us", [0, 5, ""], "How much the quiet scene keeps the audience leaning in."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "rest" },
        { face: "tiles", slider: "kind", icons: { quiet: "🤫", "a joke": "😄", "something beautiful": "🌅", "everyday life": "☕" } },
        { face: "ladder", slider: "calmBefore" },
      ],
      groups: [
        { label: "The rest", sliders: ["rest", "kind", "length"] },
        { label: "Placement", sliders: ["soonAfter", "calmBefore", "grip"] },
      ],
      presets: [
        { label: "Back in the Shire", plain: "Everyday life after the battle.", set: { kind: "everyday life", rest: 5, soonAfter: "a scene later", calmBefore: "just a rest" } },
        { label: "Jaws scar-comparing", plain: "Jokes on the boat before the shark returns.", set: { kind: "a joke", rest: 3, calmBefore: "a clear calm before", grip: 4 } },
        { label: "Ozu pillow shot", plain: "A beautiful still image to breathe.", set: { kind: "something beautiful", length: 1, soonAfter: "right away" } },
      ],
    },
  });

  W.add("emoMove", {
    sliders: [
      ["pace", "Speed", [0, 5, ""], "How quickly they move."],
      ["toward", "Toward or away", ["away from others", "in place", "toward others"], "Whether the feeling pushes them away or pulls them in."],
      ["space", "Space they take up", ["shrinking", "normal", "expanding"], "Whether they make themselves small or big."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "toward", left: "Away", right: "Toward" },
        { face: "tiles", slider: "where", icons: { hands: "✋", shoulders: "🤷", feet: "🦶", "whole body": "🧍" } },
      ],
      groups: [
        { label: "How they move", sliders: ["setting", "pace", "rhythm"] },
        { label: "Where it shows", sliders: ["where", "space", "toward"] },
      ],
      presets: [
        { label: "Frozen in shock", plain: "Stops dead, shrinking.", set: { setting: "frozen", pace: 0, space: "shrinking" } },
        { label: "Pacing the room", plain: "Restless, stop-and-start, whole body.", set: { setting: "restless", rhythm: "stop and start", where: "whole body", pace: 3 } },
        { label: "Victory dance", plain: "Wild, expanding, toward everyone.", set: { setting: "wild", space: "expanding", toward: "toward others", pace: 5 } },
      ],
    },
  });

  W.add("movementAmount", {
    sliders: [
      ["who", "Who moves", ["one person", "a few", "everyone"], "How many people are in motion."],
      ["freeze", "Sudden freezes", ["none", "one", "several"], "Moments where everything stops, which grab our attention."],
      ["trend", "Over the scene", ["settling", "steady", "building", "frantic"], "Whether motion calms down or builds up."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "trend" },
        { face: "tiles", slider: "who", icons: { "one person": "🧍", "a few": "👥", everyone: "👨‍👩‍👧‍👦" } },
      ],
      groups: [
        { label: "How much", sliders: ["setting", "who", "purpose"] },
        { label: "Over the scene", sliders: ["trend", "freeze"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Busy kitchen chaos", plain: "Everyone moving, building to frantic.", set: { setting: 5, who: "everyone", purpose: "busy", trend: "frantic" } },
        { label: "Wes Anderson tableau", plain: "Almost nobody moves.", set: { setting: 0, who: "one person", trend: "steady" } },
        { label: "Freeze on the news", plain: "Busy motion, then everyone stops.", set: { setting: 3, freeze: "one", trend: "settling" } },
      ],
    },
  });

  W.add("postureChanges", {
    sliders: [
      ["biggest", "Biggest shift", ["a lean", "arms folded", "turning away", "standing up", "walking out"], "The largest body change in the scene."],
      ["cue", "When they shift", ["on their own line", "on the other's line", "in the silences"], "What moment sets off the change.", { unordered: true }],
      ["mirror", "Copies the other person", ["opposite", "no", "sometimes", "matches"], "Whether their posture echoes the person they're with."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "direction", left: "Closing up", right: "Opening up" },
        { face: "ladder", slider: "biggest" },
      ],
      groups: [
        { label: "How often and which way", sliders: ["setting", "direction", "biggest"] },
        { label: "With the other", sliders: ["cue", "mirror"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Shutting down", plain: "Arms fold, they turn away.", set: { direction: "closing up", biggest: "turning away", mirror: "opposite", setting: 3 } },
        { label: "Falling into sync", plain: "They start copying each other as they warm up.", set: { direction: "opening up", mirror: "matches", setting: 4, cue: "on the other's line" } },
        { label: "The walk-out", plain: "One big move ends it.", set: { setting: 1, biggest: "walking out", direction: "closing up" } },
      ],
    },
  });

  W.add("settingMood", {
    sliders: [
      ["weather", "Weather", ["clear", "grey", "rain", "storm", "snow"], "The sky over the place.", { unordered: true }],
      ["crowd", "How full the place is", ["empty", "sparse", "busy", "packed"], "How many other people fill the place."],
      ["intrude", "Place grabs attention", [0, 5, ""], "How much the place itself pulls our eye away from the people."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "setting", colors: { oppressive: "#3b2f3a", gloomy: "#5a6470", neutral: "#9a9a8c", cozy: "#d9a066", joyful: "#f2c94c" } },
        { face: "balance", slider: "agrees", left: "Fights it", right: "Agrees" },
        { face: "tiles", slider: "weather", icons: { clear: "☀️", grey: "☁️", rain: "🌧️", storm: "⛈️", snow: "❄️" } },
      ],
      groups: [
        { label: "The mood", sliders: ["setting", "agrees", "intrude"] },
        { label: "The place", sliders: ["weather", "crowd"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Rain on the funeral", plain: "Gloomy weather agrees with the grief.", set: { setting: "gloomy", weather: "rain", agrees: "agrees" } },
        { label: "Sunny day, bad news", plain: "A joyful place fights the feeling.", set: { setting: "joyful", weather: "clear", agrees: "fights it", intrude: 3 } },
        { label: "Cozy holiday cabin", plain: "Snow outside, warmth inside.", set: { setting: "cozy", weather: "snow", crowd: "sparse" } },
      ],
    },
  });

  W.add("lightingMood", {
    sliders: [
      ["warmth", "Warm or cool", ["cold blue", "cool", "neutral", "warm", "golden"], "The color temperature of the light."],
      ["shadows", "Shadows", ["flat", "gentle", "strong", "deep"], "How dark and sharp the shadows are."],
      ["shiftAt", "When it changes", [0, 100, "% of the scene"], "When in the scene the light moves with the feeling."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "setting", colors: { "dark and harsh": "#1f1f2e", dim: "#4a4a5a", neutral: "#a0a0a0", soft: "#e6d5c3", "bright and warm": "#ffd27f" } },
        { face: "swatches", slider: "warmth", colors: { "cold blue": "#4a7bd0", cool: "#9bb7d9", neutral: "#d8d8d8", warm: "#f0b878", golden: "#f5a623" } },
        { face: "ladder", slider: "shadows" },
      ],
      groups: [
        { label: "The light", sliders: ["setting", "warmth", "shadows"] },
        { label: "Changing with the feeling", sliders: ["shift", "shiftAt"] },
        { label: "How it shows", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Film noir", plain: "Harsh light and deep shadows.", set: { setting: "dark and harsh", shadows: "deep", warmth: "cool" } },
        { label: "Golden-hour romance", plain: "Bright, warm and soft.", set: { setting: "bright and warm", warmth: "golden", shadows: "gentle" } },
        { label: "Light turns with the news", plain: "Warm at first, going cold on the turn.", set: { setting: "soft", shift: "shifts on the turn", shiftAt: 60, warmth: "warm" } },
      ],
    },
  });

  W.add("emoEyes", {
    sliders: [
      ["holdGaze", "Holds a look for", [0, 10, "s"], "How long they keep eye contact before breaking it."],
      ["agree", "Eyes against the words", ["agree", "a little off", "say the opposite"], "Whether the eyes tell the same story as the mouth."],
      ["dart", "Eyes dart around", [0, 5, ""], "How restlessly the eyes move."],
    ],
    window: {
      faces: [
        { face: "compass", slider: "look", angles: { down: 180, away: 270, "at the other": 90, "through the other": 60, "at the camera": 0 } },
        { face: "ladder", slider: "wet" },
        { face: "dial", slider: "holdGaze" },
      ],
      groups: [
        { label: "Where they look", sliders: ["look", "holdGaze", "dart"] },
        { label: "The eyes themselves", sliders: ["wet", "wide", "blinks"] },
        { label: "Against the words", sliders: ["agree"] },
      ],
      presets: [
        { label: "Fourth-wall glance", plain: "A look straight at us, Fleabag-style.", set: { look: "at the camera", holdGaze: 2, agree: "say the opposite" } },
        { label: "Holding back tears", plain: "Glassy eyes, looking away.", set: { look: "away", wet: "welling", blinks: 4, dart: 2 } },
        { label: "Thousand-yard stare", plain: "Looking through the other, unblinking.", set: { look: "through the other", blinks: 0, holdGaze: 10, dart: 0 } },
      ],
    },
  });

  W.add("emoHands", {
    sliders: [
      ["touches", "What they touch", ["nothing", "their own body", "an object", "the other person"], "Where the hands go."],
      ["quick", "How quick", [0, 5, ""], "How fast the hands move."],
      ["framed", "Shown to us", ["out of frame", "in the picture", "in close-up"], "How much the camera points us at the hands."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "doing", icons: { still: "🤚", fidget: "🫳", clench: "✊", hide: "🙈", "touch the face": "🤦", "reach out": "🤲" } },
        { face: "dial", slider: "tension" },
        { face: "ladder", slider: "framed" },
      ],
      groups: [
        { label: "What the hands do", sliders: ["doing", "touches", "tension", "quick"] },
        { label: "Seen by us", sliders: ["framed", "noticeable", "change"] },
      ],
      presets: [
        { label: "Nervous interview", plain: "Fidgeting fast with an object.", set: { doing: "fidget", touches: "an object", quick: 4, tension: 3 } },
        { label: "Clenched in close-up", plain: "A tight fist the camera makes sure we see.", set: { doing: "clench", tension: 5, framed: "in close-up", quick: 0 } },
        { label: "Reaching out", plain: "A hand slowly finds the other person.", set: { doing: "reach out", touches: "the other person", quick: 1, framed: "in close-up" } },
      ],
    },
  });

  /* Face and feelings (feelingFaceLens, rig/faces.js): six feelings a 3D face mixes, and where the eyes look. */
  W.add("feelingFaceLens", {
    window: {
      faces: [
        { face: "mixer", sliders: ["happy", "sad", "angry", "scared", "surprised", "disgust"] },
        { face: "tiles", slider: "look", icons: { ahead: "😐", left: "👈", right: "👉", up: "👆", down: "👇", "at the camera": "📷" } },
      ],
      groups: [
        { label: "Good feelings", sliders: ["happy", "surprised"] },
        { label: "Hard feelings", sliders: ["sad", "angry", "scared", "disgust"] },
        { label: "The eyes", sliders: ["look"] },
      ],
      presets: [
        { label: "Big happy grin", plain: "Pure joy, looking right at us.", set: { happy: "very", sad: "not at all", angry: "not at all", look: "at the camera" } },
        { label: "Horror scream", plain: "Terrified and shocked at once.", set: { scared: "very", surprised: "clearly", happy: "not at all" } },
        { label: "Smiling through tears", plain: "Happy and sad mixed, eyes down.", set: { happy: "a little", sad: "clearly", look: "down" } },
        { label: "Silent fury", plain: "Angry and a little disgusted, eyes fixed to one side.", set: { angry: "very", disgust: "a little", look: "left" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
