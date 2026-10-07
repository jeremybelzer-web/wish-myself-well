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
  const goViewer = (tab) => {
    const go = () => {
      if (V() && !V().isOpen()) V().open();
      if (tab) {
        const b = document.querySelector(`.cv-tabs [data-tab="${tab}"]`);
        if (b) b.click();
      }
    };
    go.tab = tab || "";
    return go;
  };
  /* The Screen's steps need the Screen itself, in its Screen view (the library, Player, Details and timeline),
     with the Viewer closed; the app's steps need both closed. stop() puts back what was open before. */
  let was = null;
  const goScreen = () => {
    if (V() && V().isOpen()) V().close();
    if (S() && !S().isOpen()) S().open();
    if (S() && S().view && S().view() !== "screen") {
      if (was && !was.view) was.view = S().view();
      S().view("screen");
    }
  };
  const goApp = () => {
    if (V() && V().isOpen()) V().close();
    if (S() && S().isOpen()) S().close();
  };

  /* Each step: where it is (go), what to light up (sel; none = the middle of the screen), a title and the words. */
  const STEPS = [
    { go: goViewer("move"), title: "Welcome to Curiomatic", text: "This walk shows you every part of the app, one at a time, for Jeremy and Sharani. Press Next (or the → key). You can stop any time and open it again from Help ▸ App Walkthrough at the top." },
    { part: "The Viewer", go: goViewer("move"), sel: ".cv-win", title: "The picture of your film", text: "This is your film as a moving picture. Things in the scene are simple shapes, so it opens fast and you can change anything. Drag a shape to move it. Drag empty space to swing the camera around." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-win", title: "Move yourself around", text: "Drag anywhere in the picture to swing the camera around and look from a new side, even from underneath. Hold Control and drag to slide yourself through the world, like grabbing a map. Double-click a spot to zoom in there, like Google Maps; Shift and double-click zooms out. The scroll wheel goes closer or farther. To move a thing instead, click it once to pick it, then drag it." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-wtab", title: "Switch films from the corner", text: "Every window has this tab in its upper-left corner. Tap the ‹ › arrows, or click and drag left or right to swipe between films: your film or an inspiration film. An inspiration film is any video you drag in from your computer or bring in from a web link. The + adds another window." },
    { part: "The Viewer", go: goViewer(), sel: '[data-act="addwin"]', title: "+ Add a window", text: "Opens another window next to your film, so you can watch an inspiration film side by side. Open as many as you need. Below the picture you choose how to see them: Fit all windows on screen (they shrink so you see 2, 3 or 4 at once), or Keep size, swipe the top edge (one big window; drag along its top edge or click its dots to see the others). In an inspiration window, Use this camera in my panel copies its camera onto your film." },
    { part: "The Viewer", go: goViewer(), sel: '[data-act="perform"]', title: "Performance and recording", text: "Curiomatic is also a performance app. Performance ▾ opens the Transport: a small window with Play, Back, Advance and Record that floats over every page, so it never hides when you add windows. Press ● Record and perform: every panel jump, storyboard page, curiosity or suite change and Catalyst you set off is kept with its time, as a take you can play back. Right-click ● Record (Control-click on a Mac) for Performance and recording: your takes, 🎹 Learn MIDI, and Live inputs, which sets curiosities off with MIDI, a camera watching the performer, or your spoken words." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-under", title: "Front and center", text: "Usually only one or two curiosities at a time move the story forward and hold the audience's attention. This lane shows which ones, moment by moment: Leading is the one holding attention, With it is the strongest other one changing, and Suite shows a group of them when most of it is on. A ⚡ means the one in front was set off by something else (a spark), and the line above says by what. Click any block to jump there; point at a shortened name to read it in full. On the right, the pie shows how the audience's attention is shared right now and the graph shows it through the whole film; click either to see it bigger." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-transport", title: "Play", text: "Plays the film one panel at a time. Things glide from where they stand in one panel to where they stand in the next. The slider jumps anywhere in the film. Space bar plays and stops." },
    { part: "The Viewer", go: goViewer(), sel: ".cv-things", title: "In the scene", text: "Everything in this scene, in a list you can scroll. Click a name to pick it; + adds another one like it, the eye hides it in this panel, the lock keeps it from moving by mistake. 3D next to a person turns them into a 3D character: a body with real joints, dressed from words, posed and picked like the block figure. At the top: Object search, Setting search (where the scene takes place) and Character search (bring people and animals in or take them out). Add a shape, also a list with a + on each, puts a new person, box, ball, tree, lamp post, building or block into every panel." },
    { part: "The Viewer", go: goViewer("move"), sel: ".cv-details", title: "Move it", text: "Moves the thing you picked: left, right, up, down or on a diagonal with the arrows. Turn it, or make it face the camera, stand side on, or turn its back. Change its size and pose. Changes are for the panel you are on. Hold Control and drag a thing to spin it; Control+click it (or right-click it) for what it can do: lie down, run, swim and more for people, sleep or fly away for animals, crumble, catch fire or break apart for things." },
    { part: "The Viewer", go: goViewer("camera"), sel: ".cv-details", title: "Camera & lens", text: "How the camera sees this panel. Fisheye bends straight lines. Foreshortening makes near things huge and far things small (a wide lens up close) or flattens everything (a long lens far away). Also camera height (all the way round to underneath), side, and lean, which turns the lens a full circle. A color filter tints the whole picture (warm, cool, noir, neon and more), and Background blur softens everything behind the thing the camera looks at. Each slider says what it does, and the map shows the camera from above." },
    { part: "The Viewer", go: goViewer("flight"), sel: ".cv-details", title: "Flight path", text: "Fly the camera through a panel like a drone. Press ● Record: the panel plays while you fly, and the camera's path is kept. Drag to swing round, the wheel to go closer, W A S D to fly, R and F to go up and down, Q and E to turn the lens. Below, the 3D graph shows the path from outside: drag it to turn it, drag a numbered waypoint to move it, Shift-drag to raise or lower it. Like a drone pilot's app, you choose where the camera looks (where you pointed it, at one thing the whole way, or ahead along the path), how smooth the corners are, and how far the lens spins on the way." },
    { part: "The Viewer", go: goViewer("people"), sel: ".cv-details", title: "People", text: "How each character feels and who they are, panel by panel. The emotion wheel has eight feelings around a circle, mild in the middle and strongest at the rim, and the blends between them, like love between joy and trust. Tilt it into 3D to see the feelings rise like a cone, with the character's path through the film drawn over it. Below: their Enneagram type and how healthy they are, who they act like right now (at their best people drift toward another type, their growth number, and at their worst toward their stress number), what they want right now, and the chaos matrix, with a ring for their normal amount of chaos, which shows whether they are orderly or chaotic, whether they push for change or keep things as they are, and why. Anything you set puts a ◆ in this panel and holds until the next one. Changing someone's type partway through warns you first. The emotional roadmap shows everyone's feeling in every panel." },
    { part: "The Viewer", go: goViewer("words"), sel: ".cv-details", title: "Words", text: "What people say, in speech balloons that point at whoever talks, and the yellow narrator box. Each balloon has a Speed: how many syllables a second it is spoken. Set it with the slider, tap once per syllable while you say the line in your head (Tap it), or say the line out loud (Say it). When the film plays, the words appear at that speed. Also how many seconds the panel stays on screen, and the rain." },
    { part: "The Viewer", go: goViewer("build"), sel: ".cv-details", title: "Draw & build", text: "Draw right in the picture with a pencil, then keep it a drawing or puff it up into a 3D shape. Put words in the picture in different fonts. Build like Roblox: blocks and other parts, arrows to move, dots to stretch, a ring to turn, and everything lines up in neat steps. Walls and rooms like The Sims, build pieces and ready-made sets like Fortnite. Windows at the top opens Roblox Studio's Properties, The Sims' Build Mode and Fortnite's Creative windows, each with a Curiosity menu at the top: pick a curiosity to see what belongs to it, press ◇ next to any setting to automate it panel by panel, and ⧉ to open another copy for another curiosity." },
    { part: "The Viewer", go: goViewer("build"), sel: '.cvb-finds [data-find="objects"]', title: "Search objects, settings and characters", text: "Hundreds of simple everyday things: kitchens and bedrooms, city streets and the people in them, farms and forests, boats, birds and planes. Pick a world, then a place, then a type, like Omnisphere's columns, or just type what you want. Setting search puts a whole place around your characters; Character search brings people and animals in or takes them out, or makes someone from words (\"Ida: spiky red hair, overalls, boots\"), and their look can be changed part by part in the Properties window." },
    { part: "The Viewer", go: goViewer("move"), sel: ".cv-strip", title: "The comic strip", text: "Every panel of your film, with its picture and its words, like a comic strip. The orange line with the ▼ is the playhead: drag along the ruler above the panels to scrub through the film and hear it (voices, rain, a tick at each new panel; 🔊 Sound turns that off). Click anywhere in a panel to jump to that moment. Double-click to play from it. + New panel adds the next moment. When you pause, the film goes back to where you pressed Play; under the picture you can choose to stay where it stopped instead." },
    { part: "The Viewer", go: goViewer(), sel: '[data-act="comic"]', title: "Read as a comic", text: "Shows every panel big, like a comic book page. Press Play there and each panel comes alive in its place. Layout picks the page: Simple grid, Modern comic (wide panels for big views, a large splash for the big moments, small insets for small things, tall panels for views from high or low, slanted frames for tilted shots), or Zine (photocopied cut-outs on paper)." },
    { part: "The Viewer", go: goViewer(), sel: '.cv-bar [data-act="close"]', title: "Full editor", text: "The Viewer is the simple, picture-first way in. The full editor is the rest of the app behind it, laid out like CapCut: the library of every curiosity, a player, the Details panel, and a timeline where every curiosity gets its own lane you can automate. Use it when you want to change things the Viewer doesn't show yet. The Viewer button at the top of the full editor brings you back here." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-bar", title: "The Screen", text: "The full editor, laid out like CapCut. Screen shows the library, the player, the details and the timeline. Arrange shows every curiosity as a track, left to right." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-look", title: "Looking through", text: "A curiosity is one thing about a scene you can look at and change: how close the camera is, a feeling, a joke's timing. A suite is a group of them. A spark is when one leads to another soon after. Pick which kind you are looking through here." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-lib", title: "The curiosity library", text: "Every curiosity, sorted by filmmaking category like CapCut's media tabs. Press + on a card to put it into your film at the playhead." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-player", title: "The player", text: "Inspiration films and your film side by side. The strip under them is the whole film, one picture per moment. Play, step and loop are under it." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-inspector", title: "Details", text: "Everything about the curiosity you picked: what it is, how it pushes the story forward and moves the audience's attention, and what to try." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-timeline", title: "The timeline", text: "Your film from left to right. Each curiosity gets a lane with dots and lines, like automation in Ableton: click a line to add a dot, drag a dot to change it, double-click a dot to delete it. Join two dots across lanes to make a spark." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .ccw-btn", title: "◎ Categories", text: "A window for each big group of suites, like Emotion or Herd mentality. A pie chart shows which suites play at this moment. Turn a suite's knob to push the whole group of curiosities toward it, or move one curiosity with its slider. A graph shows how they change across your film." },
    { part: "The Screen", go: goScreen, sel: ".sc-page [data-cat-open]", title: "⚗ Catalyst", text: "What sets curiosities off. A Spark is one thing that sets many off, like a crash cymbal or a word. An Elixir only works once every ingredient lines up, like a key in a lock or a flask filling up. Make your own in either tab." },
    { part: "The Screen", go: goScreen, sel: ".sc-page .sc-close", title: "Back to the app", text: "Leaves the Screen for the rest of the app, with the older pages and the Library." },
    { part: "The rest of the app", go: goApp, sel: "#tabs .tabs-top", title: "My film, Storyboard and Library", text: "My film is the first board: change a measurable thing about a scene and the storyboard changes. Storyboard keeps many scenes to flip through. Library holds curated films, the Prism, every curiosity and the Maya manual." },
    { part: "The rest of the app", go: goApp, sel: "#ws-buttons", title: "Workspaces", text: "One page per big area of filmmaking: Camera, People, Look, Sound, Feeling, Comedy and Story. Each page shows those curiosities in your film, lets you automate them, borrow them from a film, and use its tools." },
    { part: "The rest of the app", go: goApp, sel: "#lib-btn", title: "Library", text: "Curated films and the Shelf, the Prism (split a whole film into its curiosities), All curiosities, the Maya manual, Words (every film word in plain language) and Print." },
    { part: "Help", go: goViewer("move"), sel: ".cv-bar .cw-help", title: "Help ▸ App Walkthrough", text: "That's the tour. Open it again any time from Help at the top of any page. Help ▸ Hover help (on to start with) shows a little bubble saying what anything does when you rest the pointer on it; turn it off there when you know your way around. Have fun making your film." },
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
      menu.innerHTML = `<button type="button" role="menuitem" data-cw="tour">App Walkthrough<small>a guided tour of every part, in thought bubbles</small></button>${window.CurioTransport ? `<button type="button" role="menuitem" data-cw="perform">Performance and recording<small>the Transport, Record and takes; right-click ● Record opens it too</small></button>` : ""}${window.CurioHoverHelp ? `<button type="button" role="menuitem" data-cw="hover">Hover help: <span class="hh-state">${CurioHoverHelp.on() ? "on" : "off"}</span><small>rest the pointer on anything to see what it does</small></button>` : ""}`;
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cw]");
        if (!b) return;
        menu.hidden = true;
        if (b.dataset.cw === "hover") return window.CurioHoverHelp && CurioHoverHelp.toggle();
        if (b.dataset.cw === "perform") return window.CurioTransport && CurioTransport.panel(true);
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
    if (at < 0) was = { viewer: !!(V() && V().isOpen()), screen: !!(S() && S().isOpen()), view: null };
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
    /* back to what was open when the tour started (the Viewer, the Screen and its view), however it ended */
    const w = was;
    was = null;
    if (!w) return;
    try {
      if (S() && w.view && S().view) S().view(w.view);
      if (S() && w.screen !== S().isOpen()) w.screen ? S().open() : S().close();
      if (V() && w.viewer !== V().isOpen()) w.viewer ? V().open() : V().close();
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
    steps: () => STEPS.map((s) => ({ part: s.part || "", title: s.title, sel: s.sel || "", text: s.text, tab: (s.go && s.go.tab) || "" })),
    key: SEEN,
  };
})();
