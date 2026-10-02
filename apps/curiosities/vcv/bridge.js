/* VCV Rack bridge: VCV Rack's own CV-CC modules turn voltages into MIDI CC; this file listens for those CCs
   (Web MIDI) and moves the matching automation parameter, so an LFO, an envelope or a sequencer in VCV Rack can
   drive any curiosity, suite, proximity or proximity suite. One jack per item: vcv/curiosity-jacks.js (made by
   vcv/tools/make-vcv.js from the database). The Rack side is vcv/rack/*.vcvs (File > Import selection in Rack 2).

   A jack moves the item's main lane, like a MIDI knob bound to it: 0 V is its From setting, 10 V its To, and the
   item starts playing on the first value. The Focus module (MIDI channel 16, CC 1 to 16) moves the sliders of the
   one item in focus: jack 1 its main lane, jack 2 its first lane, and so on.

   Needs, after automation.js:  <script src="vcv/curiosity-jacks.js"></script> <script src="vcv/bridge.js"></script>
   window.CurioVCV: start(), status(), focus(key), focused(), jackFor(key), feed([status, cc, value]), on(fn). */
(function () {
  const BANK = window.CURIOSITY_VCV;
  const A = () => window.CurioAuto;
  if (!BANK || !BANK.jacks) return;

  const byJack = {};
  const byKey = {};
  BANK.jacks.forEach(([key, channel, cc, label, workspace, module, jack]) => {
    const j = { key, channel, cc, label, workspace, module, jack };
    byJack[channel + ":" + cc] = j;
    byKey[key] = j;
  });
  const FOCUS = BANK.focus || { channel: 16, ccs: [] };
  const FOCUS_KEY = "curiosities-vcv-focus-v1";
  const state = { status: "off", inputs: 0, focus: null, last: null, count: 0 };
  try {
    state.focus = localStorage.getItem(FOCUS_KEY) || null;
  } catch (e) {}
  const listeners = [];
  const tell = () => listeners.forEach((fn) => {
    try {
      fn(Object.assign({}, state));
    } catch (e) {}
  });

  /* CCs can arrive hundreds of times a second: move the value at once, but save and redraw at most every 200 ms. */
  const pending = {};
  function flush(key, lane) {
    const id = key + "#" + (lane || "");
    if (pending[id]) return;
    pending[id] = setTimeout(() => {
      delete pending[id];
      if (!A() || !A().param(key)) return;
      lane ? A().setLane(key, lane, {}) : A().set(key, {});
    }, 200);
  }

  function driveMain(key, v) {
    const auto = A();
    if (!auto || !auto.param(key)) return false;
    const p = auto.patch(key);
    p.manual = v;
    p.mod = "midi";
    if (!p.running) auto.start(key);
    flush(key);
    return true;
  }
  function driveLane(key, n, v) {
    const auto = A();
    if (!auto || !auto.param(key)) return false;
    /* Jack 1 is the main lane; jack 2 is the patch's first lane, and so on. */
    if (n === 0) return driveMain(key, v);
    const lane = auto.lanes(key)[n - 1];
    if (!lane) return false;
    lane.manual = v;
    lane.mod = "midi";
    lane.on = true;
    const p = auto.patch(key);
    if (!p.running) auto.start(key);
    flush(key, lane.id);
    return true;
  }

  /* One MIDI message: [status, data1, data2]. Only control changes matter here. */
  function feed(msg) {
    const [st, cc, val] = msg;
    if ((st & 0xf0) !== 0xb0) return false;
    const channel = (st & 0x0f) + 1;
    const v = Math.max(0, Math.min(127, val)) / 127;
    let ok = false;
    let what = null;
    if (channel === FOCUS.channel) {
      const n = FOCUS.ccs.indexOf(cc);
      if (n >= 0 && state.focus) {
        ok = driveLane(state.focus, n, v);
        what = (byKey[state.focus] ? byKey[state.focus].label : state.focus) + (n ? " · slider " + (n + 1) : "");
      }
    } else {
      const j = byJack[channel + ":" + cc];
      if (j) {
        ok = driveMain(j.key, v);
        what = j.label;
      }
    }
    if (ok) {
      state.count++;
      state.last = { what, value: Math.round(v * 100), channel, cc };
      tellSoon();
    }
    return ok;
  }
  let toldAt = 0;
  let tellTimer = null;
  function tellSoon() {
    const now = Date.now();
    if (now - toldAt > 150) {
      toldAt = now;
      tell();
      draw();
    } else if (!tellTimer) {
      tellTimer = setTimeout(() => {
        tellTimer = null;
        toldAt = Date.now();
        tell();
        draw();
      }, 150);
    }
  }

  /* Web MIDI: listen on every input with addEventListener, so automation.js's own listener keeps working. */
  const hooked = new WeakSet();
  const onMsg = (e) => feed(e.data);
  function hook(access) {
    let n = 0;
    access.inputs.forEach((input) => {
      n++;
      if (hooked.has(input)) return;
      hooked.add(input);
      input.addEventListener("midimessage", onMsg);
    });
    state.inputs = n;
    state.status = n ? "listening" : "no MIDI inputs";
    tell();
    draw();
  }
  function start() {
    if (!navigator.requestMIDIAccess) {
      state.status = "this browser has no Web MIDI (use Chrome or Edge)";
      tell();
      draw();
      return Promise.resolve(false);
    }
    state.status = "asking for MIDI";
    draw();
    return navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        hook(access);
        access.addEventListener("statechange", () => hook(access));
        return true;
      })
      .catch(() => {
        state.status = "MIDI was blocked";
        tell();
        draw();
        return false;
      });
  }

  function focus(key) {
    state.focus = key && A() && A().param(key) ? key : null;
    try {
      state.focus ? localStorage.setItem(FOCUS_KEY, state.focus) : localStorage.removeItem(FOCUS_KEY);
    } catch (e) {}
    tell();
    draw();
    return state.focus;
  }

  /* ---------- a small badge, bottom left: what is coming in, and which item the Focus module moves ---------- */
  let el = null;
  let open = false;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function css() {
    if (document.getElementById("vcv-bridge-css")) return;
    const s = document.createElement("style");
    s.id = "vcv-bridge-css";
    s.textContent = `
      .vcv-badge{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:50;font:12px/1.4 system-ui,sans-serif;max-width:min(360px,calc(100vw - 24px))}
      .vcv-badge>button{border:1px solid #8884;border-radius:999px;padding:4px 10px;background:Canvas;color:CanvasText;cursor:pointer;display:flex;gap:6px;align-items:center}
      .vcv-dot{width:8px;height:8px;border-radius:50%;background:#999}.vcv-dot.on{background:#2a9d5c}
      .vcv-panel{margin-bottom:6px;padding:10px;border:1px solid #8884;border-radius:8px;background:Canvas;color:CanvasText;box-shadow:0 4px 16px #0002}
      .vcv-panel p{margin:0 0 6px}.vcv-panel input{width:100%;box-sizing:border-box;padding:4px 6px;font:inherit}
      .vcv-panel small{opacity:.75}`;
    document.head.appendChild(s);
  }
  function draw() {
    if (!document.body) return;
    if (!el) {
      css();
      el = document.createElement("div");
      el.className = "vcv-badge";
      document.body.appendChild(el);
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-vcv-toggle]")) {
          open = !open;
          if (open && state.status === "off") start();
          draw();
        }
        if (e.target.closest("[data-vcv-start]")) start();
        if (e.target.closest("[data-vcv-clear]")) focus(null);
      });
      el.addEventListener("change", (e) => {
        if (!e.target.matches("[data-vcv-focus]")) return;
        const typed = e.target.value.trim();
        const hit = BANK.jacks.find((j) => j[0] === typed || j[3].toLowerCase() === typed.toLowerCase());
        focus(hit ? hit[0] : typed);
      });
    }
    const live = state.status === "listening";
    const last = state.last ? `${esc(state.last.what)} ${state.last.value}%` : "";
    const f = state.focus ? (byKey[state.focus] ? byKey[state.focus].label : state.focus) : "";
    el.innerHTML =
      (open
        ? `<div class="vcv-panel">
            <p><b>VCV Rack</b>: ${esc(state.status)}${state.inputs ? ` (${state.inputs} MIDI input${state.inputs > 1 ? "s" : ""})` : ""}.
              ${state.status === "off" || /blocked|no MIDI/.test(state.status) ? `<button data-vcv-start>Listen</button>` : ""}</p>
            <p><small>Each item has its own jack. The lists are on the Notes module in each .vcvs file in the vcv/rack folder.</small></p>
            <p>Focus module drives the sliders of:</p>
            <input data-vcv-focus list="vcv-items" placeholder="Type a curiosity, suite or pair" value="${esc(f)}">
            <datalist id="vcv-items">${BANK.jacks.map((j) => `<option value="${esc(j[3])}">${esc(j[0])}</option>`).join("")}</datalist>
            ${state.focus ? `<p><small>Jack 1 moves it; jacks 2 to 16 move its sliders in order.</small> <button data-vcv-clear>Clear</button></p>` : ""}
          </div>`
        : "") +
      `<button data-vcv-toggle title="VCV Rack bridge"><span class="vcv-dot ${live ? "on" : ""}"></span>VCV${last ? ": " + last : ""}</button>`;
  }

  window.CurioVCV = {
    start,
    feed,
    focus,
    focused: () => state.focus,
    status: () => Object.assign({}, state),
    jackFor: (key) => (byKey[key] ? Object.assign({}, byKey[key]) : null),
    jacks: () => BANK.jacks.length,
    on(fn) {
      listeners.push(fn);
      return () => listeners.splice(listeners.indexOf(fn), 1);
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw);
  else draw();
})();
