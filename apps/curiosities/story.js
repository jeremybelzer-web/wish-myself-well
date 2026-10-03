/* The story store: values that belong to a character across the scenes of the whole story
   (arc stage, Enneagram health, herd mentality...), as opposed to the board's values per panel.
   Shape: { scenes: <count>, characters: [names], values: { name: [ {curiosityId: value} per scene ] } }.
   localStorage key curiosities-story-v1. Characters start as the speakers of the board's scene.
   "The film" (FILM) is a row of its own for the whole film's road: kept in values like a character but never
   listed by characters(); withFilm() lists it last.
   Automation can play per character: a patch's "who" list, or a character's own patch "c:<id>@<name>" (automation.js).
   Borrowing an emotional road (the Prism): planRoad(beats, source, count, target) stretches or squeezes a curated
   film's emotion values (the film overall, or one character's beats) onto the story's scenes; applyRoad(target, plan)
   writes them into a character's row or the film's row and keeps one undo (store.undo); undoRoad() puts it back. */

(function () {
  const KEY = "curiosities-story-v1";
  const DEFAULT_SCENES = 8;
  const FILM = "The film";
  const FEEL = { loving: 3, joyful: 4, curious: 1, melancholy: -3, anxious: -2, fearful: -4, angry: -3, triumphant: 5, absurd: 1, dreamlike: 0 };

  function defaultCharacters() {
    const names = [];
    try {
      const s = window.CuriosityBoard && window.CuriosityBoard.scene();
      (s ? s.lines : []).forEach((l) => {
        if (l.text !== "—" && !names.includes(l.who)) names.push(l.who);
      });
    } catch (e) {}
    return names.length ? names : ["Nessa", "Subject", "Ida", "Riven", "Petra"];
  }

  function load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    const st = saved && typeof saved === "object" ? saved : {};
    st.scenes = Math.max(1, Math.min(40, Number(st.scenes) || DEFAULT_SCENES));
    if (Array.isArray(st.characters)) st.characters = st.characters.filter((c) => c !== FILM);
    if (!Array.isArray(st.characters) || !st.characters.length) st.characters = defaultCharacters();
    if (!st.values || typeof st.values !== "object") st.values = {};
    return st;
  }
  const store = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {}
  }

  function rows(character) {
    const list = store.values[character] || (store.values[character] = []);
    while (list.length < store.scenes) list.push({});
    return list;
  }

  window.CuriosityStory = {
    KEY,
    FILM,
    scenes() {
      return Array.from({ length: store.scenes }, (_, i) => "Scene " + (i + 1));
    },
    setSceneCount(n) {
      store.scenes = Math.max(1, Math.min(40, Number(n) || DEFAULT_SCENES));
      save();
    },
    characters() {
      return store.characters.slice();
    },
    /* The characters, then the film itself. */
    withFilm() {
      return store.characters.concat([FILM]);
    },
    isFilm: (name) => name === FILM,
    /* The film's own row: one object per scene. */
    film() {
      return this.get(FILM);
    },
    addCharacter(name) {
      name = String(name || "").trim();
      if (!name || name === FILM || store.characters.includes(name)) return false;
      store.characters.push(name);
      save();
      return true;
    },
    removeCharacter(name) {
      if (name === FILM) return;
      store.characters = store.characters.filter((c) => c !== name);
      delete store.values[name];
      /* Their own automation patches go with them (automation.js keys "c:<id>@<name>"). */
      if (window.CurioAuto && window.CurioAuto.forgetCharacter) window.CurioAuto.forgetCharacter(name);
      if (!store.characters.length) store.characters = defaultCharacters();
      save();
    },
    /* Everything kept for one character: one object per scene. */
    get(character) {
      return rows(character).slice(0, store.scenes).map((o) => Object.assign({}, o));
    },
    /* An empty value clears the cell. */
    set(character, sceneIndex, id, value) {
      if (character !== FILM && !store.characters.includes(character)) store.characters.push(character);
      const r = rows(character);
      const i = Math.max(0, Number(sceneIndex) || 0);
      while (r.length <= i) r.push({});
      if (value == null || value === "") delete r[i][id];
      else r[i][id] = value;
      save();
    },
    values(character) {
      return this.get(character);
    },

    /* ---------- Borrow an emotional road (the Prism's "Borrow this film's emotional road") ---------- */
    FEEL,
    feelOf,
    /* Whose road a film records: the film overall, then each character who holds the screen
       (timePerCharacter) on a beat with a feeling set. */
    roadSources(beats) {
      const names = [];
      (beats || []).forEach((b) => {
        const v = (b && b.values) || {};
        const who = v.timePerCharacter;
        if (who && who !== "—" && hasFeeling(v) && !names.includes(String(who))) names.push(String(who));
      });
      return [FILM].concat(names);
    },
    /* The film's emotion values over its beats for one source (FILM = every beat), stretched or squeezed onto
       count scenes. Returns one {values, feel, beats: [first, last]} per scene; values is empty where nothing
       was recorded. target says which road word to fill in: emoRoadFilm for the film's row, emoRoadCharacter otherwise. */
    planRoad(beats, source, count, target) {
      const pts = [];
      (beats || []).forEach((b, i) => {
        const v = (b && b.values) || {};
        if (source !== FILM && String(v.timePerCharacter) !== String(source)) return;
        if (!hasFeeling(v)) return;
        const values = {};
        roadKeys(v).forEach((k) => (values[k] = v[k]));
        pts.push({ i, values, feel: feelOf(v) });
      });
      const n = Math.max(1, Number(count) || store.scenes);
      const out = [];
      for (let s = 0; s < n; s++) {
        if (!pts.length) {
          out.push({ values: {}, feel: null, beats: null });
          continue;
        }
        let group;
        if (pts.length >= n) {
          /* Squeeze: each scene takes its share of the beats, the strongest feeling in it, numbers averaged. */
          const a = Math.floor((s * pts.length) / n);
          const z = Math.max(a, Math.floor(((s + 1) * pts.length) / n) - 1);
          group = pts.slice(a, z + 1);
        } else {
          /* Stretch: each scene takes the nearest beat. */
          const at = n > 1 ? (s * (pts.length - 1)) / (n - 1) : 0;
          group = [pts[Math.round(at)]];
        }
        const strongest = group.reduce((x, y) => (Math.abs(y.feel || 0) > Math.abs(x.feel || 0) ? y : x), group[0]);
        const values = Object.assign({}, strongest.values);
        Object.keys(values).forEach((k) => {
          const nums = group.map((g) => Number(g.values[k])).filter((x) => Number.isFinite(x));
          if (nums.length === group.length && nums.length > 1 && isNum(values[k])) values[k] = Math.round((nums.reduce((p, q) => p + q, 0) / nums.length) * 10) / 10;
        });
        out.push({ values, feel: feelOf(values), beats: [group[0].i, group[group.length - 1].i] });
      }
      /* Where the scene sits on the road: highest and lowest points, and rising, falling or steady from the scene before. */
      const roadId = target === FILM ? "emoRoadFilm" : "emoRoadCharacter";
      if (hasCuriosity(roadId)) {
        const feels = out.map((o) => o.feel).filter((f) => f != null);
        const hi = Math.max(...feels);
        const lo = Math.min(...feels);
        let prev = null;
        let hiDone = false;
        let loDone = false;
        out.forEach((o) => {
          if (o.feel == null) return;
          let w = "steady";
          /* The first scene that reaches the top (or the bottom) is the highest (lowest) point; a stretch that stays there is steady. */
          if (hi > lo && o.feel === hi && !hiDone) (w = "highest point"), (hiDone = true);
          else if (hi > lo && o.feel === lo && !loDone) (w = "lowest point"), (loDone = true);
          else if (prev != null && o.feel > prev + 0.25) w = "rising";
          else if (prev != null && o.feel < prev - 0.25) w = "falling";
          o.values[roadId] = w;
          prev = o.feel;
        });
      }
      return out;
    },
    /* Write a plan into one row (a character or FILM). Keeps what was there for one undo. */
    applyRoad(target, plan, label) {
      const before = rows(target).slice(0, store.scenes).map((o) => Object.assign({}, o));
      const touched = [];
      (plan || []).forEach((p, i) => {
        if (i >= store.scenes) return;
        Object.entries(p.values || {}).forEach(([k, v]) => {
          if (v == null || v === "") return;
          this.set(target, i, k, v);
          if (!touched.includes(k)) touched.push(k);
        });
      });
      store.undo = { target, label: String(label || ""), touched, before: before.map((o) => Object.fromEntries(touched.filter((k) => k in o).map((k) => [k, o[k]]))) };
      save();
      return touched.length;
    },
    /* The last road written, or null: {target, label}. */
    lastRoad() {
      return store.undo ? { target: store.undo.target, label: store.undo.label } : null;
    },
    undoRoad() {
      const u = store.undo;
      if (!u) return false;
      const r = rows(u.target);
      u.before.forEach((old, i) => {
        if (!r[i]) return;
        u.touched.forEach((k) => {
          if (k in old) r[i][k] = old[k];
          else delete r[i][k];
        });
      });
      delete store.undo;
      save();
      return true;
    },
  };

  /* How good or bad a feeling is, -5 (worst) to 5 (best): the database's "Unhappy to happy" slider when set,
     else the emotion word, made stronger or weaker by its strength (0 to 5). The same reading as the Storyboard's band. */
  function isNum(x) {
    return x !== "" && x != null && Number.isFinite(Number(x));
  }
  function feelOf(v) {
    if (!v) return null;
    let x = isNum(v["emotion.valence"]) ? Number(v["emotion.valence"]) : FEEL[v.emotion];
    if (x == null || !Number.isFinite(x)) return null;
    if (isNum(v.emotionIntensity)) x = x * (0.5 + Number(v.emotionIntensity) / 10);
    return Math.max(-5, Math.min(5, Math.round(x * 10) / 10));
  }
  function hasCuriosity(id) {
    const list = window.CURIOSITIES || (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []);
    return list.some((c) => c.id === id);
  }
  /* The emotion values a beat carries: the emotion, its strength, and the emotion's own sliders ("emotion.valence"). */
  function roadKeys(v) {
    return Object.keys(v).filter((k) => (k === "emotion" || k === "emotionIntensity" || k.startsWith("emotion.")) && v[k] != null && v[k] !== "" && hasCuriosity(k));
  }
  function hasFeeling(v) {
    return roadKeys(v).length > 0;
  }
})();
