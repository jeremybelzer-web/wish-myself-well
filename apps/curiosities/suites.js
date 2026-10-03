/* Suites, measured by degree. A curiosity is a lens: one way to look at a scene. A suite is a group of
   lenses you look through together, so a beat matches it by degree, the share of its members whose value
   is on (0 to 100%), never all-or-nothing. A suite with no fixed values (a lens suite, set {}) is only a
   named group of lenses: show its members' values side by side instead of a match.
   window.CuriositySuites is shared by the Board, Study, the Prism, automation and the workspaces.
   Part of the shared core (core/README.md): it was the top of app.js, moved here unchanged so the core loads without the Board. */
(function () {
  /* A suite as a proximity's cause counts as present when at least this share of its members match.
     Half: most of the look is there, even if a lens or two differs. */
  const SUITE_CAUSE_SHARE = 0.5;

  const list = () => (typeof SUITES !== "undefined" ? SUITES : []);
  /* Lens suites come from lenses.js, which may load before or after this file: pick them up whenever asked. */
  function sync() {
    const extra = window.CURIOSITY_LENS_SUITES;
    if (!Array.isArray(extra) || typeof SUITES === "undefined") return list();
    extra.forEach((s) => {
      if (!s || !s.id) return;
      const have = SUITES.find((x) => x.id === s.id);
      if (have) {
        if (!have.kind) have.kind = "lens";
        if (!have.set) have.set = {};
        return;
      }
      SUITES.push(Object.assign({}, s, { kind: "lens", set: s.set || {} }));
    });
    return SUITES;
  }
  sync();
  function find(s) {
    return typeof s === "string" ? list().find((x) => x.id === s) || null : s || null;
  }
  /* Does the suite name values to look for? A lens suite does not. */
  function fixed(s) {
    s = find(s);
    return !!s && !!s.set && Object.keys(s.set).length > 0;
  }
  /* Its members: the curiosities with fixed values, or the lenses of a lens suite. */
  function members(s) {
    s = find(s);
    if (!s) return [];
    return fixed(s) ? Object.keys(s.set) : (s.lenses || []).slice();
  }
  function same(a, b) {
    return a != null && b != null && a !== "" && String(a) === String(b);
  }
  /* How much of a suite one set of values shows: {on: [ids that match], total, share 0 to 1}. null for a lens suite. */
  function match(s, values) {
    s = find(s);
    if (!fixed(s)) return null;
    values = values || {};
    const ids = Object.keys(s.set);
    const on = ids.filter((id) => same(values[id], s.set[id]));
    return { on, total: ids.length, share: ids.length ? on.length / ids.length : 0 };
  }
  /* Across many beats or panels: the average share, the best beat, and the share at each one. */
  function across(s, list_) {
    s = find(s);
    if (!fixed(s)) return null;
    const each = (list_ || []).map((v) => match(s, v));
    const shares = each.map((m) => m.share);
    let best = -1;
    shares.forEach((x, i) => (best < 0 || x > shares[best]) && (best = i));
    const mean = shares.length ? shares.reduce((a, b) => a + b, 0) / shares.length : 0;
    const total = Object.keys(s.set).length;
    return { shares, each, mean, best, peak: best >= 0 ? shares[best] : 0, total, on: Math.round(mean * total) };
  }
  /* A suite cause is present at a beat when at least half its members match. */
  function present(s, values) {
    const m = match(s, values);
    return !!m && m.total > 0 && m.share >= SUITE_CAUSE_SHARE;
  }
  const pct = (x) => Math.round((Number(x) || 0) * 100) + "%";
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const word = (n) => (n === 1 ? "lens" : "lenses");
  /* "3 of 5 lenses, 60%" */
  function text(m) {
    if (!m) return "";
    const on = m.on && m.on.length != null ? m.on.length : m.on;
    return `${on} of ${m.total} ${word(m.total)}, ${pct(m.share != null ? m.share : m.mean)}`;
  }
  /* A graded bar: how full the match is. */
  function bar(share) {
    const p = Math.max(0, Math.min(100, Math.round((Number(share) || 0) * 100)));
    return `<span class="suite-bar" role="img" aria-label="${p}% of the suite matches"><i style="width:${p}%"></i></span>`;
  }
  /* One line: "Noir 3 of 5 lenses, 60%" and its bar. */
  function html(s, m, extra) {
    s = find(s);
    if (!s || !m) return "";
    return `<span class="suite-share" title="${esc(s.note || "")}"><b>${esc(s.label)}</b> <span class="suite-n">${esc(text(m))}</span>${bar(m.share != null ? m.share : m.mean)}${extra ? ` <span class="cap">${extra}</span>` : ""}</span>`;
  }
  /* A lens suite: its members' values side by side. label(id) names a curiosity. */
  function side(s, values, label) {
    s = find(s);
    if (!s) return "";
    values = values || {};
    const name = label || ((id) => ((typeof CURIOSITIES !== "undefined" && CURIOSITIES.find((c) => c.id === id)) || { label: id }).label);
    return `<span class="suite-side">${members(s)
      .map((id) => {
        const v = values[id];
        const set = v != null && v !== "";
        return `<span class="chip${set ? "" : " suite-unset"}">${esc(name(id))}: ${set ? esc(v) : "—"}</span>`;
      })
      .join("")}</span>`;
  }

  /* Styles for the share bars. Skipped where there is no page (the core loaded headless, core/headless.js). */
  if (typeof document !== "undefined" && !document.getElementById("suite-share-css")) {
    const st = document.createElement("style");
    st.id = "suite-share-css";
    st.textContent = `
.suite-share { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; max-width: 100%; }
.suite-share .suite-n { font-family: var(--mono, monospace); font-size: 11px; }
.suite-bar { display: inline-block; width: 64px; height: 6px; border: 1px solid currentColor; border-radius: 3px; overflow: hidden; vertical-align: middle; opacity: .85; flex: none; }
.suite-bar i { display: block; height: 100%; background: currentColor; }
.suite-side { display: inline-flex; flex-wrap: wrap; gap: 4px; }
.suite-side .suite-unset { opacity: .55; }
.suite-list { display: grid; gap: 4px; margin: 6px 0; font-size: 13px; }
.suite-list .suite-share { display: flex; }
td .suite-share { display: flex; margin: 2px 0; }
`;
    (document.head || document.documentElement).appendChild(st);
  }

  window.CuriositySuites = { CAUSE_SHARE: SUITE_CAUSE_SHARE, sync, find, fixed, members, match, across, present, text, bar, html, side, pct };
})();
