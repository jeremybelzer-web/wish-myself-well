/* Story: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("arcStage", {
    "they want something": { setting: "want", progress: 20 },
    "second thoughts": { setting: "doubt", change: "drifts" },
    "dark night of the soul": { setting: "crisis", progress: 80, stageLength: "a scene" },
    "rock bottom": { setting: "crisis", progress: 100, push: 5 },
    "the moment of decision": { setting: "choice", change: "snaps", tipPoint: 70 },
    "they make the call": { setting: "choice", change: "steps" },
    "they come out different": { setting: "change", progress: 100 },
    "the turn comes slowly": { change: "drifts", turnSeconds: 90 },
    "the turn hits hard": { change: "snaps", turnSeconds: 3 },
    "we see it coming": { seenComing: "we know before they do" },
    "catch us off guard": { seenComing: "takes us by surprise", change: "snaps" },
    "make us root for them": { rootingFor: 5 },
  });

  W.say("plotWant", {
    "they want the wrong thing": { gap: "opposite", sees: "blind to it" },
    "they don't get it yet": { sees: "blind to it", gapCloses: "widening" },
    "starting to see it": { sees: "suspects", gapCloses: "closing" },
    "they finally get it": { sees: "knows", gapCloses: "closing", needShownAt: 85 },
    "dead set on it": { chase: 5, wantShown: "clear" },
    "half-hearted": { chase: 1 },
    "make the goal obvious": { wantShown: "spelled out", wantMentions: 6 },
    "keep the goal vague": { wantShown: "hinted", wantMentions: 1 },
    "change costs everything": { needCost: "who they are", gap: "opposite" },
    "they already have what they need": { gap: "the same" },
  });

  W.say("plotProgress", {
    "knock them down": { move: "big setback", newProblem: "a big one" },
    "a small win": { move: "step forward", noticeable: "subtle" },
    "a big win": { move: "big step forward", noticeable: "showy" },
    "they shoot themselves in the foot": { move: "setback", cause: "their own" },
    "spin their wheels": { move: "no change", change: "holds" },
    "blindsided": { surprise: "out of nowhere", change: "snaps" },
    "throw a twist": { surprise: "a twist", newProblem: "a small one" },
    "dumb luck": { cause: "luck" },
    "two steps forward one back": { move: "step forward", beats: 3, newProblem: "a small one" },
    "raise the stakes": { newProblem: "a big one", push: 4 },
    "let it land": { landSeconds: 8, lands: 80 },
  });

  W.say("arcTest", {
    "prove they've changed": { result: "pass", echo: "exactly", size: 4 },
    "they almost cave": { result: "nearly fail", hesitation: 12 },
    "they cave": { result: "fail" },
    "the old temptation returns": { echo: "exactly", temptNear: 1 },
    "dangle it in front of them": { temptNear: 0, hesitation: 8 },
    "do it in front of everyone": { witnessed: "everyone" },
    "a quiet private test": { witnessed: "no one", size: 2 },
    "make it hurt to choose": { size: 5, hesitation: 20 },
    "pay off the setup": { echo: "exactly", echoGap: 60 },
    "for the money": { temptation: "money" },
    "pride gets in the way": { temptation: "pride" },
  });

  W.say("openQuestions", {
    "keep them guessing": { setting: 4, answerKind: "half answers" },
    "leave a hook": { raised: 1, nextAnswer: 30, pointsAhead: "demands what's next" },
    "whodunit": { kind: "who did it", setting: 3 },
    "cliffhanger": { kind: "will they make it", urgency: 5 },
    "tie up loose ends": { answered: 3, raised: 0, answerKind: "clean answers" },
    "answer one ask two": { answered: 1, raised: 2, answerKind: "answers that raise more" },
    "too many mysteries": { setting: 1 },
    "pay it off soon": { nextAnswer: 5, urgency: 4 },
    "make it a mystery box": { setting: 5, answerKind: "no answers", kind: "what is it" },
    "what are they hiding": { kind: "why", setting: 3 },
  });

  W.say("dramaticRole", {
    "the voice of reason": { setting: "moral center", strength: 4 },
    "the wise old guide": { setting: "mentor", target: "the main character" },
    "the bad guy": { setting: "antagonist", strength: 5 },
    "stirs the pot": { setting: "catalyst", drawsEye: 4 },
    "the loose cannon": { setting: "wildcard", strength: 4 },
    "keeps the peace": { setting: "mediator", target: "the whole group" },
    "the glue of the group": { setting: "stabilizer", target: "the whole group" },
    "plays devil's advocate": { setting: "challenger", target: "the main character" },
    "the bad influence": { setting: "temptation", target: "the main character" },
    "steals the scene": { drawsEye: 5, onScreen: "at the center" },
    "in the background": { onScreen: "on the edge", drawsEye: 1 },
  });

  W.say("plotTouch", {
    "their own little story": { setting: "apart", impact: "brushes past" },
    "paths cross": { setting: "crossing", crossings: 1 },
    "storylines collide": { setting: "joined", impact: "changes everything", change: "snaps" },
    "worlds collide": { setting: "joined", who: "everyone", impact: "changes everything" },
    "set it up early": { foreshadow: "clearly set up", anticipation: 4 },
    "comes out of left field": { foreshadow: "no hint", change: "snaps" },
    "a b-plot": { setting: "apart", pull: 1 },
    "the b-plot pays off": { setting: "joined", impact: "bends the main plot", meetAt: 80 },
    "they keep bumping into each other": { setting: "crossing", crossings: 6 },
  });

  W.say("cm-role", {
    "the sidekick": { role: "ally", target: "the main character" },
    "ride or die": { role: "ally", strength: 5 },
    "the voice of reason": { role: "moral-center", awareness: "deliberate" },
    "changes them without knowing": { role: "catalyst", awareness: "unaware" },
    "pushes their buttons": { role: "challenger", awareness: "deliberate" },
    "the wise old guide": { role: "mentor" },
    "the bad guy": { role: "antagonist", strength: 5 },
    "the wild card": { role: "wildcard" },
    "switches sides": { roleShift: "snaps", switchSeconds: 5 },
    "steals the scene": { drawsEye: 5 },
  });

  W.say("plotSecret", {
    "the cat's out of the bag": { kept: "out", revealWay: "found out" },
    "almost found out": { kept: "close call", nearMiss: 5, hiding: "sweating" },
    "it's slipping out": { kept: "slipping", hiding: "frantic" },
    "only we know": { whoKnows: "the audience too", kept: "safe" },
    "dramatic irony": { whoKnows: "the audience too", nearMiss: 4 },
    "they let it slip": { kept: "out", revealWay: "blurted" },
    "come clean": { kept: "out", revealWay: "they confess" },
    "outed in front of everyone": { kept: "out", revealWay: "shown in public" },
    "cool as a cucumber": { hiding: "relaxed", kept: "safe" },
    "sweating bullets": { hiding: "sweating", nearMiss: 4 },
    "a skeleton in the closet": { keptFor: 20, cost: 4 },
  });

  W.say("dissenter", {
    "the lone voice": { against: "speaks up", isolation: "totally alone", joined: "no one" },
    "go along to get along": { against: "goes along", firmness: "gives in fast" },
    "keeps it to themselves": { against: "quiet doubts" },
    "stand their ground": { firmness: "won't budge", against: "openly defies" },
    "rocks the boat": { against: "speaks up", cost: 3 },
    "bucks the system": { against: "openly defies", dissentsFrom: "the rules" },
    "stands up to the boss": { against: "openly defies", dissentsFrom: "the leader" },
    "others join in": { joined: "a few" },
    "they turn the room": { joined: "the whole group turns" },
    "pays dearly for it": { cost: 5, isolation: "set apart" },
  });

  W.say("arcDirection", {
    "a redemption arc": { direction: "grows", size: 4, hope: 5 },
    "a fall from grace": { direction: "falls", size: 5, hope: 0 },
    "breaking bad": { direction: "falls", pace: "slow" },
    "a coming of age": { direction: "grows", comparedWith: "who they were at the start" },
    "a rock that changes others": { direction: "stays the same", flatChangesOthers: "everyone around them" },
    "they never change": { direction: "stays the same", flatChangesOthers: "no" },
    "a slow burn": { pace: "slow", arcSpan: 40 },
    "an overnight change": { pace: "all at once" },
    "keep us unsure": { certainty: "no idea" },
    "end on hope": { hope: 5, direction: "grows" },
  });

  W.say("theLie", {
    "nobody could love me": { about: "themselves", grip: 5 },
    "i don't need anyone": { about: "other people", grip: 4 },
    "the world is against them": { about: "the world" },
    "love always hurts": { about: "love" },
    "they believe it completely": { grip: 5, cracks: "solid" },
    "the cracks are showing": { cracks: "cracking", challenged: 3 },
    "it all falls apart": { cracks: "breaking", challenged: 5 },
    "say it out loud": { shown: "said out loud", weSee: "clearly" },
    "keep it buried": { shown: "hidden", weSee: "not yet" },
    "daddy issues": { learnedFrom: "a parent" },
  });

  W.say("wound", {
    "a dark past": { weight: 4, revealed: "late" },
    "the ghost": { weight: 5, curiosity: 4 },
    "an old scar": { rawness: "scarred over", yearsAgo: 20 },
    "still raw": { rawness: "open", touched: 4 },
    "pick at the scab": { touched: 5, rawness: "tender" },
    "tell us in flashback": { howShown: "a flashback", revealed: "midway" },
    "show don't tell": { howShown: "a reaction" },
    "keep the backstory secret": { revealed: "never", curiosity: 5 },
    "the big confession": { howShown: "they confess", revealLength: 120 },
    "a childhood trauma": { woundBy: "a parent", yearsAgo: 30, weight: 5 },
    "a broken heart": { woundBy: "a lover" },
  });

  W.say("relapse", {
    "fall off the wagon": { size: 4, duration: "a scene" },
    "old habits die hard": { size: 3, cause: "comfort" },
    "a slip": { size: 1, duration: "a moment", noticeable: "subtle" },
    "back to square one": { size: 5, duration: "for good", change: "snaps" },
    "the old crowd drags them back": { cause: "an old friend" },
    "scared back into it": { cause: "fear" },
    "nobody sees it": { caught: "no one" },
    "only we see it": { caught: "the audience only", dread: 4 },
    "caught red-handed": { caught: "everyone", change: "snaps" },
    "a slow slide": { change: "drifts", slideSeconds: 100 },
    "make us dread it": { dread: 5 },
  });

  W.say("tickingClock", {
    "the clock is ticking": { setting: "tight", reminders: "often" },
    "down to the wire": { setting: "seconds left", acceleration: "racing" },
    "race against time": { setting: "tight", acceleration: "speeding up" },
    "no rush": { setting: "loose", reminders: "once" },
    "keep cutting to the clock": { shown: "on screen", reminders: "constantly" },
    "a bomb under the table": { clockOf: "the audience only", shown: "on screen", consequence: "a death" },
    "if they're late it's over": { consequence: "a disaster", setting: "tight" },
    "life or death": { consequence: "a death" },
    "more urgent": { clockSpeed: 200, acceleration: "speeding up" },
    "slow the clock down": { clockSpeed: 50 },
    "they've got an hour": { timeLeft: 60, setting: "loose" },
  });

  W.say("knowledgeGap", {
    "hitchcock suspense": { setting: "audience first", tension: 5, howTold: "a cutaway" },
    "we know something they don't": { setting: "audience first", inTheDark: "the main character" },
    "a mystery": { setting: "character first", inTheDark: "the audience" },
    "figure it out together": { setting: "together" },
    "a total shock": { setting: "nobody (surprise)", catchUpSeconds: 2 },
    "blindside everyone": { setting: "nobody (surprise)" },
    "drop a clue": { howTold: "a clue" },
    "they overhear it": { howTold: "overheard" },
    "make us squirm": { setting: "audience first", tension: 5, gap: "a scene" },
    "the twist ending": { setting: "nobody (surprise)", revealAt: 95 },
  });

  W.say("plotWeight", {
    "their big scene": { setting: 5, spotlight: "on them" },
    "it's all about them": { setting: 5, screenShare: 90, spotlight: "on them" },
    "an ensemble scene": { setting: 2, spotlight: "shares them" },
    "they're just passing through": { setting: 0, spotlight: "elsewhere" },
    "everything's on the line": { stakes: "a life" },
    "their job's at stake": { stakes: "a livelihood" },
    "just their pride": { stakes: "pride" },
    "more close-ups": { closeUps: 12 },
    "pass the baton": { handoff: "directly" },
    "they're becoming the lead": { trend: "growing" },
  });

  W.say("perspectiveWidth", {
    "it's all about me": { setting: "self" },
    "only thinks of themselves": { setting: "self", strength: 5 },
    "thinks of their family": { setting: "family" },
    "bigger than themselves": { setting: "world", shift: "growing" },
    "the weight of the world": { setting: "world", peopleWeighed: 1000 },
    "their world gets smaller": { shift: "shrinking" },
    "opens their eyes": { shift: "growing", triggeredBy: "a sight" },
    "put to the test": { tested: "a hard choice" },
    "actions not words": { shownTo: "what they do" },
    "sacrifice for others": { shownTo: "what they give up", setting: "group" },
  });

  W.say("mindset", {
    "closed-minded": { setting: "fixed", listening: "shuts out" },
    "set in their ways": { setting: "fixed", selfDeceit: "a lot" },
    "starting to wonder": { setting: "questioning", change: "drifts" },
    "open-minded": { setting: "open", listening: "takes it in" },
    "in denial": { selfDeceit: "completely", listening: "shuts out" },
    "the penny drops": { setting: "open", change: "snaps", turningPoint: 70 },
    "a change of heart": { setting: "open", change: "steps" },
    "won't hear it": { listening: "shuts out", holdOut: 500 },
    "the facts won't lie": { challengedBy: "the facts", challenge: 4 },
    "under pressure": { pressure: 5 },
  });

  W.say("focusShift", {
    "tunnel vision": { setting: "narrowing", speed: 3 },
    "zero in": { setting: "narrowing", cameraFollows: "follows it" },
    "zoom out on life": { setting: "widening" },
    "step back and see it all": { setting: "widening", focusDistance: 40 },
    "locks onto the threat": { onto: "a threat", setting: "narrowing" },
    "can't take their eyes off them": { onto: "a person", eyesOnIt: 90 },
    "camera goes where they look": { cameraFollows: "follows it" },
    "all of a sudden": { speed: 5, noticeable: "clear" },
    "barely perceptible": { noticeable: "invisible", speed: 1 },
  });

  W.say("herdMentality", {
    "a mob": { setting: 5, size: "a crowd", direction: "toward harm" },
    "groupthink": { setting: 5, holdouts: 0 },
    "everyone for themselves": { setting: 0, inFrame: "scattered" },
    "sheep": { setting: 5, pressure: 3 },
    "move as one": { inFrame: "one mass", spacing: 0.5 },
    "pack animals": { inFrame: "a pack", size: "a few" },
    "a few holdouts": { holdouts: 3 },
    "the mood spreads fast": { speed: 5, change: "snaps" },
    "rally for good": { direction: "toward good", setting: 4 },
    "a cult feel": { setting: 5, pressure: 5 },
  });

  W.say("herdLeader", {
    "the ringleader": { setting: "one voice", strength: 4 },
    "rules by fear": { leadsBy: "fear", strength: 5 },
    "a charmer": { leadsBy: "charm" },
    "loudest in the room": { leadsBy: "loudness" },
    "leads by example": { leadsBy: "example" },
    "nobody's in charge": { setting: "no one" },
    "a mutiny": { challenged: "overthrown", change: "snaps" },
    "whispers behind their back": { challenged: "doubted" },
    "put them above everyone": { leaderAbove: 3, placement: 50 },
    "at the head of the pack": { leaderAhead: 5 },
  });

  W.say("cm-perspective", {
    "stuck in their ways": { position: 5, swing: 2 },
    "an open book": { position: 95, shown: "plain to see" },
    "coming around": { position: 60, swing: 20 },
    "an eye-opener": { trigger: "an event", position: 80, shiftSeconds: 20 },
    "someone changes their mind": { trigger: "a person" },
    "digs in their heels": { resists: 5 },
    "keep it under the surface": { shown: "hidden" },
    "a little glimpse": { shown: "glimpsed" },
    "back and forth": { swing: 45 },
  });

  W.say("beliefShown", {
    "show don't tell": { how: "a small act", noticeable: "subtle" },
    "walk the walk": { how: "a big choice", cost: 4 },
    "says what they mean": { how: "said out loud" },
    "a speech": { how: "said out loud", showSeconds: 90, noticeable: "showy" },
    "a hypocrite": { against: "opposite" },
    "a little inconsistent": { against: "slightly off" },
    "costs them dearly": { cost: 5, how: "a big choice" },
    "nobody sees it": { witness: "no one" },
    "in front of everyone": { witness: "everyone" },
    "just a hint": { how: "hinted", noticeable: "subtle" },
  });

  W.say("distraction", {
    "glued to their phone": { source: "a screen", duration: "the whole scene", pull: 4 },
    "lost in thought": { source: "a thought", pull: 3 },
    "head in the clouds": { source: "a thought", duration: "a while" },
    "a pretty face walks by": { source: "a person", duration: "a glance" },
    "miss the obvious": { missed: "the whole point", audienceSees: "clearly" },
    "miss the warning": { missed: "a warning", audienceSees: "clearly" },
    "snap out of it": { snapBack: "a jolt" },
    "realizes too late": { snapBack: "too late", missed: "a warning" },
    "squirrel": { pull: 5, duration: "a glance", source: "an object" },
    "a noise pulls them away": { source: "a sound" },
  });

  W.say("fixation", {
    "obsessed": { grip: 5, returns: "constantly" },
    "can't stop staring": { onWhat: "an object", longestLook: 20, lookShare: 60 },
    "can't let it go": { grip: 4, onWhat: "an idea", returns: "often" },
    "hung up on someone": { onWhat: "a person", grip: 4 },
    "haunted by the past": { onWhat: "a memory", grip: 5 },
    "keep cutting back to it": { weLook: 5, returns: "often" },
    "a passing fancy": { grip: 1, returns: "once" },
    "everyone's fixated": { shared: "everyone" },
    "a quiet obsession": { noticeable: "subtle", grip: 4 },
  });

  W.say("groupPressure", {
    "peer pressure": { press: 4, shownBy: "all three" },
    "ganging up": { press: 5, outnumbered: "everyone", isolation: 90 },
    "everyone staring at them": { shownBy: "looks", outnumbered: "everyone" },
    "alone against everyone": { isolation: 100, outnumbered: "everyone" },
    "they cave in": { gives: "gives in" },
    "they hold firm": { gives: "holds firm" },
    "on the fence": { gives: "wavers" },
    "the walls close in": { build: "slowly mounting", groupNear: 1 },
    "wave after wave": { build: "in waves" },
    "a gentle nudge": { press: 1, noticeable: "subtle" },
  });

  W.say("resistance", {
    "kicking and screaming": { level: 5, how: "anger", noticeable: "showy" },
    "in denial": { how: "denial", level: 4 },
    "laughs it off": { how: "jokes" },
    "runs away from it": { how: "running away", stepsAway: 10 },
    "doubles down": { how: "doubling down", level: 5 },
    "about to break": { cracking: "about to give", giveWay: 85 },
    "a crack in the armor": { cracking: "a flicker" },
    "life won't let up": { whoPushes: "life itself" },
    "love pushes them": { whoPushes: "a love" },
    "goes willingly": { level: 0, cracking: "about to give" },
  });

  W.say("focusWidth", {
    "tunnel vision": { setting: "one thing", viewAngle: 10 },
    "only has eyes for them": { setting: "one person", strength: 5 },
    "reads the room": { setting: "the room", viewAngle: 120 },
    "takes in everything": { setting: "the world", viewAngle: 360 },
    "misses the obvious": { misses: "the whole point" },
    "see it through their eyes": { camera: "follows it", steersUs: "we see the same" },
    "we see more than they do": { steersUs: "we see more", camera: "ignores it" },
    "keep us in the dark": { steersUs: "we see less" },
    "blinkered": { setting: "one thing", misses: "a warning" },
  });

  W.say("cm-focus", {
    "laser focused": { position: 5, onWhat: "a task" },
    "in the zone": { position: 10, onWhat: "a task", shown: "plain to see" },
    "worried sick": { onWhat: "a worry", position: 15 },
    "taking it all in": { position: 95, onWhat: "everything" },
    "eyes on the prize": { onWhat: "a goal", position: 10 },
    "all over the place": { swing: 45, position: 70 },
    "see it through their eyes": { cameraFollows: "follows it" },
    "keep it inside": { shown: "hidden" },
    "focus snaps": { shiftSeconds: 2 },
  });

  W.say("changeShows", {
    "a makeover": { through: "clothes", visible: 5, noticeable: "showy" },
    "a new walk": { through: "posture" },
    "stands taller": { through: "posture", visible: 3 },
    "talks differently now": { through: "speech" },
    "drops the bad habit": { through: "a habit" },
    "mirror the opening": { contrast: "mirror image" },
    "bookend it": { contrast: "clear echo" },
    "everyone notices": { noticedBy: "everyone" },
    "only we notice": { noticedBy: "the audience", noticeable: "subtle" },
    "show don't tell": { visible: 4, through: "an object", noticeable: "subtle" },
    "all at once": { change: "snaps" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
