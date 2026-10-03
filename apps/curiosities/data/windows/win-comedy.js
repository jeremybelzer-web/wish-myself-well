/* Comedy: a window for every curiosity whose home is Comedy on the Screen. */
(function (W) {
  W.add("mixPlot", {
    sliders: [
      ["fuse", "When the trouble starts", ["at the last second", "late", "midway", "early", "right away"], "How soon in the scene these people start bending the plot."],
      ["spread", "How fast it spreads", ["contained", "trickles", "spreads", "wildfire"], "Whether the mess stays small or pulls in everything around it."],
      ["seenComing", "Audience sees it coming", ["no", "a moment before", "well before"], "Spotting the trouble before the characters do turns surprise into delicious suspense."],
      ["fixable", "How hard to fix", ["easily", "with effort", "barely", "no way back"], "How much work it takes to put the plot back on track."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "who", icons: { "the pair": "👯", "the newcomer": "🚪", "the group": "👥", everyone: "🌪️" } },
        { face: "pad", x: "fuse", y: "spread", xLabel: "When it starts", yLabel: "How far it spreads" },
      ],
      groups: [
        { label: "The damage", sliders: ["setting", "spread", "fixable"] },
        { label: "Whose fault", sliders: ["who", "blame"] },
        { label: "Timing and the audience", sliders: ["fuse", "seenComing"] },
      ],
      presets: [
        { label: "Farce domino", plain: "One newcomer knocks the whole evening over, and everyone gets blamed.", set: { setting: "a collapse", who: "the newcomer", blame: "everyone", spread: "wildfire", fuse: "early" } },
        { label: "Buddy-movie detour", plain: "The pair's bickering sends the trip somewhere new, but it can be fixed.", set: { setting: "a detour", who: "the pair", fixable: "with effort", spread: "trickles" } },
        { label: "Slow-dawning disaster", plain: "We see the trouble long before they do, and it lands late.", set: { setting: "a turn", seenComing: "well before", fuse: "late", fixable: "no way back" } },
      ],
    },
  });

  W.add("comicFlaw", {
    sliders: [
      ["trigger", "How easily it's set off", ["takes a lot", "now and then", "the smallest thing", "always on"], "How little it takes for the flaw to take over."],
      ["cost", "What the flaw costs them", ["nothing", "some pride", "a friend", "the goal", "everything"], "What they lose each time the flaw wins."],
      ["firstShown", "When we first see the flaw", ["in the crisis", "slowly over the film", "first scene", "opening shot"], "How early the film shows us what is wrong with them."],
      ["byTheEnd", "By the end", ["worse than ever", "unchanged", "cracks a little", "overcomes it"], "Whether the flaw wins or loses by the last scene."],
      ["likeable", "How much we like them anyway", [0, 5, ""], "Warmth that keeps the audience on their side while the flaw makes them ridiculous."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "flaw", icons: { vanity: "🪞", greed: "💰", cowardice: "🐔", pride: "🦚", cluelessness: "🤷", laziness: "🛋️", neediness: "🥺", rigidity: "📏" } },
        { face: "ladder", slider: "blind" },
        { face: "pad", x: "size", y: "likeable", xLabel: "How big the flaw", yLabel: "How much we like them" },
      ],
      groups: [
        { label: "The flaw", sliders: ["flaw", "size", "blind", "trigger"] },
        { label: "What it costs", sliders: ["cost", "likeable"] },
        { label: "Over the film", sliders: ["firstShown", "byTheEnd"] },
      ],
      presets: [
        { label: "Basil Fawlty meltdown", plain: "Pride and panic, completely blind, set off by anything.", set: { flaw: "pride", blind: "completely blind", size: 5, trigger: "the smallest thing", byTheEnd: "worse than ever" } },
        { label: "Lovable coward", plain: "Scared of everything but we adore them, and they find courage at the end.", set: { flaw: "cowardice", likeable: 5, blind: "half sees it", byTheEnd: "overcomes it" } },
        { label: "Michael Scott neediness", plain: "Needs to be loved, never sees it, costs him friends.", set: { flaw: "neediness", blind: "completely blind", cost: "a friend", likeable: 4, firstShown: "opening shot" } },
      ],
    },
  });

  W.add("comicPremise", {
    sliders: [
      ["clearBy", "When the premise is clear", ["midway", "first scene", "first minute", "first line"], "How soon the audience understands the funny 'what if'."],
      ["rules", "Sticks to its own rules", ["anything goes", "loosely", "strictly"], "Whether the premise keeps its own logic, which makes the jokes sharper."],
      ["newAngles", "Fresh angles on it", [0, 8, ""], "How many different situations the premise gets tested in."],
      ["stakes", "What's riding on it", ["nothing", "pride", "a job", "a relationship", "life and death"], "What the characters stand to lose, which makes the silliness matter."],
      ["hook", "How hard the premise grabs", [0, 5, ""], "How strongly the 'what if' makes the audience need to see what happens next."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "clarity" },
        { face: "balance", slider: "grounded", left: "cartoon", right: "real" },
        { face: "mixer", sliders: ["clarity", "mined", "newAngles", "hook"] },
      ],
      groups: [
        { label: "The idea", sliders: ["clarity", "clearBy", "hook"] },
        { label: "The world around it", sliders: ["grounded", "rules", "stakes"] },
        { label: "How far it is pushed", sliders: ["mined", "newAngles"] },
      ],
      presets: [
        { label: "Groundhog Day engine", plain: "A crystal-clear premise, strict rules, tested in every way possible.", set: { clarity: 5, rules: "strictly", grounded: "real", mined: 5, newAngles: 8, clearBy: "first scene" } },
        { label: "Sketch show blackout", plain: "Clear from the first line, pushed fast, nothing riding on it.", set: { clearBy: "first line", clarity: 5, grounded: "heightened", stakes: "nothing", newAngles: 3 } },
        { label: "Life-or-death silly", plain: "An absurd 'what if' with real stakes, like a hitman afraid of dogs.", set: { stakes: "life and death", grounded: "real", hook: 5, mined: 4 } },
      ],
    },
  });

  W.add("escalatingLie", {
    sliders: [
      ["liarSkill", "How good a liar", ["terrible", "shaky", "smooth", "a natural"], "A bad liar sweats from the start; a good one makes the fall bigger."],
      ["fooled", "People who must be fooled", [1, 10, "people"], "Every new person to fool adds a plate to keep spinning."],
      ["madeUp", "Made-up details", ["none", "a few", "too many", "a whole fake life"], "How much invented detail they pile on to keep it believable."],
      ["collapseHow", "How it collapses", ["one slip", "caught red-handed", "confesses", "it all comes out at once"], "The way the truth finally gets out.", { unordered: true }],
      ["collapseAt", "When it collapses", [0, 100, "%"], "How far through the film the lie finally falls apart.", { from: 85, to: 85 }],
      ["audienceIn", "Audience knows it's a lie", ["no", "suspects", "knows from the start"], "Knowing the truth lets us squirm and lean in every time it nearly cracks."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "near" },
        { face: "mixer", sliders: ["size", "layers", "fooled"] },
        { face: "tiles", slider: "collapseHow", icons: { "one slip": "🍌", "caught red-handed": "🚨", confesses: "😭", "it all comes out at once": "💥" } },
      ],
      groups: [
        { label: "The lie", sliders: ["size", "layers", "madeUp", "liarSkill"] },
        { label: "Who's fooled", sliders: ["fooled", "audienceIn"] },
        { label: "The collapse", sliders: ["near", "collapseHow", "collapseAt"] },
      ],
      presets: [
        { label: "Mrs. Doubtfire tower", plain: "A natural liar builds a whole fake life until it all comes out at once.", set: { liarSkill: "a natural", madeUp: "a whole fake life", layers: 6, collapseHow: "it all comes out at once", audienceIn: "knows from the start" } },
        { label: "Sitcom fib", plain: "One small fib, a terrible liar, caught by the end of the episode.", set: { size: 1, layers: 2, liarSkill: "terrible", collapseHow: "caught red-handed", collapseAt: 90 } },
        { label: "Wobbling all act", plain: "Many people to fool, always about to fall.", set: { fooled: 8, near: "about to fall", madeUp: "too many", audienceIn: "knows from the start" } },
      ],
    },
  });

  W.add("misunderstanding", {
    sliders: [
      ["source", "Where it comes from", ["a misheard word", "a wrong room", "a mixed-up object", "a wrong identity", "a half-heard talk"], "What started the mix-up.", { unordered: true }],
      ["nearMisses", "Close calls of clearing it up", [0, 6, ""], "Times the truth almost comes out and then doesn't; each one tightens the screws."],
      ["doubleLines", "Lines that work both ways", [0, 5, ""], "How many lines make sense to both sides, each in their own wrong way."],
      ["clearsUp", "How it clears up", ["never clears", "quietly", "one big reveal", "a shouting match"], "How loudly the truth finally lands."],
      ["audienceAhead", "How early the audience gets it", ["at the end", "halfway", "from the start"], "When we understand the mix-up, which decides whether we laugh at the surprise or at the waiting."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "depth" },
        { face: "tiles", slider: "source", icons: { "a misheard word": "👂", "a wrong room": "🚪", "a mixed-up object": "🎁", "a wrong identity": "🎭", "a half-heard talk": "📞" } },
        { face: "pad", x: "doubleLines", y: "nearMisses", xLabel: "Lines that work both ways", yLabel: "Close calls" },
      ],
      groups: [
        { label: "The mix-up", sliders: ["depth", "source", "doubleLines"] },
        { label: "Who sees it", sliders: ["who", "audienceAhead"] },
        { label: "How long and how it ends", sliders: ["lasts", "nearMisses", "clearsUp"] },
      ],
      presets: [
        { label: "Fawlty Towers farce", plain: "A wrong identity, deep and long, with close calls everywhere and a shouting finish.", set: { source: "a wrong identity", depth: 5, nearMisses: 6, clearsUp: "a shouting match", audienceAhead: "from the start" } },
        { label: "Three's Company overheard", plain: "A half-heard talk, double meanings in every line.", set: { source: "a half-heard talk", doubleLines: 5, who: "the audience", lasts: 1 } },
        { label: "Quiet sweet mix-up", plain: "A small misheard word cleared up gently.", set: { source: "a misheard word", depth: 1, clearsUp: "quietly", nearMisses: 1 } },
      ],
    },
  });

  W.add("whoKnows", {
    sliders: [
      ["leak", "Danger of it slipping out", ["sealed", "loose talk", "on the tip of a tongue", "blurted"], "How close the secret is to being said out loud."],
      ["secretLooks", "Secret looks between insiders", [0, 5, ""], "Glances and nudges between those in on it, which tell the audience where to look."],
      ["revealAt", "When it comes out", ["never", "at the very end", "midway", "early"], "When everyone in the room finally knows."],
      ["outsider", "The one left out", ["doesn't suspect", "senses something", "figures it out"], "How close the person not in on it gets to the truth."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "gap" },
        { face: "tiles", slider: "audience", icons: { no: "🙈", partly: "👀", everything: "🧠" } },
        { face: "pad", x: "hiding", y: "secretLooks", xLabel: "Effort to hide", yLabel: "Secret looks" },
      ],
      groups: [
        { label: "Who's in on it", sliders: ["gap", "audience", "outsider"] },
        { label: "Keeping it secret", sliders: ["hiding", "secretLooks", "leak"] },
        { label: "The reveal", sliders: ["revealAt"] },
      ],
      presets: [
        { label: "Surprise party", plain: "Everyone but one is in on it, and the guest of honor senses something.", set: { gap: "all but one", audience: "everything", outsider: "senses something", leak: "on the tip of a tongue" } },
        { label: "Hitchcock bomb under the table", plain: "We know everything, they don't, and it nearly slips.", set: { audience: "everything", gap: "one", hiding: 5, leak: "blurted", revealAt: "at the very end" } },
        { label: "Office conspiracy", plain: "Half the room sneaks looks while the boss figures it out.", set: { gap: "half the room", secretLooks: 5, outsider: "figures it out", revealAt: "midway" } },
      ],
    },
  });

  W.add("comicEscalation", {
    sliders: [
      ["stepGap", "Breathing room between steps", [0, 60, "s"], "Seconds between one rise and the next; short gaps feel breathless."],
      ["noReturn", "Point of no return", [0, 100, "%"], "How far through the climb it can no longer be stopped.", { from: 60, to: 60 }],
      ["falseCalm", "Calm before the spiral", ["none", "a beat", "a false calm"], "A quiet moment where it all seems fixed, right before it gets worse."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "ceiling" },
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "speed", icons: { "slow burn": "🕯️", steady: "🚶", snowball: "⛄", instant: "💣" } },
      ],
      groups: [
        { label: "How far", sliders: ["setting", "ceiling", "steps"] },
        { label: "The rhythm of the climb", sliders: ["speed", "stepGap", "falseCalm", "noReturn"] },
      ],
      presets: [
        { label: "Meet the Parents spiral", plain: "Small mistakes snowball into a disaster with a false calm in the middle.", set: { setting: 5, ceiling: "disaster", speed: "snowball", falseCalm: "a false calm", steps: 8 } },
        { label: "Curb slow burn", plain: "A tiny social error that climbs slowly to deep awkwardness.", set: { setting: 3, ceiling: "awkward", speed: "slow burn", stepGap: 40 } },
        { label: "Looney Tunes instant", plain: "Straight to apocalyptic, no breathing room.", set: { setting: 5, ceiling: "apocalyptic", speed: "instant", stepGap: 0, falseCalm: "none" } },
      ],
    },
  });

  W.add("comicBeat", {
    sliders: [
      ["plantedWhen", "How early it's planted", ["just before", "a scene before", "an act before", "the opening"], "How much time passes between planting the joke and its return."],
      ["payoffSize", "Size of the laugh on payoff", ["a smile", "a chuckle", "a laugh", "the biggest laugh"], "How big the laugh should be when it pays off."],
      ["builds", "Steps between plant and payoff", [0, 5, ""], "How many times the setup is nudged before the payoff."],
      ["disguise", "What hides the setup", ["nothing", "a different joke", "story business", "a prop in the background"], "What keeps the audience from spotting the plant.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "visibility", left: "hidden", right: "underlined" },
        { face: "tiles", slider: "twist", icons: { "exactly as set up": "🎯", "a little different": "↪️", "turned upside down": "🙃" } },
      ],
      groups: [
        { label: "Where we are", sliders: ["setting", "builds"] },
        { label: "The setup", sliders: ["plantedWhen", "visibility", "disguise"] },
        { label: "The payoff", sliders: ["twist", "payoffSize"] },
      ],
      presets: [
        { label: "Chekhov's gag", plain: "Planted in the opening, hidden in the background, pays off as the biggest laugh.", set: { plantedWhen: "the opening", visibility: "background", disguise: "a prop in the background", payoffSize: "the biggest laugh" } },
        { label: "Arrested Development layer", plain: "Hidden setups buried under other jokes, paid off upside down.", set: { visibility: "hidden", disguise: "a different joke", twist: "turned upside down", builds: 3 } },
        { label: "Quick plant and pay", plain: "Set it up just before, land it straight.", set: { plantedWhen: "just before", visibility: "noticed", twist: "exactly as set up", payoffSize: "a laugh" } },
      ],
    },
  });

  W.add("payoffDistance", {
    sliders: [
      ["reminderLook", "How reminders look", ["a glance", "a line", "a prop on screen", "a full mention"], "How obvious each reminder of the setup is."],
      ["forget", "Let the audience forget", [0, 5, ""], "How completely the setup is allowed to fade before the payoff hits."],
      ["recognize", "How fast we recognize it", ["slowly dawns", "a beat late", "instantly"], "Whether the callback clicks at once or dawns on the audience."],
      ["landsAt", "Where the payoff lands", ["mid scene", "end of a scene", "end of an act", "the finale"], "Which moment of the film gets the payoff."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "landsAt" },
        { face: "pad", x: "setting", y: "forget", xLabel: "Scenes apart", yLabel: "How forgotten" },
      ],
      groups: [
        { label: "The distance", sliders: ["setting", "forget"] },
        { label: "Reminders on the way", sliders: ["reminder", "reminderLook"] },
        { label: "The landing", sliders: ["recognize", "landsAt", "noticeable", "change"] },
      ],
      presets: [
        { label: "Back to the Future long fuse", plain: "Planted early, nearly forgotten, pays off in the finale.", set: { setting: 10, forget: 4, reminder: "one", landsAt: "the finale", recognize: "instantly" } },
        { label: "Same-scene snap", plain: "Set up and paid off in the same scene.", set: { setting: 0, reminder: "none", landsAt: "end of a scene" } },
        { label: "Breadcrumb trail", plain: "Several small reminders so the payoff dawns slowly.", set: { setting: 6, reminder: "several", reminderLook: "a glance", recognize: "slowly dawns" } },
      ],
    },
  });

  W.add("typeClash", {
    sliders: [
      ["flashpoint", "What sets them off", ["nothing in particular", "small habits", "big decisions", "everything"], "Which kind of moment makes their differences flare up."],
      ["showsWhen", "When the clash shows", ["late", "under pressure", "slowly", "at first meeting"], "How soon the audience sees how different they are."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["friction", "straightness"] },
        { face: "tiles", slider: "size", icons: { two: "👫", three: "👨‍👩‍👦", "an ensemble": "👥" } },
      ],
      groups: [
        { label: "How different", sliders: ["setting", "size", "showsWhen"] },
        { label: "The rub", sliders: ["friction", "flashpoint", "need"] },
        { label: "Who plays what", sliders: ["straightness", "roleSwap"] },
      ],
      presets: [
        { label: "Odd Couple", plain: "Opposite types sharing a home, rubbing at every small habit.", set: { setting: "opposite types", size: "two", flashpoint: "small habits", friction: 5, need: "a little" } },
        { label: "Heist crew", plain: "An ensemble of different types who can't do it alone.", set: { setting: "different types", size: "an ensemble", need: "can't do it alone", flashpoint: "big decisions" } },
        { label: "Swap halfway", plain: "The straight one and the wild one trade places.", set: { roleSwap: "once", straightness: 4, showsWhen: "at first meeting" } },
      ],
    },
  });

  W.add("chaosInRoom", {
    sliders: [
      ["entrance", "How chaos arrives", ["already there", "creeps in", "bursts in"], "Whether the disorder was waiting, sneaks in, or crashes through the door."],
      ["spread", "How it spreads", ["stays with one", "catches a few", "whole room"], "How many people in the room get pulled into the mess."],
      ["damage", "What gets broken", ["nothing", "manners", "things", "the event", "relationships"], "What the chaos costs the room."],
      ["keepOrder", "Effort to keep order", [0, 5, ""], "How hard the orderly people fight to hold it together; the harder, the funnier the loss."],
      ["peakAt", "When it peaks", [0, 100, "%"], "How far through the scene the chaos is at its worst.", { from: 80, to: 80 }],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "source", icons: { "a person": "🧑", "an animal": "🐕", "an object": "📦", "the weather": "⛈️", "a misunderstanding": "❓" } },
        { face: "balance", slider: "order", left: "already a mess", right: "solemn" },
      ],
      groups: [
        { label: "The chaos", sliders: ["setting", "source", "entrance"] },
        { label: "The room", sliders: ["order", "keepOrder"] },
        { label: "How it plays out", sliders: ["spread", "damage", "peakAt"] },
      ],
      presets: [
        { label: "Funeral disaster", plain: "A solemn room, one chaos character, and everyone trying to keep a straight face.", set: { order: "solemn", setting: "one chaos character", keepOrder: 5, damage: "the event", spread: "whole room" } },
        { label: "Bringing Up Baby", plain: "An animal bursts into a formal room and takes over.", set: { source: "an animal", entrance: "bursts in", order: "formal", setting: "mostly chaos" } },
        { label: "Slow unraveling dinner", plain: "Chaos creeps into a relaxed dinner and peaks at the end.", set: { entrance: "creeps in", order: "relaxed", peakAt: 95, damage: "relationships" } },
      ],
    },
  });

  W.add("statusGap", {
    sliders: [
      ["shiftWhen", "When status shifts", ["at the very end", "late", "midway", "early"], "How soon in the scene the power starts to move."],
      ["rootFor", "Who we root for", ["the high one", "both", "the low one"], "Which side of the gap the audience is pulling for."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "rootFor", left: "the high one", right: "the low one" },
        { face: "pad", x: "pretense", y: "fall", xLabel: "Pretending higher", yLabel: "Size of the fall" },
      ],
      groups: [
        { label: "The gap", sliders: ["setting", "playing", "pretense"] },
        { label: "The flip", sliders: ["flip", "shiftWhen", "fall"] },
        { label: "The audience", sliders: ["rootFor"] },
      ],
      presets: [
        { label: "Jeeves and Wooster", plain: "Master and servant, but the servant is in charge.", set: { setting: "master and servant", playing: "the low one plays high", rootFor: "the low one" } },
        { label: "Trading Places reversal", plain: "A big gap that fully flips midway.", set: { setting: "big gap", flip: "a full reversal", shiftWhen: "midway", fall: 5 } },
        { label: "Pompous takedown", plain: "Someone pretending far above their rank, brought down at the end.", set: { pretense: 5, fall: 5, shiftWhen: "at the very end", rootFor: "the low one" } },
      ],
    },
  });

  W.add("mixArc", {
    sliders: [
      ["pace", "How fast they change", ["slowly over the film", "in steps", "all at once"], "Whether the change creeps in or arrives in one moment."],
      ["resists", "Fights the change", [0, 5, ""], "How hard they push back against becoming someone new."],
      ["shownBy", "The moment it shows", ["never shown", "a small gesture", "a said line", "a big act"], "How the change is shown on screen."],
      ["sticks", "Does it stick", ["snaps back", "partly", "for good"], "Whether they stay changed or slide back by the next scene."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "direction", left: "worse", right: "much better" },
        { face: "tiles", slider: "learns", icons: { "no one": "🚫", "the funny one": "🤡", "the straight one": "😐", both: "🤝" } },
      ],
      groups: [
        { label: "The change", sliders: ["setting", "direction", "learns"] },
        { label: "How it happens", sliders: ["pace", "resists", "shownBy"] },
        { label: "Afterwards", sliders: ["sticks"] },
      ],
      presets: [
        { label: "Sitcom reset", plain: "A nudge that snaps back by the next episode.", set: { setting: "a nudge", sticks: "snaps back", shownBy: "a small gesture" } },
        { label: "Planes, Trains and Automobiles", plain: "The uptight one learns, slowly, and it sticks.", set: { setting: "a push", learns: "the straight one", pace: "slowly over the film", resists: 5, sticks: "for good", direction: "much better" } },
        { label: "Both break", plain: "Being together breaks both of them in a big act.", set: { setting: "a break", learns: "both", shownBy: "a big act" } },
      ],
    },
  });

  W.add("callback", {
    sliders: [
      ["memorable", "How memorable the original", [0, 5, ""], "How strongly the first time was played, so the audience recognizes it later."],
      ["times", "Times it's called back", [1, 6, ""], "How often the line or image returns."],
      ["leadIn", "Hint before it lands", ["none", "a small hint", "a clear lead-in"], "Whether the film warns us a callback is coming."],
      ["landsOn", "Where it lands", ["mid scene", "button of a scene", "last line of the film"], "Which moment gets the callback; later spots make it hit harder."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "distance" },
        { face: "tiles", slider: "mood", icons: { "same mood": "😐", funnier: "😂", sadder: "😢", sweeter: "🥹" } },
        { face: "mixer", sliders: ["memorable", "times"] },
      ],
      groups: [
        { label: "The original", sliders: ["memorable", "distance"] },
        { label: "The return", sliders: ["form", "mood", "times"] },
        { label: "How it lands", sliders: ["leadIn", "landsOn"] },
      ],
      presets: [
        { label: "Tearjerker last line", plain: "An early joke returns as the last line of the film, now sweet.", set: { distance: 50, form: "same words, new meaning", mood: "sweeter", landsOn: "last line of the film" } },
        { label: "Button of the scene", plain: "A quick exact repeat that ends the scene.", set: { distance: 3, form: "exact repeat", mood: "funnier", landsOn: "button of a scene" } },
        { label: "Passed to a new mouth", plain: "Someone else says it, and it gets funnier each time.", set: { form: "same words, new speaker", times: 3, mood: "funnier" } },
      ],
    },
  });

  W.add("misdirection", {
    sliders: [
      ["clues", "Fair clues planted", [0, 5, ""], "How many honest hints are hidden so the twist feels earned."],
      ["fooledFor", "How long we're fooled", ["a beat", "a moment", "the whole scene", "several scenes"], "How long the false idea holds."],
      ["expect", "What we're led to expect", ["danger", "romance", "sad news", "a big moment", "something ordinary"], "The wrong thing the audience is set up to see coming.", { unordered: true }],
      ["fooledWithUs", "Who's fooled with us", ["only us", "a character too", "everyone"], "Whether a character falls for it alongside the audience."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "tiles", slider: "reveal", icons: { slowly: "🐢", "on a cut": "✂️", "a pull-back wide": "🔭", "a line of dialogue": "💬" } },
        { face: "balance", slider: "fairness", left: "fully fair", right: "a cheat" },
      ],
      groups: [
        { label: "Leading us on", sliders: ["strength", "expect", "fooledFor"] },
        { label: "Playing fair", sliders: ["fairness", "clues"] },
        { label: "The reveal", sliders: ["reveal", "fooledWithUs"] },
      ],
      presets: [
        { label: "Naked Gun pull-back", plain: "We think it's danger, a wide shot shows something silly.", set: { expect: "danger", reveal: "a pull-back wide", fooledFor: "a beat", strength: 4 } },
        { label: "Fake-out sad news", plain: "We brace for bad news and get something ordinary.", set: { expect: "sad news", reveal: "a line of dialogue", fooledWithUs: "a character too" } },
        { label: "Long con", plain: "Fooled for several scenes, but every clue was fair.", set: { fooledFor: "several scenes", clues: 5, fairness: "fully fair", reveal: "slowly" } },
      ],
    },
  });

  W.add("irony", {
    sliders: [
      ["bite", "How hard it bites", ["gently", "stings", "cruel"], "How much the irony hurts the person it lands on."],
      ["findsOut", "Character finds out", ["never", "too late", "just in time"], "Whether the character ever sees the irony we see."],
      ["tone", "Funny or sad", ["laugh", "bittersweet", "tragic"], "Whether the irony plays for a laugh or a lump in the throat."],
      ["pointedOut", "How the film points to it", ["left alone", "a look", "a cut to it", "a music sting"], "How much the camera, the edit or the music nudges us to notice."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { "said one thing, meant another": "😏", "the opposite happens": "🔄", "the audience knows more": "👁️" } },
        { face: "dial", slider: "delay" },
        { face: "balance", slider: "tone", left: "laugh", right: "tragic" },
      ],
      groups: [
        { label: "The irony", sliders: ["kind", "bite", "tone"] },
        { label: "Showing it", sliders: ["obviousness", "pointedOut"] },
        { label: "Timing", sliders: ["delay", "findsOut"] },
      ],
      presets: [
        { label: "Coen brothers cruel twist", plain: "The opposite happens, it bites hard, nobody points to it.", set: { kind: "the opposite happens", bite: "cruel", pointedOut: "left alone", findsOut: "too late" } },
        { label: "Dry British sarcasm", plain: "Said one thing, meant another, a gentle sting.", set: { kind: "said one thing, meant another", bite: "stings", obviousness: 2, delay: 0 } },
        { label: "Bittersweet long fuse", plain: "The audience knows more and it lands many scenes later.", set: { kind: "the audience knows more", delay: 12, tone: "bittersweet" } },
      ],
    },
  });

  W.add("fishOutOfWater", {
    sliders: [
      ["world", "Which strange world", ["a new job", "a new class", "a new country", "a new time", "a new species"], "What kind of world the character doesn't belong in.", { unordered: true }],
      ["confidence", "Acts like they belong", ["painfully shy", "unsure", "confident", "wrongly sure"], "How sure they are of themselves; wrongly sure is the funniest."],
      ["useful", "Outsider turns out useful", ["never", "once", "saves the day"], "Whether their strange ways end up helping."],
      ["clashes", "Clash moments per scene", [0, 5, ""], "How often each scene shows them getting it wrong."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "world", icons: { "a new job": "💼", "a new class": "🎩", "a new country": "🌍", "a new time": "⏳", "a new species": "👽" } },
        { face: "pad", x: "mismatch", y: "visibility", xLabel: "How out of place", yLabel: "Everyone can tell" },
        { face: "ladder", slider: "confidence" },
      ],
      groups: [
        { label: "The world", sliders: ["world", "mismatch", "visibility"] },
        { label: "The outsider", sliders: ["confidence", "clashes"] },
        { label: "Over the film", sliders: ["adapts", "useful"] },
      ],
      presets: [
        { label: "Crocodile Dundee", plain: "Wrongly sure in a new country, and it saves the day.", set: { world: "a new country", confidence: "wrongly sure", useful: "saves the day", adapts: "never" } },
        { label: "Elf", plain: "Completely out of place, everyone can tell, constant clashes.", set: { mismatch: 5, visibility: 5, clashes: 5, confidence: "confident" } },
        { label: "Time traveler", plain: "A new time, slowly learning to fit.", set: { world: "a new time", adapts: "slowly", confidence: "unsure" } },
      ],
    },
  });

  W.add("humiliation", {
    sliders: [
      ["recovery", "How they recover", ["crumble", "fake it", "bounce back", "turn it into a win"], "What they do the moment after losing face."],
      ["dragsOn", "How long it lasts", [0, 30, "s"], "Seconds the embarrassment plays before the scene lets them go."],
      ["laughsAt", "Who laughs", ["no one", "the audience only", "the rival", "everyone"], "Who on screen enjoys it, which tells us whether to laugh too."],
      ["seenComing", "We see it coming", ["surprise", "a moment ahead", "long before"], "Seeing the fall coming turns the wait into the joke."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "ladder", slider: "witnesses" },
        { face: "balance", slider: "earned", left: "not at all", right: "completely" },
      ],
      groups: [
        { label: "The fall", sliders: ["size", "earned", "seenComing"] },
        { label: "The crowd", sliders: ["witnesses", "laughsAt"] },
        { label: "After", sliders: ["dragsOn", "recovery"] },
      ],
      presets: [
        { label: "Bully gets his", plain: "Fully earned, in front of everyone, and we saw it coming.", set: { earned: "completely", witnesses: "everyone", laughsAt: "everyone", seenComing: "long before", size: 5 } },
        { label: "Bridesmaids painful", plain: "Not earned, drags on, and she crumbles.", set: { earned: "not at all", dragsOn: 25, recovery: "crumble", laughsAt: "the rival" } },
        { label: "Spin it to a win", plain: "A quick stumble they turn into a triumph.", set: { size: 2, recovery: "turn it into a win", dragsOn: 3 } },
      ],
    },
  });

  W.add("egoClash", {
    sliders: [
      ["tactics", "How they fight", ["polite digs", "one-upping", "open insults", "physical"], "How openly they go at each other."],
      ["rounds", "Rounds of one-upping", [1, 10, ""], "How many times they top each other before it breaks."],
      ["winner", "Who wins", ["the first", "neither", "both lose", "the second"], "Who comes out on top, if anyone."],
      ["caught", "Someone caught between", ["no one", "a friend", "the whole room"], "Bystanders stuck in the middle, whose faces give us the laugh."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "over", icons: { "who's in charge": "👑", "who's right": "✅", "who's loved": "❤️", "who's best": "🏆" } },
        { face: "ladder", slider: "tactics" },
        { face: "balance", slider: "winner", left: "the first", right: "the second" },
      ],
      groups: [
        { label: "The clash", sliders: ["size", "over", "petty"] },
        { label: "The fight", sliders: ["tactics", "rounds", "caught"] },
        { label: "The outcome", sliders: ["winner"] },
      ],
      presets: [
        { label: "Anchorman showdown", plain: "Absurdly petty, open insults, the whole room caught in it.", set: { petty: "absurdly petty", tactics: "open insults", caught: "the whole room", size: 5 } },
        { label: "Dinner-party one-upping", plain: "Polite digs over who's best, round after round, and both lose.", set: { over: "who's best", tactics: "polite digs", rounds: 8, winner: "both lose" } },
        { label: "Two chefs, one kitchen", plain: "Who's in charge, and a friend stuck between.", set: { over: "who's in charge", caught: "a friend", tactics: "one-upping" } },
      ],
    },
  });

  W.add("alliances", {
    sliders: [
      ["switchHow", "How sides switch", ["drift over", "get talked over", "betray openly"], "How sneaky or loud a change of sides is."],
      ["leftAlone", "Someone left alone", ["never", "now and then", "always the same one"], "Whether one person keeps ending up on a side of one."],
      ["sideTalk", "Side chatter on screen", ["none", "glances", "whispers", "open huddles"], "How visibly the camps form, so the audience can follow who's with whom."],
      ["lastSwitch", "When the last switch comes", [0, 100, "%"], "How far through the story the final change of sides happens.", { from: 90, to: 90 }],
    ],
    window: {
      faces: [
        { face: "dial", slider: "shifts" },
        { face: "ladder", slider: "sideTalk" },
        { face: "tiles", slider: "switchHow", icons: { "drift over": "🌊", "get talked over": "🗣️", "betray openly": "🗡️" } },
      ],
      groups: [
        { label: "The sides", sliders: ["sides", "leftAlone", "sideTalk"] },
        { label: "Switching", sliders: ["shifts", "switchHow", "lastSwitch"] },
        { label: "How visible", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Survivor tribal council", plain: "Open huddles, betrayals, a last switch right at the end.", set: { sideTalk: "open huddles", switchHow: "betray openly", lastSwitch: 98, shifts: 4 } },
        { label: "Family dinner camps", plain: "Two sides, whispers, the same person always alone.", set: { sides: 2, sideTalk: "whispers", leftAlone: "always the same one" } },
        { label: "Twelve Angry Men drift", plain: "People drift over one by one.", set: { switchHow: "get talked over", shifts: 5, sides: 2 } },
      ],
    },
  });

  W.add("unwantedGuest", {
    sliders: [
      ["arrives", "How they arrive", ["already there", "walks in", "bursts in", "sneaks in"], "The guest's entrance into the scene.", { unordered: true }],
      ["hostHides", "Host tries to hide them", [0, 5, ""], "How hard the host works to keep the guest out of sight or out of trouble."],
      ["damage", "Damage they do", ["none", "awkward chat", "a scene", "ruins the day"], "How much of the event the guest wrecks."],
      ["stays", "Share of the scene they're in", [0, 100, "%"], "How much of the scene the guest is in the room.", { from: 50, to: 50 }],
    ],
    window: {
      faces: [
        { face: "dial", slider: "wrong" },
        { face: "tiles", slider: "arrives", icons: { "already there": "🪑", "walks in": "🚶", "bursts in": "💥", "sneaks in": "🥷" } },
        { face: "ladder", slider: "damage" },
      ],
      groups: [
        { label: "The guest", sliders: ["wrong", "knows", "arrives"] },
        { label: "The host", sliders: ["hostHides", "damage"] },
        { label: "Leaving", sliders: ["stays", "leaves"] },
      ],
      presets: [
        { label: "The ex at the wedding", plain: "Knows and stays, makes a scene.", set: { wrong: 5, knows: "knows and stays", damage: "a scene", leaves: "is pushed out" } },
        { label: "The Man Who Came to Dinner", plain: "No idea they're unwanted, stays all scene, ruins the day.", set: { knows: "no idea", leaves: "stays all scene", stays: 100, damage: "ruins the day" } },
        { label: "Hide the boss", plain: "The host desperately keeps the guest out of sight.", set: { hostHides: 5, arrives: "sneaks in", damage: "awkward chat" } },
      ],
    },
  });

  W.add("comedyDevice", {
    sliders: [
      ["surprise", "How surprising", [0, 5, ""], "How unexpected the joke is when it arrives."],
      ["stacked", "Jokes stacked in the moment", [1, 6, ""], "How many jokes pile into this one moment."],
      ["variety", "Kinds of joke in the scene", ["one kind all scene", "two kinds", "keeps changing"], "Whether the scene sticks to one comic idea or keeps switching."],
      ["storyRoom", "Joke or story first", ["joke first", "balanced", "story first"], "Whether the laugh or the plot gets right of way."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { understatement: "🤏", irony: "😏", deadpan: "😐", "the straight one and the funny one": "🎭", banter: "💬", misunderstanding: "❓", "status play": "👑", "fish out of water": "🐟", reversal: "🔄", callback: "↩️", "running gag": "🔁", "rule of three": "3️⃣", escalation: "📈", cringe: "😬", absurdity: "🦄", slapstick: "🍌" } },
        { face: "swatches", slider: "darkness", colors: { innocent: "#FFF4C2", cheeky: "#FFC67A", edgy: "#E0784A", dark: "#7A3B4A", "pitch black": "#1E1A22" } },
        { face: "balance", slider: "warmth", left: "cruel", right: "affectionate" },
      ],
      groups: [
        { label: "The joke", sliders: ["setting", "surprise", "stacked"] },
        { label: "The tone", sliders: ["darkness", "warmth"] },
        { label: "Across the scene", sliders: ["variety", "storyRoom"] },
      ],
      presets: [
        { label: "Paddington warmth", plain: "Innocent, affectionate, story first.", set: { darkness: "innocent", warmth: "affectionate", storyRoom: "story first", setting: "understatement" } },
        { label: "Airplane! joke barrage", plain: "Absurd jokes stacked six deep, always changing.", set: { setting: "absurdity", stacked: 6, variety: "keeps changing", storyRoom: "joke first", surprise: 5 } },
        { label: "Veep insult comedy", plain: "Biting banter, edgy and cruel.", set: { setting: "banter", darkness: "edgy", warmth: "cruel" } },
      ],
    },
  });

  W.add("absurdity", {
    sliders: [
      ["arrives", "How the strangeness arrives", ["all at once", "step by step", "so slowly we barely notice"], "Whether the world tips into nonsense in one go or by degrees."],
      ["ownLogic", "Follows its own logic", ["none", "loosely", "strictly"], "Absurd worlds are funniest when they obey their own crazy rules."],
      ["realFeeling", "Real feeling underneath", [0, 5, ""], "How much honest emotion sits under the nonsense."],
      ["spills", "Spills into later scenes", ["stays put", "echoes", "takes over"], "Whether the strangeness stays in this moment or spreads through the film."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "acceptance", left: "everyone is shocked", right: "nobody blinks" },
        { face: "pad", x: "detail", y: "realFeeling", xLabel: "Played with care", yLabel: "Real feeling" },
      ],
      groups: [
        { label: "How strange", sliders: ["setting", "arrives", "spills"] },
        { label: "How it's played", sliders: ["acceptance", "detail", "ownLogic"] },
        { label: "The heart", sliders: ["realFeeling"] },
      ],
      presets: [
        { label: "Monty Python", plain: "Total nonsense, nobody blinks, strict silly logic.", set: { setting: 5, acceptance: "nobody blinks", ownLogic: "strictly", arrives: "all at once" } },
        { label: "Charlie Kaufman", plain: "Strange creeps in slowly, played with real feeling.", set: { setting: 4, arrives: "so slowly we barely notice", realFeeling: 5, detail: 5 } },
        { label: "Everyday weird", plain: "A little strange, some notice, stays put.", set: { setting: 2, acceptance: "some notice", spills: "stays put" } },
      ],
    },
  });

  W.add("cringe", {
    sliders: [
      ["silence", "Silence after the blunder", [0, 10, "s"], "How long nobody says anything after it goes wrong."],
      ["rescue", "Someone saves them", ["no one", "too late", "just in time"], "Whether anyone steps in to end the awkwardness."],
      ["digsDeeper", "Digs deeper", ["stops", "tries to fix it", "doubles down"], "Whether they make it worse by trying to fix it."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "mixer", sliders: ["hold", "silence", "witnesses"] },
        { face: "ladder", slider: "digsDeeper" },
      ],
      groups: [
        { label: "How awkward", sliders: ["setting", "selfAware", "digsDeeper"] },
        { label: "The room", sliders: ["witnesses", "rescue"] },
        { label: "Holding on it", sliders: ["hold", "silence"] },
      ],
      presets: [
        { label: "The Office (UK) silence", plain: "Oblivious, doubles down, camera holds through a long silence.", set: { setting: 5, selfAware: "oblivious", digsDeeper: "doubles down", silence: 8, hold: 5 } },
        { label: "Curb disaster", plain: "Painfully aware, tries to fix it, no one helps.", set: { selfAware: "painfully aware", digsDeeper: "tries to fix it", rescue: "no one" } },
        { label: "Saved by the bell", plain: "A short awkward moment, rescued just in time.", set: { setting: 2, rescue: "just in time", silence: 2 } },
      ],
    },
  });

  W.add("jokeCarrier", {
    sliders: [
      ["passing", "Joke passes between people", ["stays with one", "passes once", "bounces around"], "Whether one person owns the laugh or it gets passed like a ball."],
      ["favors", "Who the camera favors", ["the joker", "the listener", "both in one shot"], "Where the camera points when the line lands.", { unordered: true }],
      ["lookTo", "Where we look for the laugh", ["the speaker", "the reactor", "the background"], "Where the scene steers the audience's eye to find the funny.", { unordered: true }],
      ["generous", "Feeds others the joke", [0, 5, ""], "How much the carrier sets up laughs for someone else."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { "no one": "🚫", "a background person": "🧍", "the straight one": "😐", "the funny one": "🤪", both: "👯", "the whole room": "👥" } },
        { face: "tiles", slider: "lookTo", icons: { "the speaker": "🗣️", "the reactor": "😮", "the background": "🖼️" } },
        { face: "dial", slider: "generous" },
      ],
      groups: [
        { label: "Who carries it", sliders: ["setting", "aware", "generous"] },
        { label: "Passing it around", sliders: ["passing", "favors", "lookTo"] },
        { label: "How visible", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Brooklyn Nine-Nine ensemble", plain: "The whole room bounces the joke around.", set: { setting: "the whole room", passing: "bounces around", generous: 5 } },
        { label: "Buster Keaton stone face", plain: "The funny one has no idea, the camera stays on him.", set: { setting: "the funny one", aware: "has no idea", favors: "the joker", lookTo: "the speaker" } },
        { label: "Laugh in the reaction", plain: "The straight one carries it with the listener's face.", set: { setting: "the straight one", favors: "the listener", lookTo: "the reactor" } },
      ],
    },
  });

  W.add("comicReaction", {
    sliders: [
      ["delay", "Delay before the reaction", [0, 3, "s", 0.5], "The beat before the face changes; a late reaction is often the funnier one."],
      ["whose", "Whose face we cut to", ["the target", "a bystander", "the whole room", "an animal"], "Whose reaction the scene shows us.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "pad", x: "delay", y: "hold", xLabel: "Delay before", yLabel: "Time on the face" },
        { face: "tiles", slider: "toCamera", icons: { no: "🙅", "a glance": "👀", "a long look": "😑" } },
      ],
      groups: [
        { label: "The reaction", sliders: ["setting", "whose", "count"] },
        { label: "Timing", sliders: ["delay", "hold"] },
        { label: "To the audience", sliders: ["toCamera"] },
      ],
      presets: [
        { label: "Jim Halpert look", plain: "Just a look, straight at the camera, held long.", set: { setting: "a look", toCamera: "a long look", hold: 3, delay: 0.5 } },
        { label: "Classic double take", plain: "A beat late, then the snap back.", set: { setting: "a double take", delay: 1.5, hold: 1 } },
        { label: "Oliver Hardy slow burn", plain: "A long, slow burn held on the face.", set: { setting: "a slow burn", hold: 4, toCamera: "a glance", delay: 1 } },
      ],
    },
  });

  W.add("runningGag", {
    sliders: [
      ["firstAt", "First time we see it", [0, 50, "%"], "How far into the film the gag first appears.", { from: 5, to: 5 }],
      ["returns", "Gap between returns", ["grows", "stays even", "shrinks"], "Whether the gag comes back faster and faster or spreads out."],
      ["noticed", "Characters notice the pattern", ["never", "one does", "everyone groans"], "Whether anyone on screen realizes it keeps happening."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "count" },
        { face: "pad", x: "spacing", y: "variation", xLabel: "Space between", yLabel: "Change each time" },
        { face: "tiles", slider: "finale", icons: { "no finale": "⏹️", "a bigger version": "📈", "a reversal": "🔄", "it finally pays off": "🎉" } },
      ],
      groups: [
        { label: "How often", sliders: ["count", "spacing", "firstAt", "returns"] },
        { label: "Each time", sliders: ["variation", "noticed"] },
        { label: "The end", sliders: ["finale"] },
      ],
      presets: [
        { label: "Kenny dies again", plain: "Same gag, evenly spaced, a little different each time.", set: { count: 8, returns: "stays even", variation: 2, noticed: "everyone groans" } },
        { label: "Bananas to the finale", plain: "Returns come faster and it finally pays off.", set: { returns: "shrinks", finale: "it finally pays off", count: 5 } },
        { label: "Slow-burn background gag", plain: "Few returns, far apart, nobody on screen notices.", set: { count: 3, spacing: 25, noticed: "never", finale: "a reversal" } },
      ],
    },
  });

  W.add("ruleOfThree", {
    sliders: [
      ["breakPause", "Pause before the break", [0, 3, "s", 0.5], "A beat of silence before the odd third item lands."],
      ["breaksIn", "What the break plays against", ["the words", "the picture", "the sound", "the action"], "Which part of the film carries the surprise.", { unordered: true }],
      ["breakBy", "Who delivers the break", ["the same voice", "another person", "the edit"], "Who or what snaps the pattern.", { unordered: true }],
      ["matched", "Items share a rhythm", ["loose", "similar", "exact"], "How alike the pattern items sound and look; the tighter, the harder the break hits."],
    ],
    window: {
      faces: [
        { face: "pad", x: "pattern", y: "breakSize", xLabel: "Pattern items", yLabel: "How hard the break" },
        { face: "dial", slider: "breakPause" },
        { face: "tiles", slider: "breaksIn", icons: { "the words": "💬", "the picture": "🖼️", "the sound": "🔊", "the action": "🏃" } },
      ],
      groups: [
        { label: "The pattern", sliders: ["pattern", "speed", "matched"] },
        { label: "The break", sliders: ["breakSize", "breaksIn", "breakBy"] },
        { label: "Timing", sliders: ["breakPause"] },
      ],
      presets: [
        { label: "Classic list joke", plain: "Two normal items, an exact rhythm, a beat, then the odd one.", set: { pattern: 2, matched: "exact", breakPause: 0.5, breaksIn: "the words" } },
        { label: "Edgar Wright montage", plain: "A quick visual pattern broken by the edit.", set: { speed: "quick", breaksIn: "the picture", breakBy: "the edit", breakSize: 5 } },
        { label: "Slow and dry", plain: "A slow list and a soft break from someone else.", set: { speed: "slow", breakSize: 2, breakBy: "another person" } },
      ],
    },
  });

  W.add("physicalComedy", {
    sliders: [
      ["chain", "Chain reaction", [0, 6, ""], "How many more things go wrong after the first."],
      ["getsUp", "Gets back up", ["stays down", "slowly", "bounces up", "pretends it didn't happen"], "What the body does after the fall; the recovery is often the second laugh.", { unordered: true }],
      ["precision", "Timing precision", ["loose and messy", "clean", "clockwork"], "How precisely the action is timed, from wild flailing to perfect clockwork."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "size" },
        { face: "mixer", sliders: ["buildUp", "pain", "chain"] },
        { face: "tiles", slider: "framing", icons: { close: "🔍", medium: "🧍", wide: "🏞️" } },
      ],
      groups: [
        { label: "The action", sliders: ["size", "chain", "precision"] },
        { label: "Before and after", sliders: ["buildUp", "getsUp"] },
        { label: "Hurt and camera", sliders: ["pain", "framing"] },
      ],
      presets: [
        { label: "Buster Keaton clockwork", plain: "A big stunt, perfectly timed, shown wide with no real hurt.", set: { size: "a stunt", precision: "clockwork", framing: "wide", pain: 0 } },
        { label: "Rube Goldberg chain", plain: "One fumble sets off six more disasters.", set: { size: "destruction", chain: 6, buildUp: 4 } },
        { label: "Jackass wince", plain: "A fall with real hurt and a slow climb back up.", set: { size: "a fall", pain: 5, getsUp: "slowly", framing: "close" } },
      ],
    },
  });

  W.add("subversion", {
    sliders: [
      ["clichePlays", "How long the cliche plays", [0, 30, "s"], "Seconds the familiar moment runs straight before it breaks."],
      ["cliche", "Which cliche", ["the hero speech", "the slow-motion walk", "the kiss", "the chase", "the big reveal", "the jump scare"], "The familiar movie moment being set up.", { unordered: true }],
      ["earnest", "Played straight first", [0, 5, ""], "How sincerely the setup is played so the audience believes it."],
      ["after", "After the break", ["moves on", "lingers on it", "comments on it"], "What the film does right after the cliche falls apart."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "cliche", icons: { "the hero speech": "🎤", "the slow-motion walk": "🚶", "the kiss": "💋", "the chase": "🏃", "the big reveal": "🎭", "the jump scare": "😱" } },
        { face: "dial", slider: "clichePlays" },
        { face: "ladder", slider: "break" },
      ],
      groups: [
        { label: "The setup", sliders: ["cliche", "familiarity", "earnest", "clichePlays"] },
        { label: "The break", sliders: ["break", "after"] },
        { label: "Knowing", sliders: ["selfAware"] },
      ],
      presets: [
        { label: "Hot Fuzz slow-mo", plain: "A slow-motion walk played dead straight, then deflated.", set: { cliche: "the slow-motion walk", earnest: 5, break: "deflated", clichePlays: 15 } },
        { label: "Deadpool aside", plain: "Knows it's a movie and comments on the break.", set: { selfAware: 5, after: "comments on it", break: "turned inside out" } },
        { label: "Interrupted kiss", plain: "The kiss is built up, then a small twist.", set: { cliche: "the kiss", familiarity: 5, break: "small twist", after: "moves on" } },
      ],
    },
  });

  W.add("comicEdit", {
    sliders: [
      ["contradict", "Cuts that prove them wrong", [0, 5, ""], "How often a cut shows the opposite of what someone just said."],
      ["holdPast", "Hold past comfort", [0, 5, "s"], "Seconds the shot stays on after the line, letting the awkwardness land."],
      ["jumpCuts", "Jump cuts", [0, 5, ""], "Small skips in time inside one shot, for snappy or frantic energy."],
      ["tempoShape", "Tempo across the scene", ["slows down", "steady", "speeds up", "speeds up then stops dead"], "How the cutting rhythm changes from start to end of the scene.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["smashCut", "cutaway", "contradict", "jumpCuts"] },
        { face: "ladder", slider: "tempo" },
        { face: "dial", slider: "holdPast" },
      ],
      groups: [
        { label: "Kinds of comic cut", sliders: ["smashCut", "cutaway", "contradict", "jumpCuts"] },
        { label: "Rhythm", sliders: ["tempo", "tempoShape", "holdPast"] },
      ],
      presets: [
        { label: "Edgar Wright", plain: "Frantic smash cuts and jump cuts, speeding up then stopping dead.", set: { tempo: "frantic", smashCut: 5, jumpCuts: 5, tempoShape: "speeds up then stops dead" } },
        { label: "Arrested Development contradiction", plain: "Someone says it, the cut proves them wrong.", set: { contradict: 5, cutaway: 4, tempo: "quick" } },
        { label: "Mockumentary linger", plain: "Steady cutting that holds too long on the silence.", set: { tempo: "steady", holdPast: 4, smashCut: 1 } },
      ],
    },
  });

  W.add("fourthWall", {
    sliders: [
      ["howOften", "Times per scene", [0, 10, ""], "How often the character turns to us."],
      ["attitude", "Their attitude to us", ["confiding", "smug", "pleading", "annoyed"], "How they treat the audience when they look at us.", { unordered: true }],
      ["lookLength", "Length of the look", [0, 5, "s"], "How long they hold the look into the lens."],
      ["worldPauses", "The world pauses", ["keeps going", "slows", "freezes"], "Whether the rest of the scene stops while they talk to us."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "break" },
        { face: "tiles", slider: "attitude", icons: { confiding: "🤫", smug: "😏", pleading: "🥺", annoyed: "😒" } },
        { face: "dial", slider: "lookLength" },
      ],
      groups: [
        { label: "Breaking through", sliders: ["break", "howOften", "attitude"] },
        { label: "The moment", sliders: ["lookLength", "worldPauses", "others"] },
        { label: "How visible", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Ferris Bueller", plain: "Smug speeches to us while the world freezes.", set: { break: "talks to us", attitude: "smug", worldPauses: "freezes" } },
        { label: "Fleabag glance", plain: "Quick confiding glances, many times a scene.", set: { break: "a glance", attitude: "confiding", howOften: 6, lookLength: 1 } },
        { label: "Annoyed sitcom look", plain: "One long annoyed look, the world keeps going.", set: { break: "a glance", attitude: "annoyed", lookLength: 4, worldPauses: "keeps going" } },
      ],
    },
  });

  W.add("doubleAct", {
    sliders: [
      ["finish", "Finish each other's lines", ["never", "sometimes", "always"], "How in sync their speech is."],
      ["staging", "How they stand", ["side by side", "face to face", "one behind", "far apart"], "Their places in the frame, which shapes how the lines bounce.", { unordered: true }],
      ["bicker", "Bicker or back each other", ["bicker", "both", "back each other"], "Whether they fight each other or team up against the world."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "bond", icons: { strangers: "🤝", coworkers: "💼", friends: "🍻", rivals: "⚔️", "a couple": "💑", family: "👨‍👩‍👧" } },
        { face: "dial", slider: "volley" },
        { face: "balance", slider: "bicker", left: "bicker", right: "back each other" },
      ],
      groups: [
        { label: "The pair", sliders: ["bond", "lead", "bicker"] },
        { label: "Trading lines", sliders: ["volley", "overlap", "finish"] },
        { label: "Staging", sliders: ["staging"] },
      ],
      presets: [
        { label: "His Girl Friday", plain: "Lightning volleys, constant overlap, bickering.", set: { volley: 5, overlap: "constantly", bicker: "bicker", bond: "a couple" } },
        { label: "Laurel and Hardy", plain: "The clever one leads, the fool follows, side by side.", set: { lead: "the clever one", staging: "side by side", bond: "friends", volley: 2 } },
        { label: "Key and Peele in sync", plain: "Finishing each other's lines, backing each other up.", set: { finish: "always", bicker: "back each other", lead: "it swaps" } },
      ],
    },
  });

  W.add("oddOneOut", {
    sliders: [
      ["spotted", "How we spot them", ["what they say", "what they wear", "what they eat", "how they move"], "The detail that shows they don't fit.", { unordered: true }],
      ["isolation", "Space around them in frame", ["in the crowd", "at the edge", "alone in frame"], "How the picture sets them apart, which draws our eye to them."],
      ["comesAround", "Group comes around", ["never", "slowly", "all at once"], "Whether the group finally accepts them."],
      ["turnsAt", "When the tide turns", [0, 100, "%"], "How far through the story the group's attitude changes.", { from: 75, to: 75 }],
    ],
    window: {
      faces: [
        { face: "dial", slider: "gap" },
        { face: "frame", x: "isolation" },
        { face: "tiles", slider: "group", icons: { "ignores them": "🙄", "teases them": "😜", "welcomes them": "🤗", "follows them": "🚶‍♂️" } },
      ],
      groups: [
        { label: "The misfit", sliders: ["gap", "spotted", "tries"] },
        { label: "The group", sliders: ["group", "isolation"] },
        { label: "Over time", sliders: ["comesAround", "turnsAt"] },
      ],
      presets: [
        { label: "Napoleon Dynamite", plain: "Doesn't care, teased, and the group follows him at the end.", set: { tries: "doesn't care", group: "follows them", comesAround: "all at once", turnsAt: 90 } },
        { label: "Mean Girls new kid", plain: "Tries desperately, stands at the edge of the frame.", set: { tries: "desperately", isolation: "at the edge", spotted: "what they wear" } },
        { label: "Vegan at the barbecue", plain: "Spotted by what they eat, alone in frame.", set: { spotted: "what they eat", isolation: "alone in frame", group: "teases them", gap: 4 } },
      ],
    },
  });

  W.add("chemistry", {
    sliders: [
      ["looks", "Looks between them", ["avoid", "glance", "hold", "can't look away"], "How their eyes meet."],
      ["closeness", "Space between them", ["far apart", "arm's length", "close", "touching"], "Physical distance in the frame."],
      ["timing", "Their timing together", ["out of step", "catching", "in rhythm"], "How well their lines and moves land on each other's beats."],
      ["grows", "How it grows", ["sparks at once", "slow burn", "on and off"], "The shape of the spark over the film.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "dial", slider: "spark" },
        { face: "pad", x: "closeness", y: "looks", xLabel: "Space between", yLabel: "Looks" },
        { face: "swatches", slider: "kind", colors: { comic: "#FFC845", romantic: "#E85C7A", rivalry: "#D9452B", family: "#6FA86A" } },
      ],
      groups: [
        { label: "The spark", sliders: ["spark", "kind", "grows"] },
        { label: "Bodies and eyes", sliders: ["looks", "closeness", "mirror"] },
        { label: "Rhythm", sliders: ["timing"] },
      ],
      presets: [
        { label: "When Harry Met Sally", plain: "A romantic slow burn, in rhythm, glances becoming holds.", set: { kind: "romantic", grows: "slow burn", timing: "in rhythm", looks: "glance" } },
        { label: "Rival sparks", plain: "Can't look away, arm's length, out of step.", set: { kind: "rivalry", looks: "can't look away", closeness: "arm's length", timing: "out of step" } },
        { label: "Comic soulmates", plain: "Instant comic spark, mirroring in sync.", set: { kind: "comic", grows: "sparks at once", mirror: "in sync", spark: 5 } },
      ],
    },
  });

  W.add("comedyTopic", {
    sliders: [
      ["angle", "How it's seen", ["observed", "exaggerated", "flipped", "personal"], "The way the joke looks at its subject.", { unordered: true }],
      ["depth", "How deep it goes", ["surface", "a real point", "a hard truth"], "Whether the joke says something true under the laugh."],
      ["returns", "Comes back in the film", [0, 6, ""], "How many times this subject returns as a source of jokes."],
      ["touches", "Who in the cast it touches", ["one person", "a few", "everyone"], "How widely the topic reaches across the characters."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { manners: "🎩", rules: "📜", work: "💼", money: "💰", status: "👑", family: "👨‍👩‍👧", love: "❤️", age: "👴", "the body": "🫃", food: "🍔", technology: "📱", fear: "😱", ego: "🪞", death: "💀" } },
        { face: "tiles", slider: "punch", icons: { "the self": "🙋", "an equal": "🤝", "the powerful": "⬆️", "the powerless": "⬇️" } },
        { face: "dial", slider: "relatable" },
      ],
      groups: [
        { label: "The subject", sliders: ["setting", "angle", "depth"] },
        { label: "The target", sliders: ["punch", "relatable"] },
        { label: "Across the film", sliders: ["returns", "touches"] },
      ],
      presets: [
        { label: "Seinfeld observation", plain: "Manners, observed, very relatable, surface level.", set: { setting: "manners", angle: "observed", relatable: 5, depth: "surface" } },
        { label: "Punch up satire", plain: "Status, aimed at the powerful, with a hard truth.", set: { setting: "status", punch: "the powerful", depth: "a hard truth", angle: "exaggerated" } },
        { label: "Self-deprecating", plain: "The body, aimed at the self, personal.", set: { setting: "the body", punch: "the self", angle: "personal" } },
      ],
    },
  });

  W.add("comicTiming", {
    sliders: [
      ["rush", "Rush or drag the beat", ["rushed", "on the beat", "dragged"], "Whether the line comes in early, right on time, or a touch late."],
      ["stepOn", "Next line steps on the laugh", ["never", "sometimes", "often"], "How often a new line starts before the laugh has finished."],
      ["rhythmBreak", "Break the rhythm", ["steady", "one surprise pause", "keeps shifting"], "Whether the timing stays predictable or springs a pause on us."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "pace" },
        { face: "balance", slider: "rush", left: "rushed", right: "dragged" },
      ],
      groups: [
        { label: "Before the line", sliders: ["setting", "rush"] },
        { label: "The exchange", sliders: ["pace", "stepOn", "rhythmBreak"] },
        { label: "After the laugh", sliders: ["holdAfter", "onCut"] },
      ],
      presets: [
        { label: "Jack Benny pause", plain: "Four beats of silence, dragged, then hold.", set: { setting: 4, rush: "dragged", pace: "slow", holdAfter: 3 } },
        { label: "30 Rock rapid fire", plain: "No pause, lines stepping on laughs, landing on the cut.", set: { setting: 0, pace: "rapid fire", stepOn: "often", onCut: "on the cut" } },
        { label: "Altman overlap", plain: "Overlapping talk with one surprise pause.", set: { pace: "overlapping", rhythmBreak: "one surprise pause", stepOn: "often" } },
      ],
    },
  });

  W.add("comicRegister", {
    sliders: [
      ["faceMoves", "How much the face moves", [0, 5, ""], "From a stone face to rubbery expressions."],
      ["voice", "Voice size", ["whisper", "normal", "raised", "shouting"], "How loud and big the voice plays."],
      ["body", "Body size", ["still", "small gestures", "big gestures", "full body"], "How much the body joins the performance."],
      ["contrast", "Against the others", ["matches them", "a bit off", "opposite"], "Whether this register matches the people around them or stands out against them."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["faceMoves", "voice", "body"] },
        { face: "balance", slider: "contrast", left: "matches them", right: "opposite" },
      ],
      groups: [
        { label: "The register", sliders: ["setting", "consistency", "contrast"] },
        { label: "Face, voice, body", sliders: ["faceMoves", "voice", "body"] },
        { label: "How visible", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Aubrey Plaza deadpan", plain: "Stone face, quiet voice, still body.", set: { setting: "deadpan", faceMoves: 0, voice: "normal", body: "still", consistency: "never breaks" } },
        { label: "Jim Carrey cartoon", plain: "Rubber face, shouting, full body.", set: { setting: "cartoon", faceMoves: 5, voice: "shouting", body: "full body" } },
        { label: "Straight face in chaos", plain: "Dry and still, opposite to a big room.", set: { setting: "dry", contrast: "opposite", body: "small gestures" } },
      ],
    },
  });

  W.add("laughsPerMinute", {
    sliders: [
      ["shape", "Laughs over the scene", ["front loaded", "even", "builds to the end"], "Where the laughs pile up across the scene.", { unordered: true }],
      ["bigOneAt", "Where the big laugh lands", [0, 100, "%"], "How far through the scene the biggest laugh comes.", { from: 85, to: 85 }],
      ["clusters", "Laughs in clusters", ["spread out", "in pairs", "in bursts"], "Whether laughs come one by one or in rolling bursts."],
      ["quietAfter", "Quiet after the big laugh", [0, 10, "s"], "Seconds of room after the biggest laugh so the audience can recover."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "size" },
        { face: "pad", x: "bigOneAt", y: "quietAfter", xLabel: "Big laugh lands", yLabel: "Quiet after" },
      ],
      groups: [
        { label: "How many", sliders: ["setting", "size"] },
        { label: "Shape across the scene", sliders: ["shape", "clusters", "bigOneAt"] },
        { label: "Breathing room", sliders: ["breather", "quietAfter"] },
      ],
      presets: [
        { label: "Zucker-Abrahams wall", plain: "Ten laughs a minute in bursts, no breathers.", set: { setting: 10, clusters: "in bursts", breather: 0, size: "laughs" } },
        { label: "Dramedy smiles", plain: "A few smiles spread out, lots of room.", set: { setting: 2, size: "smiles", clusters: "spread out", breather: 5 } },
        { label: "Build to the big one", plain: "Laughs build to one huge laugh near the end.", set: { shape: "builds to the end", bigOneAt: 90, size: "big laughs", quietAfter: 5 } },
      ],
    },
  });

  W.add("mixLaughs", {
    sliders: [
      ["source", "Where the mix laughs come from", ["looks", "clashing habits", "what they say", "what they do"], "Which part of the mix makes us laugh.", { unordered: true }],
      ["builds", "Builds over the scene", ["flat", "slowly", "steeply"], "Whether the laughs from the mix grow as the scene goes on."],
      ["shakeUp", "Someone shakes up the mix", ["no one", "a small shake", "a big shake"], "A new arrival or change that resets who is funny with whom."],
      ["reactRoom", "Room for reactions", [0, 5, ""], "How much space the scene leaves for faces reacting to each other."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "balance", slider: "balance", left: "one of them", right: "the whole room" },
        { face: "tiles", slider: "source", icons: { looks: "👀", "clashing habits": "🧦", "what they say": "💬", "what they do": "🤸" } },
      ],
      groups: [
        { label: "From the mix", sliders: ["setting", "source", "builds"] },
        { label: "Who gets them", sliders: ["who", "balance"] },
        { label: "Shaking it up", sliders: ["shakeUp", "reactRoom"] },
      ],
      presets: [
        { label: "Parks and Rec room", plain: "The room is the main source, shared, lots of reaction space.", set: { setting: "the main source", balance: "the whole room", who: "the room", reactRoom: 5 } },
        { label: "Odd Couple habits", plain: "Clashing habits build slowly between two.", set: { source: "clashing habits", builds: "slowly", balance: "shared" } },
        { label: "New arrival", plain: "A big shake changes who is funny with whom.", set: { shakeUp: "a big shake", builds: "steeply" } },
      ],
    },
  });

  W.add("wordplay", {
    sliders: [
      ["density", "Wordplay per minute", [0, 10, ""], "How thickly the language games are packed."],
      ["caught", "Others catch it", ["no one", "groans", "laughs", "tops it"], "How the other characters respond to the wordplay."],
      ["landPause", "Pause for it to land", [0, 3, "s", 0.5], "A beat so the audience can catch the double meaning."],
      ["chain", "Builds a chain of words", ["one-off", "a pair", "a running chain"], "Whether one pun leads to another and another."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { pun: "🥁", misunderstanding: "❓", comeback: "🔥", malapropism: "🤪", repetition: "🔁" } },
        { face: "ladder", slider: "cleverness" },
        { face: "dial", slider: "density" },
      ],
      groups: [
        { label: "The words", sliders: ["kind", "cleverness", "chain"] },
        { label: "Pace", sliders: ["speed", "density", "landPause"] },
        { label: "The room", sliders: ["caught"] },
      ],
      presets: [
        { label: "Marx Brothers barrage", plain: "Quick puns chaining one after another.", set: { kind: "pun", speed: "quick", chain: "a running chain", density: 8 } },
        { label: "Groaner dad joke", plain: "A slow pun, a pause, and everyone groans.", set: { kind: "pun", cleverness: "groaner", landPause: 1.5, caught: "groans" } },
        { label: "Sorkin comeback duel", plain: "Sharp comebacks, topped again and again.", set: { kind: "comeback", cleverness: "brilliant", caught: "tops it", speed: "quick" } },
      ],
    },
  });

  W.add("understatement", {
    sliders: [
      ["chaosBehind", "Chaos shown behind them", [0, 5, ""], "How much disaster we see around the calm line, which makes the gap bigger."],
      ["beatBefore", "Beat before the line", [0, 3, "s", 0.5], "A pause before the understated line, so it lands drier."],
      ["straightFace", "Straight face holds", ["cracks", "nearly holds", "stone still"], "Whether the speaker keeps their composure."],
      ["answered", "Someone answers in kind", ["no one", "one person", "everyone"], "Whether others join in the same calm mismatch."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "direction", left: "huge treated as tiny", right: "tiny treated as huge" },
        { face: "dial", slider: "gap" },
        { face: "tiles", slider: "delivery", icons: { mumbled: "😶", "matter of fact": "😐", precise: "🧐", grand: "🎭" } },
      ],
      groups: [
        { label: "The mismatch", sliders: ["direction", "gap", "chaosBehind"] },
        { label: "Delivery", sliders: ["delivery", "beatBefore", "straightFace"] },
        { label: "The room", sliders: ["answered"] },
      ],
      presets: [
        { label: "Monty Python 'flesh wound'", plain: "Huge treated as tiny, matter of fact, chaos all around.", set: { direction: "huge treated as tiny", delivery: "matter of fact", chaosBehind: 5, straightFace: "stone still" } },
        { label: "Mock epic", plain: "A tiny thing treated as huge, grandly.", set: { direction: "tiny treated as huge", delivery: "grand", gap: 5 } },
        { label: "British stiff upper lip", plain: "Everyone answers the disaster calmly.", set: { answered: "everyone", delivery: "precise", beatBefore: 1 } },
      ],
    },
  });

  W.add("visualGag", {
    sliders: [
      ["onScreen", "Time on screen", [0, 10, "s"], "How long the gag stays in the picture."],
      ["inFocus", "In focus", ["blurred", "soft", "sharp"], "Whether the gag is sharp enough to read."],
      ["kind", "Kind of gag", ["a sign", "a prop", "a background action", "a costume", "a match of shapes"], "What the visual joke is made of.", { unordered: true }],
      ["pointsOut", "Camera points it out", ["never", "a slight drift", "a push in", "a cut to it"], "How much the camera steers our eye to the gag."],
    ],
    window: {
      faces: [
        { face: "frame", x: "place" },
        { face: "tiles", slider: "kind", icons: { "a sign": "🪧", "a prop": "🧸", "a background action": "🏃", "a costume": "👗", "a match of shapes": "🔷" } },
        { face: "ladder", slider: "pointsOut" },
      ],
      groups: [
        { label: "The gag", sliders: ["kind", "count", "place"] },
        { label: "How easy to see", sliders: ["subtlety", "inFocus", "onScreen"] },
        { label: "Steering the eye", sliders: ["pointsOut"] },
      ],
      presets: [
        { label: "Airplane! background", plain: "Many gags in the background, blink and miss them.", set: { place: "background", subtlety: "blink and miss it", count: 5, pointsOut: "never" } },
        { label: "Wes Anderson sign", plain: "A sharp sign in the center, held.", set: { kind: "a sign", place: "center", inFocus: "sharp", onScreen: 4 } },
        { label: "Reveal by push in", plain: "The camera pushes in to show the gag.", set: { pointsOut: "a push in", subtlety: "unmissable" } },
      ],
    },
  });

  W.add("comicSound", {
    sliders: [
      ["style", "Style of sound", ["real", "slightly heightened", "cartoon"], "From real-world sounds to cartoon boings."],
      ["lands", "Sound lands", ["early", "on the hit", "a beat late"], "When the funny sound hits against the action.", { unordered: true }],
      ["musicStop", "Music stops dead", ["never", "once", "a running bit"], "A record scratch or sudden cut to silence."],
      ["loudness", "How loud the funny sound", [0, 100, "%"], "How far the comic sound sits above the rest of the mix.", { from: 60, to: 60 }],
    ],
    window: {
      faces: [
        { face: "mixer", sliders: ["effects", "loudness", "silenceBeat"] },
        { face: "tiles", slider: "sting", icons: { none: "🔇", soft: "🎵", obvious: "🎺" } },
        { face: "balance", slider: "style", left: "real", right: "cartoon" },
      ],
      groups: [
        { label: "Sound effects", sliders: ["effects", "style", "loudness"] },
        { label: "Music", sliders: ["sting", "musicStop"] },
        { label: "Timing and silence", sliders: ["lands", "silenceBeat"] },
      ],
      presets: [
        { label: "Looney Tunes", plain: "Cartoon effects, obvious stings, loud.", set: { style: "cartoon", effects: 5, sting: "obvious", loudness: 90 } },
        { label: "Record scratch freeze", plain: "The music stops dead, then a pointed silence.", set: { musicStop: "once", silenceBeat: 3, sting: "none" } },
        { label: "Dry indie", plain: "Real sounds, a beat late, soft.", set: { style: "real", lands: "a beat late", effects: 1, loudness: 30 } },
      ],
    },
  });

  W.add("topper", {
    sliders: [
      ["beatBefore", "Beat before the topper", [0, 5, "s", 0.5], "How long the first laugh rings before the topper lands."],
      ["surprise", "How unexpected", [0, 5, ""], "How far out of left field the topper comes."],
      ["lastLaugh", "Who gets the last laugh", ["the joker", "the target", "a bystander", "the camera"], "Who ends up winning the exchange.", { unordered: true }],
      ["endsScene", "Ends the scene", ["no", "sometimes", "always"], "Whether the topper is the button that closes the scene."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "count" },
        { face: "balance", slider: "bigger", left: "smaller", right: "bigger" },
        { face: "tiles", slider: "from", icons: { "the same character": "🙋", "another character": "👉", "the background": "🖼️", "the edit": "✂️" } },
      ],
      groups: [
        { label: "How many", sliders: ["count", "bigger"] },
        { label: "Where it comes from", sliders: ["from", "lastLaugh", "surprise"] },
        { label: "Timing", sliders: ["beatBefore", "endsScene"] },
      ],
      presets: [
        { label: "Simpsons triple", plain: "Three toppers, each bigger, ending the scene.", set: { count: 3, bigger: "bigger", endsScene: "always" } },
        { label: "Background zinger", plain: "One surprise from the background after a long beat.", set: { count: 1, from: "the background", beatBefore: 2.5, surprise: 5 } },
        { label: "The edit tops it", plain: "A cut delivers the last laugh.", set: { from: "the edit", lastLaugh: "the camera", beatBefore: 1 } },
      ],
    },
  });

  W.add("specificity", {
    sliders: [
      ["saidLike", "Said like it's normal", ["pointed out", "casual", "dead serious"], "How the oddly specific detail is delivered; the straighter, the funnier."],
      ["piled", "Details piled up", [1, 8, ""], "How many precise details stack together."],
      ["comesBack", "Comes back later", ["never", "once", "becomes a running gag"], "Whether the specific detail returns."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "level" },
        { face: "tiles", slider: "where", icons: { "a line": "💬", "a prop": "🧸", "the set": "🏠", "a costume": "👕" } },
        { face: "dial", slider: "piled" },
      ],
      groups: [
        { label: "The detail", sliders: ["level", "where", "piled"] },
        { label: "Delivery", sliders: ["saidLike", "comesBack"] },
        { label: "How visible", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Coen brothers line", plain: "An absurdly specific line said dead serious.", set: { level: "absurdly specific", where: "a line", saidLike: "dead serious" } },
        { label: "Wes Anderson set", plain: "Oddly specific details piled across the set.", set: { level: "oddly specific", where: "the set", piled: 8, saidLike: "casual" } },
        { label: "Running detail", plain: "A specific prop that becomes a running gag.", set: { where: "a prop", comesBack: "becomes a running gag" } },
      ],
    },
  });

  W.add("exaggeration", {
    sliders: [
      ["grows", "How it grows", ["sudden", "step by step", "slow swell"], "The way the thing gets bigger than life.", { unordered: true }],
      ["othersReact", "Others treat it as normal", ["shocked", "half notice", "totally normal"], "Whether the world around it reacts, or plays it straight."],
      ["deflate", "Snaps back to real", ["never", "slowly", "with a pop"], "Whether and how it shrinks back to normal."],
      ["peakAt", "When it peaks", [0, 100, "%"], "How far through the scene the exaggeration is at its biggest.", { from: 70, to: 70 }],
    ],
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "tiles", slider: "what", icons: { "a reaction": "😱", "a description": "📢", "a problem": "🔥", "a body": "💪", "a prop": "🍔" } },
        { face: "ladder", slider: "othersReact" },
      ],
      groups: [
        { label: "Blown up", sliders: ["size", "what", "grows", "peakAt"] },
        { label: "The world", sliders: ["othersReact", "deflate"] },
        { label: "How visible", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Tex Avery reaction", plain: "A sudden huge reaction that pops back.", set: { what: "a reaction", size: 5, grows: "sudden", deflate: "with a pop" } },
        { label: "Tall tale", plain: "A description that swells slowly, nobody blinks.", set: { what: "a description", grows: "slow swell", othersReact: "totally normal" } },
        { label: "Problem from nothing", plain: "A small problem growing step by step to a peak.", set: { what: "a problem", grows: "step by step", peakAt: 90 } },
      ],
    },
  });

  W.add("cutawayGag", {
    sliders: [
      ["trigger", "What sets it off", ["a line", "a look", "a word", "a sound"], "The thing in the scene that sends us away.", { unordered: true }],
      ["looksDifferent", "Looks different", ["same look", "a new color", "a new style", "a whole new medium"], "How much the cutaway changes the picture so we know we've left."],
      ["comingBack", "Back in the scene", ["as if nothing", "someone reacts", "someone saw it too"], "What happens when we return from the cutaway."],
      ["perScene", "Cutaways per scene", [0, 6, ""], "How often the scene jumps away."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "length" },
        { face: "tiles", slider: "kind", icons: { "a memory": "💭", "an imagined moment": "✨", "somewhere else": "📍", "a contradiction": "❌" } },
        { face: "ladder", slider: "looksDifferent" },
      ],
      groups: [
        { label: "The cutaway", sliders: ["kind", "length", "looksDifferent"] },
        { label: "In and out", sliders: ["trigger", "comingBack", "perScene"] },
        { label: "How visible", sliders: ["noticeable", "change"] },
      ],
      presets: [
        { label: "Family Guy 'like the time'", plain: "A line triggers a long memory, back as if nothing happened.", set: { trigger: "a line", kind: "a memory", length: 10, comingBack: "as if nothing" } },
        { label: "Scrubs daydream", plain: "An imagined moment in a new style.", set: { kind: "an imagined moment", looksDifferent: "a new style", length: 5 } },
        { label: "Quick contradiction", plain: "A one-second cut proving them wrong.", set: { kind: "a contradiction", length: 1, perScene: 3 } },
      ],
    },
  });

  W.add("straightMan", {
    sliders: [
      ["reacts", "Lets out a reaction", ["not even a blink", "a look", "a sigh", "a line"], "The small leak of feeling that gives the audience its cue."],
      ["cracksAt", "When they finally crack", [0, 100, "%"], "How far through the film they finally lose it; 100 means never.", { from: 100, to: 100 }],
      ["speaksForUs", "Speaks for the audience", ["silent", "now and then", "says what we think"], "How often they voice what the audience is thinking, which keeps us anchored."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "calm" },
        { face: "dial", slider: "cracksAt" },
        { face: "tiles", slider: "who", icons: { "the lead": "⭐", "the friend": "🤝", "a stranger": "🕵️", "the whole room": "👥" } },
      ],
      groups: [
        { label: "Staying straight", sliders: ["calm", "reacts", "cracksAt"] },
        { label: "Who and what they see", sliders: ["who", "sees"] },
        { label: "The audience", sliders: ["speaksForUs"] },
      ],
      presets: [
        { label: "Leslie Nielsen", plain: "Unmoved, no idea how strange it is.", set: { calm: "unmoved", sees: "has no idea", reacts: "not even a blink" } },
        { label: "Bob Newhart", plain: "Patient, fully sees it, says what we think with a sigh.", set: { calm: "patient", sees: "fully sees", reacts: "a sigh", speaksForUs: "says what we think" } },
        { label: "Finally snaps", plain: "Holds it together most of the film, then loses it.", set: { calm: "rattled", cracksAt: 85, reacts: "a line" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
