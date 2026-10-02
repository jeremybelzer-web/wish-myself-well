/* Prism: a curated film goes in like white light and comes out split into four bands, the
   curiosities it uses (and how low to how high each one went), the suites that fully held,
   the proximities that held (and after how many beats), and the proximity suites whose members held.
   Any row can be dropped onto a moment of your own film (a span of board panels): it becomes an
   automation in CurioAuto built from the film's own ranges, and starts playing on the board.
   A Develop card then offers three next moves. The engine is window.CurioAuto (automation.js). */

(function () {
  const root = document.getElementById("prism");
  if (!root) return;
  const VIEW = "curiosities-prism-view-v1";
  const BANDS = [
    { id: "curiosity", label: "Curiosities", hue: 12, note: "One measurable thing each, and how far it moved." },
    { id: "suite", label: "Suites", hue: 40, note: "Groups of curiosities that all held at once." },
    { id: "proximity", label: "Proximities", hue: 150, note: "When X happened, Y followed within a few beats." },
    { id: "proximity suite", label: "Proximity suites", hue: 232, note: "Groups of proximities that held together." },
  ];

  let view = { film: "", band: "all", from: 1, to: 3 };
  try {
    view = Object.assign(view, JSON.parse(localStorage.getItem(VIEW) || "{}"));
  } catch (e) {}
  /* What the Prism started: keys it plays, the row it came from, and the moment. */
  let playing = null;
  let boardFilm = null;
  let lastSig = "";
  let lastPaint = 0;

  const A = () => window.CurioAuto;
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function saveView() {
    try {
      localStorage.setItem(VIEW, JSON.stringify(view));
    } catch (e) {}
  }
  function label(id) {
    const p = A() && A().param("c:" + id);
    return p ? p.label : id;
  }
  function panelCount() {
    const n = Number(window.CuriosityBoard && window.CuriosityBoard.values().angleCount);
    return Math.max(1, Math.min(12, n || 4));
  }
  function moment() {
    const n = panelCount();
    const from = Math.max(0, Math.min(n - 1, (Number(view.from) || 0)));
    const to = Math.max(from, Math.min(n - 1, view.to == null ? n - 1 : Number(view.to)));
    return { from, to, n };
  }
  function span(m) {
    return m.from === m.to ? `panel ${m.from + 1}` : `panels ${m.from + 1} to ${m.to + 1}`;
  }

  /* ---------- films ---------- */
  function films() {
    const out = ((window.CuriosityStudy && window.CuriosityStudy.studies()) || []).map((s) => ({ id: s.id, title: s.title, kind: s.kind, beats: s.beats || [] }));
    out.push({ id: "__board", title: "My board", kind: "board", beats: null });
    return out;
  }
  function film() {
    const all = films();
    let f = all.find((x) => x.id === view.film) || all.find((x) => /crystal is quiet/i.test(x.title)) || all[0];
    view.film = f.id;
    if (f.id === "__board") {
      if (!boardFilm) {
        const n = panelCount();
        const panels = A() ? A().resolve(n).panels : Array.from({ length: n }, () => window.CuriosityBoard.values());
        boardFilm = panels.map((v, i) => ({ at: "panel " + (i + 1), values: v }));
      }
      f = Object.assign({}, f, { beats: boardFilm });
    }
    return f;
  }

  /* ---------- reading a film ---------- */
  function same(a, b) {
    return a != null && b != null && String(a) === String(b);
  }
  function rank(id, v) {
    const d = A().domain(id);
    if (d.kind === "range") return Number(v);
    const i = d.options.indexOf(String(v));
    if (i >= 0) return i;
    return isFinite(Number(v)) ? Number(v) : -1;
  }
  function suiteSet(id) {
    return (SUITES.find((s) => s.id === id) || { set: {} }).set;
  }
  function suiteHolds(id, beat) {
    const set = suiteSet(id);
    const ks = Object.keys(set);
    return ks.length > 0 && ks.every((k) => same(beat.values[k], set[k]));
  }
  /* Does a condition hold at beat i? A change compares with the beat before, the same way automation.js does. */
  function holds(c, beats, i) {
    const beat = beats[i];
    if (!beat) return false;
    if (c.suite) return suiteHolds(c.suite, beat);
    const v = beat.values[c.curiosity];
    if ("is" in c) return same(v, c.is);
    if (i === 0) return false;
    const prev = beats[i - 1].values[c.curiosity];
    if (v == null || prev == null) return false;
    if (c.change === "changes") return !same(v, prev);
    if (c.change === "rises") return rank(c.curiosity, v) > rank(c.curiosity, prev);
    if (c.change === "drops") return rank(c.curiosity, v) < rank(c.curiosity, prev);
    return false;
  }
  function measure(p, beats) {
    let n = 0;
    const at = [];
    const delays = [];
    beats.forEach((_, i) => {
      if (!holds(p.x, beats, i)) return;
      n++;
      for (let j = i; j <= i + (p.within || 0) && j < beats.length; j++) {
        if (holds(p.y, beats, j)) {
          at.push(i);
          delays.push(j - i);
          break;
        }
      }
    });
    return { n, h: at.length, at, delays };
  }
  function mostCommon(list) {
    const c = {};
    list.forEach((x) => (c[x] = (c[x] || 0) + 1));
    return Number(Object.entries(c).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]);
  }

  /* The spectrum of one film, every band computed once. */
  function spectrum(f) {
    const beats = f.beats;
    const ids = [];
    beats.forEach((b) => Object.keys(b.values || {}).forEach((k) => b.values[k] != null && b.values[k] !== "" && !ids.includes(k) && A().param("c:" + k) && ids.push(k)));
    const curiosities = ids.map((id) => {
      const vals = beats.map((b) => (b.values[id] == null || b.values[id] === "" ? null : b.values[id]));
      let lo = null;
      let hi = null;
      vals.forEach((v, i) => {
        if (v == null) return;
        if (lo == null || rank(id, v) < rank(id, vals[lo])) lo = i;
        if (hi == null || rank(id, v) > rank(id, vals[hi])) hi = i;
      });
      const changes = new Set();
      vals.forEach((v, i) => i > 0 && v != null && vals[i - 1] != null && !same(v, vals[i - 1]) && changes.add(i));
      const distinct = new Set(vals.filter((v) => v != null).map(String)).size;
      /* Words with no scale (names) have no low or high: use the first value and the first one after it that differs. */
      if (distinct > 1 && same(vals[lo], vals[hi])) {
        lo = vals.findIndex((v) => v != null);
        hi = vals.findIndex((v) => v != null && !same(v, vals[lo]));
      }
      return { id, label: label(id), vals, lo: vals[lo], hi: vals[hi], loAt: lo, hiAt: hi, moved: distinct > 1, changes };
    });
    curiosities.sort((a, b) => b.changes.size - a.changes.size || a.label.localeCompare(b.label));
    curiosities.forEach((c) => {
      c.partners = curiosities
        .filter((o) => o.id !== c.id && o.moved)
        .map((o) => ({ o, n: [...c.changes].filter((i) => o.changes.has(i)).length }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 2)
        .map((x) => x.o);
    });
    const suites = SUITES.map((s) => ({ s, at: beats.map((b, i) => (suiteHolds(s.id, b) ? i : -1)).filter((i) => i >= 0) })).filter((x) => x.at.length);
    const proximities = PROXIMITIES.map((p) => Object.assign({ p }, measure(p, beats))).filter((x) => x.h > 0);
    const proxAll = Object.fromEntries(PROXIMITIES.map((p) => [p.id, measure(p, beats)]));
    const proxSuites = (A().PROXIMITY_SUITES || [])
      .map((ps) => ({ ps, members: ps.members.map((id) => ({ id, p: PROXIMITIES.find((x) => x.id === id), m: proxAll[id] })).filter((x) => x.p) }))
      .map((x) => Object.assign(x, { held: x.members.filter((m) => m.m.h > 0) }))
      .filter((x) => x.held.length);
    return { beats, curiosities, suites, proximities, proxAll, proxSuites };
  }

  /* ---------- drawing ---------- */
  function cellColor(hue, t) {
    if (t == null || !isFinite(t)) return { bg: "#ece6dc", fg: "#3a3229" };
    const l = 90 - t * 52;
    return { bg: `hsl(${hue} 62% ${l}%)`, fg: l < 58 ? "white" : "#1c1712" };
  }
  function position(id, v) {
    if (v == null) return null;
    const d = A().domain(id);
    if (d.kind === "range") return d.max > d.min ? (Number(v) - d.min) / (d.max - d.min) : 0.5;
    const i = d.options.indexOf(String(v));
    return i < 0 ? null : d.options.length > 1 ? i / (d.options.length - 1) : 0.5;
  }
  function short(v) {
    const s = String(v);
    return s.length > 7 ? s.slice(0, 6) + "…" : s;
  }
  function strip(beats, cell) {
    return `<div class="pr-strip">${beats.map((b, i) => cell(b, i)).join("")}</div>`;
  }
  function litStrip(beats, lit, hue) {
    return strip(beats, (b, i) => {
      const on = lit.includes(i);
      const c = cellColor(hue, on ? 0.75 : null);
      return `<span class="pr-cell${on ? " on" : ""}" style="background:${c.bg};color:${c.fg}" title="${esc(b.at || "beat " + (i + 1))}">${on ? "●" : ""}</span>`;
    });
  }
  function dropBtn(kind, id) {
    return `<button type="button" class="pr-drop" data-kind="${esc(kind)}" data-id="${esc(id)}">Drop onto my moment</button>`;
  }
  function delaysText(d) {
    const lo = Math.min(...d);
    const hi = Math.max(...d);
    const w = (n) => (n === 0 ? "the same beat" : n === 1 ? "1 beat" : n + " beats");
    return lo === hi ? `after ${w(lo)}` : `after ${lo} to ${hi} beats`;
  }

  function bandHtml(band, sp) {
    const b = BANDS.find((x) => x.id === band);
    const beats = sp.beats;
    let rows = [];
    if (band === "curiosity") {
      rows = sp.curiosities.map((c) => {
        const cells = strip(beats, (bt, i) => {
          const v = c.vals[i];
          const col = cellColor(b.hue, position(c.id, v));
          return `<span class="pr-cell" style="background:${col.bg};color:${col.fg}" title="${esc((bt.at || "beat " + (i + 1)) + ": " + (v == null ? "not set" : v))}">${v == null ? "" : esc(short(v))}</span>`;
        });
        const range = c.moved ? `${esc(c.lo)} to ${esc(c.hi)}` : `stays ${esc(c.lo)}`;
        const with_ = c.partners.length ? `<span class="cap">moves with ${c.partners.map((o) => esc(o.label.toLowerCase())).join(", ")}</span>` : "";
        return row(c.label, cells, `<b>${range}</b>${with_}`, dropBtn("curiosity", c.id));
      });
    } else if (band === "suite") {
      rows = sp.suites.map(({ s, at }) => row(s.label, litStrip(beats, at, b.hue), `<b>holds at ${at.length} of ${beats.length} beats</b><span class="cap">${esc(at.map((i) => beats[i].at || "beat " + (i + 1)).join(", "))}</span>`, dropBtn("suite", s.id)));
    } else if (band === "proximity") {
      rows = sp.proximities.map((x) => row(`When ${x.p.when}, ${x.p.then}`, litStrip(beats, x.at, b.hue), `<b>held ${x.h} of ${x.n} times</b><span class="cap">${delaysText(x.delays)}</span>`, dropBtn("proximity", x.p.id)));
    } else {
      rows = sp.proxSuites.map((x) => {
        const lit = [...new Set([].concat(...x.held.map((m) => m.m.at)))];
        const names = x.members.map((m) => `<span class="chip${m.m.h ? " lit" : ""}" style="${m.m.h ? `background:hsl(${b.hue} 55% 42%);border-color:transparent` : ""}">${esc(m.p.then)}</span>`).join(" ");
        return row(x.ps.label, litStrip(beats, lit, b.hue), `<b>${x.held.length} of ${x.members.length} held, ${x.held.reduce((n, m) => n + m.m.h, 0)} times</b><span>${names}</span>`, dropBtn("proximity suite", x.ps.id));
      });
    }
    return `<section class="pr-band" style="--hue:${b.hue}">
      <h3><span class="pr-swatch"></span>${esc(b.label)} <span class="mono">${rows.length}</span></h3>
      <p class="cap">${esc(b.note)}</p>
      ${rows.length ? rows.join("") : `<p class="cap">This film has none in this band.</p>`}
    </section>`;
  }
  function row(name, cells, info, btn) {
    return `<div class="pr-row"><div class="pr-name">${esc(name)}</div><div class="pr-scroll">${cells}</div><div class="pr-info">${info}</div><div class="pr-act">${btn}</div></div>`;
  }

  function beam() {
    const ys = [18, 40, 62, 84];
    const rays = BANDS.map((b, i) => `<path d="M118 51 L300 ${ys[i] - 6} L300 ${ys[i] + 6} Z" fill="hsl(${b.hue} 65% 52%)" opacity="0.85"/><text x="306" y="${ys[i] + 4}" font-size="11" font-family="IBM Plex Mono, monospace" fill="#1c1712">${esc(b.label)}</text>`).join("");
    return `<svg class="pr-beam" viewBox="0 0 420 100" role="img" aria-label="A film splits into curiosities, suites, proximities and proximity suites">
      <text x="0" y="40" font-size="11" font-family="IBM Plex Mono, monospace" fill="#1c1712">a film</text>
      <path d="M0 51 L104 51" stroke="#1c1712" stroke-width="5"/>
      <path d="M96 22 L136 80 L76 80 Z" fill="#fffaf2" stroke="#1c1712" stroke-width="2"/>
      ${rays}
    </svg>`;
  }

  function playingHtml() {
    if (!playing) return "";
    const run = A().running();
    playing.keys = playing.keys.filter((k) => run.includes(k));
    if (!playing.keys.length) {
      playing = null;
      return "";
    }
    const m = playing.m;
    const moves = developMoves();
    return `<div class="pr-play" id="pr-play">
      <p class="pr-line"><span class="pr-dot"></span> Playing on your board in ${span(m)}: <b>${esc(playing.title)}</b></p>
      <p class="cap">${esc(playing.how)}</p>
      <div class="bar-actions">
        ${window.CuriosityAutomate && window.CuriosityAutomate.open ? `<button type="button" id="pr-open">Open in Automate</button>` : ""}
        <button type="button" id="pr-stop">Stop</button>
      </div>
      <div class="pr-panels scroll"><div class="strip" id="pr-panels"></div></div>
      <div class="pr-develop">
        <h3>Develop</h3>
        <p class="cap">Three next moves for this idea. Each one changes what is playing now.</p>
        ${moves.map((mv, i) => `<button type="button" class="pr-move" data-move="${i}" ${mv.off ? "disabled" : ""}><b>${esc(mv.head)}</b> ${esc(mv.text)}</button>`).join("")}
        <p class="cap pr-msg">${esc(playing.msg || "")}</p>
      </div>
    </div>`;
  }

  function draw() {
    if (!A() || !window.CuriosityBoard) {
      root.innerHTML = `<p class="cap">The Prism needs the automation engine.</p>`;
      return;
    }
    css();
    const f = film();
    const sp = spectrum(f);
    const m = moment();
    const opts = (n) => Array.from({ length: m.n }, (_, i) => `<option value="${i}" ${i === n ? "selected" : ""}>${i + 1}</option>`).join("");
    const bands = view.band === "all" ? BANDS.map((b) => b.id) : [view.band];
    root.innerHTML = `
      <h2>Prism</h2>
      <div class="pr-head">
        ${beam()}
        <p class="cap">A film is white light. The Prism splits it into its colors: the curiosities it uses and how low to how high each went, the suites that fully held, the proximities that held and after how many beats, and the proximity suites whose members held. Pick a moment of your own film, then drop any color onto it. It plays there, built from the film's own ranges, and you can develop it from there.</p>
      </div>
      <div class="bar-actions pr-bar">
        <label class="field">Film <select id="pr-film">${films().map((x) => `<option value="${esc(x.id)}" ${x.id === f.id ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select></label>
        ${f.id === "__board" ? `<button type="button" id="pr-reread">Read my board again</button>` : ""}
        <span class="cap">${esc(f.kind || "")} · ${sp.beats.length} beats</span>
      </div>
      <div class="bar-actions pr-bar">
        <span class="mono">My moment: from panel</span> <select id="pr-from" class="pr-n">${opts(m.from)}</select>
        <span class="mono">to</span> <select id="pr-to" class="pr-n">${opts(m.to)}</select>
        <span class="cap">of ${m.n} panels on the board</span>
      </div>
      ${playingHtml()}
      <nav class="subtabs pr-filter">
        <button type="button" data-band="all" class="${view.band === "all" ? "on" : ""}">All four</button>
        ${BANDS.map((b) => `<button type="button" data-band="${esc(b.id)}" class="${view.band === b.id ? "on" : ""}" style="--hue:${b.hue}"><span class="pr-swatch"></span>${esc(b.label)}</button>`).join("")}
      </nav>
      ${sp.beats.length ? bands.map((b) => bandHtml(b, sp)).join("") : `<p class="cap">This film has no beats yet. Trace some in Study.</p>`}
    `;
    root.querySelector("#pr-film").addEventListener("change", (e) => {
      view.film = e.target.value;
      boardFilm = null;
      saveView();
      draw();
    });
    const rr = root.querySelector("#pr-reread");
    if (rr) rr.addEventListener("click", () => ((boardFilm = null), draw()));
    root.querySelector("#pr-from").addEventListener("change", (e) => {
      view.from = Number(e.target.value);
      if (view.to < view.from) view.to = view.from;
      saveView();
      replay();
    });
    root.querySelector("#pr-to").addEventListener("change", (e) => {
      view.to = Number(e.target.value);
      if (view.from > view.to) view.from = view.to;
      saveView();
      replay();
    });
    root.querySelectorAll("[data-band]").forEach((b) => b.addEventListener("click", () => ((view.band = b.dataset.band), saveView(), draw())));
    root.querySelectorAll(".pr-drop").forEach((b) => b.addEventListener("click", () => drop(b.dataset.kind, b.dataset.id, sp)));
    const st = root.querySelector("#pr-stop");
    if (st) st.addEventListener("click", stopAll);
    const op = root.querySelector("#pr-open");
    if (op) op.addEventListener("click", () => window.CuriosityAutomate.open(playing.keys[0]));
    root.querySelectorAll(".pr-move").forEach((b) => b.addEventListener("click", () => {
      const mv = developMoves()[Number(b.dataset.move)];
      if (!mv || mv.off) return;
      mv.run();
      playing.msg = "Done: " + mv.head.replace(/:$/, "") + ".";
      draw();
    }));
    lastSig = "";
    paintPanels();
  }

  /* When the moment changes, the playing patches move with it. */
  function replay() {
    if (playing) {
      const m = moment();
      playing.m = m;
      playing.keys.forEach((k) => A().set(k, { where: { from: m.from, to: m.to } }));
    }
    draw();
  }
  function stopAll() {
    if (playing) playing.keys.forEach((k) => A().stop(k));
    playing = null;
    draw();
  }

  /* ---------- dropping a color onto my moment ---------- */
  function onLane(key, target, changes) {
    if (!A().lanes(key).some((l) => l.target === target)) A().addLane(key, target);
    const l = A().lanes(key).find((x) => x.target === target);
    if (l) A().setLane(key, l.id, Object.assign({ on: true }, changes));
  }
  function laneOff(key, keep) {
    A().lanes(key).forEach((l) => l.on && !keep.includes(l.target) && A().setLane(key, l.id, { on: false }));
  }
  function delayLanes(key, m, beats, name) {
    const lanes = [];
    if (m.n > 0) {
      const share = Math.round((m.h / m.n) * 100) / 100;
      onLane(key, "chance" + name, { from: share, to: share, mod: "follow" });
      lanes.push("chance" + name);
    }
    if (m.h > 0) {
      onLane(key, "delay" + name, { from: Math.min(...m.delays), to: Math.max(...m.delays), mod: "lfo", shape: "triangle", rate: 0.5 });
      lanes.push("delay" + name);
    }
    return lanes;
  }

  function apply(kind, id, sp, m) {
    const beats = sp.beats;
    const where = { from: m.from, to: m.to };
    if (kind === "curiosity") {
      const c = sp.curiosities.find((x) => x.id === id);
      const key = "c:" + id;
      A().set(key, { a: c.lo, b: c.hi, mod: "lfo", shape: "triangle", rate: 0.5, depth: 1, curve: "linear", across: c.moved ? 1 : 0, where });
      const targets = c.partners.map((o) => "c:" + o.id);
      laneOff(key, targets);
      c.partners.forEach((o) => {
        let from = o.vals[c.loAt];
        let to = o.vals[c.hiAt];
        if (from == null || to == null || same(from, to)) (from = o.lo), (to = o.hi);
        onLane(key, "c:" + o.id, { from, to, mod: "follow", curve: "linear" });
      });
      const how = c.moved ? `${c.label} goes from ${c.lo} to ${c.hi} and back, sweeping across the moment` : `${c.label} holds at ${c.lo}`;
      return { key, title: c.label, how: how + (c.partners.length ? `, with ${c.partners.map((o) => o.label.toLowerCase()).join(" and ")} moving along as they did in the film.` : ".") };
    }
    if (kind === "suite") {
      const x = sp.suites.find((s) => s.s.id === id);
      const key = "s:" + id;
      const set = suiteSet(id);
      A().set(key, { a: "", b: id, mod: "lfo", shape: "triangle", rate: 0.5, depth: 1, across: x.at.length < beats.length ? 1 : 0, where });
      const targets = Object.keys(set).filter((k) => A().param("c:" + k)).map((k) => "c:" + k);
      laneOff(key, targets);
      const first = x.at[0];
      Object.keys(set).forEach((k) => {
        if (!A().param("c:" + k)) return;
        const before = beats.slice(0, first).reverse().map((b) => b.values[k]).find((v) => v != null && !same(v, set[k]));
        const other = before != null ? before : beats.map((b) => b.values[k]).find((v) => v != null && !same(v, set[k]));
        onLane(key, "c:" + k, Object.assign({ to: set[k], mod: "follow" }, other != null ? { from: other } : {}));
      });
      return { key, title: x.s.label, how: `The suite comes and goes, and its ${Object.keys(set).length} curiosities grade toward it the way the film led into it.` };
    }
    if (kind === "proximity") {
      const x = sp.proxAll[id];
      const p = PROXIMITIES.find((q) => q.id === id);
      const key = "p:" + id;
      const within = x.delays.length ? mostCommon(x.delays) : p.within || 0;
      A().set(key, { a: { on: false, within }, b: { on: true, within }, mod: "manual", manual: 1, depth: 1, across: 0, where });
      const lanes = delayLanes(key, x, beats, "");
      const cause = Math.round((x.n / beats.length) * 100) / 100;
      onLane(key, "cause", { from: cause, to: cause, mod: "follow" });
      laneOff(key, lanes.concat("cause"));
      return { key, title: `When ${p.when}, ${p.then}`, how: `The cause is set in about ${Math.round(cause * 100)}% of panels, the effect follows ${Math.round((x.h / Math.max(1, x.n)) * 100)}% of the time, ${delaysText(x.delays.length ? x.delays : [within])}, as in the film.` };
    }
    const x = sp.proxSuites.find((q) => q.ps.id === id);
    const key = "ps:" + id;
    A().set(key, { a: { on: false, within: 0 }, b: { on: true, within: 0 }, mod: "manual", manual: 1, depth: 1, across: 0, where });
    let lanes = [];
    x.members.forEach((mm) => (lanes = lanes.concat(delayLanes(key, mm.m, beats, ":" + mm.id))));
    laneOff(key, lanes);
    return { key, title: x.ps.label, how: `${x.held.length} of its ${x.members.length} proximities play with the delays and how often they held in the film.` };
  }

  function drop(kind, id, sp) {
    if (playing) playing.keys.forEach((k) => A().stop(k));
    const m = moment();
    const r = apply(kind, id, sp, m);
    A().start(r.key);
    playing = { kind, id, keys: [r.key], title: r.title, how: r.how, m, sp, msg: "" };
    draw();
    const el = root.querySelector("#pr-play");
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- develop: three next moves ---------- */
  function step(id, v, dir) {
    const d = A().domain(id);
    if (d.kind === "range") return Math.max(d.min, Math.min(d.max, Number(v) + dir * (d.step || 1)));
    const i = d.options.indexOf(String(v));
    return d.options[Math.max(0, Math.min(d.options.length - 1, (i < 0 ? 0 : i) + dir))];
  }
  function answer(sp) {
    const used = playing.keys;
    const held = sp.proximities.filter((x) => !used.includes("p:" + x.p.id));
    const set = playing.kind === "suite" ? Object.keys(suiteSet(playing.id)) : [];
    const prox = playing.kind === "proximity" ? PROXIMITIES.find((q) => q.id === playing.id) : null;
    const linked = held.find((x) => {
      const cx = x.p.x;
      if (playing.kind === "curiosity") return cx.curiosity === playing.id;
      if (playing.kind === "suite") return cx.suite === playing.id || set.includes(cx.curiosity);
      if (prox) return (prox.y.curiosity && cx.curiosity === prox.y.curiosity) || (prox.y.suite && cx.suite === prox.y.suite);
      return !((A().PROXIMITY_SUITES.find((q) => q.id === playing.id) || { members: [] }).members.includes(x.p.id));
    });
    return linked || held[0] || null;
  }
  function developMoves() {
    if (!playing) return [];
    const sp = playing.sp;
    const key = playing.keys[0];
    const p = A().patch(key);
    const moves = [];
    const ans = answer(sp);
    const ansMove = ans
      ? {
          head: "Answer it:",
          text: `add "when ${ans.p.when}, ${ans.p.then}", a proximity this film uses (${delaysText(ans.delays)}).`,
          run() {
            const r = apply("proximity", ans.p.id, sp, playing.m);
            A().start(r.key);
            playing.keys.push(r.key);
          },
        }
      : null;
    if (playing.kind === "curiosity") {
      const id = playing.id;
      const a2 = step(id, p.a, rank(id, p.a) <= rank(id, p.b) ? -1 : 1);
      const b2 = step(id, p.b, rank(id, p.b) >= rank(id, p.a) ? 1 : -1);
      const wider = !same(a2, p.a) || !same(b2, p.b);
      moves.push({ head: "Push it further:", text: wider ? `widen the range to ${a2} to ${b2}.` : "it already spans the whole scale.", off: !wider, run: () => A().set(key, { a: a2, b: b2 }) });
      const facet = (A().FACETS[id] || []).find((f) => A().param("c:" + f) && !A().lanes(key).some((l) => l.target === "c:" + f && l.on));
      if (ansMove) moves.push(ansMove);
      else if (facet) {
        const fc = sp.curiosities.find((c) => c.id === facet);
        const d = A().domain(facet);
        const from = fc && fc.moved ? fc.lo : d.kind === "range" ? d.min : d.options[0];
        const to = fc && fc.moved ? fc.hi : d.kind === "range" ? d.max : d.options[d.options.length - 1];
        moves.push({ head: "Give it another side:", text: `grade ${label(facet).toLowerCase()} from ${from} to ${to} along with it.`, run: () => onLane(key, "c:" + facet, { from, to, mod: "follow" }) });
      }
      moves.push({
        head: "Turn it around:",
        text: `swap from and to, so it starts at ${p.b} and moves to ${p.a}.`,
        run() {
          A().set(key, { a: p.b, b: p.a });
          A().lanes(key).filter((l) => l.on && l.target.startsWith("c:")).forEach((l) => A().setLane(key, l.id, { from: l.to, to: l.from }));
        },
      });
      return moves;
    }
    if (playing.kind === "suite") {
      const on = p.mod === "manual";
      moves.push({ head: "Push it further:", text: on ? "it already holds in every panel of the moment." : "hold it in every panel of the moment instead of coming and going.", off: on, run: () => A().set(key, { mod: "manual", manual: 1 }) });
    } else {
      const lanes = A().lanes(key).filter((l) => l.on && /^delay|^chance/.test(l.target));
      const full = lanes.every((l) => (l.target.startsWith("chance") ? Number(l.from) >= 1 && Number(l.to) >= 1 : false));
      moves.push({
        head: "Push it further:",
        text: "make the effect follow every time, and let the delay stretch one beat longer.",
        off: full && !lanes.some((l) => l.target.startsWith("delay")),
        run: () => lanes.forEach((l) => A().setLane(key, l.id, l.target.startsWith("chance") ? { from: 1, to: 1 } : { to: Number(l.to) + 1 })),
      });
    }
    if (ansMove) moves.push(ansMove);
    else {
      const other = sp.suites.find((x) => !playing.keys.includes("s:" + x.s.id));
      if (other)
        moves.push({
          head: "Answer it:",
          text: `add the suite ${other.s.label}, which this film holds too.`,
          run() {
            const r = apply("suite", other.s.id, sp, playing.m);
            A().start(r.key);
            playing.keys.push(r.key);
          },
        });
    }
    if (playing.kind === "suite")
      moves.push({
        head: "Turn it around:",
        text: "swap from and to, so the suite plays where it was absent and its curiosities grade away from it.",
        run() {
          A().set(key, { a: p.b, b: p.a });
          A().lanes(key).filter((l) => l.on && l.target.startsWith("c:")).forEach((l) => A().setLane(key, l.id, { from: l.to, to: l.from }));
        },
      });
    else
      moves.push({
        head: "Turn it around:",
        text: "swap the delay's from and to, so the effect starts late and comes sooner as it goes.",
        run: () => A().lanes(key).filter((l) => l.on && l.target.startsWith("delay")).forEach((l) => A().setLane(key, l.id, { from: l.to, to: l.from })),
      });
    return moves.slice(0, 3);
  }

  /* ---------- the board, live ---------- */
  function visible() {
    return !root.classList.contains("hidden") && root.isConnected;
  }
  function paintPanels(panels) {
    const el = root.querySelector("#pr-panels");
    const B = window.CuriosityBoard;
    if (!el || !playing || !B || !B.panel) return;
    const n = playing.m.n;
    if (!panels) panels = A().resolve(n).panels;
    const sig = JSON.stringify(panels);
    if (sig === lastSig) return;
    lastSig = sig;
    const sc = B.scene();
    try {
      el.innerHTML = panels.map((v, i) => `<div class="pr-pan${i >= playing.m.from && i <= playing.m.to ? " in" : ""}">${B.panel(sc.lines[i % sc.lines.length], i, panels.length, v)}</div>`).join("");
    } catch (e) {
      el.innerHTML = `<p class="cap">The board could not draw.</p>`;
    }
  }
  function hook() {
    if (!A()) return;
    A().on((type, data) => {
      if (type !== "tick" || !playing || !visible()) return;
      const now = performance.now();
      if (now - lastPaint < 200) return;
      lastPaint = now;
      if (data.panels.length === playing.m.n) paintPanels(data.panels);
    });
  }

  function css() {
    if (document.getElementById("prism-style")) return;
    const st = document.createElement("style");
    st.id = "prism-style";
    st.textContent = `
      #prism, #prism * { box-sizing: border-box; }
      #prism { max-width: 100%; overflow-wrap: anywhere; }
      #prism .pr-head { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 14px; align-items: center; }
      #prism .pr-beam { width: 100%; height: auto; display: block; }
      #prism .pr-bar { margin: 10px 0; }
      #prism .pr-bar select { max-width: 100%; font-family: var(--mono); }
      #prism .pr-bar select.pr-n { width: auto; min-width: 56px; flex: 0 0 auto; }
      #prism .pr-bar label.field { min-width: 0; flex: 1 1 260px; max-width: 520px; }
      #prism .pr-swatch { display: inline-block; width: 12px; height: 12px; margin-right: 6px; vertical-align: -1px; background: hsl(var(--hue) 65% 50%); border: 1px solid var(--ink); }
      #prism .pr-filter button { white-space: nowrap; }
      #prism .pr-band { border-left: 8px solid hsl(var(--hue) 65% 50%); padding: 6px 0 6px 12px; margin: 14px 0; background: linear-gradient(90deg, hsl(var(--hue) 70% 50% / 0.08), transparent 40%); }
      #prism .pr-band h3 { font-family: var(--serif); font-weight: 500; font-size: 18px; margin: 0 0 2px; }
      #prism .pr-row { display: grid; grid-template-columns: minmax(120px, 190px) minmax(0, 1fr) minmax(140px, 220px) auto; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
      #prism .pr-name { font-weight: 500; }
      #prism .pr-scroll { overflow-x: auto; min-width: 0; }
      #prism .pr-strip { display: flex; gap: 2px; width: max-content; }
      #prism .pr-cell { flex: 0 0 48px; width: 48px; height: 26px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 10px; border: 1px solid rgba(28,23,18,0.18); overflow: hidden; white-space: nowrap; }
      #prism .pr-info { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
      #prism .pr-info b { font-family: var(--mono); font-size: 12px; font-weight: 500; }
      #prism .pr-drop { white-space: nowrap; }
      #prism .pr-drop:hover, #prism .pr-move:hover:not([disabled]) { background: var(--ink); color: var(--paper); }
      #prism .pr-play { border: 3px solid var(--ink); background: white; padding: 10px 12px; margin: 12px 0; }
      #prism .pr-line { margin: 0 0 4px; font-size: 15px; }
      #prism .pr-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--saffron); animation: pr-pulse 1s infinite alternate; }
      @keyframes pr-pulse { from { opacity: 1; } to { opacity: 0.3; } }
      #prism .pr-panels { max-width: 100%; margin: 10px 0; }
      #prism .pr-panels .strip { display: flex; gap: 6px; width: max-content; overflow: visible; }
      #prism .pr-pan { opacity: 0.45; }
      #prism .pr-pan.in { opacity: 1; }
      #prism .pr-pan .panel { width: 180px; flex: 0 0 180px; }
      #prism .pr-pan.in .panel { outline: 3px solid var(--saffron); outline-offset: 2px; }
      #prism .pr-develop h3 { font-family: var(--serif); font-weight: 500; font-size: 17px; margin: 6px 0 2px; }
      #prism .pr-move { display: block; width: 100%; text-align: left; margin: 6px 0; padding: 8px 10px; font-family: var(--sans); font-size: 14px; white-space: normal; }
      #prism .pr-move b { font-family: var(--mono); font-weight: 500; }
      #prism .pr-move[disabled] { opacity: 0.5; }
      #prism .pr-msg { color: var(--saffron); min-height: 1em; }
      @media (max-width: 760px) {
        #prism .pr-head { grid-template-columns: 1fr; }
        #prism .pr-row { grid-template-columns: minmax(0, 1fr) auto; }
        #prism .pr-scroll, #prism .pr-info { grid-column: 1 / -1; }
        #prism .pr-act { grid-column: 2; grid-row: 1; }
        #prism .pr-drop { white-space: normal; }
      }
    `;
    document.head.appendChild(st);
  }

  hook();
  window.CuriosityPrism = { draw };
})();
