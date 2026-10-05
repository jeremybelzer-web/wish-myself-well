/* say for the filters and adjustments, camera angle, archetype and wardrobe curiosities in data/db-depth-look.js
   (depth thread, look): plain words for "Say what you want". */
(function (W) {
  /* ---------- filters and adjustments ---------- */

  W.say("highlightGlow", {
    "a dreamy glow": { glow: 4, spread: 6 },
    "no glow": { glow: 0 },
    "just a touch of glow": { glow: 1, spread: 2 },
    "only the brightest lights": { from: "only the brightest lights" },
    "everything light glows": { from: "everything light" },
    "glow all over": { spread: 10 },
    "warm golden glow": { tint: "warm gold" },
    "like old film": { tint: "red edge, like old film" },
    "a cool blue glow": { tint: "cool blue" },
    "glowing hair": { onWhat: "faces and hair" },
    "glowing windows": { onWhat: "lamps and windows" },
    "only in the memories": { when: "only in memories" },
    "only around her": { when: "only around one person" },
    "grow as they fall in love": { when: "it grows as they fall in love" },
  });

  W.say("darkSwallows", {
    "crush the blacks": { crush: 5 },
    "keep the shadows open": { crush: 0 },
    "mostly black": { share: 80 },
    "just a little black": { share: 15 },
    "hide a face": { hides: "half a face" },
    "someone in the dark": { hides: "a person" },
    "the thing we fear": { hides: "the thing we fear" },
    "a hard edge": { edge: "hard edge" },
    "melt into the dark": { edge: "fades slowly" },
    "lift it at the reveal": { lifted: "at the reveal" },
    "never lift it": { lifted: "never" },
    "eyes glinting in the dark": { glint: 2 },
    "no lights at all": { glint: 0 },
  });

  W.say("hardeningLook", {
    "harden with the trouble": { follows: 5 },
    "keep the look the same": { follows: 0 },
    "a lot harsher": { contrast: 80 },
    "just a little harsher": { contrast: 20 },
    "drain the color": { drain: 90 },
    "keep the color": { drain: 0 },
    "add grit": { grit: "clear grain" },
    "rough and dirty": { grit: "rough and dirty" },
    "get colder": { temp: "gets colder" },
    "get hotter": { temp: "gets hotter" },
    "slowly over the film": { steps: "slowly over the film" },
    "scene by scene": { steps: "scene by scene" },
    "in one hard jump": { steps: "in one hard jump" },
  });

  W.say("tooPerfectLook", {
    "too perfect": { polish: 5 },
    "a normal picture": { polish: 0 },
    "shining white": { bright: "shining white" },
    "just bright": { bright: "bright" },
    "candy colors": { candy: 90 },
    "real colors": { candy: 0 },
    "doll faces": { skin: "like dolls" },
    "real skin": { skin: "real skin" },
    "one small wrong thing": { crack: "a small wrong thing" },
    "let it break apart": { crack: "it breaks apart" },
    "hiding a family secret": { why: "a perfect family's secret" },
    "it is a dream": { why: "a dream" },
    "like an advert": { why: "an advert or a show" },
  });

  W.say("wrongColors", {
    "colors gone wrong": { wrongness: 5 },
    "true colors": { wrongness: 0 },
    "reds turn green": { slide: 180 },
    "a slight shift": { slide: 20 },
    "split the edges": { split: 8 },
    "clean edges": { split: 0 },
    "make it breathe": { pulse: "slow pulse" },
    "flicker": { pulse: "flicker" },
    "a fever": { cause: "fever" },
    "a panic attack": { cause: "panic" },
    "drunk": { cause: "drink or drugs" },
    "snap back": { backTo: "snaps back" },
    "never come back": { backTo: "never comes back" },
  });

  /* ---------- camera angle ---------- */

  W.say("overShoulder", {
    "over the shoulder": { shoulder: 3 },
    "a big shoulder": { shoulder: 5 },
    "no shoulder": { shoulder: 0 },
    "past the left shoulder": { side: "left shoulder" },
    "past the right shoulder": { side: "right shoulder" },
    "tight on the face": { tight: "the face" },
    "see their whole body": { tight: "whole body" },
    "both sharp": { sharp: "both" },
    "only the face sharp": { sharp: "the far face" },
    "matching shots": { match: "mirror images" },
    "different shots": { match: "very different" },
    "the loser alone": { alone: "the one losing" },
    "each alone by the end": { alone: "both by the end" },
  });

  W.say("sharedFrame", {
    "both in one shot": { together: 5, shots: 90 },
    "keep them apart": { together: 0, shots: 0 },
    "mostly apart": { together: 1, shots: 20 },
    "touching": { gap: "touching" },
    "at opposite edges": { gap: "far apart at the edges" },
    "equal size": { bigger: "equal" },
    "one bigger": { bigger: "the first person" },
    "together in the end": { when: "in the end" },
    "together when they touch": { when: "when they touch" },
    "never together": { when: "never" },
    "side by side": { shape: "side by side" },
    "back to back": { shape: "back to back" },
  });

  W.say("childHeight", {
    "at a child's height": { height: 70, whose: "a small child" },
    "down at the floor": { height: 20 },
    "normal height": { height: 160 },
    "a dog's view": { whose: "a pet", height: 30 },
    "from a wheelchair": { whose: "someone seated or in a wheelchair", height: 120 },
    "cut off the grown-ups": { faces: "cut off at the waist" },
    "see their faces": { faces: "we see them fully" },
    "all the time": { share: 100 },
    "now and then": { share: 20 },
    "a parent kneels down": { kneels: "a parent" },
    "nobody comes down": { kneels: "nobody" },
    "everything towers": { size: "towering" },
    "normal size": { size: "normal" },
  });

  W.say("closeOnThing", {
    "it matters a lot": { weight: 5 },
    "just a detail": { weight: 1 },
    "a hand": { thing: "a hand" },
    "a phone": { thing: "a phone or a note" },
    "a ring": { thing: "a ring or jewelry" },
    "a clock": { thing: "a clock" },
    "a quick look": { hold: 0.5 },
    "a long look": { hold: 5 },
    "only we see it": { seenBy: "only us" },
    "everyone sees it": { seenBy: "everyone" },
    "fill the frame": { fill: "fills it completely" },
    "show it again and again": { times: 5 },
    "just once": { times: 1 },
  });

  W.say("glanceThenSee", {
    "through their eyes": { pull: 5, through: "exactly through their eyes" },
    "just a cut": { pull: 0 },
    "from the side": { through: "from the side" },
    "they see a person": { seen: "a person" },
    "they see a danger": { seen: "a danger" },
    "don't show what they see": { seen: "something we don't get to see" },
    "hold on their face": { faceHold: 5 },
    "straight on": { faceHold: 0 },
    "no reaction": { reaction: "nothing" },
    "a big reaction": { reaction: "a big reaction" },
    "a double take": { looks: 2 },
    "look again and again": { looks: 4 },
  });

  /* ---------- archetype ---------- */

  W.say("tricksterRole", {
    "lots of mischief": { mischief: 5 },
    "a small prank": { mischief: 1 },
    "a liar": { tool: "lies" },
    "a joker": { tool: "jokes" },
    "a master of disguise": { tool: "disguises" },
    "on the hero's side": { side: "the hero's" },
    "against the hero": { side: "against the hero" },
    "only for themselves": { side: "their own" },
    "never caught": { caught: "never" },
    "caught in the end": { caught: "in the end" },
    "tricks that tell the truth": { truth: 5 },
    "innocent people pay": { cost: "innocent people" },
    "the trickster pays": { cost: "the trickster" },
  });

  W.say("caretaker", {
    "looks after everyone": { care: 5, whom: "the whole group" },
    "helps a little": { care: 1 },
    "looks after a child": { whom: "a child" },
    "looks after a sick parent": { whom: "a sick parent" },
    "never looks after themselves": { self: 0 },
    "takes care of themselves too": { self: 5 },
    "nobody thanks them": { thanks: "none" },
    "taken for granted": { thanks: "taken for granted" },
    "truly thanked": { thanks: "truly thanked" },
    "they snap": { breaks: "they snap once" },
    "they walk away": { breaks: "they walk away" },
    "always cooking": { shows: "cooking" },
    "patching people up": { shows: "patching wounds" },
  });

  W.say("rivalToFriend", {
    "sworn rivals": { closeness: "sworn rivals" },
    "true friends": { closeness: "true friends" },
    "grudging respect": { closeness: "grudging respect" },
    "fighting over a prize": { over: "a prize" },
    "fighting over a person": { over: "a person" },
    "quickly": { scenes: 3 },
    "over the whole film": { scenes: 20 },
    "a shared enemy": { turn: "a shared enemy" },
    "one saves the other": { turn: "one saves the other" },
    "keep the teasing": { spark: 5 },
    "no more sharp words": { spark: 0 },
    "they fall out again": { backslide: "once" },
    "they keep falling out": { backslide: "often" },
  });

  W.say("comicSidekick", {
    "really funny": { funny: 5 },
    "a light touch": { funny: 1 },
    "clumsy": { kind: "clumsy" },
    "a coward": { kind: "coward" },
    "a know-it-all": { kind: "know-it-all" },
    "says what we think": { says: "always" },
    "keeps quiet": { says: "never" },
    "saves the day": { brave: "saves the day" },
    "never brave": { brave: "none" },
    "in a lot of the film": { screen: 40 },
    "just a few scenes": { screen: 5 },
    "a big heart": { heart: 5 },
    "all jokes": { heart: 0 },
  });

  W.say("rightfulVillain", {
    "completely sure": { belief: 5 },
    "full of doubt": { belief: 0 },
    "wants revenge": { goal: "revenge" },
    "wants to save the world": { goal: "to save the world" },
    "protecting family": { goal: "to protect their family" },
    "mostly right": { point: "mostly" },
    "plain wrong": { point: "not at all" },
    "will do anything": { line: "anything" },
    "just bends the rules": { line: "bend the rules" },
    "just like the hero": { likeHero: 5 },
    "nothing like the hero": { likeHero: 0 },
    "they win": { end: "they win" },
    "they see they were wrong": { end: "they see they were wrong" },
  });

  /* ---------- wardrobe ---------- */

  W.say("costumeTurn", {
    "a whole new look": { shift: 5 },
    "one new piece": { shift: 1 },
    "dress up": { direction: "dressed up" },
    "dress down": { direction: "dressed down" },
    "after a loss": { moment: "after a loss" },
    "before the big fight": { moment: "before the big fight" },
    "a shopping scene": { moment: "a shopping scene" },
    "keep nothing": { kept: "nothing" },
    "keep one piece": { kept: "one piece" },
    "everyone stares": { seen: "everyone stares" },
    "nobody notices": { seen: "nobody" },
    "all at once": { steps: 1 },
    "bit by bit": { steps: 5 },
  });

  W.say("groupDressed", {
    "all the same": { alike: 5 },
    "loosely alike": { alike: 1 },
    "matching jackets": { by: "a jacket or uniform" },
    "the same color": { by: "a color" },
    "the same badge": { by: "a badge or patch" },
    "a big group": { size: 12 },
    "just two": { size: 2 },
    "one refuses": { outOfStep: "one refuses" },
    "the hero breaks away": { outOfStep: "the hero breaks away" },
    "worn with pride": { chosen: "chosen with pride" },
    "forced on them": { chosen: "forced on them" },
    "it splits in two": { drift: "splits in two" },
    "they drop it": { drift: "they drop it" },
  });

  W.say("clashingPiece", {
    "a piece that shouts": { clash: 5, color: "a shout" },
    "a small odd touch": { clash: 1 },
    "odd shoes": { piece: "shoes" },
    "a strange hat": { piece: "a hat" },
    "funny socks": { piece: "socks" },
    "same color family": { color: "the same family" },
    "a memory of someone": { meaning: "a memory of someone" },
    "a secret self": { meaning: "a secret self" },
    "rebellion": { meaning: "rebellion" },
    "never explained": { asked: "never" },
    "tell the story behind it": { asked: "they tell the story behind it" },
    "give it away": { fate: "given away" },
    "lose it": { fate: "lost" },
  });

  W.say("notTheirClothes", {
    "really bad fit": { wrong: 5 },
    "nearly fits": { wrong: 1 },
    "far too big": { way: "far too big" },
    "far too small": { way: "far too small" },
    "handed down": { whose: "handed down" },
    "borrowed": { whose: "borrowed" },
    "stolen clothes": { whose: "stolen" },
    "their late father's": { whose: "from someone who died" },
    "shy about it": { aware: "a bit shy about it" },
    "proud anyway": { aware: "proud anyway" },
    "they grow into them": { grows: "by the end they fit" },
    "they get teased": { others: "teasing" },
    "someone fixes it": { others: "someone fixes it" },
  });

  W.say("uniformOff", {
    "it changes everything": { weight: 5 },
    "just after work": { weight: 0 },
    "a soldier": { uniform: "soldier" },
    "a cop": { uniform: "police" },
    "a nurse": { uniform: "nurse or doctor" },
    "slowly": { how: "slowly and carefully" },
    "in anger": { how: "pulled off in anger" },
    "left behind": { how: "folded and left behind" },
    "badge first": { first: "the badge" },
    "hat first": { first: "the hat" },
    "never again": { back: "never" },
    "back on tomorrow": { back: "yes, every day" },
    "alone": { who: "they are alone" },
    "in front of everyone": { who: "everyone" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
