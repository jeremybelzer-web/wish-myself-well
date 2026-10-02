/* Light & look: color and lighting as lenses. Jeremy, 2026-10-02 12:36Z: color (palettes, filters, black and
   white, saturation, warm to cool). Lighting already has many catalog rows (key direction, softness, rim...);
   the lighting lens gathers them as its sliders (ref) and adds the ones missing. */
(function (DB) {
  const W = "light";

  DB.curiosity({
    id: "colorGrade",
    label: "Color",
    workspace: W,
    also: ["design", "emotion"],
    group: "Color",
    plain: "The color of the whole picture: its palette, how rich or drained, warm or cool, any filter or black and white.",
    main: "warmth",
    sliders: [
      ["warmth", "Warm to cool", ["very warm", "warm", "neutral", "cool", "very cool"], "Orange and golden to blue and cold."],
      ["saturation", "Saturation", [0, 100, "%"], "From gray to as rich as color gets."],
      ["blackWhite", "Black and white", [0, 100, "%"], "How much of the color is taken away, up to fully black and white."],
      ["palette", "Palette", ["one hue", "two colors", "complementary pair", "a few related colors", "every color"], "How many colors the picture is built from."],
      ["paletteHue", "Main hue", ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"], "The color that dominates.", { unordered: true }],
      ["accent", "Accent color", [0, 5], "How much one small splash of contrasting color stands out (a red coat in a gray world)."],
      ["filter", "Filter", ["none", "soft diffusion", "sepia", "bleach bypass", "cross processed", "heavy tint"], "A look laid over the picture.", { unordered: true }],
      ["filterStrength", "Filter strength", [0, 100, "%"], "How strong the filter is."],
      ["contrast", "Picture contrast", ["washed out", "soft", "normal", "punchy", "crushed blacks"], "How far apart the darks and lights are in the final picture."],
      ["brightness", "Overall brightness", ["very dark", "dark", "normal", "bright", "blown out"], "How bright the picture is overall."],
      ["skin", "Skin tones", ["natural", "warmed", "cooled", "stylized"], "Whether skin keeps its real color or is pushed with the rest."],
      ["filmStock", "Film or digital look", ["clean digital", "slight grain", "film grain", "old film", "damaged film"], "Whether it looks like a modern digital camera or old film, with grain and wear."],
      ["shift", "Color shift through the scene", ["stays put", "drifts", "changes on a cut", "changes dramatically"], "Whether the color changes as the scene goes on."],
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
      ["mood", "Mood of the light", ["menacing", "gloomy", "neutral", "warm", "radiant"], "The feeling the light gives on its own."],
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

  DB.suite({ id: "teal-and-orange", label: "Teal and orange", workspace: W, plain: "The blockbuster look: warm skin against cool blue-green backgrounds, punchy contrast.", members: [
    { curiosity: "colorGrade", slider: "palette", value: "complementary pair" },
    { curiosity: "colorGrade", slider: "skin", value: "warmed" },
    { curiosity: "colorGrade", slider: "contrast", value: "punchy" },
  ] });
  DB.suite({ id: "faded-memory", label: "Faded memory", workspace: W, also: ["structure"], plain: "A washed-out, grainy, slightly warm look for flashbacks and memories.", members: [
    { curiosity: "colorGrade", slider: "saturation", value: 30 },
    { curiosity: "colorGrade", slider: "contrast", value: "washed out" },
    { curiosity: "colorGrade", slider: "filmStock", value: "old film" },
    { curiosity: "colorGrade", slider: "warmth", value: "warm" },
  ] });
  DB.suite({ id: "black-and-white-one-color", label: "Black and white with one color", workspace: W, plain: "A gray world where a single object keeps its color.", members: [
    { curiosity: "colorGrade", slider: "blackWhite", value: 95 },
    { curiosity: "colorGrade", slider: "accent", value: 5 },
  ] });
  DB.suite({ id: "neon-night", label: "Neon night", workspace: W, also: ["design"], plain: "Dark streets lit by colored signs, haze in the air, saturated color.", members: [
    { curiosity: "lightingLens", slider: "colorAccent", value: "many colors" },
    { curiosity: "lightingLens", slider: "motivation", value: "a screen" },
    { curiosity: "timeOfDay", value: "night" },
    { curiosity: "atmosphere", value: "haze" },
    { curiosity: "colorGrade", slider: "saturation", value: 85 },
  ] });
  DB.suite({ id: "candlelit", label: "Candlelit", workspace: W, also: ["emotion"], plain: "Warm flickering light from a flame, deep shadows, faces half lit.", members: [
    { curiosity: "lightingLens", slider: "motivation", value: "a fire or candle" },
    { curiosity: "lightingLens", slider: "movement", value: "flickers" },
    { curiosity: "lightingLens", slider: "faceLight", value: "half lit" },
    { curiosity: "colorGrade", slider: "warmth", value: "very warm" },
  ] });
  DB.suite({ id: "bleak-gray", label: "Bleak gray", workspace: W, also: ["emotion"], plain: "Drained, cool, flat light with no warmth anywhere.", members: [
    { curiosity: "colorGrade", slider: "saturation", value: 15 },
    { curiosity: "colorGrade", slider: "warmth", value: "cool" },
    { curiosity: "lightingLens", slider: "mood", value: "gloomy" },
    { curiosity: "softness", value: "soft" },
  ] });
  DB.suite({ id: "sitcom-bright", label: "Sitcom bright", workspace: W, also: ["comedy"], plain: "Bright, even, high-key light where everyone's face is fully lit.", members: [
    { curiosity: "valueKey", value: "high key" },
    { curiosity: "lightingLens", slider: "faceLight", value: "fully lit" },
    { curiosity: "lightingLens", slider: "shadows", value: "soft" },
    { curiosity: "colorGrade", slider: "brightness", value: "bright" },
  ] });
  DB.suite({ id: "interrogation", label: "Interrogation", workspace: W, plain: "One hard light overhead, everything else black, the face carved by shadow.", members: [
    { curiosity: "lightCount", value: 1 },
    { curiosity: "softness", value: "hard" },
    { curiosity: "valueKey", value: "low key" },
    { curiosity: "lightingLens", slider: "shadows", value: "deep" },
  ] });

  const P = (id, label, plain, when, then, within, extra) => DB.proximity(Object.assign({ id, label, plain, workspace: W, when, then, within }, extra || {}));
  P("secret-half-light", "When a secret comes out, the face goes half lit", "When a hidden truth surfaces, the face falls half into shadow within one beat.", { curiosity: "reveal", change: "changes" }, { curiosity: "lightingLens", slider: "faceLight", is: "half lit" }, 1, { also: ["structure"] });
  P("drain-on-loss", "After a loss, the color drains", "A sharp drop in a character's feeling is followed by less saturated color within two beats.", { curiosity: "emotion", slider: "valence", change: "drops" }, { curiosity: "colorGrade", slider: "saturation", change: "drops" }, 2, { also: ["emotion"] });
  P("flashback-fade", "A flashback brings the faded look", "A jump into the past is followed by the faded, grainy look within one beat.", { curiosity: "transition", change: "changes" }, { suite: "faded-memory" }, 1, { also: ["structure"] });
  P("danger-shadows", "When danger rises, the shadows deepen", "Rising fear is followed by deeper shadows within two beats.", { curiosity: "emotion", slider: "setting", is: "fearful" }, { curiosity: "lightingLens", slider: "shadows", is: "deep" }, 2, { also: ["emotion"] });
  P("warm-reunion", "A reunion warms the color", "When characters reconcile, the picture warms within two beats.", { curiosity: "emotionGap", slider: "closing", is: "closing" }, { curiosity: "colorGrade", slider: "warmth", is: "warm" }, 2, { also: ["emotion"] });

  DB.proximitySuite({ id: "light-follows-feeling", label: "Light follows feeling", workspace: W, also: ["emotion"], plain: "The light and color change with what the characters feel.", members: ["drain-on-loss", "danger-shadows", "warm-reunion", "joy-light-warms"] });
})(typeof window !== "undefined" ? window.CuriosityDB : require("./curiosity-db.js"));
