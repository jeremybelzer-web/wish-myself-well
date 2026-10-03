/* video/load.js: adds the Video window (take a clip apart, apply it to another) to the app's page. One line in
   index.html, after every other script:

     <script src="video/load.js"></script>

   It loads video.css and the files in order (the same list as video/files.json). The Library gets "Take a clip
   apart" and the Screen's bar an "Import a video" button. */
(function () {
  if (window.__curioVideoLoad) return;
  window.__curioVideoLoad = true;
  const FILES = ["measure.js", "looks.js", "framing.js", "rhythm.js", "relight.js", "lanes.js", "clip.js", "ai.js", "depth.js", "mask.js", "ui.js"];
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.replace(/load\.js(\?.*)?$/, "") : "video/";
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = base + "video.css";
  document.head.appendChild(css);
  FILES.forEach((f) => {
    const s = document.createElement("script");
    s.src = base + f;
    s.async = false;
    document.body.appendChild(s);
  });
})();
