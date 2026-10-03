/* Cross-pollinate: four short games, one per automation level, for film students.
   Each takes one or more inspiration films (studies: counts and ids only, or a suite used as an
   inspiration) and turns what they do into an automation patch for your own film (window.CurioAuto).
   1 Curiosity: Catch the rhythm.  2 Suite: Suite swap.  3 Proximity: Cause and effect.
   4 Proximity suite: Chain reaction. */

(function () {
  const root = document.getElementById("games");
  if (!root) return;
  const KEY = "curiosities-games-v1";
  const BEAT = 0.6; // seconds per beat when a game plays a trace
  const SHAPES = ["square", "sine", "triangle", "saw", "random"];
  const GAMES = [
    { id: "rhythm", level: "Curiosity", label: "1 · Catch the rhythm", goal: "Recreate one curiosity's rhythm from an inspiration film as an automation, beat by beat." },
    { id: "swap", level: "Suite", label: "2 · Suite swap", goal: "Tell which suite each beat belongs to, then build an LFO that flips between them at the films' rhythm." },
    { id: "cause", level: "Proximity", label: "3 · Cause and effect", goal: "A curiosity is hidden. Name the proximity that explains it and its delay in beats." },
    { id: "chain", level: "Proximity suite", label: "4 · Chain reaction", goal: "Chain two or three proximities from different films into one proximity suite and fire it." },
  ];

  /* ---------- small helpers ---------- */
  function load() {
    try {
      return Object.assign({ tab: "rhythm", best: {}, unlocked: [], g1: {}, g2: {}, g3: {}, g4: {} }, JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (e) {
      return { tab: "rhythm", best: {}, unlocked: [], g1: {}, g2: {}, g3: {}, g4: {} };
    }
  }
  const S = load();
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}
  }
  function best(id, score) {
    if (score != null && score > (S.best[id] || 0)) {
      S.best[id] = score;
      save();
    }
    return S.best[id] || 0;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  const same = (a, b) => a != null && b != null && String(a) === String(b);
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const byId = Object.fromEntries((typeof CURIOSITIES !== "undefined" ? CURIOSITIES : []).map((c) => [c.id, c]));
  const label = (id) => (byId[id] ? byId[id].label : id);
  const A = () => window.CurioAuto;
  function domain(id) {
    return A() ? A().domain(id) : { kind: "choice", options: [] };
  }
  function opts(list, v) {
    return list.map((o) => `<option value="${esc(o)}" ${String(o) === String(v) ? "selected" : ""}>${esc(o)}</option>`).join("");
  }
  function shapeAt(shape, phase, seed) {
    const f = phase - Math.floor(phase);
    if (shape === "sine") return 0.5 - 0.5 * Math.cos(f * 2 * Math.PI);
    if (shape === "triangle") return f < 0.5 ? f * 2 : 2 - f * 2;
    if (shape === "saw") return f;
    if (shape === "random") { const x = Math.sin(Math.floor(phase) * 91.7 + seed * 13.1) * 43758.5; return x - Math.floor(x); }
    return f < 0.5 ? 0 : 1;
  }

  /* ---------- inspirations: studies, plus suites used as inspiration films ---------- */
  function suiteFilm(suite) {
    const others = SUITES.filter((s) => s.id !== suite.id && (s.kind || "") === (suite.kind || ""));
    const other = others[(suite.id.length * 7) % Math.max(1, others.length)] || SUITES[0];
    let h = 0;
    for (const ch of suite.id) h = (h * 31 + ch.charCodeAt(0)) % 997;
    const run = 1 + (h % 3);
    const beats = Array.from({ length: 8 }, (_, i) => ({ values: Object.assign({}, Math.floor(i / run) % 2 ? other.set : suite.set) }));
    return { id: "suite:" + suite.id, title: `Inspiration: ${suite.label} (suite)`, beats, suite: suite.id, other: other.id };
  }
  function films() {
    const st = window.CuriosityStudy && window.CuriosityStudy.studies ? window.CuriosityStudy.studies() : [];
    const list = st.filter((s) => s.beats && s.beats.length >= 2).map((s) => ({ id: s.id, title: s.title, beats: s.beats }));
    const pick = SUITES.filter((s) => s.kind === "genre" || s.kind === "emotion" || ["noir", "build", "drop", "wet-night", "brawl", "storm"].includes(s.id));
    return list.concat(pick.map(suiteFilm));
  }
  function film(id) {
    const all = films();
    return all.find((f) => f.id === id) || all[0];
  }
  function filmSelect(attr, v) {
    const all = films();
    const st = all.filter((f) => !f.suite), su = all.filter((f) => f.suite);
    return `<select ${attr}>${st.length ? `<optgroup label="Studies">${st.map((f) => `<option value="${esc(f.id)}" ${f.id === v ? "selected" : ""}>${esc(f.title)}</option>`).join("")}</optgroup>` : ""}<optgroup label="Genre and emotion suites">${su.map((f) => `<option value="${esc(f.id)}" ${f.id === v ? "selected" : ""}>${esc(f.title)}</option>`).join("")}</optgroup></select>`;
  }
  /* One curiosity across the beats, gaps filled with the value before. */
  function trace(f, id) {
    let last = null;
    const out = f.beats.map((b) => (b.values[id] != null ? (last = b.values[id]) : last));
    const first = out.find((v) => v != null);
    return out.map((v) => (v == null ? first : v));
  }
  function changingIds(f) {
    const ids = {};
    f.beats.forEach((b) => Object.keys(b.values).forEach((k) => (ids[k] = 1)));
    return Object.keys(ids)
      .map((id) => {
        const t = trace(f, id);
        return { id, changes: t.filter((v, i) => i && !same(v, t[i - 1])).length, n: new Set(t.map(String)).size };
      })
      .filter((x) => x.n >= 2 && byId[x.id])
      .sort((a, b) => b.changes - a.changes);
  }
  /* Proximity tests over study beats (the same rules the Study tab counts). */
  function condHolds(c, beats, j) {
    const beat = beats[j];
    if (!beat) return false;
    if (c.suite) { const s = SUITES.find((x) => x.id === c.suite); return !!s && Object.entries(s.set).every(([k, v]) => same(beat.values[k], v)); }
    const v = beat.values[c.curiosity];
    if ("is" in c) return same(v, c.is);
    if (j === 0) return false;
    const prev = beats[j - 1].values[c.curiosity];
    if (v == null || prev == null) return false;
    if (c.change === "changes") return !same(v, prev);
    const d = domain(c.curiosity);
    const rank = (x) => (d.kind === "range" ? Number(x) : (d.options || []).indexOf(x));
    return c.change === "rises" ? rank(v) > rank(prev) : rank(v) < rank(prev);
  }
  function proxIn(p, beats) {
    let triggers = 0, held = 0;
    for (let i = 0; i < beats.length; i++) {
      if (!condHolds(p.x, beats, i)) continue;
      triggers++;
      for (let j = i; j <= Math.min(beats.length - 1, i + p.within); j++) if (condHolds(p.y, beats, j)) { held++; break; }
    }
    return { triggers, held, holds: triggers > 0 && held === triggers };
  }
  const PROX = () => PROXIMITIES.filter((p) => p.x && p.y);
  function useBtn(id) {
    return `<button type="button" class="use" data-use="${id}">Use this automation in my film</button>`;
  }
  function boardPanels(values, n) {
    const B = window.CuriosityBoard;
    if (!B || !B.panel) return "";
    const sc = B.scene();
    const len = Math.min(n, 8);
    let h = "";
    for (let i = 0; i < len; i++) {
      const v = {};
      Object.entries(values).forEach(([k, arr]) => (v[k] = arr[i]));
      try { h += B.panel(sc.lines[i % sc.lines.length], i, len, v); } catch (e) {}
    }
    return h ? `<div class="g-panels scroll"><div class="strip">${h}</div></div>` : "";
  }
  function toast(el, msg) {
    const p = el.querySelector(".g-msg");
    if (p) p.textContent = msg;
  }

  /* ---------- 1. Catch the rhythm ---------- */
  let anim = null;
  let unsubscribe = null;
  function g1(el) {
    const s = Object.assign({ film: films()[0].id, cur: "", a: "", b: "", shape: "square", per: 2, phase: 0, mode: "lfo", taps: [], score: null }, S.g1);
    S.g1 = s;
    const f = film(s.film);
    s.film = f.id;
    const ids = changingIds(f);
    if (!ids.length) { el.innerHTML = `<p>${esc(f.title)} has no curiosity that changes. Pick another inspiration.</p>`; return; }
    if (!ids.find((x) => x.id === s.cur)) { s.cur = ids[0].id; s.a = ""; s.b = ""; s.taps = []; }
    const T = trace(f, s.cur);
    const d = domain(s.cur);
    const vals = d.kind === "range" ? Array.from({ length: Math.round((d.max - d.min) / (d.step || 1)) + 1 }, (_, i) => d.min + i * (d.step || 1)) : d.options.slice();
    T.forEach((v) => { if (!vals.map(String).includes(String(v))) vals.push(v); });
    if (s.a === "" || !vals.map(String).includes(String(s.a))) s.a = T[0];
    if (s.b === "" || !vals.map(String).includes(String(s.b))) s.b = T.find((v) => !same(v, T[0])) || vals[vals.length - 1];
    const n = T.length;
    const yours = () =>
      s.mode === "tap"
        ? T.map((_, i) => (s.taps[i] ? s.b : s.a))
        : T.map((_, i) => {
            const m = shapeAt(s.shape, i / s.per + s.phase, 1);
            if (d.kind === "range" && !isNaN(Number(s.a)) && !isNaN(Number(s.b))) { const st = d.step || 1; return Math.round((Number(s.a) + (Number(s.b) - Number(s.a)) * m) / st) * st; }
            return m < 0.5 ? s.a : s.b;
          });
    const scoreOf = () => Math.round((yours().filter((v, i) => same(v, T[i])).length / n) * 100);
    const cell = (v, i, ok) => `<span class="g-cell ${ok == null ? "" : ok ? "ok" : "bad"}" data-i="${i}" title="beat ${i + 1}">${esc(v)}</span>`;
    function paint() {
      const Y = yours();
      el.querySelector("#g1-target").innerHTML = T.map((v, i) => cell(v, i)).join("");
      el.querySelector("#g1-yours").innerHTML = Y.map((v, i) => cell(v, i, same(v, T[i]))).join("");
      s.score = scoreOf();
      el.querySelector(".g-score").innerHTML = `Score <b>${s.score}</b> · best ${best("rhythm", s.score)}`;
      save();
    }
    el.innerHTML = `
      <div class="bar-actions">
        <label class="field">Inspiration film${filmSelect('data-k="film"', s.film)}</label>
        <label class="field">Curiosity<select data-k="cur">${ids.map((x) => `<option value="${esc(x.id)}" ${x.id === s.cur ? "selected" : ""}>${esc(label(x.id))} (${x.changes} changes)</option>`).join("")}</select></label>
      </div>
      <p class="cap">The film's trace of <b>${esc(label(s.cur))}</b>, one value per beat:</p>
      <div class="g-row" id="g1-target"></div>
      ${boardPanels({ [s.cur]: T }, n)}
      <p class="cap">Your automation: A and B, then an LFO shape and how many beats one cycle takes. Or tap it in time with a key or a MIDI note.</p>
      <div class="bar-actions">
        <label class="field">A<select data-k="a">${opts(vals, s.a)}</select></label>
        <label class="field">B<select data-k="b">${opts(vals, s.b)}</select></label>
        <label class="field">Mode<select data-k="mode">${opts(["lfo", "tap"], s.mode)}</select></label>
      </div>
      <div class="bar-actions g-lfo" ${s.mode === "tap" ? "hidden" : ""}>
        <label class="field">Shape<select data-k="shape">${opts(SHAPES, s.shape)}</select></label>
        <label class="field">Beats per cycle <b>${s.per}</b><input type="range" min="1" max="8" step="1" data-k="per" value="${s.per}"></label>
        <label class="field">Phase <b>${s.phase}</b><input type="range" min="0" max="0.95" step="0.05" data-k="phase" value="${s.phase}"></label>
      </div>
      <div class="bar-actions g-tap" ${s.mode === "tap" ? "" : "hidden"}>
        <button type="button" data-act="rec">Record taps</button>
        <span class="cap">Hold Space, any key, or a MIDI note (pad, body strap) while the beat should be B. ${esc((A() && A().midi.status) || "")}</span>
        <button type="button" data-act="midi">Connect MIDI</button>
      </div>
      <p class="cap">Yours:</p>
      <div class="g-row" id="g1-yours"></div>
      <div class="bar-actions">${useBtn("rhythm")} <button type="button" data-act="see">See the film's trace on the board</button></div>`;
    paint();
    el.querySelectorAll("[data-k]").forEach((x) =>
      x.addEventListener(x.type === "range" ? "input" : "change", () => {
        const k = x.dataset.k;
        s[k] = x.type === "range" ? Number(x.value) : x.value;
        if (k === "film" || k === "cur" || k === "mode") { if (k !== "mode") { s.a = ""; s.b = ""; s.taps = []; if (k === "film") s.cur = ""; } save(); return g1(el); }
        if (x.type === "range") x.parentElement.querySelector("b").textContent = x.value;
        paint();
      })
    );
    el.querySelector('[data-act="midi"]').addEventListener("click", () => A() && A().connectMidi().then(() => g1(el)));
    el.querySelector('[data-act="see"]').addEventListener("click", () => {
      if (!window.CuriosityBoard) return;
      window.CuriosityBoard.apply("Inspiration: " + label(s.cur), { [s.cur]: T });
      const b = document.querySelector('.tabs button[data-tab="board"]');
      if (b) b.click();
    });
    el.querySelector('[data-act="rec"]').addEventListener("click", () => {
      if (anim) cancelAnimationFrame(anim);
      let down = false;
      const keyDown = (e) => { if (e.repeat || /input|select|textarea/i.test(e.target.tagName)) return; down = true; if (e.code === "Space") e.preventDefault(); };
      const keyUp = () => (down = false);
      window.addEventListener("keydown", keyDown);
      window.addEventListener("keyup", keyUp);
      const off = A() ? A().on((type, ev) => { if (type === "midi" && ev.kind === "note") { down = ev.on; if (ev.on) s.lastNote = ev.num; } }) : null;
      s.taps = T.map(() => false);
      const t0 = performance.now();
      const step = (now) => {
        const i = Math.floor((now - t0) / (BEAT * 1000));
        const done = i >= n || !el.isConnected || root.classList.contains("hidden");
        if (!done) {
          s.taps[i] = s.taps[i] || down;
          el.querySelectorAll("#g1-target .g-cell").forEach((c, k) => c.classList.toggle("now", k === i));
          paint();
          anim = requestAnimationFrame(step);
          return;
        }
        window.removeEventListener("keydown", keyDown);
        window.removeEventListener("keyup", keyUp);
        if (off) off();
        anim = null;
        el.querySelectorAll(".g-cell.now").forEach((c) => c.classList.remove("now"));
        paint();
      };
      anim = requestAnimationFrame(step);
    });
    el.querySelector('[data-use="rhythm"]').addEventListener("click", () => {
      if (!A()) return;
      const key = "c:" + s.cur;
      let shape = s.shape, rate = 1 / (s.per * BEAT);
      if (s.mode === "tap") {
        // the taps become a square LFO at the average length of a run
        const runs = [];
        let r = 1;
        for (let i = 1; i < n; i++) { if (s.taps[i] === s.taps[i - 1]) r++; else { runs.push(r); r = 1; } }
        runs.push(r);
        const avg = runs.reduce((x, y) => x + y, 0) / runs.length;
        shape = "square";
        rate = 1 / (2 * avg * BEAT);
        if (s.lastNote != null) A().bind(key, { kind: "note", num: s.lastNote });
      }
      A().set(key, { a: s.a, b: s.b, mod: "lfo", shape, rate: Math.round(rate * 100) / 100, depth: 1, mode: "toggle" });
      A().start(key);
      toast(el, `Running on your board: ${label(s.cur)} flicks ${s.a} ↔ ${s.b}, ${shape} at ${rate.toFixed(2)} Hz${s.mode === "tap" && s.lastNote != null ? `, MIDI note ${s.lastNote} toggles it` : ""}.`);
    });
  }

  /* ---------- 2. Suite swap ---------- */
  function dominant(f) {
    if (f.suite) return f.suite;
    let bestS = SUITES[0].id, bs = -1;
    SUITES.forEach((su) => {
      const keys = Object.keys(su.set);
      const sc = f.beats.reduce((t, b) => t + keys.filter((k) => same(b.values[k], su.set[k])).length / keys.length, 0);
      if (sc > bs) { bs = sc; bestS = su.id; }
    });
    return bestS;
  }
  function runLength(f) {
    const ids = changingIds(f);
    if (!ids.length) return 2;
    const t = trace(f, ids[0].id);
    const runs = [];
    let r = 1;
    for (let i = 1; i < t.length; i++) { if (same(t[i], t[i - 1])) r++; else { runs.push(r); r = 1; } }
    runs.push(r);
    return clamp(Math.round(runs.reduce((a, b) => a + b, 0) / runs.length), 1, 4);
  }
  function g2(el) {
    const all = films();
    const s = Object.assign({ fa: all[0].id, fb: (all[1] || all[0]).id, picks: [], per: 2, phase: 0 }, S.g2);
    S.g2 = s;
    const FA = film(s.fa), FB = film(s.fb);
    let SA = dominant(FA), SB = dominant(FB);
    if (SA === SB) SB = (FB.other || SUITES.find((x) => x.id !== SA).id);
    const suA = SUITES.find((x) => x.id === SA), suB = SUITES.find((x) => x.id === SB);
    const L = Math.round((runLength(FA) + runLength(FB)) / 2);
    const n = 8;
    const target = Array.from({ length: n }, (_, i) => (Math.floor(i / L) % 2 ? "B" : "A"));
    const beatVals = target.map((t, i) => {
      const src = t === "A" ? FA : FB;
      return Object.assign({}, src.beats[i % src.beats.length].values, (t === "A" ? suA : suB).set);
    });
    if (s.picks.length !== n) s.picks = Array(n).fill("");
    const lfo = () => target.map((_, i) => (shapeAt("square", i / (2 * s.per) + s.phase, 2) < 0.5 ? "A" : "B"));
    function paint() {
      const p1 = s.picks.filter((p, i) => p === target[i]).length;
      const l = lfo();
      const p2 = l.filter((p, i) => p === target[i]).length;
      const sc = Math.round(((p1 + p2) / (2 * n)) * 100);
      el.querySelector(".g-score").innerHTML = `Score <b>${sc}</b> (picks ${p1}/${n}, LFO ${p2}/${n}) · best ${best("swap", sc)}`;
      el.querySelector("#g2-lfo").innerHTML = l.map((v, i) => `<span class="g-cell ${v === target[i] ? "ok" : "bad"}">${v}</span>`).join("");
      el.querySelectorAll("[data-pick]").forEach((b) => b.classList.toggle("on", s.picks[Number(b.dataset.i)] === b.dataset.pick));
      el.querySelectorAll(".g-beat").forEach((b, i) => b.classList.toggle("done", !!s.picks[i]));
      save();
    }
    const chipsFor = (v, su) => Object.keys(Object.assign({}, suA.set, suB.set)).filter((k) => v[k] != null).slice(0, 5).map((k) => `<span class="chip">${esc(label(k))}: ${esc(v[k])}</span>`).join("");
    el.innerHTML = `
      <div class="bar-actions">
        <label class="field">Film A${filmSelect('data-k="fa"', s.fa)}</label>
        <label class="field">Film B${filmSelect('data-k="fb"', s.fb)}</label>
      </div>
      <p class="cap">Film A leans on <span class="chip suite">A · ${esc(suA.label)}</span> and film B on <span class="chip suite">B · ${esc(suB.label)}</span>. Eight beats cut between them. Which suite is each beat?</p>
      <div class="g-beats">${beatVals.map((v, i) => `<div class="g-beat"><b>Beat ${i + 1}</b><div>${chipsFor(v)}</div><div class="bar-actions"><button type="button" data-pick="A" data-i="${i}">A</button><button type="button" data-pick="B" data-i="${i}">B</button></div></div>`).join("")}</div>
      <p class="cap">Now the LFO: a square wave that flips A ↔ B. How many beats does each side hold?</p>
      <div class="bar-actions">
        <label class="field">Beats per side <b>${s.per}</b><input type="range" min="1" max="4" step="1" data-k="per" value="${s.per}"></label>
        <label class="field">Start on <select data-k="phase">${[["0", "A"], ["0.5", "B"]].map(([v, l]) => `<option value="${v}" ${Number(v) === s.phase ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      </div>
      <div class="g-row" id="g2-lfo"></div>
      <div class="bar-actions">${useBtn("swap")}</div>`;
    paint();
    el.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => { s.picks[Number(b.dataset.i)] = b.dataset.pick; paint(); }));
    el.querySelectorAll("[data-k]").forEach((x) =>
      x.addEventListener(x.type === "range" ? "input" : "change", () => {
        const k = x.dataset.k;
        s[k] = k === "fa" || k === "fb" ? x.value : Number(x.value);
        if (k === "fa" || k === "fb") { s.picks = []; save(); return g2(el); }
        if (x.type === "range") x.parentElement.querySelector("b").textContent = x.value;
        paint();
      })
    );
    el.querySelector('[data-use="swap"]').addEventListener("click", () => {
      if (!A()) return;
      const key = "s:" + SB;
      const rate = 1 / (2 * s.per * BEAT);
      A().set(key, { a: s.phase ? SB : SA, b: s.phase ? SA : SB, mod: "lfo", shape: "square", rate: Math.round(rate * 100) / 100, depth: 1, mode: "toggle" });
      A().start(key);
      toast(el, `Running on your board: ${suA.label} ↔ ${suB.label}, every ${s.per} beat${s.per > 1 ? "s" : ""} (${rate.toFixed(2)} Hz).`);
    });
  }

  /* ---------- 3. Cause and effect ---------- */
  function stepVal(id, v, dir) {
    const d = domain(id);
    if (d.kind === "range") return clamp(Number(v == null ? d.min : v) + dir * (d.step || 1), d.min, d.max);
    const o = d.options || [];
    const i = Math.max(0, o.indexOf(v));
    return o[clamp(i + dir, 0, o.length - 1)];
  }
  function makeQuestion(f, seed) {
    const ps = PROX().filter((p) => !p.x.suite && !p.y.suite);
    const held = ps.filter((p) => proxIn(p, f.beats).holds);
    const pool = held.length && seed % 2 === 0 ? held : ps;
    const P = pool[seed % pool.length];
    const n = Math.max(6, Math.min(8, f.beats.length));
    const beats = Array.from({ length: n }, (_, i) => ({ values: Object.assign({}, f.beats[i % f.beats.length].values) }));
    const delay = P.within === 0 ? 0 : 1 + (seed % P.within);
    const i = 1 + (seed % Math.max(1, n - delay - 2));
    const j = i + delay;
    // make the cause happen at beat i, and not before
    const xo = domain(P.x.curiosity).options || [];
    if ("is" in P.x) {
      beats.forEach((b, k) => { if (k !== i && same(b.values[P.x.curiosity], P.x.is)) b.values[P.x.curiosity] = xo.find((o) => !same(o, P.x.is)) || null; });
      beats[i].values[P.x.curiosity] = P.x.is;
    } else {
      const v0 = beats[0].values[P.x.curiosity] != null ? beats[0].values[P.x.curiosity] : stepVal(P.x.curiosity, null, 1);
      beats.forEach((b, k) => (b.values[P.x.curiosity] = k < i ? v0 : stepVal(P.x.curiosity, v0, P.x.change === "drops" ? -1 : 1)));
    }
    // the hidden effect at beat j
    const y = P.y.curiosity;
    const before = beats[Math.max(0, j - 1)].values[y];
    const eff = "is" in P.y ? P.y.is : stepVal(y, before, P.y.change === "drops" ? -1 : 1);
    beats.forEach((b, k) => (b.values[y] = k < j ? (before != null ? before : stepVal(y, eff, -1)) : eff));
    const others = ps.filter((p) => p.id !== P.id && p.y.curiosity !== y);
    const choices = [P].concat(others.filter((_, k) => (k + seed) % 3 === 0).slice(0, 3));
    while (choices.length < 4 && others.length >= choices.length) choices.push(others[choices.length]);
    choices.sort((a, b) => ((a.id.length * 7 + seed) % 5) - ((b.id.length * 7 + seed) % 5));
    return { P, beats, i, j, delay, y, choices };
  }
  function g3(el) {
    const s = Object.assign({ film: films()[0].id, seed: 1, total: 0, rounds: 0, answered: false, pick: "", delay: 0 }, S.g3);
    S.g3 = s;
    const f = film(s.film);
    s.film = f.id;
    const q = makeQuestion(f, s.seed);
    const rows = [q.P.x.curiosity].concat(Object.keys(q.beats[0].values).filter((k) => k !== q.P.x.curiosity && k !== q.y && byId[k]).slice(0, 2));
    const unlocked = S.unlocked || [];
    el.innerHTML = `
      <div class="bar-actions"><label class="field">Inspiration film${filmSelect('data-k="film"', s.film)}</label></div>
      <p class="cap">Round ${s.rounds + 1}. One curiosity is hidden (the ? row). It changed at the beat marked ★. Which proximity explains it, and how many beats after its cause?</p>
      <div class="scroll"><table class="trace g-q"><tr><th></th>${q.beats.map((_, k) => `<th>${k + 1}</th>`).join("")}</tr>
        ${rows.map((id) => `<tr><td>${esc(label(id))}</td>${q.beats.map((b) => `<td>${esc(b.values[id] != null ? b.values[id] : "·")}</td>`).join("")}</tr>`).join("")}
        <tr><td><b>? hidden</b></td>${q.beats.map((b, k) => `<td>${s.answered ? esc(b.values[q.y]) : k === q.j ? "★" : "?"}</td>`).join("")}</tr></table></div>
      <div class="g-choices">${q.choices.map((p) => `<label class="field"><span><input type="radio" name="g3p" value="${esc(p.id)}" ${s.pick === p.id ? "checked" : ""} ${s.answered ? "disabled" : ""}> When ${esc(p.when)}, ${esc(p.then)}</span></label>`).join("")}</div>
      <div class="bar-actions">
        <label class="field">Delay in beats<select data-k="delay" ${s.answered ? "disabled" : ""}>${opts([0, 1, 2, 3, 4], s.delay)}</select></label>
        <button type="button" data-act="answer" ${s.answered ? "disabled" : ""}>Answer</button>
        <button type="button" data-act="next">Next round</button>
      </div>
      ${s.answered ? `<p>${s.pick === q.P.id ? "Right proximity." : `It was: when ${esc(q.P.when)}, ${esc(q.P.then)}.`} ${Number(s.delay) === q.delay ? "Right delay." : `The delay was ${q.delay}.`} The hidden curiosity was ${esc(label(q.y))}.</p>` : ""}
      <p class="cap">Unlocked patches: ${unlocked.length ? unlocked.map((id) => `<button type="button" class="chip-btn" data-unl="${esc(id)}">${esc(id)}</button>`).join(" ") : "none yet. A right answer unlocks that proximity."}</p>
      <div class="bar-actions">${useBtn("cause")}</div>`;
    const sc = s.rounds ? Math.round(s.total / s.rounds) : 0;
    el.querySelector(".g-score").innerHTML = `Score <b>${sc}</b> over ${s.rounds} round${s.rounds === 1 ? "" : "s"} · best ${best("cause", s.rounds >= 3 ? sc : null)}`;
    el.querySelectorAll('input[name="g3p"]').forEach((r) => r.addEventListener("change", () => { s.pick = r.value; save(); }));
    el.querySelector('[data-k="film"]').addEventListener("change", (e) => { s.film = e.target.value; s.answered = false; s.pick = ""; save(); g3(el); });
    el.querySelector('[data-k="delay"]').addEventListener("change", (e) => { s.delay = Number(e.target.value); save(); });
    el.querySelector('[data-act="answer"]').addEventListener("click", () => {
      if (!s.pick) return toast(el, "Pick a proximity first.");
      const pts = (s.pick === q.P.id ? 70 : 0) + (Number(s.delay) === q.delay ? 30 : 0);
      s.total += pts;
      s.rounds += 1;
      s.answered = true;
      if (s.pick === q.P.id && !S.unlocked.includes(q.P.id)) S.unlocked.push(q.P.id);
      s.unlock = s.pick === q.P.id ? q.P.id : s.unlock;
      s.unlockDelay = Number(s.delay);
      save();
      g3(el);
      toast(el, `+${pts}`);
    });
    el.querySelector('[data-act="next"]').addEventListener("click", () => { s.seed += 1; s.answered = false; s.pick = ""; s.delay = 0; save(); g3(el); });
    const run = (id, within) => {
      const P = PROXIMITIES.find((p) => p.id === id);
      if (!A() || !P) return;
      const key = "p:" + id;
      A().set(key, { a: { on: false, within }, b: { on: true, within }, mod: "manual", manual: 1, mode: "toggle" });
      A().start(key);
      toast(el, `Running on your board: when ${P.when}, ${P.then} within ${within} beat${within === 1 ? "" : "s"}.`);
    };
    el.querySelectorAll("[data-unl]").forEach((b) => b.addEventListener("click", () => run(b.dataset.unl, (PROXIMITIES.find((p) => p.id === b.dataset.unl) || {}).within || 0)));
    el.querySelector('[data-use="cause"]').addEventListener("click", () => {
      const id = s.unlock || S.unlocked[S.unlocked.length - 1];
      if (!id) return toast(el, "Answer one right to unlock a proximity patch.");
      run(id, s.unlock === id ? s.unlockDelay : (PROXIMITIES.find((p) => p.id === id) || {}).within || 0);
    });
  }

  /* ---------- 4. Chain reaction ---------- */
  function g4(el) {
    const all = films();
    const s = Object.assign({ films: all.slice(0, 3).map((f) => f.id), chain: [], delays: {} }, S.g4);
    S.g4 = s;
    s.films = s.films.filter((id) => all.find((f) => f.id === id));
    const picked = s.films.map(film);
    const heldBy = {};
    picked.forEach((f) => PROX().forEach((p) => { if (proxIn(p, f.beats).holds) (heldBy[p.id] = heldBy[p.id] || []).push(f.title); }));
    const targets = Object.keys(heldBy);
    const chainFilms = new Set();
    s.chain.forEach((id) => (heldBy[id] || []).forEach((t) => chainFilms.add(t)));
    const hit = s.chain.filter((id) => heldBy[id]).length;
    const sc = targets.length ? Math.round((hit / Math.min(3, targets.length)) * 80 + (chainFilms.size >= 2 ? 20 : 0)) : 0;
    el.innerHTML = `
      <p class="cap">Inspiration films (pick two or three):</p>
      <div class="g-films">${all.map((f) => `<label class="field"><span><input type="checkbox" data-film="${esc(f.id)}" ${s.films.includes(f.id) ? "checked" : ""}> ${esc(f.title)}</span></label>`).join("")}</div>
      <p class="cap">${targets.length ? `These films hold ${targets.length} proximit${targets.length === 1 ? "y" : "ies"}. Build a chain of two or three that reproduces them, ideally from different films.` : "None of the picked films holds a proximity. Add another film."}</p>
      <ul class="g-plist">${PROX().map((p) => `<li><label><input type="checkbox" data-p="${esc(p.id)}" ${s.chain.includes(p.id) ? "checked" : ""} ${!s.chain.includes(p.id) && s.chain.length >= 3 ? "disabled" : ""}> When ${esc(p.when)}, ${esc(p.then)}</label>
        ${heldBy[p.id] ? `<span class="chip lit">held in ${esc(heldBy[p.id].length)} film${heldBy[p.id].length > 1 ? "s" : ""}</span>` : ""}
        ${s.chain.includes(p.id) ? `<select data-delay="${esc(p.id)}" aria-label="delay">${opts([0, 1, 2, 3, 4, 6, 8], s.delays[p.id] != null ? s.delays[p.id] : p.within)}</select> beats` : ""}</li>`).join("")}</ul>
      <div class="bar-actions"><button type="button" data-act="fire">Trigger the chain</button> <button type="button" data-act="stop">Stop</button> ${useBtn("chain")}</div>
      <div id="g4-out"></div>`;
    el.querySelector(".g-score").innerHTML = `Score <b>${sc}</b> (${hit} of the films' proximities, from ${chainFilms.size} film${chainFilms.size === 1 ? "" : "s"}) · best ${best("chain", s.chain.length >= 2 ? sc : null)}`;
    save();
    el.querySelectorAll("[data-film]").forEach((c) => c.addEventListener("change", () => { s.films = c.checked ? s.films.concat(c.dataset.film).slice(-3) : s.films.filter((x) => x !== c.dataset.film); save(); g4(el); }));
    el.querySelectorAll("[data-p]").forEach((c) => c.addEventListener("change", () => { s.chain = c.checked ? s.chain.concat(c.dataset.p).slice(0, 3) : s.chain.filter((x) => x !== c.dataset.p); save(); g4(el); }));
    el.querySelectorAll("[data-delay]").forEach((x) => x.addEventListener("change", () => { s.delays[x.dataset.delay] = Number(x.value); save(); }));
    const fire = () => {
      if (!A()) return;
      if (s.chain.length < 2) return toast(el, "Chain at least two proximities.");
      s.chain.forEach((id) => {
        const within = s.delays[id] != null ? s.delays[id] : (PROXIMITIES.find((p) => p.id === id) || {}).within || 0;
        A().set("p:" + id, { a: { on: false, within }, b: { on: true, within }, mod: "manual", manual: 1, mode: "toggle" });
        A().start("p:" + id);
      });
      let r = A().resolve(4);
      const base = window.CuriosityBoard ? window.CuriosityBoard.values() : {};
      const suiteSet = (id) => (SUITES.find((x) => x.id === id) || {}).set || {};
      /* If the board shows no cause yet, set the first chain link's cause so the chain visibly fires. */
      const links = s.chain.map((id) => PROXIMITIES.find((p) => p.id === id)).filter(Boolean);
      const caused = links.some((p) => r.panels.some((v) => (p.x.suite ? Object.entries(suiteSet(p.x.suite)).every(([k, x]) => String(v[k]) === String(x)) : "is" in p.x && String(v[p.x.curiosity]) === String(p.x.is))));
      const seed = !caused && links.find((p) => p.x.suite || "is" in p.x);
      if (seed) {
        const key = seed.x.suite ? "s:" + seed.x.suite : "c:" + seed.x.curiosity;
        A().set(key, seed.x.suite ? { a: "", b: seed.x.suite, mod: "manual", manual: 1, mode: "toggle" } : { a: base[seed.x.curiosity], b: seed.x.is, mod: "manual", manual: 1, mode: "toggle" });
        A().start(key);
        s.causeKey = key;
        toast(el, `Set the cause on the board: ${seed.when}.`);
        r = A().resolve(4);
      }
      const changed = {};
      r.panels.forEach((p, i) => Object.keys(p).forEach((k) => { if (!same(p[k], base[k])) (changed[k] = changed[k] || Array(4).fill(""))[i] = p[k]; }));
      el.querySelector("#g4-out").innerHTML = `<p class="cap">The chain is running on your board. What it changed, panel by panel:</p>${Object.keys(changed).length ? `<div class="scroll"><table class="trace"><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th></tr>${Object.entries(changed).map(([k, v]) => `<tr><td>${esc(label(k))}</td>${v.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</table></div>` : "<p class='cap'>Nothing yet: the board has no cause for these proximities. Set a cause on the board (for example handheld, or an object entering) and the chain follows.</p>"}${boardPanels(Object.fromEntries(Object.keys(changed).map((k) => [k, r.panels.map((p) => p[k])])), 4)}`;
    };
    el.querySelector('[data-act="fire"]').addEventListener("click", fire);
    el.querySelector('[data-use="chain"]').addEventListener("click", fire);
    el.querySelector('[data-act="stop"]').addEventListener("click", () => { if (A()) { s.chain.forEach((id) => A().stop("p:" + id)); if (s.causeKey) A().stop(s.causeKey); } toast(el, "Chain stopped."); });
  }

  /* ---------- shell ---------- */
  function css() {
    if (document.getElementById("games-css")) return;
    const st = document.createElement("style");
    st.id = "games-css";
    st.textContent = `
      #games .g-row { display: flex; flex-wrap: wrap; gap: 3px; margin: 4px 0 8px; }
      #games .g-cell { font-family: var(--mono); font-size: 11px; border: 1px solid var(--line); padding: 3px 5px; background: white; min-width: 28px; text-align: center; }
      #games .g-cell.ok { background: #dff0e2; border-color: #2c7a3f; }
      #games .g-cell.bad { background: #f7e0da; border-color: #b23a1f; }
      #games .g-cell.now { outline: 3px solid var(--saffron); }
      #games .g-score { font-family: var(--mono); font-size: 13px; }
      #games .g-msg { font-family: var(--mono); font-size: 12px; color: var(--saffron); min-height: 1em; }
      #games .g-beats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
      #games .g-beat { border: 1px solid var(--line); padding: 6px; background: white; }
      #games .g-beat.done { border-color: var(--ink); }
      #games .g-beat button.on, #games .subtabs button.on { background: var(--ink); color: var(--paper); }
      #games .g-panels { max-width: 100%; }
      #games .g-panels .strip { display: flex; gap: 6px; width: max-content; }
      #games .g-panels .panel { width: 200px; flex: 0 0 200px; }
      #games .g-plist { list-style: none; padding: 0; }
      #games .g-plist li { margin: 4px 0; font-size: 14px; }
      #games .g-films { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0 8px; max-height: 220px; overflow: auto; border: 1px solid var(--line); padding: 4px 8px; }
      #games select { max-width: 100%; }
      #games .bar-actions label.field { min-width: 0; }
      #games .use { background: var(--saffron); color: white; border-color: var(--saffron); }
      #games .g-q td, #games .g-q th { text-align: center; }
      #games [hidden] { display: none !important; }
    `;
    document.head.appendChild(st);
  }

  function draw() {
    css();
    if (anim) cancelAnimationFrame(anim);
    anim = null;
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    const g = GAMES.find((x) => x.id === S.tab) || GAMES[0];
    root.innerHTML = `<h2>Cross-pollinate</h2>
      <p class="cap">Four games, one per automation level. Each takes what an inspiration film does and turns it into an automation you can run in your own film, trigger from a key or a MIDI note, and send to a modular synth.</p>
      <nav class="subtabs">${GAMES.map((x) => `<button type="button" data-game="${x.id}" class="${x.id === g.id ? "on" : ""}">${esc(x.label)}</button>`).join("")}</nav>
      <p><span class="chip suite">${esc(g.level)}</span> <b>${esc(g.goal)}</b></p>
      <p class="g-score"></p>
      <p class="g-msg" role="status"></p>
      <div id="g-body"></div>
      ${A() && A().running().length ? `<p class="cap">Running now: ${A().running().map(esc).join(", ")} <button type="button" data-act="stopall">Stop all automation</button></p>` : ""}`;
    root.querySelectorAll("[data-game]").forEach((b) => b.addEventListener("click", () => { S.tab = b.dataset.game; save(); draw(); }));
    const sa = root.querySelector('[data-act="stopall"]');
    if (sa) sa.addEventListener("click", () => { A().stopAll(); draw(); });
    const body = root.querySelector("#g-body");
    // the score and message lines live in the shell; games write to them through el
    const el = root;
    const fn = { rhythm: g1, swap: g2, cause: g3, chain: g4 }[g.id];
    try {
      const wrap = document.createElement("div");
      body.appendChild(wrap);
      fn(new Proxy(wrap, {
        get(t, k) {
          if (k === "querySelector") return (sel) => (sel === ".g-score" || sel === ".g-msg" ? el.querySelector(sel) : t.querySelector(sel));
          const v = t[k];
          return typeof v === "function" ? v.bind(t) : v;
        },
        set(t, k, v) { t[k] = v; return true; },
      }));
    } catch (e) {
      body.innerHTML = `<p>This game failed to draw: ${esc(e.message)}</p>`;
    }
  }

  window.CuriosityGames = { draw };
})();
