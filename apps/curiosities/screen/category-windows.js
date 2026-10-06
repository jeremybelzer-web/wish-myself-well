/* screen/category-windows.js: a pop-up window for every major category of curiosity suites
   (window.CurioCategoryWindows). Jeremy, 2026-10-05: "For all major categories of curiosity suites, there should
   be a pop-up window. With sliders and knobs, and maybe 3D or 2D graphs and pie charts that allow the user to
   change the parameters of this curiosity."

   A category is one of the database's workspaces (Camera angle, Emotion, Comedy, Herd mentality...). Its window
   shows, at the playhead:
     Pie      how much of each suite in the category is playing now (its share of matching members)
     Knobs    one per suite: drag up or down (or the arrow keys) to push the whole suite toward its own settings,
              0% leaves the moment as it is, 100% sets every member to the suite's value; one undo step
     Sliders  every curiosity in the category (the strongest story-pushers first): drag to set it at the playhead
     Graph    the category's curiosities across the whole film, one line each (0 = low end, 1 = high end)
     Radar    the same curiosities at the playhead, as a web, so the category's shape is one picture
   It writes through the engine like the Screen's own windows (addCuriosity + setPoint in one batch per change) and
   redraws on every engine change and every playhead move. It opens from the "◎ Categories" button on the Screen's
   bar, from CurioCategoryWindows.open(workspaceId), or by voice ("open the emotion category").

   CurioCategoryWindows = { list(), open(id), close(), isOpen(), current(), suitesOf(id), curiositiesOf(id),
                            shareOf(suiteId), pushSuite(suiteId, amount), set(key, p) } */
(function () {
  if (typeof window === "undefined" || window.CurioCategoryWindows) return;
  const DB = () => window.CuriosityDB;
  const E = () => window.CurioEngine;
  const S = () => window.CurioScale;
  const SC = () => window.CurioScreen;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const r1 = (n) => Math.round(n * 10) / 10;
  const COLORS = ["#ffd166", "#4a6fa5", "#e4572e", "#5fae78", "#9b6bb5", "#e8913a", "#3fb6a8", "#d9789b", "#8a8a96", "#cdb999"];
  const SHOWN = 12;

  let el = null;
  let cat = null;
  let showAll = false;
  let offE = null;
  let offS = null;
  const pos = { x: null, y: null };

  /* ---------- data ---------- */
  const data = () => (DB() && DB().data) || { workspaces: [], curiosities: [], suites: [] };
  function list() {
    const d = data();
    return (d.workspaces || [])
      .map((w) => ({ id: w.id, label: w.label, plain: w.plain, suites: d.suites.filter((s) => s.workspace === w.id).length, curiosities: d.curiosities.filter((c) => c.workspace === w.id).length }))
      .filter((w) => w.suites > 0 || w.curiosities > 0);
  }
  const suitesOf = (id) => data().suites.filter((s) => s.workspace === id || (s.also || []).includes(id));
  const curiositiesOf = (id) =>
    data()
      .curiosities.filter((c) => c.workspace === id)
      .sort((a, b) => ((b.momentum && b.momentum.push) || 0) - ((a.momentum && a.momentum.push) || 0) || String(a.label).localeCompare(b.label));
  const curiosity = (id) => data().curiosities.find((c) => c.id === id);
  /* The engine's name for a member: the curiosity itself for its main slider, "curiosity.slider" for the others. */
  function keyOf(m) {
    const c = curiosity(m.curiosity);
    if (!c) return null;
    return !m.slider || m.slider === c.main ? c.id : c.id + "." + m.slider;
  }
  const known = (k) => !!(k && S() && S().known && S().known(k));

  /* ---------- reading the film at the playhead ---------- */
  function rowNow(st) {
    const i = SC() && SC().row ? SC().row() : 0;
    return st.rows[Math.max(0, Math.min(st.rows.length - 1, i | 0))] || null;
  }
  const trackHas = (k, st) => (st.tracks || []).find((t) => (t.curiosities || []).includes(k));
  function valueNow(k, st, r) {
    st = st || (E() && E().state());
    if (!st) return null;
    r = r || rowNow(st);
    const t = trackHas(k, st);
    if (!t || !r) return null;
    const v = E().value(r.id, t.id, k);
    return v == null ? null : v;
  }
  function posNow(k, st, r) {
    const v = valueNow(k, st, r);
    if (v == null || !known(k)) return null;
    const p = S().pos(k, v);
    return p == null || isNaN(p) ? null : p;
  }
  /* How much of a suite plays now: each member with a set value counts by how close the moment is to it (ordered
     scales) or whether it matches (word lists); a member with no value counts when its lane has something. */
  function shareOf(suiteId) {
    const s = data().suites.find((x) => x.id === suiteId);
    if (!s || !E()) return 0;
    const st = E().state();
    const r = rowNow(st);
    const ms = (s.members || []).filter((m) => known(keyOf(m)));
    if (!ms.length || !r) return 0;
    let sum = 0;
    ms.forEach((m) => {
      const k = keyOf(m);
      const v = valueNow(k, st, r);
      if (v == null) return;
      if (m.value == null) return void (sum += 1);
      const dom = S().domain(k);
      if (dom && dom.kind === "choice" && dom.unordered) return void (sum += String(v) === String(m.value) ? 1 : 0);
      const a = S().pos(k, v);
      const b = S().pos(k, S().fix(k, m.value));
      sum += a == null || b == null ? (String(v) === String(m.value) ? 1 : 0) : Math.max(0, 1 - Math.abs(a - b));
    });
    return sum / ms.length;
  }

  /* ---------- writing ---------- */
  function write(items, label) {
    if (!E() || !E().send) return { ok: false, error: "The timeline is not on this page." };
    const st = E().state();
    const r = rowNow(st);
    if (!r) return { ok: false, error: "My film has no moments yet." };
    const cmds = [];
    const placed = {};
    items.forEach(([k, v]) => {
      if (!known(k)) return;
      let track = placed[k] || (trackHas(k, st) || {}).id;
      if (track && window.CurioLanes && window.CurioLanes.isLocked && window.CurioLanes.isLocked(track + "|" + k)) return;
      if (!track) {
        track = window.CurioLanes && window.CurioLanes.trackFor ? window.CurioLanes.trackFor(k, st) : (st.tracks[0] || {}).id;
        if (!track) return;
        cmds.push({ type: "addCuriosity", track, curiosity: k });
      }
      placed[k] = track;
      const val = S().fix(k, v);
      if (val != null) cmds.push({ type: "setPoint", row: r.id, track, curiosity: k, value: val });
    });
    if (!cmds.length) return { ok: false, error: "Nothing to change here." };
    return E().send({ type: "batch", label, commands: cmds });
  }
  /* Push a whole suite toward its own settings by amount (0 to 1), as one undo step. */
  function pushSuite(suiteId, amount) {
    const s = data().suites.find((x) => x.id === suiteId);
    if (!s) return { ok: false, error: "No such suite." };
    const a = Math.max(0, Math.min(1, Number(amount) || 0));
    const st = E() && E().state();
    const items = [];
    (s.members || []).forEach((m) => {
      const k = keyOf(m);
      if (!known(k) || m.value == null) return;
      const target = S().fix(k, m.value);
      if (target == null) return;
      const dom = S().domain(k);
      const tp = S().pos(k, target);
      if ((dom && dom.kind === "choice" && dom.unordered) || tp == null) return void (a >= 0.5 && items.push([k, target]));
      const cur = posNow(k, st);
      const from = cur == null ? S().pos(k, S().start(k)) || 0 : cur;
      items.push([k, S().at(k, from + (tp - from) * a)]);
    });
    if (!items.length) return { ok: false, error: "This suite has no settings to push." };
    return write(items, `${s.label}: ${Math.round(a * 100)}% at the playhead`);
  }
  const set = (k, p) => (known(k) ? write([[k, S().at(k, Math.max(0, Math.min(1, p)))]], `${(curiosity(k.split(".")[0]) || {}).label || k} at the playhead`) : { ok: false });

  /* ---------- drawing ---------- */
  function pie(slices) {
    const total = slices.reduce((a, s) => a + s.v, 0);
    if (total <= 0) return `<svg viewBox="0 0 120 120" class="ccw-pie" role="img" aria-label="No suite of this category plays here yet"><circle cx="60" cy="60" r="44" fill="none" stroke="#33323d" stroke-width="22"/><text x="60" y="64" text-anchor="middle" font-size="10" fill="#aaa">nothing yet</text></svg>`;
    let a0 = -Math.PI / 2;
    const arcs = slices
      .filter((s) => s.v > 0)
      .map((s, i) => {
        const a1 = a0 + (s.v / total) * Math.PI * 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const p = (a, r) => `${r1(60 + Math.cos(a) * r)} ${r1(60 + Math.sin(a) * r)}`;
        const d = s.v / total > 0.999 ? `M ${p(0, 55)} A 55 55 0 1 1 ${p(Math.PI, 55)} A 55 55 0 1 1 ${p(0, 55)} Z` : `M 60 60 L ${p(a0, 55)} A 55 55 0 ${large} 1 ${p(a1, 55)} Z`;
        a0 = a1;
        return `<path d="${d}" fill="${s.color}"><title>${esc(s.label)}: ${Math.round((s.v / total) * 100)}%</title></path>`;
      })
      .join("");
    return `<svg viewBox="0 0 120 120" class="ccw-pie" role="img" aria-label="Share of each suite at the playhead">${arcs}<circle cx="60" cy="60" r="26" fill="#15151c"/></svg>`;
  }
  function knob(s, share, i) {
    const p = Math.max(0, Math.min(1, share));
    const a0 = Math.PI * 0.75;
    const a = a0 + p * Math.PI * 1.5;
    const pt = (ang, r) => `${r1(24 + Math.cos(ang) * r)} ${r1(24 + Math.sin(ang) * r)}`;
    const arc = p > 0.001 ? `<path d="M ${pt(a0, 18)} A 18 18 0 ${p * 1.5 > 1 ? 1 : 0} 1 ${pt(a, 18)}" fill="none" stroke="${COLORS[i % COLORS.length]}" stroke-width="4" stroke-linecap="round"/>` : "";
    return `<div class="ccw-knob" role="slider" tabindex="0" aria-label="${esc(s.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}" data-suite="${esc(s.id)}" title="${esc(s.plain || s.label)}">
      <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#22212a" stroke="#3a3946" stroke-width="4"/>${arc}<line x1="24" y1="24" x2="${r1(24 + Math.cos(a) * 14)}" y2="${r1(24 + Math.sin(a) * 14)}" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
      <b>${Math.round(p * 100)}%</b><span>${esc(s.label)}</span></div>`;
  }
  function graph(cs, st) {
    const rows = st.rows || [];
    if (!rows.length) return `<p class="ccw-note">My film has no moments yet.</p>`;
    const W = 300;
    const H = 110;
    const n = rows.length;
    const x = (j) => 8 + ((W - 16) * j) / Math.max(1, n - 1);
    const y = (p) => 6 + (H - 12) * (1 - p);
    const now = SC() && SC().row ? SC().row() : 0;
    let lines = "";
    let legend = "";
    cs.slice(0, 6).forEach((c, i) => {
      const pts = rows.map((r, j) => [j, posNow(c.id, st, r)]).filter((q) => q[1] != null);
      const col = COLORS[i % COLORS.length];
      legend += `<span><i style="background:${col}"></i>${esc(c.label)}</span>`;
      if (!pts.length) return;
      lines += `<polyline points="${pts.map(([j, p]) => `${r1(x(j))},${r1(y(p))}`).join(" ")}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="ccw-graph" role="img" aria-label="The category across the film"><rect x="0" y="0" width="${W}" height="${H}" fill="#121218"/>${[0.25, 0.5, 0.75].map((p) => `<line x1="8" x2="${W - 8}" y1="${r1(y(p))}" y2="${r1(y(p))}" stroke="#26252f"/>`).join("")}<line x1="${r1(x(now))}" x2="${r1(x(now))}" y1="0" y2="${H}" stroke="#ffd166" stroke-dasharray="3 3"/>${lines}</svg><div class="ccw-legend">${legend}</div>`;
  }
  function radar(cs, st) {
    const list = cs.slice(0, 8);
    if (list.length < 3) return "";
    const n = list.length;
    const pt = (i, r) => `${r1(70 + Math.cos(-Math.PI / 2 + (i / n) * Math.PI * 2) * r)},${r1(70 + Math.sin(-Math.PI / 2 + (i / n) * Math.PI * 2) * r)}`;
    const vals = list.map((c) => posNow(c.id, st));
    const web = [0.33, 0.66, 1].map((q) => `<polygon points="${list.map((_, i) => pt(i, 52 * q)).join(" ")}" fill="none" stroke="#2c2b36"/>`).join("");
    const shape = `<polygon points="${vals.map((v, i) => pt(i, 52 * (v == null ? 0 : v))).join(" ")}" fill="rgba(255,209,102,.25)" stroke="#ffd166" stroke-width="1.5"/>`;
    const labels = list.map((c, i) => `<text x="${pt(i, 62).split(",")[0]}" y="${pt(i, 62).split(",")[1]}" font-size="6.5" fill="#bbb" text-anchor="middle">${esc(String(c.label).slice(0, 16))}</text>`).join("");
    return `<svg viewBox="-30 0 200 140" class="ccw-radar" role="img" aria-label="The category's shape at the playhead">${web}${shape}${labels}</svg>`;
  }
  function sliderRow(c, st) {
    const v = valueNow(c.id, st);
    const p = posNow(c.id, st);
    const shown = v == null ? (known(c.id) ? S().start(c.id) : "") : v;
    return `<label class="ccw-row" title="${esc(c.plain)}"><span>${esc(c.label)}</span><input type="range" min="0" max="100" step="1" value="${Math.round((p == null ? (known(c.id) ? S().pos(c.id, S().start(c.id)) || 0 : 0) : p) * 100)}" data-cur="${esc(c.id)}"${known(c.id) ? "" : " disabled"}><em>${esc(shown)}</em></label>`;
  }
  function body() {
    const w = list().find((x) => x.id === cat);
    if (!w) return `<p class="ccw-note">Pick a category.</p>`;
    const st = E() ? E().state() : { rows: [], tracks: [] };
    const suites = suitesOf(cat)
      .map((s) => ({ s, v: shareOf(s.id) }))
      .sort((a, b) => b.v - a.v || String(a.s.label).localeCompare(b.s.label));
    const cs = curiositiesOf(cat).filter((c) => known(c.id));
    const withLane = cs.filter((c) => trackHas(c.id, st));
    const graphed = withLane.concat(cs.filter((c) => !withLane.includes(c)));
    const slices = suites.slice(0, 8).map((x, i) => ({ label: x.s.label, v: x.v, color: COLORS[i % COLORS.length] }));
    const row = SC() && SC().row ? SC().row() + 1 : 1;
    return `<p class="ccw-plain">${esc(w.plain || "")}</p>
      <div class="ccw-top">${pie(slices)}<div class="ccw-pielegend">${slices.filter((x) => x.v > 0).map((x) => `<span><i style="background:${x.color}"></i>${esc(x.label)}</span>`).join("") || `<span>Turn a knob to bring a suite in at moment ${row}.</span>`}</div>${radar(graphed, st)}</div>
      <h4>Suites <small>drag a knob up or down: how far to push the whole suite at moment ${row}</small></h4>
      <div class="ccw-knobs">${suites.map((x, i) => knob(x.s, x.v, i)).join("") || `<p class="ccw-note">No suites in this category yet.</p>`}</div>
      <h4>Curiosities <small>at moment ${row}</small></h4>
      <div class="ccw-rows">${(showAll ? cs : cs.slice(0, SHOWN)).map((c) => sliderRow(c, st)).join("")}</div>
      ${cs.length > SHOWN ? `<button type="button" class="ccw-more" data-more>${showAll ? "Show fewer" : `Show all ${cs.length}`}</button>` : ""}
      <h4>Across the film</h4>${graph(graphed, st)}`;
  }
  function draw() {
    if (!el || el.hidden) return;
    const b = el.querySelector(".ccw-body");
    const keep = b.scrollTop;
    const focus = document.activeElement && el.contains(document.activeElement) ? document.activeElement.dataset.suite || document.activeElement.dataset.cur : null;
    b.innerHTML = body();
    b.scrollTop = keep;
    if (focus) {
      const f = b.querySelector(`[data-suite="${CSS.escape(focus)}"],[data-cur="${CSS.escape(focus)}"]`);
      if (f) f.focus();
    }
    const sel = el.querySelector(".ccw-pick");
    if (sel && sel.value !== cat) sel.value = cat;
  }

  /* ---------- the window ---------- */
  function build() {
    el = document.createElement("div");
    el.className = "ccw";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Category window");
    el.innerHTML = `<div class="ccw-head"><b>◎</b><select class="ccw-pick" aria-label="Category">${list()
      .map((w) => `<option value="${esc(w.id)}">${esc(w.label)} (${w.suites} suites)</option>`)
      .join("")}</select><button type="button" class="ccw-x" aria-label="Close">✕</button></div><div class="ccw-body"></div>`;
    document.body.appendChild(el);
    el.querySelector(".ccw-x").addEventListener("click", close);
    el.querySelector(".ccw-pick").addEventListener("change", (e) => open(e.target.value));
    const b = el.querySelector(".ccw-body");
    b.addEventListener("click", (e) => {
      if (e.target.closest("[data-more]")) {
        showAll = !showAll;
        draw();
      }
    });
    b.addEventListener("change", (e) => {
      const r = e.target.closest("input[data-cur]");
      if (r) set(r.dataset.cur, Number(r.value) / 100);
    });
    /* knobs: drag up or down, or the arrow keys (10% a step, Shift 1%) */
    let drag = null;
    b.addEventListener("pointerdown", (e) => {
      const k = e.target.closest(".ccw-knob");
      if (!k) return;
      e.preventDefault();
      drag = { id: k.dataset.suite, y: e.clientY, p0: Number(k.getAttribute("aria-valuenow")) / 100, el: k, p: null };
      k.setPointerCapture && k.setPointerCapture(e.pointerId);
    });
    b.addEventListener("pointermove", (e) => {
      if (!drag) return;
      drag.p = Math.max(0, Math.min(1, drag.p0 + (drag.y - e.clientY) / 150));
      const t = drag.el.querySelector("b");
      if (t) t.textContent = Math.round(drag.p * 100) + "%";
    });
    const up = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (d.p != null && Math.abs(d.p - d.p0) > 0.005) pushSuite(d.id, d.p);
    };
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("keydown", (e) => {
      const k = e.target.closest(".ccw-knob");
      if (!k) return;
      const step = e.shiftKey ? 0.01 : 0.1;
      const p0 = Number(k.getAttribute("aria-valuenow")) / 100;
      const p = { ArrowUp: p0 + step, ArrowRight: p0 + step, ArrowDown: p0 - step, ArrowLeft: p0 - step, Home: 0, End: 1 }[e.key];
      if (p == null) return;
      e.preventDefault();
      pushSuite(k.dataset.suite, Math.max(0, Math.min(1, p)));
    });
    /* move the window by its head */
    const head = el.querySelector(".ccw-head");
    head.addEventListener("pointerdown", (e) => {
      if (e.target.closest("select,button")) return;
      const r = el.getBoundingClientRect();
      const ox = e.clientX - r.left;
      const oy = e.clientY - r.top;
      const mv = (ev) => {
        pos.x = Math.max(0, Math.min(window.innerWidth - 80, ev.clientX - ox));
        pos.y = Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - oy));
        el.style.left = pos.x + "px";
        el.style.top = pos.y + "px";
        el.style.right = "auto";
      };
      const stop = () => {
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", stop);
      };
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", stop);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }
  function open(id) {
    const all = list();
    cat = all.some((w) => w.id === id) ? id : cat || (all[0] || {}).id;
    if (!el) build();
    el.hidden = false;
    if (pos.x != null) {
      el.style.left = pos.x + "px";
      el.style.top = pos.y + "px";
      el.style.right = "auto";
    }
    if (!offE && E() && E().on) offE = E().on(() => draw());
    if (!offS && SC() && SC().on) offS = SC().on(() => draw());
    draw();
    return cat;
  }
  function close() {
    if (el) el.hidden = true;
    if (offE) offE();
    if (offS) offS();
    offE = offS = null;
  }

  /* ---------- the launcher on the Screen's bar, and voice ---------- */
  function menu(btn) {
    let m = document.getElementById("ccw-menu");
    if (m) return void m.remove();
    m = document.createElement("div");
    m.id = "ccw-menu";
    m.className = "ccw-menu";
    m.innerHTML = list()
      .map((w) => `<button type="button" data-cat="${esc(w.id)}">${esc(w.label)}<small>${w.suites} suites, ${w.curiosities} curiosities</small></button>`)
      .join("");
    const r = btn.getBoundingClientRect();
    m.style.top = r.bottom + 4 + "px";
    m.style.left = Math.max(4, Math.min(window.innerWidth - 260, r.left)) + "px";
    document.body.appendChild(m);
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      m.remove();
      open(b.dataset.cat);
    });
    setTimeout(() => document.addEventListener("click", function off(e) {
      if (!m.contains(e.target)) {
        m.remove();
        document.removeEventListener("click", off);
      }
    }), 0);
  }
  function ensureButton() {
    const sb = document.querySelector(".sc-page .sc-bar");
    if (!sb || sb.querySelector(".ccw-btn")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ccw-btn";
    b.textContent = "◎ Categories";
    b.title = "A window for each category of suites: knobs, sliders, a pie chart and graphs";
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      menu(b);
    });
    const close_ = sb.querySelector(".cw-help") || sb.querySelector(".sc-close");
    if (close_) sb.insertBefore(b, close_);
    else sb.appendChild(b);
  }
  const tick = () => ensureButton();
  if (typeof MutationObserver !== "undefined") new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(tick, 0);
  setTimeout(() => {
    const C = window.CurioCommands;
    if (C && C.register)
      list().forEach((w) => {
        try {
          C.register({ id: "category-" + w.id, label: `Open the ${w.label} category`, words: [`open the ${w.label.toLowerCase()} category`, `${w.label.toLowerCase()} category`], run: () => open(w.id) });
        } catch (e) {
          /* voice is optional */
        }
      });
  }, 0);

  /* ---------- styles, inlined so the one-page app link carries them ---------- */
  const st = document.createElement("style");
  st.textContent = `
.ccw{position:fixed;top:70px;right:16px;width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 90px);display:flex;flex-direction:column;background:#17161d;color:#eee;border:1px solid #3a3946;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.5);z-index:9000;resize:both;overflow:hidden;font:13px/1.35 system-ui,sans-serif}
.ccw[hidden]{display:none}
.ccw-head{display:flex;gap:8px;align-items:center;padding:8px 10px;background:#201f28;cursor:move;border-bottom:1px solid #33323d}
.ccw-head b{color:#ffd166}
.ccw-pick{flex:1;min-width:0;background:#2a2933;color:#fff;border:1px solid #444;border-radius:6px;padding:4px}
.ccw-x{background:none;border:0;color:#ccc;font-size:16px;cursor:pointer}
.ccw-body{overflow:auto;padding:10px 12px 14px}
.ccw-plain{margin:0 0 8px;color:#b9b9c6}
.ccw h4{margin:12px 0 6px;font-size:13px}
.ccw h4 small{font-weight:400;color:#999;margin-left:6px}
.ccw-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.ccw-pie{width:120px;height:120px;flex:none}
.ccw-radar{width:200px;height:140px;flex:none}
.ccw-pielegend,.ccw-legend{display:flex;flex-direction:column;gap:3px;font-size:11px;flex:1;min-width:120px}
.ccw-legend{flex-direction:row;flex-wrap:wrap;gap:4px 10px;margin-top:4px}
.ccw-pielegend i,.ccw-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.ccw-knobs{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.ccw-knob{display:flex;flex-direction:column;align-items:center;text-align:center;padding:6px 4px;border-radius:8px;background:#1e1d26;cursor:ns-resize;touch-action:none;user-select:none}
.ccw-knob:focus{outline:2px solid #ffd166}
.ccw-knob svg{width:46px;height:46px}
.ccw-knob b{font-size:12px}
.ccw-knob span{font-size:10.5px;color:#bbb;line-height:1.2;margin-top:2px}
.ccw-rows{display:grid;gap:4px}
.ccw-row{display:grid;grid-template-columns:minmax(90px,1.2fr) 2fr minmax(60px,.9fr);gap:8px;align-items:center;font-size:12px}
.ccw-row em{font-style:normal;color:#ffd166;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ccw-row input{width:100%}
.ccw-more{margin-top:6px;background:#2a2933;color:#fff;border:1px solid #444;border-radius:6px;padding:4px 8px;cursor:pointer}
.ccw-graph{width:100%;height:auto;border-radius:6px}
.ccw-note{color:#999}
.ccw-btn{white-space:nowrap}
.ccw-menu{position:fixed;z-index:9001;width:250px;max-height:60vh;overflow:auto;background:#1d1c24;border:1px solid #3a3946;border-radius:8px;padding:4px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.ccw-menu button{display:block;width:100%;text-align:left;background:none;border:0;color:#eee;padding:6px 8px;border-radius:5px;cursor:pointer}
.ccw-menu button:hover{background:#2c2b36}
.ccw-menu small{display:block;color:#999;font-size:11px}
@media (max-width:600px){.ccw{top:8px;right:8px;left:8px;width:auto;max-height:calc(100vh - 16px)}}`;
  document.head.appendChild(st);

  window.CurioCategoryWindows = { list, open, close, isOpen: () => !!(el && !el.hidden), current: () => cat, suitesOf: (id) => suitesOf(id).map((s) => s.id), curiositiesOf: (id) => curiositiesOf(id).map((c) => c.id), shareOf, pushSuite, set };
})();
