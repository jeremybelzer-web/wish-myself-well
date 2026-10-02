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
assert(core.localStorage.getItem("curiosities-automation-v1"), "patches save to the storage given");

console.log(
  `core ok: ${core.CURIOSITIES.length} curiosities, ${core.SUITES.length} suites, ${core.PROXIMITIES.length} proximities, ${list.params.length} automatable parameters, bridge ok`
);
