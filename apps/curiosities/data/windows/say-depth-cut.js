/* say for the curiosities in data/db-depth-cut.js (depth thread, cut): plain words for "Say what you want". */
(function (W) {
  /* ---------- Transitions ---------- */

  W.say("holdBeforeCut", {
    "let it sink in": { holdLength: 4 },
    "hold it a long time": { holdLength: 8 },
    "don't linger": { holdLength: 0.5 },
    "stay on their face": { onWhat: "a face" },
    "hold on the empty room": { onWhat: "an empty room" },
    "keep it totally still": { stillness: "frozen still" },
    "let something keep moving": { stillness: "something keeps moving" },
    "dead silence": { sound: "dead silence" },
    "just the quiet hum of the room": { sound: "room tone (the quiet hum of the place)" },
    "let the music swell": { sound: "music swells" },
    "fade out slowly": { exit: "slow fade" },
    "hard cut when it's done": { exit: "hard cut" },
    "bring in the next scene's sound first": { exit: "the next scene's sound comes first" },
  });

  W.say("bridgeLine", {
    "answer it in the next scene": { kind: "answers the question", fit: 5 },
    "finish the sentence somewhere else": { kind: "finishes the sentence" },
    "say the opposite after the cut": { kind: "says the opposite" },
    "echo the same words": { kind: "echoes the same words" },
    "make it a gut punch": { sting: "a gut punch" },
    "make it a little joke": { sting: "a joke" },
    "just a plain link": { sting: "a plain link", fit: 3 },
    "jump across town": { leap: "across town" },
    "jump years ahead": { leap: "years later" },
    "a stranger answers": { speaker: "a stranger" },
    "the radio answers": { speaker: "a voice on a radio or TV" },
    "the person they're talking about answers": { speaker: "the person they mean" },
  });

  W.say("cutBeforeHit", {
    "cut away before the punch": { early: "a beat before" },
    "cut just a frame before": { early: "a frame before" },
    "cut way before it happens": { early: "long before" },
    "cut to black": { cutTo: "black" },
    "cut to someone watching": { cutTo: "a face watching" },
    "cut to something calm": { cutTo: "something calm" },
    "we still hear it": { heard: "the full sound" },
    "muffled sound only": { heard: "a muffled sound" },
    "no sound at all": { heard: "nothing at all" },
    "something terrible": { hurt: 5 },
    "nothing too bad": { hurt: 1 },
    "never show it": { shownLater: "never" },
    "show it later in a flashback": { shownLater: "in a flashback" },
    "only show the aftermath": { shownLater: "only what's left after" },
  });

  W.say("hiddenCut", {
    "make it look like one shot": { hidden: 5, takeLength: 300 },
    "hide the cut really well": { hidden: 5 },
    "you can almost spot it": { hidden: 2 },
    "hide it behind a dark coat": { hiddenBy: "something dark crosses the lens" },
    "hide it in a fast camera swing": { hiddenBy: "a fast swing of the camera" },
    "hide it behind a door": { hiddenBy: "a wall or a door" },
    "the whole film in one take": { takeLength: 600, joins: 20 },
    "just one hidden cut": { joins: 1 },
    "a short trick": { takeLength: 30 },
    "keep us in real time": { why: "to keep us in real time" },
    "just to show off": { why: "to show off" },
    "to jump to another place": { why: "to join two places" },
  });

  W.say("cutToBlack", {
    "slam to black": { jolt: "a shock" },
    "a short black": { blackLength: 1 },
    "a long black screen": { blackLength: 8 },
    "cut off mid-sentence": { when: "mid-sentence" },
    "black at the shock": { when: "at the shock" },
    "black at the very end": { when: "at the very end", comeBack: "the credits" },
    "silence in the dark": { sound: "silence" },
    "one sound in the dark": { sound: "one single noise" },
    "let the sound keep going": { sound: "the scene's sound goes on" },
    "music starts in the dark": { sound: "music starts" },
    "come back much later": { comeBack: "much later" },
    "come back to the same moment": { comeBack: "the same moment" },
    "we saw it coming": { jolt: "expected" },
  });

  /* ---------- Speed & timing ---------- */

  W.say("timeLapse", {
    "a whole day in seconds": { squeeze: "a day" },
    "show the seasons change": { squeeze: "seasons", subject: "something growing" },
    "just a few hours": { squeeze: "hours" },
    "a quick one": { screenTime: 2 },
    "let it run long": { screenTime: 15 },
    "clouds racing": { subject: "sky and light" },
    "the city at night": { subject: "a city", streaks: 4 },
    "someone waiting while the world rushes by": { subject: "a person waiting" },
    "lots of light streaks": { streaks: 5 },
    "keep the camera still": { camMove: "locked still" },
    "move through the place": { camMove: "moves through the place" },
    "a slow slide": { camMove: "a slow slide" },
  });

  W.say("slowReveal", {
    "slow it right down": { slowdown: "very slow" },
    "almost freeze it": { slowdown: "nearly frozen" },
    "just a touch slow": { slowdown: "a bit slow" },
    "snap into slow motion": { rampIn: "snaps slow" },
    "ease into it": { rampIn: "eases in" },
    "keep it short": { slowLength: 1 },
    "let it last": { slowLength: 6 },
    "show the object": { detail: "an object" },
    "show their eyes": { detail: "a face" },
    "show what they see": { detail: "what someone sees" },
    "just a heartbeat": { soundDrops: "drops to a heartbeat" },
    "total silence": { soundDrops: "goes silent" },
    "the sound goes low and slow": { soundDrops: "stretches low" },
  });

  W.say("frozenOrbit", {
    "like the matrix": { frozen: "nearly stopped", sweep: 180 },
    "freeze time completely": { frozen: "fully frozen" },
    "just very slow": { frozen: "slowed a lot" },
    "go all the way around": { sweep: 360 },
    "just a little way round": { sweep: 60 },
    "hold it a long time": { orbitLength: 8 },
    "a quick one": { orbitLength: 2 },
    "glass flying everywhere": { inAir: 30 },
    "nothing in the air": { inAir: 0 },
    "snap back to normal": { restart: "snaps back" },
    "speed back up": { restart: "speeds back up" },
    "cut away after": { restart: "cut away" },
  });

  W.say("timeSkip", {
    "skip the boring part": { skip: "hours", skipped: "travel" },
    "jump years ahead": { skip: "years" },
    "just a few minutes later": { skip: "minutes" },
    "make it jolting": { smooth: "jolting" },
    "make it smooth": { smooth: "smooth" },
    "put up a card": { clue: "a card on screen" },
    "show it with new clothes": { clue: "new hair or clothes" },
    "let the light change": { clue: "a clock or the light changes" },
    "no clue at all": { clue: "no clue" },
    "skip the fight": { skipped: "a fight" },
    "skip them growing up": { skipped: "growing up", skip: "years" },
    "explain it later": { catchUp: "a line explains" },
    "fill it in with a flashback": { catchUp: "a flashback fills it in" },
    "never explain": { catchUp: "never" },
  });

  W.say("stretchedMoment", {
    "make the moment last": { stretch: 5 },
    "make one second feel like a minute": { stretch: 10 },
    "just a bit longer": { stretch: 2 },
    "from lots of angles": { angles: 10 },
    "just one angle": { angles: 1 },
    "show it again": { repeats: 2 },
    "never repeat it": { repeats: 0 },
    "cut to the faces watching": { pieces: "faces watching" },
    "cut to small details": { pieces: "small details" },
    "everything hangs on it": { weight: "life or death" },
    "a small moment": { weight: "small" },
    "a big step": { weight: "a big step" },
  });

  /* ---------- Text & captions ---------- */

  W.say("kineticWords", {
    "make the words dance": { motion: 4 },
    "keep the words calm": { motion: 1 },
    "shake when they shout": { rule: "act out the word", motion: 5 },
    "pop on the beat": { rule: "pop on the beat" },
    "fly around them": { rule: "fly around the person" },
    "one word at a time": { chunk: "one word" },
    "the whole line at once": { chunk: "a whole line" },
    "fill the screen": { size: "full screen" },
    "keep them small": { size: "small" },
    "match every syllable": { sync: "each syllable" },
    "follow the voice": { sync: "the voice" },
    "loosely timed": { sync: "loosely" },
  });

  W.say("screenMessages", {
    "show the texts floating": { shown: "floats near the face" },
    "show the phone screen": { shown: "we see the phone screen" },
    "fill the screen with messages": { shown: "fills the frame", count: 10 },
    "show them typing": { typing: "typing dots" },
    "they type it and delete it": { typing: "typed and deleted" },
    "just one message": { count: 1 },
    "a big group chat": { count: 12 },
    "phone bubbles": { style: "phone bubbles" },
    "glowing text": { style: "glowing" },
    "handwritten notes": { style: "handwritten" },
    "a long wait for the reply": { reply: 8 },
    "they answer right away": { reply: 0 },
  });

  W.say("nameCard", {
    "freeze and show their name": { freeze: "freezes", cheek: "just the name" },
    "give it a joke": { cheek: "name and a joke" },
    "name and job": { cheek: "name and job" },
    "a whole list of facts": { cheek: "a whole list" },
    "keep it playing": { freeze: "keeps playing" },
    "slow it down": { freeze: "slows" },
    "big bold letters": { style: "bold and big" },
    "like a police file": { style: "like an ID card" },
    "handwritten": { style: "handwritten" },
    "everyone gets one": { howMany: 8 },
    "only the villain": { howMany: 1 },
    "a quick flash": { onScreen: 1 },
    "leave it up a while": { onScreen: 4 },
  });

  W.say("titleDrop", {
    "title right away": { lateness: 0 },
    "after the opening": { lateness: 8 },
    "really late": { lateness: 25 },
    "land it on a shock": { landing: "a shock" },
    "land it on the music": { landing: "a music hit" },
    "after a line": { landing: "a line of dialogue" },
    "huge title": { size: "huge and loud" },
    "small and quiet": { size: "small and quiet" },
    "slam it in": { arrives: "slams in" },
    "fade it up": { arrives: "fades up" },
    "letter by letter": { arrives: "builds letter by letter" },
    "someone says the title": { spoken: "someone says it" },
    "a little hint of the title": { spoken: "hinted" },
  });

  /* ---------- Frame & canvas ---------- */

  W.say("frameInFrame", {
    "frame them in the doorway": { framer: "a doorway" },
    "through a window": { framer: "a window" },
    "in the mirror": { framer: "a mirror" },
    "between the people": { framer: "a gap between people" },
    "make them look trapped": { tightness: "trapped" },
    "just loosely framed": { tightness: "loosely" },
    "boxed in": { tightness: "boxed in" },
    "frames inside frames": { layers: 4 },
    "one simple frame": { layers: 1 },
    "small in the shot": { share: 15 },
    "fills most of the shot": { share: 80 },
    "someone is watching them": { watcher: "someone in the story" },
    "we are spying": { watcher: "us" },
  });

  W.say("screenLook", {
    "like a security camera": { source: "security camera" },
    "like a phone video": { source: "phone video" },
    "like a video call": { source: "video call" },
    "on the news": { source: "news report" },
    "old home movie": { source: "old home video", quality: "grainy" },
    "make it look totally real": { realness: 5 },
    "just a hint of a screen": { realness: 1 },
    "add a time stamp": { marks: "a time stamp" },
    "all the buttons and labels": { marks: "full buttons and labels" },
    "red recording dot": { marks: "a red record dot" },
    "make it grainy": { quality: "grainy" },
    "breaking up": { quality: "breaking up" },
    "keep it sharp": { quality: "sharp" },
    "the whole film like this": { share: 100 },
    "just one scene": { share: 5 },
  });

  W.say("frameBreak", {
    "burst out of the frame": { bigness: 5 },
    "just poke past the edge": { bigness: 1 },
    "a hand reaches out": { what: "a hand" },
    "something flies at us": { what: "an object", edge: "toward us" },
    "the frame cracks": { what: "the frame cracks" },
    "words break out": { what: "words" },
    "out of the top": { edge: "top" },
    "out of the side": { edge: "side" },
    "out of the bottom": { edge: "bottom" },
    "just once": { howOften: "once" },
    "at every big moment": { howOften: "at big moments" },
    "make it a habit": { howOften: "a running habit" },
    "thick black bars": { bars: "thick bars" },
    "no bars": { bars: "none" },
  });

  W.say("irisShot", {
    "close the circle on them": { way: "closes in" },
    "open from a circle": { way: "opens out" },
    "close then pop open": { way: "closes, then opens" },
    "down to a pinhole": { size: "a pinhole" },
    "just a little circle": { size: "nearly full" },
    "sharp edge": { softness: 0 },
    "soft edge": { softness: 80 },
    "quick close": { speed: 0.5 },
    "slow close": { speed: 4 },
    "on their face": { target: "a face" },
    "on a tiny detail": { target: "a small detail" },
    "off to one side": { target: "off to one side" },
  });

  /* ---------- Color ---------- */

  W.say("characterColor", {
    "give each person a color": { strength: 4 },
    "only a hint of color": { strength: 1 },
    "just in their clothes": { reach: "clothes" },
    "their whole world is their color": { reach: "everything around them" },
    "their room is their color": { reach: "their room" },
    "two people, two colors": { howMany: 2 },
    "the whole cast": { howMany: 6 },
    "the color rubs off": { spreads: "rubs off on a friend" },
    "their color takes over": { spreads: "takes over the scene" },
    "their color fades": { spreads: "fades away" },
    "the colors fight": { meet: "fight" },
    "the colors blend": { meet: "blend" },
    "side by side": { meet: "sit side by side" },
  });

  W.say("colorArc", {
    "from grey to full color": { path: "grey to color" },
    "drain the color away": { path: "color to grey" },
    "warm to cold": { path: "warm to cold" },
    "cold to warm": { path: "cold to warm" },
    "a big change": { distance: 5 },
    "just a small shift": { distance: 1 },
    "slow and even": { shape: "slow and even" },
    "all at once at the turn": { shape: "all at the turning point" },
    "in steps": { shape: "in steps" },
    "so you barely notice": { noticed: "only in the gut" },
    "make it obvious": { noticed: "clearly" },
    "follow the hero's mood": { follows: "the hero's mood" },
    "follow the seasons": { follows: "the seasons" },
    "follow the love story": { follows: "a relationship" },
  });

  W.say("worldColors", {
    "a color for each place": { splitBy: "places" },
    "the past in a different color": { splitBy: "times" },
    "dreams in their own color": { splitBy: "dreams and real life" },
    "each storyline its own color": { splitBy: "storylines" },
    "make them very different": { difference: 5 },
    "keep them close": { difference: 1 },
    "two looks": { worlds: 2 },
    "lots of looks": { worlds: 5 },
    "never let them mix": { crossings: "never" },
    "one color leaks in at the key moment": { crossings: "once at the key moment" },
    "mixing more and more": { crossings: "more and more" },
    "do it with light": { madeBy: "light" },
    "do it in the edit": { madeBy: "color fixing in the edit" },
    "do it with the set and clothes": { madeBy: "the set and clothes" },
  });

  W.say("warningColor", {
    "red means danger": { hue: "red", warnsOf: "danger" },
    "green before a lie": { hue: "green", warnsOf: "a lie" },
    "purple for the ghost": { hue: "purple", warnsOf: "a ghost or something strange" },
    "make it really scary": { dread: 5 },
    "just a faint warning": { dread: 1 },
    "show it a lot": { times: 12 },
    "only a couple of times": { times: 2 },
    "hide it in the corner": { hidden: "in a corner" },
    "right in plain view": { hidden: "in plain view" },
    "easy to miss": { hidden: "easy to miss" },
    "before someone dies": { warnsOf: "a death" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
