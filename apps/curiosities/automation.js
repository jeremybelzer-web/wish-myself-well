/* Automation: every curiosity, suite, proximity and proximity suite is one automatable parameter.
   A parameter has two settings, A and B, and a modulator that moves between them (m = 0 is A, m = 1 is B):
   manual (a knob), LFO (sine, triangle, square, saw, random at a rate in Hz), or a MIDI control.
   A trigger (a MIDI note, a key, a click) starts and stops it, so a performer wearing MIDI straps can
   set a curiosity flicking between two settings at the rate they chose. The result is sent to the
   board as an applied strand, panel by panel, and every parameter's m can go out as a MIDI CC so a
   modular synth (VCV Rack through a virtual MIDI port) can follow it, or come in from one to drive it.

   Keys: "c:<curiosity id>", "s:<suite id>", "p:<proximity id>", "ps:<proximity suite id>". */

(function () {
  const KEY = "curiosities-automation-v1";
  const byId = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));

  /* Groups of proximities that act together, the fourth level. */
  const PROXIMITY_SUITES = [
    { id: "camera-answers-body", label: "The camera answers the body", members: ["handheld-gesture", "approach-push", "object-insert-prox"] },
    { id: "emotion-steers-lens", label: "Emotion steers the lens", members: ["emotion-angle", "emotion-temper"] },
    { id: "loudness-and-size", label: "Loudness and frame size", members: ["close-quiet", "volume-speed"] },
    { id: "weather-and-surface", label: "Weather and surface", members: ["rain-wet", "toon-line", "impact-shake"] },
    { id: "long-form", label: "Long-form shape", members: ["build-drop", "aggressive-quiet", "storm-room", "tension-silence", "energy-hold"] },
  ];

  /* The values a curiosity can take: a list of words, or a number range. */
  function domain(id) {
    const c = byId[id];
    if (!c) return { kind: "choice", options: [] };
    if (c.options) return { kind: "choice", options: c.options.slice() };
    if (c.kind === "range") return { kind: "range", min: c.min, max: c.max, step: c.step || 1 };
    const v = String(c.values || "");
    const m = v.match(/(-?\d+(?:\.\d+)?)\s*(?:to|–|-)\s*(-?\d+(?:\.\d+)?)/);
    if (m && !/,/.test(v.replace(m[0], ""))) return { kind: "range", min: Number(m[1]), max: Number(m[2]), step: Number(m[2]) - Number(m[1]) > 20 ? 5 : 1 };
    const opts = v.split(/,|·/).map((s) => s.trim()).filter(Boolean);
    return { kind: "choice", options: opts.length ? opts : ["off", "on"] };
  }

  function params() {
    const out = [];
    CURIOSITIES.forEach((c) => out.push({ key: "c:" + c.id, level: "curiosity", id: c.id, label: c.label, group: c.group, live: !!c.live, domain: domain(c.id) }));
    SUITES.forEach((s) => out.push({ key: "s:" + s.id, level: "suite", id: s.id, label: s.label, group: s.kind || "suite" }));
    PROXIMITIES.forEach((p) => out.push({ key: "p:" + p.id, level: "proximity", id: p.id, label: `When ${p.when}, ${p.then}`, group: "proximity" }));
    PROXIMITY_SUITES.forEach((p) => out.push({ key: "ps:" + p.id, level: "proximity suite", id: p.id, label: p.label, group: "proximity suite" }));
    return out;
  }
  const PARAMS = params();
  const PARAM = Object.fromEntries(PARAMS.map((p) => [p.key, p]));

  function defaults(key) {
    const p = PARAM[key];
    if (!p) return null;
    let a, b;
    if (p.level === "curiosity") {
      const d = p.domain;
      if (d.kind === "range") {
        a = d.min;
        b = d.max;
      } else {
        a = d.options[0];
        b = d.options[d.options.length - 1];
      }
    } else if (p.level === "suite") {
      a = "";
      b = p.id;
    } else {
      const within = p.level === "proximity" ? (PROXIMITIES.find((x) => x.id === p.id) || {}).within || 0 : 0;
      a = { on: false, within };
      b = { on: true, within };
    }
    return { key, a, b, mod: "lfo", shape: "square", rate: 1, depth: 1, manual: 0, running: false, mode: "gate", outCC: null };
  }

  let store = { patches: {}, bindings: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) store = Object.assign(store, JSON.parse(raw));
  } catch (e) {}
  Object.values(store.patches).forEach((p) => (p.running = false));
  function save() {
    try {
      const copy = { patches: {}, bindings: store.bindings };
      Object.entries(store.patches).forEach(([k, p]) => (copy.patches[k] = Object.assign({}, p, { running: false })));
      localStorage.setItem(KEY, JSON.stringify(copy));
    } catch (e) {}
  }

  const listeners = [];
  function emit(type, data) {
    listeners.forEach((fn) => {
      try {
        fn(type, data);
      } catch (e) {}
    });
  }

  function patch(key) {
    if (!store.patches[key]) store.patches[key] = defaults(key);
    return store.patches[key];
  }

  /* ---------- modulators ---------- */
  const t0 = {};
  const held = {};
  function shapeAt(shape, phase, key) {
    const f = phase - Math.floor(phase);
    if (shape === "sine") return 0.5 - 0.5 * Math.cos(f * 2 * Math.PI);
    if (shape === "triangle") return f < 0.5 ? f * 2 : 2 - f * 2;
    if (shape === "saw") return f;
    if (shape === "random") {
      const step = Math.floor(phase);
      if (!held[key] || held[key].step !== step) held[key] = { step, v: Math.random() };
      return held[key].v;
    }
    return f < 0.5 ? 0 : 1;
  }
  function mOf(p, now) {
    if (!p.running) return null;
    if (p.mod === "manual" || p.mod === "midi") return p.manual;
    const phase = ((now - (t0[p.key] || now)) / 1000) * p.rate;
    return shapeAt(p.shape, phase, p.key) * p.depth;
  }

  /* ---------- turning m into values ---------- */
  function curiosityValue(p, m) {
    const d = PARAM[p.key].domain;
    if (d.kind === "range") {
      const v = Number(p.a) + (Number(p.b) - Number(p.a)) * m;
      const step = d.step || 1;
      return Math.round(v / step) * step;
    }
    return m < 0.5 ? p.a : p.b;
  }
  function stepChoice(id, v, dir) {
    const d = domain(id);
    if (d.kind === "range") return Math.max(d.min, Math.min(d.max, Number(v || d.min) + dir * (d.step || 1)));
    const i = d.options.indexOf(v);
    const j = Math.max(0, Math.min(d.options.length - 1, (i < 0 ? 0 : i) + (dir || 1)));
    return d.options[j];
  }
  function suiteSet(id) {
    const s = SUITES.find((x) => x.id === id);
    return s ? s.set : {};
  }
  function holds(x, panels, i) {
    if (x.suite) return Object.entries(suiteSet(x.suite)).every(([k, v]) => String(panels[i][k]) === String(v));
    const v = panels[i][x.curiosity];
    if ("is" in x) return String(v) === String(x.is);
    if (i === 0) return false;
    const before = panels[i - 1][x.curiosity];
    if (x.change === "changes") return String(v) !== String(before);
    if (x.change === "rises") return Number(v) > Number(before) || domain(x.curiosity).options?.indexOf(v) > domain(x.curiosity).options?.indexOf(before);
    if (x.change === "drops") return Number(v) < Number(before) || domain(x.curiosity).options?.indexOf(v) < domain(x.curiosity).options?.indexOf(before);
    return false;
  }
  function applyProximity(prox, within, panels) {
    for (let i = 0; i < panels.length; i++) {
      if (!holds(prox.x, panels, i)) continue;
      const j = Math.min(panels.length - 1, i + within);
      const y = prox.y;
      if (y.suite) Object.assign(panels[j], suiteSet(y.suite));
      else if ("is" in y) panels[j][y.curiosity] = y.is;
      else if (y.change === "rises") panels[j][y.curiosity] = stepChoice(y.curiosity, panels[Math.max(0, j - 1)][y.curiosity], 1);
      else if (y.change === "drops") panels[j][y.curiosity] = stepChoice(y.curiosity, panels[Math.max(0, j - 1)][y.curiosity], -1);
      else panels[j][y.curiosity] = stepChoice(y.curiosity, panels[j][y.curiosity], 1);
    }
  }

  /* Values per panel: the board's own values, then curiosities, suites, proximities, proximity suites. */
  function resolve(count, now) {
    now = now || performance.now();
    const base = window.CuriosityBoard ? window.CuriosityBoard.values() : {};
    const panels = Array.from({ length: count }, () => Object.assign({}, base));
    const active = Object.values(store.patches).filter((p) => p.running);
    const ms = {};
    active.forEach((p) => (ms[p.key] = mOf(p, now)));
    active.filter((p) => p.key.startsWith("s:")).forEach((p) => {
      const id = ms[p.key] < 0.5 ? p.a : p.b;
      if (id) panels.forEach((v) => Object.assign(v, suiteSet(id)));
    });
    active.filter((p) => p.key.startsWith("c:")).forEach((p) => {
      const v = curiosityValue(p, ms[p.key]);
      panels.forEach((x) => (x[PARAM[p.key].id] = v));
    });
    active.filter((p) => p.key.startsWith("p:")).forEach((p) => {
      const s = ms[p.key] < 0.5 ? p.a : p.b;
      const prox = PROXIMITIES.find((x) => x.id === PARAM[p.key].id);
      if (s && s.on && prox) applyProximity(prox, Number(s.within) || 0, panels);
    });
    active.filter((p) => p.key.startsWith("ps:")).forEach((p) => {
      const s = ms[p.key] < 0.5 ? p.a : p.b;
      const ps = PROXIMITY_SUITES.find((x) => x.id === PARAM[p.key].id);
      if (!s || !s.on || !ps) return;
      ps.members.forEach((id) => {
        const prox = PROXIMITIES.find((x) => x.id === id);
        if (prox) applyProximity(prox, Math.max(0, prox.within + (Number(s.within) || 0)), panels);
      });
    });
    return { panels, ms };
  }

  /* ---------- the clock: send to the board and to MIDI out ---------- */
  let lastSent = "";
  let lastBoard = 0;
  function liveIds() {
    return CURIOSITIES.filter((c) => c.live).map((c) => c.id).concat(["shotSize", "angleHeight", "dutch"]);
  }
  function tick() {
    const now = performance.now();
    const running = Object.values(store.patches).filter((p) => p.running);
    if (running.length) {
      const count = Number(window.CuriosityBoard && window.CuriosityBoard.values().angleCount) || 4;
      const { panels, ms } = resolve(count, now);
      emit("tick", { panels, ms });
      Object.entries(ms).forEach(([k, m]) => sendOut(k, m));
      if (now - lastBoard > 125 && window.CuriosityBoard) {
        const values = {};
        const base = window.CuriosityBoard.values();
        liveIds().forEach((id) => {
          if (panels.some((p) => p[id] != null && String(p[id]) !== String(base[id]))) values[id] = panels.map((p) => p[id]);
        });
        const sig = JSON.stringify(values);
        if (sig !== lastSent) {
          lastSent = sig;
          lastBoard = now;
          window.CuriosityBoard.apply("Automation", values);
        }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function start(key) {
    const p = patch(key);
    p.running = true;
    t0[key] = performance.now();
    emit("change", { key });
  }
  function stop(key) {
    const p = patch(key);
    p.running = false;
    lastSent = "";
    emit("change", { key });
  }
  function trigger(key, on) {
    const p = patch(key);
    if (p.mode === "toggle") {
      if (on) (p.running ? stop : start)(key);
    } else if (on) start(key);
    else stop(key);
  }

  /* ---------- MIDI in and out (Web MIDI) ---------- */
  const midi = { access: null, outputs: [], out: null, learning: null, status: "off" };
  const lastOut = {};
  function sendOut(key, m) {
    const p = store.patches[key];
    if (!midi.out || !p || p.outCC == null || m == null) return;
    const v = Math.round(m * 127);
    if (lastOut[key] === v) return;
    lastOut[key] = v;
    try {
      midi.out.send([0xb0, Number(p.outCC) & 127, v]);
    } catch (e) {}
  }
  function onMidi(e) {
    const [st, d1, d2] = e.data;
    const type = st & 0xf0;
    const ev = type === 0x90 && d2 > 0 ? { kind: "note", num: d1, on: true, vel: d2 } : type === 0x80 || (type === 0x90 && d2 === 0) ? { kind: "note", num: d1, on: false } : type === 0xb0 ? { kind: "cc", num: d1, val: d2 } : null;
    if (!ev) return;
    emit("midi", ev);
    if (midi.learning) {
      store.bindings[midi.learning] = { kind: ev.kind, num: ev.num };
      emit("learned", { key: midi.learning, binding: store.bindings[midi.learning] });
      midi.learning = null;
      save();
      return;
    }
    Object.entries(store.bindings).forEach(([key, b]) => {
      if (b.kind !== ev.kind || b.num !== ev.num) return;
      const p = patch(key);
      if (ev.kind === "note") trigger(key, ev.on);
      else if (p.mod === "lfo" && b.target === "rate") p.rate = 0.1 + (ev.val / 127) * 9.9;
      else {
        p.manual = ev.val / 127;
        if (!p.running) start(key);
      }
      emit("change", { key });
    });
  }
  function connectMidi() {
    if (!navigator.requestMIDIAccess) {
      midi.status = "This browser has no Web MIDI. Chrome and Edge do.";
      emit("midi-status", midi.status);
      return Promise.resolve(false);
    }
    return navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        midi.access = access;
        const hook = () => {
          access.inputs.forEach((i) => (i.onmidimessage = onMidi));
          midi.outputs = Array.from(access.outputs.values());
          midi.status = `MIDI on: ${access.inputs.size} in, ${access.outputs.size} out.`;
          emit("midi-status", midi.status);
        };
        access.onstatechange = hook;
        hook();
        return true;
      })
      .catch(() => {
        midi.status = "MIDI was refused or is not available.";
        emit("midi-status", midi.status);
        return false;
      });
  }

  /* Computer keys work as triggers too: bind a key to any parameter. */
  window.addEventListener("keydown", (e) => {
    if (e.repeat || /input|select|textarea/i.test(e.target.tagName)) return;
    if (midi.learning && midi.learning.startsWith("key-learn:")) return;
    Object.entries(store.bindings).forEach(([key, b]) => {
      if (b.kind === "key" && b.code === e.code) trigger(key, true);
    });
  });
  window.addEventListener("keyup", (e) => {
    Object.entries(store.bindings).forEach(([key, b]) => {
      if (b.kind === "key" && b.code === e.code && patch(key).mode !== "toggle") trigger(key, false);
    });
  });

  window.CurioAuto = {
    PARAMS,
    PROXIMITY_SUITES,
    param: (key) => PARAM[key],
    domain,
    patch,
    set(key, changes) {
      Object.assign(patch(key), changes);
      if ("rate" in changes || "shape" in changes) t0[key] = t0[key] || performance.now();
      save();
      emit("change", { key });
    },
    start,
    stop,
    trigger,
    stopAll() {
      Object.keys(store.patches).forEach((k) => store.patches[k].running && stop(k));
    },
    running: () => Object.values(store.patches).filter((p) => p.running).map((p) => p.key),
    resolve,
    m: (key) => mOf(patch(key), performance.now()),
    bindings: () => store.bindings,
    bind(key, binding) {
      if (binding) store.bindings[key] = binding;
      else delete store.bindings[key];
      save();
      emit("change", { key });
    },
    learn(key) {
      midi.learning = key;
      emit("learning", { key });
    },
    midi,
    connectMidi,
    setOutput(id) {
      midi.out = midi.outputs.find((o) => o.id === id) || null;
    },
    on(fn) {
      listeners.push(fn);
      return () => listeners.splice(listeners.indexOf(fn), 1);
    },
  };
})();
