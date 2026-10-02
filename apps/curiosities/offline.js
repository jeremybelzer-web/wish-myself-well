/* Installable and offline (sw.js). Only on a real web address: opening index.html as a file still works as before. */
(function () {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
