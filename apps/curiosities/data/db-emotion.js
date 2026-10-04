/* Emotion. Jeremy, 2026-10-02 12:36Z: emotion shows in movement, speech, face, posture, how much action and
   dialogue there is, the setting, the lighting, and how the scene sits against the one before; with emotional
   roadmaps per character and for the film. The app's lenses.js has the Emotion lens (main: the catalog's
   "emotion", sliders emotionIntensity, emoMove, emoVoice...) and the Emotional road lens (emoRoadCharacter,
   emoRoadFilm...), imported in db-catalog.js. This file adds what they lack, the feeling gap between two
   characters, and the suites and proximities. */
(function (DB) {
  const W = "emotion";

  DB.curiosity({
    id: "emotion",
    override: ["kind"],
    kind: "lens",
    sliders: [
      ["valence", "Unhappy to happy", [-5, 5], "How bad or good the feeling is, from misery to delight, whichever feeling it is."],
      ["arousal", "Calm to wound up", [0, 5], "How much energy is in the feeling, from limp to frantic."],
    ],
  });

  DB.curiosity({
    id: "emoRoadCharacter",
    sliders: [
      ["height", "Height of the line", [-5, 5], "Low to high: how good or bad things are for the character in this scene."],
      ["swing", "Size of the swings", [0, 5], "How far the feeling moves between scenes."],
      ["turns", "Turning points", [0, 8], "How many times the direction changes over the story."],
      ["lowPoint", "Lowest point", [0, 100, "% through the story"], "Where the lowest scene falls in the story."],
      ["highPoint", "Highest point", [0, 100, "% through the story"], "Where the highest scene falls in the story."],
      ["endsAbove", "Ends higher or lower", ["much lower", "lower", "where it began", "higher", "much higher"], "Whether the character ends up better or worse off than they began."],
    ],
  });

  DB.curiosity({
    id: "emoRoadFilm",
    sliders: [
      ["tension", "Tension", [0, 5], "How tight the audience is, from at ease to on the edge of the seat."],
      ["laughter", "Laughter", [0, 5], "How much the audience should be laughing."],
      ["relief", "Release", [0, 5], "How much tension is let go in this scene."],
      ["alternation", "Light and dark alternate", ["steady", "now and then", "every scene"], "How often a funny or light scene follows a heavy one."],
      ["peakPlace", "Where the peak falls", [0, 100, "% through the film"], "Where the most intense scene sits."],
    ],
  });

  DB.curiosity({
    id: "emotionGap",
    label: "Feeling gap between characters",
    workspace: W,
    also: ["comedy-mix", "placement"],
    group: "Emotion",
    plain: "How different two characters in the same scene feel. A big gap is drama, or comedy when one is calm and the other is panicking.",
    main: "gap",
    sliders: [
      ["gap", "How different", [0, 5], "From feeling the same to opposite feelings."],
      ["awareness", "Who knows it", ["neither notices", "one notices", "both notice"], "Whether the characters see the gap between them."],
      ["closing", "Closing or widening", ["widening", "holding", "closing"], "Whether they move toward the same feeling over the scene."],
    ],
  });

  /* Face and feelings (2026-10-03): the feelings a 3D character's face shows (rig/faces.js). Six basic feelings
     a face can mix, and where the eyes look. How big the face goes and how often it blinks are the Face acting
     lens's "expression" and "blinks" (faceLens in db-maya.js). When the timeline has none of these lanes, the 3D
     face follows the Emotion lanes instead (emotion, emotionIntensity, emoShown, emoRoadCharacter). */
  const faceRow = DB.curiosity({
    id: "feelingFaceLens",
    label: "Face and feelings",
    workspace: W,
    also: ["comedy", "character-motion", "emo-road"],
    group: "Emotion",
    kind: "lens",
    plain: "What the character's face feels: happy, sad, angry, scared, surprised or disgusted, mixed in any amount, and where the eyes look. A 3D character's face and body follow it.",
    main: "happy",
    sliders: [
      ["happy", "Happy", ["not at all", "a little", "clearly", "very"], "A smile that reaches the eyes: mouth corners up, cheeks push the eyes a little closed."],
      ["sad", "Sad", ["not at all", "a little", "clearly", "very"], "Mouth corners down, the inner ends of the brows lift, the head and shoulders sink."],
      ["angry", "Angry", ["not at all", "a little", "clearly", "very"], "Brows pulled down and together, eyes narrow, mouth pressed or bared."],
      ["scared", "Scared", ["not at all", "a little", "clearly", "very"], "Eyes wide, brows up and pulled together, mouth stretched; the body pulls in."],
      ["surprised", "Surprised", ["not at all", "a little", "clearly", "very"], "Brows way up, eyes wide, the jaw drops open. Short-lived: it turns into another feeling."],
      ["disgust", "Disgusted", ["not at all", "a little", "clearly", "very"], "Nose wrinkles, the upper lip lifts on one side, the head pulls back."],
      ["look", "Where the eyes look", ["ahead", "left", "right", "up", "down", "at the camera"], "Only the eyes move, not the head. Eyes going away from someone before the words come say a lot.", { unordered: true }],
    ],
  });
  faceRow.momentum = {
    push: 3,
    plot: "A face shows the feeling before the words do, so the other characters (and the audience) react to it and the scene turns.",
    theme: "What a face shows against what the character says is where honesty and pretending live.",
    pull: "Close on a face, the audience reads every small change and waits to see what the character will do with it.",
    cue: "visual",
    tryThis: "Let the face change a beat before the line: a smile that drops, or eyes that go to the door.",
  };

  const S = (id, label, plain, members, extra) => DB.suite(Object.assign({ id, label, plain, workspace: W, members }, extra || {}));
  S("held-back-tears", "Held-back tears", "A strong sad feeling kept almost hidden: a still body, a wavering voice, a face that slips.", [
    { curiosity: "emotion", value: "melancholy" },
    { curiosity: "emotionIntensity", value: 4, weight: 80 },
    { curiosity: "emoShown", value: "leaks out" },
    { curiosity: "emoVoice", value: "a hint", weight: 60 },
    { curiosity: "stillness", value: 4, weight: 50 },
  ]);
  S("rage-boils-over", "Rage boils over", "Anger rising until it spills: louder, bigger moves, a shakier camera.", [
    { curiosity: "emotion", value: "angry" },
    { curiosity: "emotion", slider: "arousal", from: 2, to: 5 },
    { curiosity: "emoShown", value: "fully shown", weight: 80 },
    { curiosity: "emoActions", value: "drastic", weight: 60 },
    { curiosity: "cameraCarry", value: "handheld", weight: 50 },
  ], { also: ["camera-motion"] });
  S("quiet-joy", "Quiet joy", "Happiness that does not need to shout: warm light, a small smile, little said.", [
    { curiosity: "emotion", value: "joyful" },
    { curiosity: "emotion", slider: "arousal", value: 1, weight: 70 },
    { curiosity: "wordsAmount", value: 1, weight: 60 },
    { curiosity: "lightingMood", value: "bright and warm", weight: 60 },
  ]);
  S("frozen-fear", "Frozen fear", "Fear that locks the body: no movement, no words, eyes darting.", [
    { curiosity: "emotion", value: "fearful" },
    { curiosity: "emoMove", value: "frozen", weight: 90 },
    { curiosity: "wordsAmount", value: 0, weight: 80 },
    { curiosity: "gazeShift", value: 6, weight: 60 },
  ]);
  S("mood-whiplash", "Mood whiplash", "The feeling swings to its opposite from one scene to the next.", [
    { curiosity: "emoContrastPrev", value: "the opposite" },
    { curiosity: "emoRoadFilm", slider: "alternation", value: "every scene", weight: 60 },
  ], { also: ["structure", "comedy"] });
  S("calm-in-the-storm", "Calm in the storm", "One character stays perfectly calm while everyone around them panics.", [
    { curiosity: "emotionGap", slider: "gap", value: 5 },
    { curiosity: "emotionGap", slider: "awareness", value: "one notices", weight: 60 },
    { curiosity: "emoSpread", value: "no one", weight: 60 },
  ], { also: ["comedy-mix"] });
  S("mask-slips", "The mask slips", "A character performing one feeling while another leaks out through the face and hands.", [
    { curiosity: "emoShown", value: "leaks out" },
    { curiosity: "faceIntensity", value: 2, weight: 70 },
    { curiosity: "emoActions", value: "small", weight: 70 },
  ], { also: ["lines"] });
  S("rock-bottom", "Rock bottom", "The lowest scene of a character's road: closed posture, little said, a room that agrees.", [
    { curiosity: "emoRoadCharacter", value: "lowest point" },
    { curiosity: "posture", value: "closed", weight: 80 },
    { curiosity: "settingMood", value: "oppressive", weight: 60 },
  ], { workspace: "emo-road", also: ["arc"] });

  const P = (id, label, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace: W, when, then, within }, extra || {}));
  P("feeling-shows-face-first", "When a feeling rises, the face shows it before the words", "As the feeling grows stronger, the face changes within a beat, before the character says anything about it.", { curiosity: "emotionIntensity", change: "rises" }, { curiosity: "faceIntensity", change: "rises" }, 1, { also: ["movement-lines"] });
  P("anger-louder", "When anger rises, the voice gets louder", "Anger is followed by louder lines within a beat.", { curiosity: "emotion", is: "angry" }, { curiosity: "volume", change: "rises" }, 1, { also: ["lines"] });
  P("fear-still", "When fear rises, movement stops", "Fear tends to freeze characters within a beat.", { curiosity: "emotion", is: "fearful" }, { curiosity: "movementAmount", change: "drops" }, 1, { also: ["character-motion"] });
  P("contagion-spreads", "When one character's feeling overflows, others catch it", "A feeling shown openly spreads to the others in the scene within three beats.", { curiosity: "emoShown", is: "fully shown" }, { curiosity: "emoSpread", change: "rises" }, 3, { also: ["herd"] });
  P("low-then-laugh", "After a low scene, a laugh", "After the film hits a low scene, a laugh tends to follow within the next scene or two (about eight beats).", { curiosity: "emoRoadFilm", is: "lowest point" }, { curiosity: "emoRoadFilm", slider: "laughter", change: "rises" }, 8, { workspace: "emo-road", also: ["comedy", "structure"] });
  P("hidden-then-burst", "A hidden feeling bursts out later", "A feeling held completely hidden comes out fully a few scenes later.", { curiosity: "emoShown", is: "fully hidden" }, { curiosity: "emoShown", is: "fully shown" }, 12, { workspace: "emo-road", also: ["arc"] });
  P("joy-light-warms", "When joy rises, the light warms", "Joyful beats are followed by warmer light within two beats.", { curiosity: "emotion", is: "joyful" }, { curiosity: "lightingMood", is: "bright and warm" }, 2, { also: ["light", "color"] });
  P("tension-release", "After tension peaks, release follows", "When the film's tension peaks, a release follows within a few beats.", { curiosity: "emoRoadFilm", slider: "tension", change: "rises" }, { curiosity: "emoRoadFilm", slider: "relief", change: "rises" }, 4, { workspace: "emo-road", also: ["structure"] });

  DB.proximitySuite({ id: "body-tells-first", label: "The body tells first", workspace: W, also: ["movement-lines"], plain: "Feelings reach the face and body before they reach the words.", members: ["feeling-shows-face-first", "fear-still", "anger-louder", "intensity-moves"] });
  DB.proximitySuite({ id: "emotional-rollercoaster", label: "Emotional rollercoaster", workspace: "emo-road", also: ["structure"], plain: "The film's feeling rises and falls in a rhythm: tension then release, low then a laugh, a low point that turns.", members: ["tension-release", "low-then-laugh", "lowpoint-turn"] });
  DB.proximitySuite({ id: "feelings-spread", label: "Feelings spread", workspace: W, also: ["herd", "light"], plain: "A feeling moves outward from one character to the others, the room and the light.", members: ["contagion-spreads", "joy-light-warms", "hidden-then-burst", "light-mood-intensity"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
