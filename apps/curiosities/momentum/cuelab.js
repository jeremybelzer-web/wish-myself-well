/* momentum/cuelab.js: the "Cue lab" tab. Jeremy's question: in the films he loves, exactly which action or
   non-action (a visual, audio, thought, movement or plot cue, or something stopping) moves attention from one
   kind of curiosity to the next, and how fast. This lab puts every curated film that has a trace side by side
   with My film. It reads each one with attention.js (stats.moves, the same counts as "How attention moves")
   and never makes up a number: a film with only Claude's estimate is listed as "no trace yet".

   What it shows
   1. A table, film by film: each cue's share of the moves, and how many moves were a stop (a quiet cue: the
      music cuts out, a silence, someone goes still) against an action. My film's row is marked.
   2. "Your film versus your favorites": for each cue, whether My film uses it much less, about the same or much
      more than the average of the films picked to compare with (the same 0.75 and 1.33 lines as
      CurioRates.compare), in plain sentences.
   3. "Steal this move": the 5 moves from one family to another that the curated films make most and My film
      never makes, each with the cue they use. On the engine's film, "Make this move here" changes one
      curiosity of that family by one notch where attention has held longest (CurioMomentumEngine.moveAt and
      applyMove: one undo step).
   4. How fast attention moves in each film (moves a minute), as a bar chart.

   window.CurioCueLab
   - lab(readings, opts) -> { rows, mine, noTrace, versus, steal, hold, cues } (pure, works in Node)
       readings: [{ id, title, reading (a CurioAttention reading), mine?: true }] or { id, title, estimate: true }
       for a film with no trace. opts: { profiles (the films picked to compare with), beats (My film's beats,
       for the moment to make a move), secondsPerBeat, top: 5 }
   - cueSharesOf(profile) the cue share of moves in a profile (measured: from its moves; estimate: cueShare)
   - LOW, HIGH (0.75, 1.33), addTab() */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const M = () => root.CurioMomentum;
  const CUES = ["visual", "audio", "thought", "movement", "plot"];
  const LOW = 0.75;
  const HIGH = 1.33;
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);

  function seconds(at) {
    if (typeof at === "number" && isFinite(at)) return at;
    if (typeof at !== "string") return null;
    const t = at.trim();
    if (!/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null;
    return t.split(":").reduce((s, p) => s * 60 + Number(p), 0);
  }
  /* Beat times the way attention.js works them out (given, else evenly spaced, never going backwards). */
  function beatTimes(list, step) {
    let t = 0;
    return list.map((b, i) => {
      const s = seconds(b.at);
      t = s != null && s >= t ? s : i === 0 ? 0 : t + step;
      return t;
    });
  }
  const famLabel = (f) => (M() && M().family(f) ? M().family(f).label : f);
  const cueWord = (c) => String(c || "").toLowerCase();
  const aCue = (c) => (/^[aeiou]/.test(cueWord(c)) ? "an " : "a ") + cueWord(c);
  function clock(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  /* One film's row: each cue's share of the moves, stops against actions, moves a minute. */
  function rowOf(r) {
    const st = r.reading.stats;
    const moves = st.moves || [];
    const cues = {};
    CUES.forEach((c) => (cues[c] = { n: 0, share: 0 }));
    let quiet = 0;
    moves.forEach((m) => {
      if (!cues[m.cue]) cues[m.cue] = { n: 0, share: 0 };
      cues[m.cue].n++;
      if (m.quiet) quiet++;
    });
    Object.values(cues).forEach((c) => (c.share = moves.length ? round(c.n / moves.length, 3) : 0));
    const secs = r.reading.seconds || 0;
    return {
      id: r.id,
      title: r.title,
      mine: !!r.mine,
      moves: moves.length,
      cues,
      quiet,
      action: moves.length - quiet,
      quietShare: moves.length ? round(quiet / moves.length, 3) : 0,
      perMinute: secs > 0 ? round((moves.length / secs) * 60, 1) : 0,
      seconds: round(secs, 1),
      moveCues: st.moveCues || {},
      runs: st.familyRuns || [],
    };
  }

  /* The cue share of moves in one compare-with profile: a measured one from its moves, an estimate from its
     cue shares (which is all an estimate has). */
  function cueSharesOf(p) {
    const out = {};
    CUES.forEach((c) => (out[c] = 0));
    let total = 0;
    Object.values((p && p.moveCues) || {}).forEach((row) =>
      Object.values(row).forEach((cell) =>
        Object.entries(cell.cues || {}).forEach(([c, n]) => {
          out[c] = (out[c] || 0) + n;
          total += n;
        })
      )
    );
    if (total) {
      Object.keys(out).forEach((c) => (out[c] = round(out[c] / total, 3)));
      return { shares: out, estimate: false };
    }
    const cs = (p && p.cueShare) || {};
    Object.keys(cs).forEach((c) => (out[c] = cs[c] || 0));
    return { shares: out, estimate: !!(p && p.estimate), none: !Object.keys(cs).length };
  }

  function versus(mine, profiles) {
    const list = (profiles || []).map(cueSharesOf).filter((x) => !x.none);
    if (!list.length) return { cues: [], films: 0, estimate: false, text: "Pick films to compare with in Attention to see this." };
    const avg = {};
    CUES.forEach((c) => (avg[c] = round(list.reduce((a, x) => a + (x.shares[c] || 0), 0) / list.length, 3)));
    const estimate = list.some((x) => x.estimate);
    if (!mine || !mine.moves) return { cues: [], films: list.length, estimate, avg, text: "Attention never moves from one kind of curiosity to another in your film yet, so there is nothing to compare." };
    const cues = CUES.map((c) => {
      const m = mine.cues[c] ? mine.cues[c].share : 0;
      const t = avg[c];
      const word = cueWord(c);
      const nums = `${Math.round(m * 100)}% of your moves against about ${Math.round(t * 100)}% of theirs`;
      let verdict;
      let text;
      if (!t && !m) {
        verdict = "none";
        text = `Neither your film nor your favorites move attention with ${aCue(c)} cue.`;
      } else if (!t) {
        verdict = "more";
        text = `You use ${word} cues much more than your favorites, which never use them: ${nums}.`;
      } else {
        const ratio = round(m / t, 3);
        verdict = ratio < LOW ? "less" : ratio > HIGH ? "more" : "same";
        text =
          verdict === "less"
            ? `You use ${word} cues much less than your favorites: ${nums}.${m ? "" : " Try moving attention with one."}`
            : verdict === "more"
            ? `You use ${word} cues much more than your favorites: ${nums}.`
            : `You use ${word} cues about as much as your favorites: ${nums}.`;
      }
      return { cue: c, mine: m, theirs: t, verdict, text };
    });
    return { cues, films: list.length, estimate, avg };
  }

  /* Where attention has held longest in My film: the longest stretch of one family, and the beat in the middle
     of it, so a change there breaks it up. */
  function holdOf(mine, beats, step) {
    if (!mine || !mine.runs.length) return null;
    const run = mine.runs.slice().sort((a, b) => b.dur - a.dur || a.from - b.from)[0];
    const list = (beats || []).filter((b) => b && b.values && typeof b.values === "object");
    const times = beatTimes(list, step || 3);
    const mid = run.from + run.dur / 2;
    let best = -1;
    times.forEach((t, i) => {
      if (t > run.from && t < run.to && (best < 0 || Math.abs(t - mid) < Math.abs(times[best] - mid))) best = i;
    });
    if (best < 0) best = Math.max(0, times.findIndex((t) => t >= run.from));
    const b = list[best];
    return { family: run.family, from: run.from, to: run.to, dur: round(run.dur, 1), at: times[best] != null ? times[best] : run.from, beat: best, row: b && b.row != null ? b.row : null };
  }

  /* The curiosity to make a move with: one of that family, on the cue the films use, pushing the story hardest. */
  function curiosityFor(family, cue) {
    const all = M() && M().all ? M().all() : [];
    const S = root.CurioScale;
    const ok = (n) => n.family === family && (!S || !S.known || S.known(n.id));
    const rank = (a, b) => b.push - a.push + ((b.source === "workspace" ? 0 : 0.5) - (a.source === "workspace" ? 0 : 0.5));
    const same = all.filter((n) => ok(n) && n.cue === cue).sort(rank);
    const any = all.filter(ok).sort(rank);
    const n = same[0] || any[0];
    return n ? { id: n.id, label: n.label } : null;
  }

  function steal(rows, mine, opts) {
    const theirs = rows.filter((r) => !r.mine);
    const cells = {};
    theirs.forEach((r) =>
      Object.entries(r.moveCues).forEach(([a, row]) =>
        Object.entries(row).forEach(([b, c]) => {
          const k = a + ">" + b;
          const cell = (cells[k] = cells[k] || { from: a, to: b, n: 0, quiet: 0, cues: {}, films: [] });
          cell.n += c.n || 0;
          cell.quiet += c.quiet || 0;
          Object.entries(c.cues || {}).forEach(([q, v]) => (cell.cues[q] = (cell.cues[q] || 0) + v));
          if (!cell.films.includes(r.title)) cell.films.push(r.title);
        })
      )
    );
    const made = (mine && mine.moveCues) || {};
    return Object.values(cells)
      .filter((c) => c.n && !(made[c.from] && made[c.from][c.to] && made[c.from][c.to].n))
      .sort((a, b) => b.n - a.n || b.films.length - a.films.length || (a.from + a.to).localeCompare(b.from + b.to))
      .slice(0, (opts && opts.top) || 5)
      .map((c) => {
        const [cue, count] = Object.entries(c.cues).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
        const quiet = round(c.quiet / c.n, 2);
        const cur = curiosityFor(c.to, cue);
        const how = quiet >= 0.5 ? `mostly with a stop (a quiet ${cueWord(cue)} cue)` : `mostly with ${aCue(cue)} cue`;
        return {
          from: c.from,
          to: c.to,
          n: c.n,
          films: c.films,
          cue,
          cueShare: round(count / c.n, 2),
          quiet,
          curiosity: cur,
          option: cur ? { family: c.to, curiosity: cur.id, label: famLabel(c.to) } : null,
          text: `From ${famLabel(c.from)} to ${famLabel(c.to)}: ${c.n} time${c.n === 1 ? "" : "s"} in ${c.films.length} film${c.films.length === 1 ? "" : "s"}, ${how} (${Math.round((count / c.n) * 100)}% of the time). Your film never makes this move.`,
        };
      });
  }

  function lab(readings, options) {
    const opts = Object.assign({ top: 5, secondsPerBeat: 3 }, options || {});
    const list = readings || [];
    const noTrace = list.filter((r) => !r.reading).map((r) => ({ id: r.id, title: r.title }));
    const rows = list.filter((r) => r.reading).map(rowOf);
    const mine = rows.find((r) => r.mine) || null;
    const hold = holdOf(mine, opts.beats, opts.secondsPerBeat);
    const st = steal(rows, mine, opts);
    st.forEach((s) => (s.hold = hold));
    return { rows, mine, noTrace, versus: versus(mine, opts.profiles), steal: st, hold, cues: CUES.slice() };
  }

  /* ---------- the tab ---------- */
  /* Family colors come from notes.js (CurioMomentum.mark), the same on every tab. */
  const famColor = (f) => M().mark(f).color;
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const pct = (x) => Math.round((x || 0) * 100) + "%";
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const shortName = (label) => String(label || "").replace(/^Model scene:\s*/, "").replace(/\s*\(made-up practice scene\)$/, "");
  const fam = (f) => `<span class="mo-fam"><i style="background:${famColor(f)}"></i>${esc(famLabel(f))}</span>`;
  let flash = "";

  /* Gather the films: My film, every study with a trace, and the estimated films with no trace. */
  function gather(ctx, src) {
    const sources = ctx.sources();
    const mineSrc = sources.find((s) => s.id === src);
    const out = [{ id: src, title: "Your film: " + shortName(mineSrc ? mineSrc.label : "My film"), reading: ctx.readSource(src), mine: true }];
    const studies = sources.filter((s) => s.id.startsWith("study:") && s.id !== src);
    studies.forEach((s) => {
      const r = ctx.readSource(s.id);
      if (r && r.beats) out.push({ id: s.id, title: shortName(s.label), reading: r });
    });
    const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const titles = studies.map((s) => norm(shortName(s.label)));
    const R = root.CurioRates;
    ((R && R.DEFAULT_FILMS) || []).forEach((p) => {
      if (!titles.some((t) => t.includes(norm(p.title)))) out.push({ id: p.id, title: p.title, estimate: true });
    });
    return out;
  }

  function tableHtml(res) {
    const head = res.cues.map((c) => `<th>${esc(cap(c))}</th>`).join("");
    const body = res.rows
      .map((r) => {
        const cells = res.cues.map((c) => `<td>${r.moves ? `${pct(r.cues[c].share)} <small>(${r.cues[c].n})</small>` : "none"}</td>`).join("");
        return `<tr class="${r.mine ? "mcl-me" : ""}"><th scope="row">${r.mine ? '<span class="mo-badge mo-badge-m">Your film</span> ' : ""}${esc(r.mine ? r.title.replace(/^Your film: /, "") : r.title)}</th><td>${r.moves}</td>${cells}<td>${r.quiet} <small>(${pct(r.quietShare)})</small></td><td>${r.action}</td></tr>`;
      })
      .join("");
    return `<div class="mo-scroll"><table class="mo-rates mcl-table"><thead><tr><th>Film</th><th>Moves</th>${head}<th>Stops</th><th>Actions</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function chartHtml(res) {
    const rows = res.rows;
    const max = Math.max(1, ...rows.map((r) => r.perMinute));
    const W = 360;
    const lane = 34;
    const H = rows.length * lane + 4;
    const bars = rows
      .map((r, i) => {
        const y = i * lane;
        const w = Math.max(r.perMinute ? 2 : 0, ((W - 100) * r.perMinute) / max);
        const name = r.mine ? "Your film" : r.title;
        return `<g><text x="0" y="${y + 12}" class="mcl-bar-name${r.mine ? " mcl-bar-me" : ""}">${esc(name.length > 54 ? name.slice(0, 52) + "..." : name)}</text><rect x="0" y="${y + 16}" width="${round(w, 1)}" height="12" rx="2" fill="${r.mine ? "var(--mo-ink)" : "var(--mo-bar)"}"></rect><text x="${round(w + 6, 1)}" y="${y + 26}" class="mcl-bar-v">${r.perMinute} a minute</text></g>`;
      })
      .join("");
    return `<svg class="mcl-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Moves a minute in each film">${bars}</svg>`;
  }

  function mountTab(el, ctx) {
    const sources = ctx.sources();
    let src = ctx.source();
    if (!sources.some((s) => s.id === src)) src = (sources.find((s) => s.id === "engine") || sources[0] || { id: "" }).id;
    const ME = root.CurioMomentumEngine;
    const isEngine = src === "engine" && ME && ME.available();
    const beats = ctx.beatsOf(src);
    const readings = gather(ctx, src);
    const res = lab(readings, { profiles: ctx.profiles(), beats, secondsPerBeat: ctx.secondsPerBeat() });
    /* On the engine's film, the exact change each button makes (moveAt only plans it; nothing changes yet). */
    const moves = res.steal.map((s) => (isEngine && s.option && s.hold && s.hold.row != null ? ME.moveAt(s.option, s.hold.row) : null));
    const picker = ctx.sourcePicker("data-cl-source").replace(/<option value="([^"]*)"( selected)?>/g, (m0, val) => `<option value="${val}"${val === src ? " selected" : ""}>`);
    const curated = res.rows.filter((r) => !r.mine);
    const vs = res.versus;
    const marks = { less: ["mcl-less", "▼", "Much less"], same: ["mcl-same", "●", "About the same"], more: ["mcl-more", "▲", "Much more"], none: ["mcl-same", "○", "Neither"] };
    const vsHtml = vs.cues.length
      ? `<ul class="mcl-vs">${vs.cues.map((c) => `<li><span class="mcl-mark ${marks[c.verdict][0]}">${marks[c.verdict][1]} ${marks[c.verdict][2]}</span> ${esc(c.text)}</li>`).join("")}</ul><p class="mo-small">Compared with the average of ${vs.films} film${vs.films === 1 ? "" : "s"} you picked in Attention.${vs.estimate ? (vs.films === 1 ? " It is Claude's estimate, so this uses its share of cues in the whole film, not only in the moves." : " Some of them are Claude's estimates, so for those this uses the share of cues in the whole film, not only in the moves.") : ""} Much less means under three quarters of theirs, much more means over a third more.</p>`
      : `<p class="mo-empty">${esc(vs.text)}</p>`;
    const stealHtml = res.steal.length
      ? `<ol class="mcl-steal">${res.steal
          .map((s, i) => {
            const where = s.hold ? `at ${clock(s.hold.at)}, where ${famLabel(s.hold.family)} has held attention for ${Math.round(s.hold.dur)} seconds` : "";
            const mv = moves[i];
            const btn = mv ? `<button type="button" data-cl-steal="${i}">Make this move here</button>` : "";
            const how = mv
              ? `Make this move here changes ${esc(mv.label)} to "${esc(mv.value)}" ${esc(where)}.`
              : s.curiosity
              ? `To make it, change ${esc(s.curiosity.label)} (a ${esc(famLabel(s.to))} curiosity).`
              : "";
            return `<li><div class="mcl-steal-head">${fam(s.from)} <span aria-hidden="true">to</span> ${fam(s.to)} <span class="mo-badge">${esc(cap(s.cue))} cue${s.quiet >= 0.5 ? ", a stop" : ""}</span></div>
              <div>${esc(s.text)}</div>
              ${how ? `<div class="mo-small">${how}</div>` : ""}${btn}</li>`;
          })
          .join("")}</ol>${isEngine ? "" : `<p class="mo-small">Pick the engine's timeline as your film to make these moves on My film.</p>`}`
      : `<p class="mo-empty">${curated.length ? "Your film already makes every move the curated films make." : "No curated film has a trace yet."}</p>`;
    const none = res.noTrace.length ? `<p class="mo-small mcl-none"><b>No trace yet</b> (Claude's estimates only, so no numbers here): ${res.noTrace.map((x) => esc(x.title)).join(", ")}. Trace one of them in Library, Curated films, to see it here.</p>` : "";
    el.innerHTML = `<div class="mcl">${flash ? `<div class="mo-flash" role="status">${esc(flash)}</div>` : ""}
      <p class="mo-lede">Which action, or which stop, moves attention from one kind of curiosity to the next in the films you love, and how fast. Every curated film with a trace is read the same way as your film, so the numbers are counted, not guessed.</p>
      <div class="mo-controls"><label>Your film ${picker}</label></div>
      <section><h3>What moves attention, film by film</h3>
        <p class="mo-small">Each cue's share of the moves from one kind of curiosity to another, with the count in brackets. A stop is a move made by something stopping (the music cuts out, a silence falls, someone goes still). An action is a move made by something new happening.</p>
        ${tableHtml(res)}${none}</section>
      <section><h3>Your film versus your favorites</h3>${vsHtml}</section>
      <section><h3>Steal this move</h3><p class="mo-small">The moves the curated films make most that your film never makes, and the cue they use.${isEngine ? " Make this move here changes one curiosity of that kind by one notch where attention has held longest, and one Undo takes it back." : ""}</p>${stealHtml}</section>
      <section><h3>How fast attention moves</h3><p class="mo-small">Moves from one kind of curiosity to another, a minute. Your film is the dark bar.</p>${chartHtml(res)}</section>
    </div>`;
    flash = "";
    const pick = el.querySelector("[data-cl-source]");
    if (pick)
      pick.addEventListener("change", () => {
        ctx.setSource(pick.value);
        ctx.refresh();
      });
    el.querySelectorAll("[data-cl-steal]").forEach((b) =>
      b.addEventListener("click", () => {
        const s = res.steal[Number(b.dataset.clSteal)];
        const mv = moves[Number(b.dataset.clSteal)];
        if (!mv) flash = `There is nothing of ${s ? famLabel(s.to) : "that kind"} to change at that moment on the engine.`;
        else {
          const rep = ME.applyMove(mv);
          flash = rep && rep.ok === false ? `The engine said no: ${rep.error || "it could not make the change"}.` : `Changed ${mv.label} to "${mv.value}" at ${clock(s.hold.at)}. Undo takes it back.`;
        }
        const keep = flash;
        ctx.refresh();
        if (!el.querySelector(".mo-flash")) {
          const f = document.createElement("div");
          f.className = "mo-flash";
          f.setAttribute("role", "status");
          f.textContent = keep;
          const box = el.querySelector(".mcl");
          if (box) box.prepend(f);
        }
      })
    );
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "cuelab", label: "Cue lab", after: "end", mount: mountTab });
  }

  const api = { lab, cueSharesOf, LOW, HIGH, CUES, addTab };
  root.CurioCueLab = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
