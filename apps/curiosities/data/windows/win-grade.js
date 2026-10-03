/* Filters: a window for every curiosity whose home is Filters on the Screen. */
(function (W) {
  const WHEEL = { neutral: "#9a9a9a", "cool blue": "#3a6fd9", teal: "#2a9d9a", green: "#3fa55b", "warm orange": "#f08a2c", magenta: "#c93a9a" };

  W.add("filterLook", {
    sliders: [
      ["fadeIn", "Time to fade in", [0, 10, "s"], "Seconds the filter takes to come in over the clip.", { from: 0, to: 2 }],
      ["keepSkin", "Keep skin natural", ["no", "a little", "fully"], "Whether faces keep their real color under the filter."],
      ["punch", "Extra punch", [-50, 50, ""], "Adds or takes away contrast on top of the filter.", { from: 0, to: 0 }],
      ["followsMood", "Follows the mood", ["fixed", "a little", "closely"], "Whether the filter strength rises and falls with the scene's feeling."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", natural: "🌿", "warm film": "🌅", "cool film": "❄️", "black and white": "⚫", vintage: "📻", faded: "🌫️", "high contrast": "◐", "teal and orange": "🍊", pastel: "🍬", night: "🌙", dreamy: "☁️" } },
        { face: "dial", slider: "strength" },
        { face: "ladder", slider: "scope" },
      ],
      groups: [
        { label: "The filter", sliders: ["setting", "strength", "punch", "keepSkin"] },
        { label: "Where and when", sliders: ["scope", "fadeIn", "followsMood"] },
      ],
      presets: [
        { label: "Mad Max blockbuster", plain: "Strong teal and orange across the whole film.", set: { setting: "teal and orange", strength: 85, scope: "the whole film", punch: 20, keepSkin: "a little" } },
        { label: "Warm home movie memory", plain: "A soft warm film look for one remembered scene.", set: { setting: "warm film", strength: 60, scope: "the scene", fadeIn: 3 } },
        { label: "Noir black and white", plain: "Full black and white with extra punch.", set: { setting: "black and white", strength: 100, punch: 30, keepSkin: "no" } },
      ],
    },
  });

  W.add("retroEffect", {
    sliders: [
      ["jitter", "Picture shake", ["steady", "slight", "wobbly", "jumpy"], "How much the picture wobbles in the frame like old film in a projector."],
      ["flicker", "Flicker", [0, 100, "%"], "How much the brightness pulses from frame to frame."],
      ["colorFade", "Faded color", ["fresh", "a little faded", "washed out", "nearly gone"], "How much the color has aged and bled away."],
      ["choppy", "Choppiness", ["smooth", "a little choppy", "old-projector choppy"], "Whether motion looks smooth or stutters like old footage."],
      ["showsUp", "When it appears", ["whole film", "memories only", "sudden flashes", "fades in slowly"], "When the old-format look comes into the film.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", "VHS tape": "📼", "retro film": "🎞️", projector: "📽️", "retro flicker": "💡", "nostalgic light": "🌇", "chalk graffiti": "🖍️", "white noise": "📺", "black noise": "⬛", "pink burn": "🔥", "old film": "🎬", "home video": "📹" } },
        { face: "ladder", slider: "era" },
        { face: "mixer", sliders: ["wear", "flicker"] },
      ],
      groups: [
        { label: "The format", sliders: ["setting", "era"] },
        { label: "How worn", sliders: ["wear", "colorFade", "flicker", "jitter", "choppy"] },
        { label: "When", sliders: ["showsUp"] },
      ],
      presets: [
        { label: "Found-footage VHS", plain: "A 1990s camcorder tape, worn and jittery.", set: { setting: "VHS tape", era: "1990s", wear: 60, jitter: "wobbly", colorFade: "a little faded" } },
        { label: "Silent-era projector", plain: "Flickering, jumpy, faded film from the 1920s.", set: { setting: "projector", era: "1920s", flicker: 80, jitter: "jumpy", choppy: "old-projector choppy", colorFade: "nearly gone" } },
        { label: "Childhood flashback", plain: "Warm 1970s home movies only in memories.", set: { setting: "home video", era: "1970s", wear: 40, showsUp: "memories only" } },
      ],
    },
  });

  W.add("exposure", {
    sliders: [
      ["adjust", "How fast eyes adjust", ["snap", "quick", "slow", "very slow"], "How quickly the picture settles after a jump into light or dark, like eyes adjusting."],
      ["faceReadable", "Keep the face readable", ["no", "a little", "always"], "Whether the face is kept visible however dark or bright the rest gets."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["brightness", "highlights", "shadows"] },
      ],
      groups: [
        { label: "Overall", sliders: ["setting", "brightness"] },
        { label: "Brights and darks", sliders: ["highlights", "shadows", "faceReadable"] },
        { label: "Over time", sliders: ["adjust"] },
      ],
      presets: [
        { label: "Stepping into sunlight", plain: "Blown out white, slowly settling as eyes adjust.", set: { setting: "blown out", brightness: 40, highlights: 50, adjust: "slow" } },
        { label: "Horror basement", plain: "Deep dark with only the face showing.", set: { setting: "very dark", shadows: -40, brightness: -30, faceReadable: "always" } },
        { label: "Clean daylight", plain: "Normal, balanced brightness.", set: { setting: "normal", brightness: 0, highlights: 0, shadows: 0 } },
      ],
    },
  });

  W.add("whiteBalance", {
    sliders: [
      ["shiftTime", "Time to change", [0, 30, "s"], "Seconds the warmth takes to move to its new setting."],
      ["skinNeutral", "Faces stay natural", ["no", "a little", "fully"], "Whether faces keep their real color while the rest warms or cools."],
      ["splitTone", "Warm light, cool shadows", ["none", "a little", "strong"], "Shadows pushed blue while the bright parts stay warm."],
      ["matchTo", "Set to match", ["the camera's guess", "the window", "the lamps", "a mood choice"], "What the warmth is judged against.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "cool", right: "warm" },
        { face: "dial", slider: "temperature" },
        { face: "swatches", slider: "tint", colors: { green: "#5fae6a", neutral: "#bdbdbd", magenta: "#c95aa8" } },
      ],
      groups: [
        { label: "Warmth", sliders: ["setting", "temperature", "tint", "matchTo"] },
        { label: "Faces and shadows", sliders: ["skinNeutral", "splitTone"] },
        { label: "Over time", sliders: ["shiftTime"] },
      ],
      presets: [
        { label: "Golden nostalgia", plain: "Warm and honeyed, faces still natural.", set: { setting: "very warm", temperature: 3200, skinNeutral: "a little", matchTo: "a mood choice" } },
        { label: "Cold thriller", plain: "Blue, slightly green, uneasy.", set: { setting: "cool", temperature: 8000, tint: "green", splitTone: "none" } },
        { label: "Sunset split tone", plain: "Warm highlights over blue shadows.", set: { setting: "warm", splitTone: "strong", skinNeutral: "fully" } },
      ],
    },
  });

  W.add("texture", {
    sliders: [
      ["clarity", "Clarity", [-50, 50, ""], "Makes small details pop out or melt into softness.", { from: 0, to: 0 }],
      ["grainSize", "Size of the grain", ["fine", "medium", "coarse"], "Whether the grain is a fine dust or big chunky specks."],
      ["halation", "Glow around bright lights", [0, 100, "%"], "A soft red-orange glow around bright spots, like old film."],
      ["vignetteMove", "Dark corners follow", ["fixed", "the subject", "the action"], "Whether the darkened corners stay put or shift to frame what matters."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["sharpen", "clarity", "grain", "halation", "vignette"] },
        { face: "tiles", slider: "grainSize", icons: { fine: "·", medium: "∴", coarse: "⁘" } },
      ],
      groups: [
        { label: "Sharp or soft", sliders: ["setting", "sharpen", "clarity"] },
        { label: "Film feel", sliders: ["grain", "grainSize", "halation"] },
        { label: "Framing the eye", sliders: ["vignette", "vignetteMove"] },
      ],
      presets: [
        { label: "16mm indie", plain: "Coarse grain, soft edges, glowing lights.", set: { setting: "gritty", grain: 70, grainSize: "coarse", halation: 50, sharpen: 10 } },
        { label: "Crisp commercial", plain: "Sharp, clean and grain-free.", set: { setting: "crisp", sharpen: 60, clarity: 25, grain: 0, vignette: 0 } },
        { label: "Dreamy soft focus", plain: "Soft detail and dark corners pulling us in.", set: { setting: "soft", clarity: -40, vignette: 60, vignetteMove: "the subject" } },
      ],
    },
  });

  W.add("colorMatch", {
    sliders: [
      ["closeness", "How close", [0, 100, "%"], "How tightly the shot is pulled toward the one it matches."],
      ["matchWhat", "What has to match", ["brightness", "color", "contrast", "everything"], "Which part of the look is made the same."],
      ["breakOn", "Break the match for", ["never", "a time jump", "a dream", "a big turn"], "The moment where a shot is allowed to look different on purpose.", { unordered: true }],
      ["smoothJumps", "Smooth the jumps", ["none", "gentle", "full"], "Whether color changes between shots are eased so the cut feels invisible."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { mismatched: "❌", close: "≈", matched: "✅", "deliberately different": "🎭" } },
        { face: "dial", slider: "closeness" },
        { face: "ladder", slider: "matchWhat" },
      ],
      groups: [
        { label: "The match", sliders: ["setting", "reference", "closeness", "matchWhat"] },
        { label: "Faces", sliders: ["skin"] },
        { label: "Across the cuts", sliders: ["smoothJumps", "breakOn"] },
      ],
      presets: [
        { label: "Invisible continuity", plain: "Every shot matches so the cuts disappear.", set: { setting: "matched", reference: "the scene's key shot", closeness: 95, matchWhat: "everything", smoothJumps: "full" } },
        { label: "Dream breaks the rules", plain: "Matched, until the dream looks different on purpose.", set: { setting: "matched", breakOn: "a dream", skin: "natural" } },
        { label: "Borrowed look", plain: "Matched to the look of a favorite film.", set: { setting: "close", reference: "an inspiration film", skin: "stylized" } },
      ],
    },
  });

  W.add("textureEffect", {
    sliders: [
      ["motion", "Texture moves", ["still", "slow crawl", "flickers", "boils"], "Whether the laid-over surface holds still or moves with time."],
      ["blend", "How it sits", ["behind the picture", "mixed in", "on top"], "Whether the texture hides under the picture or covers it."],
      ["paperTint", "Paper color", ["white", "cream", "yellowed", "brown"], "The color of the paper or surface laid over."],
      ["showsUp", "When it appears", ["whole film", "flashbacks", "title moments", "sudden bursts"], "When the texture is laid over the film.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", "torn paper": "📄", "wrinkled paper": "📃", grain: "🎞️", "silkscreen dots": "🔴", "dual tone": "🌗", polaroid: "📸", "old film": "🎬" } },
        { face: "dial", slider: "strength" },
        { face: "swatches", slider: "paperTint", colors: { white: "#f7f7f2", cream: "#f2e8cf", yellowed: "#e3cf8f", brown: "#a8835a" } },
      ],
      groups: [
        { label: "The texture", sliders: ["setting", "strength", "blend", "paperTint"] },
        { label: "Edges and motion", sliders: ["edges", "motion"] },
        { label: "When", sliders: ["showsUp"] },
      ],
      presets: [
        { label: "Scrapbook memory", plain: "Torn cream paper around flashbacks.", set: { setting: "torn paper", edges: "torn", paperTint: "cream", showsUp: "flashbacks" } },
        { label: "Pop-art silkscreen", plain: "Bold printed dots sitting on top.", set: { setting: "silkscreen dots", strength: 80, blend: "on top", motion: "flickers" } },
        { label: "Burned old reel", plain: "Old film with burned edges, boiling grain.", set: { setting: "old film", edges: "burned", motion: "boils", paperTint: "yellowed" } },
      ],
    },
  });

  W.add("filterFamily", {
    sliders: [
      ["pick", "Which one on the shelf", [1, 12, ""], "Which filter in the family, counting along the shelf.", { from: 1, to: 1 }],
      ["fadeIn", "Time to fade in", [0, 10, "s"], "Seconds the filter takes to come in.", { from: 0, to: 2 }],
      ["keepSkin", "Keep skin natural", ["no", "a little", "fully"], "Whether faces keep their real color under the filter."],
      ["sameAcross", "Same across the scene", ["each shot its own", "mostly", "exactly"], "Whether every shot in the scene uses the same filter."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { featured: "⭐", life: "☕", landscape: "🏞️", portrait: "🙂", mono: "⚫", movies: "🎬", retro: "📼", night: "🌙", cool: "❄️", warm: "🔥" } },
        { face: "dial", slider: "strength" },
        { face: "ladder", slider: "sameAcross" },
      ],
      groups: [
        { label: "The shelf", sliders: ["setting", "pick"] },
        { label: "How it sits", sliders: ["strength", "keepSkin", "fadeIn"] },
        { label: "Across the scene", sliders: ["sameAcross"] },
      ],
      presets: [
        { label: "Movie night look", plain: "A movies-shelf filter, the same in every shot.", set: { setting: "movies", strength: 80, sameAcross: "exactly" } },
        { label: "Travel vlog", plain: "Landscape filters, a gentle touch.", set: { setting: "landscape", strength: 50, keepSkin: "fully" } },
      ],
    },
  });

  W.add("lut", {
    sliders: [
      ["contrastTrim", "Contrast after the recipe", [-50, 50, ""], "Adds or takes away contrast after the recipe is applied.", { from: 0, to: 0 }],
      ["colorTrim", "Color after the recipe", [-50, 50, ""], "Turns the color amount up or down after the recipe.", { from: 0, to: 0 }],
      ["blendTime", "Time to blend in", [0, 10, "s"], "Seconds the recipe takes to fade in.", { from: 0, to: 2 }],
      ["keepSkin", "Keep skin natural", ["no", "a little", "fully"], "Whether faces keep their real color under the recipe."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "▫️", "film stock": "🎞️", "teal and orange": "🍊", "bleach bypass": "🥈", "day for night": "🌙", "warm print": "🌅", "cool print": "❄️", "log to normal": "🔁" } },
        { face: "dial", slider: "strength" },
        { face: "pad", x: "contrastTrim", y: "colorTrim", xLabel: "contrast", yLabel: "color" },
      ],
      groups: [
        { label: "The recipe", sliders: ["setting", "strength", "blendTime"] },
        { label: "Fine-tune after", sliders: ["contrastTrim", "colorTrim", "keepSkin"] },
      ],
      presets: [
        { label: "Day for night", plain: "Daylight footage turned into blue moonlight.", set: { setting: "day for night", strength: 90, contrastTrim: 15, colorTrim: -30 } },
        { label: "Fincher bleach bypass", plain: "Silvery, low color, hard contrast.", set: { setting: "bleach bypass", strength: 70, colorTrim: -20, contrastTrim: 20 } },
        { label: "Kodak film stock", plain: "A warm classic film recipe, faces protected.", set: { setting: "film stock", strength: 80, keepSkin: "a little" } },
      ],
    },
  });

  W.add("colorWheels", {
    sliders: [
      ["midHue", "Midtone color", ["neutral", "cool blue", "teal", "green", "warm orange", "magenta"], "The color pushed into the in-between brightness, where faces usually sit.", { unordered: true }],
      ["shadowLevel", "Shadow brightness", [-50, 50, ""], "Lifts or sinks the dark parts.", { from: 0, to: 0 }],
      ["highlightLevel", "Highlight brightness", [-50, 50, ""], "Lifts or lowers the bright parts.", { from: 0, to: 0 }],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "shadowHue", colors: WHEEL },
        { face: "swatches", slider: "highlightHue", colors: WHEEL },
        { face: "mixer", sliders: ["shadowLevel", "highlightLevel", "strength"] },
      ],
      groups: [
        { label: "Which wheel", sliders: ["setting", "strength"] },
        { label: "Colors", sliders: ["shadowHue", "midHue", "highlightHue"] },
        { label: "Brightness", sliders: ["shadowLevel", "highlightLevel"] },
      ],
      presets: [
        { label: "Teal shadows, warm highlights", plain: "The blockbuster split between cool darks and warm brights.", set: { setting: "all three", shadowHue: "teal", highlightHue: "warm orange", strength: 60 } },
        { label: "Sickly green", plain: "Green pushed into the middle, like a fluorescent nightmare.", set: { setting: "midtones", midHue: "green", strength: 40 } },
      ],
    },
  });

  W.add("colorCurves", {
    sliders: [
      ["blackLift", "Lift the blacks", [0, 50, ""], "Raises the darkest point so blacks look faded and milky."],
      ["whiteCap", "Lower the whites", [0, 50, ""], "Pulls the brightest point down so whites look dull and soft."],
      ["midPoint", "Midtones", [-50, 50, ""], "Brightens or darkens the middle of the picture without touching black and white.", { from: 0, to: 0 }],
      ["curveStrength", "Strength", [0, 100, "%"], "How much of the curve is applied."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { flat: "➖", "gentle S": "〰️", "strong S": "∿", "faded blacks": "🌫️", "crushed blacks": "⬛", inverted: "🔄" } },
        { face: "mixer", sliders: ["blackLift", "midPoint", "whiteCap"] },
        { face: "swatches", slider: "channel", colors: { all: "#cccccc", red: "#d93a3a", green: "#3fa55b", blue: "#3a6fd9", "hue vs saturation": "#8a4fd0" } },
      ],
      groups: [
        { label: "The curve", sliders: ["setting", "channel", "curveStrength"] },
        { label: "Points on the curve", sliders: ["blackLift", "midPoint", "whiteCap"] },
      ],
      presets: [
        { label: "Faded indie film", plain: "Lifted milky blacks and soft whites.", set: { setting: "faded blacks", blackLift: 25, whiteCap: 10, curveStrength: 80 } },
        { label: "Punchy music video", plain: "A strong S curve with crushed blacks.", set: { setting: "strong S", blackLift: 0, curveStrength: 100 } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
