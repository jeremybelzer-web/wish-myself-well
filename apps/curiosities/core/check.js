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

/* Shared films: a study becomes a counts-only trace and back, with notes and unknown ids left out. */
const T = core.CuriosityTrace;
assert(T, "trace.js is in the core");
const sel = core.CURIOSITIES.find((c) => c.kind === "select");
const rng = core.CURIOSITIES.find((c) => c.kind === "range");
const study = {
  id: "s1",
  title: "A film I traced",
  kind: "film",
  camera: "authored",
  beats: [
    { id: "x", at: "0:00", note: "a line someone says", values: { [sel.id]: sel.options[0], [rng.id]: rng.max + 50, notACuriosity: 3 } },
    { id: "y", at: "0:04", note: "", values: { [sel.id]: "not on its scale", [rng.id]: rng.min } },
  ],
  moments: [{ id: "m", name: "the entrance", from: "x", to: "y" }],
};
const tr = T.fromStudy(study, { tracedBy: "Jeremy" });
assert.strictEqual(tr.format, "curiosities-trace");
assert.strictEqual(tr.beats.length, 2);
assert(!JSON.stringify(tr).includes("a line someone says"), "beat notes never go in");
assert.strictEqual(tr.beats[0].values[rng.id], rng.max, "range values are kept on their scale");
assert(!("notACuriosity" in tr.beats[0].values), "unknown ids are dropped");
assert(!(sel.id in tr.beats[1].values), "values off the scale are dropped");
assert.deepStrictEqual(plain(tr.moments), [{ name: "the entrance", from: 0, to: 1 }], "moments by beat number");
const again = T.fromStudy(Object.assign({}, study, { id: "other" }), { tracedBy: "someone else" });
assert.strictEqual(again.id, tr.id, "the id comes from the content, not who traced it");
const read = T.check(T.json(tr));
assert(read.ok, "a trace file reads back");
assert.deepStrictEqual(plain(read.trace.beats), plain(tr.beats), "beats survive the file");
const st = T.toStudy(read.trace);
assert.strictEqual(st.id, "trace-" + tr.id);
assert.strictEqual(st.moments[0].from, st.beats[0].id, "moments point at the study's beats");
const fromExport = T.check({ format: "curiosities-studies-v1", studies: [study] });
assert(fromExport.ok && fromExport.dropped.notes === 1 && fromExport.dropped.ids.notACuriosity === 1 && fromExport.dropped.values === 1, "a studies export reads too, with a tally");
assert(!T.check("{nope").ok && !T.check({ beats: [] }).ok && !T.check({ format: "curiosities-trace", version: 99, beats: [{}] }).ok, "bad files are refused");
if (core.CuriosityDB && core.CuriosityDB.studiesExport) {
  const scenes = core.CuriosityDB.studiesExport().studies;
  const unknown = new Set();
  scenes.forEach((sc) => {
    const r = T.check(T.json(T.fromStudy(sc)));
    assert(r.ok, sc.id + " traces");
    Object.keys(T.check(sc).dropped.ids).forEach((id) => unknown.add(sc.id + ": " + id));
  });
  /* A model scene value whose id is not a curiosity is a data slip in data/; it is left out of the trace, and named here. */
  if (unknown.size) console.log("traces: model scene ids that are not curiosities (left out): " + [...unknown].join(", "));
  const sizes = scenes.map((sc) => T.json(T.fromStudy(sc)).length);
  console.log(`traces: ${scenes.length} model scenes, ${Math.round(Math.max(...sizes) / 1024)} KB at most`);
}
console.log("traces ok");

console.log(
  `core ok: ${core.CURIOSITIES.length} curiosities, ${core.SUITES.length} suites, ${core.PROXIMITIES.length} proximities, ${list.params.length} automatable parameters, bridge ok`
);
