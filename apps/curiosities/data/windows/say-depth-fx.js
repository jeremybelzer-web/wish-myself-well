/* say for the light, effects, layers, editing and structure, and emotional road curiosities in data/db-depth-fx.js
   (depth thread, fx): plain words for "Say what you want". */
(function (W) {
  /* ---------- light ---------- */

  W.say("flickerWarning", {
    "make the light flicker": { flicker: 4 },
    "a steady light": { flicker: 0 },
    "keep cutting out": { flicker: 5, rhythm: "random stutters" },
    "a slow pulse": { rhythm: "a slow pulse" },
    "fast buzzing": { rhythm: "fast buzzing" },
    "one long blackout": { rhythm: "one long blackout", dark: 3 },
    "a quick blink": { dark: 0.5 },
    "a strip light": { source: "a strip light" },
    "a candle": { source: "a candle" },
    "every light in the house": { source: "every light in the house" },
    "someone is coming": { warns: "someone is coming" },
    "something not human": { warns: "something not human" },
    "their mind is slipping": { warns: "their mind is slipping" },
    "someone is there when it comes back": { changed: "someone is there" },
    "someone is gone": { changed: "someone is gone" },
  });

  W.say("shadowTells", {
    "tell it with shadows": { tells: 5 },
    "just a shadow": { tells: 0 },
    "a huge shadow": { size: "huge, towering" },
    "a small shadow": { size: "smaller" },
    "razor sharp": { sharp: "razor sharp" },
    "soft and blurry": { sharp: "blurry" },
    "on the wall": { where: "on a wall" },
    "up the stairs": { where: "up the stairs" },
    "across a face": { where: "across a face" },
    "a fight in shadow": { shows: "a fight" },
    "a kiss in shadow": { shows: "a kiss" },
    "a monster": { shows: "a monster" },
    "never show the real thing": { meets: "never" },
    "it was just the cat": { meets: "yes, and it is smaller" },
  });

  W.say("silhouetteShot", {
    "just an outline": { dark: 5, faceShown: "none" },
    "see their face": { dark: 0, faceShown: "half the face" },
    "against the window": { behind: "a window" },
    "in the doorway": { behind: "an open door" },
    "against the sunset": { behind: "a sunset" },
    "only the eyes": { faceShown: "the eyes" },
    "arms out": { pose: "arms out" },
    "walking away": { pose: "walking away" },
    "walking toward us": { pose: "walking toward us" },
    "a stranger": { who: "no idea" },
    "we guess wrong": { who: "we guess wrong" },
    "step into the light when they speak": { stepsIn: "when they speak" },
    "never step into the light": { stepsIn: "never" },
  });

  W.say("lightPool", {
    "one small circle of light": { pool: 5 },
    "a softly lit room": { pool: 0 },
    "one bulb over the table": { lamp: "a single hanging bulb" },
    "by candlelight": { lamp: "a candle" },
    "under a street lamp": { lamp: "a street lamp" },
    "a hard edge": { rim: "sharp" },
    "melts into the dark": { rim: "fades slowly" },
    "two people in the light": { inside: "two people" },
    "alone in the light": { inside: "one person" },
    "someone watching from the dark": { outside: "someone watching" },
    "the thing we fear out there": { outside: "the thing we fear" },
    "the light swings": { moves: "swings" },
    "the light is going out": { moves: "is going out" },
  });

  /* ---------- effects ---------- */

  W.say("rainOnWindow", {
    "pouring down the glass": { rain: 5, drops: "a sheet of water" },
    "a dry window": { rain: 0 },
    "a few drops": { rain: 1, drops: "still drops" },
    "slow trickles": { drops: "slow trickles" },
    "looking out": { side: "inside looking out" },
    "looking in at them": { side: "outside looking in" },
    "blur the world behind": { blur: 80 },
    "clear behind": { blur: 0 },
    "city lights": { glow: "city lights" },
    "passing car lights": { glow: "car lights passing" },
    "like tears": { tears: "right over the cheek" },
    "no tears": { tears: "no" },
  });

  W.say("visibleBreath", {
    "see their breath": { breath: 4 },
    "no breath showing": { breath: 0 },
    "bitter cold": { cold: "bitter", breath: 5 },
    "just cool": { cold: "cool" },
    "calm breathing": { pace: "slow and calm" },
    "gasping": { pace: "gasping" },
    "fast and scared": { pace: "fast" },
    "two people": { whose: "two people" },
    "a crowd": { whose: "a crowd" },
    "their breath mixes": { mix: "they mix in the air" },
    "hold their breath to hide": { held: "to hide" },
    "the breath stops": { held: "it stops for good" },
  });

  W.say("skyMatchesMood", {
    "the sky feels it too": { match: 5 },
    "weather that doesn't care": { match: 0 },
    "a storm breaks": { sky: "thunder and lightning", size: "the whole sky turns" },
    "the sun comes out": { sky: "sun breaking through" },
    "snow starts": { sky: "snow" },
    "rain at the funeral": { sky: "rain", way: "with it" },
    "sun at the funeral": { way: "against it, like sun at a funeral" },
    "flip halfway": { way: "it flips halfway" },
    "as a warning": { timing: "before the feeling, as a warning" },
    "just after": { timing: "just after" },
    "a small shift": { size: "a small shift" },
    "they get soaked": { noticed: "it soaks them" },
    "nobody notices": { noticed: "no" },
  });

  W.say("fogReveal", {
    "thick fog": { fog: 5, air: "thick fog" },
    "clear air": { fog: 0 },
    "light mist": { fog: 2, air: "mist" },
    "smoke": { air: "smoke" },
    "someone in the fog": { hides: "a person" },
    "a crowd in the fog": { hides: "a crowd" },
    "a monster in the fog": { hides: "a monster" },
    "a shape first": { first: "a shape" },
    "a light first": { first: "a light" },
    "a sound first": { first: "a sound" },
    "lift in a gust": { clears: "in a gust" },
    "walk out of the fog": { clears: "they walk out of it" },
    "right in front of us": { near: "right in front of us" },
    "far away": { near: "far away" },
  });

  /* ---------- layers ---------- */

  W.say("memoryOverlay", {
    "lay the memory over it": { memory: 4 },
    "no memory": { memory: 0 },
    "like a ghost": { how: "faded over the whole picture", solid: 30 },
    "picture in picture": { how: "in a small window" },
    "in the empty chair": { how: "in one part of the room" },
    "in the mirror": { how: "in a reflection" },
    "fully solid": { solid: 100 },
    "warmer past": { pastLook: "warmer" },
    "black and white memory": { pastLook: "black and white" },
    "old home video": { pastLook: "grainy like old video" },
    "same place": { lines: "the place" },
    "same words": { lines: "the same words" },
    "it follows them": { leaves: "stays and follows them" },
    "snap back to now": { leaves: "snaps away" },
  });

  W.say("oneColorLeft", {
    "only one thing in color": { kept: 5, rest: "black and white" },
    "full color": { kept: 0 },
    "a red coat": { what: "a piece of clothing", hue: "red" },
    "a yellow balloon": { what: "a toy", hue: "yellow" },
    "blue eyes": { what: "eyes", hue: "blue" },
    "a flower": { what: "a flower" },
    "black and white": { rest: "black and white" },
    "pale colors": { rest: "pale color" },
    "tiny in the frame": { size: 3 },
    "big in the frame": { size: 40 },
    "just one shot": { lasts: "one shot" },
    "the whole film": { lasts: "the whole film" },
    "until it is gone": { lasts: "until it is gone" },
  });

  W.say("scribblesOnTop", {
    "draw on the picture": { drawn: 4 },
    "a clean picture": { drawn: 0 },
    "chalk": { style: "chalk" },
    "crayon": { style: "crayon" },
    "neon lines": { style: "glowing neon" },
    "hearts and clouds": { shows: "feelings, like hearts and clouds" },
    "sketch the plan": { shows: "a plan" },
    "arrows and labels": { shows: "arrows and labels" },
    "they draw themselves": { moves: "draw themselves" },
    "they follow the person": { moves: "move with the person" },
    "the hero's thoughts": { whose: "the hero's thoughts" },
    "a child's drawings": { whose: "a child's" },
    "lots of colors": { ink: "many colors" },
    "white lines": { ink: "white" },
  });

  W.say("journeyMap", {
    "across the world": { trip: 5 },
    "across town": { trip: 0 },
    "an old paper map": { mapLook: "an old paper map" },
    "a hand-drawn map": { mapLook: "a hand-drawn map" },
    "a globe": { mapLook: "a globe" },
    "a dotted line": { line: "dotted" },
    "a little plane": { line: "a little plane or car" },
    "quick": { seconds: 1 },
    "take its time": { seconds: 8 },
    "fill the screen": { over: "the map fills the screen" },
    "in the corner": { over: "in a corner" },
    "a few stops": { stops: 3 },
    "no stops": { stops: 0 },
  });

  /* ---------- editing and structure ---------- */

  W.say("toldBackwards", {
    "tell it backwards": { backwards: 5 },
    "tell it forward": { backwards: 0 },
    "minutes at a time": { steps: "minutes" },
    "years at a time": { steps: "years" },
    "start at the very end": { startsAt: "the very end" },
    "start at the worst moment": { startsAt: "the worst moment" },
    "some scenes forward": { forward: "every other scene" },
    "a date on screen": { signs: "a date on screen" },
    "no help": { signs: "no help" },
    "end on the first meeting": { endsOn: "the first meeting" },
    "end on a happy moment": { endsOn: "a happy moment" },
    "end on the cause": { endsOn: "the cause of it all" },
  });

  W.say("flashForward", {
    "a quick flash ahead": { glimpse: 0 },
    "a whole scene from the future": { glimpse: 5 },
    "how did i get here": { shows: "the hero in trouble", clear: "perfectly clear" },
    "a disaster ahead": { shows: "a disaster" },
    "a death ahead": { shows: "a death" },
    "a happy ending ahead": { shows: "a happy moment" },
    "years ahead": { jump: "years" },
    "a few days ahead": { jump: "days" },
    "in pieces": { clear: "pieces" },
    "catch up early": { catchUp: "early" },
    "catch up near the end": { catchUp: "near the end" },
    "it wasn't what it seemed": { twist: "the opposite of what we thought" },
    "exactly as shown": { twist: "exactly as shown" },
  });

  W.say("sameMomentAgain", {
    "show it again from another side": { again: 4 },
    "just repeat it": { again: 0 },
    "three times": { times: 3 },
    "twice": { times: 2 },
    "through someone else's eyes": { fromWhere: "another person's eyes" },
    "on a security camera": { fromWhere: "a camera in the story" },
    "right away": { gap: "right away" },
    "at the very end": { gap: "at the very end" },
    "show why it happened": { newSide: "why it happened" },
    "it changes everything": { newSide: "it changes everything" },
    "a small detail": { newSide: "a small detail" },
    "with a rewind sound": { marked: "a rewind sound" },
    "same line of dialogue": { marked: "the same line of dialogue" },
  });

  W.say("falseEnding", {
    "fake ending": { fake: 4 },
    "a real ending": { fake: 0, after: "a real ending" },
    "roll the credits first": { signs: "the credits begin" },
    "swell the music": { signs: "the music swells" },
    "a short wait": { wait: 5 },
    "a long wait": { wait: 90 },
    "the villain comes back": { comesBack: "the villain" },
    "a new problem": { comesBack: "a new problem" },
    "a jump scare": { tone: "a jump scare" },
    "a last laugh": { tone: "a laugh", comesBack: "the joke" },
    "slow dread": { tone: "slow dread" },
    "another fake": { after: "another fake" },
    "end on the shock": { after: "it ends on the shock" },
  });

  W.say("toldBySomeone", {
    "someone tells the story": { teller: 3 },
    "keep cutting back to the teller": { teller: 5 },
    "just a voice at the start": { teller: 0 },
    "the hero, years later": { who: "the hero, years later" },
    "grandpa tells it": { who: "a parent to a child", listener: "a child" },
    "a suspect to police": { who: "a suspect to police", listener: "the police" },
    "told to a crowd": { listener: "a crowd" },
    "we can trust them": { trust: "fully" },
    "they are lying": { trust: "lying" },
    "they make it nicer": { trust: "they make it nicer" },
    "they argue with the listener": { breaks: "they argue with the listener" },
    "they never interrupt": { breaks: "never" },
    "we learn who they are": { endsWith: "we learn who they are" },
    "the teller dies": { endsWith: "the teller dies" },
  });

  /* ---------- emotional road ---------- */

  W.say("allIsLost", {
    "all is lost": { lost: 5 },
    "just a bad day": { lost: 0 },
    "three quarters in": { when: 75 },
    "right before the end": { when: 90 },
    "lose the mentor": { what: "a mentor" },
    "lose everything": { what: "everything" },
    "the plan fails": { what: "the plan" },
    "totally alone": { alone: "alone" },
    "with friends": { alone: "with friends" },
    "a short low": { length: 1 },
    "stay down a while": { length: 8 },
    "a friend comes back": { spark: "a friend comes back" },
    "a small sign": { spark: "a small sign" },
    "they choose to go on": { spark: "they choose to go on" },
  });

  W.say("calmBeforeStorm", {
    "a long calm": { calm: 5, length: 6 },
    "barely a pause": { calm: 0, length: 0 },
    "a meal together": { fills: "a meal together" },
    "a joke by the fire": { fills: "a joke" },
    "a last look at home": { fills: "a last look at home" },
    "only we know": { knows: "only the audience" },
    "nobody knows": { knows: "nobody" },
    "everyone knows": { knows: "everyone" },
    "a distant sound": { sign: "a distant sound" },
    "the sky darkens": { sign: "the sky darkens" },
    "a clock ticking": { sign: "a clock ticking" },
    "breaks all at once": { breaks: "all at once" },
    "breaks slowly": { breaks: "slowly" },
  });

  W.say("smallWin", {
    "a small win": { win: 3 },
    "it keeps them going": { win: 5 },
    "a passing moment": { win: 0 },
    "a kind word": { kind: "a kind word" },
    "a stranger helps": { kind: "a stranger helps" },
    "they learn something": { kind: "a skill learned" },
    "tiny": { size: "tiny" },
    "a real step": { size: "medium" },
    "free": { cost: "nothing" },
    "it costs more than it seems": { cost: "more than it seems" },
    "on their own": { shared: "alone" },
    "with the whole group": { shared: "with the group" },
    "just a moment": { lasting: "a moment" },
    "it lasts": { lasting: "until the end" },
  });

  W.say("doomedFromStart", {
    "we know it ends badly": { doom: 5 },
    "just a hint": { doom: 1 },
    "a narrator tells us": { told: "a narrator says it" },
    "an opening scene shows it": { told: "an opening scene" },
    "it's a true story": { told: "we know the real story" },
    "in the first minute": { whenTold: "the first minute" },
    "halfway through": { whenTold: "halfway" },
    "lots of happy moments": { joy: 9 },
    "few happy moments": { joy: 2 },
    "let us hope": { hopeLeft: "a lot, then takes it" },
    "no hope": { hopeLeft: "never" },
    "even worse": { ending: "worse" },
    "not as bad": { ending: "not as bad" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
