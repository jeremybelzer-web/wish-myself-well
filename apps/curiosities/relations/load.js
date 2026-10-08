/* relations/load.js: the relationship map loads only when someone opens it. Adds "Relationship map" to the
   Library menu; the first click loads relations.css, archive.js, graph.js and relations.js (the app's own
   CuriosityDB is already loaded, so the map shows every curiosity, the user's own included), then opens it
   full-page. window.CurioRelationsLoad.load() returns a promise of window.CurioRelations. */
(function () {
  const base = (document.currentScript && document.currentScript.src.replace(/load\.js(\?.*)?$/, "")) || "relations/";
  const FILES = ["archive.js", "graph.js", "relations.js"];
  let loading = null;
  function load() {
    if (window.CurioRelations) return Promise.resolve(window.CurioRelations);
    if (loading) return loading;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = base + "relations.css";
    document.head.appendChild(css);
    loading = FILES.reduce(
      (p, f) =>
        p.then(
          () =>
            new Promise((res, rej) => {
              const s = document.createElement("script");
              s.src = base + f;
              s.onload = res;
              s.onerror = () => rej(new Error("could not load relations/" + f));
              document.head.appendChild(s);
            })
        ),
      Promise.resolve()
    ).then(() => window.CurioRelations);
    return loading;
  }
  function wire() {
    const menu = document.getElementById("lib-menu");
    if (!menu || menu.querySelector("[data-relations]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.relations = "open";
    b.innerHTML = "Relationship map<small>every curiosity and what it is tied to, flat or as a 3D cube</small>";
    menu.appendChild(b);
    b.addEventListener("click", () => {
      menu.hidden = true;
      load().then((R) => R.open()).catch(() => {});
    });
  }
  /* ?relations=1 opens the map as the page loads (the writing app's "3D relationship map" link). */
  function start() {
    wire();
    if (/[?&]relations=1\b/.test(location.search)) load().then((R) => R.open()).catch(() => {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else setTimeout(start, 0);
  window.CurioRelationsLoad = { load, FILES: FILES.slice() };
})();
