/* sync/sync.js: optional cloud saving (Phase 3 of docs/platform-and-saving-plan.md), groundwork only.
   Nothing here talks to a server yet and nothing is on by default: Jeremy picks the service (the plan
   recommends Supabase) and the cost, then an adapter for it plugs in below. Never touches the page.

   What it does: keeps a project (the same bundle a .curio file holds: { keys: { <storage key>: value } })
   in step between this browser and a store somewhere else, one storage key at a time, so work done on a
   phone and on a laptop both survive.

     CurioSync.create(adapter) -> sync
       sync.push(id, bundle)   -> { rev, merged, conflicts }   send this browser's project
       sync.pull(id)           -> { rev, bundle } | null       fetch the stored one
       sync.sync(id, bundle)   -> { rev, bundle, conflicts }   both ways: merge, store, hand back the result
     CurioSync.merge(base, mine, theirs) -> { bundle, conflicts }
       A key changed on one side only takes that side. A key changed on both sides to different values
       keeps the newer side (by savedAt) and lists the key in conflicts, with the other value kept under
       conflicts[i].other so nothing is lost.
     CurioSync.memoryAdapter() -> an adapter that keeps projects in memory (tests, and the stand-in until a
       real service is chosen).

   An adapter is { get(id) -> {rev, bundle} | null, put(id, bundle, baseRev) -> rev }, both returning promises.
   put must refuse (throw an error with code "stale") when the stored rev is no longer baseRev; sync then
   pulls, merges again and retries. The base (what both sides last agreed on) is kept per project by the
   sync object; give create() a { loadBase, saveBase } pair to keep it across reloads. */
(function (root) {
  if (root.CurioSync) return;

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const copy = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const keysOf = (b) => (b && b.keys && typeof b.keys === "object" ? b.keys : {});
  const time = (b) => Date.parse((b && b.savedAt) || "") || 0;

  function merge(base, mine, theirs) {
    const B = keysOf(base);
    const M = keysOf(mine);
    const T = keysOf(theirs);
    const mineNewer = time(mine) >= time(theirs);
    const out = {};
    const conflicts = [];
    new Set([...Object.keys(B), ...Object.keys(M), ...Object.keys(T)]).forEach((k) => {
      const b = B[k];
      const m = M[k];
      const t = T[k];
      const mChanged = !same(m, b);
      const tChanged = !same(t, b);
      let v;
      if (!mChanged) v = t;
      else if (!tChanged || same(m, t)) v = m;
      else {
        v = mineNewer ? m : t;
        conflicts.push({ key: k, kept: mineNewer ? "mine" : "theirs", other: copy(mineNewer ? t : m) });
      }
      if (v !== undefined) out[k] = copy(v);
    });
    const newer = mineNewer ? mine : theirs;
    const bundle = Object.assign({}, copy(newer || mine || theirs || {}), { keys: out });
    return { bundle, conflicts };
  }

  function memoryAdapter() {
    const store = new Map();
    let n = 0;
    return {
      async get(id) {
        const s = store.get(id);
        return s ? { rev: s.rev, bundle: copy(s.bundle) } : null;
      },
      async put(id, bundle, baseRev) {
        const s = store.get(id);
        if ((s ? s.rev : null) !== (baseRev == null ? null : baseRev)) {
          const e = new Error("Someone saved this project elsewhere since; sync again.");
          e.code = "stale";
          throw e;
        }
        n += 1;
        const rev = "r" + n;
        store.set(id, { rev, bundle: copy(bundle) });
        return rev;
      },
    };
  }

  function create(adapter, opts) {
    if (!adapter || typeof adapter.get !== "function" || typeof adapter.put !== "function") throw new Error("CurioSync needs an adapter with get and put.");
    opts = opts || {};
    const bases = new Map();
    const loadBase = (id) => (bases.has(id) ? bases.get(id) : opts.loadBase ? opts.loadBase(id) || null : null);
    const saveBase = (id, base) => {
      bases.set(id, base);
      if (opts.saveBase) opts.saveBase(id, base);
    };
    const tries = opts.tries || 3;

    async function pull(id) {
      return adapter.get(id);
    }
    async function sync(id, mine) {
      for (let i = 0; i < tries; i++) {
        const stored = await adapter.get(id);
        const base = loadBase(id);
        const theirs = stored ? stored.bundle : null;
        const { bundle, conflicts } = theirs ? merge(base ? base.bundle : null, mine, theirs) : { bundle: copy(mine), conflicts: [] };
        try {
          const rev = await adapter.put(id, bundle, stored ? stored.rev : null);
          saveBase(id, { rev, bundle: copy(bundle) });
          return { rev, bundle, conflicts };
        } catch (e) {
          if (!e || e.code !== "stale") throw e;
        }
      }
      const e = new Error("The project kept changing elsewhere; try again in a moment.");
      e.code = "busy";
      throw e;
    }
    async function push(id, mine) {
      const r = await sync(id, mine);
      return { rev: r.rev, merged: !same(keysOf(r.bundle), keysOf(mine)), conflicts: r.conflicts };
    }
    return { push, pull, sync };
  }

  root.CurioSync = { create, merge, memoryAdapter };
})(typeof window !== "undefined" ? window : globalThis);
