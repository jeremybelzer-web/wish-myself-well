/* Grade, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z).
   Most grading controls already carry numbers (strength, brightness, kelvin), so these add what is still only a
   word: how soon and how fast a look comes and goes, how often, and how much of the frame it touches. */
(function (W) {
  /* One W.add per curiosity: its new sliders, a "Measured" group naming them, and an optional face and preset. */
  const m = (id, sliders, extra) => {
    extra = extra || {};
    const win = { groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }] };
    if (extra.face) win.faces = [extra.face];
    if (extra.preset) win.presets = [extra.preset];
    W.add(id, { sliders, window: win });
  };

  m("filterLook", [
    ["cutLead", "Before or after the cut", [-2, 2, "s", 0.1], "How many seconds before (minus) or after (plus) the cut the filter starts.", { from: 0, to: 0 }],
    ["fadeOut", "Time to fade out", [0, 10, "s", 0.1], "How many seconds the filter takes to let go at the end.", { from: 1, to: 1 }],
  ]);

  m("retroEffect", [
    ["flickerRate", "Flickers per second", [0, 24, "/s", 0.5], "How many times a second the picture dims and comes back; old projectors flicker about 2 to 6 times.", { from: 3, to: 3 }],
    ["shakePx", "How far the picture shakes", [0, 20, "px"], "How many pixels the picture jumps around on a full HD frame; 0 is steady.", { from: 2, to: 2 }],
    ["flashRate", "Flashes per minute", [0, 30, "/min"], "How many sudden bursts of the retro look come in a minute.", { from: 0, to: 0 }],
    ["flashLength", "Each flash lasts", [0.1, 10, "s", 0.1], "How many seconds one burst of the retro look stays on screen.", { from: 0.5, to: 0.5 }],
  ], {
    face: { face: "pad", x: "flashRate", y: "flashLength", xLabel: "more often", yLabel: "longer" },
    preset: { label: "Memory flashes", plain: "Short bursts of old film, a few a minute, that shake and flicker.", set: { flashRate: 4, flashLength: 0.8, flickerRate: 6, shakePx: 4 } },
  });

  m("exposure", [
    ["stops", "Brighter or darker, in stops", [-3, 3, "stops", 0.1], "How far from a normal exposure: each stop doubles (plus) or halves (minus) the light.", { from: 0, to: 0 }],
    ["adjustTime", "Time for eyes to adjust", [0, 10, "s", 0.1], "How many seconds the picture takes to settle after a sudden change in light.", { from: 1, to: 1 }],
    ["whiteShare", "Share of frame pure white", [0, 100, "%"], "How much of the picture is so bright it loses all detail.", { from: 0, to: 2 }],
    ["blackShare", "Share of frame pure black", [0, 100, "%"], "How much of the picture is so dark it loses all detail.", { from: 0, to: 5 }],
  ], {
    face: { face: "dial", slider: "stops" },
    preset: { label: "Stepping into sunlight", plain: "The picture blows out two stops bright, then the eyes adjust over three seconds.", set: { stops: 2, adjustTime: 3, whiteShare: 30 } },
  });

  m("whiteBalance", [
    ["tintAmount", "Green or magenta, by how much", [-50, 50, ""], "How strong the green (minus) or magenta (plus) tinge is; 0 is clean.", { from: 0, to: 0 }],
    ["splitAmount", "Strength of the warm-cool split", [0, 100, "%"], "How strongly the bright parts go warm while the shadows go cool.", { from: 0, to: 0 }],
  ], {
    face: { face: "pad", x: "temperature", y: "tintAmount", xLabel: "cooler", yLabel: "magenta" },
  });

  m("texture", [
    ["vignetteReach", "How far in the dark corners reach", [0, 100, "%"], "How far from the edges toward the middle the darkening creeps.", { from: 30, to: 30 }],
    ["vignetteX", "Center of the frame, across", [0, 100, "%"], "Where across the picture the bright middle sits: 0 left, 100 right.", { from: 50, to: 50 }],
    ["vignetteY", "Center of the frame, up", [0, 100, "%"], "How high in the picture the bright middle sits: 0 bottom, 100 top.", { from: 50, to: 50 }],
  ], {
    face: { face: "frame", x: "vignetteX", y: "vignetteY" },
  });

  m("colorMatch", [
    ["matchSpan", "Shots that match", [1, 50, ""], "How many shots in a row are made to look alike.", { from: 5, to: 5 }],
    ["smoothTime", "Time to smooth a jump", [0, 5, "s", 0.1], "How many seconds after a cut the color eases from the old shot's look to the new one.", { from: 0, to: 0 }],
  ]);

  m("textureEffect", [
    ["changeRate", "Texture changes per second", [0, 24, "/s"], "How many times a second the texture is swapped for a new one, so it seems alive.", { from: 0, to: 0 }],
    ["edgeWidth", "Width of the edges", [0, 20, "%"], "How deep the torn or burned edge reaches into the picture.", { from: 3, to: 3 }],
  ]);

  m("colorWheels", [
    ["shadowReach", "How far up the shadows reach", [0, 100, "%"], "How bright a part can be and still count as shadow, so it takes the shadow color.", { from: 30, to: 30 }],
    ["pushTime", "Time to push in", [0, 30, "s", 0.5], "How many seconds the colors take to reach their new push.", { from: 2, to: 2 }],
  ]);

  m("colorCurves", [
    ["bendTime", "Time to bend the curve", [0, 30, "s", 0.5], "How many seconds the picture takes to reach the new curve.", { from: 2, to: 2 }],
  ]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
