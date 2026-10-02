/* Chain: Sharani's six Maya areas (animation, lighting, shading, dynamics, fur, Bifrost) on one
   timeline, linked by proximities. Drop a trigger on a beat (rain starts, an impact lands, fire
   builds, the character stops, a glow turns on, the toon look, wind rises) and the rule engine
   fills the downstream lanes, each rule after its own delay in beats, with an arrow from cause to
   effect. Toggle a rule or change its delay and watch the scene change: that is the framework,
   curiosities linked by proximities. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-chain-v1";

  /* Lanes: area, then curiosities with the value they start at. Value words from library.js. */
  const LANES = [
    { area: "Place", ids: [["weather", "clear"]] },
    { area: "Camera", ids: [["cameraCarry", "smooth"]] },
    { area: "Animation", ids: [["stillness", 1], ["overshoot", "settle"], ["overlap", "none"]] },
    { area: "Lighting", ids: [["lighting", "practical"], ["colorTemp", "mixed"], ["contrast", 3], ["key", "side"], ["atmosphere", "clear"]] },
    { area: "Shading", ids: [["renderStyle", "photoreal"], ["lineWeight", "none"], ["wetness", "dry"], ["gloss", "satin"], ["glow", "none"]] },
    { area: "Dynamics", ids: [["windForce", 0], ["impacts", 0], ["clothResponse", "loose"], ["settleTime", 0]] },
    { area: "Fur", ids: [["furResponse", "the body"], ["clump", "fine"], ["furLag", 0]] },
    { area: "Bifrost", ids: [["element", null], ["growth", "steady"], ["fireLight", "no"]] },
  ];
  const ROWS = [];
  LANES.forEach((l) => l.ids.forEach(([id, v]) => ROWS.push({ id, base: v, area: l.area })));
  const BASE = {};
  ROWS.forEach((r) => (BASE[r.id] = r.base));
  const AREA_COLOR = { Place: "#5b7fa6", Camera: "#1c1712", Animation: "#c45c26", Lighting: "#b8892d", Shading: "#8a5ca8", Dynamics: "#3f8a6b", Fur: "#a0663a", Bifrost: "#c0392b" };

  /* Triggers the user drops on beats. Persistent ones carry forward; impacts last one beat. */
  const EVENTS = {
    rain: { label: "Rain starts", icon: "R", set: { weather: "rain" } },
    clear: { label: "Rain stops", icon: "C", set: { weather: "clear" } },
    wind: { label: "Wind rises", icon: "W", set: { windForce: (v) => Math.min(5, Number(v) + 2) } },
    calm: { label: "Wind drops", icon: "w", set: { windForce: 0 } },
    impact: { label: "Impact lands", icon: "I", set: { impacts: 4 } },
    fire: { label: "Fire builds", icon: "F", set: { element: "fire", growth: "building" } },
    smoke: { label: "Smoke thickens", icon: "S", set: { element: "smoke", growth: "building" } },
    stop: { label: "Character stops", icon: "X", set: { stillness: 5 } },
    move: { label: "Character moves", icon: "M", set: { stillness: 1 } },
    glow: { label: "Glow turns on", icon: "G", set: { glow: "object" } },
    toon: { label: "Toon look", icon: "T", set: { renderStyle: "toon" } },
  };
  const TRANSIENT = { impacts: 0 };

  const becomes = (pred) => (v, p) => pred(v) && !(p && pred(p));
  const num = (x) => Number(x) || 0;

  /* The cross-area proximities. within is the brief's window; delay is what the user sets.
     Each effect lands at a fraction of the delay, so "in that order" stays in order. */
  const RULES = [
    { id: "wind-lag", when: "windForce rises", then: "fur and cloth lag behind the body", from: "Dynamics", to: "Fur, Dynamics", within: 1,
      x: { curiosity: "windForce", change: "rises" }, trig: (v, p) => p && num(v.windForce) > num(p.windForce),
      fx: [{ id: "furResponse", v: "wind", at: 1 }, { id: "furLag", v: 1, at: 1 }, { id: "clothResponse", v: "flutter", at: 1 }] },
    { id: "rain-wet", when: "weather turns to rain", then: "wetness soaked, clump matted, gloss mirror", from: "Place", to: "Shading, Fur", within: 2,
      x: { curiosity: "weather", is: "rain" }, trig: becomes((v) => v.weather === "rain"),
      fx: [{ id: "wetness", v: "soaked", at: 1 }, { id: "clump", v: "matted", at: 1 }, { id: "gloss", v: "mirror", at: 1 }] },
    { id: "fire-warm", when: "fire is building", then: "colorTemp warms and contrast rises", from: "Bifrost", to: "Lighting", within: 0,
      x: { curiosity: "element", is: "fire" }, trig: becomes((v) => v.element === "fire" && v.growth === "building"),
      fx: [{ id: "colorTemp", v: "warm practical", at: 1 }, { id: "contrast", v: (c) => Math.min(6, num(c) + 2), at: 1 }, { id: "fireLight", v: "flicker", at: 1 }] },
    { id: "impact-bounce", when: "an impact lands", then: "overshoot bounces and the camera goes handheld", from: "Dynamics", to: "Animation, Camera", within: 0, span: 2,
      x: { curiosity: "impacts", change: "rises" }, trig: (v) => num(v.impacts) > 0,
      fx: [{ id: "overshoot", v: "bounce", at: 1 }, { id: "cameraCarry", v: "handheld", at: 1 }] },
    { id: "stop-settle", when: "the character stops", then: "overlap, fur lag and cloth settle, in that order", from: "Animation", to: "Animation, Fur, Dynamics", within: 2,
      x: { curiosity: "stillness", change: "rises" }, trig: becomes((v) => num(v.stillness) >= 4),
      fx: [{ id: "overlap", v: "all", at: 0 }, { id: "furLag", v: 2, at: 0.5 }, { id: "settleTime", v: 2, at: 1 }, { id: "clothResponse", v: "stiff", at: 1 }] },
    { id: "toon-flat", when: "renderStyle becomes toon", then: "lighting flattens to two bands and lineWeight rises", from: "Shading", to: "Lighting, Shading", within: 0,
      x: { curiosity: "renderStyle", is: "toon" }, trig: becomes((v) => v.renderStyle === "toon"),
      fx: [{ id: "lighting", v: "flat", at: 1 }, { id: "contrast", v: 2, at: 1 }, { id: "lineWeight", v: "heavy", at: 1 }] },
    { id: "glow-key", when: "a glow turns on", then: "it becomes the key", from: "Shading", to: "Lighting", within: 0,
      x: { curiosity: "glow", is: "object" }, trig: becomes((v) => v.glow && v.glow !== "none"),
      fx: [{ id: "key", v: "front", at: 1 }] },
    { id: "smoke-contrast", when: "smoke thickens", then: "contrast falls", from: "Bifrost", to: "Lighting", within: 1,
      x: { curiosity: "element", is: "smoke" }, trig: becomes((v) => v.element === "smoke" && v.growth === "building"),
      fx: [{ id: "contrast", v: (c) => Math.max(0, num(c) - 2), at: 1 }, { id: "atmosphere", v: "haze", at: 1 }] },
    { id: "wet-clump", when: "wetness is soaked", then: "clumping goes matted", from: "Shading", to: "Fur", within: 1,
      x: { curiosity: "wetness", is: "soaked" }, trig: becomes((v) => v.wetness === "soaked"),
      fx: [{ id: "clump", v: "matted", at: 1 }] },
  ];

  /* Suites from model.js these areas make, as presets of triggers. */
  const PRESETS = [
    { id: "wet-night", label: "Wet night", events: [[1, "rain"], [3, "glow"]] },
    { id: "storm", label: "Storm", events: [[1, "wind"], [3, "wind"], [4, "rain"], [7, "impact"]] },
    { id: "hearth", label: "Hearth", events: [[1, "fire"], [5, "stop"]] },
    { id: "comic-ink", label: "Comic ink", events: [[0, "toon"], [4, "impact"]] },
    { id: "brawl", label: "Brawl", events: [[2, "impact"], [3, "impact"], [5, "impact"], [8, "stop"]] },
    { id: "noir", label: "Noir", events: [[0, "smoke"], [2, "rain"], [6, "stop"]] },
  ];

  const DEFAULTS = { beats: 12, events: [[1, "rain"], [3, "wind"], [5, "impact"], [7, "fire"], [9, "stop"]], rules: {}, palette: "rain", head: 0, preset: "" };
  let timer = null;
  let autoOff = null;
  let resume = false;
  /* Catalog proximities (model.js) that match a Chain rule, for automation. */
  const PROX_RULE = { "rain-wet": "rain-wet", "toon-line": "toon-flat", "impact-shake": "impact-bounce" };

  function ruleCfg(s, r) {
    const c = s.rules[r.id] || {};
    return { on: c.on !== false, delay: c.delay == null ? r.within : Number(c.delay) };
  }

  /* The engine: walk the beats, carry values forward, apply triggers, then rules, and record
     every cause-and-effect link for the arrows. Zero-delay rules can chain within one beat. */
  function run(s) {
    const n = s.beats;
    const vals = [];
    const by = []; // by[b][id] = rule id that set it
    const pending = {}; // beat -> [{id, v, rule, from}]
    const links = [];
    const fired = [];
    for (let b = 0; b < n; b++) {
      const prev = b ? vals[b - 1] : null;
      const v = Object.assign({}, prev || BASE);
      Object.keys(TRANSIENT).forEach((id) => {
        if (prev) v[id] = TRANSIENT[id];
      });
      by[b] = {};
      s.events.filter(([eb]) => eb === b).forEach(([, type]) => {
        const e = EVENTS[type];
        if (!e) return;
        Object.entries(e.set).forEach(([id, x]) => {
          v[id] = typeof x === "function" ? x(v[id]) : x;
          by[b][id] = "event:" + type;
        });
      });
      const apply = (list) =>
        (list || []).forEach((p) => {
          v[p.id] = typeof p.v === "function" ? p.v(v[p.id]) : p.v;
          by[b][p.id] = p.rule;
          if (p.from) links.push({ from: p.from, to: { b, id: p.id }, rule: p.rule });
        });
      apply(pending[b]);
      const done = new Set();
      for (let pass = 0; pass < 4; pass++) {
        let any = false;
        RULES.forEach((r) => {
          const cfg = ruleCfg(s, r);
          if (!cfg.on || done.has(r.id) || !r.trig(v, prev)) return;
          done.add(r.id);
          any = true;
          fired.push({ rule: r.id, b });
          const causeId = r.x.curiosity;
          r.fx.forEach((f) => {
            const at = b + Math.round(cfg.delay * f.at);
            const item = { id: f.id, v: f.v, rule: r.id, from: { b, id: causeId } };
            if (at === b) apply([item]);
            else (pending[at] = pending[at] || []).push(item);
            if (r.span) {
              const back = at + r.span;
              (pending[back] = pending[back] || []).push({ id: f.id, v: BASE[f.id], rule: r.id + " ends" });
            }
          });
        });
        if (!any) break;
      }
      vals.push(v);
    }
    return { vals, by, links, fired };
  }

  /* Holds or not: for each beat where the cause starts, every effect shows within the window. */
  function holds(r, vals) {
    let triggers = 0, ok = 0;
    vals.forEach((v, b) => {
      const p = b ? vals[b - 1] : null;
      if (!r.trig(v, p)) return;
      triggers++;
      const good = r.fx.every((f) => {
        for (let k = b; k <= Math.min(vals.length - 1, b + r.within); k++) {
          if (typeof f.v === "function") {
            const before = b ? vals[b - 1][f.id] : BASE[f.id];
            if (vals[k][f.id] !== before) return true;
          } else if (String(vals[k][f.id]) === String(f.v)) return true;
        }
        return false;
      });
      if (good) ok++;
    });
    return { triggers, ok };
  }

  /* Model proximities whose x and y are both lanes here (rain-wet, toon-line). */
  function modelHolds(vals) {
    const have = new Set(ROWS.map((r) => r.id));
    return PROXIMITIES.filter((p) => p.x && p.y && p.x.is != null && p.y.is != null && have.has(p.x.curiosity) && have.has(p.y.curiosity)).map((p) => {
      let triggers = 0, ok = 0;
      vals.forEach((v, b) => {
        const was = b && String(vals[b - 1][p.x.curiosity]) === String(p.x.is);
        if (String(v[p.x.curiosity]) !== String(p.x.is) || was) return;
        triggers++;
        for (let k = b; k <= Math.min(vals.length - 1, b + p.within); k++)
          if (String(vals[k][p.y.curiosity]) === String(p.y.is)) {
            ok++;
            break;
          }
      });
      return { p, triggers, ok };
    });
  }

  /* The live board ids, derived from the lanes. Exact catalog.js words. */
  function boardOf(v) {
    return {
      cameraCarry: v.cameraCarry,
      lighting: v.lighting === "flat" ? "flat" : v.atmosphere === "haze" || num(v.contrast) >= 5 ? "hard" : v.weather === "rain" ? "dusk" : "practical",
      temperature: v.element === "fire" && v.growth === "building" ? "hot" : v.weather === "rain" || num(v.windForce) >= 4 ? "cold" : "mild",
      envMotion: v.weather === "rain" ? "water" : num(v.windForce) >= 2 ? "wind" : "still",
    };
  }

  function short(v) {
    if (v == null) return "·";
    const s = String(v);
    return s.length > 7 ? s.slice(0, 6) + "…" : s;
  }

  function gridSvg(s, res, esc) {
    const LW = 96, CW = 46, RH = 18, TOP = 26;
    const n = s.beats;
    const W = LW + CW * n + 6;
    const rowY = {};
    let y = TOP;
    const parts = [];
    /* Event row */
    parts.push(`<text x="4" y="${TOP - 10}" font-size="10" font-weight="700">Triggers</text>`);
    for (let b = 0; b < n; b++) {
      const x = LW + b * CW;
      const ev = s.events.filter(([eb]) => eb === b).map(([, t]) => EVENTS[t]).filter(Boolean);
      parts.push(`<rect data-beat="${b}" class="ch-ev" x="${x + 1}" y="2" width="${CW - 2}" height="${TOP - 6}" fill="${ev.length ? "#c45c26" : "#fffaf2"}" stroke="rgba(28,23,18,0.25)"><title>${esc(ev.map((e) => e.label).join(", ") || "Click to drop " + EVENTS[s.palette].label)}</title></rect>`);
      parts.push(`<text x="${x + CW / 2}" y="${TOP - 10}" font-size="10" text-anchor="middle" fill="${ev.length ? "#fff" : "#999"}" pointer-events="none">${esc(ev.map((e) => e.icon).join("") || b + 1)}</text>`);
    }
    LANES.forEach((lane) => {
      parts.push(`<rect x="0" y="${y}" width="${W}" height="2" fill="${AREA_COLOR[lane.area]}"/><text x="4" y="${y + 13}" font-size="10" font-weight="700" fill="${AREA_COLOR[lane.area]}">${esc(lane.area.toUpperCase())}</text>`);
      y += 16;
      lane.ids.forEach(([id]) => {
        rowY[id] = y;
        parts.push(`<text x="8" y="${y + 12}" font-size="10">${esc(id)}</text>`);
        for (let b = 0; b < n; b++) {
          const v = res.vals[b][id];
          const prev = b ? res.vals[b - 1][id] : BASE[id];
          const src = res.by[b][id];
          const changed = String(v) !== String(prev);
          const fill = src && src.startsWith("event:") ? "rgba(196,92,38,0.25)" : src ? "rgba(184,137,45,0.3)" : changed ? "rgba(28,23,18,0.08)" : "#fffaf2";
          parts.push(`<rect x="${LW + b * CW + 1}" y="${y + 1}" width="${CW - 2}" height="${RH - 2}" fill="${fill}" stroke="rgba(28,23,18,0.1)"><title>${esc(id)} at beat ${b + 1}: ${esc(v == null ? "none" : v)}${src ? " (" + esc(src) + ")" : ""}</title></rect>`);
          parts.push(`<text x="${LW + b * CW + CW / 2}" y="${y + 12}" font-size="9" text-anchor="middle" fill="${changed || b === 0 ? "#1c1712" : "rgba(28,23,18,0.35)"}" pointer-events="none">${esc(short(v))}</text>`);
        }
        y += RH;
      });
      y += 4;
    });
    /* Arrows from cause to effect */
    res.links.forEach((l) => {
      const x1 = LW + l.from.b * CW + CW / 2, y1 = rowY[l.from.id] + RH / 2;
      const x2 = LW + l.to.b * CW + CW / 2, y2 = rowY[l.to.id] + RH / 2;
      if (y1 == null || y2 == null || isNaN(y1) || isNaN(y2)) return;
      const bend = x1 === x2 ? 18 : 0;
      parts.push(`<path d="M${x1},${y1} C${x1 + bend + (x2 - x1) / 2},${y1} ${x2 + bend - (x2 - x1) / 2},${y2} ${x2},${y2 + (y2 > y1 ? -6 : 6)}" fill="none" stroke="#c45c26" stroke-opacity="0.7" stroke-width="1.3" marker-end="url(#ch-arrow)"><title>${esc(l.rule)}</title></path>`);
    });
    const hx = LW + s.head * CW;
    parts.push(`<rect id="ch-head" x="${hx}" y="0" width="${CW}" height="${y}" fill="none" stroke="#1c1712" stroke-width="2"/>`);
    return `<svg class="ch-grid" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}" role="img" aria-label="Chain timeline"><defs><marker id="ch-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#c45c26"/></marker></defs>${parts.join("")}</svg>`;
  }

  function draw(el, api) {
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign({}, DEFAULTS, st.get({}));
    s.rules = Object.assign({}, s.rules);
    s.events = (s.events || []).filter(([b, t]) => b < s.beats && EVENTS[t]);
    if (s.head >= s.beats) s.head = 0;
    if (timer) clearTimeout(timer);
    timer = null;
    if (!document.getElementById("studio-chain")) {
      const style = document.createElement("style");
      style.id = "studio-chain";
      style.textContent = `
        .ch-wrap { overflow-x: auto; max-width: 100%; border: 1px solid var(--line, #ddd); background: #fffaf2; }
        .ch-grid { display: block; font-family: var(--mono, monospace); }
        .ch-ev { cursor: pointer; }
        .ch-rules td { font-size: 12px; vertical-align: top; }
        .ch-rules input[type=number] { width: 3.5em; }
        .ch-panel figure { margin: 0; max-width: 320px; }
        .ch-hold { font-size: 12px; margin: 2px 0; }
        .ch-hold b.yes { color: #3f8a6b; } .ch-hold b.no { color: #c0392b; } .ch-hold b.idle { color: #888; }
        .ch-presets { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
        .ch-presets button.on { background: var(--ink, #1c1712); color: var(--paper, #f7efe2); }
        .ch-out { width: 100%; height: 120px; font-family: var(--mono, monospace); font-size: 11px; }
      `;
      document.head.appendChild(style);
    }
    const res = run(s);
    const save = () => st.set(s);
    const redraw = () => {
      save();
      draw(el, api);
    };
    const cur = res.vals[s.head];
    const liveIds = new Set((typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []).filter((c) => c.live).map((c) => c.id));
    const ruleHolds = RULES.map((r) => ({ r, cfg: ruleCfg(s, r), h: holds(r, res.vals) }));
    const mh = modelHolds(res.vals);
    const holdLine = (label, h, extra) =>
      `<p class="ch-hold"><b class="${!h.triggers ? "idle" : h.ok === h.triggers ? "yes" : "no"}">${!h.triggers ? "not triggered" : h.ok === h.triggers ? "holds" : "doesn't hold"}</b> ${esc(label)} <span class="cap">${h.triggers ? `${h.ok}/${h.triggers}` : ""}${extra ? " · " + esc(extra) : ""}</span></p>`;
    const firingSuites = SUITES.filter((su) => {
      const keys = Object.keys(su.set);
      return keys.every((k) => cur[k] !== undefined && String(cur[k]) === String(su.set[k]));
    });

    el.innerHTML = `
      <div class="ch-presets"><span class="cap">Suite presets:</span>${PRESETS.map((p) => `<button type="button" data-preset="${p.id}" class="${s.preset === p.id ? "on" : ""}">${esc(p.label)}</button>`).join("")}<button type="button" data-act="clear">Clear triggers</button></div>
      <div class="bar-actions">
        <label class="field">Trigger to drop<select id="ch-palette">${Object.entries(EVENTS).map(([k, e]) => `<option value="${k}" ${s.palette === k ? "selected" : ""}>${esc(e.icon + " · " + e.label)}</option>`).join("")}</select></label>
        <label class="field">Beats: ${s.beats}<input type="range" min="8" max="16" id="ch-beats" value="${s.beats}"></label>
      </div>
      <p class="cap">Click a beat in the Triggers row to drop the chosen trigger, click again to remove it. Orange cells were set by a trigger, gold cells by a rule; arrows run from cause to effect.</p>
      <div class="ch-wrap">${gridSvg(s, res, esc)}</div>
      <div class="bar-actions" style="margin:8px 0">
        <button type="button" data-act="prev">&lt;</button>
        <button type="button" data-act="play">Play</button>
        <button type="button" data-act="next">&gt;</button>
        <span class="mono">beat ${s.head + 1}/${s.beats}</span>
        <button type="button" data-act="shelf">Keep on Shelf</button>
        <button type="button" data-act="board">Send to board</button>
        <button type="button" data-act="export">Export suite + proximities</button>
      </div>
      <div class="studio-grid">
        <div>
          <div class="ch-panel" id="ch-panel"></div>
          <p id="ch-chips"></p>
          <p class="cap">Click a chip to automate it, or open Automate.</p>
          ${firingSuites.length ? `<p>${firingSuites.map((su) => `<span class="chip lit">${esc(su.label)}</span>`).join(" ")}</p>` : ""}
        </div>
        <div>
          <h3>Proximities</h3>
          <table class="trace ch-rules"><thead><tr><th>On</th><th>When … then …</th><th>Delay</th></tr></thead><tbody>
            ${ruleHolds.map(({ r, cfg }) => `<tr><td><input type="checkbox" data-rule="${r.id}" ${cfg.on ? "checked" : ""}> <span class="chip lit" data-autorule="${r.id}" hidden>automated</span></td><td>When ${esc(r.when)} <span class="cap">(${esc(r.from)})</span>, ${esc(r.then)} <span class="cap">(${esc(r.to)})</span>, within ${r.within}</td><td><input type="number" min="0" max="6" data-delay="${r.id}" value="${cfg.delay}"></td></tr>`).join("")}
          </tbody></table>
          <h3>Holds over the timeline</h3>
          ${ruleHolds.map(({ r, cfg, h }) => holdLine(`When ${r.when}, ${r.then} within ${r.within}`, h, cfg.on ? `delay ${cfg.delay}` : "rule off")).join("")}
          ${mh.map((m) => holdLine(`Catalog: when ${m.p.when}, ${m.p.then} within ${m.p.within}`, m)).join("")}
          <textarea class="ch-out" id="ch-out" readonly hidden></textarea>
        </div>
      </div>`;
    function showBeat() {
      const v = res.vals[s.head];
      const scene = api.board ? api.board.scene() : null;
      const panel = el.querySelector("#ch-panel");
      if (scene && api.board && panel) {
        const line = scene.lines[s.head % scene.lines.length];
        panel.innerHTML = api.board.panel(line, s.head, s.beats, boardOf(v));
      }
      const bo = boardOf(v);
      el.querySelector("#ch-chips").innerHTML =
        ROWS.filter((r) => v[r.id] != null)
          .map((r) => `<span class="chip${liveIds.has(r.id) ? " lit" : ""}" title="${esc(r.area)}">${esc(r.id)} ${esc(v[r.id])}</span>`)
          .join(" ") +
        " " +
        Object.entries(bo)
          .filter(([id]) => !ROWS.some((r) => r.id === id))
          .map(([id, x]) => `<span class="chip lit" title="Derived for the board">${esc(id)} ${esc(x)}</span>`)
          .join(" ");
      const head = el.querySelector("#ch-head");
      if (head) head.setAttribute("x", 96 + s.head * 46);
      const lab = el.querySelector(".mono");
      if (lab) lab.textContent = `beat ${s.head + 1}/${s.beats}`;
    }
    showBeat();

    /* Automation: running proximities switch rules and set delays; running curiosities drop
       triggers at the playhead, so a performer can drop rain or an impact with a MIDI note. */
    if (autoOff) autoOff();
    autoOff = null;
    const A = window.CurioAuto;
    const prevVal = {};
    if (A && A.on) {
      autoOff = A.on((type, d) => {
        if (!el.isConnected || !el.querySelector("#ch-panel")) {
          if (autoOff) autoOff();
          autoOff = null;
          return;
        }
        if (type !== "tick" || !d || !d.ms) return;
        const want = {};
        Object.entries(PROX_RULE).forEach(([pid, rid]) => {
          const m = d.ms["p:" + pid];
          if (m == null) return;
          const p = A.patch("p:" + pid);
          const x = (m < 0.5 ? p.a : p.b) || {};
          const r = RULES.find((y) => y.id === rid);
          want[rid] = { on: !!x.on, delay: Math.max(0, Math.min(6, Number(x.within != null ? x.within : r.within) || 0)) };
        });
        (A.PROXIMITY_SUITES || []).forEach((ps) => {
          const m = d.ms["ps:" + ps.id];
          if (m == null) return;
          const p = A.patch("ps:" + ps.id);
          const x = (m < 0.5 ? p.a : p.b) || {};
          ps.members.forEach((pid) => {
            const rid = PROX_RULE[pid];
            if (!rid || want[rid]) return;
            const r = RULES.find((y) => y.id === rid);
            want[rid] = { on: !!x.on, delay: Math.max(0, Math.min(6, r.within + (Number(x.within) || 0))) };
          });
        });
        el.querySelectorAll("[data-autorule]").forEach((b) => (b.hidden = !want[b.dataset.autorule]));
        let changed = false;
        Object.entries(want).forEach(([rid, w]) => {
          const r = RULES.find((y) => y.id === rid);
          const cur = ruleCfg(s, r);
          if (cur.on !== w.on || cur.delay !== w.delay) {
            s.rules[rid] = Object.assign({}, s.rules[rid], w);
            changed = true;
          }
        });
        /* Curiosities drop triggers at the playhead beat when they change. */
        const v0 = (d.panels && d.panels[0]) || {};
        const drops = [];
        const watch = (id, fn) => {
          if (d.ms["c:" + id] == null) {
            delete prevVal[id];
            return;
          }
          const v = v0[id];
          if (id in prevVal && String(prevVal[id]) !== String(v)) {
            const ev = fn(v, prevVal[id]);
            if (ev) drops.push(ev);
          }
          prevVal[id] = v;
        };
        watch("weather", (v) => (v === "rain" ? "rain" : v === "clear" ? "clear" : null));
        watch("impacts", (v, p) => (num(v) > num(p) ? "impact" : null));
        watch("windForce", (v, p) => (num(v) > num(p) ? "wind" : num(v) === 0 ? "calm" : null));
        watch("renderStyle", (v) => (v === "toon" ? "toon" : null));
        watch("element", (v) => (v === "fire" ? "fire" : v === "smoke" ? "smoke" : null));
        watch("stillness", (v, p) => (num(v) >= 4 && num(p) < 4 ? "stop" : num(v) < 4 && num(p) >= 4 ? "move" : null));
        watch("glow", (v) => (v && v !== "none" ? "glow" : null));
        drops.forEach((t) => {
          if (!s.events.some(([b, x]) => b === s.head && x === t)) {
            s.events.push([s.head, t]);
            changed = true;
          }
        });
        if (changed) {
          s.preset = "";
          if (autoOff) autoOff();
          autoOff = null;
          resume = !!timer;
          if (timer) clearTimeout(timer);
          timer = null;
          redraw();
        }
      });
    }

    el.querySelectorAll(".ch-ev").forEach((r) =>
      r.addEventListener("click", () => {
        const b = Number(r.getAttribute("data-beat"));
        const at = s.events.findIndex(([eb, t]) => eb === b && t === s.palette);
        const any = s.events.some(([eb]) => eb === b);
        if (at >= 0) s.events.splice(at, 1);
        else if (any && !s.events.some(([eb, t]) => eb === b && t === s.palette)) s.events = s.events.filter(([eb]) => eb !== b).concat([[b, s.palette]]);
        else s.events.push([b, s.palette]);
        s.preset = "";
        s.head = b;
        redraw();
      })
    );
    el.querySelector("#ch-palette").addEventListener("change", (e) => {
      s.palette = e.target.value;
      save();
    });
    el.querySelector("#ch-beats").addEventListener("change", (e) => {
      s.beats = Number(e.target.value);
      redraw();
    });
    el.querySelectorAll("[data-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = PRESETS.find((x) => x.id === b.dataset.preset);
        s.events = p.events.map((e) => e.slice());
        s.preset = p.id;
        s.head = 0;
        redraw();
      })
    );
    el.querySelectorAll("[data-rule]").forEach((x) =>
      x.addEventListener("change", () => {
        s.rules[x.dataset.rule] = Object.assign({}, s.rules[x.dataset.rule], { on: x.checked });
        redraw();
      })
    );
    el.querySelectorAll("[data-delay]").forEach((x) =>
      x.addEventListener("change", () => {
        s.rules[x.dataset.delay] = Object.assign({}, s.rules[x.dataset.delay], { delay: Math.max(0, Math.min(6, Number(x.value) || 0)) });
        redraw();
      })
    );
    const act = (name, fn) => {
      const b = el.querySelector(`[data-act="${name}"]`);
      if (b) b.addEventListener("click", fn);
    };
    act("clear", () => {
      s.events = [];
      s.preset = "";
      redraw();
    });
    act("prev", () => {
      s.head = (s.head + s.beats - 1) % s.beats;
      save();
      showBeat();
    });
    act("next", () => {
      s.head = (s.head + 1) % s.beats;
      save();
      showBeat();
    });
    const playBtn = el.querySelector('[data-act="play"]');
    function step() {
      if (!el.isConnected || !playBtn.isConnected) {
        timer = null;
        return;
      }
      s.head = (s.head + 1) % s.beats;
      showBeat();
      if (s.head === s.beats - 1) {
        playBtn.textContent = "Play";
        save();
        timer = null;
        return;
      }
      timer = setTimeout(() => requestAnimationFrame(step), 700);
    }
    act("play", () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        playBtn.textContent = "Play";
        save();
        return;
      }
      s.head = s.beats - 1;
      playBtn.textContent = "Pause";
      requestAnimationFrame(step);
    });
    /* Keep playing through a redraw caused by automation. */
    if (resume) {
      resume = false;
      playBtn.textContent = "Pause";
      timer = setTimeout(() => requestAnimationFrame(step), 700);
    }
    act("shelf", () => {
      const out = {};
      ROWS.forEach((r) => (out[r.id] = res.vals.map((v) => v[r.id])));
      ["temperature", "envMotion"].forEach((id) => (out[id] = res.vals.map((v) => boardOf(v)[id])));
      if (api.toShelf) api.toShelf("Chain · " + (PRESETS.find((p) => p.id === s.preset) || { label: "six areas" }).label, out);
    });
    act("board", () => {
      const idx = [0, 1, 2, 3].map((i) => Math.round((i * (s.beats - 1)) / 3));
      const out = {};
      ["cameraCarry", "lighting", "temperature", "envMotion"].forEach((id) => {
        if (liveIds.has(id)) out[id] = idx.map((b) => boardOf(res.vals[b])[id]);
      });
      api.toBoard("Chain · beats " + idx.map((b) => b + 1).join(", "), out);
    });
    act("export", () => {
      const last = res.vals[res.vals.length - 1];
      const set = {};
      ROWS.forEach((r) => {
        if (last[r.id] != null && String(last[r.id]) !== String(BASE[r.id])) set[r.id] = last[r.id];
      });
      const name = (PRESETS.find((p) => p.id === s.preset) || { label: "Six areas" }).label;
      const data = {
        suite: { id: "chain-" + name.toLowerCase().replace(/\s+/g, "-"), label: name + " chain", note: "Built in the Chain studio from triggers on " + s.beats + " beats.", set },
        proximities: RULES.filter((r) => ruleCfg(s, r).on).map((r) => ({
          id: "chain-" + r.id,
          when: r.when,
          then: r.then,
          within: ruleCfg(s, r).delay,
          x: r.x,
          y: (() => {
            const f = r.fx[r.fx.length - 1];
            return typeof f.v === "function" ? { curiosity: f.id, change: r.id === "smoke-contrast" ? "drops" : "rises" } : { curiosity: f.id, is: f.v };
          })(),
        })),
        triggers: s.events.map(([b, t]) => ({ beat: b + 1, trigger: EVENTS[t].label })),
      };
      const text = JSON.stringify(data, null, 2);
      const out = el.querySelector("#ch-out");
      out.hidden = false;
      out.value = text;
      try {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
        a.download = data.suite.id + ".json";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {}
    });
  }

  window.CuriosityStudio.register({ id: "chain", label: "Chain", order: 58, maya: "Sharani's six areas linked: animation, lighting, shading, dynamics, fur, Bifrost", draw });
})();
