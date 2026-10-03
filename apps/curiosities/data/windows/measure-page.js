/* Page, measured: each curiosity broken into its measurable parts (Jeremy, 2026-10-03 15:01Z). */
(function (W) {
  const d = (from, to) => ({ from, to: to == null ? from : to });
  const add = (id, sliders, extra) =>
    W.add(id, { sliders, window: Object.assign({ groups: [{ label: "Measured", sliders: sliders.map((s) => s[0]) }] }, extra || {}) });

  add("pageTurn", [
    ["lastPanelSize", "Size of the last panel", [5, 100, "%"], "The last panel before the turn, as a share of the page.", d(15)],
    ["revealSize", "Size of the reveal panel", [5, 100, "%"], "The first panel after the turn, as a share of the page.", d(50)],
  ], { presets: [{ label: "Turn to a splash", plain: "A small panel asks, a full page answers.", set: { setting: "reveal", lastPanelSize: 10, revealSize: 100 } }] });

  add("panelCount", [
    ["timePerPanel", "Story time per panel", [0.5, 600, "s"], "Seconds of story each panel covers on average.", d(5)],
  ]);

  add("gutter", [
    ["gutterSlant", "Slant of the gutter", [-30, 30, "°"], "Degrees the gap between panels leans; zero is straight.", d(0)],
  ]);

  add("balloon", [
    ["balloonAcross", "Where across the panel", [0, 100, "%"], "Where the balloon or caption sits, from the panel's left edge to its right.", d(30)],
  ]);

  add("panelSize", [
    ["biggestShare", "Biggest panel's share", [5, 100, "%"], "How much of the page the largest panel takes.", d(35)],
    ["smallestShare", "Smallest panel's share", [1, 50, "%"], "How much of the page the smallest panel takes.", d(8)],
  ], { faces: [{ face: "pad", x: "smallestShare", y: "biggestShare", xLabel: "Smallest panel", yLabel: "Biggest panel" }] });

  add("panelBreak", [
    ["breaksPerPage", "Breaks per page", [0, 6, "", 1], "How many times a figure crosses a panel border on one page.", d(1)],
  ]);

  add("textDensity", [
    ["textShare", "Panel covered by words", [0, 60, "%"], "How much of a panel's picture is hidden behind balloons and captions.", d(15)],
  ]);

  add("soundLettering", [
    ["letterTilt", "Tilt of the letters", [-45, 45, "°"], "Degrees the sound word leans; zero sits level.", d(0)],
    ["soundsPerPage", "Sound words per page", [0, 10, "", 1], "How many drawn sound words appear on one page.", d(1)],
  ]);
})(typeof window !== "undefined" ? window.CuriosityWindows : require("./windows.js"));
