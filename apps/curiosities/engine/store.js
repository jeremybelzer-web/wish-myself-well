/* engine/store.js: one shared state for the whole app, part by part (the Curiosity Lane letter: "one shared
   state, many views; every change one undo step"). Part of the engine core (no page).

   The app grew as about twenty parts that each keep their own copy of their data while the page is open
   (My film in app.js, the storyboard, the workspaces...). Moving them onto one state happens a part at a
   time: a part registers here, keeps its own saved key (so project files and autosave are unchanged), and
   changes its data only by sending commands. In return every change is one step on one app-wide undo list,
   undone in place (no reload), and every view of the part is told.

   window.CurioStore
   - part(name, { key, initial(), normalize(raw), commands: { type(draft, msg) } }) -> a part:
       view()          the part's data as one live object: always the same object, updated in place, so code
                       that kept a reference to it (app.js's `state`) keeps working. Read it; never write it.
       send(msg, opt)  run a command on a copy, normalize it, and keep it when it changed. -> { ok, error? }
                       msg.label names the undo step. msg.merge: a later command with the same merge text
                       within MERGE_MS joins the same step (a slider being dragged). opt.record === false
                       saves without an undo step (running automation, about eight times a second).
       on(fn)          told (data, label) after every change, undo and redo. -> a function that stops it
       reload()        read the saved key again (after a project file was opened)
   - undo(), redo(), canUndo(), canRedo(), history() -> { undo: [labels], redo: [labels] }: one list for
     every part, newest last
   - owns(key) -> true when a part saves under that key (engine/app-undo.js leaves those to this list)
   - parts() -> the registered names
   Storage is window.localStorage; useStorage(s) swaps it (tests). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  if (root.CurioStore) return; /* index.html may load it early (before app.js) and engine/load.js again */
  const MERGE_MS = 1500;
  const LIMIT = 300;
  let storage = null;
  try {
    storage = root.localStorage || null;
  } catch (e) {
    storage = null;
  }
  const parts = Object.create(null);
  let undoList = [];
  let redoList = [];
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);
  const now = () => Date.now();

  function part(name, spec) {
    if (typeof name !== "string" || !name || parts[name]) throw new Error("CurioStore: a part needs a new name");
    spec = spec || {};
    const normalize = typeof spec.normalize === "function" ? spec.normalize : (x) => (isObj(x) ? x : {});
    const initial = typeof spec.initial === "function" ? spec.initial : () => ({});
    const commands = isObj(spec.commands) ? spec.commands : {};
    const listeners = [];
    const live = {};
    let data = null;
    function read() {
      let raw = null;
      try {
        raw = spec.key && storage ? storage.getItem(spec.key) : null;
      } catch (e) {
        raw = null;
      }
      let parsed = null;
      try {
        parsed = raw == null ? null : JSON.parse(raw);
      } catch (e) {
        parsed = null;
      }
      return normalize(parsed == null ? initial() : parsed);
    }
    function show(next) {
      data = next;
      Object.keys(live).forEach((k) => delete live[k]);
      Object.assign(live, clone(next));
    }
    let saveError = "";
    function write() {
      if (!spec.key || !storage) return;
      try {
        storage.setItem(spec.key, JSON.stringify(data));
        saveError = "";
      } catch (e) {
        saveError = "The browser is out of room, so the last change was not kept.";
      }
    }
    function tell(label) {
      listeners.slice().forEach((fn) => {
        try {
          fn(live, label);
        } catch (e) {}
      });
    }
    function set(next, label) {
      show(next);
      write();
      tell(label);
    }
    function send(msg, opt) {
      if (!isObj(msg) || typeof msg.type !== "string" || !Object.prototype.hasOwnProperty.call(commands, msg.type)) return { ok: false, error: "Unknown command " + String(msg && msg.type).slice(0, 40) + "." };
      const draft = clone(data);
      try {
        commands[msg.type](draft, msg);
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e).slice(0, 200) };
      }
      const next = normalize(draft);
      if (same(next, data)) return { ok: true, unchanged: true };
      const before = data;
      const label = typeof msg.label === "string" && msg.label ? msg.label.slice(0, 80) : msg.type;
      if (!(opt && opt.record === false)) {
        const last = undoList[undoList.length - 1];
        if (last && msg.merge && last.part === name && last.merge === msg.merge && now() - last.at < MERGE_MS) {
          last.after = clone(next);
          last.at = now();
        } else {
          undoList.push({ part: name, label, merge: msg.merge || null, at: now(), before: clone(before), after: clone(next) });
          if (undoList.length > LIMIT) undoList.shift();
        }
        redoList = [];
      }
      set(next, label);
      return { ok: true };
    }
    const api = {
      name,
      key: spec.key || null,
      view: () => live,
      get: () => clone(data),
      send,
      on(fn) {
        listeners.push(fn);
        return () => {
          const i = listeners.indexOf(fn);
          if (i >= 0) listeners.splice(i, 1);
        };
      },
      reload() {
        set(read(), "Load");
      },
      saveError: () => saveError,
      _restore: (x, label) => set(normalize(clone(x)), label),
    };
    show(read());
    parts[name] = api;
    return api;
  }

  function undo() {
    const step = undoList.pop();
    if (!step) return false;
    redoList.push(step);
    parts[step.part]._restore(step.before, "Undo " + step.label);
    return true;
  }
  function redo() {
    const step = redoList.pop();
    if (!step) return false;
    undoList.push(step);
    parts[step.part]._restore(step.after, "Redo " + step.label);
    return true;
  }

  root.CurioStore = {
    part,
    undo,
    redo,
    canUndo: () => undoList.length > 0,
    canRedo: () => redoList.length > 0,
    history: () => ({ undo: undoList.map((s) => s.label), redo: redoList.slice().reverse().map((s) => s.label) }),
    owns: (key) => Object.keys(parts).some((n) => parts[n].key === key),
    parts: () => Object.keys(parts),
    useStorage(s) {
      storage = s;
    },
    MERGE_MS,
  };
})();
