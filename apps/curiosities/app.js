/* Suites, measured by degree. A curiosity is a lens: one way to look at a scene. A suite is a group of
   lenses you look through together, so a beat matches it by degree, the share of its members whose value
   is on (0 to 100%), never all-or-nothing. A suite with no fixed values (a lens suite, set {}) is only a
   named group of lenses: show its members' values side by side instead of a match.
   window.CuriositySuites is shared by the Board, Study, the Prism, automation and the workspaces. */
(function () {
  /* A suite as a proximity's cause counts as present when at least this share of its members match.
     Half: most of the look is there, even if a lens or two differs. */
  const SUITE_CAUSE_SHARE = 0.5;

  const list = () => (typeof SUITES !== "undefined" ? SUITES : []);
  /* Lens suites come from lenses.js, which may load before or after this file: pick them up whenever asked. */
  function sync() {
    const extra = window.CURIOSITY_LENS_SUITES;
    if (!Array.isArray(extra) || typeof SUITES === "undefined") return list();
    extra.forEach((s) => {
      if (!s || !s.id) return;
      const have = SUITES.find((x) => x.id === s.id);
      if (have) {
        if (!have.kind) have.kind = "lens";
        if (!have.set) have.set = {};
        return;
      }
      SUITES.push(Object.assign({}, s, { kind: "lens", set: s.set || {} }));
    });
    return SUITES;
  }
  sync();
  function find(s) {
    return typeof s === "string" ? list().find((x) => x.id === s) || null : s || null;
  }
  /* Does the suite name values to look for? A lens suite does not. */
  function fixed(s) {
    s = find(s);
    return !!s && !!s.set && Object.keys(s.set).length > 0;
  }
  /* Its members: the curiosities with fixed values, or the lenses of a lens suite. */
  function members(s) {
    s = find(s);
    if (!s) return [];
    return fixed(s) ? Object.keys(s.set) : (s.lenses || []).slice();
  }
  function same(a, b) {
    return a != null && b != null && a !== "" && String(a) === String(b);
  }
  /* How much of a suite one set of values shows: {on: [ids that match], total, share 0 to 1}. null for a lens suite. */
  function match(s, values) {
    s = find(s);
    if (!fixed(s)) return null;
    values = values || {};
    const ids = Object.keys(s.set);
    const on = ids.filter((id) => same(values[id], s.set[id]));
    return { on, total: ids.length, share: ids.length ? on.length / ids.length : 0 };
  }
  /* Across many beats or panels: the average share, the best beat, and the share at each one. */
  function across(s, list_) {
    s = find(s);
    if (!fixed(s)) return null;
    const each = (list_ || []).map((v) => match(s, v));
    const shares = each.map((m) => m.share);
    let best = -1;
    shares.forEach((x, i) => (best < 0 || x > shares[best]) && (best = i));
    const mean = shares.length ? shares.reduce((a, b) => a + b, 0) / shares.length : 0;
    const total = Object.keys(s.set).length;
    return { shares, each, mean, best, peak: best >= 0 ? shares[best] : 0, total, on: Math.round(mean * total) };
  }
  /* A suite cause is present at a beat when at least half its members match. */
  function present(s, values) {
    const m = match(s, values);
    return !!m && m.total > 0 && m.share >= SUITE_CAUSE_SHARE;
  }
  const pct = (x) => Math.round((Number(x) || 0) * 100) + "%";
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const word = (n) => (n === 1 ? "lens" : "lenses");
  /* "3 of 5 lenses, 60%" */
  function text(m) {
    if (!m) return "";
    const on = m.on && m.on.length != null ? m.on.length : m.on;
    return `${on} of ${m.total} ${word(m.total)}, ${pct(m.share != null ? m.share : m.mean)}`;
  }
  /* A graded bar: how full the match is. */
  function bar(share) {
    const p = Math.max(0, Math.min(100, Math.round((Number(share) || 0) * 100)));
    return `<span class="suite-bar" role="img" aria-label="${p}% of the suite matches"><i style="width:${p}%"></i></span>`;
  }
  /* One line: "Noir 3 of 5 lenses, 60%" and its bar. */
  function html(s, m, extra) {
    s = find(s);
    if (!s || !m) return "";
    return `<span class="suite-share" title="${esc(s.note || "")}"><b>${esc(s.label)}</b> <span class="suite-n">${esc(text(m))}</span>${bar(m.share != null ? m.share : m.mean)}${extra ? ` <span class="cap">${extra}</span>` : ""}</span>`;
  }
  /* A lens suite: its members' values side by side. label(id) names a curiosity. */
  function side(s, values, label) {
    s = find(s);
    if (!s) return "";
    values = values || {};
    const name = label || ((id) => ((typeof CURIOSITIES !== "undefined" && CURIOSITIES.find((c) => c.id === id)) || { label: id }).label);
    return `<span class="suite-side">${members(s)
      .map((id) => {
        const v = values[id];
        const set = v != null && v !== "";
        return `<span class="chip${set ? "" : " suite-unset"}">${esc(name(id))}: ${set ? esc(v) : "—"}</span>`;
      })
      .join("")}</span>`;
  }

  if (!document.getElementById("suite-share-css")) {
    const st = document.createElement("style");
    st.id = "suite-share-css";
    st.textContent = `
.suite-share { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; max-width: 100%; }
.suite-share .suite-n { font-family: var(--mono, monospace); font-size: 11px; }
.suite-bar { display: inline-block; width: 64px; height: 6px; border: 1px solid currentColor; border-radius: 3px; overflow: hidden; vertical-align: middle; opacity: .85; flex: none; }
.suite-bar i { display: block; height: 100%; background: currentColor; }
.suite-side { display: inline-flex; flex-wrap: wrap; gap: 4px; }
.suite-side .suite-unset { opacity: .55; }
.suite-list { display: grid; gap: 4px; margin: 6px 0; font-size: 13px; }
.suite-list .suite-share { display: flex; }
td .suite-share { display: flex; margin: 2px 0; }
`;
    (document.head || document.documentElement).appendChild(st);
  }

  window.CuriositySuites = { CAUSE_SHARE: SUITE_CAUSE_SHARE, sync, find, fixed, members, match, across, present, text, bar, html, side, pct };
})();

(function () {
  const live = CURIOSITIES.filter((c) => c.live);
  const state = load();
  const sceneSelect = { id: state.sceneId || "glass" };

  const controls = document.getElementById("controls");
  const board = document.getElementById("board");
  const catalog = document.getElementById("catalog");
  const ref = document.getElementById("ref");
  const study = document.getElementById("study");

  /* The bar: My film (the board), the workspaces (workspaces.js draws them into #workspace), and the
     Library menu, whose items open the older full views (Curated films, Prism, All curiosities, Show
     structure, the automation patch bay, and Studio pages). Games are paused: not loaded, not shown. */
  const SECTIONS = {
    board: ["board", "controls"],
    ws: ["workspace"],
    tool: ["workspace"],
    catalog: ["catalog"],
    reference: ["ref"],
    study: ["study"],
    studio: ["studio"],
    automate: ["automate"],
    prism: ["prism"],
  };
  const DRAW = {
    study: () => window.CuriosityStudy && window.CuriosityStudy.draw(),
    studio: () => window.CuriosityStudio && window.CuriosityStudio.draw(),
    automate: () => window.CuriosityAutomate && window.CuriosityAutomate.draw(),
    prism: () => window.CuriosityPrism && window.CuriosityPrism.draw(),
  };
  let currentTab = "board";
  function showTab(tab, button) {
    if (!SECTIONS[tab]) tab = "board";
    currentTab = tab;
    const shown = new Set(SECTIONS[tab]);
    document.querySelectorAll("main.layout > section").forEach((el) => el.classList.toggle("hidden", !shown.has(el.id)));
    const libBtn = document.getElementById("lib-btn");
    document.querySelectorAll("#tabs button").forEach((x) => x.classList.remove("on"));
    if (button && !button.closest("#lib-menu")) button.classList.add("on");
    else if (button && libBtn) libBtn.classList.add("on");
    else if (tab === "board") {
      const b = document.querySelector('#tabs button[data-tab="board"]');
      if (b) b.classList.add("on");
    }
    if (DRAW[tab]) DRAW[tab]();
    if (tab === "board") {
      try {
        localStorage.setItem("curiosities-workspace-v1", "board");
      } catch (e) {}
    }
  }
  window.CuriosityTabs = { show: showTab, current: () => currentTab };

  /* The Library menu: one button that opens a short list. */
  const libBtn = document.getElementById("lib-btn");
  const libMenu = document.getElementById("lib-menu");
  function libOpen(on) {
    if (!libBtn || !libMenu) return;
    libMenu.hidden = !on;
    libBtn.setAttribute("aria-expanded", on ? "true" : "false");
  }
  if (libBtn && libMenu) {
    libBtn.addEventListener("click", () => libOpen(libMenu.hidden));
    document.addEventListener("click", (e) => {
      if (!libMenu.hidden && !e.target.closest(".lib")) libOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !libMenu.hidden) {
        libOpen(false);
        libBtn.focus();
      }
    });
  }

  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    if (b.closest("#lib-menu")) libOpen(false);
    /* Workspaces and Studio pages are drawn by workspaces.js, which listens for its own buttons. */
    if (b.dataset.ws || b.dataset.tool) return;
    showTab(b.dataset.tab, b);
  });

  function load() {
    let saved = {};
    try {
      const raw = localStorage.getItem("curiosities-board-v2");
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}
    /* Automation never survives a reload (every patch starts stopped), so its layer starts empty. */
    const base = { sceneId: saved.sceneId || "glass", suite: saved.suite || "", applied: saved.applied || null, auto: null };
    /* Before workspaces, running automation replaced the applied strand: drop that stale strand. */
    if (base.applied && base.applied.label === "Automation") base.applied = null;
    live.forEach((c) => {
      base[c.id] = saved[c.id] != null ? saved[c.id] : c.value;
    });
    return base;
  }

  function save() {
    localStorage.setItem("curiosities-board-v2", JSON.stringify(state));
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scene() {
    return SCENES.find((s) => s.id === state.sceneId) || SCENES[0];
  }

  function drawControls() {
    const groups = [];
    live.forEach((c) => {
      if (!groups.includes(c.group)) groups.push(c.group);
    });
    const sceneField = `
      <label class="field">Scene
        <select id="scene">
          ${SCENES.map((s) => `<option value="${s.id}" ${s.id === state.sceneId ? "selected" : ""}>${esc(s.title)}</option>`).join("")}
        </select>
      </label>
      <label class="field">Suite
        <select id="suite">
          <option value="">Custom</option>
          ${[["", "Suites"], ["genre", "Genres"], ["emotion", "Angle by emotion"]]
            .map(
              ([k, title]) =>
                `<optgroup label="${title}">${SUITES.filter((s) => (s.kind || "") === k)
                  .map((s) => `<option value="${s.id}" ${s.id === state.suite ? "selected" : ""}>${esc(s.label)}</option>`)
                  .join("")}</optgroup>`
            )
            .join("")}
        </select>
      </label>`;
    const fields = groups
      .map((g) => {
        const items = live
          .filter((c) => c.group === g)
          .map((c) => {
            if (c.kind === "range") {
              return `<label class="field">${esc(c.label)} <span id="read-${c.id}">${esc(state[c.id])}</span>
                <input type="range" min="${c.min}" max="${c.max}" value="${state[c.id]}" data-id="${c.id}" />
              </label>`;
            }
            return `<label class="field">${esc(c.label)}
              <select data-id="${c.id}">
                ${c.options.map((o) => `<option ${o === state[c.id] ? "selected" : ""}>${esc(o)}</option>`).join("")}
              </select>
            </label>`;
          })
          .join("");
        return `<p class="group-label">${esc(g)}</p>${items}`;
      })
      .join("");
    controls.innerHTML = `<h2>Play the scene</h2>${sceneField}${fields}`;
    controls.onchange = onChange;
    controls.oninput = onChange;
  }

  function onChange(e) {
    const t = e.target;
    if (t.id === "scene") {
      state.sceneId = t.value;
    } else if (t.id === "suite") {
      state.suite = t.value;
      const suite = SUITES.find((s) => s.id === t.value);
      if (suite) {
        Object.assign(state, suite.set);
        Object.keys(suite.set).forEach(unapply);
      }
      drawControls();
    } else if (t.dataset.id) {
      state[t.dataset.id] = t.type === "range" ? Number(t.value) : t.value;
      unapply(t.dataset.id);
      const read = document.getElementById("read-" + t.dataset.id);
      if (read) read.textContent = state[t.dataset.id];
    }
    save();
    drawBoard();
    notify();
  }

  /* A control you touch by hand wins over a strand applied from the Shelf. */
  function unapply(id) {
    if (state.auto && id in state.auto) {
      delete state.auto[id];
      if (!Object.keys(state.auto).length) state.auto = null;
    }
    if (!state.applied || !(id in state.applied.values)) return;
    delete state.applied.values[id];
    if (!Object.keys(state.applied.values).length) state.applied = null;
  }

  function volumeSize(i, st) {
    const base = Number(st.volume) || 3;
    let n = base;
    if (st.dynamicRange === "wide") {
      const flip =
        st.rangeChanges === "every line" ? i % 2 === 1 : st.rangeChanges === "every other" ? Math.floor(i / 2) % 2 === 1 : false;
      n = flip ? Math.max(1, base - 2) : Math.min(5, base + 1);
    }
    return 13 + n * 2;
  }

  function angleLabel(i, st) {
    if (st.shotSize) return st.shotSize;
    const family = st.angleFamily;
    const names = {
      coverage: ["wide", "medium", "close", "insert", "over-shoulder", "wide", "close", "high"],
      oner: ["oner"],
      montage: ["detail", "face", "room", "hand", "door", "sky", "feet", "face"],
      handheld: ["hunting", "too close", "correcting", "hunting", "low", "face", "shoulder", "wide"],
    };
    const list = names[family] || names.coverage;
    if (family === "oner" || st.angleChange === "locked") return list[0];
    return list[i % list.length];
  }

  function shotWord(i, st) {
    if (st.shotSize) return st.shotSize;
    const label = angleLabel(i, st);
    if (label.indexOf("close") >= 0) return "close";
    if (label === "insert" || label === "detail" || label === "hand") return "insert";
    if (label === "wide" || label === "room") return "wide";
    return "medium";
  }

  /* ---------- Lenses on the panel: color, set, clothes, emotion and comedy, drawn cheaply in the SVG ----------
     Each lens draws only when one of its values is set on the panel (by a workspace, a strand or automation);
     with none set, the panel looks exactly as before. Everything sits inside the stage SVG, so the storyboard's
     flip view, its small pictures and the PNG contact sheet show it too. */
  const LENS_COLOR = ["colorRange", "colorFilter", "filterHue", "saturation", "colorCount", "colorAccent", "warmCool", "colorTemp", "contrast"];
  const LENS_SET = ["setStyle", "setMaterial", "setLines", "wallArt", "artArrangement", "clutter", "setBrightness", "setUpkeep"];
  const LENS_MAIN = ["mainEra", "mainCost", "mainCoverage", "mainUtility", "mainFunction", "mainWear", "mainFit", "mainFormality", "mainSetMatch"];
  const LENS_BACK = ["backEra", "backCost", "backCoverage", "backUtility", "backFunction", "backWear", "backSameness", "backPeriodTruth", "backVsMain"];
  const LENS_EMO = ["emotion", "emotionIntensity", "emoMove", "emoVoice", "faceIntensity", "posture", "movementAmount", "wordsAmount", "postureChanges", "emoActions", "settingMood", "lightingMood"];
  const LENS_COMEDY = ["comedyDevice", "comedyTopic", "comicTiming", "comicEscalation", "absurdity", "comicRegister", "cringe", "comicBeat", "laughsPerMinute", "jokeCarrier", "comicReaction"];
  let lensById = null;
  function lensCur(id) {
    if (!lensById) lensById = Object.fromEntries(CURIOSITIES.map((c) => [c.id, c]));
    return lensById[id];
  }
  const lensHas = (st, id) => st[id] != null && st[id] !== "";
  const lensAny = (st, ids) => ids.some((id) => lensHas(st, id));
  /* Where a value sits on its scale, 0 (first, lowest) to 1 (last, highest); null when unset or unknown. */
  function lensAt(st, id) {
    if (!lensHas(st, id)) return null;
    const c = lensCur(id);
    if (!c) return null;
    if (c.kind === "range") {
      const v = Number(st[id]);
      if (!isFinite(v)) return null;
      return Math.max(0, Math.min(1, (v - c.min) / ((c.max - c.min) || 1)));
    }
    const order = (window.CURIOSITY_ORDER && window.CURIOSITY_ORDER[id]) || c.options || [];
    const k = order.indexOf(String(st[id]));
    return k < 0 ? null : order.length > 1 ? k / (order.length - 1) : 0;
  }
  const lensNum = (st, id) => {
    const c = lensCur(id);
    const v = Number(st[id]);
    return c && lensHas(st, id) && isFinite(v) ? v : null;
  };
  const lensRnd = (k, salt) => {
    const x = Math.sin(k * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const n1 = (v) => Number(v).toFixed(1);
  const HUES = { red: "#c8322a", orange: "#e07b2a", yellow: "#e2c13a", green: "#3f9a55", teal: "#2a9a96", blue: "#3a6fc4", purple: "#7a4ab0" };
  const MATERIAL = { "dirt and rough wood": "#8b6a46", wood: "#b07a44", brick: "#b0553a", stone: "#9a948a", metal: "#8c97a3", glass: "#a9cbd6", marble: "#ebe7df" };
  const LIGHT_WALL = { dusk: "#d99a5e", flat: "#d8d2c4", practical: "#e9b860", hard: "#c9ccd1", moon: "#7f9cc0" };
  const ART = ["#c45c26", "#3f6fa8", "#b8892d", "#4f8a5b", "#8a3f6f"];
  const COST_INK = ["#8a7a66", "#7c7c7c", "#1c1712", "#2f5a8f", "#7a2a4a", "#b8892d"];

  /* The back wall's texture by material: planks, bricks, blocks, seams and rivets, glass streaks, marble veins. */
  function lensTexture(mat, soft) {
    const st = `fill="none" stroke="#1c1712" stroke-opacity="0.28" stroke-width="0.7"`;
    const out = [];
    if (mat === "wood" || mat === "dirt and rough wood") {
      for (let y = 12; y < 46; y += mat === "wood" ? 6 : 8) {
        const w = mat === "wood" ? 0 : 1.6;
        out.push(`<path d="M0,${y} Q50,${n1(y + w * (lensRnd(y, 1) - 0.5) * 2)} 100,${y} T200,${y}" ${st}/>`);
      }
    } else if (mat === "brick" || mat === "stone") {
      const h = mat === "brick" ? 5 : 9;
      const w = mat === "brick" ? 14 : 22;
      for (let y = 6, row = 0; y < 46; y += h, row++) {
        out.push(`<line x1="0" y1="${y}" x2="200" y2="${y}" ${st}/>`);
        for (let x = (row % 2) * (w / 2) + (mat === "stone" ? lensRnd(row, 2) * 6 : 0); x < 200; x += w) out.push(`<line x1="${n1(x)}" y1="${y}" x2="${n1(x)}" y2="${Math.min(46, y + h)}" ${st}/>`);
      }
    } else if (mat === "metal") {
      for (let x = 25; x < 200; x += 25) out.push(`<line x1="${x}" y1="4" x2="${x}" y2="46" ${st}/>`);
      for (let x = 25; x < 200; x += 25) for (const y of [9, 41]) out.push(`<circle cx="${x - 3}" cy="${y}" r="0.9" fill="#1c1712" fill-opacity="0.4"/>`);
    } else if (mat === "glass") {
      for (let x = 10; x < 200; x += 34) out.push(`<line x1="${x}" y1="44" x2="${x + 14}" y2="6" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2"/>`);
    } else if (mat === "marble") {
      for (let k = 0; k < 5; k++) {
        const y = 10 + k * 8 + lensRnd(k, 3) * 4;
        out.push(`<path d="M0,${n1(y)} C40,${n1(y - 6)} 70,${n1(y + 7)} 110,${n1(y + 1)} S170,${n1(y - 5)} 200,${n1(y + 3)}" fill="none" stroke="#6b6660" stroke-opacity="0.35" stroke-width="${k % 2 ? 0.5 : 0.9}"/>`);
      }
    }
    return out.join("");
  }

  /* Art frames: how many from the art amount, placed neat (an even row) to scattered (jittered, tilted, mixed sizes). */
  function lensArt(st, soft) {
    const amt = lensNum(st, "wallArt");
    let n = amt != null ? Math.round(Math.max(0, amt) * 2.4) : lensHas(st, "artArrangement") && st.artArrangement !== "no art" ? 4 : 0;
    if (st.artArrangement === "no art" && amt == null) n = 0;
    if (!n) return "";
    const arr = lensHas(st, "artArrangement") ? ["no art", "scattered", "loose groups", "neat rows", "perfectly even"].indexOf(st.artArrangement) : 3;
    const jit = [1, 1, 0.6, 0.2, 0][arr < 0 ? 3 : arr];
    const rows = n > 6 ? 2 : 1;
    const cols = Math.ceil(n / rows);
    const cell = 184 / cols;
    const out = [];
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / cols);
      const col = k % cols;
      let w = Math.min(cell * 0.62, rows === 1 ? 24 : 18);
      let h = w * 0.72;
      w *= 1 + (lensRnd(k, 4) - 0.5) * 0.9 * jit;
      h *= 1 + (lensRnd(k, 5) - 0.5) * 0.9 * jit;
      let cx = 8 + cell * (col + 0.5) + (lensRnd(k, 6) - 0.5) * cell * 0.9 * jit;
      /* Loose groups pull frames toward two clusters. */
      if (arr === 2) cx = cx * 0.6 + (cx < 100 ? 52 : 148) * 0.4;
      let cy = (rows === 1 ? 24 : row === 0 ? 15 : 34) + (lensRnd(k, 7) - 0.5) * 16 * jit;
      cy = Math.max(6 + h / 2, Math.min(44 - h / 2, cy));
      const rot = (lensRnd(k, 8) - 0.5) * 22 * jit;
      const rx = (soft * 3).toFixed(1);
      out.push(`<rect x="${n1(cx - w / 2)}" y="${n1(cy - h / 2)}" width="${n1(w)}" height="${n1(h)}" rx="${rx}" fill="${ART[k % ART.length]}" fill-opacity="0.85" stroke="#1c1712" stroke-width="1.1"${rot ? ` transform="rotate(${n1(rot)} ${n1(cx)} ${n1(cy)})"` : ""}/>`);
    }
    return out.join("");
  }

  /* A costume mark on a head at (x, y) with radius r: the job the clothes do wins, else the era. */
  function lensCostume(x, y, r, era, func, cost, wear) {
    const ink = COST_INK[Math.max(0, ["rags", "cheap", "everyday", "smart", "expensive", "luxury"].indexOf(cost))] || "#1c1712";
    const dash = wear === "worn out" || wear === "torn and dirty" ? ` stroke-dasharray="1.6 1"` : "";
    const s = `stroke="${ink}" stroke-width="1.3" fill="none"${dash}`;
    const f = `fill="${ink}"${dash ? ` fill-opacity="0.7"` : ""}`;
    const t = y - r;
    const brim = (wd) => `<line x1="${n1(x - r - wd)}" y1="${n1(t + 0.5)}" x2="${n1(x + r + wd)}" y2="${n1(t + 0.5)}" ${s}/>`;
    const kind =
      { "riding (chaps, boots)": "cowboy", "crash protection (bike jacket, helmet)": "helmet", "flight or space suit": "bubble", armor: "armor", "work wear": "hardhat", sport: "band", warmth: "scarf" }[func] ||
      { ancient: "laurel", medieval: "hood", "1700s": "tricorn", "1800s": "tophat", "old west": "cowboy", "1920s": "fedora", "1950s": "bowtie", "1970s": "collar", "1990s": "cap", today: "jacket", future: "visor" }[era] ||
      "";
    switch (kind) {
      case "tophat":
        return brim(2.5) + `<rect x="${n1(x - r * 0.7)}" y="${n1(t - r * 1.5)}" width="${n1(r * 1.4)}" height="${n1(r * 1.5)}" ${f}/>`;
      case "fedora":
        return brim(3) + `<path d="M${n1(x - r * 0.8)},${n1(t)} L${n1(x - r * 0.6)},${n1(t - r * 0.8)} L${n1(x + r * 0.6)},${n1(t - r * 0.8)} L${n1(x + r * 0.8)},${n1(t)} Z" ${f}/>`;
      case "cowboy":
        return `<path d="M${n1(x - r - 4)},${n1(t - 2)} Q${n1(x)},${n1(t + 2.5)} ${n1(x + r + 4)},${n1(t - 2)}" ${s}/><rect x="${n1(x - r * 0.7)}" y="${n1(t - r)}" width="${n1(r * 1.4)}" height="${n1(r * 1.1)}" rx="1.5" ${f}/>`;
      case "tricorn":
        return `<path d="M${n1(x - r - 2.5)},${n1(t + 1)} L${n1(x)},${n1(t - r * 1.2)} L${n1(x + r + 2.5)},${n1(t + 1)} Z" ${f}/>`;
      case "hood":
        return `<path d="M${n1(x - r - 1.5)},${n1(y + 1)} Q${n1(x - r - 1.5)},${n1(t - r)} ${n1(x)},${n1(t - r * 1.4)} Q${n1(x + r + 1.5)},${n1(t - r)} ${n1(x + r + 1.5)},${n1(y + 1)}" ${s}/>`;
      case "laurel":
        return `<path d="M${n1(x - r - 1)},${n1(y - 1)} A${n1(r + 1.5)},${n1(r + 1.5)} 0 0 1 ${n1(x + r + 1)},${n1(y - 1)}" stroke="#4f8a5b" stroke-width="1.6" fill="none" stroke-dasharray="1.6 0.8"/>`;
      case "bowtie":
        return `<path d="M${n1(x - 3.5)},${n1(y + r + 0.5)} L${n1(x)},${n1(y + r + 2.2)} L${n1(x - 3.5)},${n1(y + r + 4)} Z M${n1(x + 3.5)},${n1(y + r + 0.5)} L${n1(x)},${n1(y + r + 2.2)} L${n1(x + 3.5)},${n1(y + r + 4)} Z" ${f}/>`;
      case "collar":
        return `<path d="M${n1(x - r - 3)},${n1(y + r - 1)} L${n1(x)},${n1(y + r + 5)} L${n1(x + r + 3)},${n1(y + r - 1)}" ${s}/>`;
      case "cap":
        return `<path d="M${n1(x - r)},${n1(y - r * 0.2)} A${n1(r)},${n1(r)} 0 0 1 ${n1(x + r)},${n1(y - r * 0.2)} Z" ${f}/><line x1="${n1(x + r * 0.6)}" y1="${n1(y - r * 0.3)}" x2="${n1(x + r + 4)}" y2="${n1(y - r * 0.1)}" ${s}/>`;
      case "jacket":
        return `<path d="M${n1(x - r - 3)},${n1(y + r + 4)} Q${n1(x)},${n1(y + r - 2)} ${n1(x + r + 3)},${n1(y + r + 4)}" ${s}/>`;
      case "visor":
        return `<rect x="${n1(x - r - 1)}" y="${n1(y - r * 0.45)}" width="${n1(2 * r + 2)}" height="${n1(r * 0.6)}" fill="#2a9a96"/>`;
      case "helmet":
        return `<path d="M${n1(x - r - 1.5)},${n1(y + 0.5)} A${n1(r + 1.5)},${n1(r + 1.5)} 0 0 1 ${n1(x + r + 1.5)},${n1(y + 0.5)} Z" ${f}/><line x1="${n1(x - r)}" y1="${n1(y - r * 0.15)}" x2="${n1(x + r + 1.5)}" y2="${n1(y - r * 0.15)}" stroke="#a9cbd6" stroke-width="1.2"/>`;
      case "bubble":
        return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r + 3)}" stroke="#3a6fc4" stroke-width="1.1" fill="#a9cbd6" fill-opacity="0.3"/>`;
      case "armor":
        return `<path d="M${n1(x - r - 1)},${n1(y)} L${n1(x)},${n1(t - r)} L${n1(x + r + 1)},${n1(y)}" ${s}/><rect x="${n1(x - r - 4)}" y="${n1(y + r - 1)}" width="4" height="3" ${f}/><rect x="${n1(x + r)}" y="${n1(y + r - 1)}" width="4" height="3" ${f}/>`;
      case "hardhat":
        return `<path d="M${n1(x - r - 0.5)},${n1(y - r * 0.2)} A${n1(r + 0.5)},${n1(r + 0.5)} 0 0 1 ${n1(x + r + 0.5)},${n1(y - r * 0.2)} Z" fill="#e2c13a" stroke="#1c1712" stroke-width="0.6"/>` + `<line x1="${n1(x - r - 2.5)}" y1="${n1(y - r * 0.2)}" x2="${n1(x + r + 2.5)}" y2="${n1(y - r * 0.2)}" stroke="#e2c13a" stroke-width="1.4"/>`;
      case "band":
        return `<line x1="${n1(x - r)}" y1="${n1(y - r * 0.5)}" x2="${n1(x + r)}" y2="${n1(y - r * 0.5)}" stroke="#c8322a" stroke-width="1.6"/>`;
      case "scarf":
        return `<path d="M${n1(x - r)},${n1(y + r)} L${n1(x + r)},${n1(y + r)} L${n1(x + r - 1)},${n1(y + r + 6)}" stroke="#c45c26" stroke-width="2" fill="none"/>`;
    }
    return "";
  }

  /* A small face on a head: the mouth and eyes follow the emotion word; strength opens the mouth wider. */
  function lensFace(x, y, r, emo, strength) {
    const s = `stroke="#fffaf2" stroke-width="${n1(0.8 + strength * 0.4)}" fill="none" stroke-linecap="round"`;
    const ey = y - r * 0.25;
    const eyes = `<circle cx="${n1(x - r * 0.38)}" cy="${n1(ey)}" r="0.75" fill="#fffaf2"/><circle cx="${n1(x + r * 0.38)}" cy="${n1(ey)}" r="0.75" fill="#fffaf2"/>`;
    const my = y + r * 0.35;
    const w = r * (0.35 + strength * 0.25);
    const bend = r * (0.15 + strength * 0.4);
    const happy = ["loving", "joyful", "triumphant", "cozy", "bright and warm"].includes(emo);
    const sad = ["melancholy", "anxious", "fearful", "gloomy", "oppressive", "dim", "dark and harsh"].includes(emo);
    if (emo === "dreamlike")
      return `<path d="M${n1(x - r * 0.55)},${n1(ey)} h${n1(r * 0.35)} M${n1(x + r * 0.2)},${n1(ey)} h${n1(r * 0.35)}" ${s}/><path d="M${n1(x - w * 0.6)},${n1(my)} Q${n1(x)},${n1(my + bend * 0.5)} ${n1(x + w * 0.6)},${n1(my)}" ${s}/>`;
    if (emo === "angry")
      return `<path d="M${n1(x - r * 0.6)},${n1(ey - 1.4)} L${n1(x - r * 0.15)},${n1(ey - 0.4)} M${n1(x + r * 0.6)},${n1(ey - 1.4)} L${n1(x + r * 0.15)},${n1(ey - 0.4)}" ${s}/>${eyes}<line x1="${n1(x - w)}" y1="${n1(my)}" x2="${n1(x + w)}" y2="${n1(my)}" ${s}/>`;
    if (emo === "curious") return eyes + `<circle cx="${n1(x)}" cy="${n1(my)}" r="${n1(0.6 + strength * 0.8)}" ${s}/>`;
    if (emo === "absurd") return eyes + `<path d="M${n1(x - w)},${n1(my)} l${n1(w / 2)},-1 l${n1(w / 2)},1.4 l${n1(w / 2)},-1.4 l${n1(w / 2)},1" ${s}/>`;
    const dir = happy ? 1 : sad ? -1 : 0;
    return eyes + `<path d="M${n1(x - w)},${n1(my - (dir * bend) / 2)} Q${n1(x)},${n1(my + dir * bend)} ${n1(x + w)},${n1(my - (dir * bend) / 2)}" ${s}/>`;
  }

  function lensShort(word, max) {
    word = String(word);
    const map = { "the straight one and the funny one": "straight & funny", "fish out of water": "fish out of water" };
    word = map[word] || word;
    return word.length > max ? word.slice(0, max - 1) + "…" : word;
  }

  /* Everything a lens adds to one stage. Returns null when no lens value is set, so the stage is unchanged. */
  function lensDraw(st, who) {
    const color = lensAny(st, LENS_COLOR);
    const set = lensAny(st, LENS_SET);
    const main = lensAny(st, LENS_MAIN);
    const back = lensAny(st, LENS_BACK);
    const emo = lensAny(st, LENS_EMO);
    const comedy = lensAny(st, LENS_COMEDY);
    if (!color && !set && !main && !back && !emo && !comedy) return null;
    const aria = [];
    let defs = "";
    let filter = "";
    let backL = "";
    let marks = "";
    let over = "";
    let labels = "";
    let bodies = null;

    /* The set: a back wall (its material's color and texture), a floor line, art, clutter. With only a color
       lens, a plain wall in the light's color gives the color something to act on. */
    if (set || color) {
      const soft = lensHas(st, "setLines") ? 1 - lensAt(st, "setLines") : 0;
      const wall = (lensHas(st, "setMaterial") && MATERIAL[st.setMaterial]) || LIGHT_WALL[st.lighting] || "#d8d2c4";
      const bright = lensAt(st, "setBrightness");
      const shade = bright == null ? "" : bright < 0.5 ? `<rect x="0" y="0" width="200" height="46" fill="#1c1712" fill-opacity="${n1((0.5 - bright) * 0.9)}"/>` : `<rect x="0" y="0" width="200" height="46" fill="#ffffff" fill-opacity="${n1((bright - 0.5) * 0.9)}"/>`;
      let setLayer = `<rect x="0" y="0" width="200" height="46" fill="${wall}" fill-opacity="0.7"/>${shade}`;
      if (set) {
        setLayer += lensTexture(st.setMaterial, soft);
        setLayer += lensArt(st, soft);
        const amp = soft * 3;
        const floor = soft > 0.05 ? `<path d="M0,46 Q25,${n1(46 - amp)} 50,46 T100,46 T150,46 T200,46" fill="none" stroke="#1c1712" stroke-width="${n1(1 + soft * 0.8)}" stroke-linecap="round"/>` : `<line x1="0" y1="46" x2="200" y2="46" stroke="#1c1712" stroke-width="1" shape-rendering="crispEdges"/>`;
        setLayer += floor;
        const cl = lensNum(st, "clutter");
        if (cl != null && cl > 0) {
          const k = Math.round(cl * 4);
          for (let j = 0; j < k; j++) setLayer += `<circle cx="${n1(6 + lensRnd(j, 9) * 188)}" cy="${n1(76 + lensRnd(j, 10) * 11)}" r="${n1(1 + lensRnd(j, 11) * 1.4)}" fill="${ART[j % ART.length]}" stroke="#1c1712" stroke-width="0.4"/>`;
        }
        if (soft > 0.3) {
          const id = "lens-soft-" + Math.round(soft * 10);
          defs += `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${n1(soft * 0.7)}"/></filter>`;
          setLayer = `<g filter="url(#${id})">${setLayer}</g>`;
        }
        aria.push("set " + [st.setStyle, st.setMaterial, lensHas(st, "wallArt") ? "art " + Math.round(Number(st.wallArt)) : ""].filter(Boolean).join(" "));
      } else {
        setLayer += `<line x1="0" y1="46" x2="200" y2="46" stroke="#1c1712" stroke-opacity="0.4"/>`;
      }
      backL = setLayer;
    }

    /* Color: how much color (black and white to vivid), contrast, then a tint and warm or cool laid over. */
    if (color) {
      let sat = null;
      const range = lensHas(st, "colorRange") ? ["black and white", "one color", "two or three colors", "muted color", "natural color", "vivid color"].indexOf(st.colorRange) : -1;
      if (range >= 0) sat = [0, 0, 0.4, 0.6, 1, 1.9][range];
      else if (lensNum(st, "saturation") != null) sat = Math.max(0, lensNum(st, "saturation")) / 2.5;
      else if (lensNum(st, "colorCount") != null) sat = Math.max(0, (lensNum(st, "colorCount") - 1) / 5) * 1.3;
      const con = lensNum(st, "contrast");
      const slope = con == null ? null : 0.4 + Math.max(0, Math.min(6, con)) * 0.2;
      if (sat != null || slope != null) {
        const id = "lens-color-" + (sat == null ? "x" : Math.round(sat * 100)) + "-" + (slope == null ? "x" : Math.round(slope * 100));
        const fn = slope == null ? "" : `<feComponentTransfer>${["R", "G", "B"].map((c) => `<feFunc${c} type="linear" slope="${slope.toFixed(2)}" intercept="${(0.5 * (1 - slope)).toFixed(2)}"/>`).join("")}</feComponentTransfer>`;
        defs += `<filter id="${id}" color-interpolation-filters="sRGB">${sat == null ? "" : `<feColorMatrix type="saturate" values="${sat.toFixed(2)}"/>`}${fn}</filter>`;
        filter = ` filter="url(#${id})"`;
      }
      const bw = st.colorRange === "black and white";
      const mono = st.colorRange === "one color" || (lensNum(st, "colorCount") != null && lensNum(st, "colorCount") <= 1);
      const hue = HUES[st.filterHue] || (mono ? "#a0703a" : null);
      const strength = lensHas(st, "colorFilter") ? [0, 0.16, 0.3, 0.45][Math.max(0, ["none", "light", "strong", "the whole picture"].indexOf(st.colorFilter))] : hue ? (mono ? 0.32 : 0.16) : 0;
      if (!bw && hue && strength) over += `<rect x="0" y="0" width="200" height="90" fill="${hue}" fill-opacity="${strength}" pointer-events="none"/>`;
      const warm = lensHas(st, "warmCool") ? ["very warm", "warm", "neutral", "cool", "very cool"].indexOf(st.warmCool) : st.colorTemp === "warm practical" ? 1 : st.colorTemp === "cold day" ? 3 : -1;
      if (!bw && warm >= 0 && warm !== 2) over += `<rect x="0" y="0" width="200" height="90" fill="${warm < 2 ? "#e07b2a" : "#3a78c4"}" fill-opacity="${warm === 0 || warm === 4 ? 0.24 : 0.12}" pointer-events="none"/>`;
      if (!bw && st.colorAccent && st.colorAccent !== "none" && who[0]) over += `<circle cx="${n1(who[0].x)}" cy="${n1(who[0].y)}" r="${n1(who[0].r + 2.5)}" fill="none" stroke="#c8322a" stroke-width="${st.colorAccent === "a small spot" ? 1 : 2}"/>`;
      aria.push("color " + [st.colorRange, st.warmCool, st.filterHue && st.colorFilter !== "none" ? st.filterHue + " filter" : ""].filter(Boolean).join(" "));
    }

    /* Emotion: the main character's size and lean, arms for posture, a face, and lines for how much they move. */
    const people = who.map((w) => Object.assign({}, w));
    if (emo && people[0]) {
      const p0 = people[0];
      let I = lensNum(st, "emotionIntensity");
      if (I == null) I = lensNum(st, "faceIntensity");
      if (I == null && lensAt(st, "emoMove") != null) I = lensAt(st, "emoMove") * 5;
      if (I == null) I = 2.5;
      const pos = lensHas(st, "posture") ? String(st.posture) : "";
      p0.r = Math.max(5.5, p0.r) * (1 + (I - 2.5) * 0.08) * (pos === "closed" ? 0.88 : pos === "open" ? 1.1 : 1);
      const move = lensAt(st, "emoMove") != null ? lensAt(st, "emoMove") : I / 5;
      const lean = (move - 0.3) * 9;
      const tx = p0.x + lean;
      const ty = p0.y + p0.r + 9;
      marks += `<line x1="${n1(p0.x)}" y1="${n1(p0.y + p0.r)}" x2="${n1(tx)}" y2="${n1(ty)}" stroke="#1c1712" stroke-width="2.2" stroke-linecap="round"/>`;
      const mx = p0.x + lean * 0.4;
      const my = p0.y + p0.r + 3.5;
      if (pos === "open") marks += `<path d="M${n1(mx - 6)},${n1(my - 4)} L${n1(mx)},${n1(my)} L${n1(mx + 6)},${n1(my - 4)}" fill="none" stroke="#1c1712" stroke-width="1.5" stroke-linecap="round"/>`;
      if (pos === "closed") marks += `<path d="M${n1(mx - 3.5)},${n1(my - 1.5)} L${n1(mx + 3.5)},${n1(my + 2)} M${n1(mx + 3.5)},${n1(my - 1.5)} L${n1(mx - 3.5)},${n1(my + 2)}" fill="none" stroke="#1c1712" stroke-width="1.5" stroke-linecap="round"/>`;
      const amt = lensNum(st, "movementAmount");
      const lines = amt != null ? Math.round(amt) : lensAt(st, "emoMove") != null ? Math.round(lensAt(st, "emoMove") * 4) : 0;
      for (let j = 0; j < lines; j++) marks += `<line x1="${n1(p0.x - p0.r - 3 - (j % 2) * 2)}" y1="${n1(p0.y - p0.r + 2 + j * 2.6)}" x2="${n1(p0.x - p0.r - 8 - (j % 2) * 2)}" y2="${n1(p0.y - p0.r + 2 + j * 2.6)}" stroke="#c45c26" stroke-width="0.9"/>`;
      const word = st.emotion || st.settingMood || st.lightingMood || st.emoMove || "feeling";
      const face = lensFace(p0.x, p0.y, p0.r, String(word), Math.max(0, Math.min(1, I / 5)));
      bodies = people.map((w) => `<circle cx="${n1(w.x)}" cy="${n1(w.y)}" r="${n1(w.r)}" fill="#1c1712"/>`).join("") + face;
      const label = lensShort(word, 14);
      const lw = label.length * 4.7 + 34;
      const dots = Array.from({ length: 5 }, (_, j) => `<rect x="${n1(6 + label.length * 4.7 + 6 + j * 5)}" y="5" width="3.6" height="5" fill="${j < Math.round(I) ? "#c45c26" : "none"}" stroke="#1c1712" stroke-width="0.5"/>`).join("");
      labels += `<g class="lens-mood"><rect x="2" y="2" width="${n1(lw)}" height="11" rx="2" fill="#fffaf2" fill-opacity="0.92" stroke="#1c1712" stroke-width="0.6"/><text x="5" y="10.5" font-family="ui-monospace, Menlo, monospace" font-size="8" font-weight="700" fill="#1c1712">${esc(label)}</text>${dots}</g>`;
      aria.push("feeling " + word + " " + Math.round(I) + " of 5");
    }

    /* Clothes: the main character's mark on the first head, the background's on the others (or on two extras). */
    if (main && people[0]) marks += lensCostume(people[0].x, people[0].y, people[0].r, st.mainEra, st.mainFunction, st.mainCost, st.mainWear);
    if (back) {
      const ERA = ["ancient", "medieval", "1700s", "1800s", "old west", "1920s", "1950s", "1970s", "1990s", "today", "future"];
      let extras = people.slice(1);
      if (!extras.length) {
        extras = [
          { x: 150, y: 41, r: 3.6 },
          { x: 172, y: 43, r: 3.6 },
        ];
        marks += extras.map((w) => `<circle cx="${w.x}" cy="${w.y}" r="${w.r}" fill="#6b625a"/>`).join("");
      }
      const alike = ["uniforms", "nearly alike"].includes(st.backSameness);
      extras.forEach((w, k) => {
        let era = st.backEra;
        const e = ERA.indexOf(era);
        if (!alike && e >= 0 && st.backSameness === "all different") era = ERA[(e + k * 3) % ERA.length];
        marks += lensCostume(w.x, w.y, w.r, era, st.backFunction, st.backCost, st.backWear);
      });
    }
    if (main) aria.push("main clothes " + [st.mainEra, st.mainCost, st.mainFunction].filter(Boolean).join(" "));
    if (back) aria.push("background clothes " + [st.backEra, st.backSameness].filter(Boolean).join(" "));

    /* Comedy: a corner badge with the kind of joke, beats of pause as dots, escalation as rising bars. */
    if (comedy) {
      const word = lensShort(st.comedyDevice || st.comicRegister || st.comedyTopic || "comedy", 17);
      const beats = Math.max(0, Math.min(4, Math.round(Number(st.comicTiming) || 0)));
      const esc5 = lensNum(st, "comicEscalation");
      const w = Math.max(esc5 != null ? 70 : lensHas(st, "comicTiming") ? 46 : 40, word.length * 4.7 + 8);
      const x0 = 198 - w;
      let g = `<rect x="${n1(x0)}" y="2" width="${n1(w)}" height="21" rx="2" fill="#fffaf2" fill-opacity="0.94" stroke="#1c1712" stroke-width="0.7"/><text x="${n1(x0 + 3)}" y="10.5" font-family="ui-monospace, Menlo, monospace" font-size="8" font-weight="700" fill="#1c1712">${esc(word)}</text>`;
      if (lensHas(st, "comicTiming")) {
        g += `<text x="${n1(x0 + 3)}" y="20" font-family="ui-monospace, Menlo, monospace" font-size="6" fill="#3a3229">pause</text>`;
        for (let j = 0; j < 4; j++) g += `<circle cx="${n1(x0 + 25 + j * 4.2)}" cy="18" r="1.4" fill="${j < beats ? "#1c1712" : "none"}" stroke="#1c1712" stroke-width="0.5"/>`;
      }
      if (esc5 != null) {
        const lvl = Math.max(0, Math.min(5, Math.round(esc5)));
        for (let j = 0; j < 5; j++) {
          const h = 2 + j * 1.3;
          g += `<rect x="${n1(x0 + w - 24 + j * 4.3)}" y="${n1(21 - h)}" width="3" height="${n1(h)}" fill="${j < lvl ? "#c45c26" : "none"}" stroke="#1c1712" stroke-width="0.5"/>`;
        }
      }
      if (st.comicBeat === "payoff lands") g += `<path d="M${n1(x0 - 6)},4 l1.5,3.5 l3.5,0.3 l-2.7,2.3 l1,3.6 l-3.3,-2 l-3.3,2 l1,-3.6 l-2.7,-2.3 l3.5,-0.3 Z" fill="#e2c13a" stroke="#1c1712" stroke-width="0.5"/>`;
      else if (st.comicBeat === "setup planted") g += `<circle cx="${n1(x0 - 6)}" cy="9" r="3" fill="none" stroke="#1c1712" stroke-width="0.9" stroke-dasharray="1.5 1"/>`;
      else if (st.comicBeat === "building") g += `<path d="M${n1(x0 - 9)},12 l3,-6 l3,6" fill="none" stroke="#1c1712" stroke-width="1"/>`;
      labels += `<g class="lens-comedy">${g}</g>`;
      aria.push("comedy " + [st.comedyDevice, lensHas(st, "comicTiming") ? beats + " beats of pause" : "", esc5 != null ? "escalation " + Math.round(esc5) : ""].filter(Boolean).join(", "));
    }
    return { defs: defs ? `<defs>${defs}</defs>` : "", filter, back: backL, marks, over, labels, bodies, aria: aria.length ? ". Lenses: " + aria.join("; ") : "" };
  }

  /* The lens words under the stage, for the clothes and the set, which the marks only hint at. */
  function lensLine(st) {
    const parts = [];
    const w = (ids) => ids.filter((id) => lensHas(st, id)).map((id) => (lensCur(id) && lensCur(id).kind === "range" ? `${(lensCur(id).label || id).toLowerCase()} ${Math.round(Number(st[id]) * 10) / 10}` : st[id]));
    const set = w(["setStyle", "setMaterial", "wallArt", "artArrangement"]);
    const main = w(["mainEra", "mainCost", "mainFunction", "mainWear"]);
    const back = w(["backEra", "backCost", "backFunction", "backSameness"]);
    const color = w(["colorRange", "warmCool", "filterHue"]);
    if (main.length) parts.push(`<span><b>Wears</b> ${esc(main.join(", "))}</span>`);
    if (back.length) parts.push(`<span><b>Background</b> ${esc(back.join(", "))}</span>`);
    if (set.length) parts.push(`<span><b>Set</b> ${esc(set.join(", "))}</span>`);
    if (color.length) parts.push(`<span><b>Color</b> ${esc(color.join(", "))}</span>`);
    return parts.length ? `<p class="lens-line">${parts.join(" ")}</p>` : "";
  }

  function stageSvg(i, count, st) {
    const t = count <= 1 ? 0 : i / (count - 1);
    const carry = st.cameraCarry || "smooth";
    const speed = Number(st.moveSpeed) || 2;
    const move = st.cameraMove || "none";
    let cam = "";
    if (carry === "locked" || move === "none") {
      cam = `<rect x="8" y="8" width="184" height="74" fill="none" stroke="#1c1712" stroke-width="1.5"/>`;
    } else if (carry === "handheld") {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const x = 16 + k * 20;
        const y = 28 + Math.sin(k * 1.7 + i) * (3 + speed) + (k % 2 ? 5 : -4);
        pts.push(x + "," + y.toFixed(1));
      }
      cam = `<polyline points="${pts.join(" ")}" fill="none" stroke="#c45c26" stroke-width="2"/>`;
    } else {
      const y1 = move === "crane" ? 68 : 46;
      const y2 = move === "crane" || move === "tilt" ? 18 : move === "push in" ? 40 : 46;
      const x2 = move === "push in" ? 110 : move === "pull out" ? 48 : move === "orbit" ? 100 : 180;
      cam = `<path d="M16,${y1} C80,${y1} 120,${y2} ${x2},${y2}" fill="none" stroke="#1c1712" stroke-width="2"/>`;
    }
    const n = Math.min(4, Math.max(1, Number(st.peopleCount) || 1));
    const bodies = [];
    const who = [];
    for (let p = 0; p < n; p++) {
      if (st.whoMoves === "neither") {
        who.push({ x: 40 + p * 28, y: 58, r: 5 });
        bodies.push(`<circle cx="${40 + p * 28}" cy="58" r="5" fill="#1c1712"/>`);
        continue;
      }
      let x = 40 + p * 28;
      let y = 58;
      const path = st.characterPath;
      if (path === "cross") x = 18 + t * 130 + p * 10;
      if (path === "approach") {
        x = 78 + p * 16;
        y = 72 - t * 40;
      }
      if (path === "retreat") {
        x = 78 + p * 16;
        y = 28 + t * 40;
      }
      if (path === "circle") {
        const a = t * Math.PI * 2 + p * 0.8;
        x = 100 + Math.cos(a) * (28 + speed * 3);
        y = 48 + Math.sin(a) * 18;
      }
      if (st.characterToLens === "toward" && path === "still") y = 68 - t * 24;
      if (st.characterToLens === "away" && path === "still") y = 36 + t * 20;
      const enter = st.bodyEnter;
      if (enter === "enters") x = 8 + t * (x - 8);
      if (enter === "leaves") x = x + t * (190 - x);
      const r = Math.min(10, 4 + Number(st.characterSpeed || 1));
      who.push({ x, y, r });
      bodies.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#1c1712"/>`);
    }
    let ox = 28;
    let oy = 70;
    const op = st.objectPath;
    const os = Number(st.objectSpeed) || 1;
    if (op === "slide" || op === "pass") ox = 16 + t * (20 + os * 28);
    if (op === "lift") oy = 70 - t * (8 + os * 8);
    if (op === "drop") oy = 24 + t * (8 + os * 8);
    if (op === "open") ox = 28 + t * 16;
    if (st.objectEnter === "enters") ox = -10 + t * (ox + 10);
    if (st.objectEnter === "leaves") ox = ox + t * 40;
    const obj =
      op === "still" && st.objectEnter === "stays"
        ? `<rect x="24" y="68" width="14" height="10" fill="none" stroke="#b8892d" stroke-width="2"/>`
        : `<rect x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="14" height="10" fill="#b8892d"/>`;
    /* Angle height moves the horizon: a low camera sees it low, a high one sees it high. Dutch tilts the stage. */
    const horizonY = { low: 80, eye: 50, high: 24, floor: 86, overhead: null }[st.angleHeight];
    const horizon = st.angleHeight
      ? horizonY == null
        ? `<path d="M0,30 H200 M0,60 H200 M66,0 V90 M133,0 V90" stroke="#1c1712" stroke-opacity="0.12" fill="none"/>`
        : `<line x1="0" y1="${horizonY}" x2="200" y2="${horizonY}" stroke="#1c1712" stroke-opacity="0.25" stroke-dasharray="3 3"/>`
      : "";
    const tilt = st.dutch === "tilted" ? ` transform="rotate(-8 100 45)"` : "";
    const L = lensDraw(st, who);
    if (!L) return `<svg class="stage ${esc(carry)}" viewBox="0 0 200 90" role="img" aria-label="Camera ${esc(carry)}, people ${esc(st.characterPath)}, object ${esc(op)}"><g${tilt}>${horizon}${cam}${bodies.join("")}${obj}</g></svg>`;
    /* With lens values: the set behind, the people with their clothes and feelings, the color over all of it,
       then the mood word and the comedy badge on top, outside the color so they stay readable. */
    const people = L.bodies != null ? L.bodies : bodies.join("");
    return `<svg class="stage lensed ${esc(carry)}" viewBox="0 0 200 90" role="img" aria-label="Camera ${esc(carry)}, people ${esc(st.characterPath)}, object ${esc(op)}${esc(L.aria)}">${L.defs}<g${tilt}><g${L.filter}>${L.back}${horizon}${cam}${people}${L.marks}${obj}</g>${L.over}</g>${L.labels}</svg>`;
  }

  /* Running automation sends the board only its own controls, so lens values (color, set, clothes, emotion,
     comedy) are read here from CurioAuto as it ticks, kept in memory (not saved), and drawn on top. */
  let lensAuto = null;
  let lensSig = "";
  let lensIdList = null;
  function lensIds() {
    if (lensIdList) return lensIdList;
    const own = new Set(live.map((c) => c.id).concat(["shotSize", "angleHeight", "dutch"]));
    const ids = new Set(LENS_COLOR.concat(LENS_SET, LENS_MAIN, LENS_BACK, LENS_EMO, LENS_COMEDY));
    (window.CURIOSITY_LENSES || []).forEach((l) => [l.main].concat(l.subs || []).forEach((id) => ids.add(id)));
    lensIdList = Array.from(ids).filter((id) => !own.has(id));
    return lensIdList;
  }
  function takeLens(panels) {
    const vals = {};
    if (panels)
      lensIds().forEach((id) => {
        if (panels.some((p) => p && p[id] != null && p[id] !== "")) vals[id] = panels.map((p) => (p ? p[id] : null));
      });
    const sig = JSON.stringify(vals);
    if (sig === lensSig) return;
    lensSig = sig;
    lensAuto = Object.keys(vals).length ? vals : null;
    drawBoard();
  }
  let lensLast = 0;
  function hookLensAuto() {
    const A = window.CurioAuto;
    if (!A || !A.on) return false;
    A.on((type, data) => {
      if (type === "tick") {
        const now = performance.now();
        if (now - lensLast < 125) return;
        lensLast = now;
        takeLens(data && data.panels);
      } else if (type === "change") {
        const running = A.running ? A.running().length : 0;
        lensLast = 0;
        takeLens(running ? A.resolve(Math.max(1, Number(state.angleCount) || 1)).panels : null);
      }
    });
    return true;
  }
  /* CurioAuto loads after this file. */
  if (!hookLensAuto()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hookLensAuto, { once: true });
    else setTimeout(hookLensAuto, 0);
  }

  /* A strand applied from the Shelf sets one value per panel, cycled when the strip is longer. */
  /* Running automation plays on top of the applied strand (a Shelf strand or a workspace's cells),
     so stopping it hands the panels back to what you set. */
  function panelState(i) {
    if (!state.applied && !state.auto && !lensAuto) return state;
    const st = Object.assign({}, state);
    [state.applied && state.applied.values, state.auto, lensAuto].forEach((layer) =>
      Object.entries(layer || {}).forEach(([id, vals]) => {
        const v = Array.isArray(vals) && vals.length ? vals[i % vals.length] : null;
        if (v != null && v !== "") st[id] = v;
      })
    );
    return st;
  }

  /* One comic panel. The Play tab draws its flip book with this too. */
  function panelHtml(line, i, count, st, people) {
    const bits = [];
    if (st.breath === "breath then speak" && line.text !== "—") bits.push("Breath.");
    if (st.eating === "eat then speak" && line.text !== "—") bits.push("Chews. Then:");
    if (st.eating === "speak while eating" && line.text !== "—") bits.push("Mouth full.");
    const motion =
      st.envMotion === "still"
        ? ""
        : st.envMotion === "wind"
          ? "The air moves."
          : st.envMotion === "crowd"
            ? "People pass behind."
            : st.envMotion === "water"
              ? "Water in the frame."
              : "The room is going somewhere.";
    const temp = st.temperature === "mild" ? "" : st.temperature === "cold" ? "Cold." : "Hot.";
    const cut =
      st.angleChange === "on the action"
        ? "Cut on the action."
        : st.angleChange === "both"
          ? "Cut on the line and the action."
          : st.angleChange === "locked"
            ? "Angle held."
            : "Cut on the line.";
    const exit =
      i === count - 1 && st.exit === "leave"
        ? "They take the bag. No body."
        : i === count - 1 && st.exit === "die"
          ? "The hour ends them."
          : "";
    const moveLine = [st.cameraCarry, st.cameraMove, "follows " + st.moveFollows].join(" · ");
    const quiet = shotWord(i, st) === "close" ? Math.max(11, volumeSize(i, st) - 4) : volumeSize(i, st);
    return `<figure class="panel ${esc(st.lighting)} ${esc(st.temperature)}">
      <header><span>SC ${String(i + 1).padStart(2, "0")}${st.emotion ? " · " + esc(st.emotion) : ""}</span><span>${esc([st.angleHeight && st.angleHeight !== "eye" ? st.angleHeight : "", angleLabel(i, st)].filter(Boolean).join(" "))}</span></header>
      ${stageSvg(i, count, st)}
      ${lensLine(st)}
      <p class="cap">${esc([moveLine, st.characterPath, st.objectKind + " " + st.objectPath, temp, motion, cut, bits.join(" "), people.join(", "), exit].filter(Boolean).join(" "))}</p>
      <p class="balloon" style="font-size:${quiet}px"><strong>${esc(line.who)}</strong> ${esc(line.text)}</p>
    </figure>`;
  }

  function appliedNote() {
    if (!state.applied && !state.auto) return "";
    const names = (vals) =>
      Object.keys(vals || {})
        .map((id) => (CURIOSITIES.find((c) => c.id === id) || { label: id }).label)
        .join(", ");
    const parts = [];
    if (state.applied && Object.keys(state.applied.values).length) parts.push(`From <strong>${esc(state.applied.label)}</strong>, panel by panel: ${esc(names(state.applied.values))}.`);
    if (state.auto && Object.keys(state.auto).length) parts.push(`<strong>Automation</strong>, panel by panel: ${esc(names(state.auto))}.`);
    if (!parts.length) return "";
    return `<p class="applied">${parts.join(" ")}
      <button type="button" id="clear-applied">Clear</button></p>`;
  }

  /* The suites this scene looks through, by degree: the share of each suite's lenses the panels show, on
     average, with the best panel. Lens suites (no fixed values) list their members' values side by side. */
  function suitesHere(panels) {
    const CS = window.CuriositySuites;
    if (!CS) return "";
    CS.sync();
    const rows = SUITES.filter((x) => CS.fixed(x))
      .map((x) => ({ x, m: CS.across(x, panels) }))
      .filter((r) => r.m.peak > 0)
      .sort((a, b) => b.m.mean - a.m.mean || b.m.peak - a.m.peak)
      .slice(0, 8);
    const lensRows = SUITES.filter((x) => (x.kind || "") === "lens" && CS.members(x).filter((id) => panels.some((p) => p[id] != null && p[id] !== "")).length >= 2);
    if (!rows.length && !lensRows.length) return `<p class="cap">No suite shows in these panels yet.</p>`;
    const peakNote = (m) => (panels.length > 1 && m.peak > m.mean ? `best on panel ${m.best + 1}: ${CS.pct(m.peak)}` : "");
    return `<div class="suite-list"><p class="cap">Suites in these panels, by how much of each one shows (average across ${panels.length} panel${panels.length === 1 ? "" : "s"}):</p>
      ${rows.map((r) => CS.html(r.x, r.m, peakNote(r.m))).join("")}
      ${lensRows.map((x) => `<span class="suite-share"><b>${esc(x.label)}</b> ${CS.side(x, panels[0], labelOf)}</span>`).join("")}</div>`;
  }

  function drawBoard() {
    const s = scene();
    const count = Math.max(1, Number(state.angleCount) || 1);
    const people = s.people.slice(0, Number(state.peopleCount) || 1);
    const lines = s.lines.slice(0, count);
    while (lines.length < count) lines.push(s.lines[lines.length % s.lines.length]);
    const panels = lines.map((line, i) => panelHtml(line, i, lines.length, panelState(i), people)).join("");
    const fired = PROXIMITIES.filter((p) => p.test && lines.some((_, i) => p.test(panelState(i), shotWord(i, panelState(i)))))
      .map((p) => `When ${p.when}, ${p.then} within ${p.within} beat${p.within === 1 ? "" : "s"}.`)
      .join(" ");
    const chips = live
      .map(
        (c) =>
          `<button type="button" data-focus="${c.id}">${esc(c.label)}: ${esc(state[c.id])}</button>`
      )
      .join("");
    board.innerHTML = `
      <h2>${esc(s.title)}</h2>
      <p class="cap">${esc(s.slug)}. ${esc(s.action)} Mains in the hour: ${esc(state.mains)}. Groups: ${esc(state.groups)}.</p>
      ${appliedNote()}
      <div class="strip">${panels}</div>
      <p class="to-sb"><button type="button" id="to-storyboard">Save into the storyboard</button> <span class="cap">Keeps these ${lines.length} panels as a new scene in the Storyboard and takes you there, to flip through.</span></p>
      <p class="prox">${fired ? esc(fired) : "No seed proximity is firing. Change the carry, the path, or whether an object enters."}</p>
      ${suitesHere(lines.map((_, i) => panelState(i)))}
      <div class="lineage" id="lineage">${chips}</div>
      <p class="cap">The chips are the combination that made this board. Change one and the strip changes. That is the same device as opening a song or a shot to see which ideas parented it.</p>`;
    const clear = document.getElementById("clear-applied");
    if (clear)
      clear.onclick = () => {
        state.applied = null;
        state.auto = null;
        save();
        drawBoard();
        notify();
      };
    /* Save into the storyboard: open the Storyboard page and save My film there as a new scene. */
    document.getElementById("to-storyboard").onclick = () => {
      const W = window.CuriosityWorkspaces;
      if (!W || !W.open) return;
      W.open("storyboard");
      const save = document.querySelector('#workspace [data-sb="save"]');
      if (!save) return;
      const into = document.querySelector('#workspace [data-sb="into"]');
      if (into) into.value = "new";
      save.click();
      const box = document.querySelector('#workspace [data-sb="body"]') || save;
      if (box.scrollIntoView) box.scrollIntoView({ block: "start" });
    };
    document.getElementById("lineage").onclick = (e) => {
      const b = e.target.closest("button[data-focus]");
      if (!b) return;
      const el = controls.querySelector(`[data-id="${b.dataset.focus}"]`);
      if (el) el.focus();
    };
  }

  /* Jeremy's test for every curiosity, from the music app: can it be extracted, applied,
     expanded, automated, and what game and gizmo would make changing it fun.
     The first four are measured from this folder. Game and gizmo are design cells. */
  const NOTES_KEY = "curiosities-catalog-notes-v1";
  /* Not a control, but a Shelf strand can set it per panel. */
  const BOARD_ALSO_PLAYS = ["shotSize"];

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function measured(c) {
    const recordable = c.kind === "select" || c.kind === "range" || c.kind === "tag";
    return {
      extract: recordable ? "yes" : "not yet",
      apply: c.live || BOARD_ALSO_PLAYS.includes(c.id) ? "yes" : "not yet",
      expand: c.live || BOARD_ALSO_PLAYS.includes(c.id) ? "swap" : "not yet",
      automate: "not yet",
    };
  }

  /* Slider rows from the curiosity database ("music.tempo", sliderOf: "music") sit under their lens, folded,
     so the list stays short. A search that matches a slider opens its lens. */
  const catView = { tab: "curiosities", q: "", group: "", fold: {} };

  function drawCatalog() {
    const tabs = [
      ["curiosities", `Curiosities (${CURIOSITIES.filter((c) => !c.sliderOf).length})`],
      ["suites", `Suites (${SUITES.length})`],
      ["proximities", `Proximities (${PROXIMITIES.length + LIBRARY.proximities.length})`],
      ["moves", `Development moves (${LIBRARY.moves.length})`],
    ];
    catalog.innerHTML = `<h2>The Curiosities library</h2>
      <p class="cap">Everything in the filmmaking catalog, in the three categories: curiosities, suites and proximities, plus the development moves that change a motif.</p>
      <nav class="subtabs">${tabs.map(([k, l]) => `<button type="button" data-cat="${k}" class="${catView.tab === k ? "on" : ""}">${esc(l)}</button>`).join("")}</nav>
      <div id="cat-body"></div>`;
    drawCatalogBody();
    catalog.onclick = (e) => {
      const fold = e.target.closest("button[data-cat-fold]");
      if (fold) {
        const id = fold.dataset.catFold;
        catView.fold[id] = fold.getAttribute("aria-expanded") !== "true";
        drawCatalogRows();
        const again = catalog.querySelector(`button[data-cat-fold="${CSS.escape(id)}"]`);
        if (again) again.focus();
        return;
      }
      const b = e.target.closest("button[data-cat]");
      if (!b) return;
      catView.tab = b.dataset.cat;
      drawCatalog();
    };
    catalog.oninput = (e) => {
      const t = e.target;
      if (t.id === "cat-q") {
        catView.q = t.value;
        drawCatalogRows();
        return;
      }
      if (!t.dataset.note) return;
      const all = loadNotes();
      all[t.dataset.note] = Object.assign({}, all[t.dataset.note], { [t.dataset.col]: t.value });
      try {
        localStorage.setItem(NOTES_KEY, JSON.stringify(all));
      } catch (err) {}
    };
    catalog.onchange = (e) => {
      if (e.target.id !== "cat-group") return;
      catView.group = e.target.value;
      drawCatalogRows();
    };
  }

  function drawCatalogBody() {
    const body = document.getElementById("cat-body");
    if (catView.tab === "curiosities") {
      const groups = [];
      CURIOSITIES.forEach((c) => {
        if (!groups.includes(c.group)) groups.push(c.group);
      });
      body.innerHTML = `<p class="cap">Extract: a study can record it. Apply: the board can play it. Expand: a Shelf strand can swap it in, panel by panel; variations come later. Automate: no lanes yet. Game and gizmo are yours and Sharani’s to fill in; they save in this browser.</p>
        <div class="prox-form">
          <label class="field">Search <input id="cat-q" value="${esc(catView.q)}" placeholder="camera, emotion, rain…" /></label>
          <label class="field">Group <select id="cat-group"><option value="">All groups</option>${groups.map((g) => `<option ${g === catView.group ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></label>
        </div>
        <div id="cat-rows"></div>`;
      drawCatalogRows();
      return;
    }
    if (catView.tab === "suites") {
      if (window.CuriositySuites) window.CuriositySuites.sync();
      const kinds = [
        ["", "Suites"],
        ["genre", "Genres"],
        ["emotion", "Angle by emotion"],
        ["lens", "Lens suites: lenses you look through together"],
      ];
      body.innerHTML =
        `<p class="cap">A suite is a group of lenses (curiosities) you look through together. A beat matches it by degree: the share of its lenses that show, from 0 to 100%. Play one from the Board’s Suite menu, or see how much of it each beat shows in Study. A lens suite names no values; it only groups lenses.</p>` +
        kinds
          .map(
            ([k, title]) => `<p class="g">${esc(title)}</p><div class="scroll"><table class="trace"><tbody>${SUITES.filter((x) => (x.kind || "") === k)
              .map((x) => `<tr><td><strong>${esc(x.label)}</strong><br><span class="cap">${esc(x.note)}</span></td><td>${Object.keys(x.set || {}).length ? Object.entries(x.set).map(([id, v]) => `<span class="chip">${esc(labelOf(id))}: ${esc(v)}</span>`).join("") : (x.lenses || []).map((id) => `<span class="chip">${esc(labelOf(id))}</span>`).join("")}</td></tr>`)
              .join("")}</tbody></table></div>`
          )
          .join("");
      return;
    }
    if (catView.tab === "proximities") {
      const counted = PROXIMITIES.map(
        (p) => `<tr><td>When ${esc(p.when)}, ${esc(p.then)}</td><td class="mono">${p.within}</td><td class="cap">counted in Study</td></tr>`
      ).join("");
      const text = LIBRARY.proximities.map(
        (p) => `<tr><td>When ${esc(p.when)}, ${esc(p.then)}</td><td class="mono">${p.within}</td><td class="cap">${esc(p.source)}${p.source === "suite" ? "" : " · a guess until counted"}</td></tr>`
      ).join("");
      body.innerHTML = `<p class="cap">When X happens, Y follows within N beats. The first table can be counted in Study today. The second is the catalog’s full list; every row is a guess until we count it in works we curate.</p>
        <p class="g">Countable now</p><div class="scroll"><table class="trace"><thead><tr><th>Proximity</th><th>Within</th><th></th></tr></thead><tbody>${counted}</tbody></table></div>
        <p class="g">The catalog’s list</p><div class="scroll"><table class="trace"><thead><tr><th>Proximity</th><th>Within</th><th>Source</th></tr></thead><tbody>${text}</tbody></table></div>`;
      return;
    }
    body.innerHTML = `<p class="cap">The Bach and Beethoven moves, treated as curiosities too. Run through “A is to B as C is to D”, a move read from a curated work is applied to our motif. Not playable yet.</p>
      <div class="scroll"><table class="trace"><tbody>${LIBRARY.moves.map((m) => `<tr><td><strong>${esc(m.label)}</strong></td><td>${esc(m.does)}</td><td class="cap">${esc(m.source)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function labelOf(id) {
    return (CURIOSITIES.find((c) => c.id === id) || { label: id }).label;
  }

  function catalogCss() {
    if (document.getElementById("cat-fold-style")) return;
    const st = document.createElement("style");
    st.id = "cat-fold-style";
    st.textContent = `
      .catalog .cat-fold { margin-top: 4px; font-family: var(--mono); font-size: 11px; border: 1px solid var(--ink); background: var(--panel); padding: 3px 8px; cursor: pointer; }
      .catalog .cat-fold[aria-expanded="true"] { background: var(--ink); color: var(--paper); }
      .catalog .cat-fold:focus-visible { outline: 3px solid var(--saffron); outline-offset: 2px; }
      .catalog tr.cat-sub td:first-child { padding-left: 22px; border-left: 3px solid var(--gold); }
      .catalog tr.cat-sub strong { font-weight: 500; }
      .catalog .cat-submark { font-family: var(--mono); color: #8a8075; }
    `;
    document.head.appendChild(st);
  }

  function drawCatalogRows() {
    const out = document.getElementById("cat-rows");
    if (!out) return;
    catalogCss();
    const notes = loadNotes();
    const q = catView.q.trim().toLowerCase();
    const hit = (c) => !q || [c.id, c.label, c.note, c.view, c.group].filter(Boolean).join(" ").toLowerCase().includes(q);
    const ids = new Set(CURIOSITIES.map((c) => c.id));
    const isSub = (c) => !!(c.sliderOf && ids.has(c.sliderOf));
    const subsOf = {};
    CURIOSITIES.forEach((c) => isSub(c) && (subsOf[c.sliderOf] = subsOf[c.sliderOf] || []).push(c));
    const subCount = CURIOSITIES.filter(isSub).length;
    const shown = CURIOSITIES.filter(
      (c) => !isSub(c) && (!catView.group || c.group === catView.group) && (hit(c) || (q && (subsOf[c.id] || []).some(hit)))
    );
    const groups = [];
    shown.forEach((c) => {
      if (!groups.includes(c.group)) groups.push(c.group);
    });
    const cell = (v) => `<td class="m ${v === "yes" ? "yes" : v === "swap" ? "part" : "no"}">${esc(v)}</td>`;
    const values = (c) =>
      c.kind === "range" ? `${c.min} to ${c.max}` : c.kind === "select" ? c.options.join(", ") : c.kind === "tag" ? "a word" : "";
    const oneRow = (c, sub) => {
      const m = measured(c);
      const n = notes[c.id] || {};
      const kids = sub ? [] : subsOf[c.id] || [];
      const open = kids.length > 0 && (c.id in catView.fold ? catView.fold[c.id] : !!q && kids.some(hit));
      const fold = kids.length
        ? `<br><button type="button" class="cat-fold" data-cat-fold="${esc(c.id)}" aria-expanded="${open ? "true" : "false"}">${open ? "▾ Hide" : "▸ Show"} its ${kids.length} slider${kids.length === 1 ? "" : "s"}</button>`
        : "";
      const row = `<tr class="${sub ? "cat-sub" : ""}"><td>${sub ? `<span class="cat-submark" aria-hidden="true">└</span> ` : ""}<strong>${esc(c.label)}</strong> <span class="mono cap">${esc(c.id)}</span><br><span class="cap">${esc(c.view || c.note)}</span><br><span class="cap">${esc(values(c))}${c.source ? " · " + esc(c.source) : ""}</span>${fold}</td>
                ${cell(m.extract)}${cell(m.apply)}${cell(m.expand)}${cell(m.automate)}
                <td><input class="note" data-note="${c.id}" data-col="game" value="${esc(n.game || "")}" placeholder="game" aria-label="Game for ${esc(c.label)}" /></td>
                <td><input class="note" data-note="${c.id}" data-col="gizmo" value="${esc(n.gizmo || "")}" placeholder="gizmo" aria-label="Gizmo for ${esc(c.label)}" /></td></tr>`;
      return row + (open ? kids.filter((k) => !q || hit(k) || catView.fold[c.id]).map((k) => oneRow(k, true)).join("") : "");
    };
    out.innerHTML =
      `<p class="cap">${shown.length} of ${CURIOSITIES.length - subCount}${subCount ? `, plus ${subCount} sliders folded under their lens (tap Show on a row to open them)` : ""}.</p>` +
      groups
        .map((g) => {
          const rows = shown
            .filter((c) => c.group === g)
            .map((c) => oneRow(c, false))
            .join("");
          return `<p class="g">${esc(g)}</p>
            <div class="scroll"><table class="six"><thead><tr><th>Curiosity</th><th>Extract</th><th>Apply</th><th>Expand</th><th>Automate</th><th>Game</th><th>Gizmo</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        })
        .join("");
  }

  function drawRef() {
    const rows = REFERENCE.other.hours
      .map((h) => `<tr><td>${esc(h.id)}</td><td>${esc(h.measure)}</td></tr>`)
      .join("");
    const ledger = REFERENCE.ours.ledger
      .map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.status)}</td><td>${esc(p.hours)}</td></tr>`)
      .join("");
    ref.innerHTML = `
      <h2>How often, and with whom</h2>
      <p><strong>${esc(REFERENCE.ours.name)}.</strong> ${esc(REFERENCE.ours.mains)} ${esc(REFERENCE.ours.groups)} ${esc(REFERENCE.ours.exits)} ${esc(REFERENCE.ours.season)}</p>
      <table><thead><tr><th>Person</th><th>Exit</th><th>Where they are</th></tr></thead><tbody>${ledger}</tbody></table>
      <h2>${esc(REFERENCE.other.name)}</h2>
      <p>${esc(REFERENCE.other.exits)} ${esc(REFERENCE.other.groups)} ${esc(REFERENCE.other.mains)}</p>
      <table><thead><tr><th>Hour, as a measurement</th><th>What the shape does</th></tr></thead><tbody>${rows}</tbody></table>
      <p>These rows measure companies and exits. They do not retell the hours.</p>`;
  }

  const listeners = [];
  function notify() {
    listeners.slice().forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
  }

  /* The study view reads the board and applies Shelf strands to it through this. */
  window.CuriosityBoard = {
    scene() {
      return scene();
    },
    panel(line, i, count, values) {
      return panelHtml(line, i, count, Object.assign({}, state, values), scene().people.slice(0, Number(state.peopleCount) || 1));
    },
    values() {
      const out = {};
      live.forEach((c) => (out[c.id] = state[c.id]));
      return out;
    },
    apply(label, values) {
      if (label === "Automation") state.auto = values && Object.keys(values).length ? values : null;
      else state.applied = values && Object.keys(values).length ? { label, values } : null;
      save();
      drawBoard();
      notify();
    },
    /* The strand under the automation: {label, values} or null. */
    applied() {
      return state.applied ? { label: state.applied.label, values: JSON.parse(JSON.stringify(state.applied.values)) } : null;
    },
    /* How many panels the strip shows. */
    count() {
      return Math.max(1, Number(state.angleCount) || 1);
    },
    /* What each panel actually plays: the controls, then the applied strand, then automation. */
    panels() {
      return Array.from({ length: Math.max(1, Number(state.angleCount) || 1) }, (_, i) => Object.assign({}, panelState(i)));
    },
    /* Set one control for the whole scene, as if moved by hand. */
    set(id, value) {
      if (!live.find((c) => c.id === id)) return;
      state[id] = value;
      unapply(id);
      save();
      drawControls();
      drawBoard();
      notify();
    },
    on(fn) {
      listeners.push(fn);
      return () => listeners.splice(listeners.indexOf(fn), 1);
    },
    playSuite(id) {
      const suite = SUITES.find((s) => s.id === id);
      if (!suite) return;
      state.suite = id;
      Object.assign(state, suite.set);
      Object.keys(suite.set).forEach(unapply);
      save();
      drawControls();
      drawBoard();
    },
  };

  drawControls();
  drawBoard();
  drawCatalog();
  drawRef();
})();
