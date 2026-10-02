/* engine/app-undo.js: undo for everything in the app, not only the engine (Jeremy's words #12: "every change
   is one undo step: settings, edits, links, everything").

   The rest of the app keeps its work in this browser's storage, one key per part ("curiosities-board-v2",
   "curiosities-storyboard-v1", each Studio tool...), and each part keeps its own copy while the page is
   open. So this records every change to a work key (what it was, what it became), and undoing puts the old
   value back and reloads the page, so every part starts again from the restored values. That is the honest
   version until those parts read from one shared state (see docs/engine.md, "What is not done yet").

   - Changes to the same key less than 1.5 seconds apart are one step (dragging a slider is one step).
   - View settings (which tab is open, view choices) and the engine's own film (it has its own undo) are
     not recorded.
   - An undo only goes ahead when every key it would put back still holds what the step left there, so it
     can never overwrite something newer (an opened project, another tab).
   - Steps live in this tab's session storage, so they survive the reload an undo needs; at most 100 steps.

   window.CurioAppUndo = { steps() newest first [{ label, when, key }], undoTo(i), canRedo(), redo(), clear() } */
(function () {
  if (typeof window === "undefined" || !window.Storage || !window.localStorage) return;
  const PREFIX = "curiosities-";
  const SKIP = /^curiosities-(engine-v1|engine-view-v1|workspace-v1|glossary-v1|studio-tab-v1)$|-(view|tab|prefs|ui)-v\d+$/;
  const SESSION = "curio-app-undo-v1";
  const MAX = 100;
  const MAX_TEXT = 1500000;
  const MERGE_MS = 1500;
  const NAMES = {
    "curiosities-board-v2": "My film",
    "curiosities-studies-v1": "Curated films",
    "curiosities-automation-v1": "Automations",
    "curiosities-story-v1": "Story values",
    "curiosities-storyboard-v1": "Storyboard",
    "curiosities-catalog-notes-v1": "Notes on curiosities",
    "curiosities-character-matrix-v1": "Character matrix",
  };
  function name(k) {
    if (NAMES[k]) return NAMES[k];
    const m = k.match(/^curiosities-studio-(.+)-v\d+$/);
    if (m) return "Tool: " + m[1].replace(/-/g, " ");
    return k.replace(/^curiosities-/, "").replace(/-v\d+$/, "").replace(/-/g, " ");
  }
  const tracked = (k) => typeof k === "string" && k.startsWith(PREFIX) && !SKIP.test(k);

  let data = { steps: [], redo: [] };
  try {
    const raw = JSON.parse(sessionStorage.getItem(SESSION));
    if (raw && Array.isArray(raw.steps) && Array.isArray(raw.redo)) data = raw;
  } catch (e) {}
  function keep() {
    try {
      while (data.steps.length > MAX) data.steps.shift();
      let text = JSON.stringify(data);
      while (text.length > MAX_TEXT && data.steps.length) {
        data.steps.shift();
        text = JSON.stringify(data);
      }
      sessionStorage.setItem(SESSION, text);
    } catch (e) {}
  }

  const P = window.Storage.prototype;
  const rawSet = P.setItem;
  const rawRemove = P.removeItem;
  const rawGet = P.getItem;
  let quiet = false;
  function record(k, before, after) {
    const now = Date.now();
    const last = data.steps[data.steps.length - 1];
    if (last && last.key === k && now - last.at < MERGE_MS) {
      last.after = after;
      last.at = now;
      if (last.before === last.after) data.steps.pop();
    } else data.steps.push({ key: k, before, after, at: now });
    data.redo = [];
    keep();
  }
  P.setItem = function (k, v) {
    if (quiet || this !== window.localStorage || !tracked(k)) return rawSet.call(this, k, v);
    const before = rawGet.call(this, k);
    const out = rawSet.call(this, k, v);
    const after = rawGet.call(this, k);
    if (before !== after) record(k, before, after);
    return out;
  };
  P.removeItem = function (k) {
    if (quiet || this !== window.localStorage || !tracked(k)) return rawRemove.call(this, k);
    const before = rawGet.call(this, k);
    const out = rawRemove.call(this, k);
    if (before !== null) record(k, before, null);
    return out;
  };
  function put(k, v) {
    quiet = true;
    try {
      if (v === null) rawRemove.call(localStorage, k);
      else rawSet.call(localStorage, k, v);
    } finally {
      quiet = false;
    }
  }
  function when(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    return s < 60 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function steps() {
    return data.steps
      .slice()
      .reverse()
      .map((s) => ({ label: name(s.key), when: when(s.at), key: s.key }));
  }
  /* Undo the newest steps down to and including the i-th newest. */
  function undoTo(i) {
    const n = Number(i) + 1;
    if (!(n >= 1 && n <= data.steps.length)) return false;
    const group = data.steps.slice(-n);
    /* Each key must still hold what its newest step left there. */
    const newest = {};
    group.forEach((s) => (newest[s.key] = s.after));
    const stale = Object.keys(newest).filter((k) => rawGet.call(localStorage, k) !== newest[k]);
    if (stale.length) {
      alert("Not undone: " + stale.map(name).join(", ") + " changed in another way since (a project was opened, or another tab). Nothing was changed.");
      return false;
    }
    group
      .slice()
      .reverse()
      .forEach((s) => put(s.key, s.before));
    data.steps = data.steps.slice(0, -n);
    data.redo.push(group);
    keep();
    location.reload();
    return true;
  }
  function redo() {
    const group = data.redo.pop();
    if (!group) return false;
    const oldest = {};
    group.forEach((s) => (s.key in oldest ? null : (oldest[s.key] = s.before)));
    const stale = Object.keys(oldest).filter((k) => rawGet.call(localStorage, k) !== oldest[k]);
    if (stale.length) {
      data.redo = [];
      keep();
      alert("Not redone: " + stale.map(name).join(", ") + " changed since.");
      return false;
    }
    group.forEach((s) => put(s.key, s.after));
    data.steps = data.steps.concat(group);
    keep();
    location.reload();
    return true;
  }
  window.CurioAppUndo = {
    steps,
    undoTo,
    redo,
    canRedo: () => data.redo.length > 0,
    clear() {
      data = { steps: [], redo: [] };
      keep();
    },
  };
})();
