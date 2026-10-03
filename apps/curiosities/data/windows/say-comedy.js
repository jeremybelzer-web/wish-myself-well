/* Comedy: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("mixPlot", {
    "let it snowball": { setting: "a collapse", spread: "wildfire", fuse: "early" },
    "everything falls apart": { setting: "a collapse", fixable: "no way back", spread: "wildfire" },
    "just a small hiccup": { setting: "a snag", fixable: "easily", spread: "contained" },
    "send them sideways": { setting: "a detour", fixable: "with effort" },
    "last-second disaster": { setting: "a collapse", fuse: "at the last second", seenComing: "no" },
    "pin it on the wrong guy": { blame: "the wrong one", setting: "a turn" },
    "drag everyone in": { who: "everyone", spread: "wildfire", peopleCaught: 15 },
    "see it coming a mile off": { seenComing: "well before" },
    "keep it in the room": { spread: "contained", peopleCaught: 2 },
  });

  W.say("comicFlaw", {
    "make him a coward": { flaw: "cowardice", trigger: "the smallest thing" },
    "so full of himself": { flaw: "vanity", blind: "completely blind", size: 4 },
    "they have no clue": { flaw: "cluelessness", blind: "completely blind" },
    "a lovable mess": { likeable: 5, cost: "some pride", byTheEnd: "cracks a little" },
    "make them unlikeable": { likeable: 0, whoPays: "a friend" },
    "never learns": { byTheEnd: "worse than ever", blind: "completely blind" },
    "grows out of it": { byTheEnd: "overcomes it", blind: "sees it" },
    "set them off easily": { trigger: "the smallest thing", showsPerScene: 6 },
    "it costs them everything": { cost: "everything", whoPays: "themselves" },
    "show it from frame one": { firstShown: "opening shot" },
    "desperate for approval": { flaw: "neediness", size: 4 },
  });

  W.say("comicPremise", {
    "nail the logline": { clarity: 5, clearBy: "first line", hook: 5 },
    "keep it grounded": { grounded: "real", rules: "strictly" },
    "go full cartoon": { grounded: "cartoon", rules: "anything goes" },
    "mine the premise": { mined: 5, newAngles: 7, premiseJokes: 5 },
    "one-joke movie": { mined: 1, newAngles: 1 },
    "raise the stakes": { stakes: "life and death" },
    "low stakes and silly": { stakes: "nothing", grounded: "heightened" },
    "slow reveal of the idea": { clearBy: "midway", clarity: 2 },
    "every joke from the premise": { premiseJokes: 6, screenShare: 90, themeLink: "it is the theme" },
  });

  W.say("escalatingLie", {
    "lie on top of lie": { layers: 6, size: 4, madeUp: "too many" },
    "white lie": { size: 1, layers: 1, madeUp: "none", near: "safe" },
    "house of cards": { size: 5, near: "about to fall", layers: 5 },
    "a terrible liar": { liarSkill: "terrible", coverPause: 4 },
    "lies like breathing": { liarSkill: "a natural", coverPause: 0 },
    "let the audience in on it": { audienceIn: "knows from the start" },
    "it all blows up": { collapseHow: "it all comes out at once", near: "collapsed" },
    "caught red-handed late": { collapseHow: "caught red-handed", collapseAt: 90 },
    "fool the whole room": { fooled: 10, toldTo: "a crowd" },
    "stall for the cover": { coverPause: 6, liarSkill: "shaky" },
  });

  W.say("misunderstanding", {
    "wires crossed": { depth: 3, source: "a half-heard talk" },
    "classic farce": { depth: 5, nearMisses: 6, peopleIn: 8, clearsUp: "a shouting match" },
    "they misheard": { source: "a misheard word" },
    "mistaken identity": { source: "a wrong identity", depth: 4 },
    "let us in on it early": { audienceAhead: "from the start", who: "the audience" },
    "everyone talks past each other": { doubleLines: 5, who: "one character" },
    "let it dawn on them": { dawnSilence: 4, clearsUp: "quietly" },
    "big reveal at the end": { clearsUp: "one big reveal", audienceAhead: "at the end" },
    "keep it small and sweet": { depth: 1, between: "a couple", clearsUp: "quietly" },
  });

  W.say("whoKnows", {
    "everyone's in on it": { gap: "all but one", inOn: 15, outsider: "doesn't suspect" },
    "keep the audience in the dark": { audience: "no" },
    "tell the audience everything": { audience: "everything", hiding: 4 },
    "bomb under the table": { audience: "everything", gap: "one", closeCalls: 6 },
    "almost spill it": { leak: "on the tip of a tongue", closeCalls: 8 },
    "someone blurts it out": { leak: "blurted", revealAt: "midway" },
    "trade knowing looks": { secretLooks: 5, lookLength: 2 },
    "they start to catch on": { outsider: "senses something" },
    "keep it buttoned up": { leak: "sealed", revealAt: "at the very end" },
  });

  W.say("comicEscalation", {
    "let it spiral": { setting: 5, speed: "snowball", ceiling: "disaster" },
    "slow build": { speed: "slow burn", stepGap: 40, steps: 6 },
    "go from zero to chaos": { speed: "instant", stepJump: 200, ceiling: "chaos" },
    "keep raising the bar": { steps: 8, stepJump: 60, setting: 4 },
    "keep it a little awkward": { ceiling: "awkward", setting: 1 },
    "end of the world": { ceiling: "apocalyptic", peopleAtEnd: 50 },
    "calm before the storm": { falseCalm: "a false calm", calmLength: 8 },
    "point of no return": { noReturn: 60 },
    "make it bigger": { setting: 4, stepJump: 80 },
  });

  W.say("comicBeat", {
    "plant it early": { plantedWhen: "the opening", plantToPayoff: 60 },
    "pay it off": { setting: "payoff lands", payoffSize: "a laugh" },
    "hide the setup": { visibility: "hidden", disguise: "a different joke" },
    "underline the setup": { visibility: "underlined", setupSeen: 10 },
    "flip the payoff": { twist: "turned upside down" },
    "bury it in the background": { disguise: "a prop in the background", visibility: "background" },
    "biggest laugh of the movie": { payoffSize: "the biggest laugh", builds: 5 },
    "let the joke breathe": { payoffPause: 2 },
    "plant and pay it fast": { plantedWhen: "just before", plantToPayoff: 1 },
  });

  W.say("payoffDistance", {
    "long fuse": { setting: 9, minutes: 90, landsAt: "the finale" },
    "pay it off right away": { setting: 0, minutes: 1, landsAt: "mid scene" },
    "remind them along the way": { reminder: "several", reminderLook: "a glance" },
    "let them forget it": { forget: 5, reminder: "none" },
    "make it click instantly": { recognize: "instantly", noticeable: "clear" },
    "save it for the finale": { landsAt: "the finale", setting: 10 },
    "button the act": { landsAt: "end of an act" },
    "plant it in a prop": { plantedIn: "a prop", reminderLook: "a prop on screen" },
  });

  W.say("typeClash", {
    "total opposites": { setting: "opposite types", size: "two", friction: 4 },
    "two peas in a pod": { setting: "the same type", friction: 0 },
    "chalk and cheese": { setting: "opposite types", flashpoint: "everything" },
    "they can't stand each other": { friction: 5, clashesPerScene: 6, apart: 6 },
    "they need each other": { need: "can't do it alone" },
    "fight over little habits": { flashpoint: "small habits", clashesPerScene: 4 },
    "clash from the first meeting": { showsWhen: "at first meeting" },
    "swap who's the straight one": { roleSwap: "often" },
    "whole gang of misfits": { size: "an ensemble", setting: "different types" },
  });

  W.say("chaosInRoom", {
    "wrecking ball at a funeral": { setting: "one chaos character", order: "solemn", entrance: "bursts in" },
    "total mayhem": { setting: "all chaos", spread: "whole room", damage: "the event" },
    "keep it buttoned-down": { setting: "all orderly", keepOrder: 5 },
    "a dog loose at the party": { source: "an animal", entrance: "bursts in", spread: "whole room" },
    "let it creep in": { entrance: "creeps in", peakAt: 85 },
    "fancy dinner goes wrong": { order: "formal", damage: "manners", setting: "mostly chaos" },
    "keep a lid on it": { keepOrder: 5 },
    "it hits early": { arrivesAt: 10, peakAt: 40 },
    "stay with one troublemaker": { spread: "stays with one", setting: "one loose person" },
  });

  W.say("statusGap", {
    "master and butler": { setting: "master and servant", playing: "both play to rank" },
    "take them down a peg": { fall: 5, flip: "a full reversal" },
    "the servant runs the show": { playing: "the low one plays high", flip: "a full reversal" },
    "the boss acts like a peasant": { playing: "the high one plays low" },
    "make them look powerful": { setting: "big gap", lookUp: 30, heightGap: 30 },
    "make them look small": { lookUp: -30, heightGap: -30 },
    "pompous windbag": { pretense: 5, fall: 4, rootFor: "the low one" },
    "level playing field": { setting: "equals", heightGap: 0, lookUp: 0 },
    "turn the tables late": { flip: "a full reversal", shiftWhen: "late" },
  });

  W.say("mixArc", {
    "reset by next episode": { sticks: "snaps back", setting: "no change" },
    "they both grow": { learns: "both", direction: "much better", sticks: "for good" },
    "a little heart at the end": { direction: "a little better", shownBy: "a small gesture", changeAt: 90 },
    "fight it all the way": { resists: 5 },
    "break them open": { setting: "a break", pace: "all at once" },
    "hug it out": { shownBy: "a big act", direction: "much better" },
    "they get worse together": { direction: "worse" },
    "slow thaw": { pace: "slowly over the film", resists: 3 },
  });

  W.say("callback", {
    "bring it back": { times: 2, form: "exact repeat" },
    "call back the opening": { distance: 60, minutesBack: 90, landsOn: "last line of the film" },
    "button the scene with it": { landsOn: "button of a scene" },
    "give the line to someone else": { form: "same words, new speaker" },
    "make it land sad": { mood: "sadder", form: "same words, new meaning" },
    "make it sweeter": { mood: "sweeter" },
    "just a wink to it": { form: "only hinted", leadIn: "none" },
    "milk it": { times: 5, memorable: 5 },
    "let it land": { callPause: 1.5 },
  });

  W.say("misdirection", {
    "fake them out": { strength: 4, fooledFor: "a moment" },
    "pull back to reveal": { reveal: "a pull-back wide", hiddenShare: 60 },
    "pull the rug": { strength: 5, reveal: "on a cut", fairness: "mostly fair" },
    "play it fair": { fairness: "fully fair", clues: 4 },
    "cheat the audience": { fairness: "a cheat", clues: 0 },
    "they think someone died": { expect: "sad news", fooledFor: "the whole scene" },
    "make it look scary": { expect: "danger" },
    "hold the reveal": { revealBeat: 2, revealTakes: 4 },
    "string them along": { fooledFor: "several scenes", fooledWithUs: "everyone" },
  });

  W.say("irony", {
    "say the opposite": { kind: "said one thing, meant another", obviousness: 2 },
    "dramatic irony": { kind: "the audience knows more", findsOut: "too late" },
    "be careful what you wish for": { kind: "the opposite happens", bite: "stings" },
    "keep it dry": { obviousness: 1, pointedOut: "left alone" },
    "make it cruel": { bite: "cruel", tone: "tragic" },
    "laugh through the tears": { tone: "bittersweet", bite: "gently" },
    "hit it with a sting": { pointedOut: "a music sting", obviousness: 5 },
    "let it sit": { holdOnIt: 5, feltBeat: 2 },
    "they figure it out in time": { findsOut: "just in time" },
  });

  W.say("fishOutOfWater", {
    "totally lost": { mismatch: 5, confidence: "unsure", adapts: "never" },
    "new kid in town": { mismatch: 3, world: "a new country", confidence: "painfully shy" },
    "clueless but confident": { confidence: "wrongly sure", visibility: 5 },
    "stick out like a sore thumb": { visibility: 5, fromOthers: 5 },
    "blend in too fast": { adapts: "too quickly", fitAt: 20 },
    "find their feet slowly": { adapts: "slowly", fitAt: 80 },
    "their weirdness saves the day": { useful: "saves the day" },
    "from another time": { world: "a new time" },
  });

  W.say("humiliation", {
    "sell the fall": { size: 5, witnesses: "everyone", dragsOn: 10 },
    "let them squirm": { dragsOn: 25, recoverSec: 20 },
    "they had it coming": { earned: "completely", laughsAt: "everyone" },
    "poor thing": { earned: "not at all", laughsAt: "the audience only" },
    "in front of everyone": { witnesses: "everyone", laughsAt: "everyone" },
    "nobody saw": { witnesses: "no one", size: 1 },
    "shake it off": { recovery: "bounce back", recoverSec: 2 },
    "spin it into a win": { recovery: "turn it into a win" },
    "go in tight on the shame": { frameSize: 150 },
  });

  W.say("egoClash", {
    "measuring contest": { petty: "absurdly petty", over: "who's best", tactics: "one-upping" },
    "get in each other's face": { standOff: 0.3, louderBy: 60 },
    "polite knives out": { tactics: "polite digs", petty: "a bit silly" },
    "come to blows": { tactics: "physical", size: 5 },
    "quick comebacks": { comebackGap: 0.5, rounds: 6 },
    "nobody wins": { winner: "both lose" },
    "fight over who's in charge": { over: "who's in charge" },
    "drag the whole room in": { caught: "the whole room" },
    "keep raising their voices": { louderBy: 80, rounds: 8 },
  });

  W.say("alliances", {
    "everyone switches sides": { shifts: 5, change: "snaps", switchHow: "betray openly" },
    "stab them in the back": { switchHow: "betray openly", change: "snaps" },
    "drift into camps": { switchHow: "drift over", change: "drifts", sides: 2 },
    "always the same one left out": { leftAlone: "always the same one" },
    "whispering in corners": { sideTalk: "whispers", sideGap: 4 },
    "huddle up": { sideTalk: "open huddles" },
    "loyal to the end": { shifts: 0, change: "holds" },
    "family dinner divided": { sides: 2, groupSize: 8, sideGap: 2 },
  });

  W.say("unwantedGuest", {
    "the guest from hell": { wrong: 5, damage: "ruins the day", leaves: "stays all scene" },
    "your ex shows up": { toHost: "an ex", arrives: "walks in" },
    "they just won't leave": { leaves: "stays all scene", stays: 100, knows: "knows and stays" },
    "barge in": { arrives: "bursts in" },
    "hide them from the boss": { toHost: "a boss", hostHides: 5 },
    "show them the door": { leaves: "is pushed out" },
    "totally oblivious": { knows: "no idea" },
    "a little awkward": { wrong: 2, damage: "awkward chat" },
    "keep them at arm's length": { fromHost: 4 },
  });

  W.say("comedyDevice", {
    "deadpan it": { setting: "deadpan", warmth: "teasing" },
    "go dark": { darkness: "dark" },
    "keep it family friendly": { darkness: "innocent", warmth: "affectionate" },
    "joke barrage": { stacked: 6, variety: "keeps changing", storyRoom: "joke first" },
    "story over jokes": { storyRoom: "story first", stacked: 1 },
    "slapstick it": { setting: "slapstick" },
    "quick back-and-forth": { setting: "banter", jokeLength: 5 },
    "roast them": { warmth: "cruel", darkness: "edgy" },
    "warm and gentle": { warmth: "affectionate", darkness: "innocent" },
    "surprise me": { surprise: 5, variety: "keeps changing" },
  });

  W.say("absurdity", {
    "totally bonkers": { setting: 5, ownLogic: "loosely" },
    "nobody bats an eye": { acceptance: "nobody blinks" },
    "commit to the bit": { ownLogic: "strictly", detail: 5, acceptance: "nobody blinks" },
    "slightly off": { setting: 1, arrives: "so slowly we barely notice" },
    "start normal then go weird": { normalFirst: 120, arrives: "step by step" },
    "everyone freaks out": { acceptance: "everyone is shocked" },
    "let it take over": { spills: "takes over", frameShare: 90 },
    "play it with real feeling": { realFeeling: 5 },
  });

  W.say("cringe", {
    "make it painful": { setting: 5, silence: 8, hold: 5 },
    "let the silence hang": { silence: 9, hold: 4 },
    "they don't even know": { selfAware: "oblivious", digsDeeper: "doubles down" },
    "dig a deeper hole": { digsDeeper: "doubles down", blunders: 6 },
    "save them": { rescue: "just in time" },
    "nobody saves them": { rescue: "no one" },
    "in front of the boss": { inFrontOf: "the boss" },
    "a little awkward": { setting: 1, silence: 1 },
    "stay on their face": { faceSize: 150, hold: 5 },
    "on a first date": { inFrontOf: "a date", witnesses: 1 },
  });

  W.say("jokeCarrier", {
    "give it to the funny one": { setting: "the funny one", favors: "the joker" },
    "the laugh is in the reaction": { lookTo: "the reactor", favors: "the listener" },
    "ensemble comedy": { setting: "the whole room", passing: "bounces around", generous: 5 },
    "stone face": { setting: "the straight one", aware: "has no idea" },
    "pass the ball around": { passing: "bounces around", lineShare: 40 },
    "a gag in the background": { setting: "a background person", lookTo: "the background", frameSize: 20 },
    "both in the two-shot": { favors: "both in one shot", setting: "both" },
    "let them hog it": { passing: "stays with one", lineShare: 90, generous: 0 },
  });

  W.say("comicReaction", {
    "do a double take": { setting: "a double take", delay: 1 },
    "spit take": { setting: "a spit take" },
    "slow burn": { setting: "a slow burn", buildTime: 4, hold: 3 },
    "look at the camera": { toCamera: "a long look" },
    "a quick glance to camera": { toCamera: "a glance", hold: 1 },
    "hold on the reaction": { hold: 4, faceSize: 150 },
    "cut to the dog": { whose: "an animal" },
    "the whole room reacts": { whose: "the whole room", count: 4 },
    "no reaction": { setting: "none", count: 0 },
    "don't step on the laugh": { hold: 3, delay: 1 },
  });

  W.say("runningGag", {
    "keep coming back to it": { count: 6, returns: "grows" },
    "run it into the ground": { count: 12, variation: 0, noticed: "everyone groans" },
    "mix it up each time": { variation: 5 },
    "pay it off at the end": { finale: "it finally pays off", lastAt: 95 },
    "bigger every time": { returns: "grows", finale: "a bigger version" },
    "flip it at the end": { finale: "a reversal" },
    "space it out": { spacing: 15, minutesApart: 20 },
    "start it early": { firstAt: 5 },
    "keep it in the background": { noticed: "never", eachLength: 3 },
  });

  W.say("ruleOfThree", {
    "two setups and a punch": { pattern: 3, breakSize: 4 },
    "hit the beat on three": { pattern: 3, breakPause: 0.5, matched: "exact" },
    "snap snap snap": { speed: "quick", itemLength: 1 },
    "drag out the third": { thirdLonger: 200 },
    "break it with a cut": { breakBy: "the edit", breaksIn: "the picture" },
    "someone else breaks it": { breakBy: "another person" },
    "dry and slow on three": { speed: "slow", breakPause: 2, holdAfterBreak: 3 },
    "a wild third": { breakSize: 5 },
    "let the break land": { holdAfterBreak: 2 },
  });

  W.say("physicalComedy", {
    "pratfall": { size: "a fall", getsUp: "bounces up" },
    "sell the fall": { size: "a fall", pain: 4, downFor: 4 },
    "trip over nothing": { size: "a stumble", warning: 0 },
    "bring the house down": { size: "destruction", chain: 6 },
    "domino chain": { chain: 6, precision: "clockwork" },
    "make us wince": { pain: 5, framing: "close" },
    "play it off": { getsUp: "pretends it didn't happen" },
    "messy and loose": { precision: "loose and messy" },
    "see it coming": { warning: 6, buildUp: 5 },
    "shoot it wide": { framing: "wide" },
  });

  W.say("subversion", {
    "flip the cliche": { break: "turned inside out", familiarity: 5 },
    "let the air out": { break: "deflated" },
    "interrupt the kiss": { cliche: "the kiss", break: "deflated", breakBeat: 0.5 },
    "slow-mo walk gone wrong": { cliche: "the slow-motion walk", clichePlays: 10 },
    "play it straight first": { earnest: 5, clichePlays: 15 },
    "wink at it": { selfAware: 4, after: "comments on it" },
    "just move on": { after: "moves on", afterHold: 0 },
    "sit in the awkwardness": { after: "lingers on it", afterHold: 5 },
  });

  W.say("comicEdit", {
    "smash cut": { smashCut: 5, smashGap: 0 },
    "cut on the punchline": { smashCut: 4, holdPast: 0 },
    "let it linger": { holdPast: 4, tempo: "slow" },
    "cut to the contradiction": { contradict: 5 },
    "edgar wright it": { tempo: "frantic", shotLength: 0.5, jumpCuts: 5 },
    "mockumentary style": { cutaway: 3, holdPast: 3 },
    "build then stop dead": { tempoShape: "speeds up then stops dead" },
    "faster cuts": { tempo: "quick", shotLength: 1.5 },
    "let it breathe": { tempo: "slow", shotLength: 8 },
  });

  W.say("fourthWall", {
    "look at the camera": { break: "a glance", lookLength: 2 },
    "talk to the audience": { break: "talks to us", asideLength: 20 },
    "ferris bueller it": { break: "talks to us", attitude: "confiding" },
    "a little side look": { break: "a glance", lookLength: 1, offLens: 10 },
    "freeze the world": { worldPauses: "freezes" },
    "smug look to us": { attitude: "smug" },
    "everyone breaks it": { others: "everyone" },
    "stay in the scene": { break: "never", howOften: 0 },
    "right down the lens": { offLens: 0, faceSize: 120 },
  });

  W.say("doubleAct", {
    "finish each other's sentences": { finish: "always", overlap: "a little", lineGap: -0.3 },
    "rapid-fire banter": { volley: 5, lineGap: 0, overlap: "constantly" },
    "they bicker": { bicker: "bicker" },
    "they've got each other's back": { bicker: "back each other" },
    "the clever one leads": { lead: "the clever one" },
    "shoulder to shoulder": { staging: "side by side", twoShot: 90 },
    "toe to toe": { staging: "face to face", apart: 0.5 },
    "old married couple": { bond: "a couple", bicker: "both" },
    "let the lines breathe": { lineGap: 1.5, overlap: "one at a time" },
  });

  W.say("oddOneOut", {
    "sore thumb": { gap: 5, isolation: "alone in frame" },
    "trying way too hard": { tries: "desperately" },
    "doesn't care what they think": { tries: "doesn't care" },
    "the gang teases them": { group: "teases them" },
    "they win the group over": { comesAround: "slowly", group: "follows them", turnsAt: 80 },
    "push them to the edge": { isolation: "at the edge", fromGroup: 5 },
    "weird clothes": { spotted: "what they wear" },
    "lost in the crowd": { isolation: "in the crowd", groupSize: 30 },
  });

  W.say("chemistry", {
    "they just click": { spark: 5, timing: "in rhythm", mirror: "in sync" },
    "no spark": { spark: 0, timing: "out of step", looks: "avoid" },
    "can't keep their eyes off": { looks: "can't look away", lookHold: 4 },
    "slow burn romance": { kind: "romantic", grows: "slow burn" },
    "frenemies": { kind: "rivalry", grows: "on and off" },
    "on the same wavelength": { mirror: "in sync", answerGap: 0 },
    "keep them apart": { closeness: "far apart", meters: 2.5 },
    "close and cozy": { closeness: "touching", meters: 0.2 },
    "make it romantic": { kind: "romantic", spark: 4 },
  });

  W.say("comedyTopic", {
    "punch up": { punch: "the powerful" },
    "punch down": { punch: "the powerless" },
    "make fun of myself": { punch: "the self", angle: "personal" },
    "what's the deal with": { angle: "observed", depth: "surface", relatable: 5 },
    "everyone can relate": { relatable: 5, touches: "everyone" },
    "say something real": { depth: "a hard truth" },
    "blow it out of proportion": { angle: "exaggerated" },
    "office humor": { setting: "work" },
    "family stuff": { setting: "family" },
  });

  W.say("comicTiming", {
    "hit the beat": { rush: "on the beat", setting: 2 },
    "hold for the laugh": { holdAfter: 3, setting: 3 },
    "milk the pause": { setting: 4, beatLength: 1.5 },
    "rapid-fire": { pace: "rapid fire", linesPerMin: 50, setting: 0 },
    "talk over each other": { pace: "overlapping", stepOn: "often" },
    "you're stepping on the laugh": { stepOn: "never", holdAfter: 3 },
    "don't rush it": { rush: "on the beat", pace: "steady" },
    "it's dragging": { rush: "on the beat", pace: "quick", setting: 1 },
    "button it on the cut": { onCut: "on the cut", holdAfter: 0 },
    "throw in a surprise pause": { rhythmBreak: "one surprise pause" },
    "tighten it up": { pace: "quick", beatLength: 0.3, setupLength: 5 },
  });

  W.say("comicRegister", {
    "play it straight": { setting: "deadpan", faceMoves: 0, consistency: "never breaks" },
    "go big": { setting: "big", body: "big gestures", voice: "raised" },
    "full jim carrey": { setting: "cartoon", faceMoves: 5, body: "full body", gestureReach: 1.8 },
    "bone dry": { setting: "dry", faceMoves: 1, voice: "normal" },
    "tone it down": { setting: "dry", body: "small gestures", gestureReach: 0.3 },
    "more energy": { setting: "big", voice: "raised", faceMoves: 4 },
    "calm in the storm": { setting: "deadpan", contrast: "opposite" },
    "don't break": { consistency: "never breaks" },
    "keep it light": { setting: "playful" },
    "funnier": { setting: "big", faceMoves: 4 },
  });

  W.say("laughsPerMinute", {
    "wall to wall jokes": { setting: 10, breather: 0, clusters: "in bursts" },
    "give it room to breathe": { breather: 5, quietAfter: 6 },
    "more jokes": { setting: 7 },
    "fewer jokes": { setting: 2, size: "smiles" },
    "open with a laugh": { firstLaughAt: 5, shape: "front loaded" },
    "save the biggest for last": { shape: "builds to the end", bigOneAt: 90 },
    "smiles not belly laughs": { size: "smiles" },
    "big belly laughs": { size: "big laughs" },
    "no dead air": { longestGap: 20 },
  });

  W.say("mixLaughs", {
    "the laughs come from the pairing": { setting: "the main source", balance: "shared" },
    "funny one gets the laughs": { who: "the funny one", balance: "mostly one" },
    "everyone gets a laugh": { who: "the room", balance: "the whole room", reactRoom: 5 },
    "their habits clash": { source: "clashing habits" },
    "it builds as they go": { builds: "steeply" },
    "shake things up": { shakeUp: "a big shake" },
    "barely any laughs": { setting: "a few", builds: "flat" },
  });

  W.say("wordplay", {
    "dad joke": { kind: "pun", cleverness: "groaner", caught: "groans" },
    "witty comeback": { kind: "comeback", cleverness: "sharp", topsWithin: 1 },
    "sorkin it": { speed: "quick", density: 8, chain: "a running chain" },
    "make them groan": { cleverness: "groaner", caught: "groans" },
    "get the words wrong": { kind: "malapropism" },
    "pun after pun": { kind: "pun", chain: "a running chain", density: 9 },
    "let the pun land": { landPause: 1.5 },
    "they top it": { caught: "tops it", topsWithin: 1 },
    "keep the lines short": { lineWords: 6 },
  });

  W.say("understatement", {
    "just a flesh wound": { direction: "huge treated as tiny", gap: 5, straightFace: "stone still" },
    "stiff upper lip": { direction: "huge treated as tiny", delivery: "matter of fact", straightFace: "stone still" },
    "make it sound heroic": { direction: "tiny treated as huge", delivery: "grand" },
    "make a big deal of nothing": { direction: "tiny treated as huge", gap: 5 },
    "world burning behind them": { chaosBehind: 5 },
    "deadpan the line": { straightFace: "stone still", delivery: "matter of fact" },
    "mumble it": { delivery: "mumbled" },
    "they almost crack": { straightFace: "nearly holds" },
    "hold on the face after": { holdAfter: 3, faceSize: 130 },
  });

  W.say("visualGag", {
    "blink and you miss it": { place: "background", subtlety: "blink and miss it", onScreen: 1 },
    "hide it in the background": { place: "background", inFocus: "soft" },
    "make it obvious": { subtlety: "unmissable", place: "center", inFocus: "sharp" },
    "a funny sign": { kind: "a sign" },
    "push in on it": { pointsOut: "a push in" },
    "cut to it": { pointsOut: "a cut to it" },
    "jam the frame with gags": { count: 6 },
    "tuck it in the corner": { place: "edge of frame", across: 90, up: 85 },
    "bigger gag": { gagSize: 60, subtlety: "unmissable" },
  });

  W.say("comicSound", {
    "cartoon sounds": { style: "cartoon", effects: 5, sting: "obvious" },
    "record scratch": { musicStop: "once", silenceBeat: 2 },
    "keep it real": { style: "real", effects: 0, sting: "none" },
    "a little boing": { style: "slightly heightened", effects: 2, sting: "soft" },
    "dead silence after": { silenceBeat: 3 },
    "land it on the hit": { lands: "on the hit" },
    "late sound gag": { lands: "a beat late" },
    "louder effects": { loudness: 85 },
    "the music cuts out": { musicStop: "once" },
  });

  W.say("topper", {
    "button it": { count: 1, endsScene: "always" },
    "top it": { count: 1, bigger: "bigger" },
    "one more on top": { count: 2, bigger: "bigger" },
    "triple topper": { count: 3, bigger: "bigger" },
    "let the edit top it": { from: "the edit" },
    "zinger from the back": { from: "the background", lastLaugh: "a bystander" },
    "give them the last laugh": { lastLaugh: "the target" },
    "don't step on the laugh": { gapBetween: 3, beatBefore: 1.5 },
    "out of nowhere": { surprise: 5 },
    "end on it": { endsScene: "always", holdAfter: 2 },
  });

  W.say("specificity", {
    "make it oddly specific": { level: "oddly specific", piled: 3 },
    "weirdly exact numbers": { numbers: 4, level: "absurdly specific" },
    "keep it vague": { level: "general", piled: 1 },
    "say it dead serious": { saidLike: "dead serious" },
    "throw it away": { saidLike: "casual", afterPause: 0 },
    "pile on the details": { piled: 7, detailWords: 30 },
    "dress the set with it": { where: "the set" },
    "keep bringing it up": { comesBack: "becomes a running gag" },
  });

  W.say("exaggeration", {
    "blow it way up": { size: 5, timesReal: 50 },
    "spin a yarn": { what: "a description", size: 4, grows: "step by step" },
    "eyes pop out": { what: "a reaction", size: 5, grows: "sudden" },
    "nobody notices": { othersReact: "totally normal" },
    "everyone gasps": { othersReact: "shocked" },
    "pop the balloon": { deflate: "with a pop" },
    "let it swell": { grows: "slow swell", growSec: 15 },
    "just a touch bigger": { size: 1, timesReal: 2 },
    "make a mountain of a molehill": { what: "a problem", size: 5 },
  });

  W.say("cutawayGag", {
    "like that time": { kind: "a memory", trigger: "a line" },
    "daydream": { kind: "an imagined moment", looksDifferent: "a new style" },
    "cut to the lie": { kind: "a contradiction", length: 2 },
    "quick cutaway": { length: 2, triggerGap: 0 },
    "go long on it": { length: 10 },
    "change the whole look": { looksDifferent: "a whole new medium" },
    "back like nothing happened": { comingBack: "as if nothing" },
    "they saw it too": { comingBack: "someone saw it too" },
    "lots of cutaways": { perScene: 5 },
  });

  W.say("straightMan", {
    "the straight man": { calm: "unmoved", reacts: "not even a blink" },
    "don't even flinch": { reacts: "not even a blink", calm: "unmoved" },
    "deadpan it": { calm: "unmoved", reacts: "a look", stillShare: 90 },
    "a long-suffering sigh": { reacts: "a sigh", calm: "patient" },
    "say what we're thinking": { speaksForUs: "says what we think", reacts: "a line" },
    "they finally snap": { calm: "loses it", cracksAt: 90 },
    "losing patience": { calm: "rattled" },
    "totally oblivious": { sees: "has no idea" },
    "let the reaction land": { reactBeat: 1.5, frameSize: 120 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
