/* say for the inner life and group curiosities in data/db-depth-minds.js (depth thread, minds): plain words for
   "Say what you want". */
(function (W) {
  /* ---------- the mind ---------- */

  W.say("selfStory", {
    "they can't step out of the role": { grip: 5 },
    "just a loose idea of themself": { grip: 0 },
    "they see themself as the victim": { role: "the victim" },
    "they see themself as the hero": { role: "the hero" },
    "they think they're the screw-up": { role: "the screw-up" },
    "the one who holds it all together": { role: "the one who holds it together" },
    "the role fits the facts": { fit: "fits the facts" },
    "the role is the opposite of the facts": { fit: "the opposite of the facts" },
    "they tell it to anyone who listens": { retells: "to anyone who listens" },
    "they never talk about it": { retells: "never" },
    "others quietly doubt it": { others: "quietly doubt it" },
    "others laugh at it": { others: "laugh at it" },
    "the role cracks": { drops: "cracks" },
    "they drop the role": { drops: "drops it" },
    "the role never changes": { drops: "never changes" },
  });

  W.say("allOrNothing", {
    "totally black and white": { extreme: 5 },
    "they see shades of grey": { extreme: 0 },
    "they judge themselves that way": { about: "themselves" },
    "they judge other people that way": { about: "other people" },
    "about right and wrong": { about: "right and wrong" },
    "they say always and never": { words: "always or never" },
    "everything or nothing": { words: "everything or nothing" },
    "one mistake flips them": { flip: "flips at one mistake" },
    "it never flips": { flip: "never flips" },
    "it costs them a friendship": { cost: "a friendship" },
    "it costs them everything": { cost: "everything" },
    "they learn the middle": { grey: "learns it" },
    "they never see the middle": { grey: "never" },
  });

  W.say("innerVoice", {
    "the voice drowns everything out": { loudness: 5 },
    "a faint memory of a voice": { loudness: 0 },
    "it's their parent's voice": { whose: "a parent" },
    "it's an old coach": { whose: "a coach" },
    "the voice puts them down": { says: "put-downs" },
    "the voice gives praise": { says: "praise" },
    "the voice gives orders": { says: "orders" },
    "we hear it echo on the soundtrack": { shown: "an echo on the soundtrack" },
    "the person appears beside them": { shown: "the person appears" },
    "only in their face": { shown: "only in their face" },
    "it speaks up under pressure": { when: "under pressure" },
    "it's there all the time": { when: "all the time" },
    "they obey it": { answers: "obeys" },
    "they finally talk back": { answers: "talks back for good" },
    "they argue with it": { answers: "argues" },
  });

  W.say("thinkOrLeap", {
    "frozen by overthinking": { lean: "frozen by thinking" },
    "pure instinct": { lean: "pure instinct" },
    "a balance of both": { lean: "balanced" },
    "they weigh lots of choices": { options: 8 },
    "just one option": { options: 1 },
    "they decide in a blink": { time: "a blink" },
    "it takes them days": { time: "days" },
    "we see them pacing": { shown: "pacing" },
    "we hear their thoughts": { shown: "we hear their thoughts" },
    "they make lists": { shown: "lists and notes" },
    "the chance slips away": { result: "the chance passes" },
    "they make the right move": { result: "the right move" },
    "paired with someone who just acts": { partner: "an opposite who acts" },
    "paired with someone who thinks": { partner: "an opposite who thinks" },
  });

  W.say("expectWorst", {
    "they imagine a full disaster": { dread: 5 },
    "just a small worry": { dread: 0 },
    "we see the imagined scene": { shown: "an imagined scene we see" },
    "we can't tell it's imagined": { shown: "we can't tell it's imagined" },
    "just a worried look": { shown: "a worried look" },
    "worried about someone they love": { about: "someone they love" },
    "afraid of being found out": { about: "being found out" },
    "a long spiral of worse thoughts": { spiral: 6 },
    "one worry and it stops": { spiral: 1 },
    "it turns out much better": { reality: "much better" },
    "it turns out worse": { reality: "worse" },
    "a friend stops the spiral": { stops: "a friend" },
    "they stop it themselves": { stops: "they stop it themselves" },
  });

  W.say("replaying", {
    "they can't stop replaying it": { stuck: 5 },
    "a passing thought": { stuck: 0 },
    "replaying a mistake": { moment: "a mistake" },
    "replaying an insult": { moment: "an insult" },
    "replaying a goodbye": { moment: "a goodbye" },
    "the moment plays again": { shown: "the moment played again" },
    "a little different each time": { shown: "the moment changed each time" },
    "they just go quiet": { shown: "they go quiet" },
    "it comes back many times": { times: 8 },
    "it comes back once": { times: 1 },
    "what they wish they'd said": { changes: "what they wish they'd said" },
    "a new truth appears": { changes: "a new truth appears" },
    "they let it go": { letsGo: "fully" },
    "they never let it go": { letsGo: "never" },
  });

  /* ---------- the group ---------- */

  W.say("quietMajority", {
    "almost everyone keeps quiet": { silent: 5 },
    "everyone speaks their mind": { silent: 0 },
    "a big crowd": { groupSize: 30 },
    "a small group": { groupSize: 3 },
    "they're afraid": { why: "fear" },
    "each thinks they're the only one": { why: "each thinks they're alone" },
    "an eye roll gives it away": { signs: "an eye roll" },
    "a whisper": { signs: "a whisper" },
    "no signs at all": { signs: "none" },
    "one voice breaks the silence": { breaks: "one voice breaks it" },
    "everyone speaks at once": { breaks: "everyone at once" },
    "the silence never breaks": { breaks: "never" },
    "a slow pan along all their faces": { shot: "a slow pan along all of them" },
    "just one silent face": { shot: "one face" },
  });

  W.say("insideJoke", {
    "the joke holds the group together": { bond: 5 },
    "just a passing laugh": { bond: 0 },
    "a nickname": { kind: "a nickname" },
    "a gesture": { kind: "a gesture" },
    "a song they all know": { kind: "a song" },
    "it comes up again and again": { uses: 8 },
    "just once": { uses: 1 },
    "an outsider is shut out": { outsider: "an outsider is shut out" },
    "an outsider is let in on it": { outsider: "an outsider is let in on it" },
    "just for fun": { weight: "just fun" },
    "it holds a shared loss": { weight: "a shared loss" },
    "said one last time": { last: "said one last time" },
    "no one says it again": { last: "no one says it again" },
  });

  W.say("initiation", {
    "a test that could cost everything": { test: 5 },
    "just a friendly hello": { test: 0 },
    "a dare": { kind: "a dare" },
    "a cruel act": { kind: "a cruel act" },
    "they must take the blame": { kind: "taking the blame" },
    "a big crowd watches": { watched: 20 },
    "nobody watches": { watched: 0 },
    "the leader decides": { gate: "the leader" },
    "the group votes": { gate: "a vote" },
    "they get in": { result: "let in fully" },
    "they're refused": { result: "refused" },
    "they walk away": { result: "they walk away" },
    "it costs them nothing": { price: "nothing" },
    "it costs them their beliefs": { price: "their beliefs" },
  });

  W.say("rightHand", {
    "loyal to the end": { loyalty: 5 },
    "halfway out the door": { loyalty: 0 },
    "does the dirty work": { job: "does the dirty work" },
    "keeps the secrets": { job: "keeps the secrets" },
    "stands behind the leader": { shadow: "stays behind" },
    "steps in front of the leader": { shadow: "steps in front" },
    "no doubts at all": { doubts: "none" },
    "doubts in a look": { doubts: "shown in a look" },
    "says their doubts out loud": { doubts: "said out loud" },
    "they take over": { turn: "takes over" },
    "they bring the leader down": { turn: "brings the leader down" },
    "they never turn": { turn: "never" },
    "nobody sees it coming": { known: "nobody" },
    "the leader sees it coming": { known: "the leader" },
  });

  W.say("bystanders", {
    "nobody moves": { frozen: 5 },
    "people rush in at once": { frozen: 0 },
    "a huge crowd watches": { watchers: 30 },
    "just a couple of people": { watchers: 2 },
    "someone is bullied": { what: "someone bullied" },
    "someone falls": { what: "a fall" },
    "they look at their phones": { looks: "at their phones" },
    "they look away": { looks: "away" },
    "they look at each other": { looks: "at each other" },
    "the least likely person helps": { helper: "the least likely person" },
    "a child helps": { helper: "a child" },
    "no one helps": { helper: "no one" },
    "a long wait before anyone moves": { time: 30 },
    "someone moves right away": { time: 0 },
  });

  W.say("scapegoat", {
    "the whole group turns on them": { blame: 5 },
    "just a few looks": { blame: 0 },
    "the newest gets blamed": { who: "the newest" },
    "the one who spoke up gets blamed": { who: "the one who spoke up" },
    "it wasn't their fault at all": { fault: "not their fault at all" },
    "it was their fault": { fault: "their fault" },
    "it happens in one moment": { howFast: "in one moment" },
    "it happens slowly": { howFast: "slowly" },
    "they're pushed out": { fate: "is pushed out" },
    "they're proved right": { fate: "proved right" },
    "the group feels shame later": { group: "feels shame later" },
    "the group feels relief": { group: "feels relief" },
    "the group feels nothing": { group: "feels nothing" },
  });

  /* ---------- the change ---------- */

  W.say("firstStep", {
    "the hardest thing they've ever done": { courage: 5 },
    "an easy step": { courage: 0 },
    "they say hello": { act: "saying hello" },
    "they ask for help": { act: "asking for help" },
    "they say no": { act: "saying no" },
    "in the first act": { when: "the first act" },
    "late in the film": { when: "late" },
    "nobody sees it": { seen: "nobody" },
    "everyone sees it": { seen: "everyone" },
    "they step back": { after: "they step back" },
    "another step follows": { after: "another step follows" },
    "a pause at the door": { shown: "a pause at a door" },
    "a deep breath": { shown: "a deep breath" },
  });

  W.say("falseChange", {
    "it's all an act": { fake: 5 },
    "the change is real": { fake: 0 },
    "to win someone back": { why: "to win someone back" },
    "to get out of trouble": { why: "to get out of trouble" },
    "lots of slips give it away": { signs: 6 },
    "no slips at all": { signs: 0 },
    "it fools everyone around them": { fooled: "the people around them" },
    "it fools no one": { fooled: "no one" },
    "caught by a slip": { caught: "by a slip" },
    "they confess": { caught: "by their own confession" },
    "never found out": { caught: "never" },
    "the act becomes real": { becomesReal: "fully" },
    "it never becomes real": { becomesReal: "no" },
  });

  W.say("othersNotice", {
    "everyone notices": { noticed: 5 },
    "nobody notices": { noticed: 0 },
    "a friend notices first": { first: "a friend" },
    "a child notices first": { first: "a child" },
    "they're suspicious": { reaction: "suspicious" },
    "they're proud": { reaction: "proud" },
    "they feel threatened": { reaction: "threatened" },
    "said out loud": { said: "said out loud" },
    "just a look": { said: "a look" },
    "they notice long after": { timing: "long after" },
    "they notice too early": { timing: "too early" },
    "they try to pull them back": { pushback: "pulling them back" },
    "they start a fight": { pushback: "a fight" },
    "no pushback": { pushback: "none" },
  });

  W.say("goalSwap", {
    "they drop the old goal completely": { swap: 5 },
    "still chasing the old goal": { swap: 0 },
    "they started out after money": { old: "money" },
    "they started out after revenge": { old: "revenge" },
    "now they want the truth": { newGoal: "the truth" },
    "now they want someone safe": { newGoal: "someone's safety" },
    "the swap comes midway": { when: "midway" },
    "the swap comes in the final scene": { when: "the final scene" },
    "a loss changes it": { trigger: "a loss" },
    "winning feels empty": { trigger: "winning and finding it empty" },
    "they throw the prize away": { shown: "throwing the prize away" },
    "just a thought": { shown: "a thought" },
  });

  W.say("selfVow", {
    "the rule they live by": { strength: 5 },
    "just a passing thought": { strength: 0 },
    "never again": { vow: "never again" },
    "always protect": { vow: "always protect" },
    "never go back": { vow: "never go back" },
    "made before the film starts": { made: "before the film" },
    "made midway": { made: "midway" },
    "never said out loud": { said: "never said" },
    "written down": { said: "written down" },
    "tested again and again": { tested: 6 },
    "tested once": { tested: 1 },
    "they keep it": { ends: "kept" },
    "they break it for good reason": { ends: "broken for good reason" },
    "they break it and regret it": { ends: "broken and regretted" },
  });

  W.say("tooLateChange", {
    "long after it could help": { lateness: 5 },
    "just in time": { lateness: 0 },
    "too late for a person": { lost: "a person" },
    "too late for a love": { lost: "a love" },
    "only they know they changed": { knows: "only them" },
    "everyone knows": { knows: "everyone" },
    "shown in a letter": { shown: "a letter" },
    "shown in an empty room": { shown: "an empty room" },
    "they pass it on": { left: "passing it on" },
    "nothing good comes of it": { left: "nothing" },
    "it ends bitter": { mood: "bitter" },
    "it ends quietly hopeful": { mood: "quietly hopeful" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
