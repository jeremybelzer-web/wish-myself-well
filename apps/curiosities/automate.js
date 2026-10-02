/* Automate: every curiosity, suite, proximity and proximity suite as a module on a patch bay.
   Pick a parameter, set its two settings A and B, and a modulator moves between them: an LFO at a
   rate you set, a manual knob, or a MIDI CC. A trigger (the big button, a MIDI note a performer
   wears, a computer key) starts it as a gate or a toggle. Every running module's m can go out as a
   MIDI CC to a modular synth (VCV Rack) and come back in. The board below shows the result live.
   The engine is window.CurioAuto (automation.js); this file is only its face. */

(function () {
  const root = document.getElementById("automate");
  if (!root) return;
  const VIEW = "curiosities-automate-view-v1";
  const LEVELS = [
    ["curiosity", "Curiosities"],
    ["suite", "Suites"],
    ["proximity", "Proximities"],
    ["proximity suite", "Proximity suites"],
  ];
  const SHAPES = ["sine", "triangle", "square", "saw", "random"];

  const PRESETS = [
    { name: "Handheld flicker", key: "c:cameraCarry", set: { a: "locked", b: "handheld", mod: "lfo", shape: "square", rate: 2, depth: 1 } },
    { name: "Noir pulse", key: "s:noir", set: { a: "", b: "noir", mod: "lfo", shape: "sine", rate: 0.25, depth: 1 } },
    { name: "Rain makes wet", key: "p:rain-wet", set: { a: { on: false, within: 2 }, b: { on: true, within: 2 }, mod: "lfo", shape: "square", rate: 0.5, depth: 1 } },
    { name: "Emotion steers the lens", key: "ps:emotion-steers-lens", set: { a: { on: false, within: 0 }, b: { on: true, within: 1 }, mod: "lfo", shape: "triangle", rate: 0.3, depth: 1 } },
    { name: "Speed breathes", key: "c:moveSpeed", set: { a: 1, b: 5, mod: "lfo", shape: "sine", rate: 0.5, depth: 1 } },
  ];

  let view = { level: "curiosity", q: "", group: "", sel: "c:cameraCarry", stars: [], perf: false };
  try {
    view = Object.assign(view, JSON.parse(localStorage.getItem(VIEW) || "{}"));
  } catch (e) {}
  let raf = 0;
  let unsub = null;
  let learnFor = null; // { key, what: "note"|"cc-manual"|"cc-rate"|"key" }
  let lastPanels = 0;
  let lastPanelSig = "";
  const scope = {};

  function A() {
    return window.CurioAuto;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function saveView() {
    try {
      localStorage.setItem(VIEW, JSON.stringify(view));
    } catch (e) {}
  }
  function visible() {
    return root.isConnected && !root.classList.contains("hidden");
  }

  /* ---------- pickers ---------- */

  function valuePicker(p, side, val) {
    const d = p.domain;
    if (d.kind === "range") return `<input type="number" data-ab="${side}" min="${d.min}" max="${d.max}" step="${d.step || 1}" value="${esc(val)}">`;
    return `<select data-ab="${side}">${d.options.map((o) => `<option${String(o) === String(val) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  }
  function suitePicker(side, val) {
    return `<select data-ab="${side}"><option value="">none</option>${(typeof SUITES !== "undefined" ? SUITES : [])
      .map((s) => `<option value="${esc(s.id)}"${s.id === val ? " selected" : ""}>${esc(s.label)}</option>`)
      .join("")}</select>`;
  }
  function proxPicker(side, val) {
    val = val || { on: false, within: 0 };
    return `<span class="au-prox"><label class="cap"><input type="checkbox" data-ab="${side}" data-part="on"${val.on ? " checked" : ""}> on</label>
      <label class="cap">within <input type="number" data-ab="${side}" data-part="within" min="0" max="8" value="${Number(val.within) || 0}"> beats</label></span>`;
  }
  function abPicker(p, pt, side) {
    const val = pt[side];
    if (p.level === "curiosity") return valuePicker(p, side, val);
    if (p.level === "suite") return suitePicker(side, val);
    return proxPicker(side, val);
  }
  function describe(p) {
    if (p.level === "proximity") {
      const x = PROXIMITIES.find((y) => y.id === p.id);
      return x ? `When ${x.when}, ${x.then} within ${x.within} beat${x.within === 1 ? "" : "s"}.` : "";
    }
    if (p.level === "proximity suite") {
      const ps = A().PROXIMITY_SUITES.find((y) => y.id === p.id);
      return ps ? "Members: " + ps.members.map((id) => (PROXIMITIES.find((x) => x.id === id) || { when: id }).when).join(" · ") : "";
    }
    if (p.level === "suite") {
      const s = SUITES.find((y) => y.id === p.id);
      return s ? (s.note || "") + " Sets " + Object.entries(s.set).map(([k, v]) => `${k} ${v}`).join(", ") + "." : "";
    }
    const d = p.domain;
    return `${p.group}. ${d.kind === "range" ? `${d.min} to ${d.max}` : d.options.join(" · ")}${p.live ? ". On the board." : ". Not a board control; it still runs and goes out as MIDI."}`;
  }
  function bindingText(b) {
    if (!b) return "no binding";
    if (b.kind === "note") return `MIDI note ${b.num} triggers`;
    if (b.kind === "cc") return `MIDI CC ${b.num} → ${b.target === "rate" ? "rate" : "manual"}`;
    if (b.kind === "key") return `key ${b.code.replace(/^Key|^Digit/, "")} triggers`;
    return "bound";
  }

  /* ---------- drawing ---------- */

  function listHtml() {
    const all = A().PARAMS.filter((p) => p.level === view.level);
    const groups = [...new Set(all.map((p) => p.group))].sort();
    const q = view.q.trim().toLowerCase();
    const shown = all.filter((p) => (!view.group || p.group === view.group) && (!q || (p.label + " " + p.id + " " + p.group).toLowerCase().includes(q)));
    const running = new Set(A().running());
    return `<div class="au-filter">
        <input type="search" id="au-q" placeholder="Search ${esc(view.level)}…" value="${esc(view.q)}">
        ${groups.length > 1 ? `<select id="au-group"><option value="">All groups</option>${groups.map((g) => `<option${g === view.group ? " selected" : ""}>${esc(g)}</option>`).join("")}</select>` : ""}
      </div>
      <p class="cap">${shown.length} of ${all.length}</p>
      <ul class="au-list">${shown
        .map(
          (p) => `<li><button type="button" data-sel="${esc(p.key)}" class="${p.key === view.sel ? "on" : ""}">${running.has(p.key) ? `<i class="au-dot"></i>` : ""}${esc(p.label)}${p.live ? ` <span class="au-live">board</span>` : ""}</button></li>`
        )
        .join("")}</ul>`;
  }

  function knob(name, label, min, max, step, val, fmt) {
    return `<label class="au-knob"><span>${esc(label)}</span><input type="range" data-k="${name}" min="${min}" max="${max}" step="${step}" value="${val}"><b id="au-kv-${name}">${esc(fmt ? fmt(val) : val)}</b></label>`;
  }

  function moduleHtml() {
    const p = A().param(view.sel);
    if (!p) return `<p class="cap">Pick a parameter to open its module.</p>`;
    const pt = A().patch(p.key);
    const b = A().bindings()[p.key];
    const outs = A().midi.outputs || [];
    return `<div class="au-module ${pt.running ? "run" : ""}">
      <div class="au-face">
        <div class="au-title"><span class="au-level">${esc(p.level)}</span><strong>${esc(p.label)}</strong><button type="button" class="au-star ${starred(p.key) ? "on" : ""}" data-star="${esc(p.key)}" aria-pressed="${starred(p.key)}">${starred(p.key) ? "★ On the performer pads" : "☆ Add to performer pads"}</button></div>
        <p class="au-desc">${esc(describe(p))}</p>
        <div class="au-ab">
          <div><span class="au-jack"></span><span class="au-lab">A (m = 0)</span>${abPicker(p, pt, "a")}</div>
          <div><span class="au-jack"></span><span class="au-lab">B (m = 1)</span>${abPicker(p, pt, "b")}</div>
        </div>
        <div class="au-row">
          <span class="au-lab">Modulator</span>
          <div class="au-seg">${["lfo", "manual", "midi"].map((m) => `<button type="button" data-mod="${m}" class="${pt.mod === m ? "on" : ""}">${m === "lfo" ? "LFO" : m === "midi" ? "MIDI CC" : "Manual"}</button>`).join("")}</div>
        </div>
        ${
          pt.mod === "lfo"
            ? `<div class="au-row"><span class="au-lab">Shape</span><div class="au-seg">${SHAPES.map((s) => `<button type="button" data-shape="${s}" class="${pt.shape === s ? "on" : ""}">${s}</button>`).join("")}</div></div>
               <div class="au-knobs">${knob("rate", "Rate Hz", 0.05, 10, 0.05, pt.rate, (v) => Number(v).toFixed(2))}${knob("depth", "Depth", 0, 1, 0.05, pt.depth, (v) => Math.round(v * 100) + "%")}</div>`
            : `<div class="au-knobs">${knob("manual", pt.mod === "midi" ? "CC value" : "Manual", 0, 1, 0.01, pt.manual, (v) => Number(v).toFixed(2))}</div>`
        }
        <div class="au-row">
          <span class="au-lab">Trigger</span>
          <div class="au-seg">${["gate", "toggle"].map((m) => `<button type="button" data-mode="${m}" class="${pt.mode === m ? "on" : ""}">${m}</button>`).join("")}</div>
        </div>
        <button type="button" class="au-trigger ${pt.running ? "on" : ""}" id="au-trig">${pt.mode === "gate" ? "Hold to play" : pt.running ? "Running · tap to stop" : "Tap to start"}</button>
        <div class="au-row au-run"><button type="button" id="au-run">${pt.running ? "Stop" : "Run (latch)"}</button><span class="mono" id="au-m">m —</span></div>
        <canvas class="au-scope" id="au-scope" width="300" height="70"></canvas>
        <div class="au-row"><span class="au-lab">Bind</span><span class="cap" id="au-bind">${esc(learnFor && learnFor.key === p.key ? (learnFor.what === "key" ? "Press a key…" : "Move or play a MIDI control…") : bindingText(b))}</span></div>
        <div class="bar-actions au-binds">
          <button type="button" data-learn="note">Learn trigger (note)</button>
          <button type="button" data-learn="cc-manual">Learn CC → manual</button>
          <button type="button" data-learn="cc-rate">Learn CC → rate</button>
          <button type="button" data-learn="key">Bind a key</button>
          ${b ? `<button type="button" data-learn="clear">Clear</button>` : ""}
        </div>
        <div class="au-row"><span class="au-jack out"></span><span class="au-lab">MIDI out CC</span><input type="number" id="au-outcc" min="0" max="127" placeholder="off" value="${pt.outCC == null ? "" : pt.outCC}"><span class="cap">${outs.length ? "" : "connect MIDI to send"}</span></div>
      </div>
    </div>`;
  }

  function bayHtml() {
    const keys = A().running();
    if (!keys.length) return `<p class="cap">Nothing running. Trigger a module or a preset.</p>`;
    return `<div class="au-bay">${keys
      .map((k) => {
        const p = A().param(k);
        return `<div class="au-slot"><button type="button" class="link" data-sel="${esc(k)}">${esc(p ? p.label : k)}</button><span class="au-meter"><i data-meter="${esc(k)}"></i></span><button type="button" data-stop="${esc(k)}">Stop</button></div>`;
      })
      .join("")}<button type="button" id="au-stopall">Stop all</button></div>`;
  }

  function helpHtml() {
    const m = A().midi;
    const outs = m.outputs || [];
    return `<details class="au-help"><summary>Hook up a modular synth</summary>
      <ol class="cap">
        <li>Make a virtual MIDI port: IAC Driver on macOS (Audio MIDI Setup), loopMIDI on Windows, or a JACK/ALSA loop on Linux.</li>
        <li>Press Connect MIDI here, then pick that port as MIDI out. Give a module a MIDI out CC number.</li>
        <li>In VCV Rack, add MIDI-CC to CV on the same port: the CC's voltage follows m, so the LFO here can drive a filter or a sequencer.</li>
        <li>To send in, add CV-MIDI (or CV-CC) in VCV Rack pointed at the port, then Learn CC on a module and wiggle the knob in Rack.</li>
        <li>Note and CC triggers work the same from body straps, pads and keyboards.</li>
      </ol>
      <div class="bar-actions"><button type="button" id="au-midi">Connect MIDI</button>
        <select id="au-out"><option value="">MIDI out: none</option>${outs.map((o) => `<option value="${esc(o.id)}"${m.out && m.out.id === o.id ? " selected" : ""}>${esc(o.name)}</option>`).join("")}</select>
        <span class="cap" id="au-midistat">${esc(m.status === "off" ? "MIDI is off. Keys and the trigger button still work." : m.status)}</span></div>
    </details>`;
  }

  function starred(key) {
    return (view.stars || []).includes(key);
  }

  /* Pads for a performer: starred modules, anything bound to a key or MIDI, anything running. */
  function padKeys() {
    const keys = (view.stars || []).slice();
    Object.keys(A().bindings()).forEach((k) => keys.includes(k) || keys.push(k));
    A().running().forEach((k) => keys.includes(k) || keys.push(k));
    return keys.filter((k) => A().param(k));
  }

  function perfHtml() {
    const keys = padKeys();
    const pads = keys
      .map((k) => {
        const p = A().param(k);
        const pt = A().patch(k);
        return `<button type="button" class="au-pad ${pt.running ? "on" : ""}" data-pad="${esc(k)}">
          <span class="au-pad-l">${esc(p.label)}</span>
          <span class="au-pad-b">${esc(bindingText(A().bindings()[k]))} · ${esc(pt.mode)}</span>
          <span class="au-meter"><i data-meter="${esc(k)}"></i></span></button>`;
      })
      .join("");
    return `<div class="g au-g">Performer pads</div>
      ${keys.length ? `<div class="au-pads">${pads}</div>` : `<p class="cap">No pads yet. Star a module (☆ on its card), bind a key or a MIDI note, or start a patch, and it gets a pad here.</p>`}
      <p class="cap">Hold a pad for a gate, tap it for a toggle. Bound keys and MIDI notes play the same pads.</p>
      <div class="g au-g">Board, live</div>
      <div class="au-panels" id="au-panels"></div>
      <div id="au-holds" class="au-holds"></div>`;
  }

  function wirePads() {
    root.querySelectorAll("[data-pad]").forEach((pad) => {
      const k = pad.dataset.pad;
      pad.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try {
          pad.setPointerCapture(e.pointerId);
        } catch (err) {}
        pad.classList.add("held");
        A().trigger(k, true);
      });
      const up = () => {
        pad.classList.remove("held");
        if (A().patch(k).mode === "gate") A().trigger(k, false);
      };
      pad.addEventListener("pointerup", up);
      pad.addEventListener("pointercancel", up);
    });
  }

  function render() {
    if (!A()) {
      root.innerHTML = `<h2>Automate</h2><p>The automation layer (automation.js) did not load.</p>`;
      return;
    }
    const counts = Object.fromEntries(LEVELS.map(([l]) => [l, A().PARAMS.filter((p) => p.level === l).length]));
    root.innerHTML = `<h2>Automate</h2>
      <p class="cap">Every curiosity, suite, proximity and proximity suite is a parameter with two settings. A modulator moves between them; a trigger (MIDI note, key, the button) starts it. Running modules play on the board.</p>
      <div class="bar-actions au-presets"><button type="button" id="au-perf" class="au-perf-btn ${view.perf ? "on" : ""}">${view.perf ? "Back to the modules" : "Performer view"}</button><span class="au-lab">Patches</span>${PRESETS.map((p, i) => `<button type="button" data-preset="${i}">${esc(p.name)}</button>`).join("")}</div>
      <div class="g au-g">Patch bay</div>
      <div id="au-bay">${bayHtml()}</div>
      ${view.perf ? perfHtml() : `<nav class="subtabs">${LEVELS.map(([l, n]) => `<button type="button" data-level="${esc(l)}" class="${view.level === l ? "on" : ""}">${n} <span class="au-n">${counts[l]}</span></button>`).join("")}</nav>
      <div class="studio-grid au-grid">
        <div class="au-side" id="au-side">${listHtml()}</div>
        <div class="au-main">
          <div id="au-module">${moduleHtml()}</div>
          <div class="g au-g">Board, live</div>
          <div class="au-panels" id="au-panels"></div>
          <div id="au-holds" class="au-holds"></div>
          ${helpHtml()}
        </div>
      </div>`}`;
    wire();
    lastPanelSig = "";
    drawPanels(null);
  }

  function refreshModule() {
    const el = root.querySelector("#au-module");
    if (el) {
      el.innerHTML = moduleHtml();
      wireModule();
    }
  }
  function refreshBay() {
    const el = root.querySelector("#au-bay");
    if (el) {
      el.innerHTML = bayHtml();
      wireBay();
    }
    const side = root.querySelector("#au-side");
    if (side) {
      const running = new Set(A().running());
      side.querySelectorAll("[data-sel]").forEach((b) => {
        const has = !!b.querySelector(".au-dot");
        if (has !== running.has(b.dataset.sel)) {
          if (has) b.querySelector(".au-dot").remove();
          else b.insertAdjacentHTML("afterbegin", `<i class="au-dot"></i>`);
        }
      });
    }
  }

  function select(key) {
    view.sel = key;
    if (view.perf) {
      saveView();
      return;
    }
    const p = A().param(key);
    if (p && p.level !== view.level) {
      view.level = p.level;
      view.group = "";
      view.q = "";
      saveView();
      render();
      return;
    }
    saveView();
    root.querySelectorAll("#au-side [data-sel]").forEach((b) => b.classList.toggle("on", b.dataset.sel === key));
    refreshModule();
  }

  /* ---------- wiring ---------- */

  function wire() {
    root.querySelectorAll("[data-level]").forEach((b) =>
      b.addEventListener("click", () => {
        view.level = b.dataset.level;
        view.group = "";
        const first = A().PARAMS.find((p) => p.level === view.level);
        if (!A().param(view.sel) || A().param(view.sel).level !== view.level) view.sel = first ? first.key : "";
        saveView();
        render();
      })
    );
    root.querySelectorAll("[data-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        const pr = PRESETS[Number(b.dataset.preset)];
        if (!A().param(pr.key)) return;
        A().set(pr.key, JSON.parse(JSON.stringify(pr.set)));
        A().start(pr.key);
        select(pr.key);
      })
    );
    const pb = root.querySelector("#au-perf");
    if (pb)
      pb.addEventListener("click", () => {
        view.perf = !view.perf;
        saveView();
        render();
      });
    if (view.perf) wirePads();
    else {
      wireSide();
      wireModule();
    }
    wireBay();
    const midiBtn = root.querySelector("#au-midi");
    if (midiBtn)
      midiBtn.addEventListener("click", () => {
        const st = root.querySelector("#au-midistat");
        if (st) st.textContent = "Asking for MIDI…";
        A()
          .connectMidi()
          .then(() => {
            const det = root.querySelector(".au-help");
            const open = det && det.open;
            render();
            const d2 = root.querySelector(".au-help");
            if (d2 && open) d2.open = true;
          });
      });
    const out = root.querySelector("#au-out");
    if (out) out.addEventListener("change", () => A().setOutput(out.value));
  }

  function wireSide() {
    const side = root.querySelector("#au-side");
    const q = side.querySelector("#au-q");
    q.addEventListener("input", () => {
      view.q = q.value;
      saveView();
      const pos = q.selectionStart;
      side.innerHTML = listHtml();
      wireSide();
      const q2 = side.querySelector("#au-q");
      q2.focus();
      try {
        q2.setSelectionRange(pos, pos);
      } catch (e) {}
    });
    const g = side.querySelector("#au-group");
    if (g)
      g.addEventListener("change", () => {
        view.group = g.value;
        saveView();
        side.innerHTML = listHtml();
        wireSide();
      });
    side.querySelectorAll("[data-sel]").forEach((b) => b.addEventListener("click", () => select(b.dataset.sel)));
  }

  function wireBay() {
    root.querySelectorAll("#au-bay [data-sel]").forEach((b) => b.addEventListener("click", () => select(b.dataset.sel)));
    root.querySelectorAll("#au-bay [data-stop]").forEach((b) => b.addEventListener("click", () => A().stop(b.dataset.stop)));
    const all = root.querySelector("#au-stopall");
    if (all) all.addEventListener("click", () => A().stopAll());
  }

  function wireModule() {
    const el = root.querySelector("#au-module");
    const key = view.sel;
    const p = A().param(key);
    if (!p) return;
    const pt = () => A().patch(key);
    el.querySelectorAll("[data-ab]").forEach((inp) =>
      inp.addEventListener("change", () => {
        const side = inp.dataset.ab;
        if (p.level === "curiosity") A().set(key, { [side]: p.domain.kind === "range" ? Number(inp.value) : inp.value });
        else if (p.level === "suite") A().set(key, { [side]: inp.value });
        else {
          const cur = Object.assign({ on: false, within: 0 }, pt()[side]);
          if (inp.dataset.part === "on") cur.on = inp.checked;
          else cur.within = Math.max(0, Math.min(8, Number(inp.value) || 0));
          A().set(key, { [side]: cur });
        }
      })
    );
    el.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => (A().set(key, { mod: b.dataset.mod }), refreshModule())));
    el.querySelectorAll("[data-shape]").forEach((b) => b.addEventListener("click", () => (A().set(key, { shape: b.dataset.shape }), refreshModule())));
    el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => (A().set(key, { mode: b.dataset.mode }), refreshModule())));
    el.querySelectorAll("[data-k]").forEach((r) =>
      r.addEventListener("input", () => {
        const v = Number(r.value);
        A().set(key, { [r.dataset.k]: v });
        const out = el.querySelector("#au-kv-" + r.dataset.k);
        if (out) out.textContent = r.dataset.k === "depth" ? Math.round(v * 100) + "%" : v.toFixed(2);
      })
    );
    const star = el.querySelector("[data-star]");
    if (star)
      star.addEventListener("click", () => {
        view.stars = view.stars || [];
        if (starred(key)) view.stars = view.stars.filter((k) => k !== key);
        else view.stars.push(key);
        saveView();
        refreshModule();
      });
    const trig = el.querySelector("#au-trig");
    trig.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try {
        trig.setPointerCapture(e.pointerId);
      } catch (err) {}
      trig.classList.add("held");
      A().trigger(key, true);
    });
    const up = () => {
      trig.classList.remove("held");
      if (pt().mode === "gate") A().trigger(key, false);
    };
    trig.addEventListener("pointerup", up);
    trig.addEventListener("pointercancel", up);
    trig.addEventListener("keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        A().trigger(key, true);
      }
    });
    trig.addEventListener("keyup", (e) => {
      if (e.key === " " || e.key === "Enter") up();
    });
    el.querySelector("#au-run").addEventListener("click", () => (pt().running ? A().stop(key) : A().start(key)));
    el.querySelectorAll("[data-learn]").forEach((b) =>
      b.addEventListener("click", () => {
        const what = b.dataset.learn;
        if (what === "clear") {
          learnFor = null;
          A().bind(key, null);
          return refreshModule();
        }
        learnFor = { key, what };
        if (what !== "key") {
          if (A().midi.status === "off") A().connectMidi();
          A().learn(key);
        }
        refreshModule();
      })
    );
    const oc = el.querySelector("#au-outcc");
    oc.addEventListener("change", () => A().set(key, { outCC: oc.value === "" ? null : Math.max(0, Math.min(127, Number(oc.value) || 0)) }));
  }

  /* Key binding: the next key pressed while "Bind a key" is waiting. */
  window.addEventListener(
    "keydown",
    (e) => {
      if (!learnFor || learnFor.what !== "key" || !visible()) return;
      if (/input|select|textarea/i.test(e.target.tagName)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      A().bind(learnFor.key, { kind: "key", code: e.code });
      learnFor = null;
      refreshModule();
    },
    true
  );

  /* ---------- the live board and the scope ---------- */

  function sideHolds(x, panels, i) {
    if (!x) return false;
    if (x.suite) {
      const s = SUITES.find((y) => y.id === x.suite);
      return !!s && Object.entries(s.set).every(([k, v]) => String(panels[i][k]) === String(v));
    }
    const v = panels[i][x.curiosity];
    if ("is" in x) return String(v) === String(x.is);
    if (i === 0) return false;
    const d = A().domain(x.curiosity);
    const n = (y) => (d.kind === "choice" ? d.options.indexOf(y) : Number(y));
    if (x.change === "rises" || x.change === "grows") return n(v) > n(panels[i - 1][x.curiosity]);
    if (x.change === "drops") return n(v) < n(panels[i - 1][x.curiosity]);
    return String(v) !== String(panels[i - 1][x.curiosity]);
  }

  function holdsHtml(panels) {
    const rows = [];
    PROXIMITIES.forEach((p) => {
      let fired = false;
      let held = false;
      panels.forEach((_, i) => {
        if (!sideHolds(p.x, panels, i)) return;
        fired = true;
        for (let j = i; j <= Math.min(panels.length - 1, i + (p.within || 0)); j++) if (sideHolds(p.y, panels, j)) held = true;
      });
      if (fired) rows.push(`<div><span class="chip${held ? " lit" : ""}">${held ? "holds" : "doesn’t hold"}</span> When ${esc(p.when)}, ${esc(p.then)}.</div>`);
    });
    return rows.length ? rows.join("") : `<p class="cap">No proximity's cause happens in these panels yet.</p>`;
  }

  function drawPanels(panels) {
    const el = root.querySelector("#au-panels");
    const b = window.CuriosityBoard;
    if (!el || !b || !b.panel) return;
    if (!panels) panels = A().resolve(4).panels;
    panels = panels.slice(0, 4);
    while (panels.length < 4) panels.push(panels[panels.length % Math.max(1, panels.length)] || b.values());
    const sig = JSON.stringify(panels);
    if (sig === lastPanelSig) return;
    lastPanelSig = sig;
    const sc = b.scene();
    try {
      el.innerHTML = panels.map((v, i) => b.panel(sc.lines[i % sc.lines.length], i, 4, v)).join("");
    } catch (e) {
      el.innerHTML = `<p class="cap">The board could not draw.</p>`;
    }
    const h = root.querySelector("#au-holds");
    if (h) h.innerHTML = holdsHtml(panels);
  }

  function frame(now) {
    raf = 0;
    if (!visible()) return;
    const key = view.sel;
    const m = key && A().param(key) ? A().m(key) : null;
    const buf = (scope[key] = scope[key] || []);
    buf.push([now, m]);
    while (buf.length && now - buf[0][0] > 4000) buf.shift();
    const c = root.querySelector("#au-scope");
    if (c) {
      const g = c.getContext("2d");
      const W = c.width;
      const H = c.height;
      g.fillStyle = "#1c1712";
      g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(247,239,226,0.15)";
      g.beginPath();
      for (let s = 1; s < 4; s++) {
        g.moveTo((s / 4) * W, 0);
        g.lineTo((s / 4) * W, H);
      }
      g.moveTo(0, H / 2);
      g.lineTo(W, H / 2);
      g.stroke();
      g.strokeStyle = "#e0a070";
      g.lineWidth = 2;
      g.beginPath();
      let pen = false;
      buf.forEach(([t, v]) => {
        const x = W - ((now - t) / 4000) * W;
        if (v == null) {
          pen = false;
          return;
        }
        const y = H - 6 - v * (H - 12);
        pen ? g.lineTo(x, y) : g.moveTo(x, y);
        pen = true;
      });
      g.stroke();
      g.fillStyle = "rgba(247,239,226,0.6)";
      g.font = "10px monospace";
      g.fillText("B", 4, 12);
      g.fillText("A", 4, H - 4);
    }
    const mt = root.querySelector("#au-m");
    if (mt) mt.textContent = m == null ? "m — (stopped)" : `m ${m.toFixed(2)}`;
    root.querySelectorAll("[data-meter]").forEach((i) => {
      const v = A().m(i.dataset.meter);
      i.style.width = Math.round((v || 0) * 100) + "%";
    });
    raf = requestAnimationFrame(frame);
  }

  function listen() {
    if (unsub) return;
    unsub = A().on((type, data) => {
      if (!visible()) return;
      if (type === "tick") {
        const now = performance.now();
        if (now - lastPanels > 100) {
          lastPanels = now;
          drawPanels(data.panels);
        }
      } else if (type === "change") {
        refreshBay();
        root.querySelectorAll("[data-pad]").forEach((pd) => pd.classList.toggle("on", A().patch(pd.dataset.pad).running));
        if (view.perf && data && data.key && !root.querySelector(`[data-pad="${data.key}"]`) && A().param(data.key) && padKeys().includes(data.key)) render();
        if (data && data.key === view.sel) {
          const t = root.querySelector("#au-trig");
          const pt = A().patch(view.sel);
          if (t) {
            t.classList.toggle("on", pt.running);
            if (pt.mode === "toggle") t.textContent = pt.running ? "Running · tap to stop" : "Tap to start";
          }
          const r = root.querySelector("#au-run");
          if (r) r.textContent = pt.running ? "Stop" : "Run (latch)";
          const mod = root.querySelector(".au-module");
          if (mod) mod.classList.toggle("run", pt.running);
          const rate = root.querySelector('[data-k="rate"]');
          if (rate && document.activeElement !== rate && Math.abs(Number(rate.value) - pt.rate) > 0.01) {
            rate.value = pt.rate;
            const o = root.querySelector("#au-kv-rate");
            if (o) o.textContent = Number(pt.rate).toFixed(2);
          }
          const man = root.querySelector('[data-k="manual"]');
          if (man && document.activeElement !== man) man.value = pt.manual;
        }
        if (!A().running().length) {
          lastPanelSig = "";
          drawPanels(null);
        }
      } else if (type === "learned") {
        if (learnFor && learnFor.key === data.key) {
          const b = data.binding;
          if (b.kind === "cc" && learnFor.what === "cc-rate") A().bind(data.key, Object.assign({}, b, { target: "rate" }));
          if (b.kind === "cc" && learnFor.what === "cc-manual" && A().patch(data.key).mod === "lfo") A().set(data.key, { mod: "midi" });
          learnFor = null;
        }
        refreshModule();
      } else if (type === "midi-status") {
        const s = root.querySelector("#au-midistat");
        if (s) s.textContent = data;
      }
    });
  }

  function draw() {
    if (!A()) return render();
    listen();
    render();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  window.CuriosityAutomate = {
    draw,
    open(key) {
      if (A() && A().param(key)) {
        view.sel = key;
        view.level = A().param(key).level;
        view.q = "";
        view.group = "";
        saveView();
      }
      const b = document.querySelector('.tabs button[data-tab="automate"]');
      if (b && root.classList.contains("hidden")) b.click();
      else draw();
      const card = root.querySelector("#au-module");
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  };

  const css = document.createElement("style");
  css.id = "automate-style";
  css.textContent = `
.automate, .automate * { box-sizing: border-box; }
.automate { max-width: 100%; overflow-wrap: anywhere; }
.automate .au-g { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--saffron); margin: 12px 0 6px; }
.au-lab { font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; }
.au-n { opacity: 0.6; font-size: 10px; }
.au-presets { margin: 8px 0; }
.au-presets button { font-family: var(--mono); font-size: 11px; }
.au-grid > * { min-width: 0; }
.au-filter { display: flex; flex-wrap: wrap; gap: 6px; }
.au-filter input, .au-filter select { flex: 1 1 140px; min-width: 0; max-width: 100%; font-family: var(--sans); font-size: 14px; padding: 4px 6px; }
.au-list { list-style: none; padding: 0; margin: 6px 0; max-height: 420px; overflow-y: auto; border: 1px solid var(--line); background: white; }
.au-list button { display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--line); background: none; padding: 6px 8px; font-family: var(--sans); font-size: 13px; cursor: pointer; }
.au-list button.on { background: var(--ink); color: var(--paper); }
.au-live { font-family: var(--mono); font-size: 9px; color: var(--saffron); }
.au-list button.on .au-live { color: #e0a070; }
.au-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2f6b3a; margin-right: 6px; box-shadow: 0 0 4px #2f6b3a; }
.au-module { border: 3px solid var(--ink); background: linear-gradient(#3a332b, #2a241e); padding: 6px; border-radius: 4px; }
.au-module.run { box-shadow: 0 0 0 3px var(--saffron); }
.au-face { background: #e9e1d2; border: 1px solid #000; border-radius: 2px; padding: 10px; display: grid; gap: 8px; position: relative; }
.au-face::before, .au-face::after { content: ""; position: absolute; top: 4px; width: 8px; height: 8px; border-radius: 50%; background: #9a9086; box-shadow: inset 0 0 0 2px #6f665d; }
.au-face::before { left: 4px; } .au-face::after { right: 4px; }
.au-title { display: grid; gap: 2px; padding: 0 10px; }
.au-title strong { font-family: var(--serif); font-weight: 500; font-size: 18px; }
.au-level { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--saffron); }
.au-desc { margin: 0; font-size: 12px; color: #3a3229; }
.au-ab { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.au-ab > div { display: grid; gap: 4px; align-content: start; border: 1px solid #b9ad9c; padding: 6px; background: #f3ede2; min-width: 0; }
.au-ab select, .au-ab input[type="number"] { width: 100%; max-width: 100%; }
.au-prox { display: grid; gap: 2px; }
.au-prox input[type="number"] { width: 48px; }
.au-jack { display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle, #111 35%, #bbb 40%, #777 70%); vertical-align: middle; }
.au-jack.out { background: radial-gradient(circle, #111 35%, #e0a070 40%, #c45c26 70%); }
.au-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.au-seg { display: flex; flex-wrap: wrap; gap: 0; }
.automate .au-seg button { font-family: var(--mono); font-size: 10px; border: 1px solid var(--ink); background: #f7f2e9; padding: 4px 7px; margin: 0 -1px 0 0; cursor: pointer; }
.automate .au-seg button.on { background: var(--ink); color: var(--paper); }
.au-knobs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 130px), 1fr)); gap: 8px; }
.au-knob { display: grid; gap: 2px; font-family: var(--mono); font-size: 10px; text-transform: uppercase; }
.au-knob input { width: 100%; accent-color: var(--saffron); }
.au-knob b { font-weight: 500; font-size: 12px; }
.automate .au-trigger { width: 100%; min-height: 72px; font-family: var(--mono); font-size: 20px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 3px solid var(--ink); border-radius: 6px; background: radial-gradient(circle at 50% 35%, #fbe3cf, #e8a77c); color: var(--ink); cursor: pointer; touch-action: none; user-select: none; transition: background 0.05s, box-shadow 0.05s; }
.automate .au-trigger.on, .automate .au-trigger.held { background: radial-gradient(circle at 50% 35%, #fff4d6, #ff7a2e); box-shadow: 0 0 18px #ff7a2e, inset 0 0 0 3px #fff4d6; }
.au-trigger.held { transform: translateY(1px); }
.automate .au-star { justify-self: start; font-family: var(--mono); font-size: 11px; border: 1px solid var(--ink); background: #f7f2e9; padding: 3px 7px; cursor: pointer; margin-top: 4px; }
.automate .au-star.on { background: var(--gold); color: white; border-color: var(--gold); }
.automate .au-perf-btn { font-family: var(--mono); font-size: 12px; font-weight: 600; border: 2px solid var(--ink); background: var(--saffron); color: white; padding: 5px 10px; }
.automate .au-perf-btn.on { background: var(--ink); }
.au-pads { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr)); gap: 10px; }
.automate .au-pad { min-height: 130px; display: flex; flex-direction: column; justify-content: space-between; align-items: stretch; gap: 6px; text-align: left; border: 3px solid var(--ink); border-radius: 10px; background: radial-gradient(circle at 50% 30%, #fbe3cf, #e8a77c); color: var(--ink); padding: 10px; cursor: pointer; touch-action: none; user-select: none; -webkit-user-select: none; }
.automate .au-pad.on, .automate .au-pad.held { background: radial-gradient(circle at 50% 30%, #fff4d6, #ff7a2e); box-shadow: 0 0 18px #ff7a2e; }
.au-pad-l { font-family: var(--serif); font-size: 18px; line-height: 1.15; }
.au-pad-b { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
.au-pad .au-meter { width: 100%; height: 10px; background: rgba(255,255,255,0.6); }
.au-run button { font-family: var(--mono); font-size: 11px; }
.au-scope { width: 100%; height: auto; display: block; border: 1px solid #000; border-radius: 2px; }
.au-binds button { font-family: var(--mono); font-size: 10px; }
#au-outcc { width: 64px; }
.au-bay { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.au-slot { display: flex; gap: 6px; align-items: center; border: 1px solid var(--ink); background: white; padding: 3px 6px; max-width: 100%; }
.au-slot .link { font-size: 12px; text-align: left; }
.au-meter { display: inline-block; width: 48px; height: 8px; border: 1px solid var(--ink); position: relative; flex: none; }
.au-meter i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--saffron); width: 0; }
.au-panels { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: 8px; }
.au-panels .panel { flex: none; width: 100%; min-width: 0; }
.au-holds { margin: 8px 0; font-size: 13px; display: grid; gap: 2px; }
.au-help { margin-top: 12px; border: 1px dashed var(--saffron); padding: 6px 8px; background: #fff8ef; }
.au-help summary { cursor: pointer; font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
.au-help ol { padding-left: 18px; }
.au-help select { max-width: 100%; }
@media (max-width: 480px) { .au-ab { grid-template-columns: 1fr; } .au-list { max-height: 240px; } }
`;
  document.head.appendChild(css);
})();
