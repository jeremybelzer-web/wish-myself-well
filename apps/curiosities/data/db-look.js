/* Color and lighting. Jeremy, 2026-10-02 12:36Z: color (palettes, filters, black and white, saturation, warm to
   cool). The Color lens comes from lenses.js; this file adds what it lacks. Lighting already has many catalog
   rows (key direction, softness, rim...); the Lighting lens gathers them as its sliders (ref) and adds the
   ones missing. */
(function (DB) {
  const W = "light";

  /* The Color lens (lenses.js: main colorRange, with colorFilter, filterHue, warmCool... as its sliders) gets the
     parts it lacks. */
  DB.curiosity({
    id: "colorRange",
    sliders: [
      ["paletteHue", "Main hue", ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"], "The color that dominates the picture.", { unordered: true }],
      ["filterKind", "Kind of look", ["none", "soft diffusion", "sepia", "bleach bypass", "cross processed", "heavy tint"], "A finished look laid over the picture, beyond a plain color tint.", { unordered: true }],
      ["brightness", "Overall brightness", ["very dark", "dark", "normal", "bright", "blown out"], "How bright the picture is overall."],
      ["filmStock", "Film or digital look", ["clean digital", "slight grain", "film grain", "old film", "damaged film"], "Whether it looks like a modern digital camera or old film, with grain and wear."],
    ],
  });

  DB.curiosity({
    id: "lightingLens",
    label: "Lighting",
    workspace: W,
    also: ["emotion"],
    group: "Light",
    plain: "Where the light comes from and what it does to the scene, gathered in one place: direction, hardness, warmth, darkness, shape and movement.",
    main: "mood",
    sliders: [
      { id: "mood", label: "Mood of the light", ref: "lightingMood" },
      { id: "key", label: "Where the main light comes from", ref: "key" },
      { id: "softness", label: "Hard or soft", ref: "softness" },
      { id: "contrast", label: "Contrast", ref: "contrast" },
      { id: "colorTemp", label: "Color of the light", ref: "colorTemp" },
      { id: "valueKey", label: "Dark or bright", ref: "valueKey" },
      { id: "rim", label: "Rim light", ref: "rim" },
      { id: "lightCount", label: "Number of lights", ref: "lightCount" },
      { id: "lightShape", label: "Shaped light", ref: "lightShape" },
      { id: "atmosphere", label: "Haze in the air", ref: "atmosphere" },
      ["motivation", "Where the light seems to come from", ["no visible reason", "a window", "a lamp", "a fire or candle", "a screen", "the sky"], "The source the audience believes the light comes from.", { unordered: true }],
      ["faceLight", "Light on the face", ["face hidden", "half lit", "mostly lit", "fully lit"], "How much of the face we can see; half-lit faces read as split or secret."],
      ["movement", "Light moves", ["still", "flickers", "sways", "sweeps", "strobes"], "Whether the light itself moves: firelight flicker, passing car headlights, a strobe."],
      ["colorAccent", "Colored light", ["none", "one color", "two colors", "many colors"], "Colored lights in the scene (neon, police lights, stage gels)."],
      ["shadows", "Shadows", ["none", "soft", "clear", "deep", "the shadows tell the story"], "How strong the shadows are and how much they matter."],
    ],
  });

  DB.suite({ id: "teal-and-orange", label: "Teal and orange", workspace: "color", plain: "The blockbuster look: warm skin against cool blue-green backgrounds, punchy contrast.", members: [
    { curiosity: "colorRange", value: "two or three colors" },
    { curiosity: "colorCount", value: 2 },
    { curiosity: "skinColorTruth", value: "slightly tinted" },
    { curiosity: "contrast", value: 5 },
  ] });
  DB.suite({ id: "faded-memory", label: "Faded memory", workspace: "color", also: ["structure"], plain: "A washed-out, grainy, slightly warm look for flashbacks and memories.", members: [
    { curiosity: "colorRange", value: "muted color" },
    { curiosity: "saturation", value: 1 },
    { curiosity: "colorRange", slider: "filmStock", value: "old film" },
    { curiosity: "warmCool", value: "warm" },
  ] });
  DB.suite({ id: "black-and-white-one-color", label: "Black and white with one color", workspace: "color", plain: "A gray world where a single object keeps its color.", members: [
    { curiosity: "colorRange", value: "black and white" },
    { curiosity: "colorAccent", value: "one thing in a strong color" },
  ] });
  DB.suite({ id: "neon-night", label: "Neon night", workspace: W, also: ["color", "set"], plain: "Dark streets lit by colored signs, haze in the air, vivid color.", members: [
    { curiosity: "lightingLens", slider: "colorAccent", value: "many colors" },
    { curiosity: "lightingLens", slider: "motivation", value: "a screen" },
    { curiosity: "timeOfDay", value: "night" },
    { curiosity: "atmosphere", value: "haze" },
    { curiosity: "colorRange", value: "vivid color" },
  ] });
  DB.suite({ id: "candlelit", label: "Candlelit", workspace: W, also: ["emotion", "color"], plain: "Warm flickering light from a flame, deep shadows, faces half lit.", members: [
    { curiosity: "lightingLens", slider: "motivation", value: "a fire or candle" },
    { curiosity: "lightingLens", slider: "movement", value: "flickers" },
    { curiosity: "lightingLens", slider: "faceLight", value: "half lit" },
    { curiosity: "warmCool", value: "very warm" },
  ] });
  DB.suite({ id: "bleak-gray", label: "Bleak gray", workspace: "color", also: ["emotion"], plain: "Drained, cool, flat light with no warmth anywhere.", members: [
    { curiosity: "saturation", value: 1 },
    { curiosity: "warmCool", value: "cool" },
    { curiosity: "lightingMood", value: "dim" },
    { curiosity: "softness", value: "soft" },
  ] });
  DB.suite({ id: "sitcom-bright", label: "Sitcom bright", workspace: W, also: ["comedy"], plain: "Bright, even, high-key light where everyone's face is fully lit.", members: [
    { curiosity: "valueKey", value: "high key" },
    { curiosity: "lightingLens", slider: "faceLight", value: "fully lit" },
    { curiosity: "lightingLens", slider: "shadows", value: "soft" },
    { curiosity: "colorRange", slider: "brightness", value: "bright" },
  ] });
  DB.suite({ id: "interrogation", label: "Interrogation", workspace: W, plain: "One hard light overhead, everything else black, the face carved by shadow.", members: [
    { curiosity: "lightCount", value: 1 },
    { curiosity: "softness", value: "hard" },
    { curiosity: "valueKey", value: "low key" },
    { curiosity: "lightingLens", slider: "shadows", value: "deep" },
  ] });

  const P = (id, label, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace: W, when, then, within }, extra || {}));
  P("secret-half-light", "When a secret comes out, the face goes half lit", "When a hidden truth surfaces, the face falls half into shadow within one beat.", { curiosity: "reveal", change: "changes" }, { curiosity: "lightingLens", slider: "faceLight", is: "half lit" }, 1, { also: ["structure"] });
  P("drain-on-loss", "After a loss, the color drains", "A sharp drop in a character's feeling is followed by less saturated color within two beats.", { curiosity: "emotion", slider: "valence", change: "drops" }, { curiosity: "saturation", change: "drops" }, 2, { also: ["emotion"] });
  P("flashback-fade", "A flashback brings the faded look", "A jump into the past is followed by the faded, grainy look within one beat.", { curiosity: "transition", change: "changes" }, { suite: "faded-memory" }, 1, { also: ["structure"] });
  P("danger-shadows", "When danger rises, the shadows deepen", "Rising fear is followed by deeper shadows within two beats.", { curiosity: "emotion", slider: "setting", is: "fearful" }, { curiosity: "lightingLens", slider: "shadows", is: "deep" }, 2, { also: ["emotion"] });
  P("warm-reunion", "A reunion warms the color", "When characters reconcile, the picture warms within two beats.", { curiosity: "emotionGap", slider: "closing", is: "closing" }, { curiosity: "warmCool", is: "warm" }, 2, { also: ["emotion"] });

  DB.proximitySuite({ id: "light-follows-feeling", label: "Light follows feeling", workspace: W, also: ["emotion"], plain: "The light and color change with what the characters feel.", members: ["drain-on-loss", "danger-shadows", "warm-reunion", "joy-light-warms"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
