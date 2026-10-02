/* Music & sound: the music chosen for the scene, and the choice to have none.
   Jeremy, 2026-10-02: "One curiosity would be the music that's selected for the scene, or the lack of music." */
(function (DB) {
  const W = "music";

  DB.curiosity({
    id: "music",
    label: "Music",
    workspace: W,
    also: ["lines", "structure"],
    group: "Music",
    plain: "The music chosen for this moment: whether there is any, what it is, how it sits under the scene, and how it starts and stops.",
    main: "presence",
    sliders: [
      ["presence", "How present", ["none", "barely there", "under the scene", "equal to the voices", "featured", "wall of sound"], "From no music at all to music that takes over the scene."],
      ["track", "Which track", ["track 1", "track 2", "track 3", "track 4", "track 5", "track 6", "track 7", "track 8"], "The piece chosen, from your own list of tracks for this film. A sweep steps through the list.", { unordered: true }],
      ["source", "Who hears it", ["only the audience", "mostly the audience", "both", "mostly the characters", "only the characters"], "Score only we hear, or music playing in the scene (a radio, a band) that the characters hear too."],
      ["tempo", "Tempo", [40, 200, "beats per minute"], "How fast the music is."],
      ["energy", "Energy", [0, 5], "How driving or busy the music feels, from still to frantic."],
      ["mood", "Mood", ["dark", "sad", "uneasy", "neutral", "warm", "happy", "euphoric"], "The feeling of the music on its own."],
      ["counterpoint", "Matches or fights the scene", ["matches", "leans the same way", "neutral", "leans against", "opposite"], "Music that agrees with what we see, or plays against it (cheerful song over violence)."],
      ["familiarity", "Known or new", ["written for this scene", "obscure", "recognizable", "famous"], "An original score, or a song the audience already knows."],
      ["vocals", "Vocals", ["instrumental", "hummed or wordless", "lyrics in another language", "lyrics we understand"], "Whether there are words, and whether we can follow them."],
      ["lyricFit", "Lyrics and scene", ["comment on the scene", "echo it", "unrelated", "contradict it"], "When there are lyrics, how they relate to what is happening."],
      ["cutSync", "Cuts with the beat", ["ignores the beat", "loosely", "cuts on the beat", "every action on the beat"], "How tightly the edit and the movement follow the music."],
      ["level", "Loudness against the voices", [-30, 6, "dB"], "How loud the music sits relative to the dialogue: far under it to louder than it."],
      ["entry", "How it comes in", ["already playing", "sneaks in", "fades up", "starts on a cut", "slams in"], "How the music begins."],
      ["exit", "How it leaves", ["plays out", "fades away", "dips under", "stops on a cut", "cut dead mid-phrase"], "How the music ends."],
      ["era", "Era", ["before 1900", "1900s to 1940s", "1950s to 1970s", "1980s to 1990s", "2000s", "now", "timeless"], "When the music sounds like it was made, against when the scene is set."],
      ["instrumentation", "Size of the sound", ["one instrument", "small group", "band", "orchestra", "electronic wall"], "How many instruments, from a lone piano to a full orchestra."],
      ["key", "Major or minor", ["minor", "ambiguous", "major"], "The basic color of the harmony."],
      ["repeatTheme", "Theme returns", ["new music", "hint of a theme", "a theme returns", "the main theme"], "Whether this music brings back a tune we have heard before in the film."],
    ],
  });

  DB.curiosity({
    id: "noMusic",
    label: "No music",
    workspace: W,
    also: ["lines"],
    group: "Music",
    plain: "Choosing to have no music: how long it lasts, what fills the space instead, and how sharply the music disappears.",
    main: "length",
    sliders: [
      ["length", "How long without music", [0, 60, "seconds"], "From a short gap to a whole scene with no music."],
      ["fill", "What fills it", ["true silence", "room tone", "natural sounds", "loud real sounds"], "What we hear instead: nothing, the hum of the room, birds and traffic, or a loud real sound."],
      ["cutoff", "How the music vanishes", ["was never there", "fades out", "dips away", "cut dead"], "How suddenly the music goes before the gap."],
      ["contrast", "Against the scene before", ["also quiet", "a little louder before", "much louder before", "wall of sound before"], "How loud the scene before was, so the gap feels bigger or smaller."],
      ["purpose", "What the gap is for", ["rest", "unease", "suspense", "shock", "truth"], "Why the music is gone: a breather, unease, suspense before something happens, a shock, or to let a true moment play bare."],
    ],
  });

  DB.curiosity({
    id: "soundDesign",
    label: "Sound around the scene",
    workspace: W,
    also: ["background"],
    group: "Music",
    plain: "The sounds that are not music or voices: footsteps, traffic, wind, a ticking clock, and how much they are pushed.",
    main: "density",
    sliders: [
      ["density", "How busy", ["silent", "sparse", "normal", "busy", "overwhelming"], "How many sounds there are at once."],
      ["realism", "Real or stylized", ["true to life", "heightened", "stylized", "cartoon"], "Whether sounds are as they would be, or pushed for effect (a punch that booms)."],
      ["focusSound", "One sound singled out", ["none", "a little", "clearly", "it takes over"], "How much one sound (a clock, a drip) is pulled forward."],
      ["offscreen", "Sound from outside the frame", [0, 5], "How much we hear things we cannot see."],
      ["bridge", "Sound bridges the cut", ["no", "a little early", "carries over the cut"], "Whether a sound from the next scene starts before the cut, or one from this scene carries into the next."],
    ],
  });

  DB.suite({ id: "needle-drop", label: "Needle drop", workspace: W, plain: "A famous song comes in loud, the edit cuts on its beat, and it owns the moment.", members: [
    { curiosity: "music", slider: "familiarity", value: "famous", weight: 100 },
    { curiosity: "music", slider: "presence", value: "featured", weight: 100 },
    { curiosity: "music", slider: "cutSync", value: "cuts on the beat", weight: 80 },
    { curiosity: "music", slider: "vocals", value: "lyrics we understand", weight: 60 },
  ] });
  DB.suite({ id: "ironic-counterpoint", label: "Ironic counterpoint", workspace: W, also: ["comedy"], plain: "Cheerful, well-known music over something dark or violent, so the contrast makes it stranger or funnier.", members: [
    { curiosity: "music", slider: "counterpoint", value: "opposite", weight: 100 },
    { curiosity: "music", slider: "mood", value: "happy", weight: 80 },
    { curiosity: "music", slider: "familiarity", value: "recognizable", weight: 60 },
    { curiosity: "music", slider: "source", value: "only the characters", weight: 40 },
  ] });
  DB.suite({ id: "radio-in-the-room", label: "Radio in the room", workspace: W, plain: "Music playing inside the scene, from a radio, a jukebox or a band, that the characters can hear and react to.", members: [
    { curiosity: "music", slider: "source", value: "only the characters", weight: 100 },
    { curiosity: "music", slider: "presence", value: "under the scene", weight: 70 },
    { curiosity: "music", slider: "entry", value: "already playing", weight: 60 },
  ] });
  DB.suite({ id: "score-swell", label: "Score swell", workspace: W, also: ["emotion"], plain: "An orchestral score rises under an emotional moment and peaks with it.", members: [
    { curiosity: "music", slider: "instrumentation", value: "orchestra", weight: 80 },
    { curiosity: "music", slider: "presence", from: "under the scene", to: "featured", weight: 100 },
    { curiosity: "music", slider: "entry", value: "fades up", weight: 70 },
    { curiosity: "music", slider: "source", value: "only the audience", weight: 70 },
  ] });
  DB.suite({ id: "sudden-silence", label: "Sudden silence", workspace: W, also: ["structure"], plain: "Loud music is cut dead and nothing replaces it, so the next thing we see or hear lands hard.", members: [
    { curiosity: "music", slider: "exit", value: "cut dead mid-phrase", weight: 100 },
    { curiosity: "noMusic", slider: "cutoff", value: "cut dead", weight: 100 },
    { curiosity: "noMusic", slider: "fill", value: "true silence", weight: 80 },
    { curiosity: "noMusic", slider: "contrast", value: "wall of sound before", weight: 60 },
  ] });
  DB.suite({ id: "bare-scene", label: "Bare scene", workspace: W, also: ["lines"], plain: "No music at all, just the room and the voices, so the acting has nowhere to hide.", members: [
    { curiosity: "music", slider: "presence", value: "none", weight: 100 },
    { curiosity: "noMusic", slider: "fill", value: "room tone", weight: 80 },
    { curiosity: "noMusic", slider: "purpose", value: "truth", weight: 60 },
    { curiosity: "noMusic", slider: "length", value: 45, weight: 50 },
  ] });
  DB.suite({ id: "suspense-drone", label: "Suspense drone", workspace: W, also: ["emotion"], plain: "A low, dark, slow sound that barely moves, while one small real sound is pushed forward.", members: [
    { curiosity: "music", slider: "mood", value: "uneasy", weight: 100 },
    { curiosity: "music", slider: "tempo", value: 50, weight: 60 },
    { curiosity: "music", slider: "presence", value: "barely there", weight: 80 },
    { curiosity: "soundDesign", slider: "focusSound", value: "clearly", weight: 70 },
  ] });
  DB.suite({ id: "montage-song", label: "Montage song", workspace: W, also: ["structure"], plain: "One song carries many short shots of time passing, the edit cutting on its beat.", members: [
    { curiosity: "music", slider: "presence", value: "featured", weight: 100 },
    { curiosity: "music", slider: "cutSync", value: "cuts on the beat", weight: 90 },
    { curiosity: "angleFamily", value: "montage", weight: 100 },
    { curiosity: "cutRate", value: "fast", weight: 60 },
  ] });
  DB.suite({ id: "returning-theme", label: "Returning theme", workspace: W, also: ["structure", "emotion"], plain: "A tune tied to a character or idea comes back, so we feel the link before we think it.", members: [
    { curiosity: "music", slider: "repeatTheme", value: "the main theme", weight: 100 },
    { curiosity: "music", slider: "presence", value: "under the scene", weight: 70 },
  ] });
  DB.suite({ id: "heightened-sound", label: "Heightened sound", workspace: W, also: ["comedy"], plain: "Real sounds pushed past real: punches boom, a door slam echoes. Good for action and for cartoon comedy.", members: [
    { curiosity: "soundDesign", slider: "realism", value: "stylized", weight: 100 },
    { curiosity: "soundDesign", slider: "focusSound", value: "it takes over", weight: 60 },
  ] });

  DB.proximity({ id: "music-cut-line", label: "When the music is cut dead, a big line lands", workspace: W, also: ["lines"], plain: "When the music stops suddenly, an important line is spoken within one beat, into the silence.", when: { curiosity: "music", slider: "exit", is: "cut dead mid-phrase" }, then: { curiosity: "volume", change: "rises" }, within: 1, effect: 3 });
  DB.proximity({ id: "silence-reveal", label: "When the music drops out, a reveal follows", workspace: W, also: ["structure"], plain: "After the music goes quiet, something hidden is shown within two beats.", when: { curiosity: "noMusic", slider: "purpose", is: "suspense" }, then: { curiosity: "reveal", change: "changes" }, within: 2, effect: 3 });
  DB.proximity({ id: "needle-slowmo", label: "When a famous song starts, time slows", workspace: W, also: ["camera-motion"], plain: "When a well-known song comes in, slow motion tends to follow within two beats.", when: { suite: "needle-drop" }, then: { curiosity: "speedRamp", is: "slow" }, within: 2 });
  DB.proximity({ id: "tempo-cuts", label: "When the tempo rises, the cuts speed up", workspace: W, also: ["camera-motion"], plain: "As the music gets faster, the edit cuts faster within a beat.", when: { curiosity: "music", slider: "tempo", change: "rises" }, then: { curiosity: "cutRate", change: "rises" }, within: 1 });
  DB.proximity({ id: "music-lifts-mood", label: "When the music turns warm, faces soften", workspace: W, also: ["emotion"], plain: "When the music shifts to a warmer mood, a character's face softens within two beats.", when: { curiosity: "music", slider: "mood", is: "warm" }, then: { curiosity: "faceIntensity", change: "drops" }, within: 2 });
  DB.proximity({ id: "counterpoint-violence", label: "When the music fights the scene, the violence gets bigger", workspace: W, also: ["comedy"], plain: "When cheerful music plays against the scene, impacts tend to rise within three beats.", when: { suite: "ironic-counterpoint" }, then: { curiosity: "impacts", change: "rises" }, within: 3 });
  DB.proximity({ id: "silence-closeup", label: "When there is no music, the frame gets closer", workspace: W, also: ["camera-angle"], plain: "In a stretch with no music, shots tend to move closer within two beats.", when: { suite: "bare-scene" }, then: { curiosity: "shotSize", is: "close" }, within: 2 });
  DB.proximity({ id: "radio-dance", label: "When music plays in the room, someone moves to it", workspace: W, also: ["character-motion"], plain: "When the characters can hear music, someone's movement starts to follow its beat within four beats.", when: { suite: "radio-in-the-room" }, then: { curiosity: "gesture", change: "rises" }, within: 4 });
  DB.proximity({ id: "theme-callback", label: "When a theme returns, the character it belongs to appears", workspace: W, also: ["structure"], plain: "When a character's tune comes back, that character tends to enter or be mentioned within two beats.", when: { suite: "returning-theme" }, then: { curiosity: "bodyEnter", is: "enters" }, within: 2 });
  DB.proximity({ id: "build-to-silence", label: "When the music builds to its peak, it cuts out", workspace: W, also: ["structure"], plain: "Music that climbs to a peak is often cut off at the top, leaving a gap.", when: { curiosity: "music", slider: "energy", change: "rises" }, then: { suite: "sudden-silence" }, within: 3 });

  DB.proximitySuite({ id: "music-steers-edit", label: "Music steers the edit", workspace: W, also: ["structure"], plain: "The music sets when cuts happen, when time slows and when the room goes quiet.", members: ["tempo-cuts", "needle-slowmo", "build-to-silence"] });
  DB.proximitySuite({ id: "silence-as-weapon", label: "Silence as a weapon", workspace: W, also: ["emotion"], plain: "Taking the music away makes lines, reveals and faces hit harder.", members: ["music-cut-line", "silence-reveal", "silence-closeup"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
