/* Light: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("lightChange", {
    "someone hits the lights": { setting: "on the action", trigger: "a switch", direction: "much brighter", rampTime: 0 },
    "lights out": { setting: "on the action", trigger: "a switch", direction: "much darker", changeStops: -4, rampTime: 0 },
    "a cloud rolls over": { setting: "during the hold", trigger: "a cloud", direction: "darker", rampTime: 6 },
    "the door lets light in": { setting: "on the action", trigger: "a door", direction: "brighter", changeArea: 40 },
    "slowly fade the light": { setting: "during the hold", rampTime: 20, speed: 1 },
    "change it on the cut": { setting: "on the cut", rampTime: 0 },
    "make it scarier": { trigger: "a door", direction: "much darker", eyeLead: "to a corner" },
    "light up their face": { direction: "brighter", eyeLead: "to a face" },
    "keep the light steady": { setting: "never", direction: "same" },
    "lead us to what's next": { eyeLead: "to what comes next", lead: -1 },
  });

  W.say("timeOfDay", {
    "magic hour": { setting: "dusk", hour: 19, sunHeight: 5, sky: "clear", shadowLength: "stretched" },
    "golden hour": { setting: "dusk", hour: 18, sunHeight: 8, shadowLength: "long" },
    "high noon": { setting: "day", hour: 12, sunHeight: 85, shadowLength: "short" },
    "blue hour": { setting: "dusk", hour: 20, sunHeight: 0, sky: "clear" },
    "crack of dawn": { setting: "dawn", hour: 5, sunHeight: 2 },
    "middle of the night": { setting: "night", hour: 2 },
    "gloomy day": { setting: "day", sky: "overcast" },
    "a storm is coming": { sky: "stormy" },
    "time flies by": { clockPace: "time-lapse", timePassed: 600 },
    "into the sunset": { setting: "dusk", sunHeight: 3, sunFromCamera: 0, shadowLength: "stretched" },
    "sun behind them": { sunFromCamera: 180 },
  });

  W.say("practicalInFrame", {
    "lit by candles": { setting: "yes", kind: "candle", doesWork: "the main light", flicker: "faint flicker" },
    "just the tv glow": { setting: "yes", kind: "screen", count: 1, doesWork: "the main light", flicker: "flicker" },
    "neon outside the window": { setting: "yes", kind: "neon sign", drawsEye: "catches the eye" },
    "a lamp in the background": { setting: "yes", kind: "lamp", doesWork: "just decoration", drawsEye: "hides in the back" },
    "sitting by the fire": { setting: "yes", kind: "fire", flicker: "flicker", doesWork: "the main light", fromFaces: 1 },
    "the bulb is dying": { flicker: "sputters", flickerRate: 6 },
    "they flip on a lamp": { setting: "yes", kind: "lamp", switchMoment: "turns on" },
    "make it cozier": { setting: "yes", kind: "lamp", count: 3, doesWork: "a little" },
    "no lamps in shot": { setting: "no", count: 0 },
  });

  W.say("wetness", {
    "make it rain": { setting: "soaked", rainFall: "rain", rainRate: 10 },
    "pouring rain": { setting: "soaked", rainFall: "downpour", rainRate: 60, puddles: "many" },
    "just after the rain": { setting: "damp", rainFall: "none", puddles: "a few", dryingPace: "drying out" },
    "wet down the street": { setting: "soaked", reflections: 80, puddles: "many", wetShare: 70 },
    "light drizzle": { setting: "damp", rainFall: "drizzle", rainRate: 2 },
    "make it moodier": { setting: "soaked", reflections: 70, rainFall: "rain" },
    "bone dry": { setting: "dry", rainFall: "none", puddles: "none", wetShare: 0 },
    "the street is flooding": { puddles: "flooded", dryingPace: "getting wetter", rainFall: "downpour" },
  });

  W.say("glow", {
    "make it glow": { setting: "object", brightness: 4, bloom: 50, spill: "a halo" },
    "glowing briefcase": { setting: "object", color: "warm", spill: "lights the faces", pull: "center of attention" },
    "make it magical": { setting: "object", color: "warm", pulse: "slow breath", bloom: 70 },
    "a glowing heart": { setting: "person", pulse: "heartbeat", pulseRate: 70, color: "colored" },
    "make them look angelic": { setting: "person", color: "white", spill: "a halo", bloom: 60 },
    "the whole room glows": { setting: "room", spill: "floods the room", reach: 10 },
    "a faint glow": { brightness: 1, bloom: 15, pull: "background" },
    "make it pulse": { pulse: "slow breath", pulseRate: 20 },
    "sci-fi console glow": { setting: "room", color: "cool", pulse: "steady" },
  });

  W.say("wear", {
    "brand new": { setting: "new", howMuch: 0, age: "months" },
    "lived in": { setting: "used", howMuch: 2, spread: "edges", age: "years" },
    "beat up": { setting: "used", howMuch: 4, kind: "scratches", spread: "most surfaces" },
    "abandoned for years": { setting: "ruined", kind: "dust", age: "decades", spread: "everything" },
    "make it creepier": { setting: "ruined", kind: "stains", age: "a century", story: "hints at the past" },
    "rusted out": { setting: "ruined", kind: "rust", spread: "most surfaces" },
    "used future": { setting: "used", kind: "scratches", spread: "edges", story: "background detail" },
    "the stain is a clue": { kind: "stains", spread: "one spot", story: "a clue we're shown" },
    "falling apart": { worsens: "falls apart", setting: "ruined" },
  });

  W.say("colorAccent", {
    "the red coat": { setting: "one thing in a strong color", accentHue: "red", carrier: "clothing", restColor: "black and white" },
    "make one thing pop": { setting: "one clear thing", restColor: "muted", accentVsRest: 80 },
    "a splash of color": { setting: "a small spot", accentShare: 5 },
    "everything gray but this": { restColor: "nearly gray", accentVsRest: 100 },
    "yellow raincoat": { setting: "one thing in a strong color", accentHue: "yellow", carrier: "clothing" },
    "red means danger": { accentHue: "red", recurs: "now and then", leads: "to a clue" },
    "it keeps coming back": { recurs: "every scene" },
    "point us to the clue": { leads: "to a clue", setting: "one clear thing" },
    "no color accent": { setting: "none", accentShare: 0 },
  });

  W.say("colorDrift", {
    "warm it up slowly": { setting: "slow drift", driftWay: "warmer", driftTime: 60, driftKelvin: 1000 },
    "a sudden chill": { setting: "sudden change", driftWay: "much cooler", driftKelvin: -2500, driftTime: 1 },
    "go cold at the turn": { setting: "clear shift", driftWay: "cooler", startsAt: "at the turn", follows: "the story's turn" },
    "follow their mood": { follows: "the mood", setting: "slow drift" },
    "sun goes down as they talk": { setting: "slow drift", driftWay: "warmer", follows: "the clock", driftBright: -1 },
    "make it feel hopeful": { driftWay: "warmer", driftBright: 1, startsAt: "near the end" },
    "drain the warmth": { driftWay: "much cooler", driftColor: -60 },
    "hold the color": { setting: "steady", driftWay: "same", driftKelvin: 0 },
  });

  W.say("lightingLens", {
    "film noir": { mood: "dark and harsh", key: "side", softness: "hard", valueKey: "low key", lightShape: "blinds", shadows: "deep" },
    "make it scarier": { mood: "dark and harsh", key: "under", faceLight: "half lit", shadows: "deep" },
    "bright and sunny": { mood: "bright and warm", valueKey: "high key", softness: "soft", motivation: "the sky" },
    "more dramatic": { contrast: 5, key: "side", shadows: "deep", faceVsRoom: 2 },
    "flatter it": { mood: "soft", softness: "soft", key: "front", faceLight: "fully lit" },
    "spielberg beams": { atmosphere: "beams", key: "back", rim: "strong", motivation: "a window" },
    "campfire light": { motivation: "a fire or candle", key: "under", movement: "flickers", colorTemp: "warm practical" },
    "hide their face": { faceLight: "face hidden", key: "back" },
    "make them look powerful": { key: "under", rim: "strong", contrast: 4, eyeTo: "the face" },
    "make it calmer": { mood: "soft", contrast: 1, movement: "still" },
  });

  W.say("lightRigLens", {
    "light from a window": { lightType: "window", softness: "soft", ratio: "gentle", bounce: "a little" },
    "vermeer window light": { lightType: "window", softness: "soft", ratio: "dramatic", falloff: "fades across the room" },
    "interrogation room": { lightType: "bare bulb", softness: "hard", ratio: "one side black", falloff: "drops off fast" },
    "on stage": { lightType: "spotlight", linking: "only the hero", falloff: "drops off fast" },
    "fill it in": { bounce: "rich bounce", bounceShare: 50, ratio: "flat and even" },
    "let it fall off": { falloff: "drops off fast", halfDistance: 1 },
    "smoky backlit room": { haze: "beams", rim: "strong" },
    "only light the hero": { linking: "only the hero" },
  });

  W.say("skinLens", {
    "beauty commercial skin": { glowThrough: "soft glow", detail: "airbrushed", oil: "natural", shineShare: 10 },
    "make them sweat": { oil: "sweaty", shineShare: 60 },
    "dewy skin": { oil: "dewy", glowThrough: "soft glow" },
    "they're blushing": { flush: "flushed", flushTiming: "with the emotion", flushTime: 3 },
    "white as a ghost": { flush: "pale", glowThrough: "waxy" },
    "show every pore": { detail: "every pore" },
    "backlit ears": { glowThrough: "ears glow red", skinLight: 4 },
    "make them look sick": { flush: "pale", oil: "sweaty", glowThrough: "waxy" },
    "turning red with anger": { flush: "bright red", flushTiming: "suddenly", flushTime: 2 },
  });

  W.say("lightPlace", {
    "light from the side": { around: 90, height: 10 },
    "rembrandt light": { around: 45, height: 40, size: "medium", fill: 20 },
    "light from below": { around: 0, height: -40, size: "small" },
    "light from above": { around: 0, height: 80 },
    "backlight them": { around: 180, height: 20 },
    "straight on": { around: 0, height: 0, fill: 60 },
    "big soft source": { size: "a whole window", distance: 2 },
    "bring the light closer": { distance: 1 },
    "push the light back": { distance: 10 },
    "make it moodier": { around: 100, fill: 5, size: "small" },
    "make them look powerful": { around: 30, height: -20, fill: 15 },
    "flat and friendly": { around: 10, height: 20, fill: 80, size: "large" },
  });

  W.say("key", {
    "rembrandt lighting": { setting: "side", height: 45, ratio: 4, litSide: "side turned away" },
    "half in shadow": { setting: "side", height: 10, ratio: 8, faceLit: 50 },
    "flashlight under the chin": { setting: "under", height: 0, ratio: 8 },
    "old hollywood glamour": { setting: "front", height: 50, ratio: 2, eyeLight: "bright" },
    "short side lighting": { litSide: "side turned away" },
    "broad lighting": { litSide: "side facing us" },
    "put a glint in their eyes": { eyeLight: "bright" },
    "dead eyes": { eyeLight: "none" },
    "light swings around": { swing: "swings", swingRate: 90 },
    "make it scarier": { setting: "under", ratio: 10, eyeLight: "none" },
  });

  W.say("contrast", {
    "crush the blacks": { blacks: "crushed", shadowFill: "black" },
    "more punch": { setting: 4, contrastStops: 10 },
    "flatter": { setting: 1, shadowFill: "readable", blacks: "milky" },
    "faded memory look": { setting: 1, blacks: "milky", brights: "gentle" },
    "godfather office": { setting: 6, shadowFill: "black", blacks: "rich black", faceVsRoom: "brighter than the room" },
    "blow out the windows": { brights: "burned out" },
    "keep the highlights": { brights: "held" },
    "tension builds": { buildUp: "slowly harder", contrastTime: 30 },
    "make it more dramatic": { setting: 5, shadowFill: "dark", blacks: "rich black" },
  });

  W.say("colorTemp", {
    "cozy lamplight": { setting: "warm practical", kelvin: 2700, faceTemp: "warmer than the room" },
    "cold daylight": { setting: "cold day", kelvin: 6500 },
    "blue night warm window": { setting: "mixed", splitTemp: "warm in, cool out", splitKelvin: 3000 },
    "fluorescent office": { setting: "cold day", kelvin: 4500, cast: "green", castAmount: -12 },
    "candle warm": { kelvin: 1900, setting: "warm practical" },
    "make it feel lonely": { setting: "cold day", kelvin: 7500, faceTemp: "cooler than the room" },
    "make it feel romantic": { setting: "warm practical", kelvin: 3000, cast: "pink", castAmount: 6 },
    "follow the time of day": { shiftWith: "the time of day", tempTime: 60 },
    "warm faces cool room": { faceTemp: "warmer than the room", splitTemp: "a hint of both" },
  });

  W.say("lighting", {
    "moonlit": { setting: "moon", strength: 1, pools: "a few pools" },
    "poker table light": { setting: "practical", pools: "one pool", darkPlace: "corners", picksOut: "clearly" },
    "sitcom bright": { setting: "flat", strength: 4, pools: "even all over" },
    "spotlight them": { pools: "a single spot", picksOut: "only them" },
    "harsh light": { setting: "hard", strength: 4 },
    "pools of light": { pools: "a few pools", poolCount: 4 },
    "light shifts when they enter": { shiftCue: "on an entrance", shiftTime: 2 },
    "make it scarier": { setting: "moon", darkPlace: "over the faces", strength: 1 },
  });

  W.say("softness", {
    "make it softer": { setting: "soft", size: 4, diffusion: 70, edge: "feathered" },
    "hard shadows": { setting: "hard", edge: "razor sharp", diffusion: 0 },
    "desert sun": { setting: "hard", size: 0, sourceWidth: 0.05, edge: "razor sharp" },
    "overcast look": { setting: "soft", edge: "no edge", wrap: "all the way", sourceWidth: 6 },
    "beauty light": { setting: "soft", sourceWidth: 1.5, wrap: "halfway", distance: 1 },
    "wrap around the face": { wrap: "all the way" },
    "diffuse it": { diffusion: 60, edge: "feathered" },
    "gritty and harsh": { setting: "hard", edge: "crisp", wrap: "none" },
  });

  W.say("rim", {
    "edge light": { setting: "thin", width: "thin", separate: "clearly" },
    "hair light": { setting: "thin", rimHeight: 60, rimAround: 180 },
    "heroic halo": { setting: "strong", width: "halo", separate: "pops right out", rimVsKey: 2 },
    "separate them from the background": { setting: "thin", separate: "clearly" },
    "make them look angelic": { setting: "strong", width: "halo", color: "warmer" },
    "cool kicker": { setting: "thin", color: "cooler", rimSide: "right" },
    "glowing edges at the climax": { appears: "at the climax", rimFadeIn: 3, setting: "strong" },
    "kill the rim": { setting: "off", intensity: 0 },
  });

  W.say("lightCount", {
    "one light only": { setting: 1, fill: "none", bgLights: "none", keyShare: 100 },
    "three-point lighting": { setting: 3, fill: "a little", edgeLights: "one" },
    "tv studio coverage": { setting: 6, fill: "even fill", bgLights: "a few" },
    "party lights": { setting: 8, bgLights: "many", comeAndGo: "several switch", switchRate: 20 },
    "light the background": { bgLights: "a few" },
    "keep it simple": { setting: 2, fill: "a little" },
    "everything has a reason": { motivated: 100 },
  });

  W.say("lightShape", {
    "venetian blinds": { setting: "blinds", patternEdge: "sharp", fallsOn: "the people" },
    "under the trees": { setting: "leaves", sway: "sways", patternEdge: "soft" },
    "dappled light": { setting: "leaves", patternSize: "medium", patternShare: 40 },
    "cut it off the wall": { setting: "barndoor", fallsOn: "the wall" },
    "stripes across the face": { setting: "blinds", fallsOn: "the people", patternSize: "fine" },
    "leaves sway in the breeze": { setting: "leaves", sway: "sways", swayRate: 15 },
    "make it noir": { setting: "blinds", strength: 4, patternEdge: "sharp", patternAngle: 20 },
    "no cookies": { setting: "open", strength: 0 },
  });

  W.say("atmosphere", {
    "add some haze": { setting: "haze", thickness: 2, airKind: "haze" },
    "light through the windows": { setting: "beams", beams: "god rays", thickness: 3 },
    "fog rolls in": { airKind: "fog", drift: "rolling in", thickness: 4, visibility: 30 },
    "smoky bar": { airKind: "smoke", drift: "drifting", setting: "haze" },
    "dusty barn": { airKind: "dust", setting: "beams", beams: "clear" },
    "make it spooky": { airKind: "fog", thickness: 4, depthFade: 70, visibility: 15 },
    "steamy kitchen": { airKind: "steam", drift: "swirling" },
    "crystal clear air": { setting: "clear", thickness: 0, visibility: 1000 },
  });

  W.say("valueKey", {
    "dark and moody": { setting: "low key", exposure: -2, darkShare: 70 },
    "bright and cheery": { setting: "high key", exposure: 1, darkShare: 10 },
    "caravaggio": { setting: "low key", darkShare: 85, eyeGuide: "one spot lit", brightest: "the face" },
    "sinking into night": { arc: "darker by the end" },
    "let the face be brightest": { brightest: "the face", faceStops: 1 },
    "window is the brightest": { brightest: "a window" },
    "make it funnier": { setting: "high key", eyeGuide: "evenly lit" },
    "a glimmer of hope": { arc: "brighter by the end" },
  });

  W.say("renderStyle", {
    "make it look painted": { setting: "painterly", strength: 4, shading: "soft" },
    "cartoony": { setting: "toon", shading: "two tones", detailLevel: "simple shapes" },
    "saturday morning cartoon": { setting: "toon", shading: "flat", drawRate: 12 },
    "make it real": { setting: "photoreal", detailLevel: "every detail", shading: "full" },
    "dream turns painted": { styleMoment: "for a dream", setting: "painterly", styleTime: 3 },
    "keep faces real": { styleReach: "all but faces" },
    "on twos": { drawRate: 12 },
    "paper cutout": { setting: "flat", shading: "flat", detailLevel: "simple shapes" },
  });

  W.say("lineWeight", {
    "comic book ink": { setting: "heavy", color: "black", innerLines: "a few", wobble: "steady" },
    "clean anime lines": { setting: "thin", wobble: "steady", innerLines: "outline only", boil: "still" },
    "sketchy pencil": { setting: "thin", wobble: "sketchy", boil: "lively", color: "dark color" },
    "make the lines boil": { boil: "lively", boilRate: 8 },
    "thicker lines": { setting: "heavy", linePx: 6 },
    "no outlines": { setting: "none", linePx: 0 },
    "scribbly": { wobble: "scribbled", boil: "lively" },
  });

  W.say("gloss", {
    "make it shiny": { setting: "mirror", howMuch: 4, shineSize: "broad" },
    "car commercial": { setting: "mirror", reflects: "clear shapes", whatShines: "objects", shineStops: 4 },
    "kill the shine": { setting: "matte", howMuch: 0, reflects: "nothing" },
    "documentary matte": { setting: "matte", whatShines: "skin", howMuch: 1 },
    "the knife glints": { glint: "on purpose", shineSize: "pinpoint", shineStops: 5 },
    "polished floors": { whatShines: "floors", reflects: "a mirror image" },
    "make it look expensive": { setting: "satin", reflects: "a blur", howMuch: 3 },
  });

  W.say("skinLight", {
    "sunset through the ears": { setting: 4, backlight: "strong", whereShows: "ears", color: "warm" },
    "porcelain doll": { setting: 1, depth: "surface", color: "cool" },
    "healthy glow": { setting: 3, color: "warm", whereShows: "nose and cheeks" },
    "glowing hands": { whereShows: "hands", backlight: "strong" },
    "warms up as they open up": { warmsUp: "with the emotion", warmTime: 8 },
    "make them look alive": { setting: 3, color: "pink", depth: "a little" },
    "lifeless skin": { setting: 0, color: "none", depth: "surface" },
  });

  W.say("saturation", {
    "drain the color": { setting: 1, trend: "draining", satPercent: 40 },
    "make it pop": { setting: 4, satPercent: 140 },
    "candy colors": { setting: 5, satPercent: 180 },
    "war movie look": { setting: 1, satPercent: 30, skinProtect: "a little" },
    "color comes back": { trend: "filling", pace: 30 },
    "keep the skin natural": { skinProtect: "fully" },
    "make it sadder": { setting: 1, trend: "draining", satPercent: 50 },
    "only mute the greens": { whichColors: "greens", setting: 2 },
    "hero stands out": { heroColor: "clearly", heroGap: 60 },
  });

  W.say("palette", {
    "teal and orange": { mainHue: "teal", secondHue: "orange", harmony: "opposites", setting: "limited" },
    "wes anderson pastels": { setting: "limited", harmony: "neighbors", mainHue: "yellow", secondHue: "red" },
    "matrix green": { setting: "one color", mainHue: "green", harmony: "one hue", mainShare: 90 },
    "all one color": { setting: "one color", harmony: "one hue" },
    "rainbow of colors": { setting: "every color", harmony: "anything goes" },
    "give each character a color": { perCharacter: "each main one" },
    "new place new colors": { shiftOn: "new place" },
    "make it feel warm": { mainHue: "orange", secondHue: "yellow", harmony: "neighbors" },
  });

  W.say("colorRange", {
    "black and white film": { setting: "black and white", filmStock: "film grain" },
    "arriving in oz": { setting: "vivid color", rangeArc: "blooms", rangeTime: 10 },
    "sin city": { setting: "one color", paletteHue: "red", brightness: "dark" },
    "saving private ryan look": { setting: "muted color", filterKind: "bleach bypass", filmStock: "film grain" },
    "sepia tone": { setting: "one color", filterKind: "sepia", paletteHue: "orange" },
    "old damaged film": { filmStock: "damaged film", setting: "black and white" },
    "color drains away": { rangeArc: "drains away", rangeTime: 20 },
    "make it look clean": { filmStock: "clean digital", setting: "natural color", filterKind: "none" },
  });

  W.say("colorFilter", {
    "tint the whole thing": { setting: "the whole picture", tintWhere: "everywhere", tintPercent: 60 },
    "a hint of color": { setting: "light", tintPercent: 15 },
    "traffic-style city tints": { setting: "strong", marks: "a place", method: "in the edit" },
    "flashback wash": { setting: "strong", marks: "the past or a dream", fadeTime: 2 },
    "gel the lights": { method: "colored lights" },
    "filter on the lens": { method: "glass on the lens" },
    "tint just the shadows": { tintWhere: "the shadows" },
    "no tint": { setting: "none", tintPercent: 0 },
  });

  W.say("filterHue", {
    "sun-baked mexico": { setting: "yellow", tintStrength: 70, paleDeep: "deep" },
    "code-world green": { setting: "green", tintStrength: 60, paleDeep: "clear" },
    "dreamy pastel": { paleDeep: "pastel", slide: "slowly", setting: "purple" },
    "make it feel cold": { setting: "blue", tintStrength: 50 },
    "make it feel dangerous": { setting: "red", tintStrength: 60, paleDeep: "deep" },
    "sickly": { setting: "green", paleDeep: "pastel", tintStrength: 40 },
    "this color is her": { meaning: "a character" },
    "slowly shift the hue": { slide: "slowly", slideAngle: 60, slideTime: 60 },
  });

  W.say("colorCount", {
    "monochrome mood": { setting: 1, bgColors: "none", costumeColors: "none", biggestShare: 90 },
    "color riot": { setting: 6, bgColors: "many", costumeColors: "many" },
    "keep it to two colors": { setting: 2 },
    "hero owns the red": { heroOwns: "clearly", setting: 2 },
    "simplify the colors": { setting: 2, bgColors: "one", overStory: "fewer" },
    "colors grow over the story": { overStory: "more" },
    "make it festive": { setting: 5, costumeColors: "many" },
  });

  W.say("warmCool", {
    "cozy holiday": { setting: "very warm", kelvin: 3000, faceWarmth: "warmer" },
    "nordic crime": { setting: "very cool", kelvin: 8000, coolShadows: "strong" },
    "warm it up": { setting: "warm", kelvin: 4000 },
    "cool it down": { setting: "cool", kelvin: 6500 },
    "two worlds": { byPlace: "each world its own" },
    "warm inside cold outside": { byPlace: "inside vs outside" },
    "make it feel lonely": { setting: "cool", coolShadows: "a little" },
    "make it feel safe": { setting: "warm", faceWarmth: "warmer" },
  });

  W.say("skinColorTruth", {
    "true skin tones": { setting: "true to life", protectWho: "everyone", tintOnSkin: 0, hueOff: 0 },
    "protect the lead's skin": { protectWho: "the lead", setting: "true to life" },
    "alien skin": { setting: "far off", hueOff: 25, tintOnSkin: 80 },
    "let the grade hit skin": { setting: "tinted", tintOnSkin: 60, protectWho: "no one" },
    "smooth out the skin": { evenness: "smooth" },
    "match skin across cuts": { matchCuts: "exactly the same" },
    "prestige drama look": { setting: "slightly tinted", protectWho: "main characters", evenness: "a little" },
  });

  W.say("surfaceLens", {
    "wet neon city": { material: "glossy", wet: "soaked", reflectPercent: 70 },
    "dusty western": { material: "matte", wear: "used", bumps: "rough and bumpy" },
    "toy plastic": { material: "glossy", bumps: "smooth", wear: "new", roughness: 10 },
    "frosted glass": { material: "glass", seeThrough: "cloudy", lightThrough: 50 },
    "velvety": { sheen: "velvet", material: "matte" },
    "oil slick shimmer": { rainbow: "oil slick" },
    "brushed metal": { material: "metal", roughness: 40, bumps: "fine grain" },
    "make it look cheap": { material: "satin", coat: "none", wear: "used" },
    "make it look expensive": { material: "glossy", coat: "thick lacquer", wear: "new" },
  });

  W.say("renderLookLens", {
    "spider-verse comic": { look: "toon", outline: "heavy", hatching: "light hatching", drawRate: 12 },
    "ghibli watercolor": { look: "painterly", paper: "watercolor", outline: "thin", bands: "smooth" },
    "sketchbook flashback": { lookMoment: "for a flashback", wobble: "sketchy", paper: "paper grain" },
    "cel shaded": { look: "toon", bands: "two bands", outline: "thin" },
    "crosshatched": { hatching: "heavy crosshatch" },
    "make it look real": { look: "photoreal", outline: "none", paper: "none" },
    "storybook look": { look: "painterly", paper: "subtle", bands: "three bands" },
  });

  W.say("layersLens", {
    "pop-up book": { separation: "deep stack", layerCount: 5, contact: "strong" },
    "spotlight on one": { isolate: "only that thing", attention: "foreground", frontVsBack: 3 },
    "more depth": { separation: "three layers", depthFog: "light" },
    "flatten it out": { separation: "one flat layer", depthFog: "none", frontVsBack: 0 },
    "foggy distance": { depthFog: "thick", fogStart: 20 },
    "make them stand out": { attention: "foreground", isolate: "a little", frontVsBack: 2 },
    "the background matters": { attention: "background", frontVsBack: -2 },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
