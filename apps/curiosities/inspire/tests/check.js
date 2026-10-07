/* Checks the scene inspiration data and the search logic with no page:
   every value is a real curiosity on its own scale, every scene has a YouTube search,
   and each filter only ever makes the list smaller.  node inspire/tests/check.js */
const assert = require("assert");
const path = require("path");
const db = require(path.join(__dirname, "../../data/curiosity-db.json"));
const { scenes } = require("../scenes.js");
const { works } = require("../writing.js");
const Hub = require("../search.js");

const byId = {};
db.curiosities.forEach((c) => (byId[c.id] = c));
let errors = [];
const ids = new Set();
scenes.concat(works).forEach((s) => {
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
// Writing is its own database (novels, short stories, essays, poems): not mixed into films and games, found by
// kind, author and movement, and read on Gutenberg.
assert.ok(scenes.every((s) => !Hub.isWritten(s)) && works.every((s) => Hub.isWritten(s)), "the two databases stay apart");
const wh = Hub.create({ scenes: works, curiosities: db.curiosities, suites: db.suites });
assert.deepStrictEqual(wh.kinds([]).map((k) => k.id), ["novel", "short story", "essay", "poem"], "writing's subcategories");
const books = wh.results([{ kind: "poem" }]);
assert.ok(books.length >= 4, "poems are in the list");
assert.ok(wh.results([{ text: "poe" }]).length >= 2, "authors are searchable");
assert.ok(wh.movements([]).some((m) => m.id === "pacing") && wh.results([{ movement: "pacing" }]).length >= 2, "movement words filter");
assert.ok(/gutenberg\.org/.test(wh.watchUrl(books[0], "youtube")), "writing opens on Project Gutenberg");
assert.ok(/youtube/.test(hub.watchUrl(psycho, "youtube")), "films open on YouTube");
assert.ok(works.every((s) => s.author && s.movements.length && s.year < 1930), "written sources: author, movements, public domain");
// Every written work links its movements to the emotion-movement archive (relations/archive.js ids, mv-*).
assert.ok(works.every((w) => w.archive.length && w.archive.every((id) => /^mv-[a-z-]+$/.test(id))), "movements link to the archive");
assert.ok(wh.results([{ movement: "mv-pacing" }]).length >= 2, "an archive movement id filters too");
console.log(`inspire: ${scenes.length} film and game scenes, ${works.length} written works, ${topics.length} topics, every value on its scale; filters narrow (${all} -> ${n1} -> ${n2}).`);
// Watch and tag: links to ids, times, and tags to beats.
const W = require("../watch.js");
assert.strictEqual(W.parseId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30"), "dQw4w9WgXcQ");
assert.strictEqual(W.parseId("https://youtu.be/dQw4w9WgXcQ?t=5"), "dQw4w9WgXcQ");
assert.strictEqual(W.parseId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.strictEqual(W.parseId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.strictEqual(W.parseId("jaws beach scene"), null);
assert.strictEqual(W.linkStart("https://youtu.be/x?t=1m30s"), 90);
assert.strictEqual(W.parseTime("1:05"), 65);
assert.strictEqual(W.parseTime("65"), 65);
assert.strictEqual(W.parseTime("1m5s"), 65);
assert.strictEqual(W.fmt(65), "1:05");
const tagged = W.toClip({ work: "T", feelings: "Joy, dread", video: "dQw4w9WgXcQ" }, [
  { at: 12, key: "shotSize", value: "close" },
  { at: 0, key: "shotSize", value: "wide" },
  { at: 0, key: "emotion", value: "joy" },
]);
assert.deepStrictEqual(tagged.beats.map((b) => b.at), [0, 12]);
assert.deepStrictEqual(tagged.feelings, ["joy", "dread"]);
const tscene = hub.logClip(tagged);
assert.strictEqual(tscene.video.id, "dQw4w9WgXcQ");
assert.strictEqual(tscene.beats[1].values.emotion, "joy", "each beat keeps the values before it");
// Clip stretch and backups are kept; the link check moves a live link to the front and marks lost clips.
const withBackups = W.toClip({ work: "B", video: "AAAAAAAAAAA", ids: ["BBBBBBBBBBB", "AAAAAAAAAAA"], clipStart: 30, clipEnd: 72.4 }, [{ at: 31, key: "shotSize", value: "wide" }]);
assert.deepStrictEqual(withBackups.video, { site: "youtube", id: "AAAAAAAAAAA", ids: ["AAAAAAAAAAA", "BBBBBBBBBBB"], start: 30, end: 72 });
const bscene = hub.logClip(withBackups);
assert.deepStrictEqual(bscene.video.ids, ["AAAAAAAAAAA", "BBBBBBBBBBB"]);
const lost = hub.logClip(W.toClip({ work: "L", video: "CCCCCCCCCCC" }, []));
const fresh = hub.logClip(W.toClip({ work: "F", video: "DDDDDDDDDDD" }, []));
fresh.video.checked = 1000;
const alive = { jNQXAC9IVRw: true, AAAAAAAAAAA: false, BBBBBBBBBBB: true, CCCCCCCCCCC: false };
(async () => {
  const n = await W.check([bscene, lost, fresh], { probe: async (id) => alive[id], now: 2000 });
  assert.strictEqual(n, 2, "only clips not checked in 30 days are checked");
  assert.strictEqual(bscene.video.id, "BBBBBBBBBBB", "a live backup moves to the front");
  assert.deepStrictEqual(bscene.video.gone, ["AAAAAAAAAAA"]);
  assert.ok(lost.video.lost && !bscene.video.lost);
  assert.strictEqual(await W.check([hub.logClip(W.toClip({ work: "O", video: "EEEEEEEEEEE" }, []))], { probe: async () => null }), 0, "offline marks nothing");
  assert.strictEqual(await W.check([hub.logClip(W.toClip({ work: "X", video: "EEEEEEEEEEE" }, []))], { probe: async () => false }), 0, "a page that can't reach YouTube marks nothing");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
