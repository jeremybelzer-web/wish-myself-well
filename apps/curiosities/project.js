/* project.js: save your progress as one project file, and keep an autosave history.

   window.CuriosityProject
   - Every part of the app keeps its own piece of work in this browser's localStorage, under a key that
     starts with "curiosities-" (the board, curated films, automations, story values, the storyboard,
     each Studio tool, and small view settings). A project file bundles all of them into one file.
   - The project file (.curio) is plain JSON:
       { format: "curiosities-project", version: 1, name, savedAt, keys: { "<key>": <value> }, text: { "<key>": "<raw>" } }
     "keys" holds every value that is JSON (most of them); "text" holds the few that are plain words.
   - save(): writes back to the same file on disk where the browser allows it (Chrome and Edge, File System
     Access API) after the first save; elsewhere it downloads a copy. saveAs(name): asks for a new file.
     open(): file picker, then a confirm that shows what is inside before replacing anything. newProject().
   - Autosave history: every few minutes (only when something changed), when the page is hidden or closed,
     and before Open, New or Restore. The last 20 snapshots are kept in IndexedDB (or in localStorage, with
     a size limit, when IndexedDB is not available). history() lists them; restore(id) brings one back after
     snapshotting the current state first, so a restore can itself be undone.
   - Loading a project or a snapshot writes the keys and reloads the page, so every part starts clean.
   - status() -> { name, saved, changed, savedAt, canWriteBack } for the save indicator in the bar.
   - openPanel(tab) shows the Project window ("file" or "history"). on(fn) is told when the status changes.

   This file's own small notes live outside the "curiosities-" prefix, so they are never bundled:
   "curio-project-v1" (project name, when it was last saved to a file, and a fingerprint of that state)
   and "curio-history-v1" (the history, only when IndexedDB is missing). */
(function () {
  const PREFIX = "curiosities-";
  const FORMAT = "curiosities-project";
  const VERSION = 1;
  const META_KEY = "curio-project-v1";
  const LS_HISTORY = "curio-history-v1";
  const LS_HISTORY_MAX = 1500000; /* about 1.5 MB of the browser's roughly 5 MB, so the work itself has room */
  const KEEP = 20;
  const EVERY_MS = 3 * 60 * 1000;
  const DB_NAME = "curiosities-project";

  /* ---------- small helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function readJson(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function writeRaw(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }
  function when(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + " min ago";
    const sameDay = new Date().toDateString() === d.toDateString();
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return sameDay ? "today " + time : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
  }
  function kb(n) {
    return n < 1024 ? n + " bytes" : n < 1048576 ? Math.round(n / 1024) + " KB" : (n / 1048576).toFixed(1) + " MB";
  }
  function safeName(s) {
    return String(s || "My project").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 80) || "My project";
  }

  /* ---------- the bundle ---------- */
  function workKeys() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) out.push(k);
      }
    } catch (e) {}
    return out.sort();
  }
  /* Every curiosities-* key, as raw strings (what the browser holds). */
  function rawState() {
    const raw = {};
    workKeys().forEach((k) => {
      try {
        raw[k] = localStorage.getItem(k);
      } catch (e) {}
    });
    return raw;
  }
  /* A short fingerprint, so "changed since the last save" is cheap to check. */
  function sigOf(raw) {
    let h = 5381;
    let n = 0;
    Object.keys(raw)
      .sort()
      .forEach((k) => {
        const s = k + "\u0000" + raw[k] + "\u0001";
        n += s.length;
        for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
      });
    return (h >>> 0).toString(36) + "." + n.toString(36);
  }
  function bundle(name, raw) {
    raw = raw || rawState();
    const file = { format: FORMAT, version: VERSION, app: "Curiosities", name: name || meta().name, savedAt: new Date().toISOString(), keys: {}, text: {} };
    Object.keys(raw).forEach((k) => {
      try {
        file.keys[k] = JSON.parse(raw[k]);
      } catch (e) {
        file.text[k] = raw[k];
      }
    });
    return file;
  }
  /* A bundle back to raw strings; checks the format first. */
  function unbundle(file) {
    if (!file || typeof file !== "object" || file.format !== FORMAT) throw new Error("This is not a Curiosities project file.");
    if (Number(file.version) > VERSION) throw new Error("This project was saved by a newer version of the app. Update the app, then open it again.");
    const raw = {};
    Object.entries(file.keys || {}).forEach(([k, v]) => {
      if (k.startsWith(PREFIX)) raw[k] = JSON.stringify(v);
    });
    Object.entries(file.text || {}).forEach(([k, v]) => {
      if (k.startsWith(PREFIX)) raw[k] = String(v);
    });
    return raw;
  }

  /* What a set of keys holds, in plain words, for the Open confirm and the History list. */
  const PARTS = [
    ["curiosities-board-v2", "My film (the board)", () => ""],
    ["curiosities-studies-v1", "Curated films", (v) => (v && Array.isArray(v.studies) ? count(v.studies.length, "film") + (v.shelf && v.shelf.length ? ", " + count(v.shelf.length, "shelf item") : "") : "")],
    ["curiosities-automation-v1", "Automations", (v) => (v && v.patches ? count(Object.keys(v.patches).length, "automation") : "")],
    ["curiosities-story-v1", "Story values", (v) => (v && Array.isArray(v.characters) ? count(v.characters.length, "character") + ", " + count(Number(v.scenes) || 0, "scene") : "")],
    ["curiosities-storyboard-v1", "Storyboard", (v) => (v && Array.isArray(v.scenes) ? count(v.scenes.length, "scene") : "")],
    ["curiosities-catalog-notes-v1", "Notes on curiosities", (v) => (v && typeof v === "object" ? count(Object.keys(v).length, "note") : "")],
  ];
  function count(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }
  function summary(raw) {
    const lines = [];
    const seen = new Set();
    PARTS.forEach(([key, label, fn]) => {
      if (raw[key] == null) return;
      seen.add(key);
      let detail = "";
      try {
        detail = fn(JSON.parse(raw[key]));
      } catch (e) {}
      lines.push({ label, detail });
    });
    const tools = Object.keys(raw)
      .filter((k) => /^curiosities-studio-(.+)-v\d+$/.test(k) && k !== "curiosities-studio-tab-v1")
      .map((k) => k.replace(/^curiosities-studio-/, "").replace(/-v\d+$/, "").replace(/-/g, " "));
    tools.forEach((t) => seen.add("curiosities-studio-" + t.replace(/ /g, "-") + "-v1"));
    if (tools.length) lines.push({ label: "Studio tools", detail: tools.join(", ") });
    const other = Object.keys(raw).filter((k) => !seen.has(k) && !/^curiosities-studio-/.test(k));
    if (other.length) lines.push({ label: "Settings", detail: count(other.length, "setting") + " (what was open, view choices)" });
    let size = 0;
    Object.entries(raw).forEach(([k, v]) => (size += k.length + String(v).length));
    return { lines, size };
  }
  function summaryHtml(raw) {
    const s = summary(raw);
    if (!s.lines.length) return `<p class="cap">Nothing saved yet: an empty project.</p>`;
    return `<ul class="proj-parts">${s.lines.map((l) => `<li><b>${esc(l.label)}</b>${l.detail ? ": " + esc(l.detail) : ""}</li>`).join("")}</ul><p class="cap">Size: ${kb(s.size)}</p>`;
  }

  /* ---------- the project's own notes ---------- */
  function meta() {
    const m = readJson(META_KEY, {});
    return Object.assign({ name: "My project", savedAt: 0, sig: "", fileName: "" }, m && typeof m === "object" ? m : {});
  }
  function setMeta(changes) {
    const m = Object.assign(meta(), changes);
    writeRaw(META_KEY, JSON.stringify(m));
    notify();
    return m;
  }

  /* While a project is being loaded, nothing else may write work keys: the page is about to reload and
     a late save from another part of the app would undo what was just loaded. */
  let locked = false;
  (function guard() {
    const P = window.Storage && window.Storage.prototype;
    if (!P) return;
    const set = P.setItem;
    const remove = P.removeItem;
    P.setItem = function (k, v) {
      if (locked && this === window.localStorage && String(k).startsWith(PREFIX)) return;
      return set.call(this, k, v);
    };
    P.removeItem = function (k) {
      if (locked && this === window.localStorage && String(k).startsWith(PREFIX)) return;
      return remove.call(this, k);
    };
    loadRaw.set = set;
    loadRaw.remove = remove;
  })();

  /* Replace every work key with these, then reload the page so every part starts from them. */
  function loadRaw(raw, newMeta) {
    locked = true;
    const set = loadRaw.set || Storage.prototype.setItem;
    const remove = loadRaw.remove || Storage.prototype.removeItem;
    workKeys().forEach((k) => remove.call(localStorage, k));
    const failed = [];
    Object.entries(raw).forEach(([k, v]) => {
      try {
        set.call(localStorage, k, v);
      } catch (e) {
        failed.push(k);
      }
    });
    if (newMeta) setMeta(Object.assign({ fresh: true }, newMeta));
    if (failed.length) {
      locked = false;
      alert("The browser ran out of room, so part of this project could not be loaded: " + failed.join(", ") + ". Restore the snapshot named 'Before…' in History to go back.");
    }
    location.reload();
  }

  /* ---------- autosave history ---------- */
  let dbPromise = null;
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      try {
        if (!window.indexedDB) return resolve(null);
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains("snapshots")) d.createObjectStore("snapshots", { keyPath: "id", autoIncrement: true });
          if (!d.objectStoreNames.contains("handles")) d.createObjectStore("handles");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
    return dbPromise;
  }
  function tx(store, mode, fn) {
    return db().then(
      (d) =>
        new Promise((resolve, reject) => {
          if (!d) return reject(new Error("no-idb"));
          const t = d.transaction(store, mode);
          const s = t.objectStore(store);
          let out;
          Promise.resolve(fn(s, (v) => (out = v))).catch(reject);
          t.oncomplete = () => resolve(out);
          t.onerror = () => reject(t.error);
          t.onabort = () => reject(t.error);
        })
    );
  }
  function lsHistory() {
    const list = readJson(LS_HISTORY, []);
    return Array.isArray(list) ? list : [];
  }

  let lastSnapSig = "";
  let historyNote = "";
  /* All snapshots, newest first. */
  function history() {
    return tx("snapshots", "readonly", (s, out) => {
      const req = s.getAll();
      req.onsuccess = () => out(req.result || []);
    })
      .then((list) => list.sort((a, b) => b.at - a.at || b.id - a.id))
      .catch(() => lsHistory().sort((a, b) => b.at - a.at || b.id - a.id));
  }
  function snapshot(reason, opts) {
    opts = opts || {};
    const raw = rawState();
    const sig = sigOf(raw);
    if (!opts.force && sig === lastSnapSig) return Promise.resolve(null);
    const snap = { at: Date.now(), reason: reason || "Autosave", name: meta().name, sig, raw };
    lastSnapSig = sig;
    return tx("snapshots", "readwrite", (s) => {
      s.add(snap);
      const req = s.getAll();
      req.onsuccess = () => {
        const list = (req.result || []).sort((a, b) => b.at - a.at || b.id - a.id);
        list.slice(KEEP).forEach((x) => s.delete(x.id));
      };
    })
      .then(() => snap)
      .catch(() => {
        /* No IndexedDB: keep as many recent snapshots as fit in about 1.5 MB of localStorage. */
        let list = lsHistory();
        snap.id = (list.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
        list.unshift(snap);
        list = list.slice(0, KEEP);
        let text = JSON.stringify(list);
        while (text.length > LS_HISTORY_MAX && list.length > 1) {
          list.pop();
          text = JSON.stringify(list);
        }
        historyNote = "";
        if (text.length > LS_HISTORY_MAX) {
          historyNote = "This project is too big to keep a history in this browser. Save a project file instead.";
          return null;
        }
        if (list.length < KEEP && list.length < lsHistory().length + 1) historyNote = "Only the last " + list.length + " snapshots fit in this browser.";
        if (!writeRaw(LS_HISTORY, text)) historyNote = "The browser is out of room, so no history snapshot was kept. Save a project file.";
        return snap;
      });
  }
  function getSnapshot(id) {
    return history().then((list) => list.find((x) => x.id === id) || null);
  }
  function restore(id) {
    return getSnapshot(id).then((snap) => {
      if (!snap) throw new Error("That snapshot is no longer kept.");
      return snapshot("Before restoring " + when(snap.at), { force: true }).then(() => loadRaw(snap.raw, { name: snap.name || meta().name }));
    });
  }

  /* ---------- files ---------- */
  const canWriteBack = typeof window.showSaveFilePicker === "function";
  let handle = null;
  function rememberHandle(h) {
    handle = h;
    tx("handles", "readwrite", (s) => s.put(h, "current")).catch(() => {});
  }
  if (canWriteBack) {
    tx("handles", "readonly", (s, out) => {
      const req = s.get("current");
      req.onsuccess = () => out(req.result || null);
    })
      .then((h) => {
        if (h && meta().fileName === h.name) handle = h;
        notify();
      })
      .catch(() => {});
  }
  const PICK = { types: [{ description: "Curiosities project", accept: { "application/json": [".curio"] } }] };

  function askPersist() {
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    } catch (e) {}
  }
  function markSaved(name, raw, fileName) {
    setMeta({ name, savedAt: Date.now(), sig: sigOf(raw), fileName: fileName || "" });
    askPersist();
  }
  function download(name, text) {
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = safeName(name) + ".curio";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }
  async function writeTo(h, text) {
    if (h.queryPermission && (await h.queryPermission({ mode: "readwrite" })) !== "granted") {
      if ((await h.requestPermission({ mode: "readwrite" })) !== "granted") throw new Error("permission");
    }
    const w = await h.createWritable();
    await w.write(text);
    await w.close();
  }
  /* Save: to the same file when we have one, otherwise like Save as. */
  async function save() {
    const m = meta();
    if (canWriteBack && handle) {
      const raw = rawState();
      try {
        await writeTo(handle, JSON.stringify(bundle(m.name, raw), null, 1));
        markSaved(m.name, raw, handle.name);
        flash("Saved to " + handle.name);
        return true;
      } catch (e) {
        if (e && e.name === "AbortError") return false;
        /* The file moved or permission was refused: ask for a place again. */
      }
    }
    return saveAs(m.name);
  }
  async function saveAs(name) {
    name = safeName(name || meta().name);
    const raw = rawState();
    const text = JSON.stringify(bundle(name, raw), null, 1);
    if (canWriteBack) {
      try {
        const h = await window.showSaveFilePicker(Object.assign({ suggestedName: name + ".curio" }, PICK));
        await writeTo(h, text);
        rememberHandle(h);
        const fileName = h.name;
        markSaved(fileName.replace(/\.curio$/i, "") || name, raw, fileName);
        flash("Saved to " + fileName);
        return true;
      } catch (e) {
        if (e && e.name === "AbortError") return false;
        /* Fall through to a download when the picker is not allowed here. */
      }
    }
    download(name, text);
    handle = null;
    markSaved(name, raw, name + ".curio");
    flash("Downloaded " + name + ".curio");
    return true;
  }

  /* Open: pick a file, read it, show what is inside, then replace on confirm. */
  async function open() {
    let text = "";
    let h = null;
    try {
      if (typeof window.showOpenFilePicker === "function") {
        try {
          [h] = await window.showOpenFilePicker(PICK);
          text = await (await h.getFile()).text();
        } catch (e) {
          if (e && e.name === "AbortError") return false;
          h = null;
          text = await pickWithInput();
        }
      } else text = await pickWithInput();
    } catch (e) {
      return false;
    }
    if (!text) return false;
    return confirmOpen(text, h);
  }
  function pickWithInput() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".curio,application/json,.json";
      input.style.display = "none";
      input.addEventListener("change", () => {
        const f = input.files && input.files[0];
        input.remove();
        if (!f) return resolve("");
        f.text().then(resolve, () => resolve(""));
      });
      document.body.appendChild(input);
      input.click();
    });
  }
  /* Also used by the test harness and by drag and drop: open from the file's text. */
  function confirmOpen(text, h) {
    let file;
    let raw;
    try {
      file = JSON.parse(text);
      raw = unbundle(file);
    } catch (e) {
      showPanel("file", { error: e instanceof SyntaxError ? "This file could not be read as a project file." : e.message });
      return false;
    }
    const name = safeName(file.name || (h && h.name ? h.name.replace(/\.curio$/i, "") : "My project"));
    showPanel("file", {
      confirm: {
        title: "Open “" + name + "”?",
        body:
          `<p>Saved ${esc(file.savedAt ? new Date(file.savedAt).toLocaleString() : "at an unknown time")}. It holds:</p>` +
          summaryHtml(raw) +
          `<p>This replaces what is open now. What is open now is kept in History first, so you can go back.</p>`,
        ok: "Open this project",
        run: () => {
          if (h) rememberHandle(h);
          else handle = null;
          return snapshot("Before opening " + name, { force: true }).then(() => {
            askPersist();
            loadRaw(raw, { name, savedAt: Date.now(), sig: sigOf(raw), fileName: h ? h.name : "" });
          });
        },
      },
    });
    return true;
  }
  function newProject() {
    showPanel("file", {
      confirm: {
        title: "Start a new project?",
        body: "<p>This clears the board, curated films, automations, story values, the storyboard and the Studio tools, and starts fresh. What is open now is kept in History first, so you can go back.</p>",
        ok: "Start a new project",
        run: () => {
          handle = null;
          tx("handles", "readwrite", (s) => s.delete("current")).catch(() => {});
          return snapshot("Before a new project", { force: true }).then(() => loadRaw({}, { name: "My project", savedAt: 0, sig: "", fileName: "" }));
        },
      },
    });
  }

  /* ---------- status ---------- */
  const listeners = [];
  function on(fn) {
    listeners.push(fn);
    return () => listeners.splice(listeners.indexOf(fn), 1);
  }
  let lastStatusKey = "";
  function status() {
    const m = meta();
    const changed = !m.savedAt || sigOf(rawState()) !== m.sig;
    return { name: m.name, saved: !!m.savedAt, changed, savedAt: m.savedAt, fileName: m.fileName, canWriteBack: canWriteBack && !!handle };
  }
  function notify(force) {
    const s = status();
    const key = [s.name, s.saved, s.changed, s.savedAt, s.canWriteBack].join("|");
    if (!force && key === lastStatusKey) return;
    lastStatusKey = key;
    listeners.forEach((fn) => {
      try {
        fn(s);
      } catch (e) {}
    });
  }
  /* The words for the small indicator in the bar. */
  function label(s) {
    s = s || status();
    if (!s.saved) return { text: "Not saved to a file", tone: "warn" };
    if (s.changed) return { text: "Changes not saved", tone: "warn" };
    return { text: "Saved " + when(s.savedAt), tone: "ok" };
  }

  /* ---------- the Project window ---------- */
  let dlg = null;
  let flashMsg = "";
  function flash(msg) {
    flashMsg = msg;
    if (dlg && dlg.open) drawPanel(dlg.dataset.tab || "file", {});
  }
  function injectStyle() {
    if (document.getElementById("project-style")) return;
    const st = document.createElement("style");
    st.id = "project-style";
    st.textContent = `
      .proj-dlg { width: min(600px, calc(100vw - 32px)); max-height: calc(100vh - 48px); padding: 0; border: 3px solid var(--ink); background: var(--panel); color: var(--ink); box-shadow: 6px 6px 0 rgba(28, 23, 18, 0.25); }
      .proj-dlg::backdrop { background: rgba(28, 23, 18, 0.35); }
      .proj-in { padding: 16px 18px 18px; overflow-wrap: anywhere; }
      .proj-head { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
      .proj-head h2 { font-family: var(--serif); font-weight: 500; font-size: 22px; margin: 0; }
      .proj-x { border: 2px solid var(--ink); background: var(--panel); width: 32px; height: 32px; padding: 0; font-size: 18px; cursor: pointer; flex: none; }
      .proj-tabs { display: flex; gap: 6px; margin: 10px 0; }
      .proj-tabs button, .proj-row button { font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; border: 2px solid var(--ink); background: var(--panel); color: var(--ink); padding: 6px 10px; cursor: pointer; }
      .proj-tabs button.on, .proj-row button.primary { background: var(--ink); color: var(--paper); }
      .proj-note { border-left: 4px solid var(--saffron); background: #fff8ef; padding: 8px 10px; margin: 8px 0 12px; font-size: 14px; line-height: 1.4; }
      .proj-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: end; margin: 10px 0; }
      .proj-row label { display: grid; gap: 3px; font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; flex: 1 1 200px; min-width: 0; }
      .proj-row input { font: inherit; font-family: var(--sans); font-size: 15px; text-transform: none; letter-spacing: 0; padding: 6px 8px; border: 2px solid var(--ink); background: #fff; min-width: 0; }
      .proj-flash { font-family: var(--mono); font-size: 12px; color: var(--saffron); margin: 6px 0; }
      .proj-err { border: 2px solid #a33; background: #fdeaea; padding: 8px 10px; }
      .proj-parts { margin: 6px 0; padding-left: 20px; }
      .proj-parts li { margin: 2px 0; }
      .proj-confirm { border: 2px solid var(--ink); padding: 10px 12px; background: #fff; margin: 8px 0; }
      .proj-confirm h3 { font-family: var(--serif); font-weight: 500; font-size: 18px; margin: 0 0 4px; }
      .proj-hist { list-style: none; margin: 8px 0 0; padding: 0; border-top: 1px solid var(--line); }
      .proj-hist li { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
      .proj-hist .when { font-family: var(--mono); font-size: 12px; min-width: 120px; }
      .proj-hist .why { flex: 1 1 160px; font-size: 14px; min-width: 0; }
      .proj-hist .more { flex-basis: 100%; }
      .proj-hist button { font-family: var(--mono); font-size: 11px; text-transform: uppercase; border: 2px solid var(--ink); background: var(--panel); padding: 4px 8px; cursor: pointer; }
      .cap.proj-small { font-size: 13px; }
      .tabs .proj-ind { font-family: var(--mono); font-size: 10px; letter-spacing: 0.04em; text-transform: none; border: 2px dashed var(--ink); background: transparent; padding: 4px 8px; white-space: nowrap; }
      .tabs .proj-ind.warn { border-color: var(--saffron); color: var(--saffron); }
      .tabs .proj-ind.ok { border-style: solid; border-color: var(--line); }
      .tabs .proj-ind::before { content: "● "; }
      @media (max-width: 600px) {
        .proj-in { padding: 12px; }
        .proj-head h2 { font-size: 19px; }
      }`;
    document.head.appendChild(st);
  }
  function ensureDialog() {
    if (dlg) return dlg;
    injectStyle();
    dlg = document.createElement("dialog");
    dlg.className = "proj-dlg";
    dlg.setAttribute("aria-label", "Project");
    document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) return dlg.close();
      const b = e.target.closest("button[data-p]");
      if (!b) return;
      const act = b.dataset.p;
      const nameInput = dlg.querySelector("#proj-name");
      const nm = nameInput ? nameInput.value : "";
      if (nm && nm !== meta().name) setMeta({ name: safeName(nm) });
      if (act === "close") dlg.close();
      else if (act === "tab") drawPanel(b.dataset.tab, {});
      else if (act === "save") save();
      else if (act === "saveas") saveAs(nm || meta().name);
      else if (act === "open") open();
      else if (act === "new") newProject();
      else if (act === "ok" && pending) {
        const run = pending;
        pending = null;
        b.disabled = true;
        Promise.resolve(run()).catch((err) => drawPanel(dlg.dataset.tab, { error: err.message }));
      } else if (act === "cancel") {
        pending = null;
        drawPanel(dlg.dataset.tab, {});
      } else if (act === "look") toggleLook(Number(b.dataset.id), b);
      else if (act === "restore") askRestore(Number(b.dataset.id));
      else if (act === "snap") snapshot("Kept by hand", { force: true }).then(() => drawPanel("history", {}));
    });
    dlg.addEventListener("change", (e) => {
      if (e.target.id === "proj-name") setMeta({ name: safeName(e.target.value) });
    });
    return dlg;
  }
  let pending = null;
  function showPanel(tab, opts) {
    ensureDialog();
    drawPanel(tab || "file", opts || {});
    if (!dlg.open) {
      if (dlg.showModal) dlg.showModal();
      else dlg.setAttribute("open", "");
    }
  }
  function confirmHtml(c) {
    pending = c.run;
    return `<div class="proj-confirm" role="alertdialog" aria-label="${esc(c.title)}"><h3>${esc(c.title)}</h3>${c.body}
      <div class="proj-row"><button type="button" class="primary" data-p="ok">${esc(c.ok)}</button><button type="button" data-p="cancel">Cancel</button></div></div>`;
  }
  function drawPanel(tab, opts) {
    dlg.dataset.tab = tab;
    const s = status();
    const l = label(s);
    const top = `<div class="proj-head"><h2>Project</h2><button type="button" class="proj-x" data-p="close" aria-label="Close">×</button></div>
      <p class="proj-note">Your work is kept in this browser. Save a project file to keep it safe, or to move it to another computer. Clearing the browser's data or switching browsers loses anything not in a file.</p>
      <nav class="proj-tabs">${[["file", "Save and open"], ["history", "History"]].map(([k, t]) => `<button type="button" data-p="tab" data-tab="${k}" class="${k === tab ? "on" : ""}">${t}</button>`).join("")}</nav>
      ${opts.error ? `<p class="proj-err">${esc(opts.error)}</p>` : ""}
      ${flashMsg ? `<p class="proj-flash" role="status">${esc(flashMsg)}</p>` : ""}`;
    flashMsg = "";
    if (opts.confirm) {
      dlg.innerHTML = `<div class="proj-in">${top}${confirmHtml(opts.confirm)}</div>`;
      const ok = dlg.querySelector('[data-p="ok"]');
      if (ok) ok.focus();
      return;
    }
    pending = null;
    if (tab === "history") {
      dlg.innerHTML = `<div class="proj-in">${top}
        <p class="cap proj-small">The app keeps a snapshot every few minutes while you work, when you leave the page, and before opening or restoring anything. The last ${KEEP} are kept in this browser.</p>
        <div class="proj-row"><button type="button" data-p="snap">Keep a snapshot now</button></div>
        ${historyNote ? `<p class="proj-err">${esc(historyNote)}</p>` : ""}
        <ul class="proj-hist" id="proj-hist"><li>Loading…</li></ul></div>`;
      history().then((list) => {
        const ul = dlg.querySelector("#proj-hist");
        if (!ul) return;
        if (!list.length) {
          ul.innerHTML = `<li>No snapshots yet. The first one is kept a few seconds after the page opens.</li>`;
          return;
        }
        const cur = sigOf(rawState());
        ul.innerHTML = list
          .map(
            (x) => `<li data-id="${x.id}"><span class="when">${esc(when(x.at))}</span><span class="why">${esc(x.reason)}${x.name ? " · " + esc(x.name) : ""}${x.sig === cur ? " <small>(same as now)</small>" : ""}</span>
            <button type="button" data-p="look" data-id="${x.id}" aria-expanded="false">Look</button><button type="button" data-p="restore" data-id="${x.id}">Restore</button><div class="more" hidden></div></li>`
          )
          .join("");
      });
      return;
    }
    const where = s.canWriteBack ? `Save writes to <b>${esc(s.fileName)}</b> on your computer.` : canWriteBack ? "The first Save asks where to keep the file; after that, Save writes to the same file." : "Save downloads a copy of the project file (this browser cannot write back to the same file).";
    dlg.innerHTML = `<div class="proj-in">${top}
      <div class="proj-row"><label>Project name<input id="proj-name" value="${esc(s.name)}" maxlength="80" autocomplete="off"></label></div>
      <p class="cap proj-small">${esc(l.text)}${s.saved ? " (" + esc(new Date(s.savedAt).toLocaleString()) + ")" : ""}. ${where}</p>
      <div class="proj-row">
        <button type="button" class="primary" data-p="save">Save</button>
        <button type="button" data-p="saveas">Save as…</button>
        <button type="button" data-p="open">Open…</button>
        <button type="button" data-p="new">New project</button>
      </div>
      <p class="cap proj-small">A project file ends in <b>.curio</b>. It holds My film, curated films, automations, story values, the storyboard and every Studio tool. Tip: keep it in a Dropbox, Google Drive or iCloud folder and it is backed up for you. Shortcut: Ctrl+S (⌘S on a Mac) saves.</p>
      <details><summary class="cap">What is open now</summary>${summaryHtml(rawState())}</details></div>`;
  }
  function toggleLook(id, b) {
    const li = b.closest("li");
    const more = li && li.querySelector(".more");
    if (!more) return;
    if (!more.hidden) {
      more.hidden = true;
      b.setAttribute("aria-expanded", "false");
      return;
    }
    getSnapshot(id).then((x) => {
      more.innerHTML = x ? `<p class="cap">${esc(new Date(x.at).toLocaleString())}</p>${summaryHtml(x.raw)}` : "<p>No longer kept.</p>";
      more.hidden = false;
      b.setAttribute("aria-expanded", "true");
    });
  }
  function askRestore(id) {
    getSnapshot(id).then((x) => {
      if (!x) return drawPanel("history", { error: "That snapshot is no longer kept." });
      drawPanel("history", {
        confirm: {
          title: "Restore the snapshot from " + when(x.at) + "?",
          body: `<p>${esc(x.reason)}. It holds:</p>${summaryHtml(x.raw)}<p>What is open now is kept in History first, so you can undo this.</p>`,
          ok: "Restore",
          run: () => restore(id),
        },
      });
    });
  }

  /* ---------- start ---------- */
  injectStyle();
  /* Right after a project loads, parts of the app tidy their saved values (same work, different
     spacing). Take the fingerprint again once they have, so the bar does not say "Changes not saved". */
  if (meta().fresh) {
    setTimeout(() => {
      const m = meta();
      setMeta({ fresh: false, sig: m.savedAt ? sigOf(rawState()) : m.sig });
    }, 2500);
  }
  setTimeout(() => {
    history().then((list) => {
      const latest = list[0];
      lastSnapSig = latest ? latest.sig : "";
      snapshot("When the page opened");
    });
  }, 4000);
  setInterval(() => snapshot("Autosave"), EVERY_MS);
  setInterval(() => notify(), 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && !locked) snapshot("When you left the page");
    else notify();
  });
  window.addEventListener("pagehide", () => {
    if (!locked) snapshot("When you left the page");
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      save();
    }
  });
  /* The indicator updates soon after a change anywhere in the app. */
  document.addEventListener("input", () => setTimeout(notify, 300), true);
  document.addEventListener("click", () => setTimeout(notify, 300), true);

  window.CuriosityProject = {
    FORMAT,
    VERSION,
    save,
    saveAs,
    open,
    openText: (text) => confirmOpen(text, null),
    newProject,
    bundle: (name) => bundle(name),
    keys: workKeys,
    snapshot: (reason) => snapshot(reason || "Kept by hand", { force: true }),
    history,
    restore,
    status,
    label,
    on,
    openPanel: (tab) => showPanel(tab || "file", {}),
    note: "Your work is kept in this browser. Save a project file to keep it safe, or to move it to another computer.",
  };
})();
