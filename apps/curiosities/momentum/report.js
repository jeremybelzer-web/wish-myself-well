/* momentum/report.js: the momentum report. One page about one film, to show other people (an animator, a
   teacher, a class): its title, one plain paragraph, the share of time each family of curiosities held
   attention (a ring), the barometer (how long attention rests on one family now, and the longest hold), the
   momentum curve, the moves of attention that happen most and the cues that make them, the three stretches
   that held attention longest past the limit, and where the Compass says to move attention next. All of it
   is compared with the films picked in the Momentum window.

   Counts and ids only. The report never reads notes someone typed or any script lines: it uses a reading
   from attention.js (segments, stats, warnings), the films' counts, and the curiosity catalog's own words.

   The core is pure and works in Node with no page:

   window.CurioMomentumReport
   - build(reading, profiles, opts) -> the report's data (numbers, slices, moves, warnings, next move, curve)
       reading:  CurioAttention.read(...)
       profiles: films to compare with (CurioRates profiles), may be empty
       opts:     { title, beats (the film's beats, for the momentum curve), secondsPerBeat, made (a date text) }
   - sheetHtml(data) -> the report as HTML (inline SVG charts), the same in the tab, in print and in the file
   - reportHtml(reading, profiles, opts) -> a whole web page, self-contained: inline CSS and SVG, no scripts,
       no links to anything outside the file
   - summaryText(data) -> the summary as plain text (for "Copy the summary")
   - fileName(title) -> a file name for the download
   - addTab() puts the "Report" tab in the Momentum window (CurioMomentumUI.addTab, after: "end"); it runs on
     its own once the window is loaded. */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const A = () => root.CurioAttention;
  const M = () => root.CurioMomentum;
  const R = () => root.CurioRates;
  const CP = () => root.CurioCompass;
  const CV = () => root.CurioCurve;

  /* The same family colors as ui.js: eight have their own, the others share gray as "Other". */
  /* Family colors and the status marks come from notes.js (CurioMomentum.mark, CurioMomentum.status). */
  const colorOf = (f) => M().mark(f).color;
  const round = (n, d) => Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0);
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const pct = (x) => Math.round((x || 0) * 100) + "%";
  const famLabel = (f) => ((M() && M().family(f)) || { label: f || "nothing" }).label;
  const cueLabel = (c) => ((M() && M().CUES.find((x) => x.id === c)) || { label: c || "plot" }).label;
  const clock = (s) => {
    s = Math.max(0, Math.round(s || 0));
    const m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const aOrAn = (w) => (/^[aeiou]/i.test(String(w)) ? "an " : "a ") + w;

  /* Status of a stretch against the limit, as the meter says it: icon plus words, never color alone. */
  const statusOf = (dur, lim) => M().status(dur, lim);

  /* The momentum curve: CurioCurve's own pure function when it is loaded and the beats are given; otherwise a
     simple line from the reading (the push of what holds attention, worn down past the limit). */
  function curveOf(reading, opts) {
    const C = CV();
    if (C && typeof C.curve === "function" && Array.isArray(opts.beats) && opts.beats.length) {
      try {
        const c = C.curve(opts.beats, { secondsPerBeat: opts.secondsPerBeat, limit: reading.limit });
        if (c.points.length) return { from: "curve", seconds: c.seconds, points: c.points.map((p) => ({ t: p.t, value: p.value })), peaks: c.peaks.map((p) => ({ t: p.t, value: p.value, label: p.label })), thirds: c.thirds.map((t) => ({ label: t.label, mean: t.mean })), low: c.low };
      } catch (e) {}
    }
    const segs = reading.segments || [];
    if (!segs.length) return { from: "reading", seconds: 0, points: [], peaks: [], thirds: [], low: 2 };
    const t0 = segs[0].from;
    const total = Math.max(0.001, segs[segs.length - 1].to - t0);
    const runs = reading.stats.familyRuns || [];
    const lim = reading.limit || 20;
    const at = (t) => {
      const s = segs.find((g) => g.from <= t && t < g.to) || segs[segs.length - 1];
      const run = runs.find((r) => r.from <= t && t < r.to) || runs[runs.length - 1];
      const into = run ? t - run.from : 0;
      return s.push * (into <= lim ? 1 : Math.max(0.2, lim / into));
    };
    const n = 120;
    const raw = [];
    for (let i = 0; i <= n; i++) raw.push(at(t0 + Math.min(total - 1e-6, (total * i) / n)));
    const k = Math.max(1, Math.round((n * 10) / total / 2));
    const points = raw.map((_, i) => {
      const part = raw.slice(Math.max(0, i - k), i + k + 1);
      return { t: round((total * i) / n, 2), value: round(part.reduce((a, v) => a + v, 0) / part.length, 2) };
    });
    const thirds = ["Beginning", "Middle", "End"].map((label, i) => {
      const inside = points.filter((p) => p.t >= (total * i) / 3 && (i === 2 ? p.t <= total : p.t < (total * (i + 1)) / 3));
      return { label, mean: inside.length ? round(inside.reduce((a, p) => a + p.value, 0) / inside.length, 2) : null };
    });
    return { from: "reading", seconds: round(total, 2), points, peaks: [], thirds, low: 2 };
  }

  /* Every move of attention from one family to another, grouped: how often, the cue that made it most, how
     often something stopping made it, and which curiosities took attention. */
  function topMoves(stats, n) {
    const groups = {};
    (stats.moves || []).forEach((m) => {
      const k = m.from + ">" + m.to;
      const g = (groups[k] = groups[k] || { from: m.from, to: m.to, n: 0, quiet: 0, cues: {}, by: {} });
      g.n++;
      if (m.quiet) g.quiet++;
      g.cues[m.cue] = (g.cues[m.cue] || 0) + 1;
      g.by[m.curiosity] = g.by[m.curiosity] || { id: m.curiosity, label: m.label, n: 0 };
      g.by[m.curiosity].n++;
    });
    return Object.values(groups)
      .sort((a, b) => b.n - a.n || a.from.localeCompare(b.from) || a.to.localeCompare(b.to))
      .slice(0, n || 5)
      .map((g) => {
        const [cue, k] = Object.entries(g.cues).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
        return {
          from: g.from,
          to: g.to,
          n: g.n,
          cue,
          cueShare: round(k / g.n, 2),
          quietShare: round(g.quiet / g.n, 2),
          by: Object.values(g.by)
            .sort((a, b) => b.n - a.n)
            .slice(0, 2)
            .map((b) => ({ id: b.id, label: b.label })),
        };
      });
  }

  function build(reading, profiles, options) {
    const o = Object.assign({ title: "My film" }, options || {});
    const rd = reading || (A() ? A().read([], {}) : { segments: [], stats: {}, warnings: [], seconds: 0, limit: 20 });
    const s = rd.stats || {};
    const lim = rd.limit || s.limit || 20;
    const list = (profiles || []).filter(Boolean);
    const target = list.length && R() ? R().average(list) : null;
    const runs = s.familyRuns || [];
    const longest = runs.reduce((b, r) => (!b || r.dur > b.dur ? r : b), null);
    const now = s.currentRun || null;
    const shares = Object.entries(s.familyShare || {}).filter(([, v]) => v > 0);
    const named = shares.filter(([f]) => M().COLORS[f]);
    const other = shares.filter(([f]) => !M().COLORS[f]);
    const otherShare = round(other.reduce((a, [, v]) => a + v, 0), 3);
    const slices = named.map(([f, v]) => ({ family: f, label: famLabel(f), share: v, color: colorOf(f) }));
    if (otherShare > 0) slices.push({ family: "other", label: "Other", share: otherShare, color: M().OTHER, families: other.map(([f, v]) => ({ family: f, label: famLabel(f), share: v })) });
    const top = shares.length ? { family: shares[0][0], label: famLabel(shares[0][0]), share: shares[0][1] } : null;
    const warnings = (rd.warnings || [])
      .slice()
      .sort((a, b) => b.dur - a.dur || a.from - b.from)
      .slice(0, 3)
      .map((w) => ({ family: w.family, label: famLabel(w.family), from: round(w.from, 1), dur: round(w.dur, 1), over: round(w.dur - lim, 1) }));
    let next = null;
    if (CP() && (rd.segments || []).length) {
      try {
        const res = CP().point(rd, list);
        const b = res.options[0];
        if (b)
          next = {
            family: b.family,
            label: b.label,
            cue: b.cue,
            reasons: (b.reasons || []).slice(0, 3),
            curiosity: b.note ? b.note.id : b.curiosity,
            tryLabel: b.note ? b.note.label : null,
            tryThis: b.note ? String(b.note.tryThis || "").trim() : null,
            nowSeconds: res.now ? res.now.seconds : null,
          };
      } catch (e) {
        next = null;
      }
    }
    return {
      title: String(o.title || "My film"),
      made: o.made ? String(o.made) : "",
      seconds: round(rd.seconds || 0, 1),
      beats: typeof rd.beats === "number" ? rd.beats : (o.beats || []).length,
      limit: lim,
      empty: !(rd.segments || []).length,
      compare: target ? { title: target.title, estimate: !!target.estimate, n: list.length, titles: list.map((p) => p.title), switchesPerMinute: target.switchesPerMinute, medianDwell: target.medianDwell, medianFamilyRun: target.medianFamilyRun } : null,
      numbers: {
        momentum: round(s.momentum || 0, 1),
        switchesPerMinute: s.switchesPerMinute || 0,
        moves: (s.moves || []).length,
        medianDwell: s.medianDwell || 0,
        medianFamilyRun: s.medianFamilyRun || 0,
        longestDwell: s.longestDwell || 0,
        stretches: s.segments || 0,
        warnings: (rd.warnings || []).length,
        quietShare: s.quietShare || 0,
      },
      top,
      slices,
      barometer: {
        now: now ? { family: now.family, label: famLabel(now.family), seconds: round(now.dur, 1), status: statusOf(now.dur, lim) } : null,
        longest: longest ? { family: longest.family, label: famLabel(longest.family), seconds: round(longest.dur, 1), from: round(longest.from, 1), status: statusOf(longest.dur, lim) } : null,
      },
      curve: curveOf(rd, o),
      moves: topMoves(s, 5),
      warnings,
      next,
    };
  }

  /* ---------------------------------------------------------------- words */
  function summaryParagraph(d) {
    if (d.empty) return `${d.title} has nothing to read yet: no curiosity has taken the audience's attention.`;
    const n = d.numbers;
    const c = d.compare;
    const out = [];
    out.push(`${d.title} lasts ${clock(d.seconds)}, and the audience's attention moves to something new ${n.switchesPerMinute} times a minute${c ? ` (${c.title}${c.estimate ? ", estimated" : ""}: about ${c.switchesPerMinute})` : ""}.`);
    if (d.top) out.push(`${d.top.label} holds attention most, ${pct(d.top.share)} of the time.`);
    const lg = d.barometer.longest;
    if (lg) out.push(`One kind of curiosity usually holds attention for about ${n.medianFamilyRun} seconds in a row; the longest hold is ${Math.round(lg.seconds)} seconds on ${lg.label}, against a limit of ${d.limit} seconds.`);
    out.push(`The momentum reading, how hard what holds attention pushes the story, is ${n.momentum.toFixed(1)} of 5.`);
    out.push(n.warnings ? `${n.warnings === 1 ? "One stretch goes" : n.warnings + " stretches go"} past the limit.` : "No stretch goes past the limit.");
    if (d.next) out.push(`Next, the Compass suggests moving attention to ${d.next.label} with ${aOrAn(cueLabel(d.next.cue).toLowerCase())}.`);
    return out.join(" ");
  }

  function summaryText(d) {
    const lines = [`Momentum report: ${d.title}`, "", summaryParagraph(d)];
    if (!d.empty) {
      const n = d.numbers;
      lines.push("", `Momentum reading: ${n.momentum.toFixed(1)} of 5`, `Moves a minute: ${n.switchesPerMinute}`, `Usual hold on one curiosity: ${n.medianDwell} seconds`, `Longest hold on one kind: ${d.barometer.longest ? Math.round(d.barometer.longest.seconds) + " seconds (" + d.barometer.longest.label + ")" : "none"}`);
      if (d.slices.length) lines.push(`Share of time: ${d.slices.map((x) => `${x.label} ${pct(x.share)}`).join(", ")}`);
      if (d.moves.length) lines.push("", "Moves of attention that happen most:", ...d.moves.map((m) => `- ${famLabel(m.from)} to ${famLabel(m.to)}: ${plural(m.n, "time")}, mostly on ${aOrAn(cueLabel(m.cue).toLowerCase())}`));
      if (d.warnings.length) lines.push("", "Held too long:", ...d.warnings.map((w) => `- ${w.label} held attention for ${Math.round(w.dur)} seconds from ${clock(w.from)}`));
      if (d.next) lines.push("", `Next move: ${d.next.label}, with ${aOrAn(cueLabel(d.next.cue).toLowerCase())}.${d.next.tryLabel ? " Try " + d.next.tryLabel + "." : ""}`);
      if (d.compare) lines.push("", `Compared with: ${d.compare.titles.join(", ")}${d.compare.estimate ? " (includes Claude's estimates, not measurements)" : ""}.`);
    }
    return lines.join("\n");
  }

  /* ---------------------------------------------------------------- charts (inline SVG) */
  function ringSvg(slices) {
    const total = slices.reduce((a, x) => a + x.share, 0) || 1;
    const R0 = 70;
    const R1 = 44;
    let a0 = -Math.PI / 2;
    const p = (r, a) => `${(80 + r * Math.cos(a)).toFixed(2)} ${(80 + r * Math.sin(a)).toFixed(2)}`;
    const arcs = slices
      .map((x) => {
        const sweep = (x.share / total) * Math.PI * 2;
        const a1 = a0 + sweep;
        const large = sweep > Math.PI ? 1 : 0;
        const d =
          sweep >= Math.PI * 2 - 1e-6
            ? `M ${p(R0, 0)} A ${R0} ${R0} 0 1 1 ${p(R0, Math.PI)} A ${R0} ${R0} 0 1 1 ${p(R0, 0)} M ${p(R1, 0)} A ${R1} ${R1} 0 1 0 ${p(R1, Math.PI)} A ${R1} ${R1} 0 1 0 ${p(R1, 0)} Z`
            : `M ${p(R0, a0)} A ${R0} ${R0} 0 ${large} 1 ${p(R0, a1)} L ${p(R1, a1)} A ${R1} ${R1} 0 ${large} 0 ${p(R1, a0)} Z`;
        a0 = a1;
        return `<path d="${d}" fill="${x.color}" stroke="#fffdf8" stroke-width="2"><title>${esc(x.label)}: ${pct(x.share / total)}</title></path>`;
      })
      .join("");
    const top = slices.slice().sort((a, b) => b.share - a.share)[0];
    return `<svg class="mrp-ring" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Share of time on each family. ${esc(slices.map((x) => `${x.label} ${pct(x.share / total)}`).join(", "))}.">${arcs}<text x="80" y="80" text-anchor="middle" font-size="20" font-weight="600" fill="#1c1712">${pct(top.share / total)}</text><text x="80" y="96" text-anchor="middle" font-size="10" fill="#52514e">${esc(top.label)}</text></svg>`;
  }
  function gaugeSvg(seconds, lim, max, st) {
    const W = 300;
    const fill = { good: "#0ca30c", warn: "#fab219", crit: "#d03b3b" }[st.cls];
    const x = (s) => (Math.min(max, Math.max(0, s)) / max) * W;
    return `<svg class="mrp-gauge" viewBox="0 0 ${W} 30" width="${W}" height="30" role="img" aria-label="${Math.round(seconds)} seconds against a ${lim} second limit: ${st.text}"><rect x="0" y="4" width="${W}" height="14" rx="7" fill="#e1e0d9"/><rect x="0" y="4" width="${Math.max(4, x(seconds)).toFixed(1)}" height="14" rx="7" fill="${fill}"/><line x1="${x(lim).toFixed(1)}" x2="${x(lim).toFixed(1)}" y1="1" y2="21" stroke="#1c1712" stroke-width="2"/><text x="${Math.min(W - 2, x(lim) + 4).toFixed(1)}" y="29" font-size="9" fill="#52514e"${x(lim) > W - 60 ? ' text-anchor="end"' : ""}>limit ${lim} s</text></svg>`;
  }
  function curveSvg(c) {
    const W = 720;
    const H = 210;
    const padL = 30;
    const padR = 12;
    const padT = 24;
    const padB = 26;
    const iw = W - padL - padR;
    const ih = H - padT - padB;
    const T = c.seconds || 1;
    const x = (t) => padL + (t / T) * iw;
    const y = (v) => padT + ih - (Math.max(0, Math.min(5, v)) / 5) * ih;
    let g = "";
    for (let v = 0; v <= 5; v++) g += `<line x1="${padL}" x2="${padL + iw}" y1="${y(v)}" y2="${y(v)}" stroke="#e1e0d9"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#6b6862">${v}</text>`;
    g += `<line x1="${padL}" x2="${padL + iw}" y1="${y(c.low)}" y2="${y(c.low)}" stroke="#d03b3b" stroke-dasharray="2 3" opacity="0.7"/>`;
    const thirds = c.thirds.map((th, i) => `${i ? `<line x1="${x((T * i) / 3)}" x2="${x((T * i) / 3)}" y1="${padT - 16}" y2="${padT + ih}" stroke="#52514e" stroke-dasharray="4 3" opacity="0.5"/>` : ""}<text x="${x((T * (i + 0.5)) / 3)}" y="${padT - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="#52514e">${esc(th.label)}${th.mean != null ? " " + th.mean : ""}</text>`).join("");
    const ticks = [0, T / 3, (2 * T) / 3, T].map((t, i) => `<text x="${x(t)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === 3 ? "end" : "middle"}" font-size="11" fill="#6b6862">${clock(t)}</text>`).join("");
    const line = c.points.map((p, i) => (i ? "L" : "M") + x(p.t).toFixed(1) + " " + y(p.value).toFixed(1)).join("");
    const area = line + `L${x(c.points[c.points.length - 1].t).toFixed(1)} ${y(0)}L${x(c.points[0].t).toFixed(1)} ${y(0)}Z`;
    const peaks = c.peaks.map((p) => `<path d="M${x(p.t).toFixed(1)} ${(y(p.value) - 6).toFixed(1)} l-5 -8 h10 z" fill="#2a78d6"><title>Surge at ${clock(p.t)}: ${p.value} of 5</title></path>`).join("");
    return `<svg class="mrp-curve" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Momentum over the film, from 0 (stalled) to 5 (surging). Average by third: ${esc(c.thirds.map((t) => `${t.label.toLowerCase()} ${t.mean}`).join(", "))}.">${g}${thirds}${ticks}<path d="${area}" fill="#2a78d6" opacity="0.1"/><path d="${line}" fill="none" stroke="#2a78d6" stroke-width="2.5" stroke-linejoin="round"/>${peaks}</svg>`;
  }

  /* ---------------------------------------------------------------- the sheet */
  function sheetHtml(d) {
    const n = d.numbers;
    const c = d.compare;
    const head = `<header class="mrp-head"><div class="mrp-kicker">Momentum report</div><h1>${esc(d.title)}</h1>
      <p class="mrp-meta">${clock(d.seconds)} long · ${plural(d.beats, "moment")} · limit ${d.limit} seconds on one kind of curiosity${c ? ` · compared with ${esc(c.titles.join(", "))}` : ""}${d.made ? ` · ${esc(d.made)}` : ""}</p></header>`;
    if (d.empty) return `<article class="mrp-sheet">${head}<p class="mrp-summary">${esc(summaryParagraph(d))}</p>${footer(d)}</article>`;
    const tile = (v, l, sub) => `<div class="mrp-tile"><div class="mrp-tile-v">${v}</div><div class="mrp-tile-l">${l}</div>${sub ? `<div class="mrp-tile-s">${sub}</div>` : ""}</div>`;
    const tiles = `<div class="mrp-tiles">
      ${tile(`${n.momentum.toFixed(1)} <small>of 5</small>`, "Momentum reading", "How hard what holds attention pushes the story")}
      ${tile(n.switchesPerMinute, "Moves a minute", c ? `${esc(c.title)}: about ${c.switchesPerMinute}` : "")}
      ${tile(`${n.medianDwell} s`, "Usual hold", c ? `${esc(c.title)}: about ${c.medianDwell} s` : "On one curiosity")}
      ${tile(`${d.barometer.longest ? Math.round(d.barometer.longest.seconds) : 0} s`, "Longest hold", "On one kind of curiosity")}
    </div>`;
    const legend = `<ul class="mrp-legend">${d.slices.map((x) => `<li><i style="background:${x.color}"></i>${esc(x.label)}<span>${pct(x.share)}</span></li>`).join("")}</ul>`;
    const otherList = d.slices.find((x) => x.family === "other");
    const pie = `<section class="mrp-sec"><h2>Where attention went</h2><div class="mrp-pie">${ringSvg(d.slices)}${legend}</div>${otherList ? `<p class="mrp-small">Other: ${otherList.families.map((f) => `${esc(f.label)} ${pct(f.share)}`).join(", ")}.</p>` : ""}</section>`;
    const max = Math.max(d.limit * 1.5, d.barometer.longest ? d.barometer.longest.seconds : 0);
    const baro = (label, b, line) =>
      b
        ? `<div class="mrp-baro-row"><div class="mrp-baro-h"><b>${label}</b> <span class="mrp-status mrp-s-${b.status.cls}">${b.status.icon} ${b.status.text}</span></div>${gaugeSvg(b.seconds, d.limit, max, b.status)}<div class="mrp-small">${line}</div></div>`
        : "";
    const barometer = `<section class="mrp-sec"><h2>The barometer</h2><p class="mrp-small">How long attention rests on one kind of curiosity before it moves, against the ${d.limit} second limit.</p>
      ${baro("At the end", d.barometer.now, d.barometer.now ? `${Math.round(d.barometer.now.seconds)} seconds on ${esc(d.barometer.now.label)}` : "")}
      ${baro("Longest hold", d.barometer.longest, d.barometer.longest ? `${Math.round(d.barometer.longest.seconds)} seconds on ${esc(d.barometer.longest.label)}, from ${clock(d.barometer.longest.from)}` : "")}</section>`;
    const curve = d.curve.points.length
      ? `<section class="mrp-sec mrp-wide"><h2>The momentum curve</h2>${curveSvg(d.curve)}<p class="mrp-small">How strongly the film feels like it is going somewhere, moment by moment, from 0 (stalled) to 5 (surging). It wears down while one kind of curiosity holds attention past the limit; under the dashed red line the film stalls.${d.curve.peaks.length ? " ▲ marks where it surges." : ""} The numbers at the top are the average in each third of the film.</p></section>`
      : "";
    const moves = d.moves.length
      ? `<section class="mrp-sec mrp-wide"><h2>How attention moves</h2><table class="mrp-table"><thead><tr><th>From</th><th>To</th><th>Times</th><th>Main cue</th><th>What took it</th></tr></thead><tbody>${d.moves
          .map((m) => `<tr><td><i class="mrp-key" style="background:${colorOf(m.from)}"></i>${esc(famLabel(m.from))}</td><td><i class="mrp-key" style="background:${colorOf(m.to)}"></i>${esc(famLabel(m.to))}</td><td>${m.n}</td><td>${esc(cueLabel(m.cue))} <small>${pct(m.cueShare)}</small>${m.quietShare >= 0.3 ? ` <small>(often a stop)</small>` : ""}</td><td>${esc(m.by.map((b) => b.label).join(", "))}</td></tr>`)
          .join("")}</tbody></table><p class="mrp-small">The ${d.moves.length === 1 ? "move" : plural(d.moves.length, "move")} from one kind of curiosity to another that happen most, of ${plural(n.moves, "move")} in all, and the cue that makes each one most often (visual, audio, thought, movement or plot).</p></section>`
      : "";
    const warns = `<section class="mrp-sec"><h2>Held too long</h2>${
      d.warnings.length
        ? `<ol class="mrp-warn">${d.warnings.map((w) => `<li><span class="mrp-status mrp-s-crit">■ Too long</span> ${esc(w.label)} held attention for ${Math.round(w.dur)} seconds from ${clock(w.from)}, ${Math.round(w.over)} seconds past the limit.</li>`).join("")}</ol>${n.warnings > d.warnings.length ? `<p class="mrp-small">The ${d.warnings.length} longest of ${n.warnings}.</p>` : ""}`
        : `<p><span class="mrp-status mrp-s-good">● Fresh</span> No kind of curiosity holds attention past the ${d.limit} second limit.</p>`
    }</section>`;
    const next = d.next
      ? `<section class="mrp-sec mrp-next"><h2>The next move</h2><p><span class="mrp-fam"><i style="background:${colorOf(d.next.family)}"></i><b>${esc(d.next.label)}</b></span>, with ${esc(aOrAn(cueLabel(d.next.cue).toLowerCase()))}.</p>${d.next.reasons.length ? `<ul class="mrp-reasons">${d.next.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}${d.next.tryLabel ? `<p class="mrp-small"><b>Try:</b> ${esc(d.next.tryLabel)}. ${esc(d.next.tryThis)}</p>` : ""}</section>`
      : "";
    return `<article class="mrp-sheet">${head}<p class="mrp-summary">${esc(summaryParagraph(d))}</p>${tiles}<div class="mrp-grid">${pie}${barometer}</div>${curve}${moves}<div class="mrp-grid">${warns}${next}</div>${footer(d)}</article>`;
  }
  function footer(d) {
    const c = d.compare;
    return `<footer class="mrp-foot">Made with Curiomatic's Momentum. The report counts what holds the audience's attention and for how long; it holds no notes and no script lines.${c && c.estimate ? " Films marked as estimates are Claude's estimates from general film knowledge, not measurements." : ""} Attention is worked out from how big each change is and how strongly its kind of curiosity draws the eye: a guess about how people watch, to check against your own eyes.</footer>`;
  }

  /* The sheet's look: the same rules in the tab, in print and in the downloaded file. Scoped under .mrp-sheet. */
  const REPORT_CSS = `.mrp-sheet{--ink:#1c1712;--ink2:#52514e;--line:#d9d6cc;color:#1c1712;background:#fffdf8;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.45;max-width:760px;margin:0 auto;padding:22px 24px;box-sizing:border-box;display:grid;gap:16px;color-scheme:light}
.mrp-sheet *{box-sizing:border-box}
.mrp-sheet h1{font-family:Georgia,"Times New Roman",serif;font-size:28px;line-height:1.15;margin:2px 0 4px;overflow-wrap:anywhere}
.mrp-sheet h2{font-size:15px;margin:0 0 8px}
.mrp-sheet p{margin:0}
.mrp-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#52514e}
.mrp-meta,.mrp-small,.mrp-sheet small{color:#52514e;font-size:12.5px}
.mrp-small{margin-top:6px}
.mrp-head{border-bottom:2px solid #1c1712;padding-bottom:10px}
.mrp-summary{font-size:15.5px;max-width:68ch}
.mrp-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.mrp-tile{border:1px solid #d9d6cc;padding:8px 10px;background:#fff}
.mrp-tile-v{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}
.mrp-tile-v small{font-size:13px;font-weight:400}
.mrp-tile-l{font-size:13px;font-weight:600}
.mrp-tile-s{font-size:12px;color:#52514e;margin-top:2px}
.mrp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.mrp-sec{min-width:0;break-inside:avoid;page-break-inside:avoid}
.mrp-pie{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.mrp-ring{flex:none;width:150px;height:150px}
.mrp-legend{list-style:none;margin:0;padding:0;display:grid;gap:3px;font-size:13px;min-width:150px;max-width:260px;flex:1}
.mrp-legend li{display:flex;align-items:center;gap:6px}
.mrp-fam{display:inline-flex;align-items:center;gap:6px}
.mrp-legend li span{margin-left:auto;padding-left:10px;font-variant-numeric:tabular-nums;color:#52514e}
.mrp-legend i,.mrp-fam i,.mrp-key{width:10px;height:10px;border-radius:2px;display:inline-block;flex:none}
.mrp-key{margin-right:6px}
.mrp-baro-row{display:grid;gap:2px;margin-top:10px;max-width:340px}
.mrp-baro-h{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px}
.mrp-gauge,.mrp-curve{display:block;width:100%;max-width:100%;height:auto}
.mrp-gauge{max-width:340px}.mrp-curve{max-width:760px}
.mrp-status{font-weight:600;font-size:13px;white-space:nowrap}
.mrp-s-good{color:#006300}.mrp-s-warn{color:#8a5a00}.mrp-s-crit{color:#b02a2a}
.mrp-table{width:100%;border-collapse:collapse;font-size:13px}
.mrp-table th,.mrp-table td{text-align:left;padding:4px 6px;border-bottom:1px solid #d9d6cc;vertical-align:top}
.mrp-table th{font-size:12px;color:#52514e}
.mrp-warn,.mrp-reasons{margin:0;padding-left:20px;display:grid;gap:6px}
.mrp-next{border-left:4px solid #2a78d6;padding-left:12px}
.mrp-next>p{margin-bottom:6px}
.mrp-foot{border-top:1px solid #d9d6cc;padding-top:8px;font-size:11.5px;color:#52514e}
@media (max-width:520px){.mrp-sheet{padding:14px 12px}.mrp-sheet h1{font-size:23px}.mrp-table th:nth-child(5),.mrp-table td:nth-child(5){display:none}}
@media print{.mrp-sheet{max-width:none;padding:0;background:#fff}.mrp-tile{background:#fff}}`;

  function reportHtml(reading, profiles, opts) {
    const d = build(reading, profiles, opts);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)}: momentum report</title>
<style>
html,body{margin:0;background:#f4f1ea}
body{padding:16px 0}
@media print{html,body{background:#fff}body{padding:0}}
@page{margin:14mm}
${REPORT_CSS}
</style>
</head>
<body>
${sheetHtml(d)}
</body>
</html>
`;
  }

  function fileName(title) {
    const slug = String(title || "film")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return (slug || "film") + "-momentum-report.html";
  }

  /* ---------------------------------------------------------------- the tab (browser only) */
  /* A film's name from the picker's label, without the picker's notes in brackets. */
  function titleOf(label) {
    return String(label || "My film")
      .replace(/^Model scene:\s*/i, "")
      .replace(/\s*\((follows what you play or perform|\d+ (moments|panels|scenes)|made-up practice scene)\)\s*$/i, "")
      .trim();
  }
  function ensureStyle() {
    if (typeof document === "undefined" || document.getElementById("mrp-style")) return;
    const st = document.createElement("style");
    st.id = "mrp-style";
    st.textContent = REPORT_CSS;
    document.head.appendChild(st);
  }
  let last = null;
  function mountTab(el, ctx) {
    ensureStyle();
    const sources = ctx.sources();
    let src = ctx.source();
    if (!sources.some((s) => s.id === src)) src = (sources.find((s) => s.id.startsWith("study:")) || sources[0] || { id: "" }).id;
    const label = (sources.find((s) => s.id === src) || {}).label;
    const profiles = ctx.profiles();
    const reading = ctx.readSource(src);
    const opts = { title: titleOf(label), beats: ctx.beatsOf(src), secondsPerBeat: ctx.secondsPerBeat(), made: dateText() };
    const d = build(reading, profiles, opts);
    last = { reading, profiles, opts, data: d };
    const picker = ctx.sourcePicker("data-rp-source").replace(/<option value="([^"]*)"( selected)?>/g, (m0, v) => `<option value="${v}"${v === src ? " selected" : ""}>`);
    el.innerHTML = `<div class="mrp">
      <p class="mrp-lede">One page about one film, to show other people: what holds attention, for how long, what moves it on, and where to move it next. It holds counts only, never notes or script lines. The films it compares with are the ones picked in Attention (Compare with).</p>
      <div class="mo-controls mrp-bar">
        <label>Film ${picker}</label>
        <button type="button" data-rp="print">Print or save as PDF</button>
        <button type="button" data-rp="download">Download as a web page</button>
        <button type="button" data-rp="copy">Copy the summary</button>
      </div>
      <div class="mrp-said mo-flash" role="status" hidden></div>
      <div class="mrp-paper">${sheetHtml(d)}</div>
    </div>`;
    const pick = el.querySelector("[data-rp-source]");
    if (pick)
      pick.addEventListener("change", () => {
        ctx.setSource(pick.value);
        ctx.refresh();
      });
    el.querySelectorAll("[data-rp]").forEach((b) => b.addEventListener("click", () => act(b.dataset.rp, el)));
  }
  function dateText() {
    try {
      return "made " + new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return "";
    }
  }
  function say(el, text) {
    const f = el.querySelector(".mrp-said");
    if (!f) return;
    f.textContent = text;
    f.hidden = false;
  }
  function act(what, el) {
    if (!last) return;
    if (what === "print") return printSheet(el);
    if (what === "download") {
      const html = reportHtml(last.reading, last.profiles, last.opts);
      const name = fileName(last.data.title);
      try {
        const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        say(el, `Saved ${name}. It opens in any web browser, with no internet needed.`);
      } catch (e) {
        say(el, "The download did not start: " + e.message);
      }
      return;
    }
    if (what === "copy") return copyText(summaryText(last.data), el);
  }
  function copyText(text, el) {
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      (el.closest("dialog") || document.body).appendChild(ta);
      ta.select();
      let done = false;
      try {
        done = document.execCommand("copy");
      } catch (e) {}
      ta.remove();
      if (done) return say(el, "Copied the summary. Paste it into an email or a message.");
      /* Last resort: show the text, selected, to copy by hand. */
      say(el, "This browser would not copy on its own. The summary is below, selected: copy it with your keyboard or a long press.");
      const box = document.createElement("textarea");
      box.className = "mrp-copybox";
      box.value = text;
      box.rows = 8;
      el.querySelector(".mrp-said").after(box);
      box.focus();
      box.select();
    };
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(() => say(el, "Copied the summary. Paste it into an email or a message."), fallback);
    else fallback();
  }
  /* Print only the report: a copy of the sheet goes straight under <body>, and while html has the class
     mrp-printing the print stylesheet (momentum.css) hides everything else. Printing anything else in the app
     is untouched, because the rules apply only while that class is on. */
  function printSheet(el) {
    const sheet = el.querySelector(".mrp-sheet");
    if (!sheet) return;
    document.querySelectorAll(".mrp-print-copy").forEach((n) => n.remove());
    const copy = document.createElement("div");
    copy.className = "mrp-print-copy";
    copy.appendChild(sheet.cloneNode(true));
    document.body.appendChild(copy);
    document.documentElement.classList.add("mrp-printing");
    const done = () => {
      document.documentElement.classList.remove("mrp-printing");
      copy.remove();
      root.removeEventListener("afterprint", done);
    };
    root.addEventListener("afterprint", done);
    say(el, "Opening the print window. To save a PDF, pick Save as PDF as the printer.");
    try {
      root.print();
    } catch (e) {
      done();
    }
  }

  function addTab() {
    const U = root.CurioMomentumUI;
    if (!U || typeof U.addTab !== "function") return false;
    return U.addTab({ id: "report", label: "Report", after: "end", mount: mountTab });
  }

  const api = { build, sheetHtml, reportHtml, summaryText, summaryParagraph, fileName, titleOf, topMoves, REPORT_CSS, addTab };
  root.CurioMomentumReport = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined" && root.CurioMomentumUI) addTab();
})();
