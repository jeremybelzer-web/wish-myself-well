/* win for the telling curiosities in data/db-depth-telling.js (borrowed from writing, 2026-10-05). Each one already
   has six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  W.add("listenerPlace", {
    window: {
      faces: [
        { face: "ladder", slider: "closeness" },
        { face: "tiles", slider: "role", icons: { "a confidant": "🤫", "an eavesdropper": "👂", "a juror": "⚖️", "a witness": "👁️", "the film crew": "🎥", "a player in the game": "🎮" } },
        { face: "ladder", slider: "knows" },
      ],
      groups: [
        { label: "Where we sit", sliders: ["closeness", "addressed", "steady"] },
        { label: "What we know", sliders: ["knows", "side"] },
        { label: "Our part", sliders: ["role"] },
      ],
      presets: [
        { label: "Second person", plain: "A voice talks straight to us the whole film, as 'you'.", set: { closeness: "spoken right into our ear", addressed: "spoken to the whole time", knows: "the same as the hero", role: "a confidant", side: 10, steady: "one place the whole film" } },
        { label: "Inside one head", plain: "Third person, close: we ride with one character and know only what they know.", set: { closeness: "inside one head", addressed: "never named", knows: "the same as the hero", role: "a confidant", side: 15, steady: "one place the whole film" } },
        { label: "All-seeing", plain: "Third person omniscient: we see everything, even more than the hero knows.", set: { closeness: "far off, seeing it all", addressed: "never named", knows: "everything, even their thoughts", role: "a witness", side: 40, steady: "changes scene to scene" } },
        { label: "Mockumentary", plain: "We are the film crew, and people talk to us between scenes.", set: { closeness: "beside them", addressed: "now and then", knows: "more than the hero", role: "the film crew", side: 50, steady: "one place the whole film" } },
      ],
    },
  });

  W.add("unreliableTelling", {
    window: {
      faces: [
        { face: "dial", slider: "doubt" },
        { face: "tiles", slider: "who", icons: { "a voice-over": "🎙️", "the hero's memory": "🧠", "a witness": "🧍", "the camera itself": "🎥", "a letter or diary": "📔" } },
        { face: "ladder", slider: "found" },
      ],
      groups: [
        { label: "The teller", sliders: ["doubt", "who", "why"] },
        { label: "Finding out", sliders: ["clues", "found", "after"] },
      ],
      presets: [
        { label: "The big twist", plain: "The voice-over lies all film, and one late twist turns everything over.", set: { doubt: 5, who: "a voice-over", why: "they lie", clues: 4, found: "in one late twist", after: "rethink the whole film" } },
        { label: "Fading memory", plain: "The hero remembers it wrong, and we learn it slowly.", set: { doubt: 3, who: "the hero's memory", why: "they forget", clues: 6, found: "slowly, scene by scene", after: "doubt everything" } },
        { label: "Every witness differs", plain: "Each witness tells it their own way, and we never know for sure.", set: { doubt: 4, who: "a witness", why: "they are protecting someone", clues: 3, found: "never sure", after: "want to watch again" } },
      ],
    },
  });

  W.add("storyOrder", {
    window: {
      faces: [
        { face: "tiles", slider: "order", icons: { "start to finish": "➡️", "starts in the middle": "🎯", "starts at the end": "🏁", "jumps around": "🔀", "runs backwards": "⏪" } },
        { face: "dial", slider: "jumps" },
        { face: "ladder", slider: "marked" },
      ],
      groups: [
        { label: "The shape of time", sliders: ["order", "jumps", "meet"] },
        { label: "Knowing when we are", sliders: ["marked", "marker"] },
        { label: "Why", sliders: ["why"] },
      ],
      presets: [
        { label: "Three days earlier", plain: "Open on the end, then go back and catch up.", set: { order: "starts at the end", jumps: 2, marked: "a title card every time", marker: "a date on screen", meet: "at the end", why: "to grab us early" } },
        { label: "Puzzle film", plain: "Times jump around, only the haircut tells us when we are.", set: { order: "jumps around", jumps: 14, marked: "a hint", marker: "a haircut or age", meet: "in the very last shot", why: "to hide the answer" } },
        { label: "Straight line", plain: "Start to finish with no jumps at all.", set: { order: "start to finish", jumps: 0, marked: "not at all", marker: "a place", meet: "never", why: "to build dread" } },
      ],
    },
  });

  W.add("frameStory", {
    window: {
      faces: [
        { face: "dial", slider: "frame" },
        { face: "tiles", slider: "teller", icons: { "an old version of the hero": "👴", "a stranger": "🧳", "someone being questioned": "🚔", "a diary or letter": "📔", "a parent at bedtime": "🛏️" } },
        { face: "ladder", slider: "ending" },
      ],
      groups: [
        { label: "The teller", sliders: ["frame", "teller", "trust"] },
        { label: "How often we go back", sliders: ["returns", "layers"] },
        { label: "The end", sliders: ["ending"] },
      ],
      presets: [
        { label: "Grandpa tells it", plain: "An old man tells his grandson the story, and we come back to them now and then.", set: { frame: 3, teller: "an old version of the hero", returns: 5, layers: 1, trust: "mostly", ending: "just closes" } },
        { label: "The interrogation", plain: "A suspect tells it to the police, and the frame hides a twist.", set: { frame: 4, teller: "someone being questioned", returns: 8, layers: 1, trust: "not really", ending: "adds a twist" } },
        { label: "Bedtime story", plain: "A parent's bedtime story, with a tale inside the tale.", set: { frame: 2, teller: "a parent at bedtime", returns: 3, layers: 2, trust: "fully", ending: "turns out to be part of the story" } },
      ],
    },
  });

  W.add("foreshadowHint", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "tiles", slider: "form", icons: { "a line": "💬", "an object": "🔑", "a picture on the wall": "🖼️", "a sound": "🔔", "a dream": "💭", "the weather": "⛈️" } },
        { face: "ladder", slider: "mood" },
      ],
      groups: [
        { label: "The hint", sliders: ["strength", "form", "mood"] },
        { label: "The wait", sliders: ["scenes", "times", "noticed"] },
      ],
      presets: [
        { label: "Storm coming", plain: "Thunder far off in scene 1 points to the ending.", set: { strength: 2, form: "the weather", scenes: 30, mood: "a bad sign", noticed: "when it comes true", times: 3 } },
        { label: "Second-watch hint", plain: "A line nobody notices until they watch again.", set: { strength: 1, form: "a line", scenes: 25, mood: "mixed", noticed: "only on a second watch", times: 1 } },
        { label: "Hopeful sign", plain: "A picture on the wall shows the place they'll end up.", set: { strength: 3, form: "a picture on the wall", scenes: 15, mood: "a good sign", noticed: "when it comes true", times: 2 } },
      ],
    },
  });

  W.add("plantedThing", {
    window: {
      faces: [
        { face: "dial", slider: "plant" },
        { face: "tiles", slider: "what", icons: { "an object": "🔫", "a skill": "🔧", "a fact": "📌", "a person": "🧍", "a place": "🏚️", "a rule": "📜" } },
        { face: "dial", slider: "payoff" },
      ],
      groups: [
        { label: "The plant", sliders: ["plant", "what"] },
        { label: "The wait", sliders: ["between", "reminders"] },
        { label: "The payoff", sliders: ["payoff", "surprise"] },
      ],
      presets: [
        { label: "The gun on the wall", plain: "Shown clearly in act one, fired in act three.", set: { plant: 4, what: "an object", between: 30, reminders: 2, payoff: 5, surprise: "we saw it coming" } },
        { label: "The skill that saves her", plain: "She learns to pick locks early, and it saves her late.", set: { plant: 3, what: "a skill", between: 25, reminders: 1, payoff: 4, surprise: "a small surprise" } },
        { label: "Hidden in plain sight", plain: "A tiny fact in passing turns out to solve everything.", set: { plant: 1, what: "a fact", between: 35, reminders: 0, payoff: 5, surprise: "a big surprise" } },
      ],
    },
  });

  W.add("backstoryDelivery", {
    window: {
      faces: [
        { face: "dial", slider: "showing" },
        { face: "tiles", slider: "how", icons: { "a long speech": "🗣️", "slipped into a fight": "💢", "a voice-over": "🎙️", "words on screen": "🔤", "a flashback": "⏪", "something we see in the room": "🖼️" } },
        { face: "ladder", slider: "clunk" },
      ],
      groups: [
        { label: "Shown or told", sliders: ["showing", "how", "clunk"] },
        { label: "How much, and when", sliders: ["amount", "when", "held"] },
      ],
      presets: [
        { label: "Show, don't tell", plain: "The past is in the room: photos, scars, a key they don't use.", set: { showing: 5, how: "something we see in the room", amount: "some", when: "a bit at a time", clunk: "invisible", held: 3 } },
        { label: "Opening crawl", plain: "Words on screen tell us the whole world up front.", set: { showing: 0, how: "words on screen", amount: "a whole world", when: "all at the start", clunk: "a little obvious", held: 1 } },
        { label: "It comes out in the fight", plain: "The past spills out when they argue.", set: { showing: 3, how: "slipped into a fight", amount: "a lot", when: "saved for late", clunk: "natural", held: 4 } },
      ],
    },
  });

  W.add("incitingMoment", {
    window: {
      faces: [
        { face: "dial", slider: "force" },
        { face: "tiles", slider: "kind", icons: { "an arrival": "🚪", "a loss": "🕯️", "a message": "✉️", "a mistake": "💥", "a discovery": "🔍", "a chance meeting": "🤝" } },
        { face: "ladder", slider: "choice" },
      ],
      groups: [
        { label: "The jolt", sliders: ["force", "kind", "minutes"] },
        { label: "The hero", sliders: ["choice", "refusal"] },
        { label: "How we see it", sliders: ["seen"] },
      ],
      presets: [
        { label: "The letter arrives", plain: "A message comes ten minutes in, and the hero says no at first.", set: { force: 3, minutes: 10, kind: "a message", choice: "forced on them", seen: "on screen", refusal: "for a moment" } },
        { label: "Cold open death", plain: "Someone dies before the title.", set: { force: 5, minutes: 2, kind: "a loss", choice: "forced on them", seen: "on screen", refusal: "no" } },
        { label: "She chooses it", plain: "She makes the first move herself.", set: { force: 3, minutes: 15, kind: "a mistake", choice: "they choose it", seen: "on screen", refusal: "no" } },
      ],
    },
  });

  W.add("symbolThing", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "tiles", slider: "standsFor", icons: { love: "❤️", freedom: "🕊️", guilt: "🩸", home: "🏠", death: "💀", hope: "🌱" } },
        { face: "ladder", slider: "changes" },
      ],
      groups: [
        { label: "The thing", sliders: ["weight", "what", "standsFor"] },
        { label: "Across the film", sliders: ["returns", "changes", "noticed"] },
      ],
      presets: [
        { label: "The cracked teapot", plain: "A wedding teapot at every family dinner, glued back at the end.", set: { weight: 3, what: "an object", standsFor: "home", returns: 5, changes: "is broken", noticed: "felt" } },
        { label: "The caged bird", plain: "A bird in a cage, set free when she leaves.", set: { weight: 4, what: "an animal", standsFor: "freedom", returns: 4, changes: "is set free", noticed: "noticed" } },
        { label: "Endless rain", plain: "It rains every time the guilt comes back.", set: { weight: 2, what: "the weather", standsFor: "guilt", returns: 6, changes: "stays the same", noticed: "felt" } },
      ],
    },
  });

  W.add("glimpseOfALife", {
    window: {
      faces: [
        { face: "dial", slider: "depth" },
        { face: "tiles", slider: "ownShow", icons: { "a comedy": "😂", "a tragedy": "🎭", "a romance": "💕", "a thriller": "🔪", "a quiet drama": "🍵" } },
        { face: "ladder", slider: "arcPoint" },
      ],
      groups: [
        { label: "The glimpse", sliders: ["depth", "seconds", "how"] },
        { label: "Their own story", sliders: ["ownShow", "arcPoint", "echo"] },
      ],
      presets: [
        { label: "The cab driver", plain: "A baby photo and a hospital bracelet on the dashboard, ten seconds of a thriller.", set: { depth: 4, seconds: 10, how: "something they carry", ownShow: "a thriller", arcPoint: "at their crisis", echo: 2 } },
        { label: "The waitress's call", plain: "One side of a phone call reveals a romance ending.", set: { depth: 3, seconds: 20, how: "a phone call", ownShow: "a romance", arcPoint: "at the end", echo: 4 } },
        { label: "Face in the crowd", plain: "Just a face, barely a life.", set: { depth: 0, seconds: 2, how: "a line they say", ownShow: "a quiet drama", arcPoint: "just starting out", echo: 0 } },
      ],
    },
  });

  W.add("typeTalk", {
    window: {
      faces: [
        { face: "tiles", slider: "type", icons: { "1 the perfectionist": "📏", "2 the helper": "🤲", "3 the achiever": "🏆", "4 the individualist": "🎨", "5 the investigator": "🔬", "6 the loyalist": "🛡️", "7 the enthusiast": "🎉", "8 the challenger": "🦁", "9 the peacemaker": "🕊️" } },
        { face: "ladder", slider: "health" },
        { face: "dial", slider: "strength" },
      ],
      groups: [
        { label: "Who they are", sliders: ["type", "strength", "health"] },
        { label: "How they talk", sliders: ["avoids", "deflect", "words"] },
      ],
      presets: [
        { label: "Peacemaker keeps the peace", plain: "A 9 agrees with everyone to avoid a fight.", set: { strength: 4, type: "9 the peacemaker", health: "average", avoids: "that they disagree", deflect: "agree to keep the peace", words: "some" } },
        { label: "Challenger under stress", plain: "An 8 at their worst pushes harder and never admits weakness.", set: { strength: 5, type: "8 the challenger", health: "at their worst", avoids: "that they are weak", deflect: "push harder", words: "a lot" } },
        { label: "Enthusiast jokes it off", plain: "A 7 makes a joke whenever the talk gets painful.", set: { strength: 4, type: "7 the enthusiast", health: "under stress", avoids: "that they are hurting", deflect: "make a joke", words: "they never stop" } },
      ],
    },
  });

  W.add("themeAloud", {
    window: {
      faces: [
        { face: "dial", slider: "blunt" },
        { face: "tiles", slider: "who", icons: { "a side character": "🧑‍🤝‍🧑", "the hero": "🦸", "the villain": "😈", "a stranger": "🧳", "a sign or a song": "🪧" } },
        { face: "ladder", slider: "heard" },
      ],
      groups: [
        { label: "The line", sliders: ["blunt", "who", "when"] },
        { label: "The hero hears it", sliders: ["heard", "again", "changed"] },
      ],
      presets: [
        { label: "The bus driver's line", plain: "A side character says it in scene 1; the hero says it back at the end.", set: { blunt: 2, who: "a side character", when: "in the first minutes", heard: "laughs it off", again: 2, changed: "the same words" } },
        { label: "Villain's speech", plain: "The villain says the theme plainly near the end.", set: { blunt: 5, who: "the villain", when: "near the end", heard: "thinks about it", again: 1, changed: "no" } },
        { label: "On a sign", plain: "A sign in the background says it, again and again.", set: { blunt: 1, who: "a sign or a song", when: "in the middle", heard: "ignores it", again: 4, changed: "new words, same idea" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
