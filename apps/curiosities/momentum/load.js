/* momentum/load.js: adds Momentum to the app's page. One line in index.html, after every other script:

     <script src="momentum/load.js"></script>

   It loads momentum.css and the momentum files in order (the same list as momentum/files.json); the Library
   menu then gets a "Momentum" item at the top. Nothing else on the page changes. */
(function () {
  if (window.__curioMomentumLoad) return;
  window.__curioMomentumLoad = true;
  const FILES = ["notes.js", "attention.js", "rates.js", "compass.js", "engine-lanes.js", "perform.js", "ui.js", "screen-panel.js", "timing.js", "tap.js", "three.js", "cuelab.js", "lesson.js", "drive.js", "characters.js", "storyboard-strip.js", "curve.js", "comedy-timing.js", "pacer.js", "cuesheet.js", "pads.js", "feeling.js", "report.js"];
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.replace(/load\.js(\?.*)?$/, "") : "momentum/";
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = base + "momentum.css";
  document.head.appendChild(css);
  FILES.forEach((f) => {
    const s = document.createElement("script");
    s.src = base + f;
    s.async = false;
    document.body.appendChild(s);
  });
})();
