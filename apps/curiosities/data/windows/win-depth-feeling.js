/* win for the feeling-over-time curiosities in data/db-depth-feeling.js (depth thread, feeling). Each one already
   has six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  /* ---------- after the blow ---------- */

  W.add("shockNumb", {
    window: {
      faces: [
        { face: "dial", slider: "numb" },
        { face: "tiles", slider: "doing", icons: { "stand frozen": "🧍", "keep doing a chore": "🧽", "say something calm": "💬", "laugh oddly": "😶", "walk away": "🚶" } },
        { face: "ladder", slider: "sound" },
      ],
      groups: [
        { label: "The shock", sliders: ["numb", "shock", "lasts"] },
        { label: "Inside the numbness", sliders: ["sound", "doing"] },
        { label: "Coming back", sliders: ["breaks"] },
      ],
      presets: [
        { label: "The parking question", plain: "After the doctor's news she calmly asks where she parked, and the room goes muffled.", set: { numb: 4, shock: "bad news", lasts: "the rest of the scene", sound: "goes muffled", doing: "say something calm", breaks: "nothing yet" } },
        { label: "After the crash", plain: "He stands frozen in a high ringing until a stranger touches his arm.", set: { numb: 5, shock: "an accident", lasts: "a few seconds", sound: "a high ringing", doing: "stand frozen", breaks: "a touch" } },
        { label: "Months of nothing", plain: "She keeps doing the dishes for weeks, numb, until she finds his glasses.", set: { numb: 3, shock: "a death", lasts: "most of the film", sound: "stays normal", doing: "keep doing a chore", breaks: "a small object" } },
      ],
    },
  });

  W.add("delayedReaction", {
    window: {
      faces: [
        { face: "dial", slider: "delay" },
        { face: "tiles", slider: "where", icons: { "in the car": "🚗", "in the shower": "🚿", "at the shops": "🛒", "at work": "💼", "in bed": "🛏️" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "How late", sliders: ["delay", "gap"] },
        { label: "Where and why", sliders: ["where", "trigger"] },
        { label: "When it comes", sliders: ["size", "seen"] },
      ],
      presets: [
        { label: "In the car", plain: "Dry-eyed at the funeral, then sobbing alone in the car hours later.", set: { delay: 3, gap: "hours", where: "in the car", trigger: "nothing at all", size: "sobbing", seen: "nobody" } },
        { label: "The bread aisle", plain: "Days later the shop is out of her favorite bread, and he breaks in front of a stranger.", set: { delay: 4, gap: "days", where: "at the shops", trigger: "a small object", size: "quiet crying", seen: "a stranger" } },
        { label: "The song", plain: "Weeks later a song in the shower, a single tear.", set: { delay: 5, gap: "weeks", where: "in the shower", trigger: "a song", size: "a single tear", seen: "nobody" } },
      ],
    },
  });

  W.add("displacedFeeling", {
    window: {
      faces: [
        { face: "dial", slider: "misplaced" },
        { face: "tiles", slider: "target", icons: { "an object": "🚪", "a stranger": "🧑", "a pet": "🐕", "a friend": "🫂", themselves: "🪞" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "The feeling", sliders: ["misplaced", "feeling", "why"] },
        { label: "Where it lands", sliders: ["target", "size"] },
        { label: "Seeing it", sliders: ["realize"] },
      ],
      presets: [
        { label: "Yelling at the washer", plain: "He can't answer his boss, so he shouts at the washing machine.", set: { misplaced: 5, feeling: "anger", target: "an object", why: "the person is too powerful", size: "a shout", realize: "later" } },
        { label: "Snapping at a friend", plain: "Scared for her mother, she snaps at her best friend and sees it right away.", set: { misplaced: 3, feeling: "fear", target: "a friend", why: "they love the person", size: "a muttered word", realize: "right away" } },
        { label: "The broken plate", plain: "Ashamed and unwilling to say so, he smashes a plate and never sees why.", set: { misplaced: 4, feeling: "shame", target: "an object", why: "they won't admit it", size: "something breaks", realize: "never" } },
      ],
    },
  });

  W.add("keepsake", {
    window: {
      faces: [
        { face: "dial", slider: "charge" },
        { face: "tiles", slider: "thing", icons: { "a piece of clothing": "🧥", "a watch": "⌚", "a letter": "✉️", "a photo": "🖼️", "a toy": "🧸", "a song on a tape": "📼" } },
        { face: "ladder", slider: "handling" },
      ],
      groups: [
        { label: "The thing", sliders: ["charge", "thing", "standsFor"] },
        { label: "How they treat it", sliders: ["handling", "seen"] },
        { label: "Letting go", sliders: ["fate"] },
      ],
      presets: [
        { label: "Her brother's jacket", plain: "She wears it every day and gives it away in the last scene.", set: { charge: 5, thing: "a piece of clothing", standsFor: "someone gone", handling: "use it every day", fate: "given away", seen: 6 } },
        { label: "The hidden letter", plain: "A letter she can't bear to open, hidden in a drawer, burned at the end.", set: { charge: 4, thing: "a letter", standsFor: "a mistake", handling: "hide it away", fate: "destroyed", seen: 3 } },
        { label: "Dad's watch", plain: "He touches the watch in secret before every hard moment.", set: { charge: 3, thing: "a watch", standsFor: "a promise", handling: "touch it in secret", fate: "kept", seen: 5 } },
      ],
    },
  });

  /* ---------- holding the big feeling ---------- */

  W.add("bigFeelingSmall", {
    window: {
      faces: [
        { face: "dial", slider: "restraint" },
        { face: "tiles", slider: "form", icons: { "a whisper": "🤫", "a long look": "👀", "a single touch": "🤚", "a tiny nod": "🙂", "a turn away": "↩️" } },
        { face: "pad", x: "quietBefore", y: "restraint", xLabel: "Quiet before it", yLabel: "How small it is played" },
      ],
      groups: [
        { label: "The moment", sliders: ["restraint", "bigness", "form"] },
        { label: "Around it", sliders: ["quietBefore", "music"] },
        { label: "Saved for", sliders: ["savedFor"] },
      ],
      presets: [
        { label: "You got tall", plain: "Ten years apart, and all the father says is one small line, no music.", set: { restraint: 5, bigness: "life changing", form: "a long look", quietBefore: 6, music: "none at all", savedFor: "the whole film" } },
        { label: "The nod", plain: "A proud mother gives one tiny nod as the music goes soft.", set: { restraint: 4, bigness: "huge", form: "a tiny nod", quietBefore: 3, music: "soft", savedFor: "half the film" } },
        { label: "Played big", plain: "The feeling is played as big as it is, with a full swell.", set: { restraint: 0, bigness: "strong", form: "a single touch", quietBefore: 0, music: "full swell", savedFor: "one scene" } },
      ],
    },
  });

  W.add("slowBurn", {
    window: {
      faces: [
        { face: "dial", slider: "growth" },
        { face: "tiles", slider: "feeling", icons: { love: "❤️", trust: "🤝", fear: "😨", anger: "😠", friendship: "🫂" } },
        { face: "ladder", slider: "admitted" },
      ],
      groups: [
        { label: "The growth", sliders: ["growth", "feeling", "steps"] },
        { label: "Along the way", sliders: ["firstSign", "setback"] },
        { label: "Saying it", sliders: ["admitted"] },
      ],
      presets: [
        { label: "Rivals to lovers", plain: "A look held too long, a joke in every scene, and the words saved for the end.", set: { growth: 5, feeling: "love", steps: 12, setback: "a few", admitted: "near the end", firstSign: "a look held too long" } },
        { label: "Slow trust", plain: "A small favor starts it, and trust grows over a few scenes.", set: { growth: 3, feeling: "trust", steps: 6, setback: "one", admitted: "in the middle", firstSign: "a small favor" } },
        { label: "Fear that creeps", plain: "A worried glance becomes a fear nobody ever names.", set: { growth: 4, feeling: "fear", steps: 15, setback: "none", admitted: "never", firstSign: "a worried glance" } },
      ],
    },
  });

  W.add("comeDown", {
    window: {
      faces: [
        { face: "dial", slider: "drop" },
        { face: "tiles", slider: "sign", icons: { "the empty room": "🪑", "the mess left behind": "🎉", "silence after the music": "🔇", "being alone again": "🧍" } },
        { face: "ladder", slider: "speed" },
      ],
      groups: [
        { label: "The fall", sliders: ["drop", "after", "speed"] },
        { label: "What remains", sliders: ["leftover", "sign"] },
        { label: "Who is there", sliders: ["alone"] },
      ],
      presets: [
        { label: "Empty hall", plain: "After the big show, the singer sits alone as the cleaner sweeps.", set: { drop: 4, after: "a win", speed: "over a night", leftover: "emptiness", sign: "the empty room", alone: "alone" } },
        { label: "Morning after", plain: "The party mess in the morning light, two friends, a warm glow.", set: { drop: 1, after: "a party", speed: "slowly over days", leftover: "a warm glow", sign: "the mess left behind", alone: "just one other" } },
        { label: "The music stops", plain: "The music cuts and the joy falls away all at once into dread.", set: { drop: 5, after: "a reunion", speed: "all at once", leftover: "dread", sign: "silence after the music", alone: "a few" } },
      ],
    },
  });

  /* ---------- between people ---------- */

  W.add("moodOutOfStep", {
    window: {
      faces: [
        { face: "dial", slider: "offStep" },
        { face: "tiles", slider: "roomMood", icons: { joy: "🎉", calm: "😌", panic: "😱", grief: "🖤", excitement: "🤩" } },
        { face: "ladder", slider: "noticedBy" },
      ],
      groups: [
        { label: "The gap", sliders: ["offStep", "roomMood", "theirMood"] },
        { label: "Who sees it", sliders: ["hides", "noticedBy"] },
        { label: "How it ends", sliders: ["ends"] },
      ],
      presets: [
        { label: "Sad at the party", plain: "One guest isn't smiling at the birthday party, and only the host notices.", set: { offStep: 4, roomMood: "joy", theirMood: "sadness", hides: "tries to fit in", noticedBy: "one person", ends: "they leave" } },
        { label: "Calm in the panic", plain: "Everyone panics; she is calm, and the room slowly catches it.", set: { offStep: 5, roomMood: "panic", theirMood: "calm", hides: "shows it plainly", noticedBy: "the whole room", ends: "the room catches it" } },
        { label: "Smiling at the funeral", plain: "He hides a strange joy at the funeral, and nobody sees.", set: { offStep: 3, roomMood: "grief", theirMood: "joy", hides: "hides it well", noticedBy: "no one", ends: "it never ends" } },
      ],
    },
  });

  W.add("emotionSeesaw", {
    window: {
      faces: [
        { face: "dial", slider: "swap" },
        { face: "tiles", slider: "trigger", icons: { "a confession": "🗣️", "bad news": "📞", "a joke": "😂", "a touch": "🤚", "a mistake": "💥" } },
        { face: "ladder", slider: "when" },
      ],
      groups: [
        { label: "The swap", sliders: ["swap", "what", "times"] },
        { label: "The tipping point", sliders: ["when", "trigger"] },
        { label: "Seeing it", sliders: ["aware"] },
      ],
      presets: [
        { label: "Waiting room", plain: "The panicking daughter ends up holding her scared father's hand.", set: { swap: 5, what: "strength and fear", when: "the middle", trigger: "a confession", times: 1, aware: "neither" } },
        { label: "Back and forth", plain: "Two friends trade hope and doubt three times in one argument.", set: { swap: 3, what: "hope and doubt", when: "early", trigger: "bad news", times: 3, aware: "one" } },
        { label: "Who's sorry now", plain: "Anger turns to guilt after a mistake, and they both say it.", set: { swap: 4, what: "anger and guilt", when: "near the end", trigger: "a mistake", times: 1, aware: "both say it" } },
      ],
    },
  });

  W.add("comfortOffered", {
    window: {
      faces: [
        { face: "dial", slider: "taken" },
        { face: "tiles", slider: "way", icons: { words: "💬", "a hand on the arm": "🤚", "a hug": "🫂", "sitting close in silence": "🪑", "making food": "🍲" } },
        { face: "ladder", slider: "first" },
      ],
      groups: [
        { label: "The offer", sliders: ["taken", "way", "giver"] },
        { label: "The first second", sliders: ["timing", "first"] },
        { label: "After", sliders: ["after"] },
      ],
      presets: [
        { label: "On the stairs", plain: "Her brother sits beside her in silence, and she slowly leans back on him.", set: { taken: 5, way: "sitting close in silence", giver: "family", timing: "at the right time", first: "leans in", after: "talking at last" } },
        { label: "Too soon", plain: "A friend's hug comes too early and she pulls away.", set: { taken: 0, way: "a hug", giver: "a friend", timing: "too early", first: "pulls away", after: "a fight" } },
        { label: "Soup from an enemy", plain: "The old rival brings soup; he freezes, then takes it.", set: { taken: 3, way: "making food", giver: "an enemy", timing: "too late", first: "freezes", after: "a laugh" } },
      ],
    },
  });

  W.add("unspokenFeeling", {
    window: {
      faces: [
        { face: "dial", slider: "unsaid" },
        { face: "tiles", slider: "signs", icons: { "a changed subject": "🔀", "a closed door": "🚪", "an empty chair": "🪑", "a look away": "👀", "too much small talk": "💬" } },
        { face: "ladder", slider: "howMany" },
      ],
      groups: [
        { label: "The silence", sliders: ["unsaid", "about", "howMany"] },
        { label: "How it shows", sliders: ["signs", "scenes"] },
        { label: "Breaking it", sliders: ["said"] },
      ],
      presets: [
        { label: "Pass the potatoes", plain: "Every family dinner swerves away from the dead brother, until a child asks.", set: { unsaid: 5, about: "a death", howMany: "the family", signs: "a changed subject", scenes: 12, said: "by a child" } },
        { label: "The coming divorce", plain: "Two parents talk too much about nothing, and it finally comes out in a shout.", set: { unsaid: 4, about: "a betrayal", howMany: "two people", signs: "too much small talk", scenes: 6, said: "in a shout" } },
        { label: "The town's secret", plain: "The whole town looks away, and an outsider says it out loud.", set: { unsaid: 3, about: "money trouble", howMany: "the whole town", signs: "a look away", scenes: 20, said: "by an outsider" } },
      ],
    },
  });

  /* ---------- the body and the camera ---------- */

  W.add("bracing", {
    window: {
      faces: [
        { face: "dial", slider: "brace" },
        { face: "tiles", slider: "how", icons: { "a deep breath": "😮‍💨", "fixing their clothes": "👔", "practicing the words": "🗣️", "a long look in the mirror": "🪞", "a drink": "🥃" } },
        { face: "ladder", slider: "ready" },
      ],
      groups: [
        { label: "Getting ready", sliders: ["brace", "how", "length"] },
        { label: "What's ahead", sliders: ["facing", "seen"] },
        { label: "Did it hold", sliders: ["ready"] },
      ],
      presets: [
        { label: "At her door", plain: "He breathes, fixes his collar, nearly leaves, then knocks.", set: { brace: 4, how: "fixing their clothes", length: 15, facing: "an old love", ready: "holds up", seen: "no one" } },
        { label: "The mirror", plain: "She practices the confession in the mirror, then falls apart when it comes.", set: { brace: 5, how: "a long look in the mirror", length: 25, facing: "a confession", ready: "falls apart", seen: "a friend" } },
        { label: "Straight in", plain: "One quick breath and in she goes to face the crowd.", set: { brace: 1, how: "a deep breath", length: 2, facing: "a crowd", ready: "fully ready", seen: "the other person" } },
      ],
    },
  });

  W.add("reactionHolder", {
    window: {
      faces: [
        { face: "dial", slider: "away" },
        { face: "tiles", slider: "who", icons: { "the one it happens to": "🎯", "their partner": "💑", "a parent": "👨‍👦", "a friend": "🫂", "a child": "🧒", "a stranger": "🧑" } },
        { face: "ladder", slider: "size" },
      ],
      groups: [
        { label: "Whose face", sliders: ["away", "who", "shows"] },
        { label: "The shot", sliders: ["hold", "size"] },
        { label: "The event", sliders: ["event"] },
      ],
      presets: [
        { label: "Dad in the stands", plain: "We only hear the goal and stay on his father's proud face.", set: { away: 4, who: "a parent", hold: 4, size: "the face", event: "we only hear it", shows: "pride" } },
        { label: "The child's eyes", plain: "The crash is seen only in a child's wide eyes.", set: { away: 5, who: "a child", hold: 3, size: "just the eyes", event: "we only see the face", shows: "horror" } },
        { label: "Straight on", plain: "We see the event and stay on the one it happens to.", set: { away: 0, who: "the one it happens to", hold: 1.5, size: "the whole body", event: "we see it", shows: "nothing yet" } },
      ],
    },
  });

  W.add("keepingBusy", {
    window: {
      faces: [
        { face: "dial", slider: "busy" },
        { face: "tiles", slider: "task", icons: { cleaning: "🧽", cooking: "🍳", work: "💼", "fixing things": "🔧", exercise: "🏃", planning: "📋" } },
        { face: "ladder", slider: "pace" },
      ],
      groups: [
        { label: "The task", sliders: ["busy", "task", "pace"] },
        { label: "How long", sliders: ["scenes", "stops"] },
        { label: "The crack", sliders: ["cracks"] },
      ],
      presets: [
        { label: "Scrubbing the floor", plain: "After the funeral she scrubs until her sister takes the brush.", set: { busy: 5, task: "cleaning", pace: "frantic", stops: "someone stops their hands", scenes: 3, cracks: "fully" } },
        { label: "Working all night", plain: "He works for weeks, steady, and it never cracks.", set: { busy: 4, task: "work", pace: "brisk", stops: "nothing", scenes: 8, cracks: "never" } },
        { label: "Fixing the car", plain: "He fixes a car that isn't broken until a part snaps.", set: { busy: 3, task: "fixing things", pace: "calm", stops: "they break something", scenes: 2, cracks: "for a moment" } },
      ],
    },
  });

  W.add("unseenCare", {
    window: {
      faces: [
        { face: "dial", slider: "care" },
        { face: "tiles", slider: "act", icons: { "leave food": "🍲", "pay a debt": "💵", "take the blame": "🙋", "fix something": "🔧", "keep a secret": "🤐" } },
        { face: "ladder", slider: "cost" },
      ],
      groups: [
        { label: "The hidden act", sliders: ["care", "act", "forWhom"] },
        { label: "How often, how costly", sliders: ["times", "cost"] },
        { label: "Found out", sliders: ["found"] },
      ],
      presets: [
        { label: "The snowy path", plain: "The grumpy neighbor shovels the widow's path every morning, never seen.", set: { care: 2, act: "fix something", forWhom: "a stranger", found: "never", times: 6, cost: "time" } },
        { label: "Taking the blame", plain: "The brother takes the blame and loses everything; she learns too late.", set: { care: 5, act: "take the blame", forWhom: "a child", found: "too late", times: 1, cost: "everything" } },
        { label: "The paid debt", plain: "Dad pays the debt in secret, found out at the end.", set: { care: 4, act: "pay a debt", forWhom: "a child", found: "at the end", times: 2, cost: "money" } },
      ],
    },
  });

  W.add("emptyPlace", {
    window: {
      faces: [
        { face: "dial", slider: "absence" },
        { face: "tiles", slider: "place", icons: { "a chair": "🪑", "a bed": "🛏️", "a coat hook": "🧥", "a seat in the car": "🚗", "a pair of shoes": "👞" } },
        { face: "tiles", slider: "habit", icons: { none: "▫️", "an extra plate set": "🍽️", "their cup poured": "☕", "a call to their phone": "📞" } },
      ],
      groups: [
        { label: "The empty place", sliders: ["absence", "place", "gone"] },
        { label: "Remembering", sliders: ["habit", "shown"] },
        { label: "Filled again", sliders: ["filled"] },
      ],
      presets: [
        { label: "Four plates", plain: "Four plates for three people every night, until the last night.", set: { absence: 5, place: "a chair", gone: "they died", habit: "an extra plate set", shown: 6, filled: "never" } },
        { label: "Away at war", plain: "His coat on the hook, and at the end, him, back again.", set: { absence: 3, place: "a coat hook", gone: "they are away", habit: "none", shown: 4, filled: "by them, back again" } },
        { label: "New family", plain: "Her cup still poured each morning until a new child takes the seat.", set: { absence: 4, place: "a seat in the car", gone: "they left", habit: "their cup poured", shown: 5, filled: "by someone new" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
