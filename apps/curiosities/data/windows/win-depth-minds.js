/* win for the inner life and group curiosities in data/db-depth-minds.js (depth thread, minds). Each one already
   has six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- the mind ---------- */

  W.add("selfStory", {
    window: {
      faces: [
        { face: "dial", slider: "grip" },
        { face: "tiles", slider: "role", icons: { "the victim": "🥀", "the hero": "🦸", "the screw-up": "🙈", "the one who holds it together": "🧱", "the outsider": "🚪" } },
        { face: "ladder", slider: "fit" },
      ],
      groups: [
        { label: "The role", sliders: ["grip", "role", "fit"] },
        { label: "Telling it", sliders: ["retells", "others"] },
        { label: "By the end", sliders: ["drops"] },
      ],
      presets: [
        { label: "The family martyr", plain: "She says she holds the family together, though she made the mess.", set: { grip: 4, role: "the one who holds it together", fit: "far from the facts", retells: "every chance they get", others: "quietly doubt it", drops: "cracks" } },
        { label: "Always the victim", plain: "Everything that goes wrong was done to him, he tells anyone who listens.", set: { grip: 5, role: "the victim", fit: "the opposite of the facts", retells: "to anyone who listens", others: "argue", drops: "never changes" } },
        { label: "The screw-up who isn't", plain: "He calls himself the screw-up, then saves the day and rewrites the story.", set: { grip: 3, role: "the screw-up", fit: "a bit off", retells: "now and then", others: "go along", drops: "rewrites it" } },
      ],
    },
  });

  W.add("allOrNothing", {
    window: {
      faces: [
        { face: "dial", slider: "extreme" },
        { face: "tiles", slider: "about", icons: { themselves: "🪞", "other people": "👥", "a plan": "📋", love: "❤️", "right and wrong": "⚖️" } },
        { face: "ladder", slider: "words" },
      ],
      groups: [
        { label: "The thinking", sliders: ["extreme", "about", "words"] },
        { label: "The flip", sliders: ["flip", "cost"] },
        { label: "The middle", sliders: ["grey"] },
      ],
      presets: [
        { label: "Five minutes late", plain: "His best friend is late once and is cut off for good.", set: { extreme: 5, about: "other people", words: "always or never", flip: "flips at one mistake", cost: "a friendship", grey: "glimpses it" } },
        { label: "Perfect or nothing", plain: "One wrong note and she quits the whole concert.", set: { extreme: 4, about: "themselves", words: "everything or nothing", flip: "flips at one mistake", cost: "a missed chance", grey: "learns it" } },
        { label: "Shades of grey", plain: "A calm judge who sees the middle in everyone.", set: { extreme: 0, about: "right and wrong", words: "sometimes", flip: "never flips", cost: "nothing", grey: "learns it" } },
      ],
    },
  });

  W.add("innerVoice", {
    window: {
      faces: [
        { face: "dial", slider: "loudness" },
        { face: "tiles", slider: "says", icons: { praise: "👏", warnings: "⚠️", "put-downs": "👎", orders: "📢" } },
        { face: "ladder", slider: "when" },
      ],
      groups: [
        { label: "The voice", sliders: ["loudness", "whose", "says"] },
        { label: "On screen", sliders: ["shown", "when"] },
        { label: "Answering it", sliders: ["answers"] },
      ],
      presets: [
        { label: "Nobody wants to hear you", plain: "Her mother's put-downs echo every time she reaches for the microphone.", set: { loudness: 4, whose: "a parent", says: "put-downs", shown: "an echo on the soundtrack", when: "at every choice", answers: "talks back for good" } },
        { label: "The coach on the sideline", plain: "The old coach appears beside him in the big game, barking orders.", set: { loudness: 3, whose: "a coach", says: "orders", shown: "the person appears", when: "under pressure", answers: "obeys" } },
        { label: "A quiet blessing", plain: "A flash of her teacher smiling, just once, when she needs it.", set: { loudness: 1, whose: "a teacher", says: "praise", shown: "a memory flash", when: "rarely", answers: "ignores it" } },
      ],
    },
  });

  W.add("thinkOrLeap", {
    window: {
      faces: [
        { face: "ladder", slider: "lean" },
        { face: "tiles", slider: "shown", icons: { "a still face": "😐", pacing: "🚶", "talking it through": "💬", "lists and notes": "📝", "we hear their thoughts": "💭" } },
        { face: "dial", slider: "options" },
      ],
      groups: [
        { label: "Thinking or jumping", sliders: ["lean", "options", "time"] },
        { label: "What we see", sliders: ["shown", "partner"] },
        { label: "What happens", sliders: ["result"] },
      ],
      presets: [
        { label: "Pros and cons", plain: "She writes a list about asking him to dance while her friend just goes.", set: { lean: "frozen by thinking", options: 6, time: "a whole scene", shown: "lists and notes", result: "the chance passes", partner: "an opposite who acts" } },
        { label: "Jump first", plain: "He leaps the gap in a blink and lands it by luck.", set: { lean: "pure instinct", options: 1, time: "a blink", shown: "a still face", result: "a lucky guess", partner: "an opposite who thinks" } },
        { label: "Talked through", plain: "Two friends talk it out and get it right.", set: { lean: "balanced", options: 3, time: "a few seconds", shown: "talking it through", result: "the right move", partner: "none" } },
      ],
    },
  });

  W.add("expectWorst", {
    window: {
      faces: [
        { face: "dial", slider: "dread" },
        { face: "ladder", slider: "shown" },
        { face: "tiles", slider: "about", icons: { "their health": "🩺", "someone they love": "💞", "a mistake at work": "💼", "being found out": "🔦", "being left": "🧳" } },
      ],
      groups: [
        { label: "The worry", sliders: ["dread", "about", "spiral"] },
        { label: "On screen", sliders: ["shown"] },
        { label: "The truth", sliders: ["reality", "stops"] },
      ],
      presets: [
        { label: "Son is late", plain: "She sees the police at the door, then he walks in eating chips.", set: { dread: 5, shown: "an imagined scene we see", about: "someone they love", spiral: 4, reality: "much better", stops: "the real thing happening" } },
        { label: "The boss is quiet", plain: "He is sure he is fired, says so out loud, and his friend talks him down.", set: { dread: 3, shown: "they say it out loud", about: "a mistake at work", spiral: 3, reality: "a little better", stops: "a friend" } },
        { label: "It was real", plain: "We can't tell her fear is imagined, and it turns out worse.", set: { dread: 4, shown: "we can't tell it's imagined", about: "being found out", spiral: 6, reality: "worse", stops: "nothing" } },
      ],
    },
  });

  W.add("replaying", {
    window: {
      faces: [
        { face: "dial", slider: "stuck" },
        { face: "tiles", slider: "moment", icons: { "a mistake": "❌", "an insult": "🗯️", "a loss": "🕳️", "a missed chance": "🚌", "a goodbye": "👋" } },
        { face: "ladder", slider: "changes" },
      ],
      groups: [
        { label: "The moment", sliders: ["stuck", "moment", "times"] },
        { label: "Each replay", sliders: ["shown", "changes"] },
        { label: "Letting go", sliders: ["letsGo"] },
      ],
      presets: [
        { label: "The clever answer", plain: "The interview replays three times until she finds the line she wishes she'd said.", set: { stuck: 3, moment: "a missed chance", shown: "the moment changed each time", times: 3, changes: "what they wish they'd said", letsGo: "a little" } },
        { label: "The goodbye", plain: "Each replay of the last goodbye shows one more detail, until the truth appears.", set: { stuck: 5, moment: "a goodbye", shown: "the moment played again", times: 6, changes: "a new truth appears", letsGo: "fully" } },
        { label: "Still stings", plain: "A quick flash of the insult every time he goes quiet.", set: { stuck: 2, moment: "an insult", shown: "a flash of the moment", times: 2, changes: "exactly the same", letsGo: "never" } },
      ],
    },
  });

  /* ---------- the group ---------- */

  W.add("quietMajority", {
    window: {
      faces: [
        { face: "dial", slider: "silent" },
        { face: "tiles", slider: "signs", icons: { none: "▫️", "a glance": "👀", "an eye roll": "🙄", "a whisper": "🤫" } },
        { face: "ladder", slider: "breaks" },
      ],
      groups: [
        { label: "The silence", sliders: ["silent", "groupSize", "why"] },
        { label: "What leaks out", sliders: ["signs", "shot"] },
        { label: "Breaking it", sliders: ["breaks"] },
      ],
      presets: [
        { label: "The meeting table", plain: "Every face disagrees with the boss, the camera pans along them all, nobody speaks.", set: { silent: 5, groupSize: 12, why: "fear", signs: "a glance", shot: "a slow pan along all of them", breaks: "never" } },
        { label: "One voice", plain: "The class rolls its eyes in silence until one student says it.", set: { silent: 4, groupSize: 25, why: "each thinks they're alone", signs: "an eye roll", shot: "a few faces", breaks: "one voice breaks it" } },
        { label: "Not my business", plain: "The neighbors whisper but keep out of it.", set: { silent: 3, groupSize: 6, why: "it's not their business", signs: "a whisper", shot: "one face", breaks: "everyone at once" } },
      ],
    },
  });

  W.add("insideJoke", {
    window: {
      faces: [
        { face: "dial", slider: "bond" },
        { face: "tiles", slider: "kind", icons: { "a nickname": "🏷️", "a phrase": "💬", "a gesture": "🤙", "a song": "🎵", "a story they all know": "📖" } },
        { face: "ladder", slider: "weight" },
      ],
      groups: [
        { label: "The joke", sliders: ["bond", "kind", "uses"] },
        { label: "Who is in", sliders: ["outsider", "weight"] },
        { label: "The last time", sliders: ["last"] },
      ],
      presets: [
        { label: "The secret whistle", plain: "The friends' trouble whistle, and the new kid uses it in the last scene.", set: { bond: 5, kind: "a gesture", uses: 5, outsider: "an outsider is let in on it", weight: "a shared memory", last: "it keeps going" } },
        { label: "The last toast", plain: "Their old toast, said one last time at the funeral.", set: { bond: 4, kind: "a phrase", uses: 4, outsider: "no outsider", weight: "a shared loss", last: "said one last time" } },
        { label: "Not in on it", plain: "The new girlfriend laughs along to a nickname she doesn't get.", set: { bond: 2, kind: "a nickname", uses: 3, outsider: "an outsider is shut out", weight: "just fun", last: "it changes" } },
      ],
    },
  });

  W.add("initiation", {
    window: {
      faces: [
        { face: "dial", slider: "test" },
        { face: "tiles", slider: "kind", icons: { "a dare": "🔥", "a skill to prove": "🎯", "a secret kept": "🤐", "taking the blame": "🫵", "a cruel act": "💢" } },
        { face: "ladder", slider: "price" },
      ],
      groups: [
        { label: "The test", sliders: ["test", "kind", "watched"] },
        { label: "Who decides", sliders: ["gate", "result"] },
        { label: "The price", sliders: ["price"] },
      ],
      presets: [
        { label: "Steal from the kind man", plain: "To join the gang he must rob the old man who was good to him.", set: { test: 5, kind: "a cruel act", watched: 4, gate: "the leader", result: "they walk away", price: "their beliefs" } },
        { label: "The jump", plain: "She jumps off the high rock while the whole beach watches.", set: { test: 3, kind: "a dare", watched: 15, gate: "a vote", result: "let in fully", price: "nothing" } },
        { label: "Taking the fall", plain: "He takes the blame for the team and is let in, but loses his oldest friend.", set: { test: 4, kind: "taking the blame", watched: 2, gate: "one gatekeeper", result: "let in fully", price: "an old friend" } },
      ],
    },
  });

  W.add("rightHand", {
    window: {
      faces: [
        { face: "dial", slider: "loyalty" },
        { face: "ladder", slider: "shadow" },
        { face: "tiles", slider: "turn", icons: { never: "🤝", "quietly works against": "🕳️", "walks away": "🚶", "takes over": "👑", "brings the leader down": "⬇️" } },
      ],
      groups: [
        { label: "Beside the leader", sliders: ["loyalty", "job", "shadow"] },
        { label: "The crack", sliders: ["doubts", "known"] },
        { label: "The turn", sliders: ["turn"] },
      ],
      presets: [
        { label: "The long nod", plain: "She stays behind the boss and nods a beat too late.", set: { loyalty: 3, job: "does the dirty work", shadow: "stays behind", doubts: "shown in a look", turn: "quietly works against", known: "the hero" } },
        { label: "The coup", plain: "He speaks for the leader, then steps in front and takes over.", set: { loyalty: 1, job: "speaks for the leader", shadow: "steps in front", doubts: "said out loud", turn: "takes over", known: "nobody" } },
        { label: "Loyal to the end", plain: "The keeper of secrets who never wavers.", set: { loyalty: 5, job: "keeps the secrets", shadow: "stands beside", doubts: "none", turn: "never", known: "the leader" } },
      ],
    },
  });

  W.add("bystanders", {
    window: {
      faces: [
        { face: "dial", slider: "frozen" },
        { face: "tiles", slider: "looks", icons: { "at the scene": "👀", "at each other": "↔️", "at their phones": "📱", away: "🙈" } },
        { face: "tiles", slider: "helper", icons: { "no one": "▫️", "a child": "🧒", "the least likely person": "👵", "the hero": "🦸" } },
      ],
      groups: [
        { label: "The freeze", sliders: ["frozen", "watchers", "time"] },
        { label: "What they see", sliders: ["what", "looks"] },
        { label: "Breaking it", sliders: ["helper"] },
      ],
      presets: [
        { label: "On the bus", plain: "Thirty passengers look at their phones until an old lady stands up.", set: { frozen: 4, watchers: 30, what: "someone bullied", looks: "at their phones", helper: "the least likely person", time: 20 } },
        { label: "The fall", plain: "A man falls in the street and a child is first to help.", set: { frozen: 3, watchers: 10, what: "a fall", looks: "at each other", helper: "a child", time: 8 } },
        { label: "Nobody", plain: "Everyone looks away and nobody ever moves.", set: { frozen: 5, watchers: 15, what: "a theft", looks: "away", helper: "no one", time: 30 } },
      ],
    },
  });

  W.add("scapegoat", {
    window: {
      faces: [
        { face: "dial", slider: "blame" },
        { face: "tiles", slider: "who", icons: { "the newest": "🆕", "the weakest": "🥺", "the oddest": "🦓", "the one who spoke up": "🗣️" } },
        { face: "ladder", slider: "fault" },
      ],
      groups: [
        { label: "The blame", sliders: ["blame", "who", "fault"] },
        { label: "How it goes", sliders: ["howFast", "fate"] },
        { label: "After", sliders: ["group"] },
      ],
      presets: [
        { label: "The missing money", plain: "Every head turns to the new girl, though we saw the captain take it.", set: { blame: 5, who: "the newest", fault: "not their fault at all", howFast: "in one moment", fate: "proved right", group: "feels shame later" } },
        { label: "Pushed out", plain: "The odd kid slowly takes the blame for the lost game and leaves.", set: { blame: 3, who: "the oddest", fault: "partly their fault", howFast: "slowly", fate: "leaves", group: "feels relief" } },
        { label: "Punished for speaking", plain: "The one who warned them is blamed when it goes wrong.", set: { blame: 4, who: "the one who spoke up", fault: "not their fault at all", howFast: "over a scene", fate: "is pushed out", group: "feels nothing" } },
      ],
    },
  });

  /* ---------- the change ---------- */

  W.add("firstStep", {
    window: {
      faces: [
        { face: "dial", slider: "courage" },
        { face: "tiles", slider: "act", icons: { "saying hello": "👋", "asking for help": "🙋", "saying no": "✋", "telling the truth": "🗝️", "trying again": "🔁" } },
        { face: "ladder", slider: "after" },
      ],
      groups: [
        { label: "The step", sliders: ["courage", "act", "when"] },
        { label: "On screen", sliders: ["seen", "shown"] },
        { label: "What follows", sliders: ["after"] },
      ],
      presets: [
        { label: "Just hi", plain: "Ten seconds at the door of the support group, then a quiet 'hi'.", set: { courage: 5, act: "saying hello", when: "early", seen: "everyone", after: "another step follows", shown: "a pause at a door" } },
        { label: "No, for once", plain: "She says no to her sister for the first time, and then gives in again.", set: { courage: 4, act: "saying no", when: "midway", seen: "one person", after: "they step back", shown: "a deep breath" } },
        { label: "Try again", plain: "Alone in the gym, he gets back on the bar.", set: { courage: 2, act: "trying again", when: "the first act", seen: "nobody", after: "they hold", shown: "nothing at all" } },
      ],
    },
  });

  W.add("falseChange", {
    window: {
      faces: [
        { face: "dial", slider: "fake" },
        { face: "tiles", slider: "caught", icons: { never: "🎭", "by a slip": "🍃", "by a test": "🧪", "by their own confession": "🗣️" } },
        { face: "ladder", slider: "becomesReal" },
      ],
      groups: [
        { label: "The act", sliders: ["fake", "why", "signs"] },
        { label: "Who believes it", sliders: ["fooled", "caught"] },
        { label: "Real in the end", sliders: ["becomesReal"] },
      ],
      presets: [
        { label: "The mint", plain: "He tells his ex he quit drinking, and chews a mint before every visit.", set: { fake: 5, why: "to win someone back", signs: 4, fooled: "the people around them", caught: "by a slip", becomesReal: "no" } },
        { label: "It stuck", plain: "Kind for show to get out of trouble, until the kindness becomes real.", set: { fake: 3, why: "to get out of trouble", signs: 2, fooled: "the audience", caught: "by their own confession", becomesReal: "fully" } },
        { label: "Fooling herself", plain: "She swears she's over it, and only she believes it.", set: { fake: 4, why: "to fool themself", signs: 6, fooled: "themselves", caught: "by a test", becomesReal: "partly" } },
      ],
    },
  });

  W.add("othersNotice", {
    window: {
      faces: [
        { face: "dial", slider: "noticed" },
        { face: "tiles", slider: "reaction", icons: { suspicious: "🤨", surprised: "😮", proud: "🥲", threatened: "😠" } },
        { face: "ladder", slider: "pushback" },
      ],
      groups: [
        { label: "Who notices", sliders: ["noticed", "first", "timing"] },
        { label: "What they do", sliders: ["reaction", "said"] },
        { label: "Pushing back", sliders: ["pushback"] },
      ],
      presets: [
        { label: "You don't laugh like that", plain: "Her little brother stares a beat too long and says it out loud.", set: { noticed: 3, first: "a family member", reaction: "surprised", said: "said out loud", timing: "just after the change", pushback: "none" } },
        { label: "The old gang", plain: "His old friends tease him, then try to pull him back.", set: { noticed: 4, first: "a friend", reaction: "threatened", said: "a remark", timing: "too early", pushback: "pulling them back" } },
        { label: "A look from mom", plain: "Long after, his mother looks twice and smiles.", set: { noticed: 2, first: "a family member", reaction: "proud", said: "a look", timing: "long after", pushback: "none" } },
      ],
    },
  });

  W.add("goalSwap", {
    window: {
      faces: [
        { face: "dial", slider: "swap" },
        { face: "tiles", slider: "newGoal", icons: { "someone's safety": "🛡️", "the truth": "🔎", "a friendship": "🤝", peace: "🕊️", staying: "🏠" } },
        { face: "ladder", slider: "shown" },
      ],
      groups: [
        { label: "Old goal, new goal", sliders: ["swap", "old", "newGoal"] },
        { label: "The swap", sliders: ["when", "trigger"] },
        { label: "On screen", sliders: ["shown"] },
      ],
      presets: [
        { label: "Helping the rival", plain: "At the finish line he stops to help his fallen rival up.", set: { swap: 5, old: "winning", newGoal: "a friendship", when: "the final scene", trigger: "a person", shown: "throwing the prize away" } },
        { label: "Revenge to truth", plain: "Midway she stops chasing revenge and starts chasing what really happened.", set: { swap: 4, old: "revenge", newGoal: "the truth", when: "midway", trigger: "a lesson", shown: "a choice" } },
        { label: "The empty win", plain: "He gets the money, finds it empty, and wants only to stay.", set: { swap: 3, old: "money", newGoal: "staying", when: "late", trigger: "winning and finding it empty", shown: "a thought" } },
      ],
    },
  });

  W.add("selfVow", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "tiles", slider: "vow", icons: { "never again": "🚫", "always protect": "🛡️", "never trust": "🔒", "never go back": "🛣️", "never cry": "😶" } },
        { face: "ladder", slider: "said" },
      ],
      groups: [
        { label: "The promise", sliders: ["strength", "vow", "made"] },
        { label: "Testing it", sliders: ["said", "tested"] },
        { label: "How it ends", sliders: ["ends"] },
      ],
      presets: [
        { label: "Never go back", plain: "She swears it in scene one and ends the film driving into her hometown.", set: { strength: 4, vow: "never go back", made: "the first scene", said: "said once", tested: 3, ends: "broken for good reason" } },
        { label: "Always protect", plain: "He promised long ago to protect his sister, and keeps it.", set: { strength: 5, vow: "always protect", made: "before the film", said: "never said", tested: 5, ends: "kept" } },
        { label: "Never trust", plain: "Her written rule never to trust bends when a friend proves true.", set: { strength: 3, vow: "never trust", made: "midway", said: "written down", tested: 2, ends: "bent" } },
      ],
    },
  });

  W.add("tooLateChange", {
    window: {
      faces: [
        { face: "dial", slider: "lateness" },
        { face: "tiles", slider: "lost", icons: { "a person": "🕯️", "a love": "💔", "a job": "💼", "a chance": "⌛", "their own life": "🥀" } },
        { face: "ladder", slider: "mood" },
      ],
      groups: [
        { label: "Too late", sliders: ["lateness", "lost", "knows"] },
        { label: "On screen", sliders: ["shown"] },
        { label: "What is left", sliders: ["left", "mood"] },
      ],
      presets: [
        { label: "The soup", plain: "He learns his late wife's soup and serves it to the neighbor's lonely kid.", set: { lateness: 4, lost: "a person", knows: "the audience", shown: "a last act", left: "passing it on", mood: "quietly hopeful" } },
        { label: "The letter", plain: "Her apology letter arrives after he has moved on.", set: { lateness: 3, lost: "a love", knows: "only them", shown: "a letter", left: "nothing", mood: "sad but calm" } },
        { label: "The empty office", plain: "He finally listens, in an office already cleared out.", set: { lateness: 5, lost: "a job", knows: "no one", shown: "an empty room", left: "nothing", mood: "bitter" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
