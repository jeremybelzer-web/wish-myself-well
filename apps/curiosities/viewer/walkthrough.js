/* viewer/walkthrough.js: the App Walkthrough, a guided tour of Curiomatic in thought bubbles.

   It walks through the Viewer, the Screen and the rest of the app one part at a time: a soft light falls on
   the part, and a thought bubble next to it says what it is for in plain words. Next, Back, the arrow keys and
   Esc work. It starts by itself the first time the app opens on a device (localStorage
   "curio-walkthrough-seen-v1"; automated test runs skip that), and Help ▸ App Walkthrough opens it again.

   Help sits at the top of every page: in the Viewer's bar, the Screen's bar and the app's bar. The Screen draws
   its own bar, so a small watcher puts the Help button back whenever the Screen redraws it (no change to
   screen/ui.js). API: window.CurioWalkthrough.start(at?), .stop(), .steps(). */
(function () {
  "use strict";
  if (window.CurioWalkthrough) return;
  const SEEN = "curio-walkthrough-seen-v1";

  const V = () => window.CurioViewer;
  const S = () => window.CurioScreen;
  const goViewer = (tab) => () => {
    if (V() && !V().isOpen()) V().open();
    if (tab) {
      const b = document.querySelector(`.cv-tabs [data-tab="${tab}"]`);
      if (b) b.click();
    }
  };
  const goScreen = () => {
    if (V() && V().isOpen()) V().close();
    if (S() && !S().isOpen()) S().open();
  };
  const goApp = () => {
    if (V() && V().isOpen()) V().close();
    if (S() && S().isOpen()) S().close();
  };

  /* Each step: where it is (go), what to light up (sel; none = the middle of the screen), a title and the words. */
  const STEPS = [
    { go: goViewer("move"), title: "Welcome to Curiomatic", text: "This walk shows you every part of the app, one at a time, for Jeremy and Sharani. Press Next (or the → key). You can stop any time and open it again from Help ▸ App Walkthrough at the top." },
    { part: "The Viewer", go: goViewer("move"), sel: ".cv-win", title: "The picture of your film", text: "This is your film as a moving picture. Things in the scene are simple shapes, so it opens fast and you can change anything. Drag a shape to move it. Drag empty space to swing the camera around." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-win", title: "Move yourself around", text: "Hold Control and drag to slide yourself through the world, like grabbing a map. Double-click a spot to zoom in there, like Google Maps. Shift and double-click zooms out. The scroll wheel goes closer or farther." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-wtab", title: "Switch films from the corner", text: "Every window has this tab in its upper-left corner. Swipe it left or right, or tap ‹ ›, to switch which film the window shows: your film, an inspiration film, or a video from your computer." },
    { part: "The Viewer", go: goViewer(), sel: '[data-act="addwin"]', title: "+ Window", text: "Opens another window next to your film, so you can watch an inspiration film side by side. Open as many as you need. In an inspiration window, Use this camera in my panel copies its camera onto your film." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-under", title: "Front and center", text: "Usually only one or two curiosities at a time move the story forward and hold the audience's attention. This lane shows which ones, moment by moment: Leading is the one holding attention, With it is the strongest other one changing, and Suite shows a group of them when most of it is on. A ⚡ means the one in front was set off by something else (a proximity), and the line above says by what. Click any block to jump there." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-transport", title: "Play", text: "Plays the film one panel at a time. Things glide from where they stand in one panel to where they stand in the next. The slider jumps anywhere in the film. Space bar plays and stops." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-things", title: "In the scene", text: "Everything in this scene. Click a name to pick it. Add a shape puts a new person, box, ball, tree, lamp post or building into every panel." },
    { part: "The Viewer", go: goViewer("move"), sel: ".cv-details", title: "Move it", text: "Moves the thing you picked: left, right, up, down or on a diagonal with the arrows. Turn it, or make it face the camera, stand side on, or turn its back. Change its size and pose. Changes are for the panel you are on." },
    { part: "The Viewer", go: goViewer("camera"), sel: ".cv-details", title: "Camera & lens", text: "How the camera sees this panel. Fisheye bends straight lines. Foreshortening makes near things huge and far things small (a wide lens up close) or flattens everything (a long lens far away). Also camera height, side and lean. Each slider says what it does, and the map shows the camera from above." },
    { part: "The Viewer", go: goViewer("words"), sel: ".cv-details", title: "Words", text: "What people say, in speech balloons that point at whoever talks, and the yellow narrator box. Also how many seconds the panel stays on screen, and the rain." },
    { part: "The Viewer", go: goViewer("build"), sel: ".cv-details", title: "Draw & build", text: "Draw right in the picture with a pencil, then keep it a drawing or puff it up into a 3D shape. Put words in the picture in different fonts. Build like Roblox: blocks and other parts, arrows to move, dots to stretch, a ring to turn, and everything lines up in neat steps. Walls and rooms like The Sims, build pieces and ready-made sets like Fortnite." },
    { part: "The Viewer", go: goViewer("build"), sel: '.cvb-quick [data-bq="search"]', title: "Search objects", text: "Hundreds of simple everyday things: kitchens and bedrooms, city streets and the people in them, farms and forests, boats, birds and planes. Pick a world, then a place, then a type, like Omnisphere's columns, or just type what you want." },
    { part: "The Viewer", go: goViewer("move"), sel: ".cv-strip", title: "The comic strip", text: "Every panel of your film, with its picture and its words, like a comic strip. Click a panel to work on it. Double-click to play from it. + New panel adds the next moment." },
    { part: "The Viewer", go: goViewer(), sel: '[data-act="comic"]', title: "Read as a comic", text: "Shows every panel big, like a comic book page. Press Play there and each panel comes alive in its place." },
    { part: "The Viewer", go: goViewer(), sel: '.cv-bar [data-act="close"]', title: "Full editor", text: "Opens the rest of the app: every curiosity, the timeline and the automation. The Viewer button at the top brings you back here." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-bar", title: "The Screen", text: "The full editor, laid out like CapCut. Screen shows the library, the player, the details and the timeline. Arrange shows every curiosity as a track, left to right." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-look", title: "Looking through", text: "A curiosity is one thing about a scene you can look at and change: how close the camera is, a feeling, a joke's timing. A suite is a group of them. A proximity is when one leads to another soon after. Pick which kind you are looking through here." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-lib", title: "The curiosity library", text: "Every curiosity, sorted by filmmaking category like CapCut's media tabs. Press + on a card to put it into your film at the playhead." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-player", title: "The player", text: "Inspiration films and your film side by side. The strip under them is the whole film, one picture per moment. Play, step and loop are under it." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-inspector", title: "Details", text: "Everything about the curiosity you picked: what it is, how it pushes the story forward and moves the audience's attention, and what to try." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-timeline", title: "The timeline", text: "Your film from left to right. Each curiosity gets a lane with dots and lines, like automation in Ableton: click a line to add a dot, drag a dot to change it, double-click a dot to delete it. Join two dots across lanes to make a proximity." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-close", title: "Back to the app", text: "Leaves the Screen for the rest of the app, with the older pages and the Library." },
    { part: "The rest of the app", go: goApp, sel: "#tabs .tabs-top", title: "My film, Storyboard and Library", text: "My film is the first board: change a measurable thing about a scene and the storyboard changes. Storyboard keeps many scenes to flip through. Library holds curated films, the Prism, every curiosity and the Maya manual." },
    { part: "The rest of the app", go: goApp, sel: "#ws-buttons", title: "Workspaces", text: "One page per big area of filmmaking: Camera, People, Look, Sound, Feeling, Comedy and Story. Each page shows those curiosities in your film, lets you automate them, borrow them from a film, and use its tools." },
    { part: "The rest of the app", go: goApp, sel: "#lib-btn", title: "Library", text: "Curated films and the Shelf, the Prism (split a whole film into its curiosities), All curiosities, the Maya manual, Words (every film word in plain language) and Print." },
    { part: "Help", go: goViewer("move"), sel: ".cv-bar .cw-help", title: "Help ▸ App Walkthrough", text: "That's the tour. Open it again any time from Help at the top of any page. Have fun making your film." },
  ];

  /* ---------- the look ---------- */
  const CSS = `
.cw-help { font-weight: 600; }
.cw-menu { position: fixed; z-index: 200; min-width: 220px; background: #1c1c1e; color: #ececee; border: 1px solid #2e2e33; border-radius: 8px; padding: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: grid; font: 13px -apple-system, "Segoe UI", system-ui, sans-serif; }
.cw-menu[hidden] { display: none; }
.cw-menu button { all: unset; cursor: pointer; padding: 7px 10px; border-radius: 6px; display: grid; }
.cw-menu button:hover, .cw-menu button:focus-visible { background: #34343a; }
.cw-menu small { color: #9b9ba3; font-size: 11px; }
.cw-light { position: fixed; z-index: 190; border-radius: 10px; box-shadow: 0 0 0 4px #22d3ee, 0 0 0 9999px rgba(5,8,12,0.55); pointer-events: none; transition: left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease; }
.cw-light.cw-none { box-shadow: 0 0 0 0 transparent, 0 0 0 9999px rgba(5,8,12,0.55); width: 0; height: 0; }
.cw-bubble { position: fixed; z-index: 201; width: min(340px, calc(100vw - 32px)); box-sizing: border-box; background: #fffdf6; color: #1b1b1f; border: 3px solid #1b1b1f; border-radius: 28px; padding: 14px 18px 12px; box-shadow: 4px 5px 0 rgba(0,0,0,0.35); font: 14px/1.45 -apple-system, "Segoe UI", system-ui, sans-serif; transition: left 0.25s ease, top 0.25s ease; }
.cw-bubble h3 { margin: 0 0 4px; font: 700 17px/1.25 'Comic Neue','Comic Sans MS','Chalkboard SE',system-ui,sans-serif; }
.cw-part { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #0e7490; font-weight: 700; }
.cw-bubble p { margin: 0 0 10px; }
.cw-row { display: flex; align-items: center; gap: 6px; }
.cw-row .cw-n { margin-right: auto; font-size: 12px; color: #5b5b66; font-variant-numeric: tabular-nums; }
.cw-bubble button { font: 600 13px -apple-system, "Segoe UI", system-ui, sans-serif; border: 2px solid #1b1b1f; background: #fff; color: #1b1b1f; border-radius: 999px; padding: 4px 12px; cursor: pointer; }
.cw-bubble button.cw-next { background: #22d3ee; }
.cw-bubble button:disabled { opacity: 0.35; cursor: default; }
.cw-bubble button:focus-visible { outline: 3px solid #0e7490; outline-offset: 2px; }
.cw-x { position: absolute; right: 10px; top: 8px; border: 0 !important; background: none !important; font-size: 18px !important; padding: 2px 6px !important; }
.cw-dot { position: fixed; z-index: 201; background: #fffdf6; border: 3px solid #1b1b1f; border-radius: 50%; box-sizing: border-box; transition: left 0.25s ease, top 0.25s ease; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .cw-light, .cw-bubble, .cw-dot { transition: none; } }`;

  let menu = null;
  let at = -1;
  let light = null;
  let bubble = null;
  let dots = [];
  let screenWasOpen = false;

  function style() {
    if (document.getElementById("cw-style")) return;
    const st = document.createElement("style");
    st.id = "cw-style";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- Help at the top of every page ---------- */
  function helpButton(extraStyle) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cw-help";
    b.textContent = "Help ▾";
    b.setAttribute("aria-haspopup", "true");
    b.title = "Help: the App Walkthrough";
    if (extraStyle) b.style.cssText = extraStyle;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openMenu(b);
    });
    return b;
  }
  function ensureHelp() {
    const vb = document.querySelector(".cv-bar .cv-bar-r");
    if (vb && !vb.querySelector(".cw-help")) vb.insertBefore(helpButton(), vb.firstChild);
    const sb = document.querySelector(".sc-page .sc-bar");
    if (sb && !sb.querySelector(".cw-help")) {
      const close = sb.querySelector(".sc-close");
      const b = helpButton();
      if (close) sb.insertBefore(b, close);
      else sb.appendChild(b);
    }
    const top = document.querySelector(".tabs-top");
    if (top && !top.querySelector(".cw-help")) {
      const lib = top.querySelector(".lib");
      const b = helpButton();
      if (lib) top.insertBefore(b, lib);
      else top.appendChild(b);
    }
    /* on a phone the top row has no room, so Library carries it there */
    const lm = document.getElementById("lib-menu");
    if (lm && !lm.querySelector("[data-cw-lib]")) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "phone-only";
      b.dataset.cwLib = "tour";
      b.innerHTML = "App Walkthrough<small>Help: a guided tour of every part</small>";
      b.addEventListener("click", () => {
        lm.hidden = true;
        const lb = document.getElementById("lib-btn");
        if (lb) lb.setAttribute("aria-expanded", "false");
        start(0);
      });
      lm.appendChild(b);
    }
  }
  function openMenu(btn) {
    style();
    if (!menu) {
      menu = document.createElement("div");
      menu.className = "cw-menu";
      menu.setAttribute("role", "menu");
      menu.innerHTML = `<button type="button" role="menuitem" data-cw="tour">App Walkthrough<small>a guided tour of every part, in thought bubbles</small></button>`;
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cw]");
        if (!b) return;
        menu.hidden = true;
        start(0);
      });
      document.addEventListener("click", (e) => {
        if (menu && !menu.hidden && !e.target.closest(".cw-menu")) menu.hidden = true;
      });
      document.body.appendChild(menu);
    }
    const r = btn.getBoundingClientRect();
    menu.hidden = false;
    const w = menu.offsetWidth;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + "px";
    menu.style.top = r.bottom + 4 + "px";
    const first = menu.querySelector("button");
    if (first) first.focus();
  }

  /* ---------- the tour ---------- */
  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
  }
  function start(i) {
    style();
    try {
      localStorage.setItem(SEEN, "1");
    } catch (e) {}
    if (at < 0) screenWasOpen = !!(S() && S().isOpen());
    if (!light) {
      light = document.createElement("div");
      light.className = "cw-light";
      bubble = document.createElement("div");
      bubble.className = "cw-bubble";
      bubble.setAttribute("role", "dialog");
      bubble.setAttribute("aria-live", "polite");
      bubble.setAttribute("aria-label", "App Walkthrough");
      dots = [18, 11].map((d) => {
        const el = document.createElement("div");
        el.className = "cw-dot";
        el.style.width = el.style.height = d + "px";
        return el;
      });
      bubble.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cw]");
        if (!b) return;
        if (b.dataset.cw === "next") show(at + 1, 1);
        if (b.dataset.cw === "back") show(at - 1, -1);
        if (b.dataset.cw === "stop") stop();
      });
      document.body.append(light, ...dots, bubble);
      document.addEventListener("keydown", onKey, true);
      window.addEventListener("resize", place);
    }
    show(i || 0, 1);
  }
  function onKey(e) {
    if (at < 0) return;
    if (e.key === "ArrowRight" || e.key === "Enter") show(at + 1, 1);
    else if (e.key === "ArrowLeft") show(at - 1, -1);
    else if (e.key === "Escape") stop();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
  function show(i, dir) {
    if (i >= STEPS.length) return stop();
    if (i < 0) i = 0;
    const st = STEPS[i];
    try {
      st.go && st.go();
    } catch (e) {}
    at = i;
    /* a part that isn't on this page (or isn't built yet) is skipped */
    setTimeout(() => {
      if (at !== i) return;
      const el = st.sel ? document.querySelector(st.sel) : null;
      if (st.sel && !visible(el)) {
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "center" });
        if (!visible(el)) {
          const j = i + (dir < 0 ? -1 : 1);
          if (j >= 0 && j < STEPS.length) return show(j, dir);
        }
      }
      draw(st);
    }, 60);
  }
  function draw(st) {
    bubble.innerHTML = `<button type="button" class="cw-x" data-cw="stop" aria-label="Close the walkthrough">×</button>${st.part ? `<div class="cw-part">${st.part}</div>` : ""}<h3>${st.title}</h3><p>${st.text}</p>
      <div class="cw-row"><span class="cw-n">${at + 1} of ${STEPS.length}</span><button type="button" data-cw="back"${at === 0 ? " disabled" : ""}>Back</button><button type="button" class="cw-next" data-cw="next">${at === STEPS.length - 1 ? "Done" : "Next"}</button></div>`;
    place();
    const nx = bubble.querySelector(".cw-next");
    if (nx) nx.focus({ preventScroll: true });
  }
  function place() {
    if (at < 0 || !bubble) return;
    const st = STEPS[at];
    const el = st.sel ? document.querySelector(st.sel) : null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    if (!el || !visible(el)) {
      light.classList.add("cw-none");
      light.style.left = vw / 2 + "px";
      light.style.top = vh / 2 + "px";
      bubble.style.left = (vw - bw) / 2 + "px";
      bubble.style.top = Math.max(16, (vh - bh) / 2) + "px";
      dots.forEach((d) => (d.hidden = true));
      return;
    }
    light.classList.remove("cw-none");
    const r = el.getBoundingClientRect();
    const pad = 6;
    const L = Math.max(4, r.left - pad);
    const T = Math.max(4, r.top - pad);
    const R = Math.min(vw - 4, r.right + pad);
    const B = Math.min(vh - 4, r.bottom + pad);
    Object.assign(light.style, { left: L + "px", top: T + "px", width: R - L + "px", height: B - T + "px" });
    /* the bubble goes where there is the most room: below, above, right or left of the part, else inside it */
    const gap = 46;
    const room = { below: vh - B, above: T, right: vw - R, left: L };
    let x;
    let y;
    let side;
    if (room.below >= bh + gap) side = "below";
    else if (room.above >= bh + gap) side = "above";
    else if (room.right >= bw + gap) side = "right";
    else if (room.left >= bw + gap) side = "left";
    else side = "inside";
    const cx = (L + R) / 2;
    const cy = (T + B) / 2;
    if (side === "below") (x = cx - bw / 2), (y = B + gap);
    if (side === "above") (x = cx - bw / 2), (y = T - gap - bh);
    if (side === "right") (x = R + gap), (y = cy - bh / 2);
    if (side === "left") (x = L - gap - bw), (y = cy - bh / 2);
    if (side === "inside") (x = R - bw - 16), (y = B - bh - 16);
    x = Math.max(16, Math.min(vw - bw - 16, x));
    y = Math.max(16, Math.min(vh - bh - 16, y));
    bubble.style.left = x + "px";
    bubble.style.top = y + "px";
    /* the thought bubble's little trail of circles, from the bubble toward the part */
    const bx = Math.max(x + 30, Math.min(x + bw - 30, cx));
    const by = side === "above" ? y + bh : side === "below" ? y : y + bh / 2;
    const tx = side === "inside" ? bx - 20 : Math.max(L, Math.min(R, cx));
    const ty = side === "above" ? T : side === "below" ? B : side === "inside" ? y + bh + 14 : cy;
    const sx = side === "right" ? x : side === "left" ? x + bw : bx;
    const fx = side === "right" ? R : side === "left" ? L : tx;
    [0.38, 0.72].forEach((k, n) => {
      const d = dots[n];
      d.hidden = false;
      const s = parseFloat(d.style.width);
      d.style.left = sx + (fx - sx) * k - s / 2 + "px";
      d.style.top = by + (ty - by) * k - s / 2 + "px";
    });
  }
  function stop() {
    at = -1;
    if (light) {
      light.remove();
      bubble.remove();
      dots.forEach((d) => d.remove());
      light = bubble = null;
      dots = [];
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
    }
    /* back where people start: the Screen as it was, the Viewer on top */
    try {
      if (screenWasOpen && S() && !S().isOpen()) S().open();
      if (V() && !V().isOpen()) V().open();
    } catch (e) {}
  }

  /* ---------- wiring ---------- */
  function wire() {
    style();
    ensureHelp();
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        ensureHelp();
      });
    }).observe(document.body, { childList: true, subtree: true });
    let skip = false;
    let seen = false;
    try {
      const q = location.search;
      skip = /[?&](walkthrough|viewer)=0\b/.test(q) || (!!navigator.webdriver && !/[?&]walkthrough=1\b/.test(q));
      seen = localStorage.getItem(SEEN) === "1";
    } catch (e) {}
    if (!skip && !seen) setTimeout(() => start(0), 900);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);

  window.CurioWalkthrough = {
    start: (i) => start(i || 0),
    stop,
    step: () => at,
    steps: () => STEPS.map((s) => ({ part: s.part || "", title: s.title, sel: s.sel || "" })),
    key: SEEN,
  };
})();
