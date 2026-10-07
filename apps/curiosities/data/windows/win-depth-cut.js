/* win for the curiosities in data/db-depth-cut.js (depth thread, cut): transitions, speed, text, frame and color.
   Each one already has five graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- Transitions ---------- */

  W.add("holdBeforeCut", {
    window: {
      faces: [
        { face: "dial", slider: "holdLength" },
        { face: "tiles", slider: "onWhat", icons: { "an empty room": "🚪", "a face": "🙂", "an object": "☕", "a wide view": "🏞️" } },
        { face: "ladder", slider: "stillness" },
        { face: "tiles", slider: "sound", icons: { "the scene carries on": "🗣️", "room tone (the quiet hum of the place)": "〰️", "music swells": "🎻", "dead silence": "🔇" } },
      ],
      groups: [
        { label: "The hold", sliders: ["holdLength", "onWhat", "stillness"] },
        { label: "What we hear", sliders: ["sound"] },
        { label: "Leaving it", sliders: ["exit"] },
      ],
      presets: [
        { label: "Face after the bad news", plain: "Stay on the face four seconds in dead silence, then cut hard.", set: { holdLength: 4, onWhat: "a face", stillness: "almost still", sound: "dead silence", exit: "hard cut" } },
        { label: "Empty room after they leave", plain: "The people are gone; the room stays, humming quietly, then fades.", set: { holdLength: 6, onWhat: "an empty room", stillness: "frozen still", sound: "room tone (the quiet hum of the place)", exit: "slow fade" } },
        { label: "Music carries us out", plain: "A wide view holds while the music swells, and the next scene's sound arrives first.", set: { holdLength: 5, onWhat: "a wide view", stillness: "a little drift", sound: "music swells", exit: "the next scene's sound comes first" } },
      ],
    },
  });

  W.add("bridgeLine", {
    window: {
      faces: [
        { face: "pad", x: "fit", y: "leap", xLabel: "How neatly it answers", yLabel: "How far it jumps" },
        { face: "tiles", slider: "kind", icons: { "answers the question": "❓", "finishes the sentence": "➡️", "says the opposite": "🔄", "echoes the same words": "🔁" } },
        { face: "ladder", slider: "sting" },
      ],
      groups: [
        { label: "The two lines", sliders: ["fit", "kind", "sting"] },
        { label: "Across the cut", sliders: ["leap", "speaker"] },
      ],
      presets: [
        { label: "Question answered elsewhere", plain: "'Where is he?' and across town someone says 'Right here.'", set: { fit: 5, kind: "answers the question", leap: "across town", speaker: "the person they mean", sting: "a little wink" } },
        { label: "Finished by a stranger", plain: "One person starts a sentence, a stranger miles away ends it.", set: { fit: 4, kind: "finishes the sentence", leap: "across town", speaker: "a stranger", sting: "a plain link" } },
        { label: "Years later, the cruel echo", plain: "A promise, then the same words years later, said bitterly.", set: { fit: 3, kind: "echoes the same words", leap: "years later", speaker: "the same person", sting: "a gut punch" } },
      ],
    },
  });

  W.add("cutBeforeHit", {
    window: {
      faces: [
        { face: "ladder", slider: "early" },
        { face: "tiles", slider: "cutTo", icons: { black: "⬛", "the next scene": "🎬", "a face watching": "😳", "something calm": "🍳" } },
        { face: "dial", slider: "hurt" },
      ],
      groups: [
        { label: "The cut", sliders: ["early", "cutTo"] },
        { label: "What we miss", sliders: ["hurt", "heard"] },
        { label: "Later", sliders: ["shownLater"] },
      ],
      presets: [
        { label: "Crunch in the dark", plain: "Cut to black a frame before the punch and let us hear all of it.", set: { early: "a frame before", cutTo: "black", heard: "the full sound", hurt: 4, shownLater: "only what's left after" } },
        { label: "Cut to the calm kitchen", plain: "Long before the fight, cut to someone cracking eggs. We never see it.", set: { early: "long before", cutTo: "something calm", heard: "nothing at all", hurt: 3, shownLater: "never" } },
        { label: "The watcher's face", plain: "A beat before, cut to someone watching, and save it for a flashback.", set: { early: "a beat before", cutTo: "a face watching", heard: "a muffled sound", hurt: 5, shownLater: "in a flashback" } },
      ],
    },
  });

  W.add("hiddenCut", {
    window: {
      faces: [
        { face: "dial", slider: "hidden" },
        { face: "tiles", slider: "hiddenBy", icons: { "something dark crosses the lens": "🧥", "a fast swing of the camera": "💨", "a wall or a door": "🚪", "a flash of light": "⚡", "a body passing close": "🚶" } },
        { face: "mixer", sliders: ["takeLength", "joins"] },
      ],
      groups: [
        { label: "Hiding it", sliders: ["hidden", "hiddenBy"] },
        { label: "The long shot", sliders: ["takeLength", "joins"] },
        { label: "Why", sliders: ["why"] },
      ],
      presets: [
        { label: "Whole film in one shot", plain: "Dozens of cuts hidden so well it feels like two hours without a break.", set: { hidden: 5, hiddenBy: "something dark crosses the lens", takeLength: 600, joins: 20, why: "to keep us in real time" } },
        { label: "Through the door to another city", plain: "A door fills the frame and opens onto another place.", set: { hidden: 4, hiddenBy: "a wall or a door", takeLength: 60, joins: 1, why: "to join two places" } },
        { label: "Show-off swing", plain: "A fast camera swing joins two shots in a long flashy scene.", set: { hidden: 3, hiddenBy: "a fast swing of the camera", takeLength: 180, joins: 3, why: "to show off" } },
      ],
    },
  });

  W.add("cutToBlack", {
    window: {
      faces: [
        { face: "dial", slider: "blackLength" },
        { face: "tiles", slider: "when", icons: { "mid-sentence": "💬", "at the shock": "😱", "right after the choice": "✅", "at the very end": "🏁" } },
        { face: "tiles", slider: "sound", icons: { silence: "🔇", "the scene's sound goes on": "🔊", "one single noise": "💥", "music starts": "🎵" } },
        { face: "ladder", slider: "jolt" },
      ],
      groups: [
        { label: "The black", sliders: ["blackLength", "when", "jolt"] },
        { label: "In the dark", sliders: ["sound"] },
        { label: "Coming back", sliders: ["comeBack"] },
      ],
      presets: [
        { label: "Cut off mid-sentence", plain: "Black in the middle of a word, no sound, straight to the credits.", set: { blackLength: 4, when: "mid-sentence", sound: "silence", comeBack: "the credits", jolt: "a shock" } },
        { label: "One gunshot in the dark", plain: "The screen goes black and we hear just one bang.", set: { blackLength: 2, when: "at the shock", sound: "one single noise", comeBack: "later the same day", jolt: "a shock" } },
        { label: "A breath after the choice", plain: "A short black after the decision, then the same moment carries on.", set: { blackLength: 1, when: "right after the choice", sound: "the scene's sound goes on", comeBack: "the same moment", jolt: "a jolt" } },
      ],
    },
  });

  /* ---------- Speed & timing ---------- */

  W.add("timeLapse", {
    window: {
      faces: [
        { face: "ladder", slider: "squeeze" },
        { face: "tiles", slider: "subject", icons: { "sky and light": "☁️", "a crowd": "👥", "a city": "🌃", "a person waiting": "🪑", "something growing": "🌱" } },
        { face: "mixer", sliders: ["screenTime", "streaks"] },
      ],
      groups: [
        { label: "Time squeezed", sliders: ["squeeze", "screenTime"] },
        { label: "What we watch", sliders: ["subject", "streaks"] },
        { label: "The camera", sliders: ["camMove"] },
      ],
      presets: [
        { label: "City wakes up", plain: "A night in five seconds: lights blink on and streak, the camera slides slowly.", set: { squeeze: "hours", screenTime: 5, subject: "a city", camMove: "a slow slide", streaks: 5 } },
        { label: "Waiting on the bench", plain: "One still person while the crowd blurs past for a whole day.", set: { squeeze: "a day", screenTime: 8, subject: "a person waiting", camMove: "locked still", streaks: 3 } },
        { label: "Seasons turn", plain: "A tree through a whole year in twelve seconds.", set: { squeeze: "seasons", screenTime: 12, subject: "something growing", camMove: "locked still", streaks: 0 } },
      ],
    },
  });

  W.add("slowReveal", {
    window: {
      faces: [
        { face: "ladder", slider: "slowdown" },
        { face: "tiles", slider: "detail", icons: { "an object": "💍", "a face": "👀", "a hand": "✋", "a wound": "🩸", "what someone sees": "🔭" } },
        { face: "dial", slider: "slowLength" },
        { face: "tiles", slider: "soundDrops", icons: { "stays normal": "🔊", "stretches low": "🔉", "drops to a heartbeat": "💓", "goes silent": "🔇" } },
      ],
      groups: [
        { label: "The slow down", sliders: ["slowdown", "rampIn", "slowLength"] },
        { label: "What it shows", sliders: ["detail"] },
        { label: "The sound", sliders: ["soundDrops"] },
      ],
      presets: [
        { label: "The badge in the bag", plain: "Snap into very slow motion as the bag falls open, heartbeat only.", set: { slowdown: "very slow", detail: "an object", rampIn: "snaps slow", slowLength: 3, soundDrops: "drops to a heartbeat" } },
        { label: "The look across the room", plain: "Ease into half speed on a face while the sound stretches low.", set: { slowdown: "half speed", detail: "a face", rampIn: "eases in", slowLength: 4, soundDrops: "stretches low" } },
        { label: "Frozen silence", plain: "Nearly frozen, totally silent, on what the hero sees.", set: { slowdown: "nearly frozen", detail: "what someone sees", rampIn: "snaps slow", slowLength: 6, soundDrops: "goes silent" } },
      ],
    },
  });

  W.add("frozenOrbit", {
    window: {
      faces: [
        { face: "ladder", slider: "frozen" },
        { face: "dial", slider: "sweep" },
        { face: "mixer", sliders: ["orbitLength", "inAir"] },
      ],
      groups: [
        { label: "The frozen moment", sliders: ["frozen", "inAir"] },
        { label: "The camera", sliders: ["sweep", "orbitLength"] },
        { label: "Restart", sliders: ["restart"] },
      ],
      presets: [
        { label: "Bullet dodge", plain: "Nearly stopped, the camera swings halfway round, then time speeds back up.", set: { frozen: "nearly stopped", sweep: 180, orbitLength: 4, inAir: 6, restart: "speeds back up" } },
        { label: "Glass everywhere", plain: "Fully frozen with thirty shards of glass in the air and a full circle.", set: { frozen: "fully frozen", sweep: 360, orbitLength: 6, inAir: 30, restart: "snaps back" } },
        { label: "Quick peek", plain: "A short slow glide a little way round, then cut away.", set: { frozen: "slowed a lot", sweep: 60, orbitLength: 2, inAir: 2, restart: "cut away" } },
      ],
    },
  });

  W.add("timeSkip", {
    window: {
      faces: [
        { face: "ladder", slider: "skip" },
        { face: "ladder", slider: "clue" },
        { face: "tiles", slider: "skipped", icons: { travel: "🚗", waiting: "⏳", "a fight": "🥊", healing: "🩹", "growing up": "🧒" } },
      ],
      groups: [
        { label: "The jump", sliders: ["skip", "smooth"] },
        { label: "Clues", sliders: ["clue"] },
        { label: "The gap", sliders: ["skipped", "catchUp"] },
      ],
      presets: [
        { label: "Skip the drive", plain: "Leave the house, arrive at the beach. Hours gone, nobody asks.", set: { skip: "hours", clue: "a clock or the light changes", smooth: "smooth", skipped: "travel", catchUp: "never" } },
        { label: "Years in prison", plain: "The cell door shuts, a card says '8 years later'.", set: { skip: "years", clue: "a card on screen", smooth: "jolting", skipped: "waiting", catchUp: "a line explains" } },
        { label: "All grown up", plain: "A kid blows out candles, cut to the adult doing the same.", set: { skip: "years", clue: "new hair or clothes", smooth: "smooth", skipped: "growing up", catchUp: "a flashback fills it in" } },
      ],
    },
  });

  W.add("stretchedMoment", {
    window: {
      faces: [
        { face: "dial", slider: "stretch" },
        { face: "pad", x: "angles", y: "repeats", xLabel: "Angles", yLabel: "Shown again" },
        { face: "ladder", slider: "weight" },
      ],
      groups: [
        { label: "How long it lasts", sliders: ["stretch", "repeats"] },
        { label: "The shots", sliders: ["angles", "pieces"] },
        { label: "What hangs on it", sliders: ["weight"] },
      ],
      presets: [
        { label: "The door slams three times", plain: "Three angles of the same slam, the door finally shuts.", set: { stretch: 3, angles: 3, repeats: 2, pieces: "only the action", weight: "a big step" } },
        { label: "The bridge opens", plain: "A ten-second moment stretched across a dozen shots of faces and details.", set: { stretch: 10, angles: 12, repeats: 1, pieces: "all of it", weight: "life or death" } },
        { label: "The tiny pause", plain: "A small moment, a bit longer, with a few close details.", set: { stretch: 2, angles: 4, repeats: 0, pieces: "small details", weight: "small" } },
      ],
    },
  });

  /* ---------- Text & captions ---------- */

  W.add("kineticWords", {
    window: {
      faces: [
        { face: "dial", slider: "motion" },
        { face: "tiles", slider: "rule", icons: { "pop on the beat": "🥁", "follow the voice": "🗣️", "act out the word": "🎭", "fly around the person": "🌀" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "Movement", sliders: ["motion", "rule"] },
        { label: "The words", sliders: ["chunk", "size"] },
        { label: "Timing", sliders: ["sync"] },
      ],
      presets: [
        { label: "Shouted NO", plain: "One word, full screen, shaking with the voice.", set: { motion: 5, rule: "act out the word", chunk: "one word", size: "full screen", sync: "the voice" } },
        { label: "Lyric video", plain: "A few words at a time popping on every beat.", set: { motion: 3, rule: "pop on the beat", chunk: "a few words", size: "large", sync: "each syllable" } },
        { label: "Thoughts swirling", plain: "Small words float around the person's head.", set: { motion: 2, rule: "fly around the person", chunk: "one word", size: "small", sync: "loosely" } },
      ],
    },
  });

  W.add("screenMessages", {
    window: {
      faces: [
        { face: "ladder", slider: "shown" },
        { face: "tiles", slider: "typing", icons: { "only the sent text": "✉️", "typing dots": "💬", "typed and deleted": "⌫" } },
        { face: "mixer", sliders: ["count", "reply"] },
      ],
      groups: [
        { label: "On the screen", sliders: ["shown", "style"] },
        { label: "The writing", sliders: ["typing", "count"] },
        { label: "The wait", sliders: ["reply"] },
      ],
      presets: [
        { label: "Detective's floating texts", plain: "Messages float near the face in plain white text.", set: { shown: "floats near the face", typing: "only the sent text", count: 3, style: "plain text", reply: 1 } },
        { label: "Typed, deleted, 'ok'", plain: "We see the phone, watch 'I love you' get deleted, then wait.", set: { shown: "we see the phone screen", typing: "typed and deleted", count: 1, style: "phone bubbles", reply: 8 } },
        { label: "Group chat explodes", plain: "A dozen bubbles fill the frame, the replies come fast.", set: { shown: "fills the frame", typing: "typing dots", count: 12, style: "phone bubbles", reply: 0 } },
      ],
    },
  });

  W.add("nameCard", {
    window: {
      faces: [
        { face: "ladder", slider: "cheek" },
        { face: "tiles", slider: "freeze", icons: { "keeps playing": "▶️", slows: "🐢", freezes: "⏸️" } },
        { face: "mixer", sliders: ["howMany", "onScreen"] },
      ],
      groups: [
        { label: "The card", sliders: ["cheek", "style"] },
        { label: "The picture", sliders: ["freeze", "onScreen"] },
        { label: "Who gets one", sliders: ["howMany"] },
      ],
      presets: [
        { label: "Heist gang", plain: "Each of six crew members freezes with a joke label.", set: { cheek: "name and a joke", freeze: "freezes", style: "bold and big", howMany: 6, onScreen: 2 } },
        { label: "Documentary style", plain: "Name and job, plain type, the picture keeps playing.", set: { cheek: "name and job", freeze: "keeps playing", style: "plain type", howMany: 4, onScreen: 3 } },
        { label: "Police file", plain: "The villain freezes and a whole list of crimes pops up on an ID card.", set: { cheek: "a whole list", freeze: "freezes", style: "like an ID card", howMany: 1, onScreen: 5 } },
      ],
    },
  });

  W.add("titleDrop", {
    window: {
      faces: [
        { face: "dial", slider: "lateness" },
        { face: "tiles", slider: "landing", icons: { "a quiet image": "🌅", "a shock": "😱", "a music hit": "🥁", "a line of dialogue": "💬" } },
        { face: "ladder", slider: "arrives" },
      ],
      groups: [
        { label: "When", sliders: ["lateness", "landing"] },
        { label: "How it looks", sliders: ["size", "arrives"] },
        { label: "In the story", sliders: ["spoken"] },
      ],
      presets: [
        { label: "Right at the start", plain: "The title is there in the first minute, small and quiet.", set: { lateness: 0, landing: "a quiet image", size: "small and quiet", arrives: "fades up", spoken: "never" } },
        { label: "After the cold open", plain: "Ten minutes in, on a music hit, the title slams in huge.", set: { lateness: 10, landing: "a music hit", size: "huge and loud", arrives: "slams in", spoken: "never" } },
        { label: "Someone says it", plain: "A character says the film's name, and the title builds on screen.", set: { lateness: 20, landing: "a line of dialogue", size: "full screen", arrives: "builds letter by letter", spoken: "someone says it" } },
      ],
    },
  });

  /* ---------- Frame & canvas ---------- */

  W.add("frameInFrame", {
    window: {
      faces: [
        { face: "ladder", slider: "tightness" },
        { face: "tiles", slider: "framer", icons: { "a doorway": "🚪", "a window": "🪟", "a mirror": "🪞", "a car window": "🚗", "a gap between people": "👥" } },
        { face: "pad", x: "share", y: "layers", xLabel: "Size in the shot", yLabel: "Frames inside frames" },
      ],
      groups: [
        { label: "The frame", sliders: ["tightness", "framer", "layers"] },
        { label: "In the shot", sliders: ["share"] },
        { label: "Who watches", sliders: ["watcher"] },
      ],
      presets: [
        { label: "Shut out at the door", plain: "A small person boxed in by a doorway at the back of the shot.", set: { tightness: "boxed in", framer: "a doorway", layers: 2, share: 20, watcher: "us" } },
        { label: "Through the car window", plain: "Seen through a car window by someone inside.", set: { tightness: "clearly framed", framer: "a car window", layers: 1, share: 50, watcher: "someone in the story" } },
        { label: "Mirrors in mirrors", plain: "Trapped inside frames inside frames.", set: { tightness: "trapped", framer: "a mirror", layers: 4, share: 30, watcher: "nobody" } },
      ],
    },
  });

  W.add("screenLook", {
    window: {
      faces: [
        { face: "dial", slider: "realness" },
        { face: "tiles", slider: "source", icons: { "security camera": "📹", "phone video": "📱", "video call": "💻", "news report": "📺", "old home video": "📼" } },
        { face: "ladder", slider: "quality" },
      ],
      groups: [
        { label: "The screen", sliders: ["realness", "source"] },
        { label: "How it looks", sliders: ["marks", "quality"] },
        { label: "How much of the film", sliders: ["share"] },
      ],
      presets: [
        { label: "Caught on camera", plain: "Grainy security footage with a ticking time stamp.", set: { realness: 5, source: "security camera", marks: "a time stamp", quality: "grainy", share: 10 } },
        { label: "Whole film on a laptop", plain: "Every scene is a video call, with all its buttons.", set: { realness: 4, source: "video call", marks: "full buttons and labels", quality: "a bit soft", share: 100 } },
        { label: "Old family tape", plain: "A soft, breaking-up home video for the memories.", set: { realness: 3, source: "old home video", marks: "a red record dot", quality: "breaking up", share: 20 } },
      ],
    },
  });

  W.add("frameBreak", {
    window: {
      faces: [
        { face: "dial", slider: "bigness" },
        { face: "tiles", slider: "what", icons: { "a hand": "✊", "an object": "⚽", "a whole person": "🏃", words: "🔤", "the frame cracks": "💥" } },
        { face: "tiles", slider: "edge", icons: { top: "⬆️", bottom: "⬇️", side: "➡️", "toward us": "🫵" } },
        { face: "ladder", slider: "bars" },
      ],
      groups: [
        { label: "The break", sliders: ["bigness", "what", "edge"] },
        { label: "The frame", sliders: ["bars"] },
        { label: "How often", sliders: ["howOften"] },
      ],
      presets: [
        { label: "Fist through the bar", plain: "A fist punches up through a thick black bar, once.", set: { bigness: 3, what: "a hand", edge: "top", howOften: "once", bars: "thick bars" } },
        { label: "Ball at the camera", plain: "A ball flies out toward us at every big moment.", set: { bigness: 4, what: "an object", edge: "toward us", howOften: "at big moments", bars: "none" } },
        { label: "The picture shatters", plain: "The whole frame cracks at the climax.", set: { bigness: 5, what: "the frame cracks", edge: "side", howOften: "once", bars: "thin bars" } },
      ],
    },
  });

  W.add("irisShot", {
    window: {
      faces: [
        { face: "ladder", slider: "size" },
        { face: "tiles", slider: "way", icons: { "closes in": "⏺️", "opens out": "⭕", "closes, then opens": "🔁" } },
        { face: "mixer", sliders: ["softness", "speed"] },
      ],
      groups: [
        { label: "The circle", sliders: ["size", "way", "softness"] },
        { label: "Timing", sliders: ["speed"] },
        { label: "What it lands on", sliders: ["target"] },
      ],
      presets: [
        { label: "Silent film ending", plain: "A sharp circle closes to a pinhole on the hero's face.", set: { size: "a pinhole", way: "closes in", softness: 0, speed: 2, target: "a face" } },
        { label: "Cartoon goodbye", plain: "The circle closes, then pops open again for one last joke.", set: { size: "small", way: "closes, then opens", softness: 10, speed: 1.5, target: "off to one side" } },
        { label: "Soft opening", plain: "A soft circle opens slowly from a small detail.", set: { size: "half", way: "opens out", softness: 80, speed: 4, target: "a small detail" } },
      ],
    },
  });

  /* ---------- Color ---------- */

  W.add("characterColor", {
    window: {
      faces: [
        { face: "dial", slider: "strength" },
        { face: "ladder", slider: "reach" },
        { face: "tiles", slider: "spreads", icons: { "stays theirs": "🔒", "rubs off on a friend": "🤝", "takes over the scene": "🌊", "fades away": "🌫️" } },
        { face: "balance", slider: "meet", left: "blend", right: "fight" },
      ],
      groups: [
        { label: "The color tie", sliders: ["strength", "reach", "howMany"] },
        { label: "Over the film", sliders: ["spreads"] },
        { label: "When they meet", sliders: ["meet"] },
      ],
      presets: [
        { label: "Two rivals", plain: "Blue against orange, the colors fight in every shared shot.", set: { strength: 5, reach: "their room", howMany: 2, spreads: "stays theirs", meet: "fight" } },
        { label: "Friendship spreads", plain: "One person's yellow slowly rubs off on the friend.", set: { strength: 3, reach: "clothes and things", howMany: 2, spreads: "rubs off on a friend", meet: "blend" } },
        { label: "A fading person", plain: "Their color drains from everything around them.", set: { strength: 4, reach: "everything around them", howMany: 1, spreads: "fades away", meet: "sit side by side" } },
      ],
    },
  });

  W.add("colorArc", {
    window: {
      faces: [
        { face: "dial", slider: "distance" },
        { face: "tiles", slider: "path", icons: { "grey to color": "🌈", "color to grey": "🌫️", "warm to cold": "🧊", "cold to warm": "🔥", "there and back": "🔁" } },
        { face: "ladder", slider: "shape" },
      ],
      groups: [
        { label: "The journey", sliders: ["distance", "path", "shape"] },
        { label: "Who notices", sliders: ["noticed"] },
        { label: "What it tracks", sliders: ["follows"] },
      ],
      presets: [
        { label: "Grey life, then love", plain: "Washed out grey until the turning point, then full color.", set: { distance: 5, path: "grey to color", shape: "all at the turning point", noticed: "clearly", follows: "a relationship" } },
        { label: "Summer to winter", plain: "A slow, even slide from warm to cold with the seasons.", set: { distance: 3, path: "warm to cold", shape: "slow and even", noticed: "if they look", follows: "the seasons" } },
        { label: "Darkness creeps in", plain: "Color drains in steps as the danger grows.", set: { distance: 4, path: "color to grey", shape: "in steps", noticed: "only in the gut", follows: "the danger" } },
      ],
    },
  });

  W.add("worldColors", {
    window: {
      faces: [
        { face: "dial", slider: "difference" },
        { face: "tiles", slider: "splitBy", icons: { places: "🗺️", times: "🕰️", storylines: "🧵", "dreams and real life": "💭" } },
        { face: "ladder", slider: "crossings" },
      ],
      groups: [
        { label: "The looks", sliders: ["difference", "worlds", "madeBy"] },
        { label: "What they split", sliders: ["splitBy"] },
        { label: "Leaks", sliders: ["crossings"] },
      ],
      presets: [
        { label: "Golden past, blue now", plain: "Two times, very different, and one gold light leaks into the present.", set: { difference: 5, splitBy: "times", worlds: 2, crossings: "once at the key moment", madeBy: "color fixing in the edit" } },
        { label: "Three cities, three colors", plain: "Each city its own look, made with light, the colors start to mix.", set: { difference: 4, splitBy: "places", worlds: 3, crossings: "more and more", madeBy: "light" } },
        { label: "Dream versus waking", plain: "Dreams painted in the set and clothes, never leaking.", set: { difference: 3, splitBy: "dreams and real life", worlds: 2, crossings: "never", madeBy: "the set and clothes" } },
      ],
    },
  });

  W.add("warningColor", {
    window: {
      faces: [
        { face: "dial", slider: "dread" },
        { face: "swatches", slider: "hue", colors: { red: "#d33a2c", green: "#3f9e5a", yellow: "#e8c33a", blue: "#3a6fd3", purple: "#8b4fc2" } },
        { face: "ladder", slider: "hidden" },
      ],
      groups: [
        { label: "The warning", sliders: ["dread", "hue", "warnsOf"] },
        { label: "How it appears", sliders: ["times", "hidden"] },
      ],
      presets: [
        { label: "Red before a death", plain: "Red appears in plain view before each death, many times.", set: { dread: 5, hue: "red", times: 10, hidden: "in plain view", warnsOf: "a death" } },
        { label: "Green means a lie", plain: "A little green in the corner whenever someone lies.", set: { dread: 3, hue: "green", times: 6, hidden: "in a corner", warnsOf: "a lie" } },
        { label: "Purple ghost", plain: "A hard-to-spot purple before the strange things happen.", set: { dread: 4, hue: "purple", times: 4, hidden: "easy to miss", warnsOf: "a ghost or something strange" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
