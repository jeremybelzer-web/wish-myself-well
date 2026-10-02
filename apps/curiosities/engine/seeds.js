/* engine/seeds.js: a starting film, the letter's starting links, and the app's catalog proximities turned into
   links. Part of the engine core (no page).

   window.CurioSeeds
   - starter(cast?) -> a film (rows, tracks, source) to begin with: eight moments, Master, Camera and two
     characters, and an emotional road down the Master track so the links have something to follow
     (Jeremy's words #8).
   - letterLinks(film) -> addLink commands for the rules in the letter's table that fit the film's tracks:
     the cutting rate and the number of angles follow the emotion, movement while speaking follows the
     line's volume, and the shot widens as the movement grows (the letter's "camera angle when movement is
     large": a proximity, not a curiosity).
   - dbPack() -> the app's proximities and proximity suites as one link pack (engine/LINKS.md), for the
     importLinks command: the database's own export when it has one, else converted from the database.
   - catalogLinks(film) -> (older) addLink commands for the app's own proximities (PROXIMITIES in model.js and the
     database) whose cause and effect are both on a track. "x is <value>" becomes the leader's condition,
     "y rises / drops" becomes rise / fall, "y is <value>" becomes set. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;

  function starter(cast) {
    const tracks = root.CurioTracks.forCast(cast);
    const rows = Array.from({ length: 8 }, (_, i) => ({ id: "r" + (i + 1), label: "Moment " + (i + 1) }));
    const source = {};
    const road = ["curious", "curious", "anxious", "anxious", "angry", "melancholy", "loving", "joyful"];
    const loud = [2, 3, 3, 4, 5, 2, 2, 3];
    rows.forEach((r, i) => {
      if (tracks[0].curiosities.includes("emotion")) source[r.id + "|master|emotion"] = road[i];
      tracks
        .filter((t) => t.kind === "character")
        .forEach((t, j) => {
          if (t.curiosities.includes("volume")) source[r.id + "|" + t.id + "|volume"] = root.CurioScale.fix("volume", Math.max(1, loud[i] - j)) ;
        });
    });
    return { name: "My film", rows, tracks, source, next: 100 };
  }

  const has = (film, track, cur) => film.tracks.some((t) => t.id === track && t.curiosities.includes(cur));
  function letterLinks(film) {
    const out = [];
    const add = (l) => has(film, l.from.track, l.from.curiosity) && has(film, l.to.track, l.to.curiosity) && out.push(Object.assign({ type: "addLink", seed: "letter" }, l));
    add({ label: "The cutting rate follows the emotion", from: { track: "master", curiosity: "emotion" }, to: { track: "master", curiosity: "cutRate" }, does: "follow", amount: 1 });
    add({ label: "The number of angles follows the emotion", from: { track: "master", curiosity: "emotion" }, to: { track: "master", curiosity: "angleCount" }, does: "follow", amount: 0.75 });
    film.tracks
      .filter((t) => t.kind === "character")
      .forEach((t) => {
        add({ label: "Movement while speaking follows " + t.label + "'s volume", from: { track: t.id, curiosity: "volume" }, to: { track: t.id, curiosity: "gesture" }, does: "follow", amount: 1 });
      });
    const first = film.tracks.find((t) => t.kind === "character");
    if (first) add({ label: "The shot widens as " + first.label + "'s movement grows", from: { track: first.id, curiosity: "gesture" }, to: { track: "camera", curiosity: "shotSize" }, does: "follow", amount: 0.5 });
    return out;
  }

  function catalogLinks(film) {
    const list = typeof PROXIMITIES !== "undefined" ? PROXIMITIES : root.PROXIMITIES || [];
    const where = (cur) => {
      const t = film.tracks.find((x) => x.curiosities.includes(cur));
      return t ? t.id : null;
    };
    const out = [];
    list.forEach((p) => {
      if (!p || !p.x || !p.y || !p.x.curiosity || !p.y.curiosity) return;
      const ft = where(p.x.curiosity);
      const tt = where(p.y.curiosity);
      if (!ft || !tt || (ft === tt && p.x.curiosity === p.y.curiosity)) return;
      const from = { track: ft, curiosity: p.x.curiosity };
      if (p.x.is != null) from.is = p.x.is;
      if (p.x.change === "rises" || p.x.change === "drops") from.change = p.x.change;
      const l = { type: "addLink", seed: "catalog:" + p.id, label: p.label || "When " + p.when + ", " + p.then, from, to: { track: tt, curiosity: p.y.curiosity }, within: p.within || 0, amount: 0.25 };
      if (p.y.is != null) {
        l.does = "set";
        l.value = p.y.is;
      } else l.does = p.y.change === "drops" ? "fall" : "rise";
      out.push(l);
    });
    return out;
  }

  /* The app's proximities and proximity suites as one link pack (engine/LINKS.md), for importLinks.
     Prefers the curiosity database's own export (window.CURIOSITY_LINKS, set by its install(), or
     CuriosityDB.links()); with an older database, converts its proximities here, then model.js's
     PROXIMITIES for any it does not have. Either way the result is a pack importLinks reads. */
  const DOES_OF = { rises: "rise", drops: "fall", changes: "moveWith" };
  function sliderAt(p, id, max) {
    const s = (p.sliders || []).find((x) => x && x.id === id);
    if (!s || !isFinite(Number(s.from))) return null;
    const top = max || (s.range && Number(s.range.max)) || 0;
    return top > 0 ? Math.max(0, Math.min(1, Number(s.from) / top)) : null;
  }
  function side(r, db) {
    if (!r || typeof r !== "object" || r.suite || typeof r.curiosity !== "string") return null;
    const out = { curiosity: r.curiosity };
    if (typeof r.slider === "string" && r.slider) {
      const c = db && db.get ? db.get("curiosity", r.curiosity) : null;
      if (!(c && c.main === r.slider)) out.slider = r.slider;
    }
    if (r.is != null) out.is = r.is;
    if (r.change === "rises" || r.change === "drops") out.change = r.change;
    return out;
  }
  function fromDb(p, db) {
    const from = side(p.when, db);
    const to = side(p.then, db);
    if (!from || !to) return null;
    const l = { id: p.id, label: p.label || "", from, to: { curiosity: to.curiosity }, within: Math.max(0, Math.min(16, Number(p.within) || 0)) };
    if (to.slider) l.to.slider = to.slider;
    if (p.then.is != null) {
      l.does = "set";
      l.value = p.then.is;
    } else l.does = DOES_OF[p.then.change] || "follow";
    const effect = sliderAt(p, "effect");
    l.amount = effect != null ? Math.round(effect * 100) / 100 : 0.25;
    const chance = sliderAt(p, "chance", 100);
    if (chance != null && chance < 1) l.chance = Math.round(chance * 100) / 100;
    return l;
  }
  function dbPack() {
    let ready = root.CURIOSITY_LINKS;
    if (!(ready && Array.isArray(ready.links)) && root.CuriosityDB && typeof root.CuriosityDB.links === "function")
      try {
        ready = root.CuriosityDB.links();
      } catch (e) {
        ready = null;
      }
    if (ready && ready.format === "curiosities-links" && Array.isArray(ready.links)) return ready;
    const db = root.CuriosityDB;
    const pack = { format: "curio-links", v: 1, source: "app", links: [], suites: [], unsupported: 0 };
    const have = new Set();
    let data = null;
    try {
      data = db && db.toJSON ? db.toJSON() : null;
    } catch (e) {
      data = null;
    }
    if (data && Array.isArray(data.proximities)) {
      data.proximities.forEach((p) => {
        const l = p && fromDb(p, db);
        if (l) {
          pack.links.push(l);
          have.add(l.id);
        } else pack.unsupported++;
      });
      (data.proximitySuites || []).forEach((x) => x && Array.isArray(x.members) && pack.suites.push({ id: x.id, label: x.label || x.id, members: x.members.filter((m) => have.has(m)) }));
    }
    const list = typeof PROXIMITIES !== "undefined" ? PROXIMITIES : root.PROXIMITIES || [];
    list.forEach((p) => {
      if (!p || have.has(p.id) || !p.x || !p.y) return;
      const l = fromDb({ id: p.id, label: p.label || "When " + p.when + ", " + p.then, when: p.x, then: p.y, within: p.within }, null);
      if (l) {
        pack.links.push(l);
        have.add(l.id);
      } else pack.unsupported++;
    });
    const auto = root.CurioAuto && root.CurioAuto.PROXIMITY_SUITES;
    (auto || []).forEach((x) => x && !pack.suites.some((y) => y.id === x.id) && Array.isArray(x.members) && pack.suites.push({ id: x.id, label: x.label || x.id, members: x.members.filter((m) => have.has(m)) }));
    pack.suites = pack.suites.filter((x) => x.members.length);
    return pack;
  }

  root.CurioSeeds = { starter, letterLinks, catalogLinks, dbPack };
})();
