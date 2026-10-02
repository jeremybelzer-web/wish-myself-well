/* Automate: every curiosity, suite, proximity and proximity suite as a module on a patch bay.
   The trigger is an on/off switch (the big button, a MIDI note from a pad or a worn button, a computer key),
   held as a gate or tapped as a toggle. Inside, lanes grade each part between two settings: the main
   lane (an angle from low to high), and more lanes for its other dimensions (how close to how far),
   each with its own curve, modulator (follows the main one, an LFO, a knob, a MIDI CC) and sweep
   across the moment, the span of panels it plays in. Every running module's position can go out as a
   MIDI CC to a modular synth (VCV Rack) and come back in. The board below shows the result live.
   Body presets (dancer, actor, comedian) bind worn sensors (MIDI CC) and buttons (MIDI notes) to modules and
   lanes in plain words, with a step-by-step Learn and an Undo; pad and keyboard layouts put the most used
   modules on a 16-pad grid or a 25-key keyboard, with a printable cheat sheet.
   The engine is window.CurioAuto (automation.js); this file is only its face. */

(function () {
  /* The patch bay draws into #automate (the Automate tab) or wherever mountFull put it. Cards can go anywhere. */
  let root = document.getElementById("automate");
  const VIEW = "curiosities-automate-view-v1";
  const LEVELS = [
    ["curiosity", "Curiosities"],
    ["suite", "Suites"],
    ["proximity", "Proximities"],
    ["proximity suite", "Proximity suites"],
  ];
  const SHAPES = ["sine", "triangle", "square", "saw", "random"];

  /* A preset sets the main lane (set), and can switch lanes on with their own settings (lanes: {id: changes}).
     A preset that names lanes switches the others off, so it always sounds the same. */
  const PRESETS = [
    {
      name: "Low to high on a face",
      key: "c:angleHeight",
      set: { a: "low", b: "high", mod: "lfo", shape: "sine", rate: 0.25, depth: 1, curve: "linear", across: 0.5, where: { from: 0, to: null }, mode: "toggle" },
      lanes: { "c:shotSize": { on: true, from: "close", to: "wide", curve: "linear", mod: "follow", across: 0 } },
    },
    { name: "Handheld flicker", key: "c:cameraCarry", set: { a: "locked", b: "handheld", mod: "lfo", shape: "square", rate: 2, depth: 1 } },
    { name: "Noir pulse", key: "s:noir", set: { a: "", b: "noir", mod: "lfo", shape: "sine", rate: 0.25, depth: 1 } },
    {
      name: "Rain makes wet",
      key: "p:rain-wet",
      set: { a: { on: true, within: 2 }, b: { on: true, within: 2 }, mod: "lfo", shape: "sine", rate: 0.2, depth: 1, where: { from: 0, to: null }, mode: "toggle" },
      lanes: {
        cause: { on: true, from: 0.5, to: 0.5, mod: "follow" },
        delay: { on: true, from: 0, to: 2, curve: "steps", mod: "lfo", shape: "triangle", rate: 0.3, depth: 1 },
      },
    },
    { name: "Emotion steers the lens", key: "ps:emotion-steers-lens", set: { a: { on: false, within: 0 }, b: { on: true, within: 1 }, mod: "lfo", shape: "triangle", rate: 0.3, depth: 1 } },
    { name: "Speed breathes", key: "c:moveSpeed", set: { a: 1, b: 5, mod: "lfo", shape: "sine", rate: 0.5, depth: 1 } },
  ];

  let view = { level: "curiosity", q: "", group: "", sel: "c:cameraCarry", stars: [], perf: false };
  try {
    view = Object.assign(view, JSON.parse(localStorage.getItem(VIEW) || "{}"));
  } catch (e) {}
  let raf = 0;
  let unsub = null;
  let lastPanels = 0;
  let lastPanelSig = "";
  const lanesOpen = {}; // key -> true once a patch preset opens its Lanes

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
    return !!root && root.isConnected && !root.classList.contains("hidden") && root.getClientRects().length > 0;
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
    return `<span class="au-prox"><label class="cap"><input type="checkbox" data-ab="${side}" data-part="on"${val.on ? " checked" : ""}> rule on</label>
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
      if (!s) return "";
      if (!Object.keys(s.set || {}).length) return (s.note || "") + " A group of lenses: " + (s.lenses || []).join(", ") + ".";
      return (s.note || "") + " Sets " + Object.entries(s.set).map(([k, v]) => `${k} ${v}`).join(", ") + ".";
    }
    const d = p.domain;
    return `${p.group}. ${d.kind === "range" ? `${d.min} to ${d.max}` : d.options.join(" · ")}${p.live || ["shotSize", "angleHeight", "dutch"].includes(p.id) ? ". On the board." : ". Not a board control; it still runs and goes out as MIDI."}`;
  }
  function bindingText(b) {
    if (!b) return "no binding";
    if (b.kind === "note") return `MIDI note ${b.num} triggers`;
    if (b.kind === "cc") return `MIDI CC ${b.num} → ${b.target === "rate" ? "rate" : "manual"}`;
    if (b.kind === "key") return `key ${b.code.replace(/^Key|^Digit/, "")} triggers`;
    return "bound";
  }

  /* ---------- the patch bay's parameter list ---------- */

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
    return `<label class="au-knob"><span>${esc(label)}</span><input type="range" data-k="${name}" min="${min}" max="${max}" step="${step}" value="${val}"><b data-kv="${name}">${esc(fmt ? fmt(val) : val)}</b></label>`;
  }

  function panelCount() {
    const b = window.CuriosityBoard;
    return Math.max(1, Math.min(16, Number(b && b.values && b.values().angleCount) || 4));
  }
  /* The main lane in plain words: "Angle height: from low to high". */
  function mainName(p, pt) {
    if (p.level === "curiosity") return `${p.label}: from ${pt.a} to ${pt.b}`;
    if (p.level === "suite") {
      const n = (id) => (id ? (SUITES.find((s) => s.id === id) || { label: id }).label : "none");
      return `Suite: from ${n(pt.a)} to ${n(pt.b)}`;
    }
    const w = (x) => (x && x.on ? `on, within ${Number(x.within) || 0} beats` : "off");
    return `Rule: from ${w(pt.a)} to ${w(pt.b)}`;
  }
  function curveSelect(attr, val) {
    return `<select ${attr}>${Object.entries(A().CURVES).map(([k, n]) => `<option value="${k}"${k === (val || "linear") ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>`;
  }
  function sweepHtml(attr, val) {
    const v = Number(val) || 0;
    return `<label class="au-knob au-sweep"><span title="0: every panel in the moment gets the same setting. 1: the setting moves through the moment, first panel to last.">Sweep across the moment</span><input type="range" ${attr} min="0" max="1" step="0.05" value="${v}"><b>${Math.round(v * 100)}%</b></label>`;
  }
  /* The moment is a span of panels, or of scenes on a story workspace (unit "scene"). */
  function sceneCount() {
    const st = window.CuriosityStory;
    const n = st && st.scenes ? st.scenes().length : 0;
    return Math.max(1, Math.min(16, n || 8));
  }
  function momentHtml(pt, unit) {
    const scene = unit === "scene";
    const n = scene ? sceneCount() : panelCount();
    const u = scene ? "scene" : "panel";
    const w = pt.where || {};
    const from = Math.max(0, Math.min(n - 1, Number(w.from) || 0));
    const to = w.to == null || w.to === "" ? "" : Math.min(n - 1, Number(w.to));
    const opts = (sel, last) => (last ? `<option value=""${sel === "" ? " selected" : ""}>last (${n})</option>` : "") + Array.from({ length: n }, (_, i) => `<option value="${i}"${String(sel) === String(i) ? " selected" : ""}>${i + 1}</option>`).join("");
    return `<div class="au-row au-moment"><span class="au-lab" title="Which ${u}s of your film it plays in.">Moment</span>
      <label class="cap">from ${u} <select data-where="from">${opts(from, false)}</select></label>
      <label class="cap">to ${u} <select data-where="to">${opts(to, true)}</select></label>
      <span class="cap">of ${n}${from === 0 && to === "" ? " · all of them" : ""}</span></div>`;
  }

  /* Lanes: what one lane's two settings look like, by what it grades. */
  const LANE_NUM = {
    amount: { min: 0, max: 1, step: 0.05, unit: "share" },
    cause: { min: 0, max: 1, step: 0.05, unit: "share" },
    chance: { min: 0, max: 1, step: 0.05, unit: "share" },
    delay: { min: 0, max: 8, step: 1, unit: "beats" },
    effect: { min: 1, max: 5, step: 1, unit: "steps" },
    blend: { min: 0, max: 1, step: 0.05, unit: "share" },
    weight: { min: 0, max: 1, step: 0.05, unit: "share" },
  };
  function laneSpec(l) {
    if (l.target.startsWith("c:")) return A().domain(l.target.slice(2));
    return Object.assign({ kind: "range" }, LANE_NUM[l.target.split(":")[0]] || { min: 0, max: 1, step: 0.05 });
  }
  function lanePicker(l, side) {
    const d = laneSpec(l);
    const val = l[side];
    if (d.kind === "range") return `<input type="number" data-lane-v="${side}" min="${d.min}" max="${d.max}" step="${d.step || 1}" value="${esc(val)}">${d.unit ? `<span class="cap">${d.unit}</span>` : ""}`;
    return `<select data-lane-v="${side}">${d.options.map((o) => `<option${String(o) === String(val) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  }
  /* The lanes a parameter starts with; any other curiosity lane was added and can be removed. */
  function defaultTargets(p) {
    if (p.level === "curiosity") return (A().FACETS[p.id] || []).map((f) => "c:" + f);
    if (p.level === "suite") return (window.CuriositySuites ? window.CuriositySuites.members(p.id) : Object.keys((SUITES.find((s) => s.id === p.id) || { set: {} }).set)).map((k) => "c:" + k);
    return [];
  }
  function laneHtml(c, p, l) {
    const lk = p.key + "#" + l.id;
    const added = l.target.startsWith("c:") && !defaultTargets(p).includes(l.target);
    const bind = A().bindings()[lk];
    const learning = c.learnFor && c.learnFor.key === lk;
    const mod = l.mod || "follow";
    return `<div class="au-lane ${l.on ? "on" : ""}" data-lane="${esc(l.id)}">
      <div class="au-lane-head">
        <label class="au-switch"><input type="checkbox" data-lane-on${l.on ? " checked" : ""}><span>${l.on ? "on" : "off"}</span></label>
        <strong>${esc(l.label)}</strong>
        <span class="au-meter au-lmeter"><i data-lmeter="${esc(lk)}"></i></span>
        ${added ? `<button type="button" class="link" data-lane-remove>Remove</button>` : ""}
      </div>
      <div class="au-lane-body">
        <div class="au-row"><label class="cap">from ${lanePicker(l, "from")}</label><label class="cap">to ${lanePicker(l, "to")}</label><label class="cap">curve ${curveSelect("data-lane-curve", l.curve)}</label></div>
        <div class="au-row"><label class="cap">moved by <select data-lane-mod>${[["follow", "follows the main lane"], ["lfo", "its own LFO"], ["manual", "a knob"], ["midi", "a MIDI control"]].map(([v, n]) => `<option value="${v}"${mod === v ? " selected" : ""}>${n}</option>`).join("")}</select></label>
          ${mod === "lfo" ? `<label class="cap">shape <select data-lane-shape>${SHAPES.map((s) => `<option${(l.shape || "sine") === s ? " selected" : ""}>${s}</option>`).join("")}</select></label><label class="cap">rate <input type="number" data-lane-rate min="0.05" max="10" step="0.05" value="${Number(l.rate) || 0.5}"> Hz</label>` : ""}
          ${mod === "manual" || mod === "midi" ? `<label class="au-knob au-lknob"><span>${mod === "midi" ? "MIDI value" : "Knob"}</span><input type="range" data-lane-manual min="0" max="1" step="0.01" value="${Number(l.manual) || 0}"></label>` : ""}
          ${mod === "midi" ? `<button type="button" data-lane-learn>${learning ? "Move a MIDI control…" : "Learn"}</button><span class="cap">${esc(bind ? bindingText(bind) : "")}</span>${bind ? `<button type="button" class="link" data-lane-unbind>Clear</button>` : ""}` : ""}
        </div>
        ${sweepHtml("data-lane-across", l.across)}
      </div>
    </div>`;
  }
  function addLaneHtml(p) {
    const have = new Set(A().lanes(p.key).map((l) => l.target));
    const cur = A().PARAMS.filter((x) => x.level === "curiosity" && !have.has("c:" + x.id) && x.id !== p.id);
    const groups = {};
    cur.forEach((x) => (groups[x.group] = groups[x.group] || []).push(x));
    return `<label class="cap au-addlane">Add a lane <select data-lane-add><option value="">pick a curiosity…</option>${Object.keys(groups)
      .sort()
      .map((g) => `<optgroup label="${esc(g)}">${groups[g].map((x) => `<option value="c:${esc(x.id)}">${esc(x.label)}</option>`).join("")}</optgroup>`)
      .join("")}</select></label>`;
  }
  function lanesHtml(c, p) {
    const lanes = A().lanes(p.key);
    const on = lanes.filter((l) => l.on).length;
    const open = c.lanesOpen != null ? c.lanesOpen : p.key in lanesOpen ? lanesOpen[p.key] : on > 0;
    return `<details class="au-lanes" data-r="lanes"${open ? " open" : ""}><summary>Lanes (${on} on)</summary>
      <p class="cap">Each lane grades one more part of this between two settings. Switch one on to make it act.</p>
      ${lanes.map((l) => laneHtml(c, p, l)).join("")}
      ${addLaneHtml(p)}
    </details>`;
  }
  function trigText(pt) {
    return `<span class="au-onoff">${pt.running ? "ON" : "OFF"}</span><small>${pt.mode === "gate" ? "hold to play" : pt.running ? "tap to turn off" : "tap to turn on"}</small>`;
  }
  function runText(pt) {
    return pt.running ? "Turn off" : "Turn on (stays on)";
  }

  /* ---------- one module card: used by the patch bay and by CuriosityAutomate.mount ---------- */
  /* A card is { host, wrap, key, compact, bay, more, lanesOpen, learnFor, self, sig, scope }.
     Every live card is in `cards`; one CurioAuto listener and one animation frame serve them all,
     and a card whose element has left the page is dropped on the next event or frame. */

  const cards = new Set();
  let hubUnsub = null;
  let hubRaf = 0;
  let keyLearner = null; // the card waiting for "Bind a key"

  /* Story workspaces (unit "scene"): who a patch plays on. Every character, some of them (patch.who),
     or one character with a patch of its own ("c:arcStage@Nessa"), so two characters can move apart. */
  function forNames(c) {
    const st = window.CuriosityStory;
    if (c.unit !== "scene" || !st || !st.characters || !A().forCharacter) return null;
    return (c.chars || st.characters()).slice();
  }
  function forHtml(c) {
    const names = forNames(c);
    if (!names) return "";
    const base = A().baseKey(c.key);
    const mine = A().whoOf(c.key);
    const shared = A().patch(base);
    const who = Array.isArray(shared.who) ? shared.who.filter((n) => names.includes(n)) : [];
    const copies = A().copies(base).filter((n) => names.includes(n));
    const on = A().running();
    const mode = mine ? "own:" + mine : who.length ? "some" : "all";
    const opt = (v, t) => `<option value="${esc(v)}"${v === mode ? " selected" : ""}>${esc(t)}</option>`;
    const ownTag = (n) => (on.includes(A().forCharacter(base, n)) ? " (its own, on)" : copies.includes(n) ? " (its own)" : "");
    const sel = `<select data-for aria-label="Which characters this plays on">${opt("all", "every character")}${opt("some", "some characters (tick them)")}<optgroup label="One character, with a patch of its own">${names
      .map((n) => opt("own:" + n, "only " + n + ownTag(n)))
      .join("")}</optgroup></select>`;
    let more = "";
    if (mode === "some")
      more = `<div class="au-for-who" role="group" aria-label="Characters it plays on">${names
        .map((n) => `<label class="au-for-chip"><input type="checkbox" data-for-who="${esc(n)}"${who.includes(n) ? " checked" : ""}> ${esc(n)}</label>`)
        .join("")}</div><p class="cap">Untick everyone and it plays on every character again.</p>`;
    if (mine)
      more = `<p class="cap">This patch is ${esc(mine)}'s own: it plays only on ${esc(mine)}, and wins over the shared one there. Its switch, key and MIDI bindings are its own too.
        <button type="button" class="link" data-for-drop>Forget ${esc(mine)}'s own patch</button></p>`;
    else if (copies.length) more += `<p class="cap">${esc(copies.join(", "))} ${copies.length > 1 ? "have patches" : "has a patch"} of their own, which win${copies.length > 1 ? "" : "s"} over this one for them.</p>`;
    return `<div class="au-row au-for"><span class="au-lab" title="Story workspaces keep values per character.">For</span>${sel}</div>${more}`;
  }

  function cardHtml(c) {
    const p = A().param(c.key);
    if (!p) return `<p class="cap">There is no automation for “${esc(c.key)}”.</p>`;
    const pt = A().patch(p.key);
    const b = A().bindings()[p.key];
    const outs = A().midi.outputs || [];
    const lf = c.learnFor;
    const star = c.bay ? `<button type="button" class="au-star ${starred(p.key) ? "on" : ""}" data-star aria-pressed="${starred(p.key)}">${starred(p.key) ? "★ On the performer pads" : "☆ Add to performer pads"}</button>` : "";
    const desc = `<p class="au-desc">${esc(describe(p))}</p>`;
    const meterRow = `<div class="au-row"><span class="au-meter au-mmeter"><i data-r="meter"></i></span><span class="mono" data-r="m">m —</span><span class="cap">0 is “from”, 1 is “to”</span></div>`;
    const mover = `<div class="au-row"><label class="cap">curve ${curveSelect("data-main-curve", pt.curve)}</label></div>
          ${sweepHtml("data-main-across", pt.across)}
          <div class="au-row">
            <span class="au-lab">Moved by</span>
            <div class="au-seg">${["lfo", "manual", "midi"].map((m) => `<button type="button" data-mod="${m}" class="${pt.mod === m ? "on" : ""}">${m === "lfo" ? "LFO" : m === "midi" ? "MIDI CC" : "Knob"}</button>`).join("")}</div>
          </div>
          ${
            pt.mod === "lfo"
              ? `<div class="au-row"><span class="au-lab">Shape</span><div class="au-seg">${SHAPES.map((s) => `<button type="button" data-shape="${s}" class="${pt.shape === s ? "on" : ""}">${s}</button>`).join("")}</div></div>
                 <div class="au-knobs">${knob("rate", "Rate Hz", 0.05, 10, 0.05, pt.rate, (v) => Number(v).toFixed(2))}${knob("depth", "Depth", 0, 1, 0.05, pt.depth, (v) => Math.round(v * 100) + "%")}</div>`
              : `<div class="au-knobs">${knob("manual", pt.mod === "midi" ? "CC value" : "Knob", 0, 1, 0.01, pt.manual, (v) => Number(v).toFixed(2))}</div>`
          }
          <canvas class="au-scope" data-r="scope" width="300" height="70"></canvas>`;
    const binds = `<div class="au-row"><span class="au-lab">Bind</span><span class="cap" data-r="bind">${esc(lf && lf.key === p.key ? (lf.what === "key" ? "Press a key…" : "Move or play a MIDI control…") : bindingText(b))}</span></div>
        <div class="bar-actions au-binds">
          <button type="button" data-learn="note">Learn switch (note)</button>
          <button type="button" data-learn="cc-manual">Learn CC → knob</button>
          <button type="button" data-learn="cc-rate">Learn CC → rate</button>
          <button type="button" data-learn="key">Bind a key</button>
          ${b ? `<button type="button" data-learn="clear">Clear</button>` : ""}
        </div>
        <div class="au-row"><span class="au-jack out"></span><span class="au-lab">MIDI out CC</span><input type="number" class="au-outcc" data-r="outcc" min="0" max="127" placeholder="off" value="${pt.outCC == null ? "" : pt.outCC}"><span class="cap">${outs.length ? "" : "connect MIDI to send"}</span></div>`;
    const ab = `<div class="au-ab">
            <div><span class="au-jack"></span><span class="au-lab">from</span>${abPicker(p, pt, "a")}</div>
            <div><span class="au-jack"></span><span class="au-lab">to</span>${abPicker(p, pt, "b")}</div>
          </div>`;
    const top = `<div class="au-title"><span class="au-level">${esc(p.level)}</span><strong>${esc(p.label)}</strong>${star}</div>
        ${c.compact ? "" : desc}
        <button type="button" class="au-trigger ${pt.running ? "on" : ""}" data-r="trig" role="switch" aria-checked="${pt.running}" aria-label="${esc(p.label)}: switch">${trigText(pt)}</button>
        <div class="au-row">
          <span class="au-lab">Switch</span>
          <div class="au-seg">${[["gate", "on while held"], ["toggle", "tap on, tap off"]].map(([m, n]) => `<button type="button" data-mode="${m}" class="${pt.mode === m ? "on" : ""}">${n}</button>`).join("")}</div>
          <span class="au-run"><button type="button" data-r="run">${runText(pt)}</button></span>
        </div>
        ${forHtml(c)}
        ${momentHtml(pt, c.unit)}`;
    const body = c.compact
      ? `${top}
        <div class="au-mainlane">
          <div class="au-lab au-mainname" data-r="mainname">${esc(mainName(p, pt))}</div>
          ${ab}
          ${meterRow}
        </div>
        <button type="button" class="link au-moretog" data-r="moretog" aria-expanded="${!!c.more}">${c.more ? "Less" : "More: curve, mover, lanes, MIDI"}</button>
        <div class="au-more" data-r="more"${c.more ? "" : " hidden"}>
          ${desc}
          <div class="au-mainlane">${mover}</div>
          ${lanesHtml(c, p)}
          ${binds}
        </div>`
      : `${top}
        <div class="au-mainlane">
          <div class="au-lab au-mainname" data-r="mainname">${esc(mainName(p, pt))}</div>
          ${ab}
          ${meterRow}
          ${mover}
        </div>
        ${lanesHtml(c, p)}
        ${binds}`;
    return `<div class="au-module ${pt.running ? "run" : ""}"><div class="au-face">${body}</div></div>`;
  }

  /* What a card shows, minus the parts that move by themselves (on/off, knob and rate values),
     so a change made elsewhere redraws the card only when its controls would look different. */
  function cardSig(c) {
    const pt = A().patch(c.key);
    const bs = A().bindings();
    const lanes = (pt.lanes || []).map((l) => Object.assign({}, l, { manual: undefined }));
    const lb = Object.keys(bs).filter((k) => k === c.key || k.startsWith(c.key + "#")).map((k) => [k, bs[k]]);
    /* A story card also shows who the shared patch is for and which characters have their own. */
    const forSig = forNames(c) ? [A().patch(A().baseKey(c.key)).who || [], A().copies(c.key), A().running().filter((k) => A().baseKey(k) === A().baseKey(c.key))] : null;
    return JSON.stringify([Object.assign({}, pt, { running: undefined, manual: undefined, rate: undefined, lanes }), lb, c.bay && starred(c.key), (A().midi.outputs || []).length, forSig]);
  }

  function renderCard(c) {
    if (!c.wrap.isConnected && c.wrap.parentNode !== c.host) return;
    c.wrap.className = "au-card" + (c.compact ? " compact" : "") + (c.bay ? " au-card-bay" : "");
    c.wrap.innerHTML = cardHtml(c);
    c.sig = A().param(c.key) ? cardSig(c) : "";
    c.stale = false;
    if (A().param(c.key)) wireCard(c);
    paintCard(c, performance.now());
  }

  /* Small updates that never redraw: the switch, the run button, the main lane's name, knob positions. */
  function liveUpdate(c) {
    const p = A().param(c.key);
    if (!p) return;
    const pt = A().patch(c.key);
    const q = (r) => c.wrap.querySelector(`[data-r="${r}"]`);
    const t = q("trig");
    if (t) {
      t.classList.toggle("on", pt.running);
      t.setAttribute("aria-checked", String(pt.running));
      t.innerHTML = trigText(pt);
    }
    const r = q("run");
    if (r) r.textContent = runText(pt);
    const mn = q("mainname");
    if (mn) mn.textContent = mainName(p, pt);
    const mod = c.wrap.querySelector(".au-module");
    if (mod) mod.classList.toggle("run", pt.running);
    const rate = c.wrap.querySelector('[data-k="rate"]');
    if (rate && document.activeElement !== rate && Math.abs(Number(rate.value) - pt.rate) > 0.01) {
      rate.value = pt.rate;
      const o = c.wrap.querySelector('[data-kv="rate"]');
      if (o) o.textContent = Number(pt.rate).toFixed(2);
    }
    const man = c.wrap.querySelector('[data-k="manual"]');
    if (man && document.activeElement !== man) {
      man.value = pt.manual;
      const o = c.wrap.querySelector('[data-kv="manual"]');
      if (o) o.textContent = Number(pt.manual).toFixed(2);
    }
    (pt.lanes || []).forEach((l) => {
      const row = c.wrap.querySelector(`[data-lane="${CSS.escape(l.id)}"] [data-lane-manual]`);
      if (row && document.activeElement !== row) row.value = Number(l.manual) || 0;
    });
    if (!pt.running) c.wrap.querySelectorAll("[data-lmeter]").forEach((i) => ((i.style.width = "0%"), i.parentNode.classList.remove("live")));
  }

  function cardVisible(c) {
    return c.wrap.isConnected && c.wrap.getClientRects().length > 0;
  }

  /* The main meter, m and the scope, drawn every frame while the card is on screen. */
  function paintCard(c, now) {
    if (!A().param(c.key)) return;
    const m = A().m(c.key);
    const buf = c.scope;
    buf.push([now, m]);
    while (buf.length && now - buf[0][0] > 4000) buf.shift();
    const mt = c.wrap.querySelector('[data-r="m"]');
    if (mt) mt.textContent = m == null ? "m — (off)" : `m ${m.toFixed(2)}`;
    const mm = c.wrap.querySelector('[data-r="meter"]');
    if (mm) mm.style.width = Math.round(Math.max(0, Math.min(1, m || 0)) * 100) + "%";
    const cv = c.wrap.querySelector('[data-r="scope"]');
    if (!cv || !cv.getClientRects().length) return;
    const g = cv.getContext("2d");
    const W = cv.width;
    const H = cv.height;
    g.fillStyle = "#1c1712";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(247,239,226,0.15)";
    g.lineWidth = 1;
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
    g.fillText("to", 4, 12);
    g.fillText("from", 4, H - 4);
  }

  function dropCard(c) {
    cards.delete(c);
    if (keyLearner === c) keyLearner = null;
    if (c.host && c.host.__auCard === c) c.host.__auCard = null;
  }
  function prune() {
    const now = performance.now();
    cards.forEach((c) => {
      if (c.wrap.isConnected) c.seen = true;
      /* A card mounted into an element not yet on the page gets two seconds to arrive. */
      else if (c.seen || now - c.born > 2000) dropCard(c);
    });
    if (!cards.size && hubUnsub) {
      const u = hubUnsub;
      hubUnsub = null;
      queueMicrotask(u); // not while CurioAuto is still walking its listener list
    }
  }

  function hubEvent(type, data) {
    prune();
    if (!cards.size) return;
    if (type === "tick") {
      cards.forEach((c) => {
        if (!cardVisible(c)) return;
        c.wrap.querySelectorAll("[data-lmeter]").forEach((i) => {
          const v = data.ms ? data.ms[i.dataset.lmeter] : null;
          i.style.width = v == null ? "0%" : Math.round(Math.max(0, Math.min(1, v)) * 100) + "%";
          i.parentNode.classList.toggle("live", v != null);
        });
      });
    } else if (type === "change") {
      cards.forEach((c) => {
        /* A story card listens to its whole family: the shared patch and every character's own. */
        const fam = forNames(c) && data && data.key && A().baseKey(data.key) === A().baseKey(c.key);
        if (data && data.key && data.key !== c.key && !fam) return;
        if (!A().param(c.key)) return;
        const sig = cardSig(c);
        if (sig !== c.sig) {
          if (c.self) c.sig = sig; // this card made the change and already shows it
          else if (c.wrap.contains(document.activeElement) && /input|select|textarea/i.test(document.activeElement.tagName)) c.stale = true; // redraw once the person leaves the field
          else renderCard(c);
        }
        liveUpdate(c);
      });
    } else if (type === "learned") {
      let done = false;
      cards.forEach((c) => {
        const lf = c.learnFor;
        if (!lf || lf.key !== data.key) return;
        if (!done) {
          done = true;
          const b = data.binding;
          if (lf.what === "lane") {
            const cut = data.key.lastIndexOf("#");
            const pk = data.key.slice(0, cut);
            const lid = data.key.slice(cut + 1);
            if (b.kind === "cc") A().setLane(pk, lid, { mod: "midi" });
          } else {
            if (b.kind === "cc" && lf.what === "cc-rate") A().bind(data.key, Object.assign({}, b, { target: "rate" }));
            if (b.kind === "cc" && lf.what === "cc-manual" && A().patch(data.key).mod === "lfo") A().set(data.key, { mod: "midi" });
          }
        }
        c.learnFor = null;
        renderCard(c);
      });
    }
  }

  function hubFrame(now) {
    hubRaf = 0;
    prune();
    if (!cards.size) return;
    cards.forEach((c) => cardVisible(c) && paintCard(c, now));
    hubRaf = requestAnimationFrame(hubFrame);
  }
  function hubStart() {
    if (!hubUnsub) hubUnsub = A().on(hubEvent);
    if (!hubRaf) hubRaf = requestAnimationFrame(hubFrame);
  }

  /* Draw one module card into host. Returns the card. */
  function mountCard(host, key, opts) {
    opts = opts || {};
    if (host.__auCard) dropCard(host.__auCard);
    const wrap = document.createElement("div");
    const c = { host, wrap, key, chars: Array.isArray(opts.characters) ? opts.characters : null, compact: !!opts.compact, bay: !!opts.bay, unit: opts.unit === "scene" ? "scene" : "panel", more: false, lanesOpen: null, learnFor: null, self: 0, sig: "", stale: false, scope: [], born: performance.now(), seen: false };
    host.innerHTML = "";
    host.appendChild(wrap);
    host.__auCard = c;
    wrap.addEventListener("focusout", () =>
      setTimeout(() => {
        if (c.stale && !wrap.contains(document.activeElement)) renderCard(c);
      }, 0)
    );
    cards.add(c);
    renderCard(c);
    hubStart();
    return c;
  }

  function wireCard(c) {
    const el = c.wrap;
    const key = c.key;
    const p = A().param(key);
    const pt = () => A().patch(key);
    /* Changes this card makes: it already shows them, so the change event does not redraw it mid-drag. */
    const own = (fn) => {
      c.self++;
      try {
        fn();
      } finally {
        c.self--;
      }
    };
    const set = (changes) => own(() => A().set(key, changes));
    const redraw = () => renderCard(c);
    const r = (name) => el.querySelector(`[data-r="${name}"]`);

    el.querySelectorAll("[data-ab]").forEach((inp) =>
      inp.addEventListener("change", () => {
        const side = inp.dataset.ab;
        if (p.level === "curiosity") set({ [side]: p.domain.kind === "range" ? Number(inp.value) : inp.value });
        else if (p.level === "suite") set({ [side]: inp.value });
        else {
          const cur = Object.assign({ on: false, within: 0 }, pt()[side]);
          if (inp.dataset.part === "on") cur.on = inp.checked;
          else cur.within = Math.max(0, Math.min(8, Number(inp.value) || 0));
          set({ [side]: cur });
        }
      })
    );
    const mt = r("moretog");
    if (mt)
      mt.addEventListener("click", () => {
        c.more = !c.more;
        const box = r("more");
        if (box) box.hidden = !c.more;
        mt.textContent = c.more ? "Less" : "More: curve, mover, lanes, MIDI";
        mt.setAttribute("aria-expanded", String(c.more));
      });
    /* Main lane curve and sweep, and the moment. */
    const mc = el.querySelector("[data-main-curve]");
    if (mc) mc.addEventListener("change", () => set({ curve: mc.value }));
    const ma = el.querySelector("[data-main-across]");
    if (ma)
      ma.addEventListener("input", () => {
        set({ across: Number(ma.value) });
        ma.nextElementSibling.textContent = Math.round(Number(ma.value) * 100) + "%";
      });
    el.querySelectorAll("[data-where]").forEach((sel) =>
      sel.addEventListener("change", () => {
        const w = Object.assign({ from: 0, to: null }, pt().where);
        if (sel.dataset.where === "from") w.from = Number(sel.value) || 0;
        else w.to = sel.value === "" ? null : Number(sel.value);
        if (w.to != null && w.to < w.from) w.to = w.from;
        set({ where: w });
        redraw();
      })
    );
    const lanesEl = r("lanes");
    if (lanesEl) lanesEl.addEventListener("toggle", () => (c.lanesOpen = lanesEl.open));
    el.querySelectorAll("[data-lane]").forEach((row) => {
      const id = row.dataset.lane;
      const lane = () => A().lanes(key).find((l) => l.id === id) || {};
      const setL = (changes, again) => {
        own(() => A().setLane(key, id, changes));
        if (again) {
          c.lanesOpen = true;
          redraw();
        }
      };
      const q = (sel) => row.querySelector(sel);
      q("[data-lane-on]").addEventListener("change", (e) => setL({ on: e.target.checked }, true));
      row.querySelectorAll("[data-lane-v]").forEach((inp) =>
        inp.addEventListener("change", () => {
          const d = laneSpec(lane());
          let v = inp.value;
          if (d.kind === "range") v = Math.max(d.min, Math.min(d.max, Number(v) || 0));
          setL({ [inp.dataset.laneV]: v });
        })
      );
      q("[data-lane-curve]").addEventListener("change", (e) => setL({ curve: e.target.value }));
      q("[data-lane-mod]").addEventListener("change", (e) => setL({ mod: e.target.value }, true));
      const sh = q("[data-lane-shape]");
      if (sh) sh.addEventListener("change", () => setL({ shape: sh.value }));
      const rt = q("[data-lane-rate]");
      if (rt) rt.addEventListener("change", () => setL({ rate: Math.max(0.05, Math.min(10, Number(rt.value) || 0.5)) }));
      const mn = q("[data-lane-manual]");
      if (mn) mn.addEventListener("input", () => setL({ manual: Number(mn.value) }));
      const ac = q("[data-lane-across]");
      ac.addEventListener("input", () => {
        setL({ across: Number(ac.value) });
        ac.nextElementSibling.textContent = Math.round(Number(ac.value) * 100) + "%";
      });
      const lr = q("[data-lane-learn]");
      if (lr)
        lr.addEventListener("click", () => {
          c.learnFor = { key: key + "#" + id, what: "lane" };
          if (A().midi.status === "off") A().connectMidi();
          A().learn(key + "#" + id);
          c.lanesOpen = true;
          redraw();
        });
      const ub = q("[data-lane-unbind]");
      if (ub) ub.addEventListener("click", () => (own(() => A().bind(key + "#" + id, null)), redraw()));
      const rm = q("[data-lane-remove]");
      if (rm) rm.addEventListener("click", () => (own(() => A().removeLane(key, id)), redraw()));
    });
    const addSel = el.querySelector("[data-lane-add]");
    if (addSel)
      addSel.addEventListener("change", () => {
        if (!addSel.value) return;
        own(() => A().addLane(key, addSel.value));
        c.lanesOpen = true;
        redraw();
      });
    el.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => (set({ mod: b.dataset.mod }), redraw())));
    el.querySelectorAll("[data-shape]").forEach((b) => b.addEventListener("click", () => (set({ shape: b.dataset.shape }), redraw())));
    el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => (set({ mode: b.dataset.mode }), redraw())));
    el.querySelectorAll("[data-k]").forEach((rg) =>
      rg.addEventListener("input", () => {
        const v = Number(rg.value);
        set({ [rg.dataset.k]: v });
        const out = el.querySelector(`[data-kv="${rg.dataset.k}"]`);
        if (out) out.textContent = rg.dataset.k === "depth" ? Math.round(v * 100) + "%" : v.toFixed(2);
      })
    );
    const star = el.querySelector("[data-star]");
    if (star)
      star.addEventListener("click", () => {
        view.stars = view.stars || [];
        if (starred(key)) view.stars = view.stars.filter((k) => k !== key);
        else view.stars.push(key);
        saveView();
        redraw();
      });
    const trig = r("trig");
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
    r("run").addEventListener("click", () => (pt().running ? A().stop(key) : A().start(key)));
    el.querySelectorAll("[data-learn]").forEach((b) =>
      b.addEventListener("click", () => {
        const what = b.dataset.learn;
        if (what === "clear") {
          c.learnFor = null;
          if (keyLearner === c) keyLearner = null;
          own(() => A().bind(key, null));
          return redraw();
        }
        c.learnFor = { key, what };
        if (what === "key") keyLearner = c;
        else {
          if (A().midi.status === "off") A().connectMidi();
          A().learn(key);
        }
        redraw();
      })
    );
    /* For: every character, some, or one character's own patch (the card then shows that patch). */
    const forSel = el.querySelector("[data-for]");
    if (forSel)
      forSel.addEventListener("change", () => {
        const base = A().baseKey(key);
        const v = forSel.value;
        const names = forNames(c) || [];
        if (keyLearner === c) keyLearner = null;
        c.learnFor = null;
        if (v.startsWith("own:")) {
          c.key = A().forCharacter(base, v.slice(4));
          A().patch(c.key); /* starts as a copy of the shared patch, switched off */
        } else {
          c.key = base;
          own0(() => A().set(base, { who: v === "some" ? names.slice() : [] }), c);
        }
        renderCard(c);
      });
    el.querySelectorAll("[data-for-who]").forEach((box) =>
      box.addEventListener("change", () => {
        const base = A().baseKey(key);
        const names = forNames(c) || [];
        const cur = (A().patch(base).who || []).filter((n) => names.includes(n));
        const next = box.checked ? cur.concat(cur.includes(box.dataset.forWho) ? [] : [box.dataset.forWho]) : cur.filter((n) => n !== box.dataset.forWho);
        own(() => A().set(base, { who: next }));
        if (!next.length) redraw();
      })
    );
    const drop = el.querySelector("[data-for-drop]");
    if (drop)
      drop.addEventListener("click", () => {
        const base = A().baseKey(key);
        const who = A().whoOf(key);
        c.key = base;
        c.learnFor = null;
        A().dropCopy(base, who);
        renderCard(c);
      });
    const oc = r("outcc");
    oc.addEventListener("change", () => set({ outCC: oc.value === "" ? null : Math.max(0, Math.min(127, Number(oc.value) || 0)) }));
  }

  /* Key binding: the next key pressed while a card's "Bind a key" is waiting. */
  window.addEventListener(
    "keydown",
    (e) => {
      const c = keyLearner;
      if (!c || !c.learnFor || c.learnFor.what !== "key") return;
      if (!cardVisible(c)) {
        if (!c.wrap.isConnected) keyLearner = null;
        return;
      }
      if (/input|select|textarea/i.test(e.target.tagName)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      keyLearner = null;
      c.learnFor = null;
      own0(() => A().bind(c.key, { kind: "key", code: e.code }), c);
      renderCard(c);
    },
    true
  );
  function own0(fn, c) {
    c.self++;
    try {
      fn();
    } finally {
      c.self--;
    }
  }

  /* ---------- body presets and controller layouts ---------- */
  /* A rig is a ready mapping from a device to modules. Each part names the body part or pad, what to do with it,
     what that changes, the module (key), an optional lane, the MIDI it listens to (bind), and the settings it
     puts on the module (set) or lane (laneSet). A "main" part binds "<key>#main" so a knob steers the main lane
     while a note on "<key>" switches the module. Worn sensors usually send MIDI CC (0 to 127, a smooth amount);
     buttons and pads send MIDI notes (on and off). The CC numbers here are a starting guess: Learn fixes them. */
  const cc = (num) => ({ kind: "cc", num });
  const note = (num) => ({ kind: "note", num });
  const RIGS = [
    {
      id: "dancer",
      kind: "body",
      name: "Dancer",
      line: "Wrists steer the camera, chest steers the feeling, ankles steer the pace.",
      wear: "Five small motion sensors (one on each wrist, one on the chest, one on each ankle) and a button at the hip.",
      parts: [
        { part: "Left wrist", how: "raise and lower the arm", does: "moves the camera from low to high", key: "c:angleHeight", bind: cc(21), set: { a: "low", b: "high", mod: "midi", manual: 0.5, mode: "toggle" } },
        { part: "Right wrist", how: "reach out, pull in", does: "moves the shot from close to wide", key: "c:angleHeight", lane: "c:shotSize", bind: cc(22), laneSet: { from: "close", to: "wide" } },
        { part: "Chest", how: "open up, curl in", does: "turns the strength of the feeling up or down", key: "c:emotionIntensity", bind: cc(23), set: { a: 0, b: 5, mod: "midi", manual: 0.4, mode: "toggle" } },
        { part: "Left ankle", how: "step faster or slower", does: "sets how fast people move in the frame", key: "c:characterSpeed", bind: cc(24), set: { a: 1, b: 5, mod: "midi", manual: 0.3, mode: "toggle" } },
        { part: "Right ankle", how: "kick or slide", does: "sets how fast the camera travels", key: "c:characterSpeed", lane: "c:moveSpeed", bind: cc(25), laneSet: { from: 1, to: 5 } },
        { part: "Hip button", how: "tap", does: "switches the shaky handheld camera on and off", key: "c:cameraCarry", bind: note(60), set: { a: "locked", b: "handheld", mod: "manual", manual: 1, mode: "toggle" }, noStart: true },
      ],
    },
    {
      id: "actor",
      kind: "body",
      name: "Actor",
      line: "Breath steers how loud the voice is, lean steers how high the camera sits.",
      wear: "A breath sensor (a stretchy band around the chest), a lean sensor on the back, a bend sensor in one glove finger, and a squeeze button in the hand.",
      parts: [
        { part: "Breath band", how: "breathe in deep or shallow", does: "makes the lines quieter or louder", key: "c:volume", bind: cc(2), set: { a: 1, b: 5, mod: "midi", manual: 0.5, mode: "toggle" } },
        { part: "Lean sensor", how: "lean back or lean in", does: "moves the camera from low (looking up at you) to high (looking down)", key: "c:angleHeight", bind: cc(26), set: { a: "low", b: "high", mod: "midi", manual: 0.5, mode: "toggle" } },
        { part: "Glove bend", how: "curl a finger", does: "makes the hand gestures smaller or bigger", key: "c:gesture", bind: cc(27), set: { a: 0, b: 5, mod: "midi", manual: 0.3, mode: "toggle" } },
        { part: "Squeeze button", how: "hold it", does: "tilts the frame crooked while you hold it", key: "c:dutch", bind: note(61), set: { a: "level", b: "tilted", mod: "manual", manual: 1, mode: "gate" }, noStart: true },
      ],
    },
    {
      id: "comedian",
      kind: "body",
      name: "Comedian",
      line: "A foot pedal holds the pause before the punchline, a pad fires the callback.",
      wear: "A foot pedal (an expression pedal you rock with your foot), two pads by the hand, and one wrist sensor.",
      parts: [
        { part: "Foot pedal", how: "press it down further", does: "holds a longer pause before the punchline (0 to 4 beats)", key: "c:comicTiming", bind: cc(11), set: { a: 0, b: 4, mod: "midi", manual: 0.25, mode: "toggle" } },
        { part: "Pad 1", how: "hit it", does: "fires the callback: an earlier joke comes back and the payoff lands", key: "c:comedyDevice", lane: "c:comicBeat", bind: note(62), set: { a: "callback", b: "callback", mod: "manual", manual: 1, mode: "toggle" }, laneSet: { from: "payoff lands", to: "payoff lands", mod: "follow" }, noStart: true },
        { part: "Pad 2", how: "hold it", does: "drops to a dead straight face (deadpan) while you hold it", key: "c:comicRegister", bind: note(63), set: { a: "deadpan", b: "deadpan", mod: "manual", manual: 1, mode: "gate" }, noStart: true },
        { part: "Wrist", how: "raise the arm", does: "lets things snowball: escalation from small to out of control", key: "c:comicEscalation", bind: cc(21), set: { a: 0, b: 5, mod: "midi", manual: 0.2, mode: "toggle" } },
      ],
    },
  ];
  /* The most used modules, for a 16-pad grid and a 25-key keyboard. Pads and keys switch them on and off;
     the eight knobs (CC 70 to 77, the usual first knobs on small controllers) steer the main lane of the first eight. */
  const MOST_USED = [
    ["c:cameraCarry", "locked", "handheld", "Handheld camera"],
    ["c:angleHeight", "low", "high", "Camera low to high"],
    ["c:shotSize", "close", "wide", "Close to wide"],
    ["c:moveSpeed", 1, 5, "Camera speed"],
    ["c:characterSpeed", 1, 5, "People speed"],
    ["c:volume", 1, 5, "Loudness"],
    ["c:emotionIntensity", 0, 5, "Strength of feeling"],
    ["c:comicTiming", 0, 4, "Pause before the punchline"],
    ["c:dutch", "level", "tilted", "Crooked frame"],
    ["c:cameraMove", null, null, "Camera move"],
    ["c:lighting", null, null, "Lighting"],
    ["c:envMotion", null, null, "The room moves"],
    ["c:characterPath", null, null, "Walking path"],
    ["c:comedyDevice", "callback", "callback", "Callback"],
    ["c:comicEscalation", 0, 5, "Escalation"],
    ["s:noir", "", "noir", "Noir look"],
    ["c:bodyEnter", "already", "enters", "Someone enters"],
    ["c:whoMoves", "speaker", "both", "Who moves"],
    ["c:temperature", "cold", "hot", "Cold to hot"],
    ["c:saturation", null, null, "Color strength"],
    ["c:wallArt", null, null, "Art on the walls"],
    ["c:cringe", 0, 5, "Cringe"],
    ["c:absurdity", 0, 5, "Absurdity"],
    ["c:comicRegister", "deadpan", "cartoon", "Deadpan to broad"],
    ["c:comicBeat", "setup planted", "payoff lands", "Setup to payoff"],
  ];
  function layoutParts(count, first) {
    const parts = [];
    MOST_USED.forEach(([key, a, b, name]) => {
      if (parts.length >= count || !A().param(key)) return;
      const n = parts.length;
      const set = { mod: "manual", manual: 1, mode: "toggle" };
      if (a != null) set.a = a;
      if (b != null) set.b = b;
      parts.push({ part: (count === 16 ? "Pad " : "Key ") + (n + 1), how: "tap", does: "switches on: " + name, name, key, bind: note(first + n), set, noStart: true, slot: n });
    });
    parts.slice(0, 8).forEach((p, i) => parts.push({ part: "Knob " + (i + 1), how: "turn", does: "steers " + p.name, name: p.name, key: p.key, main: true, bind: cc(70 + i), noStart: true, knob: i }));
    return parts;
  }
  const LAYOUTS = [
    { id: "pads16", kind: "layout", name: "16-pad grid", line: "The 16 most used modules on a 4 by 4 pad grid (notes 36 to 51), and the first eight on knobs.", wear: "A pad controller with 16 pads and up to 8 knobs. Pad 1 is at the bottom left on most pad grids.", first: 36, count: 16 },
    { id: "keys25", kind: "layout", name: "25-key keyboard", line: "The 25 most used modules on a two-octave keyboard (notes 48 to 72, middle C is key 13), and the first eight on knobs.", wear: "A small 25-key keyboard with up to 8 knobs.", first: 48, count: 25 },
  ];
  function rigParts(r) {
    return r.kind === "layout" ? layoutParts(r.count, r.first) : r.parts.filter((p) => A().param(p.key));
  }
  function rigById(id) {
    return RIGS.concat(LAYOUTS).find((r) => r.id === id);
  }
  function bindKey(p) {
    return p.lane ? p.key + "#" + p.lane : p.main ? p.key + "#main" : p.key;
  }
  const clone = (x) => JSON.parse(JSON.stringify(x));
  let rigLearn = null; // { id, i, done, skipped, waiting }
  let rigSheet = view.sheet || "";
  let rigMsg = {};

  function applyRig(id) {
    const r = rigById(id);
    if (!r) return;
    const parts = rigParts(r);
    const undo = view.rigUndo && view.rigUndo[id] ? view.rigUndo[id] : { patches: {}, binds: {}, running: [] };
    if (!(view.rigUndo && view.rigUndo[id])) {
      parts.forEach((p) => {
        if (!(p.key in undo.patches)) {
          const pt = A().patch(p.key);
          undo.patches[p.key] = clone(pt);
          if (pt.running) undo.running.push(p.key);
        }
        const bk = bindKey(p);
        if (!(bk in undo.binds)) undo.binds[bk] = A().bindings()[bk] ? clone(A().bindings()[bk]) : null;
      });
    }
    parts.forEach((p) => {
      if (p.set) A().set(p.key, clone(p.set));
      if (p.lane) {
        if (!A().lanes(p.key).some((l) => l.id === p.lane)) A().addLane(p.key, p.lane);
        A().setLane(p.key, p.lane, Object.assign({ on: true, mod: "midi", manual: 0.5, curve: "linear", across: 0 }, clone(p.laneSet || {})));
      }
      A().bind(bindKey(p), clone(p.bind));
    });
    parts.forEach((p) => !p.noStart && !A().patch(p.key).running && A().start(p.key));
    view.rigUndo = Object.assign({}, view.rigUndo, { [id]: undo });
    rigMsg[id] = `${r.name} is set up: ${parts.length} ${r.kind === "layout" ? "pads, keys and knobs" : "body parts"} are bound. Plug the device in and play; if nothing moves, press Learn each one from my device.`;
    saveView();
    /* MIDI switches on with the preset (the browser may ask first), so the device plays straight away. */
    if (!A().midi.access) A().connectMidi();
  }
  function undoRig(id) {
    const u = view.rigUndo && view.rigUndo[id];
    if (!u) return;
    if (rigLearn && rigLearn.id === id) stopLearn();
    Object.entries(u.patches).forEach(([k, pt]) => {
      A().stop(k);
      A().set(k, Object.assign(clone(pt), { running: false }));
    });
    Object.entries(u.binds).forEach(([k, b]) => A().bind(k, b));
    u.running.forEach((k) => A().start(k));
    delete view.rigUndo[id];
    rigMsg[id] = "Undone: those modules and bindings are back as they were.";
    saveView();
  }
  function stopLearn() {
    if (A().midi.learning) A().learn(null);
    rigLearn = null;
  }
  function learnStep() {
    if (!rigLearn) return;
    const parts = rigParts(rigById(rigLearn.id));
    if (rigLearn.i >= parts.length) {
      A().learn(null);
      rigMsg[rigLearn.id] = `Learned ${rigLearn.done} of ${parts.length} from your device${rigLearn.skipped ? ` (${rigLearn.skipped} skipped, they keep their guessed numbers)` : ""}.`;
      rigLearn = null;
      return;
    }
    A().learn(bindKey(parts[rigLearn.i]));
  }
  function startLearn(id) {
    if (!view.rigUndo || !view.rigUndo[id]) applyRig(id);
    rigLearn = { id, i: 0, done: 0, skipped: 0 };
    delete rigMsg[id];
    const go = () => {
      if (rigLearn && rigLearn.id === id) learnStep();
      paintRigs();
    };
    if (A().midi.access) go();
    else A().connectMidi().then(go);
  }
  function learnHtml(r) {
    if (!rigLearn || rigLearn.id !== r.id) return "";
    const parts = rigParts(r);
    const p = parts[rigLearn.i];
    if (!p) return "";
    const access = !!A().midi.access;
    const isNote = p.bind.kind === "note";
    return `<div class="au-learnstep" role="status">
      <div class="au-lab">Step ${rigLearn.i + 1} of ${parts.length}</div>
      <p><b>${esc(p.part)}</b>: ${esc(p.how)} now. ${isNote ? "Press it once." : "Move it from one end to the other."}</p>
      <p class="cap">It ${esc(p.does)}. ${access ? "Waiting for your device…" : "MIDI is not connected yet: plug the device in and use Chrome or Edge, then press Connect MIDI below."}</p>
      <div class="bar-actions"><button type="button" data-rig-skip>Skip this one</button><button type="button" data-rig-stoplearn>Stop learning</button></div>
    </div>`;
  }
  function partRow(p) {
    const b = A().bindings()[bindKey(p)];
    const via = b ? (b.kind === "note" ? `note ${b.num}` : b.kind === "cc" ? `CC ${b.num}` : "a key") : "not bound";
    return `<li><b>${esc(p.part)}</b> <span class="cap">(${esc(p.how)})</span> ${esc(p.does)} <span class="au-via">${esc(via)}</span></li>`;
  }
  function rigCardHtml(r) {
    const parts = rigParts(r);
    const on = !!(view.rigUndo && view.rigUndo[r.id]);
    const shown = r.kind === "layout" ? parts.slice(0, 4).concat(parts.filter((p) => p.knob === 0)) : parts;
    return `<div class="au-rig ${on ? "on" : ""}" data-rig="${esc(r.id)}">
      <div class="au-rig-h"><strong>${esc(r.name)}</strong>${on ? `<span class="au-lab au-rig-on">in use</span>` : ""}</div>
      <p class="au-rig-line">${esc(r.line)}</p>
      <p class="cap">${esc(r.wear)}</p>
      <ul class="au-rig-parts">${shown.map(partRow).join("")}${r.kind === "layout" ? `<li class="cap">…and ${parts.length - shown.length} more on the cheat sheet.</li>` : ""}</ul>
      <div class="bar-actions">
        <button type="button" data-rig-apply="${esc(r.id)}" class="${on ? "" : "au-rig-go"}">${on ? "Use it again" : "Use this preset"}</button>
        <button type="button" data-rig-learn="${esc(r.id)}">Learn each one from my device</button>
        ${on ? `<button type="button" data-rig-undo="${esc(r.id)}">Undo this preset</button>` : ""}
        ${r.kind === "layout" ? `<button type="button" data-rig-sheet="${esc(r.id)}">${rigSheet === r.id ? "Hide the cheat sheet" : "Cheat sheet"}</button>` : ""}
      </div>
      ${learnHtml(r)}
      ${rigMsg[r.id] ? `<p class="cap au-rig-msg">${esc(rigMsg[r.id])}</p>` : ""}
    </div>`;
  }
  function sheetHtml(id) {
    const r = rigById(id);
    if (!r || r.kind !== "layout") return "";
    const parts = rigParts(r);
    const notes = parts.filter((p) => p.knob == null);
    const knobs = parts.filter((p) => p.knob != null);
    const cell = (p) => `<div class="au-sh-cell"><span class="au-sh-n">${esc(p.part)}</span><span class="au-sh-l">${esc(p.name)}</span><span class="au-sh-b">${esc(A().bindings()[bindKey(p)] ? (A().bindings()[bindKey(p)].kind === "note" ? "note " : "CC ") + A().bindings()[bindKey(p)].num : "note " + p.bind.num)}</span></div>`;
    let body = "";
    if (r.count === 16) {
      /* Rows top to bottom: pads 13-16, 9-12, 5-8, 1-4, so pad 1 sits bottom left as on the device. */
      const rows = [];
      for (let row = 3; row >= 0; row--) rows.push(notes.slice(row * 4, row * 4 + 4));
      body = `<div class="au-sh-pads">${rows.map((row) => row.map(cell).join("")).join("")}</div>`;
    } else {
      const black = [1, 3, 6, 8, 10];
      body = `<div class="au-sh-keys" aria-hidden="true">${notes.map((p, i) => `<span class="au-sh-key ${black.includes((r.first + i) % 12) ? "blk" : ""}">${i + 1}</span>`).join("")}</div>
        <ol class="au-sh-list">${notes.map((p) => `<li><span>${esc(p.name)}</span> <span class="au-sh-b">note ${esc(p.bind.num)}</span></li>`).join("")}</ol>`;
    }
    return `<div class="au-sheet" id="au-sheet">
      <div class="au-sh-head"><strong>Cheat sheet: ${esc(r.name)}</strong><button type="button" id="au-sheet-print">Print this sheet</button></div>
      <p class="cap">Tap to switch a module on, tap again to switch it off. Knobs slide the first eight between their two settings.</p>
      ${body}
      <div class="au-lab">Knobs</div>
      <div class="au-sh-knobs">${knobs.map(cell).join("")}</div>
    </div>`;
  }
  function rigsHtml() {
    const open = view.rigsOpen != null ? view.rigsOpen : !!view.perf;
    return `<details class="au-rigs" id="au-rigs"${open ? " open" : ""}><summary>Body presets, pads and keyboards</summary>
      <p class="cap">A performer can wear small sensors (on a wrist, an ankle, the chest, a bend sensor in a glove) that send a smooth amount as MIDI CC, and press buttons or pads that send MIDI notes. A body preset binds each one to a module or a lane, in plain words below. Use one, then press Learn to teach it your own device step by step. Undo puts everything back.</p>
      <div class="g au-g">Body presets</div>
      <div class="au-rig-grid">${RIGS.map(rigCardHtml).join("")}</div>
      <div class="g au-g">Pads and keyboards</div>
      <div class="au-rig-grid">${LAYOUTS.map(rigCardHtml).join("")}</div>
      <div id="au-sheet-slot">${rigSheet ? sheetHtml(rigSheet) : ""}</div>
    </details>`;
  }
  function paintRigs() {
    const el = root && root.querySelector("#au-rigs");
    if (!el) return;
    const open = el.open;
    el.outerHTML = rigsHtml();
    const el2 = root.querySelector("#au-rigs");
    if (el2) el2.open = open;
    wireRigs();
  }
  function afterRig() {
    if (view.perf) render();
    else paintRigs();
  }
  function wireRigs() {
    const el = root.querySelector("#au-rigs");
    if (!el) return;
    el.addEventListener("toggle", () => {
      view.rigsOpen = el.open;
      saveView();
    });
    el.querySelectorAll("[data-rig-apply]").forEach((b) => b.addEventListener("click", () => (applyRig(b.dataset.rigApply), afterRig())));
    el.querySelectorAll("[data-rig-undo]").forEach((b) => b.addEventListener("click", () => (undoRig(b.dataset.rigUndo), afterRig())));
    el.querySelectorAll("[data-rig-learn]").forEach((b) => b.addEventListener("click", () => (startLearn(b.dataset.rigLearn), afterRig())));
    el.querySelectorAll("[data-rig-sheet]").forEach((b) =>
      b.addEventListener("click", () => {
        rigSheet = rigSheet === b.dataset.rigSheet ? "" : b.dataset.rigSheet;
        view.sheet = rigSheet;
        saveView();
        paintRigs();
      })
    );
    const skip = el.querySelector("[data-rig-skip]");
    if (skip)
      skip.addEventListener("click", () => {
        rigLearn.skipped++;
        rigLearn.i++;
        learnStep();
        paintRigs();
      });
    const stopL = el.querySelector("[data-rig-stoplearn]");
    if (stopL)
      stopL.addEventListener("click", () => {
        const id = rigLearn && rigLearn.id;
        stopLearn();
        if (id) rigMsg[id] = "Stopped learning. What was learned so far is kept.";
        paintRigs();
      });
    const pr = el.querySelector("#au-sheet-print");
    if (pr)
      pr.addEventListener("click", () => {
        document.body.classList.add("au-printing");
        const done = () => {
          document.body.classList.remove("au-printing");
          window.removeEventListener("afterprint", done);
        };
        window.addEventListener("afterprint", done);
        window.print();
        setTimeout(done, 1000);
      });
  }
  /* A step of Learn finished: the device's control is bound. A CC on a lane makes the lane follow MIDI. */
  function rigLearned(data) {
    if (!rigLearn) return;
    const parts = rigParts(rigById(rigLearn.id));
    const p = parts[rigLearn.i];
    if (!p || data.key !== bindKey(p)) return;
    if (p.lane && data.binding.kind === "cc") A().setLane(p.key, p.lane, { on: true, mod: "midi" });
    if (!p.lane && !p.main && data.binding.kind === "cc" && A().patch(p.key).mod === "lfo") A().set(p.key, { mod: "midi" });
    rigLearn.done++;
    rigLearn.i++;
    learnStep();
    paintRigs();
  }

  /* ---------- the patch bay (the whole Automate view) ---------- */

  function bayHtml() {
    const keys = A().running();
    if (!keys.length) return `<p class="cap">Nothing is on. Switch a module on, or pick a patch.</p>`;
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
        <li>Worn sensors, pads and keyboards plug in the same way: see Body presets, pads and keyboards at the top.</li>
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
    if (!root) return;
    root.classList.add("automate");
    if (!A()) {
      root.innerHTML = `<h2>Automate</h2><p>The automation layer (automation.js) did not load.</p>`;
      return;
    }
    const counts = Object.fromEntries(LEVELS.map(([l]) => [l, A().PARAMS.filter((p) => p.level === l).length]));
    root.innerHTML = `<h2>Automate</h2>
      <p class="cap">Every curiosity, suite, proximity and proximity suite is a module. Its switch (the big button, a MIDI note, a key) turns it on and off. Inside, lanes grade each part between two settings: an angle from low to high, a shot from close to wide. Each lane has its own curve and its own mover (an LFO, a knob, a MIDI control), and plays in the panels you choose. Modules that are on play on the board.</p>
      <div class="bar-actions au-presets"><button type="button" id="au-perf" class="au-perf-btn ${view.perf ? "on" : ""}">${view.perf ? "Back to the modules" : "Performer view"}</button><span class="au-lab">Patches</span>${PRESETS.map((p, i) => `<button type="button" data-preset="${i}">${esc(p.name)}</button>`).join("")}</div>
      ${rigsHtml()}
      <div class="g au-g">Patch bay</div>
      <div id="au-bay">${bayHtml()}</div>
      ${view.perf ? perfHtml() : `<nav class="subtabs">${LEVELS.map(([l, n]) => `<button type="button" data-level="${esc(l)}" class="${view.level === l ? "on" : ""}">${n} <span class="au-n">${counts[l]}</span></button>`).join("")}</nav>
      <div class="studio-grid au-grid">
        <div class="au-side" id="au-side">${listHtml()}</div>
        <div class="au-main">
          <div id="au-module"></div>
          <div class="g au-g">Board, live</div>
          <div class="au-panels" id="au-panels"></div>
          <div id="au-holds" class="au-holds"></div>
          ${helpHtml()}
        </div>
      </div>`}`;
    refreshModule();
    wire();
    lastPanelSig = "";
    drawPanels(null);
  }

  function refreshModule() {
    const el = root && root.querySelector("#au-module");
    if (!el) return;
    if (!A().param(view.sel)) {
      if (el.__auCard) dropCard(el.__auCard);
      el.innerHTML = `<p class="cap">Pick a parameter to open its module.</p>`;
      return;
    }
    const c = el.__auCard;
    if (c && c.key === view.sel && c.wrap.isConnected) renderCard(c);
    else mountCard(el, view.sel, { bay: true });
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
        if (pr.lanes) {
          Object.keys(pr.lanes).forEach((id) => {
            if (!A().lanes(pr.key).some((l) => l.id === id) && id.startsWith("c:")) A().addLane(pr.key, id);
          });
          A().lanes(pr.key).forEach((l) => A().setLane(pr.key, l.id, pr.lanes[l.id] ? JSON.parse(JSON.stringify(pr.lanes[l.id])) : { on: false }));
          lanesOpen[pr.key] = true;
          cards.forEach((c) => c.key === pr.key && c.bay && (c.lanesOpen = true));
        }
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
    else wireSide();
    wireRigs();
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

  /* ---------- the live board in the patch bay ---------- */

  function sideHolds(x, panels, i) {
    if (!x) return false;
    if (x.suite) {
      /* Present when at least half the suite's members match, as in automation.js. */
      return !!window.CuriositySuites && window.CuriositySuites.present(x.suite, panels[i]);
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
    const el = root && root.querySelector("#au-panels");
    const b = window.CuriosityBoard;
    if (!el || !b || !b.panel) return;
    const n = panelCount();
    if (!panels) panels = A().resolve(n).panels;
    panels = panels.slice(0, n);
    while (panels.length < n) panels.push(panels[panels.length % Math.max(1, panels.length)] || b.values());
    const sig = JSON.stringify(panels);
    if (sig === lastPanelSig) return;
    lastPanelSig = sig;
    const sc = b.scene();
    try {
      el.innerHTML = panels.map((v, i) => b.panel(sc.lines[i % sc.lines.length], i, n, v)).join("");
    } catch (e) {
      el.innerHTML = `<p class="cap">The board could not draw.</p>`;
    }
    const h = root.querySelector("#au-holds");
    if (h) h.innerHTML = holdsHtml(panels);
  }

  function frame() {
    raf = 0;
    if (!visible()) return;
    root.querySelectorAll("[data-meter]").forEach((i) => {
      const v = A().m(i.dataset.meter);
      i.style.width = Math.round((v || 0) * 100) + "%";
    });
    raf = requestAnimationFrame(frame);
  }

  function listen() {
    if (unsub) return;
    unsub = A().on((type, data) => {
      if (!root || !root.isConnected) {
        const u = unsub;
        unsub = null;
        if (u) queueMicrotask(u);
        return;
      }
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
        if (view.perf && data && data.key && !root.querySelector(`[data-pad="${CSS.escape(data.key)}"]`) && A().param(data.key) && padKeys().includes(data.key)) render();
        if (!A().running().length) {
          lastPanelSig = "";
          drawPanels(null);
        }
      } else if (type === "midi-status") {
        const s = root.querySelector("#au-midistat");
        if (s) s.textContent = data;
        if (rigLearn) paintRigs();
      } else if (type === "learned") rigLearned(data);
    });
  }

  function draw() {
    const tab = document.getElementById("automate");
    if (tab && !tab.classList.contains("hidden")) root = tab;
    else if (!root || !root.isConnected) root = tab || null;
    if (!root) return;
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
      const tab = document.getElementById("automate");
      if (b && tab && tab.classList.contains("hidden")) {
        root = tab;
        b.click();
      } else draw();
      const card = root && root.querySelector("#au-module");
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    /* One module card in any element: the switch, the moment, the main lane, lanes, MIDI learn and meters.
       compact: the main lane only, with a "More" toggle for the rest. Cards for the same key stay in sync. */
    mount(el, key, opts) {
      if (!el) return null;
      if (!A()) {
        el.innerHTML = `<p class="cap">Automation did not load.</p>`;
        return null;
      }
      /* unit "scene": the moment reads from scene / to scene (story workspaces). */
      /* characters: who the "For" control offers on a story card (default: the story's characters). */
      const c = mountCard(el, key, { compact: !!(opts && opts.compact), unit: opts && opts.unit, characters: opts && opts.characters });
      return {
        el: c.wrap,
        get key() {
          return c.key;
        },
        refresh: () => renderCard(c),
        destroy: () => {
          dropCard(c);
          c.wrap.remove();
        },
      };
    },
    /* The whole patch bay (list, presets, performer pads, live board) in any element. */
    mountFull(el) {
      if (!el) return;
      if (root && root !== el && root.isConnected && root.id !== "automate") root.innerHTML = "";
      root = el;
      draw();
    },
  };

  const css = document.createElement("style");
  css.id = "automate-style";
  css.textContent = `
.automate, .automate *, .au-card, .au-card * { box-sizing: border-box; }
.automate, .au-card { max-width: 100%; overflow-wrap: anywhere; }
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
:is(.automate, .au-card) .au-seg button { font-family: var(--mono); font-size: 10px; border: 1px solid var(--ink); background: #f7f2e9; padding: 4px 7px; margin: 0 -1px 0 0; cursor: pointer; }
:is(.automate, .au-card) .au-seg button.on { background: var(--ink); color: var(--paper); }
.au-knobs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 130px), 1fr)); gap: 8px; }
.au-knob { display: grid; gap: 2px; font-family: var(--mono); font-size: 10px; text-transform: uppercase; }
.au-knob input { width: 100%; accent-color: var(--saffron); }
.au-knob b { font-weight: 500; font-size: 12px; }
:is(.automate, .au-card) .au-trigger { width: 100%; min-height: 72px; font-family: var(--mono); font-size: 20px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: 3px solid var(--ink); border-radius: 6px; background: radial-gradient(circle at 50% 35%, #fbe3cf, #e8a77c); color: var(--ink); cursor: pointer; touch-action: none; user-select: none; transition: background 0.05s, box-shadow 0.05s; }
:is(.automate, .au-card) .au-trigger.on, :is(.automate, .au-card) .au-trigger.held { background: radial-gradient(circle at 50% 35%, #fff4d6, #ff7a2e); box-shadow: 0 0 18px #ff7a2e, inset 0 0 0 3px #fff4d6; }
.au-trigger.held { transform: translateY(1px); }
:is(.automate, .au-card) .au-star { justify-self: start; font-family: var(--mono); font-size: 11px; border: 1px solid var(--ink); background: #f7f2e9; padding: 3px 7px; cursor: pointer; margin-top: 4px; }
:is(.automate, .au-card) .au-star.on { background: var(--gold); color: white; border-color: var(--gold); }
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
.au-outcc { width: 64px; }
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
.au-trigger { display: grid; place-items: center; gap: 2px; }
.au-onoff { font-size: 26px; line-height: 1; }
.au-trigger small { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; }
.au-mainlane { display: grid; gap: 8px; border: 1px solid #b9ad9c; background: #f3ede2; padding: 8px; }
.au-mainname { font-size: 12px; color: var(--ink); text-transform: none; letter-spacing: 0.02em; }
.au-moment select, .au-lane select { max-width: 100%; }
.au-for select { max-width: 100%; min-width: 0; flex: 1 1 180px; }
.au-for-who { display: flex; flex-wrap: wrap; gap: 4px 10px; margin: 2px 0 4px; }
.au-for-chip { font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
.au-sweep { text-transform: none; }
.au-lanes { border: 1px solid #b9ad9c; background: #f7f2e9; padding: 6px 8px; }
.au-lanes summary { cursor: pointer; font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
.au-lanes > p { margin: 4px 0; }
.au-lane { border-top: 1px solid #d6cbb9; padding: 6px 0; display: grid; gap: 4px; min-width: 0; }
.au-lane:not(.on) .au-lane-body { opacity: 0.55; }
.au-lane-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.au-lane-head strong { font-weight: 600; font-size: 13px; flex: 1 1 120px; min-width: 0; }
.au-lane-body { display: grid; gap: 4px; }
.au-lane input[type="number"] { width: 64px; }
.au-lane .au-row label { display: inline-flex; gap: 4px; align-items: center; flex-wrap: wrap; min-width: 0; }
.au-lane button { font-family: var(--mono); font-size: 10px; }
.au-lknob { min-width: 120px; flex: 1 1 120px; }
.au-switch { display: inline-flex; align-items: center; gap: 4px; font-family: var(--mono); font-size: 10px; text-transform: uppercase; border: 1px solid var(--ink); padding: 2px 6px; background: white; cursor: pointer; }
.au-lane.on .au-switch { background: var(--ink); color: var(--paper); }
.au-lmeter { width: 56px; }
.au-lmeter.live { border-color: var(--saffron); }
.au-addlane { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
.au-addlane select { flex: 1 1 160px; min-width: 0; max-width: 100%; }
.au-card { min-width: 0; }
.au-card .au-module { height: 100%; }
.au-mmeter { width: 72px; }
.au-moretog { justify-self: start; font-family: var(--mono); font-size: 11px; }
.au-more { display: grid; gap: 8px; }
.au-more[hidden] { display: none; }
.au-card.compact .au-face { gap: 6px; padding: 10px 8px 8px; }
.au-card.compact .au-title strong { font-size: 16px; }
.au-card.compact .au-trigger { min-height: 48px; font-size: 14px; }
.au-card.compact .au-onoff { font-size: 18px; }
.au-card.compact .au-ab { gap: 6px; }
@media (max-width: 480px) { .au-ab { grid-template-columns: 1fr; } .au-list { max-height: 240px; } }
.au-rigs { margin: 8px 0 4px; border: 2px solid var(--ink); background: #fff8ef; padding: 6px 10px 10px; }
.au-rigs > summary { cursor: pointer; font-family: var(--mono); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.au-rig-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 10px; }
.au-rig { border: 1px solid var(--ink); background: white; padding: 8px 10px; display: grid; gap: 4px; align-content: start; min-width: 0; }
.au-rig.on { box-shadow: inset 4px 0 0 var(--saffron); }
.au-rig-h { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.au-rig-h strong { font-family: var(--serif); font-weight: 500; font-size: 18px; }
.au-rig-on { color: var(--saffron); }
.au-rig-line { margin: 0; font-size: 14px; }
.au-rig p.cap { margin: 0; }
.au-rig-parts { margin: 2px 0; padding-left: 18px; font-size: 13px; display: grid; gap: 3px; }
.au-via { font-family: var(--mono); font-size: 10px; border: 1px solid var(--line); padding: 0 4px; white-space: nowrap; }
.au-rig .bar-actions button { font-family: var(--mono); font-size: 11px; }
.automate .au-rig-go { background: var(--saffron); color: white; border-color: var(--ink); }
.au-learnstep { border: 2px dashed var(--saffron); background: #fff4d6; padding: 6px 8px; }
.au-learnstep p { margin: 2px 0; }
.au-rig-msg { color: #2f6b3a; }
.au-sheet { margin-top: 10px; border: 2px solid var(--ink); background: white; padding: 10px; display: grid; gap: 8px; }
.au-sh-head { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; }
.au-sh-head strong { font-family: var(--serif); font-weight: 500; font-size: 20px; }
.au-sh-pads, .au-sh-knobs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.au-sh-cell { border: 2px solid var(--ink); border-radius: 6px; padding: 6px; min-height: 64px; display: flex; flex-direction: column; justify-content: space-between; gap: 2px; background: #fbe3cf; min-width: 0; }
.au-sh-knobs .au-sh-cell { border-radius: 30px; background: #f3ede2; text-align: center; min-height: 52px; }
.au-sh-n, .au-sh-b { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
.au-sh-l { font-size: 13px; line-height: 1.15; }
.au-sh-keys { display: grid; grid-template-columns: repeat(25, minmax(0, 1fr)); height: 54px; border: 2px solid var(--ink); }
.au-sh-key { border-right: 1px solid var(--ink); font-family: var(--mono); font-size: 8px; display: flex; align-items: flex-end; justify-content: center; background: white; color: var(--ink); padding-bottom: 2px; }
.au-sh-key.blk { background: var(--ink); color: white; height: 62%; }
.au-sh-list { columns: 2 220px; column-gap: 18px; font-size: 13px; margin: 0; padding-left: 26px; }
.au-sh-list li { break-inside: avoid; }
@media (max-width: 480px) { .au-sh-pads, .au-sh-knobs { gap: 4px; } .au-sh-cell { padding: 4px; } .au-sh-l { font-size: 11px; } }
@media print {
  body.au-printing * { visibility: hidden !important; }
  body.au-printing .au-sheet, body.au-printing .au-sheet * { visibility: visible !important; }
  body.au-printing .au-sheet { position: absolute; left: 0; top: 0; width: 100%; border: 0; }
  body.au-printing #au-sheet-print { display: none; }
}
`;
  document.head.appendChild(css);
})();
