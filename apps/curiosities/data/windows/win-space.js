/* In 3D around the subject. Jeremy, 2026-10-03 15:01Z: "a camera angle is a lot of things at once. It's an
   angle in relationship to something else, to the scene, to the subject. And it has a three-dimensional
   relationship to that scene or subject. How close or far away ..., whether the camera angle is above it or
   below it, And by how much, to the left of it or to the right of it, or by how much, or off axis from it,
   and by how much."
   So these are suites of measured curiosities, each its own lane: where the camera, the main light and a
   sound sit around the subject, in meters and degrees. Their windows have the orbit face: the subject seen from
   above (drag to go around and nearer or farther) and from the side (drag to go above or below). */
(function (W) {
  const DB = typeof window !== "undefined" ? window.CuriosityDB : require("../curiosity-db.js");
  /* The shared momentum sliders every row carries (db-momentum.js), copied from Shot size. */
  const shared = () => {
    const from = DB.find("shotSize");
    return from ? from.sliders.filter((s) => ["push", "pointsAhead", "themeLink"].includes(s.id)).map((s) => Object.assign({}, s)) : [];
  };
  const row = (c, momentum) => {
    if (DB.find(c.id)) return;
    const r = DB.curiosity(Object.assign({ kind: "lens", source: "windows", tags: ["3d"] }, c, { sliders: c.sliders.concat(shared()) }));
    r.momentum = momentum;
  };

  row(
    {
      id: "cameraPlace",
      label: "Camera angle in 3D",
      plain: "Where the camera is around the subject, measured: how far away, how far above or below, how far to the left or right, how far it looks off the subject, and how much the picture leans.",
      workspace: "camera-angle",
      group: "Camera",
      main: "around",
      sliders: [
        ["around", "Left or right of them", [-180, 180, "°"], "How far the camera has gone around the subject: 0 is straight in front, minus is their left side, plus their right, 180 behind.", { from: -45, to: 45 }],
        ["height", "Above or below them", [-90, 90, "°"], "How far above (plus) or below (minus) the subject's eyes the camera looks from; 90 is straight down.", { from: -15, to: 15 }],
        ["distance", "How far away", [0.3, 60, "m", 0.1], "How many meters from the subject the camera stands.", { from: 1.5, to: 6 }],
        ["offAxis", "Looking off them", [-60, 60, "°"], "How far the camera turns away from pointing straight at the subject, so they drift toward the edge of the frame.", { from: 0, to: 15 }],
        ["roll", "Picture leans", [-45, 45, "°"], "How far the picture tips sideways (a Dutch angle); 0 is level.", { from: 0, to: 12 }],
        ["subject", "Measured from", ["the main character", "the speaker", "the listener", "an object", "the room's center"], "What the camera's place is measured from.", { unordered: true }],
      ],
    },
    { push: 3, plot: "Moving around the subject changes whose side of the story the audience stands on.", theme: "Height and distance say who holds power and how close we are allowed to get.", pull: "A change of side or height pulls the eye to see the subject anew.", cue: "visual", tryThis: "Circle 90 degrees around your lead over a scene as they change their mind." }
  );
  row(
    {
      id: "lightPlace",
      label: "Main light in 3D",
      plain: "Where the main light sits around the subject, measured: to the side by how much, above or below by how much, and how near.",
      workspace: "light",
      group: "Light",
      main: "around",
      sliders: [
        ["around", "Left or right of them", [-180, 180, "°"], "How far around the subject the main light is: 0 from the front, 90 from the side, 180 from behind.", { from: -45, to: 45 }],
        ["height", "Above or below them", [-90, 90, "°"], "How high the light is: plus from above, minus from below (spooky), 90 straight overhead.", { from: 10, to: 45 }],
        ["distance", "How near", [0.3, 30, "m", 0.1], "How many meters from the subject; nearer light falls off faster across the face.", { from: 1, to: 4 }],
        ["size", "How big the light is", ["a bare bulb", "small", "medium", "large", "a whole window"], "A bigger light gives softer shadows."],
        ["fill", "Light on the dark side", [0, 100, "%"], "How much the shadow side is filled in; 0 leaves it black.", { from: 10, to: 60 }],
      ],
    },
    { push: 2, plot: "Moving the light reveals or hides what a face is feeling.", theme: "Light from below or behind turns a person strange or holy.", pull: "The eye goes to the brightest face first.", cue: "visual", tryThis: "Swing the main light from the front to the side as a character starts lying." }
  );
  row(
    {
      id: "soundPlace",
      label: "Where a sound comes from",
      plain: "Where the main sound sits around the listener, measured: left or right, above or below, near or far.",
      workspace: "music",
      group: "Sound",
      main: "around",
      sliders: [
        ["around", "Left or right", [-180, 180, "°"], "Where the sound comes from around us: 0 in front, minus left, plus right, 180 behind.", { from: -30, to: 30 }],
        ["height", "Above or below", [-90, 90, "°"], "Whether it comes from above (plus) or below (minus).", { from: 0, to: 0 }],
        ["distance", "How far away", [0.3, 100, "m", 0.1], "How far away it sounds; far sounds are quieter and more echoey.", { from: 1, to: 20 }],
        ["onScreen", "Seen or unseen", ["we see it", "just off the edge", "unseen"], "Whether we see what makes the sound."],
        ["moving", "Moves around us", ["still", "drifts", "passes by", "circles us"], "Whether the sound travels while we hear it."],
      ],
    },
    { push: 2, plot: "A sound from off screen tells us something is coming before we see it.", theme: "Sound behind us puts the audience inside the danger.", pull: "Ears turn the eyes: a sound to one side pulls attention there.", cue: "audio", tryThis: "Start a sound behind the audience and bring it round to the front as its source appears." }
  );

  const orbit = { face: "orbit", around: "around", height: "height", distance: "distance" };
  W.add("cameraPlace", {
    window: {
      faces: [Object.assign({}, orbit, { offAxis: "offAxis", roll: "roll" }), { face: "dial", slider: "roll" }],
      groups: [
        { label: "Around the subject", sliders: ["around", "height", "distance"] },
        { label: "Pointing", sliders: ["offAxis", "roll", "subject"] },
      ],
      presets: [
        { label: "Hero from below", plain: "Low and close, looking up: they look strong.", set: { around: -20, height: -30, distance: 1.5, offAxis: 0, roll: 0 } },
        { label: "God's eye", plain: "Straight down from high above.", set: { around: 0, height: 90, distance: 12, offAxis: 0, roll: 0 } },
        { label: "Over the shoulder", plain: "Behind one person, looking past them.", set: { around: 160, height: 5, distance: 1.2, offAxis: 15, roll: 0 } },
        { label: "Uneasy profile", plain: "From the side, tipped off level.", set: { around: 90, height: 0, distance: 2, offAxis: 5, roll: 15 } },
      ],
    },
  });
  W.add("lightPlace", {
    window: {
      faces: [orbit, { face: "dial", slider: "fill" }],
      groups: [
        { label: "Around the subject", sliders: ["around", "height", "distance"] },
        { label: "The light itself", sliders: ["size", "fill"] },
      ],
      presets: [
        { label: "Classic portrait", plain: "Forty-five degrees to the side and above.", set: { around: 45, height: 35, distance: 2, size: "medium", fill: 40 } },
        { label: "Film noir side light", plain: "Hard light from the side, the far half in shadow.", set: { around: 90, height: 10, distance: 2, size: "small", fill: 0 } },
        { label: "Campfire story", plain: "From below, close.", set: { around: 0, height: -40, distance: 0.6, size: "small", fill: 10 } },
        { label: "Halo from behind", plain: "Behind and above them, lighting their edges.", set: { around: 180, height: 30, distance: 3, size: "medium", fill: 30 } },
      ],
    },
  });
  W.add("soundPlace", {
    window: {
      faces: [orbit, { face: "tiles", slider: "moving", icons: { still: "•", drifts: "〰️", "passes by": "➡️", "circles us": "🔄" } }],
      groups: [
        { label: "Around us", sliders: ["around", "height", "distance"] },
        { label: "What we see", sliders: ["onScreen", "moving"] },
      ],
      presets: [
        { label: "Something behind you", plain: "Unseen, close, right behind.", set: { around: 180, height: 0, distance: 2, onScreen: "unseen" } },
        { label: "Train passing", plain: "Far to near and across, left to right.", set: { around: -60, distance: 30, onScreen: "just off the edge", moving: "passes by" } },
        { label: "Voice in your head", plain: "Dead center, very close.", set: { around: 0, height: 0, distance: 0.3, onScreen: "unseen", moving: "still" } },
      ],
    },
  });
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
