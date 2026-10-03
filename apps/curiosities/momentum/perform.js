/* momentum/perform.js: the attention meter, performable. While a performer plays My film (MIDI pads, straps,
   automation, the bridge), this follows the board live and sends the meter out so they can see it or feel
   it: MIDI control changes and notes (to a synth, lights or VCV Rack), bridge values (OSC and WebSocket
   through the desktop app's bridge), a phone buzz when attention has stayed too long, and a full-screen
   stage meter.

   window.CurioPerform
   - start(opts) / stop() / running()        follow My film live (the same recorder as the Momentum window)
   - state() -> { attention 0..1, over, family, familyIndex, momentum 0..1, compass, compassIndex, seconds,
                  limit, cue }   (attention is the current family's stretch against the limit, 1 = at the limit)
   - values() -> bridge value messages: { type: "value", key: "m:attention" | "m:momentum" | "m:family" |
                  "m:compass" | "m:over", m: 0..1 }. OSC: /curio/value/m/attention 0.42 and so on.
   - midi: { enable(), outputs(), setOutput(id), settings(), set(patch) } using Web MIDI.
       Control changes (channel and numbers can be changed): attention CC 20, momentum CC 21, family CC 22,
       compass CC 23. A note when attention moves: 60 visual, 61 audio, 62 thought, 63 movement, 64 plot.
       Note 72 when a family goes past the limit.
   - on(fn) -> unsubscribe; fn(state) about four times a second while running.
   The bridge carries these values once the desktop app's bridge asks CurioBridge.values(): when the bridge
   offers addSource(fn) it is used, otherwise values() is extended in place (both keep the bridge's own
   values first). Settings: localStorage key curiosities-momentum-perform-v1. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const KEY = "curiosities-momentum-perform-v1";
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const R = () => root.CurioRates;
  const C = () => root.CurioCompass;
  const CUE_NOTES = { visual: 60, audio: 61, thought: 62, movement: 63, plot: 64 };
  const OVER_NOTE = 72;

  function loadSettings() {
    let s = null;
    try {
      s = JSON.parse(root.localStorage.getItem(KEY));
    } catch (e) {}
    s = s && typeof s === "object" ? s : {};
    return {
      channel: Number.isInteger(s.channel) && s.channel >= 1 && s.channel <= 16 ? s.channel : 1,
      cc: Object.assign({ attention: 20, momentum: 21, family: 22, compass: 23 }, s.cc || {}),
      notes: s.notes !== false,
      buzz: s.buzz !== false,
      output: typeof s.output === "string" ? s.output : "",
      bridge: s.bridge !== false,
    };
  }
  const settings = loadSettings();
  function saveSettings() {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  let rec = null;
  let unhook = null;
  let timer = null;
  let last = null;
  const listeners = [];
  let current = blank();
  function blank() {
    return { attention: 0, over: false, family: null, familyIndex: 0, momentum: 0, compass: null, compassIndex: 0, seconds: 0, limit: 20, cue: null, label: "" };
  }
  function profiles() {
    let p = null;
    try {
      p = JSON.parse(root.localStorage.getItem("curiosities-momentum-v1"));
    } catch (e) {}
    const ids = (p && Array.isArray(p.compare) && p.compare.length && p.compare) || ["pulp-fiction"];
    const measured = (p && Array.isArray(p.measured) && p.measured) || [];
    const limit = p && Number(p.limit) > 0 ? Number(p.limit) : null;
    return { list: R().DEFAULT_FILMS.concat(measured).filter((x) => ids.includes(x.id)), limit };
  }
  const famIndex = (id) => Math.max(0, M().FAMILIES.findIndex((f) => f.id === id));

  function tick() {
    if (!rec) return;
    const pr = profiles();
    const target = R().average(pr.list);
    const limit = pr.limit || R().limitFor(target);
    const r = rec.reading({ limit });
    const run = r.stats.currentRun;
    const seg = r.segments[r.segments.length - 1];
    const compass = C() ? C().point(r, pr.list) : null;
    const best = compass && compass.options[0];
    const next = {
      attention: run ? Math.min(1, run.dur / limit) : 0,
      over: !!(run && run.dur > limit),
      family: run ? run.family : null,
      familyIndex: run ? famIndex(run.family) : 0,
      momentum: Math.max(0, Math.min(1, r.stats.momentum / 5)),
      compass: best ? best.family : null,
      compassIndex: best ? famIndex(best.family) : 0,
      seconds: run ? Math.round(run.dur * 10) / 10 : 0,
      limit,
      cue: seg ? seg.cue : null,
      quiet: seg ? !!seg.quiet : false,
      label: seg ? seg.label : "",
      segments: r.segments.length,
    };
    /* Events: attention moved, or went past the limit. */
    if (last && next.segments > last.segments && seg) {
      note(CUE_NOTES[seg.cue]);
    }
    if (next.over && !(last && last.over)) {
      note(OVER_NOTE);
      if (settings.buzz && root.navigator && typeof root.navigator.vibrate === "function") {
        try {
          root.navigator.vibrate([180, 90, 180]);
        } catch (e) {}
      }
    }
    sendCCs(next);
    last = next;
    current = next;
    listeners.slice().forEach((fn) => {
      try {
        fn(current);
      } catch (e) {}
    });
  }

  function start() {
    if (rec || !root.CuriosityBoard) return false;
    const B = root.CuriosityBoard;
    rec = A().live({});
    const push = () => {
      const p = B.panels();
      rec.push(p[0] || B.values());
    };
    push();
    unhook = B.on(push);
    timer = setInterval(tick, 250);
    tick();
    return true;
  }
  function stop() {
    if (unhook) unhook();
    if (timer) clearInterval(timer);
    unhook = null;
    timer = null;
    rec = null;
    last = null;
    current = blank();
    listeners.slice().forEach((fn) => {
      try {
        fn(current);
      } catch (e) {}
    });
  }

  /* ---------- bridge ---------- */
  function values() {
    if (!rec || !settings.bridge) return [];
    const s = current;
    const n = Math.max(1, M().FAMILIES.length - 1);
    return [
      { type: "value", key: "m:attention", m: round3(s.attention) },
      { type: "value", key: "m:over", m: s.over ? 1 : 0 },
      { type: "value", key: "m:momentum", m: round3(s.momentum) },
      { type: "value", key: "m:family", m: round3(s.familyIndex / n) },
      { type: "value", key: "m:compass", m: round3(s.compassIndex / n) },
    ];
  }
  const round3 = (x) => Math.round(x * 1000) / 1000;
  function hookBridge() {
    const B = root.CurioBridge;
    if (!B || B.__momentum) return;
    B.__momentum = true;
    if (typeof B.addSource === "function") B.addSource(values);
    else {
      const own = B.values;
      B.values = function () {
        const base = typeof own === "function" ? own.apply(B, arguments) || [] : [];
        return base.concat(values());
      };
    }
  }

  /* ---------- MIDI ---------- */
  const midi = { access: null, out: null, status: "off" };
  function enable() {
    if (midi.access) return Promise.resolve(midi.status);
    if (!root.navigator || typeof root.navigator.requestMIDIAccess !== "function") {
      midi.status = "This browser has no MIDI.";
      return Promise.resolve(midi.status);
    }
    return root.navigator.requestMIDIAccess().then(
      (access) => {
        midi.access = access;
        pickOutput(settings.output);
        midi.status = `MIDI on: ${access.outputs.size} out.`;
        return midi.status;
      },
      () => {
        midi.status = "MIDI was not allowed.";
        return midi.status;
      }
    );
  }
  function outputs() {
    return midi.access ? Array.from(midi.access.outputs.values()).map((o) => ({ id: o.id, name: o.name })) : [];
  }
  function pickOutput(id) {
    const list = midi.access ? Array.from(midi.access.outputs.values()) : [];
    midi.out = list.find((o) => o.id === id) || null;
    settings.output = midi.out ? midi.out.id : "";
    saveSettings();
  }
  const sentCC = {};
  function cc(n, v) {
    if (!midi.out) return;
    const val = Math.max(0, Math.min(127, Math.round(v * 127)));
    const k = n + ":" + val;
    if (sentCC[n] === k) return;
    sentCC[n] = k;
    try {
      midi.out.send([0xb0 + (settings.channel - 1), Number(n) & 127, val]);
    } catch (e) {}
  }
  function note(n) {
    if (!midi.out || !settings.notes || n == null) return;
    const ch = settings.channel - 1;
    try {
      midi.out.send([0x90 + ch, n & 127, 100]);
      midi.out.send([0x80 + ch, n & 127, 0], (root.performance ? root.performance.now() : Date.now()) + 120);
    } catch (e) {}
  }
  function sendCCs(s) {
    const n = Math.max(1, M().FAMILIES.length - 1);
    cc(settings.cc.attention, s.attention);
    cc(settings.cc.momentum, s.momentum);
    cc(settings.cc.family, s.familyIndex / n);
    cc(settings.cc.compass, s.compassIndex / n);
  }

  const api = {
    start,
    stop,
    running: () => !!rec,
    state: () => Object.assign({}, current),
    values,
    on(fn) {
      listeners.push(fn);
      return () => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    settings: () => JSON.parse(JSON.stringify(settings)),
    set(patch) {
      const p = patch || {};
      if (Number.isInteger(p.channel) && p.channel >= 1 && p.channel <= 16) settings.channel = p.channel;
      if (p.cc && typeof p.cc === "object")
        Object.keys(settings.cc).forEach((k) => {
          const v = Number(p.cc[k]);
          if (Number.isInteger(v) && v >= 0 && v <= 127) settings.cc[k] = v;
        });
      ["notes", "buzz", "bridge"].forEach((k) => typeof p[k] === "boolean" && (settings[k] = p[k]));
      saveSettings();
    },
    midi: { enable, outputs, setOutput: pickOutput, status: () => midi.status, output: () => (midi.out ? midi.out.name : "") },
    CUE_NOTES,
    OVER_NOTE,
    tick,
  };
  root.CurioPerform = api;
  hookBridge();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
