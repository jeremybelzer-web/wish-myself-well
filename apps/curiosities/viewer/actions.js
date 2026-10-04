/* viewer/actions.js: Control+click a thing in the Viewer (Jeremy, 2026-10-04 20:16Z).
   - Control+drag a thing spins it: left and right turns it around, up and down tips it forward or back.
     Hold Shift to spin in the turn steps from Draw & build. (Control+drag on empty space still slides you
     through the world, as before.)
   - Control+click a thing (or right-click it) opens a menu of things it can do:
     people (lie down, get up, run, climb, swim, jumping jacks, push-ups, eat ...), animals (sit, sleep, jump,
     fly away ...) and things (crumble to the ground, catch fire, get trampled, break apart ...).
   An action starts in the panel you are on and stays for the rest of the film; the film glides into it from the
   panel before, like any move. "Back to normal" in a later panel ends it. Everything an action changes is a
   number or a word kept per panel (tilt, roll, fx, fxAmt, pose, lift), so the Draw & build windows can
   automate it panel by panel.
   Needs viewer/viewer.js (CurioViewer.addPose, onParts) and viewer/build.js, which calls CurioActions.down
   from its pointer handler. API: window.CurioActions = { down, menuFor, apply, list }. */
(function () {
  if (window.CurioActions) return;
  const V = window.CurioViewer;
  if (!V || !V.addPose || !V.onParts) return;
  const DEG = Math.PI / 180;
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const L = () => V.live();
  const obj = (id) => L().film.objects.find((o) => o.id === id);
  const r2 = (v) => Math.round(v * 100) / 100;

  /* ---------- new poses for people ---------- */
  const sin = Math.sin;
  V.addPose("run", "Running", (ph) => {
    const s = sin(ph * 2) * 55;
    return { legA: s, legB: -s, armA: -s, armB: s, drop: Math.abs(sin(ph * 2)) * 0.06 };
  }, true);
  V.addPose("climb", "Climbing", (ph) => {
    const s = sin(ph * 1.2) * 30;
    return { legA: -40 + s, legB: -40 - s, armA: -160 + s, armB: -160 - s };
  }, true);
  V.addPose("swim", "Swimming", (ph) => {
    const s = sin(ph * 1.5);
    return { legA: s * 20, legB: -s * 20, armA: -90 + s * 80, armB: -90 - s * 80 };
  }, true);
  V.addPose("jacks", "Jumping jacks", (ph) => {
    const k = (sin(ph * 2) + 1) / 2;
    return { wave: 20 + k * 150, waveL: 20 + k * 150, drop: k * 0.12 };
  }, true);
  V.addPose("pushup", "Push-ups", (ph) => ({ armA: -90, armB: -90, drop: (sin(ph * 1.5) + 1) * 0.06 }), true);
  V.addPose("eat", "Eating", (ph) => ({ armA: -135 + sin(ph * 1.6) * 12, armB: -30 }));
  V.addPose("lie", "Lying down", () => ({}));
  V.addPose("dance", "Dancing", (ph) => {
    const s = sin(ph * 2);
    return { legA: s * 25, legB: -s * 25, wave: 90 + s * 60, waveL: 90 - s * 60, drop: Math.abs(s) * 0.08 };
  }, true);
  V.addPose("cheer", "Cheering", (ph) => ({ wave: 160 + sin(ph * 3) * 10, waveL: 160 - sin(ph * 3) * 10, drop: Math.abs(sin(ph * 2)) * 0.1 }));
  V.addPose("shrug", "Shrugging", () => ({ wave: 35, waveL: 35, armA: -40, armB: -40 }));

  /* ---------- effects drawn into a thing's parts: fire, crumble, break apart, spin, bob, sleep ---------- */
  const rnd = (i, k) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  function extent(parts) {
    let top = 0.3;
    let rad = 0.2;
    parts.forEach((p) => {
      const a = p.at || [0, 0, 0];
      const h = p.box ? p.box[1] / 2 : p.ball ? p.ball : p.cyl ? p.cyl[1] / 2 : 0.15;
      const w = p.box ? Math.max(p.box[0], p.box[2]) / 2 : p.ball || (p.cyl ? p.cyl[0] : 0.15);
      top = Math.max(top, a[1] + h);
      rad = Math.max(rad, Math.hypot(a[0], a[2]) + w);
    });
    return { top, rad: Math.min(rad, 6) };
  }
  function turnPartY(p, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const ry = (q) => q && [q[0] * c + q[2] * s, q[1], -q[0] * s + q[2] * c];
    return Object.assign({}, p, { at: ry(p.at || [0, 0, 0]), pivot: p.pivot ? ry(p.pivot) : undefined, ry: (p.ry || 0) + a / DEG });
  }
  V.onParts((parts, def, place, phase) => {
    let out = parts;
    if (place.color && typeof place.color === "string" && /^#[0-9a-f]{6}$/i.test(place.color)) {
      /* a color for this panel (the Properties window): the thing's main color changes, the rest stays */
      const main = (def.color || "").toLowerCase();
      out = out.map((p) => ((p.color || "").toLowerCase() === main ? Object.assign({}, p, { color: place.color }) : p));
    }
    const fx = place.fx;
    const a = Math.max(0, Math.min(1, place.fxAmt == null ? 1 : place.fxAmt));
    const ph = phase || 0;
    if (!fx || a <= 0.001) return out;
    if (fx === "crumble") {
      out = out.map((p, i) => {
        const at = p.at || [0, 0, 0];
        const q = Object.assign({}, p, { at: [at[0] * (1 + 0.5 * a) + (rnd(i, 1) - 0.5) * a * 0.6, Math.max(0.05, at[1] * (1 - 0.88 * a)), at[2] * (1 + 0.5 * a) + (rnd(i, 2) - 0.5) * a * 0.6], rx: (p.rx || 0) + (rnd(i, 3) - 0.5) * 70 * a, rz: (p.rz || 0) + (rnd(i, 4) - 0.5) * 70 * a });
        if (q.pivot) q.pivot = null;
        return q;
      });
      if (a > 0.3) for (let i = 0; i < 6; i++) out.push({ box: [0.12 + rnd(i, 5) * 0.2, 0.08, 0.12 + rnd(i, 6) * 0.2], at: [(rnd(i, 7) - 0.5) * 1.6, 0.04, (rnd(i, 8) - 0.5) * 1.6], ry: rnd(i, 9) * 90, color: "#6d6862" });
      return out;
    }
    if (fx === "apart") {
      return out.map((p, i) => {
        const at = p.at || [0, 0, 0];
        const d = Math.hypot(at[0], at[2]) || 0.2;
        const k = a * (0.6 + rnd(i, 1) * 0.9);
        const dir = d > 0.05 ? [at[0] / d, at[2] / d] : [Math.cos(i * 2.4), Math.sin(i * 2.4)];
        return Object.assign({}, p, { at: [at[0] + dir[0] * k, at[1] + rnd(i, 2) * 0.4 * a, at[2] + dir[1] * k], pivot: null, rx: (p.rx || 0) + (rnd(i, 3) - 0.5) * 120 * a, rz: (p.rz || 0) + (rnd(i, 4) - 0.5) * 120 * a });
      });
    }
    if (fx === "fire") {
      const { top, rad } = extent(out);
      const n = 5 + Math.round(rad * 4);
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + rnd(i, 1);
        const rr = rad * (0.25 + rnd(i, 2) * 0.55);
        const fl = 0.75 + 0.25 * Math.sin(ph * 4 + i * 1.7);
        const h = (0.5 + rnd(i, 3) * 0.7) * a * fl * Math.max(0.8, rad);
        const y = top * (0.4 + rnd(i, 4) * 0.6);
        out.push({ cone: [0.16 * a + rnd(i, 5) * 0.12, h], at: [Math.cos(ang) * rr, y, Math.sin(ang) * rr], color: i % 3 ? "#ff7a1a" : "#ffd23a", glow: true });
      }
      out.push({ cone: [rad * 0.35 * a, 0.9 * a * Math.max(0.6, rad)], at: [0, top * 0.85, 0], color: "#ffb02e", glow: true });
      return out;
    }
    if (fx === "spin") return out.map((p) => turnPartY(p, ph * 1.4 * a));
    if (fx === "shake") return out.map((p) => turnPartY(p, Math.sin(ph * 9) * 0.25 * a));
    if (fx === "bob" || fx === "hop") {
      const h = (fx === "hop" ? 0.45 : 0.08) * a * Math.abs(Math.sin(ph * (fx === "hop" ? 1.5 : 3)));
      return out.map((p) => Object.assign({}, p, { at: [(p.at || [0, 0, 0])[0], (p.at || [0, 0, 0])[1] + h, (p.at || [0, 0, 0])[2]], pivot: p.pivot ? [p.pivot[0], p.pivot[1] + h, p.pivot[2]] : p.pivot }));
    }
    if (fx === "sleep") {
      const { top } = extent(out);
      out.push({ text: Math.sin(ph) > 0 ? "z z Z" : "z Z z", at: [0.2, top + 0.35, 0], size: 0.22 * a, face: true, color: "#e8f0ff" });
      return out;
    }
    if (fx === "smoke") {
      const { top } = extent(out);
      for (let i = 0; i < 4; i++) out.push({ ball: 0.12 + i * 0.06, at: [Math.sin(ph + i) * 0.1, top + 0.2 + i * 0.25 + ((ph * 0.2) % 0.25), 0], color: "#9a9aa2" });
      return out;
    }
    return out;
  });

  /* ---------- what each kind of thing can do ---------- */
  const NORMAL = { tilt: 0, roll: 0, fx: null, fxAmt: 0, pivotY: 0, lift: 0, sy: 1, sx: 1, sz: 1 };
  /* each action: [id, label, what it does (plain words), patch for the panel] */
  const PEOPLE = [
    ["stand", "Stand", "Stands up straight.", Object.assign({}, NORMAL, { pose: "stand" })],
    ["getup", "Get up", "Gets up off the ground and stands.", Object.assign({}, NORMAL, { pose: "stand" })],
    ["lie", "Lie down", "Lies on their back.", { pose: "lie", tilt: -90, roll: 0, lift: 0.14, fx: null }],
    ["fall", "Fall over", "Falls flat on their face.", { pose: "stand", tilt: 90, roll: 0, lift: 0.14, fx: null }],
    ["sit", "Sit down", "Sits.", { pose: "sit", tilt: 0, roll: 0, lift: 0 }],
    ["walk", "Walk", "Walks in place (moving them in the next panel makes them walk there).", { pose: "walk", tilt: 0, roll: 0, lift: 0 }],
    ["run", "Run", "Runs, arms pumping.", { pose: "run", tilt: 0, roll: 0, lift: 0 }],
    ["climb", "Climb", "Climbs, hand over hand.", { pose: "climb", tilt: 0, roll: 0, lift: 0 }],
    ["swim", "Swim", "Lies flat and swims.", { pose: "swim", tilt: 80, roll: 0, lift: 0.35 }],
    ["jacks", "Jumping jacks", "Arms up and down, bouncing.", { pose: "jacks", tilt: 0, roll: 0, lift: 0 }],
    ["pushup", "Push-ups", "Face down on their hands, going up and down.", { pose: "pushup", tilt: 75, roll: 0, lift: 0.17 }],
    ["eat", "Eat", "Hand to mouth, chewing.", { pose: "eat", tilt: 0, roll: 0, lift: 0 }],
    ["wave", "Wave", "Waves hello.", { pose: "wave", tilt: 0, roll: 0, lift: 0 }],
    ["reach", "Reach out", "Both arms forward.", { pose: "reach", tilt: 0, roll: 0, lift: 0 }],
    ["dance", "Dance", "Dances.", { pose: "dance", tilt: 0, roll: 0, lift: 0 }],
    ["cheer", "Cheer", "Both arms up, bouncing.", { pose: "cheer", tilt: 0, roll: 0, lift: 0 }],
    ["shrug", "Shrug", "Who knows?", { pose: "shrug", tilt: 0, roll: 0, lift: 0 }],
    ["sleep", "Sleep", "Lies down and snores.", { pose: "lie", tilt: -90, roll: 0, lift: 0.14, fx: "sleep", fxAmt: 1 }],
    ["fire", "Catch fire", "Flames all over (a stunt, in a cartoon).", { fx: "fire", fxAmt: 1 }],
  ];
  const ANIMALS = [
    ["stand", "Stand", "Stands normally.", Object.assign({}, NORMAL)],
    ["walk", "Walk", "Bobs along (move it in the next panel to make it travel).", { fx: "bob", fxAmt: 1, tilt: 0, roll: 0, lift: 0 }],
    ["run", "Run", "Bounds along, fast.", { fx: "hop", fxAmt: 0.6, tilt: -8, roll: 0, lift: 0 }],
    ["jump", "Jump", "Leaps up and down.", { fx: "hop", fxAmt: 1.6, tilt: 0, roll: 0, lift: 0 }],
    ["sit", "Sit", "Sits back on its haunches.", { tilt: -25, roll: 0, sy: 0.85, lift: 0 }],
    ["lie", "Lie down", "Lies on its side.", { roll: 90, tilt: 0, lift: 0.15, fx: null }],
    ["sleep", "Sleep", "Curls up and snores.", { roll: 90, tilt: 0, lift: 0.15, fx: "sleep", fxAmt: 1 }],
    ["eat", "Eat", "Head down, eating.", { tilt: 25, roll: 0, fx: "bob", fxAmt: 0.5, lift: 0 }],
    ["chase", "Chase its tail", "Spins in circles.", { fx: "spin", fxAmt: 1, tilt: 0, roll: 0 }],
    ["shake", "Shake off", "Shakes off water.", { fx: "shake", fxAmt: 1 }],
    ["swim", "Swim", "Paddles in the water.", { fx: "bob", fxAmt: 0.6, lift: 0, tilt: 0 }],
    ["fly", "Fly away", "Flies up and away (glides there from the panel before).", { lift: 4, fx: "bob", fxAmt: 0.5 }],
    ["land", "Land", "Comes back down.", { lift: 0, fx: null }],
    ["roll", "Roll over", "Rolls onto its back.", { roll: 180, lift: 0.3 }],
    ["trampled", "Get trampled", "Squashed flat (cartoon style).", { sy: 0.15, sx: 1.35, sz: 1.35, fx: null }],
  ];
  const THINGS = [
    ["normal", "Back to normal", "Whole, upright and not on fire.", Object.assign({}, NORMAL)],
    ["crumble", "Crumble to the ground", "Falls to pieces in a heap.", { fx: "crumble", fxAmt: 1 }],
    ["fire", "Catch fire", "Flames all over it.", { fx: "fire", fxAmt: 1 }],
    ["smoke", "Smoke", "A thin line of smoke.", { fx: "smoke", fxAmt: 1 }],
    ["trampled", "Get trampled", "Squashed flat.", { sy: 0.15, sx: 1.35, sz: 1.35 }],
    ["apart", "Break apart", "Its pieces fly away from each other.", { fx: "apart", fxAmt: 1 }],
    ["fall", "Fall over", "Tips over onto its side.", { roll: 90, tilt: 0, lift: 0 }],
    ["upside", "Turn upside down", "Flips over.", { roll: 180, lift: 0 }],
    ["melt", "Melt", "Slumps into a puddle.", { sy: 0.25, sx: 1.5, sz: 1.5 }],
    ["float", "Float away", "Rises up into the air.", { lift: 3 }],
    ["drop", "Drop", "Back down on the ground.", { lift: 0 }],
    ["spin", "Spin", "Keeps spinning.", { fx: "spin", fxAmt: 1 }],
    ["shake", "Shake", "Rattles in place.", { fx: "shake", fxAmt: 1 }],
    ["grow", "Grow", "Twice as big.", { size: 2 }],
    ["shrink", "Shrink", "Half as big.", { size: 0.5 }],
  ];
  const ANIMAL_ITEMS = () => {
    const O = window.CurioObjects;
    return O ? O.items.filter((i) => i.type === "Animals").map((i) => i.id) : [];
  };
  function kindOf(o) {
    if (!o) return "thing";
    if (o.kind === "person") return "person";
    if (o.item && ANIMAL_ITEMS().includes(o.item)) return "animal";
    return "thing";
  }
  function menuFor(o) {
    const k = kindOf(o);
    return { kind: k, list: k === "person" ? PEOPLE : k === "animal" ? ANIMALS : THINGS };
  }

  /* apply an action: from the panel you are on to the end of the film */
  function apply(ids, actId, opts) {
    const lv = L();
    const film = lv.film;
    const from = film.panels.indexOf(lv.panel);
    const only = opts && opts.only;
    V.edit("action-" + actId);
    (Array.isArray(ids) ? ids : [ids]).forEach((id) => {
      const o = obj(id);
      if (!o) return;
      const m = menuFor(o);
      const act = m.list.find((a) => a[0] === actId);
      if (!act) return;
      const patch = act[3];
      const prev = film.panels[from - 1] && film.panels[from - 1].place[id];
      const base = lv.panel.place[id];
      if (!base) return;
      /* the ground it stands on: where it is now, minus any lift from an earlier action */
      const ground = Math.max(0, (base.y || 0) - (base.lift || 0));
      for (let i = from; i < (only ? from + 1 : film.panels.length); i++) {
        const pl = film.panels[i].place[id];
        if (!pl) continue;
        const g = Math.max(0, (pl.y || 0) - (pl.lift || 0));
        Object.keys(patch).forEach((k) => {
          if (k === "lift") return;
          if (k === "size") {
            /* grow and shrink are from its own size, so pressing Grow twice does not keep doubling it */
            if (pl.sizeBase == null) pl.sizeBase = pl.size || 1;
            pl.size = r2(pl.sizeBase * patch.size);
          }
          else if (patch[k] === null) delete pl[k];
          else pl[k] = patch[k];
        });
        if ("lift" in patch) {
          pl.lift = patch.lift;
          pl.y = r2((i === from ? ground : g) + patch.lift);
        }
        if (actId === "normal" || actId === "stand" || actId === "getup") {
          if (pl.sizeBase) pl.size = pl.sizeBase;
          delete pl.sizeBase;
          delete pl.sizeMul;
          delete pl.fx;
          delete pl.fxAmt;
        }
        pl.act = actId;
      }
      /* the panel before glides into it: an effect grows from nothing */
      if (prev && patch.fx && !prev.fx) {
        prev.fx = patch.fx;
        prev.fxAmt = 0;
      }
    });
    V.changed(true);
  }

  /* ---------- the menu ---------- */
  let menu = null;
  function closeMenu() {
    if (menu) menu.hidden = true;
  }
  function openMenu(o, ids, clientX, clientY) {
    const root = document.querySelector(".cv-root");
    if (!root) return;
    if (!menu) {
      menu = document.createElement("div");
      menu.className = "cva-menu";
      menu.setAttribute("role", "menu");
      root.appendChild(menu);
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("[data-act]");
        if (b) {
          apply(JSON.parse(menu.dataset.ids), b.dataset.act, { only: menu.querySelector("[data-only]").checked });
          closeMenu();
        }
        if (e.target.closest("[data-mclose]")) closeMenu();
      });
      document.addEventListener("pointerdown", (e) => menu && !menu.hidden && !e.target.closest(".cva-menu") && closeMenu(), true);
      document.addEventListener("keydown", (e) => e.key === "Escape" && menu && !menu.hidden && closeMenu());
    }
    const m = menuFor(o);
    const cur = L().panel.place[o.id] || {};
    const n = L().film.panels.indexOf(L().panel) + 1;
    const head = m.kind === "person" ? "What should " + o.name + " do?" : m.kind === "animal" ? "What should the " + o.name.toLowerCase() + " do?" : "What happens to the " + o.name.toLowerCase() + "?";
    menu.dataset.ids = JSON.stringify(ids);
    menu.innerHTML = `<header><b>${esc(head)}</b><button type="button" data-mclose aria-label="Close">×</button></header>
      <div class="cva-list">${m.list.map(([id, label, say]) => `<button type="button" role="menuitem" data-act="${id}" title="${esc(say)}" class="${cur.act === id ? "on" : ""}">${esc(label)}<small>${esc(say)}</small></button>`).join("")}</div>
      <footer><label><input type="checkbox" data-only /> Only panel ${n}</label><span>Starts in panel ${n} and stays for the rest of the film, unless you tick this.</span><span>Control+drag spins it. Shift keeps the turn in steps.</span></footer>`;
    menu.hidden = false;
    const r = root.getBoundingClientRect();
    const w = Math.min(300, r.width - 16);
    menu.style.width = w + "px";
    const x = Math.max(8, Math.min(clientX - r.left + 6, r.width - w - 8));
    menu.style.left = x + "px";
    menu.style.top = "0px";
    const h = menu.offsetHeight;
    menu.style.top = Math.max(8, Math.min(clientY - r.top + 6, r.height - h - 8)) + "px";
  }

  /* ---------- Control+drag spins, Control+click opens the menu ---------- */
  let drag = null;
  const stepOf = () => {
    const B = window.CurioBuild;
    const s = B && B.settings ? B.settings() : {};
    return s.turnSnap || 15;
  };
  function down(e, o, ids) {
    const pt = [e.clientX, e.clientY];
    const starts = {};
    ids.forEach((id) => {
      const pl = L().panel.place[id];
      if (pl) starts[id] = { turn: pl.turn || 0, tilt: pl.tilt || 0 };
    });
    drag = { o, ids, pt0: pt, starts, moved: false, cx: e.clientX, cy: e.clientY, edited: false };
    return true;
  }
  function move(e) {
    if (!drag) return;
    const pt = [e.clientX, e.clientY];
    const dx = pt[0] - drag.pt0[0];
    const dy = pt[1] - drag.pt0[1];
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.edited) {
      V.edit("spin");
      drag.edited = true;
    }
    drag.moved = true;
    const st = stepOf();
    drag.ids.forEach((id) => {
      const pl = L().panel.place[id];
      const s = drag.starts[id];
      if (!pl || !s) return;
      let turn = s.turn + dx * 0.8;
      let tilt = s.tilt + dy * 0.6;
      if (e.shiftKey) {
        turn = Math.round(turn / st) * st;
        tilt = Math.round(tilt / st) * st;
      }
      pl.turn = Math.round((((turn % 360) + 540) % 360) - 180);
      pl.tilt = Math.round((((tilt % 360) + 540) % 360) - 180);
      if (!pl.tilt) delete pl.tilt;
    });
    V.changed(false);
  }
  function up(e) {
    const d = drag;
    drag = null;
    if (!d) return;
    if (!d.moved) openMenu(d.o, d.ids, d.cx, d.cy);
    else V.changed(true);
  }

  const CSS = `
.cva-menu { position: absolute; z-index: 60; background: #1b1c21; border: 1px solid #3a3b44; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.55); color: #e8e8ec; font-size: 13px; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; max-height: min(520px, 80%); }
.cva-menu[hidden] { display: none; }
.cva-menu header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-bottom: 1px solid #2e2f36; }
.cva-menu header button { all: unset; cursor: pointer; font-size: 18px; padding: 0 4px; color: #9b9ba3; }
.cva-list { overflow: auto; padding: 4px; display: grid; gap: 2px; }
.cva-list button { all: unset; box-sizing: border-box; cursor: pointer; display: grid; padding: 5px 8px; border-radius: 6px; }
.cva-list button small { color: #9b9ba3; font-size: 11px; }
.cva-list button:hover, .cva-list button:focus-visible { background: #2a2c34; }
.cva-list button.on { background: #12414a; }
.cva-menu footer { display: grid; gap: 2px; padding: 6px 10px 8px; border-top: 1px solid #2e2f36; color: #9b9ba3; font-size: 11px; }
.cva-menu footer label { color: #e8e8ec; font-size: 12px; display: flex; gap: 6px; align-items: center; }
`;
  if (!document.getElementById("cva-style")) {
    const st = document.createElement("style");
    st.id = "cva-style";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  window.CurioActions = {
    down,
    move,
    up,
    busy: () => !!drag,
    menuFor: (id) => {
      const o = obj(id);
      return o ? { kind: menuFor(o).kind, actions: menuFor(o).list.map((a) => ({ id: a[0], label: a[1], say: a[2] })) } : null;
    },
    open: (id, x, y) => {
      const o = obj(id);
      if (o) openMenu(o, [id], x || 200, y || 200);
    },
    close: closeMenu,
    apply,
    list: { people: PEOPLE.map((a) => a[1]), animals: ANIMALS.map((a) => a[1]), things: THINGS.map((a) => a[1]) },
  };
})();
