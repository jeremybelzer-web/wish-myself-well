/* Effects: plain words for "Say what you want" in each curiosity's window. */
(function (W) {
  W.say("breakage", {
    "smash it": { setting: "shatters", pieces: 70, speed: 4 },
    "sell the smash": { setting: "shatters", slowMo: "slow motion", grabsEye: "the center of the moment" },
    "just a hairline crack": { setting: "cracks", pieces: 2, warning: "none" },
    "let it creak first": { warning: "a creak", warnSecs: 3 },
    "blows apart": { setting: "shatters", pieces: 100, flyM: 12 },
    "make it scarier": { warning: "cracks spread first", warnSecs: 6, setting: "cracks" },
    "more dramatic": { slowMo: "slow motion", grabsEye: "the center of the moment", pieces: 80 },
    "right in our face": { distM: 0.5, flyM: 8, grabsEye: "the center of the moment" },
    "it doesn't break": { setting: "holds", pieces: 0 },
    "window smash": { material: "glass", setting: "shatters", pieces: 90 },
    "keep it in the background": { grabsEye: "in the background", slowMo: "real speed" },
  });

  W.say("element", {
    "socked in": { setting: "smoke", coverage: 90, where: "around the people" },
    "it's pouring": { setting: "water", motion: "rushing", howMuch: 5 },
    "everything's on fire": { setting: "fire", coverage: 85, arrives: "bursts in", pull: "steals focus" },
    "a little atmosphere": { howMuch: 1, pull: "blends in", where: "far background" },
    "smoke rolls in": { setting: "smoke", arrives: "sweeps in", arriveSecs: 8 },
    "sandstorm": { setting: "sand", motion: "rushing", coverage: 80, driftSpeed: 15 },
    "make it cozier": { setting: "snow", motion: "drifting", howMuch: 2, pull: "blends in" },
    "make it scarier": { setting: "smoke", arrives: "seeps in", where: "around the people", motion: "swirling" },
    "in the lens": { where: "right in front of the lens", distM: 0.3 },
    "through the window": { relTo: "a door or window", where: "far background" },
    "more dramatic": { howMuch: 4, motion: "swirling", pull: "steals focus" },
  });

  W.say("growth", {
    "it's getting out of hand": { setting: "building", speed: 4, tension: "keeps climbing" },
    "dying down": { setting: "shrinking", endSize: "gone", speed: 2 },
    "slow burn": { setting: "building", shape: "slow then sudden", speed: 1, reachSecs: 90 },
    "ticking clock": { setting: "building", tension: "keeps climbing", shape: "even" },
    "starts from nothing": { startSize: "a spark", startPct: 2 },
    "swallows the frame": { endSize: "fills the frame", endPct: 100 },
    "comes in waves": { shape: "in surges", surgesPerMin: 6 },
    "hold it steady": { setting: "steady", speed: 0, tension: "no" },
    "more suspense": { tension: "keeps climbing", shape: "slow then sudden", noticeable: "clear" },
    "barely noticeable": { noticeable: "subtle", speed: 1 },
  });

  W.say("smokeFireLens", {
    "cozy fire": { heat: "smoulder", danger: "cozy", fireGlow: "flicker", thick: "wisp" },
    "the place is burning": { heat: "inferno", spread: "races", danger: "deadly", fireGlow: "floods" },
    "black smoke pouring out": { smokeColor: "black", thick: "wall", rise: "shoots up" },
    "just a wisp of steam": { smokeColor: "white steam", thick: "wisp", fade: "vanishes fast", heat: "none" },
    "let the smoke hang": { rise: "hangs", fade: "lingers", hangSecs: 120 },
    "make it scarier": { danger: "deadly", spread: "creeps", smokeColor: "black" },
    "smoke grenade": { smokeColor: "colored", thick: "plume", grows: "building" },
    "fire's spreading": { spread: "races", grows: "building", heat: "flames" },
    "put it out": { heat: "none", grows: "shrinking", fade: "thins out" },
    "calmer": { danger: "cozy", swirl: 1, spread: "stays put" },
  });

  W.say("sideStoryline", {
    "b-plot": { setting: "a second story", share: 30, returns: "now and then" },
    "cut away to": { setting: "a few cutaways", clipSecs: 3, returns: "once" },
    "baptism montage": { setting: "a running montage", relation: "contrasts", tiedTo: "the music", meets: "builds to the same moment" },
    "meanwhile across town": { setting: "a second story", tiedTo: "its own timing", relation: "echoes" },
    "keep cutting back": { returns: "constantly", cutsPerMin: 12 },
    "foreshadow it": { relation: "foreshadows", meets: "at the end" },
    "the two stories collide": { meets: "builds to the same moment", meetsAt: 90 },
    "stay with the main story": { setting: "none", share: 0 },
    "cut on the words": { tiedTo: "the words", leadSecs: 0 },
    "more ironic": { relation: "contrasts", setting: "a running montage" },
  });

  W.say("windForce", {
    "a gentle breeze": { setting: 1, gusts: "steady", howl: "a whisper", unease: "calm" },
    "blowing a gale": { setting: 5, gusts: "violent gusts", howl: "a roar" },
    "the storm hits": { buildUp: "hits all at once", setting: 5, rampSecs: 1 },
    "wind picks up": { buildUp: "rises slowly", change: "drifts", rampSecs: 20 },
    "make it eerie": { unease: "menacing", howl: "a howl", gusts: "gusty" },
    "dead calm": { setting: 0, howl: "silent", unease: "calm" },
    "in their face": { direction: "toward the camera", relTo: "the main character" },
    "hair blowing back": { direction: "toward the camera", setting: 3, gusts: "steady" },
    "wuthering heights": { setting: 4, gusts: "gusty", howl: "a howl", unease: "restless" },
    "trees bending": { setting: 4, tilt: 30 },
  });

  W.say("impacts", {
    "make every hit land": { force: 5, heaviness: "crunch", shake: "a jolt" },
    "bone-crunching": { heaviness: "crunch", force: 5, loudPct: 160 },
    "jump scare": { setting: 1, heaviness: "boom", jolt: "makes them jump", shake: "a big shake" },
    "hit on the beat": { landsOn: "the music's beat", offsetFrames: 0 },
    "rapid-fire punches": { rhythm: "a run", setting: 6, gapSecs: 0.3 },
    "softer hits": { force: 1, heaviness: "light tap", shake: "no" },
    "earth-shaking": { heaviness: "boom", shake: "a big shake", force: 5 },
    "cut on the hit": { landsOn: "the cut", offsetFrames: 0 },
    "more brutal": { force: 5, heaviness: "crunch", jolt: "wakes them up" },
    "keep it light": { force: 1, heaviness: "light tap", jolt: "barely" },
  });

  W.say("density", {
    "pea soup fog": { setting: "wall", visibleM: 3, hides: "everything" },
    "a touch of haze": { setting: "wisp", opacity: 15, beams: "soft haze" },
    "see the light beams": { beams: "beams", setting: "plume" },
    "ground fog": { layer: "low to the ground", layerM: 0.5 },
    "they vanish into the fog": { hides: "people's faces", visibleM: 5, setting: "wall" },
    "fog lifts": { clears: "thins slowly", clearSecs: 30 },
    "parts like a curtain": { clears: "parts suddenly", clearSecs: 2 },
    "make it scarier": { setting: "wall", hides: "the background", layer: "low to the ground" },
    "clear the air": { opacity: 0, hides: "nothing", setting: "wisp" },
    "smoky bar": { setting: "plume", layer: "high up", beams: "soft haze", opacity: 35 },
  });

  W.say("splash", {
    "big splash": { setting: "burst", height: 5, droplets: 5, widthM: 4 },
    "make a splash": { setting: "burst", height: 3, droplets: 3 },
    "just a drip": { setting: "drip", height: 0, droplets: 1 },
    "splash the lens": { hitsLens: "drenches the lens", distM: 0.3 },
    "a few drops on the lens": { hitsLens: "a few drops" },
    "blood spatter": { liquid: "blood", setting: "burst", droplets: 5 },
    "milk commercial": { liquid: "milk", slowMo: "slow motion", setting: "burst" },
    "hang in the air": { slowMo: "slow motion", airSecs: 3 },
    "keep it dry": { setting: "none", hitsLens: "no" },
    "messier": { droplets: 5, widthM: 6, liquid: "mud" },
  });

  W.say("fireLight", {
    "candlelit": { setting: "flicker", glowColor: "candle orange", reach: "just the faces nearby", brightness: 1 },
    "campfire story": { setting: "flicker", reach: "just the faces nearby", shadows: "big and moving", height: -40 },
    "lit from below": { height: -60 },
    "the room is ablaze": { setting: "floods", brightness: 5, reach: "the whole scene", glowColor: "deep red" },
    "warm glow": { glowColor: "warm amber", flicker: 1, shadows: "soft" },
    "dancing shadows": { shadows: "big and moving", flicker: 4 },
    "make it scarier": { shadows: "big and moving", glowColor: "deep red", height: -60 },
    "more romantic": { glowColor: "candle orange", flicker: 1, shadows: "soft", reach: "just the faces nearby" },
    "flares with the drama": { surge: "the drama" },
    "gas stove glow": { glowColor: "blue gas", flicker: 0 },
  });

  W.say("forcesLens", {
    "tornado": { whirl: "a whirlwind", wind: 5, direction: "swirling", chaos: 5 },
    "like they're underwater": { drag: "like water", weight: "floaty", wind: 0 },
    "moon walk": { weight: "floaty", drag: "thin air", wind: 0 },
    "still air": { wind: 0, chaos: 0, whirl: "none" },
    "eye of the storm": { calmEye: "a still eye in the storm", wind: 5, eyeM: 6 },
    "sudden gust": { gusts: "sudden blasts", buildUp: "hit all at once" },
    "heavier": { weight: "heavy", drag: "normal" },
    "more chaos": { chaos: 5, whirl: "eddies", gusts: "gusty" },
    "make it calmer": { chaos: 1, wind: 1, gusts: "steady" },
    "wind from behind them": { direction: "from behind", relTo: "the main character" },
  });

  W.say("crashLens", {
    "domino effect": { chain: "domino chain", chainCount: 20 },
    "rube goldberg": { chain: "domino chain", chainCount: 30, tone: "in between" },
    "pratfall": { tone: "pure slapstick", bounce: "bouncy", slide: "ice" },
    "slips on a banana peel": { slide: "ice", slideM: 4, tone: "pure slapstick" },
    "full wreck": { breaks: "shatters", mess: "pieces everywhere", hits: 6, tone: "serious" },
    "bounces like rubber": { bounce: "super ball", bounces: 10 },
    "lands with a thud": { bounce: "dead thud", bounces: 0, settle: 0 },
    "keep it real": { tone: "serious", bounce: "small bounce", slowMo: "real speed" },
    "make it funnier": { tone: "pure slapstick", bounce: "bouncy", chain: "a few knock on" },
    "clean it up": { mess: "clean", breaks: "holds" },
  });

  W.say("liquidLens", {
    "flooding": { rising: "rising fast", current: "rushing", riseRate: 40 },
    "water's rising": { rising: "rising slowly", riseRate: 10 },
    "still as glass": { surface: "glass calm", current: "still" },
    "white water rapids": { current: "rushing", foam: "white water", surface: "churning", flowSpeed: 8 },
    "murky swamp": { clarity: "murky", thickness: "mud", current: "still" },
    "crystal clear": { clarity: "crystal", foam: "none" },
    "leaky ceiling": { drips: "a few", splash: "drip" },
    "make it scarier": { clarity: "opaque", rising: "rising fast", surface: "choppy" },
    "calmer": { surface: "ripples", current: "gentle drift", foam: "none" },
    "waist deep": { depthM: 1, waterline: 50 },
    "draining away": { rising: "falling", riseRate: -20 },
  });

  W.say("overlay", {
    "split screen it": { setting: "split screen", size: 50, position: "left" },
    "both sides of the call": { setting: "split screen", size: 50 },
    "reaction in the corner": { setting: "picture in picture", position: "corner", size: 25 },
    "show it over the voice": { setting: "cutaway over the sound", stays: "a few seconds" },
    "ghost it over": { setting: "full overlay", opacity: 35, comesIn: "fades in" },
    "just a flash": { stays: "a flash", comesIn: "cuts in", inSecs: 0 },
    "slide it in": { comesIn: "slides in", inSecs: 0.5 },
    "bigger": { size: 60 },
    "make it subtler": { opacity: 40, size: 20, comesIn: "fades in" },
    "no overlay": { setting: "none" },
  });

  W.say("superpowerEffect", {
    "power up": { shape: "builds up", buildSecs: 4, intensity: 85, trigger: "at the climax" },
    "eyes glow": { setting: "electric eyes", intensity: 60 },
    "laser vision": { setting: "laser eyes", powerColor: "red", shape: "bursts on" },
    "zap them": { setting: "lightning", powerColor: "blue", shape: "bursts on", brightPct: 200 },
    "super speed": { setting: "speed streaks", afterglow: "leaves a trail" },
    "make them look powerful": { intensity: 90, shape: "builds up", brightPct: 220, afterglow: "leaves a trail" },
    "villain reveal": { setting: "flame eyes", powerColor: "red", trigger: "on a big line" },
    "goes super saiyan": { setting: "light trails", powerColor: "gold", shape: "builds up", intensity: 100 },
    "tone it down": { intensity: 30, brightPct: 80, afterglow: "gone at once" },
    "hit on the beat": { trigger: "on the beat" },
    "everyone has powers": { who: "everyone" },
  });

  W.say("hallucinationEffect", {
    "acid trip": { setting: "vortex rings", sway: "pulsing", intensity: 80, pov: "we see what they see" },
    "dreamy": { sway: "slow and dreamy", onset: "creeps in", ending: "fades out" },
    "room starts spinning": { setting: "rotating swing", sway: "spinning", cyclesPerSec: 1 },
    "panic attack": { onset: "snaps on", sway: "violent", ending: "snaps back", intensity: 90 },
    "through their eyes": { pov: "we see what they see" },
    "trippier": { intensity: 90, coverage: 100, sway: "pulsing" },
    "snap out of it": { ending: "snaps back", endSecs: 0.2 },
    "it lingers": { ending: "lingers", endSecs: 8 },
    "just a hint": { intensity: 20, coverage: 30, onset: "creeps in" },
    "melting world": { setting: "molten figure", sway: "slow and dreamy" },
  });

  W.say("glitchEffect", {
    "hacked": { setting: "glitchy digits", feel: "edgy", often: "now and then" },
    "signal's breaking up": { setting: "shaky glitch", worsens: "slowly", often: "now and then" },
    "found footage": { setting: "spooky camera", feel: "creepy", landsOn: "a scary moment" },
    "make it scarier": { feel: "creepy", setting: "cyber fright", landsOn: "a scary moment" },
    "glitch on the beat": { landsOn: "the beat", often: "constantly" },
    "vhs vibe": { setting: "70s glitch", feel: "playful" },
    "it's falling apart": { worsens: "quickly", intensity: 90, coverage: 100 },
    "just one blip": { often: "once", burst: 0.3, intensity: 40 },
    "chromatic aberration": { setting: "split colors", shiftPct: 3 },
    "cleaner": { intensity: 15, often: "once" },
  });

  W.say("turbulence", {
    "calm before the storm": { setting: 0, hush: "a long hush", change: "snaps" },
    "all hell breaks loose": { setting: 5, wildest: "everywhere", gustPct: 300 },
    "lazy summer air": { setting: 1, scale: 4, change: "drifts" },
    "around the hero": { wildest: "right around the hero" },
    "chaos on the drama": { gustsOn: "the drama" },
    "swirl on the beat": { gustsOn: "the beat" },
    "more chaotic": { setting: 4, gustsPerMin: 20 },
    "calmer": { setting: 1, gustsPerMin: 2, gustPct: 50 },
    "a moment of stillness": { hush: "a short hush", hushSecs: 3 },
    "keep it behind them": { wildest: "behind the action" },
  });

  W.say("clothResponse", {
    "cape billows": { setting: "flutter", billow: "always", swingDeg: 120 },
    "billows on the big moment": { billow: "on big moments", setting: "flutter" },
    "starched stiff": { setting: "stiff", weight: 4, howMuch: 0 },
    "flowing gown": { setting: "loose", trails: "trails far behind", weight: 1, lagSecs: 1 },
    "flapping in the wind": { movedBy: "wind", flutterPerSec: 8, setting: "flutter" },
    "make them look powerful": { billow: "always", setting: "flutter", trails: "trails a little" },
    "heavier fabric": { weight: 5, flutterPerSec: 1 },
    "more movement": { howMuch: 4, swingDeg: 90 },
    "keep it still": { howMuch: 0, movedBy: "nothing", billow: "never" },
  });

  W.say("settleTime", {
    "snap into place": { setting: 0, bounce: "none", wobble: "none" },
    "wobbles like jelly": { wobble: "a long wobble", bounce: "springy", wobblePerSec: 6 },
    "delayed fall": { lastMove: "a final fall", hold: "a long hold" },
    "beat then it tips": { hold: "a breath", lastMove: "a final tip" },
    "let it settle": { setting: 3, bounce: "small" },
    "bouncier": { bounce: "springy", bounceCount: 6 },
    "button it": { setting: 1, hold: "a breath", lastMove: "no" },
    "make it funnier": { lastMove: "a final fall", hold: "a long hold", noticeable: "showy" },
  });

  W.say("gravityFeel", {
    "floating in space": { setting: "floaty", scale: 0.2, falls: "drift down", jumps: "moon leaps" },
    "on the moon": { setting: "floaty", scale: 0.2, jumps: "moon leaps" },
    "heavy as lead": { setting: "heavy", scale: 2.5, falls: "drop like stones" },
    "zero g": { setting: "floaty", scale: 0.1, appliesTo: "everything" },
    "gravity cuts out": { shifts: "suddenly", setting: "floaty" },
    "dreamlike": { setting: "floaty", falls: "float then drop", change: "drifts" },
    "make it heavier": { setting: "heavy", scale: 1.8 },
    "normal gravity": { setting: "real", scale: 1 },
    "only they float": { appliesTo: "one character", setting: "floaty" },
  });

  W.say("furLength", {
    "werewolf": { grows: "grows fast", setting: "long", evenness: "shaggy and patchy", growRate: 8 },
    "freshly groomed": { evenness: "trimmed even", fluff: "flat" },
    "shaggy": { setting: "long", evenness: "shaggy and patchy" },
    "puffed up scared": { fluff: "puffed up" },
    "buzz cut": { setting: "short", cm: 1 },
    "longer": { setting: "long", cm: 25 },
    "shave it down": { grows: "shrinks", growRate: -5 },
    "show dog": { evenness: "trimmed even", fluff: "puffed up", setting: "long" },
  });

  W.say("clump", {
    "soaking wet": { setting: "matted", cause: "water", clumpSize: "big" },
    "caked in mud": { cause: "mud", setting: "matted", whereOn: "the legs" },
    "fresh from the groomer": { setting: "fine", howMuch: 0, cause: "nothing" },
    "rough few weeks": { arc: "gets messier", cause: "age", setting: "tufted" },
    "after the battle": { cause: "blood", setting: "matted" },
    "cleans up": { arc: "gets cleaner" },
    "messier": { howMuch: 4, clumpSize: "big" },
  });

  W.say("frizz", {
    "electrocuted": { setting: 5, cause: "a shock", change: "snaps", where: "all over" },
    "bad hair day": { setting: 3, cause: "humidity", where: "all over" },
    "backlit halo": { halo: "a bright halo", haloPct: 120, where: "tips" },
    "smooth it down": { setting: 0, builds: "calms down", halo: "no" },
    "staticky hair": { cause: "static", setting: 3 },
    "frizzes up over time": { builds: "gets wilder", change: "drifts" },
    "flyaways": { setting: 1, where: "tips", strayCm: 2 },
  });

  W.say("hairColor", {
    "goes gray over the years": { ages: "slowly", gray: 70 },
    "salt and pepper": { gray: 40, setting: "dark" },
    "punk dye": { dye: "bold dye", streakPct: 60 },
    "sun-bleached": { setting: "light", dye: "highlights", undertone: "golden" },
    "redhead": { undertone: "red", setting: "medium" },
    "roots growing out": { rootsCm: 4, dye: "bold dye" },
    "jet black": { setting: "dark", gray: 0, undertone: "ash" },
    "make them older": { gray: 60, ages: "slowly" },
  });

  W.say("hairShine", {
    "shampoo ad": { setting: "glossy", streak: "bright", shinesWhen: "as they turn", howMuch: 5 },
    "slicked back": { wetLook: "slicked", setting: "glossy" },
    "greasy": { wetLook: "damp", setting: "sheen", streak: "none" },
    "unwashed": { setting: "dull", howMuch: 0 },
    "fresh out of the shower": { wetLook: "damp", setting: "sheen" },
    "make it glamorous": { setting: "glossy", streak: "bright", shinesWhen: "in the hero moment" },
    "tone down the shine": { howMuch: 1, streak: "soft" },
  });

  W.say("furResponse", {
    "hackles up": { bristle: "when angry or scared", bristleSecs: 0.3 },
    "mane in the wind": { setting: "wind", strength: 4, travels: "in waves" },
    "ripples as they move": { setting: "the body", travels: "in a ripple" },
    "startled": { bristle: "when startled", change: "snaps" },
    "perfectly still": { setting: "nothing", strength: 0, settles: "at once" },
    "never quite settles": { settles: "keeps swaying", settleSecs: 6 },
    "more alive": { setting: "both", strength: 3, travels: "in waves" },
  });

  W.say("furLag", {
    "fluffy and bouncy": { feelsLike: "light and fluffy", overshoot: "a lot", springiness: 5 },
    "wet dog": { feelsLike: "heavy and wet", springiness: 1, setting: 3 },
    "tight and crisp": { setting: 0, overshoot: "no" },
    "jiggles on turns": { sells: "on fast turns", overshoot: "a little" },
    "cartoony": { overshoot: "a lot", swings: 5, noticeable: "showy" },
    "more natural": { feelsLike: "natural", overshoot: "a little", noticeable: "subtle" },
    "sell every move": { sells: "on every move" },
  });

  W.say("curl", {
    "noir cigarette smoke": { setting: 3, size: 1, speed: 1, holds: "holds a while" },
    "ink in water": { setting: 4, size: 3, speed: 1, holds: "holds its shape" },
    "walk through the smoke": { curlsAround: "a person moving through" },
    "curls in the light": { curlsAround: "a beam of light" },
    "lazier": { speed: 1, holds: "holds its shape" },
    "dissipates quickly": { holds: "breaks up fast", speed: 4 },
    "barely swirling": { setting: 1, noticeable: "subtle" },
    "more swirls": { setting: 5, curlsInView: 25 },
  });

  W.say("scatter", {
    "autumn leaves blowing": { kind: "leaves", stirs: "blowing across", blowSpeed: 3 },
    "after the explosion": { kind: "rubble", setting: 5, stirs: "lying still" },
    "rose petals": { kind: "petals", setting: 3 },
    "trash on the street": { kind: "litter", setting: 2, stirs: "stirring" },
    "crowd parts": { kind: "people", clearPath: "a clear path", pathM: 3 },
    "clear a path": { clearPath: "a clear path" },
    "messier": { setting: 5, spread: 5 },
    "tidier": { setting: 1, spread: 1 },
  });

  W.say("clothLens", {
    "soaked shirt": { wet: "soaked", cling: "clings" },
    "flowing silk": { fabric: "silk", reacts: "flutter", cling: "floats away" },
    "battle-worn": { tears: "rips", wrinkles: "crumpled", fabric: "leather" },
    "knight in armor": { fabric: "chain mail", reacts: "stiff" },
    "freshly pressed": { wrinkles: "smooth", reacts: "stiff" },
    "cape billows": { billow: "always", reacts: "flutter", swingDeg: 120 },
    "make them look powerful": { billow: "on big moments", reacts: "flutter", swingDeg: 90 },
    "rumpled": { wrinkles: "crumpled" },
    "skin-tight": { stretch: "rubbery", cling: "clings" },
  });

  W.say("bitsLens", {
    "confetti drop": { kind: "confetti", howMany: "a flurry", arrives: "burst on a moment", fall: "drift down" },
    "snow globe": { kind: "snow", fall: "drift down", howMany: "a scatter" },
    "pouring rain": { kind: "rain", fall: "pour down", howMany: "a storm", fallSpeed: 10 },
    "dust in the sunbeam": { kind: "dust", fall: "hang", shine: "catch the light", size: "specks" },
    "sparks flying": { kind: "sparks", shine: "glow", life: "a blink" },
    "ash falling": { kind: "ash", fall: "drift down", life: "linger" },
    "bubbles floating up": { kind: "bubbles", fall: "float up" },
    "magical": { shine: "glow", fall: "float up", kind: "dust" },
    "in the lens": { depth: "right at the lens", distM: 0.3 },
    "more of it": { howMany: "a storm", count: 1500 },
    "just a few": { howMany: "a few", count: 30 },
  });

  W.say("furLens", {
    "mad scientist": { frizz: 5, groom: "standing on end", length: "medium" },
    "drowned rat": { wet: "soaked and stringy", clumps: "matted", shine: "sheen" },
    "shampoo ad": { shine: "glossy", groom: "neat", reacts: "the body" },
    "bedhead": { groom: "messy", frizz: 2 },
    "slicked back": { groom: "swept one way", shine: "glossy", wet: "damp" },
    "big curly hair": { curls: "coiled", thick: "thick", length: "long" },
    "more unkempt as it goes": { overFilm: "gets wilder" },
    "cleans up nice": { overFilm: "gets neater", groom: "neat" },
    "blowing in the wind": { reacts: "wind", lag: 2 },
  });

  W.say("cutout", {
    "key it out": { setting: "green screen", edge: 70, spillPct: 80 },
    "blur the background": { newBack: "blurred", setting: "auto cutout" },
    "put them somewhere else": { newBack: "a new place", lightMatch: "perfectly", fakeness: "seamless" },
    "make it look real": { lightMatch: "perfectly", shadow: "soft", fakeness: "seamless" },
    "obviously fake": { fakeness: "obviously fake on purpose", lightMatch: "not at all", shadow: "none" },
    "monty python style": { fakeness: "obviously fake on purpose", setting: "shape mask" },
    "ground them": { shadow: "soft", shadowLen: 60 },
    "no green screen": { setting: "none" },
  });

  W.say("maskShape", {
    "iris in": { setting: "circle", feather: 20, size: 30 },
    "old silent movie": { setting: "circle", invert: "outside", feather: 30 },
    "spotlight the hero": { setting: "follows a person", moves: "follows the action", feather: 60 },
    "darken the edges": { setting: "vignette", feather: 80 },
    "grad the sky": { setting: "gradient", height: "high" },
    "softer edge": { feather: 85 },
    "hard edge": { feather: 5 },
    "follow them": { moves: "follows the action", setting: "follows a person" },
  });

  W.say("tracking", {
    "name tag follows them": { setting: "text follows", target: "a face", side: "below", followFor: "the whole shot" },
    "stick it to them": { setting: "sticker follows", lead: "right on it" },
    "lock on": { setting: "frame follows", smooth: 30, lead: "right on it" },
    "smoother": { smooth: 85 },
    "floaty follow": { lead: "lags behind", smooth: 90, leadFrames: -6 },
    "circle the player": { setting: "mask follows", target: "a body" },
    "just for a moment": { followFor: "a moment" },
  });

  W.say("videoEffect", {
    "pulse on the beat": { setting: "zoom pulse", onBeat: "on the beat", pulsesPerMin: 120 },
    "vhs look": { setting: "old TV", usedTo: "change the mood" },
    "flash on impact": { setting: "flash", comesIn: "snaps on", lasts: 0.3, usedTo: "punctuate a moment" },
    "dreamy glow": { setting: "glow", comesIn: "fades in", intensity: 50 },
    "shake it": { setting: "shake", intensity: 70 },
    "leaky light": { setting: "light leak", usedTo: "change the mood" },
    "smooth their skin": { body: "smooth skin" },
    "subtler": { intensity: 25, comesIn: "fades in" },
    "go wild": { intensity: 100, onBeat: "on the beat", coverage: 100 },
  });

  W.say("videoEffectFamily", {
    "throwback": { setting: "retro", vibe: "fun" },
    "party vibes": { setting: "party", vibe: "wild", onBeat: "on the beat" },
    "comic book": { setting: "comics", vibe: "fun" },
    "keep it classy": { setting: "classic", vibe: "calm", intensity: 30 },
    "magical": { setting: "sparkle", spread: "around the subject" },
    "change it up each scene": { switches: "each scene" },
    "go wild": { vibe: "wild", intensity: 100, spread: "the whole frame" },
  });

  W.say("multiplyEffect", {
    "warhol": { setting: "grid", count: 4, differ: "different colors", arrange: "neat grid" },
    "polaroid flashback": { setting: "polaroid stack", appear: "one by one", arrange: "stacked" },
    "hypnotic spin": { setting: "spinning copies", motion: "spinning", turnsPerSec: 1, arrange: "in a ring" },
    "echo trail": { differ: "slightly delayed", delayFrames: 6 },
    "copies on the beat": { motion: "on the beat" },
    "burst into copies": { appear: "burst out", appearSecs: 0.5 },
    "lots of copies": { count: 12 },
  });

  W.say("lightEffect", {
    "sunbeams through the window": { setting: "god rays", comesFrom: "top", warmth: "golden" },
    "lens flare": { setting: "sun flare", moves: "slow sweep" },
    "abrams flare": { setting: "sun flare", warmth: "cool", strength: 80 },
    "heavenly reveal": { setting: "god rays", hitsOn: "on a reveal", warmth: "golden", strength: 90 },
    "lightning strike": { setting: "lightning", moves: "flickers", hitsOn: "on a reveal" },
    "burned film edge": { setting: "film burn", warmth: "warm" },
    "warmer": { warmth: "golden" },
    "more subtle": { strength: 25, coverage: 30 },
    "flash on the beat": { hitsOn: "on the beat", moves: "pulses" },
  });

  W.say("bodyEffect", {
    "dance glow": { setting: "glowing lines", showsWhen: "on the beat", color: "neon" },
    "motion trail": { setting: "clone trail", trail: "long", showsWhen: "on big moves" },
    "flattering glow": { setting: "portrait glow", intensity: 40, color: "gold" },
    "make them look powerful": { setting: "superpower", intensity: 85, color: "gold" },
    "trippy": { setting: "hallucination" },
    "only on big moves": { showsWhen: "on big moves" },
    "softer": { intensity: 30, glowCm: 10 },
  });

  W.say("cloneEffect", {
    "shadow clones": { setting: "ninja doubles", count: 4, apart: "all around" },
    "speed trail": { setting: "clone trail", delay: "a little behind", ghostly: "see-through" },
    "ghostly double": { setting: "phantom", ghostly: "ghostly", count: 1 },
    "army of me": { count: 8, apart: "all around", ghostly: "solid" },
    "copies on every hit": { when: "on a hit", setting: "clone burst" },
    "more echoes": { count: 6, delay: "far behind" },
    "creepier": { setting: "phantom", ghostly: "ghostly", fadePct: 70 },
  });

  W.say("outlineEffect", {
    "chosen one": { setting: "aura", color: "gold", glow: "big aura", pulse: "slow breathing" },
    "neon outline": { setting: "glowing lines", color: "neon", pulse: "on the beat" },
    "hand-drawn look": { setting: "hand-drawn", appears: "draws itself on" },
    "on fire": { setting: "flame outline", glow: "soft glow" },
    "make them glow": { glow: "soft glow", setting: "aura" },
    "subtler": { thickness: "thin", glow: "tight line" },
    "flares up on the moment": { appears: "flares on a moment" },
  });

  W.say("distortionEffect", {
    "dream ripple": { setting: "ripple", bendSpeed: "slow melt", settles: "settles back", cause: "a feeling" },
    "turn to dust": { setting: "into stardust", settles: "stays bent", bendSecs: 4 },
    "shockwave on the punch": { setting: "ripple warp", bendSpeed: "sudden snap", cause: "a hit", area: "around a person" },
    "wavy like heat": { setting: "water shine", bendSpeed: "steady", area: "the whole frame" },
    "warps with the music": { cause: "the music" },
    "barely bent": { strength: 15 },
    "more trippy": { strength: 80, area: "the whole frame" },
    "snaps back": { settles: "settles back", settleSecs: 0.5 },
  });

  W.say("partyEffect", {
    "strobe": { setting: "strobe pulse", every: "every beat", flashColor: "white" },
    "flash on the drop": { savedFor: "the drop", setting: "shockwave", onBeat: "on the beat" },
    "club lights": { setting: "flashy dance", flashColor: "rainbow", every: "every beat" },
    "go harder": { strength: 100, every: "double time" },
    "chill it out": { strength: 30, every: "every bar" },
    "once on the big moment": { every: "once", savedFor: "the final chorus" },
    "rainbow party": { flashColor: "rainbow", setting: "party beats" },
  });

  W.say("blendMode", {
    "two images at once": { purpose: "double exposure", setting: "screen", opacity: 50 },
    "add film grain": { purpose: "texture", setting: "overlay", opacity: 30 },
    "glow it up": { purpose: "light and flare", setting: "add" },
    "make it moodier": { purpose: "darkening", setting: "multiply" },
    "ghost the layer": { opacity: 25, fadesIn: "slow fade" },
    "dreamy": { setting: "screen", fadesIn: "slow fade", purpose: "double exposure" },
    "stack more layers": { layers: 4 },
  });

  W.say("stockClip", {
    "establishing shot": { setting: "scenery", placed: "opening", use: "a cutaway" },
    "b-roll": { setting: "everyday life", use: "a cutaway", edited: "trimmed" },
    "make it match": { fit: "seamless", edited: "recolored and trimmed" },
    "end card": { setting: "intro or end card", placed: "ending" },
    "mood layer": { setting: "atmosphere", use: "laid over the top" },
    "behind them": { use: "the background", setting: "background" },
    "quick shot": { length: 2 },
  });

  W.say("generatedShot", {
    "invisible insert": { blends: "blends in", style: "real footage" },
    "dream sequence": { style: "dreamlike", motion: "a little", blends: "stands apart" },
    "make it a painting": { style: "painterly", setting: "image" },
    "cartoon it": { style: "animated" },
    "bring the photo to life": { from: "a picture", setting: "video", motion: "a little" },
    "talking scene": { setting: "dialogue scene" },
    "just a still": { setting: "image", motion: "still" },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
