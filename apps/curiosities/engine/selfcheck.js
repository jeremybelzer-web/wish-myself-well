/* engine/selfcheck.js: checks the engine inside your real project and leaves nothing behind (the letter: "keep
   one script that runs a set of checks inside the user's real project, leaves nothing behind, and compares
   the work with a saved baseline"). History, "Run the self-check".

   1. Baseline: every curiosities-* key in this browser, the engine's fingerprint, and what My film shows.
   2. Saving: the film is saved, read back and compared by fingerprint.
   3. Undo: forty random changes to your film, then undone one by one; the film must be back exactly.
   4. Nothing left behind: every key, the engine and My film are compared with the baseline, and the test's
      undo steps are removed from Redo.
   No window redraws and nothing is sent to My film while it runs.

   window.CurioSelfCheck.run() -> { ok, lines: [{ ok, text }] } */
(function () {
  const E = window.CurioEngine;
  if (!E) return;
  function keys() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("curiosities-") && k !== "curiosities-engine-view-v1") out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }
  function randomCommand(R, st) {
    const pick = (a) => a[Math.floor(R() * a.length)];
    const t = pick(st.tracks);
    const c = t && t.curiosities.length ? pick(t.curiosities) : null;
    const r = pick(st.rows);
    if (!t || !c || !r) return { type: "addRow" };
    const v = window.CurioScale.at(c, R());
    return pick([
      { type: "setSource", row: r.id, track: t.id, curiosity: c, value: v },
      { type: "edit", row: r.id, track: t.id, curiosity: c, value: v },
      { type: "edit", row: r.id, track: t.id, curiosity: c, off: true },
      { type: "setPoint", row: r.id, track: t.id, curiosity: c, value: v },
      { type: "addRow", at: Math.floor(R() * st.rows.length) },
      { type: "renameRow", row: r.id, label: "Self-check " + Math.floor(R() * 100) },
      { type: "addLink", from: { track: t.id, curiosity: c }, to: { track: pick(st.tracks).id, curiosity: pick(pick(st.tracks).curiosities) || c }, does: pick(["follow", "rise", "moveWith"]), amount: R() },
      { type: "rename", name: "Self-check" },
    ]);
  }
  function run() {
    const lines = [];
    const add = (ok, text) => lines.push({ ok: !!ok, text });
    const st0 = E.state();
    if (!st0.rows.length || !st0.tracks.length) return { ok: false, lines: [{ ok: false, text: "Start or read a film first: the self-check needs rows and tracks." }] };
    const baseKeys = keys();
    const baseFp = E.fingerprint();
    const board = window.CuriosityBoard;
    const baseBoard = board ? JSON.stringify({ a: board.applied(), v: board.values() }) : "";
    const steps0 = E.history().undo.length;
    E.silently(() => {
      const c = E.check();
      add(c.ok, c.ok ? "Saving: the film comes back from saving exactly as it is." : "Saving: the film would change on reload.");
      let seed = 12345;
      const R = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
      let made = 0;
      for (let i = 0; i < 40; i++) {
        const out = E.send(randomCommand(R, E.state()));
        if (out.ok && !out.unchanged) made++;
      }
      for (let i = 0; i < made; i++) E.undo();
      E.dropRedo(made);
      add(E.fingerprint() === baseFp && E.history().undo.length === steps0, "Undo: " + made + " test changes made and undone; the film is " + (E.fingerprint() === baseFp ? "back exactly" : "NOT back as it was") + ".");
    });
    E.save();
    const after = keys();
    const changed = Object.keys(Object.assign({}, baseKeys, after)).filter((k) => baseKeys[k] !== after[k]);
    add(!changed.length, changed.length ? "Left behind: " + changed.join(", ") + " changed." : "Nothing left behind: every saved part of the app is as it was.");
    if (board) {
      const same = JSON.stringify({ a: board.applied(), v: board.values() }) === baseBoard;
      add(same, same ? "My film shows exactly what it showed before." : "My film changed during the check.");
    }
    return { ok: lines.every((l) => l.ok), lines };
  }
  window.CurioSelfCheck = { run };
})();
