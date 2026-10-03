/* Light & color, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z).
   Where the main light sits around the subject (left or right, above or below, how near) is measured once, in
   Main light in 3D (lightPlace, win-space.js), so these rows measure everything else: how much, how big, where in
   the frame, how soon and how fast. */
(function (W) {
  /* One W.add per curiosity: its new sliders, a "Measured" group naming them, and an optional face and preset. */
  const m = (id, sliders, extra) => {
    extra = extra || {};
    const win = { groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }] };
    if (extra.face) win.faces = [extra.face];
    if (extra.preset) win.presets = [extra.preset];
    W.add(id, { sliders, window: win });
  };

  m("lightChange", [
    ["changeStops", "Brighter or darker, in stops", [-4, 4, "stops", 0.1], "How much the light changes; one stop doubles (plus) or halves (minus) the light.", { from: -1, to: 1 }],
    ["rampTime", "Time to reach the new light", [0, 30, "s", 0.1], "How many seconds the change takes from start to finish; 0 is a snap.", { from: 0, to: 2 }],
    ["changeArea", "Share of the frame it changes", [0, 100, "%"], "How much of the picture the change touches, from one corner to all of it.", { from: 30, to: 100 }],
  ], {
    face: { face: "pad", x: "rampTime", y: "changeStops", xLabel: "slower", yLabel: "brighter" },
    preset: { label: "Lights out", plain: "The room drops three stops darker in an instant.", set: { changeStops: -3, rampTime: 0, changeArea: 100 } },
  });

  m("timeOfDay", [
    ["sunFromCamera", "Sun's side of the camera", [-180, 180, "°"], "Where the sun is compared with where the camera looks: 0 is behind the camera, 90 to the side, 180 straight into the lens.", { from: 90, to: 90 }],
    ["timePassed", "Story time passing", [0, 720, "min"], "How many minutes of story time go by during the scene.", { from: 0, to: 10 }],
  ], {
    face: { face: "dial", slider: "sunFromCamera" },
    preset: { label: "Into the sunset", plain: "The sun sits right behind the people, facing us, as an hour slips by.", set: { sunFromCamera: 170, timePassed: 60 } },
  });

  m("practicalInFrame", [
    ["vsFaces", "Brighter than the faces by", [-4, 6, "stops", 0.5], "How much brighter (plus) or dimmer (minus) the lamp itself looks than the faces it sits near.", { from: 1, to: 1 }],
    ["placeX", "Where across the frame", [0, 100, "%"], "How far across the picture the source sits: 0 at the left edge, 100 at the right.", { from: 70, to: 70 }],
    ["placeY", "How high in the frame", [0, 100, "%"], "How far up the picture the source sits: 0 at the bottom, 100 at the top.", { from: 60, to: 60 }],
    ["fromFaces", "How far from the faces", [0, 20, "m", 0.1], "How many meters the source stands from the people it lights.", { from: 1, to: 1 }],
    ["flickerRate", "Flickers per second", [0, 20, "/s", 0.5], "How many times a second the source dips and comes back; 0 is steady.", { from: 0, to: 0 }],
  ], {
    face: { face: "frame", x: "placeX", y: "placeY" },
    preset: { label: "Candle by the face", plain: "A flickering candle half a meter from the face, a little brighter than the skin.", set: { vsFaces: 2, fromFaces: 0.5, flickerRate: 3, placeX: 40, placeY: 35 } },
  });

  m("wetness", [
    ["wetShare", "Share of surfaces wet", [0, 100, "%"], "How much of what we see is wet, from one puddle to everything.", { from: 0, to: 50 }],
    ["rainRate", "How hard it rains", [0, 100, "mm/h"], "Rain measured in millimeters an hour: 2 is a drizzle, 10 is steady rain, 50 is a downpour.", { from: 0, to: 10 }],
    ["dryTime", "Minutes to dry or soak", [0, 120, "min"], "How many minutes of story time it takes to go from wet to dry, or dry to soaked.", { from: 30, to: 30 }],
  ]);

  m("glow", [
    ["vsScene", "Brighter than the scene by", [-2, 6, "stops", 0.5], "How much brighter the glowing thing is than everything around it; each stop doubles it.", { from: 1, to: 2 }],
    ["pulseRate", "Pulses per minute", [0, 180, "/min"], "How many times a minute the glow swells; a resting heartbeat is about 60.", { from: 0, to: 0 }],
    ["reach", "How far the glow reaches", [0, 10, "m", 0.1], "How many meters out from the source its light still shows on things.", { from: 0.3, to: 1 }],
    ["glowSize", "How big in frame", [0, 100, "%"], "How tall the glowing thing is, as a share of the frame's height.", { from: 10, to: 10 }],
  ], {
    preset: { label: "Heartbeat glow", plain: "A small object pulsing like a heart, lighting the hands that hold it.", set: { pulseRate: 60, reach: 0.5, vsScene: 2, glowSize: 8 } },
  });

  m("wear", [
    ["wornFrame", "Share of the frame worn", [0, 100, "%"], "How much of the picture shows dirt or damage.", { from: 10, to: 30 }],
  ]);

  m("colorAccent", [
    ["accentShare", "How much of the frame it fills", [0, 50, "%", 0.5], "The accent's area as a share of the whole picture; small usually pops more.", { from: 2, to: 5 }],
    ["accentX", "Where across the frame", [0, 100, "%"], "How far across the picture the accent sits: 0 at the left, 100 at the right.", { from: 50, to: 50 }],
    ["accentY", "How high in the frame", [0, 100, "%"], "How far up the picture the accent sits: 0 at the bottom, 100 at the top.", { from: 40, to: 40 }],
    ["accentVsRest", "Stronger than other colors by", [0, 100, "%"], "How much more vivid the accent is than the most colorful other thing in the frame.", { from: 40, to: 40 }],
  ], {
    face: { face: "frame", x: "accentX", y: "accentY", size: "accentShare" },
    preset: { label: "The red coat", plain: "A small red spot, far more vivid than anything else, low in a gray crowd.", set: { accentShare: 2, accentVsRest: 90, accentX: 45, accentY: 30 } },
  });

  m("colorDrift", [
    ["driftKelvin", "Warmer or cooler, in kelvin", [-3000, 3000, "K", 100], "How far the color moves: plus is warmer (more orange), minus cooler (more blue); 1000 is a clear change.", { from: 0, to: 500 }],
    ["driftColor", "More or less color by", [-100, 100, "%"], "How much the colors fill up (plus) or drain away (minus) as it drifts.", { from: 0, to: 0 }],
    ["driftBright", "Brighter or darker by", [-3, 3, "stops", 0.1], "How much the picture brightens or darkens along with the color; one stop doubles or halves it.", { from: 0, to: 0 }],
  ], {
    face: { face: "pad", x: "driftKelvin", y: "driftColor", xLabel: "warmer", yLabel: "more color" },
  });

  m("lightingLens", [
    ["measuredOn", "Measured on", ["the lead's face", "whoever speaks", "the room", "the whole frame"], "What the lighting settings are judged on.", { unordered: true }],
    ["litShare", "Share of the frame in light", [0, 100, "%"], "How much of the picture is lit rather than in shadow.", { from: 40, to: 70 }],
    ["faceVsRoom", "Face brighter than the room by", [-3, 3, "stops", 0.1], "How much brighter (plus) or darker (minus) the face is than the room behind it.", { from: 1, to: 1 }],
    ["movesPerMin", "Light moves per minute", [0, 120, "/min"], "How many times a minute the light visibly moves or flickers; 0 is still.", { from: 0, to: 0 }],
  ]);

  m("lightRigLens", [
    ["bounceShare", "Light that comes from bounce", [0, 100, "%"], "How much of the light on the faces has bounced off walls, floor or a reflector rather than coming straight from a lamp.", { from: 20, to: 20 }],
    ["halfDistance", "Light halves every", [0.3, 20, "m", 0.1], "How many meters the light travels before it is half as bright; short means a quick fall into dark.", { from: 2, to: 2 }],
  ]);

  m("skinLens", [
    ["shineShare", "Share of the face shining", [0, 100, "%"], "How much of the face shows a shiny highlight from oil or sweat.", { from: 5, to: 15 }],
    ["flushTime", "Time for the face to color", [0, 30, "s", 0.5], "How many seconds a blush or flush takes to rise.", { from: 4, to: 4 }],
    ["skinVsScene", "Face brighter than the scene by", [-3, 3, "stops", 0.1], "How much brighter (plus) or darker (minus) the skin reads than the rest of the frame.", { from: 0.5, to: 0.5 }],
  ]);

  m("key", [
    ["keyFrom", "Direction measured from", ["the camera", "the way they face", "the room"], "What 'side', 'front' and 'back' are measured against.", { unordered: true }],
    ["faceLit", "Share of the face lit", [0, 100, "%"], "How much of the face the main light (the key) reaches; 50 is half the face.", { from: 50, to: 90 }],
    ["swingRate", "How fast it moves around", [0, 360, "°/min"], "How many degrees a minute the main light travels around the subject; 0 holds still.", { from: 0, to: 0 }],
  ], {
    preset: { label: "Half in shadow", plain: "Measured from the way they face, the light catches only half the face and holds still.", set: { keyFrom: "the way they face", faceLit: 50, swingRate: 0 } },
  });

  m("contrast", [
    ["contrastFrom", "Measured on", ["the face", "the whole frame", "the face against the room"], "Which bright and dark parts the contrast compares.", { unordered: true }],
    ["contrastStops", "Bright to dark, in stops", [0, 16, "stops", 0.5], "How many stops from the darkest detail to the brightest; each stop is twice the light.", { from: 4, to: 8 }],
    ["contrastTime", "Time to reach the new contrast", [0, 60, "s", 0.5], "How many seconds the contrast takes to change.", { from: 3, to: 3 }],
  ], {
    face: { face: "dial", slider: "contrastStops" },
  });

  m("colorTemp", [
    ["measuredOn", "Measured on", ["the main light", "the faces", "the background", "the whole frame"], "Whose light color the kelvin setting describes.", { unordered: true }],
    ["castAmount", "Green or pink, by how much", [-20, 20, ""], "How strong the green (minus) or pink (plus) tinge is; 0 is clean.", { from: 0, to: 0 }],
    ["splitKelvin", "Gap between warm and cool", [0, 6000, "K", 100], "How far apart in kelvin the warmest and coolest lights are; 0 is one color, 3000 is a strong split.", { from: 0, to: 2000 }],
    ["tempTime", "Time to change color", [0, 120, "s"], "How many seconds the light takes to reach its new color.", { from: 5, to: 5 }],
  ]);

  m("lighting", [
    ["poolCount", "Pools of light", [0, 12, ""], "How many separate patches of light you can count in the room.", { from: 3, to: 3 }],
    ["shiftLead", "Before or after its cue", [-3, 3, "s", 0.1], "How many seconds before (minus) or after (plus) its cue the look starts to shift.", { from: 0, to: 0 }],
    ["shiftTime", "Time to shift", [0, 30, "s", 0.5], "How many seconds the change of look takes.", { from: 2, to: 2 }],
  ]);

  m("softness", [
    ["sourceWidth", "Width of the light", [0.05, 6, "m", 0.05], "How wide the light source is in meters; wider and nearer means softer shadows.", { from: 1, to: 1 }],
    ["softTime", "Time to soften or harden", [0, 30, "s", 0.5], "How many seconds the shadows take to change from hard to soft or back.", { from: 3, to: 3 }],
  ]);

  m("rim", [
    ["rimAround", "Rim light around them", [-180, 180, "°"], "Where the rim light (the edge light) sits around the subject: 180 is straight behind, 135 behind and to their right, -135 to their left.", { from: 150, to: 150 }],
    ["rimHeight", "Rim light height", [0, 90, "°"], "How far above the subject the rim light shines down from.", { from: 30, to: 30 }],
    ["rimVsKey", "Brighter than the main light by", [-3, 3, "stops", 0.1], "How much brighter (plus) or dimmer (minus) the edge glow is than the main light on the face.", { from: 0, to: 0 }],
    ["rimFadeIn", "Time to appear", [0, 10, "s", 0.1], "How many seconds the rim light takes to come up when it appears.", { from: 1, to: 1 }],
  ], {
    face: { face: "orbit", around: "rimAround", height: "rimHeight" },
    preset: { label: "Hot edge from behind", plain: "A rim light high behind them, a stop brighter than the face.", set: { rimAround: 165, rimHeight: 45, rimVsKey: 1 } },
  });

  m("lightCount", [
    ["keyShare", "Share from the brightest light", [0, 100, "%"], "How much of all the light comes from the single brightest source.", { from: 60, to: 60 }],
    ["switchRate", "Lights switching per minute", [0, 30, "/min"], "How many times a minute a light goes on or off.", { from: 0, to: 0 }],
  ]);

  m("lightShape", [
    ["patternShare", "Share of the frame patterned", [0, 100, "%"], "How much of the picture the cast pattern covers.", { from: 30, to: 30 }],
    ["patternAngle", "Tilt of the pattern", [-90, 90, "°"], "How far the stripes or bars lean from level; 0 is flat, 90 straight up.", { from: 0, to: 0 }],
    ["swayRate", "Sways per minute", [0, 60, "/min"], "How many times a minute the pattern moves back and forth; 0 is still.", { from: 0, to: 0 }],
  ]);

  m("atmosphere", [
    ["visibility", "How far you can see", [1, 1000, "m"], "How many meters into the air before things disappear in it.", { from: 100, to: 100 }],
    ["airSpeed", "How fast the air moves", [0, 5, "m/s", 0.1], "How many meters a second the haze, smoke or fog drifts.", { from: 0.2, to: 0.2 }],
  ]);

  m("valueKey", [
    ["litShare", "Share of frame in full light", [0, 100, "%"], "How much of the picture is brightly lit.", { from: 30, to: 30 }],
    ["faceStops", "Face against normal", [-3, 3, "stops", 0.1], "How much brighter (plus) or darker (minus) the face is than a normal exposure.", { from: 0, to: 0 }],
  ]);

  m("renderStyle", [
    ["styledShare", "Share of the frame styled", [0, 100, "%"], "How much of the picture gets the style.", { from: 100, to: 100 }],
    ["drawRate", "Drawings per second", [6, 30, "fps"], "How many new drawings a second; 12 looks hand-animated, 24 smooth.", { from: 24, to: 24 }],
    ["styleTime", "Time to change style", [0, 10, "s", 0.1], "How many seconds the switch to the new style takes.", { from: 1, to: 1 }],
  ]);

  m("lineWeight", [
    ["linePx", "Line thickness", [0, 12, "px", 0.5], "How thick the outline is in pixels on a full HD picture.", { from: 2, to: 2 }],
    ["boilRate", "Line redraws per second", [0, 24, "/s"], "How many times a second the lines are redrawn so they shimmer; 0 is still.", { from: 0, to: 0 }],
  ]);

  m("gloss", [
    ["shineStops", "Shine brighter than the face by", [0, 6, "stops", 0.5], "How much brighter the shiny spots are than the face.", { from: 2, to: 2 }],
    ["glintRate", "Glints per minute", [0, 60, "/min"], "How many times a minute a shine flashes to catch the eye.", { from: 0, to: 0 }],
  ]);

  m("skinLight", [
    ["glowShare", "Share of the face glowing", [0, 100, "%"], "How much of the face shows light glowing through the skin.", { from: 10, to: 10 }],
    ["warmTime", "Time to warm up", [0, 30, "s", 0.5], "How many seconds the glow takes to rise with a feeling.", { from: 5, to: 5 }],
  ]);

  m("saturation", [
    ["satFrom", "Measured on", ["the whole frame", "the faces", "the background"], "Where the color strength is judged.", { unordered: true }],
    ["satPercent", "Color strength", [0, 200, "%"], "How strong the colors are: 100 is natural, 0 black and white, 200 doubled.", { from: 100, to: 100 }],
    ["heroGap", "Hero more colorful by", [0, 100, "%"], "How much more color the hero keeps than the rest of the frame.", { from: 0, to: 0 }],
  ], {
    face: { face: "dial", slider: "satPercent" },
  });

  m("palette", [
    ["mainShare", "Share in the main color", [0, 100, "%"], "How much of the frame is the main color.", { from: 50, to: 50 }],
    ["secondShare", "Share in the second color", [0, 100, "%"], "How much of the frame is the second color.", { from: 20, to: 20 }],
    ["hueGap", "Gap between the two colors", [0, 180, "°"], "How far apart the two colors sit on the color wheel: 30 are neighbors, 180 opposites.", { from: 60, to: 60 }],
  ], {
    face: { face: "pad", x: "mainShare", y: "secondShare" },
  });

  m("colorRange", [
    ["colorPercent", "Color strength", [0, 200, "%"], "How strong the color is: 0 black and white, 100 natural, 200 vivid.", { from: 100, to: 100 }],
    ["rangeTime", "Time to change", [0, 60, "s"], "How many seconds the color takes to drain or bloom.", { from: 5, to: 5 }],
  ]);

  m("colorFilter", [
    ["tintPercent", "Tint strength", [0, 100, "%"], "How strongly the tint colors the picture.", { from: 20, to: 20 }],
    ["tintShare", "Share of the frame tinted", [0, 100, "%"], "How much of the picture's area gets the tint.", { from: 100, to: 100 }],
  ]);

  m("filterHue", [
    ["hueAngle", "Exact color on the wheel", [0, 360, "°"], "The tint's exact color in degrees around the color wheel: 0 red, 120 green, 240 blue.", { from: 30, to: 30 }],
    ["slideAngle", "How far the color slides", [-180, 180, "°"], "How many degrees around the wheel the tint travels over the scene.", { from: 0, to: 0 }],
    ["slideTime", "Time to slide", [0, 120, "s"], "How many seconds the slide takes.", { from: 10, to: 10 }],
  ], {
    face: { face: "dial", slider: "hueAngle" },
  });

  m("colorCount", [
    ["biggestShare", "Share of the biggest color", [0, 100, "%"], "How much of the frame the most common color covers.", { from: 50, to: 50 }],
  ]);

  m("warmCool", [
    ["kelvin", "Warmth in kelvin", [2000, 10000, "K", 100], "The picture's warmth as a color temperature: low numbers look orange, 5600 like daylight, high numbers blue.", { from: 5600, to: 5600 }],
  ]);

  m("skinColorTruth", [
    ["hueOff", "Skin color off by", [0, 30, "°"], "How many degrees around the color wheel the skin has drifted from its true color.", { from: 0, to: 5 }],
  ]);

  m("surfaceLens", [
    ["reflectPercent", "How much it reflects", [0, 100, "%"], "How much of the light hitting the surface bounces back as a reflection.", { from: 10, to: 10 }],
    ["roughness", "Roughness", [0, 100, "%"], "How rough the surface is under the light: 0 is polished, 100 chalky; rougher spreads the shine.", { from: 50, to: 50 }],
    ["lightThrough", "Light that gets through", [0, 100, "%"], "How much light passes through the material.", { from: 0, to: 0 }],
  ], {
    face: { face: "pad", x: "roughness", y: "reflectPercent", xLabel: "rougher", yLabel: "more mirror" },
  });

  m("renderLookLens", [
    ["drawRate", "Drawings per second", [6, 30, "fps"], "How many new drawings a second; 12 looks hand-animated, 24 smooth.", { from: 24, to: 24 }],
    ["linePx", "Outline thickness", [0, 12, "px", 0.5], "How thick the outline is in pixels on a full HD picture.", { from: 0, to: 0 }],
  ]);

  m("layersLens", [
    ["layerCount", "Layers of depth", [1, 8, ""], "How many separate depths you can count, from the front of the picture to the back.", { from: 3, to: 3 }],
    ["fogStart", "Fog starts at", [0, 200, "m"], "How many meters from the camera the fog begins to show.", { from: 20, to: 20 }],
    ["frontVsBack", "Front brighter than back by", [-4, 4, "stops", 0.1], "How much brighter (plus) or darker (minus) the front layer is than the background.", { from: 1, to: 1 }],
  ]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
