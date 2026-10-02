/* node apps/curiosities/core/check.js — loads the shared core with no page and checks it works.
   Exits non-zero on the first failure. */
const assert = require("assert");
const { load } = require("./headless.js");

const core = load();
assert(core.CURIOSITIES.length > 100, "the catalog has its curiosities");
assert(core.SUITES.length > 0 && core.PROXIMITIES.length > 0, "suites and proximities load");
assert(core.CuriositySuites && typeof core.CuriositySuites.match === "function", "CuriositySuites loads without the Board");
assert(core.CurioAuto && typeof core.CurioAuto.resolve === "function", "CurioAuto loads without a page");

const fixed = core.SUITES.find((s) => s.set && Object.keys(s.set).length);
const m = core.CuriositySuites.match(fixed, fixed.set);
assert.strictEqual(m.share, 1, "a suite matches its own values fully");
assert(core.tick() >= 1, "automation's frame loop runs on tick()");

const B = core.CurioBridge;
/* Objects made inside the core carry its own Object prototype, so compare them as plain data. */
const plain = (x) => JSON.parse(JSON.stringify(x));
const list = B.handle({ type: "list" });
assert(list.type === "params" && list.params.length > 100, "the bridge lists every parameter");
const key = list.params.find((p) => p.level === "curiosity").key;
assert.strictEqual(B.handle(JSON.stringify({ type: "set", key, m: 0.42 })), null, "set is accepted");
assert(core.CurioAuto.running().includes(key), "set starts the parameter");
assert.strictEqual(core.CurioAuto.m(key), 0.42, "set steers the main lane");
assert.deepStrictEqual(plain(B.values().find((v) => v.key === key)), { type: "value", key, m: 0.42 }, "values reports it");
assert.strictEqual(B.handle({ type: "set", key: "c:nope", m: 1 }).type, "error", "unknown keys are refused");
const osc = B.toOsc({ type: "set", key: "c:angleHeight", m: 0.5 });
assert.deepStrictEqual(plain(osc), { address: "/curio/set/c/angleHeight", args: [0.5] }, "OSC address out");
assert.deepStrictEqual(plain(B.fromOsc(osc.address, osc.args)), { type: "set", key: "c:angleHeight", m: 0.5 }, "OSC address back in");
B.handle({ type: "trigger", key, on: false });
assert(!core.CurioAuto.running().includes(key), "trigger off stops it");
assert.strictEqual(B.handle({ type: "panels" }).type, "error", "panels needs the board (none headless)");
assert(core.localStorage.getItem("curiosities-automation-v1"), "patches save to the storage given");

/* With the curiosity database (data/, #7) every one of its items is a parameter the bridge can move. */
if (core.CuriosityDB) {
  const keys = new Set(list.params.map((p) => p.key));
  const db = core.CuriosityDB.data;
  const rows = [].concat(
    (db.curiosities || []).map((r) => "c:" + r.id),
    (db.suites || []).map((r) => "s:" + r.id),
    (db.proximities || []).map((r) => "p:" + r.id),
    (db.proximitySuites || []).map((r) => "ps:" + r.id)
  );
  const missing = rows.filter((k) => !keys.has(k));
  assert(rows.length > 0, "the database has rows");
  assert.deepStrictEqual(missing, [], "every database item is a bridge key");
  const dbKey = rows.find((k) => k.startsWith("c:music")) || rows.at(-1);
  assert.strictEqual(B.handle({ type: "set", key: dbKey, m: 0.6 }), null, "a database item takes /curio/set");
  assert.strictEqual(core.CurioAuto.m(dbKey), 0.6);
  B.handle({ type: "trigger", key: dbKey, on: false });
  console.log(`database: ${rows.length} items, all addressable`);
}

console.log(
  `core ok: ${core.CURIOSITIES.length} curiosities, ${core.SUITES.length} suites, ${core.PROXIMITIES.length} proximities, ${list.params.length} automatable parameters, bridge ok`
);
