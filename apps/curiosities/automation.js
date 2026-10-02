/* Automation: every curiosity, suite, proximity and proximity suite is one automatable parameter.
   Its trigger switches it on and off. Inside, it has lanes: graded controls, each with its own two settings
   (from and to), a curve, and its own modulator (or it follows the parameter's). A curiosity's main lane runs
   through its scale (low, eye, high), and lanes add its other dimensions (how close to how far). A suite has a
   lane per member, a proximity has cause, delay, how often and effect size, and a proximity suite a delay and
   how often per member. Each patch plays in a moment: a span of panels, and a lane can sweep across it.
   The main lane has two settings, A and B, and a modulator that moves between them (m = 0 is A, m = 1 is B):
   manual (a knob), LFO (sine, triangle, square, saw, random at a rate in Hz), or a MIDI control.
   A trigger (a MIDI note, a key, a click) starts and stops it, so a performer wearing MIDI straps can
   set a curiosity flicking between two settings at the rate they chose. The result is sent to the
   board as an applied strand, panel by panel, and every parameter's m can go out as a MIDI CC so a
   modular synth (VCV Rack through a virtual MIDI port) can follow it, or come in from one to drive it.

   Keys: "c:<curiosity id>", "s:<suite id>", "p:<proximity id>", "ps:<proximity suite id>". */

(function () {
  const KEY = "curiosities-automation-v1";
  const byId = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));
  /* Curiosities the Maya manual and the Studio tools add (viscosity, waveHeight, swirl...) are parameters too. */
  const EXTRA = [];
  ((window.MAYA_MANUAL && window.MAYA_MANUAL.topics) || []).forEach((t) =>
    (t.newCuriosities || []).forEach((n) => {
      if (!n || !n.id || byId[n.id]) return;
      byId[n.id] = { id: n.id, label: n.label || n.id, group: "Maya: " + (t.area || ""), values: n.values || "" };
      EXTRA.push(byId[n.id]);
    })
  );

  /* Groups of proximities that act together, the fourth level. */
  const PROXIMITY_SUITES = [
    { id: "camera-answers-body", label: "The camera answers the body", members: ["handheld-gesture", "approach-push", "object-insert-prox"] },
    { id: "emotion-steers-lens", label: "Emotion steers the lens", members: ["emotion-angle", "emotion-temper"] },
    { id: "loudness-and-size", label: "Loudness and frame size", members: ["close-quiet", "volume-speed"] },
    { id: "weather-and-surface", label: "Weather and surface", members: ["rain-wet", "toon-line", "impact-shake"] },
    { id: "long-form", label: "Long-form shape", members: ["build-drop", "aggressive-quiet", "storm-room", "tension-silence", "energy-hold"] },
  ];

  /* Word curiosities whose catalog order is not a scale get one, so "how low to how high" passes through the middle. */
  const ORDER = {
    angleHeight: ["floor", "low", "eye", "high", "overhead"],
    shotSize: ["insert", "close", "medium", "wide"],
  };
  /* A curiosity's own extra dimensions, offered as lanes: the angle on a face also asks how close to how far. */
  const FACETS = {
    angleHeight: ["shotSize", "dutch"],
    shotSize: ["angleHeight", "moveSpeed"],
    cameraCarry: ["moveSpeed", "cameraMove"],
    cameraMove: ["moveSpeed", "cameraCarry"],
    moveSpeed: ["cameraMove"],
    emotion: ["angleHeight", "moveTemper", "volume"],
    volume: ["gesture", "shotSize"],
    gesture: ["volume", "characterSpeed"],
    characterSpeed: ["characterPath", "moveSpeed"],
    moveTemper: ["moveSpeed", "cutRate"],
    weather: ["wetness", "envMotion"],
  };

  /* The values a curiosity can take: a list of words, or a number range. */
  function domain(id) {
    const c = byId[id];
    if (!c) return { kind: "choice", options: [] };
    if (c.options && ORDER[id]) return { kind: "choice", options: ORDER[id].concat(c.options.filter((o) => !ORDER[id].includes(o))) };
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
    CURIOSITIES.concat(EXTRA).forEach((c) => out.push({ key: "c:" + c.id, level: "curiosity", id: c.id, label: c.label, group: c.group, live: !!c.live, domain: domain(c.id) }));
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
    return { key, a, b, mod: "lfo", shape: "square", rate: 1, depth: 1, manual: 0, curve: "linear", across: 0, where: { from: 0, to: null }, running: false, mode: "gate", outCC: null, lanes: lanesFor(key) };
  }

  /* Each parameter's own graded controls. They start switched off; switching one on makes it act. */
  function lane(id, target, label, from, to, extra) {
    return Object.assign({ id, target, label, from, to, on: false, curve: "linear", mod: "follow", shape: "sine", rate: 0.5, depth: 1, manual: 1, across: 0, outCC: null }, extra || {});
  }
  function curiosityLane(id, from, to) {
    const d = domain(id);
    const lo = d.kind === "range" ? d.min : d.options[0];
    const hi = d.kind === "range" ? d.max : d.options[d.options.length - 1];
    return lane("c:" + id, "c:" + id, (byId[id] || {}).label || id, from == null ? lo : from, to == null ? hi : to);
  }
  function lanesFor(key) {
    const p = PARAM[key];
    if (!p) return [];
    const out = [lane("amount", "amount", "Amount: share of panels it plays in", 1, 1)];
    if (p.level === "curiosity") (FACETS[p.id] || []).filter((f) => byId[f]).forEach((f) => out.push(curiosityLane(f)));
    if (p.level === "suite") Object.entries(suiteSet(p.id)).forEach(([k, v]) => byId[k] && out.push(curiosityLane(k, null, v)));
    if (p.level === "proximity") {
      const x = PROXIMITIES.find((q) => q.id === p.id) || {};
      out.push(lane("cause", "cause", "Cause: share of panels where the cause is set", 0, 1));
      out.push(lane("delay", "delay", "Delay: beats before the effect", x.within || 0, (x.within || 0) + 2));
      out.push(lane("chance", "chance", "How often the effect follows", 1, 0.5));
      if (x.y && !x.y.suite && !("is" in x.y)) out.push(lane("effect", "effect", "Effect size: steps the effect moves", 1, 3));
    }
    if (p.level === "proximity suite") {
      const ps = PROXIMITY_SUITES.find((q) => q.id === p.id) || { members: [] };
      ps.members.forEach((id) => {
        const x = PROXIMITIES.find((q) => q.id === id);
        if (!x) return;
        out.push(lane("delay:" + id, "delay:" + id, `Delay: when ${x.when}`, x.within, x.within + 2));
        out.push(lane("chance:" + id, "chance:" + id, `How often: ${x.then}`, 1, 0.5));
      });
    }
    return out;
  }
  /* Any curiosity can be added as a lane on any parameter. */
  function addLane(key, target) {
    const p = patch(key);
    if (!target || p.lanes.some((l) => l.target === target)) return null;
    const l = target.startsWith("c:") ? curiosityLane(target.slice(2)) : lane(target, target, target, 0, 1);
    l.on = true;
    p.lanes.push(l);
    save();
    emit("change", { key });
    return l;
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
    const p = store.patches[key];
    /* Patches saved before lanes existed get them now. */
    if (p && !p.lanes) Object.assign(p, { lanes: lanesFor(key), curve: p.curve || "linear", across: p.across || 0, where: p.where || { from: 0, to: null } });
    return p;
  }
  function laneOf(key) {
    const [pk, lid] = String(key).split("#");
    const p = store.patches[pk];
    return p && lid ? (p.lanes || []).find((l) => l.id === lid) : null;
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
  /* A curve bends m (0 to 1) before it becomes a value: straight, eased, slow start, slow end, or stepped. */
  const CURVES = { linear: "Straight", ease: "Eased", in: "Slow start", out: "Slow end", steps: "Steps" };
  function curve(name, m) {
    m = Math.max(0, Math.min(1, Number(m) || 0));
    if (name === "ease") return m * m * (3 - 2 * m);
    if (name === "in") return m * m;
    if (name === "out") return 1 - (1 - m) * (1 - m);
    if (name === "steps") return Math.round(m * 4) / 4;
    return m;
  }
  /* A value between two settings of a curiosity. Word curiosities are graded too: low to high passes through eye. */
  function between(id, from, to, c) {
    const d = domain(id);
    if (d.kind === "range") {
      const lo = from === "" || from == null ? d.min : Number(from);
      const hi = to === "" || to == null ? d.max : Number(to);
      const step = d.step || 1;
      return Math.round((lo + (hi - lo) * c) / step) * step;
    }
    const i = Math.max(0, d.options.indexOf(from));
    const j = d.options.indexOf(to) < 0 ? d.options.length - 1 : d.options.indexOf(to);
    return d.options[Math.round(i + (j - i) * c)];
  }
  function curiosityValue(p, m) {
    return between(PARAM[p.key].id, p.a, p.b, curve(p.curve, m));
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
  /* The same panel always gets the same dice, so "amount" and "how often" are steady, not flickering. */
  function dice(key, i, salt) {
    let h = 7;
    const s = key + "|" + (salt || "");
    for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) % 100003;
    const x = Math.sin((i + 1) * 12.9898 + h * 0.37) * 43758.5453;
    return x - Math.floor(x);
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
  function force(x, panels, i) {
    if (x.suite) return Object.assign(panels[i], suiteSet(x.suite));
    if ("is" in x) return (panels[i][x.curiosity] = x.is);
    const prev = panels[Math.max(0, i - 1)][x.curiosity];
    panels[i][x.curiosity] = stepChoice(x.curiosity, prev, x.change === "drops" ? -1 : 1);
  }
  /* o: {from, to, within(i), chance(i), effect(i), cause(i), key}. Every lane is per panel. */
  function applyProximity(prox, panels, o) {
    o = o || {};
    const from = o.from || 0;
    const to = o.to == null ? panels.length - 1 : o.to;
    for (let i = from; i <= to; i++) {
      if (o.cause && dice(o.key, i, "cause") < o.cause(i)) force(prox.x, panels, i);
      if (!holds(prox.x, panels, i)) continue;
      if (o.chance && dice(o.key, i, "chance") >= o.chance(i)) continue;
      const j = Math.min(panels.length - 1, i + Math.max(0, Math.round(o.within ? o.within(i) : prox.within || 0)));
      const y = prox.y;
      const steps = Math.max(1, Math.round(o.effect ? o.effect(i) : 1));
      if (y.suite) Object.assign(panels[j], suiteSet(y.suite));
      else if ("is" in y) panels[j][y.curiosity] = y.is;
      else {
        const dir = y.change === "drops" ? -1 : 1;
        let v = y.change === "changes" ? panels[j][y.curiosity] : panels[Math.max(0, j - 1)][y.curiosity];
        for (let s = 0; s < steps; s++) v = stepChoice(y.curiosity, v, dir);
        panels[j][y.curiosity] = v;
      }
    }
  }

  /* m for one panel. rel is where the panel sits in the moment (0 first, 1 last); "across" sweeps through it. */
  function modAt(o, key, now, rel, master) {
    const across = Number(o.across) || 0;
    if (o.mod === "follow") return master * (1 - across + across * rel);
    if (o.mod === "manual" || o.mod === "midi") return Math.max(0, Math.min(1, Number(o.manual) || 0)) * (1 - across + across * rel);
    const phase = ((now - (t0[key] || now)) / 1000) * (Number(o.rate) || 1) + (across * rel) / 2; /* half a cycle, so the two ends of the moment sit opposite */
    return shapeAt(o.shape || "sine", phase, key + ":" + Math.round(across * rel * 8)) * (o.depth == null ? 1 : Number(o.depth));
  }
  /* What a lane is worth: a curiosity value, a number of beats, a share of panels, or a size of step. */
  function laneValue(lane, m) {
    const c = curve(lane.curve, m);
    if (lane.target.startsWith("c:")) return between(lane.target.slice(2), lane.from, lane.to, c);
    return Number(lane.from) + (Number(lane.to) - Number(lane.from)) * c;
  }

  /* Values per panel: the board's own values, then curiosities, suites, proximities, proximity suites.
     Each patch is on or off (its trigger), plays only in its moment (a span of panels), and each of its lanes
     grades one thing between two settings. */
  function resolve(count, now, baseValues) {
    now = now || performance.now();
    /* A story workspace passes its own base (one character through the scenes); otherwise the board's. */
    const base = baseValues || (window.CuriosityBoard ? window.CuriosityBoard.values() : {});
    const panels = Array.from({ length: count }, () => Object.assign({}, base));
    const active = Object.values(store.patches).filter((p) => p.running);
    const ms = {};
    const order = ["s:", "c:", "p:", "ps:"];
    active.sort((a, b) => order.indexOf(a.key.split(":")[0] + ":") - order.indexOf(b.key.split(":")[0] + ":"));
    active.forEach((p) => {
      const w = p.where || {};
      const from = Math.max(0, Math.min(count - 1, Number(w.from) || 0));
      const to = Math.max(from, Math.min(count - 1, w.to == null || w.to === "" ? count - 1 : Number(w.to)));
      const rel = (i) => (to > from ? (i - from) / (to - from) : 0);
      const master = (i) => modAt(p, p.key, now, rel(i), 0);
      ms[p.key] = master(from);
      const lanes = (p.lanes || []).filter((l) => l.on);
      const lane = (l, i) => laneValue(l, modAt(l, p.key + "#" + l.id, now, rel(i), master(i)));
      lanes.forEach((l) => (ms[p.key + "#" + l.id] = modAt(l, p.key + "#" + l.id, now, 0, master(from))));
      const find = (t) => lanes.find((l) => l.target === t);
      const amount = find("amount");
      const inPlay = (i) => !amount || dice(p.key, i, "amount") < lane(amount, i);
      const level = p.key.split(":")[0];
      if (level === "s" || level === "c") {
        for (let i = from; i <= to; i++) {
          if (!inPlay(i)) continue;
          if (level === "s") {
            const id = master(i) < 0.5 ? p.a : p.b;
            if (id) Object.assign(panels[i], suiteSet(id));
          } else panels[i][PARAM[p.key].id] = curiosityValue(p, master(i));
          lanes.filter((l) => l.target.startsWith("c:")).forEach((l) => (panels[i][l.target.slice(2)] = lane(l, i)));
        }
        return;
      }
      const s = master(from) < 0.5 ? p.a : p.b;
      if (!s || !s.on) return;
      const per = (t, fallback) => (find(t) ? (i) => lane(find(t), i) : fallback);
      if (level === "p") {
        const prox = PROXIMITIES.find((x) => x.id === PARAM[p.key].id);
        if (!prox) return;
        const chance = per("chance", null);
        applyProximity(prox, panels, { key: p.key, from, to, within: per("delay", () => Number(s.within) || 0), effect: per("effect", null), cause: per("cause", null), chance: (i) => (inPlay(i) ? (chance ? chance(i) : 1) : 0) });
        return;
      }
      const ps = PROXIMITY_SUITES.find((x) => x.id === PARAM[p.key].id);
      if (!ps) return;
      ps.members.forEach((id) => {
        const prox = PROXIMITIES.find((x) => x.id === id);
        if (!prox) return;
        const chance = per("chance:" + id, null);
        applyProximity(prox, panels, { key: p.key + id, from, to, within: per("delay:" + id, () => Math.max(0, prox.within + (Number(s.within) || 0))), chance: (i) => (inPlay(i) ? (chance ? chance(i) : 1) : 0) });
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
    (p.lanes || []).forEach((l) => (t0[key + "#" + l.id] = t0[key]));
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
    const p = key.includes("#") ? laneOf(key) : store.patches[key];
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
      /* A control bound to one lane moves only that lane. */
      if (key.includes("#")) {
        const l = laneOf(key);
        if (!l) return;
        if (ev.kind === "note") return trigger(key.split("#")[0], ev.on);
        l.manual = ev.val / 127;
        l.mod = "midi";
        return emit("change", { key: key.split("#")[0] });
      }
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
    /* A tool can register a curiosity it measures so it can be automated: addCuriosity({id, label, values, group}). */
    addCuriosity(c) {
      if (!c || !c.id || PARAM["c:" + c.id]) return;
      byId[c.id] = c;
      const p = { key: "c:" + c.id, level: "curiosity", id: c.id, label: c.label || c.id, group: c.group || "Studio", live: false, domain: domain(c.id) };
      PARAMS.push(p);
      PARAM[p.key] = p;
    },
    patch,
    CURVES,
    FACETS,
    lanes: (key) => patch(key).lanes,
    addLane,
    setLane(key, id, changes) {
      const l = patch(key).lanes.find((x) => x.id === id);
      if (!l) return;
      Object.assign(l, changes);
      if ("rate" in changes || "shape" in changes) t0[key + "#" + id] = t0[key + "#" + id] || performance.now();
      save();
      emit("change", { key });
    },
    removeLane(key, id) {
      const p = patch(key);
      p.lanes = p.lanes.filter((x) => x.id !== id);
      save();
      emit("change", { key });
    },
    /* Values a curiosity lane can pass through, in order (a scale for words, a range for numbers). */
    between,
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
