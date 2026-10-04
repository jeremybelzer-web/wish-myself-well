/* screen/load.js: adds the Screen (Curiomatic's main layout) to the app's page. One line in index.html, after
   every other script (after engine/load.js, which the timeline needs):

     <script src="screen/load.js"></script>

   It loads screen.css and the Screen's files in order (the same list as screen/files.json). The bar gets a
   "Screen" button, the Library an "Arrange" item, and the Screen opens on start (?screen=0 skips it). */
(function () {
  if (window.__curioScreenLoad) return;
  window.__curioScreenLoad = true;
  const FILES = ["levels.js", "frame.js", "lanes.js", "character.js", "windows.js", "ui.js", "triggers.js"];
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.replace(/load\.js(\?.*)?$/, "") : "screen/";
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = base + "screen.css";
  document.head.appendChild(css);
  FILES.forEach((f) => {
    const s = document.createElement("script");
    s.src = base + f;
    s.async = false;
    document.body.appendChild(s);
  });
})();
