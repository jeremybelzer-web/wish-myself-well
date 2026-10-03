/* Effects: a window for every curiosity whose home is Effects on the Screen. */
(function (W) {
  const U = { unordered: true };
  /* Directions shared by the wind windows: where the wind comes from (0 = from the top of the compass). */
  const WIND = { "from behind": 0, "from the right": 90, "toward the camera": 180, "from the left": 270 };

  W.add("breakage", {
    sliders: [
      ["material", "What breaks", ["glass", "wood", "pottery", "stone", "metal"], "The stuff the thing is made of, which changes how it fails.", U],
      ["warning", "Warning before it breaks", ["none", "a creak", "cracks spread first"], "Whether the audience gets a sign that it is about to give way."],
      ["slowMo", "Slowed down at the break", ["real speed", "a touch slow", "slow motion", "near frozen"], "How much the moment of breaking is stretched out."],
      ["grabsEye", "How much it grabs the eye", ["in the background", "noticed", "the center of the moment"], "Whether the break is a detail or the thing everyone watches."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { holds: "🧱", cracks: "⚡", shatters: "💥" } },
        { face: "dial", slider: "pieces" },
        { face: "ladder", slider: "slowMo" },
      ],
      groups: [
        { label: "The break", sliders: ["setting", "material", "pieces"] },
        { label: "Timing", sliders: ["warning", "speed", "slowMo"] },
        { label: "Attention", sliders: ["grabsEye"] },
      ],
      presets: [
        { label: "Action-movie window smash", plain: "Glass bursts into a slow-motion shower everyone watches.", set: { setting: "shatters", material: "glass", pieces: 80, slowMo: "slow motion", grabsEye: "the center of the moment" } },
        { label: "Horror creak and crack", plain: "Cracks creep across before anything gives.", set: { setting: "cracks", warning: "cracks spread first", slowMo: "real speed", grabsEye: "noticed" } },
        { label: "Slapstick vase smash", plain: "A vase explodes instantly, no warning, played for laughs.", set: { setting: "shatters", material: "pottery", warning: "none", speed: 5, slowMo: "real speed" } },
      ],
    },
  });

  W.add("element", {
    sliders: [
      ["where", "Where it sits", ["far background", "around the edges", "around the people", "right in front of the lens"], "How close the element comes to the camera."],
      ["motion", "How it moves", ["still", "drifting", "swirling", "rushing"], "Whether the element hangs there or races through the frame."],
      ["arrives", "How it arrives", ["already there", "seeps in", "sweeps in", "bursts in"], "How the element enters the scene over time."],
      ["pull", "Pulls the eye", ["blends in", "noticed", "steals focus"], "Whether the element sits quietly or takes the audience's attention."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { water: "💧", smoke: "💨", fire: "🔥", sand: "🏜️", snow: "❄️" } },
        { face: "dial", slider: "howMuch" },
        { face: "ladder", slider: "arrives" },
      ],
      groups: [
        { label: "What and how much", sliders: ["setting", "howMuch", "where"] },
        { label: "Movement and time", sliders: ["motion", "arrives", "change"] },
        { label: "Attention", sliders: ["pull"] },
      ],
      presets: [
        { label: "Blizzard closes in", plain: "Snow sweeps in until it surrounds everyone.", set: { setting: "snow", howMuch: 5, arrives: "sweeps in", where: "around the people", motion: "rushing" } },
        { label: "Smoky noir bar", plain: "A lazy haze of smoke that sets the mood without stealing it.", set: { setting: "smoke", howMuch: 2, motion: "drifting", where: "around the people", pull: "blends in" } },
        { label: "Desert sandstorm", plain: "Sand rushes across the lens and swallows the frame.", set: { setting: "sand", howMuch: 5, motion: "rushing", where: "right in front of the lens", pull: "steals focus" } },
      ],
    },
  });

  W.add("growth", {
    sliders: [
      ["startSize", "Starting size", ["a spark", "small", "medium", "large"], "How big the element is when we first see it."],
      ["endSize", "Final size", ["gone", "small", "medium", "large", "fills the frame"], "How big it is by the end of the moment."],
      ["shape", "Shape of the growth", ["even", "slow then sudden", "sudden then slow", "in surges"], "Whether it grows steadily or in bursts.", U],
      ["tension", "Feeds the tension", ["no", "a little", "keeps climbing"], "How much the growing raises the audience's worry."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "shrinking", right: "building" },
        { face: "ladder", slider: "endSize" },
        { face: "dial", slider: "speed" },
      ],
      groups: [
        { label: "Direction", sliders: ["setting", "noticeable"] },
        { label: "Size", sliders: ["startSize", "endSize"] },
        { label: "Pace and tension", sliders: ["speed", "shape", "tension"] },
      ],
      presets: [
        { label: "Ticking-bomb fire", plain: "A spark creeps, then suddenly fills the room.", set: { setting: "building", startSize: "a spark", endSize: "fills the frame", shape: "slow then sudden", speed: 2, tension: "keeps climbing" } },
        { label: "Dying campfire", plain: "The flames slowly shrink away to nothing.", set: { setting: "shrinking", startSize: "medium", endSize: "gone", speed: 1, tension: "no" } },
      ],
    },
  });

  W.add("smokeFireLens", {
    sliders: [
      ["spread", "How fast it spreads", ["stays put", "creeps", "races"], "Whether the fire stays in one place or runs across the set."],
      ["danger", "Feels dangerous", ["cozy", "uneasy", "deadly"], "Whether the fire comforts the audience or frightens them."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "heat" },
        { face: "swatches", slider: "smokeColor", colors: { "white steam": "#f2f2f2", gray: "#8a8a8a", black: "#222222", colored: "#b05ad8" } },
        { face: "pad", x: "swirl", y: "thick", xLabel: "Swirl", yLabel: "Thickness" },
      ],
      groups: [
        { label: "The fire", sliders: ["heat", "fireGlow", "spread", "danger"] },
        { label: "The smoke", sliders: ["thick", "smokeColor", "swirl"] },
        { label: "Over time", sliders: ["grows", "rise", "fade"] },
      ],
      presets: [
        { label: "Cozy fireplace", plain: "A small warm fire flickering on the faces.", set: { heat: "smoulder", fireGlow: "flicker", thick: "wisp", smokeColor: "gray", spread: "stays put", danger: "cozy" } },
        { label: "Backdraft inferno", plain: "Black smoke walls and racing flames that flood the scene.", set: { heat: "inferno", thick: "wall", smokeColor: "black", spread: "races", danger: "deadly", fireGlow: "floods", grows: "building" } },
        { label: "Steamy kitchen", plain: "White steam drifting up and thinning out.", set: { heat: "none", smokeColor: "white steam", thick: "plume", rise: "drifts up", fade: "thins out" } },
      ],
    },
  });

  W.add("sideStoryline", {
    sliders: [
      ["returns", "How often it cuts back", ["once", "now and then", "constantly"], "How often the edit drops into the side story."],
      ["relation", "How it relates to the main story", ["contrasts", "echoes", "foreshadows"], "Whether the side story fights, mirrors or hints at the main one.", U],
      ["meets", "Meets the main story", ["never", "at the end", "builds to the same moment"], "Whether both stories race toward one shared climax."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "a few cutaways": "✂️", "a running montage": "🎞️", "a second story": "📖" } },
        { face: "dial", slider: "share" },
        { face: "ladder", slider: "meets" },
      ],
      groups: [
        { label: "The side story", sliders: ["setting", "share", "relation"] },
        { label: "Timing", sliders: ["tiedTo", "returns", "meets"] },
      ],
      presets: [
        { label: "Godfather baptism montage", plain: "Violence cut against a ceremony, both building to one moment.", set: { setting: "a running montage", share: 50, tiedTo: "the music", relation: "contrasts", meets: "builds to the same moment", returns: "constantly" } },
        { label: "Sitcom B-plot", plain: "A lighter second story that ties up at the end.", set: { setting: "a second story", share: 30, returns: "now and then", meets: "at the end" } },
        { label: "Quick cutaways", plain: "A few shots that illustrate what someone is saying.", set: { setting: "a few cutaways", share: 10, tiedTo: "the words", relation: "echoes" } },
      ],
    },
  });

  W.add("windForce", {
    sliders: [
      ["direction", "Which way it blows", ["from the left", "from the right", "toward the camera", "from behind"], "The side the wind comes from.", U],
      ["howl", "How loud you hear it", ["silent", "a whisper", "a howl", "a roar"], "How much the wind is heard on the soundtrack."],
      ["buildUp", "How it picks up", ["already blowing", "rises slowly", "hits all at once"], "Whether the wind is there from the start or arrives."],
      ["unease", "Unsettles the audience", ["calm", "restless", "menacing"], "Whether the wind soothes or puts the audience on edge."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "compass", slider: "direction", angles: WIND },
        { face: "ladder", slider: "howl" },
      ],
      groups: [
        { label: "The wind", sliders: ["setting", "gusts", "direction"] },
        { label: "Sound and feeling", sliders: ["howl", "unease"] },
        { label: "Over time", sliders: ["buildUp", "change"] },
      ],
      presets: [
        { label: "Wuthering moor", plain: "A howling, gusty wind that never lets up.", set: { setting: 4, gusts: "gusty", howl: "a howl", unease: "menacing" } },
        { label: "Gentle summer breeze", plain: "A soft steady breeze barely heard.", set: { setting: 1, gusts: "steady", howl: "a whisper", unease: "calm" } },
        { label: "The storm hits", plain: "Calm, then a roaring wall of wind all at once.", set: { setting: 5, gusts: "violent gusts", buildUp: "hits all at once", howl: "a roar", unease: "menacing" } },
      ],
    },
  });

  W.add("impacts", {
    sliders: [
      ["heaviness", "How heavy they sound", ["light tap", "thud", "crunch", "boom"], "The weight of each hit as the audience hears it."],
      ["shake", "Camera shakes on impact", ["no", "a jolt", "a big shake"], "Whether the picture itself flinches when something hits."],
      ["landsOn", "Lands on", ["anywhere", "the music's beat", "the cut"], "What each hit is timed to.", U],
      ["jolt", "Jolts the audience", ["barely", "wakes them up", "makes them jump"], "How much each hit grabs the audience."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "force", xLabel: "How many", yLabel: "How hard" },
        { face: "ladder", slider: "heaviness" },
        { face: "tiles", slider: "landsOn", icons: { anywhere: "🎲", "the music's beat": "🥁", "the cut": "✂️" } },
      ],
      groups: [
        { label: "The hits", sliders: ["setting", "force", "heaviness"] },
        { label: "Rhythm", sliders: ["rhythm", "landsOn"] },
        { label: "On the audience", sliders: ["shake", "jolt"] },
      ],
      presets: [
        { label: "Bourne fistfight", plain: "Rapid hard hits cut tight, with a jolt on each.", set: { setting: 6, force: 4, rhythm: "a run", shake: "a jolt", landsOn: "the cut", heaviness: "crunch" } },
        { label: "Jump-scare slam", plain: "One huge bang out of silence.", set: { setting: 1, force: 5, rhythm: "single", heaviness: "boom", jolt: "makes them jump", shake: "a big shake" } },
        { label: "Kung-fu rhythm", plain: "A constant flurry of blows on the beat.", set: { setting: 8, force: 3, rhythm: "constant", landsOn: "the music's beat", heaviness: "thud" } },
      ],
    },
  });

  W.add("density", {
    sliders: [
      ["layer", "Where it hangs", ["low to the ground", "mid-air", "high up"], "Whether the haze hugs the floor or floats above."],
      ["hides", "What it hides", ["nothing", "the background", "people's faces", "everything"], "How much of the scene the haze keeps from the audience."],
      ["clears", "How it clears", ["stays", "thins slowly", "parts suddenly"], "Whether the haze stays or opens up to reveal what is behind it."],
      ["beams", "Light through it", ["none", "soft haze", "beams"], "Whether light shows up as visible rays in the haze."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "opacity" },
        { face: "ladder", slider: "hides" },
      ],
      groups: [
        { label: "The haze", sliders: ["setting", "opacity", "layer", "beams"] },
        { label: "Hiding and revealing", sliders: ["hides", "clears", "change"] },
      ],
      presets: [
        { label: "Silent Hill fog", plain: "A thick low fog that hides everything.", set: { setting: "wall", opacity: 15, layer: "low to the ground", hides: "everything", clears: "stays" } },
        { label: "Blade Runner haze", plain: "A light haze that turns lamps into beams.", set: { setting: "plume", opacity: 70, beams: "beams", hides: "nothing" } },
        { label: "Reveal through the mist", plain: "A wall of mist that suddenly parts to show who is there.", set: { setting: "wall", opacity: 20, hides: "people's faces", clears: "parts suddenly" } },
      ],
    },
  });

  W.add("splash", {
    sliders: [
      ["liquid", "What splashes", ["water", "mud", "paint", "blood", "milk"], "The liquid that flies, which changes its weight and color.", U],
      ["slowMo", "Slowed down", ["real speed", "a touch slow", "slow motion"], "How much the splash is stretched in time."],
      ["hitsLens", "Hits the lens", ["no", "a few drops", "drenches the lens"], "Whether the splash lands on the camera, pulling the audience in."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", drip: "💧", burst: "💦" } },
        { face: "pad", x: "height", y: "droplets", xLabel: "Height", yLabel: "Droplets" },
      ],
      groups: [
        { label: "The splash", sliders: ["setting", "liquid", "height", "droplets"] },
        { label: "Timing and impact", sliders: ["slowMo", "hitsLens"] },
      ],
      presets: [
        { label: "Commercial milk pour", plain: "A perfect slow-motion crown of milk.", set: { setting: "burst", liquid: "milk", slowMo: "slow motion", height: 3, droplets: 4 } },
        { label: "Tarantino spatter", plain: "A burst of red that hits the lens.", set: { setting: "burst", liquid: "blood", hitsLens: "a few drops", slowMo: "real speed" } },
        { label: "Leaky faucet tension", plain: "Single drips at real speed, ticking like a clock.", set: { setting: "drip", liquid: "water", height: 0, droplets: 1, slowMo: "real speed" } },
      ],
    },
  });

  W.add("fireLight", {
    sliders: [
      ["glowColor", "Color of the glow", ["candle orange", "warm amber", "deep red", "blue gas"], "The color the fire throws onto the scene.", U],
      ["reach", "How far it reaches", ["just the faces nearby", "the room", "the whole scene"], "How much of the set the firelight touches."],
      ["shadows", "Dancing shadows", ["none", "soft", "big and moving"], "Whether the fire throws moving shadows on the walls."],
      ["surge", "Flares up with", ["nothing", "the drama", "the music"], "Whether the fire brightens on the big moments.", U],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "glowColor", colors: { "candle orange": "#ff9d3c", "warm amber": "#ffbf5e", "deep red": "#c7321f", "blue gas": "#4f8cff" } },
        { face: "mixer", sliders: ["brightness", "flicker"] },
        { face: "ladder", slider: "reach" },
      ],
      groups: [
        { label: "The glow", sliders: ["setting", "glowColor", "brightness", "reach"] },
        { label: "Movement", sliders: ["flicker", "shadows"] },
        { label: "Timing", sliders: ["surge"] },
      ],
      presets: [
        { label: "Barry Lyndon candlelight", plain: "Soft candle glow on nearby faces only.", set: { setting: "flicker", brightness: 1, flicker: 1, glowColor: "candle orange", reach: "just the faces nearby", shadows: "soft" } },
        { label: "Campfire ghost story", plain: "A lively fire that flares as the story peaks.", set: { setting: "flicker", brightness: 3, flicker: 3, glowColor: "warm amber", shadows: "big and moving", surge: "the drama" } },
        { label: "Burning building", plain: "Red firelight floods everything.", set: { setting: "floods", brightness: 5, flicker: 4, glowColor: "deep red", reach: "the whole scene", shadows: "big and moving" } },
      ],
    },
  });

  W.add("forcesLens", {
    sliders: [
      ["buildUp", "How the forces arrive", ["already there", "rise slowly", "hit all at once"], "Whether the forces are present from the start or come in."],
      ["calmEye", "Calm around the hero", ["no", "a little", "a still eye in the storm"], "Whether the chaos leaves the main person strangely still, drawing the eye."],
    ],
    window: {
      faces: [
        { face: "compass", slider: "direction", angles: WIND },
        { face: "mixer", sliders: ["wind", "chaos"] },
        { face: "balance", slider: "weight", left: "floaty", right: "heavy" },
      ],
      groups: [
        { label: "Wind", sliders: ["wind", "gusts", "direction", "whirl"] },
        { label: "The air", sliders: ["chaos", "weight", "drag"] },
        { label: "Over time", sliders: ["buildUp", "calmEye"] },
      ],
      presets: [
        { label: "Twister", plain: "A whirlwind of sudden blasts and chaos.", set: { wind: 5, whirl: "a whirlwind", chaos: 5, gusts: "sudden blasts", direction: "swirling" } },
        { label: "Moonwalk", plain: "No wind, thin air, everything floats.", set: { wind: 0, weight: "floaty", drag: "thin air", chaos: 0 } },
        { label: "Underwater dream", plain: "Slow, thick air where everything drifts.", set: { drag: "like water", weight: "floaty", chaos: 1, wind: 1 } },
      ],
    },
  });

  W.add("crashLens", {
    sliders: [
      ["slowMo", "Slowed at the moment", ["real speed", "a touch slow", "slow motion"], "How much the crash is stretched out for the audience."],
      ["tone", "Funny or serious", ["serious", "in between", "pure slapstick"], "Whether the crash should hurt or make people laugh."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "hits" },
        { face: "ladder", slider: "chain" },
        { face: "tiles", slider: "breaks", icons: { holds: "🧱", cracks: "⚡", shatters: "💥" } },
      ],
      groups: [
        { label: "The hit", sliders: ["hits", "breaks", "bounce", "slide"] },
        { label: "What follows", sliders: ["chain", "mess", "settle"] },
        { label: "Feel", sliders: ["slowMo", "tone"] },
      ],
      presets: [
        { label: "Rube Goldberg chain", plain: "One bump sets off a long run of knock-ons.", set: { chain: "domino chain", bounce: "bouncy", mess: "some bits", tone: "in between" } },
        { label: "Buster Keaton slapstick", plain: "Dead thuds, played straight and funny.", set: { bounce: "dead thud", tone: "pure slapstick", slowMo: "real speed", breaks: "holds" } },
        { label: "Blockbuster wreck", plain: "Everything shatters in slow motion and leaves a mess.", set: { hits: 6, breaks: "shatters", mess: "pieces everywhere", slowMo: "slow motion", tone: "serious" } },
      ],
    },
  });

  W.add("liquidLens", {
    sliders: [
      ["current", "Which way it flows", ["still", "gentle drift", "flowing", "rushing"], "How strongly the liquid is moving along."],
      ["clarity", "How clear", ["crystal", "cloudy", "murky", "opaque"], "How far you can see into the liquid."],
      ["rising", "Level over time", ["falling", "steady", "rising slowly", "rising fast"], "Whether the water drops away or climbs toward the characters."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "thickness", icons: { water: "💧", milk: "🥛", syrup: "🍁", honey: "🍯", mud: "🟫" } },
        { face: "pad", x: "surface", y: "current", xLabel: "Surface", yLabel: "Flow" },
        { face: "ladder", slider: "rising" },
      ],
      groups: [
        { label: "The liquid", sliders: ["thickness", "clarity"] },
        { label: "Movement", sliders: ["surface", "current", "rising"] },
        { label: "Splashes", sliders: ["splash", "foam", "drips"] },
      ],
      presets: [
        { label: "Titanic flooding", plain: "Churning water rising fast toward the characters.", set: { rising: "rising fast", current: "rushing", surface: "churning", foam: "white water" } },
        { label: "Still pond", plain: "Glassy, clear and quiet.", set: { surface: "glass calm", current: "still", clarity: "crystal", splash: "none" } },
        { label: "Swamp", plain: "Thick murky mud that barely moves.", set: { thickness: "mud", clarity: "murky", surface: "ripples", current: "gentle drift" } },
      ],
    },
  });

  W.add("overlay", {
    sliders: [
      ["stays", "How long it stays", ["a flash", "a few seconds", "a whole scene"], "How long the overlay is on screen."],
      ["comesIn", "How it comes in", ["cuts in", "fades in", "slides in", "grows in"], "How the overlay arrives on screen.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "cutaway over the sound": "🎧", "picture in picture": "🖼️", "split screen": "◫", "full overlay": "🔲" } },
        { face: "frame", x: "position", size: "size" },
        { face: "dial", slider: "opacity" },
      ],
      groups: [
        { label: "The overlay", sliders: ["setting", "size", "position", "opacity"] },
        { label: "Timing", sliders: ["comesIn", "stays"] },
      ],
      presets: [
        { label: "TV-thriller split screen", plain: "Two halves running side by side, like 24.", set: { setting: "split screen", size: 50, opacity: 100, stays: "a whole scene" } },
        { label: "Reaction in the corner", plain: "A small picture-in-picture of someone reacting.", set: { setting: "picture in picture", size: 25, position: "corner", comesIn: "grows in" } },
        { label: "Memory over the voice", plain: "A see-through cutaway fading in while the talk carries on.", set: { setting: "cutaway over the sound", opacity: 60, comesIn: "fades in", stays: "a few seconds" } },
      ],
    },
  });

  W.add("superpowerEffect", {
    sliders: [
      ["powerColor", "Color of the power", ["blue", "white", "gold", "red", "purple", "green"], "The color the power glows in.", U],
      ["trigger", "When it fires", ["any time", "on a big line", "on the beat", "at the climax"], "The moment the power is saved for.", U],
      ["afterglow", "Lingers after", ["gone at once", "fades", "leaves a trail"], "What is left once the power switches off."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "light trails": "✨", "flame eyes": "🔥", "electric eyes": "⚡", "laser eyes": "🔴", lightning: "🌩️", "speed streaks": "💨", "flaming horns": "😈", "roaring tiger": "🐯", "outline scan": "📡", "face glitch": "📺", "violet galaxy": "🌌" } },
        { face: "swatches", slider: "powerColor", colors: { blue: "#3d8bff", white: "#f5f5f5", gold: "#f2b632", red: "#e23b2e", purple: "#9b4dff", green: "#3ccf6e" } },
        { face: "dial", slider: "intensity" },
      ],
      groups: [
        { label: "The power", sliders: ["setting", "powerColor", "who"] },
        { label: "Strength", sliders: ["intensity", "afterglow"] },
        { label: "Timing", sliders: ["shape", "trigger"] },
      ],
      presets: [
        { label: "Anime power-up", plain: "Lightning builds and builds until the climax.", set: { setting: "lightning", shape: "builds up", trigger: "at the climax", intensity: 90, powerColor: "blue" } },
        { label: "Speedster run", plain: "Gold streaks that trail behind the hero.", set: { setting: "speed streaks", powerColor: "gold", afterglow: "leaves a trail", shape: "stays on" } },
        { label: "Villain reveal", plain: "Red laser eyes burst on with the big line.", set: { setting: "laser eyes", powerColor: "red", shape: "bursts on", trigger: "on a big line", who: "another character" } },
      ],
    },
  });

  W.add("hallucinationEffect", {
    sliders: [
      ["onset", "How it starts", ["creeps in", "swells", "snaps on"], "Whether the world bends slowly or all at once."],
      ["pov", "Whose head we're in", ["we watch them", "half in", "we see what they see"], "Whether the audience watches the person or shares the trip."],
      ["sway", "How it moves", ["slow and dreamy", "pulsing", "spinning", "violent"], "The rhythm of the bending."],
      ["ending", "How it ends", ["snaps back", "fades out", "lingers"], "How the world returns to normal.", U],
    ],
    window: {
      faces: [
        { face: "dial", slider: "intensity" },
        { face: "balance", slider: "pov", left: "we watch them", right: "we see what they see" },
        { face: "ladder", slider: "sway" },
      ],
      groups: [
        { label: "The trip", sliders: ["setting", "intensity", "sway"] },
        { label: "Point of view", sliders: ["pov"] },
        { label: "Timing", sliders: ["onset", "length", "ending"] },
      ],
      presets: [
        { label: "Fear and Loathing trip", plain: "We see what they see, pulsing hard.", set: { intensity: 80, sway: "pulsing", pov: "we see what they see", onset: "swells", ending: "lingers" } },
        { label: "Panic snap", plain: "A violent short burst that snaps back.", set: { onset: "snaps on", sway: "violent", ending: "snaps back", length: 2, intensity: 100 } },
        { label: "Dream drift", plain: "A slow, gentle bend that fades away.", set: { onset: "creeps in", sway: "slow and dreamy", ending: "fades out", intensity: 40, pov: "half in" } },
      ],
    },
  });

  W.add("glitchEffect", {
    sliders: [
      ["burst", "How long each glitch lasts", [0, 3, "s"], "The length of a single glitch."],
      ["landsOn", "Lands on", ["anywhere", "the beat", "a cut", "a scary moment"], "What each glitch is timed to.", U],
      ["feel", "Feels", ["playful", "edgy", "creepy"], "The mood the glitch gives the audience.", U],
      ["worsens", "Gets worse over time", ["no", "slowly", "quickly"], "Whether the picture breaks down more as the scene goes on."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "intensity" },
        { face: "tiles", slider: "often", icons: { once: "1️⃣", "now and then": "🔁", constantly: "♾️" } },
        { face: "ladder", slider: "worsens" },
      ],
      groups: [
        { label: "The glitch", sliders: ["setting", "intensity", "feel"] },
        { label: "Timing", sliders: ["often", "burst", "landsOn", "worsens"] },
      ],
      presets: [
        { label: "Mr. Robot hack", plain: "Edgy digital glitches now and then.", set: { setting: "glitchy digits", often: "now and then", feel: "edgy", burst: 0.5 } },
        { label: "Found-footage scare", plain: "The camera breaks up right at the scary moment.", set: { setting: "spooky camera", landsOn: "a scary moment", feel: "creepy", often: "once", intensity: 80 } },
        { label: "Music video stutter", plain: "Constant shaky glitches on the beat.", set: { setting: "shaky glitch", landsOn: "the beat", often: "constantly", feel: "playful", burst: 0.2 } },
      ],
    },
  });

  W.add("turbulence", {
    sliders: [
      ["wildest", "Where it's wildest", ["everywhere", "around the edges", "behind the action", "right around the hero"], "Which part of the picture gets the most chaos.", U],
      ["gustsOn", "Gusts land on", ["random", "the beat", "the drama"], "What the bursts of chaos are timed to.", U],
      ["hush", "Calm before the storm", ["no", "a short hush", "a long hush"], "A moment of stillness before the chaos hits."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "scale", xLabel: "Chaos", yLabel: "Swirl size" },
        { face: "ladder", slider: "hush" },
      ],
      groups: [
        { label: "The chaos", sliders: ["setting", "scale", "wildest"] },
        { label: "Timing", sliders: ["gustsOn", "hush", "change"] },
      ],
      presets: [
        { label: "Calm before the storm", plain: "A long hush, then full chaos.", set: { hush: "a long hush", setting: 5, gustsOn: "the drama" } },
        { label: "Lazy summer air", plain: "Big, slow, gentle swirls.", set: { setting: 1, scale: 4, hush: "no" } },
        { label: "Disaster movie", plain: "Tight wild swirls hitting on every big moment.", set: { setting: 5, scale: 2, gustsOn: "the drama", wildest: "everywhere" } },
      ],
    },
  });

  W.add("clothResponse", {
    sliders: [
      ["movedBy", "Moved by", ["nothing", "wind", "the body", "both"], "What makes the cloth move.", U],
      ["billow", "Billows for drama", ["never", "on big moments", "always"], "Whether the cloth swells on heroic moments to grab the eye."],
      ["trails", "Trails behind", ["keeps up", "trails a little", "trails far behind"], "How long the cloth takes to follow a move."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "mixer", sliders: ["weight", "howMuch"] },
        { face: "tiles", slider: "movedBy", icons: { nothing: "➖", wind: "🌬️", "the body": "🏃", both: "🌀" } },
      ],
      groups: [
        { label: "The cloth", sliders: ["setting", "weight", "howMuch"] },
        { label: "Movement", sliders: ["movedBy", "trails"] },
        { label: "Drama", sliders: ["billow"] },
      ],
      presets: [
        { label: "Superhero cape", plain: "Fluttering in the wind, billowing on the big moment.", set: { setting: "flutter", movedBy: "wind", billow: "on big moments", weight: 2 } },
        { label: "Period drama gown", plain: "Heavy skirts that trail a little behind.", set: { setting: "loose", weight: 4, movedBy: "the body", trails: "trails a little" } },
        { label: "Starched uniform", plain: "Stiff cloth that hardly moves.", set: { setting: "stiff", weight: 5, howMuch: 0, billow: "never" } },
      ],
    },
  });

  W.add("settleTime", {
    sliders: [
      ["wobble", "Wobble after the hit", ["none", "a shiver", "a long wobble"], "How much things shake before they go still."],
      ["lastMove", "One last move", ["no", "a final tip", "a final fall"], "A late extra move after everything seems settled, often for a laugh."],
      ["hold", "Pause before the next beat", ["none", "a breath", "a long hold"], "How long the stillness is held before the story moves on."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "ladder", slider: "bounce" },
        { face: "tiles", slider: "lastMove", icons: { no: "➖", "a final tip": "↘️", "a final fall": "💥" } },
      ],
      groups: [
        { label: "Settling", sliders: ["setting", "bounce", "wobble"] },
        { label: "The beat after", sliders: ["lastMove", "hold", "noticeable"] },
      ],
      presets: [
        { label: "Slapstick delayed fall", plain: "Everything stills, a pause, then one last thing falls.", set: { setting: 3, lastMove: "a final fall", hold: "a long hold" } },
        { label: "Snappy action", plain: "Things stop dead and the story moves on.", set: { setting: 0, bounce: "none", wobble: "none", hold: "none" } },
        { label: "Jelly wobble", plain: "A springy, long wobble before stillness.", set: { setting: 4, bounce: "springy", wobble: "a long wobble" } },
      ],
    },
  });

  W.add("gravityFeel", {
    sliders: [
      ["falls", "How things fall", ["drift down", "float then drop", "drop like stones"], "How dropped things travel to the ground."],
      ["jumps", "How high people jump", ["barely", "normal", "moon leaps"], "How far people leave the ground."],
      ["shifts", "Gravity shifts", ["never", "slowly", "suddenly"], "Whether the pull changes during the scene, throwing the audience."],
    ],
    window: {
      faces: [
        { face: "balance", slider: "setting", left: "floaty", right: "heavy" },
        { face: "dial", slider: "scale" },
      ],
      groups: [
        { label: "Weight", sliders: ["setting", "scale"] },
        { label: "How things move", sliders: ["falls", "jumps"] },
        { label: "Over time", sliders: ["shifts", "change"] },
      ],
      presets: [
        { label: "Moon landing", plain: "Light and floaty, with big slow leaps.", set: { setting: "floaty", scale: 0.2, jumps: "moon leaps", falls: "drift down" } },
        { label: "Inception hallway", plain: "Gravity suddenly turns on its head.", set: { shifts: "suddenly", setting: "real" } },
        { label: "Heavy as lead", plain: "Everything drops like stones.", set: { setting: "heavy", scale: 2.5, falls: "drop like stones", jumps: "barely" } },
      ],
    },
  });

  W.add("furLength", {
    sliders: [
      ["grows", "Grows over time", ["shrinks", "stays", "grows slowly", "grows fast"], "Whether the fur changes length during the scene, like a transformation."],
      ["evenness", "Even or shaggy", ["trimmed even", "natural", "shaggy and patchy"], "Whether every hair is the same length."],
      ["fluff", "Fluffed up", ["flat", "natural", "puffed up"], "How much the fur stands out from the body, like a scared cat."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "cm" },
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "grows", icons: { shrinks: "✂️", stays: "➖", "grows slowly": "🌱", "grows fast": "🐺" } },
      ],
      groups: [
        { label: "Length", sliders: ["setting", "cm", "evenness"] },
        { label: "Body", sliders: ["density", "fluff"] },
        { label: "Over time", sliders: ["grows"] },
      ],
      presets: [
        { label: "Werewolf transformation", plain: "Fur sprouts fast and shaggy.", set: { grows: "grows fast", setting: "long", evenness: "shaggy and patchy", cm: 20 } },
        { label: "Show dog", plain: "Long, even and fluffed.", set: { setting: "long", evenness: "trimmed even", fluff: "puffed up", grows: "stays" } },
        { label: "Scared cat", plain: "Short fur that suddenly puffs up.", set: { setting: "short", fluff: "puffed up", cm: 3 } },
      ],
    },
  });

  W.add("clump", {
    sliders: [
      ["cause", "What clumps it", ["nothing", "water", "mud", "blood", "age"], "What is sticking the hairs together.", U],
      ["clumpSize", "Size of the clumps", ["small", "medium", "big"], "How many hairs stick together in each clump."],
      ["arc", "Over the film", ["gets cleaner", "stays", "gets messier"], "Whether the fur gets more matted as the ordeal goes on."],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "tiles", slider: "cause", icons: { nothing: "➖", water: "💧", mud: "🟫", blood: "🩸", age: "⏳" } },
      ],
      groups: [
        { label: "Clumping", sliders: ["setting", "howMuch", "clumpSize", "noticeable"] },
        { label: "Why and when", sliders: ["cause", "arc"] },
      ],
      presets: [
        { label: "Drenched dog", plain: "Wet fur in stringy tufts.", set: { setting: "tufted", cause: "water", clumpSize: "medium" } },
        { label: "Survival ordeal", plain: "Mud-matted fur that gets worse and worse.", set: { setting: "matted", cause: "mud", arc: "gets messier", clumpSize: "big" } },
        { label: "Freshly groomed", plain: "Fine fur that gets cleaner.", set: { setting: "fine", cause: "nothing", arc: "gets cleaner" } },
      ],
    },
  });

  W.add("frizz", {
    sliders: [
      ["cause", "Why it frizzes", ["dry air", "humidity", "static", "a shock"], "What is making the stray hairs stand up.", U],
      ["halo", "Catches backlight", ["no", "a soft halo", "a bright halo"], "Whether the stray hairs glow when lit from behind."],
      ["builds", "Over the scene", ["calms down", "stays", "gets wilder"], "Whether the frizz grows or settles as time passes."],
    ],
    window: {
      faces: [
        { face: "dial", slider: "setting" },
        { face: "tiles", slider: "where", icons: { tips: "🔚", roots: "🌱", "all over": "🦁" } },
        { face: "ladder", slider: "halo" },
      ],
      groups: [
        { label: "Frizz", sliders: ["setting", "where", "cause"] },
        { label: "Light", sliders: ["halo"] },
        { label: "Over time", sliders: ["builds", "change"] },
      ],
      presets: [
        { label: "Mad scientist zap", plain: "Hair standing everywhere after a shock.", set: { setting: 5, where: "all over", cause: "a shock" } },
        { label: "Golden-hour halo", plain: "A few stray tips glowing in the backlight.", set: { setting: 2, where: "tips", halo: "a bright halo" } },
        { label: "Humid jungle", plain: "Frizz that gets wilder through the trek.", set: { cause: "humidity", builds: "gets wilder", setting: 3 } },
      ],
    },
  });

  W.add("hairColor", {
    sliders: [
      ["undertone", "Undertone", ["ash", "natural", "golden", "red"], "The warmth hiding under the main color.", U],
      ["dye", "Dyed look", ["natural", "highlights", "bold dye"], "Whether the color looks natural or clearly dyed."],
      ["ages", "Graying over the film", ["no", "slowly", "quickly"], "Whether the hair grays as time passes in the story."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "undertone", colors: { ash: "#9a9690", natural: "#6b4a2f", golden: "#c99a45", red: "#a3412a" } },
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "gray" },
      ],
      groups: [
        { label: "Color", sliders: ["setting", "undertone", "dye", "variation"] },
        { label: "Age", sliders: ["gray", "ages"] },
      ],
      presets: [
        { label: "Aging across decades", plain: "Hair grays slowly through the film.", set: { ages: "slowly", gray: 60, dye: "natural" } },
        { label: "Punk dye job", plain: "A bold dyed color.", set: { dye: "bold dye", undertone: "red", variation: 1 } },
        { label: "Sun-bleached surfer", plain: "Light golden hair with streaks.", set: { setting: "light", undertone: "golden", dye: "highlights", variation: 4 } },
      ],
    },
  });

  W.add("hairShine", {
    sliders: [
      ["wetLook", "Wet look", ["dry", "damp", "slicked"], "How wet or greased the hair looks."],
      ["streak", "Shiny streak along the hair", ["none", "soft", "bright"], "A band of light that runs along the hair."],
      ["shinesWhen", "Shines when", ["always", "as they turn", "in the hero moment"], "The moment the shine is saved for to catch the eye.", U],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "setting" },
        { face: "dial", slider: "howMuch" },
        { face: "ladder", slider: "wetLook" },
      ],
      groups: [
        { label: "Shine", sliders: ["setting", "howMuch", "streak", "noticeable"] },
        { label: "Wet", sliders: ["wetLook"] },
        { label: "Timing", sliders: ["shinesWhen"] },
      ],
      presets: [
        { label: "Shampoo commercial", plain: "Glossy hair that flashes as they turn.", set: { setting: "glossy", howMuch: 5, streak: "bright", shinesWhen: "as they turn" } },
        { label: "Slicked-back gangster", plain: "Glossy, slicked hair.", set: { setting: "glossy", wetLook: "slicked", streak: "soft" } },
        { label: "Tired and unwashed", plain: "Dull hair with no shine.", set: { setting: "dull", howMuch: 0, streak: "none", wetLook: "dry" } },
      ],
    },
  });

  W.add("furResponse", {
    sliders: [
      ["travels", "How the motion travels", ["all at once", "in a ripple", "in waves"], "Whether the whole coat moves together or in rolling waves."],
      ["bristle", "Bristles with feeling", ["never", "when startled", "when angry or scared"], "Whether the fur stands up to show the creature's emotion."],
      ["settles", "Settles after", ["at once", "after a moment", "keeps swaying"], "How long the fur keeps moving after the push stops."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { nothing: "➖", wind: "🌬️", "the body": "🏃", both: "🌀" } },
        { face: "dial", slider: "strength" },
      ],
      groups: [
        { label: "What moves it", sliders: ["setting", "strength", "travels"] },
        { label: "Feeling", sliders: ["bristle"] },
        { label: "Over time", sliders: ["settles", "change"] },
      ],
      presets: [
        { label: "Lion in the wind", plain: "The mane rolling in waves on the breeze.", set: { setting: "wind", strength: 4, travels: "in waves", settles: "keeps swaying" } },
        { label: "Startled cat", plain: "Fur bristles the instant it is startled.", set: { setting: "the body", bristle: "when startled", travels: "all at once" } },
        { label: "Still portrait", plain: "Nothing moves the fur.", set: { setting: "nothing", strength: 0 } },
      ],
    },
  });

  W.add("furLag", {
    sliders: [
      ["overshoot", "Swings past and back", ["no", "a little", "a lot"], "Whether the fur swings past where it should stop."],
      ["feelsLike", "Feels", ["light and fluffy", "natural", "heavy and wet"], "The weight the trailing fur suggests."],
      ["sells", "Sells big moves", ["no", "on fast turns", "on every move"], "Whether the trailing fur is used to make movement feel bigger."],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "springiness", xLabel: "Lag", yLabel: "Spring" },
        { face: "ladder", slider: "overshoot" },
      ],
      groups: [
        { label: "Trailing", sliders: ["setting", "springiness", "overshoot"] },
        { label: "Feel", sliders: ["feelsLike", "sells", "noticeable"] },
      ],
      presets: [
        { label: "Animated fluffball", plain: "Bouncy fur that swings well past each move.", set: { setting: 2, springiness: 4, overshoot: "a lot", feelsLike: "light and fluffy", sells: "on every move" } },
        { label: "Wet dog", plain: "Heavy fur that drags behind.", set: { setting: 3, springiness: 1, feelsLike: "heavy and wet", overshoot: "no" } },
        { label: "Tight and crisp", plain: "Fur that keeps up with every move.", set: { setting: 0, springiness: 2, overshoot: "no" } },
      ],
    },
  });

  W.add("curl", {
    sliders: [
      ["spin", "Which way it turns", ["left", "right", "both ways"], "The direction the swirls turn.", U],
      ["speed", "How fast it turns", [0, 5, ""], "How quickly each swirl spins."],
      ["holds", "How long a curl lasts", ["breaks up fast", "holds a while", "holds its shape"], "Whether each swirl breaks apart or keeps its shape."],
      ["curlsAround", "Curls around", ["nothing", "a person moving through", "a beam of light"], "What the swirls wrap around, pointing the eye at it.", U],
    ],
    window: {
      faces: [
        { face: "pad", x: "setting", y: "size", xLabel: "Curl", yLabel: "Size" },
        { face: "compass", slider: "spin", angles: { left: 270, right: 90 } },
        { face: "dial", slider: "speed" },
      ],
      groups: [
        { label: "The swirl", sliders: ["setting", "size", "spin", "speed"] },
        { label: "Life and focus", sliders: ["holds", "curlsAround", "noticeable"] },
      ],
      presets: [
        { label: "Noir cigarette smoke", plain: "Small slow curls hanging in a beam of light.", set: { setting: 3, size: 1, speed: 1, holds: "holds its shape", curlsAround: "a beam of light" } },
        { label: "Ink in water", plain: "Big slow curls unfolding.", set: { setting: 4, size: 4, speed: 2, holds: "holds a while" } },
        { label: "Hero through the smoke", plain: "The swirls curl around someone walking through.", set: { setting: 4, curlsAround: "a person moving through", spin: "both ways" } },
      ],
    },
  });

  W.add("scatter", {
    sliders: [
      ["kind", "What is scattered", ["leaves", "litter", "rubble", "petals", "people"], "What is spread across the scene.", U],
      ["stirs", "Moving or still", ["lying still", "stirring", "blowing across"], "Whether the scattered things move."],
      ["clearPath", "Clears for the hero", ["no", "a little", "a clear path"], "Whether an empty path guides the eye to the main person."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { leaves: "🍂", litter: "🗞️", rubble: "🧱", petals: "🌸", people: "🧍" } },
        { face: "mixer", sliders: ["setting", "spread", "size"] },
      ],
      groups: [
        { label: "What and how much", sliders: ["kind", "setting", "size"] },
        { label: "Layout", sliders: ["spread", "clearPath"] },
        { label: "Movement", sliders: ["stirs"] },
      ],
      presets: [
        { label: "Autumn street", plain: "Leaves stirring along the ground.", set: { kind: "leaves", setting: 3, stirs: "stirring" } },
        { label: "After the explosion", plain: "Rubble lying everywhere, a path to the survivor.", set: { kind: "rubble", setting: 4, stirs: "lying still", clearPath: "a little" } },
        { label: "Wedding petals", plain: "Petals blowing across the couple's path.", set: { kind: "petals", stirs: "blowing across", clearPath: "a clear path", size: 1 } },
      ],
    },
  });

  W.add("clothLens", {
    sliders: [
      ["wet", "Wet", ["dry", "damp", "soaked"], "How wet the fabric is, which makes it heavy and clingy."],
      ["billow", "Billows for drama", ["never", "on big moments", "always"], "Whether the cloth swells on heroic moments to grab the eye."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "fabric", icons: { silk: "🧣", cotton: "👕", denim: "👖", leather: "🧥", "chain mail": "🛡️" } },
        { face: "balance", slider: "cling", left: "floats away", right: "clings" },
        { face: "ladder", slider: "tears" },
      ],
      groups: [
        { label: "Fabric", sliders: ["fabric", "stretch", "wrinkles", "wet"] },
        { label: "Movement", sliders: ["reacts", "cling", "billow"] },
        { label: "Damage", sliders: ["tears"] },
      ],
      presets: [
        { label: "Superhero cape", plain: "Light fabric that billows on the big moments.", set: { fabric: "silk", reacts: "flutter", cling: "floats away", billow: "on big moments" } },
        { label: "Rain-soaked shirt", plain: "Soaked cotton clinging to the body.", set: { fabric: "cotton", wet: "soaked", cling: "clings", reacts: "stiff" } },
        { label: "Battle-worn armor", plain: "Crumpled, ripped and heavy.", set: { fabric: "chain mail", wrinkles: "crumpled", tears: "rips" } },
      ],
    },
  });

  W.add("bitsLens", {
    sliders: [
      ["howMany", "How many", ["a few", "a scatter", "a flurry", "a storm"], "How thick the air is with bits."],
      ["fall", "How they move", ["float up", "hang", "drift down", "pour down"], "Which way and how fast the bits travel."],
      ["depth", "Where they are", ["far behind", "around the people", "right at the lens"], "How close to the camera the bits come."],
      ["arrives", "When they come", ["always there", "start slowly", "burst on a moment"], "Whether the bits are timed to a big moment."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "kind", icons: { dust: "🌫️", sparks: "🎇", snow: "❄️", rain: "🌧️", leaves: "🍂", ash: "⚫", confetti: "🎉", bubbles: "🫧" } },
        { face: "ladder", slider: "howMany" },
        { face: "ladder", slider: "fall" },
      ],
      groups: [
        { label: "What", sliders: ["kind", "size", "shine"] },
        { label: "How", sliders: ["howMany", "fall", "depth"] },
        { label: "Timing", sliders: ["life", "arrives"] },
      ],
      presets: [
        { label: "Victory confetti burst", plain: "A storm of confetti on the winning moment.", set: { kind: "confetti", howMany: "a storm", arrives: "burst on a moment", fall: "drift down" } },
        { label: "Snow globe", plain: "Flakes drifting gently and catching the light.", set: { kind: "snow", size: "flakes", howMany: "a scatter", fall: "drift down", shine: "catch the light" } },
        { label: "Blade Runner rain", plain: "Pouring rain right at the lens.", set: { kind: "rain", howMany: "a storm", fall: "pour down", depth: "right at the lens" } },
        { label: "Ash after the battle", plain: "Ash hanging in the air, lingering.", set: { kind: "ash", fall: "hang", life: "linger", howMany: "a flurry" } },
      ],
    },
  });

  W.add("furLens", {
    sliders: [
      ["overFilm", "Over the film", ["gets neater", "stays", "gets wilder"], "Whether the hair grows tidier or messier as the story goes on."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "groom", icons: { neat: "💇", "swept one way": "➡️", messy: "🌪️", "standing on end": "⚡" } },
        { face: "ladder", slider: "length" },
        { face: "mixer", sliders: ["frizz", "lag"] },
      ],
      groups: [
        { label: "Look", sliders: ["length", "thick", "curls", "color", "shine"] },
        { label: "Texture", sliders: ["clumps", "frizz", "wet", "groom"] },
        { label: "Movement and time", sliders: ["reacts", "lag", "overFilm"] },
      ],
      presets: [
        { label: "Mad scientist", plain: "Frizzy hair standing on end.", set: { groom: "standing on end", frizz: 5, curls: "wavy" } },
        { label: "Rain-soaked hero", plain: "Soaked, stringy and clumped.", set: { wet: "soaked and stringy", clumps: "tufted", groom: "messy" } },
        { label: "Shampoo ad", plain: "Glossy, neat and flowing in the wind.", set: { shine: "glossy", groom: "neat", reacts: "wind", length: "long" } },
      ],
    },
  });

  W.add("cutout", {
    sliders: [
      ["lightMatch", "Lighting matches the new place", ["not at all", "roughly", "perfectly"], "Whether the light on the person fits the new background."],
      ["shadow", "Shadow on the new ground", ["none", "soft", "solid"], "Whether the person casts a shadow into the new place."],
      ["fakeness", "Looks", ["seamless", "a bit stagey", "obviously fake on purpose"], "Whether the trick should be hidden or shown as a style."],
      ["reveal", "How the new background appears", ["cut in", "fades in", "wipes in"], "How the swap to the new place happens.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "green screen": "🟩", "auto cutout": "✂️", "shape mask": "⭕", "drawn mask": "✏️" } },
        { face: "dial", slider: "edge" },
        { face: "ladder", slider: "lightMatch" },
      ],
      groups: [
        { label: "Cutting out", sliders: ["setting", "edge"] },
        { label: "The new place", sliders: ["newBack", "reveal"] },
        { label: "Selling it", sliders: ["lightMatch", "shadow", "fakeness"] },
      ],
      presets: [
        { label: "Seamless blockbuster", plain: "A green screen you never notice.", set: { setting: "green screen", edge: 30, lightMatch: "perfectly", shadow: "soft", fakeness: "seamless" } },
        { label: "Monty Python cutout", plain: "Deliberately fake, flat and funny.", set: { setting: "shape mask", lightMatch: "not at all", shadow: "none", fakeness: "obviously fake on purpose", newBack: "an image" } },
        { label: "Talking head on blur", plain: "A quick auto cutout over a blurred background.", set: { setting: "auto cutout", newBack: "blurred", edge: 50, fakeness: "a bit stagey" } },
      ],
    },
  });

  W.add("maskShape", {
    sliders: [
      ["across", "Across the picture", ["left", "center", "right"], "Where the mask sits from side to side."],
      ["height", "Up or down", ["low", "middle", "high"], "Where the mask sits from bottom to top."],
      ["size", "Size", [5, 100, "%"], "How much of the picture the mask covers."],
      ["moves", "Moves over time", ["stays put", "drifts", "follows the action"], "Whether the mask stays still or travels to guide the eye."],
    ],
    window: {
      faces: [
        { face: "frame", x: "across", y: "height", size: "size" },
        { face: "tiles", slider: "setting", icons: { none: "➖", vignette: "🔅", circle: "⭕", rectangle: "▭", gradient: "🌅", drawn: "✏️", "follows a person": "🧍" } },
        { face: "dial", slider: "feather" },
      ],
      groups: [
        { label: "Shape", sliders: ["setting", "feather", "invert"] },
        { label: "Place and size", sliders: ["across", "height", "size"] },
        { label: "Over time", sliders: ["moves"] },
      ],
      presets: [
        { label: "Silent-film iris", plain: "A hard-edged circle closing on the face.", set: { setting: "circle", feather: 20, size: 40, invert: "inside", across: "center" } },
        { label: "Spotlight on the hero", plain: "A soft vignette that follows the action.", set: { setting: "vignette", feather: 80, moves: "follows the action" } },
        { label: "Graduated sky", plain: "A soft gradient across the top of the frame.", set: { setting: "gradient", height: "high", feather: 90, moves: "stays put" } },
      ],
    },
  });

  W.add("tracking", {
    sliders: [
      ["lead", "Behind, on or ahead", ["lags behind", "right on it", "leads a little"], "Whether the tracked thing trails, sticks to or leads the motion."],
      ["side", "Sits beside it", ["above", "right", "below", "left", "on top"], "Where the tracked item sits next to its target.", U],
      ["followFor", "How long it follows", ["a moment", "a few seconds", "the whole shot"], "How long the tracking lasts."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "text follows": "🔤", "sticker follows": "⭐", "mask follows": "⭕", "frame follows": "🎯" } },
        { face: "compass", slider: "side", angles: { above: 0, right: 90, below: 180, left: 270 } },
        { face: "dial", slider: "smooth" },
      ],
      groups: [
        { label: "What follows what", sliders: ["setting", "target", "side"] },
        { label: "How it follows", sliders: ["smooth", "lead", "followFor"] },
      ],
      presets: [
        { label: "Name tag that follows", plain: "A name above a face for the whole shot.", set: { setting: "text follows", target: "a face", side: "above", followFor: "the whole shot" } },
        { label: "Sports replay highlight", plain: "A ring that sticks to a player.", set: { setting: "mask follows", target: "a body", smooth: 60, lead: "right on it", side: "on top" } },
        { label: "Locked-on frame", plain: "The frame floats after a subject, a touch behind.", set: { setting: "frame follows", smooth: 90, lead: "lags behind" } },
      ],
    },
  });

  W.add("videoEffect", {
    sliders: [
      ["comesIn", "How it comes in", ["snaps on", "fades in", "builds up"], "How the effect arrives.", U],
      ["lasts", "How long it lasts", [0, 10, "s"], "How long the effect stays on."],
      ["usedTo", "Used to", ["decorate", "punctuate a moment", "change the mood"], "The job the effect does for the audience.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", glow: "🌟", blur: "🌫️", glitch: "📺", "old TV": "📼", shake: "📳", flash: "⚡", "zoom pulse": "🔍", "light leak": "🌅", mirror: "🪞", outline: "✏️" } },
        { face: "dial", slider: "intensity" },
        { face: "balance", slider: "onBeat", left: "steady", right: "on the beat" },
      ],
      groups: [
        { label: "The effect", sliders: ["setting", "intensity", "body"] },
        { label: "Timing", sliders: ["onBeat", "comesIn", "lasts"] },
        { label: "Purpose", sliders: ["usedTo"] },
      ],
      presets: [
        { label: "Music-video zoom pulse", plain: "The picture pumps on every beat.", set: { setting: "zoom pulse", onBeat: "on the beat", intensity: 70, usedTo: "decorate" } },
        { label: "VHS memory", plain: "An old-TV look that fades in for a flashback.", set: { setting: "old TV", comesIn: "fades in", intensity: 60, usedTo: "change the mood" } },
        { label: "Impact flash", plain: "A one-second flash to punch a hit.", set: { setting: "flash", comesIn: "snaps on", lasts: 1, usedTo: "punctuate a moment" } },
      ],
    },
  });

  W.add("videoEffectFamily", {
    sliders: [
      ["vibe", "Mood it adds", ["calm", "fun", "wild"], "How much energy the effect family brings."],
      ["switches", "Switches family", ["never", "each scene", "on the beat"], "How often the edit changes to a different family."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", classic: "🎬", retro: "📼", glitch: "📺", light: "💡", party: "🎉", sparkle: "✨", comics: "💬", "3D": "🧊", motion: "💨" } },
        { face: "dial", slider: "intensity" },
        { face: "ladder", slider: "spread" },
      ],
      groups: [
        { label: "Family", sliders: ["setting", "vibe"] },
        { label: "Strength and reach", sliders: ["intensity", "spread"] },
        { label: "Timing", sliders: ["onBeat", "switches"] },
      ],
      presets: [
        { label: "Retro throwback", plain: "A gentle retro look over the whole frame.", set: { setting: "retro", intensity: 50, vibe: "calm", spread: "the whole frame" } },
        { label: "Party edit", plain: "Party effects that switch on the beat.", set: { setting: "party", onBeat: "on the beat", switches: "on the beat", vibe: "wild" } },
        { label: "Comic-book panel", plain: "Comic touches around the subject.", set: { setting: "comics", spread: "around the subject", vibe: "fun" } },
      ],
    },
  });

  W.add("multiplyEffect", {
    sliders: [
      ["arrange", "Arrangement", ["neat grid", "loose scatter", "stacked", "in a ring"], "How the copies are laid out.", U],
      ["differ", "Copies differ", ["identical", "slightly delayed", "different colors"], "How different each copy is from the others."],
      ["appear", "How the copies appear", ["all at once", "one by one", "burst out"], "How the copies arrive over time."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "split copies": "◫", "polaroid stack": "📸", "spinning copies": "🌀", grid: "▦", "gallery wall": "🖼️", cube: "🧊" } },
        { face: "dial", slider: "count" },
      ],
      groups: [
        { label: "Copies", sliders: ["setting", "count", "arrange", "differ"] },
        { label: "Motion and timing", sliders: ["motion", "appear"] },
      ],
      presets: [
        { label: "Warhol pop grid", plain: "A neat grid of copies in different colors.", set: { setting: "grid", count: 9, arrange: "neat grid", differ: "different colors", motion: "still" } },
        { label: "Polaroid flashback", plain: "Snapshots stacking up one by one.", set: { setting: "polaroid stack", appear: "one by one", arrange: "stacked", count: 5 } },
        { label: "Hypnotic spin", plain: "Copies spinning in a ring.", set: { setting: "spinning copies", arrange: "in a ring", motion: "spinning", differ: "slightly delayed" } },
      ],
    },
  });

  W.add("lightEffect", {
    sliders: [
      ["comesFrom", "Where it comes from", ["top left", "top", "top right", "right", "left"], "The side of the picture the light pours in from.", U],
      ["moves", "How it moves", ["still", "slow sweep", "flickers", "pulses"], "Whether the added light stays put or moves."],
      ["hitsOn", "When it hits", ["always on", "on a reveal", "on the beat"], "The moment the light is saved for.", U],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "warmth", colors: { cool: "#9cc4ff", neutral: "#f4f4f4", warm: "#ffc58a", golden: "#ffb43b" } },
        { face: "compass", slider: "comesFrom", angles: { "top left": 315, top: 0, "top right": 45, right: 90, left: 270 } },
        { face: "dial", slider: "strength" },
      ],
      groups: [
        { label: "The light", sliders: ["setting", "strength", "warmth"] },
        { label: "Direction and movement", sliders: ["comesFrom", "moves"] },
        { label: "Timing", sliders: ["hitsOn"] },
      ],
      presets: [
        { label: "Spielberg god rays", plain: "Golden rays sweeping down from above.", set: { setting: "god rays", comesFrom: "top", warmth: "golden", moves: "slow sweep" } },
        { label: "J.J. Abrams flare", plain: "Cool lens flares sweeping across.", set: { setting: "sun flare", warmth: "cool", moves: "slow sweep", strength: 70 } },
        { label: "Holy reveal", plain: "A golden halo that blooms on the reveal.", set: { setting: "halo", warmth: "golden", hitsOn: "on a reveal", strength: 80 } },
      ],
    },
  });

  W.add("bodyEffect", {
    sliders: [
      ["showsWhen", "When it shows", ["the whole time", "on big moves", "on the beat"], "The moments the effect is saved for.", U],
      ["trail", "Leaves a trail", ["none", "short", "long"], "How much of the effect lingers behind the moving body."],
      ["color", "Color", ["white", "gold", "neon", "red", "blue"], "The color of the effect.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "clone trail": "👥", "glowing lines": "〰️", outline: "✏️", superpower: "⚡", hallucination: "🌀", "portrait glow": "🌟" } },
        { face: "swatches", slider: "color", colors: { white: "#f5f5f5", gold: "#f2b632", neon: "#39ff88", red: "#e23b2e", blue: "#3d8bff" } },
        { face: "dial", slider: "intensity" },
      ],
      groups: [
        { label: "The effect", sliders: ["setting", "who", "color"] },
        { label: "Strength", sliders: ["intensity", "trail"] },
        { label: "Timing", sliders: ["showsWhen"] },
      ],
      presets: [
        { label: "Dance video glow", plain: "Neon lines on the dancer, pulsing on the beat.", set: { setting: "glowing lines", color: "neon", showsWhen: "on the beat", trail: "short" } },
        { label: "Fight-scene trail", plain: "A long clone trail on big moves.", set: { setting: "clone trail", showsWhen: "on big moves", trail: "long", intensity: 80 } },
        { label: "Soft portrait", plain: "A gentle glow on the main character.", set: { setting: "portrait glow", who: "the main character", intensity: 30, color: "white" } },
      ],
    },
  });

  W.add("cloneEffect", {
    sliders: [
      ["ghostly", "Copies fade", ["solid", "see-through", "ghostly"], "How solid the copies look."],
      ["apart", "How far apart", ["overlapping", "side by side", "all around"], "How spread out the copies are."],
      ["when", "When they appear", ["the whole time", "on fast moves", "on a hit"], "The moments the copies are saved for.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "clone trail": "👥", "ninja doubles": "🥷", "X clone": "❌", "clone burst": "💥", "fragment clone": "🧩", phantom: "👻" } },
        { face: "dial", slider: "count" },
        { face: "ladder", slider: "delay" },
      ],
      groups: [
        { label: "Copies", sliders: ["setting", "count", "apart", "ghostly"] },
        { label: "Timing", sliders: ["delay", "when"] },
      ],
      presets: [
        { label: "Ninja shadow doubles", plain: "Solid doubles appearing around them on a hit.", set: { setting: "ninja doubles", count: 4, apart: "all around", ghostly: "solid", when: "on a hit" } },
        { label: "Speed trail", plain: "See-through copies trailing on fast moves.", set: { setting: "clone trail", count: 5, delay: "a little behind", ghostly: "see-through", when: "on fast moves" } },
        { label: "Phantom presence", plain: "One ghostly copy lagging far behind.", set: { setting: "phantom", count: 1, delay: "far behind", ghostly: "ghostly" } },
      ],
    },
  });

  W.add("outlineEffect", {
    sliders: [
      ["pulse", "Pulses", ["steady", "slow breathing", "on the beat"], "Whether the outline holds still or throbs."],
      ["glow", "Glow spreads out", ["tight line", "soft glow", "big aura"], "How far the glow spills from the edge."],
      ["appears", "How it appears", ["always on", "draws itself on", "flares on a moment"], "How the outline arrives, drawing the eye to the person."],
    ],
    window: {
      faces: [
        { face: "swatches", slider: "color", colors: { white: "#f5f5f5", gold: "#f2b632", neon: "#39ff88", rainbow: "#c86bff" } },
        { face: "ladder", slider: "glow" },
        { face: "tiles", slider: "setting", icons: { none: "➖", "glowing lines": "〰️", "sparkle edge": "✨", "rainbow edge": "🌈", "paper stroke": "📄", "hand-drawn": "✏️", "flame outline": "🔥", aura: "🔆", "figure glare": "🌟" } },
      ],
      groups: [
        { label: "The outline", sliders: ["setting", "thickness", "color", "glow"] },
        { label: "Timing", sliders: ["pulse", "appears"] },
      ],
      presets: [
        { label: "Chosen-one aura", plain: "A gold aura that flares on the big moment.", set: { setting: "aura", color: "gold", glow: "big aura", appears: "flares on a moment" } },
        { label: "Hand-drawn vlog", plain: "A white hand-drawn line that draws itself on.", set: { setting: "hand-drawn", color: "white", thickness: "medium", glow: "tight line", appears: "draws itself on" } },
        { label: "Neon dance", plain: "Neon lines pulsing on the beat.", set: { setting: "glowing lines", color: "neon", pulse: "on the beat", glow: "soft glow" } },
      ],
    },
  });

  W.add("distortionEffect", {
    sliders: [
      ["bendSpeed", "How fast it bends", ["slow melt", "steady", "sudden snap"], "How quickly the picture warps."],
      ["area", "Where", ["the edges", "around a person", "the whole frame"], "How much of the picture is bent."],
      ["cause", "Set off by", ["nothing", "a feeling", "a hit", "the music"], "What motivates the warp for the audience.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", ripple: "〰️", "power blur": "💨", "insistent blur": "🌫️", "into stardust": "✨", "mist dissipates": "☁️", "shaky outline": "📳", "water shine": "💧", "ripple warp": "🌊", "glassy stir": "🔮", "projector clones": "📽️" } },
        { face: "dial", slider: "strength" },
        { face: "balance", slider: "settles", left: "stays bent", right: "settles back" },
      ],
      groups: [
        { label: "The bend", sliders: ["setting", "strength", "area"] },
        { label: "Timing", sliders: ["bendSpeed", "settles", "cause"] },
      ],
      presets: [
        { label: "Dream ripple flashback", plain: "A slow ripple across the frame into a memory.", set: { setting: "ripple", bendSpeed: "slow melt", area: "the whole frame", settles: "settles back", cause: "a feeling" } },
        { label: "Thanos snap", plain: "A person turning to stardust and staying gone.", set: { setting: "into stardust", area: "around a person", settles: "stays bent", strength: 90 } },
        { label: "Punch shockwave", plain: "A sudden blur on the hit, then back.", set: { setting: "power blur", bendSpeed: "sudden snap", cause: "a hit", settles: "settles back" } },
      ],
    },
  });

  W.add("partyEffect", {
    sliders: [
      ["every", "How often", ["once", "every bar", "every beat", "double time"], "How often the flashes come."],
      ["flashColor", "Color of the flash", ["white", "warm", "cool", "rainbow"], "The color of each flash.", U],
      ["savedFor", "Saves it for", ["anywhere", "the drop", "the final chorus"], "The musical moment the flashing is saved for.", U],
    ],
    window: {
      faces: [
        { face: "ladder", slider: "every" },
        { face: "swatches", slider: "flashColor", colors: { white: "#ffffff", warm: "#ffb35c", cool: "#7fb4ff", rainbow: "#d36bff" } },
        { face: "dial", slider: "strength" },
      ],
      groups: [
        { label: "The flash", sliders: ["setting", "strength", "flashColor"] },
        { label: "Timing", sliders: ["onBeat", "every", "savedFor"] },
      ],
      presets: [
        { label: "Club strobe", plain: "White strobes on every beat.", set: { setting: "strobe pulse", onBeat: "on the beat", every: "every beat", flashColor: "white" } },
        { label: "Drop shockwave", plain: "One big shockwave right on the drop.", set: { setting: "shockwave", every: "once", savedFor: "the drop", strength: 100 } },
        { label: "Rainbow party", plain: "Rainbow flashes every bar.", set: { setting: "party beats", flashColor: "rainbow", every: "every bar", onBeat: "on the beat" } },
      ],
    },
  });

  W.add("blendMode", {
    sliders: [
      ["fadesIn", "How it fades in", ["cuts in", "quick fade", "slow fade"], "How the blended layer arrives over time."],
      ["purpose", "Used for", ["texture", "light and flare", "double exposure", "darkening"], "What the blended layer is there to do.", U],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { normal: "🔲", screen: "🔆", multiply: "🌑", overlay: "🎨", lighten: "☀️", darken: "🌘", add: "➕" } },
        { face: "dial", slider: "opacity" },
      ],
      groups: [
        { label: "Mixing", sliders: ["setting", "opacity", "layers"] },
        { label: "Purpose and timing", sliders: ["purpose", "fadesIn"] },
      ],
      presets: [
        { label: "Dreamy double exposure", plain: "Two shots melting into each other.", set: { setting: "screen", opacity: 50, purpose: "double exposure", fadesIn: "slow fade" } },
        { label: "Film grain texture", plain: "A faint texture laid over everything.", set: { setting: "overlay", opacity: 25, purpose: "texture", layers: 1 } },
        { label: "Light-leak flare", plain: "Warm light added on top.", set: { setting: "add", opacity: 70, purpose: "light and flare", fadesIn: "quick fade" } },
      ],
    },
  });

  W.add("stockClip", {
    sliders: [
      ["fit", "How well it matches", ["obviously different", "close", "seamless"], "Whether the stock clip blends with your own footage."],
      ["edited", "Changed in the app", ["untouched", "trimmed", "recolored and trimmed"], "How much the library clip is edited, which CapCut asks for before export."],
      ["placed", "Where it comes", ["opening", "middle", "ending"], "Where in the film the stock clip sits."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", "green screen": "🟩", background: "🖼️", "intro or end card": "🎬", scenery: "🏞️", atmosphere: "🌫️", "everyday life": "🚶", "transition clip": "🔀" } },
        { face: "dial", slider: "length" },
        { face: "ladder", slider: "fit" },
      ],
      groups: [
        { label: "The clip", sliders: ["setting", "use", "length"] },
        { label: "Fitting it in", sliders: ["fit", "edited", "placed"] },
      ],
      presets: [
        { label: "Establishing city shot", plain: "A short scenery clip opening the film, recolored to match.", set: { setting: "scenery", use: "a cutaway", length: 4, placed: "opening", edited: "recolored and trimmed", fit: "seamless" } },
        { label: "Mood atmosphere layer", plain: "Atmosphere laid over the top of a scene.", set: { setting: "atmosphere", use: "laid over the top", edited: "trimmed", fit: "close" } },
        { label: "End card", plain: "A ready-made end card to close.", set: { setting: "intro or end card", placed: "ending", length: 5, edited: "trimmed" } },
      ],
    },
  });

  W.add("generatedShot", {
    sliders: [
      ["style", "Look", ["real footage", "painterly", "animated", "dreamlike"], "The style the generated shot is made in.", U],
      ["blends", "Matches the filmed shots", ["stands apart", "close", "blends in"], "Whether the generated shot looks like the rest of your footage."],
      ["motion", "How much moves", ["still", "a little", "a lot"], "How much movement there is inside the generated shot."],
    ],
    window: {
      faces: [
        { face: "tiles", slider: "setting", icons: { none: "➖", image: "🖼️", video: "🎞️", "dialogue scene": "🗣️" } },
        { face: "dial", slider: "length" },
        { face: "ladder", slider: "blends" },
      ],
      groups: [
        { label: "The shot", sliders: ["setting", "from", "style"] },
        { label: "Length and movement", sliders: ["length", "motion"] },
        { label: "Fitting in", sliders: ["blends"] },
      ],
      presets: [
        { label: "Invisible insert shot", plain: "A short realistic video that blends with the rest.", set: { setting: "video", style: "real footage", blends: "blends in", length: 3, motion: "a little" } },
        { label: "Painted dream sequence", plain: "A painterly shot that clearly stands apart.", set: { setting: "video", style: "painterly", blends: "stands apart", motion: "a lot" } },
        { label: "Storybook still", plain: "A still animated image from a picture.", set: { setting: "image", style: "animated", motion: "still", from: "a picture" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
