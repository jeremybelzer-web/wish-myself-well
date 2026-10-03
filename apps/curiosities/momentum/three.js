/* momentum/three.js: "Three films". Jeremy's layout idea (2026-10-03): three windows, two films that inspire
   you and your own film, so you can borrow from both. The momentum version stacks three attention ribbons
   (inspiration A, inspiration B, your film), each one colored by the family of curiosities holding attention,
   so their shapes can be compared:
     Same length  every ribbon is stretched to the full width, so the same point is the same share of the way in
     Real time    one shared clock, so a shorter film ends early
   Under each ribbon are its meter numbers (moves a minute, usual hold, longest hold with ● ▲ ■, momentum 0 to 5).
   One shared cursor: pointing at or tapping any ribbon shows a line across all three at the same point, with a
   line of text per film saying what holds attention there and on which cue.

   Blend: 3 to 5 suggestions for your film taken from A and B together. Where A and B both move attention at
   about the same point (as a share of the way in) and your film holds there, it suggests that move with the cue
   A or B uses; when they move to different families it says so and offers both. When your film is the engine's
   film, each suggestion can be made (CurioMomentumEngine.moveAt and applyMove: one undo step).

   The rules (all numbers below, written down so they can be argued with):
   1. A move is a change of family (stats.moves from CurioAttention.read). Its point is its time over the film's
      length, from 0 (start) to 1 (end).
   2. A move of A and a move of B pair when their points are at most WINDOWS[0] (0.06) apart; when that gives
      fewer than 3 suggestions the window widens to 0.1, then 0.15. Closest pairs first, each move used once.
   3. Your film holds at a point when none of its own moves is within the same window of it. The family it holds
      on there must differ from the family suggested, or the suggestion is dropped.
   4. The best suggestions are kept: both films agreeing on the family first, then the longest hold in your film.
      Suggestions sit at least one window apart. If fewer than 3 are found, a move only one of the two films
      makes (where your film holds) fills the list, marked as one film's move.

   Part of the momentum core (no page): three() and at() work in Node. The tab "Three films" is the drawing.

   window.CurioThree
   - three(readings, opts) -> {
       mode: "same"|"real", span (seconds, the longest film),
       films: [{ role: "a"|"b"|"mine", name, seconds, empty, width (0..1 of the ribbon),
                 segments: [{ family, label, cue, quiet, from, to, x0, x1 }] (x in 0..1 of the ribbon),
                 meter: { movesPerMinute, usualHold, longestHold, status: { cls, icon, text }, momentum } }],
       blend: [{ id, p (0..1), t (seconds in your film), beat, row, together, agree: "same"|"family"|"split"|"one",
                 holding: { family, label, held }, options: [{ family, cue, quiet, curiosity, label, by: ["a"|"b"] }],
                 text }]
     }
     readings: [A, B, yours] attention readings (CurioAttention.read). opts: { mode, names: [a, b, yours],
     rows: row ids of your film's beats (the engine's rows), max: 5 }
   - at(readings, f, opts) -> one line per film at point f (0..1 of the ribbon): [{ role, name, t, ended, family,
       label, cue, held, status, text }]
   - status(seconds, limit) -> { cls, icon, text }   ● Fresh, ▲ Getting long, ■ Too long
   - WINDOWS, addTab() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const WINDOWS = [0.06, 0.1, 0.15];
  const ROLES = ["a", "b", "mine"];
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const secs = (n) => (Math.round(n) === 1 ? "1 second" : Math.round(n) + " seconds");

  const famLabel = (f) => ((M() && M().family(f)) || { label: f }).label;
  const cueWord = (c) => String(((M() && M().CUES.find((x) => x.id === c)) || { label: c + " cue" }).label).toLowerCase();
  const article = (w) => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
  const cuePhrase = (m) => article((m.quiet ? "quiet " : "") + cueWord(m.cue)) + (m.quiet ? " (something stops)" : "");
  function clock(s) {
    if (A() && A().clock) return A().clock(s);
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function status(seconds, limit) {
    if (!seconds) return { cls: "good", icon: "●", text: "Fresh" };
    const r = seconds / (limit || 20);
    if (r < 0.75) return { cls: "good", icon: "●", text: "Fresh" };
    if (r <= 1) return { cls: "warn", icon: "▲", text: "Getting long" };
    return { cls: "crit", icon: "■", text: "Too long" };
  }

  const lenOf = (r) => (r && r.seconds) || (r && r.segments && r.segments.length ? r.segments[r.segments.length - 1].to : 0);
  const runsOf = (r) => (r && r.stats && r.stats.familyRuns) || (A() && r && r.segments ? A().familyRuns(r.segments) : []);
  function segAt(r, t) {
    const segs = (r && r.segments) || [];
    return segs.find((g) => t >= g.from && t < g.to) || (segs.length && t >= segs[segs.length - 1].to - 1e-9 ? segs[segs.length - 1] : null);
  }
  function runAt(r, t) {
    const runs = runsOf(r);
    return runs.find((g) => t >= g.from && t < g.to) || (runs.length && t >= runs[runs.length - 1].to - 1e-9 ? runs[runs.length - 1] : null);
  }

  function filmOf(r, role, name, mode, span) {
    const seconds = lenOf(r);
    const s = (r && r.stats) || {};
    const longest = Math.max(0, ...runsOf(r).map((g) => g.dur));
    const scale = mode === "real" ? span || 1 : seconds || 1;
    return {
      role,
      name: name || role,
      seconds,
      empty: !(r && r.segments && r.segments.length),
      width: mode === "real" && span ? round(seconds / span, 4) : 1,
      segments: ((r && r.segments) || []).map((g) => ({ family: g.family, label: g.label, cue: g.cue, quiet: !!g.quiet, from: g.from, to: g.to, x0: round(g.from / scale, 4), x1: round(g.to / scale, 4) })),
      meter: {
        movesPerMinute: s.switchesPerMinute || 0,
        usualHold: s.medianDwell || 0,
        longestHold: round(longest, 1),
        status: status(longest, r && r.limit),
        momentum: round(s.momentum || 0, 1),
      },
    };
  }

  /* Moves of one film as points from 0 to 1. */
  const movesOf = (r) => {
    const len = lenOf(r);
    return len ? ((r.stats && r.stats.moves) || []).map((m) => Object.assign({ p: m.at / len }, m)) : [];
  };

  function holdAt(mine, p) {
    const len = lenOf(mine);
    const t = Math.min(len - 1e-6, p * len);
    const seg = segAt(mine, t);
    const run = runAt(mine, t);
    if (!seg || !run) return null;
    return { t, family: run.family, label: seg.label, held: Math.max(0, t - run.from) };
  }

  function optionsOf(a, b) {
    const opt = (m, who) => ({ family: m.to, cue: m.cue, quiet: !!m.quiet, curiosity: m.curiosity, label: m.label, by: [who] });
    if (a && b && a.to === b.to) {
      const o = opt(a, "a");
      o.by = ["a", "b"];
      if (a.cue !== b.cue) o.cues = [a.cue, b.cue];
      return [o];
    }
    return [a && opt(a, "a"), b && opt(b, "b")].filter(Boolean);
  }

  function sentence(s, names, a, b) {
    const [na, nb] = names;
    const pos = `About ${Math.round(s.p * 100)}% of the way in`;
    const hold = `your film holds on ${famLabel(s.holding.family)} (${s.holding.label}, ${secs(s.holding.held)} so far)`;
    const fam = (o) => famLabel(o.family);
    if (s.agree === "same") return `${pos}, both ${na} and ${nb} move attention to ${fam(s.options[0])} with ${cuePhrase(a)}, while ${hold}. Move it to ${fam(s.options[0])} here with ${cuePhrase(a)}.`;
    if (s.agree === "family") return `${pos}, both ${na} and ${nb} move attention to ${fam(s.options[0])}, ${na} with ${cuePhrase(a)} and ${nb} with ${cuePhrase(b)}, while ${hold}. Move it to ${fam(s.options[0])} here, with either cue.`;
    if (s.agree === "split") {
      const oa = s.options.find((o) => o.by[0] === "a");
      const ob = s.options.find((o) => o.by[0] === "b");
      return `${pos}, ${na} moves attention to ${famLabel(a.to)} with ${cuePhrase(a)} and ${nb} moves it to ${famLabel(b.to)} with ${cuePhrase(b)}, while ${hold}. They disagree, so ${oa && ob ? `here are both: try ${fam(oa)} or ${fam(ob)}.` : `try ${fam(oa || ob)} (your film already holds on the other one).`}`;
    }
    const m = a || b;
    const who = a ? na : nb;
    const other = a ? nb : na;
    return `${pos}, ${who} moves attention to ${famLabel(m.to)} with ${cuePhrase(m)} (${other} does not move here), while ${hold}. Try ${famLabel(m.to)} here.`;
  }

  function blend(readings, opts) {
    const [ra, rb, mine] = readings;
    const o = opts || {};
    const max = o.max || 5;
    const names = (o.names || []).slice(0, 2).concat(["A", "B"].slice((o.names || []).length));
    const lenMine = lenOf(mine);
    if (!lenMine || !mine.segments || !mine.segments.length) return [];
    const ma = movesOf(ra);
    const mb = movesOf(rb);
    const mm = movesOf(mine);
    const lim = mine.limit || 20;
    const step = mine.beats ? lenMine / mine.beats : 3;
    const candidates = [];
    const make = (a, b, w) => {
      const p = a && b ? (a.p + b.p) / 2 : (a || b).p;
      if (p <= 0 || p >= 1) return;
      if (mm.some((m) => Math.abs(m.p - p) <= w)) return;
      const holding = holdAt(mine, p);
      if (!holding) return;
      const raw = optionsOf(a, b);
      const options = raw.filter((x) => x.family !== holding.family);
      if (!options.length) return;
      const agree = !(a && b) ? "one" : raw.length === 1 ? (raw[0].cues ? "family" : "same") : "split";
      const beat = Math.max(0, Math.min((mine.beats || 1) - 1, Math.floor(holding.t / step)));
      const s = { p: round(p, 3), t: round(holding.t, 1), beat, row: o.rows ? o.rows[beat] : null, together: !!(a && b), agree, holding: { family: holding.family, label: holding.label, held: round(holding.held, 1) }, options, w };
      s.score = (s.together ? 2 : 0) + (agree === "same" || agree === "family" ? 1 : 0) + Math.min(2, holding.held / lim);
      s.text = sentence(s, names, a, b);
      candidates.push(s);
    };
    const chosen = [];
    const fits = (s) => !chosen.some((c) => Math.abs(c.p - s.p) < Math.max(c.w, s.w));
    WINDOWS.forEach((w) => {
      if (chosen.length >= 3) return;
      const pairs = [];
      ma.forEach((a) => mb.forEach((b) => Math.abs(a.p - b.p) <= w && pairs.push([a, b, Math.abs(a.p - b.p)])));
      pairs.sort((x, y) => x[2] - y[2]);
      const usedA = new Set();
      const usedB = new Set();
      candidates.length = 0;
      pairs.forEach(([a, b]) => {
        if (usedA.has(a) || usedB.has(b)) return;
        usedA.add(a);
        usedB.add(b);
        make(a, b, w);
      });
      candidates.sort((x, y) => y.score - x.score).forEach((s) => chosen.length < max && fits(s) && chosen.push(s));
    });
    if (chosen.length < 3) {
      candidates.length = 0;
      const w = WINDOWS[0];
      ma.forEach((a) => make(a, null, w));
      mb.forEach((b) => make(null, b, w));
      candidates.sort((x, y) => y.score - x.score).forEach((s) => chosen.length < 3 && fits(s) && chosen.push(s));
    }
    return chosen
      .sort((x, y) => x.p - y.p)
      .map((s, i) => {
        const out = Object.assign({ id: "b" + i }, s);
        delete out.w;
        delete out.score;
        return out;
      });
  }

  function three(readings, opts) {
    const o = opts || {};
    const mode = o.mode === "real" ? "real" : "same";
    const list = ROLES.map((_, i) => (readings || [])[i] || null);
    const span = Math.max(0, ...list.map(lenOf));
    const names = o.names || ["Inspiration A", "Inspiration B", "Your film"];
    return {
      mode,
      span,
      films: list.map((r, i) => filmOf(r, ROLES[i], names[i], mode, span)),
      blend: blend(list, Object.assign({}, o, { names })),
    };
  }

  /* The shared cursor: what holds attention in each film at point f of the ribbon. */
  function at(readings, f, opts) {
    const o = opts || {};
    const mode = o.mode === "real" ? "real" : "same";
    const names = o.names || ["Inspiration A", "Inspiration B", "Your film"];
    const list = ROLES.map((_, i) => (readings || [])[i] || null);
    const span = Math.max(0, ...list.map(lenOf));
    f = Math.max(0, Math.min(1, Number(f) || 0));
    return list.map((r, i) => {
      const name = names[i];
      const len = lenOf(r);
      const base = { role: ROLES[i], name };
      if (!len || !r.segments || !r.segments.length) return Object.assign(base, { t: 0, ended: true, text: `${name}: nothing holds attention yet.` });
      const t = mode === "real" ? f * span : f * len;
      if (t > len + 1e-9) return Object.assign(base, { t: round(t, 1), ended: true, text: `${name} has ended by ${clock(t)} (it runs ${clock(len)}).` });
      const tt = Math.min(t, len - 1e-6);
      const seg = segAt(r, tt);
      const run = runAt(r, tt);
      const held = run ? Math.max(0, tt - run.from) : 0;
      const st = status(held, r.limit);
      const first = seg === r.segments[0];
      const how = first ? "since the start" : `brought by ${cuePhrase(seg)}`;
      return Object.assign(base, {
        t: round(t, 1),
        ended: false,
        family: seg.family,
        label: seg.label,
        cue: first ? null : seg.cue,
        quiet: !!seg.quiet,
        held: round(held, 1),
        status: st,
        text: `${name}, at ${clock(t)} (${Math.round((t / len) * 100)}% in): ${seg.label} holds attention (${famLabel(seg.family)}), ${how}, ${secs(held)} on ${famLabel(seg.family)} so far.`,
      });
    });
  }

  /* ---------- the tab ---------- */
  const KEY = "curiosities-momentum-three-v1";
  const COLORS = { feeling: "#2a78d6", plot: "#eb6834", voice: "#1baf7a", comedy: "#eda100", movement: "#e87ba4", music: "#008300", camera: "#4a3aa7", place: "#e34948" };
  const OTHER = "#a8a39a";
  const colorOf = (f) => COLORS[f] || OTHER;
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const shortName = (s) => String(s || "").replace(/^Model scene:\s*/i, "").replace(/\s*\(made-up practice scene\)$/, "");
  function loadOwn() {
    let p = null;
    try {
      p = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    p = p && typeof p === "object" ? p : {};
    return { a: p.a || "", b: p.b || "", mine: p.mine || "", mode: p.mode === "real" ? "real" : "same" };
  }
  function saveOwn(o) {
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {}
  }
  let flash = "";
  let cursorF = null;

  function picks(ctx, own) {
    const list = ctx.sources();
    const has = (id) => list.some((s) => s.id === id);
    const studies = list.filter((s) => s.id.startsWith("study:"));
    const a = has(own.a) ? own.a : (studies[0] || list[0] || { id: "" }).id;
    const b = has(own.b) ? own.b : (studies.find((s) => s.id !== a) || list.find((s) => s.id !== a) || { id: a }).id;
    const mine = has(own.mine) ? own.mine : (list.find((s) => s.id === "engine") || list.find((s) => s.id === "board") || studies[2] || list[0] || { id: "" }).id;
    return { list, a, b, mine };
  }
  const picker = (ctx, attr, value) => ctx.sourcePicker(attr).replace(/<option value="([^"]*)"( selected)?>/g, (m0, val) => `<option value="${val}"${val === value ? " selected" : ""}>`);

  function ribbonHtml(film, i, mode) {
    const segs = film.segments
      .map((g, k) => {
        const w = Math.max(0.2, (g.x1 - g.x0) * 100);
        return `<i class="m3-seg" style="left:${(g.x0 * 100).toFixed(2)}%;width:${w.toFixed(2)}%;background:${colorOf(g.family)}" title="${esc(g.label)} (${esc(famLabel(g.family))}), ${clock(g.from)} to ${clock(g.to)}${k ? `, brought by ${esc(cuePhrase(g))}` : ""}"></i>`;
      })
      .join("");
    const ended = mode === "real" && film.width < 1 ? `<i class="m3-ended" style="left:${(film.width * 100).toFixed(2)}%" title="This film has ended"></i>` : "";
    return `<div class="m3-rib" data-m3-rib="${i}" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${esc(film.name)}: point or tap to read every film at the same point">${segs}${ended}<i class="m3-cur" hidden></i></div>`;
  }
  function numsHtml(film) {
    const m = film.meter;
    const t = (v, l) => `<div class="m3-num"><b>${v}</b><span>${l}</span></div>`;
    return `<div class="m3-nums">${t(m.movesPerMinute, "moves a minute")}${t(m.usualHold + " s", "usual hold")}${t(`${m.longestHold} s <span class="mo-status mo-${m.status.cls}">${m.status.icon} ${m.status.text}</span>`, "longest hold")}${t(m.momentum.toFixed(1) + " <small>of 5</small>", "momentum")}</div>`;
  }
  const BADGE = { a: "A", b: "B", mine: "You" };
  const ROLE_LABEL = { a: "Inspiration A", b: "Inspiration B", mine: "Your film" };

  function mountTab(el, ctx) {
    const own = loadOwn();
    const pk = picks(ctx, own);
    const label = (id) => shortName((pk.list.find((s) => s.id === id) || { label: id }).label);
    const ids = [pk.a, pk.b, pk.mine];
    const names = ids.map((id, i) => (i === 2 && id === "engine" ? "My film" : label(id).replace(/\s*\(\d+ (moments|panels|scenes)\)$/, "")));
    const readings = ids.map((id) => ctx.readSource(id));
    const ME = root.CurioMomentumEngine;
    const isEngine = pk.mine === "engine" && ME && ME.available();
    const rows = isEngine ? ctx.beatsOf("engine").map((b) => b.row) : null;
    const res = three(readings, { mode: own.mode, names, rows });
    const fams = [...new Set(res.films.reduce((a, f) => a.concat(f.segments.map((g) => g.family)), []))];
    const legend = fams.map((f) => `<li><i style="background:${colorOf(f)}"></i>${esc(famLabel(f))}</li>`).join("");
    const ticks = [];
    if (own.mode === "real" && res.span) {
      const s = res.span;
      const stp = s > 1800 ? 300 : s > 600 ? 60 : s > 120 ? 30 : s > 40 ? 10 : 5;
      for (let t = 0; t <= s + 1e-9; t += stp) ticks.push(`<span style="left:${((t / s) * 100).toFixed(2)}%">${clock(t)}</span>`);
    } else [0, 25, 50, 75, 100].forEach((p) => ticks.push(`<span style="left:${p}%">${p === 0 ? "start" : p === 100 ? "end" : p + "%"}</span>`));
    const films = res.films
      .map(
        (f, i) => `<div class="m3-film m3-${f.role}">
          <div class="m3-film-h"><span class="m3-badge">${BADGE[f.role]}</span><span class="m3-name">${esc(f.name)}</span><small>${clock(f.seconds)} long</small></div>
          ${f.empty ? `<p class="mo-empty">${pk[["a", "b", "mine"][i]] === "live" ? "Play or perform My film to read it." : "Nothing holds attention in this film yet."}</p>` : ribbonHtml(f, i, own.mode)}
          ${f.empty ? "" : numsHtml(f)}
        </div>`
      )
      .join("");
    const blendItems = res.blend
      .map((s, i) => {
        const btns = isEngine && s.row != null ? s.options.map((o, k) => `<button type="button" data-m3-move="${i}:${k}">Make this move here${s.options.length > 1 ? `: ${esc(famLabel(o.family))}` : ""}</button>`).join("") : "";
        const fam = s.options.map((o) => `<span class="mo-fam"><i style="background:${colorOf(o.family)}"></i>${esc(famLabel(o.family))}</span>`).join(" or ");
        const tag = s.together ? (s.agree === "split" ? "The two films disagree" : "Both films agree") : "One film's move";
        return `<li class="m3-sugg" data-m3-p="${s.p}"><div class="m3-sugg-h"><b>${clock(s.t)} in your film</b> <small>(${Math.round(s.p * 100)}% in)</small> ${fam} <span class="mo-badge">${tag}</span></div><p>${esc(s.text)}</p>${btns ? `<div class="m3-btns">${btns}</div>` : ""}</li>`;
      })
      .join("");
    el.innerHTML = `<div class="m3">${flash ? `<div class="mo-flash" role="status">${esc(flash)}</div>` : ""}
      <p class="mo-lede">Two films that inspire you and your own film, one above the other, so you can borrow from both. Each ribbon shows which kind of curiosity holds attention, from start to end. Point at or tap any ribbon: a line shows the same point in all three films, and the lines of text below say what holds attention there.</p>
      <div class="mo-controls m3-controls">
        <label>Inspiration A ${picker(ctx, 'data-m3-pick="a"', pk.a)}</label>
        <label>Inspiration B ${picker(ctx, 'data-m3-pick="b"', pk.b)}</label>
        <label>Your film ${picker(ctx, 'data-m3-pick="mine"', pk.mine)}</label>
        <div class="m3-mode" role="group" aria-label="How the ribbons line up"><button type="button" data-m3-mode="same" aria-pressed="${own.mode === "same"}">Same length</button><button type="button" data-m3-mode="real" aria-pressed="${own.mode === "real"}">Real time</button></div>
      </div>
      <p class="mo-small">${own.mode === "same" ? "Same length: every ribbon is stretched to the full width, so the same point is the same share of the way through each film." : "Real time: one clock for all three, so a shorter film ends early (the striped part is after it ends)."}</p>
      <div class="m3-stack">${films}<div class="m3-ticks" aria-hidden="true">${ticks.join("")}</div><i class="m3-cross" aria-hidden="true" hidden></i></div>
      <ul class="mo-legend m3-legend">${legend}</ul>
      <div class="m3-read" aria-live="polite"><p class="mo-small">Point at or tap a ribbon to read all three films at the same point.</p></div>
      <section><h3>Blend</h3>
        <p class="mo-small">Where both films move attention at about the same point and your film holds still, here is that move for your film, with the cue they use. When the two films move to different kinds of curiosity, both are offered.${isEngine ? " Make this move here changes one curiosity of that kind by one notch at that moment, and Undo takes it back." : pk.mine === "live" || pk.mine === "board" ? " Pick the engine's timeline as Your film to make these moves on My film." : ""}</p>
        ${res.blend.length ? `<ol class="m3-blend">${blendItems}</ol>` : `<p class="mo-small"><span class="mo-status mo-good">●</span> Nothing to borrow here: wherever both films move attention, your film moves too (or a film is still empty).</p>`}
      </section></div>`;
    wire(el, ctx, own, res, readings, names);
  }

  function wire(el, ctx, own, res, readings, names) {
    flash = "";
    el.querySelectorAll("[data-m3-pick]").forEach((s) =>
      s.addEventListener("change", () => {
        own[s.dataset.m3Pick] = s.value;
        saveOwn(own);
        ctx.refresh();
      })
    );
    el.querySelectorAll("[data-m3-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        own.mode = b.dataset.m3Mode;
        saveOwn(own);
        ctx.refresh();
      })
    );
    const read = el.querySelector(".m3-read");
    const ribs = [...el.querySelectorAll(".m3-rib")];
    function show(f) {
      cursorF = f;
      ribs.forEach((r) => {
        const c = r.querySelector(".m3-cur");
        c.hidden = false;
        c.style.left = (f * 100).toFixed(2) + "%";
        r.setAttribute("aria-valuenow", String(Math.round(f * 100)));
      });
      /* One thin line joining the three cursors, across the numbers between the ribbons. */
      const stack = el.querySelector(".m3-stack");
      const cross = stack && stack.querySelector(".m3-cross");
      if (cross && ribs.length > 1) {
        const s = stack.getBoundingClientRect();
        const a = ribs[0].getBoundingClientRect();
        const z = ribs[ribs.length - 1].getBoundingClientRect();
        cross.hidden = false;
        cross.style.left = (a.left - s.left + f * a.width).toFixed(1) + "px";
        cross.style.top = (a.top - s.top).toFixed(1) + "px";
        cross.style.height = (z.bottom - a.top).toFixed(1) + "px";
      }
      const lines = at(readings, f, { mode: own.mode, names });
      read.innerHTML = `<ul class="m3-lines">${lines
        .map((l) => `<li class="m3-${l.role}"><span class="m3-badge">${BADGE[l.role]}</span><span>${l.ended ? "" : `<i class="mo-key" style="background:${colorOf(l.family)}"></i>`}${esc(l.text)}${l.ended || !l.status ? "" : ` <span class="mo-status mo-${l.status.cls}">${l.status.icon} ${l.status.text}</span>`}</span></li>`)
        .join("")}</ul>`;
    }
    const fx = (r, ev) => {
      const b = r.getBoundingClientRect();
      return Math.max(0, Math.min(1, (ev.clientX - b.left) / (b.width || 1)));
    };
    ribs.forEach((r) => {
      r.addEventListener("pointermove", (ev) => show(fx(r, ev)));
      r.addEventListener("pointerdown", (ev) => show(fx(r, ev)));
      r.addEventListener("keydown", (ev) => {
        const d = ev.key === "ArrowRight" ? 0.02 : ev.key === "ArrowLeft" ? -0.02 : ev.key === "Home" ? -1 : ev.key === "End" ? 1 : 0;
        if (!d) return;
        ev.preventDefault();
        show(Math.max(0, Math.min(1, (cursorF == null ? 0 : cursorF) + d)));
      });
    });
    if (cursorF != null && ribs.length) show(cursorF);
    el.querySelectorAll("[data-m3-move]").forEach((b) =>
      b.addEventListener("click", () => {
        const [i, k] = b.dataset.m3Move.split(":").map(Number);
        const s = res.blend[i];
        const o = s && s.options[k];
        const ME = root.CurioMomentumEngine;
        const mv = ME && s && o ? ME.moveAt({ family: o.family, curiosity: o.curiosity }, s.row) : null;
        if (!mv) flash = `There is nothing of ${o ? famLabel(o.family) : "that kind"} to change at that moment on the engine.`;
        else {
          const rep = ME.applyMove(mv);
          flash = rep && rep.ok === false ? `The engine said no: ${rep.error || "it could not make the change"}.` : `Changed ${mv.label} to "${mv.value}" at ${clock(s.t)}, so attention moves to ${famLabel(o.family)} there. Undo takes it back.`;
        }
        const keep = flash;
        ctx.refresh();
        if (!el.querySelector(".mo-flash")) {
          const f = document.createElement("div");
          f.className = "mo-flash";
          f.setAttribute("role", "status");
          f.textContent = keep;
          const box = el.querySelector(".m3");
          if (box) box.prepend(f);
        }
      })
    );
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "three", label: "Three films", after: "end", group: "see", mount: mountTab });
  }

  const api = { three, at, blend, status, WINDOWS, addTab };
  root.CurioThree = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
