/* momentum/audience.js: different audiences tire of different things at different speeds ("Audiences").
   The film stays the same; only the reading of it changes. Each audience has a limit multiplier (how long
   before attention tires, against the film's own limit) and a patience multiplier per family (more patience
   for Comedy, less for Lines & voice ...). readFor() takes an attention reading (CurioAttention.read: its
   segments, unchanged) and works out, for one audience, the limit for every family, the stretches that run
   past it, the share of the film spent past it, and one plain sentence. The audiences below are starting
   guesses, not measurements: the tab lets you move them and make your own.

   Part of the momentum core (no page) plus a tab in the Momentum window (when ui.js is here).

   window.CurioAudience
   - PROFILES: [{ id, label, about, limit, patience: { family: multiplier } }] the starting guesses.
   - normalize(profile) -> the same profile with every multiplier kept between the slider ends.
   - limitsFor(profile, baseLimit) -> { family: seconds } the held-time limit of every family for that audience.
   - readFor(reading, profile) -> { id, label, baseLimit, limit, limits, runs, tired, tiredCount,
       tiredSeconds, share 0..1, first, seconds, t0, t1, sentence }
       runs: [{ family, from, to, dur, count, limit, status (CurioMomentum.status key), tired }]
       tired: [{ family, label, start, from, to, dur }] the part of each family stretch past its own limit.
   - rank(reading, profiles) -> readFor() of each, fewest tired stretches first (then the smaller share past
       the limit, then the name), each with its place (1, 2 ...).
   - forSentence(ranked) -> one plain sentence on who the film suits best.
   - store: load(), save(state), KEY ("curiosities-momentum-audience-v1"): { own, edits, picked, editing }. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const KEY = "curiosities-momentum-audience-v1";
  const OWN = "own";
  /* Slider ends: the limit from a third to twice the film's limit; patience from half to twice as long. */
  const LIMIT_RANGE = { min: 0.3, max: 2, step: 0.05 };
  const PATIENCE_RANGE = { min: 0.5, max: 2, step: 0.1 };

  const PROFILES = [
    { id: "kids", label: "Young kids", about: "Tire quickly, laugh easily, love things that move, and drift off during long talk.", limit: 0.6, patience: { comedy: 1.6, movement: 1.5, music: 1.2, effects: 1.2, voice: 0.6, plot: 0.8, mind: 0.6, cut: 0.8 } },
    { id: "students", label: "Film students", about: "Sit longer than most and watch how a shot is made: the camera, the light, the cut.", limit: 1.4, patience: { camera: 1.7, light: 1.7, cut: 1.4, place: 1.2, effects: 0.8, comedy: 0.9 } },
    { id: "festival", label: "Festival crowd", about: "Patient, ready for slow feeling and quiet places, less taken with big effects.", limit: 1.3, patience: { feeling: 1.3, place: 1.3, mind: 1.3, light: 1.2, effects: 0.7, comedy: 0.9 } },
    { id: "family", label: "Family audience", about: "Parents and children together: jokes and feelings hold them; long camera moves do not.", limit: 0.9, patience: { comedy: 1.3, feeling: 1.2, plot: 1.1, movement: 1.1, camera: 0.8, light: 0.8, mind: 0.8 } },
    { id: "phone", label: "Phone scrollers", about: "Used to a new thing every few seconds; only surprises and jokes hold them a little longer.", limit: 0.35, patience: { effects: 1.3, comedy: 1.2, movement: 1.1, voice: 0.7, place: 0.7, light: 0.7, mind: 0.6 } },
    { id: "theater", label: "Theater crowd", about: "Come for the words and the acting: lines and feelings hold them; effects do not.", limit: 1.15, patience: { voice: 1.7, feeling: 1.3, plot: 1.2, effects: 0.7, camera: 0.8 } },
  ];

  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const clamp = (x, r, d) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.min(r.max, Math.max(r.min, n)) : d;
  };
  const clock = (s) => {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  const famLabel = (f) => ((M() && M().family(f)) || { label: f || "nothing" }).label;
  const familyIds = () => (M() ? M().FAMILIES.map((f) => f.id) : []);

  function normalize(p) {
    const src = p || {};
    const patience = {};
    Object.keys(src.patience || {}).forEach((f) => {
      const v = clamp(src.patience[f], PATIENCE_RANGE, 1);
      if (v !== 1) patience[f] = round(v, 2);
    });
    return { id: String(src.id || OWN), label: String(src.label || "My audience").slice(0, 40), about: String(src.about || ""), limit: round(clamp(src.limit, LIMIT_RANGE, 1), 2), patience };
  }

  function limitsFor(profile, baseLimit) {
    const p = normalize(profile);
    const base = Number(baseLimit) > 0 ? Number(baseLimit) : 20;
    const out = {};
    familyIds().forEach((f) => (out[f] = round(base * p.limit * (p.patience[f] || 1), 1)));
    return out;
  }

  /* Families held in a row, from the reading's own segments (CurioAttention.familyRuns when it is here). */
  function runsOf(segments) {
    if (A() && A().familyRuns) return A().familyRuns(segments);
    const runs = [];
    segments.forEach((s) => {
      const last = runs[runs.length - 1];
      if (last && last.family === s.family) {
        last.to = s.to;
        last.dur = round(last.to - last.from, 2);
        last.count++;
      } else runs.push({ family: s.family, from: s.from, to: s.to, dur: s.dur, count: 1 });
    });
    return runs;
  }

  function readFor(reading, profile) {
    const p = normalize(profile);
    const segs = (reading && reading.segments) || [];
    const baseLimit = Number(reading && reading.limit) > 0 ? Number(reading.limit) : 20;
    const limits = limitsFor(p, baseLimit);
    const t0 = segs.length ? segs[0].from : 0;
    const seconds = Number(reading && reading.seconds) > 0 ? Number(reading.seconds) : segs.length ? segs[segs.length - 1].to - t0 : 0;
    const t1 = t0 + seconds;
    const tired = [];
    const runs = runsOf(segs).map((r) => {
      const lim = limits[r.family] != null ? limits[r.family] : round(baseLimit * p.limit, 1);
      const st = M() ? M().status(r.dur, lim).key : r.dur > lim ? "over" : "fresh";
      const over = r.dur > lim;
      if (over) tired.push({ family: r.family, label: famLabel(r.family), start: r.from, from: round(r.from + lim, 2), to: r.to, dur: round(r.dur - lim, 2) });
      return { family: r.family, from: r.from, to: r.to, dur: r.dur, count: r.count, limit: lim, status: st, tired: over };
    });
    const tiredSeconds = round(tired.reduce((a, t) => a + t.dur, 0), 2);
    const share = seconds > 0 ? round(tiredSeconds / seconds, 3) : 0;
    const first = tired[0] || null;
    const name = p.label;
    let sentence;
    if (!segs.length) sentence = `${name}: this film has nothing that holds attention yet.`;
    else if (!tired.length) sentence = `${name} stay with this film the whole way: nothing runs past their limit.`;
    else if (tired.length === 1) sentence = `${name} lose interest once, at ${clock(first.from)} on ${first.label}.`;
    else sentence = `${name} lose interest ${tired.length} times, first at ${clock(first.from)} on ${first.label}.`;
    return { id: p.id, label: name, profile: p, baseLimit, limit: round(baseLimit * p.limit, 1), limits, runs, tired, tiredCount: tired.length, tiredSeconds, share, first, seconds: round(seconds, 2), t0, t1, sentence };
  }

  function rank(reading, profiles) {
    const out = (profiles || []).map((p) => readFor(reading, p));
    out.sort((a, b) => a.tiredCount - b.tiredCount || a.share - b.share || a.label.localeCompare(b.label));
    out.forEach((r, i) => (r.place = i + 1));
    return out;
  }

  function forSentence(ranked) {
    if (!ranked || !ranked.length) return "Pick an audience to see who this film suits.";
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    if (!best.seconds) return "This film has nothing that holds attention yet, so it is not for anyone yet.";
    const top = ranked.filter((r) => r.tiredCount === best.tiredCount && r.share === best.share);
    const names = top.map((r) => r.label);
    const who = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
    const how = best.tiredCount === 0 ? "never tire of it" : best.tiredCount === 1 ? "tire only once" : `tire the fewest times (${best.tiredCount})`;
    const tail = ranked.length > top.length && worst.tiredCount > best.tiredCount ? ` ${worst.label} tire most often (${worst.tiredCount} times).` : "";
    return `This film suits ${who} best: they ${how}.${tail}`;
  }

  /* ---------- what is kept: { own, edits: { id: profile }, picked: [ids], editing } ---------- */
  function load() {
    let s = null;
    try {
      s = JSON.parse(root.localStorage.getItem(KEY) || "null");
    } catch (e) {
      s = null;
    }
    s = s && typeof s === "object" ? s : {};
    const edits = {};
    Object.keys(s.edits || {}).forEach((id) => {
      if (PROFILES.some((p) => p.id === id)) edits[id] = normalize(Object.assign({}, s.edits[id], { id, label: PROFILES.find((p) => p.id === id).label }));
    });
    const own = s.own ? normalize(Object.assign({}, s.own, { id: OWN })) : null;
    const known = (id) => PROFILES.some((p) => p.id === id) || (id === OWN && own);
    let picked = Array.isArray(s.picked) ? s.picked.filter(known).slice(0, 3) : [];
    if (!picked.length) picked = ["kids", "students", "phone"];
    return { own, edits, picked, editing: known(s.editing) ? s.editing : picked[0] };
  }
  function save(state) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify({ own: state.own, edits: state.edits, picked: state.picked, editing: state.editing }));
      return true;
    } catch (e) {
      return false;
    }
  }
  /* Every audience as it stands: the starting guesses (or your edits of them), then your own. */
  function all(state) {
    const s = state || { edits: {}, own: null };
    const list = PROFILES.map((p) => (s.edits && s.edits[p.id] ? Object.assign({}, s.edits[p.id], { about: p.about }) : normalize(p)));
    if (s.own) list.push(normalize(Object.assign({}, s.own, { id: OWN, about: s.own.about || "An audience you made yourself." })));
    return list;
  }

  const api = { PROFILES, KEY, OWN, LIMIT_RANGE, PATIENCE_RANGE, normalize, limitsFor, readFor, rank, forSentence, load, save, all };
  root.CurioAudience = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab ---------- */
  if (typeof document === "undefined") return;
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const pct = (x) => Math.round((x || 0) * 100) + "%";
  const times = (x) => (Math.abs(x - 1) < 0.001 ? "the usual" : String(round(x, 2)) + " times");
  let state = null;

  function mount(el, ctx) {
    if (!state) state = load();
    const reading = ctx.readSource(ctx.source());
    el.innerHTML = `<div class="mo-au">
      <div class="mo-controls"><label>Film ${ctx.sourcePicker("data-au-source")}</label></div>
      <p>Different audiences tire of different things at different speeds. The film stays the same; only how long each audience gives each kind of curiosity changes. The film's own limit is ${reading.limit} seconds (set it in Attention); each audience stretches or shrinks it.</p>
      <p class="mo-au-guess"><b>These audiences are starting guesses, not measurements.</b> Move the sliders below to match people you know, or make your own audience.</p>
      <fieldset class="mo-au-pick"><legend>Compare up to three audiences</legend><div class="mo-au-picks"></div></fieldset>
      <div class="mo-au-results" aria-live="polite"></div>
      <section class="mo-au-edit"></section></div>`;
    const redraw = () => drawResults(el, reading);
    drawPicks(el);
    redraw();
    drawEditor(el, reading);

    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.matches("select[data-au-source]")) {
        ctx.setSource(t.value);
        ctx.refresh();
      } else if (t.matches("input[data-au-pick]")) {
        const id = t.value;
        if (t.checked) {
          if (state.picked.length >= 3) state.picked.shift();
          if (!state.picked.includes(id)) state.picked.push(id);
        } else if (state.picked.length > 1) state.picked = state.picked.filter((x) => x !== id);
        save(state);
        drawPicks(el);
        redraw();
      } else if (t.matches("select[data-au-editing]")) {
        state.editing = t.value;
        save(state);
        drawEditor(el, reading);
      } else if (t.matches("input[type=range][data-au-set]")) {
        save(state);
        drawPicks(el);
        const reset = el.querySelector('button[data-au="reset"]');
        if (reset) reset.disabled = false;
      } else if (t.matches("input[data-au-name]") && state.editing === OWN && state.own) {
        state.own.label = t.value.trim().slice(0, 40) || "My audience";
        save(state);
        drawPicks(el);
        redraw();
        drawEditor(el, reading);
      }
    });
    el.addEventListener("input", (e) => {
      const t = e.target;
      if (!t.matches("input[type=range][data-au-set]")) return;
      const p = editable(state.editing);
      const v = Number(t.value);
      if (t.dataset.auSet === "limit") p.limit = v;
      else p.patience[t.dataset.auSet] = v;
      const out = t.parentElement.querySelector("output");
      if (out) out.textContent = t.dataset.auSet === "limit" ? `${times(v)} the film's limit (${round(reading.limit * v, 1)} seconds)` : `${times(v)} as long`;
      redraw();
    });
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-au]");
      if (!b || !el.contains(b)) return;
      if (b.dataset.au === "own") {
        const from = all(state).find((p) => p.id === state.editing) || normalize(PROFILES[0]);
        const name = (el.querySelector("input[data-au-new]") || {}).value;
        state.own = normalize(Object.assign({}, from, { id: OWN, label: (name || "").trim() || "My audience", about: "An audience you made yourself." }));
        state.editing = OWN;
        if (!state.picked.includes(OWN)) {
          if (state.picked.length >= 3) state.picked.shift();
          state.picked.push(OWN);
        }
        save(state);
        drawPicks(el);
        redraw();
        drawEditor(el, reading, `Saved "${state.own.label}". It starts as a copy of ${from.label}; move the sliders to make it yours.`);
      } else if (b.dataset.au === "reset") {
        delete state.edits[state.editing];
        save(state);
        redraw();
        drawEditor(el, reading, "Put back the starting guess.");
      } else if (b.dataset.au === "delete" && state.editing === OWN) {
        state.own = null;
        state.picked = state.picked.filter((x) => x !== OWN);
        if (!state.picked.length) state.picked = ["kids"];
        state.editing = state.picked[0];
        save(state);
        drawPicks(el);
        redraw();
        drawEditor(el, reading, "Your own audience is gone.");
      }
    });
  }

  /* The profile the sliders change: your own, or an edit of a starting guess (made on the first move). */
  function editable(id) {
    if (id === OWN && state.own) return state.own;
    if (!state.edits[id]) {
      const base = PROFILES.find((p) => p.id === id) || PROFILES[0];
      state.edits[base.id] = normalize(base);
    }
    return state.edits[id];
  }

  function drawPicks(el) {
    el.querySelector(".mo-au-picks").innerHTML = all(state)
      .map((p) => `<label class="mo-au-chip"><input type="checkbox" data-au-pick value="${esc(p.id)}"${state.picked.includes(p.id) ? " checked" : ""}> ${esc(p.label)}${p.id === OWN ? " <small>(yours)</small>" : state.edits[p.id] ? " <small>(changed)</small>" : ""}</label>`)
      .join("");
  }

  function ribbonHtml(res, reading) {
    const segs = reading.segments;
    if (!segs.length) return `<p class="mo-empty">Nothing holds attention in this film yet.</p>`;
    const span = Math.max(1, res.t1 - res.t0);
    const at = (t) => (((t - res.t0) / span) * 100).toFixed(2);
    const wd = (a, b) => Math.max(0.4, ((b - a) / span) * 100).toFixed(2);
    const cells = segs
      .map((s) => {
        const mk = M().mark(s.family);
        const t = `${clock(s.from)} to ${clock(s.to)}: ${mk.label} (${s.label})`;
        return `<span class="mo-au-cell" style="left:${at(s.from)}%;width:${wd(s.from, s.to)}%;background:${mk.color};color:${mk.ink}" title="${esc(t)}">${(s.to - s.from) / span > 0.035 ? esc(mk.letter) : ""}</span>`;
      })
      .join("");
    const over = M().STATUS.over;
    const tired = res.tired
      .map((t) => {
        const say = `${over.icon} ${over.words} for ${res.label} from ${clock(t.from)} to ${clock(t.to)} on ${t.label}`;
        return `<span class="mo-au-tired" style="left:${at(t.from)}%;width:${wd(t.from, t.to)}%" title="${esc(say)}" aria-label="${esc(say)}">${over.icon}</span>`;
      })
      .join("");
    return `<div class="mo-au-rib" role="img" aria-label="What holds attention over time">${cells}</div>
      <div class="mo-au-lane" role="group" aria-label="Where ${esc(res.label)} get tired">${tired || `<span class="mo-au-fine">${M().status(0, 1).icon} never tired</span>`}</div>
      <div class="mo-au-ticks"><span>${clock(res.t0)}</span><span>${clock(res.t1)}</span></div>`;
  }

  function drawResults(el, reading) {
    const box = el.querySelector(".mo-au-results");
    const profiles = all(state);
    const picked = state.picked.map((id) => profiles.find((p) => p.id === id)).filter(Boolean);
    const cards = picked
      .map((p) => {
        const r = readFor(reading, p);
        const over = M().STATUS.over;
        return `<article class="mo-au-card" data-au-card="${esc(p.id)}">
          <h4>${esc(r.label)}</h4>
          <p class="mo-small">${esc(p.about || "")} They tire after about ${r.limit} seconds on one thing.</p>
          ${ribbonHtml(r, reading)}
          <p class="mo-au-share"><span class="mo-status ${r.tiredCount ? "mo-crit" : "mo-good"}">${r.tiredCount ? over.icon : M().status(0, 1).icon}</span> Past their limit: <b>${pct(r.share)}</b> of the film</p>
          <p class="mo-au-say">${esc(r.sentence)}</p></article>`;
      })
      .join("");
    const ranked = rank(reading, profiles);
    const list = ranked
      .map(
        (r) => `<li><b>${esc(r.label)}</b>: ${r.tiredCount === 0 ? "never tired" : r.tiredCount === 1 ? "tired once" : `tired ${r.tiredCount} times`}, ${pct(r.share)} of the film past their limit</li>`
      )
      .join("");
    box.innerHTML = `<div class="mo-au-cards">${cards}</div>
      <p class="mo-small">${M().STATUS.over.icon} marks the moments past that audience's own limit. The ribbon is the same film for everyone: letters and colors show which kind of curiosity holds attention.</p>
      <section class="mo-au-rank"><h3>Who is this film for?</h3><p>${esc(forSentence(ranked))}</p><ol>${list}</ol>
      <p class="mo-small">Ranked by the fewest tired stretches, then by the smallest share of the film past the limit.</p></section>`;
  }

  function drawEditor(el, reading, said) {
    const box = el.querySelector(".mo-au-edit");
    const profiles = all(state);
    const p = profiles.find((x) => x.id === state.editing) || profiles[0];
    state.editing = p.id;
    const val = (f) => (p.patience[f] != null ? p.patience[f] : 1);
    const slider = (key, label, v, r, out, mk) => `<label class="mo-au-slider">
        <span class="mo-au-sname">${mk ? `<i class="mo-au-letter" style="background:${mk.color};color:${mk.ink}">${esc(mk.letter)}</i>` : ""}${esc(label)}</span>
        <input type="range" data-au-set="${esc(key)}" min="${r.min}" max="${r.max}" step="${r.step}" value="${v}" aria-label="${esc(label)}">
        <output>${esc(out)}</output></label>`;
    const fams = M()
      .FAMILIES.map((f) => slider(f.id, "Patience for " + f.label, val(f.id), PATIENCE_RANGE, `${times(val(f.id))} as long`, M().mark(f.id)))
      .join("");
    box.innerHTML = `<h3>Change an audience</h3>
      <div class="mo-controls"><label>Audience <select data-au-editing aria-label="Audience to change">${profiles.map((x) => `<option value="${esc(x.id)}"${x.id === p.id ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        ${p.id === OWN ? `<label>Name <input type="text" data-au-name maxlength="40" value="${esc(p.label)}"></label><button type="button" data-au="delete">Remove my audience</button>` : `<button type="button" data-au="reset"${state.edits[p.id] ? "" : " disabled"}>Put back the starting guess</button>`}</div>
      <p class="mo-small">Moving a slider changes the comparison above right away and is kept in this browser. More than 1 means they stay longer with that kind of curiosity; less than 1 means they tire of it sooner.</p>
      <div class="mo-au-sliders">${slider("limit", "How long before they tire of anything", p.limit, LIMIT_RANGE, `${times(p.limit)} the film's limit (${round(reading.limit * p.limit, 1)} seconds)`)}${fams}</div>
      <div class="mo-controls mo-au-own"><label>Name for your audience <input type="text" data-au-new maxlength="40" placeholder="My audience"></label>
        <button type="button" data-au="own">Make my own audience</button></div>
      <p class="mo-small mo-au-said" role="status">${esc(said || (state.own ? `Making your own audience again replaces "${state.own.label}", starting from the audience chosen above.` : "Your own audience starts as a copy of the audience chosen above."))}</p>`;
  }

  function addTab() {
    const UI = root.CurioMomentumUI;
    if (!UI || !UI.addTab) return false;
    return UI.addTab({ id: "audience", label: "Audiences", group: "see", after: "end", mount });
  }
  if (!addTab()) {
    let tries = 0;
    const t = setInterval(() => {
      if (addTab() || ++tries > 50) clearInterval(t);
    }, 100);
  }
})();
