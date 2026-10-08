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
   - Steps live in this tab's session storage, so they survive the reload an undo needs; at most 300 steps.
     Each step keeps only the changed stretch of text, so big parts do not crowd out older steps.

   One ⌘Z for everything (Jeremy 2026-10-08: "undo any deleted thing. From storyboards to a viewer, to deleting the
   Automation window. Anything."): every change you make here (a click, a key, a drag just before it) is also one
   step on the app-wide undo list (engine/store.js), next to the Viewer's film, the storyboard and the rest, so the
   Viewer's Undo button and ⌘Z reach it. Undoing it puts the old value back and tells the page
   ("curio-undo-restored", detail { keys, handled }); a part that can read its key again in place (the Viewer's
   windows, the workspace, the build windows, automation) adds the key to handled. When every key was handled the
   page stays as it is; otherwise it reloads, and the steps kept in this tab (these and the Viewer's) go back on the
   app-wide list in order, so undo and redo carry on after the reload. Saves nobody asked for (a part tidying its
   data as the page opens) stay off the app-wide list and are undone together with the step before them.

   window.CurioAppUndo = { steps() newest first [{ label, when, key }], undoTo(i), canRedo(), redo(), clear() } */
(function () {
  if (typeof window === "undefined" || !window.Storage || !window.localStorage) return;
  const PREFIX = "curiosities-";
  /* curiosities-viewer-v1 is the Viewer's film: the Viewer keeps its own steps on the app-wide list. Kept
     versions and histories (Momentum's versions) are written by the app on its own, and a clipboard (the Screen's
     copied area) is not a change to the film: never undone. The Screen's tools (zoom, lane heights) are undone
     by the Screen's own view steps; its favorites and quick find keep what you used last as you go (a log, not
     an edit). */
  const SKIP = /^curiosities-(engine-v1|engine-view-v1|workspace-v1|glossary-v1|studio-tab-v1|screen-v1|screen-tools-v1|screen-faves-v1|screen-find-v1|viewer-v1)$|-(view|tab|prefs|ui|versions|history|clip)-v\d+$/;
  /* Kept outside the project's names, but made by you all the same: the Viewer's arrangement, your own
     curiosities and ties in the relationship map, your own lane suites. */
  const EXTRA = ["curio-viewer-workspace-v1", "curio-relations-v1", "curio-lane-suites-v1"];
  /* A change counts as yours when it comes this soon after a click, a key or a drag. */
  const ACT_MS = 2500;
  const SESSION = "curio-app-undo-v2";
  const MAX = 300;
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
  /* Parts that live on the shared store (engine/store.js) are undone there, in place; not here. */
  const tracked = (k) => typeof k === "string" && ((k.startsWith(PREFIX) && !SKIP.test(k)) || EXTRA.includes(k)) && !(window.CurioStore && window.CurioStore.owns(k));

  /* A step keeps only what changed: the text between the part both values share at the start and at the end
     (p and s characters), before (b) and after (a), or null for a removed key. A big part (automation can be
     hundreds of kilobytes) then costs a few bytes per change instead of two whole copies, so the history
     reaches back to the start of a session. h is a short fingerprint of the after value. */
  function hash(t) {
    if (t === null) return "null";
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
    return t.length + ":" + (h >>> 0).toString(36);
  }
  /* A part saved as JSON whose changes are spread out (stopping every automation flips a flag in each) keeps
     the changed fields instead: o.b turns the after value back into the before value, o.a the other way.
     Used only when it rebuilds both values exactly, letter for letter; otherwise the text stretch is kept. */
  const plain = (v) => v && typeof v === "object" && !Array.isArray(v);
  function ops(from, to, path, out) {
    const odd = (v) => Object.prototype.hasOwnProperty.call(v, "__proto__"); /* never walked into: whole value instead */
    if (plain(from) && plain(to) && !odd(from) && !odd(to)) {
      Object.keys(from).forEach((k) => (Object.prototype.hasOwnProperty.call(to, k) ? null : out.push([path.concat(k)])));
      Object.keys(to).forEach((k) => (Object.prototype.hasOwnProperty.call(from, k) ? ops(from[k], to[k], path.concat(k), out) : out.push([path.concat(k), to[k]])));
    } else if (Array.isArray(from) && Array.isArray(to) && from.length === to.length) {
      to.forEach((v, i) => ops(from[i], v, path.concat(i), out));
    } else if (JSON.stringify(from) !== JSON.stringify(to)) out.push([path, to]);
    return out;
  }
  function apply(text, list) {
    let root = { v: JSON.parse(text) };
    list.forEach((op) => {
      const path = ["v"].concat(op[0]);
      let o = root;
      for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
      const last = path[path.length - 1];
      if (op.length === 1) delete o[last];
      else o[last] = op[1];
    });
    return JSON.stringify(root.v);
  }
  function diff(before, after) {
    if (before === null || after === null) return { p: 0, s: 0, b: before, a: after, h: hash(after) };
    const max = Math.min(before.length, after.length);
    let p = 0;
    while (p < max && before.charCodeAt(p) === after.charCodeAt(p)) p++;
    let s = 0;
    while (s < max - p && before.charCodeAt(before.length - 1 - s) === after.charCodeAt(after.length - 1 - s)) s++;
    const text = { p, s, b: before.slice(p, before.length - s), a: after.slice(p, after.length - s), h: hash(after) };
    if (text.a.length + text.b.length < 4000) return text;
    try {
      const B = JSON.parse(before);
      const A = JSON.parse(after);
      const o = { b: ops(A, B, [], []), a: ops(B, A, [], []) };
      if (JSON.stringify(o).length < text.a.length + text.b.length && apply(after, o.b) === before && apply(before, o.a) === after) return { o, h: text.h };
    } catch (e) {}
    return text;
  }
  /* From the after value back to the before value, and the other way. */
  function back(st, after) {
    if (st.o) return apply(after, st.o.b);
    if (st.b === null) return null;
    if (st.a === null) return st.b;
    return after.slice(0, st.p) + st.b + after.slice(after.length - st.s);
  }
  function forward(st, before) {
    if (st.o) return apply(before, st.o.a);
    if (st.a === null) return null;
    if (st.b === null) return st.a;
    return before.slice(0, st.p) + st.a + before.slice(before.length - st.s);
  }

  let data = { steps: [], redo: [], seq: 0 };
  try {
    const raw = JSON.parse(sessionStorage.getItem(SESSION));
    if (raw && Array.isArray(raw.steps) && Array.isArray(raw.redo)) data = Object.assign({ seq: 0 }, raw);
  } catch (e) {}
  /* One click, key or drag is one step: armed by it, spent by the first step it makes anywhere (a saved change
     here, the Viewer's film, a storyboard edit) or by an undo or redo. Saves that follow on from it (the layout
     settling after a window closes, a part re-saving what an undo put back) ride along with that step. */
  let acted = 0;
  let armed = false;
  /* gesture: one press of the mouse, a key or a drop. A slider dragged or a wheel turned stays one gesture, so
     its saves join one step; a new press is a new step even on the same part a moment later (a window added
     and closed straight after are two steps, not one that cancels out). */
  let gesture = 0;
  ["pointerdown", "keydown", "drop"].forEach((t) => window.addEventListener(t, () => gesture++, true));
  ["pointerdown", "keydown", "input", "change", "drop", "wheel"].forEach((t) => window.addEventListener(t, () => ((acted = Date.now()), (armed = true)), true));
  function keep() {
    try {
      while (data.steps.length > MAX) data.steps.shift();
      let text = JSON.stringify(data);
      while (text.length > MAX_TEXT && (data.redo.length || data.steps.length)) {
        if (data.redo.length) data.redo.shift();
        else data.steps.shift();
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
  /* After an undo or redo puts values back, the page is about to reload: a late save from a part that still
     holds the old values in memory (on a timer, or as the page unloads) would write over what was put back. */
  let leaving = false;
  const blocked = (store, k) => leaving && store === window.localStorage && typeof k === "string" && (k.startsWith(PREFIX) || EXTRA.includes(k));
  function record(k, before, after) {
    const now = Date.now();
    const yours = armed && now - acted < ACT_MS;
    const last = data.steps[data.steps.length - 1];
    let st = null;
    if (last && last.key === k && now - last.at < MERGE_MS && last.h === hash(before) && (last.g === gesture || !yours)) {
      const first = back(last, before);
      data.steps.pop();
      if (first !== after) data.steps.push((st = Object.assign({ key: k, at: now, id: last.id, hub: last.hub, g: last.g }, diff(first, after))));
    } else data.steps.push((st = Object.assign({ key: k, at: now, id: ++data.seq, g: gesture }, diff(before, after))));
    if (yours) data.redo = [];
    /* on the app-wide list (that empties every redo list, this one too) */
    if (st && yours && !st.hub && hub()) {
      st.hub = true;
      hub().external("app", ext(st));
      armed = false;
    }
    keep();
  }
  const hub = () => (window.CurioStore && typeof window.CurioStore.external === "function" ? window.CurioStore : null);
  const ext = (st) => ({ label: name(st.key), undo: () => undoId(st.id), redo: () => redoId(st.id) });
  /* The values are back: parts that can read them again in place say so; otherwise the page reloads. Their own
     saves while they read again are not new changes. */
  function restored(keys) {
    const handled = [];
    quiet = true;
    try {
      window.dispatchEvent(new CustomEvent("curio-undo-restored", { detail: { keys: keys.slice(), handled } }));
    } catch (e) {
    } finally {
      quiet = false;
    }
    if (keys.every((k) => handled.includes(k))) return;
    leaving = true;
    location.reload();
  }
  /* The app-wide list's undo of step id: that step and any saves nobody asked for after it. */
  function undoId(id) {
    const at = data.steps.findIndex((s) => s.id === id);
    if (at < 0) return false;
    const group = data.steps.slice(at);
    const newest = {};
    group.forEach((s) => (newest[s.key] = s.h));
    const stale = Object.keys(newest).filter((k) => hash(rawGet.call(localStorage, k)) !== newest[k]);
    if (stale.length) {
      alert("Not undone: " + stale.map(name).join(", ") + " changed in another way since (a project was opened, or another tab). Nothing was changed.");
      return false;
    }
    const now = {};
    group
      .slice()
      .reverse()
      .forEach((s) => {
        const cur = s.key in now ? now[s.key] : rawGet.call(localStorage, s.key);
        now[s.key] = back(s, cur);
      });
    Object.keys(now).forEach((k) => put(k, now[k]));
    data.steps = data.steps.slice(0, at);
    data.redo.push(group);
    keep();
    restored(Object.keys(now));
    return true;
  }
  function redoId(id) {
    const group = data.redo[data.redo.length - 1];
    if (!group || !group.some((s) => s.id === id)) return false;
    const vals = {};
    const stale = [];
    group.forEach((s) => {
      if (!(s.key in vals)) vals[s.key] = rawGet.call(localStorage, s.key);
      vals[s.key] = forward(s, vals[s.key]);
      if (hash(vals[s.key]) !== s.h && !stale.includes(s.key)) stale.push(s.key);
    });
    if (stale.length) {
      data.redo.pop();
      keep();
      alert("Not redone: " + stale.map(name).join(", ") + " changed since.");
      return false;
    }
    Object.keys(vals).forEach((k) => put(k, vals[k]));
    data.redo.pop();
    data.steps = data.steps.concat(group);
    keep();
    restored(Object.keys(vals));
    return true;
  }
  P.setItem = function (k, v) {
    if (blocked(this, k)) return;
    if (quiet || this !== window.localStorage || !tracked(k)) return rawSet.call(this, k, v);
    const before = rawGet.call(this, k);
    const out = rawSet.call(this, k, v);
    const after = rawGet.call(this, k);
    if (before !== after) record(k, before, after);
    return out;
  };
  P.removeItem = function (k) {
    if (blocked(this, k)) return;
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
    group.forEach((s) => (newest[s.key] = s.h));
    const stale = Object.keys(newest).filter((k) => hash(rawGet.call(localStorage, k)) !== newest[k]);
    if (stale.length) {
      alert("Not undone: " + stale.map(name).join(", ") + " changed in another way since (a project was opened, or another tab). Nothing was changed.");
      return false;
    }
    const now = {};
    group
      .slice()
      .reverse()
      .forEach((s) => {
        const cur = s.key in now ? now[s.key] : rawGet.call(localStorage, s.key);
        now[s.key] = back(s, cur);
      });
    Object.keys(now).forEach((k) => put(k, now[k]));
    data.steps = data.steps.slice(0, -n);
    data.redo.push(group);
    keep();
    leaving = true;
    location.reload();
    return true;
  }
  function redo() {
    const group = data.redo.pop();
    if (!group) return false;
    /* Replay the group forward; each key must land on what its step left there, or it changed since. */
    const stale = [];
    const vals = {};
    group.forEach((s) => {
      if (!(s.key in vals)) vals[s.key] = rawGet.call(localStorage, s.key);
      vals[s.key] = forward(s, vals[s.key]);
      if (hash(vals[s.key]) !== s.h && !stale.includes(s.key)) stale.push(s.key);
    });
    if (stale.length) {
      data.redo = [];
      keep();
      alert("Not redone: " + stale.map(name).join(", ") + " changed since.");
      return false;
    }
    Object.keys(vals).forEach((k) => put(k, vals[k]));
    data.steps = data.steps.concat(group);
    keep();
    leaving = true;
    location.reload();
    return true;
  }
  /* A new change anywhere empties this redo list too, and spends the click that made it; so do undo and redo. */
  if (hub()) {
    const St = hub();
    ["undo", "redo"].forEach((dir) => {
      const was = St[dir];
      St[dir] = function () {
        armed = false;
        return was.apply(this, arguments);
      };
    });
  }
  if (hub() && hub().onNew)
    hub().onNew(() => {
      armed = false;
      if (!data.redo.length) return;
      data.redo = [];
      keep();
    });
  /* After a reload, put the steps kept in this tab (these and the Viewer's) back on the app-wide list, oldest
     first, and the ones that can be redone on its redo list, the next one last. */
  function hydrate() {
    const St = hub();
    if (!St) return;
    const V = window.CurioViewer;
    const log = V && typeof V.undoLog === "function" ? V.undoLog() : { undo: [], redo: [] };
    const viewerExt = (e) => V.hubStep(e);
    const u = data.steps.filter((s) => s.hub).map((s) => ({ at: s.at, ext: ext(s), name: "app" }));
    log.undo.forEach((e) => u.push({ at: e.at, ext: viewerExt(e), name: "viewer" }));
    const r = [];
    data.redo.forEach((g) => {
      const s = g.find((x) => x.hub);
      if (s) r.push({ at: s.at, ext: ext(s), name: "app" });
    });
    log.redo.forEach((e) => r.push({ at: e.at, ext: viewerExt(e), name: "viewer" }));
    u.sort((a, b) => a.at - b.at).forEach((x) => St.external(x.name, x.ext, { keep: true }));
    r.sort((a, b) => b.at - a.at).forEach((x) => St.external(x.name, x.ext, { redo: true }));
  }
  if (document.readyState === "complete") setTimeout(hydrate, 0);
  else window.addEventListener("load", () => setTimeout(hydrate, 0));

  window.CurioAppUndo = {
    steps,
    undoTo,
    redo,
    canRedo: () => data.redo.length > 0,
    clear() {
      data = { steps: [], redo: [], seq: data.seq || 0 };
      keep();
    },
  };
})();
