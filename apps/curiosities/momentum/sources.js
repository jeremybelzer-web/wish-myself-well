/* momentum/sources.js: Momentum as modulation sources for the automation (automation.js, the Automation window).
   A patch or a lane can follow the attention meter the way it follows an LFO, a knob or MIDI, with a Depth knob:

     momentum:attention   how long the family holding attention has held it, against the limit
                          (0 = it just took attention, 1 = at the limit or past it)
     momentum:level       the momentum reading, 0 to 5, scaled to 0 to 1 (0 stalled, 1 surging)
     momentum:over        1 while that family is past the limit, else 0 (a gate)

   They register through CurioAuto.addSource({ id, label, read }) when the automation has it (patches and lanes
   then use mod "source:momentum:attention" and so on); with an older automation that has no addSource this file
   does nothing.

   read() is called on every automation frame, so it never reads the film: it gives back the last reading, kept
   up to date by events.
   - While Perform runs (CurioPerform), its live meter: CurioPerform.on(fn), about four times a second.
   - Otherwise My film (the engine's film, the one the Screen plays) at the Screen's playhead (CurioScreen.row(),
     the end of the film when there is no Screen), read once after each change: CurioEngine.on (the film changed)
     and CurioScreen.on (the playhead moved). The playhead and the Momentum window's settings (seconds per panel,
     limit, films to compare with) are also checked when read() asks, cheaply, so nothing goes stale.

   window.CurioMomentumSources
   - valuesOf(reading) -> { attention, level, over } (pure, 0..1 each)
   - fromPerform(state) -> the same from CurioPerform.state()
   - SOURCES: [{ id, label, key }]
   - register() -> true when the sources were added
   - value(key) -> the cached value of "attention", "level" or "over"
   - stats() -> { reads, computes }: how many times read() was asked and how many times the film was read
   - refresh(): read again on the next read() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const R = () => root.CurioRates;
  const ME = () => root.CurioMomentumEngine;
  const E = () => root.CurioEngine;
  const SC = () => root.CurioScreen;
  const P = () => root.CurioPerform;
  const AU = () => root.CurioAuto;
  const PREFS = "curiosities-momentum-v1";
  const clamp = (x) => (isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);

  const SOURCES = [
    { id: "momentum:attention", key: "attention", label: "Momentum: attention held" },
    { id: "momentum:level", key: "level", label: "Momentum: how much it moves" },
    { id: "momentum:over", key: "over", label: "Momentum: past the limit" },
  ];

  /* ---------- pure ---------- */
  function valuesOf(reading) {
    const r = reading || {};
    const run = r.stats && r.stats.currentRun;
    const limit = Number(r.limit) > 0 ? Number(r.limit) : 20;
    return {
      attention: run ? clamp(run.dur / limit) : 0,
      level: r.stats ? clamp(Number(r.stats.momentum) / 5) : 0,
      over: run && run.dur > limit ? 1 : 0,
    };
  }
  function fromPerform(s) {
    const x = s || {};
    return { attention: clamp(Number(x.attention)), level: clamp(Number(x.momentum)), over: x.over ? 1 : 0 };
  }

  /* ---------- the cache ---------- */
  const ZERO = { attention: 0, level: 0, over: 0 };
  let cur = ZERO;
  let filmDirty = true; /* the engine's film changed: read its beats again */
  let readDirty = true; /* the playhead or settings changed: read the attention again */
  let beats = null;
  let lastRow = null;
  let lastPrefs = null;
  let prefsAt = -1e9;
  let perform = null; /* the last Perform state while it runs */
  let reads = 0;
  let computes = 0;
  const hooks = { engine: null, screen: null, perform: null };
  const now = () => (root.performance && root.performance.now ? root.performance.now() : Date.now());

  function prefsText() {
    try {
      return (root.localStorage && root.localStorage.getItem(PREFS)) || "";
    } catch (e) {
      return "";
    }
  }
  /* The Momentum window's seconds per panel and limit (its own limit, else the films it compares with). */
  function settings(text) {
    let p = null;
    try {
      p = JSON.parse(text);
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    const spb = Number(p.secondsPerPanel) > 0 ? Number(p.secondsPerPanel) : 3;
    let limit = Number(p.limit) > 0 ? Number(p.limit) : null;
    if (!limit && R()) {
      const ids = Array.isArray(p.compare) && p.compare.length ? p.compare : ["pulp-fiction"];
      const measured = Array.isArray(p.measured) ? p.measured.filter((x) => x && x.id) : [];
      const picked = R().DEFAULT_FILMS.concat(measured).filter((x) => ids.includes(x.id));
      try {
        limit = R().limitFor(R().average(picked.length ? picked : R().DEFAULT_FILMS.slice(0, 1)));
      } catch (e) {
        limit = null;
      }
    }
    return { secondsPerBeat: spb, limit: limit || 20 };
  }
  function rowNow(n) {
    const S = SC();
    const r = S && typeof S.row === "function" ? Number(S.row()) : n - 1;
    return Math.max(0, Math.min(n - 1, isFinite(r) ? Math.floor(r) : n - 1));
  }
  /* Subscribe to whatever has loaded by now (the Screen builds itself later than this file). */
  function hookUp() {
    const En = E();
    if (!hooks.engine && En && typeof En.on === "function") hooks.engine = En.on(() => ((filmDirty = true), (readDirty = true))) || true;
    const S = SC();
    if (!hooks.screen && S && typeof S.on === "function") hooks.screen = S.on(() => (readDirty = true)) || true;
    const Pf = P();
    if (!hooks.perform && Pf && typeof Pf.on === "function")
      hooks.perform =
        Pf.on((s) => {
          perform = Pf.running && Pf.running() ? fromPerform(s) : null;
          if (!perform) readDirty = true;
        }) || true;
  }
  function compute() {
    readDirty = false;
    if (filmDirty) {
      filmDirty = false;
      beats = ME() && typeof ME().flatBeats === "function" ? ME().flatBeats() : [];
    }
    if (!beats || !beats.length || !A()) return (cur = ZERO);
    const row = rowNow(beats.length);
    lastRow = row;
    computes++;
    let r = null;
    try {
      r = A().read(beats.slice(0, row + 1), settings(lastPrefs));
    } catch (e) {
      r = null;
    }
    return (cur = r ? valuesOf(r) : ZERO);
  }
  function current() {
    reads++;
    if (!hooks.engine || !hooks.screen || !hooks.perform) hookUp();
    const Pf = P();
    if (Pf && Pf.running && Pf.running()) return perform || (perform = fromPerform(Pf.state()));
    perform = null;
    /* The settings live in localStorage, which has no event inside one page: look at most twice a second. */
    const t = now();
    if (t - prefsAt > 500) {
      prefsAt = t;
      const text = prefsText();
      if (text !== lastPrefs) (lastPrefs = text), (readDirty = true);
    }
    if (!readDirty && !filmDirty && beats && beats.length && rowNow(beats.length) !== lastRow) readDirty = true;
    if (readDirty || filmDirty) compute();
    return cur;
  }
  const value = (key) => current()[key] || 0;

  function register() {
    const Au = AU();
    if (!Au || typeof Au.addSource !== "function") return false;
    hookUp();
    SOURCES.forEach((s) => Au.addSource({ id: s.id, label: s.label, read: () => value(s.key) }));
    return true;
  }

  const api = {
    valuesOf,
    fromPerform,
    SOURCES,
    register,
    value,
    stats: () => ({ reads, computes }),
    refresh() {
      filmDirty = readDirty = true;
      prefsAt = -1e9;
    },
  };
  root.CurioMomentumSources = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!register() && typeof root.addEventListener === "function") root.addEventListener("load", () => register(), { once: true });
})();
