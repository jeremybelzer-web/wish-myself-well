/* say for the telling curiosities in data/db-depth-telling.js: plain words for "Say what you want". */
(function (W) {
  W.say("listenerPlace", {
    "talk to the audience": { addressed: "spoken to the whole time", closeness: "spoken right into our ear" },
    "second person": { addressed: "spoken to the whole time", closeness: "spoken right into our ear" },
    "first person": { closeness: "inside one head", addressed: "now and then" },
    "third person": { closeness: "beside them", addressed: "never named" },
    "omniscient": { closeness: "far off, seeing it all", knows: "everything, even their thoughts" },
    "we know more than the hero": { knows: "more than the hero" },
    "we know less than the hero": { knows: "less than the hero" },
    "let us inside their head": { closeness: "inside one head" },
    "like a mockumentary": { role: "the film crew" },
    "we are the jury": { role: "a juror" },
    "we are eavesdropping": { role: "an eavesdropper", addressed: "we overhear" },
    "put us against the hero": { side: 90 },
    "put us on the hero's side": { side: 5 },
  });

  W.say("unreliableTelling", {
    "the narrator is lying": { doubt: 5, why: "they lie" },
    "we can trust the narrator": { doubt: 0 },
    "the memory is wrong": { who: "the hero's memory", why: "they forget" },
    "the camera lies": { who: "the camera itself" },
    "a big twist at the end": { found: "in one late twist" },
    "leave lots of clues": { clues: 7 },
    "no clues": { clues: 0 },
    "we never find out": { found: "never sure" },
    "make us want to watch again": { after: "want to watch again" },
  });

  W.say("storyOrder", {
    "tell it in order": { order: "start to finish", jumps: 0 },
    "start in the middle": { order: "starts in the middle" },
    "in medias res": { order: "starts in the middle" },
    "start at the end": { order: "starts at the end" },
    "tell it backwards": { order: "runs backwards" },
    "jump around in time": { order: "jumps around" },
    "nonlinear": { order: "jumps around" },
    "show the date on screen": { marker: "a date on screen", marked: "a title card every time" },
    "don't mark the jumps": { marked: "not at all" },
    "the times meet at the end": { meet: "at the end" },
  });

  W.say("frameStory", {
    "a story inside a story": { frame: 3, layers: 2 },
    "an old man tells the story": { teller: "an old version of the hero" },
    "told to the police": { teller: "someone being questioned" },
    "read from a diary": { teller: "a diary or letter" },
    "a bedtime story": { teller: "a parent at bedtime" },
    "keep going back to the teller": { returns: 10 },
    "the teller can't be trusted": { trust: "not really" },
    "a twist in the frame": { ending: "adds a twist" },
  });

  W.say("foreshadowHint", {
    "foreshadow it": { strength: 3 },
    "a subtle hint": { strength: 1 },
    "an obvious warning": { strength: 5 },
    "a bad omen": { mood: "a bad sign" },
    "a good omen": { mood: "a good sign" },
    "hint with the weather": { form: "the weather" },
    "hint in a dream": { form: "a dream" },
    "only noticed on a rewatch": { noticed: "only on a second watch" },
  });

  W.say("plantedThing", {
    "chekhov's gun": { what: "an object", plant: 4, payoff: 5 },
    "plant a skill": { what: "a skill" },
    "plant a clue": { what: "a fact" },
    "a big payoff": { payoff: 5 },
    "a small payoff": { payoff: 1 },
    "remind us of it": { reminders: 3 },
    "surprise payoff": { surprise: "a big surprise" },
    "pay it off soon": { between: 3 },
  });

  W.say("backstoryDelivery", {
    "show don't tell": { showing: 5, clunk: "invisible" },
    "just tell us": { showing: 0 },
    "too much exposition": { showing: 0, clunk: "clunky" },
    "an info dump": { how: "a long speech", when: "all at the start" },
    "slip it into the argument": { how: "slipped into a fight" },
    "use a flashback": { how: "a flashback" },
    "keep the past a secret": { held: 5 },
    "a little at a time": { when: "a bit at a time" },
  });

  W.say("incitingMoment", {
    "the inciting incident": { force: 4 },
    "start it with a death": { kind: "a loss", force: 5 },
    "a letter arrives": { kind: "a message" },
    "a stranger arrives": { kind: "an arrival" },
    "it happens right away": { minutes: 2 },
    "it happens late": { minutes: 30 },
    "they refuse the call": { refusal: "for a long time" },
    "they choose it": { choice: "they choose it" },
  });

  W.say("symbolThing", {
    "make it a symbol": { weight: 4 },
    "a symbol of love": { standsFor: "love" },
    "a symbol of freedom": { standsFor: "freedom" },
    "a symbol of guilt": { standsFor: "guilt" },
    "break the symbol": { changes: "is broken" },
    "pass it on": { changes: "is passed on" },
    "keep it subtle": { noticed: "hidden" },
    "use the weather": { what: "the weather" },
  });

  W.say("typeTalk", {
    "talk like a perfectionist": { type: "1 the perfectionist" },
    "talk like a helper": { type: "2 the helper" },
    "talk like an achiever": { type: "3 the achiever" },
    "talk like an individualist": { type: "4 the individualist" },
    "talk like an investigator": { type: "5 the investigator" },
    "talk like a loyalist": { type: "6 the loyalist" },
    "talk like an enthusiast": { type: "7 the enthusiast" },
    "talk like a challenger": { type: "8 the challenger" },
    "talk like a peacemaker": { type: "9 the peacemaker" },
    "they're stressed out": { health: "under stress" },
    "at their best": { health: "at their best" },
    "they joke it off": { deflect: "make a joke" },
    "they never stop talking": { words: "they never stop" },
  });

  W.say("themeAloud", {
    "say the theme out loud": { blunt: 5 },
    "hint at the theme": { blunt: 1 },
    "the villain says it": { who: "the villain" },
    "a stranger says it": { who: "a stranger" },
    "say it early": { when: "in the first minutes" },
    "the hero ignores it": { heard: "ignores it" },
    "the hero says it back": { changed: "the same words" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
