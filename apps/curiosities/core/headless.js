/* Load the shared core with no page: for the desktop app's main process, a bridge to Maya, Blender or
   VCV Rack, and checks. The core files are classic browser scripts that share top-level names
   (CURIOSITIES, SUITES, PROXIMITIES), so they run in one context, in the order core/files.json gives.
   The few browser names the core reaches for get quiet stand-ins: localStorage keeps values in memory
   (pass `storage` to keep them elsewhere), there is no MIDI, and automation's frame loop runs only
   when you call tick(). The curiosity database in data/ (when present) is installed after model.js;
   load({ database: false }) leaves it out.

   const core = require("./core/headless.js").load();
   core.CURIOSITIES.length; core.CurioBridge.handle({ type: "set", key: "c:angleHeight", m: 0.5 }); core.tick(); */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const FILES = JSON.parse(fs.readFileSync(path.join(__dirname, "files.json"), "utf8")).files;
const DB_LIST = path.join(ROOT, "data", "files.json");
const DATABASE = fs.existsSync(DB_LIST) ? JSON.parse(fs.readFileSync(DB_LIST, "utf8")).map((f) => path.join("data", f)) : [];

function memoryStorage(seed) {
  const m = new Map(Object.entries(seed || {}));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

function load(options) {
  const opts = options || {};
  const frames = [];
  const start = Date.now();
  const sandbox = {
    console,
    localStorage: opts.storage || memoryStorage(opts.seed),
    navigator: {},
    performance: { now: () => Date.now() - start },
    requestAnimationFrame: (fn) => frames.push(fn),
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  const context = vm.createContext(sandbox);
  /* Top-level const names (CURIOSITIES, SUITES...) are shared between scripts in one context but are not
     properties of it, so the last script hands them out. */
  const run = (name) => vm.runInContext(fs.readFileSync(path.join(ROOT, name), "utf8"), context, { filename: name });
  (opts.files || FILES).forEach((name) => {
    run(name);
    /* The curiosity database (data/, when present) installs right after model.js, as index.html does, so
       every database curiosity, suite, proximity and proximity suite is a parameter too. */
    if (name === "model.js" && opts.database !== false && DATABASE.length) {
      DATABASE.forEach(run);
      vm.runInContext("CuriosityDB.install({ CURIOSITIES, SUITES, PROXIMITIES });", context, { filename: "install" });
    }
  });
  const names = ["CURIOSITIES", "LIBRARY", "LIBRARY_VALUES", "SUITES", "PROXIMITIES", "EMOTION_MAP", "REFERENCE", "SCENES"];
  const shared = vm.runInContext(`({ ${names.map((n) => `${n}: typeof ${n} === "undefined" ? undefined : ${n}`).join(", ")} })`, context);
  return Object.assign(shared, {
    window: sandbox,
    localStorage: sandbox.localStorage,
    CuriositySuites: sandbox.CuriositySuites,
    CurioAuto: sandbox.CurioAuto,
    CurioBridge: sandbox.CurioBridge,
    CuriosityDB: sandbox.CuriosityDB,
    CuriosityTrace: sandbox.CuriosityTrace,
    /* Run one automation frame (what the browser does about 60 times a second). */
    tick() {
      const due = frames.splice(0);
      due.forEach((fn) => fn(sandbox.performance.now()));
      return due.length;
    },
  });
}

module.exports = { load, files: FILES, database: DATABASE, memoryStorage };
