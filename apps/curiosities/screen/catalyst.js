/* screen/catalyst.js: the Catalyst window (window.CurioCatalyst), Jeremy 2026-10-05.

   A catalyst sets other curiosities off. It comes in two kinds, one tab each:
     Spark   one thing sets many off. Pick a curiosity (or a suite) and see every spark it fires, drawn as a
             burst of lines from it; play one, or all of them at once; make your own ("When ..., then ...").
     Elixir  several ingredients must all line up, like the ridges of a key in a lock (Blue Steel: lips, eyes,
             cheeks). Each ingredient is a spark's cause. Pick a moment of My film and see which are in: as a key
             whose pins lift, or as a flask that fills and glows when every one is in. The Lock switch is the
             elixir's "lock" lane in automation (automation.js): on, it fires only where every ingredient is in.
             Make your own from any sparks (kept in localStorage "curiosities-my-elixirs-v1").

   In code a spark is still a proximity (PROXIMITIES, "p:<id>") and an elixir a proximity suite
   (CurioAuto.PROXIMITY_SUITES, "ps:<id>"), so saved projects keep working.

   window.CurioCatalyst
     open(tab?, id?)   tab "spark" (id: a cause key "c:<curiosity>" or "s:<suite>") or "elixir" (id: elixir id)
     close()
     core              the pure part, for tests: causeKey(p), causes(list), sparksFrom(list, key),
                       lineUp(members, sparks, panels, holds) -> { rows: [{ id, inAt: [i...] }], all: [i...] }
     mine(), addElixir({ label, members }) -> id, removeElixir(id)  your own elixirs */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const hasDoc = typeof document !== "undefined";
  const KEY = "curiosities-my-elixirs-v1";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const A = () => root.CurioAuto || null;
  const sparks = () => (typeof PROXIMITIES !== "undefined" ? PROXIMITIES : root.PROXIMITIES || []);
  const elixirs = () => (A() && A().PROXIMITY_SUITES) || [];
  const curList = () => (typeof CURIOSITIES !== "undefined" ? CURIOSITIES : root.CURIOSITIES || []);
  const suiteList = () => (typeof SUITES !== "undefined" ? SUITES : root.SUITES || []);

  /* ---------- the pure part ---------- */
  /* One curiosity (or suite) is one cause, whatever change of it sets the spark off. */
  function causeKey(p) {
    const x = (p && p.x) || {};
    if (x.suite) return "s:" + x.suite;
    return x.curiosity ? "c:" + String(x.curiosity).split(".")[0] : "";
  }
  function causes(list) {
    const m = new Map();
    (list || []).forEach((p) => {
      const k = causeKey(p);
      if (!k) return;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(p.id);
    });
    return Array.from(m, ([key, ids]) => ({ key, ids })).sort((a, b) => b.ids.length - a.ids.length || a.key.localeCompare(b.key));
  }
  const sparksFrom = (list, key) => (list || []).filter((p) => causeKey(p) === key);
  /* Which ingredients are in on which panels, and the panels where every one is (the lock opens). */
  function lineUp(members, list, panels, holds) {
    const n = (panels || []).length;
    const rows = (members || [])
      .map((id) => (list || []).find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => ({ id: p.id, inAt: Array.from({ length: n }, (_, i) => i).filter((i) => holds(p.x, panels, i)) }));
    const all = Array.from({ length: n }, (_, i) => i).filter((i) => rows.length && rows.every((r) => r.inAt.includes(i)));
    return { rows, all };
  }
  const core = { causeKey, causes, sparksFrom, lineUp };

  /* ---------- your own elixirs ---------- */
  function mine() {
    try {
      const d = JSON.parse(root.localStorage.getItem(KEY));
      return Array.isArray(d) ? d.filter((e) => e && e.id && Array.isArray(e.members)) : [];
    } catch (e) {
      return [];
    }
  }
  function saveMine(list) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
  }
  function addElixir(e) {
    const label = String((e && e.label) || "").trim().slice(0, 80);
    const members = Array.from(new Set((e && e.members) || [])).filter((id) => sparks().some((p) => p.id === id));
    if (!label || members.length < 2) return null;
    const base = "my-elixir-" + (label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x");
    let id = base;
    for (let k = 2; elixirs().some((x) => x.id === id) || mine().some((x) => x.id === id); k++) id = base + "-" + k;
    saveMine(mine().concat([{ id, label, members }]));
    if (A() && A().addElixir) A().addElixir({ id, label, members });
    return id;
  }
  function removeElixir(id) {
    saveMine(mine().filter((x) => x.id !== id));
    const i = elixirs().findIndex((x) => x.id === id);
    if (i >= 0 && String(id).startsWith("my-")) elixirs().splice(i, 1);
  }

  /* ---------- words ---------- */
  function labelOf(key) {
    const [kind, id] = [key.slice(0, 1), key.slice(2)];
    if (kind === "s") return (suiteList().find((s) => s.id === id) || {}).label || id;
    const S = root.CurioScale;
    try {
      if (S && S.label) {
        const l = S.label(id);
        if (l && l !== id) return l;
      }
    } catch (e) {}
    return (curList().find((c) => c.id === id) || {}).label || id;
  }
  const sparkText = (p) => `When ${p.when || "?"}, ${p.then || "?"}`;
  const short = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));

  /* ---------- the window ---------- */
  const view = { tab: "spark", cause: "", elixir: "", q: "", eq: "", panel: 0, look: "key", picks: [], pq: "", msg: "" };
  let el = null;
  function close() {
    if (el) el.remove();
    el = null;
  }
  function open(tab, id) {
    if (!hasDoc) return null;
    if (tab === "elixir" || tab === "spark") view.tab = tab;
    if (id && view.tab === "spark") view.cause = id;
    if (id && view.tab === "elixir") view.elixir = id;
    if (!el) {
      el = document.createElement("section");
      el.className = "cat-win";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "Catalyst");
      document.body.appendChild(el);
      el.addEventListener("click", onClick);
      el.addEventListener("input", onInput);
      el.addEventListener("change", onInput);
    }
    draw();
    return el;
  }
  const playing = (key) => !!(A() && A().running && A().running().includes(key));
  function draw() {
    if (!el) return;
    el.innerHTML = `<header class="cat-h"><b>⚗ Catalyst</b><small>what sets curiosities off</small><button type="button" data-cat="close" aria-label="Close">×</button></header>
      <nav class="cat-tabs" role="tablist">
        <button type="button" role="tab" data-cat-tab="spark" aria-selected="${view.tab === "spark"}">Spark</button>
        <button type="button" role="tab" data-cat-tab="elixir" aria-selected="${view.tab === "elixir"}">Elixir</button>
      </nav>
      <div class="cat-b">${view.tab === "spark" ? sparkTab() : elixirTab()}</div>
      ${view.msg ? `<p class="cat-msg" role="status">${esc(view.msg)}</p>` : ""}`;
  }

  /* Spark: one thing sets many off. */
  function sparkTab() {
    const all = causes(sparks());
    const q = view.q.trim().toLowerCase();
    const shown = all.filter((c) => !q || labelOf(c.key).toLowerCase().includes(q)).slice(0, 40);
    if (!view.cause && all.length) view.cause = all[0].key;
    const list = sparksFrom(sparks(), view.cause);
    return `<p class="cat-k">A spark is one thing that sets others off, like a crash cymbal or a word someone says. Pick what fires.</p>
      <label class="cat-search">Find <input type="search" data-cat-in="q" value="${esc(view.q)}" placeholder="music, tension, a look…"></label>
      <div class="cat-chips">${shown.map((c) => `<button type="button" data-cat-cause="${esc(c.key)}" class="${c.key === view.cause ? "on" : ""}">${esc(short(labelOf(c.key), 28))} <small>${c.ids.length}</small></button>`).join("") || `<span class="cat-k">Nothing matches.</span>`}</div>
      ${view.cause ? burst(view.cause, list) : ""}
      ${list.length ? `<p class="cat-row"><button type="button" data-cat="fire-all">${list.every((p) => playing("p:" + p.id)) ? "Stop all" : `Play all ${list.length}`}</button><span class="cat-k">Plays every spark from ${esc(labelOf(view.cause))} at once in My film.</span></p>` : ""}
      <ul class="cat-list">${list.map((p) => `<li><span>${esc(sparkText(p))} <small>within ${Number(p.within) || 0} beat${Number(p.within) === 1 ? "" : "s"}</small></span><button type="button" data-cat-play="p:${esc(p.id)}" aria-pressed="${playing("p:" + p.id)}">${playing("p:" + p.id) ? "Stop" : "Play"}</button></li>`).join("")}</ul>
      ${makeSpark()}`;
  }
  function burst(key, list) {
    const W = 520;
    const shown = list.slice(0, 10);
    const H = Math.max(120, shown.length * 26 + 20);
    const cx = 80;
    const cy = H / 2;
    const lines = shown
      .map((p, i) => {
        const y = 16 + i * ((H - 32) / Math.max(1, shown.length - 1 || 1));
        const yy = shown.length === 1 ? cy : y;
        return `<path d="M${cx + 34} ${cy} C${cx + 120} ${cy}, ${cx + 120} ${yy}, ${cx + 200} ${yy}" class="cat-ray${playing("p:" + p.id) ? " on" : ""}"/><circle cx="${cx + 204}" cy="${yy}" r="5" class="cat-dot"/><text x="${cx + 214}" y="${yy + 4}">${esc(short(p.then || p.id, 34))} · +${Number(p.within) || 0}</text>`;
      })
      .join("");
    return `<svg class="cat-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labelOf(key))} sets off ${list.length} curiosities">
      ${lines}<circle cx="${cx}" cy="${cy}" r="34" class="cat-core"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" class="cat-core-t">${esc(short(labelOf(key), 14))}</text>
      ${list.length > shown.length ? `<text x="${cx + 214}" y="${H - 4}" class="cat-more">and ${list.length - shown.length} more below</text>` : ""}</svg>`;
  }
  function makeSpark() {
    const M = root.CurioMine;
    if (!M) return "";
    const ch = (f) => `<select data-cat-mk="${f}"><option value="rises">goes up</option><option value="drops">goes down</option><option value="changes">changes</option></select>`;
    const opts = curList()
      .slice(0, 800)
      .map((c) => `<option value="${esc(c.label || c.id)}"></option>`)
      .join("");
    return `<details class="cat-make"><summary>+ Make a spark</summary>
      <datalist id="cat-curs">${opts}</datalist>
      <p class="cat-row">When <input list="cat-curs" data-cat-mk="when" placeholder="a curiosity" value="${esc(view.cause && view.cause.startsWith("c:") ? labelOf(view.cause) : "")}"> ${ch("whenCh")}</p>
      <p class="cat-row">then <input list="cat-curs" data-cat-mk="then" placeholder="another curiosity"> ${ch("thenCh")} within <input type="number" min="0" max="16" value="1" data-cat-mk="within" style="width:4em"> beats</p>
      <p class="cat-row"><button type="button" data-cat="make-spark">Save the spark</button></p></details>`;
  }
  function idOfLabel(text) {
    const t = String(text || "").trim().toLowerCase();
    const c = curList().find((x) => String(x.label || "").toLowerCase() === t || String(x.id).toLowerCase() === t);
    return c ? c.id : "";
  }
  function saveSpark() {
    const M = root.CurioMine;
    const get = (f) => (el.querySelector(`[data-cat-mk="${f}"]`) || {}).value || "";
    const w = idOfLabel(get("when"));
    const t = idOfLabel(get("then"));
    if (!w || !t) return (view.msg = "Pick a curiosity from the list on both sides."), draw();
    const st = M.store();
    const label = `When ${labelOf("c:" + w)} ${get("whenCh")}, ${labelOf("c:" + t)} ${get("thenCh")}`;
    const item = { id: M.newId(label, st.view()), label, plain: "", cat: "", when: { curiosity: w, change: get("whenCh") }, then: { curiosity: t, change: get("thenCh") }, within: Number(get("within")) || 0 };
    const r = st.send({ type: "put", level: "proximity", item, label: "Make a spark" });
    view.msg = r && r.ok === false ? r.error || "That spark could not be kept." : `Saved: ${M.sentence ? M.sentence(item) : label} It is under Sparks in the library.`;
    draw();
  }

  /* Elixir: every ingredient must line up. */
  function elixirTab() {
    const q = view.eq.trim().toLowerCase();
    const all = elixirs();
    const shown = all.filter((e) => !q || String(e.label).toLowerCase().includes(q)).slice(0, 40);
    if (!view.elixir && all.length) view.elixir = all[0].id;
    const e = all.find((x) => x.id === view.elixir);
    return `<p class="cat-k">An elixir only works once every ingredient is in, like the ridges of a key fitting a lock. Each ingredient is a spark's cause.</p>
      <label class="cat-search">Find <input type="search" data-cat-in="eq" value="${esc(view.eq)}" placeholder="the dam breaks, music…"></label>
      <div class="cat-chips">${shown.map((x) => `<button type="button" data-cat-elixir="${esc(x.id)}" class="${x.id === view.elixir ? "on" : ""}">${esc(short(x.label, 28))} <small>${x.members.length}</small></button>`).join("") || `<span class="cat-k">Nothing matches.</span>`}</div>
      ${e ? elixirBody(e) : ""}
      ${makeElixir()}`;
  }
  function boardPanels() {
    const B = root.CuriosityBoard;
    try {
      return B && B.panels ? B.panels() : [];
    } catch (x) {
      return [];
    }
  }
  function elixirBody(e) {
    const panels = boardPanels();
    const holds = (x, ps, i) => (A() && A().holds ? A().holds(x, ps, i) : false);
    const lu = lineUp(e.members, sparks(), panels, holds);
    const n = panels.length;
    view.panel = Math.max(0, Math.min(n - 1, view.panel));
    const ins = lu.rows.map((r) => r.inAt.includes(view.panel));
    const open = ins.length > 0 && ins.every(Boolean);
    const key = "ps:" + e.id;
    const lane = A() && A().param && A().param(key) ? (A().lanes(key) || []).find((l) => l.id === "lock") : null;
    const ing = lu.rows.map((r, i) => {
      const p = sparks().find((x) => x.id === r.id);
      return `<li class="${ins[i] ? "in" : ""}"><i>${ins[i] ? "✓" : "○"}</i> ${esc(p.when || p.id)} <small>then ${esc(p.then || "")}</small></li>`;
    });
    return `<div class="cat-row"><span class="cat-seg" role="group" aria-label="Look"><button type="button" data-cat-look="key" aria-pressed="${view.look === "key"}">Key</button><button type="button" data-cat-look="flask" aria-pressed="${view.look === "flask"}">Flask</button></span>
        ${n ? `<span class="cat-k">Moment</span> <button type="button" data-cat="prev" aria-label="Moment before">‹</button> <b>${view.panel + 1} of ${n}</b> <button type="button" data-cat="next" aria-label="Moment after">›</button>` : `<span class="cat-k">My film has no moments yet.</span>`}</div>
      ${view.look === "key" ? keySvg(ins, open) : flaskSvg(ins, open)}
      <p class="cat-state ${open ? "open" : ""}">${open ? "Every ingredient is in: the elixir works here." : `${ins.filter(Boolean).length} of ${ins.length} ingredients are in at this moment.`} ${lu.all.length ? `It lines up at moment${lu.all.length === 1 ? "" : "s"} ${lu.all.map((i) => i + 1).join(", ")}.` : "It doesn't line up anywhere in My film yet."}</p>
      <ul class="cat-ing">${ing.join("")}</ul>
      <p class="cat-row">${lane ? `<label><input type="checkbox" data-cat="lock"${lane.on ? " checked" : ""}> Lock: fire only when every ingredient is in</label>` : ""}
        <button type="button" data-cat-play="${esc(key)}" aria-pressed="${playing(key)}">${playing(key) ? "Stop" : "Play the elixir"}</button>
        ${String(e.id).startsWith("my-") ? `<button type="button" data-cat-del="${esc(e.id)}">Remove this elixir</button>` : ""}</p>`;
  }
  /* A key in a lock: one pin per ingredient; an ingredient that is in lifts its pin to the line, and with every pin
     up the key turns. */
  function keySvg(ins, open) {
    const n = Math.max(1, ins.length);
    const W = 520;
    const step = Math.min(56, 300 / n);
    const x0 = 170;
    const pins = ins
      .map((on, i) => {
        const x = x0 + i * step + step / 2;
        return `<rect x="${x - 7}" y="${on ? 38 : 56}" width="14" height="34" rx="3" class="cat-pin${on ? " in" : ""}"/><path d="M${x - 9} 98 L${x} ${on ? 86 : 104} L${x + 9} 98" class="cat-ridge${on ? " in" : ""}"/>`;
      })
      .join("");
    const right = x0 + n * step + 20;
    return `<svg class="cat-svg" viewBox="0 0 ${W} 150" role="img" aria-label="${open ? "The key turns: every ingredient is in" : "A key with pins still down"}">
      <rect x="${x0 - 14}" y="20" width="${right - x0 + 28}" height="110" rx="12" class="cat-lock${open ? " open" : ""}"/>
      <line x1="${x0 - 14}" y1="74" x2="${right + 14}" y2="74" class="cat-shear"/>
      ${pins}
      <g class="cat-key${open ? " turn" : ""}" style="transform-origin: 60px 98px"><circle cx="40" cy="98" r="22" class="cat-bow"/><rect x="60" y="92" width="${right - 60}" height="12" rx="3" class="cat-blade"/></g>
      <text x="${W - 10}" y="144" text-anchor="end" class="cat-more">${open ? "Unlocked" : "Locked"}</text></svg>`;
  }
  /* A flask: each ingredient that is in pours one layer; full, it glows. */
  function flaskSvg(ins, open) {
    const n = Math.max(1, ins.length);
    const H = 120;
    const layer = H / n;
    const hues = [190, 32, 280, 140, 350, 55, 220, 100];
    let y = 140;
    const layers = ins
      .map((on, i) => {
        if (!on) return "";
        y -= layer;
        return `<rect x="200" y="${y}" width="120" height="${layer}" fill="hsl(${hues[i % hues.length]} 70% 55%)" opacity="0.85"/>`;
      })
      .join("");
    return `<svg class="cat-svg" viewBox="0 0 520 160" role="img" aria-label="${open ? "The flask is full and glows" : "A flask still filling"}">
      <defs><clipPath id="cat-flask"><path d="M240 10 h40 v40 l40 90 q0 10 -10 10 h-100 q-10 0 -10 -10 l40 -90 z"/></clipPath></defs>
      ${open ? `<ellipse cx="260" cy="95" rx="110" ry="70" class="cat-glow"/>` : ""}
      <g clip-path="url(#cat-flask)">${layers}</g>
      <path d="M240 10 h40 v40 l40 90 q0 10 -10 10 h-100 q-10 0 -10 -10 l40 -90 z" class="cat-glass"/>
      <text x="510" y="154" text-anchor="end" class="cat-more">${ins.filter(Boolean).length} of ${ins.length} in</text></svg>`;
  }
  function makeElixir() {
    const q = view.pq.trim().toLowerCase();
    const found = q ? sparks().filter((p) => sparkText(p).toLowerCase().includes(q)).slice(0, 20) : [];
    const picked = view.picks.map((id) => sparks().find((p) => p.id === id)).filter(Boolean);
    return `<details class="cat-make"${view.picks.length || view.pq ? " open" : ""}><summary>+ Make an elixir</summary>
      <p class="cat-k">Pick two or more sparks as its ingredients. Blue Steel would be: lips purse, eyes go to the camera, cheeks go in.</p>
      <p class="cat-row"><input data-cat-mk="name" placeholder="Name it" value=""> <button type="button" data-cat="make-elixir"${picked.length < 2 ? " disabled" : ""}>Save the elixir</button></p>
      <div class="cat-chips">${picked.map((p) => `<button type="button" data-cat-unpick="${esc(p.id)}" class="on">${esc(short(p.when || p.id, 30))} ×</button>`).join("")}</div>
      <label class="cat-search">Find a spark <input type="search" data-cat-in="pq" value="${esc(view.pq)}" placeholder="a look, a word, a drum fill…"></label>
      <ul class="cat-list">${found.map((p) => `<li><span>${esc(sparkText(p))}</span><button type="button" data-cat-pick="${esc(p.id)}"${view.picks.includes(p.id) ? " disabled" : ""}>Add</button></li>`).join("")}</ul></details>`;
  }

  /* ---------- events ---------- */
  function toggle(key) {
    const a = A();
    if (!a || !a.param || !a.param(key)) return (view.msg = "Automation isn't loaded on this page.");
    if (playing(key)) a.stop(key);
    else a.start(key);
    view.msg = "";
  }
  function onClick(ev) {
    const b = ev.target.closest("button, input[type=checkbox]");
    if (!b || !el.contains(b)) return;
    const d = b.dataset;
    if (d.cat === "close") return close();
    if (d.catTab) view.tab = d.catTab;
    else if (d.catCause) view.cause = d.catCause;
    else if (d.catElixir) (view.elixir = d.catElixir), (view.panel = 0);
    else if (d.catLook) view.look = d.catLook;
    else if (d.catPlay) toggle(d.catPlay);
    else if (d.catPick) view.picks.includes(d.catPick) || view.picks.push(d.catPick);
    else if (d.catUnpick) view.picks = view.picks.filter((x) => x !== d.catUnpick);
    else if (d.catDel) removeElixir(d.catDel), (view.elixir = ""), (view.msg = "Elixir removed.");
    else if (d.cat === "prev") view.panel--;
    else if (d.cat === "next") view.panel++;
    else if (d.cat === "lock") {
      const key = "ps:" + view.elixir;
      if (A() && A().setLane) A().setLane(key, "lock", { on: b.checked });
      view.msg = b.checked ? "Locked: it fires only where every ingredient is in." : "Unlocked: each ingredient fires on its own.";
    } else if (d.cat === "fire-all") {
      const keys = sparksFrom(sparks(), view.cause).map((p) => "p:" + p.id);
      const allOn = keys.every(playing);
      keys.forEach((k) => (allOn ? playing(k) && toggle(k) : playing(k) || toggle(k)));
    } else if (d.cat === "make-spark") return saveSpark();
    else if (d.cat === "make-elixir") {
      const name = (el.querySelector('[data-cat-mk="name"]') || {}).value || "";
      const id = addElixir({ label: name, members: view.picks });
      if (!id) view.msg = "Give it a name and at least two sparks.";
      else (view.elixir = id), (view.picks = []), (view.pq = ""), (view.msg = `Saved: ${name}.`);
    } else return;
    draw();
  }
  let typing = 0;
  function onInput(ev) {
    const f = ev.target.dataset && ev.target.dataset.catIn;
    if (!f) return;
    view[f] = ev.target.value;
    clearTimeout(typing);
    typing = setTimeout(() => {
      const pos = ev.target.selectionStart;
      draw();
      const again = el && el.querySelector(`[data-cat-in="${f}"]`);
      if (again) again.focus(), again.setSelectionRange && again.setSelectionRange(pos, pos);
    }, 150);
  }

  function styles() {
    return `
.cat-win { position: fixed; z-index: 92; left: 50%; top: 48px; transform: translateX(-50%); width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 72px); display: flex; flex-direction: column; background: var(--cc-panel, #1c1c1e); border: 1px solid var(--cc-line, #2e2e33); border-radius: 10px; box-shadow: 0 14px 40px rgba(0,0,0,0.6); color: var(--cc-text, #ececee); font: 12px -apple-system, "Segoe UI", system-ui, sans-serif; color-scheme: dark; }
.cat-h { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--cc-line, #2e2e33); }
.cat-h b { font-size: 13px; } .cat-h small { color: var(--cc-dim, #9b9ba3); flex: 1 1 auto; }
.cat-tabs { display: flex; gap: 4px; padding: 6px 10px 0; }
.cat-tabs button[aria-selected=true], .cat-chips button.on, .cat-seg button[aria-pressed=true] { background: var(--cc-accent, #22d3ee); color: #0b0b0c; }
.cat-b { overflow: auto; padding: 8px 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.cat-b > * { flex: none; }
.cat-k { color: var(--cc-dim, #9b9ba3); margin: 0; }
.cat-search { display: flex; gap: 6px; align-items: center; } .cat-search input { flex: 1 1 auto; min-width: 0; }
.cat-chips { display: flex; flex-wrap: wrap; gap: 4px; max-height: 128px; overflow: auto; } .cat-chips small { opacity: 0.7; }
.cat-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 0; }
.cat-list, .cat-ing { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.cat-list li { display: flex; gap: 6px; justify-content: space-between; align-items: center; }
.cat-list small, .cat-ing small { color: var(--cc-dim, #9b9ba3); }
.cat-ing li { opacity: 0.6; } .cat-ing li.in { opacity: 1; } .cat-ing li.in i { color: #4ade80; }
.cat-svg { width: 100%; height: auto; display: block; }
.cat-svg text { fill: var(--cc-text, #ececee); font-size: 11px; }
.cat-ray { fill: none; stroke: var(--cc-warm, #ff9f43); stroke-width: 2; opacity: 0.7; } .cat-ray.on { stroke: #4ade80; opacity: 1; }
.cat-dot { fill: var(--cc-warm, #ff9f43); }
.cat-core { fill: var(--cc-accent, #22d3ee); } .cat-svg .cat-core-t { fill: #0b0b0c; font-weight: 700; }
.cat-svg .cat-more { fill: var(--cc-dim, #9b9ba3); }
.cat-lock { fill: #2a2a2d; stroke: #55555c; } .cat-lock.open { stroke: #4ade80; }
.cat-shear { stroke: #ffd166; stroke-dasharray: 4 3; }
.cat-pin { fill: #6b6b73; transition: y 0.25s; } .cat-pin.in { fill: #4ade80; }
.cat-ridge { fill: none; stroke: #9b9ba3; stroke-width: 2; } .cat-ridge.in { stroke: #4ade80; }
.cat-key { transition: transform 0.4s; } .cat-key.turn { transform: rotate(-12deg); }
.cat-bow { fill: none; stroke: #ffd166; stroke-width: 6; } .cat-blade { fill: #ffd166; }
.cat-glass { fill: none; stroke: #c9d6e3; stroke-width: 3; }
.cat-glow { fill: #4ade80; opacity: 0.18; }
.cat-state { margin: 0; } .cat-state.open { color: #4ade80; font-weight: 600; }
.cat-msg { margin: 0; padding: 6px 10px; border-top: 1px solid var(--cc-line, #2e2e33); color: var(--cc-accent, #22d3ee); }
.cat-make summary { cursor: pointer; }
`;
  }

  function start() {
    if (!hasDoc) return;
    mine().forEach((e) => A() && A().addElixir && A().addElixir(e));
    document.addEventListener("click", (e) => {
      const b = e.target.closest && e.target.closest("[data-cat-open]");
      if (b) open(b.dataset.catOpen || undefined);
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && el && close());
    const st = document.createElement("style");
    st.id = "cat-css";
    st.textContent = styles();
    document.head.appendChild(st);
  }

  root.CurioCatalyst = { open, close, core, mine, addElixir, removeElixir, KEY };
  if (hasDoc) start();
})();
