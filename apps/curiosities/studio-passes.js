/* Passes: Arnold splits a render into AOVs (beauty, diffuse, specular, light groups, cryptomatte);
   this tool splits a scene into curiosity passes, one per catalog group. Render Setup layers
   become named sets of overrides ("Night version", "Comic version") that each set one curiosity
   to one value, on every panel or on the panels you tick. Solo and mute a pass like a layer,
   click a cell for an id matte of every panel that shares that value, and see which suites and
   proximities the layer lights up, like a light group's contributions. */

(function () {
  if (!window.CuriosityStudio) return;
  const KEY = "curiosities-studio-passes-v1";
  const PANELS = 4;
  const DEFAULT_LAYERS = [
    { name: "Night version", overrides: [
      { id: "lighting", value: "moon", panels: [true, true, true, true] },
      { id: "temperature", value: "cold", panels: [true, true, true, true] },
      { id: "envMotion", value: "wind", panels: [false, true, false, true] },
    ] },
    { name: "Comic version", overrides: [
      { id: "angleFamily", value: "montage", panels: [true, true, true, true] },
      { id: "cameraCarry", value: "locked", panels: [true, true, true, true] },
      { id: "volume", value: 5, panels: [false, false, true, true] },
    ] },
    { name: "Handheld version", overrides: [
      { id: "cameraCarry", value: "handheld", panels: [true, true, true, true] },
      { id: "angleFamily", value: "handheld", panels: [true, true, true, true] },
      { id: "moveSpeed", value: 4, panels: [false, true, true, false] },
    ] },
  ];
  const DEFAULTS = { layers: DEFAULT_LAYERS, current: 0, muted: {}, solo: null, matte: null, draft: { id: "lighting" } };

  function cats() {
    return typeof CURIOSITIES !== "undefined" ? CURIOSITIES : [];
  }
  function cat(id) {
    return cats().find((c) => c.id === id);
  }
  function groupsOf() {
    const g = [];
    cats().forEach((c) => {
      if (!g.includes(c.group)) g.push(c.group);
    });
    return g;
  }
  function hue(v) {
    const s = String(v);
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 360;
  }
  function optionsFor(c) {
    if (!c) return [];
    if (c.options) return c.options.slice();
    if (c.kind === "range") {
      const out = [];
      for (let v = c.min; v <= c.max; v++) out.push(v);
      return out;
    }
    return [];
  }

  /* Which overrides apply after solo and mute. */
  function activeOverrides(s, layer) {
    if (!layer) return [];
    return layer.overrides.filter((o) => {
      const c = cat(o.id);
      const g = c ? c.group : "Other";
      if (s.solo) return g === s.solo;
      return !s.muted[g];
    });
  }

  /* One values object per panel: the board, then the layer's overrides on their panels. */
  function panelValues(s, base) {
    const layer = s.layers[s.current];
    const ov = activeOverrides(s, layer);
    const out = [];
    for (let i = 0; i < PANELS; i++) {
      const v = Object.assign({}, base);
      ov.forEach((o) => {
        if (!o.panels || o.panels[i]) v[o.id] = o.value;
      });
      out.push(v);
    }
    return out;
  }

  function suiteFires(suite, v) {
    const keys = Object.keys(suite.set);
    const known = keys.filter((k) => v[k] !== undefined);
    const hit = known.filter((k) => String(v[k]) === String(suite.set[k]));
    return { full: known.length === keys.length && hit.length === keys.length, hit: hit.length, total: keys.length };
  }

  function draw(el, api) {
    const esc = api.esc;
    const st = api.store(KEY);
    const s = Object.assign({}, DEFAULTS, st.get({}));
    if (!Array.isArray(s.layers)) s.layers = DEFAULT_LAYERS;
    if (s.current >= s.layers.length) s.current = -1;
    const save = () => st.set(s);
    const redraw = () => {
      save();
      draw(el, api);
    };
    if (!document.getElementById("studio-passes-style")) {
      const style = document.createElement("style");
      style.id = "studio-passes-style";
      style.textContent = `
        .passes-strip { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 8px; overflow-x: auto; }
        .passes-strip .pp { position: relative; }
        .passes-strip .pp.dim { opacity: 0.25; }
        .passes-strip .pp.hit { outline: 3px solid var(--saffron, #c45c26); outline-offset: 2px; }
        .passes-strip figure { margin: 0; }
        .pass { border-top: 1px solid var(--line, #ddd); padding: 6px 0; }
        .pass.off { opacity: 0.4; }
        .pass-head { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-family: var(--mono, monospace); font-size: 12px; }
        .pass-head strong { min-width: 90px; }
        .pass-head button { font-size: 11px; padding: 1px 6px; }
        .pass-head button.on { background: var(--ink, #1c1712); color: var(--paper, #f7efe2); }
        .pass-row { display: grid; grid-template-columns: minmax(90px, 140px) repeat(4, 1fr); gap: 3px; margin: 3px 0; align-items: stretch; }
        .pass-row .lab { font-size: 11px; font-family: var(--mono, monospace); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pass-cell { font-size: 11px; font-family: var(--mono, monospace); border: 1px solid rgba(28,23,18,0.15); padding: 2px 4px; cursor: pointer; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1c1712; }
        .pass-cell.ov { border: 2px solid var(--saffron, #c45c26); }
        .pass-cell.matte { box-shadow: inset 0 0 0 2px #1c1712; font-weight: 700; }
        .pass-cell.unmatte { opacity: 0.3; }
        .layer-bar { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
        .layer-bar button.on { background: var(--ink, #1c1712); color: var(--paper, #f7efe2); }
        .ov-list td { font-size: 12px; }
        @media (max-width: 760px) { .passes-strip { grid-template-columns: repeat(4, 160px); } }
      `;
      document.head.appendChild(style);
    }
    const board = api.board;
    if (!board) {
      el.innerHTML = "<p>The board is not loaded.</p>";
      return;
    }
    const base = board.values();
    const scene = board.scene();
    const lines = scene.lines.slice(0, PANELS);
    while (lines.length < PANELS) lines.push(scene.lines[lines.length % scene.lines.length]);
    const pv = panelValues(s, base);
    const layer = s.layers[s.current];
    const overridden = (id, i) => layer && activeOverrides(s, layer).some((o) => o.id === id && (!o.panels || o.panels[i]));
    const matte = s.matte;
    const matteHit = (i) => matte && String(pv[i][matte.id]) === String(matte.value);

    /* Beauty: the composite strip. */
    const strip = lines
      .map((line, i) => `<div class="pp ${matte ? (matteHit(i) ? "hit" : "dim") : ""}">${board.panel(line, i, PANELS, pv[i])}</div>`)
      .join("");

    /* AOV stack: one pass per catalog group, a row per curiosity that has a value. */
    const passes = groupsOf()
      .map((g) => {
        const rows = cats().filter((c) => c.group === g && pv.some((v) => v[c.id] !== undefined));
        const off = s.solo ? s.solo !== g : !!s.muted[g];
        const body = rows.length
          ? rows
              .map((c) => {
                const cells = pv
                  .map((v, i) => {
                    const val = v[c.id];
                    const isM = matte && matte.id === c.id;
                    const cls = ["pass-cell", overridden(c.id, i) ? "ov" : "", isM ? (String(val) === String(matte.value) ? "matte" : "unmatte") : ""].join(" ");
                    return `<button type="button" class="${cls}" data-matte="${esc(c.id)}" data-val="${esc(val)}" style="background:hsl(${hue(val)},45%,82%)" title="${esc(c.label)}: ${esc(val)}">${esc(val)}</button>`;
                  })
                  .join("");
                return `<div class="pass-row"><span class="lab" title="${esc(c.label)}">${esc(c.id)}</span>${cells}</div>`;
              })
              .join("")
          : `<p class="cap">No value on the board for this pass. Add an override to fill it.</p>`;
        return `<div class="pass ${off ? "off" : ""}">
          <div class="pass-head"><strong>${esc(g)}</strong>
            <button type="button" data-solo="${esc(g)}" class="${s.solo === g ? "on" : ""}">S</button>
            <button type="button" data-mute="${esc(g)}" class="${s.muted[g] ? "on" : ""}">M</button>
            <span class="cap">${rows.length} curiosit${rows.length === 1 ? "y" : "ies"}</span></div>
          ${body}</div>`;
      })
      .join("");

    /* Light groups: suites and proximities and what each panel contributes. */
    const suiteRows = SUITES.map((su) => {
      const per = pv.map((v) => suiteFires(su, v));
      const full = per.map((p, i) => (p.full ? i + 1 : null)).filter(Boolean);
      const best = Math.max(...per.map((p) => p.hit));
      return { su, full, best, total: per[0].total };
    })
      .filter((r) => r.full.length || r.best > 0)
      .sort((a, b) => b.full.length - a.full.length || b.best / b.total - a.best / a.total)
      .slice(0, 14);
    const proxRows = PROXIMITIES.filter((p) => p.test).map((p) => {
      const on = pv.map((v, i) => (p.test(v, v.shotSize) ? i + 1 : null)).filter(Boolean);
      return { p, on };
    });

    const allIds = cats().filter((c) => optionsFor(c).length);
    const draftC = cat(s.draft.id) || allIds[0];
    const draftOpts = optionsFor(draftC);

    el.innerHTML = `
      <div class="layer-bar">
        <button type="button" data-layer="-1" class="${s.current === -1 ? "on" : ""}">masterLayer</button>
        ${s.layers.map((l, i) => `<button type="button" data-layer="${i}" class="${i === s.current ? "on" : ""}">${esc(l.name)} (${l.overrides.length})</button>`).join("")}
        <button type="button" id="passes-new">+ New layer</button>
      </div>
      <p class="cap">Beauty: ${esc(scene.title)}, four panels, the board's values with ${layer ? `the overrides of <strong>${esc(layer.name)}</strong>` : "no overrides (master layer)"}${s.solo ? `, soloed to ${esc(s.solo)}` : ""}${matte ? `. Id matte on ${esc(matte.id)} = ${esc(matte.value)}: panels ${pv.map((_, i) => (matteHit(i) ? i + 1 : null)).filter(Boolean).join(", ") || "none"}. <button type="button" id="passes-clear-matte">Clear matte</button>` : ""}</p>
      <div class="passes-strip">${strip}</div>
      <div class="studio-grid" style="margin-top:12px">
        <div>
          ${layer ? `
          <label class="field">Layer name<input id="passes-name" value="${esc(layer.name)}" maxlength="40"></label>
          <table class="trace ov-list"><thead><tr><th>Override</th><th>Value</th><th>Panels</th><th></th></tr></thead><tbody>
            ${layer.overrides.map((o, k) => `<tr><td>${esc(o.id)}${cat(o.id) && cat(o.id).live ? "" : " <span class='cap'>(studio)</span>"}</td><td>${esc(o.value)}</td><td>${(o.panels || [true, true, true, true]).map((p, i) => `<input type="checkbox" data-op="${k}" data-pi="${i}" ${p ? "checked" : ""} title="Panel ${i + 1}">`).join("")}</td><td><button type="button" data-del="${k}">x</button></td></tr>`).join("") || `<tr><td colspan="4" class="cap">No overrides yet.</td></tr>`}
          </tbody></table>
          <label class="field">Override curiosity<select id="passes-draft-id">${groupsOf()
            .map((g) => `<optgroup label="${esc(g)}">${allIds.filter((c) => c.group === g).map((c) => `<option value="${esc(c.id)}" ${draftC && c.id === draftC.id ? "selected" : ""}>${esc(c.label)}${c.live ? "" : " (studio)"}</option>`).join("")}</optgroup>`)
            .join("")}</select></label>
          <label class="field">Value<select id="passes-draft-val">${draftOpts.map((v) => `<option>${esc(v)}</option>`).join("")}</select></label>
          <p><button type="button" id="passes-add">Add override</button>
          <button type="button" id="passes-send">Send layer to board</button>
          <button type="button" id="passes-delete">Delete layer</button></p>
          <p class="cap">Only curiosities live on the board go to it, one value per panel. Studio ones stay here and still count toward suites.</p>` : `<p class="cap">The master layer has no overrides. Pick or make a layer to override curiosities.</p>`}
          <h3>Light groups</h3>
          <p class="cap">Which suites fire on which panels (every key matched), and which sparks' seed tests hold.</p>
          <table class="trace"><thead><tr><th>Suite</th><th>Panels firing</th><th>Keys matched</th></tr></thead><tbody>
            ${suiteRows.map((r) => `<tr><td><span class="chip ${r.full.length ? "lit" : "suite"}">${esc(r.su.label)}</span></td><td>${r.full.join(", ") || "none"}</td><td>${r.best}/${r.total}</td></tr>`).join("") || `<tr><td colspan="3" class="cap">No suite keys match.</td></tr>`}
          </tbody></table>
          <table class="trace"><thead><tr><th>Spark</th><th>Holds on panels</th></tr></thead><tbody>
            ${proxRows.map((r) => `<tr><td>When ${esc(r.p.when)}, ${esc(r.p.then)} within ${r.p.within}</td><td>${r.on.length ? `<span class="chip lit">${r.on.join(", ")}</span>` : "none"}</td></tr>`).join("")}
          </tbody></table>
        </div>
        <div>
          <h3>Passes</h3>
          <p class="cap">One pass per curiosity group, one cell per panel, colored by value. Orange border: set by an override. S solos a pass (only its overrides apply), M mutes it (its overrides drop out). Click a cell for an id matte.</p>
          ${passes}
        </div>
      </div>`;

    el.querySelectorAll("[data-layer]").forEach((b) =>
      b.addEventListener("click", () => {
        s.current = Number(b.dataset.layer);
        redraw();
      })
    );
    el.querySelector("#passes-new").addEventListener("click", () => {
      s.layers.push({ name: "Layer " + (s.layers.length + 1), overrides: [] });
      s.current = s.layers.length - 1;
      redraw();
    });
    el.querySelectorAll("[data-solo]").forEach((b) =>
      b.addEventListener("click", () => {
        s.solo = s.solo === b.dataset.solo ? null : b.dataset.solo;
        redraw();
      })
    );
    el.querySelectorAll("[data-mute]").forEach((b) =>
      b.addEventListener("click", () => {
        const g = b.dataset.mute;
        s.muted = Object.assign({}, s.muted, { [g]: !s.muted[g] });
        redraw();
      })
    );
    el.querySelectorAll("[data-matte]").forEach((b) =>
      b.addEventListener("click", () => {
        const m = { id: b.dataset.matte, value: b.dataset.val };
        s.matte = s.matte && s.matte.id === m.id && s.matte.value === m.value ? null : m;
        redraw();
      })
    );
    const clear = el.querySelector("#passes-clear-matte");
    if (clear) clear.addEventListener("click", () => {
      s.matte = null;
      redraw();
    });
    if (!layer) return;
    el.querySelector("#passes-name").addEventListener("change", (e) => {
      layer.name = e.target.value.trim() || layer.name;
      redraw();
    });
    el.querySelectorAll("[data-op]").forEach((x) =>
      x.addEventListener("change", () => {
        const o = layer.overrides[Number(x.dataset.op)];
        o.panels = (o.panels || [true, true, true, true]).slice();
        o.panels[Number(x.dataset.pi)] = x.checked;
        redraw();
      })
    );
    el.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        layer.overrides.splice(Number(b.dataset.del), 1);
        redraw();
      })
    );
    el.querySelector("#passes-draft-id").addEventListener("change", (e) => {
      s.draft = { id: e.target.value };
      redraw();
    });
    el.querySelector("#passes-add").addEventListener("click", () => {
      const raw = el.querySelector("#passes-draft-val").value;
      if (!draftC || raw === "") return;
      const value = draftC.kind === "range" ? Number(raw) : raw;
      const existing = layer.overrides.find((o) => o.id === draftC.id);
      if (existing) existing.value = value;
      else layer.overrides.push({ id: draftC.id, value, panels: [true, true, true, true] });
      redraw();
    });
    el.querySelector("#passes-delete").addEventListener("click", () => {
      s.layers.splice(s.current, 1);
      s.current = s.layers.length ? 0 : -1;
      s.matte = null;
      redraw();
    });
    el.querySelector("#passes-send").addEventListener("click", () => {
      const out = {};
      activeOverrides(s, layer).forEach((o) => {
        const c = cat(o.id);
        if (!c || !c.live) return;
        out[o.id] = pv.map((v) => v[o.id]);
      });
      save();
      api.toBoard(layer.name, out);
    });
  }

  window.CuriosityStudio.register({ id: "passes", label: "Passes", order: 60, maya: "Render Setup layers and Arnold AOVs (beauty, diffuse, specular, light groups, cryptomatte), overrides", draw });
})();
