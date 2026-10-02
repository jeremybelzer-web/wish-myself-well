# Cloud saving: groundwork (off, nothing uploaded)

`sync.js` (`window.CurioSync`) keeps a project in step between this browser and a store somewhere else. It merges one storage key at a time, so work done on a phone and on a laptop both survive. When both sides changed the same thing, the newer one is kept and the other is listed, so nothing is lost.

It talks to no server yet, and the app does not load it. A real service plugs in as an adapter with `get(id)` and `put(id, bundle, baseRev)`; see the top of `sync.js`. The plan (`docs/platform-and-saving-plan.md`) recommends Supabase. That choice, and its cost, wait on Jeremy.

Tests: `node sync/tests/run.js`.
