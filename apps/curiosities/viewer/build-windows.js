/* viewer/build-windows.js: the build windows of Roblox Studio, The Sims and Fortnite Creative, one per curiosity
   (Jeremy, 2026-10-04 20:16Z: "Copy their user interfaces ... except have each window have a drop down menu at
   the top of which curiosity is selected ... each parameter in that window should be an automatable curiosity ...
   as many instances of that window as we have defined curiosities").

   Three windows float over the Viewer, laid out the way those apps lay theirs out (their arrangement and the
   names of their controls, drawn in this app's own plain style, no artwork of theirs):
   - Roblox Studio's Properties: a filter box, then Data, Appearance, Transform, Behavior and Action sections for
     the picked thing, one row per property.
   - The Sims' Build Mode: the tool strip (Hand, Wall, Room, Sledgehammer, Design tool, turn 45°), the catalog
     by function (walls, floors, roofs, stairs) and by room, and the Design swatches for the picked thing.
   - Fortnite Creative: the Prefabs & Galleries, Building (with Wood, Brick, Metal) and Phone tabs (grab, copy,
     paste, delete, rotate, push, pull, raise, lower, drop, grid snap), with a quick bar of what you placed.
   Every window has a Curiosity menu at the top. "All of this window" shows everything; picking a curiosity shows
   that curiosity's own setting for each panel (kept in panel.v, which Front and center reads), then the
   window's settings that belong to that curiosity, then the rest folded away. ⧉ opens another copy of the same
   window, so there can be one per curiosity.

   Automation: every setting of a thing has a ◇ (CapCut's keyframe button). ◇ hollow: the setting is the same in
   every panel, and changing it changes them all. Press ◇ and it turns ◆: the setting is automated, it keeps its
   own value in each panel, and a lane opens under it with one dot per panel. On the lane (Ableton's gestures):
   drag a dot up or down to change that panel, click a dot to go to that panel, double-click a dot to give it the
   panel before's value. Pressing ◆ again makes the setting the same everywhere again (undo brings it back).
   Tool settings (grid snap, wall height) are how you build, not part of the film, so they have no lane.

   Needs viewer/viewer.js, viewer/build.js (window.CurioBuild) and viewer/actions.js. Open windows are kept in
   localStorage curiosities-build-windows-v1. API: window.CurioBuildWindows = { open, close, list, slot, params }. */
(function () {
  if (window.CurioBuildWindows) return;
  const V = window.CurioViewer;
  if (!V || !window.CurioBuild) return;
  const B = () => window.CurioBuild;
  const KEY = "curiosities-build-windows-v1";
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const L = () => V.live();
  const film = () => L().film;
  const obj = (id) => film().objects.find((o) => o.id === id);
  const picked = () => {
    const f = film();
    return f.sel ? obj(f.sel) : null;
  };
  const curIndex = () => film().panels.indexOf(L().panel);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r3 = (v) => Math.round(v * 1000) / 1000;
  function seekPanel(i) {
    const P = film().panels;
    let t = 0;
    for (let k = 0; k < i && k < P.length; k++) t += P[k].sec || 0;
    V.seek(t + 0.001);
  }
  const allCur = () => (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : window.CURIOSITIES || []);
  let curMap = null;
  const curById = (id) => {
    if (!curMap) {
      curMap = {};
      allCur().forEach((c) => (curMap[c.id] = c));
    }
    return curMap[id] || null;
  };

  /* ---------- the settings ---------- */
  const POSE_OPTS = [["stand", "Standing"], ["walk", "Walking"], ["run", "Running"], ["sit", "Sitting"], ["reach", "Reaching out"], ["wave", "Waving"], ["lie", "Lying down"], ["climb", "Climbing"], ["swim", "Swimming"], ["jacks", "Jumping jacks"], ["pushup", "Push-ups"], ["eat", "Eating"], ["dance", "Dancing"], ["cheer", "Cheering"], ["shrug", "Shrugging"]];
  const MATS = () => B().materials || {};
  /* a thing's main color in this panel */
  const colorOf = (o, pl) => (pl && pl.color) || o.color || "#888888";
  const isPerson = (o) => !!o && o.kind === "person";
  const LKS = () => window.CurioWear;
  const lookGet = (o, pl, k) => (LKS() ? LKS().resolve(pl, o)[k] : (pl.lookParts || {})[k]);
  const lookPut = (pl, k, v) => {
    pl.lookParts = Object.assign({}, pl.lookParts, { [k]: v });
  };
  const lookSel = (k, label, tags) => ({ id: "look." + k, label, sec: "Character", kind: "select", scope: "place", apps: ["roblox", "sims"], only: isPerson, opts: () => (LKS() ? LKS().OPTS[k] : []), get: (o, pl) => lookGet(o, pl, k) || "", set: (o, pl, v) => lookPut(pl, k, v), tags });
  const lookCol = (k, label, tags) => ({ id: "look." + k, label, sec: "Character", kind: "color", scope: "place", apps: ["roblox", "sims"], only: isPerson, get: (o, pl) => lookGet(o, pl, k) || "#888888", set: (o, pl, v) => lookPut(pl, k, v), tags });
  const lookNum = (k, label, min, max, tags, say) => ({ id: "look." + k, label, sec: "Character", kind: "num", scope: "place", apps: ["roblox", "sims"], only: isPerson, min, max, step: 0.02, unit: "×", get: (o, pl) => Number(lookGet(o, pl, k)) || 1, set: (o, pl, v) => lookPut(pl, k, r3(clamp(v, min, max))), tags, say });
  /* each: id, label, sec (Roblox section), kind (num, select, color, bool, text), get, set, tags (the curiosities it
     belongs to), apps (which windows show it), scope: "place" (per panel, automatable), "object" (the thing
     itself, the same in every panel) */
  const P = [
    { id: "name", label: "Name", sec: "Data", kind: "text", scope: "object", apps: ["roblox"], get: (o) => o.name, set: (o, pl, v) => (o.name = String(v).slice(0, 40) || o.name), tags: [] },
    { id: "color", label: "Color", sec: "Appearance", kind: "color", scope: "place", apps: ["roblox", "sims"], get: (o, pl) => colorOf(o, pl), set: (o, pl, v) => (pl.color = v), tags: ["palette", "saturation", "colorRange", "colorAccent", "colorCount", "filterHue", "setBrightness", "colorDrift", "mainSetMatch"], say: "Its main color in this panel." },
    { id: "mat", label: "Material", sec: "Appearance", kind: "select", scope: "place", apps: ["roblox", "sims", "fortnite"], opts: () => [["", "Its own"]].concat(Object.keys(MATS()).map((k) => [k, MATS()[k][0]])), get: (o, pl) => pl.mat || "", set: (o, pl, v) => {
        if (!v) {
          delete pl.mat;
          delete pl.color;
        } else {
          pl.mat = v;
          pl.color = MATS()[v][1];
        }
      }, tags: ["setMaterial", "setStyle", "setUpkeep"], say: "What it is made of: wood, brick, metal, stone or paint." },
    { id: "glass", label: "See-through", sec: "Appearance", kind: "bool", scope: "place", apps: ["roblox"], get: (o, pl) => !!pl.glass, set: (o, pl, v) => (v ? (pl.glass = 1) : delete pl.glass), tags: ["contrast", "setDepth"], say: "Like glass (Roblox's Transparency)." },
    { id: "glow", label: "Glows", sec: "Appearance", kind: "bool", scope: "place", apps: ["roblox"], get: (o, pl) => !!pl.glow, set: (o, pl, v) => (v ? (pl.glow = 1) : delete pl.glow), tags: ["key", "lighting", "colorAccent", "timeOfDay"], say: "Lit from inside, like a lamp (Roblox's Neon material)." },
    { id: "x", label: "Position, left and right", short: "X", sec: "Transform", kind: "num", scope: "place", apps: ["roblox", "fortnite"], min: -30, max: 30, step: 0.05, unit: " m", get: (o, pl) => pl.x || 0, set: (o, pl, v) => (pl.x = r3(v)), tags: ["blocking", "characterPath", "objectPath", "setLayout"] },
    { id: "y", label: "Position, height", short: "Y", sec: "Transform", kind: "num", scope: "place", apps: ["roblox", "fortnite"], min: 0, max: 15, step: 0.05, unit: " m", get: (o, pl) => pl.y || 0, set: (o, pl, v) => (pl.y = r3(Math.max(0, v))), tags: ["objectPath", "angleHeight"] },
    { id: "z", label: "Position, near and far", short: "Z", sec: "Transform", kind: "num", scope: "place", apps: ["roblox", "fortnite"], min: -30, max: 30, step: 0.05, unit: " m", get: (o, pl) => pl.z || 0, set: (o, pl, v) => (pl.z = r3(v)), tags: ["blocking", "characterToLens", "setDepth", "setLayout"] },
    { id: "turn", label: "Orientation, turn", sec: "Transform", kind: "num", scope: "place", apps: ["roblox", "sims", "fortnite"], min: -180, max: 180, step: 1, unit: "°", get: (o, pl) => pl.turn || 0, set: (o, pl, v) => (pl.turn = Math.round(v)), tags: ["eyeline", "characterToLens", "blocking", "look"] },
    { id: "tilt", label: "Orientation, tip forward or back", sec: "Transform", kind: "num", scope: "place", apps: ["roblox"], min: -180, max: 180, step: 1, unit: "°", get: (o, pl) => pl.tilt || 0, set: (o, pl, v) => (v ? (pl.tilt = Math.round(v)) : delete pl.tilt), tags: ["dutch", "gesture", "emoActions"] },
    { id: "roll", label: "Orientation, lean to the side", sec: "Transform", kind: "num", scope: "place", apps: ["roblox"], min: -180, max: 180, step: 1, unit: "°", get: (o, pl) => pl.roll || 0, set: (o, pl, v) => (v ? (pl.roll = Math.round(v)) : delete pl.roll), tags: ["dutch", "gesture", "emoActions"] },
    { id: "size", label: "Size", sec: "Transform", kind: "num", scope: "place", apps: ["roblox", "fortnite"], min: 0.1, max: 5, step: 0.05, unit: "×", get: (o, pl) => pl.size || 1, set: (o, pl, v) => (pl.size = r3(Math.max(0.05, v))), tags: ["scale", "shotSize", "setDepth"] },
    { id: "sx", label: "Size, wide", sec: "Transform", kind: "num", scope: "place", apps: ["roblox"], min: 0.1, max: 5, step: 0.05, unit: "×", get: (o, pl) => pl.sx || 1, set: (o, pl, v) => (pl.sx = r3(Math.max(0.05, v))), tags: ["scale"] },
    { id: "sy", label: "Size, tall", sec: "Transform", kind: "num", scope: "place", apps: ["roblox"], min: 0.1, max: 5, step: 0.05, unit: "×", get: (o, pl) => pl.sy || 1, set: (o, pl, v) => (pl.sy = r3(Math.max(0.05, v))), tags: ["scale"] },
    { id: "sz", label: "Size, deep", sec: "Transform", kind: "num", scope: "place", apps: ["roblox"], min: 0.1, max: 5, step: 0.05, unit: "×", get: (o, pl) => pl.sz || 1, set: (o, pl, v) => (pl.sz = r3(Math.max(0.05, v))), tags: ["scale"] },
    { id: "show", label: "Visible", sec: "Behavior", kind: "bool", scope: "place", apps: ["roblox", "sims"], get: (o, pl) => pl.show !== false, set: (o, pl, v) => (pl.show = !!v), tags: ["bodyEnter", "objectEnter", "peopleCount", "exit"], say: "Shown in this panel." },
    { id: "locked", label: "Locked", sec: "Behavior", kind: "bool", scope: "object", apps: ["roblox"], get: (o) => !!o.locked, set: (o, pl, v) => (o.locked = !!v), tags: [], say: "Can't be picked or moved by mistake." },
    { id: "pose", label: "Pose", sec: "Action", kind: "select", scope: "place", apps: ["roblox", "sims"], only: (o) => o.kind === "person", opts: () => POSE_OPTS, get: (o, pl) => pl.pose || "stand", set: (o, pl, v) => (pl.pose = v), tags: ["gesture", "stillness", "emoActions", "whoMoves", "characterSpeed"] },
    { id: "act", label: "What it is doing", sec: "Action", kind: "select", scope: "place", apps: ["roblox", "sims", "fortnite"], opts: (o) => {
        const m = window.CurioActions && o && window.CurioActions.menuFor(o.id);
        return [["", "Nothing special"]].concat(m ? m.actions.map((a) => [a.id, a.label]) : []);
      }, get: (o, pl) => pl.act || "", set: null, tags: ["objectPath", "envMotion", "comicBeat", "gesture", "emoActions"], say: "The same list as Control+click on it." },
    { id: "fxAmt", label: "How far along", sec: "Action", kind: "num", scope: "place", apps: ["roblox"], only: (o, pl) => !!(pl && pl.fx), min: 0, max: 1, step: 0.05, unit: "", get: (o, pl) => (pl.fxAmt == null ? 1 : pl.fxAmt), set: (o, pl, v) => (pl.fxAmt = r3(clamp(v, 0, 1))), tags: ["objectPath", "envMotion"], say: "0 is not yet, 1 is all the way (burning, crumbled, broken apart)." },
    /* a person's look (viewer/wear.js): words, then any part changed by hand, panel by panel */
    { id: "rig", label: "Full 3D character", sec: "Character", kind: "bool", scope: "place", apps: ["roblox", "sims"], only: isPerson, get: (o, pl) => (typeof pl.rig === "boolean" ? pl.rig : !!o.rig), set: (o, pl, v) => {
        pl.rig = !!v;
        const RA = window.CurioRigActors;
        if (v && RA && RA.load) Promise.resolve(RA.load()).then(() => V.redraw(), () => {});
      }, tags: ["characterDetail", "mainFit"], say: "Drawn as a full 3D character with a face and joints, instead of blocks." },
    { id: "look", label: "Look in words", sec: "Character", kind: "text", scope: "place", apps: ["roblox", "sims"], only: isPerson, get: (o, pl) => pl.look || "", set: (o, pl, v) => (String(v).trim() ? (pl.look = String(v).trim().slice(0, 200)) : delete pl.look), tags: ["mainEra", "mainFormality", "backEra", "backSameness"], say: "Describe them: spiky red hair, plaid shirt, overalls, boots. The parts below win over the words." },
    lookSel("hair", "Hair", ["mainEra", "mainFormality"]),
    lookCol("hairColor", "Hair color", ["palette", "colorAccent"]),
    lookSel("hat", "Hat", ["mainEra", "mainUtility", "mainFunction"]),
    lookCol("hatColor", "Hat color", ["palette", "colorAccent"]),
    lookSel("top", "Top", ["mainEra", "mainCost", "mainCoverage", "mainFormality"]),
    lookCol("topColor", "Top color", ["palette", "colorAccent", "mainSetMatch"]),
    lookSel("bottom", "Bottom", ["mainEra", "mainCost", "mainCoverage", "mainFormality"]),
    lookCol("bottomColor", "Bottom color", ["palette", "mainSetMatch"]),
    lookSel("feet", "Shoes", ["mainEra", "mainUtility", "mainWear"]),
    lookCol("shoesColor", "Shoe color", ["palette"]),
    lookCol("skin", "Skin", ["skinColorTruth"]),
    lookNum("build", "Build", 0.6, 1.6, ["mainFit", "scale"], "Thin 0.7, everyday 1, strong 1.3, heavy 1.5."),
    lookNum("height", "Height", 0.8, 1.2, ["scale", "characterToLens"], "Short 0.88, everyday 1, tall 1.12."),
    /* stuck to another thing: goes where it goes */
    { id: "pin", label: "Stuck to", sec: "Behavior", kind: "select", scope: "object", apps: ["roblox", "fortnite"], opts: (o) => [["", "Nothing (free)"]].concat(film().objects.filter((x) => o && x.id !== o.id).map((x) => [x.id, x.name])), get: (o) => (o.pin && o.pin.id) || "", set: (o, pl, v) => {
        const LK = window.CurioWear;
        if (!LK) return;
        if (v) LK.pin(o.id, v);
        else LK.unpin(o.id);
      }, tags: ["objectPath", "handProp"], say: "Stick it to another thing (a hat drawn on a person): it moves, turns and grows with it." },
  ];
  const PBY = {};
  P.forEach((p) => (PBY[p.id] = p));

  /* the look of See-through and Glows, as the thing is drawn */
  V.onParts((parts, def, place) => {
    if (!place.glass && !place.glow) return parts;
    return parts.map((p) => Object.assign({}, p, place.glass ? { glass: true } : null, place.glow ? { glow: true } : null));
  });

  /* ---------- changing a setting: the same everywhere, or (◆) only in this panel ---------- */
  const keyed = (o, pid) => !!(o && o.auto && o.auto[pid]);
  function setParam(o, p, v, tag) {
    const f = film();
    const pl = L().panel.place[o.id];
    if (!pl) return;
    V.edit(tag || "bw-" + p.id);
    if (p.id === "act") {
      if (v && window.CurioActions) window.CurioActions.apply(o.id, v, { only: keyed(o, "act") });
      return refresh();
    }
    /* a thing stuck to another, moved by hand here: it stays stuck where it is put */
    const stuck = o.pin && p.sec === "Transform" && LKS();
    if (stuck) LKS().hold([o.id]);
    if (p.scope === "object") p.set(o, pl, v);
    else if (keyed(o, p.id)) p.set(o, pl, v);
    else f.panels.forEach((q) => q.place[o.id] && p.set(o, q.place[o.id], v));
    if (stuck) LKS().release();
    V.changed(true);
  }
  function toggleKey(o, p) {
    V.edit("bw-key-" + p.id);
    o.auto = o.auto || {};
    if (o.auto[p.id]) {
      /* back to one value everywhere: this panel's */
      delete o.auto[p.id];
      if (!Object.keys(o.auto).length) delete o.auto;
      const v = p.get(o, L().panel.place[o.id]);
      if (p.id !== "act") film().panels.forEach((q) => q.place[o.id] && p.set(o, q.place[o.id], v));
    } else o.auto[p.id] = 1;
    V.changed(true);
  }

  /* ---------- a curiosity's own value in each panel (panel.v), read by Front and center ---------- */
  function curScale(c) {
    if (Array.isArray(c.options) && c.options.length) return { kind: "select", opts: c.options.map((o) => [o, o]) };
    const min = c.min != null ? c.min : 0;
    const max = c.max != null ? c.max : 100;
    return { kind: "num", min, max, step: max - min > 20 ? 1 : 0.1, unit: c.max == null ? "%" : "" };
  }
  const curGet = (c, q) => {
    const v = q.v && q.v[c.id];
    if (v != null) return v;
    const sc = curScale(c);
    return c.value != null ? c.value : sc.kind === "select" ? sc.opts[0][0] : sc.min;
  };
  function curSet(c, i, v) {
    const q = film().panels[i];
    q.v = q.v || {};
    q.v[c.id] = v;
  }

  /* ---------- windows ---------- */
  const APPS = {
    roblox: { name: "Properties", from: "Roblox Studio", w: 330, h: 520 },
    sims: { name: "Build Mode", from: "The Sims", w: 560, h: 430 },
    fortnite: { name: "Creative", from: "Fortnite Creative", w: 520, h: 450 },
  };
  let state = { wins: [] };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && Array.isArray(s.wins)) state = s;
  } catch (e) {}
  const saveState = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ wins: state.wins.map((w) => ({ id: w.id, app: w.app, cur: w.cur, x: w.x, y: w.y, w: w.w, h: w.h, tab: w.tab, cat: w.cat, folded: w.folded, quick: w.quick })) }));
    } catch (e) {}
  };
  let nextId = 1;
  let draws = 0;
  state.wins.forEach((w) => (nextId = Math.max(nextId, (w.id || 0) + 1)));
  const els = {};

  function rootEl() {
    return document.querySelector(".cv-root.cv-viewer");
  }
  function open(app, opts) {
    if (!APPS[app]) return null;
    const r = rootEl();
    const n = state.wins.length;
    const w = Object.assign({ id: nextId++, app, cur: "", x: 220 + n * 26, y: 70 + n * 22, w: APPS[app].w, h: APPS[app].h, tab: app === "fortnite" ? "building" : "", cat: app === "sims" ? "Walls" : "", quick: [] }, opts || {});
    if (r) {
      const rr = r.getBoundingClientRect();
      w.w = Math.min(w.w, rr.width - 16);
      w.h = Math.min(w.h, rr.height - 16);
      w.x = clamp(w.x, 8, Math.max(8, rr.width - w.w - 8));
      w.y = clamp(w.y, 8, Math.max(8, rr.height - w.h - 8));
    }
    state.wins.push(w);
    saveState();
    draw(w);
    return w.id;
  }
  function close(id) {
    state.wins = state.wins.filter((w) => w.id !== id);
    if (els[id]) els[id].remove();
    delete els[id];
    saveState();
  }
  function refresh() {
    state.wins.forEach(draw);
  }

  /* the curiosities a window's settings belong to, for its menu */
  function suggested(app) {
    const ids = [];
    P.forEach((p) => p.apps.includes(app) && p.tags.forEach((t) => !ids.includes(t) && curById(t) && ids.push(t)));
    return ids;
  }
  function curMenu(w) {
    const sug = suggested(w.app);
    const c = w.cur && curById(w.cur);
    const extra = c && !sug.includes(c.id) ? `<option value="${esc(c.id)}" selected>${esc(c.label)} (${esc(c.group)})</option>` : "";
    return `<label class="cbw-cur"><span>Curiosity</span><select data-wcur aria-label="Which curiosity this window is for">
      <option value=""${w.cur ? "" : " selected"}>All of this window</option>${extra}
      <optgroup label="This window's settings belong to">${sug.map((id) => `<option value="${esc(id)}"${w.cur === id ? " selected" : ""}>${esc(curById(id).label)}</option>`).join("")}</optgroup>
      <option value="?">Another curiosity… (search all ${allCur().length})</option></select></label>`;
  }

  function control(p, o, pl, w) {
    const v = p.get(o, pl);
    const k = p.scope === "place" && p.id !== "name";
    const key = k ? `<button type="button" class="cbw-key${keyed(o, p.id) ? " on" : ""}" data-key="${p.id}" title="${keyed(o, p.id) ? "Automated: its own value in each panel. Click to make it the same everywhere." : "Automate it: give it its own value in each panel (CapCut's keyframe)"}" aria-label="Automate ${esc(p.label)}">${keyed(o, p.id) ? "◆" : "◇"}</button>` : `<span class="cbw-key off" title="The same in every panel">·</span>`;
    let c = "";
    if (p.kind === "num") c = `<input type="number" data-p="${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${Math.round(v * 1000) / 1000}" aria-label="${esc(p.label)}" />`;
    else if (p.kind === "bool") c = `<input type="checkbox" data-p="${p.id}" ${v ? "checked" : ""} aria-label="${esc(p.label)}" />`;
    else if (p.kind === "color") c = `<input type="color" data-p="${p.id}" value="${esc(v)}" aria-label="${esc(p.label)}" />`;
    else if (p.kind === "text") c = `<input type="text" data-p="${p.id}" value="${esc(v)}" aria-label="${esc(p.label)}" />`;
    else c = `<select data-p="${p.id}" aria-label="${esc(p.label)}">${p.opts(o).map(([a, b]) => `<option value="${esc(a)}"${String(v) === String(a) ? " selected" : ""}>${esc(b)}</option>`).join("")}</select>`;
    const lane = k && keyed(o, p.id) ? `<div class="cbw-lane" data-lane="${p.id}" title="One dot per panel. Drag a dot up or down, click it to go to that panel, double-click it to give it the panel before's value.">${laneHtml(p, o)}</div>` : "";
    return `<div class="cbw-row" title="${esc(p.say || p.label)}"><span class="cbw-name">${esc(p.label)}</span><span class="cbw-ctl">${c}${p.unit && p.kind === "num" ? `<small>${esc(p.unit.trim())}</small>` : ""}</span>${key}</div>${lane}`;
  }
  /* a lane: one dot (numbers) or block (words, colors, on/off) per panel */
  function laneHtml(p, o) {
    const f = film();
    const n = f.panels.length;
    const ci = curIndex();
    const vals = f.panels.map((q) => (q.place[o.id] ? p.get(o, q.place[o.id]) : null));
    return laneOf(p.kind, vals, ci, n, p);
  }
  function laneOf(kind, vals, ci, n, p) {
    if (kind === "num") {
      const lo = p.min;
      const hi = p.max;
      const pts = vals.map((v, i) => [((i + 0.5) / n) * 100, 100 - ((clamp(Number(v) || 0, lo, hi) - lo) / (hi - lo || 1)) * 100]);
      return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.map((q) => q.join(",")).join(" ")}" /></svg>${pts.map((q, i) => `<i class="cbw-dot${i === ci ? " cur" : ""}" data-i="${i}" style="left:${q[0]}%;top:calc(4px + (100% - 8px) * ${q[1] / 100})" title="Panel ${i + 1}: ${esc(Math.round(vals[i] * 100) / 100)}"></i>`).join("")}`;
    }
    return vals.map((v, i) => `<b class="cbw-blk${i === ci ? " cur" : ""}" data-i="${i}" style="left:${(i / n) * 100}%;width:${100 / n}%;${kind === "color" ? "background:" + esc(v) : kind === "bool" ? (v ? "background:var(--c-accent,#22d3ee)" : "") : ""}" title="Panel ${i + 1}: ${esc(v)}">${kind === "select" ? esc(String(v || "").slice(0, 6)) : ""}</b>`).join("");
  }
  function curLane(c) {
    const f = film();
    const sc = curScale(c);
    const vals = f.panels.map((q) => curGet(c, q));
    if (sc.kind === "select") {
      const idx = vals.map((v) => Math.max(0, sc.opts.findIndex((o) => o[0] === v)));
      return laneOf("num", idx, curIndex(), f.panels.length, { min: 0, max: Math.max(1, sc.opts.length - 1) });
    }
    return laneOf("num", vals, curIndex(), f.panels.length, sc);
  }

  /* ---- the body of each window ---- */
  function curBlock(w) {
    const c = w.cur && curById(w.cur);
    if (!c) return "";
    const sc = curScale(c);
    const v = curGet(c, L().panel);
    const ctl = sc.kind === "select" ? `<select data-cv aria-label="${esc(c.label)}">${sc.opts.map(([a, b]) => `<option${String(v) === String(a) ? " selected" : ""}>${esc(b)}</option>`).join("")}</select>` : `<input type="range" data-cv min="${sc.min}" max="${sc.max}" step="${sc.step}" value="${v}" aria-label="${esc(c.label)}" /><small>${esc(Math.round(v * 10) / 10)}${sc.unit}</small>`;
    return `<section class="cbw-curv"><p><b>${esc(c.label)}</b> <em>${esc(c.group)}</em></p>${c.note ? `<p class="cbw-note">${esc(c.note)}</p>` : ""}<div class="cbw-row"><span class="cbw-name">In panel ${curIndex() + 1}</span><span class="cbw-ctl">${ctl}</span><span class="cbw-key on" title="A curiosity is always automated: one value per panel">◆</span></div><div class="cbw-lane" data-curlane="${esc(c.id)}" title="${esc(c.label)} in every panel. Drag a dot, click it to go there, double-click it to copy the panel before.">${curLane(c)}</div></section>`;
  }
  /* which of a window's settings to show for its curiosity: those that belong to it first */
  function rowsFor(w, o, pl, filter) {
    const list = P.filter((p) => p.apps.includes(w.app) && (!p.only || p.only(o, pl)) && (!filter || p.label.toLowerCase().includes(filter)));
    const c = w.cur && curById(w.cur);
    if (!c) return { mine: list, rest: [] };
    const belongs = (p) => p.tags.includes(c.id) || p.tags.some((t) => curById(t) && curById(t).group === c.group && /^Lens/.test(c.group));
    return { mine: list.filter(belongs), rest: list.filter((p) => !belongs(p)) };
  }
  function propsHtml(w, o, pl, rows) {
    const secs = ["Data", "Character", "Appearance", "Transform", "Behavior", "Action"];
    return secs
      .map((s) => {
        const ps = rows.filter((p) => p.sec === s);
        return ps.length ? `<details class="cbw-sec" open><summary>${s}</summary>${ps.map((p) => control(p, o, pl, w)).join("")}</details>` : "";
      })
      .join("");
  }
  function thingRows(w, filter) {
    const o = picked();
    const pl = o && L().panel.place[o.id];
    if (!o || !pl) return `<p class="cbw-empty">Pick a thing in the picture or in the list on the left to see its settings here.</p>`;
    const { mine, rest } = rowsFor(w, o, pl, filter);
    const c = w.cur && curById(w.cur);
    let h = "";
    if (c) h += mine.length ? `<h4>${esc(o.name)}: what belongs to ${esc(c.label)}</h4>` + propsHtml(w, o, pl, mine) : `<p class="cbw-empty">None of this window's settings for ${esc(o.name)} belong to ${esc(c.label)} yet. Its own value is above, and every setting is below.</p>`;
    else h += propsHtml(w, o, pl, mine);
    if (rest.length) h += `<details class="cbw-more"${w.folded === false ? " open" : ""}><summary>Other settings in this window (${rest.length})</summary>${propsHtml(w, o, pl, rest)}</details>`;
    return h;
  }

  function robloxBody(w) {
    const o = picked();
    return `<div class="cbw-filter"><input type="search" data-filter placeholder="Filter Properties" value="${esc(w.filter || "")}" aria-label="Filter properties" /></div>
      <p class="cbw-sub">${o ? esc(o.name) + " · " + esc(o.kind === "made" ? o.make : o.kind) : "Nothing picked"} · panel ${curIndex() + 1}</p>${curBlock(w)}${thingRows(w, (w.filter || "").toLowerCase())}`;
  }
  const SIMS_BUILD = { Walls: ["wall", "door", "window"], Floors: ["floor"], Roofs: ["roof"], Stairs: ["stairs"] };
  const SWATCH = ["#f2efe8", "#e9d8b8", "#c9a27a", "#8b5e3c", "#4f3a2c", "#a8553f", "#d26a4a", "#e7c235", "#6f9b5a", "#3f6f8f", "#5b5f97", "#2b2d33"];
  /* Create a Sim: ready-made looks, in words the 3D characters read */
  const SIM_LOOKS = [["Everyday", "short brown hair, grey t-shirt, jeans, sneakers"], ["Country", "country look, straw hat"], ["Chef", "chef"], ["Punk", "pink mohawk, black jacket, boots"], ["Office", "neat short hair, white shirt, black trousers, shoes"], ["Sporty", "ponytail, red hoodie, shorts, sneakers"], ["Fancy", "long hair, blue dress, sandals"], ["Cowboy", "cowboy, leather boots"], ["Royal", "crown, purple sweater, velvet trousers"], ["Wizard", "wizard, long grey beard, robe"]];
  function simsBody(w) {
    const O = window.CurioObjects;
    const rooms = O ? (O.PLACES.Household || []) : [];
    const cat = w.cat || "Walls";
    let grid = "";
    if (SIMS_BUILD[cat]) grid = SIMS_BUILD[cat].map((k) => `<button type="button" class="cbw-item" data-piece="${k}"><b>${esc((B().pieceNames || {})[k] || k)}</b></button>`).join("") + (cat === "Walls" ? `<button type="button" class="cbw-item" data-tool="wall"><b>Wall tool</b><small>drag on the floor</small></button><button type="button" class="cbw-item" data-tool="room"><b>Room tool</b><small>drag a rectangle</small></button>` : "");
    else if (cat === "Looks") grid = isPerson(picked()) ? SIM_LOOKS.map(([n, t]) => `<button type="button" class="cbw-item" data-simlook="${esc(t)}"><b>${esc(n)}</b><small>${esc(t)}</small></button>`).join("") : `<p class="cbw-empty">Pick a person to dress them.</p>`;
    else if (O) grid = O.items.filter((it) => (it.places || []).includes(cat) && it.type !== "People").map((it) => `<button type="button" class="cbw-item" data-item="${esc(it.id)}"><b>${esc(it.name)}</b><small>${esc(it.type)}</small></button>`).join("");
    const o = picked();
    const pl = o && L().panel.place[o.id];
    const S = B().settings();
    return `<div class="cbw-simtools" role="toolbar" aria-label="Build Mode tools">
        <button type="button" data-tool="select" title="Hand: pick things up and move them">✋<small>Hand</small></button>
        <button type="button" data-tool="wall" title="Wall tool: drag along the floor">▥<small>Wall</small></button>
        <button type="button" data-tool="room" title="Room tool: drag a rectangle">▣<small>Room</small></button>
        <button type="button" data-do="del" title="Sledgehammer: knock down the picked thing">🔨<small>Sledgehammer</small></button>
        <button type="button" data-tool="paint" title="Design tool: copy a color onto other things">💧<small>Design</small></button>
        <button type="button" data-do="turnL" title="Turn the picked thing 45° left">⟲<small>45°</small></button>
        <button type="button" data-do="turnR" title="Turn the picked thing 45° right">⟳<small>45°</small></button>
      </div>
      <div class="cbw-sims">
        <nav class="cbw-cats"><h5>Build</h5>${Object.keys(SIMS_BUILD).map((k) => `<button type="button" data-cat="${k}" class="${cat === k ? "on" : ""}">${k}</button>`).join("")}<h5>Create a Sim</h5><button type="button" data-cat="Looks" class="${cat === "Looks" ? "on" : ""}">Looks</button><h5>Buy by room</h5>${rooms.map((k) => `<button type="button" data-cat="${esc(k)}" class="${cat === k ? "on" : ""}">${esc(k)}</button>`).join("")}</nav>
        <div class="cbw-grid">${grid || `<p class="cbw-empty">Nothing here yet.</p>`}</div>
      </div>
      <div class="cbw-design"><b>Design</b>${o ? `<span class="cbw-sw">${SWATCH.map((c) => `<button type="button" data-swatch="${c}" style="background:${c}" title="${c}" aria-label="Color ${c}"></button>`).join("")}</span>` : `<span class="cbw-sub">Pick a thing to color it.</span>`}<label class="cbw-wallh">Wall height <input type="range" data-tk="wallH" min="0.5" max="6" step="0.1" value="${S.wallH}" /> <small>${S.wallH.toFixed(1)} m · tool</small></label></div>
      ${curBlock(w)}${o && pl ? thingRows(w, "") : ""}`;
  }
  function fortniteBody(w) {
    const tab = w.tab || "building";
    const S = B().settings();
    const mats = MATS();
    let body = "";
    if (tab === "prefabs") {
      const O = window.CurioObjects;
      body = `<h5>Prefabs</h5><div class="cbw-grid">${(B().prefabList || []).map((p) => `<button type="button" class="cbw-item" data-prefab="${p.id}" title="${esc(p.say)}"><b>${esc(p.name)}</b><small>${esc(p.say)}</small></button>`).join("")}</div>
        <h5>Galleries (whole places)</h5><div class="cbw-grid">${O ? O.WORLDS.map((wd) => (O.PLACES[wd] || []).map((pl) => `<button type="button" class="cbw-item" data-gallery="${esc(pl)}" data-gworld="${esc(wd)}"><b>${esc(pl)}</b><small>${esc(wd)}</small></button>`).join("")).join("") : ""}</div>`;
    } else if (tab === "phone") {
      body = `<div class="cbw-phone">
        <button type="button" data-tool="move" title="Grab: drag the picked thing with arrows">✥<small>Grab</small></button>
        <button type="button" data-do="copy" title="Copy the picked thing">⧉<small>Copy</small></button>
        <button type="button" data-do="paste" title="Paste a copy next to it">📋<small>Paste</small></button>
        <button type="button" data-do="del" title="Delete the picked thing">🗑<small>Delete</small></button>
        <button type="button" data-do="rot90" title="Rotate a quarter turn">⟳<small>Rotate</small></button>
        <button type="button" data-do="push" title="Push it away from the camera">⇡<small>Push</small></button>
        <button type="button" data-do="pull" title="Pull it toward the camera">⇣<small>Pull</small></button>
        <button type="button" data-do="up" title="Raise it">▲<small>Raise</small></button>
        <button type="button" data-do="down" title="Lower it">▼<small>Lower</small></button>
        <button type="button" data-do="drop" title="Drop it to the ground">⤓<small>Drop</small></button>
      </div>
      <label class="cbw-snap">Grid snap <select data-tk="snap">${[[0, "Off"], [0.25, "25 cm"], [0.5, "half a metre"], [1, "1 m"], [3, "3 m (a build tile)"]].map(([v, l]) => `<option value="${v}"${S.snap === v ? " selected" : ""}>${l}</option>`).join("")}</select> <small>tool</small></label>
      ${curBlock(w)}${thingRows(w, "")}`;
    } else {
      body = `<div class="cbw-mats">${Object.keys(mats).map((k) => `<button type="button" data-tmat="${k}" class="${S.material === k ? "on" : ""}" style="--sw:${mats[k][1]}">${esc(mats[k][0])}</button>`).join("")}</div>
        <div class="cbw-grid">${(B().pieces || []).map((k) => `<button type="button" class="cbw-item" data-piece="${k}"><b>${esc((B().pieceNames || {})[k] || k)}</b><small>${esc(mats[S.material] ? mats[S.material][0] : "")}</small></button>`).join("")}</div>
        ${curBlock(w)}${picked() ? thingRows(w, "") : ""}`;
    }
    const quick = (w.quick || []).slice(0, 6);
    return `<nav class="cbw-tabs">${[["prefabs", "Prefabs & Galleries"], ["building", "Building"], ["phone", "Phone"]].map(([k, l]) => `<button type="button" data-ftab="${k}" class="${tab === k ? "on" : ""}">${l}</button>`).join("")}</nav>${body}
      <div class="cbw-quick" title="Quick bar: what you placed from this window. Click a slot to place another.">${Array.from({ length: 6 }, (_, i) => quick[i] ? `<button type="button" data-quick="${i}" title="${esc(quick[i].label)}">${i + 1}<small>${esc(quick[i].label)}</small></button>` : `<span>${i + 1}</span>`).join("")}</div>`;
  }

  function draw(w) {
    const r = rootEl();
    if (!r) return;
    let el = els[w.id];
    if (!el) {
      el = document.createElement("section");
      el.className = "cbw-win";
      el.dataset.win = w.id;
      el.setAttribute("role", "dialog");
      r.appendChild(el);
      els[w.id] = el;
      wire(el, w);
    }
    draws++;
    const a = APPS[w.app];
    /* keep where each list was scrolled to */
    const scrolls = Array.from(el.querySelectorAll(".cbw-body, .cbw-grid, .cbw-cats, .cbw-found")).map((x) => x.scrollTop);
    const focusSel = document.activeElement && el.contains(document.activeElement) && document.activeElement.matches("[data-filter]");
    el.style.cssText = `left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.folded === "win" ? "auto" : w.h + "px"}`;
    el.classList.toggle("cbw-folded", w.folded === "win");
    el.setAttribute("aria-label", a.from + " " + a.name);
    const c = w.cur && curById(w.cur);
    el.innerHTML = `<header class="cbw-head"><b>${esc(a.name)}</b><em>${esc(a.from)}${c ? " · " + esc(c.label) : ""}</em><span class="cbw-btns"><button type="button" data-twin title="Open another ${esc(a.name)} window, for a different curiosity">⧉</button><button type="button" data-fold title="Fold the window up (double-click the title does it too)">▁</button><button type="button" data-close title="Close" aria-label="Close">×</button></span></header>
      <div class="cbw-top">${curMenu(w)}<div class="cbw-find" hidden><input type="search" data-curq placeholder="Type to find a curiosity: color, set, comedy, eyeline…" aria-label="Find a curiosity" /><div class="cbw-found"></div></div></div>
      <div class="cbw-body">${w.app === "roblox" ? robloxBody(w) : w.app === "sims" ? simsBody(w) : fortniteBody(w)}</div>`;
    Array.from(el.querySelectorAll(".cbw-body, .cbw-grid, .cbw-cats, .cbw-found")).forEach((x, i) => scrolls[i] && (x.scrollTop = scrolls[i]));
    if (focusSel) {
      const f = el.querySelector("[data-filter]");
      f.focus();
      f.setSelectionRange(f.value.length, f.value.length);
    }
  }

  /* ---- what the buttons and fields do ---- */
  let clip = null;
  function act(w, what) {
    const o = picked();
    const lv = L();
    const pl = o && lv.panel.place[o.id];
    if (what === "paste") {
      if (!clip || !obj(clip)) return;
      B().duplicate(clip);
      return;
    }
    if (!o || !pl) return;
    if (what === "del") return B().remove(o.id);
    if (what === "copy") {
      clip = o.id;
      return;
    }
    const C = lv.C;
    const f = C ? [C.target[0] - C.pos[0], 0, C.target[2] - C.pos[2]] : [0, 0, -1];
    const fl = Math.hypot(f[0], f[2]) || 1;
    const S = B().settings();
    const step = S.snap || 0.5;
    const turnBy = (d) => setParam(o, PBY.turn, ((((pl.turn || 0) + d) % 360) + 540) % 360 - 180, "bw-turn");
    if (what === "turnL") return turnBy(45);
    if (what === "turnR") return turnBy(-45);
    if (what === "rot90") return turnBy(90);
    if (what === "push" || what === "pull") {
      const k = what === "push" ? step : -step;
      V.edit("bw-" + what);
      const set = (q) => ((q.x = r3(q.x + (f[0] / fl) * k)), (q.z = r3(q.z + (f[2] / fl) * k)));
      if (keyed(o, "x") || keyed(o, "z")) set(pl);
      else film().panels.forEach((q) => q.place[o.id] && set(q.place[o.id]));
      return V.changed(true);
    }
    if (what === "up") return setParam(o, PBY.y, (pl.y || 0) + step);
    if (what === "down") return setParam(o, PBY.y, Math.max(0, (pl.y || 0) - step));
    if (what === "drop") return setParam(o, PBY.y, 0);
  }
  function remember(w, entry) {
    w.quick = [entry].concat((w.quick || []).filter((q) => q.label !== entry.label)).slice(0, 6);
    saveState();
  }
  function place(w, entry) {
    if (entry.item) B().addItem(entry.item);
    else if (entry.piece) {
      if (entry.mat) B().set({ material: entry.mat });
      B().addPiece(entry.piece);
    } else if (entry.prefab) B().addPrefab(entry.prefab);
    else if (entry.gallery) B().addSetting(entry.gallery, entry.world, false);
    remember(w, entry);
    refresh();
  }
  function wire(el, w0) {
    const W = () => state.wins.find((x) => x.id === Number(el.dataset.win));
    el.addEventListener("click", (e) => {
      const w = W();
      if (!w) return;
      const t = e.target.closest("button, [data-i]");
      if (!t) return;
      const d = t.dataset;
      if (d.close != null) return close(w.id);
      if (d.twin != null) {
        open(w.app, { x: w.x + 30, y: w.y + 30, tab: w.tab, cat: w.cat, cur: "" });
        const nw = state.wins[state.wins.length - 1];
        const ne = els[nw.id];
        if (ne) {
          ne.querySelector(".cbw-find").hidden = false;
          ne.querySelector("[data-curq]").focus();
        }
        return;
      }
      if (d.fold != null) {
        w.folded = w.folded === "win" ? null : "win";
        saveState();
        return draw(w);
      }
      const o = picked();
      if (d.key && o) return toggleKey(o, PBY[d.key]);
      if (d.tool) {
        B().setTool(d.tool);
        return V.showTab("build");
      }
      if (d.do) return act(w, d.do);
      if (d.cat) {
        w.cat = d.cat;
        saveState();
        return draw(w);
      }
      if (d.ftab) {
        w.tab = d.ftab;
        saveState();
        return draw(w);
      }
      if (d.tmat) {
        B().set({ material: d.tmat });
        return refresh();
      }
      if (d.piece) return place(w, { piece: d.piece, mat: w.app === "fortnite" ? B().settings().material : null, label: (B().pieceNames || {})[d.piece] || d.piece });
      if (d.item) {
        const it = window.CurioObjects && window.CurioObjects.find(d.item);
        return place(w, { item: d.item, label: it ? it.name : d.item });
      }
      if (d.prefab) return place(w, { prefab: d.prefab, label: ((B().prefabList || []).find((p) => p.id === d.prefab) || {}).name || d.prefab });
      if (d.gallery) return place(w, { gallery: d.gallery, world: d.gworld, label: d.gallery });
      if (d.quick != null) {
        const q = (w.quick || [])[Number(d.quick)];
        if (q) place(w, q);
        return;
      }
      if (d.swatch && o) return setParam(o, PBY.color, d.swatch, "bw-swatch");
      if (d.simlook && o) {
        /* a ready-made look starts fresh: parts changed by hand give way to it */
        V.edit("bw-simlook");
        const qs = keyed(o, "look") ? [L().panel] : film().panels;
        qs.forEach((q) => q.place[o.id] && delete q.place[o.id].lookParts);
        return setParam(o, PBY.look, d.simlook, "bw-simlook");
      }
      if (d.pickcur) {
        w.cur = d.pickcur;
        saveState();
        return draw(w);
      }
      if (d.i != null && !laneDrag) {
        seekPanel(Number(d.i));
      }
    });
    el.addEventListener("change", (e) => {
      const w = W();
      const t = e.target;
      if (!w) return;
      if (t.matches("[data-wcur]")) {
        if (t.value === "?") {
          el.querySelector(".cbw-find").hidden = false;
          el.querySelector("[data-curq]").focus();
          return;
        }
        w.cur = t.value;
        saveState();
        return draw(w);
      }
      if (t.matches("[data-tk]")) {
        B().set({ [t.dataset.tk]: Number(t.value) });
        return refresh();
      }
      if (t.matches("[data-cv]")) {
        const c = curById(w.cur);
        if (!c) return;
        const sc = curScale(c);
        V.edit("bw-cur-" + c.id);
        curSet(c, curIndex(), sc.kind === "select" ? sc.opts[t.selectedIndex][0] : Number(t.value));
        return V.changed(true);
      }
      const pd = t.dataset.p;
      const o = picked();
      if (!pd || !o) return;
      const p = PBY[pd];
      const v = p.kind === "num" ? clamp(Number(t.value), p.min, p.max) : p.kind === "bool" ? t.checked : t.value;
      setParam(o, p, v);
    });
    el.addEventListener("input", (e) => {
      const w = W();
      const t = e.target;
      if (!w) return;
      if (t.matches("[data-filter]")) {
        w.filter = t.value;
        return draw(w);
      }
      if (t.matches("[data-curq]")) {
        const q = t.value.toLowerCase().split(/\s+/).filter(Boolean);
        const box = el.querySelector(".cbw-found");
        if (!q.length) return (box.innerHTML = "");
        const hits = [];
        for (const c of allCur()) {
          const hay = (c.label + " " + c.group + " " + c.id).toLowerCase();
          if (q.every((x) => hay.includes(x))) hits.push(c);
          if (hits.length >= 40) break;
        }
        box.innerHTML = hits.length ? hits.map((c) => `<button type="button" data-pickcur="${esc(c.id)}"><b>${esc(c.label)}</b><small>${esc(c.group)}</small></button>`).join("") : `<p class="cbw-empty">No curiosity has those words.</p>`;
      }
    });
    el.addEventListener("dblclick", (e) => {
      const w = W();
      if (!w) return;
      if (e.target.closest(".cbw-head") && !e.target.closest("button")) {
        w.folded = w.folded === "win" ? null : "win";
        saveState();
        return draw(w);
      }
      /* double-click a dot: the panel before's value (Ableton: double-click deletes a node) */
      const dot = e.target.closest("[data-i]");
      const lane = dot && dot.closest(".cbw-lane");
      if (!lane) return;
      const i = Number(dot.dataset.i);
      if (i < 1) return;
      const f = film();
      if (lane.dataset.curlane) {
        const c = curById(lane.dataset.curlane);
        V.edit("bw-cur-" + c.id);
        curSet(c, i, curGet(c, f.panels[i - 1]));
        return V.changed(true);
      }
      const o = picked();
      const p = PBY[lane.dataset.lane];
      if (!o || !p || !f.panels[i].place[o.id] || !f.panels[i - 1].place[o.id]) return;
      V.edit("bw-lane-" + p.id);
      p.set(o, f.panels[i].place[o.id], p.get(o, f.panels[i - 1].place[o.id]));
      V.changed(true);
    });
    /* drag a dot up or down: that panel's value */
    let laneDrag = null;
    el.addEventListener("pointerdown", (e) => {
      const w = W();
      if (!w) return;
      const head = e.target.closest(".cbw-head");
      if (head && !e.target.closest("button")) {
        const sx = e.clientX - w.x;
        const sy = e.clientY - w.y;
        const mv = (ev) => {
          const rr = rootEl().getBoundingClientRect();
          w.x = clamp(ev.clientX - sx, 0, rr.width - 60);
          w.y = clamp(ev.clientY - sy, 0, rr.height - 30);
          el.style.left = w.x + "px";
          el.style.top = w.y + "px";
        };
        const upf = () => {
          window.removeEventListener("pointermove", mv);
          window.removeEventListener("pointerup", upf);
          saveState();
        };
        window.addEventListener("pointermove", mv);
        window.addEventListener("pointerup", upf);
        return;
      }
      const dot = e.target.closest(".cbw-dot");
      const lane = dot && dot.closest(".cbw-lane");
      if (!lane) return;
      e.preventDefault();
      const rect = lane.getBoundingClientRect();
      const i = Number(dot.dataset.i);
      const o = picked();
      const c = lane.dataset.curlane && curById(lane.dataset.curlane);
      const p = !c && PBY[lane.dataset.lane];
      let sc = c ? curScale(c) : p;
      if (c && sc.kind === "select") sc = { min: 0, max: sc.opts.length - 1, step: 1, opts: sc.opts };
      if (!sc || (!c && !o)) return;
      laneDrag = { moved: false, edited: false };
      const mv = (ev) => {
        const u = 1 - clamp((ev.clientY - rect.top) / rect.height, 0, 1);
        if (!laneDrag.moved && Math.abs(ev.clientY - e.clientY) < 3) return;
        laneDrag.moved = true;
        if (!laneDrag.edited) {
          V.edit("bw-lane");
          laneDrag.edited = true;
        }
        let v = sc.min + u * (sc.max - sc.min);
        v = Math.round(v / (sc.step || 0.01)) * (sc.step || 0.01);
        if (c) curSet(c, i, sc.opts ? sc.opts[Math.round(v)][0] : r3(v));
        else {
          const q = film().panels[i].place[o.id];
          if (q) p.set(o, q, v);
        }
        dot.style.top = `calc(4px + (100% - 8px) * ${1 - u})`;
        V.changed(false);
      };
      const upf = () => {
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", upf);
        const moved = laneDrag && laneDrag.moved;
        setTimeout(() => (laneDrag = null), 0);
        if (moved) V.changed(true);
        else seekPanel(i);
      };
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", upf);
    });
    /* remember the size after the corner is dragged */
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        const w = W();
        if (!w || w.folded === "win") return;
        const nw = Math.round(el.offsetWidth);
        const nh = Math.round(el.offsetHeight);
        if (nw && nh && (Math.abs(nw - w.w) > 2 || Math.abs(nh - w.h) > 2)) {
          w.w = nw;
          w.h = nh;
          saveState();
        }
      }).observe(el);
    }
  }

  /* windows follow every change: the picked thing, the panel, undo */
  let raf = 0;
  V.onChange(() => {
    if (!state.wins.length || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const a = document.activeElement;
      /* don't redraw a window while someone is typing a number into it */
      if (a && a.closest && a.closest(".cbw-win") && a.matches("input[type=number], input[type=text], input[type=color]")) return;
      refresh();
    });
  });
  /* picking a thing or a panel does not always count as a change: look every so often while windows are open */
  let lastSig = "";
  setInterval(() => {
    if (!state.wins.length || !rootEl() || rootEl().hidden) return;
    const f = film();
    const sig = f.sel + "|" + curIndex() + "|" + f.objects.length;
    if (sig === lastSig) return;
    lastSig = sig;
    const a = document.activeElement;
    if (a && a.closest && a.closest(".cbw-win") && a.matches("input")) return;
    refresh();
  }, 400);

  /* the buttons at the top of the Build tab */
  function slot(box) {
    if (!box) return;
    box.innerHTML = `<div class="cbw-open"><span>Windows</span>${Object.keys(APPS).map((k) => `<button type="button" data-cbw-open="${k}" title="${esc(APPS[k].from)}'s ${esc(APPS[k].name)} window, with a curiosity menu at the top">${esc(APPS[k].name)}<small>${esc(APPS[k].from)}</small></button>`).join("")}</div>`;
    /* on press, not on click: leaving a field in an open window saves it and redraws this tab, which would eat the click */
    box.querySelectorAll("[data-cbw-open]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => e.button === 0 && (e.preventDefault(), open(b.dataset.cbwOpen)));
      b.addEventListener("click", (e) => e.detail === 0 && open(b.dataset.cbwOpen));
    });
  }

  const CSS = `
.cbw-open { display: grid; grid-template-columns: auto repeat(3, minmax(0, 1fr)); gap: 4px; align-items: stretch; }
.cbw-open > span { align-self: center; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-dim, #9b9ba3); padding-right: 2px; }
.cv-root .cbw-open button { display: grid; padding: 4px 6px; text-align: left; font-weight: 600; font-size: 12px; }
.cbw-open button small { font-weight: 400; font-size: 10px; color: var(--c-dim, #9b9ba3); }
.cbw-win { position: absolute; z-index: 55; display: grid; grid-template-rows: auto auto minmax(0, 1fr); background: #18191e; color: #e6e6ea; border: 1px solid #3a3b44; border-radius: 9px; box-shadow: 0 14px 44px rgba(0,0,0,0.55); resize: both; overflow: hidden; min-width: 240px; min-height: 120px; font-size: 12.5px; }
.cbw-win.cbw-folded { resize: none; min-height: 0; }
.cbw-win.cbw-folded .cbw-top, .cbw-win.cbw-folded .cbw-body { display: none; }
.cbw-head { display: flex; align-items: baseline; gap: 8px; padding: 6px 8px 6px 10px; background: #22232a; cursor: move; user-select: none; min-width: 0; }
.cbw-head b { font-size: 13px; }
.cbw-head em { font-style: normal; color: #9b9ba3; font-size: 11px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cbw-btns { display: flex; gap: 2px; }
.cbw-btns button { all: unset; cursor: pointer; padding: 0 5px; color: #b9b9c2; font-size: 14px; line-height: 20px; border-radius: 4px; }
.cbw-btns button:hover, .cbw-btns button:focus-visible { background: #33343d; color: #fff; }
.cbw-top { padding: 6px 8px; border-bottom: 1px solid #2c2d34; display: grid; gap: 6px; }
.cbw-cur { display: flex; align-items: center; gap: 6px; }
.cbw-cur span { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #22d3ee; }
.cbw-cur select { flex: 1; min-width: 0; }
.cbw-find[hidden] { display: none; }
.cbw-find input { width: 100%; box-sizing: border-box; }
.cbw-found { display: grid; gap: 2px; max-height: 180px; overflow: auto; margin-top: 4px; }
.cbw-found button { all: unset; cursor: pointer; display: flex; justify-content: space-between; gap: 8px; padding: 3px 6px; border-radius: 5px; }
.cbw-found button:hover, .cbw-found button:focus-visible { background: #2a2c34; }
.cbw-found small { color: #9b9ba3; }
.cbw-body { overflow-x: hidden; overflow-y: auto; padding: 6px 8px 10px; display: flex; flex-direction: column; gap: 6px; min-height: 0; }
.cbw-body > * { flex: none; }
.cbw-body h4, .cbw-body h5 { margin: 4px 0 0; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #9b9ba3; font-weight: 600; }
.cbw-sub { margin: 0; color: #9b9ba3; font-size: 11px; }
.cbw-empty { margin: 4px 0; color: #9b9ba3; }
.cbw-filter input { width: 100%; box-sizing: border-box; }
.cbw-sec, .cbw-more { border-top: 1px solid #2c2d34; }
.cbw-sec > summary, .cbw-more > summary { cursor: pointer; padding: 4px 0; font-weight: 600; color: #cfcfd6; }
.cbw-more > summary { color: #9b9ba3; font-weight: 400; }
.cbw-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) 20px; gap: 6px; align-items: center; padding: 2px 0; }
.cbw-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #d6d6dd; }
.cbw-ctl { display: flex; align-items: center; gap: 4px; min-width: 0; }
.cbw-ctl input[type=number], .cbw-ctl input[type=text], .cbw-ctl select { width: 100%; min-width: 0; box-sizing: border-box; }
.cbw-ctl input[type=range] { flex: 1; min-width: 0; }
.cbw-ctl small { color: #9b9ba3; font-variant-numeric: tabular-nums; }
.cbw-key { all: unset; cursor: pointer; text-align: center; color: #9b9ba3; font-size: 14px; }
.cbw-key.on { color: #22d3ee; }
.cbw-key.off { cursor: default; opacity: 0.4; }
.cbw-lane { position: relative; height: 34px; margin: 0 0 4px; background: #111216; border: 1px solid #2c2d34; border-radius: 5px; overflow: hidden; }
.cbw-lane svg { position: absolute; inset: 4px 0; width: 100%; height: calc(100% - 8px); }
.cbw-lane polyline { fill: none; stroke: #22d3ee; stroke-width: 1.5; vector-effect: non-scaling-stroke; opacity: 0.7; }
.cbw-dot { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: #22d3ee; cursor: ns-resize; box-shadow: 0 0 0 2px #111216; }
.cbw-dot.cur { background: #fde047; }
.cbw-blk { position: absolute; top: 4px; bottom: 4px; box-sizing: border-box; border-right: 1px solid #111216; background: #2a2c34; font-size: 9px; font-weight: 400; color: #cfcfd6; overflow: hidden; white-space: nowrap; padding: 2px; cursor: pointer; }
.cbw-blk.cur { outline: 1px solid #fde047; outline-offset: -1px; }
.cbw-curv { background: #12313a; border-radius: 7px; padding: 6px 8px; display: grid; gap: 4px; }
.cbw-curv p { margin: 0; }
.cbw-curv em { font-style: normal; color: #9bd8e4; font-size: 11px; }
.cbw-note { color: #b9d6dc; font-size: 11.5px; }
.cbw-simtools, .cbw-phone { display: grid; grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); gap: 4px; }
.cv-root .cbw-simtools button, .cv-root .cbw-phone button { display: grid; justify-items: center; gap: 1px; padding: 5px 2px; font-size: 16px; }
.cbw-simtools small, .cbw-phone small { font-size: 10px; color: #9b9ba3; }
.cbw-sims { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 6px; min-height: 150px; }
.cbw-cats { display: grid; gap: 2px; align-content: start; overflow: auto; max-height: 220px; }
.cv-root .cbw-cats button { text-align: left; padding: 3px 7px; }
.cv-root .cbw-cats button.on, .cv-root .cbw-tabs button.on, .cv-root .cbw-mats button.on { background: #22d3ee; color: #0b1a1d; border-color: #22d3ee; }
.cbw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 4px; align-content: start; overflow: auto; max-height: 220px; }
.cv-root .cbw-item { display: grid; gap: 1px; text-align: left; padding: 5px 7px; }
.cbw-item small { color: #9b9ba3; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cbw-design { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; border-top: 1px solid #2c2d34; padding-top: 6px; }
.cbw-sw { display: flex; flex-wrap: wrap; gap: 3px; }
.cbw-sw button { all: unset; cursor: pointer; width: 18px; height: 18px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25); }
.cbw-sw button:focus-visible { outline: 2px solid #22d3ee; }
.cbw-wallh { display: flex; align-items: center; gap: 6px; color: #cfcfd6; }
.cbw-wallh small, .cbw-snap small { color: #9b9ba3; }
.cbw-tabs { display: flex; gap: 2px; }
.cv-root .cbw-tabs button { flex: 1; padding: 5px 4px; font-weight: 600; }
.cbw-mats { display: flex; flex-wrap: wrap; gap: 3px; }
.cv-root .cbw-mats button { padding: 3px 9px; box-shadow: inset 4px 0 0 var(--sw); }
.cbw-snap { display: flex; gap: 6px; align-items: center; }
.cbw-quick { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 3px; border-top: 1px solid #2c2d34; padding-top: 6px; }
.cbw-quick > span, .cv-root .cbw-quick button { display: grid; place-items: center; min-height: 38px; border: 1px dashed #3a3b44; border-radius: 6px; color: #6f6f78; font-size: 11px; padding: 2px; }
.cv-root .cbw-quick button { border-style: solid; color: #e6e6ea; }
.cbw-quick small { font-size: 9.5px; color: #9b9ba3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
@media (max-width: 700px) { .cbw-sims { grid-template-columns: 1fr; } .cbw-win { left: 8px !important; right: 8px; width: auto !important; } }
`;
  if (!document.getElementById("cbw-style")) {
    const st = document.createElement("style");
    st.id = "cbw-style";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  /* reopen the windows that were open, once the Viewer is there */
  const reopen = () => {
    if (!rootEl()) return setTimeout(reopen, 300);
    state.wins.forEach(draw);
  };
  reopen();

  window.CurioBuildWindows = {
    open,
    close,
    list: () => state.wins.map((w) => ({ id: w.id, app: w.app, cur: w.cur })),
    setCuriosity: (id, cur) => {
      const w = state.wins.find((x) => x.id === id);
      if (w) {
        w.cur = cur || "";
        saveState();
        draw(w);
      }
    },
    slot,
    draws: () => draws,
    params: P.map((p) => ({ id: p.id, label: p.label, apps: p.apps.slice(), tags: p.tags.slice(), automatable: p.scope === "place" })),
    apps: Object.keys(APPS),
  };
})();
