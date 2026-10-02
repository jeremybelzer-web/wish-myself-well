/* Studio: Live. Device mapping for performers, after Maya's device mapping and live streaming
   (MIDI, motion capture into HumanIK), Set Driven Key and Auto Key. Each mapping row binds one input
   (a MIDI CC, a MIDI note, a computer key, the mouse over the pad, or the device's tilt) to one live
   board curiosity, with a range, smoothing, invert and a curve shape. A note can fire a suite.
   The board panel redraws from the inputs as you play; Record writes the values once per beat at
   the BPM, and the take can be kept on the Shelf or sent to the board.
   State is localStorage key curiosities-studio-live-v1. */

(function () {
  if (!window.CuriosityStudio) return;

  const KEY = "curiosities-studio-live-v1";
  const SHAPES = ["linear", "ease", "step"];
  const INPUTS = [
    ["cc", "MIDI CC"],
    ["note", "MIDI note"],
    ["key", "Key"],
    ["mouseX", "Pad X"],
    ["mouseY", "Pad Y"],
    ["tiltX", "Tilt left/right"],
    ["tiltY", "Tilt forward/back"],
  ];

  function row(input, target, extra) {
    return Object.assign({ input, target, inMin: 0, inMax: 1, smooth: 0.6, invert: false, shape: "linear", mode: "velocity" }, extra || {});
  }

  const BUILT_IN = {
    "Body strap: arms = camera, legs = motion": [
      row({ type: "cc", num: 1 }, "moveSpeed"),
      row({ type: "cc", num: 2 }, "cameraMove", { shape: "step" }),
      row({ type: "cc", num: 3 }, "characterSpeed"),
      row({ type: "cc", num: 4 }, "characterPath", { shape: "step" }),
      row({ type: "cc", num: 5 }, "cameraCarry", { shape: "step", smooth: 0.3 }),
    ],
    "Keyboard: home row": [
      row({ type: "key", key: "a" }, "volume", { smooth: 0.85 }),
      row({ type: "key", key: "s" }, "moveSpeed", { smooth: 0.85 }),
      row({ type: "key", key: "d" }, "cameraCarry", { smooth: 0.2, shape: "step" }),
      row({ type: "key", key: "f" }, "characterPath", { shape: "step", smooth: 0 }),
      row({ type: "key", key: "j" }, "suite:quiet-confession", { smooth: 0 }),
      row({ type: "key", key: "k" }, "suite:handheld-hunt", { smooth: 0 }),
    ],
    "Mouse pad: X speed, Y loudness": [
      row({ type: "mouseX" }, "moveSpeed", { smooth: 0.5 }),
      row({ type: "mouseY" }, "volume", { smooth: 0.5 }),
      row({ type: "mouseX" }, "cameraCarry", { shape: "step", smooth: 0.2 }),
    ],
    "Pads: notes fire suites": [
      row({ type: "note", num: 36 }, "suite:coverage", { smooth: 0 }),
      row({ type: "note", num: 37 }, "suite:oner", { smooth: 0 }),
      row({ type: "note", num: 38 }, "suite:handheld-hunt", { smooth: 0 }),
      row({ type: "note", num: 39 }, "suite:quiet-confession", { smooth: 0 }),
      row({ type: "note", num: 40 }, "volume", { mode: "velocity", smooth: 0.3 }),
    ],
    "Phone tilt": [row({ type: "tiltX" }, "moveSpeed"), row({ type: "tiltY" }, "volume")],
  };

  let api = null;
  let root = null;
  let S = null;
  let raf = 0;
  let learnRow = -1;
  let midiStatus = "";
  let midiOn = false;
  let tiltOn = false;
  let lastPanel = "";
  let lastTick = 0;
  let rec = null;
  let take = null;
  const raw = {};
  const smooth = [];
  const prevTrig = [];
  const held = [];
  let overlay = {};
  let suiteName = "";

  function esc(s) {
    return api.esc(s);
  }

  function live() {
    return (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []).filter((c) => c.live);
  }
  function cur(id) {
    return live().find((c) => c.id === id);
  }
  function suites() {
    return typeof SUITES !== "undefined" ? SUITES : [];
  }

  function load() {
    const s = api.store(KEY).get(null) || {};
    const preset = s.preset && (BUILT_IN[s.preset] || (s.presets || {})[s.preset]) ? s.preset : "Mouse pad: X speed, Y loudness";
    return {
      bpm: s.bpm || 96,
      preset,
      presets: s.presets || {},
      rows: Array.isArray(s.rows) && s.rows.length ? s.rows : JSON.parse(JSON.stringify(BUILT_IN[preset] || BUILT_IN["Mouse pad: X speed, Y loudness"])),
    };
  }
  function save() {
    api.store(KEY).set({ bpm: S.bpm, preset: S.preset, presets: S.presets, rows: S.rows });
  }

  function inputKey(inp) {
    if (inp.type === "cc") return "cc:" + inp.num;
    if (inp.type === "note") return "note:" + inp.num;
    if (inp.type === "key") return "key:" + String(inp.key || "").toLowerCase();
    return inp.type;
  }
  function inputName(inp) {
    if (inp.type === "cc") return "CC " + inp.num;
    if (inp.type === "note") return "Note " + inp.num;
    if (inp.type === "key") return "Key " + String(inp.key || "?").toUpperCase();
    return (INPUTS.find((x) => x[0] === inp.type) || [0, inp.type])[1];
  }

  /* Input 0..1 → shaped 0..1 for one row. */
  function shaped(r, i) {
    let x = raw[inputKey(r.input)] || 0;
    const lo = Number(r.inMin);
    const hi = Number(r.inMax);
    x = hi === lo ? (x >= hi ? 1 : 0) : (x - lo) / (hi - lo);
    x = Math.max(0, Math.min(1, x));
    if (r.invert) x = 1 - x;
    if (r.shape === "ease") x = x * x * (3 - 2 * x);
    const a = Math.max(0, Math.min(0.97, Number(r.smooth) || 0));
    smooth[i] = smooth[i] == null ? x : smooth[i] * a + x * (1 - a);
    return smooth[i];
  }

  function valueOf(c, x, shape) {
    if (c.kind === "range") {
      const v = c.min + x * (c.max - c.min);
      return shape === "step" ? Math.round(v) : Math.round(v);
    }
    const n = c.options.length;
    return c.options[Math.min(n - 1, Math.floor(x * n))];
  }

  /* Current values: the board as it stands, the last suite fired, then every mapped row. */
  function current() {
    const base = api.board && api.board.values ? api.board.values() : {};
    const v = Object.assign({}, base, overlay);
    const levels = [];
    S.rows.forEach((r, i) => {
      const x = shaped(r, i);
      levels[i] = x;
      if (String(r.target).startsWith("suite:")) {
        const on = x > 0.5;
        if (on && !prevTrig[i]) fireSuite(r.target.slice(6));
        prevTrig[i] = on;
        return;
      }
      const c = cur(r.target);
      /* A fired suite holds its values until that row's input moves. */
      const now = raw[inputKey(r.input)] || 0;
      if (held[i] != null && Math.abs(now - held[i]) < 0.02) return;
      held[i] = null;
      if (c) v[c.id] = valueOf(c, x, r.shape);
    });
    return { v, levels };
  }

  /* A quick tap can land between two frames, so suite rows fire straight from the event. */
  function fireFor(k) {
    S.rows.forEach((r, i) => {
      if (String(r.target).startsWith("suite:") && inputKey(r.input) === k) {
        fireSuite(r.target.slice(6));
        prevTrig[i] = true;
      }
    });
  }

  function fireSuite(id) {
    const s = suites().find((x) => x.id === id);
    if (!s) return;
    const ids = new Set(live().map((c) => c.id));
    overlay = {};
    Object.entries(s.set).forEach(([k, val]) => {
      if (ids.has(k)) overlay[k] = val;
    });
    suiteName = s.label;
    S.rows.forEach((r, i) => {
      held[i] = overlay[r.target] != null ? raw[inputKey(r.input)] || 0 : null;
    });
  }

  /* ---------- proximities ---------- */

  function proxList() {
    return (typeof PROXIMITIES !== "undefined" ? PROXIMITIES : []).filter((p) => p.x && p.y && p.x.curiosity && p.y.curiosity && cur(p.x.curiosity) && cur(p.y.curiosity));
  }

  function side(sd, vals, i) {
    const v = vals[i];
    if (sd.is != null) return String(v) === String(sd.is);
    if (i === 0 || !sd.change) return false;
    const c = cur(sd.curiosity);
    const num = (x) => (c && c.options ? c.options.indexOf(x) : Number(x));
    if (sd.change === "rises" || sd.change === "grows") return num(v) > num(vals[i - 1]);
    if (sd.change === "drops") return num(v) < num(vals[i - 1]);
    return num(v) !== num(vals[i - 1]);
  }

  function proxHtml(v) {
    const list = proxList();
    const tested = (typeof PROXIMITIES !== "undefined" ? PROXIMITIES : []).filter((p) => p.test);
    const all = tested.concat(list.filter((p) => !p.test));
    return all
      .map((p) => {
        let now = false;
        try {
          now = p.test ? !!p.test(v, v.shotSize) : side(p.x, [v[p.x.curiosity]], 0);
        } catch (e) {}
        let tk = "";
        if (take && take.beats > 1 && p.x.curiosity && p.y.curiosity && take.values[p.x.curiosity] && take.values[p.y.curiosity]) {
          const xs = take.values[p.x.curiosity];
          const ys = take.values[p.y.curiosity];
          let fired = 0;
          let held = 0;
          xs.forEach((_, i) => {
            if (!side(p.x, xs, i)) return;
            fired++;
            for (let j = i; j <= Math.min(xs.length - 1, i + (p.within || 0)); j++)
              if (side(p.y, ys, j)) {
                held++;
                break;
              }
          });
          tk = fired ? ` <span class="mono">take: held ${held}/${fired}</span>` : ` <span class="mono">take: X never happened</span>`;
        }
        return `<div class="lv-prox${now ? " on" : ""}"><span class="chip${now ? " lit" : ""}">${now ? "holds" : "doesn’t hold"}</span> When ${esc(p.when)}, ${esc(p.then)} within ${p.within}.${tk}</div>`;
      })
      .join("");
  }

  /* ---------- drawing ---------- */

  function targetOptions(sel) {
    const groups = {};
    live().forEach((c) => (groups[c.group] = groups[c.group] || []).push(c));
    return (
      Object.keys(groups)
        .map((g) => `<optgroup label="${esc(g)}">${groups[g].map((c) => `<option value="${esc(c.id)}"${c.id === sel ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</optgroup>`)
        .join("") +
      `<optgroup label="Fire a suite">${suites()
        .map((s) => `<option value="suite:${esc(s.id)}"${"suite:" + s.id === sel ? " selected" : ""}>Suite: ${esc(s.label)}</option>`)
        .join("")}</optgroup>`
    );
  }

  function rowHtml(r, i) {
    const t = r.input.type;
    const c = cur(r.target);
    const range = c ? (c.kind === "range" ? `${c.min}–${c.max}` : c.options.join(" · ")) : "fires when the input passes halfway";
    return `<div class="lv-row" data-row="${i}">
      <div class="lv-top">
        <select data-f="type" aria-label="Input">${INPUTS.map((x) => `<option value="${x[0]}"${x[0] === t ? " selected" : ""}>${x[1]}</option>`).join("")}</select>
        ${t === "cc" || t === "note" ? `<input type="number" data-f="num" min="0" max="127" value="${Number(r.input.num) || 0}" aria-label="Number">` : ""}
        ${t === "key" ? `<input type="text" data-f="key" maxlength="1" value="${esc(r.input.key || "")}" aria-label="Key">` : ""}
        ${t === "note" ? `<select data-f="mode" aria-label="Note mode"><option value="velocity"${r.mode === "velocity" ? " selected" : ""}>velocity</option><option value="toggle"${r.mode === "toggle" ? " selected" : ""}>on/off</option></select>` : ""}
        <button type="button" data-learn="${i}" class="${learnRow === i ? "chip-btn on" : ""}">${learnRow === i ? "Move a control…" : "Learn"}</button>
        <span class="lv-arrow">→</span>
        <select data-f="target" aria-label="Curiosity">${targetOptions(r.target)}</select>
        <button type="button" data-del="${i}" aria-label="Remove row">×</button>
        <button type="button" data-toauto="${i}" title="Create or update the matching patch in Automate">Make it an automation</button>
      </div>
      <div class="lv-meter"><i id="lv-m-${i}"></i><span id="lv-v-${i}" class="mono"></span></div>
      <div class="lv-opts">
        <label class="field">In min<input type="number" data-f="inMin" step="0.05" min="0" max="1" value="${r.inMin}"></label>
        <label class="field">In max<input type="number" data-f="inMax" step="0.05" min="0" max="1" value="${r.inMax}"></label>
        <label class="field">Smooth<input type="range" data-f="smooth" min="0" max="0.95" step="0.05" value="${r.smooth}"></label>
        <label class="field">Shape<select data-f="shape">${SHAPES.map((s) => `<option${s === r.shape ? " selected" : ""}>${s}</option>`).join("")}</select></label>
        <label class="cap lv-inv"><input type="checkbox" data-f="invert"${r.invert ? " checked" : ""}> invert</label>
      </div>
      <p class="cap lv-range">${esc(inputName(r.input))} to ${esc(c ? c.label : "a suite")}: ${esc(range)}</p>
    </div>`;
  }

  function presetNames() {
    return Object.keys(BUILT_IN).concat(Object.keys(S.presets));
  }

  function render() {
    root.innerHTML = `<p class="cap lv-auto-note">The <button type="button" class="linkish" data-act="automate"><u>Automate</u></button> tab is the main place for LFOs, MIDI bindings and modular synths (VCV Rack). “Make it an automation” turns a mapping row into a patch there.</p>
    <div class="studio-grid lv">
      <div class="lv-side">
        <div class="g">Preset</div>
        <label class="field">Mapping<select id="lv-preset">${presetNames()
          .map((n) => `<option${n === S.preset ? " selected" : ""}>${esc(n)}</option>`)
          .join("")}</select></label>
        <div class="bar-actions"><input type="text" id="lv-name" placeholder="Name this mapping" value=""><button type="button" data-act="save">Save preset</button>${S.presets[S.preset] ? `<button type="button" data-act="delpreset">Delete</button>` : ""}</div>
        <div class="g">Devices</div>
        <div class="bar-actions"><button type="button" data-act="midi">${midiOn ? "MIDI connected" : "Connect MIDI"}</button>${
          "DeviceOrientationEvent" in window ? `<button type="button" data-act="tilt">${tiltOn ? "Tilt on" : "Use tilt"}</button>` : ""
        }</div>
        <p class="cap" id="lv-midi">${esc(midiStatus || "No MIDI yet: keys and the pad work without it. Learn binds the next CC, note, key or pad move.")}</p>
        <div class="g">Pad</div>
        <div class="lv-pad" id="lv-pad"><i id="lv-dot"></i><span class="cap">Move here: X left to right, Y bottom to top</span></div>
        <div class="g">Suites</div>
        <div class="bar-actions">${suites()
          .filter((s) => Object.keys(s.set).some((k) => cur(k)))
          .map((s) => `<button type="button" class="lv-suite" data-suite="${esc(s.id)}">${esc(s.label)}</button>`)
          .join("")}<button type="button" data-act="unsuite">Clear suite</button></div>
      </div>
      <div class="lv-main">
        <div class="lv-stage"><div id="lv-panel"></div><p class="cap" id="lv-suite"></p></div>
        <div id="lv-chips"></div>
        <div class="g">Proximities</div>
        <div id="lv-prox"></div>
        <div class="g">Record (Auto Key)</div>
        <div class="bar-actions lv-rec">
          <label class="field lv-small">BPM<input type="number" id="lv-bpm" min="20" max="300" value="${S.bpm}"></label>
          <button type="button" data-act="rec" class="${rec ? "lv-on" : ""}">${rec ? "Stop" : "● Record"}</button>
          <span class="mono" id="lv-rec">${take ? `take: ${take.beats} beat${take.beats === 1 ? "" : "s"}` : "no take yet"}</span>
        </div>
        <div class="bar-actions"><button type="button" data-act="shelf">Keep on Shelf</button><button type="button" data-act="board">Send to board</button></div>
        <p class="cap">Without a take, both keep what is live right now. A take goes to the board as 4 panels.</p>
        <div class="g">Mappings</div>
        ${S.rows.map(rowHtml).join("")}
        <div class="bar-actions"><button type="button" data-act="add">Add mapping</button></div>
      </div>
    </div>`;
    lastPanel = "";
    bind();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function bind() {
    root.querySelectorAll(".lv-row").forEach((el) => {
      const i = Number(el.dataset.row);
      el.querySelectorAll("[data-f]").forEach((inp) =>
        inp.addEventListener("change", () => {
          const r = S.rows[i];
          const f = inp.dataset.f;
          if (f === "type") {
            r.input = { type: inp.value, num: r.input.num || 1, key: r.input.key || "a" };
          } else if (f === "num") r.input.num = Math.max(0, Math.min(127, Number(inp.value) || 0));
          else if (f === "key") r.input.key = inp.value.toLowerCase();
          else if (f === "invert") r.invert = inp.checked;
          else if (f === "target" || f === "shape" || f === "mode") r[f] = inp.value;
          else r[f] = Number(inp.value);
          smooth[i] = null;
          save();
          if (f !== "smooth" && f !== "inMin" && f !== "inMax") render();
        })
      );
    });
    root.querySelectorAll("[data-toauto]").forEach((b) => b.addEventListener("click", () => toAutomation(S.rows[Number(b.dataset.toauto)])));
    root.querySelectorAll("[data-learn]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.learn);
        learnRow = learnRow === i ? -1 : i;
        render();
      })
    );
    root.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        S.rows.splice(Number(b.dataset.del), 1);
        smooth.length = 0;
        save();
        render();
      })
    );
    root.querySelectorAll("[data-suite]").forEach((b) => b.addEventListener("click", () => fireSuite(b.dataset.suite)));
    root.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
    root.querySelector("#lv-preset").addEventListener("change", (e) => {
      const n = e.target.value;
      S.preset = n;
      S.rows = JSON.parse(JSON.stringify(BUILT_IN[n] || S.presets[n] || []));
      smooth.length = 0;
      save();
      render();
    });
    root.querySelector("#lv-bpm").addEventListener("change", (e) => {
      S.bpm = Math.max(20, Math.min(300, Number(e.target.value) || 96));
      save();
    });
    const pad = root.querySelector("#lv-pad");
    const move = (e) => {
      const r = pad.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
      if (learnRow >= 0 && Math.abs(x - (raw.mouseX || 0)) + Math.abs(y - (raw.mouseY || 0)) > 0.05 && raw.mouseX != null) {
        learnInput(Math.abs(x - raw.mouseX) > Math.abs(y - raw.mouseY) ? { type: "mouseX" } : { type: "mouseY" });
      }
      raw.mouseX = x;
      raw.mouseY = y;
      const d = root.querySelector("#lv-dot");
      if (d) {
        d.style.left = x * 100 + "%";
        d.style.top = (1 - y) * 100 + "%";
      }
    };
    pad.addEventListener("pointermove", move);
    pad.addEventListener("pointerdown", (e) => {
      try {
        pad.setPointerCapture(e.pointerId);
      } catch (err) {}
      move(e);
    });
  }

  function learnInput(inp) {
    if (learnRow < 0 || !S.rows[learnRow]) return;
    S.rows[learnRow].input = Object.assign({ num: 1, key: "a" }, inp);
    smooth[learnRow] = null;
    learnRow = -1;
    save();
    render();
  }

  function snapTake() {
    if (take && take.beats) return take.values;
    const { v } = current();
    const out = {};
    mappedIds().forEach((id) => (out[id] = [v[id]]));
    return out;
  }

  function mappedIds() {
    const ids = new Set(S.rows.map((r) => r.target).filter((t) => cur(t)));
    Object.keys(overlay).forEach((k) => ids.add(k));
    return [...ids];
  }

  function act(a) {
    if (a === "add") {
      S.rows.push(row({ type: "key", key: "q" }, "volume"));
      save();
      render();
    } else if (a === "save") {
      const n = (root.querySelector("#lv-name").value || "").trim();
      if (!n) return;
      S.presets[n] = JSON.parse(JSON.stringify(S.rows));
      S.preset = n;
      save();
      render();
    } else if (a === "delpreset") {
      delete S.presets[S.preset];
      S.preset = Object.keys(BUILT_IN)[0];
      save();
      render();
    } else if (a === "midi") midi();
    else if (a === "automate") {
      const b = document.querySelector('.tabs button[data-tab="automate"]');
      if (b) b.click();
    }
    else if (a === "tilt") tilt();
    else if (a === "unsuite") {
      overlay = {};
      suiteName = "";
      held.length = 0;
    } else if (a === "rec") {
      if (rec) {
        rec = null;
      } else {
        rec = { t0: performance.now(), n: 0 };
        take = { beats: 0, values: {} };
      }
      render();
    } else if (a === "shelf") {
      const v = snapTake();
      if (Object.keys(v).length) api.toShelf(`Live · ${S.preset}`, v);
    } else if (a === "board") {
      const v = snapTake();
      const out = {};
      Object.entries(v).forEach(([id, vals]) => {
        if (!cur(id) || !vals.length) return;
        out[id] = [0, 1, 2, 3].map((p) => vals[Math.round((p * (vals.length - 1)) / 3)]);
      });
      if (Object.keys(out).length) api.toBoard(`Live · ${S.preset}`, out);
    }
  }

  /* ---------- devices ---------- */

  function setMidi(s) {
    midiStatus = s;
    const el = root && root.querySelector("#lv-midi");
    if (el) el.textContent = s;
  }

  /* A mapping row becomes a CurioAuto patch: a/b from the row's range, CC rows follow the
     controller (mod "midi"), note rows trigger it (gate, or toggle for on/off rows). */
  function toAutomation(r) {
    const A = window.CurioAuto;
    if (!A || !r) return;
    const isSuite = String(r.target).indexOf("suite:") === 0;
    const key = isSuite ? "s:" + r.target.slice(6) : "c:" + r.target;
    if (!A.param(key)) return;
    const changes = {};
    if (isSuite) {
      changes.a = "";
      changes.b = r.target.slice(6);
    } else {
      const c = cur(r.target) || (typeof CURIOSITIES !== "undefined" ? CURIOSITIES.find((x) => x.id === r.target) : null);
      if (c && (c.kind === "range" || c.options)) {
        let lo = valueOf(c, Math.max(0, Math.min(1, Number(r.inMin) || 0)), r.shape);
        let hi = valueOf(c, Math.max(0, Math.min(1, r.inMax == null ? 1 : Number(r.inMax))) - 1e-9, r.shape);
        if (r.invert) [lo, hi] = [hi, lo];
        changes.a = lo;
        changes.b = hi;
      }
    }
    const t = r.input.type;
    if (t === "cc") {
      Object.assign(changes, { mod: "midi", manual: 0 });
      A.set(key, changes);
      A.bind(key, { kind: "cc", num: Number(r.input.num) || 0 });
    } else if (t === "note") {
      Object.assign(changes, { mod: "manual", manual: 1, mode: r.mode === "toggle" ? "toggle" : "gate" });
      A.set(key, changes);
      A.bind(key, { kind: "note", num: Number(r.input.num) || 0 });
    } else if (t === "key") {
      Object.assign(changes, { mod: "manual", manual: 1, mode: "gate" });
      A.set(key, changes);
      const k = String(r.input.key || "a");
      A.bind(key, { kind: "key", code: /^[0-9]$/.test(k) ? "Digit" + k : "Key" + k.toUpperCase() });
    } else A.set(key, changes);
    if (window.CuriosityAutomate && window.CuriosityAutomate.open) window.CuriosityAutomate.open(key);
  }

  /* MIDI goes through the automation layer when it is loaded, so one connection serves both. */
  let autoHooked = false;
  function hookAuto() {
    const A = window.CurioAuto;
    if (autoHooked || !A || !A.on) return;
    autoHooked = true;
    A.on((type, d) => {
      if (type === "midi" && d) onEvent(d.kind, d.num, d.kind === "cc" ? d.val : d.on ? d.vel || 127 : 0, d.kind === "note" ? !!d.on : false);
      else if (type === "midi-status" && typeof d === "string") {
        midiOn = !!(A.midi && A.midi.access && A.midi.access.inputs && A.midi.access.inputs.size);
        setMidi(d + " (shared with Automate)");
      }
    });
  }

  function midi() {
    const A = window.CurioAuto;
    if (A && A.connectMidi) {
      hookAuto();
      setMidi("Asking for MIDI…");
      A.connectMidi().then((ok) => {
        midiOn = !!ok;
        setMidi((A.midi.status || (ok ? "MIDI on." : "No MIDI.")) + " (shared with Automate)");
        if (root) render();
      });
      return;
    }
    if (!navigator.requestMIDIAccess) return setMidi("This browser has no Web MIDI. Keys, the pad and tilt still work.");
    setMidi("Asking for MIDI…");
    setTimeout(() => {
      if (!midiOn && midiStatus === "Asking for MIDI…") setMidi("No answer from MIDI yet. Allow it in the browser, or play with keys and the pad.");
    }, 4000);
    navigator.requestMIDIAccess().then(
      (access) => {
        const hook = () => {
          let n = 0;
          access.inputs.forEach((inp) => {
            n++;
            inp.onmidimessage = onMidi;
          });
          midiOn = n > 0;
          setMidi(n ? `${n} MIDI input${n === 1 ? "" : "s"} connected.` : "No MIDI inputs found. Plug one in; keys and the pad still work.");
        };
        access.onstatechange = hook;
        hook();
        if (root) render();
      },
      () => setMidi("MIDI was refused or is unavailable. Keys and the pad still work.")
    );
  }

  function onMidi(e) {
    const [st, d1, d2] = e.data;
    const type = st & 0xf0;
    if (type === 0xb0) onEvent("cc", d1, d2, false);
    else if (type === 0x90 || type === 0x80) onEvent("note", d1, d2, type === 0x90 && d2 > 0);
  }

  function onEvent(kind, d1, d2, on) {
    if (kind === "cc") {
      raw["cc:" + d1] = d2 / 127;
      if (learnRow >= 0) learnInput({ type: "cc", num: d1 });
    } else if (kind === "note") {
      const r = S.rows.find((x) => x.input.type === "note" && Number(x.input.num) === d1);
      if (r && r.mode === "toggle") {
        if (on) raw["note:" + d1] = raw["note:" + d1] > 0.5 ? 0 : 1;
      } else raw["note:" + d1] = on ? d2 / 127 : 0;
      if (on) fireFor("note:" + d1);
      if (on && learnRow >= 0) learnInput({ type: "note", num: d1 });
    }
  }

  function tilt() {
    const go = () => {
      tiltOn = true;
      window.addEventListener("deviceorientation", (e) => {
        if (e.gamma != null) raw.tiltX = Math.max(0, Math.min(1, (e.gamma + 45) / 90));
        if (e.beta != null) raw.tiltY = Math.max(0, Math.min(1, (e.beta + 0) / 90));
      });
      if (root) render();
    };
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") D.requestPermission().then((r) => (r === "granted" ? go() : setMidi("Tilt was refused."))).catch(() => setMidi("Tilt is not available."));
    else go();
  }

  let keysBound = false;
  function bindKeys() {
    if (keysBound) return;
    keysBound = true;
    const visible = () => root && document.body.contains(root) && root.offsetParent !== null;
    document.addEventListener("keydown", (e) => {
      if (!visible() || e.repeat) return;
      if (/INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || "")) return;
      if (e.key.length !== 1) return;
      const k = e.key.toLowerCase();
      if (learnRow >= 0) {
        e.preventDefault();
        return learnInput({ type: "key", key: k });
      }
      if (S.rows.some((r) => r.input.type === "key" && String(r.input.key).toLowerCase() === k)) e.preventDefault();
      raw["key:" + k] = 1;
      fireFor("key:" + k);
    });
    document.addEventListener("keyup", (e) => {
      if (e.key && e.key.length === 1) raw["key:" + e.key.toLowerCase()] = 0;
    });
  }

  /* ---------- the loop ---------- */

  function tick(now) {
    raf = 0;
    if (!root || !document.body.contains(root)) {
      rec = null;
      return;
    }
    const { v, levels } = current();
    S.rows.forEach((r, i) => {
      const m = root.querySelector("#lv-m-" + i);
      const t = root.querySelector("#lv-v-" + i);
      if (m) m.style.width = Math.round((levels[i] || 0) * 100) + "%";
      if (t) t.textContent = String(r.target).startsWith("suite:") ? (levels[i] > 0.5 ? "fire" : "—") : String(v[r.target]);
    });
    if (rec) {
      const beat = Math.floor(((now - rec.t0) / 60000) * S.bpm);
      while (rec.n <= beat) {
        mappedIds().forEach((id) => {
          const arr = (take.values[id] = take.values[id] || []);
          while (arr.length < rec.n) arr.push(v[id]);
          arr.push(v[id]);
        });
        rec.n++;
        take.beats = rec.n;
        const el = root.querySelector("#lv-rec");
        if (el) el.textContent = `recording · beat ${rec.n}`;
      }
    }
    if (now - lastTick > 90 || !lastPanel) {
      lastTick = now;
      const key = JSON.stringify(v);
      if (key !== lastPanel) {
        lastPanel = key;
        const p = root.querySelector("#lv-panel");
        const b = api.board;
        if (p && b && b.panel && b.scene) {
          const sc = b.scene();
          const count = Math.max(1, Number(v.angleCount) || 1);
          try {
            p.innerHTML = b.panel(sc.lines[0], 0, count, v);
          } catch (e) {
            p.textContent = "The board panel could not draw.";
          }
        }
        const ch = root.querySelector("#lv-chips");
        if (ch)
          ch.innerHTML = mappedIds()
            .map((id) => `<span class="chip${overlay[id] != null ? " suite" : ""}">${esc(id)}: ${esc(v[id])}</span>`)
            .join("");
        const px = root.querySelector("#lv-prox");
        if (px) px.innerHTML = proxHtml(v);
        const su = root.querySelector("#lv-suite");
        if (su) su.textContent = suiteName ? `Suite fired: ${suiteName}` : "";
      }
    }
    raf = requestAnimationFrame(tick);
  }

  function injectStyle() {
    if (document.getElementById("studio-live")) return;
    const st = document.createElement("style");
    st.id = "studio-live";
    st.textContent = `
.lv, .lv * { box-sizing: border-box; }
.lv .g { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--saffron); margin: 14px 0 6px; }
.lv-side, .lv-main { min-width: 0; overflow-wrap: anywhere; }
.lv select, .lv input:not([type="checkbox"]) { max-width: 100%; min-width: 0; }
.lv input[type="range"] { accent-color: var(--saffron); }
.lv-pad { position: relative; height: 160px; border: 2px solid var(--ink); background: repeating-linear-gradient(0deg, transparent, transparent 31px, var(--line) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, var(--line) 32px), white; touch-action: none; cursor: crosshair; display: flex; align-items: flex-end; padding: 4px; }
.lv-pad i { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: var(--saffron); left: 50%; top: 50%; pointer-events: none; }
.lv-stage { max-width: 420px; }
.lv-stage .panel { width: 100%; flex: none; }
.lv-row { border: 1px solid var(--line); background: rgba(255,255,255,0.6); padding: 6px; margin: 0 0 8px; }
.lv-top { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.lv-top input[type="number"] { width: 56px; }
.lv-top input[type="text"] { width: 36px; text-align: center; }
.lv-top select[data-f="target"] { flex: 1 1 140px; }
.lv-arrow { font-family: var(--mono); }
.lv-meter { position: relative; height: 14px; border: 1px solid var(--line); background: white; margin: 6px 0; }
.lv-meter i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(196, 92, 38, 0.55); }
.lv-meter span { position: absolute; right: 4px; top: 0; font-size: 10px; line-height: 12px; }
.lv-opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 0 8px; align-items: end; }
.lv-opts label.field { margin: 0 0 6px; min-width: 0; }
.lv-opts input, .lv-opts select { width: 100%; }
.lv-inv { margin: 0 0 8px; }
.lv-range { font-size: 12px; }
.lv-prox { font-size: 13px; margin: 0 0 4px; }
.lv-prox.on { color: var(--ink); }
.lv-small { margin: 0; min-width: 80px; }
.lv-rec { align-items: end; }
.lv-on { background: var(--saffron); color: white; border-color: var(--saffron); }
#lv-name { flex: 1 1 140px; }
`;
    document.head.appendChild(st);
  }

  window.CuriosityStudio.register({
    id: "live",
    label: "Live",
    order: 33,
    maya: "Device mapping and live streaming (MIDI, motion capture into HumanIK), Set Driven Key, Auto Key recording",
    draw(el, studioApi) {
      api = studioApi;
      if (!S) S = load();
      root = el;
      injectStyle();
      bindKeys();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      render();
    },
  });
})();
