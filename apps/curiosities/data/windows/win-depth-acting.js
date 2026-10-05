/* win for the lines, movement-with-lines, character-motion and camera-motion curiosities in data/db-depth-acting.js
   (depth thread, acting). Each one already has five or six graded settings of its own, so these windows add faces,
   groups and presets only. */
(function (W) {
  /* ---------- lines and delivery ---------- */

  W.add("cutOff", {
    window: {
      faces: [
        { face: "ladder", slider: "howLate" },
        { face: "tiles", slider: "cutBy", icons: { "another person": "🗣️", "a loud noise": "💥", "something happening": "⚡", "a phone or a knock": "📞" } },
        { face: "dial", slider: "count" },
      ],
      groups: [
        { label: "The cut", sliders: ["howLate", "cutBy", "overlapSec"] },
        { label: "How it feels", sliders: ["count", "rude"] },
        { label: "Afterwards", sliders: ["finished"] },
      ],
      presets: [
        { label: "The name we never hear", plain: "Cut by a noise just before the name, never finished.", set: { howLate: "just before the key word", cutBy: "a loud noise", overlapSec: 0, count: 1, rude: "urgent, not rude", finished: "never" } },
        { label: "Family dinner", plain: "Everyone cutting everyone off, voices on top of each other.", set: { howLate: "partway", cutBy: "another person", overlapSec: 2, count: 8, rude: "impatient", finished: "the other person guesses it" } },
        { label: "Put in their place", plain: "The boss cuts in on the first word, crushing.", set: { howLate: "on the first word", cutBy: "another person", overlapSec: 0.5, count: 2, rude: "crushing", finished: "never" } },
      ],
    },
  });

  W.add("throwaway", {
    window: {
      faces: [
        { face: "dial", slider: "lightness" },
        { face: "ladder", slider: "weight" },
        { face: "tiles", slider: "busy", icons: { nothing: "🧍", eating: "🍝", leaving: "🚪", "working on something": "🔧", "looking at a phone": "📱" } },
      ],
      groups: [
        { label: "The line", sliders: ["lightness", "weight"] },
        { label: "While saying it", sliders: ["busy", "eyes"] },
        { label: "The landing", sliders: ["heard", "beatAfter"] },
      ],
      presets: [
        { label: "Over the dishes", plain: "Life-changing news said while drying plates, caught a beat late.", set: { lightness: 5, weight: "changes everything", busy: "working on something", eyes: "at what they are doing", heard: "caught a beat late", beatAfter: 4 } },
        { label: "On the way out", plain: "Said in the doorway with a coat half on, and missed.", set: { lightness: 4, weight: "big", busy: "leaving", eyes: "away", heard: "missed", beatAfter: 0 } },
        { label: "Said straight", plain: "No throwing away: said with full weight, face to face.", set: { lightness: 0, weight: "big", busy: "nothing", eyes: "at the other person", heard: "caught at once", beatAfter: 2 } },
      ],
    },
  });

  W.add("buildingSpeech", {
    window: {
      faces: [
        { face: "dial", slider: "build" },
        { face: "ladder", slider: "listeners" },
        { face: "tiles", slider: "shape", icons: { "a steady climb": "📈", "in waves": "🌊", "slow, then a rush": "🚀", "quiet, then one burst": "💥" } },
      ],
      groups: [
        { label: "The build", sliders: ["build", "shape", "peak"] },
        { label: "The speech", sliders: ["length", "listeners"] },
        { label: "How it lands", sliders: ["reaction"] },
      ],
      presets: [
        { label: "Closing argument", plain: "Calm and slow to start, peaking on the last word, then a silent courtroom.", set: { build: 5, length: 180, peak: "the very last word", shape: "a steady climb", listeners: "a room", reaction: "silence" } },
        { label: "Locker room", plain: "Waves of fire to a team, ending in a roar.", set: { build: 4, length: 90, peak: "near the end", shape: "in waves", listeners: "a small group", reaction: "the room erupts" } },
        { label: "It falls flat", plain: "A big build to one person, who just shrugs.", set: { build: 4, length: 60, peak: "near the end", shape: "slow, then a rush", listeners: "one person", reaction: "falls flat" } },
      ],
    },
  });

  W.add("trailingOff", {
    window: {
      faces: [
        { face: "ladder", slider: "unsaid" },
        { face: "tiles", slider: "why", icons: { "can't bear to say it": "💔", "no need, we know": "🤝", "lost their nerve": "😬", distracted: "👀", "lost in a memory": "🌫️" } },
        { face: "dial", slider: "times" },
      ],
      groups: [
        { label: "The fade", sliders: ["unsaid", "fadeVoice"] },
        { label: "Why", sliders: ["why", "filler"] },
        { label: "How often", sliders: ["times"] },
      ],
      presets: [
        { label: "Too painful", plain: "Most of the sentence goes unsaid and a look finishes it.", set: { unsaid: "most of the line", why: "can't bear to say it", fadeVoice: "fades slowly", filler: "a look", times: 1 } },
        { label: "Lost the nerve", plain: "Drops off a cliff right before asking, again and again.", set: { unsaid: "the end of the line", why: "lost their nerve", fadeVoice: "drops off a cliff", filler: "nothing", times: 4 } },
        { label: "Old friends", plain: "No need to finish: the other one does it for them.", set: { unsaid: "just the last word", why: "no need, we know", fadeVoice: "fades quickly", filler: "the other person finishes it", times: 2 } },
      ],
    },
  });

  W.add("talkingToSelf", {
    window: {
      faces: [
        { face: "ladder", slider: "loudness" },
        { face: "tiles", slider: "kind", icons: { "a pep talk": "💪", "scolding themselves": "😤", "rehearsing a line": "📝", "working out a problem": "🧩", "talking to someone gone": "🕯️" } },
        { face: "tiles", slider: "toWhat", icons: { "no one": "🌫️", "a mirror": "🪞", "an object": "🧸", "an animal": "🐕", "a photo": "🖼️" } },
      ],
      groups: [
        { label: "The talk", sliders: ["loudness", "kind", "seconds"] },
        { label: "Who hears", sliders: ["alone", "caught"] },
        { label: "Aimed at", sliders: ["toWhat"] },
      ],
      presets: [
        { label: "Mirror rehearsal", plain: "Rehearsing the big line out loud to the bathroom mirror, alone.", set: { loudness: "talking out loud", kind: "rehearsing a line", alone: "they are truly alone", caught: "no", toWhat: "a mirror", seconds: 20 } },
        { label: "Caught muttering", plain: "Muttering at themselves at work until someone hears.", set: { loudness: "muttering", kind: "scolding themselves", alone: "they forget others are there", caught: "caught, embarrassed", toWhat: "no one", seconds: 8 } },
        { label: "At the grave", plain: "Talking to someone gone, through their photo.", set: { loudness: "talking out loud", kind: "talking to someone gone", alone: "they think they are alone", caught: "caught, and it starts a talk", toWhat: "a photo", seconds: 45 } },
      ],
    },
  });

  W.add("oneSidedCall", {
    window: {
      faces: [
        { face: "ladder", slider: "hidden" },
        { face: "tiles", slider: "news", icons: { "small talk": "☕", "good news": "🎉", "bad news": "💔", "a threat": "⚠️", "a secret": "🤫" } },
        { face: "dial", slider: "faceShows" },
      ],
      groups: [
        { label: "The call", sliders: ["hidden", "news", "pauses"] },
        { label: "In the room", sliders: ["faceShows", "others"] },
        { label: "How it ends", sliders: ["ending"] },
      ],
      presets: [
        { label: "The hospital calls", plain: "We hear nothing of the other side; long pauses, the face says it all.", set: { hidden: "nothing at all", news: "bad news", pauses: 7, faceShows: 4, others: 2, ending: "they hang up" } },
        { label: "Ransom call", plain: "A faint voice, a threat, and the line goes dead.", set: { hidden: "a faint voice", news: "a threat", pauses: 4, faceShows: 2, others: 4, ending: "the line goes dead" } },
        { label: "Poker face", plain: "A secret on the line, a blank face, a room watching.", set: { hidden: "nothing at all", news: "a secret", pauses: 3, faceShows: 0, others: 5, ending: "a normal goodbye" } },
      ],
    },
  });

  /* ---------- movement with lines ---------- */

  W.add("backTurned", {
    window: {
      faces: [
        { face: "dial", slider: "turnedAway" },
        { face: "tiles", slider: "why", icons: { shame: "😞", anger: "😠", "hiding tears": "😢", "dismissing them": "🙄", thinking: "🤔" } },
        { face: "ladder", slider: "when" },
      ],
      groups: [
        { label: "The turn", sliders: ["turnedAway", "when", "why"] },
        { label: "The face", sliders: ["faceSeen"] },
        { label: "Turning back", sliders: ["turnBack", "hold"] },
      ],
      presets: [
        { label: "Hiding tears", plain: "Turns fully away before the line, and only we see the tears.", set: { turnedAway: 180, when: "before the line", why: "hiding tears", faceSeen: "only us", turnBack: "never", hold: 12 } },
        { label: "Cold shoulder", plain: "Turns side on after the line to dismiss them, turns back right away.", set: { turnedAway: 90, when: "after the line", why: "dismissing them", faceSeen: "the other person", turnBack: "right away", hold: 2 } },
        { label: "The confession", plain: "Says it to the window out of shame, turns back for the last word.", set: { turnedAway: 150, when: "on the line", why: "shame", faceSeen: "no one", turnBack: "for the last word", hold: 8 } },
      ],
    },
  });

  W.add("ownHabit", {
    window: {
      faces: [
        { face: "dial", slider: "showing" },
        { face: "tiles", slider: "habit", icons: { "fiddling with something": "💍", "touching hair or face": "💇", tapping: "👆", "clearing the throat": "😮‍💨", "a twitch": "⚡", "biting nails or lip": "😬" } },
        { face: "tiles", slider: "triggeredBy", icons: { nerves: "😰", lying: "🤥", boredom: "🥱", "thinking hard": "🤔", guilt: "😔" } },
      ],
      groups: [
        { label: "The habit", sliders: ["showing", "habit", "times"] },
        { label: "Why it shows", sliders: ["triggeredBy", "noticed"] },
        { label: "When it ends", sliders: ["stops"] },
      ],
      presets: [
        { label: "The liar's ring", plain: "Twists a ring every time she lies; only we notice.", set: { showing: 2, habit: "fiddling with something", triggeredBy: "lying", times: 3, noticed: "the audience", stops: "at the end of their journey" } },
        { label: "Nervous wreck", plain: "Tapping all the time, everyone sees it.", set: { showing: 5, habit: "tapping", triggeredBy: "nerves", times: 12, noticed: "another character", stops: "when someone points it out" } },
        { label: "The thinker", plain: "Rubs their face when thinking hard, a quiet tell.", set: { showing: 2, habit: "touching hair or face", triggeredBy: "thinking hard", times: 2, noticed: "no one", stops: "never" } },
      ],
    },
  });

  W.add("mirroring", {
    window: {
      faces: [
        { face: "dial", slider: "match" },
        { face: "tiles", slider: "what", icons: { "the lean": "↗️", "folded arms": "🙅", "a drink or a bite": "🥤", "a gesture": "👋", "the voice": "🗣️" } },
        { face: "dial", slider: "lag" },
      ],
      groups: [
        { label: "The match", sliders: ["match", "what", "lag"] },
        { label: "Who leads", sliders: ["leader", "aware"] },
        { label: "How it ends", sliders: ["breaks"] },
      ],
      presets: [
        { label: "First date going well", plain: "Both lean in and sip at the same time without knowing it.", set: { match: 4, leader: "both at once", lag: 1, what: "a drink or a bite", aware: "no idea", breaks: "they notice and laugh" } },
        { label: "The con artist", plain: "One copies the other on purpose to win them over.", set: { match: 3, leader: "one copies the other", lag: 2, what: "the lean", aware: "one does it on purpose", breaks: "one breaks it on purpose" } },
        { label: "Drifting apart", plain: "They used to match; now the copy comes late and fades.", set: { match: 1, leader: "they take turns", lag: 4, what: "folded arms", aware: "one of them", breaks: "drifts apart" } },
      ],
    },
  });

  W.add("wordlessAnswer", {
    window: {
      faces: [
        { face: "ladder", slider: "bodySize" },
        { face: "tiles", slider: "answer", icons: { yes: "👍", no: "👎", maybe: "🤷", "I don't know": "❓", "I can't say": "🤐" } },
        { face: "dial", slider: "delay" },
      ],
      groups: [
        { label: "The answer", sliders: ["bodySize", "answer", "part"] },
        { label: "Timing", sliders: ["delay", "clear"] },
        { label: "The asker", sliders: ["asker"] },
      ],
      presets: [
        { label: "Eyes to the floor", plain: "A long pause, then the eyes drop: it means she can't say.", set: { bodySize: "a tiny flicker", answer: "I can't say", delay: 4, clear: "we can guess", asker: "understands", part: "the eyes" } },
        { label: "The shrug", plain: "A quick shrug that the asker misreads.", set: { bodySize: "a small nod or shrug", answer: "maybe", delay: 1, clear: "hard to read", asker: "misreads it", part: "the shoulders" } },
        { label: "Walks away", plain: "The answer is no, and the whole body says it by leaving.", set: { bodySize: "the whole body walks away", answer: "no", delay: 2, clear: "plain", asker: "pushes for words", part: "the feet" } },
      ],
    },
  });

  /* ---------- character motion ---------- */

  W.add("pacing", {
    window: {
      faces: [
        { face: "ladder", slider: "paceSpeed" },
        { face: "dial", slider: "laps" },
        { face: "tiles", slider: "why", icons: { worry: "😟", anger: "😠", waiting: "⏳", "thinking it through": "🤔", rehearsing: "📝" } },
      ],
      groups: [
        { label: "The pacing", sliders: ["paceSpeed", "lapLength", "laps"] },
        { label: "Why", sliders: ["why", "stopsOn"] },
        { label: "The others", sliders: ["others"] },
      ],
      presets: [
        { label: "Waiting room", plain: "Slow short laps outside the operating room, stopped by a door.", set: { paceSpeed: "slow", lapLength: 3, laps: 8, why: "waiting", stopsOn: "someone enters", others: "they watch" } },
        { label: "Furious", plain: "Frantic laps across the whole room until they drop into a chair.", set: { paceSpeed: "frantic", lapLength: 6, laps: 5, why: "anger", stopsOn: "they drop into a chair", others: "they try to stop them" } },
        { label: "The detective", plain: "Steady laps until a thought stops them mid-step.", set: { paceSpeed: "steady", lapLength: 4, laps: 6, why: "thinking it through", stopsOn: "a thought", others: "no one is there" } },
      ],
    },
  });

  W.add("bigEntrance", {
    window: {
      faces: [
        { face: "dial", slider: "entranceSize" },
        { face: "ladder", slider: "heads" },
        { face: "tiles", slider: "firstSeen", icons: { "the whole person": "🧍", "their feet": "👞", "their back": "🔙", "a shadow": "👤", "their hands": "✋" } },
      ],
      groups: [
        { label: "The entrance", sliders: ["entranceSize", "doorPause", "firstSeen"] },
        { label: "The wait", sliders: ["wait"] },
        { label: "The room", sliders: ["heads", "roomChange"] },
      ],
      presets: [
        { label: "The star arrives", plain: "Pauses in the door, every head turns, the room stops dead.", set: { entranceSize: 5, heads: "everyone", firstSeen: "the whole person", wait: 10, doorPause: 3, roomChange: "stops dead" } },
        { label: "The villain", plain: "Shadow first, then the boots, the music changes.", set: { entranceSize: 4, heads: "a few", firstSeen: "a shadow", wait: 20, doorPause: 1.5, roomChange: "the music changes" } },
        { label: "Slips in", plain: "Nobody looks up; the party keeps going.", set: { entranceSize: 0, heads: "none", firstSeen: "their back", wait: 0, doorPause: 0, roomChange: "keeps going" } },
      ],
    },
  });

  W.add("walkOut", {
    window: {
      faces: [
        { face: "ladder", slider: "finality" },
        { face: "ladder", slider: "door" },
        { face: "tiles", slider: "stayWith", icons: { "the one leaving": "🚶", "the one left behind": "🧍", "the empty doorway": "🚪" } },
      ],
      groups: [
        { label: "The exit", sliders: ["finality", "lastWord", "atDoor"] },
        { label: "The door", sliders: ["door"] },
        { label: "After", sliders: ["stayWith", "holdAfter"] },
      ],
      presets: [
        { label: "Storms out", plain: "Last word, slam, and we stay with the one left behind.", set: { finality: "storms off", lastWord: "the one leaving", atDoor: "keeps walking", door: "slammed", stayWith: "the one left behind", holdAfter: 8 } },
        { label: "Quiet goodbye", plain: "Stops at the door, says nothing, closes it gently, for good.", set: { finality: "leaves for good", lastWord: "no one", atDoor: "stops for a beat", door: "closed gently", stayWith: "the empty doorway", holdAfter: 12 } },
        { label: "One more thing", plain: "Turns back at the door for one last line.", set: { finality: "they'll be right back", lastWord: "the one leaving", atDoor: "turns back to say one thing", door: "left open", stayWith: "the one leaving", holdAfter: 1 } },
      ],
    },
  });

  W.add("faceOff", {
    window: {
      faces: [
        { face: "ladder", slider: "closeness" },
        { face: "dial", slider: "steps" },
        { face: "balance", slider: "height", left: "Eye to eye", right: "Towers over" },
      ],
      groups: [
        { label: "Closing in", sliders: ["closeness", "steps", "whoSteps"] },
        { label: "The hold", sliders: ["hold", "height"] },
        { label: "How it ends", sliders: ["backsDown"] },
      ],
      presets: [
        { label: "Nose to nose", plain: "Both step in on every line until nose to nose; nobody backs down.", set: { closeness: "nose to nose", steps: 8, whoSteps: "both together", hold: 5, backsDown: "nobody", height: "eye to eye" } },
        { label: "Big and small", plain: "The small one keeps stepping in on the tall one, who backs down.", set: { closeness: "arm's length", steps: 5, whoSteps: "one of them", hold: 3, backsDown: "the other one", height: "one towers over the other" } },
        { label: "Broken up", plain: "They take turns stepping in, then a friend steps between them.", set: { closeness: "a few steps", steps: 4, whoSteps: "they take turns", hold: 2, backsDown: "someone steps between them", height: "one a little taller" } },
      ],
    },
  });

  W.add("standSit", {
    window: {
      faces: [
        { face: "balance", slider: "direction", left: "Sits", right: "Stands" },
        { face: "tiles", slider: "meaning", icons: { "taking control": "👑", "giving in": "🏳️", "settling in": "🛋️", leaving: "🚪", respect: "🙇" } },
        { face: "dial", slider: "heightGap" },
      ],
      groups: [
        { label: "The move", sliders: ["direction", "timing", "speed"] },
        { label: "What it means", sliders: ["meaning", "heightGap"] },
        { label: "The room", sliders: ["follow"] },
      ],
      presets: [
        { label: "Takes the room", plain: "Shoots to their feet on the line and towers over the table.", set: { direction: "shoots to their feet", timing: "on the line", speed: "sudden", meaning: "taking control", follow: "no one", heightGap: 4 } },
        { label: "Defeated", plain: "Sinks into a chair slowly after the line.", set: { direction: "sinks down hard", timing: "after the line", speed: "slowly", meaning: "giving in", follow: "no one", heightGap: 3 } },
        { label: "All rise", plain: "Everyone stands when the judge comes in.", set: { direction: "stands up", timing: "before the line", speed: "normal", meaning: "respect", follow: "everyone", heightGap: 0 } },
      ],
    },
  });

  /* ---------- camera motion ---------- */

  W.add("pushInFace", {
    window: {
      faces: [
        { face: "dial", slider: "pushAmount" },
        { face: "ladder", slider: "speed" },
        { face: "tiles", slider: "during", icons: { listen: "👂", speak: "🗣️", "realise something": "💡", "say nothing at all": "🤐" } },
      ],
      groups: [
        { label: "The push", sliders: ["pushAmount", "speed", "seconds"] },
        { label: "Framing", sliders: ["startSize", "endSize"] },
        { label: "The moment", sliders: ["during"] },
      ],
      presets: [
        { label: "The verdict", plain: "A slow twenty-second creep from waist up to the face while she listens.", set: { pushAmount: 3, speed: "slow", startSize: "waist up", endSize: "the face", seconds: 20, during: "listen" } },
        { label: "It dawns on him", plain: "Barely moving, all the way into the eyes as he realises.", set: { pushAmount: 5, speed: "barely moving", startSize: "the whole body", endSize: "the eyes only", seconds: 30, during: "realise something" } },
        { label: "Quick press", plain: "A short, quick push on the last line of a speech.", set: { pushAmount: 2, speed: "quick", startSize: "shoulders up", endSize: "the face", seconds: 3, during: "speak" } },
      ],
    },
  });

  W.add("circlingCamera", {
    window: {
      faces: [
        { face: "dial", slider: "sweep" },
        { face: "ladder", slider: "speed" },
        { face: "tiles", slider: "moment", icons: { "a kiss": "💋", "a fight": "🥊", "a reunion": "🤗", "a dance": "💃", "a confession": "🙊" } },
      ],
      groups: [
        { label: "The circle", sliders: ["sweep", "speed", "way"] },
        { label: "Who and what", sliders: ["inMiddle", "moment"] },
        { label: "Distance", sliders: ["distance"] },
      ],
      presets: [
        { label: "The kiss", plain: "A slow full circle around the couple, close in.", set: { sweep: 360, speed: "slow", inMiddle: "a couple", moment: "a kiss", distance: "close", way: "clockwise" } },
        { label: "Sizing each other up", plain: "Half a circle around two fighters, drifting, from the middle distance.", set: { sweep: 180, speed: "drifting", inMiddle: "a couple", moment: "a fight", distance: "middle", way: "back and forth" } },
        { label: "Dizzy with joy", plain: "Whirling round a dancing group, again and again.", set: { sweep: 360, speed: "whirling", inMiddle: "a group", moment: "a dance", distance: "middle", way: "counterclockwise" } },
      ],
    },
  });

  W.add("panReveal", {
    window: {
      faces: [
        { face: "dial", slider: "surprise" },
        { face: "ladder", slider: "turnSpeed" },
        { face: "tiles", slider: "revealed", icons: { "a person": "🧍", "a mess or damage": "🏚️", "something huge": "🏔️", "something missing": "❔", "a threat": "⚠️" } },
      ],
      groups: [
        { label: "The turn", sliders: ["turnSpeed", "angle"] },
        { label: "The reveal", sliders: ["surprise", "revealed", "holdOn"] },
        { label: "Who knows", sliders: ["knows"] },
      ],
      presets: [
        { label: "Someone in the corner", plain: "A slow turn finds a person standing in the dark; we find out with her.", set: { surprise: 5, turnSpeed: "slow", revealed: "a person", angle: 90, knows: "they find out with us", holdOn: 4 } },
        { label: "The army", plain: "A steady wide turn across the hill to something huge.", set: { surprise: 4, turnSpeed: "steady", revealed: "something huge", angle: 160, knows: "they knew all along", holdOn: 6 } },
        { label: "Whip to the mess", plain: "A whip turn to the wrecked room, held only a second.", set: { surprise: 3, turnSpeed: "a whip", revealed: "a mess or damage", angle: 120, knows: "they find out after us", holdOn: 1 } },
      ],
    },
  });

  W.add("wanderingCamera", {
    window: {
      faces: [
        { face: "dial", slider: "independence" },
        { face: "tiles", slider: "driftTo", icons: { "an object": "🔪", "a window": "🪟", "another room": "🚪", "another person": "🧍", "empty space": "🌫️" } },
        { face: "ladder", slider: "meaning" },
      ],
      groups: [
        { label: "The drift", sliders: ["independence", "driftTo", "speed"] },
        { label: "The talk", sliders: ["stillHear", "returns"] },
        { label: "What it means", sliders: ["meaning"] },
      ],
      presets: [
        { label: "The knife on the counter", plain: "Slowly drifts from the dinner talk to the knife, then back for the key line.", set: { independence: 3, driftTo: "an object", speed: "slow", stillHear: "quieter", returns: "in time for a key line", meaning: "a clue" } },
        { label: "Out the window", plain: "Leaves the people for good and looks out the window while the talk fades.", set: { independence: 5, driftTo: "a window", speed: "barely", stillHear: "the talk fades away", returns: "never", meaning: "a feeling" } },
        { label: "Someone listening", plain: "Wanders to another room where someone is listening in.", set: { independence: 4, driftTo: "another person", speed: "steady", stillHear: "fully", returns: "late", meaning: "a warning" } },
      ],
    },
  });

  W.add("dollyZoom", {
    window: {
      faces: [
        { face: "dial", slider: "warp" },
        { face: "balance", slider: "way", left: "Rushes in", right: "Stretches away" },
        { face: "tiles", slider: "on", icons: { "a shock": "😱", "a realisation": "💡", fear: "😨", "falling in love": "😍", "a fall or a height": "🏢" } },
      ],
      groups: [
        { label: "The stretch", sliders: ["warp", "way", "seconds"] },
        { label: "The moment", sliders: ["on", "size"] },
        { label: "The sound", sliders: ["sound"] },
      ],
      presets: [
        { label: "Jaws on the beach", plain: "The beach rushes in behind his face on the shock, the sound drops out.", set: { warp: 4, way: "rushes in", seconds: 2, on: "a shock", size: "the face", sound: "drops out" } },
        { label: "Looking down", plain: "The stairwell stretches away below, with a rising hum.", set: { warp: 5, way: "stretches away", seconds: 3, on: "a fall or a height", size: "the whole body", sound: "a rising hum" } },
        { label: "Love at first sight", plain: "A gentle stretch as she sees him across the room, a heartbeat under it.", set: { warp: 2, way: "stretches away", seconds: 4, on: "falling in love", size: "waist up", sound: "a heartbeat" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
