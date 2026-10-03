/* engine/catalog.js: what the engine knows about each curiosity's values. Part of the engine core (no page).

   window.CurioScale
   - domain(id): { kind: "choice", options } or { kind: "range", min, max, step }. Uses the app's own
     CurioAuto.domain when it is loaded, so the engine and automation always agree.
   - pos(id, value): where a value sits on its scale, 0 (low end) to 1 (high end). A list of words is a scale
     in the order the catalog gives. A few word lists are not a scale in that order (the emotions), so
     ENERGY gives them one: dreamlike and melancholy are calm, angry and triumphant are charged.
   - at(id, p): the value at position p (0 to 1), snapped to the scale.
   - step(id, value, n): n steps up (n > 0) or down (n < 0), held at the ends.
   - fix(id, value): the value if it is allowed, otherwise the nearest allowed one (or null when nothing fits).
   - start(id): the value a new cell starts with (the catalog's own value, or the middle of the scale).
   - label(id): the curiosity's plain name.
   - A curiosity's own graded sliders (the curiosity database) work too, named "curiosity.slider"
     ("shotSize.headroom"): their scale or range comes from window.CuriosityDB.

   window.CurioTracks: the starting layout of a film, the tracks of the letter's table. A track is a column of
   the clip matrix: Master (the film-wide curiosities), Camera, and one track per character. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const LIST = typeof CURIOSITIES !== "undefined" ? CURIOSITIES : root.CURIOSITIES || [];
  const byId = Object.create(null);
  LIST.forEach((c) => (byId[c.id] = c));

  /* Emotions as a scale of energy (how charged the moment is), so "the cutting rate follows the emotion" means
     something. Decision 7 in the engine's decision log. */
  const ENERGY = {
    emotion: ["dreamlike", "melancholy", "loving", "curious", "absurd", "joyful", "anxious", "fearful", "triumphant", "angry"],
  };

  function own(id) {
    const c = byId[id];
    if (!c) return { kind: "choice", options: [] };
    if (c.options && c.options.length) return { kind: "choice", options: c.options.slice() };
    if (c.kind === "range" || (c.min != null && c.max != null)) return { kind: "range", min: Number(c.min) || 0, max: Number(c.max) || 0, step: Number(c.step) || 1 };
    return { kind: "choice", options: ["off", "on"] };
  }
  /* A graded slider inside a curiosity (the curiosity database's lenses), named "curiosity.slider":
     "shotSize.headroom", "wardrobe.era". Its scale or range comes from the database. */
  function slider(id) {
    const dot = id.indexOf(".");
    const DB = root.CuriosityDB;
    if (dot < 1 || !DB || typeof DB.get !== "function") return null;
    let c = null;
    try {
      c = DB.get("curiosity", id.slice(0, dot));
    } catch (e) {
      c = null;
    }
    const s = c && Array.isArray(c.sliders) ? c.sliders.find((x) => x && x.id === id.slice(dot + 1)) : null;
    if (!s) return null;
    if (Array.isArray(s.scale) && s.scale.length) return { c, s, d: { kind: "choice", options: s.scale.map(String) } };
    if (s.range && isFinite(s.range.min) && isFinite(s.range.max) && s.range.max > s.range.min) return { c, s, d: { kind: "range", min: Number(s.range.min), max: Number(s.range.max), step: Number(s.range.step) || 1 } };
    return null;
  }
  function mainScale(id) {
    const DB = root.CuriosityDB;
    let c = null;
    try {
      c = DB && typeof DB.get === "function" ? DB.get("curiosity", id) : null;
    } catch (e) {
      c = null;
    }
    const s = c && Array.isArray(c.sliders) ? c.sliders.find((x) => x && (x.id === "setting" || x.id === c.main)) : null;
    return s && Array.isArray(s.scale) && s.scale.length > 1 ? s.scale.map(String) : null;
  }
  const cache = Object.create(null);
  function domain(id) {
    id = String(id);
    if (cache[id]) return cache[id];
    const sl = !byId[id] ? slider(id) : null;
    if (sl) return (cache[id] = Object.freeze(sl.d.kind === "choice" ? { kind: "choice", options: Object.freeze(sl.d.options) } : sl.d));
    let d = null;
    try {
      if (root.CurioAuto && root.CurioAuto.domain && byId[id]) d = root.CurioAuto.domain(id);
    } catch (e) {
      d = null;
    }
    if (!d || (d.kind === "choice" && !(d.options && d.options.length)) || (d.kind === "range" && !(d.max > d.min))) d = own(id);
    /* A curiosity the old catalog only knew as off/on, whose database row grades its main setting (pedal: nothing
       held, one thing held, several held), uses that scale, so its window, presets and plain words can set it. */
    if (d.kind === "choice" && d.options.length === 2 && d.options[0] === "off" && d.options[1] === "on") {
      const g = mainScale(id);
      if (g) d = { kind: "choice", options: g };
    }
    if (d.kind === "choice" && ENERGY[id]) d = { kind: "choice", options: ENERGY[id].concat(d.options.filter((o) => !ENERGY[id].includes(o))) };
    d = Object.freeze(d.kind === "choice" ? { kind: "choice", options: Object.freeze(d.options.slice()) } : { kind: "range", min: d.min, max: d.max, step: d.step || 1 });
    cache[id] = d;
    return d;
  }
  function known(id) {
    return !!byId[id] || !!slider(String(id));
  }
  function label(id) {
    if (byId[id]) return byId[id].label || id;
    const sl = slider(String(id));
    return sl ? (sl.c.label || sl.c.id) + ": " + String(sl.s.label || sl.s.id).toLowerCase() : String(id);
  }
  function group(id) {
    if (byId[id]) return byId[id].group || "";
    const sl = slider(String(id));
    return sl ? sl.c.group || "" : "";
  }
  function snapRange(d, n) {
    if (!isFinite(n)) return null;
    const s = d.step > 0 ? d.step : 1;
    let v = Math.round((n - d.min) / s) * s + d.min;
    v = Math.min(d.max, Math.max(d.min, v));
    return Math.round(v * 1e6) / 1e6;
  }
  function fix(id, value) {
    const d = domain(id);
    if (value == null || value === "" || (typeof value !== "number" && typeof value !== "string")) return null;
    if (d.kind === "range") {
      const n = typeof value === "number" ? value : Number(value);
      return isFinite(n) ? snapRange(d, n) : null;
    }
    const s = String(value);
    if (d.options.includes(s)) return s;
    const lower = d.options.find((o) => o.toLowerCase() === s.toLowerCase());
    return lower || null;
  }
  function pos(id, value) {
    const d = domain(id);
    const v = fix(id, value);
    if (v == null) return null;
    if (d.kind === "range") return d.max > d.min ? (v - d.min) / (d.max - d.min) : 0;
    const i = d.options.indexOf(v);
    return d.options.length > 1 ? i / (d.options.length - 1) : 0;
  }
  function at(id, p) {
    const d = domain(id);
    p = Math.min(1, Math.max(0, Number(p) || 0));
    if (d.kind === "range") return snapRange(d, d.min + p * (d.max - d.min));
    if (!d.options.length) return null;
    return d.options[Math.round(p * (d.options.length - 1))];
  }
  function steps(id) {
    const d = domain(id);
    if (d.kind === "range") return Math.max(1, Math.round((d.max - d.min) / (d.step || 1)));
    return Math.max(1, d.options.length - 1);
  }
  function step(id, value, n) {
    const p = pos(id, value);
    if (p == null) return fix(id, value);
    const total = steps(id);
    return at(id, Math.round(p * total + (Number(n) || 0)) / total);
  }
  function start(id) {
    const c = byId[id];
    const sl = !c ? slider(String(id)) : null;
    const v = c && c.value != null ? fix(id, c.value) : sl && sl.s.from != null ? fix(id, sl.s.from) : null;
    return v != null ? v : at(id, 0.5);
  }

  root.CurioScale = { domain, known, label, group, fix, pos, at, step, steps, start, ENERGY };

  /* The starting tracks: the letter's table (cutting rate, emotion, angles, who is on screen, wardrobe, props,
     setting, camera, blocking, line volume, movement while speaking), using the app's own curiosity ids. */
  const TRACKS = [
    { kind: "master", label: "Master", curiosities: ["emotion", "emotionIntensity", "setting", "cutRate", "angleCount", "lightingLens", "props"] },
    { kind: "camera", label: "Camera", curiosities: ["shotSize", "angleHeight", "cameraMove", "cameraCarry", "moveSpeed", "lensLength"] },
    { kind: "character", label: "Character", curiosities: ["volume", "gesture", "characterPath", "blocking", "mainEra"] },
  ];
  root.CurioTracks = {
    TEMPLATE: TRACKS,
    /* Tracks for a cast: Master, Camera, then one character track per name (two to start). */
    forCast(names) {
      const cast = (names && names.length ? names : ["Character A", "Character B"]).slice(0, 6);
      const out = [];
      const ok = (ids) => ids.filter((id) => known(id) || !LIST.length);
      out.push({ id: "master", kind: "master", label: "Master", curiosities: ok(TRACKS[0].curiosities) });
      out.push({ id: "camera", kind: "camera", label: "Camera", curiosities: ok(TRACKS[1].curiosities) });
      cast.forEach((n, i) => out.push({ id: "char" + (i + 1), kind: "character", label: String(n), curiosities: ok(TRACKS[2].curiosities) }));
      return out;
    },
  };
})();
