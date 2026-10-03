/* win for the music and audio-mix curiosities in data/db-depth-sound.js (depth thread, sound). Each one already has
   six graded settings of its own, so these windows add faces, groups and presets only. */
(function (W) {
  W.add("tempoShift", {
    window: {
      faces: [
        { face: "ladder", slider: "shift" },
        { face: "dial", slider: "startBpm" },
        { face: "tiles", slider: "tiedTo", icons: { nothing: "🎵", "a heartbeat": "❤️", footsteps: "👣", "a clock": "⏰", "the chase": "🏃" } },
      ],
      groups: [
        { label: "The speed", sliders: ["shift", "startBpm", "howQuick"] },
        { label: "Its feel", sliders: ["feel", "tiedTo"] },
        { label: "How it ends", sliders: ["landing"] },
      ],
      presets: [
        { label: "Chase that gets faster", plain: "Starts at a jog and races, shot by shot, until it stops dead at the catch.", set: { shift: "speeds a lot", startBpm: 110, howQuick: "over the whole scene", tiedTo: "the chase", feel: "stiff and even", landing: "stops dead" } },
        { label: "Heart slowing down", plain: "A fast pulse that slows to calm after the danger passes.", set: { shift: "slows a lot", startBpm: 140, howQuick: "over a minute", tiedTo: "a heartbeat", landing: "drops back to normal" } },
        { label: "Jazz picking up", plain: "A loose, swinging beat that warms up a little as the party gets going.", set: { shift: "speeds a little", startBpm: 90, feel: "loose and swinging", tiedTo: "nothing", landing: "holds the new speed" } },
      ],
    },
  });

  W.add("keyShift", {
    window: {
      faces: [
        { face: "balance", slider: "direction", left: "Darker", right: "Brighter" },
        { face: "tiles", slider: "trigger", icons: { "a line": "💬", "a look": "👀", "a touch": "🤝", "a reveal": "🎭", "nothing we see": "🌫️" } },
        { face: "dial", slider: "climb" },
      ],
      groups: [
        { label: "The turn", sliders: ["direction", "suddenness", "trigger"] },
        { label: "The tune", sliders: ["sameTune", "climb"] },
        { label: "How it ends", sliders: ["settled"] },
      ],
      presets: [
        { label: "Sunrise after the storm", plain: "The sad tune turns bright on a touch, climbs twice and settles fully.", set: { direction: "dark turns bright", trigger: "a touch", suddenness: "over a few seconds", sameTune: "the same tune, new color", climb: 2, settled: "fully settled" } },
        { label: "The letter", plain: "The love theme turns dark on one note when the truth is read.", set: { direction: "bright turns dark", trigger: "a reveal", suddenness: "on one note", sameTune: "the same tune, new color", climb: 0, settled: "left hanging" } },
        { label: "Last chorus lift", plain: "No change of mood, but the song steps up higher for the finale.", set: { direction: "no turn", climb: 3, suddenness: "on the cut", sameTune: "the same tune, new color", settled: "fully settled" } },
      ],
    },
  });

  W.add("leadInstrument", {
    window: {
      faces: [
        { face: "tiles", slider: "instrument", icons: { piano: "🎹", strings: "🎻", brass: "🎺", guitar: "🎸", woodwind: "🪈", synthesizer: "🎛️", voice: "🎤", drums: "🥁" } },
        { face: "dial", slider: "prominence" },
        { face: "ladder", slider: "register" },
      ],
      groups: [
        { label: "The instrument", sliders: ["instrument", "prominence", "register"] },
        { label: "How it is played", sliders: ["touch", "closeness"] },
        { label: "Alone or joined", sliders: ["solo"] },
      ],
      presets: [
        { label: "Lonely piano", plain: "One piano, played gently, close enough to hear the keys, nobody joining.", set: { instrument: "piano", prominence: 4, touch: "gentle", closeness: "right in your ear", solo: "alone", register: "middle" } },
        { label: "Brass fanfare", plain: "Big brass out front, played firmly, joined by the orchestra.", set: { instrument: "brass", prominence: 5, touch: "firm", closeness: "near", solo: "with others throughout", register: "high" } },
        { label: "Distant cello", plain: "Low strings, far off, barely touched.", set: { instrument: "strings", prominence: 2, touch: "barely touched", closeness: "far off", solo: "joined later", register: "low" } },
      ],
    },
  });

  W.add("musicStyle", {
    window: {
      faces: [
        { face: "tiles", slider: "style", icons: { orchestral: "🎻", jazz: "🎷", rock: "🎸", electronic: "🎛️", folk: "🪕", "hip hop": "🎧", pop: "🎤", "solo piano": "🎹", "music from one place on earth": "🌍" } },
        { face: "ladder", slider: "fit" },
        { face: "pad", x: "blendStyles", y: "catchy", xLabel: "More mixed styles", yLabel: "Catchier" },
      ],
      groups: [
        { label: "The style", sliders: ["style", "fit", "era"] },
        { label: "The sound", sliders: ["polish", "blendStyles", "catchy"] },
      ],
      presets: [
        { label: "Classic orchestra", plain: "A full orchestra, exactly what you'd expect, polished and timeless.", set: { style: "orchestral", fit: "exactly what you'd expect", era: "classic", polish: "glossy", blendStyles: 0, catchy: 2 } },
        { label: "Electronic western", plain: "A synth score in a cowboy story: clashing on purpose and very catchy.", set: { style: "electronic", fit: "clashes on purpose", era: "futuristic", polish: "clean", blendStyles: 3, catchy: 4 } },
        { label: "Garage band indie", plain: "Rough, homemade rock that fits the small town.", set: { style: "rock", fit: "fits", era: "current", polish: "homemade", blendStyles: 1, catchy: 3 } },
      ],
    },
  });

  W.add("sourceToScore", {
    window: {
      faces: [
        { face: "balance", slider: "crossing", left: "Into the room", right: "Into the soundtrack" },
        { face: "tiles", slider: "source", icons: { "a radio or speaker": "📻", "a phone or headphones": "🎧", "a live band": "🎸", "someone singing": "🎤", "a music box": "🎁" } },
        { face: "pad", x: "crossTime", y: "fullness", xLabel: "Slower crossing", yLabel: "Fuller sound" },
      ],
      groups: [
        { label: "The crossing", sliders: ["crossing", "crossTime", "fullness"] },
        { label: "In the story", sliders: ["source", "noticed", "backAgain"] },
      ],
      presets: [
        { label: "Car radio swells", plain: "A tinny radio song blooms into the full soundtrack as the car drives off.", set: { crossing: "from the room into the soundtrack", source: "a radio or speaker", crossTime: 6, fullness: 5, noticed: "nobody notices", backAgain: "no" } },
        { label: "It was on the record player", plain: "The soundtrack turns out to be playing in the room, and someone turns it off.", set: { crossing: "from the soundtrack into the room", source: "a radio or speaker", crossTime: 1, fullness: 1, noticed: "a character turns it off", backAgain: "no" } },
        { label: "Headphones in and out", plain: "We hear the song when the headphones are in, and the room when they are out.", set: { crossing: "from the room into the soundtrack", source: "a phone or headphones", crossTime: 0, fullness: 4, noticed: "a character notices", backAgain: "back and forth" } },
      ],
    },
  });

  W.add("characterTheme", {
    window: {
      faces: [
        { face: "tiles", slider: "version", icons: { tender: "🌷", sad: "😢", dark: "🌑", heroic: "🦸", playful: "🎈" } },
        { face: "dial", slider: "recognizable" },
        { face: "tiles", slider: "belongsTo", icons: { "the hero": "🦸", "the villain": "😈", "a couple": "💑", "a place": "🏠", "an object": "💍", "an idea": "💡" } },
      ],
      groups: [
        { label: "The tune", sliders: ["recognizable", "fragment", "version"] },
        { label: "Whose it is", sliders: ["belongsTo", "trigger"] },
        { label: "How often", sliders: ["returns"] },
      ],
      presets: [
        { label: "The villain approaches", plain: "Two dark notes before the villain walks in.", set: { belongsTo: "the villain", version: "dark", fragment: "two notes", trigger: "they are about to arrive", recognizable: 5, returns: 8 } },
        { label: "Hero's return", plain: "The whole hero tune, played heroic, when they finally appear.", set: { belongsTo: "the hero", version: "heroic", fragment: "the whole tune", trigger: "they appear", recognizable: 5, returns: 6 } },
        { label: "For the one who is gone", plain: "A piece of their tune, played sad, when they are missed.", set: { version: "sad", fragment: "a piece", trigger: "they are missed", recognizable: 3, returns: 3 } },
      ],
    },
  });

  W.add("humming", {
    window: {
      faces: [
        { face: "ladder", slider: "openness" },
        { face: "tiles", slider: "form", icons: { humming: "🎶", whistling: "😗", "singing words": "🎤", "singing along to a song": "📻" } },
        { face: "tiles", slider: "caught", icons: { alone: "🧍", overheard: "👂", "caught and stops": "😳", "others join in": "👯" } },
      ],
      groups: [
        { label: "The tune", sliders: ["openness", "form", "known"] },
        { label: "How it sounds", sliders: ["skill", "moodMatch"] },
        { label: "Who hears", sliders: ["caught"] },
      ],
      presets: [
        { label: "Killer's lullaby", plain: "A lullaby hummed under the breath that hides the opposite feeling.", set: { openness: "under the breath", form: "humming", known: "a lullaby or folk tune", skill: "decent", moodMatch: "hides the opposite", caught: "alone" } },
        { label: "Shower singer caught", plain: "Singing out loud and off-key until someone walks in.", set: { openness: "singing out loud", form: "singing along to a song", known: "a well-known song", skill: "off-key", caught: "caught and stops", moodMatch: "matches" } },
        { label: "Whistle that spreads", plain: "A quiet whistle the whole workshop picks up.", set: { openness: "quiet humming", form: "whistling", known: "the film's own theme", skill: "decent", caught: "others join in", moodMatch: "matches" } },
      ],
    },
  });

  W.add("onScreenPerformance", {
    window: {
      faces: [
        { face: "ladder", slider: "spotlight" },
        { face: "tiles", slider: "kind", icons: { "a gig or concert": "🎸", karaoke: "🎤", "a party": "🎉", "a school show": "🏫", "bursting into song": "🎶" } },
        { face: "dial", slider: "performers" },
      ],
      groups: [
        { label: "The performance", sliders: ["spotlight", "kind", "performers"] },
        { label: "How it goes", sliders: ["quality", "audience"] },
        { label: "The sound", sliders: ["liveSound"] },
      ],
      presets: [
        { label: "Brave karaoke", plain: "One shy person sings badly, and the crowd ends up into it.", set: { kind: "karaoke", spotlight: "takes over the scene", performers: 1, quality: "shaky", audience: "into it", liveSound: "rough live sound" } },
        { label: "Big musical number", plain: "The whole street bursts into song, polished like a record.", set: { kind: "bursting into song", spotlight: "the whole film stops", performers: 30, quality: "stunning", audience: "going wild", liveSound: "studio polished" } },
        { label: "Wedding band in the corner", plain: "A band plays in the background while the real scene happens.", set: { kind: "a party", spotlight: "in the background", performers: 4, quality: "good", audience: "ignores it", liveSound: "live but clean" } },
      ],
    },
  });

  W.add("tensionLoop", {
    window: {
      faces: [
        { face: "dial", slider: "insistence" },
        { face: "tiles", slider: "madeOf", icons: { "a few notes": "🎼", "a low pulse": "〰️", "a ticking": "⏱️", "a drum": "🥁", "a heartbeat": "❤️" } },
        { face: "ladder", slider: "grows" },
      ],
      groups: [
        { label: "The pattern", sliders: ["insistence", "madeOf", "pitch"] },
        { label: "How it builds", sliders: ["repeats", "grows"] },
        { label: "How it ends", sliders: ["breaks"] },
      ],
      presets: [
        { label: "Bomb on a timer", plain: "A ticking pattern that grows in every way and crashes into a hit.", set: { madeOf: "a ticking", insistence: 5, repeats: 48, grows: "all of these", pitch: "high", breaks: "crashes into a hit" } },
        { label: "Shark in the water", plain: "A low two-note pulse that gets faster, then stops dead.", set: { madeOf: "a low pulse", insistence: 4, repeats: 24, grows: "gets faster", pitch: "very low", breaks: "stops dead" } },
        { label: "Uneasy waiting room", plain: "A few quiet notes that never change and never end.", set: { madeOf: "a few notes", insistence: 2, repeats: 32, grows: "stays the same", pitch: "middle", breaks: "just keeps going" } },
      ],
    },
  });

  W.add("bigHit", {
    window: {
      faces: [
        { face: "dial", slider: "impact" },
        { face: "tiles", slider: "target", icons: { "a cut": "✂️", "an action": "👊", "a line": "💬", "a reveal": "🎭", "a title": "🔤" } },
        { face: "pad", x: "buildTime", y: "impact", xLabel: "Longer build", yLabel: "Bigger hit" },
      ],
      groups: [
        { label: "The build", sliders: ["buildTime", "fakeOuts"] },
        { label: "The hit", sliders: ["impact", "target", "accuracy"] },
        { label: "After", sliders: ["after"] },
      ],
      presets: [
        { label: "Title slam", plain: "A long build that slams onto the film's title, to the frame, then silence.", set: { target: "a title", impact: 5, buildTime: 30, accuracy: "to the frame", after: "silence", fakeOuts: 0 } },
        { label: "Punch on the beat", plain: "A short build and a hit right on the punch, then the music keeps going.", set: { target: "an action", impact: 4, buildTime: 5, accuracy: "on the moment", after: "it keeps going", fakeOuts: 0 } },
        { label: "Teased reveal", plain: "Two fake landings, then the real one on the reveal, held.", set: { target: "a reveal", impact: 5, buildTime: 20, accuracy: "on the moment", after: "it holds", fakeOuts: 2 } },
      ],
    },
  });

  W.add("clashingNotes", {
    window: {
      faces: [
        { face: "dial", slider: "clash" },
        { face: "ladder", slider: "resolves" },
        { face: "tiles", slider: "where", icons: { "deep and low": "🔻", "in the middle": "⏺️", "high and thin": "🔺", everywhere: "🌐" } },
      ],
      groups: [
        { label: "The clash", sliders: ["clash", "where", "grows"] },
        { label: "Settling", sliders: ["resolves", "sweetOnTop"] },
        { label: "When", sliders: ["timing"] },
      ],
      presets: [
        { label: "Haunted house", plain: "High, thin clashing that creeps up and never settles.", set: { clash: 5, where: "high and thin", grows: "creeps up", resolves: "never settles", sweetOnTop: "none", timing: "the whole scene" } },
        { label: "Something off at dinner", plain: "A sweet family tune with one low note rubbing under one line.", set: { clash: 2, where: "deep and low", grows: "holds", resolves: "settles soon", sweetOnTop: "clear", timing: "under one line" } },
        { label: "Calm and sweet", plain: "No clash at all, everything settled.", set: { clash: 0, where: "in the middle", grows: "fades", resolves: "always settled", sweetOnTop: "clear", timing: "the whole scene" } },
      ],
    },
  });

  W.add("warpedMusic", {
    window: {
      faces: [
        { face: "dial", slider: "warp" },
        { face: "tiles", slider: "damage", icons: { "slowed down": "🐢", "wobbling like old tape": "📼", "out of tune": "🎹", skipping: "💿", "winding down": "🎁", "played backwards": "⏪" } },
        { face: "pad", x: "speed", y: "crackle", xLabel: "Faster", yLabel: "More crackle" },
      ],
      groups: [
        { label: "The damage", sliders: ["warp", "damage", "speed", "crackle"] },
        { label: "What and why", sliders: ["source", "why"] },
      ],
      presets: [
        { label: "Music box winding down", plain: "A music box lullaby slowing and bending as something evil comes.", set: { source: "a music box", damage: "winding down", warp: 4, speed: -30, crackle: 1, why: "something evil" } },
        { label: "Old home movie", plain: "A pop song wobbling like old tape, with crackle, for a memory.", set: { source: "a pop song", damage: "wobbling like old tape", warp: 2, speed: -5, crackle: 4, why: "a memory" } },
        { label: "Fever dream", plain: "The film's theme, slowed right down, as someone loses their grip.", set: { source: "the film's theme", damage: "slowed down", warp: 5, speed: -50, crackle: 2, why: "someone losing their grip" } },
      ],
    },
  });

  W.add("musicSpotting", {
    window: {
      faces: [
        { face: "dial", slider: "share" },
        { face: "mixer", sliders: ["cues", "saved", "longestGap"] },
        { face: "tiles", slider: "spread", icons: { evenly: "▬", "in bursts": "▮▯▮", "building toward the end": "📈", "fading toward the end": "📉" } },
      ],
      groups: [
        { label: "How much", sliders: ["share", "cues", "longestGap"] },
        { label: "Where", sliders: ["firstIn", "spread", "saved"] },
      ],
      presets: [
        { label: "Wall to wall", plain: "Music nearly the whole film, from the first frame.", set: { share: 90, cues: 60, saved: 0, firstIn: "at the first frame", longestGap: 1, spread: "evenly" } },
        { label: "Held back for the end", plain: "Almost no music until the end, where it all arrives.", set: { share: 15, cues: 8, saved: 5, firstIn: "only near the end", longestGap: 25, spread: "building toward the end" } },
        { label: "Quiet drama", plain: "A few short pieces in bursts, long stretches without.", set: { share: 30, cues: 15, saved: 4, firstIn: "after a while", longestGap: 12, spread: "in bursts" } },
      ],
    },
  });

  W.add("musicPointOfView", {
    window: {
      faces: [
        { face: "dial", slider: "inside" },
        { face: "tiles", slider: "whose", icons: { "the hero": "🦸", "the villain": "😈", "a side character": "🧑", "the crowd": "👥", "nobody, the scene itself": "🎬" } },
        { face: "ladder", slider: "gap" },
      ],
      groups: [
        { label: "Whose feeling", sliders: ["inside", "whose", "revealed"] },
        { label: "Against the picture", sliders: ["gap", "switches", "shared"] },
      ],
      presets: [
        { label: "Panic at the interview", plain: "Racing music inside the hero while the room stays polite.", set: { inside: 5, whose: "the hero", gap: "the opposite", switches: 0, shared: "no one", revealed: "right away" } },
        { label: "The room's mood", plain: "The music plays the scene itself, matching what we see.", set: { inside: 0, whose: "nobody, the scene itself", gap: "matches what we see", switches: 0, shared: "everyone", revealed: "right away" } },
        { label: "Passed around the table", plain: "The music jumps from one guest's private feeling to the next.", set: { inside: 4, whose: "a side character", gap: "very different", switches: 4, shared: "one person", revealed: "partway in" } },
      ],
    },
  });

  W.add("musicWarning", {
    window: {
      faces: [
        { face: "dial", slider: "lead" },
        { face: "tiles", slider: "what", icons: { danger: "⚠️", "a death": "🕯️", love: "💘", "a twist": "🌀", "a joke": "😂" } },
        { face: "ladder", slider: "clarity" },
      ],
      groups: [
        { label: "The warning", sliders: ["lead", "clarity", "what"] },
        { label: "How often", sliders: ["warnings", "heard"] },
        { label: "Payoff", sliders: ["payoff"] },
      ],
      presets: [
        { label: "Two low notes", plain: "An unmistakable danger warning, twice for nothing, then it comes.", set: { what: "danger", clarity: "unmistakable", lead: 15, warnings: 3, payoff: "comes true later", heard: "no" } },
        { label: "Love is in the air", plain: "A faint hint of the love theme before they meet.", set: { what: "love", clarity: "a faint hint", lead: 30, warnings: 1, payoff: "comes true right away", heard: "no" } },
        { label: "Cat jump scare", plain: "An obvious warning that turns out to be a false alarm.", set: { what: "danger", clarity: "obvious", lead: 8, warnings: 1, payoff: "false alarm", heard: "maybe" } },
      ],
    },
  });

  W.add("wrongEraMusic", {
    window: {
      faces: [
        { face: "dial", slider: "gap" },
        { face: "balance", slider: "direction", left: "Older", right: "Newer" },
        { face: "tiles", slider: "use", icons: { "the soundtrack": "🎼", "played in the story": "📻", "the characters sing it": "🎤", "a cover in the old style": "🎻" } },
      ],
      groups: [
        { label: "The time gap", sliders: ["gap", "direction"] },
        { label: "How it is used", sliders: ["use", "dressedUp", "howOften"] },
        { label: "In the story", sliders: ["normal"] },
      ],
      presets: [
        { label: "Rock at the joust", plain: "A modern stadium song the medieval crowd chants along to, as if normal.", set: { gap: 5, direction: "much newer", use: "the characters sing it", dressedUp: "played as is", normal: "totally normal", howOften: "the whole film" } },
        { label: "Pop song on strings", plain: "A modern hit rearranged for an old string quartet at the ball.", set: { gap: 4, direction: "much newer", use: "a cover in the old style", dressedUp: "fully rearranged", normal: "they barely notice", howOften: "now and then" } },
        { label: "Old jazz in space", plain: "Music far older than the story plays on the ship's radio.", set: { gap: 4, direction: "much older", use: "played in the story", dressedUp: "played as is", normal: "totally normal", howOften: "once" } },
      ],
    },
  });

  W.add("titleMusic", {
    window: {
      faces: [
        { face: "dial", slider: "weight" },
        { face: "tiles", slider: "tone", icons: { dark: "🌑", uneasy: "😟", calm: "🌊", warm: "☀️", playful: "🎈", grand: "🏰" } },
        { face: "tiles", slider: "where", icons: { "opening only": "▶️", "closing only": "⏹️", both: "🔁", "both, the same tune": "🎼" } },
      ],
      groups: [
        { label: "The title music", sliders: ["weight", "tone", "words"] },
        { label: "Where and how long", sliders: ["where", "length", "tieIn"] },
      ],
      presets: [
        { label: "Space opera overture", plain: "A huge, grand theme over the opening crawl, the same tune at the end.", set: { weight: 5, tone: "grand", where: "both, the same tune", length: 120, words: "no words", tieIn: "the main theme" } },
        { label: "Spy theme song", plain: "A big song with words over stylish opening titles.", set: { weight: 4, tone: "dark", where: "opening only", length: 180, words: "a song with words", tieIn: "hinted" } },
        { label: "Quiet end credits", plain: "A calm, wordless voice over the closing credits only.", set: { weight: 1, tone: "calm", where: "closing only", length: 240, words: "a wordless voice", tieIn: "never" } },
      ],
    },
  });

  W.add("soundsBecomeMusic", {
    window: {
      faces: [
        { face: "dial", slider: "blend" },
        { face: "tiles", slider: "sounds", icons: { footsteps: "👣", machines: "⚙️", "kitchen sounds": "🍳", nature: "🌧️", voices: "🗣️", "a clock": "⏰" } },
        { face: "ladder", slider: "handoff" },
      ],
      groups: [
        { label: "The sounds", sliders: ["sounds", "count", "blend"] },
        { label: "The beat", sliders: ["onBeat", "handoff", "moveWith"] },
      ],
      presets: [
        { label: "Kitchen rhythm", plain: "Chopping, sizzling and clattering fall into a beat before the song starts.", set: { sounds: "kitchen sounds", blend: 4, count: 6, onBeat: "on the beat", handoff: "music joins them", moveWith: "they move with it" } },
        { label: "Factory pulse", plain: "Machines stamp out a rhythm the workers move to.", set: { sounds: "machines", blend: 5, count: 4, onBeat: "on the beat", handoff: "sounds stay alone", moveWith: "they move with it" } },
        { label: "Rain becomes a song", plain: "Raindrops loosely find a rhythm, then the music takes over.", set: { sounds: "nature", blend: 2, count: 2, onBeat: "near the beat", handoff: "music takes over", moveWith: "no" } },
      ],
    },
  });

  W.add("foley", {
    window: {
      faces: [
        { face: "dial", slider: "detail" },
        { face: "tiles", slider: "focus", icons: { footsteps: "👣", clothes: "👕", "hands and props": "✋", "bodies and hits": "👊", everything: "🎧" } },
        { face: "tiles", slider: "surface", icons: { carpet: "🟥", wood: "🪵", stone: "🪨", gravel: "⚪", snow: "❄️", "wet street": "💧" } },
      ],
      groups: [
        { label: "What we hear", sliders: ["detail", "focus", "surface"] },
        { label: "How it sounds", sliders: ["loud", "texture", "sync"] },
      ],
      presets: [
        { label: "Empty corridor", plain: "Every footstep on stone, heightened and exactly in time.", set: { focus: "footsteps", detail: 3, surface: "stone", loud: "heightened", sync: "to the frame", texture: "natural" } },
        { label: "Cartoon fight", plain: "Every punch and body hit pushed way past real, squelchy and loud.", set: { focus: "bodies and hits", detail: 5, loud: "exaggerated", sync: "to the frame", texture: "squelchy", surface: "wood" } },
        { label: "Close and quiet", plain: "Cloth and hands, quieter than life, for an intimate scene.", set: { focus: "clothes", detail: 4, loud: "quieter than life", sync: "close", texture: "clean", surface: "carpet" } },
      ],
    },
  });

  W.add("ambienceBed", {
    window: {
      faces: [
        { face: "dial", slider: "presence" },
        { face: "tiles", slider: "place", icons: { "a city": "🏙️", nature: "🌳", indoors: "🏠", "a crowd": "👥", machines: "⚙️", "the sea": "🌊" } },
        { face: "ladder", slider: "alive" },
      ],
      groups: [
        { label: "The place", sliders: ["presence", "place", "alive"] },
        { label: "What it tells us", sliders: ["reacts", "timeOfDay", "steady"] },
      ],
      presets: [
        { label: "Night in the woods", plain: "Crickets that go quiet when something is near.", set: { place: "nature", presence: 3, alive: "a few sounds", reacts: "goes quiet when tense", timeOfDay: "clearly", steady: "mostly steady" } },
        { label: "Busy city flat", plain: "Traffic and voices through the window, always there.", set: { place: "a city", presence: 4, alive: "teeming", reacts: "never", timeOfDay: "a hint", steady: "perfectly steady" } },
        { label: "Just room tone", plain: "Only the quiet hum of the room, steady across every cut.", set: { place: "indoors", presence: 1, alive: "one steady hum", reacts: "a little", timeOfDay: "no", steady: "perfectly steady" } },
      ],
    },
  });

  W.add("subjectiveSound", {
    window: {
      faces: [
        { face: "dial", slider: "how" },
        { face: "tiles", slider: "kind", icons: { muffled: "🧣", "ringing ears": "🔔", underwater: "🌊", "one sound in focus": "🎯", "heartbeat and breath": "❤️", "fading out": "🌫️" } },
        { face: "pad", x: "lasts", y: "how", xLabel: "Lasts longer", yLabel: "Deeper inside" },
      ],
      groups: [
        { label: "Their ears", sliders: ["how", "kind", "cause"] },
        { label: "The world outside", sliders: ["leftOver", "lasts", "comeBack"] },
      ],
      presets: [
        { label: "After the blast", plain: "A high ring and nothing else, for ten seconds, then the world creeps back.", set: { kind: "ringing ears", cause: "a blast", how: 5, lasts: 10, leftOver: "faint", comeBack: "creeps back" } },
        { label: "Love at first sight", plain: "One voice clear across a noisy party, the rest gone soft.", set: { kind: "one sound in focus", cause: "falling for someone", how: 4, lasts: 8, leftOver: "faint", comeBack: "snaps back" } },
        { label: "Fainting", plain: "Sound fades to heartbeat and breath, then floods back.", set: { kind: "heartbeat and breath", cause: "fainting", how: 5, lasts: 6, leftOver: "none", comeBack: "floods back" } },
      ],
    },
  });

  W.add("placeEcho", {
    window: {
      faces: [
        { face: "dial", slider: "echo" },
        { face: "ladder", slider: "size" },
        { face: "tiles", slider: "on", icons: { voices: "🗣️", footsteps: "👣", music: "🎵", everything: "🎧" } },
      ],
      groups: [
        { label: "The echo", sliders: ["echo", "tail", "on"] },
        { label: "The place", sliders: ["size", "surfaces", "truth"] },
      ],
      presets: [
        { label: "Cathedral", plain: "Hard stone and a long ring on everything.", set: { echo: 5, size: "a cathedral", tail: 6, on: "everything", surfaces: "hard stone and glass", truth: "true to what we see" } },
        { label: "Inside a car", plain: "Dry and close, almost no echo.", set: { echo: 0, size: "a closet", tail: 0, on: "voices", surfaces: "soft and padded", truth: "true to what we see" } },
        { label: "Lost in a memory", plain: "A small room that rings like a hall, because we are in someone's head.", set: { echo: 4, size: "a hall", tail: 4, on: "voices", surfaces: "mixed", truth: "far bigger than the place" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
