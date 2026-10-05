/* win for the emotion curiosities in data/db-heart.js (database thread): a window for each one, with faces,
   groups and presets named after a kind of film moment. Their own settings are already in db-heart.js. */
(function (W) {
  W.add("empathy", {
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "tiles", slider: "doorway", icons: { "their face up close": "🙂", "hearing their thoughts": "💭", "a small kind act": "🤲", "a struggle we know": "🧗", "seeing what they lost": "💔" } },
        { face: "ladder", slider: "whose" },
      ],
      groups: [
        { label: "How close we feel", sliders: ["level", "whose"] },
        { label: "The way in", sliders: ["doorway", "flaw"] },
        { label: "Time with them", sliders: ["timeWithThem"] },
      ],
      presets: [
        { label: "Quiet kindness nobody sees", plain: "The lead does something small and kind while alone, and we are hooked.", set: { level: 4, doorway: "a small kind act", whose: "the main character", timeWithThem: 3, flaw: "a small one" } },
        { label: "Voice-over confession", plain: "We hear their private thoughts and know their worst flaw.", set: { level: 5, doorway: "hearing their thoughts", whose: "the main character", flaw: "a big one", timeWithThem: 6 } },
        { label: "Watching from the outside", plain: "We see them, but nothing lets us in.", set: { level: 0, whose: "no one", timeWithThem: 0, flaw: "none" } },
      ],
    },
  });

  W.add("sideTaking", {
    window: {
      faces: [
        { face: "balance", slider: "lean", left: "Against them", right: "Rooting for them" },
        { face: "tiles", slider: "reason", icons: { "they are kind": "🤝", "they are funny": "😄", "they are wronged": "⚖️", "they are good at something": "🏆", "they are cruel": "🗡️", "they are selfish": "🪞" } },
        { face: "dial", slider: "flipPoint" },
      ],
      groups: [
        { label: "Where we stand", sliders: ["lean", "reason", "cost"] },
        { label: "Changing sides", sliders: ["flipped", "flipPoint"] },
      ],
      presets: [
        { label: "Underdog we cheer for", plain: "They have been wronged and we are fully behind them.", set: { lean: "we root for them", reason: "they are wronged", flipped: "never", cost: "nothing" } },
        { label: "Charming monster", plain: "We like them even though it makes us squirm.", set: { lean: "we like them", reason: "they are funny", cost: "real discomfort" } },
        { label: "Villain we come to love", plain: "We start hating them and change our minds two thirds in.", set: { lean: "we like them", flipped: "once", flipPoint: 65, reason: "they are wronged" } },
      ],
    },
  });

  W.add("awe", {
    window: {
      faces: [
        { face: "dial", slider: "size" },
        { face: "ladder", slider: "smallness" },
        { face: "tiles", slider: "source", icons: { nature: "🏔️", "a crowd": "👥", "a building or machine": "🏛️", "a person's skill": "🎻", "something unexplained": "✨" } },
      ],
      groups: [
        { label: "The wonder", sliders: ["size", "source", "fearMix"] },
        { label: "How we see it", sliders: ["smallness", "holdTime"] },
        { label: "What we hear", sliders: ["sound"] },
      ],
      presets: [
        { label: "First sight of the mountain", plain: "A tiny figure before a huge view, held long, with rising music.", set: { size: 5, source: "nature", smallness: "a speck", holdTime: 15, sound: "rising music", fearMix: 1 } },
        { label: "The ship arrives", plain: "Something unexplained fills the sky; wonder mixed with fear.", set: { size: 5, source: "something unexplained", smallness: "tiny", sound: "a low hum", fearMix: 4, holdTime: 10 } },
        { label: "Watching a master at work", plain: "A person's skill leaves us quiet and amazed.", set: { size: 3, source: "a person's skill", smallness: "the same size", sound: "silence", holdTime: 6 } },
      ],
    },
  });

  W.add("nostalgia", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "balance", slider: "sweetness", left: "Sweet", right: "Sad" },
        { face: "tiles", slider: "look", icons: { "just like now": "📷", "a little softer": "🌤️", "faded and warm": "🌅", "grainy home video": "📼" } },
      ],
      groups: [
        { label: "The pull of the past", sliders: ["strength", "sweetness", "distance"] },
        { label: "What sets it off", sliders: ["trigger", "whose"] },
        { label: "How the past looks", sliders: ["look"] },
      ],
      presets: [
        { label: "Old song on the car radio", plain: "A song carries them, and us, back twenty years.", set: { strength: 4, trigger: "a song", whose: "both", sweetness: "bittersweet", look: "faded and warm", distance: 20 } },
        { label: "Home movie flashback", plain: "Grainy childhood footage, sweet with a sting.", set: { strength: 5, trigger: "a photo or object", look: "grainy home video", sweetness: "mostly sweet", distance: 30 } },
        { label: "Back at the old house", plain: "Returning to a place, and only sadness waits there.", set: { strength: 3, trigger: "a place", whose: "the character's", sweetness: "mostly sad", look: "a little softer", distance: 15 } },
      ],
    },
  });

  W.add("longing", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "ladder", slider: "farAway" },
        { face: "tiles", slider: "target", icons: { "a person": "❤️", home: "🏠", "a past self": "🪞", "a future": "🌄", "a thing they can't have": "🔒" } },
      ],
      groups: [
        { label: "The longing", sliders: ["strength", "target", "farAway"] },
        { label: "How it shows", sliders: ["shown", "scenes"] },
        { label: "The ending", sliders: ["fulfilled"] },
      ],
      presets: [
        { label: "Love across the room", plain: "They want the person right there and never say so.", set: { strength: 4, target: "a person", farAway: "in the same room", shown: "in the eyes", fulfilled: "never" } },
        { label: "Homesick soldier", plain: "Home is far away, and they finally get back.", set: { strength: 5, target: "home", farAway: "far away", shown: "said out loud", scenes: 20, fulfilled: "fully" } },
        { label: "What might have been", plain: "A life gone for good, carried quietly for the whole film.", set: { strength: 3, target: "a past self", farAway: "gone for good", shown: "hidden", scenes: 30, fulfilled: "a taste of it" } },
      ],
    },
  });

  W.add("shame", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "ladder", slider: "witnesses" },
        { face: "tiles", slider: "hiding", icons: { "they don't": "😞", "look away": "🙈", "joke it off": "😅", "lash out": "😠", "run away": "🏃" } },
      ],
      groups: [
        { label: "The shame", sliders: ["weight", "about", "witnesses"] },
        { label: "What they do with it", sliders: ["hiding", "lingers"] },
        { label: "The audience", sliders: ["shared"] },
      ],
      presets: [
        { label: "Humiliated in front of everyone", plain: "A public failure, and we feel it in our own cheeks.", set: { weight: 5, about: "a failure", witnesses: "everyone", hiding: "run away", shared: "we feel it too", lingers: 5 } },
        { label: "The secret slips out", plain: "One person learns it; they laugh it off and it lingers.", set: { weight: 3, about: "a secret", witnesses: "one person", hiding: "joke it off", lingers: 8, shared: "we wince with them" } },
        { label: "Private sting", plain: "Nobody sees it, and it passes quickly.", set: { weight: 1, witnesses: "no one", hiding: "look away", lingers: 1, shared: "we pity them" } },
      ],
    },
  });

  W.add("guilt", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "ladder", slider: "amends" },
        { face: "tiles", slider: "leaks", icons: { "can't sleep": "🌙", "overly kind": "🎁", "snaps at others": "💢", "avoids someone": "🚪", confesses: "🗣️" } },
      ],
      groups: [
        { label: "The guilt", sliders: ["weight", "deserved", "known"] },
        { label: "How it leaks", sliders: ["leaks", "scenes"] },
        { label: "Making it right", sliders: ["amends"] },
      ],
      presets: [
        { label: "Hit and run haunting", plain: "Their fault, only they know, and they never sleep again.", set: { weight: 5, deserved: "fully their fault", known: "only them", leaks: "can't sleep", scenes: 25, amends: "no attempt" } },
        { label: "Survivor's guilt", plain: "Not their fault, but they carry it anyway.", set: { weight: 4, deserved: "not their fault", known: "everyone", leaks: "avoids someone", scenes: 15, amends: "tries and fails" } },
        { label: "Final confession", plain: "Carried for a long time, then confessed and made right.", set: { weight: 3, deserved: "fully their fault", known: "the person they hurt", leaks: "confesses", amends: "fully" } },
      ],
    },
  });

  W.add("pride", {
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "ladder", slider: "kind" },
        { face: "tiles", slider: "inWhom", icons: { "in themselves": "💪", "in a child": "👶", "in a team": "🏅", "in their work": "🛠️", "in where they come from": "🏡" } },
      ],
      groups: [
        { label: "The pride", sliders: ["level", "kind", "inWhom"] },
        { label: "Earned and seen", sliders: ["earned", "seenBy"] },
        { label: "Before the fall", sliders: ["fallComing"] },
      ],
      presets: [
        { label: "Parent in the crowd", plain: "Quiet, earned pride in a child on stage.", set: { level: 4, kind: "quiet pride", inWhom: "in a child", seenBy: "a crowd", earned: "fully earned", fallComing: 0 } },
        { label: "Pride before a fall", plain: "Showing off something not quite earned, with trouble coming.", set: { level: 5, kind: "arrogance", inWhom: "in themselves", earned: "half earned", seenBy: "a crowd", fallComing: 5 } },
        { label: "Craftsman's glow", plain: "Alone with finished work, glowing.", set: { level: 3, kind: "glowing", inWhom: "in their work", seenBy: "no one", earned: "fully earned" } },
      ],
    },
  });

  W.add("jealousy", {
    window: {
      faces: [
        { face: "dial", slider: "heat" },
        { face: "ladder", slider: "shown" },
        { face: "tiles", slider: "of", icons: { "a rival in love": "💘", "a friend's success": "🏆", "a sibling": "👫", "a newcomer": "🆕" } },
      ],
      groups: [
        { label: "The jealousy", sliders: ["heat", "of", "justified"] },
        { label: "How it shows", sliders: ["shown", "target"] },
        { label: "Where it goes", sliders: ["turns"] },
      ],
      presets: [
        { label: "Othello spiral", plain: "Imagined, hot, and turned on the one they love.", set: { heat: 5, of: "a rival in love", justified: "imagined", shown: "open anger", target: "the one they love", turns: "grows into spite" } },
        { label: "Tight smile at the party", plain: "A friend's success, hidden behind a smile, and it fades.", set: { heat: 2, of: "a friend's success", shown: "a tight smile", target: "themselves", turns: "fades" } },
        { label: "New kid in class", plain: "A newcomer gets the attention, and the rival pays.", set: { heat: 3, of: "a newcomer", shown: "a sharp word", target: "the rival", justified: "a little" } },
      ],
    },
  });

  W.add("relief", {
    window: {
      faces: [
        { face: "pad", x: "after", y: "size", xLabel: "Worry before", yLabel: "Relief" },
        { face: "tiles", slider: "body", icons: { "nothing shows": "😐", "a breath out": "😮‍💨", "a laugh": "😂", "sinking down": "🪑", tears: "😭" } },
        { face: "ladder", slider: "shared" },
      ],
      groups: [
        { label: "The relief", sliders: ["size", "after", "speed"] },
        { label: "How it shows", sliders: ["body", "shared"] },
        { label: "Afterward", sliders: ["lasts"] },
      ],
      presets: [
        { label: "Bomb defused", plain: "Huge worry, then instant relief the whole room feels.", set: { size: 5, after: 5, speed: "instant", body: "sinking down", shared: "the audience too", lasts: "a scene" } },
        { label: "The test results", plain: "Slow dawning good news, then tears.", set: { size: 4, after: 4, speed: "slow dawning", body: "tears", shared: "two", lasts: "for good" } },
        { label: "False alarm", plain: "A quick laugh of relief that lasts only a second.", set: { size: 2, after: 2, speed: "quick", body: "a laugh", lasts: "only a second", shared: "one person" } },
      ],
    },
  });

  W.add("earnedTears", {
    window: {
      faces: [
        { face: "pad", x: "setup", y: "earned", xLabel: "Setup scenes", yLabel: "How earned" },
        { face: "ladder", slider: "restraint" },
        { face: "tiles", slider: "trigger", icons: { "a small object": "🧸", "a simple line": "💬", "a reunion": "🫂", "a goodbye": "👋", "a kindness": "🤲" } },
      ],
      groups: [
        { label: "Earning it", sliders: ["earned", "setup", "trigger"] },
        { label: "The moment", sliders: ["restraint", "quietBefore"] },
        { label: "Music", sliders: ["musicHelp"] },
      ],
      presets: [
        { label: "The old toy in the box", plain: "Planted long before, found in silence, and they fight the tears.", set: { earned: 5, setup: 30, trigger: "a small object", restraint: "fighting it", musicHelp: "quiet", quietBefore: 6 } },
        { label: "Airport reunion", plain: "Open sobbing with the music in full swell.", set: { earned: 3, setup: 12, trigger: "a reunion", restraint: "sobbing openly", musicHelp: "full swell", quietBefore: 1 } },
        { label: "Dry-eyed goodbye", plain: "They don't cry, so we do.", set: { earned: 4, setup: 20, trigger: "a goodbye", restraint: "dry-eyed", musicHelp: "none", quietBefore: 8 } },
      ],
    },
  });

  W.add("sentimentality", {
    window: {
      faces: [
        { face: "dial", slider: "sugar" },
        { face: "balance", slider: "trust", left: "Spells it out", right: "Lets it be" },
        { face: "tiles", slider: "pushers", icons: { "swelling music": "🎻", "slow motion": "🐢", "a speech that explains the feeling": "🗣️", "a cute child or pet": "🐶", "everyone crying": "😭" } },
      ],
      groups: [
        { label: "How sweet", sliders: ["sugar", "pushers", "linger"] },
        { label: "Saying it", sliders: ["explained", "trust"] },
        { label: "Balance", sliders: ["undercut"] },
      ],
      presets: [
        { label: "Greeting card ending", plain: "Music swells, everyone cries, the feeling is said twice.", set: { sugar: 5, pushers: "everyone crying", explained: "again and again", undercut: "none", linger: 45, trust: "spells it out" } },
        { label: "Sweet with a bite", plain: "A tender beat cut short by a joke.", set: { sugar: 2, undercut: "a joke", explained: "never", linger: 8, trust: "lets it be" } },
        { label: "Puppy in slow motion", plain: "A cute pet, slowed down, held for a while.", set: { sugar: 4, pushers: "a cute child or pet", linger: 20, trust: "leans in", undercut: "none" } },
      ],
    },
  });

  W.add("storyTemperature", {
    window: {
      faces: [
        { face: "swatches", slider: "setting", colors: { "ice cold": "#5aa0ff", cool: "#8fc3e8", even: "#cfcfcf", warm: "#ffb36b", hot: "#ef5350" } },
        { face: "mixer", sliders: ["camera", "music", "access", "performance"] },
      ],
      groups: [
        { label: "Temperature", sliders: ["setting", "consistency"] },
        { label: "Camera and music", sliders: ["camera", "music"] },
        { label: "Inside the characters", sliders: ["access", "performance"] },
      ],
      presets: [
        { label: "Cold clinical thriller", plain: "Far, still, no music, never inside their heads.", set: { setting: "ice cold", camera: "far and still", music: "none", access: "never", performance: "held in", consistency: "stays the same" } },
        { label: "Big-hearted family drama", plain: "Close, swelling music, open acting.", set: { setting: "hot", camera: "right in their face", music: "swelling", access: "always", performance: "big" } },
        { label: "Cool start, warm finish", plain: "Starts distant and warms up as we get to know them.", set: { setting: "warm", consistency: "changes a lot", camera: "near", music: "present", access: "often" } },
      ],
    },
  });

  W.add("bodyFeeling", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "mixer", sliders: ["breath", "shaking", "tears", "throat"] },
        { face: "swatches", slider: "skin", colors: { normal: "#f0c8a0", pale: "#ece6dc", flushed: "#f2a08c", red: "#d9534f" } },
      ],
      groups: [
        { label: "How much shows", sliders: ["strength", "skin"] },
        { label: "Breath and shaking", sliders: ["breath", "shaking"] },
        { label: "Throat and tears", sliders: ["throat", "tears"] },
      ],
      presets: [
        { label: "Holding it together", plain: "Held breath, a lump in the throat, glassy eyes.", set: { strength: 2, breath: "held", shaking: "a tremor", skin: "pale", tears: "glassy", throat: "a lump" } },
        { label: "Panic attack", plain: "Gasping, whole body shaking, can't speak.", set: { strength: 5, breath: "gasping", shaking: "whole body shaking", skin: "pale", throat: "can't speak", tears: "crying" } },
        { label: "Furious and red", plain: "Ragged breath, shaking hands, red face.", set: { strength: 4, breath: "ragged", shaking: "hands shaking", skin: "red", tears: "none", throat: "a swallow" } },
      ],
    },
  });

  W.add("sceneAftertaste", {
    window: {
      faces: [
        { face: "dial", slider: "held" },
        { face: "tiles", slider: "kind", icons: { warm: "☀️", uneasy: "😬", sad: "😢", giddy: "🤩", hollow: "🕳️", hopeful: "🌱" } },
        { face: "ladder", slider: "carried" },
      ],
      groups: [
        { label: "The aftertaste", sliders: ["strength", "kind", "settled"] },
        { label: "The last moment", sliders: ["held", "lastImage"] },
        { label: "Into the next scene", sliders: ["carried"] },
      ],
      presets: [
        { label: "Door closes on the argument", plain: "Unsettled, held on a closing door, spilling into the next scene.", set: { strength: 4, kind: "uneasy", held: 6, lastImage: "a closing door", carried: "colors the next scene", settled: "unresolved" } },
        { label: "Empty room after the goodbye", plain: "A hollow feeling held on an empty room.", set: { strength: 5, kind: "hollow", held: 10, lastImage: "an empty room", carried: "carries over", settled: "partly" } },
        { label: "Smash cut", plain: "Cut off the moment the line lands.", set: { strength: 1, held: 0, carried: "cut off", settled: "resolved" } },
      ],
    },
  });

  W.add("filmAftertaste", {
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { uplifted: "🌈", heartbroken: "💔", bittersweet: "🍋", haunted: "👻", "at peace": "🕊️", angry: "😠" } },
        { face: "dial", slider: "lastShotHold" },
        { face: "ladder", slider: "resolved" },
      ],
      groups: [
        { label: "What we walk out with", sliders: ["strength", "kind"] },
        { label: "The ending", sliders: ["resolved", "echo", "lastShotHold"] },
        { label: "The credits", sliders: ["credits"] },
      ],
      presets: [
        { label: "Haunting open ending", plain: "Loose ends, a long last shot and silence over the credits.", set: { strength: 5, kind: "haunted", resolved: "many open", lastShotHold: 40, credits: "silence", echo: "a hint" } },
        { label: "Crowd-pleaser finale", plain: "All tied up and an upbeat song as we stand up.", set: { strength: 4, kind: "uplifted", resolved: "all tied up", lastShotHold: 5, credits: "an upbeat song", echo: "a clear mirror" } },
        { label: "Bittersweet bookend", plain: "The last shot mirrors the first, with the main theme.", set: { strength: 4, kind: "bittersweet", resolved: "a few open", echo: "a clear mirror", credits: "the main theme", lastShotHold: 15 } },
      ],
    },
  });

  W.add("laughThroughGrief", {
    window: {
      faces: [
        { face: "balance", slider: "mix", left: "Grief", right: "Laughter" },
        { face: "tiles", slider: "source", icons: { "a memory of the person": "📸", "a silly mistake": "🤦", "gallows humor": "💀", "a child's honesty": "🧒", "a ritual gone wrong": "⚱️" } },
        { face: "ladder", slider: "who" },
      ],
      groups: [
        { label: "The mix", sliders: ["mix", "source", "timing"] },
        { label: "The laugh", sliders: ["who", "landing"] },
        { label: "After", sliders: ["afterward"] },
      ],
      presets: [
        { label: "Funeral giggles", plain: "The ashes blow back and the whole room breaks.", set: { mix: "even", source: "a ritual gone wrong", who: "the whole room", landing: "breaks the sadness", afterward: "both together", timing: 1 } },
        { label: "Remember when he...", plain: "A funny memory of the person that ends in tears.", set: { mix: "mostly grief", source: "a memory of the person", who: "two", landing: "deepens it", afterward: "laugh turns to tears", timing: 3 } },
        { label: "Kid says it plainly", plain: "A child's blunt question lets everyone breathe.", set: { mix: "mostly laughter", source: "a child's honesty", who: "the whole room", landing: "pauses it", afterward: "lighter" } },
      ],
    },
  });

  W.add("grief", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "ladder", slider: "stage" },
        { face: "tiles", slider: "loss", icons: { "a person": "🕯️", "a pet": "🐾", "a home": "🏚️", "a future": "🌫️", "a friendship": "🤝" } },
      ],
      groups: [
        { label: "The grief", sliders: ["weight", "loss", "stage"] },
        { label: "How it shows", sliders: ["shown", "reminders"] },
        { label: "How long", sliders: ["scenes"] },
      ],
      presets: [
        { label: "Numb after the funeral", plain: "Heavy, hidden, they go through the motions.", set: { weight: 5, stage: "numb", shown: "hidden", loss: "a person", reminders: 1 } },
        { label: "The empty chair at dinner", plain: "Small reminders everywhere bring it back.", set: { weight: 4, stage: "sadness", shown: "in small things", reminders: 5, scenes: 25 } },
        { label: "Letting go at last", plain: "A long road ending in acceptance.", set: { weight: 2, stage: "acceptance", shown: "openly", scenes: 40, reminders: 2 } },
      ],
    },
  });

  W.add("loneliness", {
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "tiles", slider: "framing", icons: { "no hint": "🖼️", "extra space around them": "⬜", "tiny in the frame": "🔹", "seen through glass or doorways": "🚪" } },
        { face: "ladder", slider: "sound" },
      ],
      groups: [
        { label: "How lonely", sliders: ["level", "among", "scenes"] },
        { label: "Picture and sound", sliders: ["framing", "sound"] },
        { label: "Reaching out", sliders: ["reachOut"] },
      ],
      presets: [
        { label: "Alone in the big city", plain: "Tiny in a busy crowd that never notices them.", set: { level: 4, among: "alone in a crowd", framing: "tiny in the frame", sound: "busy", reachOut: "tries and fails" } },
        { label: "Through the window", plain: "Seen through glass in silence, never reaching out.", set: { level: 5, among: "alone in a room", framing: "seen through glass or doorways", sound: "silence", reachOut: "never", scenes: 20 } },
        { label: "Lonely marriage", plain: "Alone with someone, a ticking clock the only sound.", set: { level: 3, among: "alone with someone", framing: "extra space around them", sound: "one small sound", reachOut: "tries and connects" } },
      ],
    },
  });

  W.add("tenderness", {
    window: {
      faces: [
        { face: "dial", slider: "level" },
        { face: "ladder", slider: "touch" },
        { face: "tiles", slider: "act", icons: { "fixing a collar": "👔", "tucking in": "🛏️", feeding: "🥣", "cleaning a wound": "🩹", "a small gift": "🎁" } },
      ],
      groups: [
        { label: "How tender", sliders: ["level", "touch", "voice"] },
        { label: "The small act", sliders: ["act", "who"] },
        { label: "Interruptions", sliders: ["interrupted"] },
      ],
      presets: [
        { label: "Patching up after the fight", plain: "Cleaning a wound in a whisper.", set: { level: 4, act: "cleaning a wound", touch: "a light touch", voice: "whispered", who: "one gives", interrupted: "never" } },
        { label: "Bedtime", plain: "Tucking in, a soft voice, a kiss on the forehead.", set: { level: 5, act: "tucking in", touch: "an embrace", voice: "softer", who: "both give" } },
        { label: "Almost a moment", plain: "A hand comes near, then someone walks in.", set: { level: 2, act: "fixing a collar", touch: "a hand near", interrupted: "by someone entering" } },
      ],
    },
  });

  W.add("betrayal", {
    window: {
      faces: [
        { face: "dial", slider: "blow" },
        { face: "ladder", slider: "closeness" },
        { face: "tiles", slider: "reveal", icons: { told: "🗣️", overheard: "👂", "caught in the act": "🫣", "seen on a screen": "📱" } },
      ],
      groups: [
        { label: "The blow", sliders: ["blow", "closeness"] },
        { label: "How it comes out", sliders: ["reveal", "known"] },
        { label: "Afterward", sliders: ["reaction", "lasting"] },
      ],
      presets: [
        { label: "Et tu, Brute", plain: "The closest friend, caught in the act, and the whole film echoes it.", set: { blow: 5, closeness: "a friend", reveal: "caught in the act", known: "both at once", reaction: "frozen", lasting: 30 } },
        { label: "We knew all along", plain: "The audience knows first and waits for the hero to find out.", set: { blow: 4, closeness: "family or a lover", known: "the audience", reveal: "overheard", reaction: "explosive" } },
        { label: "Office knife in the back", plain: "A coworker's betrayal, met with cold calm.", set: { blow: 2, closeness: "a coworker", reveal: "seen on a screen", reaction: "cold", lasting: 5 } },
      ],
    },
  });

  W.add("forgiveness", {
    window: {
      faces: [
        { face: "ladder", slider: "fullness" },
        { face: "tiles", slider: "shown", icons: { "a word": "💬", "a touch": "🤝", "an invitation": "🚪", "a returned object": "🎁", "a shared joke": "😄" } },
        { face: "dial", slider: "wait" },
      ],
      groups: [
        { label: "The forgiveness", sliders: ["fullness", "shown", "cost"] },
        { label: "Getting there", sliders: ["wait", "asked"] },
        { label: "After", sliders: ["after"] },
      ],
      presets: [
        { label: "Prodigal son comes home", plain: "Asked well after years, forgiven fully, closer than before.", set: { fullness: "full", wait: 30, asked: "asked well", shown: "a touch", after: "closer", cost: "pride" } },
        { label: "Grudging handshake", plain: "Forgiven, barely, and things stay cool.", set: { fullness: "grudging", asked: "asked badly", shown: "a word", after: "cooler", wait: 5 } },
        { label: "The old joke returns", plain: "No apology, but a shared joke says it all.", set: { fullness: "partial", asked: "never asked", shown: "a shared joke", after: "the same", wait: 15 } },
      ],
    },
  });

  W.add("resentment", {
    window: {
      faces: [
        { face: "pad", x: "heat", y: "boilsOver", xLabel: "How hot", yLabel: "Near boiling over" },
        { face: "ladder", slider: "shown" },
        { face: "tiles", slider: "target", icons: { "a parent": "👨‍👦", "a sibling": "👫", "a partner": "💍", "a boss": "💼", "the world": "🌍" } },
      ],
      groups: [
        { label: "The grudge", sliders: ["heat", "age", "fair"] },
        { label: "Who and how", sliders: ["target", "shown"] },
        { label: "The pressure", sliders: ["boilsOver"] },
      ],
      presets: [
        { label: "Thanksgiving dinner", plain: "An old grudge with a parent, all digs and jabs, about to blow.", set: { heat: 4, age: 20, target: "a parent", shown: "digs and jabs", fair: "partly", boilsOver: 5 } },
        { label: "Cold marriage", plain: "Years of cold silence at a partner.", set: { heat: 3, age: 10, target: "a partner", shown: "cold silences", boilsOver: 2 } },
        { label: "Angry at the world", plain: "An unfair grudge against everyone, hidden for now.", set: { heat: 5, target: "the world", fair: "no", shown: "hidden", boilsOver: 3, age: 5 } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
