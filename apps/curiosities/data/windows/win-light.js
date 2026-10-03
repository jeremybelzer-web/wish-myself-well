/* Light & color: a window for every curiosity whose home is Light & color on the Screen. */
(function (W) {
  const HUES = { red: "#d93a3a", orange: "#f08a2c", yellow: "#f2cf3a", green: "#3fa55b", teal: "#2a9d9a", blue: "#3a6fd9", purple: "#8a4fd0", pink: "#f07aa8" };

  W.add("lightChange", {
    sliders: [
      ["trigger", "What sets it off", ["nothing", "a switch", "a door", "a cloud", "a character"], "The thing in the story that makes the light change.", { unordered: true }],
      ["lead", "Before or after the beat", [-2, 2, "s"], "Whether the light moves a moment before the cut or action, or just after it.", { from: 0, to: 0 }],
      ["direction", "Brighter or darker", ["much darker", "darker", "same", "brighter", "much brighter"], "Which way the light goes when it changes."],
      ["eyeLead", "Where it pulls the eye", ["nowhere", "to a corner", "to a face", "to what comes next"], "Where the audience looks once the light has changed."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { never: "⏸️", "on the cut": "✂️", "on the action": "🏃", "during the hold": "⏳" } },
        { face: "balance", slider: "direction", left: "darker", right: "brighter" },
        { face: "dial", slider: "lead" },
      ],
      groups: [
        { label: "When it happens", sliders: ["setting", "lead", "trigger"] },
        { label: "How it changes", sliders: ["size", "speed", "direction"] },
        { label: "Steering the eye", sliders: ["eyeLead"] },
      ],
      presets: [
        { label: "Someone flips the switch", plain: "A character hits the light and the room snaps bright.", set: { setting: "on the action", trigger: "a switch", direction: "much brighter", speed: 5, size: 5 } },
        { label: "Cloud passes over", plain: "The light quietly dims while the shot holds.", set: { setting: "during the hold", trigger: "a cloud", direction: "darker", speed: 1, size: 2 } },
        { label: "Horror door opens", plain: "A door swings and light falls on the face waiting there.", set: { setting: "on the action", trigger: "a door", direction: "brighter", eyeLead: "to a face", lead: 0.5 } },
      ],
    },
  });

  W.add("timeOfDay", {
    sliders: [
      ["sunHeight", "How high the sun is", [0, 90, "°"], "Low sun makes long golden light; high sun makes short harsh shadows."],
      ["sky", "Sky", ["clear", "hazy", "cloudy", "overcast", "stormy"], "How much cloud sits between the sun and the scene."],
      ["shadowLength", "Shadow length", ["short", "medium", "long", "stretched"], "How long the shadows fall across the ground."],
      ["clockPace", "How fast time passes", ["frozen", "real time", "fast", "time-lapse"], "Whether the light stays put or the day races by during the scene."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { dawn: "🌅", day: "☀️", dusk: "🌇", night: "🌙" } },
        { face: "dial", slider: "hour" },
        { face: "pad", x: "sunHeight", y: "hour", xLabel: "sun height", yLabel: "hour" },
      ],
      groups: [
        { label: "The time", sliders: ["setting", "hour", "clockPace", "change"] },
        { label: "The sun and sky", sliders: ["sunHeight", "sky", "shadowLength"] },
      ],
      presets: [
        { label: "Magic hour romance", plain: "Low golden sun and long shadows, like Days of Heaven.", set: { setting: "dusk", hour: 19, sunHeight: 5, shadowLength: "stretched", sky: "clear" } },
        { label: "High noon showdown", plain: "The sun straight overhead, no shade anywhere.", set: { setting: "day", hour: 12, sunHeight: 85, shadowLength: "short", sky: "clear" } },
        { label: "Night falls as they talk", plain: "Dusk turns to night over the course of the scene.", set: { setting: "dusk", clockPace: "fast", sky: "hazy" } },
      ],
    },
  });

  W.add("practicalInFrame", {
    sliders: [
      ["kind", "Kind of source", ["lamp", "candle", "screen", "neon sign", "fire", "window"], "What the visible light in the shot is.", { unordered: true }],
      ["doesWork", "Lights the faces", ["just decoration", "a little", "the main light"], "Whether the lamp in the shot really lights the people or just sits there."],
      ["flicker", "Flicker", ["steady", "faint flicker", "flicker", "sputters"], "Whether the source holds still or wavers."],
      ["switchMoment", "Turns on or off", ["stays on", "turns on", "turns off", "on and off"], "Whether the source changes state during the shot.", { unordered: true }],
      ["drawsEye", "Draws the eye", ["hides in the back", "sits there", "catches the eye", "steals the shot"], "How much the glowing thing pulls attention."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { lamp: "💡", candle: "🕯️", screen: "📺", "neon sign": "🪧", fire: "🔥", window: "🪟" } },
        { face: "mixer", sliders: ["count", "brightness"] },
        { face: "ladder", slider: "drawsEye" },
      ],
      groups: [
        { label: "What is in the shot", sliders: ["setting", "kind", "count"] },
        { label: "How it shines", sliders: ["brightness", "doesWork", "flicker", "switchMoment"] },
        { label: "Steering the eye", sliders: ["drawsEye"] },
      ],
      presets: [
        { label: "Barry Lyndon candlelight", plain: "Rooms lit only by the candles you can see.", set: { setting: "yes", kind: "candle", count: 8, doesWork: "the main light", flicker: "faint flicker" } },
        { label: "Lonely TV glow", plain: "One screen in a dark room is the only light on the face.", set: { setting: "yes", kind: "screen", count: 1, doesWork: "the main light", flicker: "flicker" } },
        { label: "Neon noir street", plain: "Signs buzz in the background and catch the eye.", set: { setting: "yes", kind: "neon sign", count: 4, doesWork: "a little", drawsEye: "catches the eye" } },
      ],
    },
  });

  W.add("wetness", {
    sliders: [
      ["rainFall", "Rain falling", ["none", "drizzle", "rain", "downpour"], "How much rain is coming down in the shot."],
      ["puddles", "Puddles", ["none", "a few", "many", "flooded"], "How much standing water lies around."],
      ["reflections", "Reflections in the wet", [0, 100, "%"], "How much the wet ground mirrors the lights around it."],
      ["dryingPace", "Drying or soaking", ["drying out", "steady", "getting wetter"], "Whether things are drying off or getting wetter as the scene goes."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "rainFall" },
        { face: "dial", slider: "reflections" },
        { face: "balance", slider: "dryingPace", left: "drying", right: "soaking" },
      ],
      groups: [
        { label: "How wet", sliders: ["setting", "drips", "puddles", "reflections"] },
        { label: "Weather over time", sliders: ["rainFall", "dryingPace", "change"] },
      ],
      presets: [
        { label: "Blade Runner streets", plain: "Soaked pavement shining with every sign.", set: { setting: "soaked", rainFall: "rain", puddles: "many", reflections: 90 } },
        { label: "After the storm", plain: "Damp streets drying in the morning sun.", set: { setting: "damp", rainFall: "none", puddles: "a few", dryingPace: "drying out" } },
        { label: "Kiss in the downpour", plain: "Rain builds to a downpour around the couple.", set: { setting: "soaked", rainFall: "downpour", drips: 5, dryingPace: "getting wetter" } },
      ],
    },
  });

  W.add("glow", {
    sliders: [
      ["pulse", "Pulse", ["steady", "slow breath", "heartbeat", "flicker"], "Whether the glow holds still or beats like something alive."],
      ["spill", "Glow on the surroundings", ["none", "a halo", "lights the faces", "floods the room"], "How far the glow reaches onto the things around it."],
      ["bloom", "Soft haze around it", [0, 100, "%"], "How much soft light blooms around the glowing thing."],
      ["pull", "Pulls the eye", ["background", "noticed", "center of attention"], "How strongly the glow grabs the audience."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "color", colors: { warm: "#ffb347", white: "#f5f5f0", cool: "#9ecbff", colored: "#c26bff" } },
        { face: "dial", slider: "bloom" },
        { face: "ladder", slider: "spill" },
      ],
      groups: [
        { label: "What glows", sliders: ["setting", "color", "brightness"] },
        { label: "How it glows", sliders: ["pulse", "bloom", "spill"] },
        { label: "Steering the eye", sliders: ["pull"] },
      ],
      presets: [
        { label: "Pulp Fiction briefcase", plain: "A golden glow from an object nobody explains.", set: { setting: "object", color: "warm", spill: "lights the faces", pull: "center of attention", pulse: "steady" } },
        { label: "E.T. heartlight", plain: "A soft red glow that beats like a heart.", set: { setting: "person", color: "colored", pulse: "heartbeat", bloom: 60 } },
        { label: "Sci-fi control room", plain: "Cool screens fill the room with gentle light.", set: { setting: "room", color: "cool", spill: "floods the room", pull: "background" } },
      ],
    },
  });

  W.add("wear", {
    sliders: [
      ["spread", "Where the wear is", ["one spot", "edges", "most surfaces", "everything"], "How much of the place or thing shows wear."],
      ["age", "How old it looks", ["months", "years", "decades", "a century"], "How long the wear seems to have been building."],
      ["worsens", "Over the film", ["gets cleaner", "stays", "slowly worse", "falls apart"], "Whether the wear grows or fades as the story goes on."],
      ["story", "Tells a story", ["background detail", "hints at the past", "a clue we're shown"], "How much the camera makes us notice the wear."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { dust: "💨", scratches: "✂️", rust: "🟤", stains: "☕" } },
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "howMuch" },
      ],
      groups: [
        { label: "The wear", sliders: ["setting", "kind", "howMuch", "spread", "age"] },
        { label: "Over time", sliders: ["worsens"] },
        { label: "Steering the eye", sliders: ["story"] },
      ],
      presets: [
        { label: "Star Wars used future", plain: "Everything lived-in and scuffed, never shiny new.", set: { setting: "used", kind: "scratches", spread: "most surfaces", age: "decades" } },
        { label: "Haunted house", plain: "Dust and rot everywhere, a century gone.", set: { setting: "ruined", kind: "dust", spread: "everything", age: "a century", howMuch: 5 } },
        { label: "The stain that matters", plain: "One stain the camera keeps finding.", set: { setting: "used", kind: "stains", spread: "one spot", story: "a clue we're shown" } },
      ],
    },
  });

  W.add("colorAccent", {
    sliders: [
      ["accentHue", "The color", ["red", "orange", "yellow", "green", "blue", "purple"], "Which color is the one that pops.", { unordered: true }],
      ["carrier", "What carries it", ["clothing", "a prop", "a light", "a place"], "What the standout color is on.", { unordered: true }],
      ["recurs", "How often it comes back", ["once", "now and then", "every scene", "always there"], "How often the color returns over the film."],
      ["restColor", "Everything else", ["full color", "muted", "nearly gray", "black and white"], "How quiet the rest of the picture is around the accent."],
      ["leads", "Where it leads the eye", ["nowhere", "to a person", "to a clue", "to what's next"], "What the audience is steered toward by the color."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "accentHue", colors: { red: HUES.red, orange: HUES.orange, yellow: HUES.yellow, green: HUES.green, blue: HUES.blue, purple: HUES.purple } },
        { face: "tiles", slider: "carrier", icons: { clothing: "🧥", "a prop": "🎈", "a light": "💡", "a place": "🚪" } },
        { face: "ladder", slider: "restColor" },
      ],
      groups: [
        { label: "The accent", sliders: ["setting", "accentHue", "carrier", "noticeable"] },
        { label: "Around it", sliders: ["restColor"] },
        { label: "Over time and attention", sliders: ["recurs", "leads", "change"] },
      ],
      presets: [
        { label: "Schindler's List red coat", plain: "One red coat in a black-and-white world.", set: { setting: "one clear thing", accentHue: "red", carrier: "clothing", restColor: "black and white", recurs: "once", leads: "to a person" } },
        { label: "The Sixth Sense red", plain: "Small touches of red warn that something is near.", set: { setting: "a small spot", accentHue: "red", carrier: "a prop", recurs: "now and then", leads: "to a clue" } },
        { label: "Yellow raincoat", plain: "A bright coat you can follow through any crowd.", set: { setting: "one thing in a strong color", accentHue: "yellow", carrier: "clothing", restColor: "muted", recurs: "every scene" } },
      ],
    },
  });

  W.add("colorDrift", {
    sliders: [
      ["driftWay", "Cooler or warmer", ["much cooler", "cooler", "same", "warmer", "much warmer"], "Which way the color moves as the scene goes on."],
      ["driftTime", "How long it takes", [0, 120, "s"], "Seconds the change takes from start to finish."],
      ["startsAt", "When it starts", ["from the first shot", "midway", "at the turn", "near the end"], "The point in the scene where the color begins to move."],
      ["follows", "What it follows", ["the clock", "the mood", "a character", "the story's turn"], "What the color change is tied to.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "balance", slider: "driftWay", left: "cooler", right: "warmer" },
        { face: "dial", slider: "driftTime" },
        { face: "tiles", slider: "follows", icons: { "the clock": "🕰️", "the mood": "💭", "a character": "🧍", "the story's turn": "↪️" } },
      ],
      groups: [
        { label: "The change", sliders: ["setting", "driftWay", "noticeable"] },
        { label: "Timing", sliders: ["startsAt", "driftTime", "change"] },
        { label: "Why it moves", sliders: ["follows"] },
      ],
      presets: [
        { label: "Warmth creeps in", plain: "A cold scene slowly warms as two people connect.", set: { setting: "slow drift", driftWay: "warmer", follows: "the mood", startsAt: "from the first shot", driftTime: 90 } },
        { label: "Sudden chill", plain: "The color drops cold the moment the truth comes out.", set: { setting: "sudden change", driftWay: "much cooler", startsAt: "at the turn", driftTime: 1, follows: "the story's turn" } },
      ],
    },
  });

  W.add("lightingLens", {
    sliders: [
      ["eyeTo", "Light leads the eye to", ["nothing special", "the face", "the hands", "a doorway", "the background"], "The spot the brightest light points the audience toward.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "compass", slider: "key", angles: { front: 0, side: 90, back: 180, under: 270 } },
        { face: "ladder", slider: "mood" },
        { face: "tiles", slider: "movement", icons: { still: "⏸️", flickers: "🕯️", sways: "🌿", sweeps: "🔦", strobes: "⚡" } },
      ],
      groups: [
        { label: "Where it comes from", sliders: ["key", "motivation", "lightCount", "rim", "eyeTo"] },
        { label: "Its character", sliders: ["mood", "softness", "contrast", "valueKey", "shadows", "faceLight"] },
        { label: "Color and air", sliders: ["colorTemp", "colorAccent", "atmosphere"] },
        { label: "Shape and movement", sliders: ["lightShape", "movement"] },
      ],
      presets: [
        { label: "Film noir", plain: "Hard side light through blinds, deep shadows.", set: { mood: "dark and harsh", key: "side", softness: "hard", contrast: 6, valueKey: "low key", lightShape: "blinds", shadows: "the shadows tell the story" } },
        { label: "Rom-com sunshine", plain: "Soft, bright, flattering light on every face.", set: { mood: "bright and warm", key: "front", softness: "soft", contrast: 1, valueKey: "high key", faceLight: "fully lit" } },
        { label: "Spielberg beams", plain: "Backlight cutting through haze in visible shafts.", set: { key: "back", atmosphere: "beams", rim: "strong", motivation: "a window", eyeTo: "a doorway" } },
        { label: "Campfire story", plain: "Warm flickering light from below.", set: { key: "under", motivation: "a fire or candle", movement: "flickers", colorTemp: "warm practical", mood: "dim" } },
      ],
    },
  });

  W.add("lightRigLens", {
    window: {
      faces: [
        { face: "tiles", slider: "lightType", icons: { sun: "☀️", "open sky": "🌤️", window: "🪟", spotlight: "🔦", "bare bulb": "💡", "glowing object": "✨" } },
        { face: "ladder", slider: "ratio" },
        { face: "ladder", slider: "falloff" },
      ],
      groups: [
        { label: "The main light", sliders: ["lightType", "softness", "shape", "practical"] },
        { label: "Light and dark", sliders: ["ratio", "falloff", "bounce"] },
        { label: "Who it touches", sliders: ["linking", "rim", "haze"] },
      ],
      presets: [
        { label: "Vermeer window", plain: "Soft daylight from one window, gently bouncing.", set: { lightType: "window", softness: "soft", ratio: "gentle", bounce: "rich bounce", falloff: "fades across the room" } },
        { label: "Interrogation bulb", plain: "One bare bulb, a black void beyond the table.", set: { lightType: "bare bulb", softness: "hard", ratio: "one side black", falloff: "drops off fast", linking: "only the hero", bounce: "none" } },
        { label: "Stage spotlight", plain: "A hard spot finds the performer, nothing else.", set: { lightType: "spotlight", softness: "hard", linking: "only the hero", haze: "beams", falloff: "drops off fast" } },
      ],
    },
  });

  W.add("skinLens", {
    sliders: [
      ["flushTiming", "When the face colors", ["never", "slowly", "with the emotion", "suddenly"], "How the color rises in the face as feelings change."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "flush", colors: { pale: "#efe2d8", natural: "#e0b394", flushed: "#e48b7a", "bright red": "#d0453a" } },
        { face: "ladder", slider: "oil" },
        { face: "dial", slider: "skinLight" },
      ],
      groups: [
        { label: "Light in the skin", sliders: ["glowThrough", "skinLight"] },
        { label: "Surface", sliders: ["oil", "detail"] },
        { label: "Color in the face", sliders: ["flush", "flushTiming"] },
      ],
      presets: [
        { label: "Beauty commercial", plain: "Smooth, glowing, perfectly dry skin.", set: { glowThrough: "soft glow", oil: "dry", detail: "airbrushed", flush: "natural" } },
        { label: "Sweaty thriller", plain: "Every pore and bead of sweat under pressure.", set: { oil: "sweaty", detail: "every pore", flush: "flushed", flushTiming: "with the emotion" } },
        { label: "Backlit ears", plain: "Sun behind the head makes the ears glow red.", set: { glowThrough: "ears glow red", skinLight: 5, oil: "dewy" } },
      ],
    },
  });

  W.add("key", {
    sliders: [
      ["litSide", "Lit side of the face", ["side facing us", "the middle", "side turned away"], "Lighting the far side of the face carves it; the near side flattens it."],
      ["eyeLight", "Sparkle in the eyes", ["none", "faint", "bright"], "A small reflection of the light that makes eyes look alive."],
      ["swing", "Light moves around", ["stays put", "creeps", "swings", "circles"], "Whether the main light travels around the face during the shot."],
      ["motivatedBy", "What seems to make it", ["nothing seen", "a window", "a lamp", "a fire", "a screen"], "The source in the story that the main light pretends to come from.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "compass", slider: "setting", angles: { front: 0, side: 90, back: 180, under: 270 } },
        { face: "pad", x: "height", y: "ratio", xLabel: "height", yLabel: "bright to dark" },
      ],
      groups: [
        { label: "Direction", sliders: ["setting", "height", "litSide", "swing"] },
        { label: "Strength and sparkle", sliders: ["ratio", "eyeLight"] },
        { label: "Where it comes from", sliders: ["motivatedBy"] },
      ],
      presets: [
        { label: "Rembrandt portrait", plain: "High side light with a small triangle on the dark cheek.", set: { setting: "side", height: 45, ratio: 4, litSide: "side turned away", eyeLight: "faint" } },
        { label: "Flashlight from below", plain: "The campfire-horror look from under the chin.", set: { setting: "under", height: 0, ratio: 16, eyeLight: "bright" } },
        { label: "Old Hollywood glamour", plain: "High front light, soft shadows, sparkling eyes.", set: { setting: "front", height: 60, ratio: 2, eyeLight: "bright" } },
      ],
    },
  });

  W.add("contrast", {
    sliders: [
      ["blacks", "Darkest parts", ["milky", "soft black", "rich black", "crushed"], "Whether the darkest parts look faded gray or solid black."],
      ["brights", "Brightest parts", ["held", "gentle", "bright", "burned out"], "Whether the brightest parts keep their detail or go pure white."],
      ["faceVsRoom", "Face against the room", ["darker than the room", "same", "brighter than the room"], "Whether the face stands out from or sinks into its surroundings."],
      ["buildUp", "Over the scene", ["softens", "steady", "slowly harder", "snaps harder"], "Whether the contrast grows or eases as the scene plays."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "faceVsRoom", left: "face sinks", right: "face pops" },
        { face: "ladder", slider: "blacks" },
      ],
      groups: [
        { label: "Light and shadow", sliders: ["setting", "shadowFill", "blacks", "brights"] },
        { label: "Steering the eye", sliders: ["faceVsRoom"] },
        { label: "Over time", sliders: ["buildUp", "change"] },
      ],
      presets: [
        { label: "The Godfather office", plain: "Deep blacks, faces half swallowed by dark.", set: { setting: 6, shadowFill: "black", blacks: "crushed", faceVsRoom: "same" } },
        { label: "Faded indie memory", plain: "Low contrast with soft, milky blacks.", set: { setting: 1, shadowFill: "readable", blacks: "milky", brights: "gentle" } },
        { label: "Tension tightens", plain: "Shadows grow harder as the scene closes in.", set: { buildUp: "slowly harder", faceVsRoom: "brighter than the room", setting: 4 } },
      ],
    },
  });

  W.add("colorTemp", {
    sliders: [
      ["faceTemp", "Warmth on faces", ["cooler than the room", "same", "warmer than the room"], "Whether faces sit warmer or cooler than everything around them."],
      ["splitTemp", "Warm and cool together", ["one color", "a hint of both", "warm in, cool out", "strong split"], "How much warm and cool light share the shot, like lamps against blue night."],
      ["cast", "Green or pink cast", ["green", "neutral", "pink"], "A slight green tint (old office lights) or pink tint in the light."],
      ["shiftWith", "Shifts with", ["nothing", "the time of day", "the mood", "a character"], "What the color of the light follows when it changes.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "setting", colors: { "warm practical": "#ffb066", mixed: "#d8c8b8", "cold day": "#a8c8f0" } },
        { face: "dial", slider: "kelvin" },
        { face: "balance", slider: "faceTemp", left: "cool face", right: "warm face" },
      ],
      groups: [
        { label: "The color of the light", sliders: ["setting", "kelvin", "cast"] },
        { label: "Mixing", sliders: ["faceTemp", "splitTemp"] },
        { label: "Over time", sliders: ["shiftWith", "change"] },
      ],
      presets: [
        { label: "Cozy lamplit home", plain: "Warm tungsten lamps, nothing cold.", set: { setting: "warm practical", kelvin: 2800, splitTemp: "one color" } },
        { label: "Blue night, warm window", plain: "Moonlit blue outside, a warm glow from indoors.", set: { setting: "mixed", splitTemp: "strong split", faceTemp: "warmer than the room" } },
        { label: "Fluorescent office", plain: "Cold, slightly green overhead light.", set: { setting: "cold day", kelvin: 4500, cast: "green" } },
      ],
    },
  });

  W.add("lighting", {
    sliders: [
      ["pools", "Pools of light", ["even all over", "a few pools", "one pool", "a single spot"], "Whether the light spreads evenly or gathers in islands."],
      ["darkPlace", "Where darkness sits", ["corners", "background", "behind the people", "over the faces"], "Which parts of the frame are left in shadow."],
      ["picksOut", "Picks out who matters", ["no one", "a little", "clearly", "only them"], "How much the light singles out the important person."],
      ["shiftCue", "When it shifts", ["on a cut", "on an entrance", "on a line", "on a sound"], "The moment that makes the room's lighting change.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { dusk: "🌆", flat: "⬜", practical: "💡", hard: "🔦", moon: "🌕" } },
        { face: "dial", slider: "strength" },
        { face: "ladder", slider: "pools" },
      ],
      groups: [
        { label: "The look", sliders: ["setting", "strength"] },
        { label: "Light and dark in the room", sliders: ["pools", "darkPlace", "picksOut"] },
        { label: "Over time", sliders: ["shiftCue", "change"] },
      ],
      presets: [
        { label: "Moonlit bedroom", plain: "Cool blue light, corners in darkness.", set: { setting: "moon", strength: 3, darkPlace: "corners", pools: "a few pools" } },
        { label: "Poker table", plain: "One hard pool of light over the players.", set: { setting: "hard", pools: "one pool", darkPlace: "background", picksOut: "clearly" } },
        { label: "Sitcom living room", plain: "Bright, even and flat so everyone reads.", set: { setting: "flat", pools: "even all over", picksOut: "no one", strength: 4 } },
      ],
    },
  });

  W.add("softness", {
    sliders: [
      ["edge", "Edge of the shadows", ["razor sharp", "crisp", "feathered", "no edge"], "How sharp the line is between light and shadow."],
      ["distance", "Light close or far", [0, 10, "m"], "How far the light is from the person; closer feels softer and falls off faster."],
      ["diffusion", "Light through cloth", [0, 100, "%"], "How much the light is spread through a sheet or paper before it lands."],
      ["wrap", "Wraps around the face", ["none", "a little", "halfway", "all the way"], "How far the light curls around the face toward the far side."],
    ],
    window: {
      faces: [
        { face: "pad", x: "size", y: "distance", xLabel: "size of source", yLabel: "distance" },
        { face: "ladder", slider: "edge" },
      ],
      groups: [
        { label: "Hard or soft", sliders: ["setting", "edge", "wrap"] },
        { label: "The source", sliders: ["size", "distance", "diffusion", "change"] },
      ],
      presets: [
        { label: "Desert sun", plain: "Tiny far-away source, razor shadows.", set: { setting: "hard", size: 0, distance: 10, edge: "razor sharp", diffusion: 0 } },
        { label: "Beauty soft box", plain: "A big diffused light close to the face.", set: { setting: "soft", size: 5, distance: 1, diffusion: 100, wrap: "all the way" } },
        { label: "Overcast day", plain: "The whole sky is the light; shadows barely there.", set: { setting: "soft", size: 5, edge: "no edge", wrap: "halfway" } },
      ],
    },
  });

  W.add("rim", {
    sliders: [
      ["rimSide", "Which side", ["left", "both", "right"], "Which edge of the person the outline of light sits on."],
      ["width", "How thick the edge", ["hairline", "thin", "wide", "halo"], "How wide the band of edge light is."],
      ["separate", "Lifts them off the back", ["blends in", "a little", "clearly", "pops right out"], "How much the edge light pulls the person forward from the background."],
      ["appears", "When it appears", ["always", "when they turn", "when they matter", "at the climax"], "Whether the edge light is constant or saved for key moments."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "rimSide", left: "left", right: "right" },
        { face: "swatches", slider: "color", colors: { "matches the key": "#f2e6d0", warmer: "#ffb35c", cooler: "#8ec0ff", colored: "#d36cff" } },
        { face: "dial", slider: "intensity" },
      ],
      groups: [
        { label: "The edge light", sliders: ["setting", "intensity", "width", "rimSide", "color"] },
        { label: "Steering the eye", sliders: ["separate", "appears"] },
      ],
      presets: [
        { label: "Heroic halo", plain: "A bright backlight outlines the hero in gold.", set: { setting: "strong", width: "halo", color: "warmer", separate: "pops right out", appears: "when they matter" } },
        { label: "Night thriller edge", plain: "A thin cold line keeps the figure out of the dark.", set: { setting: "thin", width: "hairline", color: "cooler", separate: "a little" } },
      ],
    },
  });

  W.add("lightCount", {
    sliders: [
      ["fill", "Fill on the dark side", ["none", "a little", "even fill"], "A softer second light that lifts the shadow side of the face."],
      ["bgLights", "Background lights", ["none", "one", "a few", "many"], "Lights that pick out the room behind the people."],
      ["edgeLights", "Edge and hair lights", ["none", "one", "two", "three or more"], "Lights from behind that outline heads and shoulders."],
      ["comeAndGo", "Lights come and go", ["fixed", "one switches", "several switch", "all change"], "Whether lights turn on and off during the scene."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "mixer", sliders: ["fill", "bgLights", "edgeLights"] },
      ],
      groups: [
        { label: "How many", sliders: ["setting", "motivated", "noticeable"] },
        { label: "What they do", sliders: ["fill", "bgLights", "edgeLights"] },
        { label: "Over time", sliders: ["comeAndGo"] },
      ],
      presets: [
        { label: "One-light drama", plain: "A single source, nothing to soften it.", set: { setting: 1, fill: "none", bgLights: "none", edgeLights: "none" } },
        { label: "TV studio coverage", plain: "Key, fill, back and background all doing a job.", set: { setting: 6, fill: "even fill", bgLights: "a few", edgeLights: "two" } },
        { label: "Party lights", plain: "Many visible lights switching through the night.", set: { setting: 8, motivated: 90, comeAndGo: "several switch", bgLights: "many" } },
      ],
    },
  });

  W.add("lightShape", {
    sliders: [
      ["patternSize", "Size of the pattern", ["fine", "medium", "large", "huge"], "How big the shapes cast by the light are."],
      ["fallsOn", "Where it falls", ["the wall", "the floor", "the people", "everything"], "What the pattern of light and shadow lands on.", { unordered: true }],
      ["sway", "Pattern moves", ["still", "sways", "slides", "flickers"], "Whether the cast shapes hold still or move."],
      ["patternEdge", "Edge of the pattern", ["sharp", "soft", "blurry"], "How crisp the cast shapes are."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { open: "⬜", blinds: "🪟", leaves: "🍃", barndoor: "🚪" } },
        { face: "ladder", slider: "patternSize" },
        { face: "dial", slider: "strength" },
      ],
      groups: [
        { label: "The pattern", sliders: ["setting", "strength", "patternSize", "patternEdge"] },
        { label: "Where and how it moves", sliders: ["fallsOn", "sway", "change"] },
      ],
      presets: [
        { label: "Noir venetian blinds", plain: "Hard stripes of light across the detective.", set: { setting: "blinds", strength: 5, patternEdge: "sharp", fallsOn: "the people" } },
        { label: "Summer under the trees", plain: "Soft leaf shadows swaying on the ground.", set: { setting: "leaves", patternEdge: "soft", sway: "sways", fallsOn: "everything" } },
      ],
    },
  });

  W.add("atmosphere", {
    sliders: [
      ["airKind", "What's in the air", ["haze", "smoke", "dust", "steam", "fog"], "What thickens the air.", { unordered: true }],
      ["drift", "How it moves", ["still", "drifting", "swirling", "rolling in"], "Whether the air hangs or moves through the shot."],
      ["depthFade", "Fades the far distance", [0, 100, "%"], "How much the far background disappears into the air."],
      ["beams", "Light beams", ["none", "soft", "clear", "god rays"], "How visible the shafts of light are."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "airKind", icons: { haze: "🌫️", smoke: "💨", dust: "🏜️", steam: "♨️", fog: "🌁" } },
        { face: "dial", slider: "thickness" },
        { face: "ladder", slider: "beams" },
      ],
      groups: [
        { label: "The air", sliders: ["setting", "airKind", "thickness", "depthFade"] },
        { label: "Light and motion", sliders: ["beams", "drift", "change"] },
      ],
      presets: [
        { label: "Cathedral god rays", plain: "Thick haze cut by bright shafts from high windows.", set: { setting: "beams", airKind: "haze", thickness: 4, beams: "god rays", drift: "still" } },
        { label: "Fog rolls in", plain: "Horror fog creeping over the ground.", set: { setting: "haze", airKind: "fog", drift: "rolling in", depthFade: 90, thickness: 5 } },
        { label: "Smoky jazz club", plain: "Cigarette smoke drifting through the spotlights.", set: { setting: "haze", airKind: "smoke", drift: "drifting", beams: "soft", thickness: 3 } },
      ],
    },
  });

  W.add("valueKey", {
    sliders: [
      ["darkShare", "Share of frame in shadow", [0, 100, "%"], "How much of the picture is dark."],
      ["brightest", "Brightest thing", ["the face", "a window", "a lamp", "the sky"], "What the brightest spot in the picture is.", { unordered: true }],
      ["arc", "Over the section", ["darker by the end", "steady", "brighter by the end"], "Whether the picture darkens or brightens as the section plays."],
      ["eyeGuide", "Light guides the eye", ["evenly lit", "gently", "strongly", "one spot lit"], "How hard the brightness steers the audience to one place."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "darkShare" },
        { face: "balance", slider: "arc", left: "darker", right: "brighter" },
      ],
      groups: [
        { label: "Overall brightness", sliders: ["setting", "exposure", "darkShare"] },
        { label: "Steering the eye", sliders: ["brightest", "eyeGuide"] },
        { label: "Over time", sliders: ["arc", "change"] },
      ],
      presets: [
        { label: "Caravaggio", plain: "Mostly darkness with one lit face.", set: { setting: "low key", darkShare: 85, brightest: "the face", eyeGuide: "one spot lit" } },
        { label: "Bright comedy", plain: "Everything light and easy to read.", set: { setting: "high key", darkShare: 10, eyeGuide: "evenly lit", exposure: 1 } },
        { label: "Descent into night", plain: "The picture sinks darker as things go wrong.", set: { setting: "mid", arc: "darker by the end", eyeGuide: "strongly" } },
      ],
    },
  });

  W.add("renderStyle", {
    sliders: [
      ["detailLevel", "Detail", ["simple shapes", "some detail", "rich detail", "every detail"], "How much small detail the drawing or render shows."],
      ["shading", "Shading", ["flat", "two tones", "soft", "full"], "How smoothly light is shaded across shapes."],
      ["styleReach", "What gets the style", ["background only", "all but faces", "everything"], "Which parts of the picture take the stylized look."],
      ["styleMoment", "When the style shifts", ["never", "for a dream", "for a memory", "for a big feeling"], "The kind of moment that pushes the picture into another style.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { photoreal: "📷", painterly: "🎨", toon: "🐰", flat: "🟦" } },
        { face: "dial", slider: "strength" },
        { face: "ladder", slider: "detailLevel" },
      ],
      groups: [
        { label: "The style", sliders: ["setting", "strength", "styleReach"] },
        { label: "Detail and shading", sliders: ["detailLevel", "shading"] },
        { label: "Over time", sliders: ["styleMoment", "change"] },
      ],
      presets: [
        { label: "Loving Vincent", plain: "Every frame a moving oil painting.", set: { setting: "painterly", strength: 5, detailLevel: "rich detail", styleReach: "everything" } },
        { label: "Saturday-morning cartoon", plain: "Simple shapes and flat color.", set: { setting: "toon", detailLevel: "simple shapes", shading: "flat", strength: 5 } },
        { label: "Dream turns painted", plain: "Real life, until a dream melts it into paint.", set: { setting: "photoreal", styleMoment: "for a dream", strength: 2 } },
      ],
    },
  });

  W.add("lineWeight", {
    sliders: [
      ["wobble", "Line wobble", ["steady", "slight", "sketchy", "scribbled"], "Whether lines are clean or hand-drawn and shaky."],
      ["innerLines", "Lines inside shapes", ["outline only", "a few", "lots of detail"], "Whether only outlines are drawn or also folds and details inside."],
      ["byDistance", "Thinner far away", ["same everywhere", "a little", "much thinner"], "Whether far-off things get lighter lines to feel deeper."],
      ["boil", "Line shimmer", ["still", "gentle", "lively"], "Lines redrawn each frame so they shimmer like hand animation."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "variation" },
        { face: "swatches", slider: "color", colors: { black: "#111111", "dark color": "#3b2a5a", light: "#eeeeee" } },
      ],
      groups: [
        { label: "The line", sliders: ["setting", "color", "variation"] },
        { label: "Hand-drawn feel", sliders: ["wobble", "boil", "innerLines", "byDistance"] },
      ],
      presets: [
        { label: "Comic book ink", plain: "Heavy black outlines with lively thickness.", set: { setting: "heavy", color: "black", variation: 4, innerLines: "lots of detail" } },
        { label: "Clean anime", plain: "Thin steady lines with few details.", set: { setting: "thin", wobble: "steady", innerLines: "a few", boil: "still" } },
        { label: "Sketchbook", plain: "Scribbly, shimmering pencil lines.", set: { setting: "thin", wobble: "scribbled", boil: "lively", color: "dark color" } },
      ],
    },
  });

  W.add("gloss", {
    sliders: [
      ["shineSize", "Size of the shine", ["pinpoint", "small", "broad", "huge"], "How big the bright spot of shine is on a surface."],
      ["reflects", "Reflects the room", ["nothing", "a blur", "clear shapes", "a mirror image"], "How much of the surroundings shows in the shine."],
      ["whatShines", "What shines", ["skin", "objects", "floors", "everything"], "Which things in the frame carry the shine.", { unordered: true }],
      ["glint", "Glints catch the eye", ["never", "now and then", "as things move", "on purpose"], "Whether flashes of shine are used to draw the audience's eye."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "howMuch" },
        { face: "tiles", slider: "whatShines", icons: { skin: "🧑", objects: "🏺", floors: "🟫", everything: "✨" } },
      ],
      groups: [
        { label: "The shine", sliders: ["setting", "howMuch", "shineSize", "reflects"] },
        { label: "Where and when", sliders: ["whatShines", "glint", "noticeable"] },
      ],
      presets: [
        { label: "Luxury car ad", plain: "Mirror-polished surfaces reflecting everything.", set: { setting: "mirror", howMuch: 5, reflects: "a mirror image", whatShines: "objects" } },
        { label: "Matte documentary", plain: "No shine anywhere, nothing glamorous.", set: { setting: "matte", howMuch: 0, glint: "never" } },
        { label: "The knife glints", plain: "One flash of shine warns of danger.", set: { setting: "satin", shineSize: "pinpoint", glint: "on purpose", whatShines: "objects" } },
      ],
    },
  });

  W.add("skinLight", {
    sliders: [
      ["whereShows", "Where it shows", ["ears", "nose and cheeks", "hands", "whole face"], "The part of the body where light glows through the skin.", { unordered: true }],
      ["backlight", "Light from behind", ["none", "a little", "strong"], "How much light comes from behind to shine through the skin."],
      ["depth", "How deep it goes", ["surface", "a little", "deep"], "Whether the glow sits on top or seems to come from inside."],
      ["warmsUp", "Warms as they feel", ["never", "slowly", "with the emotion"], "Whether the glow grows with what the character feels."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "swatches", slider: "color", colors: { none: "#d9c7b8", warm: "#f2a65a", pink: "#f28fa0", cool: "#9bb7d4" } },
        { face: "tiles", slider: "whereShows", icons: { ears: "👂", "nose and cheeks": "👃", hands: "✋", "whole face": "🙂" } },
      ],
      groups: [
        { label: "The glow", sliders: ["setting", "color", "depth", "noticeable"] },
        { label: "Where and why", sliders: ["whereShows", "backlight", "warmsUp"] },
      ],
      presets: [
        { label: "Sunset backlight", plain: "Warm light glowing through ears and fingers.", set: { setting: 4, color: "warm", backlight: "strong", whereShows: "ears" } },
        { label: "Porcelain doll", plain: "No glow at all; skin looks painted on.", set: { setting: 0, color: "none", depth: "surface" } },
      ],
    },
  });

  W.add("saturation", {
    sliders: [
      ["whichColors", "Which colors", ["all", "warm ones", "cool ones", "greens"], "Which colors get stronger or weaker.", { unordered: true }],
      ["skinProtect", "Keep skin natural", ["no", "a little", "fully"], "Whether faces keep their real color while the rest changes."],
      ["heroColor", "Hero stays colorful", ["no", "a little", "clearly"], "Whether the important person keeps color while the world fades."],
      ["pace", "How fast it shifts", [0, 60, "s"], "Seconds it takes the color to drain or fill."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "balance", slider: "trend", left: "draining", right: "filling" },
        { face: "ladder", slider: "heroColor" },
      ],
      groups: [
        { label: "How much color", sliders: ["setting", "whichColors", "skinProtect"] },
        { label: "Over time", sliders: ["trend", "pace", "noticeable"] },
        { label: "Steering the eye", sliders: ["heroColor"] },
      ],
      presets: [
        { label: "Pleasantville color bloom", plain: "Color slowly fills a gray world.", set: { setting: 1, trend: "filling", pace: 40, heroColor: "clearly" } },
        { label: "War film drain", plain: "Color bleeds away as the battle goes on.", set: { setting: 2, trend: "draining", whichColors: "all", skinProtect: "a little" } },
        { label: "Candy pop", plain: "Every color turned up bright.", set: { setting: 5, trend: "steady", whichColors: "all" } },
      ],
    },
  });

  W.add("palette", {
    sliders: [
      ["mainHue", "Main color", ["red", "orange", "yellow", "green", "teal", "blue", "purple"], "The color the shot is mostly built from.", { unordered: true }],
      ["secondHue", "Second color", ["red", "orange", "yellow", "green", "teal", "blue", "purple"], "The color that answers the main one.", { unordered: true }],
      ["perCharacter", "Colors for characters", ["none", "the lead", "each main one", "everyone"], "Whether characters own a color the audience can follow."],
      ["shiftOn", "Changes on", ["never", "new place", "story turn", "each act"], "What makes the palette change.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "mainHue", colors: { red: HUES.red, orange: HUES.orange, yellow: HUES.yellow, green: HUES.green, teal: HUES.teal, blue: HUES.blue, purple: HUES.purple } },
        { face: "swatches", slider: "secondHue", colors: { red: HUES.red, orange: HUES.orange, yellow: HUES.yellow, green: HUES.green, teal: HUES.teal, blue: HUES.blue, purple: HUES.purple } },
        { face: "ladder", slider: "setting" },
      ],
      groups: [
        { label: "The colors", sliders: ["setting", "harmony", "mainHue", "secondHue"] },
        { label: "Who owns which", sliders: ["perCharacter"] },
        { label: "Over time", sliders: ["shiftOn", "change"] },
      ],
      presets: [
        { label: "Teal and orange blockbuster", plain: "Warm skin against cool blue-green backgrounds.", set: { setting: "limited", harmony: "opposites", mainHue: "teal", secondHue: "orange" } },
        { label: "Wes Anderson pastels", plain: "A tight storybook palette of a few soft colors.", set: { setting: "limited", harmony: "neighbors", mainHue: "yellow", secondHue: "red", perCharacter: "each main one" } },
        { label: "The Matrix green", plain: "Everything soaked in one sickly green.", set: { setting: "one color", harmony: "one hue", mainHue: "green", secondHue: "green", shiftOn: "new place" } },
      ],
    },
  });

  W.add("colorRange", {
    sliders: [
      ["rangeArc", "Color over the film", ["drains away", "holds", "blooms"], "Whether the film loses color, keeps it, or bursts into it as it goes."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "swatches", slider: "paletteHue", colors: HUES },
        { face: "tiles", slider: "filmStock", icons: { "clean digital": "💾", "slight grain": "🎞️", "film grain": "📽️", "old film": "🎬", "damaged film": "🩹" } },
      ],
      groups: [
        { label: "How much color", sliders: ["setting", "paletteHue", "brightness"] },
        { label: "The look", sliders: ["filterKind", "filmStock"] },
        { label: "Over time", sliders: ["rangeArc"] },
      ],
      presets: [
        { label: "Arriving in Oz", plain: "Sepia gives way to vivid color.", set: { setting: "vivid color", filterKind: "none", rangeArc: "blooms" } },
        { label: "Sin City", plain: "Black and white with one bold color.", set: { setting: "one color", paletteHue: "red", filmStock: "clean digital" } },
        { label: "Saving Private Ryan", plain: "Muted, gritty, bleached color.", set: { setting: "muted color", filterKind: "bleach bypass", filmStock: "film grain", brightness: "dark" } },
      ],
    },
  });

  W.add("colorFilter", {
    sliders: [
      ["method", "How it's done", ["glass on the lens", "colored lights", "in the edit"], "Whether the tint comes from the camera, the lights or later.", { unordered: true }],
      ["tintWhere", "Where the tint sits", ["the shadows", "the middle", "the highlights", "everywhere"], "Which part of the brightness takes the tint."],
      ["fadeTime", "Time to tint", [0, 30, "s"], "Seconds for the tint to come in or leave."],
      ["marks", "What it marks", ["nothing", "a mood", "a place", "the past or a dream"], "What the tint tells the audience about where or when we are.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "marks", icons: { nothing: "▫️", "a mood": "💭", "a place": "📍", "the past or a dream": "🌙" } },
        { face: "dial", slider: "fadeTime" },
      ],
      groups: [
        { label: "The tint", sliders: ["setting", "tintWhere", "noticeable"] },
        { label: "How and why", sliders: ["method", "marks"] },
        { label: "Over time", sliders: ["fadeTime", "change"] },
      ],
      presets: [
        { label: "Traffic: each city its tint", plain: "Every location gets its own strong tint.", set: { setting: "the whole picture", marks: "a place", method: "in the edit", tintWhere: "everywhere" } },
        { label: "Flashback wash", plain: "A soft tint fades in for memories.", set: { setting: "light", marks: "the past or a dream", fadeTime: 3, tintWhere: "the highlights" } },
      ],
    },
  });

  W.add("filterHue", {
    sliders: [
      ["tintStrength", "How strong the tint", [0, 100, "%"], "How heavily the color sits over the picture."],
      ["paleDeep", "Pale or deep", ["pastel", "clear", "deep"], "Whether the tint is soft and milky or rich and dark."],
      ["slide", "Color slides along", ["stays", "slowly", "quickly"], "Whether the tint travels around the color wheel over time."],
      ["meaning", "What the color means", ["nothing special", "a place", "a character", "a feeling"], "What the audience should link the color with.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "setting", colors: { red: HUES.red, orange: HUES.orange, yellow: HUES.yellow, green: HUES.green, teal: HUES.teal, blue: HUES.blue, purple: HUES.purple } },
        { face: "dial", slider: "tintStrength" },
        { face: "ladder", slider: "paleDeep" },
      ],
      groups: [
        { label: "The color", sliders: ["setting", "tintStrength", "paleDeep", "noticeable"] },
        { label: "Meaning and motion", sliders: ["meaning", "slide", "change"] },
      ],
      presets: [
        { label: "Sun-baked yellow", plain: "A heavy desert-yellow tint, like Traffic's Mexico.", set: { setting: "yellow", tintStrength: 70, paleDeep: "deep", meaning: "a place" } },
        { label: "Code-world green", plain: "A cold green tint for the machine world.", set: { setting: "green", tintStrength: 50, paleDeep: "clear", meaning: "a place" } },
        { label: "Dreamy pastel drift", plain: "A pale tint slowly sliding through colors.", set: { setting: "purple", paleDeep: "pastel", slide: "slowly", meaning: "a feeling" } },
      ],
    },
  });

  W.add("colorCount", {
    sliders: [
      ["bgColors", "Colors in the background", ["none", "one", "a few", "many"], "How many different colors the set and walls bring."],
      ["costumeColors", "Colors in costumes", ["none", "one", "a few", "many"], "How many colors the clothes add."],
      ["overStory", "Colors over the story", ["fewer", "same", "more"], "Whether the world loses or gains colors as the story goes."],
      ["heroOwns", "One color owns the hero", ["no", "a little", "clearly"], "Whether the lead wears a color nobody else has, so the eye finds them."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "mixer", sliders: ["bgColors", "costumeColors"] },
        { face: "balance", slider: "overStory", left: "fewer", right: "more" },
      ],
      groups: [
        { label: "How many colors", sliders: ["setting", "bgColors", "costumeColors", "noticeable"] },
        { label: "Steering the eye", sliders: ["heroOwns"] },
        { label: "Over time", sliders: ["overStory", "change"] },
      ],
      presets: [
        { label: "Monochrome mood", plain: "Everything in shades of one color.", set: { setting: 1, bgColors: "one", costumeColors: "one" } },
        { label: "Bollywood color riot", plain: "Every color you can name, all at once.", set: { setting: 6, bgColors: "many", costumeColors: "many" } },
        { label: "Hero in the only red", plain: "A quiet world where the lead's color stands alone.", set: { setting: 2, heroOwns: "clearly", bgColors: "one" } },
      ],
    },
  });

  W.add("warmCool", {
    sliders: [
      ["faceWarmth", "Faces against the room", ["cooler", "same", "warmer"], "Whether faces are kept warmer or cooler than everything around them."],
      ["coolShadows", "Cool shadows, warm light", ["no", "a little", "strong"], "Shadows pushed blue while bright parts stay golden."],
      ["byPlace", "Changes with place", ["never", "a little", "inside vs outside", "each world its own"], "Whether different places carry different warmth."],
      ["shiftTime", "Time to change", [0, 60, "s"], "Seconds the picture takes to move from warm to cool or back."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "warm", right: "cool" },
        { face: "ladder", slider: "coolShadows" },
        { face: "dial", slider: "shiftTime" },
      ],
      groups: [
        { label: "Warm or cool", sliders: ["setting", "faceWarmth", "coolShadows", "noticeable"] },
        { label: "Over time and place", sliders: ["byPlace", "shiftTime", "change"] },
      ],
      presets: [
        { label: "Cozy holiday", plain: "Golden firelight everywhere.", set: { setting: "very warm", faceWarmth: "warmer", coolShadows: "no" } },
        { label: "Nordic crime", plain: "Cold blue light in every room.", set: { setting: "very cool", faceWarmth: "same", byPlace: "never" } },
        { label: "Two worlds", plain: "Warm home, cold outside world.", set: { setting: "neutral", byPlace: "inside vs outside", coolShadows: "a little" } },
      ],
    },
  });

  W.add("skinColorTruth", {
    sliders: [
      ["protectWho", "Whose skin is protected", ["no one", "the lead", "main characters", "everyone"], "Whose faces keep their real color however the scene is tinted."],
      ["tintOnSkin", "Scene color on skin", [0, 100, "%"], "How much of the scene's tint is allowed onto faces."],
      ["evenness", "Even out the skin", ["leave it", "a little", "smooth", "perfectly even"], "Whether blotches and redness are calmed down."],
      ["matchCuts", "Same skin across cuts", ["can vary", "close", "exactly the same"], "Whether a face looks the same color from shot to shot."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "tintOnSkin" },
        { face: "tiles", slider: "protectWho", icons: { "no one": "🚫", "the lead": "⭐", "main characters": "👥", everyone: "👪" } },
      ],
      groups: [
        { label: "How true", sliders: ["setting", "tintOnSkin", "noticeable"] },
        { label: "Whose skin and how", sliders: ["protectWho", "evenness", "matchCuts"] },
        { label: "Over time", sliders: ["change"] },
      ],
      presets: [
        { label: "Prestige drama", plain: "Bold scene tints, but faces always look real.", set: { setting: "true to life", protectWho: "everyone", tintOnSkin: 15, matchCuts: "exactly the same" } },
        { label: "Alien world", plain: "Faces take the full color of the strange light.", set: { setting: "far off", protectWho: "no one", tintOnSkin: 100 } },
      ],
    },
  });

  W.add("surfaceLens", {
    window: {
      faces: [
        { face: "tiles", slider: "material", icons: { matte: "🧱", satin: "🥚", glossy: "🍎", mirror: "🪞", metal: "🔩", glass: "🥛" } },
        { face: "ladder", slider: "bumps" },
        { face: "ladder", slider: "wear" },
      ],
      groups: [
        { label: "What it's made of", sliders: ["material", "shine", "seeThrough", "bumps"] },
        { label: "Coatings", sliders: ["coat", "sheen", "rainbow"] },
        { label: "State", sliders: ["wet", "glow", "wear"] },
      ],
      presets: [
        { label: "Wet neon city", plain: "Glossy soaked streets with oil-slick rainbows.", set: { material: "glossy", wet: "soaked", rainbow: "oil slick", shine: "mirror" } },
        { label: "Dusty western", plain: "Rough, matte, sun-worn wood and leather.", set: { material: "matte", bumps: "rough and bumpy", wear: "ruined", wet: "dry" } },
        { label: "Toy-box plastic", plain: "Smooth, shiny, brand-new plastic toys.", set: { material: "satin", bumps: "smooth", coat: "thin varnish", wear: "new" } },
      ],
    },
  });

  W.add("renderLookLens", {
    sliders: [
      ["lookMoment", "When the look changes", ["never", "for a dream", "for a flashback", "for a big feeling"], "The kind of moment that switches the drawing style.", { unordered: true }],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "look", icons: { photoreal: "📷", painterly: "🎨", toon: "🐰", flat: "🟦" } },
        { face: "ladder", slider: "bands" },
        { face: "ladder", slider: "hatching" },
      ],
      groups: [
        { label: "The look", sliders: ["look", "bands", "lookMoment"] },
        { label: "Lines and paper", sliders: ["outline", "hatching", "wobble", "paper"] },
      ],
      presets: [
        { label: "Spider-Verse comic", plain: "Bold outlines, hard shading bands, printed hatching.", set: { look: "toon", outline: "heavy", bands: "two bands", hatching: "light hatching" } },
        { label: "Ghibli watercolor", plain: "Soft painted backgrounds on watercolor paper.", set: { look: "painterly", outline: "thin", bands: "smooth", paper: "watercolor" } },
        { label: "Sketchbook flashback", plain: "Memories drawn in wobbly pencil.", set: { look: "flat", wobble: "sketchy", paper: "paper grain", lookMoment: "for a flashback" } },
      ],
    },
  });

  W.add("layersLens", {
    sliders: [
      ["attention", "Where attention goes", ["background", "spread out", "foreground"], "Which layer of the picture the audience is drawn to."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "separation" },
        { face: "balance", slider: "attention", left: "background", right: "foreground" },
      ],
      groups: [
        { label: "Depth", sliders: ["separation", "depthFog", "contact"] },
        { label: "Focus of the eye", sliders: ["lightMix", "isolate", "attention"] },
      ],
      presets: [
        { label: "Pop-up book", plain: "Clear stacked layers like a diorama.", set: { separation: "deep stack", depthFog: "light", contact: "strong" } },
        { label: "Spotlight on one", plain: "Everything else fades so one thing stands alone.", set: { isolate: "only that thing", lightMix: "the main light", attention: "foreground" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
