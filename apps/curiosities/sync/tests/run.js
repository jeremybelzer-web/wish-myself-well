/* node sync/tests/run.js : the sync groundwork, with the in-memory stand-in for a cloud store. */
const assert = require("assert");
require("../sync.js");
const S = globalThis.CurioSync;
let n = 0;
const ok = async (name, fn) => {
  await fn();
  n += 1;
};
const proj = (at, keys) => ({ format: "curiosities-project", version: 1, name: "Film", savedAt: at, keys });

(async () => {
  await ok("one side's changes win when the other did not touch the key", () => {
    const base = proj("2026-10-02T10:00:00Z", { a: 1, b: 1 });
    const r = S.merge(base, proj("2026-10-02T11:00:00Z", { a: 2, b: 1 }), proj("2026-10-02T12:00:00Z", { a: 1, b: 3, c: 4 }));
    assert.deepStrictEqual(r.bundle.keys, { a: 2, b: 3, c: 4 });
    assert.deepStrictEqual(r.conflicts, []);
  });
  await ok("both changed: the newer keeps it, the other is kept in conflicts", () => {
    const base = proj("2026-10-02T10:00:00Z", { a: 1 });
    const r = S.merge(base, proj("2026-10-02T11:00:00Z", { a: "phone" }), proj("2026-10-02T12:00:00Z", { a: "laptop" }));
    assert.strictEqual(r.bundle.keys.a, "laptop");
    assert.deepStrictEqual(r.conflicts, [{ key: "a", kept: "theirs", other: "phone" }]);
  });
  await ok("a key deleted on one side stays deleted", () => {
    const base = proj("2026-10-02T10:00:00Z", { a: 1, b: 2 });
    const r = S.merge(base, proj("2026-10-02T11:00:00Z", { b: 2 }), proj("2026-10-02T09:00:00Z", { a: 1, b: 2 }));
    assert.deepStrictEqual(r.bundle.keys, { b: 2 });
  });
  await ok("two browsers sync through the store and end the same", async () => {
    const store = S.memoryAdapter();
    const phone = S.create(store);
    const laptop = S.create(store);
    const first = await phone.sync("film", proj("2026-10-02T10:00:00Z", { board: { shotSize: "wide" }, story: { scenes: 8 } }));
    assert.deepStrictEqual(first.conflicts, []);
    const onLaptop = await laptop.sync("film", proj("2026-10-02T10:05:00Z", { board: { shotSize: "wide" }, story: { scenes: 8 }, storyboard: { scenes: 1 } }));
    const back = await phone.sync("film", proj("2026-10-02T10:10:00Z", { board: { shotSize: "close" }, story: { scenes: 8 } }));
    assert.deepStrictEqual(back.bundle.keys, { board: { shotSize: "close" }, story: { scenes: 8 }, storyboard: { scenes: 1 } });
    const again = await laptop.sync("film", onLaptop.bundle);
    assert.deepStrictEqual(again.bundle.keys, back.bundle.keys);
  });
  await ok("a stale save is retried after merging", async () => {
    const store = S.memoryAdapter();
    const a = S.create(store);
    await a.sync("f", proj("2026-10-02T10:00:00Z", { x: 1 }));
    let raced = false;
    const racing = {
      get: (id) => store.get(id),
      put: async (id, b, rev) => {
        if (!raced) {
          raced = true;
          await store.put(id, proj("2026-10-02T10:30:00Z", { x: 1, y: 2 }), rev);
        }
        return store.put(id, b, rev);
      },
    };
    const r = await S.create(racing, { loadBase: () => null }).sync("f", proj("2026-10-02T11:00:00Z", { x: 1, z: 3 }));
    assert.deepStrictEqual(r.bundle.keys, { x: 1, y: 2, z: 3 });
  });
  await ok("an adapter is required", () => assert.throws(() => S.create({}), /adapter/));
  console.log(n + " sync checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
