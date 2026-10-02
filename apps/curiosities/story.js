/* The story store: values that belong to a character across the scenes of the whole story
   (arc stage, Enneagram health, herd mentality...), as opposed to the board's values per panel.
   Shape: { scenes: <count>, characters: [names], values: { name: [ {curiosityId: value} per scene ] } }.
   localStorage key curiosities-story-v1. Characters start as the speakers of the board's scene. */

(function () {
  const KEY = "curiosities-story-v1";
  const DEFAULT_SCENES = 8;

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
    addCharacter(name) {
      name = String(name || "").trim();
      if (!name || store.characters.includes(name)) return false;
      store.characters.push(name);
      save();
      return true;
    },
    removeCharacter(name) {
      store.characters = store.characters.filter((c) => c !== name);
      delete store.values[name];
      if (!store.characters.length) store.characters = defaultCharacters();
      save();
    },
    /* Everything kept for one character: one object per scene. */
    get(character) {
      return rows(character).slice(0, store.scenes).map((o) => Object.assign({}, o));
    },
    /* An empty value clears the cell. */
    set(character, sceneIndex, id, value) {
      if (!store.characters.includes(character)) store.characters.push(character);
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
  };
})();
