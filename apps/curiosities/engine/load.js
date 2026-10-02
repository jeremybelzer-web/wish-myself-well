/* engine/load.js: adds the engine to the app's page. One line in index.html, after every other script:

     <script src="engine/load.js"></script>

   It loads engine.css and the engine's files in order (the same list as engine/files.json), then the
   Library menu gets an "Engine" item. Nothing else on the page changes. */
(function () {
  if (window.__curioEngineLoad) return; /* loaded twice: keep the first */
  window.__curioEngineLoad = true;
  const FILES = ["catalog.js", "state.js", "host.js", "fake-host.js", "seeds.js", "analyze.js", "app-undo.js", "selfcheck.js", "ui.js", "cube.js"];
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.replace(/load\.js(\?.*)?$/, "") : "engine/";
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = base + "engine.css";
  document.head.appendChild(css);
  FILES.forEach((f) => {
    const s = document.createElement("script");
    s.src = base + f;
    s.async = false; /* keep the order */
    document.body.appendChild(s);
  });
})();
