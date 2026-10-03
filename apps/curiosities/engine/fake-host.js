/* engine/fake-host.js: a small imitation of My film (window.CuriosityBoard), so the engine, its host bridge
   and its windows run in tests with no page and no real board. Part of the engine core (no page).

   The letter: "Test your fake host against the real one, then let it enforce what you measured." Every rule
   below was measured on the real board by engine/tests/host-measure.js, which runs the same script against
   the real app in a browser and against this fake, and fails when they disagree.

   MEASURED (RULES):
   1. count() is the Angles per scene control (1 to 8), never less than 1.
   2. set(id, v) only takes the board's live controls; anything else is ignored. It does not check the value.
   3. set(id, v) also removes that control from the applied strand and the automation layer (a hand move wins).
   4. apply("Automation", values) is its own layer; any other label replaces the one applied strand;
      empty values clear it.
   5. panels(): the controls, then the applied strand, then automation; a list of values repeats when it is
      shorter than the panels; empty and missing values leave what is under them.
   6. applied() is a copy: changing it does not change the board.

   window.CurioFakeHost.board({ live, values, scene }) -> an object with the CuriosityBoard methods the engine
   uses, plus calls() (how many times it was called) and broken (set to a method name to make it throw, so tests
   can check the engine survives a failing host). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const RULES = ["count-from-angles", "set-live-only", "set-unapplies", "one-strand-plus-automation", "panels-layering", "applied-is-a-copy"];

  function board(opts) {
    const o = opts || {};
    const LIST = typeof CURIOSITIES !== "undefined" ? CURIOSITIES : root.CURIOSITIES || [];
    const live = (o.live || LIST.filter((c) => c.live)).map((c) => (typeof c === "string" ? { id: c, value: null } : c));
    const ids = live.map((c) => c.id);
    const st = { sceneId: "glass", applied: null, auto: null };
    live.forEach((c) => (st[c.id] = c.value));
    Object.assign(st, o.values || {});
    const scene = o.scene || { id: "fake", title: "A test scene", people: ["Ana", "Ben"], lines: [{ who: "Ana", text: "Hello." }, { who: "Ben", text: "Hi." }] };
    let calls = 0;
    const listeners = [];
    const api = { broken: null };
    const hit = (name) => {
      calls++;
      if (api.broken === name || api.broken === "*") throw new Error("The fake host is broken on purpose (" + name + ").");
    };
    const copy = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
    const notify = () => listeners.slice().forEach((fn) => { try { fn(); } catch (e) {} });
    function unapply(id) {
      if (st.auto && id in st.auto) {
        delete st.auto[id];
        if (!Object.keys(st.auto).length) st.auto = null;
      }
      if (!st.applied || !(id in st.applied.values)) return;
      delete st.applied.values[id];
      if (!Object.keys(st.applied.values).length) st.applied = null;
    }
    function count() {
      return Math.max(1, Number(st.angleCount) || 1);
    }
    function panelState(i) {
      if (!st.applied && !st.auto) return st;
      const out = Object.assign({}, st);
      [st.applied && st.applied.values, st.auto].forEach((layer) =>
        Object.entries(layer || {}).forEach(([id, vals]) => {
          const v = Array.isArray(vals) && vals.length ? vals[i % vals.length] : null;
          if (v != null && v !== "") out[id] = v;
        })
      );
      return out;
    }
    Object.assign(api, {
      scene() {
        hit("scene");
        return scene;
      },
      values() {
        hit("values");
        const out = {};
        ids.forEach((id) => (out[id] = st[id]));
        return out;
      },
      apply(label, values) {
        hit("apply");
        if (label === "Automation") st.auto = values && Object.keys(values).length ? copy(values) : null;
        else st.applied = values && Object.keys(values).length ? { label, values: copy(values) } : null;
        notify();
      },
      applied() {
        hit("applied");
        return st.applied ? { label: st.applied.label, values: copy(st.applied.values) } : null;
      },
      count() {
        hit("count");
        return count();
      },
      panels() {
        hit("panels");
        return Array.from({ length: count() }, (_, i) => Object.assign({}, panelState(i)));
      },
      set(id, value) {
        hit("set");
        if (!ids.includes(id)) return;
        st[id] = value;
        unapply(id);
        notify();
      },
      on(fn) {
        listeners.push(fn);
        return () => listeners.splice(listeners.indexOf(fn), 1);
      },
      calls: () => calls,
      /* The fake's whole state, for tests that compare it with a baseline. */
      dump: () => copy(st),
    });
    return api;
  }

  root.CurioFakeHost = { board, RULES };
})();
