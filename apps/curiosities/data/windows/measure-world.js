/* Set, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  /* Adds the new settings, a "Measured" group listing them, and at most one face and one preset. */
  const M = (id, sliders, w) => {
    w = w || {};
    W.add(id, {
      sliders,
      window: { faces: w.face ? [w.face] : [], groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }], presets: w.preset ? [w.preset] : [] },
    });
  };

  M("setting", [
    ["placeInFrame", "Place's share of the frame", [0, 100, "%"], "How much of the picture shows the place rather than the people.", { from: 20, to: 70 }],
    ["leadIn", "Seen before the people", [-30, 30, "s"], "Seconds we see the place before the first person appears; minus means the people come first.", { from: 0, to: 5 }],
    ["timeHere", "Share of the film spent here", [0, 100, "%"], "How much of the film's running time happens in this place.", { from: 5, to: 30 }],
    ["seenThrough", "Whose eyes we see it through", ["the main character", "a newcomer", "the owner", "nobody in particular"], "Whose view of the place the film takes.", { unordered: true }],
  ], {
    face: { face: "dial", slider: "placeInFrame" },
    preset: { label: "Arrive with a stranger", plain: "We see the place first, through a newcomer's eyes.", set: { leadIn: 8, placeInFrame: 80, seenThrough: "a newcomer" } },
  });

  M("temperature", [
    ["degrees", "How hot or cold", [-30, 50, "°C"], "The air temperature in degrees Celsius.", { from: 5, to: 30 }],
    ["turnTime", "Minutes to heat up or cool", [0, 120, "min"], "How many minutes the place takes to reach its new temperature.", { from: 5, to: 30 }],
    ["firstSign", "First sign of it", [0, 60, "s"], "Seconds into the scene before a body first shows the heat or cold.", { from: 2, to: 10 }],
  ], { face: { face: "dial", slider: "degrees" } });

  M("props", [
    ["propInFrame", "How big the key prop looks", [0, 100, "%"], "The key prop's height as a share of the frame's height.", { from: 5, to: 30 }],
    ["propReach", "How far from their hand", [0, 10, "m", 0.1], "Meters between the key prop and the character who needs it.", { from: 0.5, to: 3 }],
    ["heldFor", "Seconds in hand", [0, 120, "s"], "How long the prop is held or used in the scene.", { from: 2, to: 20 }],
    ["plantedAhead", "Shown how long before it matters", [0, 90, "min"], "Minutes of film between first seeing the prop and the moment it counts.", { from: 1, to: 20 }],
    ["propOwner", "Whose it is", ["the main character", "the rival", "a stranger", "nobody", "everyone"], "Who the key prop belongs to.", { unordered: true }],
  ], {
    face: { face: "pad", x: "propReach", y: "propInFrame", xLabel: "Farther from the hand", yLabel: "Bigger in frame" },
    preset: { label: "Planted early", plain: "We see it long before it matters, just out of reach.", set: { plantedAhead: 30, propReach: 4, propInFrame: 8 } },
  });

  M("intExt", [
    ["exitDistance", "Distance to the way out", [0, 50, "m", 0.5], "Meters from the people to the nearest door or opening.", { from: 1, to: 10 }],
    ["crossings", "Times through the door", [0, 10, ""], "How many times someone crosses between inside and outside in the scene.", { from: 0, to: 2 }],
    ["insideShare", "Time spent inside", [0, 100, "%"], "How much of the scene happens indoors.", { from: 30, to: 100 }],
  ]);

  M("weather", [
    ["visibility", "How far you can see", [5, 10000, "m", 1], "Meters you can see before rain, fog or dust hides everything.", { from: 200, to: 5000 }],
    ["blowsFrom", "Where it comes from", [-180, 180, "°"], "Which way the wind and rain come from around the people: 0 in their face, minus from their left, plus from their right, 180 from behind.", { from: -45, to: 45 }],
    ["burstEvery", "A gust every", [0, 60, "s"], "Seconds between gusts or bursts; 0 means it never lets up.", { from: 5, to: 20 }],
    ["skyInFrame", "Sky in the frame", [0, 100, "%"], "How much of the picture is sky.", { from: 0, to: 40 }],
  ], {
    face: { face: "dial", slider: "blowsFrom" },
    preset: { label: "Storm in their face", plain: "Gusts every few seconds straight at them, and you can barely see.", set: { blowsFrom: 0, burstEvery: 4, visibility: 50 } },
  });

  M("scale", [
    ["width", "How wide the place is", [1, 5000, "m", 1], "Meters across the place, wall to wall or edge to edge.", { from: 4, to: 40 }],
    ["tall", "How high it goes", [2, 500, "m", 0.5], "Meters from the floor to the ceiling or the tops of the buildings.", { from: 2.5, to: 10 }],
    ["revealAt", "Seconds until its size shows", [0, 300, "s", 1], "How long before the audience understands how big the place really is.", { from: 0, to: 20 }],
  ], { face: { face: "pad", x: "width", y: "tall", xLabel: "Wider", yLabel: "Higher" } });

  M("layoutOpen", [
    ["freeFloor", "Free floor", [1, 2000, "m²", 1], "Square meters of floor nobody and nothing is standing on.", { from: 6, to: 60 }],
    ["personGap", "Space between people", [0.2, 20, "m", 0.1], "Meters between the people as they stand.", { from: 0.5, to: 3 }],
    ["walked", "Distance walked", [0, 100, "m"], "How many meters the people walk in the scene.", { from: 0, to: 15 }],
  ], { face: { face: "pad", x: "freeFloor", y: "personGap", xLabel: "More floor", yLabel: "Farther apart" } });

  M("setLayout", [
    ["focalAround", "Where the focal point sits", [-180, 180, "°"], "Which way the room's focal point is from the main character: 0 in front, minus to their left, plus to their right, 180 behind.", { from: -30, to: 30 }],
    ["focalDistance", "Distance to the focal point", [0, 50, "m", 0.5], "Meters from the main character to what the room points to.", { from: 2, to: 10 }],
    ["levelDrop", "Height between levels", [0, 20, "m", 0.1], "Meters between the lowest and highest floor people stand on.", { from: 0, to: 3 }],
    ["layoutFrom", "Measured from", ["the main character", "the camera", "the main door", "the room's center"], "Where these distances and directions are measured from.", { unordered: true }],
  ], { face: { face: "orbit", around: "focalAround", distance: "focalDistance" } });

  M("crowdLens", [
    ["crowdDistance", "How far the crowd is", [0, 100, "m", 0.5], "Meters from the main character to the nearest edge of the crowd.", { from: 1, to: 20 }],
    ["crowdInFrame", "Crowd's share of the frame", [0, 100, "%"], "How much of the picture the crowd fills.", { from: 10, to: 60 }],
    ["crowdSpacing", "Space between them", [0.2, 10, "m", 0.1], "Meters between one person in the crowd and the next.", { from: 0.5, to: 2 }],
    ["crowdAround", "Gathered around", ["the main character", "the leader", "a stage", "the camera", "nothing"], "What the crowd is placed in relation to.", { unordered: true }],
  ], {
    face: { face: "pad", x: "crowdDistance", y: "crowdInFrame", xLabel: "Farther away", yLabel: "Fills more of the frame" },
    preset: { label: "Pressing in", plain: "A packed crowd right up against the hero, filling the frame.", set: { crowdDistance: 0.5, crowdSpacing: 0.3, crowdInFrame: 80, crowdAround: "the main character" } },
  });

  M("envMotion", [
    ["motionDistance", "How far from them", [0, 100, "m", 0.5], "Meters between the people and the moving water, wind, crowd or traffic.", { from: 1, to: 20 }],
    ["movingShare", "Share of the frame moving", [0, 100, "%"], "How much of the picture is in motion.", { from: 10, to: 50 }],
    ["pulseEvery", "A surge every", [0, 30, "s", 0.5], "Seconds between surges when the motion pulses or gusts; 0 means steady.", { from: 0, to: 6 }],
  ]);

  M("repeatInFrame", [
    ["copies", "How many copies", [0, 500, "", 1], "How many of the repeated thing are in frame.", { from: 5, to: 50 }],
    ["copyGap", "Gap between copies", [0, 20, "m", 0.1], "Meters from one copy to the next.", { from: 0.5, to: 3 }],
    ["repeatShare", "Share of the frame", [0, 100, "%"], "How much of the picture the repeats fill.", { from: 20, to: 70 }],
    ["appearGap", "Seconds between each appearing", [0, 5, "s", 0.1], "When the copies appear one by one, how long between each.", { from: 0.2, to: 1 }],
  ], { face: { face: "dial", slider: "copies" } });

  M("setStyle", [
    ["styledShare", "Styled pieces in frame", [0, 100, "%"], "How much of the picture is taken up by things that carry the style: furniture, fittings, details.", { from: 20, to: 60 }],
  ]);

  M("setMaterial", [
    ["materialShare", "Share of the frame", [0, 100, "%"], "How much of the picture shows the main material.", { from: 20, to: 70 }],
    ["nearestWall", "Nearest surface of it", [0, 20, "m", 0.1], "Meters from the people to the closest wall, floor or object made of it.", { from: 0.5, to: 4 }],
  ]);

  M("setLines", [
    ["lineTilt", "Main lines tilt", [-90, 90, "°"], "The angle of the strongest lines in frame: 0 level, 90 straight up, in between diagonal.", { from: 0, to: 30 }],
    ["meetAcross", "Where lines meet, across", [0, 100, "%"], "Where the room's lines run together, from the left edge (0) to the right (100).", { from: 40, to: 60 }],
    ["meetUp", "Where lines meet, up", [0, 100, "%"], "Where the room's lines run together, from the bottom (0) to the top (100).", { from: 40, to: 60 }],
  ], {
    face: { face: "pad", x: "meetAcross", y: "meetUp", xLabel: "Right", yLabel: "Up" },
    preset: { label: "Lines to the face", plain: "The room's lines run to the middle, about where a face sits.", set: { meetAcross: 50, meetUp: 62, lineTilt: 20 } },
  });

  M("wallArt", [
    ["pieceCount", "How many pieces", [0, 100, ""], "How many pictures, mirrors or objects hang on the walls in view.", { from: 2, to: 12 }],
    ["vsEyes", "Above or below their eyes", [-2, 2, "m", 0.1], "How far the middle of the art hangs above (plus) or below (minus) the characters' eyes.", { from: -0.3, to: 0.5 }],
    ["artDistance", "Art behind the head", [0, 10, "m", 0.1], "Meters from the character to the nearest piece of art behind them.", { from: 0.5, to: 3 }],
  ]);

  M("artArrangement", [
    ["artRows", "Rows of art", [0, 10, ""], "How many rows the art is hung in.", { from: 1, to: 3 }],
    ["artGap", "Gap between pieces", [0, 200, "cm", 1], "Centimeters between neighboring pieces.", { from: 5, to: 40 }],
    ["centerOffset", "Centerpiece off the middle", [-100, 100, "%"], "How far the biggest piece sits from the middle of the wall: minus left, plus right.", { from: 0, to: 0 }],
  ]);

  M("clutter", [
    ["itemCount", "Things lying around", [0, 500, "", 1], "Roughly how many loose objects are in view.", { from: 5, to: 60 }],
    ["clearFloor", "Clear floor to walk on", [0, 100, "%"], "How much of the floor is free of stuff.", { from: 30, to: 90 }],
    ["clutterReach", "Mess within reach", [0, 5, "m", 0.1], "Meters from the main character to the nearest pile.", { from: 0.3, to: 2 }],
  ]);

  M("setUpkeep", [
    ["yearsSince", "Years since it was done up", [0, 200, "years", 1], "How long since anyone last painted, fixed or refurbished the place.", { from: 1, to: 20 }],
    ["damagedShare", "Share that's damaged", [0, 100, "%"], "How much of what we see is broken, cracked or peeling.", { from: 0, to: 20 }],
  ]);

  M("setDepth", [
    ["seeDepth", "How far we see behind", [0.3, 1000, "m", 0.1], "Meters from the characters to the farthest thing we can see behind them.", { from: 2, to: 30 }],
    ["firstLayer", "Them to the nearest thing behind", [0, 50, "m", 0.1], "Meters from the characters to the first wall, person or object behind them.", { from: 0.5, to: 4 }],
    ["backPeople", "People in the background", [0, 200, "", 1], "How many people we can see behind the characters.", { from: 0, to: 10 }],
  ], { face: { face: "pad", x: "firstLayer", y: "seeDepth", xLabel: "Nearest layer farther", yLabel: "See deeper" } });

  M("setBrightness", [
    ["wallReflect", "Light the walls give back", [0, 100, "%"], "How much light the walls, floor and furniture bounce back: black paint near 5, white paint near 85.", { from: 20, to: 60 }],
    ["faceVsWall", "Faces brighter than the walls", [-3, 3, "stops", 0.5], "How much brighter (plus) or darker (minus) the faces are than the room behind them, in stops (each stop doubles the light).", { from: 0, to: 1 }],
  ]);

  M("scatterLens", [
    ["perSquareMeter", "Pieces per square meter", [0, 500, "", 1], "How many scattered things lie on each square meter of ground.", { from: 2, to: 50 }],
    ["pieceSize", "Size of each piece", [0.5, 500, "cm", 0.5], "How big a typical piece is, in centimeters.", { from: 2, to: 30 }],
    ["pathWidth", "Width of the clear path", [0, 5, "m", 0.1], "Meters across the path through it; 0 means no path.", { from: 0, to: 1.5 }],
  ]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
