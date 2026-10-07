/* viewer/fullscreen.js: a Full screen button right after the name Curiomatic, in the Viewer's top bar
   (Jeremy 2026-10-07: "it didn't fill the whole window ... I couldn't make larger"; the app link opens inside a
   frame). Not in the Screen's bar (?screen=1): that bar is redrawn on every change and the button changed its
   height, which redrew the Screen's lanes and took the keyboard off a lane's level bar. Esc or the button leaves
   full screen. Where the page may not go full screen, the button says so for a moment. It started in the app link's
   wrapper and now lives in the app. */
(function () {
  "use strict";
  if (window.CurioFullscreen) return;
  const d = document;
  const isFull = () => !!(d.fullscreenElement || d.webkitFullscreenElement);
  const label = () => (isFull() ? "⛶ Leave full screen" : "⛶ Full screen");
  const buttons = [];
  function toggle(btn) {
    if (isFull()) return void (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    const el = d.documentElement;
    const go = el.requestFullscreen || el.webkitRequestFullscreen;
    const no = () => {
      btn.textContent = "Full screen not allowed here";
      setTimeout(() => (btn.textContent = label()), 3000);
    };
    if (!go) return no();
    const p = go.call(el);
    if (p && p.catch) p.catch(no);
  }
  function make(cls) {
    const b = d.createElement("button");
    b.type = "button";
    b.className = "curio-fullscreen " + cls;
    b.textContent = label();
    b.title = "Fill the whole screen (Esc to leave)";
    b.addEventListener("click", () => toggle(b));
    buttons.push(b);
    return b;
  }
  const viewerBtn = make("cv-fs");
  /* the Viewer may rebuild its bar, so the button is put back whenever it goes missing */
  function place() {
    const brand = d.querySelector(".cv-root .cv-bar > .cv-brand");
    if (brand && brand.nextSibling !== viewerBtn) brand.after(viewerBtn);
  }
  d.addEventListener("fullscreenchange", () => buttons.forEach((b) => (b.textContent = label())));
  d.addEventListener("webkitfullscreenchange", () => buttons.forEach((b) => (b.textContent = label())));
  const st = d.createElement("style");
  st.textContent = `.curio-fullscreen { flex: none; white-space: nowrap; }
.cv-root .cv-bar > .cv-fs { padding: 4px 10px; font-size: 12.5px; }`;
  d.head.appendChild(st);
  setInterval(place, 700);
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", place);
  else place();
  window.CurioFullscreen = { toggle: () => toggle(viewerBtn), place };
})();
