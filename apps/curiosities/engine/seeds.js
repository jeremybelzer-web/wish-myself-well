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
   - catalogLinks(film) -> addLink commands for the app's own proximities (PROXIMITIES in model.js and the
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

  root.CurioSeeds = { starter, letterLinks, catalogLinks };
})();
