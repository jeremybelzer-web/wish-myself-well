/* Emotion: what a character feels and every channel it shows through, plus the emotional roadmap
   (per character and for the whole film, scene by scene). Jeremy, 2026-10-02 12:36Z: emotion shows in
   movement, speech, face, posture, how much action and dialogue there is, the setting, the lighting,
   and how the scene sits against the one before. Adds sliders to the catalog's "emotion" row. */
(function (DB) {
  const W = "emotion";

  DB.curiosity({
    id: "emotion",
    label: "Emotion",
    override: ["workspace", "also", "plain", "kind"],
    workspace: W,
    also: ["lines", "movement-lines"],
    plain: "What a character feels in this beat, and how strongly it shows in body, voice, face, words, the room and the light.",
    sliders: [
      ["valence", "Unhappy to happy", [-5, 5], "How bad or good the feeling is, from misery to delight."],
      ["arousal", "Calm to wound up", [0, 5], "How much energy is in the feeling, from limp to frantic."],
      ["intensity", "Intensity", [0, 5], "How strongly it is felt, whatever the feeling."],
      ["shown", "Hidden or shown", ["hidden completely", "leaks out", "shown", "overflowing"], "How much of the feeling the character lets others see."],
      ["movement", "Shows in movement", [0, 5], "How much the feeling drives how they move: pacing, freezing, flinging."],
      ["voice", "Shows in the voice", [0, 5], "How much the feeling colors the voice: pitch, wobble, edge, warmth."],
      ["face", "Shows on the face", [0, 5], "How much the face gives away."],
      ["posture", "Posture", ["collapsed", "slumped", "neutral", "upright", "puffed up"], "How the body is held under the feeling."],
      ["postureChange", "Posture changes", [0, 5], "How often the posture shifts during the beat."],
      ["actionAmount", "How much they do", [0, 5], "Amount of physical action, from none to constant."],
      ["dialogueAmount", "How much they say", [0, 5], "Amount of talking, from silent to unstoppable."],
      ["actions", "What the hands do", ["nothing", "small fidgets", "busy work", "grabbing and throwing"], "The kind of action the feeling produces."],
      ["settingMood", "The room agrees", ["fights the feeling", "neutral", "matches the feeling"], "Whether the place reflects the feeling (rain on a sad day) or fights it (a party for a grieving person)."],
      ["lightingMood", "The light agrees", ["fights the feeling", "neutral", "matches the feeling"], "Whether the light matches the feeling or plays against it."],
      ["contrastPrev", "Against the scene before", ["same feeling", "a step away", "a big swing", "the opposite"], "How far this feeling is from the one in the previous scene."],
      ["contagion", "Spreads to others", [0, 5], "How much the feeling passes to the other people in the scene."],
    ],
  });

  DB.curiosity({
    id: "emotionRoadmap",
    label: "Character's emotional roadmap",
    workspace: W,
    also: ["arc"],
    per: "character per scene",
    group: "Emotion",
    plain: "The feeling of one character scene by scene through the story, drawn as a line you can borrow from a curated film.",
    main: "level",
    sliders: [
      ["level", "Where they are", [-5, 5], "Low to high, scene by scene: the height of the line."],
      ["swing", "Size of the swings", [0, 5], "How far the feeling moves between scenes."],
      ["direction", "Heading", ["falling", "flat", "rising"], "Whether the line is going down, holding, or going up."],
      ["turns", "Turning points", [0, 8], "How many times the direction changes over the story."],
      ["lowPoint", "Lowest point", [0, 100, "% through the story"], "Where the lowest scene falls in the story."],
      ["highPoint", "Highest point", [0, 100, "% through the story"], "Where the highest scene falls in the story."],
      ["endsAbove", "Ends higher or lower", ["much lower", "lower", "where it began", "higher", "much higher"], "Whether the character ends up better or worse off than they began."],
    ],
  });

  DB.curiosity({
    id: "filmEmotion",
    label: "Film's emotional roadmap",
    workspace: W,
    also: ["structure"],
    per: "scene",
    group: "Emotion",
    plain: "The feeling the audience is meant to have scene by scene across the whole film.",
    main: "level",
    sliders: [
      ["level", "Audience feeling", [-5, 5], "How low or high the audience should feel in this scene."],
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
    also: ["comedy", "placement"],
    group: "Emotion",
    plain: "How different two characters in the same scene feel. A big gap is drama, or comedy when one is calm and the other is panicking.",
    main: "gap",
    sliders: [
      ["gap", "How different", [0, 5], "From feeling the same to opposite feelings."],
      ["awareness", "Who knows it", ["neither notices", "one notices", "both notice"], "Whether the characters see the gap between them."],
      ["closing", "Closing or widening", ["widening", "holding", "closing"], "Whether they move toward the same feeling over the scene."],
    ],
  });

  DB.suite({ id: "held-back-tears", label: "Held-back tears", workspace: W, plain: "A strong sad feeling kept almost hidden: a still body, a wavering voice, a face that slips.", members: [
    { curiosity: "emotion", slider: "setting", value: "melancholy", weight: 100 },
    { curiosity: "emotion", slider: "intensity", value: 4, weight: 80 },
    { curiosity: "emotion", slider: "shown", value: "leaks out", weight: 100 },
    { curiosity: "emotion", slider: "voice", value: 3, weight: 60 },
    { curiosity: "stillness", value: 4, weight: 50 },
  ] });
  DB.suite({ id: "rage-boils-over", label: "Rage boils over", workspace: W, also: ["camera-motion"], plain: "Anger rising until it spills: louder, bigger moves, a shakier camera.", members: [
    { curiosity: "emotion", slider: "setting", value: "angry", weight: 100 },
    { curiosity: "emotion", slider: "arousal", from: 2, to: 5, weight: 100 },
    { curiosity: "emotion", slider: "shown", value: "overflowing", weight: 80 },
    { curiosity: "emotion", slider: "actions", value: "grabbing and throwing", weight: 60 },
    { curiosity: "cameraCarry", value: "handheld", weight: 50 },
  ] });
  DB.suite({ id: "quiet-joy", label: "Quiet joy", workspace: W, plain: "Happiness that does not need to shout: warm light, a small smile, little said.", members: [
    { curiosity: "emotion", slider: "setting", value: "joyful", weight: 100 },
    { curiosity: "emotion", slider: "arousal", value: 1, weight: 70 },
    { curiosity: "emotion", slider: "dialogueAmount", value: 1, weight: 60 },
    { curiosity: "emotion", slider: "lightingMood", value: "matches the feeling", weight: 60 },
  ] });
  DB.suite({ id: "frozen-fear", label: "Frozen fear", workspace: W, plain: "Fear that locks the body: no movement, no words, eyes darting.", members: [
    { curiosity: "emotion", slider: "setting", value: "fearful", weight: 100 },
    { curiosity: "emotion", slider: "actionAmount", value: 0, weight: 90 },
    { curiosity: "emotion", slider: "dialogueAmount", value: 0, weight: 80 },
    { curiosity: "gazeShift", value: 6, weight: 60 },
  ] });
  DB.suite({ id: "mood-whiplash", label: "Mood whiplash", workspace: W, also: ["structure", "comedy"], plain: "The feeling swings to its opposite from one scene to the next.", members: [
    { curiosity: "emotion", slider: "contrastPrev", value: "the opposite", weight: 100 },
    { curiosity: "filmEmotion", slider: "alternation", value: "every scene", weight: 60 },
  ] });
  DB.suite({ id: "calm-in-the-storm", label: "Calm in the storm", workspace: W, also: ["comedy"], plain: "One character stays perfectly calm while everyone around them panics.", members: [
    { curiosity: "emotionGap", slider: "gap", value: 5, weight: 100 },
    { curiosity: "emotionGap", slider: "awareness", value: "one notices", weight: 60 },
    { curiosity: "emotion", slider: "contagion", value: 0, weight: 60 },
  ] });
  DB.suite({ id: "mask-slips", label: "The mask slips", workspace: W, also: ["lines"], plain: "A character performing one feeling while another leaks out through the face and hands.", members: [
    { curiosity: "emotion", slider: "shown", value: "leaks out", weight: 100 },
    { curiosity: "emotion", slider: "face", value: 2, weight: 70 },
    { curiosity: "emotion", slider: "actions", value: "small fidgets", weight: 70 },
  ] });
  DB.suite({ id: "rock-bottom", label: "Rock bottom", workspace: W, also: ["arc"], plain: "The lowest scene of a character's roadmap: collapsed posture, little said, a room that agrees.", members: [
    { curiosity: "emotionRoadmap", slider: "level", value: -5, weight: 100 },
    { curiosity: "emotion", slider: "posture", value: "collapsed", weight: 80 },
    { curiosity: "emotion", slider: "settingMood", value: "matches the feeling", weight: 60 },
  ] });

  DB.proximity({ id: "feeling-shows-face-first", label: "When a feeling rises, the face shows it before the words", workspace: W, also: ["movement-lines"], plain: "As intensity rises, the face changes within a beat, before the character says anything about it.", when: { curiosity: "emotion", slider: "intensity", change: "rises" }, then: { curiosity: "emotion", slider: "face", change: "rises" }, within: 1 });
  DB.proximity({ id: "anger-louder", label: "When anger rises, the voice gets louder", workspace: W, also: ["lines"], plain: "Anger is followed by louder lines within a beat.", when: { curiosity: "emotion", slider: "setting", is: "angry" }, then: { curiosity: "volume", change: "rises" }, within: 1 });
  DB.proximity({ id: "fear-still", label: "When fear rises, movement stops", workspace: W, also: ["character-motion"], plain: "Fear tends to freeze characters within a beat.", when: { curiosity: "emotion", slider: "setting", is: "fearful" }, then: { curiosity: "emotion", slider: "actionAmount", change: "drops" }, within: 1 });
  DB.proximity({ id: "contagion-spreads", label: "When one character's feeling overflows, others catch it", workspace: W, also: ["herd"], plain: "A feeling shown openly spreads to the others in the scene within three beats.", when: { curiosity: "emotion", slider: "shown", is: "overflowing" }, then: { curiosity: "herdMentality", change: "rises" }, within: 3 });
  DB.proximity({ id: "low-then-laugh", label: "After a low scene, a laugh", workspace: W, also: ["comedy", "structure"], plain: "After the film hits a low scene, a laugh tends to follow within the next scene or two (about eight beats).", when: { curiosity: "filmEmotion", slider: "level", change: "drops" }, then: { curiosity: "filmEmotion", slider: "laughter", change: "rises" }, within: 8 });
  DB.proximity({ id: "hidden-then-burst", label: "A hidden feeling bursts out later", workspace: W, also: ["arc"], plain: "A feeling held completely hidden comes out overflowing a few scenes later.", when: { curiosity: "emotion", slider: "shown", is: "hidden completely" }, then: { curiosity: "emotion", slider: "shown", is: "overflowing" }, within: 12 });
  DB.proximity({ id: "joy-light-warms", label: "When joy rises, the light warms", workspace: W, also: ["light"], plain: "Joyful beats are followed by warmer light within two beats.", when: { curiosity: "emotion", slider: "setting", is: "joyful" }, then: { curiosity: "colorTemp", is: "warm practical" }, within: 2 });
  DB.proximity({ id: "tension-release", label: "After tension peaks, release follows", workspace: W, also: ["structure"], plain: "When the film's tension peaks, a release follows within a few beats.", when: { curiosity: "filmEmotion", slider: "tension", change: "rises" }, then: { curiosity: "filmEmotion", slider: "relief", change: "rises" }, within: 4 });

  DB.proximitySuite({ id: "body-tells-first", label: "The body tells first", workspace: W, also: ["movement-lines"], plain: "Feelings reach the face and body before they reach the words.", members: ["feeling-shows-face-first", "fear-still", "anger-louder"] });
  DB.proximitySuite({ id: "emotional-rollercoaster", label: "Emotional rollercoaster", workspace: W, also: ["structure"], plain: "The film's feeling rises and falls in a rhythm: tension then release, low then a laugh.", members: ["tension-release", "low-then-laugh"] });
  DB.proximitySuite({ id: "feelings-spread", label: "Feelings spread", workspace: W, also: ["herd", "light"], plain: "A feeling moves outward from one character to the others, the room and the light.", members: ["contagion-spreads", "joy-light-warms", "hidden-then-burst"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
