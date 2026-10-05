/* say for the color, focus, titles and canvas curiosities in data/db-depth-frame.js (depth thread, frame): plain
   words for "Say what you want". */
(function (W) {
  /* ---------- color ---------- */

  W.say("colorClash", {
    "the colors really fight": { clash: 5 },
    "the colors get along": { clash: 0 },
    "red against green": { pair: "red and green" },
    "orange against blue": { pair: "orange and blue" },
    "neon in a grey room": { pair: "neon against grey" },
    "the clash is in the clothes": { where: "in the clothes" },
    "the clash is in the light": { where: "in the light" },
    "the clash is everywhere": { where: "everywhere" },
    "it grows with the fight": { when: "as the fight grows" },
    "just for one moment": { when: "at one moment" },
    "a small touch of it": { share: 10 },
    "it fills the frame": { share: 90 },
    "a playful clash": { feel: "playful" },
    "an angry clash": { feel: "angry" },
    "it makes you feel sick": { feel: "sick" },
  });

  W.say("savedColor", {
    "almost never seen": { rarity: 5 },
    "not really saved": { rarity: 0 },
    "gold for the big moments": { hue: "gold" },
    "red for the big moments": { hue: "red" },
    "blue for the big moments": { hue: "blue" },
    "only once": { times: 1 },
    "many times": { times: 8 },
    "when they first meet": { moments: "a first meeting" },
    "at every loss": { moments: "a loss" },
    "only at the ending": { moments: "the ending" },
    "just a speck of it": { size: "a speck" },
    "it fills the whole frame": { size: "the whole frame" },
    "felt but not noticed": { noticed: "only in the gut" },
    "you catch it on a second watch": { noticed: "on a second watch" },
    "you notice it right away": { noticed: "right away" },
  });

  W.say("splitColorLight", {
    "bold colors on the face": { split: 5 },
    "barely any color": { split: 0 },
    "warm on one side, cool on the other": { pair: "warm and cool" },
    "red and blue": { pair: "red and blue" },
    "pink and teal": { pair: "pink and teal" },
    "from a neon sign": { from: "a neon sign" },
    "from police lights": { from: "police lights" },
    "from the tv and a lamp": { from: "a TV and a lamp" },
    "the colors blend": { edge: "blended" },
    "a hard line down the face": { edge: "hard line" },
    "the light stays still": { moves: "still" },
    "the light flashes": { moves: "flashing" },
    "a torn mind": { means: "a torn mind" },
    "pulled two ways": { means: "two pulls on them" },
    "danger on one side, safety on the other": { means: "danger and safety" },
  });

  W.say("matchesTheRoom", {
    "they melt into the room": { match: 5 },
    "they stand out from the room": { match: 0 },
    "they belong there": { why: "they belong here" },
    "they are hiding": { why: "they are hiding" },
    "the room owns them": { why: "the room owns them" },
    "just for a laugh": { why: "a joke" },
    "all in beige": { color: "beige" },
    "all in grey": { color: "grey" },
    "flowers on flowers": { color: "flowers" },
    "nobody else there": { others: "no one else there" },
    "everyone matches": { others: "everyone matches too" },
    "they never break out": { breaks: "never" },
    "they break out when they leave": { breaks: "when they leave" },
    "they break out when they speak up": { breaks: "when they speak up" },
    "shot wide so they vanish": { shown: "wide, so they vanish" },
    "close so we see the match": { shown: "close, so we see the match" },
  });

  /* ---------- focus ---------- */

  W.say("stillInTheRush", {
    "completely still": { still: 5 },
    "barely still": { still: 0 },
    "a still person": { what: "a person" },
    "a still hand": { what: "a hand" },
    "a still animal": { what: "an animal" },
    "everything else rushing": { rush: 5 },
    "the rest is calm too": { rush: 0 },
    "in a crowd": { rushKind: "a crowd" },
    "in traffic": { rushKind: "traffic" },
    "in a storm": { rushKind: "a storm" },
    "the rush is sharp": { blur: "sharp" },
    "the rush streaks by": { blur: "streaked by speed" },
    "just a second": { lasts: 1 },
    "a long still moment": { lasts: 20 },
  });

  W.say("oneFaceInCrowd", {
    "one face clearly stands out": { pick: 5 },
    "hard to find the face": { pick: 0 },
    "the only sharp face": { by: "sharp focus" },
    "the only lit face": { by: "light" },
    "the only one looking at us": { by: "looking at the camera" },
    "the only one not moving": { by: "not moving" },
    "a few people": { size: "a few people" },
    "a whole stadium": { size: "a stadium" },
    "the one they love": { who: "the one they love" },
    "the one they hunt": { who: "the one they hunt" },
    "found right away": { found: "right away" },
    "found after a search": { found: "after a search" },
    "lost again": { found: "lost again" },
    "the face looks back": { look: "looking back" },
    "the face is not looking": { look: "not looking" },
  });

  W.say("misdirectedEye", {
    "a strong pull the wrong way": { lure: 5 },
    "no trick at all": { lure: 0 },
    "a loud sound pulls us away": { bait: "a loud sound" },
    "a talking face pulls us away": { bait: "a face talking" },
    "a joke pulls us away": { bait: "a joke" },
    "the real thing is in a corner": { real: "in a corner" },
    "the real thing is in the shadow": { real: "in the shadow" },
    "it was in plain view": { real: "in plain view" },
    "we find out right away": { payoff: "right away" },
    "we only see it on a second watch": { payoff: "on a second watch" },
    "we never find out": { payoff: "never" },
    "for a scare": { goal: "a scare" },
    "for a twist": { goal: "a twist" },
    "a fair trick": { fair: "fair and plain" },
    "an unfair trick": { fair: "unfair" },
  });

  W.say("edgeOfFrame", {
    "right at the edge": { edge: 5 },
    "in the middle": { edge: 0 },
    "a face at the edge": { what: "a face" },
    "a hand at the edge": { what: "a hand" },
    "a door at the edge": { what: "a door" },
    "on the left": { side: "left" },
    "on the right": { side: "right" },
    "at the bottom": { side: "bottom" },
    "the middle is empty": { center: "empty" },
    "the wrong person in the middle": { center: "the wrong person" },
    "fully in the frame": { cut: "fully in" },
    "half cut off": { cut: "half out" },
    "just a sliver": { cut: "just a sliver" },
    "to make us search": { why: "to make us search" },
    "to feel cut off": { why: "to feel cut off" },
    "to hide it": { why: "to hide it" },
  });

  /* ---------- titles ---------- */

  W.say("wordsInTheWorld", {
    "the words feel part of the place": { fit: 5 },
    "plain words on top": { fit: 0 },
    "on a wall": { on: "a wall" },
    "on the floor": { on: "the floor" },
    "in the sky": { on: "the sky" },
    "the film's title": { what: "the title" },
    "the names": { what: "the names" },
    "a warning": { what: "a warning" },
    "fixed in place": { moves: "fixed in place" },
    "people walk through them": { moves: "people walk through them" },
    "they react when touched": { moves: "they react to touch" },
    "painted letters": { style: "painted" },
    "neon letters": { style: "neon" },
    "chalk letters": { style: "chalk" },
    "just a flash": { stays: 1 },
    "they stay a while": { stays: 10 },
  });

  W.say("playfulSubtitles", {
    "very playful subtitles": { play: 5 },
    "plain subtitles": { play: 0 },
    "next to the speaker": { trick: "placed by the speaker" },
    "they grow when they shout": { trick: "they change size" },
    "they say what they really mean": { trick: "they say more than the words" },
    "the subtitles lie": { trick: "they lie" },
    "someone reads them": { trick: "someone reads them" },
    "a made-up language": { language: "a made-up language" },
    "for the dog": { language: "an animal" },
    "baby talk": { language: "baby talk" },
    "tiny text": { size: "small" },
    "huge text": { size: "huge" },
    "in the speaker's color": { color: "the speaker's color" },
    "just one line": { count: 1 },
    "lots of lines": { count: 10 },
  });

  W.say("openingCredits", {
    "a big opening": { weight: 5 },
    "barely any credits": { weight: 0 },
    "over black": { over: "black" },
    "over the first scene": { over: "the first scene" },
    "their own little film": { over: "their own made images" },
    "short credits": { length: 10 },
    "long credits": { length: 240 },
    "only a few names": { names: "a few" },
    "everyone's name": { names: "everyone" },
    "they set the mood": { hint: "the mood" },
    "they hide the ending": { hint: "the ending, hidden" },
    "in silence": { music: "silence" },
    "with a song": { music: "a song" },
    "loud music": { music: "loud" },
  });

  W.say("thoughtsAsText", {
    "we read everything they think": { show: 5 },
    "barely any thoughts shown": { show: 0 },
    "a list in their head": { form: "a list" },
    "labels on everything": { form: "labels on things" },
    "scores like a game": { form: "numbers and scores" },
    "by their head": { near: "by their head" },
    "on the things they see": { near: "on the things" },
    "fills the screen": { near: "full screen" },
    "handwritten": { style: "handwritten" },
    "like a video game": { style: "a game screen" },
    "the thoughts lie": { honest: "it lies" },
    "the thoughts are true": { honest: "true" },
    "they stay put": { changes: "stays" },
    "they change as they think": { changes: "changes as they think" },
    "they get crossed out": { changes: "gets crossed out" },
  });

  /* ---------- canvas ---------- */

  W.say("splitScreen", {
    "split the whole scene": { split: 5 },
    "no split at all": { split: 0 },
    "two pictures": { panes: 2 },
    "lots of pictures": { panes: 6 },
    "two places at once": { shows: "two places at once" },
    "both sides of a call": { shows: "two sides of a call" },
    "before and after": { shows: "before and after" },
    "a hard line between": { line: "hard line" },
    "a soft blend between": { line: "soft blend" },
    "side by side": { layout: "side by side" },
    "top and bottom": { layout: "top and bottom" },
    "a grid": { layout: "a grid" },
    "they never meet": { joins: "never" },
    "they meet in one picture": { joins: "they meet in one frame" },
    "one side goes black": { joins: "one goes black" },
  });

  W.say("pictureSize", {
    "a tiny picture": { size: 10 },
    "it fills the screen": { size: 100 },
    "it shrinks": { way: "shrinks" },
    "it grows": { way: "grows" },
    "it shrinks, then grows": { way: "shrinks then grows" },
    "same shape": { shape: "keeps its shape" },
    "it gets square": { shape: "gets square" },
    "it gets wide": { shape: "gets wide" },
    "slowly over the film": { speed: "over the film" },
    "all at once": { speed: "at once" },
    "black around it": { around: "black" },
    "a blur around it": { around: "a blur" },
    "their world closing in": { follows: "their world closing in" },
    "a feeling of freedom": { follows: "freedom" },
  });

  W.say("povMask", {
    "only a small hole to see through": { cover: 5 },
    "barely covered": { cover: 0 },
    "through binoculars": { shape: "binoculars" },
    "through a keyhole": { shape: "a keyhole" },
    "through a gun sight": { shape: "a gun sight" },
    "through a peephole": { shape: "a peephole" },
    "the villain is watching": { who: "the villain" },
    "a child is watching": { who: "a child" },
    "we don't know who is watching": { who: "nobody yet" },
    "a sharp edge": { edge: "sharp" },
    "a blurry edge": { edge: "blurred" },
    "steady hands": { wobble: 0 },
    "shaking hands": { wobble: 5 },
    "they never notice": { caught: "never" },
    "they look right back": { caught: "they look right back" },
  });

  W.say("stillsInMotion", {
    "just a couple of stills": { count: 2 },
    "a long run of stills": { count: 40 },
    "quick flashes": { each: 0.2 },
    "each one lingers": { each: 4 },
    "in silence": { sound: "silence" },
    "a voice over the photos": { sound: "a voice over them" },
    "the sound keeps going": { sound: "the sound keeps playing" },
    "the photos stay fixed": { move: "fixed" },
    "a slow push in on each": { move: "slow push in" },
    "family photos": { kind: "family photos" },
    "camera flashes": { kind: "camera flashes" },
    "never moves again": { back: "never" },
    "it starts to move at the end": { back: "at the end" },
    "back to moving in a blink": { back: "in one blink" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
