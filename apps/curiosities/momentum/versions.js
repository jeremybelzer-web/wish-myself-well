/* momentum/versions.js: the "Versions" tab (Fix it). While you edit, did a change make the film feel more alive or
   less? This keeps snapshots of the momentum reading of the chosen film and compares any two side by side.

   - Keep this version (with an optional name; the default is "Version N, 14:05").
   - Automatic snapshots when Pace it, Autopilot, the engine or Undo changes the film (CurioEngine.on and
     CurioAuto.on): one edit makes one snapshot at most (a burst of changes waits until it settles), a reading
     that did not change makes none, and each film keeps at most 30 (the oldest is dropped).
   - Pick any two to compare: their attention strips aligned moment by moment, the numbers with arrows and plain
     words, and one verdict in words (better, worse or about the same) with the reason.
   Only the reading summary is stored, never the film itself: each moment as its family letter and the second
   it starts at, and the numbers (moves a minute, usual rest, longest rest, momentum reading, time past the
   limit). localStorage key "curiosities-momentum-versions-v1".

   Part of the momentum core (no page) plus the tab when ui.js is loaded.

   window.CurioVersions
   - summary(reading) -> { moments: [[letter, seconds]], stats, limit, seconds, count }
       stats: { movesPerMinute, usualRest, longestRest, momentum, pastLimit }
   - snapshot(reading, { film, filmLabel, name, reason, auto, now, n }) -> a version (summary plus id, name, at ...)
   - sameReading(a, b)  true when two versions read the same (moments and numbers)
   - add(store, version, max) -> the store with the version added (at most max per film, oldest dropped)
   - remove(store, id), clear(store, film), list(store, film) (newest first), nextNumber(store, film)
   - compare(older, newer) -> { rows, sentences, text, verdict: { key: "better"|"worse"|"same", words, reason }, aligned }
   - defaultName(n, at), reasonFor(engineLabel), familyOfLetter(letter)
   - load(storage), save(store, storage), KEY, MAX */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const A = () => root.CurioAttention;
  const KEY = "curiosities-momentum-versions-v1";
  const MAX = 30;
  const MAX_MOMENTS = 600;
  const round = (n, d) => {
    const p = Math.pow(10, d || 0);
    return Math.round((Number(n) || 0) * p) / p;
  };

  /* ---------- the summary of one reading ---------- */
  function familyOfLetter(letter) {
    if (!letter) return null;
    const L = M().LETTERS;
    return Object.keys(L).find((f) => L[f] === letter) || null;
  }
  function summary(reading) {
    const r = reading || {};
    const s = r.stats || {};
    const segs = r.segments || [];
    const limit = Number(r.limit) > 0 ? Number(r.limit) : 20;
    const count = Math.min(MAX_MOMENTS, Math.max(0, Number(r.beats) || 0));
    const step = r.beats ? (Number(r.seconds) || 0) / r.beats : 3;
    const runs = s.familyRuns || (A() && A().familyRuns ? A().familyRuns(segs) : []);
    const moments = [];
    let cur = null;
    for (let i = 0; i < count; i++) {
      segs.forEach((g) => g.beat === i && (cur = g));
      moments.push([cur && cur.family ? M().mark(cur.family).letter : "", round(i * step, 1)]);
    }
    return {
      moments,
      stats: {
        movesPerMinute: round(s.switchesPerMinute, 1),
        usualRest: round(s.medianFamilyRun, 1),
        longestRest: round(Math.max(0, ...runs.map((g) => g.dur || 0)), 1),
        momentum: round(s.momentum, 2),
        pastLimit: round(runs.reduce((a, g) => a + Math.max(0, (g.dur || 0) - limit), 0), 1),
      },
      limit,
      seconds: round(r.seconds, 1),
      count: Number(r.beats) || 0,
    };
  }

  const pad = (n) => (n < 10 ? "0" : "") + n;
  function clock(at) {
    const d = new Date(at);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  const defaultName = (n, at) => `Version ${n}, ${clock(at)}`;

  function snapshot(reading, o) {
    const opt = o || {};
    const at = Number(opt.now) || Date.now();
    const n = Number(opt.n) || 1;
    const name = String(opt.name || "").trim().slice(0, 80) || defaultName(n, at);
    return Object.assign(
      { id: "v" + at.toString(36) + Math.random().toString(36).slice(2, 6), film: opt.film || "", filmLabel: opt.filmLabel || "", name, n, at, auto: !!opt.auto, reason: opt.reason || "" },
      summary(reading)
    );
  }

  function sameReading(a, b) {
    if (!a || !b) return false;
    return JSON.stringify([a.moments, a.stats, a.limit]) === JSON.stringify([b.moments, b.stats, b.limit]);
  }

  /* ---------- the store ---------- */
  const empty = () => ({ v: 1, next: {}, versions: [] });
  function tidy(store) {
    const s = store && typeof store === "object" ? store : {};
    return { v: 1, next: s.next && typeof s.next === "object" ? Object.assign({}, s.next) : {}, versions: Array.isArray(s.versions) ? s.versions.filter((x) => x && x.id && Array.isArray(x.moments) && x.stats) : [] };
  }
  const list = (store, film) => tidy(store).versions.filter((v) => film == null || v.film === film).sort((a, b) => b.at - a.at || b.n - a.n);
  const nextNumber = (store, film) => Number(tidy(store).next[film]) || list(store, film).reduce((m, v) => Math.max(m, (v.n || 0) + 1), 1);
  function add(store, version, max) {
    const s = tidy(store);
    const cap = Number(max) > 0 ? Number(max) : MAX;
    s.versions.push(version);
    s.next[version.film] = Math.max(nextNumber(store, version.film), (version.n || 0) + 1);
    const mine = s.versions.filter((v) => v.film === version.film).sort((a, b) => a.at - b.at || a.n - b.n);
    const drop = new Set(mine.slice(0, Math.max(0, mine.length - cap)).map((v) => v.id));
    s.versions = s.versions.filter((v) => !drop.has(v.id));
    return s;
  }
  function remove(store, id) {
    const s = tidy(store);
    s.versions = s.versions.filter((v) => v.id !== id);
    return s;
  }
  function clear(store, film) {
    const s = tidy(store);
    s.versions = film == null ? [] : s.versions.filter((v) => v.film !== film);
    if (film == null) s.next = {};
    else delete s.next[film];
    return s;
  }
  function load(storage) {
    try {
      const st = storage || root.localStorage;
      return tidy(JSON.parse(st.getItem(KEY)) || empty());
    } catch (e) {
      return empty();
    }
  }
  function save(store, storage) {
    try {
      (storage || root.localStorage).setItem(KEY, JSON.stringify(tidy(store)));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* What changed the film, from the engine's undo label. */
  function reasonFor(label) {
    const l = String(label || "");
    if (/^Undo/i.test(l)) return "after Undo";
    if (/^Redo/i.test(l)) return "after Redo";
    if (/^Momentum: pace like/i.test(l)) return "after Pace it";
    if (/^Momentum/i.test(l)) return "after a Momentum change";
    if (/autopilot/i.test(l)) return "after Autopilot";
    return l ? `after an engine change (${l})` : "after an engine change";
  }

  /* ---------- comparing two versions ---------- */
  const plural = (n, one, many) => (Math.abs(n) === 1 ? one : many);
  const num = (n) => String(round(n, 1));
  function compare(older, newer) {
    const a = older.stats;
    const b = newer.stats;
    const lim = newer.limit || older.limit || 20;
    const rushed = b.usualRest > 0 && b.usualRest < 2;
    const d = (k) => round(b[k] - a[k], k === "momentum" ? 2 : 1);
    const dir = (x, near) => (Math.abs(x) < near ? 0 : x > 0 ? 1 : -1);
    /* Each row: which way is better (+1 up, -1 down), and how much change counts. */
    const SPEC = [
      { key: "movesPerMinute", label: "Moves a minute", unit: "", near: 0.5, good: rushed ? 0 : 1 },
      { key: "usualRest", label: "Usual rest on one family", unit: " s", near: 1, good: rushed ? 0 : -1 },
      { key: "longestRest", label: "Longest rest on one family", unit: " s", near: 2, good: -1 },
      { key: "momentum", label: "Momentum reading (0 to 5)", unit: "", near: 0.3, good: 1 },
      { key: "pastLimit", label: "Time past the limit", unit: " s", near: 1, good: -1 },
    ];
    const WEIGHT = { movesPerMinute: 1, usualRest: 0.5, longestRest: 1, momentum: 1, pastLimit: 2 };
    let score = 0;
    const rows = SPEC.map((sp) => {
      const delta = d(sp.key);
      const way = dir(delta, sp.near);
      const effect = way * sp.good;
      score += effect * WEIGHT[sp.key];
      return { key: sp.key, label: sp.label, unit: sp.unit, from: a[sp.key], to: b[sp.key], delta, arrow: way > 0 ? "↑" : way < 0 ? "↓" : "→", effect, words: effect > 0 ? "better" : effect < 0 ? "worse" : way ? "changed" : "about the same" };
    });
    const row = (k) => rows.find((r) => r.key === k);

    /* Plain sentences. */
    const mv = row("movesPerMinute");
    const moves =
      Math.abs(mv.delta) < 0.5
        ? `Attention moves about as often as before (${num(mv.to)} times a minute)`
        : `Attention moves ${num(Math.abs(mv.delta))} ${mv.delta > 0 ? "more" : "fewer"} ${plural(Math.abs(mv.delta), "time", "times")} a minute (from ${num(mv.from)} to ${num(mv.to)})`;
    const went = (r, what, unit) => (r.from === r.to ? `${what} stays at ${num(r.to)}${unit}` : `${what} went from ${num(r.from)} to ${num(r.to)}${unit}`);
    const sentences = [
      `${moves}; ${went(row("longestRest"), "the longest rest", " seconds")}.`,
      `${went(row("usualRest"), "The usual rest", " seconds")}; ${went(row("momentum"), "the momentum reading", " out of 5")}.`,
      row("pastLimit").from === 0 && row("pastLimit").to === 0 ? `No family holds attention past the limit of ${num(lim)} seconds in either version.` : `${went(row("pastLimit"), "Time past the limit", " seconds")} (the limit is ${num(lim)} seconds).`,
    ];
    if (rushed) sentences.push(`Attention now rests only about ${num(b.usualRest)} seconds at a time, which may feel rushed, so more moves do not count as better.`);
    if (newer.count !== older.count) sentences.push(`The film has ${newer.count} ${plural(newer.count, "moment", "moments")} now, against ${older.count} before.`);

    const key = score >= 1.5 ? "better" : score <= -1.5 ? "worse" : "same";
    const helped = rows.filter((r) => r.effect > 0).sort((x, y) => WEIGHT[y.key] - WEIGHT[x.key]);
    const hurt = rows.filter((r) => r.effect < 0).sort((x, y) => WEIGHT[y.key] - WEIGHT[x.key]);
    const said = (r) => {
      if (r.key === "pastLimit") return r.delta < 0 ? "less time past the limit" : "more time past the limit";
      if (r.key === "longestRest") return r.delta < 0 ? "a shorter longest rest" : "a longer longest rest";
      if (r.key === "usualRest") return r.delta < 0 ? "shorter usual rests" : "longer usual rests";
      if (r.key === "momentum") return r.delta > 0 ? "a higher momentum reading" : "a lower momentum reading";
      return r.delta > 0 ? "attention moving more often" : "attention moving less often";
    };
    const joinWords = (xs) => (xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
    let reason;
    if (key === "better") reason = `This version keeps the film moving better: ${joinWords(helped.slice(0, 3).map(said))}.`;
    else if (key === "worse") reason = `This version lets the film sit still more: ${joinWords(hurt.slice(0, 3).map(said))}.`;
    else if (!helped.length && !hurt.length) reason = "The two versions feel about the same: none of the numbers moved much.";
    else reason = `The two versions feel about the same: ${joinWords(helped.slice(0, 2).map(said))}${helped.length && hurt.length ? ", but " : ""}${joinWords(hurt.slice(0, 2).map(said))}${helped.length && hurt.length ? "" : ", and not by much"}.`;
    const words = key === "better" ? "Better" : key === "worse" ? "Worse" : "About the same";

    /* The two strips, aligned moment by moment. */
    const n = Math.max(older.moments.length, newer.moments.length);
    const aligned = [];
    for (let i = 0; i < n; i++) {
      const x = older.moments[i] ? older.moments[i][0] : null;
      const y = newer.moments[i] ? newer.moments[i][0] : null;
      aligned.push({ i, a: x, b: y, same: x === y });
    }
    const changed = aligned.filter((m) => !m.same).length;
    if (changed) sentences.push(`Attention rests on a different family in ${changed} of ${n} ${plural(n, "moment", "moments")}.`);
    else sentences.push("Attention rests on the same family in every moment.");

    return { rows, sentences, text: sentences[0] + " " + reason, score: round(score, 1), verdict: { key, words, reason }, aligned, changed };
  }

  const api = { KEY, MAX, summary, snapshot, sameReading, add, remove, clear, list, nextNumber, compare, defaultName, reasonFor, familyOfLetter, load, save };
  root.CurioVersions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  /* ---------- the tab ---------- */
  if (typeof document === "undefined") return;
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const ui = { pick: [], pickFilm: null, name: "", confirm: false, flash: "", el: null, ctx: null };
  const U = () => root.CurioMomentumUI;
  const ctxNow = () => ui.ctx || (U() && U().context ? U().context() : null);

  function filmLabelOf(ctx, id) {
    const s = (ctx.sources() || []).find((x) => x.id === id);
    return s ? s.label : id;
  }
  function readNow(ctx) {
    const id = ctx.source();
    return { id, reading: ctx.readSource(id) };
  }
  function keep(ctx, o) {
    const { id, reading } = readNow(ctx);
    if (!reading || !reading.beats) return null;
    let store = load();
    const v = snapshot(reading, Object.assign({ film: id, filmLabel: filmLabelOf(ctx, id), n: nextNumber(store, id) }, o));
    const last = list(store, id)[0];
    if (o && o.auto && last && sameReading(last, v)) return null;
    store = add(store, v, MAX);
    save(store);
    /* Every new version is compared with the one just before it: did that change help? */
    if (ui.pickFilm === id) ui.pick = last ? [last.id, v.id] : [v.id];
    return v;
  }

  /* Automatic snapshots: one per edit (a burst waits until it settles for a moment). */
  let timer = null;
  let pending = "";
  let baseline = null;
  function remember() {
    const ctx = ctxNow();
    if (!ctx) return;
    try {
      const { id, reading } = readNow(ctx);
      baseline = reading && reading.beats ? { film: id, filmLabel: filmLabelOf(ctx, id), reading } : null;
    } catch (e) {}
  }
  function schedule(reason) {
    if (pending !== "after Undo") pending = reason;
    clearTimeout(timer);
    timer = setTimeout(autoSnap, 900);
  }
  function autoSnap() {
    const reason = pending;
    pending = "";
    const ctx = ctxNow();
    if (!ctx) return;
    try {
      const id = ctx.source();
      /* The film as it was before the first change, so the first change has something to compare with. */
      if (baseline && baseline.film === id && !list(load(), id).length) {
        let st = load();
        const before = snapshot(baseline.reading, { film: id, filmLabel: baseline.filmLabel, n: nextNumber(st, id), auto: true, reason: "before the first change", now: Date.now() - 1 });
        st = add(st, before, MAX);
        save(st);
      }
      keep(ctx, { auto: true, reason });
      remember();
      if (ui.el && ui.el.isConnected && ui.el.querySelector(".vs-root")) mount(ui.el, ctx);
    } catch (e) {}
  }
  let hooked = false;
  function hook() {
    if (hooked) return;
    hooked = true;
    const E = root.CurioEngine;
    if (E && typeof E.on === "function") E.on((ev) => schedule(reasonFor(ev && ev.label)));
    const Au = root.CurioAuto;
    if (Au && typeof Au.on === "function") Au.on((type) => type === "change" && schedule("after Autopilot or an automation change"));
    setTimeout(remember, 0);
  }

  /* ---------- drawing ---------- */
  const cell = (letter, extra) => {
    const f = familyOfLetter(letter);
    if (!f) return `<span class="vs-cell vs-none"${extra || ""}></span>`;
    const mk = M().mark(f);
    return `<span class="vs-cell" style="background:${mk.color};color:${mk.ink}" title="${esc(mk.label)}"${extra || ""}><i>${esc(mk.letter)}</i></span>`;
  };
  /* A long film is shown in at most `cells` cells (each the family at its first moment). */
  function sample(moments, cells) {
    if (moments.length <= cells) return moments.map((m) => m[0]);
    const out = [];
    for (let i = 0; i < cells; i++) out.push(moments[Math.floor((i * moments.length) / cells)][0]);
    return out;
  }
  const mini = (v) => `<div class="vs-mini" aria-hidden="true">${sample(v.moments, 60).map((l) => cell(l)).join("")}</div>`;
  function stamp(at) {
    const d = new Date(at);
    const today = new Date();
    const day = d.toDateString() === today.toDateString() ? "today" : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    return `${day} at ${clock(at)}`;
  }
  const brief = (v) => `${v.stats.movesPerMinute} moves a minute, longest rest ${v.stats.longestRest} s, momentum ${num(v.stats.momentum)} out of 5${v.stats.pastLimit ? `, ${v.stats.pastLimit} s past the limit` : ""}`;

  function alignedHtml(c, older, newer) {
    const cells = 120;
    const n = c.aligned.length;
    const idx = n <= cells ? c.aligned.map((m, i) => i) : Array.from({ length: cells }, (_, i) => Math.floor((i * n) / cells));
    const strip = (side) => idx.map((i) => cell(c.aligned[i][side])).join("");
    const marks = idx.map((i) => `<span class="vs-diff">${c.aligned[i].same ? "" : "•"}</span>`).join("");
    const legend = [...new Set(older.moments.concat(newer.moments).map((m) => m[0]).filter(Boolean))]
      .map((l) => {
        const mk = M().mark(familyOfLetter(l));
        return `<span class="vs-key"><span class="vs-letter" style="background:${mk.color};color:${mk.ink}">${esc(mk.letter)}</span>${esc(mk.label)}</span>`;
      })
      .join("");
    return `<div class="vs-pair">
      <div class="vs-lab">${esc(older.name)} <small>(older)</small></div><div class="vs-strip">${strip("a")}</div>
      <div class="vs-lab">${esc(newer.name)} <small>(newer)</small></div><div class="vs-strip">${strip("b")}</div>
      <div class="vs-diffs" aria-hidden="true">${marks}</div>
    </div>
    <p class="mo-small">One cell per moment${n > cells ? ` (this film is long, so each cell shows about ${Math.round(n / cells)} moments)` : ""}, the two versions lined up moment by moment. A dot under a moment means attention rests on a different family there.</p>
    <div class="vs-legend">${legend}</div>`;
  }
  function numbersHtml(c, older, newer) {
    const lim = newer.limit || 20;
    const fmt = (r, v) => {
      const t = num(v) + r.unit;
      if (r.key !== "longestRest") return t;
      const st = M().status(v, lim);
      return `${t} <span class="mo-status mo-${st.cls}">${st.icon} ${st.words}</span>`;
    };
    return `<div class="mo-scroll"><table class="vs-nums"><thead><tr><th scope="col">Number</th><th scope="col">Older</th><th scope="col">Newer</th><th scope="col">Change</th></tr></thead><tbody>${c.rows
      .map((r) => `<tr><th scope="row">${r.label}</th><td>${fmt(r, r.from)}</td><td>${fmt(r, r.to)}</td><td class="vs-ch vs-${r.effect > 0 ? "up" : r.effect < 0 ? "down" : "flat"}"><b aria-hidden="true">${r.arrow}</b> ${r.delta ? (r.delta > 0 ? "+" : "") + num(r.delta) + r.unit + ", " : ""}${r.words}</td></tr>`)
      .join("")}</tbody></table></div>`;
  }
  function compareHtml(versions) {
    const picked = ui.pick.map((id) => versions.find((v) => v.id === id)).filter(Boolean);
    if (picked.length < 2)
      return `<section class="vs-compare"><h3>Compare two versions</h3><p class="mo-empty">${versions.length < 2 ? "Keep at least two versions to compare them. Keep one now, make a change, then keep another." : "Tick Compare on two versions in the list below."}</p></section>`;
    const [older, newer] = picked.sort((x, y) => x.at - y.at || x.n - y.n);
    const c = compare(older, newer);
    const icon = c.verdict.key === "better" ? "+" : c.verdict.key === "worse" ? "−" : "=";
    return `<section class="vs-compare"><h3>Compare two versions</h3>
      <div class="vs-verdict vs-${c.verdict.key}" role="status"><span class="vs-vicon" aria-hidden="true">${icon}</span><div><b>${esc(newer.name)} is ${c.verdict.key === "same" ? "about the same as" : c.verdict.words.toLowerCase() + " than"} ${esc(older.name)}.</b><br />${esc(c.verdict.reason)}</div></div>
      <ul class="vs-says">${c.sentences.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      ${alignedHtml(c, older, newer)}
      ${numbersHtml(c, older, newer)}
    </section>`;
  }
  function mount(el, ctx) {
    ui.el = el;
    ui.ctx = ctx;
    hook();
    const id = ctx.source();
    const reading = ctx.readSource(id);
    const store = load();
    const versions = list(store, id);
    ui.pick = ui.pick.filter((p) => versions.some((v) => v.id === p));
    /* A film opened again starts by comparing its two newest versions; after that the ticks are yours. */
    if (ui.pickFilm !== id) {
      ui.pickFilm = id;
      ui.pick = versions.slice(0, 2).map((v) => v.id).reverse();
    }
    const said = ui.flash;
    ui.flash = "";
    const now = reading && reading.beats ? summary(reading) : null;
    const placeholder = defaultName(nextNumber(store, id), Date.now());
    baseline = now ? { film: id, filmLabel: filmLabelOf(ctx, id), reading } : null;
    const items = versions
      .map(
        (v) => `<li class="vs-item${ui.pick.includes(v.id) ? " on" : ""}">
        <label class="vs-tick"><input type="checkbox" data-vs-pick="${esc(v.id)}"${ui.pick.includes(v.id) ? " checked" : ""} /> Compare</label>
        <div class="vs-what"><b class="vs-name">${esc(v.name)}</b> <small>${stamp(v.at)}${v.auto ? `, kept by itself ${esc(v.reason)}` : ""}</small>
        ${mini(v)}<small class="vs-brief">${esc(brief(v))}</small></div>
        <button type="button" data-vs-del="${esc(v.id)}" aria-label="Delete ${esc(v.name)}">Delete</button></li>`
      )
      .join("");
    el.innerHTML = `<div class="vs-root">
      ${said ? `<div class="mo-flash" role="status">${esc(said)}</div>` : ""}
      <p>While you edit, keep versions of the film's momentum reading, then compare any two to see whether a change made the film feel more alive or less. A version is kept by itself each time Pace it, Autopilot, the engine or Undo changes the film. Only the reading is kept (which family holds attention in each moment, and the numbers), never the film itself.</p>
      <div class="mo-controls vs-controls">
        <label>Film ${ctx.sourcePicker('data-vs="film"')}</label>
        <label>Name <input type="text" data-vs="name" maxlength="80" placeholder="${esc(placeholder)}" value="${esc(ui.name)}" /></label>
        <button type="button" class="vs-keep" data-vs="keep"${now ? "" : " disabled"}>Keep this version</button>
      </div>
      ${now ? `<div class="vs-now"><b>Right now:</b> ${mini(now)}<small class="vs-brief">${esc(brief(now))}</small></div>` : `<p class="mo-empty">This film has no moments yet, so there is nothing to keep.</p>`}
      ${compareHtml(versions)}
      <section><h3>Versions of this film (${versions.length} of at most ${MAX}, newest first)</h3>
      ${versions.length ? `<ul class="vs-list">${items}</ul>` : `<p class="mo-empty">No versions yet. Press Keep this version, or change the film with Pace it, Autopilot or the engine.</p>`}
      ${
        versions.length
          ? ui.confirm
            ? `<div class="vs-confirm" role="alertdialog" aria-label="Clear all versions"><span>Delete all ${versions.length} versions of this film? This cannot be undone.</span><button type="button" data-vs="clear-yes">Yes, delete them all</button><button type="button" data-vs="clear-no">No, keep them</button></div>`
            : `<div class="mo-controls"><button type="button" data-vs="clear">Clear all</button></div>`
          : ""
      }</section>
    </div>`;
    wireOnce(el, ctx);
  }
  function wireOnce(el, ctx) {
    if (el.__vsWired) return;
    el.__vsWired = true;
    const redraw = () => mount(el, ui.ctx || ctx);
    el.addEventListener("input", (e) => {
      if (e.target.dataset.vs === "name") ui.name = e.target.value;
    });
    el.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.vs === "film") {
        (ui.ctx || ctx).setSource(t.value);
        ui.pick = [];
        ui.confirm = false;
        redraw();
      } else if (t.dataset.vsPick != null) {
        const pid = t.dataset.vsPick;
        if (t.checked) ui.pick = ui.pick.filter((p) => p !== pid).concat(pid).slice(-2);
        else ui.pick = ui.pick.filter((p) => p !== pid);
        redraw();
      }
    });
    el.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t || !el.contains(t)) return;
      const c = ui.ctx || ctx;
      if (t.dataset.vs === "keep") {
        const v = keep(c, { name: ui.name });
        ui.name = "";
        if (v) {
          ui.flash = `Kept "${v.name}".`;
        }
        redraw();
      } else if (t.dataset.vsDel) {
        const st = load();
        const v = st.versions.find((x) => x.id === t.dataset.vsDel);
        save(remove(st, t.dataset.vsDel));
        if (v) ui.flash = `Deleted "${v.name}".`;
        redraw();
      } else if (t.dataset.vs === "clear") {
        ui.confirm = true;
        redraw();
      } else if (t.dataset.vs === "clear-no") {
        ui.confirm = false;
        redraw();
      } else if (t.dataset.vs === "clear-yes") {
        save(clear(load(), c.source()));
        ui.confirm = false;
        ui.pick = [];
        ui.flash = "Deleted every version of this film.";
        redraw();
      }
    });
  }
  function register() {
    if (!(U() && U().addTab)) return false;
    U().addTab({ id: "versions", label: "Versions", group: "fix", mount });
    hook();
    return true;
  }
  if (!register()) {
    let tries = 0;
    const t = setInterval(() => (register() || ++tries > 100) && clearInterval(t), 100);
  }
})();
