/* engine/host.js: the engine's bridge to its host. Part of the engine core (no page).

   The letter's rule: don't replace the host, build around it. Here the host is My film (the board,
   window.CuriosityBoard), which already drives the Storyboard, the Maya and Blender cameras, Resolve and
   Unreal through its panels. The engine reads its panels as rows and "prints" the result back as one named
   strand ("Engine"), the same way a Shelf strand or the bridge's "apply" message does.

   window.CurioHost
   - board(api): a host around a board-like object (the real CuriosityBoard, or CurioFakeHost.board()).
       read(names?)     -> a film to import: one row per panel, tracks for Master, Camera and the cast,
                           and the board's own values as your material
       printable()      -> the curiosity ids the board can show (its live controls)
       plan(state, result) -> { values, printed, notPrinted }: what a print would send
       print(state, result) -> { calls, sent, printed, notPrinted, from, count, of }: send the window of
                           rows My film can show (from the film's print.from row, as many as its panels),
                           through bridge.js's "apply" message like any tool, skipping the call when the
                           board already shows exactly that (so the number of host calls stays low)
       unprint()        -> put back the strand the board had before the engine's first print
       calls()          -> how many calls the engine has made to the host (the speed that matters)
       log()            -> the host edits the engine made, newest last: { at, label, before, after }

   What the board cannot hold, measured (see engine/tests/host-measure.js):
   - it has one applied strand at a time, so printing replaces a Shelf strand (unprint() brings it back);
   - its panels are the camera angles of one scene, at most 8 (Angles per scene), so a longer film is
     printed a window at a time; the storyboard host below takes the whole film;
   - it has no per-character values, so a curiosity is printed from the first track that holds it. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const LABEL = "Engine";
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function board(api) {
    let calls = 0;
    let before = undefined; /* the strand there before the engine's first print */
    let lastSent = null;
    const history = [];
    const call = (fn) => {
      calls++;
      return fn();
    };
    function printable() {
      const v = call(() => api.values()) || {};
      return Object.keys(v);
    }
    function read(names) {
      const panels = call(() => api.panels()) || [];
      const scene = call(() => (api.scene ? api.scene() : null)) || {};
      let cast = Array.isArray(names) && names.length ? names : [];
      if (!cast.length && scene.lines)
        scene.lines.forEach((l) => l && l.text !== "—" && !cast.includes(l.who) && cast.length < 2 && cast.push(l.who));
      const tracks = root.CurioTracks.forCast(cast);
      const ids = new Set(printable());
      const rows = panels.map((_, i) => ({ id: "r" + (i + 1), label: "Panel " + (i + 1) }));
      const source = {};
      panels.forEach((p, i) =>
        tracks.forEach((t) =>
          t.curiosities.forEach((c) => {
            if (!ids.has(c) || p[c] == null) return;
            const v = root.CurioScale.fix(c, p[c]);
            if (v != null) source[rows[i].id + "|" + t.id + "|" + c] = v;
          })
        )
      );
      return { name: scene.title || "My film", rows, tracks, source, next: rows.length + tracks.length + 1 };
    }
    /* The rows a print shows: My film has as many panels as Angles per scene (1 to 8), so a longer film is
       shown a window at a time, starting at the film's print.from row. */
    function windowOf(st) {
      const n = Math.max(1, Number(call(() => (api.count ? api.count() : st.rows.length))) || st.rows.length || 1);
      const from = Math.min(Math.max(0, (st.print && st.print.from) || 0), Math.max(0, st.rows.length - 1));
      return { from, count: n, rows: st.rows.slice(from, from + n) };
    }
    /* Every print goes the way a tool's bridge sends one: bridge.js's "apply" message, so the engine, Maya,
       Blender, Resolve and Unreal all reach My film by the same door. A stand-in board is called directly. */
    function send(label, values) {
      if (api === root.CuriosityBoard && root.CurioBridge && typeof root.CurioBridge.handle === "function") {
        const r = root.CurioBridge.handle({ type: "apply", label, values });
        if (r && r.type === "error") throw new Error(r.error);
        return;
      }
      api.apply(label, values);
    }
    function plan(st, result) {
      const ids = new Set(printable());
      const win = windowOf(st);
      const values = {};
      const printed = [];
      const notPrinted = [];
      const seen = new Set();
      st.tracks.forEach((t) =>
        t.curiosities.forEach((c) => {
          if (seen.has(c)) return;
          seen.add(c);
          if (!ids.has(c)) {
            notPrinted.push(c);
            return;
          }
          const vals = win.rows.map((r) => {
            const v = result.dest[r.id + "|" + t.id + "|" + c];
            return v == null ? "" : v;
          });
          if (!vals.length) return;
          values[c] = vals;
          printed.push(c);
        })
      );
      return { values, printed, notPrinted, from: win.from, count: win.rows.length, of: st.rows.length };
    }
    function print(st, result) {
      const p = plan(st, result);
      const now = call(() => (api.applied ? api.applied() : null));
      const want = Object.keys(p.values).length ? { label: LABEL, values: p.values } : null;
      if (before === undefined) before = now && now.label !== LABEL ? now : null;
      let sent = false;
      const nothingToTake = !want && (!now || now.label !== LABEL);
      if (!nothingToTake && (!same(now, want) || !same(lastSent, want))) {
        call(() => send(LABEL, p.values));
        history.push({ at: Date.now(), label: "Print", before: now, after: want });
        if (history.length > 200) history.shift();
        sent = true;
      }
      lastSent = want;
      return { calls, sent, printed: p.printed, notPrinted: p.notPrinted, from: p.from, count: p.count, of: p.of };
    }
    function unprint() {
      const now = call(() => (api.applied ? api.applied() : null));
      if (!now || now.label !== LABEL) return false;
      const back = before || null;
      call(() => send(back ? back.label : LABEL, back ? back.values : {}));
      history.push({ at: Date.now(), label: "Take back", before: now, after: back });
      before = undefined;
      lastSent = null;
      return true;
    }
    /* A host that fails (a half-loaded page, a closed bridge) must never take the engine down with it. */
    const safe = (fn) =>
      function () {
        try {
          return fn.apply(null, arguments);
        } catch (e) {
          return { error: "My film did not answer (" + String((e && e.message) || e).slice(0, 120) + ")." };
        }
      };
    return { name: "My film", read: safe(read), printable: safe(printable), plan: safe(plan), print: safe(print), unprint: safe(unprint), calls: () => calls, log: () => history.slice() };
  }

  /* ---------- the storyboard: a host with no 8-panel limit ----------
     The storyboard (window.CuriosityStoryboard) keeps many scenes of up to 24 panels each. The engine reads
     any of its scenes as rows (a film of up to 64 moments) and prints the whole film back as scenes of its
     own, marked engine: true, replacing the ones it printed before.
     storyboard(api, opts): api is CuriosityStoryboard (or a stand-in with data() and, when it has it,
     putScenes(tag, scenes)). Without putScenes the scenes are written to the storyboard's saved key and
     { reload: true } asks the page to reload, so the storyboard reads them (the app-wide undo records it).
       scenes()          -> [{ index, name, panels }]
       read(indexes)     -> a film to import: each panel of those scenes a row
       print(st, result) -> { scenes, panels, reload? }
       unprint()         -> removes the engine's scenes */
  const PER = 24;
  function flat(st, result, rows) {
    /* One value per curiosity per row, from the first track that holds it (a storyboard panel and My film
       have no per-character values). */
    const seen = new Set();
    const out = rows.map(() => ({}));
    st.tracks.forEach((t) =>
      t.curiosities.forEach((c) => {
        if (seen.has(c)) return;
        seen.add(c);
        rows.forEach((r, i) => {
          const v = result.dest[r.id + "|" + t.id + "|" + c];
          if (v != null) out[i][c] = v;
        });
      })
    );
    return out;
  }
  function storyboard(api, opts) {
    opts = opts || {};
    const storage = opts.storage || (typeof localStorage !== "undefined" ? localStorage : null);
    const key = (api && api.KEY) || "curiosities-storyboard-v1";
    let calls = 0;
    const call = (fn) => {
      calls++;
      return fn();
    };
    const data = () => call(() => api.data()) || { scenes: [] };
    function scenes() {
      return (data().scenes || []).map((s, i) => ({ index: i, name: String(s.name || "Scene " + (i + 1)), panels: (s.panels || []).length, engine: s.engine === true }));
    }
    function read(indexes, names) {
      const all = data().scenes || [];
      const pick = (Array.isArray(indexes) && indexes.length ? indexes : all.map((_, i) => i)).filter((i) => all[i]);
      const panels = [];
      pick.forEach((i) => (all[i].panels || []).forEach((p, k) => panels.length < 64 && panels.push({ p, label: String(all[i].name || "Scene " + (i + 1)).slice(0, 50) + ", panel " + (k + 1) })));
      let cast = Array.isArray(names) && names.length ? names : [];
      if (!cast.length) panels.forEach(({ p }) => p && p.line && p.line.who && p.line.text !== "—" && !cast.includes(p.line.who) && cast.length < 2 && cast.push(String(p.line.who)));
      const tracks = root.CurioTracks.forCast(cast);
      const rows = panels.map((_, i) => ({ id: "r" + (i + 1), label: panels[i].label }));
      const source = {};
      panels.forEach(({ p }, i) =>
        tracks.forEach((t) =>
          t.curiosities.forEach((c) => {
            const v = p && p.v && p.v[c] != null ? root.CurioScale.fix(c, p.v[c]) : null;
            if (v != null) source[rows[i].id + "|" + t.id + "|" + c] = v;
          })
        )
      );
      return { name: pick.length === 1 ? String(all[pick[0]].name || "Storyboard") : "Storyboard", rows, tracks, source, next: rows.length + tracks.length + 1 };
    }
    function build(st, result) {
      const vals = flat(st, result, st.rows);
      const out = [];
      for (let i = 0; i < st.rows.length; i += PER) {
        const part = st.rows.slice(i, i + PER);
        const total = Math.ceil(st.rows.length / PER);
        out.push({
          id: "engine-" + (out.length + 1),
          engine: true,
          name: (st.name || "My film") + (total > 1 ? " (" + (out.length + 1) + " of " + total + ")" : ""),
          note: "From the engine: moments " + (i + 1) + " to " + (i + part.length) + ".",
          made: new Date().toISOString(),
          panels: part.map((r, k) => ({ v: vals[i + k], line: { who: "", text: r.label } })),
        });
      }
      return out;
    }
    function write(fn) {
      if (typeof api.putScenes === "function") {
        call(() => api.putScenes("engine", fn((data().scenes || []).filter((s) => s.engine !== true)).filter((s) => s.engine === true)));
        return { reload: false };
      }
      const saved = data();
      saved.scenes = fn((saved.scenes || []).filter((s) => s.engine !== true));
      call(() => storage.setItem(key, JSON.stringify(saved)));
      return { reload: true };
    }
    function print(st, result) {
      const made = build(st, result);
      const w = write((kept) => kept.concat(made));
      return { scenes: made.length, panels: st.rows.length, reload: w.reload, calls };
    }
    function unprint() {
      const had = scenes().filter((s) => s.engine).length;
      if (!had) return false;
      return write((kept) => kept);
    }
    const safe = (fn) =>
      function () {
        try {
          return fn.apply(null, arguments);
        } catch (e) {
          return { error: "The storyboard did not answer (" + String((e && e.message) || e).slice(0, 120) + ")." };
        }
      };
    return { name: "Storyboard", PER, scenes: safe(scenes), read: safe(read), print: safe(print), unprint: safe(unprint), calls: () => calls };
  }

  /* ---------- the whole film for a tool ----------
     timeline(st, result) -> the bridge's "timeline" reply: every row (not just My film's 8 panels), each
     curiosity once (from the first track that holds it), and each track's own values:
       { type: "timeline", name, rows: [{ id, label }], tracks: [{ id, kind, label }],
         panels: [{ <curiosity>: value }], byTrack: { <track>: [{ <curiosity>: value }] } }
     extendBridge(): teaches window.CurioBridge the { type: "timeline" } message (Maya, Blender, Resolve and
     Unreal ask for it the way they ask for "panels"), unless bridge.js answers it itself. */
  function timeline(st, result) {
    const byTrack = {};
    st.tracks.forEach((t) => {
      byTrack[t.id] = st.rows.map((r) => {
        const o = {};
        t.curiosities.forEach((c) => {
          const v = result.dest[r.id + "|" + t.id + "|" + c];
          if (v != null) o[c] = v;
        });
        return o;
      });
    });
    return {
      type: "timeline",
      name: st.name,
      rows: st.rows.map((r) => ({ id: r.id, label: r.label })),
      tracks: st.tracks.map((t) => ({ id: t.id, kind: t.kind, label: t.label })),
      panels: flat(st, result, st.rows),
      byTrack,
    };
  }
  function extendBridge() {
    const B = root.CurioBridge;
    if (!B || typeof B.handle !== "function" || B.handle.engine || B.TIMELINE) return false;
    const inner = B.handle;
    const handle = function (msg) {
      let m = msg;
      if (typeof m === "string") {
        try {
          m = JSON.parse(m);
        } catch (e) {
          return inner(msg);
        }
      }
      if (m && m.type === "timeline") {
        const E = root.CurioEngine;
        if (!E) return { type: "error", error: "the engine is not loaded" };
        return timeline(E.state(), E.result());
      }
      return inner(msg);
    };
    handle.engine = true;
    B.handle = handle;
    return true;
  }

  root.CurioHost = { board, storyboard, timeline, extendBridge, LABEL };
})();
