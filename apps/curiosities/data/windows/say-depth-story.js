/* say for the story curiosities in data/db-depth-story.js (depth thread): plain words for "Say what you want". */
(function (W) {
  /* ---------- Personal plot ---------- */

  W.say("incitingEvent", {
    "a letter changes everything": { kind: "a message", jolt: 4 },
    "someone dies at the start": { kind: "a death", jolt: 5, when: 3 },
    "a tempting offer": { kind: "an offer" },
    "start it right away": { when: 2 },
    "let it come later": { when: 25 },
    "they jump right in": { refused: "jumps in" },
    "they say no at first": { refused: "refuses at first" },
    "they keep saying no": { refused: "refuses twice" },
    "only they know": { seenBy: "only them" },
    "everyone hears about it": { seenBy: "everyone" },
    "the whole town finds out": { seenBy: "everyone", jolt: 4 },
  });

  W.say("complication", {
    "make it much harder": { weight: 5 },
    "a small snag": { weight: 1, solvable: "easily fixed" },
    "it's their own fault": { source: "their own mistake" },
    "the enemy causes it": { source: "an enemy" },
    "everything at once": { pileUp: 6 },
    "one problem at a time": { pileUp: 1 },
    "two things going wrong": { pileUp: 2 },
    "just when it was going well": { timing: "just when it was going well" },
    "at the worst moment": { timing: "at the worst moment", weight: 4 },
    "right at the start": { timing: "at the start" },
  });

  W.say("reversal", {
    "flip it completely": { flip: 5 },
    "winning turns to losing": { direction: "good to bad", flip: 4 },
    "saved at the last second": { direction: "bad to good", cause: "a discovery" },
    "their own plan backfires": { cause: "their own act", direction: "good to bad" },
    "out of nowhere": { seenComing: "totally sudden" },
    "drop a hint first": { seenComing: "a faint hint" },
    "we saw it coming": { seenComing: "expected" },
    "it changes the rest of the film": { lasting: 20 },
    "just for a scene or two": { lasting: 2 },
    "change the next few scenes": { lasting: 6 },
  });

  W.say("costlyChoice", {
    "an impossible choice": { cost: 5, kind: "two bad things" },
    "either way they lose": { cost: 4 },
    "pick between two good things": { kind: "two good things" },
    "no time to think": { time: "no time", shown: "in a moment" },
    "let them think it over": { time: "days" },
    "show them struggling": { shown: "a long struggle" },
    "decide off screen": { shown: "off screen" },
    "they can never take it back": { undo: "can never undo" },
    "they could change their mind": { undo: "easily undone" },
    "hard to take back": { undo: "hard to undo" },
  });

  W.say("pointOfNoReturn", {
    "burn the bridges": { finality: 5, line: "leaving home" },
    "lock the door behind them": { line: "a door shut", finality: 4 },
    "they tell the secret": { line: "a secret told" },
    "they choose it themselves": { willing: "chose it freely" },
    "they get pushed into it": { willing: "pushed" },
    "they get tricked into it": { willing: "tricked" },
    "in front of everyone": { witnesses: 20 },
    "nobody sees it": { witnesses: 0 },
    "right in the middle of the film": { place: 50 },
    "near the end": { place: 85 },
    "early on": { place: 20 },
  });

  W.say("opponentMove", {
    "the villain strikes": { who: "a villain", threat: 4 },
    "a rival makes a move": { who: "a rival" },
    "nature turns on them": { who: "nature" },
    "they're one step ahead": { smart: "one step ahead" },
    "a clumsy move": { smart: "clumsy", threat: 1 },
    "they're closing in": { distance: "closing in" },
    "they're at the door": { distance: "at the door", threat: 5 },
    "only we see it": { seen: "shown to us" },
    "nobody sees it coming": { seen: "unseen" },
    "the hero sees it": { seen: "shown to the hero" },
  });

  W.say("plantForgotten", {
    "hide it really well": { buried: 5 },
    "show it plainly": { disguise: "shown plainly", buried: 1 },
    "hide it in a joke": { disguise: "hidden in a joke" },
    "plant an object": { kind: "an object" },
    "plant a skill": { kind: "a skill" },
    "show it just once": { showings: 1 },
    "show it a few times": { showings: 3 },
    "pay it off much later": { gap: 80 },
    "pay it off soon": { gap: 10 },
    "a huge payoff": { payoffSize: 5 },
    "a small payoff": { payoffSize: 1 },
  });

  W.say("planShown", {
    "explain the whole plan": { shown: 5 },
    "don't explain the plan": { shown: 0 },
    "draw it on a map": { told: "a drawing on a table" },
    "show it as a montage": { told: "a montage" },
    "a plan with lots of steps": { steps: 9 },
    "keep a secret part": { hidden: "a secret part" },
    "the real plan is hidden": { hidden: "the real plan is hidden" },
    "nothing hidden": { hidden: "nothing hidden" },
    "it all goes wrong": { works: "falls apart" },
    "it works perfectly": { works: "goes perfectly" },
    "just a few hiccups": { works: "small hiccups" },
  });

  /* ---------- Character arc ---------- */

  W.say("mentorLesson", {
    "a lesson that matters": { weight: 5 },
    "they tell a story": { form: "a story" },
    "teach it through a test": { form: "a test" },
    "they ignore it at first": { heard: "ignored" },
    "they get it right away": { heard: "understood" },
    "it comes back at the end": { returns: "at the key moment" },
    "it keeps coming back": { returns: "again and again" },
    "the mentor dies": { mentorFate: "dies" },
    "the mentor leaves": { mentorFate: "leaves" },
    "the mentor lets them down": { mentorFate: "fails them" },
  });

  W.say("foil", {
    "almost the same person": { likeness: 5 },
    "a little alike": { likeness: 2 },
    "they took the dark road": { path: "the dark road" },
    "they never left": { path: "stayed stuck" },
    "they fight all the time": { clash: 5 },
    "lots of scenes together": { scenes: 15 },
    "they barely meet": { scenes: 1, clash: 1 },
    "the hero sees it all at once": { seen: "in one moment" },
    "the hero never sees it": { seen: "never" },
    "slowly the hero notices": { seen: "slowly" },
  });

  W.say("realization", {
    "it hits all at once": { speed: "all at once", clarity: 5 },
    "it slowly dawns on them": { speed: "slow dawning" },
    "one word sets it off": { trigger: "a word" },
    "a memory sets it off": { trigger: "a memory" },
    "only in their eyes": { shown: "only a look" },
    "they say it out loud": { shown: "said out loud" },
    "show it with a small act": { shown: "a small act" },
    "near the end of the film": { late: 85 },
    "halfway through": { late: 50 },
    "right at the start": { late: 5 },
  });

  W.say("sacrifice", {
    "give up everything": { size: 5 },
    "give up a little": { size: 1 },
    "give up their dream": { what: "a dream" },
    "give up the one they love": { what: "a love" },
    "for a friend": { forWhom: "a friend" },
    "for everyone": { forWhom: "everyone" },
    "nobody ever knows": { known: "nobody knows" },
    "everyone knows": { known: "everyone" },
    "no regrets": { regret: "none" },
    "it hurts forever": { regret: "a lasting ache" },
    "a small pang after": { regret: "a pang" },
  });

  /* ---------- Focus ---------- */

  W.say("eyeFirst", {
    "make it jump out": { pull: 5 },
    "a soft pull": { pull: 1 },
    "use light to lead the eye": { by: "brightness" },
    "use a face": { by: "a face" },
    "use sharp focus": { by: "sharp focus" },
    "put it in the center": { place: "center" },
    "put it on the left": { place: "left" },
    "nothing else competes": { rivals: 0 },
    "a busy frame": { rivals: 4 },
    "let the eye rest there": { holdTime: 4 },
    "only for a moment": { holdTime: 0.5 },
    "hold their gaze a while": { holdTime: 3 },
  });

  W.say("returningObject", {
    "keep coming back to it": { returns: 8 },
    "just twice": { returns: 2 },
    "a photo": { object: "a photo" },
    "a key": { object: "a key" },
    "it means everything": { meaning: "the key to the story" },
    "just a thing": { meaning: "just a thing" },
    "fill the screen with it": { size: "fills the screen" },
    "keep it in the background": { size: "in the background" },
    "it's gone the last time": { shifts: "is gone" },
    "it gets broken": { shifts: "gets damaged" },
    "it stays the same": { shifts: "stays the same" },
  });

  W.say("unreliableView", {
    "the narrator lies": { who: "a narrator", why: "they lie" },
    "they can't remember right": { why: "they forget" },
    "it was all a dream": { why: "they are dreaming" },
    "don't trust it at all": { doubt: 5 },
    "a little off": { doubt: 1 },
    "leave lots of clues": { clues: 7 },
    "no clues at all": { clues: 0 },
    "a couple of clues": { clues: 2 },
    "reveal it near the end": { caught: "near the end" },
    "never reveal it": { caught: "never" },
    "let us catch on early": { caught: "early" },
  });

  W.say("offscreen", {
    "don't show it": { hidden: 5 },
    "show a little": { hidden: 1 },
    "hide the monster": { what: "a monster" },
    "just let us hear it": { hint: "a sound" },
    "show a shadow": { hint: "a shadow" },
    "stay on their faces": { reactionTime: 8, hint: "a reaction" },
    "a quick reaction": { reactionTime: 1 },
    "never show it": { shownLater: "never" },
    "show it at the end": { shownLater: "at the end" },
    "show it soon after": { shownLater: "soon" },
  });

  W.say("lingeringShot", {
    "hold a little too long": { overstay: 4 },
    "hold much too long": { overstay: 10 },
    "stay on the empty room": { on: "an empty room" },
    "creep in slowly": { moves: "slow push in" },
    "keep the camera still": { moves: "still" },
    "in total silence": { sound: "silence" },
    "let the music swell": { sound: "music swells" },
    "a strange sound": { sound: "a sound we cannot place" },
    "it's a warning": { meaning: "a warning" },
    "it's a clue": { meaning: "a clue" },
    "just a feeling": { meaning: "a feeling" },
  });

  /* ---------- Mindset ---------- */

  W.say("blindSpot", {
    "a huge blind spot": { size: 5 },
    "they can't see they're loved": { about: "someone's love" },
    "they can't see the danger": { about: "a danger" },
    "everyone else can see it": { seers: 10 },
    "only one person sees it": { seers: 1 },
    "people keep telling them": { hints: 7 },
    "nobody says anything": { hints: 0 },
    "they never see it": { opens: "never" },
    "it hits them all at once": { opens: "in one blow" },
    "they slowly start to see": { opens: "slowly" },
  });

  W.say("excuses", {
    "very convincing excuses": { excuseStrength: 5 },
    "weak excuses": { excuseStrength: 1 },
    "one small step at a time": { steps: 6 },
    "in their head": { voice: "in their head" },
    "they tell us": { voice: "to us" },
    "just something small": { doing: "something small" },
    "something dangerous": { doing: "something dangerous" },
    "something cruel": { doing: "something cruel" },
    "they really believe it": { believe: "fully" },
    "they don't believe it": { believe: "not at all" },
    "half believe it": { believe: "half" },
  });

  W.say("misreading", {
    "totally wrong about them": { wrongness: 5 },
    "a little wrong": { wrongness: 1 },
    "think the friend is an enemy": { reads: "a friend as an enemy" },
    "miss all the clues": { clues: 6 },
    "they pull away": { acts: "pulls away" },
    "they lash out": { acts: "strikes back" },
    "they say something hurtful": { acts: "says something hurtful" },
    "never cleared up": { cleared: "never" },
    "they learn too late": { cleared: "late" },
    "cleared up quickly": { cleared: "soon" },
  });

  W.say("readingSigns", {
    "they believe every sign": { belief: 5 },
    "they don't take it seriously": { belief: 1 },
    "they rule their life by signs": { acts: "lives by them" },
    "they change plans": { acts: "changes plans" },
    "they ignore them": { acts: "ignores them" },
    "a crow keeps showing up": { sign: "an animal" },
    "signs everywhere": { count: 10 },
    "just one sign": { count: 1 },
    "the signs are always right": { right: "always right" },
    "the signs mean nothing": { right: "always wrong" },
    "sometimes they're right": { right: "sometimes right" },
  });

  /* ---------- Herd ---------- */

  W.say("crowdTurns", {
    "the whole crowd turns": { turn: 5 },
    "a lie turns them": { trigger: "a lie" },
    "one brave act turns them": { trigger: "one brave act" },
    "they turn on the hero": { against: "the hero" },
    "they turn on their leader": { against: "their own leader" },
    "one person starts it": { first: "one person" },
    "all at once": { first: "all at once", speed: 2 },
    "slowly spreading": { speed: 25 },
    "in a flash": { speed: 1 },
  });

  W.say("rallyingSpeech", {
    "win them all over": { win: 5, converts: 30, holdout: "no one" },
    "only a few come around": { win: 1, converts: 3 },
    "with a speech": { tool: "a speech" },
    "with proof": { tool: "proof" },
    "with a brave act": { tool: "a brave act" },
    "everyone is against them": { start: "everyone against" },
    "the room is split": { start: "split" },
    "the leader still refuses": { holdout: "the leader" },
    "a few still refuse": { holdout: "a few" },
    "a whole room comes around": { converts: 25 },
  });

  W.say("copying", {
    "copy exactly": { copy: 5 },
    "copy a little": { copy: 1 },
    "they copy the laugh": { what: "a laugh" },
    "they copy the cruelty": { what: "a cruelty" },
    "everyone follows": { who: "everyone" },
    "just one person copies": { who: "one person" },
    "copy right away": { delay: 0 },
    "glance around first": { delay: 3 },
    "they don't even notice": { aware: "unaware" },
    "they know they're copying": { aware: "fully aware" },
    "half aware of it": { aware: "half aware" },
  });

  W.say("rumor", {
    "it's a lie": { truth: "completely false" },
    "it's true": { truth: "true" },
    "it grows as it goes": { growth: "grows" },
    "it becomes a monster": { growth: "becomes a monster" },
    "everyone hears it": { spread: 5 },
    "passes through many people": { hops: 15 },
    "just a couple of people": { hops: 2, spread: 1 },
    "they hear it last": { reaches: "late" },
    "they never hear it": { reaches: "never" },
    "they hear it first": { reaches: "first" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
