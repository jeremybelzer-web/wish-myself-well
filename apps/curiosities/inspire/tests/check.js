/* Checks the scene inspiration data and the search logic with no page:
   every value is a real curiosity on its own scale, every scene has a YouTube search,
   and each filter only ever makes the list smaller.  node inspire/tests/check.js */
const assert = require("assert");
const path = require("path");
const db = require(path.join(__dirname, "../../data/curiosity-db.json"));
const { scenes } = require("../scenes.js");
const Hub = require("../search.js");

const byId = {};
db.curiosities.forEach((c) => (byId[c.id] = c));
let errors = [];
const ids = new Set();
scenes.forEach((s) => {
  if (ids.has(s.id)) errors.push("two scenes share id " + s.id);
  ids.add(s.id);
  if (!s.search) errors.push(s.id + ": no YouTube search");
  if (!s.feelings.length) errors.push(s.id + ": no feeling");
  s.beats.forEach((b, i) => {
    if (i && b.at <= s.beats[i - 1].at) errors.push(s.id + ": beats out of order");
    Object.entries(b.values).forEach(([k, v]) => {
      const [cid, sid] = k.split(".");
      const c = byId[cid];
      if (!c) return errors.push(`${s.id}: unknown curiosity ${cid}`);
      const sl = c.sliders.find((x) => x.id === (sid || c.main));
      if (!sl) return errors.push(`${s.id}: ${cid} has no slider ${sid}`);
      if (sl.scale && !sl.scale.includes(v)) errors.push(`${s.id}: ${k} = "${v}" is not on its scale`);
      if (sl.range && (typeof v !== "number" || v < sl.range.min || v > sl.range.max)) errors.push(`${s.id}: ${k} = ${v} is out of range`);
    });
  });
});
assert.deepStrictEqual(errors, [], errors.join("\n"));

const hub = Hub.create({ scenes, curiosities: db.curiosities, suites: db.suites, workspaces: db.workspaces });
const all = hub.results([]).length;
assert.strictEqual(all, scenes.length);
// Every filter narrows, and adding a second never grows the list.
const f1 = { curiosity: "shotSize", value: "close" };
const f2 = { curiosity: "shotSize", rate: "snaps" };
const n1 = hub.results([f1]).length;
const n2 = hub.results([f1, f2]).length;
assert.ok(n1 > 0 && n1 < all, "shot size close narrows: " + n1);
assert.ok(n2 <= n1, "a second filter never grows the list");
assert.ok(hub.results([{ feeling: "dread" }]).length >= 3);
assert.ok(hub.results([{ kind: "game" }]).length >= 5);
assert.ok(hub.results([{ text: "jaws" }]).length === 1);
// Topics list only curiosities that some scene uses, with counts.
const topics = hub.topics([]);
assert.ok(topics.length >= 5 && topics.every((t) => t.count > 0));
const cam = topics.find((t) => t.id === "camera");
assert.ok(cam && hub.curiosities("camera", []).some((c) => c.id === "shotSize"));
// How fast a curiosity changes: Psycho's cutting goes slow -> fast (snaps).
const psycho = scenes.find((s) => s.work === "Psycho");
assert.strictEqual(hub.rate(psycho, "cutRate"), "snaps");
assert.strictEqual(hub.rate(psycho, "colorRange"), "holds");
// A scene becomes a curated film the Prism can split.
const study = hub.toStudy(psycho);
assert.strictEqual(study.beats.length, psycho.beats.length);
assert.ok(study.id.startsWith("inspire-") && study.source === "scene inspiration");
// Suites: a suite matches a scene when half its members match in some beat.
const sm = hub.suitesFor(scenes[0]);
assert.ok(Array.isArray(sm));
// Logged clips join the list and can be found.
const logged = hub.logClip({ work: "My clip", moment: "a test", feelings: ["joy"], search: "my clip", beats: [{ at: 0, values: { shotSize: "wide" } }, { at: 5, values: { shotSize: "close" } }] });
hub.add(logged);
assert.strictEqual(hub.results([{ text: "my clip" }]).length, 1);
console.log(`inspire: ${scenes.length} scenes, ${topics.length} topics, every value on its scale; filters narrow (${all} -> ${n1} -> ${n2}).`);
