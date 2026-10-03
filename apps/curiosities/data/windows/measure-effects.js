/* Effects, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  const U = { unordered: true };
  /* One add per curiosity: the new settings, a "Measured" group listing them, and any face or preset. */
  const m = (id, sliders, extra) => {
    extra = extra || {};
    W.add(id, {
      sliders,
      window: {
        faces: extra.face ? [extra.face] : [],
        groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }],
        presets: extra.preset ? [extra.preset] : [],
      },
    });
  };
  /* Parts that come back across many effects. */
  const distM = (max, from, to, plain) => ["distM", "How far from the camera", [0.1, max, "m", 0.1], plain || "How many meters between the lens and the effect.", { from, to }];
  const across = (from, plain) => ["across", "Where across the frame", [0, 100, "%"], plain || "How far across the picture it sits: 0 is the left edge, 100 the right.", { from, to: from }];
  const up = (from, plain) => ["up", "How high in the frame", [0, 100, "%"], plain || "How far up the picture it sits: 0 is the bottom edge, 100 the top.", { from, to: from }];
  const offsetFrames = (max, plain) => ["offsetFrames", "Early or late, in frames", [-max, max, "frames", 1], plain || "How many frames before (minus) or after (plus) the moment it answers it lands; a second is about 24 frames.", { from: 0, to: 0 }];
  const perMin = (id, label, max, from, to, plain) => [id, label, [0, max, "per min", 1], plain, { from, to }];
  const secs = (id, label, max, from, to, plain, step) => [id, label, [0, max, "s", step || 0.1], plain, { from, to }];
  const coverage = (from, to, plain) => ["coverage", "Share of the frame it fills", [0, 100, "%"], plain || "How much of the picture it takes up.", { from, to }];

  m("breakage", [
    distM(50, 1, 4, "How many meters from the lens the thing breaks."),
    across(50),
    up(40),
    secs("warnSecs", "Seconds of warning", 10, 0, 2, "How long between the first creak or crack and the break itself."),
    ["flyM", "How far the pieces fly", [0, 20, "m", 0.1], "How many meters the farthest pieces travel from where it broke.", { from: 0.5, to: 3 }],
  ], {
    face: { face: "frame", x: "across", y: "up" },
    preset: { label: "Smash right in front of us", plain: "It breaks a meter from the lens, dead center, and pieces fly past the camera.", set: { distM: 1, across: 50, up: 50, warnSecs: 0, flyM: 4 } },
  });

  m("element", [
    coverage(10, 40),
    distM(100, 2, 10, "How many meters from the lens the nearest part of it is."),
    ["driftSpeed", "How fast it moves", [0, 20, "m/s", 0.1], "How many meters a second it travels across the scene.", { from: 0.2, to: 1 }],
    secs("arriveSecs", "Seconds to arrive", 30, 0, 3, "How long it takes to go from absent to fully there.", 0.5),
    ["relTo", "Measured against", ["the main character", "the camera", "the whole scene", "a door or window"], "What its place and size are measured from.", U],
  ]);

  m("growth", [
    ["startPct", "Starts at, share of frame", [0, 100, "%"], "How much of the picture it fills when the growth begins.", { from: 2, to: 2 }],
    ["endPct", "Ends at, share of frame", [0, 100, "%"], "How much of the picture it fills when the growth is done.", { from: 30, to: 30 }],
    secs("reachSecs", "Seconds to full size", 120, 5, 20, "How long it takes to get from its starting size to its final size.", 1),
    perMin("surgesPerMin", "Surges per minute", 30, 0, 4, "How many sudden jumps in size it makes each minute."),
    ["whatGrows", "What is growing", ["the fire", "the smoke", "the water", "the sand", "the snow"], "Which element this growth is measured on.", U],
  ], { face: { face: "pad", x: "startPct", y: "endPct", xLabel: "starts", yLabel: "ends" } });

  m("smokeFireLens", [
    ["flameM", "Height of the flames", [0, 10, "m", 0.1], "How many meters tall the tallest flames reach.", { from: 0, to: 0.5 }],
    ["riseSpeed", "How fast smoke rises", [0, 10, "m/s", 0.1], "How many meters a second the smoke climbs.", { from: 0.3, to: 1 }],
    secs("hangSecs", "Seconds the smoke hangs", 300, 10, 30, "How long smoke stays in the air before it is gone.", 1),
    coverage(10, 30, "How much of the picture the smoke and fire cover."),
    distM(100, 3, 10, "How many meters from the lens the fire burns."),
  ]);

  m("sideStoryline", [
    perMin("cutsPerMin", "Cutbacks per minute", 30, 2, 4, "How many times a minute the film cuts over to the side story."),
    secs("clipSecs", "Seconds per cutaway", 30, 2, 4, "How long each visit to the side story lasts.", 0.5),
    ["leadSecs", "Ahead of or behind the words", [-5, 5, "s", 0.25], "How many seconds before (minus) or after (plus) the line it illustrates each cutaway comes.", { from: 0, to: 0 }],
    ["meetsAt", "Where they meet, % through", [0, 100, "%"], "How far through the scene the side story and the main story come together.", { from: 90, to: 90 }],
  ]);

  m("windForce", [
    ["tilt", "Blowing up or down", [-45, 45, "°"], "How far the wind tips upward (plus, an updraft) or downward (minus) from level.", { from: 0, to: 0 }],
    perMin("gustsPerMin", "Gusts per minute", 30, 2, 6, "How many gusts hit each minute."),
    secs("gustSecs", "Seconds per gust", 10, 1, 2, "How long each gust lasts.", 0.5),
    secs("rampSecs", "Seconds to pick up", 60, 5, 10, "How long the wind takes to reach its full strength.", 1),
    ["relTo", "Direction measured from", ["the camera", "the main character", "the scene"], "What the wind's direction is measured against.", U],
  ]);

  m("impacts", [
    secs("gapSecs", "Seconds between hits", 10, 0.5, 1, "How long between one collision and the next."),
    ["loudPct", "How loud next to the scene", [0, 200, "%"], "How loud each hit is compared with the rest of the scene's sound; 100 is level with it.", { from: 100, to: 140 }],
    offsetFrames(12, "How many frames before (minus) or after (plus) the beat or the cut each hit lands."),
    distM(50, 1, 5, "How many meters from the lens the hits happen."),
  ]);

  m("density", [
    ["visibleM", "How far you can see", [0.5, 500, "m", 0.5], "How many meters into the haze you can still make things out.", { from: 20, to: 50 }],
    ["layerM", "Height above the ground", [0, 20, "m", 0.1], "How many meters up the thickest part hangs.", { from: 0, to: 1 }],
    coverage(20, 60, "How much of the picture the haze or smoke fills."),
    secs("clearSecs", "Seconds to clear", 120, 5, 20, "How long it takes to thin out once it starts clearing.", 1),
  ]);

  m("splash", [
    ["widthM", "How wide it spreads", [0, 10, "m", 0.1], "How many meters across the splash reaches.", { from: 0.2, to: 1 }],
    secs("airSecs", "Seconds in the air", 5, 0.3, 0.8, "How long the splash hangs before it falls back."),
    distM(20, 0.5, 2, "How many meters from the lens the splash happens."),
    across(50, "How far across the picture the splash lands: 0 is the left edge, 100 the right."),
  ]);

  m("fireLight", [
    ["around", "Left or right of them", [-180, 180, "°"], "Where the fire sits around the lit person: 0 in front, minus their left, plus their right, 180 behind.", { from: -60, to: -60 }],
    ["height", "Above or below them", [-90, 90, "°"], "Whether the fire is below their eyes (minus, like a campfire) or above (plus, like a torch held high).", { from: -15, to: -15 }],
    ["fireM", "How near the fire is", [0.1, 30, "m", 0.1], "How many meters from the person the fire burns.", { from: 0.5, to: 2 }],
    ["sharePct", "Share of the light", [0, 100, "%"], "How much of the light on the scene comes from the fire rather than other lamps.", { from: 20, to: 60 }],
  ], {
    face: { face: "orbit", around: "around", height: "height", distance: "fireM" },
    preset: { label: "Campfire faces", plain: "A fire a meter away and below them, lighting nearly everything.", set: { around: 0, height: -30, fireM: 1, sharePct: 90 } },
  });

  m("forcesLens", [
    ["tilt", "Blowing up or down", [-45, 45, "°"], "How far the wind tips upward (plus) or downward (minus) from level.", { from: 0, to: 0 }],
    perMin("gustsPerMin", "Gusts per minute", 30, 2, 6, "How many gusts hit each minute."),
    secs("rampSecs", "Seconds to arrive", 60, 5, 10, "How long the forces take to reach full strength.", 1),
    ["eyeM", "Size of the calm eye", [0, 20, "m", 0.5], "How many meters across the still space around the hero is.", { from: 0, to: 2 }],
    ["relTo", "Direction measured from", ["the camera", "the main character", "the scene"], "What the wind's direction is measured against.", U],
  ]);

  m("crashLens", [
    ["bounces", "Bounces before it stops", [0, 20, "bounces", 1], "How many times a thing bounces before it comes to rest.", { from: 0, to: 2 }],
    ["slideM", "How far it slides", [0, 20, "m", 0.1], "How many meters a thing slides after it lands.", { from: 0, to: 1 }],
    ["chainCount", "Things knocked over", [1, 50, "things", 1], "How many things fall in the knock-on, counting the first.", { from: 1, to: 3 }],
    distM(50, 1, 5, "How many meters from the lens the crash happens."),
  ]);

  m("liquidLens", [
    ["depthM", "How deep", [0, 10, "m", 0.05], "How many meters deep the liquid is.", { from: 0.1, to: 0.5 }],
    ["flowSpeed", "How fast it flows", [0, 10, "m/s", 0.1], "How many meters a second the current moves.", { from: 0, to: 0.5 }],
    ["riseRate", "How fast the level moves", [-60, 60, "cm/min", 1], "How many centimeters a minute the level rises (plus) or falls (minus).", { from: 0, to: 0 }],
    ["waterline", "Waterline in the frame", [0, 100, "%"], "How far up the picture the surface sits: 0 is the bottom edge, 100 the top.", { from: 20, to: 20 }],
  ]);

  m("overlay", [
    across(75, "Exactly how far across the picture the overlay's center sits: 0 left edge, 100 right edge."),
    up(75, "Exactly how far up the picture the overlay's center sits: 0 bottom edge, 100 top edge."),
    secs("inSecs", "Seconds to come in", 3, 0, 0.5, "How long its fade, slide or grow takes."),
    ["leadSecs", "Before or after the words", [-5, 5, "s", 0.25], "How many seconds before (minus) or after (plus) the line it answers it appears.", { from: 0, to: 0 }],
  ], {
    face: { face: "frame", x: "across", y: "up", size: "size" },
    preset: { label: "Corner reaction", plain: "A small window top right, popping in just after the line.", set: { across: 80, up: 80, size: 25, inSecs: 0.2, leadSecs: 0.5 } },
  });

  m("superpowerEffect", [
    secs("buildSecs", "Seconds to build", 10, 0, 1, "How long the power takes to reach full strength."),
    secs("holdSecs", "Seconds it stays on", 30, 1, 3, "How long the power stays at full strength each time."),
    ["reachM", "How far it reaches", [0, 50, "m", 0.5], "How many meters the beams, trails or bolts reach from the body.", { from: 0.5, to: 5 }],
    ["brightPct", "Brighter than the scene", [0, 300, "%"], "How much brighter the power glows than the brightest thing in the scene.", { from: 50, to: 150 }],
    perMin("firesPerMin", "Times per minute", 60, 0, 2, "How many times a minute the power fires."),
  ]);

  m("hallucinationEffect", [
    secs("onsetSecs", "Seconds to take hold", 10, 0.5, 2, "How long the bending takes to reach full strength."),
    secs("endSecs", "Seconds to wear off", 10, 1, 1, "How long the world takes to come back to normal."),
    ["cyclesPerSec", "Swings per second", [0, 4, "per s", 0.1], "How many times a second the warping pulses, sways or spins round.", { from: 0.2, to: 0.5 }],
    coverage(30, 80, "How much of the picture bends; the rest stays normal."),
  ]);

  m("glitchEffect", [
    perMin("glitchesPerMin", "Glitches per minute", 120, 2, 6, "How many glitches hit each minute."),
    ["shiftPct", "How far the picture jumps", [0, 10, "% of width", 0.5], "How far colors split or slices slide sideways, as a share of the frame's width.", { from: 0, to: 2 }],
    coverage(30, 100, "How much of the picture each glitch breaks."),
    offsetFrames(12),
  ]);

  m("turbulence", [
    perMin("gustsPerMin", "Gusts per minute", 30, 2, 6, "How many gusts break the calm each minute."),
    ["gustPct", "Gusts stronger by", [0, 300, "%"], "How much stronger a gust is than the calm drift between gusts.", { from: 20, to: 80 }],
    secs("hushSecs", "Seconds of hush", 30, 0, 3, "How long the calm lasts before the storm breaks.", 0.5),
  ]);

  m("clothResponse", [
    ["swingDeg", "How far it swings", [0, 180, "°"], "How many degrees the cloth swings out from hanging straight down.", { from: 10, to: 40 }],
    ["flutterPerSec", "Flutters per second", [0, 15, "per s", 0.5], "How many times a second the edge flaps.", { from: 2, to: 6 }],
    secs("lagSecs", "Seconds it trails behind", 2, 0.1, 0.3, "How long after the body moves the cloth catches up.", 0.05),
    secs("settleSecs", "Seconds to settle", 10, 0.5, 2, "How long the cloth takes to hang still after the move."),
  ]);

  m("settleTime", [
    ["bounceCount", "How many bounces", [0, 20, "bounces", 1], "How many times things bounce before they rest.", { from: 0, to: 2 }],
    ["wobbleDeg", "How far it wobbles", [0, 45, "°", 0.5], "How many degrees things rock back and forth after the hit.", { from: 2, to: 8 }],
    ["wobblePerSec", "Wobbles per second", [0, 20, "per s", 0.5], "How fast the rocking goes back and forth.", { from: 3, to: 6 }],
  ]);

  m("gravityFeel", [
    secs("shiftSecs", "Seconds for gravity to shift", 30, 0, 3, "How long a change in gravity takes to arrive.", 0.5),
    ["appliesTo", "Whose weight", ["everything", "the people", "objects only", "one character"], "What the gravity setting is applied to.", U],
  ]);

  m("furLength", [
    ["growRate", "How fast it grows", [-10, 10, "cm/min", 0.1], "How many centimeters a minute the fur grows (plus) or shrinks (minus) on screen.", { from: 0, to: 0 }],
    ["whereOn", "Measured on", ["the head", "the back", "the tail", "the whole body"], "Where on the body the length is measured.", U],
  ]);

  m("clump", [
    ["hairsPerClump", "Hairs per clump", [2, 500, "hairs"], "Roughly how many hairs stick together in each clump.", { from: 10, to: 50 }],
    ["whereOn", "Where it clumps", ["the head", "the back", "the belly", "the legs", "all over"], "Where on the body the clumps are.", U],
  ]);

  m("frizz", [
    ["strayCm", "How far strays stick out", [0, 10, "cm", 0.1], "How many centimeters the stray hairs poke out from the rest.", { from: 0.5, to: 2 }],
    ["haloPct", "Halo next to the face", [0, 200, "%"], "How bright the backlit fuzz glows compared with the face; 100 is as bright.", { from: 0, to: 50 }],
  ]);

  m("hairColor", [
    ["streakPct", "Share in highlights", [0, 100, "%"], "How much of the hair is a lighter or dyed streak.", { from: 0, to: 20 }],
    ["rootsCm", "Roots showing", [0, 10, "cm", 0.5], "How many centimeters of natural color show at the roots.", { from: 0, to: 0 }],
  ]);

  m("hairShine", [
    ["shinePct", "Shine next to the skin", [0, 300, "%"], "How bright the shiny streak is compared with the brightest skin; 100 is as bright.", { from: 50, to: 120 }],
    ["streakWidth", "Width of the shine", [0, 50, "% of hair", 1], "How wide the shiny band is, as a share of the hair it lies on.", { from: 5, to: 15 }],
  ]);

  m("furResponse", [
    ["bendDeg", "How far the fur bends", [0, 90, "°"], "How many degrees the fur leans over when pushed.", { from: 5, to: 30 }],
    ["rippleSpeed", "How fast a ripple travels", [0, 10, "m/s", 0.1], "How many meters a second a ripple runs through the fur.", { from: 0.5, to: 2 }],
    secs("settleSecs", "Seconds to settle", 10, 0.5, 2, "How long the fur takes to lie still again."),
    secs("bristleSecs", "Seconds to bristle", 3, 0.1, 0.3, "How fast the fur stands up when the creature is startled.", 0.05),
  ]);

  m("furLag", [
    ["overshootDeg", "Swings past by", [0, 60, "°"], "How many degrees the fur swings past where it will rest.", { from: 0, to: 10 }],
    ["swings", "Swings before still", [0, 10, "swings", 1], "How many times it swings back and forth before it stops.", { from: 1, to: 3 }],
  ]);

  m("curl", [
    ["curlsInView", "Curls in view", [0, 50, "curls", 1], "How many separate swirls you can see at once.", { from: 1, to: 5 }],
    distM(50, 1, 5, "How many meters from the lens the swirls are."),
  ]);

  m("scatter", [
    ["blowSpeed", "How fast they blow across", [0, 10, "m/s", 0.1], "How many meters a second the scattered things travel.", { from: 0, to: 0.5 }],
    ["pathM", "Width of the clear path", [0, 10, "m", 0.1], "How many meters wide the gap that opens for the hero is.", { from: 0, to: 1 }],
    distM(100, 1, 20, "How many meters from the lens the nearest scattered things lie."),
  ]);

  m("clothLens", [
    ["swingDeg", "How far it swings", [0, 180, "°"], "How many degrees the cloth swings out from hanging straight down.", { from: 10, to: 40 }],
    ["flutterPerSec", "Flutters per second", [0, 15, "per s", 0.5], "How many times a second the edge flaps.", { from: 2, to: 6 }],
    secs("lagSecs", "Seconds it trails behind", 2, 0.1, 0.3, "How long after the body moves the cloth catches up.", 0.05),
  ]);

  m("bitsLens", [
    ["count", "How many in frame", [0, 2000, "bits"], "Roughly how many specks, flakes or drops are in the picture at once.", { from: 20, to: 200 }],
    ["fallSpeed", "How fast they move", [0, 15, "m/s", 0.1], "How many meters a second they float, drift or pour.", { from: 0.3, to: 1 }],
    ["tiltDeg", "Angle they fall at", [-60, 60, "°"], "How far they slant from straight down: minus toward the left, plus toward the right.", { from: 0, to: 10 }],
    distM(50, 1, 5, "How many meters from the lens the nearest ones pass."),
  ]);

  m("furLens", [
    ["lengthCm", "Length in centimeters", [0, 50, "cm", 1], "How many centimeters long the hair or fur is.", { from: 2, to: 8 }],
    ["whereOn", "Measured on", ["the head", "the back", "the tail", "the whole body"], "Where on the body these measurements are taken.", U],
  ]);

  m("cutout", [
    ["spillPct", "Green left on the edges", [0, 100, "%"], "How much of the old background's color still clings to the person's edges.", { from: 0, to: 5 }],
    ["shadowLen", "Shadow length", [0, 300, "% of height"], "How long their shadow on the new ground is, compared with their height.", { from: 50, to: 100 }],
    ["shadowDeg", "Shadow falls toward", [-180, 180, "°"], "Which way the shadow points: 0 straight back, minus to the left, plus to the right.", { from: 30, to: 30 }],
    secs("revealSecs", "Seconds to reveal", 5, 0, 1, "How long the new background takes to appear."),
  ]);

  m("maskShape", [
    ["centerAcross", "Center, across", [0, 100, "%"], "Exactly how far across the picture the mask's center sits: 0 left edge, 100 right edge.", { from: 50, to: 50 }],
    ["centerUp", "Center, up", [0, 100, "%"], "Exactly how far up the picture the mask's center sits: 0 bottom edge, 100 top edge.", { from: 50, to: 50 }],
    ["turn", "Turned by", [-180, 180, "°"], "How many degrees the shape is rotated.", { from: 0, to: 0 }],
    ["aspect", "Width next to height", [10, 400, "%"], "How wide the shape is compared with its height; 100 is as wide as it is tall.", { from: 100, to: 100 }],
  ], { face: { face: "frame", x: "centerAcross", y: "centerUp", size: "size" } });

  m("tracking", [
    ["leadFrames", "Behind or ahead, in frames", [-24, 24, "frames", 1], "How many frames behind (minus) or ahead (plus) of the target it moves.", { from: 0, to: 0 }],
    ["gapPct", "Gap from the target", [0, 50, "% of frame"], "How far from the target it sits, as a share of the frame.", { from: 5, to: 10 }],
  ]);

  m("videoEffect", [
    secs("inSecs", "Seconds to come in", 5, 0, 0.5, "How long the fade or build-up takes."),
    perMin("pulsesPerMin", "Pulses per minute", 240, 0, 120, "How many pulses a minute; match the song's beats per minute to pulse on the beat."),
    coverage(100, 100, "How much of the picture the effect covers."),
    offsetFrames(12),
  ]);

  m("multiplyEffect", [
    ["gapPct", "Space between copies", [0, 50, "% of frame"], "How far apart the copies sit, as a share of the frame.", { from: 2, to: 5 }],
    ["delayFrames", "Each copy behind by", [0, 30, "frames", 1], "How many frames each copy runs behind the one before it.", { from: 0, to: 4 }],
    ["turnsPerSec", "Turns per second", [0, 3, "per s", 0.05], "How many full turns a second the spinning copies make.", { from: 0, to: 0.25 }],
    secs("appearSecs", "Seconds for all to appear", 5, 0, 1, "How long from the first copy showing to the last."),
  ]);

  m("lightEffect", [
    coverage(20, 50, "How much of the picture the added light washes over."),
    secs("hitSecs", "Seconds each hit lasts", 10, 0.5, 2, "How long a flash, flare or burn stays before it fades."),
    secs("sweepSecs", "Seconds per sweep", 60, 5, 10, "How long a slow sweep takes to cross the frame.", 0.5),
    offsetFrames(12, "How many frames before (minus) or after (plus) the reveal or beat it lands."),
  ]);

  m("bodyEffect", [
    secs("trailSecs", "Trail length in seconds", 3, 0, 0.5, "How many seconds of past movement the trail shows.", 0.05),
    ["glowCm", "Glow reaches out", [0, 100, "cm", 1], "How many centimeters the glow or line reaches out from the body.", { from: 2, to: 10 }],
    secs("inSecs", "Seconds to come in", 5, 0, 0.5, "How long the effect takes to appear on the body."),
  ]);

  m("cloneEffect", [
    ["delayFrames", "Each copy behind by", [0, 60, "frames", 1], "How many frames each copy runs behind the person; a second is about 24.", { from: 2, to: 6 }],
    ["gapM", "Space between copies", [0, 5, "m", 0.05], "How many meters apart the copies stand.", { from: 0.2, to: 0.6 }],
    ["fadePct", "Last copy see-through", [0, 100, "%"], "How see-through the farthest copy is; 100 is invisible.", { from: 30, to: 70 }],
  ]);

  m("outlineEffect", [
    perMin("pulsesPerMin", "Pulses per minute", 120, 0, 15, "How many times a minute the line breathes or pulses."),
    secs("drawSecs", "Seconds to draw on", 5, 0, 1, "How long the line takes to trace itself around the person."),
  ]);

  m("distortionEffect", [
    secs("bendSecs", "Seconds to bend", 10, 0.2, 1, "How long the picture takes to reach its full bend."),
    secs("settleSecs", "Seconds to settle back", 10, 0.5, 1, "How long the picture takes to come back straight."),
    offsetFrames(12, "How many frames before (minus) or after (plus) the hit or feeling that sets it off."),
  ]);

  m("partyEffect", [
    ["flashFrames", "How long a flash lasts", [1, 24, "frames", 1], "How many frames each flash stays on; a second is about 24.", { from: 2, to: 4 }],
    offsetFrames(6, "How many frames before (minus) or after (plus) the beat each flash lands."),
  ]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
