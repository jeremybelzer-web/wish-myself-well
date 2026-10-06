/* demo/tours.js: the app's own "Show me" demonstrations, played by demo/player.js (window.CurioDemo).

   - map: the 3D curiosity map. Opens it, turns the whole block all the way round, zooms in, walks into a
     corridor and slides along it, stops at a cube and clicks it (its ties light up), swivels a full circle where
     it stands, double-clicks the cube to fly inside, where the screens float up like Jarvis, then opens screens,
     filters, flies into another cube by its name and leaves. Needs relations/ (the map) in this copy of the app.
   - window: any window (a curiosity's window on the Screen, the Catalyst window, a category window...). Says what
     it is, shows its live picture, then works each kind of control it has: clicks choices, turns a knob, slides
     sliders up and down, picks a preset, draws a shape over the film, and goes on to the lane (below).
   - lanes: the timeline's nodes and lines. Puts nodes on a lane, drags a node, clicks a line to add a node, drags
     a line, Alt-drags it to bend it into a curve, opens Curves to shape the bend, and double-clicks a node away.

   "▶ Show me" buttons: on every window's title bar (it plays the window demonstration for that window), on the
   3D map's top bar, and in Help ▾ (all three). Everything is a real click or drag, so the app changes for real;
   ⌘Z (Ctrl+Z) undoes it like any other change. */
(function (root) {
  "use strict";
  const D = root.CurioDemo;
  if (!D) return;
  const doc = root.document;
  const $ = (sel, el) => (el || doc).querySelector(sel);
  const $$ = (sel, el) => [...(el || doc).querySelectorAll(sel)];
  const shown = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (!(r.width > 2 && r.height > 2)) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  };
  const textOf = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

  /* ---------- the 3D curiosity map ---------- */
  async function mapTour(D) {
    const R = root.CurioRelations || (root.CurioRelationsLoad ? await root.CurioRelationsLoad.load().catch(() => null) : null);
    if (!R) return D.say("The 3D curiosity map is not in this copy of the app yet. It arrives with the relationship map.", 3500);
    await D.say("This is the 3D curiosity map. Every small cube is one curiosity, feeling, movement or trait. The lines between them show how closely they are related: their proximity.");
    let api = (doc.querySelector(".rl-overlay .rl") || {})._curioRelations || R.open();
    if (api && api.setView && api.view() && !(api.view().inner && api.view().inner() && api.view().inner().enter)) api.setView("cube");
    const ctx = await D.waitFor(() => {
      const v = api && api.view();
      const c = v && v.inner && v.inner();
      return c && c.stage && c.enter ? c : null;
    }, 12000);
    if (!ctx) return D.say("The 3D map needs three.js, which loads from the internet. Check the connection and try again.", 3500);
    const S = ctx.stage;
    const cv = S.renderer.domElement;
    const host = S.host;
    const ui = (c) => $$(`[data-c="${c}"]`, host).find((b) => !b.closest(".rl-inside") && shown(b));
    const box = () => cv.getBoundingClientRect();
    const mid = () => ({ x: box().left + box().width / 2, y: box().top + box().height / 2 });
    await D.wait(900);
    await D.say("It opens zoomed in at the mouth of a corridor. First, the whole block.", 2400);
    if (ui("home")) await D.click(ui("home"), { after: 1200 });

    /* A full turn: far out, a drag turns the block 0.008 of a turn-angle per pixel, so 2π / 0.008 pixels. */
    await D.say("Click and drag to turn the whole block all the way round.", 1800);
    await fullTurn(D, mid, box, 0.008);
    await D.say("Scroll to zoom in.", 1200);
    await D.wheel(mid(), -110, 9);
    await D.wait(400);
    await D.say("Walk a corridor flies you into the gap between two faces of cubes.", 2200);
    if (ui("corridor")) await D.click(ui("corridor"), { after: 1300 });
    const slider = $('.rl-corridor input[type="range"]', host);
    if (slider) {
      await D.say("Slide the corridor moves you along it, between the faces, never into a cube.", 1800);
      await D.slide(slider, Math.min(1000, Number(slider.value) + 550), 4200);
      await D.say("And stop.", 900);
    }

    /* Stop in front of a cube: the nearest one ahead of us, near the middle of the picture. */
    const cube = pickCube(ctx, S, cv);
    if (!cube) return D.say("No cube is in view from here. Drag to look round, then try again.", 3000);
    const at = () => screenOf(S, cv, ctx.pos.get(cube.id));
    await D.say("Click a cube to pick it. Lines run from it to every cube it is tied to.", 2000);
    await D.click(at(), { after: 700 });
    const picked = (api.selected && api.selected()[0]) || cube.id;
    const label = ((api.graph && api.graph.byId && api.graph.byId.get(picked)) || {}).label || "this cube";
    await D.say(`This one is ${label}.`, 1800);

    /* Swivel: close in, a drag looks round where you stand, 0.005 per pixel, so 2π / 0.005 pixels for a circle. */
    await D.say("Close in, dragging swivels you where you stand. All the way round, 360 degrees.", 2000);
    await fullTurn(D, mid, box, 0.005);
    await D.wait(300);

    await D.say("Double-click the cube to go inside it.", 1500);
    const p = screenOf(S, cv, ctx.pos.get(picked)) || at();
    await D.dbl(p, { after: 200 });
    const jar = await D.waitFor(() => $(".rl-jarvis", host), 4000);
    if (!jar) return D.say("The cube did not open. Try double-clicking right on it.", 2500);
    await D.wait(1300); // the screens float in one after another
    await D.say("Inside, the world goes dark and screens float up around you, like Jarvis in Iron Man. Each screen is one way of looking at this curiosity.");
    for (const k of ["one", "tracks", "pie", "all"]) {
      const s = $(`.rl-screen[data-screen="${k}"]`, jar);
      if (s) await D.move(s, 500);
    }
    const LINES = {
      one: "Connected to this: everything tied straight to this cube, grouped by how it is tied.",
      web: "Connected to those: what those are tied to in turn. Change any of them and it ripples back to this cube.",
      tracks: "Lanes, stacked like Ableton Live: how this curiosity and its ties move through the film.",
      pie: "Pie: who moves the most. This cube's slice is pulled out.",
      graph: "3D graph: the lanes as ribbons in depth. Drag to turn them.",
    };
    for (const k of ["one", "web", "tracks", "pie", "graph"]) {
      const s = $(`.rl-screen[data-screen="${k}"]`, jar);
      if (!s || !shown(s)) continue;
      await D.click($("h4", s) || s, { after: 500 });
      await D.say(LINES[k], null);
      if (k === "graph") {
        const g3 = await D.waitFor(() => $(".rl-ingraph canvas", jar), 3000);
        if (g3) await D.drag(g3, { dx: 220, dy: -40 }, { ms: 1400, after: 600 });
      }
      const back = $(".rl-backall", jar);
      if (back && shown(back)) await D.click(back, { after: 500 });
    }
    const all = $('.rl-screen[data-screen="all"]', jar);
    if (all && shown(all)) {
      await D.click($("h4", all) || all, { after: 500 });
      await D.say("All curiosities, with a filter. Type a few letters.", 1600);
      const q = $(".rl-allq", jar);
      if (q) await D.type(q, "fear");
      await D.wait(400);
      const go = $$(".rl-allres [data-go]", jar).find((b) => !b.classList.contains("me") && shown(b));
      if (go) {
        await D.say(`Click any name and you fly straight into its cube: ${textOf(go)}.`, 2000);
        const before = ctx.inside() && ctx.inside().id;
        await D.click(go, { after: 300 });
        await D.waitFor(() => ctx.inside() && ctx.inside().id !== before && $(".rl-jarvis", host), 4000);
        await D.wait(1400);
        await D.say("A new cube, its own screens.", 1600);
      }
    }
    const leave = $$('.rl-jarvis [data-tab="leave"]', host).find(shown);
    if (leave) {
      await D.say("Leave the cube takes you back out among the cubes.", 1600);
      await D.click(leave, { after: 1200 });
    }
    await D.say("That is the map. Everything you just saw was a real click, drag or scroll, so you can do all of it yourself.", 3200);
  }
  /* A full circle of drags across the middle of the picture (each one as wide as fits), perPx radians a pixel. */
  async function fullTurn(D, mid, box, perPx) {
    let left = (2 * Math.PI) / perPx;
    while (left > 1) {
      const w = Math.min(left, box().width * 0.6, 520);
      const m = mid();
      const from = { x: m.x - w / 2, y: m.y };
      await D.drag(from, { dx: w, dy: 0 }, { ms: Math.max(500, w * 3.2), after: 60, path: (k, a) => ({ x: a.x + w * k, y: a.y + Math.sin(k * Math.PI) * 2 }) });
      left -= w;
    }
  }
  const xyz = (p) => (Array.isArray(p) ? p : [p.x, p.y, p.z]); // the map keeps positions as [x, y, z]
  function screenOf(S, cv, p) {
    if (!p) return null;
    const s = S.project(xyz(p));
    if (!s.vis) return null;
    const r = cv.getBoundingClientRect();
    return { x: r.left + s.x, y: r.top + s.y };
  }
  function pickCube(ctx, S, cv) {
    const r = cv.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let best = null;
    ctx.pos.forEach((p, id) => {
      const q = xyz(p);
      const d = Math.hypot(S.camera.position.x - q[0], S.camera.position.y - q[1], S.camera.position.z - q[2]);
      if (d < 0.7) return;
      const s = screenOf(S, cv, p);
      if (!s || s.x < r.left + 40 || s.x > r.right - 40 || s.y < r.top + 40 || s.y > r.bottom - 60) return;
      const score = Math.abs(d - 2.5) + Math.hypot(s.x - cx, s.y - cy) / 160;
      if (!best || score < best.score) best = { id, score };
    });
    return best;
  }

  /* ---------- any window ---------- */
  const WINDOWS = [".sc-win", ".cat-win", ".ccw", ".sl-mwin"];
  const HEADS = [".sc-win > .sc-win-h", ".cat-win > .cat-h", ".ccw > header", ".sl-mwin > header"];
  const winOf = (el) => el && el.closest(WINDOWS.join(","));
  const titleOf = (win) => textOf($(".sc-win-h b, .cat-h b, header b, header h3, h3, h2, b", win)) || "this window";
  async function screenOpen() {
    const S = root.CurioScreen;
    if (!S) return false;
    if (!S.isOpen()) S.open();
    return !!(await D.waitFor(() => S.isOpen() && $(".sc-lanes"), 8000));
  }
  async function windowTour(D, opts) {
    let win = opts.win && opts.win.isConnected ? opts.win : $$(".sc-win").find(shown);
    if (!win) {
      if (!(await screenOpen())) return D.say("Open the Screen first: the windows live there.", 2500);
      await D.say("Every curiosity has its own window. Here is one: whose eyes the shot sees through.", 2400);
      root.CurioScreen.openWin(opts.id || "pov");
      win = await D.waitFor(() => $$(".sc-win").find(shown), 3000);
      if (!win) return;
    }
    const id = win.dataset.win || "";
    const key = win.matches(".sc-win") ? `.sc-win[data-win="${CSS.escape(id)}"]` : null;
    const live = () => (key ? $(key) : win.isConnected ? win : null); // windows redraw after a change: find it again
    const within = (sel) => {
      const w = live();
      return w ? $$(sel, w).filter(shown) : [];
    };
    await D.say(`This is the window for "${titleOf(win)}". Everything you can change about it is in here.`, null);
    const look = within(".cw-look, .cw-look-svg")[0];
    if (look) await D.point(look, "The picture at the top is live. Watch it as the controls below move.", 2600);

    let did = 0;
    /* Choices: tiles, frames, rungs. Click one that is not on, then another. */
    const choices = () => within("button[data-set][data-v]:not(.on), button[data-cat-pick]:not(.on)");
    if (choices().length) {
      await D.say("Click a choice and the picture follows.", 1500);
      await D.click(choices()[0], { after: 700 });
      if (choices()[1]) await D.click(choices()[1], { after: 700 });
      did++;
    }
    /* Knobs: drag up to turn up, down to turn down. */
    const knob = within("[data-knob]:not(.dis)")[0];
    if (knob) {
      await D.say("A knob: drag up to turn it up, down to turn it down.", 1700);
      const k = knob.dataset.knob;
      await D.turn(knob, 70, 1100);
      const k2 = within(`[data-knob="${CSS.escape(k)}"]`)[0];
      if (k2) await D.turn(k2, -40, 900);
      did++;
    }
    /* Sliders: up, then down. */
    const sliders = () => within('input[type="range"]:not(:disabled)');
    for (let i = 0; i < Math.min(2, sliders().length); i++) {
      const s = sliders()[i];
      await D.say(i === 0 ? "A slider: drag it and the picture and its lane follow." : "Another slider, up and back down.", i === 0 ? 1700 : 1200);
      const min = Number(s.min || 0);
      const max = Number(s.max || 100);
      await D.slide(s, min + (max - min) * 0.85, 1300);
      const again = sliders()[i];
      if (again) await D.slide(again, min + (max - min) * 0.25, 1100);
      did++;
    }
    /* Presets set several settings at once. */
    const preset = within("[data-cw-preset]")[0];
    if (preset) {
      const pname = textOf($("b, strong", preset) || preset).slice(0, 40);
      await D.say(`A preset sets several of these at once${pname ? ": " + pname : ""}.`, 2000);
      await D.click(preset, { after: 800 });
      did++;
    }
    /* A shape over the whole film: nodes all along its lane. */
    const shape = within("[data-cw-shape]")[0];
    if (shape) {
      await D.say("Shape over my film draws a whole curve across the film. Each bend becomes a node on this curiosity's lane.", null);
      await D.click(shape, { after: 900 });
      did++;
    }
    if (!did) {
      const any = within("button:not([data-win-close]):not([data-cd-show]), select")[0];
      if (any) await D.click(any, { after: 700 });
    }
    if (opts.lanes === false || !$(".sc-lanes")) return D.say("Every change you just saw is one undo step: ⌘Z (Ctrl+Z) takes it back.", 2600);
    await D.say("Every change in a window is a node on its lane, in the timeline below. Now the nodes and the lines between them.", null);
    const close = within("[data-win-close], [data-cat=close]")[0];
    if (close) {
      await D.say("Close the window to see the whole timeline.", 1400);
      await D.click(close, { after: 700 });
    }
    await lanesTour(D, Object.assign({}, opts, { fromWindow: true }));
  }

  /* ---------- nodes and lines on a lane ---------- */
  function laneWithNodes(el) {
    const n = {};
    $$("[data-node]:not(.sl-cpt)", el).forEach((c) => (n[c.dataset.lane] = (n[c.dataset.lane] || 0) + 1));
    const best = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    return best == null ? null : Number(best);
  }
  function segMid(seg) {
    try {
      // the point of the line halfway across (its path may run there and back, so not halfway along it)
      const L = seg.getTotalLength();
      const b = seg.getBBox();
      const cx = b.x + b.width / 2;
      let p = seg.getPointAtLength(0);
      for (let i = 0; i <= 60; i++) {
        const q = seg.getPointAtLength((L * i) / 60);
        if (Math.abs(q.x - cx) < Math.abs(p.x - cx)) p = q;
      }
      const m = seg.getScreenCTM();
      const q = new DOMPoint(p.x, p.y).matrixTransform(m);
      return { x: q.x, y: q.y };
    } catch (e) {
      const r = seg.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
  }
  async function lanesTour(D, opts) {
    if (!$(".sc-lanes") && !(await screenOpen())) return D.say("Open the Screen first: the lanes live there.", 2500);
    const el = $(".sc-lanes");
    const bg = (i) => $$(`rect.sl-bg[data-lane="${i}"]`, el).find(shown);
    const count = (i) => $$(`[data-node][data-lane="${i}"]:not(.sl-cpt)`, el).length;
    const busy = laneWithNodes(el);
    if (opts.fromWindow && busy != null && bg(busy)) await D.point(bg(busy), "Here is its lane: the shape you drew is now these nodes.", 2600);
    // the work is shown on the lane with the most room: the fewest nodes, so lines are long enough to bend
    const lanes = $$("rect.sl-bg", el).map((r) => Number(r.dataset.lane)).filter((i) => bg(i));
    let lane = lanes.sort((a, b) => count(a) - count(b))[0];
    if (lane == null || !bg(lane)) return D.say("There is no lane on the timeline yet. Put a curiosity on it with its + first.", 2600);
    const nodes = () => $$(`[data-node][data-lane="${lane}"]:not(.sl-cpt)`, el).filter(shown);
    const inLane = (p) => {
      const r = bg(lane) && bg(lane).getBoundingClientRect();
      return r && p.y >= r.top - 2 && p.y <= r.bottom + 2;
    };
    const segs = () => $$("[data-seg]", el).filter((s) => s.getBoundingClientRect().width > 4) /* a flat line is 0 high */.map((s) => ({ s, p: segMid(s), w: s.getBoundingClientRect().width })).filter((x) => inLane(x.p));
    // the longest line has room between its nodes for a curve (two nodes on neighbouring moments have none)
    const longest = () => segs().sort((a, b) => b.w - a.w)[0];
    await D.point(bg(lane), "This is a lane: one curiosity over the whole film, left to right. The dots are nodes, and the lines between them are how it moves from one moment to the next.", null);
    const lr = bg(lane).getBoundingClientRect();
    if (lr.height < 90) {
      await D.say("Hold Alt (Option) and scroll over the lanes to make them taller.", 1800);
      await D.wheel(bg(lane), -25, Math.min(6, Math.ceil(Math.log(110 / Math.max(10, lr.height)) / 0.25)), { alt: true });
    }
    // up or down, toward the side of the lane with more room, so the move is never "as far as it goes"
    // (amount is a share of the lane's height, so a move always crosses at least one step of the scale)
    const roomy = (p, amount) => {
      const r = bg(lane).getBoundingClientRect();
      return (p.y > r.top + r.height / 2 ? -1 : 1) * amount * r.height;
    };
    if (nodes().length < 2) {
      await D.say("Click an empty spot on a lane to put a node there.", 1600);
      await D.click(bg(lane), { fx: 0.06, fy: 0.75, after: 600 });
      if (nodes().length < 2) await D.click(bg(lane), { fx: 0.94, fy: 0.25, after: 600 });
    }
    const n0 = nodes()[nodes().length - 1];
    if (n0) {
      await D.say("Drag a node up or down to change it at that moment. Sideways moves it in time.", 1800);
      // away from the first node's height, so the line between them gets steeper, never flat
      const c = n0.getBoundingClientRect();
      const f = nodes()[0].getBoundingClientRect();
      const r = bg(lane).getBoundingClientRect();
      const dy = (c.top <= f.top ? -1 : 1) * 0.3 * r.height;
      const room = dy < 0 ? c.top - r.top : r.bottom - c.bottom;
      await D.drag(n0, { dx: 0, dy: Math.abs(dy) > room ? -dy : dy }, { ms: 900, after: 600 });
    }
    let sg = longest();
    if (sg) {
      await D.say("Click on a line to add a node on it.", 1500);
      await D.click(sg.p, { after: 700 });
    }
    sg = longest();
    if (sg) {
      await D.say("Drag a line and both of its nodes move together.", 1500);
      await D.drag(sg.p, { dx: 0, dy: roomy(sg.p, 0.3) }, { ms: 900, after: 600 });
    }
    sg = longest();
    if (sg) {
      await D.say("Hold Alt (Option on a Mac) and drag a line to bend it into a curve. Up bows it up, down bows it down.", null);
      await D.drag(sg.p, { dx: 0, dy: roomy(sg.p, 0.35) }, { alt: true, ms: 1300, after: 900 });
    }
    sg = longest();
    if (sg) {
      await D.say("Right-click a line for its menu. Curves… shapes its bend exactly.", 1900);
      await D.right(sg.p, { after: 500 });
      const item = await D.waitFor(() => $$('.sl-pop [data-m="curves"]', el).find(shown), 1500);
      if (item) await D.click(item, { after: 600 });
      const pop = await D.waitFor(() => $$(".sl-curves", el).find(shown), 1500);
      if (pop) {
        const smooth = $$("button[data-shape]", pop).find((b) => /^smooth$/i.test(textOf(b)) && shown(b));
        if (smooth) {
          await D.say("Pick the kind of curve: Smooth eases out of one node and into the next.", 1800);
          await D.click(smooth, { after: 500 });
        }
        const bend = $$('input[type="range"]', pop).find(shown);
        if (bend) {
          await D.say("More bend, a stronger curve.", 1200);
          await D.slide(bend, Number(bend.max || 100) * 0.9, 1400);
        }
        const close = $$('[data-l="apply"]:not(:disabled), [data-l="cancel"]', pop).find(shown);
        if (close) await D.click(close, { after: 700 });
      } else {
        const shut = $$('.sl-pop [data-m="close"]', el).find(shown);
        if (shut) await D.click(shut, { after: 400 });
      }
    }
    const last = nodes()[0];
    if (last) {
      await D.say("Double-click a node to take it away.", 1500);
      await D.dbl(last, { after: 700 });
    }
    await D.say("Every one of those changes is one undo step: ⌘Z (Ctrl+Z) takes it back.", 2600);
  }

  D.add("map", { label: "Show me: the 3D curiosity map", about: "zoom, corridors, a full turn, inside a cube", run: mapTour, ready: () => !!(root.CurioRelations || root.CurioRelationsLoad) });
  D.add("window", { label: "Show me: a curiosity window", about: "choices, knobs, sliders, presets, then its lane", run: windowTour, ready: () => !!root.CurioScreen });
  D.add("lanes", { label: "Show me: nodes and lines", about: "add, drag, bend into a curve, remove", run: lanesTour, ready: () => !!root.CurioScreen });

  /* ---------- the Show me buttons ---------- */
  function showBtn(onClick, title) {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "cd-show";
    b.dataset.cdShow = "1";
    b.textContent = "▶";
    b.setAttribute("aria-label", "Show me");
    b.title = title;
    b.style.cssText = "font:600 11px/1 system-ui,sans-serif;padding:3px 6px;margin:0 2px;border-radius:6px;border:1px solid #ffd23f;background:transparent;color:inherit;cursor:pointer;white-space:nowrap;flex:none";
    // the title bar drags the window: a press here is a click, not the start of a drag
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("mousedown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      if (D.running()) return D.stop();
      onClick();
    });
    return b;
  }
  function wire() {
    HEADS.forEach((sel) =>
      $$(sel).forEach((h) => {
        if ($(":scope > .cd-show", h)) return;
        const win = winOf(h);
        const b = showBtn(() => D.run("window", { win, lanes: win.matches(".sc-win") }), "Watch this window being used: its controls move by themselves, with a caption saying what each does");
        const close = $(":scope > [data-win-close], :scope > [data-cat=close], :scope > button:last-child", h);
        if (close) h.insertBefore(b, close);
        else h.appendChild(b);
      })
    );
    const rl = $(".rl-overlay .rl-close");
    if (rl && !$(".cd-show", rl.parentElement)) rl.parentElement.insertBefore(showBtn(() => D.run("map"), "Watch the 3D map being used: zoom, corridors, a full turn, inside a cube"), rl);
    const menu = $(".cw-menu");
    if (menu && !$("[data-cd-tour]", menu)) {
      D.list().forEach((t) => {
        const b = doc.createElement("button");
        b.type = "button";
        b.setAttribute("role", "menuitem");
        b.dataset.cdTour = t.id;
        b.innerHTML = `${t.label}<small>${t.about}</small>`;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          menu.hidden = true;
          D.run(t.id);
        });
        menu.appendChild(b);
      });
    }
  }
  let queued = false;
  function soon() {
    if (queued) return;
    queued = true;
    (root.requestAnimationFrame || setTimeout)(() => {
      queued = false;
      wire();
    });
  }
  function start() {
    wire();
    if (root.MutationObserver) new MutationObserver(soon).observe(doc.body, { childList: true, subtree: true });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof window !== "undefined" ? window : globalThis);
