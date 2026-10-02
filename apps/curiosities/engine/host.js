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
       print(state, result) -> { calls, sent, printed, notPrinted }: send it, skipping the call when the board
                           already shows exactly that (so the number of host calls stays low)
       unprint()        -> put back the strand the board had before the engine's first print
       calls()          -> how many calls the engine has made to the host (the speed that matters)
       log()            -> the host edits the engine made, newest last: { at, label, before, after }

   What the board cannot hold, measured (see engine/tests/host-measure.js):
   - it has one applied strand at a time, so printing replaces a Shelf strand (unprint() brings it back);
   - its panels are the camera angles of one scene, at most 8 (Angles per scene), and a strand repeats
     when it is shorter than the panels, so rows past the panel count are not shown there;
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
    function plan(st, result) {
      const ids = new Set(printable());
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
          const vals = st.rows.map((r) => {
            const v = result.dest[r.id + "|" + t.id + "|" + c];
            return v == null ? "" : v;
          });
          if (!vals.length) return;
          values[c] = vals;
          printed.push(c);
        })
      );
      return { values, printed, notPrinted };
    }
    function print(st, result) {
      const p = plan(st, result);
      const now = call(() => (api.applied ? api.applied() : null));
      const want = Object.keys(p.values).length ? { label: LABEL, values: p.values } : null;
      if (before === undefined) before = now && now.label !== LABEL ? now : null;
      let sent = false;
      const nothingToTake = !want && (!now || now.label !== LABEL);
      if (!nothingToTake && (!same(now, want) || !same(lastSent, want))) {
        call(() => api.apply(LABEL, p.values));
        history.push({ at: Date.now(), label: "Print", before: now, after: want });
        if (history.length > 200) history.shift();
        sent = true;
      }
      lastSent = want;
      return { calls, sent, printed: p.printed, notPrinted: p.notPrinted };
    }
    function unprint() {
      const now = call(() => (api.applied ? api.applied() : null));
      if (!now || now.label !== LABEL) return false;
      const back = before || null;
      call(() => api.apply(back ? back.label : LABEL, back ? back.values : {}));
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

  root.CurioHost = { board, LABEL };
})();
