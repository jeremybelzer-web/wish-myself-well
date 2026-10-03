/* momentum/rates.js: how fast attention moves in films people love, to compare your own film against.

   The default curated list below is Claude's ESTIMATES from general film knowledge, not measurements: how
   many times a minute attention moves to a new curiosity, how long it usually rests, how long one family
   (camera, voice, comedy...) holds it in a row, what share of the time each family holds it, and which cues
   move it. They are counts and shares only (no scenes, lines or shots), and every one carries
   estimate: true. Trace a film (Library, Curated films, or Share a film) and measure() turns it into a
   measured profile with the same fields, so a real number can replace a guess. Jeremy's own favorites
   replace this list when he sends them.

   window.CurioRates
   - DEFAULT_FILMS        the estimated profiles
   - measure(study, opts) a measured profile from a traced film (estimate: false)
   - limitFor(profile)    the "held too long" limit that profile suggests (2.5 times its usual family run)
   - compare(stats, profile) -> plain sentences comparing a reading of your film with the profile
   - average(profiles)    one profile from several (your curated list as one target) */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;

  const F = (id, title, year, spm, medianDwell, medianFamilyRun, quietShare, shares, cues, why) => ({
    id, title, year, estimate: true, source: "Claude's estimate from general film knowledge, not measured",
    switchesPerMinute: spm, medianDwell, medianFamilyRun, quietShare, familyShare: shares, cueShare: cues, why,
  });
  const DEFAULT_FILMS = [
    F("pulp-fiction", "Pulp Fiction", 1994, 9, 5.5, 9, 0.08,
      { voice: 0.3, feeling: 0.14, plot: 0.14, comedy: 0.12, camera: 0.08, movement: 0.06, music: 0.06, place: 0.03, wardrobe: 0.03, cut: 0.02, light: 0.01, mind: 0.01 },
      { audio: 0.38, visual: 0.26, plot: 0.14, thought: 0.14, movement: 0.08 },
      "Long talk scenes hold on voices, then a sudden act of violence or a needle drop moves attention hard."),
    F("jaws", "Jaws", 1975, 11, 4.5, 7, 0.1,
      { plot: 0.2, feeling: 0.18, voice: 0.16, camera: 0.12, music: 0.1, movement: 0.08, place: 0.07, mind: 0.03, comedy: 0.03, cut: 0.02, light: 0.01 },
      { visual: 0.32, audio: 0.22, plot: 0.2, movement: 0.14, thought: 0.12 },
      "The unseen shark: music and faces hold attention while the danger stays off screen."),
    F("fury-road", "Mad Max: Fury Road", 2015, 28, 2, 4, 0.03,
      { movement: 0.24, camera: 0.18, effects: 0.14, feeling: 0.1, plot: 0.1, place: 0.08, music: 0.07, voice: 0.03, cut: 0.03, wardrobe: 0.02, light: 0.01 },
      { visual: 0.38, movement: 0.36, plot: 0.12, audio: 0.1, thought: 0.04 },
      "Very fast, but the subject is kept in the center of the frame so the eye never has to hunt."),
    F("paddington-2", "Paddington 2", 2017, 14, 3.5, 6, 0.06,
      { comedy: 0.22, feeling: 0.16, movement: 0.12, voice: 0.12, plot: 0.1, place: 0.09, camera: 0.06, wardrobe: 0.04, music: 0.04, cut: 0.03, light: 0.02 },
      { visual: 0.3, thought: 0.22, movement: 0.2, audio: 0.14, plot: 0.14 },
      "Gags built from the set and props, each one paying off later in the plot."),
    F("spirited-away", "Spirited Away", 2001, 8, 6, 10, 0.14,
      { place: 0.2, feeling: 0.16, movement: 0.14, plot: 0.12, effects: 0.08, camera: 0.07, music: 0.07, mind: 0.05, voice: 0.05, light: 0.04, comedy: 0.02 },
      { visual: 0.44, movement: 0.2, plot: 0.14, thought: 0.12, audio: 0.1 },
      "The place itself holds attention, and quiet pauses (the train ride) let it rest before the next push."),
    F("parasite", "Parasite", 2019, 10, 5, 8, 0.09,
      { plot: 0.2, voice: 0.16, feeling: 0.14, place: 0.14, camera: 0.08, comedy: 0.08, movement: 0.07, mind: 0.05, light: 0.03, music: 0.03, wardrobe: 0.02 },
      { visual: 0.3, plot: 0.22, audio: 0.2, thought: 0.16, movement: 0.12 },
      "The house (stairs, up and down) carries the theme; plot turns move attention more than cuts do."),
    F("grand-budapest", "The Grand Budapest Hotel", 2014, 16, 3, 5.5, 0.05,
      { comedy: 0.18, place: 0.14, camera: 0.14, voice: 0.14, plot: 0.1, movement: 0.1, wardrobe: 0.06, feeling: 0.06, cut: 0.04, light: 0.02, music: 0.02 },
      { visual: 0.4, audio: 0.2, thought: 0.16, movement: 0.14, plot: 0.1 },
      "Centered frames and whip pans: the camera itself moves attention, with costume and set as jokes."),
    F("get-out", "Get Out", 2017, 9, 5.5, 9, 0.12,
      { feeling: 0.2, plot: 0.18, voice: 0.14, mind: 0.1, camera: 0.1, music: 0.08, comedy: 0.06, place: 0.06, movement: 0.05, light: 0.03 },
      { visual: 0.3, thought: 0.22, plot: 0.2, audio: 0.18, movement: 0.1 },
      "Faces that feel wrong hold attention; comedy releases it just enough before the next scare."),
    F("toy-story", "Toy Story", 1995, 15, 3.2, 5.5, 0.05,
      { comedy: 0.2, movement: 0.16, voice: 0.16, feeling: 0.14, plot: 0.14, camera: 0.07, place: 0.05, music: 0.04, cut: 0.02, light: 0.01, effects: 0.01 },
      { visual: 0.28, movement: 0.24, audio: 0.2, thought: 0.14, plot: 0.14 },
      "Every joke also moves the rivalry forward, so the laughs and the plot share the same moments."),
    F("whiplash", "Whiplash", 2014, 17, 2.8, 5, 0.1,
      { music: 0.22, feeling: 0.18, voice: 0.14, camera: 0.12, plot: 0.1, movement: 0.1, cut: 0.08, mind: 0.04, light: 0.02 },
      { audio: 0.34, visual: 0.3, movement: 0.16, plot: 0.1, thought: 0.1 },
      "Cut to the beat: music decides when attention moves, and a stopped band is the loudest moment."),
    F("before-sunrise", "Before Sunrise", 1995, 4, 12, 20, 0.1,
      { voice: 0.4, feeling: 0.2, mind: 0.1, place: 0.1, movement: 0.06, camera: 0.04, plot: 0.04, comedy: 0.03, music: 0.02, light: 0.01 },
      { audio: 0.46, thought: 0.2, visual: 0.2, movement: 0.08, plot: 0.06 },
      "Long takes of talk: attention moves by ideas and looks rather than cuts, and the city keeps changing behind them."),
    F("hot-fuzz", "Hot Fuzz", 2007, 26, 2.2, 4, 0.04,
      { comedy: 0.22, cut: 0.12, camera: 0.12, voice: 0.12, movement: 0.1, plot: 0.1, feeling: 0.06, music: 0.06, effects: 0.04, place: 0.04, wardrobe: 0.02 },
      { visual: 0.4, audio: 0.2, movement: 0.16, thought: 0.14, plot: 0.1 },
      "Fast comic cuts on small actions, and nearly every early detail comes back as a payoff."),
  ];

  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);

  function measure(study, opts) {
    const r = A().fromStudy(study, opts);
    const s = r.stats;
    return {
      id: "measured-" + (study.id || "film"),
      title: study.title || study.name || "Traced film",
      estimate: false,
      source: `Measured from a trace of ${r.beats} beats, ${round(r.seconds)} seconds`,
      switchesPerMinute: s.switchesPerMinute,
      medianDwell: s.medianDwell,
      medianFamilyRun: s.medianFamilyRun,
      quietShare: s.quietShare,
      familyShare: s.familyShare,
      cueShare: s.cueShare,
      momentum: s.momentum,
      transitions: s.transitions,
    };
  }
  function limitFor(profile) {
    return Math.max(4, Math.round((profile && profile.medianFamilyRun ? profile.medianFamilyRun : 8) * 2.5));
  }
  function average(profiles) {
    const list = (profiles || []).filter(Boolean);
    if (!list.length) return null;
    const avg = (k) => round(list.reduce((a, p) => a + (p[k] || 0), 0) / list.length, 2);
    const mix = (k) => {
      const out = {};
      list.forEach((p) => Object.entries(p[k] || {}).forEach(([f, v]) => (out[f] = (out[f] || 0) + v / list.length)));
      return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]).map(([f, v]) => [f, round(v, 3)]));
    };
    return {
      id: "average",
      title: list.length === 1 ? list[0].title : `Average of ${list.length} films`,
      estimate: list.some((p) => p.estimate),
      source: list.some((p) => p.estimate) ? "Includes estimates" : "Measured",
      switchesPerMinute: avg("switchesPerMinute"),
      medianDwell: avg("medianDwell"),
      medianFamilyRun: avg("medianFamilyRun"),
      quietShare: avg("quietShare"),
      familyShare: mix("familyShare"),
      cueShare: mix("cueShare"),
    };
  }
  function label(fam) {
    const f = M().family(fam);
    return f ? f.label : fam;
  }
  /* Plain sentences, the biggest differences first. */
  function compare(stats, profile) {
    if (!stats || !profile) return [];
    const out = [];
    const name = profile.title + (profile.estimate ? " (estimated)" : "");
    const ratio = profile.switchesPerMinute ? stats.switchesPerMinute / profile.switchesPerMinute : 1;
    if (ratio < 0.75) out.push({ weight: 1 - ratio, text: `Attention moves ${stats.switchesPerMinute} times a minute in your film against about ${profile.switchesPerMinute} in ${name}. Add more cues that move it on.` });
    else if (ratio > 1.33) out.push({ weight: ratio - 1, text: `Attention moves ${stats.switchesPerMinute} times a minute in your film against about ${profile.switchesPerMinute} in ${name}. It may feel rushed; let some moments rest.` });
    else out.push({ weight: 0, text: `Attention moves about as often as in ${name} (${stats.switchesPerMinute} against ${profile.switchesPerMinute} times a minute).` });
    const fams = new Set(Object.keys(stats.familyShare || {}).concat(Object.keys(profile.familyShare || {})));
    fams.forEach((f) => {
      const mine = (stats.familyShare || {})[f] || 0;
      const theirs = (profile.familyShare || {})[f] || 0;
      const d = mine - theirs;
      if (Math.abs(d) < 0.08) return;
      out.push({
        weight: Math.abs(d),
        text: d > 0 ? `${label(f)} holds ${Math.round(mine * 100)}% of the time in your film, against ${Math.round(theirs * 100)}% in ${name}.` : `${label(f)} holds only ${Math.round(mine * 100)}% of the time in your film, against ${Math.round(theirs * 100)}% in ${name}. It could take attention more often.`,
      });
    });
    if (profile.quietShare && stats.quietShare + 0.05 < profile.quietShare) out.push({ weight: 0.05, text: `${name} uses more quiet cues (a stop, a silence, stillness) to move attention: ${Math.round(profile.quietShare * 100)}% against your ${Math.round(stats.quietShare * 100)}%.` });
    /* The pace sentence first, then the biggest differences. */
    return [out[0]].concat(out.slice(1).sort((a, b) => b.weight - a.weight)).map((o) => o.text);
  }

  const api = { DEFAULT_FILMS, measure, limitFor, compare, average };
  root.CurioRates = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
