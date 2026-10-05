/* say for the feeling-over-time curiosities in data/db-depth-feeling.js (depth thread, feeling): plain words for
   "Say what you want". */
(function (W) {
  /* ---------- after the blow ---------- */

  W.say("shockNumb", {
    "they go completely numb": { numb: 5 },
    "a normal reaction": { numb: 0 },
    "after bad news": { shock: "bad news" },
    "after a death": { shock: "a death" },
    "after an accident": { shock: "an accident" },
    "numb for a few seconds": { lasts: "a few seconds" },
    "numb for most of the film": { lasts: "most of the film" },
    "the sound goes muffled": { sound: "goes muffled" },
    "a high ringing": { sound: "a high ringing" },
    "total silence": { sound: "total silence" },
    "they keep doing a chore": { doing: "keep doing a chore" },
    "they say something oddly calm": { doing: "say something calm" },
    "they freeze": { doing: "stand frozen" },
    "a touch brings them back": { breaks: "a touch" },
    "a small object brings them back": { breaks: "a small object" },
    "nothing breaks it yet": { breaks: "nothing yet" },
  });

  W.say("delayedReaction", {
    "it hits much later": { delay: 5 },
    "it hits right away": { delay: 0 },
    "hours later": { gap: "hours" },
    "days later": { gap: "days" },
    "weeks later": { gap: "weeks" },
    "it hits in the car": { where: "in the car" },
    "it hits at the shops": { where: "at the shops" },
    "it hits in the shower": { where: "in the shower" },
    "a song sets it off": { trigger: "a song" },
    "a stranger's kindness sets it off": { trigger: "a stranger's kindness" },
    "nothing sets it off": { trigger: "nothing at all" },
    "just a single tear": { size: "a single tear" },
    "they sob": { size: "sobbing" },
    "they scream": { size: "a scream" },
    "nobody sees it": { seen: "nobody" },
    "a stranger sees it": { seen: "a stranger" },
  });

  W.say("displacedFeeling", {
    "it lands way off target": { misplaced: 5 },
    "aimed at the right person": { misplaced: 0 },
    "it's anger": { feeling: "anger" },
    "it's fear": { feeling: "fear" },
    "it's shame": { feeling: "shame" },
    "they take it out on an object": { target: "an object" },
    "they snap at a friend": { target: "a friend" },
    "they take it out on themselves": { target: "themselves" },
    "the person is too powerful": { why: "the person is too powerful" },
    "the person is gone": { why: "the person is gone" },
    "just a muttered word": { size: "a muttered word" },
    "they slam something": { size: "a slam" },
    "something breaks": { size: "something breaks" },
    "they never see what they did": { realize: "never" },
    "they see it right away": { realize: "right away" },
  });

  W.say("keepsake", {
    "the thing holds everything": { charge: 5 },
    "it's just a thing": { charge: 0 },
    "a piece of their clothing": { thing: "a piece of clothing" },
    "an old watch": { thing: "a watch" },
    "a letter": { thing: "a letter" },
    "it stands for someone gone": { standsFor: "someone gone" },
    "it stands for a happier time": { standsFor: "a happier time" },
    "they can't look at it": { handling: "can't look at it" },
    "they keep it close": { handling: "keep it close" },
    "they use it every day": { handling: "use it every day" },
    "they give it away at the end": { fate: "given away" },
    "they bury it": { fate: "buried" },
    "they keep it": { fate: "kept" },
    "we see it many times": { seen: 7 },
    "we see it just once": { seen: 1 },
  });

  /* ---------- holding the big feeling ---------- */

  W.say("bigFeelingSmall", {
    "play it as small as possible": { restraint: 5 },
    "play it big": { restraint: 0 },
    "the feeling is life changing": { bigness: "life changing" },
    "a mild feeling": { bigness: "mild" },
    "just a whisper": { form: "a whisper" },
    "just a long look": { form: "a long look" },
    "a tiny nod": { form: "a tiny nod" },
    "a long quiet before it": { quietBefore: 8 },
    "no quiet before it": { quietBefore: 0 },
    "the music stops": { music: "stops" },
    "no music at all": { music: "none at all" },
    "let the music swell": { music: "full swell" },
    "saved for the whole film": { savedFor: "the whole film" },
    "saved for one scene": { savedFor: "one scene" },
  });

  W.say("slowBurn", {
    "it grows from nothing to everything": { growth: 5 },
    "it barely grows": { growth: 0 },
    "slow-growing love": { feeling: "love" },
    "slow-growing trust": { feeling: "trust" },
    "a fear that creeps in": { feeling: "fear" },
    "it grows in many scenes": { steps: 15 },
    "just a few steps": { steps: 3 },
    "no setbacks": { setback: "none" },
    "lots of setbacks": { setback: "many" },
    "starts with a look held too long": { firstSign: "a look held too long" },
    "starts with a shared joke": { firstSign: "a shared joke" },
    "said near the end": { admitted: "near the end" },
    "never said at all": { admitted: "never" },
    "said early": { admitted: "early" },
  });

  W.say("comeDown", {
    "the high falls to nothing": { drop: 5 },
    "the joy stays": { drop: 0 },
    "after a big win": { after: "a win" },
    "after a party": { after: "a party" },
    "after a first kiss": { after: "a first kiss" },
    "it drains all at once": { speed: "all at once" },
    "it fades slowly over days": { speed: "slowly over days" },
    "leaves emptiness": { leftover: "emptiness" },
    "leaves a warm glow": { leftover: "a warm glow" },
    "leaves regret": { leftover: "regret" },
    "show the empty room": { sign: "the empty room" },
    "show the mess left behind": { sign: "the mess left behind" },
    "silence after the music": { sign: "silence after the music" },
    "they face it alone": { alone: "alone" },
    "everyone is still there": { alone: "everyone" },
  });

  /* ---------- between people ---------- */

  W.say("moodOutOfStep", {
    "they feel the opposite of everyone": { offStep: 5 },
    "they feel what the room feels": { offStep: 0 },
    "the room is full of joy": { roomMood: "joy" },
    "the room is in a panic": { roomMood: "panic" },
    "the room is grieving": { roomMood: "grief" },
    "they feel sad": { theirMood: "sadness" },
    "they stay calm": { theirMood: "calm" },
    "they feel joy": { theirMood: "joy" },
    "they hide it well": { hides: "hides it well" },
    "they show it plainly": { hides: "shows it plainly" },
    "nobody notices": { noticedBy: "no one" },
    "the whole room notices": { noticedBy: "the whole room" },
    "they leave": { ends: "they leave" },
    "the room catches their feeling": { ends: "the room catches it" },
  });

  W.say("emotionSeesaw", {
    "they swap completely": { swap: 5 },
    "nobody swaps": { swap: 0 },
    "calm and panic swap": { what: "calm and panic" },
    "strength and fear swap": { what: "strength and fear" },
    "anger turns to guilt": { what: "anger and guilt" },
    "it tips early": { when: "early" },
    "it tips near the end": { when: "near the end" },
    "a confession tips it": { trigger: "a confession" },
    "a joke tips it": { trigger: "a joke" },
    "it tips back and forth": { times: 4 },
    "it tips just once": { times: 1 },
    "neither notices": { aware: "neither" },
    "they both say it": { aware: "both say it" },
  });

  W.say("comfortOffered", {
    "the comfort is fully taken": { taken: 5 },
    "the comfort is pushed away": { taken: 0 },
    "comfort with a hug": { way: "a hug" },
    "sit close in silence": { way: "sitting close in silence" },
    "comfort with food": { way: "making food" },
    "comfort from a stranger": { giver: "a stranger" },
    "comfort from an enemy": { giver: "an enemy" },
    "comfort from family": { giver: "family" },
    "it comes too early": { timing: "too early" },
    "it comes too late": { timing: "too late" },
    "they pull away": { first: "pulls away" },
    "they lean in": { first: "leans in" },
    "they finally talk": { after: "talking at last" },
    "it ends in tears": { after: "tears" },
  });

  W.say("unspokenFeeling", {
    "nobody goes near it": { unsaid: 5 },
    "it comes up easily": { unsaid: 0 },
    "nobody mentions the death": { about: "a death" },
    "nobody mentions the illness": { about: "an illness" },
    "nobody mentions the money": { about: "money trouble" },
    "just two people know": { howMany: "two people" },
    "the whole town knows": { howMany: "the whole town" },
    "they keep changing the subject": { signs: "a changed subject" },
    "too much small talk": { signs: "too much small talk" },
    "an empty chair": { signs: "an empty chair" },
    "it takes many scenes to come out": { scenes: 20 },
    "it comes out quickly": { scenes: 1 },
    "a child finally says it": { said: "by a child" },
    "it comes out in a shout": { said: "in a shout" },
    "it is never said": { said: "never" },
  });

  /* ---------- the body and the camera ---------- */

  W.say("bracing", {
    "they gather every bit of strength": { brace: 5 },
    "they walk straight in": { brace: 0 },
    "a deep breath first": { how: "a deep breath" },
    "they practice the words": { how: "practicing the words" },
    "a look in the mirror": { how: "a long look in the mirror" },
    "watch them a long time": { length: 25 },
    "just a second or two": { length: 2 },
    "they're about to face a fight": { facing: "a fight" },
    "they're about to face an old love": { facing: "an old love" },
    "about to hear bad news": { facing: "bad news" },
    "it holds up": { ready: "holds up" },
    "they fall apart anyway": { ready: "falls apart" },
    "nobody sees them": { seen: "no one" },
    "the other person sees them": { seen: "the other person" },
  });

  W.say("reactionHolder", {
    "show a stranger's face": { away: 5 },
    "show the one it happens to": { away: 0, who: "the one it happens to" },
    "show the parent's face": { who: "a parent" },
    "show the child's face": { who: "a child" },
    "show the partner's face": { who: "their partner" },
    "hold on the face a long time": { hold: 8 },
    "just a quick look at the face": { hold: 1 },
    "from far away": { size: "far away" },
    "right in on the eyes": { size: "just the eyes" },
    "we only hear the event": { event: "we only hear it" },
    "we never see the event": { event: "we only see the face" },
    "the face shows pride": { shows: "pride" },
    "the face shows horror": { shows: "horror" },
    "the face shows heartbreak": { shows: "heartbreak" },
  });

  W.say("keepingBusy", {
    "they never stop for a second": { busy: 5 },
    "a little tidying": { busy: 0 },
    "they clean everything": { task: "cleaning" },
    "they bury themselves in work": { task: "work" },
    "they cook for everyone": { task: "cooking" },
    "frantic": { pace: "frantic" },
    "calm and steady": { pace: "calm" },
    "for many scenes": { scenes: 8 },
    "just for one scene": { scenes: 1 },
    "someone stops their hands": { stops: "someone stops their hands" },
    "they break something": { stops: "they break something" },
    "it never cracks": { cracks: "never" },
    "it cracks fully": { cracks: "fully" },
  });

  W.say("unseenCare", {
    "a huge secret sacrifice": { care: 5 },
    "a small secret favor": { care: 0 },
    "they leave food": { act: "leave food" },
    "they pay the debt in secret": { act: "pay a debt" },
    "they take the blame": { act: "take the blame" },
    "for their child": { forWhom: "a child" },
    "for a rival": { forWhom: "a rival" },
    "never found out": { found: "never" },
    "found out too late": { found: "too late" },
    "found out at the end": { found: "at the end" },
    "over and over": { times: 7 },
    "just once": { times: 1 },
    "it costs them everything": { cost: "everything" },
    "it costs nothing": { cost: "nothing" },
  });

  W.say("emptyPlace", {
    "the absence fills the scene": { absence: 5 },
    "barely noticed": { absence: 0 },
    "an empty chair": { place: "a chair" },
    "an empty bed": { place: "a bed" },
    "their shoes by the door": { place: "a pair of shoes" },
    "they died": { gone: "they died" },
    "they left": { gone: "they left" },
    "an extra plate set": { habit: "an extra plate set" },
    "their cup still poured": { habit: "their cup poured" },
    "we keep coming back to it": { shown: 7 },
    "we see it once": { shown: 1 },
    "never filled again": { filled: "never" },
    "they come back": { filled: "by them, back again" },
    "someone new takes it": { filled: "by someone new" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
