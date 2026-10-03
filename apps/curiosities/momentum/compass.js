/* momentum/compass.js: the Prism Compass. Where should the film's attention go next, so that it keeps feeling
   like it is going somewhere? It reads where your film is now (a reading from attention.js) against the
   films you love (profiles from rates.js) and points at the family of curiosities to move attention to next,
   with the cue to use and a curiosity to try.

   Part of the momentum core (no page).

   window.CurioCompass
   - point(reading, profiles, opts) -> {
       now:      { family, seconds, limit, left }   who holds attention, for how long, and seconds left
                                                    before the usual stretch in your films runs out
       options:  [{ family, score, reasons: [text], cue, how, curiosity, note }]  best first (the needle);
                 how: { n, cue, share, quiet } is how measured films make this exact move (rates.howItMoves),
                 and when present its cue is the option's cue
       cue:      the kind of cue your films use that yours uses least
       quiet:    true when your films use more quiet cues (a stop, a silence) than yours
       basis:    "measured" when any profile has family-to-family counts from a traced film, else "shares"
     }
     The score for each family adds up four things, each 0 to 1:
       follows   how often your films move from the current family to this one (traced films only)
       missing   how much more of the time your films give this family than yours does
       rested    how long since this family last held attention in your film
       push      how hard the family's curiosities push the story (from their momentum notes)
     The current family scores nothing: attention has to move.
   - move(option, board) -> { id, value } | null: one live board curiosity of that family stepped one notch,
     the smallest real change that moves attention there (the caller applies it with board.set). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const R = () => root.CurioRates;
  const WEIGHTS = { follows: 1.2, missing: 1.0, rested: 0.7, push: 0.4 };
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);

  /* Family-to-family shares from every profile that has them. */
  function follows(profiles, from) {
    const out = {};
    let total = 0;
    (profiles || []).forEach((p) => {
      const row = p && p.transitions && p.transitions[from];
      if (!row) return;
      Object.entries(row).forEach(([to, n]) => {
        out[to] = (out[to] || 0) + n;
        total += n;
      });
    });
    if (!total) return null;
    Object.keys(out).forEach((k) => (out[k] /= total));
    return out;
  }
  /* The curiosities of a family, strongest push first, written notes before workspace ones. */
  let byFamily = null;
  function familyCuriosities(family) {
    if (!byFamily) {
      byFamily = {};
      M().all().forEach((n) => (byFamily[n.family] = byFamily[n.family] || []).push(n));
    }
    return (byFamily[family] || [])
      .slice()
      .filter((n) => n.family === family)
      .sort((a, b) => b.push - a.push || (a.source === "workspace") - (b.source === "workspace"));
  }

  function point(reading, profiles, opts) {
    const o = opts || {};
    const list = (profiles || []).filter(Boolean);
    const target = R().average(list) || { familyShare: {}, cueShare: {}, medianFamilyRun: 8 };
    const stats = (reading && reading.stats) || { familyShare: {}, cueShare: {}, familyRuns: [] };
    const runs = stats.familyRuns || [];
    const run = stats.currentRun || null;
    const endT = runs.length ? runs[runs.length - 1].to : 0;
    const limit = (reading && reading.limit) || R().limitFor(target);
    const usual = target.medianFamilyRun || 8;
    const now = run ? { family: run.family, seconds: round(run.dur, 1), limit, left: round(Math.max(0, usual - run.dur), 1), usual } : null;
    const fol = run ? follows(list, run.family) : null;
    const lastSeen = {};
    runs.forEach((r) => (lastSeen[r.family] = r.to));
    const span = Math.max(1, endT - (runs[0] ? runs[0].from : 0));
    const options = M()
      .FAMILIES.map((f) => {
        if (run && f.id === run.family) return null;
        const mine = stats.familyShare[f.id] || 0;
        const theirs = target.familyShare[f.id] || 0;
        const missing = Math.max(0, Math.min(1, (theirs - mine) / 0.2));
        const rested = lastSeen[f.id] == null ? 1 : Math.min(1, (endT - lastSeen[f.id]) / Math.min(span, 60));
        const curs = familyCuriosities(f.id);
        const push = curs.length ? curs.slice(0, 5).reduce((a, c) => a + c.push, 0) / Math.min(5, curs.length) / 5 : 0;
        const follow = fol ? Math.min(1, (fol[f.id] || 0) / 0.35) : 0;
        if (!theirs && !fol) return null; /* a family your films never use is not a direction */
        const score = WEIGHTS.follows * follow + WEIGHTS.missing * missing + WEIGHTS.rested * rested + WEIGHTS.push * push;
        const reasons = [];
        if (fol && fol[f.id]) reasons.push(`In your films, ${Math.round(fol[f.id] * 100)}% of the time attention leaves ${M().family(run.family).label} for ${f.label}.`);
        if (missing > 0.05) reasons.push(`Your films give it ${Math.round(theirs * 100)}% of the time; yours gives it ${Math.round(mine * 100)}%.`);
        if (lastSeen[f.id] == null) reasons.push("It has not held attention yet.");
        else if (rested > 0.5) reasons.push(`It last held attention ${Math.round(endT - lastSeen[f.id])} seconds ago.`);
        const top = curs[0];
        /* The cue measured films use for this very move, when they have one. */
        const how = run && R().howItMoves ? R().howItMoves(list, run.family, f.id) : null;
        if (how) {
          const cl = (M().CUES.find((c) => c.id === how.cue) || { label: how.cue }).label.toLowerCase();
          reasons.push(`Your films make this move most often on a ${cl} (${Math.round(how.share * 100)}% of ${how.n} time${how.n === 1 ? "" : "s"})${how.quiet >= 0.3 ? ", often when something stops" : ""}.`);
        }
        return { family: f.id, label: f.label, score: round(score, 3), reasons, how, cue: how ? how.cue : top ? top.cue : f.cue, curiosity: top ? top.id : null, note: top || null, parts: { follow: round(follow, 2), missing: round(missing, 2), rested: round(rested, 2), push: round(push, 2) } };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    /* The cue your films lean on that yours uses least. */
    let cue = null;
    let gap = 0;
    M().CUES.forEach((c) => {
      const d = (target.cueShare[c.id] || 0) - (stats.cueShare[c.id] || 0);
      if (d > gap) {
        gap = d;
        cue = c.id;
      }
    });
    return {
      now,
      options: options.slice(0, o.max || 13),
      cue,
      cueGap: round(gap, 3),
      quiet: (target.quietShare || 0) > (stats.quietShare || 0) + 0.04,
      basis: list.some((p) => p.transitions && Object.keys(p.transitions).length) ? "measured" : "shares",
      target: target.title,
    };
  }

  /* One notch along a live board curiosity of the family. */
  function move(option, board) {
    if (!option || !board || typeof CURIOSITIES === "undefined") return null;
    const live = CURIOSITIES.filter((c) => c.live && M().familyOf(c.id) === option.family && (Array.isArray(c.options) || c.kind === "range"));
    if (!live.length) return null;
    const vals = board.values();
    /* The compass's own pick if it is on the board, else the one that pushes the story hardest (notes written
       for a curiosity before ones borrowed from its workspace). */
    const rank = (c) => M().note(c.id).push + (M().note(c.id).source === "workspace" ? 0 : 0.5);
    const pick = live.find((c) => c.id === option.curiosity) || live.slice().sort((a, b) => rank(b) - rank(a))[0];
    const v = vals[pick.id];
    if (Array.isArray(pick.options)) {
      const i = pick.options.indexOf(v);
      const j = i < 0 ? 0 : i + 1 < pick.options.length ? i + 1 : i - 1;
      return { id: pick.id, value: pick.options[Math.max(0, j)], label: pick.label };
    }
    const lo = pick.min == null ? 0 : pick.min;
    const hi = pick.max == null ? 5 : pick.max;
    const step = pick.step || (hi - lo) / 5 || 1;
    const n = Number(v);
    const next = isFinite(n) ? (n + step <= hi ? n + step : n - step) : lo;
    return { id: pick.id, value: Math.round(next * 1000) / 1000, label: pick.label };
  }

  const api = { point, move, follows, WEIGHTS };
  root.CurioCompass = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
