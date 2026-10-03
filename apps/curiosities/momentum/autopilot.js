/* momentum/autopilot.js: the "Autopilot" tab (Fix it), the automation side of Momentum. For the chosen film it
   finds every stretch where one family holds attention past the limit and proposes, for each, one automation
   patch (automation.js, window.CurioAuto) that would move attention there:
     which curiosity  one of another family, the family the Compass points to at that moment (CurioCompass.point
                      on the film up to there), a curiosity of that family already in the film first, then the
                      one that pushes the story hardest
     over which moments  from about where the films you compare with usually move on, to the end of the stretch
     from what to what   from its setting at that moment to the far end of its scale (a big change pulls hardest)
     driven by        a knob held at the new setting (steady), or one of the Momentum sources (sources.js, and
                      any other "momentum:" source added to CurioAuto.addSource)
   Every proposal is checked by reading the film again in memory with the patch's values laid on those moments
   (CurioAuto.between, the automation's own math): attention must move to that family at that moment, and the
   time past the limit must go down. Proposals build on one another, so "all of them" is checked as a whole.

   The engine's film and the curated films do not play the automation (it plays on the board's panels and the
   Storyboard's scenes, moment 1 on panel 1), so the preview there is what attention would do if they did.

   Applying makes real CurioAuto patches (set, then start) in one step. CurioAuto has no undo of its own, so this
   file keeps one: each apply remembers every patch as it was before (as automate.js does for its rigs);
   undo() puts back the last apply, removeAll() every apply. Kept under localStorage
   "curiosities-momentum-autopilot-v1", so Remove these still works after a reload (patches stop on a reload, as
   every automation patch does).

   window.CurioAutopilot (the pure parts work in Node)
   - plan(beats, { secondsPerBeat, limit, profiles, max, usual, param(id), domain(id), between(id, a, b, c) })
       -> { before, after, limit, step, proposals: [proposal] }   before / after: numbers()
       proposal: { id, key: "c:<curiosity>", curiosity, label, family, holding, run: { from, to, dur }, at, end,
                   atLabel, endLabel, from, to, added, text, why, sweep }
   - overlay(beats, proposals, between) -> the beats with those patches' values laid on
   - strip(reading, n) -> one cell per moment: { i, family, letter, color, ink, label, held, status }
   - numbers(reading) -> { overLimit, longest, pastLimit, moves, momentum }
   - preview(beats, proposals, opts) -> { before, after, beforeStrip, afterStrip, beforeNumbers, afterNumbers }
   - settings(proposal, driver) -> the CurioAuto patch settings ("steady" or a source id)
   - drivers() -> [{ id, label }]: steady, then every Momentum source the automation has
   - apply(proposals, { driver, label }) -> { ok, keys, error }   one step; undo(), removeAll(), history(), applied() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const R = () => root.CurioRates;
  const C = () => root.CurioCompass;
  const AU = () => root.CurioAuto;
  const KEY = "curiosities-momentum-autopilot-v1";
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const same = (a, b) => String(a) === String(b);
  const famLabel = (f) => (M().family(f) || { label: f }).label;

  /* ---------- the film's clock (the same rule as attention.js) ---------- */
  function sec(at) {
    if (typeof at === "number" && isFinite(at)) return at;
    if (typeof at !== "string") return null;
    const t = at.trim();
    if (!/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null;
    return t.split(":").reduce((s, p) => s * 60 + Number(p), 0);
  }
  function timesOf(beats, step) {
    let t = 0;
    return beats.map((b, i) => {
      const s = sec(b.at);
      t = s != null && s >= t ? s : i === 0 ? 0 : t + step;
      return t;
    });
  }
  const clean = (beats) => (beats || []).filter((b) => b && b.values && typeof b.values === "object");

  /* ---------- the automation's view of a curiosity (injectable, so Node tests need no page) ---------- */
  function tools(o) {
    const au = AU();
    const param = o.param || ((id) => !!(au && au.param && au.param("c:" + id) && au.param("c:" + id).level === "curiosity"));
    const domain = o.domain || ((id) => (au && au.domain ? au.domain(id) : { kind: "choice", options: [] }));
    const between =
      o.between ||
      ((id, a, b, c) => {
        if (au && au.between) return au.between(id, a, b, c);
        return c >= 0.5 ? b : a;
      });
    return { param, domain, between };
  }
  /* The far end of the scale from where it is: the biggest change pulls attention hardest. */
  function farEnd(d, v) {
    if (!d) return null;
    if (d.kind === "range") {
      const n = Number(v);
      const mid = (d.min + d.max) / 2;
      return !isFinite(n) || n <= mid ? d.max : d.min;
    }
    const opts = d.options || [];
    if (opts.length < 2) return null;
    const i = opts.indexOf(v);
    return i < 0 || i < (opts.length - 1) / 2 ? opts[opts.length - 1] : opts[0];
  }
  const startOf = (d) => (!d ? null : d.kind === "range" ? d.min : (d.options || [])[0]);
  /* The keys in a moment that are this curiosity (on any track); never a slider of it. */
  const keysFor = (values, id) => Object.keys(values).filter((k) => k.split("@")[0] === id);

  /* ---------- the numbers ---------- */
  function numbers(reading) {
    const s = (reading && reading.stats) || {};
    const runs = s.familyRuns || [];
    const limit = (reading && reading.limit) || 20;
    return {
      overLimit: (s.warnings || []).length,
      longest: round(Math.max(0, ...runs.map((r) => r.dur)), 1),
      pastLimit: round(runs.reduce((a, g) => a + Math.max(0, g.dur - limit), 0), 1),
      moves: (s.moves || []).length,
      momentum: s.momentum || 0,
    };
  }

  /* ---------- laying patches on a film in memory ---------- */
  /* A patch holds its new setting over its moments ("sweep" false: the knob is full) or goes from the old
     setting to the new one across them (sweep true). */
  function valueAt(p, i, between) {
    const span = p.end - p.at;
    const c = p.sweep && span > 0 ? (i - p.at) / span : 1;
    return between(p.curiosity, p.from, p.to, c);
  }
  function overlay(beats, proposals, between) {
    const bt = between || tools({}).between;
    const out = clean(beats).map((b) => Object.assign({}, b, { values: Object.assign({}, b.values) }));
    (proposals || []).forEach((p) => {
      for (let i = p.at; i <= p.end && i < out.length; i++) {
        const v = valueAt(p, i, bt);
        const keys = keysFor(out[i].values, p.curiosity);
        if (keys.length) keys.forEach((k) => (out[i].values[k] = v));
        else out[i].values[p.curiosity] = v;
      }
    });
    return out;
  }

  /* ---------- one cell per moment: who holds attention, for how long ---------- */
  function strip(reading, n) {
    const segs = (reading && reading.segments) || [];
    const runs = A().familyRuns(segs);
    const limit = (reading && reading.limit) || 20;
    const count = n != null ? n : (reading && reading.beats) || 0;
    const step = reading && reading.beats ? reading.seconds / reading.beats : 3;
    const out = [];
    let s = null;
    for (let i = 0; i < count; i++) {
      segs.forEach((g) => g.beat === i && (s = g));
      if (!s) {
        out.push({ i, family: null, letter: "", color: null, ink: null, label: "", held: null, status: M().status(null, limit) });
        continue;
      }
      const run = runs.find((g) => s.from >= g.from - 1e-9 && s.from < g.to - 1e-9) || { from: s.from };
      const held = round(Math.max(0, Math.min(reading.seconds, (i + 1) * step) - run.from), 1);
      const mk = M().mark(s.family);
      out.push({ i, family: s.family, letter: mk.letter, color: mk.color, ink: mk.ink, label: mk.label, curiosity: s.label, held, status: M().status(held, limit) });
    }
    return out;
  }

  /* ---------- the plan ---------- */
  function plan(beats, options) {
    const o = Object.assign({ secondsPerBeat: 3, max: 6 }, options || {});
    const T = tools(o);
    const step = Number(o.secondsPerBeat) > 0 ? Number(o.secondsPerBeat) : 3;
    const profiles = (o.profiles || []).filter(Boolean);
    const target = profiles.length && R() ? R().average(profiles) : null;
    const limit = Number(o.limit) > 0 ? Number(o.limit) : target && R() ? R().limitFor(target) : 20;
    const usual = Number(o.usual) > 0 ? Number(o.usual) : (target && target.medianFamilyRun) || Math.max(step, limit * 0.6);
    const film = clean(beats);
    const read = (b) => A().read(b, { secondsPerBeat: step, limit });
    const first = read(film);
    const out = { before: numbers(first), after: numbers(first), limit, step, usual: round(usual, 1), proposals: [] };
    if (!film.length) return out;
    const times = timesOf(film, step);
    const label = (i) => (film[i] && film[i].label) || "Moment " + (i + 1);
    const used = new Set();
    const tried = new Set();
    let cur = film;
    let reading = first;

    while (out.proposals.length < o.max) {
      const runs = (reading.stats.familyRuns || []).filter((g) => g.dur > limit && !tried.has(g.family + "@" + g.from)).sort((a, b) => b.dur - a.dur);
      if (!runs.length) break;
      const run = runs[0];
      tried.add(run.family + "@" + run.from);
      const idx = times.map((t, i) => [t, i]).filter(([t]) => t >= run.from - 1e-9 && t < run.to - 1e-9).map(([, i]) => i);
      if (idx.length < 2) continue;
      const r0 = idx[0];
      const r1 = idx[idx.length - 1];
      /* About where your films usually move on, else as near it as works. */
      const ideal = Math.min(r1, r0 + Math.max(1, Math.floor(Math.min(usual, limit) / step)));
      const rows = idx.slice(1).sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal) || a - b);
      const pastBefore = numbers(reading).pastLimit;
      let made = null;
      for (const i of rows) {
        if (made) break;
        const upTo = read(cur.slice(0, i));
        const pointed = C().point(upTo, profiles.length ? profiles : target ? [target] : []);
        let opts = pointed.options.filter((x) => x.family !== run.family);
        /* With no films to compare with the Compass has no direction: every other family is a choice. */
        if (!opts.length) opts = M().FAMILIES.filter((f) => f.id !== run.family).map((f) => ({ family: f.id, curiosity: null, reasons: [] }));
        for (const opt of opts.slice(0, 8)) {
          if (made) break;
          const inFilm = [];
          Object.keys(cur[i].values).forEach((k) => {
            const id = k.split("@")[0];
            if (id.includes(".") || inFilm.includes(id)) return;
            if (M().familyOf(id) === opt.family) inFilm.push(id);
          });
          const rank = (id) => M().note(id).push + (M().note(id).source === "workspace" ? 0 : 0.5);
          inFilm.sort((a, b) => rank(b) - rank(a));
          const others = [opt.curiosity].concat((M().all ? M().all() : []).filter((n) => n.family === opt.family).sort((a, b) => b.push - a.push).map((n) => n.id));
          const cands = inFilm.concat(others.filter((id) => id && !inFilm.includes(id))).filter((id, k, l) => l.indexOf(id) === k && !used.has(id) && T.param(id));
          for (const id of cands.slice(0, 6)) {
            const d = T.domain(id);
            const keys = keysFor(cur[i].values, id);
            const added = !keys.length;
            const was = added ? startOf(d) : cur[i].values[keys[0]];
            const to = farEnd(d, was);
            if (to == null || same(to, was)) continue;
            const p = { curiosity: id, at: i, end: r1, from: was, to, sweep: false };
            const next = overlay(cur, [p], T.between);
            const rd = read(next);
            const moved = rd.segments.some((g) => g.beat === i && g.family === opt.family);
            if (!moved || numbers(rd).pastLimit >= pastBefore) continue;
            made = { p, opt, next, rd, added };
            break;
          }
        }
      }
      if (!made) continue;
      const { p, opt, added } = made;
      const n = M().note(p.curiosity);
      const plainLabel = M().plain ? M().plain(n.label) : n.label;
      const held = round(times[p.at] - run.from, 1);
      const span = p.end - p.at + 1;
      const proposal = Object.assign(p, {
        id: "ap" + out.proposals.length,
        key: "c:" + p.curiosity,
        label: plainLabel,
        family: opt.family,
        holding: run.family,
        run: { from: round(run.from, 1), to: round(run.to, 1), dur: round(run.dur, 1) },
        atLabel: label(p.at),
        endLabel: label(p.end),
        seconds: round(times[p.at], 1),
        added,
        cue: n.cue,
      });
      proposal.text = `Automate ${plainLabel} (${famLabel(opt.family)}) over ${span === 1 ? "one moment, " + proposal.atLabel : `${span} moments, ${proposal.atLabel} to ${proposal.endLabel}`}: ${added ? `it is not in this film yet, so the patch brings it in, set to "${p.to}"` : `from "${p.from}" to "${p.to}"`}. Attention moves to ${famLabel(opt.family)} ${held} seconds into the stretch.`;
      proposal.why = `${famLabel(run.family)} holds attention for ${round(run.dur)} seconds from ${A().clock(run.from)}, past the ${limit} second limit. ${opt.reasons && opt.reasons[0] ? "The Compass points to " + famLabel(opt.family) + ": " + opt.reasons[0] : "A change of another family moves attention on."}`;
      out.proposals.push(proposal);
      used.add(p.curiosity);
      cur = made.next;
      reading = made.rd;
    }
    out.after = numbers(reading);
    return out;
  }

  function preview(beats, proposals, options) {
    const o = Object.assign({ secondsPerBeat: 3 }, options || {});
    const T = tools(o);
    const film = clean(beats);
    const opts = { secondsPerBeat: o.secondsPerBeat, limit: o.limit };
    const before = A().read(film, opts);
    const after = A().read(overlay(film, proposals || [], T.between), opts);
    return { before, after, beforeStrip: strip(before, film.length), afterStrip: strip(after, film.length), beforeNumbers: numbers(before), afterNumbers: numbers(after) };
  }

  /* ---------- real patches ---------- */
  function drivers() {
    const au = AU();
    const list = [{ id: "steady", label: "Steady: held at the new setting" }];
    if (au && au.sources) au.sources().filter((s) => /^momentum:/.test(s.id)).forEach((s) => list.push({ id: s.id, label: s.label }));
    return list;
  }
  /* The patch: setting A is where it was, B the new one; the modulator sits at B (steady) or follows a source. */
  function settings(p, driver) {
    const s = { a: p.from, b: p.to, curve: "linear", across: p.sweep ? 1 : 0, depth: 1, where: { from: p.at, to: p.end }, mode: "gate" };
    if (driver && driver !== "steady") Object.assign(s, { mod: "source:" + driver });
    else Object.assign(s, { mod: "manual", manual: 1 });
    return s;
  }

  function load() {
    try {
      const s = JSON.parse((root.localStorage && root.localStorage.getItem(KEY)) || "null");
      return s && Array.isArray(s.steps) ? s : { steps: [] };
    } catch (e) {
      return { steps: [] };
    }
  }
  function save(s) {
    try {
      if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
  }
  function apply(proposals, opts) {
    const au = AU();
    const o = opts || {};
    const list = (proposals || []).filter((p) => p && p.key && au && au.param && au.param(p.key));
    if (!au) return { ok: false, error: "The automation is not loaded here." };
    if (!list.length) return { ok: false, error: "There is no patch to make." };
    const store = load();
    const items = [];
    list.forEach((p) => {
      if (items.some((x) => x.key === p.key)) return;
      const was = clone(au.patch(p.key));
      items.push({ key: p.key, before: was, running: !!was.running, label: p.label, at: p.atLabel, end: p.endLabel, from: p.from, to: p.to });
    });
    list.forEach((p) => {
      const driver = (o.drivers && o.drivers[p.id]) || o.driver || "steady";
      au.set(p.key, settings(p, driver));
      if (!au.patch(p.key).running) au.start(p.key);
    });
    store.steps.push({ label: o.label || (list.length === 1 ? "Autopilot: " + list[0].label : `Autopilot: ${list.length} patches`), items });
    save(store);
    return { ok: true, keys: items.map((x) => x.key) };
  }
  function putBack(step) {
    const au = AU();
    step.items
      .slice()
      .reverse()
      .forEach((x) => {
        au.stop(x.key);
        au.set(x.key, Object.assign(clone(x.before), { running: false }));
        if (x.running) au.start(x.key);
      });
  }
  function undo() {
    if (!AU()) return { ok: false, error: "The automation is not loaded here." };
    const store = load();
    const step = store.steps.pop();
    if (!step) return { ok: false, error: "Nothing to undo." };
    putBack(step);
    save(store);
    return { ok: true, label: step.label, keys: step.items.map((x) => x.key) };
  }
  function removeAll() {
    if (!AU()) return { ok: false, error: "The automation is not loaded here." };
    const store = load();
    const n = store.steps.reduce((a, s) => a + s.items.length, 0);
    store.steps.slice().reverse().forEach(putBack);
    save({ steps: [] });
    return { ok: true, removed: n };
  }
  const history = () => load().steps;
  /* Every patch Autopilot has made and not taken back, newest last. */
  function applied() {
    const out = [];
    load().steps.forEach((s) => s.items.forEach((x) => out.push(Object.assign({ step: s.label }, x, { before: undefined }))));
    return out;
  }

  const api = { plan, preview, overlay, strip, numbers, settings, drivers, apply, undo, removeAll, history, applied, farEnd, KEY };
  root.CurioAutopilot = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab "Autopilot" in the Momentum window ---------- */
  if (typeof document === "undefined") return;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ui = { drivers: {}, preview: null, flash: "", last: null };
  const PLAYS = { board: "real", engine: "engine", live: "live" };

  function stripHtml(cells, title) {
    const n = cells.length || 1;
    const items = cells
      .map((c) => {
        const tip = c.family ? `${c.label}: ${c.curiosity}, held ${c.held} seconds, ${c.status.words}` : "Nothing holds attention yet";
        const bg = c.family ? `background:${c.color};color:${c.ink}` : "";
        const flag = c.family && c.status.key !== "fresh" ? `<b>${c.status.icon}</b>` : "";
        return `<li class="ap-cell${c.family ? "" : " ap-none"}" style="${bg}" title="${esc(tip)}"><span>${esc(c.letter)}</span>${flag}</li>`;
      })
      .join("");
    return `<div class="ap-strip-row"><span class="ap-strip-name">${esc(title)}</span><ol class="ap-strip" style="grid-template-columns:repeat(${n},minmax(0,1fr))" aria-label="${esc(title)}: who holds attention at each moment">${items}</ol></div>`;
  }
  function numbersLine(nb, limit) {
    const st = M().status(nb.longest, limit);
    return `${nb.overLimit} stretch${nb.overLimit === 1 ? "" : "es"} past the limit, the longest ${nb.longest} seconds <span class="mo-status mo-${st.cls}">${st.icon} ${st.words}</span>, ${nb.moves} move${nb.moves === 1 ? "" : "s"} between families.`;
  }
  function famChip(f) {
    const mk = M().mark(f);
    return `<span class="mo-fam"><i style="background:${mk.color}"></i><b class="ap-letter">${esc(mk.letter)}</b> ${esc(mk.label)}</span>`;
  }
  function note(src) {
    if (src === "board") return "These patches play on the board's panels while they run, moment 1 on panel 1, so this film will change when you apply them.";
    if (src === "engine") return "The engine's film (My film) does not play the automation, so applying these will not change it. The patches play on the board's panels and the Storyboard's scenes, moment 1 on panel 1. The preview shows what attention would do if this film played them.";
    if (src && src.startsWith("sb:")) return "The automation plays on the Storyboard's panels, moment 1 on panel 1, while the patches run.";
    return "This film does not play the automation. The patches play on the board's panels and the Storyboard's scenes, moment 1 on panel 1. The preview shows what attention would do if this film played them.";
  }
  const isOn = (p) => applied().some((x) => x.key === p.key && same(x.at, p.atLabel) && same(x.to, p.to));

  function mount(el, ctx) {
    const src = ctx.source();
    const step = ctx.secondsPerBeat();
    const limit = ctx.limit();
    const beats = ctx.beatsOf(src);
    const T = ctx.target();
    const p = plan(beats, { secondsPerBeat: step, limit, profiles: ctx.profiles(), usual: T && T.medianFamilyRun });
    ui.last = { p, beats, src, step, limit };
    const drv = drivers();
    const said = ui.flash;
    ui.flash = "";
    const mine = applied();
    const cards = p.proposals
      .map((x, i) => {
        const on = isOn(x);
        const pick = ui.drivers[x.id] || "steady";
        return `<li class="ap-card${on ? " ap-on" : ""}">
          <div class="ap-head"><span class="ap-move">${famChip(x.holding)} <span aria-hidden="true">→</span><span class="ap-sr">to</span> ${famChip(x.family)}</span>${on ? `<span class="ap-tag">● Applied</span>` : ""}</div>
          <p class="ap-text">${esc(x.text)}</p>
          <p class="ap-why"><b>Why:</b> ${esc(x.why)}</p>
          <div class="mo-controls"><label>Driven by <select data-ap-driver="${i}">${drv.map((d) => `<option value="${esc(d.id)}"${d.id === pick ? " selected" : ""}>${esc(d.label)}</option>`).join("")}</select></label>
          <button type="button" data-ap="one" data-i="${i}"${on ? " disabled" : ""}>${on ? "Applied" : "Apply this one"}</button>
          <button type="button" data-ap="look" data-i="${i}">Preview this one</button></div>
        </li>`;
      })
      .join("");
    const pv = ui.preview && ui.preview.src === src ? ui.preview : null;
    let pvHtml = "";
    if (pv) {
      const list = pv.which === "all" ? p.proposals : p.proposals.filter((x) => x.id === pv.which);
      const r = preview(beats, list, { secondsPerBeat: step, limit });
      pvHtml = `<section class="ap-preview" aria-live="polite"><h3>Preview: ${pv.which === "all" ? list.length === 1 ? "the one patch" : `all ${list.length} patches` : esc((list[0] || {}).label || "")}</h3>
        ${stripHtml(r.beforeStrip, "Now")}${stripHtml(r.afterStrip, "With the patches")}
        <p class="mo-small"><b>Now:</b> ${numbersLine(r.beforeNumbers, limit)}</p>
        <p class="mo-small"><b>With the patches:</b> ${numbersLine(r.afterNumbers, limit)}</p>
        <p class="mo-small">Each square is one moment, colored and lettered by the family that holds attention. ▲ means Getting long and ■ means Too long. The preview reads the film again with the patches' settings laid on their moments, the steady way (a source moves them only while the film plays).</p></section>`;
    }
    const pending = p.proposals.filter((x) => !isOn(x));
    el.innerHTML = `<div class="ap-root">
      ${said ? `<div class="mo-flash" role="status">${esc(said)}</div>` : ""}
      <p>Autopilot finds every stretch where one family holds attention too long and proposes one automation patch for each: a curiosity of another family that changes over those moments, so attention moves there. Nothing changes until you apply a patch, and Undo takes it back.</p>
      <div class="mo-controls"><label>Film ${ctx.sourcePicker("data-ap-source")}</label></div>
      <p class="mo-small">${esc(note(src))} One family may hold attention for ${limit} seconds before it counts as too long; each moment lasts ${step} seconds.</p>
      <section><h3>Proposed patches</h3>${
        !beats.length
          ? `<p class="mo-empty">This film has no moments yet. Pick another film above.</p>`
          : p.proposals.length
            ? `<p class="mo-small"><b>Now:</b> ${numbersLine(p.before, limit)}<br><b>With every patch:</b> ${numbersLine(p.after, limit)}</p>
              <ol class="ap-list">${cards}</ol>
              <div class="mo-controls"><button type="button" data-ap="all"${pending.length ? "" : " disabled"}>Apply all (${pending.length})</button><button type="button" data-ap="look-all">Preview all</button></div>`
            : `<p class="mo-small"><span class="mo-status mo-good">● Fresh</span> No family holds attention past the limit in this film, so there is nothing to automate.</p>`
      }</section>
      ${pvHtml}
      <section><h3>Patches Autopilot made</h3>${
        mine.length
          ? `<ul class="ap-made">${mine.map((x) => `<li>${esc(x.label)}: from "${esc(x.from)}" to "${esc(x.to)}", over ${esc(x.at)} to ${esc(x.end)}</li>`).join("")}</ul>
            <div class="mo-controls"><button type="button" data-ap="undo">Undo the last apply</button><button type="button" data-ap="remove">Remove these</button>${root.CurioAutomate || document.querySelector('#lib-menu [data-tab="automate"]') ? `<button type="button" data-ap="open">Open the Automation window</button>` : ""}</div>
            <p class="mo-small">Undo puts the patches of the last apply back as they were. Remove these puts back every patch above. A reload stops every automation patch; start them again in the Automation window.</p>`
          : `<p class="mo-small">None yet.</p>`
      }</section>
    </div>`;
    wireOnce(el, ctx);
  }
  function wireOnce(el, ctx) {
    if (el.__apWired) return;
    el.__apWired = true;
    const redraw = () => mount(el, ctx);
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.matches("[data-ap-source]")) {
        ctx.setSource(t.value);
        ui.preview = null;
        redraw();
      } else if (t.dataset.apDriver != null) {
        const x = ui.last && ui.last.p.proposals[Number(t.dataset.apDriver)];
        if (x) ui.drivers[x.id] = t.value;
      }
    });
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || !el.contains(t) || !ui.last) return;
      const list = ui.last.p.proposals;
      const act = t.dataset.ap;
      if (act === "one" || act === "all") {
        const which = act === "one" ? [list[Number(t.dataset.i)]].filter(Boolean) : list.filter((x) => !isOn(x));
        const res = apply(which, { drivers: ui.drivers });
        ui.flash = res.ok ? `Made ${which.length} automation patch${which.length === 1 ? "" : "es"} in one step and started ${which.length === 1 ? "it" : "them"}. Undo the last apply takes ${which.length === 1 ? "it" : "them"} back.` : res.error;
        redraw();
      } else if (act === "look" || act === "look-all") {
        const x = list[Number(t.dataset.i)];
        ui.preview = { src: ui.last.src, which: act === "look-all" ? "all" : x && x.id };
        redraw();
        const box = el.querySelector(".ap-preview");
        if (box && box.scrollIntoView) box.scrollIntoView({ block: "nearest" });
      } else if (act === "undo") {
        const res = undo();
        ui.flash = res.ok ? `Undone: ${res.label}. Those patches are back as they were.` : res.error;
        redraw();
      } else if (act === "remove") {
        const res = removeAll();
        ui.flash = res.ok ? `Removed: every patch Autopilot made (${res.removed}) is back as it was.` : res.error;
        redraw();
      } else if (act === "open") {
        const U = root.CurioMomentumUI;
        if (U && U.close) U.close();
        const b = document.getElementById("lib-btn");
        if (b) b.click();
        const item = document.querySelector('#lib-menu [data-tab="automate"]');
        if (item) item.click();
      }
    });
  }
  function register() {
    return !!(root.CurioMomentumUI && root.CurioMomentumUI.addTab({ id: "autopilot", label: "Autopilot", group: "fix", mount }));
  }
  if (!register()) {
    let tries = 0;
    const t = setInterval(() => (register() || ++tries > 100) && clearInterval(t), 100);
  }
})();
