/* viewer/scene-focus.js: "Bring the scene into focus?", the pop-up that appears after you change a curiosity, a
   suite or a proximity (Jeremy, 2026-10-05 14:18Z). It asks whether you want to change the curiosities around
   the one you changed, so the scene's focus comes through stronger, and offers:
   - a box at the top to type what you want (it filters the list, and Enter keeps your own words as a note);
   - a menu of curiosities, with the 4 that would help this scene most picked to start;
   - a scrollable multiple-choice list of options under them, like "Bright blue sky (Setting)", "From below
     (Angle height)" or "\"Great to see you again\" (Extra character)".

   Where the ideas come from (no paid AI, nothing leaves the device): the scenes in the curiosity database
   (CuriosityDB.data.scenes, 80 made-up model scenes to start; the scene library thread adds real ones there).
   Every beat of every scene is compared with what you just changed; in the beats that match best, the
   curiosities that changed together with it are the "driving elements" of scenes like this one. They are
   ranked, the top 4 from different workspaces are picked, and their values in those beats become the options
   (each one says which scene it is like). A short hand-written list of picture phrases (PHRASES below) adds
   plain options such as "In a large mansion"; a phrase is dropped when its values do not fit the database.

   Changes are noticed in two places:
   - the Viewer (viewer/viewer.js onChange): a panel's own curiosity values (panel.v), its shot size and camera
     height, its spoken lines, and how people stand;
   - the engine (engine/state.js on): any cell of My film whose value changed, from a lane, a suite, a
     proximity or a hand edit.
   The pop-up waits until you stop changing things (and are not dragging or playing). "Not now" closes it and
   leaves a small ✨ button to bring it back; "Ask me after changes" can be turned off. Applying is one undo
   step in the Viewer or the engine. Automated test runs (navigator.webdriver) never pop it up on their own
   unless the page has ?focusask=1.

   API: window.CurioSceneFocus = { suggest(changed, now, opts), open(opts), close(), isOpen(), apply(options),
   settings(patch?), PHRASES }. suggest() also runs in Node (module.exports) for the checks:
   suggest([{ cur, value }], { cur: value }, { db, pick }) -> { changed, picks, curiosities, options, scenes }.
   Saved choices: localStorage "curiosities-scene-focus-v1". */
(function (root) {
  "use strict";
  const KEY = "curiosities-scene-focus-v1";
  const WAIT = 1400; /* ms after the last change before asking */
  const QUIET = 20000; /* after "Not now", don't pop up on its own for this long */
  const PICKS = 4;

  /* Plain picture phrases. topic is what shows in brackets; set is curiosity values (database ids, "x" is a
     curiosity's main slider, "x.y" its slider y); line is a spoken line for an extra character; under names
     the curiosity whose list it joins. */
  const PHRASES = [
    { label: "Bright blue sky", topic: "Setting", under: "timeOfDay", set: { timeOfDay: "day", "colorRange.paletteHue": "blue", lightingMood: "bright and warm" } },
    { label: "In a large mansion", topic: "Setting", under: "setStyle", set: { "setStyle.wealth": "palatial", "setStyle.ceiling": "cathedral" } },
    { label: "A rainy night street", topic: "Setting", under: "setting", set: { "setting.place": "a street", timeOfDay: "night", warmCool: "cool" } },
    { label: "A cozy kitchen", topic: "Setting", under: "setting", set: { "setting.place": "a kitchen", warmCool: "warm", lightingMood: "soft" } },
    { label: "A packed bar", topic: "Setting", under: "setting", set: { "setting.place": "a bar", "peopleCount.density": "packed" } },
    { label: "Out in a forest", topic: "Setting", under: "setting", set: { "setting.place": "a forest", "ambienceBed.place": "nature" } },
    { label: "From below shot", topic: "Camera angle", under: "angleHeight", set: { angleHeight: "low" } },
    { label: "From above, looking down", topic: "Camera angle", under: "angleHeight", set: { angleHeight: "high" } },
    { label: "Straight down, a bird's eye view", topic: "Camera angle", under: "angleHeight", set: { angleHeight: "overhead" } },
    { label: "Close on the face", topic: "Shot size", under: "shotSize", set: { shotSize: "close" } },
    { label: "Pull back to see the whole room", topic: "Shot size", under: "shotSize", set: { shotSize: "wide" } },
    { label: "Slow push in", topic: "Camera move", under: "cameraMove", set: { cameraMove: "push in" } },
    { label: "Golden hour glow", topic: "Light", under: "lightingMood", set: { timeOfDay: "dusk", warmCool: "warm", lightingMood: "bright and warm" } },
    { label: "Hard shadows", topic: "Light", under: "lightingMood", set: { lightingMood: "dark and harsh" } },
    { label: "The music swells", topic: "Music", under: "music", set: { music: "featured" } },
    { label: "The music drops out", topic: "Music", under: "music", set: { music: "none" } },
    { label: "Everyone goes quiet", topic: "Silence", under: "silence", set: { silence: "long" } },
    { label: "A crowd stops to watch", topic: "Background people", under: "peopleCount", set: { "peopleCount.background": 20 } },
    { label: "“Great to see you again”", topic: "Extra character", under: "peopleCount", set: {}, line: "Great to see you again." },
    { label: "“Wait, is that you?”", topic: "Extra character", under: "peopleCount", set: {}, line: "Wait, is that you?" },
    { label: "“Did I miss something?”", topic: "Extra character", under: "peopleCount", set: {}, line: "Did I miss something?" },
  ];

  /* ---------- the database: sliders, scales, labels ---------- */
  const parent = (k) => String(k).split(".")[0];
  function sliderOf(db, key) {
    const c = db && db.get ? db.get("curiosity", parent(key)) : null;
    if (!c || !Array.isArray(c.sliders)) return null;
    const sid = key.indexOf(".") > 0 ? key.slice(key.indexOf(".") + 1) : c.main;
    const s = c.sliders.find((x) => x && x.id === sid);
    return s ? { c, s } : null;
  }
  function fits(db, key, v) {
    const x = sliderOf(db, key);
    if (!x) return false;
    if (x.s.scale) return x.s.scale.includes(v);
    return typeof v === "number" && x.s.range && v >= x.s.range.min && v <= x.s.range.max;
  }
  function pos(db, key, v) {
    const x = sliderOf(db, key);
    if (!x) return null;
    if (x.s.scale) {
      const i = x.s.scale.indexOf(v);
      return i < 0 ? null : x.s.scale.length > 1 ? i / (x.s.scale.length - 1) : 0;
    }
    const r = x.s.range;
    if (!r || typeof v !== "number" || r.max === r.min) return null;
    return Math.max(0, Math.min(1, (v - r.min) / (r.max - r.min)));
  }
  function name(db, key) {
    const x = sliderOf(db, key);
    if (!x) return String(key);
    return key.indexOf(".") > 0 ? x.c.label + ": " + x.s.label.toLowerCase() : x.c.label;
  }
  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  function valueWords(db, key, v) {
    const x = sliderOf(db, key);
    if (x && x.s.range && typeof v === "number") return v + " of " + x.s.range.max + (x.s.range.unit ? " " + x.s.range.unit : "");
    return cap(v);
  }
  const same = (a, b) => a === b || (a != null && b != null && String(a) === String(b));

  /* ---------- the scenes as beats, values carried forward ---------- */
  let beatCache = null;
  function beats(db) {
    const scenes = (db && db.data && db.data.scenes) || [];
    if (beatCache && beatCache.n === scenes.length && beatCache.db === db) return beatCache.list;
    const list = [];
    scenes.forEach((sc) => {
      let carry = {};
      (sc.beats || []).forEach((b, i) => {
        const set = (b && b.values) || {};
        const moved = Object.keys(set).filter((k) => i === 0 || !same(carry[k], set[k]));
        carry = Object.assign({}, carry, set);
        list.push({ scene: sc, i, all: carry, moved: i === 0 ? [] : moved, note: b.note || "" });
      });
    });
    beatCache = { n: scenes.length, db, list };
    return list;
  }
  const sceneName = (sc) => String(sc.title || sc.id).replace(/^Model scene:\s*/i, "");

  /* ---------- the suggester ---------- */
  function suggest(changed, now, opts) {
    opts = opts || {};
    const db = opts.db || root.CuriosityDB;
    now = now || {};
    changed = (changed || []).filter((c) => c && c.cur && sliderOf(db, c.cur));
    const changedIds = new Set(changed.map((c) => parent(c.cur)));
    /* 1. how much each beat looks like what you just did */
    const scored = [];
    beats(db).forEach((b) => {
      if (!changed.length) return;
      let s = 0;
      changed.forEach((c) => {
        if (!(c.cur in b.all)) return;
        const p = pos(db, c.cur, c.value);
        const q = pos(db, c.cur, b.all[c.cur]);
        s += p == null || q == null ? (same(c.value, b.all[c.cur]) ? 1 : 0.3) : 1 - Math.abs(p - q);
        if (b.moved.includes(c.cur)) s += 0.6; /* the scene made the same kind of move here */
      });
      s /= changed.length;
      if (s > 0.35) scored.push({ b, s });
    });
    scored.sort((a, b) => b.s - a.s);
    const perScene = {};
    const kept = scored.filter((x) => (perScene[x.b.scene.id] = (perScene[x.b.scene.id] || 0) + 1) <= 2).slice(0, 30);
    /* 2. the curiosities that moved with it: the driving elements */
    const rank = {};
    const options = {};
    const addOpt = (key, v, w, sc) => {
      if (!fits(db, key, v) || same(now[key], v)) return;
      const id = parent(key);
      const list = (options[id] = options[id] || []);
      let o = list.find((x) => x.key === key && same(x.value, v));
      if (!o) list.push((o = { key, value: v, w: 0, scenes: [] }));
      o.w += w;
      if (sc && o.scenes.length < 3 && !o.scenes.includes(sceneName(sc))) o.scenes.push(sceneName(sc));
    };
    kept.forEach(({ b, s }) => {
      b.moved.forEach((k) => {
        if (changedIds.has(parent(k)) || !sliderOf(db, k)) return;
        rank[parent(k)] = (rank[parent(k)] || 0) + s * 2;
        addOpt(k, b.all[k], s * 2, b.scene);
      });
      Object.keys(b.all).forEach((k) => {
        if (changedIds.has(parent(k)) || b.moved.includes(k) || !sliderOf(db, k) || same(now[k], b.all[k])) return;
        rank[parent(k)] = (rank[parent(k)] || 0) + s * 0.25;
        addOpt(k, b.all[k], s * 0.25, b.scene);
      });
    });
    /* no scene knows it: lean on the usual helpers of a scene's focus */
    if (!kept.length) ["shotSize", "angleHeight", "lightingMood", "music", "setting", "peopleCount"].forEach((id, i) => (rank[id] = 6 - i));
    const ranked = Object.keys(rank)
      .filter((id) => !changedIds.has(id))
      .sort((a, b) => rank[b] - rank[a]);
    /* 3. the top PICKS, at most one per workspace, so they come from different parts of filmmaking */
    const picks = [];
    const seen = new Set();
    ranked.forEach((id) => {
      if (picks.length >= (opts.pick || PICKS)) return;
      const c = db.get("curiosity", id);
      const ws = (c && c.workspace) || id;
      if (seen.has(ws)) return;
      seen.add(ws);
      picks.push(id);
    });
    ranked.forEach((id) => picks.length < (opts.pick || PICKS) && !picks.includes(id) && picks.push(id));
    /* 4. the options per curiosity: picture phrases, then values from the scenes, then the rest of its scale */
    const out = {};
    const curList = ranked.slice();
    PHRASES.forEach((p) => p.under && !curList.includes(p.under) && !changedIds.has(p.under) && db.get("curiosity", p.under) && curList.push(p.under));
    curList.forEach((id) => {
      const list = [];
      /* the plain picture phrases first, then the values the scenes used */
      PHRASES.filter((p) => p.under === id).forEach((p) => {
        const set = {};
        let ok = true;
        Object.keys(p.set).forEach((k) => (fits(db, k, p.set[k]) ? (set[k] = p.set[k]) : (ok = false)));
        if (!ok) return;
        list.push({ id: id + ":phrase:" + p.label, cur: id, label: p.label + " (" + p.topic + ")", set, line: p.line || "", why: "", w: 0 });
      });
      (options[id] || [])
        .sort((a, b) => b.w - a.w)
        .slice(0, 8)
        .forEach((o) =>
          list.push({
            id: id + ":" + o.key + "=" + o.value,
            cur: id,
            label: valueWords(db, o.key, o.value) + " (" + name(db, o.key) + ")",
            set: { [o.key]: o.value },
            why: o.scenes.length ? "Like “" + o.scenes.join("”, “") + "”" : "",
            w: o.w,
          })
        );
      const main = sliderOf(db, id);
      if (main && main.s.scale)
        main.s.scale.forEach((v) => {
          if (same(now[id], v) || list.some((o) => Object.keys(o.set).length === 1 && same(o.set[id], v))) return;
          list.push({ id: id + ":" + id + "=" + v, cur: id, label: valueWords(db, id, v) + " (" + name(db, id) + ")", set: { [id]: v }, why: "", w: 0, more: true });
        });
      if (list.length) out[id] = list;
    });
    const scenes = [];
    kept.forEach(({ b }) => scenes.length < 5 && !scenes.includes(sceneName(b.scene)) && scenes.push(sceneName(b.scene)));
    return {
      changed: changed.map((c) => ({ cur: c.cur, value: c.value, label: name(db, c.cur) })),
      picks: picks.filter((id) => out[id]),
      curiosities: Object.keys(out).map((id) => ({ id, label: name(db, id), rank: rank[id] || 0 })),
      options: out,
      scenes,
    };
  }

  if (typeof window === "undefined") {
    if (typeof module !== "undefined") module.exports = { suggest, PHRASES, beats };
    return;
  }

  /* ================= the page ================= */
  const V = () => window.CurioViewer;
  const E = () => window.CurioEngine;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const AUTO = !navigator.webdriver || /[?&]focusask=1/.test(location.search);

  function load() {
    try {
      return Object.assign({ ask: true }, JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (e) {
      return { ask: true };
    }
  }
  let prefs = load();
  function settings(patch) {
    if (patch) {
      prefs = Object.assign(prefs, patch);
      try {
        localStorage.setItem(KEY, JSON.stringify(prefs));
      } catch (e) {}
    }
    return Object.assign({}, prefs);
  }

  const CSS = `
.sf-back { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; padding: 16px; }
.sf-box { width: min(560px, 100%); max-height: min(720px, calc(100vh - 32px)); display: flex; flex-direction: column; gap: 10px; background: #1b1b1f; color: #e8e8ec; border: 1px solid #34343b; border-radius: 12px; box-shadow: 0 18px 50px rgba(0,0,0,.5); padding: 14px 14px 12px; font: 14px/1.4 system-ui, -apple-system, Segoe UI, sans-serif; }
.sf-head { display: flex; align-items: flex-start; gap: 10px; }
.sf-head h2 { margin: 0; font-size: 17px; flex: 1; }
.sf-x { background: none; border: 0; color: #9b9ba3; font-size: 20px; cursor: pointer; line-height: 1; }
.sf-why { margin: 0; color: #b4b4bc; font-size: 13px; }
.sf-type { width: 100%; box-sizing: border-box; padding: 9px 11px; border-radius: 8px; border: 1px solid #3c3c44; background: #111114; color: #fff; font-size: 14px; }
.sf-type:focus { outline: 2px solid #22d3ee; outline-offset: 0; }
.sf-curs { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sf-cur { border: 1px solid #3c3c44; background: #24242a; color: #d6d6db; border-radius: 999px; padding: 4px 10px; font-size: 13px; cursor: pointer; }
.sf-cur[aria-pressed="true"] { background: #0e7490; border-color: #22d3ee; color: #fff; }
.sf-more { border: 1px solid #3c3c44; background: #24242a; color: #d6d6db; border-radius: 999px; padding: 4px 8px; font-size: 13px; max-width: 200px; }
.sf-list { overflow-y: auto; min-height: 120px; flex: 1 1 auto; border: 1px solid #2e2e33; border-radius: 8px; padding: 4px 0; background: #151518; }
.sf-group { padding: 6px 12px 2px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #22d3ee; }
.sf-opt { display: flex; gap: 9px; align-items: flex-start; padding: 6px 12px; cursor: pointer; }
.sf-opt:hover { background: #202026; }
.sf-opt input { margin-top: 3px; accent-color: #22d3ee; }
.sf-opt small { display: block; color: #8d8d96; font-size: 12px; }
.sf-empty { padding: 14px 12px; color: #9b9ba3; }
.sf-foot { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.sf-foot label { flex: 1; color: #b4b4bc; font-size: 13px; display: flex; gap: 6px; align-items: center; min-width: 170px; }
.sf-btn { border: 1px solid #3c3c44; background: #24242a; color: #e8e8ec; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.sf-go { background: #0891b2; border-color: #22d3ee; color: #fff; font-weight: 600; }
.sf-go:disabled { opacity: .5; cursor: default; }
.sf-pill { position: fixed; right: 16px; bottom: 16px; z-index: 8999; border: 1px solid #22d3ee; background: #1b1b1f; color: #e8e8ec; border-radius: 999px; padding: 8px 14px; font: 13px system-ui, sans-serif; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.4); }
.sf-pill[hidden], .sf-back[hidden] { display: none; }
@media (max-width: 600px) { .sf-back { align-items: flex-end; padding: 0; } .sf-box { border-radius: 12px 12px 0 0; max-height: 88vh; } }
`;
  let el = null;
  let pill = null;
  let view = null; /* { result, source, chosen: Set of curiosity ids, ticked: Set of option ids, text } */
  let pending = { source: "", changed: {}, now: {} };
  let timer = 0;
  let quietUntil = 0;
  let applying = false;
  let pointerDown = false;

  function ensure() {
    if (el) return;
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    el = document.createElement("div");
    el.className = "sf-back";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Bring the scene into focus");
    document.body.appendChild(el);
    el.addEventListener("click", onClick);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onChangeEl);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") notNow();
      if (e.key === "Enter" && e.target.classList.contains("sf-type")) {
        e.preventDefault();
        keepWords();
      }
      e.stopPropagation(); /* the Viewer's and Screen's shortcuts stay out of the typing */
    });
    pill = document.createElement("button");
    pill.type = "button";
    pill.className = "sf-pill";
    pill.hidden = true;
    pill.textContent = "✨ Ideas for this scene";
    pill.addEventListener("click", () => open({ source: pending.source || (view && view.source) }));
    document.body.appendChild(pill);
  }

  /* ---------- what the scene is now ---------- */
  function shotOf(s) {
    return s >= 2.6 ? "wide" : s >= 0.8 ? "medium" : s >= 0.35 ? "close" : "insert";
  }
  function heightOf(h) {
    return h < -20 ? "floor" : h < -4 ? "low" : h <= 12 ? "eye" : h < 45 ? "high" : "overhead";
  }
  function panelNow(film, p) {
    const now = Object.assign({}, p.v || {});
    if (p.cam) {
      now.shotSize = shotOf(+p.cam.shot);
      now.angleHeight = heightOf(+p.cam.height);
    }
    const words = (p.words || []).map((w) => w.text).join(" ");
    const poses = (film.objects || [])
      .filter((o) => o.kind === "person")
      .map((o) => (p.place && p.place[o.id] && p.place[o.id].pose) || "")
      .join(",");
    return { id: p.id, now, words, poses, n: (p.words || []).length };
  }
  function viewerNow() {
    const v = V();
    if (!v || !v.live) return null;
    const L = v.live();
    return L.panel ? panelNow(L.film, L.panel) : null;
  }
  /* every panel as it stands, so a change is compared with the same panel before it */
  function viewerAll() {
    const v = V();
    const out = {};
    if (!v || !v.live) return out;
    const L = v.live();
    (L.film.panels || []).forEach((p) => (out[p.id] = panelNow(L.film, p)));
    return out;
  }
  function engineNow() {
    const e = E();
    const S = window.CurioScreen;
    if (!e || !e.state) return null;
    const st = e.state();
    const r = st.rows[Math.max(0, Math.min(st.rows.length - 1, S && S.row ? S.row() : 0))];
    if (!r) return null;
    const now = {};
    const dest = (e.result() || {}).dest || {};
    Object.keys(dest).forEach((k) => {
      const [row, , cur] = k.split("|");
      if (row === r.id && dest[k] != null) now[cur] = dest[k];
    });
    return { row: r.id, now };
  }

  /* ---------- noticing changes ---------- */
  let lastViewer = {};
  function onViewer() {
    if (applying) return;
    const s = viewerNow();
    const all = viewerAll();
    const before = s && lastViewer[s.id];
    lastViewer = all;
    if (!s || !before) return;
    const changed = {};
    Object.keys(Object.assign({}, before.now, s.now)).forEach((k) => {
      if (!same(before.now[k], s.now[k]) && s.now[k] != null) changed[k] = s.now[k];
    });
    if (before.words !== s.words) changed.wordsAmount = Math.min(5, Math.max(0, s.n + 1));
    if (before.poses !== s.poses) changed.gesture = 3;
    const keys = Object.keys(changed);
    if (!keys.length || keys.length > 6) return; /* a whole film loading is not an edit */
    note("viewer", changed, s.now);
  }
  let lastDest = null;
  const IGNORE = /^(Undo|Redo|Load|Reset|Import a film|Change sending)/;
  function onEngine(ev) {
    const dest = (ev && ev.result && ev.result.dest) || {};
    const before = lastDest;
    lastDest = Object.assign({}, dest);
    if (applying || !before || IGNORE.test((ev && ev.label) || "")) return;
    const changed = {};
    Object.keys(dest).forEach((k) => {
      if (!same(before[k], dest[k]) && dest[k] != null) {
        const cur = k.split("|")[2];
        if (!(cur in changed)) changed[cur] = dest[k];
      }
    });
    if (!Object.keys(changed).length || Object.keys(changed).length > 12) return;
    const s = engineNow();
    note("engine", changed, s ? s.now : {});
  }
  function note(source, changed, now) {
    if (pending.source !== source) pending = { source, changed: {}, now: {} };
    Object.assign(pending.changed, changed);
    pending.now = now || {};
    if (!AUTO || !prefs.ask || isOpen()) return;
    clearTimeout(timer);
    timer = setTimeout(fire, WAIT);
  }
  function fire() {
    const playing = V() && V().playing && V().playing();
    if (pointerDown || playing) {
      timer = setTimeout(fire, WAIT);
      return;
    }
    if (Date.now() < quietUntil) {
      showPill();
      return;
    }
    open({ source: pending.source, changed: pending.changed, now: pending.now });
  }
  function showPill() {
    ensure();
    pill.hidden = false;
  }

  /* ---------- the pop-up ---------- */
  function open(opts) {
    opts = opts || {};
    ensure();
    const source = opts.source || pending.source || (V() && V().isOpen && V().isOpen() ? "viewer" : "engine");
    const fresh = source === "viewer" ? viewerNow() : engineNow();
    const now = opts.now || (fresh && fresh.now) || {};
    let changed = opts.changed || pending.changed || {};
    if (!Object.keys(changed).length) changed = {};
    const list = Object.keys(changed).map((cur) => ({ cur, value: changed[cur] }));
    const result = suggest(list, now, {});
    view = { result, source, chosen: new Set(result.picks), ticked: new Set(), text: "", extra: [] };
    pending = { source, changed: {}, now: {} };
    pill.hidden = true;
    el.hidden = false;
    draw();
    const t = el.querySelector(".sf-type");
    if (t) t.focus();
    return result;
  }
  function close() {
    if (el) el.hidden = true;
  }
  function notNow() {
    close();
    quietUntil = Date.now() + QUIET;
    showPill();
  }
  const isOpen = () => !!(el && !el.hidden);

  function visibleOptions() {
    const r = view.result;
    const q = view.text.trim().toLowerCase();
    const ids = q ? r.curiosities.map((c) => c.id) : Array.from(view.chosen);
    const groups = [];
    ids.forEach((id) => {
      let opts = (r.options[id] || []).slice();
      if (q) opts = opts.filter((o) => o.label.toLowerCase().includes(q) || (r.curiosities.find((c) => c.id === id) || {}).label.toLowerCase().includes(q));
      if (opts.length) groups.push({ id, label: (r.curiosities.find((c) => c.id === id) || { label: id }).label, opts: opts.slice(0, q ? 6 : 40) });
    });
    if (view.extra.length) groups.unshift({ id: "_mine", label: "Your words", opts: view.extra });
    return groups;
  }
  function draw() {
    const r = view.result;
    const names = r.changed.map((c) => c.label);
    const what = names.length ? "You changed " + listWords(names) + "." : "Here are ideas for this moment.";
    const like = r.scenes.length ? " Scenes like this (" + r.scenes.slice(0, 2).map((s) => "“" + esc(s) + "”").join(", ") + ") also lean on these." : "";
    const chosen = Array.from(view.chosen);
    const others = r.curiosities.filter((c) => !view.chosen.has(c.id));
    const groups = visibleOptions();
    el.innerHTML = `<div class="sf-box">
  <div class="sf-head"><h2>✨ Bring the scene into focus?</h2><button type="button" class="sf-x" data-sf="close" aria-label="Close">×</button></div>
  <p class="sf-why">${esc(what)} Want to change what's around it so the scene's focus comes through stronger?${like}</p>
  <input class="sf-type" type="text" placeholder="Type what you want, like “a sunny beach” or “from below”" value="${esc(view.text)}" aria-label="Type what you want">
  <div class="sf-curs" aria-label="Curiosities">${chosen
    .map((id) => `<button type="button" class="sf-cur" aria-pressed="true" data-cur="${esc(id)}">${esc(labelOf(id))}</button>`)
    .join("")}${others.length ? `<select class="sf-more" aria-label="Add a curiosity"><option value="">+ More curiosities</option>${others.map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join("")}</select>` : ""}</div>
  <div class="sf-list" role="group" aria-label="Options">${
    groups.length
      ? groups
          .map(
            (g) =>
              `<div class="sf-group">${esc(g.label)}</div>` +
              g.opts
                .map(
                  (o) =>
                    `<label class="sf-opt"><input type="checkbox" data-opt="${esc(o.id)}"${view.ticked.has(o.id) ? " checked" : ""}><span>${esc(o.label)}${o.why ? `<small>${esc(o.why)}</small>` : ""}</span></label>`
                )
                .join("")
          )
          .join("")
      : `<div class="sf-empty">${view.text ? "Nothing in the list matches. Press Enter to keep your words as a note on this moment." : "Pick a curiosity above to see options."}</div>`
  }</div>
  <div class="sf-foot"><label><input type="checkbox" class="sf-ask"${prefs.ask ? " checked" : ""}> Ask me after changes</label>
  <button type="button" class="sf-btn" data-sf="later">Not now</button>
  <button type="button" class="sf-btn sf-go" data-sf="apply"${view.ticked.size ? "" : " disabled"}>${view.ticked.size ? "Change " + view.ticked.size : "Change"}</button></div>
</div>`;
  }
  const labelOf = (id) => (view.result.curiosities.find((c) => c.id === id) || { label: id }).label;
  function listWords(a) {
    return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }
  function onClick(e) {
    if (e.target === el) return notNow();
    const b = e.target.closest("[data-sf],[data-cur]");
    if (!b) return;
    if (b.dataset.cur) {
      view.chosen.delete(b.dataset.cur);
      return draw();
    }
    if (b.dataset.sf === "close" || b.dataset.sf === "later") return notNow();
    if (b.dataset.sf === "apply") applyTicked();
  }
  function onInput(e) {
    if (!e.target.classList.contains("sf-type")) return;
    view.text = e.target.value;
    const pos = e.target.selectionStart;
    draw();
    const t = el.querySelector(".sf-type");
    t.focus();
    t.setSelectionRange(pos, pos);
  }
  function onChangeEl(e) {
    const t = e.target;
    if (t.classList.contains("sf-more") && t.value) {
      view.chosen.add(t.value);
      return draw();
    }
    if (t.classList.contains("sf-ask")) return settings({ ask: t.checked });
    if (t.dataset.opt) {
      if (t.checked) view.ticked.add(t.dataset.opt);
      else view.ticked.delete(t.dataset.opt);
      const go = el.querySelector(".sf-go");
      go.disabled = !view.ticked.size;
      go.textContent = view.ticked.size ? "Change " + view.ticked.size : "Change";
    }
  }
  function keepWords() {
    const words = view.text.trim();
    if (!words) return;
    const groups = visibleOptions().filter((g) => g.id !== "_mine");
    if (groups.length) {
      /* the best match in the list is ticked */
      view.ticked.add(groups[0].opts[0].id);
    } else {
      const o = { id: "_mine:" + words, cur: "_mine", label: words, set: {}, note: words, why: "Kept as a note on this moment" };
      view.extra.push(o);
      view.ticked.add(o.id);
    }
    view.text = "";
    draw();
  }
  function findOpt(id) {
    if (id.startsWith("_mine:")) return view.extra.find((o) => o.id === id);
    const cur = id.split(":")[0];
    return (view.result.options[cur] || []).find((o) => o.id === id);
  }
  function applyTicked() {
    const list = Array.from(view.ticked).map(findOpt).filter(Boolean);
    const done = apply(list, view.source);
    close();
    return done;
  }

  /* ---------- applying: one undo step ---------- */
  const SHOT = { insert: 0.3, close: 0.5, medium: 1.1, wide: 3.5 };
  const HEIGHT = { floor: -30, low: -10, eye: 2, high: 25, overhead: 80 };
  function apply(list, source) {
    list = (list || []).filter(Boolean);
    if (!list.length) return { ok: false };
    source = source || (V() && V().isOpen && V().isOpen() ? "viewer" : "engine");
    applying = true;
    try {
      return source === "viewer" ? toViewer(list) : toEngine(list);
    } finally {
      applying = false;
      lastViewer = viewerAll();
      if (E() && E().result) lastDest = Object.assign({}, E().result().dest || {});
    }
  }
  function toViewer(list) {
    const v = V();
    if (!v || !v.live) return { ok: false };
    v.edit("scene focus");
    const L = v.live();
    const p = L.panel;
    p.v = p.v || {};
    const speaking = new Set((p.words || []).map((w) => w.who));
    const people = (L.film.objects || []).filter((o) => o.kind === "person");
    const extra = people.find((o) => !speaking.has(o.id)) || people[0];
    list.forEach((o) => {
      Object.keys(o.set || {}).forEach((k) => {
        const val = o.set[k];
        p.v[k] = val;
        if (k === "shotSize" && SHOT[val] != null) p.cam.shot = SHOT[val];
        if (k === "angleHeight" && HEIGHT[val] != null) p.cam.height = HEIGHT[val];
      });
      if (o.line) {
        p.words = p.words || [];
        p.words.push(extra ? { who: extra.id, text: o.line } : { text: o.line });
      }
      if (o.note) p.note = (p.note ? p.note + " " : "") + "Idea: " + o.note;
    });
    v.changed(true);
    return { ok: true, source: "viewer", count: list.length };
  }
  function toEngine(list) {
    const e = E();
    const Sc = window.CurioScale;
    const s = engineNow();
    if (!e || !s) return { ok: false };
    const st = e.state();
    const commands = [];
    const tracks = st.tracks.map((t) => ({ id: t.id, kind: t.kind, curiosities: t.curiosities.slice() }));
    const CAMERA = /^(shotSize|angleHeight|cameraMove|cameraCarry|moveSpeed|lensLength|dutch)$/;
    list.forEach((o) => {
      const set = Object.assign({}, o.set || {});
      if (o.line && !Object.keys(set).length) set.wordsAmount = Math.min(5, (Number(s.now.wordsAmount) || 2) + 1);
      Object.keys(set).forEach((k) => {
        const val = Sc && Sc.fix ? Sc.fix(k, set[k]) : set[k];
        if (val == null) return;
        let t = tracks.find((x) => x.curiosities.includes(k));
        if (!t) {
          t = tracks.find((x) => x.kind === (CAMERA.test(parent(k)) ? "camera" : "master")) || tracks[0];
          if (!t || t.curiosities.length >= 24) return;
          t.curiosities.push(k);
          commands.push({ type: "addCuriosity", track: t.id, curiosity: k });
        }
        commands.push({ type: "setSource", row: s.row, track: t.id, curiosity: k, value: val });
      });
    });
    if (!commands.length) return { ok: false };
    const r = e.send({ type: "batch", commands });
    return Object.assign({ source: "engine", count: list.length }, r);
  }

  /* ---------- wiring ---------- */
  function hook() {
    const v = V();
    if (v && v.onChange && !hook.viewer) {
      hook.viewer = true;
      v.onChange(onViewer);
      lastViewer = viewerAll();
    }
    const e = E();
    if (e && e.on && !hook.engine) {
      hook.engine = true;
      e.on(onEngine);
      lastDest = Object.assign({}, (e.result() || {}).dest || {});
    }
    return hook.viewer && hook.engine;
  }
  document.addEventListener("pointerdown", () => (pointerDown = true), true);
  document.addEventListener("pointerup", () => (pointerDown = false), true);
  document.addEventListener("pointercancel", () => (pointerDown = false), true);
  let tries = 0;
  (function wait() {
    if (hook() || ++tries > 60) return;
    setTimeout(wait, 500);
  })();

  window.CurioSceneFocus = { suggest, open, close, isOpen, apply: (list, source) => apply(list, source), settings, PHRASES, pending: () => JSON.parse(JSON.stringify(pending)) };
})(typeof window !== "undefined" ? window : globalThis);
