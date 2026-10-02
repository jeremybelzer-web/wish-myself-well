/* screen/character.js: the character matrix on the Screen. Characters are the engine's character tracks, and the
   matrix's curiosities (the 18 axes cm-<axis>, Enneagram health cm-health, dramatic role cm-role) are lanes on
   them, one set per character, so every character has their own automatable lanes on the timeline.

   - The Character tab (levels.js) lists the matrix's curiosities. Its Details start with a character bar: pick
     whose lanes the controls write to, set their Enneagram type, add a character, and open the 3D matrix.
   - The 3D matrix opens over the Screen, linked to the film (CharacterMatrix.link): its cast is the character
     tracks, its scenes are the moments, and every change in it is a node on the timeline, one undo step each.
   - An axis with no lane follows the character's type at that moment's health; an axis with a lane is what the
     lane says. So a lane is only needed where a character departs from their type.

   The type and colour of each character track are not engine curiosities; they are kept here, by track id, in
   localStorage "curiosities-character-screen-v1" (a curiosities-* key, so a .curio project file carries them).

   window.CharacterScreen
   - claims(id)         true for the matrix's curiosities (cm-*), which go on a character's own track
   - track(st?)         the picked character track id (or the first character track, or null)
   - trackHas(id, st)   the picked character's track if it has that lane yet, for reading values
   - trackFor(id, st)   the track a matrix curiosity goes on: the picked character's, if it has room
   - barHtml()          the character bar for the Character tab's Details
   - openMatrix()       the 3D matrix over the Screen, linked to the film
   - adapter            what CharacterMatrix.link() is given (pull, push, add, remove, rename, setType...) */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const E = () => root.CurioEngine;
  const KEY = "curiosities-character-screen-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const base = (id) => String(id || "").split(".")[0];
  const claims = (id) => /^cm-/.test(base(id));

  let prefs = { picked: null, types: {}, colors: {} };
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    if (p && typeof p === "object") prefs = Object.assign(prefs, p);
  } catch (e) {}
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {}
  }
  const redraw = () => root.dispatchEvent && root.dispatchEvent(new CustomEvent("curio-screen-redraw"));

  /* ---------- which character ---------- */
  const characters = (st) => (st || E().state()).tracks.filter((t) => t.kind === "character");
  function track(st) {
    if (!E()) return null;
    const list = characters(st);
    const t = list.find((x) => x.id === prefs.picked) || list[0];
    return t ? t.id : null;
  }
  function trackHas(id, st) {
    st = st || E().state();
    const t = st.tracks.find((x) => x.id === track(st));
    return t && t.curiosities.includes(id) ? t : null;
  }
  function trackFor(id, st) {
    st = st || E().state();
    const t = st.tracks.find((x) => x.id === track(st));
    if (!t) return null;
    return t.curiosities.includes(id) || t.curiosities.length < E().LIMIT.perTrack ? t.id : null;
  }
  function pick(id) {
    prefs.picked = id;
    save();
    redraw();
  }

  /* ---------- the matrix's own files, loaded once (the same files the Archetype workspace loads) ---------- */
  const me = typeof document !== "undefined" && document.currentScript && document.currentScript.src;
  const appBase = me ? me.replace(/screen\/character\.js(\?.*)?$/, "") : "";
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  let loading = null;
  function load() {
    if (root.CharacterMatrix && root.CHARACTER_MATRIX_DATA) return Promise.resolve(true);
    if (loading) return loading;
    const add = (el) =>
      new Promise((ok, fail) => {
        el.onload = () => ok(true);
        el.onerror = () => fail(new Error("not found"));
        document.head.appendChild(el);
      });
    const js = (src, optional) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      return add(s).catch((e) => {
        if (!optional) throw e;
      });
    };
    if (!document.getElementById("ws-matrix-css") && !document.getElementById("cs-matrix-css")) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = appBase + "character-matrix/matrix.css";
      l.id = "cs-matrix-css";
      document.head.appendChild(l);
    }
    loading = (root.THREE ? Promise.resolve() : js(THREE_URL, true))
      .then(() => (root.CHARACTER_MATRIX_DATA ? null : js(appBase + "character-matrix/data.js")))
      .then(() => (root.CharacterMatrix ? null : js(appBase + "character-matrix/matrix.js")))
      .then(() => !!root.CharacterMatrix)
      .catch(() => {
        loading = null;
        return false;
      });
    return loading;
  }
  const M = () => root.CharacterMatrix || null;
  const DATA = () => root.CHARACTER_MATRIX_DATA || null;

  /* ---------- the film as the matrix's cast ---------- */
  const AXIS_IDS = () => DATA().AXES.map((a) => "cm-" + a.id);
  function has(t, id) {
    return t.curiosities.includes(id);
  }
  /* A character's type: what was set here, else the type the axis lanes look most like, else 9. */
  function typeOf(t, st) {
    if (prefs.types[t.id]) return prefs.types[t.id];
    const axes = DATA().AXES;
    if (st.rows.length && axes.some((a) => has(t, "cm-" + a.id))) {
      const r = st.rows[0].id;
      const h = has(t, "cm-health") ? Number(E().value(r, t.id, "cm-health")) : 5;
      let best = 9;
      let bestD = Infinity;
      for (let n = 1; n <= 9; n++) {
        const fp = M().typeProfile(n, h);
        let d = 0;
        let k = 0;
        axes.forEach((a, i) => {
          if (!has(t, "cm-" + a.id)) return;
          d += Math.abs(Number(E().value(r, t.id, "cm-" + a.id)) - fp[i]);
          k++;
        });
        if (k && d / k < bestD) (bestD = d / k), (best = n);
      }
      return best;
    }
    return 9;
  }
  function pull() {
    const Eng = E();
    if (!Eng || !M()) return null;
    const st = Eng.state();
    const D = DATA();
    const TYPES = Object.fromEntries(D.TYPES.map((x) => [x.n, x]));
    const roles = D.ROLES.map((r) => r.id);
    const cast = characters(st).map((t) => {
      const type = typeOf(t, st);
      const scenes = st.rows.map((r) => {
        const health = has(t, "cm-health") ? Math.max(1, Math.min(9, Math.round(Number(Eng.value(r.id, t.id, "cm-health")) || 5))) : 5;
        const rv = has(t, "cm-role") ? Eng.value(r.id, t.id, "cm-role") : null;
        const role = roles.includes(rv) ? rv : TYPES[type].roles.average;
        const fp = M().typeProfile(type, health);
        const offsets = {};
        D.AXES.forEach((a, i) => {
          if (!has(t, "cm-" + a.id)) return;
          const v = Number(Eng.value(r.id, t.id, "cm-" + a.id));
          if (isFinite(v) && Math.abs(v - fp[i]) >= 0.5) offsets[a.id] = v - fp[i];
        });
        return { health, role, offsets };
      });
      return { id: t.id, name: t.label, type, color: prefs.colors[t.id] || TYPES[type].color, scenes };
    });
    return { scenes: Math.max(1, st.rows.length), characters: cast };
  }
  /* Commands that make the timeline say what the matrix says for one character, every moment. */
  function pushCommands(mstate, id, st) {
    const Eng = E();
    st = st || Eng.state();
    const c = mstate.characters.find((x) => x.id === id);
    const t = st.tracks.find((x) => x.id === id);
    if (!c || !t) return { cmds: [], skipped: [] };
    const D = DATA();
    const cmds = [];
    const skipped = [];
    const on = new Set(t.curiosities);
    const room = () => on.size < Eng.LIMIT.perTrack;
    const ensure = (cur) => {
      if (on.has(cur)) return true;
      if (!room()) return skipped.push(cur), false;
      on.add(cur);
      cmds.push({ type: "addCuriosity", track: t.id, curiosity: cur });
      return true;
    };
    /* Health and role always have lanes; an axis gets one once the character departs from their type on it. */
    const nudged = new Set();
    c.scenes.forEach((sc) => Object.keys(sc.offsets || {}).forEach((k) => Math.abs(sc.offsets[k]) >= 0.5 && nudged.add(k)));
    const want = ["cm-health", "cm-role"].concat(D.AXES.filter((a) => nudged.has(a.id) || on.has("cm-" + a.id)).map((a) => "cm-" + a.id));
    want.forEach(ensure);
    st.rows.forEach((r, i) => {
      const sc = c.scenes[i];
      if (!sc) return;
      const fp = M().typeProfile(c.type, sc.health);
      const vals = { "cm-health": Math.round(sc.health), "cm-role": sc.role };
      D.AXES.forEach((a, k) => (vals["cm-" + a.id] = Math.max(0, Math.min(100, Math.round(fp[k] + ((sc.offsets || {})[a.id] || 0))))));
      want.forEach((cur) => {
        if (!on.has(cur)) return;
        const lane = st.lanes[t.id + "|" + cur];
        const now = lane && lane.points[r.id] != null ? lane.points[r.id] : t.curiosities.includes(cur) ? Eng.value(r.id, t.id, cur) : undefined;
        if (String(now) !== String(vals[cur])) cmds.push({ type: "setPoint", row: r.id, track: t.id, curiosity: cur, value: vals[cur] });
      });
    });
    return { cmds, skipped };
  }
  function labelOf(cur) {
    return root.CurioScale ? root.CurioScale.label(cur) : cur;
  }
  function push(mstate, id) {
    const Eng = E();
    const { cmds, skipped } = pushCommands(mstate, id);
    const c = mstate.characters.find((x) => x.id === id);
    let error = skipped.length ? `${c ? c.name : "This"} track is full, so ${skipped.map(labelOf).join(", ")} stayed off the timeline.` : "";
    if (!cmds.length) return { ok: true, error };
    const r = Eng.send({ type: "batch", label: `Character matrix: ${c ? c.name : "a character"}`, commands: cmds });
    if (!r.ok) error = r.error;
    return { ok: r.ok, error };
  }
  /* A track id no track has yet, so the commands that follow can name it. */
  let seq = 0;
  function newTrackId() {
    const st = E().state();
    let id;
    do id = "cm" + Date.now().toString(36) + "x" + ++seq;
    while (st.tracks.some((t) => t.id === id));
    return id;
  }
  function add(c) {
    const Eng = E();
    const id = newTrackId();
    const r = Eng.send({ type: "addTrack", id, kind: "character", label: c.name || "Character", curiosities: [] });
    if (!r.ok) return { error: r.error };
    const st = Eng.state();
    const t = st.tracks.find((x) => x.id === id) || st.tracks[st.tracks.length - 1];
    prefs.types[t.id] = c.type;
    prefs.colors[t.id] = c.color;
    prefs.picked = t.id;
    save();
    return { id: t.id };
  }
  const adapter = {
    label: "your film's timeline",
    pull,
    push,
    add,
    remove(id) {
      return E().send({ type: "removeTrack", track: id });
    },
    rename(id, name) {
      return E().send({ type: "renameTrack", track: id, label: name });
    },
    setType(id, n) {
      prefs.types[id] = n;
      save();
      redraw();
    },
    setColor(id, color) {
      prefs.colors[id] = color;
      save();
    },
    pick(id) {
      pick(id);
    },
    picked: () => track(),
    addScene() {
      return E().send({ type: "addRow" });
    },
  };

  /* Bring the matrix's own cast (built in the Archetype workspace) onto the timeline as character tracks. */
  function bringCast() {
    return load().then((ok) => {
      if (!ok) return { error: "The character matrix files did not load." };
      const Eng = E();
      let own;
      try {
        own = JSON.parse(localStorage.getItem("curiosities-character-matrix-v1") || "null");
      } catch (e) {}
      if (!own || !Array.isArray(own.characters) || !own.characters.length) own = JSON.parse(JSON.stringify(DATA().EXAMPLE));
      let st = Eng.state();
      const cmds = [];
      const need = Math.min(own.scenes || 1, Eng.LIMIT.rows) - st.rows.length;
      for (let i = 0; i < need; i++) cmds.push({ type: "addRow" });
      const ids = [];
      own.characters.forEach((c, i) => {
        const have = characters(st).find((t) => t.label === c.name);
        const id = have ? have.id : newTrackId();
        if (!have) cmds.push({ type: "addTrack", id, kind: "character", label: c.name, curiosities: [] });
        ids.push({ id, c });
      });
      if (cmds.length) {
        const r = Eng.send({ type: "batch", label: "Bring the character matrix's cast in", commands: cmds });
        if (!r.ok) return { error: r.error };
      }
      st = Eng.state();
      const placed = ids.filter(({ id }) => st.tracks.some((t) => t.id === id));
      const mstate = { characters: [] };
      placed.forEach(({ id, c }) => {
        prefs.types[id] = c.type;
        prefs.colors[id] = c.color;
        const scenes = st.rows.map((r, k) => (c.scenes || [])[Math.min(k, (c.scenes || []).length - 1)] || { health: 5, role: "stabilizer", offsets: {} });
        mstate.characters.push({ id, name: c.name, type: c.type, scenes });
      });
      save();
      const all = [];
      const skipped = [];
      placed.forEach(({ id }) => {
        const p = pushCommands(mstate, id, st);
        all.push(...p.cmds);
        skipped.push(...p.skipped);
      });
      if (all.length) {
        const r = Eng.send({ type: "batch", label: "Character matrix lanes for the cast", commands: all.slice(0, 500) });
        if (!r.ok) return { error: r.error };
      }
      if (placed[0]) pick(placed[0].id);
      return { ok: true, count: placed.length, missing: own.characters.length - placed.length, skipped };
    });
  }

  /* ---------- the 3D matrix over the Screen ---------- */
  let overlay = null;
  let unsub = null;
  function openMatrix() {
    return load().then((ok) => {
      if (!ok) return false;
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "cs-overlay";
        overlay.innerHTML = `<div class="cs-overlay-h"><strong>3D character matrix</strong><span>Linked to your film: characters are character tracks, scenes are moments.</span><button type="button" data-cs="close">Back to the Screen</button></div><div class="cs-overlay-b"></div>`;
        overlay.addEventListener("click", (e) => {
          if (e.target.closest("[data-cs=close]")) closeMatrix();
        });
      }
      document.body.appendChild(overlay);
      overlay.hidden = false;
      M().link(adapter);
      const body = overlay.querySelector(".cs-overlay-b");
      /* The matrix mounts once in the whole app; bring its element here (the Archetype workspace does the same). */
      const slot = document.createElement("div");
      body.innerHTML = "";
      body.appendChild(slot);
      const el = M().mount(slot);
      if (el && el !== slot) slot.replaceWith(el);
      if (!unsub && E()) unsub = E().on(() => overlay && !overlay.hidden && M() && M().refresh());
      return true;
    });
  }
  function closeMatrix() {
    if (!overlay) return;
    overlay.hidden = true;
    const body = overlay.querySelector(".cs-overlay-b");
    /* Leave the matrix element detached, so the Archetype workspace can put it back in its own slot. */
    body.innerHTML = "";
    if (M()) M().unlink();
    redraw();
  }

  /* ---------- the character bar in Details ---------- */
  function barHtml() {
    if (!E()) return "";
    const st = E().state();
    const list = characters(st);
    const cur = track(st);
    const D = DATA();
    const t = list.find((x) => x.id === cur);
    const type = t && D ? typeOf(t, st) : null;
    const types = D ? D.TYPES.map((x) => `<option value="${x.n}"${x.n === type ? " selected" : ""}>${x.n} · ${esc(x.name)}</option>`).join("") : "";
    if (!D) load().then((ok) => ok && redraw());
    const who = list.length
      ? `<label>Character <select data-cs="pick">${list.map((x) => `<option value="${esc(x.id)}"${x.id === cur ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>${D ? `<label>Type <select data-cs="type">${types}</select></label>` : ""}`
      : `<span>No characters on the timeline yet.</span>`;
    return `<div class="cs-bar">${who}
        <button type="button" data-cs="add">+ Character</button>
        <button type="button" data-cs="matrix">Open the 3D matrix</button>
        <button type="button" data-cs="bring" title="Put the cast you built in the Archetype workspace onto the timeline">Bring the matrix's cast in</button>
      </div>
      <p class="sc-k cs-k">${t ? `These controls write to <b>${esc(t.label)}</b>'s own lanes at the playhead. An axis with no lane follows their type at that health.` : "Add a character, or bring in the matrix's cast, to give each character their own lanes."} <span class="cs-msg"></span></p>`;
  }
  function message(text) {
    const el = document.querySelector(".cs-msg");
    if (el) el.textContent = text || "";
  }
  if (typeof document !== "undefined") {
    document.addEventListener("change", (e) => {
      const el = e.target.closest && e.target.closest("[data-cs]");
      if (!el) return;
      if (el.dataset.cs === "pick") pick(el.value);
      if (el.dataset.cs === "type") {
        const id = track();
        if (id) adapter.setType(id, Number(el.value));
      }
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest("button[data-cs]");
      if (!b) return;
      const act = b.dataset.cs;
      if (act === "matrix") openMatrix().then((ok) => !ok && message("The 3D matrix could not load."));
      if (act === "add") {
        load().then((ok) => {
          if (!ok) return message("The character matrix files did not load.");
          const n = characters().length + 1;
          const type = 1 + (n * 4) % 9;
          const r = add({ name: "Character " + n, type, color: DATA().TYPES[type - 1].color });
          if (r.error) return message(r.error);
          pick(r.id);
        });
      }
      if (act === "bring")
        bringCast().then((r) => {
          if (r.error) return message(r.error);
          redraw();
          setTimeout(() => message(`${r.count} character${r.count === 1 ? "" : "s"} on the timeline${r.missing ? `; ${r.missing} did not fit (a film holds ${E().LIMIT.tracks} tracks)` : ""}.`), 0);
        });
    });
  }

  root.CharacterScreen = { claims, track, trackHas, trackFor, pick, barHtml, openMatrix, closeMatrix, bringCast, load, adapter, pull, pushCommands };
})();
